"use client";

// EV · Events & roadmap layouts (docs/SECTION-MENU.md), batch 6. Cards fly in and lock into their quarter; then the
// roadmap spotlights one drop after another by itself while on screen. Loops stop in ?static=1.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Hands-free cycling: steps an index every `ms` while the section is on screen (stops off screen and in ?static=1). */
function useAutoCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms = 1400) {
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

const EV_CSS = `.ev6-glow{background:radial-gradient(closest-side,color-mix(in srgb,var(--sx-accent) 40%,transparent),transparent);animation:ev6-glow 6s linear infinite alternate}@keyframes ev6-glow{from{translate:-40% 0}to{translate:40% -10%}}
.ev6-now{background:repeating-linear-gradient(-45deg,color-mix(in srgb,var(--sx-accent) 55%,transparent) 0 8px,transparent 8px 16px);background-size:200% 100%;animation:ev6-now 1.6s linear infinite}@keyframes ev6-now{to{background-position:-45px 0}}
.is-static .ev6-glow,.is-static .ev6-now{animation:none}
html.is-static {.ev6-glow,.ev6-now{animation:none}}`;

type Status = "Live" | "In production" | "Sampling" | "Planned";
const STATUS: Record<Status, string> = {
  Live: "bg-[var(--sx-accent)] border-[var(--sx-accent)]",
  "In production": "bg-[color-mix(in_srgb,var(--sx-accent)_55%,transparent)] border-transparent",
  Sampling: "bg-[color-mix(in_srgb,var(--sx-accent)_22%,transparent)] border-transparent",
  Planned: "bg-transparent border-[var(--sx-muted)]",
};

const QUARTERS: { q: string; m: string; now?: boolean; cards: { t: string; tag: string; s: Status; p?: string }[] }[] = [
  {
    q: "Spring",
    m: "Jan – Mar",
    cards: [
      { t: "Lattice Runner 2", tag: "Runner", s: "Live", p: "₹8,990" },
      { t: "Chalk court low, re-stock", tag: "Restock", s: "Live", p: "₹6,490" },
    ],
  },
  {
    q: "Summer",
    m: "Apr – Jun",
    now: true,
    cards: [
      { t: "Monsoon Trail GTX", tag: "Trail", s: "In production", p: "₹11,490" },
      { t: "Linen-knit slip-on", tag: "Lifestyle", s: "In production", p: "₹5,990" },
      { t: "Kids' first runner", tag: "Kids", s: "Sampling" },
    ],
  },
  {
    q: "Monsoon",
    m: "Jul – Sep",
    cards: [
      { t: "Studio collab, 400 pairs", tag: "Collab", s: "Sampling" },
      { t: "Repair & resole service", tag: "Service", s: "Planned" },
    ],
  },
  {
    q: "Winter",
    m: "Oct – Dec",
    cards: [
      { t: "Lattice Mid, wool upper", tag: "Runner", s: "Planned" },
      { t: "Festive colour drop", tag: "Colourway", s: "Planned" },
      { t: "Archive reissue No. 1", tag: "Reissue", s: "Planned" },
    ],
  },
];

/** EV07 · Quarter columns roadmap: four columns (seasons), each with drop cards tagged by category and a status colour;
 *  the current season is marked. Cards fly in and lock into their column; one card at a time is spotlit. */
function EV07() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  const total = QUARTERS.reduce((a, q) => a + q.cards.length, 0);
  const [on] = useAutoCycle(r, total, 1300);
  const starts = QUARTERS.map((_, k) => QUARTERS.slice(0, k).reduce((a, q) => a + q.cards.length, 0));
  return (
    <Sec innerRef={r} theme="paper" font="condensed" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#d2492a", ["--sx-accent-text" as string]: "#fff6f2" }}>
      <style>{EV_CSS}</style>
      <div className="ev6-glow pointer-events-none absolute left-[25%] top-[30%] aspect-square w-[55%] rounded-full" />
      <div className="relative grid grid-cols-1 items-end gap-[clamp(20px,4vw,64px)] md:grid-cols-12">
        <H className="text-[clamp(48px,5.6vw,96px)] uppercase md:col-span-7">The year ahead, in drops.</H>
        <div className="md:col-span-5 md:pb-3">
          <P className="max-w-[42ch]">What we are making next, season by season. Join the list and you hear about each drop a day before everyone else.</P>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] text-[var(--sx-muted)]">
            {(Object.keys(STATUS) as Status[]).map((s) => (
              <span key={s} className="inline-flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full border ${STATUS[s]}`} />
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="relative mt-[clamp(40px,5vw,72px)] grid grid-cols-1 gap-[clamp(12px,1.4vw,20px)] md:grid-cols-4">
        {QUARTERS.map((q, qi) => (
          <div key={q.q} className={`relative min-w-0 overflow-hidden rounded-[22px] border p-[clamp(12px,1.2vw,18px)] ${q.now ? "border-[var(--sx-accent)] bg-[color-mix(in_srgb,var(--sx-accent)_7%,var(--sx-surface))]" : "border-[var(--sx-line)] bg-[color-mix(in_srgb,var(--sx-surface)_70%,transparent)]"}`}>
            {q.now && <div className="ev6-now absolute inset-x-0 top-0 h-[6px]" />}
            <div className="flex items-baseline justify-between gap-3 px-2 pb-4 pt-2">
              <p className="sx-display text-[clamp(28px,2.6vw,40px)] uppercase leading-none">{q.q}</p>
              <p className="text-[13px] text-[var(--sx-muted)]">{q.now ? "Now" : q.m}</p>
            </div>
            <div className="flex flex-col gap-[clamp(8px,0.9vw,12px)]">
              {q.cards.map((c, ci) => {
                const lit = starts[qi] + ci === on;
                return (
                  <article
                    key={c.t}
                    data-m-card
                    className={`sx-card p-4 transition-[box-shadow,translate] duration-500 ${lit ? "-translate-y-1 shadow-[0_0_0_2px_var(--sx-accent),0_24px_40px_-24px_rgba(60,20,10,.5)]" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full border border-[var(--sx-line)] px-2.5 py-1 text-[12px] font-[650] uppercase tracking-[0.1em] text-[var(--sx-muted)]">{c.tag}</span>
                      <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--sx-muted)]">
                        <span className={`h-2.5 w-2.5 rounded-full border ${STATUS[c.s]}`} />
                        {c.s}
                      </span>
                    </div>
                    <p className="mt-4 text-[17px] font-[650] leading-snug">{c.t}</p>
                    {c.p && <p className="mt-1 text-[14px] tabular-nums text-[var(--sx-muted)]">From {c.p}</p>}
                  </article>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="relative mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--sx-line)] pt-8">
        <p className="text-[15px] text-[var(--sx-muted)]">Dates can move. Members are told first, always.</p>
        <Btn>Get early access</Btn>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "EV07", name: "Quarter columns roadmap", motion: "M34", C: EV07 }];
