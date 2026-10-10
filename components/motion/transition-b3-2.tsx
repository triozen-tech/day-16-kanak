"use client";

// Transitions, batch 3 · group 2 (MOTION-MENU X19–X26). Small focused demos for /lab/motion.
// Each demo holds two simple "pages" of one brand and loops A → B → A while on screen (paused off screen).
// X19–X21 paint both pages into textures and mix them in one OGL shader (the HTML page A stays underneath as the
// fallback); X22–X26 move plain DOM layers with GSAP. Every demo has a CSS-only glow loop behind AND on top of the
// pages, so the frame never freezes between steps. ?static=1 / reduced motion: page A shows, nothing moves.
import { useEffect, useRef, type CSSProperties, type MouseEvent as ReactMouseEvent, type ReactNode, type RefObject } from "react";
import { gsap, CustomEase, prefersReducedMotion } from "@/lib/gsap";
import { createShader, type GLHandle } from "@/lib/gl";
import { scene } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const GROTESK = "'Space Grotesk Variable', system-ui, sans-serif";
const SERIF = "'Fraunces Variable', Georgia, serif";

const CSS = `
.b3g2t-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.42)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.2)),transparent 70%);animation:b3g2t-drift 5.2s linear infinite alternate;will-change:transform}
@keyframes b3g2t-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b3g2t-kb{animation:b3g2t-kb 7s linear infinite alternate;transform-origin:60% 50%}
@keyframes b3g2t-kb{from{transform:scale(1.02)}to{transform:scale(1.1) translate3d(-1.5%,0,0)}}
.b3g2t-dot{position:absolute;left:0;top:0;width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.2);box-shadow:0 0 0 6px rgba(255,255,255,.1),0 4px 14px rgba(0,0,0,.45);pointer-events:none;z-index:45;opacity:0}
.b3g2t-chip{position:absolute;right:20px;bottom:18px;z-index:46;padding:7px 14px;border-radius:999px;background:rgba(5,8,15,.62);backdrop-filter:blur(8px);color:#fff;font:600 12px/1 ${GROTESK};letter-spacing:.14em;text-transform:uppercase;pointer-events:none}
html.is-static .b3g2t-glow,html.is-static .b3g2t-kb{animation:none}
html.is-static {.b3g2t-glow,.b3g2t-kb{animation:none}}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop behind, and again on top (screen blend) of the pages. */
function Stage({ r, children, g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; g1?: string; g2?: string }) {
  return (
    <div ref={r} className="relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0d16] text-[#eef2ff]">
      <style href="b3g2t-css" precedence="default">
        {CSS}
      </style>
      <div className="b3g2t-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="absolute inset-0">{children}</div>
      <div className="b3g2t-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.45, zIndex: 35 } as CSSProperties} aria-hidden />
    </div>
  );
}

/** Play: a looping timeline that starts when the demo is on screen and pauses off screen. Nothing in reduced motion. */
function usePlay(root: RefObject<HTMLDivElement | null>, build: (el: HTMLDivElement) => gsap.core.Timeline) {
  const fn = useRef(build);
  fn.current = build;
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    let dead = false;
    let on = false;
    let tl: gsap.core.Timeline | null = null;
    const ctx = gsap.context(() => {}, el);
    const sync = () => (on ? tl?.play() : tl?.pause());
    const io = new IntersectionObserver(
      ([e]) => {
        on = e.isIntersecting;
        sync();
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    Promise.resolve(document.fonts?.ready).then(() => {
      if (dead) return;
      ctx.add(() => {
        tl = fn.current(el);
        tl.pause();
      });
      sync();
    });
    return () => {
      dead = true;
      io.disconnect();
      ctx.revert();
    };
  }, [root]);
}

/** Holds the timeline ≤ 0.3 s (the on-top glow keeps moving meanwhile). */
const hold = (tl: gsap.core.Timeline, s = 0.3) => tl.to({}, { duration: s });

/* ---------- the two mini pages ---------- */

type PageData = {
  brand: string;
  nav: string[];
  eyebrow: string;
  title: string;
  line: string;
  price: string;
  cta: string;
  bg: string;
  fg: string;
  accent: string;
  img: number;
};

const BRANDS: Record<string, [PageData, PageData]> = {
  salt: [
    { brand: "Saltmarsh", nav: ["Shop", "Rituals", "Journal"], eyebrow: "Sea-salt skincare", title: "Wash in with the tide.", line: "Mineral body care made on the Konkan coast.", price: "From ₹ 690", cta: "Shop the range", bg: "#0f2a2e", fg: "#e8fbf7", accent: "#7de3c8", img: 2 },
    { brand: "Saltmarsh", nav: ["Shop", "Rituals", "Journal"], eyebrow: "Kelp & lime · 250 ml", title: "The Tidewash.", line: "Low foam, high mineral, all-day calm.", price: "₹ 1,250", cta: "Add to bag", bg: "#efe4d2", fg: "#13292b", accent: "#0f2a2e", img: 0 },
  ],
  kiln: [
    { brand: "Kiln Row", nav: ["Shelf", "Studio", "Visit"], eyebrow: "Stoneware from Khurja", title: "Fired slow. Made to last.", line: "Hand-thrown pieces in small, numbered runs.", price: "From ₹ 890", cta: "Browse the shelf", bg: "#1c1410", fg: "#f6e9dc", accent: "#e0913f", img: 3 },
    { brand: "Kiln Row", nav: ["Shelf", "Studio", "Visit"], eyebrow: "New · Ash glaze", title: "The Dune Bowl.", line: "Wide, shallow and made for sharing.", price: "₹ 1,450", cta: "Add to bag", bg: "#e7a35a", fg: "#1c1410", accent: "#1c1410", img: 1 },
  ],
  velo: [
    { brand: "Velo Nine", nav: ["Bikes", "Fit", "Rides"], eyebrow: "Built in Pune", title: "Ride past the city.", line: "Carbon commuters for every kind of morning.", price: "From ₹ 84,000", cta: "Find your frame", bg: "#0b1020", fg: "#eaf5ff", accent: "#2f8cff", img: 0 },
    { brand: "Velo Nine", nav: ["Bikes", "Fit", "Rides"], eyebrow: "Model 9R · 7.8 kg", title: "Lighter than doubt.", line: "Hydraulic discs, belt drive, zero fuss.", price: "₹ 1,12,000", cta: "Book a test ride", bg: "#2f8cff", fg: "#061026", accent: "#061026", img: 2 },
  ],
  tea: [
    { brand: "Amberleaf", nav: ["Teas", "Gifts", "Brew"], eyebrow: "Single-estate Darjeeling", title: "Steeped in dusk.", line: "Small-lot teas, picked and packed by hand.", price: "From ₹ 540", cta: "Shop the teas", bg: "#1a0b12", fg: "#fff1e6", accent: "#ff4d6d", img: 1 },
    { brand: "Amberleaf", nav: ["Teas", "Gifts", "Brew"], eyebrow: "Second flush · 100 g", title: "Muscatel Reserve.", line: "Bright, honeyed and a little wild.", price: "₹ 1,180", cta: "Add to cart", bg: "#ffd6b0", fg: "#1a0b12", accent: "#1a0b12", img: 3 },
  ],
};

const imgUrl = (v: PageData) => scene(v.img, 1000, 800);

/** One simple brand page: nav, a big headline + price + button on the left, a photo on the right. */
function MiniPage({ v, kb = true }: { v: PageData; kb?: boolean }) {
  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: v.bg, color: v.fg }}>
      <div className="flex items-center justify-between px-[5%] pt-[3.4%] text-[13px] uppercase tracking-[0.18em]">
        <span className="font-[700]" style={{ fontFamily: GROTESK }}>
          {v.brand}
        </span>
        <span className="flex gap-7 opacity-75">
          {v.nav.map((n) => (
            <span key={n}>{n}</span>
          ))}
        </span>
      </div>
      <div className="grid flex-1 grid-cols-[1.05fr_1fr] items-center gap-[5%] px-[5%] pb-[5%]">
        <div>
          <p className="text-[13px] font-[600] uppercase tracking-[0.22em] opacity-70">{v.eyebrow}</p>
          <h3 className="mt-3 max-w-[11ch] text-[clamp(40px,4.8vw,78px)] font-[500] leading-[0.95] tracking-[-0.02em]" style={{ fontFamily: SERIF }}>
            {v.title}
          </h3>
          <p className="mt-4 max-w-[34ch] text-[15px] opacity-75">{v.line}</p>
          <div className="mt-6 flex items-center gap-5">
            <button type="button" data-cta className="rounded-full px-6 py-3 text-[14px] font-[600]" style={{ background: v.accent, color: v.bg, fontFamily: GROTESK }}>
              {v.cta}
            </button>
            <span className="text-[15px] font-[600]">{v.price}</span>
          </div>
        </div>
        <div className="relative h-[82%] overflow-hidden rounded-[22px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgUrl(v)} alt="" className={`absolute inset-0 h-full w-full object-cover ${kb ? "b3g2t-kb" : ""}`} draggable={false} />
        </div>
      </div>
    </div>
  );
}

/* ---------- canvas copy of MiniPage (texture for the shader transitions) ---------- */

function wrap(x: CanvasRenderingContext2D, text: string, maxW: number) {
  const out: string[] = [];
  let line = "";
  for (const w of text.split(" ")) {
    const test = line ? `${line} ${w}` : w;
    if (x.measureText(test).width > maxW && line) {
      out.push(line);
      line = w;
    } else line = test;
  }
  if (line) out.push(line);
  return out;
}

function roundRect(x: CanvasRenderingContext2D, l: number, t: number, w: number, h: number, r: number) {
  x.beginPath();
  x.moveTo(l + r, t);
  x.arcTo(l + w, t, l + w, t + h, r);
  x.arcTo(l + w, t + h, l, t + h, r);
  x.arcTo(l, t + h, l, t, r);
  x.arcTo(l, t, l + w, t, r);
  x.closePath();
}

async function paintPage(v: PageData, w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d")!;
  x.fillStyle = v.bg;
  x.fillRect(0, 0, w, h);
  const pad = w * 0.05;
  x.fillStyle = v.fg;
  x.textBaseline = "top";
  x.font = `700 13px ${GROTESK}`;
  x.fillText(v.brand.toUpperCase(), pad, h * 0.05);
  x.globalAlpha = 0.75;
  x.font = `400 13px ${GROTESK}`;
  let nx = w - pad;
  for (const n of [...v.nav].reverse()) {
    const tw = x.measureText(n.toUpperCase()).width;
    nx -= tw;
    x.fillText(n.toUpperCase(), nx, h * 0.05);
    nx -= 28;
  }
  // photo
  const img = new Image();
  img.src = imgUrl(v);
  await img.decode();
  const iw = w * 0.42;
  const ih = h * 0.66;
  const il = w - pad - iw;
  const it = h * 0.18;
  x.globalAlpha = 1;
  x.save();
  roundRect(x, il, it, iw, ih, 22);
  x.clip();
  const k = Math.max(iw / img.width, ih / img.height) * 1.04;
  x.drawImage(img, il + (iw - img.width * k) / 2, it + (ih - img.height * k) / 2, img.width * k, img.height * k);
  x.restore();
  // copy
  const tw = w * 0.42;
  const fs = Math.max(40, Math.min(78, w * 0.048));
  x.font = `500 ${fs}px ${SERIF}`;
  const lines = wrap(x, v.title, Math.min(tw, fs * 6.2));
  const block = 13 + 12 + lines.length * fs * 0.95 + 16 + 15 + 24 + 46;
  let y = (h * 0.1 + h * 0.95) / 2 - block / 2;
  x.globalAlpha = 0.7;
  x.font = `600 13px ${GROTESK}`;
  x.fillText(v.eyebrow.toUpperCase(), pad, y);
  y += 25;
  x.globalAlpha = 1;
  x.font = `500 ${fs}px ${SERIF}`;
  for (const l of lines) {
    x.fillText(l, pad, y);
    y += fs * 0.95;
  }
  y += 16;
  x.globalAlpha = 0.75;
  x.font = `400 15px ${GROTESK}`;
  x.fillText(v.line, pad, y);
  y += 39;
  x.globalAlpha = 1;
  x.font = `600 14px ${GROTESK}`;
  const bw = x.measureText(v.cta).width + 48;
  x.fillStyle = v.accent;
  roundRect(x, pad, y, bw, 44, 22);
  x.fill();
  x.fillStyle = v.bg;
  x.fillText(v.cta, pad + 24, y + 15);
  x.fillStyle = v.fg;
  x.font = `600 15px ${GROTESK}`;
  x.fillText(v.price, pad + bw + 20, y + 14);
  return c;
}

/* ---------- shader transitions (X19–X21) ---------- */

type Uniforms = Record<string, { value: unknown }>;

const NOISE = /* glsl */ `
float h21(vec2 p) { p = fract(p * vec2(233.34, 851.73)); p += dot(p, p + 23.45); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = h21(i), b = h21(i + vec2(1.0, 0.0)), c = h21(i + vec2(0.0, 1.0)), d = h21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = r * p * 2.03 + 0.17; a *= 0.5; }
  return s;
}
uniform float uFlip, uCover, uBurn;
uniform vec2 uOrigin;
uniform vec3 uVeil;
vec3 pa(vec2 uv) { return texture2D(uTex0, cover(clamp(uv, 0.0, 1.0), uTexRes0)).rgb; }
vec3 pb(vec2 uv) { return texture2D(uTex1, cover(clamp(uv, 0.0, 1.0), uTexRes1)).rgb; }
vec3 fromPage(vec2 uv) { return mix(pa(uv), pb(uv), uFlip); }
vec3 toPage(vec2 uv) { return mix(pb(uv), pa(uv), uFlip); }
`;

/**
 * Paints both pages into textures, runs `frag`, and loops `play(uniforms)` while on screen.
 * The HTML page A underneath is the fallback (static / reduced motion / no WebGL).
 */
function GLSwap({ pair, frag, play, g1 }: { pair: [PageData, PageData]; frag: string; play: (u: Uniforms) => gsap.core.Timeline; g1: string }) {
  const box = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const pl = useRef(play);
  pl.current = play;
  useEffect(() => {
    const el = box.current;
    if (!el || prefersReducedMotion()) return;
    let dead = false;
    let h: GLHandle | null = null;
    let tl: gsap.core.Timeline | null = null;
    let on = false;
    const io = new IntersectionObserver(
      ([e]) => {
        on = e.isIntersecting;
        if (tl) (on ? tl.play() : tl.pause());
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    (async () => {
      await document.fonts?.ready;
      const r = el.getBoundingClientRect();
      const w = Math.round(Math.min(1400, Math.max(320, r.width)));
      const hh = Math.round(Math.max(200, (w * r.height) / Math.max(1, r.width)));
      const [a, b] = await Promise.all([paintPage(pair[0], w, hh), paintPage(pair[1], w, hh)]);
      if (dead || !cv.current) return;
      h = await createShader(cv.current, frag, {
        textures: [a, b],
        dpr: 1,
        uniforms: { uFlip: { value: 0 }, uCover: { value: 0 }, uBurn: { value: 0 }, uOrigin: { value: [0.5, 0.5] }, uVeil: { value: [1, 0.4, 0.3] } },
      });
      if (dead) {
        h?.destroy();
        return;
      }
      if (!h) return;
      tl = pl.current(h.uniforms);
      if (on) tl.play();
      else tl.pause();
    })();
    return () => {
      dead = true;
      io.disconnect();
      tl?.kill();
      h?.destroy();
    };
  }, [pair, frag]);
  return (
    <Stage r={box} g1={g1}>
      <MiniPage v={pair[0]} kb={false} />
      <canvas ref={cv} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500" aria-hidden />
    </Stage>
  );
}

/* ---------- X19 · Organic distortion mask (variant of X11: noisy mask from a point + displacement peaking mid-way) ---------- */
const ORGANIC = /* glsl */ `${NOISE}
void main() {
  float asp = uRes.x / uRes.y;
  vec2 p = vec2(vUv.x * asp, vUv.y);
  vec2 o = vec2(uOrigin.x * asp, uOrigin.y);
  float t = uTime;
  float n = fbm(p * 3.0 + vec2(t * 0.12, -t * 0.08));
  float d = length(p - o) + (n - 0.5) * 0.38;
  float R = length(vec2(asp, 1.0)) + 0.45;
  float r = uProgress * R - 0.22;
  float mask = smoothstep(r, r - 0.035, d);
  // displacement: peaks mid-transition, clears when the mask completes
  float amp = sin(uProgress * 3.14159) * 0.075;
  vec2 w = vec2(fbm(p * 4.0 + t * 0.4), fbm(p * 4.0 + 7.3 - t * 0.4)) - 0.5;
  vec3 outgoing = fromPage(vUv + w * amp * 2.0);
  vec3 incoming = toPage(vUv + w * amp * 0.6 * (1.0 - mask));
  float rim = smoothstep(r - 0.09, r - 0.035, d) * mask;
  vec3 col = mix(outgoing, incoming, mask) + rim * 0.22;
  gl_FragColor = vec4(col, 1.0);
}`;
const X19_ORIGINS: [number, number][] = [
  [0.22, 0.3],
  [0.8, 0.72],
];
function X19() {
  return (
    <GLSwap
      pair={BRANDS.salt}
      frag={ORGANIC}
      g1="rgba(125,227,200,.4)"
      play={(u) => {
        const tl = gsap.timeline({ repeat: -1 });
        [0, 1].forEach((k) => {
          tl.set(u.uFlip, { value: k });
          tl.set(u.uProgress, { value: 0 });
          tl.call(() => (u.uOrigin.value = X19_ORIGINS[k]));
          tl.to(u.uProgress, { value: 1, duration: 1.2, ease: "power2.inOut" });
          hold(tl);
        });
        return tl;
      }}
    />
  );
}

/* ---------- X20 · Smoke mask transition (variant of X14: a drifting fractal-noise smoke edge, thresholded) ---------- */
const SMOKE = /* glsl */ `${NOISE}
void main() {
  float asp = uRes.x / uRes.y;
  vec2 p = vec2(vUv.x * asp, vUv.y);
  float t = uTime;
  vec2 q = vec2(fbm(p * 2.2 + vec2(0.0, t * 0.25)), fbm(p * 2.2 + vec2(5.2, 1.3) - t * 0.2));
  float n = fbm(p * 2.6 + q * 1.7 + vec2(t * 0.08, -t * 0.12));
  float rad = length(p - vec2(asp * 0.5, 0.42)) / length(vec2(asp * 0.5, 0.58));
  float s = n * 0.75 + (1.0 - rad) * 0.5;
  float th = 1.4 - uProgress * 1.8;
  float mask = smoothstep(th - 0.07, th + 0.07, s);
  float haze = smoothstep(th - 0.3, th, s) * (1.0 - mask);
  vec3 col = mix(fromPage(vUv), toPage(vUv), mask);
  col = mix(col, vec3(0.93, 0.92, 0.96), haze * 0.6);
  gl_FragColor = vec4(col, 1.0);
}`;
function X20() {
  return (
    <GLSwap
      pair={BRANDS.kiln}
      frag={SMOKE}
      g1="rgba(255,190,120,.42)"
      play={(u) => {
        const tl = gsap.timeline({ repeat: -1 });
        [0, 1].forEach((k) => {
          tl.set(u.uFlip, { value: k });
          tl.set(u.uProgress, { value: 0 });
          tl.to(u.uProgress, { value: 1, duration: 1.3, ease: "power1.inOut" });
          hold(tl);
        });
        return tl;
      }}
    />
  );
}

/* ---------- X21 · Noise dissolve burn (variant of X8: a coloured veil over the next view burns away with a bright rim) ---------- */
const BURN = /* glsl */ `${NOISE}
void main() {
  float asp = uRes.x / uRes.y;
  vec2 p = vec2(vUv.x * asp, vUv.y);
  float n = fbm(p * 3.4 + vec2(uTime * 0.02, 0.0));
  float covered = step(vUv.y, uCover);
  float th = mix(0.12, 0.88, uBurn);
  float e = n - th;
  float veil = smoothstep(0.0, 0.008, e) * covered;
  float rim = (1.0 - smoothstep(0.0, 0.05, e)) * step(0.0, e) * step(0.001, uBurn) * covered;
  float charr = (1.0 - smoothstep(0.0, 0.12, e)) * step(0.001, uBurn);
  vec3 base = covered > 0.5 ? toPage(vUv) : fromPage(vUv);
  vec3 veilCol = uVeil * (0.8 + 0.4 * n) * (1.0 - charr * 0.55);
  vec3 col = mix(base, veilCol, veil) + rim * vec3(1.0, 0.72, 0.28) * 1.4;
  gl_FragColor = vec4(col, 1.0);
}`;
const X21_VEILS = [
  [0.18, 0.47, 1.0],
  [0.93, 0.36, 0.2],
];
function X21() {
  return (
    <GLSwap
      pair={BRANDS.velo}
      frag={BURN}
      g1="rgba(47,140,255,.42)"
      play={(u) => {
        const tl = gsap.timeline({ repeat: -1 });
        [0, 1].forEach((k) => {
          tl.set(u.uFlip, { value: k });
          tl.set(u.uCover, { value: 0 });
          tl.set(u.uBurn, { value: 0 });
          tl.call(() => (u.uVeil.value = X21_VEILS[k]));
          tl.to(u.uCover, { value: 1, duration: 0.45, ease: "power2.inOut" });
          tl.to(u.uBurn, { value: 1, duration: 1.3, ease: "power1.inOut" });
          hold(tl);
        });
        return tl;
      }}
    />
  );
}

/* ---------- DOM transitions (X22–X26) ---------- */

/** Page A in flow-ish (absolute, visible), page B hidden in the markup (so ?static=1 shows ONE page). */
function TwoPages({ pair, hiddenB }: { pair: [PageData, PageData]; hiddenB: CSSProperties }) {
  return (
    <>
      <div data-page="0" className="absolute inset-0" style={{ zIndex: 2 }}>
        <MiniPage v={pair[0]} />
      </div>
      <div data-page="1" className="absolute inset-0" style={{ zIndex: 1, ...hiddenB }}>
        <MiniPage v={pair[1]} />
      </div>
    </>
  );
}
const pages = (el: HTMLElement) => [el.querySelector<HTMLElement>('[data-page="0"]')!, el.querySelector<HTMLElement>('[data-page="1"]')!];

/* X22 · Feathered gradient mask wipe (variant of X7): a wide soft gradient edge slides across, 4 directions */
const X22_DIRS = [
  { label: "left to right", ang: "90deg", axis: "x", from: 100, to: 0 },
  { label: "right to left", ang: "270deg", axis: "x", from: 0, to: 100 },
  { label: "top to bottom", ang: "180deg", axis: "y", from: 100, to: 0 },
  { label: "bottom to top", ang: "0deg", axis: "y", from: 0, to: 100 },
] as const;
function setMask(el: HTMLElement, img: string, size: string, pos: string) {
  for (const pre of ["", "-webkit-"]) {
    el.style.setProperty(`${pre}mask-image`, img);
    el.style.setProperty(`${pre}mask-size`, size);
    el.style.setProperty(`${pre}mask-position`, pos);
    el.style.setProperty(`${pre}mask-repeat`, "no-repeat");
  }
}
function X22() {
  const root = useRef<HTMLDivElement>(null);
  const chip = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const [a, b] = pages(el);
    const pg = [a, b];
    const tl = gsap.timeline({ repeat: -1 });
    X22_DIRS.forEach((d, k) => {
      const inc = pg[(k + 1) % 2];
      const out = pg[k % 2];
      const img = `linear-gradient(${d.ang}, #000 44%, transparent 56%)`;
      const size = d.axis === "x" ? "300% 100%" : "100% 300%";
      const at = (v: number) => (d.axis === "x" ? `${v}% 0%` : `0% ${v}%`);
      const proxy = { p: d.from };
      tl.call(() => {
        setMask(inc, img, size, at(d.from));
        inc.style.zIndex = "2";
        out.style.zIndex = "1";
        inc.style.visibility = "visible";
        if (chip.current) chip.current.textContent = `Wipe · ${d.label}`;
      });
      tl.fromTo(proxy, { p: d.from }, { p: d.to, duration: 1.1, ease: "power2.inOut", immediateRender: false, onUpdate: () => setMask(inc, img, size, at(proxy.p)) });
      hold(tl);
    });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(125,227,200,.4)">
      <TwoPages pair={BRANDS.salt} hiddenB={{ visibility: "hidden" }} />
      <div ref={chip} className="b3g2t-chip">
        Wipe · left to right
      </div>
    </Stage>
  );
}

