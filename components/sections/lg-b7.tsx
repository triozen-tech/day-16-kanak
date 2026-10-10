"use client";

// LG · Logo / proof layouts, batch 7 (docs/SECTION-MENU.md). Invented marks only (simple inline SVG icons), never a real logo.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Sec } from "./kit";
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

const LG_CSS = `
.lgb7-glow{animation:lgb7-glow 4.4s linear infinite alternate}
@keyframes lgb7-glow{from{transform:translate(-28%,-4%) scale(.9)}to{transform:translate(28%,8%) scale(1.15)}}
.lgb7-sheen{background:linear-gradient(100deg,transparent 35%,color-mix(in srgb,var(--sx-accent) 38%,transparent) 50%,transparent 65%) 0 0/250% 100%;animation:lgb7-sheen 3.2s linear infinite}
@keyframes lgb7-sheen{from{background-position:150% 0}to{background-position:-50% 0}}
html.is-static .lgb7-glow{animation:none}
html.is-static .lgb7-sheen{animation:none;opacity:0}
html.is-static {.lgb7-glow{animation:none}.lgb7-sheen{animation:none;opacity:0}}
`;

const CERTS = [
  { t: "Certified organic", d: "M12 20c-5-2-7-6-7-11 5 0 9 2 10 7M12 20c3-3 4-7 3-11-3 1-5 4-6 7", by: "Soil Trust India" },
  { t: "Fair trade estate", d: "M4 12h4l3-3 3 3h6M8 12l3 3 2-2M14 15l2 2", by: "Open Hands Board" },
  { t: "Rainforest safe", d: "M12 3l6 9h-4l4 6H6l4-6H6zM12 18v3", by: "Canopy Watch" },
  { t: "Plastic-free pack", d: "M7 7h10l-1 13H8zM9 7V5h6v2M10 11l4 5M14 11l-4 5", by: "Clear Shelf Lab" },
  { t: "Carbon neutral", d: "M12 4a8 8 0 1 0 8 8M12 8v4l3 2M16 4h4v4", by: "Low Air Council" },
  { t: "Women-led farms", d: "M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 13v7M9 17h6", by: "Equal Field" },
  { t: "Lab tested", d: "M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3M7 15h10", by: "Purity Bench" },
  { t: "Bee friendly", d: "M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM9 10H4M20 10h-5M12 13v7M8 6l2 2M16 6l-2 2", by: "Pollen Path" },
];

/** LG11 · Segmented icon tile strip: a centred title, then one joined bar of square tiles (2px gaps, only the outer
 *  corners rounded), each with one certification mark, then a button. The bar lights one tile at a time by itself. */
function LG11() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M6");
  const [act] = useAutoCycle(r, CERTS.length, 1100);
  const c = CERTS[act];
  return (
    <Sec innerRef={r} theme="ink" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <style>{LG_CSS}</style>
      <div aria-hidden className="lgb7-glow pointer-events-none absolute left-1/2 top-[45%] aspect-square w-[60vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_40%,transparent),transparent)]" />
      <div className="relative z-10 mx-auto max-w-[1180px] text-center">
        <H className="mx-auto max-w-[16ch] text-[clamp(40px,4.8vw,80px)]">Every leaf, checked eight ways.</H>
        <P className="mx-auto mt-6 max-w-[50ch]">Our first-flush teas carry eight independent seals, renewed every season and posted in full on each tin.</P>

        <div className="relative mx-auto mt-[clamp(44px,5vw,72px)] overflow-hidden rounded-[clamp(18px,1.8vw,26px)]">
          <ul className="grid grid-cols-4 gap-[2px] md:grid-cols-8">
            {CERTS.map((x, k) => (
              <li key={x.t} data-m-card className={`group relative grid aspect-square place-items-center transition-colors duration-500 ${k === act ? "bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "bg-[var(--sx-surface)] text-[var(--sx-text)]"}`} title={x.t}>
                <svg viewBox="0 0 24 24" className={`h-[clamp(34px,3.4vw,52px)] w-[clamp(34px,3.4vw,52px)] transition-transform duration-500 ${k === act ? "scale-110" : ""}`} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={x.d} />
                </svg>
                <span className="sr-only">{x.t}</span>
              </li>
            ))}
          </ul>
          <div aria-hidden className="lgb7-sheen pointer-events-none absolute inset-0 mix-blend-screen" />
        </div>

        <div className="mt-8 flex min-h-[52px] flex-col items-center justify-center gap-1">
          <p key={c.t} className="text-[clamp(18px,1.5vw,22px)] font-[650]">{c.t}</p>
          <p className="text-[14px] text-[var(--sx-muted)]">Verified by {c.by} · renewed March 2026</p>
        </div>
        <div className="mt-8 flex justify-center">
          <Btn kind="ghost">Read the audit reports</Btn>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "LG11", name: "Segmented icon tile strip", motion: "M6", C: LG11 }];
