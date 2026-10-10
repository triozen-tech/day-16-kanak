"use client";

// MOTION-MENU M171–M180 (image group, batch 2): small focused demos for /lab/motion.
// "play" demos start when on screen, loop, and pause off screen. Hover demos also cycle by themselves (with a
// visible fake pointer where hover is the point). "scrub" maps the panel's scroll linearly. Every demo has a CSS glow loop.
// ?static=1 / reduced motion: no animation, the markup shows the first (final) state as written.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { createShader, type GLHandle } from "@/lib/gl";
import { scene, toCanvas, useScrub } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const GROTESK = "'Space Grotesk Variable', system-ui, sans-serif";
const SERIF = "'Fraunces Variable', Georgia, serif";
const EDITORIAL = "'Instrument Serif', Georgia, serif";
const WIDE = "'Syne Variable', 'Space Grotesk Variable', system-ui, sans-serif";
const MANROPE = "'Manrope Variable', system-ui, sans-serif";

type Q = (s: string) => HTMLElement[];

/* ---------- shared helpers (local to this file) ---------- */

const CSS = `
.b2g4i-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 44% at 30% 40%,var(--g1,rgba(79,141,255,.42)),transparent 70%),radial-gradient(34% 40% at 72% 64%,var(--g2,rgba(255,122,89,.2)),transparent 70%);animation:b2g4i-drift 5.4s linear infinite alternate;will-change:transform}
@keyframes b2g4i-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b2g4i-ring{position:absolute;left:0;top:0;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;border:2px solid rgba(255,255,255,.9);background:rgba(255,255,255,.12);box-shadow:0 0 0 6px rgba(255,255,255,.08);pointer-events:none;z-index:30}
.m173-p{flex:1 1 0;min-width:0;transition:flex-grow .75s cubic-bezier(.65,0,.35,1),background-color .5s}
.m173-p[data-on]{flex-grow:5;background-color:rgba(255,255,255,.04)}
.m173-img{opacity:0;transform:scale(1.12);transition:opacity .6s ease .1s,transform 1.1s cubic-bezier(.22,1,.36,1)}
.m173-p[data-on] .m173-img{opacity:1;transform:scale(1)}
.m173-lab{position:absolute;left:24px;bottom:26px;white-space:nowrap;transform-origin:0 100%;transform:translateX(1.3em) rotate(-90deg);transition:transform .75s cubic-bezier(.65,0,.35,1)}
.m173-p[data-on] .m173-lab{transform:none}
.m173-meta{opacity:0;transform:translateY(12px);transition:opacity .4s,transform .5s}
.m173-p[data-on] .m173-meta{opacity:1;transform:none;transition-delay:.45s}
html.is-static .b2g4i-glow{animation:none}
html.is-static .m173-p,html.is-static .m173-img,html.is-static .m173-lab,html.is-static .m173-meta{transition:none}
html.is-static {
  .b2g4i-glow{animation:none}
  .m173-p,.m173-img,.m173-lab,.m173-meta{transition:none}
}
`;

/** Demo frame: rounded dark panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", g1, g2, bg = "#0a0f1c" }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string; bg?: string }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 text-[#eaf5ff] ${className}`} style={{ background: bg }}>
      <style href="b2g4i-css" precedence="default">
        {CSS}
      </style>
      <div className="b2g4i-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/** Play: builds looping animation(s) once fonts are ready, plays only on screen, reverts on unmount. Off with reduced motion. */
function usePlay(ref: RefObject<HTMLElement | null>, build: (root: HTMLElement, q: Q) => gsap.core.Animation | gsap.core.Animation[] | void) {
  const b = useRef(build);
  b.current = build;
  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    let dead = false;
    let on = false;
    let anims: gsap.core.Animation[] = [];
    const ctx = gsap.context(() => {}, root);
    const sync = () => anims.forEach((a) => (on ? a.play() : a.pause()));
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
        const r = b.current(root, gsap.utils.selector(root) as Q);
        anims = r ? (Array.isArray(r) ? r : [r]) : [];
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

/**
 * Auto-cycling "active item" (for hover/click galleries): every `every` s the next item becomes active while on screen.
 * `hover(i)` (real pointer) holds item i and pauses the cycle; `hover(null)` resumes. State 0 is the markup's state.
 */
function useCycle(ref: RefObject<HTMLElement | null>, n: number, go: (i: number, prev: number, q: Q, root: HTMLElement) => void, every = 1.4) {
  const g = useRef(go);
  g.current = go;
  const api = useRef<{ hover: (i: number | null) => void }>({ hover: () => {} });
  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    const q = gsap.utils.selector(root) as Q;
    const ctx = gsap.context(() => {}, root);
    let cur = 0;
    let on = false;
    let held = false;
    let dc: gsap.core.Tween | null = null;
    const to = (i: number) => {
      if (i === cur) return;
      const p = cur;
      cur = i;
      ctx.add(() => g.current(i, p, q, root));
    };
    const schedule = () => {
      dc?.kill();
      dc = null;
      if (!on || held) return;
      dc = gsap.delayedCall(every, () => {
        to((cur + 1) % n);
        schedule();
      });
    };
    const io = new IntersectionObserver(
      ([e]) => {
        on = e.isIntersecting;
        schedule();
      },
      { threshold: 0.1 },
    );
    io.observe(root);
    api.current.hover = (i) => {
      if (i === null) {
        held = false;
        schedule();
      } else {
        held = true;
        dc?.kill();
        to(i);
      }
    };
    return () => {
      io.disconnect();
      dc?.kill();
      api.current.hover = () => {};
      ctx.revert();
    };
  }, [ref, n, every]);
  return api;
}

/** Centre of `el` relative to `root` (for the fake pointer). */
const centerIn = (el: Element, root: Element, fx = 0.5, fy = 0.5) => {
  const a = el.getBoundingClientRect();
  const b = root.getBoundingClientRect();
  return { x: a.left - b.left + a.width * fx, y: a.top - b.top + a.height * fy };
};

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, className = "", style, label = "", w = 1400, h = 900 }: { i: number; className?: string; style?: CSSProperties; label?: string; w?: number; h?: number }) => <img src={scene(i, w, h, label)} alt="" className={`h-full w-full object-cover ${className}`} style={style} draggable={false} />;

