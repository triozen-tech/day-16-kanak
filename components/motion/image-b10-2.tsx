"use client";

// MOTION-MENU M482–M493 (image group, batch 10): small focused demos for /lab/motion.
// "play" demos start when on screen, loop, and pause off screen. Hover demos also play by themselves with a visible
// fake pointer (a ring) walking over the targets; a real pointer still works (it holds the loop while it hovers).
// Every demo has a CSS glow loop; stages covered by photos also get a second glow on top (screen blend).
// ?static=1 / reduced motion: no animation, the markup shows a sensible final state as written.
import { useEffect, useRef, type CSSProperties, type HTMLAttributes, type PointerEvent as RPointerEvent, type ReactNode, type RefObject } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { scene } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const GROTESK = "'Space Grotesk Variable', system-ui, sans-serif";
const SERIF = "'Fraunces Variable', Georgia, serif";
const EDITORIAL = "'Instrument Serif', Georgia, serif";
const WIDE = "'Syne Variable', 'Space Grotesk Variable', system-ui, sans-serif";
const MANROPE = "'Manrope Variable', system-ui, sans-serif";

type Q = (s: string) => HTMLElement[];
type TL = gsap.core.Timeline;

/* ---------- shared helpers (local to this file) ---------- */

const CSS = `
.b10g2-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 44% at 30% 40%,var(--g1,rgba(79,141,255,.5)),transparent 70%),radial-gradient(34% 40% at 72% 64%,var(--g2,rgba(255,122,89,.22)),transparent 70%);animation:b10g2-drift 5.4s linear infinite alternate;will-change:transform}
.b10g2-top{position:absolute;inset:-25%;pointer-events:none;z-index:40;mix-blend-mode:screen;opacity:.45;background:radial-gradient(30% 36% at 34% 42%,var(--g1,rgba(79,141,255,.5)),transparent 70%),radial-gradient(28% 32% at 70% 62%,var(--g2,rgba(255,122,89,.3)),transparent 70%);animation:b10g2-drift2 4.6s linear infinite alternate;will-change:transform}
@keyframes b10g2-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
@keyframes b10g2-drift2{0%{transform:translate3d(7%,-4%,0) scale(1.1)}100%{transform:translate3d(-7%,5%,0) scale(.95)}}
.b10g2-ring{position:absolute;left:0;top:0;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;border:2px solid rgba(255,255,255,.92);background:rgba(255,255,255,.14);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 6px 18px rgba(0,0,0,.35);pointer-events:none;z-index:30}
@keyframes m483-morph{
  0%{border-radius:42% 58% 63% 37% / 41% 44% 56% 59%}
  25%{border-radius:68% 32% 41% 59% / 55% 62% 38% 45%}
  50%{border-radius:37% 63% 52% 48% / 66% 35% 65% 34%}
  75%{border-radius:58% 42% 33% 67% / 38% 58% 42% 62%}
  100%{border-radius:42% 58% 63% 37% / 41% 44% 56% 59%}
}
@keyframes m483-turn{0%{transform:rotate(-6deg) scale(1)}100%{transform:rotate(7deg) scale(1.04)}}
@keyframes m483-counter{0%{transform:rotate(6deg) scale(1.14)}100%{transform:rotate(-7deg) scale(1.08)}}
.m483-blob{border-radius:42% 58% 63% 37% / 41% 44% 56% 59%;animation:m483-morph 6s linear infinite,m483-turn 6s ease-in-out infinite alternate;animation-play-state:paused}
.m483-echo{animation-delay:-1.6s,-2.4s}
.m483-in{animation:m483-counter 6s ease-in-out infinite alternate;animation-play-state:paused}
.m483[data-on] .m483-blob,.m483[data-on] .m483-in{animation-play-state:running}
html.is-static .b10g2-glow,html.is-static .b10g2-top,html.is-static .m483-blob,html.is-static .m483-in{animation:none}
html.is-static {
  .b10g2-glow,.b10g2-top,.m483-blob,.m483-in{animation:none}
}
`;

/** Demo frame: rounded dark panel + the CSS-only glow loop (never frozen). `top` adds the second glow above photos. */
function Stage({
  r,
  children,
  className = "",
  g1,
  g2,
  bg = "#0a0f1c",
  top = false,
  ...rest
}: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string; bg?: string; top?: boolean } & Omit<HTMLAttributes<HTMLDivElement>, "children">) {
  const vars = { "--g1": g1, "--g2": g2 } as CSSProperties;
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 text-[#eaf5ff] ${className}`} style={{ background: bg }} {...rest}>
      <style href="b10g2-css" precedence="default">
        {CSS}
      </style>
      <div className="b10g2-glow" style={vars} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
      {top ? <div className="b10g2-top" style={vars} aria-hidden /> : null}
    </div>
  );
}

/** Play: builds looping animation(s) once fonts are ready, plays only on screen (and not while held), reverts on unmount. */
function usePlay(ref: RefObject<HTMLElement | null>, build: (root: HTMLElement, q: Q, onCleanup: (fn: () => void) => void) => gsap.core.Animation | gsap.core.Animation[] | void) {
  const b = useRef(build);
  b.current = build;
  const api = useRef<{ hold: (h: boolean) => void }>({ hold: () => {} });
  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    let dead = false;
    let on = false;
    let held = false;
    let anims: gsap.core.Animation[] = [];
    const cleanups: (() => void)[] = [];
    const ctx = gsap.context(() => {}, root);
    const sync = () => anims.forEach((a) => (on && !held ? a.play() : a.pause()));
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
        const r = b.current(root, gsap.utils.selector(root) as Q, (fn) => cleanups.push(fn));
        anims = r ? (Array.isArray(r) ? r : [r]) : [];
      });
      sync();
    });
    api.current.hold = (h) => {
      held = h;
      sync();
    };
    return () => {
      dead = true;
      io.disconnect();
      api.current.hold = () => {};
      cleanups.forEach((fn) => fn());
      ctx.revert();
    };
  }, [ref]);
  return api;
}

/** Centre-ish point of `el` relative to `root` (for the fake pointer). */
const centerIn = (el: Element, root: Element, fx = 0.5, fy = 0.5) => {
  const a = el.getBoundingClientRect();
  const b = root.getBoundingClientRect();
  return { x: a.left - b.left + a.width * fx, y: a.top - b.top + a.height * fy };
};

/**
 * Fake-pointer walk over hover targets (`sel`): every `step` s the ring glides (0.45 s) onto the next target, taps, then
 * drifts slowly across it (never resting). `fx(tl, at, cur, prev, q)` adds that step's hover-in / hover-out tweens.
 * The markup's state is "target 0 hovered". Real pointer: `enter(i)` holds the loop and plays the same tweens; `leave()` resumes.
 */
