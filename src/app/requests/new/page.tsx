"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, Phone, Siren, User as UserIcon, AlertTriangle, Clock, Minus, Plus, Info } from "lucide-react";
import { toast } from "sonner";
import { api, useMe, type Coords, type PublicRequest } from "@/lib/client";
import { CAN_RECEIVE_FROM, type BloodGroup, type Urgency } from "@/lib/blood";
import { BloodGroupPicker } from "@/components/blood-group";
import { LocationPicker } from "@/components/map/location-picker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Aurora } from "@/components/effects";
import { cn } from "@/lib/utils";

const URGENCIES: { v: Urgency; label: string; desc: string; hours: number; cls: string; icon: React.ElementType }[] = [
  { v: "critical", label: "Critical", desc: "Life-threatening, within hours · 40 km alert radius", hours: 6, cls: "border-red-500/60 bg-red-500/10 shadow-[0_0_40px_-12px_rgb(239_68_68)]", icon: Siren },
  { v: "high", label: "Urgent", desc: "Needed within a day · 25 km radius", hours: 24, cls: "border-orange-500/60 bg-orange-500/10", icon: AlertTriangle },
  { v: "normal", label: "Planned", desc: "Scheduled surgery or transfusion · 15 km", hours: 72, cls: "border-blood-500/60 bg-blood-500/10", icon: Clock },
];

const toLocalInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export default function NewRequestPage() {
  const router = useRouter();
  const { user } = useMe();
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({
    patientName: "",
    bloodGroup: null as BloodGroup | null,
    units: 1,
    hospital: "",
    address: "",
    contactPhone: "",
    urgency: "high" as Urgency,
    neededBy: toLocalInput(new Date(Date.now() + 24 * 3_600_000)),
    note: "",
    coordinates: null as Coords | null,
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  React.useEffect(() => {
    if (user) setForm((f) => ({ ...f, contactPhone: f.contactPhone || user.phone || "", coordinates: f.coordinates ?? user.coordinates }));
  }, [user]);

  const valid = form.patientName.trim().length >= 2 && form.bloodGroup && form.hospital.trim().length >= 2 && form.contactPhone.trim().length >= 7 && form.coordinates;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return toast.error("Please fill in all required fields");
    setLoading(true);
    try {
      const { request } = await api<{ request: PublicRequest }>("/api/requests", {
        method: "POST",
        json: { ...form, neededBy: new Date(form.neededBy).toISOString() },
      });
      toast.success("Request posted 🚀", {
        description: request.notifiedCount ? `${request.notifiedCount} compatible donor(s) nearby were alerted.` : "We'll alert donors as soon as they're in range.",
      });
      router.push(`/requests/${request.id}`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <Aurora className="opacity-40" />
      <form onSubmit={submit} className="relative mx-auto max-w-5xl px-4 pb-12 pt-28">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blood-400">Emergency request</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">Request blood</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">We&apos;ll instantly alert compatible donors near the hospital. The more precise the details, the faster help arrives.</p>
        </motion.div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-6">
            <Card className="space-y-5 p-6">
              <Field label="Blood group needed *">
                <BloodGroupPicker value={form.bloodGroup} onChange={(g) => set("bloodGroup", g)} />
              </Field>
              {form.bloodGroup && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2 text-xs text-muted-foreground">
                  <Info className="size-3.5 text-blood-400" /> Compatible donors: <b className="text-foreground">{CAN_RECEIVE_FROM[form.bloodGroup].join(", ")}</b>
                </motion.p>
              )}
              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <Field label="Patient name *"><Input icon={<UserIcon />} value={form.patientName} onChange={(e) => set("patientName", e.target.value)} placeholder="Full name" /></Field>
                <Field label="Units *">
                  <div className="flex h-11 items-center rounded-xl border border-white/10 bg-white/[0.03]">
                    <button type="button" className="grid size-11 cursor-pointer place-items-center text-muted-foreground hover:text-foreground" onClick={() => set("units", Math.max(1, form.units - 1))}><Minus className="size-4" /></button>
                    <motion.span key={form.units} initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-8 text-center font-display text-lg font-bold">{form.units}</motion.span>
                    <button type="button" className="grid size-11 cursor-pointer place-items-center text-muted-foreground hover:text-foreground" onClick={() => set("units", Math.min(20, form.units + 1))}><Plus className="size-4" /></button>
                  </div>
                </Field>
              </div>
            </Card>

            <Card className="space-y-3 p-6">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Urgency *</p>
              {URGENCIES.map((u) => (
                <button
                  key={u.v}
                  type="button"
                  onClick={() => {
                    set("urgency", u.v);
                    set("neededBy", toLocalInput(new Date(Date.now() + u.hours * 3_600_000)));
                  }}
                  className={cn("flex w-full cursor-pointer items-center gap-4 rounded-2xl border p-4 text-left transition-all", form.urgency === u.v ? u.cls : "border-white/10 hover:border-white/20")}
                >
                  <u.icon className={cn("size-5", form.urgency === u.v ? "text-white" : "text-muted-foreground")} />
                  <div>
                    <p className="font-semibold">{u.label}</p>
                    <p className="text-xs text-muted-foreground">{u.desc}</p>
                  </div>
                  <span className={cn("ml-auto size-4 rounded-full border-2", form.urgency === u.v ? "border-white bg-blood-500" : "border-white/20")} />
                </button>
              ))}
              <Field label="Needed by" className="pt-2">
                <Input type="datetime-local" value={form.neededBy} onChange={(e) => set("neededBy", e.target.value)} />
              </Field>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="space-y-4 p-6">
              <Field label="Hospital / blood bank *"><Input icon={<Building2 />} value={form.hospital} onChange={(e) => set("hospital", e.target.value)} placeholder="e.g. Apollo Hospital, Ward 4B" /></Field>
              <Field label="Pin the hospital location *">
                <LocationPicker value={form.coordinates} onChange={(c) => set("coordinates", c)} height={260} />
              </Field>
              <Field label="Address / directions"><Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Building, floor, landmark" /></Field>
            </Card>
            <Card className="space-y-4 p-6">
              <Field label="Contact phone *"><Input icon={<Phone />} value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} placeholder="+91…" /></Field>
              <Field label="Note for donors"><Textarea value={form.note} onChange={(e) => set("note", e.target.value)} maxLength={500} placeholder="Patient condition, timing, anything donors should know…" /></Field>
            </Card>
          </div>
        </div>

        <div className="sticky bottom-4 z-20 mt-8">
          <div className="glass flex items-center justify-between gap-4 rounded-2xl p-3 pl-5 shadow-2xl">
            <p className="hidden text-sm text-muted-foreground sm:block">
              {form.bloodGroup ? <>Alerting <b className="text-foreground">{CAN_RECEIVE_FROM[form.bloodGroup].join(", ")}</b> donors near the hospital</> : "Choose a blood group to continue"}
            </p>
            <Button type="submit" size="lg" loading={loading} disabled={!valid} className="w-full sm:w-auto"><Siren /> Post request & alert donors</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
