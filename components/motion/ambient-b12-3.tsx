"use client";

// Ambient motions, batch 12 · group 3 (MOTION-MENU M614–M625). Small focused demos for /lab/motion.
// Every demo is "play": it starts when it is on screen, loops, and pauses off screen. Each stage has a CSS-only glow loop
// that never stops (a second one sits ON TOP of full-bleed canvases). Canvas 2D demos (M615, M616, M620, M622, M624,
// M625) size the canvas to the frame at dpr 1 and are built only near the viewport; WebGL demos (M617, M621, M623) use
// OGL at dpr 1, one context each, created only within ~1 screen. Pointer demos drive a visible fake ring by themselves;
// the real mouse takes over while it moves. ?static=1 / reduced motion: no ticking, CSS loops stop, canvases paint one
// still frame and WebGL stays off (the markup underneath is the final state).
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { scene, useTicker } from "@/components/fx/shared";
import type { MotionDef } from "./types";
import type { OGLRenderingContext, Renderer } from "ogl";

const F = {
  sg: "'Space Grotesk Variable', system-ui, sans-serif",
  fr: "'Fraunces Variable', Georgia, serif",
  is: "'Instrument Serif', Georgia, serif",
  sy: "'Syne Variable', 'Space Grotesk Variable', system-ui, sans-serif",
  mr: "'Manrope Variable', system-ui, sans-serif",
};

const CSS = `
.b12g3-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.5)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.22)),transparent 70%);animation:b12g3-drift 5.6s linear infinite alternate;will-change:transform}
@keyframes b12g3-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b12g3-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4);pointer-events:none;z-index:40;opacity:0;transition:opacity .25s}

/* M614 framing lines */
.m614-l{position:absolute;background:rgba(238,242,255,.38);pointer-events:none}
.m614-l.v{top:0;bottom:0;width:1px}
.m614-l.h{left:0;right:0;height:1px}

/* M616 sparkle field under a heading */
.m616-field{position:absolute;left:12%;right:12%;top:47%;bottom:0;-webkit-mask-image:radial-gradient(50% 78% at 50% 0%,#000 30%,transparent 100%);mask-image:radial-gradient(50% 78% at 50% 0%,#000 30%,transparent 100%)}

/* M618 twinkling sky */
.m618-s{animation:m618-tw var(--d) ease-in-out infinite alternate;animation-delay:var(--dl);animation-play-state:paused}
.m618-on .m618-s{animation-play-state:running}
@keyframes m618-tw{0%{opacity:.12}100%{opacity:1}}

/* M619 meteors (CSS keyframes, head + fading tail, top-right to bottom-left) */
.m619-m{position:absolute;left:var(--x);top:var(--y);width:3px;height:3px;border-radius:50%;background:#fff;box-shadow:0 0 0 1px rgba(255,255,255,.1),0 0 10px 2px rgba(200,215,255,.7);transform:rotate(140deg) translate3d(var(--p0,220px),0,0);opacity:.9;animation:m619-fall var(--d) linear infinite;animation-delay:var(--dl);animation-play-state:paused;pointer-events:none}
.m619-m::before{content:"";position:absolute;right:1px;top:50%;width:var(--len);height:1px;margin-top:-.5px;background:linear-gradient(90deg,transparent,rgba(214,225,255,.95))}
.m619-on .m619-m{animation-play-state:running}
@keyframes m619-fall{0%{transform:rotate(140deg) translate3d(0,0,0);opacity:0}6%{opacity:1}72%{opacity:1}100%{transform:rotate(140deg) translate3d(900px,0,0);opacity:0}}

html.is-static .b12g3-glow,html.is-static .m618-s,html.is-static .m619-m{animation:none}
html.is-static {
  .b12g3-glow,.m618-s,.m619-m{animation:none}
}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", g1, g2, style }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string; style?: CSSProperties }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0d16] text-[#eef2ff] ${className}`} style={style}>
      <style href="b12g3-css" precedence="default">
        {CSS}
      </style>
      <div className="b12g3-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/** The CSS glow loop again, ON TOP of a full-bleed canvas (screen blend), so canvas demos never freeze. */
const Sheen = ({ g1, opacity = 0.45 }: { g1?: string; opacity?: number }) => (
  <div className="b12g3-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity, zIndex: 35 } as CSSProperties} aria-hidden />
);

/** The visible fake pointer ring. */
const Dot = ({ r }: { r: RefObject<HTMLDivElement | null> }) => <div ref={r} className="b12g3-dot" aria-hidden />;

/** Kicker / headline / meta overlay. */
function Copy({ kicker, title, meta, font = F.sg, className = "", size = "clamp(44px,5vw,84px)", weight = 600 }: { kicker: string; title: ReactNode; meta?: string; font?: string; className?: string; size?: string; weight?: number }) {
  return (
    <div className={`pointer-events-none absolute z-40 ${className}`}>
      <p className="text-[13px] uppercase tracking-[0.28em] text-white/70">{kicker}</p>
      <h3 className="mt-3 leading-[0.92] tracking-[-0.03em]" style={{ fontFamily: font, fontSize: size, fontWeight: weight }}>
        {title}
      </h3>
      {meta && <p className="mt-4 text-[15px] text-white/80">{meta}</p>}
    </div>
  );
}

/** Toggles `cls` on the root while it is on screen (CSS keyframes run only then). */
function useOnClass(ref: RefObject<HTMLElement | null>, cls: string) {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const io = new IntersectionObserver(([e]) => el.classList.toggle(cls, e.isIntersecting), { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, cls]);
}

/** Runs `fn` once the element is within ~1 screen of the viewport (no canvases / GL contexts at page load). */
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
 * Pointer for "pointer" demos: every frame (on screen) it reports a position in root px. The real mouse wins for 2 s after
 * it last moved; otherwise `script(t, w, h)` drives the visible fake ring along a set path.
 */
function usePointer(root: RefObject<HTMLDivElement | null>, dot: RefObject<HTMLDivElement | null>, script: (t: number, w: number, h: number) => [number, number], frame: (x: number, y: number) => void) {
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
  useTicker(root, (t) => {
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
    fr.current(x, y);
  });
}

type Painter = { resize?: (w: number, h: number) => void; draw: (t: number, dt: number, w: number, h: number) => void };

/**
 * Canvas 2D at dpr 1, sized to its box. `make` runs once the stage is near the viewport; `draw` runs every frame while the
 * stage is on screen. Reduced motion / ?static=1: one still frame, no ticking.
 */
