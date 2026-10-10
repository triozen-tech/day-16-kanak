"use client";

// MOTION-MENU M211–M222 (reveal group, batch 5 · group 1): small focused demos for /lab/motion.
// "play" demos start when on screen, loop, and pause off screen. "scrub" demos map the panel's scroll LINEARLY onto a
// paused timeline (useScrub → tl.progress(p)). Every demo also has a CSS-only glow loop (and a second one on top when
// photos cover the stage). ?static=1 / reduced motion: no JS motion, the markup shows the final state.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { scene, useScrub } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const GROTESK = "'Space Grotesk Variable', system-ui, sans-serif";
const SERIF = "'Fraunces Variable', Georgia, serif";
const EDITORIAL = "'Instrument Serif', Georgia, serif";
const WIDE = "'Syne Variable', 'Space Grotesk Variable', system-ui, sans-serif";
const BODY = "'Manrope Variable', system-ui, sans-serif";

const CSS = `
.b5r1-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.5)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.22)),transparent 70%);animation:b5r1-drift 5.2s linear infinite alternate;will-change:transform}
@keyframes b5r1-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b5r1-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4);pointer-events:none;z-index:40}
.m211-chip.on{background:#f4e9d8;color:#141018;border-color:#f4e9d8}
.m214-t{background-image:var(--img);background-size:800% 800%}
.m220-band{position:absolute;left:0;right:0;height:30%;pointer-events:none;z-index:5}
.m220-l{position:absolute;inset:0}
html.is-static .b5r1-glow{animation:none}
html.is-static {.b5r1-glow{animation:none}}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", bg = "#0a0d16", g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; bg?: string; g1?: string; g2?: string }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 text-[#eef2ff] ${className}`} style={{ background: bg }}>
      <style href="b5r1-css" precedence="default">
        {CSS}
      </style>
      <div className="b5r1-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/** The CSS glow loop again, ON TOP of photos (screen blend), so image-heavy demos never freeze. */
const Sheen = ({ g1 }: { g1?: string }) => (
  <div className="b5r1-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.45, zIndex: 35 } as CSSProperties} aria-hidden />
);

/** Play: a looping timeline that starts when the demo is on screen and pauses off screen. Nothing runs with reduced motion. */
function usePlay(root: RefObject<HTMLDivElement | null>, build: (el: HTMLDivElement) => gsap.core.Timeline) {
  const fn = useRef(build);
  fn.current = build;
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    let tl: gsap.core.Timeline | null = null;
    let on = false;
    let dead = false;
    const ctx = gsap.context(() => {}, el);
    const io = new IntersectionObserver(
      ([e]) => {
        on = e.isIntersecting;
        if (on) tl?.play();
        else tl?.pause();
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    Promise.resolve(document.fonts?.ready).then(() => {
      if (dead) return;
      ctx.add(() => {
        tl = fn.current(el);
        if (on) tl.play();
        else tl.pause();
      });
    });
    return () => {
      dead = true;
      io.disconnect();
      ctx.revert();
    };
  }, [root]);
}

/** Scrub: a paused timeline built once; scroll progress (0..1 over the whole panel) drives tl.progress linearly. */
function useScrubTl(root: RefObject<HTMLDivElement | null>, build: (tl: gsap.core.Timeline, el: HTMLDivElement) => void) {
  const tl = useRef<gsap.core.Timeline | null>(null);
  const pr = useRef(0);
  const fn = useRef(build);
  fn.current = build;
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const t = gsap.timeline({ paused: true, defaults: { ease: "none" } });
      fn.current(t, el);
      tl.current = t;
      t.progress(pr.current);
    }, el);
    return () => {
      tl.current = null;
      ctx.revert();
    };
  }, [root]);
  useScrub(root, (p) => {
    pr.current = p;
    tl.current?.progress(p);
  });
}

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, className = "", style, label = "", w = 1200, h = 900 }: { i: number; className?: string; style?: CSSProperties; label?: string; w?: number; h?: number }) => (
  <img src={scene(i, w, h, label)} alt="" className={`h-full w-full object-cover ${className}`} style={style} draggable={false} />
);

