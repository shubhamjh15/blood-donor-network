"use client";
import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { AnimatePresence, motion } from "framer-motion";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { ArrowLeft, BellRing, Building2, CheckCircle2, Clock, HeartHandshake, MapPin, MessageCircle, Navigation, Phone, Share2, Undo2, XCircle, RotateCcw, Users, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { api, useMe, type PublicRequest } from "@/lib/client";
import { CAN_RECEIVE_FROM, daysUntilEligible, type BloodGroup } from "@/lib/blood";
import { MapView } from "@/components/map";
import { BloodBadge } from "@/components/blood-group";
import { StatusBadge, URGENCY_STYLES } from "@/components/request-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { Avatar, Skeleton } from "@/components/ui/primitives";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Aurora } from "@/components/effects";
import { cn } from "@/lib/utils";

function useCountdown(target: string) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, new Date(target).getTime() - now);
  return { h: Math.floor(diff / 3_600_000), m: Math.floor((diff / 60_000) % 60), s: Math.floor((diff / 1000) % 60), done: diff === 0 };
}

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useMe();
  const { data, error, mutate } = useSWR<{ request: PublicRequest }>(`/api/requests/${id}`, { refreshInterval: 15_000 });
  const [respondOpen, setRespondOpen] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [busy, setBusy] = React.useState<string | null>(null);

  if (error) {
    return (
      <div className="mx-auto flex min-h-[70dvh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <XCircle className="size-10 text-muted-foreground" />
        <h1 className="font-display text-2xl font-bold">Request not found</h1>
        <Button asChild variant="secondary"><Link href="/requests"><ArrowLeft /> Back to requests</Link></Button>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 pt-28">
        <Skeleton className="h-56" />
        <div className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-80" /><Skeleton className="h-80" /></div>
      </div>
    );
  }

  const r = data.request;
  const u = URGENCY_STYLES[r.urgency] ?? URGENCY_STYLES.normal!;
  const compatible = user ? CAN_RECEIVE_FROM[r.bloodGroup as BloodGroup].includes(user.bloodGroup as BloodGroup) : false;
  const wait = user ? daysUntilEligible(user.lastDonation) : 0;

  const run = async (key: string, fn: () => Promise<{ request: PublicRequest }>, success: string) => {
    setBusy(key);
    try {
      const res = await fn();
      await mutate(res, { revalidate: false });
      toast.success(success);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const share = async () => {
    const url = window.location.href;
    const text = `🩸 ${r.bloodGroup} blood needed urgently at ${r.hospital}. ${r.units} unit(s) for ${r.patientName}. Can you help?`;
    if (navigator.share) {
      await navigator.share({ title: "Blood needed", text, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(`${text} ${url}`);
      toast.success("Link copied to clipboard");
    }
  };

  const directions = `https://www.google.com/maps/dir/?api=1&destination=${r.coordinates[1]},${r.coordinates[0]}`;
  const activeResponders = r.responders.filter((x) => x.status !== "withdrawn");

  return (
    <div className="relative">
      <Aurora className="opacity-40" />
      <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-24">
        <Link href="/requests" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> All requests</Link>

        {/* ---------- Header ---------- */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <Card className={cn("overflow-hidden p-6 sm:p-8", r.urgency === "critical" && r.status === "open" && "border-red-500/30")}>
            <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", u.bar)} />
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <motion.div initial={{ scale: 0.6, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, damping: 12 }}>
                <BloodBadge group={r.bloodGroup} size="xl" className="size-24 rounded-3xl text-3xl" />
              </motion.div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {r.status === "open" ? <Badge variant={u.variant}>{u.label}</Badge> : <StatusBadge status={r.status} />}
                  <span className="text-xs text-muted-foreground">Posted {r.createdAt ? formatDistanceToNow(new Date(r.createdAt), { addSuffix: true }) : ""} by {r.isOwner ? "you" : r.requester.name}</span>
                </div>
                <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  {r.units} unit{r.units > 1 ? "s" : ""} of {r.bloodGroup} for {r.patientName}
                </h1>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><Building2 className="size-4" /> {r.hospital}</span>
                  {r.address && <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" /> {r.address}</span>}
                  <span className="inline-flex items-center gap-1.5"><BellRing className="size-4" /> {r.notifiedCount} donors alerted</span>
                </div>
              </div>
              {r.status === "open" && <Countdown target={r.neededBy} />}
            </div>

            <div className="mt-6">
              <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                <span>{r.unitsFulfilled} of {r.units} units donated</span>
                <span>{activeResponders.length} donor{activeResponders.length === 1 ? "" : "s"} responding</span>
              </div>
              <div className="relative h-3 overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-500/50 to-amber-400/50" initial={{ width: 0 }} animate={{ width: `${Math.min(100, (activeResponders.length / r.units) * 100)}%` }} transition={{ duration: 1 }} />
                <motion.div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 shadow-[0_0_20px_rgb(52_211_153/0.6)]" initial={{ width: 0 }} animate={{ width: `${Math.min(100, (r.unitsFulfilled / r.units) * 100)}%` }} transition={{ duration: 1, delay: 0.2 }} />
              </div>
            </div>

            {/* ---------- Actions ---------- */}
            <div className="mt-6 flex flex-wrap gap-2">
              {!user && r.status === "open" && <Button asChild size="lg"><Link href={`/login?next=/requests/${r.id}`}><HeartHandshake /> Sign in to help</Link></Button>}
              {user && !r.isOwner && r.status === "open" && !r.hasResponded && (
                <Button size="lg" onClick={() => setRespondOpen(true)} disabled={!compatible || wait > 0}>
                  <HeartHandshake /> {!compatible ? `${user.bloodGroup} isn't compatible` : wait > 0 ? `Eligible in ${wait} days` : "I can donate"}
                </Button>
              )}
              {user && r.hasResponded && r.status === "open" && (
                <Button size="lg" variant="danger" loading={busy === "withdraw"} onClick={() => run("withdraw", () => api(`/api/requests/${r.id}/respond`, { method: "DELETE" }), "Offer withdrawn")}><Undo2 /> Withdraw offer</Button>
              )}
              {r.contactPhone && !r.isOwner && <Button asChild size="lg" variant="secondary"><a href={`tel:${r.contactPhone}`}><Phone /> Call {r.contactPhone}</a></Button>}
              <Button asChild size="lg" variant="secondary"><a href={directions} target="_blank" rel="noreferrer"><Navigation /> Directions</a></Button>
              <Button size="lg" variant="ghost" onClick={share}><Share2 /> Share</Button>
              {r.isOwner && (
                <div className="ml-auto flex flex-wrap gap-2">
                  {r.status === "open" ? (
                    <>
                      <Button size="lg" variant="success" loading={busy === "fulfilled"} onClick={() => run("fulfilled", () => api(`/api/requests/${r.id}`, { method: "PATCH", json: { status: "fulfilled" } }), "Marked as fulfilled 🎉")}><CheckCircle2 /> Mark fulfilled</Button>
                      <Button size="lg" variant="danger" loading={busy === "cancelled"} onClick={() => run("cancelled", () => api(`/api/requests/${r.id}`, { method: "PATCH", json: { status: "cancelled" } }), "Request cancelled")}><XCircle /> Cancel</Button>
                    </>
                  ) : (
                    <Button size="lg" variant="secondary" loading={busy === "open"} onClick={() => run("open", () => api(`/api/requests/${r.id}`, { method: "PATCH", json: { status: "open" } }), "Request reopened")}><RotateCcw /> Reopen</Button>
                  )}
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          {/* ---------- Responders / details ---------- */}
          <div className="space-y-6">
            {r.note && (
              <Card className="p-6">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Note from requester</p>
                <p className="mt-2 leading-relaxed">{r.note}</p>
              </Card>
            )}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <p className="font-display text-lg font-semibold">Donors responding</p>
                <Badge variant="secondary"><Users /> {activeResponders.length}</Badge>
              </div>
              <div className="mt-4 space-y-2.5">
                {activeResponders.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-muted-foreground">
                    No responses yet. Share this request to reach more people.
                  </div>
                )}
                <AnimatePresence>
                  {activeResponders.map((x) => (
                    <motion.div key={x.userId} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3">
                      <Avatar name={x.name ?? "Donor"} />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 font-semibold">
                          {x.name}
                          {x.userId === user?.id && <span className="text-xs font-normal text-muted-foreground">(you)</span>}
                          {x.status === "donated" && <BadgeCheck className="size-4 text-emerald-400" />}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {x.bloodGroup} · {x.city} · {formatDistanceToNow(new Date(x.at), { addSuffix: true })}
                          {x.message && <> · &ldquo;{x.message}&rdquo;</>}
                        </p>
                      </div>
                      {r.isOwner && x.phone && (
                        <div className="flex gap-1.5">
                          <Button asChild size="icon-sm" variant="secondary"><a href={`tel:${x.phone}`} aria-label="Call"><Phone /></a></Button>
                          <Button asChild size="icon-sm" variant="success"><a href={`https://wa.me/${x.phone.replace(/[^\d]/g, "")}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"><MessageCircle /></a></Button>
                        </div>
                      )}
                      {r.isOwner && x.status === "accepted" && r.status === "open" && (
                        <Button size="sm" variant="success" loading={busy === `c-${x.userId}`} onClick={() => run(`c-${x.userId}`, () => api(`/api/requests/${r.id}/confirm`, { method: "POST", json: { userId: x.userId } }), `Confirmed ${x.name}'s donation ❤️`)}>
                          Donated
                        </Button>
                      )}
                      {x.status === "donated" && <Badge variant="success">Donated</Badge>}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </Card>
            <Card className="grid grid-cols-2 gap-4 p-6 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Needed by</p>
                <p className="mt-1 font-semibold">{format(new Date(r.neededBy), "EEE d MMM, h:mm a")}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Compatible donors</p>
                <p className="mt-1 font-semibold">{CAN_RECEIVE_FROM[r.bloodGroup as BloodGroup].join(", ")}</p>
              </div>
            </Card>
          </div>

          <div className="relative h-[420px] overflow-hidden rounded-3xl border border-white/[0.07] lg:h-auto lg:min-h-[480px]">
            <MapView
              center={r.coordinates}
              zoom={14}
              showSelf={false}
              markers={[{ id: r.id, coordinates: r.coordinates, kind: "request", group: r.bloodGroup, urgency: r.urgency, label: r.hospital }]}
            />
            <div className="glass absolute bottom-3 left-3 right-3 z-[500] flex items-center gap-3 rounded-2xl p-3">
              <Building2 className="size-5 text-blood-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{r.hospital}</p>
                <p className="truncate text-xs text-muted-foreground">{r.address || `${r.coordinates[1].toFixed(4)}, ${r.coordinates[0].toFixed(4)}`}</p>
              </div>
              <Button asChild size="sm"><a href={directions} target="_blank" rel="noreferrer"><Navigation /> Go</a></Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={respondOpen} onOpenChange={setRespondOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Offer to donate 💪</DialogTitle>
            <DialogDescription>{r.isOwner ? "" : `${r.requester.name ?? "The requester"} will be notified and can see your phone number to coordinate.`}</DialogDescription>
          </DialogHeader>
          <div className="mb-4 flex items-center gap-3 rounded-2xl bg-white/[0.03] p-3">
            <BloodBadge group={user?.bloodGroup ?? "O+"} size="sm" />
            <span className="text-sm text-muted-foreground">→</span>
            <BloodBadge group={r.bloodGroup} size="sm" />
            <span className="text-sm">Compatible match</span>
          </div>
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={280} placeholder="Optional message, e.g. 'I can reach in 30 minutes'" />
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRespondOpen(false)}>Cancel</Button>
            <Button
              loading={busy === "respond"}
              onClick={async () => {
                await run("respond", () => api(`/api/requests/${r.id}/respond`, { method: "POST", json: { message } }), "Thank you, hero! The requester has been notified.");
                setRespondOpen(false);
                setMessage("");
              }}
            >
              <HeartHandshake /> Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Countdown({ target }: { target: string }) {
  const { h, m, s, done } = useCountdown(target);
  if (done || isPast(new Date(target))) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-center">
        <Clock className="mx-auto size-5 text-red-300" />
        <p className="mt-1 text-sm font-semibold text-red-200">Past deadline</p>
      </div>
    );
  }
  return (
    <div className="flex gap-2">
      {[{ v: h, l: "hrs" }, { v: m, l: "min" }, { v: s, l: "sec" }].map((x) => (
        <div key={x.l} className="w-16 rounded-2xl border border-white/10 bg-white/[0.03] py-2 text-center">
          <motion.p key={x.v} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-display text-2xl font-bold tabular-nums">{String(x.v).padStart(2, "0")}</motion.p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{x.l}</p>
        </div>
      ))}
    </div>
  );
}
