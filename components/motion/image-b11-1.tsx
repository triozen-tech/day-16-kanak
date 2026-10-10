"use client";

// Image motions, batch 11 · group 1 (MOTION-MENU M530–M541): polaroid piles, accordions and carousels. Small focused
// demos for /lab/motion. Every "play" demo plays by itself while on screen (a visible fake pointer stands in for hover,
// click and drag; the real mouse takes over when it moves), loops with no rest over 0.3 s, pauses off screen, and has a
// CSS-only glow loop (plus a second glow on top of image-covered stages). The scrub demo follows the panel's scroll
// linearly. WebGL demos only rasterise textures / create the context once the stage is within ~1 screen of the
// viewport, at dpr 1. ?static=1 / reduced motion: no JS motion, the markup is a sensible final state.
import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
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

const CSS = `
.b11g1-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.5)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.22)),transparent 70%);animation:b11g1-drift 5.6s linear infinite alternate;will-change:transform}
@keyframes b11g1-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b11g1-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4);pointer-events:none;z-index:400;opacity:0}
.b11g1-pola{background:#f3eee4;padding:7% 7% 0;border-radius:4px;box-shadow:0 18px 40px rgba(0,0,0,.45),0 2px 6px rgba(0,0,0,.3);color:#1d1a16}
.m533-kb{animation:m533-kb 6s linear infinite alternate;will-change:transform}
@keyframes m533-kb{0%{transform:scale(1.03)}100%{transform:scale(1.13) translate3d(-2%,1%,0)}}
html.is-static .b11g1-glow,html.is-static .m533-kb{animation:none}
html.is-static {.b11g1-glow,.m533-kb{animation:none}}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0d16] text-[#eef2ff] ${className}`}>
      <style href="b11g1-css" precedence="default">
        {CSS}
      </style>
      <div className="b11g1-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/** The CSS glow loop again, ON TOP of photos/cards/canvas (screen blend), so image-covered stages never freeze. */
const Sheen = ({ g1 }: { g1?: string }) => (
  <div className="b11g1-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.45, zIndex: 350 } as CSSProperties} aria-hidden />
);

/** The visible fake pointer (a ring). */
const Dot = ({ r }: { r: RefObject<HTMLDivElement | null> }) => <div ref={r} className="b11g1-dot" aria-hidden />;

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ src, className = "", style }: { src: string; className?: string; style?: CSSProperties }) => <img src={src} alt="" className={`h-full w-full object-cover ${className}`} style={style} draggable={false} />;

/** Seeded random (mulberry32): the same "random" layout on server and client. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Signed distance of item i from the loop position, wrapped into [-n/2, n/2). */
function wrapD(i: number, pos: number, n: number) {
  let d = (i - pos) % n;
  if (d < -n / 2) d += n;
  if (d >= n / 2) d -= n;
  return d;
}
const mod = (a: number, n: number) => ((a % n) + n) % n;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Smoothed pointer x velocity (px/s); fades out when no samples arrive. */
function velTracker() {
  let lx = 0;
  let lt = 0;
  let v = 0;
  return {
    reset(x: number) {
      lx = x;
      lt = performance.now();
      v = 0;
    },
    add(x: number) {
      const t = performance.now();
      const dt = Math.max((t - lt) / 1000, 1 / 240);
      v = v * 0.55 + ((x - lx) / dt) * 0.45;
      lx = x;
      lt = t;
    },
    get v() {
      const age = (performance.now() - lt) / 1000;
      return age > 0.08 ? v * Math.max(0, 1 - (age - 0.08) * 8) : v;
    },
  };
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

/**
 * Hover driver: every frame (while on screen) gives a pointer position in root px. The real mouse wins for 2.5 s
 * after it last moved; otherwise `script(t, root)` drives the visible fake ring along a set path.
 */
function usePointer(root: RefObject<HTMLDivElement | null>, dot: RefObject<HTMLDivElement | null>, script: (t: number, el: HTMLDivElement) => Pt, frame: (p: Pt, dt: number, el: HTMLDivElement) => void) {
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
    fr.current(p, Math.min(dt, 0.1), el);
  });
}

type FP = { x: number; y: number; down: boolean };
type FakeH = {
  down?: (x: number, y: number, el: HTMLDivElement) => void;
  move?: (x: number, y: number, el: HTMLDivElement) => void;
  up?: (el: HTMLDivElement) => void;
  hover?: (x: number, y: number, el: HTMLDivElement) => void;
  frame?: (dt: number, el: HTMLDivElement) => void;
  wheel?: (d: number, el: HTMLDivElement) => void;
};
type FakeApi = { press: () => void; release: () => void };

/**
 * Drag/click driver. A scripted timeline moves a fake pointer `fp` (root px) and presses / releases it; every frame the
 * same handlers get either the fake pointer or the real one (pointer events + wheel). A real pointer pauses the script
 * (and hides the ring) until 2.5 s after it last acted. `frame(dt)` runs every frame while on screen (physics).
 */
function useFake(root: RefObject<HTMLDivElement | null>, dot: RefObject<HTMLDivElement | null>, build: (fp: FP, el: HTMLDivElement, api: FakeApi) => gsap.core.Timeline, h: FakeH) {
  const hr = useRef(h);
  hr.current = h;
  const br = useRef(build);
  br.current = build;
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const fp: FP = { x: -100, y: -100, down: false };
    let on = false;
    let dead = false;
    let realAt = -1e9;
    let realDown = false;
    let tl: gsap.core.Timeline | null = null;
    const ctx = gsap.context(() => {}, el);
    const fakeOn = () => !realDown && performance.now() - realAt > 2500;
    const sync = () => {
      if (!tl) return;
      if (on && fakeOn()) tl.resume();
      else tl.pause();
    };
    const api: FakeApi = {
      press: () => {
        if (!fakeOn()) return;
        fp.down = true;
        hr.current.down?.(fp.x, fp.y, el);
      },
      release: () => {
        if (!fp.down) return;
        fp.down = false;
        hr.current.up?.(el);
      },
    };
    const pt = (e: PointerEvent | WheelEvent) => {
      const r = el.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top] as const;
    };
    const takeover = () => {
      realAt = performance.now();
      if (fp.down) api.release();
      sync();
    };
    const pd = (e: PointerEvent) => {
      if ((e.target as Element).closest("button")) return takeover();
      takeover();
      realDown = true;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {}
      const [x, y] = pt(e);
      hr.current.down?.(x, y, el);
      sync();
    };
    const pm = (e: PointerEvent) => {
      takeover();
      const [x, y] = pt(e);
      if (realDown) hr.current.move?.(x, y, el);
      hr.current.hover?.(x, y, el);
    };
    const pu = () => {
      if (!realDown) return;
      realDown = false;
      realAt = performance.now();
      hr.current.up?.(el);
    };
    const pl = () => hr.current.hover?.(NaN, NaN, el);
    const wh = (e: WheelEvent) => {
      takeover();
      hr.current.wheel?.(Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY, el);
    };
    el.addEventListener("pointerdown", pd);
    el.addEventListener("pointermove", pm);
    el.addEventListener("pointerup", pu);
    el.addEventListener("pointercancel", pu);
    el.addEventListener("pointerleave", pl);
    el.addEventListener("wheel", wh, { passive: true });
    const io = new IntersectionObserver(
      ([e]) => {
        on = e.isIntersecting;
        sync();
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    const tick = (_t: number, dms: number) => {
      if (!on) return;
      const dt = Math.min(dms / 1000, 0.1);
      const fake = fakeOn();
      if (tl && fake && tl.paused()) tl.resume();
      const dn = dot.current;
      if (dn) {
        dn.style.transform = `translate3d(${fp.x.toFixed(1)}px,${fp.y.toFixed(1)}px,0) scale(${fp.down ? 0.75 : 1})`;
        dn.style.opacity = fake ? "1" : "0";
      }
      if (fake) {
        if (fp.down) hr.current.move?.(fp.x, fp.y, el);
        hr.current.hover?.(fp.x, fp.y, el);
      }
      hr.current.frame?.(dt, el);
    };
    gsap.ticker.add(tick);
    Promise.resolve(document.fonts?.ready).then(() => {
      if (dead) return;
      ctx.add(() => {
        tl = br.current(fp, el, api);
      });
      sync();
    });
    return () => {
      dead = true;
      io.disconnect();
      gsap.ticker.remove(tick);
      el.removeEventListener("pointerdown", pd);
      el.removeEventListener("pointermove", pm);
      el.removeEventListener("pointerup", pu);
      el.removeEventListener("pointercancel", pu);
      el.removeEventListener("pointerleave", pl);
      el.removeEventListener("wheel", wh);
      ctx.revert();
    };
  }, [root, dot]);
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
const centre = (node: Element, root: Element): [number, number] => {
  const b = rel(node, root);
  return [b.l + b.w / 2, b.t + b.h / 2];
};

/** Several placeholder pictures side by side in one canvas (one WebGL texture). */
async function atlas(srcs: string[], w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w * srcs.length;
  c.height = h;
  const g = c.getContext("2d")!;
  for (let i = 0; i < srcs.length; i++) g.drawImage(await toCanvas(srcs[i], w, h), i * w, 0);
  return c;
}

