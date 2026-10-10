"use client";

// LG · Logo layouts, batch 6 (docs/SECTION-MENU.md). All stockist names are invented wordmarks.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Hands-free cycling: steps an index every `ms` while the section is on screen (stops off screen and in ?static=1). */
function useAutoCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms = 2200) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let t: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (e.isIntersecting) t = setInterval(() => setI((v) => (v + 1) % n), ms);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, [ref, n, ms]);
  return [i, setI] as const;
}

/** Scoped keyframes (off in ?static=1 and with reduced motion). The band is the CSS-only never-frozen safety net. */
const LG_CSS = `
.lgb6-band{animation:lgb6-band 3.2s linear infinite}
@keyframes lgb6-band{from{translate:-40% 0}to{translate:420% 0}}
.lgb6-in{animation:lgb6-in .7s cubic-bezier(.2,.8,.2,1) both}
@keyframes lgb6-in{from{opacity:0;transform:translateY(60%);filter:blur(6px)}to{opacity:1;transform:none;filter:none}}
html.is-static .lgb6-band{animation:none;opacity:0}
html.is-static .lgb6-in{animation:none}
html.is-static {.lgb6-band{animation:none;opacity:0}.lgb6-in{animation:none}}
`;

/** Small invented marks (simple shapes, never a real logo). */
const Mark = ({ k }: { k: number }) => (
  <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    {k % 6 === 0 && <circle cx="12" cy="12" r="8" />}
    {k % 6 === 1 && <path d="M12 4l8 16H4z" />}
    {k % 6 === 2 && <rect x="6" y="6" width="12" height="12" transform="rotate(45 12 12)" />}
    {k % 6 === 3 && <path d="M4 16a8 8 0 0 1 16 0M8 16a4 4 0 0 1 8 0" />}
    {k % 6 === 4 && <path d="M5 5h14v14H5zM5 12h14" />}
    {k % 6 === 5 && <circle cx="12" cy="12" r="8" fill="currentColor" />}
  </svg>
);

/* ───────────────────────── LG10 · Labelled logo row with divider ───────────────────────── */

const LG10_SETS = [
  ["Northfold", "Kiln & Co", "Halcyon", "Meridia", "Arcwell", "Solano"],
  ["Fennick", "Orbitale", "Copperleaf", "Tamarind", "Loam", "Pepperpot"],
];

/** LG10 · One line: a caption right-aligned in a fixed column with a vertical rule, the stockists' wordmarks spread evenly
 *  across the rest. Slots swap to the next stockist one at a time, by themselves. */
function LG10() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M6");
  const [tick] = useAutoCycle(r, 12, 700);
  // slot k shows the second set once tick has passed it (wraps every 6 ticks): a wave of swaps along the row
  const showB = (k: number) => (tick < 6 ? k < tick : k >= tick - 6);
  return (
    <Sec innerRef={r} theme="paper" font="grotesk" className="py-[clamp(64px,7vw,112px)]">
      <style>{LG_CSS}</style>
      <div className="relative overflow-hidden rounded-[var(--sx-radius)] border border-[var(--sx-line)] bg-[var(--sx-surface)]">
        {/* soft accent band sweeping along the strip */}
        <div aria-hidden className="lgb6-band pointer-events-none absolute inset-y-[-40%] left-0 w-[26%] bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_36%,transparent),transparent)]" />
        <div className="relative grid grid-cols-1 items-center md:grid-cols-[clamp(240px,22vw,320px)_minmax(0,1fr)]">
          <p data-m-head className="border-b border-[var(--sx-line)] px-[clamp(20px,2.4vw,36px)] py-7 text-[clamp(17px,1.4vw,21px)] font-[600] leading-[1.3] md:border-b-0 md:border-r md:text-right">
            Poured in 140+ cafés
            <span className="block font-[400] text-[var(--sx-muted)]">and stocked by these shops</span>
          </p>
          <ul className="grid grid-cols-2 gap-y-6 px-[clamp(20px,2.4vw,36px)] py-7 sm:grid-cols-3 lg:grid-cols-6">
            {LG10_SETS[0].map((_, k) => {
              const b = showB(k);
              const name = LG10_SETS[b ? 1 : 0][k];
              return (
                <li key={k} data-m-card className="flex min-w-0 justify-center overflow-hidden">
                  <span key={name} className={`lgb6-in flex min-w-0 items-center gap-2 text-[var(--sx-muted)] ${k % 2 ? "text-[17px] font-[700] italic" : "text-[14px] font-[650] uppercase tracking-[0.16em]"}`}>
                    <Mark k={k + (b ? 3 : 0)} />
                    <span className="truncate">{name}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "LG10", name: "Labelled logo row with divider", motion: "M6", C: LG10 }];
