import * as React from "react";
import { cn } from "@/lib/utils";

const base =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-all duration-200 hover:border-white/20 focus:border-blood-500/60 focus:bg-white/[0.05] focus:ring-4 focus:ring-blood-500/15 disabled:opacity-50";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, icon, ...props }, ref) => {
  if (!icon) return <input ref={ref} className={cn(base, "h-11", className)} {...props} />;
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:size-4">
        {icon}
      </span>
      <input ref={ref} className={cn(base, "h-11 pl-10", className)} {...props} />
    </div>
  );
});
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(base, "min-h-24 resize-none py-3", className)} {...props} />
  ),
);
Textarea.displayName = "Textarea";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground", className)} {...props} />;
}

export function Field({ label, error, hint, children, className }: { label?: string; error?: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      {label && <Label>{label}</Label>}
      {children}
      {error ? <p className="mt-1.5 text-xs text-red-400">{error}</p> : hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
