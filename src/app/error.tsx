"use client";
import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BloodDrop } from "@/components/effects";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto flex min-h-[80dvh] max-w-md flex-col items-center justify-center px-6 text-center">
      <BloodDrop className="h-16 w-12" />
      <h1 className="mt-6 font-display text-3xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message || "An unexpected error occurred."}</p>
      <Button className="mt-8" onClick={reset}><RotateCcw /> Try again</Button>
    </div>
  );
}
