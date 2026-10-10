"use client";

// Ambient motions, batch 3 · group 1 (MOTION-MENU M195–M206). Small focused demos for /lab/motion.
// Every "play" demo starts when it is on screen, loops, and pauses off screen; M202 follows the scroll. Each one also has a
// CSS-only glow loop that never stops (a second one sits ON TOP of full-bleed images / canvases). Hover-style demos drive a
// visible fake pointer by themselves; the real mouse takes over while it moves. ?static=1 / reduced motion: no JS motion,
// CSS loops stop, the markup shows a sensible final state.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { createShader, type GLHandle } from "@/lib/gl";
import { scene, useScrub, useTicker } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = {
  sg: "'Space Grotesk Variable', system-ui, sans-serif",
  fr: "'Fraunces Variable', Georgia, serif",
  is: "'Instrument Serif', Georgia, serif",
  sy: "'Syne Variable', 'Space Grotesk Variable', system-ui, sans-serif",
  mr: "'Manrope Variable', system-ui, sans-serif",
};

const CSS = `
.b3g1-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.42)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.2)),transparent 70%);animation:b3g1-drift 5.6s linear infinite alternate;will-change:transform}
@keyframes b3g1-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b3g1-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4);pointer-events:none;z-index:40;opacity:0;transition:opacity .25s}

/* M195 swaying twin spotlights */
.m195-set{position:absolute;top:-6%;width:46%;height:120%;animation:m195-sway 6.4s ease-in-out infinite alternate;animation-play-state:paused}
.m195-set.r{animation-duration:5.6s;animation-delay:-2.8s}
.m195-rot{position:absolute;top:0;width:34%;height:100%;transform-origin:50% 0;transform:rotate(var(--b));animation:m195-turn var(--d) ease-in-out infinite alternate;animation-play-state:paused}
.m195-beam{position:absolute;inset:0;clip-path:polygon(44% 0,56% 0,100% 100%,0 100%);background:linear-gradient(to bottom,rgba(255,236,206,.75),rgba(255,214,170,.18) 55%,transparent 92%);filter:blur(14px)}
.m195-motes{position:absolute;inset:0;clip-path:polygon(44% 0,56% 0,100% 100%,0 100%);-webkit-mask-image:linear-gradient(to bottom,#000 30%,transparent 90%);mask-image:linear-gradient(to bottom,#000 30%,transparent 90%)}
.m195-mote{position:absolute;width:3px;height:3px;border-radius:50%;background:#fff6e6;box-shadow:0 0 6px rgba(255,240,210,.9);animation:m195-mote var(--md) linear infinite;animation-delay:var(--mdl);animation-play-state:paused}
.m195-on .m195-set,.m195-on .m195-rot,.m195-on .m195-mote{animation-play-state:running}
@keyframes m195-sway{0%{transform:translate3d(-7%,0,0)}100%{transform:translate3d(7%,0,0)}}
@keyframes m195-turn{0%{transform:rotate(calc(var(--b) - 11deg))}100%{transform:rotate(calc(var(--b) + 11deg))}}
@keyframes m195-mote{0%{transform:translate3d(0,0,0);opacity:0}15%{opacity:.9}85%{opacity:.7}100%{transform:translate3d(var(--mx),-90px,0);opacity:0}}

/* M202 blob breathing (CSS loop under the scrub) */
.m202-breathe{animation:m202-b 3.2s ease-in-out infinite alternate;transform-origin:50% 50%}
@keyframes m202-b{0%{transform:scale(.96) rotate(-4deg)}100%{transform:scale(1.05) rotate(5deg)}}

/* M206 grain gradient */
.m206-blob{position:absolute;border-radius:50%;filter:blur(60px);animation:var(--an) var(--du) ease-in-out infinite alternate;animation-play-state:paused}
.m206-grain{position:absolute;inset:-60px;pointer-events:none;opacity:.42;mix-blend-mode:overlay;animation:m206-g .5s steps(1) infinite;animation-play-state:paused}
.m206-on .m206-blob,.m206-on .m206-grain{animation-play-state:running}
@keyframes m206-a{0%{transform:translate3d(-12%,-8%,0) scale(1)}50%{transform:translate3d(10%,6%,0) scale(1.2)}100%{transform:translate3d(-2%,14%,0) scale(.9)}}
@keyframes m206-b{0%{transform:translate3d(14%,10%,0) scale(1.1)}50%{transform:translate3d(-10%,-4%,0) scale(.9)}100%{transform:translate3d(6%,-14%,0) scale(1.15)}}
@keyframes m206-c{0%{transform:translate3d(0,12%,0) scale(.95)}100%{transform:translate3d(-16%,-10%,0) scale(1.2)}}
@keyframes m206-g{0%{transform:translate(0,0)}12%{transform:translate(-23px,14px)}25%{transform:translate(17px,-31px)}37%{transform:translate(-41px,-9px)}50%{transform:translate(29px,37px)}62%{transform:translate(-11px,43px)}75%{transform:translate(44px,-18px)}87%{transform:translate(-35px,26px)}}

html.is-static .b3g1-glow,html.is-static .m195-set,html.is-static .m195-rot,html.is-static .m195-mote,html.is-static .m202-breathe,html.is-static .m206-blob,html.is-static .m206-grain{animation:none}
html.is-static .m195-mote{opacity:.6}
html.is-static {
  .b3g1-glow,.m195-set,.m195-rot,.m195-mote,.m202-breathe,.m206-blob,.m206-grain{animation:none}
  .m195-mote{opacity:.6}
}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", g1, g2, style }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string; style?: CSSProperties }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0d16] text-[#eef2ff] ${className}`} style={style}>
      <style href="b3g1-css" precedence="default">
        {CSS}
      </style>
      <div className="b3g1-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/** The CSS glow loop again, ON TOP of a full-bleed photo / canvas (screen blend), so big image demos never freeze. */
const Sheen = ({ g1 }: { g1?: string }) => (
  <div className="b3g1-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.45, zIndex: 35 } as CSSProperties} aria-hidden />
);

/** The visible fake pointer ring. */
const Dot = ({ r }: { r: RefObject<HTMLDivElement | null> }) => <div ref={r} className="b3g1-dot" aria-hidden />;

