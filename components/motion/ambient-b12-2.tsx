"use client";

// Ambient motions, batch 12 · group 2 (MOTION-MENU M602–M613): light beams, rays, trails and flowing lines.
// "play" demos start when on screen, loop, and pause off screen. The one "scrub" demo (M613) maps the panel's scroll
// linearly onto its lines. Every demo has a CSS-only glow loop that never stops (a second one sits ON TOP of full-bleed
// canvases / shaders). WebGL demos build their context only near the viewport, at dpr 1; canvases pause off screen.
// ?static=1 / reduced motion: no JS motion, CSS loops stop, the markup (CSS fallbacks) shows a sensible final state.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { createShader, type GLHandle } from "@/lib/gl";
import { useScrub, useTicker } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = {
  sg: "'Space Grotesk Variable', system-ui, sans-serif",
  fr: "'Fraunces Variable', Georgia, serif",
  is: "'Instrument Serif', Georgia, serif",
  sy: "'Syne Variable', 'Space Grotesk Variable', system-ui, sans-serif",
  mr: "'Manrope Variable', system-ui, sans-serif",
};

const CSS = `
.b12g2-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.42)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.2)),transparent 70%);animation:b12g2-drift 5.6s linear infinite alternate;will-change:transform}
@keyframes b12g2-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}

/* M605 beam sweep over grid */
.m605-grid,.m605-lit{position:absolute;inset:0;background-size:56px 56px;background-position:center}
.m605-grid{background-image:linear-gradient(rgba(255,255,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.07) 1px,transparent 1px)}
.m605-lit{background-image:linear-gradient(rgba(150,225,255,.95) 1px,transparent 1px),linear-gradient(90deg,rgba(150,225,255,.95) 1px,transparent 1px);-webkit-mask-image:linear-gradient(90deg,transparent,#000 50%,transparent);mask-image:linear-gradient(90deg,transparent,#000 50%,transparent);-webkit-mask-size:24% 100%;mask-size:24% 100%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-position:50% 0;mask-position:50% 0;animation:m605-mask 7s linear infinite alternate;animation-play-state:paused}
.m605-beam{position:absolute;top:0;bottom:0;left:0;width:24%;pointer-events:none;background:linear-gradient(90deg,transparent,rgba(120,210,255,.1) 38%,rgba(225,247,255,.75) 50%,rgba(120,210,255,.1) 62%,transparent);transform:translate3d(158%,0,0);animation:m605-beam 7s linear infinite alternate;animation-play-state:paused}
.m605-on .m605-lit,.m605-on .m605-beam{animation-play-state:running}
@keyframes m605-mask{0%{-webkit-mask-position:0% 0;mask-position:0% 0}100%{-webkit-mask-position:100% 0;mask-position:100% 0}}
@keyframes m605-beam{0%{transform:translate3d(0,0,0)}100%{transform:translate3d(316.67%,0,0)}}

/* M608 gliding spotlight blobs */
.m608-b{position:absolute;border-radius:50%;pointer-events:none;mix-blend-mode:screen;background:radial-gradient(closest-side,var(--c) 0%,var(--c) 30%,transparent 100%);animation:var(--a) var(--d) ease-in-out infinite alternate;animation-play-state:paused;will-change:transform}
.m608-on .m608-b{animation-play-state:running}
@keyframes m608-a{0%{transform:translate3d(-10%,-6%,0) rotate(-18deg)}100%{transform:translate3d(60%,28%,0) rotate(34deg)}}
@keyframes m608-b{0%{transform:translate3d(20%,30%,0) rotate(40deg)}100%{transform:translate3d(-55%,-22%,0) rotate(-12deg)}}
@keyframes m608-c{0%{transform:translate3d(-30%,18%,0) rotate(70deg)}100%{transform:translate3d(36%,-30%,0) rotate(118deg)}}

html.is-static .b12g2-glow,html.is-static .m605-lit,html.is-static .m605-beam,html.is-static .m608-b{animation:none}
html.is-static {
  .b12g2-glow,.m605-lit,.m605-beam,.m608-b{animation:none}
}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", g1, g2, style }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string; style?: CSSProperties }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0d16] text-[#eef2ff] ${className}`} style={style}>
      <style href="b12g2-css" precedence="default">
        {CSS}
      </style>
      <div className="b12g2-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/** The CSS glow loop again, ON TOP of full-bleed canvases / shaders / line fields (screen blend), so they never freeze. */
const Sheen = ({ g1 }: { g1?: string }) => (
  <div className="b12g2-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.45, zIndex: 35 } as CSSProperties} aria-hidden />
);

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

/** GSAP loops: `build` returns the looping animations (created paused); they play only while the root is on screen. */
function useLoops(ref: RefObject<HTMLElement | null>, build: (el: HTMLElement) => gsap.core.Animation[]) {
  const b = useRef(build);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let anims: gsap.core.Animation[] = [];
    const ctx = gsap.context(() => {
      anims = b.current(el);
      anims.forEach((a) => a.pause());
    }, el);
    const io = new IntersectionObserver(([e]) => anims.forEach((a) => (e.isIntersecting ? a.resume() : a.pause())), { threshold: 0.05 });
    io.observe(el);
    return () => {
      io.disconnect();
      ctx.revert();
    };
  }, [ref]);
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

/**
 * Full-bleed fragment shader (OGL via lib/gl, dpr 1). Built only near the viewport; draws only while on screen (lib/gl).
 * The CSS `fallback` background is always underneath; the canvas fades in after its first frame.
 */
