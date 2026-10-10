"use client";

// PD · Process / how-it-works layouts, batch 2 (docs/SECTION-MENU.md).
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Pic, Price, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** PD03 · Auto-advancing steps: four step rows on the left, each with a progress bar that fills over ~4.5 s before the
 *  next step takes over; the picture on the right swaps per step. Click a step to jump; plays by itself on screen. */
function PD03() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M6");
  const steps = [
    { t: "Pick your roast", d: "Light, medium or dark, whole bean or ground for your brewer. Change it any month.", i: 0, c: "Three roasts · six grinds" },
    { t: "We roast on Tuesday", d: "Small drums in Chikmagalur, never more than 40 kg at a time, packed the same evening.", i: 3, c: "Roasted to order" },
    { t: "At your door Thursday", d: "Nitrogen-flushed bags with a one-way valve, in a box that fits through the letterbox.", i: 1, c: "Free delivery, every city" },
    { t: "Brew, rate, repeat", d: "Tell us what you loved in the app and next month's bag is tuned to your taste.", i: 2, c: "Pause or skip anytime" },
  ];
  const [a, setA] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    const io = new IntersectionObserver(([e]) => setRunning(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Sec innerRef={r} theme="paper" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <style>{`
        .pd03-fill { animation: pd03-fill 4.5s linear both; }
        @keyframes pd03-fill { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        .pd03-pic { animation: pd03-pic 5s ease-in-out infinite alternate; }
        @keyframes pd03-pic { from { transform: scale(1.04) translate(-1.5%, 1%); } to { transform: scale(1.14) translate(1.5%, -1.5%); } }
        .pd03-chip { animation: pd03-chip 2.6s ease-in-out infinite alternate; }
        @keyframes pd03-chip { from { translate: 0 -5px; } to { translate: 0 5px; } }
        html.is-static .pd03-fill, html.is-static .pd03-pic, html.is-static .pd03-chip { animation: none; }
        html.is-static { .pd03-fill, .pd03-pic, .pd03-chip { animation: none; } }
      `}</style>
      <div className="grid grid-cols-1 items-end gap-6 md:grid-cols-12">
        <H className="text-[clamp(48px,6vw,104px)] md:col-span-7">Fresh coffee, on a loop.</H>
        <P className="max-w-[38ch] pb-2 md:col-span-5">A subscription that roasts to order and lands two days later. Here is the whole month, start to cup.</P>
      </div>
      <div className="mt-[clamp(40px,6vw,88px)] grid grid-cols-1 items-stretch gap-[clamp(28px,4vw,72px)] md:grid-cols-12">
        <ol className="md:col-span-5">
          {steps.map((s, k) => {
            const on = k === a;
            return (
              <li key={s.t} className="border-t border-[var(--sx-line)] last:border-b">
                <button type="button" onClick={() => setA(k)} className="block w-full py-[clamp(18px,2vw,28px)] text-left">
                  <span className={`sx-display block text-[clamp(26px,2.4vw,38px)] font-[600] leading-[1.05] tracking-[-0.02em] transition-colors duration-500 ${on ? "text-[var(--sx-text)]" : "text-[var(--sx-muted)]"}`}>{s.t}</span>
                  <span className={`grid transition-[grid-template-rows,opacity] duration-500 ${on ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <span className="overflow-hidden">
                      <span className="block max-w-[40ch] pt-3 text-[16px] leading-relaxed text-[var(--sx-muted)]">{s.d}</span>
                    </span>
                  </span>
                  <span className="mt-4 block h-[3px] overflow-hidden rounded-full bg-[var(--sx-line)]">
                    {on && (
                      <span
                        key={a}
                        className="pd03-fill block h-full origin-left rounded-full bg-[var(--sx-accent)]"
                        style={{ animationPlayState: running ? "running" : "paused" }}
                        onAnimationEnd={() => setA((v) => (v + 1) % steps.length)}
                      />
                    )}
                  </span>
                </button>
              </li>
            );
          })}
          <li className="flex flex-wrap items-center gap-5 pt-8">
            <Btn>Start a subscription</Btn>
            <span className="text-[15px] text-[var(--sx-muted)]">
              <Price now="₹780" className="text-[var(--sx-text)]" /> a month · 250 g
            </span>
          </li>
        </ol>
        <div className="relative min-h-[420px] overflow-hidden rounded-[var(--sx-radius)] md:col-span-7">
          {steps.map((s, k) => (
            <div key={s.t} className={`absolute inset-0 transition-opacity duration-700 ${k === a ? "opacity-100" : "opacity-0"}`}>
              <div className="pd03-pic absolute inset-0">
                <Pic i={s.i} ratio="auto" round={false} className="absolute inset-0 h-full w-full" />
              </div>
            </div>
          ))}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(28,24,19,.55))]" />
          <div className="pd03-chip absolute bottom-[clamp(18px,2vw,28px)] left-[clamp(18px,2vw,28px)] rounded-full bg-[var(--sx-surface)] px-5 py-3 text-[15px] font-[650] text-[var(--sx-text)] shadow-[0_20px_40px_-20px_rgba(28,24,19,.5)]">
            {steps[a].c}
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "PD03", name: "Auto-advancing steps with progress bars", motion: "M6", C: PD03 }];
