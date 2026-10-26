"use client";
import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatDistanceToNow, isPast } from "date-fns";
import { Building2, Clock, MapPin, Users, ChevronRight } from "lucide-react";
import type { PublicRequest } from "@/lib/client";
import { BloodBadge } from "@/components/blood-group";
import { Badge } from "@/components/ui/badge";
import { cn, formatKm } from "@/lib/utils";

export const URGENCY_STYLES: Record<string, { label: string; variant: "critical" | "warning" | "secondary"; bar: string }> = {
  critical: { label: "Critical", variant: "critical", bar: "from-red-500 to-red-700" },
  high: { label: "Urgent", variant: "warning", bar: "from-orange-400 to-orange-600" },
  normal: { label: "Normal", variant: "secondary", bar: "from-blood-400 to-blood-600" },
};

export function StatusBadge({ status }: { status: string }) {
  if (status === "fulfilled") return <Badge variant="success">Fulfilled</Badge>;
  if (status === "cancelled") return <Badge variant="secondary">Cancelled</Badge>;
  return <Badge variant="info">Open</Badge>;
}

export function RequestCard({ request: r, selected, onSelect, index = 0 }: { request: PublicRequest; selected?: boolean; onSelect?: () => void; index?: number }) {
  const u = URGENCY_STYLES[r.urgency] ?? URGENCY_STYLES.normal!;
  const pct = Math.min(100, (r.unitsFulfilled / r.units) * 100);
  const overdue = isPast(new Date(r.neededBy));
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      onMouseEnter={onSelect}
    >
      <Link
        href={`/requests/${r.id}`}
        className={cn(
          "group relative block overflow-hidden rounded-2xl border p-4 transition-all duration-200",
          selected ? "border-blood-400/50 bg-blood-500/[0.07]" : "border-white/[0.07] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]",
          r.urgency === "critical" && r.status === "open" && "shadow-[0_0_40px_-16px_rgb(239_68_68)]",
        )}
      >
        <span className={cn("absolute inset-y-0 left-0 w-1 bg-gradient-to-b", u.bar)} />
        <div className="flex items-start gap-3 pl-1">
          <BloodBadge group={r.bloodGroup} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {r.status === "open" ? <Badge variant={u.variant}>{r.urgency === "critical" && <span className="size-1.5 animate-ping rounded-full bg-red-400" />}{u.label}</Badge> : <StatusBadge status={r.status} />}
              {r.hasResponded && <Badge variant="success">You responded</Badge>}
              {r.isOwner && <Badge variant="info">Your request</Badge>}
            </div>
            <p className="mt-1.5 truncate font-semibold">
              {r.units} unit{r.units > 1 ? "s" : ""} for {r.patientName}
            </p>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Building2 className="size-3" /> {r.hospital}</span>
              {r.distanceKm != null && <span className="inline-flex items-center gap-1"><MapPin className="size-3" /> {formatKm(r.distanceKm)}</span>}
            </div>
          </div>
          <ChevronRight className="mt-1 size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </div>
        <div className="mt-3 flex items-center gap-3 pl-1 text-xs">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300" />
          </div>
          <span className="tabular-nums text-muted-foreground">{r.unitsFulfilled}/{r.units}</span>
          <span className="inline-flex items-center gap-1 text-muted-foreground"><Users className="size-3" /> {r.responderCount}</span>
          <span className={cn("inline-flex items-center gap-1", overdue && r.status === "open" ? "text-red-300" : "text-muted-foreground")}>
            <Clock className="size-3" />
            {overdue ? "needed " : "by "}
            {formatDistanceToNow(new Date(r.neededBy), { addSuffix: overdue })}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
