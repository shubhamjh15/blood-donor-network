"use client";
import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-blood-500 to-blood-600 text-white shadow-[0_8px_30px_-6px_rgb(255_45_85/0.6),inset_0_1px_0_rgb(255_255_255/0.25)] hover:shadow-[0_10px_40px_-4px_rgb(255_45_85/0.75),inset_0_1px_0_rgb(255_255_255/0.3)] hover:brightness-110",
        secondary: "bg-white/[0.06] text-foreground border border-white/10 hover:bg-white/[0.1] hover:border-white/20",
        outline: "border border-blood-500/40 text-blood-300 hover:bg-blood-500/10 hover:border-blood-500/70",
        ghost: "text-muted-foreground hover:text-foreground hover:bg-white/[0.06]",
        white: "bg-white text-black hover:bg-white/90 shadow-[0_8px_30px_-8px_rgb(255_255_255/0.5)]",
        success: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25",
        danger: "bg-red-500/10 text-red-300 border border-red-500/25 hover:bg-red-500/20",
        link: "text-blood-400 underline-offset-4 hover:underline px-0",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-lg",
        default: "h-10 px-4",
        lg: "h-12 px-6 text-base rounded-2xl",
        xl: "h-14 px-8 text-base rounded-2xl",
        icon: "size-10",
        "icon-sm": "size-8 rounded-lg",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot.Root : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading && <Loader2 className="animate-spin" />}
            {children}
          </>
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
