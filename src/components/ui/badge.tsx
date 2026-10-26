import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide transition-colors [&_svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-blood-500/30 bg-blood-500/10 text-blood-300",
        secondary: "border-white/10 bg-white/[0.05] text-muted-foreground",
        success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
        warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
        critical: "border-red-500/50 bg-red-500/15 text-red-300 shadow-[0_0_20px_-4px_rgb(239_68_68/0.6)]",
        info: "border-sky-500/30 bg-sky-500/10 text-sky-300",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
