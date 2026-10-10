"use client";

// Ambient motions, batch 13 · group 1 (MOTION-MENU M650–M661): topography layers, sonar rings, self-swapping grids,
// blend-mode layers, blob morphs, a camera drifting over a bento wall, ambilight, edge blur, emboss light and card borders.
// Small focused demos for /lab/motion. Every demo is "play": it starts when it is on screen, loops, and pauses off
// screen. Each stage has a CSS-only glow loop that never stops (a second one sits ON TOP of full-bleed canvases and
// tile walls). Pointer demos drive a visible fake pointer ring by themselves; the real mouse takes over while it moves.
// WebGL demos build only within ~1 screen of the viewport, run at dpr 1 and release their context on unmount.
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
.b13g1-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.5)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.22)),transparent 70%);animation:b13g1-drift 5.6s linear infinite alternate;will-change:transform}
@keyframes b13g1-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b13g1-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4);pointer-events:none;z-index:45;opacity:0;transition:opacity .25s}
.b13g1-dot.ink{border-color:rgba(20,17,15,.9);background:rgba(20,17,15,.12);box-shadow:0 0 0 6px rgba(20,17,15,.08)}
.b13g1-run{animation-play-state:paused !important}
.b13g1-on .b13g1-run{animation-play-state:running !important}

/* M650 topography */
.m650-spin{animation:m650-spin 60s linear infinite;transform-origin:760px 350px;transform-box:view-box}
@keyframes m650-spin{to{transform:rotate(360deg)}}

/* M652 swapping grid */
.m652-cell{position:relative;overflow:hidden;border-radius:18px;perspective:900px;background:#10131c}
.m652-cell img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;backface-visibility:hidden}

/* M656 bento drift */
.m656-tile{border-radius:22px;overflow:hidden;position:relative;border:1px solid rgba(255,255,255,.08)}

/* M657 ambilight */
.m657-kb{animation:m657-kb 6s ease-in-out infinite alternate}
@keyframes m657-kb{0%{transform:scale(1)}100%{transform:scale(1.1)}}

