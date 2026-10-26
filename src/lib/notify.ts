import { CAN_RECEIVE_FROM, type BloodGroup } from "./blood";
import { User } from "@/models/User";
import { Notification } from "@/models/Notification";
import type { RequestDoc } from "@/models/BloodRequest";

const ALERT_RADIUS_KM: Record<string, number> = { critical: 40, high: 25, normal: 15 };

/** Alert nearby compatible, available donors about a new request. Returns how many were notified. */
export async function notifyNearbyDonors(request: RequestDoc) {
  const radius = ALERT_RADIUS_KM[request.urgency] ?? 15;
  const donors = await User.find({
    _id: { $ne: request.requester },
    isDonor: true,
    available: true,
    bloodGroup: { $in: CAN_RECEIVE_FROM[request.bloodGroup as BloodGroup] },
    location: {
      $nearSphere: {
        $geometry: { type: "Point", coordinates: request.location.coordinates },
        $maxDistance: radius * 1000,
      },
    },
  })
    .select("_id")
    .limit(250)
    .lean();

  if (!donors.length) return 0;

  const emoji = request.urgency === "critical" ? "🚨" : request.urgency === "high" ? "⚠️" : "🩸";
  await Notification.insertMany(
    donors.map((d) => ({
      user: d._id,
      type: "request_nearby",
      urgency: request.urgency,
      title: `${emoji} ${request.bloodGroup} needed near you`,
      body: `${request.units} unit(s) for ${request.patientName} at ${request.hospital}.`,
      link: `/requests/${request._id}`,
    })),
  );
  return donors.length;
}

export async function notify(
  userId: unknown,
  data: { type: string; title: string; body?: string; link?: string; urgency?: string },
) {
  await Notification.create({ user: userId, ...data });
}
