"use client";

// Ambient motions, batch 12 · group 5 (MOTION-MENU M638–M649). Small focused demos for /lab/motion.
// Every demo is "play": it starts when it is on screen, loops, and pauses off screen. Each stage also has a CSS-only glow
// loop that never stops (a second one sits ON TOP of full-bleed canvases / shaders). Pointer demos drive a visible fake
// pointer by themselves; the real mouse takes over while it moves. WebGL demos build their context only when the stage is
// within ~1 screen of the viewport, at dpr 1, and draw only while visible. ?static=1 / reduced motion: no JS motion, CSS
// loops stop, the markup (CSS fallbacks, rings at rest, contours at t = 0) shows a sensible final state.
import { useEffect, useId, useMemo, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, DrawSVGPlugin, prefersReducedMotion } from "@/lib/gsap";
import { createShader, type GLHandle } from "@/lib/gl";
import { scene, useTicker } from "@/components/fx/shared";
import type { MotionDef } from "./types";

if (typeof window !== "undefined") gsap.registerPlugin(DrawSVGPlugin);

const F = {
  sg: "'Space Grotesk Variable', system-ui, sans-serif",
  fr: "'Fraunces Variable', Georgia, serif",
  is: "'Instrument Serif', Georgia, serif",
  sy: "'Syne Variable', 'Space Grotesk Variable', system-ui, sans-serif",
  mr: "'Manrope Variable', system-ui, sans-serif",
};

const CSS = `
.b12g5-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.5)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.22)),transparent 70%);animation:b12g5-drift 5.6s linear infinite alternate;will-change:transform}
@keyframes b12g5-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b12g5-run{animation-play-state:paused !important}
.b12g5-on .b12g5-run{animation-play-state:running !important}
.b12g5-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4);pointer-events:none;z-index:45;opacity:0;transition:opacity .25s,background-color .2s}
.b12g5-dot.ink{border-color:rgba(20,24,34,.9);background:rgba(20,24,34,.12);box-shadow:0 0 0 6px rgba(20,24,34,.06)}
.b12g5-dot.down{background:rgba(255,255,255,.85);box-shadow:0 0 0 10px rgba(255,255,255,.14),0 4px 14px rgba(0,0,0,.4)}

/* M639 multi-ring orbits */
@keyframes m639-spin{to{transform:rotate(360deg)}}
.m639-ring{position:absolute;border-radius:50%;animation:m639-spin var(--du) linear infinite;animation-direction:var(--dir)}
.m639-chip{position:absolute;width:58px;height:58px;margin:-29px 0 0 -29px;border-radius:18px;display:grid;place-items:center;background:#121625;border:1px solid rgba(255,255,255,.14);box-shadow:0 10px 30px rgba(0,0,0,.45);animation:m639-spin var(--du) linear infinite;animation-direction:var(--cdir)}
.m639-core{animation:m639-pulse 2.4s ease-in-out infinite alternate}
@keyframes m639-pulse{from{box-shadow:0 0 0 0 rgba(124,140,255,.35),0 0 60px rgba(124,140,255,.35)}to{box-shadow:0 0 0 18px rgba(124,140,255,0),0 0 90px rgba(124,140,255,.6)}}

/* M643 dotted map arcs */
.m643-hub{transform-box:fill-box;transform-origin:center;animation:m643-ping 1.6s ease-out infinite}
@keyframes m643-ping{0%{transform:scale(1);opacity:.9}100%{transform:scale(4.5);opacity:0}}

/* M645 conic orb */
.m645-orb{position:relative;border-radius:50%;isolation:isolate;overflow:hidden;-webkit-mask:radial-gradient(circle at 50% 50%,#000 50%,rgba(0,0,0,.55) 60%,transparent 70%);mask:radial-gradient(circle at 50% 50%,#000 50%,rgba(0,0,0,.55) 60%,transparent 70%);animation:m645-breathe 2.6s ease-in-out infinite alternate}
.m645-orb > i{position:absolute;inset:-18%;border-radius:50%;display:block}
.m645-a{background:conic-gradient(from 0deg at 50% 50%,#ff6fb5,#8b5cff,#3fc8ff,#5dffc8,#ffd36e,#ff6fb5);animation:m645-spin 5s linear infinite}
.m645-b{background:conic-gradient(from 90deg at 40% 60%,transparent,#3fc8ff 20%,transparent 40%,#ff6fb5 62%,transparent 84%);mix-blend-mode:screen;filter:blur(14px);animation:m645-spin 3.2s linear infinite reverse}
.m645-c{background:conic-gradient(from 210deg at 62% 38%,transparent,#8b5cff 25%,transparent 50%,#5dffc8 75%,transparent);mix-blend-mode:overlay;filter:blur(18px);animation:m645-spin 7s linear infinite}
.m645-orb > i.m645-d{inset:0;background:radial-gradient(circle at 38% 32%,rgba(255,255,255,.7),transparent 32%),radial-gradient(circle at 50% 50%,transparent 40%,rgba(10,8,30,.35) 62%)}
@keyframes m645-spin{to{transform:rotate(360deg)}}
@keyframes m645-breathe{from{transform:scale(.95)}to{transform:scale(1.05)}}
.m645-bar{animation:m645-caret 1s steps(2) infinite}
@keyframes m645-caret{50%{opacity:0}}

html.is-static .b12g5-glow,html.is-static .b12g5-run,html.is-static .m643-hub{animation:none}
html.is-static {
  .b12g5-glow,.b12g5-run,.m643-hub{animation:none}
}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", g1, g2, style }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string; style?: CSSProperties }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0d16] text-[#eef2ff] ${className}`} style={style}>
      <style href="b12g5-css" precedence="default">
        {CSS}
      </style>
      <div className="b12g5-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/** The CSS glow loop again, ON TOP of full-bleed canvases (screen blend), so those demos never freeze. */
const Sheen = ({ g1, opacity = 0.45 }: { g1?: string; opacity?: number }) => (
  <div className="b12g5-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity, zIndex: 35 } as CSSProperties} aria-hidden />
);

/** The visible fake pointer ring. */
const Dot = ({ r, ink = false }: { r: RefObject<HTMLDivElement | null>; ink?: boolean }) => <div ref={r} className={`b12g5-dot ${ink ? "ink" : ""}`} aria-hidden />;

/** CSS-driven demos: toggles `b12g5-on` on the root while it is on screen (the `.b12g5-run` keyframes run only then). */
function useOn(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const io = new IntersectionObserver(([e]) => el.classList.toggle("b12g5-on", e.isIntersecting), { threshold: 0.1 });
    io.observe(el);
    return () => {
      io.disconnect();
      el.classList.remove("b12g5-on");
    };
  }, [ref]);
}

