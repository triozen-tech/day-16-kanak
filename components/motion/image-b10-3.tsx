"use client";

// Image motions, batch 10 · group 3 (MOTION-MENU M494–M505). Small focused demos for /lab/motion.
// Every "play" demo plays by itself while on screen (a scripted pointer ring stands in for hover; the real mouse takes
// over when it moves), loops, pauses off screen, and has a CSS-only glow loop that never stops (a second one on top
// when photos cover the stage). The two "scrub" demos follow the panel's scroll linearly. WebGL demos only build their
// textures / context once the stage is within ~1 screen of the viewport. ?static=1 / reduced motion: no JS motion,
// the markup shows a sensible final state.
import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import type { OGLRenderingContext } from "ogl";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { createShader, type GLHandle } from "@/lib/gl";
import { scene, toCanvas, useScrub, useTicker } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = {
  sg: "Space Grotesk Variable",
  fr: "Fraunces Variable",
  is: "Instrument Serif",
  sy: "Syne Variable",
  mr: "Manrope Variable",
};

/** 4×4 Bayer threshold tile (values 0..15/32 of white), 4 px per cell: added to a half-bright photo, then thresholded. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const BAYER_TILE = (() => {
  const cell = 4;
  const rects = BAYER.map((v, k) => {
    const g = Math.round((v / 32) * 255);
    return `<rect x="${(k % 4) * cell}" y="${Math.floor(k / 4) * cell}" width="${cell}" height="${cell}" fill="rgb(${g},${g},${g})"/>`;
  }).join("");
  return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" shape-rendering="crispEdges">${rects}</svg>`)}")`;
})();

const CSS = `
.b10g3-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.42)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.2)),transparent 70%);animation:b10g3-drift 5.6s linear infinite alternate;will-change:transform}
@keyframes b10g3-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b10g3-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4);pointer-events:none;z-index:40;opacity:0;transition:opacity .25s}
.m495-track{display:flex;width:max-content;animation:m495-run 5s linear infinite}
@keyframes m495-run{to{transform:translate3d(-50%,0,0)}}
.m502-hint{animation:m502-nudge 1.4s ease-in-out infinite alternate}
@keyframes m502-nudge{0%{transform:translateX(-4px)}100%{transform:translateX(4px)}}
.m504-dither{filter:contrast(40);isolation:isolate}
.m504-dither img{filter:brightness(.5)}
.m504-bayer{position:absolute;inset:0;mix-blend-mode:plus-lighter;background-image:${BAYER_TILE};background-size:16px 16px;image-rendering:pixelated}
html.is-static .b10g3-glow,html.is-static .m495-track,html.is-static .m502-hint{animation:none}
html.is-static {
  .b10g3-glow,.m495-track,.m502-hint{animation:none}
}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0d16] text-[#eef2ff] ${className}`}>
      <style href="b10g3-css" precedence="default">
        {CSS}
      </style>
      <div className="b10g3-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/** The CSS glow loop again, ON TOP of a full-bleed photo/canvas (screen blend), so big image demos never freeze. */
const Sheen = ({ g1 }: { g1?: string }) => (
  <div className="b10g3-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.45, zIndex: 35 } as CSSProperties} aria-hidden />
);

/** The visible fake pointer (a ring) that drives hover demos while nobody touches the mouse. */
const Dot = ({ r }: { r: RefObject<HTMLDivElement | null> }) => <div ref={r} className="b10g3-dot" aria-hidden />;

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ src, className = "", style }: { src: string; className?: string; style?: CSSProperties }) => <img src={src} alt="" className={`h-full w-full object-cover ${className}`} style={style} draggable={false} />;

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

type Pt = { x: number; y: number; inside: boolean };
type PtFrame = Pt & { vx: number; vy: number; real: boolean };

/**
 * Pointer driver for hover demos: every frame (while on screen) gives a pointer position in root px. The real mouse
 * wins for 2.5 s after it last moved; otherwise `script(t, root)` drives a visible fake ring along a set path.
 */
