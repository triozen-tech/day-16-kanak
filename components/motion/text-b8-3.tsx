"use client";

// Text motions, batch 8 · group 3 (MOTION-MENU M374–M385). Small focused demos for /lab/motion, rebuilt in GSAP / SVG / CSS
// from the idea only. Every demo: plays by itself on screen (or follows the scroll), loops, has a CSS glow loop that never
// stops, and shows a sensible final state in ?static=1 / reduced motion.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject, type SVGProps } from "react";
import { gsap, SplitText, loadPlugin, prefersReducedMotion } from "@/lib/gsap";
import { scene, useScrub } from "@/components/fx/shared";
import type { Flip as FlipT } from "gsap/Flip";
import type { MotionDef } from "./types";

const F = { sg: "Space Grotesk Variable", fr: "Fraunces Variable", is: "Instrument Serif", sy: "Syne Variable", mr: "Manrope Variable" };
const ACC = "#ffa35c";

const CSS = `
.b8g3-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 32% 38%,var(--g1,rgba(255,163,92,.42)),transparent 70%),radial-gradient(34% 40% at 70% 66%,var(--g2,rgba(79,141,255,.22)),transparent 70%);animation:b8g3-drift 6s linear infinite alternate;will-change:transform}
.b8g3-top{mix-blend-mode:screen;opacity:.45;z-index:5}
@keyframes b8g3-drift{0%{transform:translate3d(-7%,-5%,0) scale(1)}100%{transform:translate3d(7%,6%,0) scale(1.15)}}
.m383-ch{display:inline-block;white-space:pre;will-change:transform}
.m383-btn{transition:background-color .35s ease,color .35s ease}
.m383-btn.is-done{background:#eaf5ff;color:#0a0f1c}
html.is-static .b8g3-glow{animation:none}
html.is-static {.b8g3-glow{animation:none}}
`;

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). `top` adds a second glow over the content. */
function Stage({
  r,
  children,
  className = "",
  g1,
  g2,
  top = false,
}: {
  r?: RefObject<HTMLDivElement | null>;
  children: ReactNode;
  className?: string;
  g1?: string;
  g2?: string;
  top?: boolean;
}) {
  const vars = { "--g1": g1, "--g2": g2 } as CSSProperties;
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0f1c] text-[#eaf5ff] ${className}`}>
      <style href="b8g3-css" precedence="default">
        {CSS}
      </style>
      <div className="b8g3-glow" style={vars} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
      {top && <div className="b8g3-glow b8g3-top" style={vars} aria-hidden />}
    </div>
  );
}

/** "play" helper: waits for fonts (+ an optional plugin), builds the looping animation in a gsap.context, plays it only on screen. */
function usePlay(
  ref: RefObject<HTMLElement | null>,
  build: (root: HTMLElement, onClean: (fn: () => void) => void) => gsap.core.Animation | void,
  wait?: () => Promise<unknown>,
) {
  const b = useRef(build);
  b.current = build;
  const w = useRef(wait);
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
    Promise.all([document.fonts.ready, w.current?.()]).then(() => {
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

/** True while the element is on screen (for ticker-driven demos). */
function useOnScreen(ref: RefObject<HTMLElement | null>) {
  const on = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => (on.current = e.isIntersecting), { rootMargin: "60px" });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return on;
}

/** Small deterministic random (same rhythm every loop and every load). */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const Caption = ({ children }: { children: ReactNode }) => (
  <p className="absolute bottom-5 left-6 text-[13px] uppercase tracking-[0.18em] text-white/60">{children}</p>
);

/** Thin scroll-progress bar for scrub demos. */
const Bar = ({ r }: { r: RefObject<HTMLSpanElement | null> }) => (
  <span className="absolute bottom-6 right-6 block h-px w-[160px] bg-white/15" aria-hidden>
    <span ref={r} className="absolute inset-0 origin-left bg-[#ffa35c]" style={{ transform: "scaleX(1)" }} />
  </span>
);

/* ───────────────────────── M374 · Squashed blurry chars (scrub, SplitText) ───────────────────────── */
function M374() {
  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const last = useRef(0);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    let dead = false;
    let split: SplitText | null = null;
    const ctx = gsap.context(() => {}, el);
    document.fonts.ready.then(() => {
      if (dead) return;
      ctx.add(() => {
        split = SplitText.create(el.querySelector<HTMLElement>(".m374-h")!, { type: "words,chars" });
        const chars = split.chars as HTMLElement[];
        gsap.set(chars, { transformOrigin: "50% 72%" });
        const t = gsap.timeline({ paused: true });
        // linear over the whole panel: each char squashed (scaleY .1, scaleX 1.8) + blurred → normal + sharp, staggered
        t.fromTo(
          chars,
          { scaleY: 0.1, scaleX: 1.8, filter: "blur(14px)", opacity: 0.25 },
          { scaleY: 1, scaleX: 1, filter: "blur(0px)", opacity: 1, duration: 1, ease: "sine.out", stagger: 0.14 },
        );
        t.progress(last.current);
        tl.current = t;
      });
    });
    return () => {
      dead = true;
      tl.current = null;
      ctx.revert();
      split?.revert();
    };
  }, []);
  useScrub(root, (p) => {
    last.current = p;
    tl.current?.progress(p);
    if (bar.current) bar.current.style.transform = `scaleX(${p})`;
  });
  return (
    <Stage r={root} g1="rgba(255,163,92,.4)" g2="rgba(92,200,255,.24)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center">
          <p className="mb-6 text-[13px] uppercase tracking-[0.22em] text-white/55">New season · road running</p>
          <h3 className="m374-h text-[clamp(64px,6.8vw,112px)] font-[800] uppercase leading-[0.98] tracking-[-0.01em]" style={{ fontFamily: F.sy }}>
            <span className="block">Cloud</span>
            <span className="block">Knit run</span>
          </h3>
          <p className="mt-8 text-[13px] uppercase tracking-[0.22em] text-white/60">Featherweight runner · 212 g · ₹8,990</p>
        </div>
      </div>
      <Bar r={bar} />
    </Stage>
  );
}

