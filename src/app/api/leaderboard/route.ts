import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { handler } from "@/lib/auth";
import { User } from "@/models/User";

export const GET = handler(async (req: Request) => {
  const url = new URL(req.url);
  const city = url.searchParams.get("city");
  await connectDB();

  const filter: Record<string, unknown> = { isDonor: true, donationsCount: { $gt: 0 } };
  if (city) filter.city = new RegExp(`^${city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");

  const docs = await User.find(filter)
    .sort({ donationsCount: -1, lastDonation: -1 })
    .limit(50)
    .select("name bloodGroup city donationsCount livesImpacted lastDonation createdAt")
    .lean();

  return NextResponse.json({
    heroes: docs.map((u, i) => ({
      rank: i + 1,
      id: String(u._id),
      name: u.name,
      bloodGroup: u.bloodGroup,
      city: u.city,
      donationsCount: u.donationsCount,
      livesImpacted: u.livesImpacted,
      lastDonation: u.lastDonation ? new Date(u.lastDonation).toISOString() : null,
    })),
  });
});
