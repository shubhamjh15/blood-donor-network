"use client";
import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck, HeartHandshake, Siren, Sparkles, PartyPopper, Droplet } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { api, useNotifications, type NotificationItem } from "@/lib/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ElementType> = {
  request_nearby: Siren,
  response: HeartHandshake,
  fulfilled: PartyPopper,
  thanks: Sparkles,
  cancelled: Droplet,
  system: Droplet,
};

export function NotificationsBell() {
  const { data, mutate } = useNotifications(true);
  const unread = data?.unread ?? 0;
  const seen = React.useRef<Set<string> | null>(null);

  // Toast for newly-arrived notifications while the app is open
  React.useEffect(() => {
    if (!data) return;
    if (!seen.current) {
      seen.current = new Set(data.notifications.map((n) => n.id));
      return;
    }
    for (const n of data.notifications) {
      if (!seen.current.has(n.id)) {
        seen.current.add(n.id);
        if (!n.read) {
          toast(n.title, {
            description: n.body,
            action: n.link ? { label: "View", onClick: () => (window.location.href = n.link) } : undefined,
          });
        }
      }
    }
  }, [data]);

  const markAll = async () => {
    await api("/api/notifications", { method: "PATCH", json: { all: true } });
    mutate();
  };
  const markOne = async (n: NotificationItem) => {
    if (n.read) return;
    await api("/api/notifications", { method: "PATCH", json: { ids: [n.id] } });
    mutate();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative grid size-10 cursor-pointer place-items-center rounded-xl text-muted-foreground transition hover:bg-white/[0.06] hover:text-foreground" aria-label="Notifications">
          <Bell className={cn("size-[18px]", unread > 0 && "animate-[heartbeat_2.5s_ease-in-out_infinite] text-foreground")} />
          <AnimatePresence>
            {unread > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-blood-500 px-1 text-[9px] font-bold leading-4 text-white shadow-[0_0_12px_rgb(255_45_85/0.9)]"
              >
                {unread > 9 ? "9+" : unread}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(92vw,380px)] p-0">
        <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
          <div>
            <p className="font-display text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">{unread ? `${unread} unread` : "You're all caught up"}</p>
          </div>
          {unread > 0 && (
            <button onClick={markAll} className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs text-blood-300 transition hover:bg-blood-500/10">
              <CheckCheck className="size-3.5" /> Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-1.5">
          {!data?.notifications.length && (
            <div className="flex flex-col items-center gap-2 px-6 py-10 text-center text-sm text-muted-foreground">
              <Bell className="size-6 opacity-40" />
              No notifications yet
            </div>
          )}
          {data?.notifications.map((n, i) => {
            const Icon = ICONS[n.type] ?? Droplet;
            return (
              <motion.div key={n.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}>
                <Link
                  href={n.link || "#"}
                  onClick={() => markOne(n)}
                  className={cn("flex gap-3 rounded-xl p-3 transition hover:bg-white/[0.05]", !n.read && "bg-blood-500/[0.06]")}
                >
                  <div
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-xl",
                      n.urgency === "critical" ? "bg-red-500/20 text-red-300" : n.type === "thanks" || n.type === "fulfilled" ? "bg-emerald-500/15 text-emerald-300" : "bg-blood-500/15 text-blood-300",
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm leading-snug", !n.read ? "font-semibold" : "text-foreground/80")}>{n.title}</p>
                    {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>}
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground/70">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-blood-500 shadow-[0_0_8px_rgb(255_45_85)]" />}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
