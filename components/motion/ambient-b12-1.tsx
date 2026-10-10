"use client";

// Ambient motions, batch 12 · group 1 (MOTION-MENU M590–M601). Small focused demos for /lab/motion.
// Every demo is "play": it runs by itself while on screen and pauses off screen. M590–M595, M597–M599 and M601 are OGL
// fragment shaders (dpr 1, built only when the stage is within ~1 screen, drawn only while visible); M596 is layered SVG
// waves moved by GSAP; M600 is a canvas-2D dithered dot field. Pointer demos (M599, M600) drive a visible fake pointer
// by themselves; the real mouse takes over while it moves. Each stage has a CSS-only glow loop that never stops, and a
// second one ON TOP of the full-bleed canvas. ?static=1 / reduced motion: no WebGL / canvas / GSAP, CSS loops stop and
// the CSS fallbacks show a sensible final state.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { createShader, type GLHandle } from "@/lib/gl";
import { useTicker } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = {
  sg: "'Space Grotesk Variable', system-ui, sans-serif",
  fr: "'Fraunces Variable', Georgia, serif",
  is: "'Instrument Serif', Georgia, serif",
  sy: "'Syne Variable', 'Space Grotesk Variable', system-ui, sans-serif",
  mr: "'Manrope Variable', system-ui, sans-serif",
};

const CSS = `
.b12g1-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.5)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.22)),transparent 70%);animation:b12g1-drift 5.6s linear infinite alternate;will-change:transform}
@keyframes b12g1-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b12g1-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4);pointer-events:none;z-index:45;opacity:0;transition:opacity .25s}
.m596-wave{position:absolute;left:0;bottom:0;width:200%;will-change:transform}
html.is-static .b12g1-glow{animation:none}
html.is-static { .b12g1-glow{animation:none} }
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: rounded panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", g1, g2, style }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string; style?: CSSProperties }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0d16] text-[#eef2ff] ${className}`} style={style}>
      <style href="b12g1-css" precedence="default">
        {CSS}
      </style>
      <div className="b12g1-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/** The CSS glow loop again, ON TOP of full-bleed canvases, so those demos never freeze. */
const Sheen = ({ g1, blend = "screen", opacity = 0.45 }: { g1?: string; blend?: CSSProperties["mixBlendMode"]; opacity?: number }) => (
  <div className="b12g1-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: blend, opacity, zIndex: 35 } as CSSProperties} aria-hidden />
);

/** The visible fake pointer ring. */
const Dot = ({ r }: { r: RefObject<HTMLDivElement | null> }) => <div ref={r} className="b12g1-dot" aria-hidden />;

/**
 * Pointer for pointer demos: every frame (on screen) it reports a position in root px. The real mouse wins for 2 s after
 * it last moved; otherwise `script(t, w, h)` drives the visible fake ring along a set path.
 */
function usePointer(root: RefObject<HTMLDivElement | null>, dot: RefObject<HTMLDivElement | null>, script: (t: number, w: number, h: number) => [number, number], frame: (x: number, y: number, dt: number, t: number) => void) {
  const real = useRef({ x: 0, y: 0, at: -1e9 });
  const sc = useRef(script);
  sc.current = script;
  const fr = useRef(frame);
  fr.current = frame;
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      real.current = { x: e.clientX - r.left, y: e.clientY - r.top, at: performance.now() };
    };
    el.addEventListener("pointermove", move);
    return () => el.removeEventListener("pointermove", move);
  }, [root]);
  useTicker(root, (t, dt) => {
    const el = root.current;
    if (!el) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    const live = performance.now() - real.current.at < 2000;
    const [x, y] = live ? [real.current.x, real.current.y] : sc.current(t, w, h);
    if (dot.current) {
      dot.current.style.opacity = live ? "0" : "1";
      dot.current.style.transform = `translate3d(${x}px,${y}px,0)`;
    }
    fr.current(x, y, Math.min(dt, 0.05), t);
  });
}

/** Runs `fn` once the element is within ~1 screen of the viewport (no textures / GL contexts at page load). */
function whenNear(el: Element, fn: () => void) {
  const io = new IntersectionObserver(
    (es) => {
      if (es.some((e) => e.isIntersecting)) {
        io.disconnect();
        fn();
      }
    },
    { rootMargin: "900px 0px" },
  );
  io.observe(el);
  return () => io.disconnect();
}

type U = Record<string, { value: unknown }>;

/**
 * Full-bleed fragment shader (OGL via lib/gl, dpr 1). Built only near the viewport; draws only while on screen (lib/gl).
 * The CSS `fallback` background is always underneath; the canvas fades in after its first frame.
 */
function Shader({ frag, fallback, uniforms, onFrame, textures, children }: { frag: string; fallback: string; uniforms?: () => U; onFrame?: (u: U, t: number) => void; textures?: (c: HTMLCanvasElement) => Promise<TexImageSource[]> | TexImageSource[]; children?: ReactNode }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const of = useRef(onFrame);
  of.current = onFrame;
  const un = useRef(uniforms);
  const tx = useRef(textures);
  useEffect(() => {
    const c = cv.current;
    if (!c || prefersReducedMotion()) return;
    let dead = false;
    let h: GLHandle | null = null;
    const stop = whenNear(c, async () => {
      const tex = tx.current ? await tx.current(c) : [];
      if (dead) return;
      h = await createShader(c, frag, { dpr: 0.7, textures: tex, uniforms: un.current?.(), onFrame: (u, t) => of.current?.(u, t) });
      if (dead) h?.destroy();
    });
    return () => {
      dead = true;
      stop();
      h?.destroy();
    };
  }, [frag]);
  return (
    <div className="absolute inset-0" style={{ background: fallback }}>
      {children}
      <canvas ref={cv} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500" aria-hidden />
    </div>
  );
}

/* Our own small GLSL kit: hash → value noise → fbm, a 2D rotation. */
const NOISE = /* glsl */ `
float hsh(vec2 p) { p = fract(p * vec2(127.13, 311.71)); p += dot(p, p + 41.37); return fract(p.x * p.y); }
float vno(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hsh(i), hsh(i + vec2(1.0, 0.0)), f.x), mix(hsh(i + vec2(0.0, 1.0)), hsh(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  mat2 m = mat2(0.82, -0.57, 0.57, 0.82);
  for (int i = 0; i < 5; i++) { s += a * vno(p); p = m * p * 2.02 + 0.31; a *= 0.5; }
  return s;
}
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
`;

