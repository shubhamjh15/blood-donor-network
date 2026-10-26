import mongoose, { Schema, Types, type HydratedDocument, type InferSchemaType, type Model } from "mongoose";
import { BLOOD_GROUPS, URGENCY } from "@/lib/blood";

const responderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["accepted", "donated", "withdrawn"], default: "accepted" },
    message: { type: String, default: "" },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const requestSchema = new Schema(
  {
    requester: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    patientName: { type: String, required: true },
    bloodGroup: { type: String, enum: BLOOD_GROUPS, required: true, index: true },
    units: { type: Number, required: true, min: 1 },
    unitsFulfilled: { type: Number, default: 0 },
    hospital: { type: String, required: true },
    address: { type: String, default: "" },
    contactPhone: { type: String, required: true },
    urgency: { type: String, enum: URGENCY, default: "normal", index: true },
    neededBy: { type: Date, required: true },
    note: { type: String, default: "" },
    status: { type: String, enum: ["open", "fulfilled", "cancelled"], default: "open", index: true },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true },
    },
    responders: { type: [responderSchema], default: [] },
    notifiedCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

requestSchema.index({ location: "2dsphere" });

export type RequestShape = InferSchemaType<typeof requestSchema>;
export type RequestDoc = HydratedDocument<RequestShape>;

export const BloodRequest: Model<RequestShape> =
  (mongoose.models.BloodRequest as Model<RequestShape>) ||
  mongoose.model<RequestShape>("BloodRequest", requestSchema);

type PopulatedUser = { _id: Types.ObjectId; name: string; phone?: string; bloodGroup?: string; city?: string };

export function serializeRequest(r: RequestShape & { _id: unknown; createdAt?: Date }, viewerId?: string | null) {
  const requester = r.requester as unknown as PopulatedUser | Types.ObjectId;
  const requesterId = requester && "name" in requester ? String(requester._id) : String(requester);
  const isOwner = !!viewerId && viewerId === requesterId;
  const responders = (r.responders ?? []).map((x) => {
    const u = x.user as unknown as PopulatedUser | Types.ObjectId;
    const populated = u && "name" in u;
    const uid = populated ? String(u._id) : String(u);
    return {
      userId: uid,
      name: populated ? u.name : undefined,
      bloodGroup: populated ? u.bloodGroup : undefined,
      city: populated ? u.city : undefined,
      // Only the request owner (or the responder themselves) sees the phone
      phone: populated && (isOwner || uid === viewerId) ? u.phone : undefined,
      status: x.status,
      message: x.message,
      at: new Date(x.at).toISOString(),
    };
  });
  return {
    id: String(r._id),
    requester: {
      id: requesterId,
      name: requester && "name" in requester ? requester.name : undefined,
    },
    isOwner,
    patientName: r.patientName,
    bloodGroup: r.bloodGroup,
    units: r.units,
    unitsFulfilled: r.unitsFulfilled,
    hospital: r.hospital,
    address: r.address,
    contactPhone: viewerId ? r.contactPhone : undefined,
    urgency: r.urgency,
    neededBy: new Date(r.neededBy).toISOString(),
    note: r.note,
    status: r.status,
    coordinates: r.location!.coordinates as [number, number],
    responders,
    responderCount: responders.filter((x) => x.status !== "withdrawn").length,
    hasResponded: !!viewerId && responders.some((x) => x.userId === viewerId && x.status !== "withdrawn"),
    notifiedCount: r.notifiedCount,
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
  };
}
export type PublicRequest = ReturnType<typeof serializeRequest> & { distanceKm?: number };
