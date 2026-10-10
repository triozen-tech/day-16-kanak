"use client";

// MP · Map layouts (docs/SECTION-MENU.md), batch 4. Drawn here (SVG arcs, numbers), never tiles or an embedded map.
// Loops stop in ?static=1.
import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const MP_CSS = `.mp4-comet{stroke-dasharray:.07 1.1;animation:mp4-fly var(--d,2.6s) linear infinite;animation-delay:var(--dl,0s)}@keyframes mp4-fly{from{stroke-dashoffset:.07}to{stroke-dashoffset:-1.1}}
.mp4-pulse{transform-box:fill-box;transform-origin:center;animation:mp4-pulse 2s ease-out infinite;animation-delay:var(--dl,0s)}@keyframes mp4-pulse{from{transform:scale(1);opacity:.7}to{transform:scale(6);opacity:0}}
.mp4-sky{animation:mp4-sky 4.6s ease-in-out infinite alternate}@keyframes mp4-sky{from{translate:-12% 0;opacity:.55}to{translate:12% -6%;opacity:1}}
.mp4-stripes{background:repeating-linear-gradient(-45deg,color-mix(in srgb,var(--sx-accent) 13%,transparent) 0 14px,transparent 14px 28px);background-size:39.6px 39.6px;animation:mp4-stripes 1s linear infinite}@keyframes mp4-stripes{from{background-position:0 0}to{background-position:39.6px 0}}
.mp4-dot{animation:mp4-dot 1.6s ease-out infinite}@keyframes mp4-dot{from{box-shadow:0 0 0 0 color-mix(in srgb,#3c8a4e 60%,transparent)}to{box-shadow:0 0 0 12px transparent}}
.is-static .mp4-comet,.is-static .mp4-pulse{animation:none;opacity:0}
.is-static .mp4-sky,.is-static .mp4-stripes,.is-static .mp4-dot{animation:none}
html.is-static {.mp4-comet,.mp4-pulse{animation:none;opacity:0}.mp4-sky,.mp4-stripes,.mp4-dot{animation:none}}`;

// ── MP07 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const ARC = "M90 330 Q600 -40 1110 290";

/** MP07 · Journey route infographic: one arc drawn across the section from an origin dot to a destination dot (names at
 *  each end), comets flying along it; four stat cells along the bottom (flight time, distance, temperature, departure
 *  city) count up. */
