"use client";
import useSWR, { mutate as globalMutate } from "swr";
import * as React from "react";
import type { PublicUser } from "@/models/User";
import type { PublicRequest } from "@/models/BloodRequest";

export type { PublicUser, PublicRequest };

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T = unknown>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  const res = await fetch(url, {
    ...rest,
    headers: { ...(json !== undefined ? { "Content-Type": "application/json" } : {}), ...rest.headers },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error ?? `Request failed (${res.status})`);
  return data as T;
}

export const fetcher = <T,>(url: string) => api<T>(url);

export function useMe() {
  const { data, isLoading, mutate } = useSWR<{ user: PublicUser | null }>("/api/me", fetcher, { revalidateOnFocus: true });
  return { user: data?.user ?? null, isLoading, mutate };
}

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string;
  urgency: string;
  read: boolean;
  createdAt: string;
};

export function useNotifications(enabled: boolean) {
  return useSWR<{ notifications: NotificationItem[]; unread: number }>(enabled ? "/api/notifications" : null, fetcher, {
    refreshInterval: 15_000,
  });
}

export async function logout() {
  await api("/api/auth/logout", { method: "POST" });
  await globalMutate(() => true, undefined, { revalidate: true });
}

export type Coords = [number, number]; // [lng, lat]
export const DEFAULT_CENTER: Coords = [77.209, 28.6139];

/** Browser geolocation, falling back to the user's saved location or a default. */
export function useLocation(fallback?: Coords | null) {
  const [coords, setCoords] = React.useState<Coords | null>(null);
  const [status, setStatus] = React.useState<"idle" | "locating" | "granted" | "denied">("idle");

  const locate = React.useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("denied");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords([pos.coords.longitude, pos.coords.latitude]);
        setStatus("granted");
      },
      () => setStatus("denied"),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }, []);

  const effective = coords ?? fallback ?? null;
  return { coords: effective, setCoords, status, locate, isFallback: !coords };
}
