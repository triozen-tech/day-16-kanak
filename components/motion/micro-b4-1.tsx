"use client";

// Micro-interactions, batch 4 · group 1 (MOTION-MENU U02–U13). Small focused demos for /lab/motion.
// Every hover / click demo also plays by itself: a visible fake pointer (ring) walks over the targets and drives the
// same state the real mouse does; the real mouse takes over for 2.5 s whenever it moves. Timed demos (U07, U11) loop
// while on screen and pause off screen. A CSS-only glow loop never stops (and sits on top again, screen-blended).
// ?static=1 / reduced motion: no JS, the markup shows the hovered / final state of the first item.
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { scene, useTicker } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = {
  sg: "Space Grotesk Variable",
  fr: "Fraunces Variable",
  is: "Instrument Serif",
  sy: "Syne Variable",
  mr: "Manrope Variable",
};

const EZ = "cubic-bezier(.2,.7,.2,1)";
const EIO = "cubic-bezier(.65,0,.35,1)";

const CSS = `
.b4g1u-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.42)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.2)),transparent 70%);animation:b4g1u-drift 5.8s linear infinite alternate;will-change:transform}
@keyframes b4g1u-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b4g1u-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;pointer-events:none;z-index:40;opacity:0;transition:opacity .25s}
.b4g1u-dot>span{display:block;width:100%;height:100%;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4)}

/* U02 vinyl */
.u02-al{position:relative;width:clamp(220px,32vh,320px);aspect-ratio:1/1}
.u02-disc{position:absolute;top:4%;left:4%;width:92%;height:92%;z-index:0;transition:transform .9s ${EZ}}
.u02-al.on .u02-disc{transform:translateX(56%)}
.u02-spin{position:absolute;inset:0;border-radius:50%;background:repeating-radial-gradient(circle at 50% 50%,#121217 0 1.6px,#202029 1.6px 3.2px);box-shadow:0 24px 50px rgba(0,0,0,.55);animation:u02-spin 1.9s linear infinite;animation-play-state:paused}
.u02-al.on .u02-spin{animation-play-state:running}
@keyframes u02-spin{to{transform:rotate(360deg)}}
.u02-sheen{position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 20deg,transparent 0 10%,rgba(255,255,255,.14) 14%,transparent 20% 60%,rgba(255,255,255,.1) 64%,transparent 70%);pointer-events:none}
.u02-sleeve{position:absolute;inset:0;z-index:1;border-radius:6px;overflow:hidden;box-shadow:0 30px 60px rgba(0,0,0,.5);transition:transform .9s ${EZ}}
.u02-al.on .u02-sleeve{transform:translateX(-8%) rotate(-1.5deg)}

/* U03 bounce */
.u03-card{transition:border-color .4s,background-color .4s,transform .5s ${EZ}}
.u03-card.on{border-color:rgba(255,255,255,.3);background-color:rgba(255,255,255,.07);transform:translateY(-6px)}

/* U05 door */
.u05-fig{perspective:1300px}
.u05-img{position:absolute;inset:0;z-index:2;transition:transform .85s ${EIO},filter .85s;backface-visibility:hidden}
.u05-door .u05-img{transform-origin:0 50%}
.u05-door.on .u05-img{transform:rotateY(-104deg);filter:brightness(.55)}
.u05-slide.on .u05-img{transform:translateY(-80%)}
.u05-scale .u05-img{transform-origin:100% 0}
.u05-scale.on .u05-img{transform:scale(.36) translate(-12%,12%);filter:brightness(.9)}
.u05-cap>*{opacity:.0;transform:translateY(14px);transition:opacity .5s .2s,transform .6s .2s ${EZ}}
.u05-fig.on .u05-cap>*{opacity:1;transform:none}

/* U06 brackets */
.u06-l{position:relative;display:inline-block;color:rgba(238,242,255,.42);transition:color .35s}
.u06-l::before,.u06-l::after{position:absolute;top:0;color:#c8ff8a;opacity:0;transition:transform .32s ${EZ},opacity .3s}
.u06-l::before{content:"[";left:-.62em;transform:translateX(-26px)}
.u06-l::after{content:"]";right:-.62em;transform:translateX(26px)}
.u06-l.on{color:#fff}
.u06-l.on::before,.u06-l.on::after{opacity:1;transform:translateX(0)}

/* U07 */
.u07-ring path,.u07-ck path{stroke-dasharray:1}

/* U08 arrows */
.u08-so{width:72px;transition:width .55s ${EIO},background-color .4s}
.u08-so.on{width:360px;background-color:rgba(255,255,255,.14)}
.u08-so .u08-in{opacity:0;transform:translateX(-12px);transition:opacity .35s,transform .45s ${EZ}}
.u08-so.on .u08-in{opacity:1;transform:none;transition-delay:.15s}
.u08-fl{perspective:900px}
.u08-panel{transform-origin:100% 50%;transform:rotateY(-92deg);opacity:0;transition:transform .6s ${EIO},opacity .3s}
.u08-fl.on .u08-panel{transform:rotateY(0);opacity:1}
.u08-btn{transition:background-color .35s,color .35s,transform .35s ${EZ}}
.u08-so.on .u08-btn,.u08-fl.on .u08-btn{background:#ffb36b;color:#120c06}
.u08-s{opacity:0;transition:opacity .7s}
.u08-s.on{opacity:1}

/* U09 scribbles */
.u09-p{stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset .75s cubic-bezier(.5,0,.2,1)}
.u09-a.on .u09-p{stroke-dashoffset:0}
.u09-a{transition:color .4s}
.u09-a.on{color:#fff}

/* U10 tiles */
.u10-img{transition:transform 1.1s ${EZ},filter .8s}
.u10-t.on .u10-img{transform:scale(1.08);filter:brightness(.5) saturate(.9)}
.u10-bx{position:absolute;background:rgba(255,255,255,.85);transition:transform .6s ${EIO}}
.u10-h{left:7%;right:7%;height:1px;transform:scaleX(0)}
.u10-v{top:7%;bottom:7%;width:1px;transform:scaleY(0)}
.u10-t.on .u10-bx{transform:none}
.u10-t.on .u10-v{transition-delay:.12s}
.u10-cap h4,.u10-cap p{opacity:0;transform:translateY(36px);transition:opacity .5s,transform .7s ${EZ}}
.u10-t.on .u10-cap h4{opacity:1;transform:none;transition-delay:.15s}
.u10-t.on .u10-cap p{opacity:1;transform:none;transition-delay:.28s}

/* U11 indicators */
.u11-s{opacity:0;transition:opacity .8s}
.u11-s.on{opacity:1}
.u11-kb{animation:u11-kb 6s linear infinite alternate}
@keyframes u11-kb{to{transform:scale(1.08) translate(-1.5%,1%)}}
.u11-d{width:12px;height:12px;border-radius:999px;background:rgba(255,255,255,.28);transition:width .6s ${EIO},background-color .6s}
.u11-d.on{width:58px;background:#4f8dff}
.u11-col{transition:transform .6s ${EIO}}
.u11-ml{transition:left .45s ${EIO} var(--dl,0s),right .45s ${EIO} var(--dr,0s)}

/* U12 words */
.u12-w{position:relative;display:inline-block;color:#ff9fb1;background-image:linear-gradient(currentColor,currentColor);background-size:100% 2px;background-repeat:no-repeat;background-position:0 92%;transition:color .3s}
.u12-w.on{color:#fff}
.u12-show>img{animation:u12-show 1.5s steps(1) infinite}
.u12-show>img:nth-child(2){animation-delay:.5s}
.u12-show>img:nth-child(3){animation-delay:1s}
@keyframes u12-show{0%{opacity:1}33.4%,100%{opacity:0}}
.u12-vid{animation:u12-vid 3s linear infinite alternate}
@keyframes u12-vid{0%{transform:scale(1.25) translate(-8%,0)}100%{transform:scale(1.25) translate(8%,-4%)}}

html.is-static .b4g1u-glow,html.is-static .u02-spin,html.is-static .u11-kb,html.is-static .u12-show>img,html.is-static .u12-vid{animation:none}
html.is-static {
  .b4g1u-glow,.u02-spin,.u11-kb,.u12-show>img,.u12-vid{animation:none}
  .u02-disc,.u02-sleeve,.u05-img,.u06-l,.u08-so,.u08-panel,.u09-p,.u10-img,.u10-bx,.u11-d,.u11-col,.u11-ml{transition:none}
}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop, again on top (screen blend) so covered stages never freeze. */
function Stage({ r, children, g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; g1?: string; g2?: string }) {
  return (
    <div ref={r} className="relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0d16] text-[#eef2ff]">
      <style href="b4g1u-css" precedence="default">
        {CSS}
      </style>
      <div className="b4g1u-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
      <div className="b4g1u-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.35, zIndex: 35 } as CSSProperties} aria-hidden />
    </div>
  );
}

/** The visible fake pointer (a ring). Its inner span can be scaled for a "press". */
const Dot = ({ r }: { r: RefObject<HTMLDivElement | null> }) => (
  <div ref={r} className="b4g1u-dot" aria-hidden>
    <span />
  </div>
);

type Pt = { x: number; y: number; inside: boolean };
type Box = { l: number; t: number; w: number; h: number };

function rel(node: Element, root: Element): Box {
  const a = node.getBoundingClientRect();
  const r = root.getBoundingClientRect();
  return { l: a.left - r.left, t: a.top - r.top, w: a.width, h: a.height };
}
const inBox = (b: Box, x: number, y: number) => x >= b.l && x <= b.l + b.w && y >= b.t && y <= b.t + b.h;

/** Pointer driver: the real mouse wins for 2.5 s after it last moved; otherwise `script` moves a visible fake ring. */
function usePointer(root: RefObject<HTMLDivElement | null>, dot: RefObject<HTMLDivElement | null>, script: (t: number, el: HTMLDivElement) => Pt, frame: (p: Pt, el: HTMLDivElement, fake: boolean) => void) {
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

const easeIO = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/** A path that holds at each point and glides to the next during the last `move` part of every `seg` seconds. */
function stepPath(t: number, pts: [number, number][], seg: number, move = 0.35): [number, number] {
  const n = pts.length;
  const k = Math.floor(t / seg);
  const f = t / seg - k;
  const a = pts[k % n];
  const b = pts[(k + 1) % n];
  const m = f < 1 - move ? 0 : easeIO((f - (1 - move)) / move);
  return [a[0] + (b[0] - a[0]) * m, a[1] + (b[1] - a[1]) * m];
}

/** Hover walk: the fake ring visits targets (`sel`) in `order` (-1 = a resting spot off the targets); whichever target
 *  holds the pointer (fake or real) gets the class "on". `onChange` runs when the hovered target changes. */
function useWalk(
  root: RefObject<HTMLDivElement | null>,
  dot: RefObject<HTMLDivElement | null>,
  o: {
    sel: string;
    order: number[];
    seg?: number;
    move?: number;
    wob?: number;
    at?: (b: Box, i: number) => [number, number];
    off?: (w: number, h: number) => [number, number];
    onChange?: (now: number, prev: number, p: Pt, el: HTMLDivElement) => void;
  },
) {
  const cur = useRef(-2);
  usePointer(
    root,
    dot,
    (t, el) => {
      const tg = el.querySelectorAll(o.sel);
      const w = el.clientWidth;
      const h = el.clientHeight;
      const pts: [number, number][] = o.order.map((i) => {
        if (i < 0 || !tg[i]) return o.off ? o.off(w, h) : [w * 0.5, h * 0.92];
        const b = rel(tg[i], el);
        return o.at ? o.at(b, i) : [b.l + b.w / 2, b.t + b.h / 2];
      });
      const [x, y] = stepPath(t, pts, o.seg ?? 1.2, o.move ?? 0.38);
      const wb = o.wob ?? 9;
      return { x: x + Math.sin(t * 2.1) * wb, y: y + Math.cos(t * 1.7) * wb * 0.8, inside: true };
    },
    (p, el) => {
      const tg = [...el.querySelectorAll(o.sel)];
      const idx = p.inside ? tg.findIndex((n) => inBox(rel(n, el), p.x, p.y)) : -1;
      if (idx === cur.current) return;
      const prev = cur.current;
      cur.current = idx;
      tg.forEach((n, i) => n.classList.toggle("on", i === idx));
      o.onChange?.(idx, prev, p, el);
    },
  );
}

/** "play" helper: waits for fonts, builds a looping animation in a gsap.context, plays it only while on screen. */
function usePlay(ref: RefObject<HTMLElement | null>, build: (root: HTMLElement, onClean: (fn: () => void) => void) => gsap.core.Animation | void) {
  const b = useRef(build);
  b.current = build;
  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    let dead = false;
    let on = false;
    let anim: gsap.core.Animation | void;
    const cleans: (() => void)[] = [];
    const ctx = gsap.context(() => {}, root);
    const sync = () => {
      if (!anim) return;
      if (on) anim.play();
      else anim.pause();
    };
    const io = new IntersectionObserver(
      ([e]) => {
        on = e.isIntersecting;
        sync();
      },
      { threshold: 0.1 },
    );
    io.observe(root);
    Promise.resolve(document.fonts?.ready).then(() => {
      if (dead) return;
      ctx.add(() => {
        anim = b.current(root, (fn) => cleans.push(fn));
      });
      sync();
    });
    return () => {
      dead = true;
      io.disconnect();
      ctx.revert();
      cleans.forEach((f) => f());
    };
  }, [ref]);
}

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, className = "", w = 600, h = 800 }: { i: number; className?: string; w?: number; h?: number }) => (
  <img src={scene(i, w, h)} alt="" className={`block h-full w-full object-cover ${className}`} draggable={false} />
);

const Eyebrow = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <p className={`text-[13px] uppercase tracking-[0.22em] text-white/55 ${className}`} style={{ fontFamily: F.sg }}>
    {children}
  </p>
);

/* ───────────────────────── U02 · Vinyl slides out ───────────────────────── */
const U02_ALBUMS = [
  { t: "Late Bloom", a: "Nadia Rook", p: "₹2,490", bg: "linear-gradient(140deg,#ff7a59 0%,#b0306a 55%,#3a1460 100%)", lb: "#ffb36b" },
  { t: "Low Tide Club", a: "The Marlowe Six", p: "₹2,190", bg: "linear-gradient(160deg,#18c48f 0%,#0f6a74 50%,#0b1f4a 100%)", lb: "#c8ff8a" },
];
function U02() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useWalk(root, dot, {
    sel: ".u02-al",
    order: [0, 1, -1],
    seg: 1.35,
    at: (b) => [b.l + b.w * 0.42, b.t + b.h * 0.5],
    off: (w, h) => [w * 0.5, h * 0.9],
  });
  return (
    <Stage r={root} g1="rgba(255,122,89,.34)" g2="rgba(24,196,143,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[5vh]">
        <Eyebrow>Hollow Groove Records · new pressings</Eyebrow>
        <div className="flex items-start gap-[9vw]">
          {U02_ALBUMS.map((al, i) => (
            <div key={al.t} className="flex flex-col gap-5">
              <div className={`u02-al ${i === 0 ? "on" : ""}`} data-cursor="Play">
                <div className="u02-disc" aria-hidden>
                  <div className="u02-spin">
                    <div className="absolute left-1/2 top-1/2 h-[36%] w-[36%] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: al.lb }}>
                      <span className="absolute left-1/2 top-[14%] h-[22%] w-[8%] -translate-x-1/2 rounded-full bg-black/70" />
                      <span className="absolute left-1/2 top-1/2 h-[12%] w-[12%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0a0d16]" />
                    </div>
                  </div>
                  <div className="u02-sheen" />
                </div>
                <div className="u02-sleeve" style={{ background: al.bg }}>
                  <div className="absolute inset-0 flex flex-col justify-between p-[9%]">
                    <span className="text-[12px] uppercase tracking-[0.3em] text-white/75" style={{ fontFamily: F.sg }}>
                      LP · 33⅓
                    </span>
                    <span className="text-[clamp(30px,3.4vh,40px)] leading-[0.95] text-white" style={{ fontFamily: F.fr, fontWeight: 500 }}>
                      {al.t}
                    </span>
                  </div>
                  <div className="absolute -right-[18%] -top-[18%] h-[62%] w-[62%] rounded-full border border-white/25" />
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-6" style={{ fontFamily: F.sg }}>
                <div>
                  <p className="text-[18px] font-[600]">{al.t}</p>
                  <p className="text-[14px] text-white/55">{al.a}</p>
                </div>
                <p className="text-[18px] text-white/85">{al.p}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U03 · Product bounce card ───────────────────────── */
function Bottle({ a, b, c }: { a: string; b: string; c: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 120 220" className="h-full w-auto overflow-visible" aria-hidden>
      <defs>
        <linearGradient id={`${id}g`} x1="0" x2="1">
          <stop offset="0" stopColor={a} />
          <stop offset=".42" stopColor={b} />
          <stop offset=".55" stopColor={c} />
          <stop offset="1" stopColor={a} />
        </linearGradient>
      </defs>
      <rect x="44" y="6" width="32" height="30" rx="5" fill="#1a1d27" />
      <rect x="48" y="34" width="24" height="18" fill={a} />
      <path d="M48 52 Q16 62 16 98 V196 Q16 212 32 212 H88 Q104 212 104 196 V98 Q104 62 72 52 Z" fill={`url(#${id}g)`} />
      <rect x="28" y="118" width="64" height="54" rx="4" fill="rgba(255,255,255,.82)" />
      <rect x="36" y="130" width="40" height="5" rx="2" fill="#1a1d27" />
      <rect x="36" y="142" width="26" height="3" rx="1.5" fill="#1a1d27" opacity=".5" />
    </svg>
  );
}
const U03_ITEMS = [
  { n: "Cedar Mist", s: "Eau de parfum · 50 ml", p: "₹1,850", c: ["#2a4d3a", "#7fd6a8", "#e9fff2"] },
  { n: "Saffron Dusk", s: "Eau de parfum · 50 ml", p: "₹2,200", c: ["#6a3410", "#ffb36b", "#fff1e0"] },
  { n: "Salt Fern", s: "Eau de toilette · 75 ml", p: "₹1,650", c: ["#1c2f5a", "#7fb2ff", "#eaf3ff"] },
];
function U03() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    return () => {
      if (el) gsap.killTweensOf(el.querySelectorAll(".u03-prod,.u03-sh"));
    };
  }, []);
  useWalk(root, dot, {
    sel: ".u03-card",
    order: [0, 1, 2, -1],
    seg: 1.15,
    off: (w, h) => [w * 0.5, h * 0.93],
    onChange: (now, _prev, _p, el) => {
      if (now < 0) return;
      const card = el.querySelectorAll(".u03-card")[now];
      const prod = card?.querySelector(".u03-prod");
      const sh = card?.querySelector(".u03-sh");
      if (!prod || !sh) return;
      gsap.killTweensOf([prod, sh]);
      gsap
        .timeline()
        .to(prod, { y: -96, rotateX: 16, rotateY: -14, scale: 1.07, duration: 0.38, ease: "power2.out" })
        .to(sh, { scale: 0.5, opacity: 0.25, duration: 0.38, ease: "power2.out" }, 0)
        .to(prod, { y: 0, rotateX: 0, rotateY: 0, scale: 1, duration: 0.3, ease: "power2.in" })
        .to(sh, { scale: 1.06, opacity: 0.75, duration: 0.3, ease: "power2.in" }, "<")
        .to(prod, { y: -16, scaleY: 1.02, duration: 0.14, ease: "power1.out" })
        .to(sh, { scale: 0.9, opacity: 0.6, duration: 0.14, ease: "power1.out" }, "<")
        .to(prod, { y: 0, scaleY: 1, duration: 0.14, ease: "power1.in" })
        .to(sh, { scale: 1, opacity: 0.7, duration: 0.14, ease: "power1.in" }, "<");
    },
  });
  return (
    <Stage r={root} g1="rgba(127,214,168,.3)" g2="rgba(255,179,107,.24)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[4vh]">
        <Eyebrow>Maison Verel · the travel trio</Eyebrow>
        <div className="flex gap-[2.4vw]">
          {U03_ITEMS.map((it) => (
            <div key={it.n} className="u03-card flex w-[clamp(240px,22vw,320px)] flex-col items-center rounded-[22px] border border-white/10 bg-white/[0.04] px-6 pb-6 pt-[6vh]" data-cursor="Add">
              <div className="relative flex h-[clamp(190px,28vh,260px)] items-end justify-center" style={{ perspective: 700 }}>
                <div className="u03-sh absolute bottom-[-6px] left-1/2 ml-[-60px] h-[18px] w-[120px] rounded-[50%] bg-black opacity-70 blur-[6px]" />
                <div className="u03-prod relative h-full" style={{ transformOrigin: "50% 100%" }}>
                  <Bottle a={it.c[0]} b={it.c[1]} c={it.c[2]} />
                </div>
              </div>
              <div className="mt-7 flex w-full items-end justify-between" style={{ fontFamily: F.sg }}>
                <div>
                  <p className="text-[20px] font-[600]">{it.n}</p>
                  <p className="text-[13px] text-white/55">{it.s}</p>
                </div>
                <p className="text-[18px]">{it.p}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U04 · Direction-aware hover overlay ───────────────────────── */
const U04_TILES = ["Riverstone Cabin", "Paper Lantern Café", "Kora Ceramics", "North Pier Hotel", "Tamarind House", "Field Notes Press"];
// 0 top · 1 right · 2 bottom · 3 left, from the point's angle to the tile centre (aspect-corrected)
function edgeOf(b: Box, x: number, y: number) {
  const dx = (x - b.l - b.w / 2) * (b.w > b.h ? b.h / b.w : 1);
  const dy = (y - b.t - b.h / 2) * (b.h > b.w ? b.w / b.h : 1);
  return Math.round((Math.atan2(dy, dx) * (180 / Math.PI) + 180) / 90 + 3) % 4;
}
const EDGE: { xPercent: number; yPercent: number }[] = [
  { xPercent: 0, yPercent: -101 },
  { xPercent: 101, yPercent: 0 },
  { xPercent: 0, yPercent: 101 },
  { xPercent: -101, yPercent: 0 },
];
const EDGE_NAME = ["top", "right", "bottom", "left"];
function U04() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const ovs = el.querySelectorAll(".u04-ov");
    gsap.set(ovs, { x: 0, y: 0, xPercent: 0, yPercent: 101 });
    return () => {
      gsap.killTweensOf(ovs);
    };
  }, []);
  usePointer(
    root,
    dot,
    (t, el) => {
      const g = el.querySelector(".u04-grid");
      if (!g) return { x: 0, y: 0, inside: false };
      const b = rel(g, el);
      const w = (Math.PI * 2) / 6.4;
      // slow figure-eight that leaves the grid at both ends, so every edge gets entered
      return { x: b.l + b.w / 2 + b.w * 0.56 * Math.sin(t * w), y: b.t + b.h / 2 + b.h * 0.42 * Math.sin(2 * t * w + 0.4), inside: true };
    },
    (p, el) => {
      const tiles = [...el.querySelectorAll(".u04-t")];
      const idx = p.inside ? tiles.findIndex((n) => inBox(rel(n, el), p.x, p.y)) : -1;
      const st = el as HTMLDivElement & { _u04?: number };
      const prev = st._u04 ?? -1;
      if (idx === prev) return;
      st._u04 = idx;
      if (prev >= 0 && tiles[prev]) {
        const b = rel(tiles[prev], el);
        const ov = tiles[prev].querySelector(".u04-ov");
        if (ov) gsap.to(ov, { ...EDGE[edgeOf(b, p.x, p.y)], duration: 0.45, ease: "power3.out", overwrite: true });
      }
      if (idx >= 0) {
        const b = rel(tiles[idx], el);
        const e = edgeOf(b, p.x, p.y);
        const ov = tiles[idx].querySelector(".u04-ov");
        const tag = tiles[idx].querySelector(".u04-from");
        if (tag) tag.textContent = `in from ${EDGE_NAME[e]}`;
        if (ov) gsap.fromTo(ov, EDGE[e], { xPercent: 0, yPercent: 0, duration: 0.45, ease: "power3.out", overwrite: true });
      }
    },
  );
  return (
    <Stage r={root} g1="rgba(255,77,109,.3)" g2="rgba(79,141,255,.24)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[3.5vh]">
        <Eyebrow>Studio Halden · selected work</Eyebrow>
        <div className="u04-grid grid w-[min(78%,1020px)] grid-cols-3 gap-[14px]">
          {U04_TILES.map((t, i) => (
            <figure key={t} className="u04-t relative aspect-[16/10] overflow-hidden rounded-[14px]" data-cursor="View">
              <Img i={i} w={640} h={400} />
              <div className="u04-ov absolute inset-0 flex flex-col justify-between bg-[#ff4d6d]/90 p-[7%]" style={{ transform: i === 0 ? "none" : "translateY(101%)" }}>
                <span className="u04-from text-[12px] uppercase tracking-[0.22em] text-white/80" style={{ fontFamily: F.sg }}>
                  Case study 0{i + 1}
                </span>
                <div className="flex items-end justify-between gap-3">
                  <span className="text-[clamp(20px,1.8vw,28px)] leading-[1.05] text-white" style={{ fontFamily: F.fr, fontWeight: 500 }}>
                    {t}
                  </span>
                  <span className="text-[22px] text-white">→</span>
                </div>
              </div>
            </figure>
          ))}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U05 · Image door-swing caption reveal ───────────────────────── */
const U05_CARDS = [
  { v: "u05-door", lab: "Door swing", n: "Kiln Bowl No. 4", d: "Wood-fired stoneware, ash glaze", p: "₹3,400" },
  { v: "u05-slide", lab: "Slide up", n: "Tide Pitcher", d: "Hand-thrown, 1.2 litres", p: "₹4,150" },
  { v: "u05-scale", lab: "Scale down", n: "Moss Cup Set", d: "Four cups, celadon inside", p: "₹2,800" },
];
function U05() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useWalk(root, dot, { sel: ".u05-fig", order: [0, 1, 2, -1], seg: 1.0, move: 0.5, off: (w, h) => [w * 0.5, h * 0.94] });
  return (
    <Stage r={root} g1="rgba(255,179,107,.55)" g2="rgba(127,214,168,.2)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[3.5vh]">
        <Eyebrow>Ashfield Pottery · this week&apos;s kiln</Eyebrow>
        <div className="flex gap-[2.6vw]">
          {U05_CARDS.map((c, i) => (
            <div key={c.n} className="flex flex-col items-center gap-3">
              <figure className={`u05-fig ${c.v} ${i === 0 ? "on" : ""} relative aspect-[4/5] w-[clamp(220px,20vw,300px)] overflow-hidden rounded-[16px]`} data-cursor="Open">
                <div className="u05-cap absolute inset-0 flex flex-col justify-end gap-2 bg-[linear-gradient(160deg,#1b2233,#121722)] p-[10%]">
                  <span className="text-[12px] uppercase tracking-[0.22em] text-[#ffb36b]" style={{ fontFamily: F.sg }}>
                    No. 0{i + 4}
                  </span>
                  <span className="text-[clamp(24px,2vw,32px)] leading-[1.02]" style={{ fontFamily: F.fr, fontWeight: 500 }}>
                    {c.n}
                  </span>
                  <span className="text-[14px] text-white/60">{c.d}</span>
                  <span className="mt-2 flex items-center justify-between border-t border-white/15 pt-3 text-[16px]" style={{ fontFamily: F.sg }}>
                    {c.p}
                    <span className="text-white/70">Add to bag →</span>
                  </span>
                </div>
                <div className="u05-img overflow-hidden rounded-[16px]">
                  <Img i={i + 1} w={480} h={600} />
                </div>
              </figure>
              <span className="text-[13px] uppercase tracking-[0.2em] text-white/45" style={{ fontFamily: F.sg }}>
                {c.lab}
              </span>
            </div>
          ))}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U06 · Bracket slide-in link ───────────────────────── */
const U06_LINKS = ["Collections", "Atelier", "Journal", "Visit us"];
function U06() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useWalk(root, dot, {
    sel: ".u06-l",
    order: [0, 1, 2, 3, -1],
    seg: 0.95,
    wob: 6,
    at: (b) => [b.l + b.w * 0.62, b.t + b.h * 0.55],
    off: (w, h) => [w * 0.76, h * 0.5],
  });
  return (
    <Stage r={root} g1="rgba(200,255,138,.22)" g2="rgba(79,141,255,.24)">
      <div className="absolute inset-0 grid grid-cols-[1fr_1.4fr] items-center px-[7%]">
        <div>
          <Eyebrow>Verde Lane · menu</Eyebrow>
          <p className="mt-4 max-w-[22ch] text-[17px] leading-[1.5] text-white/60" style={{ fontFamily: F.mr }}>
            Square brackets slide in from both sides and lock around the link under the pointer.
          </p>
        </div>
        <nav className="flex flex-col items-start gap-[1.2vh]">
          {U06_LINKS.map((l, i) => (
            <a
              key={l}
              href="#"
              onClick={(e) => e.preventDefault()}
              className={`u06-l ${i === 0 ? "on" : ""} text-[clamp(48px,5.4vw,86px)] leading-[1.08] tracking-[-0.02em]`}
              style={{ fontFamily: F.sy, fontWeight: 600 }}
            >
              {l}
            </a>
          ))}
        </nav>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U07 · Button morphs into ring loader ───────────────────────── */
function U07() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const btn = el.querySelector<HTMLElement>(".u07-btn");
    const label = el.querySelector(".u07-label");
    const done = el.querySelector(".u07-done");
    const ring = el.querySelector(".u07-ring");
    const ringP = el.querySelector(".u07-ring .u07-arc");
    const ck = el.querySelector(".u07-ck path");
    const d = dot.current;
    const dIn = d?.querySelector("span");
    if (!btn || !label || !done || !ring || !ringP || !ck || !d || !dIn) return;
    const W = btn.offsetWidth;
    const H = btn.offsetHeight;
    const b = rel(btn, el);
    const cx = b.l + b.w / 2;
    const cy = b.t + b.h / 2;
    const ACC = "rgba(255,122,89,1)";
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(d, { opacity: 1, x: cx + 280, y: cy + 150 })
      .set(btn, { width: W, backgroundColor: ACC, scale: 1 })
      .set(label, { opacity: 1, y: 0 })
      .set(done, { opacity: 0 })
      .set(ring, { opacity: 0 })
      .set([ringP, ck], { strokeDashoffset: 1 })
      .to(d, { x: cx + 60, y: cy + 10, duration: 0.55, ease: "power2.inOut" })
      // press
      .to(dIn, { scale: 0.6, duration: 0.1, ease: "power2.out" })
      .to(btn, { scale: 0.95, duration: 0.1, ease: "power2.out" }, "<")
      .to([dIn, btn], { scale: 1, duration: 0.14, ease: "power2.out" })
      // squeeze into a circle
      .to(label, { opacity: 0, y: -10, duration: 0.18 }, "<")
      .to(btn, { width: H, backgroundColor: "rgba(255,122,89,0.1)", duration: 0.45, ease: "power3.inOut" }, "<0.04")
      .to(d, { x: cx + 170, y: cy + 120, duration: 1.7, ease: "sine.inOut" }, "<")
      .set(ring, { opacity: 1 })
      .to(ringP, { strokeDashoffset: 0, duration: 1.25, ease: "power1.inOut" })
      .to(ring, { opacity: 0, duration: 0.15 })
      // expand back with a check
      .to(btn, { width: W, backgroundColor: "rgba(43,217,159,1)", duration: 0.45, ease: "power3.inOut" })
      .set(done, { opacity: 1 }, "-=0.2")
      .to(ck, { strokeDashoffset: 0, duration: 0.35, ease: "power2.out" }, "<")
      .fromTo(".u07-dtxt", { opacity: 0, x: 10 }, { opacity: 1, x: 0, duration: 0.3 }, "<0.05")
      .to(d, { x: cx + 280, y: cy + 150, duration: 0.7, ease: "sine.inOut" }, "<")
      .to(done, { opacity: 0, duration: 0.25 }, "+=0.15")
      .to(btn, { backgroundColor: ACC, duration: 0.3 }, "<")
      .fromTo(label, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3 }, "<0.08");
    const click = () => tl.restart();
    btn.addEventListener("click", click);
    onClean(() => btn.removeEventListener("click", click));
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,122,89,.32)" g2="rgba(43,217,159,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[4vh]" style={{ fontFamily: F.sg }}>
        <div className="text-center">
          <Eyebrow>Checkout · 2 items</Eyebrow>
          <p className="mt-3 text-[clamp(56px,6vw,92px)] font-[600] leading-none tracking-[-0.03em]">₹4,280</p>
        </div>
        <div className="relative flex h-[88px] w-[440px] items-center justify-center">
          <button type="button" className="u07-btn relative h-[88px] w-[440px] overflow-hidden rounded-full border border-[#ff7a59]/60 bg-[#ff7a59] text-[#140904]">
            <span className="u07-label absolute inset-0 flex items-center justify-center whitespace-nowrap text-[24px] font-[600]">Place order</span>
            <span className="u07-done absolute inset-0 flex items-center justify-center gap-3 whitespace-nowrap text-[24px] font-[600] opacity-0">
              <svg className="u07-ck h-[30px] w-[30px]" viewBox="0 0 30 30" fill="none" aria-hidden>
                <path d="M6 15.5 L12.5 22 L24 9" stroke="#06140f" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
              </svg>
              <span className="u07-dtxt">Order placed</span>
            </span>
          </button>
          <svg className="u07-ring pointer-events-none absolute left-1/2 top-1/2 ml-[-52px] mt-[-52px] h-[104px] w-[104px] -rotate-90 opacity-0" viewBox="0 0 104 104" fill="none" aria-hidden>
            <circle cx="52" cy="52" r="48" stroke="rgba(255,255,255,.12)" strokeWidth="4" />
            <path className="u07-arc" d="M100 52 A48 48 0 1 1 4 52 A48 48 0 1 1 100 52" stroke="#ff7a59" strokeWidth="4" strokeLinecap="round" pathLength={1} />
          </svg>
        </div>
        <p className="text-[14px] text-white/50">Free shipping over ₹2,000 · Kestrel Supply Co.</p>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U08 · Arrow nav hover previews ───────────────────────── */
const U08_SLIDES = [
  { n: "Coast House", p: "₹18,500 / night" },
  { n: "Stone Kitchen", p: "₹12,900 / night" },
  { n: "Fern Loft", p: "₹9,400 / night" },
  { n: "Dune Studio", p: "₹15,200 / night" },
];
function U08() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const N = U08_SLIDES.length;
  const prev = (idx + N - 1) % N;
  const next = (idx + 1) % N;
  useWalk(root, dot, {
    sel: ".u08-hit",
    order: [0, -1, 1, -1],
    seg: 1.05,
    wob: 5,
    at: (b, i) => (i === 0 ? [b.l + 36, b.t + b.h / 2] : [b.l + b.w - 36, b.t + b.h / 2]),
    off: (w, h) => [w * 0.5, h * 0.62],
  });
  return (
    <Stage r={root} g1="rgba(255,179,107,.3)" g2="rgba(79,141,255,.24)">
      <div className="absolute inset-[5%] overflow-hidden rounded-[22px]">
        {U08_SLIDES.map((s, i) => (
          <div key={s.n} className={`u08-s absolute inset-0 ${i === idx ? "on" : ""}`}>
            <Img i={i} w={1400} h={760} className="brightness-[.62]" />
          </div>
        ))}
        <div className="absolute bottom-[8%] left-1/2 w-[50%] -translate-x-1/2 text-center">
          <Eyebrow>
            Stay 0{idx + 1} / 0{N} · Hideaway Homes
          </Eyebrow>
          <p className="mt-2 text-[clamp(44px,4.8vw,76px)] leading-none" style={{ fontFamily: F.is }}>
            {U08_SLIDES[idx].n}
          </p>
          <p className="mt-2 text-[16px] text-white/70" style={{ fontFamily: F.sg }}>
            {U08_SLIDES[idx].p}
          </p>
        </div>
        {/* prev: slide-out */}
        <div className="u08-hit u08-so on absolute left-[3%] top-1/2 mt-[-36px] flex h-[72px] items-center overflow-hidden rounded-full bg-white/10 backdrop-blur-md">
          <button type="button" aria-label="Previous" onClick={() => setIdx(prev)} className="u08-btn flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-white/15 text-[26px]">
            ←
          </button>
          <div className="u08-in flex shrink-0 items-center gap-4 whitespace-nowrap pl-3 pr-6">
            <div className="h-[52px] w-[78px] overflow-hidden rounded-[10px]">
              <Img i={prev} w={240} h={160} />
            </div>
            <div style={{ fontFamily: F.sg }}>
              <p className="text-[12px] uppercase tracking-[0.2em] text-white/55">Previous</p>
              <p className="text-[18px] font-[600]">{U08_SLIDES[prev].n}</p>
            </div>
          </div>
        </div>
        {/* next: flip */}
        <div className="u08-hit u08-fl absolute right-[3%] top-1/2 mt-[-36px] h-[72px] w-[72px]">
          <div className="u08-panel absolute right-[86px] top-1/2 mt-[-58px] flex h-[116px] w-[300px] items-center gap-4 rounded-[18px] bg-[#f4efe6] p-3 text-[#14110c] shadow-[0_20px_50px_rgba(0,0,0,.45)]">
            <div className="h-full w-[120px] shrink-0 overflow-hidden rounded-[12px]">
              <Img i={next} w={300} h={240} />
            </div>
            <div style={{ fontFamily: F.sg }}>
              <p className="text-[12px] uppercase tracking-[0.2em] text-black/50">Next stay</p>
              <p className="text-[19px] font-[600] leading-tight">{U08_SLIDES[next].n}</p>
              <p className="mt-1 text-[13px] text-black/60">{U08_SLIDES[next].p}</p>
            </div>
          </div>
          <button type="button" aria-label="Next" onClick={() => setIdx(next)} className="u08-btn absolute inset-0 flex items-center justify-center rounded-full bg-white/15 text-[26px] backdrop-blur-md">
            →
          </button>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U09 · Scribble marker under inline link ───────────────────────── */
function U09() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useWalk(root, dot, {
    sel: ".u09-a",
    order: [0, 1, 2, -1],
    seg: 1.25,
    wob: 5,
    off: (w, h) => [w * 0.5, h * 0.88],
  });
  const link = "u09-a relative isolate inline-block cursor-pointer text-[#ffd59a]";
  return (
    <Stage r={root} g1="rgba(255,213,154,.26)" g2="rgba(255,77,109,.2)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-[8%]">
        <Eyebrow>Loomhouse · our making</Eyebrow>
        <p className="max-w-[24ch] text-center text-[clamp(40px,4vw,64px)] leading-[1.22] text-white/80" style={{ fontFamily: F.is }}>
          Our linen is woven in{" "}
          <span className={`${link} on`}>
            Kannur
            <svg className="pointer-events-none absolute -bottom-[0.22em] left-[-4%] h-[0.38em] w-[108%] overflow-visible" viewBox="0 0 200 20" preserveAspectRatio="none" fill="none" aria-hidden>
              <path className="u09-p" pathLength={1} d="M3 12 C 22 3, 40 19, 62 10 S 102 2, 124 11 S 164 19, 197 7" stroke="#ffb36b" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </svg>
          </span>
          , washed with{" "}
          <span className={link}>
            river stones
            <svg className="pointer-events-none absolute left-[-9%] top-[-22%] h-[144%] w-[118%] overflow-visible" viewBox="0 0 200 80" preserveAspectRatio="none" fill="none" aria-hidden>
              <path className="u09-p" pathLength={1} d="M150 7 C 80 -3, 9 13, 7 40 C 5 67, 92 77, 162 66 C 201 58, 197 18, 138 11 C 108 7, 72 10, 50 17" stroke="#ff4d6d" strokeWidth="2.6" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </svg>
          </span>{" "}
          and shipped in a{" "}
          <span className={link}>
            <svg className="pointer-events-none absolute left-[-3%] top-[22%] -z-10 h-[62%] w-[106%] overflow-visible" viewBox="0 0 200 40" preserveAspectRatio="none" fill="none" aria-hidden>
              <path className="u09-p" pathLength={1} d="M4 22 C 60 18, 130 26, 196 18" stroke="rgba(200,255,138,.42)" strokeWidth="26" strokeLinecap="round" />
            </svg>
            paper sleeve
          </span>
          .
        </p>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U10 · Image tile: borders draw in + caption rises ───────────────────────── */
const U10_TILES = [
  { n: "Monsoon Linen", p: "Shirts from ₹2,890" },
  { n: "Clay & Ash", p: "Tableware from ₹1,450" },
  { n: "Night Market", p: "Bags from ₹3,200" },
];
function U10() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useWalk(root, dot, { sel: ".u10-t", order: [0, 1, 2, -1], seg: 1.3, off: (w, h) => [w * 0.5, h * 0.94] });
  return (
    <Stage r={root} g1="rgba(79,141,255,.3)" g2="rgba(255,179,107,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[3.5vh]">
        <Eyebrow>Indigo Row · shop by edit</Eyebrow>
        <div className="flex gap-[2vw]">
          {U10_TILES.map((t, i) => (
            <figure key={t.n} className={`u10-t ${i === 0 ? "on" : ""} relative aspect-[4/5] w-[clamp(230px,21vw,310px)] overflow-hidden rounded-[6px]`} data-cursor="Shop">
              <div className="u10-img absolute inset-0">
                <Img i={i + 1} w={480} h={600} />
              </div>
              <span className="u10-bx u10-h top-[7%]" style={{ transformOrigin: "0 50%" }} />
              <span className="u10-bx u10-h bottom-[7%]" style={{ transformOrigin: "100% 50%" }} />
              <span className="u10-bx u10-v left-[7%]" style={{ transformOrigin: "50% 100%" }} />
              <span className="u10-bx u10-v right-[7%]" style={{ transformOrigin: "50% 0" }} />
              <figcaption className="u10-cap absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
                <h4 className="text-[clamp(28px,2.4vw,38px)] leading-none" style={{ fontFamily: F.fr, fontWeight: 500 }}>
                  {t.n}
                </h4>
                <p className="text-[14px] uppercase tracking-[0.18em] text-white/80" style={{ fontFamily: F.sg }}>
                  {t.p}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U11 · Pagination dot stretches into line ───────────────────────── */
const U11_SLIDES = ["Spring Drop", "Desert Tones", "Harbour Blues", "Ember Nights"];
const U11_S = 34;
function U11() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    let i = 0;
    const N = U11_SLIDES.length;
    const ml = el.querySelector<HTMLElement>(".u11-ml");
    const col = el.querySelector<HTMLElement>(".u11-col");
    const title = el.querySelector<HTMLElement>(".u11-title");
    const step = () => {
      const n = (i + 1) % N;
      const fwd = n > i;
      el.querySelectorAll(".u11-s").forEach((s, k) => s.classList.toggle("on", k === n));
      el.querySelectorAll(".u11-d").forEach((s, k) => s.classList.toggle("on", k === n));
      if (col) col.style.transform = `translateY(${-n}em)`;
      if (ml) {
        ml.style.setProperty("--dl", fwd ? ".16s" : "0s");
        ml.style.setProperty("--dr", fwd ? "0s" : ".16s");
        ml.style.left = `${n * U11_S}px`;
        ml.style.right = `${(N - 1 - n) * U11_S}px`;
      }
      if (title) gsap.fromTo(title, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", onStart: () => (title.textContent = U11_SLIDES[n]) });
      i = n;
    };
    return gsap.timeline({ repeat: -1 }).to({}, { duration: 1.2 }).call(step);
  });
  const W = 3 * U11_S + 12;
  return (
    <Stage r={root} g1="rgba(79,141,255,.32)" g2="rgba(255,122,89,.2)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[4vh]">
        <div className="relative aspect-[16/7] w-[min(60%,820px)] overflow-hidden rounded-[20px]">
          {U11_SLIDES.map((s, k) => (
            <div key={s} className={`u11-s absolute inset-0 ${k === 0 ? "on" : ""}`}>
              <div className="u11-kb h-full w-full">
                <Img i={k} w={1200} h={525} className="brightness-[.7]" />
              </div>
            </div>
          ))}
          <div className="absolute bottom-[10%] left-[6%]">
            <Eyebrow>Fieldwear Co. · lookbook</Eyebrow>
            <p className="u11-title mt-2 text-[clamp(36px,3.6vw,56px)] leading-none" style={{ fontFamily: F.fr, fontWeight: 500 }}>
              {U11_SLIDES[0]}
            </p>
          </div>
        </div>
        <div className="grid w-[min(60%,820px)] grid-cols-3 items-end gap-6" style={{ fontFamily: F.sg }}>
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-[44px] items-center gap-[12px]">
              {U11_SLIDES.map((s, k) => (
                <span key={s} className={`u11-d ${k === 0 ? "on" : ""}`} />
              ))}
            </div>
            <span className="text-[12px] uppercase tracking-[0.2em] text-white/45">Dot → line</span>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-[44px] items-center text-[40px] font-[600] leading-none tracking-[-0.02em]">
              <span>0</span>
              <span className="inline-block h-[1em] overflow-hidden">
                <span className="u11-col flex flex-col">
                  {U11_SLIDES.map((s, k) => (
                    <span key={s} className="block h-[1em] leading-none">
                      {k + 1}
                    </span>
                  ))}
                </span>
              </span>
              <span className="ml-3 text-[20px] text-white/40">/ 0{U11_SLIDES.length}</span>
            </div>
            <span className="text-[12px] uppercase tracking-[0.2em] text-white/45">Number flip</span>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-[44px] items-center">
              <div className="relative h-[12px]" style={{ width: W }}>
                {U11_SLIDES.map((s, k) => (
                  <span key={s} className="absolute top-0 h-[12px] w-[12px] rounded-full bg-white/28" style={{ left: k * U11_S }} />
                ))}
                <span className="u11-ml absolute top-0 h-[12px] rounded-full bg-[#ff7a59]" style={{ left: 0, right: W - 12 }} />
              </div>
            </div>
            <span className="text-[12px] uppercase tracking-[0.2em] text-white/45">Magnetic line</span>
          </div>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── U12 · Media pop on text hover ───────────────────────── */
function U12() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const pops = el.querySelectorAll(".u12-pop");
    gsap.set(pops, { scale: 0, opacity: 0, transformOrigin: "50% 100%" });
    return () => {
      gsap.killTweensOf(pops);
    };
  }, []);
  useWalk(root, dot, {
    sel: ".u12-w",
    order: [0, 1, 2, -1],
    seg: 1.25,
    wob: 5,
    off: (w, h) => [w * 0.5, h * 0.9],
    onChange: (now, prev, _p, el) => {
      const words = el.querySelectorAll(".u12-w");
      if (prev >= 0) {
        const pop = words[prev]?.querySelector(".u12-pop");
        if (pop) gsap.to(pop, { scale: 0, rotate: 10, opacity: 0, duration: 0.3, ease: "power2.in", overwrite: true });
      }
      if (now >= 0) {
        const pop = words[now]?.querySelector(".u12-pop");
        if (pop) gsap.fromTo(pop, { scale: 0, rotate: -16, y: 24, opacity: 0 }, { scale: 1, rotate: now % 2 ? 5 : -4, y: 0, opacity: 1, duration: 0.6, ease: "back.out(1.5)", overwrite: true });
      }
    },
  });
  const pop = "u12-pop absolute bottom-[calc(100%+10px)] left-[-120px] h-[170px] w-[240px] overflow-hidden rounded-[14px] shadow-[0_24px_60px_rgba(0,0,0,.5)]";
  return (
    <Stage r={root} g1="rgba(255,77,109,.3)" g2="rgba(79,141,255,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-[8%]">
        <Eyebrow>Okra Films · photo + motion studio</Eyebrow>
        <h3 className="max-w-[20ch] text-center text-[clamp(44px,4.6vw,74px)] leading-[1.18] tracking-[-0.01em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
          We shoot{" "}
          <span className="u12-w on">
            coffee
            <span className="absolute bottom-full left-1/2 w-0">
              <span className={pop} style={{ mixBlendMode: "screen", transform: "rotate(-4deg)" }}>
                <Img i={3} w={480} h={340} />
              </span>
            </span>
          </span>
          ,{" "}
          <span className="u12-w">
            clay
            <span className="absolute bottom-full left-1/2 w-0">
              <span className={`${pop} u12-show`} style={{ mixBlendMode: "lighten", opacity: 0 }}>
                {[1, 2, 0].map((k) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={k} src={scene(k, 480, 340)} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ opacity: k === 1 ? 1 : 0 }} draggable={false} />
                ))}
              </span>
            </span>
          </span>{" "}
          and{" "}
          <span className="u12-w">
            slow mornings
            <span className="absolute bottom-full left-1/2 w-0">
              <span className={pop} style={{ mixBlendMode: "screen", opacity: 0 }}>
                <span className="u12-vid block h-full w-full">
                  <Img i={0} w={480} h={340} />
                </span>
                <span className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/55 px-3 py-1 text-[12px] text-white" style={{ fontFamily: F.sg }}>
                  <span className="h-2 w-2 rounded-full bg-[#ff4d6d]" /> 0:12
                </span>
              </span>
            </span>
          </span>{" "}
          for small brands.
        </h3>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U13 · Proximity-based hover ───────────────────────── */
const U13_WORD = "COME CLOSER";
const U13_ITEMS = ["Linen tote", "Brass lamp", "Oat throw", "Clay vase", "Cane stool", "Wool rug"];
function U13() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const cache = useRef<{ tiles: { el: HTMLElement; x: number; y: number; v: number }[]; letters: { el: HTMLElement; x: number; y: number; v: number; s: number }[]; w: number } | null>(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(() => (cache.current = null));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  usePointer(
    root,
    dot,
    (t, el) => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const om = (Math.PI * 2) / 7;
      return { x: w / 2 + w * 0.4 * Math.sin(t * om), y: h * 0.52 + h * 0.3 * Math.sin(2 * t * om), inside: true };
    },
    (p, el) => {
      if (!cache.current) {
        // the outer spans never move, so their rects are the rest positions
        const mk = (n: Element, i: number) => {
          const b = rel(n, el);
          return { el: n.firstElementChild as HTMLElement, x: b.l + b.w / 2, y: b.t + b.h / 2, v: 0, s: i % 2 ? 1 : -1 };
        };
        cache.current = { tiles: [...el.querySelectorAll(".u13-t")].map(mk), letters: [...el.querySelectorAll(".u13-c")].map(mk), w: el.clientWidth };
      }
      const C = cache.current;
      const R = Math.max(220, C.w * 0.2);
      const near = (x: number, y: number) => (p.inside ? Math.max(0, 1 - Math.hypot(p.x - x, p.y - y) / R) : 0);
      C.tiles.forEach((o) => {
        o.v += (near(o.x, o.y) - o.v) * 0.14;
        const k = o.v;
        o.el.style.transform = `scale(${(0.86 + k * 0.24).toFixed(3)})`;
        o.el.style.filter = `grayscale(${(1 - k).toFixed(2)}) blur(${((1 - k) * 3).toFixed(2)}px) brightness(${(0.6 + k * 0.4).toFixed(2)})`;
      });
      C.letters.forEach((o) => {
        const k0 = near(o.x, o.y);
        o.v += (k0 - o.v) * 0.16;
        const k = o.v * o.v;
        const dx = o.x - p.x;
        const dy = o.y - p.y;
        const d = Math.hypot(dx, dy) || 1;
        o.el.style.transform = `translate3d(${((dx / d) * k * 46).toFixed(1)}px,${((dy / d) * k * 46).toFixed(1)}px,0) rotate(${(o.s * k * 22).toFixed(1)}deg)`;
        o.el.style.color = `rgba(${Math.round(238 + 17 * k)},${Math.round(242 - 60 * k)},${Math.round(255 - 140 * k)},${(0.35 + k * 0.65).toFixed(2)})`;
      });
    },
  );
  return (
    <Stage r={root} g1="rgba(255,179,107,.28)" g2="rgba(79,141,255,.24)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[6vh]">
        <div className="flex gap-[1.6vw]">
          {U13_ITEMS.map((n, i) => (
            <span key={n} className="u13-t block">
              <span className="block w-[clamp(130px,11vw,170px)]" style={{ transform: i === 2 ? "scale(1.1)" : "scale(.86)", filter: i === 2 ? "none" : "grayscale(1) brightness(.6)" }}>
                <span className="block aspect-[4/5] overflow-hidden rounded-[14px]">
                  <Img i={i} w={340} h={425} />
                </span>
                <span className="mt-3 block text-[14px] font-[500]" style={{ fontFamily: F.sg }}>
                  {n}
                </span>
                <span className="block text-[13px] text-white/55" style={{ fontFamily: F.sg }}>
                  ₹{[1890, 4250, 3600, 2100, 5400, 7800][i].toLocaleString("en-IN")}
                </span>
              </span>
            </span>
          ))}
        </div>
        <p className="flex text-[clamp(48px,6.6vw,108px)] leading-none tracking-[-0.01em]" style={{ fontFamily: F.sy, fontWeight: 800 }} aria-label={U13_WORD}>
          {U13_WORD.split("").map((c, i) => (
            <span key={i} className="u13-c inline-block" aria-hidden>
              <span className="inline-block text-white/40">{c === " " ? "\u00a0" : c}</span>
            </span>
          ))}
        </p>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  {
    code: "U02",
    name: "Vinyl slides out",
    how: "Hovering an album slides the record out of its sleeve and sets it spinning; leaving slides it back. A fake pointer walks the albums.",
    kind: "play",
    C: U02,
  },
  {
    code: "U03",
    name: "Product bounce card",
    how: "On hover the product hops up in 3D and lands with a small bounce while its shadow shrinks and grows. A fake pointer visits each card.",
    kind: "play",
    C: U03,
  },
  {
    code: "U04",
    name: "Direction-aware hover overlay",
    how: "An overlay slides in from the edge the pointer entered and out toward the edge it left. A fake pointer sweeps a figure-eight over the grid.",
    kind: "play",
    C: U04,
  },
  {
    code: "U05",
    name: "Image door-swing caption reveal",
    how: "On hover the photo swings open like a door, slides up or scales away to uncover the caption card below. A fake pointer opens each.",
    kind: "play",
    C: U05,
  },
  {
    code: "U06",
    name: "Bracket slide-in link",
    how: "On hover square brackets slide in from both sides and lock tight around the menu link. A fake pointer runs down the menu.",
    kind: "play",
    C: U06,
  },
  {
    code: "U07",
    name: "Button morphs into ring loader",
    how: "A click squeezes the button into a circle, a ring draws as progress, then it expands back into a button with a check. Loops by itself.",
    kind: "play",
    C: U07,
  },
  {
    code: "U08",
    name: "Arrow nav hover previews",
    how: "Hovering the prev / next arrow opens a preview of that slide: slide-out pill on the left, flip-in card on the right. A fake pointer hovers both.",
    kind: "play",
    C: U08,
  },
  {
    code: "U09",
    name: "Scribble marker under inline link",
    how: "On hover a hand-drawn stroke (wave, loop, marker) draws under the inline link like a pen and erases on leave. A fake pointer reads the line.",
    kind: "play",
    C: U09,
  },
  {
    code: "U10",
    name: "Image tile: borders draw in + caption rises",
    how: "On hover thin borders draw around the tile, the photo dims and zooms, and the caption rises into place. A fake pointer visits each tile.",
    kind: "play",
    C: U10,
  },
  {
    code: "U11",
    name: "Pagination dot stretches into line",
    how: "As the slides advance, the active dot stretches into a line, the number flips and a magnetic bar stretches to the next bullet. Loops by itself.",
    kind: "play",
    C: U11,
  },
  {
    code: "U12",
    name: "Media pop on text hover",
    how: "Hovering a word pops a photo, slideshow or clip out of it with a scale-and-twist, blended into the page. A fake pointer reads the words.",
    kind: "play",
    C: U12,
  },
  {
    code: "U13",
    name: "Proximity-based hover",
    how: "Tiles sharpen into colour and letters scatter more the closer the pointer gets, by distance. A fake pointer sweeps a figure-eight.",
    kind: "play",
    C: U13,
  },
];