/** Kicker / headline / meta text block used on the overlays. */
function Copy({ kicker, title, meta, font = F.fr, className = "", size = "clamp(48px,5.6vw,92px)", color }: { kicker: string; title: ReactNode; meta?: string; font?: string; className?: string; size?: string; color?: string }) {
  return (
    <div className={`pointer-events-none relative z-40 ${className}`} style={{ color }}>
      <p className="text-[13px] uppercase tracking-[0.26em] opacity-75">{kicker}</p>
      <h3 className="mt-3 font-[500] leading-[0.94] tracking-[-0.02em]" style={{ fontFamily: font, fontSize: size }}>
        {title}
      </h3>
      {meta && <p className="mt-4 text-[15px] opacity-80">{meta}</p>}
    </div>
  );
}

/* ---------- M590 · Colour bends (variant of M52: wide vivid bands bend through large curves and keep flowing) ---------- */
const BENDS = /* glsl */ `${NOISE}
vec3 pal5(float i) {
  i = mod(i, 5.0);
  if (i < 0.5) return vec3(1.0, 0.24, 0.42);
  if (i < 1.5) return vec3(1.0, 0.62, 0.16);
  if (i < 2.5) return vec3(0.16, 0.86, 0.72);
  if (i < 3.5) return vec3(0.22, 0.42, 1.0);
  return vec3(0.68, 0.30, 1.0);
}
void main() {
  float asp = uRes.x / max(uRes.y, 1.0);
  vec2 p = (vUv - 0.5) * vec2(asp, 1.0);
  float t = uTime * 0.35;
  vec2 q = rot(0.38) * p;
  q.y += 0.30 * sin(q.x * 1.5 + t) + 0.12 * sin(q.x * 3.2 - t * 1.4);
  q.x += 0.10 * sin(q.y * 2.4 + t * 0.8);
  float b = q.y * 3.4 + t * 0.9;
  float i = floor(b);
  float s = fract(b);
  vec3 c = mix(pal5(i), pal5(i + 1.0), smoothstep(0.82, 1.0, s));
  float body = sin(3.14159 * s);
  vec3 col = c * (0.3 + 0.75 * body) + vec3(1.0) * pow(body, 18.0) * 0.18;
  col = mix(vec3(0.02, 0.02, 0.05), col, 0.35 + 0.65 * smoothstep(1.3, 0.2, length(p)));
  gl_FragColor = vec4(col, 1.0);
}`;
function M590() {
  return (
    <Stage className="bg-[#07060f]" g1="rgba(255,90,140,.5)">
      <Shader frag={BENDS} fallback="linear-gradient(160deg,#ff3d6b 0 20%,#ff9e29 20% 40%,#29dbb8 40% 60%,#386bff 60% 80%,#ad4dff 80%)" />
      <Sheen g1="rgba(255,150,190,.5)" opacity={0.3} />
      <div className="absolute bottom-[9%] left-[6%] rounded-[22px] bg-[#07060f]/65 px-9 py-8">
        <Copy kicker="Chroma Supply · Paint Range" title={<>Bold, bent,<br />bright.</>} meta="Matte emulsion · 4 L · ₹ 2,350" font={F.sy} className="text-white" size="clamp(44px,5vw,84px)" />
      </div>
    </Stage>
  );
}

/* ---------- M591 · Dark veil (variant of M52: a near-black veil of light drifts, with scanlines and grain) ---------- */
const VEIL = /* glsl */ `${NOISE}
void main() {
  float asp = uRes.x / max(uRes.y, 1.0);
  vec2 p = (vUv - 0.5) * vec2(asp, 1.0);
  float t = uTime * 0.16;
  vec2 w = vec2(fbm(p * 1.2 + vec2(t, 0.0)), fbm(p * 1.2 + vec2(4.0, 1.3) - vec2(0.0, t))) - 0.5;
  float v = fbm(p * 1.6 + w * 1.8 + vec2(t * 0.7, -t * 0.3));
  vec3 tint = mix(vec3(0.22, 0.14, 0.42), vec3(0.08, 0.26, 0.36), smoothstep(-0.3, 0.3, w.x));
  vec3 col = vec3(0.025, 0.028, 0.05) + tint * smoothstep(0.38, 0.9, v) * 0.85;
  col *= 0.9 + 0.1 * sin(gl_FragCoord.y * 3.14159);
  col += (hsh(gl_FragCoord.xy + fract(uTime * 7.0) * 113.0) - 0.5) * 0.03;
  col *= 1.0 - smoothstep(0.4, 1.2, length(p)) * 0.5;
  gl_FragColor = vec4(col, 1.0);
}`;
function M591() {
  return (
    <Stage className="bg-[#05060b]" g1="rgba(120,90,220,.5)" g2="rgba(40,140,170,.2)">
      <Shader frag={VEIL} fallback="radial-gradient(50% 60% at 40% 45%,#1d1638,transparent 70%),radial-gradient(40% 50% at 70% 60%,#0f2430,transparent 70%),#05060b" />
      <Sheen g1="rgba(130,100,230,.5)" opacity={0.3} />
      <div className="absolute inset-0 grid place-items-center text-center">
        <Copy kicker="Noctis Audio · Night Series" title={<>Quiet is the<br />loudest thing.</>} meta="Studio headphones · ₹ 18,900" font={F.is} className="text-[#e9e6ff]" size="clamp(56px,6.6vw,110px)" />
      </div>
    </Stage>
  );
}