function useCanvas(root: RefObject<HTMLDivElement | null>, cv: RefObject<HTMLCanvasElement | null>, make: (ctx: CanvasRenderingContext2D) => Painter) {
  const mk = useRef(make);
  mk.current = make;
  useEffect(() => {
    const el = root.current;
    const c = cv.current;
    if (!el || !c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const still = prefersReducedMotion();
    let p: Painter | null = null;
    let w = 1;
    let h = 1;
    let on = false;
    const size = () => {
      w = Math.max(1, Math.round(c.clientWidth));
      h = Math.max(1, Math.round(c.clientHeight));
      c.width = w;
      c.height = h;
      p?.resize?.(w, h);
      if (still && p) p.draw(4, 0, w, h);
    };
    const stopNear = whenNear(el, () => {
      p = mk.current(ctx);
      size();
    });
    const ro = new ResizeObserver(() => p && size());
    ro.observe(c);
    const io = new IntersectionObserver(([e]) => (on = e.isIntersecting), { rootMargin: "60px" });
    io.observe(el);
    const tick = (time: number, dtMs: number) => {
      if (on && p) p.draw(time, Math.min(dtMs / 1000, 0.05), w, h);
    };
    if (!still) gsap.ticker.add(tick);
    return () => {
      stopNear();
      ro.disconnect();
      io.disconnect();
      gsap.ticker.remove(tick);
    };
  }, [root, cv]);
}

type GLApi = { ogl: typeof import("ogl"); gl: OGLRenderingContext; renderer: Renderer };
type GLScene = { frame: (t: number, dt: number, w: number, h: number) => void; resize?: (w: number, h: number) => void; dispose?: () => void };

/**
 * One OGL renderer at dpr 1 on `cv`, created only near the viewport, drawn only while on screen. The canvas fades in
 * after its first frame (the CSS markup underneath is the fallback). Reduced motion: no WebGL at all.
 */
function useGL(root: RefObject<HTMLDivElement | null>, cv: RefObject<HTMLCanvasElement | null>, opts: { alpha?: boolean; preserve?: boolean }, make: (api: GLApi) => GLScene) {
  const mk = useRef(make);
  mk.current = make;
  const { alpha = true, preserve = false } = opts;
  useEffect(() => {
    const el = root.current;
    const canvas = cv.current;
    if (!el || !canvas || prefersReducedMotion()) return;
    let dead = false;
    let cleanup = () => {};
    const stop = whenNear(el, async () => {
      const ogl = await import("ogl");
      if (dead) return;
      try {
        const renderer = new ogl.Renderer({ canvas, dpr: 1, alpha, premultipliedAlpha: false, antialias: false, depth: false, preserveDrawingBuffer: preserve, autoClear: !preserve });
        const gl = renderer.gl;
        const sc = mk.current({ ogl, gl, renderer });
        let w = 1;
        let h = 1;
        const resize = () => {
          const r = el.getBoundingClientRect();
          w = Math.max(1, Math.round(r.width));
          h = Math.max(1, Math.round(r.height));
          renderer.setSize(w, h);
          canvas.style.width = "100%";
          canvas.style.height = "100%";
          sc.resize?.(w, h);
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(el);
        let visible = false;
        const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: "60px" });
        io.observe(el);
        let raf = 0;
        let last = performance.now();
        const t0 = last;
        let shown = false;
        const loop = () => {
          raf = requestAnimationFrame(loop);
          const now = performance.now();
          const dt = Math.min((now - last) / 1000, 0.05);
          last = now;
          if (!visible) return;
          sc.frame((now - t0) / 1000, dt, w, h);
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
          sc.dispose?.();
          gl.getExtension("WEBGL_lose_context")?.loseContext();
        };
        if (dead) cleanup();
      } catch (err) {
        console.warn("[b12g3] WebGL off, showing the fallback:", (err as Error).message);
      }
    });
    return () => {
      dead = true;
      stop();
      cleanup();
    };
  }, [root, cv, alpha, preserve]);
}

/** Small seeded random (same markup on server and client). */
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

/* ---------- M614 · Framing lines grow in (variant of M8: hairlines grow from five directions and frame the layout) ---------- */
type Line = { k: "v" | "h"; at: string; from: "top" | "bottom" | "left" | "right" | "centre" };
const LINES: Line[] = [
  { k: "v", at: "7%", from: "top" },
  { k: "h", at: "15%", from: "left" },
  { k: "v", at: "38%", from: "bottom" },
  { k: "h", at: "54%", from: "centre" },
  { k: "v", at: "69%", from: "top" },
  { k: "h", at: "85%", from: "right" },
  { k: "v", at: "93%", from: "bottom" },
];
const ORIGIN = { top: "50% 0%", bottom: "50% 100%", left: "0% 50%", right: "100% 50%", centre: "50% 50%" };
const OPPOSITE = { top: "50% 100%", bottom: "50% 0%", left: "100% 50%", right: "0% 50%", centre: "50% 50%" };
function M614() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const lines = gsap.utils.toArray<HTMLElement>(".m614-l", el);
      const copy = gsap.utils.toArray<HTMLElement>(".m614-c", el);
      const tl = gsap.timeline({ paused: true, repeat: -1 });
      lines.forEach((ln, i) => {
        const L = LINES[i];
        const prop = L.k === "v" ? "scaleY" : "scaleX";
        tl.fromTo(ln, { [prop]: 0, transformOrigin: ORIGIN[L.from] }, { [prop]: 1, duration: 0.95, ease: "power3.out" }, i * 0.11);
      });
      tl.fromTo(copy, { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.08, ease: "power2.out" }, 0.55);
      tl.to(copy, { autoAlpha: 0, y: -14, duration: 0.4, stagger: 0.05, ease: "power2.in" }, "+=0.25");
      tl.addLabel("out", ">-0.2");
      lines.forEach((ln, i) => {
        const L = LINES[i];
        const prop = L.k === "v" ? "scaleY" : "scaleX";
        tl.set(ln, { transformOrigin: OPPOSITE[L.from] }, "out");
        tl.to(ln, { [prop]: 0, duration: 0.55, ease: "power2.in" }, `out+=${(i * 0.06).toFixed(2)}`);
      });
      const io = new IntersectionObserver(([e]) => (e.isIntersecting ? tl.play() : tl.pause()), { threshold: 0.15 });
      io.observe(el);
      return () => io.disconnect();
    }, el);
    return () => ctx.revert();
  }, []);
  return (
    <Stage r={root} className="bg-[#0b0c10]" g1="rgba(120,140,255,.4)" g2="rgba(255,180,120,.2)">
      {LINES.map((l, i) => (
        <div key={i} className={`m614-l ${l.k}`} style={l.k === "v" ? { left: l.at } : { top: l.at }} aria-hidden />
      ))}
      <p className="m614-c absolute left-[9%] top-[5.5%] text-[13px] uppercase tracking-[0.3em] text-white/70">Atelier Norrå · Issue 07</p>
      <p className="m614-c absolute right-[9%] top-[5.5%] text-[13px] uppercase tracking-[0.3em] text-white/70">Spring / Summer</p>
      <h3 className="m614-c absolute left-[9%] top-[22%] w-[min(56%,760px)] text-[clamp(52px,6vw,104px)] font-[400] leading-[0.92] tracking-[-0.02em]" style={{ fontFamily: F.fr }}>
        Built on a quiet grid.
      </h3>
      <div className="m614-c absolute left-[71%] top-[22%] w-[20%] text-[15px] leading-relaxed text-white/70">Hairline structure, linen and oak. Furniture drawn to the millimetre and finished by hand.</div>
      <div className="m614-c absolute left-[9%] top-[60%] w-[27%]">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/55">Lounge chair</p>
        <p className="mt-2 text-[30px] font-[600] tracking-[-0.02em]" style={{ fontFamily: F.sg }}>
          ₹ 64,000
        </p>
      </div>
      <div className="m614-c absolute left-[40%] top-[60%] w-[27%]">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/55">Side table</p>
        <p className="mt-2 text-[30px] font-[600] tracking-[-0.02em]" style={{ fontFamily: F.sg }}>
          ₹ 22,500
        </p>
      </div>
      <div className="m614-c absolute left-[71%] top-[60%] w-[20%]">
        <span className="inline-block rounded-full border border-white/40 px-5 py-3 text-[14px]">View the issue</span>
      </div>
      <p className="m614-c absolute bottom-[4.5%] left-[9%] text-[13px] text-white/50">Concept · lines grow from top, bottom, left, right and centre</p>
    </Stage>
  );
}

