import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { handler, HttpError, setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import { User, serializeUser } from "@/models/User";

export const POST = handler(async (req: Request) => {
  const { email, password } = loginSchema.parse(await req.json());
  await connectDB();

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, "Invalid email or password");
  }
  user.lastActiveAt = new Date();
  await user.save();

  const res = NextResponse.json({ user: serializeUser(user.toObject(), true) });
  return setSessionCookie(res, user);
});
