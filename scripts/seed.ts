/* Seeds a realistic demo network around SEED_LAT/SEED_LNG.
 * Usage: npm run seed            (wipes and reseeds)
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "../src/lib/db";
import { BLOOD_GROUPS, CAN_RECEIVE_FROM, type BloodGroup } from "../src/lib/blood";
import { User } from "../src/models/User";
import { BloodRequest } from "../src/models/BloodRequest";
import { Donation } from "../src/models/Donation";
import { Notification } from "../src/models/Notification";

const LAT = Number(process.env.SEED_LAT ?? 28.6139);
const LNG = Number(process.env.SEED_LNG ?? 77.209);
const CITY = process.env.SEED_CITY ?? "New Delhi";
const DONORS = Number(process.env.SEED_DONORS ?? 220);

const FIRST = ["Aarav", "Vivaan", "Aditya", "Ishaan", "Arjun", "Kabir", "Rohan", "Karan", "Rahul", "Siddharth", "Ananya", "Diya", "Saanvi", "Aanya", "Priya", "Neha", "Kavya", "Meera", "Riya", "Tara", "Zoya", "Imran", "Farhan", "Aisha", "Sara", "Harpreet", "Simran", "Gurleen", "Manav", "Dev", "Nikhil", "Pooja", "Sneha", "Vikram", "Arnav", "Yash", "Ira", "Myra", "Noah", "Liam", "Emma", "Olivia", "Mateo", "Lucas", "Mia", "Sofia", "Ethan", "Ava"];
const LAST = ["Sharma", "Verma", "Gupta", "Singh", "Kumar", "Patel", "Mehta", "Iyer", "Nair", "Reddy", "Khan", "Ali", "Kapoor", "Malhotra", "Chopra", "Bose", "Das", "Joshi", "Menon", "Rao", "Sethi", "Bhatia", "Arora", "Saxena", "Jain", "Garcia", "Smith", "Brown", "Wilson", "Lee"];
const HOSPITALS = ["City General Hospital", "Apollo Hospital", "Max Super Speciality", "Fortis Memorial", "AIIMS Trauma Centre", "Sir Ganga Ram Hospital", "St. Mary's Medical Centre", "Red Cross Blood Bank", "Lifeline Children's Hospital", "Metro Heart Institute"];
const NOTES = ["Patient undergoing surgery tomorrow morning.", "Accident case, in ICU. Please hurry.", "Thalassemia patient — needs regular transfusions.", "Post-delivery complications.", "Dengue — platelets dropping fast.", "Scheduled chemotherapy support.", ""];
const BIOS = ["Regular donor since college 💪", "Happy to help anytime, call first.", "Weekend availability mostly.", "Donated 10+ times, let's save lives!", "Night shifts — text me.", "", "", ""];

// Weighted by real-world distribution so the map looks realistic
const WEIGHTS: Record<BloodGroup, number> = { "O+": 37, "A+": 30, "B+": 18, "AB+": 4, "O-": 4, "A-": 3, "B-": 2, "AB-": 2 };

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)]!;
function weightedGroup(): BloodGroup {
  const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const g of BLOOD_GROUPS) {
    r -= WEIGHTS[g];
    if (r <= 0) return g;
  }
  return "O+";
}
/** Random point within `km` of centre, denser toward the middle. */
function scatter(km: number): [number, number] {
  const r = km * Math.sqrt(Math.random()) * (Math.random() < 0.7 ? 0.5 : 1);
  const t = Math.random() * Math.PI * 2;
  const dLat = (r / 111) * Math.cos(t);
  const dLng = (r / (111 * Math.cos((LAT * Math.PI) / 180))) * Math.sin(t);
  return [LNG + dLng, LAT + dLat];
}
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000);
const phone = () => `+91 9${Math.floor(rand(100000000, 999999999))}`;

