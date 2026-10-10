"use client";

// Ambient motions, batch 12 · group 4 (MOTION-MENU M626–M637): particle fields, dot grids, cell grids and text rings.
// Small focused demos for /lab/motion. Every demo is "play": it starts when it is on screen, loops, and pauses off
// screen. Each stage also has a CSS-only glow loop that never stops (a second one sits ON TOP of full-bleed canvases and
// cell grids). Pointer demos drive a visible fake pointer ring by themselves; the real mouse takes over while it moves.
// Canvas / WebGL demos build only within ~1 screen of the viewport; WebGL runs at dpr 1, one context per demo.
// ?static=1 / reduced motion: no JS motion, CSS loops stop, the markup shows a sensible final state.
import { useEffect, useId, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { createShader, type GLHandle } from "@/lib/gl";
import { scene, toCanvas, useTicker } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = {
  sg: "'Space Grotesk Variable', system-ui, sans-serif",
  fr: "'Fraunces Variable', Georgia, serif",
  is: "'Instrument Serif', Georgia, serif",
  sy: "'Syne Variable', 'Space Grotesk Variable', system-ui, sans-serif",
  mr: "'Manrope Variable', system-ui, sans-serif",
};

const CSS = `
.b12g4-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.5)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.22)),transparent 70%);animation:b12g4-drift 5.6s linear infinite alternate;will-change:transform}
@keyframes b12g4-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b12g4-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4);pointer-events:none;z-index:40;opacity:0;transition:opacity .25s}
.b12g4-run{animation-play-state:paused !important}
.b12g4-on .b12g4-run{animation-play-state:running !important}

/* M629 glowing stars */
.m629-s{width:4px;height:4px;border-radius:50%;background:rgba(200,215,255,.22);transition:background-color .5s ease,transform .5s ease,box-shadow .5s ease}
.m629-s.on{background:#fff;transform:scale(1.9);box-shadow:0 0 6px 2px rgba(150,190,255,.85),0 0 14px 4px rgba(90,140,255,.45)}

/* M634 dot spotlight */
.m634-base,.m634-lit{position:absolute;inset:0;background-size:22px 22px;background-position:center}
.m634-base{background-image:radial-gradient(circle,rgba(255,255,255,.13) 1.2px,transparent 1.6px)}
.m634-lit{background-image:radial-gradient(circle,#b9a4ff 1.6px,transparent 2px);-webkit-mask-image:radial-gradient(240px circle at var(--mx,50%) var(--my,50%),#000 0%,rgba(0,0,0,.55) 45%,transparent 100%);mask-image:radial-gradient(240px circle at var(--mx,50%) var(--my,50%),#000 0%,rgba(0,0,0,.55) 45%,transparent 100%)}
.m634-hl{background:linear-gradient(90deg,#8f6bff,#d07bff);background-size:0% 100%;background-repeat:no-repeat;background-position:left 80%;padding:0 .12em;border-radius:.12em;animation:m634-hl 3.2s ease-in-out infinite alternate}
@keyframes m634-hl{0%{background-size:8% 100%}100%{background-size:100% 100%}}

/* M636 perspective grid floor */
.m636-floor{position:absolute;left:0;right:0;bottom:0;height:58%;perspective:340px;perspective-origin:50% 0;overflow:hidden;-webkit-mask-image:linear-gradient(to bottom,transparent 0%,#000 38%);mask-image:linear-gradient(to bottom,transparent 0%,#000 38%)}
.m636-plane{position:absolute;left:-150%;width:400%;top:0;height:400%;transform-origin:50% 0;transform:rotateX(68deg);background-image:linear-gradient(to right,rgba(255,120,200,.75) 1.5px,transparent 1.5px),linear-gradient(to bottom,rgba(255,120,200,.75) 1.5px,transparent 1.5px);background-size:64px 64px;background-position:50% 0;animation:m636-run 1.1s linear infinite}
@keyframes m636-run{0%{background-position:50% 0}100%{background-position:50% 64px}}
.m636-sun{animation:m636-pulse 3s ease-in-out infinite alternate}
@keyframes m636-pulse{0%{opacity:.7;transform:scaleX(.9)}100%{opacity:1;transform:scaleX(1.08)}}

/* M637 text-ring tunnel */
.m637-ring{position:absolute;left:50%;top:50%;width:0;height:0;transform:translateZ(var(--z)) rotate(0deg);animation:m637-spin var(--d) linear infinite}
.m637-ring span{position:absolute;left:0;top:0;transform-origin:0 0;white-space:pre}
@keyframes m637-spin{0%{transform:translateZ(var(--z)) rotate(0deg)}100%{transform:translateZ(var(--z)) rotate(var(--e))}}

html.is-static .b12g4-glow,html.is-static .b12g4-run,html.is-static .m634-hl,html.is-static .m636-plane,html.is-static .m636-sun,html.is-static .m637-ring{animation:none}
html.is-static {
  .b12g4-glow,.b12g4-run,.m634-hl,.m636-plane,.m636-sun,.m637-ring{animation:none}
}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", g1, g2, style }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string; style?: CSSProperties }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0d16] text-[#eef2ff] ${className}`} style={style}>
      <style href="b12g4-css" precedence="default">
        {CSS}
      </style>
      <div className="b12g4-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/** The CSS glow loop again, ON TOP of full-bleed canvases / grids (screen blend), so those demos never freeze. */
const Sheen = ({ g1, opacity = 0.45 }: { g1?: string; opacity?: number }) => (
  <div className="b12g4-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity, zIndex: 35 } as CSSProperties} aria-hidden />
);

/** The visible fake pointer ring. */
const Dot = ({ r }: { r: RefObject<HTMLDivElement | null> }) => <div ref={r} className="b12g4-dot" aria-hidden />;

/** CSS-driven demos: toggles `b12g4-on` on the root while it is on screen (the `.b12g4-run` keyframes run only then). */
function useOn(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const io = new IntersectionObserver(([e]) => el.classList.toggle("b12g4-on", e.isIntersecting), { threshold: 0.1 });
    io.observe(el);
    return () => {
      io.disconnect();
      el.classList.remove("b12g4-on");
    };
  }, [ref]);
}

