"use client";

// Image motions, batch 15 · group 5 (MOTION-MENU M709–M715): spheres, helixes, dither / ASCII renders and WebGL image
// changes. Small focused demos for /lab/motion. Every "play" demo plays by itself while on screen (a visible fake
// pointer stands in for drag / hover; the real mouse takes over when it moves), loops with no rest over 0.3 s, pauses
// off screen, and has a CSS-only glow loop (plus a second glow on top of image-covered stages). WebGL / canvas demos
// only rasterise textures / create the context once the stage is within ~1 screen of the viewport (dpr 1, or 0.7 for
// the per-pixel dither shaders) and release everything on unmount. ?static=1 / reduced motion: no JS motion, the
// markup is a sensible final state. Motion ideas only (rebuilt from scratch, no copied code).
import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { createShader, type GLHandle } from "@/lib/gl";
import { scene, toCanvas, useTicker } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const GROTESK = "'Space Grotesk Variable', system-ui, sans-serif";
const SERIF = "'Fraunces Variable', Georgia, serif";
const EDITORIAL = "'Instrument Serif', Georgia, serif";
const MONO = "ui-monospace, Menlo, Consolas, monospace";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const mod = (a: number, n: number) => ((a % n) + n) % n;

const CSS = `
.b15i5-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.55)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.22)),transparent 70%);animation:b15i5-drift 5.4s linear infinite alternate;will-change:transform}
@keyframes b15i5-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b15i5-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4);pointer-events:none;z-index:400;opacity:0}
html.is-static .b15i5-glow{animation:none}
html.is-static {.b15i5-glow{animation:none}}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", bg = "#0a0d16", g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; bg?: string; g1?: string; g2?: string }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 text-[#eef2ff] ${className}`} style={{ background: bg }}>
      <style href="b15i5-css" precedence="default">
        {CSS}
      </style>
      <div className="b15i5-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/** The CSS glow loop again, ON TOP of photos/cards/canvas (screen blend), so image-covered stages never freeze. */
const Sheen = ({ g1 }: { g1?: string }) => (
  <div className="b15i5-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.45, zIndex: 350 } as CSSProperties} aria-hidden />
);

/** The visible fake pointer (a ring). */
const Dot = ({ r }: { r: RefObject<HTMLDivElement | null> }) => <div ref={r} className="b15i5-dot" aria-hidden />;

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ src, className = "", style }: { src: string; className?: string; style?: CSSProperties }) => <img src={src} alt="" className={`h-full w-full object-cover ${className}`} style={style} draggable={false} />;

/** Seeded random (mulberry32): the same "random" layout on server and client. */
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

/** rAF loop that runs only while `el` is on screen; returns a stop function. */
function visibleLoop(el: Element, fn: (t: number, dt: number) => void) {
  let visible = false;
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: "100px" });
  io.observe(el);
  let raf = 0;
  let last = performance.now();
  const t0 = last;
  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (visible) fn((now - t0) / 1000, dt);
  };
  raf = requestAnimationFrame(loop);
  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
  };
}

type FP = { x: number; y: number; down: boolean };
type DriveH = {
  down: (x: number, y: number, el: HTMLDivElement) => void;
  move: (x: number, y: number, el: HTMLDivElement) => void;
  up: (el: HTMLDivElement) => void;
  frame: (dt: number, el: HTMLDivElement) => void;
};
type DriveApi = { press: () => void; release: () => void };

/**
 * Drag driver. A scripted gsap timeline moves a fake pointer (root px) and presses / releases it; every frame the
 * handlers get the fake pointer, or the real one (pointer events). A real pointer pauses the script and hides the ring
 * until 2.5 s after it last acted. `frame(dt)` runs every frame while on screen (inertia).
 */
function useDrive(root: RefObject<HTMLDivElement | null>, dot: RefObject<HTMLDivElement | null>, build: (fp: FP, el: HTMLDivElement, api: DriveApi) => gsap.core.Timeline, h: DriveH) {
  const hr = useRef(h);
  hr.current = h;
  const br = useRef(build);
  br.current = build;
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const fp: FP = { x: -100, y: -100, down: false };
    let on = false;
    let dead = false;
    let realAt = -1e9;
    let realDown = false;
    let tl: gsap.core.Timeline | null = null;
    const ctx = gsap.context(() => {}, el);
    const fakeOn = () => !realDown && performance.now() - realAt > 2500;
    const api: DriveApi = {
      press: () => {
        if (!fakeOn()) return;
        fp.down = true;
        hr.current.down(fp.x, fp.y, el);
      },
      release: () => {
        if (!fp.down) return;
        fp.down = false;
        hr.current.up(el);
      },
    };
    const local = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top] as const;
    };
    const pd = (e: PointerEvent) => {
      if (fp.down) {
        fp.down = false;
        hr.current.up(el);
      }
      realDown = true;
      realAt = performance.now();
      el.setPointerCapture?.(e.pointerId);
      const [x, y] = local(e);
      hr.current.down(x, y, el);
    };
    const pm = (e: PointerEvent) => {
      realAt = performance.now();
      const [x, y] = local(e);
      hr.current.move(x, y, el);
    };
    const pu = () => {
      if (!realDown) return;
      realDown = false;
      realAt = performance.now();
      hr.current.up(el);
    };
    el.addEventListener("pointerdown", pd);
    el.addEventListener("pointermove", pm);
    el.addEventListener("pointerup", pu);
    el.addEventListener("pointercancel", pu);
    const io = new IntersectionObserver(([e]) => (on = e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    const tick = (_t: number, dtMs: number) => {
      if (!on) {
        tl?.pause();
        return;
      }
      const fake = fakeOn();
      if (tl) {
        if (fake && tl.paused()) tl.resume();
        if (!fake && !tl.paused()) tl.pause();
      }
      if (fake && fp.down) hr.current.move(fp.x, fp.y, el);
      const d = dot.current;
      if (d) {
        d.style.transform = `translate3d(${fp.x.toFixed(1)}px,${fp.y.toFixed(1)}px,0) scale(${fp.down ? 0.8 : 1})`;
        d.style.opacity = fake ? "1" : "0";
      }
      hr.current.frame(Math.min(dtMs / 1000, 0.1), el);
    };
    gsap.ticker.add(tick);
    Promise.resolve(document.fonts?.ready).then(() => {
      if (dead) return;
      ctx.add(() => {
        tl = br.current(fp, el, api);
      });
    });
    return () => {
      dead = true;
      gsap.ticker.remove(tick);
      io.disconnect();
      el.removeEventListener("pointerdown", pd);
      el.removeEventListener("pointermove", pm);
      el.removeEventListener("pointerup", pu);
      el.removeEventListener("pointercancel", pu);
      ctx.revert();
    };
  }, [root, dot]);
}

/** Bayer ordered-dither thresholds (8×8 built from the 2×2 matrix recursively). */
const BAYER_GLSL = /* glsl */ `
float bay2(vec2 a){ a = floor(a); return fract(a.x * 0.5 + a.y * a.y * 0.75); }
float bay4(vec2 a){ return bay2(0.5 * a) * 0.25 + bay2(a); }
float bay8(vec2 a){ return bay4(0.5 * a) * 0.25 + bay2(a); }
`;

