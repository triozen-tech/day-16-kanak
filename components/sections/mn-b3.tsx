"use client";

// MN · Menu layouts, batch 3 (docs/SECTION-MENU.md).
import { useRef } from "react";
import { H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/* ───────────────────────── MN04 · Two-half menu split by a rule ───────────────────────── */

const MN04_DISHES = [
  { n: "Masala omelette bun", p: "₹320", i: 0 },
  { n: "Ragi pancakes, jaggery", p: "₹360", i: 1 },
  { n: "Akuri on sourdough", p: "₹380", i: 2 },
  { n: "Avocado & podi toast", p: "₹420", i: 3 },
  { n: "Coconut granola bowl", p: "₹340", i: 1 },
  { n: "Kerala egg roast", p: "₹390", i: 2 },
  { n: "Banana bread, ghee", p: "₹260", i: 0 },
  { n: "Mushroom kheema pao", p: "₹370", i: 3 },
];
const MN04_BREW = [
  ["Espresso, single origin", "₹180"],
  ["V60 pour-over", "₹260"],
  ["Aeropress", "₹240"],
  ["Cold brew, 16 hours", "₹220"],
  ["Batch filter, refills free", "₹160"],
];
const MN04_ALT = [
  ["Masala chai, slow-boiled", "₹140"],
  ["Ceremonial matcha latte", "₹280"],
  ["Hot cocoa, 70%", "₹220"],
  ["Hibiscus iced tea", "₹180"],
];

const MN04_CSS = `
.mn04-track{animation:mn04-slide 36s linear infinite}
@keyframes mn04-slide{from{transform:translateX(0)}to{transform:translateX(-50%)}}
html.is-static .mn04-track{animation:none}
html.is-static {.mn04-track{animation:none}}
`;

const Hours = ({ children }: { children: React.ReactNode }) => <p className="mt-2 text-[14px] font-[600] uppercase tracking-[0.12em] text-[var(--sx-accent)]">{children}</p>;

function Rows({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <div>
      <p className="text-[13px] font-[650] uppercase tracking-[0.16em] text-[var(--sx-muted)]">{title}</p>
      <ul className="mt-3">
        {rows.map(([n, p]) => (
          <li key={n} className="flex items-baseline gap-3 border-b border-[var(--sx-line)] py-3 text-[clamp(16px,1.2vw,19px)]">
            <span>{n}</span>
            <span className="mb-[5px] flex-1 border-b border-dotted border-[var(--sx-line)]" />
            <span className="tabular-nums font-[600]">{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** MN04 · Two equal halves divided by a vertical rule. Left, Brunch: a line icon, service hours, short copy and a
 *  carousel of eight dish photos that drifts by itself. Right, Coffee: icon, hours, a brewing-methods list and an
 *  alternative-drinks list with prices. */
function MN04() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M1");
  const loop = [...MN04_DISHES, ...MN04_DISHES];
  return (
    <Sec innerRef={r} theme="paper" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <style>{MN04_CSS}</style>
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-[var(--sx-line)] pb-[clamp(28px,3vw,44px)]">
        <H className="text-[clamp(52px,6.4vw,112px)]">Morrow, all day.</H>
        <p className="max-w-[36ch] pb-2 text-[15px] text-[var(--sx-muted)]">Café and kitchen on Castle Street, Bengaluru. No reservations under six; we keep a pot on for those who wait.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)]">
        {/* Brunch */}
        <div className="min-w-0 pt-[clamp(32px,4vw,56px)] md:pr-[clamp(28px,3.4vw,56px)]">
          <div className="flex items-start gap-5">
            <svg viewBox="0 0 48 48" className="h-12 w-12 shrink-0 text-[var(--sx-accent)]" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <ellipse cx="24" cy="30" rx="20" ry="8" />
              <path d="M10 28c3-10 25-10 28 0" />
              <circle cx="24" cy="23" r="4.5" />
              <path d="M16 8c-2 3 2 4 0 7M24 6c-2 3 2 4 0 7M32 8c-2 3 2 4 0 7" />
            </svg>
            <div>
              <h3 data-m-head className="sx-display text-[clamp(40px,4vw,64px)] leading-none">Brunch</h3>
              <Hours>Daily · 8:00 – 15:00</Hours>
            </div>
          </div>
          <P className="mt-6 max-w-[42ch]">Slow plates from the morning market: millet, eggs from Hosur, our own sourdough and a pickle shelf that changes every week.</P>
        </div>

        <span className="hidden bg-[var(--sx-line)] md:block md:row-span-2" />

        {/* Coffee */}
        <div className="pt-[clamp(32px,4vw,56px)] md:row-span-2 md:pl-[clamp(28px,3.4vw,56px)]">
          <div className="flex items-start gap-5">
            <svg viewBox="0 0 48 48" className="h-12 w-12 shrink-0 text-[var(--sx-accent)]" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <path d="M8 18h26v12a10 10 0 0 1-10 10h-6A10 10 0 0 1 8 30z" />
              <path d="M34 21h3a5 5 0 0 1 0 10h-3" />
              <path d="M16 6c-2 3 2 4 0 7M24 6c-2 3 2 4 0 7" />
            </svg>
            <div>
              <h3 data-m-head className="sx-display text-[clamp(40px,4vw,64px)] leading-none">Coffee</h3>
              <Hours>Daily · 7:30 – 18:00</Hours>
            </div>
          </div>
          <P className="mt-6 max-w-[42ch]">Beans from two estates in Chikmagalur, roasted on Mondays. Ask for oat, almond or buffalo milk.</P>
          <div className="mt-[clamp(28px,3vw,44px)] grid grid-cols-1 gap-[clamp(24px,3vw,40px)]">
            <Rows title="Brewing methods" rows={MN04_BREW} />
            <Rows title="Not coffee" rows={MN04_ALT} />
          </div>
        </div>

        {/* the dish carousel, under the brunch copy */}
        <div className="min-w-0 pt-[clamp(28px,3vw,44px)] md:pr-[clamp(28px,3.4vw,56px)]">
          <div className="-mr-[clamp(28px,3.4vw,56px)] overflow-hidden [mask-image:linear-gradient(90deg,#000_80%,transparent)]">
            <div className="mn04-track flex w-max gap-4">
              {loop.map((d, k) => (
                <figure key={k} className="w-[clamp(180px,14vw,230px)] shrink-0">
                  <Pic i={d.i} ratio="4/5" label="" />
                  <figcaption className="mt-3 flex items-baseline justify-between gap-2 text-[14px]">
                    <span className="truncate">{d.n}</span>
                    <span className="shrink-0 tabular-nums font-[600]">{d.p}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
          <p className="mt-6 text-[14px] text-[var(--sx-muted)]">Weekend brunch set, any plate with a coffee: ₹520</p>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "MN04", name: "Two-half menu split by a rule", motion: "M1", C: MN04 }];
