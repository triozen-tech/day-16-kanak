"use client";

// PD · Process / diagram layouts, batch 1 (docs/SECTION-MENU.md).
import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useScrub } from "../fx/shared";
import { LightRays } from "../fx/more";
import { Btn, H, P, Price, Product, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** PD01 · Many-to-one beams: heading + bullets (5/12); diagram (7/12) where beams flow from six source farms into the
 *  roastery hub and on to the cup. Light rays sway behind the diagram; beams flow forever. */
function PD01() {
  const sources = [
    { n: "Coorg", d: "Robusta, 1,100 m" },
    { n: "Chikmagalur", d: "Arabica, 1,400 m" },
    { n: "Araku", d: "Tribal co-op" },
    { n: "Nilgiris", d: "Washed lot" },
    { n: "Wayanad", d: "Monsooned" },
    { n: "Bababudan", d: "Heritage estate" },
  ];
  const ys = sources.map((_, k) => 10 + k * 16); // 10 … 90 (% of the diagram height)
  const HUB = { x: 54, y: 50 };
  const OUT = { x: 91, y: 50 };
  return (
    <Sec theme="ink" font="serif" className="py-[clamp(72px,9vw,140px)]" style={{ ["--accent" as string]: "var(--sx-accent)" }}>
      <style>{`
        .pd01-beam { stroke-dasharray: 14 86; animation: pd01-flow 2.6s linear infinite; }
        @keyframes pd01-flow { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }
        .pd01-hub { animation: pd01-breathe 3.2s ease-in-out infinite alternate; }
        @keyframes pd01-breathe { from { box-shadow: 0 0 0 0 color-mix(in srgb, var(--sx-accent) 0%, transparent), 0 0 60px -10px color-mix(in srgb, var(--sx-accent) 30%, transparent); } to { box-shadow: 0 0 0 18px color-mix(in srgb, var(--sx-accent) 10%, transparent), 0 0 120px 0 color-mix(in srgb, var(--sx-accent) 45%, transparent); } }
        html.is-static .pd01-beam, html.is-static .pd01-hub { animation: none; }
        html.is-static { .pd01-beam, .pd01-hub { animation: none; } }
      `}</style>
      <div className="grid grid-cols-1 items-center gap-[clamp(40px,5vw,80px)] md:grid-cols-12">
        <div className="md:col-span-5">
          <H className="max-w-[11ch] text-[clamp(44px,5.4vw,92px)]">Six farms, one cup.</H>
          <ul className="mt-9 space-y-5 border-t border-[var(--sx-line)] pt-7">
            {[
              "Green coffee bought direct, at 40% over the commodity price.",
              "Every lot cupped and roasted in Bengaluru within a week.",
              "One house blend, traceable to the hillside on the bag.",
            ].map((b) => (
              <li key={b} className="flex gap-4">
                <span className="mt-[0.65em] h-[7px] w-[7px] shrink-0 rounded-full bg-[var(--sx-accent)]" />
                <P className="text-[clamp(16px,1.15vw,18px)]">{b}</P>
              </li>
            ))}
          </ul>
          <div className="mt-9 flex flex-wrap items-center gap-5">
            <Btn>Shop the blend</Btn>
            <span className="text-[15px] text-[var(--sx-muted)]">
              250 g · <Price now="₹620" className="text-[var(--sx-text)]" />
            </span>
          </div>
        </div>

        <div data-m-card className="relative overflow-hidden rounded-[var(--sx-radius)] border border-[var(--sx-line)] bg-[var(--sx-surface)] md:col-span-7" style={{ aspectRatio: "7/5" }}>
          <LightRays className="absolute inset-0 opacity-50" count={6} />
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            <defs>
              <linearGradient id="pd01-g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="0">
                <stop offset="0" style={{ stopColor: "var(--sx-accent)", stopOpacity: 0.4 }} />
                <stop offset=".5" style={{ stopColor: "var(--sx-accent)" }} />
                <stop offset="1" style={{ stopColor: "white" }} />
              </linearGradient>
            </defs>
            {ys.map((y, k) => {
              const d = `M 9 ${y} C 30 ${y}, 32 ${HUB.y}, ${HUB.x} ${HUB.y}`;
              return (
                <g key={k}>
                  <path d={d} fill="none" style={{ stroke: "var(--sx-line)" }} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
                  <path d={d} pathLength={100} className="pd01-beam" fill="none" stroke="url(#pd01-g)" strokeWidth={2.5} strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ animationDelay: `${-k * 0.43}s` }} />
                </g>
              );
            })}
            <path d={`M ${HUB.x} ${HUB.y} L ${OUT.x} ${OUT.y}`} fill="none" style={{ stroke: "var(--sx-line)" }} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
            <path d={`M ${HUB.x} ${HUB.y} L ${OUT.x} ${OUT.y}`} pathLength={100} className="pd01-beam" fill="none" stroke="url(#pd01-g)" strokeWidth={3} strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ animationDuration: "1.6s" }} />
          </svg>

          {/* source nodes */}
          {sources.map((s, k) => (
            <div key={s.n} className="absolute flex -translate-y-1/2 items-center gap-3" style={{ left: "3%", top: `${ys[k]}%` }}>
              <span className="grid h-[clamp(34px,3.4vw,48px)] w-[clamp(34px,3.4vw,48px)] shrink-0 place-items-center rounded-full border border-[var(--sx-line)] bg-[var(--sx-bg)]">
                <svg viewBox="0 0 24 24" className="h-1/2 w-1/2 text-[var(--sx-accent)]" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden>
                  <ellipse cx="12" cy="12" rx="6" ry="8.5" transform="rotate(30 12 12)" />
                  <path d="M9 5.5c3 3 3 10 6 13" />
                </svg>
              </span>
              <span className="hidden lg:block">
                <span className="block text-[13px] font-[650] leading-tight">{s.n}</span>
                <span className="block text-[12px] text-[var(--sx-muted)]">{s.d}</span>
              </span>
            </div>
          ))}

          {/* hub */}
          <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${HUB.x}%`, top: `${HUB.y}%` }}>
            <div className="pd01-hub relative grid aspect-square w-[clamp(120px,13vw,190px)] place-items-center rounded-full border border-[var(--sx-line)] bg-[var(--sx-bg)]">
              <Product angle={1} accent="#b5743a" className="absolute inset-0 m-auto h-[78%] w-[78%]" />
            </div>
            <p className="mt-3 text-center text-[12px] uppercase tracking-[0.16em] text-[var(--sx-muted)]">The roastery</p>
          </div>

          {/* output */}
          <div className="absolute -translate-x-1/2 -translate-y-1/2 text-center" style={{ left: `${OUT.x}%`, top: `${OUT.y}%` }}>
            <span className="grid aspect-square w-[clamp(56px,5.6vw,84px)] place-items-center rounded-full bg-[var(--sx-accent)] text-[var(--sx-accent-text)]">
              <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" aria-hidden>
                <path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 3c0 1.5 1 1.5 1 3M12 3c0 1.5 1 1.5 1 3" />
              </svg>
            </span>
            <p className="mt-3 text-[12px] uppercase tracking-[0.16em] text-[var(--sx-muted)]">Your cup</p>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/** PD02 · One object, four waypoints: a single serum bottle travels left-right-left down the section with the scroll,
 *  landing beside each step's text; it bobs gently while it waits. */
function PD02() {
  const r = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const obj = useRef<HTMLDivElement>(null);
  const steps = useRef<(HTMLDivElement | null)[]>([]);
  useSectionMotion(r, "M23");
  const data = [
    { t: "Cleanse", d: "Two pumps of the gel on damp skin. Rinse cool, pat dry, wait one minute.", note: "Rice-water gel · ₹540" },
    { t: "One drop", d: "A single drop of the serum, pressed in with your palms, not rubbed.", note: "10% niacinamide · ₹890" },
    { t: "Seal", d: "A pea of the barrier cream over the top, while skin is still a little wet.", note: "Ceramide cream · ₹760" },
    { t: "Sleep", d: "That's all. Most people see a calmer, more even tone in about four weeks.", note: "Full ritual · ₹1,990" },
  ];
  useScrub(stage, (p) => {
    const st = stage.current;
    const o = obj.current;
    if (!st || !o) return;
    const pts = steps.current.map((s, k) => {
      if (!s) return { x: 0, y: 0 };
      const left = k % 2 === 0; // object beside the text: text right on even steps → object left
      return { x: left ? st.clientWidth * 0.2 - o.offsetWidth / 2 : st.clientWidth * 0.8 - o.offsetWidth / 2, y: s.offsetTop + s.offsetHeight / 2 - o.offsetHeight / 2 };
    });
    // map the pass through the screen onto the waypoints, easing into each one so the object "lands"
    const q = gsap.utils.clamp(0, 1, (p - 0.12) / 0.62) * (pts.length - 1);
    const seg = Math.min(pts.length - 2, Math.floor(q));
    const f = gsap.parseEase("power2.inOut")(q - seg);
    const a = pts[seg];
    const b = pts[seg + 1];
    const x = a.x + (b.x - a.x) * f;
    const y = a.y + (b.y - a.y) * f;
    o.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${(Math.sin(f * Math.PI) * (b.x > a.x ? 14 : -14)).toFixed(2)}deg)`;
  });
  return (
    <Sec innerRef={r} theme="paper" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <style>{`
        .pd02-bob { animation: pd02-bob 3.4s ease-in-out infinite alternate; }
        @keyframes pd02-bob { from { translate: 0 -10px; rotate: -2deg; } to { translate: 0 10px; rotate: 2deg; } }
        .pd02-glow { animation: pd02-glow 3.4s ease-in-out infinite alternate; }
        @keyframes pd02-glow { from { scale: .85; opacity: .6; } to { scale: 1.1; opacity: 1; } }
        html.is-static .pd02-bob, html.is-static .pd02-glow { animation: none; }
        html.is-static { .pd02-bob, .pd02-glow { animation: none; } }
      `}</style>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[12ch] text-[clamp(48px,6vw,104px)]">One bottle, four steps.</H>
        <P className="max-w-[36ch] pb-2">A night ritual that takes three minutes. Follow the bottle down the page.</P>
      </div>
      <div ref={stage} className="relative mt-[clamp(40px,6vw,88px)]">
        {/* the travelling object (positioned by the scroll; sits beside step 1 before JS runs) */}
        <div ref={obj} className="pointer-events-none absolute left-0 top-0 z-10 hidden h-[clamp(240px,24vw,340px)] w-[clamp(150px,15vw,210px)] md:block" style={{ transform: "translate3d(10vw, 40px, 0)" }}>
          <div className="pd02-glow absolute inset-[-30%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_30%,transparent),transparent)]" />
          <div className="pd02-bob absolute inset-0">
            <Product angle={1} accent="#c98f6b" className="absolute inset-0 m-auto h-full w-full drop-shadow-[0_30px_40px_rgba(28,24,19,.25)]" />
          </div>
        </div>
        {data.map((s, k) => (
          <div
            key={s.t}
            ref={(el) => {
              steps.current[k] = el;
            }}
            className={`grid min-h-[clamp(300px,30vw,440px)] grid-cols-1 items-center border-t border-[var(--sx-line)] md:grid-cols-12 ${k === data.length - 1 ? "border-b" : ""}`}
          >
            <div className={`py-10 md:col-span-5 ${k % 2 === 0 ? "md:col-start-7" : "md:col-start-2"}`}>
              <p className="text-[13px] font-[650] tabular-nums tracking-[0.14em] text-[var(--sx-accent)]">STEP {k + 1}</p>
              <H as="h3" className="mt-3 text-[clamp(36px,3.8vw,64px)]">{s.t}</H>
              <P className="mt-4 max-w-[38ch]">{s.d}</P>
              <p className="mt-5 text-[14px] text-[var(--sx-muted)]">{s.note}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-12 flex flex-wrap items-center gap-5">
        <Btn>Get the ritual set</Btn>
        <span className="text-[15px] text-[var(--sx-muted)]">
          <Price now="₹1,990" was="₹2,190" className="text-[var(--sx-text)]" /> · 60-day supply
        </span>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "PD01", name: "Many-to-one beam convergence diagram", motion: "M61", C: PD01 },
  { code: "PD02", name: "One object travels across waypoints", motion: "M23", C: PD02 },
];