function useWalk(ref: RefObject<HTMLElement | null>, sel: string, step: number, fx: (tl: TL, at: number, cur: number, prev: number, q: Q) => void, pts: [number, number, number, number] = [0.4, 0.46, 0.6, 0.56]) {
  const f = useRef(fx);
  f.current = fx;
  const api = useRef<{ enter: (i: number) => void; leave: () => void }>({ enter: () => {}, leave: () => {} });
  const [p0, p1, p2, p3] = pts;
  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    const q = gsap.utils.selector(root) as Q;
    const ctx = gsap.context(() => {}, root);
    let dead = false;
    let on = false;
    let held = false;
    let cur = 0;
    let tl: TL | null = null;
    const sync = () => {
      if (tl) on && !held ? tl.play() : tl.pause();
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
        const ts = q(sel);
        const ring = q(".b10g2-ring")[0];
        const n = ts.length;
        const P = (k: number, a: number, b: number) => centerIn(ts[k], root, a, b);
        gsap.set(ring, { ...P(0, p2, p3), autoAlpha: 1 });
        const t = gsap.timeline({ repeat: -1, paused: true, defaults: { immediateRender: false } });
        for (let s = 1; s <= n; s++) {
          const c = s % n;
          const p = s - 1;
          const at = (s - 1) * step;
          t.to(ring, { ...P(c, p0, p1), duration: 0.45, ease: "power2.inOut" }, at)
            .to(ring, { ...P(c, p2, p3), duration: step - 0.45, ease: "none" }, at + 0.45)
            .fromTo(ring, { scale: 1 }, { scale: 0.72, duration: 0.12, repeat: 1, yoyo: true, ease: "power1.inOut" }, at + 0.38)
            .call(() => void (cur = c), [], at + 0.3);
          f.current(t, at + 0.3, c, p, q);
        }
        tl = t;
      });
      sync();
    });
    api.current = {
      enter: (i) => {
        if (!tl) return;
        held = true;
        tl.pause();
        if (i === cur) return;
        const prev = cur;
        cur = i;
        ctx.add(() => f.current(gsap.timeline({ defaults: { immediateRender: false } }), 0, i, prev, q));
      },
      leave: () => {
        held = false;
        sync();
      },
    };
    return () => {
      dead = true;
      io.disconnect();
      api.current = { enter: () => {}, leave: () => {} };
      ctx.revert();
    };
  }, [ref, sel, step, p0, p1, p2, p3]);
  return api;
}

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, className = "", style, label = "", w = 1400, h = 900 }: { i: number; className?: string; style?: CSSProperties; label?: string; w?: number; h?: number }) => <img src={scene(i, w, h, label)} alt="" className={`h-full w-full object-cover ${className}`} style={style} draggable={false} />;

const Ring = () => <div className="b10g2-ring" style={{ transform: "translate(-80px,-80px)" }} aria-hidden />;

/* ---------- M482 · Notched clip cards with inner zoom (variant of M13) ---------- */
const M482_C = [
  { t: "Ridge Shell", s: "Packable rain jacket", p: "₹ 9,800", i: 0, clip: "m482-a" },
  { t: "Kiln Pair", s: "Stoneware mug set", p: "₹ 2,150", i: 3, clip: "m482-b" },
  { t: "Grove Tote", s: "Waxed canvas carry", p: "₹ 4,600", i: 2, clip: "m482-c" },
];
function M482() {
  const root = useRef<HTMLDivElement>(null);
  const w = useWalk(root, ".m482-card", 1.2, (tl, at, cur, prev, q) => {
    const imgs = q(".m482-img");
    const caps = q(".m482-cap");
    tl.fromTo(imgs[cur], { scale: 1 }, { scale: 1.2, duration: 0.8, ease: "power3.out" }, at)
      .fromTo(imgs[prev], { scale: 1.2 }, { scale: 1, duration: 0.7, ease: "power3.inOut" }, at - 0.1)
      .fromTo(caps[cur], { y: 0, opacity: 0.6 }, { y: -8, opacity: 1, duration: 0.5, ease: "power3.out" }, at)
      .fromTo(caps[prev], { y: -8, opacity: 1 }, { y: 0, opacity: 0.6, duration: 0.45, ease: "power2.inOut" }, at - 0.1);
  });
  return (
    <Stage r={root} g1="rgba(255,178,107,.5)" g2="rgba(79,141,255,.24)" bg="#0d0c10" top>
      <svg width="0" height="0" className="absolute" aria-hidden>
        <defs>
          <clipPath id="m482-a" clipPathUnits="objectBoundingBox">
            <path d="M0.14 0 H1 V0.88 L0.84 1 H0 V0.11 Z" />
          </clipPath>
          <clipPath id="m482-b" clipPathUnits="objectBoundingBox">
            <path d="M0 0 H0.34 L0.41 0.06 H0.59 L0.66 0 H1 V1 H0.66 L0.59 0.94 H0.41 L0.34 1 H0 Z" />
          </clipPath>
          <clipPath id="m482-c" clipPathUnits="objectBoundingBox">
            <path d="M0 0 H0.8 L1 0.15 V1 H0.22 L0 0.85 Z" />
          </clipPath>
        </defs>
      </svg>
      <p className="absolute left-[6%] top-[6%] text-[13px] uppercase tracking-[0.22em] text-[#ffcf9a]" style={{ fontFamily: GROTESK }}>
        Field Kit · Autumn drop
      </p>
      <div className="absolute inset-x-[6%] bottom-[7%] top-[15%] flex gap-[3%]" onMouseLeave={() => w.current.leave()}>
        {M482_C.map((c, k) => (
          <div key={k} className="flex min-w-0 flex-1 flex-col" onMouseEnter={() => w.current.enter(k)} data-cursor="View">
            <div className="m482-card relative min-h-0 flex-1 overflow-hidden bg-white/5" style={{ clipPath: `url(#${c.clip})` }}>
              <div className="m482-img absolute inset-0 will-change-transform" style={k === 0 ? { transform: "scale(1.2)" } : undefined}>
                <Img i={c.i} w={800} h={1000} />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
            </div>
            <div className="m482-cap mt-4 flex items-baseline justify-between gap-3" style={k === 0 ? { transform: "translateY(-8px)" } : { opacity: 0.6 }}>
              <div className="min-w-0">
                <p className="truncate text-[clamp(22px,2.2vw,32px)] font-[700] leading-none tracking-[-0.02em]" style={{ fontFamily: GROTESK }}>
                  {c.t}
                </p>
                <p className="mt-1 text-[14px] text-white/65">{c.s}</p>
              </div>
              <p className="text-[16px] text-[#ffcf9a]">{c.p}</p>
            </div>
          </div>
        ))}
      </div>
      <Ring />
    </Stage>
  );
}

/* ---------- M483 · Continuously morphing blob frame (variant of M53) ---------- */
function M483() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const io = new IntersectionObserver(([e]) => el.toggleAttribute("data-on", e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Stage r={root} className="m483" g1="rgba(24,196,143,.42)" g2="rgba(200,255,138,.18)" bg="#08120e">
      <div className="absolute inset-y-0 left-[7%] flex w-[40%] flex-col justify-center">
        <p className="text-[13px] uppercase tracking-[0.22em] text-[#b9f5c9]" style={{ fontFamily: GROTESK }}>
          Mossbank Botanicals
        </p>
        <p className="mt-4 text-[clamp(44px,4.8vw,80px)] leading-[0.98]" style={{ fontFamily: EDITORIAL }}>
          Grown slowly.
          <br />
          <span className="italic text-[#c8ff8a]">Poured by hand.</span>
        </p>
        <p className="mt-6 max-w-[34ch] text-[15px] leading-relaxed text-white/70" style={{ fontFamily: MANROPE }}>
          Cold-pressed facial oil with nine garden botanicals. 30 ml · ₹ 1,890
        </p>
      </div>
      <div className="absolute right-[8%] top-1/2 aspect-square w-[min(40%,520px)] -translate-y-1/2">
        <div className="m483-blob m483-echo absolute inset-[-5%] border border-[#c8ff8a]/40" aria-hidden />
        <div className="m483-blob absolute inset-0 overflow-hidden shadow-[0_40px_90px_rgba(0,0,0,.5)]">
          <div className="m483-in h-full w-full" style={{ transform: "scale(1.1)" }}>
            <Img i={2} w={900} h={900} />
          </div>
        </div>
      </div>
    </Stage>
  );
}

