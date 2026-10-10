"use client";

// BN · Bento layouts, batch 3 (docs/SECTION-MENU.md): BN10 living-widget bento (every tile is a small self-running
// scene). Keeps moving while on screen (hands-free for filming) and shows its final state in ?static=1.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/* ───────────────────────────── BN10 · Living-widget bento ───────────────────────────── */

const BEANS = [
  { n: "Guji Natural", o: "Ethiopia", r: "Light", p: "₹640" },
  { n: "Monsoon Malabar", o: "Karnataka", r: "Medium", p: "₹520" },
  { n: "Huila Pink", o: "Colombia", r: "Light", p: "₹780" },
  { n: "Baba Budan", o: "Chikmagalur", r: "Dark", p: "₹480" },
  { n: "Kona Lot 7", o: "Hawaii", r: "Medium", p: "₹1,290" },
  { n: "Araku Valley", o: "Andhra", r: "Medium", p: "₹560" },
];
const FEED = [
  { t: "Guji Natural shipped", d: "Arrives Thursday · tracking AW-2291", c: "#4f8dff" },
  { t: "Roasted this morning", d: "Batch 118 · Monsoon Malabar", c: "#d4a24c" },
  { t: "Ira Menon rated ★★★★★", d: "“Best pour-over I’ve had at home.”", c: "#5fb48a" },
  { t: "Grind changed to V60", d: "Applies from your next box", c: "#8a5cf6" },
  { t: "You saved ₹180", d: "Subscriber price on 2 bags", c: "#e0607e" },
];
const BN10_CSS = `
.bn10-mq{animation:bn10-mq 24s linear infinite}.bn10-mq.rev{animation-direction:reverse;animation-duration:30s}
@keyframes bn10-mq{to{transform:translateX(-50%)}}
.bn10-beam{stroke-dasharray:60 240;animation:bn10-beam 2.4s linear infinite}.bn10-beam.b2{animation-delay:-1.2s;animation-duration:2.9s}
@keyframes bn10-beam{from{stroke-dashoffset:300}to{stroke-dashoffset:0}}
.bn10-pulse{animation:bn10-pulse 1.8s ease-in-out infinite}
@keyframes bn10-pulse{0%,100%{transform:scale(1);opacity:.55}50%{transform:scale(1.35);opacity:.15}}
.is-static .bn10-mq,.is-static .bn10-beam,.is-static .bn10-pulse{animation:none}
html.is-static {.bn10-mq,.bn10-beam,.bn10-pulse{animation:none}}`;

/** Steps an index every `ms` while `ref` is on screen (stops off screen and in ?static=1). */
function useTick(ref: React.RefObject<HTMLElement | null>, ms: number) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let t: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (e.isIntersecting) t = setInterval(() => setI((v) => v + 1), ms);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, [ref, ms]);
  return i;
}

function Tile({ span, title, text, cta, on, children }: { span: string; title: string; text: string; cta: string; on: boolean; children: React.ReactNode }) {
  return (
    <article data-m-card className={`sx-card group relative flex min-h-[420px] flex-col overflow-hidden ${span}`}>
      {/* the self-running mini scene: top ~60%, fading into the tile */}
      <div className="relative h-[clamp(240px,19vw,290px)] shrink-0 overflow-hidden [mask-image:linear-gradient(180deg,#000_62%,transparent)]">{children}</div>
      <div className={`relative mt-auto px-[clamp(22px,2.2vw,32px)] pb-[clamp(22px,2.2vw,30px)] transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-y-0 ${on ? "translate-y-0" : "translate-y-[34px]"}`}>
        <h3 className="text-[clamp(20px,1.7vw,26px)] font-[700] tracking-[-0.01em]">{title}</h3>
        <p className="mt-2 max-w-[44ch] text-[15px] leading-relaxed text-[var(--sx-muted)]">{text}</p>
        <div className={`mt-4 transition-opacity duration-500 group-hover:opacity-100 ${on ? "opacity-100" : "opacity-0"}`}>
          <Btn kind="link">{cta} →</Btn>
        </div>
      </div>
    </article>
  );
}

