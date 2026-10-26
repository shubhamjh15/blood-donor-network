"use client";
import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import useSWR from "swr";
import { motion, useScroll, useTransform } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, BellRing, HeartPulse, MapPinned, ShieldCheck, Siren, Sparkles, Timer, Users, Zap, Droplets, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Aurora, Magnetic, Marquee, NumberTicker, Reveal, SpotlightCard, TiltCard } from "@/components/effects";
import { BloodBadge, GROUP_HEX } from "@/components/blood-group";
import { CompatibilityExplorer } from "@/components/compatibility-explorer";
import { EligibilityChecker } from "@/components/eligibility-checker";
import { useMe } from "@/lib/client";
import { SafeScene, SceneFallback } from "@/components/three/safe-scene";
import { cn } from "@/lib/utils";

const HeroScene = dynamic(() => import("@/components/three/hero-scene"), { ssr: false, loading: () => <SceneFallback /> });
const GlobeScene = dynamic(() => import("@/components/three/globe-scene"), { ssr: false, loading: () => <SceneFallback /> });

type Stats = {
  donors: number;
  available: number;
  openRequests: number;
  fulfilled: number;
  donations: number;
  livesImpacted: number;
  cities: number;
  byGroup: { group: string; count: number }[];
  donorPoints: { c: [number, number]; g: string }[];
  activity: { id: string; bloodGroup: string; hospital: string; urgency: string; status: string; units: number; createdAt: string }[];
};

const HEADLINE = ["Every", "drop", "finds", "its", "way."];

