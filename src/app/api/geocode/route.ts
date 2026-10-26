import { NextResponse } from "next/server";
import { handler, HttpError } from "@/lib/auth";

const UA = "Bloodline/1.0 (blood donor network demo)";

/**
 * Proxy to OpenStreetMap Nominatim (free, no key).
 *   ?q=place name        → search results
 *   ?lat=..&lng=..       → reverse geocode to a readable place/city
 */
export const GET = handler(async (req: Request) => {
  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  const lat = url.searchParams.get("lat");
  const lng = url.searchParams.get("lng");

  let target: string;
  if (q) {
    if (q.trim().length < 2) return NextResponse.json({ results: [] });
    target = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&addressdetails=1&q=${encodeURIComponent(q)}`;
  } else if (lat && lng) {
    target = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&addressdetails=1&lat=${lat}&lon=${lng}`;
  } else {
    throw new HttpError(400, "Pass q, or lat & lng");
  }

  const res = await fetch(target, { headers: { "User-Agent": UA, "Accept-Language": "en" }, next: { revalidate: 86400 } });
  if (!res.ok) throw new HttpError(502, "Geocoding service unavailable");
  const json = await res.json();

  type Addr = { city?: string; town?: string; village?: string; suburb?: string; state_district?: string; state?: string; country?: string };
  const cityOf = (a?: Addr) => a?.city || a?.town || a?.village || a?.state_district || a?.state || "";

  if (q) {
    const results = (json as { display_name: string; lat: string; lon: string; address?: Addr }[]).map((r) => ({
      label: r.display_name,
      city: cityOf(r.address),
      coordinates: [Number(r.lon), Number(r.lat)] as [number, number],
    }));
    return NextResponse.json({ results });
  }
  const r = json as { display_name?: string; address?: Addr };
  return NextResponse.json({
    label: r.display_name ?? "",
    city: cityOf(r.address),
    area: r.address?.suburb ?? "",
  });
});
