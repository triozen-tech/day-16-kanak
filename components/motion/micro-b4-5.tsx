"use client";

// Micro-interactions, batch 4 · group 5 (MOTION-MENU U50–U61). Small focused demos for /lab/motion.
// Every demo plays by itself while on screen: a visible fake pointer (ring) or a timed toggle drives the hover / click,
// and the real mouse takes over whenever it moves. A CSS-only glow loop never stops. Pauses off screen.
// ?static=1 / reduced motion: no JS motion, the markup shows a sensible final state.
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, loadPlugin, prefersReducedMotion } from "@/lib/gsap";
import { scene, useTicker } from "@/components/fx/shared";
import { Product } from "@/components/sections/kit";
import type { MotionDef } from "./types";

const F = {
  sg: "Space Grotesk Variable",
  fr: "Fraunces Variable",
  is: "Instrument Serif",
  sy: "Syne Variable",
  mr: "Manrope Variable",
};

const CSS = `
.b4g5u-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.42)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.2)),transparent 70%);animation:b4g5u-drift 5.8s linear infinite alternate;will-change:transform}
@keyframes b4g5u-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b4g5u-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4);pointer-events:none;z-index:60;opacity:0;transition:opacity .25s}
.b4g5u-dot.tap{animation:b4g5u-tap .38s cubic-bezier(.2,.7,.2,1)}
@keyframes b4g5u-tap{0%{box-shadow:0 0 0 0 rgba(255,255,255,.55),0 4px 14px rgba(0,0,0,.4);background:rgba(255,255,255,.7)}100%{box-shadow:0 0 0 22px rgba(255,255,255,0),0 4px 14px rgba(0,0,0,.4)}}

.u50-tab .u50-lab{color:rgba(238,242,255,.6);transition:color .35s}
.u50-tab.on .u50-lab{color:#0a0d16}

.u51-b{position:relative;overflow:hidden;isolation:isolate}
.u51-fill{position:absolute;inset:0;z-index:-1;background:#ffcf6b;transition:transform .55s cubic-bezier(.7,0,.2,1)}
.u51-left{transform:scaleX(0);transform-origin:0 50%}
.u51-right{transform:scaleX(0);transform-origin:100% 50%}
.u51-top{transform:scaleY(0);transform-origin:50% 0}
.u51-bottom{transform:scaleY(0);transform-origin:50% 100%}
.u51-b.on .u51-fill,.u51-b:hover .u51-fill{transform:scale(1)}
.u51-lab{transition:color .45s cubic-bezier(.7,0,.2,1)}
.u51-b.on .u51-lab,.u51-b:hover .u51-lab{color:#0a0d16}
.u51-arr{display:inline-block;transition:transform .45s cubic-bezier(.7,0,.2,1)}
.u51-b.on .u51-arr,.u51-b:hover .u51-arr{transform:translateX(6px)}

.u56-film{animation:u56-kb 9s linear infinite alternate}
@keyframes u56-kb{0%{transform:scale(1.04) translate3d(-1.5%,0,0)}100%{transform:scale(1.14) translate3d(1.5%,-1%,0)}}

.u61-hue{position:absolute;inset:-1px;border-radius:inherit;pointer-events:none;animation:u61-hue 6s linear infinite}
@property --u61a{syntax:'<angle>';inherits:false;initial-value:0deg}
.u61-ring{position:absolute;inset:0;border-radius:inherit;padding:2px;background:conic-gradient(from var(--u61a),transparent 0deg 240deg,hsl(190 100% 62% / .0) 250deg,hsl(190 100% 62%) 336deg,#fff 354deg,transparent 360deg);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;animation:u61-spin 3.4s linear infinite}
.u61-ring.blur{filter:blur(7px);padding:3px;opacity:.9}
@keyframes u61-spin{to{--u61a:360deg}}
@keyframes u61-hue{to{filter:hue-rotate(360deg)}}
.u61-line{position:absolute;left:0;right:0;bottom:-1px;height:2px;overflow:hidden;pointer-events:none}
.u61-comet{position:absolute;top:0;bottom:0;left:0;width:38%;background:linear-gradient(90deg,transparent,hsl(190 100% 62%),#fff);animation:u61-run 2.2s cubic-bezier(.55,0,.45,1) infinite}
.u61-line.blur{height:10px;bottom:-5px;filter:blur(5px)}
@keyframes u61-run{0%{transform:translateX(-110%)}100%{transform:translateX(280%)}}
.u61-off .u61-hue,.u61-off .u61-ring,.u61-off .u61-comet{animation-play-state:paused}

html.is-static .b4g5u-glow,html.is-static .u56-film,html.is-static .u61-hue,html.is-static .u61-ring,html.is-static .u61-comet{animation:none}
html.is-static {
  .b4g5u-glow,.u56-film,.u61-hue,.u61-ring,.u61-comet{animation:none}
  .u51-fill,.u51-lab,.u51-arr,.u50-tab .u50-lab{transition:none}
}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). `sheen` repeats the glow on top (screen). */
function Stage({ r, children, className = "", g1, g2, sheen = false }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string; sheen?: boolean }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0d16] text-[#eef2ff] ${className}`}>
      <style href="b4g5u-css" precedence="default">
        {CSS}
      </style>
      <div className="b4g5u-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
      {sheen && <div className="b4g5u-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.4, zIndex: 45 } as CSSProperties} aria-hidden />}
    </div>
  );
}

const Dot = ({ r }: { r: RefObject<HTMLDivElement | null> }) => <div ref={r} className="b4g5u-dot" aria-hidden />;

/** Replays the little "click" ring on the fake pointer. */
function tapDot(d: HTMLElement | null) {
  if (!d) return;
  d.classList.remove("tap");
  void d.offsetWidth;
  d.classList.add("tap");
}

type Pt = { x: number; y: number; inside: boolean };
type PtF = Pt & { real: boolean };

/** Pointer driver: the real mouse wins for 2.5 s after it last moved; otherwise `script` moves a visible fake ring. */
function usePointer(
  root: RefObject<HTMLDivElement | null>,
  dot: RefObject<HTMLDivElement | null> | null,
  script: (t: number, el: HTMLDivElement) => Pt,
  frame: (p: PtF, el: HTMLDivElement, dt: number) => void,
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
  useTicker(root, (t, dt) => {
    const el = root.current;
    if (!el) return;
    if (t0.current < 0) t0.current = t;
    const R = real.current;
    const useReal = performance.now() - R.at < 2500;
    const p = useReal ? { x: R.x, y: R.y, inside: R.inside } : sc.current(t - t0.current, el);
    const dn = dot?.current;
    if (dn) {
      dn.style.transform = `translate3d(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px,0)`;
      dn.style.opacity = useReal ? "0" : "1";
    }
    fr.current({ ...p, real: useReal }, el, Math.min(dt, 0.05));
  });
}

/** For timeline-driven demos: hides the fake ring while the real mouse moves over the stage (2.5 s). */
function useHideDot(root: RefObject<HTMLDivElement | null>, dot: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let id = 0;
    const move = () => {
      if (dot.current) dot.current.style.visibility = "hidden";
      window.clearTimeout(id);
      id = window.setTimeout(() => dot.current && (dot.current.style.visibility = ""), 2500);
    };
    el.addEventListener("pointermove", move);
    return () => {
      window.clearTimeout(id);
      el.removeEventListener("pointermove", move);
    };
  }, [root, dot]);
}

/** "play" helper: waits for fonts (+ an optional plugin), builds a looping animation in a gsap.context, plays it only
 *  while on screen, reverts on unmount. Nothing runs with prefersReducedMotion(). */
function usePlay(ref: RefObject<HTMLElement | null>, build: (root: HTMLElement, onClean: (fn: () => void) => void) => gsap.core.Animation | void, pre?: () => Promise<unknown>) {
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
    };
  }, [ref]);
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

