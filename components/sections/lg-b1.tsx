"use client";

// LG · Logo / stockist layouts, batch 1 (docs/SECTION-MENU.md). Every wordmark is invented.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** An invented wordmark, styled by `v` so a row of them reads as different brands. */
function Mark({ name, v }: { name: string; v: number }) {
  const styles = [
    "font-[800] uppercase tracking-[0.2em] text-[clamp(14px,1.2vw,18px)]",
    "sx-display italic font-[500] text-[clamp(22px,2vw,30px)] tracking-[-0.01em]",
    "font-[700] text-[clamp(18px,1.6vw,24px)] tracking-[-0.03em] lowercase",
    "font-[600] uppercase tracking-[0.34em] text-[clamp(12px,1vw,15px)]",
    "sx-display font-[800] text-[clamp(16px,1.3vw,21px)] tracking-[0.01em]",
  ];
  const shape = v % 3;
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      {v % 2 === 0 && (
        <svg viewBox="0 0 20 20" className="h-[1.1em] w-[1.1em] shrink-0" fill="currentColor" aria-hidden>
          {shape === 0 ? <circle cx="10" cy="10" r="8" /> : shape === 1 ? <path d="M10 1 19 18H1z" /> : <rect x="2" y="2" width="16" height="16" rx="4" />}
        </svg>
      )}
      <span className={styles[v % styles.length]}>{name}</span>
    </span>
  );
}

/** LG01 · Flip rolodex slots: heading above five hairline slots; each slot flips (rolodex) to another stockist at a
 *  staggered beat, so one slot is always turning. */
