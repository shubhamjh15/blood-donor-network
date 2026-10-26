"use client";
import { motion } from "framer-motion";
import { DONATION_INTERVAL_DAYS, daysUntilEligible, nextEligibleDate } from "@/lib/blood";
import { format } from "date-fns";

export function EligibilityRing({ lastDonation, size = 180 }: { lastDonation: string | null; size?: number }) {
  const wait = daysUntilEligible(lastDonation);
  const progress = lastDonation ? 1 - wait / DONATION_INTERVAL_DAYS : 1;
  const r = size / 2 - 12;
  const c = 2 * Math.PI * r;
  const ready = wait === 0;
  const next = nextEligibleDate(lastDonation);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={ready ? "#34d399" : "#ff5f7c"} />
            <stop offset="100%" stopColor={ready ? "#059669" : "#c80333"} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgb(255 255 255 / 0.06)" strokeWidth={12} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ring-grad)"
          strokeWidth={12}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - progress) }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: `drop-shadow(0 0 10px ${ready ? "rgb(52 211 153 / 0.6)" : "rgb(255 45 85 / 0.6)"})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {ready ? (
          <>
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.6 }} className="text-3xl">💪</motion.span>
            <p className="mt-1 font-display text-lg font-bold text-emerald-300">Ready to donate</p>
            <p className="text-xs text-muted-foreground">You&apos;re eligible now</p>
          </>
        ) : (
          <>
            <p className="font-display text-4xl font-bold tabular-nums">{wait}</p>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">days to go</p>
            {next && <p className="mt-1 text-xs text-blood-300">{format(next, "d MMM yyyy")}</p>}
          </>
        )}
      </div>
    </div>
  );
}
