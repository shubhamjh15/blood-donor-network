"use client";
import * as React from "react";
import { BloodDrop } from "@/components/effects";

/** three.js r163+ needs WebGL2. Returns null when OK, otherwise a reason. */
function webglProblem(): string | null {
  try {
    const canvas = document.createElement("canvas");
    const gl2 = canvas.getContext("webgl2");
    if (gl2) {
      gl2.getExtension("WEBGL_lose_context")?.loseContext(); // free the probe context
      return null;
    }
    if (canvas.getContext("webgl")) return "Only WebGL1 available (WebGL2 required)";
    return "WebGL unavailable: turn on graphics acceleration in Chrome settings";
  } catch (e) {
    return `WebGL check failed: ${(e as Error).message}`;
  }
}

/** Static stand-in shown when WebGL is unavailable or the 3D scene crashes. */
export function SceneFallback({ reason }: { reason?: string }) {
  return (
    <div className="grid size-full place-items-center">
      <div className="relative flex flex-col items-center">
        <div className="absolute inset-0 scale-150 rounded-full bg-blood-500/30 blur-3xl" />
        <BloodDrop className="relative h-48 w-36 animate-float drop-shadow-[0_20px_60px_rgb(255_45_85/0.6)]" beating />
        {reason && <p className="relative mt-6 max-w-xs text-center text-[11px] text-muted-foreground/70">3D off · {reason}</p>}
      </div>
    </div>
  );
}

/** Generic error boundary; renders `fallback(error)` when a child throws. */
export class Boundary extends React.Component<
  { children: React.ReactNode; fallback: (error: Error) => React.ReactNode; label?: string },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: unknown) {
    console.warn(`${this.props.label ?? "3D scene"} disabled:`, error);
  }
  render() {
    return this.state.error ? this.props.fallback(this.state.error) : this.props.children;
  }
}

/** True while the scene is on screen — scenes use it to pause their render loop. */
export const SceneVisible = React.createContext(true);

/**
 * Renders a 3D scene only when WebGL2 works, never lets it take the page down,
 * mounts it lazily when it nears the viewport, and pauses it while off-screen.
 */
export function SafeScene({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [problem, setProblem] = React.useState<string | null | undefined>(undefined);
  const [mounted, setMounted] = React.useState(false);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    setProblem(webglProblem());
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        const on = !!entry?.isIntersecting;
        setVisible(on && document.visibilityState === "visible");
        if (on) setMounted(true);
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  let content: React.ReactNode = null;
  if (problem) content = <SceneFallback reason={problem} />;
  else if (problem === null && mounted) {
    content = (
      <SceneVisible.Provider value={visible}>
        <Boundary fallback={(e) => <SceneFallback reason={e.message} />}>{children}</Boundary>
      </SceneVisible.Provider>
    );
  }
  return <div ref={ref} className="size-full">{content}</div>;
}