/** Calls `fn(true|false)` as the element enters / leaves the viewport. */
function useVisible(ref: RefObject<HTMLElement | null>, fn: (on: boolean) => void) {
  const cb = useRef(fn);
  cb.current = fn;
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const io = new IntersectionObserver(([e]) => cb.current(e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
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

/** Full-bleed fragment shader (OGL via lib/gl, dpr 1). Built only near the viewport; draws only while on screen. */
function Shader({ frag, fallback, uniforms, onFrame }: { frag: string; fallback: string; uniforms?: () => U; onFrame?: (u: U, t: number) => void }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const of = useRef(onFrame);
  of.current = onFrame;
  const un = useRef(uniforms);
  useEffect(() => {
    const c = cv.current;
    if (!c || prefersReducedMotion()) return;
    let dead = false;
    let h: GLHandle | null = null;
    const stop = whenNear(c, async () => {
      h = await createShader(c, frag, { dpr: 1, uniforms: un.current?.(), onFrame: (u, t) => of.current?.(u, t) });
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

const HASH = /* glsl */ `
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
`;

/* ---------- M626 · Particle storm wordmark (variant of M45: the dots never settle, they keep swirling inside the letters) ---------- */
type P626 = { hx: number; hy: number; ph: number; r: number; sp: number; s: number; sq: boolean; c: number };
const C626 = ["#ffd9a8", "#ff8a5c", "#fff4e8"];
function M626() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const word = useRef<HTMLHeadingElement>(null);
  const st = useRef<{ ps: P626[]; ctx: CanvasRenderingContext2D | null; w: number; h: number }>({ ps: [], ctx: null, w: 0, h: 0 });
  useEffect(() => {
    const el = root.current;
    const c = cv.current;
    if (!el || !c || prefersReducedMotion()) return;
    let dead = false;
    let ro: ResizeObserver | null = null;
    let tm = 0;
    const build = async () => {
      try {
        await document.fonts.load(`800 120px ${F.sy}`);
      } catch {}
      if (dead) return;
      const w = Math.max(1, el.clientWidth);
      const h = Math.max(1, el.clientHeight);
      c.width = w;
      c.height = h;
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const o = off.getContext("2d")!;
      const fs = Math.min(h * 0.4, w * 0.19);
      o.font = `800 ${fs}px ${F.sy}`;
      o.textAlign = "center";
      o.textBaseline = "middle";
      o.fillStyle = "#fff";
      o.fillText("NOVA", w / 2, h * 0.46);
      const data = o.getImageData(0, 0, w, h).data;
      const pts: [number, number][] = [];
      const step = 4;
      for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) if (data[(y * w + x) * 4 + 3] > 140) pts.push([x, y]);
      const max = 2200;
      const keep = Math.min(1, max / Math.max(1, pts.length));
      const ps: P626[] = [];
      for (const [x, y] of pts) {
        if (Math.random() > keep) continue;
        ps.push({ hx: x, hy: y, ph: Math.random() * 6.283, r: 1.5 + Math.random() * 4.5, sp: 0.8 + Math.random() * 2.2, s: 1 + Math.random() * 1.8, sq: Math.random() < 0.45, c: (Math.random() * 3) | 0 });
      }
      st.current = { ps, ctx: c.getContext("2d"), w, h };
      c.style.opacity = "1";
      if (word.current) word.current.style.opacity = "0";
    };
    const stop = whenNear(el, () => {
      build();
      ro = new ResizeObserver(() => {
        clearTimeout(tm);
        tm = window.setTimeout(build, 200);
      });
      ro.observe(el);
    });
    return () => {
      dead = true;
      clearTimeout(tm);
      stop();
      ro?.disconnect();
    };
  }, []);
  useTicker(root, (t) => {
    const { ps, ctx, w, h } = st.current;
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    for (let k = 0; k < 3; k++) {
      ctx.fillStyle = C626[k];
      for (const p of ps) {
        if (p.c !== k) continue;
        // orbit around the home point + a slow flow that sweeps across the word (stays within a few px of the letter)
        const a = t * p.sp + p.ph;
        const fx = Math.sin(t * 0.9 + p.hy * 0.025) * 2.6;
        const fy = Math.cos(t * 0.8 + p.hx * 0.02) * 2.6;
        const x = p.hx + Math.cos(a) * p.r + fx;
        const y = p.hy + Math.sin(a * 1.3) * p.r + fy;
        const sh = Math.sin(t * 3.2 + p.ph * 3);
        ctx.globalAlpha = 0.35 + 0.65 * sh * sh;
        if (p.sq) ctx.fillRect(x - p.s, y - p.s, p.s * 2, p.s * 2);
        else {
          ctx.beginPath();
          ctx.arc(x, y, p.s, 0, 6.283);
          ctx.fill();
        }
      }
    }
    ctx.globalAlpha = 1;
  });
  return (
    <Stage r={root} className="bg-[#0b0806]" g1="rgba(255,140,80,.5)" g2="rgba(255,210,150,.2)">
      <h3 ref={word} className="absolute inset-x-0 top-[46%] -translate-y-1/2 text-center text-[clamp(90px,15vw,220px)] font-[800] leading-none tracking-[-0.02em] text-[#ffd9a8]/80 transition-opacity duration-500" style={{ fontFamily: F.sy }}>
        NOVA
      </h3>
      <canvas ref={cv} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500" aria-hidden />
      <Sheen g1="rgba(255,140,80,.5)" />
      <div className="pointer-events-none absolute inset-x-[6%] bottom-[8%] z-40 flex items-end justify-between">
        <p className="text-[13px] uppercase tracking-[0.3em] text-white/65">Nova Audio · Field series</p>
        <p className="text-right text-[15px] text-white/70">
          Open-back headphones <b className="ml-2 text-[20px] text-white">₹ 18,900</b>
        </p>
      </div>
    </Stage>
  );
}

/* ---------- M627 · Image lifts into particles at cursor (variant of M45: the photo stays whole except near the pointer) ---------- */
const V627 = /* glsl */ `
attribute vec2 aUv;
attribute vec2 aRnd;
uniform vec2 uRes, uTexRes;
uniform float uTime, uSize;
uniform vec3 uP0, uP1, uP2, uP3;
uniform sampler2D tMap;
varying vec3 vCol;
varying float vLift;
float infl(vec3 p, vec2 q, float asp){ vec2 d = q - p.xy; d.x *= asp; return p.z * smoothstep(0.17, 0.02, length(d)); }
void main(){
  float asp = uRes.x / uRes.y;
  float L = max(max(infl(uP0, aUv, asp), infl(uP1, aUv, asp) * 0.85), max(infl(uP2, aUv, asp) * 0.65, infl(uP3, aUv, asp) * 0.45));
  L = L * (0.55 + 0.45 * aRnd.x);
  vec2 away = aUv - uP0.xy; away.x *= asp; away = normalize(away + 1e-4);
  vec2 drift = vec2(sin(aRnd.x * 6.28 + uTime * 0.9), cos(aRnd.y * 9.1 + uTime * 0.7)) * 0.05;
  vec2 off = L * (drift + away * 0.035 + vec2(0.0, 0.07 + 0.09 * aRnd.y));
  off.x /= asp;
  vec2 p = aUv + off;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
  vec2 s = uRes / uTexRes; float k = max(s.x, s.y); vec2 size = uTexRes * k;
  vec2 tuv = (aUv * uRes + (size - uRes) * 0.5) / size;
  vCol = texture2D(tMap, tuv).rgb;
  vLift = L;
  gl_PointSize = uSize * (1.0 - 0.5 * L);
}`;
const F627 = /* glsl */ `
precision highp float;
varying vec3 vCol;
varying float vLift;
void main(){
  vec2 pc = gl_PointCoord - 0.5;
  float disc = smoothstep(0.5, 0.36, length(pc));
  float a = mix(1.0, disc, smoothstep(0.02, 0.12, vLift));
  gl_FragColor = vec4(vCol * (1.0 + 0.6 * vLift), a);
}`;
function M627() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const tgt = useRef({ x: 0.5, y: 0.5 });
  usePointer(
    root,
    dot,
    (t, w, h) => [w * (0.5 + 0.36 * Math.sin(t * 0.55)), h * (0.5 + 0.26 * Math.sin(t * 1.25 + 0.6))],
    (x, y) => {
      const el = root.current;
      if (!el) return;
      tgt.current = { x: x / Math.max(1, el.clientWidth), y: 1 - y / Math.max(1, el.clientHeight) };
    },
  );
  useEffect(() => {
    const canvas = cv.current;
    const el = root.current;
    if (!canvas || !el || prefersReducedMotion()) return;
    let dead = false;
    let cleanup = () => {};
    const stop = whenNear(el, async () => {
      const [ogl, img] = await Promise.all([import("ogl"), toCanvas(scene(1, 1600, 1000, "KILN ROAST"), 1600, 1000)]);
      if (dead) return;
      try {
        const { Renderer, Geometry, Program, Mesh, Texture } = ogl;
        const renderer = new Renderer({ canvas, dpr: 1, alpha: true, antialias: false });
        const gl = renderer.gl;
        gl.clearColor(0, 0, 0, 0);
        const r0 = el.getBoundingClientRect();
        const COLS = 230;
        const ROWS = Math.max(40, Math.round((COLS * r0.height) / Math.max(1, r0.width)));
        const n = COLS * ROWS;
        const uv = new Float32Array(n * 2);
        const rnd = new Float32Array(n * 2);
        for (let j = 0; j < ROWS; j++)
          for (let i = 0; i < COLS; i++) {
            const k = j * COLS + i;
            uv[k * 2] = (i + 0.5) / COLS;
            uv[k * 2 + 1] = (j + 0.5) / ROWS;
            rnd[k * 2] = Math.random();
            rnd[k * 2 + 1] = Math.random();
          }
        const geometry = new Geometry(gl, { aUv: { size: 2, data: uv }, aRnd: { size: 2, data: rnd } });
        const tex = new Texture(gl, { image: img, generateMipmaps: false });
        const P = [0, 1, 2, 3].map(() => [0.5, 0.5, 1]);
        const uniforms = {
          uRes: { value: [1, 1] },
          uTexRes: { value: [1600, 1000] },
          uTime: { value: 0 },
          uSize: { value: 6 },
          tMap: { value: tex },
          uP0: { value: P[0] },
          uP1: { value: P[1] },
          uP2: { value: P[2] },
          uP3: { value: P[3] },
        };
        const program = new Program(gl, { vertex: V627, fragment: F627, uniforms, transparent: true, depthTest: false });
        const mesh = new Mesh(gl, { geometry, program, mode: gl.POINTS });
        const resize = () => {
          const r = el.getBoundingClientRect();
          renderer.setSize(Math.max(1, r.width), Math.max(1, r.height));
          canvas.style.width = "100%";
          canvas.style.height = "100%";
          uniforms.uRes.value = [r.width, r.height];
          uniforms.uSize.value = Math.max(r.width / COLS, r.height / ROWS) + 1.2;
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(el);
        let visible = false;
        const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: "100px" });
        io.observe(el);
        const t0 = performance.now();
        let raf = 0;
        let shown = false;
        const loop = () => {
          raf = requestAnimationFrame(loop);
          if (!visible) return;
          uniforms.uTime.value = (performance.now() - t0) / 1000;
          // trail of lagging followers: where the pointer has been keeps lifted a moment, then re-settles
          const g = tgt.current;
          const lag = [0.45, 0.09, 0.05, 0.03];
          let px = g.x;
          let py = g.y;
          P.forEach((p, i) => {
            p[0] += (px - p[0]) * lag[i];
            p[1] += (py - p[1]) * lag[i];
            [px, py] = [p[0], p[1]];
          });
          renderer.render({ scene: mesh });
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
          gl.getExtension("WEBGL_lose_context")?.loseContext();
        };
      } catch (err) {
        console.warn("[M627] WebGL off, showing the photo:", (err as Error).message);
      }
    });
    return () => {
      dead = true;
      stop();
      cleanup();
    };
  }, []);
  return (
    <Stage r={root} className="bg-[#120a0d]" g1="rgba(255,120,110,.5)" g2="rgba(255,190,120,.22)">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={scene(1, 1600, 1000, "KILN ROAST")} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      <canvas ref={cv} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500" aria-hidden />
      <Sheen g1="rgba(255,120,110,.5)" />
      <div className="pointer-events-none absolute left-[6%] top-[9%] z-40">
        <p className="text-[13px] uppercase tracking-[0.3em] text-white/75">Kiln Roast · Small batch</p>
        <h3 className="mt-3 text-[clamp(44px,4.8vw,78px)] font-[500] leading-[0.92] tracking-[-0.02em]" style={{ fontFamily: F.fr }}>
          Roasted to rise.
        </h3>
      </div>
      <p className="pointer-events-none absolute bottom-[8%] right-[6%] z-40 text-right text-[15px] text-white/80">
        Single-origin, 250 g
        <br />
        <b className="text-[22px] text-white">₹ 740</b>
      </p>
      <Dot r={dot} />
    </Stage>
  );
}

/* ---------- M628 · Animated grid pattern (variant of M60: random cells of a line grid fill and fade) ---------- */
const CELL628 = 48;
const COLS628 = 30;
const ROWS628 = 14;
const SEED628 = [
  [4, 3], [9, 6], [14, 2], [20, 9], [25, 4], [7, 10], [17, 11], [23, 7], [11, 1], [27, 12], [2, 8], [19, 3],
  [5, 12], [13, 8], [22, 1], [28, 6], [1, 2], [16, 6], [24, 10], [8, 4],
];
function M628() {
  const root = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const id = useId().replace(/:/g, "");
  const on = useRef(false);
  const started = useRef(false);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    return () => {
      const rects = svg.current?.querySelectorAll("rect[data-c]");
      if (rects) gsap.killTweensOf(rects);
    };
  }, []);
  useVisible(root, (v) => {
    on.current = v;
    const rects = Array.from(svg.current?.querySelectorAll<SVGRectElement>("rect[data-c]") ?? []);
    if (!rects.length) return;
    if (v && !started.current) {
      started.current = true;
      const cycle = (r: SVGRectElement, first = false) => {
        if (!first) {
          r.setAttribute("x", String(gsap.utils.random(0, COLS628 - 1, 1) * CELL628 + 1));
          r.setAttribute("y", String(gsap.utils.random(0, ROWS628 - 1, 1) * CELL628 + 1));
        }
        gsap.fromTo(r, { opacity: first ? Number(r.getAttribute("opacity") ?? 0) : 0 }, { opacity: gsap.utils.random(0.45, 0.95), duration: gsap.utils.random(0.7, 1.5), ease: "sine.inOut", yoyo: true, repeat: 1, delay: gsap.utils.random(0, 0.9), onComplete: () => cycle(r) });
      };
      rects.forEach((r) => cycle(r, true));
      return;
    }
    gsap.getTweensOf(rects).forEach((tw) => (v ? tw.resume() : tw.pause()));
  });
  return (
    <Stage r={root} className="bg-[#070a10]" g1="rgba(90,200,255,.42)" g2="rgba(120,110,255,.22)">
      <svg ref={svg} className="absolute inset-0 h-full w-full" viewBox={`0 0 ${COLS628 * CELL628} ${ROWS628 * CELL628}`} preserveAspectRatio="xMidYMid slice" aria-hidden style={{ WebkitMaskImage: "radial-gradient(75% 80% at 50% 50%,#000 30%,transparent 100%)", maskImage: "radial-gradient(75% 80% at 50% 50%,#000 30%,transparent 100%)" }}>
        <defs>
          <pattern id={`g${id}`} width={CELL628} height={CELL628} patternUnits="userSpaceOnUse">
            <path d={`M${CELL628} 0H0V${CELL628}`} fill="none" stroke="rgba(150,200,255,.22)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#g${id})`} />
        {SEED628.map(([cx, cy], i) => (
          <rect key={i} data-c x={cx * CELL628 + 1} y={cy * CELL628 + 1} width={CELL628 - 1} height={CELL628 - 1} fill="rgba(90,200,255,.38)" opacity={i % 3 === 0 ? 0.8 : 0} />
        ))}
      </svg>
      <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center text-center">
        <div>
          <p className="text-[13px] uppercase tracking-[0.3em] text-white/60">Gridline Cloud · v4.2</p>
          <h3 className="mt-4 text-[clamp(52px,6vw,96px)] font-[650] leading-[0.92] tracking-[-0.035em]" style={{ fontFamily: F.sg }}>
            Ship on a grid.
          </h3>
          <p className="mt-5 text-[15px] text-white/65">Team plan · ₹ 1,200 per seat / month</p>
        </div>
      </div>
    </Stage>
  );
}

/* ---------- M629 · Glowing star grid (variant of M60: random stars glow; many glow at once while hovered) ---------- */
const C629 = 22;
const R629 = 12;
function M629() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const st = useRef({ acc: 0, hot: false, lit: new Map<number, number>() });
  usePointer(
    root,
    dot,
    (t, w, h) => [w * (0.5 + 0.4 * Math.sin(t * 1.05)), h * (0.5 + 0.16 * Math.sin(t * 2.1))],
    (x, y, dt, t) => {
      const el = root.current;
      const c = card.current;
      if (!el || !c) return;
      const rr = el.getBoundingClientRect();
      const cr = c.getBoundingClientRect();
      const hot = x > cr.left - rr.left && x < cr.right - rr.left && y > cr.top - rr.top && y < cr.bottom - rr.top;
      const s = st.current;
      if (hot !== s.hot) {
        s.hot = hot;
        c.dataset.hot = hot ? "1" : "0";
      }
      s.acc += dt;
      if (s.acc < 0.1) return;
      s.acc = 0;
      const stars = c.querySelectorAll<HTMLElement>(".m629-s");
      // switch off stars that have glowed long enough
      for (const [i, at] of s.lit) {
        if (t - at > (hot ? 0.5 : 0.9)) {
          stars[i]?.classList.remove("on");
          s.lit.delete(i);
        }
      }
      const add = hot ? 34 : 3;
      for (let k = 0; k < add; k++) {
        const i = (Math.random() * stars.length) | 0;
        stars[i]?.classList.add("on");
        s.lit.set(i, t);
      }
    },
  );
  return (
    <Stage r={root} className="bg-[#06080f]" g1="rgba(110,150,255,.55)" g2="rgba(180,120,255,.22)">
      <div className="grid h-full place-items-center">
        <div ref={card} className="relative w-[min(560px,42%)] overflow-hidden rounded-[26px] border border-white/12 bg-[#0b0f1c]/90 p-8 transition-[border-color] duration-500 data-[hot=1]:border-[#8fb2ff]/50">
          <div className="grid gap-x-[14px] gap-y-[14px]" style={{ gridTemplateColumns: `repeat(${C629}, 4px)`, justifyContent: "space-between" }}>
            {Array.from({ length: C629 * R629 }, (_, i) => (
              <span key={i} className={`m629-s ${i % 29 === 0 || i % 41 === 7 ? "on" : ""}`} />
            ))}
          </div>
          <p className="mt-7 text-[13px] uppercase tracking-[0.28em] text-white/55">Night Sky Kit · 64 stars</p>
          <h3 className="mt-3 text-[clamp(32px,3vw,46px)] font-[600] leading-[1] tracking-[-0.025em]" style={{ fontFamily: F.sg }}>
            Light up the ceiling.
          </h3>
          <p className="mt-3 text-[15px] text-white/65">
            Glow-in-dark set · <b className="text-white">₹ 1,450</b>
          </p>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ---------- M630 · Dot matrix radial light-up (variant of M17: dots switch on from the centre in a flickering wave) ---------- */
const F630 = /* glsl */ `
${HASH}
uniform float uR;
void main(){
  vec2 px = vUv * uRes;
  float cs = 13.0;
  vec2 cell = floor(px / cs);
  vec2 f = fract(px / cs) - 0.5;
  float h = h21(cell);
  float fl = h21(cell + floor(uTime * (3.0 + h * 5.0)) * 7.13);
  vec2 c = (cell * cs + cs * 0.5 - 0.5 * uRes) / uRes.y;
  float d = length(c);
  float rev = smoothstep(uR, uR - 0.2, d + h * 0.07);
  float edge = smoothstep(0.12, 0.0, abs(d - uR)) * step(0.05, uR);
  float a = 0.07 + rev * (0.3 + 0.7 * fl) + edge * 0.7 * fl;
  float sq = step(max(abs(f.x), abs(f.y)), 0.27);
  vec3 col = mix(vec3(0.2, 0.95, 0.8), vec3(0.45, 0.6, 1.0), smoothstep(0.0, 0.9, d + 0.3 * h));
  col = mix(col, vec3(1.0), edge * 0.4);
  vec3 bg = vec3(0.02, 0.03, 0.04);
  gl_FragColor = vec4(bg + col * a * sq, 1.0);
}`;
function M630() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const st = useRef({ hot: false, r: 0, last: -1 });
  usePointer(
    root,
    dot,
    (t, w, h) => [w * (0.5 + 0.42 * Math.sin(t * 0.8)), h * (0.52 + 0.1 * Math.cos(t * 1.6))],
    (x, y) => {
      const el = root.current;
      const c = card.current;
      if (!el || !c) return;
      const rr = el.getBoundingClientRect();
      const cr = c.getBoundingClientRect();
      st.current.hot = x > cr.left - rr.left && x < cr.right - rr.left && y > cr.top - rr.top && y < cr.bottom - rr.top;
      c.dataset.hot = st.current.hot ? "1" : "0";
    },
  );
  const onFrame = (u: U, t: number) => {
    const s = st.current;
    const dt = s.last < 0 ? 0.016 : Math.min(0.05, t - s.last);
    s.last = t;
    const target = s.hot ? 1.25 : 0.0;
    s.r += (target - s.r) * Math.min(1, dt * (s.hot ? 1.6 : 2.4));
    (u.uR as { value: number }).value = s.r;
  };
  return (
    <Stage r={root} className="bg-[#04060a]" g1="rgba(60,240,200,.5)" g2="rgba(110,140,255,.22)">
      <Shader
        frag={F630}
        uniforms={() => ({ uR: { value: 0 } })}
        onFrame={onFrame}
        fallback="radial-gradient(circle at center,rgba(60,240,200,.5) 1.6px,transparent 2px) center/13px 13px,#04060a"
      />
      <Sheen g1="rgba(60,240,200,.5)" />
      <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center">
        <div ref={card} className="w-[min(520px,40%)] rounded-[26px] border border-white/15 bg-[#04060a]/70 p-9 text-center transition-[border-color] duration-500 data-[hot=1]:border-[#3cf0c8]/60">
          <p className="text-[13px] uppercase tracking-[0.3em] text-white/60">Signal Labs · Beta</p>
          <h3 className="mt-4 text-[clamp(40px,4vw,64px)] font-[700] leading-[0.94] tracking-[-0.03em]" style={{ fontFamily: F.sy }}>
            Switch it on.
          </h3>
          <p className="mt-4 text-[15px] text-white/70">Early access · ₹ 499 / month</p>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ---------- M631 · Cursor trail grid (variant of M60: the cell under the pointer lights, then fades, leaving a trail) ---------- */
const CELL631 = 40;
const COLS631 = 36;
const ROWS631 = 16;
function M631() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const val = useRef<Float32Array>(new Float32Array(COLS631 * ROWS631));
  usePointer(
    root,
    dot,
    (t, w, h) => [w * (0.5 + 0.42 * Math.sin(t * 0.9)), h * (0.5 + 0.38 * Math.sin(t * 1.7 + 0.4))],
    (x, y, dt) => {
      const el = root.current;
      const sv = svg.current;
      if (!el || !sv) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      const VW = COLS631 * CELL631;
      const VH = ROWS631 * CELL631;
      const s = Math.max(w / VW, h / VH);
      const vx = (x - (w - VW * s) / 2) / s;
      const vy = (y - (h - VH * s) / 2) / s;
      const ci = Math.floor(vx / CELL631);
      const cj = Math.floor(vy / CELL631);
      const v = val.current;
      const rects = sv.querySelectorAll<SVGRectElement>("rect[data-c]");
      const decay = Math.exp(-dt * 1.9);
      for (let k = 0; k < v.length; k++) {
        if (v[k] <= 0) continue;
        v[k] = v[k] * decay - dt * 0.02;
        if (v[k] < 0.01) v[k] = 0;
        rects[k]?.setAttribute("fill-opacity", v[k].toFixed(3));
      }
      if (ci >= 0 && ci < COLS631 && cj >= 0 && cj < ROWS631) {
        const k = cj * COLS631 + ci;
        v[k] = 1;
        rects[k]?.setAttribute("fill-opacity", "1");
      }
    },
  );
  return (
    <Stage r={root} className="bg-[#080a0c]" g1="rgba(255,190,90,.5)" g2="rgba(255,110,90,.2)">
      <svg ref={svg} className="absolute inset-0 h-full w-full" viewBox={`0 0 ${COLS631 * CELL631} ${ROWS631 * CELL631}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
        {Array.from({ length: COLS631 * ROWS631 }, (_, k) => {
          const i = k % COLS631;
          const j = Math.floor(k / COLS631);
          const lit = [k === 6 * COLS631 + 12, k === 6 * COLS631 + 13, k === 7 * COLS631 + 13, k === 7 * COLS631 + 14].indexOf(true);
          return <rect key={k} data-c x={i * CELL631 + 0.5} y={j * CELL631 + 0.5} width={CELL631 - 1} height={CELL631 - 1} fill="#ffb85c" fillOpacity={lit >= 0 ? 0.2 + lit * 0.2 : 0} stroke="rgba(255,255,255,.08)" strokeWidth="1" />;
        })}
      </svg>
      <Sheen g1="rgba(255,190,90,.5)" opacity={0.35} />
      <div className="pointer-events-none absolute left-[6%] bottom-[9%] z-40">
        <p className="text-[13px] uppercase tracking-[0.3em] text-white/65">Trailhead Studio · Portfolio 2026</p>
        <h3 className="mt-3 text-[clamp(44px,5vw,82px)] font-[700] leading-[0.92] tracking-[-0.035em]" style={{ fontFamily: F.sg }}>
          Leave a mark.
        </h3>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ---------- M632 · Skewed isometric flash grid (variant of M631: a huge skewed grid; cells flash random colours) ---------- */
const COLS632 = 31;
const ROWS632 = 16;
const PAL632 = ["#7dd3fc", "#f9a8d4", "#86efac", "#fde047", "#c4b5fd", "#fca5a5", "#93c5fd", "#fdba74"];
function M632() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const st = useRef<{ last: Element | null; acc: number }>({ last: null, acc: 0 });
  const flash = (el: Element | null) => {
    if (!(el instanceof HTMLElement) || !el.dataset.c) return;
    gsap.fromTo(el, { backgroundColor: PAL632[(Math.random() * PAL632.length) | 0] }, { backgroundColor: "rgba(0,0,0,0)", duration: 1.5, ease: "power1.out", overwrite: true });
  };
  usePointer(
    root,
    dot,
    (t, w, h) => [w * (0.5 + 0.4 * Math.sin(t * 0.7)), h * (0.5 + 0.34 * Math.sin(t * 1.3 + 1.1))],
    (x, y, dt) => {
      const el = root.current;
      if (!el) return;
      const s = st.current;
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + x, r.top + y);
      if (hit && hit !== s.last) {
        s.last = hit;
        flash(hit);
      }
      // auto-flash a few random cells
      s.acc += dt;
      if (s.acc > 0.09) {
        s.acc = 0;
        const cells = el.querySelectorAll("[data-c]");
        flash(cells[(Math.random() * cells.length) | 0]);
      }
    },
  );
  useEffect(() => {
    const el = root.current;
    return () => {
      if (el) gsap.killTweensOf(el.querySelectorAll("[data-c]"));
    };
  }, []);
  return (
    <Stage r={root} className="bg-[#0b1220]" g1="rgba(125,211,252,.5)" g2="rgba(249,168,212,.22)">
      <div
        className="absolute left-1/2 top-1/2 grid"
        style={{ width: COLS632 * 120, height: ROWS632 * 120, marginLeft: -(COLS632 * 60), marginTop: -(ROWS632 * 60), gridTemplateColumns: `repeat(${COLS632}, 120px)`, transform: "skewX(-48deg) skewY(14deg) scale(0.62)" }}
      >
        {Array.from({ length: COLS632 * ROWS632 }, (_, k) => (
          <div key={k} data-c="1" className="border-b border-r border-[#334155]/80" style={{ backgroundColor: k % 37 === 5 ? PAL632[k % PAL632.length] : "rgba(0,0,0,0)" }} />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 z-30" style={{ background: "radial-gradient(60% 60% at 50% 50%,transparent 30%,rgba(11,18,32,.85) 100%)" }} aria-hidden />
      <Sheen g1="rgba(125,211,252,.5)" opacity={0.35} />
      <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center text-center">
        <div>
          <p className="text-[13px] uppercase tracking-[0.3em] text-white/70">Tessera Design Week · Pune</p>
          <h3 className="mt-4 text-[clamp(52px,6vw,98px)] font-[700] leading-[0.9] tracking-[-0.035em]" style={{ fontFamily: F.sy }}>
            Every square counts.
          </h3>
          <p className="mt-5 text-[15px] text-white/75">Three-day pass · ₹ 2,800</p>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ---------- M633 · Dot grid swell near cursor (variant of M60: dots swell + brighten near the pointer, rings ripple out) ---------- */
const F633 = /* glsl */ `
uniform vec2 uM;
void main(){
  vec2 px = vUv * uRes;
  float cs = 26.0;
  vec2 cc = (floor(px / cs) + 0.5) * cs;
  float d = length(cc - uM) / uRes.y;
  float near = exp(-d * d / 0.022);
  float wave = 0.5 + 0.5 * sin(d * 30.0 - uTime * 4.2);
  wave = pow(wave, 3.0) * exp(-d * 3.2);
  float sw = clamp(near * 0.95 + wave * 0.45, 0.0, 1.2);
  float r = 1.6 + 6.0 * sw;
  float dt = smoothstep(r + 1.0, r - 0.6, length(px - cc));
  vec3 cold = vec3(0.42, 0.47, 0.62);
  vec3 warm = vec3(1.0, 0.78, 0.5);
  vec3 col = mix(cold, warm, clamp(sw, 0.0, 1.0)) * (0.28 + 0.9 * sw);
  float pd = length(px - uM) / uRes.y;
  vec3 glow = vec3(1.0, 0.55, 0.3) * exp(-pd * pd / 0.035) * 0.32;
  vec3 bg = vec3(0.03, 0.03, 0.05);
  gl_FragColor = vec4(bg + glow + col * dt, 1.0);
}`;
function M633() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const m = useRef({ x: 0, y: 0, tx: 0, ty: 0, init: false });
  usePointer(
    root,
    dot,
    (t, w, h) => [w * (0.5 + 0.36 * Math.sin(t * 0.75)), h * (0.5 + 0.3 * Math.sin(t * 1.35 + 0.8))],
    (x, y) => {
      const el = root.current;
      if (!el) return;
      const s = m.current;
      s.tx = x;
      s.ty = el.clientHeight - y;
      if (!s.init) [s.x, s.y, s.init] = [s.tx, s.ty, true];
    },
  );
  const onFrame = (u: U) => {
    const s = m.current;
    s.x += (s.tx - s.x) * 0.16;
    s.y += (s.ty - s.y) * 0.16;
    (u.uM as { value: number[] }).value = [s.x, s.y];
  };
  return (
    <Stage r={root} className="bg-[#07070c]" g1="rgba(255,150,90,.5)" g2="rgba(120,130,255,.2)">
      <Shader
        frag={F633}
        uniforms={() => ({ uM: { value: [-999, -999] } })}
        onFrame={onFrame}
        fallback="radial-gradient(circle at center,rgba(150,160,200,.4) 1.6px,transparent 2.2px) center/26px 26px,#07070c"
      />
      <Sheen g1="rgba(255,150,90,.5)" />
      <div className="pointer-events-none absolute right-[6%] top-[10%] z-40 text-right">
        <p className="text-[13px] uppercase tracking-[0.3em] text-white/60">Halcyon Audio · Studio monitor</p>
        <h3 className="mt-3 text-[clamp(44px,4.8vw,78px)] font-[500] leading-[0.92] tracking-[-0.02em]" style={{ fontFamily: F.is }}>
          Feel every ripple.
        </h3>
        <p className="mt-3 text-[15px] text-white/70">Pair · ₹ 42,000</p>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ---------- M634 · Cursor dot spotlight (variant of M60: the bright dot pattern exists only inside a mask at the pointer) ---------- */
function M634() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const s = useRef({ x: 0, y: 0, init: false });
  useOn(root);
  usePointer(
    root,
    dot,
    (t, w, h) => [w * (0.5 + 0.38 * Math.sin(t * 0.85)), h * (0.5 + 0.3 * Math.sin(t * 1.5 + 0.5))],
    (x, y) => {
      const el = root.current;
      if (!el) return;
      const p = s.current;
      if (!p.init) [p.x, p.y, p.init] = [x, y, true];
      p.x += (x - p.x) * 0.22;
      p.y += (y - p.y) * 0.22;
      el.style.setProperty("--mx", `${p.x.toFixed(1)}px`);
      el.style.setProperty("--my", `${p.y.toFixed(1)}px`);
    },
  );
  return (
    <Stage r={root} className="bg-[#09080f]" g1="rgba(150,110,255,.5)" g2="rgba(210,120,255,.2)">
      <div className="m634-base" aria-hidden />
      <div className="m634-lit" aria-hidden />
      <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center text-center">
        <div className="max-w-[min(900px,80%)]">
          <p className="text-[13px] uppercase tracking-[0.3em] text-white/60">Quill Notes · Desktop app</p>
          <h3 className="mt-4 text-[clamp(48px,5.4vw,88px)] font-[650] leading-[1.02] tracking-[-0.035em]" style={{ fontFamily: F.mr }}>
            Find the idea, <span className="m634-hl">fast.</span>
          </h3>
          <p className="mt-5 text-[15px] text-white/65">Lifetime licence · ₹ 3,990</p>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ---------- M635 · Dot grid ripple (variant of M69: sonar pings push dots away and back with distance-staggered timing) ---------- */
const C635 = 28;
const R635 = 13;
function M635() {
  const root = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const api = useRef<{ ping: (i?: number) => void }>({ ping: () => {} });
  useEffect(() => {
    const g = grid.current;
    if (!g || prefersReducedMotion()) return;
    const dots = Array.from(g.querySelectorAll<HTMLElement>("[data-d]"));
    let on = false;
    let cur: gsap.core.Timeline | null = null;
    const ctx = gsap.context(() => {});
    const ping = (from?: number) => {
      const o = from ?? ((Math.random() * dots.length) | 0);
      const ox = o % C635;
      const oy = Math.floor(o / C635);
      const vec = dots.map((_, i) => {
        const dx = (i % C635) - ox;
        const dy = Math.floor(i / C635) - oy;
        const d = Math.hypot(dx, dy) || 1;
        const fall = Math.max(0.12, 1 - d / 22);
        return { x: (dx / d) * 11 * fall, y: (dy / d) * 11 * fall, s: 1 + 1.5 * fall, f: fall };
      });
      cur?.progress(1);
      ctx.add(() => {
        const stagger = { grid: [R635, C635] as [number, number], from: o, each: 0.045 };
        cur = gsap
          .timeline()
          .to(dots, { x: (i) => vec[i].x, y: (i) => vec[i].y, scale: (i) => vec[i].s, backgroundColor: (i) => (vec[i].f > 0.45 ? "#ffcf8a" : "#8fa6ff"), duration: 0.28, ease: "power2.out", stagger })
          .to(dots, { x: 0, y: 0, scale: 1, backgroundColor: "#3a4260", duration: 0.75, ease: "power2.inOut", stagger }, 0.28);
      });
    };
    api.current.ping = (i) => on && ping(i);
    const master = gsap.timeline({ repeat: -1, paused: true });
    master.call(() => ping()).to({}, { duration: 2.2 });
    const io = new IntersectionObserver(([e]) => {
      on = e.isIntersecting;
      if (on) {
        master.play();
        cur?.play();
      } else {
        master.pause();
        cur?.pause();
      }
    });
    io.observe(g);
    return () => {
      io.disconnect();
      master.kill();
      ctx.revert();
    };
  }, []);
  return (
    <Stage r={root} className="bg-[#070912]" g1="rgba(120,140,255,.5)" g2="rgba(255,190,120,.22)">
      <div className="flex h-full flex-col items-center justify-center gap-10">
        <div ref={grid} className="grid gap-[20px]" style={{ gridTemplateColumns: `repeat(${C635}, 8px)` }}>
          {Array.from({ length: C635 * R635 }, (_, i) => (
            <button key={i} type="button" data-d tabIndex={-1} aria-label="Ping" onClick={() => api.current.ping(i)} className="h-[8px] w-[8px] cursor-pointer rounded-full bg-[#3a4260]" />
          ))}
        </div>
        <div className="pointer-events-none text-center">
          <h3 className="text-[clamp(36px,3.6vw,58px)] font-[650] leading-[0.95] tracking-[-0.03em]" style={{ fontFamily: F.sg }}>
            Sonar for your inbox.
          </h3>
          <p className="mt-3 text-[15px] text-white/65">Pinglet Mail · Pro plan ₹ 349 / month</p>
        </div>
      </div>
    </Stage>
  );
}

/* ---------- M636 · Perspective grid floor (variant of M60: a 3D grid plane runs toward the viewer, fading at the horizon) ---------- */
function M636() {
  const root = useRef<HTMLDivElement>(null);
  useOn(root);
  return (
    <Stage r={root} className="bg-[#0a0614]" g1="rgba(255,90,190,.5)" g2="rgba(110,90,255,.3)">
      <div className="absolute inset-x-0 top-0 h-[44%]" style={{ background: "linear-gradient(to bottom,#0a0614 0%,#24103f 70%,#5a1d5e 100%)" }} aria-hidden />
      <div className="m636-sun absolute left-1/2 top-[42%] h-[6px] w-[70%] -translate-x-1/2 rounded-full" style={{ background: "radial-gradient(closest-side,rgba(255,170,230,1),rgba(255,90,190,.6) 50%,transparent)" }} aria-hidden />
      <div className="m636-floor" aria-hidden>
        <div className="m636-plane b12g4-run" />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-[12%] z-40 text-center">
        <p className="text-[13px] uppercase tracking-[0.3em] text-white/70">Horizon Expo · Hall 3 · 22–24 Jan</p>
        <h3 className="mt-4 text-[clamp(52px,6vw,98px)] font-[800] uppercase leading-[0.9] tracking-[-0.03em]" style={{ fontFamily: F.sy }}>
          Step into next.
        </h3>
        <p className="mt-4 text-[15px] text-white/75">Early-bird pass · ₹ 1,999</p>
      </div>
    </Stage>
  );
}

/* ---------- M637 · Text-ring tunnel (variant of M39: rings of type spin at different speeds and taper into a tunnel) ---------- */
const RINGS637 = [
  { r: 600, fs: 30, d: 70, e: "360deg", z: 0, o: 0.85, t: "NEW SEASON · OPEN STUDIO · " },
  { r: 470, fs: 24, d: 52, e: "-360deg", z: -110, o: 0.7, t: "CERAMICS · PRINT · TEXTILE · " },
  { r: 365, fs: 21, d: 40, e: "360deg", z: -220, o: 0.55, t: "SAT 09 NOV · FREE ENTRY · " },
  { r: 285, fs: 19, d: 30, e: "-360deg", z: -330, o: 0.42, t: "TWELVE MAKERS · ONE ROOM · " },
  { r: 225, fs: 18, d: 22, e: "360deg", z: -440, o: 0.32, t: "COME AS YOU ARE · " },
];
const RING637_CHARS = RINGS637.map((g) => {
  const n = Math.floor((2 * Math.PI * g.r) / (g.fs * 0.74));
  return Array.from({ length: n }, (_, i) => g.t[i % g.t.length]);
});
function M637() {
  const root = useRef<HTMLDivElement>(null);
  useOn(root);
  return (
    <Stage r={root} className="bg-[#0c0a08]" g1="rgba(255,190,120,.45)" g2="rgba(255,120,90,.22)">
      <div className="absolute inset-0" style={{ perspective: "900px" }} aria-hidden>
        <div className="absolute inset-0" style={{ transformStyle: "preserve-3d", transform: "rotateX(14deg)" }}>
          {RINGS637.map((g, k) => (
            <div key={k} className="m637-ring b12g4-run" style={{ "--z": `${g.z}px`, "--d": `${g.d}s`, "--e": g.e, color: `rgba(255,232,205,${g.o})`, fontFamily: F.sg, fontSize: g.fs, fontWeight: 600 } as CSSProperties}>
              {RING637_CHARS[k].map((ch, i) => (
                <span key={i} style={{ transform: `rotate(${(i * 360) / RING637_CHARS[k].length}deg) translate(-0.3em,${-g.r}px)` }}>
                  {ch}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 z-30" style={{ background: "radial-gradient(18% 26% at 50% 50%,rgba(12,10,8,.95) 40%,transparent 100%)" }} aria-hidden />
      <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center text-center">
        <div>
          <h3 className="text-[clamp(40px,4.2vw,68px)] font-[500] leading-[0.92] tracking-[-0.02em]" style={{ fontFamily: F.fr }}>
            Open
            <br />
            Studio
          </h3>
          <p className="mt-3 text-[13px] uppercase tracking-[0.28em] text-white/70">Kiln &amp; Loom · Goa</p>
        </div>
      </div>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M626", name: "Particle storm wordmark", how: "The wordmark is a shimmering field of dots and squares that keep swirling inside the letters (canvas)", kind: "play", C: M626 },
  { code: "M627", name: "Image lifts into particles at cursor", how: "The photo stays whole; near the pointer its pixels lift off as drifting particles and re-settle behind it (OGL points)", kind: "play", C: M627 },
  { code: "M628", name: "Animated grid pattern", how: "A thin SVG line grid; random cells fill and fade in and out on a loop", kind: "play", C: M628 },
  { code: "M629", name: "Glowing star grid", how: "Random dots in a grid light up with a glow; many glow at once while the card is hovered (scripted pointer)", kind: "play", C: M629 },
  { code: "M630", name: "Dot matrix radial light-up", how: "On hover a dot matrix switches on from the centre outward in a flickering radial wave, then dims (shader)", kind: "play", C: M630 },
  { code: "M631", name: "Cursor trail grid", how: "The grid cell under the pointer lights and fades after it leaves, drawing a trail (scripted pointer)", kind: "play", C: M631 },
  { code: "M632", name: "Skewed isometric flash grid", how: "A huge skewed grid; cells flash random colours under the pointer and at random by themselves", kind: "play", C: M632 },
  { code: "M633", name: "Dot grid swell near cursor", how: "Dots near the pointer swell and brighten, soft rings ripple outward and a glow follows (shader)", kind: "play", C: M633 },
  { code: "M634", name: "Cursor dot spotlight", how: "A bright dot pattern shows only inside a soft circle that follows the pointer (CSS mask)", kind: "play", C: M634 },
  { code: "M635", name: "Dot grid ripple", how: "Sonar pings from a random dot push neighbours away and back, staggered by distance; tap a dot to ping", kind: "play", C: M635 },
  { code: "M636", name: "Perspective grid floor", how: "A 3D grid plane recedes to a glowing horizon and runs toward the viewer in a seamless loop", kind: "play", C: M636 },
  { code: "M637", name: "Text-ring tunnel", how: "Rings of type spin at different speeds and taper in perspective into a tunnel around the headline", kind: "play", C: M637 },
];
