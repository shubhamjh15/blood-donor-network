"use client";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/primitives";
import type { MapViewProps } from "./map-view";

export type { MapMarker, MapViewProps } from "./map-view";

// Leaflet touches `window`, so it must only load in the browser.
export const MapView = dynamic<MapViewProps>(() => import("./map-view"), {
  ssr: false,
  loading: () => <Skeleton className="size-full rounded-none" />,
});
