"use client";

// CT · Call-to-action layouts, batch 3 (docs/SECTION-MENU.md).
import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { FlickeringGrid } from "../fx/more";
import { Btn, Sec } from "./kit";
import type { SectionDef } from "./types";

// tunnel geometry in a 1600×900 viewBox (stretched to the section): the outer frame is the section, the inner box the
// vanishing point where the back wall (and the card) sits
const W = 1600;
const HH = 900;
const IN = { x0: 520, y0: 260, x1: 1080, y1: 640 };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const N = 8; // grid divisions per wall

function tunnelLines() {
  const rays: [number, number, number, number][] = [];
  for (let k = 0; k <= N; k++) {
    const f = k / N;
    rays.push([lerp(IN.x0, IN.x1, f), IN.y0, lerp(0, W, f), 0]); // ceiling
    rays.push([lerp(IN.x0, IN.x1, f), IN.y1, lerp(0, W, f), HH]); // floor
    rays.push([IN.x0, lerp(IN.y0, IN.y1, f), 0, lerp(0, HH, f)]); // left wall
    rays.push([IN.x1, lerp(IN.y0, IN.y1, f), W, lerp(0, HH, f)]); // right wall
  }
  // depth rings: perspective spacing (closer rings further apart)
  const rings = [0.08, 0.2, 0.36, 0.58, 0.86].map((t) => ({ x: lerp(IN.x0, 0, t), y: lerp(IN.y0, 0, t), w: lerp(IN.x1 - IN.x0, W, t), h: lerp(IN.y1 - IN.y0, HH, t) }));
  return { rays, rings };
}
const { rays: RAYS, rings: RINGS } = tunnelLines();
// the beams ride a spread of rays on all four walls
const BEAMS = [3, 9, 14, 18, 22, 27, 30, 33].map((k, j) => ({ ray: RAYS[k], dur: 2.2 + (j % 3) * 0.6, delay: -(j * 0.53) }));

/** CT08 · CTA card in a perspective tunnel: four grid-lined walls recede to a centre, light beams travel along the grid
 *  lines and depth rings rush past; a small CTA card floats at the vanishing point and unfolds from its corner.
 *  Motion M60: a flickering grid fills the back wall (plus the travelling beams). */
function CT08() {
  const r = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);

  // supporting: the card unfolds from its top-left corner as the section arrives
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        card.current,
        { clipPath: "polygon(0 0, 0 0, 0 0, 0 0)" },
        { clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)", duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 60%", toggleActions: "play none none reverse" } },
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <Sec innerRef={r} theme="ink" font="wide" full>
      <style>{`
        @keyframes ct08-beam { from { stroke-dashoffset: 16 } to { stroke-dashoffset: -100 } }
        .ct08-beam { stroke-dasharray: 16 84; animation: ct08-beam linear infinite; }
        @keyframes ct08-ring { 0% { transform: scale(1); opacity: 0 } 20% { opacity: .55 } 100% { transform: scale(${(W / (IN.x1 - IN.x0)).toFixed(2)}, ${(HH / (IN.y1 - IN.y0)).toFixed(2)}); opacity: 0 } }
        .ct08-ring { transform-origin: ${(IN.x0 + IN.x1) / 2}px ${(IN.y0 + IN.y1) / 2}px; animation: ct08-ring 4.2s cubic-bezier(.55,0,.9,.6) infinite; }
        html.is-static .ct08-beam, html.is-static .ct08-ring { animation: none; }
        html.is-static .ct08-ring { opacity: 0; }
        html.is-static { .ct08-beam, .ct08-ring { animation: none; } .ct08-ring { opacity: 0; } }
      `}</style>
      <div className="relative h-[clamp(640px,96svh,960px)] overflow-hidden">
        {/* back wall: the flickering grid sits exactly in the vanishing box */}
        <div className="absolute" style={{ left: `${(IN.x0 / W) * 100}%`, top: `${(IN.y0 / HH) * 100}%`, width: `${((IN.x1 - IN.x0) / W) * 100}%`, height: `${((IN.y1 - IN.y0) / HH) * 100}%` }}>
          <div className="absolute inset-0 bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_22%,transparent),transparent)]" />
          <FlickeringGrid className="absolute inset-0" color="79,141,255" size={5} gap={7} chance={0.4} maxOpacity={0.5} />
        </div>

        <svg viewBox={`0 0 ${W} ${HH}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
          <defs>
            <radialGradient id="ct08-fade" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="var(--sx-bg)" stopOpacity="0" />
              <stop offset="100%" stopColor="var(--sx-bg)" stopOpacity=".6" />
            </radialGradient>
          </defs>
          <g stroke="var(--sx-text)" strokeOpacity=".14" fill="none">
            {RAYS.map(([x1, y1, x2, y2], k) => (
              <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} vectorEffect="non-scaling-stroke" />
            ))}
            {RINGS.map((g, k) => (
              <rect key={k} x={g.x} y={g.y} width={g.w} height={g.h} vectorEffect="non-scaling-stroke" />
            ))}
            <rect x={IN.x0} y={IN.y0} width={IN.x1 - IN.x0} height={IN.y1 - IN.y0} strokeOpacity=".3" vectorEffect="non-scaling-stroke" />
          </g>
          {/* depth rings rushing toward the viewer */}
          <g stroke="var(--sx-accent)" fill="none">
            {[0, 1, 2].map((k) => (
              <rect key={k} className="ct08-ring" x={IN.x0} y={IN.y0} width={IN.x1 - IN.x0} height={IN.y1 - IN.y0} strokeWidth={1.5} vectorEffect="non-scaling-stroke" style={{ animationDelay: `${-k * 1.4}s` }} />
            ))}
          </g>
          {/* light beams travelling outward along the grid lines */}
          <g stroke="var(--sx-accent)" strokeLinecap="round" fill="none" style={{ filter: "drop-shadow(0 0 6px var(--sx-accent))" }}>
            {BEAMS.map(({ ray: [x1, y1, x2, y2], dur, delay }, k) => (
              <line key={k} className="ct08-beam" x1={x1} y1={y1} x2={x2} y2={y2} pathLength={100} strokeWidth={4} vectorEffect="non-scaling-stroke" style={{ animationDuration: `${dur}s`, animationDelay: `${delay}s` }} />
            ))}
          </g>
          <rect width={W} height={HH} fill="url(#ct08-fade)" />
        </svg>

        {/* the card at the vanishing point */}
        <div className="absolute inset-0 grid place-items-center px-6">
          <div ref={card} className="sx-card relative w-[clamp(300px,25vw,440px)] bg-[color-mix(in_srgb,var(--sx-surface)_86%,transparent)] p-[clamp(22px,2vw,32px)] shadow-[0_30px_80px_-20px_color-mix(in_srgb,var(--sx-accent)_45%,transparent)] backdrop-blur-md">
            <div className="flex items-center justify-between text-[12px] uppercase tracking-[0.16em] text-[var(--sx-muted)]">
              <span>Field 2 · open-back</span>
              <span className="text-[var(--sx-accent)]">March</span>
            </div>
            <h2 className="sx-display mt-5 text-[clamp(30px,2.6vw,44px)] font-[800] leading-[0.95] tracking-[-0.02em]">Hear it first.</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--sx-muted)]">Hand-tuned headphones from the Halden listening room. ₹24,900, first 500 ship numbered.</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Btn>Join the list</Btn>
              <Btn kind="link">Listen →</Btn>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "CT08", name: "CTA card in a perspective tunnel", motion: "M60", C: CT08 }];
