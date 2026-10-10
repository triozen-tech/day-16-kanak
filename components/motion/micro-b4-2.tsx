"use client";

// Micro-interactions, batch 4 · group 2 (MOTION-MENU U14–U25). Small focused demos for /lab/motion.
// Every hover demo plays by itself: a visible fake pointer (ring) walks a scripted path and drives the hover state;
// the real mouse takes over for 2.5 s whenever it moves. A CSS-only glow loop never stops (and sits on top of photos).
// ?static=1 / reduced motion: no JS runs, each demo shows a sensible final state written in the markup.
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

const CSS = `
.b4g2u-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.42)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.2)),transparent 70%);animation:b4g2u-drift 5.8s linear infinite alternate;will-change:transform}
@keyframes b4g2u-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b4g2u-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4);pointer-events:none;z-index:60;opacity:0;transition:opacity .25s}
.u16-btn{color:#f4efe6;transition:color .35s cubic-bezier(.4,0,.2,1)}
.u16-btn.on,.u16-btn:hover{color:#0b0d14}
.u16-btn .u16-arr{display:inline-block;transition:transform .45s cubic-bezier(.2,.7,.2,1)}
.u16-btn.on .u16-arr,.u16-btn:hover .u16-arr{transform:translateX(8px)}
.u20-pill .u20-dot{transition:transform .3s cubic-bezier(.4,0,.2,1)}
.u20-pill .u20-a,.u20-pill .u20-b{transition:transform .3s cubic-bezier(.4,0,.2,1),opacity .3s cubic-bezier(.4,0,.2,1)}
.u20-pill .u20-b{transform:translateX(48px);opacity:0}
.u20-pill.on .u20-dot,.u20-pill:hover .u20-dot{transform:scale(70)}
.u20-pill.on .u20-a,.u20-pill:hover .u20-a{transform:translateX(48px);opacity:0}
.u20-pill.on .u20-b,.u20-pill:hover .u20-b{transform:translateX(0);opacity:1}
.u21-ring,.u21-spot{opacity:var(--o,0)}
.u21-ring{background:radial-gradient(260px circle at var(--x,50%) var(--y,30%),#a78bff,rgba(167,139,255,.25) 45%,transparent 75%)}
.u21-spot{background:radial-gradient(320px circle at var(--x,50%) var(--y,30%),rgba(167,139,255,.2),transparent 70%)}
.u23-link{background-image:linear-gradient(#ffb36b,#ffb36b);background-size:100% 2px;background-position:0 100%;background-repeat:no-repeat;transition:color .35s,background-size .35s}
.u23-link.on{color:#ffb36b;background-size:100% 4px}
.u24-scroll::-webkit-scrollbar{display:none}
.u25-tab{transition:color .3s}
.u25-tab.on{color:#fff}
.u19-item{transition:color .3s,transform .4s cubic-bezier(.2,.7,.2,1)}
.u19-item.on{color:#b0532b;transform:translateX(14px)}
html.is-static .b4g2u-glow{animation:none}
html.is-static {
  .b4g2u-glow{animation:none}
  .u16-btn,.u16-btn .u16-arr,.u20-pill .u20-dot,.u20-pill .u20-a,.u20-pill .u20-b,.u23-link,.u25-tab,.u19-item{transition:none}
}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0d16] text-[#eef2ff] ${className}`}>
      <style href="b4g2u-css" precedence="default">
        {CSS}
      </style>
      <div className="b4g2u-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/** The glow loop again ON TOP (screen blend) for demos where photos or panels cover most of the stage. */
const Sheen = ({ g1 }: { g1?: string }) => (
  <div className="b4g2u-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.45, zIndex: 35 } as CSSProperties} aria-hidden />
);

/** The visible fake pointer (a ring). */
const Dot = ({ r }: { r: RefObject<HTMLDivElement | null> }) => <div ref={r} className="b4g2u-dot" aria-hidden />;

/** "play" helper: builds a looping animation after fonts load, plays it only while on screen, reverts on unmount. */
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

type Pt = { x: number; y: number; inside: boolean };
type PtFrame = Pt & { vx: number; vy: number; real: boolean };

/** Pointer driver: the real mouse wins for 2.5 s after it last moved; otherwise `script(t, root)` moves the fake ring. */
function usePointer(
  root: RefObject<HTMLDivElement | null>,
  dot: RefObject<HTMLDivElement | null>,
  script: (t: number, el: HTMLDivElement) => Pt,
  frame: (p: PtFrame, dt: number, el: HTMLDivElement) => void,
) {
  const real = useRef({ x: 0, y: 0, inside: false, at: -1e9 });
  const sc = useRef(script);
  sc.current = script;
  const fr = useRef(frame);
  fr.current = frame;
  const last = useRef({ x: 0, y: 0, t0: -1 });
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
    const L = last.current;
    if (L.t0 < 0) L.t0 = t;
    const R = real.current;
    const useReal = performance.now() - R.at < 2500;
    const p = useReal ? { x: R.x, y: R.y, inside: R.inside } : sc.current(t - L.t0, el);
    const d = Math.max(dt, 1 / 240);
    const vx = (p.x - L.x) / d;
    const vy = (p.y - L.y) / d;
    L.x = p.x;
    L.y = p.y;
    const dn = dot.current;
    if (dn) {
      dn.style.transform = `translate3d(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px,0)`;
      dn.style.opacity = useReal ? "0" : "1";
    }
    fr.current({ ...p, vx, vy, real: useReal }, Math.min(dt, 0.1), el);
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

/** An element's box relative to the root. */
function rel(node: Element, root: Element) {
  const a = node.getBoundingClientRect();
  const r = root.getBoundingClientRect();
  return { l: a.left - r.left, t: a.top - r.top, w: a.width, h: a.height };
}

/** Index of the first element under (x, y), or -1. */
function hit(nodes: Element[], root: Element, x: number, y: number) {
  return nodes.findIndex((n) => {
    const b = rel(n, root);
    return x >= b.l && x <= b.l + b.w && y >= b.t && y <= b.t + b.h;
  });
}

const centre = (n: Element, root: Element, fx = 0.5, fy = 0.5): [number, number] => {
  const b = rel(n, root);
  return [b.l + b.w * fx, b.t + b.h * fy];
};
const all = (el: Element, sel: string) => [...el.querySelectorAll(sel)] as HTMLElement[];
const wob = (t: number, a = 9): [number, number] => [Math.sin(t * 2.1) * a, Math.cos(t * 1.7) * a * 0.8];

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, className = "", w = 600, h = 800 }: { i: number; className?: string; w?: number; h?: number }) => (
  <img src={scene(i, w, h)} alt="" className={`block h-full w-full object-cover ${className}`} draggable={false} />
);