/* ───────────────────────── M375 · Squiggly / boiling text (play, SVG filter) ───────────────────────── */
const M375_N = 5;
function M375() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const targets = gsap.utils.toArray<HTMLElement | SVGElement>(".m375-boil", el);
    // the turbulence seed changes in steps at 10 fps: five prebuilt filters (never tween baseFrequency every frame)
    const tl = gsap.timeline({ repeat: -1 });
    for (let k = 0; k < 10; k++) {
      const f = `url(#m375-f${k % M375_N})`;
      tl.call(() => targets.forEach((t) => (t.style.filter = f)), [], k * 0.1);
    }
    tl.to({}, { duration: 0.1 }, 0.9);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,120,150,.38)" g2="rgba(255,200,90,.26)">
      <svg width="0" height="0" className="absolute" aria-hidden>
        <defs>
          {Array.from({ length: M375_N }, (_, k) => (
            <filter key={k} id={`m375-f${k}`} x="-4%" y="-10%" width="108%" height="120%">
              <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={1} seed={k * 7 + 3} result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale={6 + (k % 3)} xChannelSelector="R" yChannelSelector="G" />
            </filter>
          ))}
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center">
          <h3
            className="m375-boil text-[clamp(72px,8vw,132px)] font-[800] leading-none tracking-[-0.01em]"
            style={{ fontFamily: F.sy, filter: "url(#m375-f0)" }}
          >
            Doodle Club
          </h3>
          <svg viewBox="0 0 600 40" className="m375-boil mx-auto mt-4 w-[min(48%,560px)]" style={{ filter: "url(#m375-f0)" }} aria-hidden>
            <path d="M8 26 C 90 8, 170 34, 250 20 S 420 6, 592 22" fill="none" stroke={ACC} strokeWidth={7} strokeLinecap="round" />
          </svg>
          <p className="mt-8 text-[13px] uppercase tracking-[0.22em] text-white/60">Chunky crayon set · 24 colours · ₹649</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M376 · Staggered letter up/drop (play, SplitText) ───────────────────────── */
function M376() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const split = SplitText.create(el.querySelector<HTMLElement>(".m376-h")!, { type: "chars" });
    onClean(() => split.revert());
    const chars = split.chars as HTMLElement[];
    const line = el.querySelector<HTMLElement>(".m376-line")!;
    const tl = gsap.timeline({ repeat: -1 });
    // odd letters drop from above, even letters rise from below; they meet on the baseline, then leave the way they travelled
    tl.fromTo(
      chars,
      { yPercent: (i: number) => (i % 2 ? -130 : 130), opacity: 0, rotate: (i: number) => (i % 2 ? -8 : 8) },
      { yPercent: 0, opacity: 1, rotate: 0, duration: 0.6, ease: "power2.out", stagger: 0.07 },
      0,
    );
    tl.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: "sine.inOut" }, 0);
    tl.to(chars, { yPercent: (i: number) => (i % 2 ? 130 : -130), opacity: 0, duration: 0.42, ease: "power1.in", stagger: 0.045 }, "+=0.22");
    tl.to(line, { scaleX: 0, duration: 0.5, ease: "sine.in" }, "<0.1");
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(160,220,120,.34)" g2="rgba(255,163,92,.26)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center">
          <p className="mb-6 text-[13px] uppercase tracking-[0.22em] text-white/55">Studio pilates · Thursday 7 am</p>
          <h3 className="m376-h text-[clamp(64px,7.4vw,124px)] font-[800] uppercase leading-none tracking-[0.01em]" style={{ fontFamily: F.sy }}>
            Balance
          </h3>
          <span className="m376-line mx-auto mt-5 block h-[3px] w-[min(56%,620px)] origin-center bg-[#ffa35c]" aria-hidden />
          <p className="mt-8 text-[13px] uppercase tracking-[0.22em] text-white/60">Ten-class pass · ₹6,500</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M377 · Strikethrough replace (play, gsap) ───────────────────────── */
