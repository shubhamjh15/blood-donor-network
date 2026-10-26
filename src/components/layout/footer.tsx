import Link from "next/link";
import { Heart } from "lucide-react";
import { BloodDrop } from "@/components/effects";

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-white/[0.06]">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link href="/" className="flex items-center gap-2">
            <BloodDrop className="h-7 w-5" />
            <span className="font-display text-lg font-bold">blood<span className="text-blood-500">line</span></span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            A real-time, location-aware network connecting blood donors with people who need them — in minutes, not hours.
          </p>
          <p className="mt-6 text-xs text-muted-foreground/70">
            Bloodline helps people find each other. It is not a medical service. Always follow your hospital&apos;s guidance on donor screening.
          </p>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Platform</p>
          <ul className="space-y-2 text-sm">
            <li><Link className="text-foreground/80 hover:text-blood-400" href="/find">Find donors</Link></li>
            <li><Link className="text-foreground/80 hover:text-blood-400" href="/requests">Live requests</Link></li>
            <li><Link className="text-foreground/80 hover:text-blood-400" href="/heroes">Hero board</Link></li>
            <li><Link className="text-foreground/80 hover:text-blood-400" href="/register">Become a donor</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Learn</p>
          <ul className="space-y-2 text-sm">
            <li><Link className="text-foreground/80 hover:text-blood-400" href="/#compatibility">Compatibility</Link></li>
            <li><Link className="text-foreground/80 hover:text-blood-400" href="/#how">How it works</Link></li>
            <li><Link className="text-foreground/80 hover:text-blood-400" href="/#eligibility">Eligibility</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/[0.06] py-6 text-center text-xs text-muted-foreground">
        Made with <Heart className="inline size-3 fill-blood-500 text-blood-500" /> for every life a donor saves · © {new Date().getFullYear()} Bloodline
      </div>
    </footer>
  );
}
