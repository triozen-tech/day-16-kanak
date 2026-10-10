"use client";

// LS · Listing layouts (docs/SECTION-MENU.md), batch 2. Each is a full designed section; motion via useSectionMotion.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Pic, Sec } from "./kit";
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

const RESIDENCES = [
  { n: "Casa Neem", s: "8 suites", l: "Assagao, North Goa", st: "Now open", i: 0 },
  { n: "The Teak House", s: "12 suites", l: "Coonoor, Nilgiris", st: "Opening 2027", i: 3 },
  { n: "Kora Hill", s: "6 villas", l: "Kodagu, Karnataka", st: "Now open", i: 1 },
  { n: "Salt Pan Court", s: "14 suites", l: "Little Rann, Gujarat", st: "Opening 2027", i: 2 },
  { n: "Monsoon Ridge", s: "9 suites", l: "Lonavala, Maharashtra", st: "Opening 2028", i: 3 },
  { n: "River Ninth", s: "5 villas", l: "Rishikesh, Uttarakhand", st: "Now open", i: 0 },
];
const STEPS = RESIDENCES.length - 2; // 2.5 visible: stop while the last card is still peeking

/** LS03 · Residence carousel with status chips: heading and prev / next arrows on one line; below, 2.5 tall cards
 *  (photo, name, suites + location, 'Opening 2027' chip) that step sideways by themselves. */
function LS03() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  const [k, setK] = useAutoCycle(r, STEPS, 2200);
  const go = (d: number) => setK((v) => (v + d + STEPS) % STEPS);
  return (
    <Sec innerRef={r} theme="ink" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <H className="max-w-[16ch] text-[clamp(44px,5.4vw,92px)]">Six houses, opening one by one.</H>
          <P className="mt-5 max-w-[48ch]">Small residences in places we would rather not leave. Three are open; three more arrive before the 2028 monsoon.</P>
        </div>
        <div className="flex items-center gap-5">
          <span className="text-[15px] tabular-nums text-[var(--sx-muted)]">
            {String(k + 1).padStart(2, "0")} — {String(RESIDENCES.length).padStart(2, "0")}
          </span>
          {[
            ["←", -1, "Previous"],
            ["→", 1, "Next"],
          ].map(([a, d, l]) => (
            <button
              key={l as string}
              onClick={() => go(d as number)}
              aria-label={l as string}
              className="grid h-14 w-14 place-items-center rounded-full border border-[var(--sx-line)] text-[20px] transition-colors hover:border-[var(--sx-accent)] hover:text-[var(--sx-accent)]"
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-[clamp(40px,5vw,72px)] overflow-hidden">
        <div
          className="flex gap-[24px] transition-transform duration-[1000ms] ease-[cubic-bezier(.65,0,.25,1)]"
          style={{ transform: `translateX(calc(${-k} * ((100% - 48px) / 2.5 + 24px)))` }}
        >
          {RESIDENCES.map((h) => (
            <article key={h.n} className="w-[calc((100%-48px)/2.5)] shrink-0 max-md:w-[78%]">
              <div data-m-card>
                <div className="relative overflow-hidden rounded-[var(--sx-radius,18px)]">
                  <div className="fx-drift">
                    <div className="fx-pan">
                      <Pic i={h.i} ratio="3/4" round={false} label={h.n.toUpperCase()} />
                    </div>
                  </div>
                  <span
                    className={`absolute left-4 top-4 rounded-full px-4 py-2 text-[13px] font-[650] backdrop-blur-md ${
                      h.st === "Now open" ? "bg-white/85 text-[#07090f]" : "bg-[var(--sx-accent)] text-[var(--sx-accent-text)]"
                    }`}
                  >
                    {h.st}
                  </span>
                </div>
                <div className="mt-5 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="sx-display text-[clamp(26px,2.4vw,38px)] leading-[1.05]">{h.n}</h3>
                    <p className="mt-2 text-[15px] text-[var(--sx-muted)]">
                      {h.s} · {h.l}
                    </p>
                  </div>
                  <span className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--sx-line)] text-[16px]">↗</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-[clamp(40px,5vw,64px)] flex flex-wrap items-center justify-between gap-6 border-t border-[var(--sx-line)] pt-8">
        <p className="text-[15px] text-[var(--sx-muted)]">Founding members get first nights at every opening, from ₹28,000 a night.</p>
        <Btn>Join the founding list</Btn>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "LS03", name: "Residence carousel with status chips", motion: "M34", C: LS03 }];