/* ---------- M592 · Iridescence (variant of M52: thin-film oil-slick colours shift in waves) ---------- */
const IRID = /* glsl */ `${NOISE}
void main() {
  float asp = uRes.x / max(uRes.y, 1.0);
  vec2 p = (vUv - 0.5) * vec2(asp, 1.0);
  float t = uTime * 0.4;
  float h = fbm(p * 1.4 + vec2(t * 0.2, -t * 0.15));
  float wv = sin(p.x * 3.0 + t + h * 3.0) + sin(p.y * 4.0 - t * 1.2 + h * 4.0);
  float phase = h * 2.6 + wv * 0.22 + length(p) * 0.7 + t * 0.25;
  vec3 film = 0.5 + 0.5 * cos(6.28318 * (phase + vec3(0.0, 0.33, 0.67)));
  film = mix(film, vec3(1.0), 0.18);
  float thick = smoothstep(0.25, 0.75, h + 0.15 * wv);
  vec3 col = mix(vec3(0.04, 0.05, 0.09), film, 0.35 + 0.6 * thick);
  col += vec3(1.0) * pow(max(0.0, sin(wv * 1.6 + h * 6.0)), 14.0) * 0.18;
  gl_FragColor = vec4(col, 1.0);
}`;
function M592() {
  return (
    <Stage className="bg-[#0a0b12]" g1="rgba(150,220,255,.5)" g2="rgba(255,150,220,.25)">
      <Shader frag={IRID} fallback="conic-gradient(from 120deg at 50% 50%,#9fe8ff,#d6a8ff,#ffb3d1,#fff0a8,#a8ffd8,#9fe8ff)" />
      <Sheen g1="rgba(200,230,255,.5)" opacity={0.3} />
      <div className="absolute right-[6%] top-1/2" style={{ transform: "translateY(-50%)" }}>
        <div className="rounded-[22px] bg-[#0a0b12]/65 px-10 py-9">
          <Copy kicker="Opaline Beauty · Holo Edit" title={<>A new colour<br />at every angle.</>} meta="Prism highlighter · 8 g · ₹ 1,290" className="text-white" size="clamp(44px,4.8vw,80px)" />
        </div>
      </div>
    </Stage>
  );
}

/* ---------- M593 · Gradient waves to horizon (variant of M584: raymarched swell rolls toward a hazy horizon) ---------- */
const HORIZON = /* glsl */ `
float hgt(vec2 xz, float t) {
  return 0.20 * sin(xz.x * 0.8 + t * 0.6) * sin(xz.y * 0.55 + t * 1.2)
       + 0.12 * sin(xz.y * 1.3 + xz.x * 0.4 + t * 1.7)
       + 0.05 * sin(xz.x * 2.6 + xz.y * 2.1 + t * 2.1);
}
void main() {
  float asp = uRes.x / max(uRes.y, 1.0);
  vec2 p = (vUv - 0.5) * vec2(asp, 1.0);
  float t = uTime;
  vec3 ro = vec3(0.0, 1.0, 0.0);
  vec3 rd = normalize(vec3(p.x, p.y - 0.16, 1.1));
  vec3 haze = vec3(1.0, 0.80, 0.74);
  vec3 sky = mix(haze, vec3(0.50, 0.46, 0.80), smoothstep(0.0, 0.5, rd.y));
  sky += vec3(1.0, 0.85, 0.6) * exp(-pow((rd.y - 0.02) * 9.0, 2.0)) * 0.25;
  float d = 0.2;
  bool hit = false;
  for (int i = 0; i < 64; i++) {
    vec3 q = ro + rd * d;
    float h = q.y - hgt(q.xz, t);
    if (h < 0.002 * d) { hit = true; break; }
    d += max(h * 0.6, 0.03);
    if (d > 45.0) break;
  }
  vec3 col = sky;
  if (hit) {
    vec3 q = ro + rd * d;
    float e = 0.02;
    float h0 = hgt(q.xz, t);
    vec3 n = normalize(vec3(h0 - hgt(q.xz + vec2(e, 0.0), t), e, h0 - hgt(q.xz + vec2(0.0, e), t)));
    vec3 L = normalize(vec3(0.2, 0.5, 1.0));
    float dif = 0.5 + 0.5 * dot(n, L);
    float spec = pow(max(dot(reflect(rd, n), L), 0.0), 20.0);
    vec3 base = mix(vec3(0.26, 0.24, 0.56), vec3(0.96, 0.52, 0.56), smoothstep(-0.25, 0.3, h0));
    col = base * (0.45 + 0.65 * dif) + vec3(1.0, 0.9, 0.8) * spec * 0.35;
    col = mix(col, haze, 1.0 - exp(-d * 0.075));
  }
  gl_FragColor = vec4(col, 1.0);
}`;
function M593() {
  return (
    <Stage className="bg-[#2a2550]" g1="rgba(255,190,170,.5)" g2="rgba(130,120,220,.25)">
      <Shader frag={HORIZON} fallback="linear-gradient(180deg,#7f76cc 0%,#ffcbbd 46%,#f08a8f 52%,#4a3f8f 100%)" />
      <Sheen g1="rgba(255,200,180,.5)" opacity={0.3} />
      <div className="absolute inset-x-0 top-[10%] text-center">
        <Copy kicker="Driftline Travel · Coast Retreats" title="Toward the horizon." meta="Three nights by the sea · from ₹ 24,000" font={F.is} className="text-[#2a1f4a]" size="clamp(56px,6.4vw,108px)" />
      </div>
    </Stage>
  );
}

