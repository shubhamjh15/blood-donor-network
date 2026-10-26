"use client";
import * as React from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Aurora } from "@/components/effects";
import { SafeScene } from "@/components/three/safe-scene";

const HeroScene = dynamic(() => import("@/components/three/hero-scene"), { ssr: false });

export function AuthShell({ children, title, subtitle, quote }: { children: React.ReactNode; title: string; subtitle: string; quote: string }) {
  return (
    <div className="relative grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden border-r border-white/[0.06] lg:block">
        <Aurora />
        <div className="absolute inset-0 bg-grid mask-radial opacity-50" />
        <div className="absolute inset-0">
          <SafeScene><HeroScene /></SafeScene>
        </div>
        <motion.blockquote
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass absolute inset-x-10 bottom-10 rounded-3xl p-6"
        >
          <p className="font-display text-xl leading-snug">&ldquo;{quote}&rdquo;</p>
          <p className="mt-3 text-sm text-muted-foreground">Bloodline community</p>
        </motion.blockquote>
      </div>
      <div className="relative flex items-center justify-center px-5 pb-12 pt-28">
        <div className="absolute inset-0 bg-dots opacity-40 mask-radial lg:hidden" />
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative w-full max-w-md">
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-2 text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}