/* ---------- M615 · Depth starfield (variant of M15: three depth layers, pointer parallax, twinkle, slow galaxy turn, push-away) ---------- */
function M615() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const ptr = useRef({ x: -1e4, y: -1e4, has: false });
  usePointer(
    root,
    dot,
    (t, w, h) => [w * (0.5 + 0.3 * Math.sin(t * 0.7)), h * (0.5 + 0.24 * Math.sin(t * 1.15 + 1))],
    (x, y) => (ptr.current = { x, y, has: true }),
  );
  useCanvas(root, cv, (ctx) => {
    const R = rng(615);
    const LAYERS = [
      { n: 220, s: 0.7, d: 0.25, a: 0.55 },
      { n: 130, s: 1.2, d: 0.55, a: 0.8 },
      { n: 60, s: 1.9, d: 1, a: 1 },
    ];
    const stars = LAYERS.flatMap((L, li) =>
      Array.from({ length: L.n }, () => ({ li, r: Math.sqrt(R()), a0: R() * Math.PI * 2, tw: R() < 0.22 ? 1 + R() * 2.4 : 0, ph: R() * 6.28, warm: R() < 0.2 })),
    );
    const off = LAYERS.map(() => ({ x: 0, y: 0 }));
    return {
      draw: (t, _dt, w, h) => {
        ctx.clearRect(0, 0, w, h);
        const cx = w / 2;
        const cy = h / 2;
        const RR = Math.hypot(w, h) * 0.56;
        const p = ptr.current;
        LAYERS.forEach((L, i) => {
          const tx = p.has ? (cx - p.x) * 0.06 * L.d : 0;
          const ty = p.has ? (cy - p.y) * 0.06 * L.d : 0;
          off[i].x += (tx - off[i].x) * 0.06;
          off[i].y += (ty - off[i].y) * 0.06;
        });
        for (const s of stars) {
          const L = LAYERS[s.li];
          const ang = s.a0 + t * (0.018 + 0.022 * L.d);
          let x = cx + Math.cos(ang) * s.r * RR + off[s.li].x;
          let y = cy + Math.sin(ang) * s.r * RR * 0.82 + off[s.li].y;
          if (p.has) {
            const dx = x - p.x;
            const dy = y - p.y;
            const d = Math.hypot(dx, dy);
            if (d < 150 && d > 0.01) {
              const k = (1 - d / 150) ** 2 * 46 * L.d;
              x += (dx / d) * k;
              y += (dy / d) * k;
            }
          }
          if (x < -4 || y < -4 || x > w + 4 || y > h + 4) continue;
          const tw = s.tw ? 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * s.tw * 2 + s.ph)) : 1;
          ctx.globalAlpha = L.a * tw;
          ctx.fillStyle = s.warm ? "#ffd9b0" : "#dfe8ff";
          ctx.beginPath();
          ctx.arc(x, y, L.s * (s.tw ? 0.8 + 0.4 * tw : 1), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      },
    };
  });
  return (
    <Stage r={root} className="bg-[#04050b]" g1="rgba(90,110,255,.5)" g2="rgba(190,120,255,.22)">
      <canvas ref={cv} className="absolute inset-0 h-full w-full" aria-hidden />
      <Sheen g1="rgba(90,110,255,.5)" />
      <Copy kicker="Kestrel Ridge Observatory" title="Look further out." meta="Dark-sky weekend for two · ₹ 6,900" className="bottom-[9%] left-[6%]" font={F.sy} weight={700} />
      <Dot r={dot} />
    </Stage>
  );
}

/* ---------- M616 · Twinkling sparkle field (variant of M15: tiny sparkles fade in/out and drift, masked under a heading) ---------- */
function M616() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  useCanvas(root, cv, (ctx) => {
    const R = rng(616);
    const N = 520;
    const ps = Array.from({ length: N }, () => ({ x: R(), y: R(), vx: (R() - 0.5) * 0.02, vy: (R() - 0.5) * 0.02, s: 0.4 + R() * 1.1, ph: R(), sp: 0.25 + R() * 0.6 }));
    return {
      draw: (t, dt, w, h) => {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "#ffffff";
        for (const p of ps) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.x < 0) p.x += 1;
          if (p.x > 1) p.x -= 1;
          if (p.y < 0) p.y += 1;
          if (p.y > 1) p.y -= 1;
          const cyc = (t * p.sp + p.ph) % 1;
          ctx.globalAlpha = Math.sin(cyc * Math.PI) ** 2;
          ctx.beginPath();
          ctx.arc(p.x * w, p.y * h, p.s, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      },
    };
  });
  return (
    <Stage r={root} className="bg-[#050509]" g1="rgba(110,90,255,.5)" g2="rgba(80,200,255,.18)">
      <Sheen g1="rgba(120,110,255,.5)" opacity={0.35} />
      <div className="m616-field z-30" aria-hidden>
        <canvas ref={cv} className="absolute inset-0 h-full w-full" />
      </div>
      <div className="pointer-events-none absolute left-1/2 top-[45.5%] z-40 h-[2px] w-[min(46%,620px)] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#8f7dff] to-transparent" aria-hidden />
      <div className="pointer-events-none absolute left-1/2 top-[45.5%] z-40 h-[5px] w-[min(22%,300px)] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#7fd6ff] to-transparent opacity-80" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 top-[13%] z-40 text-center">
        <p className="text-[13px] uppercase tracking-[0.3em] text-white/65">Saffron Lane Perfumery</p>
        <h3 className="mt-4 text-[clamp(56px,7vw,118px)] font-[700] leading-[0.9] tracking-[-0.04em]" style={{ fontFamily: F.sg }}>
          After Dusk
        </h3>
      </div>
      <p className="pointer-events-none absolute inset-x-0 bottom-[8%] z-40 text-center text-[15px] text-white/80">Eau de parfum, 50 ml · ₹ 7,800</p>
    </Stage>
  );
}

