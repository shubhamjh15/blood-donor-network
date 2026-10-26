"use client";
import * as React from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Crown, Droplet, HeartPulse, Medal, Search, Trophy } from "lucide-react";
import { BloodBadge } from "@/components/blood-group";
import { Input } from "@/components/ui/input";
import { Avatar, Skeleton } from "@/components/ui/primitives";
import { Aurora, NumberTicker, TiltCard } from "@/components/effects";
import { SectionHeading } from "@/components/landing/landing";
import { cn } from "@/lib/utils";

type Hero = { rank: number; id: string; name: string; bloodGroup: string; city: string; donationsCount: number; livesImpacted: number; lastDonation: string | null };

const PODIUM = [
  { cls: "from-slate-300/30 to-slate-500/10 border-slate-300/30", h: "h-32", icon: Medal, color: "text-slate-200" },
  { cls: "from-amber-300/40 to-amber-600/10 border-amber-300/40", h: "h-44", icon: Crown, color: "text-amber-300" },
  { cls: "from-orange-400/30 to-orange-700/10 border-orange-400/30", h: "h-24", icon: Medal, color: "text-orange-300" },
];

export default function HeroesPage() {
  const [city, setCity] = React.useState("");
  const [debCity, setDebCity] = React.useState("");
  React.useEffect(() => {
    const id = setTimeout(() => setDebCity(city.trim()), 400);
    return () => clearTimeout(id);
  }, [city]);
  const { data } = useSWR<{ heroes: Hero[] }>(`/api/leaderboard${debCity ? `?city=${encodeURIComponent(debCity)}` : ""}`);
  const heroes = data?.heroes ?? [];
  const top = [heroes[1], heroes[0], heroes[2]];

  return (
    <div className="relative">
      <Aurora className="opacity-40" />
      <div className="relative mx-auto max-w-5xl px-4 pb-12 pt-28">
        <SectionHeading eyebrow="Hall of fame" title="Bloodline Heroes" subtitle="The people who keep showing up. Every confirmed donation counts." />

        <div className="mx-auto mt-8 max-w-sm">
          <Input icon={<Search />} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Filter by city…" />
        </div>

        {/* Podium */}
        <div className="mt-14 grid grid-cols-3 items-end gap-3 sm:gap-6">
          {top.map((h, i) => {
            const p = PODIUM[i]!;
            if (!h) return <div key={i} />;
            return (
              <motion.div key={h.id} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: [0.2, 0, 0.35][i], type: "spring", stiffness: 120 }} className="flex flex-col items-center">
                <TiltCard className="w-full rounded-3xl" max={10}>
                  <div className="flex flex-col items-center text-center">
                    <p.icon className={cn("mb-2 size-7", p.color, i === 1 && "animate-float")} />
                    <div className="relative">
                      <Avatar name={h.name} className={cn(i === 1 ? "size-20 text-xl" : "size-14", "ring-4 ring-white/10")} />
                      <BloodBadge group={h.bloodGroup} size="sm" className="absolute -bottom-2 -right-2 rounded-full" />
                    </div>
                    <p className="mt-3 line-clamp-1 font-display font-bold sm:text-lg">{h.name}</p>
                    <p className="text-xs text-muted-foreground">{h.city}</p>
                    <div className={cn("mt-3 flex w-full flex-col items-center justify-center rounded-t-2xl border border-b-0 bg-gradient-to-b", p.cls, p.h)}>
                      <p className="font-display text-3xl font-bold"><NumberTicker value={h.donationsCount} /></p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">donations</p>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            );
          })}
        </div>

        {/* Table */}
        <div className="mt-2 overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.02]">
          {!data && <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>}
          {data && heroes.length === 0 && (
            <div className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground"><Trophy className="size-8" /> No heroes here yet. Be the first!</div>
          )}
          {heroes.slice(3).map((h, i) => (
            <motion.div
              key={h.id}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(i * 0.03, 0.4) }}
              className="flex items-center gap-4 border-b border-white/[0.05] px-4 py-3 transition-colors last:border-0 hover:bg-white/[0.03] sm:px-6"
            >
              <span className="w-6 text-center font-display font-bold text-muted-foreground">{h.rank}</span>
              <Avatar name={h.name} className="size-9" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{h.name}</p>
                <p className="truncate text-xs text-muted-foreground">{h.city}{h.lastDonation && ` · last gave ${formatDistanceToNow(new Date(h.lastDonation), { addSuffix: true })}`}</p>
              </div>
              <BloodBadge group={h.bloodGroup} size="sm" />
              <div className="hidden w-24 items-center justify-end gap-1.5 text-sm sm:flex"><HeartPulse className="size-4 text-pink-400" /> {h.livesImpacted}</div>
              <div className="flex w-16 items-center justify-end gap-1.5 font-display font-bold"><Droplet className="size-4 text-blood-400" /> {h.donationsCount}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
