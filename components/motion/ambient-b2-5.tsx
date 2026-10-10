"use client";

// Ambient motions, batch 2 · group 5 (MOTION-MENU M183–M194). Small focused demos for /lab/motion.
// Shader demos (M183–M191) draw one OGL canvas over a CSS-gradient fallback; lib/gl pauses them off screen and the
// fallback stays in ?static=1 / reduced motion. M192 is CSS only, M193–M194 are GSAP loops that start on screen.
// Every demo also has a CSS-only glow loop that never stops (and stops in ?static=1 / reduced motion).
import { useEffect, useRef, type RefObject } from "react";
import { createShader, type GLHandle } from "@/lib/gl";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { scene, toCanvas } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const GROTESK = "'Space Grotesk Variable', system-ui, sans-serif";
const SERIF = "'Fraunces Variable', Georgia, serif";
const EDITORIAL = "'Instrument Serif', Georgia, serif";
const WIDE = "'Syne Variable', 'Space Grotesk Variable', system-ui, sans-serif";
const MANROPE = "'Manrope Variable', system-ui, sans-serif";

/* ---------- shared helpers ---------- */

/** A soft radial glow that drifts forever (CSS only, scoped to one code), stopped in ?static=1 / reduced motion. */
function Glow({ code, color, at = "50% 45%", blend = false }: { code: string; color: string; at?: string; blend?: boolean }) {
  const c = `${code}-glow`;
  const css = `.${c}{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(circle at ${at},${color} 0%,transparent 52%);animation:${c} 4.8s linear infinite alternate;will-change:transform${blend ? ";mix-blend-mode:screen" : ""}}
@keyframes ${c}{0%{transform:translate3d(-9%,-5%,0) scale(1)}100%{transform:translate3d(9%,6%,0) scale(1.18)}}
html.is-static .${c}{animation:none}html.is-static {.${c}{animation:none}}`;
  return (
    <>
      <style>{css}</style>
      <div className={c} aria-hidden />
    </>
  );
}

/** Play: a looping timeline that starts when the demo is on screen and pauses off screen. Reduced motion → `final`. */
function usePlay(root: RefObject<HTMLDivElement | null>, build: (el: HTMLDivElement) => gsap.core.Timeline, final?: (el: HTMLDivElement) => void) {
  const fn = useRef(build);
  fn.current = build;
  const fin = useRef(final);
  fin.current = final;
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      const ctx = gsap.context(() => fin.current?.(el), el);
      return () => ctx.revert();
    }
    let tl: gsap.core.Timeline | null = null;
    const ctx = gsap.context(() => {
      tl = fn.current(el);
      tl.pause();
    }, el);
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? tl?.play() : tl?.pause()), { threshold: 0.15 });
    io.observe(el);
    return () => {
      io.disconnect();
      ctx.revert();
    };
  }, [root]);
}

type Uniforms = Record<string, { value: unknown }>;

/**
 * One OGL canvas (dpr 1) over a CSS fallback. The canvas fades in after its first frame; lib/gl only draws while on
 * screen, so the loop pauses off screen. Reduced motion / ?static=1: no WebGL, the fallback stays.
 */
function Shader({
  frag,
  fallback,
  textures,
  onFrame,
}: {
  frag: string;
  fallback: string;
  textures?: (box: HTMLDivElement) => Promise<TexImageSource[]>;
  onFrame?: (u: Uniforms, t: number) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const tx = useRef(textures);
  tx.current = textures;
  const of = useRef(onFrame);
  of.current = onFrame;
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let dead = false;
    let h: GLHandle | null = null;
    (async () => {
      const tex = tx.current && box.current ? await tx.current(box.current) : [];
      if (dead || !cv.current) return;
      h = await createShader(cv.current, frag, { textures: tex, dpr: 1, onFrame: (u, t) => of.current?.(u, t) });
      if (dead) h?.destroy();
    })();
    return () => {
      dead = true;
      h?.destroy();
    };
  }, [frag]);
  return (
    <div ref={box} className="absolute inset-0" style={{ background: fallback }}>
      <canvas ref={cv} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500" aria-hidden />
    </div>
  );
}

/* Our own small GLSL noise kit (hash → value noise → fbm, plus a 2D cell distance). */
const NOISE = /* glsl */ `
float h21(vec2 p) { p = fract(p * vec2(233.34, 851.73)); p += dot(p, p + 23.45); return fract(p.x * p.y); }
vec2 h22(vec2 p) { float n = h21(p); return vec2(n, h21(p + n + 17.0)); }
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
`;