/* X23 · Iris from the click point (variant of X6): a circle grows from the clicked button; the real click works too */
function X23() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const jump = useRef<(k: number, x: number, y: number) => void>(() => {});
  usePlay(root, (el) => {
    const pg = pages(el);
    const ease = CustomEase.create("x23iris", "M0,0 C0.5,0 0.15,1 1,1");
    const origin = { x: 0, y: 0 };
    const box = () => el.getBoundingClientRect();
    const ctaAt = (page: HTMLElement) => {
      const r = page.querySelector<HTMLElement>("[data-cta]")!.getBoundingClientRect();
      const b = box();
      return { x: r.left + r.width / 2 - b.left, y: r.top + r.height / 2 - b.top };
    };
    const clip = (inc: HTMLElement, out: HTMLElement, p: number) => {
      const b = box();
      const R = Math.max(Math.hypot(origin.x, origin.y), Math.hypot(b.width - origin.x, origin.y), Math.hypot(origin.x, b.height - origin.y), Math.hypot(b.width - origin.x, b.height - origin.y));
      inc.style.zIndex = "2";
      out.style.zIndex = "1";
      inc.style.clipPath = `circle(${(R * p).toFixed(1)}px at ${origin.x.toFixed(1)}px ${origin.y.toFixed(1)}px)`;
    };
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(dot.current, { opacity: 1, x: () => box().width * 0.62, y: () => box().height * 0.8 });
    [0, 1].forEach((k) => {
      const out = pg[k];
      const inc = pg[1 - k];
      tl.to(dot.current, { x: () => ctaAt(out).x, y: () => ctaAt(out).y, duration: 0.6, ease: "power2.inOut" });
      tl.to(dot.current, { scale: 0.6, duration: 0.09, yoyo: true, repeat: 1, ease: "power1.inOut" });
      tl.call(() => {
        const c = ctaAt(out);
        origin.x = c.x;
        origin.y = c.y;
      });
      tl.addLabel(`iris${k}`);
      const proxy = { p: 0 };
      tl.fromTo(proxy, { p: 0 }, { p: 1, duration: 1, ease, immediateRender: false, onUpdate: () => clip(inc, out, proxy.p) });
      hold(tl, 0.2);
    });
    // a real click on a page's button: the iris grows from the exact pointer point
    jump.current = (k, x, y) => {
      if (k !== (tl.time() < tl.labels.iris1 ? 0 : 1)) return;
      origin.x = x;
      origin.y = y;
      gsap.set(dot.current, { x, y });
      tl.seek(`iris${k}`);
    };
    return tl;
  });
  const onClick = (k: number) => (e: ReactMouseEvent<HTMLDivElement>) => {
    const btn = (e.target as HTMLElement).closest("[data-cta]");
    if (!btn || !root.current) return;
    const b = root.current.getBoundingClientRect();
    jump.current(k, e.clientX - b.left, e.clientY - b.top);
  };
  const [A, B] = BRANDS.tea;
  return (
    <Stage r={root} g1="rgba(255,77,109,.4)">
      <div data-page="0" className="absolute inset-0" style={{ zIndex: 2 }} onClick={onClick(0)}>
        <MiniPage v={A} />
      </div>
      <div data-page="1" className="absolute inset-0" style={{ zIndex: 1, clipPath: "circle(0px at 50% 50%)" }} onClick={onClick(1)}>
        <MiniPage v={B} />
      </div>
      <div ref={dot} className="b3g2t-dot" aria-hidden />
    </Stage>
  );
}