/* ---------- M211 · Wave-stagger grid reveal (variant of M34: the grid stagger travels as a wave from a corner / centre / edge) ---------- */
const M211_DIRS: { label: string; stagger: gsap.StaggerVars }[] = [
  { label: "From a corner", stagger: { grid: "auto", from: "start", amount: 0.8 } },
  { label: "From the centre", stagger: { grid: "auto", from: "center", amount: 0.8 } },
  { label: "From an edge", stagger: { grid: "auto", from: "start", axis: "x", amount: 0.8 } },
];
function M211() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const tiles = el.querySelectorAll(".m211-t");
    const chips = Array.from(el.querySelectorAll(".m211-chip"));
    const tl = gsap.timeline({ repeat: -1 });
    M211_DIRS.forEach((d, k) => {
      tl.call(() => chips.forEach((c, j) => c.classList.toggle("on", j === k)))
        .fromTo(tiles, { autoAlpha: 0, scale: 0.4, y: 24 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.5, ease: "power3.out", stagger: d.stagger })
        .to(tiles, { autoAlpha: 0, scale: 0.85, duration: 0.3, ease: "power2.in", stagger: { ...d.stagger, amount: 0.3 } }, "+=0.2");
    });
    return tl;
  });
  return (
    <Stage r={root} bg="#100c14" g1="rgba(214,150,255,.5)" g2="rgba(255,190,120,.24)">
      <div className="absolute left-[6%] top-[9%] max-w-[30%]">
        <p className="text-[13px] uppercase tracking-[0.22em] text-[#f4e9d8]/60" style={{ fontFamily: BODY }}>
          Spring edit · 15 pieces
        </p>
        <h3 className="mt-3 text-[clamp(40px,4.6vw,72px)] leading-[0.95] text-[#f4e9d8]" style={{ fontFamily: SERIF, fontWeight: 500 }}>
          The whole rack, in one wave.
        </h3>
        <div className="mt-6 flex flex-col items-start gap-2">
          {M211_DIRS.map((d, k) => (
            <span key={d.label} className={`m211-chip rounded-full border border-white/25 px-4 py-1.5 text-[13px] transition-colors duration-300 ${k === 0 ? "on" : ""}`} style={{ fontFamily: GROTESK }}>
              {d.label}
            </span>
          ))}
        </div>
      </div>
      <div className="absolute bottom-[8%] right-[5%] top-[8%] grid w-[56%] grid-cols-5 grid-rows-3 gap-3">
        {Array.from({ length: 15 }, (_, i) => (
          <div key={i} className="m211-t relative overflow-hidden rounded-[14px] will-change-transform">
            <Img i={i % 4} w={500} h={500} style={{ filter: `hue-rotate(${(i * 23) % 90}deg)` }} />
            <span className="absolute bottom-2 left-2.5 text-[12px] text-white/80" style={{ fontFamily: GROTESK }}>
              ₹ {(1290 + i * 340).toLocaleString("en-IN")}
            </span>
          </div>
        ))}
      </div>
      <Sheen g1="rgba(214,150,255,.5)" />
    </Stage>
  );
}

/* ---------- M212 · Mask opens with counter parallax (variant of M1: the window slides up, the photo inside counter-moves and stays put) ---------- */
function M212() {
  const root = useRef<HTMLDivElement>(null);
  useScrubTl(root, (tl) => {
    tl.fromTo(".m212-win", { yPercent: 100 }, { yPercent: 0, duration: 1 }, 0)
      .fromTo(".m212-in", { yPercent: -100 }, { yPercent: 0, duration: 1 }, 0)
      .fromTo(".m212-copy", { y: 40, opacity: 0.3 }, { y: 0, opacity: 1, duration: 1 }, 0);
  });
  return (
    <Stage r={root} bg="#0b1210" g1="rgba(24,196,143,.5)" g2="rgba(200,255,138,.2)">
      <div className="m212-copy absolute left-[6%] top-[12%] max-w-[32%]">
        <p className="text-[13px] uppercase tracking-[0.22em] text-[#c8ff8a]/70" style={{ fontFamily: BODY }}>
          Greenhouse No. 4
        </p>
        <h3 className="mt-3 text-[clamp(40px,4.8vw,76px)] leading-[0.95] text-[#f1fff4]" style={{ fontFamily: EDITORIAL }}>
          The window moves. The view stays.
        </h3>
        <p className="mt-5 max-w-[34ch] text-[15px] leading-relaxed text-white/60" style={{ fontFamily: BODY }}>
          Botanical tasting room · six seats a night · ₹ 3,900 per guest
        </p>
      </div>
      {/* the frame: its border marks where the window will end up */}
      <div className="absolute bottom-[10%] right-[6%] top-[10%] w-[50%] overflow-hidden rounded-[22px] border border-white/15">
        <div className="m212-win absolute inset-0 overflow-hidden will-change-transform">
          <div className="m212-in absolute inset-0 will-change-transform">
            <Img i={2} w={1100} h={1000} label="HOUSE OF FERNS" />
          </div>
        </div>
      </div>
      <Sheen g1="rgba(24,196,143,.5)" />
    </Stage>
  );
}

/* ---------- M213 · Slices retract, image settles (variant of M16: random-order slices over a photo scaling 1.3 → 1) ---------- */
const M213_N = 7;
function M213() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const slices = el.querySelectorAll(".m213-s");
    const img = el.querySelector(".m213-img");
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(slices, { scaleY: 1, transformOrigin: "50% 0%" })
      .set(img, { scale: 1.3 })
      .to(slices, { scaleY: 0, duration: 0.6, ease: "power3.inOut", stagger: { each: 0.08, from: "random" } }, 0.05)
      .to(img, { scale: 1, duration: 1.2, ease: "power2.out" }, 0.05)
      .set(slices, { transformOrigin: "50% 100%" }, "+=0.25")
      .to(slices, { scaleY: 1, duration: 0.4, ease: "power2.in", stagger: { each: 0.05, from: "random" } });
    return tl;
  });
  return (
    <Stage r={root} bg="#140f07" g1="rgba(224,145,63,.55)" g2="rgba(255,213,154,.2)">
      <div className="absolute bottom-[9%] left-[5%] top-[9%] w-[58%] overflow-hidden rounded-[20px]">
        <div className="m213-img absolute inset-0 will-change-transform">
          <Img i={3} w={1200} h={900} label="DUNE LOAFER" />
        </div>
        <div className="absolute inset-0 flex">
          {Array.from({ length: M213_N }, (_, i) => (
            <div key={i} className="m213-s h-full flex-1 will-change-transform" style={{ background: i % 2 ? "#2a1c0d" : "#33220f", transform: "scaleY(0)" }} />
          ))}
        </div>
      </div>
      <div className="absolute right-[5%] top-1/2 w-[30%] -translate-y-1/2">
        <p className="text-[13px] uppercase tracking-[0.22em] text-[#ffd59a]/70" style={{ fontFamily: BODY }}>
          Hand-stitched · Kanpur leather
        </p>
        <h3 className="mt-3 text-[clamp(44px,4.6vw,74px)] font-[700] leading-[0.92] tracking-[-0.03em] text-[#fff6e8]" style={{ fontFamily: GROTESK }}>
          Dune Loafer
        </h3>
        <p className="mt-4 text-[18px] text-[#ffd59a]" style={{ fontFamily: GROTESK }}>
          ₹ 7,450
        </p>
      </div>
      <Sheen g1="rgba(224,145,63,.5)" />
    </Stage>
  );
}

