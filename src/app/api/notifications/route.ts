import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId, handler, requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Notification } from "@/models/Notification";

export const GET = handler(async () => {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ notifications: [], unread: 0 });
  await connectDB();
  const [docs, unread] = await Promise.all([
    Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(30).lean(),
    Notification.countDocuments({ user: userId, read: false }),
  ]);
  return NextResponse.json({
    unread,
    notifications: docs.map((n) => ({
      id: String(n._id),
      type: n.type,
      title: n.title,
      body: n.body,
      link: n.link,
      urgency: n.urgency,
      read: n.read,
      createdAt: new Date((n as { createdAt: Date }).createdAt).toISOString(),
    })),
  });
});

const patchSchema = z.object({ ids: z.array(z.string()).optional(), all: z.boolean().optional() });

export const PATCH = handler(async (req: Request) => {
  const user = await requireUser();
  const { ids, all } = patchSchema.parse(await req.json());
  const filter = all ? { user: user._id } : { user: user._id, _id: { $in: ids ?? [] } };
  await Notification.updateMany(filter, { $set: { read: true } });
  return NextResponse.json({ ok: true });
});
