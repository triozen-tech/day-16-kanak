"use client";

// Micro-interactions, batch 4 · group 3 (MOTION-MENU U26–U37). Small focused demos for /lab/motion.
// Every demo plays by itself while on screen: a visible fake pointer (ring / dot) walks a scripted path and drives the
// hover, or a timeline toggles the states on a timer. The real mouse takes over for 2.5 s whenever it moves inside.
// A CSS-only glow loop (and a second one on top where photos cover the stage) never stops, so the recording never freezes.
// ?static=1 / reduced motion: no JS runs, each demo shows a sensible final state.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, SplitText, prefersReducedMotion } from "@/lib/gsap";
import { scene, useTicker } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = { sg: "Space Grotesk Variable", fr: "Fraunces Variable", is: "Instrument Serif", sy: "Syne Variable", mr: "Manrope Variable" };

const CSS = `
.b4g3u-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(40% 44% at 34% 40%,var(--g1,rgba(79,141,255,.42)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.2)),transparent 70%);animation:b4g3u-drift 5.6s linear infinite alternate;will-change:transform}
@keyframes b4g3u-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b4g3u-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4);pointer-events:none;z-index:40;opacity:0;transition:opacity .25s}
.b4g3u-dot.sm{width:8px;height:8px;margin:-4px 0 0 -4px;border:0;background:#fff;box-shadow:0 0 0 3px rgba(255,255,255,.18)}
.b4g3u-spin{animation:b4g3u-rot .8s linear infinite;transform-origin:50% 50%}
@keyframes b4g3u-rot{to{transform:rotate(360deg)}}
.b4g3u-eq span{display:block;width:4px;border-radius:2px;background:#c6ff5c;animation:b4g3u-eq .9s ease-in-out infinite alternate;transform-origin:50% 100%}
@keyframes b4g3u-eq{0%{transform:scaleY(.25)}100%{transform:scaleY(1)}}

/* U28 · underline from centre + lift */
.u28-l{position:relative;display:inline-block;color:rgba(238,242,255,.62);transition:transform .5s cubic-bezier(.16,1,.3,1),color .4s}
.u28-l .u28-u{position:absolute;left:0;right:0;bottom:-.08em;height:3px;border-radius:2px;background:#ffb36b;transform:scaleX(0);transform-origin:50% 50%;transition:transform .5s cubic-bezier(.16,1,.3,1)}
.u28-l.on,.u28-l:hover{transform:translateY(-2px);color:#fff}
.u28-l.on .u28-u,.u28-l:hover .u28-u{transform:scaleX(1)}

/* U30 · rising fill */
.u30-b{position:relative;overflow:hidden;isolation:isolate;color:var(--c);transition:color .45s cubic-bezier(.2,.8,.2,1),border-color .45s}
.u30-f{position:absolute;left:-12%;width:124%;height:220%;top:100%;border-radius:50% 50% 0 0/38% 38% 0 0;z-index:-1;transform:translateY(0);transition:transform .6s cubic-bezier(.2,.8,.2,1),border-radius .6s}
.u30-b.on .u30-f,.u30-b:hover .u30-f{transform:translateY(-58%);border-radius:0}
.u30-b .u30-a{display:inline-block;transition:transform .45s cubic-bezier(.2,.8,.2,1)}
.u30-b.on .u30-a,.u30-b:hover .u30-a{transform:translateX(6px) rotate(-45deg)}
.u30-b.on,.u30-b:hover{color:var(--fg)}

/* U31 · sibling focus */
.u31-it{transition:filter .5s cubic-bezier(.4,0,.2,1),opacity .5s,transform .6s cubic-bezier(.2,.7,.2,1)}
.u31-g.has .u31-it:not(.on),.u31-g:hover .u31-it:not(:hover){filter:blur(4px) brightness(.6);opacity:.5;transform:scale(.97)}

/* U32 · words spray images */
.u32-w{position:relative;display:inline-block;z-index:2;transition:color .4s}
.u32-w.on{color:#ffb36b}
.u32-p{position:absolute;left:50%;top:50%;width:var(--s,124px);aspect-ratio:4/5;margin:calc(var(--s,124px)*-.625) 0 0 calc(var(--s,124px)*-.5);border-radius:10px;overflow:hidden;z-index:-1;opacity:0;box-shadow:0 18px 40px rgba(0,0,0,.45);transform:translate(0,0) rotate(0) scale(.35);transition:transform .55s cubic-bezier(.4,0,.2,1),opacity .35s;transition-delay:calc((5 - var(--i)) * 25ms)}
.u32-w.on .u32-p,.u32-w:hover .u32-p{opacity:1;transform:translate(var(--x),var(--y)) rotate(var(--r)) scale(1);transition:transform .7s cubic-bezier(.34,1.56,.64,1),opacity .25s;transition-delay:calc(var(--i) * 45ms)}

/* U35 · underline draw-through */
.u35-l{position:relative;display:inline-block;color:rgba(238,242,255,.6);transition:color .4s}
.u35-l.on,.u35-l:hover{color:#fff}
.u35-l .u35-u{position:absolute;left:0;right:0;bottom:-.04em;height:3px;background:#7ee0ff;transform:scaleX(0);transform-origin:100% 50%;transition:transform .55s cubic-bezier(.65,0,.35,1)}
.u35-l.on .u35-u,.u35-l:hover .u35-u{transform:scaleX(1);transform-origin:0 50%}
.u35-l .u35-s path{stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset .7s cubic-bezier(.65,0,.35,1)}
.u35-l.on .u35-s path,.u35-l:hover .u35-s path{stroke-dashoffset:0}

html.is-static .b4g3u-glow,html.is-static .b4g3u-spin,html.is-static .b4g3u-eq span{animation:none}
html.is-static {
  .b4g3u-glow,.b4g3u-spin,.b4g3u-eq span{animation:none}
  .u28-l,.u28-u,.u30-b,.u30-f,.u30-a,.u31-it,.u32-w,.u32-p,.u35-l,.u35-u,.u35-s path{transition:none!important}
}
`;

/* ───────────────────────── shared helpers (local copies) ───────────────────────── */

function Stage({ r, children, g1, g2, top, className = "" }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; g1?: string; g2?: string; top?: boolean; className?: string }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0d16] text-[#eef2ff] ${className}`}>
      <style href="b4g3u-css" precedence="default">
        {CSS}
      </style>
      <div className="b4g3u-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
      {top && <Sheen g1={g1} />}
    </div>
  );
}

/** The CSS glow loop again, ON TOP of photos/cards (screen blend), so image-heavy demos never freeze. */
const Sheen = ({ g1 }: { g1?: string }) => (
  <div className="b4g3u-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.4, zIndex: 35 } as CSSProperties} aria-hidden />
);

