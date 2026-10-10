"use client";

// Ambient motions, batch 11 · group 4 (MOTION-MENU M566–M577). Small focused demos for /lab/motion.
// Every demo is "play": it starts when it is on screen, loops, and pauses off screen. Each one also has a CSS-only glow
// loop that never stops (a second one sits ON TOP of full-bleed canvases). Pointer demos drive a visible fake pointer by
// themselves; the real mouse takes over while it moves. WebGL demos build their context only near the viewport, at dpr 1.
// ?static=1 / reduced motion: no JS motion, CSS loops stop, the markup (CSS fallbacks) shows a sensible final state.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { createShader, type GLHandle } from "@/lib/gl";
import { useTicker } from "@/components/fx/shared";
import { Pic, Product } from "@/components/sections/kit";
import type { MotionDef } from "./types";

const F = {
  sg: "'Space Grotesk Variable', system-ui, sans-serif",
  fr: "'Fraunces Variable', Georgia, serif",
  is: "'Instrument Serif', Georgia, serif",
  sy: "'Syne Variable', 'Space Grotesk Variable', system-ui, sans-serif",
  mr: "'Manrope Variable', system-ui, sans-serif",
};

const CSS = `
.b11g4-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.42)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.2)),transparent 70%);animation:b11g4-drift 5.6s linear infinite alternate;will-change:transform}
@keyframes b11g4-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b11g4-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4);pointer-events:none;z-index:40;opacity:0;transition:opacity .25s}
.b11g4-dot.ink{border-color:rgba(20,20,24,.9);background:rgba(20,20,24,.12);box-shadow:0 0 0 6px rgba(20,20,24,.06)}

/* M566 halo horizontal flow */
.m566-halo,.m566-edge{position:absolute;pointer-events:none;background:linear-gradient(90deg,#ff5f6d,#ffc371,#47e5bc,#4f8dff,#b06bff,#ff5f6d,#ffc371,#47e5bc,#4f8dff,#b06bff,#ff5f6d);background-size:200% 100%;background-position:100% 50%;animation:m566-flow 3.6s linear infinite;animation-play-state:paused}
.m566-halo{inset:-26px;border-radius:52px;filter:blur(30px);opacity:.8}
.m566-edge{inset:-2px;border-radius:32px}
.m566-on .m566-halo,.m566-on .m566-edge{animation-play-state:running}
@keyframes m566-flow{0%{background-position:100% 50%}100%{background-position:0% 50%}}

/* M573 drifting blobs */
.m573-orbit{position:absolute;left:var(--cx);top:var(--cy);width:0;height:0;animation:m573-spin var(--d) linear infinite;animation-direction:var(--dir);animation-play-state:paused}
.m573-blob{position:absolute;width:var(--s);height:var(--s);left:calc(var(--s) / -2);top:calc(var(--s) / -2);border-radius:50%;background:radial-gradient(circle,var(--c) 0%,var(--c) 22%,transparent 68%);mix-blend-mode:hard-light;transform:translate3d(var(--r),0,0)}
.m573-on .m573-orbit{animation-play-state:running}
@keyframes m573-spin{0%{transform:rotate(var(--a0))}100%{transform:rotate(calc(var(--a0) + 360deg))}}

html.is-static .b11g4-glow,html.is-static .m566-halo,html.is-static .m566-edge,html.is-static .m573-orbit{animation:none}
html.is-static {
  .b11g4-glow,.m566-halo,.m566-edge,.m573-orbit{animation:none}
}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", g1, g2, style }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string; style?: CSSProperties }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0d16] text-[#eef2ff] ${className}`} style={style}>
      <style href="b11g4-css" precedence="default">
        {CSS}
      </style>
      <div className="b11g4-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/** The CSS glow loop again, ON TOP of a full-bleed canvas (screen blend), so canvas demos never freeze. */
const Sheen = ({ g1 }: { g1?: string }) => (
  <div className="b11g4-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.45, zIndex: 35 } as CSSProperties} aria-hidden />
);

/** The visible fake pointer ring. */
const Dot = ({ r, ink = false }: { r: RefObject<HTMLDivElement | null>; ink?: boolean }) => <div ref={r} className={`b11g4-dot ${ink ? "ink" : ""}`} aria-hidden />;

/** CSS-driven demos: toggles `cls` on the root while it is on screen (CSS keyframes run only then). */
function useOnClass(ref: RefObject<HTMLElement | null>, cls: string) {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const io = new IntersectionObserver(([e]) => el.classList.toggle(cls, e.isIntersecting), { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, cls]);
}

/**
 * Pointer for "pointer" demos: every frame (on screen) it reports a position in root px. The real mouse wins for 2 s after
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
function Shader({ frag, fallback, uniforms, onFrame, textures }: { frag: string; fallback: string; uniforms?: () => U; onFrame?: (u: U, t: number) => void; textures?: () => Promise<TexImageSource[]> | TexImageSource[] }) {
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
      const tex = tx.current ? await tx.current() : [];
      if (dead) return;
      h = await createShader(c, frag, { dpr: 1, textures: tex, uniforms: un.current?.(), onFrame: (u, t) => of.current?.(u, t) });
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
      <canvas ref={cv} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500" aria-hidden />
    </div>
  );
}

/** Our own value noise + fbm (GLSL). */
const NOISE = /* glsl */ `
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++){ s += a * vn(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return s; }
`;

/* ---------- M566 · Halo horizontal flow (variant of M192: the halo's colours slide left → right, not rotate) ---------- */
function M566() {
  const root = useRef<HTMLDivElement>(null);
  useOnClass(root, "m566-on");
  return (
    <Stage r={root} className="bg-[#07080d]" g1="rgba(120,110,255,.36)" g2="rgba(71,229,188,.2)">
      <div className="grid h-full place-items-center">
        <div className="relative w-[min(460px,40%)]">
          <div className="m566-halo" aria-hidden />
          <div className="m566-edge" aria-hidden />
          <div className="relative rounded-[30px] bg-[#0b0d14] p-9">
            <p className="text-[13px] uppercase tracking-[0.26em] text-white/55">Lumen Studio · Pro</p>
            <h3 className="mt-4 text-[clamp(40px,3.8vw,60px)] font-[650] leading-[0.95] tracking-[-0.03em]" style={{ fontFamily: F.sg }}>
              Studio Pass
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-white/65">Unlimited renders, priority queue and the full colour library.</p>
            <div className="mt-7 flex items-end justify-between">
              <p className="tabular-nums" style={{ fontFamily: F.sg }}>
                <span className="text-[44px] font-[650] tracking-[-0.03em]">₹ 2,400</span>
                <span className="ml-2 text-[14px] text-white/50">/ month</span>
              </p>
              <span className="rounded-full bg-white px-5 py-3 text-[14px] font-[600] text-[#0b0d14]">Start free</span>
            </div>
          </div>
        </div>
      </div>
    </Stage>
  );
}

