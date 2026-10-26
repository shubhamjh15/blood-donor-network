import { NextResponse } from "next/server";
import { z } from "zod";
import { handler, HttpError, requireUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { serializeRequest } from "@/models/BloodRequest";
import { Donation } from "@/models/Donation";
import { User } from "@/models/User";
import { loadRequest, REQUEST_POPULATE as POPULATE } from "@/lib/requests";

type Ctx = { params: Promise<{ id: string }> };
const bodySchema = z.object({ userId: z.string().min(1) });

/** Requester confirms that a responder actually donated. Logs the donation for the donor. */
export const POST = handler(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const owner = await requireUser();
  const doc = await loadRequest(id);
  if (String(doc.requester) !== String(owner._id)) throw new HttpError(403, "Only the requester can confirm donations");

  const { userId } = bodySchema.parse(await req.json());
  const responder = doc.responders.find((r) => String(r.user) === userId);
  if (!responder || responder.status !== "accepted") throw new HttpError(400, "This donor has no active offer");

  responder.status = "donated";
  doc.unitsFulfilled = (doc.unitsFulfilled ?? 0) + 1;
  const nowFulfilled = doc.unitsFulfilled >= doc.units;
  if (nowFulfilled) doc.status = "fulfilled";
  await doc.save();

  const now = new Date();
  await Donation.create({ user: userId, request: doc._id, date: now, hospital: doc.hospital, units: 1 });
  await User.updateOne(
    { _id: userId },
    { $set: { lastDonation: now }, $inc: { donationsCount: 1, livesImpacted: 3 } },
  );

  await notify(userId, {
    type: "thanks",
    title: `❤️ ${owner.name} confirmed your donation`,
    body: `You helped ${doc.patientName} at ${doc.hospital}. One donation can save up to 3 lives.`,
    link: `/requests/${doc._id}`,
  });

  if (nowFulfilled) {
    const others = doc.responders.filter((r) => r.status === "accepted");
    await Promise.all(
      others.map((r) =>
        notify(r.user, {
          type: "fulfilled",
          title: `🎉 ${doc.patientName}'s request is fully covered`,
          body: "Thanks for offering — no further action needed.",
          link: `/requests/${doc._id}`,
        }),
      ),
    );
  }

  await doc.populate(POPULATE);
  return NextResponse.json({ request: serializeRequest(doc.toObject(), String(owner._id)) });
});
