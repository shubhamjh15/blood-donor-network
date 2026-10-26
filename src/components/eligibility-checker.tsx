"use client";
import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, RotateCcw, XCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const QUESTIONS = [
  { q: "Are you between 18 and 65 years old?", fail: "Most blood services accept donors aged 18–65." },
  { q: "Do you weigh at least 50 kg (110 lb)?", fail: "A minimum weight keeps donating safe for you." },
  { q: "Has it been 3+ months since your last donation?", fail: "Your body needs time to replenish red cells." },
  { q: "Are you feeling healthy today — no fever, cold or infection?", fail: "Wait until you're fully recovered." },
  { q: "No tattoos, piercings or major surgery in the last 6 months?", fail: "A short deferral applies after these." },
];

export function EligibilityChecker() {
  const [step, setStep] = React.useState(0);
  const [failed, setFailed] = React.useState<string | null>(null);
  const done = step >= QUESTIONS.length;
  const reset = () => {
    setStep(0);
    setFailed(null);
  };

  return (
    <div className="relative mx-auto max-w-xl">
      <div className="mb-6 flex gap-1.5">
        {QUESTIONS.map((_, i) => (
          <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className={cn("h-full rounded-full", failed && i === step ? "bg-red-500" : "bg-gradient-to-r from-blood-600 to-blood-400")}
              initial={false}
              animate={{ width: i < step || (failed && i === step) ? "100%" : "0%" }}
              transition={{ duration: 0.4 }}
            />
          </div>
        ))}
      </div>
      <div className="relative min-h-[220px]">
        <AnimatePresence mode="wait">
          {failed ? (
            <motion.div key="fail" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center">
              <XCircle className="mx-auto size-14 text-amber-400" />
              <h3 className="mt-4 font-display text-2xl font-semibold">Not quite yet</h3>
              <p className="mt-2 text-muted-foreground">{failed}</p>
              <p className="mt-1 text-sm text-muted-foreground">You can still join and help by sharing requests.</p>
              <Button variant="secondary" className="mt-6" onClick={reset}><RotateCcw /> Start over</Button>
            </motion.div>
          ) : done ? (
            <motion.div key="ok" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <motion.div initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 14 }}>
                <CheckCircle2 className="mx-auto size-16 text-emerald-400 drop-shadow-[0_0_20px_rgb(52_211_153/0.6)]" />
              </motion.div>
              <h3 className="mt-4 font-display text-2xl font-semibold">You&apos;re likely eligible to donate! 🎉</h3>
              <p className="mt-2 text-muted-foreground">Final screening happens at the blood bank, but you&apos;re good to go.</p>
              <div className="mt-6 flex justify-center gap-3">
                <Button asChild><Link href="/register">Register as donor <ChevronRight /></Link></Button>
                <Button variant="ghost" onClick={reset}><RotateCcw /> Retake</Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
              <p className="text-xs font-semibold uppercase tracking-widest text-blood-400">Question {step + 1} of {QUESTIONS.length}</p>
              <h3 className="mt-3 font-display text-2xl font-semibold leading-snug sm:text-3xl">{QUESTIONS[step]!.q}</h3>
              <div className="mt-8 grid grid-cols-2 gap-3">
                <Button size="lg" onClick={() => setStep((s) => s + 1)}>Yes</Button>
                <Button size="lg" variant="secondary" onClick={() => setFailed(QUESTIONS[step]!.fail)}>No</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
