"use client";

// Ambient motions, batch 11 · group 3 (MOTION-MENU M561–M565). Small focused demos for /lab/motion.
// All "play": they run by themselves while on screen and pause off screen. Pointer-driven ones follow a scripted path
// (a visible ring) until the real mouse moves. Every stage has a CSS-only glow loop that never stops, plus a second one
// ON TOP of full-bleed canvases. WebGL: one context per demo, dpr 1, created only once the stage is within ~1 screen.
// ?static=1 / reduced motion: no JS motion; the CSS fallback / markup shows a sensible final state.
import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import type { OGLRenderingContext } from "ogl";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { createShader, type GLHandle } from "@/lib/gl";
import { useTicker } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = {
  sg: "Space Grotesk Variable",
  fr: "Fraunces Variable",
  is: "Instrument Serif",
  sy: "Syne Variable",
  mr: "Manrope Variable",
};

const M565_COLS = ["#ff5d8f", "#ffb86b", "#6bf0ff", "#8b7bff"];
/** M565: four registered colour properties; each walks the same palette a quarter-cycle apart, so colours step stop → stop. */
const M565_CSS = (() => {
  const props = M565_COLS.map((_, i) => `@property --m565-s${i}{syntax:"<color>";inherits:true;initial-value:${M565_COLS[i]}}`).join("\n");
  const kf = M565_COLS.map((_, i) => {
    const seq = [0, 1, 2, 3, 4].map((k) => M565_COLS[(i + k) % 4]);
    return `@keyframes m565-k${i}{${seq.map((c, k) => `${k * 25}%{--m565-s${i}:${c}}`).join("")}}`;
  }).join("\n");
  const anim = M565_COLS.map((_, i) => `m565-k${i} 4.8s linear infinite`).join(",");
  return `${props}
${kf}
.m565-wrap{animation:${anim};animation-play-state:paused}
.m565-wrap[data-on="1"]{animation-play-state:running}
.m565-halo{position:absolute;inset:-46px;border-radius:44px;background:conic-gradient(from 210deg,var(--m565-s0),var(--m565-s1),var(--m565-s2),var(--m565-s3),var(--m565-s0));filter:blur(38px);opacity:.85}
.m565-rim{position:absolute;inset:-1.5px;border-radius:29.5px;background:conic-gradient(from 210deg,var(--m565-s0),var(--m565-s1),var(--m565-s2),var(--m565-s3),var(--m565-s0))}
.m565-pulse{animation:m565-pulse 2.6s ease-in-out infinite alternate}
@keyframes m565-pulse{0%{transform:scale(.97)}100%{transform:scale(1.04)}}
html.is-static .m565-wrap,html.is-static .m565-pulse{animation:none}
html.is-static {.m565-wrap,.m565-pulse{animation:none}}`;
})();

const CSS = `
.b11a3-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.42)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.2)),transparent 70%);animation:b11a3-drift 5.4s linear infinite alternate;will-change:transform}
@keyframes b11a3-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b11a3-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4);pointer-events:none;z-index:60;opacity:0;transition:opacity .25s}
.m562-tap{position:absolute;left:0;top:0;width:60px;height:60px;margin:-30px 0 0 -30px;border-radius:50%;border:2px solid rgba(220,250,255,.85);pointer-events:none;z-index:55;opacity:0}
.m563-breathe{animation:m563-breathe 3.6s ease-in-out infinite alternate}
@keyframes m563-breathe{0%{opacity:.78}100%{opacity:.96}}
html.is-static .b11a3-glow,html.is-static .m563-breathe{animation:none}
html.is-static {.b11a3-glow,.m563-breathe{animation:none}}
${M565_CSS}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", g1, g2, style }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string; style?: CSSProperties }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0d16] text-[#eef2ff] ${className}`} style={style}>
      <style href="b11a3-css" precedence="default">
        {CSS}
      </style>
      <div className="b11a3-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/** The CSS glow loop again, ON TOP of a full-bleed canvas (screen blend), so dark shader stages never freeze. */
const Sheen = ({ g1 }: { g1?: string }) => (
  <div className="b11a3-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.45, zIndex: 50 } as CSSProperties} aria-hidden />
);

