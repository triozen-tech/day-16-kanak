"use client";

// EV · Events layouts (docs/SECTION-MENU.md), batch 2. Each is a full designed section.
import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Pic, Sec } from "./kit";
import type { SectionDef } from "./types";

const EV03_CSS = `.ev03-on .ev03-chip{animation:ev03-snap .6s cubic-bezier(.2,.9,.25,1.25) both}@keyframes ev03-snap{from{transform:scale(.4) translateY(10px);opacity:0}to{transform:none;opacity:1}}
.ev03-live{animation:ev03-live 1.2s ease-in-out infinite}@keyframes ev03-live{50%{opacity:.25}}
.is-static .ev03-chip,.is-static .ev03-live{animation:none!important}html.is-static {.ev03-chip,.ev03-live{animation:none!important}}`;

type Item =
  | { kind: "show"; t: string; chip: string; live?: boolean; meta: string; i: number; ratio: string }
  | { kind: "day"; t: string; chip: string; d: string; m: string; meta: string; price: string }
  | { kind: "tour"; t: string; chip: string; meta: string; i: number };

const ITEMS: Item[] = [
  { kind: "show", t: "Salt & Indigo: Textiles of Kutch", chip: "Now on", live: true, meta: "Gallery 1 · until 14 Dec", i: 2, ratio: "4/5" },
  { kind: "day", t: "Printmaking for beginners", chip: "Oct 21–23", d: "21", m: "Oct", meta: "Studio B · 10 am – 1 pm", price: "₹1,200" },
  { kind: "show", t: "Monsoon Light", chip: "Opens Nov 10", meta: "Photographs, 1970–2020", i: 1, ratio: "1/1" },
  { kind: "tour", t: "Curator's walk", chip: "Every Sat", meta: "11 am · 45 minutes · free with entry", i: 3 },
  { kind: "day", t: "Late night at the Lantern", chip: "Oct 31", d: "31", m: "Oct", meta: "Music, bar and open galleries till 11", price: "Free" },
  { kind: "show", t: "Clay Bodies", chip: "Now on", live: true, meta: "Gallery 3 · ceramics", i: 0, ratio: "4/5" },
  { kind: "day", t: "Family drawing morning", chip: "Nov 2", d: "02", m: "Nov", meta: "Courtyard · ages 5 and up", price: "₹350" },
];

function Chip({ c, live, delay }: { c: string; live?: boolean; delay: number }) {
  return (
    <span className="ev03-chip inline-flex items-center gap-2 rounded-full bg-[var(--sx-accent)] px-3.5 py-1.5 text-[13px] font-[700] text-[var(--sx-accent-text)]" style={{ animationDelay: `${delay}s` }}>
      {live && <span className="ev03-live h-2 w-2 rounded-full bg-[var(--sx-accent-text)]" />}
      {c}
    </span>
  );
}

