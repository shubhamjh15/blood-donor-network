"use client";
import * as React from "react";
import { Crosshair, Loader2, MapPin, Search } from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { api, DEFAULT_CENTER, type Coords } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapView } from "./index";

type Result = { label: string; city: string; coordinates: Coords };

export function useReverseGeocode() {
  return React.useCallback(async (c: Coords) => {
    try {
      return await api<{ label: string; city: string }>(`/api/geocode?lat=${c[1]}&lng=${c[0]}`);
    } catch {
      return null;
    }
  }, []);
}

/** Search box with autocomplete over OpenStreetMap places. */
export function PlaceSearch({ onPick, placeholder = "Search a city, area or hospital…" }: { onPick: (r: Result) => void; placeholder?: string }) {
  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState<Result[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (q.trim().length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    const id = setTimeout(async () => {
      try {
        const res = await api<{ results: Result[] }>(`/api/geocode?q=${encodeURIComponent(q)}`);
        setResults(res.results);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 450);
    return () => clearTimeout(id);
  }, [q]);

  return (
    <div className="relative">
      <Input
        icon={loading ? <Loader2 className="animate-spin" /> : <Search />}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
      />
      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute z-[1000] mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-white/10 bg-popover/95 p-1 shadow-2xl backdrop-blur-xl"
          >
            {results.map((r, i) => (
              <li key={i}>
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-start gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-white/[0.07]"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onPick(r);
                    setQ(r.city || r.label.split(",")[0]!);
                    setOpen(false);
                  }}
                >
                  <MapPin className="mt-0.5 size-4 shrink-0 text-blood-400" />
                  <span className="line-clamp-2">{r.label}</span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Map + search + GPS for choosing a precise location. */
export function LocationPicker({
  value,
  onChange,
  height = 280,
}: {
  value: Coords | null;
  onChange: (c: Coords, city?: string) => void;
  height?: number;
}) {
  const [locating, setLocating] = React.useState(false);
  const reverse = useReverseGeocode();
  const [label, setLabel] = React.useState<string>("");

  const set = React.useCallback(
    async (c: Coords, knownCity?: string) => {
      onChange(c, knownCity);
      const r = await reverse(c);
      if (r) {
        setLabel(r.label);
        if (!knownCity && r.city) onChange(c, r.city);
      }
    },
    [onChange, reverse],
  );

  const useGps = () => {
    if (!navigator.geolocation) return toast.error("Geolocation isn't supported in this browser");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        set([pos.coords.longitude, pos.coords.latitude]);
        toast.success("Location found");
      },
      () => {
        setLocating(false);
        toast.error("Couldn't get your location — search or tap the map instead");
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <PlaceSearch onPick={(r) => set(r.coordinates, r.city)} />
        </div>
        <Button type="button" variant="secondary" onClick={useGps} loading={locating} className="h-11 shrink-0">
          {!locating && <Crosshair />} <span className="hidden sm:inline">Use GPS</span>
        </Button>
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-white/10" style={{ height }}>
        <MapView center={value ?? DEFAULT_CENTER} zoom={value ? 14 : 11} draggableSelf onSelfMove={(c) => set(c)} onMapClick={(c) => set(c)} />
        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[500] rounded-xl bg-background/80 px-3 py-2 text-xs text-muted-foreground backdrop-blur-md">
          {value ? (label || `${value[1].toFixed(4)}, ${value[0].toFixed(4)}`) : "Tap the map, drag the blue pin, search, or use GPS"}
        </div>
      </div>
    </div>
  );
}