/* ---------- M617 · Glitter overlay (variant of M15: WebGL point sparkles glint on and off over a hero) ---------- */
const GLIT_V = /* glsl */ `
attribute vec2 position;
attribute vec3 aSeed;
uniform float uTime;
varying float vG;
varying float vWarm;
void main(){
  float s = sin(uTime * (0.7 + aSeed.y * 2.2) + aSeed.x * 6.2831);
  vG = pow(max(s, 0.0), 14.0);
  vWarm = aSeed.z;
  gl_Position = vec4(position, 0.0, 1.0);
  gl_PointSize = (5.0 + aSeed.z * 13.0) * (0.35 + 0.65 * vG);
}`;
const GLIT_F = /* glsl */ `
precision highp float;
varying float vG;
varying float vWarm;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float core = exp(-d * d * 70.0);
  float rays = exp(-abs(c.x) * 34.0) * exp(-abs(c.y) * 5.0) + exp(-abs(c.y) * 34.0) * exp(-abs(c.x) * 5.0);
  float a = (core + rays * 0.7) * vG;
  vec3 col = mix(vec3(1.0, 0.97, 0.92), vec3(1.0, 0.82, 0.5), vWarm);
  gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
}`;
function M617() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  useGL(root, cv, {}, ({ ogl, gl, renderer }) => {
    const R = rng(617);
    const N = 2600;
    const pos = new Float32Array(N * 2);
    const seed = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 2] = R() * 2 - 1;
      pos[i * 2 + 1] = (R() * 2 - 1) * 0.96;
      seed[i * 3] = R();
      seed[i * 3 + 1] = R();
      seed[i * 3 + 2] = R() ** 3;
    }
    const geometry = new ogl.Geometry(gl, { position: { size: 2, data: pos }, aSeed: { size: 3, data: seed } });
    const program = new ogl.Program(gl, { vertex: GLIT_V, fragment: GLIT_F, uniforms: { uTime: { value: 0 } }, transparent: true, depthTest: false, depthWrite: false });
    const mesh = new ogl.Mesh(gl, { geometry, program, mode: gl.POINTS });
    gl.clearColor(0, 0, 0, 0);
    return {
      frame: (t) => {
        program.uniforms.uTime.value = t;
        renderer.render({ scene: mesh });
      },
    };
  });
  return (
    <Stage r={root} className="bg-[#120c08]" g1="rgba(255,190,110,.5)" g2="rgba(255,120,150,.2)">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={scene(3, 1600, 1000)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,12,8,.85),rgba(18,12,8,.25)_60%,transparent)]" aria-hidden />
      <canvas ref={cv} className="pointer-events-none absolute inset-0 z-30 h-full w-full opacity-0 transition-opacity duration-500" aria-hidden />
      <Sheen g1="rgba(255,190,110,.5)" opacity={0.4} />
      <Copy kicker="Aurelle Fine Jewels" title={<>Catch<br />the light.</>} meta="Solitaire studs, 18k gold · ₹ 48,000" className="left-[6%] top-1/2 -translate-y-1/2" font={F.fr} weight={400} size="clamp(56px,6.4vw,108px)" />
    </Stage>
  );
}

/* ---------- M618 · Shooting stars over a sky (variant of M15: twinkling SVG stars, a streak shoots across at a random angle) ---------- */
const SKY = (() => {
  const R = rng(618);
  return Array.from({ length: 110 }, () => ({ x: R() * 1000, y: R() * 600, r: 0.5 + R() * 1.4, d: `${(1.2 + R() * 2.6).toFixed(2)}s`, dl: `${(-R() * 4).toFixed(2)}s`, tw: R() < 0.7 }));
})();
function M618() {
  const root = useRef<HTMLDivElement>(null);
  useOnClass(root, "m618-on");
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const shots = gsap.utils.toArray<SVGGElement>(".m618-shot", el);
      const tweens: (gsap.core.Animation | undefined)[] = [];
      let live = false;
      const shoot = (g: SVGGElement, i: number) => {
        const inner = g.firstElementChild as SVGGElement;
        const ltr = Math.random() < 0.6;
        const ang = (14 + Math.random() * 30) * (Math.PI / 180);
        const dirX = ltr ? Math.cos(ang) : -Math.cos(ang);
        const dirY = Math.sin(ang);
        const x0 = ltr ? -60 + Math.random() * 520 : 480 + Math.random() * 580;
        const y0 = -30 + Math.random() * 200;
        const dist = 520 + Math.random() * 420;
        const speed = 520 + Math.random() * 620;
        const len = 90 + Math.random() * 130;
        inner.setAttribute("transform", `rotate(${(Math.atan2(dirY, dirX) * 180) / Math.PI})`);
        (inner.querySelector("rect") as SVGRectElement).setAttribute("x", String(-len));
        (inner.querySelector("rect") as SVGRectElement).setAttribute("width", String(len));
        const tl = gsap.timeline({ onComplete: () => live && shoot(g, i) });
        tl.set(g, { x: x0, y: y0, opacity: 0 })
          .to(g, { opacity: 1, duration: 0.12 }, 0)
          .to(g, { x: x0 + dirX * dist, y: y0 + dirY * dist, duration: dist / speed, ease: "none" }, 0)
          .to(g, { opacity: 0, duration: 0.3 }, dist / speed - 0.3)
          .to({}, { duration: 0.15 + Math.random() * (i ? 1.4 : 0.6) });
        tweens[i] = tl;
      };
      const io = new IntersectionObserver(([e]) => {
        if (e.isIntersecting && !live) {
          live = true;
          shots.forEach((g, i) => (tweens[i] ? tweens[i].resume() : shoot(g, i)));
        } else if (!e.isIntersecting && live) {
          live = false;
          tweens.forEach((t) => t?.pause());
        }
      });
      io.observe(el);
      return () => {
        live = false;
        io.disconnect();
        tweens.forEach((t) => t?.kill());
      };
    }, el);
    return () => ctx.revert();
  }, []);
  return (
    <Stage r={root} className="bg-[linear-gradient(180deg,#04060f,#0b1230_70%,#1b2140)]" g1="rgba(80,110,255,.5)" g2="rgba(255,160,120,.18)">
      <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="m618-tail" x1="0" x2="1">
            <stop offset="0" stopColor="#9fb6ff" stopOpacity="0" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="1" />
          </linearGradient>
        </defs>
        {SKY.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#e8eeff" className={s.tw ? "m618-s" : undefined} style={{ "--d": s.d, "--dl": s.dl, opacity: s.tw ? undefined : 0.5 } as CSSProperties} />
        ))}
        {[0, 1].map((i) => (
          <g key={i} className="m618-shot" transform={i ? "translate(-200 -200)" : "translate(640 210)"}>
            <g transform="rotate(26)">
              <rect x={-170} y={-0.9} width={170} height={1.8} rx={0.9} fill="url(#m618-tail)" />
              <circle r={6} fill="#ffffff" opacity={0.18} />
              <circle r={2.2} fill="#ffffff" />
            </g>
          </g>
        ))}
        <path d="M0 560 Q 180 520 340 548 T 700 536 T 1000 552 V 600 H 0 Z" fill="#05070f" />
      </svg>
      <Sheen g1="rgba(80,110,255,.5)" opacity={0.35} />
      <Copy kicker="Northfield Camps · Stargazing" title="Make a wish tonight." meta="Meteor nights, dome tent for two · ₹ 4,200" className="left-[6%] top-[10%] w-[min(60%,820px)]" font={F.is} weight={400} size="clamp(56px,6.2vw,104px)" />
    </Stage>
  );
}

/* ---------- M619 · Meteors (variant of M618: CSS streaks fall top-right → bottom-left on random 2–10 s loops, inside a card) ---------- */
const METEORS = (() => {
  const R = rng(619);
  return Array.from({ length: 22 }, () => {
    const d = 2 + R() * 8;
    return { x: `${(18 + R() * 92).toFixed(1)}%`, y: `${(-12 + R() * 40).toFixed(1)}%`, d: `${d.toFixed(2)}s`, dl: `${(-R() * d).toFixed(2)}s`, len: `${Math.round(60 + R() * 110)}px` };
  });
})();
function M619() {
  const root = useRef<HTMLDivElement>(null);
  useOnClass(root, "m619-on");
  return (
    <Stage r={root} className="bg-[#07080d]" g1="rgba(90,120,255,.42)" g2="rgba(160,100,255,.22)">
      <div className="grid h-full place-items-center">
        <div className="relative h-[74%] w-[min(620px,48%)] overflow-hidden rounded-[30px] border border-white/12 bg-[linear-gradient(160deg,#141a2e,#0b0e18_65%)] shadow-[0_30px_80px_rgba(0,0,0,.5)]">
          {METEORS.map((m, i) => (
            <span key={i} className="m619-m" style={{ "--x": m.x, "--y": m.y, "--d": m.d, "--dl": m.dl, "--len": m.len } as CSSProperties} aria-hidden />
          ))}
          <div className="relative flex h-full flex-col justify-end p-10">
            <p className="text-[13px] uppercase tracking-[0.28em] text-white/60">Halcyon Cloud · Pro</p>
            <h3 className="mt-4 text-[clamp(44px,4.2vw,70px)] font-[650] leading-[0.94] tracking-[-0.03em]" style={{ fontFamily: F.sg }}>
              Ship at light speed.
            </h3>
            <p className="mt-4 max-w-[34ch] text-[15px] leading-relaxed text-white/65">Edge builds in seconds, previews for every branch, one bill for the whole team.</p>
            <div className="mt-8 flex items-end justify-between">
              <p className="tabular-nums" style={{ fontFamily: F.sg }}>
                <span className="text-[38px] font-[650] tracking-[-0.03em]">₹ 1,800</span>
                <span className="ml-2 text-[14px] text-white/50">/ seat / month</span>
              </p>
              <span className="rounded-full bg-white px-5 py-3 text-[14px] font-[600] text-[#0b0d14]">Start building</span>
            </div>
          </div>
        </div>
      </div>
    </Stage>
  );
}

