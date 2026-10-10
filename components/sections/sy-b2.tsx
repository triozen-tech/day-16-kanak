"use client";

// SY · Story layouts, batch 2 (docs/SECTION-MENU.md): SY07 statement with inline image chips, SY08 fixed title that
// swaps per chapter. Each keeps moving while on screen (hands-free for filming) and shows its final state in ?static=1.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion, SplitText } from "@/lib/gsap";
import { scene } from "../fx/shared";
import { Btn, H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/* ───────────────────────────── SY07 · Statement with inline image chips ───────────────────────────── */

const NOTES = [
  { i: 0, n: "Petrichor", d: "Clay from Kannauj, baked and distilled into sandalwood oil." },
  { i: 3, n: "Temple smoke", d: "Frankincense, guggul and a trace of camphor." },
  { i: 1, n: "Jasmine sambac", d: "Buds picked at dusk in Madurai, absolute by morning." },
  { i: 2, n: "Ninety days", d: "Rested in amber glass before the first bottle is filled." },
];
// chip images breathe on two periods; the preview card drifts on a third
const SY07_CSS = `.sy07-chip img{animation:sy07-kb 4.6s ease-in-out infinite alternate}.sy07-chip:nth-of-type(even) img{animation-duration:6.2s}@keyframes sy07-kb{from{transform:scale(1.1) translateX(-6%)}to{transform:scale(1.35) translateX(6%)}}.is-static .sy07-chip img{animation:none}html.is-static {.sy07-chip img{animation:none}}`;

function Chip({ k, on }: { k: number; on: boolean }) {
  return (
    <span
      data-chip={k}
      className={`sy07-chip relative mx-[0.1em] inline-block h-[0.8em] w-[1.75em] -translate-y-[0.05em] overflow-hidden rounded-full align-middle transition-[box-shadow,transform] duration-500 ${on ? "scale-110 shadow-[0_0_0_3px_var(--sx-accent)]" : "shadow-[0_0_0_1px_var(--sx-line)]"}`}
      data-cursor="Smell"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={scene(NOTES[k].i, 500, 260, "")} alt={NOTES[k].n} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
    </span>
  );
}

/** SY07 · A huge 3–4 line statement with word-sized rounded images between the words; words light up with the scroll. */
function SY07() {
  const r = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(0);
  const hover = useRef(false);
  useSectionMotion(r, "M20");

  // hands-free "hover": the preview steps through the chips while on screen
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    let t: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (e.isIntersecting) t = setInterval(() => !hover.current && setOn((v) => (v + 1) % NOTES.length), 1800);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, []);

  // the preview card rides level with the active chip's line
  useEffect(() => {
    const place = () => {
      const w = wrap.current;
      const c = card.current;
      const chip = w?.querySelector<HTMLElement>(`[data-chip="${on}"]`);
      if (!w || !c || !chip || window.innerWidth < 768) return;
      const y = chip.getBoundingClientRect().top - w.getBoundingClientRect().top - c.offsetHeight * 0.35;
      c.style.transform = `translateY(${Math.max(0, Math.min(y, w.offsetHeight - c.offsetHeight))}px)`;
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [on]);

  const chip = (k: number) => (
    <span onPointerEnter={() => ((hover.current = true), setOn(k))} onPointerLeave={() => (hover.current = false)}>
      <Chip k={k} on={k === on} />
    </span>
  );

  return (
    <Sec innerRef={r} theme="ink" font="editorial" className="py-[clamp(88px,11vw,170px)]">
      <style>{SY07_CSS}</style>
      <div ref={wrap} className="relative grid grid-cols-1 gap-[clamp(32px,4vw,64px)] md:grid-cols-12">
        <div className="md:col-span-9">
          <H className="text-[clamp(40px,4.7vw,78px)] font-[400] leading-[1.12] tracking-[-0.01em]">
            We bottle {chip(0)} the hour after rain, {chip(1)} smoke from a temple lamp and {chip(2)} jasmine picked at dusk, then {chip(3)} let it rest ninety days.
          </H>
          <div className="mt-[clamp(36px,4vw,56px)] flex flex-wrap items-center gap-5">
            <Btn>Discover Monsoon Attar · ₹3,400</Btn>
            <Btn kind="link">The four notes →</Btn>
          </div>
        </div>
        <div className="relative max-md:hidden md:col-span-3">
          <div ref={card} className="transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] will-change-transform">
            <div className="sx-card relative aspect-[4/5] overflow-hidden">
              {NOTES.map((n, k) => (
                <div key={n.n} className="fx-drift absolute inset-0 transition-opacity duration-700" style={{ opacity: k === on ? 1 : 0 }}>
                  <Pic i={n.i} ratio="auto" round={false} className="fx-pan absolute inset-[-4%] h-[108%] w-[108%]" />
                </div>
              ))}
            </div>
            <p className="mt-4 text-[17px] font-[650] text-[var(--sx-text)]">{NOTES[on].n}</p>
            <p className="mt-1 text-[14px] leading-relaxed text-[var(--sx-muted)]">{NOTES[on].d}</p>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────────── SY08 · Fixed title that swaps per chapter ───────────────────────────── */

const CHAPTERS = [
  { t: "Assam", meta: "Brahmaputra plains · 90 m", d: "Malty, bold, the breakfast leaf.", i: 3, side: "md:ml-[6%]" },
  { t: "Darjeeling", meta: "Himalayan slopes · 2,100 m", d: "Muscatel first flush, picked in March.", i: 0, side: "md:ml-auto md:mr-[6%]" },
  { t: "Nilgiri", meta: "Blue Mountains · 1,800 m", d: "Brisk and clean, frost-picked in January.", i: 2, side: "md:ml-[14%]" },
  { t: "Kangra", meta: "Dhauladhar foothills · 1,300 m", d: "A rare green tea, sweet as cut grass.", i: 1, side: "md:ml-auto md:mr-[12%]" },
];
const SY08_CSS = `.sy08-kb img{animation:sy08-kb 5.4s ease-in-out infinite alternate}.sy08-kb.alt img{animation-duration:7.2s;animation-direction:alternate-reverse}@keyframes sy08-kb{from{transform:scale(1.05)}to{transform:scale(1.18) translate(2%,-2%)}}.is-static .sy08-kb img{animation:none}html.is-static {.sy08-kb img{animation:none}}`;

/** SY08 · A big centred title holds still while chapter images scroll behind it; the title swaps to the chapter on screen. */
function SY08() {
  const r = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const [idx, setIdx] = useState(0);

  // which chapter crosses the middle of the screen
  useEffect(() => {
    const el = r.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setIdx(Number((e.target as HTMLElement).dataset.ch))),
      { rootMargin: "-45% 0px -45% 0px" },
    );
    el.querySelectorAll("[data-ch]").forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  // M12: the new title's letters pop up out of a mask (the h2 is keyed, so each chapter is a fresh node)
  useLayoutEffect(() => {
    const t = title.current;
    if (!t || prefersReducedMotion()) return;
    const s = SplitText.create(t, { type: "chars", mask: "chars" });
    const tw = gsap.from(s.chars, { yPercent: 115, duration: 0.75, ease: "power4.out", stagger: 0.035 });
    return () => {
      tw.kill();
      s.revert();
    };
  }, [idx]);

  const c = CHAPTERS[idx];
  return (
    <Sec innerRef={r} theme="ink" font="condensed" full style={{ overflow: "clip" }}>
      <style>{SY08_CSS}</style>
      <div className="grid grid-cols-1 items-end gap-6 px-[clamp(20px,5vw,96px)] pt-[clamp(72px,9vw,140px)] md:grid-cols-12">
        <P className="max-w-[40ch] md:col-span-5">Four gardens, four seasons, one tin. Scroll through where each leaf in the Atlas collection comes from.</P>
        <div className="flex flex-wrap gap-4 md:col-span-7 md:justify-end">
          <Btn>Shop the Atlas tin · ₹1,650</Btn>
        </div>
      </div>
      <div className="relative">
        {/* the fixed title: sticky inside a layer as tall as the chapters */}
        <div className="pointer-events-none absolute inset-0 z-10">
          <div className="sticky top-0 flex h-[100svh] flex-col items-center justify-center text-center">
            <h2 key={c.t} ref={title} className="sx-display text-[clamp(88px,13vw,210px)] font-[800] uppercase leading-[0.85] tracking-[-0.01em] text-white drop-shadow-[0_12px_40px_rgba(0,0,0,.55)]">
              {c.t}
            </h2>
            <p className="mt-5 rounded-full border border-white/25 bg-black/35 px-4 py-2 text-[13px] font-[600] uppercase tracking-[0.16em] text-white backdrop-blur">
              {String(idx + 1).padStart(2, "0")} / {String(CHAPTERS.length).padStart(2, "0")} · {c.meta}
            </p>
          </div>
        </div>
        <div className="relative flex flex-col gap-[6svh] px-[clamp(20px,5vw,96px)] pb-[18svh] pt-[16svh]">
          {CHAPTERS.map((ch, k) => (
            <figure key={ch.t} data-ch={k} className={`w-full md:w-[26vw] md:min-w-[300px] ${ch.side}`}>
              <div className={`sy08-kb ${k % 2 ? "alt" : ""} overflow-hidden rounded-[var(--sx-radius)]`}>
                <Pic i={ch.i} ratio="5/4" round={false} label={ch.t.toUpperCase()} />
              </div>
              <figcaption className="mt-3 flex justify-between gap-4 text-[14px] text-[var(--sx-muted)]">
                <span>{ch.d}</span>
                <span className="shrink-0">50 g · ₹{[420, 640, 380, 720][k]}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "SY07", name: "Statement with inline image chips", motion: "M20", C: SY07 },
  { code: "SY08", name: "Fixed title that swaps per chapter", motion: "M12", C: SY08 },
];
