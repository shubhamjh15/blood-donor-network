import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BloodDrop } from "@/components/effects";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[80dvh] max-w-md flex-col items-center justify-center px-6 text-center">
      <BloodDrop className="h-20 w-14 animate-float" beating />
      <h1 className="mt-6 font-display text-6xl font-bold">404</h1>
      <p className="mt-2 text-muted-foreground">This page drifted out of the bloodstream.</p>
      <Button asChild className="mt-8"><Link href="/">Back home</Link></Button>
    </div>
  );
}
