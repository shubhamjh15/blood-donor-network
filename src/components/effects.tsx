"use client";
import * as React from "react";
import { motion, useInView, useMotionTemplate, useMotionValue, useSpring, useTransform, animate } from "framer-motion";
import { cn } from "@/lib/utils";

/** Card with a cursor-following radial spotlight + glowing border. */
export function SpotlightCard({ children, className, glow = "255,45,85" }: { children: React.ReactNode; className?: string; glow?: string }) {
  const mx = useMotionValue(-400);
  const my = useMotionValue(-400);
  const bg = useMotionTemplate`radial-gradient(420px circle at ${mx}px ${my}px, rgba(${glow},0.13), transparent 60%)`;
  const border = useMotionTemplate`radial-gradient(260px circle at ${mx}px ${my}px, rgba(${glow},0.55), transparent 60%)`;
  return (
    <div
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(e.clientX - r.left);
        my.set(e.clientY - r.top);
      }}
      onMouseLeave={() => {
        mx.set(-400);
        my.set(-400);
      }}
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-b from-white/[0.045] to-white/[0.01] backdrop-blur-xl",
        className,
      )}
    >
      <motion.div aria-hidden className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: border, WebkitMask: "linear-gradient(#000,#000) content-box, linear-gradient(#000,#000)", WebkitMaskComposite: "xor", maskComposite: "exclude", padding: 1 }} />
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: bg }} />
      <div className="relative">{children}</div>
    </div>
  );
}

/** 3D perspective tilt that follows the cursor. */
export function TiltCard({ children, className, max = 10 }: { children: React.ReactNode; className?: string; max?: number }) {
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const rx = useSpring(useTransform(y, [0, 1], [max, -max]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(x, [0, 1], [-max, max]), { stiffness: 200, damping: 20 });
  const shine = useMotionTemplate`radial-gradient(circle at ${useTransform(x, (v) => v * 100)}% ${useTransform(y, (v) => v * 100)}%, rgba(255,255,255,0.14), transparent 55%)`;
  return (
    <motion.div
      style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d", transformPerspective: 900 }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left) / r.width);
        y.set((e.clientY - r.top) / r.height);
      }}
      onMouseLeave={() => {
        x.set(0.5);
        y.set(0.5);
      }}
      className={cn("relative", className)}
    >
      {children}
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit]" style={{ background: shine }} />
    </motion.div>
  );
}

/** Counts up to `value` once scrolled into view. */
export function NumberTicker({ value, className, duration = 1.8, decimals = 0, suffix = "" }: { value: number; className?: string; duration?: number; decimals?: number; suffix?: string }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  React.useEffect(() => {
    if (!inView || !ref.current) return;
    const node = ref.current;
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        node.textContent = v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
      },
    });
    return () => controls.stop();
  }, [inView, value, duration, decimals, suffix]);
  return <span ref={ref} className={cn("tabular-nums", className)}>0{suffix}</span>;
}

/** Soft animated colour blobs for section backgrounds. */
export function Aurora({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="absolute -left-1/4 -top-1/3 h-[70vh] w-[70vw] rounded-full bg-blood-600/25 blur-[120px] animate-aurora" />
      <div className="absolute -right-1/4 top-1/4 h-[60vh] w-[50vw] rounded-full bg-fuchsia-700/15 blur-[120px] animate-aurora [animation-delay:-6s]" />
      <div className="absolute bottom-[-30%] left-1/4 h-[50vh] w-[60vw] rounded-full bg-orange-600/10 blur-[120px] animate-aurora [animation-delay:-12s]" />
    </div>
  );
}

export function Marquee({ children, className, reverse }: { children: React.ReactNode; className?: string; reverse?: boolean }) {
  return (
    <div className={cn("group relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]", className)}>
      <div className={cn("flex w-max shrink-0 gap-4 animate-marquee group-hover:[animation-play-state:paused]", reverse && "[animation-direction:reverse]")}>
        {children}
        {children}
      </div>
    </div>
  );
}

/** Fade + rise when scrolled into view. */
export function Reveal({ children, delay = 0, className, y = 24 }: { children: React.ReactNode; delay?: number; className?: string; y?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Button that is gently pulled toward the cursor. */
export function Magnetic({ children, strength = 0.3 }: { children: React.ReactNode; strength?: number }) {
  const x = useSpring(0, { stiffness: 250, damping: 15 });
  const y = useSpring(0, { stiffness: 250, damping: 15 });
  return (
    <motion.div
      style={{ x, y }}
      className="inline-block"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * strength);
        y.set((e.clientY - r.top - r.height / 2) * strength);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/** A blood-drop icon with heartbeat animation. */
export function BloodDrop({ className, beating }: { className?: string; beating?: boolean }) {
  return (
    <svg viewBox="0 0 24 32" className={cn(beating && "animate-heartbeat", className)} aria-hidden>
      <defs>
        <linearGradient id="bdg" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="#ff7a93" />
          <stop offset="0.5" stopColor="#ff2d55" />
          <stop offset="1" stopColor="#a70631" />
        </linearGradient>
      </defs>
      <path d="M12 1C12 1 2 13.5 2 20.5C2 26.3 6.5 31 12 31C17.5 31 22 26.3 22 20.5C22 13.5 12 1 12 1Z" fill="url(#bdg)" />
      <path d="M7.5 21.5C7.5 18.5 9 16 10.5 14" stroke="white" strokeOpacity="0.55" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}