/** GSAP demos: plays `anim` while the root is on screen, pauses it off screen. */
function usePlayOnScreen(ref: RefObject<HTMLElement | null>, build: (el: HTMLElement) => gsap.core.Animation[] | void) {
  const b = useRef(build);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let anims: gsap.core.Animation[] = [];
    const ctx = gsap.context(() => {
      anims = b.current(el) || [];
      anims.forEach((a) => a.pause());
    }, el);
    const io = new IntersectionObserver(([e]) => anims.forEach((a) => (e.isIntersecting ? a.play() : a.pause())), { threshold: 0.05 });
    io.observe(el);
    return () => {
      io.disconnect();
      ctx.revert();
    };
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
type Init = NonNullable<NonNullable<Parameters<typeof createShader>[2]>["init"]>;

/**
 * Full-bleed fragment shader (OGL via lib/gl, dpr 1). Built only near the viewport; draws only while on screen (lib/gl).
 * The CSS `fallback` background is always underneath; the canvas fades in after its first frame.
 */
function Shader({ frag, fallback, uniforms, onFrame, init }: { frag: string; fallback: string; uniforms?: () => U; onFrame?: (u: U, t: number) => void; init?: Init }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const of = useRef(onFrame);
  of.current = onFrame;
  const un = useRef(uniforms);
  const ini = useRef(init);
  useEffect(() => {
    const c = cv.current;
    if (!c || prefersReducedMotion()) return;
    let dead = false;
    let h: GLHandle | null = null;
    const stop = whenNear(c, async () => {
      if (dead) return;
      h = await createShader(c, frag, { dpr: 1, uniforms: un.current?.(), onFrame: (u, t) => of.current?.(u, t), init: ini.current });
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

/* Our own small GLSL noise kit: hash → value noise → fbm, a 2D rotation. */
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
  for (int i = 0; i < 4; i++) { s += a * vno(p); p = m * p * 2.02 + 0.31; a *= 0.5; }
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

/* ---------- M638 · Nested text rings (variant of M637: several circular text rings, each its own speed and direction) ---------- */
const TRINGS = [
  { r: 360, text: "TANGLE & THREAD · HAND-WOVEN SINCE 1998 · ", size: 25, dur: 26, dir: 1, op: 0.95 },
  { r: 290, text: "SMALL BATCH · NATURAL DYES · SLOW MADE · ", size: 22, dur: 19, dir: -1, op: 0.75 },
  { r: 224, text: "COTTON · LINEN · WOOL · SILK · ", size: 20, dur: 14, dir: 1, op: 0.6 },
  { r: 162, text: "LOOM NO. 7 · ", size: 18, dur: 10, dir: -1, op: 0.5 },
];
function M638() {
  const root = useRef<HTMLDivElement>(null);
  const uid = useId().replace(/:/g, "");
  usePlayOnScreen(root, (el) =>
    Array.from(el.querySelectorAll<SVGGElement>("[data-ring]")).map((g, i) =>
      gsap.to(g, { rotation: 360 * TRINGS[i].dir, svgOrigin: "400 400", duration: TRINGS[i].dur, ease: "none", repeat: -1 }),
    ),
  );
  return (
    <Stage r={root} className="bg-[#0b0a08]" g1="rgba(232,170,96,.5)" g2="rgba(120,140,255,.18)">
      <div className="grid h-full grid-cols-[1fr_auto] items-center gap-[4%] px-[6%]">
        <div className="relative z-40">
          <p className="text-[13px] uppercase tracking-[0.3em] text-[#e8c79c]/80">Tangle &amp; Thread · Studio</p>
          <h3 className="mt-4 text-[clamp(52px,5.8vw,96px)] leading-[0.95] tracking-[-0.02em] text-[#f6ead8]" style={{ fontFamily: F.is }}>
            Let&apos;s make
            <br />
            something slow.
          </h3>
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-2 text-[15px] text-[#f6ead8]/75">
            <span>Throws</span>
            <span>Runners</span>
            <span>Cushions</span>
            <span>Workshops</span>
          </div>
          <p className="mt-8 text-[13px] text-[#f6ead8]/50">Linen throw from ₹ 3,400 · Concept website</p>
        </div>
        <svg viewBox="0 0 800 800" className="h-[92%] max-h-[620px] w-auto" aria-hidden>
          <defs>
            {TRINGS.map((t, i) => (
              <path key={i} id={`${uid}-r${i}`} d={`M ${400 - t.r} 400 a ${t.r} ${t.r} 0 1 1 ${t.r * 2} 0 a ${t.r} ${t.r} 0 1 1 ${-t.r * 2} 0`} />
            ))}
          </defs>
          {TRINGS.map((t, i) => (
            <circle key={i} cx="400" cy="400" r={t.r + t.size * 0.95} fill="none" stroke="rgba(246,234,216,.12)" strokeWidth="1" />
          ))}
          {TRINGS.map((t, i) => {
            const circ = 2 * Math.PI * t.r;
            const reps = Math.max(1, Math.round(circ / (t.text.length * t.size * 0.72)));
            return (
              <g key={i} data-ring>
                <text fill={`rgba(246,234,216,${t.op})`} fontSize={t.size} fontWeight={500} letterSpacing="2" style={{ fontFamily: F.sg }}>
                  <textPath href={`#${uid}-r${i}`} textLength={circ - 4} lengthAdjust="spacing">
                    {t.text.repeat(reps)}
                  </textPath>
                </text>
              </g>
            );
          })}
          <circle cx="400" cy="400" r="96" fill="#e8aa60" />
          <text x="400" y="414" textAnchor="middle" fontSize="44" fill="#1a120a" style={{ fontFamily: F.is }}>
            T&amp;T
          </text>
        </svg>
      </div>
    </Stage>
  );
}

/* ---------- M639 · Multi-ring orbits (variant of M33: three rings of icons, neighbours turning opposite ways, paths drawn) ---------- */
const ICONS: Record<string, ReactNode> = {
  cloud: <path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9.5 4.3 4.3 0 0 0 7 18z" />,
  chat: <path d="M4 5h16v10H9l-5 4z" />,
  card: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
    </>
  ),
  bolt: <path d="M13 3 5 14h6l-1 7 8-11h-6z" />,
  cal: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </>
  ),
  box: <path d="M4 8 12 4l8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8" />,
  mail: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  chart: <path d="M5 19V9M10 19V5M15 19v-7M20 19v-4" />,
  pin: <path d="M12 21s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />,
};
const ORBITS: { R: number; du: string; dir: string; icons: { k: string; a: number; c: string }[] }[] = [
  { R: 19, du: "9s", dir: "normal", icons: [ { k: "bolt", a: 20, c: "#ffd36e" }, { k: "chat", a: 200, c: "#7cf0c4" } ] },
  { R: 31, du: "14s", dir: "reverse", icons: [ { k: "card", a: 60, c: "#8fa3ff" }, { k: "cal", a: 180, c: "#ff8fb1" }, { k: "mail", a: 300, c: "#7fd8ff" } ] },
  { R: 43, du: "20s", dir: "normal", icons: [ { k: "cloud", a: 0, c: "#7fd8ff" }, { k: "box", a: 90, c: "#ffb36b" }, { k: "chart", a: 180, c: "#7cf0c4" }, { k: "pin", a: 270, c: "#ff8fb1" } ] },
];
function M639() {
  const root = useRef<HTMLDivElement>(null);
  useOn(root);
  return (
    <Stage r={root} className="bg-[#070912]" g1="rgba(124,140,255,.5)" g2="rgba(124,240,196,.2)">
      <div className="grid h-full grid-cols-[0.9fr_1.1fr] items-center gap-[3%] px-[6%]">
        <Copy kicker="Relaykit · Integrations" title={<>Plugs into the tools<br />you already use.</>} meta="42 integrations · plans from ₹ 0" font={F.sg} size="clamp(40px,4.3vw,70px)" className="text-white" />
        <div className="relative mx-auto aspect-square h-[92%] max-h-[640px]">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
            {ORBITS.map((o) => (
              <circle key={o.R} cx="50" cy="50" r={o.R} fill="none" stroke="rgba(255,255,255,.16)" strokeWidth=".25" strokeDasharray=".6 1.4" />
            ))}
          </svg>
          {ORBITS.map((o, ri) => (
            <div
              key={ri}
              className="m639-ring b12g5-run"
              style={{ inset: `${50 - o.R}%`, "--du": o.du, "--dir": o.dir } as CSSProperties}
              aria-hidden
            >
              {o.icons.map((ic) => (
                <div
                  key={ic.k}
                  className="m639-chip b12g5-run"
                  style={{
                    left: `${50 + 50 * Math.cos((ic.a * Math.PI) / 180)}%`,
                    top: `${50 + 50 * Math.sin((ic.a * Math.PI) / 180)}%`,
                    "--du": o.du,
                    "--cdir": o.dir === "normal" ? "reverse" : "normal",
                  } as CSSProperties}
                >
                  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke={ic.c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {ICONS[ic.k]}
                  </svg>
                </div>
              ))}
            </div>
          ))}
          <div className="m639-core b12g5-run absolute left-1/2 top-1/2 grid h-[18%] w-[18%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gradient-to-br from-[#8b9bff] to-[#5a3fd6] text-[clamp(20px,1.8vw,30px)] font-[700] text-white" style={{ fontFamily: F.sg }}>
            Rk
          </div>
        </div>
      </div>
    </Stage>
  );
}

/* ---------- M640 · 3D tilted ellipse orbit (variant of M33: items ride a tilted ellipse, scaling and dimming with depth) ---------- */
const ORB_ITEMS = [
  { name: "Ember Mug", price: "₹ 890" },
  { name: "Dune Vase", price: "₹ 2,450" },
  { name: "Tide Bowl", price: "₹ 1,280" },
  { name: "Ash Plate", price: "₹ 760" },
  { name: "Moss Jar", price: "₹ 1,150" },
  { name: "Kiln Cup", price: "₹ 640" },
  { name: "Salt Pitcher", price: "₹ 1,990" },
];
const TILT = (-9 * Math.PI) / 180;
function ellipsePos(theta: number, w: number, h: number) {
  const rx = w * 0.36;
  const ry = Math.min(h * 0.22, rx * 0.32);
  const ex = rx * Math.cos(theta);
  const ey = ry * Math.sin(theta);
  const x = ex * Math.cos(TILT) - ey * Math.sin(TILT);
  const y = ex * Math.sin(TILT) + ey * Math.cos(TILT);
  const d = (Math.sin(theta) + 1) / 2; // 1 = nearest (front, lower part of the ellipse)
  return { x, y, d, s: 0.56 + 0.56 * d, o: 0.32 + 0.68 * d, z: Math.round(d * 100) };
}
function M640() {
  const root = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLDivElement | null)[]>([]);
  const n = ORB_ITEMS.length;
  const place = (t: number, w: number, h: number) => {
    items.current.forEach((el, i) => {
      if (!el) return;
      const p = ellipsePos(t * 0.42 + (i / n) * Math.PI * 2, w, h);
      el.style.transform = `translate(-50%,-50%) translate3d(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px,0) scale(${p.s.toFixed(3)})`;
      el.style.opacity = p.o.toFixed(3);
      el.style.zIndex = String(p.z > 50 ? 60 + p.z : p.z);
    });
  };
  useTicker(root, (t) => {
    const el = root.current;
    if (el) place(t, el.clientWidth, el.clientHeight);
  });
  // static / first paint: positions at t = 0 on a typical 1330 × 630 stage
  const init = Array.from({ length: n }, (_, i) => ellipsePos((i / n) * Math.PI * 2, 1330, 630));
  return (
    <Stage r={root} className="bg-[#0b0908]" g1="rgba(255,170,110,.5)" g2="rgba(140,170,255,.2)">
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="-665 -315 1330 630" preserveAspectRatio="xMidYMid meet" aria-hidden>
        <ellipse cx="0" cy="0" rx={1330 * 0.36} ry={Math.min(630 * 0.22, 1330 * 0.36 * 0.32)} fill="none" stroke="rgba(255,230,210,.18)" strokeDasharray="3 7" transform="rotate(-9)" />
      </svg>
      <div className="absolute inset-0 z-[60] grid place-items-center text-center">
        <Copy kicker="Kilnhouse · Stoneware" title="Fired in orbit." meta="Seven pieces · glazed by hand" font={F.fr} size="clamp(56px,6.4vw,104px)" className="text-[#fbefe4]" />
      </div>
      {ORB_ITEMS.map((it, i) => (
        <div
          key={it.name}
          ref={(el) => {
            items.current[i] = el;
          }}
          className="absolute left-1/2 top-1/2 w-[clamp(150px,13vw,190px)] overflow-hidden rounded-[18px] border border-white/15 bg-[#17120f] shadow-[0_20px_50px_rgba(0,0,0,.5)]"
          style={{
            transform: `translate(-50%,-50%) translate3d(${init[i].x.toFixed(1)}px,${init[i].y.toFixed(1)}px,0) scale(${init[i].s.toFixed(3)})`,
            opacity: init[i].o,
            zIndex: init[i].z > 50 ? 60 + init[i].z : init[i].z,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={scene(i, 600, 600)} alt="" className="aspect-square w-full object-cover" draggable={false} />
          <div className="flex items-baseline justify-between px-3 py-2.5 text-[13px]">
            <span className="text-white/90">{it.name}</span>
            <span className="text-white/60">{it.price}</span>
          </div>
        </div>
      ))}
    </Stage>
  );
}

/* ---------- shared globe GLSL (M641 / M642): orthographic sphere, our own 3D value noise for land, lat/lon dot grid ---------- */
const GLOBE = /* glsl */ `
uniform float uYaw, uTilt, uRad;
uniform vec2 uCen;
float h31(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
float n3(vec3 x) {
  vec3 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1.0, 0.0, 0.0)), f.x), mix(h31(i + vec3(0.0, 1.0, 0.0)), h31(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
             mix(mix(h31(i + vec3(0.0, 0.0, 1.0)), h31(i + vec3(1.0, 0.0, 1.0)), f.x), mix(h31(i + vec3(0.0, 1.0, 1.0)), h31(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);
}
float landAt(vec3 w) {
  float n = 0.62 * n3(w * 1.7 + vec3(3.1, 1.2, 7.4)) + 0.28 * n3(w * 3.6 + vec3(9.0, 2.0, 4.0)) + 0.1 * n3(w * 8.0);
  return step(0.52, n) * step(abs(w.y), 0.93);
}
vec3 toWorld(vec3 v) {
  float c = cos(-uTilt), s = sin(-uTilt);
  v = vec3(v.x, c * v.y - s * v.z, s * v.y + c * v.z);
  c = cos(-uYaw); s = sin(-uYaw);
  return vec3(c * v.x + s * v.z, v.y, -s * v.x + c * v.z);
}
vec3 dirLL(float la, float lo) { return vec3(cos(la) * sin(lo), sin(la), cos(la) * cos(lo)); }
// q: pixel offset from the centre in radii. Returns dot colour (rgb) + inside mask (a); w = world normal.
vec4 globeDots(vec2 q, float Rpx, vec3 landCol, vec3 seaCol, out vec3 w, out float z) {
  float r2 = dot(q, q);
  z = sqrt(max(1.0 - r2, 0.0));
  w = toWorld(vec3(q, z));
  const float D = 0.0628318; // 3.6° rows
  float lat = asin(clamp(w.y, -1.0, 1.0));
  float lon = atan(w.x, w.z);
  float la = floor(lat / D + 0.5) * D;
  float n = max(1.0, floor(6.2831853 * cos(la) / D));
  float st = 6.2831853 / n;
  float lo = floor(lon / st + 0.5) * st;
  vec3 dc = dirLL(la, lo);
  float dist = length(w - dc);
  float aa = 1.4 / (Rpx * max(z, 0.18));
  float dm = 1.0 - smoothstep(D * 0.24 - aa, D * 0.24 + aa, dist);
  float L = landAt(dc);
  vec3 col = mix(seaCol, landCol, L) * dm * (0.35 + 0.65 * z);
  float inside = 1.0 - smoothstep(1.0 - 1.5 / Rpx, 1.0, sqrt(r2));
  return vec4(col, inside);
}
`;
type V3 = [number, number, number];
const dirLL = (latDeg: number, lonDeg: number): V3 => {
  const la = (latDeg * Math.PI) / 180;
  const lo = (lonDeg * Math.PI) / 180;
  return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)];
};
/** World → view (Ry(yaw) then Rx(tilt)); the shader's toWorld is the exact inverse. */
const toView = ([x, y, z]: V3, yaw: number, tilt: number): V3 => {
  let c = Math.cos(yaw);
  let s = Math.sin(yaw);
  const x1 = c * x + s * z;
  const z1 = -s * x + c * z;
  c = Math.cos(tilt);
  s = Math.sin(tilt);
  return [x1, c * y - s * z1, s * y + c * z1];
};

/* ---------- M641 · Dotted globe (slow spin, pulsing markers, drag to rotate with inertia) ---------- */
const GLOBE1 = /* glsl */ `${GLOBE}
void main() {
  float Rpx = uRad * uRes.y;
  vec2 q = (vUv * uRes - uCen * uRes) / Rpx;
  float r = length(q);
  vec3 bg = vec3(0.02, 0.03, 0.06);
  vec3 w; float z;
  vec4 g = globeDots(q, Rpx, vec3(0.55, 0.85, 1.0), vec3(0.09, 0.14, 0.24), w, z);
  vec3 col = bg + vec3(0.05, 0.12, 0.25) * exp(-max(r - 1.0, 0.0) * 9.0) * 0.9 * step(1.0, r);
  vec3 body = vec3(0.025, 0.04, 0.08) + g.rgb;
  body += vec3(0.2, 0.45, 0.9) * pow(1.0 - z, 3.0) * 0.6;
  // markers: four pulsing points
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    vec3 m = i == 0 ? dirLL(0.49, 1.35) : i == 1 ? dirLL(0.9, -0.002) : i == 2 ? dirLL(0.71, -1.29) : dirLL(-0.59, 2.64);
    float d = length(w - m);
    float ph = fract(uTime * 0.55 + fi * 0.27);
    body += vec3(1.0, 0.62, 0.38) * (smoothstep(0.03, 0.012, d) + smoothstep(0.012, 0.0, abs(d - ph * 0.16)) * (1.0 - ph)) * step(0.0, z);
  }
  col = mix(col, body, g.a);
  gl_FragColor = vec4(col, 1.0);
}`;
function M641() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const st = useRef({ yaw: -1.35, vel: 0.3, lx: 0, realAt: -1e9, down: false, px: 0, pt: 0 });
  const CEN: [number, number] = [0.66, 0.5];
  const RAD = 0.44;
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const s = st.current;
    const down = (e: PointerEvent) => {
      s.down = true;
      s.px = e.clientX;
      s.pt = performance.now();
      el.setPointerCapture?.(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      s.realAt = performance.now();
      if (!s.down) return;
      const R = RAD * el.clientHeight;
      const dx = e.clientX - s.px;
      const now = performance.now();
      s.yaw += dx / R;
      s.vel = (dx / R) / Math.max(0.008, (now - s.pt) / 1000);
      s.px = e.clientX;
      s.pt = now;
    };
    const up = () => (s.down = false);
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, []);
  useTicker(root, (t, rawDt) => {
    const el = root.current;
    if (!el) return;
    const s = st.current;
    const dt = Math.min(rawDt, 0.05);
    const w = el.clientWidth;
    const h = el.clientHeight;
    const R = RAD * h;
    const gx = CEN[0] * w;
    const gy = (1 - CEN[1]) * h;
    const live = performance.now() - s.realAt < 2000;
    let pressed = false;
    if (!live) {
      // scripted drag: press on the left of the globe, sweep right (spinning it faster), release, glide back underneath
      const c = t % 4.2;
      let x: number;
      let y: number;
      if (c < 1.5) {
        const k = c / 1.5;
        const e = k * k * (3 - 2 * k);
        x = gx - R * 0.55 + e * R * 1.1;
        y = gy - R * 0.12 * Math.sin(k * Math.PI);
        pressed = c > 0.12 && c < 1.38;
      } else {
        const k = (c - 1.5) / 2.7;
        x = gx + R * 0.55 - k * R * 1.1;
        y = gy + Math.sin(k * Math.PI) * R * 0.45;
      }
      if (pressed && dt > 0) {
        const d = (x - s.lx) / R;
        s.yaw += d;
        s.vel = d / dt;
      }
      s.lx = x;
      if (dot.current) {
        dot.current.style.opacity = "1";
        dot.current.style.transform = `translate3d(${x}px,${y}px,0)`;
        dot.current.classList.toggle("down", pressed);
      }
    } else if (dot.current) dot.current.style.opacity = "0";
    if (!pressed && !s.down) {
      s.vel += (0.3 - s.vel) * Math.min(1, dt * 1.6);
      s.yaw += s.vel * dt;
    }
  });
  return (
    <Stage r={root} className="cursor-grab bg-[#05070d]" g1="rgba(90,160,255,.5)" g2="rgba(255,150,100,.18)">
      <Shader
        frag={GLOBE1}
        uniforms={() => ({ uYaw: { value: -1.35 }, uTilt: { value: 0.32 }, uRad: { value: RAD }, uCen: { value: CEN } })}
        onFrame={(u) => (u.uYaw.value = st.current.yaw)}
        fallback="radial-gradient(circle at 66% 50%,#0c1a33 0 27%,rgba(40,90,170,.35) 28%,transparent 34%),radial-gradient(rgba(140,200,255,.35) 1.2px,transparent 1.6px) 0 0/14px 14px,#05070d"
      />
      <Sheen g1="rgba(110,170,255,.5)" />
      <div className="absolute left-[6%] top-1/2 z-40" style={{ transform: "translateY(-50%)" }}>
        <Copy kicker="Northwind Freight · Network" title={<>Every port,<br />one spin away.</>} meta="Door-to-door from ₹ 1,200 / kg · drag the globe" font={F.sg} size="clamp(44px,4.8vw,78px)" className="text-white" />
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ---------- M642 · Globe with arcs and pulses (variant of M641: arcs launch between points, pulses ride them, markers ring) ---------- */
const GLOBE2 = /* glsl */ `${GLOBE}
void main() {
  float Rpx = uRad * uRes.y;
  vec2 q = (vUv * uRes - uCen * uRes) / Rpx;
  float r = length(q);
  vec3 w; float z;
  vec4 g = globeDots(q, Rpx, vec3(0.62, 0.7, 1.0), vec3(0.08, 0.09, 0.2), w, z);
  vec3 col = vec3(0.02, 0.02, 0.05) + vec3(0.25, 0.18, 0.6) * exp(-max(r - 1.0, 0.0) * 7.0) * 0.55 * step(1.0, r);
  vec3 body = vec3(0.03, 0.03, 0.08) + g.rgb + vec3(0.35, 0.3, 0.95) * pow(1.0 - z, 3.0) * 0.55;
  gl_FragColor = vec4(mix(col, body, g.a), 1.0);
}`;
const CITIES: [number, number][] = [
  [28.6, 77.2], [51.5, -0.1], [40.7, -74], [35.7, 139.7], [-33.9, 151.2], [1.35, 103.8], [25.2, 55.3], [-23.5, -46.6], [-33.9, 18.4], [55.7, 37.6],
];
const ARCS: { a: number; b: number; c: string }[] = [
  { a: 0, b: 1, c: "#ff8a6a" }, { a: 0, b: 5, c: "#5fe0ff" }, { a: 6, b: 8, c: "#ffd36e" }, { a: 0, b: 3, c: "#b58cff" },
  { a: 5, b: 4, c: "#5fe0ff" }, { a: 1, b: 2, c: "#ff8a6a" }, { a: 9, b: 6, c: "#7cf0c4" }, { a: 0, b: 9, c: "#ffd36e" },
];
function M642() {
  const ov = useRef<HTMLCanvasElement>(null);
  const CEN: [number, number] = [0.66, 0.46];
  const RAD = 0.5;
  const TILT_G = 0.38;
  const draw = (u: U, t: number) => {
    const yaw = -1.25 + Math.sin(t * 0.11) * 0.9 + t * 0.06;
    u.uYaw.value = yaw;
    const cv = ov.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const W = cv.clientWidth;
    const H = cv.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (cv.width !== Math.round(W * dpr)) {
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const R = RAD * H;
    const cx = CEN[0] * W;
    const cy = (1 - CEN[1]) * H;
    const proj = (p: V3) => {
      const v = toView(p, yaw, TILT_G);
      return { x: cx + v[0] * R, y: cy - v[1] * R, vis: v[2] > 0 || v[0] * v[0] + v[1] * v[1] > 1, z: v[2] };
    };
    // markers
    CITIES.forEach(([la, lo]) => {
      const p = proj(dirLL(la, lo));
      if (p.z <= 0) return;
      ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * p.z})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.6, 0, Math.PI * 2);
      ctx.fill();
    });
    const LIFE = 2.6;
    const GAP = 0.6;
    const CYCLE = ARCS.length * GAP;
    ARCS.forEach((arc, i) => {
      const age = (((t - i * GAP) % CYCLE) + CYCLE) % CYCLE;
      if (age > LIFE + 0.9) return;
      const A = dirLL(...CITIES[arc.a]);
      const B = dirLL(...CITIES[arc.b]);
      const om = Math.acos(Math.max(-1, Math.min(1, A[0] * B[0] + A[1] * B[1] + A[2] * B[2])));
      const lift = 0.1 + 0.32 * (om / Math.PI);
      const at = (s: number): V3 => {
        const so = Math.sin(om) || 1;
        const ka = Math.sin((1 - s) * om) / so;
        const kb = Math.sin(s * om) / so;
        const k = 1 + lift * Math.sin(Math.PI * s);
        return [(ka * A[0] + kb * B[0]) * k, (ka * A[1] + kb * B[1]) * k, (ka * A[2] + kb * B[2]) * k];
      };
      const head = Math.min(1, age / (LIFE * 0.5));
      const tail = Math.max(0, (age - LIFE * 0.5) / (LIFE * 0.5));
      const STEPS = 48;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = arc.c;
      let prev: ReturnType<typeof proj> | null = null;
      for (let k = 0; k <= STEPS; k++) {
        const s = tail + ((head - tail) * k) / STEPS;
        const p = proj(at(s));
        if (prev && prev.vis && p.vis) {
          ctx.globalAlpha = 0.25 + 0.75 * (k / STEPS);
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
        prev = p;
      }
      ctx.globalAlpha = 1;
      // the pulse riding the head
      if (head < 1 && age < LIFE * 0.5) {
        const p = proj(at(head));
        if (p.vis) {
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = arc.c;
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
      // rings: one at launch, one at arrival
      const ring = (city: number, ra: number) => {
        if (ra < 0 || ra > 0.9) return;
        const p = proj(dirLL(...CITIES[city]));
        if (p.z <= 0) return;
        const k = ra / 0.9;
        ctx.strokeStyle = arc.c;
        ctx.globalAlpha = 1 - k;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, 4 + 22 * k, (4 + 22 * k) * Math.max(0.3, p.z), 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      };
      ring(arc.a, age);
      ring(arc.b, age - LIFE * 0.5);
    });
  };
  return (
    <Stage className="bg-[#04040a]" g1="rgba(140,110,255,.5)" g2="rgba(95,224,255,.2)">
      <Shader
        frag={GLOBE2}
        uniforms={() => ({ uYaw: { value: -1.25 }, uTilt: { value: TILT_G }, uRad: { value: RAD }, uCen: { value: CEN } })}
        onFrame={draw}
        fallback="radial-gradient(circle at 66% 54%,#120f2c 0 31%,rgba(110,90,240,.35) 32%,transparent 38%),radial-gradient(rgba(170,170,255,.3) 1.2px,transparent 1.6px) 0 0/14px 14px,#04040a"
      />
      <canvas ref={ov} className="pointer-events-none absolute inset-0 z-30 h-full w-full" aria-hidden />
      <Sheen g1="rgba(150,120,255,.5)" />
      <div className="absolute left-[6%] top-1/2 z-40" style={{ transform: "translateY(-50%)" }}>
        <Copy kicker="Courierline · Live routes" title={<>Shipped while<br />you slept.</>} meta="2,140 parcels in transit · express from ₹ 450" font={F.sy} size="clamp(42px,4.6vw,76px)" className="text-white" />
      </div>
    </Stage>
  );
}

/* ---------- M643 · Dotted map arcs (variant of M641 flattened: arcs draw city to city one after another, endpoints ping) ---------- */
const LAND: [number, number][][] = [
  [[-165, 65], [-140, 70], [-95, 72], [-75, 62], [-60, 50], [-80, 25], [-97, 18], [-105, 22], [-118, 33], [-125, 48], [-150, 58]],
  [[-55, 60], [-22, 70], [-25, 82], [-60, 81], [-72, 77]],
  [[-80, 10], [-60, 8], [-35, -7], [-40, -22], [-55, -35], [-70, -55], [-75, -40], [-72, -15], [-80, -3]],
  [[-10, 36], [-9, 44], [0, 50], [5, 58], [20, 70], [30, 70], [40, 60], [40, 45], [28, 40], [15, 38]],
  [[-17, 21], [-5, 36], [10, 37], [33, 31], [43, 12], [51, 11], [40, -15], [32, -30], [20, -35], [12, -15], [8, 4], [-8, 5]],
  [[40, 45], [40, 60], [60, 70], [100, 77], [140, 72], [170, 66], [160, 58], [140, 48], [122, 40], [121, 30], [108, 20], [100, 10], [92, 22], [80, 8], [73, 20], [60, 25], [50, 30]],
  [[114, -22], [130, -12], [142, -11], [153, -27], [146, -39], [135, -35], [115, -34]],
];
const mx = (lon: number) => ((lon + 180) / 360) * 1000;
const my = (lat: number) => ((90 - lat) / 180) * 500;
const HUBS: [number, number][] = [
  [77.2, 28.6], [-0.1, 51.5], [-74, 40.7], [139.7, 35.7], [151.2, -33.9], [-46.6, -23.5], [18.4, -33.9], [55.3, 25.2], [103.8, 1.35], [-122.4, 37.8],
];
const ROUTES: [number, number][] = [[0, 1], [0, 7], [0, 8], [8, 4], [1, 2], [2, 9], [9, 3], [7, 6], [2, 5]];
function M643() {
  const root = useRef<HTMLDivElement>(null);
  const uid = useId().replace(/:/g, "");
  const routes = useMemo(
    () =>
      ROUTES.map(([a, b]) => {
        const [x1, y1] = [mx(HUBS[a][0]), my(HUBS[a][1])];
        const [x2, y2] = [mx(HUBS[b][0]), my(HUBS[b][1])];
        const d = Math.hypot(x2 - x1, y2 - y1);
        return { d: `M${x1.toFixed(1)} ${y1.toFixed(1)}Q${((x1 + x2) / 2).toFixed(1)} ${((y1 + y2) / 2 - d * 0.32).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`, x2, y2 };
      }),
    [],
  );
  usePlayOnScreen(root, (el) => {
    const arcs = el.querySelectorAll<SVGPathElement>("[data-arc]");
    const rings = el.querySelectorAll<SVGCircleElement>("[data-ring]");
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(arcs, { drawSVG: "0% 0%", opacity: 1 });
    tl.set(rings, { opacity: 0 });
    arcs.forEach((a, i) => {
      const at = i * 0.5;
      tl.to(a, { drawSVG: "0% 100%", duration: 1.1, ease: "power2.inOut" }, at);
      tl.fromTo(rings[i], { scale: 0.4, opacity: 1 }, { scale: 4.5, opacity: 0, duration: 0.9, ease: "power1.out", transformOrigin: "50% 50%" }, at + 1.0);
    });
    tl.to(arcs, { drawSVG: "100% 100%", duration: 0.9, ease: "power1.in", stagger: 0.06 }, ">-0.2");
    return [tl];
  });
  return (
    <Stage r={root} className="bg-[#06080f]" g1="rgba(255,140,110,.5)" g2="rgba(95,200,255,.2)">
      <svg viewBox="0 30 1000 420" className="absolute inset-x-[3%] bottom-[3%] h-[78%] w-[94%]" preserveAspectRatio="xMidYMid meet" aria-hidden>
        <defs>
          <pattern id={`${uid}-dots`} width="9" height="9" patternUnits="userSpaceOnUse">
            <circle cx="4.5" cy="4.5" r="1.7" fill="rgba(220,230,255,.42)" />
          </pattern>
          <mask id={`${uid}-land`}>
            <rect x="0" y="0" width="1000" height="500" fill="black" />
            {LAND.map((poly, i) => (
              <polygon key={i} points={poly.map(([lo, la]) => `${mx(lo).toFixed(1)},${my(la).toFixed(1)}`).join(" ")} fill="white" stroke="white" strokeWidth="10" strokeLinejoin="round" />
            ))}
          </mask>
          <linearGradient id={`${uid}-g`} x1="0" x2="1">
            <stop offset="0" stopColor="#ff8a6a" stopOpacity=".2" />
            <stop offset=".5" stopColor="#ff8a6a" />
            <stop offset="1" stopColor="#ffd36e" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="1000" height="500" fill={`url(#${uid}-dots)`} mask={`url(#${uid}-land)`} />
        {routes.map((r, i) => (
          <path key={i} data-arc d={r.d} fill="none" stroke={`url(#${uid}-g)`} strokeWidth="2.2" strokeLinecap="round" />
        ))}
        {routes.map((r, i) => (
          <circle key={i} data-ring cx={r.x2} cy={r.y2} r="5" fill="none" stroke="#ffd36e" strokeWidth="1.6" opacity="0" />
        ))}
        {HUBS.map(([lo, la], i) => (
          <g key={i}>
            <circle cx={mx(lo)} cy={my(la)} r="4" fill="#ff8a6a" className={i === 0 ? "m643-hub" : undefined} />
            <circle cx={mx(lo)} cy={my(la)} r="3.2" fill="#fff" />
          </g>
        ))}
      </svg>
      <div className="absolute left-[6%] top-[8%] z-40 flex w-[88%] items-end justify-between gap-8">
        <Copy kicker="Saffron Post · Worldwide" title="From our kitchen to 64 countries." font={F.fr} size="clamp(36px,3.6vw,60px)" className="max-w-[16ch] text-white" />
        <p className="pointer-events-none pb-2 text-right text-[15px] text-white/70">
          Spice box of 12
          <br />
          <b className="text-[22px] text-white">₹ 1,690</b> · ships in 48 h
        </p>
      </div>
    </Stage>
  );
}

/* ---------- M644 · Swirling orb (pointer distorts the edge; it switches between idle and active on its own) ---------- */
const ORB = /* glsl */ `${NOISE}
uniform vec2 uPtr, uCen;
uniform float uHover, uActive;
void main() {
  vec2 p = (vUv * uRes - 0.5 * uRes) / uRes.y;
  vec2 q = p - uCen;
  float t = uTime;
  vec2 dp = q - uPtr;
  float near = exp(-dot(dp, dp) * 9.0) * uHover;
  q += dp * near * 0.4;
  float r = length(q);
  float a = atan(q.y, q.x);
  vec2 cs = vec2(cos(a), sin(a));
  float spd = 0.55 + 1.0 * uActive;
  float R = 0.25 + 0.03 * uActive + 0.008 * sin(t * 1.7);
  float wob = (vno(cs * 1.7 + vec2(t * 0.45 * spd, -t * 0.3)) - 0.5) * (0.06 + 0.12 * uHover + 0.06 * uActive);
  float edge = R * (1.0 + wob);
  float inside = 1.0 - smoothstep(edge - 0.004, edge + 0.004, r);
  float k = 1.0 - clamp(r / edge, 0.0, 1.0);
  vec2 sq = rot(k * k * 4.5 * (1.0 + uActive) + t * 0.45 * spd) * q / edge;
  float n1 = fbm(sq * 2.2 + vec2(t * 0.16 * spd, 0.0));
  float n2 = fbm(sq * 3.1 - vec2(0.0, t * 0.22 * spd) + 4.0);
  vec3 c1 = vec3(0.45, 0.3, 1.0), c2 = vec3(0.1, 0.85, 1.0), c3 = vec3(1.0, 0.36, 0.7);
  vec3 col = mix(c1, c2, smoothstep(0.32, 0.68, n1));
  col = mix(col, c3, smoothstep(0.45, 0.75, n2) * 0.8);
  col *= 0.5 + 0.6 * k + 0.35 * uActive;
  col += smoothstep(0.62, 1.0, r / edge) * vec3(0.6, 0.7, 1.0) * 0.45;
  float halo = exp(-max(r - edge, 0.0) * 12.0) * (0.3 + 0.35 * uActive);
  vec3 bg = vec3(0.02, 0.022, 0.045) + halo * mix(c1, c2, 0.5 + 0.5 * sin(a + t));
  gl_FragColor = vec4(mix(bg, col, inside), 1.0);
}`;
function M644() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const s = useRef({ x: 0, y: 0, hover: 0, active: 0, on: false, flip: 0 });
  const CEN: [number, number] = [0.32, 0];
  usePointer(
    root,
    dot,
    (t, w, h) => {
      // weave around and across the orb (orb centre ≈ 50% + 0.32 h right of the middle)
      const ox = w / 2 + 0.32 * h;
      return [ox + h * 0.42 * Math.sin(t * 0.8), h * (0.5 + 0.28 * Math.sin(t * 1.3 + 0.6))];
    },
    (x, y, dt, t) => {
      const el = root.current;
      if (!el) return;
      const w = el.clientWidth;
      const h = el.clientHeight || 1;
      const px = (x - w / 2) / h - CEN[0];
      const py = (h / 2 - y) / h - CEN[1];
      const S = s.current;
      S.x = px;
      S.y = py;
      const target = Math.hypot(px, py) < 0.42 ? 1 : 0;
      S.hover += (target - S.hover) * Math.min(1, dt * 5);
      // idle ↔ active on a timer (click also toggles)
      if (t - S.flip > 2.6) {
        S.flip = t;
        S.on = !S.on;
        if (label.current) label.current.textContent = S.on ? "Listening…" : "Idle";
      }
      S.active += ((S.on ? 1 : 0) - S.active) * Math.min(1, dt * 3);
    },
  );
  return (
    <Stage r={root} className="bg-[#05060c]" g1="rgba(130,110,255,.5)" g2="rgba(60,220,255,.22)">
      <div
        className="absolute inset-0"
        onClick={() => {
          const S = s.current;
          S.on = !S.on;
          S.flip = gsap.ticker.time;
          if (label.current) label.current.textContent = S.on ? "Listening…" : "Idle";
        }}
      >
        <Shader
          frag={ORB}
          uniforms={() => ({ uPtr: { value: [9, 9] }, uCen: { value: CEN }, uHover: { value: 0 }, uActive: { value: 0 } })}
          onFrame={(u) => {
            const S = s.current;
            u.uPtr.value = [S.x, S.y];
            u.uHover.value = S.hover;
            u.uActive.value = S.active;
          }}
          fallback="radial-gradient(circle at calc(50% + 20%) 50%,#7a5cff 0,#2bc7f0 14%,rgba(120,90,255,.3) 19%,transparent 26%),#05060c"
        />
      </div>
      <Sheen g1="rgba(140,120,255,.5)" />
      <div className="absolute left-[6%] top-1/2 z-40" style={{ transform: "translateY(-50%)" }}>
        <Copy kicker="Hummingbird · Home assistant" title={<>Talk to it.<br />It listens.</>} meta="Smart speaker · ₹ 6,499" font={F.sg} size="clamp(46px,5vw,82px)" className="text-white" />
        <span className="pointer-events-none mt-8 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-[14px] text-white/85">
          <i className="h-2 w-2 rounded-full bg-[#5fe0ff]" />
          <span ref={label}>Idle</span>
        </span>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ---------- M645 · Conic orb (variant of M644 in pure CSS: stacked conic gradients rotate against each other) ---------- */
function ConicOrb({ size }: { size: string }) {
  return (
    <div className="m645-orb b12g5-run" style={{ width: size, height: size }} aria-hidden>
      <i className="m645-a b12g5-run" />
      <i className="m645-b b12g5-run" />
      <i className="m645-c b12g5-run" />
      <i className="m645-d" />
    </div>
  );
}
function M645() {
  const root = useRef<HTMLDivElement>(null);
  useOn(root);
  return (
    <Stage r={root} className="bg-[#07060d]" g1="rgba(255,111,181,.5)" g2="rgba(63,200,255,.25)">
      <div className="flex h-full flex-col items-center justify-center gap-[4%] px-[6%] text-center">
        <ConicOrb size="min(40vh,330px)" />
        <div className="relative z-40">
          <p className="text-[13px] uppercase tracking-[0.3em] text-white/65">Opaline · Personal assistant</p>
          <h3 className="mt-3 text-[clamp(40px,4.4vw,72px)] font-[500] leading-[0.95] tracking-[-0.02em]" style={{ fontFamily: F.is }}>
            Ask me anything.
          </h3>
        </div>
        <div className="relative z-40 flex w-[min(560px,80%)] items-center gap-3 rounded-full border border-white/15 bg-white/[0.06] py-2 pl-2 pr-6">
          <ConicOrb size="40px" />
          <span className="text-[15px] text-white/60">Plan a weekend in the hills</span>
          <i className="m645-bar b12g5-run h-5 w-[2px] bg-white/80" />
          <span className="ml-auto text-[13px] text-white/45">Pro · ₹ 399 / mo</span>
        </div>
      </div>
    </Stage>
  );
}

/* ---------- M646 · Marbled orb (variant of M644: a lit sphere whose marbling swirls on a seamless 12 s loop) ---------- */
const MARBLE = /* glsl */ `${NOISE}
uniform vec2 uCen;
uniform float uRad;
void main() {
  vec2 px = vUv * uRes;
  vec2 p = (px - uCen * uRes) / (uRad * uRes.y);
  float r2 = dot(p, p);
  float t = uTime;
  vec3 bg = mix(vec3(0.06, 0.05, 0.06), vec3(0.13, 0.1, 0.1), vUv.y);
  // soft floor shadow under the sphere
  vec2 sp = (p - vec2(0.0, -1.08)) * vec2(1.0, 5.5);
  bg *= 1.0 - 0.55 * exp(-dot(sp, sp) * 1.4);
  if (r2 > 1.0) {
    float rim = exp(-(sqrt(r2) - 1.0) * 18.0) * 0.18;
    gl_FragColor = vec4(bg + vec3(1.0, 0.75, 0.6) * rim, 1.0);
    return;
  }
  vec3 n = vec3(p, sqrt(1.0 - r2));
  float a = t * 6.2831853 / 12.0;
  vec2 lp = vec2(cos(a), sin(a)) * 0.7;
  vec2 s = n.xy / (0.55 + n.z * 0.45) * 1.2;
  vec2 w1 = vec2(fbm(s * 1.4 + lp), fbm(s * 1.4 + lp.yx + 4.2));
  float m = fbm(s * 1.1 + w1 * 2.0 + lp * 0.6);
  float veins = pow(0.5 + 0.5 * sin(m * 16.0 + w1.x * 5.0), 7.0);
  vec3 deep = vec3(0.1, 0.12, 0.3), mid = vec3(0.86, 0.42, 0.36), light = vec3(1.0, 0.92, 0.82);
  vec3 col = mix(deep, mid, smoothstep(0.3, 0.75, m));
  col = mix(col, light, veins * 0.85);
  vec3 L = normalize(vec3(-0.5, 0.6, 0.65));
  float diff = max(dot(n, L), 0.0);
  float spec = pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), 48.0);
  float fres = pow(1.0 - n.z, 3.0);
  col = col * (0.22 + 0.9 * diff) + spec * 0.85 + fres * vec3(1.0, 0.7, 0.55) * 0.45;
  float edge = smoothstep(1.0, 0.985, sqrt(r2));
  gl_FragColor = vec4(mix(bg, col, edge), 1.0);
}`;
function M646() {
  return (
    <Stage className="bg-[#0d0a0a]" g1="rgba(240,140,110,.5)" g2="rgba(110,120,255,.2)">
      <Shader
        frag={MARBLE}
        uniforms={() => ({ uCen: { value: [0.64, 0.55] }, uRad: { value: 0.32 } })}
        fallback="radial-gradient(circle at 61% 40%,#fff1e2 0,#de6b5c 8%,#3a2e62 19%,#181232 22%,transparent 22.5%),linear-gradient(#211919,#0f0c0d)"
      />
      <Sheen g1="rgba(255,170,130,.5)" opacity={0.3} />
      <div className="absolute left-[6%] top-1/2 z-40" style={{ transform: "translateY(-50%)" }}>
        <Copy kicker="Marlowe Glassworks · Object 03" title={<>Weather,<br />held in glass.</>} meta="Hand-blown paperweight · ₹ 4,800" font={F.fr} size="clamp(48px,5.4vw,90px)" className="text-[#fbeee4]" />
      </div>
    </Stage>
  );
}

/* ---------- M647 · Cursor-stirred dye fluid (variant of M67: a real fluid sim — advection, vorticity, pressure solve) ---------- */
const SIM_V = /* glsl */ `attribute vec2 uv; attribute vec2 position; varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }`;
const SIM_H = /* glsl */ `precision highp float; varying vec2 vUv; uniform vec2 uTexel;
vec4 at(sampler2D s, float dx, float dy) { return texture2D(s, vUv + vec2(dx, dy) * uTexel); }
`;
const SIM = {
  advect: `${SIM_H} uniform sampler2D uVel, uSrc; uniform float uDt, uDiss;
void main(){ vec2 c = vUv - uDt * texture2D(uVel, vUv).xy * uTexel; gl_FragColor = texture2D(uSrc, c) / (1.0 + uDiss * uDt); }`,
  splat: `${SIM_H} uniform sampler2D uTarget; uniform vec2 uPoint; uniform vec3 uColor; uniform float uRadius, uAspect;
void main(){ vec2 p = vUv - uPoint; p.x *= uAspect; vec3 s = exp(-dot(p, p) / uRadius) * uColor; gl_FragColor = vec4(texture2D(uTarget, vUv).xyz + s, 1.0); }`,
  curl: `${SIM_H} uniform sampler2D uVel;
void main(){ float L = at(uVel, -1.0, 0.0).y, R = at(uVel, 1.0, 0.0).y, T = at(uVel, 0.0, 1.0).x, B = at(uVel, 0.0, -1.0).x;
  gl_FragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0); }`,
  vort: `${SIM_H} uniform sampler2D uVel, uCurl; uniform float uK, uDt;
void main(){ float L = at(uCurl, -1.0, 0.0).x, R = at(uCurl, 1.0, 0.0).x, T = at(uCurl, 0.0, 1.0).x, B = at(uCurl, 0.0, -1.0).x, C = texture2D(uCurl, vUv).x;
  vec2 f = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L)); f /= length(f) + 1e-4; f *= uK * C; f.y *= -1.0;
  vec2 v = texture2D(uVel, vUv).xy + f * uDt; gl_FragColor = vec4(clamp(v, -1000.0, 1000.0), 0.0, 1.0); }`,
  div: `${SIM_H} uniform sampler2D uVel;
void main(){ float L = at(uVel, -1.0, 0.0).x, R = at(uVel, 1.0, 0.0).x, T = at(uVel, 0.0, 1.0).y, B = at(uVel, 0.0, -1.0).y;
  gl_FragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0); }`,
  press: `${SIM_H} uniform sampler2D uP, uDiv;
void main(){ float L = at(uP, -1.0, 0.0).x, R = at(uP, 1.0, 0.0).x, T = at(uP, 0.0, 1.0).x, B = at(uP, 0.0, -1.0).x;
  gl_FragColor = vec4((L + R + T + B - texture2D(uDiv, vUv).x) * 0.25, 0.0, 0.0, 1.0); }`,
  grad: `${SIM_H} uniform sampler2D uP, uVel;
void main(){ float L = at(uP, -1.0, 0.0).x, R = at(uP, 1.0, 0.0).x, T = at(uP, 0.0, 1.0).x, B = at(uP, 0.0, -1.0).x;
  vec2 v = texture2D(uVel, vUv).xy - 0.5 * vec2(R - L, T - B); gl_FragColor = vec4(v, 0.0, 1.0); }`,
};
const DYE_SHOW = /* glsl */ `${NOISE}
uniform float uSim;
void main() {
  vec3 bg = vec3(0.012, 0.016, 0.035);
  vec3 d;
  if (uSim > 0.5) {
    d = texture2D(uTex0, vUv).rgb;
  } else {
    // no float render targets: a procedural swirl so the stage still flows
    vec2 p = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
    vec2 q = p + 0.5 * vec2(fbm(p * 2.0 + uTime * 0.1), fbm(p * 2.0 - uTime * 0.12 + 3.0));
    float n = fbm(q * 2.5);
    d = vec3(0.9, 0.3, 0.6) * smoothstep(0.45, 0.8, n) + vec3(0.2, 0.6, 1.0) * smoothstep(0.5, 0.85, 1.0 - n);
  }
  vec3 col = bg + (1.0 - exp(-d * 1.5));
  gl_FragColor = vec4(col, 1.0);
}`;
const hue = (h: number): V3 => {
  const f = (n: number) => {
    const k = (n + h * 6) % 6;
    return 1 - Math.max(0, Math.min(1, Math.min(k, 4 - k)));
  };
  return [f(5), f(3), f(1)];
};
function M647() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const ptr = useRef({ x: 0.5, y: 0.5, fresh: false });
  usePointer(
    root,
    dot,
    (t, w, h) => [w * (0.5 + 0.36 * Math.sin(t * 0.85)), h * (0.5 + 0.3 * Math.sin(t * 1.7 + 0.5))],
    (x, y) => {
      const el = root.current;
      if (!el) return;
      ptr.current = { x: x / (el.clientWidth || 1), y: 1 - y / (el.clientHeight || 1), fresh: true };
    },
  );
  const init: Init = ({ ogl, gl, uniforms }) => {
    if (typeof WebGL2RenderingContext === "undefined" || !(gl instanceof WebGL2RenderingContext) || !gl.getExtension("EXT_color_buffer_float")) return;
    const g2 = gl as WebGL2RenderingContext;
    type OGLGL = ConstructorParameters<typeof ogl.Program>[0];
    const ogl_gl = gl as unknown as OGLGL;
    const renderer = (gl as unknown as { renderer: InstanceType<typeof ogl.Renderer> }).renderer;
    const box = (gl.canvas as HTMLCanvasElement).parentElement?.getBoundingClientRect();
    const asp = box && box.height > 0 ? box.width / box.height : 2;
    const sh = 96;
    const sw = Math.round(sh * asp);
    const dh = 300;
    const dw = Math.round(dh * asp);
    const rt = (w: number, h: number) =>
      new ogl.RenderTarget(ogl_gl, { width: w, height: h, type: g2.HALF_FLOAT, format: g2.RGBA, internalFormat: g2.RGBA16F, depth: false, minFilter: g2.LINEAR, magFilter: g2.LINEAR, wrapS: g2.CLAMP_TO_EDGE, wrapT: g2.CLAMP_TO_EDGE });
    const pair = (w: number, h: number) => {
      const p = { read: rt(w, h), write: rt(w, h), swap: () => ([p.read, p.write] = [p.write, p.read]) };
      return p;
    };
    const vel = pair(sw, sh);
    const dye = pair(dw, dh);
    const prs = pair(sw, sh);
    const curl = rt(sw, sh);
    const dv = rt(sw, sh);
    const geo = new ogl.Triangle(ogl_gl);
    const texel = [1 / sw, 1 / sh];
    const pass = (frag: string, extra: U) => {
      const program = new ogl.Program(ogl_gl, { vertex: SIM_V, fragment: frag, uniforms: { uTexel: { value: texel }, ...extra }, depthTest: false, depthWrite: false });
      return new ogl.Mesh(ogl_gl, { geometry: geo, program });
    };
    const advect = pass(SIM.advect, { uVel: { value: null }, uSrc: { value: null }, uDt: { value: 0 }, uDiss: { value: 0 } });
    const splat = pass(SIM.splat, { uTarget: { value: null }, uPoint: { value: [0, 0] }, uColor: { value: [0, 0, 0] }, uRadius: { value: 0.0025 }, uAspect: { value: asp } });
    const curlP = pass(SIM.curl, { uVel: { value: null } });
    const vort = pass(SIM.vort, { uVel: { value: null }, uCurl: { value: null }, uK: { value: 26 }, uDt: { value: 0 } });
    const divP = pass(SIM.div, { uVel: { value: null } });
    const press = pass(SIM.press, { uP: { value: null }, uDiv: { value: null } });
    const grad = pass(SIM.grad, { uP: { value: null }, uVel: { value: null } });
    const run = (m: InstanceType<typeof ogl.Mesh>, set: Record<string, unknown>, target: InstanceType<typeof ogl.RenderTarget>) => {
      Object.entries(set).forEach(([k, v]) => (m.program.uniforms[k].value = v));
      renderer.render({ scene: m, target });
    };
    uniforms.uSim.value = 1;
    let last = -1;
    let lp: [number, number] | null = null;
    let auto = 0;
    return (t: number) => {
      const dt = last < 0 ? 0.016 : Math.min(1 / 30, Math.max(0.001, t - last));
      last = t;
      // vorticity confinement keeps the swirls alive
      run(curlP, { uVel: vel.read.texture }, curl);
      run(vort, { uVel: vel.read.texture, uCurl: curl.texture, uDt: dt }, vel.write);
      vel.swap();
      // pointer splats: velocity = pointer motion, dye = a hue that drifts with time
      const p = ptr.current;
      if (lp && p.fresh) {
        const dx = p.x - lp[0];
        const dy = p.y - lp[1];
        if (Math.abs(dx) + Math.abs(dy) > 0.0004) {
          run(splat, { uTarget: vel.read.texture, uPoint: [p.x, p.y], uColor: [(dx / dt) * sw * 1.4, (dy / dt) * sh * 1.4, 0], uRadius: 0.0022 }, vel.write);
          vel.swap();
          const c = hue((t * 0.08) % 1);
          run(splat, { uTarget: dye.read.texture, uPoint: [p.x, p.y], uColor: [c[0] * 0.2, c[1] * 0.2, c[2] * 0.2], uRadius: 0.0022 }, dye.write);
          dye.swap();
        }
      }
      if (p.fresh) lp = [p.x, p.y];
      // a soft extra puff every 1.4 s so the tank never runs empty
      if (t - auto > 1.4) {
        auto = t;
        const a = t * 1.7;
        const pt: [number, number] = [0.5 + 0.38 * Math.cos(a), 0.5 + 0.34 * Math.sin(a * 1.3)];
        const c = hue((t * 0.08 + 0.5) % 1);
        run(splat, { uTarget: vel.read.texture, uPoint: pt, uColor: [-Math.sin(a) * 220, Math.cos(a) * 160, 0], uRadius: 0.004 }, vel.write);
        vel.swap();
        run(splat, { uTarget: dye.read.texture, uPoint: pt, uColor: [c[0] * 0.6, c[1] * 0.6, c[2] * 0.6], uRadius: 0.004 }, dye.write);
        dye.swap();
      }
      // projection: divergence → Jacobi pressure → subtract gradient
      run(divP, { uVel: vel.read.texture }, dv);
      for (let i = 0; i < 18; i++) {
        run(press, { uP: prs.read.texture, uDiv: dv.texture }, prs.write);
        prs.swap();
      }
      run(grad, { uP: prs.read.texture, uVel: vel.read.texture }, vel.write);
      vel.swap();
      // advect velocity, then the dye
      run(advect, { uVel: vel.read.texture, uSrc: vel.read.texture, uDt: dt, uDiss: 0.25 }, vel.write);
      vel.swap();
      run(advect, { uVel: vel.read.texture, uSrc: dye.read.texture, uDt: dt, uDiss: 0.55 }, dye.write);
      dye.swap();
      uniforms.uTex0.value = dye.read.texture;
    };
  };
  return (
    <Stage r={root} className="bg-[#03040a]" g1="rgba(255,90,170,.5)" g2="rgba(80,170,255,.25)">
      <Shader
        frag={DYE_SHOW}
        uniforms={() => ({ uSim: { value: 0 } })}
        init={init}
        fallback="radial-gradient(40% 50% at 35% 45%,rgba(255,80,160,.55),transparent 70%),radial-gradient(40% 50% at 65% 60%,rgba(60,160,255,.5),transparent 70%),#03040a"
      />
      <Sheen g1="rgba(255,110,180,.5)" />
      <div className="absolute bottom-[8%] left-[6%] z-40">
        <Copy kicker="Chroma Lab · Fabric dyes" title="Stir the colour." meta="Set of 6 dyes · ₹ 1,250" font={F.sy} size="clamp(44px,5vw,82px)" className="text-white" />
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ---------- M648 · Ink blooms in water (variant of M36: dark plumes bloom from drifting points, curl out, fade; pointer stirs) ---------- */
const INK = /* glsl */ `${NOISE}
uniform vec2 uPtr, uPv;
uniform float uStir;
void main() {
  float asp = uRes.x / max(uRes.y, 1.0);
  vec2 p = (vUv - 0.5) * vec2(asp, 1.0);
  float t = uTime;
  // the pointer stirs: a local swirl plus a push along its motion
  vec2 dq = p - uPtr;
  float f = exp(-dot(dq, dq) * 14.0) * uStir;
  p = uPtr + rot(f * 2.6) * dq - uPv * f * 0.1;
  // one shared turbulence field + fine tendrils
  vec2 wv = vec2(fbm(p * 2.6 + vec2(t * 0.12, 0.0)), fbm(p * 2.6 + vec2(5.3, -t * 0.1))) - 0.5;
  float tend = fbm(p * 7.0 + wv * 2.0 - vec2(0.0, t * 0.05));
  float keep = 1.0;
  float edge = 0.0;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float P = 6.5;
    float cyc = t / P + fi / 5.0;
    float g = fract(cyc);
    float id = floor(cyc) * 5.0 + fi;
    vec2 base = vec2(hsh(vec2(id, 1.3)) - 0.5, hsh(vec2(id, 7.9)) - 0.5) * vec2(asp * 0.8, 0.7);
    vec2 c = base + 0.06 * vec2(sin(t * 0.3 + fi), cos(t * 0.25 + fi * 2.0));
    vec2 d = p - c + wv * (0.12 + 0.5 * g);
    float r = length(d);
    d = rot((1.0 - r * 3.0) * g * 1.8 * (mod(fi, 2.0) * 2.0 - 1.0)) * d;
    r = length(d);
    float rad = 0.03 + 0.3 * pow(g, 0.6);
    float m = smoothstep(rad, rad * 0.15, r + (tend - 0.5) * 0.18 * (0.3 + g));
    float fade = (1.0 - g);
    fade = fade * fade * smoothstep(0.0, 0.06, g);
    keep *= 1.0 - m * fade * 0.9;
    edge += smoothstep(rad * 1.25, rad * 0.6, r) * (1.0 - smoothstep(rad * 0.6, rad * 0.1, r)) * fade;
  }
  float D = 1.0 - keep;
  vec3 water = mix(vec3(0.84, 0.88, 0.9), vec3(0.93, 0.95, 0.95), vUv.y);
  water += 0.025 * sin(p.x * 3.0 + t * 0.4 + p.y * 2.0);
  vec3 tint = vec3(0.2, 0.32, 0.55);
  vec3 ink = vec3(0.04, 0.05, 0.1);
  vec3 col = mix(water, tint, clamp(edge * 0.35, 0.0, 0.6));
  col = mix(col, mix(tint, ink, smoothstep(0.25, 0.85, D)), smoothstep(0.02, 0.55, D));
  gl_FragColor = vec4(col, 1.0);
}`;
function M648() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const s = useRef({ x: 9, y: 9, vx: 0, vy: 0, stir: 0, lx: 0, ly: 0, has: false });
  usePointer(
    root,
    dot,
    (t, w, h) => [w * (0.5 + 0.32 * Math.sin(t * 0.7 + 1)), h * (0.5 + 0.28 * Math.sin(t * 1.25))],
    (x, y, dt) => {
      const el = root.current;
      if (!el) return;
      const h = el.clientHeight || 1;
      const px = (x - el.clientWidth / 2) / h;
      const py = (h / 2 - y) / h;
      const S = s.current;
      if (S.has && dt > 0) {
        const vx = (px - S.lx) / dt;
        const vy = (py - S.ly) / dt;
        S.vx += (vx - S.vx) * 0.15;
        S.vy += (vy - S.vy) * 0.15;
      }
      S.has = true;
      S.lx = px;
      S.ly = py;
      S.x = px;
      S.y = py;
      S.stir += (Math.min(1, Math.hypot(S.vx, S.vy) * 0.9) - S.stir) * 0.1;
    },
  );
  return (
    <Stage r={root} className="bg-[#dfe6e9]" g1="rgba(120,160,230,.5)" g2="rgba(255,255,255,.3)">
      <Shader
        frag={INK}
        uniforms={() => ({ uPtr: { value: [9, 9] }, uPv: { value: [0, 0] }, uStir: { value: 0 } })}
        onFrame={(u) => {
          const S = s.current;
          u.uPtr.value = [S.x, S.y];
          const sp = Math.hypot(S.vx, S.vy) || 1;
          u.uPv.value = [S.vx / sp, S.vy / sp];
          u.uStir.value = S.stir;
        }}
        fallback="radial-gradient(18% 26% at 38% 42%,rgba(10,14,30,.85),rgba(50,80,140,.35) 60%,transparent 75%),radial-gradient(14% 22% at 66% 62%,rgba(10,14,30,.7),rgba(50,80,140,.3) 60%,transparent 75%),linear-gradient(#e9eef0,#d7e1e6)"
      />
      <Sheen g1="rgba(160,190,240,.5)" opacity={0.3} />
      <div className="absolute right-[6%] top-[9%] z-40 rounded-[22px] bg-[#f6f3ec]/90 px-9 py-8 text-[#121624]">
        <Copy kicker="Inkwell Atelier · Bottled ink" title={<>Ink, set free<br />in water.</>} meta="Indigo-black · 50 ml · ₹ 780" font={F.is} size="clamp(42px,4.4vw,72px)" />
      </div>
      <Dot r={dot} ink />
    </Stage>
  );
}

/* ---------- M649 · Topographic contour drift (contour lines of a slowly drifting field; lines near the pointer brighten) ---------- */
const TG_W = 60;
const TG_H = 30;
const TG_C = 20; // viewBox 1200 × 600
const TG_LEVELS = 13;
const hs = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const vn2 = (x: number, y: number) => {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  let fx = x - ix;
  let fy = y - iy;
  fx = fx * fx * (3 - 2 * fx);
  fy = fy * fy * (3 - 2 * fy);
  const a = hs(ix, iy);
  const b = hs(ix + 1, iy);
  const c = hs(ix, iy + 1);
  const d = hs(ix + 1, iy + 1);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
};
const topoField = (x: number, y: number, t: number) => 0.6 * vn2(x * 0.11 + t * 0.07, y * 0.11 + t * 0.03) + 0.3 * vn2(x * 0.23 - t * 0.05, y * 0.23 + 3.1) + 0.1 * vn2(x * 0.5 + 7, y * 0.5 - t * 0.06);
// edges: 0 top, 1 right, 2 bottom, 3 left — pairs per marching-squares case
const MS: number[][] = [[], [3, 2], [2, 1], [3, 1], [0, 1], [3, 0, 2, 1], [0, 2], [3, 0], [3, 0], [0, 2], [0, 1, 3, 2], [0, 1], [3, 1], [2, 1], [3, 2], []];
function contours(t: number) {
  const N = TG_W + 1;
  const v = new Float32Array(N * (TG_H + 1));
  for (let j = 0; j <= TG_H; j++) for (let i = 0; i <= TG_W; i++) v[j * N + i] = topoField(i, j, t);
  let thin = "";
  let bold = "";
  for (let L = 0; L < TG_LEVELS; L++) {
    const lv = 0.2 + L * 0.05;
    let out = "";
    for (let j = 0; j < TG_H; j++) {
      for (let i = 0; i < TG_W; i++) {
        const a = v[j * N + i];
        const b = v[j * N + i + 1];
        const c = v[(j + 1) * N + i + 1];
        const d = v[(j + 1) * N + i];
        const idx = (a > lv ? 8 : 0) | (b > lv ? 4 : 0) | (c > lv ? 2 : 0) | (d > lv ? 1 : 0);
        const segs = MS[idx];
        if (!segs.length) continue;
        const pt = (e: number): [number, number] =>
          e === 0 ? [i + (lv - a) / (b - a), j] : e === 1 ? [i + 1, j + (lv - b) / (c - b)] : e === 2 ? [i + (lv - d) / (c - d), j + 1] : [i, j + (lv - a) / (d - a)];
        for (let k = 0; k < segs.length; k += 2) {
          const p = pt(segs[k]);
          const q = pt(segs[k + 1]);
          out += `M${(p[0] * TG_C).toFixed(1)} ${(p[1] * TG_C).toFixed(1)}L${(q[0] * TG_C).toFixed(1)} ${(q[1] * TG_C).toFixed(1)}`;
        }
      }
    }
    if (L % 4 === 0) bold += out;
    else thin += out;
  }
  return { thin, bold };
}
function M649() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const thinRef = useRef<SVGPathElement>(null);
  const boldRef = useRef<SVGPathElement>(null);
  const lens = useRef<SVGCircleElement>(null);
  const uid = useId().replace(/:/g, "");
  const first = useMemo(() => contours(0), []);
  const lastT = useRef(-1);
  usePointer(
    root,
    dot,
    (t, w, h) => [w * (0.5 + 0.38 * Math.sin(t * 0.6)), h * (0.5 + 0.3 * Math.sin(t * 1.1 + 0.8))],
    (x, y, _dt, t) => {
      const el = root.current;
      if (!el) return;
      // pointer → viewBox (preserveAspectRatio slice)
      const w = el.clientWidth;
      const h = el.clientHeight;
      const k = Math.max(w / 1200, h / 600);
      const sx = (x - (w - 1200 * k) / 2) / k;
      const sy = (y - (h - 600 * k) / 2) / k;
      lens.current?.setAttribute("cx", sx.toFixed(1));
      lens.current?.setAttribute("cy", sy.toFixed(1));
      if (t - lastT.current < 1 / 40) return; // contours at ~40 fps is plenty
      lastT.current = t;
      const c = contours(t);
      thinRef.current?.setAttribute("d", c.thin);
      boldRef.current?.setAttribute("d", c.bold);
    },
  );
  return (
    <Stage r={root} className="bg-[#0a0f12]" g1="rgba(120,220,190,.5)" g2="rgba(255,190,120,.2)">
      <svg viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <path id={`${uid}-thin`} ref={thinRef} d={first.thin} />
          <path id={`${uid}-bold`} ref={boldRef} d={first.bold} />
          <radialGradient id={`${uid}-rg`}>
            <stop offset="0" stopColor="#fff" />
            <stop offset=".55" stopColor="#fff" stopOpacity=".55" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <mask id={`${uid}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width="1200" height="600">
            <circle ref={lens} cx="600" cy="300" r="190" fill={`url(#${uid}-rg)`} />
          </mask>
        </defs>
        <g fill="none" strokeLinecap="round" stroke="rgba(190,230,215,.28)">
          <use href={`#${uid}-thin`} strokeWidth="1" />
          <use href={`#${uid}-bold`} strokeWidth="1.8" stroke="rgba(190,230,215,.45)" />
        </g>
        <g fill="none" strokeLinecap="round" stroke="#ffd9a0" mask={`url(#${uid}-m)`}>
          <use href={`#${uid}-thin`} strokeWidth="1.6" />
          <use href={`#${uid}-bold`} strokeWidth="2.6" />
        </g>
      </svg>
      <Sheen g1="rgba(120,220,190,.5)" opacity={0.3} />
      <div className="pointer-events-none absolute bottom-[8%] left-[6%] z-40">
        <div className="rounded-[20px] bg-[#0a0f12]/70 px-7 py-6">
          <Copy kicker="Ridgeway Outfitters · Trail kit" title={<>Know the ground<br />before you go.</>} meta="Alpine shell · ₹ 12,400" font={F.sg} size="clamp(40px,4.2vw,68px)" className="text-white" />
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M638", name: "Nested text rings", how: "Four circular text rings nested inside each other turn at different speeds, neighbours in opposite directions (on screen)", kind: "play", C: M638 },
  { code: "M639", name: "Multi-ring orbits", how: "Icons ride three concentric orbits round a core; neighbouring rings turn opposite ways over faint dotted paths (on screen)", kind: "play", C: M639 },
  { code: "M640", name: "3D tilted ellipse orbit", how: "Product cards ride a tilted ellipse round the headline, growing and brightening in front, shrinking and dimming behind", kind: "play", C: M640 },
  { code: "M641", name: "Dotted globe", how: "A dotted globe spins slowly with pulsing markers; a pointer drags it faster and it glides back to its idle spin (shader)", kind: "play", C: M641 },
  { code: "M642", name: "Globe with arcs and pulses", how: "A turning dotted globe launches coloured arcs between cities; a pulse rides each arc and both ends ring out (shader + canvas)", kind: "play", C: M642 },
  { code: "M643", name: "Dotted map arcs", how: "On a flat dotted world map, curved routes draw city to city one after another and each arrival pings a ring (SVG loop)", kind: "play", C: M643 },
  { code: "M644", name: "Swirling orb", how: "A glowing orb swirls its colours; the pointer bends its edge and it switches between idle and active on its own (shader)", kind: "play", C: M644 },
  { code: "M645", name: "Conic orb", how: "Stacked conic gradients rotate against each other inside a soft-edged circle, so the orb's colours swirl (pure CSS)", kind: "play", C: M645 },
  { code: "M646", name: "Marbled orb", how: "A lit glass sphere whose coloured marbling swirls slowly inside on a seamless 12 s loop (shader)", kind: "play", C: M646 },
  { code: "M647", name: "Cursor-stirred dye fluid", how: "A real-time fluid tank: the pointer stirs coloured dye, which swirls, curls and slowly settles (WebGL fluid sim)", kind: "play", C: M647 },
  { code: "M648", name: "Ink blooms in water", how: "Dark ink plumes bloom from drifting points, curl outward and fade so new ones start; the pointer stirs them (shader)", kind: "play", C: M648 },
  { code: "M649", name: "Topographic contour drift", how: "Contour lines of a slowly drifting height field redraw live like a living map; lines near the pointer glow warm (SVG)", kind: "play", C: M649 },
];