/** The visible fake pointer that drives hover demos while nobody touches the mouse. */
const Dot = ({ r, sm }: { r: RefObject<HTMLDivElement | null>; sm?: boolean }) => <div ref={r} className={`b4g3u-dot ${sm ? "sm" : ""}`} aria-hidden />;

type Pt = { x: number; y: number; inside: boolean };

/** Pointer driver: the real mouse wins for 2.5 s after it last moved; otherwise `script` moves a visible fake pointer. */
function usePointer(
  root: RefObject<HTMLDivElement | null>,
  dot: RefObject<HTMLDivElement | null>,
  script: (t: number, el: HTMLDivElement) => Pt,
  frame: (p: Pt, el: HTMLDivElement, dt: number, real: boolean) => void,
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
    fr.current(p, el, Math.min(dt, 0.05), useReal);
  });
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

const easeIO = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/** A path that holds at each point and glides to the next during the last `move` part of every `seg` seconds. */
function stepPath(t: number, pts: [number, number][], seg: number, move = 0.4): [number, number] {
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

const inBox = (p: Pt, n: Element, root: Element) => {
  const b = rel(n, root);
  return p.inside && p.x >= b.l && p.x <= b.l + b.w && p.y >= b.t && p.y <= b.t + b.h;
};

/** Scripted hover walk over a list of targets (selector + index) with an "off" stop; wiggles while holding. */
function walk(el: HTMLElement, t: number, stops: (readonly [string, number])[], seg = 0.95, fx = 0.5, fy = 0.5): Pt {
  const er = el.getBoundingClientRect();
  const pts: [number, number][] = stops.map(([sel, i]) => {
    if (sel === "off") return [er.width * (0.15 + 0.7 * ((i * 0.37) % 1)), er.height * 0.92];
    const n = el.querySelectorAll(sel)[i];
    if (!n) return [er.width / 2, er.height / 2];
    const b = rel(n, el);
    return [b.l + b.w * fx, b.t + b.h * fy];
  });
  const [x, y] = stepPath(t, pts, seg, 0.4);
  return { x: x + Math.sin(t * 2.3) * 9, y: y + Math.cos(t * 1.9) * 6, inside: true };
}

/** Toggle `.on` on the first matching target under the pointer (one active at a time); returns the index. */
function hoverOne(p: Pt, el: HTMLElement, sel: string, last: { current: number }) {
  const items = [...el.querySelectorAll(sel)];
  const idx = items.findIndex((n) => inBox(p, n, el));
  if (idx !== last.current) {
    last.current = idx;
    items.forEach((n, i) => n.classList.toggle("on", i === idx));
  }
  return idx;
}

/** On first motion frame remove the static "on" so the first hover reads. */
function useClearOn(root: RefObject<HTMLDivElement | null>, last?: { current: number }) {
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    if (last) last.current = -1;
    el.querySelectorAll(".on").forEach((n) => n.classList.remove("on"));
    el.querySelectorAll(".has").forEach((n) => n.classList.remove("has"));
  }, [root, last]);
}

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, className = "", w = 600, h = 800 }: { i: number; className?: string; w?: number; h?: number }) => (
  <img src={scene(i, w, h)} alt="" className={`block h-full w-full object-cover ${className}`} draggable={false} />
);

