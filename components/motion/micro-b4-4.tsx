"use client";

// Micro-interactions, batch 4 · group 4 (MOTION-MENU U38–U49). Small focused demos for /lab/motion.
// Every demo plays by itself while on screen: a visible fake pointer (ring) drives the hover, or a timed toggle runs;
// the real mouse takes over for 2.5 s whenever it moves. A CSS-only glow loop never stops.
// ?static=1 / reduced motion: no JS, every element shows a sensible final state.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, SplitText, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";
import { scene, useTicker } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = { sg: "Space Grotesk Variable", fr: "Fraunces Variable", is: "Instrument Serif", sy: "Syne Variable", mr: "Manrope Variable" };

const CSS = `
.b4g4-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.42)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.2)),transparent 70%);animation:b4g4-drift 5.8s linear infinite alternate;will-change:transform}
@keyframes b4g4-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b4g4-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4);pointer-events:none;z-index:40;opacity:0;transition:opacity .25s}
.b4g4-dot.down{box-shadow:0 0 0 14px rgba(255,255,255,.16),0 4px 14px rgba(0,0,0,.4);background:rgba(255,255,255,.5)}

.u38-sea{position:absolute;left:50%;top:50%;overflow:hidden;pointer-events:none}
.u38-fill{position:absolute;left:0;right:0;top:-18px;height:calc(100% + 18px)}
.u38-wave{position:absolute;left:0;top:0;width:200%;height:18px;display:block;animation:u38-flow 2.2s linear infinite}
.u38-wave.b{animation:u38-flow-b 3.4s linear infinite;opacity:.5;top:-5px}
.u38-body{position:absolute;left:0;right:0;top:17px;bottom:0}
@keyframes u38-flow{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@keyframes u38-flow-b{from{transform:translateX(-50%)}to{transform:translateX(0)}}
.u38-label{transition:color .45s .12s}
.u38-btn.on .u38-label{color:#0a0d16}

.u39-hit{perspective:1100px}
.u39-book{position:relative;transform-style:preserve-3d;transform:rotateY(-26deg);transition:transform .9s cubic-bezier(.2,.7,.2,1)}
.u39-hit.on .u39-book{transform:rotateY(24deg) translateZ(34px) translateY(-10px)}
.u39-face{position:absolute;backface-visibility:hidden}
.u39-shadow{transition:transform .9s cubic-bezier(.2,.7,.2,1),opacity .9s}
.u39-hit.on .u39-shadow{transform:scaleX(1.18);opacity:.75}

.u40-blob{position:absolute;left:0;top:0;width:190px;height:190px;margin:-95px 0 0 -95px;border-radius:50%;background:#fff;mix-blend-mode:difference;pointer-events:none;z-index:30;will-change:transform}

.u41-card{--x:50%;--y:0%;position:relative;border-radius:24px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08)}
.u41-card::before{content:"";position:absolute;inset:-1px;border-radius:inherit;padding:1.5px;background:radial-gradient(320px circle at var(--x) var(--y),rgba(124,242,200,.95),transparent 62%);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}
.u41-card::after{content:"";position:absolute;inset:0;border-radius:inherit;background:radial-gradient(380px circle at var(--x) var(--y),rgba(124,242,200,.16),transparent 65%);opacity:0;transition:opacity .4s;pointer-events:none}
.u41-card.on::after{opacity:1}

.u42-row{color:rgba(238,242,255,.5);transition:color .45s}
.u42-row .u42-name{display:inline-block;transition:transform .5s cubic-bezier(.2,.7,.2,1)}
.u42-row.on{color:#fff}
.u42-row.on .u42-name{transform:translateX(18px)}
.u42-float{position:absolute;left:0;top:0;width:240px;height:300px;margin:-150px 0 0 -120px;pointer-events:none;z-index:20;will-change:transform}
.u42-card{width:100%;height:100%;border-radius:16px;overflow:hidden;position:relative;transform:scale(.6);opacity:0;transition:transform .5s cubic-bezier(.2,.7,.2,1),opacity .35s;box-shadow:0 30px 60px rgba(0,0,0,.5)}
.u42-float.show .u42-card{transform:scale(1);opacity:1}
.u42-pic{position:absolute;inset:0;opacity:0;transform:scale(1.15);transition:opacity .45s,transform .7s cubic-bezier(.2,.7,.2,1)}
.u42-pic.on{opacity:1;transform:scale(1)}

.u43-img{transition:transform 1s cubic-bezier(.2,.7,.2,1),filter 1s}
.u43-card.on .u43-img{transform:scale(1.06);filter:brightness(.7)}

.u44-pop{transform-origin:50% 0}

.u45-tile{will-change:transform,opacity}

.u46-scroll{scrollbar-width:none}
.u46-scroll::-webkit-scrollbar{display:none}
.u46-head{transition:background-color .45s,border-color .45s,backdrop-filter .45s}
.u46-head.solid{background:rgba(14,18,29,.92);border-color:rgba(255,255,255,.1);backdrop-filter:blur(10px)}

.u48-c{position:relative;overflow:hidden;vertical-align:top}
.u48-b{position:absolute;left:0;top:0;color:#c6ff5c}

html.is-static .b4g4-glow,html.is-static .u38-wave{animation:none}
html.is-static {.b4g4-glow,.u38-wave{animation:none}.u39-book,.u42-card,.u42-pic,.u43-img,.u46-head,.u38-label{transition:none}}
`;

/* ---------- shared helpers (local copies) ---------- */

function Stage({ r, children, g1, g2, top = true }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; g1?: string; g2?: string; top?: boolean }) {
  return (
    <div ref={r} className="relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0d16] text-[#eef2ff]">
      <style href="b4g4-css" precedence="default">
        {CSS}
      </style>
      <div className="b4g4-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
      {top && <div className="b4g4-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.3, zIndex: 35 } as CSSProperties} aria-hidden />}
    </div>
  );
}

const Dot = ({ r }: { r: RefObject<HTMLDivElement | null> }) => <div ref={r} className="b4g4-dot" aria-hidden />;

type Pt = { x: number; y: number; inside: boolean };

/** Pointer driver: the real mouse wins for 2.5 s after it last moved; otherwise `script` moves a visible fake ring. */
function usePointer(root: RefObject<HTMLDivElement | null>, dot: RefObject<HTMLDivElement | null>, script: (t: number, el: HTMLDivElement) => Pt, frame: (p: Pt, el: HTMLDivElement, real: boolean) => void) {
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
    fr.current(p, el, useReal);
  });
}

