import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const donationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    request: { type: Schema.Types.ObjectId, ref: "BloodRequest", default: null },
    date: { type: Date, required: true },
    hospital: { type: String, required: true },
    units: { type: Number, default: 1 },
  },
  { timestamps: true },
);

export type DonationShape = InferSchemaType<typeof donationSchema>;
export const Donation: Model<DonationShape> =
  (mongoose.models.Donation as Model<DonationShape>) || mongoose.model<DonationShape>("Donation", donationSchema);
