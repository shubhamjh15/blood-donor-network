export const BLOOD_GROUPS = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

/** Which donor groups a recipient of `group` can safely receive red cells from. */
export const CAN_RECEIVE_FROM: Record<BloodGroup, BloodGroup[]> = {
  "O-": ["O-"],
  "O+": ["O-", "O+"],
  "A-": ["O-", "A-"],
  "A+": ["O-", "O+", "A-", "A+"],
  "B-": ["O-", "B-"],
  "B+": ["O-", "O+", "B-", "B+"],
  "AB-": ["O-", "A-", "B-", "AB-"],
  "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
};

/** Which recipient groups a donor of `group` can give red cells to. */
export const CAN_DONATE_TO: Record<BloodGroup, BloodGroup[]> = BLOOD_GROUPS.reduce(
  (acc, donor) => {
    acc[donor] = BLOOD_GROUPS.filter((r) => CAN_RECEIVE_FROM[r].includes(donor));
    return acc;
  },
  {} as Record<BloodGroup, BloodGroup[]>,
);

export const GROUP_INFO: Record<BloodGroup, { population: number; note: string }> = {
  "O-": { population: 7, note: "Universal red-cell donor" },
  "O+": { population: 37, note: "Most common blood type" },
  "A-": { population: 6, note: "Can give to A and AB" },
  "A+": { population: 36, note: "Second most common" },
  "B-": { population: 2, note: "Rare — every donation counts" },
  "B+": { population: 9, note: "Can give to B+ and AB+" },
  "AB-": { population: 1, note: "Rarest blood type" },
  "AB+": { population: 3, note: "Universal recipient" },
};

/** Minimum days between whole-blood donations. */
export const DONATION_INTERVAL_DAYS = 90;

export function nextEligibleDate(lastDonation?: Date | string | null): Date | null {
  if (!lastDonation) return null;
  const d = new Date(lastDonation);
  d.setDate(d.getDate() + DONATION_INTERVAL_DAYS);
  return d;
}

export function isEligible(lastDonation?: Date | string | null): boolean {
  const next = nextEligibleDate(lastDonation);
  return !next || next.getTime() <= Date.now();
}

export function daysUntilEligible(lastDonation?: Date | string | null): number {
  const next = nextEligibleDate(lastDonation);
  if (!next) return 0;
  return Math.max(0, Math.ceil((next.getTime() - Date.now()) / 86_400_000));
}

export const URGENCY = ["critical", "high", "normal"] as const;
export type Urgency = (typeof URGENCY)[number];