/** "play": builds a looping animation in a gsap.context, plays it only while on screen. Nothing with reduced motion. */
function usePlay(ref: RefObject<HTMLElement | null>, build: (root: HTMLElement) => gsap.core.Animation | void) {
  const b = useRef(build);
  b.current = build;
  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    let anim: gsap.core.Animation | void;
    let on = false;
    const ctx = gsap.context(() => {
      anim = b.current(root);
      anim?.pause();
    }, root);
    const io = new IntersectionObserver(
      ([e]) => {
        on = e.isIntersecting;
        if (on) anim?.play();
        else anim?.pause();
      },
      { threshold: 0.1 },
    );
    io.observe(root);
    return () => {
      io.disconnect();
      ctx.revert();
    };
  }, [ref]);
}

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
    fr.current(x, y, dt, t);
  });
}

/**
 * A 2D canvas sized to its parent (dpr ≤ 1.5) redrawn every frame while on screen. Reduced motion: one still frame.
 */
function useCanvas(root: RefObject<HTMLElement | null>, cv: RefObject<HTMLCanvasElement | null>, draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void, still = 2) {
  const d = useRef(draw);
  d.current = draw;
  const size = useRef({ w: 1, h: 1 });
  useEffect(() => {
    const c = cv.current;
    const box = c?.parentElement;
    if (!c || !box) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const fit = () => {
      const r = box.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      c.width = Math.max(1, Math.round(r.width * dpr));
      c.height = Math.max(1, Math.round(r.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      size.current = { w: r.width, h: r.height };
      d.current(ctx, r.width, r.height, still);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, [cv, still]);
  useTicker(root, (t) => {
    const ctx = cv.current?.getContext("2d");
    if (ctx) d.current(ctx, size.current.w, size.current.h, t);
  });
}

/** Seeded random (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Our own compact 2D simplex noise (-1..1), seeded. */
function simplex2(seed = 1) {
  const r = rng(seed);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  const perm = [...p, ...p];
  const G = [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
  const F2 = 0.5 * (Math.sqrt(3) - 1);
  const G2 = (3 - Math.sqrt(3)) / 6;
  const corner = (gi: number, x: number, y: number) => {
    const t = 0.5 - x * x - y * y;
    if (t < 0) return 0;
    const g = G[gi % 8];
    return t * t * t * t * (g[0] * x + g[1] * y);
  };
  return (xin: number, yin: number) => {
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const t = (i + j) * G2;
    const x0 = xin - (i - t);
    const y0 = yin - (j - t);
    const [i1, j1] = x0 > y0 ? [1, 0] : [0, 1];
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;
    const ii = i & 255;
    const jj = j & 255;
    return 70 * (corner(perm[ii + perm[jj]], x0, y0) + corner(perm[ii + i1 + perm[jj + j1]], x1, y1) + corner(perm[ii + 1 + perm[jj + 1]], x2, y2));
  };
}

/** Smooth SVG path through points (Catmull-Rom → cubic Bézier), open or closed. */
function curve(pts: number[][], closed: boolean) {
  const n = pts.length;
  const at = (i: number) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  const f = (v: number) => v.toFixed(1);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return closed ? d + " Z" : d;
}

/* ---------- M195 · Swaying twin spotlights (variant of M194: two always-on beam sets sway and cross, never settle) ---------- */
const BEAMS = [
  { b: -34, d: "5.2s", l: "8%" },
  { b: -24, d: "6.6s", l: "26%" },
  { b: -14, d: "4.6s", l: "44%" },
];
function Motes({ seed }: { seed: number }) {
  const r = rng(seed);
  return (
    <div className="m195-motes" aria-hidden>
      {Array.from({ length: 14 }, (_, i) => (
        <span
          key={i}
          className="m195-mote"
          style={{ left: `${30 + r() * 40}%`, top: `${12 + r() * 70}%`, "--md": `${3 + r() * 3}s`, "--mdl": `${-r() * 6}s`, "--mx": `${(r() - 0.5) * 50}px` } as CSSProperties}
        />
      ))}
    </div>
  );
}
function BeamSet({ side }: { side: "l" | "r" }) {
  return (
    <div className={`m195-set ${side}`} style={side === "l" ? { left: "-6%" } : { right: "-6%" }} aria-hidden>
      {/* the right set is mirrored on an inner layer so the sway keyframes (translate) stay on the outer one */}
      <div className="absolute inset-0" style={side === "r" ? { transform: "scaleX(-1)" } : undefined}>
        {BEAMS.map((bm, i) => (
          <div key={i} className="m195-rot" style={{ left: bm.l, "--b": `${bm.b}deg`, "--d": bm.d } as CSSProperties}>
            <div className="m195-beam" />
            <Motes seed={(side === "l" ? 11 : 47) + i * 7} />
          </div>
        ))}
      </div>
    </div>
  );
}
function M195() {
  const root = useRef<HTMLDivElement>(null);
  useOnClass(root, "m195-on");
  return (
    <Stage r={root} className="bg-[#07060a]" g1="rgba(255,200,140,.36)" g2="rgba(140,120,255,.18)">
      <BeamSet side="l" />
      <BeamSet side="r" />
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-[13px] uppercase tracking-[0.32em] text-[#f6e6d0]/70">Velvet Room · Live Sessions</p>
          <h3 className="mt-4 text-[clamp(56px,7vw,118px)] leading-[0.92] text-[#fff4e6]" style={{ fontFamily: F.is }}>
            Tonight, the stage is yours.
          </h3>
          <p className="mt-5 text-[15px] text-white/65">Friday 9 pm · Floor pass ₹ 1,800</p>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[22%] bg-[linear-gradient(to_top,rgba(255,200,150,.12),transparent)]" />
    </Stage>
  );
}

/* ---------- M196 · God rays from a point (variant of M61: shafts radiate from one point via a radial blur and flicker) ---------- */
const RAYS = /* glsl */ `
float h21(vec2 p) { p = fract(p * vec2(233.34, 851.73)); p += dot(p, p + 23.45); return fract(p.x * p.y); }
float vn(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y);
}
const vec2 L = vec2(0.66, 0.74);
// the light mask: a bright disc behind a drifting screen of leaves / lattice with gaps
float mask(vec2 uv, float asp, float t) {
  vec2 d = (uv - L) * vec2(asp, 1.0);
  float r = length(d);
  float sun = smoothstep(0.34, 0.0, r);
  vec2 q = d * 7.0 + vec2(t * 0.22, -t * 0.08);
  float gaps = smoothstep(0.42, 0.64, vn(q) * 0.7 + vn(q * 2.3 - t * 0.15) * 0.3);
  return sun * mix(gaps, 1.0, smoothstep(0.05, 0.0, r));
}
void main() {
  float asp = uRes.x / uRes.y;
  float t = uTime;
  vec2 uv = vUv;
  vec2 delta = (uv - L) / 30.0 * 0.92;
  vec2 s = uv;
  float acc = 0.0, w = 1.0;
  for (int i = 0; i < 30; i++) {
    acc += mask(s, asp, t) * w;
    w *= 0.955;
    s -= delta;
  }
  acc /= 14.0;
  vec2 dv = (uv - L) * vec2(asp, 1.0);
  float ang = atan(dv.y, dv.x);
  float flick = 0.72 + 0.28 * vn(vec2(ang * 9.0, t * 0.7)) + 0.12 * sin(t * 1.3 + ang * 23.0);
  float rays = acc * flick;
  vec3 dark = mix(vec3(0.03, 0.02, 0.015), vec3(0.11, 0.06, 0.03), uv.y);
  vec3 col = dark + rays * vec3(1.0, 0.78, 0.48) * 1.25;
  col += smoothstep(0.08, 0.0, length(dv)) * vec3(1.0, 0.93, 0.8) * 0.8;
  gl_FragColor = vec4(col, 1.0);
}`;
function Shader({ frag, fallback }: { frag: string; fallback: string }) {
  const cv = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let dead = false;
    let h: GLHandle | null = null;
    (async () => {
      if (!cv.current) return;
      h = await createShader(cv.current, frag, { dpr: 1 });
      if (dead) h?.destroy();
    })();
    return () => {
      dead = true;
      h?.destroy();
    };
  }, [frag]);
  return (
    <div className="absolute inset-0" style={{ background: fallback }}>
      <canvas ref={cv} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500" aria-hidden />
    </div>
  );
}
function M196() {
  return (
    <Stage className="bg-[#0a0604]" g1="rgba(255,190,110,.36)">
      <Shader
        frag={RAYS}
        fallback="radial-gradient(circle at 66% 26%,rgba(255,236,200,.95) 0%,rgba(255,190,110,.5) 8%,transparent 40%),repeating-conic-gradient(from 0deg at 66% 26%,rgba(255,200,130,.16) 0deg 4deg,transparent 4deg 11deg),linear-gradient(#1a0f07,#070403)"
      />
      <Sheen g1="rgba(255,190,110,.4)" />
      <div className="pointer-events-none absolute bottom-[10%] left-[6%] z-40 max-w-[44%] text-[#fbecd8]">
        <p className="text-[13px] uppercase tracking-[0.26em] opacity-70">Aurelle Attar · Oud 07</p>
        <h3 className="mt-3 text-[clamp(48px,5.6vw,92px)] font-[500] leading-[0.94] tracking-[-0.02em]" style={{ fontFamily: F.fr }}>
          Golden hour, bottled.
        </h3>
        <p className="mt-4 text-[15px] opacity-75">Extrait de parfum · 50 ml · ₹ 7,200</p>
      </div>
    </Stage>
  );
}

/* ---------- M197 · Flashlight in the dark (variant of M37: the whole section is dark; only the light circle reveals it) ---------- */
const SPOTS: [number, number][] = [
  [0.5, 0.48],
  [0.24, 0.3],
  [0.78, 0.3],
  [0.78, 0.7],
  [0.24, 0.72],
];
function M197() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const cur = useRef({ x: 0, y: 0, ready: false });
  // the scripted path: glide between the key details, a short (≤ 0.3 s) slow-down on each, never fully still
  const script = (t: number, w: number, h: number): [number, number] => {
    const seg = 1.15;
    const k = Math.floor(t / seg) % SPOTS.length;
    const f = (t % seg) / seg;
    const e = f < 0.75 ? gsap.parseEase("power2.inOut")(f / 0.75) : 1;
    const [a, b] = [SPOTS[k], SPOTS[(k + 1) % SPOTS.length]];
    const wob = Math.sin(t * 2.3) * 6;
    return [(a[0] + (b[0] - a[0]) * e) * w + wob, (a[1] + (b[1] - a[1]) * e) * h + wob * 0.6];
  };
  usePointer(root, dot, script, (x, y, dt, t) => {
    const el = root.current;
    if (!el) return;
    const c = cur.current;
    if (!c.ready) Object.assign(c, { x, y, ready: true });
    const k = 1 - Math.exp(-dt * 12);
    c.x += (x - c.x) * k;
    c.y += (y - c.y) * k;
    el.style.setProperty("--x", `${c.x}px`);
    el.style.setProperty("--y", `${c.y}px`);
    el.style.setProperty("--r", `${170 + Math.sin(t * 1.7) * 14}px`);
  });
  const label = "rounded-full border border-white/15 bg-black/30 px-4 py-2 text-[13px] uppercase tracking-[0.18em] text-white/85";
  return (
    <Stage r={root} className="bg-[#030407]" g1="rgba(120,160,255,.36)" style={{ "--x": "50%", "--y": "48%", "--r": "190px" } as CSSProperties}>
      {/* the lit scene underneath */}
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={scene(0, 1600, 1000)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute left-1/2 top-[48%] text-center" style={{ transform: "translate(-50%,-50%)" }}>
          <p className="text-[13px] uppercase tracking-[0.3em] text-white/70">Halcyone Watch Co.</p>
          <h3 className="mt-2 text-[clamp(52px,6.4vw,104px)] font-[700] leading-[0.9] tracking-[-0.04em]" style={{ fontFamily: F.sg }}>
            Find it in the dark.
          </h3>
        </div>
        <span className={`${label} absolute left-[24%] top-[30%]`} style={{ transform: "translate(-50%,-50%)" }}>Sapphire crystal</span>
        <span className={`${label} absolute left-[78%] top-[30%]`} style={{ transform: "translate(-50%,-50%)" }}>Lume dial · 300 h</span>
        <span className={`${label} absolute left-[78%] top-[70%]`} style={{ transform: "translate(-50%,-50%)" }}>42 mm titanium</span>
        <span className={`${label} absolute left-[24%] top-[72%] text-[#ffd59a]`} style={{ transform: "translate(-50%,-50%)" }}>₹ 46,500</span>
      </div>
      <Sheen g1="rgba(120,160,255,.32)" />
      {/* the dark overlay with a soft hole at the light */}
      <div
        className="pointer-events-none absolute inset-0 z-[38] bg-[#020306]/[0.97]"
        style={{
          WebkitMaskImage: "radial-gradient(circle var(--r) at var(--x) var(--y),transparent 0%,transparent 45%,#000 100%)",
          maskImage: "radial-gradient(circle var(--r) at var(--x) var(--y),transparent 0%,transparent 45%,#000 100%)",
        }}
        aria-hidden
      />
      <p className="pointer-events-none absolute bottom-[6%] left-[5%] z-[39] text-[13px] uppercase tracking-[0.24em] text-white/40">Move the light</p>
      <Dot r={dot} />
    </Stage>
  );
}

/* ---------- M198 · Ken Burns drift (variant of M7: slow zoom + pan toward an edge, five directions) ---------- */
const KB: { dir: string; x: number; y: number; origin: string; i: number; dur: number }[] = [
  { dir: "top-left", x: 6, y: 5, origin: "0% 0%", i: 3, dur: 9 },
  { dir: "top-right", x: -6, y: 5, origin: "100% 0%", i: 1, dur: 11 },
  { dir: "centre", x: 0, y: 0, origin: "50% 50%", i: 0, dur: 10 },
  { dir: "bottom-left", x: 6, y: -5, origin: "0% 100%", i: 2, dur: 12 },
  { dir: "bottom-right", x: -6, y: -5, origin: "100% 100%", i: 3, dur: 8.5 },
];
function KBFrame({ k, className, children }: { k: (typeof KB)[number]; className: string; children?: ReactNode }) {
  return (
    <div className={`relative overflow-hidden rounded-[18px] ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={scene(k.i, 1200, 900)} alt="" className="m198-img absolute inset-0 h-full w-full object-cover" data-x={k.x} data-y={k.y} data-dur={k.dur} style={{ transformOrigin: k.origin }} />
      <span className="absolute left-3 top-3 rounded-full bg-black/45 px-3 py-1 text-[12px] uppercase tracking-[0.16em] text-white/85">{k.dir}</span>
      {children}
    </div>
  );
}
function M198() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const tl = gsap.timeline();
    el.querySelectorAll<HTMLElement>(".m198-img").forEach((img) => {
      const dur = Number(img.dataset.dur);
      // zoom 1 → 1.22 while drifting toward its edge/corner, then back (yoyo), on its own slow clock
      tl.fromTo(img, { scale: 1, xPercent: 0, yPercent: 0 }, { scale: 1.22, xPercent: Number(img.dataset.x), yPercent: Number(img.dataset.y), duration: dur, ease: "sine.inOut", repeat: -1, yoyo: true }, 0);
    });
    return tl;
  });
  return (
    <Stage r={root} className="bg-[#0b0906]" g1="rgba(255,190,120,.36)">
      <div className="grid h-full grid-cols-[1fr_1.6fr_1fr] grid-rows-2 gap-3 p-4">
        <KBFrame k={KB[0]} className="" />
        <KBFrame k={KB[2]} className="row-span-2">
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,.65),transparent_55%)]" />
          <div className="absolute bottom-[7%] left-[7%] right-[7%]">
            <p className="text-[13px] uppercase tracking-[0.26em] text-white/70">Kestrel Hill Retreat</p>
            <h3 className="mt-2 text-[clamp(40px,4.2vw,70px)] leading-[0.95] text-white" style={{ fontFamily: F.is }}>
              Stay where the hills begin.
            </h3>
            <p className="mt-3 text-[15px] text-white/70">Valley cottage · ₹ 14,500 a night</p>
          </div>
        </KBFrame>
        <KBFrame k={KB[1]} className="" />
        <KBFrame k={KB[3]} className="" />
        <KBFrame k={KB[4]} className="" />
      </div>
      <Sheen g1="rgba(255,200,140,.4)" />
    </Stage>
  );
}

/* ---------- M199 · Weightless float bob (variant of F7: three out-of-phase sine loops on x, y and rotation) ---------- */
function M199() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, () => {
    const tl = gsap.timeline();
    const o = { ease: "sine.inOut", repeat: -1, yoyo: true };
    tl.fromTo(".m199-x", { x: -14 }, { x: 14, duration: 2.6, ...o }, 0) // 5.2 s period
      .fromTo(".m199-y", { y: -20 }, { y: 20, duration: 1.85, ...o }, 0) // 3.7 s period
      .fromTo(".m199-r", { rotation: -3.2 }, { rotation: 3.2, duration: 2.15, ...o }, 0.4) // 4.3 s period
      .fromTo(".m199-shadow", { scale: 1.12, opacity: 0.5 }, { scale: 0.8, opacity: 0.25, duration: 1.85, ...o }, 0)
      .fromTo(".m199-badge", { y: 8, rotation: 6 }, { y: -8, rotation: 2, duration: 1.45, ...o }, 0.2);
    return tl;
  });
  return (
    <Stage r={root} className="bg-[#070b10]" g1="rgba(120,220,255,.36)" g2="rgba(160,120,255,.2)">
      <div className="grid h-full grid-cols-[1fr_1fr] items-center px-[6%]">
        <div>
          <p className="text-[13px] uppercase tracking-[0.26em] text-white/60">Driftwell · Sleep Lab</p>
          <h3 className="mt-3 max-w-[11ch] text-[clamp(52px,6vw,100px)] font-[700] leading-[0.92] tracking-[-0.035em]" style={{ fontFamily: F.sg }}>
            Lighter than air.
          </h3>
          <p className="mt-5 max-w-[34ch] text-[16px] leading-relaxed text-white/65">Cloud-foam pillow that never flattens. 100-night trial.</p>
          <p className="mt-6 text-[22px] font-[700]" style={{ fontFamily: F.mr }}>
            ₹ 4,990
          </p>
        </div>
        <div className="relative grid h-full place-items-center">
          <div className="m199-shadow absolute bottom-[14%] h-[26px] w-[44%] rounded-[50%] bg-black/70 blur-[14px]" />
          {/* three nested wrappers: x, y and rotation each on their own clock */}
          <div className="m199-x">
            <div className="m199-y">
              <div className="m199-r relative">
                <div className="h-[clamp(200px,24vw,330px)] w-[clamp(280px,32vw,440px)] rounded-[46%_54%_48%_52%/58%_56%_44%_42%] bg-[radial-gradient(circle_at_34%_28%,#ffffff,#dfe8f5_38%,#9fb2c9_72%,#5b6b80)] shadow-[inset_-20px_-30px_60px_rgba(40,60,90,.45),0_40px_80px_rgba(0,0,0,.45)]" />
                <div className="absolute inset-x-[18%] top-[48%] h-[2px] rounded bg-white/50" />
              </div>
            </div>
          </div>
          <div className="m199-badge absolute right-[8%] top-[16%] rounded-full bg-[#7fe0ff] px-4 py-2 text-[13px] font-[700] uppercase tracking-[0.12em] text-[#04202a]">New · Gen 2</div>
        </div>
      </div>
    </Stage>
  );
}

/* ---------- M200 · Images floating around text (variant of M199: a cluster, each image on its own loop + depth parallax) ---------- */
const FLOATERS = [
  { l: 6, t: 10, w: 15, i: 0, d: 0.9, amp: 16, dur: 2.1, rot: 4 },
  { l: 26, t: 64, w: 12, i: 1, d: 0.5, amp: 12, dur: 2.7, rot: -5 },
  { l: 70, t: 6, w: 13, i: 2, d: 0.7, amp: 14, dur: 2.4, rot: -3 },
  { l: 82, t: 50, w: 14, i: 3, d: 1, amp: 18, dur: 1.9, rot: 5 },
  { l: 4, t: 56, w: 10, i: 2, d: 0.35, amp: 10, dur: 3.1, rot: -6 },
  { l: 60, t: 70, w: 11, i: 0, d: 0.6, amp: 13, dur: 2.6, rot: 3 },
];
function M200() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const off = useRef({ x: 0, y: 0 });
  usePlay(root, (el) => {
    const tl = gsap.timeline();
    el.querySelectorAll<HTMLElement>(".m200-bob").forEach((b, i) => {
      const f = FLOATERS[i];
      tl.fromTo(b, { y: -f.amp, rotation: -f.rot * 0.4 }, { y: f.amp, rotation: f.rot * 0.4, duration: f.dur, ease: "sine.inOut", repeat: -1, yoyo: true }, i * 0.37);
      tl.fromTo(b, { x: -f.amp * 0.5 }, { x: f.amp * 0.5, duration: f.dur * 1.6, ease: "sine.inOut", repeat: -1, yoyo: true }, i * 0.21);
    });
    return tl;
  });
  usePointer(
    root,
    dot,
    (t, w, h) => [w * (0.5 + 0.34 * Math.sin(t * 0.9)), h * (0.5 + 0.3 * Math.sin(t * 1.3 + 1))],
    (x, y, dt) => {
      const el = root.current;
      if (!el) return;
      const tx = (x / el.clientWidth - 0.5) * 2;
      const ty = (y / el.clientHeight - 0.5) * 2;
      const k = 1 - Math.exp(-dt * 5);
      off.current.x += (tx - off.current.x) * k;
      off.current.y += (ty - off.current.y) * k;
      el.querySelectorAll<HTMLElement>(".m200-par").forEach((p) => {
        const d = Number(p.dataset.d);
        p.style.transform = `translate3d(${-off.current.x * 34 * d}px,${-off.current.y * 24 * d}px,0)`;
      });
    },
  );
  return (
    <Stage r={root} className="bg-[#0b0a10]" g1="rgba(255,140,170,.36)" g2="rgba(120,200,255,.2)">
      {FLOATERS.map((f, i) => (
        <div key={i} className="m200-par absolute" data-d={f.d} style={{ left: `${f.l}%`, top: `${f.t}%`, width: `${f.w}%`, zIndex: Math.round(f.d * 10) }}>
          <div className="m200-bob" style={{ rotate: `${f.rot}deg` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={scene(f.i, 600, 750)} alt="" className="aspect-[4/5] w-full rounded-[16px] object-cover shadow-[0_24px_50px_rgba(0,0,0,.5)]" style={{ filter: `brightness(${0.6 + f.d * 0.4})` }} />
          </div>
        </div>
      ))}
      <div className="pointer-events-none absolute inset-0 z-[20] grid place-items-center text-center">
        <div>
          <p className="text-[13px] uppercase tracking-[0.3em] text-white/65">Paper Moon Studio · Spring edit</p>
          <h3 className="mt-3 text-[clamp(56px,6.6vw,110px)] font-[700] leading-[0.9] tracking-[-0.03em]" style={{ fontFamily: F.sy }}>
            Little things,
            <br />
            loved daily.
          </h3>
          <p className="mt-5 text-[15px] text-white/65">Prints, cards & keepsakes · from ₹ 349</p>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ---------- M201 · Morphing wave bands (variant of M53: stacked horizon silhouettes reshape on their own clocks) ---------- */
const BANDS = [
  { seed: 3, base: 0.42, amp: 0.16, dur: 2.2, fill: "url(#m201-a)" },
  { seed: 9, base: 0.58, amp: 0.13, dur: 2.9, fill: "url(#m201-b)" },
  { seed: 21, base: 0.74, amp: 0.1, dur: 1.8, fill: "url(#m201-c)" },
];
const W201 = 1440;
const H201 = 700;
const N201 = 8;
function bandShapes(seed: number, base: number, amp: number) {
  const r = rng(seed);
  return Array.from({ length: 5 }, () => Array.from({ length: N201 }, () => (base + (r() - 0.5) * 2 * amp) * H201));
}
function bandPath(ys: number[]) {
  const pts = ys.map((y, i) => [(i / (N201 - 1)) * W201, y]);
  return `${curve(pts, false)} L${W201} ${H201} L0 ${H201} Z`;
}
const BAND_SHAPES = BANDS.map((b) => bandShapes(b.seed, b.base, b.amp));
function M201() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const tl = gsap.timeline();
    const paths = el.querySelectorAll<SVGPathElement>(".m201-band");
    const ease = gsap.parseEase("sine.inOut");
    BANDS.forEach((b, li) => {
      const shapes = BAND_SHAPES[li];
      const n = shapes.length;
      const proxy = { v: 0 };
      // one linear clock per layer; each segment eases from one random peak shape to the next, then wraps to the first
      tl.to(proxy, {
        v: n,
        duration: b.dur * n,
        ease: "none",
        repeat: -1,
        onUpdate: () => {
          const seg = Math.floor(proxy.v) % n;
          const f = ease(proxy.v - Math.floor(proxy.v));
          const a = shapes[seg];
          const c = shapes[(seg + 1) % n];
          paths[li]?.setAttribute("d", bandPath(a.map((y, i) => y + (c[i] - y) * f)));
        },
      }, 0);
    });
    return tl;
  });
  return (
    <Stage r={root} className="bg-[#0d0a1a]" g1="rgba(255,150,110,.36)" g2="rgba(140,110,255,.22)">
      <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${W201} ${H201}`} preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="m201-a" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#ff9b6b" />
            <stop offset="1" stopColor="#6b2f6e" />
          </linearGradient>
          <linearGradient id="m201-b" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#c0457a" />
            <stop offset="1" stopColor="#2c1650" />
          </linearGradient>
          <linearGradient id="m201-c" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#3b1f63" />
            <stop offset="1" stopColor="#120b24" />
          </linearGradient>
        </defs>
        {BANDS.map((b, i) => (
          <path key={i} className="m201-band" d={bandPath(BAND_SHAPES[i][0])} fill={b.fill} opacity={0.92} />
        ))}
      </svg>
      <div className="absolute left-[6%] top-[11%] max-w-[50%]">
        <p className="text-[13px] uppercase tracking-[0.26em] text-white/70">Ridgeback Outdoors · Trek 2026</p>
        <h3 className="mt-3 text-[clamp(52px,6.2vw,104px)] font-[800] uppercase leading-[0.9] tracking-[-0.02em]" style={{ fontFamily: F.sy }}>
          New ridges daily.
        </h3>
        <p className="mt-4 text-[15px] text-white/70">Spiti circuit · 9 days · ₹ 38,000</p>
      </div>
    </Stage>
  );
}

/* ---------- M202 · Section-driven background blob (variant of M53: one blob takes on each section's shape, colour, place) ---------- */
const BLOB_N = 9;
const BLOB_STATES = [
  { seed: 5, x: 18, y: 0, scale: 1, rot: 0, fill: "rgb(255,122,89)" },
  { seed: 13, x: -20, y: 6, scale: 1.25, rot: 70, fill: "rgb(79,141,255)" },
  { seed: 29, x: 16, y: -6, scale: 0.85, rot: 160, fill: "rgb(24,196,143)" },
  { seed: 41, x: -4, y: 2, scale: 1.4, rot: 250, fill: "rgb(178,102,255)" },
];
const blobRadii = (seed: number) => {
  const r = rng(seed);
  return Array.from({ length: BLOB_N }, () => 120 + r() * 70);
};
const BLOB_R = BLOB_STATES.map((s) => blobRadii(s.seed));
const blobPath = (radii: number[]) =>
  curve(
    radii.map((r, i) => {
      const a = (i / BLOB_N) * Math.PI * 2;
      return [250 + Math.cos(a) * r, 250 + Math.sin(a) * r];
    }),
    true,
  );
const SECTIONS = [
  { k: "01 · Roast", h: "Picked at dawn.", p: "Single-estate Arabica from Chikmagalur." },
  { k: "02 · Brew", h: "Pour it slow.", p: "Hand-ground, 94 °C, four minutes." },
  { k: "03 · Taste", h: "Cocoa, then cherry.", p: "Medium roast, bright and round." },
  { k: "04 · Shop", h: "₹ 640 a bag.", p: "250 g · whole bean · ships in 24 h." },
];
function M202() {
  const root = useRef<HTMLDivElement>(null);
  const active = useRef(-1);
  const radii = useRef({ ...BLOB_R[0] } as Record<number, number>);
  const apply = (i: number, instant: boolean) => {
    const el = root.current;
    if (!el || i === active.current) return;
    active.current = i;
    const s = BLOB_STATES[i];
    const path = el.querySelector<SVGPathElement>(".m202-path");
    const wrap = el.querySelector<HTMLElement>(".m202-wrap");
    const dur = instant ? 0 : 1.1;
    gsap.to(radii.current, {
      ...Object.fromEntries(BLOB_R[i].map((r, k) => [k, r])),
      duration: dur,
      ease: "power3.inOut",
      overwrite: true,
      onUpdate: () => path?.setAttribute("d", blobPath(Array.from({ length: BLOB_N }, (_, k) => radii.current[k]))),
    });
    if (path) gsap.to(path, { fill: s.fill, duration: dur, ease: "power2.inOut", overwrite: true });
    if (wrap) gsap.to(wrap, { xPercent: s.x, yPercent: s.y, scale: s.scale, rotation: s.rot, duration: dur, ease: "power3.inOut", overwrite: true });
    el.querySelectorAll<HTMLElement>(".m202-dot").forEach((d, k) => (d.style.opacity = k === i ? "1" : ".3"));
  };
  useScrub(root, (p) => {
    const el = root.current;
    if (!el) return;
    // the content scrolls linearly through the four sections over the whole panel
    const col = el.querySelector<HTMLElement>(".m202-col");
    if (col) gsap.set(col, { yPercent: -75 * p });
    // each section takes over when it reaches the middle (ScrollTrigger-per-section style: the blob TWEENS to its state)
    apply(Math.min(3, Math.round(p * 3)), prefersReducedMotion() || active.current === -1);
  });
  return (
    <Stage r={root} className="bg-[#0b0c12]" g1="rgba(255,255,255,.14)" g2="rgba(120,140,255,.18)">
      <div className="absolute inset-0 grid place-items-center">
        <div className="m202-wrap relative aspect-square w-[min(56%,560px)]">
          <div className="m202-breathe absolute inset-0">
            <svg viewBox="0 0 500 500" className="h-full w-full" aria-hidden>
              <path className="m202-path" d={blobPath(BLOB_R[0])} fill={BLOB_STATES[0].fill} opacity={0.88} />
            </svg>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 overflow-hidden">
        <div className="m202-col h-[400%]">
          {SECTIONS.map((s, i) => (
            <div key={i} className={`flex h-1/4 items-center ${i % 2 ? "justify-end text-right" : ""} px-[7%]`}>
              <div className="max-w-[46%]">
                <p className="text-[13px] uppercase tracking-[0.26em] text-white/65">{s.k}</p>
                <h3 className="mt-3 text-[clamp(52px,6vw,100px)] font-[600] leading-[0.92] tracking-[-0.02em]" style={{ fontFamily: F.fr }}>
                  {s.h}
                </h3>
                <p className="mt-4 text-[16px] text-white/70">{s.p}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute right-[3%] top-1/2 flex flex-col gap-3" style={{ transform: "translateY(-50%)" }}>
        {SECTIONS.map((_, i) => (
          <span key={i} className="m202-dot block h-2 w-2 rounded-full bg-white transition-opacity duration-500" style={{ opacity: i ? 0.3 : 1 }} />
        ))}
      </div>
      <p className="absolute bottom-[5%] left-[7%] text-[13px] uppercase tracking-[0.24em] text-white/45">Ember & Oak Coffee</p>
    </Stage>
  );
}

/* ---------- M203 · Wave line field (variant of M52: parallel lines displaced by two crossing sine waves + pointer wave) ---------- */
function M203() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const ptr = useRef({ x: -1e4, y: -1e4, s: 0 });
  usePointer(
    root,
    dot,
    (t, w, h) => [w * (0.55 + 0.32 * Math.sin(t * 0.7)), h * (0.5 + 0.22 * Math.sin(t * 1.1 + 0.6))],
    (x, y, dt) => {
      const p = ptr.current;
      const k = 1 - Math.exp(-dt * 8);
      p.x = p.s ? p.x + (x - p.x) * k : x;
      p.y = p.s ? p.y + (y - p.y) * k : y;
      p.s = Math.min(1, p.s + dt * 1.5);
    },
  );
  useCanvas(root, cv, (ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);
    const lines = 44;
    const gap = h / (lines + 1);
    const p = ptr.current;
    for (let i = 1; i <= lines; i++) {
      const y0 = i * gap;
      const mid = 1 - Math.abs(i / lines - 0.5) * 2;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 8) {
        // two crossing sine waves moving in opposite directions
        let dy = Math.sin(x * 0.006 + t * 0.9 + i * 0.12) * 14 + Math.sin(x * 0.011 - t * 1.3 - i * 0.21) * 9;
        // a third local wave around the pointer
        const dx = x - p.x;
        const dd = y0 - p.y;
        const fall = Math.exp(-(dx * dx + dd * dd) / (2 * 120 * 120)) * p.s;
        dy += Math.sin(dx * 0.05 - t * 6) * 22 * fall;
        if (x === 0) ctx.moveTo(x, y0 + dy);
        else ctx.lineTo(x, y0 + dy);
      }
      ctx.strokeStyle = `rgba(${150 + mid * 80},${180 + mid * 60},255,${0.18 + mid * 0.5})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  });
  return (
    <Stage r={root} className="bg-[#05070f]" g1="rgba(110,150,255,.36)" g2="rgba(80,220,255,.18)">
      <canvas ref={cv} className="absolute inset-0 h-full w-full" aria-hidden />
      <Sheen g1="rgba(110,150,255,.3)" />
      <div className="pointer-events-none absolute bottom-[10%] left-[6%] z-[38] max-w-[48%]">
        <p className="text-[13px] uppercase tracking-[0.26em] text-white/65">Sonder Audio · Studio One</p>
        <h3 className="mt-3 text-[clamp(52px,6vw,100px)] font-[700] leading-[0.92] tracking-[-0.035em]" style={{ fontFamily: F.sg }}>
          Hear the room breathe.
        </h3>
        <p className="mt-4 text-[15px] text-white/65">Open-back headphones · ₹ 21,900</p>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ---------- M204 · Wavy blurred ribbons (variant of M52: thick translucent noise-curve ribbons, layered and blurred) ---------- */
const RIBBON_COLS = ["rgba(255,92,138,.55)", "rgba(255,170,90,.5)", "rgba(110,120,255,.55)", "rgba(60,210,200,.45)", "rgba(200,110,255,.5)"];
function M204() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const noise = useRef(simplex2(7));
  useCanvas(root, cv, (ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";
    const n = noise.current;
    RIBBON_COLS.forEach((c, i) => {
      ctx.beginPath();
      for (let x = -20; x <= w + 20; x += 10) {
        const y = h * 0.55 + n(x / 520 + i * 0.3, t * 0.28 + i * 0.7) * h * 0.24;
        if (x === -20) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = c;
      ctx.lineWidth = 38 + i * 8;
      ctx.lineCap = "round";
      ctx.stroke();
    });
    ctx.globalCompositeOperation = "source-over";
  });
  return (
    <Stage r={root} className="bg-[#07060d]" g1="rgba(255,110,160,.36)" g2="rgba(110,120,255,.22)">
      <canvas ref={cv} className="absolute inset-0 h-full w-full" style={{ filter: "blur(16px)" }} aria-hidden />
      <Sheen g1="rgba(255,140,190,.3)" />
      <div className="pointer-events-none absolute inset-0 z-[38] grid place-items-center text-center">
        <div>
          <p className="text-[13px] uppercase tracking-[0.3em] text-white/70">Tidal Pay · For creators</p>
          <h3 className="mt-3 text-[clamp(56px,6.8vw,112px)] font-[800] leading-[0.9] tracking-[-0.03em]" style={{ fontFamily: F.mr }}>
            Money that flows.
          </h3>
          <p className="mt-5 text-[15px] text-white/70">Zero-fee payouts · Pro plan ₹ 499 a month</p>
        </div>
      </div>
    </Stage>
  );
}

/* ---------- M205 · Flowing silky ribbons (variant of M204: wide strips that twist in 3D so their sheen catches light) ---------- */
const SILK = [
  { hue: 18, y: 0.38, w: 120, sp: 0.22, tw: 1.6, seed: 0 },
  { hue: 340, y: 0.56, w: 150, sp: 0.17, tw: 1.2, seed: 2.3 },
  { hue: 40, y: 0.72, w: 96, sp: 0.27, tw: 2.0, seed: 4.1 },
];
function M205() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const noise = useRef(simplex2(19));
  useCanvas(root, cv, (ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);
    const n = noise.current;
    const STEP = 12;
    SILK.forEach((r) => {
      let prev: number[] | null = null;
      for (let x = -STEP; x <= w + STEP; x += STEP) {
        const u = x / w;
        // centre line: a slow noise wave; twist angle travels along the strip
        const cy = h * r.y + n(u * 1.6 + r.seed, t * r.sp) * h * 0.18;
        const ang = u * Math.PI * r.tw + t * 0.6 + r.seed + n(u * 2 + r.seed, t * 0.15) * 1.2;
        const half = (r.w / 2) * Math.cos(ang);
        const tilt = Math.sin(ang) * 18;
        const top = [x + tilt, cy - half];
        const bot = [x - tilt, cy + half];
        if (prev) {
          // lighting: facing = |cos| (wide = facing us); a specular streak where the face turns toward the light
          const face = Math.abs(Math.cos(ang));
          const spec = Math.pow(Math.max(0, Math.cos(ang - 0.5)), 24);
          const l = 18 + face * 42 + spec * 38;
          ctx.fillStyle = `hsla(${r.hue + face * 12},${70 - spec * 30}%,${l}%,${0.55 + face * 0.4})`;
          ctx.beginPath();
          ctx.moveTo(prev[0], prev[1]);
          ctx.lineTo(top[0], top[1]);
          ctx.lineTo(bot[0], bot[1]);
          ctx.lineTo(prev[2], prev[3]);
          ctx.closePath();
          ctx.fill();
        }
        prev = [top[0], top[1], bot[0], bot[1]];
      }
    });
  });
  return (
    <Stage r={root} className="bg-[#0a0607]" g1="rgba(255,170,120,.36)" g2="rgba(255,90,140,.2)">
      <canvas ref={cv} className="absolute inset-0 h-full w-full" aria-hidden />
      <Sheen g1="rgba(255,190,150,.3)" />
      <div className="pointer-events-none absolute left-[6%] top-[10%] z-[38] max-w-[44%] text-[#fff1e8]">
        <p className="text-[13px] uppercase tracking-[0.26em] opacity-70">Seraphine · Silk Atelier</p>
        <h3 className="mt-3 text-[clamp(52px,6vw,100px)] leading-[0.92]" style={{ fontFamily: F.is }}>
          Silk that moves with you.
        </h3>
        <p className="mt-4 text-[15px] opacity-75">Hand-rolled scarf · 90 cm · ₹ 6,800</p>
      </div>
    </Stage>
  );
}

/* ---------- M206 · Grain gradient (variant of M52: soft drifting colour blobs under a jittering film grain) ---------- */
const GRAIN =
  "url(\"data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.4 -.2"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`,
  ) +
  "\")";
function M206() {
  const root = useRef<HTMLDivElement>(null);
  useOnClass(root, "m206-on");
  const blob = (bg: string, an: string, du: string, s: CSSProperties) => <div className="m206-blob" style={{ background: bg, "--an": an, "--du": du, ...s } as CSSProperties} aria-hidden />;
  return (
    <Stage r={root} className="bg-[#1a1210]" g1="rgba(255,170,120,.36)" g2="rgba(120,90,200,.2)">
      {blob("#ff8a5c", "m206-a", "18s", { left: "-6%", top: "-10%", width: "56%", height: "80%" })}
      {blob("#c24d7a", "m206-b", "22s", { right: "-8%", top: "10%", width: "52%", height: "86%" })}
      {blob("#f2c48d", "m206-c", "20s", { left: "28%", bottom: "-24%", width: "46%", height: "70%" })}
      {blob("#5a3fa0", "m206-a", "24s", { right: "20%", top: "-30%", width: "36%", height: "60%", opacity: 0.8 })}
      <div className="m206-grain" style={{ backgroundImage: GRAIN, backgroundSize: "220px 220px" }} aria-hidden />
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-[13px] uppercase tracking-[0.3em] text-white/80">Halde Studio · Film Series</p>
          <h3 className="mt-3 text-[clamp(56px,7vw,116px)] font-[500] leading-[0.9] tracking-[-0.02em] text-[#fff6ee]" style={{ fontFamily: F.fr }}>
            Shot on warm light.
          </h3>
          <p className="mt-5 text-[15px] text-white/80">Preset pack · 24 looks · ₹ 1,299</p>
        </div>
      </div>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M195", name: "Swaying twin spotlights", how: "Two sets of soft beams from the top corners swing round their source and cross, dust motes drift in them (on screen)", kind: "play", C: M195 },
  { code: "M196", name: "God rays from a point", how: "A shader radially blurs a light behind drifting leaves into shafts that flicker from one point (always on)", kind: "play", C: M196 },
  { code: "M197", name: "Flashlight in the dark", how: "Everything is dark; a soft light circle follows the pointer (a scripted path across the details when idle)", kind: "play", C: M197 },
  { code: "M198", name: "Ken Burns drift", how: "Five photos slowly zoom to 1.22 while panning to a corner, the centre or an edge, then drift back (on screen)", kind: "play", C: M198 },
  { code: "M199", name: "Weightless float bob", how: "A product hovers on three out-of-phase sine loops (x, y, tilt) so the motion never visibly repeats", kind: "play", C: M199 },
  { code: "M200", name: "Images floating around text", how: "Six images round the headline bob on their own loops; the pointer (scripted when idle) adds depth parallax", kind: "play", C: M200 },
  { code: "M201", name: "Morphing wave bands", how: "Three stacked horizon bands keep morphing between random peak shapes, each on its own clock (on screen)", kind: "play", C: M201 },
  { code: "M202", name: "Section-driven background blob", how: "Scroll through four sections; as each arrives the one blob tweens to its own shape, colour, size and place", kind: "scrub", C: M202 },
  { code: "M203", name: "Wave line field", how: "44 lines ripple under two crossing sine waves; a third local wave follows the pointer (scripted when idle)", kind: "play", C: M203 },
  { code: "M204", name: "Wavy blurred ribbons", how: "Five thick translucent noise-curve ribbons undulate, layered and blurred in brand colours (always on)", kind: "play", C: M204 },
  { code: "M205", name: "Flowing silky ribbons", how: "Wide lit strips drift in slow waves and twist, so a bright sheen runs along each one (always on)", kind: "play", C: M205 },
  { code: "M206", name: "Grain gradient", how: "Soft colour blobs drift over ~20 s under a film grain that jitters several times a second (on screen)", kind: "play", C: M206 },
];