/* ---------- M484 · Skew clip frame on hover ---------- */
const M484_FLAT = "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)";
const M484_SKEW = "polygon(0% 0%, 86% 9%, 100% 100%, 14% 91%)";
const M484_C = [
  { t: "Night Ferry", s: "Print · 50 × 70 cm", p: "₹ 3,400", i: 0 },
  { t: "Ember Hall", s: "Print · 50 × 70 cm", p: "₹ 3,400", i: 1 },
];
function M484() {
  const root = useRef<HTMLDivElement>(null);
  const w = useWalk(root, ".m484-frame", 1.15, (tl, at, cur, prev, q) => {
    const fr = q(".m484-frame");
    const im = q(".m484-img");
    const ar = q(".m484-arrow");
    tl.fromTo(fr[cur], { clipPath: M484_FLAT }, { clipPath: M484_SKEW, duration: 0.5, ease: "power3.out" }, at)
      .fromTo(im[cur], { scale: 1 }, { scale: 1.25, duration: 0.5, ease: "power3.out" }, at)
      .fromTo(fr[prev], { clipPath: M484_SKEW }, { clipPath: M484_FLAT, duration: 0.5, ease: "power3.out" }, at - 0.05)
      .fromTo(im[prev], { scale: 1.25 }, { scale: 1, duration: 0.5, ease: "power3.out" }, at - 0.05)
      .fromTo(ar[cur], { x: 0, opacity: 0.4 }, { x: 10, opacity: 1, duration: 0.4 }, at)
      .fromTo(ar[prev], { x: 10, opacity: 1 }, { x: 0, opacity: 0.4, duration: 0.4 }, at - 0.05);
  });
  return (
    <Stage r={root} g1="rgba(255,77,109,.5)" g2="rgba(255,179,107,.22)" bg="#120a0e">
      <div className="absolute inset-x-[10%] bottom-[8%] top-[8%] flex gap-[6%]" onMouseLeave={() => w.current.leave()}>
        {M484_C.map((c, k) => (
          <div key={k} className="flex min-w-0 flex-1 flex-col" onMouseEnter={() => w.current.enter(k)} data-cursor="Open">
            <div className="m484-frame relative min-h-0 flex-1 overflow-hidden" style={{ clipPath: k === 0 ? M484_SKEW : M484_FLAT }}>
              <div className="m484-img absolute inset-0 will-change-transform" style={k === 0 ? { transform: "scale(1.25)" } : undefined}>
                <Img i={c.i} w={1000} h={1000} />
              </div>
            </div>
            <div className="mt-5 flex items-end justify-between">
              <div>
                <p className="text-[clamp(30px,3vw,46px)] leading-none" style={{ fontFamily: SERIF, fontWeight: 500 }}>
                  {c.t}
                </p>
                <p className="mt-2 text-[14px] text-white/60">
                  {c.s} · {c.p}
                </p>
              </div>
              <span className="m484-arrow text-[28px] leading-none text-[#ffb36b]" style={{ opacity: k === 0 ? 1 : 0.4, transform: k === 0 ? "translateX(10px)" : undefined }}>
                →
              </span>
            </div>
          </div>
        ))}
      </div>
      <Ring />
    </Stage>
  );
}

/* ---------- M485 · Tilted cover slides off ---------- */
const M485_C = [
  { t: "Look 01", n: "Harbour coat", p: "₹ 12,900", c: "#d6ff5c", i: 1 },
  { t: "Look 02", n: "Pleat skirt", p: "₹ 6,400", c: "#8fb8ff", i: 3 },
];
const M485_TILT = { rotationX: 30, scale: 0.9, y: 10 };
const M485_FLAT = { rotationX: 0, scale: 1, y: 0 };
function M485() {
  const root = useRef<HTMLDivElement>(null);
  const w = useWalk(root, ".m485-card", 1.2, (tl, at, cur, prev, q) => {
    const tilts = q(".m485-tilt");
    const plates = q(".m485-plate");
    tl.fromTo(tilts[cur], M485_TILT, { ...M485_FLAT, duration: 0.6, ease: "power3.out" }, at)
      .fromTo(plates[cur], { xPercent: 0 }, { xPercent: 104, duration: 0.6, ease: "power3.inOut" }, at)
      .fromTo(tilts[prev], M485_FLAT, { ...M485_TILT, duration: 0.6, ease: "power3.inOut" }, at - 0.05)
      .fromTo(plates[prev], { xPercent: -104 }, { xPercent: 0, duration: 0.6, ease: "power3.inOut" }, at - 0.05);
  });
  // GSAP owns the 3D transforms: give it the markup state explicitly once
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const q = gsap.utils.selector(el) as Q;
    q(".m485-tilt").forEach((t, k) => gsap.set(t, { ...(k === 0 ? M485_FLAT : M485_TILT), transformOrigin: "50% 100%" }));
  }, []);
  return (
    <Stage r={root} g1="rgba(214,255,92,.5)" g2="rgba(143,184,255,.25)" bg="#0d1014">
      <div className="absolute inset-x-[12%] bottom-[8%] top-[8%] flex gap-[7%]" onMouseLeave={() => w.current.leave()}>
        {M485_C.map((c, k) => (
          <div key={k} className="m485-card flex min-w-0 flex-1 flex-col" onMouseEnter={() => w.current.enter(k)} data-cursor="Look">
            <div className="relative min-h-0 flex-1" style={{ perspective: "1100px" }}>
              <div
                className="m485-tilt absolute inset-0 overflow-hidden rounded-[14px] shadow-[0_30px_70px_rgba(0,0,0,.5)] will-change-transform"
                style={{ transformOrigin: "50% 100%", transform: k === 0 ? undefined : "translateY(10px) rotateX(30deg) scale(.9)" }}
              >
                <Img i={c.i} w={900} h={1100} />
                <div className="m485-plate absolute inset-0 flex flex-col justify-between p-[8%] text-[#0d1014]" style={{ background: c.c, transform: k === 0 ? "translateX(104%)" : undefined }}>
                  <p className="text-[13px] uppercase tracking-[0.22em]" style={{ fontFamily: GROTESK }}>
                    Winter Room
                  </p>
                  <p className="text-[clamp(44px,4.6vw,76px)] font-[800] leading-[0.9] tracking-[-0.03em]" style={{ fontFamily: WIDE }}>
                    {c.t}
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-5 text-[15px] text-white/75" style={{ fontFamily: MANROPE }}>
              <span className="mr-3 text-white">{c.n}</span>
              {c.p}
            </p>
          </div>
        ))}
      </div>
      <Ring />
    </Stage>
  );
}

