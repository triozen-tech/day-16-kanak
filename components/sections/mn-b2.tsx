"use client";

// MN · Menu layouts (docs/SECTION-MENU.md), batch 2. Each is a full designed section; motion via useSectionMotion.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Hands-free cycling: steps an index every `ms` while the section is on screen (stops off screen and in ?static=1). */
function useAutoCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms = 1600) {
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

const MN03_CSS = `.mn03-dot{animation:mn03-dot 1.4s ease-in-out infinite}@keyframes mn03-dot{0%,100%{box-shadow:0 0 0 0 color-mix(in srgb,var(--sx-accent) 55%,transparent)}50%{box-shadow:0 0 0 8px transparent}}
.mn03-glow{animation:mn03-glow 5s ease-in-out infinite alternate}@keyframes mn03-glow{from{translate:-8% -4%;opacity:.55}to{translate:10% 6%;opacity:1}}
.is-static .mn03-dot,.is-static .mn03-glow{animation:none}html.is-static {.mn03-dot,.mn03-glow{animation:none}}`;

const MENUS = [
  { n: "À la carte", d: "Wood-fired plates, changed every Thursday", m: "PDF · 2 pages" },
  { n: "Bar lunch", d: "Small plates at the counter, 12 to 4", m: "PDF · 1 page" },
  { n: "Desserts", d: "Jaggery, cardamom and burnt cream", m: "PDF · 1 page" },
  { n: "Drinks", d: "House sodas, shrubs and low-proof spritz", m: "PDF · 2 pages" },
  { n: "Wine", d: "140 bins, 22 of them by the glass", m: "PDF · 6 pages" },
];

const HOURS = [
  ["Lunch", "Tue – Sun", "12:00 – 15:30"],
  ["Dinner", "Tue – Sat", "18:30 – 23:30"],
  ["Sunday supper", "Sun", "18:00 – 22:00"],
];

/** MN03 · Menu index + sticky service card: five big menu rows with 'View menu' arrows (7 cols) beside a sticky
 *  hours / booking card (5 cols). The highlighted row steps down the list by itself. */
function MN03() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const [k, setK] = useAutoCycle(r, MENUS.length, 1600);
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="overflow-clip! py-[clamp(72px,9vw,140px)]">
      <style>{MN03_CSS}</style>
      <div className="grid grid-cols-1 gap-[clamp(40px,5vw,88px)] md:grid-cols-12">
        <div className="min-w-0 md:col-span-7">
          <H className="max-w-[13ch] text-[clamp(44px,5.2vw,88px)]">Five menus, one long table.</H>
          <P className="mt-5 max-w-[46ch]">Everything we cook and pour at Tamarind Row, kept as simple documents. Open one before you book.</P>
          <ul className="mt-[clamp(32px,4vw,56px)] border-t border-[var(--sx-line)]">
            {MENUS.map((m, j) => {
              const on = j === k;
              return (
                <li key={m.n} className="relative border-b border-[var(--sx-line)]" onMouseEnter={() => setK(j)}>
                  <span
                    aria-hidden
                    className="absolute inset-0 origin-left bg-[color-mix(in_srgb,var(--sx-accent)_9%,transparent)] transition-transform duration-700 ease-[cubic-bezier(.2,.8,.2,1)]"
                    style={{ transform: `scaleX(${on ? 1 : 0})` }}
                  />
                  <a href="#" onClick={(e) => e.preventDefault()} className="relative flex items-center justify-between gap-6 px-[clamp(8px,1.2vw,20px)] py-[clamp(18px,2.2vw,32px)]">
                    <div className="min-w-0">
                      <p data-m-text className={`sx-display text-[clamp(36px,4.2vw,68px)] leading-[1] tracking-[-0.02em] transition-colors duration-500 ${on ? "text-[var(--sx-accent)]" : ""}`}>{m.n}</p>
                      <p className="mt-2 text-[15px] text-[var(--sx-muted)]">
                        {m.d} <span className="ml-2 text-[13px] opacity-70">{m.m}</span>
                      </p>
                    </div>
                    <span className="flex shrink-0 items-center gap-3 text-[14px] font-[600]">
                      <span className="max-md:hidden">View menu</span>
                      <span
                        className={`grid h-12 w-12 place-items-center rounded-full border text-[18px] transition-all duration-500 ${on ? "translate-x-1.5 border-[var(--sx-accent)] bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "border-[var(--sx-line)]"}`}
                      >
                        →
                      </span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        <aside className="md:col-span-5">
          <div data-m-card className="relative overflow-hidden rounded-[var(--sx-radius,18px)] bg-[var(--sx-surface)] p-[clamp(24px,3vw,44px)] shadow-[0_40px_80px_-50px_rgba(28,24,19,.45)] md:sticky md:top-[clamp(24px,4vw,64px)]">
            <div className="mn03-glow pointer-events-none absolute -right-[20%] -top-[30%] aspect-square w-[80%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_20%,transparent),transparent)]" />
            <div className="relative">
              <p className="flex items-center gap-3 text-[14px] font-[600]">
                <span className="mn03-dot h-2.5 w-2.5 rounded-full bg-[var(--sx-accent)]" />
                Kitchen open tonight until 23:30
              </p>
              <p data-m-text className="sx-display mt-6 text-[clamp(30px,2.6vw,42px)] leading-[1.05]">Service hours</p>
              <div className="mt-5 divide-y divide-[var(--sx-line)] border-y border-[var(--sx-line)]">
                {HOURS.map(([a, b, c]) => (
                  <div key={a} className="grid grid-cols-[1.2fr_1fr_auto] items-baseline gap-3 py-3.5 text-[15px]">
                    <span className="font-[600]">{a}</span>
                    <span className="text-[var(--sx-muted)]">{b}</span>
                    <span className="tabular-nums">{c}</span>
                  </div>
                ))}
              </div>
              <p className="mt-7 text-[13px] font-[650] uppercase tracking-[0.14em] text-[var(--sx-muted)]">Booking</p>
              <ul className="mt-3 space-y-2.5 text-[15px] leading-relaxed">
                <li>Tables are held for 15 minutes past the booking time.</li>
                <li>Parties of seven or more take the feast menu, ₹3,800 a head.</li>
                <li>Bar seats are kept for walk-ins, every night.</li>
              </ul>
              <p className="mt-7 text-[13px] font-[650] uppercase tracking-[0.14em] text-[var(--sx-muted)]">Corkage</p>
              <p className="mt-3 text-[15px] leading-relaxed">₹1,500 a bottle, two bottles a table. Waived on Tuesdays.</p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Btn>Book a table</Btn>
                <Btn kind="link">Private dining →</Btn>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "MN03", name: "Menu index + sticky service card", motion: "M23", C: MN03 }];