/* ---------- M620 · Particles drift to pointer (variant of M15: random drift, nearby dots ease toward the cursor, edges fade) ---------- */
function M620() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const ptr = useRef({ x: -1e4, y: -1e4 });
  usePointer(
    root,
    dot,
    (t, w, h) => [w * (0.5 + 0.32 * Math.sin(t * 0.55) * Math.cos(t * 0.21)), h * (0.48 + 0.26 * Math.sin(t * 0.9 + 0.6))],
    (x, y) => (ptr.current = { x, y }),
  );
  useCanvas(root, cv, (ctx) => {
    const R = rng(620);
    const N = 240;
    let W = 1;
    let H = 1;
    const ps = Array.from({ length: N }, () => ({ x: R(), y: R(), vx: 0, vy: 0, s: 0.8 + R() * 1.9, ring: 18 + R() * 80, ang: R() * 6.28, ph: R() * 6.28 }));
    let placed = false;
    return {
      resize: (w, h) => {
        if (!placed) {
          ps.forEach((p) => ((p.x *= w), (p.y *= h)));
          placed = true;
        } else {
          ps.forEach((p) => ((p.x *= w / W), (p.y *= h / H)));
        }
        W = w;
        H = h;
      },
      draw: (t, dt, w, h) => {
        ctx.clearRect(0, 0, w, h);
        const P = ptr.current;
        const RAD = 210;
        ctx.fillStyle = "#e6ecff";
        for (const p of ps) {
          p.vx += Math.sin(t * 0.6 + p.ph) * 14 * dt + (Math.random() - 0.5) * 30 * dt;
          p.vy += Math.cos(t * 0.5 + p.ph * 1.3) * 14 * dt + (Math.random() - 0.5) * 30 * dt;
          const tx = P.x + Math.cos(p.ang + t * 0.8) * p.ring;
          const ty = P.y + Math.sin(p.ang + t * 0.8) * p.ring;
          const d = Math.hypot(P.x - p.x, P.y - p.y);
          if (d < RAD) {
            const k = (1 - d / RAD) * 3.2;
            p.vx += (tx - p.x) * k * dt;
            p.vy += (ty - p.y) * k * dt;
          }
          p.vx *= 0.965;
          p.vy *= 0.965;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.x < -10) p.x = w + 10;
          if (p.x > w + 10) p.x = -10;
          if (p.y < -10) p.y = h + 10;
          if (p.y > h + 10) p.y = -10;
          const edge = Math.max(0, Math.min(1, Math.min(p.x, p.y, w - p.x, h - p.y) / 90));
          const near = d < RAD ? 0.35 * (1 - d / RAD) : 0;
          ctx.globalAlpha = edge * (0.45 + near + 0.2 * Math.sin(t * 1.4 + p.ph));
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      },
    };
  });
  return (
    <Stage r={root} className="bg-[#070910]" g1="rgba(110,140,255,.5)" g2="rgba(120,255,210,.16)">
      <canvas ref={cv} className="absolute inset-0 h-full w-full" aria-hidden />
      <Sheen g1="rgba(110,140,255,.5)" opacity={0.38} />
      <Copy kicker="Fieldnote · Community notebooks" title={<>Ideas gather<br />where you are.</>} meta="Dotted A5 notebook, set of three · ₹ 650" className="left-[6%] top-[10%]" font={F.mr} weight={700} size="clamp(46px,5vw,84px)" />
      <Dot r={dot} />
    </Stage>
  );
}

