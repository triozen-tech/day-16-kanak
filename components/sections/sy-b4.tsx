"use client";

// SY · Story layouts, batch 4 (docs/SECTION-MENU.md): SY11 an alternating centre-spine timeline whose line fills with
// the scroll, SY12 a dated list where only the entry nearest the middle of the screen opens to show image and text.
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const CSS = `.sy4kb img{animation:sy4kbs 4.6s ease-in-out infinite alternate,sy4kbt 3.3s ease-in-out infinite alternate}
.sy4kb.alt img{animation-duration:5.4s,3.9s;animation-direction:alternate-reverse}
@keyframes sy4kbs{from{scale:1.06}to{scale:1.2}}@keyframes sy4kbt{from{translate:-3% 2%}to{translate:3% -2%}}
.sy4pulse{animation:sy4pulse 2.2s ease-out infinite}@keyframes sy4pulse{from{box-shadow:0 0 0 0 color-mix(in srgb,var(--sx-accent) 60%,transparent)}to{box-shadow:0 0 0 18px transparent}}
html.is-static .sy4kb img,html.is-static .sy4pulse{animation:none}
html.is-static {.sy4kb img,.sy4pulse{animation:none}}`;

/* ───────────────────────────── SY11 · Alternating centre-spine timeline ───────────────────────────── */

const ESTATE = [
  { y: "1924", t: "A garden on the ridge", d: "Our great-grandfather plants four acres of China bush on a slope everyone else called too steep.", i: 1 },
  { y: "1952", t: "The first withering loft", d: "A wooden factory goes up beside the stream. Leaf is withered on jute racks, rolled by hand at dusk.", i: 3 },
  { y: "1979", t: "Orthodox, only", d: "While the valley turns to fast CTC machines, we keep rolling whole leaf. It costs us a decade of profit.", i: 0 },
  { y: "2006", t: "No more sprays", d: "The whole estate goes organic. Ladybirds return first, then the hornbills nesting in the shade trees.", i: 2 },
  { y: "2025", t: "Picked this morning", d: "Two leaves and a bud, from 212 acres and 340 pickers, in your cup within nine days of the plucking.", i: 1 },
];