/** The visible fake pointer (a ring). */
const Dot = ({ r }: { r: RefObject<HTMLDivElement | null> }) => <div ref={r} className="b11a3-dot" aria-hidden />;

/** True once the element is within ~1 screen of the viewport (no textures / GL context before that). */
function useNear(ref: RefObject<HTMLElement | null>) {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "900px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return near;
}

type Uniforms = Record<string, { value: unknown }>;
type InitFn = (api: { ogl: typeof import("ogl"); gl: WebGLRenderingContext; uniforms: Uniforms }) => ((t: number) => void) | void;

/** One OGL canvas (dpr 1) over a CSS fallback; created only when near the viewport. lib/gl draws only while on screen. */
function Shader({ frag, fallback, uniforms, onFrame, init }: { frag: string; fallback: string; uniforms?: () => Uniforms; onFrame?: (u: Uniforms, t: number) => void; init?: InitFn }) {
  const box = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const near = useNear(box);
  const opt = useRef({ uniforms, onFrame, init });
  opt.current = { uniforms, onFrame, init };
  useEffect(() => {
    if (!near) return;
    let dead = false;
    let h: GLHandle | null = null;
    (async () => {
      if (!cv.current) return;
      const o = opt.current;
      h = await createShader(cv.current, frag, { dpr: 1, uniforms: o.uniforms?.() ?? {}, onFrame: (u, t) => opt.current.onFrame?.(u, t), init: o.init });
      if (dead) h?.destroy();
    })();
    return () => {
      dead = true;
      h?.destroy();
    };
  }, [near, frag]);
  return (
    <div ref={box} className="absolute inset-0" style={{ background: fallback }}>
      <canvas ref={cv} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500" aria-hidden />
    </div>
  );
}

/**
 * Pointer driver: every frame (while on screen) a pointer position in root px. The real mouse wins for 2.5 s after it
 * last moved; otherwise `script(t, root)` drives the visible fake ring.
 */
function usePointer(root: RefObject<HTMLDivElement | null>, dot: RefObject<HTMLDivElement | null> | null, script: (t: number, el: HTMLDivElement) => [number, number], frame: (x: number, y: number, real: boolean, dt: number, t: number, el: HTMLDivElement) => void) {
  const real = useRef({ x: 0, y: 0, at: -1e9 });
  const sc = useRef(script);
  sc.current = script;
  const fr = useRef(frame);
  fr.current = frame;
  const t0 = useRef(-1);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      real.current = { x: e.clientX - r.left, y: e.clientY - r.top, at: performance.now() };
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerdown", move);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerdown", move);
    };
  }, [root]);
  useTicker(root, (t, dt) => {
    const el = root.current;
    if (!el) return;
    if (t0.current < 0) t0.current = t;
    const R = real.current;
    const useReal = performance.now() - R.at < 2500;
    const [x, y] = useReal ? [R.x, R.y] : sc.current(t - t0.current, el);
    const dn = dot?.current;
    if (dn) {
      dn.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
      dn.style.opacity = useReal ? "0" : "1";
    }
    fr.current(x, y, useReal, Math.min(dt, 0.1), t - t0.current, el);
  });
}

/* Our own small GLSL noise kit (hash → value noise → fbm). */
const NOISE = /* glsl */ `
float n21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
vec2 n22(vec2 p) { float n = n21(p); return vec2(n, n21(p + n + 9.0)); }
float vn(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(n21(i), n21(i + vec2(1.0, 0.0)), f.x), mix(n21(i + vec2(0.0, 1.0)), n21(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++) { s += a * vn(p); p = r * p * 2.02 + 0.31; a *= 0.5; }
  return s;
}
`;

