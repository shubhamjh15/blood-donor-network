"use client";
import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { BLOOD_GROUPS, CAN_DONATE_TO, CAN_RECEIVE_FROM, GROUP_INFO, type BloodGroup } from "@/lib/blood";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/primitives";

/** Interactive matrix: pick a type, see who it can give to / receive from. */
export function CompatibilityExplorer() {
  const [group, setGroup] = React.useState<BloodGroup>("O-");
  const [mode, setMode] = React.useState<"give" | "receive">("give");
  const highlighted = mode === "give" ? CAN_DONATE_TO[group] : CAN_RECEIVE_FROM[group];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <Tabs value={mode} onValueChange={(v) => setMode(v as "give" | "receive")}>
          <TabsList>
            <TabsTrigger value="give"><ArrowUpFromLine /> I&apos;m donating</TabsTrigger>
            <TabsTrigger value="receive"><ArrowDownToLine /> I need blood</TabsTrigger>
          </TabsList>
        </Tabs>
        <p className="mt-6 text-sm text-muted-foreground">Pick your blood type</p>
        <div className="mt-3 grid grid-cols-4 gap-3">
          {BLOOD_GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={cn(
                "relative cursor-pointer rounded-2xl border py-4 font-display text-xl font-bold transition-all duration-300",
                g === group ? "border-blood-400/70 text-white" : "border-white/10 text-muted-foreground hover:border-white/25 hover:text-foreground",
              )}
            >
              {g === group && (
                <motion.span layoutId="compat-sel" className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blood-500 to-blood-800 shadow-[0_10px_40px_-8px_rgb(255_45_85/0.9)]" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
              )}
              <span className="relative">{g}</span>
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={group + mode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"
          >
            <p className="font-display text-3xl font-bold">
              {highlighted.length}
              <span className="text-base font-medium text-muted-foreground"> / 8 types</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "give" ? (
                <>A <b className="text-foreground">{group}</b> donor can give red cells to {highlighted.join(", ")}.</>
              ) : (
                <>A <b className="text-foreground">{group}</b> patient can receive from {highlighted.join(", ")}.</>
              )}
            </p>
            <p className="mt-3 inline-flex rounded-full bg-blood-500/10 px-3 py-1 text-xs text-blood-300">
              {GROUP_INFO[group].note} · ~{GROUP_INFO[group].population}% of people
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Matrix */}
      <div className="overflow-x-auto rounded-3xl border border-white/[0.07] bg-white/[0.015] p-4 sm:p-6">
        <div className="grid min-w-[420px] grid-cols-9 gap-1.5 text-center text-xs">
          <div className="flex items-end justify-center pb-1 text-[10px] text-muted-foreground">
            donor ↓<br />recip →
          </div>
          {BLOOD_GROUPS.map((r) => (
            <div key={r} className={cn("py-2 font-display font-bold transition-colors", (mode === "give" ? highlighted.includes(r) : r === group) ? "text-blood-300" : "text-muted-foreground")}>
              {r}
            </div>
          ))}
          {BLOOD_GROUPS.map((d) => (
            <React.Fragment key={d}>
              <div className={cn("grid place-items-center font-display font-bold transition-colors", (mode === "receive" ? highlighted.includes(d) : d === group) ? "text-blood-300" : "text-muted-foreground")}>
                {d}
              </div>
              {BLOOD_GROUPS.map((r) => {
                const ok = CAN_RECEIVE_FROM[r].includes(d);
                const active = mode === "give" ? d === group && ok : r === group && ok;
                return (
                  <motion.div
                    key={r}
                    animate={{ scale: active ? 1 : 0.86, opacity: ok ? 1 : 0.35 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: active ? BLOOD_GROUPS.indexOf(mode === "give" ? r : d) * 0.03 : 0 }}
                    className={cn(
                      "aspect-square rounded-lg border transition-colors duration-300",
                      active
                        ? "border-blood-400/60 bg-gradient-to-br from-blood-500 to-blood-700 shadow-[0_0_20px_-4px_rgb(255_45_85/0.9)]"
                        : ok
                          ? "border-white/10 bg-white/[0.06]"
                          : "border-transparent bg-white/[0.015]",
                    )}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