/* ---------- M214 · Pixel tiles assemble, then colour (variant of M17: 8×8 tiles fade in at random, then greyscale → colour) ---------- */
const M214_G = 8;
function M214() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const tiles = el.querySelectorAll(".m214-t");
    const pic = el.querySelector(".m214-pic");
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(tiles, { autoAlpha: 0 })
      .set(pic, { filter: "grayscale(1) brightness(.9)" })
      .to(tiles, { autoAlpha: 1, duration: 0.25, ease: "none", stagger: { amount: 1.2, from: "random" } })
      .to(pic, { filter: "grayscale(0) brightness(1)", duration: 0.8, ease: "power1.inOut" })
      .to(tiles, { autoAlpha: 0, duration: 0.2, ease: "none", stagger: { amount: 0.35, from: "random" } }, "+=0.25");
    return tl;
  });
  return (
    <Stage r={root} bg="#0b1020" g1="rgba(47,140,255,.55)" g2="rgba(159,216,255,.2)">
      <div
        className="m214-pic absolute left-[5%] top-1/2 grid aspect-[16/10] w-[56%] -translate-y-1/2 overflow-hidden rounded-[18px]"
        style={{ gridTemplateColumns: `repeat(${M214_G},1fr)`, gridTemplateRows: `repeat(${M214_G},1fr)`, "--img": `url("${scene(0, 1200, 750, "NORTH SHORE")}")` } as CSSProperties}
      >
        {Array.from({ length: M214_G * M214_G }, (_, i) => {
          const c = i % M214_G;
          const r = Math.floor(i / M214_G);
          return <div key={i} className="m214-t" style={{ backgroundPosition: `${(c / (M214_G - 1)) * 100}% ${(r / (M214_G - 1)) * 100}%` }} />;
        })}
      </div>
      <div className="absolute right-[5%] top-1/2 w-[32%] -translate-y-1/2">
        <p className="text-[13px] uppercase tracking-[0.22em] text-[#9fd8ff]/70" style={{ fontFamily: BODY }}>
          Print 08 / 40 · Archival giclée
        </p>
        <h3 className="mt-3 text-[clamp(40px,4.4vw,70px)] leading-[0.95] text-[#eaf5ff]" style={{ fontFamily: SERIF, fontWeight: 500 }}>
          Field notes, in colour.
        </h3>
        <p className="mt-4 text-[18px] text-[#9fd8ff]" style={{ fontFamily: GROTESK }}>
          ₹ 12,800 · framed
        </p>
      </div>
      <Sheen g1="rgba(47,140,255,.5)" />
    </Stage>
  );
}

