"use client";
import * as React from "react";
import Link from "next/link";
import useSWR from "swr";
import { AnimatePresence } from "framer-motion";
import { Crosshair, HeartHandshake, Inbox, Plus, Radar, Siren, Filter } from "lucide-react";
import { DEFAULT_CENTER, useLocation, useMe, type PublicRequest } from "@/lib/client";
import { MapView, type MapMarker } from "@/components/map";
import { PlaceSearch } from "@/components/map/location-picker";
import { RequestCard } from "@/components/request-card";
import { Button } from "@/components/ui/button";
import { Skeleton, Slider, Switch, Tabs, TabsList, TabsTrigger, Tooltip } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

type Scope = "nearby" | "mine" | "responded";

export default function RequestsPage() {
  const { user } = useMe();
  const loc = useLocation(user?.coordinates ?? null);
  const center = loc.coords ?? DEFAULT_CENTER;
  const [scope, setScope] = React.useState<Scope>("nearby");
  const [urgency, setUrgency] = React.useState<string>("");
  const [canHelp, setCanHelp] = React.useState(false);
  const [radius, setRadius] = React.useState(30);
  const [debRadius, setDebRadius] = React.useState(30);
  const [status, setStatus] = React.useState("open");
  const [selected, setSelected] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (loc.status === "idle" && !user) loc.locate();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    const id = setTimeout(() => setDebRadius(radius), 300);
    return () => clearTimeout(id);
  }, [radius]);

  const qs = new URLSearchParams({ scope, status: scope === "nearby" ? "open" : status });
  if (scope === "nearby") {
    qs.set("lat", String(center[1]));
    qs.set("lng", String(center[0]));
    qs.set("radius", String(debRadius));
    if (urgency) qs.set("urgency", urgency);
    if (canHelp && user) {
      qs.set("bloodGroup", user.bloodGroup);
      qs.set("canHelp", "1");
    }
  }
  const { data, isLoading } = useSWR<{ requests: PublicRequest[] }>(scope !== "nearby" && !user ? null : `/api/requests?${qs}`, { refreshInterval: 20_000 });
  const requests = data?.requests ?? [];

  const markers: MapMarker[] = requests.map((r) => ({
    id: r.id,
    coordinates: r.coordinates,
    kind: "request",
    group: r.bloodGroup,
    urgency: r.urgency,
    dim: r.status !== "open",
    label: r.patientName,
    popup: (
      <Link href={`/requests/${r.id}`} className="block !text-inherit">
        <p className="font-semibold">{r.bloodGroup} · {r.units} unit(s)</p>
        <p className="text-xs text-zinc-400">{r.hospital}</p>
        <p className="mt-1 text-xs font-semibold text-rose-400">View request →</p>
      </Link>
    ),
  }));

  const critical = requests.filter((r) => r.urgency === "critical" && r.status === "open").length;

  return (
    <div className="mx-auto max-w-[1600px] px-3 pb-6 pt-24 sm:px-5">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 px-1">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Blood requests</h1>
          <p className="mt-1 text-muted-foreground">
            {scope === "nearby" ? (
              <>
                <span className="font-semibold text-foreground">{requests.length}</span> open request{requests.length === 1 ? "" : "s"} within {radius} km
                {critical > 0 && <> · <span className="font-semibold text-red-300">{critical} critical</span></>}
              </>
            ) : scope === "mine" ? "Requests you've posted" : "Requests you've offered to help with"}
          </p>
        </div>
        <Button asChild><Link href="/requests/new"><Plus /> New request</Link></Button>
      </div>

      <div className="grid gap-4 lg:h-[calc(100dvh-11rem)] lg:grid-cols-[440px_1fr]">
        <div className="flex min-h-0 flex-col gap-4">
          <Tabs value={scope} onValueChange={(v) => setScope(v as Scope)}>
            <TabsList className="w-full">
              <TabsTrigger value="nearby" className="flex-1"><Radar /> Nearby</TabsTrigger>
              <TabsTrigger value="mine" className="flex-1" disabled={!user}><Inbox /> Mine</TabsTrigger>
              <TabsTrigger value="responded" className="flex-1" disabled={!user}><HeartHandshake /> Helping</TabsTrigger>
            </TabsList>
          </Tabs>

          {scope === "nearby" ? (
            <div className="space-y-4 rounded-3xl border border-white/[0.07] bg-white/[0.02] p-4">
              <div className="flex gap-2">
                <div className="flex-1"><PlaceSearch placeholder="Search location…" onPick={(r) => loc.setCoords(r.coordinates)} /></div>
                <Tooltip content="Use my location">
                  <Button variant="secondary" size="icon" className="h-11 w-11 shrink-0" onClick={loc.locate} loading={loc.status === "locating"}>{loc.status !== "locating" && <Crosshair />}</Button>
                </Tooltip>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[{ v: "", l: "All" }, { v: "critical", l: "🚨 Critical" }, { v: "high", l: "⚠️ Urgent" }, { v: "normal", l: "Normal" }].map((o) => (
                  <button
                    key={o.v}
                    onClick={() => setUrgency(o.v)}
                    className={cn("cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition", urgency === o.v ? "border-blood-400/60 bg-blood-500/15 text-white" : "border-white/10 text-muted-foreground hover:text-foreground")}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-[1fr_auto] items-center gap-x-4">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Radius</span>
                <span className="font-display text-sm font-bold text-blood-300">{radius} km</span>
                <Slider className="col-span-2" min={2} max={200} value={[radius]} onValueChange={([v]) => setRadius(v!)} />
              </div>
              {user && (
                <label className="flex cursor-pointer items-center justify-between gap-3">
                  <span className="text-sm">Only requests my <b className="text-blood-300">{user.bloodGroup}</b> can help</span>
                  <Switch checked={canHelp} onCheckedChange={setCanHelp} />
                </label>
              )}
            </div>
          ) : (
            <div className="flex gap-1.5">
              {["open", "fulfilled", "cancelled", "all"].map((s) => (
                <button key={s} onClick={() => setStatus(s)} className={cn("cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition", status === s ? "border-blood-400/60 bg-blood-500/15" : "border-white/10 text-muted-foreground")}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1">
            {isLoading && !data && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
            {data && requests.length === 0 && (
              <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-white/10 p-10 text-center">
                {scope === "nearby" ? <Siren className="size-8 text-muted-foreground" /> : <Filter className="size-8 text-muted-foreground" />}
                <p className="font-semibold">{scope === "nearby" ? "No open requests nearby" : "Nothing here yet"}</p>
                <p className="text-sm text-muted-foreground">{scope === "nearby" ? "That's good news! Try widening the radius." : "Requests will show up here."}</p>
              </div>
            )}
            <AnimatePresence mode="popLayout">
              {requests.map((r, i) => (
                <RequestCard key={r.id} request={r} index={i} selected={selected === r.id} onSelect={() => setSelected(r.id)} />
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="relative h-[60dvh] overflow-hidden rounded-3xl border border-white/[0.07] lg:h-auto">
          <MapView center={center} markers={markers} radiusKm={scope === "nearby" ? debRadius : undefined} fitRadius={scope === "nearby"} selectedId={selected} onSelect={setSelected} />
          <div className="glass pointer-events-none absolute bottom-3 left-3 z-[500] flex gap-3 rounded-xl px-3 py-2 text-xs">
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-red-500" /> Critical</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-orange-500" /> Urgent</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-blood-500" /> Normal</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-sky-400" /> You</span>
          </div>
        </div>
      </div>
    </div>
  );
}