/* ───────────────────────── M561 · Pointer-warped silk (variant of M183) ───────────────────────── */
const M561_FRAG = /* glsl */ `${NOISE}
uniform vec2 uP;      // pointer in uv (y up)
uniform float uPull;  // 0..1
vec2 warp(vec2 p, vec2 c) {
  vec2 d = c - p;
  float f = exp(-dot(d, d) * 4.0) * uPull;
  // pull the flow toward the pointer and twist it a little: folds bunch up where the cursor is
  float a = f * 1.1;
  mat2 r = mat2(cos(a), -sin(a), sin(a), cos(a));
  return c - r * d * (1.0 - 0.55 * f);
}
float silk(vec2 p, float t) {
  vec2 q = mat2(0.74, -0.67, 0.67, 0.74) * p;
  float w = fbm(q * 1.05 + vec2(t * 0.04, -t * 0.035));
  return sin(q.x * 5.2 + sin(q.y * 1.9 + t * 0.3) * 1.5 + w * 3.2 + t * 0.34) * 0.72
       + sin(q.x * 9.0 - q.y * 1.6 + w * 2.0 - t * 0.2) * 0.16;
}
void main() {
  float asp = uRes.x / uRes.y;
  vec2 p = vec2(vUv.x * asp, vUv.y);
  vec2 c = vec2(uP.x * asp, uP.y);
  float t = uTime;
  float e = 0.004;
  vec2 wp = warp(p, c);
  float h = silk(wp, t);
  float hx = silk(warp(p + vec2(e, 0.0), c), t);
  float hy = silk(warp(p + vec2(0.0, e), c), t);
  vec3 n = normalize(vec3((h - hx) / e * 0.1, (h - hy) / e * 0.1, 1.0));
  vec3 L = normalize(vec3(-0.5, 0.62, 0.62));
  float dif = clamp(dot(n, L), 0.0, 1.0);
  float spec = pow(clamp(dot(n, normalize(L + vec3(0.0, 0.0, 1.0))), 0.0, 1.0), 34.0);
  vec3 col = mix(vec3(0.01, 0.04, 0.045), vec3(0.04, 0.26, 0.27), dif * dif);
  col += spec * vec3(0.85, 1.0, 0.94) * 0.75 + pow(dif, 8.0) * vec3(0.12, 0.3, 0.28);
  float near = exp(-dot(c - p, c - p) * 6.0) * uPull;
  col += near * vec3(0.05, 0.12, 0.11);
  col *= 0.55 + 0.45 * smoothstep(1.2, 0.1, length(vUv - vec2(0.6, 0.5)));
  gl_FragColor = vec4(col, 1.0);
}`;
function M561() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const st = useRef({ x: 0.6, y: 0.5, pull: 0, tx: 0.6, ty: 0.5 });
  usePointer(
    root,
    dot,
    (t, el) => {
      // slow figure-eight
      const w = el.clientWidth;
      const h = el.clientHeight;
      return [w * (0.6 + 0.26 * Math.sin(t * 0.6)), h * (0.5 + 0.24 * Math.sin(t * 1.2))];
    },
    (x, y, _real, dt, _t, el) => {
      const S = st.current;
      S.tx = x / el.clientWidth;
      S.ty = 1 - y / el.clientHeight;
      const k = 1 - Math.exp(-dt * 4);
      S.x += (S.tx - S.x) * k;
      S.y += (S.ty - S.y) * k;
      S.pull += (1 - S.pull) * (1 - Math.exp(-dt * 1.5));
    },
  );
  return (
    <Stage r={root} className="bg-[#020809]" g1="rgba(110,230,210,.52)">
      <Shader
        frag={M561_FRAG}
        fallback="linear-gradient(130deg,#020809 0%,#0b3b3c 36%,#031112 52%,#145252 70%,#020809 100%)"
        uniforms={() => ({ uP: { value: [0.6, 0.5] }, uPull: { value: 0 } })}
        onFrame={(u) => {
          const S = st.current;
          u.uP.value = [S.x, S.y];
          u.uPull.value = S.pull;
        }}
      />
      <Sheen g1="rgba(120,240,215,.5)" />
      <div className="pointer-events-none absolute bottom-[10%] left-[6%] z-[52] max-w-[40%] text-[#e6fbf6]">
        <p className="text-[13px] uppercase tracking-[0.24em] opacity-70">Lumen Atelier · Silk scarves</p>
        <h3 className="mt-3 text-[clamp(44px,5.2vw,84px)] leading-[0.92]" style={{ fontFamily: F.is }}>
          The folds follow you.
        </h3>
        <p className="mt-4 text-[15px] opacity-75">Lagoon twill scarf · 90 cm · ₹ 6,400</p>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M562 · Caustic pool with drag ripples (variant of M184) ───────────────────────── */
const M562_GW = 128;
const M562_GH = 80;
const M562_FRAG = /* glsl */ `${NOISE}
uniform sampler2D uH;
uniform vec2 uHRes;
float hh(vec2 uv) { return texture2D(uH, uv).r - 0.5; } // OGL flips canvas rows: row 0 (top) is v = 1
float cell(vec2 p, float t) {
  vec2 i = floor(p), f = fract(p);
  float a = 8.0, b = 8.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y));
    vec2 o = 0.5 + 0.4 * sin(t * 0.6 + 6.2831 * n22(i + g));
    float d = length(g + o - f);
    if (d < a) { b = a; a = d; } else if (d < b) { b = d; }
  }
  return b - a;
}
void main() {
  vec2 e = 1.0 / uHRes;
  float dx = hh(vUv + vec2(e.x, 0.0)) - hh(vUv - vec2(e.x, 0.0));
  float dy = hh(vUv + vec2(0.0, e.y)) - hh(vUv - vec2(0.0, e.y));
  vec2 bend = vec2(dx, dy);
  float asp = uRes.x / uRes.y;
  float t = uTime;
  vec2 p = vec2(vUv.x * asp, vUv.y) * 3.2 + bend * 2.4;
  p += (vec2(fbm(p * 0.55 + t * 0.07), fbm(p * 0.55 - t * 0.06 + 3.0)) - 0.5) * 0.8;
  float c = pow(clamp(1.0 - cell(p, t) * 3.0, 0.0, 1.0), 5.0);
  c += 0.5 * pow(clamp(1.0 - cell(p * 1.7 + 2.3, t * 1.2) * 3.0, 0.0, 1.0), 5.0);
  c *= 1.0 + clamp(length(bend) * 9.0, 0.0, 1.4);
  // pool tiles under the water, bent by the ripples
  vec2 tp = (vec2(vUv.x * asp, vUv.y) + bend * 0.25) * 9.0;
  vec2 g = abs(fract(tp) - 0.5);
  float tile = smoothstep(0.47, 0.5, max(g.x, g.y));
  vec3 base = mix(vec3(0.01, 0.12, 0.2), vec3(0.03, 0.32, 0.42), smoothstep(0.0, 1.0, vUv.y));
  base += tile * 0.05;
  vec3 col = base + c * vec3(0.75, 1.0, 1.0) * 0.9;
  col += clamp((dx - dy) * 3.0, -0.2, 0.35) * vec3(0.8, 0.95, 1.0);
  gl_FragColor = vec4(col, 1.0);
}`;
const M562_TAPS: [number, number][] = [
  [0.3, 0.4],
  [0.72, 0.3],
  [0.58, 0.68],
  [0.2, 0.7],
  [0.84, 0.62],
  [0.46, 0.22],
];
function M562() {
  const root = useRef<HTMLDivElement>(null);
  const tap = useRef<HTMLDivElement>(null);
  const q = useRef<{ x: number; y: number; amt: number }[]>([]);
  const st = useRef({ k: -1, down: false, lx: -1, ly: -1 });
  // real pointer: drag drops a trail of ripples
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const pos = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
    };
    const down = (e: PointerEvent) => {
      st.current.down = true;
      const p = pos(e);
      q.current.push({ ...p, amt: 1.6 });
    };
    const move = (e: PointerEvent) => {
      if (!st.current.down) return;
      const p = pos(e);
      q.current.push({ ...p, amt: 0.5 });
    };
    const up = () => (st.current.down = false);
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);
  // scripted taps (every 0.6 s) while nobody uses the mouse; a ring shows where each lands
  usePointer(
    root,
    null,
    (t) => {
      const k = Math.floor(t / 0.6);
      return M562_TAPS[k % M562_TAPS.length];
    },
    (x, y, real, _dt, t, el) => {
      if (real) return;
      const S = st.current;
      const k = Math.floor(t / 0.6);
      if (k === S.k) return;
      S.k = k;
      q.current.push({ x, y, amt: 1.8 });
      const n = tap.current;
      if (n) {
        gsap.set(n, { x: x * el.clientWidth, y: y * el.clientHeight });
        gsap.fromTo(n, { scale: 0.4, opacity: 0.9 }, { scale: 1.6, opacity: 0, duration: 0.55, ease: "power2.out", overwrite: true });
      }
    },
  );
  const init: InitFn = ({ ogl, gl, uniforms }) => {
    const W = M562_GW;
    const H = M562_GH;
    const N = W * H;
    let cur = new Float32Array(N);
    let prev = new Float32Array(N);
    const hc = document.createElement("canvas");
    hc.width = W;
    hc.height = H;
    const ctx = hc.getContext("2d")!;
    const img = ctx.createImageData(W, H);
    const T = new ogl.Texture(gl as unknown as OGLRenderingContext, { image: hc, generateMipmaps: false, minFilter: gl.LINEAR, magFilter: gl.LINEAR, wrapS: gl.CLAMP_TO_EDGE, wrapT: gl.CLAMP_TO_EDGE });
    uniforms.uH = { value: T };
    const drop = (gx: number, gy: number, amt: number) => {
      for (let oy = -3; oy <= 3; oy++)
        for (let ox = -3; ox <= 3; ox++) {
          const x = Math.round(gx) + ox;
          const y = Math.round(gy) + oy;
          if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) continue;
          const f = Math.max(0, 1 - Math.hypot(ox, oy) / 3.5);
          cur[y * W + x] += amt * f;
        }
    };
    return () => {
      for (const d of q.current.splice(0)) drop(d.x * W, d.y * H, d.amt);
      // wave step: the borders stay at 0, so rings bounce back off the pool's edges
      for (let y = 1; y < H - 1; y++)
        for (let x = 1; x < W - 1; x++) {
          const i = y * W + x;
          prev[i] = ((cur[i - 1] + cur[i + 1] + cur[i - W] + cur[i + W]) * 0.5 - prev[i]) * 0.986;
        }
      const s = cur;
      cur = prev;
      prev = s;
      const d = img.data;
      for (let i = 0; i < N; i++) {
        const v = Math.max(0, Math.min(255, 128 + cur[i] * 60));
        d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v;
        d[i * 4 + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      T.needsUpdate = true;
    };
  };
  return (
    <Stage r={root} className="cursor-crosshair bg-[#031722]" g1="rgba(120,230,255,.52)">
      <Shader frag={M562_FRAG} fallback="radial-gradient(circle at 60% 45%,#1b6a7c 0%,#0a3746 48%,#031722 100%)" uniforms={() => ({ uHRes: { value: [M562_GW, M562_GH] } })} init={init} />
      <Sheen g1="rgba(140,240,255,.5)" />
      <div ref={tap} className="m562-tap" aria-hidden />
      <div className="pointer-events-none absolute left-[6%] top-[9%] z-[52] max-w-[40%] text-[#eafcff]">
        <p className="text-[13px] uppercase tracking-[0.24em] opacity-70">Shallows Retreat · Plunge pools</p>
        <h3 className="mt-3 text-[clamp(44px,5vw,82px)] font-[600] leading-[0.94] tracking-[-0.02em]" style={{ fontFamily: F.fr }}>
          Touch the water.
        </h3>
        <p className="mt-4 text-[15px] opacity-75">Pool villa · 2 nights · from ₹ 38,000 · drag to ripple</p>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M563 · Ethereal shadow (SVG turbulence) ───────────────────────── */
function M563() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const disp = el.querySelector("#m563-disp");
    const blobs = el.querySelectorAll(".m563-blob");
    let on = false;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true });
      // the turbulence field is fixed (no baseFrequency tween): the displacement strength breathes and the shape
      // drifts through the field, so its edges churn like a shadow under moving water
      tl.to(disp, { attr: { scale: 120 }, duration: 3.2, ease: "sine.inOut", repeat: -1, yoyo: true }, 0);
      blobs.forEach((b, i) => {
        tl.to(b, { x: [50, -60, 40][i], y: [-26, 30, 22][i], rotation: [8, -10, 6][i], svgOrigin: "600 350", duration: 4 + i * 1.3, ease: "sine.inOut", repeat: -1, yoyo: true }, 0);
      });
      const io = new IntersectionObserver(([e]) => {
        on = e.isIntersecting;
        if (on) tl.play();
        else tl.pause();
      });
      io.observe(el);
      return () => io.disconnect();
    }, el);
    return () => ctx.revert();
  }, []);
  return (
    <Stage r={root} className="bg-[#d6cdbf]" g1="rgba(255,236,210,.6)" g2="rgba(160,140,120,.25)" style={{ color: "#f5efe6" }}>
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_40%,#e4dccf_0%,#c9bfaf_60%,#b4a895_100%)]" />
      <svg className="m563-breathe absolute inset-0 h-full w-full" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <filter id="m563-f" filterUnits="userSpaceOnUse" x="180" y="80" width="840" height="540" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves={1} seed={11} result="n" />
            <feDisplacementMap id="m563-disp" in="SourceGraphic" in2="n" scale={60} xChannelSelector="R" yChannelSelector="G" result="d" />
            <feGaussianBlur in="d" stdDeviation={9} />
          </filter>
        </defs>
        <g filter="url(#m563-f)" fill="#120d0a">
          <ellipse className="m563-blob" cx="600" cy="350" rx="300" ry="170" />
          <ellipse className="m563-blob" cx="470" cy="330" rx="170" ry="120" opacity=".85" />
          <ellipse className="m563-blob" cx="740" cy="380" rx="190" ry="110" opacity=".85" />
        </g>
      </svg>
      <div className="pointer-events-none absolute inset-0 z-[20] flex flex-col items-center justify-center text-center">
        <p className="text-[13px] uppercase tracking-[0.26em] opacity-75">Umbra Studio · Linen</p>
        <h3 className="mt-3 text-[clamp(56px,6.6vw,108px)] leading-[0.9]" style={{ fontFamily: F.is }}>
          Quiet hours
        </h3>
        <p className="mt-4 text-[15px] opacity-80">Washed linen bedding · from ₹ 4,200</p>
      </div>
      <Sheen g1="rgba(255,236,210,.55)" />
    </Stage>
  );
}

