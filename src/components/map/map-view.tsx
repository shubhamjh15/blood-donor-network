"use client";
import * as React from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { GROUP_HEX } from "@/components/blood-group";
import type { BloodGroup } from "@/lib/blood";

export type MapMarker = {
  id: string;
  coordinates: [number, number]; // [lng, lat]
  kind: "donor" | "request";
  label: string;
  group?: string;
  urgency?: string;
  dim?: boolean;
  popup?: React.ReactNode;
};

export type MapViewProps = {
  center: [number, number]; // [lng, lat]
  zoom?: number;
  markers?: MapMarker[];
  radiusKm?: number;
  showSelf?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onMapClick?: (coords: [number, number]) => void;
  draggableSelf?: boolean;
  onSelfMove?: (coords: [number, number]) => void;
  className?: string;
  fitRadius?: boolean;
};

const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

const iconCache = new Map<string, L.DivIcon>();
function markerIcon(m: MapMarker, selected: boolean) {
  const key = `${m.kind}-${m.group}-${m.urgency}-${m.dim}-${selected}`;
  const cached = iconCache.get(key);
  if (cached) return cached;
  const color = m.kind === "request" ? (m.urgency === "critical" ? "#ef4444" : m.urgency === "high" ? "#f97316" : "#ff2d55") : GROUP_HEX[m.group as BloodGroup] ?? "#ff2d55";
  const size = m.kind === "request" ? 40 : selected ? 38 : 30;
  const shape = m.kind === "request" ? "border-radius:12px 12px 12px 2px;transform:rotate(-45deg)" : "";
  const inner = m.kind === "request" ? `<span style="transform:rotate(45deg)">${m.group}</span>` : m.group;
  const ring = !m.dim && (m.kind === "request" || selected) ? `<span class="ring" style="background:${color}55"></span>` : "";
  const icon = L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    html: `<div class="bl-marker ${m.dim ? "dim" : ""}" style="width:${size}px;height:${size}px">${ring}<div class="pin" style="width:${size}px;height:${size}px;background:linear-gradient(135deg,${color},${color}bb);${shape};${selected ? "box-shadow:0 0 0 4px #fff3,0 8px 30px " + color : ""}">${inner}</div></div>`,
  });
  iconCache.set(key, icon);
  return icon;
}

const selfIcon = L.divIcon({
  className: "",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  html: `<div class="bl-marker" style="width:22px;height:22px"><span class="ring" style="background:#38bdf866"></span><div class="pin" style="width:22px;height:22px;background:#0ea5e9;box-shadow:0 0 20px #38bdf8"></div></div>`,
});

function FlyTo({ center, zoom, radiusKm, fitRadius }: { center: [number, number]; zoom?: number; radiusKm?: number; fitRadius?: boolean }) {
  const map = useMap();
  const first = React.useRef(true);
  React.useEffect(() => {
    const latlng = L.latLng(center[1], center[0]);
    if (fitRadius && radiusKm) {
      const bounds = latlng.toBounds(radiusKm * 2000);
      if (first.current) map.fitBounds(bounds, { animate: false });
      else map.flyToBounds(bounds, { duration: 0.9, padding: [20, 20] });
    } else if (first.current) {
      map.setView(latlng, zoom ?? map.getZoom(), { animate: false });
    } else {
      map.flyTo(latlng, zoom ?? map.getZoom(), { duration: 0.9 });
    }
    first.current = false;
  }, [center[0], center[1], radiusKm, fitRadius]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function ClickHandler({ onMapClick }: { onMapClick?: (c: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      onMapClick?.([e.latlng.lng, e.latlng.lat]);
    },
  });
  return null;
}

function SelectedPan({ selected }: { selected?: MapMarker }) {
  const map = useMap();
  React.useEffect(() => {
    if (selected) map.panTo([selected.coordinates[1], selected.coordinates[0]], { animate: true });
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function MapView({
  center,
  zoom = 12,
  markers = [],
  radiusKm,
  showSelf = true,
  selectedId,
  onSelect,
  onMapClick,
  draggableSelf,
  onSelfMove,
  className,
  fitRadius,
}: MapViewProps) {
  const selected = markers.find((m) => m.id === selectedId);
  return (
    <MapContainer
      center={[center[1], center[0]]}
      zoom={zoom}
      zoomControl
      scrollWheelZoom
      className={className}
      style={{ height: "100%", width: "100%" }}
      attributionControl
    >
      <TileLayer url={TILE_URL} attribution={ATTRIBUTION} subdomains="abcd" maxZoom={19} />
      <FlyTo center={center} zoom={zoom} radiusKm={radiusKm} fitRadius={fitRadius} />
      <ClickHandler onMapClick={onMapClick} />
      <SelectedPan selected={selected} />

      {radiusKm && (
        <Circle
          center={[center[1], center[0]]}
          radius={radiusKm * 1000}
          pathOptions={{ color: "#ff2d55", weight: 1, opacity: 0.5, fillColor: "#ff2d55", fillOpacity: 0.05, dashArray: "6 6" }}
        />
      )}

      {showSelf && (
        <Marker
          position={[center[1], center[0]]}
          icon={selfIcon}
          draggable={draggableSelf}
          zIndexOffset={1000}
          eventHandlers={{
            dragend: (e) => {
              const ll = (e.target as L.Marker).getLatLng();
              onSelfMove?.([ll.lng, ll.lat]);
            },
          }}
        />
      )}

      {markers.map((m) => (
        <Marker
          key={m.id}
          position={[m.coordinates[1], m.coordinates[0]]}
          icon={markerIcon(m, m.id === selectedId)}
          zIndexOffset={m.id === selectedId ? 900 : m.kind === "request" ? 500 : 0}
          eventHandlers={{ click: () => onSelect?.(m.id) }}
        >
          {m.popup && <Popup closeButton={false}>{m.popup}</Popup>}
        </Marker>
      ))}
    </MapContainer>
  );
}