/** SY11 · A central vertical line; milestone cards alternate left and right with images; the line fills as you scroll. */
function SY11() {
  const r = useRef<HTMLDivElement>(null);
  const spine = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M18");
  useEffect(() => {
    if (!spine.current || !fill.current || prefersReducedMotion()) return;
    const tw = gsap.fromTo(fill.current, { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: spine.current, start: "top 65%", end: "bottom 55%", scrub: true } });
    return () => {
      tw.scrollTrigger?.kill();
      tw.kill();
    };
  }, []);
  return (
    <Sec innerRef={r} theme="ink" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <style>{CSS}</style>
      <div className="mx-auto max-w-[820px] text-center">
        <H className="text-[clamp(46px,5.6vw,92px)]">A hundred years on one hill.</H>
        <P className="mx-auto mt-5 max-w-[46ch]">Five moments that made the tea in your caddy taste the way it does.</P>
      </div>

      <div ref={spine} className="relative mx-auto mt-[clamp(56px,7vw,100px)] max-w-[1180px]">
        {/* spine + fill */}
        <div aria-hidden className="absolute inset-y-0 left-1/2 hidden w-[2px] bg-[var(--sx-line)] md:block" style={{ marginLeft: -1 }}>
          <div ref={fill} className="h-full w-full origin-top bg-[var(--sx-accent)]" />
        </div>
        <ol className="flex flex-col gap-[clamp(28px,3vw,48px)]">
          {ESTATE.map((e, k) => {
            const left = k % 2 === 0;
            return (
              <li key={e.y} className="relative grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr_96px_1fr] md:gap-0">
                <div className={`${left ? "md:col-start-1" : "md:col-start-3"} md:row-start-1`}>
                  <article data-m-card className="sx-card grid grid-cols-1 overflow-hidden md:grid-cols-[0.9fr_1fr]">
                    <div className={`sy4kb ${k % 2 ? "alt" : ""} relative min-h-[200px] overflow-hidden ${left ? "" : "md:order-2"}`}>
                      <Pic i={e.i} ratio="auto" round={false} label="" className="absolute inset-0 h-full w-full" />
                    </div>
                    <div className="p-[clamp(18px,2vw,28px)]">
                      <p className="sx-display text-[clamp(34px,3vw,48px)] font-[700] leading-none text-[var(--sx-accent)]">{e.y}</p>
                      <h3 className="mt-3 text-[20px] font-[650] leading-snug">{e.t}</h3>
                      <p className="mt-2 text-[15px] leading-relaxed text-[var(--sx-muted)]">{e.d}</p>
                    </div>
                  </article>
                </div>
                {/* dot on the spine */}
                <div aria-hidden className="hidden place-items-center md:col-start-2 md:row-start-1 md:grid">
                  <span className={`h-4 w-4 rounded-full border-[3px] border-[var(--sx-bg)] bg-[var(--sx-accent)] ${k === ESTATE.length - 1 ? "sy4pulse" : ""}`} />
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-[clamp(48px,6vw,80px)] flex justify-center">
        <Btn>Taste the 2025 first flush · ₹890</Btn>
      </div>
    </Sec>
  );
}

/* ───────────────────────────── SY12 · Centre-focus expanding timeline ───────────────────────────── */

const HOUSE = [
  { y: "2011", t: "A first bottle, in a garage in Kannauj", d: "Vetiver distilled in a copper deg, bottled by hand. Forty bottles, sold to friends within a week.", i: 0 },
  { y: "2015", t: "Monsoon Oud wins the Attar Prize", d: "The judges called it 'rain on hot stone'. Our first order from abroad followed within the month.", i: 3 },
  { y: "2018", t: "The rose fields at Aligarh", d: "We lease our own Damask rose farm, picked before sunrise so the petals keep their oil.", i: 2 },
  { y: "2022", t: "Refill bottles in every store", d: "Brass caps and thick glass meant to last. Nine in ten customers now bring their bottle back.", i: 1 },
  { y: "2026", t: "Maison opens in Mumbai", d: "A tasting room with forty scents on the wall, and a perfumer at the bench every afternoon.", i: 3 },
];

/** SY12 · A vertical list of dated entries; only the entry nearest the viewport centre opens to show image and text. */
function SY12() {
  const r = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLOListElement>(null);
  useSectionMotion(r, "M6");
  const [act, setAct] = useState(0);
  useEffect(() => {
    const el = list.current;
    if (!el || prefersReducedMotion()) return;
    let raf = 0;
    let cur = 0;
    // the entry whose head is closest to a line just above the middle of the screen opens; a 56px hysteresis stops the
    // opening/closing heights from bouncing the choice back and forth
    const pick = () => {
      raf = 0;
      const heads = Array.from(el.querySelectorAll<HTMLElement>("[data-head]"));
      const line = window.innerHeight * 0.42;
      const d = heads.map((h) => {
        const b = h.getBoundingClientRect();
        return Math.abs(b.top + b.height / 2 - line);
      });
      const best = d.indexOf(Math.min(...d));
      if (best !== cur && d[cur] - d[best] > 56) {
        cur = best;
        setAct(best);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(pick);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    pick();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <Sec innerRef={r} theme="stone" font="wide" className="py-[clamp(72px,9vw,140px)]">
      <style>{CSS}</style>
      <div className="grid grid-cols-1 gap-[clamp(32px,4vw,72px)] md:grid-cols-12">
        <div className="md:col-span-4">
          <div className="md:sticky md:top-28">
            <H className="text-[clamp(38px,3.8vw,62px)]">Fifteen years of scent.</H>
            <P className="mt-6 max-w-[34ch]">From forty bottles in a garage to a maison on the sea front. The house, told one year at a time.</P>
            <div className="mt-9">
              <Btn kind="ghost">Discover the house</Btn>
            </div>
          </div>
        </div>
        <ol ref={list} className="border-t border-[var(--sx-line)] md:col-span-8">
          {HOUSE.map((e, k) => {
            const on = k === act;
            return (
              <li key={e.y} data-m-card className="border-b border-[var(--sx-line)]">
                <div data-head className="flex items-baseline gap-[clamp(20px,3vw,48px)] py-[clamp(18px,2vw,26px)]">
                  <span className={`sx-display w-[3.2em] shrink-0 text-[clamp(22px,2vw,30px)] font-[700] tabular-nums transition-colors duration-500 ${on ? "text-[var(--sx-accent)]" : "text-[var(--sx-muted)]"}`}>{e.y}</span>
                  <span className={`flex-1 text-[clamp(18px,1.6vw,24px)] font-[600] leading-snug transition-opacity duration-500 ${on ? "" : "opacity-55"}`}>{e.t}</span>
                  <span className={`text-[20px] leading-none transition-transform duration-500 ${on ? "rotate-45 text-[var(--sx-accent)]" : "text-[var(--sx-muted)]"}`}>+</span>
                </div>
                <div className={`grid transition-[grid-template-rows,opacity] duration-700 ease-[cubic-bezier(.22,1,.36,1)] ${on ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                  <div className="min-h-0 overflow-hidden">
                    <div className="grid grid-cols-1 gap-[clamp(20px,2.4vw,36px)] pb-[clamp(22px,2.4vw,34px)] md:grid-cols-[1.2fr_1fr]">
                      <div className={`sy4kb ${k % 2 ? "alt" : ""} relative overflow-hidden rounded-[14px]`}>
                        <Pic i={e.i} ratio="16/10" round={false} label="" />
                      </div>
                      <div className="flex flex-col justify-end">
                        <p className="text-[16px] leading-relaxed text-[var(--sx-muted)]">{e.d}</p>
                        <p className="mt-5 text-[14px] font-[600]">Chapter {k + 1} of {HOUSE.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "SY11", name: "Alternating centre-spine timeline", motion: "M18", C: SY11 },
  { code: "SY12", name: "Centre-focus expanding timeline", motion: "M6", C: SY12 },
];