/* ───────────────────────── M564 · Smoke ring (WebGL) ───────────────────────── */
const M564_FRAG = /* glsl */ `${NOISE}
uniform float uR;  // ring radius (screen heights)
uniform float uW;  // ring thickness
void main() {
  float asp = uRes.x / uRes.y;
  vec2 p = (vUv - 0.5) * vec2(asp, 1.0);
  float r = length(p);
  float a = atan(p.y, p.x) + uTime * 0.18;    // slow rotation
  vec2 c = vec2(cos(a), sin(a));               // seamless around the circle
  float t = uTime;
  float n = fbm(c * 1.6 + vec2(r * 5.0 - t * 0.25, t * 0.12));
  float n2 = fbm(c * 3.4 - vec2(t * 0.18, r * 7.0));
  float rr = uR + (n - 0.5) * 0.08;
  float w = uW * (0.55 + n * 1.1);
  float band = exp(-pow((r - rr) / w, 2.0));
  float wisps = exp(-pow((r - rr - (n2 - 0.5) * 0.14) / (w * 1.8), 2.0)) * 0.35;
  float d = clamp((band * (0.45 + n2 * 1.1) + wisps) * 1.15, 0.0, 1.0);
  vec3 bg = mix(vec3(0.02, 0.018, 0.035), vec3(0.06, 0.045, 0.09), smoothstep(0.9, 0.0, r));
  vec3 smoke = mix(vec3(0.55, 0.5, 0.75), vec3(0.95, 0.9, 1.0), n2);
  gl_FragColor = vec4(mix(bg, smoke, d), 1.0);
}`;
function M564() {
  const root = useRef<HTMLDivElement>(null);
  const ring = useRef({ r: 0.28, w: 0.05 });
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const tl = gsap.timeline({ paused: true });
    // breathing: radius and thickness yoyo on different periods
    tl.to(ring.current, { r: 0.33, duration: 2.4, ease: "sine.inOut", repeat: -1, yoyo: true }, 0).to(ring.current, { w: 0.085, duration: 1.7, ease: "sine.inOut", repeat: -1, yoyo: true }, 0);
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? tl.play() : tl.pause()));
    io.observe(el);
    return () => {
      io.disconnect();
      tl.kill();
    };
  }, []);
  return (
    <Stage r={root} className="bg-[#050409]" g1="rgba(190,170,255,.52)">
      <Shader
        frag={M564_FRAG}
        fallback="radial-gradient(circle at 50% 50%,transparent 0 22%,rgba(200,190,240,.55) 27%,transparent 33%),#050409"
        uniforms={() => ({ uR: { value: 0.28 }, uW: { value: 0.05 } })}
        onFrame={(u) => {
          u.uR.value = ring.current.r;
          u.uW.value = ring.current.w;
        }}
      />
      <Sheen g1="rgba(200,180,255,.5)" />
      <div className="pointer-events-none absolute inset-0 z-[52] flex flex-col items-center justify-center text-center text-[#f3efff]">
        <h3 className="text-[clamp(52px,5.4vw,84px)] leading-none" style={{ fontFamily: F.is }}>
          Noctis
        </h3>
        <p className="mt-2 text-[13px] uppercase tracking-[0.3em] opacity-70">Eau de parfum</p>
      </div>
      <p className="pointer-events-none absolute bottom-[7%] left-0 right-0 z-[52] text-center text-[15px] text-[#f3efff]/75">50 ml · ₹ 5,600 · a slow smoke of iris and oud</p>
    </Stage>
  );
}

