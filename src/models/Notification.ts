import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["request_nearby", "response", "fulfilled", "cancelled", "thanks", "system"], required: true },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    link: { type: String, default: "" },
    urgency: { type: String, default: "normal" },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

notificationSchema.index({ user: 1, createdAt: -1 });

export type NotificationShape = InferSchemaType<typeof notificationSchema>;
export const Notification: Model<NotificationShape> =
  (mongoose.models.Notification as Model<NotificationShape>) ||
  mongoose.model<NotificationShape>("Notification", notificationSchema);
