"use client";

// Image motions, batch 10 · group 5 (MOTION-MENU M518–M529): card reels, orbits, fans and decks. Small focused demos
// for /lab/motion. Every demo plays by itself while on screen (a visible fake pointer stands in for hover/click; the
// real mouse takes over when it moves), loops with no rest over 0.3 s, pauses off screen, and has a CSS-only glow loop
// (plus a second glow on top of the cards). ?static=1 / reduced motion: no JS motion, the markup is a sensible final state.
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
.b10g5i-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.5)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.22)),transparent 70%);animation:b10g5i-drift 5.6s linear infinite alternate;will-change:transform}
@keyframes b10g5i-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b10g5i-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4);pointer-events:none;z-index:200;opacity:0}
.b10g5i-user .b10g5i-dot{opacity:0!important}
.m524-head{background-image:linear-gradient(100deg,#ffffff 0%,#ffd6a8 22%,#a9dcff 46%,#f4e9ff 70%,#ffd6a8 100%);background-size:220% 100%;background-position:0% 50%;-webkit-background-clip:text;background-clip:text;color:transparent}
html.is-static .b10g5i-glow{animation:none}
html.is-static {.b10g5i-glow{animation:none}}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", style, g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; style?: CSSProperties; g1?: string; g2?: string }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0d16] text-[#eef2ff] ${className}`} style={style}>
      <style href="b10g5i-css" precedence="default">
        {CSS}
      </style>
      <div className="b10g5i-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/** The CSS glow loop again, ON TOP of the cards (screen blend), so card-covered stages never freeze (rule 13). */
const Sheen = ({ g1 }: { g1?: string }) => (
  <div className="b10g5i-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.45, zIndex: 150 } as CSSProperties} aria-hidden />
);

/** The visible fake pointer (a ring) that drives hover/click demos while nobody touches the mouse. */
const Dot = ({ r }: { r: RefObject<HTMLDivElement | null> }) => <div ref={r} className="b10g5i-dot" aria-hidden />;

type Built = gsap.core.Animation | gsap.core.Animation[] | void;

/**
 * "play" helper: waits for fonts (+ an optional plugin), builds looping animation(s) in a gsap.context, plays them
 * only while on screen, reverts on unmount. `interactive`: a real pointer moving over the stage pauses the scripted
 * loop (and hides the fake ring) until 2.5 s after it last moved. Nothing runs with prefersReducedMotion().
 */
function usePlay(ref: RefObject<HTMLElement | null>, build: (root: HTMLElement) => Built, { pre, interactive = false }: { pre?: () => Promise<unknown>; interactive?: boolean } = {}) {
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
      root.classList.add("b10g5i-user");
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        user = false;
        root.classList.remove("b10g5i-user");
        sync();
      }, 2500);
      sync();
    };
    root.addEventListener("pointermove", move);
    Promise.all([document.fonts?.ready, p.current?.()]).then(() => {
      if (dead) return;
      ctx.add(() => {
        const r = b.current(root);
        anims = !r ? [] : Array.isArray(r) ? r : [r];
      });
      sync();
    });
    return () => {
      dead = true;
      window.clearTimeout(timer);
      root.removeEventListener("pointermove", move);
      root.classList.remove("b10g5i-user");
      io.disconnect();
      ctx.revert();
    };
  }, [ref, interactive]);
}

type Pt = { x: number; y: number; inside: boolean };

/**
 * Pointer driver for hover demos: every frame (while on screen) gives a pointer position in root px. The real mouse
 * wins for 2.5 s after it last moved; otherwise `script(t, root)` drives the visible fake ring along a set path.
 */
function usePointer(root: RefObject<HTMLDivElement | null>, dot: RefObject<HTMLDivElement | null>, script: (t: number, el: HTMLDivElement) => Pt, frame: (p: Pt, el: HTMLDivElement) => void) {
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
    fr.current(p, el);
  });
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

/** An element's centre relative to the root. */
function centre(node: Element, root: Element) {
  const a = node.getBoundingClientRect();
  const r = root.getBoundingClientRect();
  return { x: a.left - r.left + a.width / 2, y: a.top - r.top + a.height / 2 };
}

/** Quick press feedback for the fake ring. */
const press = (dot: HTMLElement | null, btn?: Element | null) => {
  if (dot) gsap.fromTo(dot, { scale: 0.6 }, { scale: 1, duration: 0.28, ease: "power2.out", overwrite: "auto" });
  if (btn) gsap.fromTo(btn, { scale: 0.88 }, { scale: 1, duration: 0.3, ease: "power2.out", overwrite: "auto" });
};

const all = (el: Element, sel: string) => [...el.querySelectorAll<HTMLElement>(sel)];

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, className = "", style, label = "", w = 900, h = 1100 }: { i: number; className?: string; style?: CSSProperties; label?: string; w?: number; h?: number }) => (
  <img src={scene(i, w, h, label)} alt="" className={`h-full w-full object-cover ${className}`} style={style} draggable={false} />
);

