import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { handler, HttpError, setSessionCookie } from "@/lib/auth";
import { registerSchema } from "@/lib/validators";
import { User, serializeUser } from "@/models/User";
import { Notification } from "@/models/Notification";

export const POST = handler(async (req: Request) => {
  const data = registerSchema.parse(await req.json());
  await connectDB();

  if (await User.exists({ email: data.email })) {
    throw new HttpError(409, "An account with this email already exists");
  }

  const user = await User.create({
    name: data.name,
    email: data.email,
    passwordHash: await bcrypt.hash(data.password, 10),
    phone: data.phone,
    bloodGroup: data.bloodGroup,
    isDonor: data.isDonor,
    city: data.city,
    location: { type: "Point", coordinates: data.coordinates },
    lastDonation: data.lastDonation ? new Date(data.lastDonation) : null,
  });

  await Notification.create({
    user: user._id,
    type: "system",
    title: `Welcome to Bloodline, ${user.name.split(" ")[0]}! 🩸`,
    body: data.isDonor
      ? "You're now visible to people nearby who need your blood type. Keep your availability updated."
      : "You can post blood requests and find compatible donors around you.",
    link: "/dashboard",
  });

  const res = NextResponse.json({ user: serializeUser(user.toObject(), true) }, { status: 201 });
  return setSessionCookie(res, user);
});