/* ---------- M567 · Pulsing border glow (variant of M37: aurora light hugs the inside edges and breathes) ---------- */
const BORDER = /* glsl */ `
${NOISE}
void main(){
  vec2 px = vUv * uRes; vec2 c = 0.5 * uRes; float s = uRes.y / 700.0;
  vec2 hb = 0.5 * uRes - 22.0 * s; float rad = 34.0 * s;
  vec2 q = abs(px - c) - hb + rad;
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - rad;
  float inn = max(-d, 0.0) / s;
  vec2 dv = (px - c) / uRes; float ang = atan(dv.y, dv.x);
  float t = uTime;
  float pulse = 0.5 + 0.5 * sin(t * 1.5);
  float swell = 0.5 + 0.5 * sin(ang * 3.0 - t * 1.1);
  float n = vn(vec2(ang * 2.2 + t * 0.35, t * 0.25));
  float w = 16.0 + 80.0 * pulse * (0.3 + 0.7 * swell) + 46.0 * n;
  float glow = exp(-inn / w);
  float hue = ang / 6.2832 + t * 0.05 + n * 0.3;
  vec3 col = 0.5 + 0.5 * cos(6.2832 * (hue + vec3(0.0, 0.33, 0.67)));
  col = mix(col, vec3(0.42, 1.0, 0.82), 0.3);
  float line = exp(-inn / 2.2) * (0.5 + 0.4 * pulse);
  vec3 base = vec3(0.022, 0.026, 0.045);
  vec3 o = base + col * (glow * (0.45 + 0.75 * pulse) + line);
  o = mix(o, base * 0.5, smoothstep(0.0, 1.5, d));
  gl_FragColor = vec4(o, 1.0);
}`;
function M567() {
  return (
    <Stage className="bg-[#05060a]" g1="rgba(110,255,210,.5)" g2="rgba(160,110,255,.25)">
      <Shader frag={BORDER} fallback="radial-gradient(120% 120% at 50% 50%,#05060b 62%,rgba(110,255,210,.35) 88%,rgba(160,110,255,.5) 100%)" />
      <Sheen g1="rgba(110,255,210,.5)" />
      <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center text-center">
        <div>
          <p className="text-[13px] uppercase tracking-[0.3em] text-white/60">Members&apos; night · 14 Nov</p>
          <h3 className="mt-4 text-[clamp(52px,6vw,96px)] font-[500] leading-[0.92] tracking-[-0.02em]" style={{ fontFamily: F.fr }}>
            After hours, in colour.
          </h3>
          <p className="mt-5 text-[15px] text-white/65">Gallery Noor · 60 seats · ₹ 1,500</p>
        </div>
      </div>
    </Stage>
  );
}

/* ---------- M568 · Breathing rim-lit logo (variant of M37: light behind a glyph, rays scatter out, brightness breathes) ---------- */
function paintMark() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const x = c.getContext("2d")!;
  x.fillStyle = "#000";
  x.fillRect(0, 0, 512, 512);
  x.fillStyle = "#fff";
  x.strokeStyle = "#fff";
  // ring with two gaps
  x.lineWidth = 34;
  x.lineCap = "butt";
  x.beginPath();
  x.arc(256, 256, 196, -1.35, 1.35);
  x.stroke();
  x.beginPath();
  x.arc(256, 256, 196, Math.PI - 1.35, Math.PI + 1.35);
  x.stroke();
  // a bold "H": two bars + a crossbar
  x.fillRect(158, 132, 52, 248);
  x.fillRect(302, 132, 52, 248);
  x.fillRect(200, 232, 112, 44);
  return [c];
}
const RIM = /* glsl */ `
float mk(vec2 p){ vec2 q = p + 0.5; if (q.x < 0.0 || q.y < 0.0 || q.x > 1.0 || q.y > 1.0) return 0.0; return texture2D(uTex0, q).r; }
float lit(vec2 p){ float l = smoothstep(0.46, 0.0, length(p)); return l * (1.0 - mk(p)); }
void main(){
  vec2 p = (vUv * uRes - 0.5 * uRes) / (uRes.y * 0.62);
  float breath = 0.62 + 0.38 * sin(uTime * 1.25);
  vec2 dir = p / 44.0 * 0.92;
  vec2 sp = p; float acc = 0.0; float wgt = 1.0;
  for (int i = 0; i < 44; i++){ sp -= dir; acc += lit(sp) * wgt; wgt *= 0.955; }
  acc *= 0.085 * (0.55 + 0.9 * breath);
  float m = mk(p);
  float e = 0.009;
  float mn = min(min(mk(p + vec2(e, 0.0)), mk(p - vec2(e, 0.0))), min(mk(p + vec2(0.0, e)), mk(p - vec2(0.0, e))));
  float rim = m * (1.0 - mn);
  float r = length(p);
  vec3 ray = mix(vec3(1.0, 0.92, 0.82), vec3(0.55, 0.45, 1.0), smoothstep(0.1, 0.9, r));
  vec3 col = vec3(0.02, 0.018, 0.035) + ray * acc;
  col = mix(col, vec3(0.03, 0.03, 0.045), m);
  col += rim * vec3(1.0, 0.9, 0.78) * (0.7 + 0.6 * breath);
  gl_FragColor = vec4(col, 1.0);
}`;
function M568() {
  return (
    <Stage className="bg-[#040308]" g1="rgba(150,120,255,.5)" g2="rgba(255,210,170,.22)">
      <Shader
        frag={RIM}
        textures={paintMark}
        fallback="radial-gradient(circle at 50% 50%,rgba(255,236,214,.7) 0%,rgba(150,120,255,.35) 22%,transparent 52%),#040308"
      />
      <Sheen g1="rgba(150,120,255,.5)" />
      <div className="pointer-events-none absolute bottom-[8%] left-[6%] z-40">
        <p className="text-[13px] uppercase tracking-[0.3em] text-white/55">Halden Audio</p>
        <h3 className="mt-3 text-[clamp(40px,4.2vw,68px)] font-[400] leading-[0.95]" style={{ fontFamily: F.is }}>
          Listen in the dark.
        </h3>
      </div>
      <p className="pointer-events-none absolute bottom-[8%] right-[6%] z-40 text-right text-[14px] text-white/60">
        Studio headphones
        <br />₹ 18,900
      </p>
    </Stage>
  );
}