/* ---------- M594 · Animated paper texture (variant of M70: fibres and crumples move under the colour like printed paper) ---------- */
const PAPER = /* glsl */ `${NOISE}
float ridge(vec2 p) { return 1.0 - abs(fbm(p) * 2.0 - 1.0); }
void main() {
  float asp = uRes.x / max(uRes.y, 1.0);
  vec2 p = vUv * vec2(asp, 1.0);
  float t = uTime;
  float m = fbm(p * 1.1 + vec2(t * 0.05, -t * 0.04));
  vec3 col = mix(vec3(0.98, 0.84, 0.60), vec3(0.93, 0.44, 0.32), smoothstep(0.35, 0.68, m));
  col = mix(col, vec3(0.30, 0.42, 0.74), smoothstep(0.55, 0.78, fbm(p * 0.9 - vec2(t * 0.04, 0.0) + 3.0)) * 0.85);
  vec2 cp = p * 3.0 + 0.09 * vec2(sin(t * 0.4), cos(t * 0.33));
  float e = 0.01;
  float h0 = ridge(cp);
  vec2 g = vec2(ridge(cp + vec2(e, 0.0)) - h0, ridge(cp + vec2(0.0, e)) - h0) / e;
  vec3 n = normalize(vec3(-g * 0.06, 1.0));
  vec3 L = normalize(vec3(cos(t * 0.35), sin(t * 0.35), 1.3));
  col *= 0.8 + 0.3 * dot(n, L);
  float fib = vno(rot(0.55) * (p + vec2(t * 0.004, 0.0)) * vec2(300.0, 20.0));
  float fib2 = vno(rot(-0.9) * p * vec2(220.0, 16.0));
  col *= 0.95 + 0.04 * fib + 0.03 * fib2;
  col -= 0.05 * step(0.985, hsh(floor(vUv * uRes * 0.5)));
  gl_FragColor = vec4(col, 1.0);
}`;
function M594() {
  return (
    <Stage className="bg-[#f3e2c6]" g1="rgba(255,170,120,.5)" g2="rgba(90,120,200,.2)">
      <Shader frag={PAPER} fallback="radial-gradient(55% 60% at 35% 45%,#ee7052,transparent 70%),radial-gradient(45% 50% at 72% 62%,#4d6bbd,transparent 70%),#f9d699" />
      <Sheen g1="rgba(255,190,140,.5)" blend="soft-light" opacity={0.4} />
      <div className="absolute left-[6%] top-[9%]">
        <Copy kicker="Folio & Fold · Print Studio" title={<>Printed, then<br />touched.</>} meta="Risograph poster · A2 · ₹ 1,600" font={F.fr} className="text-[#1d1813]" size="clamp(56px,6.4vw,108px)" />
      </div>
    </Stage>
  );
}

/* ---------- M595 · Gradient blinds (variant of M16: vertical slats over a gradient; a moving spotlight catches each slat) ---------- */
const BLINDS = /* glsl */ `${NOISE}
void main() {
  float asp = uRes.x / max(uRes.y, 1.0);
  vec2 uv = vUv;
  float t = uTime;
  float n = 16.0;
  float s = fract(uv.x * n);
  float id = floor(uv.x * n);
  vec3 base = mix(vec3(0.10, 0.10, 0.32), vec3(0.62, 0.18, 0.46), uv.x + 0.15 * sin(t * 0.3));
  base = mix(base, vec3(0.04, 0.05, 0.14), smoothstep(0.7, 0.0, uv.y) * 0.4);
  vec2 sp = vec2(0.5 + 0.36 * sin(t * 0.55), 0.55 + 0.18 * cos(t * 0.41));
  vec2 dd = (uv - sp) * vec2(asp, 1.0);
  float spot = exp(-dot(dd, dd) * 5.0);
  float nx = (s - 0.5) * 1.8;
  float lam = clamp(1.0 - abs(nx - (sp.x - uv.x) * asp * 1.6), 0.0, 1.0);
  float var = 0.75 + 0.5 * vno(vec2(id * 3.1, uv.y * 2.5 + t * 0.35));
  float cyl = sin(3.14159 * s);
  vec3 lightC = mix(vec3(1.0, 0.72, 0.52), vec3(1.0, 0.92, 0.80), lam);
  vec3 col = base * (0.35 + 0.45 * cyl) + lightC * spot * (0.25 + 0.85 * lam) * var * cyl;
  col *= 1.0 - (1.0 - smoothstep(0.0, 0.05, s)) * 0.55;
  col += (hsh(gl_FragCoord.xy + fract(t) * 37.0) - 0.5) * 0.035;
  gl_FragColor = vec4(col, 1.0);
}`;
function M595() {
  return (
    <Stage className="bg-[#0d0d26]" g1="rgba(255,170,130,.5)" g2="rgba(160,60,140,.25)">
      <Shader frag={BLINDS} fallback="repeating-linear-gradient(90deg,rgba(0,0,0,.35) 0 2px,transparent 2px 90px),linear-gradient(90deg,#1a1a52,#9e2e76)" />
      <Sheen g1="rgba(255,190,150,.5)" opacity={0.3} />
      <div className="absolute bottom-[9%] left-[6%] rounded-[22px] bg-[#0b0a1e]/70 px-9 py-8">
        <Copy kicker="Slatehouse Interiors · Light Edit" title="Light, in slats." meta="Oak venetian blinds · from ₹ 6,800" font={F.sg} className="text-white" size="clamp(46px,5.2vw,86px)" />
      </div>
    </Stage>
  );
}

