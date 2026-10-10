"use client";

// Micro-interactions, batch 14 · group 3 (MOTION-MENU U112–U123). Small focused demos for /lab/motion.
// Every hover / click demo also plays by itself: a visible fake pointer (ring) walks over the targets (hover demos) or
// a scripted timeline moves it and "clicks" (click demos). The real mouse takes over for 2.5 s whenever it moves.
// A CSS-only glow loop never stops (and sits on top again, screen-blended) so covered stages never freeze.
// ?static=1 / reduced motion: no JS, the markup shows a sensible final state.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, SplitText, prefersReducedMotion } from "@/lib/gsap";
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

const CSS = `
.b14g3-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.5)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.22)),transparent 70%);animation:b14g3-drift 5.6s linear infinite alternate;will-change:transform}
@keyframes b14g3-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b14g3-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;pointer-events:none;z-index:40;opacity:0;transition:opacity .25s}
.b14g3-dot>span{display:block;width:100%;height:100%;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4)}
.b14g3-dot.tap>span{animation:b14g3-tap .32s ease-out}
@keyframes b14g3-tap{40%{transform:scale(.55);background:rgba(255,255,255,.6)}100%{transform:scale(1)}}

/* U113 fixed logo */
.u113-blur{filter:blur(7px)}
.u113-tag{transition:background-color .35s,color .35s}
.u113-tag.on{background:#ffd9a0;color:#1a1204}

/* U114 tabs */
.u114-tab{position:relative;z-index:2;transition:color .35s}
.u114-tab.on{color:#0b0e17}

/* U115 search */
.u115-caret{animation:u115-blink .9s steps(1) infinite}
@keyframes u115-blink{50%{opacity:0}}

/* U116 jelly radio */
.u116-c{transition:background-color .35s,color .35s,border-color .35s}
.u116-c.on{background:#ffb36b;color:#1b1003;border-color:#ffb36b}
.u116-r{transition:border-color .35s}
.u116-c.on .u116-r{border-color:#1b1003}
.u116-i{transform:scale(0);transition:transform .45s cubic-bezier(.3,1.6,.5,1)}
.u116-c.on .u116-i{transform:scale(1)}

/* U117 transition panel */
.u117-tab{transition:color .35s}
.u117-tab.on{color:#fff}

/* U118 mirror echo */
.u118-w{position:relative;display:inline-block;line-height:1;cursor:default}
.u118-m{display:block;transition:transform .5s ${EZ},color .4s}
.u118-s{position:absolute;left:0;display:block;pointer-events:none;white-space:nowrap;transition:transform .5s ${EZ}}
.u118-s1{top:-.62em;clip-path:inset(52% 0 38% 0);opacity:.8;transition-delay:75ms}
.u118-s2{top:.62em;clip-path:inset(38% 0 52% 0);opacity:.55;transition-delay:100ms}
.u118-s3{top:.82em;clip-path:inset(45% 0 47% 0);opacity:.32;transition-delay:200ms}
.u118-w.on .u118-m{transform:var(--sh);color:#fff}
.u118-w.on .u118-s{transform:var(--sh)}

/* U119 bold copy */
.u119-bg{transition:opacity .7s ${EZ}}
.u119-hi{opacity:0}
.u119-box.on .u119-hi{opacity:1}
.u119-box.on .u119-lo{opacity:0}
.u119-fg{font-size:30px;transition:font-size .7s ${EZ},letter-spacing .7s ${EZ}}
.u119-box.on .u119-fg{font-size:96px;letter-spacing:-.03em}

/* U121 slide arrow */
.u121-b{position:relative;overflow:hidden;transition:background-color .4s,color .4s,border-color .4s}
.u121-ar{position:absolute;left:16px;top:50%;width:44px;height:44px;margin-top:-22px;border-radius:50%;display:grid;place-items:center;opacity:0;transform:translateX(-40px);transition:opacity .35s,transform .5s ${EZ}}
.u121-lab{display:inline-block;transition:transform .5s ${EZ}}
.u121-b.on .u121-ar{opacity:1;transform:none}
.u121-b.on .u121-lab{transform:translateX(24px)}

/* U122 scan */
.u122-h{position:relative;white-space:nowrap;transition:color .35s}
.u122-h::before{content:"";position:absolute;left:-.12em;right:-.12em;top:.08em;bottom:.02em;border-radius:6px;background:#9ff0c4;transform:scaleX(0);transform-origin:0 50%;transition:transform .4s ${EZ};z-index:-1}
.u122-h.on{color:#05170d}
.u122-h.on::before{transform:scaleX(1)}

html.is-static .b14g3-glow,html.is-static .u115-caret{animation:none}
html.is-static {
  .b14g3-glow,.u115-caret{animation:none}
  .u118-m,.u118-s,.u119-bg,.u119-fg,.u121-ar,.u121-lab,.u122-h,.u122-h::before,.u116-i{transition:none}
}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop, again on top (screen blend) so covered stages never freeze. */
function Stage({ r, children, g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; g1?: string; g2?: string }) {
  return (
    <div ref={r} className="relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0d16] text-[#eef2ff]">
      <style href="b14g3-css" precedence="default">
        {CSS}
      </style>
      <div className="b14g3-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
      <div className="b14g3-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.4, zIndex: 35 } as CSSProperties} aria-hidden />
    </div>
  );
}

/** The visible fake pointer (a ring). */
const Dot = ({ r }: { r: RefObject<HTMLDivElement | null> }) => (
  <div ref={r} className="b14g3-dot" aria-hidden>
    <span />
  </div>
);

function tapDot(d: HTMLElement | null) {
  if (!d) return;
  d.classList.remove("tap");
  void d.offsetWidth;
  d.classList.add("tap");
}

type Pt = { x: number; y: number; inside: boolean };
type Box = { l: number; t: number; w: number; h: number };

function rel(node: Element, root: Element): Box {
  const a = node.getBoundingClientRect();
  const r = root.getBoundingClientRect();
  return { l: a.left - r.left, t: a.top - r.top, w: a.width, h: a.height };
}
const inBox = (b: Box, x: number, y: number, pad = 0) => x >= b.l - pad && x <= b.l + b.w + pad && y >= b.t - pad && y <= b.t + b.h + pad;
const mid = (b: Box): [number, number] => [b.l + b.w / 2, b.t + b.h / 2];

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
    pad?: number;
    at?: (b: Box, i: number) => [number, number];
    off?: (w: number, h: number) => [number, number];
    onChange?: (now: number, prev: number, el: HTMLDivElement, p: Pt) => void;
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
        return o.at ? o.at(b, i) : mid(b);
      });
      const [x, y] = stepPath(t, pts, o.seg ?? 0.95, o.move ?? 0.48);
      const wb = o.wob ?? 8;
      return { x: x + Math.sin(t * 2.1) * wb, y: y + Math.cos(t * 1.7) * wb * 0.8, inside: true };
    },
    (p, el) => {
      const tg = [...el.querySelectorAll(o.sel)];
      const idx = p.inside ? tg.findIndex((n) => inBox(rel(n, el), p.x, p.y, o.pad ?? 0)) : -1;
      if (idx === cur.current) return;
      const prev = cur.current;
      cur.current = idx;
      tg.forEach((n, i) => n.classList.toggle("on", i === idx));
      o.onChange?.(idx, prev, el, p);
    },
  );
  return cur;
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
      gsap.killTweensOf(root.querySelectorAll("*"));
    };
  }, [ref]);
}

/** Real-mouse tracker for scripted click demos: idle() is false for 2.5 s after the real pointer moved in the stage. */
function useIdle(root: RefObject<HTMLElement | null>) {
  const at = useRef(-1e9);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const mv = () => (at.current = performance.now());
    el.addEventListener("pointermove", mv);
    return () => el.removeEventListener("pointermove", mv);
  }, [root]);
  return () => performance.now() - at.current > 2500;
}

/** Glide the fake ring (gsap x/y) to the centre of `target` (or a point), measured now. */
function goDot(dot: HTMLElement | null, root: HTMLElement, target: Element | [number, number] | null, dur = 0.45, idle = true) {
  if (!dot || !target) return;
  dot.style.opacity = idle ? "1" : "0";
  const [x, y] = Array.isArray(target) ? target : mid(rel(target, root));
  gsap.to(dot, { x, y, duration: dur, ease: "power3.inOut", overwrite: "auto" });
}

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, className = "", w = 700, h = 900 }: { i: number; className?: string; w?: number; h?: number }) => (
  <img src={scene(i, w, h)} alt="" className={`block h-full w-full object-cover ${className}`} draggable={false} />
);

const Eyebrow = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <p className={`text-[13px] uppercase tracking-[0.22em] text-white/55 ${className}`} style={{ fontFamily: F.sg }}>
    {children}
  </p>
);

/* ───────────────────────── U112 · Segmented pixel tooltip ───────────────────────── */
const U112_COLS = 12;
const U112_ROWS = 4;
const U112_CELL = 24;
const U112_CELLS: [number, number, number][] = [
  ...Array.from({ length: U112_COLS * U112_ROWS }, (_, i): [number, number, number] => [i % U112_COLS, Math.floor(i / U112_COLS), 1]),
  [5.5, 4, 0.8],
  [5.5, 4.6, 0.55],
];
const U112_ITEMS = [
  { n: "Sandstone", t: "Matte clay vase", p: "₹3,200", c: "radial-gradient(circle at 35% 30%,#f3d9b4,#c98f5a 60%,#7a4a26)" },
  { n: "Basalt", t: "Hand-thrown bowl", p: "₹3,850", c: "radial-gradient(circle at 35% 30%,#8c8f99,#3b3f4a 60%,#16181e)" },
  { n: "Celadon", t: "Twice-glazed jug", p: "₹4,100", c: "radial-gradient(circle at 35% 30%,#d6f0dc,#86b99a 60%,#3d6b52)" },
];
function u112Show(tip: HTMLElement, px: number, py: number, scatter: boolean) {
  const cells = [...tip.querySelectorAll<HTMLElement>(".u112-c")];
  const txt = tip.querySelector(".u112-tx");
  gsap.killTweensOf(cells);
  gsap.killTweensOf(txt);
  if (scatter) {
    gsap.fromTo(
      cells,
      { x: () => gsap.utils.random(-80, 80), y: () => gsap.utils.random(-60, 60), scale: 0, opacity: 0 },
      { x: 0, y: 0, scale: 1, opacity: 1, duration: 0.5, ease: "power3.out", stagger: { each: 0.006, from: "random" } },
    );
  } else {
    gsap.fromTo(
      cells,
      { x: 0, y: 0, scale: 0, opacity: 1 },
      {
        scale: 1,
        duration: 0.3,
        ease: "back.out(2)",
        stagger: (i) => {
          const c = cells[i];
          const cx = (Number(c.dataset.x) + 0.5) * U112_CELL;
          const cy = (Number(c.dataset.y) + 0.5) * U112_CELL;
          return Math.hypot(cx - px, cy - py) * 0.0012;
        },
      },
    );
  }
  gsap.to(txt, { opacity: 1, duration: 0.3, delay: 0.22 });
}
function u112Hide(tip: HTMLElement) {
  const cells = [...tip.querySelectorAll<HTMLElement>(".u112-c")];
  const txt = tip.querySelector(".u112-tx");
  gsap.killTweensOf(cells);
  gsap.killTweensOf(txt);
  gsap.to(txt, { opacity: 0, duration: 0.15 });
  gsap.to(cells, { scale: 0, duration: 0.24, ease: "power2.in", stagger: { each: 0.004, from: "random" } });
}
function U112() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const shown = useRef(0);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    gsap.set(el.querySelectorAll(".u112-c"), { scale: 0 });
    gsap.set(el.querySelectorAll(".u112-tx"), { opacity: 0 });
    return () => gsap.killTweensOf(el.querySelectorAll("*"));
  }, []);
  useWalk(root, dot, {
    sel: ".u112-card",
    order: [0, 1, -1, 2, 1, -1],
    pad: 6,
    at: (b) => [b.l + b.w / 2, b.t + b.h * 0.42],
    off: (w, h) => [w * 0.5, h * 0.9],
    onChange: (i, prev, el, p) => {
      if (prefersReducedMotion()) return;
      const tips = el.querySelectorAll<HTMLElement>(".u112-tip");
      if (prev >= 0 && tips[prev]) u112Hide(tips[prev]);
      if (i < 0 || !tips[i]) return;
      const g = tips[i].querySelector(".u112-g")!;
      const b = rel(g, el);
      u112Show(tips[i], p.x - b.l, p.y - b.t, shown.current++ % 2 === 1);
    },
  });
  const W = U112_COLS * U112_CELL;
  return (
    <Stage r={root} g1="rgba(255,196,140,.5)" g2="rgba(130,200,170,.22)">
      <svg width="0" height="0" className="absolute" aria-hidden>
        <filter id="u112-goo" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b" />
          <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8" />
        </filter>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ fontFamily: F.sg }}>
        <Eyebrow>Kiln Room · stoneware glazes</Eyebrow>
        <div className="mt-[17vh] flex items-end gap-[6vw]">
          {U112_ITEMS.map((it, k) => (
            <div key={it.n} className="u112-card relative flex flex-col items-center gap-5 px-4 pt-2">
              <div className="u112-tip pointer-events-none absolute bottom-[calc(100%+14px)] left-1/2" style={{ width: W, marginLeft: -W / 2 }} aria-hidden>
                <div className="u112-g relative" style={{ width: W, height: U112_ROWS * U112_CELL + 22, filter: "url(#u112-goo)" }}>
                  {U112_CELLS.map(([x, y, s], i) => (
                    <span
                      key={i}
                      className="u112-c absolute block rounded-[5px] bg-[#f4efe6]"
                      data-x={x}
                      data-y={y}
                      style={{
                        left: x * U112_CELL + (U112_CELL * (1 - s)) / 2,
                        top: y * U112_CELL,
                        width: U112_CELL * s + 2,
                        height: U112_CELL * s + 2,
                        transform: k === 0 ? undefined : "scale(0)",
                      }}
                    />
                  ))}
                </div>
                <div className="u112-tx absolute left-0 top-0 flex w-full flex-col items-center justify-center text-[#141008]" style={{ height: U112_ROWS * U112_CELL, opacity: k === 0 ? 1 : 0 }}>
                  <span className="text-[17px] font-[700] tracking-[-0.01em]">{it.t}</span>
                  <span className="mt-1 text-[15px] font-[500] text-[#141008]/70">{it.p} · ships in 4 days</span>
                </div>
              </div>
              <div className="h-[clamp(150px,15vw,210px)] w-[clamp(150px,15vw,210px)] rounded-full shadow-[0_30px_60px_rgba(0,0,0,.45)]" style={{ background: it.c }} />
              <span className="text-[clamp(22px,1.9vw,30px)] tracking-[-0.02em]" style={{ fontFamily: F.fr }}>
                {it.n}
              </span>
            </div>
          ))}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U113 · Context-aware fixed logo ───────────────────────── */
type U113P = { k: "t"; h: string; s: string } | { k: "i"; m: number; i: number; c: string; p: string };
const U113_PANELS: U113P[] = [
  { k: "t", h: "Slow made, worn daily.", s: "Autumn edit · 24 pieces" },
  { k: "i", m: 0, i: 21, c: "Coastal linen shirt", p: "₹4,900" },
  { k: "t", h: "Washed for softness.", s: "Garment-dyed in small lots" },
  { k: "i", m: 1, i: 14, c: "Ribbed cotton knit", p: "₹3,600" },
  { k: "t", h: "Cut to move with you.", s: "Relaxed, never boxy" },
  { k: "i", m: 2, i: 8, c: "Pleated wool trouser", p: "₹6,200" },
  { k: "t", h: "Made to be mended.", s: "Free repairs for life" },
  { k: "i", m: 3, i: 27, c: "Field overshirt", p: "₹7,400" },
];
const U113_MODES = ["Blur", "Roll", "Scatter", "Rotate"];
const U113_TXT_H = 150;
const U113_IMG_H = 250;
function U113() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const frame = el.querySelector<HTMLElement>(".u113-frame")!;
    const strip = el.querySelector<HTMLElement>(".u113-strip")!;
    const logo = el.querySelector<HTMLElement>(".u113-logo")!;
    const a = el.querySelector<HTMLElement>(".u113-a")!;
    const bl = el.querySelector<HTMLElement>(".u113-blur")!;
    const tags = [...el.querySelectorAll<HTMLElement>(".u113-tag")];
    const sa = SplitText.create(a, { type: "chars" });
    const sb = SplitText.create(el.querySelector(".u113-b"), { type: "chars" });
    const lw = logo.offsetWidth;
    const modes: gsap.core.Timeline[] = [
      gsap.timeline({ paused: true }).to(a.parentElement, { opacity: 0, duration: 0.35, ease: "power2.out" }).to(bl, { opacity: 1, scale: 1.04, duration: 0.35, ease: "power2.out" }, 0),
      gsap
        .timeline({ paused: true })
        .to(sa.chars, { yPercent: -105, duration: 0.45, ease: "power3.inOut", stagger: 0.035 })
        .to(sb.chars, { yPercent: -100, duration: 0.45, ease: "power3.inOut", stagger: 0.035 }, 0),
      gsap.timeline({ paused: true }).to(sa.chars, {
        x: () => gsap.utils.random(-46, 46),
        y: () => gsap.utils.random(-30, 34),
        rotation: () => gsap.utils.random(-50, 50),
        opacity: 0.55,
        duration: 0.5,
        ease: "power3.out",
        stagger: { each: 0.025, from: "center" },
      }),
      gsap.timeline({ paused: true }).to(logo, { rotation: -90, x: -14, y: lw - 34, transformOrigin: "0% 100%", duration: 0.6, ease: "power3.inOut" }),
    ];
    const half = strip.scrollHeight / 2;
    const run = gsap.to(strip, { y: -half, duration: half / 175, ease: "none", repeat: -1, paused: true });
    const panels = [...el.querySelectorAll<HTMLElement>("[data-m]")];
    let cur = -1;
    const check = () => {
      if (run.paused()) return;
      const f = frame.getBoundingClientRect();
      const top = f.top + 26;
      const bot = f.top + 72;
      let m = -1;
      for (const p of panels) {
        const r = p.getBoundingClientRect();
        if (r.bottom > top && r.top < bot) {
          m = Number(p.dataset.m);
          break;
        }
      }
      if (m === cur) return;
      if (cur >= 0) modes[cur].reverse();
      if (m >= 0) modes[m].play();
      tags.forEach((t, i) => t.classList.toggle("on", i === m));
      cur = m;
    };
    gsap.ticker.add(check);
    onClean(() => {
      gsap.ticker.remove(check);
      modes.forEach((t) => t.kill());
    });
    return run;
  });
  const list = [...U113_PANELS, ...U113_PANELS];
  return (
    <Stage r={root} g1="rgba(255,190,120,.5)" g2="rgba(120,150,255,.22)">
      <div className="absolute inset-0 flex items-center justify-center gap-[3vw]">
        <div className="u113-frame relative h-[86%] w-[min(66%,900px)] overflow-hidden rounded-[22px] border border-white/12 bg-[#0e121d]">
          <div className="u113-strip absolute left-0 top-0 w-full">
            {list.map((p, i) =>
              p.k === "t" ? (
                <div key={i} className="flex flex-col justify-center px-[9%]" style={{ height: U113_TXT_H }}>
                  <p className="text-[clamp(30px,2.6vw,42px)] leading-[1.05] tracking-[-0.02em]" style={{ fontFamily: F.fr }}>
                    {p.h}
                  </p>
                  <p className="mt-2 text-[14px] uppercase tracking-[0.2em] text-white/50" style={{ fontFamily: F.sg }}>
                    {p.s}
                  </p>
                </div>
              ) : (
                <div key={i} data-m={p.m} className="relative overflow-hidden" style={{ height: U113_IMG_H }}>
                  <Img i={p.i} w={1000} h={320} />
                  <div className="absolute bottom-5 right-6 rounded-full bg-black/45 px-5 py-2 text-[15px] font-[600] text-white" style={{ fontFamily: F.sg }}>
                    {p.c} · {p.p}
                  </div>
                </div>
              ),
            )}
          </div>
          <div className="u113-logo absolute left-9 top-[26px] z-10 text-[34px] font-[800] uppercase leading-none tracking-[0.06em] text-white" style={{ fontFamily: F.sy }}>
            <div className="relative h-[1em] overflow-hidden">
              <div className="u113-a">Velmora</div>
              <div className="u113-b absolute left-0 top-full text-[#ffd9a0]">Velmora</div>
            </div>
            <div className="u113-blur absolute inset-0 opacity-0" aria-hidden>
              Velmora
            </div>
          </div>
          <div className="absolute right-8 top-[30px] z-10 text-[15px] font-[600] uppercase tracking-[0.2em] text-white/80" style={{ fontFamily: F.sg }}>
            Menu
          </div>
        </div>
        <div className="flex flex-col gap-3" style={{ fontFamily: F.sg }}>
          <Eyebrow>Logo reacts to</Eyebrow>
          {U113_MODES.map((m) => (
            <span key={m} className="u113-tag rounded-full border border-white/15 px-5 py-2 text-[15px] font-[600] text-white/75">
              {m}
            </span>
          ))}
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── U114 · Tabs with stacked content ───────────────────────── */
const U114_TABS = [
  { t: "Espresso", n: "Double ristretto", d: "Dense and syrupy, with a cocoa finish.", p: "₹220", i: 3 },
  { t: "Pour-over", n: "Kalledevarapura V60", d: "Bright, floral, a long tea-like finish.", p: "₹280", i: 12 },
  { t: "Cold brew", n: "Eighteen-hour steep", d: "Smooth, low acid, served over one big cube.", p: "₹260", i: 19 },
  { t: "Matcha", n: "Ceremonial whisk", d: "Grassy and sweet, whisked to order.", p: "₹310", i: 25 },
];
const u114Slot = (k: number) => ({ y: -k * 30, scale: 1 - k * 0.06, opacity: k > 2 ? 0 : 1 - k * 0.28 });
function U114() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const api = useRef<((i: number) => void) | null>(null);
  const idle = useIdle(root);
  usePlay(root, (el) => {
    const tabs = [...el.querySelectorAll<HTMLElement>(".u114-tab")];
    const cards = [...el.querySelectorAll<HTMLElement>(".u114-card")];
    const pill = el.querySelector<HTMLElement>(".u114-pill")!;
    let order = cards.map((_, i) => i);
    let cur = 0;
    tabs[0].classList.remove("bg-[#f4efe6]");
    gsap.set(pill, { x: tabs[0].offsetLeft, width: tabs[0].offsetWidth });
    cards.forEach((c, k) => gsap.set(c, { ...u114Slot(k), zIndex: 10 - k }));
    const sel = (i: number) => {
      if (i === cur) return;
      cur = i;
      tabs.forEach((t, j) => t.classList.toggle("on", j === i));
      gsap.to(pill, { x: tabs[i].offsetLeft, width: tabs[i].offsetWidth, duration: 0.5, ease: "power3.inOut", overwrite: "auto" });
      order = [i, ...order.filter((j) => j !== i)];
      order.forEach((ci, k) => {
        const c = cards[ci];
        gsap.killTweensOf(c);
        if (k === 0) {
          gsap
            .timeline()
            .to(c, { y: 150, scale: 0.97, opacity: 1, duration: 0.28, ease: "power2.in" })
            .set(c, { zIndex: 20 })
            .to(c, { ...u114Slot(0), duration: 0.5, ease: "power3.out" })
            .set(c, { zIndex: 10 });
        } else {
          gsap.set(c, { zIndex: 10 - k });
          gsap.to(c, { ...u114Slot(k), duration: 0.55, ease: "power3.inOut" });
        }
      });
    };
    api.current = sel;
    const seq = [1, 2, 3, 0];
    const step = 1.25;
    const tl = gsap.timeline({ repeat: -1, paused: true });
    seq.forEach((i, k) => {
      tl.call(() => goDot(dot.current, el, tabs[i], 0.45, idle()), [], k * step).call(
        () => {
          if (idle()) tapDot(dot.current);
          sel(i);
        },
        [],
        k * step + 0.5,
      );
    });
    tl.to({}, { duration: 0.01 }, seq.length * step - 0.01);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,200,140,.5)" g2="rgba(160,120,255,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[10vh]" style={{ fontFamily: F.sg }}>
        <div className="relative flex rounded-full border border-white/12 bg-white/[0.05] p-2">
          <span className="u114-pill absolute left-0 top-2 h-[calc(100%-16px)] rounded-full bg-[#f4efe6]" style={{ width: 0 }} aria-hidden />
          {U114_TABS.map((t, i) => (
            <button key={t.t} type="button" onClick={() => api.current?.(i)} className={`u114-tab rounded-full px-8 py-4 text-[18px] font-[600] ${i === 0 ? "on bg-[#f4efe6]" : "text-white/75"}`}>
              {t.t}
            </button>
          ))}
        </div>
        <div className="relative h-[clamp(240px,34vh,320px)] w-[min(60%,760px)]">
          {U114_TABS.map((t, k) => (
            <div
              key={t.t}
              className="u114-card absolute inset-0 flex overflow-hidden rounded-[26px] border border-white/12 bg-[#151a27] shadow-[0_30px_60px_rgba(0,0,0,.5)]"
              style={{ transform: `translateY(${-k * 30}px) scale(${1 - k * 0.06})`, opacity: k > 2 ? 0 : 1 - k * 0.28, zIndex: 10 - k, transformOrigin: "50% 0%" }}
            >
              <div className="h-full w-[42%] flex-none">
                <Img i={t.i} w={420} h={420} />
              </div>
              <div className="flex flex-1 flex-col justify-center gap-3 px-[6%]">
                <Eyebrow>{t.t} · bar menu</Eyebrow>
                <h3 className="text-[clamp(30px,2.8vw,44px)] leading-[1.02] tracking-[-0.02em]" style={{ fontFamily: F.fr }}>
                  {t.n}
                </h3>
                <p className="text-[17px] text-white/65">{t.d}</p>
                <p className="text-[22px] font-[600]">{t.p}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U115 · Gooey expanding search pill ───────────────────────── */
const U115_Q = "linen overshirt";
const U115_W = 640;
const U115_H = 84;
function U115() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const idle = useIdle(root);
  usePlay(root, (el) => {
    const bar = el.querySelector<HTMLElement>(".u115-bar")!;
    const drop = el.querySelector<HTMLElement>(".u115-drop")!;
    const drop2 = el.querySelector<HTMLElement>(".u115-drop2")!;
    const txt = el.querySelector<HTMLElement>(".u115-t")!;
    const field = el.querySelector<HTMLElement>(".u115-field")!;
    const kbd = el.querySelector<HTMLElement>(".u115-kbd")!;
    const pill = el.querySelector<HTMLElement>(".u115-pill")!;
    const far = U115_W - U115_H;
    const st = { n: 0 };
    const draw = () => (txt.textContent = U115_Q.slice(0, Math.round(st.n)));
    gsap.set(bar, { width: U115_H });
    gsap.set([drop, drop2], { x: 0 });
    gsap.set([field, kbd], { opacity: 0 });
    st.n = 0;
    draw();
    const tl = gsap.timeline({ repeat: -1, paused: true });
    tl.call(() => goDot(dot.current, el, pill, 0.45, idle()), [], 0)
      .addLabel("open", 0.5)
      .call(() => {
        if (idle()) tapDot(dot.current);
      }, [], "open")
      .to(drop, { x: far, duration: 0.55, ease: "power3.out" }, "open")
      .to(drop2, { x: far * 0.55, duration: 0.7, ease: "power2.out" }, "open+=0.04")
      .to(bar, { width: U115_W, duration: 0.85, ease: "power3.inOut" }, "open+=0.06")
      .to(drop2, { x: far, duration: 0.4, ease: "power2.inOut" }, "open+=0.7")
      .to(field, { opacity: 1, duration: 0.25 }, "open+=0.55")
      .call(() => goDot(dot.current, el, [el.clientWidth * 0.5, el.clientHeight * 0.8], 0.6, idle()), [], "open+=0.6")
      .to(st, { n: U115_Q.length, duration: 0.9, ease: "none", onUpdate: draw }, "open+=0.75")
      .to(kbd, { opacity: 1, duration: 0.25 }, "open+=1.55")
      .addLabel("close", "open+=1.9")
      .to(kbd, { opacity: 0, duration: 0.2 }, "close")
      .to(st, { n: 0, duration: 0.3, ease: "none", onUpdate: draw }, "close")
      .to(field, { opacity: 0, duration: 0.2 }, "close+=0.25")
      .to(drop, { x: 0, duration: 0.55, ease: "power3.out" }, "close+=0.3")
      .to(drop2, { x: far * 0.45, duration: 0.3, ease: "power2.out" }, "close+=0.3")
      .to(drop2, { x: 0, duration: 0.45, ease: "power2.inOut" }, "close+=0.65")
      .to(bar, { width: U115_H, duration: 0.8, ease: "power3.inOut" }, "close+=0.34")
      .to({}, { duration: 0.1 }, "close+=1.14");
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(150,210,255,.5)" g2="rgba(255,170,120,.22)">
      <svg width="0" height="0" className="absolute" aria-hidden>
        <filter id="u115-goo" x="-10%" y="-20%" width="120%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="b" />
          <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" />
        </filter>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[7vh]" style={{ fontFamily: F.sg }}>
        <div className="text-center">
          <Eyebrow>Fieldhouse · menswear</Eyebrow>
          <h3 className="mt-4 text-[clamp(44px,4.6vw,76px)] leading-[1] tracking-[-0.03em]" style={{ fontFamily: F.fr }}>
            Find your layer.
          </h3>
        </div>
        <div className="relative" style={{ width: U115_W, height: U115_H }}>
          <div className="absolute inset-0" style={{ filter: "url(#u115-goo)" }} aria-hidden>
            <div className="u115-bar absolute left-0 top-0 rounded-full bg-[#f2ede4]" style={{ width: U115_W, height: U115_H }} />
            <div className="u115-drop absolute rounded-full bg-[#f2ede4]" style={{ left: 8, top: 8, width: U115_H - 16, height: U115_H - 16, transform: `translateX(${U115_W - U115_H}px)` }} />
            <div className="u115-drop2 absolute rounded-full bg-[#f2ede4]" style={{ left: 18, top: 18, width: U115_H - 36, height: U115_H - 36, transform: `translateX(${U115_W - U115_H}px)` }} />
          </div>
          <button type="button" className="u115-pill absolute left-0 top-0 grid place-items-center rounded-full text-[#0b0e17]" style={{ width: U115_H, height: U115_H }} aria-label="Search">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4-4" />
            </svg>
          </button>
          <div className="u115-field pointer-events-none absolute top-0 flex h-full items-center text-[22px] font-[500] text-[#0b0e17]" style={{ left: U115_H - 4 }}>
            <span className="u115-t">{U115_Q}</span>
            <span className="u115-caret ml-[2px] inline-block h-[28px] w-[2px] bg-[#0b0e17]" />
          </div>
          <span className="u115-kbd pointer-events-none absolute right-5 top-1/2 -mt-[18px] rounded-[10px] bg-[#0b0e17] px-3 py-[6px] text-[15px] font-[600] text-[#f2ede4]">
            12 results
          </span>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U116 · Jelly radio ───────────────────────── */
const U116_C = ["Light", "Medium", "Dark", "Espresso", "Filter"];
function U116() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const api = useRef<((i: number) => void) | null>(null);
  const idle = useIdle(root);
  usePlay(root, (el) => {
    const chips = [...el.querySelectorAll<HTMLElement>(".u116-c")];
    let cur = 1;
    const sel = (i: number) => {
      if (i === cur) return;
      cur = i;
      chips.forEach((c, j) => {
        c.classList.toggle("on", j === i);
        gsap.killTweensOf(c);
        const d = j - i;
        if (d === 0) {
          gsap
            .timeline()
            .to(c, { scaleX: 1.24, scaleY: 0.84, x: 0, duration: 0.14, ease: "power2.out" })
            .to(c, { scaleX: 1, scaleY: 1, duration: 0.85, ease: "elastic.out(1.1,0.3)" });
        } else {
          const push = Math.sign(d) * Math.max(0, 28 - (Math.abs(d) - 1) * 11);
          gsap
            .timeline({ delay: (Math.abs(d) - 1) * 0.05 })
            .to(c, { x: push, scaleX: 1, scaleY: 1, duration: 0.16, ease: "power2.out" })
            .to(c, { x: 0, duration: 0.8, ease: "elastic.out(1,0.4)" });
        }
      });
    };
    api.current = sel;
    const seq = [3, 0, 2, 4, 1];
    const step = 1.15;
    const tl = gsap.timeline({ repeat: -1, paused: true });
    seq.forEach((i, k) => {
      tl.call(() => goDot(dot.current, el, chips[i], 0.42, idle()), [], k * step).call(
        () => {
          if (idle()) tapDot(dot.current);
          sel(i);
        },
        [],
        k * step + 0.46,
      );
    });
    tl.to({}, { duration: 0.01 }, seq.length * step - 0.01);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,179,107,.5)" g2="rgba(120,180,255,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[8vh]" style={{ fontFamily: F.sg }}>
        <div className="text-center">
          <Eyebrow>Hillside Estate · single origin</Eyebrow>
          <h3 className="mt-4 text-[clamp(44px,4.6vw,76px)] leading-[1] tracking-[-0.03em]" style={{ fontFamily: F.fr }}>
            Choose your roast
          </h3>
          <p className="mt-4 text-[20px] text-white/70">₹780 · 250 g whole bean</p>
        </div>
        <div className="flex gap-4" role="radiogroup">
          {U116_C.map((c, i) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={i === 1}
              onClick={() => api.current?.(i)}
              className={`u116-c flex h-[68px] items-center gap-3 rounded-full border border-white/18 bg-white/[0.05] pl-5 pr-7 text-[19px] font-[600] ${i === 1 ? "on" : ""}`}
            >
              <span className="u116-r grid h-[22px] w-[22px] place-items-center rounded-full border-2 border-white/50">
                <span className="u116-i block h-[10px] w-[10px] rounded-full bg-[#1b1003]" />
              </span>
              {c}
            </button>
          ))}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U117 · Transition panel ───────────────────────── */
const U117_TABS = ["Story", "Materials", "Care", "Delivery"];
function U117Panels() {
  return (
    <>
      <div className="u117-p">
        <h4 className="text-[32px] leading-[1.08] tracking-[-0.02em]" style={{ fontFamily: F.fr }}>
          Woven on a 1960s shuttle loom.
        </h4>
        <p className="mt-3 text-[18px] leading-[1.5] text-white/65">Each throw takes a full day on the loom in our hill workshop.</p>
      </div>
      <div className="u117-p">
        {[
          ["Merino wool", "70%"],
          ["Mulberry silk", "20%"],
          ["Undyed linen", "10%"],
        ].map(([n, v]) => (
          <div key={n} className="flex items-center justify-between border-b border-white/10 py-4 text-[20px]">
            <span>{n}</span>
            <span className="text-white/60">{v}</span>
          </div>
        ))}
        <p className="mt-4 text-[16px] text-white/55">Traceable to two farms, certified mulesing-free.</p>
      </div>
      <div className="u117-p">
        <p className="text-[22px] leading-[1.4]">Cold hand wash, dry flat in shade.</p>
      </div>
      <div className="u117-p">
        <h4 className="text-[32px] leading-[1.08] tracking-[-0.02em]" style={{ fontFamily: F.fr }}>
          Free across India over ₹2,500
        </h4>
        <p className="mt-3 text-[18px] leading-[1.5] text-white/65">Metro cities in 2–3 days, everywhere else within a week.</p>
        <div className="mt-5 flex gap-3">
          {["Gift wrap ₹150", "Express ₹320"].map((c) => (
            <span key={c} className="rounded-full border border-white/15 px-4 py-2 text-[15px] text-white/75">
              {c}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
function U117() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const api = useRef<((i: number) => void) | null>(null);
  const idle = useIdle(root);
  usePlay(root, (el) => {
    const tabs = [...el.querySelectorAll<HTMLElement>(".u117-tab")];
    const box = el.querySelector<HTMLElement>(".u117-box")!;
    const panels = [...el.querySelectorAll<HTMLElement>(".u117-p")];
    const bar = el.querySelector<HTMLElement>(".u117-bar")!;
    let cur = 0;
    gsap.set(box, { height: panels[0].offsetHeight });
    gsap.set(panels, { position: "absolute", left: 0, right: 0, top: 0 });
    gsap.set(panels.slice(1), { autoAlpha: 0 });
    gsap.set(bar, { x: tabs[0].offsetLeft, width: tabs[0].offsetWidth });
    const sel = (i: number) => {
      if (i === cur) return;
      const dir = Math.sign(i - cur);
      const old = panels[cur];
      const nw = panels[i];
      cur = i;
      tabs.forEach((t, j) => t.classList.toggle("on", j === i));
      gsap.to(bar, { x: tabs[i].offsetLeft, width: tabs[i].offsetWidth, duration: 0.5, ease: "power3.inOut", overwrite: "auto" });
      gsap.killTweensOf([old, nw]);
      gsap.to(old, { x: -dir * 90, autoAlpha: 0, scale: 0.97, duration: 0.38, ease: "power2.in" });
      gsap.fromTo(nw, { x: dir * 90, autoAlpha: 0, scale: 0.97 }, { x: 0, autoAlpha: 1, scale: 1, duration: 0.55, ease: "power3.out", delay: 0.14 });
      gsap.to(box, { height: nw.offsetHeight, duration: 0.55, ease: "power3.inOut", overwrite: "auto" });
    };
    api.current = sel;
    const seq = [1, 3, 2, 0];
    const step = 1.2;
    const tl = gsap.timeline({ repeat: -1, paused: true });
    seq.forEach((i, k) => {
      tl.call(() => goDot(dot.current, el, tabs[i], 0.42, idle()), [], k * step).call(
        () => {
          if (idle()) tapDot(dot.current);
          sel(i);
        },
        [],
        k * step + 0.46,
      );
    });
    tl.to({}, { duration: 0.01 }, seq.length * step - 0.01);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(140,200,255,.5)" g2="rgba(255,150,190,.22)">
      <div className="absolute inset-0 flex items-center justify-center" style={{ fontFamily: F.sg }}>
        <div className="w-[min(58%,760px)] rounded-[28px] border border-white/12 bg-[#121725]/90 p-10 shadow-[0_30px_70px_rgba(0,0,0,.5)]">
          <Eyebrow>Loomhouse · Kullu throw · ₹9,800</Eyebrow>
          <div className="relative mt-6 flex gap-9 border-b border-white/10">
            {U117_TABS.map((t, i) => (
              <button key={t} type="button" onClick={() => api.current?.(i)} className={`u117-tab pb-4 text-[19px] font-[600] ${i === 0 ? "on" : "text-white/50"}`}>
                {t}
              </button>
            ))}
            <span className="u117-bar absolute bottom-[-1px] left-0 h-[3px] rounded-full bg-[#9fd4ff]" style={{ width: 52 }} aria-hidden />
          </div>
          <div className="u117-box relative mt-8 overflow-hidden">
            <div className="[&>.u117-p:not(:first-child)]:invisible [&>.u117-p:not(:first-child)]:absolute [&>.u117-p:not(:first-child)]:inset-x-0 [&>.u117-p:not(:first-child)]:top-0">
              <U117Panels />
            </div>
          </div>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U118 · Mirror text echo ───────────────────────── */
const U118_W = [
  { w: "Studio", sh: "translateX(1.5rem)", c: "#ff9f7a" },
  { w: "Projects", sh: "translateY(-1.5rem)", c: "#9fe6ff" },
  { w: "Contact", sh: "translateX(-1.5rem)", c: "#ffd36b" },
];
function U118() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useWalk(root, dot, {
    sel: ".u118-w",
    order: [0, -1, 1, -1, 2, -1],
    off: (w, h) => [w * 0.8, h * 0.5],
  });
  return (
    <Stage r={root} g1="rgba(255,159,122,.5)" g2="rgba(159,230,255,.22)">
      <div className="absolute inset-0 flex items-center justify-center gap-[8vw]">
        <div className="flex flex-col items-start gap-[0.62em] text-[clamp(64px,7vw,112px)] font-[700] uppercase tracking-[-0.02em]" style={{ fontFamily: F.sy }}>
          {U118_W.map((x) => (
            <span key={x.w} className="u118-w" style={{ "--sh": x.sh, color: "rgba(238,242,255,.82)" } as CSSProperties}>
              <span className="u118-s u118-s1" style={{ color: x.c }} aria-hidden>
                {x.w}
              </span>
              <span className="u118-s u118-s2" style={{ color: x.c }} aria-hidden>
                {x.w}
              </span>
              <span className="u118-s u118-s3" style={{ color: x.c }} aria-hidden>
                {x.w}
              </span>
              <span className="u118-m">{x.w}</span>
            </span>
          ))}
        </div>
        <div className="w-[min(22%,300px)]" style={{ fontFamily: F.sg }}>
          <Eyebrow>Oriel Works · design office</Eyebrow>
          <p className="mt-4 text-[19px] leading-[1.5] text-white/65">Brand worlds for hotels, kitchens and quiet objects. Bengaluru, since 2014.</p>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U119 · Bold copy grow ───────────────────────── */
function U119() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useWalk(root, dot, {
    sel: ".u119-box",
    order: [0, -1],
    seg: 0.95,
    at: (b) => [b.l + b.w * 0.5, b.t + b.h * 0.5],
    off: (w, h) => [w * 0.86, h * 0.88],
  });
  return (
    <Stage r={root} g1="rgba(255,214,150,.5)" g2="rgba(120,160,255,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ fontFamily: F.sg }}>
        <Eyebrow>Our pace · Tidewell textiles</Eyebrow>
        <div className="u119-box on relative mt-[2vh] grid h-[56%] w-[min(78%,1050px)] place-items-center">
          <span
            className="u119-bg u119-lo absolute select-none text-[clamp(170px,19vw,300px)] font-[800] uppercase leading-none tracking-[-0.03em]"
            style={{ fontFamily: F.sy, color: "transparent", WebkitTextStroke: "2px rgba(255,255,255,.16)" }}
            aria-hidden
          >
            Slow
          </span>
          <span
            className="u119-bg u119-hi absolute select-none text-[clamp(170px,19vw,300px)] font-[800] uppercase leading-none tracking-[-0.03em]"
            style={{ fontFamily: F.sy, color: "rgba(255,214,150,.1)", WebkitTextStroke: "2px rgba(255,214,150,.8)" }}
            aria-hidden
          >
            Slow
          </span>
          <span className="u119-fg relative italic leading-none text-white" style={{ fontFamily: F.fr, fontWeight: 400 }}>
            slow
          </span>
        </div>
        <p className="text-[19px] text-white/65">Hand-loomed in batches of twelve.</p>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U120 · 3D press button ───────────────────────── */
function U120() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const api = useRef<((i: number) => void) | null>(null);
  const idle = useIdle(root);
  usePlay(root, (el) => {
    const faces = [...el.querySelectorAll<HTMLElement>(".u120-face")];
    const offs = [
      { x: 0, y: 10 },
      { x: 8, y: 8 },
    ];
    const press = (i: number) => {
      const f = faces[i];
      gsap.killTweensOf(f);
      gsap
        .timeline()
        .to(f, { ...offs[i], duration: 0.08, ease: "power2.in" })
        .to(f, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1,0.45)" }, "+=0.06");
    };
    api.current = press;
    const tl = gsap.timeline({ repeat: -1, paused: true });
    tl.call(() => goDot(dot.current, el, faces[0], 0.45, idle()), [], 0)
      .call(
        () => {
          if (idle()) tapDot(dot.current);
          press(0);
        },
        [],
        0.5,
      )
      .call(() => goDot(dot.current, el, faces[1], 0.5, idle()), [], 1.0)
      .call(
        () => {
          if (idle()) tapDot(dot.current);
          press(1);
        },
        [],
        1.55,
      )
      .to({}, { duration: 0.01 }, 2.04);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(110,220,130,.5)" g2="rgba(255,216,77,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[9vh]" style={{ fontFamily: F.sg }}>
        <div className="text-center">
          <Eyebrow>Saturday tasting · 12 seats</Eyebrow>
          <h3 className="mt-4 text-[clamp(44px,4.6vw,76px)] leading-[1] tracking-[-0.03em]" style={{ fontFamily: F.fr }}>
            Pull up a chair.
          </h3>
        </div>
        <div className="flex items-start gap-[7vw]">
          <div className="flex flex-col items-center gap-5">
            <div className="relative">
              <span className="absolute inset-x-0 bottom-[-10px] top-[10px] rounded-[20px] bg-[#2d8a3e]" aria-hidden />
              <button
                type="button"
                onPointerDown={() => api.current?.(0)}
                className="u120-face relative rounded-[20px] bg-[#5fd474] px-12 py-6 text-[22px] font-[800] uppercase tracking-[0.06em] text-[#0b2a12]"
              >
                Reserve · ₹1,200
              </button>
            </div>
            <span className="text-[14px] uppercase tracking-[0.2em] text-white/50">Straight down</span>
          </div>
          <div className="flex flex-col items-center gap-5">
            <div className="relative">
              <span className="absolute left-[8px] top-[8px] h-full w-full rounded-[14px] bg-black ring-[3px] ring-black" aria-hidden />
              <button
                type="button"
                onPointerDown={() => api.current?.(1)}
                className="u120-face relative rounded-[14px] border-[3px] border-black bg-[#ffd84d] px-12 py-6 text-[22px] font-[800] uppercase tracking-[0.06em] text-black"
              >
                Join waitlist
              </button>
            </div>
            <span className="text-[14px] uppercase tracking-[0.2em] text-white/50">Neobrutal offset</span>
          </div>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U121 · Slide arrow button ───────────────────────── */
const U121_B = [
  { t: "Shop the edit", cls: "bg-[#f4efe6] text-[#0b0e17] border-[#f4efe6]", ar: "bg-[#0b0e17] text-[#f4efe6]" },
  { t: "Book a table", cls: "border-white/40 text-white", ar: "bg-white text-[#0b0e17]" },
  { t: "View lookbook", cls: "bg-[#ff9f7a] text-[#1a0a04] border-[#ff9f7a]", ar: "bg-[#1a0a04] text-[#ff9f7a]" },
];
function U121() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useWalk(root, dot, {
    sel: ".u121-b",
    order: [0, 1, 2, -1],
    off: (w, h) => [w * 0.5, h * 0.84],
  });
  return (
    <Stage r={root} g1="rgba(255,159,122,.5)" g2="rgba(140,180,255,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[9vh]" style={{ fontFamily: F.sg }}>
        <div className="text-center">
          <Eyebrow>Monsoon menu · Ember &amp; Salt</Eyebrow>
          <h3 className="mt-4 text-[clamp(44px,4.6vw,76px)] leading-[1] tracking-[-0.03em]" style={{ fontFamily: F.fr }}>
            Come hungry.
          </h3>
        </div>
        <div className="flex gap-[2.6vw]">
          {U121_B.map((b, i) => (
            <a
              key={b.t}
              href="#"
              onClick={(e) => e.preventDefault()}
              className={`u121-b ${i === 0 ? "on" : ""} flex h-[78px] items-center rounded-full border-2 pl-[46px] pr-[46px] text-[20px] font-[700] ${b.cls}`}
            >
              <span className={`u121-ar ${b.ar}`} aria-hidden>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </span>
              <span className="u121-lab">{b.t}</span>
            </a>
          ))}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U122 · Content scan highlight ───────────────────────── */
const U122_TXT: [string, boolean][] = [
  ["A", false],
  ["cold-pressed", true],
  ["blend of kumkumadi and sesame, slow-infused with", false],
  ["saffron", true],
  ["and vetiver root. It is", false],
  ["fragrance-free", true],
  [", rich in", false],
  ["vitamin E", true],
  ["and sinks in within a minute. Bottled in amber glass,", false],
  ["refillable", true],
  ["at any of our stores for", false],
  ["₹1,450", true],
  [".", false],
];
const U122_N = U122_TXT.filter(([, h]) => h).length;
function U122() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const par = el.querySelector<HTMLElement>(".u122-par")!;
    const scan = el.querySelector<HTMLElement>(".u122-scan")!;
    const cnt = el.querySelector<HTMLElement>(".u122-n")!;
    const hits = [...el.querySelectorAll<HTMLElement>(".u122-h")];
    const ys = hits.map((h) => {
      const b = rel(h, par);
      return b.t + b.h / 2;
    });
    const H = par.offsetHeight;
    const clear = () => {
      hits.forEach((h) => h.classList.remove("on"));
      cnt.textContent = "0";
    };
    clear();
    gsap.set(scan, { opacity: 1 });
    const tl = gsap.timeline({ repeat: -1, paused: true });
    tl.fromTo(
      scan,
      { y: -24 },
      {
        y: H + 24,
        duration: 2.3,
        ease: "none",
        onUpdate: () => {
          const y = Number(gsap.getProperty(scan, "y"));
          let n = 0;
          hits.forEach((h, i) => {
            const on = ys[i] < y;
            if (on) n++;
            if (on !== h.classList.contains("on")) h.classList.toggle("on", on);
          });
          cnt.textContent = String(n);
        },
      },
    )
      .to(scan, { opacity: 0, duration: 0.2 })
      .call(clear)
      .set(scan, { y: -24 })
      .to(scan, { opacity: 1, duration: 0.2 });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(159,240,196,.5)" g2="rgba(140,160,255,.22)">
      <div className="absolute inset-0 flex items-center justify-center" style={{ fontFamily: F.sg }}>
        <div className="w-[min(70%,920px)] rounded-[28px] border border-white/12 bg-[#111624]/90 p-12 shadow-[0_30px_70px_rgba(0,0,0,.5)]">
          <div className="flex items-center justify-between">
            <Eyebrow>Label scan · Saffron face oil</Eyebrow>
            <span className="rounded-full bg-[#9ff0c4]/15 px-4 py-2 text-[15px] font-[600] text-[#9ff0c4]">
              <span className="u122-n">{U122_N}</span> / {U122_N} clean picks
            </span>
          </div>
          <div className="relative mt-7">
            <p className="u122-par relative isolate text-[clamp(24px,2.1vw,32px)] leading-[1.55] tracking-[-0.01em] text-white/80" style={{ fontFamily: F.fr }}>
              {U122_TXT.map(([t, h], i) => {
                const sep = i === 0 || t.startsWith(",") || t === "." ? "" : " ";
                return h ? (
                  <span key={i}>
                    {sep}
                    <span className="u122-h on">{t}</span>
                  </span>
                ) : (
                  <span key={i}>
                    {sep}
                    {t}
                  </span>
                );
              })}
            </p>
            <div className="u122-scan pointer-events-none absolute inset-x-[-24px] top-0 opacity-0" aria-hidden>
              <div className="h-[60px] -translate-y-full bg-[linear-gradient(to_bottom,transparent,rgba(159,240,196,.18))]" />
              <div className="h-[2px] bg-[#9ff0c4] shadow-[0_0_18px_4px_rgba(159,240,196,.55)]" />
            </div>
          </div>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── U123 · Elastic line pluck ───────────────────────── */
const U123_ROWS = [
  { n: "Masala chai", d: "Assam, green cardamom", p: "₹180" },
  { n: "Filter kaapi", d: "Chicory, brass davara", p: "₹160" },
  { n: "Kokum cooler", d: "Black salt, mint", p: "₹210" },
];
const U123_SVG_H = 200;
function U123() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const st = useRef<{ cx: number; cy: number; held: boolean }[]>([]);
  usePointer(
    root,
    dot,
    (t, el) => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      return { x: w * (0.5 + 0.3 * Math.sin(t * 0.85)), y: h * (0.52 + 0.3 * Math.sin(t * 1.7 + 0.4)), inside: true };
    },
    (p, el) => {
      const lines = [...el.querySelectorAll<SVGSVGElement>(".u123-l")];
      if (st.current.length !== lines.length) st.current = lines.map(() => ({ cx: 0, cy: 0, held: false }));
      lines.forEach((svg, i) => {
        const b = rel(svg, el);
        const W = b.w;
        const ly = b.t + U123_SVG_H / 2;
        const s = st.current[i];
        const dy = p.y - ly;
        const inX = p.inside && p.x > b.l && p.x < b.l + W;
        if (!s.held && inX && Math.abs(dy) < 26) {
          s.held = true;
          gsap.killTweensOf(s);
        }
        if (s.held) {
          if (!inX || Math.abs(dy) > 62) {
            s.held = false;
            gsap.to(s, { cy: 0, duration: 1.3, ease: "elastic.out(1.2,0.18)" });
          } else {
            s.cx = p.x - b.l;
            s.cy = dy * 2;
          }
        }
        if (!s.cx) s.cx = W / 2;
        const c = U123_SVG_H / 2;
        const d = `M0 ${c} Q ${s.cx.toFixed(1)} ${(c + s.cy).toFixed(1)} ${W.toFixed(1)} ${c}`;
        svg.querySelectorAll("path").forEach((pa) => pa.setAttribute("d", d));
      });
    },
  );
  return (
    <Stage r={root} g1="rgba(255,200,130,.5)" g2="rgba(130,220,200,.22)">
      <div className="absolute inset-0 flex items-center justify-center" style={{ fontFamily: F.sg }}>
        <div className="w-[min(68%,900px)]">
          <Eyebrow>Kettle House · tea bar menu</Eyebrow>
          <div className="relative mt-6">
            {[...U123_ROWS, null].map((r, i) => (
              <div key={i} className="relative">
                <svg className="u123-l pointer-events-none absolute left-0 w-full overflow-visible" style={{ top: -U123_SVG_H / 2, height: U123_SVG_H }} aria-hidden>
                  <path d={`M0 ${U123_SVG_H / 2} L 900 ${U123_SVG_H / 2}`} fill="none" stroke="rgba(255,200,130,.16)" strokeWidth="9" strokeLinecap="round" />
                  <path d={`M0 ${U123_SVG_H / 2} L 900 ${U123_SVG_H / 2}`} fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="1.4" />
                </svg>
                {r && (
                  <div className="flex items-baseline justify-between py-[3.4vh]">
                    <div>
                      <p className="text-[clamp(30px,2.8vw,44px)] leading-[1] tracking-[-0.02em]" style={{ fontFamily: F.fr }}>
                        {r.n}
                      </p>
                      <p className="mt-2 text-[16px] text-white/55">{r.d}</p>
                    </div>
                    <span className="text-[24px] font-[600]">{r.p}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  {
    code: "U112",
    name: "Segmented pixel tooltip",
    how: "A tooltip builds itself from grid cells that pop in by distance from the pointer (or scatter in from random offsets), merged by a goo filter; a fake pointer walks the swatches.",
    kind: "play",
    C: U112,
  },
  {
    code: "U113",
    name: "Context-aware fixed logo",
    how: "Content scrolls under a fixed wordmark; each photo that passes beneath it makes the logo blur, roll its letters up, scatter its chars or turn -90° and slide to the edge.",
    kind: "play",
    C: U113,
  },
  {
    code: "U114",
    name: "Tabs with stacked content",
    how: "The active pill slides between tabs while the chosen card dips out of the offset stack and comes back to the front; a fake pointer clicks through.",
    kind: "play",
    C: U114,
  },
  {
    code: "U115",
    name: "Gooey expanding search pill",
    how: "A round icon pill stretches like liquid (SVG goo) into a wide input, types a query, then pours back into a dot; fired by a fake click on a loop.",
    kind: "play",
    C: U115,
  },
  {
    code: "U116",
    name: "Jelly radio",
    how: "The chosen roast chip swells with a jelly overshoot and shoves its neighbours aside in a short stagger before they settle; a fake pointer picks chips.",
    kind: "play",
    C: U116,
  },
  {
    code: "U117",
    name: "Transition panel",
    how: "Tab content swaps directionally: the old panel slides and fades out, the new one slides in from the chosen tab's side while the height eases to fit.",
    kind: "play",
    C: U117,
  },
  {
    code: "U118",
    name: "Mirror text echo",
    how: "Three thin clipped slices of each word trail the word itself by 75/100/200 ms as it shifts on hover, each word in its own direction; a fake pointer reads the menu.",
    kind: "play",
    C: U118,
  },
  {
    code: "U119",
    name: "Bold copy grow",
    how: "On hover a small solid word grows from 30 px to 96 px in front of a huge outlined word that brightens behind it; a fake pointer hovers on a loop.",
    kind: "play",
    C: U119,
  },
  {
    code: "U120",
    name: "3D press button",
    how: "Each button's face sinks into its thick edge (straight down, or diagonally into a neobrutal offset) and springs back; a fake pointer presses both in turn.",
    kind: "play",
    C: U120,
  },
  {
    code: "U121",
    name: "Slide arrow button",
    how: "On hover a chevron disc slides in from the left and the label shifts over to make room; a fake pointer walks the three buttons.",
    kind: "play",
    C: U121,
  },
  {
    code: "U122",
    name: "Content scan highlight",
    how: "A glowing scan line sweeps down a label and highlights each matching ingredient as it crosses, counting the hits; loops while on screen.",
    kind: "play",
    C: U122,
  },
  {
    code: "U123",
    name: "Elastic line pluck",
    how: "Menu hairlines bend toward a passing pointer (quadratic control point) and snap back with a damped elastic wobble when released; a fake pointer traces a figure-eight.",
    kind: "play",
    C: U123,
  },
];