/* ---------- M569 · Light pillar (variant of M61: one vertical shaft behind the product; core shimmers, haze breathes) ---------- */
const PILLAR = /* glsl */ `
${NOISE}
void main(){
  vec2 p = (vUv * uRes - 0.5 * uRes) / uRes.y;
  float t = uTime;
  float wob = 0.01 * sin(p.y * 8.0 + t * 1.3) + 0.006 * sin(p.y * 17.0 - t * 2.1);
  float dx = abs(p.x - wob);
  float sh = vn(vec2(p.y * 7.0 - t * 1.8, t * 0.6)) * 0.6 + vn(vec2(p.y * 19.0 + t * 2.4, 3.0)) * 0.4;
  float core = exp(-dx * dx * 1400.0) * (0.6 + 0.7 * sh);
  float breath = 0.6 + 0.4 * sin(t * 0.95);
  float haze = exp(-dx * dx * 16.0) * (0.28 + 0.22 * breath) * (0.65 + 0.35 * fbm(vec2(p.x * 3.0, p.y * 2.0 - t * 0.3)));
  float mid = exp(-dx * dx * 160.0) * (0.35 + 0.25 * breath);
  float vfade = smoothstep(-0.62, -0.05, p.y) * 0.4 + smoothstep(0.62, -0.1, p.y) * 0.6;
  float floorGlow = exp(-pow((p.y + 0.36) * 9.0, 2.0)) * exp(-p.x * p.x * 6.0) * (0.25 + 0.2 * breath);
  vec3 col = vec3(0.012, 0.016, 0.03);
  col += vec3(0.35, 0.55, 1.0) * haze;
  col += vec3(0.6, 0.8, 1.0) * mid * vfade;
  col += vec3(0.92, 0.97, 1.0) * core * vfade;
  col += vec3(0.4, 0.6, 1.0) * floorGlow;
  gl_FragColor = vec4(col, 1.0);
}`;
function M569() {
  return (
    <Stage className="bg-[#03050b]" g1="rgba(110,160,255,.5)" g2="rgba(190,220,255,.2)">
      <Shader frag={PILLAR} fallback="linear-gradient(90deg,transparent 42%,rgba(110,160,255,.3) 48%,rgba(235,245,255,.9) 50%,rgba(110,160,255,.3) 52%,transparent 58%),#03050b" />
      <Sheen g1="rgba(110,160,255,.5)" />
      <div className="pointer-events-none absolute inset-x-0 bottom-[6%] top-[12%] z-40 flex justify-center">
        <Product angle={1} accent="#7fb0ff" className="h-full drop-shadow-[0_30px_40px_rgba(0,0,0,.6)]" />
      </div>
      <div className="pointer-events-none absolute left-[6%] top-1/2 z-40 max-w-[28%] -translate-y-1/2">
        <p className="text-[13px] uppercase tracking-[0.28em] text-white/55">Glacier Tonic</p>
        <h3 className="mt-3 text-[clamp(40px,4.4vw,72px)] font-[700] leading-[0.92] tracking-[-0.03em]" style={{ fontFamily: F.sg }}>
          Cold light.
        </h3>
      </div>
      <p className="pointer-events-none absolute right-[6%] top-1/2 z-40 -translate-y-1/2 text-right text-[15px] text-white/70">
        Sparkling yuzu · 330 ml
        <br />
        <b className="text-[22px] text-white">₹ 180</b>
      </p>
    </Stage>
  );
}

/* ---------- M570 · Light reveals content at cursor (variant of M197: the content itself is masked bright, no dark overlay) ---------- */
function M570Content() {
  return (
    <div className="grid h-full grid-cols-[1.15fr_1fr] items-center gap-[4%] px-[6%]">
      <div>
        <p className="text-[13px] uppercase tracking-[0.3em] text-[#ffb36b]">Chapter 03 · The archive</p>
        <h3 className="mt-4 text-[clamp(46px,5vw,82px)] font-[500] leading-[0.94] tracking-[-0.02em]" style={{ fontFamily: F.fr }}>
          What the lamp remembers.
        </h3>
        <p className="mt-5 max-w-[46ch] text-[16px] leading-relaxed text-white/80">
          Hand-blown amber shades, brass stems turned on a 1960s lathe and a cotton cord in four colours. Every lamp is numbered and signed.
        </p>
        <p className="mt-6 text-[15px] text-white/90">Ember table lamp · ₹ 12,800</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Pic i={3} ratio="3/4" />
        <Pic i={1} ratio="3/4" className="mt-[18%]" />
      </div>
    </div>
  );
}
function M570() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const cur = useRef({ x: 0, y: 0, ready: false });
  usePointer(
    root,
    dot,
    (t, w, h) => [w * (0.5 + 0.38 * Math.sin(t * 0.75)), h * (0.5 + 0.28 * Math.sin(t * 1.3 + 0.6))],
    (x, y, dt) => {
      const el = root.current;
      if (!el) return;
      const c = cur.current;
      if (!c.ready) Object.assign(c, { x, y, ready: true });
      const k = 1 - Math.exp(-dt * 10);
      c.x += (x - c.x) * k;
      c.y += (y - c.y) * k;
      el.style.setProperty("--x", `${c.x}px`);
      el.style.setProperty("--y", `${c.y}px`);
    },
  );
  const mask = "radial-gradient(circle 230px at var(--x) var(--y),#000 0%,#000 38%,transparent 100%)";
  return (
    <Stage r={root} className="bg-[#0a0807]" g1="rgba(255,170,90,.36)" g2="rgba(120,90,255,.18)" style={{ "--x": "32%", "--y": "46%" } as CSSProperties}>
      {/* the same content twice: dim (~15%) underneath, full colour on top through a soft circle at the pointer */}
      <div className="absolute inset-0 opacity-[0.15] grayscale" aria-hidden>
        <M570Content />
      </div>
      <div className="absolute inset-0" style={{ WebkitMaskImage: mask, maskImage: mask }}>
        <M570Content />
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ---------- M571 · Coloured glow follows cursor (variant of M197: a big blended colour light trails the pointer on a light page) ---------- */
function M571() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const ga = useRef<HTMLDivElement>(null);
  const gb = useRef<HTMLDivElement>(null);
  const st = useRef({ ax: 0, ay: 0, bx: 0, by: 0, ready: false });
  usePointer(
    root,
    dot,
    (t, w, h) => [w * (0.5 + 0.36 * Math.sin(t * 0.9)), h * (0.5 + 0.26 * Math.sin(t * 1.55 + 1.1))],
    (x, y, dt, t) => {
      const s = st.current;
      if (!s.ready) Object.assign(s, { ax: x, ay: y, bx: x, by: y, ready: true });
      const ka = 1 - Math.exp(-dt * 4.2);
      const kb = 1 - Math.exp(-dt * 1.8);
      s.ax += (x - s.ax) * ka;
      s.ay += (y - s.ay) * ka;
      s.bx += (x - s.bx) * kb;
      s.by += (y - s.by) * kb;
      if (ga.current) ga.current.style.transform = `translate3d(${s.ax}px,${s.ay}px,0) scale(${1 + 0.06 * Math.sin(t * 2)})`;
      if (gb.current) gb.current.style.transform = `translate3d(${s.bx}px,${s.by}px,0)`;
    },
  );
  const glow = "pointer-events-none absolute left-0 top-0 rounded-full";
  return (
    <Stage r={root} className="border-black/10 text-[#16161a]" g1="rgba(255,190,120,.4)" g2="rgba(120,140,255,.25)" style={{ background: "#efeae1" }}>
      <div className="absolute inset-0 flex flex-col justify-between px-[6%] py-[5%]">
        <div className="flex justify-between text-[14px] uppercase tracking-[0.22em]">
          <span className="font-[700]">Paloma Works</span>
          <span className="opacity-70">Index · Studio · Contact</span>
        </div>
        <h3 className="max-w-[16ch] text-[clamp(56px,6.6vw,108px)] font-[600] leading-[0.9] tracking-[-0.04em]" style={{ fontFamily: F.sg }}>
          Quiet things, loudly made.
        </h3>
        <div className="flex justify-between text-[15px]">
          <span className="opacity-80">Ceramics & lighting · Goa</span>
          <span className="font-[600]">Shop the kiln drop · from ₹ 2,900</span>
        </div>
      </div>
      {/* the trailing colour lights (fixed gradients, blended into the page) */}
      <div
        ref={gb}
        className={glow}
        style={{ width: 640, height: 640, margin: "-320px 0 0 -320px", background: "radial-gradient(circle,rgba(110,90,255,.85) 0%,rgba(110,90,255,.35) 38%,transparent 68%)", mixBlendMode: "multiply", transform: "translate3d(40vw,30vh,0)" }}
        aria-hidden
      />
      <div
        ref={ga}
        className={glow}
        style={{ width: 440, height: 440, margin: "-220px 0 0 -220px", background: "radial-gradient(circle,rgba(255,96,60,.9) 0%,rgba(255,150,60,.4) 40%,transparent 70%)", mixBlendMode: "multiply", transform: "translate3d(40vw,30vh,0)" }}
        aria-hidden
      />
      <Dot r={dot} ink />
    </Stage>
  );
}

