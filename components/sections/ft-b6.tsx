"use client";

// FT · Feature layouts, batch 6 (FT24–FT26). Icon-led feature sections; icons are simple inline SVGs drawn here.
// The active item cycles by itself while on screen; CSS loops stop under ?static=1.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Steps an index every `ms` while the section is on screen (stops off screen and in ?static=1 / reduced motion). */
function useAutoCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms = 1800) {
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
  return i;
}

const FT6_CSS = `
.ft6-glow{animation:ft6-glow 4.4s linear infinite alternate}
@keyframes ft6-glow{from{translate:-16% -10%}to{translate:18% 12%}}
.ft6-kb{animation:ft6-kb 5s linear infinite alternate}
@keyframes ft6-kb{from{scale:1}to{scale:1.12}}
html.is-static .ft6-glow,html.is-static .ft6-kb{animation:none}
html.is-static {.ft6-glow,.ft6-kb{animation:none}}
`;
const glow = (pct = 40) => `radial-gradient(closest-side, color-mix(in srgb, var(--sx-accent) ${pct}%, transparent), transparent)`;

/** Small line icons (24×24, stroke = currentColor). */
const ICONS: Record<string, React.ReactNode> = {
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  bean: (
    <>
      <ellipse cx="12" cy="12" rx="6.5" ry="9" transform="rotate(30 12 12)" />
      <path d="M8.5 6.5c3 3 4 7 7 11" />
    </>
  ),
  truck: (
    <>
      <path d="M2 6h12v10H2zM14 10h4l3 3v3h-7" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </>
  ),
  pause: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 9v6M14 9v6" />
    </>
  ),
  grind: (
    <>
      <path d="M6 4h12l-2 6H8z" />
      <path d="M8 10v8a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-8M12 13v3" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15z" />
      <path d="M5 19l8-8" />
    </>
  ),
  wheat: (
    <>
      <path d="M12 21V8" />
      <path d="M12 8c-3-1-4-3-4-5 3 0 4 2 4 5zM12 8c3-1 4-3 4-5-3 0-4 2-4 5zM12 13c-3-1-4-3-4-5 3 0 4 2 4 5zM12 13c3-1 4-3 4-5-3 0-4 2-4 5z" />
    </>
  ),
  cup: (
    <>
      <path d="M4 9h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6z" />
      <path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17M8 3c0 2 2 2 2 4M12 3c0 2 2 2 2 4" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
    </>
  ),
  drop: <path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z" />,
  shield: (
    <>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
      <path d="M8.5 12l2.5 2.5 4.5-5" />
    </>
  ),
  flask: (
    <>
      <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3" />
      <path d="M7.5 15h9" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
};
const Icon = ({ k, className = "" }: { k: string; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    {ICONS[k]}
  </svg>
);

/* ───────────────────────── FT24 · Intro column + icon grid ───────────────────────── */

const SUB = [
  { k: "calendar", t: "Your rhythm", d: "Every one, two or four weeks. Change it the night before." },
  { k: "bean", t: "Roasted to order", d: "Beans leave the drum less than 72 hours before they ship." },
  { k: "grind", t: "Ground for you", d: "Pick your brewer once; we set the grind to match." },
  { k: "truck", t: "Free delivery", d: "Tracked, plastic-free, and through the letterbox." },
  { k: "pause", t: "Pause, skip, stop", d: "Two taps, no calls, no forms, no questions asked." },
  { k: "leaf", t: "Farm-direct", d: "We pay growers 40% over the fair-trade floor." },
];

/** FT24 · Two columns: a tall intro (~5/12) with a large heading, paragraph and link; beside it (~7/12) a 2×3 grid of
 *  icon + title + line items. Lines slide up out of their masks (M23); the highlighted item cycles by itself. */
function FT24() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const a = useAutoCycle(r, SUB.length, 1700);
  return (
    <Sec innerRef={r} theme="ink" font="wide" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#e39b4f", ["--sx-accent-text" as string]: "#1a0f05" }}>
      <style>{FT6_CSS}</style>
      <div className="ft6-glow pointer-events-none absolute -left-[12%] top-[10%] aspect-square w-[min(60vw,780px)] rounded-full" style={{ background: glow(38) }} />
      <div className="relative z-10 grid grid-cols-1 gap-[clamp(40px,5vw,96px)] md:grid-cols-12">
        <div className="md:col-span-5">
          <H className="text-[clamp(38px,3.8vw,62px)] leading-[1]">Coffee on your schedule, not ours.</H>
          <P className="mt-6 max-w-[38ch]">The Daybreak subscription sends fresh single-origin beans from ₹690 a bag, roasted in Coorg and shaped around how you actually drink coffee.</P>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <Btn>Start for ₹690</Btn>
            <Btn kind="link">How it works →</Btn>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-[clamp(10px,1vw,16px)] md:col-span-7 md:grid-cols-2">
          {SUB.map((s, k) => {
            const on = k === a;
            return (
              <div
                key={s.t}
                data-m-card
                className={`flex gap-4 rounded-[18px] border p-[clamp(18px,1.8vw,28px)] transition-colors duration-500 ${on ? "border-[color-mix(in_srgb,var(--sx-accent)_60%,transparent)] bg-[color-mix(in_srgb,var(--sx-accent)_14%,var(--sx-surface))]" : "border-[var(--sx-line)] bg-[var(--sx-surface)]"}`}
              >
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-[12px] transition-colors duration-500 ${on ? "bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "bg-[color-mix(in_srgb,var(--sx-text)_8%,transparent)] text-[var(--sx-accent)]"}`}>
                  <Icon k={s.k} className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <p className="text-[17px] font-[650]">{s.t}</p>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--sx-muted)]">{s.d}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── FT25 · Icon trio over a photo strip ───────────────────────── */

const TRIO = [
  { k: "wheat", t: "Stone-milled flour" },
  { k: "sun", t: "Baked before sunrise" },
  { k: "cup", t: "Coffee from the hills" },
];
const STRIP = [
  { i: 0, l: "Sourdough" },
  { i: 2, l: "Counter" },
  { i: 3, l: "Ovens" },
  { i: 1, l: "Terrace" },
];

/** FT25 · Centred heading + paragraph; under it a narrow row of three centred icon blocks (icon over a short title);
 *  below, a full-width row of four equal photos that curtain-open in sequence (M1). */
function FT25() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M1");
  const a = useAutoCycle(r, TRIO.length, 1600);
  return (
    <Sec innerRef={r} theme="paper" font="editorial" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#b5502a" }}>
      <style>{FT6_CSS}</style>
      <div className="pointer-events-none absolute inset-x-0 top-[-14%] flex justify-center">
        <div className="ft6-glow aspect-square w-[min(80vw,980px)] shrink-0 rounded-full" style={{ background: glow(36) }} />
      </div>
      <div className="relative z-10 mx-auto max-w-[820px] text-center">
        <H className="mx-auto max-w-[16ch] text-[clamp(44px,5.2vw,88px)] font-[500]">A bakery that wakes at four.</H>
        <P className="mx-auto mt-6 max-w-[48ch]">Crust &amp; Rye bakes forty loaves a morning in a wood-fired oven on Lavelle Road. When they&apos;re gone, we close the hatch.</P>
      </div>
      <div className="relative z-10 mx-auto mt-[clamp(36px,4vw,60px)] grid max-w-[640px] grid-cols-3 gap-4">
        {TRIO.map((x, k) => (
          <div key={x.t} className="flex flex-col items-center text-center">
            <span className={`grid h-14 w-14 place-items-center rounded-full border transition-all duration-500 ${k === a ? "scale-110 border-[var(--sx-accent)] bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "border-[var(--sx-line)] text-[var(--sx-accent)]"}`}>
              <Icon k={x.k} className="h-6 w-6" />
            </span>
            <p className="mt-3 text-[15px] font-[600] leading-snug">{x.t}</p>
          </div>
        ))}
      </div>
      <div className="relative z-10 mt-[clamp(44px,5vw,80px)] grid grid-cols-2 gap-[clamp(10px,1.2vw,18px)] md:grid-cols-4">
        {STRIP.map((p, k) => (
          <div key={p.l} className="overflow-hidden rounded-[var(--sx-radius,18px)]">
            <div className="ft6-kb origin-[12%_92%]" style={{ animationDelay: `${-k * 1.25}s` }}>
              <Pic i={p.i} ratio="3/4" label={p.l.toUpperCase()} />
            </div>
          </div>
        ))}
      </div>
      <div className="relative z-10 mt-10 flex flex-wrap items-center justify-center gap-6">
        <Btn>Pre-order tomorrow&apos;s bake</Btn>
        <span className="text-[15px] text-[var(--sx-muted)]">Country loaf ₹260 · Croissant ₹140</span>
      </div>
    </Sec>
  );
}

/* ───────────────────────── FT26 · Portrait image + stacked icon rows ───────────────────────── */

const ROWS = [
  { k: "drop", t: "Barrier-first hydration", d: "Ceramides and squalane hold water in for 48 hours." },
  { k: "shield", t: "Fragrance free, always", d: "Dermatologist-tested on sensitive and acne-prone skin." },
  { k: "flask", t: "4% niacinamide", d: "Evens tone and calms redness without the sting." },
  { k: "moon", t: "Works overnight", d: "A sleeping layer that wakes you with softer skin." },
];

/** FT26 · Two columns: one large portrait image fills the left (it scales down into its frame, M13); the right column
 *  is a vertical stack of four icon rows (icon square left, title + line right); the active row cycles by itself. */
function FT26() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M13");
  const a = useAutoCycle(r, ROWS.length, 1800);
  return (
    <Sec innerRef={r} theme="stone" font="serif" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#7d5ba6", ["--sx-accent-text" as string]: "#faf7ff" }}>
      <style>{FT6_CSS}</style>
      <div className="ft6-glow pointer-events-none absolute -right-[14%] bottom-[-10%] aspect-square w-[min(64vw,860px)] rounded-full" style={{ background: glow(36) }} />
      <div className="relative z-10 grid grid-cols-1 items-center gap-[clamp(40px,6vw,110px)] md:grid-cols-2">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[22px]">
          <div className="fx-pan absolute -inset-[4%]">
            <Pic i={1} ratio="auto" round={false} label="" className="absolute inset-0 h-full w-full" />
          </div>
          <div className="absolute bottom-5 left-5 rounded-full bg-white/85 px-4 py-2 text-[14px] font-[600] text-[#111418] backdrop-blur">Night Barrier Cream · ₹1,290</div>
        </div>
        <div>
          <H className="max-w-[14ch] text-[clamp(40px,4.4vw,74px)] font-[500]">Calm skin by morning.</H>
          <P className="mt-5 max-w-[42ch]">Four things the Night Barrier Cream does while you sleep, from a 50 ml jar that lasts about ten weeks.</P>
          <div className="mt-[clamp(28px,3vw,44px)] border-t border-[var(--sx-line)]">
            {ROWS.map((x, k) => {
              const on = k === a;
              return (
                <div key={x.t} className="flex items-start gap-5 border-b border-[var(--sx-line)] py-[clamp(16px,1.6vw,24px)]">
                  <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-[12px] transition-colors duration-500 ${on ? "bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "bg-[var(--sx-surface)] text-[var(--sx-accent)]"}`}>
                    <Icon k={x.k} className="h-6 w-6" />
                  </span>
                  <div className={`min-w-0 transition-transform duration-500 ${on ? "translate-x-2" : ""}`}>
                    <p data-m-text className="text-[18px] font-[650] text-[var(--sx-text)]">{x.t}</p>
                    <p className="mt-1 text-[15px] leading-relaxed text-[var(--sx-muted)]">{x.d}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-8">
            <Btn>Add to bag · ₹1,290</Btn>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "FT24", name: "Intro column + icon grid", motion: "M23", C: FT24 },
  { code: "FT25", name: "Icon trio over a photo strip", motion: "M1", C: FT25 },
  { code: "FT26", name: "Portrait image + stacked icon rows", motion: "M13", C: FT26 },
];
