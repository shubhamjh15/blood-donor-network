"use client";
import * as React from "react";
import { BloodDrop } from "@/components/effects";

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Static stand-in shown when WebGL is unavailable or the 3D scene crashes. */
export function SceneFallback() {
  return (
    <div className="grid size-full place-items-center">
      <div className="relative">
        <div className="absolute inset-0 scale-150 rounded-full bg-blood-500/30 blur-3xl" />
        <BloodDrop className="relative h-48 w-36 animate-float drop-shadow-[0_20px_60px_rgb(255_45_85/0.6)]" beating />
      </div>
    </div>
  );
}

class Boundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn("3D scene disabled:", error);
  }
  render() {
    return this.state.failed ? <SceneFallback /> : this.props.children;
  }
}

/** Renders a 3D scene only when WebGL works, and never lets it take the page down. */
export function SafeScene({ children }: { children: React.ReactNode }) {
  const [supported, setSupported] = React.useState<boolean | null>(null);
  React.useEffect(() => setSupported(hasWebGL()), []);
  if (supported === null) return null;
  if (!supported) return <SceneFallback />;
  return <Boundary>{children}</Boundary>;
}
