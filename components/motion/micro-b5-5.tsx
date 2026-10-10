"use client";

// Micro-interactions, batch 5 · group 5 (MOTION-MENU U91–U102). Small focused demos for /lab/motion.
// Every hover / click demo also plays by itself: a visible fake pointer (ring) walks over the targets (hover demos) or
// a scripted timeline moves it and "clicks" (click demos). The real mouse takes over for 2.5 s whenever it moves.
// A CSS-only glow loop never stops (and sits on top again, screen-blended) so covered stages never freeze.
// ?static=1 / reduced motion: no JS, the markup shows a sensible final state.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, SplitText, loadPlugin, prefersReducedMotion } from "@/lib/gsap";
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
.b5g5-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.5)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.22)),transparent 70%);animation:b5g5-drift 5.6s linear infinite alternate;will-change:transform}
@keyframes b5g5-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b5g5-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;pointer-events:none;z-index:40;opacity:0;transition:opacity .25s}
.b5g5-dot>span{display:block;width:100%;height:100%;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4)}
.b5g5-dot.tap>span{animation:b5g5-tap .32s ease-out}
@keyframes b5g5-tap{40%{transform:scale(.55);background:rgba(255,255,255,.6)}100%{transform:scale(1)}}

/* U91 scramble */
.u91-l{position:relative;display:inline-block;white-space:nowrap;color:rgba(238,242,255,.7);transition:color .3s}
.u91-l::after{content:"";position:absolute;left:0;right:0;bottom:-8px;height:2px;background:#9fe6ff;transform:scaleX(0);transform-origin:0 50%;transition:transform .45s ${EZ}}
.u91-l.on{color:#fff}
.u91-l.on::after{transform:scaleX(1)}
.u91-cta{transition:background-color .35s,color .35s}
.u91-cta.on{background:#9fe6ff;color:#06121a}

/* U92 filter */
.u92-f{transition:background-color .35s,color .35s,border-color .35s}
.u92-f.on{background:#ffcf7a;color:#140d02;border-color:#ffcf7a}

/* U93 raining letters */
.u93-c{position:relative;overflow:hidden;vertical-align:top;padding:0 .01em}
.u93-a{display:block}
.u93-b{position:absolute;left:0;top:0;display:block;transform:translateY(-110%);color:#ff9f7a}
.u93-row{transition:color .35s}

/* U94 glow */
.u94-ln{opacity:.25;transition:opacity .4s,text-shadow .4s}
.u94-ln.on{opacity:1;text-shadow:0 0 18px rgba(255,255,255,.7)}
.u94.js .u94-ln{opacity:1;text-shadow:none;transition:none}

/* U96 bubble */
.u96-b{position:relative;overflow:hidden;isolation:isolate;transition:color .45s ${EZ},border-color .45s}
.u96-bub{position:absolute;width:860px;height:860px;margin:-430px 0 0 -430px;border-radius:50%;background:#ffd36b;transform:scale(0);transition:transform .7s ${EIO};z-index:-1}
.u96-b.on{color:#160f02;border-color:#ffd36b}
.u96-b.on .u96-bub{transform:scale(1)}
.u96-ic{transition:background-color .45s,color .45s}
.u96-b.on .u96-ic{background:#160f02;color:#ffd36b}

/* U97 glint */
.u97-g{position:relative;overflow:hidden;isolation:isolate}
.u97-g::after{content:"";position:absolute;top:-60%;left:0;width:16%;height:220%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.85),transparent);transform:translateX(-260%) rotate(22deg);pointer-events:none;z-index:3;transition:none}
.u97-g.on::after{transform:translateX(820%) rotate(22deg);transition:transform .62s cubic-bezier(.45,0,.2,1)}
.u97-btn{transition:transform .35s ${EZ},box-shadow .35s}
.u97-btn.on{transform:translateY(-3px);box-shadow:0 18px 40px rgba(255,140,90,.35)}
.u97-card{transition:transform .5s ${EZ}}
.u97-card.on{transform:translateY(-6px) rotate(-1deg)}

/* U98 glass */
.u98-panel{transform-origin:50% 100%;opacity:0;transform:translateY(18px) scale(.35,.15);clip-path:inset(40% 30% 0 30% round 40px);transition:transform .6s ${EIO},opacity .35s,clip-path .6s ${EIO}}
.u98-wrap.on .u98-panel{opacity:1;transform:none;clip-path:inset(0 0 0 0 round 26px)}
.u98-panel>*{opacity:0;transform:translateY(10px);transition:opacity .3s,transform .45s ${EZ}}
.u98-wrap.on .u98-panel>*{opacity:1;transform:none;transition-delay:.22s}
.u98-btn{transition:background-color .35s,color .35s}
.u98-wrap.on .u98-btn{background:#fff;color:#0a0d16}
.u98-blob{animation:u98-float 4.2s ease-in-out infinite alternate}
@keyframes u98-float{to{transform:translate3d(30px,-24px,0) scale(1.08)}}

/* U99 cart */
.u99-spin{animation:u99-spin .8s linear infinite}
@keyframes u99-spin{to{transform:rotate(360deg)}}

/* U101 menu */
.u101-l{transition:opacity .4s,color .4s}
.u101-list.has .u101-l{opacity:.26}
.u101-list.has .u101-l.on{opacity:1;color:#fff}
.u101-ar{display:inline-block;opacity:0;transform:translateX(-14px);transition:opacity .35s,transform .45s ${EZ}}
.u101-l.on .u101-ar{opacity:1;transform:none}
.u101-kb{animation:u101-kb 6s linear infinite alternate}
@keyframes u101-kb{to{transform:scale(1.07) translate(-1.5%,1%)}}

/* U102 quick view */
.u102-row{display:flex;gap:20px}
.u102-card{position:relative;flex:1 1 0;min-width:0;display:flex;flex-direction:column;overflow:hidden;border-radius:22px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);transition:opacity .45s,filter .45s}
.u102-img{height:66%;width:100%;overflow:hidden;flex:none}
.u102-body{flex:1;display:flex;flex-direction:column;justify-content:center;padding:16px 18px;min-width:0}
.u102-x,.u102-extra{display:none}
.u102-card.open{flex:2.5 1 0;flex-direction:row;background:rgba(255,255,255,.08)}
.u102-card.open .u102-img{height:100%;width:46%}
.u102-card.open .u102-body{justify-content:center;padding:26px 30px}
.u102-card.open .u102-x{display:flex}
.u102-card.open .u102-extra{display:block}
.u102-row.has .u102-card:not(.open){opacity:.32;filter:saturate(.5)}
.u102-sz{transition:background-color .3s,color .3s,border-color .3s}
.u102-sz.on{background:#fff;color:#0a0d16;border-color:#fff}

html.is-static .b5g5-glow,html.is-static .u98-blob,html.is-static .u99-spin,html.is-static .u101-kb{animation:none}
html.is-static {
  .b5g5-glow,.u98-blob,.u99-spin,.u101-kb{animation:none}
  .u91-l,.u91-l::after,.u96-b,.u96-bub,.u97-g::after,.u97-btn,.u97-card,.u98-panel,.u98-panel>*,.u101-l,.u101-ar,.u102-card{transition:none}
}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop, again on top (screen blend) so covered stages never freeze. */
function Stage({ r, children, g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; g1?: string; g2?: string }) {
  return (
    <div ref={r} className="relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0d16] text-[#eef2ff]">
      <style href="b5g5-css" precedence="default">
        {CSS}
      </style>
      <div className="b5g5-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
      <div className="b5g5-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.4, zIndex: 35 } as CSSProperties} aria-hidden />
    </div>
  );
}

/** The visible fake pointer (a ring). */
const Dot = ({ r }: { r: RefObject<HTMLDivElement | null> }) => (
  <div ref={r} className="b5g5-dot" aria-hidden>
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
    at?: (b: Box, i: number) => [number, number];
    off?: (w: number, h: number) => [number, number];
    onChange?: (now: number, prev: number, el: HTMLDivElement, fake: boolean) => void;
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
    (p, el, fake) => {
      const tg = [...el.querySelectorAll(o.sel)];
      const idx = p.inside ? tg.findIndex((n) => inBox(rel(n, el), p.x, p.y)) : -1;
      if (idx === cur.current) return;
      const prev = cur.current;
      cur.current = idx;
      tg.forEach((n, i) => n.classList.toggle("on", i === idx));
      o.onChange?.(idx, prev, el, fake);
    },
  );
  return cur;
}

/** "play" helper: waits for fonts (+ `pre`), builds a looping animation in a gsap.context, plays it only while on screen. */
function usePlay(
  ref: RefObject<HTMLElement | null>,
  build: (root: HTMLElement, onClean: (fn: () => void) => void) => gsap.core.Animation | void,
  pre?: () => Promise<unknown>,
) {
  const b = useRef(build);
  b.current = build;
  const p = useRef(pre);
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
    Promise.all([document.fonts?.ready, p.current?.()]).then(() => {
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

const shuffled = (n: number) => {
  const a = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/* ───────────────────────── U91 · Scramble on hover ───────────────────────── */
const U91_NAV = ["SHOP", "ATELIER", "JOURNAL", "STORES"];
const U91_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*";
function scramble(n: Element, d = 0) {
  const t = (n as HTMLElement).dataset.t ?? n.textContent ?? "";
  gsap.to(n, { duration: 0.55, delay: d, overwrite: true, ease: "none", scrambleText: { text: t, chars: U91_CHARS, speed: 1.2, revealDelay: 0.12 } });
}
function U91() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useWalk(root, dot, {
    sel: ".u91-s",
    order: [0, 1, 2, 3, 4, -1],
    off: (w, h) => [w * 0.5, h * 0.78],
    onChange: (i, _p, el) => {
      if (i < 0 || prefersReducedMotion()) return;
      const n = el.querySelectorAll(".u91-s")[i];
      scramble(n.querySelector("[data-t]") ?? n);
    },
  });
  // plays once by itself on entering the screen: every label scrambles in a stagger
  usePlay(root, (el) => {
    const tl = gsap.timeline({ paused: true });
    el.querySelectorAll("[data-t]").forEach((n, i) => tl.call(() => scramble(n), [], i * 0.08));
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(159,230,255,.5)" g2="rgba(140,110,255,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[9vh] px-[6%]">
        <nav className="flex w-full max-w-[1180px] items-center justify-between rounded-full border border-white/12 bg-white/[0.04] py-4 pl-10 pr-4 backdrop-blur" style={{ fontFamily: F.sg }}>
          <span className="text-[22px] font-[700] tracking-[-0.02em]">Halden&nbsp;&amp;&nbsp;Co</span>
          <div className="flex items-center gap-[3.4vw]">
            {U91_NAV.map((l) => (
              <a key={l} href="#" onClick={(e) => e.preventDefault()} className="u91-s u91-l text-[clamp(17px,1.5vw,22px)] font-[600] tracking-[0.14em]" data-t={l}>
                {l}
              </a>
            ))}
          </div>
          <a href="#" onClick={(e) => e.preventDefault()} className="u91-s u91-cta rounded-full bg-white/10 px-7 py-4 text-[clamp(15px,1.2vw,18px)] font-[700] tracking-[0.16em]">
            <span data-t="BOOK A FITTING">BOOK A FITTING</span>
          </a>
        </nav>
        <div className="text-center">
          <Eyebrow>Autumn tailoring · Mumbai &amp; Pune</Eyebrow>
          <h3 className="mt-5 text-[clamp(48px,5.6vw,92px)] leading-[0.98] tracking-[-0.03em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
            Cut close. Worn long.
          </h3>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U92 · Filter shuffle ───────────────────────── */
const U92_F = ["All", "Lamps", "Chairs", "Tables"];
const U92_ITEMS = [
  { n: "Orla Pendant", c: "Lamps", p: "₹8,400" },
  { n: "Bram Lounge", c: "Chairs", p: "₹46,000" },
  { n: "Tessa Side", c: "Tables", p: "₹14,900" },
  { n: "Ivo Floor", c: "Lamps", p: "₹12,600" },
  { n: "Hollis Stool", c: "Chairs", p: "₹9,800" },
  { n: "Mara Dining", c: "Tables", p: "₹72,000" },
  { n: "Pell Desk Lamp", c: "Lamps", p: "₹5,900" },
  { n: "Saul Armchair", c: "Chairs", p: "₹38,500" },
];
type FlipT = typeof import("gsap/Flip").Flip;
function U92() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const flip = useRef<FlipT | null>(null);
  const cur = useRef(0);
  const idle = useIdle(root);
  const apply = (fi: number) => {
    const el = root.current;
    if (!el || fi === cur.current) return;
    cur.current = fi;
    const cat = U92_F[fi];
    const items = [...el.querySelectorAll<HTMLElement>(".u92-it")];
    el.querySelectorAll(".u92-f").forEach((b, k) => b.classList.toggle("on", k === fi));
    const Fl = flip.current;
    const state = Fl?.getState(items);
    items.forEach((it) => (it.style.display = cat === "All" || it.dataset.c === cat ? "" : "none"));
    if (Fl && state && !prefersReducedMotion())
      Fl.from(state, {
        duration: 0.7,
        ease: "power2.inOut",
        scale: true,
        absolute: true,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.6, delay: 0.1, ease: "back.out(1.4)" }),
        onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0, duration: 0.45, ease: "power2.in" }),
      });
  };
  usePlay(
    root,
    (el) => {
      const ORDER = [1, 2, 3, 0];
      let k = 0;
      const tl = gsap.timeline({ repeat: -1, paused: true });
      tl.call(() => goDot(dot.current, el, el.querySelectorAll(".u92-f")[ORDER[k % 4]], 0.45, idle()), [], 0)
        .call(
          () => {
            if (idle()) {
              tapDot(dot.current);
              apply(ORDER[k % 4]);
            }
            k++;
          },
          [],
          0.5,
        )
        .call(() => goDot(dot.current, el, [el.clientWidth * 0.5 + Math.sin(k) * 120, el.clientHeight * 0.55], 0.5, idle()), [], 1.05)
        .to({}, { duration: 0.1 }, 1.6);
      return tl;
    },
    () => loadPlugin("Flip").then((f) => (flip.current = f)),
  );
  return (
    <Stage r={root} g1="rgba(255,207,122,.5)" g2="rgba(79,141,255,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[4vh] px-[5%]" style={{ fontFamily: F.sg }}>
        <div className="flex items-center gap-3">
          {U92_F.map((f, i) => (
            <button key={f} type="button" onClick={() => apply(i)} className={`u92-f rounded-full border border-white/20 px-7 py-3 text-[17px] font-[600] ${i === 0 ? "on" : ""}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex h-[min(62%,500px)] w-[min(92%,1040px)] flex-wrap content-start justify-center gap-4">
          {U92_ITEMS.map((it, i) => (
            <div key={it.n} data-c={it.c} className="u92-it flex h-[calc(50%-8px)] w-[calc(25%-12px)] flex-col overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.05]">
              <div className="min-h-0 flex-1 overflow-hidden">
                <Img i={i + 3} w={420} h={320} />
              </div>
              <div className="flex items-baseline justify-between gap-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[16px] font-[600]">{it.n}</p>
                  <p className="text-[12px] uppercase tracking-[0.16em] text-white/50">{it.c}</p>
                </div>
                <p className="text-[15px] text-white/80">{it.p}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U93 · Raining letters swap ───────────────────────── */
const U93_LINKS = [
  { t: "Collections", n: "01" },
  { t: "Atelier", n: "02" },
  { t: "Journal", n: "03" },
];
function U93() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const rows = useRef<{ a: HTMLElement[]; b: HTMLElement[] }[]>([]);
  const rain = (i: number) => {
    const r = rows.current[i];
    if (!r) return;
    gsap.killTweensOf([...r.a, ...r.b]);
    gsap.set(r.a, { yPercent: 0 });
    gsap.set(r.b, { yPercent: -110 });
    const ord = shuffled(r.a.length);
    const d = (k: number) => ord[k] * 0.035;
    gsap.to(r.a, { yPercent: 110, duration: 0.4, ease: "power2.in", delay: (k) => d(k) });
    gsap.to(r.b, {
      yPercent: 0,
      duration: 0.75,
      ease: "back.out(2.4)",
      delay: (k) => d(k) + 0.08,
      onComplete: () => {
        // swap back invisibly: original letter in place, clone parked above again
        gsap.set(r.a, { yPercent: 0 });
        gsap.set(r.b, { yPercent: -110 });
      },
    });
  };
  useWalk(root, dot, {
    sel: ".u93-row",
    order: [0, 1, 2, -1],
    at: (b) => [b.l + b.w * 0.35, b.t + b.h * 0.5],
    off: (w, h) => [w * 0.78, h * 0.82],
    onChange: (i) => {
      if (i >= 0) rain(i);
    },
  });
  usePlay(root, (el, onClean) => {
    const splits: SplitText[] = [];
    rows.current = [...el.querySelectorAll<HTMLElement>(".u93-w")].map((w) => {
      const s = SplitText.create(w, { type: "chars", charsClass: "u93-c" });
      splits.push(s);
      const a: HTMLElement[] = [];
      const b: HTMLElement[] = [];
      (s.chars as HTMLElement[]).forEach((c) => {
        const t = c.textContent ?? "";
        c.textContent = "";
        const x = document.createElement("span");
        x.className = "u93-a";
        x.textContent = t;
        const y = document.createElement("span");
        y.className = "u93-b";
        y.textContent = t;
        y.setAttribute("aria-hidden", "true");
        c.append(x, y);
        a.push(x);
        b.push(y);
      });
      gsap.set(b, { yPercent: -110 });
      return { a, b };
    });
    onClean(() => splits.forEach((s) => s.revert()));
    const tl = gsap.timeline({ paused: true });
    tl.call(() => rain(0), [], 0.1);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,159,122,.5)" g2="rgba(140,110,255,.24)">
      <div className="absolute inset-0 flex flex-col justify-center px-[9%]">
        <Eyebrow className="mb-6">Maison Veyra · menu</Eyebrow>
        {U93_LINKS.map((l) => (
          <a key={l.t} href="#" onClick={(e) => e.preventDefault()} className="u93-row flex items-baseline gap-6 border-b border-white/10 py-2" data-cursor="Open">
            <span className="w-10 text-[14px] text-white/45" style={{ fontFamily: F.sg }}>
              {l.n}
            </span>
            <span className="u93-w text-[clamp(52px,6vw,100px)] font-[700] uppercase leading-[1.05] tracking-[-0.02em]" style={{ fontFamily: F.sy }}>
              {l.t}
            </span>
          </a>
        ))}
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U94 · Char glow light-up ───────────────────────── */
const U94_LINES = ["Slow mornings.", "Linen that breathes.", "Woven in Jaipur."];
function U94() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const chars = useRef<HTMLElement[][]>([]);
  const light = (i: number, on: boolean) => {
    const c = chars.current[i];
    if (!c) return;
    gsap.to(c, {
      opacity: on ? 1 : 0.25,
      textShadow: on ? "0 0 18px rgba(255,255,255,.75)" : "0 0 0px rgba(255,255,255,0)",
      duration: on ? 0.35 : 0.45,
      ease: "power2.out",
      stagger: on ? 0.028 : 0.018,
      overwrite: true,
    });
  };
  const cur = useWalk(root, dot, {
    sel: ".u94-ln",
    order: [0, 1, 2, -1],
    at: (b) => [b.l + b.w * 0.3, b.t + b.h * 0.5],
    off: (w, h) => [w * 0.8, h * 0.86],
    onChange: (i, prev) => {
      if (prev >= 0) light(prev, false);
      if (i >= 0) light(i, true);
    },
  });
  usePlay(root, (el, onClean) => {
    const splits = [...el.querySelectorAll<HTMLElement>(".u94-ln")].map((ln) => SplitText.create(ln, { type: "words,chars" }));
    chars.current = splits.map((s) => s.chars as HTMLElement[]);
    el.querySelector(".u94")?.classList.add("js");
    chars.current.forEach((c, i) => gsap.set(c, { opacity: i === cur.current ? 1 : 0.25, textShadow: i === cur.current ? "0 0 18px rgba(255,255,255,.75)" : "0 0 0px rgba(255,255,255,0)" }));
    onClean(() => {
      splits.forEach((s) => s.revert());
      el.querySelector(".u94")?.classList.remove("js");
    });
  });
  return (
    <Stage r={root} g1="rgba(190,200,255,.5)" g2="rgba(255,190,120,.2)">
      <div className="u94 absolute inset-0 flex flex-col justify-center px-[9%]">
        <Eyebrow className="mb-6">Tanaa Linen · the house edit</Eyebrow>
        {U94_LINES.map((l, i) => (
          <p key={l} className={`u94-ln text-[clamp(52px,6vw,98px)] leading-[1.08] tracking-[-0.02em] ${i === 0 ? "on" : ""}`} style={{ fontFamily: F.fr, fontWeight: 400 }}>
            {l}
          </p>
        ))}
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U95 · Blur accordion ───────────────────────── */
const U95_ROWS = [
  { q: "Fabric & care", a: "Long-staple organic cotton, garment-washed for softness. Machine wash cold, line dry in shade." },
  { q: "Fit & sizing", a: "Relaxed through the shoulder, tapered at the hem. Take your usual size; size down for a closer fit." },
  { q: "Delivery", a: "Free across India over ₹2,500. Metro cities in 2–3 days, everywhere else within a week." },
  { q: "Returns", a: "Thirty days, no questions. We collect from your door and refund to the original payment." },
];
function U95() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const open = useRef(0);
  const idle = useIdle(root);
  const toggle = (i: number) => {
    const el = root.current;
    if (!el) return;
    const rows = [...el.querySelectorAll<HTMLElement>(".u95-row")];
    const close = (k: number) => {
      const r = rows[k];
      gsap.to(r.querySelector(".u95-in"), { filter: "blur(5px)", opacity: 0, duration: 0.3, ease: "power1.in", overwrite: true });
      gsap.to(r.querySelector(".u95-body"), { height: 0, duration: 0.5, ease: "power3.inOut", overwrite: true });
      gsap.to(r.querySelector(".u95-ic"), { rotate: 0, duration: 0.4, ease: "power3.inOut", overwrite: true });
      r.classList.remove("on");
    };
    const prev = open.current;
    if (prev >= 0) close(prev);
    if (prev === i) {
      open.current = -1;
      return;
    }
    const r = rows[i];
    open.current = i;
    r.classList.add("on");
    gsap.fromTo(r.querySelector(".u95-body"), { height: 0 }, { height: "auto", duration: 0.9, ease: "elastic.out(1,0.7)", overwrite: true });
    gsap.fromTo(r.querySelector(".u95-in"), { filter: "blur(5px)", opacity: 0 }, { filter: "blur(0px)", opacity: 1, duration: 0.55, delay: 0.12, ease: "power2.out", overwrite: true });
    gsap.to(r.querySelector(".u95-ic"), { rotate: 45, duration: 0.6, ease: "back.out(2)", overwrite: true });
  };
  usePlay(root, (el) => {
    const ORDER = [1, 2, 3, 0];
    let k = 0;
    const tl = gsap.timeline({ repeat: -1, paused: true });
    tl.call(() => goDot(dot.current, el, el.querySelectorAll(".u95-h")[ORDER[k % 4]], 0.45, idle()), [], 0)
      .call(
        () => {
          if (idle()) {
            tapDot(dot.current);
            toggle(ORDER[k % 4]);
          }
          k++;
        },
        [],
        0.5,
      )
      .call(() => goDot(dot.current, el, [el.clientWidth * 0.8, el.clientHeight * (0.3 + (k % 3) * 0.2)], 0.5, idle()), [], 1.1)
      .to({}, { duration: 0.1 }, 1.6);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(122,227,196,.5)" g2="rgba(255,150,200,.2)">
      <div className="absolute inset-0 flex flex-col justify-center px-[14%]" style={{ fontFamily: F.sg }}>
        <Eyebrow className="mb-5">Field Shirt · ₹3,890 · details</Eyebrow>
        <div className="border-t border-white/12">
          {U95_ROWS.map((r, i) => (
            <div key={r.q} className={`u95-row border-b border-white/12 ${i === 0 ? "on" : ""}`}>
              <button type="button" onClick={() => toggle(i)} className="u95-h flex w-full items-center justify-between py-[2.4vh] text-left">
                <span className="text-[clamp(26px,2.5vw,38px)] font-[500] tracking-[-0.02em]">{r.q}</span>
                <span className="u95-ic grid h-11 w-11 place-items-center rounded-full border border-white/25 text-[24px] leading-none" style={i === 0 ? { transform: "rotate(45deg)" } : undefined}>
                  +
                </span>
              </button>
              <div className="u95-body overflow-hidden" style={{ height: i === 0 ? "auto" : 0 }}>
                <p className="u95-in max-w-[780px] pb-[2.6vh] text-[clamp(17px,1.35vw,21px)] leading-[1.5] text-white/70" style={{ fontFamily: F.mr }}>
                  {r.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U96 · Bubble fill from point ───────────────────────── */
const U96_BTNS = [
  { t: "Shop the drop", d: "from centre", at: { left: "50%", top: "50%" } },
  { t: "Reserve a table", d: "from corner", at: { left: "0%", top: "100%" } },
  { t: "Get the lookbook", d: "from the icon", at: { left: "44px", top: "50%" }, icon: true },
];
function U96() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useWalk(root, dot, {
    sel: ".u96-b",
    order: [0, -1, 1, -1, 2, -1],
    seg: 0.9,
    at: (b, i) => (i === 1 ? [b.l + b.w * 0.25, b.t + b.h * 0.65] : i === 2 ? [b.l + 50, b.t + b.h / 2] : mid(b)),
    off: (w, h) => [w * 0.5, h * 0.8],
  });
  return (
    <Stage r={root} g1="rgba(255,211,107,.5)" g2="rgba(255,122,89,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[7vh]" style={{ fontFamily: F.sg }}>
        <h3 className="text-[clamp(44px,4.6vw,76px)] leading-none tracking-[-0.03em]" style={{ fontFamily: F.is }}>
          Saffron Supper Club
        </h3>
        <div className="flex items-start gap-[3vw]">
          {U96_BTNS.map((b, i) => (
            <div key={b.t} className="flex flex-col items-center gap-4">
              <a href="#" onClick={(e) => e.preventDefault()} className={`u96-b flex h-[78px] w-[clamp(280px,22vw,340px)] items-center justify-center gap-4 rounded-full border border-white/30 text-[20px] font-[600] ${i === 0 ? "on" : ""}`}>
                <span className="u96-bub" style={b.at} aria-hidden />
                {b.icon && (
                  <span className="u96-ic absolute left-[22px] top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/12 text-[18px]" aria-hidden>
                    ↓
                  </span>
                )}
                <span className={b.icon ? "pl-10" : ""}>{b.t}</span>
              </a>
              <span className="text-[13px] uppercase tracking-[0.2em] text-white/45">{b.d}</span>
            </div>
          ))}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U97 · Glint swipe ───────────────────────── */
function U97() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useWalk(root, dot, {
    sel: ".u97-t",
    order: [0, -1, 1, -1],
    seg: 0.95,
    off: (w, h) => [w * 0.5, h * 0.86],
    onChange: (i, _p, _el, fake) => {
      if (i === 0 && fake) tapDot(dot.current);
    },
  });
  return (
    <Stage r={root} g1="rgba(255,140,90,.5)" g2="rgba(255,214,140,.22)">
      <div className="absolute inset-0 flex items-center justify-center gap-[7vw]" style={{ fontFamily: F.sg }}>
        <div className="flex flex-col items-start gap-7">
          <Eyebrow>Aurum Circle · founding members</Eyebrow>
          <h3 className="max-w-[12ch] text-[clamp(44px,4.4vw,72px)] leading-[1] tracking-[-0.03em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
            Two hundred seats. Yours?
          </h3>
          <button type="button" className="u97-t u97-g u97-btn rounded-full bg-gradient-to-r from-[#ff8a5c] to-[#ffb36b] px-11 py-5 text-[20px] font-[700] text-[#170a03]">
            Claim early access
          </button>
        </div>
        <div className="u97-t u97-g u97-card relative h-[clamp(240px,34vh,300px)] w-[clamp(380px,30vw,470px)] rounded-[22px] border border-white/15 p-8" style={{ background: "linear-gradient(135deg,#2a1d12 0%,#4a2f17 45%,#16100b 100%)" }}>
          <div className="flex h-full flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="text-[15px] uppercase tracking-[0.28em] text-[#ffd8a8]">Aurum Circle</span>
              <span className="h-10 w-14 rounded-md bg-gradient-to-br from-[#ffe2b0] to-[#b07a3a]" aria-hidden />
            </div>
            <div>
              <p className="text-[28px] tracking-[0.18em] text-white/90">0482 · 7716 · 2026</p>
              <div className="mt-3 flex justify-between text-[14px] text-white/60">
                <span>Member · Ira Vashist</span>
                <span>₹12,000 / yr</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U98 · Magnetic button to glass reveal ───────────────────────── */
function U98() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const q = useRef<{ x: (v: number) => void; y: (v: number) => void } | null>(null);
  const isOn = useRef(true);
  useEffect(() => {
    const el = root.current?.querySelector<HTMLElement>(".u98-mag");
    if (!el || prefersReducedMotion()) return;
    root.current?.querySelector(".u98-wrap")?.classList.remove("on");
    isOn.current = false;
    q.current = { x: gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" }), y: gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" }) };
    return () => {
      gsap.killTweensOf(el);
    };
  }, []);
  usePointer(
    root,
    dot,
    (t, el) => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const a = el.querySelector(".u98-anchor");
      const [bx, by] = a ? mid(rel(a, el)) : [w / 2, h * 0.7];
      const pts: [number, number][] = [
        [w * 0.16, h * 0.3],
        [bx - 190, by + 40],
        [bx, by],
        [bx + 30, by - 150],
        [w * 0.84, h * 0.82],
      ];
      const [x, y] = stepPath(t, pts, 0.95, 0.5);
      return { x: x + Math.sin(t * 2.3) * 7, y: y + Math.cos(t * 1.8) * 6, inside: true };
    },
    (p, el, fake) => {
      const a = el.querySelector(".u98-anchor");
      const wrap = el.querySelector(".u98-wrap");
      const panel = el.querySelector(".u98-panel");
      if (!a || !wrap || !panel) return;
      const b = rel(a, el);
      const [cx, cy] = mid(b);
      const dx = p.x - cx;
      const dy = p.y - cy;
      const d = Math.hypot(dx, dy);
      const R = 230;
      const near = p.inside && d < R;
      q.current?.x(near ? dx * 0.32 : 0);
      q.current?.y(near ? dy * 0.32 : 0);
      // the fake cursor itself is pulled toward the button too
      if (fake && near && dot.current) {
        const k = 0.28 * (1 - d / R);
        dot.current.style.transform = `translate3d(${(p.x - dx * k).toFixed(1)}px,${(p.y - dy * k).toFixed(1)}px,0)`;
      }
      const over = p.inside && (inBox(b, p.x, p.y, 26) || (isOn.current && inBox(rel(panel, el), p.x, p.y, 10)));
      if (over !== isOn.current) {
        isOn.current = over;
        wrap.classList.toggle("on", over);
      }
    },
  );
  return (
    <Stage r={root} g1="rgba(150,120,255,.5)" g2="rgba(79,220,255,.24)">
      <div className="absolute inset-0" aria-hidden>
        <div className="u98-blob absolute left-[30%] top-[14%] h-[34vh] w-[34vh] rounded-full bg-[#ff7a59]/80 blur-[6px]" />
        <div className="u98-blob absolute right-[28%] top-[24%] h-[26vh] w-[26vh] rounded-full bg-[#4fdcff]/70 blur-[4px]" style={{ animationDelay: "-2s" }} />
        <div className="absolute left-1/2 top-[20%] h-[30vh] w-[22vh] -translate-x-1/2 overflow-hidden rounded-[18px] opacity-80">
          <Img i={7} w={360} h={480} />
        </div>
      </div>
      <div className="absolute inset-x-0 top-[8%] text-center">
        <Eyebrow>Atelier Sola · autumn ceramics</Eyebrow>
      </div>
      <div className="u98-anchor absolute left-1/2 top-[76%] h-[70px] w-[290px] -translate-x-1/2 -translate-y-1/2" aria-hidden />
      <div className="absolute left-1/2 top-[76%] -translate-x-1/2 -translate-y-1/2">
        <div className="u98-mag">
          <div className="u98-wrap on relative" style={{ fontFamily: F.sg }}>
            <div className="u98-panel absolute bottom-[calc(100%+18px)] left-1/2 ml-[-220px] w-[440px] rounded-[26px] border border-white/25 bg-white/[0.1] p-7 shadow-[0_30px_80px_rgba(0,0,0,.45)] backdrop-blur-xl">
              <p className="text-[12px] uppercase tracking-[0.24em] text-white/65">Private viewing · Sat 11 Oct</p>
              <p className="mt-3 text-[34px] leading-[1.05] tracking-[-0.02em]" style={{ fontFamily: F.fr }}>
                Hand-thrown stoneware
              </p>
              <div className="mt-5 flex items-center justify-between text-[15px] text-white/80">
                <span>14 pieces · 4 seats left</span>
                <span className="text-white">From ₹1,450</span>
              </div>
            </div>
            <button type="button" className="u98-btn h-[70px] w-[290px] rounded-full border border-white/30 bg-white/10 text-[19px] font-[600] backdrop-blur">
              View the collection
            </button>
          </div>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U99 · Add-to-cart microinteraction ───────────────────────── */
function U99() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const idle = useIdle(root);
  usePlay(root, (el) => {
    const btn = el.querySelector<HTMLElement>(".u99-btn")!;
    const lab = el.querySelector(".u99-lab");
    const spin = el.querySelector(".u99-sp");
    const tick = el.querySelector(".u99-tick");
    const tickP = el.querySelector(".u99-tick path");
    const cnt = el.querySelector<HTMLElement>(".u99-n");
    const badge = el.querySelector(".u99-badge");
    let n = 2;
    gsap.set(tickP, { drawSVG: "0%" });
    const tl = gsap.timeline({ repeat: -1, paused: true });
    tl.call(() => goDot(dot.current, el, btn, 0.5, idle()), [], 0)
      .addLabel("press", 0.55)
      .call(() => {
        if (idle()) tapDot(dot.current);
      }, [], "press")
      .to(lab, { yPercent: -130, opacity: 0, duration: 0.25, ease: "power2.in" }, "press")
      .to(btn, { width: 70, duration: 0.4, ease: "power3.inOut" }, "press+=0.15")
      .to(spin, { opacity: 1, duration: 0.15 }, "press+=0.45")
      .to(spin, { opacity: 0, duration: 0.15 }, "press+=1.15")
      .to(btn, { backgroundColor: "#7ae3a0", duration: 0.25 }, "press+=1.15")
      .set(tick, { opacity: 1 }, "press+=1.2")
      .to(tickP, { drawSVG: "100%", duration: 0.35, ease: "power2.out" }, "press+=1.2")
      .call(
        () => {
          n++;
          if (cnt) cnt.textContent = String(n);
        },
        [],
        "press+=1.4",
      )
      .to(badge, { scale: 1.3, duration: 0.18, ease: "power2.out" }, "press+=1.4")
      .to(badge, { scale: 1, duration: 0.35, ease: "back.out(3)" }, "press+=1.58")
      .call(() => goDot(dot.current, el, [el.clientWidth * 0.78, el.clientHeight * 0.18], 0.5, idle()), [], "press+=1.45")
      .to(tick, { opacity: 0, duration: 0.2 }, "press+=1.95")
      .set(tickP, { drawSVG: "0%" }, "press+=2.15")
      .to(btn, { width: 280, backgroundColor: "#f4efe6", duration: 0.45, ease: "power3.inOut" }, "press+=1.95")
      .fromTo(lab, { yPercent: 130, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.35, ease: "power3.out", immediateRender: false }, "press+=2.3")
      .to({}, { duration: 0.15 }, "press+=2.65");
    tlRef.current = tl;
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(122,227,160,.5)" g2="rgba(255,179,107,.22)">
      <div className="absolute right-[6%] top-[9%] flex items-center gap-3 text-[16px] font-[600]" style={{ fontFamily: F.sg }}>
        <span className="text-white/70">Bag</span>
        <span className="u99-badge grid h-9 min-w-9 place-items-center rounded-full bg-[#7ae3a0] px-2 text-[15px] font-[700] text-[#06150c]">
          <span className="u99-n">2</span>
        </span>
      </div>
      <div className="absolute inset-0 flex items-center justify-center gap-[6vw]" style={{ fontFamily: F.sg }}>
        <div className="h-[clamp(300px,52vh,460px)] w-[clamp(240px,20vw,340px)] overflow-hidden rounded-[24px]">
          <Img i={11} w={460} h={620} />
        </div>
        <div className="flex w-[clamp(320px,30vw,440px)] flex-col items-start gap-5">
          <Eyebrow>Kora Studio · knitwear</Eyebrow>
          <h3 className="text-[clamp(44px,4.4vw,72px)] leading-[1] tracking-[-0.03em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
            Ribbed Merino Crew
          </h3>
          <p className="text-[22px] text-white/80">₹5,450</p>
          <div className="flex h-[70px] w-[280px] items-center">
            <button
              type="button"
              onClick={() => tlRef.current?.play("press")}
              className="u99-btn relative h-[70px] w-[280px] overflow-hidden rounded-full bg-[#f4efe6] text-[19px] font-[700] text-[#0a0d16]"
            >
              <span className="u99-lab absolute inset-0 grid place-items-center">Add to bag</span>
              <span className="u99-sp absolute inset-0 grid place-items-center opacity-0" aria-hidden>
                <svg className="u99-spin h-8 w-8" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="12" fill="none" stroke="#0a0d16" strokeOpacity=".2" strokeWidth="3" />
                  <circle cx="16" cy="16" r="12" fill="none" stroke="#0a0d16" strokeWidth="3" strokeLinecap="round" strokeDasharray="22 100" />
                </svg>
              </span>
              <span className="u99-tick absolute inset-0 grid place-items-center opacity-0" aria-hidden>
                <svg className="h-8 w-8" viewBox="0 0 32 32">
                  <path d="M8 16.5 L14 22 L24 10" fill="none" stroke="#06150c" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U100 · Magnetic hover with lag ring ───────────────────────── */
const U100_BTNS = [
  { i: "→", l: "Explore" },
  { i: "♥", l: "Saved" },
  { i: "◎", l: "Stores" },
];
function U100() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const qs = useRef<{ bx: (v: number) => void; by: (v: number) => void; rx: (v: number) => void; ry: (v: number) => void }[]>([]);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const ws = [...el.querySelectorAll<HTMLElement>(".u100-w")];
    qs.current = ws.map((w) => {
      const b = w.querySelector<HTMLElement>(".u100-b")!;
      const r = w.querySelector<HTMLElement>(".u100-r")!;
      return {
        bx: gsap.quickTo(b, "x", { duration: 0.35, ease: "power3.out" }),
        by: gsap.quickTo(b, "y", { duration: 0.35, ease: "power3.out" }),
        rx: gsap.quickTo(r, "x", { duration: 1.1, ease: "power3.out" }),
        ry: gsap.quickTo(r, "y", { duration: 1.1, ease: "power3.out" }),
      };
    });
    return () => gsap.killTweensOf(el.querySelectorAll(".u100-b,.u100-r"));
  }, []);
  usePointer(
    root,
    dot,
    (t, el) => {
      const ws = el.querySelectorAll(".u100-w");
      const pts: [number, number][] = [...ws].map((w) => mid(rel(w, el)));
      pts.push([el.clientWidth * 0.5, el.clientHeight * 0.86]);
      const [x, y] = stepPath(t, pts, 0.95, 0.45);
      // small orbits around each button so the pull and the lagging ring keep reading
      return { x: x + Math.sin(t * 4.2) * 46, y: y + Math.cos(t * 3.4) * 34, inside: true };
    },
    (p, el) => {
      el.querySelectorAll(".u100-w").forEach((w, i) => {
        const q = qs.current[i];
        if (!q) return;
        const [cx, cy] = mid(rel(w, el));
        const dx = p.x - cx;
        const dy = p.y - cy;
        const near = p.inside && Math.hypot(dx, dy) < 170;
        const tx = near ? dx * 0.42 : 0;
        const ty = near ? dy * 0.42 : 0;
        q.bx(tx);
        q.by(ty);
        q.rx(tx);
        q.ry(ty);
        w.classList.toggle("on", near);
      });
    },
  );
  return (
    <Stage r={root} g1="rgba(200,255,138,.5)" g2="rgba(79,141,255,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[7vh]" style={{ fontFamily: F.sg }}>
        <h3 className="text-[clamp(44px,4.6vw,76px)] leading-none tracking-[-0.03em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
          Wander the floor.
        </h3>
        <div className="flex items-start gap-[8vw]">
          {U100_BTNS.map((b) => (
            <div key={b.l} className="flex flex-col items-center gap-6">
              <div className="u100-w relative grid h-[150px] w-[150px] place-items-center">
                <span className="u100-r absolute inset-0 rounded-full border border-white/45" aria-hidden />
                <button type="button" className="u100-b grid h-[112px] w-[112px] place-items-center rounded-full bg-[#c8ff8a] text-[34px] text-[#0b1404] shadow-[0_16px_40px_rgba(200,255,138,.25)]" aria-label={b.l}>
                  {b.i}
                </button>
              </div>
              <span className="text-[15px] uppercase tracking-[0.22em] text-white/60">{b.l}</span>
            </div>
          ))}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U101 · Image rollover overlay menu ───────────────────────── */
const U101_LINKS = [
  { t: "Stays", s: "Twelve river rooms · from ₹18,400" },
  { t: "Dining", s: "Seven courses by lamplight" },
  { t: "Spa", s: "Ninety-minute stone ritual" },
  { t: "Journeys", s: "Dawn boats on the backwaters" },
  { t: "Journal", s: "Notes from the house" },
];
function U101() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const shown = useRef(0);
  useWalk(root, dot, {
    sel: ".u101-l",
    order: [0, 1, 2, 3, 4, -1],
    seg: 0.9,
    at: (b) => [b.l + Math.min(b.w * 0.4, 220), b.t + b.h * 0.5],
    off: (w, h) => [w * 0.72, h * 0.5],
    onChange: (i, _p, el) => {
      el.querySelector(".u101-list")?.classList.toggle("has", i >= 0);
      if (i < 0 || i === shown.current) return;
      const layers = el.querySelectorAll<HTMLElement>(".u101-img");
      const caps = el.querySelectorAll<HTMLElement>(".u101-cap");
      const L = layers[i];
      const was = shown.current;
      shown.current = i;
      caps.forEach((c, k) => (c.style.visibility = k === i ? "visible" : "hidden"));
      if (prefersReducedMotion()) {
        layers.forEach((n, k) => (n.style.visibility = k === i ? "visible" : "hidden"));
        return;
      }
      // the outgoing photo stays underneath, everything else drops below it, the new one wipes in on top
      layers.forEach((n, k) => {
        n.style.zIndex = k === was ? "2" : "1";
        if (k !== was && k !== i) n.style.visibility = "hidden";
      });
      L.style.zIndex = "3";
      L.style.visibility = "visible";
      gsap.fromTo(L, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.6, ease: "power3.inOut", overwrite: true });
      gsap.fromTo(L.querySelector("img"), { scale: 1.2 }, { scale: 1, duration: 1, ease: "power3.out", overwrite: true });
      gsap.fromTo(caps[i], { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out", overwrite: true });
    },
  });
  return (
    <Stage r={root} g1="rgba(255,190,140,.5)" g2="rgba(122,200,255,.22)">
      <div className="absolute inset-0 bg-[#0a0d16]" aria-hidden>
        {U101_LINKS.map((l, i) => (
          <div key={l.t} className="u101-img absolute inset-0 overflow-hidden" style={{ zIndex: i === 0 ? 2 : 1, visibility: i === 0 ? "visible" : "hidden" }}>
            <div className="u101-kb h-full w-full">
              <Img i={i + 20} w={1400} h={900} />
            </div>
          </div>
        ))}
        <div className="absolute inset-0 z-[100] bg-gradient-to-r from-[#0a0d16]/90 via-[#0a0d16]/55 to-[#0a0d16]/10" />
      </div>
      <div className="absolute inset-x-[5%] top-[7%] z-[110] flex items-center justify-between text-[15px] uppercase tracking-[0.22em]" style={{ fontFamily: F.sg }}>
        <span className="font-[700] normal-case tracking-[-0.01em] text-[22px]">Kalari House</span>
        <span className="text-white/75">Close ✕</span>
      </div>
      <nav className="u101-list absolute left-[7%] top-1/2 z-[110] flex -translate-y-1/2 flex-col">
        {U101_LINKS.map((l, i) => (
          <a key={l.t} href="#" onClick={(e) => e.preventDefault()} className={`u101-l flex items-center gap-5 py-[0.6vh] text-[clamp(44px,4.6vw,76px)] leading-[1.02] tracking-[-0.02em] ${i === 0 ? "on" : ""}`} style={{ fontFamily: F.fr, fontWeight: 400 }}>
            {l.t}
            <span className="u101-ar text-[0.5em]">↗</span>
          </a>
        ))}
      </nav>
      <div className="absolute bottom-[8%] right-[5%] z-[110] h-[24px] w-[380px] text-right text-[16px] text-white/85" style={{ fontFamily: F.mr }}>
        {U101_LINKS.map((l, i) => (
          <p key={l.t} className="u101-cap absolute inset-0" style={{ visibility: i === 0 ? "visible" : "hidden" }}>
            {l.s}
          </p>
        ))}
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U102 · Quick view add-to-cart ───────────────────────── */
const U102_ITEMS = [
  { n: "Merino Overshirt", p: "₹6,450", c: "Charcoal" },
  { n: "Linen Camp Shirt", p: "₹3,890", c: "Sand" },
  { n: "Pleated Trouser", p: "₹4,750", c: "Olive" },
  { n: "Waxed Field Jacket", p: "₹11,900", c: "Ink" },
];
const U102_SZ = ["S", "M", "L", "XL"];
function U102() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const flip = useRef<FlipT | null>(null);
  const openI = useRef(-1);
  const bag = useRef(1);
  const idle = useIdle(root);
  const setOpen = (i: number) => {
    const el = root.current;
    if (!el) return;
    const next = openI.current === i ? -1 : i;
    const cards = [...el.querySelectorAll<HTMLElement>(".u102-card")];
    const Fl = flip.current;
    const state = Fl?.getState([...cards, ...el.querySelectorAll(".u102-img")]);
    cards.forEach((c, k) => c.classList.toggle("open", k === next));
    el.querySelector(".u102-row")?.classList.toggle("has", next >= 0);
    openI.current = next;
    if (Fl && state && !prefersReducedMotion()) {
      Fl.from(state, { duration: 0.75, ease: "power3.inOut", nested: true });
      if (next >= 0) {
        const ex = cards[next].querySelector(".u102-extra");
        gsap.fromTo(ex, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.5, delay: 0.4, ease: "power3.out" });
      }
    }
  };
  const pick = (card: number, s: number) => {
    const el = root.current;
    if (!el) return;
    el.querySelectorAll(".u102-card")[card]?.querySelectorAll(".u102-sz").forEach((b, k) => b.classList.toggle("on", k === s));
  };
  const add = (card: number) => {
    const el = root.current;
    if (!el) return;
    const b = el.querySelectorAll<HTMLElement>(".u102-add")[card];
    bag.current++;
    const n = el.querySelector<HTMLElement>(".u102-n");
    if (n) n.textContent = String(bag.current);
    if (b) {
      b.textContent = "Added ✓";
      gsap.delayedCall(0.9, () => (b.textContent = "Add to bag"));
      if (!prefersReducedMotion()) gsap.fromTo(b, { scale: 0.94 }, { scale: 1, duration: 0.45, ease: "back.out(3)" });
    }
    if (!prefersReducedMotion()) gsap.fromTo(el.querySelector(".u102-badge"), { scale: 1.35 }, { scale: 1, duration: 0.5, ease: "back.out(3)" });
  };
  usePlay(
    root,
    (el) => {
      let k = 0;
      const card = () => el.querySelectorAll(".u102-card")[k % 4];
      const act = (fn: () => void) => () => {
        if (!idle()) return;
        tapDot(dot.current);
        fn();
      };
      const tl = gsap.timeline({ repeat: -1, paused: true });
      tl.call(() => goDot(dot.current, el, card()?.querySelector(".u102-img") ?? null, 0.45, idle()), [], 0)
        .call(act(() => setOpen(k % 4)), [], 0.5)
        .call(() => goDot(dot.current, el, card()?.querySelectorAll(".u102-sz")[1 + (k % 2)] ?? null, 0.4, idle()), [], 1.3)
        .call(act(() => pick(k % 4, 1 + (k % 2))), [], 1.75)
        .call(() => goDot(dot.current, el, card()?.querySelector(".u102-add") ?? null, 0.4, idle()), [], 2.1)
        .call(act(() => add(k % 4)), [], 2.55)
        .call(() => goDot(dot.current, el, card()?.querySelector(".u102-x") ?? null, 0.4, idle()), [], 2.95)
        .call(
          act(() => {
            if (openI.current >= 0) setOpen(openI.current);
          }),
          [],
          3.4,
        )
        .call(() => k++, [], 3.45)
        .to({}, { duration: 0.1 }, 3.9);
      return tl;
    },
    () => loadPlugin("Flip").then((f) => (flip.current = f)),
  );
  return (
    <Stage r={root} g1="rgba(255,170,120,.5)" g2="rgba(122,200,255,.22)">
      <div className="absolute inset-x-[5%] top-[7%] flex items-center justify-between" style={{ fontFamily: F.sg }}>
        <span className="text-[22px] font-[700] tracking-[-0.01em]">Northfold</span>
        <span className="flex items-center gap-3 text-[16px] font-[600]">
          <span className="text-white/70">Bag</span>
          <span className="u102-badge grid h-9 min-w-9 place-items-center rounded-full bg-[#ffaa78] px-2 text-[15px] font-[700] text-[#160a03]">
            <span className="u102-n">1</span>
          </span>
        </span>
      </div>
      <div className="absolute inset-x-[5%] bottom-[8%] top-[19%]" style={{ fontFamily: F.sg }}>
        <div className="u102-row h-full">
          {U102_ITEMS.map((it, i) => (
            <div key={it.n} className="u102-card" onClick={() => openI.current !== i && setOpen(i)} data-cursor="Quick view">
              <div className="u102-img">
                <Img i={i + 30} w={520} h={640} />
              </div>
              <div className="u102-body">
                <p className="text-[clamp(17px,1.4vw,22px)] font-[600] leading-tight">{it.n}</p>
                <p className="mt-1 text-[15px] text-white/65">
                  {it.p} · {it.c}
                </p>
                <div className="u102-extra mt-6">
                  <p className="text-[12px] uppercase tracking-[0.22em] text-white/50">Size</p>
                  <div className="mt-3 flex gap-2">
                    {U102_SZ.map((s, k) => (
                      <button
                        key={s}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          pick(i, k);
                        }}
                        className={`u102-sz grid h-12 w-12 place-items-center rounded-full border border-white/25 text-[15px] font-[600] ${k === 1 ? "on" : ""}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      add(i);
                    }}
                    className="u102-add mt-6 h-14 w-full max-w-[260px] rounded-full bg-[#ffaa78] text-[17px] font-[700] text-[#160a03]"
                  >
                    Add to bag
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(i);
                }}
                className="u102-x absolute right-4 top-4 h-11 w-11 items-center justify-center rounded-full bg-black/40 text-[18px] backdrop-blur"
                aria-label="Close quick view"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  {
    code: "U91",
    name: "Scramble on hover",
    how: "Nav labels scramble into random uppercase glyphs and resolve back (~0.55 s) on hover; all scramble once on entry, then a fake pointer hovers each.",
    kind: "play",
    C: U91,
  },
  {
    code: "U92",
    name: "Filter shuffle",
    how: "Clicking a category filter: non-matching cards scale/fade out, matches glide to close the gaps, new matches scale in (Flip). A fake pointer clicks the filters in a loop.",
    kind: "play",
    C: U92,
  },
  {
    code: "U93",
    name: "Raining letters swap",
    how: "On hover each letter drops out of its clip while a clone falls in from above, in random order with a springy ease. A fake pointer hovers each menu link.",
    kind: "play",
    C: U93,
  },
  {
    code: "U94",
    name: "Char glow light-up",
    how: "Lines rest at 25% opacity; on hover chars light to 100% with a soft white glow left to right, dimming back on leave. A fake pointer reads line by line.",
    kind: "play",
    C: U94,
  },
  {
    code: "U95",
    name: "Blur accordion",
    how: "Rows open with a spring; the answer enters from blur 5px + opacity 0 and leaves the same way. A fake pointer clicks row after row.",
    kind: "play",
    C: U95,
  },
  {
    code: "U96",
    name: "Bubble fill from point",
    how: "A circle grows from the centre, the corner or the icon to fill the button on hover, and the text inverts. A fake pointer hovers the three buttons.",
    kind: "play",
    C: U96,
  },
  {
    code: "U97",
    name: "Glint swipe",
    how: "On hover a narrow tilted white bar sweeps once corner to corner (~0.6 s) across the button and the card. A fake pointer presses the button, then hovers the card.",
    kind: "play",
    C: U97,
  },
  {
    code: "U98",
    name: "Magnetic button to glass reveal",
    how: "The button (and cursor) pull toward each other within a radius; on hover a frosted glass panel with details expands from the button. A fake pointer approaches, hovers and leaves.",
    kind: "play",
    C: U98,
  },
  {
    code: "U99",
    name: "Add-to-cart microinteraction",
    how: "Click Add: the label slides up, the button shrinks to a spinner circle, turns into a drawn tick, the bag count bumps, then the label returns. Loops by itself.",
    kind: "play",
    C: U99,
  },
  {
    code: "U100",
    name: "Magnetic hover with lag ring",
    how: "Buttons pull toward the cursor within a radius while their thin outline ring lags behind and catches up. A fake pointer orbits each button.",
    kind: "play",
    C: U100,
  },
  {
    code: "U101",
    name: "Image rollover overlay menu",
    how: "In a fullscreen menu, hovering a link wipes its large background photo in (clip from top) and dims the other links. A fake pointer reads down the list.",
    kind: "play",
    C: U101,
  },
  {
    code: "U102",
    name: "Quick view add-to-cart",
    how: "A product card expands in place (Flip) into a quick view with sizes and add-to-bag while the others dim; a fake pointer opens, picks a size, adds and closes, card after card.",
    kind: "play",
    C: U102,
  },
];