/* ---------- M215 · Pixel hover swap (variant of M17: square cells pop over the card, then clear on the second image) ---------- */
const M215_C = 10;
const M215_R = 12;
function M215() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    const cd = card.current;
    const dt = dot.current;
    if (!el || !cd || !dt || prefersReducedMotion()) return;
    let master: gsap.core.Timeline | null = null;
    let resume: gsap.core.Tween | null = null;
    let on = false;
    let real = false;
    const ctx = gsap.context(() => {
      const cells = el.querySelectorAll(".m215-c");
      const b = el.querySelector(".m215-b");
      const cap = el.querySelector(".m215-cap");
      const swap = (toB: boolean) =>
        gsap
          .timeline()
          .to(cells, { autoAlpha: 1, duration: 0.05, stagger: { amount: 0.3, from: "random" } })
          .set(b, { autoAlpha: toB ? 1 : 0 })
          .call(() => {
            if (cap) cap.textContent = toB ? "Inside: brushed-cotton lining" : "Linen Overshirt · ₹ 3,490";
          })
          .to(cells, { autoAlpha: 0, duration: 0.05, stagger: { amount: 0.3, from: "random" } });
      const box = () => {
        const a = cd.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        return { l: a.left - r.left, t: a.top - r.top, w: a.width, h: a.height };
      };
      const offX = () => box().l + box().w + 140;
      const offY = () => box().t + box().h * 0.8;
      const inX = () => box().l + box().w * 0.55;
      const inY = () => box().t + box().h * 0.45;
      gsap.set(dt, { x: offX(), y: offY(), autoAlpha: 1 });
      gsap.set(b, { autoAlpha: 0 });
      master = gsap
        .timeline({ repeat: -1, paused: true })
        .to(dt, { x: inX, y: inY, duration: 0.5, ease: "power2.inOut" })
        .add(swap(true))
        .to(dt, { x: offX, y: offY, duration: 0.5, ease: "power2.inOut" }, "+=0.3")
        .add(swap(false), "-=0.15")
        .to({}, { duration: 0.15 });
      const enter = () => {
        real = true;
        resume?.kill();
        master?.pause();
        gsap.set(dt, { autoAlpha: 0 });
        gsap.set(b, { autoAlpha: 0 });
        swap(true);
      };
      const leave = () => {
        swap(false);
        resume = gsap.delayedCall(2, () => {
          real = false;
          gsap.set(dt, { autoAlpha: 1, x: offX(), y: offY() });
          if (on) master?.restart();
        });
      };
      cd.addEventListener("pointerenter", enter);
      cd.addEventListener("pointerleave", leave);
      return () => {
        cd.removeEventListener("pointerenter", enter);
        cd.removeEventListener("pointerleave", leave);
      };
    }, el);
    const io = new IntersectionObserver(
      ([e]) => {
        on = e.isIntersecting;
        if (real) return;
        if (on) master?.play();
        else master?.pause();
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      resume?.kill();
      ctx.revert();
    };
  }, []);
  return (
    <Stage r={root} bg="#120a10" g1="rgba(255,77,109,.55)" g2="rgba(255,179,107,.24)">
      <div className="absolute left-[6%] top-1/2 w-[34%] -translate-y-1/2">
        <p className="text-[13px] uppercase tracking-[0.22em] text-[#ffb36b]/70" style={{ fontFamily: BODY }}>
          Hover the card
        </p>
        <h3 className="mt-3 text-[clamp(40px,4.4vw,70px)] font-[700] leading-[0.95] tracking-[-0.03em] text-[#fff1e6]" style={{ fontFamily: GROTESK }}>
          See what&apos;s inside.
        </h3>
        <p className="m215-cap mt-5 text-[18px] text-[#ffb36b]" style={{ fontFamily: GROTESK }}>
          Linen Overshirt · ₹ 3,490
        </p>
      </div>
      <div ref={card} className="absolute right-[12%] top-1/2 aspect-[4/5] h-[80%] -translate-y-1/2 overflow-hidden rounded-[20px] border border-white/10" data-cursor="View">
        <Img i={1} w={800} h={1000} label="OVERSHIRT" className="absolute inset-0" />
        <div className="m215-b invisible absolute inset-0">
          <Img i={3} w={800} h={1000} label="LINING" className="absolute inset-0" />
        </div>
        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${M215_C},1fr)`, gridTemplateRows: `repeat(${M215_R},1fr)` }}>
          {Array.from({ length: M215_C * M215_R }, (_, i) => (
            <div key={i} className="m215-c invisible bg-[#ff4d6d]" />
          ))}
        </div>
      </div>
      <Sheen g1="rgba(255,77,109,.5)" />
      <div ref={dot} className="b5r1-dot invisible" aria-hidden />
    </Stage>
  );
}

/* ---------- shared product data for the grid demos ---------- */
const GOODS = [
  { n: "Monsoon Tote", p: "₹ 2,890" },
  { n: "Saltwater Cap", p: "₹ 1,450" },
  { n: "Ridge Bottle", p: "₹ 1,190" },
  { n: "Harbour Cardigan", p: "₹ 5,600" },
  { n: "Clay Mug Set", p: "₹ 1,780" },
  { n: "Drift Sandal", p: "₹ 3,250" },
  { n: "Ember Candle", p: "₹ 990" },
  { n: "Kite Scarf", p: "₹ 2,140" },
];

/* ---------- M216 · Group blur-slide stagger (variant of M19: each child rises ~16px while clearing a 5px blur) ---------- */
function M216() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const cards = el.querySelectorAll(".m216-c");
    const tl = gsap.timeline({ repeat: -1 });
    tl.fromTo(cards, { y: 16, opacity: 0, filter: "blur(5px)" }, { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.4, ease: "power2.out", stagger: 0.07 }).to(
      cards,
      { y: -8, opacity: 0, filter: "blur(5px)", duration: 0.3, ease: "power2.in", stagger: 0.03 },
      "+=0.25",
    );
    return tl;
  });
  return (
    <Stage r={root} bg="#0c0f14" g1="rgba(120,190,255,.5)" g2="rgba(255,200,140,.2)">
      <div className="absolute inset-x-[6%] top-[8%] flex items-end justify-between">
        <h3 className="text-[clamp(36px,3.8vw,60px)] font-[700] leading-none tracking-[-0.03em]" style={{ fontFamily: GROTESK }}>
          New this week
        </h3>
        <p className="text-[14px] text-white/55" style={{ fontFamily: BODY }}>
          8 pieces · free shipping over ₹ 2,500
        </p>
      </div>
      <div className="absolute inset-x-[6%] bottom-[8%] top-[24%] grid grid-cols-4 grid-rows-2 gap-4">
        {GOODS.map((g, i) => (
          <div key={g.n} className="m216-c flex min-h-0 flex-col rounded-[16px] border border-white/10 bg-white/[0.04] p-2.5 will-change-transform">
            <div className="min-h-0 flex-1 overflow-hidden rounded-[10px]">
              <Img i={i} w={600} h={460} />
            </div>
            <div className="flex items-baseline justify-between px-1 pt-2 text-[14px]" style={{ fontFamily: GROTESK }}>
              <span>{g.n}</span>
              <span className="text-white/60">{g.p}</span>
            </div>
          </div>
        ))}
      </div>
      <Sheen g1="rgba(120,190,255,.45)" />
    </Stage>
  );
}

/* ---------- M217 · Group blur-in stagger, no movement (variant of M19: a logo row only clears blur, nothing moves) ---------- */
const LOGOS: { n: string; f: string; w: number; s?: CSSProperties }[] = [
  { n: "Northvale", f: SERIF, w: 600 },
  { n: "KESTREL&CO", f: WIDE, w: 800, s: { letterSpacing: "0.02em", fontSize: "clamp(16px,1.66vw,26px)" } },
  { n: "halden", f: GROTESK, w: 700, s: { letterSpacing: "-0.04em" } },
  { n: "Oruva", f: EDITORIAL, w: 400, s: { fontStyle: "italic" } },
  { n: "MISTRAL LANE", f: BODY, w: 800, s: { letterSpacing: "0.18em" } },
  { n: "Fennick", f: SERIF, w: 800, s: { fontStyle: "italic" } },
  { n: "ATOLL", f: WIDE, w: 700, s: { letterSpacing: "0.3em" } },
  { n: "pebble/house", f: GROTESK, w: 500 },
];
function M217() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const logos = el.querySelectorAll(".m217-l");
    const tl = gsap.timeline({ repeat: -1 });
    tl.fromTo(logos, { opacity: 0.2, filter: "blur(4px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.5, ease: "power1.out", stagger: 0.1 }).to(
      logos,
      { opacity: 0.2, filter: "blur(4px)", duration: 0.35, ease: "power1.in", stagger: 0.05 },
      "+=0.25",
    );
    return tl;
  });
  return (
    <Stage r={root} bg="#0a0d16" g1="rgba(160,140,255,.5)" g2="rgba(120,220,200,.22)">
      <div className="flex h-full flex-col items-center justify-center px-[6%]">
        <p className="text-[13px] uppercase tracking-[0.26em] text-white/55" style={{ fontFamily: BODY }}>
          Stocked by 400+ independent stores
        </p>
        <h3 className="mt-3 text-center text-[clamp(36px,3.8vw,60px)] leading-none text-white" style={{ fontFamily: EDITORIAL }}>
          In good company.
        </h3>
        <div className="mt-12 grid w-full max-w-[1100px] grid-cols-4 gap-x-10 gap-y-12">
          {LOGOS.map((l) => (
            <span key={l.n} className="m217-l min-w-0 whitespace-nowrap text-center text-[clamp(22px,2.3vw,36px)] text-[#e8ecff]" style={{ fontFamily: l.f, fontWeight: l.w, ...l.s }}>
              {l.n}
            </span>
          ))}
        </div>
      </div>
    </Stage>
  );
}

/* ---------- M218 · Grow from blur (variant of M19: each image grows 0.85 → 1 while clearing a 10px blur, 0.09 s stagger) ---------- */
function M218() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const items = el.querySelectorAll(".m218-i");
    const tl = gsap.timeline({ repeat: -1 });
    tl.fromTo(items, { scale: 0.85, opacity: 0, filter: "blur(10px)" }, { scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.7, ease: "power3.out", stagger: 0.09 }).to(
      items,
      { scale: 0.95, opacity: 0, filter: "blur(6px)", duration: 0.3, ease: "power2.in", stagger: 0.04 },
      "+=0.2",
    );
    return tl;
  });
  const names = ["Kyoto Linen", "Coral Glaze", "Salt Bowl", "Fern Print", "Dusk Throw", "Olive Jar"];
  return (
    <Stage r={root} bg="#0d0b10" g1="rgba(255,122,160,.5)" g2="rgba(120,180,255,.22)">
      <div className="absolute left-[6%] top-[9%]">
        <p className="text-[13px] uppercase tracking-[0.22em] text-white/55" style={{ fontFamily: BODY }}>
          The home edit
        </p>
        <h3 className="mt-2 text-[clamp(36px,3.8vw,60px)] leading-none" style={{ fontFamily: SERIF, fontWeight: 500 }}>
          Slow things, sharp details.
        </h3>
      </div>
      <div className="absolute inset-x-[6%] bottom-[8%] top-[30%] grid grid-cols-3 grid-rows-2 gap-4">
        {names.map((n, i) => (
          <div key={n} className="m218-i relative overflow-hidden rounded-[16px] will-change-transform">
            <Img i={i + 1} w={700} h={420} />
            <span className="absolute bottom-3 left-4 text-[14px] font-[600] text-white/90" style={{ fontFamily: GROTESK }}>
              {n} · ₹ {(1450 + i * 620).toLocaleString("en-IN")}
            </span>
          </div>
        ))}
      </div>
      <Sheen g1="rgba(255,122,160,.45)" />
    </Stage>
  );
}

/* ---------- M219 · Puff-in (variant of M19: the block starts at 2× and blurred, contracting into place like settling smoke) ---------- */
const SCENTS = [
  { n: "Ember Oud", p: "₹ 6,200 · 50 ml", h: 0 },
  { n: "Salt Vetiver", p: "₹ 5,400 · 50 ml", h: 150 },
  { n: "Night Fig", p: "₹ 5,900 · 50 ml", h: 250 },
];
function M219() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const blocks = Array.from(el.querySelectorAll(".m219-b"));
    const tl = gsap.timeline({ repeat: -1 });
    gsap.set(blocks, { autoAlpha: 0 });
    blocks.forEach((b) => {
      tl.fromTo(b, { autoAlpha: 0, scale: 2, filter: "blur(4px)" }, { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.7, ease: "power3.out" }).to(
        b,
        { autoAlpha: 0, scale: 0.92, filter: "blur(3px)", duration: 0.3, ease: "power2.in" },
        "+=0.3",
      );
    });
    return tl;
  });
  return (
    <Stage r={root} bg="#0e0a12" g1="rgba(255,150,90,.5)" g2="rgba(190,120,255,.25)">
      <p className="absolute left-1/2 top-[8%] -translate-x-1/2 text-[13px] uppercase tracking-[0.26em] text-white/55" style={{ fontFamily: BODY }}>
        Extrait de parfum · small batch
      </p>
      <div className="relative flex h-full items-center justify-center">
        {SCENTS.map((s, i) => (
          <div key={s.n} className={`m219-b flex items-center gap-10 will-change-transform ${i === 0 ? "relative" : "invisible absolute"}`}>
            <div className="h-[clamp(220px,40vh,380px)] aspect-[3/4] overflow-hidden rounded-[18px]">
              <Img i={1} w={600} h={800} style={{ filter: `hue-rotate(${s.h}deg)` }} />
            </div>
            <div>
              <h3 className="text-[clamp(56px,6vw,96px)] leading-[0.9] text-[#fff1e6]" style={{ fontFamily: EDITORIAL }}>
                {s.n}
              </h3>
              <p className="mt-4 text-[18px] text-[#ffb36b]" style={{ fontFamily: GROTESK }}>
                {s.p}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Stage>
  );
}

/* ---------- M220 · Gradual blur edge band (variant of M19: stacked backdrop-blur layers at the top/bottom edges of a scroller) ---------- */
const M220_N = 6;
const M220_ROWS = [
  ["03 Jan", "A field guide to winter citrus"],
  ["11 Jan", "Inside the indigo vats of Bagru"],
  ["19 Jan", "Why we slow-dry every bean"],
  ["27 Jan", "The studio playlist, volume IV"],
  ["04 Feb", "Ceramics that ask to be used"],
  ["12 Feb", "Notes from a monsoon kitchen"],
  ["20 Feb", "How a scarf is block-printed"],
  ["28 Feb", "Small farms, long tables"],
  ["07 Mar", "The case for one good knife"],
  ["15 Mar", "Linen, washed eleven times"],
  ["23 Mar", "A weekend in the tea hills"],
  ["31 Mar", "What the potter keeps"],
  ["08 Apr", "Salt, smoke and stone"],
  ["16 Apr", "Letters to the next season"],
];
function M220Band({ side }: { side: "top" | "bottom" }) {
  const dir = side === "top" ? "to top" : "to bottom";
  return (
    <div className={`m220-band ${side === "top" ? "top-0" : "bottom-0"}`} aria-hidden>
      {Array.from({ length: M220_N }, (_, i) => {
        const a = (i / M220_N) * 100;
        const b = ((i + 1) / M220_N) * 100;
        const mask = `linear-gradient(${dir}, transparent ${a}%, #000 ${b}%)`;
        const blur = `blur(${0.5 * 2 ** i}px)`;
        return <div key={i} className="m220-l" style={{ backdropFilter: blur, WebkitBackdropFilter: blur, maskImage: mask, WebkitMaskImage: mask }} />;
      })}
    </div>
  );
}
function M220() {
  const root = useRef<HTMLDivElement>(null);
  useScrubTl(root, (tl, el) => {
    const list = el.querySelector<HTMLElement>(".m220-list");
    const win = el.querySelector<HTMLElement>(".m220-win");
    if (!list || !win) return;
    tl.fromTo(list, { y: () => win.clientHeight * 0.32 }, { y: () => -(list.offsetHeight - win.clientHeight * 0.68), duration: 1 });
  });
  return (
    <Stage r={root} bg="#0b0d12" g1="rgba(255,170,90,.5)" g2="rgba(90,170,255,.3)">
      <div className="absolute left-[6%] top-1/2 w-[30%] -translate-y-1/2">
        <p className="text-[13px] uppercase tracking-[0.22em] text-white/55" style={{ fontFamily: BODY }}>
          The Journal
        </p>
        <h3 className="mt-3 text-[clamp(40px,4.4vw,70px)] leading-[0.95]" style={{ fontFamily: SERIF, fontWeight: 500 }}>
          Stories soften at the edges.
        </h3>
      </div>
      <div className="m220-win absolute bottom-0 right-[6%] top-0 w-[52%] overflow-hidden">
        <ul className="m220-list will-change-transform">
          {M220_ROWS.map(([d, t], i) => (
            <li key={d} className="flex items-baseline gap-6 border-b border-white/10 py-5">
              <span className="w-[72px] shrink-0 text-[13px] uppercase tracking-[0.12em] text-[#ffb36b]" style={{ fontFamily: GROTESK }}>
                {d}
              </span>
              <span className="text-[clamp(22px,2.2vw,34px)] leading-tight" style={{ fontFamily: i % 3 === 1 ? EDITORIAL : GROTESK, fontWeight: i % 3 === 1 ? 400 : 500 }}>
                {t}
              </span>
            </li>
          ))}
        </ul>
        <M220Band side="top" />
        <M220Band side="bottom" />
      </div>
    </Stage>
  );
}