function M377() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const old = el.querySelector<HTMLElement>(".m377-old")!;
    const line = el.querySelector<HTMLElement>(".m377-line")!;
    const neu = el.querySelector<HTMLElement>(".m377-new")!;
    const tagWas = el.querySelector<HTMLElement>(".m377-was")!;
    const tagNow = el.querySelector<HTMLElement>(".m377-now")!;
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(old, { autoAlpha: 1, y: 0, rotate: 0, color: "#eaf5ff" }, 0)
      .set(line, { scaleX: 0 }, 0)
      .set(neu, { autoAlpha: 0, y: 0, clipPath: "inset(0% 0% 100% 0%)" }, 0)
      .set(tagWas, { autoAlpha: 1 }, 0)
      .set(tagNow, { autoAlpha: 0 }, 0);
    tl.fromTo(old, { autoAlpha: 0, y: -24 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" }, 0);
    // 1 · the line strikes through the old price
    tl.to(line, { scaleX: 1, duration: 0.45, ease: "power2.inOut" }, 0.2);
    tl.to(old, { color: "rgba(234,245,255,.45)", duration: 0.3, ease: "none" }, 0.45);
    // 2 · the old price drops away (the line goes with it)
    tl.to(old, { y: 46, rotate: 3, autoAlpha: 0, duration: 0.42, ease: "power1.in" }, 0.7);
    tl.to(tagWas, { autoAlpha: 0, duration: 0.25 }, 0.7);
    // 3 · the new price reveals in its place
    tl.fromTo(
      neu,
      { autoAlpha: 1, y: -30, clipPath: "inset(0% 0% 100% 0%)" },
      { y: 0, clipPath: "inset(0% 0% 0% 0%)", duration: 0.5, ease: "power2.out" },
      0.92,
    );
    tl.to(tagNow, { autoAlpha: 1, duration: 0.25 }, 1.0);
    // 4 · short hold, then the new price lifts out and the loop restarts
    tl.to(neu, { y: -26, autoAlpha: 0, duration: 0.3, ease: "power1.in" }, 1.68);
    tl.to(tagNow, { autoAlpha: 0, duration: 0.25 }, 1.68);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,92,106,.34)" g2="rgba(255,163,92,.28)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center">
          <p className="mb-4 text-[13px] uppercase tracking-[0.22em] text-white/55">Linen overshirt · end of season</p>
          <div className="relative mb-2 h-[18px] text-[13px] uppercase tracking-[0.22em]">
            <span className="m377-was absolute inset-0 text-white/60" style={{ visibility: "hidden" }}>
              Was
            </span>
            <span className="m377-now absolute inset-0 text-[#ffa35c]">Now</span>
          </div>
          <div className="relative inline-grid text-[clamp(72px,8vw,132px)] font-[600] leading-none tracking-[-0.02em]" style={{ fontFamily: F.sg }}>
            <span className="m377-old relative [grid-area:1/1]" style={{ visibility: "hidden" }}>
              ₹4,990
              <span className="m377-line absolute left-[-4%] right-[-4%] top-[52%] h-[0.07em] origin-left rounded-full bg-[#ff5c6a]" style={{ transform: "scaleX(0)" }} aria-hidden />
            </span>
            <span className="m377-new relative text-[#ffa35c] [grid-area:1/1]">₹3,490</span>
          </div>
          <p className="mt-8 text-[13px] uppercase tracking-[0.22em] text-white/60">You save ₹1,500 · 30% off · ends Sunday</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M378 · Stroke-drawn letters (play, SVG + DrawSVG) ───────────────────────── */
// Monoline N O R T H on a 100-unit grid; every stroke is its own path so the word assembles in random order.
const M378_STROKES: { d: string; x: number }[] = [
  { d: "M0 100V0L70 100V0", x: 0 },
  { d: "M40 0A40 50 0 1 0 40 100A40 50 0 1 0 40 0", x: 100 },
  { d: "M0 100V0H38A25 25 0 0 1 38 50H0", x: 212 },
  { d: "M36 50L70 100", x: 212 },
  { d: "M0 0H70", x: 312 },
  { d: "M35 0V100", x: 312 },
  { d: "M0 0V100", x: 412 },
  { d: "M70 0V100", x: 412 },
  { d: "M0 50H70", x: 412 },
];
function M378() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const paths = gsap.utils.toArray<SVGPathElement>(".m378-draw path", el);
    const rand = rng(378);
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(paths, { drawSVG: "0%" }, 0);
    let end = 0;
    // random start + random duration per stroke: the word assembles organically
    paths.forEach((p) => {
      const at = 0.05 + rand() * 0.55;
      const d = 0.45 + rand() * 0.6;
      end = Math.max(end, at + d);
      tl.to(p, { drawSVG: "100%", duration: d, ease: "power1.inOut" }, at);
    });
    const out = end + 0.22;
    paths.forEach((p) => {
      tl.to(p, { drawSVG: "100% 100%", duration: 0.3 + rand() * 0.25, ease: "power1.in" }, out + rand() * 0.25);
    });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(92,200,255,.34)" g2="rgba(255,163,92,.3)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="grid w-[min(60%,780px)] place-items-center">
          <svg viewBox="-20 -20 522 140" className="w-full overflow-visible" aria-label="North">
            <defs>
              <linearGradient id="m378-g" x1="0" x2="1">
                <stop offset="0" stopColor="#5cc8ff" />
                <stop offset="1" stopColor={ACC} />
              </linearGradient>
            </defs>
            <g fill="none" stroke="rgba(234,245,255,.08)" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round">
              {M378_STROKES.map((s, i) => (
                <path key={i} d={s.d} transform={`translate(${s.x} 0)`} />
              ))}
            </g>
            <g className="m378-draw" fill="none" stroke="url(#m378-g)" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round">
              {M378_STROKES.map((s, i) => (
                <path key={i} d={s.d} transform={`translate(${s.x} 0)`} />
              ))}
            </g>
          </svg>
          <p className="mt-10 text-[13px] uppercase tracking-[0.22em] text-white/60">North Trail Co. · alpine shell · ₹14,800</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M379 · SVG clip-path text over image (scrub, SVG) ───────────────────────── */
const M379_WORDS = [
  { t: "SEA", y: 205, dir: 1 },
  { t: "SALT", y: 400, dir: -1 },
  { t: "RITUAL", y: 595, dir: 1 },
];
const M379_IMG = scene(1, 1800, 1000);
function M379() {
  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  useScrub(
    root,
    (p) => {
      const el = root.current;
      if (!el) return;
      // alternating words slide in opposite directions; the image inside drifts at its own (slower, diagonal) speed
      M379_WORDS.forEach((w, i) => {
        const tx = (w.dir * (p - 0.5) * 300).toFixed(1);
        el.querySelectorAll(`.m379-w${i}`).forEach((n) => n.setAttribute("transform", `translate(${tx} 0)`));
      });
      const img = el.querySelector(".m379-img");
      img?.setAttribute("transform", `translate(${(-150 - (p - 0.5) * 280).toFixed(1)} ${(-180 + (p - 0.5) * 110).toFixed(1)})`);
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    },
    { finalValue: 0.5 },
  );
  const words = (cls: string, fill?: string) =>
    M379_WORDS.map((w, i) => (
      <text key={i} className={`${cls} m379-w${i}`} x={600} y={w.y} textAnchor="middle" fontSize={176} fontWeight={800} fontFamily={F.sy} fill={fill} letterSpacing={2}>
        {w.t}
      </text>
    ));
  return (
    <Stage r={root} g1="rgba(255,120,150,.34)" g2="rgba(255,190,110,.26)">
      <div className="absolute inset-0 grid place-items-center px-[4%]">
        <svg viewBox="0 0 1200 640" className="h-[88%] w-auto max-w-full" aria-label="Sea salt ritual">
          <defs>
            <clipPath id="m379-clip">{words("m379-c")}</clipPath>
            <linearGradient id="m379-tint" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ff8aa0" stopOpacity=".55" />
              <stop offset="1" stopColor={ACC} stopOpacity=".35" />
            </linearGradient>
          </defs>
          {/* light base layer so the dark parts of the photo still read as letters */}
          <g>{words("m379-b", "rgba(234,245,255,.2)")}</g>
          <g clipPath="url(#m379-clip)">
            <image className="m379-img" href={M379_IMG} width={1800} height={1000} preserveAspectRatio="xMidYMid slice" transform="translate(-150 -180)" />
            <rect width={1200} height={640} fill="url(#m379-tint)" style={{ mixBlendMode: "screen" }} />
          </g>
        </svg>
      </div>
      <Caption>Mineral bath soak · 400 g · ₹1,150</Caption>
      <Bar r={bar} />
    </Stage>
  );
}

/* ───────────────────────── M380 · SVG text marquee with edge fade (play, SVG) ───────────────────────── */
const M380_TEXT = "Say it once out loud and watch every word land right where you meant it ·";
const M380_WORDS = [...M380_TEXT.split(" "), ...M380_TEXT.split(" ")];
const M380_FS = 62;
const M380_VW = 1200;
const M380_GAP = M380_FS * 0.3;
// first-paint estimate (replaced by measured widths once fonts load)
const M380_EST = (() => {
  let x = 0;
  const c = M380_WORDS.map((w) => {
    const ww = w.length * M380_FS * 0.52;
    const mid = x + ww / 2;
    x += ww + M380_GAP;
    return mid;
  });
  return { c, L: Math.max(1, x) };
})();
function m380Place(base: number, off: number, L: number) {
  const cx = (((base + off) % L) + L) % L - 200;
  const d = Math.min(1.2, Math.abs(cx - M380_VW / 2) / (M380_VW / 2));
  const s = 1 - 0.45 * Math.min(1, d) ** 2;
  const y = 165 + 22 * d * d;
  return { t: `translate(${cx.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(3)})`, d };
}
function M380() {
  const root = useRef<HTMLDivElement>(null);
  const on = useOnScreen(root);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const words = [...el.querySelectorAll<SVGTextElement>(".m380-w")];
    let base = M380_EST.c;
    let L = M380_EST.L;
    let off = 0;
    let dead = false;
    const layout = () =>
      words.forEach((w, i) => {
        const { t, d } = m380Place(base[i], off, L);
        w.setAttribute("transform", t);
        w.setAttribute("fill", d < 0.14 ? ACC : "#eaf5ff");
      });
    const tick = (_t: number, dt: number) => {
      if (!on.current) return;
      off -= (Math.min(50, dt) / 1000) * 95;
      layout();
    };
    document.fonts.ready.then(() => {
      if (dead) return;
      let x = 0;
      base = words.map((w) => {
        const ww = w.getComputedTextLength();
        const c = x + ww / 2;
        x += ww + M380_GAP;
        return c;
      });
      L = Math.max(1, x);
      layout();
      if (!prefersReducedMotion()) gsap.ticker.add(tick);
    });
    return () => {
      dead = true;
      gsap.ticker.remove(tick);
    };
  }, [on]);
  return (
    <Stage r={root} g1="rgba(150,130,255,.36)" g2="rgba(255,163,92,.24)">
      <div className="absolute inset-0 grid place-items-center">
        <div className="w-full">
          <p className="mb-2 text-center text-[13px] uppercase tracking-[0.22em] text-white/55">Murmur · voice notes that write themselves</p>
          <svg viewBox={`0 0 ${M380_VW} 300`} className="w-full" aria-label={M380_TEXT}>
            <defs>
              <linearGradient id="m380-g" x1="0" x2="1">
                <stop offset="0" stopColor="#000" />
                <stop offset=".22" stopColor="#fff" />
                <stop offset=".78" stopColor="#fff" />
                <stop offset="1" stopColor="#000" />
              </linearGradient>
              <mask id="m380-m" maskUnits="userSpaceOnUse" x={0} y={0} width={M380_VW} height={300}>
                <rect width={M380_VW} height={300} fill="url(#m380-g)" />
              </mask>
            </defs>
            <g mask="url(#m380-m)">
              {M380_WORDS.map((w, i) => {
                const { t } = m380Place(M380_EST.c[i], 0, M380_EST.L);
                return (
                  <text key={i} className="m380-w" transform={t} textAnchor="middle" fontSize={M380_FS} fontFamily={F.fr} fontWeight={400} fill="#eaf5ff">
                    {w}
                  </text>
                );
              })}
            </g>
          </svg>
          <p className="mt-2 text-center text-[13px] uppercase tracking-[0.22em] text-white/60">Pro plan · ₹399 a month</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────── shared by M381 / M382: a phrase runs forever along an SVG path (startOffset loop) ───────────── */
const PL_COPIES = 8;
function usePathLoop(ref: RefObject<HTMLElement | null>, speed: number) {
  const on = useOnScreen(ref);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const meas = el.querySelector<SVGTextElement>(".pl-meas");
    const tps = [...el.querySelectorAll<SVGTextPathElement>(".pl-tp")];
    if (!meas || !tps.length) return;
    let W = 1;
    let o = 0;
    let dead = false;
    // copy k sits one phrase-width after copy k-1, so the band is seamless; o wraps every phrase width (linear)
    const place = () => tps.forEach((tp, k) => tp.setAttribute("startOffset", (o + (k - 1) * W).toFixed(1)));
    const tick = (_t: number, dt: number) => {
      if (!on.current) return;
      o = (o + (speed * Math.min(50, dt)) / 1000) % W;
      place();
    };
    document.fonts.ready.then(() => {
      if (dead) return;
      W = Math.max(1, meas.getComputedTextLength());
      place();
      if (!prefersReducedMotion()) gsap.ticker.add(tick);
    });
    return () => {
      dead = true;
      gsap.ticker.remove(tick);
    };
  }, [ref, on, speed]);
}

