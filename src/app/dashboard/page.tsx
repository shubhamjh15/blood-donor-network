"use client";
import * as React from "react";
import Link from "next/link";
import useSWR from "swr";
import { motion } from "framer-motion";
import { format, subMonths, startOfMonth } from "date-fns";
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, Award, Crown, Droplet, Flame, HeartPulse, MapPin, Plus, Radar, Shield, Siren, Sparkles, Star, Trophy, Users } from "lucide-react";
import { toast } from "sonner";
import { api, useMe, type PublicRequest, type PublicUser } from "@/lib/client";
import { CAN_DONATE_TO, GROUP_INFO, type BloodGroup } from "@/lib/blood";
import { BloodBadge, GROUP_HEX } from "@/components/blood-group";
import { RequestCard } from "@/components/request-card";
import { EligibilityRing } from "@/components/dashboard/eligibility-ring";
import { LogDonationDialog } from "@/components/dashboard/log-donation-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, Skeleton, Switch, Tooltip } from "@/components/ui/primitives";
import { Aurora, NumberTicker, SpotlightCard } from "@/components/effects";
import { cn } from "@/lib/utils";

type Donation = { id: string; date: string; hospital: string; units: number; requestId: string | null };

export default function DashboardPage() {
  const { user, mutate: mutateMe } = useMe();
  const coords = user?.coordinates;
  const near = coords ? `lat=${coords[1]}&lng=${coords[0]}` : null;

  const { data: nearby } = useSWR<{ requests: PublicRequest[] }>(user && near ? `/api/requests?${near}&radius=40&bloodGroup=${encodeURIComponent(user.bloodGroup)}&canHelp=1` : null, { refreshInterval: 20_000 });
  const { data: mine } = useSWR<{ requests: PublicRequest[] }>(user ? "/api/requests?scope=mine&status=all" : null);
  const { data: helping } = useSWR<{ requests: PublicRequest[] }>(user ? "/api/requests?scope=responded&status=all" : null);
  const { data: donations } = useSWR<{ donations: Donation[] }>(user ? "/api/donations" : null);
  const { data: area } = useSWR<{ donors: PublicUser[]; byGroup: { group: string; count: number }[] }>(near ? `/api/donors?${near}&radius=10&limit=300&includeUnavailable=1` : null);

  const [toggling, setToggling] = React.useState(false);
  const toggleAvailable = async (v: boolean) => {
    setToggling(true);
    try {
      const res = await api<{ user: PublicUser }>("/api/me", { method: "PATCH", json: { available: v } });
      mutateMe({ user: res.user }, { revalidate: false });
      toast.success(v ? "You're visible to people in need 💚" : "You're hidden from donor search for now");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setToggling(false);
    }
  };

  const chart = React.useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => startOfMonth(subMonths(new Date(), 11 - i)));
    return months.map((m) => ({
      month: format(m, "MMM"),
      donations: (donations?.donations ?? []).filter((d) => {
        const dd = new Date(d.date);
        return dd.getFullYear() === m.getFullYear() && dd.getMonth() === m.getMonth();
      }).length,
    }));
  }, [donations]);

  if (!user) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 pt-28">
        <Skeleton className="h-40" />
        <div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-64" /><Skeleton className="h-64" /><Skeleton className="h-64" /></div>
      </div>
    );
  }

  const openMine = (mine?.requests ?? []).filter((r) => r.status === "open");
  const helpingOpen = (helping?.requests ?? []).filter((r) => r.status === "open");
  const achievements = getAchievements(user, helping?.requests.length ?? 0);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="relative">
      <Aurora className="opacity-30" />
      <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-24">
        {/* ---------- Header ---------- */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <Avatar name={user.name} className="size-16 text-lg" />
            <div>
              <p className="text-sm text-muted-foreground">{greeting},</p>
              <h1 className="font-display text-3xl font-bold tracking-tight">{user.name}</h1>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="size-3.5" /> {user.city || "Location set"} · <Link href="/profile" className="text-blood-400 hover:underline">Edit profile</Link></p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 md:ml-auto">
            {user.isDonor && (
              <label className={cn("flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-2.5 transition-colors", user.available ? "border-emerald-500/30 bg-emerald-500/10" : "border-white/10 bg-white/[0.03]")}>
                <span className="relative flex size-2.5">
                  {user.available && <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
                  <span className={cn("relative inline-flex size-2.5 rounded-full", user.available ? "bg-emerald-400" : "bg-zinc-500")} />
                </span>
                <span className="text-sm font-medium">{user.available ? "Available to donate" : "Not available"}</span>
                <Switch checked={user.available} disabled={toggling} onCheckedChange={toggleAvailable} />
              </label>
            )}
            <Button asChild><Link href="/requests/new"><Plus /> Request blood</Link></Button>
          </div>
        </motion.div>

        {/* ---------- Top row ---------- */}
        <div className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_1fr_1fr]">
          <SpotlightCard className="p-6">
            <div className="flex items-center gap-5">
              <EligibilityRing lastDonation={user.lastDonation} size={150} />
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your blood type</p>
                <div className="mt-2 flex items-center gap-3">
                  <BloodBadge group={user.bloodGroup} size="lg" />
                  <p className="text-xs text-muted-foreground">{GROUP_INFO[user.bloodGroup as BloodGroup].note}</p>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">Can give to</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {CAN_DONATE_TO[user.bloodGroup as BloodGroup].map((g) => <span key={g} className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-bold">{g}</span>)}
                </div>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4 text-sm">
              <span className="text-muted-foreground">Last donation: <b className="text-foreground">{user.lastDonation ? format(new Date(user.lastDonation), "d MMM yyyy") : "never"}</b></span>
              <LogDonationDialog />
            </div>
          </SpotlightCard>

          <div className="grid grid-cols-2 gap-4 lg:col-span-2">
            {[
              { label: "Donations", value: user.donationsCount, icon: Droplet, color: "text-blood-400" },
              { label: "Lives impacted", value: user.livesImpacted, icon: HeartPulse, color: "text-pink-400" },
              { label: "Requests posted", value: mine?.requests.length ?? 0, icon: Siren, color: "text-orange-400" },
              { label: "Requests helped", value: helping?.requests.length ?? 0, icon: Users, color: "text-emerald-400" },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
                <SpotlightCard className="h-full p-5">
                  <s.icon className={cn("size-5", s.color)} />
                  <p className="mt-4 font-display text-4xl font-bold"><NumberTicker value={s.value} duration={1.2} /></p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ---------- Middle row ---------- */}
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Card>
            <CardHeader className="flex-row items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Radar className="size-5 text-blood-400" /> People nearby you can help</CardTitle>
                <CardDescription>Open requests within 40 km compatible with {user.bloodGroup}</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm"><Link href="/requests">View all <ArrowRight /></Link></Button>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {!nearby && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
              {nearby?.requests.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-muted-foreground">No one nearby needs {user.bloodGroup}-compatible blood right now. 🎉</div>
              )}
              {nearby?.requests.filter((r) => !r.isOwner).slice(0, 4).map((r, i) => <RequestCard key={r.id} request={r} index={i} />)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="size-5 text-blood-400" /> Donors within 10 km</CardTitle>
              <CardDescription>{area ? `${area.donors.length} registered donors near you` : "Loading…"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative h-52">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={(area?.byGroup ?? []).filter((g) => g.count)} dataKey="count" nameKey="group" innerRadius={60} outerRadius={88} paddingAngle={3} stroke="none" animationDuration={1200}>
                      {(area?.byGroup ?? []).filter((g) => g.count).map((g) => <Cell key={g.group} fill={GROUP_HEX[g.group as BloodGroup]} />)}
                    </Pie>
                    <RTooltip contentStyle={{ background: "#121017", border: "1px solid rgb(255 255 255 / 0.1)", borderRadius: 12, fontSize: 12 }} itemStyle={{ color: "#f5f3f7" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="font-display text-3xl font-bold">{area?.donors.length ?? "–"}</p>
                  <p className="text-xs text-muted-foreground">donors</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-1.5">
                {(area?.byGroup ?? []).map((g) => (
                  <div key={g.group} className="flex items-center gap-1.5 rounded-lg bg-white/[0.03] px-2 py-1 text-xs">
                    <span className="size-2 rounded-full" style={{ background: GROUP_HEX[g.group as BloodGroup] }} />
                    <span className="font-bold">{g.group}</span>
                    <span className="ml-auto text-muted-foreground">{g.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ---------- Bottom row ---------- */}
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Donation history</CardTitle>
              <CardDescription>Last 12 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-44">
                <ResponsiveContainer>
                  <AreaChart data={chart} margin={{ left: -28, right: 8, top: 8 }}>
                    <defs>
                      <linearGradient id="donGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ff2d55" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="#ff2d55" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" tick={{ fill: "#9a94a6", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fill: "#9a94a6", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <RTooltip contentStyle={{ background: "#121017", border: "1px solid rgb(255 255 255 / 0.1)", borderRadius: 12, fontSize: 12 }} cursor={{ stroke: "rgb(255 255 255 / 0.1)" }} />
                    <Area type="monotone" dataKey="donations" stroke="#ff2d55" strokeWidth={2.5} fill="url(#donGrad)" animationDuration={1400} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 max-h-48 space-y-1.5 overflow-y-auto pr-1">
                {donations?.donations.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No donations logged yet.</p>}
                {donations?.donations.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 rounded-xl bg-white/[0.02] px-3 py-2 text-sm">
                    <Droplet className="size-4 text-blood-400" />
                    <span className="flex-1 truncate">{d.hospital}</span>
                    {d.requestId && <Link href={`/requests/${d.requestId}`} className="text-xs text-blood-400 hover:underline">via request</Link>}
                    <span className="text-xs text-muted-foreground">{format(new Date(d.date), "d MMM yyyy")}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Your active requests</CardTitle>
                <Button asChild variant="ghost" size="sm"><Link href="/requests/new"><Plus /> New</Link></Button>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {openMine.length === 0 && <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-muted-foreground">No open requests. Hope everyone&apos;s healthy!</p>}
                {openMine.slice(0, 3).map((r, i) => <RequestCard key={r.id} request={r} index={i} />)}
                {helpingOpen.length > 0 && (
                  <>
                    <p className="pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">You&apos;re helping</p>
                    {helpingOpen.slice(0, 2).map((r, i) => <RequestCard key={r.id} request={r} index={i} />)}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Trophy className="size-5 text-amber-400" /> Achievements</CardTitle>
                <CardDescription>{achievements.filter((a) => a.unlocked).length} of {achievements.length} unlocked</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-4 gap-2 sm:grid-cols-8 lg:grid-cols-4 xl:grid-cols-8">
                {achievements.map((a) => (
                  <Tooltip key={a.title} content={<><b>{a.title}</b><br />{a.desc}</>}>
                    <motion.div
                      whileHover={{ scale: 1.12, rotate: a.unlocked ? -6 : 0 }}
                      className={cn(
                        "grid aspect-square place-items-center rounded-2xl border",
                        a.unlocked ? "border-amber-400/30 bg-gradient-to-br from-amber-400/20 to-blood-500/20 text-amber-300 shadow-[0_0_24px_-8px_rgb(251_191_36/0.8)]" : "border-white/[0.06] bg-white/[0.02] text-white/20",
                      )}
                    >
                      <a.icon className="size-5" />
                    </motion.div>
                  </Tooltip>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function getAchievements(user: PublicUser, helped: number) {
  return [
    { icon: Droplet, title: "First drop", desc: "Log your first donation", unlocked: user.donationsCount >= 1 },
    { icon: Flame, title: "On a roll", desc: "5 donations", unlocked: user.donationsCount >= 5 },
    { icon: Star, title: "Hero", desc: "10 donations", unlocked: user.donationsCount >= 10 },
    { icon: Crown, title: "Legend", desc: "25 donations", unlocked: user.donationsCount >= 25 },
    { icon: Shield, title: "Universal", desc: "Be an O- donor", unlocked: user.bloodGroup === "O-" },
    { icon: Users, title: "First responder", desc: "Respond to a request", unlocked: helped >= 1 },
    { icon: HeartPulse, title: "Life saver", desc: "Impact 30+ lives", unlocked: user.livesImpacted >= 30 },
    { icon: user.available ? Sparkles : Award, title: "On call", desc: "Stay available for donors", unlocked: user.available && user.isDonor },
  ];
}
