import { NextResponse } from "next/server";
import { Types, type PipelineStage } from "mongoose";
import { connectDB } from "@/lib/db";
import { getSessionUserId, handler, requireUser } from "@/lib/auth";
import { BLOOD_GROUPS, CAN_DONATE_TO, type BloodGroup } from "@/lib/blood";
import { parseCenter, parseRadiusKm } from "@/lib/geo";
import { requestSchema } from "@/lib/validators";
import { notifyNearbyDonors } from "@/lib/notify";
import { REQUEST_POPULATE as POPULATE } from "@/lib/requests";
import { BloodRequest, serializeRequest, type RequestShape } from "@/models/BloodRequest";


/**
 * GET /api/requests
 *   scope=nearby (default) — needs lat/lng, optional radius, bloodGroup, canHelp=1 (only groups I can donate to)
 *   scope=mine             — requests I created
 *   scope=responded        — requests I've offered to help with
 */
export const GET = handler(async (req: Request) => {
  const url = new URL(req.url);
  const scope = url.searchParams.get("scope") ?? "nearby";
  const status = url.searchParams.get("status") ?? "open";
  await connectDB();
  const viewerId = await getSessionUserId();

  if (scope === "mine" || scope === "responded") {
    const user = await requireUser();
    const filter: Record<string, unknown> =
      scope === "mine"
        ? { requester: user._id }
        : { responders: { $elemMatch: { user: user._id, status: { $ne: "withdrawn" } } } };
    if (status !== "all") filter.status = status;
    const docs = await BloodRequest.find(filter).sort({ createdAt: -1 }).limit(100).populate(POPULATE).lean();
    return NextResponse.json({ requests: docs.map((d) => serializeRequest(d, viewerId)) });
  }

  const center = parseCenter(url);
  const radiusKm = parseRadiusKm(url, 50);
  const query: Record<string, unknown> = {};
  if (status !== "all") query.status = status;

  const group = url.searchParams.get("bloodGroup") as BloodGroup | null;
  if (group && BLOOD_GROUPS.includes(group)) {
    query.bloodGroup = url.searchParams.get("canHelp") === "1" ? { $in: CAN_DONATE_TO[group] } : group;
  }
  const urgency = url.searchParams.get("urgency");
  if (urgency) query.urgency = urgency;

  const pipeline: PipelineStage[] = [
    {
      $geoNear: {
        near: { type: "Point", coordinates: center },
        distanceField: "distance",
        maxDistance: radiusKm * 1000,
        spherical: true,
        query,
      },
    },
    { $limit: 150 },
  ];
  const raw = await BloodRequest.aggregate<RequestShape & { _id: Types.ObjectId; distance: number }>(pipeline);
  const docs = await BloodRequest.populate(raw, POPULATE);

  const urgencyRank: Record<string, number> = { critical: 0, high: 1, normal: 2 };
  const requests = docs
    .map((d) => ({ ...serializeRequest(d, viewerId), distanceKm: d.distance / 1000 }))
    .sort((a, b) => urgencyRank[a.urgency]! - urgencyRank[b.urgency]! || a.distanceKm - b.distanceKm);

  return NextResponse.json({ requests });
});

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  const data = requestSchema.parse(await req.json());

  const request = await BloodRequest.create({
    ...data,
    neededBy: new Date(data.neededBy),
    requester: user._id,
    location: { type: "Point", coordinates: data.coordinates },
  });

  request.notifiedCount = await notifyNearbyDonors(request);
  await request.save();
  await request.populate(POPULATE);

  return NextResponse.json({ request: serializeRequest(request.toObject(), String(user._id)) }, { status: 201 });
});