function usePointer(root: RefObject<HTMLDivElement | null>, dot: RefObject<HTMLDivElement | null>, script: (t: number, el: HTMLDivElement) => Pt, frame: (p: PtFrame, dt: number, el: HTMLDivElement) => void) {
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

/* ───────────────────────── M494 · Hover rapid image loop behind menu ───────────────────────── */
const M494_ITEMS = ["Breakfast Room", "Rooftop Pool", "The Cellar", "Garden Suites", "Night Market"];
const M494_TAGS = ["BREAKFAST", "ROOFTOP", "CELLAR", "GARDEN", "NIGHT"];
const M494_SRC = M494_ITEMS.map((_, i) => [0, 1, 2, 3].map((k) => scene((i + k) % 4, 1600, 1000, `${M494_TAGS[i]} · 0${k + 1}`)));
function M494() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const bg = useRef<HTMLDivElement>(null);
  const st = useRef({ active: -1, acc: 0, k: 0, ready: false });
  useEffect(() => {
    const b = bg.current;
    if (!b || prefersReducedMotion()) return;
    gsap.set(b, { opacity: 0 });
    st.current.ready = true;
    return () => {
      gsap.killTweensOf(b);
      gsap.set(b, { clearProps: "opacity" });
      st.current = { active: -1, acc: 0, k: 0, ready: false };
    };
  }, []);
  const cut = (el: HTMLDivElement, idx: number) => {
    const s = st.current;
    s.k = (s.k + 1) % 4;
    const frames = el.querySelectorAll<HTMLElement>(".m494-f");
    frames.forEach((f, j) => {
      const on = j === idx * 4 + s.k;
      f.style.visibility = on ? "visible" : "hidden";
      if (on) {
        const sc = 1.04 + Math.random() * 0.16;
        f.style.transform = `translate3d(${(Math.random() * 6 - 3).toFixed(2)}%,${(Math.random() * 6 - 3).toFixed(2)}%,0) scale(${sc.toFixed(3)})`;
      }
    });
  };
  usePointer(
    root,
    dot,
    (t, el) => {
      const items = [...el.querySelectorAll(".m494-item")];
      const pts: [number, number][] = items.map((r) => {
        const b = rel(r, el);
        return [b.l + b.w * 0.5, b.t + b.h / 2];
      });
      const lb = rel(items[items.length - 1], el);
      pts.push([lb.l + lb.w * 1.35, lb.t + lb.h * 1.5]); // step off the menu: the loop stops and fades
      const [x, y] = stepPath(t, pts, 0.85, 0.42);
      return { x: x + Math.sin(t * 2.4) * 36, y, inside: true };
    },
    (p, dt, el) => {
      const s = st.current;
      const b = bg.current;
      if (!s.ready || !b) return;
      const items = [...el.querySelectorAll(".m494-item")];
      const idx = p.inside ? hit(items, el, p.x, p.y) : -1;
      if (idx !== s.active) {
        const prev = s.active;
        s.active = idx;
        items.forEach((it, i) => gsap.to(it, { opacity: idx === -1 || i === idx ? 1 : 0.3, duration: 0.25, overwrite: "auto" }));
        if (idx === -1) gsap.to(b, { opacity: 0, duration: 0.3, overwrite: "auto" });
        else {
          if (prev === -1) gsap.to(b, { opacity: 1, duration: 0.12, overwrite: "auto" });
          s.acc = 0;
          cut(el, idx);
        }
      }
      if (s.active < 0) return;
      s.acc += dt;
      if (s.acc >= 0.1) {
        s.acc %= 0.1;
        cut(el, s.active); // rapid cuts every ~0.1 s while hovered
      }
    },
  );
  return (
    <Stage r={root} g1="rgba(255,122,89,.42)" g2="rgba(79,141,255,.22)">
      <div ref={bg} className="absolute inset-0 overflow-hidden">
        {M494_SRC.flatMap((set, i) =>
          set.map((src, k) => (
            <div key={`${i}-${k}`} className="m494-f absolute inset-0 will-change-transform" style={{ visibility: i === 0 && k === 0 ? "visible" : "hidden" }}>
              <Img src={src} />
            </div>
          )),
        )}
        <div className="absolute inset-0 bg-black/45" />
      </div>
      <div className="absolute inset-0 z-[30] flex flex-col justify-center pl-[8%]">
        <p className="mb-5 text-[13px] uppercase tracking-[0.24em] text-white/70">Hotel Solenne · Explore</p>
        {M494_ITEMS.map((n) => (
          <p key={n} className="m494-item w-fit cursor-default text-[clamp(40px,5.2vw,82px)] font-[700] uppercase leading-[1.02] tracking-[-0.03em] text-white drop-shadow-[0_4px_24px_rgba(0,0,0,.5)]" style={{ fontFamily: F.sy }}>
            {n}
          </p>
        ))}
        <p className="mt-6 text-[15px] text-white/75">Rooms from ₹ 16,800 a night</p>
      </div>
      <Sheen g1="rgba(255,150,110,.5)" />
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M495 · Marquee band across image ───────────────────────── */
const M495_CARDS = [
  { n: "Terra Lounge Chair", p: "₹ 38,500", c: "#e0913f" },
  { n: "Dune Side Table", p: "₹ 14,200", c: "#ff4d6d" },
  { n: "Monolith Lamp", p: "₹ 9,800", c: "#18c48f" },
];
function M495() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const st = useRef({ active: -2, ready: false });
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const bands = el.querySelectorAll<HTMLElement>(".m495-band");
    gsap.set(bands, { clipPath: "inset(0% 100% 0% 0%)" });
    st.current.ready = true;
    return () => {
      gsap.killTweensOf(bands);
      gsap.set(bands, { clearProps: "clipPath" });
      st.current = { active: -2, ready: false };
    };
  }, []);
  usePointer(
    root,
    dot,
    (t, el) => {
      const cards = [...el.querySelectorAll(".m495-img")];
      const pts: [number, number][] = cards.map((c) => {
        const b = rel(c, el);
        return [b.l + b.w / 2, b.t + b.h * 0.45];
      });
      const lb = rel(cards[cards.length - 1], el);
      pts.push([lb.l + lb.w * 0.5, lb.t + lb.h * 1.12]); // below the cards: the band slides out
      const [x, y] = stepPath(t, pts, 0.9, 0.42);
      return { x: x + Math.sin(t * 2.1) * 30, y: y + Math.cos(t * 2.7) * 18, inside: true };
    },
    (p, _dt, el) => {
      const s = st.current;
      if (!s.ready) return;
      const cards = [...el.querySelectorAll(".m495-img")];
      const idx = p.inside ? hit(cards, el, p.x, p.y) : -1;
      if (idx === s.active) return;
      const prev = s.active;
      s.active = idx;
      const bands = el.querySelectorAll<HTMLElement>(".m495-band");
      if (prev >= 0) gsap.to(bands[prev], { clipPath: "inset(0% 0% 0% 100%)", duration: 0.4, ease: "power3.inOut", overwrite: "auto" }); // slides out to the right
      if (idx >= 0) gsap.fromTo(bands[idx], { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.4, ease: "power3.out", overwrite: "auto" }); // in from the left
      cards.forEach((c, i) => gsap.to(c.querySelector(".m495-pic"), { scale: i === idx ? 1.06 : 1, duration: 0.6, ease: "power3.out", overwrite: "auto" }));
    },
  );
  return (
    <Stage r={root} g1="rgba(224,145,63,.4)" g2="rgba(255,77,109,.18)">
      <div className="absolute left-[5%] top-[8%] flex w-[90%] items-end justify-between">
        <h3 className="text-[clamp(34px,3.6vw,58px)] leading-none" style={{ fontFamily: F.fr, fontWeight: 500 }}>
          New in the showroom
        </h3>
        <p className="text-[14px] text-white/60">Atelier Ruhe · Furniture</p>
      </div>
      <div className="absolute bottom-[9%] left-[5%] top-[23%] grid w-[90%] grid-cols-3 gap-[2.4%]">
        {M495_CARDS.map((c, i) => (
          <div key={c.n} className="flex h-full flex-col">
            <div className="m495-img relative flex-1 overflow-hidden rounded-[14px]">
              <div className="m495-pic absolute inset-0 will-change-transform">
                <Img src={scene(i + 1, 700, 760)} />
              </div>
              <div className="m495-band absolute left-0 right-0 top-1/2 -mt-[34px] flex h-[68px] items-center overflow-hidden" style={{ background: c.c, color: "#0a0d16", clipPath: i === 0 ? "inset(0% 0% 0% 0%)" : "inset(0% 100% 0% 0%)" }}>
                <div className="m495-track">
                  {[0, 1].map((k) => (
                    <span key={k} className="flex shrink-0 items-center whitespace-nowrap text-[30px] font-[700] uppercase tracking-[-0.01em]" style={{ fontFamily: F.sg }}>
                      {[0, 1, 2].map((j) => (
                        <span key={j} className="px-6">
                          {c.n} <span className="opacity-60">·</span> {c.p} <span className="opacity-60">✦</span>
                        </span>
                      ))}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between text-[15px]" style={{ fontFamily: F.sg }}>
              <span>{c.n}</span>
              <span className="tabular-nums text-white/65">{c.p}</span>
            </div>
          </div>
        ))}
      </div>
      <Sheen g1="rgba(255,190,120,.4)" />
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M496 · Gold crack lines draw over image ───────────────────────── */
const M496_MAIN = [
  "M318 262 L342 304 L328 352 L360 402 L352 452 L380 492",
  "M512 236 L498 290 L526 338 L508 396 L534 452 L520 522",
  "M690 250 L664 300 L684 348 L650 392 L668 440",
  "M248 300 L300 330 L328 352",
];
const M496_BRANCH = [
  "M342 304 L392 318 L418 362 L470 380",
  "M360 402 L416 420 L452 470",
  "M526 338 L582 350 L604 404 L652 428",
  "M508 396 L456 412 L432 450",
  "M684 348 L726 362 L748 330",
  "M650 392 L606 446 L612 486",
  "M418 362 L436 330 L480 312",
];
const M496_BOWL = "M200 236 Q206 520 500 532 Q794 520 800 236 Z";
function M496() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const main = el.querySelectorAll(".m496-main");
    const branch = el.querySelectorAll(".m496-branch");
    const glow = el.querySelector(".m496-glowg");
    const tl = gsap
      .timeline({ repeat: -1 })
      .set([main, branch], { drawSVG: "0% 0%" }, 0)
      .set(glow, { opacity: 0.5 }, 0)
      .to(main, { drawSVG: "0% 100%", duration: 0.9, stagger: 0.14, ease: "power1.inOut" }, 0)
      .to(branch, { drawSVG: "0% 100%", duration: 0.55, stagger: { each: 0.09, from: "random" }, ease: "power2.out" }, 0.55)
      .to(glow, { opacity: 1, duration: 0.5, ease: "sine.inOut" }, 0.9)
      .to(glow, { opacity: 0.7, duration: 0.25, ease: "sine.inOut" }, 1.5)
      .to([main, branch], { drawSVG: "100% 100%", duration: 0.55, stagger: 0.03, ease: "power2.in" }, 1.75);
    const svg = el.querySelector("svg")!;
    const enter = () => tl.restart(); // real hover replays the crack
    svg.addEventListener("pointerenter", enter);
    onClean(() => svg.removeEventListener("pointerenter", enter));
    return tl;
  });
  const crack = (w: number) => (
    <>
      {M496_MAIN.map((d) => (
        <path key={d} className="m496-main" d={d} strokeWidth={w} />
      ))}
      {M496_BRANCH.map((d) => (
        <path key={d} className="m496-branch" d={d} strokeWidth={w * 0.6} />
      ))}
    </>
  );
  return (
    <Stage r={root} g1="rgba(224,170,80,.42)" g2="rgba(255,236,200,.14)">
      <div className="absolute inset-0 flex items-center gap-[5%] px-[6%]">
        <div className="relative aspect-[1000/625] h-auto w-[58%] shrink-0 overflow-hidden rounded-[20px] bg-[#16110c]">
          <svg viewBox="0 0 1000 625" className="absolute inset-0 h-full w-full" aria-label="Kintsugi-style bowl">
            <defs>
              <radialGradient id="m496-bg" cx="50%" cy="40%" r="70%">
                <stop offset="0" stopColor="#3a2a1a" />
                <stop offset="1" stopColor="#100b07" />
              </radialGradient>
              <linearGradient id="m496-clay" x1="0" x2="1">
                <stop offset="0" stopColor="#6d6155" />
                <stop offset=".42" stopColor="#d9cfc2" />
                <stop offset=".6" stopColor="#efe7dc" />
                <stop offset="1" stopColor="#5b5047" />
              </linearGradient>
              <linearGradient id="m496-gold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#fff1b8" />
                <stop offset=".5" stopColor="#e2b04a" />
                <stop offset="1" stopColor="#a8741c" />
              </linearGradient>
              <clipPath id="m496-clip">
                <path d={M496_BOWL} />
              </clipPath>
              <filter id="m496-blur" x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur stdDeviation="6" />
              </filter>
            </defs>
            <rect width="1000" height="625" fill="url(#m496-bg)" />
            <ellipse cx="500" cy="560" rx="330" ry="26" fill="#000" opacity=".45" />
            <path d={M496_BOWL} fill="url(#m496-clay)" />
            <ellipse cx="500" cy="236" rx="300" ry="46" fill="#3b332c" />
            <ellipse cx="500" cy="240" rx="282" ry="36" fill="#2a241f" />
            <g clipPath="url(#m496-clip)" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <g className="m496-glowg" stroke="#ffcf6b" filter="url(#m496-blur)" opacity=".8">
                {crack(10)}
              </g>
              <g stroke="url(#m496-gold)">{crack(4)}</g>
            </g>
          </svg>
        </div>
        <div className="max-w-[34ch]">
          <p className="text-[13px] uppercase tracking-[0.22em] text-[#ffd59a]/80">Kiln &amp; Gold · Repair series</p>
          <h3 className="mt-3 text-[clamp(40px,4.2vw,68px)] leading-[0.95]" style={{ fontFamily: F.is }}>
            Mended in gold, made to last
          </h3>
          <p className="mt-4 text-[16px] leading-relaxed text-white/65">Every crack traced by hand with urushi lacquer and 24K powder. No two bowls alike.</p>
          <p className="mt-6 text-[22px] tabular-nums" style={{ fontFamily: F.sg }}>
            ₹ 7,400
          </p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M497 · Turbulence warp on hover ───────────────────────── */
const M497_THUMBS = [
  { n: "Saffron Hours", s: "Eau de parfum · ₹ 4,200" },
  { n: "Vetiver Rain", s: "Eau de parfum · ₹ 3,900" },
  { n: "Night Oud", s: "Extrait · ₹ 6,800" },
];
function M497() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const st = useRef({ active: -2, ready: false });
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const caps = el.querySelectorAll<HTMLElement>(".m497-cap");
    gsap.set(caps, { y: 0, yPercent: 105 });
    st.current.ready = true;
    return () => {
      gsap.killTweensOf(caps);
      el.querySelectorAll(".m497-disp, .m497-pic").forEach((n) => gsap.killTweensOf(n));
      gsap.set(caps, { clearProps: "transform" });
      st.current = { active: -2, ready: false };
    };
  }, []);
  usePointer(
    root,
    dot,
    (t, el) => {
      const th = [...el.querySelectorAll(".m497-t")];
      const pts: [number, number][] = th.map((c) => {
        const b = rel(c, el);
        return [b.l + b.w / 2, b.t + b.h * 0.42];
      });
      const lb = rel(th[th.length - 1], el);
      pts.push([lb.l + lb.w * 0.5, lb.t - lb.h * 0.12]); // above the row: hover ends
      const [x, y] = stepPath(t, pts, 0.95, 0.42);
      return { x: x + Math.sin(t * 2) * 26, y: y + Math.cos(t * 2.6) * 20, inside: true };
    },
    (p, _dt, el) => {
      const s = st.current;
      if (!s.ready) return;
      const th = [...el.querySelectorAll(".m497-t")];
      const idx = p.inside ? hit(th, el, p.x, p.y) : -1;
      if (idx === s.active) return;
      const prev = s.active;
      s.active = idx;
      const play = (i: number, on: boolean) => {
        const t = th[i];
        const disp = t.querySelector(".m497-disp");
        const pic = t.querySelector(".m497-pic");
        const cap = t.querySelector(".m497-cap");
        // warp bump: displacement scale 0 → peak → 0 (rule 19: the scale is tweened, never the noise frequency)
        gsap.timeline().to(disp, { attr: { scale: on ? 150 : 60 }, duration: on ? 0.35 : 0.25, ease: "power2.in", overwrite: "auto" }).to(disp, { attr: { scale: 0 }, duration: on ? 0.6 : 0.4, ease: "power2.out" });
        gsap.to(pic, { scale: on ? 1.2 : 1, svgOrigin: "200 250", duration: 0.9, ease: "power3.out", overwrite: "auto" });
        gsap.to(cap, { yPercent: on ? 0 : 105, duration: 0.5, ease: on ? "power3.out" : "power2.in", overwrite: "auto" });
      };
      if (prev >= 0) play(prev, false);
      if (idx >= 0) play(idx, true);
    },
  );
  return (
    <Stage r={root} g1="rgba(255,77,109,.36)" g2="rgba(255,179,107,.2)">
      <div className="absolute left-[5%] top-[8%] flex w-[90%] items-end justify-between">
        <h3 className="text-[clamp(34px,3.6vw,58px)] font-[700] leading-none tracking-[-0.03em]" style={{ fontFamily: F.sy }}>
          The scent library
        </h3>
        <p className="text-[14px] text-white/60">Maison Ilaya · 50 ml</p>
      </div>
      <div className="absolute bottom-[8%] left-[5%] top-[22%] grid w-[90%] grid-cols-3 gap-[3%]">
        {M497_THUMBS.map((th, i) => (
          <div key={th.n} className="m497-t relative h-full overflow-hidden rounded-[16px]">
            <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
              <defs>
                <filter id={`m497-f${i}`} x="-10%" y="-10%" width="120%" height="120%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves={1} seed={i + 2} result="n" />
                  <feDisplacementMap className="m497-disp" in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G" />
                </filter>
              </defs>
              <g filter={`url(#m497-f${i})`}>
                <image className="m497-pic" href={scene(i, 400, 500)} width="400" height="500" preserveAspectRatio="xMidYMid slice" />
              </g>
            </svg>
            <div className="absolute inset-x-0 bottom-0 overflow-hidden">
              <div className="m497-cap bg-gradient-to-t from-black/80 to-transparent px-5 pb-5 pt-10" style={{ transform: i === 0 ? "none" : "translateY(105%)" }}>
                <p className="text-[clamp(24px,2.3vw,36px)] leading-none" style={{ fontFamily: F.is }}>
                  {th.n}
                </p>
                <p className="mt-2 text-[14px] text-white/75">{th.s}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Sheen g1="rgba(255,120,140,.45)" />
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M498 · Hover wave from entry side (WebGL) ───────────────────────── */
const M498_FRAG = /* glsl */ `
uniform vec2 uDir;
uniform float uWave;
void main() {
  float s = dot(vUv - 0.5, uDir) + 0.5;            // 0 at the entry edge, 1 at the far edge
  float front = mix(-0.2, 1.2, uWave);
  float d = s - front;
  float env = exp(-d * d * 28.0) * smoothstep(0.0, 0.08, uWave) * (1.0 - smoothstep(0.45, 1.0, uWave)); // fades as it crosses
  float ripple = sin(d * 36.0);
  vec2 perp = vec2(-uDir.y, uDir.x);
  vec2 base = (vUv - 0.5) * (1.0 - 0.015 * sin(uTime * 0.7)) + 0.5;  // the picture breathes, never fully still
  vec2 off = uDir * ripple * env * 0.035 + perp * sin(dot(vUv, perp) * 12.0 + d * 20.0) * env * 0.012;
  vec3 col = texture2D(uTex0, cover(base + off, uTexRes0)).rgb;
  col += env * ripple * 0.07;
  gl_FragColor = vec4(col, 1.0);
}`;
const M498_DIR: Record<"left" | "top" | "right" | "bottom", [number, number]> = { left: [1, 0], right: [-1, 0], top: [0, -1], bottom: [0, 1] };
function M498() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const st = useRef({ w: 0, dir: [1, 0] as [number, number], inside: false });
  const near = useNear(root);
  const src = scene(0, 1600, 1000, "ARC 02 · WIRELESS");
  useEffect(() => {
    if (!near) return;
    let dead = false;
    let h: GLHandle | null = null;
    (async () => {
      const tex = await toCanvas(src, 1600, 1000);
      if (dead || !canvas.current) return;
      h = await createShader(canvas.current, M498_FRAG, {
        dpr: 1,
        textures: [tex],
        uniforms: { uDir: { value: [1, 0] }, uWave: { value: 0 } },
        onFrame: (u) => {
          u.uDir.value = st.current.dir;
          u.uWave.value = st.current.w;
        },
      });
      if (dead) h?.destroy();
    })();
    return () => {
      dead = true;
      h?.destroy();
      gsap.killTweensOf(st.current);
    };
  }, [near, src]);
  usePointer(
    root,
    dot,
    (t, el) => {
      const b = rel(box.current!, el);
      const cx = b.l + b.w / 2;
      const cy = b.t + b.h / 2;
      // in from the left, out; in from the top, out; in from the right; in from the bottom
      const pts: [number, number][] = [
        [b.l - 70, cy + 20],
        [cx - 40, cy],
        [cx - 30, b.t - 50],
        [cx + 20, cy + 30],
        [b.l + b.w + 70, cy - 30],
        [cx + 40, cy],
        [cx + 60, b.t + b.h + 45],
        [cx, cy - 20],
      ];
      const [x, y] = stepPath(t, pts, 0.75, 0.55);
      return { x, y, inside: true };
    },
    (p, _dt, el) => {
      const bx = box.current;
      if (!bx) return;
      const b = rel(bx, el);
      const lx = p.x - b.l;
      const ly = p.y - b.t;
      const inside = p.inside && lx >= 0 && ly >= 0 && lx <= b.w && ly <= b.h;
      const s = st.current;
      if (inside && !s.inside) {
        const ds = [lx, ly, b.w - lx, b.h - ly];
        const side = (["left", "top", "right", "bottom"] as const)[ds.indexOf(Math.min(...ds))];
        s.dir = M498_DIR[side];
        if (label.current) label.current.textContent = side;
        gsap.fromTo(s, { w: 0 }, { w: 1, duration: 0.85, ease: "none", overwrite: "auto" });
      }
      s.inside = inside;
    },
  );
  return (
    <Stage r={root} g1="rgba(79,141,255,.42)" g2="rgba(159,216,255,.18)">
      <div ref={box} className="absolute bottom-[16%] left-[20%] right-[20%] top-[12%] overflow-hidden rounded-[20px]">
        <Img src={src} className="absolute inset-0" />
        <canvas ref={canvas} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-300" aria-hidden />
      </div>
      <div className="pointer-events-none absolute bottom-[5%] left-[20%] right-[20%] flex items-baseline justify-between">
        <p className="text-[clamp(22px,2vw,32px)] font-[600] tracking-[-0.02em]" style={{ fontFamily: F.sg }}>
          Arc 02 headphones · ₹ 24,900
        </p>
        <p className="text-[13px] uppercase tracking-[0.2em] text-[#9fd8ff]/80">
          wave from <span ref={label}>left</span>
        </p>
      </div>
      <Sheen g1="rgba(120,170,255,.45)" />
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M499 · Pointer water wake (WebGL + height field) ───────────────────────── */
const M499_FRAG = /* glsl */ `
uniform sampler2D uH;
uniform vec2 uHRes;
float hh(vec2 uv) { return texture2D(uH, uv).r - 0.5; }
void main() {
  vec2 e = 1.0 / uHRes;
  float dx = hh(vUv + vec2(e.x, 0.0)) - hh(vUv - vec2(e.x, 0.0));
  float dy = hh(vUv + vec2(0.0, e.y)) - hh(vUv - vec2(0.0, e.y));
  vec2 off = vec2(dx, dy) * 0.32;
  vec2 base = (vUv - 0.5) * (1.0 - 0.012 * sin(uTime * 0.8)) + 0.5;
  vec3 col = texture2D(uTex0, cover(base + off, uTexRes0)).rgb;
  float spec = clamp((dx - dy) * 3.2, -0.25, 0.4);
  col += spec * vec3(0.8, 0.95, 1.0);
  gl_FragColor = vec4(col, 1.0);
}`;
const M499_GW = 160;
const M499_GH = 100;
function M499() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const ptr = useRef({ x: -1, y: -1, on: false });
  const near = useNear(root);
  const src = scene(2, 1600, 1000, "TIDE POOL · SEA SALT SOAP");
  useEffect(() => {
    if (!near) return;
    let dead = false;
    let h: GLHandle | null = null;
    (async () => {
      const tex = await toCanvas(src, 1600, 1000);
      if (dead || !canvas.current) return;
      h = await createShader(canvas.current, M499_FRAG, {
        dpr: 1,
        textures: [tex],
        uniforms: { uHRes: { value: [M499_GW, M499_GH] } },
        init: ({ ogl, gl, uniforms }) => {
          // CPU height field, two buffers ping-ponged each frame, uploaded as a small texture
          const N = M499_GW * M499_GH;
          let cur = new Float32Array(N);
          let prev = new Float32Array(N);
          const hc = document.createElement("canvas");
          hc.width = M499_GW;
          hc.height = M499_GH;
          const ctx = hc.getContext("2d")!;
          const img = ctx.createImageData(M499_GW, M499_GH);
          const T = new ogl.Texture(gl as unknown as OGLRenderingContext, { image: hc, generateMipmaps: false, minFilter: gl.LINEAR, magFilter: gl.LINEAR, wrapS: gl.CLAMP_TO_EDGE, wrapT: gl.CLAMP_TO_EDGE });
          uniforms.uH = { value: T };
          const last = { x: -1, y: -1 };
          const drop = (gx: number, gy: number, amt: number) => {
            for (let oy = -3; oy <= 3; oy++)
              for (let ox = -3; ox <= 3; ox++) {
                const x = Math.round(gx) + ox;
                const y = Math.round(gy) + oy;
                if (x < 1 || y < 1 || x >= M499_GW - 1 || y >= M499_GH - 1) continue;
                const f = Math.max(0, 1 - Math.hypot(ox, oy) / 3.5);
                cur[y * M499_GW + x] += amt * f;
              }
          };
          return () => {
            const P = ptr.current;
            if (P.on) {
              const gx = P.x * M499_GW;
              const gy = P.y * M499_GH;
              if (last.x < 0) {
                last.x = gx;
                last.y = gy;
              }
              const steps = Math.max(1, Math.ceil(Math.hypot(gx - last.x, gy - last.y) / 1.5));
              for (let i = 1; i <= steps; i++) drop(last.x + ((gx - last.x) * i) / steps, last.y + ((gy - last.y) * i) / steps, 0.55 / Math.sqrt(steps));
              last.x = gx;
              last.y = gy;
            } else last.x = -1;
            const W = M499_GW;
            for (let y = 1; y < M499_GH - 1; y++)
              for (let x = 1; x < W - 1; x++) {
                const i = y * W + x;
                prev[i] = ((cur[i - 1] + cur[i + 1] + cur[i - W] + cur[i + W]) * 0.5 - prev[i]) * 0.982;
              }
            const t = cur;
            cur = prev;
            prev = t;
            const d = img.data;
            for (let i = 0; i < N; i++) {
              const v = Math.max(0, Math.min(255, 128 + cur[i] * 70));
              d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v;
              d[i * 4 + 3] = 255;
            }
            ctx.putImageData(img, 0, 0);
            T.needsUpdate = true;
          };
        },
      });
      if (dead) h?.destroy();
    })();
    return () => {
      dead = true;
      h?.destroy();
    };
  }, [near, src]);
  usePointer(
    root,
    dot,
    (t, el) => {
      const b = rel(box.current!, el);
      // a slow figure-eight over the water: a continuous wake, no rests
      return {
        x: b.l + b.w * (0.5 + 0.36 * Math.sin(t * 1.05)),
        y: b.t + b.h * (0.5 + 0.3 * Math.sin(t * 2.1 + 0.4)),
        inside: true,
      };
    },
    (p, _dt, el) => {
      const bx = box.current;
      if (!bx) return;
      const b = rel(bx, el);
      const u = (p.x - b.l) / b.w;
      const v = (p.y - b.t) / b.h;
      ptr.current = { x: u, y: v, on: p.inside && u > 0 && u < 1 && v > 0 && v < 1 };
    },
  );
  return (
    <Stage r={root} g1="rgba(24,196,143,.42)" g2="rgba(159,216,255,.2)">
      <div ref={box} className="absolute inset-[3%] overflow-hidden rounded-[22px]">
        <Img src={src} className="absolute inset-0" />
        <canvas ref={canvas} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-300" aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="pointer-events-none absolute bottom-[8%] left-[5%]">
          <p className="text-[13px] uppercase tracking-[0.22em] text-white/75">Saltmarsh Bath Co.</p>
          <h3 className="mt-2 text-[clamp(44px,5.2vw,84px)] leading-[0.95]" style={{ fontFamily: F.fr, fontWeight: 500 }}>
            Bottled low tide
          </h3>
          <p className="mt-2 text-[16px] text-white/80">Sea salt bar soap · ₹ 650</p>
        </div>
      </div>
      <Sheen g1="rgba(120,255,210,.42)" />
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M500 · Pointer-x image scrub ───────────────────────── */
const M500_N = 24;
function bottleFrame(i: number) {
  const a = i / M500_N;
  const W = 800;
  const H = 1000;
  const period = 720;
  const off = -a * period;
  const text = "ORCHARD No.7 · COLD PRESSED · ";
  const label = [0, 1, 2].map((k) => `<text x="${(300 + off + k * period).toFixed(1)}" y="585" font-family="Arial, sans-serif" font-weight="700" font-size="38" fill="#2b1608" letter-spacing="2">${text}</text>`).join("");
  const stripes = [0, 1, 2, 3, 4, 5, 6].map((k) => `<rect x="${(280 + off + k * (period / 2)).toFixed(1)}" y="610" width="40" height="40" rx="20" fill="#c2410c"/>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><radialGradient id="g" cx="50%" cy="45%" r="65%"><stop offset="0" stop-color="#e0913f" stop-opacity=".7"/><stop offset=".5" stop-color="#e0913f" stop-opacity=".12"/><stop offset="1" stop-color="#140f07" stop-opacity="0"/></radialGradient><linearGradient id="sh" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset=".3" stop-color="#fff" stop-opacity=".05"/><stop offset=".38" stop-color="#fff" stop-opacity=".45"/><stop offset=".46" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></linearGradient><clipPath id="c"><rect x="280" y="300" width="240" height="560" rx="36"/></clipPath></defs><rect width="100%" height="100%" fill="#140f07"/><rect width="100%" height="100%" fill="url(#g)"/><ellipse cx="400" cy="880" rx="190" ry="22" fill="#000" opacity=".5"/><rect x="350" y="150" width="100" height="70" rx="10" fill="#2b1608"/><path d="M360 220H440V262Q520 280 520 340V360H280V340Q280 280 360 262Z" fill="#f2a64a"/><g clip-path="url(#c)"><rect x="280" y="250" width="240" height="620" fill="#f2a64a"/><rect x="280" y="520" width="240" height="160" fill="#fff1dc"/>${label}${stripes}<rect x="280" y="250" width="240" height="620" fill="url(#sh)"/></g></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
const M500_FRAMES = Array.from({ length: M500_N }, (_, i) => bottleFrame(i));
function M500() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const cur = useRef(0);
  usePointer(
    root,
    dot,
    (t, el) => {
      const b = rel(box.current!, el);
      const [x] = stepPath(t, [[b.l + b.w * 0.04, 0], [b.l + b.w * 0.96, 0]], 1.5, 0.84);
      return { x, y: b.t + b.h * (0.55 + 0.06 * Math.sin(t * 2.2)), inside: true };
    },
    (p, _dt, el) => {
      const bx = box.current;
      if (!bx) return;
      const b = rel(bx, el);
      const u = (p.x - b.l) / b.w;
      if (!p.inside || u < 0 || u > 1 || p.y < b.t || p.y > b.t + b.h) return; // off the picture: keep the last frame
      const f = Math.min(M500_N - 1, Math.floor(u * M500_N));
      if (bar.current) bar.current.style.transform = `scaleX(${u.toFixed(3)})`;
      if (f === cur.current) return;
      const imgs = bx.querySelectorAll<HTMLElement>(".m500-f");
      imgs[cur.current].style.visibility = "hidden";
      imgs[f].style.visibility = "visible";
      cur.current = f;
      if (num.current) num.current.textContent = `${String(f + 1).padStart(2, "0")} / ${M500_N}`;
    },
  );
  return (
    <Stage r={root} g1="rgba(224,145,63,.42)" g2="rgba(255,213,154,.16)">
      <div className="absolute inset-0 flex items-center gap-[6%] px-[8%]">
        <div className="max-w-[36ch]">
          <p className="text-[13px] uppercase tracking-[0.22em] text-[#ffd59a]/80">Orchard Press · Juice</p>
          <h3 className="mt-3 text-[clamp(40px,4.4vw,72px)] font-[700] leading-[0.95] tracking-[-0.03em]" style={{ fontFamily: F.sy }}>
            Turn it in your hand
          </h3>
          <p className="mt-4 text-[16px] leading-relaxed text-white/65">Move across the bottle to spin it. Cold-pressed apple, ginger and a squeeze of lime.</p>
          <p className="mt-6 text-[22px] tabular-nums" style={{ fontFamily: F.sg }}>
            ₹ 240 · 330 ml
          </p>
          <div className="mt-8 flex items-center gap-4 text-[13px] tabular-nums text-white/60" style={{ fontFamily: F.sg }}>
            <span ref={num}>01 / {M500_N}</span>
            <div className="h-[2px] w-[180px] bg-white/15">
              <div ref={bar} className="h-full w-full origin-left bg-[#ffd59a]" style={{ transform: "scaleX(0)" }} />
            </div>
          </div>
        </div>
        <div ref={box} className="relative aspect-[4/5] h-[86%] shrink-0 cursor-ew-resize overflow-hidden rounded-[20px]">
          {M500_FRAMES.map((src, i) => (
            <div key={i} className="m500-f absolute inset-0" style={{ visibility: i === 0 ? "visible" : "hidden" }}>
              <Img src={src} />
            </div>
          ))}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M501 · Spring compare slider (pointer) ───────────────────────── */
function Compare({ r, src, before, after, x = 50 }: { r: RefObject<HTMLDivElement | null>; src: string; before: string; after: string; x?: number }) {
  return (
    <div ref={r} className="relative h-full w-full touch-none select-none overflow-hidden rounded-[20px]">
      <Img src={src} className="absolute inset-0" style={{ filter: "grayscale(1) brightness(.7) contrast(1.15) sepia(.25)" }} />
      <div className="cmp-top absolute inset-0" style={{ clipPath: `inset(0% ${100 - x}% 0% 0%)` }}>
        <Img src={src} className="absolute inset-0" style={{ filter: "saturate(1.25)" }} />
      </div>
      <span className="absolute left-4 top-4 rounded-full bg-black/55 px-3 py-1 text-[13px] text-white/90">{after}</span>
      <span className="absolute right-4 top-4 rounded-full bg-black/55 px-3 py-1 text-[13px] text-white/90">{before}</span>
      <div className="cmp-line absolute bottom-0 top-0 w-0" style={{ left: `${x}%` }}>
        <div className="absolute bottom-0 top-0 -left-px w-[2px] bg-white shadow-[0_0_18px_rgba(255,255,255,.6)]" />
        <div className="cmp-handle absolute left-[-24px] top-1/2 -mt-6 grid h-12 w-12 place-items-center rounded-full bg-white text-[18px] text-[#0a0d16] shadow-[0_8px_24px_rgba(0,0,0,.4)]">⇆</div>
      </div>
    </div>
  );
}
const setCompare = (el: HTMLElement, x: number) => {
  const top = el.querySelector<HTMLElement>(".cmp-top");
  const line = el.querySelector<HTMLElement>(".cmp-line");
  if (top) top.style.clipPath = `inset(0% ${(100 - x).toFixed(2)}% 0% 0%)`;
  if (line) line.style.left = `${x.toFixed(2)}%`;
};
function M501() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const cmp = useRef<HTMLDivElement>(null);
  const spr = useRef({ x: 50, v: 0, target: 50 });
  usePointer(
    root,
    dot,
    (t, el) => {
      const b = rel(cmp.current!, el);
      const pts: [number, number][] = [0.22, 0.78, 0.4, 0.9, 0.12, 0.62].map((u) => [b.l + b.w * u, b.t + b.h * 0.6]);
      const [x, y] = stepPath(t, pts, 0.9, 0.5);
      return { x, y: y + Math.sin(t * 2.3) * 24, inside: true };
    },
    (p, dt, el) => {
      const c = cmp.current;
      if (!c) return;
      const b = rel(c, el);
      const S = spr.current;
      if (p.inside && p.y >= b.t && p.y <= b.t + b.h) S.target = gsap.utils.clamp(0, 100, ((p.x - b.l) / b.w) * 100);
      // soft spring: the divider lags behind the pointer and settles with a gentle overshoot
      const a = (S.target - S.x) * 90 - S.v * 12;
      S.v += a * dt;
      S.x += S.v * dt;
      setCompare(c, gsap.utils.clamp(0, 100, S.x));
    },
  );
  return (
    <Stage r={root} g1="rgba(79,141,255,.42)" g2="rgba(255,179,107,.2)">
      <div className="absolute inset-0 flex items-center gap-[5%] px-[6%]">
        <div className="relative h-[84%] w-[62%] shrink-0">
          <Compare r={cmp} src={scene(1, 1400, 1000)} before="Raw clay" after="Glazed & fired" />
        </div>
        <div className="max-w-[30ch]">
          <p className="text-[13px] uppercase tracking-[0.22em] text-[#9fd8ff]/80">Bisque Studio · Process</p>
          <h3 className="mt-3 text-[clamp(38px,4vw,64px)] leading-[0.95]" style={{ fontFamily: F.fr, fontWeight: 500 }}>
            Before the kiln, after the glaze
          </h3>
          <p className="mt-4 text-[16px] text-white/65">Hover or drag the divider. Pour-over carafe, 600 ml.</p>
          <p className="mt-6 text-[22px] tabular-nums" style={{ fontFamily: F.sg }}>
            ₹ 2,850
          </p>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M502 · Compare slider intro sweep ───────────────────────── */
function M502() {
  const root = useRef<HTMLDivElement>(null);
  const cmp = useRef<HTMLDivElement>(null);
  usePlay(root, (_el, onClean) => {
    const c = cmp.current!;
    const s = { x: 0 };
    const apply = () => setCompare(c, s.x);
    const handle = c.querySelector(".cmp-handle");
    // intro sweep 0 → 100 → 50 (~2 s), a nudge on the handle, then it eases back to 0 and replays while on screen
    const tl = gsap
      .timeline({ repeat: -1 })
      .fromTo(s, { x: 0 }, { x: 100, duration: 0.95, ease: "power2.inOut", onUpdate: apply })
      .to(s, { x: 50, duration: 0.95, ease: "back.out(1.6)", onUpdate: apply })
      .fromTo(handle, { scale: 1 }, { scale: 1.18, duration: 0.15, yoyo: true, repeat: 1, ease: "sine.inOut" })
      .to(s, { x: 0, duration: 0.45, ease: "power2.in", onUpdate: apply });
    // real pointer: drag / hover takes over, the sweep resumes 2.5 s after the last move
    let idle: ReturnType<typeof setTimeout> | undefined;
    const move = (e: PointerEvent) => {
      tl.pause();
      const r = c.getBoundingClientRect();
      s.x = gsap.utils.clamp(0, 100, ((e.clientX - r.left) / r.width) * 100);
      apply();
      clearTimeout(idle);
      idle = setTimeout(() => tl.play(), 2500);
    };
    c.addEventListener("pointermove", move);
    c.addEventListener("pointerdown", move);
    onClean(() => {
      clearTimeout(idle);
      c.removeEventListener("pointermove", move);
      c.removeEventListener("pointerdown", move);
    });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,122,89,.42)" g2="rgba(24,196,143,.18)">
      <div className="absolute inset-0 flex items-center gap-[5%] px-[6%]">
        <div className="max-w-[30ch]">
          <p className="text-[13px] uppercase tracking-[0.22em] text-[#ffb36b]/80">Loomwell · Restoration</p>
          <h3 className="mt-3 text-[clamp(38px,4vw,64px)] font-[600] leading-[0.95] tracking-[-0.02em]" style={{ fontFamily: F.sg }}>
            Forty years, one wash
          </h3>
          <p className="mt-4 text-[16px] text-white/65">Our hand-wash revives heirloom rugs without stripping the dye.</p>
          <p className="mt-6 text-[22px] tabular-nums" style={{ fontFamily: F.sg }}>
            From ₹ 3,600
          </p>
          <p className="m502-hint mt-6 text-[13px] uppercase tracking-[0.2em] text-white/55">← drag to compare →</p>
        </div>
        <div className="relative h-[84%] flex-1">
          <Compare r={cmp} src={scene(3, 1400, 1000)} before="Before" after="After" x={50} />
        </div>
      </div>
      <Sheen g1="rgba(255,150,110,.4)" />
    </Stage>
  );
}

/* ───────────────────────── M503 · Random pixel-cell image swap ───────────────────────── */
const M503_COLS = 16;
const M503_ROWS = 10;
const M503_A = scene(0, 1600, 1000, "MIDNIGHT");
const M503_B = scene(1, 1600, 1000, "SUNRISE");
function M503() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const st = useRef({ on: false, init: false });
  usePointer(
    root,
    dot,
    (t, el) => {
      const b = rel(card.current!, el);
      const pts: [number, number][] = [
        [b.l + b.w * 0.45, b.t + b.h * 0.5],
        [b.l + b.w * 1.12, b.t + b.h * 0.72],
      ];
      const [x, y] = stepPath(t, pts, 1.1, 0.55);
      return { x: x + Math.sin(t * 2.4) * 30, y: y + Math.cos(t * 1.9) * 22, inside: true };
    },
    (p, _dt, el) => {
      const c = card.current;
      if (!c) return;
      const b = rel(c, el);
      const on = p.inside && p.x >= b.l && p.x <= b.l + b.w && p.y >= b.t && p.y <= b.t + b.h;
      const s = st.current;
      if (on === s.on && s.init) return;
      s.on = on;
      s.init = true;
      const cells = c.querySelectorAll(".m503-c");
      gsap.to(cells, { rotateY: on ? 180 : 0, duration: 0.35, ease: "power2.inOut", stagger: { amount: 0.55, from: "random" }, overwrite: "auto" });
      gsap.to(c.querySelector(".m503-b"), { scale: on ? 1 : 1.08, duration: 1, ease: "power3.out", overwrite: "auto" });
    },
  );
  useEffect(() => {
    const c = card.current;
    return () => {
      if (c) gsap.killTweensOf(c.querySelectorAll(".m503-c, .m503-b"));
    };
  }, []);
  return (
    <Stage r={root} g1="rgba(79,141,255,.42)" g2="rgba(255,77,109,.22)">
      <div className="absolute inset-0 flex items-center gap-[5%] px-[6%]">
        <div ref={card} className="relative aspect-[16/10] w-[60%] shrink-0 overflow-hidden rounded-[18px]">
          <div className="m503-b absolute inset-0 will-change-transform" style={{ transform: "scale(1.08)" }}>
            <Img src={M503_B} />
          </div>
          <div className="absolute inset-0 grid" style={{ perspective: "1400px", gridTemplateColumns: `repeat(${M503_COLS},1fr)`, gridTemplateRows: `repeat(${M503_ROWS},1fr)` }}>
            {Array.from({ length: M503_COLS * M503_ROWS }, (_, k) => {
              const x = k % M503_COLS;
              const y = Math.floor(k / M503_COLS);
              return (
                <div
                  key={k}
                  className="m503-c"
                  style={{
                    backgroundImage: `url("${M503_A}")`,
                    backgroundSize: `${M503_COLS * 100}% ${M503_ROWS * 100}%`,
                    backgroundPosition: `${(x / (M503_COLS - 1)) * 100}% ${(y / (M503_ROWS - 1)) * 100}%`,
                    backfaceVisibility: "hidden",
                    marginRight: "-0.5px",
                    marginBottom: "-0.5px",
                  }}
                />
              );
            })}
          </div>
        </div>
        <div className="max-w-[30ch]">
          <p className="text-[13px] uppercase tracking-[0.22em] text-[#9fd8ff]/80">Lumen Pane · Smart glass</p>
          <h3 className="mt-3 text-[clamp(38px,4vw,64px)] leading-[0.95]" style={{ fontFamily: F.is }}>
            Night to morning, one tap
          </h3>
          <p className="mt-4 text-[16px] text-white/65">Tint-shifting window film for studios and bedrooms. Per sq ft, fitted.</p>
          <p className="mt-6 text-[22px] tabular-nums" style={{ fontFamily: F.sg }}>
            ₹ 1,180
          </p>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M504 · Dither-to-photo sweep (scrub) ───────────────────────── */
const M504_SRC = scene(3, 1600, 1000, "FIELD CAMERA · 35 MM");
function M504() {
  const root = useRef<HTMLDivElement>(null);
  const photo = useRef<HTMLDivElement>(null);
  const edge = useRef<HTMLDivElement>(null);
  const pct = useRef<HTMLSpanElement>(null);
  useScrub(root, (p) => {
    const x = p * 100; // linear over the whole panel
    if (photo.current) photo.current.style.clipPath = `inset(0% ${(100 - x).toFixed(2)}% 0% 0%)`;
    if (edge.current) {
      edge.current.style.left = `${x.toFixed(2)}%`;
      edge.current.style.opacity = p > 0.995 || p < 0.005 ? "0" : "1";
    }
    if (pct.current) pct.current.textContent = `${Math.round(x)}%`;
  });
  return (
    <Stage r={root} g1="rgba(224,145,63,.42)" g2="rgba(79,141,255,.2)">
      <div className="absolute inset-[3%] overflow-hidden rounded-[22px]">
        {/* ordered dither in pure CSS: half-bright photo + Bayer tile (plus-lighter), thresholded by contrast() */}
        <div className="m504-dither absolute inset-0">
          <Img src={M504_SRC} className="absolute inset-0" />
          <div className="m504-bayer" />
        </div>
        <div ref={photo} className="absolute inset-0" style={{ clipPath: "inset(0% 0% 0% 0%)" }}>
          <Img src={M504_SRC} className="absolute inset-0" />
        </div>
        <div ref={edge} className="pointer-events-none absolute bottom-0 top-0 w-0" style={{ left: "100%", opacity: 0 }}>
          <div className="absolute bottom-0 top-0 -left-px w-[2px] bg-[#ffd59a] shadow-[0_0_24px_6px_rgba(255,213,154,.55)]" />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        <div className="pointer-events-none absolute bottom-[8%] left-[5%]">
          <p className="text-[13px] uppercase tracking-[0.22em] text-white/75">
            Halide Works · developed <span ref={pct}>100%</span>
          </p>
          <h3 className="mt-2 text-[clamp(44px,5.4vw,88px)] font-[700] leading-[0.95] tracking-[-0.03em]" style={{ fontFamily: F.sg }}>
            From grain to colour
          </h3>
          <p className="mt-2 text-[16px] text-white/80">Field 35 rangefinder · ₹ 58,000</p>
        </div>
      </div>
      <Sheen g1="rgba(255,190,120,.42)" />
    </Stage>
  );
}

/* ───────────────────────── M505 · Halftone dots resolve to photo (scrub, WebGL) ───────────────────────── */
const M505_FRAG = /* glsl */ `
void main() {
  float p = uProgress;
  float cell = mix(34.0, 1.0, pow(p, 0.7)) * (uRes.y / 900.0);   // dot grid shrinks with the scroll
  float a = 0.785398 + 0.03 * sin(uTime * 0.5);                   // classic 45° screen, drifting slightly
  mat2 R = mat2(cos(a), -sin(a), sin(a), cos(a));
  vec2 px = vUv * uRes;
  vec2 g = R * px / cell;
  vec2 id = floor(g) + 0.5;
  mat2 Ri = mat2(cos(a), sin(a), -sin(a), cos(a));
  vec2 centre = (Ri * (id * cell)) / uRes;
  vec3 dotCol = texture2D(uTex0, cover(clamp(centre, 0.0, 1.0), uTexRes0)).rgb;
  float lum = dot(dotCol, vec3(0.299, 0.587, 0.114));
  float r = sqrt(clamp(lum, 0.0, 1.0)) * 0.72;                     // dot size follows brightness
  float d = length(g - id);
  float aa = 1.2 / cell + 0.02;
  float m = smoothstep(r + aa, r - aa, d);
  vec3 halftone = mix(vec3(0.03, 0.035, 0.06), dotCol * 1.15, m);
  vec3 photo = texture2D(uTex0, cover(vUv, uTexRes0)).rgb;
  gl_FragColor = vec4(mix(halftone, photo, smoothstep(0.72, 0.98, p)), 1.0);
}`;
function M505() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const pct = useRef<HTMLSpanElement>(null);
  const prog = useRef(0);
  const near = useNear(root);
  const src = scene(1, 1600, 1000, "NOIR · EAU DE PARFUM");
  useScrub(root, (p) => {
    prog.current = p; // linear over the whole panel
    if (pct.current) pct.current.textContent = `${Math.round(p * 100)}%`;
  });
  useEffect(() => {
    if (!near) return;
    let dead = false;
    let h: GLHandle | null = null;
    (async () => {
      const tex = await toCanvas(src, 1600, 1000);
      if (dead || !canvas.current) return;
      h = await createShader(canvas.current, M505_FRAG, {
        dpr: 1,
        textures: [tex],
        onFrame: (u) => {
          u.uProgress.value = prog.current;
        },
      });
      if (dead) h?.destroy();
    })();
    return () => {
      dead = true;
      h?.destroy();
    };
  }, [near, src]);
  return (
    <Stage r={root} g1="rgba(255,77,109,.42)" g2="rgba(255,179,107,.2)">
      <div className="absolute inset-[3%] overflow-hidden rounded-[22px]">
        <Img src={src} className="absolute inset-0" />
        <canvas ref={canvas} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-300" aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="pointer-events-none absolute bottom-[8%] left-[5%]">
          <p className="text-[13px] uppercase tracking-[0.22em] text-white/75">
            Maison Velour · resolved <span ref={pct}>100%</span>
          </p>
          <h3 className="mt-2 text-[clamp(44px,5.4vw,88px)] leading-[0.95]" style={{ fontFamily: F.is }}>
            Out of the print, into focus
          </h3>
          <p className="mt-2 text-[16px] text-white/80">Noir eau de parfum · 75 ml · ₹ 7,900</p>
        </div>
      </div>
      <Sheen g1="rgba(255,120,140,.42)" />
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M494", name: "Hover rapid image loop behind menu", how: "Hover a menu item: a fast loop of its photos cuts full-screen behind the text every ~0.1 s; leaving stops and fades it.", kind: "play", C: M494 },
  { code: "M495", name: "Marquee band across image", how: "Hover an image: a coloured band slides across it (0.4 s) carrying a looping marquee of the product name; leaving slides it out.", kind: "play", C: M495 },
  { code: "M496", name: "Gold crack lines draw over image", how: "Thin gold crack lines draw across a ceramic bowl in staggered branches (DrawSVG, ~1.5 s) with a soft glow, on enter and on hover.", kind: "play", C: M496 },
  { code: "M497", name: "Turbulence warp on hover", how: "Hover a thumbnail: an SVG turbulence displacement bumps 0→150→0 so the photo warps, while it scales to 1.2 and a caption slides in.", kind: "play", C: M497 },
  { code: "M498", name: "Hover wave from entry side", how: "Pointer enters the image: a soft WebGL wave crosses it from the side it came in, fading out as it travels (~0.8 s).", kind: "play", C: M498 },
  { code: "M499", name: "Pointer water wake", how: "The pointer stirs a water height field (two buffers ping-ponged each frame) that refracts the photo in WebGL with a decaying wake.", kind: "play", C: M499 },
  { code: "M500", name: "Pointer-x image scrub", how: "The pointer's x over the picture picks one of 24 frames, so sweeping across turns the bottle; a counter and bar follow.", kind: "play", C: M500 },
  { code: "M501", name: "Spring compare slider (pointer)", how: "A before/after divider follows the pointer (hover or drag) with a soft spring lag; the top image is clipped to it.", kind: "play", C: M501 },
  { code: "M502", name: "Compare slider intro sweep", how: "On entering view the before/after divider sweeps 0→100→50 % by itself (~2 s) and settles at the centre for dragging.", kind: "play", C: M502 },
  { code: "M503", name: "Random pixel-cell image swap", how: "Hover: a grid of square cells flips over in random order to reveal a second image beneath; leaving flips them back.", kind: "play", C: M503 },
  { code: "M504", name: "Dither-to-photo sweep", how: "Scroll: an edge sweeps across a Bayer-dithered picture (pure CSS dither) and turns everything behind it into the full-colour photo.", kind: "scrub", C: M504 },
  { code: "M505", name: "Halftone dots resolve to photo", how: "Scroll: a WebGL halftone grid (dot size = brightness) shrinks until the picture resolves from dots into the photo.", kind: "scrub", C: M505 },
];
