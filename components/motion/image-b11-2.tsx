"use client";

// Image motions, batch 11 · group 2 (MOTION-MENU M542–M553): sliders, carousels, walls and grids. Small focused demos
// for /lab/motion. Every demo plays by itself while on screen (a visible fake pointer stands in for drag/click; the
// real mouse takes over when it moves), loops with no rest over 0.3 s, pauses off screen, and has a CSS-only glow loop
// (plus a second glow on top of the pictures). ?static=1 / reduced motion: no JS motion, the markup is a final state.
import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, loadPlugin, prefersReducedMotion } from "@/lib/gsap";
import { createShader, type GLHandle } from "@/lib/gl";
import { scene, useScrub, useTicker } from "@/components/fx/shared";
import type { MotionDef } from "./types";

type FlipT = typeof import("gsap/Flip").Flip;
let Flip: FlipT | null = null;
const needFlip = () =>
  loadPlugin("Flip").then((f) => {
    Flip = f;
  });

const F = {
  sg: "Space Grotesk Variable",
  fr: "Fraunces Variable",
  is: "Instrument Serif",
  sy: "Syne Variable",
  mr: "Manrope Variable",
};

const CSS = `
.b11g2i-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.5)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.22)),transparent 70%);animation:b11g2i-drift 5.6s linear infinite alternate;will-change:transform}
@keyframes b11g2i-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b11g2i-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4);pointer-events:none;z-index:200;opacity:0}
.b11g2i-user .b11g2i-dot{opacity:0!important}
.m544-card{clip-path:inset(0% 0% 48% 0% round 18px)}
.m544-card.is-on{clip-path:inset(0% 0% 0% 0% round 18px)}
.m547-card{flex:none;width:17%;height:70%}
.m547-card.is-active{width:31%;height:100%}
.m547-card .m547-cap{opacity:0}
.m547-card.is-active .m547-cap{opacity:1}
.m549-col{animation:m549-up var(--d,14s) linear infinite;animation-play-state:paused}
.m549-col.m549-down{animation-name:m549-down}
.m549-run .m549-col{animation-play-state:running}
@keyframes m549-up{from{transform:translate3d(0,0,0)}to{transform:translate3d(0,-50%,0)}}
@keyframes m549-down{from{transform:translate3d(0,-50%,0)}to{transform:translate3d(0,0,0)}}
.m552-wrap{position:absolute;inset:0}
.m552-item{position:absolute;left:var(--x);top:var(--y);width:10.5%;aspect-ratio:4/5;transform:rotate(var(--r))}
.m552-wrap.is-grid{display:grid;grid-template-columns:repeat(4,13%);grid-auto-rows:auto;justify-content:center;align-content:center;gap:18px;padding-top:2%}
.m552-wrap.is-grid .m552-item{position:relative;left:auto;top:auto;width:auto;transform:none}
.m552-float{animation:m552-float 2.6s ease-in-out infinite alternate}
@keyframes m552-float{from{transform:translate3d(0,-7px,0)}to{transform:translate3d(0,7px,0)}}
.m553-tile.is-open{grid-row:1 / span 2!important;grid-column:1 / span 2!important;z-index:5}
html.is-static .b11g2i-glow,html.is-static .m549-col,html.is-static .m552-float{animation:none}
html.is-static {.b11g2i-glow,.m549-col,.m552-float{animation:none}}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", style, g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; style?: CSSProperties; g1?: string; g2?: string }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0d16] text-[#eef2ff] ${className}`} style={style}>
      <style href="b11g2i-css" precedence="default">
        {CSS}
      </style>
      <div className="b11g2i-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/** The CSS glow loop again, ON TOP of the pictures (screen blend), so image-covered stages never freeze (rule 13). */
const Sheen = ({ g1 }: { g1?: string }) => (
  <div className="b11g2i-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.45, zIndex: 150 } as CSSProperties} aria-hidden />
);

/** The visible fake pointer (a ring) that drives drag/click demos while nobody touches the mouse. */
const Dot = ({ r }: { r: RefObject<HTMLDivElement | null> }) => <div ref={r} className="b11g2i-dot" aria-hidden />;

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ src, className = "", style }: { src: string; className?: string; style?: CSSProperties }) => <img src={src} alt="" className={`h-full w-full object-cover ${className}`} style={style} draggable={false} />;

type Built = gsap.core.Animation | gsap.core.Animation[] | void;

/**
 * "play" helper: waits for fonts (+ an optional plugin), builds looping animation(s) in a gsap.context (passed in so
 * later callbacks can add their tweens to it), plays them only while on screen, reverts on unmount. `interactive`: a
 * real pointer moving over the stage pauses the scripted loop (and hides the fake ring) until 2.5 s after it last moved.
 */
function usePlay(
  ref: RefObject<HTMLElement | null>,
  build: (root: HTMLElement, ctx: gsap.Context, onClean: (fn: () => void) => void) => Built,
  { pre, interactive = false }: { pre?: () => Promise<unknown>; interactive?: boolean } = {},
) {
  const b = useRef(build);
  b.current = build;
  const p = useRef(pre);
  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    let dead = false;
    let on = false;
    let user = false;
    let timer = 0;
    let anims: gsap.core.Animation[] = [];
    const cleans: (() => void)[] = [];
    const ctx = gsap.context(() => {}, root);
    const sync = () => anims.forEach((a) => (on && !user ? a.play() : a.pause()));
    const io = new IntersectionObserver(
      ([e]) => {
        on = e.isIntersecting;
        sync();
      },
      { threshold: 0.1 },
    );
    io.observe(root);
    const move = () => {
      if (!interactive) return;
      user = true;
      root.classList.add("b11g2i-user");
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        user = false;
        root.classList.remove("b11g2i-user");
        sync();
      }, 2500);
      sync();
    };
    root.addEventListener("pointermove", move);
    Promise.all([document.fonts?.ready, p.current?.()]).then(() => {
      if (dead) return;
      ctx.add(() => {
        const r = b.current(root, ctx, (fn) => cleans.push(fn));
        anims = !r ? [] : Array.isArray(r) ? r : [r];
      });
      sync();
    });
    return () => {
      dead = true;
      window.clearTimeout(timer);
      root.removeEventListener("pointermove", move);
      root.classList.remove("b11g2i-user");
      io.disconnect();
      ctx.revert();
      cleans.forEach((f) => f());
    };
  }, [ref, interactive]);
}

/** True once the element is within ~1 screen of the viewport (rule 20: no textures / GL context before that). */
function useNear(ref: RefObject<HTMLElement | null>) {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "900px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return near;
}

/** Tracks the real mouse over the stage: position (root px), whether a button is down, and when it last moved. */
function useRealPointer(root: RefObject<HTMLElement | null>) {
  const real = useRef({ x: 0, y: 0, down: false, at: -1e9 });
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const at = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const move = (e: PointerEvent) => {
      real.current = { ...real.current, ...at(e), at: performance.now() };
    };
    const down = (e: PointerEvent) => {
      real.current = { ...at(e), down: true, at: performance.now() };
    };
    const up = () => (real.current = { ...real.current, down: false, at: performance.now() });
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
    };
  }, [root]);
  return real;
}

const easeIO = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

/** An element's centre relative to the root. */
function centre(node: Element, root: Element) {
  const a = node.getBoundingClientRect();
  const r = root.getBoundingClientRect();
  return { x: a.left - r.left + a.width / 2, y: a.top - r.top + a.height / 2 };
}

/** Quick press feedback for the fake ring (and the thing it presses). */
const press = (dot: Element | null, btn?: Element | null) => {
  if (dot) gsap.fromTo(dot, { scale: 0.55 }, { scale: 1, duration: 0.28, ease: "power2.out", overwrite: "auto" });
  if (btn) gsap.fromTo(btn, { scale: 0.92 }, { scale: 1, duration: 0.3, ease: "power2.out", overwrite: "auto" });
};

const all = (el: Element, sel: string) => [...el.querySelectorAll<HTMLElement>(sel)];
const wrapMod = (v: number, m: number) => ((v % m) + m) % m;

