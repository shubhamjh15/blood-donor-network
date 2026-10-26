"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { LayoutDashboard, LogOut, Map, Menu, Plus, Siren, Trophy, User, X } from "lucide-react";
import { toast } from "sonner";
import { logout, useMe } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Avatar, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/primitives";
import { BloodDrop } from "@/components/effects";
import { NotificationsBell } from "./notifications-bell";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/find", label: "Find donors", icon: Map },
  { href: "/requests", label: "Requests", icon: Siren },
  { href: "/heroes", label: "Heroes", icon: Trophy },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, mutate } = useMe();
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 12));
  React.useEffect(() => setOpen(false), [pathname]);

  const onLogout = async () => {
    await logout();
    await mutate({ user: null }, { revalidate: false });
    toast.success("Signed out. See you soon!");
    router.push("/");
    router.refresh();
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex justify-center px-3 pt-3">
      <motion.nav
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "flex w-full max-w-6xl items-center gap-2 rounded-2xl border px-3 py-2 transition-all duration-500",
          scrolled || pathname !== "/" ? "border-white/[0.08] bg-background/70 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.8)] backdrop-blur-2xl" : "border-transparent bg-transparent",
        )}
      >
        <Link href="/" className="group mr-2 flex items-center gap-2 pl-1">
          <BloodDrop className="h-7 w-5 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[-8deg]" beating />
          <span className="font-display text-lg font-bold tracking-tight">
            blood<span className="text-blood-500">line</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href} className={cn("relative rounded-xl px-3.5 py-2 text-sm font-medium transition-colors", active ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
                {active && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-xl bg-white/[0.07]" transition={{ type: "spring", stiffness: 380, damping: 30 }} />}
                <span className="relative">{l.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          {!isLoading && user && (
            <>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/requests/new"><Plus /> Request blood</Link>
              </Button>
              <NotificationsBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="cursor-pointer rounded-full outline-none ring-blood-500/50 transition focus-visible:ring-2">
                    <Avatar name={user.name} className="size-9" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>
                    <span className="block text-sm font-semibold text-foreground">{user.name}</span>
                    <span className="text-xs">{user.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => router.push("/dashboard")}><LayoutDashboard /> Dashboard</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => router.push("/profile")}><User /> Profile & location</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => router.push("/requests/new")}><Plus /> New request</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={onLogout} className="text-red-300 [&_svg]:!text-red-300"><LogOut /> Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          {!isLoading && !user && (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link href="/login">Sign in</Link></Button>
              <Button asChild size="sm"><Link href="/register">Become a donor</Link></Button>
            </>
          )}
          <button onClick={() => setOpen((o) => !o)} className="grid size-10 cursor-pointer place-items-center rounded-xl text-muted-foreground hover:bg-white/[0.06] md:hidden" aria-label="Menu">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="absolute inset-x-3 top-[4.5rem] rounded-2xl border border-white/10 bg-popover/95 p-2 shadow-2xl backdrop-blur-2xl md:hidden"
          >
            {[...LINKS, ...(user ? [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }, { href: "/requests/new", label: "Request blood", icon: Plus }] : [{ href: "/login", label: "Sign in", icon: User }])].map((l) => (
              <Link key={l.href} href={l.href} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-white/[0.06]">
                <l.icon className="size-4 text-blood-400" /> {l.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
