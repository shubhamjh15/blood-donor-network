"use client";
import * as React from "react";
import { Dialog as D } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

export function DialogContent({ className, children, ...props }: React.ComponentProps<typeof D.Content>) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-[fade-in_0.2s_ease-out] data-[state=closed]:animate-[fade-out_0.15s_ease-in]" />
      <D.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-white/10 bg-popover/95 p-6 shadow-[0_40px_100px_-20px_rgb(0_0_0/0.9),0_0_0_1px_rgb(255_45_85/0.05)] backdrop-blur-2xl outline-none data-[state=open]:animate-[dialog-in_0.25s_cubic-bezier(0.2,0.9,0.3,1.2)]",
          className,
        )}
        {...props}
      >
        {children}
        <D.Close className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground transition hover:bg-white/10 hover:text-foreground">
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </D.Close>
      </D.Content>
    </D.Portal>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-5 flex flex-col gap-1.5 pr-8", className)} {...props} />;
}
export function DialogTitle({ className, ...props }: React.ComponentProps<typeof D.Title>) {
  return <D.Title className={cn("font-display text-xl font-semibold tracking-tight", className)} {...props} />;
}
export function DialogDescription({ className, ...props }: React.ComponentProps<typeof D.Description>) {
  return <D.Description className={cn("text-sm text-muted-foreground", className)} {...props} />;
}