/* ---------- M596 · SVG wave footer (layered wave paths slide sideways at different speeds on seamless loops) ---------- */
/** A wave path two loops wide (2880 × 200 view box): `n` whole periods per 1440 so a −50% slide joins seamlessly. */
function wavePath(n: number, amp: number, base: number, phase: number) {
  let d = "M0 200";
  for (let x = 0; x <= 2880; x += 24) {
    const y = base + amp * Math.sin((x / 1440) * n * Math.PI * 2 + phase) + amp * 0.35 * Math.sin((x / 1440) * n * 2 * Math.PI * 2 + phase * 2);
    d += ` L${x} ${y.toFixed(1)}`;
  }
  return `${d} L2880 200 Z`;
}
const WAVES: { n: number; amp: number; base: number; ph: number; c: string; h: string; du: number; dir: 1 | -1 }[] = [
  { n: 2, amp: 16, base: 70, ph: 0, c: "#1b6f86", h: "62%", du: 19, dir: 1 },
  { n: 3, amp: 13, base: 80, ph: 1.4, c: "#15576f", h: "56%", du: 14, dir: -1 },
  { n: 2, amp: 18, base: 86, ph: 2.6, c: "#0f4258", h: "50%", du: 10, dir: 1 },
  { n: 4, amp: 10, base: 96, ph: 0.7, c: "#0a2f42", h: "44%", du: 7, dir: -1 },
];
function M596() {
  const root = useRef<HTMLDivElement>(null);
  const layers = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const tw = layers.current.map((l, i) => {
        const w = WAVES[i];
        return gsap.fromTo(l, { xPercent: w.dir === 1 ? 0 : -50 }, { xPercent: w.dir === 1 ? -50 : 0, duration: w.du, ease: "none", repeat: -1, paused: true });
      });
      const io = new IntersectionObserver(([e]) => tw.forEach((t) => (e.isIntersecting ? t.play() : t.pause())), { threshold: 0.05 });
      io.observe(el);
      return () => io.disconnect();
    }, el);
    return () => ctx.revert();
  }, []);
  return (
    <Stage r={root} className="bg-[#0b1220]" g1="rgba(80,200,220,.5)" g2="rgba(255,190,120,.2)">
      <div className="absolute inset-x-0 top-[9%] text-center">
        <Copy kicker="Tidewell Swim · Newsletter" title="Stay in the current." meta="First order 10% off · swimwear from ₹ 2,400" font={F.fr} className="text-white" size="clamp(48px,5.4vw,90px)" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[64%] overflow-hidden" aria-hidden>
        {WAVES.map((w, i) => (
          <div
            key={i}
            ref={(n) => {
              layers.current[i] = n;
            }}
            className="m596-wave"
            style={{ height: w.h }}
          >
            <svg viewBox="0 0 2880 200" preserveAspectRatio="none" className="block h-full w-full">
              <path d={wavePath(w.n, w.amp, w.base, w.ph)} fill={w.c} />
            </svg>
          </div>
        ))}
        <div className="absolute inset-x-0 bottom-0 h-[24%] bg-[#0a2f42]" />
      </div>
      <Sheen g1="rgba(120,220,235,.5)" opacity={0.25} />
      <footer className="pointer-events-none absolute inset-x-[6%] bottom-[6%] z-40 grid grid-cols-[1.4fr_1fr_1fr_1fr] items-end gap-8 text-white">
        <div>
          <p className="text-[clamp(36px,3.6vw,60px)] font-[700] leading-none tracking-[-0.04em]" style={{ fontFamily: F.sy }}>
            tidewell
          </p>
          <p className="mt-3 text-[13px] text-white/70">Concept website by Studio Halden</p>
        </div>
        {[
          ["Shop", "One-pieces", "Board shorts", "Towels"],
          ["Studio", "Our fabric", "Journal", "Stockists"],
          ["Help", "Sizing", "Returns", "Contact"],
        ].map(([h, ...ls]) => (
          <div key={h} className="text-[14px]">
            <p className="text-[12px] uppercase tracking-[0.24em] text-white/60">{h}</p>
            {ls.map((l) => (
              <p key={l} className="mt-2 text-white/90">
                {l}
              </p>
            ))}
          </div>
        ))}
      </footer>
    </Stage>
  );
}

/* ---------- M597 · Ordered-dither gradient (variant of M52: a drifting gradient drawn through an 8×8 Bayer dither) ---------- */
const DITHER = /* glsl */ `${NOISE}
float b2(vec2 a) { a = floor(a); return fract(a.x * 0.5 + a.y * a.y * 0.75); }
float b4(vec2 a) { return b2(0.5 * a) * 0.25 + b2(a); }
float b8(vec2 a) { return b4(0.5 * a) * 0.25 + b2(a); }
vec3 pal4(float k) {
  if (k < 0.5) return vec3(0.07, 0.08, 0.20);
  if (k < 1.5) return vec3(0.86, 0.22, 0.24);
  if (k < 2.5) return vec3(1.0, 0.62, 0.30);
  return vec3(0.98, 0.93, 0.82);
}
void main() {
  float asp = uRes.x / max(uRes.y, 1.0);
  float px = 4.0;
  vec2 cell = floor(gl_FragCoord.xy / px);
  vec2 uv = (cell + 0.5) * px / uRes;
  vec2 p = (uv - 0.5) * vec2(asp, 1.0);
  float t = uTime * 0.35;
  float lum = 0.5 + 0.32 * sin(p.x * 1.6 + t) * cos(p.y * 1.3 - t * 0.7) + 0.28 * (fbm(p * 1.5 + vec2(t * 0.4, -t * 0.25)) - 0.5) * 2.0;
  lum += 0.18 * (uv.y - 0.5);
  lum = clamp(lum, 0.0, 0.999);
  float lv = lum * 3.0;
  float fl = floor(lv);
  float k = fl + step(b8(cell), lv - fl);
  gl_FragColor = vec4(pal4(k), 1.0);
}`;
function M597() {
  return (
    <Stage className="bg-[#121433]" g1="rgba(255,120,90,.5)" g2="rgba(255,220,180,.2)">
      <Shader frag={DITHER} fallback="linear-gradient(200deg,#faeed1,#ff9e4d 35%,#db383d 65%,#121433)" />
      <Sheen g1="rgba(255,160,120,.5)" opacity={0.3} />
      <div className="absolute left-[6%] top-1/2" style={{ transform: "translateY(-50%)" }}>
        <div className="rounded-[18px] border-2 border-[#faeed1] bg-[#121433] px-9 py-8">
          <Copy kicker="Pixel Press · Zine No. 7" title={<>Printed<br />in pixels.</>} meta="48 pages · riso two-tone · ₹ 450" font={F.sg} className="text-[#faeed1]" size="clamp(48px,5.4vw,90px)" />
        </div>
      </div>
    </Stage>
  );
}