/* ───────────────────────── M565 · Halo colour cycle (CSS @property) ───────────────────────── */
function M565() {
  const root = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    const w = wrap.current;
    if (!el || !w || prefersReducedMotion()) return;
    const io = new IntersectionObserver(([e]) => (w.dataset.on = e.isIntersecting ? "1" : "0"), { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Stage r={root} className="bg-[#07070c]" g1="rgba(255,140,190,.5)" g2="rgba(110,220,255,.22)">
      <div className="absolute inset-0 grid place-items-center">
        <div ref={wrap} className="m565-wrap relative w-[min(46%,560px)]">
          <div className="m565-pulse absolute inset-0">
            <div className="m565-halo" aria-hidden />
          </div>
          <div className="m565-rim" aria-hidden />
          <div className="relative rounded-[28px] bg-[#0c0c14] p-9">
            <p className="text-[13px] uppercase tracking-[0.24em] text-white/60">Prism Pass · Annual</p>
            <h3 className="mt-3 text-[clamp(40px,3.8vw,60px)] font-[700] leading-[0.95] tracking-[-0.03em]" style={{ fontFamily: F.sg }}>
              Every studio, all year.
            </h3>
            <p className="mt-4 text-[15px] leading-relaxed text-white/65">Unlimited classes across 40 studios, guest passes and early booking.</p>
            <div className="mt-7 flex items-center justify-between">
              <span className="text-[28px] font-[700] tabular-nums" style={{ fontFamily: F.sg }}>
                ₹ 11,999<span className="text-[15px] font-[400] text-white/55"> / year</span>
              </span>
              <span className="rounded-full bg-white px-6 py-3 text-[15px] font-[600] text-[#0c0c14]">Join now</span>
            </div>
          </div>
        </div>
      </div>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M561", name: "Pointer-warped silk", how: "Shader silk folds whose flow bends toward the pointer, so the folds gather and twist where the cursor is; a slow figure-eight drives it for filming.", kind: "play", C: M561 },
  { code: "M562", name: "Caustic pool with drag ripples", how: "Caustic light over a pool plus a water height field: drags (or scripted taps) drop ripples that spread, bounce off the edges and bend the light.", kind: "play", C: M562 },
  { code: "M563", name: "Ethereal shadow", how: "A big soft shadow behind the headline churns at the edges through an SVG turbulence displacement, drifting slowly like a shadow in moving water.", kind: "play", C: M563 },
  { code: "M564", name: "Smoke ring", how: "A ring of noise smoke slowly turns around the name while its radius and thickness breathe on a yoyo (WebGL polar band).", kind: "play", C: M564 },
  { code: "M565", name: "Halo colour cycle", how: "The blurred halo keeps its shape while its four gradient colours step from stop to stop on a loop (@property colour animation).", kind: "play", C: M565 },
];
