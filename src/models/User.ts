import mongoose, { Schema, type HydratedDocument, type InferSchemaType, type Model } from "mongoose";
import { BLOOD_GROUPS } from "@/lib/blood";

const pointSchema = new Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    phone: { type: String, required: true },
    bloodGroup: { type: String, enum: BLOOD_GROUPS, required: true, index: true },
    isDonor: { type: Boolean, default: true },
    available: { type: Boolean, default: true },
    city: { type: String, default: "" },
    bio: { type: String, default: "" },
    location: { type: pointSchema, required: true },
    lastDonation: { type: Date, default: null },
    donationsCount: { type: Number, default: 0 },
    livesImpacted: { type: Number, default: 0 },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

userSchema.index({ location: "2dsphere" });

export type UserShape = InferSchemaType<typeof userSchema>;
export type UserDoc = HydratedDocument<UserShape>;

export const User: Model<UserShape> =
  (mongoose.models.User as Model<UserShape>) || mongoose.model<UserShape>("User", userSchema);

/** Public-safe serialisation. Phone is only included when `withContact` is true. */
export function serializeUser(u: UserShape & { _id: unknown }, withContact = false) {
  return {
    id: String(u._id),
    name: u.name,
    email: withContact ? u.email : undefined,
    phone: withContact ? u.phone : undefined,
    bloodGroup: u.bloodGroup,
    isDonor: u.isDonor,
    available: u.available,
    city: u.city,
    bio: u.bio,
    coordinates: u.location?.coordinates as [number, number],
    lastDonation: u.lastDonation ? new Date(u.lastDonation).toISOString() : null,
    donationsCount: u.donationsCount,
    livesImpacted: u.livesImpacted,
    lastActiveAt: u.lastActiveAt ? new Date(u.lastActiveAt).toISOString() : null,
    createdAt: (u as { createdAt?: Date }).createdAt?.toISOString?.() ?? null,
  };
}
export type PublicUser = ReturnType<typeof serializeUser> & { distanceKm?: number };