/* ---------- M621 · Particles part around cursor (variant of M15: a WebGL curl-swirl cloud behind the title parts at the cursor) ---------- */
const PART_V = /* glsl */ `
attribute vec3 position;
attribute vec2 aSeed;
uniform float uTime;
uniform vec2 uPtr;
uniform float uAspect;
varying float vA;
varying float vT;
vec3 swirl(vec3 p, float t){
  vec3 q = p;
  q += 0.20 * vec3(sin(p.y * 2.1 + t * 0.55 + aSeed.x * 2.0), sin(p.z * 2.4 + t * 0.47), sin(p.x * 1.9 - t * 0.61));
  q += 0.09 * vec3(cos(p.z * 4.3 + t * 0.9), cos(p.x * 3.7 - t * 0.8), cos(p.y * 4.1 + t * 0.95));
  return q;
}
void main(){
  float t = uTime;
  vec3 p = swirl(position, t);
  float a = t * 0.14 + length(position.xz) * 0.4;
  float c = cos(a), s = sin(a);
  p.xz = mat2(c, -s, s, c) * p.xz;
  p.x *= 1.55;
  float z = p.z + 3.2;
  vec2 sp = p.xy * 2.5 / z;
  sp.x /= uAspect;
  vec2 d = sp - uPtr;
  d.x *= uAspect;
  float dist = length(d);
  float push = 0.24 * exp(-dist * dist / 0.05);
  vec2 dir = dist > 0.0001 ? d / dist : vec2(0.0, 1.0);
  sp += vec2(dir.x / uAspect, dir.y) * push;
  gl_Position = vec4(sp, 0.0, 1.0);
  gl_PointSize = (1.4 + aSeed.y * 2.4) * 3.4 / z;
  vA = (0.35 + 0.65 * smoothstep(4.4, 2.2, z)) * (0.6 + 0.4 * sin(t * 1.3 + aSeed.x * 6.28));
  vT = aSeed.x;
}`;
const PART_F = /* glsl */ `
precision highp float;
varying float vA;
varying float vT;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float a = smoothstep(0.5, 0.0, length(c)) * vA;
  vec3 col = mix(vec3(0.55, 0.68, 1.0), vec3(1.0, 0.72, 0.86), vT);
  gl_FragColor = vec4(col, a * 0.85);
}`;
function M621() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const ptr = useRef({ x: 0, y: 0 });
  usePointer(
    root,
    dot,
    (t, w, h) => [w * (0.5 + 0.3 * Math.sin(t * 0.62)), h * (0.5 + 0.22 * Math.sin(t * 1.24 + 0.4))],
    (x, y) => {
      const el = root.current;
      if (!el) return;
      ptr.current = { x: (x / el.clientWidth) * 2 - 1, y: 1 - (y / el.clientHeight) * 2 };
    },
  );
  useGL(root, cv, { alpha: false }, ({ ogl, gl, renderer }) => {
    const R = rng(621);
    const N = 9000;
    const pos = new Float32Array(N * 3);
    const seed = new Float32Array(N * 2);
    for (let i = 0; i < N; i++) {
      const u = R() * 2 - 1;
      const th = R() * Math.PI * 2;
      const r = Math.cbrt(R());
      const q = Math.sqrt(1 - u * u);
      pos[i * 3] = r * q * Math.cos(th);
      pos[i * 3 + 1] = r * u * 0.62;
      pos[i * 3 + 2] = r * q * Math.sin(th);
      seed[i * 2] = R();
      seed[i * 2 + 1] = R();
    }
    const geometry = new ogl.Geometry(gl, { position: { size: 3, data: pos }, aSeed: { size: 2, data: seed } });
    const program = new ogl.Program(gl, {
      vertex: PART_V,
      fragment: PART_F,
      uniforms: { uTime: { value: 0 }, uPtr: { value: [0, 0] }, uAspect: { value: 1.6 } },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    program.setBlendFunc(gl.SRC_ALPHA, gl.ONE);
    const mesh = new ogl.Mesh(gl, { geometry, program, mode: gl.POINTS });
    gl.clearColor(0.035, 0.035, 0.07, 1);
    const sm = { x: 0, y: 0 };
    return {
      resize: (w, h) => (program.uniforms.uAspect.value = w / h),
      frame: (t) => {
        sm.x += (ptr.current.x - sm.x) * 0.12;
        sm.y += (ptr.current.y - sm.y) * 0.12;
        program.uniforms.uTime.value = t;
        program.uniforms.uPtr.value = [sm.x, sm.y];
        renderer.render({ scene: mesh });
      },
    };
  });
  return (
    <Stage r={root} className="bg-[#090912]" g1="rgba(120,130,255,.5)" g2="rgba(255,140,200,.22)">
      <div className="absolute inset-0" style={{ background: "radial-gradient(42% 34% at 50% 50%,rgba(140,160,255,.35),rgba(255,160,210,.12) 60%,transparent 72%),#090912" }} aria-hidden>
        <canvas ref={cv} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500" />
      </div>
      <Sheen g1="rgba(120,130,255,.5)" opacity={0.4} />
      <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center text-center">
        <div>
          <p className="text-[13px] uppercase tracking-[0.3em] text-white/70">Northwind Records · Live</p>
          <h3 className="mt-4 text-[clamp(60px,7vw,118px)] font-[800] uppercase leading-[0.88] tracking-[-0.02em]" style={{ fontFamily: F.sy }}>
            Drift
          </h3>
          <p className="mt-4 text-[15px] text-white/80">Ambient night, standing · ₹ 1,450</p>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ---------- M622 · Noise swirl particles (variant of M1009: canvas particles swirl around the centre on noise, additive trails) ---------- */
function M622() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  useCanvas(root, cv, (ctx) => {
    const N = 1100;
    const R = rng(622);
    const ps = Array.from({ length: N }, () => ({ x: 0, y: 0, life: 0, ttl: 0, sp: 0, w: 0, hue: 0 }));
    let first = true;
    const spawn = (p: (typeof ps)[number], w: number, h: number, warm = false) => {
      const a = R() * Math.PI * 2;
      const r = Math.min(w, h) * (0.12 + R() * 0.42);
      p.x = w / 2 + Math.cos(a) * r * 1.45;
      p.y = h / 2 + Math.sin(a) * r;
      p.life = warm ? R() * 200 : 0;
      p.ttl = 120 + R() * 220;
      p.sp = 0.6 + R() * 1.3;
      p.w = 0.6 + R() * 1.8;
      p.hue = 195 + R() * 90;
    };
    return {
      resize: (w, h) => {
        ps.forEach((p) => spawn(p, w, h, true));
        first = true;
      },
      draw: (t, dt, w, h) => {
        const k = dt * 60;
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = first ? "#05060c" : "rgba(5,6,12,0.14)";
        ctx.fillRect(0, 0, w, h);
        first = false;
        ctx.globalCompositeOperation = "lighter";
        ctx.lineCap = "round";
        const cx = w / 2;
        const cy = h / 2;
        const ring = Math.min(w, h) * 0.34;
        for (const p of ps) {
          const dx = (p.x - cx) / 1.45;
          const dy = p.y - cy;
          const r = Math.hypot(dx, dy) || 1;
          const n = Math.sin(p.x * 0.0042 + t * 0.35) * Math.cos(p.y * 0.0051 - t * 0.27) + 0.5 * Math.sin((p.x + p.y) * 0.0031 + t * 0.19);
          const na = n * Math.PI * 1.6;
          const tx = (-dy / r) * 1.45;
          const ty = dx / r;
          const pull = (ring - r) / ring;
          const vx = (tx * 1.2 + Math.cos(na) * 0.9 + (dx / r) * pull * 0.8) * p.sp * k;
          const vy = (ty * 1.2 + Math.sin(na) * 0.9 + (dy / r) * pull * 0.8) * p.sp * k;
          const nx = p.x + vx;
          const ny = p.y + vy;
          p.life += k;
          const fade = Math.sin((p.life / p.ttl) * Math.PI);
          ctx.strokeStyle = `hsla(${p.hue},95%,62%,${(fade * 0.55).toFixed(3)})`;
          ctx.lineWidth = p.w;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(nx, ny);
          ctx.stroke();
          p.x = nx;
          p.y = ny;
          if (p.life > p.ttl || nx < -20 || ny < -20 || nx > w + 20 || ny > h + 20) spawn(p, w, h);
        }
        ctx.globalCompositeOperation = "source-over";
      },
    };
  });
  return (
    <Stage r={root} className="bg-[#05060c]" g1="rgba(110,120,255,.5)" g2="rgba(220,110,255,.22)">
      <canvas ref={cv} className="absolute inset-0 h-full w-full" aria-hidden />
      <Sheen g1="rgba(110,120,255,.5)" opacity={0.35} />
      <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center text-center">
        <div>
          <p className="text-[13px] uppercase tracking-[0.3em] text-white/70">Tidecall Audio · Spatial series</p>
          <h3 className="mt-4 text-[clamp(56px,6.4vw,108px)] font-[650] leading-[0.9] tracking-[-0.035em]" style={{ fontFamily: F.sg }}>
            Into the swirl.
          </h3>
          <p className="mt-4 text-[15px] text-white/80">Open-back headphones · ₹ 24,900</p>
        </div>
      </div>
    </Stage>
  );
}

/* ---------- M623 · Curl-noise flow streaks (variant of M15: WebGL line particles follow a divergence-free flow, trails fade) ---------- */
const FLOW_V = /* glsl */ `
attribute vec2 position;
attribute float aHue;
uniform float uAspect;
varying float vHue;
void main(){
  vHue = aHue;
  gl_Position = vec4(position.x / uAspect, position.y, 0.0, 1.0);
}`;
const FLOW_F = /* glsl */ `
precision highp float;
varying float vHue;
void main(){
  vec3 a = vec3(0.32, 0.86, 1.0);
  vec3 b = vec3(0.62, 0.42, 1.0);
  vec3 c = vec3(1.0, 0.55, 0.62);
  vec3 col = vHue < 0.5 ? mix(a, b, vHue * 2.0) : mix(b, c, vHue * 2.0 - 1.0);
  gl_FragColor = vec4(col, 0.42);
}`;
const FADE_V = /* glsl */ `
attribute vec2 position;
void main(){ gl_Position = vec4(position, 0.0, 1.0); }`;
const FADE_F = /* glsl */ `
precision highp float;
void main(){ gl_FragColor = vec4(0.024, 0.027, 0.055, 0.1); }`;
function M623() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  useGL(root, cv, { alpha: false, preserve: true }, ({ ogl, gl, renderer }) => {
    const R = rng(623);
    const N = 5000;
    const px = new Float32Array(N);
    const py = new Float32Array(N);
    const life = new Float32Array(N);
    const seg = new Float32Array(N * 4);
    const hue = new Float32Array(N * 2);
    let aspect = 1.6;
    const spawn = (i: number) => {
      px[i] = (R() * 2 - 1) * aspect;
      py[i] = R() * 2 - 1;
      life[i] = 1.5 + R() * 4;
    };
    for (let i = 0; i < N; i++) {
      spawn(i);
      life[i] *= R();
    }
    const geometry = new ogl.Geometry(gl, { position: { size: 2, data: seg }, aHue: { size: 1, data: hue } });
    const program = new ogl.Program(gl, { vertex: FLOW_V, fragment: FLOW_F, uniforms: { uAspect: { value: aspect } }, transparent: true, depthTest: false, depthWrite: false });
    program.setBlendFunc(gl.SRC_ALPHA, gl.ONE);
    const lines = new ogl.Mesh(gl, { geometry, program, mode: gl.LINES });
    const fadeProg = new ogl.Program(gl, { vertex: FADE_V, fragment: FADE_F, transparent: true, depthTest: false, depthWrite: false });
    const fade = new ogl.Mesh(gl, { geometry: new ogl.Triangle(gl), program: fadeProg });
    gl.clearColor(0.024, 0.027, 0.055, 1);
    let clearNext = true;
    return {
      resize: (w, h) => {
        aspect = w / h;
        program.uniforms.uAspect.value = aspect;
        clearNext = true;
      },
      frame: (t, dt) => {
        const s = dt * 0.32;
        const T = t * 0.22;
        for (let i = 0; i < N; i++) {
          const x = px[i];
          const y = py[i];
          // stream function psi = sin(1.6x+T)cos(1.9y-0.7T) + 0.5 sin(2.7y+1.2x+0.4T); velocity = (dpsi/dy, -dpsi/dx)
          const a1 = 1.6 * x + T;
          const b1 = 1.9 * y - 0.7 * T;
          const a2 = 2.7 * y + 1.2 * x + 0.4 * T;
          const dpx = 1.6 * Math.cos(a1) * Math.cos(b1) + 0.6 * Math.cos(a2);
          const dpy = -1.9 * Math.sin(a1) * Math.sin(b1) + 1.35 * Math.cos(a2);
          const nx = x + dpy * s;
          const ny = y - dpx * s;
          seg[i * 4] = x;
          seg[i * 4 + 1] = y;
          seg[i * 4 + 2] = nx;
          seg[i * 4 + 3] = ny;
          const hv = 0.5 + 0.5 * Math.sin(x * 0.9 + y * 0.7 + T);
          hue[i * 2] = hv;
          hue[i * 2 + 1] = hv;
          px[i] = nx;
          py[i] = ny;
          life[i] -= dt;
          if (life[i] <= 0 || Math.abs(nx) > aspect * 1.05 || Math.abs(ny) > 1.05) {
            spawn(i);
            seg[i * 4 + 2] = seg[i * 4];
            seg[i * 4 + 3] = seg[i * 4 + 1];
          }
        }
        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.aHue.needsUpdate = true;
        if (clearNext) {
          gl.clear(gl.COLOR_BUFFER_BIT);
          clearNext = false;
        } else renderer.render({ scene: fade, clear: false });
        renderer.render({ scene: lines, clear: false });
      },
    };
  });
  return (
    <Stage r={root} className="bg-[#06070e]" g1="rgba(90,150,255,.5)" g2="rgba(255,120,150,.2)">
      <div className="absolute inset-0" style={{ background: "repeating-linear-gradient(115deg,rgba(90,200,255,.08) 0 2px,transparent 2px 22px),radial-gradient(60% 60% at 50% 50%,rgba(120,100,255,.25),transparent 70%),#06070e" }} aria-hidden>
        <canvas ref={cv} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500" />
      </div>
      <Sheen g1="rgba(90,150,255,.5)" opacity={0.35} />
      <Copy kicker="Currentline Labs · Wind tunnel studio" title={<>Shaped by<br />the flow.</>} meta="Aero bike helmet · ₹ 15,900" className="bottom-[9%] left-[6%]" font={F.sy} weight={700} size="clamp(48px,5.4vw,90px)" />
    </Stage>
  );
}

/* ---------- M624 · Murmuration swarm (variant of M15: 2,500 dots chase random points inside a moving circle, re-targeting) ---------- */
function M624() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const flock = useRef({ x: 0.5, y: 0.45, r: 0.16, stretch: 1.6 });
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const f = flock.current;
    const tl = gsap.timeline({ paused: true, repeat: -1, repeatRefresh: true });
    tl.to(f, { x: () => gsap.utils.random(0.22, 0.8), y: () => gsap.utils.random(0.22, 0.62), r: () => gsap.utils.random(0.08, 0.2), stretch: () => gsap.utils.random(1, 2.4), duration: 1.5, ease: "sine.inOut" });
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? tl.play() : tl.pause()), { threshold: 0.1 });
    io.observe(el);
    return () => {
      io.disconnect();
      tl.kill();
    };
  }, []);
  useCanvas(root, cv, (ctx) => {
    const N = 2500;
    const R = rng(624);
    const x = new Float32Array(N);
    const y = new Float32Array(N);
    const vx = new Float32Array(N);
    const vy = new Float32Array(N);
    const ox = new Float32Array(N);
    const oy = new Float32Array(N);
    const k = new Float32Array(N);
    const pick = (i: number) => {
      const a = R() * Math.PI * 2;
      const r = Math.sqrt(R());
      ox[i] = Math.cos(a) * r;
      oy[i] = Math.sin(a) * r;
    };
    let placed = false;
    for (let i = 0; i < N; i++) {
      pick(i);
      k[i] = 2.2 + R() * 3.5;
    }
    let next = 0;
    return {
      resize: (w, h) => {
        if (placed) return;
        placed = true;
        const f = flock.current;
        const m = Math.min(w, h);
        for (let i = 0; i < N; i++) {
          x[i] = f.x * w + ox[i] * f.r * m * f.stretch;
          y[i] = f.y * h + oy[i] * f.r * m;
        }
      },
      draw: (_t, dt, w, h) => {
        ctx.clearRect(0, 0, w, h);
        const f = flock.current;
        const m = Math.min(w, h);
        const cx = f.x * w;
        const cy = f.y * h;
        const rx = f.r * m * f.stretch;
        const ry = f.r * m;
        // re-target a slice of the flock every frame (each bird picks a new point inside the circle on a loop)
        const slice = Math.max(1, Math.round(N * 0.025));
        for (let j = 0; j < slice; j++) {
          pick(next);
          next = (next + 1) % N;
        }
        ctx.fillStyle = "#1b1420";
        const damp = Math.pow(0.9, dt * 60);
        for (let i = 0; i < N; i++) {
          const tx = cx + ox[i] * rx;
          const ty = cy + oy[i] * ry;
          vx[i] = (vx[i] + (tx - x[i]) * k[i] * dt) * damp;
          vy[i] = (vy[i] + (ty - y[i]) * k[i] * dt) * damp;
          x[i] += vx[i] * dt * 6;
          y[i] += vy[i] * dt * 6;
          ctx.fillRect(x[i], y[i], 1.8, 1.8);
        }
      },
    };
  });
  return (
    <Stage r={root} className="bg-[linear-gradient(180deg,#f6c9a8_0%,#efa38c_45%,#b9708a_80%,#5d4a73_100%)]" g1="rgba(255,236,200,.55)" g2="rgba(255,150,170,.3)">
      <canvas ref={cv} className="absolute inset-0 h-full w-full" aria-hidden />
      <svg viewBox="0 0 1000 120" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 h-[16%] w-full" aria-hidden>
        <path d="M0 80 Q 120 40 260 70 T 520 60 T 800 72 T 1000 58 V 120 H 0 Z" fill="#2a1f33" />
      </svg>
      <div className="pointer-events-none absolute left-[6%] top-[9%] z-40" style={{ color: "#1b1420" }}>
        <p className="text-[13px] uppercase tracking-[0.28em] opacity-70">Fenwater Reserve · Winter evenings</p>
        <h3 className="mt-3 text-[clamp(52px,5.8vw,98px)] font-[400] leading-[0.9] tracking-[-0.02em]" style={{ fontFamily: F.is }}>
          Move as one.
        </h3>
        <p className="mt-4 text-[15px] opacity-80">Guided dusk walk with hot tea · ₹ 1,200</p>
      </div>
    </Stage>
  );
}