/* ---------- M486 · Sliding doors reveal (variant of M1; horizontal + vertical split) ---------- */
const M486_F = [
  { dir: "Horizontal split", imgs: [0, 3], c: ["#e9c79b", "#c9925a"], t: "Dune House" },
  { dir: "Vertical split", imgs: [1, 2], c: ["#1f3b5c", "#2f6fd6"], t: "Tide Room" },
];
function M486() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (_el, q) =>
    q(".m486-frame").map((fr, fi) => {
      const sel = gsap.utils.selector(fr) as Q;
      const [d1, d2] = sel(".m486-door");
      const imgs = sel(".m486-img");
      const ax = fi === 1 ? "yPercent" : "xPercent";
      const tl = gsap.timeline({ repeat: -1, defaults: { immediateRender: false } });
      const n = imgs.length;
      for (let s = 0; s < n; s++) {
        const at = s * 2;
        const nx = (s + 1) % n;
        tl.fromTo(d1, { [ax]: -101 }, { [ax]: 0, duration: 0.6, ease: "power3.inOut" }, at)
          .fromTo(d2, { [ax]: 101 }, { [ax]: 0, duration: 0.6, ease: "power3.inOut" }, at)
          .set(imgs[s], { autoAlpha: 0 }, at + 0.62)
          .set(imgs[nx], { autoAlpha: 1 }, at + 0.62)
          .to(d1, { [ax]: -101, duration: 0.8, ease: "power3.inOut" }, at + 0.66)
          .to(d2, { [ax]: 101, duration: 0.8, ease: "power3.inOut" }, at + 0.66)
          .fromTo(imgs[nx], { scale: 1.18 }, { scale: 1, duration: 1.34, ease: "sine.out" }, at + 0.66);
      }
      if (fi === 1) tl.progress(0.5);
      return tl;
    }),
  );
  return (
    <Stage r={root} g1="rgba(224,145,63,.45)" g2="rgba(47,111,214,.3)" bg="#0c0b0d" top>
      <div className="absolute inset-x-[5%] bottom-[7%] top-[7%] flex gap-[4%]">
        {M486_F.map((f, fi) => (
          <div key={fi} className="flex min-w-0 flex-1 flex-col">
            <div className="m486-frame relative min-h-0 flex-1 overflow-hidden rounded-[18px] bg-black/40">
              {f.imgs.map((im, k) => (
                <div key={k} className="m486-img absolute inset-0 will-change-transform" style={k === 0 ? undefined : { visibility: "hidden", opacity: 0 }}>
                  <Img i={im} w={1000} h={900} />
                </div>
              ))}
              {[0, 1].map((d) => (
                <div
                  key={d}
                  className={`m486-door absolute flex items-center justify-center ${fi === 0 ? `inset-y-0 w-1/2 ${d === 0 ? "left-0" : "right-0"}` : `inset-x-0 h-1/2 ${d === 0 ? "top-0" : "bottom-0"}`}`}
                  style={{ background: f.c[d], transform: fi === 0 ? `translateX(${d === 0 ? -101 : 101}%)` : `translateY(${d === 0 ? -101 : 101}%)` }}
                >
                  <span className="text-[13px] uppercase tracking-[0.3em] text-black/55" style={{ fontFamily: GROTESK }}>
                    {d === 0 ? "Open" : "House"}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <p className="text-[clamp(26px,2.6vw,40px)] leading-none" style={{ fontFamily: EDITORIAL }}>
                {f.t} <span className="text-[15px] text-white/60" style={{ fontFamily: MANROPE }}>from ₹ 14,500 a night</span>
              </p>
              <p className="text-[13px] uppercase tracking-[0.2em] text-white/55">{f.dir}</p>
            </div>
          </div>
        ))}
      </div>
    </Stage>
  );
}

/* ---------- M487 · Photo shrinks to thumbnail on hover (variant of M13) ---------- */
const M487_C = [
  { t: "Sunday Loaf", d: "Wild-yeast sourdough, 36-hour ferment, rye crust.", p: "₹ 340", i: 3 },
  { t: "Orchard Tart", d: "Brown-butter pastry, poached pear, almond cream.", p: "₹ 520", i: 1 },
  { t: "Night Bun", d: "Cardamom knot, burnt sugar glaze, sea salt.", p: "₹ 180", i: 0 },
];
const M487_FULL = { x: 0, y: 0, scale: 1, borderRadius: 16 };
const M487_THUMB = { x: -16, y: 16, scale: 0.3, borderRadius: 48 };
function M487() {
  const root = useRef<HTMLDivElement>(null);
  const w = useWalk(
    root,
    ".m487-card",
    1.25,
    (tl, at, cur, prev, q) => {
      const ph = q(".m487-ph");
      const tx = q(".m487-txt");
      tl.fromTo(ph[cur], M487_FULL, { ...M487_THUMB, duration: 0.6, ease: "power3.inOut" }, at)
        .fromTo(ph[prev], M487_THUMB, { ...M487_FULL, duration: 0.6, ease: "power3.inOut" }, at - 0.05)
        .fromTo(tx[cur].children, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: "power3.out" }, at + 0.2)
        .fromTo(tx[prev].children, { y: 0, opacity: 1 }, { y: 12, opacity: 0, duration: 0.3, ease: "power2.in" }, at - 0.05);
    },
    [0.45, 0.5, 0.55, 0.62],
  );
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    (gsap.utils.selector(el) as Q)(".m487-ph").forEach((p, k) => gsap.set(p, { ...(k === 0 ? M487_THUMB : M487_FULL), transformOrigin: "100% 0%" }));
  }, []);
  return (
    <Stage r={root} g1="rgba(255,190,120,.5)" g2="rgba(255,77,109,.2)" bg="#120e0b" top>
      <div className="absolute inset-x-[6%] bottom-[9%] top-[9%] flex gap-[3%]" onMouseLeave={() => w.current.leave()}>
        {M487_C.map((c, k) => (
          <div key={k} className="m487-card relative min-w-0 flex-1 overflow-hidden rounded-[16px] border border-white/10 bg-[#1c1712]" onMouseEnter={() => w.current.enter(k)} data-cursor="Read">
            <div className="m487-txt absolute inset-x-[9%] bottom-[9%]">
              <p className="text-[13px] uppercase tracking-[0.22em] text-[#e9c79b]">Bakehouse 0{k + 1}</p>
              <p className="mt-3 text-[clamp(30px,3vw,46px)] leading-[1] tracking-[-0.01em]" style={{ fontFamily: SERIF, fontWeight: 500 }}>
                {c.t}
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-white/70" style={{ fontFamily: MANROPE }}>
                {c.d}
              </p>
              <p className="mt-5 inline-block rounded-full bg-[#e9c79b] px-4 py-2 text-[14px] font-[600] text-[#1c1712]">Add · {c.p}</p>
            </div>
            <div
              className="m487-ph absolute inset-0 overflow-hidden will-change-transform"
              style={{ transformOrigin: "100% 0%", borderRadius: k === 0 ? 48 : 16, transform: k === 0 ? "translate(-16px,16px) scale(.3)" : undefined }}
            >
              <Img i={c.i} w={800} h={1000} />
            </div>
          </div>
        ))}
      </div>
      <Ring />
    </Stage>
  );
}

