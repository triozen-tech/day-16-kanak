"use client";

// Micro-interactions, batch 14 · group 2 (MOTION-MENU U103–U111). Small focused demos for /lab/motion.
// Every hover / click / drag demo also plays by itself: a visible fake pointer (ring) walks over the targets or a
// scripted timeline moves it and "clicks"; the real mouse takes over whenever it moves. Loaders and gauges loop while
// on screen and pause off screen. A CSS-only glow loop never stops (and sits on top again, screen-blended).
// ?static=1 / reduced motion: no JS, the markup shows a sensible final state.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { scene, useScrub, useTicker } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = { sg: "Space Grotesk Variable", fr: "Fraunces Variable", is: "Instrument Serif", sy: "Syne Variable", mr: "Manrope Variable" };

const CSS = `
.b14u2-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.55)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.22)),transparent 70%);animation:b14u2-drift 5.4s linear infinite alternate;will-change:transform}
@keyframes b14u2-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b14u2-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;pointer-events:none;z-index:40;opacity:0;transition:opacity .25s}
.b14u2-dot>span{display:block;width:100%;height:100%;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4)}
.b14u2-dot.press>span{transform:scale(.7);background:rgba(255,255,255,.5)}
.b14u2-gdot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4);pointer-events:none;z-index:40}

/* U103 waveform */
.u103-b{display:block;width:100%;border-radius:999px;background:linear-gradient(180deg,#b9f3ff,#4f8dff 55%,#8c6eff);transform-origin:50% 50%;animation:u103-wave .62s ease-in-out infinite alternate}
@keyframes u103-wave{0%{transform:scaleY(.12)}100%{transform:scaleY(1)}}
.u103-off .u103-b{animation-play-state:paused}

/* U104 gauge */
.u104-w1{animation:u104-w 2.2s linear infinite}
.u104-w2{animation:u104-w 3.4s linear infinite reverse}
@keyframes u104-w{to{transform:translateX(-100px)}}

/* U109 links */
.u109-l{transition:color .35s}
.u109-l .u109-s{opacity:.35;transition:opacity .35s,stroke .35s}
.u109-l.on{color:#fff}
.u109-l.on .u109-s{opacity:1}

/* U110 */
.u110-th{transition:transform .45s cubic-bezier(.2,.7,.2,1),box-shadow .45s,opacity .45s}
.u110-grid.has .u110-th{opacity:.55}
.u110-grid.has .u110-th.on{opacity:1;transform:scale(1.04);box-shadow:0 0 0 2px #ffd59a,0 18px 40px rgba(0,0,0,.45)}
.u110-mc{transition:background-color .3s}
.u110-mc.on{background:rgba(255,213,154,.85)}

html.is-static .b14u2-glow,html.is-static .u103-b,html.is-static .u104-w1,html.is-static .u104-w2{animation:none}
html.is-static .b14u2-dot,html.is-static .b14u2-gdot{display:none}
html.is-static {
  .b14u2-glow,.u103-b,.u104-w1,.u104-w2{animation:none}
  .b14u2-dot,.b14u2-gdot{display:none}
  .u109-l,.u109-l .u109-s,.u110-th,.u110-mc{transition:none}
}
`;

/* ---------- shared helpers (local copies) ---------- */

function Stage({ r, children, g1, g2, className = "" }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; g1?: string; g2?: string; className?: string }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0d16] text-[#eef2ff] ${className}`}>
      <style href="b14u2-css" precedence="default">
        {CSS}
      </style>
      <div className="b14u2-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="x-in relative h-full w-full">{children}</div>
      <div className="b14u2-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.42, zIndex: 35 } as CSSProperties} aria-hidden />
    </div>
  );
}

/** The visible fake pointer for ticker-driven demos (a ring). */
const Dot = ({ r }: { r: RefObject<HTMLDivElement | null> }) => (
  <div ref={r} className="b14u2-dot" aria-hidden>
    <span />
  </div>
);
/** The fake pointer for GSAP-timeline demos. */
const GDot = ({ c }: { c: string }) => <div className={`b14u2-gdot ${c}`} style={{ opacity: 0 }} aria-hidden />;

type Pt = { x: number; y: number; inside: boolean };
type Box = { l: number; t: number; w: number; h: number };
function rel(node: Element, root: Element): Box {
  const a = node.getBoundingClientRect();
  const r = root.getBoundingClientRect();
  return { l: a.left - r.left, t: a.top - r.top, w: a.width, h: a.height };
}
const inBox = (b: Box, x: number, y: number, pad = 0) => x >= b.l - pad && x <= b.l + b.w + pad && y >= b.t - pad && y <= b.t + b.h + pad;
const mid = (b: Box): [number, number] => [b.l + b.w / 2, b.t + b.h / 2];
const easeIO = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const clamp = (a: number, b: number, v: number) => Math.min(b, Math.max(a, v));

/** Pointer driver: the real mouse wins for 2.5 s after it last moved; otherwise `script` moves a visible fake ring. */
function usePointer(
  root: RefObject<HTMLDivElement | null>,
  dot: RefObject<HTMLDivElement | null>,
  script: (t: number, el: HTMLDivElement) => Pt,
  frame: (p: Pt, el: HTMLDivElement, fake: boolean) => void,
) {
  const real = useRef({ x: 0, y: 0, inside: false, at: -1e9 });
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
      real.current = { x: e.clientX - r.left, y: e.clientY - r.top, inside: true, at: performance.now() };
    };
    const leave = () => (real.current = { ...real.current, inside: false, at: performance.now() });
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [root]);
  useTicker(root, (t) => {
    const el = root.current;
    if (!el) return;
    if (t0.current < 0) t0.current = t;
    const R = real.current;
    const useReal = performance.now() - R.at < 2500;
    const p = useReal ? { x: R.x, y: R.y, inside: R.inside } : sc.current(t - t0.current, el);
    const dn = dot.current;
    if (dn) {
      dn.style.transform = `translate3d(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px,0)`;
      dn.style.opacity = useReal ? "0" : "1";
    }
    fr.current(p, el, !useReal);
  });
}

/** A path that rests at each point (≤ 0.5 s) and glides to the next. */
function walk(t: number, pts: [number, number][], move = 0.55, rest = 0.45): [number, number] {
  const n = pts.length;
  const seg = move + rest;
  const k = Math.floor(t / seg);
  const f = t - k * seg;
  const a = pts[k % n];
  const b = pts[(k + 1) % n];
  const m = f < rest ? 0 : easeIO((f - rest) / move);
  return [a[0] + (b[0] - a[0]) * m, a[1] + (b[1] - a[1]) * m];
}

