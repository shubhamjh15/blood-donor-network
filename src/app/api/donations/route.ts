import { NextResponse } from "next/server";
import { handler, HttpError, requireUser } from "@/lib/auth";
import { donationSchema } from "@/lib/validators";
import { Donation } from "@/models/Donation";
import { serializeUser } from "@/models/User";

// Shortest gap between self-reported donations (the tightest guideline worldwide)
const MIN_GAP_DAYS = 56;

export const GET = handler(async () => {
  const user = await requireUser();
  const docs = await Donation.find({ user: user._id }).sort({ date: -1 }).limit(100).lean();
  return NextResponse.json({
    donations: docs.map((d) => ({
      id: String(d._id),
      date: new Date(d.date).toISOString(),
      hospital: d.hospital,
      units: d.units,
      requestId: d.request ? String(d.request) : null,
    })),
  });
});

/** Self-report a donation (e.g. at a blood drive). */
export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  const data = donationSchema.parse(await req.json());
  const date = new Date(data.date);
  if (date.getTime() > Date.now() + 60_000) throw new HttpError(400, "Donation date can't be in the future");

  const isLatest = !user.lastDonation || date > user.lastDonation;
  if (user.lastDonation) {
    const gapDays = Math.abs(date.getTime() - user.lastDonation.getTime()) / 86_400_000;
    if (gapDays < MIN_GAP_DAYS) throw new HttpError(400, "That's too close to another logged donation");
  }

  await Donation.create({ user: user._id, date, hospital: data.hospital, units: data.units });
  user.donationsCount += 1;
  user.livesImpacted += 3;
  if (isLatest) user.lastDonation = date;
  await user.save();

  return NextResponse.json({ user: serializeUser(user.toObject(), true) }, { status: 201 });
});
