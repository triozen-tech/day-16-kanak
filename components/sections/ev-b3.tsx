"use client";

// EV · Event / experience layouts (docs/SECTION-MENU.md), batch 3. Loops stop in ?static=1 and under reduced motion.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Hands-free cycling: steps an index every `ms` while the section is on screen (stops off screen and in ?static=1). */
function useAutoCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms = 1800) {
  const [i, setI] = useState(-1);
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

const EV_CSS = `.ev3-p img{scale:1.14;animation:ev3-pan var(--d,6s) ease-in-out infinite alternate}@keyframes ev3-pan{from{translate:-4% 2%}to{translate:4% -2%}}
.is-static .ev3-p img{animation:none}
html.is-static {.ev3-p img{animation:none}}`;

// ── EV04 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const PARTS = [
  { t: "Mornings", h: "6 – 11 am", d: "Pour-overs on the veranda, mist still on the tea rows.", i: 1, dur: "6.2s" },
  { t: "Afternoons", h: "12 – 5 pm", d: "A long thali lunch, then a hammock and a book.", i: 2, dur: "5.1s" },
  { t: "Evenings", h: "6 – 10 pm", d: "Bonfire, toddy-shop snacks and a slow walk back.", i: 3, dur: "7.3s" },
];

/** EV04 · Day-part triptych: three tall photo panels side by side (Mornings, Afternoons, Evenings), the time label
 *  at the top and a one-line activity at the bottom. The panels open with curtain wipes left to right; afterwards a
 *  soft "now" light walks across the three while each photo drifts at its own pace. */
function EV04() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M1");
  const [now] = useAutoCycle(r, PARTS.length, 1800);
  return (
    <Sec innerRef={r} theme="stone" font="serif" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#3d6b4f" }}>
      <style>{EV_CSS}</style>
      <div className="grid grid-cols-1 items-end gap-6 md:grid-cols-12">
        <H className="text-[clamp(44px,5.6vw,96px)] md:col-span-7">A day on the estate.</H>
        <div className="md:col-span-5 md:pb-2">
          <P className="max-w-[40ch]">Three nights at the bungalow, ₹18,400 for two with every meal. The day keeps its own slow rhythm.</P>
        </div>
      </div>
      <div className="mt-[clamp(36px,5vw,64px)] grid grid-cols-1 gap-[clamp(10px,1.2vw,18px)] md:grid-cols-3">
        {PARTS.map((p, k) => (
          <div key={p.t} className="relative h-[clamp(460px,62vh,640px)] overflow-hidden rounded-[var(--sx-radius,18px)]">
            <div className="ev3-p absolute inset-0" style={{ ["--d" as string]: p.dur }}>
              <Pic i={p.i} ratio="auto" round={false} className="absolute inset-0 h-full w-full" />
            </div>
            <div className={`absolute inset-0 bg-[linear-gradient(180deg,rgba(7,9,15,.55),rgba(7,9,15,.05)_35%,rgba(7,9,15,.1)_60%,rgba(7,9,15,.78))] transition-opacity duration-700`} />
            <div className={`absolute inset-0 bg-[#07090f] transition-opacity duration-700 ${now === -1 || now === k ? "opacity-0" : "opacity-35"}`} />
            <div className="relative flex h-full flex-col justify-between p-[clamp(20px,2.4vw,36px)] text-white">
              <div className="flex items-baseline justify-between gap-4">
                <p data-m-text className="sx-display text-[clamp(30px,2.8vw,46px)] leading-none">{p.t}</p>
                <p data-m-text className="text-[13px] font-[600] uppercase tracking-[0.14em] text-white/75">{p.h}</p>
              </div>
              <div>
                <span className={`mb-4 block h-[3px] rounded-full bg-white transition-all duration-700 ${now === k ? "w-16" : "w-6 opacity-50"}`} />
                <p data-m-text className="max-w-[28ch] text-[clamp(16px,1.25vw,19px)] leading-snug">{p.d}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-10 flex flex-wrap items-center justify-between gap-6 border-t border-[var(--sx-line)] pt-8">
        <p className="text-[15px] text-[var(--sx-muted)]">Check-in from 1 pm · guided plantation walk every morning at 7</p>
        <Btn>Book the three-night stay</Btn>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "EV04", name: "Day-part triptych", motion: "M1", C: EV04 }];
