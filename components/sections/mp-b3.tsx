"use client";

// MP · Map layouts (docs/SECTION-MENU.md), batch 3. Maps are drawn here (SVG dots, shapes, streets), never tiles or
// an embedded map. Loops stop in ?static=1.
import { useEffect, useMemo, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Hands-free cycling: steps an index every `ms` while the section is on screen (stops off screen and in ?static=1). */
function useAutoCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms = 1600) {
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

const MP_CSS = `.mp3-arc{stroke-dasharray:.16 1.2;animation:mp3-fly var(--d,2.4s) linear infinite;animation-delay:var(--dl,0s)}@keyframes mp3-fly{from{stroke-dashoffset:.16}to{stroke-dashoffset:-1.2}}
.mp3-pulse{transform-box:fill-box;transform-origin:center;animation:mp3-pulse 1.8s ease-out infinite;animation-delay:var(--dl,0s)}@keyframes mp3-pulse{from{transform:scale(.6);opacity:.9}to{transform:scale(3.2);opacity:0}}
.mp3-wave{animation:mp3-wave 2.4s linear infinite}@keyframes mp3-wave{from{transform:translateX(0)}to{transform:translateX(-48px)}}
.mp3-ring{transform-box:fill-box;transform-origin:center;animation:mp3-ring 1.6s ease-out infinite}@keyframes mp3-ring{from{transform:scale(1);opacity:.8}to{transform:scale(2.6);opacity:0}}
.is-static .mp3-arc{animation:none;stroke-dasharray:none;opacity:.55}
.is-static .mp3-pulse,.is-static .mp3-wave,.is-static .mp3-ring{animation:none;opacity:0}
html.is-static {.mp3-arc{animation:none;stroke-dasharray:none;opacity:.55}.mp3-pulse,.mp3-wave,.mp3-ring{animation:none;opacity:0}}`;

// ── MP05 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
// Continents as soft ellipses on a 100 × 50 equirectangular grid: (cx, cy, rx, ry). Rough on purpose: read as "world".
const LAND: [number, number, number, number][] = [
  [22, 12.5, 12, 6.5], [9, 7.5, 5.5, 3], [24, 6.6, 10.5, 3.4], [25.5, 19.5, 3, 3.2], [39, 4.6, 4.2, 2.8],
  [33.5, 29, 6, 7.8], [31.5, 36, 2.8, 5], [54, 11.2, 5.8, 3.6], [55.4, 7, 3, 3], [49.3, 9.8, 1.1, 1.8],
  [55, 23, 8, 6.6], [53, 17.8, 10, 3.8], [57, 31, 4.4, 5], [61.5, 31, 0.8, 1.8], [75, 10.5, 17, 5.6],
  [62.5, 17.2, 5, 3.4], [71.6, 19.6, 3.4, 4], [79, 20.6, 3.8, 3], [80.5, 15.4, 7, 4], [80.5, 6.4, 14, 3],
  [88.3, 14.6, 1.1, 2.4], [82, 25.8, 6.5, 1.5], [87.2, 31.8, 6, 4], [96.8, 36.6, 0.9, 2],
];
const CITIES = [
  { k: "Chikmagalur", x: 71, y: 21.3, home: true },
  { k: "Rotterdam", x: 51.3, y: 10.6 },
  { k: "Dubai", x: 65.4, y: 18 },
  { k: "Tokyo", x: 88.8, y: 15.1 },
  { k: "New York", x: 29.4, y: 13.7 },
  { k: "Melbourne", x: 90.3, y: 35.5 },
];

/** MP05 · Dotted world map with flight arcs: a centred two-word heading and a paragraph above a full-width 2:1 dotted
 *  world; curved arcs fly from the estate to five ports, comet heads running along them, endpoints pulsing. */
function MP05() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M6");
  const dots = useMemo(() => {
    const out: [number, number][] = [];
    for (let y = 1; y < 49; y += 1.1) {
      const row = Math.round(y / 1.1);
      for (let x = (row % 2) * 0.55 + 0.5; x < 100; x += 1.1) {
        if (LAND.some(([cx, cy, rx, ry]) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1)) out.push([x, y]);
      }
    }
    return out;
  }, []);
  const home = CITIES[0];
  const arc = (c: (typeof CITIES)[number]) => {
    const mx = (home.x + c.x) / 2;
    const my = (home.y + c.y) / 2 - Math.abs(c.x - home.x) * 0.28 - 3;
    return `M${home.x} ${home.y} Q${mx} ${my} ${c.x} ${c.y}`;
  };
  return (
    <Sec innerRef={r} theme="ink" font="wide" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#d9a55b" }}>
      <style>{MP_CSS}</style>
      <div className="mx-auto max-w-[760px] text-center">
        <H className="text-[clamp(44px,6vw,100px)]">Bean routes.</H>
        <P className="mx-auto mt-6 max-w-[48ch]">Shade-grown Arabica leaves our estate in the Western Ghats every Monday, green and hand-sorted, for roasters in five ports.</P>
      </div>
      <div data-m-img className="relative mx-auto mt-[clamp(40px,5vw,72px)] w-full max-w-[1320px]">
        <svg viewBox="0 0 100 50" className="block h-auto w-full" aria-label="World map with shipping routes from Chikmagalur">
          {dots.map(([x, y], k) => (
            <circle key={k} cx={x} cy={y} r={0.3} fill="var(--sx-text)" opacity={0.22} />
          ))}
          {CITIES.slice(1).map((c, k) => (
            <g key={c.k}>
              <path d={arc(c)} fill="none" stroke="var(--sx-accent)" strokeWidth={0.12} opacity={0.35} />
              <path d={arc(c)} pathLength={1} fill="none" stroke="var(--sx-accent)" strokeWidth={0.32} strokeLinecap="round" className="mp3-arc" style={{ ["--d" as string]: `${2 + k * 0.35}s`, ["--dl" as string]: `${-k * 0.6}s` }} />
            </g>
          ))}
          {CITIES.map((c, k) => (
            <g key={c.k}>
              <circle cx={c.x} cy={c.y} r={c.home ? 0.9 : 0.6} fill="var(--sx-accent)" className="mp3-pulse" style={{ ["--dl" as string]: `${-k * 0.3}s` }} />
              <circle cx={c.x} cy={c.y} r={c.home ? 0.75 : 0.5} fill="var(--sx-accent)" />
              <text x={c.x + (c.x > 85 ? -1.2 : 1.2)} y={c.y - 1} fontSize={1.5} fill="var(--sx-text)" textAnchor={c.x > 85 ? "end" : "start"} className="font-[600]">
                {c.k}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="mx-auto mt-[clamp(28px,4vw,56px)] grid max-w-[1320px] grid-cols-2 border-y border-[var(--sx-line)] md:grid-cols-4">
        {[
          ["5", "ports, every week"],
          ["21 days", "estate to roaster, by sea"],
          ["1,250 m", "altitude of the home farm"],
          ["₹980/kg", "green, FOB Mangaluru"],
        ].map(([n, l], k) => (
          <div key={l} className={`px-[clamp(12px,2vw,28px)] py-6 ${k ? "md:border-l md:border-[var(--sx-line)]" : ""}`}>
            <p className="sx-display text-[clamp(26px,2.4vw,38px)] font-[700] leading-none">{n}</p>
            <p className="mt-2 text-[14px] text-[var(--sx-muted)]">{l}</p>
          </div>
        ))}
      </div>
    </Sec>
  );
}

// ── MP06 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const SPOTS = [
  { t: "Casa Aldona", d: "Our 14-room hotel, by the creek", x: 46, y: 46, w: "Home" },
  { t: "The ferry ramp", d: "Crossing to the islands, every 20 min", x: 30, y: 58, w: "4 min walk" },
  { t: "Thursday market", d: "Cashew, kokum, clay pots", x: 58, y: 30, w: "8 min walk" },
  { t: "White chapel", d: "Lime-washed, 1890s, sunset bells", x: 70, y: 52, w: "10 min cycle" },
  { t: "Mangrove trail", d: "Kayaks at 7 am, guide included", x: 22, y: 30, w: "12 min cycle" },
  { t: "Fisherfolk beach", d: "Quiet sand, grilled mackerel at noon", x: 84, y: 76, w: "15 min drive" },
  { t: "Spice garden", d: "Pepper vines and a long lunch", x: 80, y: 20, w: "20 min drive" },
];

/** MP06 · Illustrated map with numbered pins + legend: a hand-drawn neighbourhood (creek, fields, roads, sea) fills 9
 *  columns with numbered pins; a 3-col legend on the right matches each number to a place. The highlight steps
 *  through the pins by itself; hovering a pin or a legend row takes over. */
function MP06() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  const [i, setI] = useAutoCycle(r, SPOTS.length, 1600);
  return (
    <Sec innerRef={r} theme="paper" font="editorial" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#c2502e" }}>
      <style>{MP_CSS}</style>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[16ch] text-[clamp(44px,5.4vw,92px)]">Around the creek.</H>
        <P className="max-w-[38ch] pb-2">Seven places our guests keep going back to, all within twenty minutes of the hotel. Bicycles are free.</P>
      </div>
      <div className="mt-[clamp(36px,5vw,64px)] grid grid-cols-1 gap-[clamp(20px,2.4vw,36px)] md:grid-cols-12">
        <div data-m-card className="relative overflow-hidden rounded-[var(--sx-radius,18px)] border border-[var(--sx-line)] bg-[#efe4cf] md:col-span-9">
          <svg viewBox="0 0 900 560" className="block h-auto w-full" aria-label="Illustrated map of the neighbourhood">
            <defs>
              <pattern id="mp3-waves" width="48" height="18" patternUnits="userSpaceOnUse">
                <path d="M0 9 Q12 2 24 9 T48 9" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="3" />
              </pattern>
              <pattern id="mp3-field" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
                <rect width="14" height="14" fill="#cfd8a6" />
                <rect width="5" height="14" fill="#bfcb8f" />
              </pattern>
            </defs>
            {/* sea, bottom right */}
            <path d="M560 560 C640 470 760 470 900 400 L900 560 Z" fill="#8fbcc4" />
            <g clipPath="url(#mp3-sea)">
              <rect x="-48" y="380" width="1000" height="200" fill="url(#mp3-waves)" className="mp3-wave" />
            </g>
            <clipPath id="mp3-sea">
              <path d="M560 560 C640 470 760 470 900 400 L900 560 Z" />
            </clipPath>
            {/* fields and woods */}
            <path d="M80 380 L250 360 L300 470 L120 520 Z" fill="url(#mp3-field)" />
            <path d="M520 80 L700 60 L720 170 L560 190 Z" fill="url(#mp3-field)" />
            {[[620, 300, 46], [680, 330, 38], [140, 120, 52], [210, 180, 40], [760, 200, 44], [390, 470, 34]].map(([x, y, s], k) => (
              <circle key={k} cx={x} cy={y} r={s} fill="#a9bd84" opacity=".8" />
            ))}
            {/* creek */}
            <path d="M0 330 C140 300 220 360 300 330 S460 250 520 300 S640 420 900 380" fill="none" stroke="#8fbcc4" strokeWidth="34" strokeLinecap="round" />
            <path d="M0 330 C140 300 220 360 300 330 S460 250 520 300 S640 420 900 380" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="2" strokeDasharray="10 14" />
            {/* roads */}
            <path d="M0 200 C200 210 380 140 560 170 S820 120 900 140" fill="none" stroke="#fffaf0" strokeWidth="14" strokeLinecap="round" />
            <path d="M420 0 C430 140 400 250 420 560" fill="none" stroke="#fffaf0" strokeWidth="12" strokeLinecap="round" />
            <path d="M420 260 C520 270 600 300 640 300 S760 330 800 420" fill="none" stroke="#fffaf0" strokeWidth="9" strokeLinecap="round" strokeDasharray="2 0" />
            <path d="M270 330 L300 560" fill="none" stroke="#fffaf0" strokeWidth="7" />
            <text x="610" y="540" fontSize="18" fill="#3e6670" fontStyle="italic">Arabian Sea</text>
            <text x="40" y="318" fontSize="16" fill="#3e6670" fontStyle="italic">Aldona creek</text>
          </svg>
          {SPOTS.map((s, k) => (
            <button key={s.t} type="button" onMouseEnter={() => setI(k)} aria-label={`${k + 1}. ${s.t}`} className="absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center" style={{ left: `${s.x}%`, top: `${s.y}%` }}>
              {k === i && <span className="mp3-ring absolute h-9 w-9 rounded-full bg-[var(--sx-accent)]/40" />}
              <span className={`relative grid h-9 w-9 place-items-center rounded-full border-2 border-[#fffaf0] text-[14px] font-[700] shadow-[0_6px_16px_-6px_rgba(28,24,19,.5)] transition-all duration-500 ${k === i ? "scale-125 bg-[var(--sx-accent)] text-white" : "bg-[#1c1813] text-[#fffaf0]"}`}>{k + 1}</span>
            </button>
          ))}
        </div>
        <div className="md:col-span-3">
        <ol className="flex flex-col">
          {SPOTS.map((s, k) => (
            <li key={s.t} data-m-card onMouseEnter={() => setI(k)} className={`flex gap-4 rounded-[14px] px-4 py-3.5 transition-colors duration-500 ${k === i ? "bg-[var(--sx-text)] text-[var(--sx-bg)]" : ""}`}>
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[13px] font-[700] ${k === i ? "bg-[var(--sx-accent)] text-white" : "border border-[var(--sx-line)]"}`}>{k + 1}</span>
              <span className="min-w-0">
                <span className="block text-[16px] font-[650] leading-tight">{s.t}</span>
                <span className={`mt-1 block text-[13px] leading-snug ${k === i ? "opacity-75" : "text-[var(--sx-muted)]"}`}>{s.d}</span>
                <span className={`mt-1 block text-[12px] font-[600] uppercase tracking-[0.12em] ${k === i ? "text-[var(--sx-accent)]" : "text-[var(--sx-muted)]"}`}>{s.w}</span>
              </span>
            </li>
          ))}
        </ol>
          <div className="mt-6 px-4">
            <Btn kind="link">Download the walking map →</Btn>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "MP05", name: "Dotted world map with flight arcs", motion: "M6", C: MP05 },
  { code: "MP06", name: "Illustrated map with numbered pins + legend", motion: "M34", C: MP06 },
];