/* X24 · Centre-slit page reveal (variant of M5): a vertical slit opens sideways while the page inside settles 1.15 → 1 */
function X24() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const pg = pages(el);
    const tl = gsap.timeline({ repeat: -1 });
    [0, 1].forEach((k) => {
      const out = pg[k];
      const inc = pg[1 - k];
      const inner = inc.firstElementChild as HTMLElement;
      tl.call(() => {
        inc.style.zIndex = "2";
        out.style.zIndex = "1";
      });
      tl.fromTo(inc, { clipPath: "inset(0% 50% 0% 50%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, ease: "expo.inOut", immediateRender: false });
      tl.fromTo(inner, { scale: 1.15 }, { scale: 1, duration: 1.1, ease: "expo.inOut", immediateRender: false }, "<");
      hold(tl);
    });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(47,140,255,.42)">
      <TwoPages pair={BRANDS.velo} hiddenB={{ clipPath: "inset(0% 50% 0% 50%)" }} />
    </Stage>
  );
}

/* X25 · Solid panel sweep-through (variant of X2): one brand-colour panel crosses the frame, content swaps under it */
const X25_DIRS = [
  { label: "to right", from: { xPercent: -100, yPercent: 0 }, to: { xPercent: 100, yPercent: 0 } },
  { label: "to left", from: { xPercent: 100, yPercent: 0 }, to: { xPercent: -100, yPercent: 0 } },
  { label: "to top", from: { xPercent: 0, yPercent: 100 }, to: { xPercent: 0, yPercent: -100 } },
  { label: "to bottom", from: { xPercent: 0, yPercent: -100 }, to: { xPercent: 0, yPercent: 100 } },
];
function X25() {
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const chip = useRef<HTMLDivElement>(null);
  const pair = BRANDS.tea;
  usePlay(root, (el) => {
    const pg = pages(el);
    const p = panel.current!;
    const tl = gsap.timeline({ repeat: -1 });
    X25_DIRS.forEach((d, k) => {
      const out = pg[k % 2];
      const inc = pg[(k + 1) % 2];
      tl.set(p, { ...d.from, autoAlpha: 1, backgroundColor: k % 2 ? "#ff4d6d" : "#ffb36b" });
      tl.call(() => {
        if (chip.current) chip.current.textContent = `Sweep · ${d.label}`;
      });
      tl.to(p, { xPercent: 0, yPercent: 0, duration: 0.5, ease: "power3.inOut" });
      tl.set(inc, { autoAlpha: 1 });
      tl.set(out, { autoAlpha: 0 });
      tl.to({}, { duration: 0.15 });
      tl.to(p, { ...d.to, duration: 0.5, ease: "power3.inOut" });
      hold(tl);
    });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,77,109,.4)">
      <TwoPages pair={pair} hiddenB={{ visibility: "hidden" }} />
      <div ref={panel} className="absolute inset-0 z-10 grid place-items-center bg-[#ffb36b] text-[#1a0b12]" style={{ visibility: "hidden" }} aria-hidden>
        <span className="text-[clamp(44px,5vw,84px)] font-[500] tracking-[-0.02em]" style={{ fontFamily: SERIF }}>
          Amberleaf
        </span>
      </div>
      <div ref={chip} className="b3g2t-chip">
        Sweep · to right
      </div>
    </Stage>
  );
}