function MP07() {
  const r = useRef<HTMLDivElement>(null);
  const arc = useRef<SVGPathElement>(null);
  useSectionMotion(r, "M3");
  useEffect(() => {
    const el = r.current;
    const p = arc.current;
    if (!el || !p || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(p, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.8, ease: "power2.inOut", scrollTrigger: { trigger: el, start: "top 70%", toggleActions: "play none none reverse" } });
    }, el);
    return () => ctx.revert();
  }, []);
  return (
    <Sec innerRef={r} theme="ink" font="wide" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#f0b45a" }}>
      <style>{MP_CSS}</style>
      <div className="mp4-sky pointer-events-none absolute left-[10%] top-[18%] h-[70%] w-[80%] rounded-full bg-[radial-gradient(closest-side,rgba(90,120,220,.28),transparent)]" />
      <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[14ch] text-[clamp(40px,4.8vw,80px)]">Monsoon to snow line.</H>
        <P className="max-w-[38ch] pb-2">One morning flight lifts you out of the Bengaluru rain and sets you down in the high desert, where the retreat jeep is already waiting.</P>
      </div>

      <div className="relative z-10 mx-auto mt-[clamp(28px,4vw,56px)] w-full max-w-[1320px]">
        <svg viewBox="0 0 1200 380" className="block h-auto w-full overflow-visible" aria-label="Route from Bengaluru to Leh">
          <path d={ARC} fill="none" stroke="var(--sx-text)" strokeOpacity={0.12} strokeWidth={1.5} strokeDasharray="4 8" />
          <path ref={arc} d={ARC} pathLength={1} fill="none" stroke="var(--sx-accent)" strokeWidth={2.5} strokeLinecap="round" strokeDasharray="1 1" />
          {[0, 1, 2].map((k) => (
            <path key={k} d={ARC} pathLength={1} fill="none" stroke="var(--sx-accent)" strokeWidth={7} strokeLinecap="round" className="mp4-comet" style={{ ["--d" as string]: "2.7s", ["--dl" as string]: `${-k * 0.9}s`, filter: "drop-shadow(0 0 8px var(--sx-accent))" }} />
          ))}
          {[
            { x: 90, y: 330, name: "Bengaluru", code: "BLR · 920 m", anchor: "start" as const, dl: "0s" },
            { x: 1110, y: 290, name: "Leh", code: "IXL · 3,256 m", anchor: "end" as const, dl: "-1s" },
          ].map((c) => (
            <g key={c.name}>
              <circle cx={c.x} cy={c.y} r={9} fill="var(--sx-accent)" className="mp4-pulse" style={{ ["--dl" as string]: c.dl }} />
              <circle cx={c.x} cy={c.y} r={9} fill="var(--sx-accent)" />
              <circle cx={c.x} cy={c.y} r={3.5} fill="var(--sx-bg)" />
              <text x={c.x + (c.anchor === "start" ? -6 : 6)} y={c.y + 42} textAnchor={c.anchor} fill="var(--sx-text)" fontSize={30} className="sx-display font-[700]">
                {c.name}
              </text>
              <text x={c.x + (c.anchor === "start" ? -6 : 6)} y={c.y + 66} textAnchor={c.anchor} fill="var(--sx-muted)" fontSize={15} letterSpacing={2}>
                {c.code}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="relative z-10 mx-auto mt-[clamp(40px,4vw,64px)] grid max-w-[1320px] grid-cols-2 border-y border-[var(--sx-line)] md:grid-cols-4">
        {[
          { k: "Flight time", v: <><span data-m-num>3</span> h <span data-m-num>40</span> min</> },
          { k: "Distance", v: <span data-m-num>2,480 km</span> },
          { k: "Temperature at Leh", v: <span data-m-num>−4 °C</span> },
          { k: "Departs", v: <span>Bengaluru, 05:50</span> },
        ].map((c, k) => (
          <div key={c.k} data-m-card className={`px-[clamp(12px,2vw,28px)] py-7 ${k ? "md:border-l md:border-[var(--sx-line)]" : ""}`}>
            <p className="text-[12px] uppercase tracking-[0.14em] text-[var(--sx-muted)]">{c.k}</p>
            <p className="sx-display mt-2 text-[clamp(22px,2.1vw,34px)] font-[700] leading-none tabular-nums">{c.v}</p>
          </div>
        ))}
      </div>
    </Sec>
  );
}

// ── MP08 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const SHOPS = [
  { n: "09", area: "Sector 9, Chandigarh", addr: "SCO 21, Madhya Marg", hours: [["Mon – Fri", "7:30 – 19:00"], ["Saturday", "8:00 – 20:00"], ["Sunday", "8:00 – 14:00"]] },
  { n: "11", area: "Sector 11, Chandigarh", addr: "Booth 4, Inner Market", hours: [["Mon – Fri", "7:00 – 18:30"], ["Saturday", "8:00 – 19:00"], ["Sunday", "Closed"]] },
];

/** MP08 · Numbered shop cards + coming soon: two shop cards led by huge district numbers with address, hours by day and
 *  a "Go" button, then a third outlined card teasing the next shop. */
function MP08() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M12");
  return (
    <Sec innerRef={r} theme="paper" font="condensed" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#b0532b" }}>
      <style>{MP_CSS}</style>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[12ch] text-[clamp(52px,6.4vw,108px)] uppercase">Two ovens. One more soon.</H>
        <P className="max-w-[36ch] pb-2">Sourdough out of the oven at 7 every morning. Croissants until they run out, usually by eleven.</P>
      </div>
      <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 gap-[clamp(16px,2vw,28px)] md:grid-cols-3">
        {SHOPS.map((s) => (
          <article key={s.n} data-m-card className="sx-card flex flex-col rounded-[22px] bg-[var(--sx-surface)] p-[clamp(22px,2.4vw,36px)]">
            <div className="flex items-start justify-between gap-4">
              <h3 data-m-head className="sx-display text-[clamp(120px,13vw,210px)] font-[800] leading-[0.78] tracking-[-0.03em] text-[var(--sx-accent)]">{s.n}</h3>
              <span className="mt-2 inline-flex items-center gap-2 rounded-full border border-[var(--sx-line)] px-3 py-1.5 text-[13px] font-[600]">
                <span className="mp4-dot h-2 w-2 rounded-full bg-[#3c8a4e]" />
                Open now
              </span>
            </div>
            <p className="mt-6 text-[clamp(20px,1.7vw,26px)] font-[650]">{s.area}</p>
            <p className="mt-1 text-[15px] text-[var(--sx-muted)]">{s.addr}</p>
            <dl className="mt-6 border-t border-[var(--sx-line)]">
              {s.hours.map(([d, h]) => (
                <div key={d} className="flex justify-between border-b border-[var(--sx-line)] py-2.5 text-[15px]">
                  <dt className="text-[var(--sx-muted)]">{d}</dt>
                  <dd className="font-[600] tabular-nums">{h}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-auto pt-7">
              <Btn>Go →</Btn>
            </div>
          </article>
        ))}
        <article data-m-card className="relative flex flex-col overflow-hidden rounded-[22px] border-2 border-dashed border-[color-mix(in_srgb,var(--sx-accent)_55%,transparent)] p-[clamp(22px,2.4vw,36px)]">
          <div className="mp4-stripes pointer-events-none absolute inset-0" />
          <div className="relative flex h-full flex-col">
            <h3 data-m-head className="sx-display text-[clamp(120px,13vw,210px)] font-[800] leading-[0.78] tracking-[-0.03em] text-transparent" style={{ WebkitTextStroke: "2px var(--sx-accent)" }}>
              17
            </h3>
            <p className="mt-6 text-[13px] font-[700] uppercase tracking-[0.18em] text-[var(--sx-accent)]">Coming soon</p>
            <p className="mt-2 text-[clamp(20px,1.7vw,26px)] font-[650]">Sector 17 Plaza</p>
            <p className="mt-1 max-w-[30ch] text-[15px] text-[var(--sx-muted)]">A bigger room with a counter for twelve and the wood-fired oven. Opening spring 2027.</p>
            <div className="mt-auto pt-7">
              <Btn kind="ghost">Tell me when</Btn>
            </div>
          </div>
        </article>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "MP07", name: "Journey route infographic", motion: "M3", C: MP07 },
  { code: "MP08", name: "Numbered shop cards + coming soon", motion: "M12", C: MP08 },
];
