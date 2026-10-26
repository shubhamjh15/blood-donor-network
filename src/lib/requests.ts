import { isValidObjectId } from "mongoose";
import { connectDB } from "./db";
import { HttpError } from "./auth";
import { BloodRequest } from "@/models/BloodRequest";

export const REQUEST_POPULATE = [
  { path: "requester", select: "name" },
  { path: "responders.user", select: "name phone bloodGroup city" },
];

export async function loadRequest(id: string) {
  if (!isValidObjectId(id)) throw new HttpError(404, "Request not found");
  await connectDB();
  const doc = await BloodRequest.findById(id);
  if (!doc) throw new HttpError(404, "Request not found");
  return doc;
}