/* ───────────────────────── M542 · Full-screen scale-in slider ───────────────────────── */
const M542_SLIDES = [
  { src: scene(0, 1600, 1000), tag: "Glacier line" },
  { src: scene(1, 1600, 1000), tag: "Ember line" },
  { src: scene(2, 1600, 1000), tag: "Fern line" },
  { src: scene(3, 1600, 1000), tag: "Amber line" },
];
function M542() {
  const root = useRef<HTMLDivElement>(null);
  const go = useRef<(d: number) => void>(() => {});
  usePlay(
    root,
    (el, ctx) => {
      const slides = all(el, ".m542-slide");
      const imgs = all(el, ".m542-img");
      const bar = el.querySelector(".m542-bar");
      const num = el.querySelector(".m542-num");
      const tag = el.querySelector(".m542-tag");
      const N = slides.length;
      const SEG = 1.6;
      let cur = 0;
      const next = (d = 1) =>
        ctx.add(() => {
          const j = wrapMod(cur + d, N);
          slides.forEach((s, k) => gsap.set(s, k === j || k === cur ? { zIndex: k === j ? 2 : 1 } : { zIndex: 0, opacity: 0 }));
          gsap.fromTo(slides[j], { opacity: 0, xPercent: 7 * d }, { opacity: 1, xPercent: 0, duration: 0.9, ease: "power3.out", overwrite: true });
          gsap.fromTo(imgs[j], { scale: 1.1 }, { scale: 1, duration: SEG + 0.2, ease: "power1.out", overwrite: true });
          gsap.to(slides[cur], { xPercent: -4 * d, duration: 0.9, ease: "power3.out", overwrite: true });
          if (num) num.textContent = `0${j + 1}`;
          if (tag) gsap.fromTo(tag, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: "power3.out", onStart: () => (tag.textContent = M542_SLIDES[j].tag) });
          cur = j;
        });
      gsap.fromTo(imgs[0], { scale: 1.1 }, { scale: 1, duration: SEG + 0.2, ease: "power1.out" });
      const clock = gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: SEG, ease: "none", repeat: -1, paused: true, onRepeat: () => next(1) });
      go.current = (d) => {
        next(d);
        clock.restart();
      };
      return clock;
    },
    {},
  );
  return (
    <Stage r={root} g1="rgba(79,141,255,.5)" g2="rgba(255,122,89,.22)">
      <div className="absolute inset-0">
        {M542_SLIDES.map((s, i) => (
          <div key={i} className="m542-slide absolute inset-0 overflow-hidden" style={{ opacity: i === 0 ? 1 : 0, zIndex: i === 0 ? 2 : 0 }}>
            <div className="m542-img absolute inset-0">
              <Img src={s.src} />
            </div>
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />
      <div className="pointer-events-none absolute bottom-[12%] left-[6%] z-20">
        <p className="overflow-hidden text-[13px] uppercase tracking-[0.24em] text-white/75">
          <span className="m542-tag inline-block">Glacier line</span>
        </p>
        <h3 className="mt-3 text-[clamp(48px,6vw,104px)] font-[700] leading-[0.92] tracking-[-0.035em]" style={{ fontFamily: F.sg }}>
          Built for
          <br />
          the long cold
        </h3>
        <p className="mt-4 text-[16px] text-white/80">Expedition shell · from ₹ 18,900</p>
      </div>
      <div className="absolute bottom-[12%] right-[6%] z-20 flex items-center gap-4">
        <span className="m542-num text-[40px] font-[600] tabular-nums" style={{ fontFamily: F.sg }}>
          01
        </span>
        <div className="h-[2px] w-[120px] bg-white/20">
          <div className="m542-bar h-full w-full origin-left bg-white" style={{ transform: "scaleX(0)" }} />
        </div>
        <button type="button" onClick={() => go.current(-1)} className="grid h-12 w-12 place-items-center rounded-full border border-white/30 text-[18px]" aria-label="Previous">
          ←
        </button>
        <button type="button" onClick={() => go.current(1)} className="grid h-12 w-12 place-items-center rounded-full border border-white/30 text-[18px]" aria-label="Next">
          →
        </button>
      </div>
      <Sheen g1="rgba(120,170,255,.5)" />
    </Stage>
  );
}

/* ───────────────────────── M543 · Clip-path wipe carousel ───────────────────────── */
const M543_DIRS = ["left", "right", "up", "down"] as const;
const M543_FROM: Record<(typeof M543_DIRS)[number], string> = {
  left: "inset(0% 100% 0% 0%)",
  right: "inset(0% 0% 0% 100%)",
  up: "inset(100% 0% 0% 0%)",
  down: "inset(0% 0% 100% 0%)",
};
const M543_SLIDES = [
  { src: scene(3, 1600, 1000), n: "Terra vase", p: "₹ 4,200" },
  { src: scene(1, 1600, 1000), n: "Rosewater jug", p: "₹ 3,650" },
  { src: scene(2, 1600, 1000), n: "Moss carafe", p: "₹ 2,900" },
  { src: scene(0, 1600, 1000), n: "Tide tumbler", p: "₹ 1,450" },
];
function M543() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, ctx) => {
    const slides = all(el, ".m543-slide");
    const imgs = all(el, ".m543-img");
    const name = el.querySelector(".m543-name");
    const dirEl = el.querySelector(".m543-dir");
    const N = slides.length;
    let cur = 0;
    let k = 0;
    const next = () =>
      ctx.add(() => {
        const j = (cur + 1) % N;
        const dir = M543_DIRS[k++ % 4];
        slides.forEach((s, i) => gsap.set(s, { zIndex: i === j ? 2 : i === cur ? 1 : 0 }));
        gsap.fromTo(slides[j], { clipPath: M543_FROM[dir] }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.8, ease: "power3.inOut", overwrite: true });
        gsap.fromTo(imgs[j], { scale: 1.14 }, { scale: 1, duration: 1.05, ease: "power2.out", overwrite: true });
        gsap.to(imgs[cur], { scale: 1.06, duration: 0.8, ease: "power3.inOut", overwrite: true });
        if (dirEl) dirEl.textContent = dir;
        if (name) gsap.fromTo(name, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.5, delay: 0.3, ease: "power3.out", onStart: () => (name.textContent = `${M543_SLIDES[j].n} · ${M543_SLIDES[j].p}`) });
        cur = j;
      });
    const bar = el.querySelector(".m543-bar");
    return gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 1.05, ease: "none", repeat: -1, paused: true, onRepeat: next });
  });
  return (
    <Stage r={root} g1="rgba(224,145,63,.5)" g2="rgba(255,77,109,.2)">
      <div className="absolute inset-[4%] overflow-hidden rounded-[22px]">
        {M543_SLIDES.map((s, i) => (
          <div key={i} className="m543-slide absolute inset-0 overflow-hidden" style={{ clipPath: i === 0 ? "inset(0% 0% 0% 0%)" : M543_FROM.right, zIndex: i === 0 ? 2 : 0 }}>
            <div className="m543-img absolute inset-0">
              <Img src={s.src} />
            </div>
          </div>
        ))}
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="pointer-events-none absolute bottom-[9%] left-[5%] right-[5%] z-20 flex items-end justify-between">
          <div>
            <p className="text-[13px] uppercase tracking-[0.24em] text-white/70">Kiln &amp; Clay · spring glaze</p>
            <h3 className="mt-2 text-[clamp(44px,5.4vw,90px)] leading-[0.95]" style={{ fontFamily: F.is }}>
              Fired by hand
            </h3>
            <p className="m543-name mt-2 text-[17px] text-white/85">Terra vase · ₹ 4,200</p>
          </div>
          <div className="text-right">
            <p className="text-[13px] uppercase tracking-[0.22em] text-white/70">
              wipe · <span className="m543-dir">left</span>
            </p>
            <div className="mt-3 h-[2px] w-[140px] bg-white/20">
              <div className="m543-bar h-full w-full origin-left bg-[#ffd59a]" style={{ transform: "scaleX(0)" }} />
            </div>
          </div>
        </div>
      </div>
      <Sheen g1="rgba(255,190,120,.5)" />
    </Stage>
  );
}