/* ---------- M598 · Drifting CMYK halftone (variant of M597: four rotated ink-dot screens over a gradient, slightly drifting) ---------- */
const CMYK = /* glsl */ `${NOISE}
float screen(float ang, float val, vec2 off, float cell) {
  vec2 q = rot(ang) * (gl_FragCoord.xy + off) / cell;
  vec2 f = fract(q) - 0.5;
  float r = sqrt(clamp(val, 0.0, 1.0)) * 0.64;
  return 1.0 - smoothstep(r - 0.08, r + 0.08, length(f));
}
void main() {
  float asp = uRes.x / max(uRes.y, 1.0);
  vec2 p = (vUv - 0.5) * vec2(asp, 1.0);
  float t = uTime;
  float m = fbm(p * 1.2 + vec2(t * 0.06, -t * 0.05));
  vec3 rgb = mix(vec3(0.98, 0.40, 0.36), vec3(0.20, 0.55, 0.92), smoothstep(-0.6, 0.6, p.x + 0.3 * sin(t * 0.3)));
  rgb = mix(rgb, vec3(1.0, 0.86, 0.30), smoothstep(0.45, 0.72, m));
  rgb *= 0.75 + 0.25 * smoothstep(-0.5, 0.5, p.y);
  float K = 1.0 - max(rgb.r, max(rgb.g, rgb.b));
  vec3 cmy = (1.0 - rgb - K) / max(1.0 - K, 0.001);
  float cell = 10.0;
  float dc = screen(0.2618, cmy.x, vec2(sin(t * 0.30), cos(t * 0.27)) * 5.0, cell);
  float dm = screen(1.309, cmy.y, vec2(cos(t * 0.23), sin(t * 0.31)) * 5.0, cell);
  float dy = screen(0.0, cmy.z, vec2(sin(t * 0.21 + 1.0), cos(t * 0.25)) * 5.0, cell);
  float dk = screen(0.7854, K, vec2(cos(t * 0.19), sin(t * 0.22 + 2.0)) * 5.0, cell);
  vec3 col = vec3(0.97, 0.95, 0.90);
  col *= mix(vec3(1.0), vec3(0.0, 0.68, 0.94), dc * 0.9);
  col *= mix(vec3(1.0), vec3(0.93, 0.08, 0.55), dm * 0.9);
  col *= mix(vec3(1.0), vec3(1.0, 0.92, 0.0), dy * 0.9);
  col *= mix(vec3(1.0), vec3(0.12, 0.12, 0.14), dk * 0.9);
  gl_FragColor = vec4(col, 1.0);
}`;
function M598() {
  return (
    <Stage className="bg-[#f6f2e6]" g1="rgba(0,170,240,.5)" g2="rgba(240,20,140,.25)">
      <Shader
        frag={CMYK}
        fallback="radial-gradient(circle,rgba(0,174,240,.75) 2.6px,transparent 3px) 0 0/10px 10px,radial-gradient(circle,rgba(236,20,140,.7) 2.6px,transparent 3px) 5px 5px/10px 10px,linear-gradient(90deg,#fde3dc,#d9ecfb)"
      />
      <Sheen g1="rgba(0,170,240,.5)" blend="multiply" opacity={0.18} />
      <div className="absolute bottom-[9%] right-[6%] rounded-[18px] bg-[#f6f2e6]/92 px-9 py-8 text-right">
        <Copy kicker="Halftone Supply Co. · Poster Club" title={<>Four inks,<br />one mood.</>} meta="Screen-printed poster · 50 × 70 cm · ₹ 1,200" font={F.sy} className="text-[#16161a]" size="clamp(46px,5.2vw,86px)" />
      </div>
    </Stage>
  );
}

/* ---------- M599 · Lit halftone silk (variant of M598: lit, draped silk drawn as halftone dots; the pointer sends ripples) ---------- */
const SILK = /* glsl */ `
uniform vec3 uR0, uR1, uR2, uR3;
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float rip(vec2 fc, vec3 r) {
  if (r.z < 0.0 || r.z > 4.0) return 0.0;
  float d = length(fc - r.xy) / uRes.y;
  float x = d - r.z * 0.32;
  return 0.05 * sin(x * 42.0) * exp(-x * x * 50.0) * exp(-r.z * 0.9);
}
float silk(vec2 fc, float t) {
  vec2 p = fc / uRes.y;
  float h = 0.5 * sin(p.x * 3.1 + t * 0.7 + 0.8 * sin(p.y * 2.3 - t * 0.5))
          + 0.3 * sin(p.y * 4.2 + p.x * 1.3 - t * 0.9)
          + 0.12 * sin(p.x * 7.0 - p.y * 5.0 + t * 1.3);
  return h + rip(fc, uR0) + rip(fc, uR1) + rip(fc, uR2) + rip(fc, uR3);
}
void main() {
  float t = uTime;
  float cell = 9.0;
  float a = 0.52;
  vec2 q = rot(a) * gl_FragCoord.xy / cell;
  vec2 f = fract(q) - 0.5;
  vec2 cc = rot(-a) * ((floor(q) + 0.5) * cell);
  float e = 2.0;
  float h0 = silk(cc, t);
  vec2 g = vec2(silk(cc + vec2(e, 0.0), t) - h0, silk(cc + vec2(0.0, e), t) - h0) / (e / uRes.y);
  vec3 n = normalize(vec3(-g * 0.32, 1.0));
  vec3 L = normalize(vec3(-0.45, 0.55, 0.75));
  float dif = max(dot(n, L), 0.0);
  float spec = pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), 22.0);
  float b = clamp(0.06 + 0.72 * dif * dif + 0.55 * spec, 0.0, 1.0);
  float r = sqrt(b) * 0.58;
  float m = 1.0 - smoothstep(r - 0.08, r + 0.08, length(f));
  vec3 bg = vec3(0.10, 0.04, 0.10);
  vec3 dotC = mix(vec3(0.78, 0.42, 0.44), vec3(1.0, 0.92, 0.80), b);
  gl_FragColor = vec4(mix(bg, dotC, m), 1.0);
}`;
function M599() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const st = useRef({ rips: [0, 0, 0, 0].map(() => ({ x: 0, y: 0, at: -1e9 })), i: 0, last: -1e9 });
  usePointer(
    root,
    dot,
    (t, w, h) => [w * (0.5 + 0.34 * Math.sin(t * 0.62)), h * (0.5 + 0.26 * Math.sin(t * 1.07 + 1.1))],
    (x, y) => {
      const s = st.current;
      const now = performance.now();
      const el = root.current;
      if (!el || now - s.last < 520) return;
      s.last = now;
      s.rips[s.i % 4] = { x, y: el.clientHeight - y, at: now };
      s.i++;
    },
  );
  return (
    <Stage r={root} className="bg-[#1a081a]" g1="rgba(255,170,160,.5)" g2="rgba(200,90,140,.25)">
      <Shader
        frag={SILK}
        fallback="radial-gradient(circle,#f2c7b0 2.4px,transparent 2.8px) 0 0/9px 9px,radial-gradient(60% 70% at 40% 40%,#5a2440,#1a081a)"
        uniforms={() => ({ uR0: { value: [0, 0, -1] }, uR1: { value: [0, 0, -1] }, uR2: { value: [0, 0, -1] }, uR3: { value: [0, 0, -1] } })}
        onFrame={(u) => {
          const now = performance.now();
          st.current.rips.forEach((r, i) => {
            u[`uR${i}`].value = [r.x, r.y, (now - r.at) / 1000];
          });
        }}
      />
      <Sheen g1="rgba(255,180,170,.5)" opacity={0.3} />
      <Dot r={dot} />
      <div className="absolute left-[6%] top-[9%] rounded-[22px] bg-[#1a081a]/70 px-9 py-8">
        <Copy kicker="Satin Row · Evening Wear" title={<>Silk that<br />answers back.</>} meta="Bias-cut slip dress · ₹ 14,500" font={F.is} className="text-[#fff0e6]" size="clamp(50px,5.6vw,94px)" />
      </div>
    </Stage>
  );
}

