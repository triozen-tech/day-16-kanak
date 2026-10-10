"use client";

// MP · Map layouts (docs/SECTION-MENU.md). Maps are drawn here (SVG / canvas dots), never embedded tiles.
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Sec } from "./kit";
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

// A rough, hand-drawn country outline (viewBox 0 0 100 110) filled with a dot grid.
const OUTLINE: [number, number][] = [
  [30, 2], [42, 0], [46, 8], [40, 14], [48, 20], [60, 24], [72, 26], [80, 22], [92, 20], [98, 28], [90, 34], [84, 32], [80, 40], [72, 40], [66, 46],
  [60, 52], [56, 62], [50, 72], [46, 82], [42, 94], [38, 104], [34, 98], [30, 86], [26, 74], [24, 62], [20, 55], [14, 52], [6, 48], [10, 42], [18, 40], [16, 32], [22, 26], [26, 18], [24, 10],
];
const inside = (x: number, y: number) => {
  let c = false;
  for (let i = 0, j = OUTLINE.length - 1; i < OUTLINE.length; j = i++) {
    const [xi, yi] = OUTLINE[i];
    const [xj, yj] = OUTLINE[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const DOTS: [number, number][] = [];
for (let y = 1; y < 110; y += 2.2) for (let x = 1; x < 100; x += 2.2) if (inside(x, y)) DOTS.push([x, y]);

const CITIES = [
  { c: "New Delhi", a: "Khan Market · Mehrauli", h: "7 am – 11 pm", n: "14", x: 38, y: 27 },
  { c: "Jaipur", a: "C-Scheme", h: "8 am – 10 pm", n: "4", x: 32, y: 33 },
  { c: "Mumbai", a: "Bandra · Fort · Juhu", h: "7 am – midnight", n: "18", x: 22, y: 62 },
  { c: "Kolkata", a: "Park Street", h: "8 am – 10 pm", n: "6", x: 70, y: 46 },
  { c: "Hyderabad", a: "Jubilee Hills", h: "8 am – 11 pm", n: "7", x: 38, y: 70 },
  { c: "Bengaluru", a: "Indiranagar · Jayanagar", h: "7 am – 11 pm", n: "15", x: 36, y: 86 },
];

const MP01_CSS = `.mp01-ring{transform-box:fill-box;transform-origin:center;animation:mp01-ring 1.6s cubic-bezier(.2,.7,.3,1) infinite}@keyframes mp01-ring{from{transform:scale(.6);opacity:.9}to{transform:scale(5);opacity:0}}
.mp01-sheen{background:linear-gradient(105deg,transparent 35%,color-mix(in srgb,var(--sx-accent) 22%,transparent) 50%,transparent 65%) 0 0/250% 100%;animation:mp01-sheen 4.5s linear infinite;mix-blend-mode:normal}@keyframes mp01-sheen{from{background-position:120% 0}to{background-position:-20% 0}}
.is-static .mp01-ring,.is-static .mp01-sheen{animation:none}.is-static .mp01-sheen{opacity:0}html.is-static {.mp01-ring,.mp01-sheen{animation:none;opacity:0}}`;

/** MP01 · City list synced with a pin map: left 4 cols city rows, right 8 cols dotted map; the active row's pin pulses and grows. */
function MP01() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M3");
  const [on, setOn] = useAutoCycle(r, CITIES.length, 1700);
  return (
    <Sec innerRef={r} theme="paper" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <style>{MP01_CSS}</style>
      <div className="grid grid-cols-1 gap-[clamp(32px,4vw,72px)] md:grid-cols-12">
        <div className="min-w-0 md:col-span-4">
          <H className="text-[clamp(40px,4.4vw,76px)]">Find a café near you.</H>
          <p className="mt-5 text-[15px] text-[var(--sx-muted)]">
            <b data-m-num className="sx-display text-[clamp(28px,2.4vw,40px)] font-[700] tabular-nums text-[var(--sx-text)]">64</b> cafés in{" "}
            <b data-m-num className="sx-display text-[clamp(28px,2.4vw,40px)] font-[700] tabular-nums text-[var(--sx-text)]">6</b> cities
          </p>
          <ul className="mt-8 border-t border-[var(--sx-line)]">
            {CITIES.map((c, k) => (
              <li key={c.c}>
                <button onClick={() => setOn(k)} className={`relative w-full border-b border-[var(--sx-line)] py-4 pl-5 text-left transition-colors duration-500 ${k === on ? "bg-[var(--sx-surface)]" : ""}`}>
                  <span className={`absolute inset-y-0 left-0 w-[3px] bg-[var(--sx-accent)] transition-transform duration-500 ${k === on ? "scale-y-100" : "scale-y-0"}`} />
                  <span className="flex items-baseline justify-between gap-4 pr-4">
                    <span className={`text-[clamp(18px,1.5vw,22px)] font-[650] transition-colors ${k === on ? "text-[var(--sx-text)]" : "text-[var(--sx-muted)]"}`}>{c.c}</span>
                    <span className="text-[13px] tabular-nums text-[var(--sx-muted)]">{c.n} cafés</span>
                  </span>
                  <span className="mt-1 block pr-4 text-[14px] text-[var(--sx-muted)]">
                    {c.a} · {c.h}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Btn kind="ghost">All locations</Btn>
          </div>
        </div>
        <div className="relative min-w-0 md:col-span-8">
          <div data-m-card className="sx-card relative h-full min-h-[520px] overflow-hidden p-[clamp(16px,2vw,32px)]">
            <div className="mp01-sheen pointer-events-none absolute inset-0" aria-hidden />
            <svg viewBox="0 0 100 110" className="relative mx-auto block h-full max-h-[760px] w-full" aria-label="Map of café cities">
              {DOTS.map(([x, y], k) => (
                <circle key={k} cx={x} cy={y} r={0.55} fill="var(--sx-muted)" opacity={0.45} />
              ))}
              {CITIES.map((c, k) => (
                <g key={c.c}>
                  {k === on && <circle className="mp01-ring" cx={c.x} cy={c.y} r={1.6} fill="none" stroke="var(--sx-accent)" strokeWidth={0.4} />}
                  <circle cx={c.x} cy={c.y} r={k === on ? 2 : 1.1} fill="var(--sx-accent)" style={{ transition: "r .5s ease" }} />
                  <text x={c.x + 3} y={c.y + 1.1} fontSize={k === on ? 3.4 : 2.6} fontWeight={650} fill={k === on ? "var(--sx-text)" : "var(--sx-muted)"} style={{ transition: "font-size .5s ease" }}>
                    {c.c}
                  </text>
                </g>
              ))}
            </svg>
            <div className="absolute bottom-[clamp(16px,2vw,28px)] left-[clamp(16px,2vw,28px)] rounded-[14px] bg-[var(--sx-bg)] px-4 py-3 shadow-[0_10px_30px_-12px_rgba(0,0,0,.3)]">
              <p className="text-[12px] font-[650] uppercase tracking-[0.12em] text-[var(--sx-accent)]">Open now</p>
              <p className="mt-1 text-[15px] font-[650]">{CITIES[on].c}</p>
              <p className="text-[13px] text-[var(--sx-muted)]">{CITIES[on].h}</p>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

// ---- MP02 globe: a dotted sphere drawn on canvas, turned by a GSAP repeat:-1 tween (M33) ----
const DEG = Math.PI / 180;
const LAND: [number, number, number][] = [
  // [lat, lon, radius°] blobs that read as continents at this scale
  [50, 15, 22], [30, 75, 20], [22, 80, 12], [5, 20, 22], [-15, 25, 18], [45, 100, 26], [60, 90, 22], [40, -100, 24], [55, -110, 20], [15, -90, 10],
  [-10, -60, 18], [-30, -62, 12], [-25, 135, 15], [65, -40, 10], [0, 110, 8],
];
const angDist = (la1: number, lo1: number, la2: number, lo2: number) =>
  Math.acos(Math.min(1, Math.sin(la1) * Math.sin(la2) + Math.cos(la1) * Math.cos(la2) * Math.cos(lo1 - lo2)));
const GLOBE: { lat: number; lon: number; land: boolean }[] = (() => {
  const N = 2600;
  const out: { lat: number; lon: number; land: boolean }[] = [];
  for (let i = 0; i < N; i++) {
    const lat = Math.asin(1 - (2 * (i + 0.5)) / N);
    const lon = (i * Math.PI * (3 - Math.sqrt(5))) % (Math.PI * 2);
    const land = LAND.some(([a, b, rr]) => angDist(lat, lon, a * DEG, b * DEG) < rr * DEG);
    out.push({ lat, lon, land });
  }
  return out;
})();
const MARKETS: [number, number][] = [
  [19, 73], [51.5, 0], [25, 55], [1.3, 104], [40.7, -74], [-33.9, 151], [35.7, 139.7], [52.5, 13.4],
];

/** MP02 · Rising globe under a giant gradient word: a slowly turning dotted globe shows only its top half, cropped by the section bottom. */
function MP02() {
  const r = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = r.current;
    const c = cv.current;
    if (!el || !c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const cs = getComputedStyle(el);
    const ink = cs.getPropertyValue("--sx-text").trim() || "#eef2f7";
    const acc = cs.getPropertyValue("--sx-accent").trim() || "#4f8dff";
    const tilt = -0.32;
    const st = { a: 0 };
    const draw = () => {
      const w = c.clientWidth;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (c.width !== Math.round(w * dpr)) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(w * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, w);
      const R = w / 2 - 2;
      const cx = w / 2;
      const proj = (lat: number, lon: number) => {
        const l = lon + st.a;
        const x = Math.cos(lat) * Math.sin(l);
        const y0 = Math.sin(lat);
        const z0 = Math.cos(lat) * Math.cos(l);
        const y = y0 * Math.cos(tilt) - z0 * Math.sin(tilt);
        const z = y0 * Math.sin(tilt) + z0 * Math.cos(tilt);
        return [cx + x * R, cx - y * R, z] as const;
      };
      ctx.fillStyle = ink;
      for (const p of GLOBE) {
        const [x, y, z] = proj(p.lat, p.lon);
        if (z <= 0) continue;
        ctx.globalAlpha = p.land ? 0.25 + 0.7 * z : 0.06 + 0.08 * z;
        ctx.beginPath();
        ctx.arc(x, y, p.land ? 1.7 : 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = acc;
      for (const [la, lo] of MARKETS) {
        const [x, y, z] = proj(la * DEG, lo * DEG);
        if (z <= 0.05) continue;
        ctx.globalAlpha = 0.25 * z;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.6 + 0.4 * z;
        ctx.beginPath();
        ctx.arc(x, y, 3.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(c);
    if (prefersReducedMotion()) return () => ro.disconnect();
    const spin = gsap.to(st, { a: Math.PI * 2, duration: 48, ease: "none", repeat: -1, onUpdate: draw, paused: true });
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? spin.play() : spin.pause()));
    io.observe(el);
    // the globe rises into place as the section arrives
    const rise = gsap.from(wrap.current, { yPercent: 18, opacity: 0, duration: 1.6, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 70%", toggleActions: "play none none reverse" } });
    return () => {
      ro.disconnect();
      io.disconnect();
      spin.kill();
      rise.scrollTrigger?.kill();
      rise.kill();
    };
  }, []);
  return (
    <Sec innerRef={r} theme="ink" font="wide" full className="pt-[clamp(72px,9vw,140px)]">
      <div className="relative z-10 px-[clamp(20px,5vw,96px)] text-center">
        <H className="text-[clamp(56px,8.4vw,140px)] leading-[0.9]">
          <span className="bg-[linear-gradient(180deg,var(--sx-text)_30%,color-mix(in_srgb,var(--sx-accent)_70%,var(--sx-text)))] bg-clip-text text-transparent">Everywhere.</span>
        </H>
        <P className="mx-auto mt-5 max-w-[46ch]">Our single-estate teas now ship to 38 countries, packed in Darjeeling and at your door in five days.</P>
        <ul className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[13px] uppercase tracking-[0.18em] text-[var(--sx-muted)]">
          {["Mumbai", "London", "Dubai", "Singapore", "New York", "Sydney", "Tokyo", "Berlin"].map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </div>
      <div className="relative mt-[clamp(24px,3vw,48px)] h-[clamp(300px,31vw,500px)] overflow-hidden">
        <div ref={wrap} className="absolute left-1/2 top-0 aspect-square w-[clamp(600px,62vw,1000px)] -translate-x-1/2">
          <div className="absolute inset-[-6%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_22%,transparent),transparent)]" />
          <canvas ref={cv} className="relative h-full w-full" aria-label="Rotating globe with market pins" />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-[radial-gradient(ellipse_70%_100%_at_50%_100%,var(--sx-bg)_30%,transparent)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[30%] bg-[linear-gradient(180deg,transparent,var(--sx-bg))]" />
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "MP01", name: "City list synced with a pin map", motion: "M3", C: MP01 },
  { code: "MP02", name: "Rising globe under a giant word", motion: "M33", C: MP02 },
];