/* M659 emboss */
.m659-word{color:#2f2a25;text-shadow:calc(var(--hx,-2.4)*1px) calc(var(--hy,-2.4)*1px) 1px rgba(255,236,214,.42),calc(var(--hx,-2.4)*-1.5px) calc(var(--hy,-2.4)*-1.5px) 3px rgba(0,0,0,.72)}
.m659-badge{background:#2f2a25;box-shadow:calc(var(--hx,-2.4)*-3px) calc(var(--hy,-2.4)*-3px) 12px rgba(0,0,0,.6),calc(var(--hx,-2.4)*2px) calc(var(--hy,-2.4)*2px) 10px rgba(255,236,214,.14),inset calc(var(--hx,-2.4)*1px) calc(var(--hy,-2.4)*1px) 1px rgba(255,236,214,.22),inset calc(var(--hx,-2.4)*-1px) calc(var(--hy,-2.4)*-1px) 2px rgba(0,0,0,.5)}
.m659-deb{color:#2b2621;text-shadow:calc(var(--hx,-2.4)*-.5px) calc(var(--hy,-2.4)*-.5px) 0 rgba(255,236,214,.28),calc(var(--hx,-2.4)*.5px) calc(var(--hy,-2.4)*.5px) 1px rgba(0,0,0,.7)}
.m659-light{position:absolute;inset:0;pointer-events:none;background:radial-gradient(560px circle at var(--px,30%) var(--py,25%),rgba(255,222,184,.17),transparent 62%)}

/* M660 edge spotlight */
.m660-card{position:relative;border-radius:26px;padding:1.5px;background:radial-gradient(300px circle at var(--x,-600px) var(--y,-600px),rgba(160,185,255,1),rgba(120,140,255,.38) 36%,rgba(255,255,255,.08) 66%)}
.m660-in{height:100%;border-radius:24.5px;background:radial-gradient(440px circle at var(--x,-600px) var(--y,-600px),rgba(120,150,255,.13),transparent 60%),#0b0e18}

/* M661 shine border */
.m661-shine{position:relative}
.m661-shine::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:var(--bw,2px);background:radial-gradient(transparent,transparent,#ff6ad5,#8a7dff,#46e3ff,#ffd36a,transparent,transparent);background-size:300% 300%;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;animation:m661-shine var(--sd,7s) linear infinite;animation-play-state:paused;pointer-events:none}
.b13g1-on .m661-shine::before{animation-play-state:running}
@keyframes m661-shine{0%{background-position:0% 0%}50%{background-position:100% 100%}100%{background-position:0% 0%}}

html.is-static .b13g1-glow,html.is-static .b13g1-run,html.is-static .m650-spin,html.is-static .m657-kb,html.is-static .m661-shine::before{animation:none}
html.is-static {
  .b13g1-glow,.b13g1-run,.m650-spin,.m657-kb,.m661-shine::before{animation:none}
}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", g1, g2, style }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string; style?: CSSProperties }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0d16] text-[#eef2ff] ${className}`} style={style}>
      <style href="b13g1-css" precedence="default">
        {CSS}
      </style>
      <div className="b13g1-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/** The CSS glow loop again, ON TOP of full-bleed canvases / tile walls (screen blend), so those demos never freeze. */
const Sheen = ({ g1, opacity = 0.45 }: { g1?: string; opacity?: number }) => (
  <div className="b13g1-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity, zIndex: 35 } as CSSProperties} aria-hidden />
);

/** The visible fake pointer ring (`ink` = dark ring for light stages). */
const Dot = ({ r, ink = false }: { r: RefObject<HTMLDivElement | null>; ink?: boolean }) => <div ref={r} className={`b13g1-dot${ink ? " ink" : ""}`} aria-hidden />;

/** CSS-driven demos: toggles `b13g1-on` on the root while it is on screen (the paused keyframes run only then). */
function useOn(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const io = new IntersectionObserver(([e]) => el.classList.toggle("b13g1-on", e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => {
      io.disconnect();
      el.classList.remove("b13g1-on");
    };
  }, [ref]);
}

/** GSAP loops: `build` runs once inside a gsap.context; the returned animations play only while the stage is on screen. */
function useAnims(root: RefObject<HTMLDivElement | null>, build: (el: HTMLDivElement) => gsap.core.Animation[] | void) {
  const b = useRef(build);
  b.current = build;
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    let anims: gsap.core.Animation[] = [];
    const ctx = gsap.context(() => {
      anims = b.current(el) || [];
      anims.forEach((a) => a.pause());
    }, el);
    const io = new IntersectionObserver(([e]) => anims.forEach((a) => (e.isIntersecting ? a.resume() : a.pause())), { threshold: 0.05 });
    io.observe(el);
    return () => {
      io.disconnect();
      ctx.revert();
    };
  }, [root]);
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

const rnd = (x: number) => {
  const s = Math.sin(x * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
/** Colour along a 3-stop ramp, p 0..1. */
function ramp(stops: string[], p: number) {
  const seg = Math.min(stops.length - 2, Math.floor(p * (stops.length - 1)));
  const f = p * (stops.length - 1) - seg;
  const a = hex(stops[seg]);
  const b = hex(stops[seg + 1]);
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * f)).join(",")})`;
}

/* ---------- M650 · Topography layers pulse (variant of M649: filled gradient layers scale in/out instead of drifting lines) ---------- */
const L650 = 9;
const CX650 = 760;
const CY650 = 350;
const PAL650 = [
  ["#141033", "#6b3cff", "#ffb38a"],
  ["#06201f", "#1fa58c", "#e9ffb0"],
];
const PATHS650 = Array.from({ length: L650 }, (_, k) => {
  const r = 540 * (1 - k / 10);
  const pts: string[] = [];
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const rr = r * (1 + 0.09 * Math.sin(3 * a + k * 0.7) + 0.05 * Math.sin(5 * a - k * 1.1) + 0.03 * Math.sin(2 * a + k));
    pts.push(`${(CX650 + Math.cos(a) * rr * 1.15).toFixed(1)} ${(CY650 + Math.sin(a) * rr * 0.82).toFixed(1)}`);
  }
  return `M${pts.join("L")}Z`;
});
function M650() {
  const root = useRef<HTMLDivElement>(null);
  const cur = useRef<gsap.core.Timeline | null>(null);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const layers = Array.from(el.querySelectorAll<SVGPathElement>("[data-l]"));
    gsap.set(layers, { svgOrigin: `${CX650} ${CY650}` });
    let state = 0;
    let on = false;
    const cycle = () => {
      const s = state;
      const tl = gsap.timeline({
        paused: !on,
        onComplete: () => {
          state ^= 1;
          cycle();
        },
      });
      tl.set(layers, { attr: { fill: (i: number) => ramp(PAL650[s], i / (L650 - 1)) } }, 0);
      layers.forEach((l) => tl.fromTo(l, { scale: 0.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.2, ease: "power3.out" }, gsap.utils.random(0, 0.6)));
      layers.forEach((l) => tl.to(l, { scale: 0.2, opacity: 0, duration: 0.75, ease: "power2.in" }, 1.75 + gsap.utils.random(0, 0.45)));
      cur.current = tl;
    };
    cycle();
    const io = new IntersectionObserver(
      ([e]) => {
        on = e.isIntersecting;
        if (on) cur.current?.resume();
        else cur.current?.pause();
      },
      { threshold: 0.05 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cur.current?.kill();
      gsap.set(layers, { clearProps: "all" });
    };
  }, []);
  return (
    <Stage r={root} className="bg-[#07060f]" g1="rgba(150,110,255,.45)" g2="rgba(255,150,110,.25)">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <g className="m650-spin">
          {PATHS650.map((d, k) => (
            <path key={k} data-l d={d} fill={ramp(PAL650[0], k / (L650 - 1))} stroke="rgba(255,255,255,.14)" strokeWidth="1.5" />
          ))}
        </g>
      </svg>
      <Sheen g1="rgba(150,110,255,.5)" opacity={0.35} />
      <div className="pointer-events-none absolute bottom-10 left-10 z-40 max-w-[440px]">
        <p className="text-[13px] uppercase tracking-[0.3em] text-white/65">Ridgeline Outfitters · Trail maps</p>
        <h3 className="mt-3 text-[clamp(44px,5vw,80px)] font-[650] leading-[0.92] tracking-[-0.035em]" style={{ fontFamily: F.sg }}>
          Every ridge, mapped.
        </h3>
        <p className="mt-4 text-[15px] text-white/70">Printed relief set · ₹ 2,400</p>
      </div>
    </Stage>
  );
}

/* ---------- M651 · Concentric pulse rings (variant of M37: sonar rings travel outward with offset delays, shader) ---------- */
const F651 = /* glsl */ `
void main(){
  vec2 p = (vUv - 0.5) * uRes / min(uRes.x, uRes.y);
  float d = length(p);
  float a = 0.0;
  for (int i = 0; i < 7; i++) {
    float ph = fract(uTime * 0.26 + float(i) / 7.0);
    float r = 0.07 + ph * 0.66;
    float w = 0.003 + ph * 0.008;
    float fade = pow(1.0 - ph, 1.5) * smoothstep(0.0, 0.06, ph);
    float ring = smoothstep(w, 0.0, abs(d - r));
    float halo = smoothstep(0.07, 0.0, abs(d - r)) * 0.22;
    float fill = (1.0 - smoothstep(r - 0.12, r, d)) * step(0.0, r - d) * 0.035;
    a += (ring + halo + fill) * fade;
  }
  a = clamp(a, 0.0, 1.4);
  vec3 bg = vec3(0.018, 0.024, 0.05);
  vec3 c = mix(vec3(0.2, 0.5, 1.0), vec3(0.65, 0.95, 1.0), clamp(a, 0.0, 1.0));
  float core = exp(-d * 9.0) * 0.35;
  gl_FragColor = vec4(bg + c * a + vec3(0.25, 0.5, 1.0) * core, 1.0);
}`;
function M651() {
  const root = useRef<HTMLDivElement>(null);
  return (
    <Stage r={root} className="bg-[#05070d]" g1="rgba(80,150,255,.5)" g2="rgba(120,230,255,.2)">
      <Shader frag={F651} fallback="repeating-radial-gradient(circle at 50% 50%,rgba(90,160,255,.22) 0 2px,transparent 3px 74px),#05070d" />
      <Sheen g1="rgba(80,150,255,.5)" />
      <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center">
        <div className="grid h-[88px] w-[88px] place-items-center rounded-full border border-white/25 bg-[#0a1430] shadow-[0_0_40px_rgba(80,150,255,.55)]">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#cfe6ff" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
          </svg>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-10 z-40 text-center">
        <p className="text-[13px] uppercase tracking-[0.3em] text-white/65">Signal Room · Live</p>
        <h3 className="mt-2 text-[clamp(36px,3.6vw,58px)] font-[600] leading-none tracking-[-0.03em]" style={{ fontFamily: F.sg }}>
          Now broadcasting.
        </h3>
      </div>
    </Stage>
  );
}

/* ---------- M652 · Self-swapping image grid (variant of M34: cells keep changing pictures with random transitions) ---------- */
const POOL652 = Array.from({ length: 12 }, (_, i) => ({ src: scene(i % 4, 480, 480), hue: [0, 48, -62][Math.floor(i / 4)] }));
const N652 = 16;
function M652() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const cells = Array.from(el.querySelectorAll<HTMLElement>("[data-cell]"));
    const st = cells.map((_, i) => ({ front: 0, idx: i % 12, busy: false }));
    const live = new Set<gsap.core.Timeline>();
    let on = false;
    let dc: gsap.core.Tween | null = null;
    const clean = { opacity: 0, zIndex: 0, xPercent: 0, yPercent: 0, rotation: 0, rotationY: 0, scale: 1 };
    const swap = (ci: number) => {
      const s = st[ci];
      const imgs = cells[ci].querySelectorAll("img");
      const front = imgs[s.front];
      const back = imgs[1 - s.front];
      let k = s.idx;
      while (k === s.idx) k = Math.floor(Math.random() * 12);
      back.src = POOL652[k].src;
      back.style.filter = `hue-rotate(${POOL652[k].hue}deg)`;
      s.busy = true;
      gsap.set(front, { zIndex: 1 });
      gsap.set(back, { ...clean, zIndex: 2 });
      const tl = gsap.timeline({
        onComplete: () => {
          gsap.set(front, clean);
          s.front = 1 - s.front;
          s.idx = k;
          s.busy = false;
          live.delete(tl);
        },
      });
      const type = Math.floor(Math.random() * 4);
      if (type === 0) tl.to(back, { opacity: 1, duration: 0.8, ease: "sine.inOut" });
      else if (type === 1) {
        const p = Math.random() < 0.5 ? "xPercent" : "yPercent";
        const d = Math.random() < 0.5 ? 1 : -1;
        tl.fromTo(back, { [p]: 100 * d, opacity: 1 }, { [p]: 0, duration: 0.75, ease: "power2.inOut" }).to(front, { [p]: -100 * d, duration: 0.75, ease: "power2.inOut" }, 0);
      } else if (type === 2) tl.fromTo(back, { rotation: Math.random() < 0.5 ? -90 : 90, scale: 0.3, opacity: 0 }, { rotation: 0, scale: 1, opacity: 1, duration: 0.8, ease: "power2.out" });
      else tl.to(front, { rotationY: 90, duration: 0.35, ease: "power2.in" }).fromTo(back, { rotationY: -90, opacity: 1 }, { rotationY: 0, duration: 0.4, ease: "power2.out" });
      live.add(tl);
    };
    const tick = () => {
      if (!on) return;
      const idle = st.map((s, i) => (s.busy ? -1 : i)).filter((i) => i >= 0);
      if (idle.length) swap(idle[Math.floor(Math.random() * idle.length)]);
      dc = gsap.delayedCall(gsap.utils.random(0.22, 0.5), tick);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        on = e.isIntersecting;
        live.forEach((t) => (on ? t.resume() : t.pause()));
        dc?.kill();
        dc = null;
        if (on) tick();
      },
      { threshold: 0.05 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      dc?.kill();
      live.forEach((t) => t.kill());
    };
  }, []);
  return (
    <Stage r={root} className="bg-[#080a10]" g1="rgba(110,160,255,.45)" g2="rgba(255,140,110,.22)">
      <div className="absolute inset-0 grid grid-cols-6 grid-rows-3 gap-[10px] p-[18px]">
        <div className="col-[3/span_2] row-[2] flex flex-col items-center justify-center rounded-[18px] border border-white/10 bg-[#0d1020]/90 text-center">
          <p className="text-[12px] uppercase tracking-[0.3em] text-white/60">Lookbook · Drop 07</p>
          <h3 className="mt-2 text-[clamp(30px,2.8vw,46px)] font-[600] leading-[0.95] tracking-[-0.03em]" style={{ fontFamily: F.fr }}>
            New every hour.
          </h3>
          <p className="mt-2 text-[13px] text-white/65">Pieces from ₹ 1,890</p>
        </div>
        {Array.from({ length: N652 }, (_, i) => (
          <div key={i} data-cell className="m652-cell">
            <img src={POOL652[i % 12].src} alt="" draggable={false} style={{ filter: `hue-rotate(${POOL652[i % 12].hue}deg)`, zIndex: 1 }} />
            <img src={POOL652[i % 12].src} alt="" draggable={false} style={{ opacity: 0 }} />
          </div>
        ))}
      </div>
      <Sheen g1="rgba(110,160,255,.5)" opacity={0.4} />
    </Stage>
  );
}

/* ---------- M653 · Blend-mode colour layers (variant of M10: colour slabs slide with the pointer and blend with content) ---------- */
function M653() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const l1 = useRef<HTMLDivElement>(null);
  const l2 = useRef<HTMLDivElement>(null);
  const l3 = useRef<HTMLDivElement>(null);
  const s = useRef({ x: -1, y: -1 });
  usePointer(
    root,
    dot,
    (t, w, h) => [w * (0.5 + 0.4 * Math.sin(t * 0.8)), h * (0.5 + 0.34 * Math.sin(t * 1.3 + 1))],
    (x, y, dt) => {
      const el = root.current;
      if (!el || !l1.current || !l2.current || !l3.current) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      const p = s.current;
      if (p.x < 0) {
        p.x = x;
        p.y = y;
      }
      const k = Math.min(1, dt * 4.5);
      p.x += (x - p.x) * k;
      p.y += (y - p.y) * k;
      l1.current.style.transform = `translate3d(${p.x - 210}px,${p.y - 210}px,0)`;
      l2.current.style.transform = `translate3d(${w * 0.5 - l2.current.offsetWidth / 2 - (p.x - w / 2) * 0.7}px,0,0)`;
      l3.current.style.transform = `translate3d(0,${h * 0.5 - 80 - (p.y - h / 2) * 0.8}px,0) rotate(-10deg)`;
    },
  );
  return (
    <Stage r={root} className="bg-[#efe8dc] text-[#14110f]" g1="rgba(255,140,90,.5)" g2="rgba(90,120,255,.25)">
      <div className="absolute inset-0 isolate">
        <div className="absolute inset-0 flex items-center justify-between gap-10 px-[6%]">
          <div>
            <p className="text-[13px] uppercase tracking-[0.3em] text-[#14110f]/70">Hueform Paints · Spring palette</p>
            <h3 className="mt-4 text-[clamp(60px,7vw,116px)] font-[700] leading-[0.88] tracking-[-0.04em]" style={{ fontFamily: F.fr }}>
              Colour
              <br />
              bleeds through.
            </h3>
            <p className="mt-5 text-[15px] text-[#14110f]/75">24 shades · from ₹ 1,450 per litre</p>
          </div>
          <img src={scene(1, 800, 1000)} alt="" className="h-[74%] w-[min(30%,380px)] rounded-[22px] object-cover" draggable={false} />
        </div>
        <div ref={l1} className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] rounded-full bg-[#ff5a36] mix-blend-difference" style={{ transform: "translate3d(180px,60px,0)" }} aria-hidden />
        <div ref={l2} className="pointer-events-none absolute -top-[20%] left-0 h-[140%] w-[30%] bg-[#2f4dff] mix-blend-multiply" style={{ transform: "translate3d(700px,0,0)" }} aria-hidden />
        <div ref={l3} className="pointer-events-none absolute -left-[15%] top-0 h-[160px] w-[130%] bg-[#ffd400] mix-blend-difference" style={{ transform: "translate3d(0,260px,0) rotate(-10deg)" }} aria-hidden />
      </div>
      <Dot r={dot} ink />
    </Stage>
  );
}

/* ---------- M654 · Organic blob loop morph (variant of M53: blobs morph forever on their own, one follows the pointer) ---------- */
function blob654(cx: number, cy: number, r: number, seed: number, n = 7) {
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + (rnd(seed * 3.1 + i) - 0.5) * 0.4;
    const rr = r * (0.76 + 0.46 * rnd(seed * 13.7 + i * 1.9));
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
  });
  const f = (v: number) => v.toFixed(1);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return `${d}Z`;
}
const A654 = [1, 2, 3, 4].map((s) => blob654(330, 300, 230, s));
const B654 = [5, 6, 7, 8].map((s) => blob654(900, 430, 190, s));
const C654 = [9, 10, 11, 12].map((s) => blob654(110, 110, 78, s));
function M654() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const fol = useRef<HTMLDivElement>(null);
  const id = useId().replace(/:/g, "");
  const p = useRef({ x: -1, y: -1 });
  useAnims(root, (el) => {
    const morph = (path: Element | null, shapes: string[], dur: number) => {
      const tl = gsap.timeline({ repeat: -1 });
      [1, 2, 3, 0].forEach((i) => tl.to(path, { attr: { d: shapes[i] }, duration: dur, ease: "sine.inOut" }));
      return tl;
    };
    return [
      morph(el.querySelector("[data-a]"), A654, 2.3),
      morph(el.querySelector("[data-b]"), B654, 2.0),
      morph(el.querySelector("[data-c]"), C654, 1.4),
      gsap.to(el.querySelector("[data-ra]"), { rotation: 360, svgOrigin: "330 300", duration: 34, ease: "none", repeat: -1 }),
      gsap.to(el.querySelector("[data-rb]"), { rotation: -360, svgOrigin: "900 430", duration: 42, ease: "none", repeat: -1 }),
      gsap.to(el.querySelector("[data-da]"), { x: 40, y: -26, duration: 3.1, ease: "sine.inOut", repeat: -1, yoyo: true }),
      gsap.to(el.querySelector("[data-db]"), { x: -36, y: 30, duration: 3.6, ease: "sine.inOut", repeat: -1, yoyo: true }),
    ];
  });
  usePointer(
    root,
    dot,
    (t, w, h) => [w * (0.5 + 0.36 * Math.sin(t * 0.7)), h * (0.5 + 0.3 * Math.sin(t * 1.4 + 0.6))],
    (x, y, dt) => {
      const s = p.current;
      if (s.x < 0) {
        s.x = x;
        s.y = y;
      }
      const k = Math.min(1, dt * 3.2);
      s.x += (x - s.x) * k;
      s.y += (y - s.y) * k;
      if (fol.current) fol.current.style.transform = `translate3d(${s.x - 110}px,${s.y - 110}px,0)`;
    },
  );
  return (
    <Stage r={root} className="bg-[#0b0a12]" g1="rgba(255,130,150,.45)" g2="rgba(90,200,255,.22)">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <linearGradient id={`a${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ff8a7a" />
            <stop offset="1" stopColor="#7a4dff" />
          </linearGradient>
          <linearGradient id={`b${id}`} x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#46e3c8" />
            <stop offset="1" stopColor="#2c5bff" />
          </linearGradient>
        </defs>
        <g data-da>
          <g data-ra>
            <path data-a d={A654[0]} fill={`url(#a${id})`} opacity=".9" />
          </g>
        </g>
        <g data-db>
          <g data-rb>
            <path data-b d={B654[0]} fill={`url(#b${id})`} opacity=".85" />
          </g>
        </g>
      </svg>
      <div ref={fol} className="pointer-events-none absolute left-0 top-0 z-30 h-[220px] w-[220px] mix-blend-screen" style={{ transform: "translate3d(560px,180px,0)" }} aria-hidden>
        <svg viewBox="0 0 220 220" className="h-full w-full">
          <path data-c d={C654[0]} fill="#ffc65a" opacity=".85" />
        </svg>
      </div>
      <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center text-center">
        <div>
          <p className="text-[13px] uppercase tracking-[0.3em] text-white/70">Moulded Home · Clay series</p>
          <h3 className="mt-4 text-[clamp(52px,6vw,96px)] font-[600] leading-[0.92] tracking-[-0.03em]" style={{ fontFamily: F.fr }}>
            Soft forms,
            <br />
            slow hours.
          </h3>
          <p className="mt-5 text-[15px] text-white/75">Lounge chair · ₹ 42,000</p>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ---------- M655 · Shape morphs with the mouse (variant of M53: pointer x / y each drive one outline morph, shader) ---------- */
const F655 = /* glsl */ `
uniform vec2 uM;
void main(){
  vec2 p = (vUv - 0.5) * uRes / min(uRes.x, uRes.y);
  float d = length(p);
  float a = atan(p.y, p.x);
  float t = uTime;
  float r = 0.29 + 0.012 * sin(t * 1.3)
    + uM.x * 0.075 * sin(3.0 * a + t * 0.35)
    + uM.y * 0.06 * cos(5.0 * a - t * 0.3)
    + 0.022 * sin(2.0 * a + t * 0.8);
  float sdf = d - r;
  float inside = smoothstep(0.004, -0.004, sdf);
  vec2 n = p / max(d, 1e-4);
  float lit = dot(n, normalize(vec2(-0.6, 0.7))) * 0.5 + 0.5;
  vec3 c1 = vec3(1.0, 0.45, 0.32);
  vec3 c2 = vec3(0.42, 0.3, 1.0);
  vec3 body = mix(c2, c1, clamp(vUv.y * 0.6 + lit * 0.45 + uM.x * 0.15, 0.0, 1.0));
  float rim = smoothstep(-0.07, 0.0, sdf);
  body *= 0.6 + 0.35 * (1.0 - d / max(r, 0.01)) + rim * 0.55;
  float glow = exp(-max(sdf, 0.0) * 8.0) * 0.4;
  vec3 bg = vec3(0.02, 0.022, 0.045);
  vec3 col = bg + mix(c2, c1, 0.5) * glow * (1.0 - inside);
  gl_FragColor = vec4(mix(col, body, inside), 1.0);
}`;
function M655() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const tgt = useRef<[number, number]>([0, 0]);
  const cur = useRef({ x: 0, y: 0, last: -1 });
  usePointer(
    root,
    dot,
    (t, w, h) => [w * (0.5 + 0.42 * Math.sin(t * 0.6)), h * (0.5 + 0.38 * Math.sin(t * 0.95 + 0.8))],
    (x, y) => {
      const el = root.current;
      if (!el) return;
      tgt.current = [(x / el.clientWidth) * 2 - 1, 1 - (y / el.clientHeight) * 2];
    },
  );
  const onFrame = (u: U, t: number) => {
    const c = cur.current;
    const dt = c.last < 0 ? 0.016 : Math.min(0.05, t - c.last);
    c.last = t;
    const k = Math.min(1, dt * 3);
    c.x += (tgt.current[0] * 1.6 - c.x) * k;
    c.y += (tgt.current[1] * 1.6 - c.y) * k;
    (u.uM as { value: number[] }).value = [c.x, c.y];
  };
  return (
    <Stage r={root} className="bg-[#05060b]" g1="rgba(255,120,110,.5)" g2="rgba(120,90,255,.25)">
      <Shader frag={F655} uniforms={() => ({ uM: { value: [0, 0] } })} onFrame={onFrame} fallback="radial-gradient(28% 40% at 50% 50%,#ff7352 0%,#6b4dff 70%,transparent 72%),#05060b" />
      <Sheen g1="rgba(255,120,110,.5)" />
      <div className="pointer-events-none absolute bottom-10 left-10 z-40 max-w-[420px]">
        <p className="text-[13px] uppercase tracking-[0.3em] text-white/65">Formwork Studio · Identity</p>
        <h3 className="mt-3 text-[clamp(40px,4.4vw,72px)] font-[700] leading-[0.92] tracking-[-0.03em]" style={{ fontFamily: F.sy }}>
          Form follows you.
        </h3>
      </div>
      <div className="pointer-events-none absolute right-10 top-10 z-40 text-right text-[13px] uppercase tracking-[0.22em] text-white/60">
        <p>X · three lobes</p>
        <p className="mt-1">Y · five petals</p>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ---------- M656 · Bento camera drift (variant of M32: the whole oversized grid glides diagonally under a vignette) ---------- */
const W656 = 1400;
const H656 = 880;
function Block656({ b }: { b: number }) {
  const bx = b % 3;
  const by = Math.floor(b / 3);
  const img = (k: number) => scene((b + k) % 4, 900, 900);
  return (
    <div className="absolute grid grid-cols-4 grid-rows-3 gap-4 p-2" style={{ left: bx * W656, top: by * H656, width: W656, height: H656 }}>
      <div className="m656-tile col-[1/span_2] row-[1/span_2]">
        <img src={img(0)} alt="" className="h-full w-full object-cover" draggable={false} />
        <p className="absolute bottom-5 left-6 text-[22px] font-[600]" style={{ fontFamily: F.sg }}>Trail Shell 2.0</p>
      </div>
      <div className="m656-tile col-[3] row-[1] flex flex-col justify-between bg-[#141a2a] p-6">
        <p className="text-[13px] uppercase tracking-[0.25em] text-white/60">Field Jacket</p>
        <p className="text-[34px] font-[600]" style={{ fontFamily: F.sg }}>₹ 8,900</p>
      </div>
      <div className="m656-tile col-[4] row-[1] flex flex-col justify-between bg-[#e8e2d6] p-6 text-[#14110f]">
        <p className="text-[44px] font-[700] leading-none" style={{ fontFamily: F.fr }}>4.9★</p>
        <p className="text-[13px] text-[#14110f]/70">2,140 reviews</p>
      </div>
      <div className="m656-tile col-[3] row-[2/span_2]">
        <img src={img(1)} alt="" className="h-full w-full object-cover" draggable={false} />
      </div>
      <div className="m656-tile col-[4] row-[2] flex items-end bg-[#1d1428] p-6">
        <p className="text-[26px] italic leading-[1.05]" style={{ fontFamily: F.is }}>“Built to be worn in.”</p>
      </div>
      <div className="m656-tile col-[4] row-[3] flex flex-col justify-end p-6" style={{ background: "linear-gradient(135deg,#ff7a59,#7a4dff)" }}>
        <p className="text-[13px] uppercase tracking-[0.25em] text-white/80">New drop</p>
        <p className="text-[30px] font-[700]" style={{ fontFamily: F.sy }}>Friday</p>
      </div>
      <div className="m656-tile col-[1/span_2] row-[3]">
        <img src={img(2)} alt="" className="h-full w-full object-cover" draggable={false} />
        <p className="absolute left-6 top-5 text-[13px] uppercase tracking-[0.25em] text-white/80">Camp kit · from ₹ 3,200</p>
      </div>
    </div>
  );
}
function M656() {
  const root = useRef<HTMLDivElement>(null);
  useAnims(root, (el) => [gsap.to(el.querySelector("[data-wall]"), { x: -W656, y: -H656, duration: 26, ease: "none", repeat: -1 })]);
  return (
    <Stage r={root} className="bg-[#07080d]" g1="rgba(120,140,255,.45)" g2="rgba(255,130,100,.22)">
      <div className="absolute inset-0" style={{ transform: "rotate(-8deg) scale(1.08)" }}>
        <div data-wall className="absolute" style={{ left: -260, top: -240, width: W656 * 3, height: H656 * 3 }}>
          {Array.from({ length: 9 }, (_, b) => (
            <Block656 key={b} b={b} />
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 z-30" style={{ background: "radial-gradient(70% 70% at 50% 50%,transparent 30%,rgba(5,6,10,.92) 100%)" }} aria-hidden />
      <Sheen g1="rgba(120,140,255,.5)" opacity={0.4} />
      <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center">
        <div className="rounded-full border border-white/20 bg-[#07080d]/75 px-7 py-3 text-[15px] tracking-[0.04em]" style={{ fontFamily: F.sg }}>
          The whole range, at a glance
        </div>
      </div>
    </Stage>
  );
}

/* ---------- M657 · Ambilight glow (variant of M37: the glow behind the frame is sampled live from what plays inside it) ---------- */
const S657 = ["SEASON 04", "NIGHT RUN", "FIELD NOTES", "GOLDEN HOUR"].map((l, i) => scene(i, 960, 540, l));
function M657() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const srcs = useRef<HTMLCanvasElement[]>([]);
  useOn(root);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    let dead = false;
    const stop = whenNear(el, async () => {
      const cs = await Promise.all(S657.map((s) => toCanvas(s, 64, 36)));
      if (!dead) srcs.current = cs;
    });
    return () => {
      dead = true;
      stop();
      srcs.current = [];
    };
  }, []);
  useAnims(root, (el) => {
    const imgs = Array.from(el.querySelectorAll<HTMLElement>("[data-slide]"));
    const tl = gsap.timeline({ repeat: -1 });
    imgs.forEach((im, i) => {
      const at = i * 2 + 0.9;
      tl.to(imgs[(i + 1) % imgs.length], { opacity: 1, duration: 1.1, ease: "sine.inOut" }, at).to(im, { opacity: 0, duration: 1.1, ease: "sine.inOut" }, at);
    });
    return [tl];
  });
  useTicker(root, () => {
    const c = cv.current;
    const el = root.current;
    if (!c || !el || !srcs.current.length) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 64, 36);
    el.querySelectorAll<HTMLElement>("[data-slide]").forEach((im, i) => {
      const o = Number(gsap.getProperty(im, "opacity"));
      if (o > 0.01 && srcs.current[i]) {
        ctx.globalAlpha = o;
        ctx.drawImage(srcs.current[i], 0, 0, 64, 36);
      }
    });
    ctx.globalAlpha = 1;
  });
  return (
    <Stage r={root} className="bg-[#05060a]" g1="rgba(90,140,255,.38)" g2="rgba(255,120,90,.2)">
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative aspect-video w-[min(54%,720px)]">
          <div className="absolute -inset-[16%] rounded-[60px]" style={{ background: "radial-gradient(50% 50% at 50% 50%,rgba(47,140,255,.45),transparent 75%)" }} aria-hidden />
          <canvas ref={cv} width={64} height={36} className="absolute -inset-[16%] h-[132%] w-[132%] opacity-90" style={{ filter: "blur(44px) saturate(1.6)" }} aria-hidden />
          <div className="absolute inset-0 overflow-hidden rounded-[22px] border border-white/15 shadow-[0_30px_80px_rgba(0,0,0,.55)]">
            {S657.map((s, i) => (
              <img key={i} data-slide src={s} alt="" className="m657-kb b13g1-run absolute inset-0 h-full w-full object-cover" style={{ opacity: i === 0 ? 1 : 0 }} draggable={false} />
            ))}
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-8 left-10 z-40">
        <p className="text-[13px] uppercase tracking-[0.3em] text-white/60">Lumen Screens · Glow edition</p>
        <p className="mt-2 text-[clamp(28px,2.6vw,42px)] font-[600] tracking-[-0.02em]" style={{ fontFamily: F.sg }}>
          The room plays along.
        </p>
      </div>
    </Stage>
  );
}

/* ---------- M658 · Progressive edge blur (variant of M19: stacked masked backdrop blurs soften content under header/footer) ---------- */
const BL658 = [2, 5, 9];
const ROWS658 = [
  ["Linen overshirt", "Sand · M", "₹ 3,490"],
  ["Pleated trousers", "Charcoal · 32", "₹ 4,200"],
  ["Merino crew", "Oat · L", "₹ 5,100"],
  ["Canvas tote", "Natural", "₹ 1,290"],
  ["Suede loafers", "Tobacco · 42", "₹ 8,750"],
  ["Rib beanie", "Moss", "₹ 990"],
  ["Waxed jacket", "Olive · M", "₹ 11,400"],
];
function EdgeBlur658({ side }: { side: "top" | "bottom" }) {
  const n = BL658.length;
  const step = 100 / (n + 1);
  const dir = side === "top" ? "to top" : "to bottom";
  return (
    <div className="pointer-events-none absolute inset-x-0 z-20 h-[30%]" style={{ [side]: 0 }} aria-hidden>
      {BL658.map((b, i) => {
        const m =
          i === n - 1
            ? `linear-gradient(${dir},transparent ${i * step}%,#000 ${(i + 1) * step}%)`
            : `linear-gradient(${dir},transparent ${i * step}%,#000 ${(i + 1) * step}%,#000 ${(i + 2) * step}%,transparent ${Math.min(100, (i + 3) * step)}%)`;
        return <div key={i} className="absolute inset-0" style={{ backdropFilter: `blur(${b}px)`, WebkitBackdropFilter: `blur(${b}px)`, maskImage: m, WebkitMaskImage: m }} />;
      })}
      <div className="absolute inset-0" style={{ background: `linear-gradient(${side === "top" ? "to bottom" : "to top"},rgba(8,9,14,.55),transparent)` }} />
    </div>
  );
}
function M658() {
  const root = useRef<HTMLDivElement>(null);
  useAnims(root, (el) => {
    const list = el.querySelector<HTMLElement>("[data-list]");
    const one = el.querySelector<HTMLElement>("[data-copy]");
    if (!list || !one) return;
    return [gsap.fromTo(list, { y: 0 }, { y: -one.offsetHeight, duration: 14, ease: "none", repeat: -1 })];
  });
  const copy = (c: number) => (
    <div data-copy={c === 0 ? "" : undefined} aria-hidden={c === 1}>
      {ROWS658.map(([n, m, p], i) => (
        <div key={i} className="mb-[14px] flex items-center gap-5 rounded-[20px] border border-white/10 bg-[#121520]/90 p-3 pr-6">
          <img src={scene(i % 4, 300, 300)} alt="" className="h-[84px] w-[84px] rounded-[14px] object-cover" draggable={false} />
          <div className="flex-1">
            <p className="text-[20px] font-[600]" style={{ fontFamily: F.mr }}>{n}</p>
            <p className="text-[13px] text-white/60">{m}</p>
          </div>
          <p className="text-[18px] font-[600]" style={{ fontFamily: F.sg }}>{p}</p>
        </div>
      ))}
    </div>
  );
  return (
    <Stage r={root} className="bg-[#08090e]" g1="rgba(120,150,255,.45)" g2="rgba(255,150,110,.25)">
      <div className="absolute inset-y-0 left-1/2 w-[min(620px,50%)] -translate-x-1/2 overflow-hidden">
        <div data-list className="pt-6">
          {copy(0)}
          {copy(1)}
        </div>
      </div>
      <EdgeBlur658 side="top" />
      <EdgeBlur658 side="bottom" />
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-10 py-6">
        <p className="text-[22px] font-[700] tracking-[-0.02em]" style={{ fontFamily: F.sy }}>Atelier Nine</p>
        <div className="flex gap-7 text-[14px] text-white/75">
          <span>Shop</span>
          <span>Journal</span>
          <span>Bag (2)</span>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 z-30 flex justify-center pb-6">
        <p className="rounded-full border border-white/15 bg-white/5 px-6 py-2 text-[13px] text-white/80">Free shipping over ₹ 2,999</p>
      </div>
    </Stage>
  );
}

/* ---------- M659 · Moving emboss light (variant of M49: a moving light shifts the bevel highlights instead of sweeping a band) ---------- */
function M659() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  usePointer(
    root,
    dot,
    (t, w, h) => [w * (0.5 + 0.42 * Math.cos(t * 0.9)), h * (0.5 + 0.4 * Math.sin(t * 0.9))],
    (x, y) => {
      const el = root.current;
      if (!el) return;
      const dx = x - el.clientWidth / 2;
      const dy = y - el.clientHeight / 2;
      const len = Math.max(1, Math.hypot(dx, dy));
      const s = 1.2 + Math.min(1, len / 400) * 1.8;
      el.style.setProperty("--hx", ((dx / len) * s).toFixed(2));
      el.style.setProperty("--hy", ((dy / len) * s).toFixed(2));
      el.style.setProperty("--px", `${x.toFixed(0)}px`);
      el.style.setProperty("--py", `${y.toFixed(0)}px`);
    },
  );
  return (
    <Stage r={root} className="bg-[#2b2622] text-[#f2e9dd]" g1="rgba(255,190,140,.5)" g2="rgba(140,120,255,.18)">
      <div className="m659-light" aria-hidden />
      <div className="absolute inset-0 flex items-center justify-center gap-[5vw]">
        <div className="m659-badge grid h-[190px] w-[190px] shrink-0 place-items-center rounded-full">
          <div className="text-center">
            <p className="m659-deb text-[13px] uppercase tracking-[0.3em]">Since</p>
            <p className="m659-deb mt-1 text-[46px] font-[700] leading-none" style={{ fontFamily: F.fr }}>1987</p>
          </div>
        </div>
        <div>
          <p className="m659-word text-[clamp(110px,13vw,200px)] font-[800] uppercase leading-[0.86] tracking-[-0.02em]" style={{ fontFamily: F.sy }}>
            Relief
          </p>
          <p className="mt-5 text-[15px] text-[#f2e9dd]/75">Quarry & Co · hand-finished stone tiles · ₹ 18,500 / m²</p>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ---------- M660 · Card edge spotlight (variant of M64: each card's border glows nearest the pointer, no spark loop) ---------- */
const CARDS660 = [
  ["Starter", "₹ 0", "For side projects", ["1 site", "Basic analytics", "Community help"]],
  ["Studio", "₹ 1,499", "For small teams", ["10 sites", "Live preview", "Priority help"]],
  ["Agency", "₹ 4,999", "For client work", ["Unlimited sites", "White label", "Account lead"]],
] as const;
function M660() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  usePointer(
    root,
    dot,
    (t, w, h) => [w * (0.5 + 0.46 * Math.sin(t * 0.75)), h * (0.5 + 0.42 * Math.sin(t * 1.5))],
    (x, y) => {
      const el = root.current;
      if (!el) return;
      const rr = el.getBoundingClientRect();
      el.querySelectorAll<HTMLElement>(".m660-card").forEach((c) => {
        const cr = c.getBoundingClientRect();
        c.style.setProperty("--x", `${(x - (cr.left - rr.left)).toFixed(0)}px`);
        c.style.setProperty("--y", `${(y - (cr.top - rr.top)).toFixed(0)}px`);
      });
    },
  );
  return (
    <Stage r={root} className="bg-[#06080f]" g1="rgba(110,140,255,.5)" g2="rgba(200,120,255,.2)">
      <div className="absolute inset-0 flex items-center justify-center gap-6 px-[6%]">
        {CARDS660.map(([n, p, s, f], i) => (
          <div key={n} className="m660-card h-[66%] w-[min(30%,360px)]" style={i === 1 ? ({ "--x": "180px", "--y": "-40px" } as CSSProperties) : undefined}>
            <div className="m660-in flex flex-col p-8">
              <p className="text-[13px] uppercase tracking-[0.3em] text-white/60">{n}</p>
              <p className="mt-4 text-[clamp(38px,3.4vw,54px)] font-[650] leading-none tracking-[-0.03em]" style={{ fontFamily: F.sg }}>
                {p}
                <span className="ml-1 text-[15px] font-[400] text-white/55">/ mo</span>
              </p>
              <p className="mt-2 text-[14px] text-white/65">{s}</p>
              <div className="mt-6 space-y-2 text-[15px] text-white/80">
                {f.map((x) => (
                  <p key={x}>— {x}</p>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ---------- M661 · Shine border (variant of M64: the whole border shimmers with a drifting multicolour gradient) ---------- */
function M661() {
  const root = useRef<HTMLDivElement>(null);
  useOn(root);
  return (
    <Stage r={root} className="bg-[#07070d]" g1="rgba(170,110,255,.45)" g2="rgba(70,220,255,.22)">
      <div className="absolute inset-0 grid place-items-center">
        <div className="m661-shine w-[min(460px,40%)] rounded-[28px] bg-[#0e0e18] p-10 text-center" style={{ "--bw": "2px" } as CSSProperties}>
          <p className="text-[13px] uppercase tracking-[0.3em] text-white/60">Prism Pass · Annual</p>
          <h3 className="mt-4 text-[clamp(44px,4.4vw,70px)] font-[650] leading-none tracking-[-0.03em]" style={{ fontFamily: F.sg }}>
            ₹ 9,999
          </h3>
          <p className="mt-3 text-[15px] text-white/70">Every course, every update, one year.</p>
          <div className="m661-shine mx-auto mt-8 w-fit rounded-full bg-white/5 px-7 py-3 text-[15px] font-[600]" style={{ "--bw": "1.5px", "--sd": "4.5s" } as CSSProperties}>
            Join the cohort
          </div>
        </div>
      </div>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M650", name: "Topography layers pulse", how: "Nested contour layers scale in from the centre with random delays like a topographic ripple, then scale out and return in a new palette", kind: "play", C: M650 },
  { code: "M651", name: "Concentric pulse rings", how: "Sonar rings pulse outward from behind an icon with offset delays, fading as they grow (shader)", kind: "play", C: M651 },
  { code: "M652", name: "Self-swapping image grid", how: "Random grid cells keep swapping to new images, each with a random fade, slide, rotate or flip", kind: "play", C: M652 },
  { code: "M653", name: "Blend-mode colour layers", how: "Big colour slabs slide with the pointer and blend (difference / multiply) with the type and image (scripted pointer)", kind: "play", C: M653 },
  { code: "M654", name: "Organic blob loop morph", how: "Blobs morph between shapes, drift and turn forever; a small one follows the pointer (scripted pointer)", kind: "play", C: M654 },
  { code: "M655", name: "Shape morphs with the mouse", how: "One big shape changes outline with the pointer: x grows three lobes, y five petals; idle it breathes (shader)", kind: "play", C: M655 },
  { code: "M656", name: "Bento camera drift", how: "A camera glides diagonally over an oversized bento wall of products and prices behind a vignette", kind: "play", C: M656 },
  { code: "M657", name: "Ambilight glow", how: "The glow behind the frame is sampled live from its slideshow, so it changes colour with the picture (canvas)", kind: "play", C: M657 },
  { code: "M658", name: "Progressive edge blur", how: "A product list scrolls by itself; stacked masked backdrop blurs ramp it soft under the header and footer", kind: "play", C: M658 },
  { code: "M659", name: "Moving emboss light", how: "A light circles the embossed word and badge, so the bevel highlights and shadows turn with it (scripted pointer)", kind: "play", C: M659 },
  { code: "M660", name: "Card edge spotlight", how: "Each card's border glows brightest at the edge nearest the pointer (scripted pointer)", kind: "play", C: M660 },
  { code: "M661", name: "Shine border", how: "A multicolour gradient drifts round the card and button borders in a loop, so the whole border shimmers", kind: "play", C: M661 },
];