/* ---------- M488 · Progressive blur + caption on hover ---------- */
const M488_BLURS = [2, 5, 9];
const M488_C = [
  { t: "Cliff Path", s: "Guided walk · 4 hrs", p: "₹ 2,800", i: 2 },
  { t: "Lantern Night", s: "Night market tour", p: "₹ 1,600", i: 1 },
  { t: "Salt Flats", s: "Sunrise drive", p: "₹ 4,200", i: 0 },
];
const m488Mask = (k: number) => {
  const a = 30 + k * 20;
  return `linear-gradient(to bottom, transparent ${a}%, #000 ${a + 18}%)`;
};
function M488() {
  const root = useRef<HTMLDivElement>(null);
  const prox = useRef(M488_C.map((_, k) => ({ v: k === 0 ? 1 : 0 })));
  const w = useWalk(root, ".m488-card", 1.2, (tl, at, cur, prev, q) => {
    const cards = q(".m488-card");
    const apply = (k: number) => () => {
      const v = prox.current[k].v;
      // the blur stays fixed (cheap to keep, very costly to re-rasterise every frame); each blur layer fades instead
      cards[k].querySelectorAll<HTMLElement>(".m488-layer").forEach((l) => {
        l.style.opacity = v.toFixed(3);
      });
    };
    const caps = q(".m488-cap");
    const shades = q(".m488-shade");
    tl.fromTo(prox.current[cur], { v: 0 }, { v: 1, duration: 0.6, ease: "power2.out", onUpdate: apply(cur) }, at)
      .fromTo(prox.current[prev], { v: 1 }, { v: 0, duration: 0.5, ease: "power2.inOut", onUpdate: apply(prev) }, at - 0.05)
      .fromTo(shades[cur], { opacity: 0 }, { opacity: 1, duration: 0.6 }, at)
      .fromTo(shades[prev], { opacity: 1 }, { opacity: 0, duration: 0.5 }, at - 0.05)
      .fromTo(caps[cur], { yPercent: 110 }, { yPercent: 0, duration: 0.55, ease: "power3.out" }, at + 0.12)
      .fromTo(caps[prev], { yPercent: 0 }, { yPercent: 110, duration: 0.4, ease: "power2.in" }, at - 0.05);
  });
  return (
    <Stage r={root} g1="rgba(79,141,255,.5)" g2="rgba(24,196,143,.22)" bg="#0a0f18" top>
      <div className="absolute inset-x-[6%] bottom-[8%] top-[8%] flex gap-[2.5%]" onMouseLeave={() => w.current.leave()}>
        {M488_C.map((c, k) => (
          <div key={k} className="m488-card relative min-w-0 flex-1 overflow-hidden rounded-[18px]" onMouseEnter={() => w.current.enter(k)} data-cursor="Book">
            <Img i={c.i} w={800} h={1100} className="absolute inset-0" />
            {M488_BLURS.map((b, j) => {
              const f = `blur(${b}px)`;
              return <div key={j} className="m488-layer pointer-events-none absolute inset-0" style={{ backdropFilter: f, WebkitBackdropFilter: f, maskImage: m488Mask(j), WebkitMaskImage: m488Mask(j), opacity: k === 0 ? 1 : 0 }} aria-hidden />;
            })}
            <div className="m488-shade pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" style={{ opacity: k === 0 ? 1 : 0 }} />
            <div className="absolute inset-x-0 bottom-0 overflow-hidden px-[8%] pb-[8%]">
              <div className="m488-cap" style={k === 0 ? undefined : { transform: "translateY(110%)" }}>
                <p className="text-[clamp(28px,2.8vw,42px)] font-[700] leading-none tracking-[-0.02em]" style={{ fontFamily: GROTESK }}>
                  {c.t}
                </p>
                <p className="mt-2 text-[15px] text-white/80">
                  {c.s} · {c.p}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Ring />
    </Stage>
  );
}

/* ---------- M489 · Hover glare sweep (variant of M49) ---------- */
const M489_C = [
  { t: "Aurora Pass", s: "Annual membership", p: "₹ 7,999", i: 0 },
  { t: "Ember Card", s: "Gift card", p: "₹ 2,500", i: 1 },
  { t: "Fern Club", s: "Monthly box", p: "₹ 1,299", i: 2 },
];
function M489() {
  const root = useRef<HTMLDivElement>(null);
  const w = useWalk(root, ".m489-card", 1.1, (tl, at, cur, prev, q) => {
    const bands = q(".m489-band");
    const cards = q(".m489-card");
    tl.fromTo(bands[cur], { xPercent: -260, yPercent: -30 }, { xPercent: 330, yPercent: 30, duration: 0.6, ease: "power2.inOut" }, at)
      .fromTo(cards[cur], { y: 0 }, { y: -10, duration: 0.45, ease: "power3.out" }, at)
      .fromTo(cards[prev], { y: -10 }, { y: 0, duration: 0.45, ease: "power2.inOut" }, at - 0.05);
  });
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    (gsap.utils.selector(el) as Q)(".m489-band").forEach((b) => gsap.set(b, { rotation: 22, xPercent: -260, yPercent: -30 }));
  }, []);
  return (
    <Stage r={root} g1="rgba(255,255,255,.22)" g2="rgba(79,141,255,.45)" bg="#0b0d14">
      <div className="absolute inset-x-[7%] bottom-[12%] top-[12%] flex gap-[3%]" onMouseLeave={() => w.current.leave()}>
        {M489_C.map((c, k) => (
          <div key={k} className="m489-card relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-white/15 bg-[#131826]" onMouseEnter={() => w.current.enter(k)} data-cursor="Shine">
            <div className="relative min-h-0 flex-1 overflow-hidden">
              <Img i={c.i} w={900} h={800} />
            </div>
            <div className="flex items-end justify-between p-[7%]">
              <div>
                <p className="text-[clamp(24px,2.3vw,34px)] font-[700] leading-none" style={{ fontFamily: WIDE }}>
                  {c.t}
                </p>
                <p className="mt-2 text-[14px] text-white/60">{c.s}</p>
              </div>
              <p className="text-[18px] font-[600] text-[#9fd8ff]">{c.p}</p>
            </div>
            <div
              className="m489-band pointer-events-none absolute left-0 top-[-50%] h-[200%] w-[38%] mix-blend-screen"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,.08) 30%, rgba(255,255,255,.55) 50%, rgba(255,255,255,.08) 70%, transparent)", transform: "translate(-260%,-30%) rotate(22deg)" }}
              aria-hidden
            />
          </div>
        ))}
      </div>
      <Ring />
    </Stage>
  );
}

