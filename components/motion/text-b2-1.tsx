"use client";

// Text motions, batch 2 · group 1 (MOTION-MENU M135–M145). Small focused demos for /lab/motion, rebuilt in GSAP from the idea only.
// Every demo: plays by itself on screen (or follows the scroll), loops, has a CSS glow loop that never stops,
// and shows a sensible final state in ?static=1 / reduced motion.
import { Fragment, useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { TextPlugin } from "gsap/TextPlugin";
import { gsap, SplitText, prefersReducedMotion } from "@/lib/gsap";
import { scene, useScrub } from "@/components/fx/shared";
import type { MotionDef } from "./types";

// TextPlugin is tiny and not in lib/gsap's list: registered here for M138 only.
if (typeof window !== "undefined") gsap.registerPlugin(TextPlugin);

const F = { sg: "Space Grotesk Variable", fr: "Fraunces Variable", is: "Instrument Serif", sy: "Syne Variable", mr: "Manrope Variable" };
const ACC = "#4f8dff";
const INK = "#eaf5ff";

const CSS = `
.b2g1-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 32% 38%,var(--g1,rgba(79,141,255,.42)),transparent 70%),radial-gradient(34% 40% at 70% 66%,var(--g2,rgba(255,122,89,.2)),transparent 70%);animation:b2g1-drift 6s linear infinite alternate;will-change:transform}
@keyframes b2g1-drift{0%{transform:translate3d(-7%,-5%,0) scale(1)}100%{transform:translate3d(7%,6%,0) scale(1.15)}}
.m137-ring{transform-box:fill-box;transform-origin:50% 50%;animation:m137-spin 14s linear infinite}
@keyframes m137-spin{to{transform:rotate(360deg)}}
.m141-c{position:absolute;width:18px;height:18px;border-color:${ACC};border-style:solid;border-width:0}
html.is-static .b2g1-glow,html.is-static .m137-ring{animation:none}
html.is-static {.b2g1-glow,.m137-ring{animation:none}}
`;

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0f1c] text-[#eaf5ff] ${className}`}>
      <style href="b2g1-css" precedence="default">
        {CSS}
      </style>
      <div className="b2g1-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/**
 * "play" helper: waits for fonts, builds the looping animation inside a gsap.context, plays it only while the demo is
 * on screen, and reverts everything on unmount. Nothing runs with prefersReducedMotion() (markup = final state).
 */
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
    document.fonts.ready.then(() => {
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

/** Highlights the active direction label (k) and dims the others. */
const lit = (labs: (HTMLElement | null)[], k: number) => labs.forEach((l, j) => l && (l.style.opacity = j === k ? "1" : "0.35"));

/* ───────────────────────── M135 · Stroke draw then flood fill (play, SVG) ───────────────────────── */
const M135_WORD = "Saffron";
const DASH = 1400;
function M135() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const text = el.querySelector<SVGTextElement>(".m135-text")!;
    const spans = gsap.utils.toArray<SVGTSpanElement>(".m135-l", el);
    const grads = gsap.utils.toArray<SVGLinearGradientElement>(".m135-g", el).map((g) => g.querySelectorAll("stop"));
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(text, { opacity: 1 });
    tl.set(spans, { attr: { "stroke-dashoffset": DASH } });
    grads.forEach((s) => tl.set(s, { attr: { offset: 0 } }));
    // 1 · outline draws on letter by letter (~1.4 s overall)
    tl.to(spans, { attr: { "stroke-dashoffset": 0 }, duration: 0.95, ease: "power2.inOut", stagger: 0.08 });
    // 2 · after a short delay the fill wipes up inside each letter
    grads.forEach((s, i) => tl.to(s, { attr: { offset: 1 }, duration: 0.55, ease: "power2.inOut" }, 1.25 + i * 0.08));
    tl.to(text, { opacity: 0, duration: 0.35, ease: "power1.in" }, "+=0.3");
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(224,145,63,.4)" g2="rgba(255,77,109,.18)">
      <div className="absolute inset-0 grid place-items-center px-[5%]">
        <svg viewBox="0 0 1200 320" className="w-[min(88%,1100px)] overflow-visible" role="img" aria-label={M135_WORD}>
          <defs>
            {M135_WORD.split("").map((_, i) => (
              <linearGradient key={i} id={`m135-g${i}`} className="m135-g" gradientUnits="userSpaceOnUse" x1="0" y1="262" x2="0" y2="40">
                <stop offset="1" stopColor="#ffd59a" />
                <stop offset="1" stopColor="#ffd59a" stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>
          <text
            className="m135-text"
            x="600"
            y="236"
            textAnchor="middle"
            fontSize="224"
            fontWeight="800"
            style={{ fontFamily: F.fr, letterSpacing: "-0.01em" }}
            stroke="#fff1e6"
            strokeWidth="2.4"
            strokeLinejoin="round"
          >
            {M135_WORD.split("").map((c, i) => (
              <tspan key={i} className="m135-l" fill={`url(#m135-g${i})`} strokeDasharray={`${DASH} ${DASH}`} strokeDashoffset="0">
                {c}
              </tspan>
            ))}
          </text>
        </svg>
      </div>
      <p className="absolute bottom-5 left-6 text-[13px] uppercase tracking-[0.18em] text-white/60">Kesar spice co. · 2 g tin · ₹540</p>
    </Stage>
  );
}

/* ───────────────────────── M136 · Text block swap: words rise from tilt (play, SplitText) ───────────────────────── */
function M136() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const blocks = gsap.utils.toArray<HTMLElement>(".m136-b", el);
    const splits = blocks.map((b) => SplitText.create(b, { type: "words" }));
    onClean(() => splits.forEach((s) => s.revert()));
    const words = splits.map((s) => s.words as HTMLElement[]);
    // left-half words tilt one way from their left edge, right-half words the other way from their right edge
    const tilt = (ws: HTMLElement[], blk: HTMLElement) => {
      const r = blk.getBoundingClientRect();
      const mid = r.left + r.width / 2;
      ws.forEach((w) => {
        const b = w.getBoundingClientRect();
        const left = b.left + b.width / 2 < mid;
        w.dataset.side = left ? "l" : "r";
      });
    };
    const swap = (tl: gsap.core.Timeline, from: number, to: number, at: number) => {
      tl.to(words[from], { yPercent: -30, opacity: 0, duration: 0.35, ease: "power2.in", stagger: 0.015 }, at);
      tl.set(blocks[from], { visibility: "hidden" }, at + 0.4);
      tl.call(() => tilt(words[to], blocks[to]), [], at + 0.3);
      tl.set(blocks[to], { visibility: "visible" }, at + 0.3);
      tl.fromTo(
        words[to],
        {
          yPercent: 30,
          opacity: 0,
          rotation: (_: number, w: HTMLElement) => (w.dataset.side === "l" ? -9 : 9),
          transformOrigin: (_: number, w: HTMLElement) => (w.dataset.side === "l" ? "0% 100%" : "100% 100%"),
        },
        { yPercent: 0, opacity: 1, rotation: 0, duration: 0.75, ease: "power3.out", stagger: 0.05, immediateRender: false },
        at + 0.32,
      );
    };
    const tl = gsap.timeline({ repeat: -1 });
    swap(tl, 0, 1, 0.3);
    swap(tl, 1, 0, 1.9);
    tl.to({}, { duration: 0.01 }, 3.3);
    return tl;
  });
  const cls = "m136-b max-w-[18ch] text-center text-[clamp(40px,5.4vw,84px)] font-[400] leading-[1.05] tracking-[-0.015em] [grid-area:1/1]";
  return (
    <Stage r={root} g1="rgba(79,141,255,.36)" g2="rgba(224,145,63,.22)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="grid place-items-center">
          <h3 className={cls} style={{ fontFamily: F.fr }}>
            Slow mornings start with a better cup.
          </h3>
          <h3 className={cls} style={{ fontFamily: F.fr, visibility: "hidden" }} aria-hidden>
            Single-origin beans, roasted every Tuesday.
          </h3>
        </div>
      </div>
      <p className="absolute bottom-5 left-6 text-[13px] uppercase tracking-[0.18em] text-white/60">Hillside roastery · 250 g · ₹640</p>
    </Stage>
  );
}

/* ───────────────────────── M137 · Text loop on arch (play, SVG textPath) ───────────────────────── */
const M137_PHRASE = "Hand-poured · Small batch · Soy wax · ₹1,290 · ";
function M137() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const tp = el.querySelector<SVGTextPathElement>(".m137-tp")!;
    const probe = el.querySelector<SVGTextElement>(".m137-probe")!;
    const one = probe.getComputedTextLength(); // the phrase is written 3× on the arch: slide by exactly one copy, then wrap
    return gsap.fromTo(tp, { attr: { startOffset: 0 } }, { attr: { startOffset: -one }, duration: 9, ease: "none", repeat: -1 });
  });
  return (
    <Stage r={root} g1="rgba(255,179,107,.34)" g2="rgba(79,141,255,.2)">
      <div className="absolute inset-0 grid place-items-center">
        <svg viewBox="0 0 1000 600" className="h-[94%] w-auto max-w-[94%] overflow-visible" role="img" aria-label="Hand-poured candle">
          <defs>
            <path id="m137-arch" d="M 170 520 A 330 330 0 0 1 830 520" fill="none" />
            <linearGradient id="m137-fade" x1="0" x2="1">
              <stop offset="0.12" stopColor="#fff" stopOpacity="0" />
              <stop offset="0.24" stopColor="#fff" />
              <stop offset="0.76" stopColor="#fff" />
              <stop offset="0.88" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <mask id="m137-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="600">
              <rect width="1000" height="600" fill="url(#m137-fade)" />
            </mask>
            <clipPath id="m137-clip">
              <circle cx="500" cy="430" r="190" />
            </clipPath>
          </defs>
          <circle className="m137-ring" cx="500" cy="430" r="232" fill="none" stroke="rgba(255,213,154,.35)" strokeWidth="1.5" strokeDasharray="2 14" />
          <image href={scene(3, 760, 760)} x="310" y="240" width="380" height="380" clipPath="url(#m137-clip)" preserveAspectRatio="xMidYMid slice" />
          <use href="#m137-arch" stroke="rgba(255,255,255,.12)" strokeWidth="1" />
          <text className="m137-probe" x="0" y="-40" visibility="hidden" fontSize="36" fontWeight="600" letterSpacing="3" style={{ fontFamily: F.sg, textTransform: "uppercase" }} aria-hidden>
            {M137_PHRASE}
          </text>
          <g mask="url(#m137-mask)">
            <text className="m137-t" fill="#fff1e6" fontSize="36" fontWeight="600" letterSpacing="3" style={{ fontFamily: F.sg, textTransform: "uppercase" }}>
              <textPath className="m137-tp" href="#m137-arch" startOffset="0">
                {M137_PHRASE.repeat(3)}
              </textPath>
            </text>
          </g>
        </svg>
      </div>
      <p className="absolute bottom-5 left-6 text-[13px] uppercase tracking-[0.18em] text-white/60">Ember &amp; Oak · Amber no. 3</p>
    </Stage>
  );
}

