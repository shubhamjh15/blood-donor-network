"use client";
import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, MapPin, MessageCircle, Phone, Droplet } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { PublicUser } from "@/lib/client";
import { daysUntilEligible } from "@/lib/blood";
import { formatKm, cn } from "@/lib/utils";
import { BloodBadge } from "@/components/blood-group";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/primitives";

export function DonorCard({ donor, selected, onSelect, authed, index = 0 }: { donor: PublicUser; selected?: boolean; onSelect?: () => void; authed: boolean; index?: number }) {
  const wait = daysUntilEligible(donor.lastDonation);
  const wa = donor.phone ? `https://wa.me/${donor.phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(`Hi ${donor.name.split(" ")[0]}, I found you on Bloodline. We urgently need ${donor.bloodGroup} blood — could you help?`)}` : undefined;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      onClick={onSelect}
      className={cn(
        "group relative cursor-pointer rounded-2xl border p-4 transition-all duration-200",
        selected ? "border-blood-400/50 bg-blood-500/[0.07] shadow-[0_0_40px_-12px_rgb(255_45_85/0.7)]" : "border-white/[0.07] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <Avatar name={donor.name} className="size-11" />
          <span className={cn("absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-background", donor.available ? "bg-emerald-400" : "bg-zinc-500")} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold">{donor.name}</p>
            {donor.donationsCount >= 10 && <Badge variant="warning" className="shrink-0">⭐ Hero</Badge>}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><MapPin className="size-3" /> {formatKm(donor.distanceKm)} away</span>
            <span className="inline-flex items-center gap-1"><Droplet className="size-3" /> {donor.donationsCount} donations</span>
            {donor.lastActiveAt && <span className="inline-flex items-center gap-1"><Clock className="size-3" /> active {formatDistanceToNow(new Date(donor.lastActiveAt), { addSuffix: true })}</span>}
          </div>
        </div>
        <BloodBadge group={donor.bloodGroup} />
      </div>

      <div className="mt-3 flex items-center gap-2">
        {wait > 0 ? (
          <Badge variant="secondary">Eligible in {wait}d</Badge>
        ) : (
          <Badge variant="success">Eligible to donate</Badge>
        )}
        {!donor.available && <Badge variant="secondary">Unavailable</Badge>}
        <div className="ml-auto flex gap-1.5" onClick={(e) => e.stopPropagation()}>
          {authed && donor.phone ? (
            <>
              <Button asChild size="sm" variant="secondary"><a href={`tel:${donor.phone}`}><Phone /> Call</a></Button>
              <Button asChild size="sm" variant="success"><a href={wa} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp</a></Button>
            </>
          ) : (
            <Button asChild size="sm" variant="outline"><Link href="/login?next=/find">Sign in to contact</Link></Button>
          )}
        </div>
      </div>
      {selected && donor.bio && <p className="mt-3 border-t border-white/[0.06] pt-3 text-sm text-muted-foreground">&ldquo;{donor.bio}&rdquo;</p>}
    </motion.div>
  );
}
