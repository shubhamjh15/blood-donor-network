import { NextResponse } from "next/server";
import { getCurrentUser, handler, requireUser } from "@/lib/auth";
import { profileSchema } from "@/lib/validators";
import { serializeUser } from "@/models/User";

export const GET = handler(async () => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null });
  user.lastActiveAt = new Date();
  await user.save();
  return NextResponse.json({ user: serializeUser(user.toObject(), true) });
});

export const PATCH = handler(async (req: Request) => {
  const user = await requireUser();
  const data = profileSchema.parse(await req.json());

  const { coordinates, ...rest } = data;
  Object.assign(user, rest);
  if (coordinates) user.location = { type: "Point", coordinates };
  user.lastActiveAt = new Date();
  await user.save();

  return NextResponse.json({ user: serializeUser(user.toObject(), true) });
});