export function Landing() {
  const { data: stats } = useSWR<Stats>("/api/stats", { refreshInterval: 30_000 });
  const { user } = useMe();
  const heroRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const sceneY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const sceneOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  const donorPoints = React.useMemo(() => stats?.donorPoints.map((p) => p.c) ?? [], [stats]);

  return (
    <div className="overflow-hidden">
      {/* ---------------- HERO ---------------- */}
      <section ref={heroRef} className="relative min-h-[100dvh] pt-28">
        <Aurora />
        <div className="absolute inset-0 bg-grid mask-radial opacity-60" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-6 lg:grid-cols-2">
          <motion.div style={{ y: textY }} className="relative z-10 pt-10 lg:pt-0">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Badge className="gap-2 py-1 pl-1.5 pr-3 text-xs">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-blood-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-blood-500" />
                </span>
                {stats ? `${stats.available.toLocaleString()} donors available right now` : "Live donor network"}
              </Badge>
            </motion.div>

            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              {HEADLINE.map((w, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 40, rotateX: -60, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
                  transition={{ delay: 0.15 + i * 0.08, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className={cn("mr-[0.22em] inline-block", i >= 3 && "text-gradient")}
                >
                  {w}
                </motion.span>
              ))}
            </h1>

            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Bloodline connects patients with compatible donors nearby in real time. Post an emergency request and the right people get alerted in seconds.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }} className="mt-9 flex flex-wrap items-center gap-3">
              <Magnetic>
                <Button asChild size="xl">
                  <Link href={user ? "/requests/new" : "/find"}>
                    {user ? <><Siren /> Request blood now</> : <><MapPinned /> Find donors near me</>}
                  </Link>
                </Button>
              </Magnetic>
              <Button asChild size="xl" variant="secondary">
                <Link href={user ? "/dashboard" : "/register"}>
                  {user ? "Open dashboard" : "Become a donor"} <ArrowRight />
                </Link>
              </Button>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-12 flex items-center gap-6">
              <div className="flex -space-x-3">
                {["O-", "A+", "B+", "AB-", "O+"].map((g, i) => (
                  <motion.div key={g} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.05 + i * 0.07, type: "spring" }}>
                    <BloodBadge group={g} size="sm" className="rounded-full ring-2 ring-background" />
                  </motion.div>
                ))}
              </div>
              <div className="text-sm">
                <p className="font-semibold"><NumberTicker value={stats?.donors ?? 0} /> registered donors</p>
                <p className="text-muted-foreground">across <NumberTicker value={stats?.cities ?? 0} /> {stats?.cities === 1 ? "city" : "cities"} · all 8 blood types</p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div style={{ y: sceneY, opacity: sceneOpacity }} className="relative h-[460px] sm:h-[560px] lg:h-[680px]">
            <div className="absolute inset-[15%] rounded-full bg-blood-600/30 blur-[100px]" />
            {/* Canvas bleeds past the column so orbiting cells aren't clipped; edges fade out */}
            <div className="absolute inset-y-0 -left-[30%] -right-[30%] [mask-image:linear-gradient(to_right,transparent,black_22%,black_78%,transparent)]">
              <SafeScene><HeroScene /></SafeScene>
            </div>
            <FloatingChip className="left-0 top-[18%]" delay={1.2} icon={<Zap className="size-4 text-amber-300" />} title="Open requests" value={stats ? stats.openRequests.toLocaleString() : "—"} />
            <FloatingChip className="right-0 top-[55%]" delay={1.4} icon={<HeartPulse className="size-4 text-blood-300" />} title="Lives impacted" value={stats ? stats.livesImpacted.toLocaleString() : "—"} />
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs text-muted-foreground lg:flex">
          scroll
          <span className="h-10 w-px animate-pulse bg-gradient-to-b from-blood-500 to-transparent" />
        </motion.div>
      </section>

      {/* ---------------- LIVE TICKER ---------------- */}
      {stats?.activity?.length ? (
        <section className="relative border-y border-white/[0.06] bg-white/[0.015] py-5">
          <Marquee>
            {stats.activity.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-full border border-white/[0.07] bg-background/60 py-1.5 pl-1.5 pr-4 text-sm">
                <BloodBadge group={a.bloodGroup} size="sm" className="rounded-full" />
                <span className="text-muted-foreground">
                  <span className={cn("font-semibold", a.status === "fulfilled" ? "text-emerald-300" : a.urgency === "critical" ? "text-red-300" : "text-foreground")}>
                    {a.status === "fulfilled" ? "Fulfilled" : a.urgency === "critical" ? "Critical need" : "Needed"}
                  </span>{" "}
                  · {a.units} unit{a.units > 1 ? "s" : ""} at {a.hospital}
                </span>
                <span className="text-xs text-muted-foreground/60">{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</span>
              </div>
            ))}
          </Marquee>
        </section>
      ) : null}

      {/* ---------------- STATS ---------------- */}
      <section className="relative mx-auto max-w-6xl px-6 py-24">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Registered donors", value: stats?.donors ?? 0, icon: Users },
            { label: "Available now", value: stats?.available ?? 0, icon: Activity },
            { label: "Requests fulfilled", value: stats?.fulfilled ?? 0, icon: ShieldCheck },
            { label: "Lives impacted", value: stats?.livesImpacted ?? 0, icon: HeartPulse },
          ].map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08}>
              <SpotlightCard className="p-6">
                <s.icon className="size-5 text-blood-400" />
                <p className="mt-6 font-display text-4xl font-bold tracking-tight sm:text-5xl">
                  <NumberTicker value={s.value} />
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- HOW IT WORKS ---------------- */}
      <section id="how" className="relative mx-auto max-w-6xl scroll-mt-24 px-6 py-16">
        <Reveal>
          <SectionHeading eyebrow="How it works" title="From emergency to donor in minutes" subtitle="No more frantic WhatsApp forwards. Bloodline routes each request to the right people, ranked by distance and compatibility." />
        </Reveal>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {[
            { icon: Siren, title: "Post a request", body: "Add the patient's blood type, hospital and urgency. Pin the exact location on the map.", accent: "255,45,85" },
            { icon: BellRing, title: "Donors get alerted", body: "Compatible, eligible donors within range are notified instantly, with a wider radius for critical cases.", accent: "249,115,22" },
            { icon: HeartPulse, title: "Connect & save a life", body: "Donors respond with one tap. You see who's coming, call them, and confirm when they've donated.", accent: "217,70,239" },
          ].map((s, i) => (
            <Reveal key={s.title} delay={i * 0.1}>
              <TiltCard className="h-full rounded-3xl" max={6}>
                <SpotlightCard glow={s.accent} className="h-full p-7">
                  <div className="flex items-center justify-between">
                    <div className="grid size-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]" style={{ boxShadow: `0 10px 40px -10px rgba(${s.accent},0.6)` }}>
                      <s.icon className="size-5" style={{ color: `rgb(${s.accent})` }} />
                    </div>
                    <span className="font-display text-5xl font-bold text-white/[0.06]">0{i + 1}</span>
                  </div>
                  <h3 className="mt-8 font-display text-xl font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </SpotlightCard>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- FEATURES BENTO ---------------- */}
      <section className="relative mx-auto max-w-6xl px-6 py-16">
        <div className="grid auto-rows-[minmax(200px,auto)] gap-4 md:grid-cols-6">
          <Reveal className="md:col-span-4">
            <SpotlightCard className="h-full p-7">
              <MapPinned className="size-6 text-blood-400" />
              <h3 className="mt-4 font-display text-2xl font-semibold">Geo-matched in real time</h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">MongoDB geospatial queries rank every donor by real distance from the hospital. Filter by type, radius and eligibility, live on a map.</p>
              <div className="relative mt-6 h-40 overflow-hidden rounded-2xl border border-white/[0.07] bg-dots">
                {[...Array(18)].map((_, i) => {
                  const g = ["O-", "O+", "A+", "B+", "AB+", "A-"][i % 6]!;
                  return (
                    <motion.div
                      key={i}
                      className="absolute size-3 rounded-full"
                      style={{ left: `${(i * 37) % 95}%`, top: `${(i * 53) % 85}%`, background: GROUP_HEX[g as keyof typeof GROUP_HEX], boxShadow: `0 0 14px ${GROUP_HEX[g as keyof typeof GROUP_HEX]}` }}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.15 }}
                    />
                  );
                })}
                <div className="absolute left-1/2 top-1/2 size-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-blood-500/50 bg-blood-500/5" />
                <div className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400 shadow-[0_0_20px_#38bdf8]" />
              </div>
            </SpotlightCard>
          </Reveal>
          <Reveal className="md:col-span-2" delay={0.1}>
            <SpotlightCard className="h-full p-7" glow="52,211,153">
              <Timer className="size-6 text-emerald-400" />
              <h3 className="mt-4 font-display text-2xl font-semibold">Smart eligibility</h3>
              <p className="mt-2 text-sm text-muted-foreground">We track your last donation and only alert you when you&apos;re ready to give again.</p>
              <div className="mt-6 flex items-end gap-1.5">
                {[30, 55, 40, 75, 60, 90, 100].map((h, i) => (
                  <motion.div key={i} initial={{ height: 0 }} whileInView={{ height: h }} viewport={{ once: true }} transition={{ delay: i * 0.06, duration: 0.6 }} className="flex-1 rounded-t-md bg-gradient-to-t from-emerald-600/40 to-emerald-400" />
                ))}
              </div>
            </SpotlightCard>
          </Reveal>
          <Reveal className="md:col-span-2" delay={0.05}>
            <SpotlightCard className="h-full p-7" glow="249,115,22">
              <BellRing className="size-6 text-orange-400" />
              <h3 className="mt-4 font-display text-2xl font-semibold">Urgency-aware alerts</h3>
              <p className="mt-2 text-sm text-muted-foreground">Critical requests reach donors up to 40 km away. Normal ones stay local.</p>
            </SpotlightCard>
          </Reveal>
          <Reveal className="md:col-span-2" delay={0.1}>
            <SpotlightCard className="h-full p-7" glow="56,189,248">
              <ShieldCheck className="size-6 text-sky-400" />
              <h3 className="mt-4 font-display text-2xl font-semibold">Privacy first</h3>
              <p className="mt-2 text-sm text-muted-foreground">Phone numbers are only shown to signed-in members, and responder contacts only to the requester.</p>
            </SpotlightCard>
          </Reveal>
          <Reveal className="md:col-span-2" delay={0.15}>
            <SpotlightCard className="h-full p-7" glow="217,70,239">
              <Sparkles className="size-6 text-fuchsia-400" />
              <h3 className="mt-4 font-display text-2xl font-semibold">Hero recognition</h3>
              <p className="mt-2 text-sm text-muted-foreground">Every confirmed donation counts toward your impact and your place on the Hero board.</p>
            </SpotlightCard>
          </Reveal>
        </div>
      </section>

      {/* ---------------- COMPATIBILITY ---------------- */}
      <section id="compatibility" className="relative mx-auto max-w-6xl scroll-mt-24 px-6 py-24">
        <Reveal>
          <SectionHeading eyebrow="Compatibility" title="Who can save whom?" subtitle="Tap a blood type to see exactly who it can give to and receive from. Bloodline applies these rules automatically when matching." />
        </Reveal>
        <Reveal delay={0.1} className="mt-14">
          <CompatibilityExplorer />
        </Reveal>
      </section>

      {/* ---------------- GLOBE ---------------- */}
      <section className="relative py-24">
        <Aurora className="opacity-50" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 lg:grid-cols-2">
          <Reveal>
            <SectionHeading align="left" eyebrow="The network" title="A network that never sleeps" subtitle="Every red dot is a real donor on Bloodline. Drag the globe to explore." />
            <div className="mt-10 space-y-3">
              {(stats?.byGroup ?? []).map((g, i) => {
                const max = Math.max(1, ...(stats?.byGroup ?? []).map((x) => x.count));
                return (
                  <div key={g.group} className="flex items-center gap-3">
                    <span className="w-9 font-display text-sm font-bold">{g.group}</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${(g.count / max) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${GROUP_HEX[g.group as keyof typeof GROUP_HEX]}55, ${GROUP_HEX[g.group as keyof typeof GROUP_HEX]})` }}
                      />
                    </div>
                    <span className="w-10 text-right text-sm tabular-nums text-muted-foreground">{g.count}</span>
                  </div>
                );
              })}
            </div>
          </Reveal>
          <div className="relative h-[420px] cursor-grab active:cursor-grabbing sm:h-[520px]">
            <SafeScene><GlobeScene donorPoints={donorPoints} /></SafeScene>
          </div>
        </div>
      </section>

      {/* ---------------- ELIGIBILITY ---------------- */}
      <section id="eligibility" className="relative mx-auto max-w-6xl scroll-mt-24 px-6 py-24">
        <Reveal>
          <SectionHeading eyebrow="30-second check" title="Can I donate today?" subtitle="A quick self-check based on common guidelines. Your blood bank will confirm on the day." />
        </Reveal>
        <Reveal delay={0.1}>
          <SpotlightCard className="mt-12 p-8 sm:p-12">
            <EligibilityChecker />
          </SpotlightCard>
        </Reveal>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="relative mx-auto max-w-6xl px-6 py-16">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-blood-500/30 bg-gradient-to-br from-blood-700/40 via-blood-900/30 to-background p-10 text-center sm:p-16">
            <div className="absolute inset-0 bg-grid opacity-40 mask-radial" />
            <div className="absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-blood-500/40 blur-[100px]" />
            <Droplets className="relative mx-auto size-10 text-blood-300" />
            <h2 className="relative mx-auto mt-6 max-w-2xl font-display text-4xl font-bold tracking-tight sm:text-5xl">One donation can save up to three lives.</h2>
            <p className="relative mx-auto mt-4 max-w-lg text-muted-foreground">Join thousands of everyday heroes. It takes less than a minute to sign up.</p>
            <div className="relative mt-10 flex flex-wrap justify-center gap-3">
              <Magnetic>
                <Button asChild size="xl" variant="white"><Link href={user ? "/dashboard" : "/register"}>{user ? "Go to dashboard" : "Join Bloodline"} <ArrowRight /></Link></Button>
              </Magnetic>
              <Button asChild size="xl" variant="secondary"><Link href="/requests">See live requests</Link></Button>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

function FloatingChip({ className, delay, icon, title, value }: { className?: string; delay: number; icon: React.ReactNode; title: string; value: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 200, damping: 18 }}
      className={cn("glass absolute z-10 hidden items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl sm:flex animate-float", className)}
    >
      <div className="grid size-9 place-items-center rounded-xl bg-white/[0.06]">{icon}</div>
      <div>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{title}</p>
        <p className="font-display text-lg font-bold leading-tight">{value}</p>
      </div>
    </motion.div>
  );
}

export function SectionHeading({ eyebrow, title, subtitle, align = "center" }: { eyebrow: string; title: string; subtitle?: string; align?: "center" | "left" }) {
  return (
    <div className={cn(align === "center" && "mx-auto max-w-2xl text-center")}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blood-400">{eyebrow}</p>
      <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">{title}</h2>
      {subtitle && <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
