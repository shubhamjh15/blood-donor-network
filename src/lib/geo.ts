import { HttpError } from "./auth";

export function parseCenter(url: URL): [number, number] {
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    throw new HttpError(400, "Valid lat and lng query params are required");
  }
  return [lng, lat];
}

export function parseRadiusKm(url: URL, fallback = 25, max = 500) {
  const r = Number(url.searchParams.get("radius") ?? fallback);
  return Math.min(Math.max(Number.isFinite(r) ? r : fallback, 0.5), max);
}