/* ---------- M572 · Spectral ribbon (variant of M205: one thin ribbon with prism-split edges on black) ---------- */
const RIBBON = /* glsl */ `
float fy(float x, float t){ return 0.17 * sin(x * 2.1 + t * 0.62) + 0.085 * sin(x * 4.3 - t * 0.95 + 1.3) + 0.04 * sin(x * 7.7 + t * 0.5); }
float band(vec2 p, float t, float off){
  float y = fy(p.x + off * 0.6, t) + off;
  float w = 0.004 + 0.034 * abs(sin(p.x * 1.6 - t * 0.55));
  float d = abs(p.y - y);
  float edge = exp(-abs(d - w) * 260.0);
  float body = smoothstep(w, w * 0.2, d) * 0.22;
  float halo = exp(-d * 16.0) * 0.12;
  return edge + body + halo;
}
void main(){
  vec2 p = (vUv * uRes - 0.5 * uRes) / uRes.y;
  float t = uTime;
  float a = 0.22 * sin(t * 0.21);
  p = mat2(cos(a), -sin(a), sin(a), cos(a)) * p;
  p.x += 0.12 * sin(t * 0.17);
  float sp = 0.008 + 0.012 * (0.5 + 0.5 * sin(p.x * 3.0 + t * 0.8));
  vec3 col = vec3(band(p, t, sp), band(p, t, 0.0), band(p, t, -sp));
  col *= vec3(1.0, 0.92, 1.1);
  col *= smoothstep(1.05, 0.55, abs(p.x));
  gl_FragColor = vec4(col + vec3(0.008, 0.008, 0.014), 1.0);
}`;
function M572() {
  return (
    <Stage className="bg-black" g1="rgba(170,120,255,.5)" g2="rgba(80,220,255,.2)">
      <Shader frag={RIBBON} fallback="linear-gradient(170deg,transparent 47%,rgba(255,80,120,.6) 48.5%,rgba(255,255,255,.85) 50%,rgba(80,170,255,.6) 51.5%,transparent 53%),#000" />
      <Sheen g1="rgba(170,120,255,.5)" />
      <div className="pointer-events-none absolute left-[6%] top-[9%] z-40">
        <p className="text-[13px] uppercase tracking-[0.3em] text-white/55">Prism Optical · Lens 02</p>
      </div>
      <div className="pointer-events-none absolute bottom-[9%] right-[6%] z-40 text-right">
        <h3 className="text-[clamp(40px,4.4vw,72px)] font-[400] leading-[0.95]" style={{ fontFamily: F.is }}>
          Every colour, one line.
        </h3>
        <p className="mt-3 text-[15px] text-white/60">Anti-glare blue lenses · ₹ 5,600</p>
      </div>
    </Stage>
  );
}

