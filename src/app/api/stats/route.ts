import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { handler } from "@/lib/auth";
import { BLOOD_GROUPS } from "@/lib/blood";
import { User } from "@/models/User";
import { BloodRequest } from "@/models/BloodRequest";
import { Donation } from "@/models/Donation";

export const dynamic = "force-dynamic";

/** Public platform-wide stats for the landing page. */
export const GET = handler(async () => {
  await connectDB();
  const since = new Date(Date.now() - 30 * 86_400_000);

  const [donors, available, openRequests, fulfilled, donations, byGroupRaw, cities, recent, daily, activity] = await Promise.all([
    User.countDocuments({ isDonor: true }),
    User.countDocuments({ isDonor: true, available: true }),
    BloodRequest.countDocuments({ status: "open" }),
    BloodRequest.countDocuments({ status: "fulfilled" }),
    Donation.countDocuments(),
    User.aggregate<{ _id: string; count: number }>([
      { $match: { isDonor: true } },
      { $group: { _id: "$bloodGroup", count: { $sum: 1 } } },
    ]),
    User.distinct("city", { city: { $ne: "" } }),
    User.find({ isDonor: true }).select("location bloodGroup").sort({ lastActiveAt: -1 }).limit(400).lean(),
    Donation.aggregate<{ _id: string; count: number }>([
      { $match: { date: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    BloodRequest.find({}).sort({ createdAt: -1 }).limit(14).select("bloodGroup hospital urgency status units createdAt").lean(),
  ]);

  const byGroup = BLOOD_GROUPS.map((g) => ({ group: g, count: byGroupRaw.find((x) => x._id === g)?.count ?? 0 }));
  const donorPoints = recent.map((u) => ({ c: u.location.coordinates as [number, number], g: u.bloodGroup }));

  return NextResponse.json({
    donors,
    available,
    openRequests,
    fulfilled,
    donations,
    livesImpacted: donations * 3,
    cities: cities.length,
    byGroup,
    donorPoints,
    daily: daily.map((d) => ({ date: d._id, count: d.count })),
    activity: activity.map((a) => ({
      id: String(a._id),
      bloodGroup: a.bloodGroup,
      hospital: a.hospital,
      urgency: a.urgency,
      status: a.status,
      units: a.units,
      createdAt: new Date((a as { createdAt: Date }).createdAt).toISOString(),
    })),
  });
});
