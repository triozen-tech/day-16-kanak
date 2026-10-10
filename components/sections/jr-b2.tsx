"use client";

// JR · Journal layouts (docs/SECTION-MENU.md), batch 2. Each is a full designed section; motion via useSectionMotion.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Hands-free cycling: steps an index every `ms` while the section is on screen (stops off screen and in ?static=1). */
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
  return [i, setI] as const;
}

// ── JR03 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const NOTES = [
  { c: "Ingredients", t: "Why our oud rests for ninety days", d: "12 Sep 2026", m: "6 min" },
  { c: "Atelier", t: "A morning with the nose behind Monsoon No. 3", d: "29 Aug 2026", m: "9 min" },
  { c: "Rituals", t: "Where to wear a perfume, and where not to", d: "14 Aug 2026", m: "4 min" },
  { c: "Field notes", t: "Rose fields of Pushkar, before sunrise", d: "31 Jul 2026", m: "7 min" },
  { c: "Craft", t: "Glass, cork and the weight of a bottle", d: "18 Jul 2026", m: "5 min" },
];

/** JR03 · Split featured image + divider list: a large featured story image on the left (6/12); on the right (6/12)
 *  hairline-divided titles with category, date and an arrow. The highlight walks down the list by itself. */
function JR03() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M13");
  const [k, setK] = useAutoCycle(r, NOTES.length, 1800);
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[14ch] text-[clamp(44px,5.4vw,92px)]">Notes from the atelier.</H>
        <Btn kind="link">All stories →</Btn>
      </div>
      <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 gap-[clamp(28px,4vw,72px)] md:grid-cols-12">
        <a href="#" onClick={(e) => e.preventDefault()} className="group relative block md:col-span-6">
          <div className="relative overflow-hidden rounded-[var(--sx-radius,18px)]">
            <div className="fx-drift">
              <Pic i={2} ratio="4/5" round={false} />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgba(20,16,12,.75))]" />
            <div className="absolute inset-x-0 bottom-0 p-[clamp(20px,2.6vw,40px)] text-white">
              <p className="text-[13px] font-[650] uppercase tracking-[0.16em] text-white/70">Cover story · 3 Oct 2026</p>
              <h3 data-m-text className="sx-display mt-3 max-w-[16ch] text-[clamp(30px,3vw,52px)] leading-[1.02]">The vetiver harvest, in four mornings.</h3>
              <p className="mt-3 max-w-[40ch] text-[16px] leading-relaxed text-white/80">Roots pulled from wet red soil in Kerala, dried for a month, distilled for a day.</p>
            </div>
          </div>
        </a>
        <div className="flex flex-col md:col-span-6">
          <P className="max-w-[44ch]">Long reads on the materials, people and places behind each bottle. A new note every fortnight.</P>
          <ul className="mt-[clamp(20px,2.4vw,36px)] border-t border-[var(--sx-line)]">
            {NOTES.map((n, j) => {
              const on = j === k;
              return (
                <li key={n.t} className="relative border-b border-[var(--sx-line)]" onMouseEnter={() => setK(j)}>
                  <span aria-hidden className="absolute bottom-[-1px] left-0 h-px origin-left bg-[var(--sx-accent)] transition-transform duration-700" style={{ width: "100%", transform: `scaleX(${on ? 1 : 0})` }} />
                  <a href="#" onClick={(e) => e.preventDefault()} className="grid grid-cols-[1fr_auto] items-center gap-6 py-[clamp(16px,1.9vw,26px)]">
                    <span className="min-w-0">
                      <span className="block text-[13px] font-[650] uppercase tracking-[0.14em] text-[var(--sx-muted)]">
                        {n.c} · {n.d} · {n.m}
                      </span>
                      <span data-m-text className={`mt-1.5 block text-[clamp(20px,1.8vw,28px)] leading-[1.2] transition-colors duration-500 sx-display ${on ? "text-[var(--sx-accent)]" : ""}`}>{n.t}</span>
                    </span>
                    <span className={`grid h-11 w-11 place-items-center rounded-full border text-[17px] transition-all duration-500 ${on ? "translate-x-1 -rotate-45 border-[var(--sx-accent)] text-[var(--sx-accent)]" : "border-[var(--sx-line)]"}`}>→</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </Sec>
  );
}

// ── JR04 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const JR04_CSS = `.jr04-ring{animation:jr04-ring 1.6s ease-in-out infinite alternate}@keyframes jr04-ring{from{box-shadow:inset 0 0 0 0 var(--sx-accent)}to{box-shadow:inset 0 0 0 3px var(--sx-accent)}}
.is-static .jr04-ring{animation:none}html.is-static {.jr04-ring{animation:none}}`;

/** JR04 · Fluid importance grid: articles in an irregular 6-column grid; the lead spans 4 columns and two rows, others
 *  span 2–4 columns; text-only cards (quote, essay, list) mix with image cards. Tiles snap in; a "Now reading" ring
 *  walks between cards. */
function JR04() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  const [k] = useAutoCycle(r, 7, 1700);
  const ring = (j: number) => (j === k ? <span aria-hidden className="jr04-ring pointer-events-none absolute inset-0 z-10 rounded-[inherit]" /> : null);
  const card = "relative overflow-hidden rounded-[var(--sx-radius,18px)]";
  return (
    <Sec innerRef={r} theme="ink" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <style>{JR04_CSS}</style>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[14ch] text-[clamp(44px,5.4vw,92px)]">The Kaaru Journal.</H>
        <P className="max-w-[40ch]">Essays and studio notes from a furniture workshop in Pondicherry. Issue 14, October.</P>
      </div>
      <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 gap-[clamp(12px,1.4vw,20px)] md:grid-cols-6">
        {/* lead: 4 cols × 2 rows */}
        <article data-m-card className={`${card} group min-h-[460px] md:col-span-4 md:row-span-2`}>{ring(0)}
          <div className="fx-drift absolute inset-0">
            <Pic i={3} ratio="auto" round={false} className="absolute inset-0 h-full w-full" />
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgba(7,9,15,.85))]" />
          <div className="absolute inset-x-0 bottom-0 p-[clamp(22px,3vw,44px)]">
            <p className="text-[13px] font-[650] uppercase tracking-[0.16em] text-white/70">Cover · 14 min read</p>
            <h3 className="sx-display mt-3 max-w-[18ch] text-[clamp(32px,3.6vw,60px)] font-[800] leading-[0.98] text-white">The chair that took eleven years to make.</h3>
          </div>
        </article>
        {/* quote: text only */}
        <article data-m-card className={`${card} flex flex-col justify-between bg-[var(--sx-accent)] p-7 text-[var(--sx-accent-text)] md:col-span-2`}>{ring(1)}
          <p className="text-[56px] font-[800] leading-[0.6]">“</p>
          <p className="sx-display text-[clamp(22px,1.9vw,30px)] font-[700] leading-[1.12]">A chair is architecture you can lift with one hand.</p>
          <p className="mt-5 text-[14px] opacity-75">From an interview with Anaya Rao</p>
        </article>
        {/* small image */}
        <article data-m-card className={`${card} md:col-span-2`}>{ring(2)}
          <div className="fx-pan">
            <Pic i={1} ratio="4/3" round={false} />
          </div>
          <div className="bg-[var(--sx-surface)] p-5">
            <p className="text-[13px] text-[var(--sx-muted)]">Studio · 4 min</p>
            <h3 className="mt-1 text-[19px] font-[650] leading-[1.25]">Oiling teak in the wet season</h3>
          </div>
        </article>
        {/* essay: text only, 3 cols */}
        <article data-m-card className={`${card} flex flex-col justify-between border border-[var(--sx-line)] bg-[var(--sx-surface)] p-[clamp(22px,2.6vw,40px)] md:col-span-3`}>{ring(3)}
          <p className="text-[13px] font-[650] uppercase tracking-[0.16em] text-[var(--sx-accent)]">Essay</p>
          <h3 className="sx-display mt-6 text-[clamp(28px,2.8vw,46px)] font-[800] leading-[1.02]">Against the flat-pack afternoon.</h3>
          <p className="mt-4 max-w-[44ch] text-[16px] leading-relaxed text-[var(--sx-muted)]">On joinery, patience and why a drawer should close with a sigh. By Kabir Shah, 11 min.</p>
        </article>
        {/* image, 3 cols */}
        <article data-m-card className={`${card} md:col-span-3`}>{ring(4)}
          <div className="fx-drift">
            <Pic i={0} ratio="16/10" round={false} />
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(7,9,15,.8))] p-6">
            <p className="text-[13px] text-white/70">Visit · 6 min</p>
            <h3 className="mt-1 text-[22px] font-[650] text-white">Inside the sawmill on the Gingee road</h3>
          </div>
        </article>
        {/* list: text only, 2 cols */}
        <article data-m-card className={`${card} border border-[var(--sx-line)] p-7 md:col-span-2`}>{ring(5)}
          <p className="text-[13px] font-[650] uppercase tracking-[0.16em] text-[var(--sx-muted)]">Short reads</p>
          <ul className="mt-4 divide-y divide-[var(--sx-line)]">
            {["Cane, rattan and the difference", "A guide to caring for brass", "What we mean by 'finished by hand'"].map((t) => (
              <li key={t} className="py-3 text-[17px] font-[600] leading-[1.3]">{t}</li>
            ))}
          </ul>
        </article>
        {/* wide image, 4 cols */}
        <article data-m-card className={`${card} md:col-span-4`}>{ring(6)}
          <div className="fx-pan">
            <Pic i={2} ratio="21/9" round={false} />
          </div>
          <div className="absolute inset-y-0 left-0 flex max-w-[60%] flex-col justify-end bg-[linear-gradient(90deg,rgba(7,9,15,.8),transparent)] p-7">
            <p className="text-[13px] text-white/70">New in the shop · from ₹46,000</p>
            <h3 className="mt-1 text-[clamp(22px,2vw,30px)] font-[700] leading-[1.15] text-white">The Kolam bench, in rosewood and cane</h3>
          </div>
        </article>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "JR03", name: "Split featured image + divider list", motion: "M13", C: JR03 },
  { code: "JR04", name: "Fluid importance grid", motion: "M34", C: JR04 },
];
