"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";
import { api } from "@/lib/client";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const submit = async (e?: React.FormEvent, creds?: { email: string; password: string }) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const { user } = await api<{ user: { name: string } }>("/api/auth/login", { method: "POST", json: creds ?? { email, password } });
      await mutate("/api/me");
      toast.success(`Welcome back, ${user.name.split(" ")[0]}!`);
      router.push(params.get("next") || "/dashboard");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Email">
        <Input icon={<Mail />} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
      </Field>
      <Field label="Password">
        <Input icon={<Lock />} type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={loading}>Sign in</Button>
      <div className="relative py-2 text-center text-xs text-muted-foreground">
        <span className="relative z-10 bg-background px-3">or</span>
        <span className="absolute inset-x-0 top-1/2 h-px bg-white/[0.07]" />
      </div>
      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="w-full"
        disabled={loading}
        onClick={() => submit(undefined, { email: "demo@bloodline.app", password: "demo1234" })}
      >
        <Sparkles className="text-blood-400" /> Try the demo account
      </Button>
      <p className="pt-2 text-center text-sm text-muted-foreground">
        New here? <Link href="/register" className="font-semibold text-blood-400 hover:underline">Create an account</Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to see requests near you and manage your donations." quote="I got a notification at 2am. By 3am a stranger's daughter had the O- she needed.">
      <React.Suspense>
        <LoginForm />
      </React.Suspense>
    </AuthShell>
  );
}