/* ───────────────────────── U26 · Custom cursor pill that expands over target ───────────────────────── */
const U26_T = [
  { n: "Halden lounge chair", p: "₹42,900", l: "View" },
  { n: "Orra floor lamp", p: "₹18,400", l: "Shop" },
  { n: "Film · the workshop", p: "2:14", l: "Play ▶" },
];
function U26() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const cur = useRef<HTMLDivElement>(null);
  const lab = useRef<HTMLSpanElement>(null);
  const s = useRef({ x: -100, y: -100, vx: 0, vy: 0, w: 16, h: 16, vw: 0, vh: 0, a: 0, idx: -1, init: false });
  usePointer(
    root,
    dot,
    (t, el) => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      // slow figure-eight that crosses all three tiles and the gaps between them
      return { x: w * 0.5 + Math.sin(t * 0.95) * w * 0.4, y: h * 0.55 + Math.sin(t * 1.9) * h * 0.24, inside: true };
    },
    (p, el, dt) => {
      const S = s.current;
      if (!S.init) {
        S.x = p.x;
        S.y = p.y;
        S.init = true;
      }
      const tiles = [...el.querySelectorAll(".u26-t")];
      const idx = tiles.findIndex((n) => inBox(p, n, el));
      if (idx !== S.idx) {
        S.idx = idx;
        if (lab.current && idx >= 0) lab.current.textContent = U26_T[idx].l;
        tiles.forEach((n, i) => n.classList.toggle("on", i === idx));
      }
      // spring: position follows with a little lag + overshoot, size springs between dot and pill
      const k = 170;
      const d = 17;
      S.vx += ((p.x - S.x) * k - S.vx * d) * dt;
      S.vy += ((p.y - S.y) * k - S.vy * d) * dt;
      S.x += S.vx * dt;
      S.y += S.vy * dt;
      const tw = idx >= 0 ? 116 : 16;
      const th = idx >= 0 ? 40 : 16;
      S.vw += ((tw - S.w) * 260 - S.vw * 20) * dt;
      S.vh += ((th - S.h) * 260 - S.vh * 20) * dt;
      S.w += S.vw * dt;
      S.h += S.vh * dt;
      S.a += ((idx >= 0 ? 1 : 0) - S.a) * Math.min(1, dt * 12);
      const c = cur.current;
      if (c) {
        c.style.transform = `translate3d(${(S.x - S.w / 2).toFixed(1)}px,${(S.y - S.h / 2).toFixed(1)}px,0)`;
        c.style.width = `${Math.max(8, S.w).toFixed(1)}px`;
        c.style.height = `${Math.max(8, S.h).toFixed(1)}px`;
        c.style.opacity = p.inside ? "1" : "0";
      }
      if (lab.current) lab.current.style.opacity = S.a.toFixed(2);
    },
  );
  return (
    <Stage r={root} g1="rgba(198,255,92,.26)" g2="rgba(79,141,255,.24)" top className="cursor-none">
      <div className="absolute inset-0 flex flex-col px-[5%] py-[4.5%]">
        <div className="flex items-end justify-between">
          <h3 className="text-[clamp(30px,3.2vw,48px)] leading-none" style={{ fontFamily: F.sg, fontWeight: 600, letterSpacing: "-0.02em" }}>
            The spring edit
          </h3>
          <p className="text-[13px] uppercase tracking-[0.22em] text-white/55">Studio Kerro · 03 pieces</p>
        </div>
        <div className="mt-[3%] grid flex-1 grid-cols-3 gap-[5%] px-[3%]">
          {U26_T.map((t, i) => (
            <figure key={t.n} className="u26-t relative overflow-hidden rounded-[18px] border border-white/10" data-cursor={t.l}>
              <Img i={i + 3} w={520} h={640} className="opacity-90" />
              <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/80 to-transparent p-[7%] pt-[28%]">
                <span className="text-[16px] font-[600]" style={{ fontFamily: F.sg }}>
                  {t.n}
                </span>
                <span className="text-[14px] text-white/75">{t.p}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
      <div
        ref={cur}
        className="pointer-events-none absolute left-0 top-0 z-[45] flex items-center justify-center overflow-hidden rounded-full border border-white/40 bg-white/25 text-[#0a0d16] backdrop-blur-md"
        style={{ width: 16, height: 16, opacity: 0, boxShadow: "0 0 24px rgba(198,255,92,.35)" }}
        aria-hidden
      >
        <span ref={lab} className="absolute inset-[3px] grid place-items-center whitespace-nowrap rounded-full bg-[#c6ff5c] text-[13px] font-[700] uppercase tracking-[0.12em]" style={{ fontFamily: F.sg, opacity: 0 }}>
          View
        </span>
      </div>
      <Dot r={dot} sm />
    </Stage>
  );
}

/* ───────────────────────── U27 · Cursor spotlight inside card ───────────────────────── */
function U27() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const spot = useRef<HTMLDivElement>(null);
  const s = useRef({ x: 0, y: 0, vx: 0, vy: 0, a: 0, init: false });
  usePointer(
    root,
    dot,
    (t, el) => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      // figure-eight a little wider than the card: the light follows inside and fades when the pointer leaves
      return { x: w * 0.5 + Math.sin(t * 0.85) * w * 0.36, y: h * 0.5 + Math.sin(t * 1.7) * h * 0.3, inside: true };
    },
    (p, el, dt) => {
      const c = card.current;
      const sp = spot.current;
      if (!c || !sp) return;
      const b = rel(c, el);
      const lx = p.x - b.l;
      const ly = p.y - b.t;
      const S = s.current;
      if (!S.init) {
        S.x = lx;
        S.y = ly;
        S.init = true;
      }
      const inside = p.inside && lx >= 0 && ly >= 0 && lx <= b.w && ly <= b.h;
      S.vx += ((lx - S.x) * 120 - S.vx * 15) * dt;
      S.vy += ((ly - S.y) * 120 - S.vy * 15) * dt;
      S.x += S.vx * dt;
      S.y += S.vy * dt;
      S.a += ((inside ? 1 : 0) - S.a) * Math.min(1, dt * 7);
      sp.style.transform = `translate3d(${(S.x - 260).toFixed(1)}px,${(S.y - 260).toFixed(1)}px,0)`;
      sp.style.opacity = S.a.toFixed(3);
    },
  );
  return (
    <Stage r={root} g1="rgba(150,120,255,.34)" g2="rgba(79,141,255,.2)">
      <div className="absolute inset-0 grid place-items-center">
        <div ref={card} className="relative h-[74%] w-[min(60%,820px)] overflow-hidden rounded-[26px] border border-white/12 bg-[#11141f]/90 shadow-[0_40px_80px_rgba(0,0,0,.45)]">
          <div
            ref={spot}
            className="pointer-events-none absolute left-0 top-0 h-[520px] w-[520px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(255,255,255,.5) 0%, rgba(255,255,255,.1) 42%, transparent 68%)",
              filter: "blur(24px)",
              mixBlendMode: "soft-light",
              opacity: 0,
              transform: "translate3d(120px,-60px,0)",
            }}
            aria-hidden
          />
          <div className="relative flex h-full flex-col justify-between p-[6%]">
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-white/20 px-3 py-1 text-[13px] uppercase tracking-[0.2em] text-white/70">Studio pass</span>
              <span className="text-[13px] text-white/50">Billed monthly</span>
            </div>
            <div>
              <p className="text-[clamp(56px,5.6vw,84px)] leading-none" style={{ fontFamily: F.fr, fontWeight: 400 }}>
                ₹1,499<span className="text-[0.32em] text-white/55"> / month</span>
              </p>
              <p className="mt-3 max-w-[34ch] text-[16px] leading-[1.5] text-white/65">Unlimited open-studio hours, two guided sessions and first pick of every new glaze.</p>
            </div>
            <div className="flex items-center justify-between border-t border-white/12 pt-[4%]">
              <ul className="flex gap-6 text-[14px] text-white/75">
                <li>· 24 kilns</li>
                <li>· Clay included</li>
                <li>· Guest pass</li>
              </ul>
              <span className="rounded-full bg-white px-5 py-[10px] text-[14px] font-[600] text-[#0a0d16]">Join the studio</span>
            </div>
          </div>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U28 · Underline from centre + lift ───────────────────────── */