/* ---------- M221 · Paper unfold in steps (variant of M2: flaps rotate open 180° one after another, each doubling the card) ---------- */
// Card 640×440 = four quarters. Closed: only the top-left quarter shows (the back of the folded paper on top).
// Step 1: the right column (top-right + the folded bottom-right on it) opens around the centre line.
// Step 2: the bottom half, folded up over the top half, opens down around the middle line.
const PAPER = "#efe4d0";
const PAPER_BACK = "#ddcfb4";
function M221() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const card = el.querySelector(".m221-card");
    const right = el.querySelector(".m221-r");
    const bottom = el.querySelector(".m221-b");
    const brp = el.querySelector(".m221-brp");
    const shR = el.querySelector(".m221-shr");
    const shB = el.querySelector(".m221-shb");
    const tl = gsap.timeline({ repeat: -1, yoyo: true, repeatDelay: 0.25 });
    gsap.set(right, { transformPerspective: 1400, transformOrigin: "0% 50%" });
    gsap.set(bottom, { transformPerspective: 1400, transformOrigin: "50% 0%" });
    tl.set(card, { x: 160, y: 110 })
      .set(right, { rotationY: -180 })
      .set(bottom, { rotationX: 180, clipPath: "inset(0% 50% 0% 0%)", zIndex: 2 })
      .set(brp, { autoAlpha: 1 })
      .set([shR, shB], { opacity: 0.55 })
      // step 1: right column opens, the card recentres
      .to(right, { rotationY: 0, duration: 0.75, ease: "power2.inOut" }, 0.1)
      .to(shR, { opacity: 0, duration: 0.75, ease: "power2.in" }, 0.1)
      .to(card, { x: 0, duration: 0.75, ease: "power2.inOut" }, 0.1)
      // hand-over: the folded bottom-right becomes part of the full-width bottom flap
      .set(brp, { autoAlpha: 0 })
      .set(bottom, { clipPath: "inset(0% 0% 0% 0%)", zIndex: 4 })
      // step 2: the bottom half opens down
      .to(bottom, { rotationX: 0, duration: 0.75, ease: "power2.inOut" }, "+=0.05")
      .to(shB, { opacity: 0, duration: 0.75, ease: "power2.in" }, "<")
      .to(card, { y: 0, duration: 0.75, ease: "power2.inOut" }, "<");
    return tl;
  });
  const face = "absolute inset-0 [backface-visibility:hidden]";
  return (
    <Stage r={root} bg="#100d0a" g1="rgba(255,190,120,.5)" g2="rgba(200,120,90,.24)">
      <p className="absolute left-[5%] top-[8%] text-[13px] uppercase tracking-[0.22em] text-white/55" style={{ fontFamily: BODY }}>
        Invitation · unfold
      </p>
      <div className="absolute left-1/2 top-1/2 h-0 w-0">
        {/* the card: 640×440 centred around (0,0); x/y offsets keep the visible part centred while it unfolds */}
        <div className="m221-card absolute left-[-320px] top-[-220px] h-[440px] w-[640px] text-[#2b2118]" style={{ fontFamily: GROTESK }}>
          {/* top-left quarter */}
          <div className="absolute left-0 top-0 z-[1] h-[220px] w-[320px] p-7 shadow-[0_30px_60px_rgba(0,0,0,.35)]" style={{ background: PAPER }}>
            <p className="text-[12px] uppercase tracking-[0.24em] opacity-60">You are invited</p>
            <h3 className="mt-3 text-[46px] leading-[0.92]" style={{ fontFamily: EDITORIAL }}>
              Saffron &amp; Salt
            </h3>
            <p className="mt-3 text-[13px] opacity-70">A seven-course supper</p>
          </div>
          {/* bottom half: folded up over the top half at first (front = content, back = paper) */}
          <div className="m221-b absolute left-0 top-[220px] h-[220px] w-[640px] [transform-style:preserve-3d]" style={{ zIndex: 4 }}>
            <div className={`${face} flex items-end justify-between p-7`} style={{ background: PAPER }}>
              <ul className="space-y-1 text-[14px]">
                <li>Smoked tomato rasam</li>
                <li>Charred corn, curry leaf butter</li>
                <li>Coastal prawn, raw mango</li>
                <li>Jaggery kulfi, sea salt</li>
              </ul>
              <div className="text-right">
                <p className="text-[12px] uppercase tracking-[0.2em] opacity-60">Per guest</p>
                <p className="text-[34px] font-[700] tracking-[-0.02em]">₹ 4,800</p>
              </div>
              <div className="m221-shb pointer-events-none absolute inset-0 bg-gradient-to-b from-black/60 to-transparent opacity-0" />
            </div>
            <div className={face} style={{ background: PAPER_BACK, transform: "rotateX(180deg)" }} />
          </div>
          {/* right column: top-right quarter (front / back) + the folded bottom-right lying on it */}
          <div className="m221-r absolute left-[320px] top-0 z-[3] h-[220px] w-[320px] [transform-style:preserve-3d]">
            <div className={`${face} border-l border-black/10 p-7`} style={{ background: PAPER }}>
              <p className="text-[12px] uppercase tracking-[0.24em] opacity-60">When</p>
              <p className="mt-2 text-[30px] font-[700] leading-tight tracking-[-0.02em]">Sat 14 Dec</p>
              <p className="text-[16px] opacity-75">8 pm · twelve seats</p>
              <p className="mt-4 text-[12px] uppercase tracking-[0.24em] opacity-60">Where</p>
              <p className="text-[15px]">The Long Table, Studio 3</p>
              <div className="m221-shr pointer-events-none absolute inset-0 bg-gradient-to-r from-black/60 to-transparent opacity-0" />
            </div>
            <div className={face} style={{ background: PAPER_BACK, transform: "rotateY(180deg)" }} />
            <div className={`m221-brp invisible ${face}`} style={{ background: PAPER_BACK, transform: "translateZ(1px)" }} />
          </div>
        </div>
      </div>
    </Stage>
  );
}

