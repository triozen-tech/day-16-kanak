"use client";

// LS · Listing & rates layouts (docs/SECTION-MENU.md), batch 6. Rates count up on entry, then the table spotlights one
// row after another by itself while on screen (a hover takes over); loops stop in ?static=1.
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

const LS_CSS = `.ls6-glow{background:radial-gradient(closest-side,color-mix(in srgb,var(--sx-accent) 40%,transparent),transparent);animation:ls6-glow 5.5s linear infinite alternate}@keyframes ls6-glow{from{translate:-30% -12%}to{translate:24% 16%}}
.ls6-sheen{background:linear-gradient(100deg,transparent 25%,color-mix(in srgb,var(--sx-accent) 30%,transparent) 50%,transparent 75%) 0 0/250% 100%;animation:ls6-sheen 2.4s linear infinite}@keyframes ls6-sheen{from{background-position:130% 0}to{background-position:-30% 0}}
.is-static .ls6-glow,.is-static .ls6-sheen{animation:none}.is-static .ls6-sheen{opacity:0}
html.is-static {.ls6-glow,.ls6-sheen{animation:none}.ls6-sheen{opacity:0}}`;

const RATES = [
  { k: "High season", d: "1 Jul – 31 Oct", sub: "Migration river crossings", rate: "₹68,500" },
  { k: "Peak season", d: "20 Dec – 5 Jan", sub: "Minimum stay of four nights", rate: "₹84,000" },
  { k: "Green season", d: "1 Nov – 19 Dec · 6 Jan – 30 Jun", sub: "Calving, birding, fewer vehicles", rate: "₹46,200" },
  { k: "Family suite", d: "All year · sleeps four", sub: "Two tents joined by a shaded deck", rate: "₹1,52,000" },
  { k: "Private vehicle", d: "All year · per vehicle, per day", sub: "Your own guide and tracker", rate: "₹38,000" },
];

/** LS05 · Seasonal rate table: heading left; on the right a ruled table of seasons and room types, each with its dates
 *  in small text and the rate per person sharing aligned right; the children's policy as a footnote. */
function LS05() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M3");
  const [on, setOn] = useAutoCycle(r, RATES.length, 1500);
  return (
    <Sec innerRef={r} theme="ink" font="editorial" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#d39a4a", ["--sx-accent-text" as string]: "#1a1206" }}>
      <style>{LS_CSS}</style>
      <div className="ls6-glow pointer-events-none absolute -left-[10%] top-[10%] aspect-square w-[60%] rounded-full" />
      <div className="relative grid grid-cols-1 gap-[clamp(40px,6vw,110px)] md:grid-cols-12">
        <div className="md:col-span-5">
          <H className="max-w-[11ch] text-[clamp(48px,5.6vw,96px)]">Rates for every season</H>
          <P className="mt-7 max-w-[36ch]">Full board at the river lodge: three meals, house wines, two game drives a day and park fees for the length of your stay.</P>
          <div className="mt-9 flex flex-wrap items-center gap-5">
            <Btn>Check availability</Btn>
            <Btn kind="link">Download the rate card</Btn>
          </div>
        </div>

        <div className="min-w-0 md:col-span-7">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] border-b border-[var(--sx-text)] pb-3 text-[12px] font-[650] uppercase tracking-[0.14em] text-[var(--sx-muted)]">
            <span>Season or room</span>
            <span className="text-right">Per person sharing, a night</span>
          </div>
          {RATES.map((x, k) => (
            <div
              key={x.k}
              data-m-card
              onMouseEnter={() => setOn(k)}
              className={`relative grid grid-cols-[minmax(0,1fr)_auto] items-end gap-6 overflow-hidden border-b border-[var(--sx-line)] px-3 py-[clamp(18px,2vw,28px)] transition-colors duration-500 ${k === on ? "bg-[color-mix(in_srgb,var(--sx-accent)_14%,transparent)]" : ""}`}
            >
              {k === on && <span className="ls6-sheen pointer-events-none absolute inset-0" />}
              <span className={`absolute inset-y-0 left-0 w-[3px] bg-[var(--sx-accent)] transition-transform duration-500 ${k === on ? "scale-y-100" : "scale-y-0"}`} />
              <div className="relative min-w-0">
                <p className="sx-display text-[clamp(24px,2.3vw,36px)] leading-none">{x.k}</p>
                <p className="mt-2.5 text-[13px] tracking-[0.02em] text-[var(--sx-muted)]">
                  {x.d} <span className="mx-1.5 opacity-50">·</span> {x.sub}
                </p>
              </div>
              <p data-m-num className={`relative sx-display text-right text-[clamp(28px,2.8vw,44px)] leading-none tabular-nums transition-colors duration-500 ${k === on ? "text-[var(--sx-accent)]" : ""}`}>
                {x.rate}
              </p>
            </div>
          ))}
          <p className="mt-6 max-w-[62ch] text-[13px] leading-relaxed text-[var(--sx-muted)]">
            Children under six stay free in their parents&apos; tent; ages six to twelve pay half the adult rate. Game drives are open to guests aged eight and over, with private family drives on request.
          </p>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "LS05", name: "Seasonal rate table", motion: "M3", C: LS05 }];