function Card({ it, n }: { it: Item; n: number }) {
  const delay = 0.25 + (n % ITEMS.length) * 0.09;
  if (it.kind === "day")
    return (
      <article className="flex w-[300px] shrink-0 flex-col justify-between rounded-[var(--sx-radius,18px)] border border-[var(--sx-line)] bg-[var(--sx-surface)] p-7" style={{ minHeight: 420 }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="sx-display text-[112px] font-[800] leading-[0.8] tracking-[-0.04em] text-[var(--sx-accent)]">{it.d}</p>
            <p className="mt-2 text-[15px] font-[650] uppercase tracking-[0.18em]">{it.m}</p>
          </div>
          <Chip c={it.chip} delay={delay} />
        </div>
        <div>
          <h3 className="text-[24px] font-[700] leading-[1.15]">{it.t}</h3>
          <p className="mt-2 text-[14px] text-[var(--sx-muted)]">{it.meta}</p>
          <p className="mt-4 text-[15px] font-[650]">{it.price}</p>
        </div>
      </article>
    );
  if (it.kind === "tour")
    return (
      <article className="w-[320px] shrink-0">
        <div className="relative overflow-hidden rounded-full">
          <Pic i={it.i} ratio="1/1" round={false} label="" className="fx-drift" />
          <span className="absolute left-1/2 top-5 -translate-x-1/2">
            <Chip c={it.chip} delay={delay} />
          </span>
        </div>
        <p className="mt-5 text-[13px] font-[650] uppercase tracking-[0.16em] text-[var(--sx-muted)]">Tour</p>
        <h3 className="mt-1 text-[24px] font-[700] leading-[1.15]">{it.t}</h3>
        <p className="mt-2 text-[14px] text-[var(--sx-muted)]">{it.meta}</p>
      </article>
    );
  return (
    <article className={`${it.ratio === "1/1" ? "w-[380px]" : "w-[340px]"} shrink-0`}>
      <div className="relative overflow-hidden rounded-[var(--sx-radius,18px)]">
        <Pic i={it.i} ratio={it.ratio} round={false} className="fx-drift" />
        <span className="absolute left-4 top-4">
          <Chip c={it.chip} live={it.live} delay={delay} />
        </span>
      </div>
      <p className="mt-5 text-[13px] font-[650] uppercase tracking-[0.16em] text-[var(--sx-muted)]">Exhibition</p>
      <h3 className="mt-1 text-[24px] font-[700] leading-[1.15]">{it.t}</h3>
      <p className="mt-2 text-[14px] text-[var(--sx-muted)]">{it.meta}</p>
    </article>
  );
}

/** EV03 · 'Happening now' mixed-card carousel: exhibitions (image), one-day events (big-date text cards) and tours,
 *  each with a status chip, in one row that drifts sideways by itself and bends (skews + speeds up) with scroll speed. */
function EV03() {
  const r = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const nudge = useRef(0);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = r.current;
    const tr = row.current;
    if (!el || !tr || prefersReducedMotion()) return;
    let x = 0;
    let vis = false;
    let smooth = 0;
    const st = ScrollTrigger.create({ trigger: el, start: "top bottom", end: "bottom top" });
    const io = new IntersectionObserver(([e]) => {
      vis = e.isIntersecting;
      if (e.intersectionRatio > 0.25) setOn(true);
    }, { threshold: [0, 0.25] });
    io.observe(el);
    const tick = (_t: number, dt: number) => {
      if (!vis) return;
      const v = st.getVelocity();
      smooth += (v - smooth) * 0.08;
      const half = (tr.children[ITEMS.length] as HTMLElement).offsetLeft - (tr.children[0] as HTMLElement).offsetLeft;
      const push = nudge.current * 0.12;
      nudge.current -= push;
      x = (x - (dt / 1000) * (55 + Math.min(600, Math.abs(smooth) * 0.35)) - push) % half;
      if (x > 0) x -= half;
      gsap.set(tr, { x, skewX: gsap.utils.clamp(-7, 7, smooth / -260) });
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      io.disconnect();
      st.kill();
    };
  }, []);
  return (
    <Sec innerRef={r} theme="ink" font="wide" full className={`py-[clamp(72px,9vw,140px)] ${on ? "ev03-on" : ""}`}>
      <style>{EV03_CSS}</style>
      <div className="flex flex-wrap items-end justify-between gap-6 px-[clamp(20px,5vw,96px)]">
        <div>
          <H className="text-[clamp(56px,8vw,128px)]">Happening!</H>
          <P className="mt-4 max-w-[44ch]">Exhibitions, workshops and late nights at the Lantern House this season.</P>
        </div>
        <div className="flex items-center gap-3">
          {[
            ["←", -340, "Back"],
            ["→", 340, "Forward"],
          ].map(([a, d, l]) => (
            <button
              key={l as string}
              aria-label={l as string}
              onClick={() => (nudge.current += d as number)}
              className="grid h-14 w-14 place-items-center rounded-full border border-[var(--sx-line)] text-[20px] transition-colors hover:border-[var(--sx-accent)] hover:text-[var(--sx-accent)]"
            >
              {a}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-[clamp(40px,5vw,72px)] overflow-hidden pl-[clamp(20px,5vw,96px)]">
        <div ref={row} className="flex w-max items-start gap-7 will-change-transform">
          {[...ITEMS, ...ITEMS].map((it, n) => (
            <Card key={n} it={it} n={n} />
          ))}
        </div>
      </div>
      <div className="mt-[clamp(40px,5vw,64px)] flex flex-wrap items-center justify-between gap-6 mx-[clamp(20px,5vw,96px)] border-t border-[var(--sx-line)] pt-8">
        <p className="text-[15px] text-[var(--sx-muted)]">Open Tuesday to Sunday, 10 am – 6 pm · Members enter free</p>
        <Btn>See the full calendar</Btn>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "EV03", name: "'Happening now' mixed-card carousel", motion: "M44", C: EV03 }];
