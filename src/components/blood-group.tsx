"use client";
import { useId } from "react";
import { motion } from "framer-motion";
import { BLOOD_GROUPS, GROUP_INFO, type BloodGroup } from "@/lib/blood";
import { cn } from "@/lib/utils";

const GROUP_COLORS: Record<BloodGroup, string> = {
  "O-": "from-rose-500 to-red-700",
  "O+": "from-red-500 to-red-700",
  "A-": "from-pink-500 to-rose-700",
  "A+": "from-rose-400 to-pink-700",
  "B-": "from-orange-500 to-red-700",
  "B+": "from-amber-500 to-orange-700",
  "AB-": "from-fuchsia-500 to-purple-700",
  "AB+": "from-violet-500 to-fuchsia-700",
};
export const GROUP_HEX: Record<BloodGroup, string> = {
  "O-": "#f43f5e",
  "O+": "#ef4444",
  "A-": "#ec4899",
  "A+": "#fb7185",
  "B-": "#f97316",
  "B+": "#f59e0b",
  "AB-": "#d946ef",
  "AB+": "#8b5cf6",
};

export function BloodBadge({ group, size = "md", className }: { group: string; size?: "sm" | "md" | "lg" | "xl"; className?: string }) {
  const s = { sm: `size-8 ${group.length > 2 ? "text-[9px] tracking-tighter" : "text-[11px]"}`, md: "size-11 text-sm", lg: "size-14 text-lg", xl: "size-20 text-2xl" }[size];
  return (
    <div
      className={cn(
        "relative grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br font-display font-bold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_8px_24px_-8px_rgb(255_45_85/0.6)]",
        GROUP_COLORS[group as BloodGroup] ?? "from-red-500 to-red-700",
        s,
        className,
      )}
    >
      {group}
    </div>
  );
}

/** Grid picker of the 8 blood groups. */
export function BloodGroupPicker({ value, onChange, allowAny, className }: { value?: string | null; onChange: (g: BloodGroup | null) => void; allowAny?: boolean; className?: string }) {
  const layoutId = useId();
  return (
    <div className={cn("grid grid-cols-4 gap-2", allowAny && "grid-cols-3 sm:grid-cols-9", className)}>
      {allowAny && (
        <PickerButton layoutId={layoutId} active={!value} onClick={() => onChange(null)} label="Any" sub="All" />
      )}
      {BLOOD_GROUPS.map((g) => (
        <PickerButton key={g} layoutId={layoutId} active={value === g} onClick={() => onChange(g)} label={g} sub={`${GROUP_INFO[g].population}%`} />
      ))}
    </div>
  );
}

function PickerButton({ layoutId, active, onClick, label, sub }: { layoutId: string; active: boolean; onClick: () => void; label: string; sub: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border py-3 transition-all duration-200 hover:-translate-y-0.5",
        active ? "border-blood-400/70 text-white" : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/25 hover:text-foreground",
      )}
    >
      {active && (
        <motion.span
          layoutId={layoutId}
          className="absolute inset-0 rounded-2xl bg-gradient-to-b from-blood-500/30 to-blood-700/20 shadow-[0_0_30px_-6px_rgb(255_45_85/0.8)]"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <span className="relative font-display text-lg font-bold">{label}</span>
      <span className="relative text-[10px] opacity-70">{sub}</span>
    </button>
  );
}