async function main() {
  await connectDB();
  console.log("🧹 Clearing collections…");
  await Promise.all([User.deleteMany({}), BloodRequest.deleteMany({}), Donation.deleteMany({}), Notification.deleteMany({})]);
  await Promise.all([User.syncIndexes(), BloodRequest.syncIndexes()]);

  const passwordHash = await bcrypt.hash("demo1234", 10);

  console.log(`🩸 Creating ${DONORS} donors around ${CITY} (${LAT}, ${LNG})…`);
  const usedEmails = new Set<string>();
  const docs = Array.from({ length: DONORS }, (_, i) => {
    const name = `${pick(FIRST)} ${pick(LAST)}`;
    let email = `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`;
    if (usedEmails.has(email)) email = email.replace("@", `${i}@`);
    usedEmails.add(email);
    const donated = Math.random() < 0.75;
    const count = donated ? Math.floor(rand(1, 24)) : 0;
    return {
      name,
      email,
      passwordHash,
      phone: phone(),
      bloodGroup: weightedGroup(),
      isDonor: Math.random() < 0.93,
      available: Math.random() < 0.82,
      city: CITY,
      bio: pick(BIOS),
      location: { type: "Point", coordinates: scatter(i < DONORS * 0.85 ? 18 : 45) },
      lastDonation: donated ? daysAgo(rand(5, 400)) : null,
      donationsCount: count,
      livesImpacted: count * 3,
      lastActiveAt: daysAgo(rand(0, 20)),
      createdAt: daysAgo(rand(30, 700)),
    };
  });

  const demo = {
    name: "Demo Hero",
    email: "demo@bloodline.app",
    passwordHash,
    phone: "+91 9876543210",
    bloodGroup: "O-" as BloodGroup,
    isDonor: true,
    available: true,
    city: CITY,
    bio: "Universal donor. Ping me for emergencies 🚑",
    location: { type: "Point", coordinates: [LNG, LAT] },
    lastDonation: daysAgo(120),
    donationsCount: 7,
    livesImpacted: 21,
    lastActiveAt: new Date(),
    createdAt: daysAgo(400),
  };

  const users = await User.insertMany([demo, ...docs]);
  const demoUser = users[0]!;
  const others = users.slice(1);

  console.log("💉 Creating donation history…");
  const donations = [];
  for (const u of users) {
    if (!u.lastDonation) continue;
    const n = Math.min(u.donationsCount, 6);
    for (let k = 0; k < n; k++) {
      donations.push({
        user: u._id,
        date: k === 0 ? u.lastDonation : new Date(u.lastDonation.getTime() - k * rand(95, 160) * 86_400_000),
        hospital: pick(HOSPITALS),
        units: 1,
      });
    }
  }
  await Donation.insertMany(donations);

  console.log("📣 Creating blood requests…");
  const requests = [];
  for (let i = 0; i < 26; i++) {
    const requester = i < 3 ? demoUser : pick(others);
    const urgency = i % 5 === 0 ? "critical" : i % 3 === 0 ? "high" : "normal";
    const status = i < 18 ? "open" : i < 23 ? "fulfilled" : "cancelled";
    const group = i === 0 ? "B-" : weightedGroup();
    const compatible = others.filter(
      (u) => u.isDonor && CAN_RECEIVE_FROM[group].includes(u.bloodGroup as BloodGroup) && String(u._id) !== String(requester._id),
    );
    const responders = Array.from({ length: Math.floor(rand(0, 4)) }, () => pick(compatible))
      .filter((u, idx, arr) => u && arr.indexOf(u) === idx)
      .map((u) => ({ user: u._id, status: status === "fulfilled" ? "donated" : "accepted", message: "", at: daysAgo(rand(0, 2)) }));
    const units = Math.floor(rand(1, 5));
    requests.push({
      requester: requester._id,
      patientName: `${pick(FIRST)} ${pick(LAST)}`,
      bloodGroup: group,
      units,
      unitsFulfilled: status === "fulfilled" ? units : responders.filter((r) => r.status === "donated").length,
      hospital: pick(HOSPITALS),
      address: `${CITY}`,
      contactPhone: requester.phone,
      urgency,
      neededBy: new Date(Date.now() + rand(4, 96) * 3_600_000),
      note: pick(NOTES),
      status,
      location: { type: "Point", coordinates: scatter(15) },
      responders,
      notifiedCount: Math.floor(rand(5, 40)),
      createdAt: daysAgo(rand(0, status === "open" ? 2 : 20)),
    });
  }
  const created = await BloodRequest.insertMany(requests);

  console.log("🔔 Creating notifications for the demo account…");
  const nearbyOpen = created.filter((r) => r.status === "open" && String(r.requester) !== String(demoUser._id)).slice(0, 4);
  await Notification.insertMany([
    { user: demoUser._id, type: "system", title: "Welcome to Bloodline, Demo! 🩸", body: "You're visible to people nearby who need O-.", link: "/dashboard", read: true },
    ...nearbyOpen.map((r) => ({
      user: demoUser._id,
      type: "request_nearby",
      urgency: r.urgency,
      title: `${r.urgency === "critical" ? "🚨" : "🩸"} ${r.bloodGroup} needed near you`,
      body: `${r.units} unit(s) for ${r.patientName} at ${r.hospital}.`,
      link: `/requests/${r._id}`,
    })),
  ]);

  console.log(`\n✅ Seeded ${users.length} users, ${donations.length} donations, ${created.length} requests.`);
  console.log("   Demo login → demo@bloodline.app / demo1234 (every seeded user also uses demo1234)\n");
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("Seed failed:", err.message);
  await mongoose.disconnect();
  process.exit(1);
});
