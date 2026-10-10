"use client";

// Image motions, batch 2 · group 3 (MOTION-MENU M160–M170). Small focused demos for /lab/motion.
// Every demo plays by itself while on screen (a scripted pointer stands in for hover; the real mouse takes over when it
// moves), loops, pauses off screen, and has a CSS-only glow loop that never stops. ?static=1 / reduced motion: no JS
// motion, the markup shows a sensible final state.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, loadPlugin, prefersReducedMotion } from "@/lib/gsap";
import { createShader, type GLHandle } from "@/lib/gl";
import { scene, toCanvas, useTicker } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = {
  sg: "Space Grotesk Variable",
  fr: "Fraunces Variable",
  is: "Instrument Serif",
  sy: "Syne Variable",
  mr: "Manrope Variable",
};

const CSS = `
.b2g3i-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.42)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.2)),transparent 70%);animation:b2g3i-drift 5.8s linear infinite alternate;will-change:transform}
@keyframes b2g3i-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b2g3i-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4);pointer-events:none;z-index:40;opacity:0;transition:opacity .25s}
.m163-a,.m163-b{position:absolute;inset:0;transition-duration:.6s;transition-timing-function:cubic-bezier(.65,0,.35,1)}
.m163-a{transition-property:clip-path;filter:grayscale(.75) brightness(.72)}
.m163-b{transition-property:filter;filter:brightness(4) hue-rotate(70deg) saturate(1.6)}
.m163-t.on .m163-b,.m163-t:hover .m163-b{filter:none}
.m163-left .m163-a{clip-path:inset(0% 0% 0% 0%)}.m163-left.on .m163-a,.m163-left:hover .m163-a{clip-path:inset(0% 0% 0% 100%)}
.m163-right .m163-a{clip-path:inset(0% 0% 0% 0%)}.m163-right.on .m163-a,.m163-right:hover .m163-a{clip-path:inset(0% 100% 0% 0%)}
.m163-up .m163-a{clip-path:inset(0% 0% 0% 0%)}.m163-up.on .m163-a,.m163-up:hover .m163-a{clip-path:inset(0% 0% 100% 0%)}
.m163-down .m163-a{clip-path:inset(0% 0% 0% 0%)}.m163-down.on .m163-a,.m163-down:hover .m163-a{clip-path:inset(100% 0% 0% 0%)}
.m163-diag .m163-a{clip-path:polygon(0% 0%,200% 0%,0% 200%)}.m163-diag.on .m163-a,.m163-diag:hover .m163-a{clip-path:polygon(0% 0%,0% 0%,0% 0%)}
.m163-circle .m163-a{clip-path:circle(75% at 50% 50%);transition-timing-function:cubic-bezier(.34,1.56,.64,1)}.m163-circle.on .m163-a,.m163-circle:hover .m163-a{clip-path:circle(0% at 50% 50%)}
.m163-quarter .m163-a{clip-path:circle(150% at 0% 100%);transition-timing-function:steps(6,end)}.m163-quarter.on .m163-a,.m163-quarter:hover .m163-a{clip-path:circle(0% at 0% 100%)}
.m164-blur{-webkit-mask-image:radial-gradient(circle var(--r,130px) at var(--x,60%) var(--y,45%),transparent 0%,transparent 62%,#000 100%);mask-image:radial-gradient(circle var(--r,130px) at var(--x,60%) var(--y,45%),transparent 0%,transparent 62%,#000 100%)}
html.is-static .b2g3i-glow{animation:none}
html.is-static .m163-a{clip-path:inset(0% 0% 0% 100%)!important;transition:none}
html.is-static .m163-b{filter:none;transition:none}
html.is-static {
  .b2g3i-glow{animation:none}
  .m163-a{clip-path:inset(0% 0% 0% 100%)!important;transition:none}
  .m163-b{filter:none;transition:none}
}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0d16] text-[#eef2ff] ${className}`}>
      <style href="b2g3i-css" precedence="default">
        {CSS}
      </style>
      <div className="b2g3i-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/** The CSS glow loop again, ON TOP of a full-bleed photo/canvas (screen blend), so big image demos never freeze. */
const Sheen = ({ g1 }: { g1?: string }) => (
  <div
    className="b2g3i-glow"
    style={
      {
        "--g1": g1,
        "--g2": "transparent",
        mixBlendMode: "screen",
        opacity: 0.45,
        zIndex: 35,
      } as CSSProperties
    }
    aria-hidden
  />
);

/** The visible fake pointer (a ring) that drives hover demos while nobody touches the mouse. */
const Dot = ({ r }: { r: RefObject<HTMLDivElement | null> }) => <div ref={r} className="b2g3i-dot" aria-hidden />;

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

type Pt = { x: number; y: number; inside: boolean };
type PtFrame = Pt & { vx: number; vy: number; real: boolean };

/**
 * Pointer driver for hover demos: every frame (while on screen) gives a pointer position in root px. The real mouse
 * wins for 2.5 s after it last moved; otherwise `script(t, root)` drives a visible fake ring along a set path.
 */
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
      real.current = {
        x: e.clientX - r.left,
        y: e.clientY - r.top,
        inside: true,
        at: performance.now(),
      };
    };
    const leave = () =>
      (real.current = {
        ...real.current,
        inside: false,
        at: performance.now(),
      });
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

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, className = "", style, label = "", w = 1200, h = 900 }: { i: number; className?: string; style?: CSSProperties; label?: string; w?: number; h?: number }) => (
  <img src={scene(i, w, h, label)} alt="" className={`h-full w-full object-cover ${className}`} style={style} draggable={false} />
);