/** Hover walk: the fake ring visits every target (`sel`); the hovered one (fake or real pointer) gets "on". */
function useWalk(
  root: RefObject<HTMLDivElement | null>,
  dot: RefObject<HTMLDivElement | null>,
  o: { sel: string; move?: number; rest?: number; at?: (b: Box, i: number) => [number, number]; onChange?: (now: number, prev: number, el: HTMLDivElement) => void },
) {
  const cur = useRef(-2);
  usePointer(
    root,
    dot,
    (t, el) => {
      const tg = el.querySelectorAll(o.sel);
      const pts: [number, number][] = [...tg].map((n, i) => (o.at ? o.at(rel(n, el), i) : mid(rel(n, el))));
      const [x, y] = walk(t, pts, o.move, o.rest);
      return { x: x + Math.sin(t * 2.1) * 6, y: y + Math.cos(t * 1.7) * 5, inside: true };
    },
    (p, el) => {
      const tg = [...el.querySelectorAll(o.sel)];
      const idx = p.inside ? tg.findIndex((n) => inBox(rel(n, el), p.x, p.y)) : -1;
      if (idx === cur.current) return;
      const prev = cur.current;
      cur.current = idx;
      tg.forEach((n, i) => n.classList.toggle("on", i === idx));
      o.onChange?.(idx, prev, el);
    },
  );
  return cur;
}

/** "play" helper: waits for fonts, builds the looping timeline in a gsap.context, plays only on screen, rebuilds on resize. */
function usePlay(ref: RefObject<HTMLElement | null>, build: (root: HTMLElement) => gsap.core.Animation | void) {
  const b = useRef(build);
  b.current = build;
  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    let dead = false;
    let on = false;
    let ready = false;
    let anim: gsap.core.Animation | void;
    let ctx = gsap.context(() => {}, root);
    let timer = 0;
    const sync = () => {
      if (!anim) return;
      if (on) anim.play();
      else anim.pause();
    };
    const make = () => {
      ctx.revert();
      ctx = gsap.context(() => {}, root);
      ctx.add(() => {
        anim = b.current(root);
      });
      sync();
    };
    const io = new IntersectionObserver(
      ([e]) => {
        on = e.isIntersecting;
        sync();
      },
      { threshold: 0.1 },
    );
    io.observe(root);
    const onResize = () => {
      if (!ready) return;
      clearTimeout(timer);
      timer = window.setTimeout(make, 220);
    };
    window.addEventListener("resize", onResize);
    document.fonts?.ready.then(() => {
      if (dead) return;
      ready = true;
      make();
    });
    return () => {
      dead = true;
      clearTimeout(timer);
      io.disconnect();
      window.removeEventListener("resize", onResize);
      ctx.revert();
    };
  }, [ref]);
}