function rel(node: Element, root: Element) {
  const a = node.getBoundingClientRect();
  const r = root.getBoundingClientRect();
  return { l: a.left - r.left, t: a.top - r.top, w: a.width, h: a.height };
}
const centre = (node: Element, root: Element, fx = 0.5, fy = 0.5): [number, number] => {
  const b = rel(node, root);
  return [b.l + b.w * fx, b.t + b.h * fy];
};
const hit = (p: Pt, node: Element, root: Element, pad = 0) => {
  const b = rel(node, root);
  return p.inside && p.x >= b.l - pad && p.x <= b.l + b.w + pad && p.y >= b.t - pad && p.y <= b.t + b.h + pad;
};
/** frame-rate independent lerp factor */
const lerpK = (k: number, dt: number) => 1 - Math.pow(1 - k, dt * 60);

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, className = "", w = 600, h = 800, label = "" }: { i: number; className?: string; w?: number; h?: number; label?: string }) => (
  <img src={scene(i, w, h, label)} alt="" className={`block h-full w-full object-cover ${className}`} draggable={false} />
);

/* ───────────────────────── U50 · Sliding nav indicator ───────────────────────── */
const U50_TABS = [
  { t: "Rooms", h: "Twelve rooms, one river.", s: "From ₹18,400 a night · breakfast on the deck" },
  { t: "Dining", h: "Supper by lamplight.", s: "Seven courses · ₹4,200 a guest" },
  { t: "Spa", h: "Slow water, warm stone.", s: "Ninety-minute ritual · ₹6,800" },
  { t: "Journeys", h: "Dawn on the backwaters.", s: "Boat, guide and chai · ₹2,900" },
  { t: "Journal", h: "Notes from the house.", s: "New stories every Sunday" },
];
type FlipT = typeof import("gsap/Flip").Flip;
function U50() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const cur = useRef(0);
  const flip = useRef<FlipT | null>(null);
  const lastK = useRef(-1);
  const ORDER = [0, 2, 4, 1, 3];
  const SEG = 1.15;
  useEffect(() => {
    if (prefersReducedMotion()) return;
    loadPlugin("Flip").then((f) => (flip.current = f));
  }, []);
  const select = (i: number) => {
    const el = root.current;
    if (!el || i === cur.current) return;
    const tabs = el.querySelectorAll<HTMLElement>(".u50-tab");
    const pill = el.querySelector<HTMLElement>(".u50-pill");
    const panels = el.querySelectorAll<HTMLElement>(".u50-panel");
    if (!pill) return;
    const Fl = flip.current;
    const state = Fl?.getState(pill);
    tabs[i].prepend(pill);
    if (Fl && state && !prefersReducedMotion()) Fl.from(state, { duration: 0.6, ease: "back.out(1.25)" });
    tabs.forEach((t, k) => t.classList.toggle("on", k === i));
    if (!prefersReducedMotion()) {
      gsap.to(panels[cur.current], { autoAlpha: 0, y: -16, duration: 0.32, ease: "power2.in", overwrite: true });
      gsap.fromTo(panels[i], { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.55, delay: 0.12, ease: "power3.out", overwrite: true });
    } else {
      panels.forEach((p, k) => (p.style.visibility = k === i ? "visible" : "hidden"));
    }
    cur.current = i;
  };
  const kRef = useRef(0);
  usePointer(
    root,
    dot,
    (t, el) => {
      const tabs = el.querySelectorAll(".u50-tab");
      const pts = ORDER.map((i) => centre(tabs[i], el, 0.55, 0.6));
      kRef.current = Math.floor(t / SEG);
      const [x, y] = stepPath(t, pts, SEG, 0.4);
      return { x: x + Math.sin(t * 2.3) * 6, y: y + Math.cos(t * 1.9) * 4, inside: true };
    },
    (p) => {
      // the scripted "click": every SEG seconds the ring lands on the next tab and selects it
      if (p.real || kRef.current === lastK.current) return;
      lastK.current = kRef.current;
      const i = ORDER[kRef.current % ORDER.length];
      if (i !== cur.current) {
        tapDot(dot.current);
        select(i);
      }
    },
  );
  return (
    <Stage r={root} g1="rgba(122,227,196,.34)" g2="rgba(79,141,255,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[7%] px-[6%]">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/55">Kayal House · Alleppey</p>
        <nav className="flex items-center gap-1 rounded-full border border-white/12 bg-white/[0.05] p-[6px] backdrop-blur" aria-label="Sections">
          {U50_TABS.map((tab, i) => (
            <button
              key={tab.t}
              type="button"
              onClick={() => select(i)}
              className={`u50-tab relative rounded-full px-[clamp(20px,2.4vw,38px)] py-[clamp(12px,1.6vh,18px)] ${i === 0 ? "on" : ""}`}
            >
              {i === 0 && <span className="u50-pill absolute left-0 top-0 block h-full w-full rounded-full bg-[#7ae3c4] shadow-[0_8px_30px_rgba(122,227,196,.35)]" aria-hidden />}
              <span className="u50-lab relative z-[1] text-[clamp(16px,1.45vw,22px)] font-[600] tracking-[-0.01em]" style={{ fontFamily: F.sg }}>
                {tab.t}
              </span>
            </button>
          ))}
        </nav>
        <div className="relative w-[min(86%,980px)] text-center">
          {U50_TABS.map((tab, i) => (
            <div key={tab.t} className={`u50-panel ${i === 0 ? "relative" : "invisible absolute inset-x-0 top-0"}`}>
              <h3 className="text-[clamp(44px,5vw,80px)] leading-[1.02] tracking-[-0.02em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
                {tab.h}
              </h3>
              <p className="mt-4 text-[clamp(15px,1.2vw,18px)] text-white/60" style={{ fontFamily: F.mr }}>
                {tab.s}
              </p>
            </div>
          ))}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U51 · Sweep fill ───────────────────────── */
const U51_BTNS = [
  { d: "left", l: "Reserve a table" },
  { d: "right", l: "View the menu" },
  { d: "top", l: "Gift a dinner" },
  { d: "bottom", l: "Private events" },
] as const;
function U51() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const active = useRef(0);
  usePointer(
    root,
    dot,
    (t, el) => {
      const b = el.querySelectorAll(".u51-b");
      const er = el.getBoundingClientRect();
      const off: [number, number] = [er.width * 0.5, er.height * 0.5];
      const pts: [number, number][] = [centre(b[0], el, 0.4), off, centre(b[1], el, 0.6), centre(b[3], el, 0.6), off, centre(b[2], el, 0.4)];
      const [x, y] = stepPath(t, pts, 0.85, 0.42);
      return { x: x + Math.sin(t * 2.2) * 8, y: y + Math.cos(t * 1.8) * 5, inside: true };
    },
    (p, el) => {
      const b = [...el.querySelectorAll(".u51-b")];
      const idx = b.findIndex((n) => hit(p, n, el));
      if (idx === active.current) return;
      active.current = idx;
      b.forEach((n, i) => n.classList.toggle("on", i === idx));
    },
  );
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    active.current = -1;
    el.querySelectorAll(".u51-b.on").forEach((n) => n.classList.remove("on"));
  }, []);
  return (
    <Stage r={root} g1="rgba(255,207,107,.3)" g2="rgba(255,122,89,.2)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[6%]">
        <h3 className="text-center text-[clamp(38px,4vw,62px)] leading-none tracking-[-0.02em]" style={{ fontFamily: F.is }}>
          Saffron Room <span className="italic text-[#ffcf6b]">· tonight</span>
        </h3>
        <div className="grid grid-cols-2 gap-x-[clamp(20px,2.4vw,40px)] gap-y-[clamp(22px,3.6vh,40px)]">
          {U51_BTNS.map((b, i) => (
            <div key={b.d} className="flex flex-col items-center gap-3">
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className={`u51-b flex w-[clamp(300px,27vw,420px)] items-center justify-between rounded-full border border-[#ffcf6b]/60 px-[34px] py-[clamp(18px,2.6vh,26px)] ${i === 0 ? "on" : ""}`}
              >
                <span className={`u51-fill u51-${b.d}`} aria-hidden />
                <span className="u51-lab text-[clamp(18px,1.6vw,24px)] font-[600]" style={{ fontFamily: F.sg }}>
                  {b.l}
                </span>
                <span className="u51-lab u51-arr text-[22px]">→</span>
              </a>
              <span className="text-[12px] uppercase tracking-[0.22em] text-white/45">fill from {b.d}</span>
            </div>
          ))}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U52 · Blend-mode circle cursor ───────────────────────── */
function U52() {
  const root = useRef<HTMLDivElement>(null);
  const cur = useRef<HTMLDivElement>(null);
  const st = useRef({ x: -100, y: -100, s: 1, init: false });
  usePointer(
    root,
    null,
    (t, el) => {
      // a slow figure-eight across the copy, the photo and the links
      const w = el.clientWidth;
      const h = el.clientHeight;
      return { x: w * (0.5 + 0.36 * Math.sin(t * 0.85)), y: h * (0.52 + 0.3 * Math.sin(t * 1.7)), inside: true };
    },
    (p, el, dt) => {
      const c = cur.current;
      if (!c) return;
      const S = st.current;
      if (!S.init) {
        S.x = p.x;
        S.y = p.y;
        S.init = true;
      }
      const grow = [...el.querySelectorAll("[data-grow]")].some((n) => hit(p, n, el, 6));
      const k = lerpK(0.14, dt);
      S.x += (p.x - S.x) * k;
      S.y += (p.y - S.y) * k;
      S.s += ((grow ? 90 / 24 : p.inside ? 1 : 0) - S.s) * lerpK(0.12, dt);
      c.style.transform = `translate3d(${S.x.toFixed(1)}px,${S.y.toFixed(1)}px,0) scale(${S.s.toFixed(3)})`;
      c.style.opacity = "1";
    },
  );
  return (
    <Stage r={root} className="cursor-none" g1="rgba(160,140,255,.3)" g2="rgba(79,141,255,.2)">
      <div className="absolute inset-0 flex flex-col justify-center gap-[5%] px-[7%]">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/55">Halden Capital · letter 2026</p>
        <h3 className="max-w-[16ch] text-[clamp(52px,6vw,96px)] leading-[0.98] tracking-[-0.03em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
          Capital that keeps
          <span data-grow className="mx-[0.25em] inline-block h-[0.82em] w-[1.9em] translate-y-[0.08em] overflow-hidden rounded-full align-baseline">
            <Img i={2} w={400} h={200} />
          </span>
          its nerve.
        </h3>
        <div className="flex gap-10 text-[clamp(16px,1.3vw,20px)]" style={{ fontFamily: F.sg }}>
          <a data-grow href="#" onClick={(e) => e.preventDefault()} className="border-b border-white/40 pb-1">
            Read the letter →
          </a>
          <a data-grow href="#" onClick={(e) => e.preventDefault()} className="border-b border-white/40 pb-1">
            Our holdings
          </a>
          <a data-grow href="#" onClick={(e) => e.preventDefault()} className="border-b border-white/40 pb-1">
            Speak to a partner
          </a>
        </div>
      </div>
      <div
        ref={cur}
        className="pointer-events-none absolute left-0 top-0 z-50 -ml-3 -mt-3 h-6 w-6 rounded-full bg-white opacity-0"
        style={{ mixBlendMode: "difference" }}
        aria-hidden
      />
    </Stage>
  );
}

/* ───────────────────────── U53 · Rotating circle-text badge ───────────────────────── */
function U53() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const mid = useRef<HTMLDivElement>(null);
  const pathId = useId().replace(/:/g, "");
  const st = useRef({ a: 0, v: 24, boost: 0, nx: 0, ny: 0 });
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => (st.current.boost = Math.min(st.current.boost + Math.abs(e.deltaY) * 0.6, 260));
    el.addEventListener("wheel", wheel, { passive: true });
    return () => el.removeEventListener("wheel", wheel);
  }, []);
  usePointer(
    root,
    dot,
    (t, el) => {
      const b = el.querySelector(".u53-badge");
      const er = el.getBoundingClientRect();
      if (!b) return { x: 0, y: 0, inside: false };
      const bb = rel(b, el);
      const pts: [number, number][] = [
        [er.width * 0.22, er.height * 0.7],
        [bb.l + bb.w * 0.5, bb.t + bb.h * 0.48],
        [bb.l + bb.w * 0.78, bb.t + bb.h * 0.3],
        [bb.l + bb.w * 0.3, bb.t + bb.h * 0.72],
        [er.width * 0.45, er.height * 0.86],
      ];
      const [x, y] = stepPath(t, pts, 0.9, 0.45);
      return { x: x + Math.sin(t * 2.4) * 10, y: y + Math.cos(t * 2) * 8, inside: true };
    },
    (p, el, dt) => {
      const b = el.querySelector(".u53-badge");
      if (!b || !ring.current || !mid.current) return;
      const bb = rel(b, el);
      const cx = bb.l + bb.w / 2;
      const cy = bb.t + bb.h / 2;
      const dx = p.x - cx;
      const dy = p.y - cy;
      const over = p.inside && Math.hypot(dx, dy) < bb.w / 2;
      const S = st.current;
      const target = (over ? 190 : 24) + S.boost;
      S.boost *= Math.pow(0.08, dt);
      S.v += (target - S.v) * lerpK(over ? 0.09 : 0.035, dt);
      S.a = (S.a + S.v * dt) % 360;
      ring.current.style.transform = `rotate(${S.a.toFixed(2)}deg)`;
      // centre icon nudges toward the pointer (capped), eases home when it leaves
      const near = p.inside && Math.hypot(dx, dy) < bb.w * 0.95;
      const m = 26;
      const tx = near ? Math.max(-m, Math.min(m, dx * 0.2)) : 0;
      const ty = near ? Math.max(-m, Math.min(m, dy * 0.2)) : 0;
      S.nx += (tx - S.nx) * lerpK(0.12, dt);
      S.ny += (ty - S.ny) * lerpK(0.12, dt);
      mid.current.style.transform = `translate3d(${S.nx.toFixed(1)}px,${S.ny.toFixed(1)}px,0) scale(${over ? 1.08 : 1})`;
    },
  );
  return (
    <Stage r={root} g1="rgba(214,120,255,.3)" g2="rgba(255,179,107,.22)">
      <div className="absolute inset-0 grid grid-cols-[1.2fr_1fr] items-center gap-[4%] px-[7%]">
        <div>
          <p className="text-[13px] uppercase tracking-[0.24em] text-white/55">Vellore Hills Estate</p>
          <h3 className="mt-4 text-[clamp(48px,5.4vw,86px)] leading-[0.98] tracking-[-0.02em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
            Cellar door,
            <br />
            <span className="italic text-[#e3a6ff]">open Fridays.</span>
          </h3>
          <p className="mt-5 max-w-[34ch] text-[16px] text-white/60" style={{ fontFamily: F.mr }}>
            Six pours from the 2026 harvest, ₹1,800 a seat.
          </p>
        </div>
        <div className="flex justify-center">
          <a href="#" onClick={(e) => e.preventDefault()} className="u53-badge relative block aspect-square w-[clamp(260px,25vw,360px)] rounded-full" aria-label="Book a tasting">
            <div ref={ring} className="absolute inset-0">
              <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden>
                <defs>
                  <path id={pathId} d="M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0" />
                </defs>
                <text fill="#f3ecff" fontSize="14.5" fontWeight="600" letterSpacing="3.2" style={{ fontFamily: F.sg }}>
                  <textPath href={`#${pathId}`} textLength="498" lengthAdjust="spacing">
                    BOOK A TASTING · HARVEST 2026 · CELLAR DOOR ·
                  </textPath>
                </text>
              </svg>
            </div>
            <div className="absolute inset-[30%] flex items-center justify-center">
              <div ref={mid} className="flex h-full w-full items-center justify-center rounded-full bg-[#e3a6ff] text-[#120a1c] shadow-[0_10px_40px_rgba(227,166,255,.35)]">
                <svg viewBox="0 0 24 24" className="h-[38%] w-[38%]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                  <path d="M7 17 17 7M9 7h8v8" />
                </svg>
              </div>
            </div>
          </a>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U54 · Floating cart flyout ───────────────────────── */
const U54_ITEMS = [
  { n: "Indigo linen shirt", v: "M · Indigo", p: "₹3,490", i: 0 },
  { n: "Handloom stole", v: "One size · Rust", p: "₹2,490", i: 1 },
  { n: "Cotton day tote", v: "Natural", p: "₹1,960", i: 3 },
];
function U54() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  useHideDot(root, dot);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const panel = q(".u54-panel")[0];
    const pill = q(".u54-pill")[0];
    const items = q(".u54-item");
    const gone = items[1];
    const rm = q(".u54-rm")[1];
    const close = q(".u54-close")[0];
    const sub = q(".u54-sub")[0];
    const count = q(".u54-count")[0];
    const d = dot.current!;
    const er = el.getBoundingClientRect();
    const start: [number, number] = [er.width * 0.3, er.height * 0.62];
    const pPill = centre(pill, el);
    const pRm = centre(rm, el);
    const pClose = centre(close, el);
    const h = gone.offsetHeight;
    const reset = () => {
      sub.textContent = "₹7,940";
      count.textContent = "3";
    };
    reset();
    gsap.set(d, { opacity: 1, x: start[0], y: start[1] });
    const tl = gsap.timeline({ repeat: -1, defaults: { ease: "power3.out" } });
    tl.fromTo(d, { x: start[0], y: start[1] }, { x: pPill[0], y: pPill[1], duration: 0.5, ease: "power2.inOut" }, 0)
      .call(() => tapDot(d), [], 0.5)
      .fromTo(pill, { scale: 1 }, { scale: 0.93, duration: 0.12, yoyo: true, repeat: 1, ease: "power2.out" }, 0.5)
      .fromTo(panel, { autoAlpha: 0, scale: 0.82, y: -18, transformOrigin: "100% 0%" }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.55 }, 0.55)
      .fromTo(items, { autoAlpha: 0, x: 34 }, { autoAlpha: 1, x: 0, duration: 0.45, stagger: 0.08 }, 0.75)
      .fromTo(gone, { height: h, paddingTop: 14, paddingBottom: 14 }, { height: h, duration: 0.01 }, 0.75)
      .to(d, { x: pRm[0], y: pRm[1], duration: 0.5, ease: "power2.inOut" }, 1.02)
      .call(() => tapDot(d), [], 1.54)
      .to(gone, { x: 90, autoAlpha: 0, duration: 0.32, ease: "power2.in" }, 1.56)
      .to(gone, { height: 0, paddingTop: 0, paddingBottom: 0, duration: 0.36, ease: "power3.inOut" }, 1.82)
      .call(() => ((sub.textContent = "₹5,450"), (count.textContent = "2")), [], 1.86)
      .fromTo(sub, { y: 8, opacity: 0.3 }, { y: 0, opacity: 1, duration: 0.3 }, 1.86)
      .to(d, { x: pClose[0], y: pClose[1], duration: 0.42, ease: "power2.inOut" }, 1.95)
      .call(() => tapDot(d), [], 2.38)
      .to(panel, { autoAlpha: 0, scale: 0.9, y: -12, duration: 0.38, ease: "power2.in" }, 2.4)
      .to(d, { x: start[0], y: start[1], duration: 0.45, ease: "power2.inOut" }, 2.72)
      .call(reset, [], 3.17);
    tlRef.current = tl;
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,150,96,.3)" g2="rgba(79,141,255,.2)">
      <header className="absolute inset-x-[4%] top-[6%] flex items-center justify-between">
        <span className="text-[24px] tracking-[-0.01em]" style={{ fontFamily: F.fr, fontWeight: 500 }}>
          Kaveri &amp; Co.
        </span>
        <nav className="flex gap-8 text-[15px] text-white/60" style={{ fontFamily: F.sg }}>
          <span>Men</span>
          <span>Women</span>
          <span>Home</span>
          <span>Journal</span>
        </nav>
        <button
          type="button"
          onClick={() => tlRef.current?.restart()}
          className="u54-pill flex items-center gap-3 rounded-full bg-[#ff9660] px-5 py-3 text-[15px] font-[600] text-[#1a0d06]"
          style={{ fontFamily: F.sg }}
        >
          Bag <span className="u54-count grid h-6 w-6 place-items-center rounded-full bg-[#1a0d06] text-[13px] text-[#ff9660]">3</span>
        </button>
      </header>
      <div className="absolute bottom-[12%] left-[6%] max-w-[44%]">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/55">Monsoon edit</p>
        <h3 className="mt-3 text-[clamp(46px,5vw,80px)] leading-[0.98] tracking-[-0.02em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
          Woven slow,
          <br />
          <span className="italic text-[#ff9660]">worn often.</span>
        </h3>
      </div>
      <aside className="u54-panel absolute right-[4%] top-[17%] z-20 w-[min(420px,34%)] rounded-[24px] border border-white/12 bg-[#141a2c]/95 p-6 shadow-[0_30px_80px_rgba(0,0,0,.55)]">
        <div className="flex items-center justify-between">
          <p className="text-[19px] font-[600]" style={{ fontFamily: F.sg }}>
            Your bag
          </p>
          <span className="u54-close grid h-9 w-9 place-items-center rounded-full border border-white/15 text-[16px] text-white/70">×</span>
        </div>
        <ul className="mt-3">
          {U54_ITEMS.map((it) => (
            <li key={it.n} className="u54-item flex items-center gap-4 overflow-hidden border-b border-white/10 py-[14px]">
              <div className="h-[58px] w-[48px] shrink-0 overflow-hidden rounded-[10px]">
                <Img i={it.i} w={120} h={150} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-[600]" style={{ fontFamily: F.sg }}>
                  {it.n}
                </p>
                <p className="text-[13px] text-white/50">{it.v}</p>
              </div>
              <span className="text-[15px] tabular-nums">{it.p}</span>
              <span className="u54-rm grid h-7 w-7 place-items-center rounded-full bg-white/8 text-[14px] text-white/60">×</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-[14px] text-white/60">Subtotal</span>
          <span className="u54-sub inline-block text-[20px] font-[600] tabular-nums" style={{ fontFamily: F.sg }}>
            ₹7,940
          </span>
        </div>
        <div className="mt-4 rounded-full bg-[#ff9660] py-3 text-center text-[15px] font-[600] text-[#1a0d06]" style={{ fontFamily: F.sg }}>
          Checkout
        </div>
      </aside>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U55 · Drop liquid button ───────────────────────── */
function U55() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const goo = `u55goo${useId().replace(/:/g, "")}`;
  useHideDot(root, dot);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const btn = q(".u55-btn")[0];
    const fill = q(".u55-fill")[0];
    const drops = q(".u55-drop");
    const lab = q(".u55-lab")[0];
    const d = dot.current!;
    const er = el.getBoundingClientRect();
    const off: [number, number] = [er.width * 0.3, er.height * 0.82];
    const on = centre(btn, el, 0.62, 0.5);
    gsap.set(d, { opacity: 1 });
    const tl = gsap.timeline({ repeat: -1 });
    tl.fromTo(d, { x: off[0], y: off[1] }, { x: on[0], y: on[1], duration: 0.45, ease: "power2.inOut" }, 0)
      .fromTo(fill, { y: 0, yPercent: 100 }, { yPercent: 0, duration: 0.8, ease: "power2.inOut" }, 0.42)
      .fromTo(lab, { color: "#eafff6" }, { color: "#06231a", duration: 0.35 }, 0.72)
      .fromTo(drops[0], { scale: 0, y: 0, scaleY: 0 }, { scale: 1, scaleY: 1, duration: 0.4, ease: "power2.out" }, 0.5)
      .to(drops[0], { y: 30, scaleY: 1.4, scaleX: 0.78, duration: 0.42, ease: "power2.in" }, 0.9)
      .to(drops[0], { y: 150, scaleY: 0.9, scaleX: 0.6, duration: 0.55, ease: "power2.in" }, 1.32)
      .to(drops[0], { scale: 0, duration: 0.2 }, 1.8)
      .fromTo(drops[1], { scale: 0, y: 0 }, { scale: 0.7, duration: 0.35, ease: "power2.out" }, 0.75)
      .to(drops[1], { y: 120, scale: 0.35, duration: 0.6, ease: "power2.in" }, 1.25)
      .to(drops[1], { scale: 0, duration: 0.15 }, 1.85)
      .to(d, { x: off[0], y: off[1], duration: 0.5, ease: "power2.inOut" }, 1.5)
      .to(fill, { yPercent: 100, duration: 0.6, ease: "power2.inOut" }, 1.95)
      .to(lab, { color: "#eafff6", duration: 0.3 }, 2.1);
    tlRef.current = tl;
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(124,240,197,.5)" sheen g2="rgba(79,141,255,.22)">
      <svg width="0" height="0" className="absolute" aria-hidden>
        <filter id={goo}>
          <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="b" />
          <feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10" result="g" />
          <feComposite in="SourceGraphic" in2="g" operator="atop" />
        </filter>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/55">Tidepool · cold-pressed</p>
        <h3 className="mt-4 text-center text-[clamp(44px,4.8vw,74px)] leading-[1] tracking-[-0.02em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
          One drop, <span className="italic text-[#7cf0c5]">all morning.</span>
        </h3>
        <div className="relative mt-[5%] h-[260px] w-[440px]">
          {/* gooey layer: the button body + the drops merge through the SVG filter */}
          <div className="absolute inset-0" style={{ filter: `url(#${goo})` }} aria-hidden>
            <div className="absolute left-0 right-0 top-0 h-[104px] overflow-hidden rounded-full bg-[#1b2a42]">
              <div className="u55-fill absolute inset-0 bg-[#7cf0c5]" style={{ transform: "translateY(100%)" }} />
            </div>
            <div className="u55-drop absolute left-[50%] top-[78px] -ml-[22px] h-[44px] w-[44px] rounded-full bg-[#7cf0c5]" style={{ transform: "scale(0)" }} />
            <div className="u55-drop absolute left-[62%] top-[80px] -ml-[14px] h-[28px] w-[28px] rounded-full bg-[#7cf0c5]" style={{ transform: "scale(0)" }} />
          </div>
          <button
            type="button"
            onPointerEnter={() => tlRef.current?.restart()}
            className="u55-btn absolute left-0 right-0 top-0 flex h-[104px] items-center justify-center gap-3 rounded-full border border-[#7cf0c5]/50"
          >
            <span className="u55-lab text-[clamp(20px,1.8vw,26px)] font-[600] text-[#eafff6]" style={{ fontFamily: F.sg }}>
              Start a subscription · ₹1,290
            </span>
          </button>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U56 · Play button grows into a cursor ───────────────────────── */
function U56() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLDivElement>(null);
  const lab = useRef<HTMLSpanElement>(null);
  const st = useRef({ x: 0, y: 0, in: false, init: false });
  usePointer(
    root,
    dot,
    (t, el) => {
      const v = el.querySelector(".u56-video");
      const er = el.getBoundingClientRect();
      if (!v) return { x: 0, y: 0, inside: false };
      const pts: [number, number][] = [
        [er.width * 0.17, er.height * 0.72],
        centre(v, el, 0.22, 0.4),
        centre(v, el, 0.7, 0.28),
        centre(v, el, 0.82, 0.72),
        centre(v, el, 0.4, 0.66),
      ];
      const [x, y] = stepPath(t, pts, 0.95, 0.5);
      return { x: x + Math.sin(t * 2.1) * 12, y: y + Math.cos(t * 1.6) * 9, inside: true };
    },
    (p, el, dt) => {
      const v = el.querySelector(".u56-video");
      const b = btn.current;
      if (!v || !b) return;
      const S = st.current;
      if (!S.init) {
        S.x = p.x;
        S.y = p.y;
        S.init = true;
      }
      const k = lerpK(0.09, dt);
      S.x += (p.x - S.x) * k;
      S.y += (p.y - S.y) * k;
      gsap.set(b, { x: S.x, y: S.y });
      const inside = hit(p, v, el);
      if (inside !== S.in) {
        S.in = inside;
        gsap.to(b, { scale: inside ? 1 : 0, duration: inside ? 0.55 : 0.35, ease: inside ? "back.out(1.6)" : "power2.in", overwrite: "auto" });
        if (inside && lab.current) gsap.fromTo(lab.current, { rotation: -120, opacity: 0 }, { rotation: 0, opacity: 1, duration: 0.6, ease: "power3.out" });
      }
    },
  );
  useEffect(() => {
    if (btn.current && !prefersReducedMotion()) gsap.set(btn.current, { scale: 0, xPercent: -50, yPercent: -50 });
  }, []);
  return (
    <Stage r={root} g1="rgba(255,190,120,.3)" g2="rgba(79,141,255,.18)">
      <div className="absolute inset-0 grid grid-cols-[0.75fr_2fr] items-center gap-[4%] px-[5%] py-[6%]">
        <div>
          <p className="text-[13px] uppercase tracking-[0.24em] text-white/55">A short film · 4 min</p>
          <h3 className="mt-4 text-[clamp(42px,4.4vw,70px)] leading-[0.98] tracking-[-0.02em]" style={{ fontFamily: F.is }}>
            Monsoon,
            <br />
            <span className="italic text-[#ffbe78]">slowly.</span>
          </h3>
          <p className="mt-5 max-w-[26ch] text-[15px] text-white/60" style={{ fontFamily: F.mr }}>
            Three days on a tea estate in the rain, filmed in one take.
          </p>
        </div>
        <div className="u56-video relative h-full cursor-none overflow-hidden rounded-[20px]" data-cursor="Play">
          <div className="u56-film absolute inset-0">
            <Img i={3} w={1200} h={760} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />
          <span className="absolute bottom-5 left-6 text-[13px] tabular-nums tracking-[0.18em] text-white/80">00:42 / 04:10</span>
        </div>
      </div>
      <div
        ref={btn}
        className="pointer-events-none absolute left-0 top-0 z-50 grid h-[132px] w-[132px] place-items-center rounded-full bg-[#f6efe4] text-[#14100a] shadow-[0_18px_50px_rgba(0,0,0,.45)]"
        style={{ transform: "translate(-50%,-50%) scale(0)" }}
        aria-hidden
      >
        <span ref={lab} className="flex items-center gap-2 text-[15px] font-[700] uppercase tracking-[0.2em]" style={{ fontFamily: F.sg }}>
          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="currentColor">
            <path d="M2 1l9 5-9 5z" />
          </svg>
          Play
        </span>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U57 · Colour-changing reactive cursor ───────────────────────── */
const U57_LOOK: Record<string, { c: string; s: number; ring: string }> = {
  dark: { c: "#f2ebdf", s: 1, ring: "rgba(242,235,223,0)" },
  light: { c: "#0d1220", s: 1, ring: "rgba(13,18,32,0)" },
  accent: { c: "#0d1220", s: 1.5, ring: "rgba(13,18,32,0)" },
  btn: { c: "#ff6a3d", s: 3.6, ring: "rgba(255,106,61,.35)" },
  btnA: { c: "#f2ebdf", s: 3.6, ring: "rgba(242,235,223,.35)" },
};
function U57() {
  const root = useRef<HTMLDivElement>(null);
  const cur = useRef<HTMLDivElement>(null);
  const st = useRef({ x: 0, y: 0, mode: "", init: false });
  usePointer(
    root,
    null,
    (t, el) => {
      const panels = el.querySelectorAll(".u57-panel");
      const btns = el.querySelectorAll('[data-cur^="btn"]');
      const pts: [number, number][] = [
        centre(panels[0], el, 0.45, 0.35),
        centre(btns[0], el),
        centre(panels[1], el, 0.5, 0.3),
        centre(btns[1], el),
        centre(panels[2], el, 0.55, 0.4),
        centre(btns[2], el),
      ];
      const [x, y] = stepPath(t, pts, 0.8, 0.5);
      return { x: x + Math.sin(t * 2.2) * 10, y: y + Math.cos(t * 1.7) * 8, inside: true };
    },
    (p, el, dt) => {
      const c = cur.current;
      if (!c) return;
      const S = st.current;
      if (!S.init) {
        S.x = p.x;
        S.y = p.y;
        S.init = true;
      }
      const k = lerpK(0.2, dt);
      S.x += (p.x - S.x) * k;
      S.y += (p.y - S.y) * k;
      gsap.set(c, { x: S.x, y: S.y });
      let mode = "dark";
      const b = [...el.querySelectorAll<HTMLElement>('[data-cur^="btn"]')].find((n) => hit(p, n, el, 4));
      if (b) mode = b.dataset.cur!;
      else {
        const pn = [...el.querySelectorAll<HTMLElement>(".u57-panel")].find((n) => hit(p, n, el));
        if (pn) mode = pn.dataset.cur!;
      }
      if (mode === S.mode) return;
      S.mode = mode;
      const L = U57_LOOK[mode];
      gsap.to(c, { backgroundColor: L.c, scale: L.s, boxShadow: `0 0 0 6px ${L.ring}`, duration: 0.45, ease: "power3.out", overwrite: "auto" });
    },
  );
  useEffect(() => {
    if (cur.current && !prefersReducedMotion()) gsap.set(cur.current, { xPercent: -50, yPercent: -50, opacity: 1 });
  }, []);
  const panel = "u57-panel relative flex flex-col justify-between p-[9%] cursor-none";
  return (
    <Stage r={root} g1="rgba(255,106,61,.3)" g2="rgba(242,235,223,.18)" sheen>
      <div className="absolute inset-0 grid grid-cols-3">
        <div className={`${panel} bg-[#0d1220]`} data-cur="dark">
          <p className="text-[13px] uppercase tracking-[0.24em] text-white/55">01 · Night roast</p>
          <h3 className="text-[clamp(38px,3.8vw,60px)] leading-[1] tracking-[-0.02em]" style={{ fontFamily: F.fr }}>
            Dark, with <span className="italic">cocoa.</span>
          </h3>
          <span data-cur="btn" className="self-start rounded-full border border-white/30 px-6 py-3 text-[15px] font-[600]" style={{ fontFamily: F.sg }}>
            ₹780 · Add
          </span>
        </div>
        <div className={`${panel} bg-[#f2ebdf] text-[#0d1220]`} data-cur="light">
          <p className="text-[13px] uppercase tracking-[0.24em] text-[#0d1220]/55">02 · Day blend</p>
          <h3 className="text-[clamp(38px,3.8vw,60px)] leading-[1] tracking-[-0.02em]" style={{ fontFamily: F.fr }}>
            Bright, with <span className="italic">citrus.</span>
          </h3>
          <span data-cur="btn" className="self-start rounded-full bg-[#0d1220] px-6 py-3 text-[15px] font-[600] text-[#f2ebdf]" style={{ fontFamily: F.sg }}>
            ₹720 · Add
          </span>
        </div>
        <div className={`${panel} bg-[#ff6a3d] text-[#0d1220]`} data-cur="accent">
          <p className="text-[13px] uppercase tracking-[0.24em] text-[#0d1220]/60">03 · Seasonal</p>
          <h3 className="text-[clamp(38px,3.8vw,60px)] leading-[1] tracking-[-0.02em]" style={{ fontFamily: F.fr }}>
            Monsoon <span className="italic">malabar.</span>
          </h3>
          <span data-cur="btnA" className="self-start rounded-full bg-[#0d1220] px-6 py-3 text-[15px] font-[600] text-[#f2ebdf]" style={{ fontFamily: F.sg }}>
            ₹890 · Add
          </span>
        </div>
      </div>
      <div ref={cur} className="pointer-events-none absolute left-0 top-0 z-50 h-[20px] w-[20px] rounded-full bg-[#f2ebdf] opacity-0" aria-hidden />
    </Stage>
  );
}

/* ───────────────────────── U58 · Shop product hover swap ───────────────────────── */
const U58_P = [
  { n: "Ember cold brew", p: "₹180", a: 0, c: "#ffb36b", i: 1 },
  { n: "Tide yuzu tonic", p: "₹160", a: 1, c: "#4f8dff", i: 0 },
  { n: "Moss matcha soda", p: "₹190", a: 2, c: "#18c48f", i: 2 },
];
function U58() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const active = useRef(-2);
  const swap = (el: HTMLElement, i: number, on: boolean) => {
    const card = el.querySelectorAll(".u58-card")[i];
    if (!card) return;
    const q = gsap.utils.selector(card);
    const d = { duration: 0.65, ease: "power3.inOut", overwrite: "auto" as const };
    gsap.to(q(".u58-pack"), { yPercent: on ? -100 : 0, ...d });
    gsap.to(q(".u58-life"), { yPercent: on ? 0 : 100, ...d });
    gsap.to(q(".u58-bar"), { yPercent: on ? 0 : 110, duration: on ? 0.5 : 0.35, delay: on ? 0.18 : 0, ease: "power3.out", overwrite: "auto" });
  };
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    gsap.set(el.querySelectorAll(".u58-life"), { y: 0, yPercent: 100 });
    gsap.set(el.querySelectorAll(".u58-bar"), { y: 0, yPercent: 110 });
    active.current = -1;
  }, []);
  usePointer(
    root,
    dot,
    (t, el) => {
      const c = el.querySelectorAll(".u58-card");
      const er = el.getBoundingClientRect();
      const pts: [number, number][] = [centre(c[0], el, 0.5, 0.45), centre(c[1], el, 0.5, 0.88), [er.width * 0.5, er.height * 0.95], centre(c[2], el, 0.45, 0.4), centre(c[1], el, 0.55, 0.4)];
      const [x, y] = stepPath(t, pts, 1, 0.42);
      return { x: x + Math.sin(t * 2) * 9, y: y + Math.cos(t * 1.7) * 7, inside: true };
    },
    (p, el) => {
      if (active.current === -2) return;
      const idx = [...el.querySelectorAll(".u58-card")].findIndex((n) => hit(p, n, el));
      if (idx === active.current) return;
      if (active.current >= 0) swap(el, active.current, false);
      if (idx >= 0) swap(el, idx, true);
      active.current = idx;
    },
  );
  return (
    <Stage r={root} g1="rgba(255,179,107,.3)" g2="rgba(24,196,143,.2)">
      <div className="absolute inset-0 flex flex-col justify-center gap-[4%] px-[6%]">
        <div className="flex items-end justify-between">
          <h3 className="text-[clamp(38px,3.8vw,58px)] leading-none tracking-[-0.02em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
            New in <span className="italic text-[#ffb36b]">the cold fridge</span>
          </h3>
          <span className="text-[14px] text-white/55" style={{ fontFamily: F.sg }}>
            Shop all 48 →
          </span>
        </div>
        <div className="grid grid-cols-3 gap-[2.4%]">
          {U58_P.map((pr) => (
            <figure key={pr.n} className="u58-card" data-cursor="View">
              <div className="relative h-[clamp(260px,44vh,400px)] overflow-hidden rounded-[18px]">
                <div className="u58-pack absolute inset-0 grid place-items-center" style={{ background: `radial-gradient(70% 60% at 50% 45%, #fbf6ee, #e9dfcf)` }}>
                  <Product angle={pr.a} accent={pr.c} className="h-[78%] w-[78%]" />
                </div>
                <div className="u58-life absolute inset-0" style={{ transform: "translateY(100%)" }}>
                  <Img i={pr.i} w={600} h={720} />
                </div>
                <div className="u58-bar absolute inset-x-3 bottom-3 flex items-center justify-between rounded-[12px] bg-[#0a0d16]/90 px-4 py-3 backdrop-blur" style={{ transform: "translateY(110%)" }}>
                  <span className="text-[14px] font-[600]" style={{ fontFamily: F.sg }}>
                    Quick add
                  </span>
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-[#ffb36b] text-[16px] text-[#1a0d06]">+</span>
                </div>
              </div>
              <figcaption className="mt-3 flex items-baseline justify-between text-[15px]" style={{ fontFamily: F.sg }}>
                <span className="font-[600]">{pr.n}</span>
                <span className="tabular-nums text-white/70">{pr.p}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U59 · Cursor mask reveal text ───────────────────────── */
const U59Head = ({ a, b, c }: { a: string; b: string; c: string }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center px-[6%] text-center">
    <p className={`text-[13px] uppercase tracking-[0.24em] ${c}`}>Studio Ottavo · manifesto</p>
    <h3 className="u59-head mt-5 text-[clamp(60px,7.2vw,118px)] leading-[0.95] tracking-[-0.03em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
      We make
      <br />
      <span className="italic">{a}</span> {b}
    </h3>
  </div>
);
function U59() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const mask = useRef<HTMLDivElement>(null);
  const st = useRef({ x: 0, y: 0, r: { v: 0 }, key: "", init: false });
  usePointer(
    root,
    dot,
    (t, el) => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      return { x: w * (0.5 + 0.4 * Math.sin(t * 0.8)), y: h * (0.5 + 0.24 * Math.sin(t * 1.6)), inside: true };
    },
    (p, el, dt) => {
      const m = mask.current;
      const head = el.querySelector(".u59-head");
      if (!m || !head) return;
      const S = st.current;
      if (!S.init) {
        S.x = p.x;
        S.y = p.y;
        S.init = true;
      }
      const k = lerpK(0.13, dt);
      S.x += (p.x - S.x) * k;
      S.y += (p.y - S.y) * k;
      const over = hit(p, head, el);
      const key = !p.inside ? "out" : over ? "over" : "in";
      if (key !== S.key) {
        S.key = key;
        gsap.to(S.r, { v: !p.inside ? 0 : over ? 210 : 70, duration: over ? 0.7 : 0.5, ease: over ? "back.out(1.7)" : "power3.out", overwrite: true });
      }
      m.style.clipPath = `circle(${Math.max(0, S.r.v).toFixed(1)}px at ${S.x.toFixed(1)}px ${S.y.toFixed(1)}px)`;
    },
  );
  return (
    <Stage r={root} className="cursor-none" g1="rgba(217,255,91,.22)" g2="rgba(79,141,255,.22)">
      <div className="absolute inset-0">
        <U59Head a="quiet" b="things." c="text-white/55" />
      </div>
      <div ref={mask} className="absolute inset-0 bg-[#d9ff5b] text-[#0b0f05]" style={{ clipPath: "circle(0px at 50% 50%)" }} aria-hidden>
        <U59Head a="loud" b="ideas." c="text-black/60" />
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U60 · Throwable scattered items ───────────────────────── */
type DragT = typeof import("gsap/Draggable").Draggable;
let dragP: Promise<DragT> | null = null;
const loadDraggable = () =>
  (dragP ??= import("gsap/Draggable").then((m) => {
    gsap.registerPlugin(m.Draggable);
    return m.Draggable;
  }));
const U60_ITEMS: { k: "photo" | "round" | "pill" | "star"; l: string; x: number; y: number; r: number; i?: number }[] = [
  { k: "photo", l: "Jaipur, March", x: 8, y: 14, r: -7, i: 1 },
  { k: "photo", l: "Indigo vats", x: 30, y: 46, r: 5, i: 0 },
  { k: "round", l: "NEW · ₹1,299", x: 52, y: 12, r: 10 },
  { k: "photo", l: "Block no. 14", x: 64, y: 40, r: -4, i: 3 },
  { k: "pill", l: "Handmade in Jaipur", x: 14, y: 72, r: -3 },
  { k: "star", l: "★ 4.9", x: 84, y: 14, r: 8 },
  { k: "photo", l: "Dye house", x: 46, y: 60, r: -9, i: 2 },
];
function U60() {
  const root = useRef<HTMLDivElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useHideDot(root, dot);
  usePlay(
    root,
    (el, onClean) => {
      const box = area.current!;
      const items = gsap.utils.toArray<HTMLElement>(".u60-it", box);
      const d = dot.current!;
      let z = 10;
      let realAt = -1e9;
      const D = dragRef!;
      const ds = D.create(items, {
        type: "x,y",
        bounds: box,
        inertia: true,
        onPress() {
          realAt = performance.now();
          gsap.killTweensOf(this.target);
          (this.target as HTMLElement).style.zIndex = String(++z);
        },
      });
      onClean(() => ds.forEach((x) => x.kill()));
      let n = 0;
      gsap.set(d, { opacity: 1, x: box.clientWidth * 0.5, y: box.clientHeight * 0.5 });
      const throwOne = () => {
        if (performance.now() - realAt < 3000) return;
        const it = items[[0, 2, 3, 6, 1, 5, 4][n % items.length]];
        const seed = n++;
        const b = rel(it, box);
        const W = box.clientWidth;
        const H = box.clientHeight;
        const rx = 0.5 + 0.5 * Math.sin(seed * 2.17 + 0.6);
        const ry = 0.5 + 0.5 * Math.sin(seed * 3.31 + 1.4);
        const tx = 14 + rx * (W - b.w - 28);
        const ty = 14 + ry * (H - b.h - 28);
        const dx = tx - b.l;
        const dy = ty - b.t;
        const x0 = gsap.getProperty(it, "x") as number;
        const y0 = gsap.getProperty(it, "y") as number;
        const r0 = gsap.getProperty(it, "rotation") as number;
        const gx = b.l + b.w / 2;
        const gy = b.t + b.h / 2;
        const tl = gsap.timeline();
        tl.to(d, { x: gx, y: gy, duration: 0.34, ease: "power2.inOut" })
          .call(() => {
            tapDot(d);
            it.style.zIndex = String(++z);
          })
          .to(it, { scale: 1.06, duration: 0.12, ease: "power2.out" })
          // the short "drag" with the ring, then the release keeps the momentum to the landing spot
          .to([it], { x: x0 + dx * 0.22, y: y0 + dy * 0.22, rotation: r0 + (dx > 0 ? 6 : -6), duration: 0.22, ease: "power1.in" })
          .to(d, { x: gx + dx * 0.22, y: gy + dy * 0.22, duration: 0.22, ease: "power1.in" }, "<")
          .to(it, { x: x0 + dx, y: y0 + dy, rotation: r0 + (dx > 0 ? 14 : -14) * (0.5 + ry), scale: 1, duration: 0.95, ease: "expo.out" });
      };
      const loop = gsap.timeline({ repeat: -1 });
      loop.call(throwOne, [], 0).to({}, { duration: 1.05 });
      return loop;
    },
    async () => {
      await loadPlugin("InertiaPlugin");
      dragRef = await loadDraggable();
    },
  );
  return (
    <Stage r={root} g1="rgba(255,150,96,.3)" g2="rgba(79,141,255,.22)" sheen>
      <p
        className="pointer-events-none absolute inset-0 grid place-items-center text-center text-[clamp(60px,8vw,128px)] leading-[0.9] tracking-[-0.03em] text-white/[0.07]"
        style={{ fontFamily: F.sy, fontWeight: 800 }}
        aria-hidden
      >
        MOODBOARD
      </p>
      <div ref={area} className="absolute inset-[3%]">
        {U60_ITEMS.map((it) => (
          <div
            key={it.l}
            className="u60-it absolute cursor-grab select-none"
            style={{ left: `${it.x}%`, top: `${it.y}%`, transform: `rotate(${it.r}deg)`, zIndex: 1 }}
          >
            {it.k === "photo" && (
              <div className="w-[clamp(150px,13vw,200px)] rounded-[6px] bg-[#f5efe6] p-[10px] pb-[34px] shadow-[0_18px_40px_rgba(0,0,0,.45)]">
                <div className="aspect-[4/5] overflow-hidden rounded-[3px]">
                  <Img i={it.i ?? 0} w={300} h={375} />
                </div>
                <p className="mt-2 text-center text-[14px] text-[#2a2117]" style={{ fontFamily: F.is }}>
                  {it.l}
                </p>
              </div>
            )}
            {it.k === "round" && (
              <div className="grid h-[120px] w-[120px] place-items-center rounded-full bg-[#ff9660] text-center text-[14px] font-[700] leading-tight text-[#1a0d06] shadow-[0_14px_30px_rgba(0,0,0,.4)]" style={{ fontFamily: F.sg }}>
                {it.l}
              </div>
            )}
            {it.k === "pill" && (
              <div className="rounded-full bg-[#d9ff5b] px-6 py-3 text-[16px] font-[700] text-[#0b0f05] shadow-[0_14px_30px_rgba(0,0,0,.4)]" style={{ fontFamily: F.sg }}>
                {it.l}
              </div>
            )}
            {it.k === "star" && (
              <div className="rounded-[14px] bg-[#7ab8ff] px-5 py-4 text-[22px] font-[700] text-[#06142a] shadow-[0_14px_30px_rgba(0,0,0,.4)]" style={{ fontFamily: F.sg }}>
                {it.l}
              </div>
            )}
          </div>
        ))}
        <Dot r={dot} />
      </div>
    </Stage>
  );
}
let dragRef: DragT | null = null;

/* ───────────────────────── U61 · Hue-shifting border beam ───────────────────────── */
function U61() {
  const root = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(true);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Stage r={root} className={on ? "" : "u61-off"} g1="rgba(70,200,255,.3)" g2="rgba(190,110,255,.22)">
      <div className="absolute inset-0 grid grid-cols-2 items-center gap-[5%] px-[7%]">
        {/* preset 1: full border */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-full max-w-[460px] rounded-[26px] bg-[#0f1424] p-[clamp(26px,2.6vw,40px)]">
            <div className="u61-hue rounded-[26px]" aria-hidden>
              <span className="u61-ring blur" />
              <span className="u61-ring" />
            </div>
            <div className="absolute inset-0 rounded-[26px] border border-white/10" aria-hidden />
            <p className="text-[13px] uppercase tracking-[0.24em] text-white/55">Studio plan</p>
            <p className="mt-3 text-[clamp(46px,4.6vw,70px)] leading-none tracking-[-0.02em]" style={{ fontFamily: F.sg, fontWeight: 600 }}>
              ₹2,499<span className="text-[0.32em] font-[500] text-white/50"> / month</span>
            </p>
            <ul className="mt-6 space-y-2 text-[15px] text-white/70" style={{ fontFamily: F.mr }}>
              <li>Unlimited projects</li>
              <li>Five seats, one shared library</li>
              <li>Priority render queue</li>
            </ul>
            <div className="mt-7 rounded-full bg-white py-3 text-center text-[15px] font-[600] text-[#0a0d16]" style={{ fontFamily: F.sg }}>
              Start free for 14 days
            </div>
          </div>
          <span className="text-[12px] uppercase tracking-[0.22em] text-white/45">preset · full border</span>
        </div>
        {/* preset 2: bottom edge only */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-full max-w-[500px]">
            <h3 className="text-[clamp(38px,3.6vw,56px)] leading-[1] tracking-[-0.02em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
              Letters from <span className="italic text-[#7fd8ff]">the studio.</span>
            </h3>
            <div className="relative mt-8 flex items-center justify-between border-b border-white/15 pb-4">
              <span className="text-[clamp(18px,1.5vw,22px)] text-white/45" style={{ fontFamily: F.sg }}>
                you@yourstudio.in
              </span>
              <span className="rounded-full bg-white/10 px-5 py-2 text-[14px] font-[600]" style={{ fontFamily: F.sg }}>
                Subscribe →
              </span>
              <div className="u61-hue" style={{ inset: "auto 0 -1px 0", height: 2 }} aria-hidden>
                <span className="u61-line blur">
                  <span className="u61-comet" />
                </span>
                <span className="u61-line">
                  <span className="u61-comet" />
                </span>
              </div>
            </div>
            <p className="mt-4 text-[14px] text-white/50" style={{ fontFamily: F.mr }}>
              One email a month. No noise.
            </p>
          </div>
          <span className="text-[12px] uppercase tracking-[0.22em] text-white/45">preset · bottom edge</span>
        </div>
      </div>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  {
    code: "U50",
    name: "Sliding nav indicator",
    how: "The active-tab pill glides and resizes to the clicked tab (Flip, soft spring) and the content below crossfades; a fake pointer clicks through the tabs.",
    kind: "play",
    C: U50,
  },
  {
    code: "U51",
    name: "Sweep fill",
    how: "A colour fill sweeps in from one edge (left, right, top, bottom) behind the label on hover; a fake pointer walks the four buttons.",
    kind: "play",
    C: U51,
  },
  {
    code: "U52",
    name: "Blend-mode circle cursor",
    how: "A 24 px difference-blend circle trails the pointer and inverts what is under it, growing to ~90 px over links and the photo; scripted figure-eight.",
    kind: "play",
    C: U52,
  },
  {
    code: "U53",
    name: "Rotating circle-text badge",
    how: "Circle-text badge spins slowly forever; hover (or wheel) speeds it up and it eases back; the centre arrow nudges toward the pointer.",
    kind: "play",
    C: U53,
  },
  {
    code: "U54",
    name: "Floating cart flyout",
    how: "Clicking the bag pill opens a floating rounded cart (slide + scale from the pill), items stagger in, one is removed (slides out, height collapses).",
    kind: "play",
    C: U54,
  },
  {
    code: "U55",
    name: "Drop liquid button",
    how: "On hover the fill rises inside the button while a gooey drop swells from its bottom edge, stretches down and detaches; plays by itself on a loop.",
    kind: "play",
    C: U55,
  },
  {
    code: "U56",
    name: "Play button grows into a cursor",
    how: "Over the film area the cursor becomes a big round Play button that follows with lag; its label rotates in on enter, it shrinks away on leave.",
    kind: "play",
    C: U56,
  },
  {
    code: "U57",
    name: "Colour-changing reactive cursor",
    how: "The cursor dot changes colour and size with what is under it: cream on dark, ink on light, a big accent disc over buttons; scripted sweep.",
    kind: "play",
    C: U57,
  },
  {
    code: "U58",
    name: "Shop product hover swap",
    how: "Hovering a product card slides the packshot up into a lifestyle shot and raises a quick-add bar from the bottom; a fake pointer walks the cards.",
    kind: "play",
    C: U58,
  },
  {
    code: "U59",
    name: "Cursor mask reveal text",
    how: "A circle follows the pointer and reveals an alternate text layer inside it; over the headline it grows with a back-out ease; scripted figure-eight.",
    kind: "play",
    C: U59,
  },
  {
    code: "U60",
    name: "Throwable scattered items",
    how: "Photos and stickers can be dragged and thrown (Draggable + Inertia) and settle in bounds; a fake pointer grabs and throws one every second.",
    kind: "play",
    C: U60,
  },
  {
    code: "U61",
    name: "Hue-shifting border beam",
    how: "A short glowing comet runs round a card's border (or along an input's bottom edge) while its hue cycles; loops while on screen.",
    kind: "play",
    C: U61,
  },
];