/** usePointer + hit-testing: calls onChange(idx, prev) when the pointer enters/leaves one of the `sel` elements. */
function useHoverDrive(
  root: RefObject<HTMLDivElement | null>,
  dot: RefObject<HTMLDivElement | null>,
  sel: string,
  script: (t: number, el: HTMLDivElement) => Pt,
  onChange: (idx: number, prev: number, el: HTMLDivElement) => void,
  onFrame?: (p: Pt, el: HTMLDivElement) => void,
) {
  const cur = useRef(-1);
  usePointer(root, dot, script, (p, el) => {
    onFrame?.(p, el);
    const items = [...el.querySelectorAll(sel)];
    let idx = -1;
    if (p.inside)
      idx = items.findIndex((n) => {
        const b = rel(n, el);
        return p.x >= b.l && p.x <= b.l + b.w && p.y >= b.t && p.y <= b.t + b.h;
      });
    if (idx !== cur.current) {
      const prev = cur.current;
      cur.current = idx;
      onChange(idx, prev, el);
    }
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

function rel(node: Element, root: Element) {
  const a = node.getBoundingClientRect();
  const r = root.getBoundingClientRect();
  return { l: a.left - r.left, t: a.top - r.top, w: a.width, h: a.height };
}

/** Walk the fake pointer over a sequence: a number = the centre of the n-th `sel` element, a pair = a stage fraction. */
function walk(t: number, el: HTMLDivElement, sel: string, seq: (number | [number, number])[], seg = 1.2, move = 0.4, wob = 8): Pt {
  const items = el.querySelectorAll(sel);
  const er = el.getBoundingClientRect();
  const pts = seq.map((s): [number, number] => {
    if (typeof s === "number") {
      const b = rel(items[s], el);
      return [b.l + b.w * 0.5, b.t + b.h * 0.5];
    }
    return [s[0] * er.width, s[1] * er.height];
  });
  const [x, y] = stepPath(t, pts, seg, move);
  return { x: x + Math.sin(t * 2.1) * wob, y: y + Math.cos(t * 1.7) * wob * 0.8, inside: true };
}

/** Builds a GSAP animation once fonts are ready; plays it while on screen, pauses it off screen; reverts on unmount. */
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

const Eyebrow = ({ children }: { children: ReactNode }) => <p className="text-[13px] uppercase tracking-[0.22em] text-white/55">{children}</p>;

/* ───────────────────────── U38 · Liquid fill button ───────────────────────── */
const U38_W = 340;
const U38_H = 92;
const U38_BTNS = [
  { dir: "bottom", rot: 0, label: "Book a tasting", c: "#7cf2c8" },
  { dir: "left", rot: 90, label: "Join the cellar", c: "#ffb36b" },
  { dir: "right", rot: -90, label: "Gift a bottle", c: "#9fb8ff" },
] as const;
function U38() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const tws = useRef<gsap.core.Tween[]>([]);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      tws.current = gsap.utils.toArray<HTMLElement>(".u38-fill", el).map((f) =>
        gsap.fromTo(f, { y: 0, yPercent: 100 }, { yPercent: 0, duration: 1, ease: "power2.out", easeReverse: "power2.in", paused: true }),
      );
    }, el);
    return () => ctx.revert();
  }, []);
  useHoverDrive(
    root,
    dot,
    ".u38-btn",
    (t, el) => walk(t, el, ".u38-btn", [[0.3, 0.86], 0, [0.4, 0.86], 1, [0.62, 0.86], 2, [0.75, 0.86]], 1.25, 0.4),
    (idx, prev, el) => {
      const btns = el.querySelectorAll(".u38-btn");
      if (prev >= 0) {
        btns[prev].classList.remove("on");
        tws.current[prev]?.timeScale(1.5).reverse();
      }
      if (idx >= 0) {
        btns[idx].classList.add("on");
        tws.current[idx]?.timeScale(1).play();
      }
    },
  );
  return (
    <Stage r={root} g1="rgba(124,242,200,.3)" g2="rgba(255,179,107,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[6vh] px-[4%]">
        <div className="text-center">
          <Eyebrow>Vale Cellars · members</Eyebrow>
          <h3 className="mt-3 text-[clamp(40px,4.4vw,68px)] leading-[1]" style={{ fontFamily: F.fr, fontWeight: 500 }}>
            Pour it <span className="italic text-[#7cf2c8]">in.</span>
          </h3>
        </div>
        <div className="flex flex-wrap items-start justify-center gap-[3vw]">
          {U38_BTNS.map((b) => (
            <div key={b.dir} className="flex flex-col items-center gap-4">
              <button type="button" className="u38-btn relative overflow-hidden rounded-full border border-white/25 bg-white/[0.03]" style={{ width: U38_W, height: U38_H }}>
                <span
                  className="u38-sea"
                  style={{ width: b.rot ? U38_H : U38_W, height: b.rot ? U38_W : U38_H, transform: `translate(-50%,-50%) rotate(${b.rot}deg)` }}
                  aria-hidden
                >
                  <span className="u38-fill" style={{ transform: "translateY(100%)" }}>
                    <svg className="u38-wave b" viewBox="0 0 200 18" preserveAspectRatio="none">
                      <path d="M0 9 C16.7 0 33.3 0 50 9 S83.3 18 100 9 S133.3 0 150 9 S183.3 18 200 9 V18 H0 Z" fill={b.c} />
                    </svg>
                    <svg className="u38-wave" viewBox="0 0 200 18" preserveAspectRatio="none">
                      <path d="M0 9 C16.7 0 33.3 0 50 9 S83.3 18 100 9 S133.3 0 150 9 S183.3 18 200 9 V18 H0 Z" fill={b.c} />
                    </svg>
                    <span className="u38-body" style={{ background: b.c }} />
                  </span>
                </span>
                <span className="u38-label relative z-[2] text-[21px] font-[600] tracking-[-0.01em]" style={{ fontFamily: F.sg }}>
                  {b.label}
                </span>
              </button>
              <span className="text-[13px] uppercase tracking-[0.2em] text-white/45">fills from {b.dir}</span>
            </div>
          ))}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U39 · 3D book tilt on hover ───────────────────────── */
const U39_W = 220;
const U39_H = 320;
const U39_T = 44;
const U39_BOOKS = [
  { t: "The Salt Orchard", a: "Lena Arcos", p: "₹699", c1: "#1f5f4a", c2: "#c8ff8a" },
  { t: "Night Ferry", a: "Tomas Ilev", p: "₹549", c1: "#2a1b4d", c2: "#ff8fb1" },
  { t: "Paper Weather", a: "Ada Morrow", p: "₹799", c1: "#5a2c12", c2: "#ffd59a" },
];
function U39() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useHoverDrive(
    root,
    dot,
    ".u39-hit",
    (t, el) => walk(t, el, ".u39-hit", [[0.2, 0.9], 0, 1, 2, [0.8, 0.9]], 1.15, 0.4),
    (idx, _prev, el) => el.querySelectorAll(".u39-hit").forEach((n, i) => n.classList.toggle("on", i === idx)),
  );
  return (
    <Stage r={root} g1="rgba(255,179,107,.3)" g2="rgba(124,160,255,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[5vh]">
        <div className="text-center">
          <Eyebrow>Kestrel Books · new this week</Eyebrow>
          <h3 className="mt-3 text-[clamp(36px,3.8vw,58px)] leading-[1]" style={{ fontFamily: F.is }}>
            Pick one <span className="italic text-[#ffb36b]">up.</span>
          </h3>
        </div>
        <div className="flex items-end gap-[5vw]">
          {U39_BOOKS.map((b) => (
            <div key={b.t} className="flex flex-col items-center">
              <div className="u39-hit relative" style={{ width: U39_W, height: U39_H }} data-cursor="Open">
                <div className="u39-book" style={{ width: U39_W, height: U39_H }}>
                  {/* front */}
                  <div
                    className="u39-face inset-0 overflow-hidden rounded-r-[6px] rounded-l-[2px] p-6"
                    style={{ transform: `translateZ(${U39_T / 2}px)`, background: `linear-gradient(150deg, ${b.c1}, #0b0d14 120%)` }}
                  >
                    <div className="absolute -right-10 top-14 h-40 w-40 rounded-full opacity-80" style={{ background: `radial-gradient(circle, ${b.c2}, transparent 70%)` }} />
                    <div className="absolute inset-y-0 left-0 w-[10px] bg-black/25" />
                    <p className="relative text-[12px] uppercase tracking-[0.25em] text-white/70">{b.a}</p>
                    <p className="relative mt-[110px] text-[34px] leading-[1.02] text-white" style={{ fontFamily: F.is }}>
                      {b.t}
                    </p>
                  </div>
                  {/* back */}
                  <div className="u39-face inset-0 rounded-[4px]" style={{ transform: `translateZ(${-U39_T / 2}px) rotateY(180deg)`, background: b.c1 }} />
                  {/* spine */}
                  <div
                    className="u39-face top-0 flex items-center justify-center"
                    style={{ left: (U39_W - U39_T) / 2, width: U39_T, height: U39_H, transform: `rotateY(-90deg) translateZ(${U39_W / 2}px)`, background: `linear-gradient(90deg, ${b.c1}, #0b0d14)` }}
                  >
                    <span className="text-[13px] uppercase tracking-[0.2em] text-white/85" style={{ writingMode: "vertical-rl" }}>
                      {b.t}
                    </span>
                  </div>
                  {/* page edges */}
                  <div
                    className="u39-face top-[4px]"
                    style={{
                      left: (U39_W - U39_T) / 2,
                      width: U39_T,
                      height: U39_H - 8,
                      transform: `rotateY(90deg) translateZ(${U39_W / 2 - 3}px)`,
                      background: "repeating-linear-gradient(90deg,#f3ead8 0 2px,#d6c9ae 2px 3px)",
                    }}
                  />
                  {/* top edge */}
                  <div
                    className="u39-face left-0"
                    style={{ top: (U39_H - U39_T) / 2, width: U39_W - 4, height: U39_T, transform: `rotateX(90deg) translateZ(${U39_H / 2}px)`, background: "repeating-linear-gradient(0deg,#efe5d0 0 2px,#d6c9ae 2px 3px)" }}
                  />
                </div>
                <div className="u39-shadow absolute -bottom-6 left-[8%] h-5 w-[84%] rounded-[50%] bg-black/70 opacity-50 blur-[8px]" />
              </div>
              <p className="mt-10 text-[17px] font-[600]" style={{ fontFamily: F.sg }}>
                {b.t}
              </p>
              <p className="mt-1 text-[14px] text-white/55">
                {b.a} · {b.p}
              </p>
            </div>
          ))}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U40 · Blend-mode blob cursor ───────────────────────── */
function U40() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const blob = useRef<HTMLDivElement>(null);
  const s = useRef({ x: -300, y: -300, vx: 0, vy: 0, sc: 1, last: 0 });
  usePointer(
    root,
    dot,
    (t, el) => {
      const r = el.getBoundingClientRect();
      // slow figure-eight over the headline and the shapes
      return { x: r.width * (0.5 + 0.34 * Math.sin(t * 0.85)), y: r.height * (0.5 + 0.22 * Math.sin(t * 1.7)), inside: true };
    },
    (p, el) => {
      const S = s.current;
      const now = performance.now();
      const dt = Math.min(0.05, S.last ? (now - S.last) / 1000 : 0.016);
      S.last = now;
      if (S.x < -200) {
        S.x = p.x;
        S.y = p.y;
      }
      // spring with lag (stiffness 70, damping ~9)
      S.vx += (p.x - S.x) * 70 * dt;
      S.vy += (p.y - S.y) * 70 * dt;
      const damp = Math.exp(-9 * dt);
      S.vx *= damp;
      S.vy *= damp;
      S.x += S.vx * dt;
      S.y += S.vy * dt;
      const head = el.querySelector(".u40-head");
      let over = false;
      if (head && p.inside) {
        const b = rel(head, el);
        over = p.x > b.l && p.x < b.l + b.w && p.y > b.t && p.y < b.t + b.h;
      }
      S.sc += ((p.inside ? (over ? 1.45 : 0.85) : 0) - S.sc) * Math.min(1, dt * 7);
      const sp = Math.min(0.25, Math.hypot(S.vx, S.vy) / 4000);
      const ang = Math.atan2(S.vy, S.vx);
      if (blob.current)
        blob.current.style.transform = `translate3d(${S.x.toFixed(1)}px,${S.y.toFixed(1)}px,0) rotate(${ang}rad) scale(${(S.sc * (1 + sp)).toFixed(3)},${(S.sc * (1 - sp)).toFixed(3)})`;
    },
  );
  return (
    <Stage r={root} g1="rgba(255,94,58,.32)" g2="rgba(79,141,255,.24)" top={false}>
      <div className="absolute inset-0 grid grid-cols-[1.4fr_1fr] items-center gap-[4%] px-[7%]">
        <div>
          <Eyebrow>Ember Room · late sessions</Eyebrow>
          <h3 className="u40-head mt-4 text-[clamp(60px,7.4vw,118px)] leading-[0.92] tracking-[-0.02em]" style={{ fontFamily: F.fr, fontWeight: 600 }}>
            Late light
            <br />
            <span className="italic text-[#ff5e3a]">studio.</span>
          </h3>
          <p className="mt-6 max-w-[38ch] text-[16px] text-white/60">Listening nights, every Friday from 9 pm. Doors ₹450, first pour included.</p>
        </div>
        <div className="relative h-[60%]">
          <div className="absolute left-0 top-0 h-[70%] w-[62%] rounded-[24px] bg-[#ff5e3a]" />
          <div className="absolute bottom-0 right-0 h-[56%] w-[56%] rounded-full bg-[#eef2ff]" />
          <div
            className="absolute bottom-[8%] left-[6%] h-[34%] w-[40%] rounded-[16px]"
            style={{ background: "repeating-linear-gradient(135deg,#4f8dff 0 10px,transparent 10px 20px)" }}
          />
          <span className="absolute right-[6%] top-[8%] rounded-full border border-white/40 px-4 py-2 text-[14px] uppercase tracking-[0.2em]">Fri · 9 pm</span>
        </div>
      </div>
      <div ref={blob} className="u40-blob" style={{ transform: "translate3d(-400px,-400px,0)" }} aria-hidden />
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U41 · Cursor spotlight cards ───────────────────────── */
const U41_PLANS = [
  { n: "Sketch", p: "₹0", s: "forever", f: ["3 boards", "Basic export", "Community help"] },
  { n: "Studio", p: "₹1,299", s: "/ month", f: ["Unlimited boards", "4K export", "Brand kits"] },
  { n: "Atelier", p: "₹3,499", s: "/ month", f: ["Team seats", "Review links", "Priority help"] },
];
function U41() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useHoverDrive(
    root,
    dot,
    ".u41-card",
    (t, el) => {
      const row = el.querySelector(".u41-row");
      const b = row ? rel(row, el) : { l: 0, t: 0, w: el.clientWidth, h: el.clientHeight };
      return { x: b.l + b.w * (0.5 + 0.46 * Math.sin(t * 0.8)), y: b.t + b.h * (0.5 + 0.42 * Math.sin(t * 1.6 + 0.4)), inside: true };
    },
    (idx, _prev, el) => el.querySelectorAll(".u41-card").forEach((n, i) => n.classList.toggle("on", i === idx)),
    (p, el) => {
      el.querySelectorAll<HTMLElement>(".u41-card").forEach((c) => {
        const b = rel(c, el);
        c.style.setProperty("--x", p.inside ? `${(p.x - b.l).toFixed(0)}px` : "-999px");
        c.style.setProperty("--y", p.inside ? `${(p.y - b.t).toFixed(0)}px` : "-999px");
      });
    },
  );
  return (
    <Stage r={root} g1="rgba(124,242,200,.24)" g2="rgba(79,141,255,.2)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[5vh] px-[5%]">
        <div className="text-center">
          <Eyebrow>Paperkite · plans</Eyebrow>
          <h3 className="mt-3 text-[clamp(36px,3.8vw,58px)] leading-[1] tracking-[-0.02em]" style={{ fontFamily: F.sg, fontWeight: 600 }}>
            Draw more, <span className="text-[#7cf2c8]">pay less.</span>
          </h3>
        </div>
        <div className="u41-row grid w-[min(100%,1080px)] grid-cols-3 gap-6">
          {U41_PLANS.map((p) => (
            <div key={p.n} className="u41-card p-8">
              <p className="text-[14px] uppercase tracking-[0.2em] text-white/60">{p.n}</p>
              <p className="mt-4 text-[48px] font-[600] leading-none" style={{ fontFamily: F.sg }}>
                {p.p} <span className="text-[15px] font-[400] text-white/50">{p.s}</span>
              </p>
              <ul className="mt-6 space-y-2 text-[15px] text-white/70">
                {p.f.map((x) => (
                  <li key={x} className="flex items-center gap-2">
                    <span className="h-[6px] w-[6px] rounded-full bg-[#7cf2c8]" />
                    {x}
                  </li>
                ))}
              </ul>
              <span className="mt-8 inline-block rounded-full border border-white/20 px-5 py-2 text-[14px]">Choose {p.n}</span>
            </div>
          ))}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U42 · Index list image follower ───────────────────────── */
const U42_ROWS = [
  { n: "Halden House", c: "Residential", y: "2026" },
  { n: "Orla Pavilion", c: "Hospitality", y: "2025" },
  { n: "Marrow Street", c: "Retail", y: "2025" },
  { n: "Ilse Library", c: "Civic", y: "2024" },
  { n: "Copper Yard", c: "Workplace", y: "2023" },
];
function U42() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const fl = useRef<HTMLDivElement>(null);
  const s = useRef({ x: -500, y: 0, rot: 0 });
  useHoverDrive(
    root,
    dot,
    ".u42-row",
    (t, el) => {
      const rows = el.querySelectorAll(".u42-row");
      const er = el.getBoundingClientRect();
      const xs = [0.32, 0.55, 0.4, 0.62, 0.36];
      const pts: [number, number][] = [...rows].map((r, i) => {
        const b = rel(r, el);
        return [b.l + b.w * xs[i], b.t + b.h / 2];
      });
      pts.push([er.width * 0.9, er.height * 0.92]);
      const [x, y] = stepPath(t, pts, 0.8, 0.45);
      return { x: x + Math.sin(t * 1.9) * 14, y: y + Math.cos(t * 2.3) * 4, inside: true };
    },
    (idx, _prev, el) => {
      el.querySelectorAll(".u42-row").forEach((n, i) => n.classList.toggle("on", i === idx));
      if (idx >= 0) el.querySelectorAll(".u42-pic").forEach((n, i) => n.classList.toggle("on", i === idx));
      fl.current?.classList.toggle("show", idx >= 0);
    },
    (p) => {
      const S = s.current;
      if (S.x < -400) {
        S.x = p.x;
        S.y = p.y;
      }
      const tx = p.x + 150;
      const ty = p.y - 30;
      const vx = (tx - S.x) * 0.12;
      S.x += vx;
      S.y += (ty - S.y) * 0.12;
      S.rot += (Math.max(-12, Math.min(12, vx * 0.6)) - S.rot) * 0.15;
      if (fl.current) fl.current.style.transform = `translate3d(${S.x.toFixed(1)}px,${S.y.toFixed(1)}px,0) rotate(${S.rot.toFixed(2)}deg)`;
    },
  );
  return (
    <Stage r={root} g1="rgba(255,179,107,.26)" g2="rgba(79,141,255,.2)">
      <div className="absolute inset-0 flex flex-col justify-center px-[8%]">
        <div className="mb-6 flex items-end justify-between">
          <Eyebrow>Fold & Field Architects · selected work</Eyebrow>
          <span className="text-[13px] uppercase tracking-[0.2em] text-white/45">05 projects</span>
        </div>
        <ul className="border-t border-white/15">
          {U42_ROWS.map((r, i) => (
            <li key={r.n} className="u42-row grid grid-cols-[60px_1fr_200px_80px] items-center border-b border-white/15 py-[clamp(12px,2.2vh,22px)]" data-cursor="View">
              <span className="text-[14px] text-white/40">0{i + 1}</span>
              <span className="u42-name text-[clamp(30px,3.2vw,48px)] leading-none" style={{ fontFamily: F.fr, fontWeight: 400 }}>
                {r.n}
              </span>
              <span className="text-[15px] text-white/55">{r.c}</span>
              <span className="text-right text-[15px] text-white/55">{r.y}</span>
            </li>
          ))}
        </ul>
      </div>
      <div ref={fl} className="u42-float" style={{ transform: "translate3d(-500px,-500px,0)" }} aria-hidden>
        <div className="u42-card">
          {U42_ROWS.map((r, i) => (
            <div key={r.n} className={`u42-pic ${i === 0 ? "on" : ""}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={scene(i, 480, 600)} alt="" className="block h-full w-full object-cover" draggable={false} />
            </div>
          ))}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U43 · Block-in text card ───────────────────────── */
const U43_CARDS = [
  { t: "Linen Week", l: ["Three days of open studio,", "hand-loomed throws from ₹2,400", "and tea on the terrace."], c: "#ffb36b", i: 3 },
  { t: "Clay Hours", l: ["Sunday wheel sessions,", "all glazes included, ₹1,800", "small groups of six."], c: "#7cf2c8", i: 2 },
];
function U43() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const tls = useRef<gsap.core.Timeline[]>([]);
  usePlay(root, (el) => {
    tls.current = gsap.utils.toArray<HTMLElement>(".u43-card", el).map((card) => {
      const tl = gsap.timeline({ paused: true });
      card.querySelectorAll<HTMLElement>(".u43-line").forEach((line, i) => {
        const blk = line.querySelector(".u43-blk");
        const txt = line.querySelector(".u43-txt");
        gsap.set(txt, { autoAlpha: 0 });
        const at = i * 0.12;
        tl.set(blk, { transformOrigin: "0% 50%" }, at)
          .to(blk, { scaleX: 1, duration: 0.32, ease: "power3.inOut" }, at)
          .set(txt, { autoAlpha: 1 }, at + 0.32)
          .set(blk, { transformOrigin: "100% 50%" }, at + 0.32)
          .to(blk, { scaleX: 0, duration: 0.32, ease: "power3.inOut" }, at + 0.32);
      });
      return tl;
    });
    // a tiny always-on tween so usePlay has something to pause/resume
    return gsap.to({}, { duration: 1, repeat: -1 });
  });
  useHoverDrive(
    root,
    dot,
    ".u43-card",
    (t, el) => walk(t, el, ".u43-card", [[0.5, 0.94], 0, [0.5, 0.94], 1], 1.3, 0.38),
    (idx, prev, el) => {
      const cards = el.querySelectorAll(".u43-card");
      if (prev >= 0) {
        cards[prev].classList.remove("on");
        tls.current[prev]?.timeScale(2.2).reverse();
      }
      if (idx >= 0) {
        cards[idx].classList.add("on");
        tls.current[idx]?.timeScale(1).play();
      }
    },
  );
  return (
    <Stage r={root} g1="rgba(255,179,107,.28)" g2="rgba(124,242,200,.2)">
      <div className="absolute inset-0 flex items-center justify-center gap-[3vw] px-[5%]">
        {U43_CARDS.map((c) => (
          <article key={c.t} className="u43-card relative h-[82%] w-[min(40%,460px)] overflow-hidden rounded-[22px] border border-white/10" data-cursor="Read">
            <div className="u43-img absolute inset-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={scene(c.i, 600, 800)} alt="" className="block h-full w-full object-cover" draggable={false} />
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-8 pt-24">
              <p className="text-[13px] uppercase tracking-[0.22em] text-white/60">Workshop</p>
              <h4 className="mt-2 text-[44px] leading-none" style={{ fontFamily: F.fr, fontWeight: 500 }}>
                {c.t}
              </h4>
              <div className="mt-5 flex flex-col items-start gap-1.5">
                {c.l.map((x) => (
                  <span key={x} className="u43-line relative inline-block text-[18px] leading-[1.35]" style={{ fontFamily: F.mr }}>
                    <span className="u43-txt">{x}</span>
                    <span className="u43-blk absolute inset-[-2px_-4px]" style={{ background: c.c, transform: "scaleX(0)" }} aria-hidden />
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U44 · Asymmetric open/close easing ───────────────────────── */
function U44() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const tws = useRef<gsap.core.Tween[]>([]);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const eases = ["back.out(2.2)", "back.out(3)", "elastic.out(1,0.5)"];
    const ctx = gsap.context(() => {
      tws.current = gsap.utils.toArray<HTMLElement>(".u44-pop", el).map((p, i) =>
        gsap.fromTo(
          p,
          { autoAlpha: 0, scale: 0.8, y: -12 },
          { autoAlpha: 1, scale: 1, y: 0, duration: i === 2 ? 1 : 0.7, ease: eases[i], easeReverse: "power2.in", paused: true },
        ),
      );
    }, el);
    return () => ctx.revert();
  }, []);
  useHoverDrive(
    root,
    dot,
    ".u44-trig",
    (t, el) => walk(t, el, ".u44-trig", [[0.2, 0.9], 0, [0.36, 0.9], 1, [0.6, 0.9], 2, [0.82, 0.9]], 1.15, 0.38),
    (idx, prev) => {
      if (prev >= 0) tws.current[prev]?.timeScale(1.9).reverse();
      if (idx >= 0) tws.current[idx]?.timeScale(1).play();
    },
  );
  return (
    <Stage r={root} g1="rgba(143,120,255,.3)" g2="rgba(255,179,107,.2)">
      <div className="absolute inset-0 flex flex-col items-center px-[5%] pt-[7vh]">
        <Eyebrow>Hollin Goods · menus that breathe</Eyebrow>
        <div className="mt-4 flex gap-6 text-[14px] text-white/60" style={{ fontFamily: F.sg }}>
          <span className="rounded-full border border-white/15 px-4 py-1.5">open · back.out / elastic.out</span>
          <span className="rounded-full border border-white/15 px-4 py-1.5">close · power2.in × 1.9</span>
        </div>
        <div className="mt-[9vh] grid w-[min(100%,1060px)] grid-cols-3 items-start">
          {/* dropdown */}
          <div className="relative flex justify-center">
            <button type="button" className="u44-trig flex items-center gap-3 rounded-full border border-white/20 bg-white/[0.04] px-7 py-4 text-[20px] font-[600]" style={{ fontFamily: F.sg }}>
              Collections
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                <path d="M2 5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
            <div className="u44-pop absolute top-[calc(100%+14px)] w-[260px] rounded-[18px] border border-white/10 bg-[#141a29] p-3 shadow-2xl">
              {["Linen bedding", "Stoneware", "Lighting", "Gift cards"].map((x, i) => (
                <div key={x} className={`flex justify-between rounded-[12px] px-4 py-3 text-[16px] ${i === 0 ? "bg-white/[0.06]" : ""}`}>
                  {x}
                  <span className="text-white/40">→</span>
                </div>
              ))}
            </div>
          </div>
          {/* tooltip */}
          <div className="relative flex justify-center">
            <span className="flex items-center gap-3 text-[20px]" style={{ fontFamily: F.sg }}>
              Delivery
              <span className="u44-trig grid h-11 w-11 place-items-center rounded-full border border-white/30 text-[17px] font-[700]">i</span>
            </span>
            <div className="u44-pop absolute top-[calc(100%+14px)] rounded-[12px] bg-[#eef2ff] px-5 py-3 text-[16px] font-[600] text-[#0a0d16] shadow-2xl">
              Free delivery over ₹2,500
            </div>
          </div>
          {/* hover card */}
          <div className="relative flex justify-center">
            <span className="u44-trig flex items-center gap-3 rounded-full border border-white/20 bg-white/[0.04] py-2 pl-2 pr-6 text-[19px]">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[#8a5cf6] text-[15px] font-[700]">NV</span>
              Noor Vale
            </span>
            <div className="u44-pop absolute top-[calc(100%+14px)] w-[290px] rounded-[20px] border border-white/10 bg-[#141a29] p-5 shadow-2xl">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-[#8a5cf6] text-[16px] font-[700]">NV</span>
                <div>
                  <p className="text-[17px] font-[600]">Noor Vale</p>
                  <p className="text-[13px] text-white/55">Ceramicist · Pune studio</p>
                </div>
              </div>
              <p className="mt-3 text-[14px] leading-[1.5] text-white/70">Glazes in small batches. 42 pieces in the shop.</p>
              <span className="mt-4 inline-block rounded-full bg-[#eef2ff] px-4 py-2 text-[14px] font-[600] text-[#0a0d16]">Follow</span>
            </div>
          </div>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U45 · Proximity scale field ───────────────────────── */
const U45_COLS = 14;
const U45_ROWS = 6;
function U45() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const cur = useRef<Float32Array | null>(null);
  usePointer(
    root,
    dot,
    (t, el) => {
      const g = el.querySelector(".u45-grid");
      const b = g ? rel(g, el) : { l: 0, t: 0, w: el.clientWidth, h: el.clientHeight };
      return { x: b.l + b.w * (0.5 + 0.44 * Math.sin(t * 0.7)), y: b.t + b.h * (0.5 + 0.4 * Math.sin(t * 1.3 + 0.5)), inside: true };
    },
    (p, el) => {
      const g = el.querySelector<HTMLElement>(".u45-grid");
      if (!g) return;
      const gb = rel(g, el);
      const tiles = g.querySelectorAll<HTMLElement>(".u45-tile");
      if (!cur.current || cur.current.length !== tiles.length * 2) cur.current = new Float32Array(tiles.length * 2).fill(0.6);
      const C = cur.current;
      const R = 230;
      tiles.forEach((n, i) => {
        const cx = gb.l + n.offsetLeft + n.offsetWidth / 2;
        const cy = gb.t + n.offsetTop + n.offsetHeight / 2;
        const d = p.inside ? Math.hypot(p.x - cx, p.y - cy) : 1e4;
        const ts = gsap.utils.clamp(0.55, 1.9, gsap.utils.mapRange(0, R, 1.9, 0.55, d));
        const to = gsap.utils.clamp(0.28, 1, gsap.utils.mapRange(0, R, 1, 0.28, d));
        C[i * 2] += (ts - C[i * 2]) * 0.18;
        C[i * 2 + 1] += (to - C[i * 2 + 1]) * 0.18;
        n.style.transform = `scale(${C[i * 2].toFixed(3)})`;
        n.style.opacity = C[i * 2 + 1].toFixed(3);
      });
    },
  );
  const tiles = Array.from({ length: U45_COLS * U45_ROWS }, (_, i) => i);
  return (
    <Stage r={root} g1="rgba(79,141,255,.32)" g2="rgba(255,122,89,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[5vh]">
        <div className="text-center">
          <Eyebrow>Tessel · 84 hand-cut tiles</Eyebrow>
          <h3 className="mt-3 text-[clamp(34px,3.4vw,52px)] leading-[1] tracking-[-0.02em]" style={{ fontFamily: F.sy, fontWeight: 700 }}>
            Look closer.
          </h3>
        </div>
        <div className="u45-grid relative grid gap-[22px]" style={{ gridTemplateColumns: `repeat(${U45_COLS}, 46px)` }}>
          {tiles.map((i) => {
            const h = (i * 23) % 360;
            const shape = i % 3;
            return (
              <div
                key={i}
                className="u45-tile grid h-[46px] w-[46px] place-items-center rounded-[12px]"
                style={{ background: `linear-gradient(140deg, hsl(${h} 80% 66%), hsl(${(h + 50) % 360} 70% 38%))`, opacity: 0.6 }}
              >
                <span className="block bg-white/80" style={{ width: 14, height: 14, borderRadius: shape === 0 ? "50%" : shape === 1 ? 3 : "50% 0" }} />
              </div>
            );
          })}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U46 · Direction-aware header ───────────────────────── */
function U46() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const sc = el.querySelector<HTMLElement>(".u46-scroll")!;
    const head = el.querySelector<HTMLElement>(".u46-head")!;
    const hero = el.querySelector<HTMLElement>(".u46-hero")!;
    const arrow = el.querySelector<HTMLElement>(".u46-arrow")!;
    const word = el.querySelector<HTMLElement>(".u46-word")!;
    let hidden = false;
    const st = ScrollTrigger.create({
      scroller: sc,
      start: 0,
      end: "max",
      onUpdate: (self) => {
        const y = sc.scrollTop;
        const hide = self.direction === 1 && y > 70;
        if (hide !== hidden) {
          hidden = hide;
          gsap.to(head, { yPercent: hide ? -100 : 0, duration: hide ? 0.35 : 0.5, ease: hide ? "power2.in" : "power3.out", overwrite: true });
        }
        head.classList.toggle("solid", y > hero.offsetHeight - 70);
        gsap.set(arrow, { rotation: self.direction === 1 ? 0 : 180 });
        word.textContent = self.direction === 1 ? "scrolling down" : "scrolling up";
      },
    });
    onClean(() => st.kill());
    const tl = gsap
      .timeline({ repeat: -1, defaults: { ease: "power2.inOut" } })
      .to(sc, { scrollTop: 620, duration: 1.2 })
      .to(sc, { scrollTop: 400, duration: 0.8 }, "+=0.12")
      .to(sc, { scrollTop: 1100, duration: 1.1 }, "+=0.12")
      .to(sc, { scrollTop: 0, duration: 1.3 }, "+=0.12");
    // real wheel takes over; the loop restarts 2.5 s after the last wheel
    let resume: gsap.core.Tween | null = null;
    const wheel = () => {
      tl.pause();
      resume?.kill();
      resume = gsap.delayedCall(2.5, () => {
        gsap.to(sc, { scrollTop: 0, duration: 0.6, ease: "power2.inOut", onComplete: () => void tl.restart() });
      });
    };
    sc.addEventListener("wheel", wheel, { passive: true });
    onClean(() => {
      sc.removeEventListener("wheel", wheel);
      resume?.kill();
    });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,179,107,.3)" g2="rgba(79,141,255,.22)">
      <div className="absolute inset-0 flex items-center justify-center gap-[3vw] px-[5%]">
        <div className="relative h-[86%] w-[min(70%,920px)] overflow-hidden rounded-[18px] border border-white/15 bg-[#0d111b] shadow-2xl">
          <header className="u46-head absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b border-transparent px-8 py-5">
            <span className="text-[20px] font-[700] tracking-[-0.01em]" style={{ fontFamily: F.sy }}>
              Kettle & Crane
            </span>
            <nav className="flex gap-7 text-[15px] text-white/80">
              <span>Beans</span>
              <span>Brewers</span>
              <span>Cafés</span>
            </nav>
            <span className="rounded-full bg-[#ffb36b] px-4 py-2 text-[14px] font-[600] text-[#0a0d16]">Cart · ₹1,180</span>
          </header>
          <div className="u46-scroll absolute inset-0 overflow-y-auto" data-lenis-prevent>
            <section
              className="u46-hero flex h-[380px] flex-col justify-end p-10"
              style={{ background: `linear-gradient(to top, rgba(13,17,27,.95), rgba(13,17,27,.1)), url("${scene(3, 1200, 600)}") center/cover` }}
            >
              <h4 className="text-[52px] leading-[0.98]" style={{ fontFamily: F.fr, fontWeight: 500 }}>
                Slow coffee,
                <br />
                <span className="italic text-[#ffb36b]">fast mornings.</span>
              </h4>
            </section>
            {[0, 1, 2].map((r) => (
              <section key={r} className="grid grid-cols-3 gap-5 px-10 py-8">
                {[0, 1, 2].map((c) => {
                  const i = r * 3 + c;
                  return (
                    <div key={c}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={scene(i, 400, 300)} alt="" className="block aspect-[4/3] w-full rounded-[12px] object-cover" draggable={false} />
                      <p className="mt-3 text-[15px] font-[600]">{["Hill Roast", "Monsoon Malabar", "Night Shift", "Pour-over kit", "Copper kettle", "Field grinder", "Cold brew jar", "Tasting set", "Gift tin"][i]}</p>
                      <p className="text-[14px] text-white/55">₹{[640, 720, 580, 2400, 3150, 1890, 960, 1450, 1200][i].toLocaleString("en-IN")}</p>
                    </div>
                  );
                })}
              </section>
            ))}
            <section className="px-10 pb-24 pt-6 text-[15px] text-white/50">Roasted on Tuesdays · shipped on Wednesdays.</section>
          </div>
        </div>
        <div className="flex w-[180px] flex-col items-center gap-3 text-center">
          <span className="u46-arrow grid h-14 w-14 place-items-center rounded-full border border-white/25 text-[22px]">↓</span>
          <span className="u46-word text-[14px] uppercase tracking-[0.18em] text-white/60">scroll</span>
          <span className="text-[13px] text-white/40">nav hides on down, returns on up</span>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── U47 · Auto-height accordion ───────────────────────── */
const U47_QA = [
  { q: "How long does delivery take?", a: "Most orders leave our studio in two days and reach you within a week. Larger pieces ship by freight with a booked slot." },
  { q: "Can I return a rug?", a: "Yes, within 30 days if it is unused. We collect it from your door; the return is free on orders over ₹5,000." },
  { q: "Do you take custom sizes?", a: "We weave to order from 4 × 6 ft up to 10 × 14 ft. Custom pieces take four to six weeks." },
  { q: "How do I care for wool?", a: "Vacuum weekly without the beater bar, blot spills at once, and turn the rug every season so it wears evenly." },
];
function U47() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const api = useRef<{ toggle: (i: number, user?: boolean) => void } | null>(null);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    let on = false;
    let dead = false;
    let open = 0;
    let target = 1;
    let pauseUntil = 0;
    const rows = [...el.querySelectorAll<HTMLElement>(".u47-row")];
    const panels = rows.map((r) => r.querySelector<HTMLElement>(".u47-panel")!);
    const chevs = rows.map((r) => r.querySelector<HTMLElement>(".u47-chev")!);
    const ins = rows.map((r) => r.querySelector<HTMLElement>(".u47-in")!);
    const heads = rows.map((r) => r.querySelector<HTMLElement>(".u47-q")!);
    const d = dot.current!;
    const pos = { x: el.clientWidth * 0.8, y: el.clientHeight * 0.9 };
    const toggle = (i: number) => {
      const closing = open;
      if (closing >= 0) {
        gsap.to(panels[closing], { height: 0, duration: 0.5, ease: "power2.inOut", overwrite: true });
        gsap.to(chevs[closing], { rotation: 0, duration: 0.5, ease: "power2.inOut", overwrite: true });
        gsap.to(ins[closing], { autoAlpha: 0, y: 8, duration: 0.3, overwrite: true });
        rows[closing].classList.remove("open");
      }
      if (closing === i) {
        open = -1;
        return;
      }
      open = i;
      rows[i].classList.add("open");
      gsap.to(panels[i], { height: "auto", duration: 0.6, ease: "power2.inOut", overwrite: true });
      gsap.to(chevs[i], { rotation: 180, duration: 0.6, ease: "power2.inOut", overwrite: true });
      gsap.fromTo(ins[i], { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5, delay: 0.15, ease: "power2.out", overwrite: true });
    };
    api.current = {
      toggle: (i, user) => {
        if (user) pauseUntil = performance.now() + 3000;
        toggle(i);
      },
    };
    // start state: row 0 open (matches the markup)
    panels.forEach((p, i) => gsap.set(p, { height: i === 0 ? "auto" : 0 }));
    chevs.forEach((c, i) => gsap.set(c, { rotation: i === 0 ? 180 : 0 }));
    gsap.set(ins, { autoAlpha: 1, y: 0 });
    rows.forEach((r, i) => r.classList.toggle("open", i === 0));
    let next: gsap.core.Tween | null = null;
    const step = () => {
      if (dead) return;
      if (!on || performance.now() < pauseUntil) {
        next = gsap.delayedCall(0.5, step);
        return;
      }
      next = gsap.delayedCall(0.6, () => {
        if (dead) return;
        d.classList.add("down");
        gsap.delayedCall(0.18, () => d.classList.remove("down"));
        toggle(target);
        target = (target + 1) % rows.length;
        next = gsap.delayedCall(1.1, step);
      });
    };
    // the fake pointer glides to the header it is about to click (it follows the header while panels resize)
    const tick = () => {
      if (!on) return;
      const real = performance.now() < pauseUntil;
      const b = rel(heads[target], el);
      const tx = b.l + Math.min(b.w * 0.35, 260);
      const ty = b.t + b.h / 2;
      pos.x += (tx - pos.x) * 0.1;
      pos.y += (ty - pos.y) * 0.1;
      const t = performance.now() / 1000;
      d.style.transform = `translate3d(${(pos.x + Math.sin(t * 2.1) * 6).toFixed(1)}px,${(pos.y + Math.cos(t * 1.7) * 4).toFixed(1)}px,0)`;
      d.style.opacity = real ? "0" : "1";
    };
    gsap.ticker.add(tick);
    const io = new IntersectionObserver(([e]) => (on = e.isIntersecting), { threshold: 0.1 });
    io.observe(el);
    step();
    return () => {
      dead = true;
      io.disconnect();
      gsap.ticker.remove(tick);
      next?.kill();
      gsap.killTweensOf([...panels, ...chevs, ...ins]);
      gsap.set([...chevs, ...ins], { clearProps: "transform,opacity,visibility" });
      api.current = null;
    };
  }, []);
  return (
    <Stage r={root} g1="rgba(124,242,200,.24)" g2="rgba(255,179,107,.22)">
      <div className="absolute inset-0 grid grid-cols-[0.8fr_1.6fr] items-center gap-[5%] px-[7%]">
        <div>
          <Eyebrow>Loomhaus Rugs · help</Eyebrow>
          <h3 className="mt-3 text-[clamp(38px,4vw,62px)] leading-[0.98]" style={{ fontFamily: F.fr, fontWeight: 500 }}>
            Good
            <br />
            <span className="italic text-[#7cf2c8]">questions.</span>
          </h3>
        </div>
        <div className="border-t border-white/15">
          {U47_QA.map((x, i) => (
            <div key={x.q} className={`u47-row border-b border-white/15 ${i === 0 ? "open" : ""}`}>
              <button
                type="button"
                className="u47-q flex w-full items-center justify-between py-5 text-left text-[clamp(20px,1.7vw,26px)]"
                style={{ fontFamily: F.fr }}
                onClick={() => api.current?.toggle(i, true)}
              >
                {x.q}
                <span className="u47-chev grid h-9 w-9 place-items-center rounded-full border border-white/25" style={i === 0 ? { transform: "rotate(180deg)" } : undefined}>
                  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                    <path d="M2 5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </span>
              </button>
              <div className="u47-panel overflow-hidden" style={{ height: i === 0 ? "auto" : 0 }}>
                <p className="u47-in max-w-[52ch] pb-6 text-[16px] leading-[1.6] text-white/65">{x.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U48 · Char slide-swap hover ───────────────────────── */
const U48_LINKS = ["Collections", "Journal", "Visit us"];
function U48() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const tls = useRef<gsap.core.Timeline[]>([]);
  usePlay(root, (el) => {
    tls.current = gsap.utils.toArray<HTMLElement>(".u48-word", el).map((w) => {
      const split = SplitText.create(w, { type: "words,chars", charsClass: "u48-c" });
      const as: HTMLElement[] = [];
      const bs: HTMLElement[] = [];
      (split.chars as HTMLElement[]).forEach((c) => {
        const ch = c.textContent ?? "";
        c.textContent = "";
        const a = document.createElement("span");
        a.className = "u48-a";
        a.style.display = "inline-block";
        a.textContent = ch;
        const b = document.createElement("span");
        b.className = "u48-b";
        b.setAttribute("aria-hidden", "true");
        b.textContent = ch;
        c.append(a, b);
        as.push(a);
        bs.push(b);
      });
      gsap.set(bs, { xPercent: 100 });
      const arrow = w.parentElement?.querySelector(".u48-arrow");
      return gsap
        .timeline({ paused: true, defaults: { duration: 0.45, ease: "power3.inOut" } })
        .to(as, { xPercent: -100, stagger: 0.025 }, 0)
        .to(bs, { xPercent: 0, stagger: 0.025 }, 0)
        .fromTo(arrow ?? [], { autoAlpha: 0, x: -24 }, { autoAlpha: 1, x: 0, duration: 0.4 }, 0.1);
    });
    return gsap.to({}, { duration: 1, repeat: -1 });
  });
  useHoverDrive(
    root,
    dot,
    ".u48-link",
    (t, el) => walk(t, el, ".u48-link", [[0.82, 0.9], 0, 1, 2, [0.85, 0.75]], 1.05, 0.42),
    (idx, prev) => {
      if (prev >= 0) tls.current[prev]?.timeScale(1.2).reverse();
      if (idx >= 0) tls.current[idx]?.timeScale(1).play();
    },
  );
  return (
    <Stage r={root} g1="rgba(198,255,92,.22)" g2="rgba(79,141,255,.24)">
      <div className="absolute inset-0 flex flex-col justify-center px-[9%]">
        <Eyebrow>Ostra Studio · menu</Eyebrow>
        <nav className="mt-6 flex flex-col items-start gap-[1.5vh]">
          {U48_LINKS.map((l) => (
            <a key={l} href="#" onClick={(e) => e.preventDefault()} className="u48-link flex items-center gap-6" data-cursor="Go">
              <span className="u48-word text-[clamp(56px,5.6vw,92px)] font-[700] uppercase leading-[1.08] tracking-[-0.02em]" style={{ fontFamily: F.sy }}>
                {l}
              </span>
              <span className="u48-arrow text-[clamp(32px,3vw,48px)] text-[#c6ff5c]" style={{ opacity: 0 }}>
                →
              </span>
            </a>
          ))}
        </nav>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U49 · Wavy text on hover ───────────────────────── */
function U49() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const chars = useRef<HTMLElement[]>([]);
  const amp = useRef({ v: 0 });
  usePlay(root, (el) => {
    const split = SplitText.create(el.querySelector(".u49-head")!, { type: "words,chars" });
    chars.current = split.chars as HTMLElement[];
    return gsap.to({}, { duration: 1, repeat: -1 });
  });
  useHoverDrive(
    root,
    dot,
    ".u49-head",
    (t, el) => walk(t, el, ".u49-head", [[0.5, 0.86], 0, [0.62, 0.86]], 1.3, 0.38, 10),
    (idx) => {
      gsap.to(amp.current, idx >= 0 ? { v: 1, duration: 0.8, ease: "power2.out", overwrite: true } : { v: 0, duration: 0.9, ease: "power2.inOut", overwrite: true });
    },
    () => {
      const A = amp.current.v;
      const t = performance.now() / 1000;
      const w = Math.PI * 2 * 1.2; // 1.2 waves per second
      chars.current.forEach((c, i) => {
        const s = Math.sin(w * (t - i * 0.05));
        c.style.transform = A > 0.001 ? `translate3d(0,${(-s * 0.16 * A).toFixed(4)}em,0) rotate(${(s * 4 * A).toFixed(2)}deg)` : "";
      });
    },
  );
  return (
    <Stage r={root} g1="rgba(79,200,255,.3)" g2="rgba(255,143,177,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center px-[6%] text-center">
        <Eyebrow>Tidewell Swim · summer 26</Eyebrow>
        <h3 className="u49-head mt-6 text-[clamp(64px,7.4vw,124px)] leading-[1.05]" style={{ fontFamily: F.is }}>
          Summer runs <span className="italic text-[#7fd8ff]">slow.</span>
        </h3>
        <p className="mt-6 text-[17px] text-white/60">Recycled-nylon swimwear from ₹2,190 · hover the line</p>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "U38", name: "Liquid fill button", how: "Hover fills the button with liquid whose wavy edge keeps flowing, from bottom, left or right. A fake pointer hovers each button in turn.", kind: "play", C: U38 },
  { code: "U39", name: "3D book tilt on hover", how: "A 3D book turns on Y on hover, swinging from its page edges to show its spine and lifting forward. A fake pointer visits each book.", kind: "play", C: U39 },
  { code: "U40", name: "Blend-mode blob cursor", how: "A big white blob follows the pointer on a spring with difference blending, inverting what it covers and growing over the headline. A scripted figure-eight drives it.", kind: "play", C: U40 },
  { code: "U41", name: "Cursor spotlight cards", how: "A radial light follows the pointer inside the hovered card and lights the borders of neighbouring cards near it. A scripted sweep drives it.", kind: "play", C: U41 },
  { code: "U42", name: "Index list image follower", how: "Hovering a list row shows its image floating beside the pointer with lag and tilt, swapping as rows change. A fake pointer walks the rows.", kind: "play", C: U42 },
  { code: "U43", name: "Block-in text card", how: "On hover a colour block wipes in over each line, then wipes out to leave the text. A fake pointer hovers each card in turn.", kind: "play", C: U43 },
  { code: "U44", name: "Asymmetric open/close easing", how: "Dropdown, tooltip and hover card open with a springy ease and close with a calm, quicker power2.in (easeReverse). A fake pointer opens each.", kind: "play", C: U44 },
  { code: "U45", name: "Proximity scale field", how: "Tiles in a field scale and brighten by their distance to the pointer, so a soft magnifier bubble travels across. A fake pointer drifts over it.", kind: "play", C: U45 },
  { code: "U46", name: "Direction-aware header", how: "Inside a mini page the nav slides away when scrolling down, returns on scroll up and turns solid after the hero. The page scrolls by itself.", kind: "play", C: U46 },
  { code: "U47", name: "Auto-height accordion", how: "FAQ rows open from 0 to their measured height with the chevron turning and the answer rising in; the open row closes. A fake pointer clicks row after row.", kind: "play", C: U47 },
  { code: "U48", name: "Char slide-swap hover", how: "Each letter slides sideways out of its own box as an accent clone slides in, in a fast stagger; on leave they slide back. A fake pointer hovers each link.", kind: "play", C: U48 },
  { code: "U49", name: "Wavy text on hover", how: "Letters bob on a looping sine wave staggered 50 ms; the wave strength eases in on hover and out on leave. A fake pointer hovers the line and leaves.", kind: "play", C: U49 },
];
