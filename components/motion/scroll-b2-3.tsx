"use client";

// Scroll motions, batch 2 · group 3 (MOTION-MENU M159). Small focused demo for /lab/motion.
// "scrub": the panel's scroll maps LINEARLY onto the fly-through (no early finish); a CSS glow + a slow tunnel sway
// never stop. ?static=1 / reduced motion: the stack is drawn mid-flight (no animation).
import { useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { scene, useScrub } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = { sg: "Space Grotesk Variable", fr: "Fraunces Variable", is: "Instrument Serif" };
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const CSS = `
.b2g3s-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 40% 45%,var(--g1,rgba(124,92,255,.45)),transparent 70%),radial-gradient(30% 36% at 66% 62%,var(--g2,rgba(255,110,160,.22)),transparent 70%);animation:b2g3s-drift 5.5s linear infinite alternate;will-change:transform}
@keyframes b2g3s-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.m159-sway{animation:m159-sway 7s linear infinite alternate}
@keyframes m159-sway{0%{transform:rotate(-4deg)}100%{transform:rotate(4deg)}}
html.is-static .b2g3s-glow,html.is-static .m159-sway{animation:none}
html.is-static {.b2g3s-glow,.m159-sway{animation:none}}
`;

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; g1?: string; g2?: string }) {
  return (
    <div ref={r} className="relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#07060f] text-[#f1ecff]">
      <style href="b2g3s-css" precedence="default">
        {CSS}
      </style>
      <div className="b2g3s-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/* ───────────────────────── M159 · Spiral depth fly-through of images (scrub) ───────────────────────── */
const M159_CARDS = ["Dune Robe", "Ash Knit", "Tide Shirt", "Ember Coat", "Salt Linen", "Moss Wrap", "Ink Trench", "Sand Set"];
const M159_GAP = 0.45; // depth gap between cards (in card-progress units)
const M159_SPAN = 0.85 + (M159_CARDS.length - 1) * M159_GAP; // the last card ends just before the camera at p = 1
const M159_STATIC = 0.45;

/** One card's pose for its own progress q (0 = far & dark, 1 = flown past the camera). */
function m159Pose(q: number) {
  const z = -2600 + q * 3400; // far → toward and past the viewer
  const rot = -220 + q * 340; // −220° → 120° on Z
  const bright = 0.2 + 0.8 * clamp01(q / 0.75); // 20% → 100%
  const op = clamp01((0.95 - q) / 0.14) * clamp01((q + 2.4) / 1.0);
  return {
    transform: `translate3d(-50%,-50%,${z.toFixed(1)}px) rotate(${rot.toFixed(2)}deg) translate3d(0,-150px,0)`,
    filter: `brightness(${bright.toFixed(3)})`,
    opacity: op.toFixed(3),
  };
}

function M159() {
  const root = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const count = useRef<HTMLSpanElement>(null);
  useScrub(
    root,
    (p) => {
      let front = 0;
      cards.current.forEach((el, i) => {
        if (!el) return;
        const q = p * M159_SPAN - i * M159_GAP;
        if (q > 0.15) front = i;
        const s = m159Pose(q);
        el.style.transform = s.transform;
        el.style.filter = s.filter;
        el.style.opacity = s.opacity;
      });
      if (count.current) count.current.textContent = String(front + 1).padStart(2, "0");
    },
    { finalValue: M159_STATIC },
  );
  return (
    <Stage r={root}>
      <div className="m159-sway absolute inset-0" style={{ perspective: "900px", perspectiveOrigin: "50% 50%" }}>
        <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
          {M159_CARDS.map((n, i) => {
            const s = m159Pose(M159_STATIC * M159_SPAN - i * M159_GAP);
            return (
              <div
                key={n}
                ref={(el) => {
                  cards.current[i] = el;
                }}
                className="absolute left-1/2 top-1/2 h-[300px] w-[230px] overflow-hidden rounded-[14px] shadow-[0_30px_80px_rgba(0,0,0,.55)] will-change-transform"
                style={{ transform: s.transform, filter: s.filter, opacity: Number(s.opacity) }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={scene(i, 460, 600)} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
                <p className="absolute bottom-3 left-3 text-[13px] font-[600] uppercase tracking-[0.14em] text-white/90" style={{ fontFamily: F.sg }}>
                  {n}
                </p>
              </div>
            );
          })}
        </div>
      </div>
      <div className="pointer-events-none absolute left-[5%] top-[8%]">
        <p className="text-[13px] uppercase tracking-[0.22em] text-[#cbbcff]/80" style={{ fontFamily: F.sg }}>
          Atelier Noor · Winter lookbook
        </p>
        <h3 className="mt-3 max-w-[11ch] text-[clamp(40px,4.6vw,72px)] leading-[0.95] text-[#f6f1ff]" style={{ fontFamily: F.is }}>
          Eight looks, one long night
        </h3>
      </div>
      <div className="pointer-events-none absolute bottom-[8%] right-[5%] text-right" style={{ fontFamily: F.sg }}>
        <p className="text-[clamp(28px,3vw,44px)] font-[600] tabular-nums leading-none">
          <span ref={count}>04</span>
          <span className="text-white/40"> / 08</span>
        </p>
        <p className="mt-2 text-[15px] text-white/60">Full looks from ₹ 9,800</p>
      </div>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  {
    code: "M159",
    name: "Spiral depth fly-through of images",
    how: "Scroll: a stack of looks flies from deep z past the camera, each spinning −220°→120° on Z and brightening 20%→100%.",
    kind: "scrub",
    C: M159,
  },
];