/* ---------- M490 · Colour spotlight over grayscale grid ---------- */
const M490_G = [
  { t: "Harbour", i: 0 },
  { t: "Ember", i: 1 },
  { t: "Fernway", i: 2 },
  { t: "Amberlight", i: 3 },
  { t: "Saltwind", i: 1 },
  { t: "Kestrel", i: 2 },
  { t: "Dusk Bay", i: 3 },
  { t: "Lowfield", i: 0 },
];
const M490_GRAY = "grayscale(1) brightness(0.72)";
const M490_COLOR = "grayscale(0) brightness(1)";
const M490_MASK = "radial-gradient(circle 190px at var(--mx) var(--my), #000 0%, rgba(0,0,0,.75) 45%, transparent 100%)";
function M490Grid({ gray }: { gray: boolean }) {
  return (
    <div className="grid h-full w-full grid-cols-4 grid-rows-2 gap-[14px]">
      {M490_G.map((g, k) => (
        <div key={k} className={`${gray ? "m490-cell" : ""} relative overflow-hidden rounded-[14px]`} style={gray ? { filter: M490_GRAY } : undefined}>
          <Img i={g.i} w={600} h={500} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
          <p className="absolute bottom-[10%] left-[9%] text-[clamp(18px,1.6vw,24px)] font-[700]" style={{ fontFamily: GROTESK }}>
            {g.t}
          </p>
          <p className="absolute right-[9%] top-[9%] text-[13px] text-white/75">₹ {(2 + k) * 650}</p>
        </div>
      ))}
    </div>
  );
}
function M490() {
  const root = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const manual = useRef({ until: 0, x: 0, y: 0 });
  useEffect(() => {
    const el = root.current;
    const g = grid.current;
    if (!el || !g || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {}, el);
    const cells = Array.from(g.querySelectorAll<HTMLElement>(".m490-cell"));
    const ring = el.querySelector<HTMLElement>(".b10g2-ring")!;
    const halo = el.querySelector<HTMLElement>(".m490-halo")!;
    let rects: { l: number; t: number; r: number; b: number }[] = [];
    let W = 1;
    let H = 1;
    const measure = () => {
      const gb = g.getBoundingClientRect();
      W = gb.width;
      H = gb.height;
      rects = cells.map((c) => {
        const r = c.getBoundingClientRect();
        return { l: r.left - gb.left, t: r.top - gb.top, r: r.right - gb.left, b: r.bottom - gb.top };
      });
    };
    let on = false;
    const io = new IntersectionObserver(
      ([e]) => {
        on = e.isIntersecting;
        if (on) measure();
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    let t = 0;
    let px = W / 2;
    let py = H / 2;
    let hot = -1;
    const off = g.offsetLeft;
    const offT = g.offsetTop;
    const tick = (_time: number, dtMs: number) => {
      if (!on) return;
      const dt = Math.min(dtMs, 50) / 1000;
      t += dt;
      let tx: number;
      let ty: number;
      if (performance.now() < manual.current.until) {
        tx = manual.current.x;
        ty = manual.current.y;
      } else {
        tx = W * (0.5 + 0.44 * Math.sin(t * 0.95));
        ty = H * (0.5 + 0.4 * Math.sin(t * 1.65 + 0.8));
      }
      const k = 1 - Math.pow(0.82, dt * 60);
      px += (tx - px) * k;
      py += (ty - py) * k;
      g.style.setProperty("--mx", `${px.toFixed(1)}px`);
      g.style.setProperty("--my", `${py.toFixed(1)}px`);
      gsap.set(ring, { x: px + off, y: py + offT });
      gsap.set(halo, { x: px + off, y: py + offT });
      const h = rects.findIndex((r) => px >= r.l && px <= r.r && py >= r.t && py <= r.b);
      if (h !== hot) {
        ctx.add(() => {
          if (hot >= 0) gsap.to(cells[hot], { filter: M490_GRAY, duration: 0.5, ease: "power2.out", overwrite: "auto" });
          if (h >= 0) gsap.to(cells[h], { filter: M490_COLOR, duration: 0.45, ease: "power2.out", overwrite: "auto" });
        });
        hot = h;
      }
    };
    measure();
    px = W / 2;
    py = H / 2;
    gsap.ticker.add(tick);
    return () => {
      io.disconnect();
      gsap.ticker.remove(tick);
      ctx.revert();
    };
  }, []);
  const vars = { "--mx": "50%", "--my": "50%" } as CSSProperties;
  return (
    <Stage r={root} g1="rgba(255,122,89,.5)" g2="rgba(79,141,255,.3)" bg="#0b0b0f" top>
      <div
        ref={grid}
        className="absolute inset-[6%]"
        style={vars}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          manual.current = { until: performance.now() + 1500, x: e.clientX - r.left, y: e.clientY - r.top };
        }}
        data-cursor="Look"
      >
        <M490Grid gray />
        <div className="pointer-events-none absolute inset-0" style={{ maskImage: M490_MASK, WebkitMaskImage: M490_MASK }} aria-hidden>
          <M490Grid gray={false} />
        </div>
      </div>
      <div className="m490-halo pointer-events-none absolute left-0 top-0 z-20 -ml-[190px] -mt-[190px] h-[380px] w-[380px] rounded-full border border-white/20" style={{ transform: "translate(-400px,-400px)" }} aria-hidden />
      <Ring />
    </Stage>
  );
}

