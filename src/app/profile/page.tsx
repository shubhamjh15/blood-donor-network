"use client";
import * as React from "react";
import { motion } from "framer-motion";
import { Phone, User as UserIcon, Save, MapPin, HandHeart, Eye } from "lucide-react";
import { toast } from "sonner";
import { api, useMe, type Coords, type PublicUser } from "@/lib/client";
import type { BloodGroup } from "@/lib/blood";
import { BloodGroupPicker, BloodBadge } from "@/components/blood-group";
import { LocationPicker } from "@/components/map/location-picker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Avatar, Skeleton, Switch } from "@/components/ui/primitives";
import { Aurora, TiltCard } from "@/components/effects";

export default function ProfilePage() {
  const { user, mutate } = useMe();
  const [form, setForm] = React.useState<{
    name: string; phone: string; bio: string; city: string; bloodGroup: BloodGroup; isDonor: boolean; available: boolean; coordinates: Coords;
  } | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (user && !form) {
      setForm({
        name: user.name,
        phone: user.phone ?? "",
        bio: user.bio ?? "",
        city: user.city ?? "",
        bloodGroup: user.bloodGroup as BloodGroup,
        isDonor: user.isDonor,
        available: user.available,
        coordinates: user.coordinates,
      });
    }
  }, [user, form]);

  if (!user || !form) {
    return <div className="mx-auto max-w-5xl space-y-4 px-4 pt-28"><Skeleton className="h-64" /><Skeleton className="h-96" /></div>;
  }
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));

  const save = async () => {
    setSaving(true);
    try {
      const res = await api<{ user: PublicUser }>("/api/me", { method: "PATCH", json: form });
      mutate({ user: res.user }, { revalidate: false });
      toast.success("Profile saved");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      <Aurora className="opacity-30" />
      <div className="relative mx-auto max-w-5xl px-4 pb-12 pt-28">
        <h1 className="font-display text-4xl font-bold tracking-tight">Your profile</h1>
        <p className="mt-1 text-muted-foreground">Keep your details fresh so the right people can find you.</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Donor card preview */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <TiltCard className="rounded-3xl" max={12}>
              <motion.div initial={{ opacity: 0, rotateY: -20 }} animate={{ opacity: 1, rotateY: 0 }} className="relative overflow-hidden rounded-3xl border border-blood-500/30 bg-gradient-to-br from-blood-600/40 via-blood-900/40 to-background p-6 shadow-[0_30px_80px_-30px_rgb(255_45_85/0.6)]">
                <div className="absolute -right-10 -top-10 size-40 rounded-full bg-blood-500/30 blur-3xl" />
                <div className="relative flex items-start justify-between">
                  <p className="font-display text-sm font-bold tracking-widest text-blood-200">BLOODLINE DONOR</p>
                  <BloodBadge group={form.bloodGroup} size="lg" />
                </div>
                <div className="relative mt-10 flex items-center gap-3">
                  <Avatar name={form.name || "?"} className="size-12" />
                  <div>
                    <p className="font-display text-xl font-bold">{form.name || "Your name"}</p>
                    <p className="text-xs text-blood-200/80">{form.city || "Your city"}</p>
                  </div>
                </div>
                <div className="relative mt-6 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-black/20 p-2"><p className="font-display text-lg font-bold">{user.donationsCount}</p><p className="text-[10px] uppercase text-blood-200/70">Donations</p></div>
                  <div className="rounded-xl bg-black/20 p-2"><p className="font-display text-lg font-bold">{user.livesImpacted}</p><p className="text-[10px] uppercase text-blood-200/70">Lives</p></div>
                  <div className="rounded-xl bg-black/20 p-2"><p className="font-display text-lg font-bold">{user.createdAt ? new Date(user.createdAt).getFullYear() : "—"}</p><p className="text-[10px] uppercase text-blood-200/70">Since</p></div>
                </div>
                {form.bio && <p className="relative mt-4 text-sm italic text-blood-100/80">&ldquo;{form.bio}&rdquo;</p>}
              </motion.div>
            </TiltCard>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><Eye className="size-3.5" /> How others see you in search</p>
          </div>

          <div className="space-y-6">
            <Card className="space-y-4 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name"><Input icon={<UserIcon />} value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
                <Field label="Phone"><Input icon={<Phone />} value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
              </div>
              <Field label="Email"><Input value={user.email ?? ""} disabled /></Field>
              <Field label="Short bio" hint={`${form.bio.length}/280`}><Textarea maxLength={280} value={form.bio} onChange={(e) => set("bio", e.target.value)} placeholder="e.g. Happy to help on weekends. Call before coming." /></Field>
            </Card>

            <Card className="space-y-4 p-6">
              <Field label="Blood group"><BloodGroupPicker value={form.bloodGroup} onChange={(g) => g && set("bloodGroup", g)} /></Field>
              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/[0.07] p-4">
                <span className="flex items-center gap-3"><HandHeart className="size-5 text-blood-400" /><span><span className="block font-medium">I&apos;m a donor</span><span className="text-xs text-muted-foreground">Appear in donor search and receive alerts</span></span></span>
                <Switch checked={form.isDonor} onCheckedChange={(v) => set("isDonor", v)} />
              </label>
              {form.isDonor && (
                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/[0.07] p-4">
                  <span><span className="block font-medium">Available right now</span><span className="text-xs text-muted-foreground">Turn off when travelling or unwell</span></span>
                  <Switch checked={form.available} onCheckedChange={(v) => set("available", v)} />
                </label>
              )}
            </Card>

            <Card className="space-y-4 p-6">
              <p className="flex items-center gap-2 font-display text-lg font-semibold"><MapPin className="size-5 text-blood-400" /> Location</p>
              <LocationPicker value={form.coordinates} onChange={(c, city) => setForm((f) => (f ? { ...f, coordinates: c, city: city ?? f.city } : f))} height={300} />
              <Field label="City / area"><Input value={form.city} onChange={(e) => set("city", e.target.value)} /></Field>
            </Card>

            <div className="flex justify-end">
              <Button size="lg" onClick={save} loading={saving}><Save /> Save changes</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