/* ---------- M573 · Drifting blobs + pointer blob (variant of M52: five orbiting blended blobs and one that trails the pointer) ---------- */
const BLOBS = [
  { c: "rgba(255,92,120,.95)", s: "820px", r: "14vw", d: "24s", a0: "0deg", dir: "normal", cx: "38%", cy: "40%" },
  { c: "rgba(255,186,80,.9)", s: "720px", r: "11vw", d: "31s", a0: "120deg", dir: "reverse", cx: "60%", cy: "56%" },
  { c: "rgba(90,140,255,.95)", s: "880px", r: "16vw", d: "36s", a0: "220deg", dir: "normal", cx: "52%", cy: "36%" },
  { c: "rgba(70,225,190,.85)", s: "660px", r: "9vw", d: "20s", a0: "300deg", dir: "reverse", cx: "30%", cy: "64%" },
  { c: "rgba(170,100,255,.9)", s: "760px", r: "13vw", d: "28s", a0: "60deg", dir: "normal", cx: "72%", cy: "38%" },
];
function M573() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const pb = useRef<HTMLDivElement>(null);
  const st = useRef({ x: 0, y: 0, ready: false });
  useOnClass(root, "m573-on");
  usePointer(
    root,
    dot,
    (t, w, h) => [w * (0.5 + 0.34 * Math.sin(t * 0.8)), h * (0.5 + 0.3 * Math.sin(t * 1.4 + 0.4))],
    (x, y, dt) => {
      const s = st.current;
      if (!s.ready) Object.assign(s, { x, y, ready: true });
      const k = 1 - Math.exp(-dt * 2.4);
      s.x += (x - s.x) * k;
      s.y += (y - s.y) * k;
      if (pb.current) pb.current.style.transform = `translate3d(${s.x}px,${s.y}px,0)`;
    },
  );
  return (
    <Stage r={root} className="bg-[#120a24]" g1="rgba(255,140,200,.4)" g2="rgba(90,140,255,.3)">
      <div className="absolute inset-0 overflow-hidden" style={{ isolation: "isolate", background: "linear-gradient(140deg,#1a0d33,#0d1a3a)" }}>
        {BLOBS.map((b, i) => (
          <div key={i} className="m573-orbit" style={{ "--cx": b.cx, "--cy": b.cy, "--d": b.d, "--a0": b.a0, "--dir": b.dir } as CSSProperties}>
            <div className="m573-blob" style={{ "--c": b.c, "--s": b.s, "--r": b.r } as CSSProperties} />
          </div>
        ))}
        {/* the sixth blob trails the pointer */}
        <div
          ref={pb}
          className="pointer-events-none absolute left-0 top-0 rounded-full"
          style={{ width: 520, height: 520, margin: "-260px 0 0 -260px", background: "radial-gradient(circle,rgba(255,240,170,.95) 0%,rgba(255,200,120,.5) 28%,transparent 66%)", mixBlendMode: "hard-light", transform: "translate3d(46vw,32vh,0)" }}
          aria-hidden
        />
      </div>
      <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center text-center">
        <div>
          <p className="text-[13px] uppercase tracking-[0.3em] text-white/75">Soft Spectrum · Summer edit</p>
          <h3 className="mt-4 text-[clamp(56px,6.4vw,104px)] font-[700] leading-[0.9] tracking-[-0.04em]" style={{ fontFamily: F.sy }}>
            Colour, unhurried.
          </h3>
          <p className="mt-5 text-[15px] text-white/80">Linen sets from ₹ 3,400</p>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ---------- M574 · Metaball blobs (variant of M52: soft blobs merge where they touch; the nearest leans toward the pointer) ---------- */
const META = /* glsl */ `
uniform vec3 uB0, uB1, uB2, uB3, uB4;
float fld(vec2 p, vec3 b){ vec2 d = p - b.xy; return b.z * b.z / max(dot(d, d), 1e-4); }
void main(){
  vec2 p = (vUv * uRes - 0.5 * uRes) / uRes.y;
  float f0 = fld(p, uB0), f1 = fld(p, uB1), f2 = fld(p, uB2), f3 = fld(p, uB3), f4 = fld(p, uB4);
  float f = f0 + f1 + f2 + f3 + f4;
  vec3 c = (f0 * vec3(1.0, 0.42, 0.5) + f1 * vec3(1.0, 0.72, 0.32) + f2 * vec3(0.4, 0.55, 1.0) + f3 * vec3(0.32, 0.92, 0.78) + f4 * vec3(0.7, 0.45, 1.0)) / f;
  float m = smoothstep(0.92, 1.06, f);
  float rim = smoothstep(0.95, 1.02, f) - smoothstep(1.05, 1.5, f);
  float inner = smoothstep(1.0, 4.0, f);
  vec3 bg = mix(vec3(0.03, 0.03, 0.06), vec3(0.06, 0.04, 0.1), vUv.y);
  bg += c * smoothstep(0.35, 0.95, f) * 0.18;
  vec3 blob = c * (0.75 + 0.35 * inner) + rim * 0.35;
  gl_FragColor = vec4(mix(bg, blob, m), 1.0);
}`;
const MB = [
  { ax: 0.42, ay: 0.2, wx: 0.31, wy: 0.43, ph: 0.0, r: 0.15 },
  { ax: 0.36, ay: 0.24, wx: 0.39, wy: 0.27, ph: 1.7, r: 0.13 },
  { ax: 0.48, ay: 0.16, wx: 0.23, wy: 0.35, ph: 3.1, r: 0.17 },
  { ax: 0.3, ay: 0.22, wx: 0.45, wy: 0.31, ph: 4.4, r: 0.12 },
  { ax: 0.4, ay: 0.14, wx: 0.28, wy: 0.5, ph: 5.6, r: 0.11 },
];
function M574() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const ptr = useRef({ x: 0, y: 0, on: false });
  const spring = useRef({ i: 0, ox: 0, oy: 0, vx: 0, vy: 0, last: -1 });
  usePointer(
    root,
    dot,
    (t, w, h) => [w * (0.5 + 0.33 * Math.sin(t * 0.7)), h * (0.5 + 0.3 * Math.sin(t * 1.2 + 0.9))],
    (x, y) => {
      const el = root.current;
      if (!el) return;
      const h = el.clientHeight || 1;
      ptr.current = { x: (x - el.clientWidth / 2) / h, y: (h / 2 - y) / h, on: true };
    },
  );
  const onFrame = (u: U, t: number) => {
    const s = spring.current;
    const dt = s.last < 0 ? 0.016 : Math.min(0.05, t - s.last);
    s.last = t;
    const ps = MB.map((b) => [b.ax * Math.sin(t * b.wx + b.ph), b.ay * Math.cos(t * b.wy + b.ph * 1.3), b.r]);
    const p = ptr.current;
    // nearest blob leans toward the pointer on a spring (switching blobs hands the offset over smoothly)
    let near = 0;
    let best = 1e9;
    ps.forEach((b, i) => {
      const d = (b[0] - p.x) ** 2 + (b[1] - p.y) ** 2;
      if (d < best) [best, near] = [d, i];
    });
    if (near !== s.i) {
      s.i = near;
      s.vx *= 0.5;
      s.vy *= 0.5;
    }
    const nb = ps[near];
    const tx = p.on ? Math.max(-0.16, Math.min(0.16, (p.x - nb[0]) * 0.45)) : 0;
    const ty = p.on ? Math.max(-0.16, Math.min(0.16, (p.y - nb[1]) * 0.45)) : 0;
    const k = 38;
    const c = 2 * Math.sqrt(k) * 0.55;
    s.vx += ((tx - s.ox) * k - s.vx * c) * dt;
    s.vy += ((ty - s.oy) * k - s.vy * c) * dt;
    s.ox += s.vx * dt;
    s.oy += s.vy * dt;
    nb[0] += s.ox;
    nb[1] += s.oy;
    ps.forEach((b, i) => ((u[`uB${i}`] as { value: number[] }).value = b));
  };
  return (
    <Stage r={root} className="bg-[#07060d]" g1="rgba(255,120,160,.5)" g2="rgba(100,140,255,.25)">
      <Shader
        frag={META}
        uniforms={() => Object.fromEntries(MB.map((b, i) => [`uB${i}`, { value: [0, 0, b.r] }]))}
        onFrame={onFrame}
        fallback="radial-gradient(18% 30% at 42% 48%,rgba(255,110,130,.95) 60%,transparent 62%),radial-gradient(16% 26% at 56% 52%,rgba(100,140,255,.95) 60%,transparent 62%),#07060d"
      />
      <Sheen g1="rgba(255,120,160,.5)" />
      <div className="pointer-events-none absolute bottom-[8%] left-[6%] z-40">
        <p className="text-[13px] uppercase tracking-[0.3em] text-white/60">Merge · Gummy vitamins</p>
        <h3 className="mt-3 text-[clamp(40px,4.4vw,72px)] font-[700] leading-[0.92] tracking-[-0.03em]" style={{ fontFamily: F.sy }}>
          Better together.
        </h3>
      </div>
      <p className="pointer-events-none absolute bottom-[8%] right-[6%] z-40 text-right text-[15px] text-white/70">
        Mixed jar · 60 pieces
        <br />
        <b className="text-[22px] text-white">₹ 899</b>
      </p>
      <Dot r={dot} />
    </Stage>
  );
}