/** BN10 · Bento of four tiles, each topped by a small self-running scene (feed, marquee, beam diagram, calendar). */
function BN10() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  const tick = useTick(r, 1700);
  const [still, setStill] = useState(false);
  useEffect(() => setStill(prefersReducedMotion()), []);
  const active = Math.floor(tick / 2) % 4; // the tile whose CTA is "hovered" (hands-free)
  const on = (k: number) => still || active === k;
  const feed = Array.from({ length: 4 }, (_, k) => FEED[(tick + FEED.length * 4 - k) % FEED.length]);
  const days = Array.from({ length: 35 }, (_, k) => k - 2); // month starts on a Wednesday
  const drops = [4, 11, 18, 25];
  const hop = drops[tick % drops.length];
  const card = (b: (typeof BEANS)[number], k: number) => (
    <div key={k} className="w-[200px] shrink-0 rounded-[14px] border border-[var(--sx-line)] bg-[var(--sx-bg)] p-4">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full" style={{ background: ["#d4a24c", "#b5502a", "#e0607e", "#5c3b28"][k % 4] }} />
        <span className="text-[12px] uppercase tracking-[0.12em] text-[var(--sx-muted)]">{b.o}</span>
      </div>
      <p className="mt-3 text-[16px] font-[650]">{b.n}</p>
      <p className="mt-1 flex justify-between text-[13px] text-[var(--sx-muted)]">
        <span>{b.r} roast</span>
        <span className="text-[var(--sx-text)]">{b.p}</span>
      </p>
    </div>
  );
  return (
    <Sec innerRef={r} theme="ink" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <style>{BN10_CSS}</style>
      <div className="grid grid-cols-1 items-end gap-8 md:grid-cols-12">
        <H className="text-[clamp(44px,5.6vw,92px)] md:col-span-7">Your coffee, on autopilot.</H>
        <div className="md:col-span-5">
          <P>Roastline picks, roasts and ships fresh beans to your grind and schedule. Change anything from the app, any time.</P>
          <div className="mt-6 flex flex-wrap gap-4">
            <Btn>Start a plan · from ₹480</Btn>
            <Btn kind="ghost">How it works</Btn>
          </div>
        </div>
      </div>

      <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 gap-[clamp(12px,1.3vw,18px)] md:grid-cols-3">
        {/* row 1 · narrow: stacking notification feed */}
        <Tile span="md:col-span-1" title="Live order feed" text="Every roast, ship and swap lands in one calm feed." cta="Open the app" on={on(0)}>
          <div className="flex flex-col gap-3 p-[clamp(18px,2vw,26px)]">
            {feed.map((f, k) => (
              <div
                key={`${tick}-${k}`}
                className="flex items-center gap-3 rounded-[14px] border border-[var(--sx-line)] bg-[var(--sx-bg)] px-4 py-3 transition-all duration-500"
                style={{ opacity: 1 - k * 0.2, transform: `scale(${1 - k * 0.03})`, animation: k === 0 && !still ? "bn10-in .6s cubic-bezier(.22,1,.36,1)" : undefined }}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[14px] font-[700] text-white" style={{ background: f.c }}>
                  {f.t[0]}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-[650]">{f.t}</span>
                  <span className="block truncate text-[12px] text-[var(--sx-muted)]">{f.d}</span>
                </span>
              </div>
            ))}
          </div>
          <style>{`@keyframes bn10-in{from{transform:translateY(-70%) scale(.9);opacity:0}}`}</style>
        </Tile>

        {/* row 1 · wide: sideways marquee of bean cards */}
        <Tile span="md:col-span-2" title="Forty single origins" text="Swipe the shelf, tap a bag, it joins your next box. Rotates monthly." cta="Browse the shelf" on={on(1)}>
          <div className="flex min-w-0 flex-col gap-4 pt-[clamp(18px,2vw,26px)]">
            <div className="flex w-max gap-4 bn10-mq">{[...BEANS, ...BEANS].map(card)}</div>
            <div className="flex w-max gap-4 bn10-mq rev">{[...BEANS.slice(3), ...BEANS.slice(0, 3), ...BEANS.slice(3), ...BEANS.slice(0, 3)].map(card)}</div>
          </div>
        </Tile>

        {/* row 2 · wide: connector-beam diagram */}
        <Tile span="md:col-span-2" title="Farm to cup in nine days" text="Green beans land Monday, roast Tuesday, reach your door by the weekend." cta="Meet the farms" on={on(2)}>
          <div className="relative h-full min-h-[250px]">
            <svg viewBox="0 0 800 250" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full">
              <defs>
                <linearGradient id="bn10-g" x1="0" x2="1">
                  <stop offset="0" stopColor="var(--sx-accent)" stopOpacity="0" />
                  <stop offset=".5" stopColor="var(--sx-accent)" />
                  <stop offset="1" stopColor="#ffffff" />
                </linearGradient>
              </defs>
              {[
                "M120 70 C 260 70, 260 125, 400 125",
                "M120 190 C 260 190, 260 125, 400 125",
                "M400 125 C 520 125, 560 125, 680 125",
              ].map((d, k) => (
                <g key={k}>
                  <path d={d} fill="none" stroke="var(--sx-line)" strokeWidth="3" />
                  <path d={d} fill="none" stroke="url(#bn10-g)" strokeWidth="5" strokeLinecap="round" className={`bn10-beam ${k % 2 ? "b2" : ""}`} pathLength={300} />
                </g>
              ))}
            </svg>
            {[
              { l: "Chikmagalur", s: "Farm", x: "15%", y: "28%" },
              { l: "Araku", s: "Farm", x: "15%", y: "76%" },
              { l: "Roastery", s: "Bengaluru", x: "50%", y: "50%" },
              { l: "Your door", s: "Day 9", x: "85%", y: "50%" },
            ].map((n, k) => (
              <div key={n.l} className="absolute -translate-x-1/2 -translate-y-1/2 text-center" style={{ left: n.x, top: n.y }}>
                <span className="relative mx-auto grid h-14 w-14 place-items-center">
                  <span className="bn10-pulse absolute inset-0 rounded-full bg-[var(--sx-accent)]" style={{ animationDelay: `${k * 0.4}s` }} />
                  <span className="relative grid h-12 w-12 place-items-center rounded-full border border-[var(--sx-line)] bg-[var(--sx-surface)] text-[15px] font-[700]">{n.l[0]}</span>
                </span>
                <span className="mt-2 block whitespace-nowrap text-[13px] font-[650]">{n.l}</span>
                <span className="block text-[12px] text-[var(--sx-muted)]">{n.s}</span>
              </div>
            ))}
          </div>
        </Tile>

        {/* row 2 · narrow: delivery calendar */}
        <Tile span="md:col-span-1" title="Never run out" text="Weekly, fortnightly or monthly. Skip a drop with one tap." cta="Set your schedule" on={on(3)}>
          <div className="p-[clamp(18px,2vw,26px)]">
            <div className="flex items-center justify-between text-[14px]">
              <b className="font-[650]">October</b>
              <span className="rounded-full bg-[var(--sx-accent)] px-3 py-1 text-[12px] font-[650] text-[var(--sx-accent-text)]">Next drop · Fri {hop}</span>
            </div>
            <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-[12px]">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, k) => (
                <span key={k} className="text-[var(--sx-muted)]">{d}</span>
              ))}
              {days.map((d, k) => {
                const isDrop = drops.includes(d);
                const isHop = d === hop;
                return (
                  <span
                    key={k}
                    className={`grid aspect-square place-items-center rounded-[8px] transition-all duration-500 ${d < 1 || d > 31 ? "opacity-0" : ""} ${isHop ? "scale-110 bg-[var(--sx-accent)] font-[700] text-[var(--sx-accent-text)]" : isDrop ? "border border-[var(--sx-accent)] text-[var(--sx-text)]" : "text-[var(--sx-muted)]"}`}
                  >
                    {d}
                  </span>
                );
              })}
            </div>
          </div>
        </Tile>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "BN10", name: "Living-widget bento", motion: "M34", C: BN10 }];
