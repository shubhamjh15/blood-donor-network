import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId, handler, HttpError, requireUser } from "@/lib/auth";
import { loadRequest, REQUEST_POPULATE as POPULATE } from "@/lib/requests";
import { notify } from "@/lib/notify";
import { serializeRequest } from "@/models/BloodRequest";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler(async (_req: Request, { params }: Ctx) => {
  const { id } = await params;
  const doc = await loadRequest(id);
  await doc.populate(POPULATE);
  const viewerId = await getSessionUserId();
  return NextResponse.json({ request: serializeRequest(doc.toObject(), viewerId) });
});

const patchSchema = z.object({ status: z.enum(["open", "fulfilled", "cancelled"]) });

export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const user = await requireUser();
  const doc = await loadRequest(id);
  if (String(doc.requester) !== String(user._id)) throw new HttpError(403, "Only the requester can update this");

  const { status } = patchSchema.parse(await req.json());
  doc.status = status;
  await doc.save();

  if (status !== "open") {
    const active = doc.responders.filter((r) => r.status === "accepted");
    await Promise.all(
      active.map((r) =>
        notify(r.user, {
          type: status,
          title: status === "fulfilled" ? `🎉 ${doc.patientName}'s request was fulfilled` : `Request for ${doc.patientName} was cancelled`,
          body: status === "fulfilled" ? "Thank you for stepping up — you're a hero." : "No further action needed. Thanks for offering to help!",
          link: `/requests/${doc._id}`,
        }),
      ),
    );
  }

  await doc.populate(POPULATE);
  return NextResponse.json({ request: serializeRequest(doc.toObject(), String(user._id)) });
});