/* ---------- M600 · Dithered dot field with cut-out wordmark (variant of M597: drifting Bayer-dithered dots, wordmark left empty, dots brighten at the pointer) ---------- */
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function M600() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const st = useRef({ w: 0, h: 0, cols: 0, rows: 0, mask: new Uint8Array(0), fontsOk: false, waiting: false, shown: false });
  const CELL = 9;
  usePointer(
    root,
    dot,
    (t, w, h) => [w * (0.5 + 0.4 * Math.sin(t * 0.55)), h * (0.55 + 0.22 * Math.sin(t * 1.1 + 0.6))],
    (px, py, _dt, t) => {
      const c = cv.current;
      const el = root.current;
      if (!c || !el) return;
      const s = st.current;
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!s.fontsOk && !s.waiting) {
        s.waiting = true;
        document.fonts.ready.then(() => {
          s.fontsOk = true;
          s.w = 0; // rebuild the mask with the real font
        });
      }
      if (w !== s.w || h !== s.h) {
        s.w = w;
        s.h = h;
        c.width = w;
        c.height = h;
        s.cols = Math.ceil(w / CELL);
        s.rows = Math.ceil(h / CELL);
        // wordmark mask: draw the word once off screen, then read its alpha at every cell centre
        const off = document.createElement("canvas");
        off.width = w;
        off.height = h;
        const o = off.getContext("2d");
        s.mask = new Uint8Array(s.cols * s.rows);
        if (o) {
          const size = Math.min(w * 0.2, h * 0.42);
          o.font = `800 ${size}px 'Syne Variable', 'Space Grotesk Variable', system-ui, sans-serif`;
          o.textAlign = "center";
          o.textBaseline = "middle";
          o.fillStyle = "#fff";
          o.fillText("OSSORA", w / 2, h * 0.47);
          const data = o.getImageData(0, 0, w, h).data;
          for (let j = 0; j < s.rows; j++)
            for (let i = 0; i < s.cols; i++) {
              const x = Math.min(w - 1, i * CELL + (CELL >> 1));
              const y = Math.min(h - 1, j * CELL + (CELL >> 1));
              s.mask[j * s.cols + i] = data[(y * w + x) * 4 + 3] > 110 ? 1 : 0;
            }
        }
      }
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      const buckets = [new Path2D(), new Path2D(), new Path2D()];
      const R = 140 * 140 * 2;
      for (let j = 0; j < s.rows; j++) {
        const y = j * CELL + CELL / 2;
        for (let i = 0; i < s.cols; i++) {
          if (s.mask[j * s.cols + i]) continue;
          const x = i * CELL + CELL / 2;
          let v = 0.36 + 0.2 * Math.sin(x * 0.011 + t * 0.7) + 0.16 * Math.sin(y * 0.02 - t * 0.5 + x * 0.005) + 0.12 * Math.sin((x + y) * 0.007 + t * 0.9);
          const dx = x - px;
          const dy = y - py;
          const g = Math.exp(-(dx * dx + dy * dy) / R);
          v += g * 0.75;
          const th = (BAYER4[(i & 3) + ((j & 3) << 2)] + 0.5) / 16;
          if (v <= th) continue;
          const b = g > 0.3 ? 2 : v > 0.72 ? 1 : 0;
          const r = b === 2 ? 2.2 : 1.6;
          buckets[b].rect(x - r, y - r, r * 2, r * 2);
        }
      }
      ctx.fillStyle = "rgba(190,200,230,.42)";
      ctx.fill(buckets[0]);
      ctx.fillStyle = "rgba(225,232,255,.78)";
      ctx.fill(buckets[1]);
      ctx.fillStyle = "#ffb15a";
      ctx.fill(buckets[2]);
      if (!s.shown) {
        s.shown = true;
        c.style.opacity = "1";
      }
    },
  );
  return (
    <Stage r={root} className="bg-[#0a0c14]" g1="rgba(255,170,90,.5)" g2="rgba(120,140,255,.22)">
      {/* static fallback: a plain dot grid with the wordmark knocked out in the page colour */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle,rgba(200,210,240,.45) 1.6px,transparent 1.9px) 0 0/9px 9px" }} aria-hidden>
        <p className="absolute inset-x-0 top-[47%] -translate-y-1/2 text-center text-[min(20vw,26vh)] font-[800] leading-none text-[#0a0c14]" style={{ fontFamily: F.sy }}>
          OSSORA
        </p>
      </div>
      <canvas ref={cv} className="absolute inset-0 h-full w-full bg-[#0a0c14] opacity-0 transition-opacity duration-300" aria-hidden />
      <Sheen g1="rgba(255,170,90,.5)" opacity={0.3} />
      <Dot r={dot} />
      <div className="pointer-events-none absolute inset-x-[6%] top-[8%] z-40 flex items-start justify-between text-white">
        <p className="text-[13px] uppercase tracking-[0.26em] text-white/75">Ossora · Outdoor Gear</p>
        <p className="text-[14px] text-white/75">Trail shell · ₹ 9,800</p>
      </div>
      <div className="pointer-events-none absolute inset-x-[6%] bottom-[7%] z-40 flex items-end justify-between text-[14px] text-white/85">
        <div className="flex gap-8">
          <span>Shells</span>
          <span>Packs</span>
          <span>Field notes</span>
          <span>Stockists</span>
        </div>
        <span className="text-[13px] text-white/65">Concept website by Studio Halden</span>
      </div>
    </Stage>
  );
}

