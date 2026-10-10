"use client";

// Micro-interactions, batch 5 · group 3 (MOTION-MENU U67–U78). Small focused demos for /lab/motion.
// Every hover / click demo also plays by itself: a visible fake pointer (ring) walks over the targets (or a timeline
// presses the button) and drives the same state the real mouse does; the real mouse takes over for 2.5 s whenever it
// moves. A CSS-only glow loop never stops (and sits on top again, screen-blended). Pauses off screen.
// ?static=1 / reduced motion: no JS motion, the markup shows a sensible final state.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, loadPlugin, prefersReducedMotion } from "@/lib/gsap";
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
.b5g3u-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.5)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.22)),transparent 70%);animation:b5g3u-drift 5.8s linear infinite alternate;will-change:transform}
@keyframes b5g3u-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b5g3u-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;pointer-events:none;z-index:60;opacity:0;transition:opacity .25s}
.b5g3u-dot>span{display:block;width:100%;height:100%;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4)}

/* U67 marquee row */
.u67-row{position:relative;overflow:hidden;border-top:1px solid rgba(255,255,255,.14)}
.u67-lab{display:block;transition:transform .55s ${EIO},opacity .4s}
.u67-row.on .u67-lab{transform:translateY(-60%);opacity:0}
.u67-mq{position:absolute;inset:0;display:flex;align-items:center;opacity:0;transform:translateY(40%);transition:opacity .4s,transform .55s ${EIO};background:#f4e9dc;color:#1a120c}
.u67-row.on .u67-mq{opacity:1;transform:none}
.u67-track{display:flex;align-items:center;gap:2.2vw;width:max-content;padding-right:2.2vw;animation:u67-run 9s linear infinite}
@keyframes u67-run{to{transform:translate3d(-50%,0,0)}}

/* U68 magnetic */
.u68-bg{transition:background-color .7s ${EZ}}
.u68-lab{transition:color .35s}
.u68-b.on .u68-lab{color:#0a0d16}

/* U69 inline menu */
.u69-it{position:relative;display:inline-block;color:rgba(238,242,255,.95);transition:color .35s;font-style:italic}
.u69-it::after{content:"";position:absolute;left:0;right:0;bottom:.08em;height:2px;background:currentColor;transform:scaleX(.18);transform-origin:0 50%;transition:transform .5s ${EZ}}
.u69-it.on{color:#ffb36b}
.u69-it.on::after{transform:scaleX(1)}

/* U70 colour wipe link */
.u70-l{position:relative;display:inline-block;color:rgba(238,242,255,.38)}
.u70-dup{position:absolute;left:0;top:0;white-space:nowrap;color:#9df2c8;clip-path:inset(0 100% 0 0);transition:clip-path .7s ${EIO}}
.u70-u{position:absolute;left:0;right:0;bottom:.04em;height:3px;background:#9df2c8;transform:scaleX(0);transform-origin:0 50%;transition:transform .7s ${EIO}}
.u70-l.on .u70-dup{clip-path:inset(0 0 0 0)}
.u70-l.on .u70-u{transform:scaleX(1)}

/* U71 edge-aware marquee */
.u71-row{position:relative;overflow:hidden;border-top:1px solid rgba(255,255,255,.16)}
.u71-mq{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.u71-in{position:absolute;inset:0;display:flex;align-items:center;background:#c8ff8a;color:#0b1206}
.u71-track{display:flex;align-items:center;gap:2vw;width:max-content;padding-right:2vw;animation:u71-run 7s linear infinite}
@keyframes u71-run{to{transform:translate3d(-50%,0,0)}}

/* U73 theme pages */
.u73-pg{--bg:#f3efe6;--fg:#16130f;--mu:rgba(22,19,15,.6);--ac:#c2410c;--ln:rgba(22,19,15,.14);--cd:#e7e0d2;background:var(--bg);color:var(--fg)}
.u73-pg[data-theme="dark"]{--bg:#0f1322;--fg:#eef2ff;--mu:rgba(238,242,255,.6);--ac:#ffb36b;--ln:rgba(238,242,255,.16);--cd:#1a2033}
.u73-moon{display:none}
.u73-pg[data-theme="dark"] .u73-moon{display:block}
.u73-pg[data-theme="dark"] .u73-sun{display:none}

/* U74 replaced pointer */
.u74-card{cursor:none}

/* U75 orbiting spot */
@property --u75a{syntax:'<angle>';inherits:true;initial-value:0deg}
@property --u75c{syntax:'<angle>';inherits:true;initial-value:0deg}
@property --u75w{syntax:'<angle>';inherits:true;initial-value:42deg}
.u75-t{position:relative;isolation:isolate;--u75c:0deg;--u75w:42deg;animation:u75-spin 3.2s linear infinite;transition:--u75c .7s ${EIO},--u75w .7s ${EIO}}
.u75-t.on{--u75c:180deg;--u75w:180deg}
@keyframes u75-spin{to{--u75a:360deg}}
.u75-ring,.u75-halo{position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:conic-gradient(from var(--u75a),var(--u75k) 0deg,var(--u75k) var(--u75c),transparent var(--u75w),transparent calc(360deg - var(--u75w)),var(--u75k) calc(360deg - var(--u75c)),var(--u75k) 360deg)}
.u75-ring{padding:2px;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;z-index:2}
.u75-halo{inset:-3px;filter:blur(14px);opacity:.55;z-index:-2}
.u75-fill{position:absolute;inset:2px;border-radius:inherit;background:#0d111c;z-index:-1;transition:background-color .6s}
.u75-t.on .u75-fill{background:#141a2a}

/* U77 grid glide */
.u77-c .u77-ttl{transition:color .35s}
.u77-c.on .u77-ttl{color:#fff}
.u77-c .u77-ix{transition:color .35s,border-color .35s}
.u77-c.on .u77-ix{color:#0a0d16;background:#7fb2ff;border-color:#7fb2ff}

/* U78 border trail */
.u78-b{position:absolute;inset:0;border-radius:inherit;padding:1.5px;pointer-events:none;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude}
.u78-blob{position:absolute;left:0;top:0;width:var(--u78s,110px);height:var(--u78s,110px);border-radius:50%;offset-path:inset(0 round var(--u78r,28px));offset-rotate:0deg;offset-anchor:50% 50%;offset-distance:0%;background:radial-gradient(circle,#fff 0%,var(--u78k,#ffcf6b) 22%,transparent 68%);animation:u78-run var(--u78d,5s) linear infinite}
@keyframes u78-run{to{offset-distance:100%}}

html.is-static .b5g3u-glow,html.is-static .u67-track,html.is-static .u71-track,html.is-static .u75-t,html.is-static .u78-blob{animation:none}
html.is-static {
  .b5g3u-glow,.u67-track,.u71-track,.u75-t,.u78-blob{animation:none}
  .u67-lab,.u67-mq,.u68-bg,.u69-it,.u69-it::after,.u70-dup,.u70-u,.u75-t,.u75-fill{transition:none}
}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop, again on top (screen blend) so covered stages never freeze. */
function Stage({ r, children, g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; g1?: string; g2?: string }) {
  return (
    <div ref={r} className="relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0d16] text-[#eef2ff]">
      <style href="b5g3u-css" precedence="default">
        {CSS}
      </style>
      <div className="b5g3u-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
      <div className="b5g3u-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.38, zIndex: 35 } as CSSProperties} aria-hidden />
    </div>
  );
}

/** The visible fake pointer (a ring). Its inner span can be scaled for a "press". */
const Dot = ({ r }: { r: RefObject<HTMLDivElement | null> }) => (
  <div ref={r} className="b5g3u-dot" aria-hidden>
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
function stepPath(t: number, pts: [number, number][], seg: number, move = 0.5): [number, number] {
  const n = pts.length;
  const k = Math.floor(t / seg);
  const f = t / seg - k;
  const a = pts[k % n];
  const b = pts[(k + 1) % n];
  const m = f < 1 - move ? 0 : easeIO((f - (1 - move)) / move);
  return [a[0] + (b[0] - a[0]) * m, a[1] + (b[1] - a[1]) * m];
}

/** Hover walk: the fake ring visits targets (`sel`) in `order` (-1 = a resting spot off the targets); whichever target
 *  holds the pointer (fake or real) gets the class "on". Rest on each target = seg × (1 − move) ≤ 0.5 s. */
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
      const [x, y] = stepPath(t, pts, o.seg ?? 1, o.move ?? 0.5);
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

/** Press the fake ring (and optionally a target) inside a timeline. */
function press(tl: gsap.core.Timeline, dIn: Element, target?: Element | null) {
  tl.to(dIn, { scale: 0.55, duration: 0.1, ease: "power2.out" });
  if (target) tl.to(target, { scale: 0.95, duration: 0.1, ease: "power2.out" }, "<");
  tl.to(target ? [dIn, target] : dIn, { scale: 1, duration: 0.14, ease: "power2.out" });
}

/* ───────────────────────── U67 · Menu row marquee on hover ───────────────────────── */
const U67_ROWS = [
  { n: "Bouquets", s: "from ₹1,450" },
  { n: "Dried stems", s: "from ₹980" },
  { n: "Weddings", s: "by quote" },
  { n: "Workshops", s: "₹2,600 / seat" },
];
function U67() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useWalk(root, dot, {
    sel: ".u67-row",
    order: [0, 1, 2, 3, -1],
    seg: 1,
    move: 0.5,
    at: (b, i) => [b.l + b.w * (0.3 + 0.12 * i), b.t + b.h / 2],
    off: (w, h) => [w * 0.55, h * 0.93],
  });
  return (
    <Stage r={root} g1="rgba(255,159,177,.5)" g2="rgba(244,233,220,.18)">
      <div className="absolute inset-0 flex flex-col justify-center px-[7%]">
        <div className="mb-[3vh] flex items-end justify-between">
          <Eyebrow>Petal &amp; Thorn · florist</Eyebrow>
          <Eyebrow>Index · 04</Eyebrow>
        </div>
        <nav className="border-b border-white/15">
          {U67_ROWS.map((r, i) => (
            <a key={r.n} href="#" onClick={(e) => e.preventDefault()} className={`u67-row block h-[clamp(84px,12.5vh,120px)] ${i === 0 ? "on" : ""}`} data-cursor="Shop">
              <span className="u67-lab flex h-full items-center justify-between">
                <span className="text-[clamp(44px,4.8vw,76px)] leading-none tracking-[-0.02em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
                  {r.n}
                </span>
                <span className="text-[15px] text-white/55" style={{ fontFamily: F.sg }}>
                  {r.s}
                </span>
              </span>
              <span className="u67-mq" aria-hidden>
                <span className="u67-track">
                  {[0, 1].map((k) =>
                    [0, 1, 2].map((j) => (
                      <span key={`${k}${j}`} className="flex items-center gap-[2.2vw]">
                        <span className="text-[clamp(40px,4.2vw,66px)] leading-none" style={{ fontFamily: F.fr, fontWeight: 400, fontStyle: "italic" }}>
                          {r.n}
                        </span>
                        <span className="block h-[clamp(48px,7.5vh,72px)] w-[clamp(96px,11vh,140px)] overflow-hidden rounded-full">
                          <Img i={i * 3 + j} w={280} h={150} />
                        </span>
                      </span>
                    )),
                  )}
                </span>
              </span>
            </a>
          ))}
        </nav>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U68 · Magnetic buttons with fills ───────────────────────── */
const U68_BTNS = [
  { l: "Book a table", c: "#ff7a59", bg: "#2a120b" },
  { l: "See the menu", c: "#c8ff8a", bg: "#16220c" },
  { l: "Gift a dinner", c: "#7fb2ff", bg: "#0d1730" },
];
type Q = (v: number) => void;
function U68() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const qs = useRef<{ bx: Q; by: Q; tx: Q; ty: Q }[]>([]);
  const cur = useRef(-1);
  const pressCall = useRef<gsap.core.Tween | null>(null);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const btns = [...el.querySelectorAll<HTMLElement>(".u68-b")];
    qs.current = btns.map((b) => {
      const t = b.querySelector(".u68-lab");
      return {
        bx: gsap.quickTo(b, "x", { duration: 0.7, ease: "power3" }),
        by: gsap.quickTo(b, "y", { duration: 0.7, ease: "power3" }),
        tx: gsap.quickTo(t, "x", { duration: 0.7, ease: "power3" }),
        ty: gsap.quickTo(t, "y", { duration: 0.7, ease: "power3" }),
      };
    });
    const fills = el.querySelectorAll(".u68-fill");
    gsap.set(fills, { x: 0, y: 0, xPercent: -50, yPercent: -50, scale: 0 });
    return () => {
      pressCall.current?.kill();
      gsap.killTweensOf(btns);
      gsap.killTweensOf(fills);
    };
  }, []);
  usePointer(
    root,
    dot,
    (t, el) => {
      const ws = el.querySelectorAll(".u68-w");
      const pts: [number, number][] = [0, 1, 2].map((i) => {
        const b = ws[i] ? rel(ws[i], el) : { l: 0, t: 0, w: 0, h: 0 };
        return [b.l + b.w * 0.62, b.t + b.h * 0.5];
      });
      pts.push([el.clientWidth * 0.5, el.clientHeight * 0.86]);
      const [x, y] = stepPath(t, pts, 1, 0.5);
      return { x: x + Math.sin(t * 3.1) * 22, y: y + Math.cos(t * 2.6) * 14, inside: true };
    },
    (p, el, fake) => {
      const ws = [...el.querySelectorAll(".u68-w")];
      let idx = -1;
      ws.forEach((w, i) => {
        const b = rel(w, el);
        const dx = p.x - (b.l + b.w / 2);
        const dy = p.y - (b.t + b.h / 2);
        const near = p.inside && Math.abs(dx) < b.w * 0.85 && Math.abs(dy) < b.h * 1.4;
        const q = qs.current[i];
        if (q) {
          q.bx(near ? dx * 0.32 : 0);
          q.by(near ? dy * 0.32 : 0);
          q.tx(near ? dx * 0.16 : 0);
          q.ty(near ? dy * 0.16 : 0);
        }
        if (p.inside && inBox(b, p.x, p.y)) idx = i;
      });
      if (idx === cur.current) return;
      const prev = cur.current;
      cur.current = idx;
      const btns = el.querySelectorAll<HTMLElement>(".u68-b");
      btns.forEach((b, i) => b.classList.toggle("on", i === idx));
      if (prev >= 0 && btns[prev]) {
        const b = rel(ws[prev], el);
        const f = btns[prev].querySelector(".u68-fill");
        if (f) gsap.to(f, { scale: 0, x: p.x - b.l - b.w / 2, y: p.y - b.t - b.h / 2, duration: 0.45, ease: "power3.in", overwrite: true });
      }
      const bg = el.querySelector<HTMLElement>(".u68-bg");
      if (bg) bg.style.backgroundColor = idx >= 0 ? U68_BTNS[idx].bg : "#0a0d16";
      pressCall.current?.kill();
      if (idx >= 0 && btns[idx]) {
        const b = rel(ws[idx], el);
        const f = btns[idx].querySelector(".u68-fill");
        if (f) gsap.fromTo(f, { scale: 0, x: p.x - b.l - b.w / 2, y: p.y - b.t - b.h / 2 }, { scale: 1, x: 0, y: 0, duration: 0.55, ease: "power3.out", overwrite: true });
        if (fake) {
          const btn = btns[idx];
          pressCall.current = gsap.delayedCall(0.3, () => {
            gsap.fromTo(btn, { scale: 1 }, { scale: 0.93, duration: 0.11, yoyo: true, repeat: 1, ease: "power2.out" });
            const dIn = dot.current?.firstElementChild;
            if (dIn) gsap.fromTo(dIn, { scale: 1 }, { scale: 0.55, duration: 0.11, yoyo: true, repeat: 1, ease: "power2.out" });
          });
        }
      }
    },
  );
  return (
    <Stage r={root} g1="rgba(255,122,89,.5)" g2="rgba(127,178,255,.24)">
      <div className="u68-bg absolute inset-0 opacity-70" style={{ backgroundColor: U68_BTNS[0].bg }} aria-hidden />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[7vh]">
        <div className="text-center">
          <Eyebrow>Saltwick Supper Club · Thursdays</Eyebrow>
          <p className="mt-3 text-[clamp(52px,5.6vw,88px)] leading-[0.98] tracking-[-0.02em]" style={{ fontFamily: F.is }}>
            Twelve seats, one long table
          </p>
        </div>
        <div className="flex gap-[3vw]">
          {U68_BTNS.map((b, i) => (
            <div key={b.l} className="u68-w h-[84px] w-[clamp(230px,18vw,280px)]">
              <button
                type="button"
                className={`u68-b relative h-full w-full overflow-hidden rounded-full border text-[21px] font-[600] ${i === 0 ? "on" : ""}`}
                style={{ borderColor: b.c, color: b.c, fontFamily: F.sg }}
                data-cursor="Book"
              >
                <span
                  className="u68-fill absolute left-1/2 top-1/2 block aspect-square w-[260%] rounded-full"
                  style={{ background: b.c, transform: i === 0 ? "translate(-50%,-50%)" : "translate(-50%,-50%) scale(0)" }}
                  aria-hidden
                />
                <span className="u68-lab relative z-[1] inline-block">
                  {b.l}
                </span>
              </button>
            </div>
          ))}
        </div>
        <p className="text-[14px] text-white/55" style={{ fontFamily: F.mr }}>
          ₹3,800 per guest · seven courses · natural wine pairing ₹1,900
        </p>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U69 · Inline menu hover image ───────────────────────── */
const U69_ITEMS = ["sourdough", "croissants", "cardamom buns", "filter coffee"];
function U69() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const q = useRef<{ x: Q; y: Q } | null>(null);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const fol = el.querySelector(".u69-fol");
    const imgs = el.querySelectorAll(".u69-img");
    if (!fol) return;
    gsap.set(fol, { xPercent: -50, yPercent: -50, x: el.clientWidth / 2, y: el.clientHeight / 2 });
    gsap.set(imgs, { yPercent: 150, rotate: 10, scale: 0.2, opacity: 0 });
    q.current = { x: gsap.quickTo(fol, "x", { duration: 0.6, ease: "power3" }), y: gsap.quickTo(fol, "y", { duration: 0.6, ease: "power3" }) };
    return () => {
      gsap.killTweensOf(imgs);
      gsap.killTweensOf(fol);
    };
  }, []);
  usePointer(
    root,
    dot,
    (t, el) => {
      const its = el.querySelectorAll(".u69-it");
      const off: [number, number] = [el.clientWidth * 0.5, el.clientHeight * 0.88];
      const at = (i: number): [number, number] => {
        if (!its[i]) return off;
        const b = rel(its[i], el);
        return [b.l + b.w * 0.5, b.t + b.h * 0.55];
      };
      const [x, y] = stepPath(t, [at(0), at(1), off, at(2), at(3), off], 1, 0.5);
      return { x: x + Math.sin(t * 2.3) * 16, y: y + Math.cos(t * 1.9) * 7, inside: true };
    },
    (p, el) => {
      q.current?.x(p.x);
      q.current?.y(p.y);
      const its = [...el.querySelectorAll(".u69-it")];
      const idx = p.inside ? its.findIndex((n) => inBox(rel(n, el), p.x, p.y)) : -1;
      const st = el as HTMLDivElement & { _u69?: number };
      const prev = st._u69 ?? -1;
      if (idx === prev) return;
      st._u69 = idx;
      its.forEach((n, i) => n.classList.toggle("on", i === idx));
      const imgs = el.querySelectorAll(".u69-img");
      if (prev >= 0 && imgs[prev]) gsap.to(imgs[prev], { yPercent: -40, rotate: -6, scale: 0.6, opacity: 0, duration: 0.35, ease: "power2.in", overwrite: true });
      if (idx >= 0 && imgs[idx])
        gsap.fromTo(imgs[idx], { yPercent: 150, rotate: 10, scale: 0.2, opacity: 1 }, { yPercent: 0, rotate: 0, scale: 1, duration: 0.7, ease: "expo.out", overwrite: true });
    },
  );
  const W = (i: number) => (
    <a href="#" onClick={(e) => e.preventDefault()} className={`u69-it ${i === 0 ? "on" : ""}`} data-cursor="Order">
      {U69_ITEMS[i]}
    </a>
  );
  return (
    <Stage r={root} g1="rgba(255,179,107,.52)" g2="rgba(255,122,89,.2)">
      <div className="absolute inset-0 flex flex-col justify-center px-[9%]">
        <Eyebrow>Ember &amp; Rye · bakery, open 7 am</Eyebrow>
        <p className="mt-[3vh] max-w-[22ch] text-[clamp(44px,4.7vw,74px)] leading-[1.12] tracking-[-0.015em]" style={{ fontFamily: F.fr, fontWeight: 350 }}>
          Every morning we bake {W(0)}, fold butter into {W(1)}, roll warm {W(2)} and pour slow {W(3)}.
        </p>
        <p className="mt-[3vh] text-[15px] text-white/55" style={{ fontFamily: F.sg }}>
          Loaves from ₹220 · pastries from ₹140
        </p>
      </div>
      <div className="u69-fol pointer-events-none absolute left-0 top-0 z-30 h-[clamp(200px,30vh,280px)] w-[clamp(160px,24vh,224px)]" aria-hidden>
        {U69_ITEMS.map((n, i) => (
          <div key={n} className="u69-img absolute inset-0 overflow-hidden rounded-[14px] shadow-[0_24px_50px_rgba(0,0,0,.5)]" style={{ opacity: 0 }}>
            <Img i={i + 4} w={320} h={400} />
          </div>
        ))}
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U70 · Colour wipe through link text ───────────────────────── */
const U70_LINKS = ["Tea gardens", "Brewing guide", "Tasting room", "Wholesale"];
function U70() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useWalk(root, dot, {
    sel: ".u70-l",
    order: [0, 1, 2, 3, -1],
    seg: 1.05,
    move: 0.5,
    wob: 6,
    at: (b) => [b.l + b.w * 0.55, b.t + b.h * 0.55],
    off: (w, h) => [w * 0.86, h * 0.5],
  });
  return (
    <Stage r={root} g1="rgba(157,242,200,.5)" g2="rgba(79,141,255,.22)">
      <div className="absolute inset-0 grid grid-cols-[1fr_1.5fr] items-center px-[7%]">
        <div>
          <Eyebrow>Highfield Estate · tea</Eyebrow>
          <p className="mt-4 max-w-[24ch] text-[17px] leading-[1.5] text-white/60" style={{ fontFamily: F.mr }}>
            A second colour wipes through the words left to right, with the underline. First flush Darjeeling, ₹1,240 per 100 g.
          </p>
        </div>
        <nav className="flex flex-col items-start gap-[1.4vh]">
          {U70_LINKS.map((l, i) => (
            <a
              key={l}
              href="#"
              onClick={(e) => e.preventDefault()}
              className={`u70-l ${i === 0 ? "on" : ""} whitespace-nowrap text-[clamp(48px,5.2vw,84px)] leading-[1.1] tracking-[-0.02em]`}
              style={{ fontFamily: F.sg, fontWeight: 600 }}
            >
              {l}
              <span className="u70-dup" aria-hidden>
                {l}
              </span>
              <span className="u70-u" aria-hidden />
            </a>
          ))}
        </nav>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U71 · Edge-aware marquee menu ───────────────────────── */
const U71_ROWS = ["Lisbon", "Oaxaca", "Tbilisi", "Hokkaido"];
function U71() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const mqs = el.querySelectorAll(".u71-mq");
    const ins = el.querySelectorAll(".u71-in");
    gsap.set(mqs, { y: 0, yPercent: 101 });
    gsap.set(ins, { y: 0, yPercent: -101 });
    return () => {
      gsap.killTweensOf(mqs);
      gsap.killTweensOf(ins);
    };
  }, []);
  usePointer(
    root,
    dot,
    (t, el) => {
      const m = el.querySelector(".u71-menu");
      if (!m) return { x: 0, y: 0, inside: false };
      const b = rel(m, el);
      const ph = (t / 5.2) * Math.PI * 2;
      // slow vertical sweep: down through every row, then back up (so rows are entered from the top and the bottom)
      return { x: b.l + b.w * (0.5 + 0.22 * Math.sin(ph * 0.5)), y: b.t - 34 + (b.h + 68) * (0.5 - 0.5 * Math.cos(ph)), inside: true };
    },
    (p, el) => {
      const rows = [...el.querySelectorAll(".u71-row")];
      const idx = p.inside ? rows.findIndex((n) => inBox(rel(n, el), p.x, p.y)) : -1;
      const st = el as HTMLDivElement & { _u71?: number };
      const prev = st._u71 ?? -1;
      if (idx === prev) return;
      st._u71 = idx;
      const edge = (r: Element) => {
        const b = rel(r, el);
        return p.y - b.t < b.h / 2 ? -1 : 1; // -1 top, 1 bottom
      };
      if (prev >= 0 && rows[prev]) {
        const e = edge(rows[prev]);
        gsap.to(rows[prev].querySelector(".u71-mq"), { yPercent: 101 * e, duration: 0.6, ease: "expo.out", overwrite: true });
        gsap.to(rows[prev].querySelector(".u71-in"), { yPercent: -101 * e, duration: 0.6, ease: "expo.out", overwrite: true });
      }
      if (idx >= 0 && rows[idx]) {
        const e = edge(rows[idx]);
        gsap.fromTo(rows[idx].querySelector(".u71-mq"), { yPercent: 101 * e }, { yPercent: 0, duration: 0.6, ease: "expo.out", overwrite: true });
        gsap.fromTo(rows[idx].querySelector(".u71-in"), { yPercent: -101 * e }, { yPercent: 0, duration: 0.6, ease: "expo.out", overwrite: true });
      }
    },
  );
  return (
    <Stage r={root} g1="rgba(200,255,138,.5)" g2="rgba(79,141,255,.22)">
      <div className="absolute inset-0 flex flex-col justify-center px-[7%]">
        <div className="mb-[3vh] flex items-end justify-between">
          <Eyebrow>Far Field Journeys · 2027 routes</Eyebrow>
          <Eyebrow>From ₹1,84,000</Eyebrow>
        </div>
        <nav className="u71-menu border-b border-white/15">
          {U71_ROWS.map((r, i) => (
            <a key={r} href="#" onClick={(e) => e.preventDefault()} className="u71-row flex h-[clamp(84px,12.5vh,120px)] items-center justify-center" data-cursor="Explore">
              <span className="text-[clamp(44px,4.8vw,76px)] uppercase leading-none tracking-[-0.01em]" style={{ fontFamily: F.sy, fontWeight: 700 }}>
                {r}
              </span>
              <span className="u71-mq" style={{ transform: i === 0 ? "none" : "translateY(101%)" }} aria-hidden>
                <span className="u71-in">
                  <span className="u71-track">
                    {[0, 1].map((k) =>
                      [0, 1, 2].map((j) => (
                        <span key={`${k}${j}`} className="flex items-center gap-[2vw]">
                          <span className="text-[clamp(36px,3.8vw,60px)] uppercase leading-none" style={{ fontFamily: F.sy, fontWeight: 700 }}>
                            {r}
                          </span>
                          <span className="block h-[clamp(52px,8vh,78px)] w-[clamp(110px,15vh,150px)] overflow-hidden rounded-[10px]">
                            <Img i={i * 2 + j + 1} w={300} h={160} />
                          </span>
                        </span>
                      )),
                    )}
                  </span>
                </span>
              </span>
            </a>
          ))}
        </nav>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U72 · Subscribe button state swap ───────────────────────── */
function U72() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const btn = el.querySelector<HTMLElement>(".u72-btn");
    const lab = el.querySelector(".u72-lab");
    const ok = el.querySelector(".u72-ok");
    const ck = el.querySelector(".u72-ck");
    const cnt = el.querySelector(".u72-n");
    const d = dot.current;
    const dIn = d?.querySelector("span");
    if (!btn || !lab || !ok || !ck || !cnt || !d || !dIn) return;
    const b = rel(btn, el);
    const cx = b.l + b.w * 0.6;
    const cy = b.t + b.h * 0.5;
    const rest: [number, number] = [cx + 260, cy + 120];
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(d, { opacity: 1, x: rest[0], y: rest[1] })
      .set(btn, { backgroundColor: "#f4efe6", color: "#140e08" })
      .set(lab, { x: 0, opacity: 1 })
      .set(ok, { y: 0, yPercent: 100, opacity: 0 })
      .set(ck, { strokeDashoffset: 1 })
      .call(() => (cnt.textContent = "12,480"))
      .to(d, { x: cx, y: cy, duration: 0.5, ease: "power2.inOut" });
    press(tl, dIn, btn);
    tl.to(lab, { x: 50, opacity: 0, duration: 0.32, ease: "power2.in" }, "<")
      .to(btn, { backgroundColor: "#1f9e6e", color: "#f1fff8", duration: 0.4, ease: "power2.out" }, "<0.1")
      .to(ok, { yPercent: 0, opacity: 1, duration: 0.42, ease: "power3.out" }, "<0.08")
      .to(ck, { strokeDashoffset: 0, duration: 0.35, ease: "power2.out" }, "<0.15")
      .call(() => (cnt.textContent = "12,481"), undefined, "<")
      .fromTo(cnt, { y: 8, opacity: 0.2 }, { y: 0, opacity: 1, duration: 0.3 }, "<")
      .to(d, { x: rest[0] - 60, y: rest[1] - 10, duration: 0.6, ease: "sine.inOut" })
      .to(d, { x: cx, y: cy, duration: 0.5, ease: "power2.inOut" });
    press(tl, dIn, btn);
    // reverse: confirmation drops away, label slides back from the right, colour flips back
    tl.to(ok, { yPercent: 100, opacity: 0, duration: 0.32, ease: "power2.in" }, "<")
      .to(btn, { backgroundColor: "#f4efe6", color: "#140e08", duration: 0.4, ease: "power2.out" }, "<0.1")
      .fromTo(lab, { x: 50, opacity: 0 }, { x: 0, opacity: 1, duration: 0.42, ease: "power3.out" }, "<0.08")
      .call(() => (cnt.textContent = "12,480"), undefined, "<")
      .to(d, { x: rest[0], y: rest[1], duration: 0.55, ease: "sine.inOut" });
    const click = () => tl.restart();
    btn.addEventListener("click", click);
    onClean(() => btn.removeEventListener("click", click));
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(43,217,159,.5)" g2="rgba(255,179,107,.22)">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex w-[min(78%,880px)] items-center justify-between gap-[4vw] rounded-[26px] border border-white/10 bg-white/[0.04] px-[4%] py-[6vh] backdrop-blur-sm">
          <div>
            <Eyebrow>Field Roast · the Sunday letter</Eyebrow>
            <p className="mt-3 text-[clamp(40px,4vw,62px)] leading-[1.02] tracking-[-0.02em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
              New beans, every Sunday
            </p>
            <p className="mt-3 text-[15px] text-white/55" style={{ fontFamily: F.sg }}>
              <span className="u72-n inline-block">12,480</span> readers · first bag ₹640
            </p>
          </div>
          <button
            type="button"
            className="u72-btn relative h-[76px] w-[270px] shrink-0 overflow-hidden rounded-full text-[20px] font-[600]"
            style={{ backgroundColor: "#f4efe6", color: "#140e08", fontFamily: F.sg }}
          >
            <span className="u72-lab absolute inset-0 flex items-center justify-center gap-3 whitespace-nowrap">
              Subscribe
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M4 10h11M11 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="u72-ok absolute inset-0 flex items-center justify-center gap-3 whitespace-nowrap" style={{ transform: "translateY(100%)", opacity: 0 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path className="u72-ck" d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} />
              </svg>
              Subscribed
            </span>
          </button>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U73 · Theme switch shape wipe ───────────────────────── */
const U73_SHAPES = ["circle", "square", "diamond", "hexagon", "triangle", "star"] as const;
type Shape = (typeof U73_SHAPES)[number];
/** Unit shape points (radius 1) + how much bigger than the corner distance it must grow to cover the page. */
const U73_POLY: Record<Exclude<Shape, "circle">, { pts: [number, number][]; k: number }> = {
  square: { pts: [[-1, -1], [1, -1], [1, 1], [-1, 1]], k: 1.02 },
  diamond: { pts: [[0, -1], [1, 0], [0, 1], [-1, 0]], k: 1.45 },
  hexagon: { pts: [0, 1, 2, 3, 4, 5].map((i) => { const a = ((-90 + 60 * i) * Math.PI) / 180; return [Math.cos(a), Math.sin(a)] as [number, number]; }), k: 1.18 },
  triangle: { pts: [-90, 30, 150].map((d) => { const a = (d * Math.PI) / 180; return [Math.cos(a), Math.sin(a)] as [number, number]; }), k: 2.05 },
  star: { pts: Array.from({ length: 10 }, (_, i) => { const a = ((-90 + 36 * i) * Math.PI) / 180; const r = i % 2 ? 0.46 : 1; return [Math.cos(a) * r, Math.sin(a) * r] as [number, number]; }), k: 2.4 },
};
function clipFor(s: Shape, cx: number, cy: number, R: number) {
  if (s === "circle") return `circle(${R.toFixed(1)}px at ${cx.toFixed(1)}px ${cy.toFixed(1)}px)`;
  const { pts, k } = U73_POLY[s];
  return `polygon(${pts.map(([x, y]) => `${(cx + x * R * k).toFixed(1)}px ${(cy + y * R * k).toFixed(1)}px`).join(",")})`;
}
function U73Page() {
  return (
    <div className="flex h-full w-full flex-col px-[5%] py-[4%]">
      <header className="flex items-center justify-between border-b pb-[2.4vh]" style={{ borderColor: "var(--ln)", fontFamily: F.sg }}>
        <span className="text-[22px] font-[700] tracking-[-0.02em]">Lumen &amp; Loom</span>
        <span className="flex items-center gap-8 text-[15px]" style={{ color: "var(--mu)" }}>
          <span>Bedding</span>
          <span>Bath</span>
          <span>Journal</span>
          <button type="button" className="u73-tog flex h-[48px] w-[48px] items-center justify-center rounded-full border" style={{ borderColor: "var(--ln)", color: "var(--fg)" }} aria-label="Switch theme">
            <svg className="u73-sun" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="2" />
              <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <svg className="u73-moon" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            </svg>
          </button>
        </span>
      </header>
      <div className="grid flex-1 grid-cols-[1.1fr_1fr] items-center gap-[4%]">
        <div>
          <p className="text-[13px] uppercase tracking-[0.22em]" style={{ color: "var(--ac)", fontFamily: F.sg }}>
            Washed linen · new season
          </p>
          <p className="mt-3 text-[clamp(44px,4.4vw,70px)] leading-[1] tracking-[-0.02em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
            Linen for slow mornings
          </p>
          <p className="mt-4 text-[15px]" style={{ color: "var(--mu)", fontFamily: F.mr }}>
            Duvet set from ₹8,900 · free returns
          </p>
        </div>
        <div className="grid grid-cols-2 gap-[14px]">
          {[
            { n: "Oat duvet set", p: "₹8,900" },
            { n: "Clay sheet set", p: "₹5,400" },
          ].map((c, i) => (
            <div key={c.n} className="overflow-hidden rounded-[14px]" style={{ background: "var(--cd)" }}>
              <div className="aspect-[4/3.4]">
                <Img i={i + 6} w={360} h={300} />
              </div>
              <div className="flex items-center justify-between px-3 py-3 text-[14px]" style={{ fontFamily: F.sg }}>
                <span>{c.n}</span>
                <span style={{ color: "var(--ac)" }}>{c.p}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function U73() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const frame = el.querySelector<HTMLElement>(".u73-frame");
    const base = el.querySelector<HTMLElement>(".u73-base");
    const top = el.querySelector<HTMLElement>(".u73-top");
    const chip = el.querySelector(".u73-chip");
    const d = dot.current;
    const dIn = d?.querySelector("span");
    if (!frame || !base || !top || !chip || !d || !dIn) return;
    let theme: "light" | "dark" = "light";
    let n = 0;
    let wipe: gsap.core.Tween | null = null;
    const step = () => {
      const tg = top.querySelector(".u73-tog");
      if (!tg) return;
      wipe?.progress(1);
      const shape = U73_SHAPES[n % U73_SHAPES.length];
      n++;
      chip.textContent = shape;
      const next = theme === "light" ? "dark" : "light";
      const f = rel(frame, el);
      const b = rel(tg, frame);
      const cx = b.l + b.w / 2;
      const cy = b.t + b.h / 2;
      const D = Math.max(Math.hypot(cx, cy), Math.hypot(f.w - cx, cy), Math.hypot(cx, f.h - cy), Math.hypot(f.w - cx, f.h - cy));
      top.dataset.theme = next;
      const pr = { s: 0 };
      top.style.clipPath = clipFor(shape, cx, cy, 0);
      top.style.visibility = "visible";
      wipe = gsap.to(pr, {
        s: 1,
        duration: 0.4,
        ease: "power2.inOut",
        onUpdate: () => {
          top.style.clipPath = clipFor(shape, cx, cy, Math.max(0.01, pr.s * D));
        },
        onComplete: () => {
          base.dataset.theme = next;
          top.style.visibility = "hidden";
          theme = next;
        },
      });
    };
    const tog = top.querySelector<HTMLElement>(".u73-tog");
    const togB = tog ? rel(tog, el) : { l: 0, t: 0, w: 0, h: 0 };
    const tx = togB.l + togB.w / 2;
    const ty = togB.t + togB.h / 2;
    const W = el.clientWidth;
    const H = el.clientHeight;
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(d, { opacity: 1, x: W * 0.62, y: H * 0.62 }).to(d, { x: tx, y: ty, duration: 0.45, ease: "power2.inOut" });
    press(tl, dIn);
    tl.call(step, undefined, "<").to(d, { x: W * 0.7, y: H * 0.46, duration: 0.55, ease: "sine.inOut" }, "+=0.1").to(d, { x: W * 0.62, y: H * 0.62, duration: 0.3, ease: "sine.inOut" });
    const click = (e: Event) => {
      if ((e.target as Element).closest(".u73-tog")) step();
    };
    el.addEventListener("click", click);
    onClean(() => {
      el.removeEventListener("click", click);
      wipe?.kill();
    });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,179,107,.5)" g2="rgba(79,141,255,.24)">
      <div className="u73-frame absolute inset-x-[6%] bottom-[12%] top-[6%] overflow-hidden rounded-[22px] shadow-[0_30px_70px_rgba(0,0,0,.45)]">
        <div className="u73-base u73-pg absolute inset-0" data-theme="light">
          <U73Page />
        </div>
        <div className="u73-top u73-pg absolute inset-0" data-theme="dark" style={{ visibility: "hidden", clipPath: "circle(0px at 95% 8%)" }} aria-hidden>
          <U73Page />
        </div>
      </div>
      <div className="absolute bottom-[4%] left-1/2 flex items-center gap-3 whitespace-nowrap" style={{ transform: "translateX(-50%)", fontFamily: F.sg }}>
        <span className="text-[13px] uppercase tracking-[0.22em] text-white/55">Wipe shape</span>
        <span className="u73-chip rounded-full border border-white/20 px-4 py-1 text-[14px] text-white">circle</span>
        <span className="text-[13px] text-white/45">circle · square · diamond · hexagon · triangle · star</span>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U74 · Pointer replaced inside area ───────────────────────── */
function U74() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const inside = useRef<boolean[]>([false, false]);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const ics = el.querySelectorAll(".u74-ic");
    gsap.set(ics, { x: 0, y: 0, xPercent: -50, yPercent: -50, scale: 0 });
    return () => {
      gsap.killTweensOf(ics);
    };
  }, []);
  usePointer(
    root,
    dot,
    (t, el) => {
      const W = el.clientWidth;
      const H = el.clientHeight;
      const w = (Math.PI * 2) / 6;
      // slow figure-eight: in and out of both cards
      return { x: W * 0.5 + W * 0.43 * Math.sin(t * w), y: H * 0.5 + H * 0.3 * Math.sin(2 * t * w), inside: true };
    },
    (p, el, fake) => {
      const cards = el.querySelectorAll(".u74-card");
      let any = false;
      cards.forEach((c, i) => {
        const b = rel(c, el);
        const now = p.inside && inBox(b, p.x, p.y);
        const ic = c.querySelector(".u74-ic");
        if (!ic) return;
        if (now) {
          any = true;
          gsap.set(ic, { x: p.x - b.l, y: p.y - b.t });
        }
        if (now !== inside.current[i]) {
          inside.current[i] = now;
          gsap.to(ic, { scale: now ? 1 : 0, duration: now ? 0.4 : 0.3, ease: now ? "power3.out" : "power2.in", overwrite: "auto" });
        }
      });
      if (fake && any && dot.current) dot.current.style.opacity = "0";
    },
  );
  return (
    <Stage r={root} g1="rgba(255,207,107,.5)" g2="rgba(127,178,255,.26)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[3vh]">
        <Eyebrow>Harbour &amp; Hide · autumn</Eyebrow>
        <div className="flex gap-[3vw]">
          <figure className="u74-card relative h-[clamp(300px,46vh,440px)] w-[clamp(300px,28vw,420px)] overflow-hidden rounded-[22px]">
            <Img i={9} w={560} h={600} className="brightness-[.8]" />
            <figcaption className="absolute inset-x-0 bottom-0 p-6">
              <p className="text-[13px] uppercase tracking-[0.22em] text-white/70" style={{ fontFamily: F.sg }}>
                Lookbook · 24 looks
              </p>
              <p className="mt-1 text-[clamp(30px,2.6vw,40px)] leading-none" style={{ fontFamily: F.is }}>
                The coast in wool
              </p>
            </figcaption>
            <span className="u74-ic pointer-events-none absolute left-0 top-0 z-10 flex h-[92px] w-[92px] items-center justify-center rounded-full bg-[#ffcf6b] text-[15px] font-[700] uppercase tracking-[0.12em] text-[#140e04]" style={{ transform: "scale(0)", fontFamily: F.sg }}>
              View
            </span>
          </figure>
          <figure className="u74-card relative flex h-[clamp(300px,46vh,440px)] w-[clamp(300px,28vw,420px)] flex-col overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.05]">
            <div className="relative flex-1 overflow-hidden">
              <Img i={10} w={560} h={420} />
            </div>
            <figcaption className="flex items-end justify-between p-6" style={{ fontFamily: F.sg }}>
              <div>
                <p className="text-[20px] font-[600]">Merino field coat</p>
                <p className="text-[13px] text-white/55">Ink · sizes S–XL</p>
              </div>
              <p className="text-[19px]">₹14,500</p>
            </figcaption>
            <span className="u74-ic pointer-events-none absolute left-0 top-0 z-10 flex items-center gap-2" style={{ transform: "scale(0)" }}>
              <svg width="34" height="40" viewBox="0 0 34 40" fill="none" aria-hidden>
                <path d="M3 2 L31 20 L18 22 L24 36 L18 38 L12 25 L3 33 Z" fill="#7fb2ff" stroke="#0a0d16" strokeWidth="2" strokeLinejoin="round" />
              </svg>
              <span className="rounded-full bg-[#7fb2ff] px-3 py-1 text-[13px] font-[700] text-[#06101f]" style={{ fontFamily: F.sg }}>
                Add +
              </span>
            </span>
          </figure>
        </div>
        <p className="text-[14px] text-white/50" style={{ fontFamily: F.mr }}>
          Inside each card the arrow is hidden and the card&apos;s own pointer takes over.
        </p>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U75 · Rotating border spot that expands ───────────────────────── */
function U75() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useWalk(root, dot, {
    sel: ".u75-t",
    order: [0, -1, 1, -1],
    seg: 1.1,
    move: 0.55,
    wob: 10,
    off: (w, h) => [w * 0.5, h * 0.9],
  });
  const k = { "--u75k": "#ffd27a" } as CSSProperties;
  return (
    <Stage r={root} g1="rgba(255,210,122,.5)" g2="rgba(160,120,255,.24)">
      <div className="absolute inset-0 flex items-center justify-center gap-[5vw]" style={{ fontFamily: F.sg }}>
        <div className="flex flex-col items-start gap-6">
          <Eyebrow>Atelier Noor · tailoring</Eyebrow>
          <p className="max-w-[12ch] text-[clamp(48px,4.8vw,76px)] leading-[0.98] tracking-[-0.02em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
            Cut to your measure
          </p>
          <button type="button" className="u75-t on rounded-full px-10 py-5 text-[20px] font-[600]" style={k}>
            <span className="u75-halo" aria-hidden />
            <span className="u75-fill" aria-hidden />
            <span className="u75-ring" aria-hidden />
            Reserve a fitting →
          </button>
        </div>
        <div className="u75-t w-[clamp(300px,26vw,380px)] rounded-[24px] p-8" style={k}>
          <span className="u75-halo" aria-hidden />
          <span className="u75-fill" aria-hidden />
          <span className="u75-ring" aria-hidden />
          <p className="text-[13px] uppercase tracking-[0.22em] text-[#ffd27a]">Membership</p>
          <p className="mt-3 text-[40px] font-[600] leading-none">₹18,000</p>
          <p className="mt-1 text-[14px] text-white/55">per year</p>
          <ul className="mt-6 space-y-2 text-[15px] text-white/75">
            <li>Two bespoke fittings</li>
            <li>Free alterations, for life</li>
            <li>First look at new cloth</li>
          </ul>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U76 · Staggered menu ───────────────────────── */
const U76_ITEMS = ["Shop", "Lookbook", "Stores", "Journal", "Contact"];
function U76() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const btn = el.querySelector<HTMLElement>(".u76-btn");
    const labs = el.querySelectorAll(".u76-bl");
    const plus = el.querySelector(".u76-plus");
    const layers = el.querySelectorAll(".u76-l");
    const items = el.querySelectorAll(".u76-it");
    const meta = el.querySelector(".u76-meta");
    const d = dot.current;
    const dIn = d?.querySelector("span");
    if (!btn || !plus || !meta || !d || !dIn || items.length < 4) return;
    const b = rel(btn, el);
    const bx = b.l + b.w * 0.5;
    const by = b.t + b.h * 0.5;
    const at = (i: number): [number, number] => {
      const r = rel(items[i], el);
      return [r.l + Math.min(r.w, 260) * 0.6, r.t + r.h * 0.5];
    };
    const W = el.clientWidth;
    const H = el.clientHeight;
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(d, { opacity: 1, x: W * 0.42, y: H * 0.7 })
      .set(layers, { x: 0, xPercent: 101 })
      .set(items, { yPercent: 130, rotate: 7 })
      .set(meta, { opacity: 0, y: 14 })
      .set(labs, { yPercent: 0 })
      .set(plus, { rotate: 0 })
      .to(d, { x: bx, y: by, duration: 0.5, ease: "power2.inOut" });
    press(tl, dIn, btn);
    tl.to(layers, { xPercent: 0, duration: 0.6, ease: "power4.out", stagger: 0.08 }, "<")
      .to(labs, { yPercent: -100, duration: 0.4, ease: "power3.inOut" }, "<")
      .to(plus, { rotate: 45, duration: 0.4, ease: "power3.inOut" }, "<")
      .to(items, { yPercent: 0, rotate: 0, duration: 0.65, ease: "power4.out", stagger: 0.06 }, "<0.3")
      .to(meta, { opacity: 1, y: 0, duration: 0.4 }, "<0.25")
      .to(d, { x: at(1)[0], y: at(1)[1], duration: 0.45, ease: "power2.inOut" }, "<")
      .to(items[1], { x: 16, color: "#ff7a59", duration: 0.3 }, ">-0.1")
      .to(d, { x: at(3)[0], y: at(3)[1], duration: 0.45, ease: "power2.inOut" })
      .to(items[1], { x: 0, color: "#140e08", duration: 0.3 }, "<")
      .to(items[3], { x: 16, color: "#ff7a59", duration: 0.3 }, ">-0.1")
      .to(d, { x: bx, y: by, duration: 0.45, ease: "power2.inOut" })
      .to(items[3], { x: 0, color: "#140e08", duration: 0.3 }, "<");
    press(tl, dIn, btn);
    tl.to(items, { yPercent: -120, duration: 0.3, ease: "power2.in", stagger: 0.03 }, "<")
      .to(meta, { opacity: 0, duration: 0.2 }, "<")
      .to(layers, { xPercent: 101, duration: 0.45, ease: "power3.in", stagger: { each: 0.07, from: "end" } }, "<0.15")
      .to(labs, { yPercent: 0, duration: 0.4, ease: "power3.inOut" }, "<")
      .to(plus, { rotate: 0, duration: 0.4, ease: "power3.inOut" }, "<")
      .to(d, { x: W * 0.42, y: H * 0.7, duration: 0.5, ease: "sine.inOut" }, "<0.2");
    const click = () => tl.restart();
    btn.addEventListener("click", click);
    onClean(() => btn.removeEventListener("click", click));
    return tl;
  });
  const LAYERS = ["#ffb36b", "#ff7a59"];
  return (
    <Stage r={root} g1="rgba(255,122,89,.5)" g2="rgba(255,179,107,.24)">
      <div className="absolute inset-0 flex flex-col px-[6%] py-[5%]" style={{ fontFamily: F.sg }}>
        <header className="relative z-20 flex items-center justify-between">
          <span className="text-[24px] font-[700] tracking-[-0.02em]">Northfold</span>
          <button type="button" className="u76-btn flex items-center gap-3 rounded-full border border-white/25 bg-[#0a0d16]/70 px-6 py-3 text-[17px] font-[600]">
            <span className="relative block h-[1.3em] overflow-hidden">
              <span className="u76-bl block">Menu</span>
              <span className="u76-bl absolute left-0 top-full block">Close</span>
            </span>
            <span className="u76-plus block text-[22px] leading-none">+</span>
          </button>
        </header>
        <div className="flex flex-1 flex-col justify-center">
          <Eyebrow>Outerwear · AW27</Eyebrow>
          <p className="mt-3 max-w-[13ch] text-[clamp(52px,5.4vw,86px)] leading-[0.98] tracking-[-0.02em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
            Coats cut for coastal winters
          </p>
          <p className="mt-4 text-[15px] text-white/55">Storm parka ₹21,900 · wax jacket ₹16,400</p>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-[46%]">
        {LAYERS.map((c) => (
          <div key={c} className="u76-l absolute inset-0" style={{ background: c, transform: "translateX(101%)" }} aria-hidden />
        ))}
        <div className="u76-l pointer-events-auto absolute inset-0 flex flex-col justify-between bg-[#f4efe6] px-[12%] pb-[8%] pt-[18%] text-[#140e08]" style={{ transform: "translateX(101%)" }}>
          <nav className="flex flex-col gap-[0.6vh]">
            {U76_ITEMS.map((it, i) => (
              <span key={it} className="block overflow-hidden">
                <a href="#" onClick={(e) => e.preventDefault()} className="u76-it flex items-baseline gap-4 text-[clamp(40px,4.2vw,66px)] font-[800] uppercase leading-[1.05] tracking-[-0.02em]" style={{ fontFamily: F.sy }}>
                  {it}
                  <span className="text-[13px] font-[500] tracking-[0.1em] text-[#ff7a59]" style={{ fontFamily: F.sg }}>
                    0{i + 1}
                  </span>
                </a>
              </span>
            ))}
          </nav>
          <div className="u76-meta flex gap-6 text-[14px] text-[#140e08]/60" style={{ fontFamily: F.sg }}>
            <span>Instagram</span>
            <span>Newsletter</span>
            <span>Care guide</span>
          </div>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U77 · Card grid hover highlight glide ───────────────────────── */
type FlipT = Awaited<ReturnType<typeof loadPlugin<"Flip">>>;
const U77_CARDS = [
  { t: "Made to order", s: "Built in our Jodhpur workshop in six weeks." },
  { t: "Solid wood only", s: "Sheesham and teak, never veneer." },
  { t: "White-glove delivery", s: "Placed in your room, packaging taken away." },
  { t: "Ten-year frame", s: "Joints and frames covered for a decade." },
  { t: "Fabric library", s: "Forty-two weaves, swatches sent free." },
  { t: "Pay in parts", s: "From ₹4,200 a month, no extra cost." },
];
function U77() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const flip = useRef<FlipT | null>(null);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let dead = false;
    loadPlugin("Flip").then((f) => {
      if (!dead) flip.current = f;
    });
    const el = root.current;
    return () => {
      dead = true;
      if (el) gsap.killTweensOf(el.querySelectorAll(".u77-bg"));
    };
  }, []);
  useWalk(root, dot, {
    sel: ".u77-c",
    order: [0, 4, 2, 5, 1, 3, -1],
    seg: 0.95,
    move: 0.5,
    wob: 8,
    off: (w, h) => [w * 0.5, h * 0.94],
    onChange: (now, prev, _p, el) => {
      const bg = el.querySelector<HTMLElement>(".u77-bg");
      const grid = el.querySelector(".u77-grid");
      const card = el.querySelectorAll(".u77-c")[now];
      if (!bg || !grid) return;
      if (now < 0 || !card) {
        gsap.to(bg, { opacity: 0, duration: 0.35, overwrite: "auto" });
        return;
      }
      const fresh = prev < 0;
      const F2 = flip.current;
      if (F2) F2.fit(bg, card, { duration: fresh ? 0 : 0.5, ease: "power3.out" });
      else {
        const b = rel(card, grid);
        gsap.to(bg, { left: 0, top: 0, x: b.l, y: b.t, width: b.w, height: b.h, duration: fresh ? 0 : 0.5, ease: "power3.out" });
      }
      gsap.to(bg, { opacity: 1, duration: 0.3, overwrite: "auto" });
    },
  });
  return (
    <Stage r={root} g1="rgba(127,178,255,.5)" g2="rgba(255,179,107,.2)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[3.5vh]">
        <div className="text-center">
          <Eyebrow>Teakline · why buy from us</Eyebrow>
          <p className="mt-3 text-[clamp(40px,4vw,62px)] leading-none tracking-[-0.02em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
            Furniture that stays
          </p>
        </div>
        <div className="u77-grid relative grid w-[min(80%,1040px)] grid-cols-3 gap-[14px]">
          <div
            className="u77-bg pointer-events-none absolute left-0 top-0 rounded-[18px] border border-[#7fb2ff]/40 bg-[#7fb2ff]/[0.14]"
            style={{ width: "calc((100% - 28px) / 3)", height: "calc((100% - 14px) / 2)" }}
            aria-hidden
          />
          {U77_CARDS.map((c, i) => (
            <div key={c.t} className={`u77-c relative flex min-h-[clamp(150px,21vh,200px)] flex-col justify-between rounded-[18px] border border-white/10 p-6 ${i === 0 ? "on" : ""}`} style={{ fontFamily: F.sg }}>
              <span className="u77-ix flex h-[34px] w-[34px] items-center justify-center rounded-full border border-white/25 text-[13px] text-white/70">0{i + 1}</span>
              <div>
                <p className="u77-ttl text-[21px] font-[600] text-white/80">{c.t}</p>
                <p className="mt-1 text-[14px] leading-[1.45] text-white/55">{c.s}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U78 · Border trail ───────────────────────── */
function Trail({ k, d, r, s }: { k: string; d: string; r: string; s: string }) {
  const v = { "--u78k": k, "--u78d": d, "--u78r": r, "--u78s": s } as CSSProperties;
  return (
    <>
      <span className="u78-b" style={v} aria-hidden>
        <span className="u78-blob" />
      </span>
    </>
  );
}
function U78() {
  return (
    <Stage g1="rgba(255,207,107,.5)" g2="rgba(127,178,255,.24)">
      <div className="absolute inset-0 flex items-center justify-center gap-[5vw]" style={{ fontFamily: F.sg }}>
        <div className="relative w-[clamp(320px,28vw,420px)] rounded-[28px] border border-white/10 bg-[#0d111c] p-9">
          <Trail k="#ffcf6b" d="5s" r="28px" s="120px" />
          <div className="relative z-[1]">
            <p className="text-[13px] uppercase tracking-[0.22em] text-[#ffcf6b]">Founders&apos; plan</p>
            <p className="mt-4 text-[52px] font-[600] leading-none tracking-[-0.02em]">₹2,400</p>
            <p className="mt-1 text-[15px] text-white/55">per month, billed yearly</p>
            <ul className="mt-7 space-y-2 text-[15px] text-white/75">
              <li>Unlimited projects</li>
              <li>Five team seats</li>
              <li>Priority support</li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col items-start gap-7">
          <Eyebrow>Quillnote · plans</Eyebrow>
          <p className="max-w-[11ch] text-[clamp(46px,4.6vw,72px)] leading-[0.98] tracking-[-0.02em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
            A light runs the edge
          </p>
          <button type="button" className="relative rounded-full border border-white/10 bg-[#0d111c] px-9 py-5 text-[19px] font-[600]">
            <Trail k="#7fb2ff" d="3.2s" r="999px" s="70px" />
            <span className="relative z-[1]">Start free trial →</span>
          </button>
        </div>
      </div>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  {
    code: "U67",
    name: "Menu row marquee on hover",
    how: "Hovering a menu row lifts its label away and a marquee of the same word plus small photos runs across the row. A fake pointer walks the rows.",
    kind: "play",
    C: U67,
  },
  {
    code: "U68",
    name: "Magnetic buttons with fills",
    how: "Buttons pull toward the pointer (text pulls a little further), a filler circle grows in from the entry point and the page tint changes to match. A fake pointer drags and presses.",
    kind: "play",
    C: U68,
  },
  {
    code: "U69",
    name: "Inline menu hover image",
    how: "Hovering a word in a sentence pops its photo up from below (y 150%, rotate 10→0, scale .2→1) and the photo trails the pointer. A fake pointer reads the words.",
    kind: "play",
    C: U69,
  },
  {
    code: "U70",
    name: "Colour wipe through link text",
    how: "On hover a second colour wipes through the link text left to right (clipped duplicate) with the underline, and wipes back on leave. A fake pointer walks the links.",
    kind: "play",
    C: U70,
  },
  {
    code: "U71",
    name: "Edge-aware marquee menu",
    how: "A marquee strip slides into a menu row from the edge the pointer entered (top or bottom), its content moving the opposite way, and exits to the nearest edge. A fake pointer sweeps up and down.",
    kind: "play",
    C: U71,
  },
  {
    code: "U72",
    name: "Subscribe button state swap",
    how: "On click the label slides out 50px to the right, the ‘Subscribed ✓’ label slides up from below and the button flips colour; a second click reverses it. A fake pointer clicks it.",
    kind: "play",
    C: U72,
  },
  {
    code: "U73",
    name: "Theme switch shape wipe",
    how: "Clicking the theme toggle reveals the other colour scheme through a shape growing from the button in 0.4 s; the shape cycles circle, square, diamond, hexagon, triangle, star.",
    kind: "play",
    C: U73,
  },
  {
    code: "U74",
    name: "Pointer replaced inside area",
    how: "Inside each card the arrow is hidden and the card's own pointer (a ‘View’ disc, an ‘Add’ arrow) follows, scaling in on enter and out on leave. A fake pointer sweeps a figure-eight.",
    kind: "play",
    C: U74,
  },
  {
    code: "U75",
    name: "Rotating border spot that expands",
    how: "A small light spot orbits the border of a button and a card; on hover it widens until the whole border is lit. A fake pointer visits each.",
    kind: "play",
    C: U75,
  },
  {
    code: "U76",
    name: "Staggered menu",
    how: "Clicking Menu sweeps two coloured layers and the panel in from the right one after another, then the items rise in with a stagger; Close reverses it. A fake pointer opens and closes it.",
    kind: "play",
    C: U76,
  },
  {
    code: "U77",
    name: "Card grid hover highlight glide",
    how: "One tinted card background glides (Flip.fit) diagonally and vertically across a 2×3 grid to whichever card is hovered and fades on leave. A fake pointer walks the grid.",
    kind: "play",
    C: U77,
  },
  {
    code: "U78",
    name: "Border trail",
    how: "A small glowing light runs around the rounded border (offset-path inset round), clipped to the border's thickness: one loop every 5 s on the card, faster on the button.",
    kind: "play",
    C: U78,
  },
];