/* ───────────────────────── M530 · Scattered polaroids, pick to centre ───────────────────────── */
const M530_P = [
  { t: "Lisbon, June", b: "Sardines twice. Trams at dusk.", i: 1 },
  { t: "Coast road", b: "Windows down the whole way.", i: 0 },
  { t: "Spice market", b: "Bought too much saffron.", i: 3 },
  { t: "Night ferry", b: "Slept on deck, woke at sea.", i: 0 },
  { t: "Hill station", b: "Fog, tea, one warm jumper.", i: 2 },
  { t: "Old harbour", b: "The blue door, finally.", i: 1 },
];
type Lay = { x: number; y: number; r: number; s: number };
/** Layout with card `s` centred and upright, the others scattered to the left and right sides. */
function m530Layout(s: number): Lay[] {
  const r = rng(101 + s * 17);
  const out: Lay[] = [];
  const others = M530_P.map((_, i) => i).filter((i) => i !== s);
  others.forEach((i, j) => {
    const side = j % 2 === 0 ? -1 : 1;
    const k = Math.floor(j / 2);
    const ys = side < 0 ? [-0.24, 0.02, 0.26] : [-0.14, 0.2];
    out[i] = { x: side * (0.27 + r() * 0.1), y: ys[k] + (r() - 0.5) * 0.08, r: (r() - 0.5) * 34, s: 0.92 };
  });
  out[s] = { x: 0, y: -0.02, r: 0, s: 1.34 };
  return out;
}
const M530_L = M530_P.map((_, s) => m530Layout(s));
function M530() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const W = el.clientWidth;
    const H = el.clientHeight;
    const cards = gsap.utils.toArray<HTMLElement>(".m530-card", el);
    const flips = gsap.utils.toArray<HTMLElement>(".m530-flip", el);
    const d = dot.current!;
    const N = cards.length;
    const L0 = M530_L[0];
    cards.forEach((c, i) => gsap.set(c, { left: "50%", top: "50%", xPercent: -50, yPercent: -50, x: L0[i].x * W, y: L0[i].y * H, rotation: L0[i].r, scale: L0[i].s, zIndex: i === 0 ? 20 : 10 - i }));
    gsap.set(flips, { transformPerspective: 1000, rotationY: 0 });
    const last = M530_L[0][1];
    gsap.set(d, { x: W / 2 + last.x * W, y: H / 2 + last.y * H, opacity: 1 });
    const tl = gsap.timeline({ repeat: -1 });
    for (let k = 1; k <= N; k++) {
      const s = k % N;
      const prev = M530_L[(k - 1) % N];
      const L = M530_L[s];
      const T = (k - 1) * 2.35;
      // the ring walks to the next polaroid where it lies, clicks it
      tl.to(d, { x: W / 2 + prev[s].x * W, y: H / 2 + prev[s].y * H, duration: 0.4, ease: "power2.inOut" }, T);
      tl.to(d, { scale: 0.7, duration: 0.12, yoyo: true, repeat: 1, ease: "power1.inOut" }, T + 0.38);
      tl.set(cards[s], { zIndex: 30 + k }, T + 0.4);
      // the picked one rises upright to the centre, the rest re-scatter to the sides
      cards.forEach((c, i) => tl.to(c, { x: L[i].x * W, y: L[i].y * H, rotation: L[i].r, scale: L[i].s, duration: 0.85, ease: "power3.inOut" }, T + 0.4 + (i === s ? 0 : 0.04 * i)));
      tl.to(d, { x: W / 2, y: H / 2 + 0.05 * H, duration: 0.85, ease: "power3.inOut" }, T + 0.4);
      // selecting again flips it to show its back, then it turns face up
      tl.to(d, { scale: 0.7, duration: 0.12, yoyo: true, repeat: 1, ease: "power1.inOut" }, T + 1.13);
      tl.to(flips[s], { rotationY: 180, duration: 0.65, ease: "power2.inOut" }, T + 1.18);
      tl.to(flips[s], { rotationY: 0, duration: 0.55, ease: "power2.inOut" }, T + 1.88);
    }
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,179,107,.5)" g2="rgba(79,141,255,.22)">
      <div className="absolute left-[5%] top-[7%] z-[1]">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/60">Field Notes · Summer prints</p>
        <h3 className="mt-2 text-[clamp(30px,3.2vw,50px)] leading-none" style={{ fontFamily: F.is }}>
          Pick a memory
        </h3>
      </div>
      <p className="absolute bottom-[7%] right-[5%] z-[1] text-[14px] text-white/65" style={{ fontFamily: F.sg }}>
        Prints from ₹ 450 · framed ₹ 1,900
      </p>
      {M530_P.map((p, i) => {
        const L = M530_L[0][i];
        return (
          <div key={p.t} className="m530-card absolute w-[clamp(150px,12vw,190px)]" style={{ left: `${50 + L.x * 100}%`, top: `${50 + L.y * 100}%`, transform: `translate(-50%,-50%) rotate(${L.r}deg) scale(${L.s})`, zIndex: i === 0 ? 20 : 10 - i }}>
            <div className="m530-flip relative" style={{ transformStyle: "preserve-3d" }}>
              <div className="b11g1-pola" style={{ backfaceVisibility: "hidden" }}>
                <div className="aspect-square overflow-hidden">
                  <Img src={scene(p.i, 500, 500)} />
                </div>
                <p className="py-[9%] text-center text-[15px]" style={{ fontFamily: F.is }}>
                  {p.t}
                </p>
              </div>
              <div className="b11g1-pola absolute inset-0 flex flex-col justify-between pb-[9%]" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                <p className="text-[12px] uppercase tracking-[0.18em] text-black/50">No. 0{i + 1}</p>
                <p className="text-[19px] leading-[1.2]" style={{ fontFamily: F.is }}>
                  {p.b}
                </p>
                <p className="text-[12px] text-black/55">Print ₹ 450</p>
              </div>
            </div>
          </div>
        );
      })}
      <Sheen g1="rgba(255,190,130,.5)" />
      <div ref={dot} className="b11g1-dot" aria-hidden />
    </Stage>
  );
}

/* ───────────────────────── M531 · Throwable polaroid pile ───────────────────────── */
const M531_N = 12;
const M531_CAP = ["Day 01", "The lake", "Late tea", "Blue hour", "Market", "Day 06", "Ferry", "Rooftop", "Rain", "Day 10", "Cliffs", "Home"];
function m531Set(seed: number) {
  const r = rng(seed);
  return Array.from({ length: M531_N }, () => ({ x: (r() - 0.5) * 0.78, y: (r() - 0.5) * 0.56, r: (r() - 0.5) * 50 }));
}
const M531_A = m531Set(7);
const M531_B = m531Set(29);
function M531() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    const d = dot.current;
    if (!el || !d || prefersReducedMotion()) return;
    let on = false;
    let real = false;
    let dead = false;
    let resumeT = 0;
    let tl: gsap.core.Timeline | null = null;
    let z = 1000;
    const offs: (() => void)[] = [];
    const ctx = gsap.context(() => {}, el);
    const sync = () => {
      if (!tl) return;
      if (on && !real) tl.resume();
      else tl.pause();
    };
    Promise.resolve(document.fonts?.ready).then(() => {
      if (dead) return;
      ctx.add(() => {
        const W = el.clientWidth;
        const H = el.clientHeight;
        const cards = gsap.utils.toArray<HTMLElement>(".m531-card", el);
        cards.forEach((c, i) => gsap.set(c, { left: "50%", top: "50%", xPercent: -50, yPercent: -50, x: M531_A[i].x * W, y: M531_A[i].y * H, rotation: M531_A[i].r, zIndex: i + 1 }));
        const lastA = M531_A[M531_N - 1];
        gsap.set(d, { x: W / 2 + lastA.x * W, y: H / 2 + lastA.y * H, opacity: 1 });
        tl = gsap.timeline({ repeat: -1 });
        // pass 1 throws every card from pile A to spot B, pass 2 throws them back: the loop is seamless
        for (let n = 0; n < M531_N * 2; n++) {
          const k = n % M531_N;
          const from = n < M531_N ? M531_A[k] : M531_B[k];
          const to = n < M531_N ? M531_B[k] : M531_A[k];
          const T = n * 0.9;
          const fx = from.x * W;
          const fy = from.y * H;
          const tx = to.x * W;
          const ty = to.y * H;
          const mx = fx + (tx - fx) * 0.45;
          const my = fy + (ty - fy) * 0.45 - 24;
          const tilt = from.r + Math.sign(tx - fx || 1) * 16;
          tl.to(d, { x: W / 2 + fx, y: H / 2 + fy, duration: 0.3, ease: "power2.inOut" }, T);
          tl.set(cards[k], { zIndex: 100 + n }, T + 0.3);
          tl.to(d, { scale: 0.75, duration: 0.1 }, T + 0.3);
          tl.to(cards[k], { x: mx, y: my, rotation: tilt, scale: 1.08, duration: 0.3, ease: "power1.in" }, T + 0.3);
          tl.to(d, { x: W / 2 + mx, y: H / 2 + my, duration: 0.3, ease: "power1.in" }, T + 0.3);
          tl.to(d, { scale: 1, duration: 0.1 }, T + 0.6);
          tl.to(cards[k], { x: tx, y: ty, rotation: to.r, scale: 1, duration: 0.65, ease: "power3.out" }, T + 0.6);
        }
        // real drag: grab any polaroid, it follows and tilts with speed; release throws it on top of the pile
        let drag: { c: HTMLElement; px: number; py: number; x: number; y: number; r: number; vx: number; vy: number; lx: number; ly: number; lt: number } | null = null;
        const down = (e: PointerEvent) => {
          const c = (e.target as Element).closest<HTMLElement>(".m531-card");
          if (!c) return;
          real = true;
          window.clearTimeout(resumeT);
          sync();
          d.style.opacity = "0";
          gsap.killTweensOf(c);
          c.style.zIndex = String(++z);
          try {
            el.setPointerCapture(e.pointerId);
          } catch {}
          drag = { c, px: e.clientX, py: e.clientY, x: Number(gsap.getProperty(c, "x")), y: Number(gsap.getProperty(c, "y")), r: Number(gsap.getProperty(c, "rotation")), vx: 0, vy: 0, lx: e.clientX, ly: e.clientY, lt: performance.now() };
          gsap.to(c, { scale: 1.08, duration: 0.2 });
        };
        const move = (e: PointerEvent) => {
          if (!drag) return;
          const t = performance.now();
          const dt = Math.max((t - drag.lt) / 1000, 1 / 240);
          drag.vx = drag.vx * 0.6 + ((e.clientX - drag.lx) / dt) * 0.4;
          drag.vy = drag.vy * 0.6 + ((e.clientY - drag.ly) / dt) * 0.4;
          drag.lx = e.clientX;
          drag.ly = e.clientY;
          drag.lt = t;
          gsap.set(drag.c, { x: drag.x + e.clientX - drag.px, y: drag.y + e.clientY - drag.py, rotation: drag.r + clamp(drag.vx * 0.02, -22, 22) });
        };
        const up = () => {
          if (!drag) return;
          const g = drag;
          drag = null;
          const W2 = el.clientWidth / 2 - 60;
          const H2 = el.clientHeight / 2 - 80;
          gsap.to(g.c, { x: clamp(Number(gsap.getProperty(g.c, "x")) + g.vx * 0.18, -W2, W2), y: clamp(Number(gsap.getProperty(g.c, "y")) + g.vy * 0.18, -H2, H2), rotation: g.r + clamp(g.vx * 0.01, -40, 40), scale: 1, duration: 0.8, ease: "power3.out" });
          resumeT = window.setTimeout(() => {
            real = false;
            tl?.invalidate();
            sync();
          }, 2500);
        };
        el.addEventListener("pointerdown", down);
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerup", up);
        el.addEventListener("pointercancel", up);
        offs.push(() => {
          el.removeEventListener("pointerdown", down);
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerup", up);
          el.removeEventListener("pointercancel", up);
        });
      });
      sync();
    });
    const io = new IntersectionObserver(
      ([e]) => {
        on = e.isIntersecting;
        sync();
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => {
      dead = true;
      window.clearTimeout(resumeT);
      io.disconnect();
      offs.forEach((f) => f());
      ctx.revert();
    };
  }, []);
  return (
    <Stage r={root} g1="rgba(255,122,89,.5)" g2="rgba(159,216,255,.2)">
      <p className="pointer-events-none absolute inset-0 flex select-none items-center justify-center text-[clamp(90px,13vw,200px)] italic leading-none tracking-[-0.04em] text-white/[0.13]" style={{ fontFamily: F.fr, fontWeight: 600 }}>
        Memories
      </p>
      <p className="pointer-events-none absolute left-[4%] top-[6%] z-[1] text-[13px] uppercase tracking-[0.24em] text-white/60">Instant film · 12 frames · ₹ 1,290 a pack</p>
      {M531_A.map((a, i) => (
        <div key={i} className="m531-card absolute w-[clamp(110px,8.6vw,140px)] cursor-grab touch-none select-none" style={{ left: `${50 + a.x * 100}%`, top: `${50 + a.y * 100}%`, transform: `translate(-50%,-50%) rotate(${a.r}deg)`, zIndex: i + 1 }}>
          <div className="b11g1-pola">
            <div className="aspect-[4/5] overflow-hidden">
              <Img src={scene(i, 320, 400)} />
            </div>
            <p className="py-[8%] text-center text-[13px]" style={{ fontFamily: F.is }}>
              {M531_CAP[i]}
            </p>
          </div>
        </div>
      ))}
      <Sheen g1="rgba(255,150,110,.5)" />
      <div ref={dot} className="b11g1-dot" aria-hidden />
    </Stage>
  );
}