/* ---------- M601 · Breathing shape grid (variant of M60: dots, triangles and rings breathe along moving waves; a word is cut out) ---------- */
const BREATH = /* glsl */ `
float sdTri(vec2 p, float r) {
  const float k = 1.7320508;
  p.x = abs(p.x) - r;
  p.y = p.y + r / k;
  if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  p.x -= clamp(p.x, -2.0 * r, 0.0);
  return -length(p) * sign(p.y);
}
void main() {
  float asp = uRes.x / max(uRes.y, 1.0);
  float cell = 18.0;
  vec2 c = floor(gl_FragCoord.xy / cell);
  vec2 f = fract(gl_FragCoord.xy / cell) - 0.5;
  vec2 cuv = (c + 0.5) * cell / uRes;
  vec2 p = (cuv - 0.5) * vec2(asp, 1.0);
  float t = uTime;
  float w1 = sin(length(p - vec2(-0.7, -0.4)) * 9.0 - t * 2.2);
  float w2 = sin(p.x * 5.0 + p.y * 3.0 - t * 1.4);
  float w = 0.5 + 0.28 * w1 + 0.22 * w2;
  float s = mix(0.08, 0.44, w);
  float k = mod(c.x + c.y * 2.0, 3.0);
  float d;
  if (k < 0.5) d = length(f) - s;
  else if (k < 1.5) d = sdTri(f, s * 0.95);
  else d = abs(length(f) - s * 0.85) - 0.07;
  float m = 1.0 - smoothstep(-0.04, 0.04, d);
  float txt = texture2D(uTex0, cuv).a;
  m *= 1.0 - step(0.5, txt);
  vec3 bg = vec3(0.035, 0.07, 0.07);
  vec3 ink = mix(vec3(0.16, 0.55, 0.50), vec3(0.80, 1.0, 0.55), w);
  gl_FragColor = vec4(mix(bg, ink, m), 1.0);
}`;
/** White wordmark on a transparent canvas the size of the stage (the shader leaves those cells empty). */
async function breatheText(c: HTMLCanvasElement): Promise<TexImageSource[]> {
  await document.fonts.ready;
  const r = (c.parentElement ?? c).getBoundingClientRect();
  const w = Math.max(2, Math.round(r.width));
  const h = Math.max(2, Math.round(r.height));
  const t = document.createElement("canvas");
  t.width = w;
  t.height = h;
  const o = t.getContext("2d");
  if (o) {
    o.font = `800 ${Math.min(w * 0.16, h * 0.4)}px 'Syne Variable', 'Space Grotesk Variable', system-ui, sans-serif`;
    o.textAlign = "center";
    o.textBaseline = "middle";
    o.fillStyle = "#fff";
    o.fillText("BREATHE", w / 2, h * 0.46);
  }
  return [t];
}
function M601() {
  return (
    <Stage className="bg-[#091212]" g1="rgba(150,240,170,.5)" g2="rgba(60,170,160,.22)">
      <Shader frag={BREATH} fallback="radial-gradient(circle,#4fbf9a 4px,transparent 4.6px) 0 0/18px 18px,#091212" textures={breatheText}>
        <p className="absolute inset-x-0 top-[46%] -translate-y-1/2 text-center text-[min(16vw,40vh)] font-[800] leading-none text-[#091212]" style={{ fontFamily: F.sy }} aria-hidden>
          BREATHE
        </p>
      </Shader>
      <Sheen g1="rgba(170,255,190,.5)" opacity={0.3} />
      <div className="pointer-events-none absolute inset-x-[6%] bottom-[8%] z-40 flex items-end justify-between text-white">
        <div>
          <p className="text-[13px] uppercase tracking-[0.26em] text-white/75">Still Room · Yoga Studio</p>
          <p className="mt-2 text-[22px] font-[500]" style={{ fontFamily: F.mr }}>
            Morning flow · 6:30 am daily
          </p>
        </div>
        <span className="rounded-full bg-[#ccff8c] px-6 py-3 text-[14px] font-[600] text-[#091212]">Membership · ₹ 3,500 / month</span>
      </div>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M590", name: "Colour bends", how: "Wide vivid colour bands bend through large slow curves and keep flowing across the stage (shader, always on)", kind: "play", C: M590 },
  { code: "M591", name: "Dark veil", how: "A near-black veil of soft light drifts behind the headline with faint scanlines and grain, very low contrast (shader)", kind: "play", C: M591 },
  { code: "M592", name: "Iridescence", how: "Oil-slick thin-film colours shift in waves across the surface as the film thickness flows (shader)", kind: "play", C: M592 },
  { code: "M593", name: "Gradient waves to horizon", how: "Raymarched sine swell rolls toward a hazy pastel horizon, lit and fogged with distance (shader)", kind: "play", C: M593 },
  { code: "M594", name: "Animated paper texture", how: "Paper fibres and soft crumples, lit by a slowly turning light, move under drifting print colour (shader)", kind: "play", C: M594 },
  { code: "M595", name: "Gradient blinds", how: "Vertical slats over a gradient; a roaming spotlight and noise make each slat catch the light differently (shader)", kind: "play", C: M595 },
  { code: "M596", name: "SVG wave footer", how: "Four layered SVG waves slide sideways at different speeds and directions on seamless loops behind the footer (GSAP, on screen)", kind: "play", C: M596 },
  { code: "M597", name: "Ordered-dither gradient", how: "A slowly moving gradient is drawn through an 8×8 Bayer dither in four print colours: chunky retro pixels (shader)", kind: "play", C: M597 },
  { code: "M598", name: "Drifting CMYK halftone", how: "A gradient printed as four rotated CMYK dot screens; each screen drifts slightly out of register (shader)", kind: "play", C: M598 },
  { code: "M599", name: "Lit halftone silk", how: "Draped, lit silk is drawn as halftone dots; the pointer (auto-driven) sends rings of ripples through it (shader)", kind: "play", C: M599 },
  { code: "M600", name: "Dithered dot field with cut-out wordmark", how: "A drifting Bayer-dithered dot field leaves a footer wordmark empty; dots grow and warm under the auto-driven pointer (canvas)", kind: "play", C: M600 },
  { code: "M601", name: "Breathing shape grid", how: "A grid of dots, triangles and rings breathes in size along two moving waves; a word is cut out of the grid (shader)", kind: "play", C: M601 },
];
