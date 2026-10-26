"use client";
import * as React from "react";
import { Switch as SwitchP, Slider as SliderP, Tabs as TabsP, Tooltip as TooltipP, Select as SelectP, DropdownMenu as DM, Avatar as AvatarP, Popover as PopoverP } from "radix-ui";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------------- Switch ---------------- */
export function Switch({ className, ...props }: React.ComponentProps<typeof SwitchP.Root>) {
  return (
    <SwitchP.Root
      className={cn(
        "peer relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-white/10 bg-white/10 transition-colors data-[state=checked]:border-blood-400/50 data-[state=checked]:bg-blood-500 data-[state=checked]:shadow-[0_0_20px_-2px_rgb(255_45_85/0.7)] disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchP.Thumb className="pointer-events-none block size-5 translate-x-0.5 rounded-full bg-white shadow-lg transition-transform duration-300 [transition-timing-function:cubic-bezier(0.3,1.5,0.6,1)] data-[state=checked]:translate-x-[1.3rem]" />
    </SwitchP.Root>
  );
}

/* ---------------- Slider ---------------- */
export function Slider({ className, ...props }: React.ComponentProps<typeof SliderP.Root>) {
  return (
    <SliderP.Root className={cn("relative flex w-full touch-none select-none items-center py-2", className)} {...props}>
      <SliderP.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-white/10">
        <SliderP.Range className="absolute h-full bg-gradient-to-r from-blood-600 to-blood-400" />
      </SliderP.Track>
      <SliderP.Thumb className="block size-5 cursor-grab rounded-full border-2 border-blood-400 bg-white shadow-[0_0_0_6px_rgb(255_45_85/0.15),0_4px_14px_rgb(255_45_85/0.5)] outline-none transition-transform hover:scale-110 active:cursor-grabbing active:scale-95" />
    </SliderP.Root>
  );
}

/* ---------------- Tabs ---------------- */
export const Tabs = TabsP.Root;
export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsP.List>) {
  return <TabsP.List className={cn("inline-flex items-center gap-1 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-1", className)} {...props} />;
}
export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsP.Trigger>) {
  return (
    <TabsP.Trigger
      className={cn(
        "inline-flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:bg-white/[0.08] data-[state=active]:text-foreground data-[state=active]:shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] [&_svg]:size-4",
        className,
      )}
      {...props}
    />
  );
}
export const TabsContent = TabsP.Content;

/* ---------------- Tooltip ---------------- */
export function Tooltip({ content, children, side = "top" }: { content: React.ReactNode; children: React.ReactNode; side?: "top" | "bottom" | "left" | "right" }) {
  return (
    <TooltipP.Provider delayDuration={150}>
      <TooltipP.Root>
        <TooltipP.Trigger asChild>{children}</TooltipP.Trigger>
        <TooltipP.Portal>
          <TooltipP.Content side={side} sideOffset={8} className="z-[60] max-w-xs rounded-lg border border-white/10 bg-popover px-2.5 py-1.5 text-xs text-foreground shadow-xl animate-[fade-in_0.15s_ease-out]">
            {content}
          </TooltipP.Content>
        </TooltipP.Portal>
      </TooltipP.Root>
    </TooltipP.Provider>
  );
}