/* X26 · Multi-layer page reveal (variant of X25): three colour layers wipe in staggered, swap, and leave in the same order */
const X26_DIRS = ["from top", "from side", "from corner"] as const;
const X26_COLS = ["#e0913f", "#f6e9dc", "#1c1410"];
function X26() {
  const root = useRef<HTMLDivElement>(null);
  const chip = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const pg = pages(el);
    const layers = Array.from(el.querySelectorAll<HTMLElement>("[data-layer]"));
    const b = el.getBoundingClientRect();
    const W = b.width;
    const H = b.height;
    const L = (W + H) / Math.SQRT2;
    const D = (W + H) / 2;
    const geo = (dir: (typeof X26_DIRS)[number]) =>
      dir === "from corner"
        ? { start: { x: -D, y: -D }, end: { x: D, y: D }, box: { left: (W - L) / 2, top: (H - L) / 2, width: L, height: L, rotation: 45 } }
        : dir === "from top"
          ? { start: { x: 0, y: -H }, end: { x: 0, y: H }, box: { left: 0, top: 0, width: W, height: H, rotation: 0 } }
          : { start: { x: -W, y: 0 }, end: { x: W, y: 0 }, box: { left: 0, top: 0, width: W, height: H, rotation: 0 } };
    const tl = gsap.timeline({ repeat: -1 });
    for (let k = 0; k < 6; k++) {
      const dir = X26_DIRS[k % 3];
      const g = geo(dir);
      const out = pg[k % 2];
      const inc = pg[(k + 1) % 2];
      tl.set(layers, { ...g.box, ...g.start, autoAlpha: 1 });
      // entering: the first layer is at the bottom, the last on top (three colour bands slide in)
      layers.forEach((l, i) => tl.set(l, { zIndex: 10 + i }));
      tl.call(() => {
        if (chip.current) chip.current.textContent = `Layers · ${dir}`;
      });
      tl.to(layers, { x: 0, y: 0, duration: 0.6, ease: "power3.inOut", stagger: 0.1 });
      tl.set(inc, { autoAlpha: 1 });
      tl.set(out, { autoAlpha: 0 });
      // leaving in the same order: restack so the first layer is now on top and each colour shows as it goes
      layers.forEach((l, i) => tl.set(l, { zIndex: 12 - i }));
      tl.to(layers, { ...g.end, duration: 0.6, ease: "power3.inOut", stagger: 0.1 }, "+=0.08");
      hold(tl, 0.25);
    }
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(224,145,63,.42)">
      <TwoPages pair={BRANDS.kiln} hiddenB={{ visibility: "hidden" }} />
      {X26_COLS.map((c, i) => (
        <div key={c} data-layer={i} className="absolute left-0 top-0 h-full w-full" style={{ background: c, visibility: "hidden", zIndex: 10 + i }} aria-hidden />
      ))}
      <div ref={chip} className="b3g2t-chip">
        Layers · from top
      </div>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "X19", name: "Organic distortion mask", how: "A noisy-edged mask grows from one point to uncover the next page while the outgoing page warps, peaking mid-way (WebGL).", kind: "play", C: X19 },
  { code: "X20", name: "Smoke mask transition", how: "The next page appears through billowing smoke: drifting fractal noise thresholded by a rising cutoff (WebGL).", kind: "play", C: X20 },
  { code: "X21", name: "Noise dissolve burn", how: "A colour veil rises over the page, then burns away in noise holes with a bright ember rim to show the next page (WebGL).", kind: "play", C: X21 },
  { code: "X22", name: "Feathered gradient mask wipe", how: "A wide soft gradient mask slides across so the next page dissolves in along a feathered edge (4 directions).", kind: "play", C: X22 },
  { code: "X23", name: "Iris from the click point", how: "Clicking a button grows a circle from that exact point until the next page fills the frame (scripted click while filming).", kind: "play", C: X23 },
  { code: "X24", name: "Centre-slit page reveal", how: "The next page opens from a thin vertical slit in the centre to full width while its content settles from 1.15 to 1.", kind: "play", C: X24 },
  { code: "X25", name: "Solid panel sweep-through", how: "A brand-colour panel sweeps in to cover the frame, the page swaps underneath, and it carries on off the far edge (4 directions).", kind: "play", C: X25 },
  { code: "X26", name: "Multi-layer page reveal", how: "Three colour layers wipe in one after another, the page swaps, then they leave in the same order (top, side, corner).", kind: "play", C: X26 },
];