/* ───────────────────────── M544 · Filmstrip unfurl ───────────────────────── */
const M544_CARDS = [
  { i: 0, n: "Night Ferry", d: "Short film · 12 min", p: "₹ 249" },
  { i: 1, n: "Red Orchard", d: "Documentary · 48 min", p: "₹ 399" },
  { i: 2, n: "Green Hours", d: "Series · 6 episodes", p: "₹ 599" },
  { i: 3, n: "Copper Coast", d: "Feature · 1 h 52", p: "₹ 449" },
  { i: 1, n: "Salt & Ash", d: "Short film · 18 min", p: "₹ 249" },
  { i: 0, n: "Blue Static", d: "Concert · 74 min", p: "₹ 349" },
];
function M544() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, ctx) => {
    const cards = all(el, ".m544-card");
    const imgs = all(el, ".m544-img");
    const caps = all(el, ".m544-cap");
    const N = cards.length;
    let cur = 0;
    const next = () =>
      ctx.add(() => {
        const j = (cur + 1) % N;
        gsap.to(cards[cur], { clipPath: "inset(0% 0% 48% 0% round 18px)", duration: 0.85, ease: "power3.inOut", overwrite: true });
        gsap.to(caps[cur], { opacity: 0, y: 24, duration: 0.4, ease: "power2.in", overwrite: true });
        gsap.fromTo(cards[j], { clipPath: "inset(0% 0% 48% 0% round 18px)" }, { clipPath: "inset(0% 0% 0% 0% round 18px)", duration: 0.85, ease: "power3.inOut", overwrite: true });
        gsap.fromTo(imgs[j], { scale: 1.18 }, { scale: 1, duration: 1.15, ease: "power2.out", overwrite: true });
        gsap.fromTo(caps[j], { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.55, delay: 0.4, ease: "power3.out", overwrite: true });
        cur = j;
      });
    const bar = el.querySelector(".m544-bar");
    return gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 1.15, ease: "none", repeat: -1, paused: true, onRepeat: next });
  });
  return (
    <Stage r={root} g1="rgba(255,77,109,.5)" g2="rgba(79,141,255,.22)">
      <div className="absolute left-[5%] right-[5%] top-[6%] flex items-center justify-between">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/70">Lantern Cinema · now showing</p>
        <div className="h-[2px] w-[140px] bg-white/20">
          <div className="m544-bar h-full w-full origin-left bg-white" style={{ transform: "scaleX(0)" }} />
        </div>
      </div>
      <div className="absolute bottom-[6%] left-[5%] right-[5%] top-[15%] flex items-start gap-[1.4%]">
        {M544_CARDS.map((c, i) => (
          <div key={i} className={`m544-card relative h-full flex-1 overflow-hidden ${i === 0 ? "is-on" : ""}`}>
            <div className="m544-img absolute inset-0">
              <Img src={scene(c.i, 500, 900)} />
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/70" />
            <p className="absolute left-[10%] top-[5%] text-[13px] font-[600] uppercase tracking-[0.16em] text-white/90" style={{ fontFamily: F.mr }}>
              0{i + 1}
            </p>
            <p className="absolute left-[10%] right-[8%] top-[11%] text-[clamp(18px,1.6vw,26px)] font-[600] leading-[1.05] tracking-[-0.02em]" style={{ fontFamily: F.sg }}>
              {c.n}
            </p>
            <div className="m544-cap absolute bottom-[6%] left-[10%] right-[8%]" style={{ opacity: i === 0 ? 1 : 0 }}>
              <p className="text-[13px] text-white/80">{c.d}</p>
              <p className="mt-1 text-[18px] font-[600]">Rent {c.p}</p>
            </div>
          </div>
        ))}
      </div>
      <Sheen g1="rgba(255,130,150,.5)" />
    </Stage>
  );
}

