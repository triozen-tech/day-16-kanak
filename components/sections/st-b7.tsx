"use client";

// ST · Story / ingredient layouts, batch 7 (docs/SECTION-MENU.md): ST16 a small left-aligned title, then a wrapping
// flow of rounded pills (tiny icon + word) that fills three to four lines: the notes of one perfume. Pills snap in;
// afterwards a light wave walks through them. ?static=1 shows the plain cloud.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, P, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const CSS = `.st7glow{animation:st7gx 6s linear infinite alternate,st7gs 3.6s ease-in-out infinite alternate}
@keyframes st7gx{from{translate:-26% -10%}to{translate:26% 14%}}@keyframes st7gs{from{scale:.82}to{scale:1.2}}
html.is-static .st7glow{animation:none}
html.is-static {.st7glow{animation:none}}`;

type Icon = "leaf" | "drop" | "flower" | "flame" | "wood" | "citrus" | "spark" | "cloud" | "grain";
const PATHS: Record<Icon, React.ReactNode> = {
  leaf: <path d="M4 16C4 8 9 4 16 4c0 7-4 12-12 12Zm0 0 7-7" />,
  drop: <path d="M10 3s5 6 5 9.5A5 5 0 0 1 5 12.5C5 9 10 3 10 3Z" />,
  flower: (
    <>
      <circle cx="10" cy="10" r="1.6" />
      <circle cx="10" cy="5" r="3" />
      <circle cx="15" cy="10" r="3" />
      <circle cx="10" cy="15" r="3" />
      <circle cx="5" cy="10" r="3" />
    </>
  ),
  flame: <path d="M10 18a5 5 0 0 0 5-5c0-4-5-6-4-11-3 2-6 6-6 11a5 5 0 0 0 5 5Zm0 0a2 2 0 0 1-2-2c0-2 2-3 2-5 1 2 2 3 2 5a2 2 0 0 1-2 2Z" />,
  wood: (
    <>
      <circle cx="10" cy="10" r="7" />
      <circle cx="10" cy="10" r="4" />
      <circle cx="10" cy="10" r="1" />
    </>
  ),
  citrus: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 3v14M3 10h14M5 5l10 10M15 5 5 15" />
    </>
  ),
  spark: <path d="M10 2v5M10 13v5M2 10h5M13 10h5M4.5 4.5l3 3M12.5 12.5l3 3M15.5 4.5l-3 3M7.5 12.5l-3 3" />,
  cloud: <path d="M6 15h8a3.5 3.5 0 0 0 0-7 5 5 0 0 0-9.5 1.5A3 3 0 0 0 6 15Z" />,
  grain: <path d="M10 18V6m0 0c-2 0-3-2-3-4 2 0 3 2 3 4Zm0 0c2 0 3-2 3-4-2 0-3 2-3 4Zm0 5c-2 0-3-2-3-4 2 0 3 2 3 4Zm0 0c2 0 3-2 3-4-2 0-3 2-3 4Z" />,
};

// tier: 0 top, 1 heart, 2 base
const NOTES: { w: string; ic: Icon; tier: 0 | 1 | 2 }[] = [
  { w: "Bergamot", ic: "citrus", tier: 0 },
  { w: "Pink pepper", ic: "spark", tier: 0 },
  { w: "Green mango", ic: "leaf", tier: 0 },
  { w: "Rain on clay", ic: "drop", tier: 0 },
  { w: "Cardamom", ic: "grain", tier: 0 },
  { w: "Neroli", ic: "flower", tier: 0 },
  { w: "Wet jasmine", ic: "flower", tier: 1 },
  { w: "Tuberose", ic: "flower", tier: 1 },
  { w: "Black tea", ic: "leaf", tier: 1 },
  { w: "Fig leaf", ic: "leaf", tier: 1 },
  { w: "Sea salt", ic: "cloud", tier: 1 },
  { w: "Orris", ic: "flower", tier: 1 },
  { w: "Saffron", ic: "spark", tier: 1 },
  { w: "Vetiver", ic: "grain", tier: 2 },
  { w: "Sandalwood", ic: "wood", tier: 2 },
  { w: "Oud smoke", ic: "flame", tier: 2 },
  { w: "Ambrette", ic: "grain", tier: 2 },
  { w: "Cedar", ic: "wood", tier: 2 },
  { w: "Benzoin", ic: "drop", tier: 2 },
  { w: "Musk", ic: "cloud", tier: 2 },
];
const TIERS = ["Top", "Heart", "Base"];

/** ST16 · Small left-aligned title, then a wrapping flow of icon + word pills (perfume notes) filling three to four lines. */
function ST16() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  const [w, setW] = useState(-1);
  // a light wave walks through the pills while on screen
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    let t: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (e.isIntersecting) t = setInterval(() => setW((v) => (v + 1) % (NOTES.length + 4)), 260);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, []);
  return (
    <Sec innerRef={r} theme="ink" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <style>{CSS}</style>
      <span aria-hidden className="st7glow pointer-events-none absolute left-[22%] top-[22%] h-[64%] w-[56%] rounded-full blur-[90px]" style={{ background: "radial-gradient(closest-side, color-mix(in srgb, var(--sx-accent) 45%, transparent), transparent)" }} />
      <div className="relative z-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 data-m-head className="sx-display text-[clamp(32px,3.2vw,52px)] leading-[1.05]">What&apos;s inside Monsoon No. 3</h2>
            <P className="mt-3 max-w-[52ch]">Twenty notes, from the first spray to the last trace on a scarf the next morning.</P>
          </div>
          <div className="flex items-center gap-5 pb-1 text-[13px] uppercase tracking-[0.14em] text-[var(--sx-muted)]">
            {TIERS.map((t, k) => (
              <span key={t} className="flex items-center gap-2">
                <span className="h-[9px] w-[9px] rounded-full bg-[var(--sx-accent)]" style={{ opacity: 1 - k * 0.32 }} />
                {t}
              </span>
            ))}
          </div>
        </div>

        <ul className="mt-[clamp(36px,4.5vw,64px)] flex flex-wrap gap-[clamp(10px,1vw,16px)]">
          {NOTES.map((n, k) => {
            const lit = w >= 0 && (k === w || k === w - 1);
            return (
              <li
                key={n.w}
                data-m-card
                className={`flex items-center gap-3 rounded-full border py-[clamp(8px,0.8vw,12px)] pl-[clamp(8px,0.8vw,12px)] pr-[clamp(18px,1.6vw,26px)] transition-[background-color,border-color,color] duration-300 ${lit ? "border-[var(--sx-accent)] bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "border-[var(--sx-line)] bg-[color-mix(in_srgb,var(--sx-surface)_80%,transparent)]"}`}
              >
                <span
                  className={`grid h-[clamp(32px,2.6vw,40px)] w-[clamp(32px,2.6vw,40px)] shrink-0 place-items-center rounded-full transition-colors duration-300 ${lit ? "bg-[rgba(0,0,0,.18)]" : "bg-[color-mix(in_srgb,var(--sx-accent)_22%,transparent)] text-[var(--sx-accent)]"}`}
                  style={{ opacity: lit ? 1 : 1 - n.tier * 0.22 }}
                >
                  <svg viewBox="0 0 20 20" className="h-[55%] w-[55%]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    {PATHS[n.ic]}
                  </svg>
                </span>
                <span className="sx-display text-[clamp(19px,1.7vw,27px)] leading-none">{n.w}</span>
              </li>
            );
          })}
        </ul>

        <div className="mt-[clamp(36px,4.5vw,64px)] flex flex-wrap items-center justify-between gap-6 border-t border-[var(--sx-line)] pt-8">
          <p className="text-[15px] text-[var(--sx-muted)]">
            Eau de parfum · 50 ml · <b className="text-[18px] font-[650] text-[var(--sx-text)]">₹4,200</b>
          </p>
          <div className="flex flex-wrap gap-4">
            <Btn>Add to bag</Btn>
            <Btn kind="ghost">Order a 2 ml sample · ₹350</Btn>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "ST16", name: "Wrapped icon-pill cloud", motion: "M34", C: ST16 }];