const U28_L = ["Collections", "Atelier", "Journal", "Visit"];
const U28_STOPS: (readonly [string, number])[] = [
  [".u28-l", 0],
  [".u28-l", 1],
  [".u28-l", 2],
  [".u28-l", 3],
  ["off", 1],
];
function U28() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const last = useRef(0);
  useClearOn(root, last);
  usePointer(
    root,
    dot,
    (t, el) => walk(el, t, U28_STOPS, 0.9, 0.5, 0.6),
    (p, el) => hoverOne(p, el, ".u28-l", last),
  );
  return (
    <Stage r={root} g1="rgba(255,179,107,.3)" g2="rgba(79,141,255,.2)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[7%]">
        <p className="text-[13px] uppercase tracking-[0.3em] text-white/50">Maison Ortu · menu</p>
        <nav className="flex items-baseline gap-[clamp(28px,4vw,64px)] text-[clamp(40px,4.6vw,68px)] leading-[1.1]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
          {U28_L.map((l, i) => (
            <a key={l} href="#" onClick={(e) => e.preventDefault()} className={`u28-l ${i === 1 ? "on" : ""}`}>
              {l}
              <span className="u28-u" aria-hidden />
            </a>
          ))}
        </nav>
        <p className="text-[15px] text-white/45">Hand-finished linen · Jaipur &amp; Lisbon</p>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U29 · Status button (idle → loading → success / error) ───────────────────────── */
function U29() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const q = gsap.utils.selector(el);
    const btn = q(".u29-b")[0] as HTMLElement;
    const dot = q(".u29-dot")[0] as HTMLElement;
    const [idle, spin, okL, errL] = [q(".u29-idle"), q(".u29-spin"), q(".u29-ok"), q(".u29-err")];
    const okP = q(".u29-okp");
    const errP = q(".u29-errp");
    gsap.set(btn, { width: 360, backgroundColor: "#f4f1ea", color: "#0a0d16" });
    gsap.set([spin, okL, errL], { autoAlpha: 0 });
    gsap.set(idle, { autoAlpha: 1, y: 0 });
    gsap.set([okP, errP], { drawSVG: "0%" });
    gsap.set(dot, { autoAlpha: 1, x: 260, y: 150 });
    const run = (tl: gsap.core.Timeline, fail: boolean) => {
      const L = fail ? "err" : "ok";
      tl.addLabel(`go-${L}`)
        .to(dot, { x: 40, y: 18, duration: 0.55, ease: "power2.inOut" })
        .to(btn, { scale: 0.95, duration: 0.12, ease: "power2.out" })
        .to(btn, { scale: 1, duration: 0.25, ease: "back.out(3)" })
        .to(idle, { autoAlpha: 0, y: -14, scale: 0.8, duration: 0.25, ease: "power2.in" }, "<-0.1")
        .to(btn, { width: 76, duration: 0.45, ease: "power3.inOut" }, "<")
        .to(spin, { autoAlpha: 1, duration: 0.2 }, "-=0.15")
        .to(dot, { x: 150, y: 120, duration: 1.1, ease: "sine.inOut" }, "<")
        .to(spin, { autoAlpha: 0, duration: 0.15 }, "+=0.55")
        .to(btn, { width: fail ? 330 : 310, backgroundColor: fail ? "#ff5a5f" : "#3ddc97", color: "#0a0d16", duration: 0.5, ease: "back.out(1.6)" })
        .fromTo(fail ? errL : okL, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.3 }, "<0.15")
        .to(fail ? errP : okP, { drawSVG: "100%", duration: 0.4, ease: "power2.out" }, "<");
      if (fail) tl.to(btn, { keyframes: { x: [0, -12, 10, -8, 6, -3, 0] }, duration: 0.45, ease: "none" }, "<0.1");
      tl.to(dot, { x: 240, y: 140, duration: 0.6, ease: "sine.inOut" }, "<")
        .to(fail ? errL : okL, { autoAlpha: 0, y: -10, duration: 0.25 }, "+=0.2")
        .set(fail ? errP : okP, { drawSVG: "0%" })
        .to(btn, { width: 360, backgroundColor: "#f4f1ea", duration: 0.45, ease: "power3.inOut" }, "<")
        .fromTo(idle, { autoAlpha: 0, y: 14, scale: 1 }, { autoAlpha: 1, y: 0, duration: 0.3 }, "<0.15");
    };
    const tl = gsap.timeline({ repeat: -1, paused: true });
    run(tl, false);
    run(tl, true);
    const click = () => tl.seek("go-ok").play();
    btn.addEventListener("click", click);
    onClean(() => btn.removeEventListener("click", click));
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(61,220,151,.28)" g2="rgba(255,90,95,.18)">
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex items-center gap-6 rounded-[22px] border border-white/10 bg-white/[0.04] p-5 pr-8">
          <div className="h-[92px] w-[76px] overflow-hidden rounded-[12px]">
            <Img i={6} w={200} h={260} />
          </div>
          <div>
            <p className="text-[13px] uppercase tracking-[0.2em] text-white/50">Your bag · 1 item</p>
            <p className="mt-1 text-[26px] leading-tight" style={{ fontFamily: F.fr }}>
              Linen overshirt, sand
            </p>
            <p className="mt-1 text-[15px] text-white/60">Size M · ₹3,290</p>
          </div>
        </div>
        <div className="relative mt-10 flex h-[76px] items-center justify-center">
          <button
            type="button"
            className="u29-b relative flex h-[76px] items-center justify-center overflow-hidden rounded-full text-[19px] font-[600]"
            style={{ width: 360, background: "#f4f1ea", color: "#0a0d16", fontFamily: F.sg }}
          >
            <span className="u29-idle whitespace-nowrap">Place order · ₹3,290</span>
            <span className="u29-spin absolute inset-0 grid place-items-center" style={{ visibility: "hidden" }} aria-hidden>
              <svg className="b4g3u-spin" width="30" height="30" viewBox="0 0 30 30">
                <circle cx="15" cy="15" r="12" fill="none" stroke="rgba(10,13,22,.18)" strokeWidth="3" />
                <path d="M15 3a12 12 0 0 1 12 12" fill="none" stroke="#0a0d16" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
            <span className="u29-ok absolute inset-0 flex items-center justify-center gap-3 whitespace-nowrap" style={{ visibility: "hidden" }}>
              <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden>
                <path className="u29-okp" d="M5 13.5l5 5L21 7.5" fill="none" stroke="#0a0d16" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Order placed
            </span>
            <span className="u29-err absolute inset-0 flex items-center justify-center gap-3 whitespace-nowrap" style={{ visibility: "hidden" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
                <path className="u29-errp" d="M6 6l12 12M18 6L6 18" fill="none" stroke="#0a0d16" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Card declined
            </span>
          </button>
          <div className="u29-dot b4g3u-dot" style={{ opacity: 0, left: "50%", top: "50%" }} aria-hidden />
        </div>
        <p className="mt-6 text-[13px] text-white/45">Secure checkout · free returns in 30 days</p>
      </div>
    </Stage>
  );
}