/* ───────────────────────── M545 · Wheel picker with background crossfade ───────────────────────── */
const M545_ITEMS = [
  { n: "Coastal", s: scene(0, 1600, 1000) },
  { n: "Desert", s: scene(3, 1600, 1000) },
  { n: "Rainforest", s: scene(2, 1600, 1000) },
  { n: "Canyon", s: scene(1, 1600, 1000) },
  { n: "Lagoon", s: scene(0, 1600, 1000) },
  { n: "Dune", s: scene(3, 1600, 1000) },
  { n: "Highland", s: scene(2, 1600, 1000) },
  { n: "Volcanic", s: scene(1, 1600, 1000) },
];
const M545_PRICE = ["₹ 42,000", "₹ 58,500", "₹ 64,000", "₹ 49,900", "₹ 71,000", "₹ 55,000", "₹ 38,800", "₹ 66,400"];
function M545() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const wheel = useRef<HTMLDivElement>(null);
  const real = useRealPointer(root);
  const st = useRef({ pos: 0, v: 0, t0: -1, lastY: 0, wasDown: false, active: -1, labels: [] as HTMLElement[], bgs: [] as HTMLElement[] });
  const N = M545_ITEMS.length;
  const STEP = 0.34; // radians between labels
  const R = 330; // arc radius (px)
  useTicker(root, (t, dt) => {
    const el = root.current;
    const w = wheel.current;
    if (!el || !w) return;
    const s = st.current;
    if (!s.labels.length) {
      s.labels = all(el, ".m545-label");
      s.bgs = all(el, ".m545-bg");
    }
    if (s.t0 < 0) s.t0 = t;
    const wc = centre(w, el);
    const rp = real.current;
    const useReal = performance.now() - rp.at < 2500;
    let down = false;
    let y = 0;
    let px = 0;
    if (useReal) {
      down = rp.down;
      y = rp.y;
      px = rp.x;
    } else {
      // fake flick: press, drag ~110 px (up twice, down once), release with speed, glide back to the start point
      const T = 1.5;
      const tt = t - s.t0;
      const k = Math.floor(tt / T);
      const f = (tt / T) % 1;
      const dir = k % 3 === 2 ? -1 : 1;
      const y0 = wc.y + dir * 70;
      if (f < 0.22) {
        down = true;
        const e = f / 0.22;
        y = y0 - dir * 140 * e * e; // speeds up into the release, so the wheel keeps spinning (inertia)
      } else {
        down = false;
        const nd = (k + 1) % 3 === 2 ? -1 : 1;
        const y1 = wc.y + nd * 70;
        y = y0 - dir * 140 + (y1 - (y0 - dir * 140)) * easeIO(Math.min(1, (f - 0.22) / 0.78));
      }
      px = wc.x + 120;
    }
    if (dot.current) {
      dot.current.style.transform = `translate3d(${px.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${down ? 0.75 : 1})`;
      dot.current.style.opacity = useReal ? "0" : "1";
    }
    if (down) {
      if (s.wasDown) {
        const dItems = -(y - s.lastY) / (R * STEP);
        s.pos += dItems;
        s.v = s.v * 0.6 + (dItems / Math.max(dt, 1 / 120)) * 0.4;
      }
      s.lastY = y;
    } else {
      s.pos += s.v * dt;
      s.v *= Math.exp(-3.2 * dt);
      if (Math.abs(s.v) < 0.8) {
        s.pos += (Math.round(s.pos) - s.pos) * Math.min(1, dt * 7);
        s.v *= Math.exp(-6 * dt);
      }
    }
    s.wasDown = down;
    s.labels.forEach((lab, i) => {
      const a = (wrapMod(i - s.pos + N / 2, N) - N / 2) * STEP;
      const x = R * Math.cos(a) - R;
      const yy = R * Math.sin(a);
      const o = Math.max(0, 1 - Math.abs(a) / 1.25);
      lab.style.transform = `translate3d(${x.toFixed(1)}px,${yy.toFixed(1)}px,0) rotate(${a.toFixed(4)}rad) scale(${(1 - Math.abs(a) * 0.18).toFixed(3)})`;
      lab.style.opacity = (o * o).toFixed(3);
    });
    const act = wrapMod(Math.round(s.pos), N);
    if (act !== s.active) {
      s.active = act;
      s.bgs.forEach((b, i) => gsap.to(b, { opacity: i === act ? 1 : 0, duration: 0.6, ease: "power2.out", overwrite: true }));
      const pr = el.querySelector(".m545-price");
      if (pr) pr.textContent = `${M545_ITEMS[act].n} retreat · 5 nights · ${M545_PRICE[act]}`;
    }
  });
  return (
    <Stage r={root} g1="rgba(24,196,143,.5)" g2="rgba(79,141,255,.2)" className="cursor-grab touch-none select-none">
      {M545_ITEMS.map((it, i) => (
        <div key={i} className="m545-bg absolute inset-0" style={{ opacity: i === 0 ? 1 : 0 }}>
          <Img src={it.s} className="scale-[1.04]" />
        </div>
      ))}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/10" />
      <p className="absolute left-[6%] top-[8%] text-[13px] uppercase tracking-[0.24em] text-white/70">Wayfarer Journeys · pick a landscape</p>
      <div ref={wheel} className="absolute left-[44%] top-1/2 h-0 w-0">
        {M545_ITEMS.map((it, i) => {
          const a = (wrapMod(i + N / 2, N) - N / 2) * STEP;
          return (
            <div
              key={i}
              className="m545-label absolute right-0 top-0 -mt-[0.6em] origin-right whitespace-nowrap text-right text-[clamp(40px,4.4vw,72px)] leading-[1.2] tracking-[-0.02em]"
              style={{ fontFamily: F.fr, transform: `translate3d(${(R * Math.cos(a) - R).toFixed(1)}px,${(R * Math.sin(a)).toFixed(1)}px,0) rotate(${a.toFixed(4)}rad)`, opacity: Math.max(0, 1 - Math.abs(a) / 1.25) ** 2 }}
            >
              {it.n}
            </div>
          );
        })}
        <div className="absolute left-[18px] top-0 -mt-[7px] h-0 w-0 border-y-[7px] border-r-[12px] border-y-transparent border-r-white" />
      </div>
      <div className="pointer-events-none absolute bottom-[9%] right-[6%] text-right">
        <p className="text-[13px] uppercase tracking-[0.22em] text-white/70">drag the wheel</p>
        <p className="m545-price mt-2 text-[clamp(20px,1.8vw,28px)] font-[600]" style={{ fontFamily: F.sg }}>
          Coastal retreat · 5 nights · ₹ 42,000
        </p>
      </div>
      <Sheen g1="rgba(110,230,180,.5)" />
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M546 · Liquid-glass lens carousel (WebGL) ───────────────────────── */
const M546_FRAG = /* glsl */ `
uniform float uOff, uZoom;
vec3 strip(vec2 px) {
  float H = uRes.y;
  float th = H * 0.78;
  float tw = th * 0.8;
  float gap = H * 0.05;
  float y = (px.y - (H - th) * 0.5) / th;
  float cell = (px.x + uOff * (tw + gap)) / (tw + gap);
  float id = floor(cell);
  float lx = fract(cell) * (tw + gap) / tw;
  vec3 bg = vec3(0.035, 0.045, 0.08);
  if (lx > 1.0 || y < 0.0 || y > 1.0) return bg;
  float k = mod(id, 4.0);
  return texture2D(uTex0, vec2((k + lx) / 4.0, y)).rgb;
}
void main() {
  vec2 px = vUv * uRes;
  vec2 c = 0.5 * uRes;
  float R = mix(0.34, 0.47, uZoom) * uRes.y;
  vec2 d = px - c;
  float r = length(d) / R;
  vec3 col = strip(px) * 0.5;
  col *= 1.0 - 0.45 * smoothstep(1.32, 1.0, r);                 // soft shadow around the lens
  if (r < 1.0) {
    float mag = mix(1.3, 2.1, uZoom);
    vec2 n = d / max(length(d), 1e-3);
    vec2 q = d / mag * (1.0 + 0.55 * pow(r, 4.0));              // refraction bends hard near the rim
    float ca = R * 0.035 * r * r;                                // chromatic split grows towards the rim
    vec3 inside;
    inside.r = strip(c + q + n * ca).r;
    inside.g = strip(c + q).g;
    inside.b = strip(c + q - n * ca).b;
    float ang = atan(d.y, d.x);
    float rim = smoothstep(0.84, 1.0, r);
    inside += rim * vec3(0.32, 0.38, 0.5) * (0.65 + 0.35 * sin(ang * 2.0 + uTime * 1.3));
    inside += smoothstep(0.55, 0.0, length(d / R - vec2(-0.38, 0.42))) * 0.16;   // top-left highlight
    col = mix(col, inside, smoothstep(1.0, 0.985, r));
  }
  gl_FragColor = vec4(col, 1.0);
}`;
const M546_TILES = ["DRIFT 01", "BLOOM 02", "MOSS 03", "EMBER 04"];
async function m546Strip() {
  const W = 512;
  const H = 640;
  const c = document.createElement("canvas");
  c.width = W * 4;
  c.height = H;
  const g = c.getContext("2d")!;
  const order = [0, 1, 2, 3];
  for (const i of order) {
    const img = new Image();
    img.src = scene(i, W, H, M546_TILES[i]);
    await img.decode();
    g.drawImage(img, i * W, 0, W, H);
  }
  return c;
}
function M546() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const lens = useRef<HTMLDivElement>(null);
  const st = useRef({ z: 0, off: 0, last: -1 });
  const near = useNear(root);
  useEffect(() => {
    if (!near) return;
    let dead = false;
    let h: GLHandle | null = null;
    (async () => {
      const tex = await m546Strip();
      if (dead || !canvas.current) return;
      h = await createShader(canvas.current, M546_FRAG, {
        dpr: 1,
        textures: [tex],
        uniforms: { uOff: { value: 0 }, uZoom: { value: 0 } },
        onFrame: (u, t) => {
          const s = st.current;
          const dt = s.last < 0 ? 0 : Math.min(0.05, t - s.last);
          s.last = t;
          s.off += dt * 0.32 * (1 - 0.6 * s.z);
          u.uOff.value = s.off;
          u.uZoom.value = s.z;
        },
      });
      if (dead) h?.destroy();
    })();
    return () => {
      dead = true;
      h?.destroy();
      gsap.killTweensOf(st.current);
    };
  }, [near]);
  const toggle = () => gsap.to(st.current, { z: st.current.z > 0.5 ? 0 : 1, duration: 0.6, ease: "power3.inOut", overwrite: true });
  usePlay(
    root,
    (el) => {
      const L = lens.current!;
      const c = centre(L, el);
      const tl = gsap.timeline({ repeat: -1, paused: true });
      tl.set(dot.current, { x: c.x + 260, y: c.y + 150, opacity: 1 })
        .to(dot.current, { x: c.x + 20, y: c.y + 10, duration: 0.55, ease: "power2.inOut" })
        .call(() => press(dot.current))
        .to(st.current, { z: 1, duration: 0.6, ease: "power3.inOut" })
        .to(dot.current, { x: c.x + 90, y: c.y - 60, duration: 0.6, ease: "sine.inOut" }, "<")
        .to(dot.current, { x: c.x - 30, y: c.y + 20, duration: 0.5, ease: "power2.inOut" })
        .call(() => press(dot.current))
        .to(st.current, { z: 0, duration: 0.6, ease: "power3.inOut" })
        .to(dot.current, { x: c.x + 260, y: c.y + 150, duration: 0.6, ease: "power2.inOut" }, "<");
      return tl;
    },
    { interactive: true },
  );
  return (
    <Stage r={root} g1="rgba(120,140,255,.55)" g2="rgba(255,122,89,.2)">
      {/* fallback underneath: a plain row of the same photos (the canvas covers it after its first frame) */}
      <div className="absolute inset-0 flex items-center justify-center gap-[3%] opacity-50">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[78%] w-[26%] overflow-hidden">
            <Img src={scene(i, 512, 640, M546_TILES[i])} />
          </div>
        ))}
      </div>
      <canvas ref={canvas} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-300" aria-hidden />
      <div ref={lens} onClick={toggle} className="absolute left-1/2 top-1/2 -ml-[23vh] -mt-[23vh] h-[46vh] w-[46vh] cursor-zoom-in rounded-full" />
      <div className="pointer-events-none absolute left-[5%] top-[7%]">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/70">Prism Optics · the glass collection</p>
      </div>
      <div className="pointer-events-none absolute bottom-[7%] left-[5%] right-[5%] flex items-end justify-between">
        <h3 className="text-[clamp(40px,4.6vw,76px)] font-[600] leading-[0.95] tracking-[-0.03em]" style={{ fontFamily: F.sg }}>
          Look closer
        </h3>
        <p className="text-[16px] text-white/80">Tap the lens to zoom · prints from ₹ 2,400</p>
      </div>
      <Sheen g1="rgba(140,160,255,.5)" />
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M547 · Flip reorder carousel ───────────────────────── */
const M547_CARDS = [
  { i: 0, n: "Harbour Lamp", p: "₹ 6,400" },
  { i: 1, n: "Clay Pendant", p: "₹ 8,900" },
  { i: 2, n: "Fern Sconce", p: "₹ 5,200" },
  { i: 3, n: "Brass Arc", p: "₹ 12,500" },
];
function M547() {
  const root = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);
  usePlay(
    root,
    (el, ctx, onClean) => {
      const R = row.current!;
      const original = all(R, ".m547-card");
      onClean(() => original.forEach((c) => R.appendChild(c)));
      const step = () =>
        ctx.add(() => {
          if (!Flip) return;
          const cards = all(R, ".m547-card");
          const state = Flip.getState(cards);
          const first = cards[0];
          R.appendChild(first);
          const now = all(R, ".m547-card");
          now.forEach((c, i) => {
            c.classList.toggle("is-active", i === 0);
            c.style.zIndex = c === first ? "0" : "1";
          });
          Flip.from(state, { duration: 0.8, ease: "power3.inOut" });
          gsap.fromTo(first, { opacity: 1 }, { opacity: 0.2, duration: 0.4, ease: "power2.in", yoyo: true, repeat: 1 });
          const cap = now[0].querySelector(".m547-cap");
          if (cap) gsap.fromTo(cap, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, delay: 0.35, ease: "power3.out", clearProps: "opacity,transform" });
        });
      const bar = el.querySelector(".m547-bar");
      return gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 1.05, ease: "none", repeat: -1, paused: true, onRepeat: step });
    },
    { pre: needFlip },
  );
  return (
    <Stage r={root} g1="rgba(224,145,63,.5)" g2="rgba(79,141,255,.2)">
      <div className="absolute left-[5%] right-[5%] top-[7%] flex items-end justify-between">
        <div>
          <p className="text-[13px] uppercase tracking-[0.24em] text-white/70">Lumen House · lighting</p>
          <h3 className="mt-2 text-[clamp(36px,3.8vw,62px)] leading-[0.95]" style={{ fontFamily: F.fr }}>
            Warm light, made slow
          </h3>
        </div>
        <div className="h-[2px] w-[140px] bg-white/20">
          <div className="m547-bar h-full w-full origin-left bg-[#ffd59a]" style={{ transform: "scaleX(0)" }} />
        </div>
      </div>
      <div ref={row} className="absolute bottom-[7%] left-[5%] right-[5%] top-[30%] flex items-end gap-[2%]">
        {M547_CARDS.map((c, i) => (
          <div key={i} className={`m547-card relative overflow-hidden rounded-[18px] ${i === 0 ? "is-active" : ""}`}>
            <Img src={scene(c.i, 800, 700)} className="absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
            <div className="m547-cap absolute bottom-[8%] left-[7%] right-[7%]">
              <p className="text-[clamp(20px,1.8vw,28px)] font-[600] tracking-[-0.02em]" style={{ fontFamily: F.sg }}>
                {c.n}
              </p>
              <p className="mt-1 text-[15px] text-white/80">{c.p}</p>
            </div>
          </div>
        ))}
      </div>
      <Sheen g1="rgba(255,190,120,.5)" />
    </Stage>
  );
}

