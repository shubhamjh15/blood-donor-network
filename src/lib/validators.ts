import { z } from "zod";
import { BLOOD_GROUPS, URGENCY } from "./blood";

const coords = z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]);

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6).max(100),
  phone: z.string().trim().min(7).max(20),
  bloodGroup: z.enum(BLOOD_GROUPS),
  isDonor: z.boolean().default(true),
  city: z.string().trim().max(80).optional().default(""),
  coordinates: coords,
  lastDonation: z.string().datetime().nullable().optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  phone: z.string().trim().min(7).max(20).optional(),
  bloodGroup: z.enum(BLOOD_GROUPS).optional(),
  isDonor: z.boolean().optional(),
  available: z.boolean().optional(),
  city: z.string().trim().max(80).optional(),
  bio: z.string().trim().max(280).optional(),
  coordinates: coords.optional(),
});

export const requestSchema = z.object({
  patientName: z.string().trim().min(2).max(60),
  bloodGroup: z.enum(BLOOD_GROUPS),
  units: z.number().int().min(1).max(20),
  hospital: z.string().trim().min(2).max(120),
  address: z.string().trim().max(200).optional().default(""),
  contactPhone: z.string().trim().min(7).max(20),
  urgency: z.enum(URGENCY),
  neededBy: z.string().datetime(),
  note: z.string().trim().max(500).optional().default(""),
  coordinates: coords,
});

export const donationSchema = z.object({
  date: z.string().datetime(),
  hospital: z.string().trim().min(2).max(120),
  units: z.number().int().min(1).max(3).default(1),
  requestId: z.string().optional(),
});
