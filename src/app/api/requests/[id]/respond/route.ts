import { NextResponse } from "next/server";
import { z } from "zod";
import { handler, HttpError, requireUser } from "@/lib/auth";
import { CAN_RECEIVE_FROM, daysUntilEligible, type BloodGroup } from "@/lib/blood";
import { notify } from "@/lib/notify";
import { serializeRequest } from "@/models/BloodRequest";
import { loadRequest, REQUEST_POPULATE as POPULATE } from "@/lib/requests";

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.object({ message: z.string().trim().max(280).optional().default("") });

/** Offer to donate for a request. */
export const POST = handler(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const user = await requireUser();
  const doc = await loadRequest(id);
  const { message } = bodySchema.parse(await req.json().catch(() => ({})));

  if (doc.status !== "open") throw new HttpError(400, "This request is no longer open");
  if (String(doc.requester) === String(user._id)) throw new HttpError(400, "You can't respond to your own request");
  if (!CAN_RECEIVE_FROM[doc.bloodGroup as BloodGroup].includes(user.bloodGroup as BloodGroup)) {
    throw new HttpError(400, `${user.bloodGroup} isn't compatible with ${doc.bloodGroup}`);
  }
  const wait = daysUntilEligible(user.lastDonation);
  if (wait > 0) throw new HttpError(400, `You'll be eligible to donate again in ${wait} day(s)`);

  const existing = doc.responders.find((r) => String(r.user) === String(user._id));
  if (existing) {
    if (existing.status !== "withdrawn") throw new HttpError(400, "You've already responded");
    existing.status = "accepted";
    existing.message = message;
    existing.at = new Date();
  } else {
    doc.responders.push({ user: user._id, status: "accepted", message, at: new Date() });
  }
  await doc.save();

  await notify(doc.requester, {
    type: "response",
    urgency: doc.urgency,
    title: `💪 ${user.name} (${user.bloodGroup}) can donate`,
    body: message || `They're ready to help ${doc.patientName}. Reach out to coordinate.`,
    link: `/requests/${doc._id}`,
  });

  await doc.populate(POPULATE);
  return NextResponse.json({ request: serializeRequest(doc.toObject(), String(user._id)) });
});

/** Withdraw an offer. */
export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  const { id } = await params;
  const user = await requireUser();
  const doc = await loadRequest(id);

  const existing = doc.responders.find((r) => String(r.user) === String(user._id));
  if (!existing || existing.status !== "accepted") throw new HttpError(400, "No active response to withdraw");
  existing.status = "withdrawn";
  await doc.save();

  await notify(doc.requester, {
    type: "response",
    title: `${user.name} withdrew their offer`,
    body: `For ${doc.patientName} at ${doc.hospital}.`,
    link: `/requests/${doc._id}`,
  });

  await doc.populate(POPULATE);
  return NextResponse.json({ request: serializeRequest(doc.toObject(), String(user._id)) });
});