/* ───────────────────────── M548 · Infinite drag wall ───────────────────────── */
const M548_NAMES = ["Atlas Tote", "Nomad Sling", "Pier Duffel", "Vale Pack", "Cove Clutch", "Ridge Roll-top"];
const M548_COLS = 7;
const M548_ROWS = 4;
const M548_STROKES: [number, number][] = [
  [1, 0.35],
  [-0.35, 1],
  [-1, -0.45],
  [0.5, -1],
  [-1, 0.2],
  [0.2, 1],
];
function M548() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const real = useRealPointer(root);
  const st = useRef({ ox: 0, oy: 0, vx: 0, vy: 0, t0: -1, lx: 0, ly: 0, was: false, tiles: [] as HTMLElement[] });
  useTicker(root, (t, dt) => {
    const el = root.current;
    if (!el) return;
    const s = st.current;
    if (!s.tiles.length) s.tiles = all(el, ".m548-tile");
    if (s.t0 < 0) s.t0 = t;
    const W = el.clientWidth;
    const H = el.clientHeight;
    const rp = real.current;
    const useReal = performance.now() - rp.at < 2500;
    let down = false;
    let x = 0;
    let y = 0;
    if (useReal) {
      down = rp.down;
      x = rp.x;
      y = rp.y;
    } else {
      // fake drag strokes in six directions: press + drag 0.5 s, release with speed, drift back while the wall glides
      const T = 1.4;
      const tt = t - s.t0;
      const k = Math.floor(tt / T);
      const f = (tt / T) % 1;
      const [dx, dy] = M548_STROKES[k % M548_STROKES.length];
      const len = Math.hypot(dx, dy);
      const D = 240;
      const x0 = W / 2 - (dx / len) * D * 0.5;
      const y0 = H / 2 - (dy / len) * D * 0.5;
      if (f < 0.36) {
        down = true;
        const e = easeOut(f / 0.36);
        x = x0 + (dx / len) * D * e;
        y = y0 + (dy / len) * D * e;
      } else {
        const [ndx, ndy] = M548_STROKES[(k + 1) % M548_STROKES.length];
        const nl = Math.hypot(ndx, ndy);
        const x1 = W / 2 - (ndx / nl) * D * 0.5;
        const y1 = H / 2 - (ndy / nl) * D * 0.5;
        const e = easeIO((f - 0.36) / 0.64);
        x = x0 + (dx / len) * D + (x1 - (x0 + (dx / len) * D)) * e;
        y = y0 + (dy / len) * D + (y1 - (y0 + (dy / len) * D)) * e;
      }
    }
    if (dot.current) {
      dot.current.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${down ? 0.75 : 1})`;
      dot.current.style.opacity = useReal ? "0" : "1";
    }
    if (down) {
      if (s.was) {
        const ddx = x - s.lx;
        const ddy = y - s.ly;
        s.ox += ddx;
        s.oy += ddy;
        const inv = 1 / Math.max(dt, 1 / 120);
        s.vx = s.vx * 0.5 + ddx * inv * 0.5;
        s.vy = s.vy * 0.5 + ddy * inv * 0.5;
      }
      s.lx = x;
      s.ly = y;
    } else {
      s.ox += s.vx * dt;
      s.oy += s.vy * dt;
      const k = Math.exp(-2.6 * dt);
      s.vx *= k;
      s.vy *= k;
    }
    s.was = down;
    // modulo wrap: every tile lives in a COLS×ROWS torus bigger than the stage
    const CW = W * 0.19;
    const CH = CW * 1.22;
    const TW = CW * M548_COLS;
    const TH = CH * M548_ROWS;
    s.tiles.forEach((tile, i) => {
      const c = i % M548_COLS;
      const r = Math.floor(i / M548_COLS);
      const tx = wrapMod(c * CW + s.ox + (r % 2) * CW * 0.5, TW) - CW;
      const ty = wrapMod(r * CH + s.oy, TH) - CH;
      tile.style.transform = `translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0)`;
    });
  });
  return (
    <Stage r={root} g1="rgba(79,141,255,.55)" g2="rgba(255,179,107,.2)" className="cursor-grab touch-none select-none">
      {Array.from({ length: M548_COLS * M548_ROWS }, (_, i) => {
        const c = i % M548_COLS;
        const r = Math.floor(i / M548_COLS);
        return (
          <div
            key={i}
            className="m548-tile absolute left-0 top-0 p-[0.6%]"
            style={{ width: "19%", aspectRatio: "1 / 1.22", transform: `translate3d(calc(${c} * 100% - 100%),calc(${r} * 100% - 100%),0)` }}
          >
            <div className="relative h-full w-full overflow-hidden rounded-[14px]">
              <Img src={scene((c + r * 2) % 4, 400, 500)} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <p className="absolute bottom-[7%] left-[8%] text-[13px] font-[600]" style={{ fontFamily: F.mr }}>
                {M548_NAMES[i % M548_NAMES.length]} · ₹ {(3 + ((i * 7) % 9)) * 1000 + 490}
              </p>
            </div>
          </div>
        );
      })}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_70%_at_50%_50%,transparent,rgba(5,8,15,.7))]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -ml-[220px] -mt-[60px] w-[440px] rounded-[20px] bg-black/55 px-8 py-6 text-center">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/70">Carry Co. · all bags</p>
        <h3 className="mt-2 text-[clamp(30px,2.8vw,44px)] font-[700] leading-[1] tracking-[-0.03em]" style={{ fontFamily: F.sy }}>
          Drag anywhere
        </h3>
      </div>
      <Sheen g1="rgba(120,170,255,.5)" />
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M549 · 3D tilted marquee wall ───────────────────────── */
const M549_COLS = 6;
const M549_PER = 5;
function M549() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const io = new IntersectionObserver(([e]) => el.classList.toggle("m549-run", e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Stage r={root} g1="rgba(255,77,109,.5)" g2="rgba(224,145,63,.24)">
      <div className="absolute inset-0" style={{ perspective: "1400px" }}>
        <div
          className="absolute left-1/2 top-1/2 flex items-start gap-[18px]"
          style={{ width: 1800, height: 1800, marginLeft: -900, marginTop: -900, transform: "rotateX(52deg) rotateZ(-38deg)", transformStyle: "preserve-3d" }}
        >
          {Array.from({ length: M549_COLS }, (_, c) => (
            <div key={c} className={`m549-col flex flex-1 flex-col ${c % 2 ? "m549-down" : ""}`} style={{ "--d": `${10 + (c % 3) * 2.5}s` } as CSSProperties}>
              {Array.from({ length: M549_PER * 2 }, (_, k) => (
                <div key={k} className="mb-[18px] aspect-[4/5] w-full shrink-0 overflow-hidden rounded-[14px] shadow-[0_20px_40px_rgba(0,0,0,.45)]">
                  <Img src={scene((c + (k % M549_PER)) % 4, 400, 500)} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_70%_at_30%_60%,rgba(5,8,15,.85),rgba(5,8,15,.15))]" />
      <div className="pointer-events-none absolute bottom-[12%] left-[6%]">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/70">Studio Arcade · lookbook</p>
        <h3 className="mt-3 text-[clamp(48px,5.6vw,96px)] font-[800] uppercase leading-[0.9] tracking-[-0.03em]" style={{ fontFamily: F.sy }}>
          The whole
          <br />
          season
        </h3>
        <p className="mt-4 text-[16px] text-white/80">212 pieces · from ₹ 1,990</p>
      </div>
      <Sheen g1="rgba(255,130,150,.5)" />
    </Stage>
  );
}

/* ───────────────────────── M550 · Velocity-skew photo grid (scrub) ───────────────────────── */
const M550_NAMES = ["Linen shirt", "Field jacket", "Wool crew", "Pleat trouser", "Canvas cap", "Rib tank", "Chore coat", "Twill short", "Knit polo", "Cargo pant", "Silk scarf", "Overshirt"];
function M550() {
  const root = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const meter = useRef<HTMLSpanElement>(null);
  const st = useRef({ p: 0, lp: -1, skew: 0, photos: [] as HTMLElement[], cols: [] as HTMLElement[] });
  const place = () => {
    const g = grid.current;
    const el = root.current;
    if (!g || !el) return;
    const s = st.current;
    if (!s.cols.length) s.cols = all(g, ".m550-col");
    const travel = Math.max(0, g.offsetHeight - el.clientHeight * 0.7);
    s.cols.forEach((c, i) => {
      const extra = i === 1 ? 140 : 0; // the middle column runs a little further (parallax)
      c.style.transform = `translate3d(0,${(-s.p * (travel + extra) + (i === 1 ? 70 : 0)).toFixed(1)}px,0)`;
    });
  };
  useScrub(root, (p) => {
    st.current.p = p; // linear over the whole panel
    place();
  });
  useTicker(root, (_t, dt) => {
    const s = st.current;
    if (!s.photos.length && root.current) s.photos = all(root.current, ".m550-photo");
    const vel = s.lp < 0 || dt <= 0 ? 0 : (s.p - s.lp) / dt;
    s.lp = s.p;
    const target = gsap.utils.clamp(-12, 12, vel * 14);
    s.skew += (target - s.skew) * Math.min(1, dt * 7); // damped, eases back to flat when the scroll stops
    const sk = Math.abs(s.skew) < 0.01 ? 0 : s.skew;
    s.photos.forEach((ph, i) => {
      const f = 1 + (i % 3) * 0.12;
      ph.style.transform = `skewY(${(sk * f).toFixed(2)}deg) scale(${(1 - Math.abs(sk) * 0.004).toFixed(4)})`;
    });
    if (meter.current) meter.current.textContent = `${Math.abs(sk).toFixed(1)}°`;
  });
  return (
    <Stage r={root} g1="rgba(24,196,143,.5)" g2="rgba(79,141,255,.22)">
      <div className="absolute inset-y-0 left-[30%] right-[4%] overflow-hidden">
        <div ref={grid} className="flex gap-[2.4%] pt-[4%]">
          {[0, 1, 2].map((c) => (
            <div key={c} className="m550-col flex flex-1 flex-col gap-5">
              {[0, 1, 2, 3].map((k) => {
                const i = c * 4 + k;
                return (
                  <div key={k} className="m550-photo relative aspect-[4/5] overflow-hidden rounded-[16px] will-change-transform">
                    <Img src={scene((c + k) % 4, 500, 625)} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                    <p className="absolute bottom-[6%] left-[7%] text-[13px] font-[600]" style={{ fontFamily: F.mr }}>
                      {M550_NAMES[i]} · ₹ {(2 + ((i * 5) % 7)) * 1000 + 490}
                    </p>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute left-[5%] top-1/2 -mt-[120px] w-[24%]">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/70">Northfold · SS edit</p>
        <h3 className="mt-3 text-[clamp(40px,4.2vw,70px)] font-[700] leading-[0.95] tracking-[-0.035em]" style={{ fontFamily: F.sg }}>
          Scroll faster
        </h3>
        <p className="mt-4 text-[15px] text-white/75">
          skew <span ref={meter}>0.0°</span>
        </p>
      </div>
      <Sheen g1="rgba(110,230,180,.5)" />
    </Stage>
  );
}

/* ───────────────────────── M551 · Masonry to 3D slideshow ───────────────────────── */
const M551_TILES = [
  { i: 0, h: "56%", n: "Arc chair" },
  { i: 1, h: "40%", n: "Ember stool" },
  { i: 2, h: "44%", n: "Moss sofa" },
  { i: 3, h: "41%", n: "Dune bench" },
  { i: 1, h: "57%", n: "Clay side table" },
  { i: 0, h: "53%", n: "Tide lounger" },
];
const M551_SLIDES = [
  { i: 2, n: "Moss sofa", p: "₹ 84,000" },
  { i: 3, n: "Dune bench", p: "₹ 26,500" },
  { i: 1, n: "Clay side table", p: "₹ 14,900" },
];
function M551() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  usePlay(
    root,
    (el) => {
      const tiles = all(el, ".m551-tile");
      const grid = el.querySelector(".m551-grid");
      const ov = el.querySelector(".m551-ov");
      const slides = all(el, ".m551-slide");
      const next = el.querySelector(".m551-next")!;
      const close = el.querySelector(".m551-close")!;
      const sofa = el.querySelector('[data-k="2"]')!;
      const t = centre(sofa, el);
      const nx = centre(next, el);
      const cl = centre(close, el);
      const IN = { x: "0%", z: 0, rotationY: 0, opacity: 1 };
      const tl = gsap.timeline({ repeat: -1, paused: true });
      tl.set(dot.current, { x: t.x + 220, y: t.y + 140, opacity: 1 })
        .to(dot.current, { x: t.x, y: t.y, duration: 0.5, ease: "power2.inOut" })
        .call(() => press(dot.current, sofa))
        .to(grid, { opacity: 0.12, scale: 0.95, duration: 0.5, ease: "power2.inOut" })
        .fromTo(ov, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: "power2.out" }, "<")
        .fromTo(slides[0], { x: "38%", z: -520, rotationY: -40, opacity: 0 }, { ...IN, duration: 0.75, ease: "power3.out" }, "<0.1")
        .to(dot.current, { x: nx.x, y: nx.y, duration: 0.45, ease: "power2.inOut" }, "<0.2");
      [0, 1].forEach((k) => {
        tl.call(() => press(dot.current, next))
          .to(slides[k], { x: "-58%", z: -520, rotationY: 42, opacity: 0, duration: 0.75, ease: "power3.inOut" })
          .fromTo(slides[k + 1], { x: "58%", z: -520, rotationY: -42, opacity: 0 }, { ...IN, duration: 0.75, ease: "power3.inOut" }, "<")
          .to(dot.current, { x: k === 0 ? nx.x - 14 : cl.x, y: k === 0 ? nx.y + 10 : cl.y, duration: 0.35, ease: "sine.inOut" }, "<0.45");
        if (k === 0) tl.to(dot.current, { x: nx.x, y: nx.y, duration: 0.2, ease: "sine.inOut" });
      });
      tl.call(() => press(dot.current, close))
        .to(slides[2], { z: -360, opacity: 0, duration: 0.5, ease: "power2.in" })
        .to(ov, { autoAlpha: 0, duration: 0.4, ease: "power2.in" }, "<0.15")
        .to(grid, { opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" }, "<0.1")
        .fromTo(tiles, { y: 30 }, { y: 0, duration: 0.55, stagger: 0.04, ease: "power3.out" }, "<")
        .to(dot.current, { x: t.x + 220, y: t.y + 140, duration: 0.45, ease: "power2.inOut" }, "<");
      return tl;
    },
    { interactive: true },
  );
  return (
    <Stage r={root} g1="rgba(79,141,255,.55)" g2="rgba(224,145,63,.22)">
      <div className="m551-grid absolute inset-[5%] flex gap-[1.6%]">
        {[0, 1, 2].map((col) => (
          <div key={col} className="flex flex-1 flex-col gap-[3%]">
            {M551_TILES.filter((_, i) => i % 3 === col).map((tile) => {
              const idx = M551_TILES.indexOf(tile);
              return (
                <div key={idx} data-k={idx} className="m551-tile relative overflow-hidden rounded-[16px]" style={{ height: tile.h }}>
                  <Img src={scene(tile.i, 700, 600)} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                  <p className="absolute bottom-[8%] left-[6%] text-[14px] font-[600]" style={{ fontFamily: F.mr }}>
                    {tile.n}
                  </p>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="m551-ov absolute inset-0 z-20" style={{ opacity: 0, visibility: "hidden", perspective: "1400px" }}>
        <div className="absolute inset-0 bg-[#05080f]/70" />
        {M551_SLIDES.map((s, i) => (
          <div key={i} className="m551-slide absolute bottom-[12%] left-[22%] right-[22%] top-[10%] overflow-hidden rounded-[22px] shadow-[0_40px_80px_rgba(0,0,0,.55)]" style={{ opacity: 0 }}>
            <Img src={scene(s.i, 1200, 800)} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-[7%] left-[6%]">
              <p className="text-[clamp(30px,3vw,48px)] leading-[1]" style={{ fontFamily: F.is }}>
                {s.n}
              </p>
              <p className="mt-1 text-[15px] text-white/80">{s.p}</p>
            </div>
          </div>
        ))}
        <div className="m551-next absolute right-[8%] top-1/2 -mt-7 grid h-14 w-14 place-items-center rounded-full border border-white/40 text-[20px]">→</div>
        <div className="m551-close absolute right-[6%] top-[7%] grid h-12 w-12 place-items-center rounded-full bg-white/10 text-[18px]">✕</div>
        <p className="absolute left-[6%] top-[8%] text-[13px] uppercase tracking-[0.24em] text-white/70">Oakline Studio · living room</p>
      </div>
      <Sheen g1="rgba(120,170,255,.5)" />
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M552 · Scattered previews gather into grid ───────────────────────── */
const M552_ITEMS = [
  { x: "6%", y: "10%", r: "-8deg" },
  { x: "24%", y: "52%", r: "6deg" },
  { x: "40%", y: "8%", r: "-4deg" },
  { x: "56%", y: "56%", r: "9deg" },
  { x: "72%", y: "12%", r: "-10deg" },
  { x: "84%", y: "48%", r: "5deg" },
  { x: "12%", y: "62%", r: "11deg" },
  { x: "66%", y: "34%", r: "-6deg" },
];
function M552() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const toggle = () => {
    const w = wrap.current;
    if (!w || !Flip) return;
    const items = all(w, ".m552-item");
    const state = Flip.getState(items);
    const grid = w.classList.toggle("is-grid");
    if (btn.current) btn.current.textContent = grid ? "Scatter again" : "Explore all";
    Flip.from(state, { duration: 1, ease: "power3.inOut", stagger: 0.025 });
  };
  usePlay(
    root,
    (el, ctx, onClean) => {
      const b = btn.current!;
      const c = centre(b, el);
      onClean(() => wrap.current?.classList.remove("is-grid"));
      const tl = gsap.timeline({ repeat: -1, paused: true });
      tl.set(dot.current, { x: c.x + 180, y: c.y - 90, opacity: 1 })
        .to(dot.current, { x: c.x, y: c.y, duration: 0.5, ease: "power2.inOut" })
        .call(() => {
          press(dot.current, b);
          ctx.add(toggle);
        })
        .to(dot.current, { x: c.x - 160, y: c.y - 120, duration: 0.7, ease: "sine.inOut" })
        .to(dot.current, { x: c.x, y: c.y, duration: 0.55, ease: "power2.inOut" })
        .call(() => {
          press(dot.current, b);
          ctx.add(toggle);
        })
        .to(dot.current, { x: c.x + 180, y: c.y - 90, duration: 0.75, ease: "sine.inOut" })
        .to(dot.current, { x: c.x + 150, y: c.y - 60, duration: 0.3, ease: "sine.inOut" });
      return tl;
    },
    { pre: needFlip, interactive: true },
  );
  return (
    <Stage r={root} g1="rgba(255,122,89,.5)" g2="rgba(79,141,255,.24)">
      <div className="absolute inset-x-[4%] bottom-[16%] top-[5%]">
        <div ref={wrap} className="m552-wrap">
          {M552_ITEMS.map((it, i) => (
            <div key={i} className="m552-item" style={{ "--x": it.x, "--y": it.y, "--r": it.r } as CSSProperties}>
              <div className="m552-float h-full w-full overflow-hidden rounded-[12px] shadow-[0_18px_40px_rgba(0,0,0,.45)]" style={{ animationDelay: `${-i * 0.37}s` }}>
                <Img src={scene(i % 4, 400, 500)} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-[5%] left-[5%] right-[5%] flex items-end justify-between">
        <div>
          <p className="text-[13px] uppercase tracking-[0.24em] text-white/70">Paper Moon · prints</p>
          <h3 className="mt-2 text-[clamp(32px,3.2vw,52px)] font-[700] leading-[0.95] tracking-[-0.03em]" style={{ fontFamily: F.sg }}>
            48 prints · from ₹ 1,200
          </h3>
        </div>
        <button ref={btn} type="button" onClick={toggle} className="rounded-full bg-white px-7 py-4 text-[16px] font-[600] text-[#0a0d16]">
          Explore all
        </button>
      </div>
      <Sheen g1="rgba(255,160,130,.5)" />
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M553 · Grid tile expands in place ───────────────────────── */
const M553_TILES = [
  { i: 0, n: "Ocean Suite", d: "Sea-facing, 62 m²", p: "₹ 18,500 / night" },
  { i: 3, n: "Garden Villa", d: "Private lawn, plunge pool", p: "₹ 26,000 / night" },
  { i: 2, n: "Forest Cabin", d: "Cedar walls, open deck", p: "₹ 12,900 / night" },
  { i: 1, n: "Sunset Loft", d: "Rooftop, west light", p: "₹ 15,400 / night" },
];
function M553() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(-1);
  const set = (k: number) => {
    const g = gridRef.current;
    if (!g || !Flip) return;
    const tiles = all(g, ".m553-tile");
    const prev = openRef.current;
    const target = prev === k ? -1 : k;
    const moving = [prev, target].filter((x) => x >= 0).map((x) => tiles[x]);
    const state = Flip.getState(moving);
    tiles.forEach((t, i) => t.classList.toggle("is-open", i === target));
    openRef.current = target;
    Flip.from(state, { duration: 0.7, ease: "power3.inOut", zIndex: 5 });
    tiles.forEach((t, i) => gsap.to(t, { opacity: target < 0 || i === target ? 1 : 0, duration: 0.45, ease: "power2.out", overwrite: "auto" }));
    tiles.forEach((t, i) => {
      const copy = t.querySelector(".m553-copy");
      if (i === target) gsap.fromTo(copy, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, delay: 0.3, ease: "power3.out", overwrite: true });
      else gsap.to(copy, { y: 20, opacity: 0, duration: 0.25, ease: "power2.in", overwrite: true });
    });
  };
  usePlay(
    root,
    (el, ctx, onClean) => {
      const tiles = all(el, ".m553-tile");
      const pts = tiles.map((t) => centre(t, el));
      onClean(() => {
        tiles.forEach((t) => t.classList.remove("is-open"));
        openRef.current = -1;
      });
      const tl = gsap.timeline({ repeat: -1, paused: true });
      tl.set(dot.current, { x: pts[0].x + 60, y: pts[0].y + 60, opacity: 1 });
      [0, 3, 1, 2].forEach((k, n, arr) => {
        const p = pts[k];
        const q = pts[arr[(n + 1) % arr.length]];
        tl.to(dot.current, { x: p.x, y: p.y, duration: 0.4, ease: "power2.inOut" })
          .call(() => {
            press(dot.current);
            ctx.add(() => set(k));
          })
          .to(dot.current, { x: p.x + (p.x < el.clientWidth / 2 ? 90 : -90), y: p.y + 40, duration: 0.7, ease: "sine.inOut" })
          .to(dot.current, { x: p.x + 20, y: p.y + 10, duration: 0.35, ease: "sine.inOut" })
          .call(() => {
            press(dot.current);
            ctx.add(() => set(k));
          })
          .to(dot.current, { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 + 30, duration: 0.45, ease: "sine.inOut" });
      });
      return tl;
    },
    { pre: needFlip, interactive: true },
  );
  return (
    <Stage r={root} g1="rgba(24,196,143,.5)" g2="rgba(255,179,107,.22)">
      <div className="absolute left-[5%] top-[7%]">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/70">Saltmarsh Resort · stays</p>
      </div>
      <div ref={gridRef} className="absolute bottom-[6%] left-[5%] right-[5%] top-[15%] grid grid-cols-2 grid-rows-2 gap-[14px]">
        {M553_TILES.map((t, i) => (
          <div
            key={i}
            onClick={() => set(i)}
            className="m553-tile relative cursor-pointer overflow-hidden rounded-[18px]"
            style={{ gridRow: `${Math.floor(i / 2) + 1}`, gridColumn: `${(i % 2) + 1}` }}
          >
            <Img src={scene(t.i, 1200, 700)} className="absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <p className="absolute left-[4%] top-[8%] text-[clamp(20px,1.8vw,28px)] font-[600] tracking-[-0.02em]" style={{ fontFamily: F.sg }}>
              {t.n}
            </p>
            <div className="m553-copy absolute bottom-[8%] left-[4%]" style={{ opacity: 0 }}>
              <p className="text-[clamp(34px,3.6vw,58px)] leading-[1]" style={{ fontFamily: F.is }}>
                {t.d}
              </p>
              <p className="mt-2 text-[16px] text-white/85">{t.p}</p>
            </div>
          </div>
        ))}
      </div>
      <Sheen g1="rgba(110,230,180,.5)" />
      <Dot r={dot} />
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M542", name: "Full-screen scale-in slider", how: "Full-bleed photos change on a timer (or arrows): the next slides/fades in while scaling 1.1→1, the headline stays fixed on top.", kind: "play", C: M542 },
  { code: "M543", name: "Clip-path wipe carousel", how: "On a timer the incoming photo wipes over the outgoing one with a clip-path (0.8 s power3.inOut), cycling left, right, up and down.", kind: "play", C: M543 },
  { code: "M544", name: "Filmstrip unfurl", how: "Cards share a top edge; the focused card unfurls to full height (clip-path) while the others stay half-height. Auto-advances.", kind: "play", C: M544 },
  { code: "M545", name: "Wheel picker with background crossfade", how: "Drag (or a fake flick) spins a curved wheel of fading labels with inertia; the background photo crossfades to the item at the marker.", kind: "play", C: M545 },
  { code: "M546", name: "Liquid-glass lens carousel", how: "An endless photo strip slides under a WebGL glass lens that refracts it with a chromatic rim; a click zooms the lens in and out.", kind: "play", C: M546 },
  { code: "M547", name: "Flip reorder carousel", how: "Each step moves the first card to the end of the row in the DOM and Flip slides every card to its new slot; the new first card grows.", kind: "play", C: M547 },
  { code: "M548", name: "Infinite drag wall", how: "A wall of photos drags in any direction with inertia and wraps seamlessly (modulo positions); fake drag strokes play by themselves.", kind: "play", C: M548 },
  { code: "M549", name: "3D tilted marquee wall", how: "A grid of photos on a tilted 3D plane; its columns scroll up and down in alternating directions, forever (CSS).", kind: "play", C: M549 },
  { code: "M550", name: "Velocity-skew photo grid", how: "Scroll moves a photo grid; every photo skews with the scroll speed (damped) and eases back to flat when scrolling stops.", kind: "scrub", C: M550 },
  { code: "M551", name: "Masonry to 3D slideshow", how: "Clicking a masonry tile opens a full-screen slideshow whose slides arrive from the sides in 3D (translateZ + rotateY); close returns to the grid.", kind: "play", C: M551 },
  { code: "M552", name: "Scattered previews gather into grid", how: "Small scattered, tilted previews fly into an ordered grid with Flip when 'Explore all' is pressed, then scatter back.", kind: "play", C: M552 },
  { code: "M553", name: "Grid tile expands in place", how: "Clicking a tile in a 2×2 grid grows it (Flip) to fill the whole grid while the others fade and its text rises; clicking again collapses it.", kind: "play", C: M553 },
];