/* ───────────────────────── M138 · Text overwrite (play, TextPlugin) ───────────────────────── */
const M138_LINES = [
  ["Cold brew, slow steeped.", "₹220"],
  ["Oat flat white, extra hot.", "₹260"],
  ["Cardamom latte, no sugar.", "₹280"],
];
function M138() {
  const root = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLHeadingElement>(null);
  const price = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  usePlay(root, (_el, onClean) => {
    onClean(() => {
      if (line.current) line.current.textContent = M138_LINES[0][0];
      if (price.current) price.current.textContent = M138_LINES[0][1];
    });
    const tl = gsap.timeline({ repeat: -1 });
    M138_LINES.forEach((_, k) => {
      const [txt, p] = M138_LINES[(k + 1) % M138_LINES.length];
      const at = k * 1.35 + 0.25;
      // old letters are swapped in place, left to right
      tl.to(line.current, { text: { value: txt }, duration: 0.95, ease: "none" }, at);
      tl.to(price.current, { text: { value: p }, duration: 0.4, ease: "none" }, at + 0.55);
      tl.fromTo(bar.current, { scaleX: 0 }, { scaleX: 1, duration: 0.95, ease: "none", immediateRender: false }, at);
      tl.to(bar.current, { scaleX: 0, transformOrigin: "100% 50%", duration: 0.3, ease: "power2.in" }, at + 1.0);
      tl.set(bar.current, { transformOrigin: "0% 50%" }, at + 1.32);
    });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(79,141,255,.34)" g2="rgba(255,179,107,.22)">
      <div className="absolute inset-0 flex items-center px-[8%]">
        <div className="w-[min(86%,1150px)]">
          <p className="mb-5 text-[13px] uppercase tracking-[0.24em] text-white/55">Today at the counter</p>
          <h3 ref={line} className="min-h-[1.1em] whitespace-nowrap text-[clamp(44px,5.8vw,96px)] leading-[1.05] tracking-[-0.01em]" style={{ fontFamily: F.is }}>
            {M138_LINES[0][0]}
          </h3>
          <div className="mt-6 flex items-center gap-5">
            <span ref={price} className="min-w-[4ch] text-[clamp(22px,2vw,30px)] font-[650] text-[#4f8dff]" style={{ fontFamily: F.sg }}>
              {M138_LINES[0][1]}
            </span>
            <span className="relative block h-px w-[220px] bg-white/15">
              <span ref={bar} className="absolute inset-0 origin-left bg-[#4f8dff]" style={{ transform: "scaleX(0)" }} />
            </span>
          </div>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M139 · Text roll-in: letters flip down then settle (play) ───────────────────────── */
const M139_WORD = "Weekender";
function M139() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const A = gsap.utils.toArray<HTMLElement>(".m139-a", el);
    const B = gsap.utils.toArray<HTMLElement>(".m139-b", el);
    gsap.set(A, { rotationX: 0, transformOrigin: "50% 0%" });
    gsap.set(B, { rotationX: 90, opacity: 1, transformOrigin: "50% 100%" });
    const tl = gsap.timeline({ repeat: -1 });
    // pass 1: top copy (A) rolls away 0 → 90 while the bottom copy (B) settles 90 → 0; pass 2: roles swap back
    [
      [A, B],
      [B, A],
    ].forEach(([out, inn], k) => {
      const at = k * 1.55 + 0.15;
      tl.set(out, { transformOrigin: "50% 0%" }, at);
      tl.set(inn, { transformOrigin: "50% 100%", color: ACC }, at);
      tl.fromTo(out, { rotationX: 0 }, { rotationX: 90, duration: 0.5, ease: "power2.in", stagger: 0.1, immediateRender: false }, at);
      tl.fromTo(inn, { rotationX: 90 }, { rotationX: 0, duration: 0.55, ease: "power2.out", stagger: 0.1, immediateRender: false }, at + 0.12);
      tl.to(inn, { color: INK, duration: 0.35, stagger: 0.1 }, at + 0.6);
    });
    tl.to({}, { duration: 0.01 }, 3.1);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(79,141,255,.4)" g2="rgba(24,196,143,.18)">
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <h3 className="flex whitespace-nowrap text-[clamp(44px,6.4vw,104px)] font-[800] uppercase leading-[1] tracking-[-0.02em]" style={{ fontFamily: F.sy }} aria-label={M139_WORD}>
            {M139_WORD.split("").map((c, i) => (
              <span key={i} className="relative inline-block" style={{ perspective: "520px" }} aria-hidden>
                <span className="m139-a inline-block [backface-visibility:hidden]">{c}</span>
                <span className="m139-b absolute inset-0 inline-block [backface-visibility:hidden]" style={{ opacity: 0 }}>
                  {c}
                </span>
              </span>
            ))}
          </h3>
          <p className="mt-6 text-[13px] uppercase tracking-[0.22em] text-white/60">Waxed canvas weekender · ₹6,490</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M140 · Tracking-in (play) ───────────────────────── */
const M140_DIRS = ["→← from tight (-0.5em)", "←→ from wide (1em)"];
function M140() {
  const root = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLHeadingElement>(null);
  const labs = useRef<(HTMLSpanElement | null)[]>([]);
  usePlay(root, () => {
    const h = head.current!;
    const tl = gsap.timeline({ repeat: -1 });
    ["-0.5em", "1em"].forEach((from, k) => {
      tl.call(() => lit(labs.current, k));
      tl.fromTo(
        h,
        { letterSpacing: from, opacity: 0, filter: "blur(10px)", y: k === 0 ? 0 : -14 },
        { letterSpacing: "0.06em", opacity: 1, filter: "blur(0px)", y: 0, duration: 0.95, ease: "power3.out", immediateRender: k === 0 },
      );
      tl.to(h, { opacity: 0, filter: "blur(6px)", duration: 0.3, ease: "power1.in" }, "+=0.3");
    });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(159,216,255,.34)" g2="rgba(255,77,109,.16)">
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="mb-5 text-[13px] uppercase tracking-[0.3em] text-white/50">Maison Arvel · Autumn 26</p>
          <h3 ref={head} className="whitespace-nowrap text-[clamp(52px,7.6vw,124px)] font-[300] uppercase leading-none" style={{ fontFamily: F.mr, letterSpacing: "0.06em" }}>
            Quiet luxury
          </h3>
        </div>
      </div>
      <p className="absolute bottom-5 left-6 flex gap-5 text-[13px] uppercase tracking-[0.18em]">
        {M140_DIRS.map((d, i) => (
          <span key={d} ref={(n) => void (labs.current[i] = n)}>
            {d}
          </span>
        ))}
      </p>
    </Stage>
  );
}

/* ───────────────────────── M141 · True-focus word sweep (play) ───────────────────────── */
const M141_WORDS = ["Crafted", "slowly,", "worn", "for", "years."];
function M141() {
  const root = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  usePlay(root, () => {
    const words = gsap.utils.toArray<HTMLElement>(".m141-w", box.current);
    const focus = (i: number, d = 0.5) => {
      const c = box.current!.getBoundingClientRect();
      const r = words[i].getBoundingClientRect();
      const pad = 14;
      gsap.to(frame.current, { x: r.left - c.left - pad, y: r.top - c.top - pad * 0.6, width: r.width + pad * 2, height: r.height + pad * 1.2, opacity: 1, duration: d, ease: "power3.inOut" });
      words.forEach((w, j) => gsap.to(w, { filter: j === i ? "blur(0px)" : "blur(6px)", opacity: j === i ? 1 : 0.5, duration: d, ease: "power2.inOut" }));
    };
    focus(0, 0.01);
    const tl = gsap.timeline({ repeat: -1 });
    words.forEach((_, i) => tl.call(() => focus((i + 1) % words.length), [], 0.6 + i * 1.0));
    tl.to({}, { duration: 0.01 }, words.length * 1.0 + 0.59);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(79,141,255,.4)" g2="rgba(200,255,138,.14)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div ref={box} className="relative">
          <h3 className="flex flex-wrap justify-center gap-x-[0.32em] text-[clamp(48px,6.6vw,108px)] font-[600] leading-[1.15] tracking-[-0.02em]" style={{ fontFamily: F.sg }}>
            {M141_WORDS.map((w) => (
              <span key={w} className="m141-w inline-block">
                {w}
              </span>
            ))}
          </h3>
          <div ref={frame} className="pointer-events-none absolute left-0 top-0 h-0 w-0" style={{ opacity: 0 }} aria-hidden>
            <span className="m141-c left-0 top-0 border-l-[3px] border-t-[3px]" />
            <span className="m141-c right-0 top-0 border-r-[3px] border-t-[3px]" />
            <span className="m141-c bottom-0 left-0 border-b-[3px] border-l-[3px]" />
            <span className="m141-c bottom-0 right-0 border-b-[3px] border-r-[3px]" />
          </div>
        </div>
      </div>
      <p className="absolute bottom-5 left-6 text-[13px] uppercase tracking-[0.18em] text-white/60">Fernhill leather · Belt from ₹3,200</p>
    </Stage>
  );
}

/* ───────────────────────── M142 · Variable weight on scroll (scrub) ───────────────────────── */
function M142() {
  const root = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLHeadingElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  useScrub(
    root,
    (p) => {
      const w = Math.round(100 + 800 * p); // thin → black, linear over the whole panel
      if (head.current) {
        head.current.style.fontVariationSettings = `"wght" ${w}`;
        head.current.style.fontWeight = String(w);
      }
      if (num.current) num.current.textContent = String(w);
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    },
    { finalValue: 1 },
  );
  return (
    <Stage r={root} g1="rgba(255,179,107,.34)" g2="rgba(79,141,255,.22)">
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <h3 ref={head} className="whitespace-nowrap text-[clamp(64px,10vw,164px)] leading-none tracking-[-0.02em]" style={{ fontFamily: F.fr, fontWeight: 900, fontVariationSettings: '"wght" 900' }}>
            Weightless
          </h3>
          <p className="mt-6 text-[13px] uppercase tracking-[0.22em] text-white/60">Down jacket · 280 g · ₹14,900</p>
        </div>
      </div>
      <div className="absolute bottom-5 left-6 flex items-center gap-4 text-[13px] uppercase tracking-[0.18em] text-white/70">
        <span>
          wght <span ref={num}>900</span>
        </span>
        <span className="relative block h-px w-[180px] bg-white/15">
          <span ref={bar} className="absolute inset-0 origin-left bg-[#ffb36b]" />
        </span>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M143 · Vertical cut reveal, staggered chars (play) ───────────────────────── */
const M143_TEXT = "Summer Edit";
const M143_DIRS = ["↕ from the centre out", "✳ random order"];
function M143() {
  const root = useRef<HTMLDivElement>(null);
  const labs = useRef<(HTMLSpanElement | null)[]>([]);
  usePlay(root, (el) => {
    const chars = gsap.utils.toArray<HTMLElement>(".m143-c", el);
    const tl = gsap.timeline({ repeat: -1 });
    (["center", "random"] as const).forEach((from, k) => {
      tl.call(() => lit(labs.current, k));
      tl.fromTo(chars, { yPercent: 115 }, { yPercent: 0, duration: 0.7, ease: "back.out(2.2)", stagger: { each: 0.05, from }, immediateRender: k === 0 });
      tl.to(chars, { yPercent: -115, duration: 0.35, ease: "power2.in", stagger: { each: 0.02, from: "edges" } }, "+=0.3");
    });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,77,109,.3)" g2="rgba(255,213,154,.24)">
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <h3 className="flex whitespace-nowrap text-[clamp(40px,5.4vw,88px)] font-[800] uppercase leading-[1] tracking-[-0.03em]" style={{ fontFamily: F.sy }} aria-label={M143_TEXT}>
            {M143_TEXT.split("").map((c, i) =>
              c === " " ? (
                <span key={i} className="inline-block w-[0.28em]" aria-hidden />
              ) : (
                <span key={i} className="inline-block overflow-hidden pb-[0.04em] pt-[0.14em]" aria-hidden>
                  <span className="m143-c inline-block">{c}</span>
                </span>
              ),
            )}
          </h3>
          <p className="mt-4 text-[13px] uppercase tracking-[0.22em] text-white/60">Linen sets from ₹4,200</p>
        </div>
      </div>
      <p className="absolute bottom-5 left-6 flex gap-5 text-[13px] uppercase tracking-[0.18em]">
        {M143_DIRS.map((d, i) => (
          <span key={d} ref={(n) => void (labs.current[i] = n)}>
            {d}
          </span>
        ))}
      </p>
    </Stage>
  );
}

/* ───────────────────────── M144 · Word loop slide-up (play): up / down / sideways ───────────────────────── */
const M144_WORDS = ["mornings", "weekends", "long drives", "late nights"];
const M144_ROWS = [
  { label: "↑ up", axis: "yPercent", s: -1 },
  { label: "↓ down", axis: "yPercent", s: 1 },
  { label: "→ sideways", axis: "xPercent", s: 1 },
] as const;
function M144() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const tl = gsap.timeline({ repeat: -1 });
    const STEP = 1.1;
    const n = M144_WORDS.length;
    M144_ROWS.forEach((row, ri) => {
      const ws = gsap.utils.toArray<HTMLElement>(`.m144-r${ri} .m144-w`, el);
      gsap.set(ws.slice(1), { autoAlpha: 0 });
      for (let k = 0; k < n; k++) {
        const at = 0.2 + ri * 0.22 + k * STEP;
        // current word leaves (default: up), next enters from the opposite side; the slot clips the overflow
        tl.to(ws[k], { [row.axis]: 100 * row.s, autoAlpha: 0, duration: 0.55, ease: "power3.inOut" }, at);
        tl.fromTo(ws[(k + 1) % n], { [row.axis]: -100 * row.s, autoAlpha: 0 }, { [row.axis]: 0, autoAlpha: 1, duration: 0.55, ease: "power3.inOut", immediateRender: false }, at);
      }
    });
    tl.to({}, { duration: 0.01 }, n * STEP + 0.2 - 0.01);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(79,141,255,.38)" g2="rgba(255,122,89,.2)">
      <div className="absolute inset-0 flex flex-col justify-center gap-[2.2vh] px-[8%]">
        {M144_ROWS.map((row, ri) => (
          <div key={row.label} className={`m144-r${ri} flex items-baseline gap-6`}>
            <span className="w-[120px] shrink-0 text-[13px] uppercase tracking-[0.18em] text-white/55">{row.label}</span>
            <p className="whitespace-nowrap text-[clamp(36px,4.6vw,72px)] font-[500] leading-[1.15] tracking-[-0.02em]" style={{ fontFamily: F.sg }}>
              Made for{" "}
              <span className="relative inline-block overflow-hidden align-bottom text-[#4f8dff]">
                <span className="invisible">long drives</span>
                {M144_WORDS.map((w, i) => (
                  <span key={w} className="m144-w absolute left-0 top-0" style={i ? { visibility: "hidden" } : undefined}>
                    {w}
                  </span>
                ))}
              </span>
            </p>
          </div>
        ))}
      </div>
    </Stage>
  );
}

/* ───────────────────────── M145 · Words slide sideways in masks (play) ───────────────────────── */
const M145_BLOCKS = ["New season linen, cut loose.", "Free returns, made simple."];
function M145() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const parts = gsap.utils.toArray<HTMLElement>(".m145-b", el).map((b) => ({
      b,
      wraps: Array.from(b.querySelectorAll<HTMLElement>(".m145-wrap")),
      ins: Array.from(b.querySelectorAll<HTMLElement>(".m145-in")),
    }));
    gsap.set(parts[1].wraps, { xPercent: -100 });
    gsap.set(parts[1].ins, { xPercent: 100 });
    const D = { duration: 0.6, ease: "power3.inOut", stagger: 0.045 };
    const swap = (tl: gsap.core.Timeline, f: number, t: number, at: number) => {
      // out: each word slides -100 while its window slides +100 (counter-slide) → wipes away sideways in place
      tl.fromTo(parts[f].wraps, { xPercent: 0 }, { xPercent: 100, ...D, immediateRender: false }, at);
      tl.fromTo(parts[f].ins, { xPercent: 0 }, { xPercent: -100, ...D, immediateRender: false }, at);
      tl.set(parts[f].b, { visibility: "hidden" }, at + 0.95);
      // in: the reverse (window from -100, word from +100)
      tl.set(parts[t].b, { visibility: "visible" }, at + 0.3);
      tl.fromTo(parts[t].wraps, { xPercent: -100 }, { xPercent: 0, ...D, immediateRender: false }, at + 0.3);
      tl.fromTo(parts[t].ins, { xPercent: 100 }, { xPercent: 0, ...D, immediateRender: false }, at + 0.3);
    };
    const tl = gsap.timeline({ repeat: -1 });
    swap(tl, 0, 1, 0.25);
    swap(tl, 1, 0, 1.85);
    tl.to({}, { duration: 0.01 }, 3.2);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(24,196,143,.3)" g2="rgba(79,141,255,.24)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="grid place-items-center">
          {M145_BLOCKS.map((t, bi) => (
            <h3
              key={t}
              className="m145-b max-w-[16ch] text-center text-[clamp(44px,6vw,96px)] font-[700] leading-[1.05] tracking-[-0.03em] [grid-area:1/1]"
              style={{ fontFamily: F.sy, visibility: bi ? "hidden" : undefined }}
              aria-hidden={bi ? true : undefined}
            >
              {t.split(" ").map((w, i, a) => (
                <Fragment key={i}>
                  <span className="m145-wrap inline-block overflow-hidden align-bottom">
                    <span className="m145-in inline-block pb-[0.1em]">{w}</span>
                  </span>
                  {i < a.length - 1 ? " " : ""}
                </Fragment>
              ))}
            </h3>
          ))}
        </div>
      </div>
      <p className="absolute bottom-5 left-6 text-[13px] uppercase tracking-[0.18em] text-white/60">Coastline linen · Shirts ₹2,890</p>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M135", name: "Stroke draw then flood fill", how: "SVG headline: each letter's outline draws on (staggered), then the fill wipes up inside it · loops", kind: "play", C: M135 },
  { code: "M136", name: "Text block swap: words rise from tilt", how: "Next block's words rise from yPercent 30, tilted from their outer edges, and settle flat · A ↔ B loop", kind: "play", C: M136 },
  { code: "M137", name: "Text loop on arch", how: "A phrase flows over a semicircular arch above the product (textPath startOffset loop)", kind: "play", C: M137 },
  { code: "M138", name: "Text overwrite (TextPlugin)", how: "New tagline + price replace the old one letter by letter, left to right · cycles", kind: "play", C: M138 },
  { code: "M139", name: "Text roll-in (letters flip down then settle)", how: "Two stacked copies per letter: top rolls 0→90°, bottom settles 90→0°, staggered left to right", kind: "play", C: M139 },
  { code: "M140", name: "Tracking-in", how: "Letter-spacing eases to normal while the text fades in · from tight (-0.5em) then from wide (1em)", kind: "play", C: M140 },
  { code: "M141", name: "True-focus word sweep", how: "All words blurred but one; a corner-bracket frame glides word to word every ~1 s and unblurs it", kind: "play", C: M141 },
  { code: "M142", name: "Variable weight on scroll", how: "Headline weight interpolates thin 100 → black 900 (font-variation-settings), scrubbed by scroll", kind: "scrub", C: M142 },
  { code: "M143", name: "Vertical cut reveal (staggered chars)", how: "Each char springs up out of its own mask with overshoot · from the centre out, then random order", kind: "play", C: M143 },
  { code: "M144", name: "Word loop slide-up", how: "One word slot cycles a list: old word slides out, next enters from the opposite side · up / down / sideways", kind: "play", C: M144 },
  { code: "M145", name: "Words slide sideways in masks", how: "Each word and its window counter-slide (-100 / +100), wiping words sideways in place · A ↔ B loop", kind: "play", C: M145 },
];