/* ───────────────────────── M160 · List hover: photo follows cursor ───────────────────────── */
const M160_ROWS = [
  { n: "Harbour Overshirt", c: "Washed linen · Sand", p: "₹ 4,800" },
  { n: "Quarry Field Jacket", c: "Waxed cotton · Olive", p: "₹ 9,400" },
  { n: "Lantern Knit", c: "Merino · Rust", p: "₹ 6,200" },
  { n: "Tidewater Trouser", c: "Twill · Ink", p: "₹ 5,100" },
  { n: "Cinder Chore Coat", c: "Moleskin · Charcoal", p: "₹ 8,700" },
];
function M160() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const st = useRef({
    active: -1,
    z: 10,
    qx: null as null | ((v: number) => void),
    qy: null as null | ((v: number) => void),
    qr: null as null | ((v: number) => void),
  });
  useEffect(() => {
    const f = frame.current;
    if (!f || prefersReducedMotion()) return;
    gsap.set(f, { left: 0, top: 0, xPercent: -50, yPercent: -50, scale: 0 });
    st.current.qx = gsap.quickTo(f, "x", { duration: 0.5, ease: "power3" });
    st.current.qy = gsap.quickTo(f, "y", { duration: 0.5, ease: "power3" });
    st.current.qr = gsap.quickTo(f, "rotation", {
      duration: 0.6,
      ease: "power3",
    });
    return () => {
      gsap.killTweensOf(f);
      gsap.set(f, { clearProps: "all" });
      st.current.active = -1;
    };
  }, []);
  usePointer(
    root,
    dot,
    (t, el) => {
      const rows = [...el.querySelectorAll(".m160-row")];
      const pts: [number, number][] = rows.map((r) => {
        const b = rel(r, el);
        return [b.l + b.w * 0.4, b.t + b.h / 2];
      });
      const lb = rel(rows[rows.length - 1], el);
      pts.push([lb.l + lb.w * 0.5, lb.t + lb.h * 2.1]); // a short step off the list: the photo closes
      const [x, y] = stepPath(t, pts, 0.85, 0.4);
      return { x: x + Math.sin(t * 2.3) * lb.w * 0.16, y, inside: true };
    },
    (p, _dt, el) => {
      const s = st.current;
      const f = frame.current;
      if (!f || !s.qx || !s.qy || !s.qr) return;
      const rows = [...el.querySelectorAll(".m160-row")];
      const idx = p.inside ? hit(rows, el, p.x, p.y) : -1;
      s.qx(p.x + 170);
      s.qy(p.y - 10);
      s.qr(gsap.utils.clamp(-9, 9, p.vx * 0.012));
      if (idx === s.active) return;
      const prev = s.active;
      s.active = idx;
      rows.forEach((r, i) =>
        gsap.to(r, {
          opacity: idx === -1 || i === idx ? 1 : 0.32,
          duration: 0.3,
          overwrite: "auto",
        }),
      );
      if (idx === -1) {
        gsap.to(f, {
          scale: 0,
          duration: 0.3,
          ease: "power2.in",
          overwrite: "auto",
        });
        return;
      }
      if (prev === -1)
        gsap.to(f, {
          scale: 1,
          duration: 0.35,
          ease: "power3.out",
          overwrite: "auto",
        });
      const img = f.querySelectorAll<HTMLElement>(".m160-img")[idx];
      s.z += 1;
      img.style.zIndex = String(s.z);
      gsap.fromTo(
        img,
        { clipPath: "inset(100% 0% 0% 0%)", scale: 1.2 },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          scale: 1,
          duration: 0.25,
          ease: "power2.out",
          overwrite: "auto",
        },
      );
    },
  );
  return (
    <Stage r={root} g1="rgba(255,170,90,.32)" g2="rgba(79,141,255,.22)">
      <div className="absolute left-[6%] top-[9%] flex w-[88%] items-end justify-between">
        <h3 className="text-[clamp(34px,3.6vw,56px)] leading-none" style={{ fontFamily: F.fr, fontWeight: 500 }}>
          The autumn rail
        </h3>
        <p className="text-[13px] uppercase tracking-[0.2em] text-white/55">Northpier Supply · 05 pieces</p>
      </div>
      <div className="absolute left-[6%] top-[26%] w-[88%] border-t border-white/15">
        {M160_ROWS.map((r, i) => (
          <div key={r.n} className="m160-row grid grid-cols-[60px_1fr_1fr_auto] items-center border-b border-white/15 py-[clamp(10px,1.6vh,18px)]">
            <span className="text-[13px] tabular-nums text-white/45">0{i + 1}</span>
            <span className="text-[clamp(22px,2.3vw,36px)] font-[500] tracking-[-0.01em]" style={{ fontFamily: F.sg }}>
              {r.n}
            </span>
            <span className="text-[15px] text-white/55">{r.c}</span>
            <span className="text-[17px] tabular-nums" style={{ fontFamily: F.sg }}>
              {r.p}
            </span>
          </div>
        ))}
      </div>
      {/* the floating photo (static: shown beside row 2) */}
      <div ref={frame} className="pointer-events-none absolute z-20 h-[250px] w-[200px] overflow-hidden rounded-[10px] shadow-[0_24px_60px_rgba(0,0,0,.55)]" style={{ left: "52%", top: "34%" }}>
        {M160_ROWS.map((r, i) => (
          <div
            key={r.n}
            className="m160-img absolute inset-0 will-change-transform"
            style={{
              clipPath: i === 1 ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)",
              zIndex: i === 1 ? 2 : 1,
            }}
          >
            <Img i={i} w={500} h={640} />
          </div>
        ))}
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M161 · List hover: full-screen photo behind ───────────────────────── */
const M161_ITEMS = ["Rooftop Suites", "Garden Villas", "The Spa House", "Tasting Room", "Library Bar"];
function M161() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const st = useRef({ active: -1, z: 5, ready: false });
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const layers = el.querySelectorAll<HTMLElement>(".m161-bg");
    gsap.set(layers, { clipPath: "inset(50% 0% 50% 0%)" });
    st.current.ready = true;
    return () => {
      gsap.killTweensOf(layers);
      gsap.set(layers, { clearProps: "clipPath,zIndex" });
      st.current = { active: -1, z: 5, ready: false };
    };
  }, []);
  usePointer(
    root,
    dot,
    (t, el) => {
      const items = [...el.querySelectorAll(".m161-item")];
      const pts: [number, number][] = items.map((r) => {
        const b = rel(r, el);
        return [b.l + b.w * 0.55, b.t + b.h / 2];
      });
      const lb = rel(items[items.length - 1], el);
      pts.push([lb.l + lb.w * 1.25, lb.t + lb.h * 1.6]); // leave the list: the photo closes
      const [x, y] = stepPath(t, pts, 0.9, 0.35);
      return { x: x + Math.sin(t * 1.9) * 40, y, inside: true };
    },
    (p, _dt, el) => {
      const s = st.current;
      if (!s.ready) return;
      const items = [...el.querySelectorAll(".m161-item")];
      const idx = p.inside ? hit(items, el, p.x, p.y) : -1;
      if (idx === s.active) return;
      const prev = s.active;
      s.active = idx;
      const layers = el.querySelectorAll<HTMLElement>(".m161-bg");
      items.forEach((it, i) =>
        gsap.to(it, {
          opacity: idx === -1 || i === idx ? 1 : 0.28,
          x: i === idx ? 18 : 0,
          duration: 0.45,
          ease: "power3.out",
          overwrite: "auto",
        }),
      );
      if (idx === -1) {
        if (prev >= 0)
          gsap.to(layers[prev], {
            clipPath: "inset(50% 0% 50% 0%)",
            duration: 0.5,
            ease: "power3.inOut",
            overwrite: "auto",
          });
        return;
      }
      const L = layers[idx];
      s.z += 1;
      L.style.zIndex = String(s.z);
      gsap.fromTo(
        L,
        { clipPath: "inset(50% 0% 50% 0%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 0.6,
          ease: "power3.out",
          overwrite: "auto",
        },
      );
      gsap.fromTo(L.firstElementChild, { scale: 1.12 }, { scale: 1, duration: 0.9, ease: "power3.out", overwrite: "auto" });
      if (prev >= 0)
        gsap.set(layers[prev], {
          clipPath: "inset(50% 0% 50% 0%)",
          delay: 0.6,
        });
    },
  );
  return (
    <Stage r={root} g1="rgba(224,145,63,.4)" g2="rgba(255,77,109,.18)">
      <div className="absolute inset-0 isolate">
        {M161_ITEMS.map((n, i) => (
          <div
            key={n}
            className="m161-bg absolute inset-0 overflow-hidden"
            style={{
              clipPath: i === 0 ? "inset(0% 0% 0% 0%)" : "inset(50% 0% 50% 0%)",
              zIndex: i === 0 ? 2 : 1,
            }}
          >
            <div className="absolute inset-0 will-change-transform">
              <Img i={i + 3} w={1600} h={1000} />
            </div>
            <div className="absolute inset-0 bg-black/45" />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 z-[30] flex flex-col justify-center pl-[8%]">
        <p className="mb-5 text-[13px] uppercase tracking-[0.24em] text-white/70">Casa Meraki · Stay</p>
        {M161_ITEMS.map((n) => (
          <p key={n} className="m161-item w-fit cursor-default text-[clamp(40px,5vw,78px)] leading-[1.08] text-[#fff8ee] drop-shadow-[0_4px_24px_rgba(0,0,0,.45)]" style={{ fontFamily: F.is }}>
            {n}
          </p>
        ))}
        <p className="mt-6 text-[15px] text-white/75">Nights from ₹ 18,500 · breakfast in the courtyard</p>
      </div>
      <Sheen g1="rgba(255,190,120,.5)" />
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M162 · Row hover: photo opens in side column ───────────────────────── */
const M162_ROWS = [
  { n: "Tamarind Bowl", m: "Stoneware · 18 cm", p: "₹ 1,450" },
  { n: "Monsoon Vase", m: "Hand-thrown · 32 cm", p: "₹ 3,900" },
  { n: "Ember Platter", m: "Wood-fired · 40 cm", p: "₹ 4,600" },
  { n: "Salt Cup Set", m: "Porcelain · set of 4", p: "₹ 2,200" },
];
function M162() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const st = useRef({ active: -1, z: 5, ready: false });
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const imgs = el.querySelectorAll<HTMLElement>(".m162-clip");
    gsap.set(imgs, { clipPath: "inset(100% 0% 0% 0%)" });
    st.current.ready = true;
    return () => {
      gsap.killTweensOf(imgs);
      gsap.set(imgs, { clearProps: "clipPath,zIndex" });
      st.current = { active: -1, z: 5, ready: false };
    };
  }, []);
  usePointer(
    root,
    dot,
    (t, el) => {
      const rows = [...el.querySelectorAll(".m162-row")];
      const pts: [number, number][] = rows.map((r) => {
        const b = rel(r, el);
        return [b.l + b.w * 0.35, b.t + b.h / 2];
      });
      const lb = rel(rows[rows.length - 1], el);
      pts.push([lb.l + lb.w * 0.35, lb.t + lb.h * 2]);
      const [x, y] = stepPath(t, pts, 1.0, 0.3);
      return { x: x + Math.sin(t * 2) * 60, y, inside: true };
    },
    (p, _dt, el) => {
      const s = st.current;
      if (!s.ready) return;
      const rows = [...el.querySelectorAll(".m162-row")];
      const idx = p.inside ? hit(rows, el, p.x, p.y) : -1;
      if (idx === s.active) return;
      const prev = s.active;
      s.active = idx;
      const clips = el.querySelectorAll<HTMLElement>(".m162-clip");
      rows.forEach((r, i) => r.classList.toggle("text-[#ffd9b8]", i === idx));
      if (num.current) num.current.textContent = idx >= 0 ? `0${idx + 1}` : "—";
      if (prev >= 0)
        gsap.to(clips[prev], {
          clipPath: "inset(0% 0% 100% 0%)",
          duration: 0.5,
          ease: "power3.inOut",
          overwrite: "auto",
        });
      if (idx === -1) return;
      const c = clips[idx];
      s.z += 1;
      c.style.zIndex = String(s.z);
      gsap.fromTo(
        c,
        { clipPath: "inset(100% 0% 0% 0%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 0.7,
          ease: "expo.out",
          overwrite: "auto",
        },
      );
      gsap.fromTo(c.firstElementChild, { scale: 1.2 }, { scale: 1, duration: 0.9, ease: "expo.out", overwrite: "auto" });
    },
  );
  return (
    <Stage r={root} g1="rgba(232,116,59,.34)" g2="rgba(24,196,143,.16)">
      <div className="absolute left-[5%] top-[10%] w-[52%]">
        <p className="text-[13px] uppercase tracking-[0.22em] text-white/55">Kumhar Studio · Current kiln</p>
        <h3 className="mt-3 text-[clamp(36px,3.8vw,60px)] font-[700] leading-[0.95] tracking-[-0.03em]" style={{ fontFamily: F.sy }}>
          Fired this week
        </h3>
        <div className="mt-[clamp(18px,4vh,40px)] border-t border-white/15">
          {M162_ROWS.map((r) => (
            <div key={r.n} className="m162-row flex items-baseline justify-between border-b border-white/15 py-[clamp(12px,2vh,20px)] transition-colors duration-300">
              <span className="text-[clamp(22px,2.2vw,34px)] font-[500]" style={{ fontFamily: F.sg }}>
                {r.n}
              </span>
              <span className="text-[14px] text-white/55">{r.m}</span>
              <span className="text-[17px] tabular-nums">{r.p}</span>
            </div>
          ))}
        </div>
      </div>
      {/* the fixed side column */}
      <div className="absolute bottom-[9%] right-[5%] top-[9%] w-[32%] overflow-hidden rounded-[18px] bg-white/[0.04] ring-1 ring-white/10">
        <div className="absolute inset-0 isolate">
          {M162_ROWS.map((r, i) => (
            <div
              key={r.n}
              className="m162-clip absolute inset-0 overflow-hidden"
              style={{
                clipPath: i === 0 ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)",
                zIndex: i === 0 ? 2 : 1,
              }}
            >
              <div className="absolute inset-0 will-change-transform">
                <Img i={i + 1} w={700} h={900} />
              </div>
            </div>
          ))}
        </div>
        <p className="absolute left-4 top-4 z-[60] text-[14px] tabular-nums text-white/85" style={{ fontFamily: F.sg }}>
          <span ref={num}>01</span> / 04
        </p>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M163 · Double-image hover wipe + filter settle ───────────────────────── */
const M163_TILES = [
  { d: "left", l: "Left" },
  { d: "right", l: "Right" },
  { d: "up", l: "Bottom-up" },
  { d: "down", l: "Top-down" },
  { d: "diag", l: "Diagonal" },
  { d: "circle", l: "Circle · soft" },
  { d: "quarter", l: "Quarter · steps" },
];
function M163() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const active = useRef(-2);
  usePointer(
    root,
    dot,
    (t, el) => {
      const tiles = [...el.querySelectorAll(".m163-t")];
      const pts: [number, number][] = tiles.map((n) => {
        const b = rel(n, el);
        return [b.l + b.w / 2, b.t + b.h * 0.5];
      });
      const lb = rel(tiles[tiles.length - 1], el);
      pts.push([lb.l + lb.w / 2, lb.t + lb.h * 1.18]); // drop below the row, then back to the first tile
      const [x, y] = stepPath(t, pts, 0.78, 0.38);
      return { x, y: y + Math.sin(t * 3.1) * 30, inside: true };
    },
    (p, _dt, el) => {
      const tiles = [...el.querySelectorAll(".m163-t")];
      const idx = p.inside ? hit(tiles, el, p.x, p.y) : -1;
      if (idx === active.current) return;
      active.current = idx;
      tiles.forEach((n, i) => n.classList.toggle("on", i === idx));
    },
  );
  return (
    <Stage r={root} g1="rgba(255,77,109,.3)" g2="rgba(79,141,255,.26)">
      <Sheen g1="rgba(255,77,109,.55)" />
      <div className="absolute left-[4%] top-[8%] flex w-[92%] items-end justify-between">
        <h3 className="text-[clamp(32px,3.4vw,54px)] leading-none" style={{ fontFamily: F.fr, fontWeight: 500 }}>
          Print room, spring run
        </h3>
        <p className="text-[14px] text-white/60">Giclée prints · from ₹ 2,400</p>
      </div>
      <div className="absolute bottom-[10%] left-[4%] top-[24%] grid w-[92%] grid-cols-7 gap-3">
        {M163_TILES.map((tl, i) => (
          <div key={tl.d} className="flex h-full flex-col">
            <div className={`m163-t m163-${tl.d} relative flex-1 overflow-hidden rounded-[12px]`}>
              <div className="m163-b">
                <Img i={i} w={360} h={560} />
              </div>
              <div className="m163-a">
                <Img i={i} w={360} h={560} />
              </div>
            </div>
            <p className="mt-2 text-[13px] text-white/65" style={{ fontFamily: F.sg }}>
              {tl.l}
            </p>
          </div>
        ))}
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M164 · Cursor clear-circle through blur ───────────────────────── */
const M164_SPOTS = [
  { x: 0.3, y: 0.38, l: "Hand-stitched welt" },
  { x: 0.62, y: 0.3, l: "Vegetable-tan leather" },
  { x: 0.74, y: 0.7, l: "Solid brass eyelets" },
];
/** The "photo": a placeholder scene with fine type + stitch lines, so the blur clearly hides detail. */
function M164Art() {
  return (
    <div className="absolute inset-0">
      <Img i={3} w={1600} h={1000} />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: "repeating-linear-gradient(115deg, rgba(255,240,220,.5) 0 1px, transparent 1px 14px)",
        }}
      />
      <p className="absolute left-[6%] top-[52%] text-[clamp(64px,9vw,140px)] font-[800] leading-none tracking-[-0.04em] text-[#fff1dc]" style={{ fontFamily: F.sy }}>
        DERBY 09
      </p>
      <p className="absolute left-[6.4%] top-[78%] max-w-[46ch] text-[14px] leading-snug text-[#ffe9cc]/85">
        Goodyear-welted, 270 stitches per shoe, last shaped over six weeks in the Agra workshop. Resoleable for life.
      </p>
      {M164_SPOTS.map((s) => (
        <span key={s.l} className="absolute h-3 w-3 -ml-1.5 -mt-1.5 rounded-full bg-[#ffd59a] shadow-[0_0_0_6px_rgba(255,213,154,.25)]" style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%` }} />
      ))}
    </div>
  );
}
function M164() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const blur = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLParagraphElement>(null);
  const lens = useRef({ x: -1, y: -1, r: 120, spot: -1 });
  usePointer(
    root,
    dot,
    (t, el) => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const pts: [number, number][] = M164_SPOTS.map((s) => [s.x * w, s.y * h]);
      pts.splice(1, 0, [0.46 * w, 0.62 * h]);
      const [x, y] = stepPath(t, pts, 1.0, 0.55);
      return {
        x: x + Math.sin(t * 2.2) * 26,
        y: y + Math.cos(t * 1.7) * 18,
        inside: true,
      };
    },
    (p, dt, el) => {
      const L = lens.current;
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (L.x < 0) {
        L.x = p.x;
        L.y = p.y;
      }
      const k = 1 - Math.exp(-dt * 7); // lag
      L.x += (p.x - L.x) * k;
      L.y += (p.y - L.y) * k;
      const near = M164_SPOTS.findIndex((s) => Math.hypot(s.x * w - L.x, s.y * h - L.y) < 90);
      const target = !p.inside ? 0 : near >= 0 ? 200 : 120;
      L.r += (target - L.r) * (1 - Math.exp(-dt * 5));
      const b = blur.current;
      if (b) {
        b.style.setProperty("--x", `${L.x.toFixed(1)}px`);
        b.style.setProperty("--y", `${L.y.toFixed(1)}px`);
        b.style.setProperty("--r", `${L.r.toFixed(1)}px`);
      }
      if (near !== L.spot && label.current) {
        L.spot = near;
        label.current.textContent = near >= 0 ? M164_SPOTS[near].l : "Move to look closer";
        gsap.fromTo(label.current, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, overwrite: "auto" });
      }
    },
  );
  return (
    <Stage r={root} g1="rgba(224,145,63,.38)">
      <div className="absolute inset-[4%] overflow-hidden rounded-[20px]">
        <M164Art />
        <div ref={blur} className="m164-blur absolute inset-0" style={{ "--x": "62%", "--y": "30%", "--r": "190px" } as CSSProperties}>
          <div className="absolute inset-0 scale-[1.06]" style={{ filter: "blur(14px) brightness(.5) saturate(.8)" }}>
            <M164Art />
          </div>
        </div>
        <p className="absolute right-[4%] top-[6%] text-[13px] uppercase tracking-[0.2em] text-[#ffd59a]/80">Mochi &amp; Sons · ₹ 14,900</p>
        <p ref={label} className="absolute bottom-[6%] right-[4%] text-[clamp(20px,1.8vw,28px)] text-[#fff1dc]" style={{ fontFamily: F.is }}>
          Vegetable-tan leather
        </p>
      </div>
      <Sheen g1="rgba(255,190,120,.45)" />
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M165 · Magnifier loupe ───────────────────────── */
const M165_SRC = scene(2, 1000, 1000, "LOT 04 · 18K");
const M165_LENS = 150;
const M165_ZOOM = 2;
function M165() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const lensEl = useRef<HTMLDivElement>(null);
  const lens = useRef({ x: -1, y: -1, o: 0 });
  usePointer(
    root,
    dot,
    (t, el) => {
      const b = rel(box.current!, el);
      const pts: [number, number][] = [
        [0.3, 0.3],
        [0.62, 0.42],
        [0.45, 0.72],
        [0.22, 0.88],
        [1.25, 0.6], // glide off the photo: the loupe fades out
      ].map(([u, v]) => [b.l + u * b.w, b.t + v * b.h]);
      const [x, y] = stepPath(t, pts, 0.8, 0.5);
      return { x, y, inside: true };
    },
    (p, dt, el) => {
      const bx = box.current;
      const le = lensEl.current;
      if (!bx || !le) return;
      const b = rel(bx, el);
      const lx = p.x - b.l;
      const ly = p.y - b.t;
      const over = p.inside && lx >= 0 && ly >= 0 && lx <= b.w && ly <= b.h;
      const L = lens.current;
      if (L.x < 0) {
        L.x = lx;
        L.y = ly;
      }
      const k = 1 - Math.exp(-dt * 14);
      L.x += (lx - L.x) * k;
      L.y += (ly - L.y) * k;
      L.o += ((over ? 1 : 0) - L.o) * (1 - Math.exp(-dt * 12));
      const half = M165_LENS / 2;
      le.style.transform = `translate3d(${(L.x - half).toFixed(1)}px,${(L.y - half).toFixed(1)}px,0) scale(${(0.85 + 0.15 * L.o).toFixed(3)})`;
      le.style.opacity = L.o.toFixed(3);
      le.style.backgroundSize = `${b.w * M165_ZOOM}px ${b.h * M165_ZOOM}px`;
      le.style.backgroundPosition = `${(-(L.x * M165_ZOOM - half)).toFixed(1)}px ${(-(L.y * M165_ZOOM - half)).toFixed(1)}px`;
    },
  );
  return (
    <Stage r={root} g1="rgba(24,196,143,.34)" g2="rgba(200,255,138,.14)">
      <div className="absolute inset-0 flex items-center gap-[6%] px-[7%]">
        <div ref={box} className="relative aspect-square h-[82%] shrink-0 rounded-[18px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={M165_SRC} alt="" className="absolute inset-0 h-full w-full rounded-[18px] object-cover" draggable={false} />
          {/* the loupe (static: hidden; it only exists while hovered) */}
          <div
            ref={lensEl}
            className="pointer-events-none absolute left-0 top-0 rounded-full shadow-[0_18px_40px_rgba(0,0,0,.5),inset_0_0_0_2px_rgba(255,255,255,.75),inset_0_0_24px_rgba(0,0,0,.35)]"
            style={{
              width: M165_LENS,
              height: M165_LENS,
              opacity: 0,
              backgroundImage: `url("${M165_SRC}")`,
              backgroundRepeat: "no-repeat",
            }}
          />
        </div>
        <div className="max-w-[40ch]">
          <p className="text-[13px] uppercase tracking-[0.22em] text-[#c8ff8a]/75">Verdant Jewellers · Lot 04</p>
          <h3 className="mt-3 text-[clamp(38px,4vw,64px)] leading-[0.95]" style={{ fontFamily: F.fr, fontWeight: 500 }}>
            Look closer at the setting
          </h3>
          <p className="mt-4 text-[16px] leading-relaxed text-white/65">Hand-set emerald in 18K gold, every claw polished under a 10× loupe before it leaves the bench.</p>
          <p className="mt-6 text-[22px] tabular-nums" style={{ fontFamily: F.sg }}>
            ₹ 1,26,000
          </p>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M166 · Glass lens refraction (WebGL) ───────────────────────── */
const M166_FRAG = /* glsl */ `
uniform vec2 uMouse;
uniform float uRad;
void main() {
  vec2 px = vUv * uRes;
  vec2 m = uMouse * uRes;
  float R = uRad * uRes.y;
  vec2 d = (px - m) / R;
  float r = length(d);
  vec3 outside = texture2D(uTex0, cover(vUv, uTexRes0)).rgb;
  // soft drop shadow just outside the glass
  outside *= 1.0 - 0.32 * smoothstep(1.35, 1.0, r) * step(1.0, r);
  vec3 col = outside;
  if (r < 1.02) {
    float rr = min(r, 1.0);
    float z = sqrt(max(0.0, 1.0 - rr * rr));
    vec2 base = (m + (px - m) / 1.8) / uRes;          // 1.8x magnification around the lens centre
    vec2 refr = d * (1.0 - z) * 0.09;                 // sphere-normal refraction: stronger toward the rim
    float ab = smoothstep(0.55, 1.0, rr) * 0.014;     // chromatic fringe at the rim
    float cr = texture2D(uTex0, cover(base - refr - d * ab, uTexRes0)).r;
    float cg = texture2D(uTex0, cover(base - refr, uTexRes0)).g;
    float cb = texture2D(uTex0, cover(base - refr + d * ab, uTexRes0)).b;
    vec3 glass = vec3(cr, cg, cb);
    glass += pow(max(0.0, dot(normalize(vec3(-d, z)), normalize(vec3(-0.45, 0.55, 0.7)))), 24.0) * 0.55; // highlight
    glass += smoothstep(0.82, 1.0, rr) * 0.08;
    col = mix(glass, outside, smoothstep(0.97, 1.02, r));
  }
  gl_FragColor = vec4(col, 1.0);
}`;
function M166() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const target = useRef({ x: 0.55, y: 0.5 });
  const src = scene(0, 1600, 1000, "AURA ONE · 42 MM");
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let dead = false;
    let h: GLHandle | null = null;
    const cur = { x: 0.55, y: 0.5 };
    let last = 0;
    (async () => {
      const tex = await toCanvas(src, 1600, 1000);
      if (dead || !canvas.current) return;
      h = await createShader(canvas.current, M166_FRAG, {
        textures: [tex],
        uniforms: { uMouse: { value: [0.55, 0.5] }, uRad: { value: 0.2 } },
        onFrame: (u, t) => {
          const dt = Math.min(0.1, last ? t - last : 0.016);
          last = t;
          const k = 1 - Math.exp(-dt * 6); // lens eases toward the pointer
          cur.x += (target.current.x - cur.x) * k;
          cur.y += (target.current.y - cur.y) * k;
          u.uMouse.value = [cur.x, 1 - cur.y];
          u.uRad.value = 0.2 + 0.012 * Math.sin(t * 2.1);
        },
      });
      if (dead) h?.destroy();
    })();
    return () => {
      dead = true;
      h?.destroy();
    };
  }, [src]);
  usePointer(
    root,
    dot,
    (t, el) => {
      // a slow roaming loop over the product details
      const w = el.clientWidth;
      const hh = el.clientHeight;
      return {
        x: w * (0.5 + 0.22 * Math.sin(t * 0.9)),
        y: hh * (0.5 + 0.2 * Math.sin(t * 1.35 + 0.8)),
        inside: true,
      };
    },
    (p, _dt, el) => {
      target.current.x = p.x / el.clientWidth;
      target.current.y = p.y / el.clientHeight;
    },
  );
  return (
    <Stage r={root} g1="rgba(79,141,255,.4)">
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        <canvas ref={canvas} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-300" aria-hidden />
      </div>
      <div className="pointer-events-none absolute left-[5%] top-[8%]">
        <p className="text-[13px] uppercase tracking-[0.22em] text-[#9fd8ff]/80">Halden Watch Co.</p>
        <h3 className="mt-3 max-w-[12ch] text-[clamp(38px,4vw,64px)] font-[600] leading-[0.95] tracking-[-0.02em]" style={{ fontFamily: F.sg }}>
          Sapphire, both sides
        </h3>
      </div>
      <p className="pointer-events-none absolute bottom-[8%] right-[5%] text-[18px] tabular-nums text-white/80" style={{ fontFamily: F.sg }}>
        Aura One · ₹ 2,45,000
      </p>
      <Sheen g1="rgba(120,170,255,.45)" />
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M167 · Blob clip morph on hover ───────────────────────── */
const M167_A = "M300,52 C420,48 540,140 548,280 C556,420 450,548 300,548 C160,548 52,440 56,300 C60,150 170,56 300,52 Z";
const M167_B = "M290,70 C390,30 560,90 540,250 C525,370 590,480 450,540 C330,590 180,560 110,470 C40,380 60,250 120,170 C170,105 220,95 290,70 Z";
function M167() {
  const root = useRef<HTMLDivElement>(null);
  const hovered = useRef(false);
  usePlay(
    root,
    (el, onClean) => {
      const path = el.querySelector(".m167-path")!;
      const img = el.querySelector(".m167-img")!;
      const ring = el.querySelector<HTMLElement>(".m167-ring")!;
      const hov = gsap
        .timeline({
          paused: true,
          defaults: { duration: 0.8, ease: "power2.inOut" },
        })
        .to(path, { morphSVG: M167_B }, 0)
        .to(img, { scale: 1.1, svgOrigin: "300 300" }, 0);
      const toggle = () => {
        if (hovered.current) return;
        const on = hov.progress() < 0.5;
        if (on) hov.play();
        else hov.reverse();
        // the fake pointer glides onto the blob for "hover" and off it for "leave"
        gsap.to(ring, {
          left: on ? "48%" : "88%",
          top: on ? "52%" : "78%",
          opacity: 1,
          duration: 0.55,
          ease: "power2.inOut",
        });
      };
      const svg = el.querySelector("svg")!;
      const enter = () => {
        hovered.current = true;
        gsap.to(ring, { opacity: 0, duration: 0.2 });
        hov.play();
      };
      const leave = () => {
        hovered.current = false;
        hov.reverse();
      };
      svg.addEventListener("pointerenter", enter);
      svg.addEventListener("pointerleave", leave);
      onClean(() => {
        svg.removeEventListener("pointerenter", enter);
        svg.removeEventListener("pointerleave", leave);
      });
      return gsap.timeline({ repeat: -1 }).call(toggle, [], 0).to({}, { duration: 1.1 });
    },
    () => loadPlugin("MorphSVGPlugin"),
  );
  return (
    <Stage r={root} g1="rgba(255,77,109,.36)" g2="rgba(255,179,107,.22)">
      <div className="absolute inset-0 flex items-center gap-[5%] px-[7%]">
        <div className="relative aspect-square h-[88%] shrink-0">
          <svg viewBox="0 0 600 600" className="h-full w-full overflow-visible" aria-label="Rose clay balm">
            <defs>
              <clipPath id="m167-clip">
                <path className="m167-path" d={M167_A} />
              </clipPath>
            </defs>
            <g clipPath="url(#m167-clip)">
              <image className="m167-img" href={scene(1, 900, 900)} width="600" height="600" preserveAspectRatio="xMidYMid slice" />
            </g>
          </svg>
          <div className="m167-ring b2g3i-dot" style={{ left: "88%", top: "78%", margin: "-9px 0 0 -9px" }} aria-hidden />
        </div>
        <div className="max-w-[36ch]">
          <p className="text-[13px] uppercase tracking-[0.22em] text-[#ffb36b]/80">Rosebay Botanics</p>
          <h3 className="mt-3 text-[clamp(40px,4.4vw,70px)] leading-[0.95]" style={{ fontFamily: F.is }}>
            Rose clay balm, soft as it sounds
          </h3>
          <p className="mt-4 text-[16px] text-white/65">Cold-whipped shea, pink clay and damask rose. 50 g tin.</p>
          <p className="mt-6 text-[22px] tabular-nums" style={{ fontFamily: F.sg }}>
            ₹ 1,150
          </p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M168 · Blob-mask slide change ───────────────────────── */
const M168_SMALL = "M0,-90 C70,-110 120,-30 95,20 C70,80 30,105 -25,95 C-95,80 -110,10 -90,-40 C-70,-85 -35,-80 0,-90 Z";
const M168_BIG = "M10,-120 C80,-110 125,-40 110,20 C95,90 40,120 -20,110 C-90,98 -125,40 -110,-20 C-95,-85 -50,-128 10,-120 Z";
const M168_SLIDES = [
  { i: 1, t: "Monsoon Edit", s: "Rain-ready layers · from ₹ 3,200" },
  { i: 2, t: "Salt Season", s: "Coastal linen · from ₹ 2,800" },
  { i: 3, t: "Kiln Room", s: "Clay & ochre tones · from ₹ 4,100" },
];
const M168_SRC = M168_SLIDES.map((s) => scene(s.i, 1600, 900));
const M168_PTS = [
  [1180, 620],
  [420, 300],
  [1220, 260],
];
function M168() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(
    root,
    (el) => {
      const base = el.querySelector(".m168-base")!;
      const next = el.querySelector(".m168-next")!;
      const blob = el.querySelector(".m168-blob")!;
      const title = el.querySelector<HTMLElement>(".m168-title")!;
      const sub = el.querySelector<HTMLElement>(".m168-sub")!;
      const bar = el.querySelector<HTMLElement>(".m168-bar")!;
      const num = el.querySelector<HTMLElement>(".m168-num")!;
      let idx = 0;
      const pr = { s: 0 };
      const apply = () => {
        const [px, py] = M168_PTS[(idx + 1) % 3];
        const s = pr.s;
        const x = px + (800 - px) * s;
        const y = py + (450 - py) * s;
        const sc = 0.06 + s * 9;
        blob.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(-30 + 50 * s).toFixed(1)}) scale(${sc.toFixed(3)})`);
      };
      const prepare = () => {
        next.setAttribute("href", M168_SRC[(idx + 1) % 3]);
        pr.s = 0;
        apply();
      };
      const swapText = () => {
        const n = (idx + 1) % 3;
        gsap.fromTo(
          [title, sub],
          { opacity: 0, y: 26 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.08,
            ease: "power3.out",
            overwrite: "auto",
          },
        );
        title.textContent = M168_SLIDES[n].t;
        sub.textContent = M168_SLIDES[n].s;
        num.textContent = `0${n + 1}`;
      };
      const commit = () => {
        idx = (idx + 1) % 3;
        base.setAttribute("href", M168_SRC[idx]);
        pr.s = 0;
        blob.setAttribute("transform", "scale(0)");
      };
      return gsap
        .timeline({ repeat: -1 })
        .call(prepare, [], 0)
        .set(blob, { attr: { d: M168_SMALL } }, 0)
        .to(pr, { s: 1, duration: 1.2, ease: "power2.inOut", onUpdate: apply }, 0)
        .to(blob, { morphSVG: M168_BIG, duration: 1.2, ease: "power2.inOut" }, 0)
        .call(swapText, [], 0.55)
        .call(commit, [], 1.2)
        .fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 1.0, ease: "none" }, 1.2);
    },
    () => loadPlugin("MorphSVGPlugin"),
  );
  return (
    <Stage r={root} g1="rgba(24,196,143,.3)">
      <div className="absolute inset-[3%] overflow-hidden rounded-[22px]">
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
          <defs>
            <clipPath id="m168-clip">
              <path className="m168-blob" d={M168_SMALL} transform="scale(0)" />
            </clipPath>
          </defs>
          <image className="m168-base" href={M168_SRC[0]} width="1600" height="900" preserveAspectRatio="xMidYMid slice" />
          <image className="m168-next" href={M168_SRC[1]} width="1600" height="900" preserveAspectRatio="xMidYMid slice" clipPath="url(#m168-clip)" />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/10 to-transparent" />
        <div className="absolute bottom-[10%] left-[5%]">
          <p className="text-[13px] uppercase tracking-[0.22em] text-white/70">
            Field &amp; Fable · <span className="m168-num tabular-nums">01</span> / 03
          </p>
          <h3 className="m168-title mt-3 text-[clamp(48px,6vw,96px)] leading-[0.95]" style={{ fontFamily: F.fr, fontWeight: 500 }}>
            {M168_SLIDES[0].t}
          </h3>
          <p className="m168-sub mt-3 text-[16px] text-white/75">{M168_SLIDES[0].s}</p>
          <div className="mt-6 h-[2px] w-[220px] bg-white/20">
            <div className="m168-bar h-full w-full origin-left bg-white" style={{ transform: "scaleX(0.4)" }} />
          </div>
        </div>
      </div>
      <Sheen g1="rgba(120,255,200,.4)" />
    </Stage>
  );
}