/** object-fit: cover for raw OGL shaders: st is 0..1 with y DOWN; returns a GL uv (flipY texture). */
const COVER_GLSL = /* glsl */ `
vec2 coverUv(vec2 st, vec2 res, vec2 tr){
  vec2 s = res / tr; float k = max(s.x, s.y); vec2 size = tr * k;
  vec2 uv = (st * res + (size - res) * 0.5) / size;
  return vec2(uv.x, 1.0 - uv.y);
}
`;

/* ---------- M709 · Image sphere (variant of M33) ---------- */
const M709_N = 46;
const M709_LABELS = ["NORTH", "TIDE", "EMBER", "FERN", "DUNE", "SLATE", "MOSS", "FLINT"];
const M709_SRC = M709_LABELS.map((l, i) => scene(i % 4, 360, 240, l));
const M709_PTS = Array.from({ length: M709_N }, (_, i) => {
  const y = 1 - (2 * (i + 0.5)) / M709_N;
  const r = Math.sqrt(1 - y * y);
  const phi = i * 2.399963;
  return [Math.cos(phi) * r, y, Math.sin(phi) * r] as const;
});
function m709Project(i: number, rx: number, ry: number) {
  const [x, y, z] = M709_PTS[i];
  const x1 = x * Math.cos(ry) + z * Math.sin(ry);
  const z1 = -x * Math.sin(ry) + z * Math.cos(ry);
  const y2 = y * Math.cos(rx) - z1 * Math.sin(rx);
  const z2 = y * Math.sin(rx) + z1 * Math.cos(rx);
  const f = (z2 + 1) / 2; // 0 back … 1 front
  return { x: x1, y: y2, z: z2, s: 0.5 + 0.78 * f, o: 0.12 + 0.88 * Math.pow(f, 1.6) };
}
function M709() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const ball = useRef<HTMLDivElement>(null);
  const st = useRef({ rx: 0.22, ry: 0, vx: 0, vy: 0.35, drag: false, lx: 0, ly: 0, lt: 0, fresh: true });
  const AUTO = 0.35;
  const render = () => {
    const b = ball.current;
    if (!b) return;
    const R = b.clientWidth * 0.42;
    const s = st.current;
    const tiles = b.children;
    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i] as HTMLElement;
      const p = m709Project(i, s.rx, s.ry);
      if (s.fresh) {
        t.style.left = "50%";
        t.style.top = "50%";
      }
      t.style.transform = `translate3d(${(p.x * R).toFixed(1)}px,${(p.y * R).toFixed(1)}px,0) scale(${p.s.toFixed(3)})`;
      t.style.opacity = p.o.toFixed(3);
      t.style.zIndex = String(Math.round((p.z + 1) * 100));
    }
    s.fresh = false;
  };
  useDrive(
    root,
    dot,
    (fp, el, api) => {
      const W = el.clientWidth;
      const H = el.clientHeight;
      fp.x = W * 0.8;
      fp.y = H * 0.85;
      const tl = gsap.timeline({ repeat: -1 });
      tl.to(fp, { x: W * 0.58, y: H * 0.48, duration: 0.5, ease: "power2.inOut" })
        .call(api.press)
        .to(fp, { x: W * 0.36, y: H * 0.56, duration: 0.36, ease: "power2.in" }) // fling left: the sphere spins fast, then coasts
        .call(api.release)
        .to(fp, { x: W * 0.3, y: H * 0.86, duration: 0.95, ease: "sine.inOut" })
        .to(fp, { x: W * 0.42, y: H * 0.56, duration: 0.45, ease: "power2.inOut" })
        .call(api.press)
        .to(fp, { x: W * 0.62, y: H * 0.42, duration: 0.4, ease: "power2.in" }) // fling right and up
        .call(api.release)
        .to(fp, { x: W * 0.8, y: H * 0.85, duration: 0.95, ease: "sine.inOut" });
      return tl;
    },
    {
      down: (x, y) => {
        const s = st.current;
        s.drag = true;
        s.lx = x;
        s.ly = y;
        s.lt = performance.now();
      },
      move: (x, y) => {
        const s = st.current;
        if (!s.drag) return;
        const now = performance.now();
        const dt = Math.max((now - s.lt) / 1000, 1 / 240);
        const dx = x - s.lx;
        const dy = y - s.ly;
        s.ry += dx * 0.006;
        s.rx = clamp(s.rx - dy * 0.006, -1.1, 1.1);
        s.vy = s.vy * 0.5 + ((dx * 0.006) / dt) * 0.5;
        s.vx = s.vx * 0.5 + ((-dy * 0.006) / dt) * 0.5;
        s.lx = x;
        s.ly = y;
        s.lt = now;
      },
      up: () => {
        const s = st.current;
        s.drag = false;
        s.vy = clamp(s.vy, -7, 7);
        s.vx = clamp(s.vx, -4, 4);
      },
      frame: (dt) => {
        const s = st.current;
        if (!s.drag) {
          // inertia, then it settles back into the slow auto-rotation and a gentle tilt
          s.ry += s.vy * dt;
          s.rx = clamp(s.rx + s.vx * dt, -1.1, 1.1);
          s.vy += (AUTO - s.vy) * (1 - Math.exp(-dt * 1.3));
          s.vx *= Math.exp(-dt * 2.2);
          s.rx += (0.22 - s.rx) * (1 - Math.exp(-dt * 0.9));
        }
        render();
      },
    },
  );
  return (
    <Stage r={root} bg="#080a12" g1="rgba(120,140,255,.55)" g2="rgba(255,150,110,.22)" className="cursor-grab touch-none select-none">
      <div className="pointer-events-none absolute left-[6%] top-[9%] z-[300]" style={{ fontFamily: SERIF }}>
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/55" style={{ fontFamily: GROTESK }}>
          Lookbook · 46 frames
        </p>
        <h3 className="mt-2 max-w-[9ch] text-[clamp(32px,3.6vw,56px)] font-light leading-[0.95] tracking-[-0.02em]">A whole season, in orbit.</h3>
      </div>
      <p className="pointer-events-none absolute bottom-[9%] right-[6%] z-[300] text-[13px] uppercase tracking-[0.22em] text-white/55" style={{ fontFamily: GROTESK }}>
        Drag to spin
      </p>
      <div className="absolute inset-0 flex items-center justify-center">
        <div ref={ball} className="relative aspect-square h-[92%]">
          {M709_PTS.map((_, i) => {
            const p = m709Project(i, 0.22, 0);
            return (
              <div
                key={i}
                className="absolute ml-[-8%] mt-[-5.4%] aspect-[3/2] w-[16%] overflow-hidden rounded-[8px] shadow-[0_10px_24px_rgba(0,0,0,.45)] will-change-transform"
                style={{ left: `${50 + p.x * 42}%`, top: `${50 + p.y * 42}%`, transform: `scale(${p.s.toFixed(3)})`, opacity: Number(p.o.toFixed(3)), zIndex: Math.round((p.z + 1) * 100) }}
              >
                <Img src={M709_SRC[i % M709_SRC.length]} />
              </div>
            );
          })}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ---------- M710 · Dither helix carousel (variant of M33) ---------- */
const M710_N = 14;
const M710_V = /* glsl */ `
attribute vec3 position;
attribute vec2 uv;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const M710_F = /* glsl */ `
precision highp float;
uniform sampler2D tMap;
uniform float uFocus, uAlpha;
uniform vec3 uInk, uPaper;
varying vec2 vUv;
${BAYER_GLSL}
void main(){
  vec2 uv = gl_FrontFacing ? vUv : vec2(1.0 - vUv.x, vUv.y);
  vec3 c = texture2D(tMap, uv).rgb;
  // rounded card corners (plane is 1.6 × 1.1 units)
  vec2 p = (vUv - 0.5) * vec2(1.6, 1.1);
  vec2 q = abs(p) - (vec2(0.8, 0.55) - 0.07);
  float m = 1.0 - smoothstep(0.0, 0.008, length(max(q, 0.0)) - 0.07);
  // receding cards: two-tone ordered dither; the focused card is clean
  float l = dot(c, vec3(0.3, 0.59, 0.11));
  float th = bay8(floor(gl_FragCoord.xy / 1.6));
  vec3 d = mix(uInk, uPaper, step(th, l * 1.2 - 0.04));
  vec3 col = mix(d, c, uFocus);
  gl_FragColor = vec4(col, m * uAlpha);
}`;
const M710_SRC = ["AW 01", "AW 02", "AW 03", "AW 04"].map((l, i) => scene(i, 640, 440, l));
function M710() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const fb = useRef<HTMLDivElement>(null);
  const near = useNear(root);
  useEffect(() => {
    if (!near) return;
    let dead = false;
    let stop: (() => void) | null = null;
    (async () => {
      const [ogl, ...imgs] = await Promise.all([import("ogl"), ...M710_SRC.map((s) => toCanvas(s, 640, 440))]);
      const canvas = cv.current;
      const el = root.current;
      if (dead || !canvas || !el) return;
      try {
        const { Renderer, Camera, Transform, Plane, Program, Mesh, Texture } = ogl;
        const renderer = new Renderer({ canvas, dpr: 0.7, alpha: true, antialias: false });
        const gl = renderer.gl;
        gl.clearColor(0, 0, 0, 0);
        const camera = new Camera(gl, { fov: 35 });
        camera.position.z = 9;
        const world = new Transform();
        world.rotation.z = 0.07;
        const texs = imgs.map((img) => new Texture(gl, { image: img, generateMipmaps: false }));
        const geo = new Plane(gl, { width: 1.6, height: 1.1 });
        const cards = Array.from({ length: M710_N }, (_, i) => {
          const program = new Program(gl, {
            vertex: M710_V,
            fragment: M710_F,
            uniforms: { tMap: { value: texs[i % 4] }, uFocus: { value: 0 }, uAlpha: { value: 1 }, uInk: { value: [0.05, 0.07, 0.17] }, uPaper: { value: [0.62, 0.78, 1.0] } },
            transparent: true,
            cullFace: false,
          });
          const mesh = new Mesh(gl, { geometry: geo, program });
          mesh.setParent(world);
          return { mesh, program };
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
        const R = 2.6;
        const DA = (Math.PI * 2) / 7;
        const DY = 0.33;
        let shown = false;
        const stopLoop = visibleLoop(el, (t) => {
          for (let i = 0; i < M710_N; i++) {
            // each card rides the helix: it climbs and turns continuously, wrapping from top back to the bottom
            const s = mod(i + t * 0.55, M710_N);
            const a = s * DA;
            const y = (s - M710_N / 2) * DY;
            const { mesh, program } = cards[i];
            mesh.position.set(Math.sin(a) * R, y, Math.cos(a) * R);
            mesh.rotation.y = a;
            const face = Math.cos(a);
            const fy = 1 - clamp((Math.abs(y) - 0.5) / 1.1, 0, 1);
            const focus = clamp((face - 0.78) / 0.2, 0, 1) * fy;
            program.uniforms.uFocus.value = focus * focus * (3 - 2 * focus);
            program.uniforms.uAlpha.value = clamp(s / 1.2, 0, 1) * clamp((M710_N - s) / 1.2, 0, 1);
          }
          renderer.render({ scene: world, camera });
          if (!shown) {
            shown = true;
            canvas.style.opacity = "1";
            if (fb.current) fb.current.style.visibility = "hidden";
          }
        });
        stop = () => {
          stopLoop();
          ro.disconnect();
          gl.getExtension("WEBGL_lose_context")?.loseContext();
        };
        if (dead) stop();
      } catch (err) {
        console.warn("[M710] WebGL off, showing the fallback:", (err as Error).message);
      }
    })();
    return () => {
      dead = true;
      stop?.();
    };
  }, [near]);
  return (
    <Stage r={root} bg="#060812" g1="rgba(110,150,255,.55)" g2="rgba(255,140,190,.2)">
      <div className="absolute left-[6%] top-[10%] z-20" style={{ fontFamily: GROTESK }}>
        <p className="text-[13px] uppercase tracking-[0.24em] text-[#9fc0ff]/70">Autumn · Winter capsule</p>
        <h3 className="mt-2 max-w-[8ch] text-[clamp(32px,3.6vw,56px)] font-semibold leading-[0.95] tracking-[-0.03em]">Fourteen looks, one spiral.</h3>
      </div>
      <p className="absolute bottom-[10%] right-[6%] z-20 text-right text-[14px] text-white/70" style={{ fontFamily: GROTESK }}>
        Wool overcoat <span className="text-white/45">· ₹14,900</span>
      </p>
      <div ref={fb} className="absolute inset-0 flex items-center justify-center gap-[2%]">
        {[1, 0, 2].map((i, k) => (
          <div key={i} className="aspect-[16/11] w-[22%] overflow-hidden rounded-[14px]" style={{ opacity: k === 1 ? 1 : 0.45, transform: `scale(${k === 1 ? 1.1 : 0.85})` }}>
            <Img src={M710_SRC[i]} />
          </div>
        ))}
      </div>
      <canvas ref={cv} className="absolute inset-0 h-full w-full" style={{ opacity: 0 }} />
      <Sheen g1="rgba(110,150,255,.5)" />
    </Stage>
  );
}

/* ---------- M711 · Live ordered-dither image ---------- */
const M711_F = /* glsl */ `
uniform vec2 uMouse;
uniform float uLive;
${BAYER_GLSL}
void main(){
  vec2 fc = gl_FragCoord.xy;
  // the dot scale breathes slowly, so the whole pattern re-shuffles live
  float cell = mix(2.6, 4.6, 0.5 + 0.5 * sin(uTime * 0.55));
  vec2 g = floor(fc / cell);
  vec2 uvc = (g + 0.5) * cell / uRes;
  vec3 c = texture2D(uTex0, cover(uvc, uTexRes0)).rgb;
  float l = dot(c, vec3(0.3, 0.59, 0.11));
  // the pointer lifts the threshold in a soft lens and draws a ring
  float d = distance(fc, uMouse * uRes) / uRes.y;
  float lens = exp(-d * d / 0.03) * uLive;
  float bias = 0.07 * sin(uTime * 0.9 + uvc.x * 5.0 + uvc.y * 3.0) + lens * 0.34;
  float on = step(bay8(g), l * 1.3 + bias - 0.1);
  vec3 col = mix(vec3(0.07, 0.05, 0.13), vec3(1.0, 0.56, 0.33), on);
  col += vec3(1.0, 0.85, 0.7) * smoothstep(0.012, 0.0, abs(d - 0.17)) * 0.4 * uLive;
  gl_FragColor = vec4(col, 1.0);
}`;
function M711() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const fb = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const ptr = useRef({ x: 0.5, y: 0.5, live: 0 });
  const real = useRef({ x: 0, y: 0, at: -1e9 });
  const near = useNear(root);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const mv = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      real.current = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, at: performance.now() };
    };
    el.addEventListener("pointermove", mv);
    return () => el.removeEventListener("pointermove", mv);
  }, []);
  useTicker(root, (t, dt) => {
    const R = real.current;
    const useReal = performance.now() - R.at < 2500;
    // fake pointer: a slow figure-eight across the image
    const tx = useReal ? R.x : 0.5 + 0.3 * Math.sin(t * 0.9);
    const ty = useReal ? R.y : 0.52 + 0.2 * Math.sin(t * 1.8);
    const p = ptr.current;
    const k = 1 - Math.exp(-dt * 10);
    p.x += (tx - p.x) * k;
    p.y += (ty - p.y) * k;
    p.live += (1 - p.live) * (1 - Math.exp(-dt * 3));
    const d = dot.current;
    const el = root.current;
    if (d && el) {
      d.style.transform = `translate3d(${(p.x * el.clientWidth).toFixed(1)}px,${(p.y * el.clientHeight).toFixed(1)}px,0)`;
      d.style.opacity = useReal ? "0" : "1";
    }
  });
  useEffect(() => {
    if (!near) return;
    let dead = false;
    let h: GLHandle | null = null;
    (async () => {
      const tex = await toCanvas(scene(1, 1600, 1000), 1600, 1000);
      if (dead || !cv.current) return;
      h = await createShader(cv.current, M711_F, {
        dpr: 0.7,
        textures: [tex],
        uniforms: { uMouse: { value: [0.5, 0.5] }, uLive: { value: 0 } },
        onFrame: (u) => {
          const p = ptr.current;
          u.uMouse.value = [p.x, 1 - p.y];
          u.uLive.value = p.live;
          if (fb.current && fb.current.style.visibility !== "hidden") fb.current.style.visibility = "hidden";
        },
      });
      if (dead) h?.destroy();
    })();
    return () => {
      dead = true;
      h?.destroy();
    };
  }, [near]);
  return (
    <Stage r={root} bg="#0b0814" g1="rgba(255,140,90,.55)" g2="rgba(140,110,255,.22)">
      <div className="absolute inset-[5%] overflow-hidden rounded-[18px]">
        <div ref={fb} className="absolute inset-0">
          <Img src={scene(1, 1600, 1000)} style={{ filter: "grayscale(1) contrast(1.4) sepia(.6) hue-rotate(-20deg)" }} />
        </div>
        <canvas ref={cv} className="absolute inset-0 h-full w-full transition-opacity duration-300" style={{ opacity: 0 }} />
      </div>
      <div className="pointer-events-none absolute bottom-[10%] left-[9%] z-20" style={{ fontFamily: EDITORIAL }}>
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/80" style={{ fontFamily: GROTESK }}>
          Print edition · ₹1,200
        </p>
        <h3 className="mt-1 text-[clamp(36px,4.4vw,68px)] leading-none text-white">Solstice, in two inks.</h3>
      </div>
      <Sheen g1="rgba(255,140,90,.5)" />
      <Dot r={dot} />
    </Stage>
  );
}

/* ---------- M712 · Image as ASCII art ---------- */
const M712_SETS = [
  { name: "dense", ramp: " .:-=+*#%@" },
  { name: "blocks", ramp: " ░▒▓█" },
  { name: "braille", ramp: "⠀⠁⠃⠇⠏⠟⠿⡿⣿" },
  { name: "dots", ramp: " ·∙•●" },
];
/** Samples `src` into a cols×rows grid every frame with a slow drift (cheap: a tiny canvas + getImageData). */
function asciiSampler(src: HTMLCanvasElement, cols: number, rows: number) {
  const c = document.createElement("canvas");
  c.width = cols;
  c.height = rows;
  const x = c.getContext("2d", { willReadFrequently: true })!;
  return (t: number, drift = true) => {
    const s = drift ? 1.08 + 0.06 * Math.sin(t * 0.35) : 1;
    const ox = drift ? Math.sin(t * 0.22) * cols * 0.03 : 0;
    x.setTransform(s, 0, 0, s, cols * (1 - s) * 0.5 + ox, rows * (1 - s) * 0.5);
    x.drawImage(src, 0, 0, cols, rows);
    return x.getImageData(0, 0, cols, rows).data;
  };
}
function M712() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const fb = useRef<HTMLDivElement>(null);
  const tag = useRef<HTMLSpanElement>(null);
  const near = useNear(root);
  useEffect(() => {
    if (!near) return;
    let dead = false;
    let stop: (() => void) | null = null;
    (async () => {
      const src = await toCanvas(scene(3, 1600, 1000), 1600, 1000);
      const canvas = cv.current;
      const el = root.current;
      if (dead || !canvas || !el) return;
      const ctx = canvas.getContext("2d")!;
      const COLS = 112;
      let rows = 30;
      let cw = 12;
      let chh = 20;
      let sample = asciiSampler(src, COLS, rows);
      const resize = () => {
        canvas.width = Math.max(1, canvas.clientWidth);
        canvas.height = Math.max(1, canvas.clientHeight);
        cw = canvas.width / COLS;
        chh = cw * 1.7;
        rows = Math.max(8, Math.floor(canvas.height / chh));
        sample = asciiSampler(src, COLS, rows);
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(canvas);
      const rnd = rng(9);
      let acc = 1;
      let lastSet = -1;
      const PER = 1.5;
      const stopLoop = visibleLoop(el, (t, dt) => {
        acc += dt;
        if (acc < 1 / 30) return;
        acc = 0;
        const d = sample(t);
        // charset cycle: dense → blocks → braille → dots, the new set sweeps in from the left
        const n = Math.floor(t / PER);
        const ph = (t % PER) / 0.45;
        const cur = M712_SETS[n % 4];
        const prev = M712_SETS[(n + 3) % 4];
        if (n !== lastSet && tag.current) {
          tag.current.textContent = cur.name;
          lastSet = n;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = `600 ${Math.round(chh * 0.86)}px ${MONO}`;
        ctx.textBaseline = "top";
        ctx.textAlign = "center";
        const sweep = Math.min(1.05, ph) * COLS;
        for (let r = 0; r < rows; r++)
          for (let c = 0; c < COLS; c++) {
            const k = (r * COLS + c) * 4;
            const R = d[k];
            const G = d[k + 1];
            const B = d[k + 2];
            const lum = (R * 0.3 + G * 0.59 + B * 0.11) / 255;
            const ramp = c < sweep ? cur.ramp : prev.ramp;
            let idx = Math.min(ramp.length - 1, Math.floor(lum * 1.15 * ramp.length));
            if (rnd() < 0.035) idx = clamp(idx + (rnd() < 0.5 ? -1 : 1), 0, ramp.length - 1); // subtle flicker
            const ch = ramp[idx];
            if (ch === " " || ch === "⠀") continue;
            ctx.fillStyle = `rgb(${Math.min(255, R * 1.3 + 30)},${Math.min(255, G * 1.3 + 30)},${Math.min(255, B * 1.3 + 30)})`;
            ctx.fillText(ch, (c + 0.5) * cw, r * chh);
          }
        if (canvas.style.opacity !== "1") {
          canvas.style.opacity = "1";
          if (fb.current) fb.current.style.visibility = "hidden";
        }
      });
      stop = () => {
        stopLoop();
        ro.disconnect();
      };
      if (dead) stop();
    })();
    return () => {
      dead = true;
      stop?.();
    };
  }, [near]);
  return (
    <Stage r={root} bg="#07060a" g1="rgba(255,175,90,.5)" g2="rgba(110,140,255,.2)">
      <div className="absolute inset-[4%] overflow-hidden rounded-[16px] bg-[#09080c]">
        <div ref={fb} className="absolute inset-0 opacity-60">
          <Img src={scene(3, 1600, 1000)} />
        </div>
        <canvas ref={cv} className="absolute inset-0 h-full w-full" style={{ opacity: 0 }} />
      </div>
      <div className="pointer-events-none absolute left-[7%] top-[8%] z-20 rounded-full border border-white/20 bg-black/55 px-4 py-2 text-[13px] uppercase tracking-[0.2em] text-white/85" style={{ fontFamily: MONO }}>
        charset · <span ref={tag}>dense</span>
      </div>
      <div className="pointer-events-none absolute bottom-[9%] right-[7%] z-20 text-right" style={{ fontFamily: GROTESK }}>
        <h3 className="text-[clamp(30px,3.4vw,52px)] font-semibold leading-none tracking-[-0.03em]">Printed in type.</h3>
        <p className="mt-2 text-[14px] text-white/70">Trail runner 02 · ₹9,499</p>
      </div>
      <Sheen g1="rgba(255,175,90,.5)" />
    </Stage>
  );
}

/* ---------- M713 · ASCII rain locks into image (variant of M712) ---------- */
const M713_RAIN = "01<>/\\|=+*#$%&ABCDEFXYZ7Q";
const M713_RAMP = " .:-=+*#%@";
function M713() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const fb = useRef<HTMLDivElement>(null);
  const near = useNear(root);
  useEffect(() => {
    if (!near) return;
    let dead = false;
    let stop: (() => void) | null = null;
    (async () => {
      const src = await toCanvas(scene(2, 1600, 1000), 1600, 1000);
      const canvas = cv.current;
      const el = root.current;
      if (dead || !canvas || !el) return;
      const ctx = canvas.getContext("2d")!;
      const COLS = 104;
      const rnd = rng(21);
      let rows = 30;
      let cw = 12;
      let chh = 20;
      let img = new Uint8ClampedArray(0);
      let lockAt = new Float32Array(0);
      let unlockAt = new Float32Array(0);
      let glyph = new Uint8Array(0);
      const speed = Float32Array.from({ length: COLS }, () => 16 + rnd() * 14);
      const phase = Float32Array.from({ length: COLS }, () => rnd() * 40);
      const colDelay = Float32Array.from({ length: COLS }, () => rnd());
      const setup = () => {
        canvas.width = Math.max(1, canvas.clientWidth);
        canvas.height = Math.max(1, canvas.clientHeight);
        cw = canvas.width / COLS;
        chh = cw * 1.7;
        rows = Math.max(8, Math.floor(canvas.height / chh));
        img = asciiSampler(src, COLS, rows)(0, false);
        lockAt = new Float32Array(COLS * rows);
        unlockAt = new Float32Array(COLS * rows);
        glyph = new Uint8Array(COLS * rows);
        for (let r = 0; r < rows; r++)
          for (let c = 0; c < COLS; c++) {
            const i = r * COLS + c;
            // each column locks top-down, columns staggered; then they let go again in a scattered order
            lockAt[i] = 0.35 + colDelay[c] * 1.3 + (r / rows) * 1.45 + rnd() * 0.12;
            unlockAt[i] = 3.5 + rnd() * 0.75;
            glyph[i] = Math.floor(rnd() * M713_RAIN.length);
          }
      };
      setup();
      const ro = new ResizeObserver(setup);
      ro.observe(canvas);
      const CYCLE = 4.4;
      const TRAIL = 14;
      let acc = 1;
      const stopLoop = visibleLoop(el, (t, dt) => {
        acc += dt;
        if (acc < 1 / 30) return;
        acc = 0;
        const ct = t % CYCLE;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = `600 ${Math.round(chh * 0.86)}px ${MONO}`;
        ctx.textBaseline = "top";
        ctx.textAlign = "center";
        for (let c = 0; c < COLS; c++) {
          const head = mod(phase[c] + t * speed[c], rows + TRAIL * 2) - TRAIL;
          for (let r = 0; r < rows; r++) {
            const i = r * COLS + c;
            const x = (c + 0.5) * cw;
            const y = r * chh;
            if (ct >= lockAt[i] && ct < unlockAt[i]) {
              // locked: the ASCII image character in its source colour (a white flash at the moment it locks)
              const k = i * 4;
              const lum = (img[k] * 0.3 + img[k + 1] * 0.59 + img[k + 2] * 0.11) / 255;
              const ch = M713_RAMP[Math.min(9, Math.floor(lum * 1.15 * 10))];
              if (ch === " ") continue;
              const fl = ct - lockAt[i] < 0.12;
              ctx.fillStyle = fl ? "#f2fff8" : `rgb(${Math.min(255, img[k] * 1.3 + 30)},${Math.min(255, img[k + 1] * 1.3 + 30)},${Math.min(255, img[k + 2] * 1.3 + 30)})`;
              ctx.fillText(ch, x, y);
              continue;
            }
            const dist = head - r;
            if (dist < 0 || dist > TRAIL) continue;
            if (rnd() < 0.06) glyph[i] = Math.floor(rnd() * M713_RAIN.length);
            const a = 1 - dist / TRAIL;
            ctx.fillStyle = dist < 1 ? "#eafff4" : `rgba(90,255,170,${(a * 0.85).toFixed(2)})`;
            ctx.fillText(M713_RAIN[glyph[i]], x, y);
          }
        }
        if (canvas.style.opacity !== "1") {
          canvas.style.opacity = "1";
          if (fb.current) fb.current.style.visibility = "hidden";
        }
      });
      stop = () => {
        stopLoop();
        ro.disconnect();
      };
      if (dead) stop();
    })();
    return () => {
      dead = true;
      stop?.();
    };
  }, [near]);
  return (
    <Stage r={root} bg="#040806" g1="rgba(70,230,150,.5)" g2="rgba(90,130,255,.2)">
      <div className="absolute inset-[4%] overflow-hidden rounded-[16px] bg-[#050907]">
        <div ref={fb} className="absolute inset-0 opacity-60">
          <Img src={scene(2, 1600, 1000)} />
        </div>
        <canvas ref={cv} className="absolute inset-0 h-full w-full" style={{ opacity: 0 }} />
      </div>
      <div className="pointer-events-none absolute left-[7%] top-[8%] z-20" style={{ fontFamily: GROTESK }}>
        <p className="text-[13px] uppercase tracking-[0.24em] text-[#7dffbf]/80" style={{ fontFamily: MONO }}>
          decoding drop 07…
        </p>
        <h3 className="mt-2 text-[clamp(30px,3.4vw,52px)] font-semibold leading-none tracking-[-0.03em]">Out of the noise.</h3>
      </div>
      <Sheen g1="rgba(70,230,150,.5)" />
    </Stage>
  );
}

/* ---------- M714 · Particle swirl slide change (variant of X8) ---------- */
const M714_V = /* glsl */ `
attribute vec2 aA;
attribute vec2 aB;
attribute vec3 aR;
uniform float uP, uTime, uSize;
uniform vec2 uRes;
varying vec2 vA, vB;
varying float vK, vMid;
void main(){
  float k = clamp(uP * 1.4 - aR.x * 0.4, 0.0, 1.0);
  k = k * k * (3.0 - 2.0 * k);
  float mid = sin(k * 3.14159);
  vec2 p = mix(aA, aB, k);
  float asp = uRes.x / uRes.y;
  vec2 c = p - 0.5; c.x *= asp;
  // swirl around the centre, strongest mid-change, with a little per-particle scatter
  float ang = mid * (2.2 + aR.y * 2.2) * (1.25 - length(c) * 0.7);
  c = mat2(cos(ang), sin(ang), -sin(ang), cos(ang)) * c;
  c *= 1.0 + mid * (aR.z - 0.35) * 0.55;
  c += mid * 0.035 * vec2(sin(uTime * 2.0 + aR.y * 20.0), cos(uTime * 1.7 + aR.z * 20.0));
  c += (1.0 - mid) * 0.0016 * vec2(sin(uTime * 1.3 + aR.x * 30.0), cos(uTime * 1.1 + aR.y * 30.0));
  c.x /= asp;
  vec2 q = c + 0.5;
  gl_Position = vec4(q.x * 2.0 - 1.0, 1.0 - q.y * 2.0, 0.0, 1.0);
  gl_PointSize = uSize * (1.0 + mid * aR.x * 1.4);
  vA = aA; vB = aB; vK = k; vMid = mid;
}`;
const M714_F = /* glsl */ `
precision highp float;
uniform sampler2D tA, tB;
uniform vec2 uRes, uTexRes;
varying vec2 vA, vB;
varying float vK, vMid;
${COVER_GLSL}
void main(){
  float r = length(gl_PointCoord - 0.5);
  float m = mix(1.0, smoothstep(0.5, 0.3, r), clamp(vMid * 3.0, 0.0, 1.0));
  vec3 a = texture2D(tA, coverUv(vA, uRes, uTexRes)).rgb;
  vec3 b = texture2D(tB, coverUv(vB, uRes, uTexRes)).rgb;
  vec3 col = mix(a, b, vK) * (1.0 + vMid * 0.35);
  gl_FragColor = vec4(col, m);
}`;
function M714() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const fb = useRef<HTMLDivElement>(null);
  const capA = useRef<HTMLDivElement>(null);
  const capB = useRef<HTMLDivElement>(null);
  const near = useNear(root);
  useEffect(() => {
    if (!near) return;
    let dead = false;
    let stop: (() => void) | null = null;
    (async () => {
      const [ogl, ia, ib] = await Promise.all([import("ogl"), toCanvas(scene(0, 1200, 750), 1200, 750), toCanvas(scene(3, 1200, 750), 1200, 750)]);
      const canvas = cv.current;
      const el = root.current;
      if (dead || !canvas || !el) return;
      try {
        const { Renderer, Geometry, Program, Mesh, Texture } = ogl;
        const renderer = new Renderer({ canvas, dpr: 1, alpha: true, antialias: false });
        const gl = renderer.gl;
        gl.clearColor(0, 0, 0, 0);
        const r0 = el.getBoundingClientRect();
        const COLS = 210;
        const ROWS = Math.max(60, Math.round((COLS * r0.height) / Math.max(1, r0.width)));
        const n = COLS * ROWS;
        const A = new Float32Array(n * 2);
        const B = new Float32Array(n * 2);
        const RR = new Float32Array(n * 3);
        const rnd = rng(14);
        const order = Array.from({ length: n }, (_, i) => i);
        for (let i = n - 1; i > 0; i--) {
          const j = Math.floor(rnd() * (i + 1));
          [order[i], order[j]] = [order[j], order[i]];
        }
        for (let i = 0; i < n; i++) {
          const cx = i % COLS;
          const cy = Math.floor(i / COLS);
          A[i * 2] = (cx + 0.5) / COLS;
          A[i * 2 + 1] = (cy + 0.5) / ROWS;
          const o = order[i];
          B[i * 2] = ((o % COLS) + 0.5) / COLS;
          B[i * 2 + 1] = (Math.floor(o / COLS) + 0.5) / ROWS;
          RR[i * 3] = rnd();
          RR[i * 3 + 1] = rnd();
          RR[i * 3 + 2] = rnd();
        }
        const geometry = new Geometry(gl, { aA: { size: 2, data: A }, aB: { size: 2, data: B }, aR: { size: 3, data: RR } });
        const uniforms = {
          tA: { value: new Texture(gl, { image: ia, generateMipmaps: false }) },
          tB: { value: new Texture(gl, { image: ib, generateMipmaps: false }) },
          uRes: { value: [1, 1] },
          uTexRes: { value: [1200, 750] },
          uP: { value: 0 },
          uTime: { value: 0 },
          uSize: { value: 6 },
        };
        const program = new Program(gl, { vertex: M714_V, fragment: M714_F, uniforms, transparent: true, depthTest: false });
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
        // loop: A swirls into B (1.7 s) · rest .2 s · B swirls back into A (1.7 s) · rest .2 s
        const CH = 1.7;
        const REST = 0.2;
        const CYC = (CH + REST) * 2;
        let shown = false;
        const stopLoop = visibleLoop(el, (t) => {
          const c = t % CYC;
          const p = c < CH ? c / CH : c < CH + REST ? 1 : c < CH * 2 + REST ? 1 - (c - CH - REST) / CH : 0;
          uniforms.uP.value = p;
          uniforms.uTime.value = t;
          if (capA.current) capA.current.style.opacity = String(clamp(1 - Math.abs(p - 0) * 4, 0, 1));
          if (capB.current) capB.current.style.opacity = String(clamp(1 - Math.abs(p - 1) * 4, 0, 1));
          renderer.render({ scene: mesh });
          if (!shown) {
            shown = true;
            canvas.style.opacity = "1";
            if (fb.current) fb.current.style.visibility = "hidden";
          }
        });
        stop = () => {
          stopLoop();
          ro.disconnect();
          gl.getExtension("WEBGL_lose_context")?.loseContext();
        };
        if (dead) stop();
      } catch (err) {
        console.warn("[M714] WebGL off, showing the fallback:", (err as Error).message);
      }
    })();
    return () => {
      dead = true;
      stop?.();
    };
  }, [near]);
  return (
    <Stage r={root} bg="#05060c" g1="rgba(120,150,255,.55)" g2="rgba(255,170,100,.22)">
      <div ref={fb} className="absolute inset-0">
        <Img src={scene(0, 1200, 750)} />
      </div>
      <canvas ref={cv} className="absolute inset-0 h-full w-full" style={{ opacity: 0 }} />
      <div className="pointer-events-none absolute bottom-[10%] left-[6%] z-20" style={{ fontFamily: SERIF }}>
        <div className="relative">
          <div ref={capA}>
            <p className="text-[13px] uppercase tracking-[0.24em] text-white/70" style={{ fontFamily: GROTESK }}>
              Collection 01
            </p>
            <h3 className="mt-1 text-[clamp(34px,4vw,62px)] font-light leading-none">Halcyone · ₹3,450</h3>
          </div>
          <div ref={capB} className="absolute left-0 top-0" style={{ opacity: 0 }}>
            <p className="text-[13px] uppercase tracking-[0.24em] text-white/70" style={{ fontFamily: GROTESK }}>
              Collection 02
            </p>
            <h3 className="mt-1 whitespace-nowrap text-[clamp(34px,4vw,62px)] font-light leading-none">Daybreak · ₹3,650</h3>
          </div>
        </div>
      </div>
      <Sheen g1="rgba(120,150,255,.5)" />
    </Stage>
  );
}

/* ---------- M715 · Shattered glass image change ---------- */
const M715_BG_V = /* glsl */ `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vSt;
void main(){ vSt = vec2(uv.x, 1.0 - uv.y); gl_Position = vec4(position, 0.0, 1.0); }`;
const M715_BG_F = /* glsl */ `
precision highp float;
uniform sampler2D tMap;
uniform vec2 uRes, uTexRes;
varying vec2 vSt;
${COVER_GLSL}
void main(){ gl_FragColor = vec4(texture2D(tMap, coverUv(vSt, uRes, uTexRes)).rgb, 1.0); }`;
const M715_V = /* glsl */ `
attribute vec2 position;
attribute vec2 aC;
attribute vec3 aR;
uniform float uP, uAsp, uMaxR;
uniform vec2 uImp;
varying vec2 vSt;
varying float vShade, vT;
vec3 rotA(vec3 v, vec3 ax, float a){ return v * cos(a) + cross(ax, v) * sin(a) + ax * dot(ax, v) * (1.0 - cos(a)); }
void main(){
  vec2 asp = vec2(uAsp, 1.0);
  vec2 rel = (aC - uImp) * asp;
  float dist = length(rel);
  float crack = smoothstep(0.0, 0.1, uP);
  // shards near the impact go first; each falls, spins and tips toward the viewer
  float t = clamp((uP - 0.1 - min(dist / uMaxR, 1.05) * 0.25 - aR.x * 0.08) / 0.55, 0.0, 1.0);
  vec3 v = vec3((position - aC) * asp * (1.0 - 0.04 * crack), 0.0);
  vec3 ax = normalize(aR - 0.5 + vec3(0.0, 0.0, 0.001));
  float ang = t * t * (2.5 + aR.y * 5.0);
  v = rotA(v, ax, ang);
  vec3 w = vec3((aC - 0.5) * asp, 0.0) + v;
  w.xy += normalize(rel + 1e-4) * t * (0.12 + aR.z * 0.22);
  w.y += t * t * 1.3;
  w.z += t * (0.3 + aR.z * 0.7);
  float persp = 1.0 / max(0.2, 1.0 - w.z * 0.4);
  vec2 s = w.xy * persp;
  gl_Position = vec4(s.x / uAsp * 2.0, -s.y * 2.0, 0.0, 1.0);
  vSt = position;
  vShade = rotA(vec3(0.0, 0.0, 1.0), ax, ang).z;
  vT = t;
}`;
const M715_F = /* glsl */ `
precision highp float;
uniform sampler2D tMap;
uniform vec2 uRes, uTexRes;
varying vec2 vSt;
varying float vShade, vT;
${COVER_GLSL}
void main(){
  vec3 c = texture2D(tMap, coverUv(vSt, uRes, uTexRes)).rgb;
  float sh = abs(vShade);
  c *= 0.55 + 0.45 * sh;
  c += vec3(0.85, 0.92, 1.0) * pow(1.0 - sh, 3.0) * 0.5 * step(0.001, vT);
  gl_FragColor = vec4(c, 1.0 - smoothstep(0.7, 1.0, vT));
}`;
/** Radial crack pattern around an impact point → non-indexed triangles (position, centroid, random). */
function m715Shards(ix: number, iy: number, asp: number, seed: number) {
  const r = rng(seed);
  const RAYS = 16;
  // rings reach just past the farthest corner (aspect-corrected), so the shards cover the frame and no more
  const maxR = Math.max(...[[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y]) => Math.hypot((x - ix) * asp, y - iy)));
  const RINGS = [0, 0.04, 0.1, 0.18, 0.28, 0.4, 0.55, 0.75, 1.06].map((v) => v * maxR);
  const ang = Array.from({ length: RAYS }, (_, j) => ((j + (r() - 0.5) * 0.6) / RAYS) * Math.PI * 2);
  const vtx = RINGS.map((rad, k) =>
    ang.map((a) => {
      const rr = k === 0 ? 0 : rad * (0.85 + r() * 0.3);
      return [ix + (Math.cos(a) * rr) / asp, iy + Math.sin(a) * rr] as const;
    }),
  );
  const pos: number[] = [];
  const cen: number[] = [];
  const rnd: number[] = [];
  const tri = (a: readonly [number, number], b: readonly [number, number], c: readonly [number, number]) => {
    const cx = (a[0] + b[0] + c[0]) / 3;
    const cy = (a[1] + b[1] + c[1]) / 3;
    const q = [r(), r(), r()];
    for (const p of [a, b, c]) {
      pos.push(p[0], p[1]);
      cen.push(cx, cy);
      rnd.push(q[0], q[1], q[2]);
    }
  };
  for (let k = 1; k < RINGS.length; k++)
    for (let j = 0; j < RAYS; j++) {
      const j2 = (j + 1) % RAYS;
      if (k === 1) tri(vtx[0][j], vtx[1][j], vtx[1][j2]);
      else {
        tri(vtx[k - 1][j], vtx[k][j], vtx[k][j2]);
        tri(vtx[k - 1][j], vtx[k][j2], vtx[k - 1][j2]);
      }
    }
  return { pos: new Float32Array(pos), cen: new Float32Array(cen), rnd: new Float32Array(rnd), maxR };
}
const M715_SRC = [scene(1, 1200, 750), scene(2, 1200, 750), scene(0, 1200, 750)];
const M715_NAMES = ["Ruby · ₹2,150", "Jade · ₹2,150", "Cobalt · ₹2,350"];
function M715() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const fb = useRef<HTMLDivElement>(null);
  const cap = useRef<HTMLSpanElement>(null);
  const near = useNear(root);
  useEffect(() => {
    if (!near) return;
    let dead = false;
    let stop: (() => void) | null = null;
    (async () => {
      const [ogl, ...imgs] = await Promise.all([import("ogl"), ...M715_SRC.map((s) => toCanvas(s, 1200, 750))]);
      const canvas = cv.current;
      const el = root.current;
      if (dead || !canvas || !el) return;
      try {
        const { Renderer, Geometry, Program, Mesh, Texture, Triangle } = ogl;
        const renderer = new Renderer({ canvas, dpr: 1, alpha: true, antialias: true });
        const gl = renderer.gl;
        gl.clearColor(0, 0, 0, 0);
        const texs = imgs.map((img) => new Texture(gl, { image: img, generateMipmaps: false }));
        const bgU = { tMap: { value: texs[1] }, uRes: { value: [1, 1] }, uTexRes: { value: [1200, 750] } };
        const bg = new Mesh(gl, { geometry: new Triangle(gl), program: new Program(gl, { vertex: M715_BG_V, fragment: M715_BG_F, uniforms: bgU, depthTest: false }) });
        const shU = { tMap: { value: texs[0] }, uRes: { value: [1, 1] }, uTexRes: { value: [1200, 750] }, uP: { value: 0 }, uAsp: { value: 2 }, uMaxR: { value: 1 }, uImp: { value: [0.56, 0.46] } };
        const shProg = new Program(gl, { vertex: M715_V, fragment: M715_F, uniforms: shU, transparent: true, depthTest: false, cullFace: false });
        let cycle = 0;
        const build = () => {
          const ix = 0.36 + ((cycle * 0.37) % 0.3);
          const iy = 0.38 + ((cycle * 0.23) % 0.2);
          shU.uImp.value = [ix, iy];
          const s = m715Shards(ix, iy, shU.uAsp.value, 50 + cycle);
          shU.uMaxR.value = s.maxR;
          return new Geometry(gl, { position: { size: 2, data: s.pos }, aC: { size: 2, data: s.cen }, aR: { size: 3, data: s.rnd } });
        };
        const resize = () => {
          const r = el.getBoundingClientRect();
          renderer.setSize(Math.max(1, r.width), Math.max(1, r.height));
          canvas.style.width = "100%";
          canvas.style.height = "100%";
          bgU.uRes.value = [r.width, r.height];
          shU.uRes.value = [r.width, r.height];
          shU.uAsp.value = r.width / Math.max(1, r.height);
        };
        resize();
        const shards = new Mesh(gl, { geometry: build(), program: shProg });
        const ro = new ResizeObserver(resize);
        ro.observe(el);
        // loop: impact + crack + fall (1.75 s) · rest ≤ .2 s on the revealed image · the next image becomes the glass
        const RUN = 1.75;
        const CYC = 1.95;
        let start = -1;
        let shown = false;
        const stopLoop = visibleLoop(el, (t) => {
          if (start < 0) start = t;
          let c = t - start;
          if (c >= CYC) {
            cycle++;
            start = t;
            c = 0;
            shU.tMap.value = texs[cycle % 3];
            bgU.tMap.value = texs[(cycle + 1) % 3];
            const old = shards.geometry;
            shards.geometry = build();
            old.remove();
            if (cap.current) cap.current.textContent = M715_NAMES[(cycle + 1) % 3];
          }
          shU.uP.value = Math.min(1, c / RUN);
          renderer.render({ scene: bg });
          renderer.render({ scene: shards, clear: false });
          if (!shown) {
            shown = true;
            canvas.style.opacity = "1";
            if (fb.current) fb.current.style.visibility = "hidden";
          }
        });
        stop = () => {
          stopLoop();
          ro.disconnect();
          gl.getExtension("WEBGL_lose_context")?.loseContext();
        };
        if (dead) stop();
      } catch (err) {
        console.warn("[M715] WebGL off, showing the fallback:", (err as Error).message);
      }
    })();
    return () => {
      dead = true;
      stop?.();
    };
  }, [near]);
  return (
    <Stage r={root} bg="#06070b" g1="rgba(255,120,140,.55)" g2="rgba(120,200,255,.22)">
      <div ref={fb} className="absolute inset-0">
        <Img src={M715_SRC[0]} />
      </div>
      <canvas ref={cv} className="absolute inset-0 h-full w-full" style={{ opacity: 0 }} />
      <div className="pointer-events-none absolute bottom-[10%] left-[6%] z-20" style={{ fontFamily: GROTESK }}>
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/75">Glassware · next colour</p>
        <h3 className="mt-1 text-[clamp(34px,4vw,62px)] font-semibold leading-none tracking-[-0.03em]">
          <span ref={cap}>Jade · ₹2,150</span>
        </h3>
      </div>
      <Sheen g1="rgba(255,120,140,.5)" />
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M709", name: "Image sphere", how: "46 thumbnails on a Fibonacci sphere auto-rotate and fling with inertia under a (fake) drag; front images scale up, back ones fade.", kind: "play", C: M709 },
  { code: "M710", name: "Dither helix carousel", how: "Cards climb a spinning 3D helix; receding cards render through a two-tone ordered-dither shader, the front card is clean.", kind: "play", C: M710 },
  { code: "M711", name: "Live ordered-dither image", how: "An image drawn through a duotone Bayer dither shader; the dot scale breathes and a (fake) pointer lens shifts the pattern live.", kind: "play", C: M711 },
  { code: "M712", name: "Image as ASCII art", how: "An image redrawn on canvas as source-coloured ASCII; the charset cycles dense → blocks → braille → dots and characters flicker.", kind: "play", C: M712 },
  { code: "M713", name: "ASCII rain locks into image", how: "Columns of characters rain down matrix-style and lock cell by cell into the ASCII image, then let go and rain again.", kind: "play", C: M713 },
  { code: "M714", name: "Particle swirl slide change", how: "The slide breaks into ~20k WebGL points that swirl around the centre and reform as the next image, then back.", kind: "play", C: M714 },
  { code: "M715", name: "Shattered glass image change", how: "The image cracks from an impact point into triangular shards that spin and fall away, revealing the next image beneath.", kind: "play", C: M715 },
];