function Shader({ frag, fallback }: { frag: string; fallback: string }) {
  const cv = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = cv.current;
    if (!c || prefersReducedMotion()) return;
    let dead = false;
    let h: GLHandle | null = null;
    const stop = whenNear(c, async () => {
      h = await createShader(c, frag, { dpr: 1 });
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

/**
 * Canvas 2D sized to its parent (dpr ≤ 1.5). `draw` runs every frame while the root is on screen (useTicker);
 * sizing starts only near the viewport. The CSS fallback under the canvas is what ?static=1 shows.
 */
function Canvas2D({ root, draw, fallback }: { root: RefObject<HTMLDivElement | null>; draw: (x: CanvasRenderingContext2D, w: number, h: number, t: number, dt: number) => void; fallback: string }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const size = useRef({ w: 0, h: 0, k: 1 });
  const dr = useRef(draw);
  dr.current = draw;
  useEffect(() => {
    const c = cv.current;
    if (!c || prefersReducedMotion()) return;
    let ro: ResizeObserver | null = null;
    const stop = whenNear(c, () => {
      const fit = () => {
        const k = Math.min(window.devicePixelRatio || 1, 1.5);
        const w = c.parentElement!.clientWidth;
        const h = c.parentElement!.clientHeight;
        c.width = Math.max(1, Math.round(w * k));
        c.height = Math.max(1, Math.round(h * k));
        size.current = { w, h, k };
      };
      fit();
      ro = new ResizeObserver(fit);
      ro.observe(c.parentElement!);
    });
    return () => {
      stop();
      ro?.disconnect();
    };
  }, []);
  useTicker(root, (t, dt) => {
    const c = cv.current;
    const { w, h, k } = size.current;
    if (!c || !w) return;
    const x = c.getContext("2d");
    if (!x) return;
    x.setTransform(k, 0, 0, k, 0, 0);
    dr.current(x, w, h, t, Math.min(dt, 0.05));
    if (c.style.opacity !== "1") c.style.opacity = "1";
  });
  return (
    <div className="absolute inset-0" style={{ background: fallback }}>
      <canvas ref={cv} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500" aria-hidden />
    </div>
  );
}

/** Deterministic random (same paths on the server and the client). */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Our own value noise (GLSL). */
const NOISE = /* glsl */ `
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
`;

/**
 * A travelling light segment on an SVG path (pathLength 100): layered dashes of falling length share one head, so the
 * segment reads as a gradient (dim long tail → white head). `s` = where the segment starts along the path (−L … 100).
 */
const SEG = [1, 0.5, 0.18];
function setSeg(layers: SVGPathElement[], s: number, L: number, reverse: boolean) {
  layers.forEach((p, k) => {
    const l = L * SEG[k];
    const start = reverse ? s : s + L - l;
    p.setAttribute("stroke-dasharray", `${l} 300`);
    p.setAttribute("stroke-dashoffset", `${-start}`);
  });
}
function PulsePath({ d, w = 2, colors, s0, L, reverse = false, base = "rgba(255,255,255,.1)", bw }: { d: string; w?: number; colors: [string, string, string]; s0: number; L: number; reverse?: boolean; base?: string; bw?: number }) {
  return (
    <g data-pulse data-l={L} data-rev={reverse ? 1 : 0}>
      <path d={d} fill="none" stroke={base} strokeWidth={bw ?? w} vectorEffect="non-scaling-stroke" />
      {colors.map((c, k) => (
        <path
          key={k}
          data-seg
          d={d}
          pathLength={100}
          fill="none"
          stroke={c}
          strokeWidth={w + k * 0.6}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          strokeDasharray={`${L * SEG[k]} 300`}
          strokeDashoffset={-(reverse ? s0 : s0 + L - L * SEG[k])}
        />
      ))}
    </g>
  );
}
/** One looping tween per pulse group: the segment runs the whole path (in `dur` s), forever. */
function pulseTween(g: SVGGElement, dur: number, delay = 0, repeatDelay = 0) {
  const L = Number(g.dataset.l);
  const rev = g.dataset.rev === "1";
  const layers = Array.from(g.querySelectorAll<SVGPathElement>("[data-seg]"));
  const o = { s: rev ? 100 : -L };
  return gsap.to(o, {
    s: rev ? -L : 100,
    duration: dur,
    delay,
    repeat: -1,
    repeatDelay,
    ease: "none",
    onUpdate: () => setSeg(layers, o.s, L, rev),
  });
}

/* ---------- M602 · Crossing 3D beams (variant of M61: lines of light in 3D space cross and turn, not rays from the top) ---------- */
const BEAMS3D = /* glsl */ `
vec3 rY(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }
vec3 rX(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z); }
void main(){
  vec2 p = (vUv * uRes - 0.5 * uRes) / uRes.y;
  vec3 ro = vec3(0.0, 0.0, -3.0);
  vec3 rd = normalize(vec3(p, 1.5));
  float t = uTime * 0.22;
  vec3 col = vec3(0.012, 0.014, 0.03);
  for (int i = 0; i < 7; i++){
    float fi = float(i);
    vec3 d = normalize(vec3(cos(fi * 1.7), 0.55 * sin(fi * 2.3), sin(fi * 1.7)));
    d = rX(rY(d, t + fi * 0.45), 0.35 * sin(t * 0.8 + fi));
    vec3 o = rY(vec3(0.28 * sin(fi * 2.1), 0.22 * cos(fi * 1.3), 0.3 * cos(fi * 0.9)), t * 0.6);
    vec3 w0 = ro - o;
    float b = dot(rd, d), dd = dot(rd, w0), e = dot(d, w0);
    float den = max(1.0 - b * b, 1e-4);
    float s = (b * e - dd) / den;
    float u = (e - b * dd) / den;
    vec3 q = (ro + rd * s) - (o + d * u);
    float dist = length(q) / max(s, 0.5) * 3.0;
    float along = exp(-u * u * 0.22);
    float depth = clamp(1.6 - 0.32 * s, 0.25, 1.4);
    float core = exp(-pow(dist * 110.0, 2.0));
    float halo = exp(-dist * 26.0) * 0.38;
    vec3 c = 0.55 + 0.45 * cos(6.2832 * (fi * 0.13 + vec3(0.55, 0.68, 0.85)));
    col += (c * halo + mix(c, vec3(1.0), 0.6) * core) * along * depth;
  }
  col = col / (1.0 + col * 0.35);
  gl_FragColor = vec4(col, 1.0);
}`;
function M602() {
  return (
    <Stage className="bg-[#03040a]" g1="rgba(120,150,255,.5)" g2="rgba(90,230,220,.22)">
      <Shader
        frag={BEAMS3D}
        fallback="linear-gradient(28deg,transparent 47%,rgba(140,170,255,.55) 50%,transparent 53%),linear-gradient(152deg,transparent 47%,rgba(90,230,220,.45) 50%,transparent 53%),linear-gradient(96deg,transparent 48%,rgba(200,150,255,.4) 50%,transparent 52%),#03040a"
      />
      <Sheen g1="rgba(120,150,255,.5)" />
      <div className="pointer-events-none absolute bottom-[8%] left-[6%] z-40">
        <p className="text-[13px] uppercase tracking-[0.3em] text-white/60">Vantor Labs · Spatial audio</p>
        <h3 className="mt-3 text-[clamp(44px,5vw,84px)] font-[700] leading-[0.92] tracking-[-0.03em]" style={{ fontFamily: F.sg }}>
          Sound in every direction.
        </h3>
      </div>
      <p className="pointer-events-none absolute bottom-[8%] right-[6%] z-40 text-right text-[15px] text-white/70">
        Orbit Pro speakers
        <br />
        <b className="text-[22px] text-white">₹ 64,900</b>
      </p>
    </Stage>
  );
}

/* ---------- M603 · Prismatic burst (variant of M196: hard coloured rays from a bright core, split per channel, slowly turning) ---------- */
const BURST = /* glsl */ `
${NOISE}
float rays(float a, float r, float t){
  float n = vn(vec2(a * 2.6 + 4.0, t * 0.35));
  float m = vn(vec2(a * 7.0 - 3.0, t * 0.5 + 9.0));
  return pow(abs(sin(a * 8.0 + n * 1.8)), 14.0) * 0.9 + pow(abs(sin(a * 21.0 - n * 2.0)), 34.0) * (0.35 + 0.5 * m);
}
void main(){
  vec2 p = (vUv * uRes - 0.5 * uRes) / uRes.y;
  float r = length(p);
  float a = atan(p.y, p.x);
  float t = uTime;
  float spin = t * 0.11;
  float disp = 0.022 + 0.05 * r;
  vec3 ch = vec3(rays(a + spin - disp, r, t), rays(a + spin, r, t), rays(a + spin + disp, r, t));
  vec3 hue = 0.55 + 0.45 * cos(6.2832 * (a / 6.2832 + t * 0.03 + vec3(0.0, 0.33, 0.67)));
  float fall = smoothstep(0.0, 0.06, r) * exp(-r * 1.9);
  vec3 col = vec3(0.015, 0.012, 0.03);
  col += (ch * 0.7 + hue * dot(ch, vec3(0.333)) * 0.9) * fall * 1.6;
  col += vec3(1.0, 0.95, 0.9) * exp(-r * 10.0) * (0.9 + 0.1 * sin(t * 2.0));
  col += hue * exp(-r * 3.2) * 0.18;
  col = col / (1.0 + col * 0.25);
  gl_FragColor = vec4(col, 1.0);
}`;
function M603() {
  return (
    <Stage className="bg-[#040309]" g1="rgba(255,140,220,.5)" g2="rgba(120,200,255,.24)">
      <Shader
        frag={BURST}
        fallback="radial-gradient(circle at 50% 50%,#fff 0%,rgba(255,200,240,.7) 4%,transparent 30%),conic-gradient(from 0deg at 50% 50%,rgba(255,90,140,.35),rgba(255,210,90,.3),rgba(90,230,170,.3),rgba(90,150,255,.35),rgba(190,110,255,.3),rgba(255,90,140,.35)),#040309"
      />
      <Sheen g1="rgba(255,140,220,.5)" />
      <div className="pointer-events-none absolute left-[6%] top-[9%] z-40">
        <p className="text-[13px] uppercase tracking-[0.3em] text-white/70">Opaline Festival · 2027</p>
      </div>
      <div className="pointer-events-none absolute bottom-[8%] left-[6%] right-[6%] z-40 flex items-end justify-between">
        <h3 className="text-[clamp(48px,6vw,100px)] font-[800] uppercase leading-[0.86] tracking-[-0.02em]" style={{ fontFamily: F.sy }}>
          Full
          <br />
          spectrum
        </h3>
        <p className="text-right text-[15px] text-white/75">
          Three nights · Goa
          <br />
          <b className="text-[22px] text-white">Passes from ₹ 7,500</b>
        </p>
      </div>
    </Stage>
  );
}

/* ---------- M604 · Rotating prism (a glass triangle turns; a white beam enters and leaves as a fanned spectrum) ---------- */
const PRISM = /* glsl */ `
float sdTri(vec2 p, float r){
  const float k = 1.7320508;
  p.x = abs(p.x) - r; p.y = p.y + r / k;
  if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  p.x -= clamp(p.x, -2.0 * r, 0.0);
  return -length(p) * sign(p.y);
}
vec3 spec(float h){ return clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); }
void main(){
  vec2 p = (vUv * uRes - 0.5 * uRes) / uRes.y;
  vec2 c = vec2(-0.12, 0.02);
  vec2 q = p - c;
  float t = uTime;
  float ang = t * 0.2;
  float ca = cos(ang), sa = sin(ang);
  vec2 rq = vec2(ca * q.x + sa * q.y, -sa * q.x + ca * q.y);
  float d = sdTri(rq, 0.2);
  vec3 col = vec3(0.012, 0.012, 0.026);
  float outside = smoothstep(0.0, 0.004, d);
  // incoming white beam from the left
  float inb = exp(-pow(q.y / 0.008, 2.0)) * step(q.x, 0.0) * outside;
  col += vec3(0.95, 0.97, 1.0) * inb * (0.85 + 0.15 * sin(t * 3.0)) + vec3(0.6, 0.7, 1.0) * exp(-abs(q.y) * 60.0) * step(q.x, 0.0) * outside * 0.25;
  // outgoing spectrum fan, aimed by the prism's turn
  float phi = atan(q.y, q.x);
  float aim = -0.22 + 0.3 * sin(ang * 3.0);
  float spread = 0.34 + 0.06 * cos(ang * 3.0);
  float h = (phi - (aim - spread * 0.5)) / spread;
  float inFan = smoothstep(0.0, 0.06, h) * smoothstep(1.0, 0.94, h) * step(0.0, q.x);
  float r = length(q);
  vec3 sc = spec(clamp(h, 0.0, 1.0) * 0.8);
  col += sc * inFan * outside * (0.9 * exp(-r * 0.9)) * (0.85 + 0.15 * sin(r * 30.0 - t * 4.0));
  // glass body: soft fill, internal streak, bright edges
  float inside = 1.0 - outside;
  col += vec3(0.32, 0.38, 0.6) * inside * 0.22;
  col += mix(vec3(1.0), sc, 0.5) * inside * exp(-pow(q.y / 0.02, 2.0)) * 0.35;
  col += vec3(0.85, 0.9, 1.0) * exp(-abs(d) * 160.0) * (0.75 + 0.25 * sin(t * 1.6 + rq.x * 12.0));
  col += vec3(0.5, 0.6, 1.0) * exp(-max(d, 0.0) * 14.0) * 0.12;
  col = col / (1.0 + col * 0.3);
  gl_FragColor = vec4(col, 1.0);
}`;
function M604() {
  return (
    <Stage className="bg-[#030309]" g1="rgba(150,170,255,.5)" g2="rgba(255,190,120,.22)">
      <Shader
        frag={PRISM}
        fallback="linear-gradient(180deg,transparent 49.4%,rgba(240,245,255,.85) 50%,transparent 50.6%) left/44% 100% no-repeat,conic-gradient(from 72deg at 44% 50%,transparent 0deg,rgba(255,80,80,.55) 6deg,rgba(255,220,80,.55) 12deg,rgba(80,230,140,.55) 18deg,rgba(80,150,255,.55) 24deg,rgba(170,90,255,.55) 30deg,transparent 36deg),#030309"
      />
      <Sheen g1="rgba(150,170,255,.5)" />
      <div className="pointer-events-none absolute left-[6%] top-[9%] z-40">
        <p className="text-[13px] uppercase tracking-[0.3em] text-white/60">Kestrel Optics</p>
        <h3 className="mt-3 text-[clamp(44px,4.8vw,80px)] font-[400] leading-[0.95]" style={{ fontFamily: F.is }}>
          Every colour,
          <br />
          one lens.
        </h3>
      </div>
      <p className="pointer-events-none absolute bottom-[8%] left-[6%] z-40 text-[15px] text-white/70">
        Prism 50 mm f/1.4 · <b className="text-white">₹ 48,500</b>
      </p>
    </Stage>
  );
}

/* ---------- M605 · Slow beam sweep over grid (variant of M49: one vertical beam crosses a grid and lights its lines) ---------- */
function M605() {
  const root = useRef<HTMLDivElement>(null);
  useOnClass(root, "m605-on");
  return (
    <Stage r={root} className="bg-[#04070d]" g1="rgba(90,190,255,.4)" g2="rgba(120,110,255,.18)">
      <div className="m605-grid" aria-hidden />
      <div className="m605-lit" aria-hidden />
      <div className="m605-beam" aria-hidden />
      <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center text-center">
        <div>
          <p className="text-[13px] uppercase tracking-[0.3em] text-[#9adfff]">Gridline · Analytics</p>
          <h3 className="mt-4 text-[clamp(48px,5.6vw,92px)] font-[650] leading-[0.92] tracking-[-0.035em]" style={{ fontFamily: F.sg }}>
            Scan everything.
          </h3>
          <p className="mt-5 text-[15px] text-white/65">Live dashboards from ₹ 1,200 / month</p>
        </div>
      </div>
    </Stage>
  );
}

/* ---------- M606 · Drifting diagonal light beams (variant of M61: tilted beams rise along their axis on a canvas) ---------- */
type Beam = { x: number; s: number; w: number; len: number; v: number; hue: number; ph: number };
function beamSprite(color: string) {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 256;
  const x = c.getContext("2d")!;
  const gw = x.createLinearGradient(0, 0, 64, 0);
  gw.addColorStop(0, "rgba(0,0,0,0)");
  gw.addColorStop(0.5, color);
  gw.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = gw;
  x.fillRect(0, 0, 64, 256);
  x.globalCompositeOperation = "destination-in";
  const gl = x.createLinearGradient(0, 0, 0, 256);
  gl.addColorStop(0, "rgba(0,0,0,0)");
  gl.addColorStop(0.45, "rgba(0,0,0,1)");
  gl.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = gl;
  x.fillRect(0, 0, 64, 256);
  return c;
}
function M606() {
  const root = useRef<HTMLDivElement>(null);
  const st = useRef<{ beams: Beam[]; sprites: HTMLCanvasElement[] } | null>(null);
  const draw = (x: CanvasRenderingContext2D, w: number, h: number, t: number, dt: number) => {
    if (!st.current) {
      const r = rng(606);
      st.current = {
        sprites: ["rgba(120,170,255,.9)", "rgba(170,120,255,.85)", "rgba(110,230,230,.8)"].map(beamSprite),
        beams: Array.from({ length: 13 }, () => ({ x: r(), s: r(), w: 60 + r() * 110, len: 0.9 + r() * 0.7, v: 0.05 + r() * 0.06, hue: Math.floor(r() * 3), ph: r() * 6.28 })),
      };
    }
    const { beams, sprites } = st.current;
    x.globalCompositeOperation = "source-over";
    x.fillStyle = "#04050c";
    x.fillRect(0, 0, w, h);
    x.globalCompositeOperation = "lighter";
    const ang = 0.6; // tilt from vertical: the beams lean right and rise along their own axis
    const ux = Math.sin(ang);
    const uy = -Math.cos(ang);
    const span = h * 2.2;
    for (const b of beams) {
      b.s = (b.s + b.v * dt) % 1;
      const along = (b.s - 0.5) * span;
      const cx = -w * 0.3 + b.x * w * 1.4 + ux * along;
      const cy = h * 0.5 + uy * along;
      const L = h * b.len * 1.4;
      x.save();
      x.translate(cx, cy);
      x.rotate(ang);
      x.globalAlpha = 0.24 + 0.14 * Math.sin(t * 0.9 + b.ph);
      x.drawImage(sprites[b.hue], -b.w / 2, -L / 2, b.w, L);
      x.restore();
    }
    x.globalAlpha = 1;
    x.globalCompositeOperation = "source-over";
  };
  return (
    <Stage r={root} className="bg-[#04050c]" g1="rgba(120,150,255,.5)" g2="rgba(110,230,230,.2)">
      <Canvas2D
        root={root}
        draw={draw}
        fallback="linear-gradient(55deg,transparent 30%,rgba(120,170,255,.22) 36%,transparent 42%,transparent 55%,rgba(170,120,255,.2) 62%,transparent 68%),#04050c"
      />
      <Sheen g1="rgba(120,150,255,.5)" />
      <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center text-center">
        <div>
          <p className="text-[13px] uppercase tracking-[0.3em] text-white/60">Northwake · Cloud studio</p>
          <h3 className="mt-4 text-[clamp(48px,5.4vw,90px)] font-[500] leading-[0.94] tracking-[-0.02em]" style={{ fontFamily: F.fr }}>
            Built in the light.
          </h3>
          <p className="mt-5 text-[15px] text-white/70">Team plan · ₹ 3,900 / month</p>
        </div>
      </div>
    </Stage>
  );
}

/* ---------- M607 · Long-exposure light trails (variant of M61: streaks race along curved lanes with bloom) ---------- */
const TRAILS = /* glsl */ `
float hh(float n){ return fract(sin(n * 91.7) * 43758.5); }
void main(){
  vec2 p = (vUv * uRes - 0.5 * uRes) / uRes.y;
  float t = uTime;
  vec3 col = vec3(0.012, 0.01, 0.022);
  for (int i = 0; i < 8; i++){
    float fi = float(i);
    float dir = mod(fi, 2.0) < 1.0 ? 1.0 : -1.0;
    float y0 = -0.3 + fi * 0.075;
    float a1 = 0.1 + 0.04 * hh(fi), f1 = 2.0 + 0.6 * hh(fi + 3.0);
    float f = y0 + a1 * sin(p.x * f1 + fi * 0.9) + 0.035 * sin(p.x * 5.0 - fi);
    float df = a1 * f1 * cos(p.x * f1 + fi * 0.9) + 0.175 * cos(p.x * 5.0 - fi);
    float d = abs(p.y - f) / sqrt(1.0 + df * df);
    float spd = 0.28 + 0.2 * hh(fi + 7.0);
    float ph = fract(dir * p.x * 0.55 - t * spd + hh(fi + 11.0));
    float ph2 = fract(dir * p.x * 0.55 - t * spd + 0.5 + hh(fi + 13.0));
    float st = pow(ph, 5.0) * smoothstep(1.0, 0.985, ph) + 0.6 * pow(ph2, 7.0) * smoothstep(1.0, 0.985, ph2);
    float core = exp(-pow(d * 300.0, 2.0));
    float mid = exp(-pow(d * 70.0, 2.0));
    float bloom = exp(-d * 22.0);
    vec3 c = dir > 0.0 ? mix(vec3(1.0, 0.35, 0.18), vec3(1.0, 0.7, 0.3), hh(fi + 2.0)) : mix(vec3(0.45, 0.75, 1.0), vec3(0.95, 0.95, 1.0), hh(fi + 5.0));
    col += c * (core * (0.12 + 1.6 * st) + mid * st * 0.5 + bloom * st * 0.18);
    col += vec3(1.0) * core * st * st * 0.8;
  }
  col = col / (1.0 + col * 0.4);
  gl_FragColor = vec4(col, 1.0);
}`;
function M607() {
  return (
    <Stage className="bg-[#030208]" g1="rgba(255,120,80,.5)" g2="rgba(110,170,255,.24)">
      <Shader
        frag={TRAILS}
        fallback="linear-gradient(176deg,transparent 40%,rgba(255,110,60,.4) 42%,transparent 44%,transparent 50%,rgba(255,190,90,.35) 52%,transparent 54%,transparent 58%,rgba(120,180,255,.4) 60%,transparent 62%),#030208"
      />
      <Sheen g1="rgba(255,120,80,.5)" />
      <div className="pointer-events-none absolute left-[6%] top-[9%] z-40">
        <p className="text-[13px] uppercase tracking-[0.3em] text-white/60">Halcyon Motors · EV</p>
        <h3 className="mt-3 text-[clamp(46px,5.2vw,88px)] font-[800] uppercase leading-[0.88] tracking-[-0.01em]" style={{ fontFamily: F.sy }}>
          After dark
        </h3>
      </div>
      <p className="pointer-events-none absolute bottom-[8%] right-[6%] z-40 text-right text-[15px] text-white/70">
        Halcyone GT · 520 km range
        <br />
        <b className="text-[22px] text-white">From ₹ 46.9 lakh</b>
      </p>
    </Stage>
  );
}

/* ---------- M608 · Gliding spotlight blobs (variant of M195: soft pools of light glide and turn instead of beams swaying) ---------- */
const M608_B = [
  { c: "rgba(255,190,120,.55)", a: "m608-a", d: "9s", s: { left: "-6%", top: "-10%", width: "56%", height: "78%" } },
  { c: "rgba(120,160,255,.5)", a: "m608-b", d: "11s", s: { left: "48%", top: "20%", width: "52%", height: "84%" } },
  { c: "rgba(255,120,190,.42)", a: "m608-c", d: "13s", s: { left: "20%", top: "34%", width: "46%", height: "66%" } },
];
function M608() {
  const root = useRef<HTMLDivElement>(null);
  useOnClass(root, "m608-on");
  return (
    <Stage r={root} className="bg-[#08070c]" g1="rgba(255,200,150,.3)" g2="rgba(140,120,255,.18)">
      {M608_B.map((b) => (
        <div key={b.a} className="m608-b" style={{ ...b.s, "--c": b.c, "--a": b.a, "--d": b.d } as CSSProperties} aria-hidden />
      ))}
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-[6%]">
        <p className="text-[13px] uppercase tracking-[0.3em] text-white/65">Maison Lirae · Spring show</p>
        <div className="flex items-end justify-between gap-8">
          <h3 className="max-w-[12ch] text-[clamp(50px,6vw,100px)] font-[500] leading-[0.9] tracking-[-0.025em]" style={{ fontFamily: F.fr }}>
            Step into the light.
          </h3>
          <p className="shrink-0 text-right text-[15px] text-white/75">
            Silk evening coat
            <br />
            <b className="text-[22px] text-white">₹ 32,000</b>
          </p>
        </div>
      </div>
    </Stage>
  );
}

/* ---------- M609 · Beam between nodes (variant of M8: a gradient segment travels along curved links into a hub, looping) ---------- */
const M609_IN = [
  { y: 90, label: "Orders", dur: 2.6 },
  { y: 195, label: "Stock", dur: 3.4 },
  { y: 300, label: "Payments", dur: 2.2 },
  { y: 405, label: "Mail", dur: 4.2 },
  { y: 510, label: "Ads", dur: 3 },
];
const M609_C: [string, string, string] = ["rgba(150,110,255,.55)", "rgba(255,130,200,.9)", "#ffffff"];
function M609() {
  const root = useRef<HTMLDivElement>(null);
  useLoops(root, (el) => Array.from(el.querySelectorAll<SVGGElement>("[data-pulse]")).map((g, i) => pulseTween(g, Number((g.parentNode as SVGGElement).dataset.dur) || 2.5, 0, 0).progress((i * 0.37) % 1)));
  return (
    <Stage r={root} className="bg-[#06060d]" g1="rgba(150,110,255,.4)" g2="rgba(255,130,200,.2)">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 600" preserveAspectRatio="none" aria-hidden>
        {M609_IN.map((n, i) => (
          <g key={n.label} data-dur={n.dur}>
            <PulsePath d={`M 230 ${n.y} C 420 ${n.y}, 430 300, 600 300`} colors={M609_C} s0={(i * 23) % 80} L={34} />
          </g>
        ))}
        <g data-dur={2.4}>
          <PulsePath d="M 600 300 C 740 230, 840 370, 970 300" colors={["rgba(90,220,200,.55)", "rgba(120,240,255,.9)", "#ffffff"]} s0={40} L={40} reverse w={2.4} />
        </g>
      </svg>
      {M609_IN.map((n) => (
        <div key={n.label} className="absolute z-10 flex items-center gap-3" style={{ left: "19.2%", top: `${(n.y / 600) * 100}%`, transform: "translate(-100%,-50%)" }}>
          <span className="text-[14px] text-white/70" style={{ fontFamily: F.mr }}>
            {n.label}
          </span>
          <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-[#11121c] text-[15px] font-[700] text-white/90" style={{ fontFamily: F.sg }}>
            {n.label[0]}
          </span>
        </div>
      ))}
      <div className="absolute left-1/2 top-1/2 z-10 grid h-24 w-24 place-items-center rounded-[28px] border border-white/20 bg-[#151628] text-center shadow-[0_0_60px_rgba(170,120,255,.45)]" style={{ transform: "translate(-50%,-50%)" }}>
        <span className="text-[15px] font-[700] tracking-[-0.01em]" style={{ fontFamily: F.sg }}>
          Relay
        </span>
      </div>
      <div className="absolute z-10 rounded-2xl border border-white/15 bg-[#0f1a1c] px-5 py-4" style={{ left: "80.8%", top: "50%", transform: "translateY(-50%)" }}>
        <p className="text-[13px] uppercase tracking-[0.2em] text-[#8ff0e0]">Your store</p>
        <p className="mt-1 text-[16px] font-[600]" style={{ fontFamily: F.sg }}>
          Synced live
        </p>
      </div>
      <div className="pointer-events-none absolute left-[6%] top-[5%] z-10">
        <h3 className="text-[clamp(30px,2.8vw,44px)] font-[650] tracking-[-0.03em]" style={{ fontFamily: F.sg }}>
          One hub. Every channel.
        </h3>
      </div>
      <p className="pointer-events-none absolute bottom-[5%] right-[6%] z-10 text-[14px] text-white/60">Relay Commerce · from ₹ 2,900 / month</p>
    </Stage>
  );
}

/* ---------- M610 · Light pulses across fanned paths (variant of M609: many fibres fan across the hero; pulses on random 7–15 s loops) ---------- */
const M610_P = (() => {
  const r = rng(610);
  return Array.from({ length: 26 }, (_, i) => {
    const k = i / 25;
    const sx = -60 + k * 380;
    const sy = 640 + r() * 40;
    const ex = 620 + k * 680;
    const ey = -40 - r() * 30;
    const c1x = sx + 180 + r() * 160;
    const c1y = 360 - k * 120 + r() * 80;
    const c2x = ex - 360 + r() * 140;
    const c2y = 380 - k * 200 + r() * 60;
    return { d: `M ${sx.toFixed(0)} ${sy.toFixed(0)} C ${c1x.toFixed(0)} ${c1y.toFixed(0)}, ${c2x.toFixed(0)} ${c2y.toFixed(0)}, ${ex.toFixed(0)} ${ey.toFixed(0)}`, dur: 7 + r() * 8, delay: r() * 2, s0: -20 + r() * 110 };
  });
})();
function M610() {
  const root = useRef<HTMLDivElement>(null);
  useLoops(root, (el) =>
    Array.from(el.querySelectorAll<SVGGElement>("[data-pulse]")).map((g, i) => {
      const p = M610_P[i];
      return pulseTween(g, p.dur, 0, p.delay).progress(((p.s0 + 20) / 130) % 1);
    }),
  );
  return (
    <Stage r={root} className="bg-[#05060c]" g1="rgba(110,140,255,.5)" g2="rgba(80,220,220,.2)">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 600" preserveAspectRatio="none" aria-hidden>
        {M610_P.map((p) => (
          <PulsePath key={p.d} d={p.d} w={1.4} bw={1} colors={["rgba(90,120,255,.45)", "rgba(120,220,255,.85)", "#eaffff"]} s0={p.s0} L={16} base="rgba(255,255,255,.06)" />
        ))}
      </svg>
      <Sheen g1="rgba(110,140,255,.5)" />
      <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center text-center">
        <div>
          <p className="text-[13px] uppercase tracking-[0.3em] text-[#9fdcff]">Fibrecore Networks</p>
          <h3 className="mt-4 text-[clamp(48px,5.6vw,92px)] font-[700] leading-[0.92] tracking-[-0.035em]" style={{ fontFamily: F.sg }}>
            Light-speed homes.
          </h3>
          <p className="mt-5 text-[15px] text-white/70">1 Gbps fibre · ₹ 999 / month</p>
        </div>
      </div>
    </Stage>
  );
}

/* ---------- M611 · Beams along grid lines (variant of M60: light runs along the grid's lines — horizontal, vertical, diagonal — lighting nodes) ---------- */
type GBeam = { x: number; y: number; dx: number; dy: number; v: number; dist: number; max: number; len: number; col: string; last: number };
function M611() {
  const root = useRef<HTMLDivElement>(null);
  const st = useRef<{ beams: GBeam[]; nodes: Map<string, number>; next: number; r: () => number } | null>(null);
  const draw = (x: CanvasRenderingContext2D, w: number, h: number, t: number, dt: number) => {
    const cell = 56;
    if (!st.current) st.current = { beams: [], nodes: new Map(), next: 0, r: rng(611) };
    const s = st.current;
    const cols = Math.ceil(w / cell) + 1;
    const rows = Math.ceil(h / cell) + 1;
    const ox = (w - (cols - 1) * cell) / 2;
    const oy = (h - (rows - 1) * cell) / 2;
    // spawn
    s.next -= dt;
    if (s.next <= 0 && s.beams.length < 16) {
      s.next = 0.12 + s.r() * 0.28;
      const kind = s.r();
      const dirs: [number, number][] = kind < 0.4 ? [[1, 0], [-1, 0]] : kind < 0.75 ? [[0, 1], [0, -1]] : [[1, 1], [1, -1], [-1, 1], [-1, -1]];
      const [dx, dy] = dirs[Math.floor(s.r() * dirs.length)];
      const i = Math.floor(s.r() * cols);
      const j = Math.floor(s.r() * rows);
      const pal = ["120,200,255", "170,140,255", "110,240,200"];
      s.beams.push({ x: ox + i * cell, y: oy + j * cell, dx, dy, v: (150 + s.r() * 160) * (dx && dy ? 1 : 1), dist: 0, max: cell * (4 + Math.floor(s.r() * 7)), len: cell * (1.4 + s.r() * 1.6), col: pal[Math.floor(s.r() * 3)], last: -1 });
    }
    x.fillStyle = "#04060b";
    x.fillRect(0, 0, w, h);
    // grid
    x.strokeStyle = "rgba(255,255,255,.065)";
    x.lineWidth = 1;
    x.beginPath();
    for (let i = 0; i < cols; i++) {
      x.moveTo(ox + i * cell + 0.5, 0);
      x.lineTo(ox + i * cell + 0.5, h);
    }
    for (let j = 0; j < rows; j++) {
      x.moveTo(0, oy + j * cell + 0.5);
      x.lineTo(w, oy + j * cell + 0.5);
    }
    x.stroke();
    // nodes lit by passing beams
    for (const [k, v] of s.nodes) {
      const nv = v - dt * 1.4;
      if (nv <= 0) {
        s.nodes.delete(k);
        continue;
      }
      s.nodes.set(k, nv);
      const [i, j] = k.split(",").map(Number);
      const px = ox + i * cell;
      const py = oy + j * cell;
      x.fillStyle = `rgba(190,230,255,${0.9 * nv})`;
      x.fillRect(px - 2.5, py - 2.5, 5, 5);
      x.fillStyle = `rgba(120,200,255,${0.18 * nv})`;
      x.beginPath();
      x.arc(px, py, 12, 0, 6.2832);
      x.fill();
    }
    // beams
    x.globalCompositeOperation = "lighter";
    x.lineCap = "round";
    s.beams = s.beams.filter((b) => {
      b.dist += b.v * dt;
      const n = Math.hypot(b.dx, b.dy);
      const ux = b.dx / n;
      const uy = b.dy / n;
      const head = Math.min(b.dist, b.max);
      const tail = Math.max(0, b.dist - b.len);
      if (tail >= b.max) return false;
      const step = (b.dx && b.dy ? Math.SQRT2 : 1) * cell;
      const passed = Math.floor(head / step);
      if (passed !== b.last && b.dist <= b.max) {
        b.last = passed;
        const ni = Math.round((b.x + ux * passed * step - ox) / cell);
        const nj = Math.round((b.y + uy * passed * step - oy) / cell);
        s.nodes.set(`${ni},${nj}`, 1);
      }
      const fade = b.dist > b.max ? 1 - (b.dist - b.max) / b.len : 1;
      const hx = b.x + ux * head;
      const hy = b.y + uy * head;
      const tx = b.x + ux * tail;
      const ty = b.y + uy * tail;
      const g = x.createLinearGradient(tx, ty, hx, hy);
      g.addColorStop(0, `rgba(${b.col},0)`);
      g.addColorStop(0.85, `rgba(${b.col},${0.75 * fade})`);
      g.addColorStop(1, `rgba(255,255,255,${0.95 * fade})`);
      x.strokeStyle = g;
      x.lineWidth = 1.8;
      x.beginPath();
      x.moveTo(tx, ty);
      x.lineTo(hx, hy);
      x.stroke();
      return true;
    });
    x.globalCompositeOperation = "source-over";
    void t;
  };
  return (
    <Stage r={root} className="bg-[#04060b]" g1="rgba(110,180,255,.5)" g2="rgba(150,120,255,.2)">
      <Canvas2D
        root={root}
        draw={draw}
        fallback="linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px) center/56px 56px,linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px) center/56px 56px,#04060b"
      />
      <Sheen g1="rgba(110,180,255,.5)" />
      <div className="pointer-events-none absolute bottom-[8%] left-[6%] z-40 rounded-[22px] border border-white/10 bg-[#04060b]/80 p-7">
        <p className="text-[13px] uppercase tracking-[0.3em] text-[#9fd2ff]">Lattice · Developer platform</p>
        <h3 className="mt-3 text-[clamp(40px,4.4vw,72px)] font-[650] leading-[0.94] tracking-[-0.03em]" style={{ fontFamily: F.sg }}>
          Ship on the grid.
        </h3>
        <p className="mt-3 text-[15px] text-white/65">Edge deploys · free up to 3 projects · Pro ₹ 1,600 / month</p>
      </div>
    </Stage>
  );
}

/* ---------- M612 · Flowing line paths (variant of M8: dozens of curves draw, travel and redraw forever, pulsing softly) ---------- */
const M612_P = (() => {
  const out: { d: string; w: number; o: number; dur: number; c: string }[] = [];
  for (let side = 0; side < 2; side++) {
    for (let i = 0; i < 18; i++) {
      const sgn = side ? -1 : 1;
      const y0 = 300 + sgn * (-260 + i * 12);
      const d = `M -80 ${y0} C 260 ${y0 - sgn * 240 + i * 6}, 640 ${y0 + sgn * 260 - i * 8}, 1280 ${300 + sgn * (120 - i * 9)}`;
      out.push({ d, w: 0.6 + i * 0.05, o: 0.18 + i * 0.03, dur: 7 + ((i * 7 + side * 5) % 11), c: side ? "#ffd2a8" : "#bcd4ff" });
    }
  }
  return out;
})();
function M612() {
  const root = useRef<HTMLDivElement>(null);
  useLoops(root, (el) =>
    Array.from(el.querySelectorAll<SVGPathElement>("[data-flow]")).flatMap((p, i) => {
      const m = M612_P[i];
      return [
        gsap.fromTo(p, { strokeDashoffset: 0 }, { strokeDashoffset: -200, duration: m.dur, ease: "none", repeat: -1 }).progress((i * 0.137) % 1),
        gsap.fromTo(p, { opacity: m.o * 0.45 }, { opacity: Math.min(1, m.o * 1.6), duration: 2 + (i % 5) * 0.5, ease: "sine.inOut", repeat: -1, yoyo: true }).progress((i * 0.21) % 1),
      ];
    }),
  );
  return (
    <Stage r={root} className="bg-[#07080d]" g1="rgba(150,170,255,.5)" g2="rgba(255,190,140,.2)">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 600" preserveAspectRatio="none" aria-hidden>
        {M612_P.map((p, i) => (
          <path
            key={i}
            data-flow
            d={p.d}
            pathLength={100}
            fill="none"
            stroke={p.c}
            strokeWidth={p.w}
            strokeOpacity={1}
            opacity={p.o}
            strokeDasharray="70 130"
            strokeDashoffset={-((i * 27) % 200)}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <Sheen g1="rgba(150,170,255,.5)" />
      <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center text-center">
        <div>
          <p className="text-[13px] uppercase tracking-[0.3em] text-white/60">Atelier Venn · Stationery</p>
          <h3 className="mt-4 text-[clamp(52px,6vw,100px)] font-[400] leading-[0.92]" style={{ fontFamily: F.is }}>
            Draw a better day.
          </h3>
          <p className="mt-5 text-[15px] text-white/70">Fine-line pen set · ₹ 1,450</p>
        </div>
      </div>
    </Stage>
  );
}

/* ---------- M613 · Converging lines on scroll (variant of M8: five coloured paths draw on with the scroll and meet in a glowing pill) ---------- */
const M613_P = [
  { d: "M -20 70 C 260 40, 330 260, 560 210 S 760 330, 838 350", c: "#ffb35c" },
  { d: "M -20 220 C 200 300, 380 120, 560 260 S 760 350, 838 350", c: "#ff6fa8" },
  { d: "M -20 350 C 220 420, 400 260, 600 360 S 770 345, 838 350", c: "#b07bff" },
  { d: "M -20 480 C 230 400, 380 560, 580 430 S 770 360, 838 350", c: "#5fa8ff" },
  { d: "M -20 630 C 260 650, 340 450, 560 500 S 760 370, 838 350", c: "#4fe0c2" },
];
function M613() {
  const root = useRef<HTMLDivElement>(null);
  useScrub(
    root,
    (p) => {
      const el = root.current;
      if (!el) return;
      el.querySelectorAll<SVGPathElement>("[data-draw]").forEach((path) => path.setAttribute("stroke-dashoffset", `${100 * (1 - p)}`));
      el.style.setProperty("--p", `${p}`);
    },
    { finalValue: 1 },
  );
  return (
    <Stage r={root} className="bg-[#06060c]" g1="rgba(170,120,255,.45)" g2="rgba(255,170,90,.2)" style={{ "--p": 1 } as CSSProperties}>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 700" preserveAspectRatio="none" aria-hidden>
        {M613_P.map((l) => (
          <path key={`b${l.c}`} d={l.d} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        ))}
        <g opacity={0.28}>
          {M613_P.map((l) => (
            <path key={`g${l.c}`} data-draw d={l.d} pathLength={100} strokeDasharray="100 100" strokeDashoffset={0} fill="none" stroke={l.c} strokeWidth={14} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          ))}
        </g>
        {M613_P.map((l) => (
          <path key={`l${l.c}`} data-draw d={l.d} pathLength={100} strokeDasharray="100 100" strokeDashoffset={0} fill="none" stroke={l.c} strokeWidth={2.6} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        ))}
        <defs>
          <filter id="m613-blur" x="-5%" y="-10%" width="110%" height="120%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
      </svg>
      <div className="absolute z-10" style={{ left: "69.8%", top: "50%", transform: "translateY(-50%)" }}>
        <div
          className="absolute -inset-10 rounded-full"
          style={{ background: "radial-gradient(closest-side,rgba(255,180,220,.7),rgba(170,120,255,.35) 55%,transparent)", opacity: "calc(0.15 + var(--p) * var(--p) * 0.85)" } as CSSProperties}
          aria-hidden
        />
        <div
          className="relative rounded-full border border-white/30 bg-white px-8 py-5 text-[#0b0b14]"
          style={{ opacity: "calc(0.35 + var(--p) * 0.65)", boxShadow: "0 0 50px rgba(255,170,220,.55)" } as CSSProperties}
        >
          <p className="whitespace-nowrap text-[18px] font-[700] tracking-[-0.01em]" style={{ fontFamily: F.sg }}>
            Book a tasting · ₹ 2,400
          </p>
        </div>
      </div>
      <div className="pointer-events-none absolute left-[6%] top-[7%] z-10">
        <p className="text-[13px] uppercase tracking-[0.3em] text-white/60">Five Rivers Kitchen</p>
        <h3 className="mt-3 text-[clamp(42px,4.6vw,76px)] font-[500] leading-[0.94] tracking-[-0.02em]" style={{ fontFamily: F.fr }}>
          Five roads, one table.
        </h3>
      </div>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M602", name: "Crossing 3D beams", how: "Lines of light hang in 3D space, cross each other and slowly turn as one group (shader)", kind: "play", C: M602 },
  { code: "M603", name: "Prismatic burst", how: "Coloured rays burst from a bright core, split per colour channel and slowly rotate (shader)", kind: "play", C: M603 },
  { code: "M604", name: "Rotating prism", how: "A glass prism turns; a white beam goes in and fans out as a spectrum that swings with it (shader)", kind: "play", C: M604 },
  { code: "M605", name: "Slow beam sweep over grid", how: "One vertical light beam sweeps across a grid on a loop, lighting the lines it passes (CSS)", kind: "play", C: M605 },
  { code: "M606", name: "Drifting diagonal light beams", how: "Soft tilted beams rise along their own axis, overlap and breathe on a canvas", kind: "play", C: M606 },
  { code: "M607", name: "Long-exposure light trails", how: "Streaks race both ways along curved lanes with bloom, like long-exposure traffic (shader)", kind: "play", C: M607 },
  { code: "M608", name: "Gliding spotlight blobs", how: "Three soft oval pools of light glide and turn slowly across the stage (CSS)", kind: "play", C: M608 },
  { code: "M609", name: "Beam between nodes", how: "A gradient segment runs along each curved link into a hub, then out to the store, on 2–4 s loops (SVG)", kind: "play", C: M609 },
  { code: "M610", name: "Light pulses across fanned paths", how: "Many thin fibres fan across the hero; light pulses run along each on random 7–15 s loops (SVG)", kind: "play", C: M610 },
  { code: "M611", name: "Beams along grid lines", how: "Light beams run along the grid's lines (across, down, diagonal) and light the nodes they pass (canvas)", kind: "play", C: M611 },
  { code: "M612", name: "Flowing line paths", how: "Dozens of thin curves draw, travel and redraw at different speeds while their opacity pulses (SVG)", kind: "play", C: M612 },
  { code: "M613", name: "Converging lines on scroll", how: "Five coloured paths draw on with the scroll and meet in a glowing pill button (SVG scrub)", kind: "scrub", C: M613 },
];
