"use client";

// PD · Process layouts, batch 4 (docs/SECTION-MENU.md). Full designed sections; motion via useSectionMotion.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Price, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Hands-free cycling: steps an index every `ms` while the section is on screen (stops off screen and in ?static=1). */
function useAutoCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms = 2000) {
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

/** Moving diagonal stripes over the active phase (a large, visible area change); off in ?static=1 / reduced motion. */
const PD_CSS = `
.pdb4-stripes{background-image:repeating-linear-gradient(-45deg,rgba(255,255,255,.22) 0 12px,transparent 12px 26px);background-size:36.77px 36.77px;animation:pdb4-move .9s linear infinite}
@keyframes pdb4-move{to{background-position:36.77px 0}}
html.is-static .pdb4-stripes{animation:none}
html.is-static {.pdb4-stripes{animation:none}}
`;

const PD05_PHASES = [
  { n: "Survey", w: "1 week", fr: 2, mix: 30, b: ["Laser-measured floor plan", "Wiring, plumbing and damp report"] },
  { n: "Design", w: "3 weeks", fr: 3, mix: 48, b: ["Two layouts, one chosen", "Materials board you can touch"] },
  { n: "Approvals", w: "2 weeks", fr: 2.4, mix: 64, b: ["Society and BMC paperwork", "Fixed quote, signed once"] },
  { n: "Build", w: "8 weeks", fr: 5, mix: 100, b: ["One site lead, daily photo log", "Weekly walk-through on Saturdays"] },
  { n: "Handover", w: "1 week", fr: 2, mix: 40, b: ["Deep clean and snag list", "Two-year workmanship cover"] },
];

/** PD05 · One full-width bar split into five coloured phase segments (width = share of the time); under each segment
 *  its name, duration and two bullets. The segments unfold in; the current phase steps along by itself. */
function PD05() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M18");
  const [a, setA] = useAutoCycle(r, PD05_PHASES.length, 1700);
  const cols = PD05_PHASES.map((p) => `minmax(0,${p.fr}fr)`).join(" ");
  return (
    <Sec innerRef={r} theme="stone" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <style>{PD_CSS}</style>
      <div className="grid grid-cols-1 items-end gap-[clamp(24px,4vw,64px)] md:grid-cols-12">
        <H className="text-[clamp(48px,6vw,100px)] md:col-span-7">Fifteen weeks, door to door.</H>
        <P className="max-w-[40ch] md:col-span-5 md:pb-2">How we renovate a Mumbai flat: five phases, one site lead, and a fixed price you sign before a single wall comes down.</P>
      </div>

      <div className="mt-[clamp(48px,6vw,88px)] grid grid-cols-1 gap-x-[6px] md:[grid-template-columns:var(--pd-cols)]" style={{ ["--pd-cols" as string]: cols }}>
        {/* the bar */}
        {PD05_PHASES.map((p, k) => (
          <button
            key={p.n}
            type="button"
            data-m-card
            onMouseEnter={() => setA(k)}
            onClick={() => setA(k)}
            aria-label={`${p.n}, ${p.w}`}
            className={`relative h-[clamp(64px,6.4vw,96px)] overflow-hidden text-left transition-[filter,transform] duration-500 max-md:mt-4 md:row-start-1 ${k === 0 ? "md:rounded-l-[var(--sx-radius)]" : ""} ${k === PD05_PHASES.length - 1 ? "md:rounded-r-[var(--sx-radius)]" : ""} max-md:rounded-[12px] ${k === a ? "md:-translate-y-2" : ""}`}
            style={{ background: `color-mix(in srgb, var(--sx-accent) ${p.mix}%, var(--sx-surface))`, order: k * 2 }}
          >
            {k === a && <span className="pdb4-stripes absolute inset-0" />}
            <span className={`relative flex h-full items-end justify-between p-[clamp(12px,1.4vw,20px)] text-[14px] font-[650] ${p.mix >= 60 ? "text-[var(--sx-accent-text)]" : "text-[var(--sx-text)]"}`}>
              <span className="tabular-nums">{p.w}</span>
              {k === a && <span className="rounded-full bg-[var(--sx-text)] px-3 py-1 text-[12px] text-[var(--sx-bg)]">Now</span>}
            </span>
          </button>
        ))}
        {/* the columns hanging below */}
        {PD05_PHASES.map((p, k) => (
          <div key={`${p.n}-t`} className={`border-l pt-6 pl-[clamp(12px,1.2vw,18px)] pr-3 transition-colors duration-500 max-md:pb-2 md:row-start-2 ${k === a ? "border-[var(--sx-accent)]" : "border-[var(--sx-line)]"}`} style={{ order: k * 2 + 1 }}>
            <p data-m-text className={`sx-display text-[clamp(22px,1.9vw,30px)] font-[750] leading-none tracking-[-0.02em] transition-colors duration-500 ${k === a ? "text-[var(--sx-accent)]" : ""}`}>
              {p.n}
            </p>
            <p className="mt-2 text-[14px] text-[var(--sx-muted)]">{p.w}</p>
            <ul className="mt-5 space-y-2 text-[15px] leading-snug">
              {p.b.map((b) => (
                <li key={b} className="flex gap-2">
                  <span className="mt-[7px] h-[6px] w-[6px] shrink-0 rounded-full bg-[var(--sx-accent)]" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-[clamp(48px,6vw,80px)] flex flex-wrap items-center justify-between gap-6 border-t border-[var(--sx-line)] pt-8">
        <p className="text-[16px] text-[var(--sx-muted)]">
          A two-bedroom flat, fixed quote from <Price now="₹14,80,000" className="text-[20px] text-[var(--sx-text)]" />
        </p>
        <div className="flex flex-wrap gap-4">
          <Btn>Book a survey · ₹2,500</Btn>
          <Btn kind="ghost">See finished homes</Btn>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "PD05", name: "Segmented phase bar", motion: "M18", C: PD05 }];