const hold = (tl: gsap.core.Timeline, d = 0.2) => tl.to({}, { duration: d });
/** Timeline fake pointer: glide to a point, then a short press. */
function tap(tl: gsap.core.Timeline, dot: Element, p: [number, number], at?: gsap.Position) {
  tl.to(dot, { x: p[0], y: p[1], opacity: 1, duration: 0.45, ease: "power2.inOut" }, at);
  tl.to(dot, { scale: 0.7, duration: 0.1, ease: "power1.in" }).to(dot, { scale: 1, duration: 0.12, ease: "power1.out" });
}

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, className = "", style, w = 900, h = 900, label = "" }: { i: number; className?: string; style?: CSSProperties; w?: number; h?: number; label?: string }) => (
  <img src={scene(i, w, h, label)} alt="" className={`h-full w-full object-cover ${className}`} style={style} draggable={false} />
);
const Label = ({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) => (
  <p className={`text-[13px] uppercase tracking-[0.22em] text-white/60 ${className}`} style={{ fontFamily: F.mr, ...style }}>
    {children}
  </p>
);

/* ───────────────────────── U103 · Waveform loader bars ───────────────────────── */
const U103_N = 56;
function U103() {
  const root = useRef<HTMLDivElement>(null);
  const pct = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => el.classList.toggle("u103-off", !e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  usePlay(root, () => {
    const o = { v: 0 };
    const tl = gsap.timeline({ repeat: -1 });
    tl.to(o, {
      v: 100,
      duration: 3.2,
      ease: "none",
      onUpdate: () => {
        if (pct.current) pct.current.textContent = `${Math.round(o.v)}%`;
        if (bar.current) bar.current.style.transform = `scaleX(${o.v / 100})`;
      },
    });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(79,141,255,.55)" g2="rgba(140,110,255,.26)">
      <div className="absolute left-1/2 top-1/2 w-[min(760px,78%)]" style={{ transform: "translate(-50%,-50%)" }}>
        <div className="flex items-end justify-between">
          <div>
            <Label>Now mastering</Label>
            <p className="mt-2 leading-none" style={{ fontFamily: F.fr, fontSize: "clamp(32px,3.6vw,58px)" }}>
              Low Tide <span className="italic text-white/55">(Extended)</span>
            </p>
          </div>
          <span ref={pct} className="text-[28px] font-semibold tabular-nums" style={{ fontFamily: F.sg }}>
            64%
          </span>
        </div>
        <div className="mt-10 flex h-[180px] items-center gap-[5px]">
          {Array.from({ length: U103_N }, (_, i) => {
            const env = 0.28 + 0.72 * Math.pow(Math.sin((i / (U103_N - 1)) * Math.PI), 0.8) * (0.7 + 0.3 * Math.sin(i * 1.7));
            return (
              <div key={i} className="flex h-full flex-1 items-center">
                <span className="u103-b" style={{ height: `${(env * 100).toFixed(1)}%`, animationDelay: `${(-((i * 0.075) % 1.24)).toFixed(3)}s` }} />
              </div>
            );
          })}
        </div>
        <div className="mt-8 h-[3px] overflow-hidden rounded-full bg-white/10">
          <div ref={bar} className="h-full w-full origin-left bg-white/80" style={{ transform: "scaleX(.64)" }} />
        </div>
        <div className="mt-3 flex justify-between text-[13px] text-white/55" style={{ fontFamily: F.mr }}>
          <span>24-bit · 96 kHz</span>
          <span>Studio Four · Session 12</span>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── U104 · Liquid fill gauge ───────────────────────── */
const U104_LEVEL = 0.72;
const U104_Y = (v: number) => 190 - 180 * v;
const U104_WAVE = (amp: number) => {
  let d = `M-100 0`;
  for (let x = -100; x < 400; x += 100) d += ` Q${x + 25} ${-amp} ${x + 50} 0 T${x + 100} 0`;
  return d + " V230 H-100 Z";
};
function U104Wave({ amp, cls, fill, opacity = 1 }: { amp: number; cls: string; fill: string; opacity?: number }) {
  return <path className={cls} d={U104_WAVE(amp)} fill={fill} opacity={opacity} />;
}
function U104() {
  const root = useRef<HTMLDivElement>(null);
  const num = useRef<SVGTSpanElement>(null);
  const num2 = useRef<SVGTSpanElement>(null);
  const ml = useRef<HTMLSpanElement>(null);
  usePlay(root, (el) => {
    const lv = el.querySelectorAll(".u104-lvl");
    const o = { v: 0 };
    const put = () => {
      gsap.set(lv, { y: U104_Y(o.v) });
      const t = `${Math.round(o.v * 100)}`;
      if (num.current) num.current.textContent = t;
      if (num2.current) num2.current.textContent = t;
      if (ml.current) ml.current.textContent = (o.v * 2.5).toFixed(1);
    };
    put();
    const tl = gsap.timeline({ repeat: -1 });
    tl.to(o, { v: U104_LEVEL, duration: 1.9, ease: "power2.out", onUpdate: put })
      .to(o, { v: U104_LEVEL + 0.015, duration: 0.25, ease: "sine.inOut", onUpdate: put })
      .to(o, { v: 0.04, duration: 0.8, ease: "power2.in", onUpdate: put });
    return tl;
  });
  const y0 = U104_Y(U104_LEVEL);
  const text = (fill: string, r?: RefObject<SVGTSpanElement | null>) => (
    <text x="100" y="112" textAnchor="middle" fill={fill} style={{ fontFamily: F.sg, fontWeight: 700, fontSize: 46 }}>
      <tspan ref={r}>{Math.round(U104_LEVEL * 100)}</tspan>
      <tspan fontSize="22" dx="2">
        %
      </tspan>
    </text>
  );
  return (
    <Stage r={root} g1="rgba(110,220,255,.55)" g2="rgba(79,141,255,.26)">
      <div className="absolute inset-0 grid grid-cols-[1fr_1fr] items-center gap-[4%] px-[8%]">
        <div>
          <Label>Daily hydration</Label>
          <p className="mt-3 leading-[0.95]" style={{ fontFamily: F.fr, fontSize: "clamp(40px,4.8vw,80px)" }}>
            Almost there.
          </p>
          <p className="mt-5 text-[16px] text-white/70" style={{ fontFamily: F.mr }}>
            <span ref={ml} className="font-semibold text-white tabular-nums">
              1.8
            </span>{" "}
            of 2.5 L today · Steel bottle 750 ml · ₹1,490
          </p>
        </div>
        <div className="relative mx-auto aspect-square w-[min(420px,90%)]">
          <svg viewBox="0 0 200 200" className="h-full w-full overflow-visible" aria-hidden>
            <defs>
              <clipPath id="u104-clip">
                <circle cx="100" cy="100" r="88" />
              </clipPath>
              <mask id="u104-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200">
                <g className="u104-lvl" transform={`translate(0 ${y0})`}>
                  <U104Wave amp={7} cls="u104-w1" fill="#fff" />
                </g>
              </mask>
              <linearGradient id="u104-g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#9ff0ff" />
                <stop offset="1" stopColor="#3f7dff" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="96" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="2" />
            <circle cx="100" cy="100" r="88" fill="rgba(255,255,255,.04)" />
            {text("#eef2ff", num)}
            <g clipPath="url(#u104-clip)">
              <g className="u104-lvl" transform={`translate(0 ${y0})`}>
                <U104Wave amp={9} cls="u104-w2" fill="#7fd8ff" opacity={0.45} />
                <U104Wave amp={7} cls="u104-w1" fill="url(#u104-g)" />
              </g>
              <g mask="url(#u104-mask)">{text("#06142a", num2)}</g>
            </g>
          </svg>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── U105 · Directional motion blur on move ───────────────────────── */
const U105_C = [
  { t: "Dune Lounge", p: "₹38,000", i: 3 },
  { t: "Harbour Lamp", p: "₹6,400", i: 0 },
  { t: "Fern Stool", p: "₹9,200", i: 2 },
  { t: "Ember Vase", p: "₹2,750", i: 1 },
];
const U105_PATH = [1, 2, 3, 2, 1, 0];
function U105Card({ c }: { c: (typeof U105_C)[number] }) {
  return (
    <>
      <div className="absolute inset-0">
        <Img i={c.i} w={800} h={900} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
      <div className="absolute bottom-[7%] left-[8%] right-[8%] flex items-end justify-between" style={{ fontFamily: F.mr }}>
        <span className="text-[15px]">{c.t}</span>
        <span className="text-[15px] font-semibold">{c.p}</span>
      </div>
    </>
  );
}
function U105() {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const tt = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const last = useRef({ x: 0, y: 0 });
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const box = q(".x-in")[0];
    const cards = q(".u105-card");
    const dot = q(".u105-dot")[0];
    const step = (cards[1] as HTMLElement).offsetLeft - (cards[0] as HTMLElement).offsetLeft;
    const nx = mid(rel(q(".u105-nx")[0], box));
    const pv = mid(rel(q(".u105-pv")[0], box));
    gsap.set(track.current, { x: 0 });
    gsap.set(tt.current, { yPercent: 0 });
    gsap.set(dot, { x: box.clientWidth * 0.6, y: box.clientHeight * 0.9 });
    const tl = gsap.timeline({ repeat: -1 });
    let cur = 0;
    U105_PATH.forEach((to, k) => {
      const btn = to > cur ? nx : pv;
      tap(tl, dot, btn);
      tl.addLabel(`go${k}`);
      tl.to(track.current, { x: -to * step, duration: 0.85, ease: "expo.inOut" }, `go${k}`)
        .to(tt.current, { yPercent: (-to * 100) / U105_C.length, duration: 0.85, ease: "expo.inOut" }, `go${k}+=0.08`)
        .to(dot, { x: btn[0] - 40, y: btn[1] + 26, duration: 0.6, ease: "sine.inOut" }, `go${k}+=0.1`);
      hold(tl, 0.12);
      cur = to;
    });
    tlRef.current = tl;
    return tl;
  });
  // velocity → opacity of the pre-blurred (fixed blur) ghost copies, plus a slight stretch along the travel
  useTicker(root, (_t, dt) => {
    const tr = track.current;
    const ti = tt.current;
    if (!tr || !ti || dt <= 0) return;
    const x = Number(gsap.getProperty(tr, "x")) || 0;
    const y = ((Number(gsap.getProperty(ti, "yPercent")) || 0) * ti.offsetHeight) / 100;
    const vx = clamp(0, 1, Math.abs(x - last.current.x) / dt / 1800);
    const vy = clamp(0, 1, Math.abs(y - last.current.y) / dt / 500);
    last.current = { x, y };
    tr.style.setProperty("--b", vx.toFixed(3));
    ti.style.setProperty("--b", vy.toFixed(3));
  });
  const jump = () => {
    const tl = tlRef.current;
    if (!tl) return;
    const labels = Object.values(tl.labels).sort((a, b) => a - b);
    const t = tl.time();
    tl.seek(labels.find((v) => v > t + 0.05) ?? labels[0]);
  };
  const ghost = (axis: "x" | "y"): CSSProperties => ({ filter: `url(#u105-b${axis})`, opacity: "var(--b,0)" as unknown as number });
  const sharp: CSSProperties = { opacity: "calc(1 - var(--b,0) * .8)" as unknown as number };
  return (
    <Stage r={root} g1="rgba(255,190,140,.55)" g2="rgba(79,141,255,.24)">
      <svg width="0" height="0" className="absolute" aria-hidden>
        <filter id="u105-bx" x="-10%" y="0%" width="120%" height="100%">
          <feGaussianBlur stdDeviation="9 0" />
        </filter>
        <filter id="u105-by" x="0%" y="-10%" width="100%" height="120%">
          <feGaussianBlur stdDeviation="0 6" />
        </filter>
      </svg>
      <div className="absolute left-[6%] top-[10%] flex items-end gap-6">
        <div className="relative h-[clamp(48px,5.2vw,86px)] overflow-hidden">
          <div ref={tt} className="absolute left-0 top-0 w-max">
            {U105_C.map((c, i) => (
              <p key={i} className="relative leading-none" style={{ height: "clamp(48px,5.2vw,86px)", fontFamily: F.is, fontSize: "clamp(44px,4.8vw,80px)" }}>
                <span className="block" style={sharp}>
                  {c.t}
                </span>
                <span className="absolute inset-0 block" style={ghost("y")} aria-hidden>
                  {c.t}
                </span>
              </p>
            ))}
          </div>
          <p className="invisible leading-none" style={{ fontFamily: F.is, fontSize: "clamp(44px,4.8vw,80px)" }}>
            Harbour Lamp
          </p>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-[20%] top-[30%]">
        <div ref={track} className="flex h-full w-full gap-[3%] pl-[6%]">
          {U105_C.map((c, i) => (
            <div key={i} className="u105-card relative h-full shrink-0 basis-[30%] overflow-hidden rounded-[20px] border border-white/10" style={{ transform: "scaleX(calc(1 + var(--b,0) * .04))" }}>
              <div className="absolute inset-0" style={sharp}>
                <U105Card c={c} />
              </div>
              <div className="absolute inset-0" style={ghost("x")} aria-hidden>
                <U105Card c={c} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-[6%] right-[6%] flex gap-3">
        <button type="button" onClick={jump} className="u105-pv grid h-12 w-12 place-items-center rounded-full border border-white/25 text-[18px]" aria-label="Previous">
          ←
        </button>
        <button type="button" onClick={jump} className="u105-nx grid h-12 w-12 place-items-center rounded-full bg-white text-[18px] text-[#0a0d16]" aria-label="Next">
          →
        </button>
      </div>
      <Label className="absolute bottom-[7.5%] left-[6%]">Living room · 4 pieces</Label>
      <GDot c="u105-dot" />
    </Stage>
  );
}

/* ───────────────────────── U106 · Bouncy draggable ───────────────────────── */
function U106() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const posEl = useRef<HTMLDivElement>(null);
  const dirEl = useRef<HTMLDivElement>(null);
  const sqEl = useRef<HTMLDivElement>(null);
  const unEl = useRef<HTMLDivElement>(null);
  const shadow = useRef<HTMLDivElement>(null);
  const S = useRef({ x: 0, y: 0, vx: 0, vy: 0, drag: false, gx: 0, gy: 0, t0: -1, real: { x: 0, y: 0, down: false, at: -1e9 } });

  useEffect(() => {
    const el = root.current;
    const card = posEl.current;
    if (!el || !card) return;
    const at = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const down = (e: PointerEvent) => {
      const p = at(e);
      S.current.real = { ...p, down: true, at: performance.now() };
      card.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      const p = at(e);
      S.current.real = { ...S.current.real, ...p, at: performance.now() };
    };
    const up = () => (S.current.real = { ...S.current.real, down: false, at: performance.now() });
    card.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      card.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  useTicker(root, (t, dtRaw) => {
    const el = root.current;
    if (!el) return;
    const dt = Math.min(dtRaw, 1 / 30);
    if (dt <= 0) return;
    const s = S.current;
    if (s.t0 < 0) s.t0 = t;
    const W = el.clientWidth;
    const H = el.clientHeight;
    const cx = W * 0.5;
    const cy = H * 0.54;
    const real = performance.now() - s.real.at < 2500 || s.real.down;
    let px: number;
    let py: number;
    let down: boolean;
    if (real) {
      px = s.real.x;
      py = s.real.y;
      down = s.real.down;
    } else {
      // scripted drag: approach (0.55) · press (0.2) · drag along 3 legs (1.5) · release + leave (0.65) · rest (0.45)
      const P = 3.35;
      const f = (t - s.t0) % P;
      const start: [number, number] = [cx + W * 0.24, cy + H * 0.3];
      const grab: [number, number] = [cx + 30, cy + 20];
      const legs: [number, number][] = [grab, [cx - W * 0.26, cy - H * 0.16], [cx + W * 0.12, cy - H * 0.26], [cx + W * 0.27, cy + H * 0.06]];
      const lerp = (a: [number, number], b: [number, number], m: number): [number, number] => [a[0] + (b[0] - a[0]) * m, a[1] + (b[1] - a[1]) * m];
      let p: [number, number];
      if (f < 0.55) {
        p = lerp(start, grab, easeIO(f / 0.55));
        down = false;
      } else if (f < 0.75) {
        p = grab;
        down = f > 0.62;
      } else if (f < 2.25) {
        const u = (f - 0.75) / 0.5;
        const k = Math.min(2, Math.floor(u));
        p = lerp(legs[k], legs[k + 1], easeIO(u - k));
        down = true;
      } else if (f < 2.9) {
        p = lerp(legs[3], start, easeIO((f - 2.25) / 0.65));
        down = false;
      } else {
        p = start;
        down = false;
      }
      [px, py] = p;
    }
    const d = dot.current;
    if (d) {
      d.style.transform = `translate3d(${px.toFixed(1)}px,${py.toFixed(1)}px,0)`;
      d.style.opacity = real ? "0" : "1";
      d.classList.toggle("press", down);
    }
    if (down && !s.drag) {
      s.drag = true;
      s.gx = px - cx - s.x;
      s.gy = py - cy - s.y;
    } else if (!down && s.drag) s.drag = false;
    const ox = s.x;
    const oy = s.y;
    if (s.drag) {
      const k = 1 - Math.exp(-dt * 16);
      s.x += (px - cx - s.gx - s.x) * k;
      s.y += (py - cy - s.gy - s.y) * k;
      s.vx = (s.x - ox) / dt;
      s.vy = (s.y - oy) / dt;
    } else {
      // spring back to rest (under-damped: a short bounce, then still)
      const ax = -170 * s.x - 12 * s.vx;
      const ay = -170 * s.y - 12 * s.vy;
      s.vx += ax * dt;
      s.vy += ay * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
    }
    const sp = Math.hypot(s.vx, s.vy);
    const q = Math.min(sp / 2400, 0.32);
    const ang = Math.atan2(s.vy, s.vx) * (180 / Math.PI);
    const tilt = clamp(-16, 16, s.vx * 0.012);
    const lift = s.drag ? 1 : 0;
    if (posEl.current) posEl.current.style.transform = `translate3d(${s.x.toFixed(1)}px,${s.y.toFixed(1)}px,0) rotate(${tilt.toFixed(2)}deg) scale(${s.drag ? 1.04 : 1})`;
    if (dirEl.current) dirEl.current.style.transform = `rotate(${ang.toFixed(1)}deg)`;
    if (sqEl.current) sqEl.current.style.transform = `scale(${(1 + q).toFixed(3)},${(1 - q * 0.6).toFixed(3)})`;
    if (unEl.current) unEl.current.style.transform = `rotate(${(-ang).toFixed(1)}deg)`;
    if (shadow.current) {
      shadow.current.style.transform = `translate3d(${(s.x * 0.9).toFixed(1)}px,${(s.y * 0.9 + 26 + lift * 18).toFixed(1)}px,0) scale(${(1 + q * 0.5).toFixed(3)})`;
      shadow.current.style.opacity = String(0.55 - lift * 0.2);
    }
  });

  return (
    <Stage r={root} g1="rgba(200,255,138,.5)" g2="rgba(79,141,255,.24)">
      <div className="absolute inset-0 opacity-[0.18]" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.7) 1px, transparent 1.2px)", backgroundSize: "28px 28px" }} />
      <Label className="absolute left-[6%] top-[9%]">Moodboard · drag to arrange</Label>
      <div ref={shadow} className="pointer-events-none absolute left-1/2 top-[54%] -ml-[150px] -mt-[180px] h-[360px] w-[300px] rounded-[26px] bg-black/60" style={{ opacity: 0.55, filter: "blur(18px)" }} aria-hidden />
      <div ref={posEl} className="absolute left-1/2 top-[54%] -ml-[150px] -mt-[180px] h-[360px] w-[300px] cursor-grab touch-none select-none">
        <div ref={dirEl} className="h-full w-full">
          <div ref={sqEl} className="h-full w-full">
            <div ref={unEl} className="h-full w-full">
              <div className="relative h-full w-full overflow-hidden rounded-[26px] border border-white/15 bg-[#f3efe6] p-3 text-[#16120c]">
                <div className="h-[72%] overflow-hidden rounded-[18px]">
                  <Img i={2} w={600} h={700} />
                </div>
                <div className="flex items-end justify-between px-2 pt-4" style={{ fontFamily: F.mr }}>
                  <div>
                    <p className="text-[18px] font-semibold" style={{ fontFamily: F.fr }}>
                      Clay Mug No. 4
                    </p>
                    <p className="mt-1 text-[13px] opacity-60">Speckled glaze · 320 ml</p>
                  </div>
                  <p className="text-[16px] font-bold">₹1,150</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U107 · Expanding bar tabs ───────────────────────── */
const U107_T = [
  { tab: "Single Origin", title: "Grown at 1,600 m", body: "Washed Arabica from a hill estate, roasted on Tuesdays and shipped by Thursday.", price: "250 g · ₹780", c: "#ffd59a" },
  { tab: "Brew Bar", title: "Pour, wait, sip", body: "A ceramic dripper, a gooseneck kettle and a recipe card that fits in your pocket.", price: "Kit · ₹3,450", c: "#9fd8ff" },
  { tab: "Subscribe", title: "Fresh every fortnight", body: "Pick a roast level and grind; we send two bags a month and you skip any time.", price: "From ₹1,290 / mo", c: "#c8ff8a" },
];
function U107() {
  const root = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const box = q(".x-in")[0];
    const area = rel(q(".u107-area")[0], box);
    const bars = q(".u107-bar");
    const labels = q(".u107-tab");
    const bgs = q(".u107-bg");
    gsap.set(q(".u107-pn"), { visibility: "visible" });
    const cons = q(".u107-con");
    const dot = q(".u107-dot")[0];
    const thin = bars.map((b) => {
      const r = rel(b, box);
      return { x: r.l - area.l, y: r.t - area.t, scaleX: r.w / area.w, scaleY: Math.max(r.h, 3) / area.h };
    });
    bgs.forEach((b, i) => gsap.set(b, { ...thin[i], transformOrigin: "0 0", autoAlpha: 1 }));
    gsap.set(cons, { autoAlpha: 0 });
    gsap.set(bars, { opacity: 0 });
    gsap.set(dot, { x: box.clientWidth * 0.7, y: box.clientHeight * 0.92 });
    const tl = gsap.timeline({ repeat: -1 });
    U107_T.forEach((_, i) => {
      const lb = mid(rel(labels[i], box));
      const title = cons[i].querySelector(".u107-ti");
      const rest = cons[i].querySelectorAll(".u107-r");
      tl.addLabel(`t${i}`);
      tap(tl, dot, lb);
      tl.to(labels[i], { color: "#ffffff", duration: 0.2 }, "<0.45")
        .to(bgs[i], { x: 0, scaleX: 1, duration: 0.42, ease: "power3.inOut" })
        .to(bgs[i], { y: 0, scaleY: 1, duration: 0.45, ease: "power3.inOut" })
        .to(dot, { x: lb[0] + 60, y: lb[1] + 120, duration: 0.7, ease: "sine.inOut" }, "<")
        .set(cons[i], { autoAlpha: 1 })
        .fromTo(title, { xPercent: -14, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, "<0.15")
        .fromTo(rest, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.06, ease: "power3.out" }, "<0.1")
        .to(title, { xPercent: 2, duration: 0.3, ease: "sine.inOut" })
        .to(cons[i], { autoAlpha: 0, duration: 0.22 })
        .to(bgs[i], { y: thin[i].y, scaleY: thin[i].scaleY, duration: 0.36, ease: "power3.inOut" }, "<0.1")
        .to(bgs[i], { x: thin[i].x, scaleX: thin[i].scaleX, duration: 0.34, ease: "power3.inOut" })
        .to(labels[i], { color: "rgba(238,242,255,.55)", duration: 0.2 }, "<");
    });
    tlRef.current = tl;
    return tl;
  });
  const pick = (i: number) => {
    const tl = tlRef.current;
    if (tl) tl.seek(tl.labels[`t${i}`] + 0.45);
  };
  return (
    <Stage r={root} g1="rgba(255,213,154,.55)" g2="rgba(159,216,255,.24)">
      <div className="absolute left-[7%] right-[7%] top-[11%] flex items-end justify-between">
        <p className="leading-none" style={{ fontFamily: F.fr, fontSize: "clamp(28px,2.6vw,42px)" }}>
          Hillside Roasters
        </p>
        <div className="flex gap-[clamp(20px,3vw,48px)]">
          {U107_T.map((t, i) => (
            <button key={i} type="button" onClick={() => pick(i)} className="u107-tab relative pb-3 text-[15px] text-[#eef2ff]/55" style={{ fontFamily: F.sg, color: i === 0 ? "#fff" : undefined }}>
              {t.tab}
              <span className="u107-bar absolute bottom-0 left-0 right-0 h-[3px] rounded-full" style={{ background: t.c, opacity: 0.6 }} />
            </button>
          ))}
        </div>
      </div>
      <div className="u107-area absolute bottom-[9%] left-[7%] right-[7%] top-[28%]" />
      {U107_T.map((t, i) => (
        <div key={i} className="u107-pn pointer-events-none absolute bottom-[9%] left-[7%] right-[7%] top-[28%]" style={i === 0 ? undefined : { visibility: "hidden" }}>
          <div className="u107-bg absolute inset-0 rounded-[6px]" style={{ background: t.c }} />
          <div className="u107-con absolute inset-0 grid grid-cols-[1.3fr_1fr] items-center gap-[6%] px-[6%] text-[#14100a]">
            <div>
              <p className="u107-r text-[13px] uppercase tracking-[0.22em] opacity-70" style={{ fontFamily: F.mr }}>
                0{i + 1} · {t.tab}
              </p>
              <p className="u107-ti mt-3 leading-[0.95]" style={{ fontFamily: F.fr, fontSize: "clamp(40px,4.6vw,78px)", fontWeight: 500 }}>
                {t.title}
              </p>
              <p className="u107-r mt-5 max-w-[42ch] text-[16px] leading-relaxed opacity-75" style={{ fontFamily: F.mr }}>
                {t.body}
              </p>
              <p className="u107-r mt-5 text-[18px] font-bold" style={{ fontFamily: F.sg }}>
                {t.price}
              </p>
            </div>
            <div className="u107-r h-[72%] overflow-hidden rounded-[18px]">
              <Img i={[3, 0, 2][i]} w={700} h={600} />
            </div>
          </div>
        </div>
      ))}
      <GDot c="u107-dot" />
    </Stage>
  );
}

/* ───────────────────────── U108 · Collapsing logo on scroll (scrub) ───────────────────────── */
const U108_WORD = "ORRIN VALE";
const U108_KEY = [0, 6];
function U108() {
  const root = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const prog = useRef(0);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    let dead = false;
    let ctx = gsap.context(() => {}, el);
    let timer = 0;
    const build = () => {
      ctx.revert();
      ctx = gsap.context(() => {
        const q = gsap.utils.selector(el);
        const box = q(".x-in")[0];
        const logo = q(".u108-logo")[0] as HTMLElement;
        const letters = q(".u108-ch") as HTMLElement[];
        const slot = rel(q(".u108-slot")[0], box);
        const lb = rel(logo, box);
        const tl = gsap.timeline({ paused: true });
        const drop = letters.filter((_, i) => !U108_KEY.includes(i));
        drop.forEach((c) => gsap.set(c, { width: c.offsetWidth }));
        tl.to(drop.slice().reverse(), { width: 0, opacity: 0, yPercent: -50, duration: 0.45, ease: "power2.inOut", stagger: 0.025 }, 0)
          .to(logo, { x: slot.l - lb.l, y: slot.t - lb.t, scale: slot.h / lb.h, transformOrigin: "0 0", duration: 0.7, ease: "power1.inOut" }, 0.3)
          .to(q(".u108-page"), { yPercent: -28, duration: 1, ease: "none" }, 0)
          .to(q(".u108-bar"), { backgroundColor: "rgba(10,13,22,.88)", borderColor: "rgba(255,255,255,.12)", duration: 0.4, ease: "none" }, 0.6)
          .to(q(".u108-sub"), { opacity: 0, y: -20, duration: 0.3, ease: "none" }, 0);
        tl.progress(prog.current);
        tlRef.current = tl;
      }, el);
    };
    const onResize = () => {
      clearTimeout(timer);
      timer = window.setTimeout(build, 220);
    };
    document.fonts?.ready.then(() => !dead && build());
    window.addEventListener("resize", onResize);
    return () => {
      dead = true;
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
      tlRef.current = null;
      ctx.revert();
    };
  }, []);
  useScrub(
    root,
    (p) => {
      prog.current = p;
      tlRef.current?.progress(p);
    },
    { finalValue: 0 },
  );
  return (
    <Stage r={root} g1="rgba(255,143,122,.5)" g2="rgba(79,141,255,.24)">
      <div className="u108-page absolute inset-x-0 top-[62%] h-[110%] px-[6%]">
        <div className="grid h-[40%] grid-cols-3 gap-[2%]">
          {[
            { t: "Wool overshirt", p: "₹6,800", i: 3 },
            { t: "Field trouser", p: "₹5,200", i: 2 },
            { t: "Knit beanie", p: "₹1,400", i: 0 },
          ].map((c, k) => (
            <div key={k} className="relative overflow-hidden rounded-[18px]">
              <Img i={c.i} w={800} h={700} />
              <div className="absolute bottom-[6%] left-[6%] right-[6%] flex justify-between text-[14px]" style={{ fontFamily: F.mr }}>
                <span>{c.t}</span>
                <span className="font-semibold">{c.p}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="u108-bar absolute inset-x-0 top-0 h-[78px] border-b border-transparent">
        <div className="u108-slot absolute left-[6%] top-[22px] h-[34px] w-[60px]" />
        <div className="absolute right-[6%] top-0 flex h-full items-center gap-8 text-[14px] text-white/75" style={{ fontFamily: F.mr }}>
          <span>Shop</span>
          <span>Journal</span>
          <span>Stores</span>
          <span className="rounded-full border border-white/25 px-4 py-1.5">Bag (2)</span>
        </div>
      </div>
      <div className="absolute left-[6%] top-[18%]">
        <p
          className="u108-logo whitespace-nowrap leading-[0.9]"
          style={{ fontFamily: F.sy, fontWeight: 800, fontSize: "clamp(56px,6.5vw,110px)", letterSpacing: "-0.03em" }}
          aria-label="Orrin Vale"
        >
          {U108_WORD.split("").map((c, i) => (
            <span key={i} className="u108-ch inline-block overflow-hidden align-top" style={{ color: U108_KEY.includes(i) ? "#ff8f7a" : undefined }}>
              {c === " " ? "\u00a0" : c}
            </span>
          ))}
        </p>
        <p className="u108-sub mt-4 text-[15px] text-white/65" style={{ fontFamily: F.mr }}>
          Workwear for slow weekends · Autumn 26
        </p>
      </div>
    </Stage>
  );
}

/* ───────────────────────── U109 · Distorted link line ───────────────────────── */
const U109_L = [
  { t: "Collections", shape: "line" as const },
  { t: "Journal", shape: "circle" as const },
  { t: "Visit the studio", shape: "square" as const },
];
function U109Shape({ i, shape }: { i: number; shape: "line" | "circle" | "square" }) {
  const id = `u109-f${i}`;
  if (shape === "line")
    return (
      <svg className="pointer-events-none absolute -bottom-[22px] left-0 h-[40px] w-full overflow-visible" viewBox="0 0 300 40" preserveAspectRatio="none" aria-hidden>
        <filter id={id} filterUnits="userSpaceOnUse" x="-10" y="0" width="320" height="40">
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.25" numOctaves="1" seed="2" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <path className="u109-s" d="M0 20 H300" stroke="#ffd59a" strokeWidth="2.5" fill="none" vectorEffect="non-scaling-stroke" filter={`url(#${id})`} />
      </svg>
    );
  return (
    <svg className="pointer-events-none absolute -inset-x-[9%] -inset-y-[30%] h-[160%] w-[118%] overflow-visible" viewBox="0 0 300 120" preserveAspectRatio="none" aria-hidden>
      <filter id={id} filterUnits="userSpaceOnUse" x="-10" y="-10" width="320" height="140">
        <feTurbulence type="fractalNoise" baseFrequency="0.03 0.06" numOctaves="1" seed="5" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      {shape === "circle" ? (
        <ellipse className="u109-s" cx="150" cy="60" rx="146" ry="54" stroke="#9fd8ff" strokeWidth="2.5" fill="none" vectorEffect="non-scaling-stroke" filter={`url(#${id})`} />
      ) : (
        <rect className="u109-s" x="4" y="6" width="292" height="108" stroke="#c8ff8a" strokeWidth="2.5" fill="none" vectorEffect="non-scaling-stroke" filter={`url(#${id})`} />
      )}
    </svg>
  );
}
function U109() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const tws = useRef<(gsap.core.Timeline | null)[]>([]);
  useEffect(
    () => () => {
      tws.current.forEach((t) => t?.kill());
    },
    [],
  );
  useWalk(root, dot, {
    sel: ".u109-l",
    move: 0.5,
    rest: 0.45,
    onChange: (now, _prev, el) => {
      if (now < 0) return;
      const fx = el.querySelector(`#u109-f${now} feDisplacementMap`);
      const tu = el.querySelector(`#u109-f${now} feTurbulence`);
      if (!fx || !tu) return;
      tws.current[now]?.kill();
      const base = U109_L[now].shape === "line" ? 1 : 1.6;
      const tl = gsap.timeline();
      [26, 9, 22, 5, 15, 2, 0].forEach((v, k) => {
        tl.to(fx, { attr: { scale: v * base }, duration: k === 0 ? 0.12 : 0.13, ease: "sine.inOut" });
        tl.set(tu, { attr: { seed: 2 + ((k * 7) % 11) } }, "<");
      });
      tws.current[now] = tl;
    },
  });
  return (
    <Stage r={root} g1="rgba(159,216,255,.55)" g2="rgba(255,213,154,.22)">
      <Label className="absolute left-[7%] top-[10%]">Studio menu</Label>
      <nav className="absolute inset-0 flex flex-col items-center justify-center gap-[clamp(28px,6vh,64px)]">
        {U109_L.map((l, i) => (
          <a
            key={i}
            href="#u109"
            onClick={(e) => e.preventDefault()}
            className="u109-l relative inline-block leading-[1.05] text-white/70"
            style={{ fontFamily: F.fr, fontSize: "clamp(40px,4.6vw,76px)" }}
          >
            {l.t}
            <U109Shape i={i} shape={l.shape} />
          </a>
        ))}
      </nav>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U110 · Hover preview with mini map ───────────────────────── */
const U110_I = [
  { t: "Dune Chair", p: "₹24,500", i: 3, hue: 0 },
  { t: "Harbour Lamp", p: "₹6,400", i: 0, hue: 0 },
  { t: "Fern Planter", p: "₹3,200", i: 2, hue: 0 },
  { t: "Ember Vase", p: "₹2,750", i: 1, hue: 0 },
  { t: "Tide Bowl", p: "₹1,900", i: 0, hue: 140 },
  { t: "Saffron Throw", p: "₹4,800", i: 3, hue: -30 },
];
function U110() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const cur = useRef(0);
  useEffect(() => () => void tl.current?.kill(), []);
  const show = (el: HTMLDivElement, i: number) => {
    if (i < 0 || i === cur.current) return;
    cur.current = i;
    const q = gsap.utils.selector(el);
    const imgs = q(".u110-pi");
    const cover = q(".u110-cov")[0];
    const cap = q(".u110-cap")[0];
    const pr = q(".u110-pr")[0];
    tl.current?.kill();
    tl.current = gsap
      .timeline()
      .fromTo(cover, { scaleY: 0, transformOrigin: "50% 100%" }, { scaleY: 1, duration: 0.22, ease: "power2.in" })
      .add(() => {
        imgs.forEach((im, k) => gsap.set(im, { autoAlpha: k === i ? 1 : 0 }));
        if (cap) cap.textContent = U110_I[i].t;
        if (pr) pr.textContent = U110_I[i].p;
      })
      .set(cover, { transformOrigin: "50% 0%" })
      .to(cover, { scaleY: 0, duration: 0.32, ease: "power2.out" })
      .fromTo(imgs[i], { filter: "brightness(4)", scale: 1.06 }, { filter: "brightness(1)", scale: 1, duration: 0.6, ease: "power2.out" }, "<")
      .fromTo([cap, pr], { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: "power3.out" }, "<0.05");
  };
  usePointer(
    root,
    dot,
    (t, el) => {
      const g = el.querySelector(".u110-grid");
      if (!g) return { x: 0, y: 0, inside: false };
      const b = rel(g, el);
      const w = (Math.PI * 2) / 5.6;
      return { x: b.l + b.w * (0.5 + 0.42 * Math.sin(w * t)), y: b.t + b.h * (0.5 + 0.36 * Math.sin(2 * w * t)), inside: true };
    },
    (p, el) => {
      const g = el.querySelector(".u110-grid");
      const md = el.querySelector<HTMLElement>(".u110-md");
      if (!g || !md) return;
      const b = rel(g, el);
      const ths = [...el.querySelectorAll(".u110-th")];
      const idx = p.inside ? ths.findIndex((n) => inBox(rel(n, el), p.x, p.y, 7)) : -1;
      g.classList.toggle("has", idx >= 0);
      ths.forEach((n, k) => n.classList.toggle("on", k === idx));
      el.querySelectorAll(".u110-mc").forEach((n, k) => n.classList.toggle("on", k === (idx >= 0 ? idx : cur.current)));
      md.style.left = `${(clamp(0, 1, (p.x - b.l) / b.w) * 100).toFixed(2)}%`;
      md.style.top = `${(clamp(0, 1, (p.y - b.t) / b.h) * 100).toFixed(2)}%`;
      show(el, idx);
    },
  );
  const hueStyle = (h: number): CSSProperties => (h ? { filter: `hue-rotate(${h}deg)` } : {});
  return (
    <Stage r={root} g1="rgba(255,213,154,.55)" g2="rgba(79,141,255,.24)">
      <div className="absolute bottom-[8%] left-[5%] top-[8%] w-[52%] overflow-hidden rounded-[22px] border border-white/10">
        {U110_I.map((it, k) => (
          <div key={k} className="u110-pi absolute inset-0" style={k === 0 ? undefined : { visibility: "hidden", opacity: 0 }}>
            <div className="absolute inset-0" style={hueStyle(it.hue)}>
              <Img i={it.i} w={1100} h={1000} />
            </div>
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="u110-cov absolute inset-0 bg-[#ffd59a]" style={{ transform: "scaleY(0)" }} />
        <div className="absolute bottom-[7%] left-[6%] right-[6%] flex items-end justify-between overflow-hidden">
          <p className="u110-cap leading-none" style={{ fontFamily: F.is, fontSize: "clamp(36px,3.8vw,64px)" }}>
            {U110_I[0].t}
          </p>
          <p className="u110-pr text-[18px] font-semibold" style={{ fontFamily: F.sg }}>
            {U110_I[0].p}
          </p>
        </div>
        <div className="absolute right-[5%] top-[6%] w-[132px] rounded-[12px] border border-white/20 bg-black/45 p-2">
          <div className="relative grid aspect-[3/2] grid-cols-3 grid-rows-2 gap-[3px]">
            {U110_I.map((_, k) => (
              <span key={k} className={`u110-mc rounded-[3px] bg-white/20 ${k === 0 ? "on" : ""}`} />
            ))}
            <span className="u110-md absolute h-[9px] w-[9px] -ml-[4.5px] -mt-[4.5px] rounded-full bg-white shadow-[0_0_0_3px_rgba(0,0,0,.35)]" style={{ left: "16%", top: "25%" }} />
          </div>
          <p className="mt-1.5 text-center text-[12px] text-white/70" style={{ fontFamily: F.mr }}>
            Map
          </p>
        </div>
      </div>
      <div className="absolute bottom-[14%] left-[62%] right-[5%] top-[14%]">
        <Label className="absolute -top-[34px] left-0">Objects · 06</Label>
        <div className="u110-grid grid h-full grid-cols-3 grid-rows-2 gap-[14px]">
          {U110_I.map((it, k) => (
            <div key={k} className="u110-th relative overflow-hidden rounded-[14px]">
              <div className="absolute inset-0" style={hueStyle(it.hue)}>
                <Img i={it.i} w={400} h={400} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U111 · Grid card info boxes hover ───────────────────────── */
const U111_C = [
  { t: "Atlas Lamp", p: "₹6,900", n: "No.014", i: 0 },
  { t: "Ridge Chair", p: "₹21,400", n: "No.027", i: 3 },
  { t: "Fold Shelf", p: "₹12,800", n: "No.031", i: 2 },
];
function U111() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const tls = useRef<(gsap.core.Timeline | undefined)[]>([]);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      tls.current = [...el.querySelectorAll(".u111-card")].map((card) => {
        const q = gsap.utils.selector(card);
        const tl = gsap.timeline({ paused: true });
        tl.fromTo(q(".u111-im"), { filter: "brightness(1) saturate(1)", scale: 1 }, { filter: "brightness(.55) saturate(1.6)", scale: 1.06, duration: 0.6, ease: "power3.out" }, 0)
          .fromTo(q(".u111-tl"), { x: -70, y: -50, rotation: -16, opacity: 0 }, { x: 0, y: 0, rotation: 0, opacity: 1, duration: 0.55, ease: "power3.out" }, 0.05)
          .fromTo(q(".u111-br"), { x: 70, y: 50, rotation: 14, opacity: 0 }, { x: 0, y: 0, rotation: 0, opacity: 1, duration: 0.55, ease: "power3.out" }, 0.12)
          .fromTo(q(".u111-bl"), { x: -60, y: 60, rotation: 10, opacity: 0 }, { x: 0, y: 0, rotation: 0, opacity: 1, duration: 0.55, ease: "power3.out" }, 0.18)
          .fromTo(q(".u111-tr"), { x: 60, y: -50, rotation: 12, opacity: 0 }, { x: 0, y: 0, rotation: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, 0.1)
          .fromTo(q(".u111-ch"), { yPercent: 110 }, { yPercent: 0, duration: 0.4, stagger: 0.045, ease: "power3.out" }, 0.2);
        return tl;
      });
    }, el);
    return () => ctx.revert();
  }, []);
  useWalk(root, dot, {
    sel: ".u111-card",
    move: 0.55,
    rest: 0.45,
    onChange: (now, prev) => {
      const a = tls.current;
      if (prev >= 0 && a[prev]) a[prev].timeScale(1.8).reverse();
      if (now >= 0 && a[now]) a[now].timeScale(1).play();
    },
  });
  const box = "absolute rounded-[10px] bg-[#f4efe6] px-3 py-2 text-[#14100a] shadow-[0_10px_30px_rgba(0,0,0,.35)]";
  return (
    <Stage r={root} g1="rgba(255,143,122,.5)" g2="rgba(159,216,255,.24)">
      <div className="absolute left-[6%] right-[6%] top-[9%] flex items-end justify-between">
        <p className="leading-none" style={{ fontFamily: F.sy, fontWeight: 800, fontSize: "clamp(30px,3vw,50px)", textTransform: "uppercase" }}>
          Objects for rooms
        </p>
        <Label>Hover a piece</Label>
      </div>
      <div className="absolute bottom-[9%] left-[6%] right-[6%] top-[24%] grid grid-cols-3 gap-[2.4%]">
        {U111_C.map((c, k) => (
          <div key={k} className="u111-card relative overflow-hidden rounded-[20px] border border-white/10">
            <div className="u111-im absolute inset-0">
              <Img i={c.i} w={700} h={800} />
            </div>
            <div className={`u111-tl left-[6%] top-[6%] ${box}`} style={{ opacity: 0 }}>
              <p className="text-[16px] font-semibold" style={{ fontFamily: F.fr }}>
                {c.t}
              </p>
            </div>
            <div className={`u111-tr right-[6%] top-[6%] overflow-hidden ${box.replace("bg-[#f4efe6]", "bg-[#ff8f7a]")}`} style={{ opacity: 0 }}>
              <p className="flex text-[14px] font-bold tabular-nums" style={{ fontFamily: F.sg }}>
                {c.n.split("").map((ch, j) => (
                  <span key={j} className="u111-ch inline-block">
                    {ch}
                  </span>
                ))}
              </p>
            </div>
            <div className={`u111-bl bottom-[6%] left-[6%] ${box}`} style={{ opacity: 0 }}>
              <p className="text-[13px]" style={{ fontFamily: F.mr }}>
                View piece →
              </p>
            </div>
            <div className={`u111-br bottom-[6%] right-[6%] ${box}`} style={{ opacity: 0 }}>
              <p className="text-[18px] font-bold" style={{ fontFamily: F.sg }}>
                {c.p}
              </p>
            </div>
          </div>
        ))}
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  {
    code: "U103",
    name: "Waveform loader bars",
    how: "A row of thin bars scales on Y in staggered sine phases like a live audio waveform while a progress count loops; pure CSS bars, paused off screen.",
    kind: "play",
    C: U103,
  },
  {
    code: "U104",
    name: "Liquid fill gauge",
    how: "A round gauge fills with liquid whose surface waves; the level rises to 72% with a counter (the number turns dark where the liquid covers it), drains and rises again.",
    kind: "play",
    C: U104,
  },
  {
    code: "U105",
    name: "Directional motion blur on move",
    how: "Carousel slides and the sliding title smear in their direction of travel: fixed-blur ghost copies fade in with the velocity. A fake pointer presses the arrows.",
    kind: "play",
    C: U105,
  },
  {
    code: "U106",
    name: "Bouncy draggable",
    how: "A fake pointer grabs a card and drags it: it squashes and stretches along the drag direction and tilts with speed, then springs back to its spot on release. Real drag works too.",
    kind: "play",
    C: U106,
  },
  {
    code: "U107",
    name: "Expanding bar tabs",
    how: "Tabs sit as thin colour bars; the chosen bar scales out (scaleX, then scaleY) into the full content panel while its title slides in. A fake pointer picks each tab.",
    kind: "play",
    C: U107,
  },
  {
    code: "U109",
    name: "Distorted link line",
    how: "Hovering a link runs a turbulence displacement on its underline, circle or square: a rough jitter that settles. A fake pointer reads down the menu.",
    kind: "play",
    C: U109,
  },
  {
    code: "U110",
    name: "Hover preview with mini map",
    how: "A fake pointer sweeps a figure-eight over the thumbnails: the big preview switches under a scaling cover panel with a 4× bright flash, and a mini map dot tracks the pointer.",
    kind: "play",
    C: U110,
  },
  {
    code: "U111",
    name: "Grid card info boxes hover",
    how: "Hovering a card dims and saturates its image while small info boxes fly in from the corners with rotation and the item number's characters stagger up. A fake pointer walks the grid.",
    kind: "play",
    C: U111,
  },
];