function PathText({ id, phrase, fs, est, ...rest }: { id: string; phrase: string; fs: number; est: number } & SVGProps<SVGTextElement>) {
  return (
    <>
      <text className="pl-meas" fontSize={fs} visibility="hidden" {...rest}>
        {phrase}
      </text>
      {Array.from({ length: PL_COPIES }, (_, k) => (
        <text key={k} fontSize={fs} {...rest}>
          <textPath className="pl-tp" href={`#${id}`} startOffset={(k - 1) * est}>
            {phrase}
          </textPath>
        </text>
      ))}
    </>
  );
}

/* ───────────────────────── M381 · Text loop on infinity path (play, SVG textPath) ───────────────────────── */
// Bernoulli lemniscate, centre (600,300), starting at the right lobe tip so the seam never sits on the crossing.
const M381_D = (() => {
  const a = 470;
  const pts: string[] = [];
  for (let k = 0; k <= 160; k++) {
    const t = (k / 160) * Math.PI * 2;
    const den = 1 + Math.sin(t) ** 2;
    pts.push(`${(600 + (a * Math.cos(t)) / den).toFixed(1)} ${(300 + (a * Math.sin(t) * Math.cos(t)) / den).toFixed(1)}`);
  }
  return `M${pts.join("L")}Z`;
})();
const M381_PHRASE = "Infinite refills · ₹240 a month · never run dry · ";
function M381() {
  const root = useRef<HTMLDivElement>(null);
  usePathLoop(root, 120);
  return (
    <Stage r={root} g1="rgba(92,200,255,.34)" g2="rgba(255,163,92,.28)">
      <div className="absolute inset-0 grid place-items-center px-[5%]">
        <svg viewBox="0 30 1200 540" className="h-[86%] w-auto max-w-full overflow-visible" aria-label={M381_PHRASE}>
          <path id="m381-path" d={M381_D} fill="none" stroke="rgba(234,245,255,.1)" strokeWidth={46} strokeLinejoin="round" />
          <circle cx={600} cy={300} r={5} fill={ACC} />
          <PathText id="m381-path" phrase={M381_PHRASE} fs={30} est={700} fontFamily={F.sg} fontWeight={600} fill="#eaf5ff" letterSpacing={1.5} dy="0.35em" />
        </svg>
      </div>
      <Caption>Loop Ink · refillable pen club</Caption>
    </Stage>
  );
}

