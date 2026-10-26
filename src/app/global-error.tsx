"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ background: "#07060a", color: "#f5f3f7", fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100dvh", margin: 0 }}>
        <div style={{ textAlign: "center", maxWidth: 420, padding: 24 }}>
          <h1 style={{ fontSize: 28, margin: 0 }}>Something went wrong</h1>
          <p style={{ color: "#9a94a6", fontSize: 14 }}>{error.message}</p>
          <button onClick={reset} style={{ marginTop: 16, background: "#ff2d55", color: "white", border: 0, borderRadius: 12, padding: "10px 18px", fontWeight: 600, cursor: "pointer" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
