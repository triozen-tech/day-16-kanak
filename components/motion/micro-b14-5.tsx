"use client";

// Micro-interactions, batch 14 · group 5 (MOTION-MENU U136–U147). Small focused demos for /lab/motion.
// Every hover / click demo also plays by itself: a visible fake pointer (ring) walks over the targets, or a timer toggles
// the hover state. The real mouse takes over for 2.5 s whenever it moves inside the stage.
// A CSS-only glow loop never stops (and sits on top again, screen-blended) so covered stages never freeze.
// ?static=1 / reduced motion: no JS, the markup shows a sensible final state.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
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

const CSS = `
.b14g5-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.55)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.22)),transparent 70%);animation:b14g5-drift 5.4s linear infinite alternate;will-change:transform}
@keyframes b14g5-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b14g5-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;pointer-events:none;z-index:40;opacity:0;transition:opacity .25s}
.b14g5-dot>span{display:block;width:100%;height:100%;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4)}
.b14g5-dot.dk>span{border-color:#14110d;background:rgba(20,17,13,.15);box-shadow:0 0 0 6px rgba(20,17,13,.08)}
.b14g5-dot.tap>span{animation:b14g5-tap .32s ease-out}
@keyframes b14g5-tap{40%{transform:scale(.55);background:rgba(255,255,255,.6)}100%{transform:scale(1)}}

/* U136 border fade */
.u136-c{box-shadow:inset 0 0 0 1px rgba(255,255,255,.1);transition:box-shadow .5s ease,background-color .5s ease}
.u136-c.on{box-shadow:inset 0 0 0 3px #7af0c8;background-color:rgba(122,240,200,.06)}
.u136-c .u136-p{transition:color .5s}
.u136-c.on .u136-p{color:#7af0c8}

/* U137 ripple out / in */
.u137-b{position:relative;transition:background-color .4s,color .4s}
.u137-b::before,.u137-b::after{content:"";position:absolute;inset:0;border-radius:inherit;border:2px solid #ffb38a;opacity:0;pointer-events:none}
.u137-b.on{background:#ffb38a;color:#1a0d05}
.u137-out.on::before{animation:u137-out .9s cubic-bezier(.2,.6,.3,1)}
.u137-out.on::after{animation:u137-out .9s .14s cubic-bezier(.2,.6,.3,1) both}
@keyframes u137-out{0%{inset:0;opacity:1}100%{inset:-30px;opacity:0}}
.u137-in.on::before{animation:u137-in .9s cubic-bezier(.2,.6,.3,1)}
.u137-in.on::after{animation:u137-in .9s .14s cubic-bezier(.2,.6,.3,1) both}
@keyframes u137-in{0%{inset:-30px;opacity:0}35%{opacity:1}100%{inset:0;opacity:0}}

/* U138 shadow */
.u138-t{transition:box-shadow .45s ${EZ},transform .45s ${EZ};box-shadow:0 0 0 rgba(60,40,20,0)}
.u138-t.on[data-d="all"]{box-shadow:0 0 44px 4px rgba(60,40,20,.38);transform:scale(1.04)}
.u138-t.on[data-d="top"]{box-shadow:0 -22px 26px -8px rgba(60,40,20,.42);transform:translateY(8px)}
.u138-t.on[data-d="right"]{box-shadow:22px 0 26px -8px rgba(60,40,20,.42);transform:translateX(-8px)}
.u138-t.on[data-d="bottom"]{box-shadow:0 24px 28px -8px rgba(60,40,20,.42);transform:translateY(-8px)}
.u138-t.on[data-d="left"]{box-shadow:-22px 0 26px -8px rgba(60,40,20,.42);transform:translateX(8px)}

/* U139 input trace */
.u139-f{position:relative}
.u139-s{position:absolute;background:#c9a7ff;transition:transform .2s linear}
.u139-b{left:0;bottom:0;width:100%;height:2px;transform:scaleX(0);transform-origin:0 50%;transition-delay:.6s}
.u139-r{right:0;bottom:0;width:2px;height:100%;transform:scaleY(0);transform-origin:50% 100%;transition-delay:.4s}
.u139-t{right:0;top:0;width:100%;height:2px;transform:scaleX(0);transform-origin:100% 50%;transition-delay:.2s}
.u139-l{left:0;top:0;width:2px;height:100%;transform:scaleY(0);transform-origin:50% 0;transition-delay:0s}
.u139-f.on .u139-s{transform:none}
.u139-f.on .u139-b{transition-delay:0s}
.u139-f.on .u139-r{transition-delay:.2s}
.u139-f.on .u139-t{transition-delay:.4s}
.u139-f.on .u139-l{transition-delay:.6s}
.u139-lab{transition:color .4s}
.u139-f.on .u139-lab{color:#c9a7ff}
.u139-go{transition:transform .25s,background-color .3s}
.u139-go.on{transform:scale(.96);background:#c9a7ff}

/* U141 flip marquee */
.u141-row{display:flex;width:max-content;gap:18px;animation:u141-x 34s linear infinite}
.u141-row.rev{animation-direction:reverse}
@keyframes u141-x{to{transform:translate3d(-50%,0,0)}}
.u141-t{width:230px;height:118px;perspective:800px;flex:none}
.u141-in{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .7s ${EZ}}
.u141-t.on .u141-in,.u141-t:hover .u141-in{transform:rotateY(180deg)}
.u141-face{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:18px;backface-visibility:hidden;-webkit-backface-visibility:hidden}
.u141-k{transform:rotateY(180deg)}

/* U142 rising dots */
.u142-b{transition:box-shadow .45s,transform .45s ${EZ}}
.u142-b.on{box-shadow:0 18px 50px rgba(255,196,92,.35);transform:translateY(-2px)}
.u142-ar{display:inline-block;transition:transform .45s ${EZ}}
.u142-b.on .u142-ar{transform:translateX(10px)}
.u142-d{position:absolute;border-radius:50%;pointer-events:none;opacity:0}

/* U143 click ripple */
.u143-hl{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .35s;background:radial-gradient(220px circle at var(--x,50%) var(--y,50%),rgba(20,14,6,.2),transparent 70%)}
.u143-b.on .u143-hl{opacity:1}
.u143-rp{position:absolute;border-radius:50%;pointer-events:none;background:radial-gradient(circle,rgba(20,14,6,.32),rgba(20,14,6,.12) 60%,transparent 72%)}

/* U145 wave link */
.u145-l{transition:color .4s}
.u145-l.on{color:#fff}
.u145-ar{display:inline-block;opacity:.35;transition:transform .45s ${EZ},opacity .4s}
.u145-l.on .u145-ar{opacity:1;transform:translateX(10px)}

/* U147 branched menu */
.u147-i{transition:color .4s,opacity .4s;opacity:.4}
.u147-i.on{opacity:1;color:#fff}
.u147-n{transition:color .4s}
.u147-i.on .u147-n{color:#6ee7ff}
.u147-pv{transition:opacity .5s}

html.is-static .b14g5-glow,html.is-static .u141-row{animation:none}
html.is-static {
  .b14g5-glow,.u141-row{animation:none}
  .u136-c,.u137-b,.u138-t,.u139-s,.u141-in,.u142-b,.u142-ar,.u143-hl,.u145-ar,.u147-i,.u147-pv{transition:none}
  .u137-b::before,.u137-b::after{animation:none!important}
}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop, again on top (screen blend) so covered stages never freeze. */
function Stage({ r, children, g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; g1?: string; g2?: string }) {
  return (
    <div ref={r} className="relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0d16] text-[#eef2ff]">
      <style href="b14g5-css" precedence="default">
        {CSS}
      </style>
      <div className="b14g5-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
      <div className="b14g5-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.42, zIndex: 35 } as CSSProperties} aria-hidden />
    </div>
  );
}

/** The visible fake pointer (a ring). */
const Dot = ({ r, dark = false }: { r: RefObject<HTMLDivElement | null>; dark?: boolean }) => (
  <div ref={r} className={`b14g5-dot ${dark ? "dk" : ""}`} aria-hidden>
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
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Pointer driver: the real mouse wins for 2.5 s after it last moved; otherwise `script` moves a visible fake ring. */
function usePointer(
  root: RefObject<HTMLDivElement | null>,
  dot: RefObject<HTMLDivElement | null>,
  script: (t: number, el: HTMLDivElement) => Pt,
  frame: (p: Pt, el: HTMLDivElement, fake: boolean, t: number, dt: number) => void,
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
    const dn = dot.current;
    if (dn) {
      dn.style.transform = `translate3d(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px,0)`;
      dn.style.opacity = useReal ? "0" : "1";
    }
    fr.current(p, el, !useReal, t - t0.current, dt);
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
    at?: (b: Box, i: number, k: number) => [number, number];
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
      const pts: [number, number][] = o.order.map((i, k) => {
        if (i < 0 || !tg[i]) return o.off ? o.off(w, h) : [w * 0.5, h * 0.92];
        const b = rel(tg[i], el);
        return o.at ? o.at(b, i, k) : mid(b);
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

/** "play" helper: waits for fonts, builds a looping animation in a gsap.context, plays it only while on screen. */
function usePlay(ref: RefObject<HTMLElement | null>, build: (root: HTMLElement) => gsap.core.Animation | void) {
  const b = useRef(build);
  b.current = build;
  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    let dead = false;
    let on = false;
    let anim: gsap.core.Animation | void;
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
        anim = b.current(root);
      });
      sync();
    });
    return () => {
      dead = true;
      io.disconnect();
      ctx.revert();
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
  gsap.to(dot, { x, y, duration: dur, ease: "power2.inOut", overwrite: "auto" });
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

const noop = (e: { preventDefault: () => void }) => e.preventDefault();

/* ───────────────────────── U136 · Border fade ───────────────────────── */
const U136_TIERS = [
  { n: "Studio", p: "₹1,900", d: "Two classes a week, mat included" },
  { n: "Atelier", p: "₹3,400", d: "Unlimited classes and guest passes" },
  { n: "Residency", p: "₹6,800", d: "Private sessions with a coach" },
];
function U136() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useWalk(root, dot, { sel: ".u136-c", order: [0, 1, 2, -1], off: (w, h) => [w * 0.5, h * 0.9] });
  return (
    <Stage r={root} g1="rgba(122,240,200,.5)" g2="rgba(79,141,255,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[5vh] px-[6%]" style={{ fontFamily: F.sg }}>
        <div className="text-center">
          <Eyebrow>Memberships · Bandra studio</Eyebrow>
          <h3 className="mt-4 text-[clamp(44px,4.6vw,76px)] leading-none tracking-[-0.03em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
            Choose your rhythm
          </h3>
        </div>
        <div className="grid w-[min(94%,1100px)] grid-cols-3 gap-6">
          {U136_TIERS.map((t, i) => (
            <a key={t.n} href="#" onClick={noop} className={`u136-c flex flex-col gap-4 rounded-[22px] bg-white/[0.03] p-9 ${i === 1 ? "on" : ""}`}>
              <span className="text-[14px] uppercase tracking-[0.2em] text-white/55">{t.n}</span>
              <span className="u136-p text-[clamp(40px,3.6vw,58px)] font-[600] leading-none tracking-[-0.03em]">
                {t.p}
                <span className="ml-1 text-[16px] font-[400] text-white/50">/mo</span>
              </span>
              <span className="text-[16px] leading-snug text-white/65">{t.d}</span>
            </a>
          ))}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U137 · Ripple out / in ───────────────────────── */
function U137() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useWalk(root, dot, { sel: ".u137-b", order: [0, -1, 1, -1], seg: 0.85, move: 0.5, off: (w, h) => [w * 0.5, h * 0.52] });
  return (
    <Stage r={root} g1="rgba(255,179,138,.5)" g2="rgba(160,120,255,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[7vh] px-[6%]" style={{ fontFamily: F.sg }}>
        <h3 className="text-center text-[clamp(44px,4.8vw,80px)] leading-none tracking-[-0.03em]" style={{ fontFamily: F.is }}>
          Slow coffee, poured daily
        </h3>
        <div className="flex items-center gap-[10vw]">
          {[
            { c: "u137-out", t: "Order ahead", s: "Ripple out" },
            { c: "u137-in", t: "Find a café", s: "Ripple in" },
          ].map((b) => (
            <div key={b.c} className="flex flex-col items-center gap-5">
              <a href="#" onClick={noop} className={`u137-b ${b.c} rounded-full border border-[#ffb38a]/70 px-12 py-6 text-[clamp(20px,1.7vw,26px)] font-[600] tracking-[-0.01em]`}>
                {b.t}
              </a>
              <Eyebrow>{b.s}</Eyebrow>
            </div>
          ))}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U138 · Shadow ───────────────────────── */