/* ---------- M491 · Cursor preview opens on spring (variant of M160) ---------- */
const M491_R = [
  { t: "Brand films", n: "12 projects", i: 0 },
  { t: "Product stills", n: "48 projects", i: 3 },
  { t: "Set design", n: "9 projects", i: 2 },
  { t: "Retouching", n: "from ₹ 1,200 / image", i: 1 },
];
const M491_H = 210;
function M491() {
  const root = useRef<HTMLDivElement>(null);
  const manual = useRef(false);
  const play = usePlay(root, (el, q, onCleanup) => {
    const rows = q(".m491-row");
    const pv = q(".m491-pv")[0];
    const imgs = q(".m491-im");
    const ring = q(".b10g2-ring")[0];
    const texts = q(".m491-t");
    const b = el.getBoundingClientRect();
    const rr = rows.map((r) => {
      const a = r.getBoundingClientRect();
      return { L: a.left - b.left, R: a.right - b.left, W: a.width, cy: a.top - b.top + a.height / 2 };
    });
    // the preview follows the (fake or real) pointer with a soft lag
    const qx = gsap.quickTo(pv, "x", { duration: 0.45, ease: "power3" });
    const qy = gsap.quickTo(pv, "y", { duration: 0.45, ease: "power3" });
    const follow = () => {
      qx(Number(gsap.getProperty(ring, "x")) + 26);
      qy(Number(gsap.getProperty(ring, "y")) - 36);
    };
    gsap.ticker.add(follow);
    onCleanup(() => gsap.ticker.remove(follow));
    gsap.set(ring, { x: rr[0].L - 70, y: rr[0].cy, autoAlpha: 1 });
    const tl = gsap.timeline({ repeat: -1, defaults: { immediateRender: false } });
    const step = 1.9;
    rr.forEach((r, k) => {
      const at = k * step;
      const lr = k % 2 === 0;
      const next = rr[(k + 1) % rr.length];
      const outX = lr ? r.R + 70 : r.L - 70;
      tl.to(ring, { x: lr ? r.L + r.W * 0.18 : r.L + r.W * 0.82, y: r.cy, duration: 0.3, ease: "power2.out" }, at)
        .to(ring, { x: lr ? r.L + r.W * 0.78 : r.L + r.W * 0.22, y: r.cy + 6, duration: 1.0, ease: "none" }, at + 0.3)
        .to(ring, { x: outX, y: r.cy, duration: 0.3, ease: "power2.in" }, at + 1.3)
        .to(ring, { x: k === rr.length - 1 ? rr[0].L - 70 : outX, y: next.cy, duration: 0.3, ease: "power2.inOut" }, at + 1.6)
        .set(imgs, { autoAlpha: 0 }, at + 0.1)
        .set(imgs[k], { autoAlpha: 1 }, at + 0.1)
        .fromTo(pv, { height: 0 }, { height: M491_H, duration: 0.9, ease: "elastic.out(1,0.5)" }, at + 0.12)
        .to(pv, { height: 0, duration: 0.3, ease: "power3.in" }, at + 1.38)
        .fromTo(texts[k], { x: 0, opacity: 0.55 }, { x: 18, opacity: 1, duration: 0.45, ease: "power3.out" }, at + 0.12)
        .to(texts[k], { x: 0, opacity: 0.55, duration: 0.35, ease: "power2.inOut" }, at + 1.38);
    });
    return tl;
  });
  // real pointer: hold the loop, the ring becomes the pointer, rows open / close the preview
  const real = (e: RPointerEvent<HTMLDivElement>) => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const b = el.getBoundingClientRect();
    const q = gsap.utils.selector(el) as Q;
    if (!manual.current) {
      manual.current = true;
      play.current.hold(true);
    }
    gsap.set(q(".b10g2-ring")[0], { x: e.clientX - b.left, y: e.clientY - b.top });
  };
  const rowIn = (k: number) => {
    const el = root.current;
    if (!el || !manual.current) return;
    const q = gsap.utils.selector(el) as Q;
    gsap.set(q(".m491-im"), { autoAlpha: 0 });
    gsap.set(q(".m491-im")[k], { autoAlpha: 1 });
    gsap.fromTo(q(".m491-pv")[0], { height: 0 }, { height: M491_H, duration: 0.9, ease: "elastic.out(1,0.5)", overwrite: true });
    gsap.to(q(".m491-t")[k], { x: 18, opacity: 1, duration: 0.45, overwrite: true });
  };
  const rowOut = (k: number) => {
    const el = root.current;
    if (!el || !manual.current) return;
    const q = gsap.utils.selector(el) as Q;
    gsap.to(q(".m491-pv")[0], { height: 0, duration: 0.3, ease: "power3.in", overwrite: true });
    gsap.to(q(".m491-t")[k], { x: 0, opacity: 0.55, duration: 0.35, overwrite: true });
  };
  return (
    <Stage
      r={root}
      g1="rgba(255,179,107,.5)"
      g2="rgba(255,77,109,.2)"
      bg="#100c0a"
      onPointerMove={real}
      onPointerLeave={() => {
        manual.current = false;
        play.current.hold(false);
      }}
    >
      <div className="absolute inset-x-[18%] top-1/2 -translate-y-1/2">
        <p className="mb-5 text-[13px] uppercase tracking-[0.22em] text-[#ffcf9a]" style={{ fontFamily: GROTESK }}>
          Paper Lantern Studio · Services
        </p>
        <div className="border-t border-white/15">
          {M491_R.map((r, k) => (
            <div key={k} className="m491-row flex items-center justify-between border-b border-white/15 py-[18px]" onPointerEnter={() => rowIn(k)} onPointerLeave={() => rowOut(k)} data-cursor="Peek">
              <p className="m491-t text-[clamp(34px,3.6vw,58px)] leading-none" style={{ fontFamily: SERIF, fontWeight: 500, opacity: 0.55 }}>
                {r.t}
              </p>
              <p className="text-[14px] text-white/55" style={{ fontFamily: MANROPE }}>
                {r.n}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="m491-pv pointer-events-none absolute left-0 top-0 z-20 w-[160px] overflow-hidden rounded-[12px] shadow-[0_24px_50px_rgba(0,0,0,.5)]" style={{ height: 0, transform: "translate(-300px,-300px)" }} aria-hidden>
        {M491_R.map((r, k) => (
          <div key={k} className="m491-im absolute inset-x-0 top-0" style={{ height: M491_H + 30, ...(k === 0 ? {} : { visibility: "hidden", opacity: 0 }) }}>
            <Img i={r.i} w={400} h={600} />
          </div>
        ))}
      </div>
      <Ring />
    </Stage>
  );
}

/* ---------- M492 · Cursor preview with speed turbulence (variant of M160) ---------- */
const M492_L = [
  { t: "Atelier", i: 3 },
  { t: "Objects", i: 0 },
  { t: "Journal", i: 1 },
  { t: "Studio", i: 2 },
];
function M492() {
  const root = useRef<HTMLDivElement>(null);
  const manual = useRef(false);
  const play = usePlay(root, (el, q, onCleanup) => {
    const links = q(".m492-link");
    const pv = q(".m492-pv")[0];
    const imgs = q(".m492-im");
    const ring = q(".b10g2-ring")[0];
    const disp = el.querySelector<SVGFEDisplacementMapElement>("#m492-f feDisplacementMap");
    const P = (k: number, fx: number) => centerIn(links[k], el, fx, 0.55);
    // smoothed follow + speed-driven displacement (fast = wobbly, still = clean)
    let sx = Number(gsap.getProperty(ring, "x")) || 0;
    let sy = Number(gsap.getProperty(ring, "y")) || 0;
    let amt = 0;
    let shown = -1;
    const setX = gsap.quickSetter(pv, "x", "px");
    const setY = gsap.quickSetter(pv, "y", "px");
    const tick = (_time: number, dtMs: number) => {
      const dt = Math.max(Math.min(dtMs, 50), 1) / 1000;
      const tx = Number(gsap.getProperty(ring, "x"));
      const ty = Number(gsap.getProperty(ring, "y"));
      const k = 1 - Math.pow(0.84, dt * 60);
      const nx = sx + (tx - sx) * k;
      const ny = sy + (ty - sy) * k;
      const v = Math.hypot(nx - sx, ny - sy) / dt;
      sx = nx;
      sy = ny;
      setX(sx);
      setY(sy);
      const target = Math.min(70, v * 0.06);
      amt += (target - amt) * (1 - Math.pow(0.88, dt * 60));
      const r = Math.round(amt * 2) / 2;
      if (disp && r !== shown) {
        disp.setAttribute("scale", String(r));
        shown = r;
      }
    };
    gsap.ticker.add(tick);
    onCleanup(() => gsap.ticker.remove(tick));
    gsap.set(ring, { ...P(0, 0.62), autoAlpha: 1 });
    const tl = gsap.timeline({ repeat: -1, defaults: { immediateRender: false } });
    const n = links.length;
    const step = 1.15;
    for (let s = 1; s <= n; s++) {
      const c = s % n;
      const p = s - 1;
      const at = (s - 1) * step;
      tl.to(ring, { ...P(c, 0.4), duration: 0.3, ease: "power3.inOut" }, at)
        .to(ring, { ...P(c, 0.62), duration: step - 0.3, ease: "none" }, at + 0.3)
        .fromTo(imgs[c], { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "none" }, at + 0.08)
        .fromTo(imgs[p], { opacity: 1 }, { opacity: 0, duration: 0.3, ease: "none" }, at + 0.08)
        .fromTo(links[c], { opacity: 0.3 }, { opacity: 1, duration: 0.35 }, at + 0.1)
        .fromTo(links[p], { opacity: 1 }, { opacity: 0.3, duration: 0.35 }, at + 0.1);
    }
    return tl;
  });
  const real = (e: RPointerEvent<HTMLDivElement>) => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const b = el.getBoundingClientRect();
    const q = gsap.utils.selector(el) as Q;
    if (!manual.current) {
      manual.current = true;
      play.current.hold(true);
    }
    gsap.set(q(".b10g2-ring")[0], { x: e.clientX - b.left, y: e.clientY - b.top });
    const link = (e.target as HTMLElement).closest?.(".m492-link");
    const k = link ? q(".m492-link").indexOf(link as HTMLElement) : -1;
    if (k >= 0) {
      q(".m492-link").forEach((l, j) => gsap.to(l, { opacity: j === k ? 1 : 0.3, duration: 0.3, overwrite: "auto" }));
      q(".m492-im").forEach((im, j) => gsap.to(im, { opacity: j === k ? 1 : 0, duration: 0.3, overwrite: "auto" }));
    }
  };
  return (
    <Stage
      r={root}
      g1="rgba(79,141,255,.5)"
      g2="rgba(255,77,109,.24)"
      bg="#090b12"
      onPointerMove={real}
      onPointerLeave={() => {
        manual.current = false;
        play.current.hold(false);
      }}
    >
      <svg width="0" height="0" className="absolute" aria-hidden>
        <filter id="m492-f" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.035" numOctaves={1} seed={4} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <div className="m492-pv pointer-events-none absolute left-0 top-0 z-0 -ml-[150px] -mt-[100px] h-[200px] w-[300px]" style={{ transform: "translate(560px,240px)", filter: "url(#m492-f)" }} aria-hidden>
        {M492_L.map((l, k) => (
          <div key={k} className="m492-im absolute inset-0 overflow-hidden rounded-[10px]" style={{ opacity: k === 0 ? 1 : 0 }}>
            <Img i={l.i} w={600} h={400} />
          </div>
        ))}
      </div>
      <nav className="relative z-10 flex h-full flex-col justify-center pl-[9%]">
        <p className="mb-4 text-[13px] uppercase tracking-[0.24em] text-white/55" style={{ fontFamily: GROTESK }}>
          Northlight House · Menu
        </p>
        {M492_L.map((l, k) => (
          <a
            key={k}
            href="#"
            onClick={(e) => e.preventDefault()}
            className="m492-link block w-fit text-[clamp(52px,6vw,96px)] font-[800] uppercase leading-[1.02] tracking-[-0.02em] mix-blend-difference"
            style={{ fontFamily: WIDE, opacity: k === 0 ? 1 : 0.3 }}
            data-cursor="Go"
          >
            {l.t}
          </a>
        ))}
      </nav>
      <Ring />
    </Stage>
  );
}

/* ---------- M493 · Thumbnail run + full image wipe ---------- */
const M493_L = [
  { t: "Coastline", p: "from ₹ 24,000", i: 0, th: [0, 2, 1, 3, 0] },
  { t: "Highlands", p: "from ₹ 31,500", i: 2, th: [2, 3, 0, 2, 1] },
  { t: "Old Town", p: "from ₹ 18,900", i: 3, th: [3, 1, 3, 0, 2] },
  { t: "Desert Camp", p: "from ₹ 42,000", i: 1, th: [1, 0, 2, 1, 3] },
];
function M493() {
  const root = useRef<HTMLDivElement>(null);
  const w = useWalk(
    root,
    ".m493-link",
    1.35,
    (tl, at, cur, prev, q) => {
      const bgs = q(".m493-bg");
      const rows = q(".m493-row");
      const links = q(".m493-link");
      tl.call(() => bgs.forEach((b, k) => gsap.set(b, { zIndex: k === cur ? 3 : k === prev ? 2 : 1 })), [], at)
        .fromTo(bgs[cur], { clipPath: "inset(0% 0% 0% 100%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.8, ease: "power3.inOut" }, at)
        .fromTo(bgs[cur].firstElementChild, { scale: 1.2 }, { scale: 1, duration: 1.2, ease: "power2.out" }, at)
        .fromTo(rows[cur], { xPercent: 100 }, { xPercent: -100, duration: 1.25, ease: "power2.inOut" }, at - 0.1)
        .fromTo(rows[cur].children, { y: (k: number) => (k % 2 ? 40 : -30), rotation: (k: number) => (k % 2 ? 4 : -4) }, { y: 0, rotation: 0, duration: 1.1, stagger: 0.04, ease: "power2.out" }, at - 0.1)
        .fromTo(links[cur], { x: 0, opacity: 0.55 }, { x: 22, opacity: 1, duration: 0.45, ease: "power3.out" }, at)
        .fromTo(links[prev], { x: 22, opacity: 1 }, { x: 0, opacity: 0.55, duration: 0.4, ease: "power2.inOut" }, at - 0.05);
    },
    [0.3, 0.5, 0.55, 0.55],
  );
  return (
    <Stage r={root} g1="rgba(255,190,120,.5)" g2="rgba(79,141,255,.3)" bg="#0a0a0d" top>
      {M493_L.map((l, k) => (
        <div key={k} className="m493-bg absolute inset-0 overflow-hidden" style={{ clipPath: k === 0 ? "inset(0% 0% 0% 0%)" : "inset(0% 0% 0% 100%)", zIndex: k === 0 ? 2 : 1 }}>
          <div className="h-full w-full will-change-transform">
            <Img i={l.i} w={1600} h={1000} />
          </div>
        </div>
      ))}
      <div className="pointer-events-none absolute inset-0 z-[20] bg-[linear-gradient(90deg,rgba(6,6,9,.78),rgba(6,6,9,.25)_60%,rgba(6,6,9,.1))]" />
      <div className="pointer-events-none absolute inset-x-0 top-[50%] z-[21] h-[170px] overflow-hidden">
        {M493_L.map((l, k) => (
          <div key={k} className="m493-row absolute inset-0 flex items-center justify-around" style={{ transform: "translateX(100%)" }}>
            {l.th.map((t, j) => (
              <div key={j} className="h-[150px] w-[120px] overflow-hidden rounded-[10px] shadow-[0_18px_40px_rgba(0,0,0,.5)]">
                <Img i={t} w={240} h={300} />
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="absolute inset-y-0 left-[7%] z-[22] flex flex-col justify-center" onMouseLeave={() => w.current.leave()}>
        <p className="mb-4 text-[13px] uppercase tracking-[0.24em] text-[#ffcf9a]" style={{ fontFamily: GROTESK }}>
          Wayfarer Trips · 2027
        </p>
        {M493_L.map((l, k) => (
          <a
            key={k}
            href="#"
            onClick={(e) => e.preventDefault()}
            onMouseEnter={() => w.current.enter(k)}
            className="m493-link flex w-fit items-baseline gap-4 py-1"
            style={{ opacity: k === 0 ? 1 : 0.55, transform: k === 0 ? "translateX(22px)" : undefined }}
            data-cursor="Trip"
          >
            <span className="text-[clamp(46px,5vw,84px)] leading-[1]" style={{ fontFamily: EDITORIAL }}>
              {l.t}
            </span>
            <span className="text-[14px] text-white/70" style={{ fontFamily: MANROPE }}>
              {l.p}
            </span>
          </a>
        ))}
      </div>
      <div className="relative z-[23]">
        <Ring />
      </div>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M482", name: "Notched clip cards with inner zoom", how: "Photos sit in notched, cut-corner SVG clipPath cards; on hover the photo zooms inside while the notch stays fixed (auto pointer walk).", kind: "play", C: M482 },
  { code: "M483", name: "Continuously morphing blob frame", how: "A photo clipped by a blob whose border-radius morphs calmly through four organic forms, ~6 s a cycle, with a counter-turning image.", kind: "play", C: M483 },
  { code: "M484", name: "Skew clip frame on hover", how: "On hover the frame's clip-path tilts into a skewed quadrilateral while the photo zooms 1.25x inside (~0.5 s, auto pointer walk).", kind: "play", C: M484 },
  { code: "M485", name: "Tilted cover slides off", how: "A photo tilted back in 3D under a colour plate flattens upright as the plate slides off sideways on hover (~0.6 s, auto pointer walk).", kind: "play", C: M485 },
  { code: "M486", name: "Sliding doors reveal", how: "Two colour panels meet over the photo and slide apart to reveal the next one (0.8 s power3.inOut): horizontal and vertical split, looping.", kind: "play", C: M486 },
  { code: "M487", name: "Photo shrinks to thumbnail on hover", how: "A card's full-bleed photo shrinks into a small corner thumbnail on hover, uncovering the card's copy underneath (auto pointer walk).", kind: "play", C: M487 },
  { code: "M488", name: "Progressive blur + caption on hover", how: "Stacked backdrop-blur layers with stepped masks build a blur that grows toward the bottom; on hover it fades in and a caption slides up.", kind: "play", C: M488 },
  { code: "M489", name: "Hover glare sweep", how: "On hover a diagonal glare band sweeps once across the card from corner to corner (~0.6 s) as it lifts (auto pointer walk).", kind: "play", C: M489 },
  { code: "M490", name: "Colour spotlight over grayscale grid", how: "A grayscale photo grid; a radial spotlight following the pointer shows a colour copy, and the hovered card tints fully (scripted path).", kind: "play", C: M490 },
  { code: "M491", name: "Cursor preview opens on spring", how: "Hovering a row opens a 160 px image at the pointer from height 0 on a soft spring; it follows the pointer and collapses on leave.", kind: "play", C: M491 },
  { code: "M492", name: "Cursor preview with speed turbulence", how: "A menu link's image follows the pointer through SVG turbulence whose strength tracks pointer speed: fast dashes wobble, slow drifts are clean.", kind: "play", C: M492 },
  { code: "M493", name: "Thumbnail run + full image wipe", how: "Hovering a link runs a row of thumbnails across the screen while the link's full background photo wipes in behind (auto-steps links).", kind: "play", C: M493 },
];