/* ---------------- Select ---------------- */
export function Select({ value, onValueChange, placeholder, options, className }: {
  value?: string;
  onValueChange: (v: string) => void;
  placeholder?: string;
  options: { value: string; label: React.ReactNode }[];
  className?: string;
}) {
  return (
    <SelectP.Root value={value} onValueChange={onValueChange}>
      <SelectP.Trigger className={cn("flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 text-sm outline-none transition hover:border-white/20 focus:border-blood-500/60 focus:ring-4 focus:ring-blood-500/15 data-[placeholder]:text-muted-foreground", className)}>
        <SelectP.Value placeholder={placeholder} />
        <SelectP.Icon><ChevronDown className="size-4 opacity-60" /></SelectP.Icon>
      </SelectP.Trigger>
      <SelectP.Portal>
        <SelectP.Content position="popper" sideOffset={6} className="z-[60] max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-white/10 bg-popover/95 p-1 shadow-2xl backdrop-blur-xl animate-[fade-in_0.15s_ease-out]">
          <SelectP.Viewport>
            {options.map((o) => (
              <SelectP.Item key={o.value} value={o.value} className="relative flex cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-3 text-sm outline-none data-[highlighted]:bg-white/[0.08]">
                <SelectP.ItemIndicator className="absolute left-2.5"><Check className="size-3.5 text-blood-400" /></SelectP.ItemIndicator>
                <SelectP.ItemText>{o.label}</SelectP.ItemText>
              </SelectP.Item>
            ))}
          </SelectP.Viewport>
        </SelectP.Content>
      </SelectP.Portal>
    </SelectP.Root>
  );
}

/* ---------------- Dropdown ---------------- */
export const DropdownMenu = DM.Root;
export const DropdownMenuTrigger = DM.Trigger;
export function DropdownMenuContent({ className, align = "end", ...props }: React.ComponentProps<typeof DM.Content>) {
  return (
    <DM.Portal>
      <DM.Content align={align} sideOffset={8} className={cn("z-[60] min-w-52 overflow-hidden rounded-2xl border border-white/10 bg-popover/95 p-1.5 shadow-[0_30px_60px_-15px_rgb(0_0_0/0.8)] backdrop-blur-xl animate-[fade-in_0.15s_ease-out]", className)} {...props} />
    </DM.Portal>
  );
}
export function DropdownMenuItem({ className, ...props }: React.ComponentProps<typeof DM.Item>) {
  return <DM.Item className={cn("flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors data-[highlighted]:bg-white/[0.07] [&_svg]:size-4 [&_svg]:text-muted-foreground", className)} {...props} />;
}
export function DropdownMenuSeparator() {
  return <DM.Separator className="my-1 h-px bg-white/[0.07]" />;
}
export const DropdownMenuLabel = ({ className, ...props }: React.ComponentProps<typeof DM.Label>) => (
  <DM.Label className={cn("px-2.5 py-1.5 text-xs text-muted-foreground", className)} {...props} />
);

/* ---------------- Popover ---------------- */
export const Popover = PopoverP.Root;
export const PopoverTrigger = PopoverP.Trigger;
export function PopoverContent({ className, align = "end", ...props }: React.ComponentProps<typeof PopoverP.Content>) {
  return (
    <PopoverP.Portal>
      <PopoverP.Content align={align} sideOffset={10} className={cn("z-[60] rounded-2xl border border-white/10 bg-popover/95 shadow-[0_30px_60px_-15px_rgb(0_0_0/0.8)] backdrop-blur-xl outline-none animate-[fade-in_0.15s_ease-out]", className)} {...props} />
    </PopoverP.Portal>
  );
}

/* ---------------- Avatar ---------------- */
const AVATAR_GRADIENTS = [
  "from-rose-500 to-orange-400",
  "from-fuchsia-500 to-pink-500",
  "from-red-600 to-rose-400",
  "from-violet-500 to-fuchsia-500",
  "from-orange-500 to-amber-400",
  "from-pink-600 to-red-500",
];
export function Avatar({ name, className }: { name: string; className?: string }) {
  const hash = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  const ini = name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
  return (
    <AvatarP.Root className={cn("relative inline-flex size-10 shrink-0 overflow-hidden rounded-full ring-2 ring-white/10", className)}>
      <AvatarP.Fallback className={cn("flex size-full items-center justify-center bg-gradient-to-br text-sm font-bold text-white", AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length])}>
        {ini}
      </AvatarP.Fallback>
    </AvatarP.Root>
  );
}

/* ---------------- Skeleton ---------------- */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("rounded-xl bg-[linear-gradient(90deg,rgb(255_255_255/0.03),rgb(255_255_255/0.08),rgb(255_255_255/0.03))] bg-[length:200%_100%] animate-shimmer", className)} />;
}

export function Separator({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent", className)} />;
}