/* ---------- M625 · Rain streaks (new: angled canvas rain with small splashes on the floor) ---------- */
function M625() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  useCanvas(root, cv, (ctx) => {
    const R = rng(625);
    const N = 260;
    const SLANT = 0.22;
    const drops = Array.from({ length: N }, () => ({ x: R(), y: R(), len: 14 + R() * 26, sp: 900 + R() * 700, a: 0.25 + R() * 0.45 }));
    type Splash = { x: number; y: number; age: number; bits: { vx: number; vy: number }[] };
    const splashes: Splash[] = [];
    let W = 1;
    let H = 1;
    let placed = false;
    return {
      resize: (w, h) => {
        if (!placed) {
          drops.forEach((d) => ((d.x *= w * 1.2), (d.y *= h)));
          placed = true;
        } else drops.forEach((d) => ((d.x *= w / W), (d.y *= h / H)));
        W = w;
        H = h;
      },
      draw: (_t, dt, w, h) => {
        ctx.clearRect(0, 0, w, h);
        const floor = h * 0.8;
        ctx.lineCap = "round";
        ctx.lineWidth = 1.1;
        for (const d of drops) {
          d.y += d.sp * dt;
          d.x -= d.sp * SLANT * dt;
          const fl = floor + (d.a - 0.45) * h * 0.18;
          if (d.y > fl) {
            if (splashes.length < 90 && d.x > 0 && d.x < w) {
              splashes.push({ x: d.x, y: fl, age: 0, bits: [0, 1, 2].map(() => ({ vx: (R() - 0.6) * 120, vy: -(70 + R() * 110) })) });
            }
            d.y = -d.len - R() * h * 0.3;
            d.x = R() * w * 1.25;
          }
          ctx.strokeStyle = `rgba(205,222,255,${d.a.toFixed(2)})`;
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x + d.len * SLANT, d.y - d.len);
          ctx.stroke();
        }
        for (let i = splashes.length - 1; i >= 0; i--) {
          const s = splashes[i];
          s.age += dt;
          const k = s.age / 0.45;
          if (k >= 1) {
            splashes.splice(i, 1);
            continue;
          }
          ctx.strokeStyle = `rgba(215,228,255,${(0.55 * (1 - k)).toFixed(3)})`;
          ctx.beginPath();
          ctx.ellipse(s.x, s.y, 2 + k * 16, 0.6 + k * 3.4, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = `rgba(225,235,255,${(0.7 * (1 - k)).toFixed(3)})`;
          for (const b of s.bits) {
            const bx = s.x + b.vx * s.age;
            const by = s.y + b.vy * s.age + 0.5 * 900 * s.age * s.age;
            if (by <= s.y + 1) ctx.fillRect(bx, by, 1.6, 1.6);
          }
        }
      },
    };
  });
  return (
    <Stage r={root} className="bg-[linear-gradient(180deg,#0b1220_0%,#132036_62%,#0a0f1a_100%)]" g1="rgba(90,140,255,.5)" g2="rgba(255,170,90,.24)">
      <div className="absolute inset-x-0 bottom-0 h-[30%] bg-[linear-gradient(180deg,rgba(80,120,190,.18),rgba(10,14,24,.9))]" aria-hidden />
      <div className="absolute bottom-[12%] left-[58%] h-[18%] w-[26%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(255,180,100,.35),transparent)]" aria-hidden />
      <canvas ref={cv} className="absolute inset-0 h-full w-full" aria-hidden />
      <Sheen g1="rgba(90,140,255,.5)" opacity={0.35} />
      <Copy kicker="Monsoon Edit · Outerwear" title={<>Made for<br />the downpour.</>} meta="Packable rain shell · ₹ 5,490" className="left-[6%] top-[10%]" font={F.sg} weight={650} size="clamp(50px,5.6vw,94px)" />
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M614", name: "Framing lines grow in", how: "Hairlines grow in from top, bottom, left, right and centre to frame the layout, then the copy lands (loop)", kind: "play", C: M614 },
  { code: "M615", name: "Depth starfield", how: "Three depth layers of stars turn slowly like a galaxy, shift with the pointer and part around it; some twinkle", kind: "play", C: M615 },
  { code: "M616", name: "Twinkling sparkle field", how: "Tiny sparkles fade in and out and drift under the heading, masked into a soft glow (canvas)", kind: "play", C: M616 },
  { code: "M617", name: "Glitter overlay", how: "Thousands of tiny star-shaped sparkles glint on and off over the hero (WebGL points)", kind: "play", C: M617 },
  { code: "M618", name: "Shooting stars over a sky", how: "SVG stars twinkle; bright streaks with gradient tails shoot across at random angles and speeds", kind: "play", C: M618 },
  { code: "M619", name: "Meteors", how: "Thin streaks with fading tails fall top-right to bottom-left inside a card on random 2–10 s loops (CSS)", kind: "play", C: M619 },
  { code: "M620", name: "Particles drift to pointer", how: "Dots drift at random; the ones near the pointer ease toward it and gather; edges fade (canvas)", kind: "play", C: M620 },
  { code: "M621", name: "Particles part around cursor", how: "A 3D particle cloud swirls behind the title and parts around the pointer (WebGL points)", kind: "play", C: M621 },
  { code: "M622", name: "Noise swirl particles", how: "Particles swirl around the centre on a noise field, leaving additive glowing trails (canvas)", kind: "play", C: M622 },
  { code: "M623", name: "Curl-noise flow streaks", how: "Thousands of particles follow a curl flow field and leave thin glowing streaks (WebGL lines)", kind: "play", C: M623 },
  { code: "M624", name: "Murmuration swarm", how: "2,500 dots chase random points inside a moving circle and keep re-targeting, swirling like starlings", kind: "play", C: M624 },
  { code: "M625", name: "Rain streaks", how: "Angled rain falls over a night scene and splashes in small rings on the floor (canvas)", kind: "play", C: M625 },
];