/* ───────────────────────── M382 · Text loop on ribbon band (play, SVG textPath) ───────────────────────── */
const M382_D = "M-80 340 C 140 150, 360 140, 560 300 S 960 470, 1280 240";
const M382_PHRASE = "Grand opening · 12 October · free tasting flight · ";
function M382() {
  const root = useRef<HTMLDivElement>(null);
  usePathLoop(root, 110);
  return (
    <Stage r={root} g1="rgba(255,163,92,.4)" g2="rgba(130,110,255,.24)">
      <div className="absolute inset-0 grid place-items-center">
        <svg viewBox="0 0 1200 600" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-label={M382_PHRASE}>
          <path id="m382-path" d={M382_D} fill="none" />
          {/* the tape stays: a shaded underside, the band and two stitched edges */}
          <path d={M382_D} transform="translate(0 12)" fill="none" stroke="#6b3214" strokeWidth={78} strokeLinecap="butt" />
          <path d={M382_D} fill="none" stroke={ACC} strokeWidth={78} strokeLinecap="butt" />
          <path d={M382_D} transform="translate(0 -30)" fill="none" stroke="rgba(255,255,255,.45)" strokeWidth={2} strokeDasharray="10 8" />
          <path d={M382_D} transform="translate(0 30)" fill="none" stroke="rgba(60,25,8,.45)" strokeWidth={2} strokeDasharray="10 8" />
          <PathText id="m382-path" phrase={M382_PHRASE} fs={30} est={740} fontFamily={F.sy} fontWeight={700} fill="#1c0d04" letterSpacing={2} dy="0.36em" />
        </svg>
      </div>
      <Caption>Copper Still taproom · Indiranagar</Caption>
    </Stage>
  );
}