/* ───────────────────────── M532 · Photo pile pop-in ───────────────────────── */
const M532_P = [
  { x: -24, y: -10, a: -14 },
  { x: 18, y: -16, a: 9 },
  { x: -6, y: 14, a: -6 },
  { x: 25, y: 12, a: 15 },
  { x: -27, y: 16, a: 8 },
  { x: 4, y: -14, a: -11 },
  { x: 2, y: 4, a: 4 },
];
function M532() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const hov = useRef(-2);
  usePlay(root, (el) => {
    const pops = gsap.utils.toArray<HTMLElement>(".m532-pop", el);
    const tl = gsap.timeline({ repeat: -1 });
    tl.fromTo(pops, { scale: 0.2, opacity: 0, rotation: (i: number) => M532_P[i].a + (i % 2 ? 26 : -26) }, { scale: 1, opacity: 1, rotation: (i: number) => M532_P[i].a, duration: 0.6, ease: "back.out(1.8)", stagger: 0.17 });
    tl.to(pops, { scale: 0.2, opacity: 0, rotation: (i: number) => M532_P[i].a + (i % 2 ? -18 : 18), duration: 0.32, ease: "power2.in", stagger: { each: 0.05, from: "end" } }, "+=1.5");
    return tl;
  });
  usePointer(
    root,
    dot,
    (t, el) => {
      const ps = [...el.querySelectorAll(".m532-pos")];
      const pts = [0, 3, 2, 1, 4, 6].map((i) => centre(ps[i], el));
      const [x, y] = stepPath(t, pts, 0.75, 0.5);
      return { x: x + Math.sin(t * 2.3) * 18, y: y + Math.cos(t * 1.9) * 12, inside: true };
    },
    (p, _dt, el) => {
      const ps = [...el.querySelectorAll<HTMLElement>(".m532-pos")];
      let idx = -1;
      if (p.inside) {
        for (let i = ps.length - 1; i >= 0; i--) {
          const b = rel(ps[i].querySelector(".m532-st")!, el);
          if (p.x >= b.l && p.x <= b.l + b.w && p.y >= b.t && p.y <= b.t + b.h) {
            idx = i;
            break;
          }
        }
      }
      if (idx === hov.current) return;
      hov.current = idx;
      ps.forEach((pp, i) => {
        pp.style.zIndex = String(i === idx ? 30 : i + 1);
        // hover straightens: the inner layer cancels the photo's own angle
        gsap.to(pp.querySelector(".m532-st"), { rotation: i === idx ? -M532_P[i].a : 0, scale: i === idx ? 1.08 : 1, duration: 0.45, ease: "power3.out", overwrite: "auto" });
      });
    },
  );
  return (
    <Stage r={root} g1="rgba(24,196,143,.5)" g2="rgba(255,213,154,.22)">
      <div className="absolute left-[5%] top-[7%] z-[40]">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/60">Atlas Prints · Lookbook 07</p>
        <h3 className="mt-2 text-[clamp(30px,3.2vw,50px)] font-[600] leading-none tracking-[-0.02em]" style={{ fontFamily: F.sg }}>
          A pile of good days
        </h3>
      </div>
      <p className="absolute bottom-[7%] left-[5%] z-[40] text-[14px] text-white/65">Photo book, 60 pages · ₹ 2,400</p>
      {M532_P.map((p, i) => (
        <div key={i} className="m532-pos absolute w-[clamp(170px,15vw,230px)]" style={{ left: `${50 + p.x}%`, top: `${50 + p.y}%`, transform: "translate(-50%,-50%)", zIndex: i + 1 }}>
          <div className="m532-pop" style={{ transform: `rotate(${p.a}deg)` }}>
            <div className="m532-st rounded-[6px] bg-[#f6f2ea] p-[5%] shadow-[0_20px_44px_rgba(0,0,0,.5)]">
              <div className="aspect-[4/5] overflow-hidden rounded-[3px]">
                <Img src={scene(i, 400, 500)} />
              </div>
            </div>
          </div>
        </div>
      ))}
      <Sheen g1="rgba(120,230,180,.5)" />
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M533 · Spine accordion ───────────────────────── */
const M533_P = [
  { n: "Atrium House", y: "2025", p: "₹ 4.2 Cr", i: 3 },
  { n: "Salt Pavilion", y: "2024", p: "₹ 2.8 Cr", i: 0 },
  { n: "North Studio", y: "2024", p: "₹ 1.6 Cr", i: 2 },
  { n: "Clay Courtyard", y: "2023", p: "₹ 3.1 Cr", i: 1 },
  { n: "Lantern Hall", y: "2023", p: "₹ 5.4 Cr", i: 3 },
  { n: "Ridge Cabin", y: "2022", p: "₹ 96 L", i: 2 },
];
function M533() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const sp = gsap.utils.toArray<HTMLElement>(".m533-spine", el);
    const N = sp.length;
    const tl = gsap.timeline({ repeat: -1 });
    for (let k = 1; k <= N; k++) {
      const a = (k - 1) % N;
      const s = k % N;
      const T = (k - 1) * 1.15;
      tl.to(sp[a], { flexGrow: 0, duration: 0.9, ease: "power3.inOut" }, T);
      tl.to(sp[s], { flexGrow: 1, duration: 0.9, ease: "power3.inOut" }, T);
      tl.to(sp[a].querySelector(".m533-open"), { opacity: 0, x: -30, duration: 0.35, ease: "power2.in" }, T);
      tl.to(sp[a].querySelector(".m533-side"), { opacity: 1, duration: 0.4 }, T + 0.45);
      tl.to(sp[s].querySelector(".m533-side"), { opacity: 0, duration: 0.25 }, T);
      tl.fromTo(sp[s].querySelector(".m533-open"), { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.6, ease: "power3.out" }, T + 0.45);
    }
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(224,145,63,.5)" g2="rgba(79,141,255,.2)">
      <div className="absolute left-[4%] right-[4%] top-[6%] z-[1] flex items-baseline justify-between">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/60">Hollis & Rhee · Selected works</p>
        <p className="text-[13px] text-white/50">06 projects</p>
      </div>
      <div className="absolute bottom-[6%] left-[4%] right-[4%] top-[14%] flex gap-[10px] [container-type:inline-size]">
        {M533_P.map((p, i) => (
          <div key={p.n} className="m533-spine relative min-w-0 basis-[76px] overflow-hidden rounded-[14px] border border-white/12 bg-[#11151f]" style={{ flexGrow: i === 0 ? 1 : 0, flexShrink: 0 }}>
            <div className="m533-side absolute inset-0 flex flex-col items-center justify-between py-5" style={{ opacity: i === 0 ? 0 : 1 }}>
              <span className="text-[13px] tabular-nums text-white/50">0{i + 1}</span>
              <span className="whitespace-nowrap text-[22px] font-[600] tracking-[-0.01em]" style={{ fontFamily: F.sg, writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                {p.n}
              </span>
              <span className="text-[12px] text-white/50">{p.y}</span>
            </div>
            <div className="m533-open absolute inset-y-0 left-0 flex w-[calc(100cqw-430px)] flex-col p-[14px]" style={{ opacity: i === 0 ? 1 : 0 }}>
              <div className="relative flex-1 overflow-hidden rounded-[8px] border-[6px] border-[#f1ece2]">
                <div className="m533-kb absolute inset-0">
                  <Img src={scene(p.i, 1200, 800)} />
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-6 px-1 pt-4">
                <h3 className="text-[clamp(28px,2.8vw,44px)] leading-none" style={{ fontFamily: F.fr, fontWeight: 500 }}>
                  {p.n}
                </h3>
                <p className="whitespace-nowrap text-[14px] text-white/65">
                  {p.y} · build {p.p}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Sheen g1="rgba(255,190,120,.5)" />
    </Stage>
  );
}

/* ───────────────────────── M534 · Vertical expand-on-hover rows ───────────────────────── */
const M534_R = [
  { n: "Linen Overshirt", c: "Menswear", p: "₹ 6,400", i: 3 },
  { n: "Pleated Trouser", c: "Tailoring", p: "₹ 7,900", i: 1 },
  { n: "Wool Field Coat", c: "Outerwear", p: "₹ 18,500", i: 0 },
  { n: "Raw Selvedge", c: "Denim", p: "₹ 9,200", i: 2 },
  { n: "Suede Loafer", c: "Footwear", p: "₹ 11,800", i: 3 },
];
function M534() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const act = useRef(0);
  usePointer(
    root,
    dot,
    (t, el) => {
      const rows = [...el.querySelectorAll(".m534-head")];
      const pts: [number, number][] = [1, 2, 3, 4, 3, 0].map((i, j) => {
        const b = rel(rows[i], el);
        return [b.l + b.w * (0.3 + 0.12 * (j % 3)), b.t + b.h / 2];
      });
      const [x, y] = stepPath(t, pts, 1.0, 0.4);
      return { x: x + Math.sin(t * 2.2) * 26, y, inside: true };
    },
    (p, _dt, el) => {
      const rows = [...el.querySelectorAll<HTMLElement>(".m534-row")];
      if (!p.inside) return;
      const idx = rows.findIndex((r) => {
        const b = rel(r, el);
        return p.y >= b.t && p.y <= b.t + b.h && p.x >= b.l && p.x <= b.l + b.w;
      });
      if (idx < 0 || idx === act.current) return;
      act.current = idx;
      rows.forEach((r, i) => {
        gsap.to(r, { flexGrow: i === idx ? 1 : 0, duration: 0.7, ease: "power3.inOut", overwrite: "auto" });
        gsap.to(r.querySelector(".m534-pic"), { scale: i === idx ? 1 : 1.18, opacity: i === idx ? 1 : 0.3, duration: 0.8, ease: "power3.out", overwrite: "auto" });
        gsap.to(r.querySelector(".m534-arrow"), { rotation: i === idx ? 0 : -45, opacity: i === idx ? 1 : 0.4, duration: 0.5, overwrite: "auto" });
      });
    },
  );
  return (
    <Stage r={root} g1="rgba(255,77,109,.5)" g2="rgba(255,179,107,.22)">
      <div className="absolute bottom-[5%] left-[5%] right-[5%] top-[5%] flex flex-col gap-[8px]">
        {M534_R.map((r, i) => (
          <div key={r.n} className="m534-row relative min-h-0 basis-[58px] overflow-hidden rounded-[12px] border border-white/12 bg-[#11151f]" style={{ flexGrow: i === 0 ? 1 : 0, flexShrink: 0 }}>
            <div className="m534-pic absolute inset-0" style={{ opacity: i === 0 ? 1 : 0.3, transform: i === 0 ? "none" : "scale(1.18)" }}>
              <Img src={scene(r.i, 1600, 700)} />
              <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-black/40" />
            </div>
            <div className="m534-head relative flex h-[58px] items-center justify-between px-6">
              <div className="flex items-baseline gap-6">
                <span className="text-[13px] tabular-nums text-white/55">0{i + 1}</span>
                <span className="text-[clamp(22px,2vw,30px)] font-[600] tracking-[-0.02em]" style={{ fontFamily: F.sg }}>
                  {r.n}
                </span>
                <span className="text-[13px] uppercase tracking-[0.2em] text-white/55">{r.c}</span>
              </div>
              <div className="flex items-center gap-5">
                <span className="text-[16px] tabular-nums">{r.p}</span>
                <span className="m534-arrow text-[20px]" style={{ transform: i === 0 ? "none" : "rotate(-45deg)", opacity: i === 0 ? 1 : 0.4 }}>
                  →
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Sheen g1="rgba(255,120,140,.5)" />
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M535 · Seamless loop with centre scale ───────────────────────── */
const M535_C = [
  { n: "Ember Mug", p: "₹ 1,450" },
  { n: "Tide Bottle", p: "₹ 2,200" },
  { n: "Grain Tray", p: "₹ 1,850" },
  { n: "Pebble Lamp", p: "₹ 4,600" },
  { n: "Fern Vase", p: "₹ 2,900" },
  { n: "Dusk Candle", p: "₹ 1,200" },
  { n: "Moss Bowl", p: "₹ 1,650" },
  { n: "Halo Clock", p: "₹ 3,400" },
];
function m535Look(d: number) {
  const a = Math.abs(d);
  const s = a < 1 ? 1.16 - 0.26 * a : Math.max(0.6, 0.9 - 0.16 * (a - 1));
  return { s, dim: Math.min(0.72, a * 0.42) };
}
function M535() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const st = useRef({ pos: 0, tgt: 0, drag: false, sx: 0, sp: 0, wheelAt: 0 });
  const vt = useRef(velTracker());
  const N = M535_C.length;
  const pitchPx = (el: HTMLElement) => el.clientWidth * 0.2 * 1.12;
  const go = (d: number) => (st.current.tgt = Math.round(st.current.tgt) + d);
  const press = (btn: Element | null, d: number) => {
    go(d);
    if (btn) gsap.fromTo(btn, { scale: 0.84 }, { scale: 1, duration: 0.35, ease: "power2.out" });
  };
  useFake(
    root,
    dot,
    (fp, el, api) => {
      const W = el.clientWidth;
      const H = el.clientHeight;
      const nb = el.querySelector(".m535-next");
      const pb = el.querySelector(".m535-prev");
      const [nx, ny] = centre(nb!, el);
      const [px, py] = centre(pb!, el);
      const pitch = pitchPx(el);
      fp.x = px - 8;
      fp.y = py;
      const tl = gsap.timeline({ repeat: -1 });
      tl.to(fp, { x: nx, y: ny, duration: 0.5, ease: "power2.inOut" })
        .call(() => press(nb, 1))
        .to(fp, { x: nx + 8, y: ny - 4, duration: 0.55, ease: "sine.inOut" })
        .call(() => press(nb, 1))
        .to(fp, { x: W * 0.62, y: H * 0.45, duration: 0.5, ease: "power2.inOut" })
        .call(api.press)
        .to(fp, { x: W * 0.62 - pitch * 1.3, duration: 0.55, ease: "power1.inOut" })
        .call(api.release)
        .to(fp, { x: px, y: py, duration: 0.6, ease: "power2.inOut" })
        .call(() => press(pb, -1))
        .to(fp, { x: px - 8, duration: 0.5, ease: "sine.inOut" });
      return tl;
    },
    {
      down: (x, _y, el) => {
        const s = st.current;
        s.drag = true;
        s.sx = x;
        s.sp = s.pos;
        vt.current.reset(x);
        void el;
      },
      move: (x, _y, el) => {
        const s = st.current;
        if (!s.drag) return;
        vt.current.add(x);
        s.pos = s.sp - (x - s.sx) / pitchPx(el);
        s.tgt = s.pos;
      },
      up: (el) => {
        const s = st.current;
        s.drag = false;
        s.tgt = Math.round(s.pos - (vt.current.v / pitchPx(el)) * 0.12);
      },
      wheel: (d) => {
        const s = st.current;
        const now = performance.now();
        if (Math.abs(d) < 3 || now - s.wheelAt < 320) return;
        s.wheelAt = now;
        go(Math.sign(d));
      },
      frame: (dt, el) => {
        const s = st.current;
        if (!s.drag) s.pos += (s.tgt - s.pos) * (1 - Math.exp(-dt * 7));
        el.querySelectorAll<HTMLElement>(".m535-card").forEach((c, i) => {
          const d = wrapD(i, s.pos, N);
          const L = m535Look(d);
          c.style.transform = `translate3d(${(d * 112).toFixed(2)}%,0,0) scale(${L.s.toFixed(4)})`;
          c.style.zIndex = String(100 - Math.round(Math.abs(d) * 10));
          (c.querySelector(".m535-dim") as HTMLElement).style.opacity = L.dim.toFixed(3);
        });
        if (count.current) count.current.textContent = `0${mod(Math.round(s.pos), N) + 1}`;
      },
    },
  );
  return (
    <Stage r={root} g1="rgba(79,141,255,.5)" g2="rgba(255,179,107,.2)">
      <div className="absolute left-[5%] top-[6%] z-[1]">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/60">Kiln & Co · Homeware</p>
      </div>
      <div className="absolute inset-x-0 bottom-[20%] top-[14%] cursor-grab touch-none select-none">
        {M535_C.map((c, i) => {
          const d = wrapD(i, 0, M535_C.length);
          const L = m535Look(d);
          return (
            <div key={c.n} className="m535-card absolute bottom-0 top-0 ml-[-10%] w-[20%] will-change-transform" style={{ left: "50%", transform: `translate3d(${d * 112}%,0,0) scale(${L.s})`, zIndex: 100 - Math.round(Math.abs(d) * 10) }}>
              <div className="relative h-full overflow-hidden rounded-[18px] border border-white/10">
                <Img src={scene(i, 500, 700)} />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-10">
                  <p className="text-[18px] font-[600]" style={{ fontFamily: F.sg }}>
                    {c.n}
                  </p>
                  <p className="text-[14px] text-white/75">{c.p}</p>
                </div>
                <div className="m535-dim absolute inset-0 bg-[#05080f]" style={{ opacity: L.dim }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="absolute bottom-[6%] left-1/2 z-[300] ml-[-110px] flex w-[220px] items-center justify-between">
        <button type="button" className="m535-prev grid h-12 w-12 place-items-center rounded-full border border-white/30 text-[18px]" onClick={() => go(-1)} aria-label="Previous">
          ←
        </button>
        <p className="text-[14px] tabular-nums text-white/75">
          <span ref={count}>01</span> / 0{N}
        </p>
        <button type="button" className="m535-next grid h-12 w-12 place-items-center rounded-full bg-white text-[18px] text-[#0a0d16]" onClick={() => go(1)} aria-label="Next">
          →
        </button>
      </div>
      <Sheen g1="rgba(120,170,255,.5)" />
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M536 · Auto-drift grab carousel ───────────────────────── */
const M536_C = ["Cedar & Smoke", "Fig Leaf", "Sea Salt", "Amber Room", "White Tea", "Oud Night", "Rain Garden", "Citrus Grove", "Warm Linen"];
const M536_DRIFT = 0.4; // cards per second
function M536() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const speed = useRef<HTMLSpanElement>(null);
  const st = useRef({ pos: 0, v: M536_DRIFT, drag: false, sx: 0, sp: 0, glide: 0, gv: 0 });
  const vt = useRef(velTracker());
  const N = M536_C.length;
  const pitchPx = (el: HTMLElement) => el.clientWidth * 0.17 * 1.1;
  useFake(
    root,
    dot,
    (fp, el, api) => {
      const W = el.clientWidth;
      const H = el.clientHeight;
      const cx = W * 0.5;
      const cy = H * 0.5;
      fp.x = W * 0.66;
      fp.y = H * 0.92;
      const tl = gsap.timeline({ repeat: -1 });
      tl.to(fp, { x: cx, y: cy, duration: 0.5, ease: "power2.inOut" })
        .call(api.press)
        .to(fp, { x: cx - 30, duration: 0.45, ease: "sine.inOut" }) // grabbed: the strip slows to a stop
        .to(fp, { x: cx - 300, duration: 0.22, ease: "power2.in" }) // throw left
        .call(api.release)
        .to(fp, { x: W * 0.3, y: H * 0.9, duration: 0.6, ease: "power2.out" })
        .to(fp, { x: W * 0.42, y: cy + 20, duration: 0.6, ease: "power2.inOut" })
        .call(api.press)
        .to(fp, { x: W * 0.42 + 24, duration: 0.4, ease: "sine.inOut" })
        .to(fp, { x: W * 0.42 + 260, duration: 0.22, ease: "power2.in" }) // throw right, against the drift
        .call(api.release)
        .to(fp, { x: W * 0.66, y: H * 0.92, duration: 0.7, ease: "power2.out" });
      return tl;
    },
    {
      down: (x) => {
        const s = st.current;
        s.drag = true;
        s.sx = x;
        s.sp = s.pos;
        s.glide = 0;
        s.gv = s.v; // keeps gliding a moment, then stops under the hand
        vt.current.reset(x);
      },
      move: (x, _y, el) => {
        const s = st.current;
        if (!s.drag) return;
        vt.current.add(x);
        s.pos = s.sp + s.glide - (x - s.sx) / pitchPx(el);
      },
      up: (el) => {
        const s = st.current;
        s.drag = false;
        s.v = clamp(-vt.current.v / pitchPx(el), -9, 9);
      },
      wheel: (d) => {
        st.current.v = clamp(st.current.v + Math.sign(d) * 0.9, -9, 9);
      },
      frame: (dt, el) => {
        const s = st.current;
        if (s.drag) {
          s.gv *= Math.exp(-dt * 7);
          s.glide += s.gv * dt;
          s.v = s.gv;
        } else {
          s.v += (M536_DRIFT - s.v) * (1 - Math.exp(-dt * 1.3)); // relaxes back to the slow drift
          s.pos += s.v * dt;
        }
        el.querySelectorAll<HTMLElement>(".m536-card").forEach((c, i) => {
          const d = wrapD(i, s.pos, N);
          c.style.transform = `translate3d(${(d * 110).toFixed(2)}%,0,0)`;
        });
        if (speed.current) speed.current.textContent = `${Math.abs(s.drag ? s.gv : s.v).toFixed(2)}`;
      },
    },
  );
  return (
    <Stage r={root} g1="rgba(224,145,63,.5)" g2="rgba(24,196,143,.2)">
      <div className="absolute left-[5%] right-[5%] top-[7%] z-[1] flex items-end justify-between">
        <h3 className="text-[clamp(30px,3.2vw,50px)] leading-none" style={{ fontFamily: F.fr, fontWeight: 500 }}>
          The scent library
        </h3>
        <p className="text-[13px] uppercase tracking-[0.2em] text-white/55">
          drift <span ref={speed}>0.40</span> cards/s
        </p>
      </div>
      <div className="absolute inset-x-0 bottom-[16%] top-[24%] cursor-grab touch-none select-none">
        {M536_C.map((n, i) => {
          const d = wrapD(i, 0, M536_C.length);
          return (
            <div key={n} className="m536-card absolute bottom-0 top-0 ml-[-8.5%] w-[17%] will-change-transform" style={{ left: "50%", transform: `translate3d(${d * 110}%,0,0)` }}>
              <div className="h-[80%] overflow-hidden rounded-[16px]">
                <Img src={scene(i + 1, 400, 520)} />
              </div>
              <div className="mt-3 flex items-baseline justify-between text-[14px]">
                <span style={{ fontFamily: F.sg }}>{n}</span>
                <span className="text-white/60">₹ {(1800 + i * 150).toLocaleString("en-IN")}</span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="absolute bottom-[6%] left-[5%] z-[1] text-[13px] text-white/55">Grab to stop · throw to spin · wheel to nudge</p>
      <Sheen g1="rgba(255,190,120,.5)" />
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M537 · Snap carousel with rubber-band ends ───────────────────────── */
const M537_C = [
  { n: "Trail Runner 3", p: "₹ 9,999" },
  { n: "Court Classic", p: "₹ 7,499" },
  { n: "Cloud Knit", p: "₹ 8,299" },
  { n: "Ridge Hiker", p: "₹ 11,499" },
  { n: "Street Low", p: "₹ 6,999" },
  { n: "Tempo Racer", p: "₹ 12,999" },
];
const M537_PITCH = 28.5; // % of the stage width
const M537_MAX = M537_C.length - 3;
function m537Rubber(p: number) {
  if (p < 0) return p * 0.3;
  if (p > M537_MAX) return M537_MAX + (p - M537_MAX) * 0.3;
  return p;
}
function M537() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const st = useRef({ p: 0, disp: 0, drag: false, sx: 0, sp: 0, tw: null as gsap.core.Tween | null, wheelAt: 0 });
  const vt = useRef(velTracker());
  const pitchPx = (el: HTMLElement) => (el.clientWidth * M537_PITCH) / 100;
  const snap = (to: number) => {
    const s = st.current;
    s.tw?.kill();
    s.p = to;
    const o = { d: s.disp };
    s.tw = gsap.to(o, { d: to, duration: 0.55, ease: "expo.out", onUpdate: () => (s.disp = o.d) }); // stiff release
  };
  useEffect(() => () => void st.current.tw?.kill(), []);
  useFake(
    root,
    dot,
    (fp, el, api) => {
      const W = el.clientWidth;
      const H = el.clientHeight;
      const P = pitchPx(el);
      const y = H * 0.5;
      fp.x = W * 0.5;
      fp.y = H * 0.9;
      const tl = gsap.timeline({ repeat: -1 });
      tl.to(fp, { x: W * 0.4, y, duration: 0.45, ease: "power2.inOut" })
        .call(api.press)
        .to(fp, { x: W * 0.4 + 170, duration: 0.4, ease: "power1.out" }) // pull past the start: rubber band
        .call(api.release);
      for (let k = 0; k < 4; k++) {
        tl.to(fp, { x: W * 0.62, duration: 0.3, ease: "power2.inOut" })
          .call(api.press)
          .to(fp, { x: W * 0.62 - P * (k === 3 ? 0.9 : 0.62), duration: 0.32, ease: "power1.inOut" }) // last one pulls past the end
          .call(api.release);
      }
      tl.to(fp, { x: W * 0.2, duration: 0.35, ease: "power2.inOut" })
        .call(api.press)
        .to(fp, { x: W * 0.2 + P * 2.9, duration: 0.55, ease: "power2.in" }) // fling back to the start
        .call(api.release)
        .to(fp, { x: W * 0.5, y: H * 0.9, duration: 0.45, ease: "power2.out" });
      return tl;
    },
    {
      down: (x) => {
        const s = st.current;
        s.tw?.kill();
        s.drag = true;
        s.sx = x;
        s.sp = s.disp < 0 ? s.disp / 0.3 : s.disp > M537_MAX ? M537_MAX + (s.disp - M537_MAX) / 0.3 : s.disp;
        vt.current.reset(x);
      },
      move: (x, _y, el) => {
        const s = st.current;
        if (!s.drag) return;
        vt.current.add(x);
        s.p = s.sp - (x - s.sx) / pitchPx(el);
        s.disp = m537Rubber(s.p);
      },
      up: (el) => {
        const s = st.current;
        s.drag = false;
        snap(clamp(Math.round(s.p - (vt.current.v / pitchPx(el)) * 0.15), 0, M537_MAX));
      },
      wheel: (d) => {
        const s = st.current;
        const now = performance.now();
        if (Math.abs(d) < 3 || now - s.wheelAt < 300) return;
        s.wheelAt = now;
        snap(clamp(Math.round(s.p) + Math.sign(d), 0, M537_MAX));
      },
      frame: () => {
        const s = st.current;
        if (track.current) track.current.style.transform = `translate3d(${(-s.disp * M537_PITCH).toFixed(3)}%,0,0)`;
        if (bar.current) bar.current.style.transform = `scaleX(${clamp((s.disp + 1) / (M537_MAX + 1), 0.05, 1.1).toFixed(4)})`;
        if (count.current) count.current.textContent = `0${clamp(Math.round(s.disp), 0, M537_MAX) + 1}`;
      },
    },
  );
  return (
    <Stage r={root} g1="rgba(24,196,143,.5)" g2="rgba(79,141,255,.2)">
      <div className="absolute left-[8%] right-[8%] top-[7%] z-[1] flex items-end justify-between">
        <h3 className="text-[clamp(30px,3.2vw,50px)] font-[700] uppercase leading-none tracking-[-0.03em]" style={{ fontFamily: F.sy }}>
          New runners
        </h3>
        <p className="text-[14px] tabular-nums text-white/65">
          <span ref={count}>01</span> / 0{M537_MAX + 1}
        </p>
      </div>
      <div className="absolute inset-x-0 bottom-[16%] top-[20%] cursor-grab touch-none select-none">
        <div ref={track} className="absolute inset-0 will-change-transform">
          {M537_C.map((c, i) => (
            <div key={c.n} className="absolute bottom-0 top-0 w-[26%]" style={{ left: `${8 + i * M537_PITCH}%` }}>
              <div className="relative h-[82%] overflow-hidden rounded-[18px] bg-[#141a26]">
                <Img src={scene(3 - (i % 2) * 3, 600, 600)} />
                <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[12px] font-[600] text-[#0a0d16]">{i < 2 ? "New" : "Bestseller"}</span>
              </div>
              <div className="mt-3 flex items-baseline justify-between text-[16px]" style={{ fontFamily: F.sg }}>
                <span>{c.n}</span>
                <span className="text-white/65">{c.p}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-[8%] left-[8%] right-[8%] z-[1] h-[3px] overflow-hidden rounded-full bg-white/15">
        <div ref={bar} className="h-full origin-left rounded-full bg-[#c8ff8a]" style={{ transform: `scaleX(${1 / (M537_MAX + 1)})` }} />
      </div>
      <Sheen g1="rgba(120,230,180,.5)" />
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M538 · Infinite slider with velocity tilt ───────────────────────── */
const M538_C = [
  { n: "Pine Hollow", s: "Cabins · from ₹ 8,900" },
  { n: "Salt Flats", s: "Camp · from ₹ 5,400" },
  { n: "Red Canyon", s: "Lodge · from ₹ 11,200" },
  { n: "Lake Mirror", s: "Villa · from ₹ 14,600" },
  { n: "Cloud Ridge", s: "Huts · from ₹ 6,800" },
  { n: "Dune Point", s: "Tents · from ₹ 7,300" },
  { n: "Fern Valley", s: "Stays · from ₹ 9,700" },
];
function M538() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const st = useRef({ pos: 0, v: 0, drag: false, sx: 0, sp: 0, shown: 0, lastPos: 0, tiltV: 0 });
  const vt = useRef(velTracker());
  const N = M538_C.length;
  const pitchPx = (el: HTMLElement) => el.clientWidth * 0.24 * 1.12;
  const reveal = (el: HTMLElement, idx: number) => {
    const caps = el.querySelectorAll<HTMLElement>(".m538-cap");
    caps.forEach((c, i) => {
      const w = c.querySelectorAll(".m538-w");
      if (i === idx) gsap.fromTo(w, { yPercent: 110 }, { yPercent: 0, duration: 0.6, stagger: 0.06, ease: "power3.out", overwrite: "auto" });
      else gsap.to(w, { yPercent: 110, duration: 0.25, ease: "power2.in", overwrite: "auto" });
    });
  };
  useFake(
    root,
    dot,
    (fp, el, api) => {
      const W = el.clientWidth;
      const H = el.clientHeight;
      const P = pitchPx(el);
      fp.x = W * 0.5;
      fp.y = H * 0.92;
      const tl = gsap.timeline({ repeat: -1 });
      tl.to(fp, { x: W * 0.62, y: H * 0.46, duration: 0.45, ease: "power2.inOut" })
        .call(api.press)
        .to(fp, { x: W * 0.62 - P * 0.9, duration: 0.28, ease: "power2.in" }) // fling left
        .call(api.release)
        .to(fp, { x: W * 0.36, y: H * 0.88, duration: 0.8, ease: "sine.inOut" }) // coasts, straightens, caption reveals
        .to(fp, { x: W * 0.38, y: H * 0.46, duration: 0.4, ease: "power2.inOut" })
        .call(api.press)
        .to(fp, { x: W * 0.38 + P * 0.75, duration: 0.28, ease: "power2.in" }) // fling right
        .call(api.release)
        .to(fp, { x: W * 0.5, y: H * 0.92, duration: 0.8, ease: "sine.inOut" });
      return tl;
    },
    {
      down: (x, _y, el) => {
        const s = st.current;
        s.drag = true;
        s.sx = x;
        s.sp = s.pos;
        vt.current.reset(x);
        if (s.shown >= 0) {
          s.shown = -1;
          reveal(el, -1);
        }
      },
      move: (x, _y, el) => {
        const s = st.current;
        if (!s.drag) return;
        vt.current.add(x);
        s.pos = s.sp - (x - s.sx) / pitchPx(el);
      },
      up: (el) => {
        const s = st.current;
        s.drag = false;
        s.v = clamp(-vt.current.v / pitchPx(el), -10, 10);
      },
      wheel: (d) => {
        st.current.v = clamp(st.current.v + Math.sign(d) * 1.4, -10, 10);
      },
      frame: (dt, el) => {
        const s = st.current;
        if (!s.drag) {
          s.pos += s.v * dt;
          s.v *= Math.exp(-dt * 3);
          if (Math.abs(s.v) < 0.7) s.pos += (Math.round(s.pos) - s.pos) * (1 - Math.exp(-dt * 7)); // settles on a card
        }
        const vel = (s.pos - s.lastPos) / Math.max(dt, 1 / 240);
        s.lastPos = s.pos;
        s.tiltV += (vel - s.tiltV) * (1 - Math.exp(-dt * 10));
        const tilt = clamp(-s.tiltV * 9, -38, 38);
        el.querySelectorAll<HTMLElement>(".m538-card").forEach((c, i) => {
          const d = wrapD(i, s.pos, N);
          const sc = 1 - Math.min(Math.abs(d), 2) * 0.07;
          c.style.transform = `translate3d(${(d * 112).toFixed(2)}%,0,0) rotateY(${tilt.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
        });
        const idx = mod(Math.round(s.pos), N);
        const settled = !s.drag && Math.abs(s.tiltV) < 0.25 && Math.abs(s.pos - Math.round(s.pos)) < 0.04;
        if (settled && s.shown !== idx) {
          s.shown = idx;
          reveal(el, idx);
        } else if (!settled && s.shown >= 0 && Math.abs(s.tiltV) > 1.2) {
          s.shown = -1;
          reveal(el, -1);
        }
      },
    },
  );
  return (
    <Stage r={root} g1="rgba(255,122,89,.62)" g2="rgba(79,141,255,.3)">
      <p className="absolute left-[5%] top-[6%] z-[1] text-[13px] uppercase tracking-[0.24em] text-white/60">Wander Stays · Out of town</p>
      <div className="absolute inset-x-0 bottom-[10%] top-[13%] cursor-grab touch-none select-none" style={{ perspective: "1200px" }}>
        {M538_C.map((c, i) => {
          const d = wrapD(i, 0, M538_C.length);
          return (
            <div key={c.n} className="m538-card absolute bottom-0 top-0 ml-[-12%] w-[24%] will-change-transform" style={{ left: "50%", transform: `translate3d(${d * 112}%,0,0) scale(${1 - Math.min(Math.abs(d), 2) * 0.07})` }}>
              <div className="h-[76%] overflow-hidden rounded-[18px]">
                <Img src={scene(i, 520, 640)} />
              </div>
              <div className="m538-cap mt-4">
                <p className="overflow-hidden text-[clamp(24px,2.2vw,34px)] leading-[1.1]" style={{ fontFamily: F.is }}>
                  {c.n.split(" ").map((w, j, a) => (
                    <span key={j} className={`m538-w inline-block ${j < a.length - 1 ? "mr-[0.28em]" : ""}`} style={{ transform: i === 0 ? "none" : "translateY(110%)" }}>
                      {w}
                    </span>
                  ))}
                </p>
                <p className="mt-1 overflow-hidden text-[14px] text-white/65">
                  <span className="m538-w inline-block" style={{ transform: i === 0 ? "none" : "translateY(110%)" }}>
                    {c.s}
                  </span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <Sheen g1="rgba(255,150,110,.5)" />
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M539 · Drag-velocity stretch slider (WebGL) ───────────────────────── */
const M539_N = 5;
const M539_CH = 0.62; // card height (stage heights)
const M539_CW = 0.48;
const M539_PITCH = M539_CW + 0.07;
const M539_T = ["Field Study", "Night Bloom", "Coastline", "Golden Hour", "Slow Form"];
const M539_SRC = M539_T.map((t, i) => scene(i, 480, 620, t.toUpperCase()));
const M539_FRAG = /* glsl */ `
uniform float uPos, uBend, uN;
vec3 card(float k, float lx, float ly) {
  return texture2D(uTex0, vec2((k + clamp(lx, 0.004, 0.996)) / uN, clamp(ly, 0.0, 1.0))).rgb;
}
void main() {
  float aspect = uRes.x / uRes.y;
  vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);
  float b = uBend;
  p.x += b * 0.2 * (1.0 - 4.0 * p.y * p.y);   // vertex-style bow: the middle of each image leads the drag
  p.x /= 1.0 + abs(b) * 0.35;                 // and the row stretches with speed
  float cw = ${M539_CW.toFixed(3)}, ch = ${M539_CH.toFixed(3)}, pitch = ${M539_PITCH.toFixed(3)};
  float X = p.x / pitch + uPos;
  float idx = floor(X + 0.5);
  float lx = (X - idx) * pitch / cw + 0.5;
  float ly = p.y / ch + 0.5;
  vec2 q = abs(vec2(lx, ly) - 0.5) * vec2(cw, ch) - (vec2(cw, ch) * 0.5 - 0.022);
  float dist = length(max(q, 0.0)) - 0.022;
  float m = 1.0 - smoothstep(0.0, 0.004, dist);
  float k = mod(idx, uN);
  float ca = b * 0.025;
  vec3 col = vec3(card(k, lx + ca, ly).r, card(k, lx, ly).g, card(k, lx - ca, ly).b);
  gl_FragColor = vec4(col, m);
}`;
function M539() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const fallback = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const st = useRef({ pos: 0, v: 0, drag: false, sx: 0, sp: 0, last: 0, bend: 0, idx: -1 });
  const vt = useRef(velTracker());
  const near = useNear(root);
  const pitchPx = (el: HTMLElement) => el.clientHeight * M539_PITCH;
  useEffect(() => {
    if (!near) return;
    let dead = false;
    let h: GLHandle | null = null;
    (async () => {
      const tex = await atlas(M539_SRC, 480, 620);
      if (dead || !canvas.current) return;
      h = await createShader(canvas.current, M539_FRAG, {
        dpr: 1,
        textures: [tex],
        uniforms: { uPos: { value: 0 }, uBend: { value: 0 }, uN: { value: M539_N } },
        onFrame: (u) => {
          u.uPos.value = st.current.pos;
          u.uBend.value = st.current.bend;
          if (fallback.current && fallback.current.style.visibility !== "hidden") fallback.current.style.visibility = "hidden";
        },
      });
      if (dead) h?.destroy();
    })();
    return () => {
      dead = true;
      h?.destroy();
    };
  }, [near]);
  useFake(
    root,
    dot,
    (fp, el, api) => {
      const W = el.clientWidth;
      const H = el.clientHeight;
      const P = pitchPx(el);
      fp.x = W * 0.5;
      fp.y = H * 0.93;
      const tl = gsap.timeline({ repeat: -1 });
      tl.to(fp, { x: W * 0.6, y: H * 0.5, duration: 0.45, ease: "power2.inOut" })
        .call(api.press)
        .to(fp, { x: W * 0.6 - P * 1.15, duration: 0.34, ease: "power2.in" }) // fast drag left: the images bow and stretch
        .call(api.release)
        .to(fp, { x: W * 0.3, y: H * 0.9, duration: 0.85, ease: "sine.inOut" }) // inertia carries them, they relax flat
        .to(fp, { x: W * 0.36, y: H * 0.5, duration: 0.4, ease: "power2.inOut" })
        .call(api.press)
        .to(fp, { x: W * 0.36 + P * 1.15, duration: 0.34, ease: "power2.in" })
        .call(api.release)
        .to(fp, { x: W * 0.5, y: H * 0.93, duration: 0.85, ease: "sine.inOut" });
      return tl;
    },
    {
      down: (x) => {
        const s = st.current;
        s.drag = true;
        s.sx = x;
        s.sp = s.pos;
        vt.current.reset(x);
      },
      move: (x, _y, el) => {
        const s = st.current;
        if (!s.drag) return;
        vt.current.add(x);
        s.pos = s.sp - (x - s.sx) / pitchPx(el);
      },
      up: (el) => {
        const s = st.current;
        s.drag = false;
        s.v = clamp(-vt.current.v / pitchPx(el), -9, 9);
      },
      wheel: (d) => {
        st.current.v = clamp(st.current.v + Math.sign(d) * 1.2, -9, 9);
      },
      frame: (dt) => {
        const s = st.current;
        if (!s.drag) {
          s.pos += s.v * dt;
          s.v *= Math.exp(-dt * 2.4);
          if (Math.abs(s.v) < 0.5) s.pos += (Math.round(s.pos) - s.pos) * (1 - Math.exp(-dt * 6));
        }
        const vel = (s.pos - s.last) / Math.max(dt, 1 / 240);
        s.last = s.pos;
        s.bend += (clamp(vel / 5, -1, 1) - s.bend) * (1 - Math.exp(-dt * 9));
        const idx = mod(Math.round(s.pos), M539_N);
        if (idx !== s.idx && label.current) {
          s.idx = idx;
          label.current.textContent = `0${idx + 1} · ${M539_T[idx]}`;
        }
      },
    },
  );
  return (
    <Stage r={root} g1="rgba(255,77,109,.5)" g2="rgba(79,141,255,.22)">
      <div className="absolute left-[5%] right-[5%] top-[6%] z-[1] flex items-baseline justify-between">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/60">Studio Arlo · Prints archive</p>
        <p className="text-[13px] uppercase tracking-[0.2em] text-white/55">drag · throw</p>
      </div>
      <div ref={fallback} className="absolute inset-0 flex items-center justify-center gap-[2.2%]">
        {[3, 4, 0, 1, 2].map((i) => (
          <div key={i} className="h-[62%] shrink-0 overflow-hidden rounded-[14px]" style={{ aspectRatio: `${M539_CW} / ${M539_CH}` }}>
            <Img src={M539_SRC[i]} />
          </div>
        ))}
      </div>
      <canvas ref={canvas} className="absolute inset-0 h-full w-full cursor-grab touch-none opacity-0 transition-opacity duration-300" aria-hidden />
      <div className="pointer-events-none absolute bottom-[6%] left-[5%] right-[5%] z-[1] flex items-baseline justify-between">
        <p className="text-[clamp(20px,1.8vw,28px)] font-[600] tracking-[-0.02em]" style={{ fontFamily: F.sg }}>
          <span ref={label}>01 · Field Study</span>
        </p>
        <p className="text-[14px] text-white/65">Giclée print, A2 · ₹ 6,500</p>
      </div>
      <Sheen g1="rgba(255,120,140,.5)" />
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M540 · Curved circular gallery (scrub, WebGL) ───────────────────────── */
const M540_N = 6;
const M540_T = ["Atelier", "Harbour", "Orchard", "Foundry", "Gallery", "Terrace"];
const M540_SRC = M540_T.map((t, i) => scene(i, 440, 600, t.toUpperCase()));
const M540_FRAG = /* glsl */ `
uniform float uPos, uN;
void main() {
  float aspect = uRes.x / uRes.y;
  vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);
  float R = aspect * 0.56;
  float sx = clamp(p.x / R, -0.999, 0.999);
  float th = asin(sx);
  float s = R * th;                              // arc length along the curved plane
  float drop = 0.3 * (1.0 - cos(th));            // the plane bends down along the arc
  float cw = 0.36, ch = 0.5, pitch = 0.41;
  float X = s / pitch + uPos;
  float idx = floor(X + 0.5);
  float lx = (X - idx) * pitch / cw + 0.5;
  float ly = (p.y - 0.06 + drop) / ch + 0.5;
  vec2 q = abs(vec2(lx, ly) - 0.5) * vec2(cw, ch) - (vec2(cw, ch) * 0.5 - 0.02);
  float dist = length(max(q, 0.0)) - 0.02;
  float m = (1.0 - smoothstep(0.0, 0.004, dist)) * (1.0 - smoothstep(0.93, 0.999, abs(sx)));
  float k = mod(idx, uN);
  vec3 col = texture2D(uTex0, vec2((k + clamp(lx, 0.004, 0.996)) / uN, clamp(ly, 0.0, 1.0))).rgb;
  col *= 1.0 - 0.5 * th * th;                    // edges turn away from the light
  gl_FragColor = vec4(col, m);
}`;
function M540() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const fallback = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const prog = useRef(0);
  const drag = useRef({ off: 0, on: false, sx: 0, so: 0 });
  const near = useNear(root);
  useScrub(root, (p) => {
    prog.current = p; // linear over the whole panel
    if (label.current) label.current.textContent = `${Math.round(p * 100)}%`;
  });
  useEffect(() => {
    if (!near) return;
    let dead = false;
    let h: GLHandle | null = null;
    (async () => {
      const tex = await atlas(M540_SRC, 440, 600);
      if (dead || !canvas.current) return;
      h = await createShader(canvas.current, M540_FRAG, {
        dpr: 1,
        textures: [tex],
        uniforms: { uPos: { value: 0 }, uN: { value: M540_N } },
        onFrame: (u) => {
          u.uPos.value = -1 + prog.current * 6 + drag.current.off;
          if (fallback.current && fallback.current.style.visibility !== "hidden") fallback.current.style.visibility = "hidden";
        },
      });
      if (dead) h?.destroy();
    })();
    return () => {
      dead = true;
      h?.destroy();
    };
  }, [near]);
  // drag also turns the wheel (real pointer only: the scrub drives it in recordings)
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const d = drag.current;
    const down = (e: PointerEvent) => {
      d.on = true;
      d.sx = e.clientX;
      d.so = d.off;
    };
    const move = (e: PointerEvent) => {
      if (d.on) d.off = d.so - (e.clientX - d.sx) / (el.clientHeight * 0.41);
    };
    const up = () => (d.on = false);
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);
  return (
    <Stage r={root} g1="rgba(79,141,255,.5)" g2="rgba(224,145,63,.22)">
      <div className="absolute left-[5%] right-[5%] top-[6%] z-[1] flex items-baseline justify-between">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/60">Common Ground · Spaces to hire</p>
        <p className="text-[13px] tabular-nums text-white/55">
          turned <span ref={label}>100%</span>
        </p>
      </div>
      <div ref={fallback} className="absolute inset-0">
        {[-2, -1, 0, 1, 2].map((d) => (
          <div key={d} className="absolute top-[22%] h-[50%] w-[23%] overflow-hidden rounded-[12px]" style={{ left: `${38.5 + d * 24}%`, transform: `translateY(${Math.abs(d) * Math.abs(d) * 4}%) rotate(${d * 6}deg)`, opacity: 1 - Math.abs(d) * 0.25 }}>
            <Img src={M540_SRC[(d + 6) % 6]} />
          </div>
        ))}
      </div>
      <canvas ref={canvas} className="absolute inset-0 h-full w-full cursor-grab touch-none opacity-0 transition-opacity duration-300" aria-hidden />
      <div className="pointer-events-none absolute bottom-[6%] left-[5%] right-[5%] z-[1] flex items-baseline justify-between">
        <h3 className="text-[clamp(28px,2.8vw,44px)] leading-none" style={{ fontFamily: F.fr, fontWeight: 500 }}>
          Six rooms, one wheel
        </h3>
        <p className="text-[14px] text-white/65">Day hire from ₹ 12,000</p>
      </div>
      <Sheen g1="rgba(120,170,255,.5)" />
    </Stage>
  );
}

/* ───────────────────────── M541 · Tilting slide carousel ───────────────────────── */
const M541_S = [
  { n: "Sea Terrace Suite", p: "₹ 22,400 / night", i: 0 },
  { n: "Garden Pavilion", p: "₹ 16,800 / night", i: 2 },
  { n: "Sunset Loft", p: "₹ 19,500 / night", i: 1 },
  { n: "Courtyard Room", p: "₹ 12,900 / night", i: 3 },
  { n: "Cliff Villa", p: "₹ 34,000 / night", i: 0 },
];
function m541Look(d: number) {
  const a = Math.min(Math.abs(d), 1.5);
  return { s: 1 - Math.min(a, 1) * 0.16, dim: Math.min(a, 1) * 0.55 };
}
function M541() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const st = useRef({ pos: 0, rx: 0, ry: 0, tx: 0, ty: 0, tw: null as gsap.core.Tween | null });
  const N = M541_S.length;
  const go = (d: number, btn?: Element | null) => {
    const s = st.current;
    const to = Math.round((s.tw ? (s.tw.vars.pos as number) : s.pos) + d);
    s.tw?.kill();
    s.tw = gsap.to(s, { pos: to, duration: 0.8, ease: "power3.inOut", onComplete: () => (s.tw = null) });
    if (btn) gsap.fromTo(btn, { scale: 0.84 }, { scale: 1, duration: 0.35, ease: "power2.out" });
  };
  useEffect(() => () => void st.current.tw?.kill(), []);
  useFake(
    root,
    dot,
    (fp, el) => {
      const W = el.clientWidth;
      const H = el.clientHeight;
      const nb = el.querySelector(".m541-next");
      const [nx, ny] = centre(nb!, el);
      fp.x = nx;
      fp.y = ny;
      const tl = gsap.timeline({ repeat: -1 });
      // wander over the active slide (it tilts toward the ring), then press next
      tl.to(fp, { x: W * 0.38, y: H * 0.24, duration: 0.45, ease: "power2.inOut" })
        .to(fp, { x: W * 0.62, y: H * 0.3, duration: 0.45, ease: "sine.inOut" })
        .to(fp, { x: W * 0.58, y: H * 0.62, duration: 0.4, ease: "sine.inOut" })
        .to(fp, { x: nx, y: ny, duration: 0.4, ease: "power2.inOut" })
        .call(() => go(1, nb));
      return tl;
    },
    {
      hover: (x, y, el) => {
        const s = st.current;
        const W = el.clientWidth;
        const H = el.clientHeight;
        const nx = (x - W * 0.5) / (W * 0.23);
        const ny = (y - H * 0.43) / (H * 0.35);
        const inside = Number.isFinite(nx) && Math.abs(nx) <= 1 && Math.abs(ny) <= 1;
        s.tx = inside ? nx : 0;
        s.ty = inside ? ny : 0;
      },
      frame: (dt, el) => {
        const s = st.current;
        const k = 1 - Math.exp(-dt * 6);
        s.rx += (-s.ty * 7 - s.rx) * k;
        s.ry += (s.tx * 10 - s.ry) * k;
        el.querySelectorAll<HTMLElement>(".m541-slide").forEach((c, i) => {
          const d = wrapD(i, s.pos, N);
          const L = m541Look(d);
          const w = Math.max(0, 1 - Math.abs(d) * 2); // only the active slide tilts
          c.style.transform = `translate3d(${(d * 104).toFixed(2)}%,0,0) perspective(1100px) rotateX(${(s.rx * w).toFixed(2)}deg) rotateY(${(s.ry * w).toFixed(2)}deg) scale(${L.s.toFixed(4)})`;
          c.style.zIndex = String(50 - Math.round(Math.abs(d) * 10));
          (c.querySelector(".m541-dim") as HTMLElement).style.opacity = L.dim.toFixed(3);
        });
        if (count.current) count.current.textContent = `0${mod(Math.round(s.pos), N) + 1}`;
      },
    },
  );
  return (
    <Stage r={root} g1="rgba(255,179,107,.5)" g2="rgba(79,141,255,.22)">
      {M541_S.map((sl, i) => {
        const d = wrapD(i, 0, M541_S.length);
        const L = m541Look(d);
        return (
          <div key={sl.n} className="m541-slide absolute top-[8%] ml-[-23%] h-[70%] w-[46%] will-change-transform" style={{ left: "50%", transform: `translate3d(${d * 104}%,0,0) scale(${L.s})`, zIndex: 50 - Math.round(Math.abs(d) * 10) }}>
            <div className="relative h-full overflow-hidden rounded-[22px] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,.45)]">
              <Img src={scene(sl.i, 1100, 800)} />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6 pt-16">
                <p className="text-[13px] uppercase tracking-[0.22em] text-white/70">Maris Bay Resort</p>
                <h3 className="mt-1 text-[clamp(28px,2.6vw,42px)] leading-none" style={{ fontFamily: F.fr, fontWeight: 500 }}>
                  {sl.n}
                </h3>
                <p className="mt-2 text-[15px] text-white/80">{sl.p}</p>
              </div>
              <div className="m541-dim absolute inset-0 bg-[#05080f]" style={{ opacity: L.dim }} />
            </div>
          </div>
        );
      })}
      <div className="absolute bottom-[6%] left-1/2 z-[300] ml-[-110px] flex w-[220px] items-center justify-between">
        <button type="button" className="m541-prev grid h-12 w-12 place-items-center rounded-full border border-white/30 text-[18px]" onClick={(e) => go(-1, e.currentTarget)} aria-label="Previous">
          ←
        </button>
        <p className="text-[14px] tabular-nums text-white/75">
          <span ref={count}>01</span> / 0{N}
        </p>
        <button type="button" className="m541-next grid h-12 w-12 place-items-center rounded-full bg-white text-[18px] text-[#0a0d16]" onClick={(e) => go(1, e.currentTarget)} aria-label="Next">
          →
        </button>
      </div>
      <Sheen g1="rgba(255,190,130,.5)" />
      <Dot r={dot} />
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M530", name: "Scattered polaroids, pick to centre", how: "Polaroids lie scattered; the picked one rises upright to the centre while the rest re-scatter to the sides, then flips to show its back. Auto-picks in turn.", kind: "play", C: M530 },
  { code: "M531", name: "Throwable polaroid pile", how: "A dozen polaroids over a big word: grab one and throw it, it tilts with speed and lands on top of the pile. A ring throws them by itself.", kind: "play", C: M531 },
  { code: "M532", name: "Photo pile pop-in", how: "Photos pop in one by one from scale 0.2 (back.out), each settling at its own angle into a pile; hover straightens a photo.", kind: "play", C: M532 },
  { code: "M533", name: "Spine accordion", how: "Projects stand as thin spines with sideways titles; one opens into a framed image while the others stay thin. Opens in turn.", kind: "play", C: M533 },
  { code: "M534", name: "Vertical expand-on-hover rows", how: "Stacked product rows: the hovered row grows tall to show its photo while the others compress to a single line.", kind: "play", C: M534 },
  { code: "M535", name: "Seamless loop with centre scale", how: "A wrapping card loop: the card nearest the centre scales up and brightens, outer ones shrink and dim. Buttons, drag or wheel.", kind: "play", C: M535 },
  { code: "M536", name: "Auto-drift grab carousel", how: "A strip drifts on its own; grabbing slows it to a stop, a throw adds speed, the wheel nudges, then it eases back to the drift.", kind: "play", C: M536 },
  { code: "M537", name: "Snap carousel with rubber-band ends", how: "Drag or wheel a product row: release snaps stiffly to the nearest card, and pulling past either end stretches with resistance.", kind: "play", C: M537 },
  { code: "M538", name: "Infinite slider with velocity tilt", how: "Fling an endless gallery: cards tilt on Y with the speed and straighten as it slows; the settled card's caption rises in.", kind: "play", C: M538 },
  { code: "M539", name: "Drag-velocity stretch slider", how: "Drag a WebGL slider: the images bow and stretch with drag speed, inertia carries them on release and they relax flat.", kind: "play", C: M539 },
  { code: "M540", name: "Curved circular gallery", how: "Scroll (or drag): images ride a curved WebGL plane, bending down and darkening along an arc like a turning wheel.", kind: "scrub", C: M540 },
  { code: "M541", name: "Tilting slide carousel", how: "Big slides: the active one tilts toward the pointer at full size while neighbours scale down and dim; next/prev slide with an ease.", kind: "play", C: M541 },
];
