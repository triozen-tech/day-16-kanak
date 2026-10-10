"use client";

// Micro-interactions, batch 5 · group 2 (MOTION-MENU U62–U66). Small focused demos for /lab/motion.
// Every hover / click demo also plays by itself: a visible fake pointer (ring) walks or sweeps over the targets and
// drives the same state the real mouse does; the real mouse takes over for 2.5 s whenever it moves. U65 (fly to cart)
// runs a looping click script while on screen. A CSS-only glow loop never stops (and sits on top again, screen-blended).
// ?static=1 / reduced motion: no JS animation, the markup shows the hovered / final state of the first item.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { scene, useTicker } from "@/components/fx/shared";
import { Product } from "@/components/sections/kit";
import type { MotionDef } from "./types";

const F = {
  sg: "Space Grotesk Variable",
  fr: "Fraunces Variable",
  is: "Instrument Serif",
  sy: "Syne Variable",
  mr: "Manrope Variable",
};

const EZ = "cubic-bezier(.2,.7,.2,1)";
const EIO = "cubic-bezier(.65,0,.35,1)";

const CSS = `
.b5g2u-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.55)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.22)),transparent 70%);animation:b5g2u-drift 5.6s linear infinite alternate;will-change:transform}
@keyframes b5g2u-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b5g2u-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;pointer-events:none;z-index:40;opacity:0;transition:opacity .25s}
.b5g2u-dot>span{display:block;width:100%;height:100%;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4)}

/* U62 underline + rotating arrow */
.u62-l{position:relative;display:inline-flex;align-items:center;gap:.32em;color:rgba(238,242,255,.6);transition:color .3s}
.u62-ul{position:absolute;left:0;right:0;bottom:-.08em;height:3px;background:#ffb36b;transform:scaleX(0);transform-origin:0 50%;transition:transform .3s ${EZ}}
.u62-ar{display:inline-block;width:.62em;height:.62em;transition:transform .3s ${EZ}}
.u62-l.on{color:#fff}
.u62-l.on .u62-ul{transform:scaleX(1)}
.u62-l.on .u62-ar{transform:rotate(-45deg)}

/* U64 directional underline + arrow lift */
.u64-l{position:relative;display:inline-flex;align-items:flex-start;gap:.22em;color:rgba(238,242,255,.6);transition:color .3s}
.u64-ul{position:absolute;left:0;right:0;bottom:-.06em;height:2px;background:#c8ff8a;transform:scaleX(0);transition:transform .45s ${EIO}}
.u64-l[data-from=left] .u64-ul{transform-origin:0 50%}
.u64-l[data-from=right] .u64-ul{transform-origin:100% 50%}
.u64-l[data-from=centre] .u64-ul{transform-origin:50% 50%}
.u64-box{display:inline-block;width:.5em;height:.5em;overflow:hidden;margin-top:.12em}
.u64-ar{display:block;width:100%;height:100%;transform:translate(-110%,110%);transition:transform .45s ${EZ} .08s}
.u64-l.on{color:#fff}
.u64-l.on .u64-ul{transform:scaleX(1)}
.u64-l.on .u64-ar{transform:translate(0,0)}

/* U65 cart */
.u65-btn{transition:background-color .25s,color .25s,transform .2s}
.u65-btn.on{background:#fff;color:#0b0d14;transform:scale(.95)}
.u65-badge{transition:transform .25s ${EZ}}

/* U66 tilt */
.u66-scene{perspective:1100px}
.u66-card{transform-style:preserve-3d;will-change:transform}
.u66-card>*{transform-style:preserve-3d}

html.is-static .b5g2u-glow{animation:none}
html.is-static {
  .b5g2u-glow{animation:none}
  .u62-l,.u62-ul,.u62-ar,.u64-l,.u64-ul,.u64-ar,.u65-btn,.u65-badge{transition:none}
}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop, again on top (screen blend) so covered stages never freeze. */
function Stage({ r, children, g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; g1?: string; g2?: string }) {
  return (
    <div ref={r} className="relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0d16] text-[#eef2ff]">
      <style href="b5g2u-css" precedence="default">
        {CSS}
      </style>
      <div className="b5g2u-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
      <div className="b5g2u-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.4, zIndex: 35 } as CSSProperties} aria-hidden />
    </div>
  );
}

/** The visible fake pointer (a ring). Its inner span can be scaled for a "press". */
const Dot = ({ r }: { r: RefObject<HTMLDivElement | null> }) => (
  <div ref={r} className="b5g2u-dot" aria-hidden>
    <span />
  </div>
);

type Pt = { x: number; y: number; inside: boolean };
type Box = { l: number; t: number; w: number; h: number };

function rel(node: Element, root: Element): Box {
  const a = node.getBoundingClientRect();
  const r = root.getBoundingClientRect();
  return { l: a.left - r.left, t: a.top - r.top, w: a.width, h: a.height };
}
const inBox = (b: Box, x: number, y: number) => x >= b.l && x <= b.l + b.w && y >= b.t && y <= b.t + b.h;

/** Pointer driver: the real mouse wins for 2.5 s after it last moved; otherwise `script` moves a visible fake ring. */
function usePointer(root: RefObject<HTMLDivElement | null>, dot: RefObject<HTMLDivElement | null>, script: (t: number, el: HTMLDivElement) => Pt, frame: (p: Pt, el: HTMLDivElement, fake: boolean) => void) {
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
    fr.current(p, el, !useReal);
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
 *  holds the pointer (fake or real) gets the class "on". */
function useWalk(
  root: RefObject<HTMLDivElement | null>,
  dot: RefObject<HTMLDivElement | null>,
  o: { sel: string; order: number[]; seg?: number; move?: number; wob?: number; at?: (b: Box, i: number) => [number, number]; off?: (w: number, h: number) => [number, number] },
) {
  const cur = useRef(-2);
  usePointer(
    root,
    dot,
    (t, el) => {
      const tg = el.querySelectorAll(o.sel);
      const w = el.clientWidth;
      const h = el.clientHeight;
      const pts: [number, number][] = o.order.map((i) => {
        if (i < 0 || !tg[i]) return o.off ? o.off(w, h) : [w * 0.5, h * 0.92];
        const b = rel(tg[i], el);
        return o.at ? o.at(b, i) : [b.l + b.w / 2, b.t + b.h / 2];
      });
      const [x, y] = stepPath(t, pts, o.seg ?? 1.2, o.move ?? 0.4);
      const wb = o.wob ?? 6;
      return { x: x + Math.sin(t * 2.1) * wb, y: y + Math.cos(t * 1.7) * wb * 0.6, inside: true };
    },
    (p, el) => {
      const tg = [...el.querySelectorAll(o.sel)];
      const idx = p.inside ? tg.findIndex((n) => inBox(rel(n, el), p.x, p.y)) : -1;
      if (idx === cur.current) return;
      cur.current = idx;
      tg.forEach((n, i) => n.classList.toggle("on", i === idx));
    },
  );
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

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, className = "", w = 600, h = 800 }: { i: number; className?: string; w?: number; h?: number }) => (
  <img src={scene(i, w, h)} alt="" className={`block h-full w-full object-cover ${className}`} draggable={false} />
);

const Eyebrow = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <p className={`text-[13px] uppercase tracking-[0.22em] text-white/55 ${className}`} style={{ fontFamily: F.sg }}>
    {children}
  </p>
);

/* ───────────────────────── U62 · Underline + rotating arrow link ───────────────────────── */
const U62_LINKS = ["Shop the linen edit", "Read the journal", "Book a fitting"];
function U62() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useWalk(root, dot, { sel: ".u62-l", order: [0, 1, 2, -1], seg: 1.0, move: 0.42, at: (b) => [b.l + b.w * 0.55, b.t + b.h * 0.5], off: (w, h) => [w * 0.8, h * 0.82] });
  return (
    <Stage r={root} g1="rgba(255,179,107,.55)" g2="rgba(176,48,106,.25)">
      <div className="absolute inset-0 flex items-center px-[8%]">
        <div className="w-[min(46%,560px)]">
          <Eyebrow>Atelier Noor · Summer 26</Eyebrow>
          <p className="mt-5 text-[clamp(40px,4.6vw,72px)] leading-[0.95] text-white" style={{ fontFamily: F.is }}>
            Cut slow, <em>worn often.</em>
          </p>
          <p className="mt-5 max-w-[40ch] text-[15px] leading-relaxed text-white/60" style={{ fontFamily: F.mr }}>
            Washed linen shirts from ₹3,450. Tailored in small runs, hemmed by hand.
          </p>
        </div>
        <nav className="ml-auto flex flex-col items-start gap-[4.5vh]">
          {U62_LINKS.map((t, i) => (
            <a key={t} href="#u62" onClick={(e) => e.preventDefault()} className={`u62-l text-[clamp(28px,2.9vw,46px)] font-[500] tracking-[-0.01em] ${i === 0 ? "on" : ""}`} style={{ fontFamily: F.sg }} data-cursor="Open">
              {t}
              <svg className="u62-ar" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 12h16M13 5l7 7-7 7" />
              </svg>
              <span className="u62-ul" aria-hidden />
            </a>
          ))}
        </nav>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U63 · Cursor parallax floating layers ───────────────────────── */
// each layer: depth in px of travel at full pointer offset (opposite to the pointer)
const U63_LAYERS: { d: number; cls: string; node: ReactNode }[] = [
  {
    d: 14,
    cls: "inset-0 grid place-items-center",
    node: (
      <p className="select-none whitespace-nowrap text-[clamp(110px,15vw,230px)] font-[800] leading-none tracking-[-0.05em] text-white/[0.08]" style={{ fontFamily: F.sy }}>
        DRIFT
      </p>
    ),
  },
  { d: 30, cls: "left-[20%] top-[16%] h-[34%] aspect-square rounded-full", node: <div className="h-full w-full rounded-full bg-[radial-gradient(circle_at_35%_30%,#9fd8ff,#2f8cff_55%,#0b1020)] opacity-80" /> },
  { d: 46, cls: "right-[18%] bottom-[14%] h-[26%] aspect-square", node: <div className="h-full w-full rounded-full border-[3px] border-[#c8ff8a]/70" /> },
  { d: 62, cls: "right-[30%] top-[12%] h-[12%] aspect-square", node: <div className="h-full w-full rotate-12 rounded-[14px] bg-[#ff7a59]" /> },
  {
    d: 36,
    cls: "inset-y-[6%] left-1/2 w-[22%] -ml-[11%] grid place-items-center",
    node: <Product angle={1} accent="#2f8cff" className="h-full w-auto drop-shadow-[0_30px_40px_rgba(0,0,0,.55)]" />,
  },
  {
    d: 78,
    cls: "left-[10%] bottom-[16%]",
    node: (
      <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-md">
        <p className="text-[13px] uppercase tracking-[0.2em] text-white/60" style={{ fontFamily: F.sg }}>
          Driftwell Sparkling
        </p>
        <p className="mt-1 text-[22px] font-[600]" style={{ fontFamily: F.sg }}>
          Yuzu & sea salt · ₹180
        </p>
      </div>
    ),
  },
  {
    d: 96,
    cls: "right-[9%] top-[40%]",
    node: <p className="rounded-full bg-[#c8ff8a] px-4 py-2 text-[14px] font-[700] text-[#0b1020]" style={{ fontFamily: F.sg }}>0 g sugar</p>,
  },
];
function U63() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const qs = useRef<{ x: gsap.QuickToFunc; y: gsap.QuickToFunc; d: number }[]>([]);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      qs.current = gsap.utils.toArray<HTMLElement>(".u63-layer", el).map((n) => ({
        x: gsap.quickTo(n, "x", { duration: 0.9, ease: "power3.out" }),
        y: gsap.quickTo(n, "y", { duration: 0.9, ease: "power3.out" }),
        d: Number(n.dataset.depth) || 0,
      }));
    }, el);
    return () => {
      qs.current = [];
      ctx.revert();
    };
  }, []);
  usePointer(
    root,
    dot,
    // slow figure-eight over the stage
    (t, el) => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      return { x: w * 0.5 + Math.sin(t * 1.25) * w * 0.32, y: h * 0.5 + Math.sin(t * 2.5) * h * 0.26, inside: true };
    },
    (p, el) => {
      const nx = gsap.utils.clamp(-1, 1, (p.x / el.clientWidth - 0.5) * 2);
      const ny = gsap.utils.clamp(-1, 1, (p.y / el.clientHeight - 0.5) * 2);
      const k = p.inside ? 1 : 0;
      for (const q of qs.current) {
        q.x(-nx * q.d * k);
        q.y(-ny * q.d * 0.7 * k);
      }
    },
  );
  return (
    <Stage r={root} g1="rgba(47,140,255,.58)" g2="rgba(200,255,138,.18)">
      {U63_LAYERS.map((l, i) => (
        <div key={i} className={`u63-layer absolute ${l.cls}`} data-depth={l.d}>
          {l.node}
        </div>
      ))}
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U64 · Directional underline + arrow lift ───────────────────────── */
const U64_LINKS: { t: string; from: "left" | "right" | "centre" }[] = [
  { t: "Studio", from: "left" },
  { t: "Residencies", from: "centre" },
  { t: "Archive", from: "right" },
];
function U64() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useWalk(root, dot, {
    sel: ".u64-l",
    order: [0, 1, 2, -1],
    seg: 1.0,
    move: 0.42,
    at: (b, i) => [b.l + b.w * (i === 0 ? 0.25 : i === 2 ? 0.75 : 0.5), b.t + b.h * 0.55],
    off: (w, h) => [w * 0.5, h * 0.86],
  });
  return (
    <Stage r={root} g1="rgba(200,255,138,.5)" g2="rgba(79,141,255,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[7vh]">
        <Eyebrow>Halden Works · architecture & objects</Eyebrow>
        <nav className="flex items-end gap-[6vw]">
          {U64_LINKS.map((l, i) => (
            <div key={l.t} className="flex flex-col items-center gap-4">
              <a href="#u64" onClick={(e) => e.preventDefault()} data-from={l.from} className={`u64-l text-[clamp(36px,4.2vw,68px)] leading-none tracking-[-0.02em] ${i === 0 ? "on" : ""}`} style={{ fontFamily: F.fr, fontWeight: 500 }} data-cursor="Open">
                {l.t}
                <span className="u64-box" aria-hidden>
                  <svg className="u64-ar" viewBox="0 0 24 24" fill="none" stroke="#c8ff8a" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 18L18 6M8 6h10v10" />
                  </svg>
                </span>
                <span className="u64-ul" aria-hidden />
              </a>
              <p className="text-[12px] uppercase tracking-[0.24em] text-white/40" style={{ fontFamily: F.sg }}>
                from {l.from}
              </p>
            </div>
          ))}
        </nav>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U65 · Fly to cart arc ───────────────────────── */
const U65_ITEMS = [
  { n: "Ember Pour-over", p: "₹1,890", i: 3 },
  { n: "Tide Tumbler", p: "₹1,240", i: 0 },
  { n: "Fern Carafe", p: "₹2,150", i: 2 },
];
function U65() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const fly = useRef<(i: number) => void>(() => {});
  usePlay(root, (el, onClean) => {
    const cart = el.querySelector<HTMLElement>(".u65-cart")!;
    const badge = el.querySelector<HTMLElement>(".u65-badge")!;
    const btns = [...el.querySelectorAll<HTMLElement>(".u65-btn")];
    const imgs = [...el.querySelectorAll<HTMLElement>(".u65-img")];
    const d = dot.current!;
    const clones: HTMLElement[] = [];
    let count = 0;
    badge.textContent = "0";
    onClean(() => clones.forEach((c) => c.remove()));
    fly.current = (i: number) => {
      const src = imgs[i];
      const a = rel(src, el);
      const c = rel(cart, el);
      const s = Math.min(a.w, a.h) * 0.62;
      const clone = src.cloneNode(true) as HTMLElement;
      Object.assign(clone.style, { position: "absolute", left: "0px", top: "0px", width: `${s}px`, height: `${s}px`, borderRadius: "18px", overflow: "hidden", zIndex: "30", boxShadow: "0 20px 40px rgba(0,0,0,.5)", pointerEvents: "none" });
      el.appendChild(clone);
      clones.push(clone);
      const x0 = a.l + a.w / 2 - s / 2;
      const y0 = a.t + a.h / 2 - s / 2;
      const x2 = c.l + c.w / 2 - s / 2;
      const y2 = c.t + c.h / 2 - s / 2;
      // quadratic bezier: control point high above the midpoint → a clear arc
      const x1 = (x0 + x2) / 2;
      const y1 = Math.min(y0, y2) - el.clientHeight * 0.32;
      const o = { t: 0 };
      gsap.set(clone, { x: x0, y: y0 });
      gsap.to(o, {
        t: 1,
        duration: 0.85,
        ease: "power1.inOut",
        onUpdate: () => {
          const t = o.t;
          const u = 1 - t;
          gsap.set(clone, { x: u * u * x0 + 2 * u * t * x1 + t * t * x2, y: u * u * y0 + 2 * u * t * y1 + t * t * y2, scale: 1 - 0.8 * t, rotation: -18 * t, opacity: t > 0.9 ? (1 - t) * 10 : 1 });
        },
        onComplete: () => {
          clone.remove();
          clones.splice(clones.indexOf(clone), 1);
          count = (count % 9) + 1;
          badge.textContent = String(count);
          gsap.fromTo(cart, { scale: 1, rotation: 0 }, { scale: 1.22, rotation: -8, duration: 0.14, yoyo: true, repeat: 1, ease: "power2.out" });
          gsap.fromTo(badge, { scale: 0.4 }, { scale: 1, duration: 0.35, ease: "back.out(3)" });
        },
      });
    };
    const tl = gsap.timeline({ repeat: -1, paused: true });
    tl.set(d, { opacity: 1 });
    btns.forEach((b, i) => {
      const bx = rel(b, el);
      tl.to(d, { x: bx.l + bx.w * 0.5, y: bx.t + bx.h * 0.5, duration: 0.5, ease: "power2.inOut" })
        .to(d.firstElementChild, { scale: 0.65, duration: 0.1, yoyo: true, repeat: 1 })
        .call(() => b.classList.add("on"), [], "<")
        .call(() => fly.current(i), [], "<0.1")
        .call(() => b.classList.remove("on"), [], "+=0.15")
        .to(d, { x: "+=36", y: "-=26", duration: 0.55, ease: "sine.inOut" });
    });
    onClean(() => (fly.current = () => {}));
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(224,145,63,.55)" g2="rgba(47,140,255,.2)">
      <div className="absolute inset-x-[5%] top-[7%] flex items-center justify-between">
        <p className="text-[clamp(26px,2.6vw,40px)] tracking-[-0.01em]" style={{ fontFamily: F.fr, fontWeight: 500 }}>
          Kiln & Kettle · brew ware
        </p>
        <div className="u65-cart relative grid h-14 w-14 place-items-center rounded-full border border-white/20 bg-white/10" aria-label="Cart">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 8h14l-1.4 11H6.4z" />
            <path d="M9 8V6a3 3 0 0 1 6 0v2" />
          </svg>
          <span className="u65-badge absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full bg-[#ffb36b] px-1 text-[12px] font-[800] text-[#140f07]" style={{ fontFamily: F.sg }}>
            3
          </span>
        </div>
      </div>
      <div className="absolute inset-x-[5%] bottom-[7%] top-[24%] grid grid-cols-3 gap-[2.4vw]">
        {U65_ITEMS.map((it, i) => (
          <div key={it.n} className="flex min-h-0 flex-col rounded-[22px] border border-white/10 bg-white/[0.04] p-3">
            <div className="u65-img min-h-0 flex-1 overflow-hidden rounded-[16px]">
              <Img i={it.i} w={600} h={500} />
            </div>
            <div className="flex items-center justify-between gap-3 px-1 pt-3">
              <div>
                <p className="text-[17px] font-[600]" style={{ fontFamily: F.sg }}>
                  {it.n}
                </p>
                <p className="text-[14px] text-white/60">{it.p}</p>
              </div>
              <button type="button" onClick={() => fly.current(i)} className="u65-btn rounded-full bg-[#ffb36b] px-5 py-2.5 text-[14px] font-[700] text-[#140f07]" style={{ fontFamily: F.sg }} data-cursor="Add">
                Add +
              </button>
            </div>
          </div>
        ))}
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U66 · Tilt with layered content ───────────────────────── */
function U66() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const q = useRef<{ rx: gsap.QuickToFunc; ry: gsap.QuickToFunc; sx: gsap.QuickToFunc; sy: gsap.QuickToFunc; layers: { x: gsap.QuickToFunc; y: gsap.QuickToFunc; d: number }[] } | null>(null);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const card = el.querySelector(".u66-card")!;
      const shine = el.querySelector(".u66-shine")!;
      q.current = {
        rx: gsap.quickTo(card, "rotationX", { duration: 0.7, ease: "power3.out" }),
        ry: gsap.quickTo(card, "rotationY", { duration: 0.7, ease: "power3.out" }),
        sx: gsap.quickTo(shine, "xPercent", { duration: 0.7, ease: "power3.out" }),
        sy: gsap.quickTo(shine, "yPercent", { duration: 0.7, ease: "power3.out" }),
        layers: gsap.utils.toArray<HTMLElement>(".u66-layer", el).map((n) => ({
          x: gsap.quickTo(n, "x", { duration: 0.8, ease: "power3.out" }),
          y: gsap.quickTo(n, "y", { duration: 0.8, ease: "power3.out" }),
          d: Number(n.dataset.depth) || 0,
        })),
      };
    }, el);
    return () => {
      q.current = null;
      ctx.revert();
    };
  }, []);
  usePointer(
    root,
    dot,
    // slow figure-eight across the card
    (t, el) => {
      const c = el.querySelector(".u66-card");
      const b = c ? rel(c, el) : { l: 0, t: 0, w: el.clientWidth, h: el.clientHeight };
      return { x: b.l + b.w * (0.5 + Math.sin(t * 1.3) * 0.42), y: b.t + b.h * (0.5 + Math.sin(t * 2.6) * 0.36), inside: true };
    },
    (p, el) => {
      const Q = q.current;
      const c = el.querySelector(".u66-card");
      if (!Q || !c) return;
      // measure the card's untransformed box via its scene wrapper (the tilt itself changes the card's rect)
      const b = rel(c.parentElement!, el);
      const nx = p.inside ? gsap.utils.clamp(-1, 1, ((p.x - b.l) / b.w - 0.5) * 2) : 0;
      const ny = p.inside ? gsap.utils.clamp(-1, 1, ((p.y - b.t) / b.h - 0.5) * 2) : 0;
      Q.ry(nx * 16);
      Q.rx(-ny * 14);
      Q.sx(nx * 40);
      Q.sy(ny * 40);
      for (const l of Q.layers) {
        l.x(nx * l.d);
        l.y(ny * l.d * 0.8);
      }
    },
  );
  return (
    <Stage r={root} g1="rgba(255,77,109,.52)" g2="rgba(255,179,107,.24)">
      <div className="absolute inset-0 flex items-center justify-center gap-[7vw] px-[6%]">
        <div className="max-w-[min(34%,420px)]">
          <Eyebrow>Solenne · fragrance</Eyebrow>
          <p className="mt-4 text-[clamp(40px,4.4vw,70px)] leading-[0.95]" style={{ fontFamily: F.is }}>
            Depth you can <em>almost touch.</em>
          </p>
          <p className="mt-4 text-[15px] text-white/60" style={{ fontFamily: F.mr }}>
            Image, title and button float at their own depth as the card leans.
          </p>
        </div>
        <div className="u66-scene relative h-[86%] aspect-[4/5]">
          <div className="u66-card absolute inset-0 rounded-[26px] border border-white/15 bg-gradient-to-br from-[#2a1018] to-[#120a12] shadow-[0_40px_80px_rgba(0,0,0,.55)]" style={{ transform: "rotateX(6deg) rotateY(-10deg)" }}>
            <div className="u66-layer absolute inset-[7%] bottom-[30%] overflow-hidden rounded-[18px]" data-depth="10" style={{ transform: "translateZ(40px)" }}>
              <Img i={1} w={600} h={700} />
            </div>
            <div className="u66-layer absolute left-[9%] top-[11%]" data-depth="22" style={{ transform: "translateZ(90px)" }}>
              <p className="rounded-full bg-black/45 px-3 py-1 text-[12px] uppercase tracking-[0.2em] text-white/85 backdrop-blur" style={{ fontFamily: F.sg }}>
                Eau de parfum · 50 ml
              </p>
            </div>
            <div className="u66-layer absolute bottom-[10%] left-[9%]" data-depth="16" style={{ transform: "translateZ(70px)" }}>
              <p className="text-[clamp(26px,2.4vw,38px)] leading-none" style={{ fontFamily: F.fr, fontWeight: 600 }}>
                Velvet Ash
              </p>
              <p className="mt-2 text-[15px] text-white/65">₹4,800</p>
            </div>
            <div className="u66-layer absolute bottom-[10%] right-[9%]" data-depth="28" style={{ transform: "translateZ(120px)" }}>
              <span className="inline-block rounded-full bg-[#ff4d6d] px-5 py-3 text-[14px] font-[700] text-white shadow-[0_14px_30px_rgba(255,77,109,.45)]" style={{ fontFamily: F.sg }}>
                Add to bag
              </span>
            </div>
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[26px]" style={{ transform: "translateZ(130px)" }} aria-hidden>
              <div className="u66-shine absolute inset-[-40%] bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,.28),transparent_40%)] mix-blend-screen" />
            </div>
          </div>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  {
    code: "U62",
    name: "Underline + rotating arrow link",
    how: "Hovering a link scales its underline in from the left while the arrow turns 45° to point up-right; both reverse on leave (0.3 s). A fake pointer walks the links.",
    kind: "play",
    C: U62,
  },
  {
    code: "U63",
    name: "Cursor parallax floating layers",
    how: "Word, shapes, product and tags shift opposite to the pointer by their own depth (quickTo per layer). A scripted figure-eight pointer drives it.",
    kind: "play",
    C: U63,
  },
  {
    code: "U64",
    name: "Directional underline + arrow lift",
    how: "Each link's underline wipes in from the left, the centre or the right while a diagonal arrow lifts into place from below. A fake pointer walks the links.",
    kind: "play",
    C: U64,
  },
  {
    code: "U65",
    name: "Fly to cart arc",
    how: "Pressing Add sends a copy of the product image along a curved arc into the cart, which bumps and counts up. A fake pointer clicks each tile in turn.",
    kind: "play",
    C: U65,
  },
  {
    code: "U66",
    name: "Tilt with layered content",
    how: "The card tilts toward the pointer in 3D while image, title, tag and button sit at different depths and float apart. A scripted figure-eight pointer drives it.",
    kind: "play",
    C: U66,
  },
];