/* ---------- M575 · Liquid metal surface (variant of M52: domain-warped flow lit with sharp specular bands) ---------- */
const METAL = /* glsl */ `
${NOISE}
float hgt(vec2 p, vec2 q, float t){ return fbm(p * 1.4 + 2.2 * q + vec2(t * 0.05, -t * 0.04)); }
void main(){
  vec2 p = (vUv * uRes - 0.5 * uRes) / uRes.y;
  float t = uTime;
  vec2 q = vec2(fbm(p * 1.6 + vec2(t * 0.07, 0.0)), fbm(p * 1.6 + vec2(5.2, 1.3) - vec2(0.0, t * 0.06)));
  float e = 0.004;
  float h = hgt(p, q, t);
  float hx = hgt(p + vec2(e, 0.0), q, t);
  float hy = hgt(p + vec2(0.0, e), q, t);
  vec3 n = normalize(vec3(-(hx - h) / e, -(hy - h) / e, 1.6));
  float s = 0.5 + 0.5 * cos(6.2832 * (h * 2.6 + n.x * 0.55 + n.y * 0.25 + t * 0.06));
  vec3 dark = vec3(0.07, 0.08, 0.1);
  vec3 silver = vec3(0.84, 0.87, 0.92);
  vec3 col = mix(dark, silver, pow(s, 2.6));
  col += smoothstep(0.9, 0.985, s) * vec3(1.0, 0.98, 0.95) * 0.7;
  col = mix(col, col * vec3(0.85, 0.92, 1.1), smoothstep(0.2, 0.8, q.x));
  col = mix(col, col * vec3(1.1, 0.96, 0.86), smoothstep(0.35, 0.9, q.y) * 0.6);
  float spec = pow(max(dot(n, normalize(vec3(-0.4, 0.6, 0.7))), 0.0), 40.0);
  col += spec * 0.5;
  col *= 0.75 + 0.25 * smoothstep(1.1, 0.2, length(p));
  gl_FragColor = vec4(col, 1.0);
}`;
function M575() {
  return (
    <Stage className="bg-[#0b0c10]" g1="rgba(200,215,240,.42)" g2="rgba(255,210,170,.2)">
      <Shader frag={METAL} fallback="linear-gradient(160deg,#16181e 0%,#cfd5de 30%,#2a2d35 46%,#e9edf3 62%,#1c1f26 80%,#9aa3b0 100%)" />
      <Sheen g1="rgba(220,230,255,.42)" />
      <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center text-center">
        <div className="rounded-[24px] bg-black/35 px-12 py-9">
          <p className="text-[13px] uppercase tracking-[0.32em] text-white/70">Ferro Atelier · Cast cookware</p>
          <h3 className="mt-4 text-[clamp(56px,6.2vw,100px)] font-[700] leading-[0.9] tracking-[-0.04em]" style={{ fontFamily: F.sg }}>
            Forged in flux.
          </h3>
          <p className="mt-5 text-[15px] text-white/80">Carbon-steel wok · ₹ 4,250</p>
        </div>
      </div>
    </Stage>
  );
}