/* ───────────────────────── M169 · Wave sweep slide change (WebGL) ───────────────────────── */
const M169_FRAG = /* glsl */ `
uniform float uA, uB, uDir;
vec3 pick(float i, vec2 uv) {
  if (i < 0.5) return texture2D(uTex0, cover(uv, uTexRes0)).rgb;
  if (i < 1.5) return texture2D(uTex1, cover(uv, uTexRes1)).rgb;
  return texture2D(uTex2, cover(uv, uTexRes2)).rgb;
}
void main() {
  float p = uProgress;
  float x = uDir > 0.0 ? vUv.x : 1.0 - vUv.x;      // sweep direction
  float front = mix(-0.25, 1.25, p);
  float d = x - front;
  float crest = exp(-d * d * 55.0);
  float ripple = sin(d * 46.0 - uTime * 5.0) * exp(-abs(d) * 9.0);
  vec2 drift = (vUv - 0.5) * (1.0 - 0.02 * sin(uTime * 0.6)) + 0.5;   // the picture never sits still
  vec2 off = vec2(-(crest * 0.07 + ripple * 0.012) * uDir, sin(vUv.x * 14.0 + uTime * 2.0) * crest * 0.025);
  float behind = smoothstep(0.03, -0.03, d);                          // already swept: the next picture
  vec3 a = pick(uA, drift + off);
  vec3 b = pick(uB, drift + off * 1.4 + vec2(-(1.0 - p) * 0.12 * uDir, 0.0)); // carried in behind the crest
  vec3 col = mix(a, b, behind) + crest * 0.14 + ripple * crest * 0.05;
  gl_FragColor = vec4(col, 1.0);
}`;
const M169_SLIDES = [
  { t: "Indigo Hour", s: "Dip-dyed scarves · ₹ 2,600" },
  { t: "Saffron Thread", s: "Silk stoles · ₹ 4,900" },
  { t: "Clay Weave", s: "Handloom throws · ₹ 6,300" },
];
function M169() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const sub = useRef<HTMLParagraphElement>(null);
  const arrow = useRef<HTMLSpanElement>(null);
  const st = useRef({ p: 0, a: 0, b: 1, dir: 1 });
  const srcs = [0, 1, 2].map((i) => scene(i + 1, 1600, 1000));
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let dead = false;
    let h: GLHandle | null = null;
    (async () => {
      const tex = await Promise.all(srcs.map((s) => toCanvas(s, 1600, 1000)));
      if (dead || !canvas.current) return;
      h = await createShader(canvas.current, M169_FRAG, {
        textures: tex,
        uniforms: { uA: { value: 0 }, uB: { value: 1 }, uDir: { value: 1 } },
        onFrame: (u) => {
          const s = st.current;
          u.uProgress.value = s.p;
          u.uA.value = s.a;
          u.uB.value = s.b;
          u.uDir.value = s.dir;
        },
      });
      if (dead) h?.destroy();
    })();
    return () => {
      dead = true;
      h?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  usePlay(root, () => {
    const s = st.current;
    const text = () => {
      const n = M169_SLIDES[s.b];
      if (title.current) title.current.textContent = n.t;
      if (sub.current) sub.current.textContent = n.s;
      if (arrow.current) arrow.current.textContent = s.dir > 0 ? "left → right" : "right → left";
      gsap.fromTo(
        [title.current, sub.current],
        { opacity: 0, x: -30 * s.dir },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          stagger: 0.06,
          ease: "power3.out",
          overwrite: "auto",
        },
      );
    };
    return gsap
      .timeline({
        repeat: -1,
        onRepeat: () => {
          s.a = s.b;
          s.b = (s.b + 1) % 3;
          s.dir *= -1;
        },
      })
      .fromTo(s, { p: 0 }, { p: 1, duration: 1, ease: "power2.inOut" }, 0)
      .call(text, [], 0.45)
      .to({}, { duration: 0.7 });
  });
  return (
    <Stage r={root} g1="rgba(47,140,255,.36)" g2="rgba(255,179,107,.18)">
      <div className="absolute inset-[3%] overflow-hidden rounded-[22px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={srcs[0]} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        <canvas ref={canvas} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-300" aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        <div className="pointer-events-none absolute bottom-[9%] left-[5%]">
          <p className="text-[13px] uppercase tracking-[0.22em] text-white/70">
            Neel Looms · <span ref={arrow}>left → right</span>
          </p>
          <h3 ref={title} className="mt-3 text-[clamp(48px,6vw,96px)] leading-[0.95]" style={{ fontFamily: F.is }}>
            {M169_SLIDES[0].t}
          </h3>
          <p ref={sub} className="mt-3 text-[16px] text-white/75">
            {M169_SLIDES[0].s}
          </p>
        </div>
      </div>
      <Sheen g1="rgba(120,170,255,.45)" />
    </Stage>
  );
}