/* ───────────────────────── M383 · Text morph, shared letters glide (play, Flip) ───────────────────────── */
let Flip: typeof FlipT | null = null;
const needFlip = () =>
  loadPlugin("Flip").then((f) => {
    Flip = f;
  });
const M383_LABELS = ["Add to bag", "Added", "Add more"];
function m383Morph(box: HTMLElement, btn: HTMLElement, text: string) {
  const old = [...box.querySelectorAll<HTMLElement>(".m383-ch:not(.out)")];
  box.querySelectorAll(".m383-ch.out").forEach((n) => n.remove());
  const pool = new Map<string, HTMLElement[]>();
  old.forEach((s) => {
    const k = s.dataset.k!;
    if (!pool.has(k)) pool.set(k, []);
    pool.get(k)!.push(s);
  });
  gsap.killTweensOf(old);
  gsap.set(old, { x: 0, y: 0, scale: 1, opacity: 1 });
  const state = Flip ? Flip.getState(old) : null;
  const bb = box.getBoundingClientRect();
  const rects = new Map(old.map((s) => [s, s.getBoundingClientRect()]));
  const w0 = btn.offsetWidth;
  // letters are matched by character + occurrence ("d" #2 stays "d" #2), so shared letters glide instead of re-entering
  const counts = new Map<string, number>();
  const next: HTMLElement[] = [];
  const fresh: HTMLElement[] = [];
  for (const raw of text) {
    const c = raw === " " ? " " : raw;
    const n = counts.get(c) ?? 0;
    counts.set(c, n + 1);
    const k = `${c}${n}`;
    let s = pool.get(k)?.shift();
    if (!s) {
      s = document.createElement("span");
      s.className = "m383-ch";
      s.dataset.k = k;
      s.textContent = c;
      fresh.push(s);
    }
    next.push(s);
  }
  const leaving = old.filter((s) => !next.includes(s));
  box.replaceChildren(...next);
  const kept = next.filter((s) => !fresh.includes(s));
  if (Flip && state) Flip.from(state, { targets: kept, duration: 0.38, ease: "back.out(1.6)" });
  gsap.fromTo(fresh, { opacity: 0, scale: 0.4, yPercent: 40 }, { opacity: 1, scale: 1, yPercent: 0, duration: 0.34, ease: "back.out(1.8)", stagger: 0.025, delay: 0.06 });
  const nb = box.getBoundingClientRect();
  leaving.forEach((s) => {
    const r = rects.get(s)!;
    s.classList.add("out");
    s.style.position = "absolute";
    s.style.left = `${r.left - bb.left + (bb.left - nb.left)}px`;
    s.style.top = `${r.top - bb.top}px`;
    box.appendChild(s);
  });
  gsap.to(leaving, { opacity: 0, scale: 0.4, yPercent: -50, duration: 0.24, ease: "power1.in", onComplete: () => leaving.forEach((s) => s.remove()) });
  const w1 = btn.offsetWidth;
  gsap.fromTo(btn, { width: w0 }, { width: w1, duration: 0.38, ease: "back.out(1.4)", clearProps: "width" });
}
function M383() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(
    root,
    (el, onClean) => {
      const box = el.querySelector<HTMLElement>(".m383-label")!;
      const btn = el.querySelector<HTMLElement>(".m383-btn")!;
      const ptr = el.querySelector<HTMLElement>(".m383-ptr")!;
      box.textContent = "";
      const seen = new Map<string, number>();
      for (const raw of M383_LABELS[0]) {
        const c = raw === " " ? "\u00a0" : raw;
        const k = seen.get(c) ?? 0;
        seen.set(c, k + 1);
        const s = document.createElement("span");
        s.className = "m383-ch";
        s.dataset.k = `${c}${k}`;
        s.textContent = c;
        box.appendChild(s);
      }
      let idx = 0;
      const next = () => {
        idx = (idx + 1) % M383_LABELS.length;
        m383Morph(box, btn, M383_LABELS[idx]);
        btn.classList.toggle("is-done", idx === 1);
      };
      btn.addEventListener("click", next);
      onClean(() => {
        btn.removeEventListener("click", next);
        gsap.killTweensOf([...box.children, btn]);
        box.textContent = M383_LABELS[0];
        btn.classList.remove("is-done");
        btn.style.width = "";
      });
      // fake pointer: drifts in, presses the button, drifts off · one press every 1.3 s
      const r = el.getBoundingClientRect();
      const b = btn.getBoundingClientRect();
      const cx = b.left - r.left + b.width * 0.62;
      const cy = b.top - r.top + b.height * 0.55;
      const tl = gsap.timeline({ repeat: -1 });
      tl.set(ptr, { opacity: 1 }, 0);
      tl.fromTo(ptr, { x: cx + 190, y: cy + 110 }, { x: cx, y: cy, duration: 0.55, ease: "sine.inOut" }, 0);
      tl.to(ptr, { scale: 0.7, duration: 0.08, ease: "power1.out" }, 0.55).to(ptr, { scale: 1, duration: 0.14, ease: "power1.out" }, 0.63);
      tl.to(btn, { scale: 0.95, duration: 0.08, ease: "power1.out" }, 0.55).to(btn, { scale: 1, duration: 0.18, ease: "back.out(2)" }, 0.63);
      tl.call(next, [], 0.6);
      tl.to(ptr, { x: cx + 190, y: cy + 110, duration: 0.67, ease: "sine.inOut" }, 0.63);
      return tl;
    },
    needFlip,
  );
  return (
    <Stage r={root} g1="rgba(255,163,92,.5)" g2="rgba(92,200,255,.24)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center">
          <p className="mb-3 text-[13px] uppercase tracking-[0.22em] text-white/55">Merino crew knit · oat</p>
          <p className="mb-10 text-[clamp(28px,2.6vw,40px)] font-[500]" style={{ fontFamily: F.fr }}>
            ₹4,200
          </p>
          <button
            type="button"
            className="m383-btn inline-flex items-center justify-center overflow-hidden rounded-full bg-[#ffa35c] px-[0.9em] py-[0.42em] text-[clamp(44px,4.6vw,76px)] font-[600] leading-none text-[#1a0e05]"
            style={{ fontFamily: F.sg }}
          >
            <span className="m383-label relative inline-block whitespace-pre">{M383_LABELS[0]}</span>
          </button>
          <p className="mt-10 text-[13px] uppercase tracking-[0.22em] text-white/60">Free returns · ships in 2 days</p>
        </div>
      </div>
      <span className="m383-ptr pointer-events-none absolute left-0 top-0 -ml-[9px] -mt-[9px] h-[18px] w-[18px] rounded-full border-2 border-white bg-white/30 opacity-0" aria-hidden />
    </Stage>
  );
}