const U138_D = [
  { d: "all", n: "All sides" },
  { d: "top", n: "Top" },
  { d: "right", n: "Right" },
  { d: "bottom", n: "Bottom" },
  { d: "left", n: "Left" },
];
function U138() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useWalk(root, dot, { sel: ".u138-t", order: [0, 1, 2, 3, 4], seg: 0.9, off: (w, h) => [w * 0.5, h * 0.9] });
  return (
    <Stage r={root} g1="rgba(255,214,150,.55)" g2="rgba(255,140,100,.22)">
      <div className="absolute inset-[6%] flex flex-col items-center justify-center gap-[6vh] rounded-[24px] bg-[#efe8dc] text-[#1d1710]" style={{ fontFamily: F.mr }}>
        <div className="text-center">
          <p className="text-[13px] uppercase tracking-[0.22em] text-[#1d1710]/55">Hand-thrown ceramics</p>
          <h3 className="mt-3 text-[clamp(40px,4.2vw,68px)] leading-none tracking-[-0.03em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
            Lifted toward the light
          </h3>
        </div>
        <div className="flex gap-7">
          {U138_D.map((t, i) => (
            <div key={t.d} data-d={t.d} className={`u138-t flex h-[180px] w-[min(15vw,190px)] flex-col justify-between rounded-[18px] bg-white p-5 ${i === 3 ? "on" : ""}`}>
              <span className="text-[13px] uppercase tracking-[0.18em] text-[#1d1710]/50">Shadow</span>
              <span className="text-[22px] font-[700] tracking-[-0.02em]">{t.n}</span>
            </div>
          ))}
        </div>
      </div>
      <Dot r={dot} dark />
    </Stage>
  );
}