/* ---------- M222 · Outlined wordmark rises into the footer (variant of M24: a giant outline name rises and draws in) ---------- */
function M222() {
  const root = useRef<HTMLDivElement>(null);
  useScrubTl(root, (tl) => {
    tl.fromTo(".m222-word", { yPercent: 70 }, { yPercent: 0, duration: 1 }, 0)
      .fromTo(".m222-txt", { strokeDashoffset: 1400, fillOpacity: 0 }, { strokeDashoffset: 0, fillOpacity: 0.08, duration: 1 }, 0)
      .fromTo(".m222-col", { y: 30, opacity: 0.2 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.1 }, 0);
  });
  return (
    <Stage r={root} bg="#07090e" g1="rgba(120,160,255,.5)" g2="rgba(255,140,110,.22)">
      <div className="absolute inset-x-[6%] top-[10%] grid grid-cols-4 gap-8 text-[15px]" style={{ fontFamily: BODY }}>
        <div className="m222-col">
          <p className="text-[13px] uppercase tracking-[0.2em] text-white/45">Shop</p>
          <p className="mt-3 leading-8 text-white/80">Outerwear<br />Knitwear<br />Objects</p>
        </div>
        <div className="m222-col">
          <p className="text-[13px] uppercase tracking-[0.2em] text-white/45">Studio</p>
          <p className="mt-3 leading-8 text-white/80">Journal<br />Stockists<br />Care guide</p>
        </div>
        <div className="m222-col col-span-2">
          <p className="text-[13px] uppercase tracking-[0.2em] text-white/45">Letters, monthly</p>
          <div className="mt-4 flex max-w-[440px] items-center justify-between border-b border-white/30 pb-3">
            <span className="text-white/50">your@email.com</span>
            <span className="text-white">Join →</span>
          </div>
          <p className="mt-4 text-[13px] text-white/40">Concept website by Lumen Studio</p>
        </div>
      </div>
      <div className="absolute inset-x-[4%] bottom-0 overflow-hidden">
        <svg className="m222-word block w-full will-change-transform" viewBox="0 0 1200 250" aria-label="Halden">
          <text
            className="m222-txt"
            x="600"
            y="225"
            textAnchor="middle"
            textLength="1160"
            lengthAdjust="spacingAndGlyphs"
            fontSize="250"
            fontWeight="800"
            fill="#dfe6ff"
            fillOpacity="0.08"
            stroke="#dfe6ff"
            strokeWidth="1.6"
            style={{ fontFamily: WIDE, strokeDasharray: 1400, strokeDashoffset: 0 }}
          >
            HALDEN
          </text>
        </svg>
      </div>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M211", name: "Wave-stagger grid reveal", how: "Grid tiles reveal in a wave from a corner, the centre, then an edge (grid stagger, ~0.8 s), looping on screen.", kind: "play", C: M211 },
  { code: "M212", name: "Mask opens with counter parallax", how: "Scroll slides the image window up while the photo inside moves down by the same amount, so the photo stays still.", kind: "scrub", C: M212 },
  { code: "M213", name: "Slices retract, image settles", how: "Seven slices retract in random order while the photo underneath settles from 1.3× to 1×.", kind: "play", C: M213 },
  { code: "M214", name: "Pixel tiles assemble, then colour", how: "An 8×8 tile grid fades in at random over ~1.2 s, then the whole image goes from greyscale to colour.", kind: "play", C: M214 },
  { code: "M215", name: "Pixel hover swap", how: "On hover (auto ring on camera) square cells pop over the card at random, then clear on the second image.", kind: "play", C: M215 },
  { code: "M216", name: "Group blur-slide stagger", how: "Product cards rise 16px while clearing a 5px blur, 0.07 s apart.", kind: "play", C: M216 },
  { code: "M217", name: "Group blur-in stagger (no movement)", how: "A logo row clears from blur(4px) to sharp one by one, 0.1 s apart, with no movement at all.", kind: "play", C: M217 },
  { code: "M218", name: "Grow from blur", how: "Each image grows 0.85 → 1 while clearing a 10px blur, 0.09 s apart.", kind: "play", C: M218 },
  { code: "M219", name: "Puff-in", how: "Each product block starts at 2× and blurred, contracting to 1× and sharp like settling smoke (~0.7 s).", kind: "play", C: M219 },
  { code: "M220", name: "Gradual blur edge band", how: "Scroll moves a journal list through stacked backdrop-blur layers, so rows blur progressively at the top and bottom edges.", kind: "scrub", C: M220 },
  { code: "M221", name: "Paper unfold in steps", how: "A folded card opens like paper: the right flap swings open 180°, then the bottom flap, each doubling the card.", kind: "play", C: M221 },
  { code: "M222", name: "Outlined wordmark rises into the footer", how: "Scroll lifts a giant outlined brand name into the footer while its outline draws in.", kind: "scrub", C: M222 },
];