/* ---------- M171 · Coverflow with blurred ambient backdrop (variant of M513) ---------- */
const M171_S = [
  { t: "Saltmarsh", s: "Ceramic table lamp", p: "₹ 7,400", i: 0 },
  { t: "Copperline", s: "Hand-spun pour-over", p: "₹ 3,250", i: 1 },
  { t: "Fernhouse", s: "Linen throw, moss", p: "₹ 5,900", i: 2 },
  { t: "Emberglow", s: "Beeswax pillar trio", p: "₹ 1,850", i: 3 },
  { t: "Tidewater", s: "Glazed serving bowl", p: "₹ 2,700", i: 0 },
];
const m171Pose = (off: number) => {
  const a = Math.abs(off);
  return {
    xPercent: off * 62,
    z: -a * 180,
    rotationY: off === 0 ? 0 : off > 0 ? -52 : 52,
    scale: off === 0 ? 1 : 0.86,
    opacity: a >= 2 ? 0.35 : 1,
    zIndex: 10 - a,
  };
};
const m171Off = (i: number, k: number, n: number) => ((i - k + n + 2) % n) - 2;
const m171Css = (off: number): CSSProperties => {
  const p = m171Pose(off);
  return { transform: `translateX(${p.xPercent}%) translateZ(${p.z}px) rotateY(${p.rotationY}deg) scale(${p.scale})`, opacity: p.opacity, zIndex: p.zIndex };
};
function M171() {
  const root = useRef<HTMLDivElement>(null);
  const n = M171_S.length;
  usePlay(root, (_el, q) => {
    const slides = q(".m171-slide");
    const bgs = q(".m171-bg");
    const caps = q(".m171-cap");
    slides.forEach((s, i) => gsap.set(s, { ...m171Pose(m171Off(i, 0, n)), transformPerspective: 1400 }));
    const tl = gsap.timeline({ repeat: -1, defaults: { ease: "power3.inOut", immediateRender: false } });
    for (let step = 1; step <= n; step++) {
      const k = step % n;
      const prev = (step - 1) % n;
      const at = (step - 1) * 1.25 + 0.25;
      slides.forEach((s, i) => {
        const from = m171Off(i, prev, n);
        const to = m171Off(i, k, n);
        if (Math.abs(to - from) > 1) tl.set(s, m171Pose(to), at);
        else tl.fromTo(s, m171Pose(from), { ...m171Pose(to), duration: 0.95 }, at);
      });
      tl.fromTo(bgs[prev], { opacity: 1 }, { opacity: 0, duration: 1, ease: "none" }, at)
        .fromTo(bgs[k], { opacity: 0 }, { opacity: 1, duration: 1, ease: "none" }, at)
        .fromTo(caps[prev].querySelectorAll(".m171-ln"), { yPercent: 0 }, { yPercent: -110, duration: 0.45, stagger: 0.05, ease: "power2.in" }, at)
        .set(caps[prev], { autoAlpha: 0 }, at + 0.55)
        .set(caps[k], { autoAlpha: 1 }, at + 0.5)
        .fromTo(caps[k].querySelectorAll(".m171-ln"), { yPercent: 110 }, { yPercent: 0, duration: 0.6, stagger: 0.07, ease: "power3.out", immediateRender: false }, at + 0.5);
    }
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,190,130,.32)" g2="rgba(79,141,255,.25)" bg="#0b0b10">
      {/* blurred copies of each slide: the active one is the ambient backdrop */}
      {M171_S.map((s, i) => (
        <div key={i} className="m171-bg absolute inset-[-10%] blur-[48px] saturate-150" style={{ opacity: i === 0 ? 1 : 0 }} aria-hidden>
          <Img i={s.i} w={400} h={260} className="opacity-70" />
        </div>
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_40%,transparent,rgba(8,8,12,.75))]" />
      <div className="absolute inset-x-0 top-[6%] h-[64%]" style={{ perspective: "1400px" }}>
        {M171_S.map((s, i) => (
          <div key={i} className="m171-slide absolute left-1/2 top-0 h-full w-[30%] -ml-[15%] overflow-hidden rounded-[20px] shadow-[0_30px_80px_rgba(0,0,0,.55)] will-change-transform" style={m171Css(m171Off(i, 0, n))}>
            <Img i={s.i} w={700} h={900} />
          </div>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-[6%] grid place-items-center text-center">
        {M171_S.map((s, i) => (
          <div key={i} className="m171-cap [grid-area:1/1]" style={i === 0 ? undefined : { visibility: "hidden", opacity: 0 }}>
            <div className="overflow-hidden pb-1">
              <p className="m171-ln text-[clamp(36px,4vw,64px)] leading-[1.02]" style={{ fontFamily: EDITORIAL }}>
                {s.t}
              </p>
            </div>
            <div className="overflow-hidden">
              <p className="m171-ln text-[15px] text-white/70">
                {s.s} · {s.p}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Stage>
  );
}

/* ---------- M172 · Squeeze accordion panels ---------- */
const M172_P = [
  { t: "Monsoon Linen", p: "₹ 4,800", i: 0 },
  { t: "Clay Studio", p: "₹ 2,350", i: 1 },
  { t: "Night Garden", p: "₹ 6,100", i: 2 },
  { t: "Harvest Oil", p: "₹ 1,450", i: 3 },
  { t: "Blue Hour", p: "₹ 3,900", i: 0 },
];
function M172() {
  const root = useRef<HTMLDivElement>(null);
  const cyc = useCycle(
    root,
    M172_P.length,
    (i, prev, q) => {
      q(".m172-panel").forEach((p, k) => gsap.to(p, { flexGrow: k === i ? 6 : 0.5, duration: 0.8, ease: "power3.inOut", overwrite: "auto" }));
      q(".m172-num").forEach((p, k) => gsap.to(p, { autoAlpha: k === i ? 0 : 1, duration: 0.3, overwrite: "auto" }));
      gsap.to(q(".m172-cap")[prev], { autoAlpha: 0, y: 16, duration: 0.25, overwrite: "auto" });
      gsap.fromTo(q(".m172-cap")[i], { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.5, delay: 0.5, ease: "power3.out", overwrite: "auto" });
    },
    1.35,
  );
  return (
    <Stage r={root} g1="rgba(24,196,143,.3)" g2="rgba(255,190,110,.2)">
      <div className="absolute inset-[5%] flex gap-[10px]" onMouseLeave={() => cyc.current.hover(null)}>
        {M172_P.map((p, k) => (
          <div key={k} className="m172-panel relative min-w-0 overflow-hidden rounded-[16px]" style={{ flexGrow: k === 0 ? 6 : 0.5, flexShrink: 1, flexBasis: 0 }} onMouseEnter={() => cyc.current.hover(k)} data-cursor="Open">
            <Img i={p.i} className="absolute inset-0" w={1000} h={900} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <p className="m172-num absolute left-1/2 top-[18px] -ml-[14px] w-[28px] text-center text-[13px] font-[700] text-white/85" style={{ fontFamily: GROTESK, opacity: k === 0 ? 0 : 1, visibility: k === 0 ? "hidden" : "visible" }}>
              0{k + 1}
            </p>
            <div className="m172-cap absolute bottom-[7%] left-[6%] whitespace-nowrap" style={k === 0 ? undefined : { opacity: 0, visibility: "hidden" }}>
              <p className="text-[13px] uppercase tracking-[0.2em] text-white/70">Edit 0{k + 1}</p>
              <p className="mt-1 text-[clamp(32px,3.6vw,58px)] font-[700] leading-none tracking-[-0.02em]" style={{ fontFamily: GROTESK }}>
                {p.t}
              </p>
              <p className="mt-2 text-[15px] text-white/80">from {p.p}</p>
            </div>
          </div>
        ))}
      </div>
    </Stage>
  );
}

/* ---------- M173 · Hover-expand panels with vertical labels (variant of M172: hairline frames, rotated labels, CSS only) ---------- */
const M173_P = [
  { t: "Atelier No. 1", s: "Wool overshirt", p: "₹ 8,400", i: 3 },
  { t: "Field Notes", s: "Waxed tote", p: "₹ 4,200", i: 2 },
  { t: "Quiet Hours", s: "Cashmere crew", p: "₹ 11,900", i: 1 },
  { t: "Low Tide", s: "Linen trouser", p: "₹ 5,600", i: 0 },
  { t: "Paper Moon", s: "Cotton sleep set", p: "₹ 6,300", i: 3 },
];
function M173() {
  const root = useRef<HTMLDivElement>(null);
  const cyc = useCycle(
    root,
    M173_P.length,
    (i, _prev, q, el) => {
      const ps = q(".m173-p");
      ps.forEach((p, k) => p.toggleAttribute("data-on", k === i));
      // fake pointer glides to where the hover would be (the panel's narrow column centre before it grows)
      const c = centerIn(ps[i], el, 0.5, 0.55);
      const ring = q(".b2g4i-ring")[0];
      gsap.to(ring, { x: c.x, y: c.y, duration: 0.6, ease: "power2.inOut", overwrite: "auto" });
      gsap.fromTo(ring, { scale: 1 }, { scale: 0.75, duration: 0.15, yoyo: true, repeat: 1, delay: 0.55 });
    },
    1.4,
  );
  return (
    <Stage r={root} g1="rgba(224,145,63,.3)" g2="rgba(255,255,255,.08)" bg="#100d0a">
      <div className="absolute inset-[5%] flex border-l border-white/15" onMouseLeave={() => cyc.current.hover(null)}>
        {M173_P.map((p, k) => (
          <div key={k} className="m173-p relative overflow-hidden border-r border-white/15" data-on={k === 0 ? "" : undefined} onMouseEnter={() => cyc.current.hover(k)} data-cursor="View">
            <div className="m173-img absolute inset-[10px] overflow-hidden rounded-[6px]">
              <Img i={p.i} w={1000} h={900} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            </div>
            <span className="absolute left-[24px] top-[22px] text-[13px] text-white/55" style={{ fontFamily: GROTESK }}>
              0{k + 1}
            </span>
            <div className="m173-lab">
              <p className="text-[clamp(22px,2.2vw,34px)] leading-[1.15]" style={{ fontFamily: SERIF, fontWeight: 500 }}>
                {p.t}
              </p>
              <p className="m173-meta mt-1 text-[15px] text-white/75">
                {p.s} · {p.p}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="b2g4i-ring" style={{ transform: "translate(-80px,-80px)" }} aria-hidden />
    </Stage>
  );
}

/* ---------- M174 · Accordion panels with inner image parallax (variant of M172: the picture pans against the width) ---------- */
const M174_P = [
  { t: "Kestrel Ridge", s: "Cabins · 2 nights", p: "₹ 18,500", i: 2 },
  { t: "Saltpan Bay", s: "Beach house · 3 nights", p: "₹ 26,000", i: 0 },
  { t: "Cedar Hollow", s: "Treehouse · 2 nights", p: "₹ 21,400", i: 3 },
  { t: "Mistvale", s: "Tea estate · 4 nights", p: "₹ 32,800", i: 1 },
];
const M174_W = "min(62vw, 860px)";
function M174() {
  const root = useRef<HTMLDivElement>(null);
  const cyc = useCycle(
    root,
    M174_P.length,
    (i, prev, q) => {
      q(".m174-panel").forEach((p, k) => gsap.to(p, { flexGrow: k === i ? 5 : 1, duration: 0.9, ease: "power3.inOut", overwrite: "auto" }));
      q(".m174-in").forEach((p, k) => gsap.to(p, { xPercent: k < i ? 14 : k > i ? -14 : 0, scale: k === i ? 1 : 1.12, duration: 0.9, ease: "power3.inOut", overwrite: "auto" }));
      gsap.to(q(".m174-cap")[prev], { autoAlpha: 0, yPercent: 30, duration: 0.25, overwrite: "auto" });
      gsap.fromTo(q(".m174-cap")[i], { autoAlpha: 0, yPercent: 60 }, { autoAlpha: 1, yPercent: 0, duration: 0.55, delay: 0.85, ease: "power3.out", overwrite: "auto" });
    },
    1.75,
  );
  return (
    <Stage r={root} g1="rgba(79,141,255,.32)" g2="rgba(24,196,143,.2)">
      <div className="absolute inset-[5%] flex gap-[14px]" onMouseLeave={() => cyc.current.hover(null)}>
        {M174_P.map((p, k) => (
          <div key={k} className="m174-panel relative min-w-0 overflow-hidden rounded-[22px]" style={{ flexGrow: k === 0 ? 5 : 1, flexShrink: 1, flexBasis: 0 }} onMouseEnter={() => cyc.current.hover(k)}>
            {/* the picture is wider than any panel width: it pans against the panel's growth */}
            <div className="m174-in absolute inset-y-0 left-1/2 will-change-transform" style={{ width: M174_W, marginLeft: `calc(${M174_W} / -2)`, transform: k === 0 ? undefined : `translateX(${k > 0 ? -14 : 14}%) scale(1.12)` }}>
              <Img i={p.i} w={1400} h={900} />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
            <div className="m174-cap absolute bottom-[8%] left-[7%] whitespace-nowrap" style={k === 0 ? undefined : { opacity: 0, visibility: "hidden" }}>
              <p className="text-[clamp(30px,3.4vw,54px)] font-[700] leading-none" style={{ fontFamily: WIDE }}>
                {p.t}
              </p>
              <p className="mt-2 text-[15px] text-white/80">
                {p.s} · {p.p}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Stage>
  );
}

/* ---------- M175 · Accordion row with slit-open photo (variant of M1) ---------- */
const M175_R = [
  { t: "Breakfast Room", b: "Sourdough, cultured butter, orchard jam. Served 7–11 every morning.", p: "₹ 950 per guest", i: 3 },
  { t: "The Courtyard", b: "Twelve tables under a fig tree. Small plates and long lunches.", p: "₹ 1,600 per guest", i: 2 },
  { t: "Cellar Bar", b: "Low light, natural wine by the glass, a short late menu.", p: "₹ 700 a glass", i: 1 },
  { t: "Garden Suites", b: "Six quiet rooms over the kitchen garden, linen and stone.", p: "₹ 14,500 a night", i: 0 },
];
function M175() {
  const root = useRef<HTMLDivElement>(null);
  const zTop = useRef(10);
  useCycle(
    root,
    M175_R.length,
    (i, prev, q) => {
      const bodies = q(".m175-body");
      gsap.to(bodies[prev], { height: 0, duration: 0.6, ease: "power3.inOut", overwrite: "auto" });
      gsap.to(bodies[i], { height: "auto", duration: 0.6, ease: "power3.inOut", overwrite: "auto" });
      q(".m175-plus").forEach((p, k) => gsap.to(p, { rotation: k === i ? 45 : 0, duration: 0.5, overwrite: "auto" }));
      q(".m175-t").forEach((p, k) => gsap.to(p, { opacity: k === i ? 1 : 0.45, duration: 0.4, overwrite: "auto" }));
      const ph = q(".m175-ph")[i];
      gsap.set(ph, { zIndex: ++zTop.current });
      gsap.fromTo(ph, { clipPath: "inset(50% 0% 50% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.75, ease: "power3.inOut", overwrite: "auto" });
      gsap.fromTo(ph.firstElementChild, { scale: 1.35 }, { scale: 1, duration: 1.1, ease: "power3.out", overwrite: "auto" });
    },
    1.45,
  );
  return (
    <Stage r={root} g1="rgba(255,160,90,.28)" g2="rgba(255,240,220,.08)" bg="#14100c">
      <div className="absolute inset-y-[8%] left-[5%] w-[44%]">
        <p className="text-[13px] uppercase tracking-[0.22em] text-[#e9c79b]">Hearth House · Spaces</p>
        <div className="mt-6 border-t border-white/15">
          {M175_R.map((r, k) => (
            <div key={k} className="border-b border-white/15">
              <div className="m175-t flex items-center justify-between py-[14px]" style={{ opacity: k === 0 ? 1 : 0.45 }}>
                <p className="text-[clamp(24px,2.4vw,38px)] leading-none" style={{ fontFamily: SERIF, fontWeight: 500 }}>
                  <span className="mr-4 align-middle text-[13px] text-white/50" style={{ fontFamily: GROTESK }}>
                    0{k + 1}
                  </span>
                  {r.t}
                </p>
                <span className="m175-plus text-[26px] font-[300] leading-none" style={{ transform: k === 0 ? "rotate(45deg)" : undefined }}>
                  +
                </span>
              </div>
              <div className="m175-body overflow-hidden" style={{ height: k === 0 ? "auto" : 0 }}>
                <p className="max-w-[44ch] pb-4 text-[15px] leading-relaxed text-white/70" style={{ fontFamily: MANROPE }}>
                  {r.b} <span className="text-[#e9c79b]">{r.p}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-[8%] right-[5%] top-[8%] w-[42%] overflow-hidden rounded-[10px] bg-black/30">
        {M175_R.map((r, k) => (
          <div key={k} className="m175-ph absolute inset-0 overflow-hidden" style={{ clipPath: k === 0 ? "inset(0% 0% 0% 0%)" : "inset(50% 0% 50% 0%)", zIndex: k === 0 ? 2 : 1 }}>
            <Img i={r.i} w={900} h={1000} className="will-change-transform" />
          </div>
        ))}
      </div>
    </Stage>
  );
}

/* ---------- M176 · Ken Burns split slideshow (variant of M13) ---------- */
const M176_S = [
  { e: "Chapter one", a: "Mornings on", b: "the salt road", i: 0 },
  { e: "Chapter two", a: "Supper under", b: "the old figs", i: 3 },
  { e: "Chapter three", a: "Rain over", b: "the tea hills", i: 2 },
];
function M176() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (_el, q) => {
    const imgs = q(".m176-img");
    const texts = q(".m176-txt");
    // Ken Burns: every photo keeps a slow linear zoom + pan (8 s each way) while it is shown
    const kb = imgs.map((im, k) =>
      gsap.fromTo(im, { scale: 1.06, xPercent: -3, yPercent: 1 }, { scale: 1.22, xPercent: 3, yPercent: -2, duration: 8, ease: "none", repeat: -1, yoyo: true }).progress(k * 0.3),
    );
    const tl = gsap.timeline({ repeat: -1, defaults: { immediateRender: false } });
    const n = M176_S.length;
    for (let s = 1; s <= n; s++) {
      const k = s % n;
      const p = s - 1;
      const at = s * 2.6 - 1;
      tl.fromTo(imgs[p], { opacity: 1 }, { opacity: 0, duration: 1.1, ease: "none" }, at)
        .fromTo(imgs[k], { opacity: 0 }, { opacity: 1, duration: 1.1, ease: "none", immediateRender: false }, at)
        .fromTo(texts[p].querySelectorAll(".m176-ln"), { yPercent: 0 }, { yPercent: -110, duration: 0.45, stagger: 0.06, ease: "power2.in" }, at)
        .set(texts[p], { autoAlpha: 0 }, at + 0.6)
        .set(texts[k], { autoAlpha: 1 }, at + 0.5)
        .fromTo(texts[k].querySelectorAll(".m176-ln"), { yPercent: 110 }, { yPercent: 0, duration: 0.6, stagger: 0.07, ease: "power3.out", immediateRender: false }, at + 0.5);
    }
    return [tl, ...kb];
  });
  return (
    <Stage r={root} g1="rgba(224,145,63,.26)" g2="rgba(79,141,255,.16)" bg="#f3ece2" className="!text-[#1d1610]">
      <div className="absolute inset-y-0 left-0 flex w-[44%] flex-col justify-center pl-[7%] pr-[4%]">
        <div className="grid">
          {M176_S.map((s, k) => (
            <div key={k} className="m176-txt [grid-area:1/1]" style={k === 0 ? undefined : { visibility: "hidden", opacity: 0 }}>
              <div className="overflow-hidden">
                <p className="m176-ln text-[13px] uppercase tracking-[0.22em] text-[#8a5a2b]">{s.e}</p>
              </div>
              <div className="mt-3 overflow-hidden pb-1">
                <p className="m176-ln text-[clamp(42px,4.6vw,76px)] leading-[0.98]" style={{ fontFamily: EDITORIAL }}>
                  {s.a}
                </p>
              </div>
              <div className="overflow-hidden pb-2">
                <p className="m176-ln text-[clamp(42px,4.6vw,76px)] italic leading-[0.98]" style={{ fontFamily: EDITORIAL }}>
                  {s.b}
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-8 text-[15px] text-[#1d1610]/70" style={{ fontFamily: MANROPE }}>
          Slow Coast Journeys · 6 nights from ₹ 96,000
        </p>
      </div>
      <div className="absolute bottom-[5%] right-[4%] top-[5%] w-[50%] overflow-hidden rounded-[18px]">
        {M176_S.map((s, k) => (
          <div key={k} className="absolute inset-0" style={{ opacity: k === 0 ? 1 : 0 }}>
            <div className="m176-img h-full w-full will-change-transform" style={{ transform: "scale(1.1)" }}>
              <Img i={s.i} w={1100} h={1000} />
            </div>
          </div>
        ))}
      </div>
    </Stage>
  );
}

/* ---------- M177 · Indicator hover clip slideshow (variant of M18) ---------- */
const M177_I = [
  { t: "Harbour Studio", p: "Prints from ₹ 2,400", i: 0 },
  { t: "Ochre Rooms", p: "Prints from ₹ 3,100", i: 3 },
  { t: "Greenhouse", p: "Prints from ₹ 2,800", i: 2 },
  { t: "Dusk Atlas", p: "Prints from ₹ 3,600", i: 1 },
];
function M177() {
  const root = useRef<HTMLDivElement>(null);
  const zTop = useRef(10);
  const cyc = useCycle(
    root,
    M177_I.length,
    (i, _prev, q, el) => {
      const ind = q(".m177-ind");
      ind.forEach((d, k) => {
        gsap.to(d, { opacity: k === i ? 1 : 0.4, x: k === i ? 14 : 0, duration: 0.5, ease: "power3.out", overwrite: "auto" });
        gsap.to(d.querySelector(".m177-bar"), { scaleX: k === i ? 1 : 0, duration: 0.6, ease: "power3.inOut", overwrite: "auto" });
      });
      const c = centerIn(ind[i], el, 0.32, 0.5);
      const ring = q(".b2g4i-ring")[0];
      gsap.to(ring, { x: c.x, y: c.y, duration: 0.55, ease: "power2.inOut", overwrite: "auto" });
      const sl = q(".m177-sl")[i];
      gsap.set(sl, { zIndex: ++zTop.current });
      gsap.fromTo(sl, { clipPath: "inset(0% 0% 0% 100%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.7, ease: "power3.inOut", overwrite: "auto" });
      gsap.fromTo(sl.firstElementChild, { scale: 1.18, xPercent: 6 }, { scale: 1, xPercent: 0, duration: 1, ease: "power3.out", overwrite: "auto" });
    },
    1.3,
  );
  return (
    <Stage r={root} g1="rgba(255,77,109,.26)" g2="rgba(79,141,255,.2)">
      <div className="absolute left-[5%] top-1/2 w-[34%] -translate-y-1/2" onMouseLeave={() => cyc.current.hover(null)}>
        <p className="mb-6 text-[13px] uppercase tracking-[0.22em] text-white/50">Northlight Prints · Series</p>
        {M177_I.map((d, k) => (
          <div key={k} style={{ marginLeft: `${k * 7}%` }}>
            <div className="m177-ind cursor-pointer py-[10px]" style={{ opacity: k === 0 ? 1 : 0.4, transform: k === 0 ? "translateX(14px)" : undefined }} onMouseEnter={() => cyc.current.hover(k)}>
              <p className="text-[clamp(26px,2.6vw,42px)] font-[650] leading-none tracking-[-0.02em]" style={{ fontFamily: GROTESK }}>
                <span className="mr-3 text-[13px] font-[500] text-white/50">0{k + 1}</span>
                {d.t}
              </p>
              <div className="m177-bar mt-2 h-[2px] w-[60%] origin-left bg-[#ff4d6d]" style={{ transform: k === 0 ? "scaleX(1)" : "scaleX(0)" }} />
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-[6%] right-[5%] top-[6%] w-[52%] overflow-hidden rounded-[14px]">
        {M177_I.map((d, k) => (
          <div key={k} className="m177-sl absolute inset-0 overflow-hidden" style={{ clipPath: k === 0 ? "inset(0% 0% 0% 0%)" : "inset(0% 0% 0% 100%)", zIndex: k === 0 ? 2 : 1 }}>
            <div className="h-full w-full will-change-transform">
              <Img i={d.i} w={1100} h={900} />
            </div>
            <p className="absolute bottom-5 left-6 rounded-full bg-black/45 px-4 py-2 text-[14px] backdrop-blur">{d.p}</p>
          </div>
        ))}
      </div>
      <div className="b2g4i-ring" style={{ transform: "translate(-80px,-80px)" }} aria-hidden />
    </Stage>
  );
}

/* ---------- M178 · Fluted glass ribs over image (WebGL) ---------- */
const M178_FRAG = /* glsl */ `
uniform float uShift;
void main() {
  float ribs = 22.0;
  vec2 uv = vUv;
  float x = uv.x * ribs + uShift;
  float f = fract(x);
  float k = f - 0.5;
  // each rib is a small cylinder lens: it squeezes and offsets its slice of the picture
  float bend = k * 0.85 + k * k * k * 2.2;
  vec2 s = uv;
  s.x += bend * (1.7 / ribs) + sin(uTime * 0.35 + floor(x) * 1.7) * 0.003;
  s.y += (1.0 - cos(k * 3.14159)) * 0.012;
  vec3 col;
  col.r = texture2D(uTex0, cover(s + vec2(0.004 * k, 0.0), uTexRes0)).r;
  col.g = texture2D(uTex0, cover(s, uTexRes0)).g;
  col.b = texture2D(uTex0, cover(s - vec2(0.004 * k, 0.0), uTexRes0)).b;
  float shade = 0.78 + 0.3 * sin(f * 3.14159);
  float spec = pow(max(0.0, 1.0 - abs(f - 0.28) * 5.0), 4.0);
  float edge = smoothstep(0.0, 0.04, f) * smoothstep(1.0, 0.96, f);
  col = col * shade * (0.75 + 0.25 * edge) + spec * 0.16;
  gl_FragColor = vec4(col, 1.0);
}`;
function M178() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    let dead = false;
    let h: GLHandle | null = null;
    let target = 0;
    let shift = 0;
    let lastMove = -10;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      target = ((e.clientX - r.left) / r.width - 0.5) * 2.4;
      lastMove = performance.now() / 1000;
    };
    el.addEventListener("pointermove", onMove);
    (async () => {
      const tex = await toCanvas(scene(1, 1400, 900, "HALCYONE"), 1400, 900);
      if (dead || !canvas.current) return;
      h = await createShader(canvas.current, M178_FRAG, {
        textures: [tex],
        dpr: 1.25,
        uniforms: { uShift: { value: 0 } },
        onFrame: (u, t) => {
          // slow drift; the real pointer takes over while it moves
          const auto = Math.sin(t * 0.55) * 1.1 + t * 0.12;
          const goal = performance.now() / 1000 - lastMove < 2 ? target + t * 0.12 : auto;
          shift += (goal - shift) * 0.06;
          u.uShift.value = shift;
        },
      });
      if (dead) h?.destroy();
    })();
    return () => {
      dead = true;
      el.removeEventListener("pointermove", onMove);
      h?.destroy();
    };
  }, []);
  return (
    <Stage r={root} g1="rgba(255,77,109,.3)" g2="rgba(255,179,107,.2)" bg="#120a10">
      <div className="absolute bottom-[6%] right-[5%] top-[6%] w-[56%] overflow-hidden rounded-[18px]" data-cursor="Glass">
        <Img i={1} w={1400} h={900} label="HALCYONE" className="absolute inset-0" />
        {/* fallback ribs (CSS) under the shader */}
        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,.12)_0,rgba(255,255,255,0)_1.6%,rgba(0,0,0,.2)_4.5%)]" />
        <canvas ref={canvas} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500" />
      </div>
      <div className="absolute left-[5%] top-1/2 max-w-[34%] -translate-y-1/2">
        <p className="text-[13px] uppercase tracking-[0.22em] text-[#ffb36b]">Maison Velour · Eau de parfum</p>
        <h3 className="mt-4 text-[clamp(44px,5vw,84px)] leading-[0.95]" style={{ fontFamily: SERIF, fontWeight: 500 }}>
          Halcyone, behind glass.
        </h3>
        <p className="mt-5 text-[16px] text-white/70">50 ml · ₹ 9,800</p>
      </div>
    </Stage>
  );
}

/* ---------- M179 · 360° product drag spin (variant of M27): drag scrubs a 48-frame turntable, inertia on release ---------- */
const M179_N = 48;
function drawBottle(ctx: CanvasRenderingContext2D, w: number, h: number, a: number) {
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2;
  const bw = w * 0.46;
  const top = h * 0.24;
  const bot = h * 0.9;
  const R = bw / 2;
  // shadow
  ctx.fillStyle = "rgba(0,0,0,.45)";
  ctx.beginPath();
  ctx.ellipse(cx, bot + h * 0.02, R * 1.15, h * 0.025, 0, 0, Math.PI * 2);
  ctx.fill();
  // cap + neck
  const cap = ctx.createLinearGradient(cx - R * 0.38, 0, cx + R * 0.38, 0);
  cap.addColorStop(0, "#3b2a16");
  cap.addColorStop(0.35, "#e6c58a");
  cap.addColorStop(0.55, "#fff1d0");
  cap.addColorStop(1, "#2a1d0e");
  ctx.fillStyle = cap;
  ctx.beginPath();
  ctx.roundRect(cx - R * 0.38, h * 0.08, R * 0.76, h * 0.13, 8);
  ctx.fill();
  // cap notch (rotates with the bottle)
  const nx = Math.sin(a + 0.6);
  if (Math.cos(a + 0.6) > 0) {
    ctx.fillStyle = "rgba(40,25,10,.8)";
    ctx.fillRect(cx + nx * R * 0.34 - 2, h * 0.09, 4 * Math.max(0.3, Math.cos(a + 0.6)), h * 0.11);
  }
  // glass body
  const body = ctx.createLinearGradient(cx - R, 0, cx + R, 0);
  body.addColorStop(0, "#0d2a2a");
  body.addColorStop(0.22, "#2f8c86");
  body.addColorStop(0.4, "#9fe3d6");
  body.addColorStop(0.62, "#2a7a74");
  body.addColorStop(1, "#071a1a");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.roundRect(cx - R, top, bw, bot - top, [R * 0.5, R * 0.5, R * 0.22, R * 0.22]);
  ctx.fill();
  // wrapped label features: their x follows sin(angle), width follows cos (foreshortening), back side hidden
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(cx - R, top, bw, bot - top, [R * 0.5, R * 0.5, R * 0.22, R * 0.22]);
  ctx.clip();
  const ly = top + (bot - top) * 0.36;
  const lh = (bot - top) * 0.38;
  ctx.fillStyle = "rgba(245,236,220,.92)";
  ctx.fillRect(cx - R, ly, bw, lh);
  const feats = [0, 1.2, 2.3, 3.4, 4.6, 5.6];
  feats.forEach((f, j) => {
    const th = f + a;
    const c = Math.cos(th);
    if (c <= 0.05) return;
    const x = cx + Math.sin(th) * R * 0.92;
    const sw = (j === 0 ? R * 0.9 : R * 0.12) * c;
    ctx.globalAlpha = 0.25 + 0.75 * c;
    if (j === 0) {
      // the front mark "N°7"
      ctx.save();
      ctx.translate(x, ly + lh * 0.55);
      ctx.scale(c, 1);
      ctx.fillStyle = "#16302e";
      ctx.font = `600 ${Math.round(lh * 0.42)}px Georgia, serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("N°7", 0, 0);
      ctx.restore();
    } else {
      ctx.fillStyle = j % 2 ? "#c9783d" : "#16302e";
      ctx.fillRect(x - sw / 2, ly, sw, lh);
    }
  });
  ctx.globalAlpha = 1;
  // label shading (cylinder): darker toward both edges
  const sh = ctx.createLinearGradient(cx - R, 0, cx + R, 0);
  sh.addColorStop(0, "rgba(0,0,0,.55)");
  sh.addColorStop(0.35, "rgba(0,0,0,0)");
  sh.addColorStop(0.7, "rgba(0,0,0,.05)");
  sh.addColorStop(1, "rgba(0,0,0,.6)");
  ctx.fillStyle = sh;
  ctx.fillRect(cx - R, top, bw, bot - top);
  // specular streak
  ctx.fillStyle = "rgba(255,255,255,.28)";
  ctx.fillRect(cx - R * 0.55, top + 12, R * 0.08, bot - top - 24);
  ctx.restore();
}
function M179() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const deg = useRef<HTMLSpanElement>(null);
  const tick = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    const W = 420;
    const H = 640;
    // the "image sequence": 48 pre-rendered turntable frames (stand-in for a kit video-frames sequence)
    const frames = Array.from({ length: M179_N }, (_, i) => {
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      drawBottle(c.getContext("2d")!, W, H, (i / M179_N) * Math.PI * 2);
      return c;
    });
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext("2d")!;
    let angle = 0; // in frames (float)
    let vel = 0; // frames per second
    let dragging = false;
    let lastX = 0;
    let lastT = 0;
    let drawn = -1;
    const render = () => {
      const f = ((Math.round(angle) % M179_N) + M179_N) % M179_N;
      if (f === drawn) return;
      drawn = f;
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(frames[f], 0, 0);
      const d = Math.round((f / M179_N) * 360);
      if (deg.current) deg.current.textContent = `${d}°`;
      if (tick.current) tick.current.style.transform = `rotate(${d}deg)`;
    };
    render();
    if (prefersReducedMotion()) return;
    const pxPerFrame = 9;
    const down = (x: number) => {
      dragging = true;
      vel = 0;
      lastX = x;
      lastT = performance.now();
    };
    const move = (x: number) => {
      if (!dragging) return;
      const now = performance.now();
      const dx = x - lastX;
      const dt = Math.max(1, now - lastT) / 1000;
      angle -= dx / pxPerFrame;
      vel = vel * 0.6 + (-dx / pxPerFrame / dt) * 0.4;
      lastX = x;
      lastT = now;
      render();
    };
    const up = () => (dragging = false);
    // inertia after release (exponential decay of the release speed)
    let on = false;
    const step = (_t: number, dtMs: number) => {
      if (!on || dragging) return;
      const dt = dtMs / 1000;
      if (Math.abs(vel) > 0.05) {
        angle += vel * dt;
        vel *= Math.exp(-2.2 * dt);
        render();
      }
    };
    gsap.ticker.add(step);
    // real pointer
    let userUntil = 0;
    const pd = (e: PointerEvent) => {
      userUntil = Infinity;
      auto.pause();
      down(e.clientX);
      el.setPointerCapture?.(e.pointerId);
    };
    const pm = (e: PointerEvent) => move(e.clientX);
    const pu = () => {
      up();
      userUntil = performance.now() + 2500;
    };
    el.addEventListener("pointerdown", pd);
    el.addEventListener("pointermove", pm);
    el.addEventListener("pointerup", pu);
    el.addEventListener("pointercancel", pu);
    // fake pointer: grabs, drags across, releases (inertia coasts), drags back the other way, loops
    const r = ring.current!;
    const p = { x: 0 };
    const auto = gsap.timeline({ repeat: -1, paused: true });
    const box = () => el.getBoundingClientRect().width;
    const leg = (from: number, to: number) => {
      auto
        .set(r, { autoAlpha: 1 })
        .fromTo(p, { x: from }, { x: from, duration: 0.05, immediateRender: false, onComplete: () => down(p.x * box()) })
        .to(r, { scale: 0.7, duration: 0.12 }, "<")
        .to(p, { x: to, duration: 0.85, ease: "power1.in", onUpdate: () => move(p.x * box()) })
        .call(up)
        .to(r, { scale: 1, duration: 0.15 }, "<")
        .to(r, { autoAlpha: 0.35, duration: 0.6 }, ">")
        .to({}, { duration: 0.55 });
    };
    leg(0.36, 0.64);
    leg(0.64, 0.36);
    auto.eventCallback("onUpdate", () => gsap.set(r, { x: p.x * box(), y: el.getBoundingClientRect().height * 0.55 }));
    const io = new IntersectionObserver(
      ([e]) => {
        on = e.isIntersecting;
        if (on && performance.now() > userUntil) auto.play();
        else auto.pause();
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    const resume = window.setInterval(() => {
      if (on && !dragging && userUntil !== Infinity && performance.now() > userUntil && auto.paused()) auto.play();
    }, 500);
    return () => {
      io.disconnect();
      window.clearInterval(resume);
      gsap.ticker.remove(step);
      auto.kill();
      el.removeEventListener("pointerdown", pd);
      el.removeEventListener("pointermove", pm);
      el.removeEventListener("pointerup", pu);
      el.removeEventListener("pointercancel", pu);
    };
  }, []);
  return (
    <Stage r={root} g1="rgba(24,196,143,.3)" g2="rgba(201,120,61,.22)" bg="#081312" className="cursor-grab touch-pan-y select-none">
      <div className="absolute inset-0 grid place-items-center" data-cursor="Drag">
        <canvas ref={canvas} className="h-[88%] w-auto" />
      </div>
      {/* 360 dial */}
      <div className="absolute bottom-[8%] left-[6%] flex items-center gap-4">
        <div className="relative h-[64px] w-[64px] rounded-full border border-white/25">
          <div ref={tick} className="absolute inset-0">
            <div className="absolute left-1/2 top-[-4px] h-[12px] w-[3px] -ml-[1.5px] rounded bg-[#9fe3d6]" />
          </div>
          <span ref={deg} className="absolute inset-0 grid place-items-center text-[13px] tabular-nums" style={{ fontFamily: GROTESK }}>
            0°
          </span>
        </div>
        <p className="text-[14px] text-white/65">Drag to turn</p>
      </div>
      <div className="absolute left-[6%] top-[12%] max-w-[30%]">
        <p className="text-[13px] uppercase tracking-[0.22em] text-[#9fe3d6]">Verdant Distillery</p>
        <h3 className="mt-3 text-[clamp(40px,4.4vw,72px)] font-[700] leading-[0.95] tracking-[-0.02em]" style={{ fontFamily: GROTESK }}>
          Every side of N°7.
        </h3>
      </div>
      <div className="absolute right-[6%] top-[12%] text-right">
        <p className="text-[clamp(20px,1.8vw,28px)] font-[650]" style={{ fontFamily: GROTESK }}>
          Botanical Gin · 700 ml
        </p>
        <p className="text-[15px] text-white/65">₹ 3,450</p>
      </div>
      <div ref={ring} className="b2g4i-ring" style={{ opacity: 0, visibility: "hidden" }} aria-hidden />
    </Stage>
  );
}

/* ---------- M180 · In-frame image parallax (scrub, variant of M7) ---------- */
const M180_F = [
  { t: "Stone & Linen", p: "₹ 12,400", i: 3 },
  { t: "Morning Kiln", p: "₹ 4,950", i: 0 },
  { t: "Garden Wing", p: "₹ 8,700", i: 2 },
];
function M180() {
  const root = useRef<HTMLDivElement>(null);
  useScrub(root, (p) => {
    const el = root.current;
    if (!el) return;
    const stage = el.getBoundingClientRect();
    const track = el.querySelector<HTMLElement>(".m180-track");
    if (!track) return;
    // the frames move at "page speed": the track travels linearly from below to above the stage
    const travel = track.offsetHeight + stage.height;
    const y = stage.height * 0.55 - p * travel * 0.78;
    track.style.transform = `translate3d(0,${y}px,0)`;
    // each photo slides inside its frame by exactly its spare height over the frame's own pass through the stage
    el.querySelectorAll<HTMLElement>(".m180-frame").forEach((f) => {
      const img = f.firstElementChild as HTMLElement;
      const top = y + f.offsetTop;
      const local = Math.min(1, Math.max(0, (stage.height - top) / (stage.height + f.offsetHeight)));
      const spare = img.offsetHeight - f.offsetHeight;
      img.style.transform = `translate3d(0,${-spare * local}px,0)`;
    });
  });
  return (
    <Stage r={root} g1="rgba(224,145,63,.28)" g2="rgba(79,141,255,.18)" bg="#0f0c09">
      <div className="absolute left-[6%] top-1/2 max-w-[32%] -translate-y-1/2">
        <p className="text-[13px] uppercase tracking-[0.22em] text-[#ffd59a]">Ashgrove Interiors</p>
        <h3 className="mt-4 text-[clamp(40px,4.4vw,72px)] leading-[0.98]" style={{ fontFamily: EDITORIAL }}>
          Rooms that hold the light.
        </h3>
        <p className="mt-5 text-[15px] text-white/65">The frame scrolls; the photo drifts slower inside it.</p>
      </div>
      <div className="m180-track absolute left-[46%] right-[6%] top-0 will-change-transform" style={{ transform: "translate3d(0,-40%,0)" }}>
        {M180_F.map((f, k) => (
          <div key={k} className={`mb-[56px] ${k % 2 ? "ml-[18%]" : "mr-[18%]"}`}>
            <div className="m180-frame relative h-[clamp(260px,42vh,420px)] overflow-hidden rounded-[14px]">
              <div className="absolute inset-x-0 top-0 h-[150%] will-change-transform">
                <Img i={f.i} w={1000} h={1100} />
              </div>
            </div>
            <div className="mt-3 flex justify-between text-[15px]">
              <span style={{ fontFamily: SERIF }}>{f.t}</span>
              <span className="text-white/65">{f.p}</span>
            </div>
          </div>
        ))}
      </div>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M171", name: "Coverflow with blurred ambient backdrop", how: "Auto: a 3D coverflow advances (neighbours rotateY and recede); the backdrop is a blurred copy of the active slide that crossfades, captions rise through line masks.", kind: "play", C: M171 },
  { code: "M172", name: "Squeeze accordion panels", how: "Auto (or hover): the active panel widens (flex-grow, 0.8 s power3.inOut) while the others squeeze to numbered slivers.", kind: "play", C: M172 },
  { code: "M173", name: "Hover-expand panels with vertical labels", how: "Auto pointer (or hover): a hairline panel grows to show its photo and its rotated label turns horizontal; siblings compress (CSS).", kind: "play", C: M173 },
  { code: "M174", name: "Accordion panels with inner image parallax", how: "Auto (or hover): the focused panel expands while the photo inside pans the opposite way; its caption rises once the width settles.", kind: "play", C: M174 },
  { code: "M175", name: "Accordion row with slit-open photo", how: "Auto: rows open in turn; each row's photo grows from a thin horizontal slit (clip inset 50%→0) with the image counter-scaling.", kind: "play", C: M175 },
  { code: "M176", name: "Ken Burns split slideshow", how: "Auto: the photo side slowly zooms and pans (8 s linear) and crossfades to the next; the text lines swap through masks.", kind: "play", C: M176 },
  { code: "M177", name: "Indicator hover clip slideshow", how: "Auto pointer (or hover): each staggered indicator wipes its slide in with a clip-path from the right (0.7 s).", kind: "play", C: M177 },
  { code: "M178", name: "Fluted glass ribs over image", how: "Auto (WebGL): the photo is seen through vertical reeded-glass ribs that refract slices; the rib offset drifts, or follows the pointer.", kind: "play", C: M178 },
  { code: "M179", name: "360° product drag spin", how: "Auto drag (or real drag): dragging scrubs a 48-frame turntable through 360°, then inertia coasts it after release.", kind: "play", C: M179 },
  { code: "M180", name: "In-frame image parallax", how: "Scroll: frames move at page speed while each photo slides inside its mask by exactly its spare height.", kind: "scrub", C: M180 },
];