/* ───────────────────────── U139 · Input border trace ───────────────────────── */
const U139_F = [
  { l: "Full name", v: "Aarav Mehra" },
  { l: "Email", v: "aarav@mailbox.test" },
];
function U139() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const idle = useIdle(root);
  const setOn = (el: HTMLElement, i: number) => el.querySelectorAll(".u139-f").forEach((f, k) => f.classList.toggle("on", k === i));
  usePlay(root, (el) => {
    const fields = [...el.querySelectorAll<HTMLElement>(".u139-f")];
    const inputs = fields.map((f) => f.querySelector("input") as HTMLInputElement);
    const go = el.querySelector<HTMLElement>(".u139-go");
    const tl = gsap.timeline({ repeat: -1, paused: true });
    const type = (i: number, at: number) => {
      const o = { n: 0 };
      tl.call(() => void (o.n = 0), [], at);
      tl.call(() => {
        const b = rel(fields[i], el);
        goDot(dot.current, el, [b.l + b.w * 0.72, b.t + b.h * 0.62], 0.75, idle());
      }, [], at);
      tl.to(o, { n: U139_F[i].v.length, duration: 0.75, ease: "none", onUpdate: () => void (idle() && (inputs[i].value = U139_F[i].v.slice(0, Math.round(o.n)))) }, at);
    };
    tl.call(() => goDot(dot.current, el, fields[0], 0.45, idle()), [], 0)
      .call(() => void (idle() && (tapDot(dot.current), setOn(el, 0))), [], 0.48);
    type(0, 0.6);
    tl.call(() => goDot(dot.current, el, fields[1], 0.45, idle()), [], 1.4)
      .call(() => void (idle() && (tapDot(dot.current), setOn(el, 1))), [], 1.88);
    type(1, 2.0);
    tl.call(() => goDot(dot.current, el, go, 0.45, idle()), [], 2.8)
      .call(
        () => {
          if (!idle()) return;
          tapDot(dot.current);
          setOn(el, -1);
          go?.classList.add("on");
        },
        [],
        3.28,
      )
      .call(
        () => {
          go?.classList.remove("on");
          if (idle()) inputs.forEach((n) => (n.value = ""));
        },
        [],
        3.7,
      )
      .call(() => goDot(dot.current, el, [el.clientWidth * 0.62, el.clientHeight * 0.3], 0.4, idle()), [], 3.7)
      .to({}, { duration: 0.05 }, 4.1);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(201,167,255,.5)" g2="rgba(110,231,255,.22)">
      <div className="absolute inset-0 flex items-center justify-center gap-[6vw] px-[7%]" style={{ fontFamily: F.sg }}>
        <div className="w-[min(36%,440px)]">
          <Eyebrow>Private preview · Delhi</Eyebrow>
          <h3 className="mt-4 text-[clamp(44px,4.4vw,72px)] leading-[0.98] tracking-[-0.03em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
            Save a seat at the table
          </h3>
        </div>
        <form className="flex w-[min(44%,520px)] flex-col gap-6" onSubmit={noop}>
          {U139_F.map((f, i) => (
            <label key={f.l} className={`u139-f block rounded-[6px] bg-white/[0.04] px-6 pb-4 pt-3 ${i === 0 ? "on" : ""}`}>
              <span className="u139-lab block text-[13px] uppercase tracking-[0.2em] text-white/50">{f.l}</span>
              <input
                className="mt-1 w-full bg-transparent text-[22px] text-white outline-none placeholder:text-white/30"
                placeholder={i === 0 ? "Your name" : "you@domain"}
                defaultValue={i === 0 ? f.v : ""}
                onFocus={() => root.current && setOn(root.current, i)}
                onBlur={(e) => e.currentTarget.parentElement?.classList.remove("on")}
              />
              <span className="u139-s u139-b" />
              <span className="u139-s u139-r" />
              <span className="u139-s u139-t" />
              <span className="u139-s u139-l" />
            </label>
          ))}
          <button type="submit" className="u139-go self-start rounded-full bg-white px-9 py-4 text-[18px] font-[600] text-[#0d0a16]">
            Request invite
          </button>
        </form>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U140 · Slide back in depth ───────────────────────── */
const U140_D = [
  { n: "Back · centre", x: 0, y: 0, z: -400 },
  { n: "Back · top left", x: -240, y: -110, z: -400 },
  { n: "Forward", x: 0, y: 0, z: 200 },
  { n: "Back · bottom right", x: 240, y: 110, z: -400 },
];
function U140() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const card = el.querySelector<HTMLElement>(".u140-card");
    const chips = [...el.querySelectorAll<HTMLElement>(".u140-chip")];
    const mark = (k: number) =>
      chips.forEach((c, i) => {
        c.style.background = i === k ? "#ffd27a" : "transparent";
        c.style.color = i === k ? "#171003" : "";
      });
    const tl = gsap.timeline({ repeat: -1, paused: true });
    U140_D.forEach((d, k) => {
      tl.call(() => mark(k));
      tl.to(card, { x: d.x, y: d.y, z: d.z, duration: 0.7, ease: "power2.inOut" });
      tl.to(card, { x: 0, y: 0, z: 0, duration: 0.6, ease: "power2.inOut" }, "+=0.12");
    });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,210,122,.5)" g2="rgba(120,140,255,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[3vh]" style={{ fontFamily: F.sg }}>
        <div className="relative flex h-[62%] w-full items-center justify-center" style={{ perspective: "1000px" }}>
          <div className="absolute h-full w-[min(26%,320px)] rounded-[22px] border border-dashed border-white/20" aria-hidden />
          <div className="u140-card relative flex h-full w-[min(26%,320px)] flex-col overflow-hidden rounded-[22px] border border-white/12 bg-[#11151f] shadow-[0_30px_80px_rgba(0,0,0,.5)]">
            <div className="min-h-0 flex-1">
              <Img i={14} w={520} h={560} />
            </div>
            <div className="flex items-baseline justify-between px-5 py-4">
              <div>
                <p className="text-[18px] font-[600]">Dune Lounge Chair</p>
                <p className="text-[12px] uppercase tracking-[0.18em] text-white/50">Teak · Cane</p>
              </div>
              <p className="text-[17px] text-white/85">₹42,000</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          {U140_D.map((d, i) => (
            <span key={d.n} className="u140-chip rounded-full border border-white/20 px-5 py-2 text-[14px] font-[600]" style={i === 0 ? { background: "#ffd27a", color: "#171003" } : undefined}>
              {d.n}
            </span>
          ))}
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── U141 · Flip-card logo marquee ───────────────────────── */
const U141_L = [
  { n: "Kestrel & Vale", f: F.fr, b: "Outerwear", c: "#ffb38a" },
  { n: "OAKLUME", f: F.sy, b: "Lighting", c: "#7af0c8" },
  { n: "saffra", f: F.is, b: "Spice house", c: "#ffd27a" },
  { n: "Torvik", f: F.sg, b: "Cycles", c: "#9fc2ff" },
  { n: "Melo Studio", f: F.mr, b: "Ceramics", c: "#f2a7ff" },
  { n: "BRIGHTFOLD", f: F.sy, b: "Paper goods", c: "#ffe28a" },
  { n: "Halcyra", f: F.fr, b: "Skincare", c: "#a7ffd8" },
  { n: "Juniper Row", f: F.is, b: "Stays", c: "#ffc2a7" },
];
function U141() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const tiles = [...el.querySelectorAll<HTMLElement>(".u141-t")];
    const live = new Map<HTMLElement, number>();
    let t = 0;
    const tl = gsap.timeline({ repeat: -1, paused: true });
    tl.call(() => {
      t += 0.3;
      live.forEach((at, n) => {
        if (t - at > 1.2) {
          n.classList.remove("on");
          live.delete(n);
        }
      });
      const W = el.clientWidth;
      const vis = tiles.filter((n) => {
        const b = rel(n, el);
        return !live.has(n) && b.l > 20 && b.l + b.w < W - 20;
      });
      for (let k = 0; k < 2 && vis.length; k++) {
        const n = vis.splice(Math.floor(Math.random() * vis.length), 1)[0];
        n.classList.add("on");
        live.set(n, t);
      }
    }).to({}, { duration: 0.3 });
    return tl;
  });
  const row = (rev: boolean) => (
    <div className={`u141-row ${rev ? "rev" : ""}`}>
      {[0, 1].map((copy) =>
        (rev ? [...U141_L].reverse() : U141_L).map((l, i) => (
          <div key={`${copy}-${l.n}`} className={`u141-t ${copy === 0 && i === 2 ? "on" : ""}`} aria-hidden={copy === 1 || undefined}>
            <div className="u141-in">
              <div className="u141-face border border-white/10 bg-white/[0.04]">
                <span className="text-[28px] leading-none tracking-[-0.01em]" style={{ fontFamily: l.f, fontWeight: l.f === F.sy ? 800 : 500 }}>
                  {l.n}
                </span>
              </div>
              <div className="u141-face u141-k text-[#120c06]" style={{ background: l.c }}>
                <span className="text-[13px] uppercase tracking-[0.22em] opacity-70">{l.b}</span>
                <span className="mt-1 text-[24px] font-[700] tracking-[-0.02em]" style={{ fontFamily: F.sg }}>
                  Since 20{12 + i}
                </span>
              </div>
            </div>
          </div>
        )),
      )}
    </div>
  );
  return (
    <Stage r={root} g1="rgba(159,194,255,.5)" g2="rgba(255,179,138,.22)">
      <div className="absolute inset-0 flex flex-col justify-center gap-[5vh]" style={{ fontFamily: F.sg }}>
        <div className="text-center">
          <Eyebrow>Trusted by independent makers</Eyebrow>
          <h3 className="mt-4 text-[clamp(40px,4.2vw,68px)] leading-none tracking-[-0.03em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
            In good company
          </h3>
        </div>
        <div className="flex flex-col gap-[18px] overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
          {row(false)}
          {row(true)}
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── U142 · Rising dot particles CTA ───────────────────────── */
const U142_C = ["#ffc45c", "#fff1cf", "#ff9f6b"];
function U142() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLAnchorElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const acc = useRef(0);
  usePointer(
    root,
    dot,
    (t, el) => {
      const b = btn.current ? rel(btn.current, el) : { l: 0, t: 0, w: 0, h: 0 };
      const cy = b.t + b.h / 2;
      const pts: [number, number][] = [
        [b.l + b.w * 0.3, cy],
        [b.l + b.w * 0.72, cy + 4],
        [el.clientWidth * 0.5, Math.min(el.clientHeight - 30, b.t + b.h + 120)],
      ];
      const [x, y] = stepPath(t, pts, 0.95, 0.48);
      return { x: x + Math.sin(t * 2.3) * 7, y: y + Math.cos(t * 1.9) * 5, inside: true };
    },
    (p, el, _f, _t, dt) => {
      const b = btn.current;
      const L = layer.current;
      if (!b || !L) return;
      const bx = rel(b, el);
      const on = p.inside && inBox(bx, p.x, p.y);
      b.classList.toggle("on", on);
      if (!on) return;
      acc.current += dt;
      while (acc.current > 0.045) {
        acc.current -= 0.045;
        if (L.childElementCount > 70) break;
        const d = document.createElement("span");
        const s = 3 + Math.random() * 5;
        d.className = "u142-d";
        d.style.cssText = `width:${s}px;height:${s}px;left:${8 + Math.random() * 84}%;top:${30 + Math.random() * 30}%;background:${U142_C[Math.floor(Math.random() * 3)]}`;
        L.appendChild(d);
        gsap.to(d, {
          keyframes: { "0%": { opacity: 0, y: 0, x: 0 }, "15%": { opacity: 1 }, "100%": { opacity: 0, y: -(110 + Math.random() * 140), x: (Math.random() - 0.5) * 50 } },
          duration: 1.2 + Math.random() * 0.6,
          ease: "power1.out",
          onComplete: () => d.remove(),
        });
      }
    },
  );
  useEffect(() => {
    const L = layer.current;
    return () => {
      if (L) L.replaceChildren();
    };
  }, []);
  return (
    <Stage r={root} g1="rgba(255,196,92,.5)" g2="rgba(255,110,140,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[7vh] px-[6%]" style={{ fontFamily: F.sg }}>
        <div className="text-center">
          <Eyebrow>Batch 07 · small-lot honey</Eyebrow>
          <h3 className="mt-4 text-[clamp(44px,4.8vw,80px)] leading-none tracking-[-0.03em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
            Only 400 jars this season
          </h3>
        </div>
        <div className="relative">
          <div ref={layer} className="pointer-events-none absolute inset-0" aria-hidden />
          <a
            ref={btn}
            href="#"
            onClick={noop}
            className="u142-b relative flex items-center gap-4 rounded-full bg-gradient-to-b from-[#ffcf73] to-[#f2a93b] px-14 py-7 text-[clamp(20px,1.8vw,28px)] font-[700] tracking-[-0.01em] text-[#1d1203]"
          >
            Join the waitlist <span className="u142-ar">→</span>
          </a>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U143 · Click-point ripple button ───────────────────────── */
function burst(b: HTMLElement, x: number, y: number) {
  const r = Math.hypot(Math.max(x, b.clientWidth - x), Math.max(y, b.clientHeight - y)) * 2;
  const s = document.createElement("span");
  s.className = "u143-rp";
  s.style.cssText = `width:${r}px;height:${r}px;left:${x - r / 2}px;top:${y - r / 2}px`;
  b.appendChild(s);
  gsap.fromTo(s, { scale: 0, opacity: 1 }, { scale: 1, opacity: 0, duration: 0.85, ease: "power2.out", onComplete: () => s.remove() });
  gsap.fromTo(b, { scale: 0.97 }, { scale: 1, duration: 0.45, ease: "power3.out", overwrite: "auto" });
}
function U143() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const last = useRef(-1);
  usePointer(
    root,
    dot,
    (t, el) => {
      const b = btn.current ? rel(btn.current, el) : { l: 0, t: 0, w: 0, h: 0 };
      const [cx, cy] = mid(b);
      return { x: cx + Math.sin(t * 1.05) * b.w * 0.4, y: cy + Math.sin(t * 2.1) * b.h * 0.32, inside: true };
    },
    (p, el, fake, t) => {
      const b = btn.current;
      if (!b) return;
      const bx = rel(b, el);
      const on = p.inside && inBox(bx, p.x, p.y);
      b.classList.toggle("on", on);
      const lx = p.x - bx.l;
      const ly = p.y - bx.t;
      b.style.setProperty("--x", `${lx.toFixed(0)}px`);
      b.style.setProperty("--y", `${ly.toFixed(0)}px`);
      const k = Math.floor(t / 0.9);
      if (fake && on && k !== last.current) {
        last.current = k;
        tapDot(dot.current);
        burst(b, lx, ly);
      }
    },
  );
  return (
    <Stage r={root} g1="rgba(255,226,170,.5)" g2="rgba(110,180,255,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[7vh] px-[6%]" style={{ fontFamily: F.sg }}>
        <div className="text-center">
          <Eyebrow>Tasting menu · eight courses</Eyebrow>
          <h3 className="mt-4 text-[clamp(44px,4.8vw,80px)] leading-none tracking-[-0.03em]" style={{ fontFamily: F.is }}>
            Dinner by the river
          </h3>
        </div>
        <button
          ref={btn}
          type="button"
          onPointerDown={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            burst(e.currentTarget, e.clientX - r.left, e.clientY - r.top);
          }}
          className="u143-b relative flex w-[min(52%,640px)] items-center justify-between overflow-hidden rounded-[26px] bg-[#f3ead9] px-12 py-10 text-left text-[#1a140a]"
        >
          <span className="u143-hl" aria-hidden />
          <span className="relative">
            <span className="block text-[clamp(28px,2.6vw,40px)] font-[700] leading-none tracking-[-0.02em]">Reserve a table</span>
            <span className="mt-3 block text-[15px] text-[#1a140a]/60">Thursday to Sunday · ₹6,500 per guest</span>
          </span>
          <span className="relative grid h-16 w-16 place-items-center rounded-full bg-[#1a140a] text-[26px] text-[#f3ead9]">→</span>
        </button>
      </div>
      <Dot r={dot} dark />
    </Stage>
  );
}