/* ---------- M183 · Silk folds (variant of M52: lit folded bands with rolling highlights, not soft colour blobs) ---------- */
const SILK = /* glsl */ `${NOISE}
float silk(vec2 p, float t) {
  vec2 q = mat2(0.78, -0.62, 0.62, 0.78) * p;
  float w = fbm(q * 1.1 + vec2(t * 0.05, -t * 0.03));
  return sin(q.x * 4.6 + sin(q.y * 2.1 + t * 0.32) * 1.6 + w * 3.4 + t * 0.38) * 0.75
       + sin(q.x * 8.5 - q.y * 1.4 + w * 2.2 - t * 0.22) * 0.18;
}
void main() {
  float asp = uRes.x / uRes.y;
  vec2 p = vec2(vUv.x * asp, vUv.y);
  float t = uTime;
  float e = 0.004;
  float h = silk(p, t);
  float hx = silk(p + vec2(e, 0.0), t);
  float hy = silk(p + vec2(0.0, e), t);
  vec3 n = normalize(vec3((h - hx) / e * 0.11, (h - hy) / e * 0.11, 1.0));
  vec3 L = normalize(vec3(-0.55, 0.6, 0.65));
  float dif = clamp(dot(n, L), 0.0, 1.0);
  float spec = pow(clamp(dot(n, normalize(L + vec3(0.0, 0.0, 1.0))), 0.0, 1.0), 38.0);
  vec3 col = mix(vec3(0.035, 0.015, 0.03), vec3(0.3, 0.08, 0.14), dif * dif);
  col += spec * vec3(1.0, 0.86, 0.7) * 0.8 + pow(dif, 8.0) * vec3(0.4, 0.2, 0.22);
  col *= 0.5 + 0.5 * smoothstep(1.1, 0.15, length(vUv - vec2(0.62, 0.5)));
  gl_FragColor = vec4(col, 1.0);
}`;
function M183() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[24px] bg-[#0b0408]">
      <Shader frag={SILK} fallback="linear-gradient(125deg,#0b0408 0%,#4a1424 38%,#12060b 52%,#6b2a34 70%,#0b0408 100%)" />
      <Glow code="m183" color="rgba(255,190,150,.35)" at="62% 42%" blend />
      <div className="pointer-events-none absolute bottom-[10%] left-[6%] max-w-[44%] text-[#f8e9dc]">
        <p className="text-[13px] uppercase tracking-[0.24em] opacity-70">Maison Velour · Autumn</p>
        <h3 className="mt-3 text-[clamp(44px,5.4vw,88px)] leading-[0.92]" style={{ fontFamily: EDITORIAL }}>
          Draped in midnight.
        </h3>
        <p className="mt-4 text-[15px] opacity-75">Mulberry silk slip · ₹ 18,900</p>
      </div>
    </div>
  );
}

/* ---------- M184 · Caustic light ---------- */
const CAUSTIC = /* glsl */ `${NOISE}
float edge(vec2 p, float t) {
  vec2 i = floor(p), f = fract(p);
  float d1 = 8.0, d2 = 8.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y));
    vec2 o = 0.5 + 0.42 * sin(t * 0.55 + 6.2831 * h22(i + g));
    float d = length(g + o - f);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
  }
  return d2 - d1;
}
void main() {
  float asp = uRes.x / uRes.y;
  float t = uTime;
  vec2 p = vec2(vUv.x * asp, vUv.y) * 3.4;
  p += (vec2(fbm(p * 0.6 + t * 0.08), fbm(p * 0.6 - t * 0.07 + 4.0)) - 0.5) * 0.9;
  float c = pow(clamp(1.0 - edge(p, t) * 3.2, 0.0, 1.0), 5.0);
  c += 0.55 * pow(clamp(1.0 - edge(p * 1.8 + 3.1, t * 1.25) * 3.2, 0.0, 1.0), 5.0);
  vec3 base = mix(vec3(0.02, 0.13, 0.17), vec3(0.04, 0.34, 0.37), smoothstep(0.0, 1.0, vUv.y));
  base *= 0.75 + 0.35 * fbm(p * 0.35 + t * 0.03);
  vec3 col = base + c * vec3(0.72, 1.0, 0.94) * 0.95;
  col += 0.15 * smoothstep(0.7, 0.0, length(vUv - vec2(0.68, 0.55)));
  gl_FragColor = vec4(col, 1.0);
}`;
function M184() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[24px] bg-[#04161b]">
      <Shader frag={CAUSTIC} fallback="radial-gradient(circle at 68% 50%,#1d6e6c 0%,#0a3a40 45%,#04161b 100%)" />
      <Glow code="m184" color="rgba(140,255,230,.35)" at="68% 50%" blend />
      <div className="pointer-events-none absolute left-[6%] top-1/2 max-w-[42%] -translate-y-1/2 text-[#eafffb]">
        <p className="text-[13px] uppercase tracking-[0.24em] opacity-70">Tidepool Skin · No. 04</p>
        <h3 className="mt-3 text-[clamp(44px,5.2vw,84px)] font-[600] leading-[0.95] tracking-[-0.02em]" style={{ fontFamily: SERIF }}>
          Light, under water.
        </h3>
        <p className="mt-4 text-[15px] opacity-75">Lagoon Serum · 30 ml · ₹ 2,450</p>
      </div>
    </div>
  );
}

/* ---------- M185 · Leaf-shadow sunlight ---------- */
const LEAVES = /* glsl */ `${NOISE}
float leaves(vec2 p, float t) {
  p += vec2(sin(t * 0.7 + p.y * 1.6) * 0.035, cos(t * 0.55 + p.x * 1.2) * 0.022);
  float n = fbm(p * 2.6 + vec2(sin(t * 0.3) * 0.12, t * 0.015));
  float n2 = vnoise(p * 8.0 + vec2(t * 0.08, 0.0));
  return smoothstep(0.5, 0.66, n + n2 * 0.12);
}
void main() {
  float asp = uRes.x / uRes.y;
  float t = uTime;
  vec2 p = vec2(vUv.x * asp, vUv.y);
  vec2 q = mat2(0.86, 0.5, -0.5, 0.86) * p;
  float slat = fract(q.y * 6.5 + sin(t * 0.25) * 0.04);
  float blind = smoothstep(0.22, 0.4, slat) * smoothstep(0.98, 0.8, slat);
  float win = smoothstep(0.05, 0.28, q.x - 0.2) * smoothstep(1.55, 1.2, q.x);
  float lf = leaves(p, t);
  float lit = win * blind * (1.0 - lf * 0.9);
  vec3 wall = vec3(0.62, 0.5, 0.4) * (0.9 + 0.1 * vnoise(p * 60.0));
  vec3 sun = vec3(1.0, 0.86, 0.62);
  vec3 col = wall * (0.72 + lit * 0.55) + sun * lit * 0.22;
  col = mix(col, col * vec3(1.05, 0.95, 0.85), 0.3);
  gl_FragColor = vec4(col, 1.0);
}`;
function M185() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[24px] bg-[#9c8068]">
      <Shader frag={LEAVES} fallback="linear-gradient(120deg,#8e7360 0%,#c9ab8a 40%,#e5c79f 55%,#8e7360 100%)" />
      <Glow code="m185" color="rgba(255,214,150,.35)" at="62% 40%" blend />
      <div className="pointer-events-none absolute bottom-[10%] left-[6%] max-w-[44%] text-[#2b1a10]">
        <p className="text-[13px] font-[600] uppercase tracking-[0.24em] opacity-75">Slow Clay Studio</p>
        <h3 className="mt-3 text-[clamp(44px,5.2vw,84px)] font-[500] leading-[0.95] tracking-[-0.02em]" style={{ fontFamily: SERIF }}>
          Made for slow mornings.
        </h3>
        <p className="mt-4 text-[15px] font-[600] opacity-80">Ash-glaze mug · ₹ 1,650</p>
      </div>
    </div>
  );
}