/* ───────────────────────── M384 · Text path with scroll filter (scrub, SVG) ───────────────────────── */
const M384_LINES = [
  { t: "Wander the long way round · ", d: "M-20 150 C 260 30, 520 30, 720 140 S 1180 250, 1420 110", dir: 1 },
  { t: "Pack light, stay a little longer · ", d: "M-20 110 C 300 220, 560 230, 760 120 S 1160 20, 1420 140", dir: -1 },
  { t: "Come home with better stories · ", d: "M-20 140 C 240 40, 560 230, 820 130 S 1200 60, 1420 150", dir: 1 },
];
function M384() {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  useScrub(
    root,
    (p) => {
      const s = stage.current;
      const l = list.current;
      if (!s || !l) return;
      const H = s.clientHeight;
      const Lh = l.offsetHeight;
      // the column travels linearly from just below centre to just above it
      const y = gsap.utils.interpolate(H * 0.56, H * 0.44 - Lh, p);
      l.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
      l.querySelectorAll<HTMLElement>(".m384-line").forEach((line, i) => {
        const c = y + line.offsetTop + line.offsetHeight / 2;
        const d = Math.min(1, Math.abs(c - H / 2) / (H / 2));
        // crisp only mid-stage: blur + turbulence grow with the distance from the centre
        line.querySelector(".m384-blur")?.setAttribute("stdDeviation", (8 * d ** 1.3).toFixed(2));
        line.querySelector(".m384-disp")?.setAttribute("scale", (42 * d).toFixed(1));
        line.style.opacity = (1 - 0.45 * d).toFixed(3);
        const off = M384_LINES[i].dir > 0 ? -700 + p * 700 : -p * 700;
        line.querySelector(".m384-tp")?.setAttribute("startOffset", off.toFixed(1));
      });
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    },
    { finalValue: 0.5 },
  );
  return (
    <Stage r={root} g1="rgba(92,200,255,.32)" g2="rgba(255,163,92,.28)">
      <div ref={stage} className="absolute inset-0 overflow-hidden">
        <div ref={list} className="absolute inset-x-[3%] top-0 will-change-transform">
          {M384_LINES.map((ln, i) => (
            <div key={i} className="m384-line">
              <svg viewBox="0 0 1400 240" className="block w-full overflow-visible" aria-label={ln.t}>
                <defs>
                  <filter id={`m384-f${i}`} x="-5%" y="-10%" width="110%" height="120%">
                    <feTurbulence type="turbulence" baseFrequency="0.012 0.04" numOctaves={1} seed={i + 2} result="n" />
                    <feDisplacementMap className="m384-disp" in="SourceGraphic" in2="n" scale={0} xChannelSelector="R" yChannelSelector="G" result="dm" />
                    <feGaussianBlur className="m384-blur" in="dm" stdDeviation={0} />
                  </filter>
                  <path id={`m384-p${i}`} d={ln.d} />
                </defs>
                <text fontSize={72} fontFamily={F.is} fontStyle="italic" fill={i === 1 ? ACC : "#eaf5ff"} filter={`url(#m384-f${i})`}>
                  <textPath className="m384-tp" href={`#m384-p${i}`} startOffset={-350}>
                    {ln.t.repeat(4)}
                  </textPath>
                </text>
              </svg>
            </div>
          ))}
        </div>
      </div>
      <Caption>Slow Atlas travel journals · ₹1,450</Caption>
      <Bar r={bar} />
    </Stage>
  );
}

