"use client";
import * as React from "react";
import useSWR from "swr";
import { AnimatePresence, motion } from "framer-motion";
import { Crosshair, List, Map as MapIcon, SlidersHorizontal, Users, Info } from "lucide-react";
import { useLocation, useMe, DEFAULT_CENTER, type PublicUser } from "@/lib/client";
import { CAN_RECEIVE_FROM, type BloodGroup } from "@/lib/blood";
import { MapView, type MapMarker } from "@/components/map";
import { PlaceSearch } from "@/components/map/location-picker";
import { BloodGroupPicker, BloodBadge } from "@/components/blood-group";
import { DonorCard } from "@/components/donor-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { Skeleton, Slider, Switch, Tooltip } from "@/components/ui/primitives";
import { cn, formatKm } from "@/lib/utils";

type DonorsResponse = { donors: PublicUser[]; total: number; byGroup: { group: string; count: number }[]; authenticated: boolean };

export default function FindPage() {
  const { user } = useMe();
  const loc = useLocation(user?.coordinates ?? null);
  const center = loc.coords ?? DEFAULT_CENTER;
  const [group, setGroup] = React.useState<BloodGroup | null>(null);
  const [compatible, setCompatible] = React.useState(true);
  const [eligibleOnly, setEligibleOnly] = React.useState(false);
  const [radius, setRadius] = React.useState(15);
  const [debouncedRadius, setDebouncedRadius] = React.useState(15);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [mobileView, setMobileView] = React.useState<"list" | "map">("list");
  const listRef = React.useRef<HTMLDivElement>(null);

  // Ask for GPS once on first visit if we have nothing better
  React.useEffect(() => {
    if (loc.status === "idle" && !user) loc.locate();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    const id = setTimeout(() => setDebouncedRadius(radius), 300);
    return () => clearTimeout(id);
  }, [radius]);

  const params = new URLSearchParams({
    lat: String(center[1]),
    lng: String(center[0]),
    radius: String(debouncedRadius),
    ...(group ? { bloodGroup: group, compatible: compatible ? "1" : "0" } : {}),
    ...(eligibleOnly ? { eligibleOnly: "1" } : {}),
  });
  const { data, isLoading } = useSWR<DonorsResponse>(`/api/donors?${params}`);
  const donors = data?.donors ?? [];

  const markers: MapMarker[] = React.useMemo(
    () =>
      donors.map((d) => ({
        id: d.id,
        coordinates: d.coordinates,
        kind: "donor",
        group: d.bloodGroup,
        label: d.name,
        popup: (
          <div className="flex items-center gap-3">
            <BloodBadge group={d.bloodGroup} size="sm" />
            <div>
              <p className="font-semibold">{d.name}</p>
              <p className="text-xs text-zinc-400">{formatKm(d.distanceKm)} away · {d.donationsCount} donations</p>
            </div>
          </div>
        ),
      })),
    [donors],
  );

  const onSelect = (id: string) => {
    setSelected(id);
    const el = document.getElementById(`donor-${id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  return (
    <div className="mx-auto max-w-[1600px] px-3 pb-6 pt-24 sm:px-5">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 px-1">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Find donors near you</h1>
          <p className="mt-1 text-muted-foreground">
            {isLoading ? "Searching…" : <><span className="font-semibold text-foreground">{donors.length}</span> donor{donors.length === 1 ? "" : "s"} within {radius} km{group ? <> who can give to <span className="font-semibold text-blood-300">{group}</span></> : null}</>}
          </p>
        </div>
        <div className="flex gap-2 lg:hidden">
          <Button size="sm" variant={mobileView === "list" ? "default" : "secondary"} onClick={() => setMobileView("list")}><List /> List</Button>
          <Button size="sm" variant={mobileView === "map" ? "default" : "secondary"} onClick={() => setMobileView("map")}><MapIcon /> Map</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:h-[calc(100dvh-11rem)] lg:grid-cols-[420px_1fr]">
        {/* ---------- Sidebar ---------- */}
        <div className={cn("flex min-h-0 flex-col gap-4", mobileView === "map" && "hidden lg:flex")}>
          <div className="rounded-3xl border border-white/[0.07] bg-white/[0.02] p-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <PlaceSearch placeholder="Search location…" onPick={(r) => loc.setCoords(r.coordinates)} />
              </div>
              <Tooltip content="Use my current location">
                <Button variant="secondary" size="icon" className="h-11 w-11 shrink-0" onClick={loc.locate} loading={loc.status === "locating"}>
                  {loc.status !== "locating" && <Crosshair />}
                </Button>
              </Tooltip>
            </div>

            <div className="mt-4">
              <Label className="flex items-center gap-1.5"><SlidersHorizontal className="size-3" /> Patient blood group</Label>
              <BloodGroupPicker allowAny value={group} onChange={setGroup} className="!grid-cols-5 sm:!grid-cols-9 [&_button]:py-2 [&_span:first-of-type]:text-sm" />
            </div>

            <AnimatePresence>
              {group && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5">
                    <span className="text-sm">
                      Include all compatible types
                      <span className="block text-xs text-muted-foreground">{compatible ? CAN_RECEIVE_FROM[group].join(" · ") : `Only ${group}`}</span>
                    </span>
                    <Switch checked={compatible} onCheckedChange={setCompatible} />
                  </label>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-4 grid grid-cols-[1fr_auto] items-center gap-x-4">
              <Label className="mb-0">Radius</Label>
              <span className="font-display text-sm font-bold tabular-nums text-blood-300">{radius} km</span>
              <Slider className="col-span-2" min={1} max={100} step={1} value={[radius]} onValueChange={([v]) => setRadius(v!)} />
            </div>

            <label className="mt-2 flex cursor-pointer items-center justify-between">
              <span className="text-sm">Eligible to donate now</span>
              <Switch checked={eligibleOnly} onCheckedChange={setEligibleOnly} />
            </label>
          </div>

          {loc.status === "denied" && loc.isFallback && (
            <div className="flex items-start gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200">
              <Info className="mt-0.5 size-4 shrink-0" /> Location access is off. Showing results around {user ? "your saved location" : "the default city"}. Search a place above to change it.
            </div>
          )}

          <div ref={listRef} className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1 lg:max-h-none">
            {isLoading && !data && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
            {!isLoading && donors.length === 0 && (
              <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-white/10 p-10 text-center">
                <Users className="size-8 text-muted-foreground" />
                <p className="font-semibold">No donors found</p>
                <p className="text-sm text-muted-foreground">Try a bigger radius or turn on compatible types.</p>
                <Button size="sm" variant="secondary" onClick={() => setRadius(Math.min(100, radius * 2))}>Double the radius</Button>
              </div>
            )}
            <AnimatePresence mode="popLayout">
              {donors.map((d, i) => (
                <div id={`donor-${d.id}`} key={d.id}>
                  <DonorCard donor={d} index={i} authed={!!data?.authenticated} selected={selected === d.id} onSelect={() => setSelected(d.id)} />
                </div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* ---------- Map ---------- */}
        <div className={cn("relative h-[70dvh] overflow-hidden rounded-3xl border border-white/[0.07] lg:h-auto", mobileView === "list" && "hidden lg:block")}>
          <MapView center={center} markers={markers} radiusKm={debouncedRadius} fitRadius selectedId={selected} onSelect={onSelect} />
          {data && (
            <div className="glass pointer-events-none absolute left-3 top-3 z-[500] flex flex-wrap gap-1.5 rounded-2xl p-2">
              {data.byGroup.filter((g) => g.count > 0).map((g) => (
                <span key={g.group} className="flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-2 py-1 text-xs">
                  <span className="font-bold">{g.group}</span>
                  <span className="text-muted-foreground">{g.count}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