/* ───────────────────────── U30 · Rising fill button ───────────────────────── */
const U30_B = [
  { t: "Start a project", bg: "transparent", bd: "rgba(255,255,255,.35)", fill: "#ffb36b", fg: "#1a0f05", c: "#fff" },
  { t: "See the work", bg: "#f4f1ea", bd: "#f4f1ea", fill: "#1b2340", fg: "#fff", c: "#0a0d16" },
  { t: "Book a studio call", bg: "transparent", bd: "rgba(255,255,255,.35)", fill: "#7ee0ff", fg: "#04121a", c: "#fff" },
];
const U30_STOPS = [0, 1, 2, -1].map((i) => (i < 0 ? (["off", 2] as const) : ([".u30-b", i] as const)));
function U30() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const last = useRef(0);
  useClearOn(root, last);
  usePointer(
    root,
    dot,
    (t, el) => walk(el, t, U30_STOPS, 1.0, 0.42, 0.5),
    (p, el) => hoverOne(p, el, ".u30-b", last),
  );
  return (
    <Stage r={root} g1="rgba(255,179,107,.28)" g2="rgba(126,224,255,.2)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[9%]">
        <h3 className="text-center text-[clamp(40px,4.4vw,64px)] leading-[1.02]" style={{ fontFamily: F.sy, fontWeight: 700, letterSpacing: "-0.02em" }}>
          Let&apos;s build the next one.
        </h3>
        <div className="flex gap-[clamp(18px,2vw,32px)]">
          {U30_B.map((b, i) => (
            <a
              key={b.t}
              href="#"
              onClick={(e) => e.preventDefault()}
              className={`u30-b inline-flex h-[78px] items-center gap-4 rounded-full border px-10 text-[20px] font-[600] ${i === 0 ? "on" : ""}`}
              style={{ background: b.bg, borderColor: b.bd, fontFamily: F.sg, "--fg": b.fg, "--c": b.c } as CSSProperties}
            >
              <span className="u30-f" style={{ background: b.fill }} aria-hidden />
              {b.t}
              <span className="u30-a" aria-hidden>
                →
              </span>
            </a>
          ))}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U31 · Sibling focus nav ───────────────────────── */
const U31_NAV = ["Shop", "Rooms", "Makers", "Journal", "Stores"];
const U31_CARDS = [
  { n: "Lounge chairs", p: "from ₹24,500" },
  { n: "Lighting", p: "from ₹6,900" },
  { n: "Tableware", p: "from ₹1,450" },
  { n: "Textiles", p: "from ₹2,200" },
];
const U31_STOPS: (readonly [string, number])[] = [
  [".u31-n", 1],
  [".u31-n", 3],
  [".u31-c", 0],
  [".u31-c", 2],
  [".u31-c", 3],
  ["off", 0],
];
function U31() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const lastN = useRef(-1);
  const lastC = useRef(0);
  useClearOn(root, lastC);
  usePointer(
    root,
    dot,
    (t, el) => walk(el, t, U31_STOPS, 0.95, 0.5, 0.5),
    (p, el) => {
      const n = hoverOne(p, el, ".u31-n", lastN);
      const c = hoverOne(p, el, ".u31-c", lastC);
      el.querySelector(".u31-nav")?.classList.toggle("has", n >= 0);
      el.querySelector(".u31-row")?.classList.toggle("has", c >= 0);
    },
  );
  return (
    <Stage r={root} g1="rgba(255,122,89,.3)" g2="rgba(79,141,255,.22)" top>
      <div className="absolute inset-0 flex flex-col px-[5%] py-[4%]">
        <div className="flex items-center justify-between">
          <span className="text-[24px]" style={{ fontFamily: F.fr, fontStyle: "italic" }}>
            Casa Veyra
          </span>
          <nav className="u31-nav u31-g flex gap-[clamp(20px,2.6vw,40px)] text-[clamp(17px,1.4vw,21px)] font-[500]" style={{ fontFamily: F.sg }}>
            {U31_NAV.map((l) => (
              <a key={l} href="#" onClick={(e) => e.preventDefault()} className="u31-n u31-it py-1">
                {l}
              </a>
            ))}
          </nav>
          <span className="text-[14px] text-white/60">Bag (2)</span>
        </div>
        <div className="u31-row u31-g has mt-[4%] grid flex-1 grid-cols-4 gap-[2.2%]">
          {U31_CARDS.map((c, i) => (
            <figure key={c.n} className={`u31-c u31-it relative overflow-hidden rounded-[16px] ${i === 0 ? "on" : ""}`}>
              <Img i={i + 8} w={480} h={640} />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-[9%] pt-[35%]">
                <p className="text-[20px] font-[600]" style={{ fontFamily: F.sg }}>
                  {c.n}
                </p>
                <p className="text-[14px] text-white/70">{c.p}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U32 · Words spray images on hover ───────────────────────── */
const U32_A = [
  { x: "-230px", y: "-120px", r: "-24deg" },
  { x: "-60px", y: "-175px", r: "12deg" },
  { x: "130px", y: "-140px", r: "-38deg" },
  { x: "250px", y: "-30px", r: "18deg" },
  { x: "-260px", y: "40px", r: "42deg" },
  { x: "60px", y: "120px", r: "-14deg" },
];
const U32_B = [
  { x: "-250px", y: "-90px", r: "30deg" },
  { x: "-110px", y: "-170px", r: "-16deg" },
  { x: "90px", y: "-165px", r: "22deg" },
  { x: "240px", y: "-70px", r: "-40deg" },
  { x: "-170px", y: "110px", r: "-28deg" },
  { x: "200px", y: "100px", r: "11deg" },
];
function SprayWord({ word, pics, base, on }: { word: string; pics: typeof U32_A; base: number; on?: boolean }) {
  return (
    <span className={`u32-w ${on ? "on" : ""}`}>
      {pics.map((p, i) => (
        <span key={i} className="u32-p" style={{ "--x": p.x, "--y": p.y, "--r": p.r, "--i": i } as CSSProperties} aria-hidden>
          <Img i={base + i} w={260} h={320} />
        </span>
      ))}
      <em className="relative" style={{ fontStyle: "italic" }}>
        {word}
      </em>
    </span>
  );
}
const U32_STOPS: (readonly [string, number])[] = [
  [".u32-w", 0],
  ["off", 0],
  [".u32-w", 1],
  ["off", 2],
];
function U32() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const last = useRef(0);
  useClearOn(root, last);
  usePointer(
    root,
    dot,
    (t, el) => walk(el, t, U32_STOPS, 1.05, 0.5, 0.55),
    (p, el) => hoverOne(p, el, ".u32-w", last),
  );
  return (
    <Stage r={root} g1="rgba(255,179,107,.3)" g2="rgba(150,120,255,.2)">
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="mb-6 text-[13px] uppercase tracking-[0.3em] text-white/50">Ostra guesthouse · Goa</p>
        <h3 className="text-center text-[clamp(56px,6.2vw,92px)] leading-[1.08]" style={{ fontFamily: F.fr, fontWeight: 400, letterSpacing: "-0.02em" }}>
          Rooms made for
          <br />
          <SprayWord word="slow" pics={U32_A} base={1} on /> <SprayWord word="mornings" pics={U32_B} base={7} />
        </h3>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U33 · Letter roll swap ───────────────────────── */
const U33_L = ["Work", "Studio", "Journal", "Contact"];
const U33_STOPS: (readonly [string, number])[] = [
  [".u33-l", 0],
  [".u33-l", 1],
  [".u33-l", 2],
  [".u33-l", 3],
  [".u33-l", 1],
];
function U33() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const last = useRef(-1);
  const roll = useRef<((i: number, on: boolean) => void) | null>(null);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    let dead = false;
    let splits: SplitText[] = [];
    const ctx = gsap.context(() => {}, el);
    Promise.resolve(document.fonts?.ready).then(() => {
      if (dead) return;
      ctx.add(() => {
        const links = [...el.querySelectorAll<HTMLElement>(".u33-t")];
        splits = links.map((l) => SplitText.create(l, { type: "chars", mask: "chars" }));
        splits.forEach((s) => gsap.set(s.chars, { textShadow: "0 1em 0 #ff7a59", display: "inline-block" }));
        roll.current = (i, on) => {
          const s = splits[i];
          if (!s) return;
          gsap.to(s.chars, { yPercent: on ? -100 : 0, duration: 0.5, ease: "power3.inOut", stagger: 0.03, overwrite: true });
        };
      });
    });
    return () => {
      dead = true;
      roll.current = null;
      splits.forEach((s) => gsap.killTweensOf(s.chars));
      ctx.revert();
      splits.forEach((s) => s.revert());
    };
  }, []);
  usePointer(
    root,
    dot,
    (t, el) => walk(el, t, U33_STOPS, 0.85, 0.3, 0.5),
    (p, el) => {
      const prev = last.current;
      const idx = hoverOne(p, el, ".u33-l", last);
      if (idx !== prev) {
        if (prev >= 0) roll.current?.(prev, false);
        if (idx >= 0) roll.current?.(idx, true);
      }
    },
  );
  return (
    <Stage r={root} g1="rgba(255,122,89,.3)" g2="rgba(79,141,255,.2)">
      <div className="absolute inset-0 grid grid-cols-[1fr_2fr] items-center px-[7%]">
        <div>
          <p className="text-[13px] uppercase tracking-[0.3em] text-white/50">Fold &amp; Field</p>
          <p className="mt-4 max-w-[26ch] text-[16px] leading-[1.55] text-white/60">An independent studio for identities, packaging and places. Bengaluru, since 2014.</p>
        </div>
        <nav className="flex flex-col">
          {U33_L.map((l, i) => (
            <a key={l} href="#" onClick={(e) => e.preventDefault()} className="u33-l flex items-baseline gap-6 border-b border-white/12 py-[1.2vh]">
              <span className="w-[3ch] text-[14px] text-white/45" style={{ fontFamily: F.sg }}>
                0{i + 1}
              </span>
              <span className="u33-t text-[clamp(48px,5.2vw,78px)] uppercase" style={{ fontFamily: F.sy, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.01em" }}>
                {l}
              </span>
            </a>
          ))}
        </nav>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U34 · Cursor-proximity letters ───────────────────────── */
function U34() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const st = useRef<{ chars: HTMLElement[]; cx: number[]; cy: number[]; f: number[] } | null>(null);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    let dead = false;
    let split: SplitText | null = null;
    let ro: ResizeObserver | null = null;
    const measure = () => {
      const S = st.current;
      if (!S) return;
      S.chars.forEach((c) => (c.style.transform = "none"));
      const er = el.getBoundingClientRect();
      S.chars.forEach((c, i) => {
        const r = c.getBoundingClientRect();
        S.cx[i] = r.left - er.left + r.width / 2;
        S.cy[i] = r.top - er.top + r.height / 2;
      });
    };
    Promise.resolve(document.fonts?.ready).then(() => {
      if (dead) return;
      const h = el.querySelector<HTMLElement>(".u34-h");
      if (!h) return;
      split = SplitText.create(h, { type: "words,chars" });
      const chars = split.chars as HTMLElement[];
      chars.forEach((c) => {
        c.style.display = "inline-block";
        c.style.transformOrigin = "50% 85%";
        c.style.willChange = "transform";
      });
      st.current = { chars, cx: [], cy: [], f: chars.map(() => 0) };
      measure();
      ro = new ResizeObserver(measure);
      ro.observe(el);
    });
    return () => {
      dead = true;
      ro?.disconnect();
      st.current = null;
      split?.revert();
    };
  }, []);
  usePointer(
    root,
    dot,
    (t, el) => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      return { x: w * 0.5 + Math.sin(t * 0.75) * w * 0.42, y: h * 0.5 + Math.sin(t * 1.9) * h * 0.17, inside: true };
    },
    (p, el, dt) => {
      const S = st.current;
      if (!S) return;
      const R = Math.max(130, el.clientWidth * 0.11);
      const k = Math.min(1, dt * 14);
      S.chars.forEach((c, i) => {
        const d = Math.hypot(p.x - S.cx[i], p.y - S.cy[i]);
        const target = p.inside ? Math.pow(Math.max(0, 1 - d / R), 1.6) : 0;
        S.f[i] += (target - S.f[i]) * k;
        const f = S.f[i];
        c.style.transform = `translate3d(0,${(-16 * f).toFixed(2)}px,0) scale(${(1 + 0.42 * f).toFixed(3)})`;
        // white → lime, and a heavier weight near the pointer
        c.style.color = `rgb(${Math.round(238 - 40 * f)},${Math.round(242 + 13 * f)},${Math.round(255 - 163 * f)})`;
        c.style.fontVariationSettings = `"wght" ${Math.round(400 + 220 * f)}`;
      });
    },
  );
  return (
    <Stage r={root} g1="rgba(198,255,92,.24)" g2="rgba(79,141,255,.24)">
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="mb-8 text-[13px] uppercase tracking-[0.3em] text-white/50">Lumo audio · open-back series</p>
        <h3 className="u34-h text-center text-[clamp(64px,7vw,104px)] leading-[1.06]" style={{ fontFamily: F.sg, fontWeight: 400, letterSpacing: "-0.03em" }}>
          Made to be
          <br />
          felt up close
        </h3>
        <p className="mt-8 text-[15px] text-white/50">From ₹18,900 · ships in 2 days</p>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U35 · Underline draw-through ───────────────────────── */
const U35_L = ["Read the journal", "Book a fitting", "Gift cards"];
const U35_STOPS: (readonly [string, number])[] = [
  [".u35-l", 0],
  [".u35-l", 1],
  [".u35-l", 2],
  [".u35-l", 3],
  ["off", 1],
];
function U35() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const last = useRef(0);
  useClearOn(root, last);
  usePointer(
    root,
    dot,
    (t, el) => walk(el, t, U35_STOPS, 0.95, 0.55, 0.6),
    (p, el) => hoverOne(p, el, ".u35-l", last),
  );
  return (
    <Stage r={root} g1="rgba(126,224,255,.28)" g2="rgba(255,122,89,.18)">
      <div className="absolute inset-0 grid grid-cols-[1fr_1.6fr] items-center gap-[4%] px-[7%]">
        <div>
          <p className="text-[13px] uppercase tracking-[0.3em] text-white/50">Tailor &amp; Tide</p>
          <h3 className="mt-4 text-[clamp(30px,2.8vw,42px)] leading-[1.1]" style={{ fontFamily: F.sg, fontWeight: 600 }}>
            Made to measure,
            <br />
            since 1987.
          </h3>
        </div>
        <ul className="flex flex-col gap-[3.2vh] text-[clamp(44px,4.6vw,68px)] leading-[1.1]" style={{ fontFamily: F.is }}>
          {U35_L.map((l, i) => (
            <li key={l}>
              <a href="#" onClick={(e) => e.preventDefault()} className={`u35-l ${i === 0 ? "on" : ""}`}>
                {l}
                <span className="u35-u" aria-hidden />
              </a>
            </li>
          ))}
          <li>
            <a href="#" onClick={(e) => e.preventDefault()} className="u35-l">
              Our story
              <svg className="u35-s pointer-events-none absolute left-0 top-full h-[0.3em] w-full overflow-visible" viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden>
                <path d="M2 10 Q 14 0 26 10 T 50 10 T 74 10 T 98 10 T 122 10 T 146 10 T 170 10 T 198 10" pathLength={1} fill="none" stroke="#ffb36b" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              </svg>
            </a>
          </li>
        </ul>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U36 · Pill morph island ───────────────────────── */
// sizes per state (px): music (markup start), timer, delivery card, idle pill
const U36_S = [
  { w: 520, h: 116, r: 40 },
  { w: 360, h: 60, r: 30 },
  { w: 580, h: 224, r: 46 },
  { w: 190, h: 46, r: 23 },
];
function U36() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const q = gsap.utils.selector(el);
    const isl = q(".u36-i")[0] as HTMLElement;
    const panes = q(".u36-p") as HTMLElement[];
    const bar = q(".u36-bar");
    const num = q(".u36-num")[0] as HTMLElement;
    gsap.set(panes, { autoAlpha: 0 });
    gsap.set(panes[0], { autoAlpha: 1 });
    const tl = gsap.timeline({ repeat: -1, paused: true });
    const order = [1, 2, 3, 0];
    let prev = 0;
    order.forEach((i) => {
      const s = U36_S[i];
      const from = panes[prev];
      tl.addLabel(`s${i}`)
        .to(from, { autoAlpha: 0, scale: 0.92, filter: "blur(6px)", duration: 0.22, ease: "power2.in" }, "+=0.85")
        .to(isl, { width: s.w, height: s.h, borderRadius: s.r, duration: 0.75, ease: "back.out(1.5)" }, "<0.08")
        .fromTo(panes[i], { autoAlpha: 0, scale: 1.06, filter: "blur(6px)" }, { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.35, ease: "power2.out" }, "<0.25");
      if (i === 2) tl.fromTo(bar, { scaleX: 0.15 }, { scaleX: 0.72, duration: 1.3, ease: "power1.inOut" }, "<");
      if (i === 1) {
        const o = { v: 252 };
        tl.to(o, { v: 248, duration: 1.2, ease: "none", onUpdate: () => (num.textContent = `0${Math.floor(o.v / 60)}:${String(Math.floor(o.v % 60)).padStart(2, "0")}`) }, "<");
      }
      prev = i;
    });
    const click = () => {
      const n = tl.nextLabel();
      tl.seek(n ?? 0);
    };
    isl.addEventListener("click", click);
    onClean(() => isl.removeEventListener("click", click));
    return tl;
  });
  const pane = "u36-p absolute inset-0 flex items-center";
  return (
    <Stage r={root} g1="rgba(150,120,255,.32)" g2="rgba(255,179,107,.2)">
      <div className="absolute inset-0 flex flex-col items-center pt-[9%]">
        <div className="u36-i relative cursor-pointer overflow-hidden bg-black shadow-[0_30px_70px_rgba(0,0,0,.6),0_0_0_1px_rgba(255,255,255,.08)]" style={{ width: U36_S[0].w, height: U36_S[0].h, borderRadius: U36_S[0].r }}>
          {/* 0 · music */}
          <div className={`${pane} gap-5 px-6`}>
            <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[16px]">
              <Img i={12} w={160} h={160} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] uppercase tracking-[0.18em] text-white/50">Now playing</p>
              <p className="truncate text-[22px] font-[600]" style={{ fontFamily: F.sg }}>
                Night Ferry
              </p>
              <p className="text-[14px] text-white/60">Lune Atlas</p>
            </div>
            <div className="b4g3u-eq flex h-[34px] items-end gap-[4px]">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} style={{ height: 34, animationDelay: `${-i * 0.23}s` }} />
              ))}
            </div>
          </div>
          {/* 1 · timer */}
          <div className={`${pane} justify-between px-5`} style={{ visibility: "hidden" }}>
            <span className="flex items-center gap-3 text-[15px] text-white/80" style={{ fontFamily: F.sg }}>
              <svg className="b4g3u-spin" width="22" height="22" viewBox="0 0 22 22" aria-hidden>
                <circle cx="11" cy="11" r="8.5" fill="none" stroke="rgba(255,179,107,.25)" strokeWidth="3" />
                <path d="M11 2.5a8.5 8.5 0 0 1 8.5 8.5" fill="none" stroke="#ffb36b" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Dough proofing
            </span>
            <span className="u36-num text-[22px] font-[600] tabular-nums text-[#ffb36b]" style={{ fontFamily: F.sg }}>
              04:12
            </span>
          </div>
          {/* 2 · delivery card */}
          <div className={`${pane} flex-col !items-stretch justify-between p-7`} style={{ visibility: "hidden" }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[13px] uppercase tracking-[0.18em] text-white/50">Corner Bakehouse</p>
                <p className="mt-1 text-[28px] leading-tight" style={{ fontFamily: F.fr }}>
                  Your order is on the way
                </p>
              </div>
              <p className="text-right text-[34px] font-[600] leading-none text-[#c6ff5c]" style={{ fontFamily: F.sg }}>
                12<span className="text-[14px] text-white/60"> min</span>
              </p>
            </div>
            <div>
              <div className="h-[6px] overflow-hidden rounded-full bg-white/12">
                <div className="u36-bar h-full w-full origin-left rounded-full bg-[#c6ff5c]" style={{ transform: "scaleX(.6)" }} />
              </div>
              <div className="mt-3 flex justify-between text-[14px] text-white/60">
                <span>Rider · Arjun</span>
                <span>3 items · ₹1,240</span>
              </div>
            </div>
          </div>
          {/* 3 · idle pill */}
          <div className={`${pane} justify-center gap-2`} style={{ visibility: "hidden" }}>
            <span className="h-[9px] w-[9px] rounded-full bg-[#3ddc97] shadow-[0_0_10px_#3ddc97]" />
            <span className="text-[14px] font-[600] text-white/85" style={{ fontFamily: F.sg }}>
              Live
            </span>
          </div>
        </div>
        <p className="mt-auto mb-[8%] text-[clamp(28px,2.6vw,40px)]" style={{ fontFamily: F.fr }}>
          One pill, <span className="italic text-[#c9b8ff]">every state.</span>
        </p>
      </div>
    </Stage>
  );
}

