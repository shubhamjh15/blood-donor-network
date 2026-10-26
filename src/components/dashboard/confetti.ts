/** Tiny dependency-free confetti burst of blood drops and hearts. */
export default function confettiBurst(count = 90) {
  if (typeof document === "undefined") return;
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9999";
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d")!;
  ctx.scale(devicePixelRatio, devicePixelRatio);

  const colors = ["#ff2d55", "#ff5f7c", "#ffc6d0", "#f97316", "#d946ef", "#ffffff"];
  const parts = Array.from({ length: count }, () => ({
    x: window.innerWidth / 2,
    y: window.innerHeight * 0.55,
    vx: (Math.random() - 0.5) * 16,
    vy: -Math.random() * 16 - 6,
    r: Math.random() * 5 + 3,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    color: colors[Math.floor(Math.random() * colors.length)]!,
    shape: Math.random() < 0.35 ? "drop" : "rect",
  }));

  let frame = 0;
  const tick = () => {
    frame++;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (const p of parts) {
      p.vy += 0.45;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, 1 - frame / 140);
      ctx.fillStyle = p.color;
      if (p.shape === "drop") {
        ctx.beginPath();
        ctx.moveTo(0, -p.r * 1.6);
        ctx.bezierCurveTo(p.r, -p.r * 0.2, p.r, p.r, 0, p.r);
        ctx.bezierCurveTo(-p.r, p.r, -p.r, -p.r * 0.2, 0, -p.r * 1.6);
        ctx.fill();
      } else {
        ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
      }
      ctx.restore();
    }
    if (frame < 150) requestAnimationFrame(tick);
    else canvas.remove();
  };
  requestAnimationFrame(tick);
}
