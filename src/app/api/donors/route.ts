import { NextResponse } from "next/server";
import { Types, type PipelineStage } from "mongoose";
import { connectDB } from "@/lib/db";
import { getSessionUserId, handler } from "@/lib/auth";
import { BLOOD_GROUPS, CAN_RECEIVE_FROM, DONATION_INTERVAL_DAYS, type BloodGroup } from "@/lib/blood";
import { parseCenter, parseRadiusKm } from "@/lib/geo";
import { User, serializeUser, type UserShape } from "@/models/User";

/**
 * GET /api/donors?lat=&lng=&radius=km&bloodGroup=A%2B&compatible=1&eligibleOnly=1&limit=
 * Returns donors sorted by distance. With `compatible=1`, `bloodGroup` is treated as
 * the recipient's group and every compatible donor group is included.
 */
export const GET = handler(async (req: Request) => {
  const url = new URL(req.url);
  const center = parseCenter(url);
  const radiusKm = parseRadiusKm(url);
  const group = url.searchParams.get("bloodGroup") as BloodGroup | null;
  const compatible = url.searchParams.get("compatible") === "1";
  const eligibleOnly = url.searchParams.get("eligibleOnly") === "1";
  const includeUnavailable = url.searchParams.get("includeUnavailable") === "1";
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 100) || 100, 300);

  await connectDB();
  const viewerId = await getSessionUserId();

  const query: Record<string, unknown> = { isDonor: true };
  if (!includeUnavailable) query.available = true;
  if (group && BLOOD_GROUPS.includes(group)) {
    query.bloodGroup = compatible ? { $in: CAN_RECEIVE_FROM[group] } : group;
  }
  if (eligibleOnly) {
    const cutoff = new Date(Date.now() - DONATION_INTERVAL_DAYS * 86_400_000);
    query.$or = [{ lastDonation: null }, { lastDonation: { $lte: cutoff } }];
  }
  if (viewerId) query._id = { $ne: new Types.ObjectId(viewerId) };

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
    { $limit: limit },
  ];

  const docs = await User.aggregate<UserShape & { _id: Types.ObjectId; distance: number }>(pipeline);

  const donors = docs.map((d) => ({
    ...serializeUser(d, !!viewerId),
    distanceKm: d.distance / 1000,
  }));

  const byGroup = BLOOD_GROUPS.map((g) => ({ group: g, count: donors.filter((d) => d.bloodGroup === g).length }));

  return NextResponse.json({ donors, total: donors.length, byGroup, radiusKm, authenticated: !!viewerId });
});
