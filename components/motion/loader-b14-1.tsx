"use client";

// Loader motions, batch 14 · group 1 (MOTION-MENU I31–I37). Small focused demos for /lab/motion.
// Every loader is contained inside its demo frame (never fixed to the viewport) and loops its whole sequence:
// cover in → loading move → hold (≤ 0.3 s) → reveal the little page underneath → short hold → restart.
// It plays only while on screen, a CSS-only glow loop never stops (a second one sits ON TOP of the cover), and
// ?static=1 / reduced motion shows the revealed page (every loader cover starts hidden in the markup).
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, loadPlugin, prefersReducedMotion } from "@/lib/gsap";
import { scene } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = { sg: "Space Grotesk Variable", fr: "Fraunces Variable", is: "Instrument Serif", sy: "Syne Variable", mr: "Manrope Variable" };

const CSS = `
.b14g1-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(122,162,255,.5)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,140,105,.22)),transparent 70%);animation:b14g1-drift 5.4s linear infinite alternate;will-change:transform}
@keyframes b14g1-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b14g1-hide{visibility:hidden}
.b14g1-face{backface-visibility:hidden;-webkit-backface-visibility:hidden}
html.is-static .b14g1-glow{animation:none}
html.is-static {.b14g1-glow{animation:none}}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop + a second glow ON TOP (the loader covers hide the first). */
function Stage({ r, children, g1, g2, top = 0.5 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; g1?: string; g2?: string; top?: number }) {
  return (
    <div ref={r} className="relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0c14] text-[#eef1fb]">
      <style href="b14g1-css" precedence="default">
        {CSS}
      </style>
      <div className="b14g1-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
      <div className="b14g1-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: top, zIndex: 60 } as CSSProperties} aria-hidden />
    </div>
  );
}

/**
 * "play" helper: waits for fonts (+ an optional plugin), builds the looping timeline in a gsap.context, plays it only
 * while on screen, reverts on unmount (plus any extra cleanup registered with `dispose`). Nothing runs with
 * prefersReducedMotion().
 */
function usePlay(ref: RefObject<HTMLElement | null>, build: (root: HTMLElement, dispose: (fn: () => void) => void) => gsap.core.Animation | void, pre?: () => Promise<unknown>) {
  const b = useRef(build);
  b.current = build;
  const p = useRef(pre);
  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    let dead = false;
    let on = false;
    let anim: gsap.core.Animation | void;
    const extra: (() => void)[] = [];
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
        anim = b.current(root, (fn) => extra.push(fn));
      });
      sync();
    });
    return () => {
      dead = true;
      io.disconnect();
      extra.forEach((fn) => fn());
      ctx.revert();
    };
  }, [ref]);
}

const all = (root: Element, sel: string) => [...root.querySelectorAll<HTMLElement>(sel)];
const one = (root: Element, sel: string) => root.querySelector<HTMLElement>(sel)!;
const hold = (tl: gsap.core.Timeline, d = 0.2) => tl.to({}, { duration: d });

/** Adds a 0→100 counter to the timeline, written into every `els` (onTick gets the raw value). */
function count(tl: gsap.core.Timeline, els: Element[], duration: number, at?: gsap.Position, ease = "power1.inOut", onTick?: (v: number) => void) {
  const o = { v: 0 };
  tl.fromTo(
    o,
    { v: 0 },
    {
      v: 100,
      duration,
      ease,
      onUpdate: () => {
        const s = String(Math.round(o.v)).padStart(3, "0");
        els.forEach((e) => (e.textContent = s));
        onTick?.(o.v);
      },
    },
    at,
  );
}

/** Canvas sized to its box at dpr 1, drawn by gsap.ticker only while the stage is on screen. */
function canvasLoop(root: HTMLElement, cv: HTMLCanvasElement, draw: (x: CanvasRenderingContext2D, w: number, h: number, t: number) => void, dispose: (fn: () => void) => void) {
  const x = cv.getContext("2d")!;
  let w = 1;
  let h = 1;
  const size = () => {
    const r = cv.getBoundingClientRect();
    w = cv.width = Math.max(1, Math.round(r.width));
    h = cv.height = Math.max(1, Math.round(r.height));
  };
  size();
  const ro = new ResizeObserver(size);
  ro.observe(cv);
  let on = true;
  const io = new IntersectionObserver(([e]) => (on = e.isIntersecting), { rootMargin: "80px" });
  io.observe(root);
  const tick = (time: number) => {
    if (on) draw(x, w, h, time);
  };
  gsap.ticker.add(tick);
  dispose(() => {
    gsap.ticker.remove(tick);
    ro.disconnect();
    io.disconnect();
  });
}

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, className = "", label = "", w = 900, h = 760 }: { i: number; className?: string; label?: string; w?: number; h?: number }) => (
  <img src={scene(i, w, h, label)} alt="" className={`block h-full w-full object-cover ${className}`} draggable={false} />
);

type PageP = { brand: string; links: string[]; kicker: string; title: [string, string]; price: string; i: number; acc: string; font: string; weight?: number };

/** The little page every loader reveals: nav, kicker, two-line title, CTA + price, one image card. */
function Page({ p, c }: { p: PageP; c: string }) {
  return (
    <div className={`${c} absolute inset-0 px-[4%] py-[3.5%]`}>
      <div className="flex items-center justify-between text-[13px] text-white/75">
        <span className="text-[16px] font-[700] tracking-[-0.01em] text-white" style={{ fontFamily: F.sg }}>
          {p.brand}
        </span>
        <span className="flex gap-6">
          {p.links.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </span>
      </div>
      <div className="mt-[4%] grid h-[78%] grid-cols-[1.1fr_1fr] gap-[5%]">
        <div className="flex flex-col justify-center">
          <p className="text-[13px] font-[600] uppercase tracking-[0.22em]" style={{ fontFamily: F.mr, color: p.acc }}>
            {p.kicker}
          </p>
          <h3 className="mt-4 text-[clamp(40px,4.6vw,74px)] leading-[0.98] tracking-[-0.02em]" style={{ fontFamily: p.font, fontWeight: p.weight ?? 500 }}>
            {p.title[0]}
            <br />
            {p.title[1]}
          </h3>
          <div className="mt-7 flex items-center gap-5">
            <span className="rounded-full px-6 py-3 text-[14px] font-[600] text-[#0b0d14]" style={{ background: p.acc, fontFamily: F.mr }}>
              Shop the drop
            </span>
            <span className="text-[15px] text-white/70" style={{ fontFamily: F.sg }}>
              {p.price}
            </span>
          </div>
        </div>
        <div className="overflow-hidden rounded-[18px] border border-white/10">
          <Img i={p.i} />
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── I31 · Coin-spin mark ───────────────────────── */
const I31_P: PageP = { brand: "Mint & Marrow", links: ["Coffee", "Kitchen", "Visit"], kicker: "Single origin · 250 g", title: ["Roasted on", "a Tuesday"], price: "from ₹ 690", i: 3, acc: "#ffd59a", font: F.fr };
function I31() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const cover = one(el, ".i31-cover");
    const coin = one(el, ".i31-coin");
    const shadow = one(el, ".i31-shadow");
    const page = one(el, ".i31-page");
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(cover, { autoAlpha: 0, yPercent: 0 });
    tl.set(coin, { rotationY: 0, scale: 0.6, opacity: 0 });
    tl.to(cover, { autoAlpha: 1, duration: 0.3, ease: "power1.out" });
    tl.to(coin, { scale: 1, opacity: 1, duration: 0.4, ease: "power2.out" }, "<0.1");
    count(tl, all(el, ".i31-n"), 2.2, ">-0.1");
    // two flips of 540°: lands on the back face, then on the front again
    tl.to(coin, { rotationY: 540, duration: 1.1, ease: "power2.inOut" }, "<");
    tl.to(shadow, { scaleX: 0.35, duration: 0.55, ease: "sine.inOut", yoyo: true, repeat: 3 }, "<");
    tl.to(coin, { rotationY: 1080, duration: 1.1, ease: "power2.inOut" }, ">");
    hold(tl, 0.12);
    tl.to(cover, { yPercent: -100, duration: 0.7, ease: "power2.inOut" });
    tl.fromTo(page, { y: 50, opacity: 0.4 }, { y: 0, opacity: 1, duration: 0.7, ease: "power2.out" }, "<0.15");
    hold(tl, 0.25);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,213,154,.5)" g2="rgba(255,140,105,.2)">
      <Page p={I31_P} c="i31-page" />
      <div className="i31-cover b14g1-hide absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0e0c0a]">
        <div style={{ perspective: 900 }}>
          <div className="i31-coin relative h-[190px] w-[190px]" style={{ transformStyle: "preserve-3d" }}>
            <div
              className="b14g1-face absolute inset-0 flex items-center justify-center rounded-full border-[6px] border-[#ffe3b8]"
              style={{ background: "radial-gradient(circle at 35% 30%, #ffe9c6, #e0a75a 55%, #8a5a22)", boxShadow: "inset 0 0 0 10px rgba(0,0,0,.12)" }}
            >
              <span className="text-[88px] leading-none text-[#2a1806]" style={{ fontFamily: F.fr, fontWeight: 600 }}>
                M
              </span>
            </div>
            <div
              className="b14g1-face absolute inset-0 flex flex-col items-center justify-center rounded-full border-[6px] border-[#ffe3b8]"
              style={{ transform: "rotateY(180deg)", background: "radial-gradient(circle at 60% 30%, #ffe9c6, #d19048 55%, #7a4c1b)" }}
            >
              <span className="text-[13px] font-[700] uppercase tracking-[0.3em] text-[#2a1806]" style={{ fontFamily: F.mr }}>
                Est.
              </span>
              <span className="text-[54px] leading-none text-[#2a1806]" style={{ fontFamily: F.fr, fontWeight: 600 }}>
                2019
              </span>
            </div>
          </div>
        </div>
        <div className="i31-shadow mt-8 h-[14px] w-[150px] rounded-[50%] bg-black/60" />
        <p className="mt-8 text-[13px] uppercase tracking-[0.3em] text-white/55" style={{ fontFamily: F.mr }}>
          Grinding fresh · <span className="i31-n tabular-nums text-white">100</span>
        </p>
      </div>
    </Stage>
  );
}

/* ───────────────────────── I32 · Progress ring on the cursor ───────────────────────── */
const I32_P: PageP = { brand: "Studio Lumen", links: ["Work", "Index", "Contact"], kicker: "Motion & stills · 2026", title: ["Pictures that", "keep moving"], price: "Reel · 01:24", i: 0, acc: "#9fd8ff", font: F.sg, weight: 600 };
const I32_R = 38;
const I32_C = 2 * Math.PI * I32_R;
function I32() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const cover = one(el, ".i32-cover");
    const cur = one(el, ".i32-cur");
    const arc = one(el, ".i32-arc");
    const ring = one(el, ".i32-ring");
    const flicks = all(el, ".i32-flick");
    const page = one(el, ".i32-page");
    const label = one(el, ".i32-lab");
    const r = el.getBoundingClientRect();
    const W = r.width;
    const H = r.height;
    // a lazy figure-eight around the centre (cursor drift while loading)
    const path = [
      { x: W * 0.5, y: H * 0.5 },
      { x: W * 0.58, y: H * 0.42 },
      { x: W * 0.62, y: H * 0.56 },
      { x: W * 0.44, y: H * 0.44 },
      { x: W * 0.38, y: H * 0.58 },
      { x: W * 0.5, y: H * 0.5 },
    ];
    const offs = [
      { x: 64, y: -96, r: -6 },
      { x: -170, y: -40, r: 5 },
      { x: 70, y: 40, r: 4 },
      { x: -150, y: 60, r: -4 },
      { x: 90, y: -30, r: 7 },
    ];
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(page, { clipPath: `circle(0px at ${W / 2}px ${H / 2}px)` });
    tl.set(cover, { autoAlpha: 1 });
    tl.set(cur, { x: path[0].x, y: path[0].y, scale: 0.4, autoAlpha: 0 });
    tl.set(arc, { strokeDashoffset: I32_C });
    tl.set(ring, { scale: 1, opacity: 1 });
    tl.set(flicks, { autoAlpha: 0 });
    tl.set(label, { opacity: 1 });
    tl.to(cur, { scale: 1, autoAlpha: 1, duration: 0.3, ease: "power2.out" });
    const t0 = tl.duration();
    const D = 2.2;
    tl.to(arc, { strokeDashoffset: 0, duration: D, ease: "power1.inOut" }, t0);
    count(tl, all(el, ".i32-n"), D, t0);
    path.slice(1).forEach((p, k) => tl.to(cur, { x: p.x, y: p.y, duration: D / 5, ease: "sine.inOut" }, t0 + (k * D) / 5));
    // small pictures flick on near the cursor, one after another
    for (let k = 0; k < 10; k++) {
      const f = flicks[k % flicks.length];
      const o = offs[k % offs.length];
      const at = t0 + k * 0.21;
      tl.set(f, { autoAlpha: 1, x: o.x, y: o.y, rotation: o.r, scale: 0.9 }, at);
      tl.to(f, { scale: 1, duration: 0.2, ease: "power1.out" }, at);
      tl.set(f, { autoAlpha: 0 }, at + 0.2);
    }
    // 100: the ring blows open and the page grows out of the cursor
    tl.to(label, { opacity: 0, duration: 0.15 });
    tl.to(ring, { scale: 3.2, opacity: 0, duration: 0.6, ease: "power2.out" }, "<");
    tl.to(page, { clipPath: `circle(${Math.hypot(W, H)}px at ${W / 2}px ${H / 2}px)`, duration: 0.85, ease: "power2.inOut" }, "<");
    tl.set(cover, { autoAlpha: 0 });
    tl.to(cur, { scale: 0.35, duration: 0.3, ease: "power2.out" }, "<-0.3");
    tl.to(cur, { x: W * 0.3, y: H * 0.72, duration: 0.6, ease: "sine.inOut" });
    tl.to(cur, { autoAlpha: 0, duration: 0.2 });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(159,216,255,.52)" g2="rgba(160,130,255,.22)">
      <div className="i32-cover b14g1-hide absolute inset-0 z-10 bg-[#080b12]">
        <p className="absolute bottom-[6%] left-[4%] text-[13px] uppercase tracking-[0.26em] text-white/55" style={{ fontFamily: F.mr }}>
          Loading the reel
        </p>
        <p className="absolute bottom-[6%] right-[4%] text-[13px] uppercase tracking-[0.26em] text-white/55" style={{ fontFamily: F.mr }}>
          Studio Lumen
        </p>
      </div>
      <div className="relative z-20 h-full w-full">
        <Page p={I32_P} c="i32-page" />
      </div>
      <div className="i32-cur b14g1-hide pointer-events-none absolute left-0 top-0 z-30" aria-hidden>
        {[0, 1, 2, 3, 0].map((s, i) => (
          <div key={i} className="i32-flick absolute left-0 top-0 h-[96px] w-[76px] overflow-hidden rounded-[8px] border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,.5)]" style={{ opacity: 0 }}>
            <Img i={s} w={240} h={300} />
          </div>
        ))}
        <svg className="i32-ring absolute" width={I32_R * 2 + 8} height={I32_R * 2 + 8} style={{ left: -(I32_R + 4), top: -(I32_R + 4), overflow: "visible" }}>
          <circle cx={I32_R + 4} cy={I32_R + 4} r={I32_R} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth={2} />
          <circle
            className="i32-arc"
            cx={I32_R + 4}
            cy={I32_R + 4}
            r={I32_R}
            fill="none"
            stroke="#9fd8ff"
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={I32_C}
            strokeDashoffset={0}
            transform={`rotate(-90 ${I32_R + 4} ${I32_R + 4})`}
          />
        </svg>
        <div className="absolute h-[10px] w-[10px] rounded-full bg-white" style={{ left: -5, top: -5 }} />
        <p className="i32-lab absolute whitespace-nowrap text-[14px] font-[600] tabular-nums text-white" style={{ left: I32_R + 16, top: -10, fontFamily: F.sg }}>
          <span className="i32-n">100</span> %
        </p>
      </div>
    </Stage>
  );
}

/* ───────────────────────── I33 · Dot ring wave ───────────────────────── */
const I33_P: PageP = { brand: "Halo Rooms", links: ["Stay", "Spa", "Journal"], kicker: "Hill retreat · 12 suites", title: ["Quiet is the", "whole point"], price: "from ₹ 18,500 / night", i: 1, acc: "#c8ff8a", font: F.is, weight: 400 };
function I33() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, dispose) => {
    const cover = one(el, ".i33-cover");
    const cv = el.querySelector<HTMLCanvasElement>(".i33-cv")!;
    const mark = one(el, ".i33-mark");
    const page = one(el, ".i33-page");
    const s = { a: 0, amp: 0, phase: 0, rot: 0, spread: 0 };
    const N = 240;
    canvasLoop(
      el,
      cv,
      (x, w, h) => {
        x.clearRect(0, 0, w, h);
        if (s.a <= 0.001) return;
        const R = Math.min(w, h) * 0.27;
        const cx = w / 2;
        const cy = h / 2;
        const ph = ((s.phase % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        for (let i = 0; i < N; i++) {
          const th = (i / N) * Math.PI * 2;
          let d = Math.abs(th - ph);
          d = Math.min(d, Math.PI * 2 - d);
          const bump = Math.exp(-(d * d) / (2 * 0.22 * 0.22));
          const rr = R * (1 + s.amp * bump * 0.24 + s.spread * (0.6 + 0.5 * ((i * 37) % 11) / 11));
          const a = th + s.rot;
          const px = cx + Math.cos(a) * rr;
          const py = cy + Math.sin(a) * rr;
          const sz = 1.4 + bump * s.amp * 1.8;
          x.globalAlpha = s.a * (0.38 + 0.62 * bump * s.amp + 0.25 * (1 - s.amp));
          x.fillStyle = bump > 0.4 ? "#e6ffc4" : "#c8ff8a";
          x.beginPath();
          x.arc(px, py, sz, 0, Math.PI * 2);
          x.fill();
        }
        x.globalAlpha = 1;
      },
      dispose,
    );
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(cover, { autoAlpha: 1 });
    tl.set(s, { a: 0, amp: 0, phase: -0.6, rot: 0, spread: 0 });
    tl.set(mark, { opacity: 0, scale: 0.9 });
    tl.to(s, { a: 1, duration: 0.4, ease: "power1.out" });
    tl.to(mark, { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" }, "<");
    tl.to(s, { amp: 1, duration: 0.5, ease: "sine.inOut" }, "<0.1");
    const t0 = tl.duration() - 0.4;
    tl.to(s, { phase: Math.PI * 4 - 0.6, duration: 2.3, ease: "none" }, t0);
    tl.to(s, { rot: 0.9, duration: 2.9, ease: "none" }, t0);
    count(tl, all(el, ".i33-n"), 2.3, t0);
    tl.to(s, { amp: 0, spread: 1, a: 0, duration: 0.6, ease: "power2.in" }, t0 + 2.3);
    tl.to(mark, { opacity: 0, scale: 1.08, duration: 0.4, ease: "power1.in" }, "<");
    tl.to(cover, { autoAlpha: 0, duration: 0.5, ease: "power1.inOut" }, "<0.25");
    tl.fromTo(page, { scale: 1.04 }, { scale: 1, duration: 0.7, ease: "power2.out" }, "<");
    hold(tl, 0.2);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(200,255,138,.5)" g2="rgba(120,200,255,.2)">
      <Page p={I33_P} c="i33-page" />
      <div className="i33-cover b14g1-hide absolute inset-0 z-10 bg-[#070c09]">
        <canvas className="i33-cv absolute inset-0 h-full w-full" aria-hidden />
        <div className="i33-mark absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[clamp(30px,3vw,46px)] leading-none" style={{ fontFamily: F.is }}>
            Halo Rooms
          </p>
          <p className="mt-3 text-[13px] uppercase tracking-[0.3em] text-white/55" style={{ fontFamily: F.mr }}>
            <span className="i33-n tabular-nums">100</span> · breathing in
          </p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── I34 · Drop-and-splash logo intro ───────────────────────── */
const I34_P: PageP = { brand: "plume.", links: ["Inks", "Paper", "Workshop"], kicker: "Fountain ink · 50 ml", title: ["Write it", "in deep blue"], price: "₹ 1,250", i: 0, acc: "#8fb8ff", font: F.fr };
const I34_LINE = "M-7,-150 L7,-150 L7,0 L-7,0 Z";
const I34_CROWN = "M-64,0 C-52,-10 -46,-42 -40,-58 C-35,-30 -26,-22 -19,-50 C-13,-24 -6,-20 0,-66 C6,-20 13,-24 19,-50 C26,-22 35,-30 40,-58 C46,-42 52,-10 64,0 Z";
const I34_PUDDLE = "M-76,0 C-52,-16 52,-16 76,0 C52,7 -52,7 -76,0 Z";
const I34_DROP = "M-12,-12 C-12,-19 -5,-24 0,-24 C5,-24 12,-19 12,-12 C12,-5 6,0 0,0 C-6,0 -12,-5 -12,-12 Z";
const I34_DOT = "M-12,0 a12,12 0 1,0 24,0 a12,12 0 1,0 -24,0 Z";
const I34_WORD = "plume";
function I34() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(
    root,
    (el) => {
      const cover = one(el, ".i34-cover");
      const svg = el.querySelector<SVGSVGElement>(".i34-svg")!;
      const g = one(el, ".i34-g");
      const shape = one(el, ".i34-shape");
      const dot = one(el, ".i34-dot");
      const ghosts = all(el, ".i34-ghost");
      const chars = all(el, ".i34-ch");
      const stop = one(el, ".i34-stop");
      const word = one(el, ".i34-word");
      const page = one(el, ".i34-page");
      const box = svg.getBoundingClientRect();
      svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
      const wr = word.getBoundingClientRect();
      const sr = stop.getBoundingClientRect();
      const base = sr.bottom - box.top - sr.height * 0.22; // the type's baseline
      const cx = wr.left - box.left + wr.width * 0.42;
      const dr = Math.max(6, sr.width * 0.36); // the full stop's radius
      const tx = sr.left - box.left + sr.width / 2;
      const ty = base - dr;
      const ds = dr / 12;

      const tl = gsap.timeline({ repeat: -1 });
      tl.set(cover, { autoAlpha: 1, yPercent: 0 });
      tl.set(shape, { attr: { d: I34_LINE }, scaleX: 1, scaleY: 1, transformOrigin: "50% 100%", opacity: 1 });
      tl.set(g, { x: cx, y: base - box.height });
      tl.set([dot, ...ghosts], { x: cx, y: base - dr, scale: ds, transformOrigin: "50% 50%", opacity: 0 });
      tl.set(chars, { scaleY: 0, scaleX: 1.3, transformOrigin: "50% 100%" });
      // 1 · the line drops
      tl.to(g, { y: base, duration: 0.42, ease: "power2.in" });
      // 2 · impact: squash, elastic recover, morphing through the splash
      tl.to(shape, { scaleY: 0.32, scaleX: 1.9, duration: 0.09, ease: "power1.out" });
      tl.to(shape, { scaleY: 1, scaleX: 1, duration: 0.7, ease: "elastic.out(1,0.35)" });
      tl.to(shape, { morphSVG: I34_CROWN, duration: 0.22, ease: "power2.out" }, "<");
      tl.to(shape, { morphSVG: I34_PUDDLE, duration: 0.2, ease: "power1.inOut" }, ">");
      tl.to(shape, { morphSVG: I34_DROP, duration: 0.18, ease: "power1.inOut" }, ">");
      // 3 · letters pop up from the baseline with a springy stretch
      tl.to(chars, { scaleY: 1, scaleX: 1, duration: 0.75, ease: "elastic.out(1,0.45)", stagger: 0.06 }, "<-0.15");
      // 4 · the drop leaps to the full stop; onion-skin ghosts trail behind it
      const tLeap = tl.duration() - 0.35;
      tl.set(shape, { opacity: 0 }, tLeap);
      [dot, ...ghosts].forEach((d, k) => {
        const at = tLeap + k * 0.05;
        tl.set(d, { opacity: k === 0 ? 1 : [0.42, 0.26, 0.14, 0.07][k - 1] }, at);
        tl.to(d, { x: tx, duration: 0.6, ease: "none" }, at);
        tl.to(d, { y: base - dr - Math.min(170, box.height * 0.3), duration: 0.3, ease: "power2.out" }, at);
        tl.to(d, { y: ty, duration: 0.3, ease: "power2.in" }, at + 0.3);
        if (k > 0) tl.set(d, { opacity: 0 }, at + 0.62);
      });
      tl.to(dot, { scaleY: ds * 0.6, scaleX: ds * 1.3, y: ty + dr * 0.4, duration: 0.08, ease: "power1.out" });
      tl.to(dot, { scaleY: ds, scaleX: ds, y: ty, duration: 0.35, ease: "back.out(2.5)" });
      hold(tl, 0.15);
      tl.to(cover, { yPercent: 100, duration: 0.7, ease: "power2.inOut" });
      tl.fromTo(page, { y: -40 }, { y: 0, duration: 0.7, ease: "power2.out" }, "<0.1");
      hold(tl, 0.25);
      return tl;
    },
    () => loadPlugin("MorphSVGPlugin"),
  );
  return (
    <Stage r={root} g1="rgba(143,184,255,.52)" g2="rgba(255,150,200,.2)">
      <Page p={I34_P} c="i34-page" />
      <div className="i34-cover b14g1-hide absolute inset-0 z-10 bg-[#0a0d18]">
        <div className="absolute inset-0 flex items-center justify-center">
          <h3 className="i34-word flex items-end text-[clamp(90px,10vw,150px)] leading-none tracking-[-0.03em] text-[#eaf0ff]" style={{ fontFamily: F.fr, fontWeight: 600 }}>
            {I34_WORD.split("").map((c, i) => (
              <span key={i} className="i34-ch inline-block">
                {c}
              </span>
            ))}
            <span className="i34-stop inline-block opacity-0">.</span>
          </h3>
        </div>
        <svg className="i34-svg absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          <g className="i34-g">
            <path className="i34-shape" d={I34_LINE} fill="#8fb8ff" />
          </g>
          {[0, 1, 2, 3].map((k) => (
            <path key={k} className="i34-ghost" d={I34_DOT} fill="#8fb8ff" opacity={0} />
          ))}
          <path className="i34-dot" d={I34_DOT} fill="#8fb8ff" opacity={0} />
        </svg>
        <p className="absolute bottom-[6%] left-1/2 w-[300px] -ml-[150px] text-center text-[13px] uppercase tracking-[0.3em] text-white/50" style={{ fontFamily: F.mr }}>
          Filling the pen
        </p>
      </div>
    </Stage>
  );
}

/* ───────────────────────── I35 · Block wordmark sting ───────────────────────── */
const I35_P: PageP = { brand: "NORTE", links: ["Furniture", "Lighting", "Stores"], kicker: "Modular shelving · oak", title: ["Built from", "simple blocks"], price: "from ₹ 14,900", i: 2, acc: "#ffb36b", font: F.sy, weight: 700 };
const I35_COLS = ["#ff6b4a", "#ffb36b", "#ffe08a", "#7fd3ff", "#b49cff"];
function I35() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const cover = one(el, ".i35-cover");
    const sq = one(el, ".i35-sq");
    const blocks = all(el, ".i35-b");
    const letters = all(el, ".i35-l");
    const page = one(el, ".i35-page");
    const cr = cover.getBoundingClientRect();
    const mx = cr.left + cr.width / 2;
    const my = cr.top + cr.height / 2;
    const d = blocks.map((b) => {
      const r = b.getBoundingClientRect();
      return { x: mx - (r.left + r.width / 2), y: my - (r.top + r.height / 2) };
    });
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(cover, { autoAlpha: 1, clipPath: "inset(0% 0% 0% 0%)" });
    tl.set(sq, { scale: 0, rotation: -20, autoAlpha: 1 });
    tl.set(blocks, { x: (i) => d[i].x, y: (i) => d[i].y, rotation: 0, autoAlpha: 0, transformOrigin: "50% 130%" });
    tl.set(letters, { yPercent: 115 });
    // a square scales in…
    tl.to(sq, { scale: 1, rotation: 0, duration: 0.45, ease: "back.out(1.6)" });
    tl.set(blocks, { autoAlpha: 1 });
    // …the coloured deck fans out from behind it and winds back
    tl.to(blocks, { rotation: (i) => (i - 2) * 17, duration: 0.45, ease: "power2.out", stagger: 0.03 }, "<0.05");
    tl.to(sq, { scale: 0.85, autoAlpha: 0, duration: 0.3, ease: "power1.in" }, "<0.25");
    tl.to(blocks, { rotation: 0, duration: 0.4, ease: "power2.inOut", stagger: { each: 0.03, from: "end" } });
    // the stack splits into blocks that build the wordmark
    tl.to(blocks, { x: 0, y: 0, duration: 0.7, ease: "power2.inOut", stagger: { each: 0.05, from: "center" } });
    tl.to(letters, { yPercent: 0, duration: 0.45, ease: "power2.out", stagger: 0.05 }, "<0.35");
    hold(tl, 0.2);
    tl.to(cover, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.7, ease: "power2.inOut" });
    tl.fromTo(page, { y: 40 }, { y: 0, duration: 0.7, ease: "power2.out" }, "<0.1");
    hold(tl, 0.25);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,179,107,.5)" g2="rgba(127,211,255,.22)">
      <Page p={I35_P} c="i35-page" />
      <div className="i35-cover b14g1-hide absolute inset-0 z-10 flex items-center justify-center bg-[#0d0b10]">
        <div className="flex gap-[14px]">
          {"NORTE".split("").map((c, i) => (
            <div key={i} className="i35-b relative flex h-[128px] w-[128px] items-center justify-center overflow-hidden rounded-[14px]" style={{ background: I35_COLS[i], zIndex: 5 - Math.abs(i - 2) }}>
              <span className="i35-l inline-block text-[84px] leading-none text-[#120d0a]" style={{ fontFamily: F.sy, fontWeight: 800 }}>
                {c}
              </span>
            </div>
          ))}
        </div>
        <div className="i35-sq absolute h-[128px] w-[128px] rounded-[14px] bg-[#f4efe6]" style={{ left: "calc(50% - 64px)", top: "calc(50% - 64px)", zIndex: 10, opacity: 0 }} />
      </div>
    </Stage>
  );
}

/* ───────────────────────── I36 · Filament burst then breathe ───────────────────────── */
const I36_P: PageP = { brand: "Aster Lab", links: ["Serums", "Science", "Stockists"], kicker: "Night repair · 30 ml", title: ["Skin that", "glows back"], price: "₹ 2,890", i: 1, acc: "#ffc4e1", font: F.fr };
function I36() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, dispose) => {
    const cover = one(el, ".i36-cover");
    const cv = el.querySelector<HTMLCanvasElement>(".i36-cv")!;
    const logo = one(el, ".i36-logo");
    const page = one(el, ".i36-page");
    const s = { burst: 0, breathe: 0, exit: 0, a: 0 };
    const N = 170;
    const fil = Array.from({ length: N }, (_, i) => {
      const r = (k: number) => {
        const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
        return v - Math.floor(v);
      };
      return { ang: (i / N) * Math.PI * 2 + r(1) * 0.05, len: 0.45 + r(2) * 0.55, curve: (r(3) - 0.5) * 0.9, ph: r(4) * 6.28, del: r(5), w: 0.5 + r(6) * 0.8, al: 0.25 + r(7) * 0.55 };
    });
    canvasLoop(
      el,
      cv,
      (x, w, h, t) => {
        x.clearRect(0, 0, w, h);
        if (s.a <= 0.001) return;
        const cx = w / 2;
        const cy = h / 2;
        const R = Math.min(w, h) * 0.42;
        const r0 = 74;
        const rot = t * 0.05;
        x.lineCap = "round";
        for (const f of fil) {
          const b = Math.max(0, Math.min(1, (s.burst - f.del * 0.3) / 0.7));
          const breath = 1 + s.breathe * 0.13 * Math.sin(t * 1.25 + f.ph);
          const L = f.len * (R - r0) * b * breath * (1 + s.exit * 1.4);
          if (L < 1) continue;
          const a = f.ang + rot;
          const ca = Math.cos(a);
          const sa = Math.sin(a);
          const x0 = cx + ca * r0;
          const y0 = cy + sa * r0;
          const x1 = cx + ca * (r0 + L);
          const y1 = cy + sa * (r0 + L);
          const bend = f.curve * L * 0.35 * (0.6 + 0.4 * Math.sin(t * 0.7 + f.ph));
          const mxp = (x0 + x1) / 2 - sa * bend;
          const myp = (y0 + y1) / 2 + ca * bend;
          x.globalAlpha = s.a * f.al * (1 - s.exit);
          x.strokeStyle = f.del > 0.7 ? "#ffe6f2" : "#ffc4e1";
          x.lineWidth = f.w;
          x.beginPath();
          x.moveTo(x0, y0);
          x.quadraticCurveTo(mxp, myp, x1, y1);
          x.stroke();
        }
        x.globalAlpha = 1;
      },
      dispose,
    );
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(cover, { autoAlpha: 1 });
    tl.set(s, { burst: 0, breathe: 0, exit: 0, a: 1 });
    tl.set(logo, { scale: 0.7, opacity: 0 });
    // burst from the centre…
    tl.to(s, { burst: 1, duration: 0.95, ease: "expo.out" });
    tl.to(logo, { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.8)" }, "<0.08");
    // …then breathe around the logo while loading
    tl.to(s, { breathe: 1, duration: 0.5, ease: "sine.inOut" }, "<0.4");
    count(tl, all(el, ".i36-n"), 2.2, "<-0.3");
    tl.to(s, { exit: 1, duration: 0.6, ease: "power2.in" });
    tl.to(logo, { scale: 1.15, opacity: 0, duration: 0.45, ease: "power1.in" }, "<0.1");
    tl.to(cover, { autoAlpha: 0, duration: 0.5, ease: "power1.inOut" }, "<0.15");
    tl.fromTo(page, { scale: 0.97 }, { scale: 1, duration: 0.7, ease: "power2.out" }, "<");
    hold(tl, 0.2);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,196,225,.5)" g2="rgba(160,140,255,.22)">
      <Page p={I36_P} c="i36-page" />
      <div className="i36-cover b14g1-hide absolute inset-0 z-10 bg-[#0d0a10]">
        <canvas className="i36-cv absolute inset-0 h-full w-full" aria-hidden />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="i36-logo flex h-[124px] w-[124px] flex-col items-center justify-center rounded-full border border-[#ffc4e1]/50 bg-[#1a1320]">
            <span className="text-[40px] leading-none" style={{ fontFamily: F.fr, fontWeight: 500 }}>
              A✶
            </span>
            <span className="i36-n mt-2 text-[13px] tabular-nums tracking-[0.2em] text-white/60" style={{ fontFamily: F.mr }}>
              100
            </span>
          </div>
        </div>
        <p className="absolute bottom-[6%] left-[4%] text-[13px] uppercase tracking-[0.26em] text-white/50" style={{ fontFamily: F.mr }}>
          Aster Lab · night formula
        </p>
      </div>
    </Stage>
  );
}

/* ───────────────────────── I37 · Orbiting tiles forge the mark ───────────────────────── */
const I37_P: PageP = { brand: "Onyx Forge", links: ["Watches", "Straps", "Atelier"], kicker: "Automatic · 41 mm", title: ["Black steel,", "slow time"], price: "₹ 42,000", i: 0, acc: "#ffd59a", font: F.sg, weight: 600 };
const I37_GLYPHS = ["◆", "✦", "▲", "●", "■", "✕", "◐", "✳"];
function I37() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const cover = one(el, ".i37-cover");
    const tiles = all(el, ".i37-t");
    const mark = one(el, ".i37-mark");
    const chars = all(el, ".i37-ch");
    const page = one(el, ".i37-page");
    const cr = cover.getBoundingClientRect();
    const R = Math.min(cr.width * 0.3, 340);
    const st = { ang: 0, rad: R, lit: -1 };
    const place = () => {
      tiles.forEach((t, i) => {
        const a = st.ang + (i / tiles.length) * Math.PI * 2;
        const depth = Math.sin(a);
        gsap.set(t, { x: Math.cos(a) * st.rad, y: depth * st.rad * 0.36, scale: (0.82 + 0.22 * (depth + 1) * 0.5) * (0.4 + 0.6 * (st.rad / R)), zIndex: Math.round(depth * 10) + 20 });
      });
    };
    const light = (v: number) => {
      const n = Math.floor(v / (100 / tiles.length)) - 1;
      if (n === st.lit) return;
      st.lit = n;
      tiles.forEach((t, i) => {
        t.style.background = i <= n ? "#ffd59a" : "#15161c";
        t.style.color = i <= n ? "#17110a" : "rgba(255,255,255,.45)";
        t.style.boxShadow = i <= n ? "0 0 26px rgba(255,213,154,.55)" : "none";
      });
    };
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(cover, { autoAlpha: 1, yPercent: 0 });
    tl.set(st, { ang: 0, rad: R });
    tl.call(() => light(0));
    tl.set(tiles, { opacity: 1 });
    tl.set(mark, { scale: 0, rotation: -45, autoAlpha: 0 });
    tl.set(chars, { yPercent: 110 });
    tl.call(place);
    // tiles orbit and light up as the percentage climbs
    tl.to(st, { ang: Math.PI * 2.4, duration: 2.3, ease: "none", onUpdate: place });
    count(tl, all(el, ".i37-n"), 2.1, "<", "power1.in", light);
    // they fly together and forge one mark above the wordmark
    tl.to(st, { rad: 0, ang: "+=1.1", duration: 0.55, ease: "power2.in", onUpdate: place });
    tl.to(tiles, { opacity: 0, duration: 0.15 }, ">-0.1");
    tl.to(mark, { scale: 1, rotation: 0, autoAlpha: 1, duration: 0.5, ease: "back.out(1.7)" }, "<");
    tl.to(chars, { yPercent: 0, duration: 0.45, ease: "power2.out", stagger: 0.04 }, "<0.1");
    hold(tl, 0.18);
    tl.to(cover, { yPercent: -100, duration: 0.65, ease: "power2.inOut" });
    tl.fromTo(page, { y: 50 }, { y: 0, duration: 0.65, ease: "power2.out" }, "<0.1");
    hold(tl, 0.22);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,213,154,.5)" g2="rgba(120,140,255,.2)">
      <Page p={I37_P} c="i37-page" />
      <div className="i37-cover b14g1-hide absolute inset-0 z-10 bg-[#08090c]">
        {I37_GLYPHS.map((g, i) => (
          <div
            key={i}
            className="i37-t absolute flex h-[64px] w-[64px] items-center justify-center rounded-[12px] border border-white/15 bg-[#15161c] text-[28px] text-white/45"
            style={{ left: "calc(50% - 32px)", top: "calc(42% - 32px)" }}
          >
            {g}
          </div>
        ))}
        <div className="i37-mark absolute flex h-[96px] w-[96px] items-center justify-center rounded-[22px] bg-[#ffd59a] text-[46px] text-[#17110a] shadow-[0_0_50px_rgba(255,213,154,.6)]" style={{ left: "calc(50% - 48px)", top: "calc(42% - 48px)", opacity: 0 }}>
          ◆
        </div>
        <div className="absolute inset-x-0 top-[60%] flex flex-col items-center">
          <div className="flex overflow-hidden text-[clamp(34px,3.4vw,54px)] font-[700] uppercase leading-[1.05] tracking-[0.12em]" style={{ fontFamily: F.sg }}>
            {"Onyx Forge".split("").map((c, i) => (
              <span key={i} className="i37-ch inline-block whitespace-pre">
                {c}
              </span>
            ))}
          </div>
          <p className="mt-3 text-[13px] uppercase tracking-[0.3em] text-white/50" style={{ fontFamily: F.mr }}>
            Forging · <span className="i37-n tabular-nums text-white">100</span>
          </p>
        </div>
      </div>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "I31", name: "Coin-spin mark", how: "Loop: a round logo coin spins 540° around Y with an ease-in-out (lands on its back face), spins again to the front while the count climbs, then the cover lifts off the page.", kind: "play", C: I31 },
  { code: "I32", name: "Progress ring on the cursor", how: "Loop: the custom cursor itself carries the loading ring (filling clockwise with the %), small pictures flick on beside it as it drifts, then the ring blows open and the page grows out of the cursor.", kind: "play", C: I32 },
  { code: "I33", name: "Dot ring wave", how: "Loop: 240 tiny dots on a slowly rotating circle; a bulge wave runs around the ring pushing dots outward in turn while the count climbs, then the dots drift out and the page shows.", kind: "play", C: I33 },
  { code: "I34", name: "Drop-and-splash logo intro", how: "Loop: a line drops, squashes on impact (elastic), morphs through crown and puddle splashes, the letters pop up from the baseline with a springy stretch and the drop leaps into the full stop with onion-skin ghosts.", kind: "play", C: I34 },
  { code: "I35", name: "Block wordmark sting", how: "Loop: a square scales in, a coloured deck fans out from behind it and winds back, then the stack splits into blocks that slide into place and spell the wordmark.", kind: "play", C: I35 },
  { code: "I36", name: "Filament burst then breathe", how: "Loop: hair-line filaments burst out of the logo (canvas), then breathe slowly around it while loading, and shoot outward as the page opens.", kind: "play", C: I36 },
  { code: "I37", name: "Orbiting tiles forge the mark", how: "Loop: eight glyph tiles orbit on a tilted ring and light up one by one as the % climbs, then fly together and forge one glowing mark above the wordmark.", kind: "play", C: I37 },
];
