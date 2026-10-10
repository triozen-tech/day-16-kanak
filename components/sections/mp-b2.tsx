"use client";

// MP · Map layouts (docs/SECTION-MENU.md), batch 2. Maps are drawn here as SVG, never embedded tiles. Zooms and
// fly-tos tween the SVG viewBox, so lines stay crisp at any zoom.
import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Price, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Hands-free cycling: steps an index every `ms` while the section is on screen (stops off screen and in ?static=1). */
function useAutoCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms = 2600) {
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

const MP_CSS = `.mp2-ring{transform-box:fill-box;transform-origin:center;animation:mp2-ring 1.5s cubic-bezier(.2,.7,.3,1) infinite}@keyframes mp2-ring{from{transform:scale(.5);opacity:.9}to{transform:scale(3.4);opacity:0}}
.mp2-contour{stroke-dasharray:6 10;animation:mp2-dash 2.4s linear infinite}@keyframes mp2-dash{to{stroke-dashoffset:-64}}
.mp2-waves{background:repeating-linear-gradient(0deg,transparent 0 22px,color-mix(in srgb,var(--sx-accent) 12%,transparent) 22px 23px);animation:mp2-waves 3.2s linear infinite}@keyframes mp2-waves{to{background-position:0 46px}}
.mp2-swap{animation:mp2-swap .7s cubic-bezier(.2,.8,.2,1)}@keyframes mp2-swap{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.is-static .mp2-ring,.is-static .mp2-contour,.is-static .mp2-waves,.is-static .mp2-swap{animation:none}
html.is-static {.mp2-ring,.mp2-contour,.mp2-waves,.mp2-swap{animation:none}}`;

// ── MP03 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
// A tear-drop tea island (viewBox 0 0 1000 1000), three growing regions to zoom into.
const ISLAND =
  "M430 80C470 90 482 150 502 200C560 300 690 420 712 560C734 700 662 862 522 922C420 962 330 902 300 792C270 682 290 562 330 442C360 342 382 242 400 162C405 120 410 85 430 80Z";
const HILLS = [0.82, 0.64, 0.46, 0.28].map((s) => ({ s }));
const REGIONS = [
  { n: "The whole island", alt: "Sea level to 2,500 m", d: "Three growing regions, three very different cups. Scroll to travel up into the hills.", tea: "Island sampler, 3 × 50 g", p: "₹1,450", x: 500, y: 520, vb: "40 40 920 920" },
  { n: "Dimbula", alt: "1,100 – 1,600 m", d: "Western slopes, cooled by the monsoon. A bright, brisk cup with a note of jasmine.", tea: "Dimbula BOP, 100 g", p: "₹620", x: 455, y: 590, vb: "275 410 360 360" },
  { n: "Uva Highlands", alt: "1,000 – 1,800 m", d: "Dry eastern winds in July give Uva its famous menthol edge. Strong enough for milk.", tea: "Uva Highland, 100 g", p: "₹680", x: 600, y: 640, vb: "420 460 360 360" },
  { n: "Ruhuna", alt: "Below 600 m", d: "Low, hot and fast-growing. Dark, malty leaf with a long, honeyed finish.", tea: "Ruhuna OP1, 100 g", p: "₹540", x: 480, y: 815, vb: "300 635 360 360" },
];

/** MP03 · Scroll-zoom region map: a pinned island map; with the scroll it zooms into region one, two, three while the
 *  caption card on the left swaps to that region's name, altitude and tea. */
function MP03() {
  const r = useRef<HTMLDivElement>(null);
  const tall = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  useSectionMotion(r, "M13");
  const [k, setK] = useState(0);
  useEffect(() => {
    const el = tall.current;
    if (!el || prefersReducedMotion() || !window.matchMedia("(min-width: 768px)").matches) return;
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => setK(Math.min(REGIONS.length - 1, Math.floor(self.progress * REGIONS.length))),
    });
    return () => st.kill();
  }, []);
  useEffect(() => {
    if (!svg.current || prefersReducedMotion()) return;
    const t = gsap.to(svg.current, { attr: { viewBox: REGIONS[k].vb }, duration: 1.3, ease: "power3.inOut" });
    return () => {
      t.kill();
    };
  }, [k]);
  const reg = REGIONS[k];
  return (
    <Sec innerRef={r} theme="stone" font="serif" full style={{ overflow: "clip" }}>
      <style>{MP_CSS}</style>
      <div ref={tall} className="relative md:h-[200vh]">
        <div className="relative overflow-hidden md:sticky md:top-0 md:h-[100svh] md:min-h-[640px]">
          <div className="mp2-waves pointer-events-none absolute inset-0 opacity-70" />
          <div className="relative h-[70svh] md:absolute md:inset-y-0 md:right-0 md:h-auto md:w-[66%]">
            <svg ref={svg} viewBox={REGIONS[0].vb} preserveAspectRatio="xMidYMid meet" className="fx-drift absolute inset-0 h-full w-full" aria-label="Map of the tea regions">
              <path d={ISLAND} fill="var(--sx-surface)" stroke="var(--sx-text)" strokeOpacity=".35" strokeWidth="2" />
              {HILLS.map(({ s }, j) => (
                <path
                  key={j}
                  d={ISLAND}
                  fill="none"
                  stroke="var(--sx-accent)"
                  strokeOpacity={0.18 + j * 0.1}
                  strokeWidth="1.5"
                  className="mp2-contour"
                  transform={`translate(${530 - 530 * s} ${640 - 640 * s}) scale(${s})`}
                />
              ))}
              <path d="M330 520C400 560 430 620 480 815M455 590C520 600 560 610 600 640M600 640C640 700 600 780 522 870" fill="none" stroke="var(--sx-muted)" strokeOpacity=".5" strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" />
              {REGIONS.slice(1).map((g, j) => {
                const on = k === j + 1;
                return (
                  <g key={g.n}>
                    <circle cx={g.x} cy={g.y} r="70" fill="var(--sx-accent)" fillOpacity={on ? 0.2 : 0.08} style={{ transition: "fill-opacity .8s" }} />
                    <circle cx={g.x} cy={g.y} r="9" fill="var(--sx-accent)" className="mp2-ring" />
                    <circle cx={g.x} cy={g.y} r="8" fill="var(--sx-accent)" stroke="var(--sx-surface)" strokeWidth="3" />
                    <text x={g.x + 18} y={g.y + 6} fontSize="15" fontWeight="600" fill="var(--sx-text)" fontFamily="inherit">
                      {g.n}
                    </text>
                  </g>
                );
              })}
              <text x="380" y="140" fontSize="16" letterSpacing="4" fill="var(--sx-muted)">NORTH</text>
            </svg>
          </div>

          <div className="relative z-10 flex flex-col gap-8 px-[clamp(20px,5vw,96px)] py-12 md:h-full md:w-[44%] md:justify-center md:py-0">
            <H className="max-w-[12ch] text-[clamp(44px,5vw,84px)]">Up into the tea hills.</H>
            <div className="sx-card relative max-w-[420px] p-[clamp(22px,2.4vw,34px)] shadow-[0_40px_80px_-50px_rgba(17,20,24,.5)]">
              <div className="mb-5 flex gap-1.5">
                {REGIONS.map((_, j) => (
                  <span key={j} className={`h-1 flex-1 rounded-full transition-colors duration-500 ${j <= k ? "bg-[var(--sx-accent)]" : "bg-[var(--sx-line)]"}`} />
                ))}
              </div>
              <div key={k} className="mp2-swap">
                <p className="text-[13px] font-[650] uppercase tracking-[0.14em] text-[var(--sx-accent)]">{k ? `Region ${k} of 3 · ${reg.alt}` : reg.alt}</p>
                <p data-m-text className="sx-display mt-2 text-[clamp(30px,2.8vw,46px)] leading-[1.02]">{reg.n}</p>
                <p className="mt-3 text-[16px] leading-relaxed text-[var(--sx-muted)]">{reg.d}</p>
                <div className="mt-6 flex items-center justify-between gap-4 border-t border-[var(--sx-line)] pt-5">
                  <span className="text-[15px]">
                    {reg.tea} · <Price now={reg.p} />
                  </span>
                  <Btn kind="link">Add →</Btn>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

// ── MP04 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
// A drawn city (viewBox 0 0 1600 1000): street grid, a river, a lake park and four bakeries.
const STREETS_H = [90, 190, 300, 400, 520, 610, 720, 820, 930];
const STREETS_V = [120, 260, 380, 520, 640, 790, 900, 1040, 1180, 1300, 1440, 1540];
const BAKERIES = [
  { n: "Indiranagar", a: "12th Main, Indiranagar", h: "7 am – 10 pm", note: "Wood oven · 40 seats", x: 1060, y: 360 },
  { n: "Jayanagar", a: "4th Block, Jayanagar", h: "7 am – 9 pm", note: "Bake school upstairs", x: 700, y: 760 },
  { n: "Malleswaram", a: "8th Cross, Malleswaram", h: "6:30 am – 9 pm", note: "Filter coffee bar", x: 520, y: 210 },
  { n: "Whitefield", a: "ITPL Main Road", h: "8 am – 10 pm", note: "Drive-up counter", x: 1400, y: 600 },
];
const fly = (b: { x: number; y: number }) => `${b.x - 470} ${b.y - 300} 760 475`;

/** MP04 · Full-bleed map with floating location card: a drawn city fills the section; a white card at the left lists
 *  the locations and the selected one (auto-steps) flies the map to its pin. */
function MP04() {
  const r = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  useSectionMotion(r, "M18");
  const [k, setK] = useAutoCycle(r, BAKERIES.length, 2600);
  const [live, setLive] = useState(false);
  useEffect(() => setLive(!prefersReducedMotion()), []);
  useEffect(() => {
    if (!svg.current || !live) return;
    const t = gsap.to(svg.current, { attr: { viewBox: fly(BAKERIES[k]) }, duration: 1.4, ease: "power3.inOut" });
    return () => {
      t.kill();
    };
  }, [k, live]);
  const b = BAKERIES[k];
  return (
    <Sec innerRef={r} theme="paper" font="grotesk" full>
      <style>{MP_CSS}</style>
      <div className="relative min-h-[clamp(640px,94svh,920px)] overflow-hidden bg-[color-mix(in_srgb,var(--sx-text)_6%,var(--sx-bg))]">
        <div className="fx-pan absolute -inset-[3%]">
          <svg ref={svg} viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-label="Map of the bakeries">
            <rect width="1600" height="1000" fill="color-mix(in srgb, var(--sx-text) 5%, var(--sx-bg))" />
            <g transform="rotate(-8 800 500)">
              {STREETS_H.map((y) => (
                <line key={`h${y}`} x1="-200" x2="1800" y1={y} y2={y} stroke="var(--sx-surface)" strokeWidth={y === 520 ? 16 : 7} />
              ))}
              {STREETS_V.map((x) => (
                <line key={`v${x}`} x1={x} x2={x} y1="-200" y2="1200" stroke="var(--sx-surface)" strokeWidth={x === 640 || x === 1180 ? 16 : 7} />
              ))}
            </g>
            <path d="M-50 640C200 600 320 700 520 660S860 520 1040 560 1400 700 1660 650" fill="none" stroke="color-mix(in srgb, #4f8dff 30%, var(--sx-bg))" strokeWidth="34" strokeLinecap="round" />
            <ellipse cx="880" cy="200" rx="120" ry="70" fill="color-mix(in srgb, #1f5f4a 22%, var(--sx-bg))" />
            <ellipse cx="880" cy="200" rx="56" ry="30" fill="color-mix(in srgb, #4f8dff 30%, var(--sx-bg))" />
            <rect x="230" y="420" width="190" height="130" rx="18" fill="color-mix(in srgb, #1f5f4a 20%, var(--sx-bg))" />
            <path d="M0 860C300 820 520 900 780 880S1300 820 1600 900" fill="none" stroke="var(--sx-accent)" strokeOpacity=".35" strokeWidth="5" strokeDasharray="1 12" strokeLinecap="round" />
            {BAKERIES.map((p, j) => {
              const on = j === k;
              return (
                <g key={p.n} style={{ cursor: "pointer" }} onClick={() => setK(j)}>
                  {on && <circle cx={p.x} cy={p.y} r="22" fill="var(--sx-accent)" className="mp2-ring" />}
                  <circle cx={p.x} cy={p.y} r={on ? 20 : 13} fill={on ? "var(--sx-accent)" : "var(--sx-text)"} stroke="var(--sx-surface)" strokeWidth="5" style={{ transition: "r .5s, fill .5s" }} />
                  <text x={p.x + 30} y={p.y + 8} fontSize={on ? 26 : 20} fontWeight="700" fill="var(--sx-text)" opacity={on ? 1 : 0.6}>
                    {p.n}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="relative z-10 flex min-h-[clamp(640px,94svh,920px)] items-center px-[clamp(20px,5vw,96px)] py-[clamp(48px,6vw,96px)]">
          <div data-m-card className="w-full max-w-[460px] rounded-[var(--sx-radius,18px)] bg-[var(--sx-surface)] p-[clamp(22px,2.6vw,40px)] shadow-[0_50px_100px_-40px_rgba(28,24,19,.45)]">
            <H className="text-[clamp(36px,3.4vw,58px)]">Four ovens, one city.</H>
            <div key={k} className="mp2-swap mt-6 rounded-[14px] bg-[var(--sx-bg)] p-5">
              <p className="text-[18px] font-[700]">{b.a}</p>
              <p className="mt-1 text-[15px] text-[var(--sx-muted)]">
                Open {b.h} · {b.note}
              </p>
              <p className="mt-3 text-[15px]">orders@ovenstreet.example</p>
            </div>
            <ul className="mt-5 divide-y divide-[var(--sx-line)] border-y border-[var(--sx-line)]">
              {BAKERIES.map((p, j) => (
                <li key={p.n}>
                  <button onClick={() => setK(j)} className="flex w-full items-center justify-between py-3.5 text-left text-[16px]">
                    <span className={`flex items-center gap-3 transition-colors ${j === k ? "font-[700]" : "text-[var(--sx-muted)]"}`}>
                      <span className={`h-2.5 w-2.5 rounded-full transition-colors ${j === k ? "bg-[var(--sx-accent)]" : "bg-[var(--sx-line)]"}`} />
                      Oven Street, {p.n}
                    </span>
                    <span className={`transition-transform duration-500 ${j === k ? "translate-x-0 text-[var(--sx-accent)]" : "-translate-x-1 opacity-40"}`}>→</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Btn>Get directions</Btn>
              <Btn kind="link">Order for pickup →</Btn>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "MP03", name: "Scroll-zoom region map", motion: "M13", C: MP03 },
  { code: "MP04", name: "Full-bleed map with floating location card", motion: "M18", C: MP04 },
];