function LG01() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M6");
  const slots = [
    ["Larder & Lane", "Saltbox", "Ochre Foods"],
    ["Hearth Market", "Bay Provisions", "Kilnhouse"],
    ["The Pantry Co.", "Ferro Deli", "Tamarind Store"],
    ["Greenleaf Grocer", "Corner Cellar", "Northfold"],
    ["Maison Cacao", "Arcwell", "Fennick & Sons"],
  ];
  const [idx, setIdx] = useState<number[]>(() => slots.map(() => 0));
  const [flipped, setFlipped] = useState(-1);
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    let t: ReturnType<typeof setInterval> | undefined;
    let beat = 0;
    const order = [0, 3, 1, 4, 2];
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (!e.isIntersecting) return;
      t = setInterval(() => {
        const s = order[beat++ % order.length];
        setIdx((v) => v.map((x, k) => (k === s ? (x + 1) % 3 : x)));
        setFlipped(s);
      }, 520);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, []);
  return (
    <Sec innerRef={r} theme="stone" font="wide" className="py-[clamp(72px,9vw,140px)]">
      <style>{`
        .lg01-slot { perspective: 700px; }
        .lg01-in { animation: lg01-in .62s cubic-bezier(.2,.8,.2,1) both; transform-origin: 50% 50% -30px; backface-visibility: hidden; }
        .lg01-out { animation: lg01-out .42s cubic-bezier(.6,0,.8,.4) both; transform-origin: 50% 50% -30px; backface-visibility: hidden; }
        @keyframes lg01-in { from { transform: rotateX(-90deg); opacity: 0; } to { transform: rotateX(0); opacity: 1; } }
        @keyframes lg01-out { from { transform: rotateX(0); opacity: 1; } to { transform: rotateX(90deg); opacity: 0; } }
        html.is-static .lg01-in, html.is-static .lg01-out { animation: none; }
        html.is-static .lg01-out { display: none; }
        html.is-static { .lg01-in, .lg01-out { animation: none; } .lg01-out { display: none; } }
      `}</style>
      <div className="mx-auto max-w-[980px] text-center">
        <H className="text-[clamp(44px,5.6vw,96px)]">Found on the best shelves.</H>
        <P className="mx-auto mt-6 max-w-[46ch]">Our bean-to-bar chocolate is stocked by 340 independent grocers, delis and cafés across eleven cities.</P>
      </div>
      <div className="mt-[clamp(48px,6vw,88px)] grid grid-cols-2 border-l border-t border-[var(--sx-line)] md:grid-cols-5">
        {slots.map((names, k) => {
          const cur = idx[k];
          const prev = (cur + 2) % 3;
          return (
            <div key={k} data-m-card className="lg01-slot relative grid h-[clamp(120px,11vw,170px)] place-items-center overflow-hidden border-b border-r border-[var(--sx-line)] px-4">
              {flipped === k && (
                <span key={`o${cur}`} className="lg01-out absolute inset-0 grid place-items-center text-[var(--sx-muted)]">
                  <Mark name={names[prev]} v={k + prev} />
                </span>
              )}
              <span key={`i${cur}`} className={`${flipped === k ? "lg01-in" : ""} absolute inset-0 grid place-items-center text-[var(--sx-text)]`}>
                <Mark name={names[cur]} v={k + cur} />
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-[15px] text-[var(--sx-muted)]">
        <span>Bars from ₹240 · wholesale cases of 24</span>
        <Btn kind="link">Become a stockist →</Btn>
      </div>
    </Sec>
  );
}

/** LG02 · Split headline + vertical ticker: copy on the left half; on the right a narrow column of café wordmarks
 *  scrolls upward forever, fading out at top and bottom. */
function LG02() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const cafes = [
    ["Third Wave Room", "Bengaluru"],
    ["Brewhouse 41", "Pune"],
    ["Little Kettle", "Shillong"],
    ["Copper & Crema", "Mumbai"],
    ["The Slow Pour", "Kochi"],
    ["Ridge Street Café", "Mussoorie"],
    ["Blue Tram", "Kolkata"],
    ["Roastline", "Hyderabad"],
    ["Copper Bar", "Goa"],
    ["Paper Boat Café", "Chennai"],
  ];
  const list = [...cafes, ...cafes];
  return (
    <Sec innerRef={r} theme="paper" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <style>{`
        .lg02-track { animation: lg02-up 26s linear infinite; }
        @keyframes lg02-up { from { transform: translateY(0); } to { transform: translateY(-50%); } }
        .lg02-col:hover .lg02-track { animation-play-state: paused; }
        html.is-static .lg02-track { animation: none; }
        html.is-static { .lg02-track { animation: none; } }
      `}</style>
      <div className="grid grid-cols-1 items-center gap-[clamp(40px,5vw,96px)] md:grid-cols-12">
        <div className="md:col-span-6">
          <H className="max-w-[11ch] text-[clamp(52px,6.6vw,116px)]">Poured in four hundred cafés.</H>
          <P className="mt-7 max-w-[40ch]">From hill-station bakeries to airport counters, baristas pull our Monsoon Malabar as their house espresso. Wholesale from 5 kg, roasted to order.</P>
          <div className="mt-10 flex flex-wrap items-center gap-5">
            <Btn>Wholesale enquiries</Btn>
            <span className="text-[15px] text-[var(--sx-muted)]">5 kg from ₹6,800</span>
          </div>
        </div>
        <div className="flex justify-center md:col-span-6">
          <div
            className="lg02-col relative h-[clamp(440px,48vw,640px)] w-[min(100%,340px)] overflow-hidden border-x border-[var(--sx-line)]"
            style={{ maskImage: "linear-gradient(180deg, transparent, #000 18%, #000 82%, transparent)", WebkitMaskImage: "linear-gradient(180deg, transparent, #000 18%, #000 82%, transparent)" }}
          >
            <div className="lg02-track">
              {list.map(([n, c], k) => (
                <div key={k} className="flex flex-col items-center justify-center border-b border-[var(--sx-line)] py-[clamp(22px,2.4vw,34px)] text-center">
                  <span className={k % 3 === 0 ? "sx-display text-[clamp(26px,2.2vw,34px)] italic leading-none" : k % 3 === 1 ? "text-[clamp(15px,1.2vw,18px)] font-[800] uppercase tracking-[0.22em]" : "text-[clamp(20px,1.7vw,26px)] font-[650] tracking-[-0.02em]"}>{n}</span>
                  <span className="mt-2 text-[12px] uppercase tracking-[0.18em] text-[var(--sx-muted)]">{c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "LG01", name: "Flip rolodex logo slots", motion: "M6", C: LG01 },
  { code: "LG02", name: "Split headline + vertical logo ticker", motion: "M23", C: LG02 },
];
