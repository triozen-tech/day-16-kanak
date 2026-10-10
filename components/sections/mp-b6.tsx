"use client";

// MP · Map & location layouts (docs/SECTION-MENU.md), batch 6. Maps are drawn here (SVG), never tiles or embeds. The
// terroir map spotlights one slope after another and the location card opens into its map and back, both by themselves
// while on screen (hover / click take over); loops stop in ?static=1.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Pic, Price, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Hands-free cycling: steps an index every `ms` while the section is on screen (stops off screen and in ?static=1). */
function useAutoCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms = 1800, start = 0) {
  const [i, setI] = useState(start);
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

const MP_CSS = `.mp6-glow{background:radial-gradient(closest-side,color-mix(in srgb,var(--sx-accent) 42%,transparent),transparent);animation:mp6-glow 6s linear infinite alternate}@keyframes mp6-glow{from{translate:-24% -14%}to{translate:22% 14%}}
.mp6-ping{transform-box:fill-box;transform-origin:center;animation:mp6-ping 1.5s cubic-bezier(0,0,.2,1) infinite}@keyframes mp6-ping{from{transform:scale(1);opacity:.7}to{transform:scale(3.4);opacity:0}}
.mp6-dash{animation:mp6-dash 3s linear infinite}@keyframes mp6-dash{to{stroke-dashoffset:-48}}
.is-static .mp6-glow,.is-static .mp6-dash{animation:none}.is-static .mp6-ping{animation:none;opacity:0}
html.is-static {.mp6-glow,.mp6-dash{animation:none}.mp6-ping{animation:none;opacity:0}}`;

const SLOPES = [
  { n: "North Ridge", pts: "60,80 250,50 300,170 180,230 70,200", c: [168, 140], alt: "1,480 m", soil: "Red laterite", rain: "2,600 mm", cup: "Ridge Washed", notes: "Plum, cocoa nib", price: "₹740" },
  { n: "Silver Oak Slope", pts: "250,50 470,70 520,180 300,170", c: [385, 118], alt: "1,320 m", soil: "Loam over granite", rain: "2,200 mm", cup: "Oak Shade Natural", notes: "Jaggery, red berry", price: "₹820" },
  { n: "Cardamom Valley", pts: "70,200 180,230 230,360 110,420 40,320", c: [130, 310], alt: "1,050 m", soil: "Dark clay loam", rain: "3,100 mm", cup: "Valley Honey", notes: "Cardamom, orange peel", price: "₹690" },
  { n: "Riverbend", pts: "180,230 300,170 520,180 540,300 380,340 230,360", c: [365, 262], alt: "960 m", soil: "Alluvial silt", rain: "2,400 mm", cup: "Riverbend Robusta", notes: "Dark chocolate, malt", price: "₹520" },
  { n: "Mist Terrace", pts: "230,360 380,340 540,300 560,430 300,450 110,420", c: [350, 398], alt: "1,560 m", soil: "Volcanic loam", rain: "2,900 mm", cup: "Mist Anaerobic", notes: "Hibiscus, raw honey", price: "₹1,180" },
];

/** MP10 · Terroir region map: a hand-drawn map of a coffee region with outlined territories; the active territory fills
 *  and a side card shows its name, altitude, soil and rainfall, and the coffee grown there with a link. */
function MP10() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const [on, setOn] = useAutoCycle(r, SLOPES.length, 1800);
  const s = SLOPES[on];
  return (
    <Sec innerRef={r} theme="stone" font="wide" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#7a4a2a", ["--sx-accent-text" as string]: "#fbf3ec" }}>
      <style>{MP_CSS}</style>
      <div className="grid grid-cols-1 items-end gap-[clamp(20px,4vw,64px)] md:grid-cols-12">
        <H className="text-[clamp(40px,4.6vw,76px)] md:col-span-7">Five slopes, five cups.</H>
        <P className="max-w-[44ch] md:col-span-5 md:pb-2">Every bag comes from one block of our estate in the Western Ghats. Altitude, soil and rain decide how it tastes.</P>
      </div>

      <div className="mt-[clamp(36px,4.5vw,64px)] grid grid-cols-1 gap-[clamp(16px,2vw,28px)] md:grid-cols-12">
        <div className="relative min-w-0 overflow-hidden rounded-[24px] border border-[var(--sx-line)] bg-[var(--sx-surface)] md:col-span-8">
          <div className="mp6-glow pointer-events-none absolute left-[15%] top-[5%] aspect-square w-[70%] rounded-full" />
          <svg viewBox="0 0 600 480" className="relative block h-auto w-full" role="img" aria-label="Estate map with five growing blocks">
            {/* contour lines */}
            {[0, 1, 2, 3, 4, 5].map((k) => (
              <ellipse key={k} cx="300" cy="250" rx={60 + k * 46} ry={40 + k * 34} fill="none" stroke="var(--sx-line)" strokeWidth="1" />
            ))}
            {SLOPES.map((x, k) => (
              <polygon
                key={x.n}
                points={x.pts}
                onMouseEnter={() => setOn(k)}
                className="cursor-pointer transition-[fill,fill-opacity] duration-500"
                fill="var(--sx-accent)"
                fillOpacity={k === on ? 0.62 : 0.08}
                stroke="var(--sx-text)"
                strokeOpacity={k === on ? 0.9 : 0.35}
                strokeWidth={k === on ? 2 : 1.2}
                strokeLinejoin="round"
              />
            ))}
            {/* river */}
            <path className="mp6-dash" d="M20,250 C120,240 160,300 240,300 S400,250 470,290 S560,360 590,350" fill="none" stroke="var(--sx-text)" strokeOpacity=".45" strokeWidth="2.5" strokeDasharray="10 6" />
            {SLOPES.map((x, k) => (
              <g key={x.n} pointerEvents="none">
                <circle cx={x.c[0]} cy={x.c[1] - 22} r="5" fill={k === on ? "var(--sx-accent-text)" : "var(--sx-text)"} fillOpacity={k === on ? 1 : 0.5} />
                {k === on && <circle className="mp6-ping" cx={x.c[0]} cy={x.c[1] - 22} r="5" fill="var(--sx-accent-text)" />}
                <text x={x.c[0]} y={x.c[1] + 4} textAnchor="middle" fontSize="15" fontWeight="650" fill={k === on ? "var(--sx-accent-text)" : "var(--sx-text)"}>
                  {x.n}
                </text>
              </g>
            ))}
            <g fontSize="12" fill="var(--sx-muted)" letterSpacing="1.5">
              <text x="24" y="462">ESTATE MAP · NOT TO SCALE</text>
              <text x="576" y="34" textAnchor="end">N ↑</text>
            </g>
          </svg>
        </div>

        <aside data-m-card className="sx-card flex flex-col p-[clamp(22px,2.4vw,36px)] md:col-span-4">
          <div key={s.n} className="flex flex-1 flex-col">
            <p className="text-[12px] font-[650] uppercase tracking-[0.14em] text-[var(--sx-accent)]">Block {on + 1} of 5</p>
            <p className="sx-display mt-3 text-[clamp(26px,2.3vw,36px)] font-[700] leading-[1.02]">{s.n}</p>
            <dl className="mt-6 grid grid-cols-1 border-t border-[var(--sx-line)]">
              {[
                ["Altitude", s.alt],
                ["Soil", s.soil],
                ["Rainfall", s.rain],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-4 border-b border-[var(--sx-line)] py-3">
                  <dt className="text-[13px] uppercase tracking-[0.1em] text-[var(--sx-muted)]">{k}</dt>
                  <dd className="text-[16px] font-[600] tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 rounded-[16px] bg-[var(--sx-accent)] p-5 text-[var(--sx-accent-text)]">
              <p className="text-[12px] uppercase tracking-[0.14em] opacity-75">Grown here</p>
              <p className="mt-1.5 text-[19px] font-[700]">{s.cup}</p>
              <p className="mt-1 text-[14px] opacity-80">{s.notes}</p>
              <p className="mt-4 text-[15px]">
                250 g · <Price now={s.price} />
              </p>
            </div>
            <div className="mt-auto pt-6">
              <Btn kind="link">Shop this coffee →</Btn>
            </div>
          </div>
        </aside>
      </div>
    </Sec>
  );
}

/** MP11 · Location card that expands into a map: a compact card (photo, place, hours) that opens out to fill its stage
 *  as a drawn street map with a marker and coordinates, then folds back. Click toggles it too. */
function MP11() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M18");
  const [k, setK] = useAutoCycle(r, 2, 2600, 1);
  const open = k === 1;
  return (
    <Sec innerRef={r} theme="ink" font="grotesk" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#e0b25a", ["--sx-accent-text" as string]: "#17110a" }}>
      <style>{MP_CSS}</style>
      <div className="grid grid-cols-1 gap-[clamp(32px,5vw,80px)] md:grid-cols-12">
        <div className="flex flex-col justify-center md:col-span-4">
          <H className="max-w-[10ch] text-[clamp(44px,4.8vw,80px)]">Come and hear it first.</H>
          <P className="mt-6 max-w-[34ch]">One listening room, eight pairs of headphones and a deep sofa. Bring your own records if you like.</P>
          <div className="mt-8 border-t border-[var(--sx-line)] pt-6 text-[15px] leading-relaxed">
            <p className="font-[650]">Hush Audio · Listening Room</p>
            <p className="text-[var(--sx-muted)]">12th Main, Indiranagar, Bengaluru</p>
            <p className="mt-3 text-[var(--sx-muted)]">Write to visit@hush.example</p>
          </div>
          <div className="mt-8">
            <Btn>Book a listening slot</Btn>
          </div>
        </div>

        <div className="relative min-h-[clamp(460px,44vw,640px)] min-w-0 overflow-hidden rounded-[28px] border border-[var(--sx-line)] bg-[var(--sx-surface)] md:col-span-8">
          <div className="mp6-glow pointer-events-none absolute right-[-10%] top-[-10%] aspect-square w-[80%] rounded-full" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(var(--sx-line)_1px,transparent_1px),linear-gradient(90deg,var(--sx-line)_1px,transparent_1px)] bg-[size:48px_48px]" />

          <div
            data-m-card
            onClick={() => setK(open ? 0 : 1)}
            className="absolute cursor-pointer overflow-hidden rounded-[22px] border border-[var(--sx-line)] bg-[var(--sx-bg)] shadow-[0_40px_80px_-40px_rgba(0,0,0,.8)] transition-[left,top,width,height] duration-[900ms] ease-[cubic-bezier(.7,0,.2,1)]"
            style={open ? { left: "3%", top: "4%", width: "94%", height: "92%" } : { left: "6%", top: "12%", width: "38%", height: "76%" }}
          >
            {/* compact card */}
            <div className={`absolute inset-0 flex flex-col transition-opacity duration-500 ${open ? "pointer-events-none opacity-0" : "opacity-100 delay-300"}`}>
              <Pic i={0} ratio="auto" round={false} label="" className="min-h-0 w-full flex-1" />
              <div className="p-5">
                <p className="text-[12px] uppercase tracking-[0.14em] text-[var(--sx-muted)]">Bengaluru</p>
                <p className="mt-1 text-[20px] font-[700]">The Listening Room</p>
                <p className="mt-1 text-[14px] text-[var(--sx-muted)]">Tue – Sun · 11 am – 8 pm</p>
                <p className="mt-4 text-[14px] font-[650] text-[var(--sx-accent)]">Open the map ↗</p>
              </div>
            </div>

            {/* expanded map */}
            <div className={`absolute inset-0 transition-opacity duration-500 ${open ? "opacity-100 delay-300" : "pointer-events-none opacity-0"}`}>
              <svg viewBox="0 0 800 520" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-label="Street map with the shop marked">
                <rect width="800" height="520" fill="var(--sx-bg)" />
                <path d="M520,0 C560,120 640,160 800,170 L800,0Z" fill="var(--sx-accent)" fillOpacity=".14" />
                <rect x="70" y="330" width="170" height="120" rx="14" fill="var(--sx-accent)" fillOpacity=".12" />
                <g stroke="var(--sx-text)" strokeOpacity=".16" fill="none">
                  {[60, 150, 250, 340, 430].map((y) => (
                    <path key={y} d={`M0,${y} L800,${y + 30}`} strokeWidth="9" />
                  ))}
                  {[90, 260, 420, 600, 720].map((x) => (
                    <path key={x} d={`M${x},0 L${x - 40},520`} strokeWidth="9" />
                  ))}
                </g>
                <path d="M0,250 C200,230 300,300 420,272 S650,190 800,230" fill="none" stroke="var(--sx-accent)" strokeOpacity=".7" strokeWidth="14" strokeLinecap="round" />
                <path className="mp6-dash" d="M120,470 C200,400 300,380 360,320 S404,268 404,250" fill="none" stroke="var(--sx-text)" strokeWidth="3" strokeDasharray="10 6" strokeLinecap="round" />
                <g fontSize="13" fill="var(--sx-muted)" letterSpacing="1.2">
                  <text x="86" y="398">DEFENCE PARK</text>
                  <text x="600" y="60">LAKE</text>
                  <text x="470" y="214" transform="rotate(-8 470 214)">100 FEET ROAD</text>
                  <text x="110" y="492">METRO</text>
                </g>
                <circle className="mp6-ping" cx="404" cy="246" r="10" fill="var(--sx-accent)" />
                <path d="M404,252 C390,230 380,220 380,206 a24,24 0 1 1 48,0 C428,220 418,230 404,252Z" fill="var(--sx-accent)" />
                <circle cx="404" cy="206" r="8" fill="var(--sx-accent-text)" />
              </svg>
              <div className="absolute left-5 top-5 rounded-[16px] border border-[var(--sx-line)] bg-[color-mix(in_srgb,var(--sx-surface)_88%,transparent)] px-5 py-4 backdrop-blur-md">
                <p className="text-[17px] font-[700]">The Listening Room</p>
                <p className="mt-1 text-[14px] text-[var(--sx-muted)]">Tue – Sun · 11 am – 8 pm</p>
              </div>
              <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-center justify-between gap-3">
                <p className="rounded-full bg-[var(--sx-accent)] px-4 py-2 font-mono text-[13px] font-[650] tabular-nums text-[var(--sx-accent-text)]">12.9784° N · 77.6408° E</p>
                <p className="rounded-full border border-[var(--sx-line)] bg-[var(--sx-surface)] px-4 py-2 text-[13px]">6 min walk from the metro</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "MP10", name: "Terroir region map", motion: "M23", C: MP10 },
  { code: "MP11", name: "Location card that expands into a map", motion: "M18", C: MP11 },
];
