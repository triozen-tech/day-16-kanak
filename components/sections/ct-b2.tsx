"use client";

// CT · Call-to-action layouts, batch 2 (docs/SECTION-MENU.md).
import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { MagneticButton } from "../fx/layout";
import { Btn, Sec } from "./kit";
import type { SectionDef } from "./types";

// five curves: three from the left edge, two from the right, meeting under the CTA and leaving off the bottom
const CURVES = [
  { d: "M -40 170 C 360 190, 560 420, 700 560 S 720 800, 688 960", c: "var(--sx-accent)", w: 3 },
  { d: "M -40 420 C 300 410, 520 500, 708 578 S 732 820, 708 960", c: "color-mix(in srgb, var(--sx-accent) 55%, var(--sx-text))", w: 2.4 },
  { d: "M -40 760 C 260 680, 560 610, 716 598 S 736 840, 726 960", c: "color-mix(in srgb, var(--sx-text) 70%, transparent)", w: 2 },
  { d: "M 1480 230 C 1080 250, 880 440, 742 560 S 718 800, 748 960", c: "color-mix(in srgb, var(--sx-accent) 70%, var(--sx-bg))", w: 2.6 },
  { d: "M 1480 600 C 1160 560, 900 590, 726 592 S 746 830, 768 960", c: "var(--sx-muted)", w: 2 },
];

/** CT07 · Scroll-drawn lines converging on a CTA: a short sticky stage; five curves draw in from both edges with the scroll and meet under a magnetic button. */
function CT07() {
  const r = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const lines = Array.from(svg.current!.querySelectorAll<SVGPathElement>("[data-draw]"));
      gsap.set(lines, { strokeDasharray: "1 1" });
      gsap.fromTo(lines, { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: "none", stagger: 0.06, scrollTrigger: { trigger: el, start: "top 45%", end: "bottom bottom", scrub: 0.6 } });
      gsap.from("[data-ct07-in]", { y: 30, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.1, scrollTrigger: { trigger: el, start: "top 70%", toggleActions: "play none none reverse" } });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <Sec innerRef={r} theme="ink" font="wide" full className="overflow-clip!">
      <style>{`
        @keyframes ct07-flow { from { stroke-dashoffset: 1.08 } to { stroke-dashoffset: 0 } }
        .ct07-pulse { stroke-dasharray: .08 1; animation: ct07-flow 2.6s linear infinite; }
        html.is-static .ct07-pulse { display: none; }
        html.is-static { .ct07-pulse { display: none; } }
      `}</style>
      <div ref={wrap} className="relative h-[180vh]">
        <div className="sticky top-0 h-svh min-h-[640px] overflow-hidden">
          <svg ref={svg} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
            <defs>
              <filter id="ct07-glow" x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur stdDeviation="7" />
              </filter>
            </defs>
            {CURVES.map((c, k) => (
              <g key={k} fill="none" strokeLinecap="round">
                <path data-draw d={c.d} pathLength={1} stroke={c.c} strokeWidth={c.w * 4} opacity={0.28} filter="url(#ct07-glow)" />
                <path data-draw d={c.d} pathLength={1} stroke={c.c} strokeWidth={c.w} />
                <path d={c.d} pathLength={1} stroke="var(--sx-text)" strokeWidth={c.w + 1} className="ct07-pulse" style={{ animationDelay: `${-k * 0.5}s` }} />
              </g>
            ))}
          </svg>
          <div className="pointer-events-none absolute left-1/2 top-[64%] aspect-square w-[min(44vw,560px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_26%,transparent),transparent)] fx-drift" />

          <div className="relative z-10 mx-auto flex max-w-[980px] flex-col items-center px-6 pt-[clamp(72px,13vh,140px)] text-center">
            <h2 data-ct07-in className="sx-display text-balance text-[clamp(44px,5.4vw,88px)] font-[800] leading-[0.95] tracking-[-0.02em]">
              Five cities. One drop.
            </h2>
            <p data-ct07-in className="mt-6 max-w-[46ch] text-[clamp(16px,1.2vw,19px)] leading-relaxed text-[var(--sx-muted)]">
              The Halden runner lands Friday at 10:00 in Mumbai, Delhi, Bengaluru, Pune and Kochi. 600 pairs, ₹9,490.
            </p>
            <div data-ct07-in className="mt-10 flex flex-wrap items-center justify-center gap-5" style={{ ["--accent" as string]: "var(--sx-accent)" }}>
              <MagneticButton className="text-[17px] text-[var(--sx-accent-text)]!">Join the drop list</MagneticButton>
              <Btn kind="link">See the colourways →</Btn>
            </div>
          </div>
          <p className="absolute inset-x-0 bottom-[clamp(28px,5vh,56px)] z-10 text-center">
            <span className="inline-block rounded-full border border-[var(--sx-line)] bg-[var(--sx-bg)] px-5 py-2.5 text-[13px] uppercase tracking-[0.18em] text-[var(--sx-muted)] shadow-[0_0_0_10px_var(--sx-bg)]">
              Friday 10:00 IST · one pair per person
            </span>
          </p>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "CT07", name: "Scroll-drawn lines converging on a CTA", motion: "M71", C: CT07 }];