/* ───────────────────────── U14 · Background scale on menu hover ───────────────────────── */
const U14_ITEMS = [
  { t: "Rooms", s: "Twelve suites over the bay", i: 3 },
  { t: "Table", s: "Tasting menu · ₹6,800", i: 7 },
  { t: "Spa", s: "Salt & cedar rituals", i: 11 },
  { t: "Journeys", s: "Boats at first light", i: 15 },
];
function U14() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const active = useRef(-2);
  const z = useRef(1);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    gsap.set(all(el, ".u14-bg"), { autoAlpha: 0 });
    return () => {
      gsap.killTweensOf(all(el, ".u14-bg, .u14-bg img, .u14-item"));
    };
  }, []);
  usePointer(
    root,
    dot,
    (t, el) => {
      const items = all(el, ".u14-item");
      const pts: [number, number][] = items.map((n) => centre(n, el, 0.32, 0.5));
      pts.push([el.clientWidth * 0.84, el.clientHeight * 0.88]);
      const [x, y] = stepPath(t, pts, 0.95, 0.38);
      const [wx, wy] = wob(t);
      return { x: x + wx, y: y + wy, inside: true };
    },
    (p, _dt, el) => {
      const items = all(el, ".u14-item");
      const idx = p.inside ? hit(items, el, p.x, p.y) : -1;
      if (idx === active.current) return;
      active.current = idx;
      const bgs = all(el, ".u14-bg");
      if (idx >= 0) {
        const bg = bgs[idx];
        bg.style.zIndex = String(++z.current);
        gsap.killTweensOf(bg);
        gsap.fromTo(bg, { autoAlpha: 1, clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: "expo.out" });
        gsap.fromTo(bg.querySelector("img"), { scale: 1.07 }, { scale: 1, duration: 1.6, ease: "expo.out" });
        gsap.to(
          bgs.filter((_, i) => i !== idx),
          { autoAlpha: 0, duration: 0.4, delay: 0.5, overwrite: true },
        );
      } else {
        gsap.to(bgs, { autoAlpha: 0, duration: 0.6, overwrite: true });
      }
      items.forEach((n, i) => gsap.to(n, { opacity: idx < 0 || i === idx ? 1 : 0.32, x: i === idx ? 22 : 0, duration: 0.55, ease: "power3.out", overwrite: true }));
    },
  );
  return (
    <Stage r={root} g1="rgba(255,190,130,.38)" g2="rgba(79,141,255,.2)">
      {/* isolated layer: the growing z-index of the newest photo never climbs over the scrim and the menu */}
      <div className="absolute inset-0 isolate" style={{ zIndex: 0 }} aria-hidden>
        {U14_ITEMS.map((m, i) => (
          <div key={m.t} className="u14-bg absolute inset-0 overflow-hidden" style={{ visibility: i === 0 ? "visible" : "hidden", opacity: i === 0 ? 1 : 0 }}>
            <Img i={m.i} w={1400} h={800} />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10" style={{ zIndex: 20 }} aria-hidden />
      <div className="absolute inset-0 flex flex-col justify-center px-[7%]" style={{ zIndex: 30 }}>
        <p className="mb-4 text-[13px] uppercase tracking-[0.24em] text-white/60">Casa Ondina · Menu</p>
        <ul>
          {U14_ITEMS.map((m) => (
            <li key={m.t} className="u14-item flex w-fit items-baseline gap-6 py-[clamp(4px,1vh,10px)]" data-cursor="Open">
              <span className="text-[clamp(52px,6vw,96px)] leading-[1] tracking-[-0.02em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
                {m.t}
              </span>
              <span className="text-[15px] text-white/70" style={{ fontFamily: F.mr }}>
                {m.s}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <Sheen g1="rgba(255,200,150,.4)" />
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U15 · Menu hover image follow ───────────────────────── */
const U15_ITEMS = [
  { t: "Linen shirts", n: "24 pieces", i: 2 },
  { t: "Raw denim", n: "11 pieces", i: 6 },
  { t: "Field jackets", n: "8 pieces", i: 10 },
  { t: "Knitwear", n: "17 pieces", i: 14 },
  { t: "Leather goods", n: "9 pieces", i: 18 },
];
function U15() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const st = useRef({ x: 0, y: 0, r: 0, idx: -2, init: false });
  usePointer(
    root,
    dot,
    (t, el) => {
      const list = el.querySelector(".u15-list")!;
      const b = rel(list, el);
      return { x: b.l + b.w * (0.5 + 0.3 * Math.sin(t * 0.75)), y: b.t + b.h * (0.5 + 0.58 * Math.sin(t * 1.5)), inside: true };
    },
    (p, dt, el) => {
      const S = st.current;
      const wrap = el.querySelector<HTMLElement>(".u15-float")!;
      const card = el.querySelector<HTMLElement>(".u15-card")!;
      if (!S.init) {
        S.x = p.x;
        S.y = p.y;
        S.init = true;
      }
      const k = 1 - Math.exp(-dt * 9);
      S.x += (p.x - S.x) * k;
      S.y += (p.y - S.y) * k;
      const rt = gsap.utils.clamp(-16, 16, p.vx * 0.014);
      S.r += (rt - S.r) * (1 - Math.exp(-dt * 6));
      wrap.style.transform = `translate3d(${(S.x - wrap.offsetWidth / 2).toFixed(1)}px,${(S.y - wrap.offsetHeight / 2).toFixed(1)}px,0) rotate(${S.r.toFixed(2)}deg)`;
      const rows = all(el, ".u15-row");
      const idx = p.inside ? hit(rows, el, p.x, p.y) : -1;
      if (idx === S.idx) return;
      const was = S.idx;
      S.idx = idx;
      rows.forEach((r, i) => r.classList.toggle("text-[#ffb36b]", i === idx));
      rows.forEach((r, i) => gsap.to(r, { opacity: idx < 0 || i === idx ? 1 : 0.4, duration: 0.4, overwrite: true }));
      if (idx >= 0) {
        all(el, ".u15-img").forEach((im, i) => (im.style.opacity = i === idx ? "1" : "0"));
        if (was < 0) gsap.fromTo(card, { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.5, ease: "power3.out", overwrite: true });
        gsap.fromTo(card, { filter: "brightness(1.9)" }, { filter: "brightness(1)", duration: 0.7, ease: "power2.out" });
      } else {
        gsap.to(card, { scale: 0.6, autoAlpha: 0, duration: 0.35, ease: "power2.in", overwrite: true });
      }
    },
  );
  return (
    <Stage r={root} g1="rgba(255,179,107,.32)" g2="rgba(120,160,255,.22)">
      <div className="absolute inset-0 grid place-items-center">
        <div className="w-[min(80%,1040px)]">
          <p className="mb-3 text-[13px] uppercase tracking-[0.22em] text-white/55">Fold & Field · Shop by category</p>
          <ul className="u15-list border-t border-white/15">
            {U15_ITEMS.map((m) => (
              <li key={m.t} className="u15-row flex items-baseline justify-between border-b border-white/15 py-[clamp(8px,1.6vh,16px)]" data-cursor="Shop">
                <span className="text-[clamp(38px,4.4vw,70px)] font-[600] leading-[1] tracking-[-0.025em]" style={{ fontFamily: F.sg }}>
                  {m.t}
                </span>
                <span className="text-[14px] text-white/60" style={{ fontFamily: F.mr }}>
                  {m.n}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="u15-float pointer-events-none absolute left-0 top-0 h-[260px] w-[200px]" style={{ zIndex: 30 }} aria-hidden>
        <div className="u15-card relative h-full w-full overflow-hidden rounded-[12px] shadow-[0_30px_60px_rgba(0,0,0,.5)]" style={{ visibility: "hidden", opacity: 0 }}>
          {U15_ITEMS.map((m, i) => (
            <div key={m.t} className="u15-img absolute inset-0" style={{ opacity: i === 0 ? 1 : 0 }}>
              <Img i={m.i} w={400} h={520} />
            </div>
          ))}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U16 · Skewed fill slide-in button ───────────────────────── */
const U16_BTNS = [
  { t: "Reserve a table", c: "#ffb36b" },
  { t: "See the menu", c: "#9fd8c4" },
];
function U16() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const active = useRef(-2);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const fills = all(el, ".u16-fill");
    gsap.set(fills, { x: 0, xPercent: -110, skewX: -20 });
    all(el, ".u16-btn").forEach((b) => b.classList.remove("on"));
    return () => {
      gsap.killTweensOf(fills);
    };
  }, []);
  usePointer(
    root,
    dot,
    (t, el) => {
      const b = all(el, ".u16-btn");
      const pts: [number, number][] = [centre(b[0], el, 0.35), centre(b[0], el, 0.7), centre(b[1], el, 0.4), centre(b[1], el, 0.65, 1.9), [el.clientWidth * 0.5, el.clientHeight * 0.82]];
      const [x, y] = stepPath(t, pts, 0.9, 0.4);
      const [wx, wy] = wob(t, 6);
      return { x: x + wx, y: y + wy, inside: true };
    },
    (p, _dt, el) => {
      const btns = all(el, ".u16-btn");
      const idx = p.inside ? hit(btns, el, p.x, p.y) : -1;
      if (idx === active.current) return;
      const was = active.current;
      active.current = idx;
      btns.forEach((b, i) => b.classList.toggle("on", i === idx));
      const fills = all(el, ".u16-fill");
      if (was >= 0) gsap.to(fills[was], { xPercent: 110, skewX: -20, duration: 0.5, ease: "power3.in", overwrite: true });
      if (idx >= 0) gsap.fromTo(fills[idx], { xPercent: -110, skewX: -20 }, { xPercent: 0, skewX: 0, duration: 0.55, ease: "power3.out", overwrite: true });
    },
  );
  return (
    <Stage r={root} g1="rgba(255,179,107,.36)" g2="rgba(159,216,196,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-10">
        <div className="text-center">
          <p className="text-[13px] uppercase tracking-[0.24em] text-white/55">Ember Room · Bandra</p>
          <h3 className="mt-3 text-[clamp(40px,4.4vw,68px)] leading-[1]" style={{ fontFamily: F.is }}>
            Dinner, slowly.
          </h3>
        </div>
        <div className="flex gap-7">
          {U16_BTNS.map((b, i) => (
            <button
              key={b.t}
              type="button"
              className={`u16-btn relative overflow-hidden rounded-[14px] border-2 px-[52px] py-[28px] text-[clamp(22px,1.9vw,28px)] font-[600] ${i === 0 ? "on" : ""}`}
              style={{ borderColor: b.c, fontFamily: F.sg }}
              data-cursor="Book"
            >
              <span className="u16-fill absolute inset-y-[-4px] left-[-14%] w-[128%]" style={{ background: b.c, transform: i === 0 ? "none" : "translateX(-110%) skewX(-20deg)" }} aria-hidden />
              <span className="relative z-[1] flex items-center gap-4">
                {b.t} <span className="u16-arr">→</span>
              </span>
            </button>
          ))}
        </div>
        <p className="text-[14px] text-white/55">Tasting menu ₹4,200 · seven courses</p>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U17 · 3D rolling letters menu ───────────────────────── */
const U17_ITEMS = [
  { t: "Ceramics", i: 4 },
  { t: "Lighting", i: 8 },
  { t: "Textiles", i: 12 },
  { t: "Objects", i: 16 },
];
function U17() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const active = useRef(-2);
  const tls = useRef<gsap.core.Timeline[]>([]);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const figs = all(el, ".u17-fig");
      gsap.set(figs, { autoAlpha: 0 });
      tls.current = all(el, ".u17-item").map((it) => {
        const fs = parseFloat(getComputedStyle(it.querySelector(".u17-word")!).fontSize) || 80;
        const origin = `50% 50% ${(-fs * 0.42).toFixed(1)}px`;
        const fr = it.querySelectorAll(".u17-f");
        const bk = it.querySelectorAll(".u17-b");
        gsap.set(fr, { transformOrigin: origin, rotationX: 0 });
        gsap.set(bk, { transformOrigin: origin, rotationX: 90 });
        return gsap
          .timeline({ paused: true })
          .to(fr, { rotationX: -90, duration: 0.5, stagger: 0.025, ease: "power3.inOut" }, 0)
          .to(bk, { rotationX: 0, duration: 0.5, stagger: 0.025, ease: "power3.inOut" }, 0);
      });
    }, el);
    return () => ctx.revert();
  }, []);
  usePointer(
    root,
    dot,
    (t, el) => {
      const items = all(el, ".u17-item");
      const pts: [number, number][] = [0, 2, 1, 3].map((i) => centre(items[i], el, 0.4));
      pts.push([el.clientWidth * 0.5, el.clientHeight * 0.92]);
      const [x, y] = stepPath(t, pts, 1.0, 0.38);
      const [wx, wy] = wob(t, 8);
      return { x: x + wx, y: y + wy, inside: true };
    },
    (p, _dt, el) => {
      const items = all(el, ".u17-item");
      const idx = p.inside ? hit(items, el, p.x, p.y) : -1;
      if (idx === active.current) return;
      active.current = idx;
      tls.current.forEach((tl, i) => (i === idx ? tl.play() : tl.reverse()));
      const figs = all(el, ".u17-fig");
      figs.forEach((f, i) => {
        if (i === idx) {
          gsap.fromTo(f, { autoAlpha: 1, scale: 0.5 }, { scale: 1, duration: 0.9, ease: "expo.out", overwrite: true });
          gsap.fromTo(f.querySelector("img"), { scaleX: 2 }, { scaleX: 1, duration: 0.9, ease: "expo.out", overwrite: true });
        } else gsap.to(f, { autoAlpha: 0, duration: 0.35, overwrite: true });
      });
    },
  );
  return (
    <Stage r={root} g1="rgba(214,255,120,.26)" g2="rgba(79,141,255,.24)">
      <div className="absolute inset-0 grid grid-cols-[1.35fr_1fr] items-center gap-[4%] px-[6%]">
        <ul>
          {U17_ITEMS.map((m) => (
            <li key={m.t} className="u17-item w-fit py-[clamp(4px,1vh,10px)]" style={{ perspective: "700px" }} data-cursor="View">
              <span className="u17-word flex text-[clamp(48px,5.4vw,88px)] font-[700] uppercase leading-[1.02] tracking-[-0.01em]" style={{ fontFamily: F.sy }} aria-label={m.t}>
                {m.t.split("").map((c, i) => (
                  <span key={i} className="relative inline-block" style={{ transformStyle: "preserve-3d" }} aria-hidden>
                    <span className="u17-f inline-block" style={{ backfaceVisibility: "hidden" }}>
                      {c}
                    </span>
                    <span className="u17-b absolute left-0 top-0 inline-block text-[#d6ff78]" style={{ backfaceVisibility: "hidden", transform: "rotateX(90deg)" }}>
                      {c}
                    </span>
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
        <div className="relative mx-auto aspect-[4/5] w-[min(100%,340px)]">
          {U17_ITEMS.map((m, i) => (
            <figure key={m.t} className="u17-fig absolute inset-0 overflow-hidden rounded-[18px]" style={{ visibility: i === 0 ? "visible" : "hidden", opacity: i === 0 ? 1 : 0 }}>
              <Img i={m.i} w={480} h={600} />
              <figcaption className="absolute bottom-3 left-4 text-[13px] uppercase tracking-[0.2em] text-white/90">{m.t} · from ₹1,450</figcaption>
            </figure>
          ))}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U18 · Grid item reveal on hover ───────────────────────── */
const DIRS = { left: "inset(0% 100% 0% 0%)", right: "inset(0% 0% 0% 100%)", top: "inset(0% 0% 100% 0%)", bottom: "inset(100% 0% 0% 0%)" } as const;
type Dir = keyof typeof DIRS;
const U18_CELLS: { t: string; n: string; i: number; d: [Dir, Dir, Dir] }[] = [
  { t: "Sofas", n: "38 pieces", i: 1, d: ["left", "top", "bottom"] },
  { t: "Lamps", n: "22 pieces", i: 5, d: ["top", "right", "left"] },
  { t: "Rugs", n: "16 pieces", i: 9, d: ["bottom", "left", "top"] },
  { t: "Tables", n: "27 pieces", i: 13, d: ["right", "bottom", "top"] },
  { t: "Chairs", n: "41 pieces", i: 17, d: ["top", "left", "right"] },
  { t: "Vases", n: "19 pieces", i: 21, d: ["left", "bottom", "right"] },
];
function U18() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const active = useRef(-2);
  const shown = useRef(0);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    gsap.set(all(el, ".u18-panel"), { autoAlpha: 0 });
    shown.current = -1;
    return () => gsap.killTweensOf(all(el, ".u18-panel, .u18-panel *"));
  }, []);
  usePointer(
    root,
    dot,
    (t, el) => {
      const cells = all(el, ".u18-cell");
      const pts: [number, number][] = [0, 4, 2, 3, 5, 1].map((i) => centre(cells[i], el));
      const [x, y] = stepPath(t, pts, 1.1, 0.36);
      const [wx, wy] = wob(t, 10);
      return { x: x + wx, y: y + wy, inside: true };
    },
    (p, _dt, el) => {
      const cells = all(el, ".u18-cell");
      const idx = p.inside ? hit(cells, el, p.x, p.y) : -1;
      if (idx === active.current) return;
      active.current = idx;
      cells.forEach((c, i) => gsap.to(c, { backgroundColor: i === idx ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0)", duration: 0.4, overwrite: true }));
      if (idx < 0 || idx === shown.current) return;
      shown.current = idx;
      const panels = all(el, ".u18-panel");
      panels.forEach((pn, i) => {
        if (i !== idx) {
          gsap.to(pn, { autoAlpha: 0, duration: 0.3, overwrite: true });
          return;
        }
        gsap.set(pn, { autoAlpha: 1, zIndex: 2 });
        gsap.fromTo(pn.querySelector(".u18-title"), { opacity: 0, scale: 0.88 }, { opacity: 1, scale: 1, duration: 0.7, ease: "power3.out" });
        all(pn, ".u18-ph").forEach((ph, j) => {
          const d = U18_CELLS[idx].d[j];
          gsap.fromTo(ph, { clipPath: DIRS[d] }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.85, delay: 0.06 * j, ease: "expo.out" });
          gsap.fromTo(ph.querySelector("img"), { scale: 1.5, filter: "brightness(2)" }, { scale: 1, filter: "brightness(1)", duration: 1.1, delay: 0.06 * j, ease: "expo.out" });
        });
      });
    },
  );
  return (
    <Stage r={root} g1="rgba(255,150,110,.5)" g2="rgba(120,170,255,.24)">
      <Sheen g1="rgba(255,150,110,.55)" />
      <div className="absolute inset-0 grid grid-cols-[1fr_1.1fr] gap-[4%] p-[4%]">
        <div className="grid grid-cols-2 grid-rows-3 border-l border-t border-white/15">
          {U18_CELLS.map((c, i) => (
            <div key={c.t} className="u18-cell flex flex-col justify-between border-b border-r border-white/15 p-[8%]" data-cursor="Open">
              <span className="text-[13px] text-white/50" style={{ fontFamily: F.mr }}>
                0{i + 1}
              </span>
              <div>
                <p className="text-[clamp(26px,2.4vw,38px)] font-[600] leading-[1]" style={{ fontFamily: F.sg }}>
                  {c.t}
                </p>
                <p className="mt-1 text-[13px] text-white/55">{c.n}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="relative">
          {U18_CELLS.map((c, i) => (
            <div key={c.t} className="u18-panel absolute inset-0" style={{ visibility: i === 0 ? "visible" : "hidden", opacity: i === 0 ? 1 : 0 }}>
              <div className="grid h-full grid-cols-2 grid-rows-[1.3fr_1fr] gap-3">
                <div className="u18-ph col-span-2 overflow-hidden rounded-[14px]">
                  <Img i={c.i} w={800} h={500} />
                </div>
                <div className="u18-ph overflow-hidden rounded-[14px]">
                  <Img i={c.i + 1} w={400} h={400} />
                </div>
                <div className="u18-ph overflow-hidden rounded-[14px]">
                  <Img i={c.i + 2} w={400} h={400} />
                </div>
              </div>
              <h4 className="u18-title absolute left-5 top-4 text-[clamp(40px,4.4vw,72px)] italic leading-[1] drop-shadow-[0_4px_20px_rgba(0,0,0,.6)]" style={{ fontFamily: F.fr }}>
                {c.t}
              </h4>
            </div>
          ))}
        </div>
      </div>
      <Sheen g1="rgba(255,170,130,.38)" />
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U19 · Clip menu with ease-reverse ───────────────────────── */
const U19_ITEMS = ["Stay", "Dine", "Spa", "Journal", "Visit"];
const U19_CLOSED = "polygon(100% 0%, 100% 0%, 100% 0%, 100% 0%)";
const U19_OPEN = "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)";
function U19() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const open = useRef(false);
  const step = useRef({ k: -1, last: -1 });
  const hov = useRef(-2);
  const setOpen = (v: boolean) => {
    const el = root.current;
    const t = tl.current;
    if (!el || !t || v === open.current) return;
    open.current = v;
    const btn = el.querySelector<HTMLElement>(".u19-btn")!;
    btn.querySelector(".u19-lbl")!.textContent = v ? "Close" : "Menu";
    gsap.fromTo(btn, { scale: 0.9 }, { scale: 1, duration: 0.45, ease: "back.out(3)" });
    // the same ease both ways on the progress: opening glides in, closing (mirrored) snaps shut at once
    gsap.to(t, { progress: v ? 1 : 0, duration: v ? 1.15 : 0.7, ease: "power4.out", overwrite: true });
  };
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const items = all(el, ".u19-item");
      tl.current = gsap
        .timeline({ paused: true })
        .fromTo(".u19-over", { clipPath: U19_CLOSED }, { clipPath: U19_OPEN, duration: 1, ease: "none" }, 0)
        .fromTo(items, { y: 90, opacity: 0, rotation: () => gsap.utils.random(-16, 16) }, { y: 0, opacity: 1, rotation: 0, duration: 0.6, stagger: 0.07, ease: "none" }, 0.25);
    }, el);
    return () => {
      ctx.revert();
      tl.current = null;
    };
  }, []);
  usePointer(
    root,
    dot,
    (t, el) => {
      const btn = el.querySelector(".u19-btn")!;
      const items = all(el, ".u19-item");
      const b = centre(btn, el);
      const pts: [number, number][] = [b, centre(items[1], el, 0.3), centre(items[3], el, 0.3), b, [el.clientWidth * 0.3, el.clientHeight * 0.66]];
      const seg = 1.05;
      step.current.k = Math.floor(t / seg);
      const [x, y] = stepPath(t, pts, seg, 0.4);
      const [wx, wy] = wob(t, 5);
      return { x: x + wx, y: y + wy, inside: true };
    },
    (p, _dt, el) => {
      const S = step.current;
      if (!p.real && S.k !== S.last) {
        S.last = S.k;
        const at = S.k % 5;
        if (at === 0) setOpen(true);
        if (at === 3) setOpen(false);
      }
      const items = all(el, ".u19-item");
      const idx = open.current ? hit(items, el, p.x, p.y) : -1;
      if (idx === hov.current) return;
      hov.current = idx;
      items.forEach((n, i) => n.classList.toggle("on", i === idx));
    },
  );
  return (
    <Stage r={root} g1="rgba(255,170,120,.34)" g2="rgba(120,150,255,.22)">
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-[4%] py-[3%]" style={{ zIndex: 30 }}>
        <span className="text-[22px] font-[600] tracking-[-0.01em]" style={{ fontFamily: F.sg }}>
          Halden &amp; Co.
        </span>
        <button type="button" className="u19-btn flex items-center gap-3 rounded-full border border-white/25 bg-[#0a0d16]/70 px-7 py-4 text-[18px] font-[600]" style={{ fontFamily: F.sg }} onClick={() => setOpen(!open.current)}>
          <span className="flex flex-col gap-[5px]" aria-hidden>
            <i className="block h-[2px] w-[20px] bg-current" />
            <i className="block h-[2px] w-[14px] bg-current" />
          </span>
          <span className="u19-lbl">Menu</span>
        </button>
      </div>
      <div className="absolute inset-0 flex flex-col justify-end px-[5%] pb-[6%]">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/55">Coastal retreat · from ₹18,500 a night</p>
        <h3 className="mt-3 text-[clamp(52px,6vw,96px)] leading-[0.96]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
          Quiet rooms,
          <br />
          <span className="italic text-[#ffb36b]">slow mornings.</span>
        </h3>
      </div>
      <nav className="u19-over absolute inset-0 flex items-center bg-[#f2ebe0] px-[6%] text-[#14110d]" style={{ zIndex: 20, clipPath: U19_CLOSED }}>
        <ul className="flex flex-col">
          {U19_ITEMS.map((t, i) => (
            <li key={t} className="u19-item flex items-baseline gap-5 text-[clamp(44px,5vw,80px)] leading-[1.04]" style={{ fontFamily: F.fr }}>
              <span className="text-[14px] text-[#14110d]/50" style={{ fontFamily: F.mr }}>
                0{i + 1}
              </span>
              {t}
            </li>
          ))}
        </ul>
      </nav>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U20 · Interactive hover button (dot to fill) ───────────────────────── */
function U20() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const on = useRef(false);
  usePointer(
    root,
    dot,
    (t, el) => {
      const pill = el.querySelector(".u20-pill")!;
      const pts: [number, number][] = [centre(pill, el, 0.3), centre(pill, el, 0.72), centre(pill, el, 0.5, 2.6), centre(pill, el, -0.35, 0.4)];
      const [x, y] = stepPath(t, pts, 0.85, 0.42);
      const [wx, wy] = wob(t, 6);
      return { x: x + wx, y: y + wy, inside: true };
    },
    (p, _dt, el) => {
      const pill = el.querySelector(".u20-pill")!;
      const v = p.inside && hit([pill], el, p.x, p.y) === 0;
      if (v === on.current) return;
      on.current = v;
      pill.classList.toggle("on", v);
    },
  );
  return (
    <Stage r={root} g1="rgba(120,255,200,.26)" g2="rgba(79,141,255,.26)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-10">
        <div className="text-center">
          <p className="text-[13px] uppercase tracking-[0.24em] text-white/55">Saville Row North · Bespoke</p>
          <h3 className="mt-3 text-[clamp(40px,4.4vw,68px)] font-[500] leading-[1] tracking-[-0.02em]" style={{ fontFamily: F.sg }}>
            Cut for one person.
          </h3>
        </div>
        <button type="button" className="u20-pill relative overflow-hidden rounded-full border border-white/25 bg-white/[0.04] py-[30px] pl-[78px] pr-[56px] text-[clamp(24px,2vw,30px)] font-[600]" style={{ fontFamily: F.sg }} data-cursor="Book">
          <span className="u20-dot absolute left-[38px] top-1/2 mt-[-7px] block h-[14px] w-[14px] rounded-full bg-[#7dffc4]" aria-hidden />
          <span className="u20-a relative block whitespace-nowrap">Book a fitting</span>
          <span className="u20-b absolute inset-0 flex items-center justify-center gap-3 whitespace-nowrap text-[#06140f]">
            Book a fitting <span aria-hidden>→</span>
          </span>
        </button>
        <p className="text-[14px] text-white/55">Two-piece suits from ₹38,000 · six weeks</p>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U21 · Magic card spotlight ───────────────────────── */
const U21_PLANS = [
  { t: "Starter", p: "₹1,200", f: ["One studio seat", "Weekly drops", "Email support"] },
  { t: "Studio", p: "₹4,800", f: ["Five seats", "Daily drops", "Priority support"] },
  { t: "Atelier", p: "₹12,000", f: ["Unlimited seats", "Private drops", "A named stylist"] },
];
function U21() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const ops = useRef([0, 0, 0]);
  usePointer(
    root,
    dot,
    (t, el) => {
      const row = el.querySelector(".u21-row")!;
      const b = rel(row, el);
      return { x: b.l + b.w * (0.5 + 0.44 * Math.sin(t * 0.62)), y: b.t + b.h * (0.5 + 0.36 * Math.sin(t * 1.24)), inside: true };
    },
    (p, dt, el) => {
      all(el, ".u21-card").forEach((c, i) => {
        const b = rel(c, el);
        const x = p.x - b.l;
        const y = p.y - b.t;
        const inside = p.inside && x >= 0 && y >= 0 && x <= b.w && y <= b.h;
        ops.current[i] += ((inside ? 1 : 0) - ops.current[i]) * (1 - Math.exp(-dt * 7));
        c.style.setProperty("--x", `${x.toFixed(0)}px`);
        c.style.setProperty("--y", `${y.toFixed(0)}px`);
        c.style.setProperty("--o", ops.current[i].toFixed(3));
      });
    },
  );
  return (
    <Stage r={root} g1="rgba(167,139,255,.34)" g2="rgba(79,141,255,.2)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-[5%]">
        <h3 className="text-center text-[clamp(36px,3.6vw,56px)] leading-[1]" style={{ fontFamily: F.is }}>
          Pick your membership
        </h3>
        <div className="u21-row grid w-full max-w-[1100px] grid-cols-3 gap-6">
          {U21_PLANS.map((pl, i) => (
            <div key={pl.t} className="u21-card relative rounded-[24px] bg-white/[0.1]" style={(i === 1 ? { "--o": 0.9, "--x": "60%", "--y": "28%" } : {}) as CSSProperties}>
              <div className="u21-ring absolute inset-0 rounded-[24px]" aria-hidden />
              <div className="relative m-[1.5px] overflow-hidden rounded-[22.5px] bg-[#0d111c] p-[clamp(22px,2.4vw,36px)]">
                <div className="u21-spot pointer-events-none absolute inset-0" aria-hidden />
                <div className="relative">
                  <p className="text-[14px] uppercase tracking-[0.2em] text-white/60">{pl.t}</p>
                  <p className="mt-4 text-[clamp(38px,3.4vw,54px)] font-[600] leading-[1] tracking-[-0.03em]" style={{ fontFamily: F.sg }}>
                    {pl.p}
                    <span className="text-[16px] font-[400] text-white/50"> /mo</span>
                  </p>
                  <ul className="mt-6 space-y-2 text-[15px] text-white/75" style={{ fontFamily: F.mr }}>
                    {pl.f.map((f) => (
                      <li key={f}>— {f}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U22 · Dock magnification ───────────────────────── */
const U22_ICONS: { n: string; c: [string, string]; d: string }[] = [
  { n: "Home", c: ["#ff9a6b", "#ff5e7e"], d: "M4 11 12 4l8 7v9h-5v-6H9v6H4z" },
  { n: "Shop", c: ["#ffd36b", "#ff9a3c"], d: "M5 8h14l-1.5 12h-11zM9 8V6a3 3 0 0 1 6 0v2" },
  { n: "Stories", c: ["#7dffc4", "#2fb38a"], d: "M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" },
  { n: "Journal", c: ["#7fb2ff", "#4c6bff"], d: "M6 4h10l3 3v13H6zM9 10h7M9 14h7" },
  { n: "Studio", c: ["#c59bff", "#7b4cff"], d: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm0 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8z" },
  { n: "Cart", c: ["#ff8fc8", "#e0457f"], d: "M3 5h3l2 11h10l2-8H7M10 20h.01M17 20h.01" },
  { n: "Saved", c: ["#ffe08a", "#f2b233"], d: "M7 4h10v16l-5-4-5 4z" },
  { n: "Search", c: ["#8af0ff", "#2fa6c9"], d: "M11 5a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM16 16l4 4" },
  { n: "Account", c: ["#d6ff78", "#86c23b"], d: "M12 5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM5 20c1-4 4-6 7-6s6 2 7 6" },
];
const U22_BASE = 64;
function U22() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const sp = useRef(U22_ICONS.map(() => ({ s: U22_BASE, v: 0 })));
  usePointer(
    root,
    dot,
    (t, el) => {
      const b = rel(el.querySelector(".u22-dock")!, el);
      const lift = 190 * Math.pow(Math.max(0, (Math.sin(t * 0.55) - 0.7) / 0.3), 2);
      return { x: b.l + b.w * (0.5 + 0.47 * Math.sin(t * 0.85)), y: b.t + b.h * 0.55 - lift, inside: true };
    },
    (p, dt, el) => {
      const dock = el.querySelector(".u22-dock")!;
      const db = rel(dock, el);
      const near = p.inside && p.y > db.t - 70 && p.y < db.t + db.h + 30;
      const icons = all(el, ".u22-ic");
      let best = -1;
      let bestF = 0;
      icons.forEach((ic, i) => {
        const [cx] = centre(ic, el);
        const d = Math.abs(p.x - cx);
        const f = near && d < 140 ? 0.5 + 0.5 * Math.cos((Math.PI * d) / 140) : 0;
        if (f > bestF) {
          bestF = f;
          best = i;
        }
        const S = sp.current[i];
        const target = U22_BASE * (1 + 0.6 * f);
        S.v += ((target - S.s) * 320 - S.v * 26) * dt;
        S.s += S.v * dt;
        ic.style.width = ic.style.height = `${S.s.toFixed(2)}px`;
      });
      const tip = el.querySelector<HTMLElement>(".u22-tip")!;
      if (best >= 0 && bestF > 0.55) {
        const ib = rel(icons[best], el);
        tip.textContent = U22_ICONS[best].n;
        tip.style.opacity = "1";
        tip.style.transform = `translate3d(${(ib.l + ib.w / 2 - tip.offsetWidth / 2).toFixed(1)}px,${(ib.t - 44).toFixed(1)}px,0)`;
      } else tip.style.opacity = "0";
    },
  );
  return (
    <Stage r={root} g1="rgba(127,178,255,.36)" g2="rgba(255,154,107,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[clamp(60px,12vh,120px)]">
        <div className="text-center">
          <p className="text-[13px] uppercase tracking-[0.24em] text-white/55">Morrow Home · App</p>
          <h3 className="mt-3 text-[clamp(40px,4.4vw,68px)] font-[500] leading-[1] tracking-[-0.02em]" style={{ fontFamily: F.sg }}>
            One reach away.
          </h3>
        </div>
        <div className="u22-dock flex h-[124px] items-end gap-3 rounded-[28px] border border-white/15 bg-white/[0.06] px-4 pb-[14px] backdrop-blur-md">
          {U22_ICONS.map((ic) => (
            <div key={ic.n} className="u22-ic grid shrink-0 place-items-center rounded-[18px] shadow-[0_10px_24px_rgba(0,0,0,.35)]" style={{ width: U22_BASE, height: U22_BASE, background: `linear-gradient(145deg,${ic.c[0]},${ic.c[1]})` }} data-cursor={ic.n}>
              <svg viewBox="0 0 24 24" className="h-[46%] w-[46%]" fill="none" stroke="#fff" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d={ic.d} />
              </svg>
            </div>
          ))}
        </div>
      </div>
      <div className="u22-tip pointer-events-none absolute left-0 top-0 rounded-[8px] bg-white px-3 py-[6px] text-[14px] font-[600] text-[#0a0d16] opacity-0 transition-opacity duration-200" style={{ zIndex: 30 }} aria-hidden>
        Home
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U23 · Link preview popup ───────────────────────── */
const U23_LINKS = [
  { t: "the Kutch looms", i: 3, c: "Handwoven in Bhujodi" },
  { t: "our Pune studio", i: 9, c: "Cut & finished by hand" },
  { t: "cedar crates", i: 19, c: "Packed to last decades" },
];
function U23() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const st = useRef({ idx: -2, x: 0, y: 0, init: false });
  usePointer(
    root,
    dot,
    (t, el) => {
      const links = all(el, ".u23-link");
      const pts: [number, number][] = links.map((l) => centre(l, el, 0.5, 0.55));
      pts.splice(2, 0, [el.clientWidth * 0.5, el.clientHeight * 0.86]);
      const seg = 1.25;
      const [x, y] = stepPath(t, pts, seg, 0.4);
      const sway = Math.sin(t * 2.6) * 70;
      return { x: x + sway, y: y + Math.cos(t * 1.9) * 4, inside: true };
    },
    (p, dt, el) => {
      const S = st.current;
      const links = all(el, ".u23-link");
      const wrap = el.querySelector<HTMLElement>(".u23-float")!;
      const card = el.querySelector<HTMLElement>(".u23-card")!;
      const idx = p.inside ? hit(links, el, p.x, p.y) : -1;
      if (idx >= 0) {
        const b = rel(links[idx], el);
        const cx = b.l + b.w / 2;
        const tx = cx + (p.x - cx) * 0.35 - wrap.offsetWidth / 2;
        const ty = b.t - wrap.offsetHeight - 16;
        if (!S.init || S.idx < 0) {
          S.x = tx;
          S.y = ty;
          S.init = true;
        }
        const k = 1 - Math.exp(-dt * 10);
        S.x += (tx - S.x) * k;
        S.y += (ty - S.y) * k;
        wrap.style.transform = `translate3d(${S.x.toFixed(1)}px,${S.y.toFixed(1)}px,0)`;
      }
      if (idx === S.idx) return;
      const was = S.idx;
      S.idx = idx;
      links.forEach((l, i) => l.classList.toggle("on", i === idx));
      if (idx >= 0) {
        all(el, ".u23-img").forEach((im, i) => (im.style.opacity = i === idx ? "1" : "0"));
        el.querySelector(".u23-cap")!.textContent = U23_LINKS[idx].c;
        if (was < 0) gsap.fromTo(card, { autoAlpha: 0, scale: 0.55, y: 26, rotation: -4 }, { autoAlpha: 1, scale: 1, y: 0, rotation: 0, duration: 0.6, ease: "back.out(2.2)", overwrite: true });
      } else gsap.to(card, { autoAlpha: 0, scale: 0.7, y: 16, duration: 0.3, ease: "power2.in", overwrite: true });
    },
  );
  return (
    <Stage r={root} g1="rgba(255,179,107,.32)" g2="rgba(127,178,255,.22)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="max-w-[1000px]">
          <p className="mb-6 text-[13px] uppercase tracking-[0.24em] text-white/55">Loomhaus · Our story</p>
          <p className="text-[clamp(34px,3.3vw,52px)] leading-[1.3] tracking-[-0.01em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
            We source wool from{" "}
            <span className="u23-link whitespace-nowrap" data-cursor="Peek">
              {U23_LINKS[0].t}
            </span>
            , finish every throw in{" "}
            <span className="u23-link whitespace-nowrap" data-cursor="Peek">
              {U23_LINKS[1].t}
            </span>{" "}
            and ship it in{" "}
            <span className="u23-link whitespace-nowrap" data-cursor="Peek">
              {U23_LINKS[2].t}
            </span>{" "}
            that outlive the order.
          </p>
        </div>
      </div>
      <div className="u23-float pointer-events-none absolute left-0 top-0 w-[240px]" style={{ zIndex: 30 }} aria-hidden>
        <div className="u23-card origin-bottom overflow-hidden rounded-[14px] border border-white/20 bg-[#121725] p-2 shadow-[0_24px_50px_rgba(0,0,0,.55)]" style={{ visibility: "hidden", opacity: 0 }}>
          <div className="relative h-[140px] overflow-hidden rounded-[9px]">
            {U23_LINKS.map((l, i) => (
              <div key={l.t} className="u23-img absolute inset-0" style={{ opacity: i === 0 ? 1 : 0 }}>
                <Img i={l.i} w={480} h={280} />
              </div>
            ))}
          </div>
          <p className="u23-cap px-1 pb-1 pt-2 text-[13px] text-white/80">{U23_LINKS[0].c}</p>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U24 · Shrinking blur nav ───────────────────────── */
const U24_PRODUCTS = [
  { n: "Oak lounge chair", p: "₹42,000", i: 2 },
  { n: "Teak side table", p: "₹18,500", i: 6 },
  { n: "Rattan pendant", p: "₹9,800", i: 10 },
  { n: "Linen daybed", p: "₹64,000", i: 14 },
  { n: "Stone planter", p: "₹6,400", i: 18 },
  { n: "Cane bench", p: "₹27,000", i: 22 },
];
function U24() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const sc = el.querySelector<HTMLElement>(".u24-scroll")!;
    const nav = el.querySelector<HTMLElement>(".u24-nav")!;
    const thumb = el.querySelector<HTMLElement>(".u24-thumb")!;
    let compact = false;
    const apply = () => {
      const max = sc.scrollHeight - sc.clientHeight;
      gsap.set(thumb, { y: (sc.scrollTop / Math.max(1, max)) * (sc.clientHeight * 0.7) });
      const c = sc.scrollTop > 60;
      if (c === compact) return;
      compact = c;
      gsap.to(nav, {
        width: c ? "54%" : "96%",
        y: c ? 10 : 0,
        borderRadius: c ? 999 : 16,
        backgroundColor: c ? "rgba(16,20,32,0.55)" : "rgba(16,20,32,0)",
        borderColor: c ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0)",
        backdropFilter: c ? "blur(14px)" : "blur(0px)",
        paddingLeft: c ? 22 : 28,
        paddingRight: c ? 10 : 28,
        duration: 0.7,
        ease: "power3.inOut",
        overwrite: true,
      });
    };
    sc.addEventListener("scroll", apply, { passive: true });
    const tl = gsap.timeline({ repeat: -1, yoyo: true, paused: true });
    tl.fromTo(sc, { scrollTop: 0 }, { scrollTop: () => (sc.scrollHeight - sc.clientHeight) * 0.75, duration: 2.6, ease: "sine.inOut" });
    // the real wheel takes over for 2.5 s, then the auto-scroll resumes from where the visitor left it
    let timer = 0;
    const user = () => {
      tl.pause();
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const max = (sc.scrollHeight - sc.clientHeight) * 0.75;
        const p = gsap.utils.clamp(0, 1, sc.scrollTop / Math.max(1, max));
        tl.progress(tl.reversed() ? 1 - p : p).play();
      }, 2500);
    };
    sc.addEventListener("wheel", user, { passive: true });
    sc.addEventListener("pointerdown", user);
    onClean(() => {
      window.clearTimeout(timer);
      sc.removeEventListener("scroll", apply);
      sc.removeEventListener("wheel", user);
      sc.removeEventListener("pointerdown", user);
    });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,200,140,.32)" g2="rgba(127,178,255,.24)">
      <div className="u24-scroll absolute inset-0 overflow-y-auto" data-lenis-prevent style={{ scrollbarWidth: "none" }}>
        <section className="relative flex h-[78%] min-h-[420px] flex-col justify-end overflow-hidden px-[5%] pb-[5%]">
          <div className="absolute inset-0 opacity-70">
            <Img i={4} w={1400} h={700} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d16] via-[#0a0d16]/30 to-transparent" />
          <h3 className="relative text-[clamp(56px,7vw,112px)] font-[700] leading-[0.92] tracking-[-0.03em]" style={{ fontFamily: F.sy }}>
            Tide &amp; Timber
          </h3>
          <p className="relative mt-3 text-[16px] text-white/70">Furniture for slow coastal homes</p>
        </section>
        <section className="grid grid-cols-3 gap-5 px-[5%] py-[4%]">
          {U24_PRODUCTS.map((pr) => (
            <figure key={pr.n}>
              <div className="aspect-[4/3] overflow-hidden rounded-[14px]">
                <Img i={pr.i} w={600} h={450} />
              </div>
              <figcaption className="mt-3 flex justify-between text-[15px]">
                <span>{pr.n}</span>
                <span className="text-white/60">{pr.p}</span>
              </figcaption>
            </figure>
          ))}
        </section>
      </div>
      <header className="u24-nav absolute left-0 right-0 top-[14px] mx-auto flex items-center justify-between rounded-[16px] border px-[28px] py-[14px]" style={{ width: "96%", zIndex: 30, borderColor: "rgba(255,255,255,0)" }}>
        <span className="text-[20px] font-[700]" style={{ fontFamily: F.sy }}>
          T&amp;T
        </span>
        <nav className="flex gap-7 text-[15px] text-white/85">
          <span>Living</span>
          <span>Dining</span>
          <span>Outdoor</span>
          <span>Journal</span>
        </nav>
        <span className="rounded-full bg-[#ffc88c] px-5 py-[9px] text-[14px] font-[600] text-[#1a1208]">Cart · 2</span>
      </header>
      <div className="pointer-events-none absolute bottom-[15%] right-[10px] top-[15%] w-[4px] rounded-full bg-white/10" style={{ zIndex: 30 }} aria-hidden>
        <div className="u24-thumb h-[30%] w-full rounded-full bg-white/60" />
      </div>
      <Sheen g1="rgba(255,210,160,.36)" />
    </Stage>
  );
}

/* ───────────────────────── U25 · Hover-sliding background pill ───────────────────────── */
const U25_TABS = ["Overview", "Collections", "Materials", "Craft", "Journal", "Visit"];
const U25_CARDS = [
  { t: "Free fitting", s: "In any of our six ateliers" },
  { t: "Lifetime repairs", s: "Resoled and restitched, on us" },
  { t: "Made to order", s: "Ready in three weeks · ₹14,900" },
];
type FlipT = Awaited<ReturnType<typeof loadPlugin<"Flip">>>;
function U25() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const flip = useRef<FlipT | null>(null);
  const cur = useRef<{ tab: number; card: number }>({ tab: -2, card: -2 });
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let dead = false;
    loadPlugin("Flip").then((f) => {
      if (!dead) flip.current = f;
    });
    return () => {
      dead = true;
      const el = root.current;
      if (el) gsap.killTweensOf(all(el, ".u25-hl"));
    };
  }, []);
  const slide = (hl: HTMLElement, target: HTMLElement | null, wasHidden: boolean) => {
    if (!target) {
      gsap.to(hl, { autoAlpha: 0, scale: 0.94, duration: 0.35, ease: "power2.out", overwrite: true });
      return;
    }
    const vars: gsap.TweenVars = flip.current
      ? (flip.current.fit(hl, target, { scale: false, getVars: true }) as gsap.TweenVars)
      : { x: target.offsetLeft, y: target.offsetTop, width: target.offsetWidth, height: target.offsetHeight };
    if (wasHidden) {
      gsap.set(hl, vars);
      gsap.fromTo(hl, { autoAlpha: 0, scale: 0.94 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: "power2.out", overwrite: true });
    } else gsap.to(hl, { ...vars, autoAlpha: 1, scale: 1, duration: 0.6, ease: "elastic.out(1,0.8)", overwrite: true });
  };
  usePointer(
    root,
    dot,
    (t, el) => {
      const tabs = all(el, ".u25-tab");
      const cards = all(el, ".u25-card");
      const pts: [number, number][] = [
        ...[0, 1, 2, 3, 4, 5, 3].map((i) => centre(tabs[i], el)),
        centre(cards[0], el, 0.5, 0.45),
        centre(cards[1], el, 0.5, 0.55),
        centre(cards[2], el, 0.5, 0.45),
        centre(cards[1], el, 0.5, 1.6),
      ];
      const [x, y] = stepPath(t, pts, 0.62, 0.5);
      const [wx, wy] = wob(t, 5);
      return { x: x + wx, y: y + wy, inside: true };
    },
    (p, _dt, el) => {
      const C = cur.current;
      const tabs = all(el, ".u25-tab");
      const cards = all(el, ".u25-card");
      const ti = p.inside ? hit(tabs, el, p.x, p.y) : -1;
      const ci = p.inside ? hit(cards, el, p.x, p.y) : -1;
      if (ti !== C.tab) {
        slide(el.querySelector<HTMLElement>(".u25-hl-tab")!, tabs[ti] ?? null, C.tab < 0);
        tabs.forEach((n, i) => n.classList.toggle("on", i === ti));
        C.tab = ti;
      }
      if (ci !== C.card) {
        slide(el.querySelector<HTMLElement>(".u25-hl-card")!, cards[ci] ?? null, C.card < 0);
        C.card = ci;
      }
    },
  );
  return (
    <Stage r={root} g1="rgba(127,178,255,.34)" g2="rgba(255,179,107,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[clamp(40px,7vh,72px)] px-[5%]">
        <div className="relative flex rounded-full border border-white/15 bg-white/[0.04] p-2">
          <span className="u25-hl u25-hl-tab absolute left-0 top-0 rounded-full border border-white/25 bg-white/[0.14] shadow-[0_0_30px_rgba(127,178,255,.35)]" style={{ visibility: "hidden", opacity: 0 }} aria-hidden />
          {U25_TABS.map((t) => (
            <span key={t} className={`u25-tab relative px-[clamp(18px,2vw,32px)] py-[16px] text-[clamp(17px,1.4vw,21px)] font-[500] text-white/60 ${t === "Collections" ? "on" : ""}`} style={{ fontFamily: F.sg }}>
              {t}
            </span>
          ))}
        </div>
        <div className="relative grid w-full max-w-[1080px] grid-cols-3 gap-4">
          <span className="u25-hl u25-hl-card absolute left-0 top-0 rounded-[22px] border border-white/15 bg-white/[0.08]" style={{ visibility: "hidden", opacity: 0 }} aria-hidden />
          {U25_CARDS.map((c) => (
            <div key={c.t} className="u25-card relative rounded-[22px] p-[clamp(22px,2.4vw,34px)]">
              <p className="text-[clamp(24px,2.1vw,32px)] font-[600] leading-[1.05] tracking-[-0.02em]" style={{ fontFamily: F.sg }}>
                {c.t}
              </p>
              <p className="mt-3 text-[15px] text-white/60" style={{ fontFamily: F.mr }}>
                {c.s}
              </p>
            </div>
          ))}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "U14", name: "Background scale on menu hover", how: "Hovering a menu item reveals its full-bleed photo (clip from below) settling from scale 1.07 to 1; a fake pointer walks the menu.", kind: "play", C: U14 },
  { code: "U15", name: "Menu hover image follow", how: "A photo trails the pointer over the category list, tilting with pointer speed and flashing bright as it swaps; a fake pointer sweeps a figure-eight.", kind: "play", C: U15 },
  { code: "U16", name: "Skewed fill slide-in button", how: "A skewed colour block slides in behind the label and straightens on hover, then exits the other side on leave; a fake pointer hovers both buttons.", kind: "play", C: U16 },
  { code: "U17", name: "3D rolling letters menu", how: "On hover every letter rolls back in 3D while a lime copy rolls up from below (staggered), and the item's photo scales in; a fake pointer walks the menu.", kind: "play", C: U17 },
  { code: "U18", name: "Grid item reveal on hover", how: "Hovering a grid cell shows its panel: title scales in, photos clip-reveal from set directions with a 1.5→1 zoom and a brightness flash.", kind: "play", C: U18 },
  { code: "U19", name: "Clip menu with ease-reverse", how: "Menu opens with a polygon clip sweeping from the button corner and items rotating in; closing uses the mirrored ease so it snaps shut. Auto-clicked.", kind: "play", C: U19 },
  { code: "U20", name: "Interactive hover button (dot to fill)", how: "The small dot grows to fill the pill while the label slides 48px right and fades and a new label + arrow slides in; a fake pointer hovers it.", kind: "play", C: U20 },
  { code: "U21", name: "Magic card spotlight", how: "A soft spotlight and a brighter border ring follow the pointer inside each card and fade on leave; a fake pointer traces a slow figure-eight.", kind: "play", C: U21 },
  { code: "U22", name: "Dock magnification", how: "Icons near the pointer spring up to 1.6× with a 140px falloff, macOS-dock style, with a label above the nearest; a fake pointer sweeps the dock.", kind: "play", C: U22 },
  { code: "U23", name: "Link preview popup", how: "Hovering an inline link springs a photo preview up above it that drifts with the pointer's x; a fake pointer visits each link.", kind: "play", C: U23 },
  { code: "U24", name: "Shrinking blur nav", how: "Past a small scroll the full-width nav shrinks into a floating blurred pill, and widens back at the top; the mini page auto-scrolls up and down.", kind: "play", C: U24 },
  { code: "U25", name: "Hover-sliding background pill", how: "One highlight pill (and one card background) slides and resizes between items under the pointer with a spring (Flip.fit), fading on leave.", kind: "play", C: U25 },
];