/** Placeholder portrait (an SVG silhouette on a soft gradient; never a real person). */
function portrait(i: number) {
  const P = [
    ["#1b2a4a", "#6aa8ff", "#f3d2b4"],
    ["#3a1622", "#ff8a7a", "#e8b48f"],
    ["#12302a", "#5fd3a8", "#c99572"],
    ["#33240f", "#ffc163", "#9b6a4c"],
  ][i % 4];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="720" viewBox="0 0 600 720"><defs><radialGradient id="b" cx="35%" cy="25%" r="90%"><stop offset="0" stop-color="${P[1]}"/><stop offset="1" stop-color="${P[0]}"/></radialGradient><linearGradient id="s" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${P[2]}"/><stop offset="1" stop-color="${P[2]}" stop-opacity=".75"/></linearGradient></defs><rect width="600" height="720" fill="url(#b)"/><path d="M90 720q10-190 210-205q200 15 210 205z" fill="${P[0]}" opacity=".92"/><path d="M250 420h100v95q-50 30-100 0z" fill="url(#s)"/><ellipse cx="300" cy="330" rx="104" ry="126" fill="url(#s)"/><path d="M196 318q-6-120 104-126q112 4 106 126q-22-70-106-74q-82 4-104 74z" fill="${P[0]}" opacity=".85"/><circle cx="460" cy="130" r="120" fill="#fff" opacity=".08"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/* ───────────────────────── M518 · Ellipse halo reel ───────────────────────── */
const M518_ITEMS = [
  { n: "Dune Runner", p: "₹ 7,450" },
  { n: "Saltflat Trainer", p: "₹ 6,900" },
  { n: "Ember Court", p: "₹ 8,200" },
  { n: "Mistral Knit", p: "₹ 5,600" },
  { n: "Harbour Low", p: "₹ 6,300" },
  { n: "Canyon Trail", p: "₹ 9,100" },
  { n: "Lumen Slip-on", p: "₹ 4,800" },
  { n: "Orbit Mid", p: "₹ 7,900" },
  { n: "Quarry Boot", p: "₹ 10,400" },
  { n: "Pebble Racer", p: "₹ 6,700" },
];
const M518_N = M518_ITEMS.length;
/** One angle → x, y, scale, z-order and shade together (cos θ = depth: 1 front, -1 back). */
function m518At(a: number, rx: number, ry: number) {
  const c = Math.cos(a);
  const d = (c + 1) / 2;
  return { x: Math.sin(a) * rx, y: c * ry, s: 0.5 + 0.5 * d, z: Math.round(d * 100), shade: (1 - d) * 0.66 };
}
function M518() {
  const root = useRef<HTMLDivElement>(null);
  const cap = useRef<HTMLSpanElement>(null);
  const st = useRef({ th: 0, v: 0, drag: false, lx: 0, front: 0, cards: [] as HTMLElement[], shades: [] as HTMLElement[] });
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const s = st.current;
    const down = (e: PointerEvent) => {
      s.drag = true;
      s.lx = e.clientX;
    };
    const move = (e: PointerEvent) => {
      if (!s.drag) return;
      const dx = e.clientX - s.lx;
      s.lx = e.clientX;
      s.th += dx * 0.006;
      s.v = gsap.utils.clamp(-4, 4, dx * 0.15);
    };
    const up = () => (s.drag = false);
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);
  useTicker(root, (_t, dt) => {
    const el = root.current;
    if (!el) return;
    const s = st.current;
    if (!s.cards.length) {
      s.cards = all(el, ".m518-card");
      s.shades = all(el, ".m518-shade");
    }
    if (!s.drag) {
      s.th += (0.36 + s.v) * dt;
      s.v *= Math.pow(0.05, dt);
    }
    const rx = Math.min(el.clientWidth * 0.36, 520);
    const ry = el.clientHeight * 0.07;
    let best = 0;
    let bd = -2;
    s.cards.forEach((n, i) => {
      const a = s.th + (i / M518_N) * Math.PI * 2;
      const q = m518At(a, rx, ry);
      n.style.transform = `translate3d(${q.x.toFixed(1)}px,${q.y.toFixed(1)}px,0) scale(${q.s.toFixed(3)})`;
      n.style.zIndex = String(q.z);
      s.shades[i].style.opacity = q.shade.toFixed(3);
      if (Math.cos(a) > bd) {
        bd = Math.cos(a);
        best = i;
      }
    });
    if (best !== s.front && cap.current) {
      s.front = best;
      cap.current.textContent = `${M518_ITEMS[best].n} · ${M518_ITEMS[best].p}`;
    }
  });
  return (
    <Stage r={root} className="cursor-grab touch-pan-y select-none active:cursor-grabbing" g1="rgba(79,141,255,.5)" g2="rgba(255,160,90,.24)">
      <div className="absolute left-[6%] top-[8%] z-[120]">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/55">Fieldwork Footwear · AW collection</p>
        <h3 className="mt-2 text-[clamp(30px,3.2vw,50px)] leading-none" style={{ fontFamily: F.fr, fontWeight: 500 }}>
          The halo reel
        </h3>
      </div>
      {M518_ITEMS.map((it, i) => {
        const q = m518At((i / M518_N) * Math.PI * 2, 470, 44);
        return (
          <div
            key={it.n}
            className="m518-card absolute left-1/2 top-[54%] -ml-[95px] -mt-[125px] h-[250px] w-[190px] overflow-hidden rounded-[18px] shadow-[0_24px_50px_rgba(0,0,0,.5)] will-change-transform"
            style={{ transform: `translate3d(${q.x.toFixed(1)}px,${q.y.toFixed(1)}px,0) scale(${q.s.toFixed(3)})`, zIndex: q.z }}
          >
            <Img i={i} w={380} h={500} />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3 pb-3 pt-8">
              <p className="text-[15px] font-[600]" style={{ fontFamily: F.sg }}>
                {it.n}
              </p>
              <p className="text-[13px] text-white/70">{it.p}</p>
            </div>
            <div className="m518-shade absolute inset-0 bg-[#05070d]" style={{ opacity: q.shade }} />
          </div>
        );
      })}
      <p className="absolute bottom-[7%] left-1/2 z-[120] w-max -translate-x-1/2 text-[15px] text-white/80" style={{ fontFamily: F.sg }}>
        Front of the halo · <span ref={cap}>{`${M518_ITEMS[0].n} · ${M518_ITEMS[0].p}`}</span>
        <span className="ml-3 text-[13px] text-white/45">drag to nudge</span>
      </p>
      <Sheen g1="rgba(110,160,255,.5)" />
    </Stage>
  );
}

/* ───────────────────────── M519 · Images orbit along a path ───────────────────────── */
const M519_N = 7;
const M519_PHI = -0.13;
/** The custom orbit curve in a 1000×600 box: a tilted ellipse with a gentle three-lobe wobble. */
function m519Pt(t: number): [number, number] {
  const th = t * Math.PI * 2;
  const r = 1 + 0.07 * Math.sin(3 * th);
  const X = 420 * r * Math.cos(th);
  const Y = 170 * r * Math.sin(th);
  return [500 + X * Math.cos(M519_PHI) - Y * Math.sin(M519_PHI), 300 + X * Math.sin(M519_PHI) + Y * Math.cos(M519_PHI)];
}
const M519_PTS = Array.from({ length: 121 }, (_, k) => m519Pt(k / 120));
const M519_D = M519_PTS.map(([x, y], k) => `${k ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("") + "Z";
const M519_YMIN = Math.min(...M519_PTS.map((p) => p[1]));
const M519_YMAX = Math.max(...M519_PTS.map((p) => p[1]));
const m519Depth = (y: number) => (y - M519_YMIN) / (M519_YMAX - M519_YMIN);
const M519_LABELS = ["Cocoa", "Vanilla", "Sea salt", "Hazelnut", "Orange", "Chilli", "Coffee"];
function M519() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(
    root,
    (el) => m519Build(el),
    { pre: () => loadPlugin("MotionPathPlugin").then((m) => (M519_MP.p = m)) },
  );
  return (
    <Stage r={root} g1="rgba(224,145,63,.5)" g2="rgba(255,77,109,.2)">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden>
        <path className="m519-path" d={M519_D} fill="none" stroke="rgba(255,220,180,.28)" strokeWidth="1.5" strokeDasharray="4 8" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="absolute left-1/2 top-1/2 z-[50] h-[300px] w-[230px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[999px] border border-white/15 shadow-[0_30px_70px_rgba(0,0,0,.6)]">
        <Img i={3} w={460} h={600} />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent pb-6 pt-10 text-center">
          <p className="text-[22px] leading-none" style={{ fontFamily: F.is }}>
            Dark 72%
          </p>
          <p className="mt-1 text-[13px] text-white/70">₹ 420 · 90 g bar</p>
        </div>
      </div>
      {M519_LABELS.map((l, i) => {
        const [x, y] = m519Pt(i / M519_N);
        const d = m519Depth(y);
        return (
          <div
            key={l}
            className="m519-it absolute h-[150px] w-[118px] overflow-hidden rounded-[14px] shadow-[0_16px_36px_rgba(0,0,0,.5)] will-change-transform"
            style={{ left: `${x / 10}%`, top: `${y / 6}%`, transform: `translate(-50%,-50%) scale(${(0.55 + 0.45 * d).toFixed(3)})`, zIndex: d > 0.5 ? 60 + Math.round(d * 20) : 10 + Math.round(d * 20) }}
          >
            <Img i={i + 1} w={236} h={300} />
            <p className="absolute inset-x-0 bottom-0 bg-black/55 py-1.5 text-center text-[13px]" style={{ fontFamily: F.sg }}>
              {l}
            </p>
            <div className="m519-shade absolute inset-0 bg-[#07090f]" style={{ opacity: (1 - d) * 0.6 }} />
          </div>
        );
      })}
      <div className="absolute left-[6%] top-[8%] z-[120]">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/55">Kokomo Bean Co. · Seven inclusions</p>
        <h3 className="mt-2 text-[clamp(30px,3.2vw,50px)] leading-none" style={{ fontFamily: F.fr, fontWeight: 500 }}>
          Around the bar
        </h3>
      </div>
      <Sheen g1="rgba(255,190,120,.5)" />
    </Stage>
  );
}
type MPType = typeof import("gsap/MotionPathPlugin").MotionPathPlugin;
const M519_MP: { p: MPType | null } = { p: null };
function m519Build(el: HTMLElement) {
  const MP = M519_MP.p;
  const path = el.querySelector<SVGPathElement>(".m519-path");
  const svg = el.querySelector<SVGSVGElement>("svg");
  if (!MP || !path || !svg) return;
  const raw = MP.getRawPath(path);
  MP.cacheRawPathMeasurements(raw);
  const items = all(el, ".m519-it");
  const shades = all(el, ".m519-shade");
  gsap.set(items, { left: 0, top: 0, xPercent: -50, yPercent: -50 });
  const prox = { p: 0 };
  const place = () => {
    const W = svg.clientWidth;
    const H = svg.clientHeight;
    items.forEach((n, i) => {
      const pt = MP.getPositionOnPath(raw, (prox.p + i / M519_N) % 1);
      const d = m519Depth(pt.y);
      gsap.set(n, { x: (pt.x / 1000) * W, y: (pt.y / 600) * H, scale: 0.55 + 0.45 * d, zIndex: d > 0.5 ? 60 + Math.round(d * 20) : 10 + Math.round(d * 20) });
      shades[i].style.opacity = ((1 - d) * 0.6).toFixed(3);
    });
  };
  place();
  return gsap.to(prox, { p: 1, duration: 16, ease: "none", repeat: -1, onUpdate: place });
}

/* ───────────────────────── M520 · Gallery formation morphs ───────────────────────── */
type V3 = { x: number; y: number; z: number; rotationX: number; rotationY: number; rotationZ: number; scale: number };
const v3 = (o: Partial<V3>): V3 => ({ x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, rotationZ: 0, scale: 1, ...o });
const M520_F: { name: string; world: { rotationX: number; rotationZ: number; y: number }; card: (i: number) => V3 }[] = [
  { name: "Grid", world: { rotationX: 0, rotationZ: 0, y: 0 }, card: (i) => v3({ x: ((i % 4) - 1.5) * 168, y: (Math.floor(i / 4) - 0.5) * 212 }) },
  { name: "Plane", world: { rotationX: 56, rotationZ: -22, y: 10 }, card: (i) => v3({ x: ((i % 4) - 1.5) * 196, y: (Math.floor(i / 4) - 0.5) * 236 }) },
  {
    name: "Ring",
    world: { rotationX: -10, rotationZ: 0, y: 0 },
    card: (i) => {
      const a = (i / 8) * Math.PI * 2;
      return v3({ x: Math.sin(a) * 330, z: Math.cos(a) * 330, rotationY: (a * 180) / Math.PI });
    },
  },
  { name: "Deck", world: { rotationX: 8, rotationZ: 0, y: 0 }, card: (i) => v3({ x: i * 7 - 25, y: 25 - i * 7, z: (7 - i) * 14, rotationZ: (i - 3.5) * 2.6, scale: 1.2 }) },
];
const m520Css = (v: V3) =>
  `translate3d(${v.x}px,${v.y}px,${v.z}px) rotateZ(${v.rotationZ}deg) rotateY(${v.rotationY}deg) rotateX(${v.rotationX}deg) scale(${v.scale})`;
const M520_NAMES = ["Linen", "Clay", "Dune", "Moss", "Ember", "Slate", "Fig", "Tide"];
function M520() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const world = el.querySelector(".m520-world");
    const sway = el.querySelector(".m520-sway");
    const cards = all(el, ".m520-card");
    const pills = all(el, ".m520-pill");
    if (!world || !sway) return;
    gsap.set(world, { ...M520_F[0].world, transformStyle: "preserve-3d" });
    cards.forEach((c, i) => gsap.set(c, M520_F[0].card(i)));
    const mark = (f: number) => pills.forEach((p, k) => gsap.to(p, { opacity: k === f ? 1 : 0.4, backgroundColor: k === f ? "rgba(255,255,255,.16)" : "rgba(255,255,255,0)", duration: 0.3, overwrite: "auto" }));
    const tl = gsap.timeline({ repeat: -1 });
    [1, 2, 3, 0].forEach((f) => {
      const at = tl.duration();
      tl.to(world, { ...M520_F[f].world, duration: 1.2, ease: "power2.inOut" }, at);
      cards.forEach((c, i) => tl.to(c, { ...M520_F[f].card(i), duration: 1.2, ease: "power2.inOut" }, at + i * 0.025));
      tl.call(() => mark(f), [], at + 0.5);
      tl.to({}, { duration: 0.12 });
    });
    const sw = gsap.fromTo(sway, { rotationY: -9 }, { rotationY: 9, duration: 2.4, ease: "sine.inOut", yoyo: true, repeat: -1 });
    return [tl, sw];
  });
  return (
    <Stage r={root} g1="rgba(24,196,143,.45)" g2="rgba(79,141,255,.24)">
      <div className="absolute left-[6%] top-[8%] z-[120]">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/55">Atelier Noor · Eight glazes</p>
        <h3 className="mt-2 text-[clamp(30px,3.2vw,50px)] leading-none" style={{ fontFamily: F.sy, fontWeight: 700 }}>
          One set, four shapes
        </h3>
      </div>
      <div className="absolute right-[6%] top-[9%] z-[120] flex gap-1 rounded-full border border-white/15 p-1 text-[13px]" style={{ fontFamily: F.sg }}>
        {M520_F.map((f, k) => (
          <span key={f.name} className="m520-pill rounded-full px-3 py-1.5" style={{ opacity: k === 0 ? 1 : 0.4, background: k === 0 ? "rgba(255,255,255,.16)" : "transparent" }}>
            {f.name}
          </span>
        ))}
      </div>
      <div className="absolute inset-0 top-[8%]" style={{ perspective: "1500px" }}>
        <div className="m520-sway absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
          <div className="m520-world absolute left-1/2 top-1/2 h-0 w-0" style={{ transformStyle: "preserve-3d" }}>
            {M520_NAMES.map((n, i) => (
              <div key={n} className="m520-card absolute -ml-[72px] -mt-[92px] h-[184px] w-[144px] overflow-hidden rounded-[14px] border border-white/10 shadow-[0_18px_40px_rgba(0,0,0,.45)]" style={{ transform: m520Css(M520_F[0].card(i)) }}>
                <Img i={i} w={288} h={368} />
                <p className="absolute bottom-2 left-3 text-[13px] font-[600]" style={{ fontFamily: F.sg }}>
                  {n} · ₹ {1800 + i * 240}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Sheen g1="rgba(90,220,170,.5)" />
    </Stage>
  );
}

/* ───────────────────────── M521 · Arc fan carousel ───────────────────────── */
const M521_ITEMS = ["Monsoon Tote", "Kora Sling", "Field Duffel", "Pier Clutch", "Atlas Backpack", "Reed Crossbody", "Cove Bucket", "Mesa Weekender", "Loom Pouch"];
const M521_P = ["₹ 3,900", "₹ 2,750", "₹ 6,400", "₹ 2,200", "₹ 5,800", "₹ 3,300", "₹ 3,600", "₹ 7,200", "₹ 1,450"];
const M521_PIVOT = 780;
type M521Api = { hover: (on: boolean) => void; goTo: (k: number) => void; st: { a: number; s: number } };
function M521() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const api = useRef<M521Api | null>(null);
  usePlay(
    root,
    (el) => {
      const cards = all(el, ".m521-card");
      const cap = el.querySelector(".m521-cap");
      const next = el.querySelector(".m521-next");
      const prev = el.querySelector(".m521-prev");
      const arc = el.querySelector(".m521-arc");
      if (!next || !prev || !arc || !dot.current) return;
      const st = { a: 4, s: 7 };
      const apply = () =>
        cards.forEach((n, i) => {
          const d = i - st.a;
          gsap.set(n, { rotation: d * st.s, opacity: 1 - Math.min(Math.abs(d) * 0.13, 0.7) });
        });
      const A: M521Api = {
        st,
        hover: (on) => gsap.to(st, { s: on ? 11.5 : 7, duration: 0.55, ease: "power3.out", onUpdate: apply, overwrite: "auto" }),
        goTo: (k) => {
          const t = gsap.utils.clamp(0, cards.length - 1, k);
          if (cap) cap.textContent = `${M521_ITEMS[t]} · ${M521_P[t]}`;
          gsap.to(st, { a: t, duration: 0.75, ease: "power3.inOut", onUpdate: apply, overwrite: "auto" });
        },
      };
      api.current = A;
      gsap.set(cards, { transformOrigin: `50% ${M521_PIVOT}px` });
      apply();
      const W = el.clientWidth;
      const H = el.clientHeight;
      const c = centre(cards[4], el);
      const n = centre(next, el);
      const p = centre(prev, el);
      const d = dot.current;
      const tl = gsap.timeline({ repeat: -1 });
      tl.set(d, { x: W * 0.92, y: H * 0.96, opacity: 1 });
      tl.to(d, { x: c.x, y: c.y, duration: 0.6, ease: "power2.inOut" });
      tl.call(() => A.hover(true), [], "-=0.15");
      tl.to(d, { x: c.x - 220, y: c.y + 10, duration: 0.5, ease: "sine.inOut" });
      tl.to(d, { x: c.x + 230, y: c.y - 10, duration: 0.7, ease: "sine.inOut" });
      tl.to(d, { x: n.x, y: n.y, duration: 0.5, ease: "power2.inOut" });
      tl.call(() => A.hover(false), [], "-=0.4");
      tl.call(() => (A.goTo(5), press(d, next)));
      tl.to(d, { x: n.x + 8, y: n.y - 6, duration: 0.4, ease: "sine.inOut" });
      tl.call(() => (A.goTo(6), press(d, next)));
      tl.to(d, { x: p.x, y: p.y, duration: 0.5, ease: "power2.inOut" });
      tl.call(() => (A.goTo(5), press(d, prev)));
      tl.to(d, { x: p.x - 8, y: p.y - 6, duration: 0.4, ease: "sine.inOut" });
      tl.call(() => (A.goTo(4), press(d, prev)));
      tl.to(d, { x: W * 0.92, y: H * 0.96, duration: 0.6, ease: "power2.inOut" });
      return tl;
    },
    { interactive: true },
  );
  const step = (k: number) => api.current?.goTo(Math.round(api.current.st.a) + k);
  return (
    <Stage r={root} g1="rgba(255,122,89,.42)" g2="rgba(79,141,255,.24)">
      <div className="absolute left-[6%] top-[8%] z-[120]">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/55">Hollis &amp; Rye · Bags</p>
        <h3 className="mt-2 text-[clamp(28px,3vw,46px)] leading-none" style={{ fontFamily: F.is }}>
          Carry the season
        </h3>
      </div>
      <div className="m521-arc absolute left-1/2 top-[16%] h-[300px] w-[min(80%,1000px)] -translate-x-1/2" onPointerEnter={() => api.current?.hover(true)} onPointerLeave={() => api.current?.hover(false)}>
        {M521_ITEMS.map((n, i) => {
          const d = i - 4;
          return (
            <div
              key={n}
              className="m521-card absolute left-1/2 top-0 -ml-[90px] h-[240px] w-[180px] overflow-hidden rounded-[16px] border border-white/10 shadow-[0_22px_44px_rgba(0,0,0,.5)]"
              style={{ transform: `rotate(${d * 7}deg)`, transformOrigin: `50% ${M521_PIVOT}px`, opacity: 1 - Math.min(Math.abs(d) * 0.13, 0.7), zIndex: 20 - Math.abs(d) }}
            >
              <Img i={i} w={360} h={480} />
            </div>
          );
        })}
      </div>
      <div className="absolute bottom-[9%] left-1/2 z-[120] flex -translate-x-1/2 items-center gap-6">
        <button type="button" aria-label="Previous" onClick={() => step(-1)} className="m521-prev grid h-[52px] w-[52px] place-items-center rounded-full border border-white/25 bg-white/5 text-[20px]">
          ←
        </button>
        <p className="m521-cap w-[260px] text-center text-[17px]" style={{ fontFamily: F.sg }}>
          {M521_ITEMS[4]} · {M521_P[4]}
        </p>
        <button type="button" aria-label="Next" onClick={() => step(1)} className="m521-next grid h-[52px] w-[52px] place-items-center rounded-full border border-white/25 bg-white/5 text-[20px]">
          →
        </button>
      </div>
      <Sheen g1="rgba(255,160,120,.5)" />
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M522 · Arch fan with card lift ───────────────────────── */
const M522_ITEMS = [
  { n: "Terrace Suite", p: "₹ 14,500" },
  { n: "Courtyard Room", p: "₹ 9,800" },
  { n: "Garden Villa", p: "₹ 21,000" },
  { n: "The Loft", p: "₹ 17,200" },
  { n: "Pool Cabana", p: "₹ 19,400" },
  { n: "Orchard Cottage", p: "₹ 12,600" },
  { n: "Sky Room", p: "₹ 15,900" },
];
const M522_R = 520;
function m522Base(i: number) {
  const k = i - 3;
  const a = (k * 15 * Math.PI) / 180;
  return { x: Math.sin(a) * M522_R, y: (1 - Math.cos(a)) * M522_R, rotation: k * 15, scale: 1.06 - Math.abs(k) * 0.06, zIndex: 10 - Math.abs(k) };
}
function M522() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const cap = useRef<HTMLParagraphElement>(null);
  const st = useRef({ active: -1, ready: false });
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const cards = all(el, ".m522-card");
    cards.forEach((c, i) => gsap.set(c, { ...m522Base(i), xPercent: -50, yPercent: -50 }));
    st.current.ready = true;
    return () => {
      gsap.killTweensOf(cards);
      gsap.set(cards, { clearProps: "transform,zIndex" });
      st.current = { active: -1, ready: false };
    };
  }, []);
  usePointer(
    root,
    dot,
    (t, el) => {
      const W = el.clientWidth;
      const H = el.clientHeight;
      const order = [0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
      const pts: [number, number][] = order.map((i) => {
        const b = m522Base(i);
        return [W / 2 + b.x, H * 0.4 + b.y + 20];
      });
      const [x, y] = stepPath(t, pts, 0.6, 0.45);
      return { x, y: y + Math.sin(t * 3.1) * 8, inside: true };
    },
    (p, el) => {
      const s = st.current;
      if (!s.ready) return;
      const W = el.clientWidth;
      const H = el.clientHeight;
      let idx = -1;
      let bd = 110;
      if (p.inside)
        for (let i = 0; i < 7; i++) {
          const b = m522Base(i);
          const d = Math.hypot(p.x - (W / 2 + b.x), p.y - (H * 0.4 + b.y));
          if (d < bd) {
            bd = d;
            idx = i;
          }
        }
      if (idx === s.active) return;
      const cards = all(el, ".m522-card");
      if (s.active >= 0) gsap.to(cards[s.active], { ...m522Base(s.active), duration: 0.45, ease: "power3.out", overwrite: "auto" });
      s.active = idx;
      if (idx < 0) return;
      const b = m522Base(idx);
      gsap.to(cards[idx], { x: b.x, y: b.y - 54, rotation: b.rotation * 0.3, scale: b.scale * 1.18, zIndex: 40, duration: 0.45, ease: "power3.out", overwrite: "auto" });
      if (cap.current) cap.current.textContent = `${M522_ITEMS[idx].n} · from ${M522_ITEMS[idx].p} a night`;
    },
  );
  return (
    <Stage r={root} g1="rgba(224,145,63,.48)" g2="rgba(24,196,143,.2)">
      <div className="absolute left-[6%] top-[8%] z-[120]">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/55">Casa Albero · Rooms</p>
        <h3 className="mt-2 text-[clamp(28px,3vw,46px)] leading-none" style={{ fontFamily: F.fr, fontWeight: 500 }}>
          Seven ways to stay
        </h3>
      </div>
      {M522_ITEMS.map((it, i) => {
        const b = m522Base(i);
        return (
          <div
            key={it.n}
            className="m522-card absolute left-1/2 top-[40%] h-[230px] w-[172px] overflow-hidden rounded-[16px] border border-white/10 shadow-[0_22px_46px_rgba(0,0,0,.5)]"
            style={{ transform: `translate(-50%,-50%) translate(${b.x.toFixed(1)}px,${b.y.toFixed(1)}px) rotate(${b.rotation}deg) scale(${b.scale})`, zIndex: b.zIndex }}
          >
            <Img i={i + 1} w={344} h={460} />
            <p className="absolute bottom-2 left-3 text-[13px] font-[600]" style={{ fontFamily: F.sg }}>
              {it.n}
            </p>
          </div>
        );
      })}
      <p ref={cap} className="absolute bottom-[8%] left-1/2 z-[120] w-max -translate-x-1/2 text-[17px] text-white/85" style={{ fontFamily: F.sg }}>
        Garden Villa · from ₹ 21,000 a night
      </p>
      <Sheen g1="rgba(255,190,120,.5)" />
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M523 · Fan spreads on hover ───────────────────────── */
const m523Rest = (i: number) => {
  const k = i - 2;
  return { x: k * 28, y: Math.abs(k) * 8, rotation: k * 5, scale: 1 };
};
const m523Open = (i: number) => {
  const k = i - 2;
  return { x: k * 205, y: Math.abs(k) * 30 - 10, rotation: k * 11, scale: 1.07 };
};
function M523() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const api = useRef<((on: boolean) => void) | null>(null);
  usePlay(
    root,
    (el) => {
      const cards = all(el, ".m523-card");
      const fan = el.querySelector(".m523-fan");
      const d = dot.current;
      if (!fan || !d) return;
      cards.forEach((c, i) => gsap.set(c, { ...m523Rest(i), xPercent: -50, yPercent: -50 }));
      const open = (on: boolean) =>
        cards.forEach((c, i) =>
          gsap.to(c, { ...(on ? m523Open(i) : m523Rest(i)), duration: 0.5, delay: Math.abs(i - 2) * 0.03, ease: on ? "power3.out" : "power3.inOut", overwrite: "auto" }),
        );
      api.current = open;
      const W = el.clientWidth;
      const H = el.clientHeight;
      const c = centre(fan, el);
      const tl = gsap.timeline({ repeat: -1 });
      tl.set(d, { x: W * 0.14, y: H * 0.86, opacity: 1 });
      tl.to(d, { x: c.x - 20, y: c.y + 10, duration: 0.6, ease: "sine.inOut" });
      tl.call(() => open(true), [], "-=0.12");
      tl.to(d, { x: c.x - 260, y: c.y + 30, duration: 0.5, ease: "sine.inOut" });
      tl.to(d, { x: c.x + 260, y: c.y - 10, duration: 0.7, ease: "sine.inOut" });
      tl.to(d, { x: W * 0.88, y: H * 0.9, duration: 0.5, ease: "sine.inOut" });
      tl.call(() => open(false), [], "-=0.32");
      tl.to(d, { x: W * 0.5, y: H * 0.96, duration: 0.45, ease: "sine.inOut" });
      tl.to(d, { x: W * 0.14, y: H * 0.86, duration: 0.45, ease: "sine.inOut" });
      return tl;
    },
    { interactive: true },
  );
  return (
    <Stage r={root} g1="rgba(255,77,109,.58)" g2="rgba(255,190,110,.3)">
      <div className="absolute left-[6%] top-[8%] z-[120]">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/55">Kumbha Studio · Spring kiln</p>
        <h3 className="mt-2 text-[clamp(28px,3vw,46px)] leading-none" style={{ fontFamily: F.is }}>
          Five glazes, one firing
        </h3>
      </div>
      <div className="m523-fan absolute left-1/2 top-[56%] h-[330px] w-[440px] -translate-x-1/2 -translate-y-1/2" onPointerEnter={() => api.current?.(true)} onPointerLeave={() => api.current?.(false)}>
        {[0, 1, 2, 3, 4].map((i) => {
          const o = m523Open(i);
          return (
            <div
              key={i}
              className="m523-card absolute left-1/2 top-1/2 h-[300px] w-[228px] overflow-hidden rounded-[18px] border border-white/10 shadow-[0_24px_50px_rgba(0,0,0,.5)]"
              style={{ transform: `translate(-50%,-50%) translate(${o.x}px,${o.y}px) rotate(${o.rotation}deg) scale(${o.scale})`, zIndex: 10 - Math.abs(i - 2) }}
            >
              <Img i={i + 2} w={456} h={600} />
              <p className="absolute bottom-3 left-3 text-[13px] font-[600]" style={{ fontFamily: F.sg }}>
                Glaze 0{i + 1} · ₹ {(2400 + i * 350).toLocaleString("en-IN")}
              </p>
            </div>
          );
        })}
      </div>
      <Sheen g1="rgba(255,150,150,.5)" />
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M524 · Cards fan to uncover headline ───────────────────────── */
const m524Closed = (i: number) => ({ x: (i - 1.5) * 165, y: i % 2 ? 12 : -10, rotation: (i - 1.5) * 3, scale: 1 });
const M524_OPEN = [
  { x: -480, y: -110, rotation: -14, scale: 0.64 },
  { x: -250, y: 205, rotation: 8, scale: 0.64 },
  { x: 250, y: -205, rotation: -8, scale: 0.64 },
  { x: 480, y: 110, rotation: 14, scale: 0.64 },
];
function M524() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const api = useRef<((on: boolean) => void) | null>(null);
  usePlay(
    root,
    (el) => {
      const cards = all(el, ".m524-card");
      const head = el.querySelector(".m524-head");
      const d = dot.current;
      if (!head || !d) return;
      cards.forEach((c, i) => gsap.set(c, { ...m524Closed(i), xPercent: -50, yPercent: -50 }));
      gsap.set(head, { backgroundPosition: "0% 50%" });
      const open = (on: boolean) => {
        cards.forEach((c, i) =>
          gsap.to(c, { ...(on ? M524_OPEN[i] : m524Closed(i)), duration: on ? 0.9 : 0.75, delay: (on ? i : 3 - i) * 0.04, ease: on ? "power3.out" : "power3.inOut", overwrite: "auto" }),
        );
        gsap.to(head, { backgroundPosition: on ? "100% 50%" : "0% 50%", duration: 0.95, ease: "power2.out", overwrite: "auto" });
      };
      api.current = open;
      const W = el.clientWidth;
      const H = el.clientHeight;
      const tl = gsap.timeline({ repeat: -1 });
      tl.set(d, { x: W * 0.12, y: H * 0.18, opacity: 1 });
      tl.to(d, { x: W * 0.5 - 40, y: H * 0.5, duration: 0.6, ease: "power2.inOut" });
      tl.call(() => (open(true), press(d)), [], "-=0.05");
      tl.to(d, { x: W * 0.5 + 60, y: H * 0.56, duration: 0.6, ease: "sine.inOut" });
      tl.to(d, { x: W * 0.5 - 20, y: H * 0.46, duration: 0.5, ease: "sine.inOut" });
      tl.to(d, { x: W * 0.9, y: H * 0.86, duration: 0.5, ease: "power2.inOut" });
      tl.call(() => open(false), [], "-=0.3");
      tl.to(d, { x: W * 0.5, y: H * 0.95, duration: 0.45, ease: "sine.inOut" });
      tl.to(d, { x: W * 0.12, y: H * 0.18, duration: 0.5, ease: "sine.inOut" });
      return tl;
    },
    { interactive: true },
  );
  return (
    <Stage r={root} g1="rgba(150,120,255,.45)" g2="rgba(255,180,110,.24)">
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="mb-3 text-[13px] uppercase tracking-[0.26em] text-white/60">Wayfarer Journal · Issue 09</p>
          <h3 className="m524-head text-[clamp(52px,6vw,92px)] leading-[0.98] tracking-[-0.02em]" style={{ fontFamily: F.fr, fontWeight: 600 }}>
            Made to
            <br />
            be found.
          </h3>
        </div>
      </div>
      <div className="absolute inset-0 z-[20]" onPointerEnter={() => api.current?.(true)} onPointerLeave={() => api.current?.(false)}>
        {M524_OPEN.map((o, i) => (
          <div
            key={i}
            className="m524-card absolute left-1/2 top-1/2 h-[300px] w-[240px] overflow-hidden rounded-[18px] border border-white/10 shadow-[0_26px_54px_rgba(0,0,0,.55)]"
            style={{ transform: `translate(-50%,-50%) translate(${o.x}px,${o.y}px) rotate(${o.rotation}deg) scale(${o.scale})`, zIndex: 10 + i }}
          >
            <Img i={i} w={480} h={600} />
          </div>
        ))}
      </div>
      <Sheen g1="rgba(170,150,255,.5)" />
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M525 · Deck cycle (front tucks behind) ───────────────────────── */
const M525_ITEMS = [
  { n: "Citrus Spritz", p: "₹ 180" },
  { n: "Berry Fizz", p: "₹ 190" },
  { n: "Lime Tonic", p: "₹ 170" },
  { n: "Mango Sparkle", p: "₹ 200" },
  { n: "Cola Reserve", p: "₹ 160" },
];
const M525_N = M525_ITEMS.length;
const m525Slot = (k: number) => ({ x: -60 + k * 44, y: -k * 16, rotation: k * 4.5, scale: 1 - k * 0.045, filter: `brightness(${1 - k * 0.11})` });
const mod = (a: number, n: number) => ((a % n) + n) % n;
function M525() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const cards = all(el, ".m525-card");
    const count = el.querySelector(".m525-count");
    const bar = el.querySelector(".m525-bar");
    cards.forEach((c, i) => gsap.set(c, { ...m525Slot(i), zIndex: 10 - i, xPercent: -50, yPercent: -50 }));
    const tl = gsap.timeline({ repeat: -1 });
    const CY = 1.0;
    for (let c = 0; c < M525_N; c++) {
      const at = c * CY;
      const front = cards[c];
      const s0 = m525Slot(0);
      tl.to(front, { y: s0.y - 170, x: s0.x - 30, rotation: -9, duration: 0.35, ease: "power2.out" }, at);
      tl.set(front, { zIndex: 1 }, at + 0.35);
      tl.to(front, { ...m525Slot(M525_N - 1), duration: 0.5, ease: "power2.inOut" }, at + 0.35);
      cards.forEach((card, i) => {
        if (i === c) return;
        const k = mod(i - c, M525_N) - 1;
        tl.set(card, { zIndex: 10 - k }, at + 0.3);
        tl.to(card, { ...m525Slot(k), duration: 0.5, ease: "power2.inOut" }, at + 0.3);
      });
      tl.call(() => count && (count.textContent = `0${mod(c + 1, M525_N) + 1} / 0${M525_N}`), [], at + 0.5);
      if (bar) tl.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: CY, ease: "none", immediateRender: false }, at);
    }
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,190,80,.42)" g2="rgba(255,77,109,.22)">
      <div className="absolute left-[6%] top-[12%] z-[120] w-[34%]">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/55">Fizzwell Soda Works</p>
        <h3 className="mt-3 text-[clamp(34px,3.6vw,56px)] leading-[1.02]" style={{ fontFamily: F.sy, fontWeight: 700 }}>
          Five flavours, on rotation
        </h3>
        <p className="mt-4 max-w-[34ch] text-[15px] text-white/65">Small-batch sodas, cane sugar only. Mix a crate of 12 from ₹ 1,980.</p>
        <div className="mt-6 flex items-center gap-4">
          <span className="m525-count text-[15px] tabular-nums" style={{ fontFamily: F.sg }}>
            01 / 05
          </span>
          <span className="relative h-[2px] w-[140px] bg-white/15">
            <span className="m525-bar absolute inset-0 origin-left bg-white/80" />
          </span>
        </div>
      </div>
      {M525_ITEMS.map((it, i) => {
        const s = m525Slot(i);
        return (
          <div
            key={it.n}
            className="m525-card absolute left-[66%] top-[54%] h-[360px] w-[280px] overflow-hidden rounded-[20px] border border-white/10 shadow-[0_26px_56px_rgba(0,0,0,.55)]"
            style={{ transform: `translate(-50%,-50%) translate(${s.x}px,${s.y}px) rotate(${s.rotation}deg) scale(${s.scale})`, zIndex: 10 - i, filter: s.filter }}
          >
            <Img i={i} w={560} h={720} />
            <div className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-[12px] bg-black/45 px-4 py-3 backdrop-blur-[2px]">
              <span className="text-[15px] font-[600]" style={{ fontFamily: F.sg }}>
                {it.n}
              </span>
              <span className="text-[14px] text-white/80">{it.p}</span>
            </div>
          </div>
        );
      })}
      <Sheen g1="rgba(255,200,120,.5)" />
    </Stage>
  );
}

/* ───────────────────────── M526 · Card drop-and-return cycle ───────────────────────── */
const M526_ITEMS = [
  { t: "Cold-pressed daily", s: "Seven fruits, no water added", i: 2 },
  { t: "Delivered by 7 am", s: "Glass bottles, collected back", i: 0 },
  { t: "Plans from ₹ 1,450", s: "Weekly, pause any time", i: 3 },
  { t: "Zero added sugar", s: "Tested every batch", i: 1 },
];
const M526_N = M526_ITEMS.length;
const m526Slot = (k: number) => ({ x: k * 62, y: -k * 56, z: -k * 110 });
function M526() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const cards = all(el, ".m526-card");
    const sway = el.querySelector(".m526-sway");
    cards.forEach((c, i) => gsap.set(c, { ...m526Slot(i), xPercent: -50, yPercent: -50, zIndex: 10 - i }));
    const tl = gsap.timeline({ repeat: -1 });
    const CY = 1.45;
    for (let c = 0; c < M526_N; c++) {
      const at = c * CY;
      const front = cards[c];
      const back = m526Slot(M526_N - 1);
      tl.to(front, { y: "+=640", rotation: 4, duration: 0.55, ease: "power3.in" }, at);
      tl.set(front, { ...back, y: back.y + 560, rotation: 0, zIndex: 1 }, at + 0.56);
      tl.to(front, { y: back.y, duration: 0.65, ease: "power3.out" }, at + 0.56);
      cards.forEach((card, i) => {
        if (i === c) return;
        const k = mod(i - c, M526_N) - 1;
        tl.set(card, { zIndex: 10 - k }, at + 0.3);
        tl.to(card, { ...m526Slot(k), duration: 0.6, ease: "power2.inOut" }, at + 0.3);
      });
      tl.to({}, { duration: 0.01 }, at + CY - 0.01);
    }
    const sw = sway ? gsap.fromTo(sway, { rotationY: -16, rotationX: 4 }, { rotationY: -4, rotationX: 8, duration: 2.2, ease: "sine.inOut", yoyo: true, repeat: -1 }) : null;
    return sw ? [tl, sw] : tl;
  });
  return (
    <Stage r={root} g1="rgba(24,196,143,.45)" g2="rgba(255,190,90,.24)">
      <div className="absolute left-[6%] top-[14%] z-[120] w-[36%]">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/55">Greenmile Juicery</p>
        <h3 className="mt-3 text-[clamp(34px,3.6vw,56px)] leading-[1.02]" style={{ fontFamily: F.fr, fontWeight: 500 }}>
          Fresh every morning
        </h3>
        <p className="mt-4 max-w-[32ch] text-[15px] text-white/65">The front card drops away and comes back round behind the stack.</p>
      </div>
      <div className="absolute inset-0" style={{ perspective: "1000px" }}>
        <div className="m526-sway absolute left-[62%] top-[60%] h-0 w-0" style={{ transformStyle: "preserve-3d", transform: "rotateY(-10deg) rotateX(6deg)" }}>
          {M526_ITEMS.map((it, k) => {
            const s = m526Slot(k);
            return (
              <div
                key={it.t}
                className="m526-card absolute left-0 top-0 h-[250px] w-[360px] overflow-hidden rounded-[20px] border border-white/15 bg-[#0d121c] shadow-[0_30px_60px_rgba(0,0,0,.5)]"
                style={{ transform: `translate(-50%,-50%) translate3d(${s.x}px,${s.y}px,${s.z}px)`, zIndex: 10 - k }}
              >
                <Img i={it.i} w={720} h={500} className="absolute inset-0 opacity-70" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-5 left-5">
                  <p className="text-[24px] font-[600] leading-tight" style={{ fontFamily: F.sg }}>
                    {it.t}
                  </p>
                  <p className="mt-1 text-[14px] text-white/70">{it.s}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Sheen g1="rgba(90,220,170,.5)" />
    </Stage>
  );
}

/* ───────────────────────── M527 · Flick-to-back photo stack ───────────────────────── */
const M527_ITEMS = ["Morning at the ghat", "Salt pans, Kutch", "Blue lane, Jodhpur", "Tea rows at dawn", "Monsoon ferry"];
const M527_N = M527_ITEMS.length;
const M527_ROT = [-2, 5, -6, 3, -4];
const m527Slot = (k: number) => ({ x: k * 6 - 12, y: k * 4, rotation: M527_ROT[k], scale: 1 - k * 0.025 });
function M527() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const cards = all(el, ".m527-card");
    cards.forEach((c, i) => gsap.set(c, { ...m527Slot(i), zIndex: 10 - i, xPercent: -50, yPercent: -50 }));
    const W = el.clientWidth;
    const tl = gsap.timeline({ repeat: -1 });
    const CY = 1.08;
    for (let c = 0; c < M527_N; c++) {
      const at = c * CY;
      const dir = c % 2 ? -1 : 1;
      const front = cards[c];
      tl.to(front, { x: dir * W * 0.3, y: -40, rotation: dir * 26, duration: 0.42, ease: "power3.out" }, at);
      tl.set(front, { zIndex: 1 }, at + 0.42);
      tl.to(front, { ...m527Slot(M527_N - 1), duration: 0.52, ease: "power2.inOut" }, at + 0.42);
      cards.forEach((card, i) => {
        if (i === c) return;
        const k = mod(i - c, M527_N) - 1;
        tl.set(card, { zIndex: 10 - k }, at + 0.18);
        tl.to(card, { ...m527Slot(k), duration: 0.45, ease: "power2.out" }, at + 0.18);
      });
      tl.to({}, { duration: 0.01 }, at + CY - 0.01);
    }
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,170,90,.45)" g2="rgba(79,141,255,.22)">
      <div className="absolute left-[6%] top-[8%] z-[120]">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/55">Roam &amp; Rest · Journeys</p>
        <h3 className="mt-2 text-[clamp(28px,3vw,46px)] leading-none" style={{ fontFamily: F.is }}>
          Postcards from the road
        </h3>
      </div>
      {M527_ITEMS.map((t, i) => {
        const s = m527Slot(i);
        return (
          <div
            key={t}
            className="m527-card absolute left-1/2 top-[56%] w-[280px] rounded-[6px] bg-[#f6f1e7] p-3 pb-0 shadow-[0_24px_50px_rgba(0,0,0,.55)]"
            style={{ transform: `translate(-50%,-50%) translate(${s.x}px,${s.y}px) rotate(${s.rotation}deg) scale(${s.scale})`, zIndex: 10 - i }}
          >
            <div className="h-[290px] overflow-hidden rounded-[3px]">
              <Img i={i + 1} w={512} h={580} />
            </div>
            <p className="py-3 text-center text-[22px] leading-none text-[#2a2420]" style={{ fontFamily: F.is }}>
              {t}
            </p>
          </div>
        );
      })}
      <Sheen g1="rgba(255,200,140,.5)" />
    </Stage>
  );
}

/* ───────────────────────── M528 · Card falls away deck ───────────────────────── */
const M528_ITEMS = [
  { t: "The quiet table", s: "Chef's counter · 8 seats", p: "₹ 4,200 per guest" },
  { t: "Smoke & citrus", s: "Seven-course tasting", p: "₹ 6,800 per guest" },
  { t: "Sunday long lunch", s: "Family style · courtyard", p: "₹ 2,900 per guest" },
  { t: "Cellar evenings", s: "Natural wines · small plates", p: "₹ 3,600 per guest" },
];
const M528_N = M528_ITEMS.length;
const m528Slot = (k: number) => ({ x: 0, y: -k * 24, rotation: 0, rotationX: 0, scale: 1 - k * 0.07, opacity: 1, filter: `blur(0px) brightness(${1 - k * 0.16})` });
function M528() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const cards = all(el, ".m528-card");
    cards.forEach((c, i) => gsap.set(c, { ...m528Slot(i), zIndex: 10 - i, xPercent: -50, yPercent: -50, transformPerspective: 900 }));
    const tl = gsap.timeline({ repeat: -1 });
    const CY = 1.25;
    for (let c = 0; c < M528_N; c++) {
      const at = c * CY;
      const front = cards[c];
      const back = m528Slot(M528_N - 1);
      tl.to(front, { y: 380, x: 70, rotation: 15, rotationX: 30, scale: 0.92, opacity: 0, filter: "blur(14px) brightness(1)", duration: 0.7, ease: "power2.in" }, at);
      tl.set(front, { ...back, y: back.y - 36, scale: back.scale * 0.92, opacity: 0, zIndex: 1 }, at + 0.71);
      tl.to(front, { y: back.y, scale: back.scale, opacity: 1, duration: 0.42, ease: "power2.out" }, at + 0.71);
      cards.forEach((card, i) => {
        if (i === c) return;
        const k = mod(i - c, M528_N) - 1;
        tl.set(card, { zIndex: 10 - k }, at + 0.2);
        tl.to(card, { ...m528Slot(k), duration: 0.55, ease: "power2.inOut" }, at + 0.2);
      });
      tl.to({}, { duration: 0.01 }, at + CY - 0.01);
    }
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,120,90,.42)" g2="rgba(150,120,255,.24)">
      <div className="absolute left-[6%] top-[14%] z-[120] w-[34%]">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/55">Ottoline Kitchen · Reservations</p>
        <h3 className="mt-3 text-[clamp(34px,3.6vw,56px)] leading-[1.02]" style={{ fontFamily: F.fr, fontWeight: 500 }}>
          Four ways to dine
        </h3>
        <p className="mt-4 max-w-[32ch] text-[15px] text-white/65">Each card falls away to show the next; the deck refills from the back.</p>
      </div>
      {M528_ITEMS.map((it, i) => {
        const s = m528Slot(i);
        return (
          <div
            key={it.t}
            className="m528-card absolute left-[64%] top-[56%] h-[380px] w-[300px] overflow-hidden rounded-[22px] border border-white/10 bg-[#0d121c] shadow-[0_28px_60px_rgba(0,0,0,.55)]"
            style={{ transform: `translate(-50%,-50%) translateY(${s.y}px) scale(${s.scale})`, zIndex: 10 - i, filter: s.filter }}
          >
            <div className="h-[250px]">
              <Img i={i + 1} w={600} h={500} />
            </div>
            <div className="p-5">
              <p className="text-[24px] leading-tight" style={{ fontFamily: F.fr, fontWeight: 500 }}>
                {it.t}
              </p>
              <p className="mt-1 text-[13px] text-white/60">{it.s}</p>
              <p className="mt-2 text-[14px]" style={{ fontFamily: F.sg }}>
                {it.p}
              </p>
            </div>
          </div>
        );
      })}
      <Sheen g1="rgba(255,160,130,.5)" />
    </Stage>
  );
}

/* ───────────────────────── M529 · Testimonial photo stack swap ───────────────────────── */
const M529_ITEMS = [
  { n: "Mira Okonjo", r: "Head of Retail · Saltmarsh Goods", q: "We rebuilt our whole storefront in a week, and our returning customers noticed before we even announced it." },
  { n: "Devan Altaf", r: "Founder · Ridgeback Coffee", q: "The product pages finally feel like our roastery: calm, warm and quick. Orders on launch day doubled." },
  { n: "Lena Varga", r: "Creative Lead · Northpine Studio", q: "Every section moves with purpose. Clients open the link and stay, which never happened with our old site." },
  { n: "Rohan Esk", r: "Owner · Tidewell Surf Co.", q: "It looks like a film, yet it loads fast on a beach connection. That balance is exactly what we wanted." },
];
const M529_N = M529_ITEMS.length;
const M529_ROT = [-7, 6, -3, 9];
function M529() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const pics = all(el, ".m529-pic");
    const blocks = all(el, ".m529-q");
    const bar = el.querySelector(".m529-bar");
    const z = (i: number, c: number) => 10 + M529_N - mod(i - c, M529_N);
    pics.forEach((p, i) => gsap.set(p, { rotation: i === 0 ? 0 : M529_ROT[i], scale: i === 0 ? 1 : 0.94, y: 0, zIndex: z(i, 0) }));
    const tl = gsap.timeline({ repeat: -1 });
    let at = 0;
    for (let c = 0; c < M529_N; c++) {
      const n = (c + 1) % M529_N;
      const wordsC = all(blocks[c], ".m529-w");
      const wordsN = all(blocks[n], ".m529-w");
      const inDur = 0.45 + 0.026 * wordsN.length;
      const CY = 0.3 + inDur + 0.22;
      // portraits: the front card goes back (rotate, scale down), the next one rises upright on top
      tl.to(pics[c], { rotation: M529_ROT[c], scale: 0.92, duration: 0.6, ease: "power2.inOut" }, at);
      tl.to(pics[n], { y: -70, duration: 0.3, ease: "power2.out" }, at);
      tl.to(pics[n], { y: 0, duration: 0.35, ease: "power2.inOut" }, at + 0.3);
      tl.to(pics[n], { rotation: 0, scale: 1, duration: 0.6, ease: "power2.inOut" }, at);
      pics.forEach((p, i) => tl.set(p, { zIndex: z(i, n) }, at + 0.3));
      // quote: out quickly, then the next one word by word from blur
      tl.to(wordsC, { opacity: 0, filter: "blur(6px)", y: -6, duration: 0.25, stagger: 0.004, ease: "power1.in" }, at);
      tl.set(blocks[c], { autoAlpha: 0 }, at + 0.3);
      tl.set(blocks[n], { autoAlpha: 1 }, at + 0.3);
      tl.fromTo(wordsN, { opacity: 0, filter: "blur(8px)", y: 10 }, { opacity: 1, filter: "blur(0px)", y: 0, duration: 0.45, stagger: 0.026, ease: "power2.out", immediateRender: false }, at + 0.3);
      if (bar) tl.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: CY, ease: "none", immediateRender: false }, at);
      at += CY;
    }
    tl.to({}, { duration: 0.01 }, at - 0.01);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(79,141,255,.45)" g2="rgba(255,150,110,.24)">
      <div className="absolute inset-0 grid grid-cols-[42%_1fr] items-center gap-[4%] px-[7%]">
        <div className="relative mx-auto h-[360px] w-[300px]">
          {M529_ITEMS.map((it, i) => (
            <div
              key={it.n}
              className="m529-pic absolute inset-0 overflow-hidden rounded-[24px] border border-white/15 shadow-[0_26px_56px_rgba(0,0,0,.55)]"
              style={{ transform: `rotate(${i === 0 ? 0 : M529_ROT[i]}deg) scale(${i === 0 ? 1 : 0.94})`, zIndex: 10 + M529_N - i }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={portrait(i)} alt="" className="h-full w-full object-cover" draggable={false} />
            </div>
          ))}
        </div>
        <div>
          <p className="mb-5 text-[13px] uppercase tracking-[0.24em] text-white/55">What clients say</p>
          <div className="relative min-h-[230px]">
            {M529_ITEMS.map((it, i) => {
              const words = `“${it.q}”`.split(" ");
              return (
                <div key={it.n} className={`m529-q ${i === 0 ? "relative" : "absolute inset-x-0 top-0"}`} style={i === 0 ? undefined : { visibility: "hidden" }}>
                  <p className="text-[clamp(24px,2.3vw,34px)] leading-[1.25]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
                    {words.map((w, k) => (
                      <span key={k} className={`m529-w inline-block ${k < words.length - 1 ? "mr-[0.28em]" : ""}`}>
                        {w}
                      </span>
                    ))}
                  </p>
                  <p className="m529-w mt-6 text-[18px] font-[600]" style={{ fontFamily: F.sg }}>
                    {it.n}
                  </p>
                  <p className="m529-w mt-1 text-[13px] uppercase tracking-[0.16em] text-white/55">{it.r}</p>
                </div>
              );
            })}
          </div>
          <span className="relative mt-8 block h-[2px] w-[160px] bg-white/15">
            <span className="m529-bar absolute inset-0 origin-left bg-white/80" />
          </span>
        </div>
      </div>
      <Sheen g1="rgba(120,170,255,.5)" />
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  {
    code: "M518",
    name: "Ellipse halo reel",
    how: "Cards on a flat ellipse: one angle sets each card's x, scale and z-order together (cos θ), so the reel turns as a halo with the front card largest. Auto-rotates; drag nudges.",
    kind: "play",
    C: M518,
  },
  {
    code: "M519",
    name: "Images orbit along a path",
    how: "Images travel a tilted, wobbly SVG orbit (MotionPath) around a centre product, scaling and dimming by their depth and passing behind it; loops slowly.",
    kind: "play",
    C: M519,
  },
  {
    code: "M520",
    name: "Gallery formation morphs",
    how: "The same eight cards morph between formations (flat grid → tilted plane → ring → stacked deck) with 3D transforms, 1.2 s per change, auto-cycling.",
    kind: "play",
    C: M520,
  },
  {
    code: "M521",
    name: "Arc fan carousel",
    how: "Cards sit on an arc around a low pivot; hover fans them wider apart, prev/next rotates the whole arc one step with eased rotation (fake pointer plays it).",
    kind: "play",
    C: M521,
  },
  {
    code: "M522",
    name: "Arch fan with card lift",
    how: "Photos fan into an arch with the centre card forward; hovering a card lifts and scales it out of the arch. A fake pointer lifts cards in turn.",
    kind: "play",
    C: M522,
  },
  {
    code: "M523",
    name: "Fan spreads on hover",
    how: "A tight fanned stack spreads far apart and scales up on hover, collapsing back on leave (~0.5 s); a fake pointer hovers it in a loop.",
    kind: "play",
    C: M523,
  },
  {
    code: "M524",
    name: "Cards fan to uncover headline",
    how: "Stacked cards cover a headline; on hover (or auto) they fan out to the corners and uncover it while the headline's gradient slides with them.",
    kind: "play",
    C: M524,
  },
  {
    code: "M525",
    name: "Deck cycle (front tucks behind)",
    how: "A fanned deck: on a timer the front card lifts off and tucks behind the deck while the rest step forward one place, looping.",
    kind: "play",
    C: M525,
  },
  {
    code: "M526",
    name: "Card drop-and-return cycle",
    how: "Cards stacked in 3D offset: the front card drops out of frame, then rises back in at the rear while the others step forward.",
    kind: "play",
    C: M526,
  },
  {
    code: "M527",
    name: "Flick-to-back photo stack",
    how: "The top photo is flicked off sideways with rotation (alternating sides), then slides back under the deck, revealing the next. Auto-flicks.",
    kind: "play",
    C: M527,
  },
  {
    code: "M528",
    name: "Card falls away deck",
    how: "The top card falls away (drops, tips, blurs out) to reveal the next; the stack steps forward and refills from the back. Auto-cycles.",
    kind: "play",
    C: M528,
  },
  {
    code: "M529",
    name: "Testimonial photo stack swap",
    how: "Tilted portrait stack: the front card rotates back down and the next rises upright on top, while the quote re-enters word by word from blur.",
    kind: "play",
    C: M529,
  },
];