/* ───────────────────────── U144 · 3D tilting tooltip ───────────────────────── */
const U144_P = [
  { i: "AR", n: "Anaya Rao", r: "Head chef", c: "linear-gradient(135deg,#ffb38a,#ff6f61)" },
  { i: "KD", n: "Kabir Dutt", r: "Sommelier", c: "linear-gradient(135deg,#9fc2ff,#5b6cff)" },
  { i: "MS", n: "Mira Sen", r: "Pastry lead", c: "linear-gradient(135deg,#f2a7ff,#a45cff)" },
  { i: "VN", n: "Vir Nair", r: "Host", c: "linear-gradient(135deg,#7af0c8,#1fa3a3)" },
  { i: "TI", n: "Tara Iyer", r: "Forager", c: "linear-gradient(135deg,#ffe28a,#f29a3b)" },
];
function U144() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const cur = useRef(-2);
  const prev = useRef({ x: 0, vx: 0 });
  const qt = useRef(new Map<Element, [gsap.QuickToFunc, gsap.QuickToFunc]>());
  usePointer(
    root,
    dot,
    (t, el) => {
      const row = el.querySelector(".u144-row");
      const b = row ? rel(row, el) : { l: 0, t: 0, w: 0, h: 0 };
      const [cx, cy] = mid(b);
      return { x: cx + Math.sin(t * 0.8) * b.w * 0.5, y: cy + Math.sin(t * 2.2) * 14, inside: true };
    },
    (p, el, _f, _t, dt) => {
      const av = [...el.querySelectorAll<HTMLElement>(".u144-a")];
      const tips = [...el.querySelectorAll<HTMLElement>(".u144-tip")];
      let idx = -1;
      if (p.inside) for (let i = av.length - 1; i >= 0; i--) if (inBox(rel(av[i], el), p.x, p.y)) { idx = i; break; }
      const vx = dt > 0 ? (p.x - prev.current.x) / dt : 0;
      prev.current.vx += (vx - prev.current.vx) * 0.15;
      prev.current.x = p.x;
      if (idx !== cur.current) {
        tips.forEach((tp, i) =>
          i === idx
            ? gsap.to(tp, { opacity: 1, scale: 1, y: 0, duration: 0.55, ease: "back.out(2.4)", overwrite: "auto" })
            : gsap.to(tp, { opacity: 0, scale: 0.6, y: 14, duration: 0.2, ease: "power2.in", overwrite: "auto" }),
        );
        cur.current = idx;
      }
      if (idx >= 0) {
        const b = rel(av[idx], el);
        const dx = clamp((p.x - (b.l + b.w / 2)) / (b.w / 2), -1, 1);
        const tp = tips[idx];
        let q = qt.current.get(tp);
        if (!q) {
          gsap.set(tp, { transformPerspective: 600 });
          q = [gsap.quickTo(tp, "rotationY", { duration: 0.35, ease: "power2.out" }), gsap.quickTo(tp, "rotation", { duration: 0.35, ease: "power2.out" })];
          qt.current.set(tp, q);
        }
        q[0](dx * 28);
        q[1](clamp(prev.current.vx / 60, -14, 14));
      }
    },
  );
  return (
    <Stage r={root} g1="rgba(160,140,255,.5)" g2="rgba(255,150,120,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[12vh] px-[6%]" style={{ fontFamily: F.sg }}>
        <div className="text-center">
          <Eyebrow>The kitchen team</Eyebrow>
          <h3 className="mt-4 text-[clamp(44px,4.6vw,76px)] leading-none tracking-[-0.03em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
            Hands behind every plate
          </h3>
        </div>
        <div className="u144-row flex items-center">
          {U144_P.map((m, i) => (
            <div key={m.i} className={`relative ${i ? "-ml-5" : ""}`} style={{ zIndex: 10 - i }}>
              <div className="pointer-events-none absolute bottom-[calc(100%+16px)] left-[-60px] right-[-60px] flex justify-center">
                <div
                  className="u144-tip rounded-[14px] border border-white/15 bg-[#151a28] px-5 py-3 text-center shadow-[0_18px_40px_rgba(0,0,0,.45)]"
                  style={{ opacity: i === 2 ? 1 : 0, transformOrigin: "50% 100%", transform: i === 2 ? "none" : "translateY(14px) scale(.6)" }}
                >
                  <p className="whitespace-nowrap text-[18px] font-[600]">{m.n}</p>
                  <p className="whitespace-nowrap text-[13px] uppercase tracking-[0.18em] text-white/55">{m.r}</p>
                </div>
              </div>
              <div className="u144-a grid h-[124px] w-[124px] place-items-center rounded-full border-[4px] border-[#0a0d16] text-[30px] font-[700] text-[#0a0d16]" style={{ background: m.c }}>
                {m.i}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U145 · Wave underline link ───────────────────────── */
const U145_L = ["Shop the collection", "Read the journal", "Visit the studio"];
function U145() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const st = useRef(U145_L.map(() => ({ a: 0, ph: 0 })));
  useWalk(root, dot, {
    sel: ".u145-l",
    order: [0, 1, 2, -1],
    seg: 0.95,
    at: (b) => [b.l + b.w * 0.55, b.t + b.h / 2],
    off: (w, h) => [w * 0.78, h * 0.86],
  });
  useTicker(root, (_t, dt) => {
    const el = root.current;
    if (!el) return;
    el.querySelectorAll<HTMLElement>(".u145-l").forEach((l, i) => {
      const s = st.current[i];
      const on = l.classList.contains("on");
      s.a += ((on ? 1 : 0) - s.a) * Math.min(1, dt * (on ? 7 : 4));
      s.ph += dt * 9;
      const path = l.querySelector("path");
      if (!path) return;
      const W = Math.max(1, l.clientWidth);
      const k = (Math.PI * 2) / 38;
      let d = "";
      for (let x = 0; x <= W; x += 4) {
        const y = 8 + Math.sin(x * k - s.ph) * 5 * s.a;
        d += `${x ? "L" : "M"}${x},${y.toFixed(2)}`;
      }
      const svg = path.ownerSVGElement;
      if (svg && svg.getAttribute("viewBox") !== `0 0 ${W} 16`) svg.setAttribute("viewBox", `0 0 ${W} 16`);
      path.setAttribute("d", d);
    });
  });
  return (
    <Stage r={root} g1="rgba(110,231,255,.5)" g2="rgba(255,140,200,.22)">
      <div className="absolute inset-0 flex items-center justify-center gap-[7vw] px-[7%]">
        <div className="w-[min(30%,380px)]">
          <Eyebrow>Linen &amp; clay · Jaipur</Eyebrow>
          <p className="mt-5 text-[18px] leading-relaxed text-white/60" style={{ fontFamily: F.mr }}>
            Natural fibres, slow dyes and pieces made to be used every day.
          </p>
        </div>
        <nav className="flex flex-col items-start gap-[4.5vh]">
          {U145_L.map((t) => (
            <a key={t} href="#" onClick={noop} className="u145-l relative block pb-5 text-[clamp(40px,4.2vw,68px)] leading-none tracking-[-0.03em] text-white/60" style={{ fontFamily: F.fr }}>
              {t} <span className="u145-ar text-[0.6em]">→</span>
              <svg className="absolute bottom-0 left-0 h-4 w-full overflow-visible" viewBox="0 0 100 16" preserveAspectRatio="none" aria-hidden>
                <path d="M0,8 L100,8" fill="none" stroke="#6ee7ff" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </a>
          ))}
        </nav>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U146 · Velocity bobble tiles ───────────────────────── */
const U146_T = ["Linen", "Ceramics", "Brass", "Cane", "Wool", "Glass", "Teak", "Clay", "Jute", "Marble", "Silk", "Stone", "Copper", "Cotton", "Oak", "Rattan", "Terrazzo", "Hemp"];
const U146_C = ["#ffb38a", "#9fc2ff", "#7af0c8", "#ffe28a", "#f2a7ff", "#a7ffd8"];
function U146() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const cur = useRef(-2);
  const pv = useRef({ x: 0, y: 0, v: 0 });
  usePointer(
    root,
    dot,
    (t, el) => {
      const g = el.querySelector(".u146-g");
      const b = g ? rel(g, el) : { l: 0, t: 0, w: 0, h: 0 };
      const [cx, cy] = mid(b);
      const u = t * 0.85 + 0.75 * Math.sin(t * 0.9);
      return { x: cx + Math.sin(u) * b.w * 0.44, y: cy + Math.sin(u * 2) * b.h * 0.38, inside: true };
    },
    (p, el, _f, _t, dt) => {
      const P = pv.current;
      const vx = dt > 0 ? (p.x - P.x) / dt : 0;
      const vy = dt > 0 ? (p.y - P.y) / dt : 0;
      P.v += (Math.hypot(vx, vy) - P.v) * 0.2;
      const dirX = Math.sign(vx) || 1;
      P.x = p.x;
      P.y = p.y;
      const bar = el.querySelector<HTMLElement>(".u146-bar");
      if (bar) bar.style.transform = `scaleX(${clamp(P.v / 1800, 0.02, 1).toFixed(3)})`;
      const tiles = [...el.querySelectorAll<HTMLElement>(".u146-t")];
      const idx = p.inside ? tiles.findIndex((n) => inBox(rel(n, el), p.x, p.y)) : -1;
      if (idx === cur.current) return;
      cur.current = idx;
      if (idx < 0) return;
      const s = clamp(P.v / 1600, 0.12, 1);
      gsap.fromTo(
        tiles[idx],
        { rotation: dirX * 16 * s, y: -18 * s, scale: 1 + 0.14 * s },
        { rotation: 0, y: 0, scale: 1, duration: 0.9 + 0.5 * s, ease: `elastic.out(${(1 + s * 0.4).toFixed(2)},0.3)`, overwrite: true },
      );
    },
  );
  return (
    <Stage r={root} g1="rgba(255,179,138,.5)" g2="rgba(122,240,200,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[4vh] px-[6%]" style={{ fontFamily: F.sg }}>
        <div className="flex w-[min(92%,1080px)] items-end justify-between">
          <div>
            <Eyebrow>Shop by material</Eyebrow>
            <h3 className="mt-3 text-[clamp(38px,3.8vw,62px)] leading-none tracking-[-0.03em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
              Made of honest things
            </h3>
          </div>
          <div className="w-[220px]">
            <p className="text-[13px] uppercase tracking-[0.2em] text-white/50">Pointer speed</p>
            <div className="mt-2 h-[6px] overflow-hidden rounded-full bg-white/10">
              <div className="u146-bar h-full origin-left rounded-full bg-[#ffb38a]" style={{ transform: "scaleX(.4)" }} />
            </div>
          </div>
        </div>
        <div className="u146-g grid w-[min(92%,1080px)] grid-cols-6 gap-4">
          {U146_T.map((t, i) => (
            <div key={t} className="u146-t flex h-[clamp(96px,13vh,124px)] flex-col justify-between rounded-[18px] border border-white/10 bg-white/[0.05] p-4">
              <span className="h-3 w-3 rounded-full" style={{ background: U146_C[i % 6] }} />
              <span className="text-[19px] font-[600] tracking-[-0.01em]">{t}</span>
            </div>
          ))}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U147 · Branched menu ───────────────────────── */
const U147_I = [
  { t: "New arrivals", n: "48", p: "from ₹1,900" },
  { t: "Women", n: "212", p: "from ₹2,400" },
  { t: "Men", n: "168", p: "from ₹2,200" },
  { t: "Home & living", n: "94", p: "from ₹1,200" },
  { t: "Gifting", n: "36", p: "from ₹900" },
];
const U147_Y = [100, 200, 300, 400, 500];
const u147Path = (y: number) => `M80,30 V${y - 40} Q80,${y} 120,${y} H250`;
function U147() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const sel = useRef(1);
  const idle = useIdle(root);
  const pick = (i: number) => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const acc = [...el.querySelectorAll<SVGPathElement>(".u147-acc")];
    const glow = [...el.querySelectorAll<SVGPathElement>(".u147-gl")];
    const prev = sel.current;
    sel.current = i;
    if (prev !== i) gsap.to([acc[prev], glow[prev]], { drawSVG: "100% 100%", duration: 0.4, ease: "power2.in", overwrite: true });
    gsap.set([acc[i], glow[i]], { opacity: 1 });
    gsap.fromTo([acc[i], glow[i]], { drawSVG: "0% 0%" }, { drawSVG: "0% 100%", duration: 0.75, ease: "power2.inOut", overwrite: true });
    el.querySelectorAll(".u147-i").forEach((n, k) => n.classList.toggle("on", k === i));
    el.querySelectorAll<HTMLElement>(".u147-pv").forEach((n, k) => (n.style.opacity = k === i ? "1" : "0"));
  };
  usePlay(root, (el) => {
    const items = [...el.querySelectorAll<HTMLElement>(".u147-i")];
    gsap.set(el.querySelectorAll(".u147-acc,.u147-gl"), { opacity: 1, drawSVG: "0% 0%" });
    gsap.set([el.querySelectorAll(".u147-acc")[1], el.querySelectorAll(".u147-gl")[1]], { drawSVG: "0% 100%" });
    const ORDER = [3, 0, 4, 2, 1];
    const tl = gsap.timeline({ repeat: -1, paused: true });
    ORDER.forEach((k, s) => {
      const at = s * 1.5;
      tl.call(() => goDot(dot.current, el, [rel(items[k], el).l + 60, mid(rel(items[k], el))[1]], 0.45, idle()), [], at).call(
        () => {
          if (!idle()) return;
          tapDot(dot.current);
          pick(k);
        },
        [],
        at + 0.48,
      ).call(() => goDot(dot.current, el, [rel(items[k], el).l + rel(items[k], el).w * 0.8, mid(rel(items[k], el))[1] + 10], 0.8, idle()), [], at + 0.6);
    });
    tl.to({}, { duration: 0.01 }, ORDER.length * 1.5 - 0.01);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(110,231,255,.5)" g2="rgba(160,120,255,.22)">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative aspect-[5/3] h-[86%]" style={{ fontFamily: F.sg }}>
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 600" fill="none" aria-hidden>
            {U147_Y.map((y) => (
              <path key={`b${y}`} d={u147Path(y)} stroke="rgba(255,255,255,.16)" strokeWidth="2" />
            ))}
            {U147_Y.map((y, i) => (
              <path key={`g${y}`} className="u147-gl" d={u147Path(y)} stroke="rgba(110,231,255,.18)" strokeWidth="12" strokeLinecap="round" style={{ opacity: i === 1 ? 1 : 0 }} />
            ))}
            {U147_Y.map((y, i) => (
              <path key={`a${y}`} className="u147-acc" d={u147Path(y)} stroke="#6ee7ff" strokeWidth="3" strokeLinecap="round" style={{ opacity: i === 1 ? 1 : 0 }} />
            ))}
            <circle cx="80" cy="30" r="7" fill="#6ee7ff" />
          </svg>
          {U147_I.map((it, i) => (
            <button
              key={it.t}
              type="button"
              onClick={() => pick(i)}
              className={`u147-i absolute left-[27%] flex -translate-y-1/2 items-baseline gap-3 text-left ${i === 1 ? "on" : ""}`}
              style={{ top: `${(U147_Y[i] / 600) * 100}%` }}
            >
              <span className="text-[clamp(32px,3.4vw,52px)] leading-none tracking-[-0.02em]" style={{ fontFamily: F.fr }}>
                {it.t}
              </span>
              <span className="u147-n text-[14px] text-white/50">{it.n}</span>
            </button>
          ))}
          <div className="absolute left-[66%] top-[9%] h-[82%] w-[32%] overflow-hidden rounded-[20px] border border-white/10">
            {U147_I.map((it, i) => (
              <div key={it.t} className="u147-pv absolute inset-0" style={{ opacity: i === 1 ? 1 : 0 }}>
                <Img i={20 + i} w={420} h={520} />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-5">
                  <p className="text-[20px] font-[600]">{it.t}</p>
                  <p className="text-[14px] text-white/70">{it.p}</p>
                </div>
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
    code: "U136",
    name: "Border fade",
    how: "On hover a thick inset border colour fades in around the card and its price tints. A fake pointer walks across the tiers.",
    kind: "play",
    C: U136,
  },
  {
    code: "U137",
    name: "Ripple out / in",
    how: "On hover a double border ring expands outward (left button) or contracts inward (right button) and fades once. A fake pointer visits both.",
    kind: "play",
    C: U137,
  },
  {
    code: "U138",
    name: "Shadow lift",
    how: "On hover a drop shadow fades in from all sides, top, right, bottom or left while the tile shifts toward the light. A fake pointer walks the five tiles.",
    kind: "play",
    C: U138,
  },
  {
    code: "U139",
    name: "Input border trace",
    how: "On focus the input's four sides draw in one after another (bottom, right, top, left) and retract on blur. A fake pointer fills the form.",
    kind: "play",
    C: U139,
  },
  {
    code: "U140",
    name: "Slide back in depth",
    how: "The card moves back in Z (-400px) to the centre, to a corner, or forward toward the viewer, shrinking with perspective, then returns. Loops by itself.",
    kind: "play",
    C: U140,
  },
  {
    code: "U141",
    name: "Flip-card logo marquee",
    how: "A two-row logo marquee where tiles flip 180° on Y to a coloured back face, on hover or on a timer, then flip back.",
    kind: "play",
    C: U141,
  },
  {
    code: "U142",
    name: "Rising dot particles CTA",
    how: "On hover small dots rise out of the button and fade upward in a loose stream while the arrow slides forward. A fake pointer hovers it.",
    kind: "play",
    C: U142,
  },
  {
    code: "U143",
    name: "Click-point ripple button",
    how: "The button darkens softly under the pointer; each click bursts a radial ripple from the exact press point. A fake pointer traces a figure-eight and clicks.",
    kind: "play",
    C: U143,
  },
  {
    code: "U144",
    name: "3D tilting tooltip",
    how: "Hovering an avatar springs its tooltip in; the tooltip tilts in 3D with the pointer's position and speed. A fake pointer sweeps the row.",
    kind: "play",
    C: U144,
  },
  {
    code: "U145",
    name: "Wave underline link",
    how: "On hover the link underline swells into an SVG sine wave whose phase travels along the link, settling flat on leave. A fake pointer reads the links.",
    kind: "play",
    C: U145,
  },
  {
    code: "U146",
    name: "Velocity bobble tiles",
    how: "Tiles bobble with an elastic spring as the pointer passes; the faster the pointer, the stronger the bobble. A fake pointer loops at changing speed.",
    kind: "play",
    C: U146,
  },
  {
    code: "U147",
    name: "Branched menu",
    how: "A menu drawn as a trunk with curved branches; picking an item draws an accent line down the trunk and along its branch. A fake pointer picks items.",
    kind: "play",
    C: U147,
  },
];