/* ───────────────────────── M170 · Cloth flutter slide change (OGL plane) ───────────────────────── */
const M170_VERT = /* glsl */ `
attribute vec3 position;
attribute vec2 uv;
uniform mat4 modelViewMatrix, projectionMatrix;
uniform float uP, uTime;
varying vec2 vUv;
varying float vShade;
void main() {
  vUv = uv;
  float front = mix(-0.1, 1.6, uP);               // the gust travels from the left edge across the plane
  float d = front - uv.x;                          // > 0: the gust has already passed this column
  float env = smoothstep(-0.08, 0.0, d) * exp(-max(d, 0.0) * 2.2);
  float settle = sin(3.14159 * uP);                // 0 at both ends: the cloth settles flat
  float k = 10.0;
  float ph = uv.x * k - uTime * 7.0 + uv.y * 2.4;
  float amp = env * settle * 0.24;
  float breeze = sin(uv.x * 5.0 + uv.y * 3.0 + uTime * 1.4) * 0.014;  // never fully still
  vec3 p = position;
  p.z += sin(ph) * amp + breeze;
  p.y += sin(ph * 0.5) * amp * 0.08;
  vShade = clamp(cos(ph) * amp * k * 0.09 + cos(uv.x * 5.0 + uv.y * 3.0 + uTime * 1.4) * 0.02, -0.35, 0.35);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;
const M170_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D t0, t1, t2;
uniform float uA, uB, uP;
uniform vec2 uPlane, uTexRes;
varying vec2 vUv;
varying float vShade;
vec2 cover(vec2 uv) {
  vec2 s = uPlane / uTexRes;
  float k = max(s.x, s.y);
  vec2 size = uTexRes * k;
  return (uv * uPlane + (size - uPlane) * 0.5) / size;
}
vec3 pick(float i, vec2 uv) {
  if (i < 0.5) return texture2D(t0, uv).rgb;
  if (i < 1.5) return texture2D(t1, uv).rgb;
  return texture2D(t2, uv).rgb;
}
void main() {
  vec2 uv = cover(vUv);
  float f = smoothstep(0.2, 0.85, uP);
  vec3 c = mix(pick(uA, uv), pick(uB, uv), f);
  gl_FragColor = vec4(c + vShade, 1.0);
}`;
const M170_SLIDES = [
  { t: "Chanderi Drape", s: "Sheer silk-cotton · ₹ 7,800" },
  { t: "Khadi Morning", s: "Hand-spun khadi · ₹ 3,400" },
  { t: "Mulmul Dusk", s: "Soft mulmul · ₹ 2,950" },
];
function M170() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const sub = useRef<HTMLParagraphElement>(null);
  const st = useRef({ p: 0, a: 0, b: 1 });
  const srcs = [0, 1, 2].map((i) => scene(i + 1, 1200, 800, ["CHANDERI", "KHADI", "MULMUL"][i]));
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let dead = false;
    let cleanup = () => {};
    (async () => {
      const [ogl, tex] = await Promise.all([import("ogl"), Promise.all(srcs.map((s) => toCanvas(s, 1200, 800)))]);
      const cv = canvas.current;
      if (dead || !cv) return;
      try {
        const { Renderer, Camera, Plane, Program, Mesh, Texture } = ogl;
        const renderer = new Renderer({
          canvas: cv,
          dpr: Math.min(window.devicePixelRatio || 1, 1.5),
          alpha: true,
          antialias: true,
        });
        const gl = renderer.gl;
        const camera = new Camera(gl, { fov: 35 });
        camera.position.z = 5;
        const texs = tex.map(
          (c) =>
            new Texture(gl, {
              image: c,
              generateMipmaps: false,
              minFilter: gl.LINEAR,
              magFilter: gl.LINEAR,
            }),
        );
        const uniforms = {
          t0: { value: texs[0] },
          t1: { value: texs[1] },
          t2: { value: texs[2] },
          uA: { value: 0 },
          uB: { value: 1 },
          uP: { value: 0 },
          uTime: { value: 0 },
          uPlane: { value: [1.6, 1] },
          uTexRes: { value: [1200, 800] },
        };
        const program = new Program(gl, {
          vertex: M170_VERT,
          fragment: M170_FRAG,
          uniforms,
          cullFace: false,
        });
        const mesh = new Mesh(gl, {
          geometry: new Plane(gl, {
            width: 1,
            height: 1,
            widthSegments: 90,
            heightSegments: 45,
          }),
          program,
        });
        const box = cv.parentElement ?? cv;
        const resize = () => {
          const r = box.getBoundingClientRect();
          renderer.setSize(Math.max(1, r.width), Math.max(1, r.height));
          cv.style.width = "100%";
          cv.style.height = "100%";
          const aspect = r.width / Math.max(1, r.height);
          camera.perspective({ aspect });
          const vh = 2 * 5 * Math.tan((35 * Math.PI) / 360);
          const sx = vh * aspect * 0.8;
          const sy = vh * 0.8;
          mesh.scale.set(sx, sy, 1);
          uniforms.uPlane.value = [sx, sy];
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(box);
        let visible = false;
        const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: "100px" });
        io.observe(cv);
        const t0 = performance.now();
        let raf = 0;
        let shown = false;
        const loop = () => {
          raf = requestAnimationFrame(loop);
          if (!visible) return;
          const s = st.current;
          uniforms.uTime.value = (performance.now() - t0) / 1000;
          uniforms.uP.value = s.p;
          uniforms.uA.value = s.a;
          uniforms.uB.value = s.b;
          renderer.render({ scene: mesh, camera });
          if (!shown) {
            shown = true;
            cv.style.opacity = "1";
          }
        };
        raf = requestAnimationFrame(loop);
        cleanup = () => {
          cancelAnimationFrame(raf);
          ro.disconnect();
          io.disconnect();
          gl.getExtension("WEBGL_lose_context")?.loseContext();
        };
        if (dead) cleanup();
      } catch (err) {
        console.warn("[M170] WebGL off, showing the fallback:", (err as Error).message);
      }
    })();
    return () => {
      dead = true;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  usePlay(root, () => {
    const s = st.current;
    const text = () => {
      const n = M170_SLIDES[s.b];
      if (title.current) title.current.textContent = n.t;
      if (sub.current) sub.current.textContent = n.s;
      gsap.fromTo(
        [title.current, sub.current],
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.07,
          ease: "power3.out",
          overwrite: "auto",
        },
      );
    };
    return gsap
      .timeline({
        repeat: -1,
        onRepeat: () => {
          s.a = s.b;
          s.b = (s.b + 1) % 3;
        },
      })
      .fromTo(s, { p: 0 }, { p: 1, duration: 1.2, ease: "power1.inOut" }, 0)
      .call(text, [], 0.55)
      .to({}, { duration: 0.5 });
  });
  return (
    <Stage r={root} g1="rgba(255,138,61,.34)" g2="rgba(159,216,255,.18)">
      <div className="absolute inset-0">
        {/* fallback: the flat first slide (80% of the frame, like the plane) */}
        <div className="absolute inset-[10%] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={srcs[0]} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        </div>
        <canvas ref={canvas} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-300" aria-hidden />
      </div>
      <div className="pointer-events-none absolute bottom-[13%] left-[13%]">
        <p className="text-[13px] uppercase tracking-[0.22em] text-white/80">Resham House · Textiles</p>
        <h3 ref={title} className="mt-2 text-[clamp(44px,5.4vw,86px)] leading-[0.95] drop-shadow-[0_4px_24px_rgba(0,0,0,.45)]" style={{ fontFamily: F.fr, fontWeight: 500 }}>
          {M170_SLIDES[0].t}
        </h3>
        <p ref={sub} className="mt-2 text-[16px] text-white/85">
          {M170_SLIDES[0].s}
        </p>
      </div>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  {
    code: "M160",
    name: "List hover: photo follows cursor",
    how: "Hover a product row: its photo floats beside the pointer with a soft lag, swaps with a quick clip/scale and tilts with pointer speed.",
    kind: "play",
    C: M160,
  },
  {
    code: "M161",
    name: "List hover: full-screen photo behind",
    how: "Hover a menu item: its photo clips open from the centre line as a full-screen background while the other items dim.",
    kind: "play",
    C: M161,
  },
  {
    code: "M162",
    name: "Row hover: photo opens in side column",
    how: "Hover a row: its photo clips open from the bottom in a fixed side column (scale 1.2→1); the old one closes upward.",
    kind: "play",
    C: M162,
  },
  {
    code: "M163",
    name: "Double-image hover wipe + filter settle",
    how: "Hover a tile: the top copy wipes away (7 directions, one stepped, one soft) and the blown-out copy below settles to normal.",
    kind: "play",
    C: M163,
  },
  {
    code: "M164",
    name: "Cursor clear-circle through blur",
    how: "A soft circle follows the pointer with lag and shows the sharp photo through a blurred cover; it grows over key details.",
    kind: "play",
    C: M164,
  },
  {
    code: "M165",
    name: "Magnifier loupe",
    how: "Hover the photo: a 150 px loupe fades in and follows the pointer, showing the detail under it at 2×; it fades on leave.",
    kind: "play",
    C: M165,
  },
  {
    code: "M166",
    name: "Glass lens refraction",
    how: "A WebGL glass lens eases after the pointer: inside it the photo is magnified and refracted, with a chromatic fringe at the rim.",
    kind: "play",
    C: M166,
  },
  {
    code: "M167",
    name: "Blob clip morph on hover",
    how: "Hover: the organic blob clipping the photo morphs to a new shape (MorphSVG, 0.8 s) while the image scales 1→1.1 inside.",
    kind: "play",
    C: M167,
  },
  {
    code: "M168",
    name: "Blob-mask slide change",
    how: "Auto slider: the next slide grows in through a small SVG blob that morphs and scales until it covers the frame (1.2 s).",
    kind: "play",
    C: M168,
  },
  {
    code: "M169",
    name: "Wave sweep slide change",
    how: "Auto slider (WebGL): a wave of displacement sweeps across and carries the next picture in behind its crest, alternating direction.",
    kind: "play",
    C: M169,
  },
  {
    code: "M170",
    name: "Cloth flutter slide change",
    how: "Auto slider (WebGL plane): a gust ripples the image like cloth from the left edge, then it settles flat on the next picture.",
    kind: "play",
    C: M170,
  },
];
