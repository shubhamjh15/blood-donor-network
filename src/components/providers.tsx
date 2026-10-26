"use client";
import { SWRConfig } from "swr";
import { Toaster } from "sonner";
import { MotionConfig } from "framer-motion";
import { fetcher } from "@/lib/client";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ fetcher, shouldRetryOnError: false, keepPreviousData: true }}>
      <MotionConfig reducedMotion="user">
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          richColors
          toastOptions={{
            className: "!rounded-2xl !border-white/10 !bg-popover/95 !backdrop-blur-xl",
          }}
        />
      </MotionConfig>
    </SWRConfig>
  );
}