/* ---------- M186 · Fluted glass (variant of M52: the colour field is seen through refracting vertical ribs) ---------- */
const FLUTED = /* glsl */ `${NOISE}
vec3 field(vec2 uv, float t) {
  float n1 = fbm(uv * 1.3 + vec2(t * 0.07, 0.0));
  float n2 = fbm(uv * 1.7 - vec2(0.0, t * 0.06) + 5.0);
  vec3 col = mix(vec3(1.0, 0.4, 0.16), vec3(0.3, 0.2, 0.92), smoothstep(0.3, 0.7, n1));
  col = mix(col, vec3(0.99, 0.84, 0.52), smoothstep(0.45, 0.75, n2) * 0.75);
  col += 0.28 * exp(-pow((uv.x - (fract(t * 0.05) * 2.6 - 0.4)) * 2.6, 2.0));
  return col;
}
void main() {
  float asp = uRes.x / uRes.y;
  float t = uTime;
  float N = 26.0;
  float x = vUv.x * N;
  float r = fract(x);
  float id = floor(x);
  vec2 uv = vUv;
  uv.x += (r - 0.5) * 0.1;
  uv.y += sin(id * 1.7) * 0.012;
  vec3 col = field(vec2(uv.x * asp, uv.y), t);
  col *= 0.8 + 0.28 * sin(r * 3.1416);
  col += 0.16 * smoothstep(0.86, 0.98, r) + 0.1 * pow(max(0.0, 1.0 - abs(r - 0.3) * 3.0), 6.0);
  col *= 1.0 - 0.35 * smoothstep(0.06, 0.0, r);
  gl_FragColor = vec4(col, 1.0);
}`;
function M186() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[24px] bg-[#2a1550]">
      <Shader
        frag={FLUTED}
        fallback="repeating-linear-gradient(90deg,rgba(255,255,255,.12) 0 2px,transparent 2px 54px),linear-gradient(110deg,#ff6a2b 0%,#fdd685 40%,#4d33e8 100%)"
      />
      <Glow code="m186" color="rgba(255,236,200,.35)" at="40% 45%" blend />
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center text-white">
        <div>
          <p className="text-[13px] font-[600] uppercase tracking-[0.3em] [text-shadow:0_2px_14px_rgba(0,0,0,.35)]">Prism House · Lighting</p>
          <h3 className="mt-3 text-[clamp(56px,7.4vw,124px)] font-[800] leading-[0.9] tracking-[-0.04em] [text-shadow:0_6px_40px_rgba(30,10,60,.45)]" style={{ fontFamily: WIDE }}>
            Ribbed light
          </h3>
          <p className="mt-4 text-[15px] font-[600] [text-shadow:0_2px_14px_rgba(0,0,0,.4)]">Flute pendant · ₹ 14,200</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- M187 · Water surface shimmer ---------- */
const WATER = /* glsl */ `${NOISE}
float wave(vec2 p, float t) { return fbm(p * 2.4 + vec2(t * 0.12, t * 0.08)) + 0.5 * fbm(p * 4.6 - vec2(t * 0.1, -t * 0.15) + 3.0); }
void main() {
  float asp = uRes.x / uRes.y;
  float t = uTime;
  vec2 p = vec2(vUv.x * asp, vUv.y);
  float e = 0.003;
  float h = wave(p, t);
  vec3 n = normalize(vec3((h - wave(p + vec2(e, 0.0), t)) / e * 0.045, (h - wave(p + vec2(0.0, e), t)) / e * 0.045, 1.0));
  vec3 deep = mix(vec3(0.01, 0.1, 0.14), vec3(0.03, 0.32, 0.36), fbm(p * 0.8 + t * 0.02));
  deep *= 0.85 + 0.3 * smoothstep(1.0, 0.0, length(vUv - vec2(0.5, 0.6)));
  vec3 L = normalize(vec3(0.35, 0.45, 1.0));
  float d = max(dot(n, L), 0.0);
  float spec = pow(d, 180.0);
  float glint = pow(d, 900.0);
  vec3 col = deep + n.x * 0.06 + spec * vec3(0.85, 1.0, 1.0) * 0.9 + glint * 2.2;
  gl_FragColor = vec4(col, 1.0);
}`;
function M187() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[24px] bg-[#031a1f]">
      <Shader frag={WATER} fallback="radial-gradient(circle at 50% 40%,#0c5458 0%,#06303a 50%,#031a1f 100%)" />
      <Glow code="m187" color="rgba(150,255,245,.35)" at="45% 40%" blend />
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center text-[#f1fffd]">
        <div>
          <p className="text-[13px] uppercase tracking-[0.3em] opacity-75">Stillwater Spa · Coorg</p>
          <h3 className="mt-3 text-[clamp(52px,6.6vw,110px)] leading-[0.92]" style={{ fontFamily: EDITORIAL }}>
            Breathe below the surface.
          </h3>
          <p className="mt-4 text-[15px] opacity-80">90-min float ritual · ₹ 6,500</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- M188 · Raindrops on glass (2D drop sim → refraction map → WebGL) ---------- */
const RAIN = /* glsl */ `
void main() {
  vec4 d = texture2D(uTex1, vUv);
  float m = smoothstep(0.12, 0.55, d.b);
  vec2 n = (d.rg - 0.5) * 2.0;
  vec2 base = (vUv - 0.5) * 0.94 + 0.5 + vec2(sin(uTime * 0.07) * 0.02, cos(uTime * 0.05) * 0.01);
  vec3 blur = texture2D(uTex0, cover(base, uTexRes0)).rgb * 0.78;
  vec2 off = vec2(-n.x, n.y) * 0.16;
  vec3 sharp = texture2D(uTex2, cover(base + off, uTexRes2)).rgb;
  float shade = 1.0 - 0.45 * pow(length(n), 3.0);
  float spec = smoothstep(0.55, 0.9, dot(n, vec2(-0.7, -0.7)));
  vec3 col = mix(blur, sharp * shade * 1.08, m) + spec * 0.4 * m;
  gl_FragColor = vec4(col, 1.0);
}`;
type Drop = { x: number; y: number; r: number; vy: number; trail: number };
function dropSprite(size = 64) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const dx = ((x + 0.5) / size) * 2 - 1;
      const dy = ((y + 0.5) / size) * 2 - 1;
      const d = Math.hypot(dx, dy);
      const k = (y * size + x) * 4;
      if (d >= 1) continue;
      img.data[k] = 128 + dx * 127;
      img.data[k + 1] = 128 + dy * 127;
      img.data[k + 2] = 255 * Math.min(1, (1 - d) / 0.18);
      img.data[k + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
  return c;
}
function M188() {
  const sim = useRef<{ map: HTMLCanvasElement; ctx: CanvasRenderingContext2D; sprite: HTMLCanvasElement; drops: Drop[]; last: number } | null>(null);
  const textures = async (box: HTMLDivElement) => {
    const r = box.getBoundingClientRect();
    const W = 512;
    const H = Math.max(160, Math.round((W * r.height) / Math.max(1, r.width)));
    const sharp = await toCanvas(scene(3, 1200, 760), 1200, 760);
    const sctx = sharp.getContext("2d")!;
    // city bokeh behind the glass
    for (let i = 0; i < 46; i++) {
      const x = (i * 263) % 1200;
      const y = 140 + ((i * 151) % 520);
      const rad = 14 + ((i * 37) % 34);
      const g = sctx.createRadialGradient(x, y, 0, x, y, rad);
      const hue = ["255,170,90", "255,96,120", "120,200,255", "255,226,150"][i % 4];
      g.addColorStop(0, `rgba(${hue},.95)`);
      g.addColorStop(1, `rgba(${hue},0)`);
      sctx.fillStyle = g;
      sctx.beginPath();
      sctx.arc(x, y, rad, 0, Math.PI * 2);
      sctx.fill();
    }
    const blurred = document.createElement("canvas");
    blurred.width = 600;
    blurred.height = 380;
    const bctx = blurred.getContext("2d")!;
    bctx.filter = "blur(10px)";
    bctx.drawImage(sharp, -20, -20, 640, 420);
    const map = document.createElement("canvas");
    map.width = W;
    map.height = H;
    const ctx = map.getContext("2d")!;
    ctx.fillStyle = "rgb(128,128,0)";
    ctx.fillRect(0, 0, W, H);
    sim.current = { map, ctx, sprite: dropSprite(), drops: [], last: 0 };
    return [blurred, map, sharp];
  };
  const onFrame = (u: Uniforms, t: number) => {
    const s = sim.current;
    if (!s) return;
    const dt = Math.min(0.05, Math.max(0.001, t - s.last));
    s.last = t;
    const { map, ctx, sprite, drops } = s;
    const W = map.width;
    const H = map.height;
    // spawn: fine mist + a few bigger drops
    if (Math.random() < dt * 40) drops.push({ x: Math.random() * W, y: Math.random() * H, r: 1.5 + Math.random() * 2.5, vy: 0, trail: 0 });
    if (Math.random() < dt * 5) drops.push({ x: Math.random() * W, y: Math.random() * H * 0.7, r: 4.5 + Math.random() * 6, vy: 0, trail: 0 });
    while (drops.length > 260) drops.shift();
    const born: Drop[] = [];
    for (const d of drops) {
      if (d.r > 7) {
        d.vy = Math.min(220, d.vy + (d.r - 6) * 22 * dt);
        if (Math.random() < 0.015) d.vy *= 0.25; // hesitate, like real drops
        const dy = d.vy * dt;
        d.y += dy;
        d.x += Math.sin(d.y * 0.08 + d.r) * 0.25;
        d.trail += dy;
        if (d.trail > d.r * 1.3) {
          d.trail = 0;
          born.push({ x: d.x + (Math.random() - 0.5) * 2, y: d.y - d.r * 1.2, r: d.r * (0.22 + Math.random() * 0.18), vy: 0, trail: 0 });
          d.r = Math.max(6.5, d.r * 0.985);
        }
      }
    }
    drops.push(...born);
    // merge: the bigger drop swallows the smaller one
    for (let i = 0; i < drops.length; i++) {
      const a = drops[i];
      if (a.r <= 0) continue;
      for (let j = i + 1; j < drops.length; j++) {
        const b = drops[j];
        if (b.r <= 0) continue;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const lim = (a.r + b.r) * 0.72;
        if (dx * dx + dy * dy < lim * lim) {
          const [big, small] = a.r >= b.r ? [a, b] : [b, a];
          big.r = Math.min(24, Math.hypot(big.r, small.r));
          big.vy = Math.max(big.vy, small.vy);
          small.r = 0;
        }
      }
    }
    for (let i = drops.length - 1; i >= 0; i--) if (drops[i].r <= 0 || drops[i].y - drops[i].r > H) drops.splice(i, 1);
    ctx.fillStyle = "rgb(128,128,0)";
    ctx.fillRect(0, 0, W, H);
    for (const d of drops) {
      const stretch = 1 + Math.min(0.35, d.vy / 400);
      ctx.drawImage(sprite, d.x - d.r, d.y - d.r * stretch, d.r * 2, d.r * 2 * stretch);
    }
    (u.uTex1.value as { needsUpdate: boolean }).needsUpdate = true;
  };
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[24px] bg-[#140f07]">
      <Shader frag={RAIN} fallback="radial-gradient(circle at 30% 40%,rgba(255,170,90,.55),transparent 35%),radial-gradient(circle at 72% 60%,rgba(120,200,255,.45),transparent 38%),#1a140c" textures={textures} onFrame={onFrame} />
      <Glow code="m188" color="rgba(255,190,120,.35)" at="35% 45%" blend />
      <div className="pointer-events-none absolute bottom-[10%] left-[6%] max-w-[46%] text-[#fff6e8]">
        <p className="text-[13px] uppercase tracking-[0.24em] opacity-75">Kettle &amp; Cloud · Monsoon edit</p>
        <h3 className="mt-3 text-[clamp(44px,5.4vw,88px)] font-[600] leading-[0.92] tracking-[-0.02em]" style={{ fontFamily: SERIF }}>
          Rainy-day roast.
        </h3>
        <p className="mt-4 text-[15px] opacity-80">Dark cardamom blend · 250 g · ₹ 690</p>
      </div>
    </div>
  );
}

/* ---------- M189 · Drifting procedural clouds (variant of M36: a whole sky of fbm clouds, framed in a plane window) ---------- */
const CLOUDS = /* glsl */ `${NOISE}
void main() {
  float asp = uRes.x / uRes.y;
  float t = uTime;
  vec3 sky = mix(vec3(1.0, 0.74, 0.56), vec3(0.32, 0.52, 0.92), smoothstep(0.0, 0.9, vUv.y));
  vec2 p = vec2(vUv.x * asp, vUv.y) * 2.2;
  p.x += t * 0.09;
  float d = fbm(p + fbm(p * 0.5 + vec2(t * 0.03, 0.0)) * 0.9);
  float c = smoothstep(0.46, 0.72, d);
  float lit = clamp((d - fbm(p + vec2(-0.06, 0.08) + fbm(p * 0.5 + vec2(t * 0.03, 0.0)) * 0.9)) * 6.0 + 0.5, 0.0, 1.0);
  vec3 cloud = mix(vec3(0.7, 0.72, 0.84), vec3(1.0, 0.95, 0.9), lit);
  vec3 col = mix(sky, cloud, c * 0.95);
  gl_FragColor = vec4(col, 1.0);
}`;
function M189() {
  return (
    <div className="relative grid h-full w-full grid-cols-[1fr_1.1fr] items-center gap-[4%] overflow-hidden rounded-[24px] bg-[#e9e3d8] px-[6%]">
      <Glow code="m189" color="rgba(255,190,140,.38)" at="70% 50%" />
      <div className="relative text-[#1f2433]">
        <p className="text-[13px] font-[600] uppercase tracking-[0.24em] opacity-70">Altair Air · Business</p>
        <h3 className="mt-3 text-[clamp(44px,5vw,82px)] font-[700] leading-[0.93] tracking-[-0.03em]" style={{ fontFamily: GROTESK }}>
          Window seat, always.
        </h3>
        <p className="mt-4 text-[15px] opacity-75">Delhi → Lisbon · from ₹ 42,000</p>
      </div>
      {/* the rounded airplane window frames the shader */}
      <div className="relative mx-auto aspect-[3/4] h-[84%] rounded-[46%/36%] bg-[#d6cfc2] p-[5%] shadow-[inset_0_8px_24px_rgba(0,0,0,.18),0_30px_60px_rgba(60,40,20,.18)]">
        <div className="relative h-full w-full overflow-hidden rounded-[46%/36%] shadow-[inset_0_0_40px_rgba(0,0,0,.35)]">
          <Shader frag={CLOUDS} fallback="radial-gradient(ellipse at 40% 70%,#fff 0%,rgba(255,255,255,0) 40%),linear-gradient(to top,#ffbd8f,#5285eb)" />
          <div className="pointer-events-none absolute inset-0 rounded-[46%/36%] bg-[linear-gradient(130deg,rgba(255,255,255,.22),transparent_40%)]" />
        </div>
      </div>
    </div>
  );
}

/* ---------- M190 · Coloured smoke plumes (variant of M36: full-frame domain-warped plumes in three tints, rising) ---------- */
const SMOKE = /* glsl */ `${NOISE}
void main() {
  float asp = uRes.x / uRes.y;
  float t = uTime;
  vec2 p = vec2(vUv.x * asp, vUv.y) * 1.6;
  vec2 q = vec2(fbm(p + vec2(0.0, -t * 0.12)), fbm(p + vec2(5.2, 1.3) - vec2(0.0, t * 0.1)));
  vec2 r = vec2(fbm(p + 3.0 * q + vec2(1.7, 9.2) - vec2(0.0, t * 0.15)), fbm(p + 3.0 * q + vec2(8.3, 2.8) - vec2(0.0, t * 0.13)));
  float f = fbm(p + 3.0 * r);
  vec3 col = mix(vec3(0.45, 0.22, 0.95), vec3(0.96, 0.24, 0.46), clamp(q.x * 1.6 - 0.2, 0.0, 1.0));
  col = mix(col, vec3(1.0, 0.62, 0.2), clamp(r.y * 1.5 - 0.45, 0.0, 1.0));
  float dens = smoothstep(0.32, 0.85, f) * (0.35 + 0.85 * (1.0 - vUv.y));
  vec3 bg = vec3(0.03, 0.02, 0.05);
  gl_FragColor = vec4(bg + col * dens * 1.15, 1.0);
}`;
function M190() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[24px] bg-[#08050d]">
      <Shader frag={SMOKE} fallback="radial-gradient(ellipse at 30% 90%,rgba(245,61,117,.6),transparent 50%),radial-gradient(ellipse at 70% 80%,rgba(255,158,51,.45),transparent 45%),radial-gradient(ellipse at 50% 40%,rgba(115,56,242,.4),transparent 55%),#08050d" />
      <Glow code="m190" color="rgba(255,120,160,.35)" at="50% 70%" blend />
      <div className="pointer-events-none absolute inset-x-0 top-[12%] text-center text-[#fff2f6]">
        <p className="text-[13px] uppercase tracking-[0.32em] opacity-75">Noor Atelier · Extrait</p>
        <h3 className="mt-3 text-[clamp(60px,8vw,132px)] font-[800] leading-[0.88] tracking-[-0.04em]" style={{ fontFamily: WIDE }}>
          Ember Oud
        </h3>
        <p className="mt-4 text-[15px] opacity-80">50 ml · ₹ 7,800</p>
      </div>
    </div>
  );
}

/* ---------- M191 · Volumetric fog bank (variant of M190: low layered fog slices at different speeds, not rising plumes) ---------- */
const FOG = /* glsl */ `${NOISE}
void main() {
  float asp = uRes.x / uRes.y;
  float t = uTime;
  float x = vUv.x * asp;
  // dusk sky + two mountain ridges (opaque background, so the fog can blend in the shader)
  vec3 col = mix(vec3(0.62, 0.55, 0.6), vec3(0.16, 0.2, 0.3), smoothstep(0.2, 1.0, vUv.y));
  float ridge1 = 0.5 + 0.12 * fbm(vec2(x * 1.4, 2.0)) - 0.06;
  float ridge2 = 0.36 + 0.1 * fbm(vec2(x * 2.2 + 7.0, 5.0));
  col = mix(col, vec3(0.3, 0.32, 0.4), smoothstep(ridge1 + 0.003, ridge1, vUv.y));
  col = mix(col, vec3(0.14, 0.16, 0.21), smoothstep(ridge2 + 0.003, ridge2, vUv.y));
  float a = 0.0;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float sc = 1.4 + fi * 1.1;
    float dir = mod(fi, 2.0) < 0.5 ? 1.0 : -0.7;
    vec2 p = vec2(x * sc + t * (0.035 + fi * 0.03) * dir, vUv.y * sc * 2.2 + fi * 3.1);
    float n = fbm(p + 0.35 * fbm(p * 0.7 + t * 0.05));
    float top = 0.46 - fi * 0.08;
    float mask = smoothstep(top + 0.12, top - 0.14, vUv.y + (n - 0.5) * 0.2);
    float d = smoothstep(0.28, 0.78, n) * mask * (0.5 + fi * 0.12);
    a += d * (1.0 - a);
  }
  a += (1.0 - a) * smoothstep(0.35, 0.0, vUv.y) * 0.35;
  col = mix(col, vec3(0.8, 0.82, 0.88), clamp(a, 0.0, 1.0));
  gl_FragColor = vec4(col, 1.0);
}`;
function M191() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[24px] bg-[#28303f]">
      <Shader frag={FOG} fallback="linear-gradient(to top,#ccd1dc 0%,#aeb3c0 22%,#262b37 40%,#4d5260 52%,#9e8c99 70%,#29334c 100%)" />
      <Glow code="m191" color="rgba(220,230,255,.35)" at="50% 75%" blend />
      <div className="pointer-events-none absolute inset-x-0 top-[10%] text-center text-[#f3f5fa]">
        <p className="text-[13px] uppercase tracking-[0.3em] opacity-75">Mistline Lodge · Munnar</p>
        <h3 className="mt-3 text-[clamp(52px,6.6vw,108px)] font-[500] leading-[0.92] tracking-[-0.02em]" style={{ fontFamily: SERIF }}>
          Wake above the fog.
        </h3>
        <p className="mt-4 text-[15px] opacity-80">Ridge suite · ₹ 24,000 a night</p>
      </div>
    </div>
  );
}

/* ---------- M192 · Rotating conic halo (variant of M37: the colours travel round the edge instead of pulsing) ---------- */
const HALO_CSS = `
.m192-spin{position:absolute;left:50%;top:50%;width:220%;aspect-ratio:1;margin-left:-110%;margin-top:-110%;background:conic-gradient(from 0deg,#ff4d6d,#ffb36b,#c8ff8a,#2f8cff,#a35bff,#ff4d6d);animation:m192-turn 5s linear infinite;animation-play-state:paused}
.m192-on .m192-spin{animation-play-state:running}
@keyframes m192-turn{to{transform:rotate(360deg)}}
.m192-halo{position:absolute;inset:-10px;overflow:hidden;filter:blur(26px);opacity:.85}
.m192-ring{position:absolute;inset:0;overflow:hidden}
html.is-static .m192-spin{animation:none}
html.is-static {.m192-spin{animation:none}}
`;
function M192() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const io = new IntersectionObserver(([e]) => el.classList.toggle("m192-on", e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={root} className="relative flex h-full w-full items-center justify-center gap-[7%] overflow-hidden rounded-[24px] bg-[#07080d]">
      <style>{HALO_CSS}</style>
      <Glow code="m192" color="rgba(163,91,255,.35)" at="40% 50%" />
      {/* 1 · blurred halo behind a product card */}
      <div className="relative h-[72%] w-[min(30%,360px)]">
        <div className="m192-halo rounded-[30px]" aria-hidden>
          <div className="m192-spin" />
        </div>
        <div className="relative flex h-full flex-col justify-between rounded-[26px] bg-[#0d0f17] p-[9%] text-white">
          <p className="text-[13px] uppercase tracking-[0.24em] text-white/60">Orbit Buds · Gen 3</p>
          <div className="mx-auto aspect-square w-[62%] rounded-full bg-[radial-gradient(circle_at_35%_30%,#f4f6ff,#8d93a8_45%,#1a1d29_75%)] shadow-[0_30px_60px_rgba(0,0,0,.6)]" />
          <div>
            <p className="text-[clamp(26px,2.4vw,38px)] font-[700] leading-none tracking-[-0.02em]" style={{ fontFamily: GROTESK }}>
              Hear the halo.
            </p>
            <p className="mt-2 text-[15px] text-white/65">₹ 12,990 · ANC · 40 h</p>
          </div>
        </div>
      </div>
      {/* 2 · neon variant: a sharp spinning border with a blurred copy behind */}
      <div className="flex flex-col items-start gap-6">
        <p className="max-w-[22ch] text-[clamp(30px,3vw,48px)] leading-[1] text-white" style={{ fontFamily: EDITORIAL }}>
          Colour that circles the edge.
        </p>
        <div className="relative rounded-full">
          <div className="m192-halo rounded-full" style={{ inset: "-4px", filter: "blur(16px)" }} aria-hidden>
            <div className="m192-spin" />
          </div>
          <div className="m192-ring rounded-full" aria-hidden>
            <div className="m192-spin" />
          </div>
          <span className="relative m-[2px] block rounded-full bg-[#0b0c12] px-9 py-4 text-[17px] font-[700] text-white" style={{ fontFamily: MANROPE }}>
            Pre-order · ₹ 12,990
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------- M193 · Lamp switches on over heading (variant of M61: one switch-on beat, not swaying rays) ---------- */
const LAMP_L =
  "conic-gradient(from 180deg at 100% 0%, transparent 0deg, rgba(78,225,255,.12) 25deg, rgba(78,225,255,.85) 86deg, transparent 90deg)";
const LAMP_R =
  "conic-gradient(from 90deg at 0% 0%, transparent 0deg, rgba(78,225,255,.85) 4deg, rgba(78,225,255,.12) 65deg, transparent 90deg)";
const FADE_DOWN = "linear-gradient(to bottom,#000 0%,transparent 80%)";
function M193() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, () =>
    gsap
      .timeline({ repeat: -1, yoyo: true, repeatDelay: 0.3, defaults: { ease: "power2.out", duration: 0.8 } })
      .fromTo([".m193-l", ".m193-r"], { width: "15rem", opacity: 0.45 }, { width: "30rem", opacity: 1 }, 0)
      .fromTo(".m193-line", { width: "15rem", opacity: 0.5 }, { width: "30rem", opacity: 1 }, 0)
      .fromTo(".m193-bloom", { scale: 0.6, opacity: 0.3 }, { scale: 1, opacity: 1 }, 0)
      .fromTo(".m193-head", { y: 90, opacity: 0.35 }, { y: 0, opacity: 1, duration: 0.9 }, 0.1),
  );
  return (
    <div ref={root} className="relative h-full w-full overflow-hidden rounded-[24px] bg-[#05080f]">
      <Glow code="m193" color="rgba(78,225,255,.35)" at="50% 30%" />
      <div className="absolute inset-x-0 top-[16%] h-[48%]">
        <div className="m193-l absolute right-1/2 top-0 h-full" style={{ width: "30rem", background: LAMP_L, WebkitMaskImage: FADE_DOWN, maskImage: FADE_DOWN }} />
        <div className="m193-r absolute left-1/2 top-0 h-full" style={{ width: "30rem", background: LAMP_R, WebkitMaskImage: FADE_DOWN, maskImage: FADE_DOWN }} />
        <div className="absolute inset-x-0 top-0 flex justify-center">
          <div className="m193-bloom -mt-16 h-32 w-[28rem] rounded-full bg-[#4ee1ff]/40 blur-[50px]" />
        </div>
        <div className="absolute inset-x-0 top-0 flex justify-center">
          <div className="m193-line h-[2px] bg-[#9ff0ff] shadow-[0_0_18px_4px_rgba(78,225,255,.7)]" style={{ width: "30rem" }} />
        </div>
      </div>
      <div className="absolute inset-x-0 top-[34%] text-center">
        <h3 className="m193-head bg-[linear-gradient(to_bottom,#f2fbff,#8fb7c8)] bg-clip-text text-[clamp(56px,6.8vw,112px)] font-[700] leading-[0.95] tracking-[-0.035em] text-transparent" style={{ fontFamily: GROTESK }}>
          Lit for the late shift.
        </h3>
        <p className="mt-5 text-[15px] text-white/65">Halo desk lamp · 2700–6500 K · ₹ 8,400</p>
      </div>
    </div>
  );
}

/* ---------- M194 · Diagonal spotlight settles (variant of M61: one beam slides in from a corner and stops) ---------- */
function Beam({ cls, mirror, hidden }: { cls: string; mirror?: boolean; hidden?: boolean }) {
  return (
    <svg className={`${cls} pointer-events-none absolute -top-[25%] left-[-10%] h-[150%] w-[120%]`} viewBox="0 0 1000 1000" preserveAspectRatio="none" style={hidden ? { opacity: 0 } : undefined} aria-hidden>
      <defs>
        <filter id={`${cls}-blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="55" />
        </filter>
      </defs>
      <g transform={mirror ? "translate(1000 0) scale(-1 1)" : undefined}>
        <ellipse cx="380" cy="330" rx="520" ry="120" transform="rotate(38 380 330)" fill="rgba(235,240,255,.3)" filter={`url(#${cls}-blur)`} />
        <ellipse cx="420" cy="360" rx="340" ry="60" transform="rotate(38 420 360)" fill="rgba(255,255,255,.22)" filter={`url(#${cls}-blur)`} />
      </g>
    </svg>
  );
}
function M194() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, () =>
    gsap
      .timeline({ repeat: -1, repeatDelay: 0.1 })
      // from the top-left corner
      .fromTo(".m194-a", { xPercent: -28, yPercent: -26, opacity: 0 }, { xPercent: 0, yPercent: 0, opacity: 1, duration: 2, ease: "power2.out" }, 0)
      .fromTo(".m194-head", { opacity: 0.4 }, { opacity: 1, duration: 1.6, ease: "power1.out" }, 0.3)
      .to(".m194-a", { opacity: 0, duration: 0.6, ease: "power1.in" }, 2.3)
      .to(".m194-head", { opacity: 0.4, duration: 0.6 }, 2.3)
      // then from the top-right corner
      .fromTo(".m194-b", { xPercent: 28, yPercent: -26, opacity: 0 }, { xPercent: 0, yPercent: 0, opacity: 1, duration: 2, ease: "power2.out" }, 2.6)
      .to(".m194-head", { opacity: 1, duration: 1.6, ease: "power1.out" }, 2.9)
      .to(".m194-b", { opacity: 0, duration: 0.6, ease: "power1.in" }, 4.9)
      .to(".m194-head", { opacity: 0.4, duration: 0.6 }, 4.9),
  );
  return (
    <div ref={root} className="relative h-full w-full overflow-hidden rounded-[24px] bg-[#04050a]">
      <Glow code="m194" color="rgba(120,140,255,.35)" at="50% 60%" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <Beam cls="m194-a" />
      <Beam cls="m194-b" mirror hidden />
      <div className="absolute inset-0 grid place-items-center text-center">
        <div className="m194-head">
          <p className="text-[13px] uppercase tracking-[0.3em] text-white/60">Northwind Studio · Launch</p>
          <h3 className="mt-3 bg-[linear-gradient(to_bottom,#ffffff,#9aa3b8)] bg-clip-text text-[clamp(56px,7vw,118px)] font-[700] leading-[0.92] tracking-[-0.04em] text-transparent" style={{ fontFamily: GROTESK }}>
            All eyes on you.
          </h3>
          <p className="mt-5 text-[15px] text-white/65">Brand sprint · 3 weeks · from ₹ 2,40,000</p>
        </div>
      </div>
    </div>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M183", name: "Silk folds", how: "A shader lights diagonal silk folds; soft highlights roll slowly along them (always on)", kind: "play", C: M183 },
  { code: "M184", name: "Caustic light", how: "A bright wavy net of water-caustic light crawls over a teal backdrop (always on)", kind: "play", C: M184 },
  { code: "M185", name: "Leaf-shadow sunlight", how: "Sun through a blind and leaves; the shadow pattern sways in a soft breeze (always on)", kind: "play", C: M185 },
  { code: "M186", name: "Fluted glass", how: "Drifting colours seen through vertical ribbed glass; each rib refracts a shifted slice (always on)", kind: "play", C: M186 },
  { code: "M187", name: "Water surface shimmer", how: "Calm water from above; specular glints sparkle on the moving crests (always on)", kind: "play", C: M187 },
  { code: "M188", name: "Raindrops on glass", how: "Drops form, merge and slide down a window, each refracting a sharp flipped city (always on)", kind: "play", C: M188 },
  { code: "M189", name: "Drifting procedural clouds", how: "Soft fbm clouds drift sideways across a sunset sky inside a plane window (always on)", kind: "play", C: M189 },
  { code: "M190", name: "Coloured smoke plumes", how: "Domain-warped smoke in three tints billows and rises behind the name (always on)", kind: "play", C: M190 },
  { code: "M191", name: "Volumetric fog bank", how: "Four fog slices drift at different speeds along the valley floor (always on)", kind: "play", C: M191 },
  { code: "M192", name: "Rotating conic halo", how: "A blurred conic gradient turns behind a card; a neon border spins round a button (on screen)", kind: "play", C: M192 },
  { code: "M193", name: "Lamp switches on over heading", how: "Two light cones widen from the centre, a bright line extends and the heading rises (on view)", kind: "play", C: M193 },
  { code: "M194", name: "Diagonal spotlight settles", how: "A blurred beam slides in from the top-left (then top-right) corner and settles on the headline", kind: "play", C: M194 },
];
