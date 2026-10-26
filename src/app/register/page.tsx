"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, HandHeart, Lock, Mail, Phone, Search, User as UserIcon, Calendar } from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";
import { api, type Coords } from "@/lib/client";
import type { BloodGroup } from "@/lib/blood";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { BloodGroupPicker } from "@/components/blood-group";
import { LocationPicker } from "@/components/map/location-picker";
import { cn } from "@/lib/utils";

const STEPS = ["Account", "Blood type", "Location"];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [dir, setDir] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    bloodGroup: null as BloodGroup | null,
    isDonor: true,
    lastDonation: "",
    coordinates: null as Coords | null,
    city: "",
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const canNext = [
    form.name.trim().length >= 2 && /\S+@\S+\.\S+/.test(form.email) && form.password.length >= 6 && form.phone.trim().length >= 7,
    !!form.bloodGroup,
    !!form.coordinates,
  ][step];

  const go = (d: number) => {
    setDir(d);
    setStep((s) => s + d);
  };

  const submit = async () => {
    setLoading(true);
    try {
      await api("/api/auth/register", {
        method: "POST",
        json: {
          ...form,
          lastDonation: form.lastDonation ? new Date(form.lastDonation).toISOString() : null,
        },
      });
      await mutate("/api/me");
      toast.success("Welcome to Bloodline! 🩸", { description: "Your profile is live." });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Join the network" subtitle="Three quick steps and you're part of a life-saving community." quote="Signing up took a minute. Saving a life took an hour. Best trade I've ever made.">
      {/* Stepper */}
      <div className="mb-8 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: i === step ? 1.1 : 1 }}
                className={cn(
                  "grid size-8 place-items-center rounded-full border text-xs font-bold transition-colors",
                  i < step ? "border-blood-500 bg-blood-500 text-white" : i === step ? "border-blood-400 text-blood-300 shadow-[0_0_20px_-4px_rgb(255_45_85)]" : "border-white/15 text-muted-foreground",
                )}
              >
                {i < step ? <Check className="size-4" /> : i + 1}
              </motion.div>
              <span className={cn("hidden text-sm sm:block", i === step ? "font-semibold" : "text-muted-foreground")}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="h-px flex-1 overflow-hidden bg-white/10">
                <motion.div className="h-full bg-blood-500" animate={{ width: i < step ? "100%" : "0%" }} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="relative">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: 40 * dir }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 * dir }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
          >
            {step === 0 && (
              <>
                <Field label="Full name"><Input icon={<UserIcon />} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Aarav Sharma" autoComplete="name" /></Field>
                <Field label="Email"><Input icon={<Mail />} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" autoComplete="email" /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Phone"><Input icon={<Phone />} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 98765 43210" autoComplete="tel" /></Field>
                  <Field label="Password" hint="At least 6 characters"><Input icon={<Lock />} type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="••••••••" autoComplete="new-password" /></Field>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <Field label="Your blood group"><BloodGroupPicker value={form.bloodGroup} onChange={(g) => set("bloodGroup", g)} /></Field>
                <Field label="I want to…">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { v: true, icon: HandHeart, t: "Donate & request", d: "Get alerts when someone nearby needs me" },
                      { v: false, icon: Search, t: "Only request", d: "I'm looking for donors right now" },
                    ].map((o) => (
                      <button
                        key={String(o.v)}
                        type="button"
                        onClick={() => set("isDonor", o.v)}
                        className={cn(
                          "cursor-pointer rounded-2xl border p-4 text-left transition-all",
                          form.isDonor === o.v ? "border-blood-400/60 bg-blood-500/10 shadow-[0_0_30px_-10px_rgb(255_45_85)]" : "border-white/10 hover:border-white/25",
                        )}
                      >
                        <o.icon className={cn("size-5", form.isDonor === o.v ? "text-blood-400" : "text-muted-foreground")} />
                        <p className="mt-3 text-sm font-semibold">{o.t}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{o.d}</p>
                      </button>
                    ))}
                  </div>
                </Field>
                {form.isDonor && (
                  <Field label="Last donation (optional)" hint="Helps us know when you're eligible again">
                    <Input icon={<Calendar />} type="date" max={new Date().toISOString().slice(0, 10)} value={form.lastDonation} onChange={(e) => set("lastDonation", e.target.value)} />
                  </Field>
                )}
              </>
            )}

            {step === 2 && (
              <>
                <p className="text-sm text-muted-foreground">Where should we match you? Your exact location is never shown publicly, only your distance.</p>
                <LocationPicker
                  value={form.coordinates}
                  onChange={(c, city) => setForm((f) => ({ ...f, coordinates: c, city: city ?? f.city }))}
                  height={300}
                />
                {form.city && <p className="text-sm">📍 <span className="font-semibold">{form.city}</span></p>}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-8 flex gap-3">
        {step > 0 && (
          <Button variant="secondary" size="lg" onClick={() => go(-1)}><ArrowLeft /> Back</Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button size="lg" className="flex-1" disabled={!canNext} onClick={() => go(1)}>Continue <ArrowRight /></Button>
        ) : (
          <Button size="lg" className="flex-1" disabled={!canNext} loading={loading} onClick={submit}>Create my account</Button>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already a member? <Link href="/login" className="font-semibold text-blood-400 hover:underline">Sign in</Link>
      </p>
    </AuthShell>
  );
}