/* ───────────────────────── U37 · Auto-advancing tabs with progress ───────────────────────── */
const U37_T = [
  { t: "Design", d: "Sketch rooms in 3D with your stylist, live.", c: "#ffb36b" },
  { t: "Source", d: "Pick from 2,400 finishes, sampled to your door.", c: "#7ee0ff" },
  { t: "Craft", d: "Built by hand in our Jodhpur workshop.", c: "#c6ff5c" },
  { t: "Deliver", d: "White-glove install in 6 weeks, ₹0 extra.", c: "#c9b8ff" },
];
function U37() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const q = gsap.utils.selector(el);
    const tabs = q(".u37-tab") as HTMLElement[];
    const bars = q(".u37-bar") as HTMLElement[];
    const panes = q(".u37-pane") as HTMLElement[];
    const N = tabs.length;
    const PER = 1.7;
    let cur = -1;
    gsap.set(bars, { scaleX: 0 });
    gsap.set(panes, { autoAlpha: 0 });
    const show = (i: number) => {
      if (i === cur) return;
      const old = panes[cur];
      cur = i;
      tabs.forEach((t, k) => t.classList.toggle("text-white", k === i));
      tabs.forEach((t, k) => t.classList.toggle("text-white/45", k !== i));
      if (old) gsap.to(old, { autoAlpha: 0, y: -16, scale: 0.98, duration: 0.35, ease: "power2.in", overwrite: true });
      gsap.fromTo(panes[i], { autoAlpha: 0, y: 26, scale: 1.03 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, delay: 0.12, ease: "power3.out", overwrite: true });
    };
    const o = { p: 0 };
    const tw = gsap.to(o, {
      p: N,
      duration: N * PER,
      ease: "none",
      repeat: -1,
      paused: true,
      onUpdate: () => {
        const i = Math.min(N - 1, Math.floor(o.p));
        show(i);
        bars.forEach((b, k) => gsap.set(b, { scaleX: k === i ? o.p - i : 0 }));
      },
    });
    const clicks = tabs.map((t, i) => {
      const fn = () => tw.progress(i / N);
      t.addEventListener("click", fn);
      return () => t.removeEventListener("click", fn);
    });
    onClean(() => clicks.forEach((f) => f()));
    return tw;
  });
  return (
    <Stage r={root} g1="rgba(126,224,255,.26)" g2="rgba(255,179,107,.22)" top>
      <div className="absolute inset-0 flex flex-col px-[6%] py-[4.5%]">
        <div className="flex items-end justify-between">
          <h3 className="text-[clamp(32px,3.2vw,48px)] leading-none" style={{ fontFamily: F.sg, fontWeight: 600, letterSpacing: "-0.02em" }}>
            How a Neem &amp; Oak room comes together
          </h3>
        </div>
        <div className="mt-[3.5%] grid grid-cols-4 gap-[2.5%]">
          {U37_T.map((t, i) => (
            <button key={t.t} type="button" className={`u37-tab text-left transition-colors duration-300 ${i === 0 ? "text-white" : "text-white/45"}`}>
              <div className="h-[3px] overflow-hidden rounded-full bg-white/15">
                <div className="u37-bar h-full w-full origin-left rounded-full" style={{ background: t.c, transform: i === 0 ? "scaleX(1)" : "scaleX(0)" }} />
              </div>
              <p className="mt-3 text-[13px] tracking-[0.18em] opacity-70">0{i + 1}</p>
              <p className="mt-1 text-[22px] font-[600]" style={{ fontFamily: F.sg }}>
                {t.t}
              </p>
            </button>
          ))}
        </div>
        <div className="relative mt-[3%] flex-1">
          {U37_T.map((t, i) => (
            <div key={t.t} className="u37-pane absolute inset-0 grid grid-cols-[1.5fr_1fr] gap-[3%]" style={i === 0 ? undefined : { visibility: "hidden" }}>
              <div className="relative overflow-hidden rounded-[20px]">
                <Img i={i + 14} w={900} h={520} />
                <span className="absolute left-5 top-5 rounded-full px-4 py-2 text-[13px] font-[700] uppercase tracking-[0.14em] text-[#0a0d16]" style={{ background: t.c }}>
                  Step 0{i + 1}
                </span>
              </div>
              <div className="flex flex-col justify-between rounded-[20px] border border-white/10 bg-white/[0.04] p-[8%]">
                <p className="text-[clamp(28px,2.6vw,40px)] leading-[1.08]" style={{ fontFamily: F.fr }}>
                  {t.d}
                </p>
                <div className="flex items-center gap-3 text-[14px] text-white/60">
                  <span className="h-[10px] w-[10px] rounded-full" style={{ background: t.c }} />
                  {t.t} · included in every room
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  {
    code: "U26",
    name: "Custom cursor pill that expands over target",
    how: "A small blurred cursor dot springs after the pointer; over a tile it grows into a labelled pill (View / Shop / Play). A scripted figure-eight drives it.",
    kind: "play",
    C: U26,
  },
  {
    code: "U27",
    name: "Cursor spotlight inside card",
    how: "A large soft light follows the pointer inside a pricing card with a spring and fades out when the pointer leaves. A scripted figure-eight drives it.",
    kind: "play",
    C: U27,
  },
  {
    code: "U28",
    name: "Underline from centre + lift",
    how: "Hovering a nav link lifts it 2px while an underline grows from the centre outward (expo-out). A fake pointer walks the links.",
    kind: "play",
    C: U28,
  },
  {
    code: "U29",
    name: "Status button (idle-loading-success)",
    how: "A click shrinks the button to a spinner, then it widens to a drawn check (success) or shakes red (error). Auto-clicked on a loop.",
    kind: "play",
    C: U29,
  },
  {
    code: "U30",
    name: "Rising fill button",
    how: "On hover a rounded fill block rises from below into the button and the label flips colour. A fake pointer walks the three buttons.",
    kind: "play",
    C: U30,
  },
  {
    code: "U31",
    name: "Sibling focus nav",
    how: "The hovered nav link or card stays sharp while its siblings blur and dim; leaving restores all. A fake pointer walks nav and cards.",
    kind: "play",
    C: U31,
  },
  {
    code: "U32",
    name: "Words spray images on hover",
    how: "Small photos tucked behind a word spring out and scatter with random tilts on hover, then tuck back. A fake pointer visits two words.",
    kind: "play",
    C: U32,
  },
  {
    code: "U33",
    name: "Letter roll swap",
    how: "On hover each letter rolls up out of its mask as an accent copy rolls in from below, staggered left to right. A fake pointer walks the menu.",
    kind: "play",
    C: U33,
  },
  {
    code: "U34",
    name: "Cursor-proximity letters",
    how: "Letters near the pointer lift, grow, thicken and turn lime, falling off with distance (~150px). A scripted sweep crosses the headline.",
    kind: "play",
    C: U34,
  },
  {
    code: "U35",
    name: "Underline draw-through",
    how: "A link underline grows in from the left on hover and exits to the right on leave; the last link draws an SVG squiggle. A fake pointer walks the links.",
    kind: "play",
    C: U35,
  },
  {
    code: "U36",
    name: "Pill morph island",
    how: "A black pill springs between sizes (now playing → timer → delivery card → idle pill) while its contents crossfade. Loops on a timer; click to skip.",
    kind: "play",
    C: U36,
  },
  {
    code: "U37",
    name: "Auto-advancing tabs with progress",
    how: "Feature tabs advance by themselves while a bar fills under the active tab and the illustration swaps. Click a tab to jump.",
    kind: "play",
    C: U37,
  },
];