/* ───────────────────────── M385 · Text planes in depth (scrub, CSS 3D) ───────────────────────── */
const M385_LINES = ["Built in", "layers,", "worn in", "weather."];
const m385Plane = (p: number) => `rotateX(${(58 - 12 * p).toFixed(2)}deg) rotateZ(${(-18 + 8 * p).toFixed(2)}deg)`;
const m385Line = (i: number, p: number) => {
  const k = i - (M385_LINES.length - 1) / 2;
  return `translate3d(${(k * 18 * p).toFixed(1)}px,0,${(40 + (M385_LINES.length - 1 - i) * 150 * p).toFixed(1)}px)`;
};
function M385() {
  const root = useRef<HTMLDivElement>(null);
  const plane = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  useScrub(root, (p) => {
    const pl = plane.current;
    if (!pl) return;
    // linear over the whole panel: the plane lifts a little and the lines separate along Z into layered depth
    pl.style.transform = m385Plane(p);
    pl.querySelectorAll<HTMLElement>(".m385-l").forEach((l, i) => (l.style.transform = m385Line(i, p)));
    if (bar.current) bar.current.style.transform = `scaleX(${p})`;
  });
  return (
    <Stage r={root} g1="rgba(130,110,255,.36)" g2="rgba(255,163,92,.3)">
      <div className="absolute inset-0 grid place-items-center" style={{ perspective: "1400px" }}>
        <div
          ref={plane}
          className="relative w-[min(58%,760px)] rounded-[22px] border border-white/10 p-6"
          style={{
            transformStyle: "preserve-3d",
            transform: m385Plane(1),
            backgroundImage: "linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        >
          {M385_LINES.map((t, i) => (
            <div
              key={i}
              className="m385-l mb-3 rounded-[16px] border border-white/15 bg-[#0f1628]/70 px-7 py-2 text-[clamp(48px,5.4vw,88px)] font-[800] uppercase leading-[1.02] last:mb-0"
              style={{ fontFamily: F.sy, transform: m385Line(i, 1), color: i === 3 ? ACC : `rgba(234,245,255,${(1 - i * 0.12).toFixed(2)})`, boxShadow: "0 30px 60px rgba(0,0,0,.35)" }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
      <Caption>Stratum shell jacket · 3-layer · ₹12,900</Caption>
      <Bar r={bar} />
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M374", name: "Squashed blurry chars", how: "Letters start squashed (scaleY .1, scaleX 1.8) and blurred, then stretch back to shape and sharpen one after another · scrubbed", kind: "scrub", C: M374 },
  { code: "M375", name: "Squiggly / boiling text", how: "An SVG turbulence + displacement filter swaps its seed ten times a second, so the heading's edges boil like hand-drawn animation · loops", kind: "play", C: M375 },
  { code: "M376", name: "Staggered letter up/drop", how: "Odd letters drop from above, even letters rise from below and meet on the baseline, then leave the way they came · loops", kind: "play", C: M376 },
  { code: "M377", name: "Strikethrough replace", how: "A line strikes through the old price, the old price drops away and the new one wipes in in its place · loops", kind: "play", C: M377 },
  { code: "M378", name: "Stroke-drawn letters", how: "Every stroke of the word draws itself on in random order with random speeds, so the word assembles organically, then erases · loops", kind: "play", C: M378 },
  { code: "M379", name: "SVG clip-path text over image", how: "Big words are an SVG clip-path over one photo; alternating words slide in opposite directions while the photo drifts at its own speed · scrubbed", kind: "scrub", C: M379 },
  { code: "M380", name: "SVG text marquee with edge fade", how: "A sentence runs as an SVG-text marquee; words shrink, sink and fade through gradient masks at both edges · continuous", kind: "play", C: M380 },
  { code: "M381", name: "Text loop on infinity path", how: "A repeating phrase runs forever along a figure-8 path (textPath startOffset, linear), crossing over itself in the middle · continuous", kind: "play", C: M381 },
  { code: "M382", name: "Text loop on ribbon band", how: "A phrase travels along a wave path printed on a thick coloured tape; the tape stays still while the text runs · continuous", kind: "play", C: M382 },
  { code: "M383", name: "Text morph (shared letters glide)", how: "The button label changes (Add to bag → Added → Add more): shared letters glide to new spots (Flip), others pop in/out · auto click", kind: "play", C: M383 },
  { code: "M384", name: "Text path with scroll filter", how: "Lines of text slide along curved paths with scroll while a blur + turbulence filter grows with their distance from the centre · scrubbed", kind: "scrub", C: M384 },
  { code: "M385", name: "Text planes in depth", how: "Heading lines sit on a tilted 3D plane and separate along Z into layered depth as you scroll · scrubbed", kind: "scrub", C: M385 },
];