/* ---------- M576 · Noisy 3D blobs (OGL spheres with vertex noise: fly in from depth, pulse + twist, follow the pointer) ---------- */
const BLOB_VERT = /* glsl */ `
attribute vec3 position;
attribute vec3 normal;
uniform mat4 modelViewMatrix, projectionMatrix;
uniform mat3 normalMatrix;
uniform float uTime, uSeed, uAmp;
varying vec3 vN; varying vec3 vP; varying float vH;
float h31(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vn3(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1.0, 0.0, 0.0)), f.x), mix(h31(i + vec3(0.0, 1.0, 0.0)), h31(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
             mix(mix(h31(i + vec3(0.0, 0.0, 1.0)), h31(i + vec3(1.0, 0.0, 1.0)), f.x), mix(h31(i + vec3(0.0, 1.0, 1.0)), h31(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z); }
vec3 disp(vec3 p){
  float a = p.y * 0.9 * sin(uTime * 0.45 + uSeed);
  float c = cos(a), s = sin(a);
  p.xz = mat2(c, -s, s, c) * p.xz;
  float n = vn3(p * 1.7 + vec3(uTime * 0.3 + uSeed, uTime * 0.2, -uTime * 0.25)) * 2.0 - 1.0;
  n += 0.5 * (vn3(p * 3.4 - uTime * 0.4 + uSeed) * 2.0 - 1.0);
  float pulse = 1.0 + 0.06 * sin(uTime * 1.6 + uSeed * 3.0);
  return p * (1.0 + uAmp * n) * pulse;
}
void main(){
  vec3 p = normalize(position);
  vec3 up = abs(p.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 t1 = normalize(cross(p, up)); vec3 t2 = cross(p, t1);
  float e = 0.03;
  vec3 a = disp(p); vec3 b = disp(normalize(p + t1 * e)); vec3 c = disp(normalize(p + t2 * e));
  vec3 nr = normalize(cross(b - a, c - a));
  if (dot(nr, p) < 0.0) nr = -nr;
  vN = normalize(normalMatrix * nr);
  vec4 mv = modelViewMatrix * vec4(a, 1.0);
  vP = mv.xyz; vH = length(a);
  gl_Position = projectionMatrix * mv;
}`;
const BLOB_FRAG = /* glsl */ `
precision highp float;
uniform float uHue, uTime;
varying vec3 vN; varying vec3 vP; varying float vH;
void main(){
  vec3 n = normalize(vN); vec3 v = normalize(-vP);
  vec3 l = normalize(vec3(0.5, 0.7, 0.6));
  float fr = pow(1.0 - max(dot(n, v), 0.0), 2.2);
  float h = uHue + (vH - 1.0) * 1.3 + n.y * 0.12 + uTime * 0.02;
  vec3 base = 0.55 + 0.45 * cos(6.2832 * (h + vec3(0.0, 0.3, 0.6)));
  float dif = 0.4 + 0.6 * max(dot(n, l), 0.0);
  float sp = pow(max(dot(reflect(-l, n), v), 0.0), 28.0);
  gl_FragColor = vec4(base * dif + fr * vec3(0.9, 0.82, 1.0) * 0.55 + sp * 0.45, 1.0);
}`;
const B3 = [
  { x: -1.7, y: 0.25, z: 0, r: 1.05, hue: 0.62, seed: 0.3, amp: 0.22 },
  { x: 0.45, y: -0.35, z: -0.6, r: 1.25, hue: 0.92, seed: 2.1, amp: 0.26 },
  { x: 2.15, y: 0.55, z: -1.2, r: 0.8, hue: 0.15, seed: 4.7, amp: 0.2 },
];
function M576() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const ptr = useRef({ x: 0, y: 0 });
  usePointer(
    root,
    dot,
    (t, w, h) => [w * (0.5 + 0.34 * Math.sin(t * 0.85)), h * (0.5 + 0.28 * Math.sin(t * 1.3 + 0.5))],
    (x, y) => {
      const el = root.current;
      if (!el) return;
      ptr.current = { x: (x / el.clientWidth) * 2 - 1, y: 1 - (y / el.clientHeight) * 2 };
    },
  );
  useEffect(() => {
    const canvas = cv.current;
    const el = root.current;
    if (!canvas || !el || prefersReducedMotion()) return;
    let dead = false;
    let cleanup = () => {};
    const stop = whenNear(el, async () => {
      const ogl = await import("ogl");
      if (dead) return;
      try {
        const { Renderer, Camera, Transform, Sphere, Program, Mesh } = ogl;
        const renderer = new Renderer({ canvas, dpr: 1, alpha: true, antialias: true });
        const gl = renderer.gl;
        gl.clearColor(0, 0, 0, 0);
        const camera = new Camera(gl, { fov: 35 });
        camera.position.z = 8;
        const scene = new Transform();
        const group = new Transform();
        group.setParent(scene);
        const geo = new Sphere(gl, { radius: 1, widthSegments: 80, heightSegments: 56 });
        const meshes = B3.map((b) => {
          const program = new Program(gl, {
            vertex: BLOB_VERT,
            fragment: BLOB_FRAG,
            uniforms: { uTime: { value: 0 }, uSeed: { value: b.seed }, uAmp: { value: b.amp }, uHue: { value: b.hue } },
          });
          const m = new Mesh(gl, { geometry: geo, program });
          m.scale.set(b.r, b.r, b.r);
          m.position.set(b.x, b.y, -40);
          m.setParent(group);
          return { m, program, b };
        });
        const resize = () => {
          const r = el.getBoundingClientRect();
          renderer.setSize(Math.max(1, r.width), Math.max(1, r.height));
          canvas.style.width = "100%";
          canvas.style.height = "100%";
          camera.perspective({ aspect: r.width / Math.max(1, r.height) });
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(el);
        // fly in from depth the first time the stage is on screen
        const fly = { v: 0 };
        let flown = false;
        let visible = false;
        const io = new IntersectionObserver(
          ([e]) => {
            visible = e.isIntersecting;
            if (visible && !flown) {
              flown = true;
              gsap.to(fly, { v: 1, duration: 1.9, ease: "power3.out" });
            }
          },
          { threshold: 0.1 },
        );
        io.observe(el);
        const sm = { x: 0, y: 0 };
        const t0 = performance.now();
        let raf = 0;
        let shown = false;
        const loop = () => {
          raf = requestAnimationFrame(loop);
          if (!visible) return;
          const t = (performance.now() - t0) / 1000;
          sm.x += (ptr.current.x - sm.x) * 0.05;
          sm.y += (ptr.current.y - sm.y) * 0.05;
          group.rotation.y = sm.x * 0.35;
          group.rotation.x = -sm.y * 0.25;
          meshes.forEach(({ m, program, b }, i) => {
            const k = gsap.utils.clamp(0, 1, fly.v * 1.25 - i * 0.12);
            program.uniforms.uTime.value = t;
            m.position.x = b.x + sm.x * 0.35 * (i + 1) * 0.5 + Math.sin(t * 0.4 + b.seed) * 0.12;
            m.position.y = b.y + sm.y * 0.3 * (i + 1) * 0.5 + Math.cos(t * 0.5 + b.seed) * 0.14;
            m.position.z = -40 + (b.z + 40) * k;
            m.rotation.y = t * 0.2 + b.seed;
          });
          renderer.render({ scene, camera });
          if (!shown) {
            shown = true;
            canvas.style.opacity = "1";
          }
        };
        raf = requestAnimationFrame(loop);
        cleanup = () => {
          cancelAnimationFrame(raf);
          ro.disconnect();
          io.disconnect();
          gsap.killTweensOf(fly);
          gl.getExtension("WEBGL_lose_context")?.loseContext();
        };
        if (dead) cleanup();
      } catch (err) {
        console.warn("[M576] WebGL off, showing the fallback:", (err as Error).message);
      }
    });
    return () => {
      dead = true;
      stop();
      cleanup();
    };
  }, []);
  return (
    <Stage r={root} className="bg-[#0a0812]" g1="rgba(140,120,255,.5)" g2="rgba(255,140,170,.25)">
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(14% 26% at 26% 44%,#5f7cff 0%,#3b3fa8 70%,transparent 72%),radial-gradient(17% 32% at 54% 56%,#ff6fa4 0%,#a03a78 70%,transparent 72%),radial-gradient(11% 20% at 79% 38%,#ffc36a 0%,#b07a2a 70%,transparent 72%)" }}
        aria-hidden
      >
        <canvas ref={cv} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500" style={{ background: "#0a0812" }} />
      </div>
      <Sheen g1="rgba(140,120,255,.5)" />
      <div className="pointer-events-none absolute left-[6%] top-[9%] z-40">
        <p className="text-[13px] uppercase tracking-[0.3em] text-white/60">Moodform · Sound objects</p>
      </div>
      <div className="pointer-events-none absolute bottom-[8%] left-[6%] z-40">
        <h3 className="text-[clamp(40px,4.4vw,72px)] font-[700] leading-[0.92] tracking-[-0.03em]" style={{ fontFamily: F.sy }}>
          Objects that breathe.
        </h3>
        <p className="mt-3 text-[15px] text-white/70">Ambient speaker trio · ₹ 21,500</p>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ---------- M577 · Glass spheres over flowing gradient (variant of M52: refracting, magnifying lenses drift over the flow) ---------- */
const GLASS = /* glsl */ `
${NOISE}
vec3 flow(vec2 p, float t){
  float w = fbm(p * 2.0 + vec2(t * 0.05, -t * 0.04));
  float n = fbm(p * 1.4 + vec2(t * 0.08, -t * 0.05) + 1.6 * w);
  vec3 a = vec3(0.98, 0.42, 0.38), b = vec3(0.35, 0.36, 0.95), c = vec3(1.0, 0.78, 0.45), d = vec3(0.12, 0.62, 0.66);
  vec3 col = mix(b, a, smoothstep(0.3, 0.7, n));
  col = mix(col, c, smoothstep(0.55, 0.85, n + p.y * 0.25) * 0.8);
  col = mix(col, d, smoothstep(0.45, 0.2, n) * 0.7);
  return col;
}
void main(){
  vec2 p = (vUv * uRes - 0.5 * uRes) / uRes.y;
  float t = uTime;
  vec3 col = flow(p, t) * 0.92;
  for (int i = 0; i < 4; i++){
    float fi = float(i);
    vec2 c = vec2(0.62 * sin(t * (0.16 + fi * 0.04) + fi * 1.9), 0.24 * cos(t * (0.21 + fi * 0.03) + fi * 2.7));
    float r = 0.11 + 0.035 * fi;
    vec2 d = p - c;
    float l = length(d);
    if (l < r + 0.004){
      float z = sqrt(max(r * r - l * l, 0.0));
      vec3 n = vec3(d, z) / r;
      vec2 sp = c + d * 0.42 - n.xy * r * 0.35;
      vec3 g = flow(sp, t) * 1.08;
      float fr = pow(1.0 - n.z, 3.0);
      g = mix(g, vec3(1.0), fr * 0.35);
      g *= 0.82 + 0.18 * n.z;
      float spec = pow(max(dot(n, normalize(vec3(-0.45, 0.55, 0.75))), 0.0), 70.0);
      g += spec * 0.9;
      g += smoothstep(r * 0.72, r, l) * smoothstep(0.0, -0.6, n.y) * 0.18;
      col = mix(col, g, smoothstep(r + 0.004, r - 0.002, l));
    }
    float sh = smoothstep(r * 1.5, r * 0.6, length(p - c - vec2(0.03, -0.05)));
    col *= 1.0 - sh * 0.08 * step(r, l);
  }
  gl_FragColor = vec4(col, 1.0);
}`;
function M577() {
  return (
    <Stage className="bg-[#2a2560]" g1="rgba(255,170,140,.42)" g2="rgba(90,110,255,.25)">
      <Shader
        frag={GLASS}
        fallback="radial-gradient(9% 16% at 36% 46%,rgba(255,255,255,.55),rgba(255,255,255,.08) 70%,transparent 72%),radial-gradient(12% 22% at 64% 54%,rgba(255,255,255,.5),rgba(255,255,255,.08) 70%,transparent 72%),linear-gradient(120deg,#5a5cf2,#fa6b60 55%,#ffc673)"
      />
      <Sheen g1="rgba(255,190,160,.42)" />
      <div className="pointer-events-none absolute left-[6%] top-[9%] z-40">
        <p className="text-[13px] uppercase tracking-[0.3em] text-white/80">Lumière Glassworks</p>
      </div>
      <div className="pointer-events-none absolute bottom-[8%] right-[6%] z-40 text-right">
        <h3 className="text-[clamp(44px,4.8vw,78px)] font-[500] leading-[0.92] tracking-[-0.02em]" style={{ fontFamily: F.fr }}>
          See it differently.
        </h3>
        <p className="mt-3 text-[15px] text-white/85">Hand-blown paperweights · ₹ 3,600</p>
      </div>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M566", name: "Halo horizontal flow", how: "A blurred rainbow halo behind the card slides its colours left to right on a loop", kind: "play", C: M566 },
  { code: "M567", name: "Pulsing border glow", how: "Aurora light hugs the inside edges of the frame, swells and recedes on a loop (shader)", kind: "play", C: M567 },
  { code: "M568", name: "Breathing rim-lit logo", how: "A mark is lit from behind; rays scatter out and the light breathes by itself (shader radial blur)", kind: "play", C: M568 },
  { code: "M569", name: "Light pillar", how: "One vertical shaft of light behind the product; the core shimmers and the haze breathes (shader)", kind: "play", C: M569 },
  { code: "M570", name: "Light reveals content at cursor", how: "Dim content lifts to full colour inside a soft circle at the pointer (mask, scripted glide)", kind: "play", C: M570 },
  { code: "M571", name: "Coloured glow follows cursor", how: "Two big colour lights trail the pointer with lag and tint the light page (multiply blend)", kind: "play", C: M571 },
  { code: "M572", name: "Spectral ribbon", how: "One thin light ribbon with prism-split edges drifts and twists on black (shader)", kind: "play", C: M572 },
  { code: "M573", name: "Drifting blobs + pointer blob", how: "Five blended colour blobs orbit on 20–36 s loops; a sixth trails the pointer", kind: "play", C: M573 },
  { code: "M574", name: "Metaball blobs", how: "Soft blobs drift and merge where they touch; the nearest leans to the pointer on a spring (shader)", kind: "play", C: M574 },
  { code: "M575", name: "Liquid metal surface", how: "Domain-warped flow lit with sharp specular bands reads as molten chrome (shader)", kind: "play", C: M575 },
  { code: "M576", name: "Noisy 3D blobs", how: "Noise-displaced spheres fly in from depth, pulse and twist, then follow the pointer (OGL)", kind: "play", C: M576 },
  { code: "M577", name: "Glass spheres over flowing gradient", how: "Glass spheres drift over a flowing gradient, refracting and magnifying it (shader)", kind: "play", C: M577 },
];
