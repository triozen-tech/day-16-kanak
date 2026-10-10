"use client";

// FO · Footer layouts, batch 4 (docs/SECTION-MENU.md). Invented house name; concept note kept.
import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { Btn, Sec } from "./kit";
import type { SectionDef } from "./types";

const C = 220; // centre of the 440 × 440 viewBox
const RINGS = [
  { r: 196, size: 14, text: "Vahra Parfums ✦ Distilled in Kannauj ✦ Aged in glass ✦ Poured by hand ✦ Refilled forever ✦ ", dur: "30s", dir: "cw", weight: 600, op: 1 },
  { r: 150, size: 13, text: "Oud ✦ Vetiver ✦ Rose ✦ Neroli ✦ Amber ✦ Rain ✦ Smoke ✦ Saffron ✦ Musk ✦ ", dur: "22s", dir: "ccw", weight: 500, op: 0.75 },
  { r: 106, size: 12, text: "Since 2019 ✦ Small batches ✦ Since 2019 ✦ Small batches ✦ ", dur: "17s", dir: "cw", weight: 500, op: 0.55 },
];
const ringPath = (r: number) => `M ${C},${C - r} a ${r},${r} 0 1,1 0,${2 * r} a ${r},${r} 0 1,1 0,-${2 * r}`;

const COLS = [
  { t: "Shop", l: ["Eaux de parfum", "Attars", "Discovery set · ₹1,450", "Gift cards"] },
  { t: "House", l: ["Our distillery", "The perfumers", "Journal", "Refill programme"] },
];

/** FO12 · Circular text-ribbon footer: at the centre, nested circles of text ribbons loop marquee-style copy along
 *  circular paths in opposite directions; links and legal sit around them.
 *  Motion M33: the rings orbit forever (CSS rotation), after spinning open on entry. */
function FO12() {
  const r = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const once = { trigger: el, start: "top 80%", toggleActions: "play none none reverse" } as const;
      gsap.from(el.querySelectorAll("[data-fo12-ring]"), { scale: 0.55, rotation: -120, opacity: 0, transformOrigin: "50% 50%", duration: 1.4, ease: "power3.out", stagger: 0.12, scrollTrigger: once });
      gsap.from(el.querySelectorAll("[data-fo12-mark]"), { scale: 0.8, opacity: 0, duration: 1, ease: "power3.out", delay: 0.4, scrollTrigger: once });
      gsap.from(el.querySelectorAll("[data-fo12-side]"), { y: 30, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, delay: 0.2, scrollTrigger: once });
    }, el);
    return () => ctx.revert();
  }, []);
  return (
    <Sec innerRef={r} theme="ink" font="editorial" className="pt-[clamp(72px,9vw,140px)] pb-10">
      <style>{`
        @keyframes fo12-cw { to { transform: rotate(360deg) } }
        @keyframes fo12-ccw { to { transform: rotate(-360deg) } }
        @keyframes fo12-glow { 0%,100% { opacity: .55; transform: scale(1) } 50% { opacity: 1; transform: scale(1.12) } }
        .fo12-ring { transform-box: view-box; transform-origin: ${C}px ${C}px; }
        .fo12-cw { animation: fo12-cw var(--d) linear infinite; }
        .fo12-ccw { animation: fo12-ccw var(--d) linear infinite; }
        .fo12-glow { animation: fo12-glow 3.4s ease-in-out infinite; }
        html.is-static .fo12-cw, html.is-static .fo12-ccw, html.is-static .fo12-glow { animation: none; }
        html.is-static { .fo12-cw, .fo12-ccw, .fo12-glow { animation: none; } }
      `}</style>

      <div className="grid grid-cols-1 items-center gap-[clamp(40px,4vw,64px)] md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        {/* left: links */}
        <div data-fo12-side className="grid grid-cols-2 gap-8">
          {COLS.map((c) => (
            <div key={c.t}>
              <p className="text-[13px] font-[600] uppercase tracking-[0.16em] text-[var(--sx-muted)]">{c.t}</p>
              <ul className="mt-5 space-y-3">
                {c.l.map((x) => (
                  <li key={x}>
                    <a href="#" onClick={(e) => e.preventDefault()} className="text-[16px] transition-colors hover:text-[var(--sx-accent)]">
                      {x}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* centre: the ribbons, clipped to their own round stage */}
        <div className="relative mx-auto aspect-square w-[clamp(320px,34vw,540px)] overflow-hidden rounded-full">
          <div className="fo12-glow absolute inset-[22%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_45%,transparent),transparent)]" />
          <svg viewBox="0 0 440 440" className="absolute inset-0 h-full w-full" aria-label="Vahra Parfums">
            <defs>
              {RINGS.map((g, k) => (
                <path key={k} id={`fo12-p${k}`} d={ringPath(g.r)} fill="none" />
              ))}
            </defs>
            {RINGS.map((g, k) => (
              <g key={k} data-fo12-ring>
                <circle cx={C} cy={C} r={g.r + g.size * 0.95} fill="none" stroke="var(--sx-line)" />
                <g className={`fo12-ring fo12-${g.dir}`} style={{ ["--d" as string]: g.dur }}>
                  <text fill="var(--sx-text)" fontSize={g.size} fontWeight={g.weight} letterSpacing="0.14em" opacity={g.op} style={{ textTransform: "uppercase" }}>
                    <textPath href={`#fo12-p${k}`} textLength={(2 * Math.PI * g.r - 4).toFixed(1)} lengthAdjust="spacing">
                      {g.text}
                    </textPath>
                  </text>
                </g>
              </g>
            ))}
          </svg>
          <div data-fo12-mark className="absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="sx-display text-[clamp(30px,2.8vw,46px)] italic leading-none">Vahra</p>
              <p className="mt-2 text-[12px] uppercase tracking-[0.3em] text-[var(--sx-muted)]">Parfums</p>
            </div>
          </div>
        </div>

        {/* right: visit + newsletter */}
        <div data-fo12-side className="md:justify-self-end md:text-right">
          <p className="text-[13px] font-[600] uppercase tracking-[0.16em] text-[var(--sx-muted)]">Visit the atelier</p>
          <p className="sx-display mt-5 max-w-[18ch] text-[clamp(24px,2vw,32px)] leading-[1.15] md:ml-auto">Smell before you choose, by appointment.</p>
          <div className="mt-7 flex flex-wrap gap-3 md:justify-end">
            <Btn>Book a sitting</Btn>
            <Btn kind="ghost">Journal</Btn>
          </div>
        </div>
      </div>

      <div className="mt-[clamp(48px,6vw,88px)] flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-t border-[var(--sx-line)] pt-6 text-[13px] text-[var(--sx-muted)]">
        <p>© 2026 Vahra Parfums · Concept website by Showreel Studio</p>
        <div className="flex flex-wrap gap-6">
          {["Shipping", "Privacy", "Terms", "Contact"].map((x) => (
            <a key={x} href="#" onClick={(e) => e.preventDefault()} className="transition-colors hover:text-[var(--sx-text)]">
              {x}
            </a>
          ))}
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "FO12", name: "Circular text-ribbon footer", motion: "M33", C: FO12 }];
