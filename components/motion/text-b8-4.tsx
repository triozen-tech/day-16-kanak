"use client";

// Text motions, batch 8 · group 4 (MOTION-MENU M386–M397). Small focused demos for /lab/motion, rebuilt in GSAP / CSS / SVG
// from the idea only. Every demo: plays by itself on screen (or follows the scroll), loops, has a CSS glow loop that never
// stops, and shows a sensible final state in ?static=1 / reduced motion.
import { useEffect, useId, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, SplitText, prefersReducedMotion } from "@/lib/gsap";
import { useScrub, useTicker } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = { sg: "Space Grotesk Variable", fr: "Fraunces Variable", is: "Instrument Serif", sy: "Syne Variable", mr: "Manrope Variable" };
const ACC = "#ffa35c";

const CSS = `
.b8g4-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 32% 38%,var(--g1,rgba(255,163,92,.42)),transparent 70%),radial-gradient(34% 40% at 70% 66%,var(--g2,rgba(79,141,255,.22)),transparent 70%);animation:b8g4-drift 6s linear infinite alternate;will-change:transform}
.b8g4-top{mix-blend-mode:screen;opacity:.45;z-index:5}
@keyframes b8g4-drift{0%{transform:translate3d(-7%,-5%,0) scale(1)}100%{transform:translate3d(7%,6%,0) scale(1.15)}}
.m397-out{color:transparent;-webkit-text-stroke:1.5px rgba(234,245,255,.75)}
html.is-static .b8g4-glow{animation:none}
html.is-static {.b8g4-glow{animation:none}}
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
      <style href="b8g4-css" precedence="default">
        {CSS}
      </style>
      <div className="b8g4-glow" style={vars} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
      {top && <div className="b8g4-glow b8g4-top" style={vars} aria-hidden />}
    </div>
  );
}

/** "play" helper: waits for fonts, builds the looping animation in a gsap.context, plays it only on screen, reverts on unmount. */
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

/** Real pointer wins while it moves (and 1.2 s after); otherwise the fake point is used. Root-relative px. */
function pointerSource(root: HTMLElement, onClean: (fn: () => void) => void) {
  const real = { x: 0, y: 0, t: -1e9 };
  const move = (e: PointerEvent) => {
    const r = root.getBoundingClientRect();
    real.x = e.clientX - r.left;
    real.y = e.clientY - r.top;
    real.t = performance.now();
  };
  root.addEventListener("pointermove", move);
  onClean(() => root.removeEventListener("pointermove", move));
  return (fake: { x: number; y: number }) => (performance.now() - real.t < 1200 ? { x: real.x, y: real.y, real: true } : { ...fake, real: false });
}

/** Runs fn on gsap's ticker while `anim` is playing (the play helper pauses it off screen). */
function tickWhile(anim: gsap.core.Animation, onClean: (fn: () => void) => void, fn: (dt: number) => void) {
  const tick = (_t: number, dtMs: number) => {
    if (!anim.paused()) fn(Math.min(0.05, dtMs / 1000));
  };
  gsap.ticker.add(tick);
  onClean(() => gsap.ticker.remove(tick));
}

const Caption = ({ children }: { children: ReactNode }) => (
  <p className="absolute bottom-5 left-6 text-[13px] uppercase tracking-[0.18em] text-white/60">{children}</p>
);

/* ───────────────────────── M386 · Text set on an arc (play, SplitText) ───────────────────────── */
function M386() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const head = el.querySelector<HTMLElement>(".m386-h")!;
    const read = el.querySelector<HTMLElement>(".m386-r")!;
    const split = SplitText.create(head, { type: "chars" });
    onClean(() => split.revert());
    const chars = split.chars as HTMLElement[];
    const W = head.offsetWidth;
    const xs = chars.map((c) => c.offsetLeft + c.offsetWidth / 2 - W / 2);
    gsap.set(chars, { transformOrigin: "50% 50%" });
    const set = chars.map((c) => ({ x: gsap.quickSetter(c, "x", "px"), y: gsap.quickSetter(c, "y", "px"), r: gsap.quickSetter(c, "rotation", "deg") }));
    const kMax = 2.2 / W; // the ends reach ~63° at full bend
    const st = { u: 0 };
    const apply = () => {
      // curvature follows a sine: straight → convex (∩) → straight → concave (∪), never resting
      const k = kMax * Math.sin(st.u * Math.PI * 2);
      xs.forEach((x, i) => {
        let dx = 0;
        let dy: number;
        const th = x * k;
        if (Math.abs(k) < 1e-7) dy = (x * x * k) / 2;
        else {
          dx = Math.sin(th) / k - x;
          dy = (1 - Math.cos(th)) / k;
        }
        set[i].x(dx);
        set[i].y(dy);
        set[i].r((th * 180) / Math.PI);
      });
      read.textContent = Math.abs(k) < 1e-5 ? "Radius ∞ · straight" : `Radius ${Math.round(1 / Math.abs(k))} px · ${k > 0 ? "convex" : "concave"}`;
    };
    return gsap.to(st, { u: 1, duration: 4.4, ease: "none", repeat: -1, onUpdate: apply });
  });
  return (
    <Stage r={root} g1="rgba(255,163,92,.45)" g2="rgba(120,180,255,.22)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center">
          <p className="mb-10 text-[13px] uppercase tracking-[0.22em] text-white/55">Studio pottery · Batch 09</p>
          <h3 className="m386-h relative inline-block whitespace-nowrap text-[clamp(56px,5.8vw,96px)] font-[500] leading-none tracking-[-0.01em]" style={{ fontFamily: F.fr }}>
            Kiln &amp; clay studio
          </h3>
          <p className="mt-16 text-[13px] uppercase tracking-[0.22em] text-white/60">Glazed tea bowl · ₹1,450</p>
        </div>
      </div>
      <p className="m386-r absolute bottom-5 right-6 text-[13px] uppercase tracking-[0.18em] text-[#ffa35c]">Radius ∞ · straight</p>
    </Stage>
  );
}

/* ───────────────────────── M387 · Text wrapped on rotating barrel (scrub, CSS 3D) ───────────────────────── */
const M387_CELL = 46;
const M387_RINGS = [
  { text: "AGED IN OAK · SMOKED CHILLI · SMALL BATCH · ", dir: 1, color: "#eaf5ff" },
  { text: "HOT SAUCE NO. 7 · ₹540 · 150 ML · BOTTLED BY HAND · ", dir: -1, color: ACC },
  { text: "GHOST PEPPER · CANE VINEGAR · SEA SALT · ", dir: 1, color: "#eaf5ff" },
].map((r) => {
  const chars = r.text.split("");
  const N = chars.length;
  return { ...r, chars, N, R: (N * M387_CELL) / (2 * Math.PI), step: 360 / N };
});
const m387Letter = (ringAngle: number, i: number, ring: (typeof M387_RINGS)[number]) => {
  const a = ringAngle + i * ring.step;
  const c = Math.cos((a * Math.PI) / 180);
  return { transform: `rotateY(${a.toFixed(2)}deg) translateZ(${ring.R.toFixed(1)}px)`, opacity: (0.12 + 0.88 * Math.max(0, c)).toFixed(3) };
};
const m387Angle = (p: number, k: number) => M387_RINGS[k].dir * -p * 420 + k * 24;
function M387() {
  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  useScrub(
    root,
    (p) => {
      const el = root.current;
      if (!el) return;
      el.querySelectorAll<HTMLElement>(".m387-ring").forEach((ringEl, k) => {
        const ring = M387_RINGS[k];
        const ang = m387Angle(p, k);
        ringEl.querySelectorAll<HTMLElement>(".m387-c").forEach((c, i) => {
          const s = m387Letter(ang, i, ring);
          c.style.transform = s.transform;
          c.style.opacity = s.opacity;
        });
      });
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    },
    { finalValue: 0.5 },
  );
  return (
    <Stage r={root} g1="rgba(255,110,70,.42)" g2="rgba(255,190,90,.22)">
      <div className="absolute inset-0 grid place-items-center" style={{ perspective: "1500px" }}>
        <div className="relative h-0 w-0" style={{ transformStyle: "preserve-3d", transform: "rotateX(-9deg)" }}>
          {M387_RINGS.map((ring, k) => (
            <div key={k} className="m387-ring absolute left-0 top-0" style={{ transformStyle: "preserve-3d", transform: `translateY(${(k - 1) * 74}px)` }}>
              {ring.chars.map((ch, i) => {
                const s = m387Letter(m387Angle(0, k), i, ring);
                return (
                  <span
                    key={i}
                    className="m387-c absolute left-0 top-0 -ml-[23px] -mt-[32px] block h-[64px] w-[46px] text-center text-[58px] font-[800] leading-[64px]"
                    style={{ fontFamily: F.sy, color: ring.color, transform: s.transform, opacity: Number(s.opacity) }}
                  >
                    {ch}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-5 left-6 flex items-center gap-4 text-[13px] uppercase tracking-[0.18em] text-white/65">
        <span>Cask-aged hot sauce · ₹540</span>
        <span className="relative block h-px w-[160px] bg-white/15">
          <span ref={bar} className="absolute inset-0 origin-left bg-[#ffa35c]" style={{ transform: "scaleX(0)" }} />
        </span>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M388 · Text-based loading screen (play, gsap + ScrambleText) ───────────────────────── */
const M388_LINES = ["atelier noor — spring 26", "loading the looks", "setting the type", "pressing the linen"];
function M388() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const loader = el.querySelector<HTMLElement>(".m388-loader")!;
    const lines = gsap.utils.toArray<HTMLElement>(".m388-l", el);
    const count = el.querySelector<HTMLElement>(".m388-n")!;
    const words = gsap.utils.toArray<HTMLElement>(".m388-w", el);
    const sub = el.querySelector<HTMLElement>(".m388-sub")!;
    const n = { v: 0 };
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(loader, { y: 0, yPercent: 0, visibility: "visible" }, 0)
      .call(() => lines.forEach((l) => (l.textContent = "")), [], 0)
      .set(words, { yPercent: 110 }, 0)
      .set(sub, { opacity: 0, y: 16 }, 0)
      .set(n, { v: 0 }, 0)
      .to(n, { v: 100, duration: 2.25, ease: "none", onUpdate: () => (count.textContent = String(Math.round(n.v)).padStart(3, "0")) }, 0.05);
    lines.forEach((l, i) => {
      tl.to(l, { duration: 0.6, scrambleText: { text: M388_LINES[i], chars: "lowerCase", revealDelay: 0.15, speed: 0.8 }, ease: "none" }, 0.1 + i * 0.5);
    });
    tl.to(loader, { yPercent: -100, duration: 0.8, ease: "power2.inOut" }, 2.35)
      .to(words, { yPercent: 0, duration: 0.7, stagger: 0.09, ease: "power2.out" }, 2.6)
      .to(sub, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 2.95)
      .to({}, { duration: 0.2 }, 3.45);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,163,92,.42)" g2="rgba(160,120,255,.22)">
      {/* the page underneath (final state) */}
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center">
          <p className="mb-6 text-[13px] uppercase tracking-[0.22em] text-white/55">Atelier Noor · Spring 26</p>
          <h3 className="text-[clamp(60px,6.4vw,108px)] leading-[0.95] tracking-[-0.01em]" style={{ fontFamily: F.is }}>
            {["Linen", "for", "slow", "days"].map((w, i, a) => (
              <span key={i} className={`inline-block overflow-hidden align-bottom ${i < a.length - 1 ? "mr-[0.28em]" : ""}`}>
                <span className="m388-w inline-block">{w}</span>
              </span>
            ))}
          </h3>
          <p className="m388-sub mt-8 text-[13px] uppercase tracking-[0.22em] text-white/60">Relaxed shirt · washed sand · ₹3,900</p>
        </div>
      </div>
      {/* the text-only loader (starts hidden in the markup so ?static=1 shows the page) */}
      <div className="m388-loader absolute inset-0 z-10 bg-[#0a0f1c]" style={{ transform: "translateY(-100%)", visibility: "hidden" }}>
        <div className="absolute left-[7%] top-[16%] space-y-3 text-[clamp(20px,1.9vw,30px)] text-white/80" style={{ fontFamily: F.mr }}>
          {M388_LINES.map((t, i) => (
            <p key={i} className="m388-l h-[1.3em]">
              {t}
            </p>
          ))}
        </div>
        <p className="absolute bottom-[10%] right-[7%] text-[clamp(90px,10vw,170px)] font-[700] leading-none tracking-[-0.03em] text-[#ffa35c]" style={{ fontFamily: F.sg }}>
          <span className="m388-n">100</span>
          <span className="text-[0.4em] text-white/60">%</span>
        </p>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M389 · Turbulence-displaced text reveal (play, SVG filter) ───────────────────────── */
function M389() {
  const root = useRef<HTMLDivElement>(null);
  const fid = `m389f${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  usePlay(root, (el) => {
    const head = el.querySelector<HTMLElement>(".m389-h")!;
    const disp = el.querySelector<SVGFEDisplacementMapElement>(".m389-d")!;
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(disp, { attr: { scale: 280 } }, 0)
      .set(head, { scaleX: 2.4, opacity: 0 }, 0)
      .to(head, { opacity: 1, duration: 0.5, ease: "none" }, 0)
      .to(disp, { attr: { scale: 0 }, duration: 1.6, ease: "power1.out" }, 0)
      .to(head, { scaleX: 1, duration: 1.6, ease: "power1.out" }, 0)
      .to(disp, { attr: { scale: 200 }, duration: 0.8, ease: "power1.in" }, 1.6)
      .to(head, { opacity: 0, scaleX: 1.5, duration: 0.8, ease: "power1.in" }, 1.6);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(120,200,255,.4)" g2="rgba(255,163,92,.24)">
      <svg className="absolute h-0 w-0" aria-hidden>
        <filter id={fid} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.07" numOctaves={1} seed={7} result="n" />
          <feDisplacementMap className="m389-d" in="SourceGraphic" in2="n" scale={0} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center">
          <p className="mb-6 text-[13px] uppercase tracking-[0.22em] text-white/55">Monsoon capsule · 06 pieces</p>
          <h3 className="m389-h text-[clamp(64px,7vw,120px)] leading-[0.95] tracking-[-0.01em]" style={{ fontFamily: F.is, filter: `url(#${fid})` }}>
            Rain-washed
            <br />
            <em>linen shirts</em>
          </h3>
          <p className="mt-8 text-[13px] uppercase tracking-[0.22em] text-white/60">From ₹3,200 · free alterations</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M390 · Two-direction slide-in (play, gsap) ───────────────────────── */
const M390_LINES = ["Pack light.", "Travel far.", "Stay longer."];
function M390() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const lines = gsap.utils.toArray<HTMLElement>(".m390-l", el);
    const W = el.clientWidth;
    const side = (i: number) => (i % 2 === 0 ? -1 : 1);
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(lines, { x: (i: number) => side(i) * W * 0.6, opacity: 0 }, 0)
      .to(lines, { x: 0, opacity: 1, duration: 0.85, ease: "power2.out", stagger: 0.16 }, 0.05)
      // exit to the opposite side: each line passes straight through the centre
      .to(lines, { x: (i: number) => -side(i) * W * 0.6, opacity: 0, duration: 0.65, ease: "power2.in", stagger: 0.12 }, 1.45);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(90,200,190,.38)" g2="rgba(255,163,92,.26)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center">
          <p className="mb-6 text-[13px] uppercase tracking-[0.22em] text-white/55">Carry-on 40 L · Harbour grey</p>
          {M390_LINES.map((l, i) => (
            <div
              key={i}
              className={`m390-l text-[clamp(56px,6.2vw,104px)] font-[700] leading-[1.02] tracking-[-0.02em] ${i === 1 ? "text-[#ffa35c]" : ""}`}
              style={{ fontFamily: F.sg }}
            >
              {l}
            </div>
          ))}
          <p className="mt-8 text-[13px] uppercase tracking-[0.22em] text-white/60">₹8,400 · lifetime zips</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M391 · Type folds like paper (scrub, CSS 3D) ───────────────────────── */
const M391_LINES = ["Folded", "by hand,", "pressed", "to last."];
function M391() {
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
      const L = l.offsetHeight;
      // linear over the whole panel: the column travels from low on the stage to above the middle
      const y = gsap.utils.interpolate(H * 0.5, H * 0.42 - L, p);
      l.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
      l.querySelectorAll<HTMLElement>(".m391-line").forEach((line) => {
        const c = y + line.offsetTop + line.offsetHeight / 2;
        const d = (c - H / 2) / (H / 2);
        const f = gsap.utils.clamp(0, 1, (0.2 - d) / 0.7); // folds as it crosses the middle
        const flap = line.querySelector<HTMLElement>(".m391-flap")!;
        flap.style.transform = `rotateX(${(-f * 168).toFixed(2)}deg)`;
        line.querySelector<HTMLElement>(".m391-shade")!.style.opacity = (Math.sin(f * Math.PI) * 0.5).toFixed(3);
        line.querySelector<HTMLElement>(".m391-cast")!.style.opacity = (f * 0.4).toFixed(3);
      });
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    },
    { finalValue: 0.5 },
  );
  const paper = "relative whitespace-nowrap bg-[#efe8da] px-[0.3em] text-[#1b1712]";
  return (
    <Stage r={root} g1="rgba(255,190,120,.38)" g2="rgba(79,141,255,.22)">
      <div ref={stage} className="absolute inset-0 overflow-hidden">
        <span className="absolute left-[6%] right-[6%] top-1/2 h-px bg-white/10" aria-hidden />
        <div
          ref={list}
          className="absolute inset-x-0 top-0 flex flex-col items-center gap-[0.32em] text-[clamp(52px,5.6vw,92px)] font-[600] leading-[1.15] will-change-transform"
          style={{ fontFamily: F.fr, transform: "translate3d(0,8vh,0)" }}
        >
          {M391_LINES.map((t, i) => (
            <div key={i} className="m391-line relative" style={{ perspective: "900px" }}>
              <div className={paper} style={{ clipPath: "inset(50% 0 0 0)" }}>
                {t}
                <span className="m391-cast absolute inset-0 bg-black opacity-0" aria-hidden />
              </div>
              <div className="m391-flap absolute inset-x-0 top-0 h-1/2" style={{ transformOrigin: "50% 100%", transformStyle: "preserve-3d" }}>
                <div className="absolute inset-0 overflow-hidden" style={{ backfaceVisibility: "hidden" }}>
                  <div className={`${paper} absolute left-0 right-0 top-0`}>{t}</div>
                  <span className="m391-shade absolute inset-0 bg-black opacity-0" aria-hidden />
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-[#c9bfac] to-[#e4dccb]" style={{ transform: "rotateX(180deg)", backfaceVisibility: "hidden" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-5 left-6 flex items-center gap-4 text-[13px] uppercase tracking-[0.18em] text-white/65">
        <span>Handmade paper journal · ₹1,180</span>
        <span className="relative block h-px w-[160px] bg-white/15">
          <span ref={bar} className="absolute inset-0 origin-left bg-[#ffa35c]" style={{ transform: "scaleX(0)" }} />
        </span>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M392 · Typewriter with delete and word cycle (play, gsap) ───────────────────────── */
const M392_WORDS = ["slow Sundays", "monsoon walks", "rooftop dinners", "long drives"];
function M392() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const out = el.querySelector<HTMLElement>(".m392-t")!;
    const caret = el.querySelector<HTMLElement>(".m392-caret")!;
    const tl = gsap.timeline({ repeat: -1 });
    let t = 0;
    tl.call(() => (out.textContent = ""), [], 0).set(caret, { opacity: 1 }, 0);
    M392_WORDS.forEach((w) => {
      // type ~50 ms / char, caret solid
      for (let i = 1; i <= w.length; i++) {
        t += 0.05;
        tl.call(() => (out.textContent = w.slice(0, i)), [], t);
      }
      // pause: caret blinks (changes every 0.22 s)
      for (let k = 0; k < 4; k++) {
        t += 0.22;
        tl.set(caret, { opacity: k % 2 === 0 ? 0 : 1 }, t);
      }
      t += 0.1;
      tl.set(caret, { opacity: 1 }, t);
      // delete faster, ~30 ms / char
      for (let i = w.length - 1; i >= 0; i--) {
        t += 0.03;
        tl.call(() => (out.textContent = w.slice(0, i)), [], t);
      }
      t += 0.12;
    });
    tl.to({}, { duration: 0.01 }, t);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,163,92,.42)" g2="rgba(90,170,255,.22)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="w-[min(75%,1000px)]">
          <p className="mb-6 text-[13px] uppercase tracking-[0.22em] text-white/55">Easy linen co-ord · ₹4,600</p>
          <p className="text-[clamp(56px,6vw,100px)] font-[500] leading-[1.02] tracking-[-0.02em]" style={{ fontFamily: F.sg }}>
            Linen made for
          </p>
          <p className="mt-1 whitespace-nowrap text-[clamp(56px,6vw,100px)] leading-[1.1] tracking-[-0.01em] text-[#ffa35c]" style={{ fontFamily: F.is }}>
            <span className="m392-t">{M392_WORDS[0]}</span>
            <span className="m392-caret ml-[0.06em] inline-block h-[0.85em] w-[0.06em] translate-y-[0.1em] bg-[#eaf5ff]" aria-hidden />
          </p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M393 · Typography page transition (play, gsap) ───────────────────────── */
function M393() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const cover = el.querySelector<HTMLElement>(".m393-cover")!;
    const rows = gsap.utils.toArray<HTMLElement>(".m393-row", el);
    const A = el.querySelector<HTMLElement>(".m393-a")!;
    const B = el.querySelector<HTMLElement>(".m393-b")!;
    const aIn = gsap.utils.toArray<HTMLElement>(".m393-a .m393-in", el);
    const bIn = gsap.utils.toArray<HTMLElement>(".m393-b .m393-in", el);
    const tl = gsap.timeline({ repeat: -1 });
    const half = (at: number, word: string, from: HTMLElement, to: HTMLElement, items: HTMLElement[]) => {
      tl.set(cover, { visibility: "visible", y: 0, yPercent: 100 }, at)
        .call(() => rows.forEach((r) => (r.textContent = word)), [], at)
        .set(rows, { yPercent: 120 }, at)
        .to(cover, { yPercent: 0, duration: 0.6, ease: "power2.inOut" }, at)
        .to(rows, { yPercent: 0, duration: 0.55, stagger: 0.07, ease: "power2.out" }, at + 0.2)
        .set(from, { visibility: "hidden" }, at + 0.7)
        .set(to, { visibility: "visible" }, at + 0.7)
        .set(items, { y: 40, opacity: 0 }, at + 0.7)
        .to(rows, { yPercent: -120, duration: 0.55, stagger: 0.06, ease: "power2.in" }, at + 0.85)
        .to(cover, { yPercent: -100, duration: 0.65, ease: "power2.inOut" }, at + 1.0)
        .to(items, { y: 0, opacity: 1, duration: 0.55, stagger: 0.08, ease: "power2.out" }, at + 1.35);
    };
    half(0.05, "JOURNAL", A, B, bIn);
    half(2.35, "THE EDIT", B, A, aIn);
    tl.to({}, { duration: 0.05 }, 4.55);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,163,92,.44)" g2="rgba(79,141,255,.22)">
      {/* page A */}
      <div className="m393-a absolute inset-0 flex flex-col justify-center px-[7%]">
        <p className="m393-in text-[13px] uppercase tracking-[0.22em] text-white/55">The edit · Summer 26</p>
        <h3 className="m393-in mt-3 text-[clamp(52px,5.4vw,90px)] font-[700] leading-none tracking-[-0.02em]" style={{ fontFamily: F.sg }}>
          Sun-faded basics
        </h3>
        <div className="mt-8 flex gap-5">
          {[
            ["Boxy tee", "₹1,290", "from-[#f3b47f] to-[#b8643a]"],
            ["Pleat short", "₹2,450", "from-[#9fc3d9] to-[#3d6a8a]"],
            ["Camp shirt", "₹3,100", "from-[#e3d6b4] to-[#8f7d55]"],
          ].map(([n, p, g]) => (
            <div key={n} className="m393-in w-[min(22%,240px)]">
              <div className={`aspect-[4/5] rounded-[18px] bg-gradient-to-br ${g}`} />
              <p className="mt-3 flex justify-between text-[14px] text-white/80">
                <span>{n}</span>
                <span>{p}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
      {/* page B */}
      <div className="m393-b absolute inset-0 flex flex-col justify-center px-[7%]" style={{ visibility: "hidden" }}>
        <p className="m393-in text-[13px] uppercase tracking-[0.22em] text-white/55">Journal · Issue 12</p>
        <h3 className="m393-in mt-3 max-w-[14ch] text-[clamp(52px,5.4vw,90px)] leading-[0.98]" style={{ fontFamily: F.is }}>
          Notes from the loom
        </h3>
        {["Why we wash every shirt twice", "A week with the dyers of Bagru", "Caring for linen, simply"].map((t, i) => (
          <p key={t} className="m393-in mt-4 flex max-w-[640px] justify-between border-t border-white/15 pt-4 text-[16px] text-white/80">
            <span>{t}</span>
            <span className="text-white/45">0{i + 1}</span>
          </p>
        ))}
      </div>
      {/* the giant-type cover (hidden in the markup) */}
      <div className="m393-cover absolute inset-0 z-10 flex flex-col items-center justify-center overflow-hidden bg-[#ffa35c] text-[#120d08]" style={{ transform: "translateY(100%)", visibility: "hidden" }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="overflow-hidden">
            <div
              className={`m393-row whitespace-nowrap text-[clamp(80px,9.6vw,156px)] font-[800] leading-[0.95] tracking-[-0.02em] ${i === 1 ? "" : "text-transparent [-webkit-text-stroke:2px_#120d08]"}`}
              style={{ fontFamily: F.sy }}
            >
              JOURNAL
            </div>
          </div>
        ))}
      </div>
    </Stage>
  );
}

/* ───────────────────────── M394 · Username slot reel (play, gsap) ───────────────────────── */
const M394_NAMES = ["@mira.loom", "@kabir.frames", "@ana.sundry", "@devhaus", "@tara.sails", "@neel.okra", "@zoya.ink", "@ivo.kiln"];
const M394_COPIES = 6;
function M394() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const col = el.querySelector<HTMLElement>(".m394-col")!;
    const items = gsap.utils.toArray<HTMLElement>(".m394-i", el);
    const rowH = items[0].offsetHeight;
    const N = M394_NAMES.length;
    const yFor = (i: number) => rowH * (1 - i);
    const steps = [3, 5, 2, 6, 4, 7, 3, 5];
    let cur = 0;
    const blur = gsap.quickSetter(col, "filter");
    let lastY = yFor(0);
    gsap.set(col, { y: yFor(0) });
    const tl = gsap.timeline({ repeat: -1 });
    steps.forEach((s, k) => {
      const from = cur;
      const target = from + 2 * N + s;
      const at = k * 2.25;
      tl.call(() => items.forEach((it) => it.classList.remove("text-[#ffa35c]")), [], at)
        .set(col, { y: yFor(from) }, at)
        .to(
          col,
          {
            y: yFor(target),
            duration: 1.85,
            ease: "power2.out",
            onUpdate: () => {
              const y = gsap.getProperty(col, "y") as number;
              blur(`blur(${Math.min(3, Math.abs(y - lastY) / 30).toFixed(2)}px)`);
              lastY = y;
            },
          },
          at,
        )
        .call(
          () => {
            blur("blur(0px)");
            gsap.set(col, { y: yFor(target % N) });
            lastY = yFor(target % N);
            items[target % N].classList.add("text-[#ffa35c]");
          },
          [],
          at + 1.86,
        )
        .fromTo(".m394-flash", { scaleX: 0, opacity: 1 }, { scaleX: 1, opacity: 0.25, duration: 0.38, ease: "power1.out" }, at + 1.86);
      cur = (from + 2 * N + s) % N;
    });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,163,92,.46)" g2="rgba(160,120,255,.24)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center">
          <p className="mb-6 text-[13px] uppercase tracking-[0.22em] text-white/55">Founding members · card No. 0412</p>
          <div className="relative mx-auto h-[3.6em] w-[min(70vw,880px)] overflow-hidden text-[clamp(52px,5.4vw,90px)] [mask-image:linear-gradient(transparent,#000_30%,#000_70%,transparent)]">
            <span className="absolute inset-x-[10%] top-[1.2em] h-px bg-white/20" aria-hidden />
            <span className="absolute inset-x-[10%] top-[2.4em] h-px bg-white/20" aria-hidden />
            <span className="m394-flash absolute inset-x-[10%] top-[2.4em] h-[2px] origin-left bg-[#ffa35c] opacity-0" aria-hidden />
            <div className="m394-col absolute inset-x-0 top-0 will-change-transform" style={{ transform: "translateY(1.2em)" }}>
              {Array.from({ length: M394_COPIES }, (_, c) =>
                M394_NAMES.map((n, i) => (
                  <div
                    key={`${c}-${i}`}
                    className={`m394-i h-[1.2em] whitespace-nowrap font-[700] leading-[1.2em] tracking-[-0.02em] ${c === 0 && i === 0 ? "text-[#ffa35c]" : ""}`}
                    style={{ fontFamily: F.sg }}
                  >
                    {n}
                  </div>
                )),
              )}
            </div>
          </div>
          <p className="mt-6 text-[13px] uppercase tracking-[0.22em] text-white/60">Handle reserved · lifetime pass ₹2,999</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M395 · Variable font morph on hover (play, SplitText + timed hover) ───────────────────────── */
function M395() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const head = el.querySelector<HTMLElement>(".m395-h")!;
    const dot = el.querySelector<HTMLElement>(".m395-dot")!;
    const split = SplitText.create(head, { type: "chars" });
    onClean(() => split.revert());
    const chars = split.chars as HTMLElement[];
    gsap.set(chars, { fontVariationSettings: "'wght' 200", transformOrigin: "50% 80%" });
    const ON = { fontVariationSettings: "'wght' 900", skewX: -11, scaleX: 1.1, y: -10 };
    const OFF = { fontVariationSettings: "'wght' 200", skewX: 0, scaleX: 1, y: 0 };
    const wave = (vars: object) => ({ ...vars, duration: 0.55, ease: "sine.inOut", stagger: { each: 0.07 } });
    const rr = el.getBoundingClientRect();
    const hr = head.getBoundingClientRect();
    const L = hr.left - rr.left;
    const T = hr.top - rr.top;
    const W = hr.width;
    const H = hr.height;
    // the fake pointer keeps moving: in onto the word → across it (morph in) → out (morph back) → around
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(dot, { x: L + W * 1.15, y: T + H * 1.6, opacity: 1 }, 0)
      .to(dot, { x: L + W * 0.15, y: T + H * 0.55, duration: 0.6, ease: "sine.inOut" }, 0)
      .to(chars, wave(ON), 0.5)
      .to(dot, { x: L + W * 0.85, y: T + H * 0.45, duration: 1.0, ease: "none" }, 0.6)
      .to(dot, { x: L - W * 0.1, y: T - H * 0.6, duration: 0.6, ease: "sine.inOut" }, 1.6)
      .to(chars, wave(OFF), 1.8)
      .to(dot, { x: L + W * 1.15, y: T + H * 1.6, duration: 0.8, ease: "sine.inOut" }, 2.2);
    // real hover still works: pointer over the stage pauses the auto loop, the word morphs on enter / leave
    const enterRoot = () => {
      tl.pause();
      gsap.set(dot, { opacity: 0 });
    };
    const leaveRoot = () => {
      gsap.to(chars, wave(OFF));
      tl.restart();
    };
    const enterWord = () => gsap.to(chars, wave(ON));
    const leaveWord = () => gsap.to(chars, wave(OFF));
    el.addEventListener("pointerenter", enterRoot);
    el.addEventListener("pointerleave", leaveRoot);
    head.addEventListener("pointerenter", enterWord);
    head.addEventListener("pointerleave", leaveWord);
    onClean(() => {
      el.removeEventListener("pointerenter", enterRoot);
      el.removeEventListener("pointerleave", leaveRoot);
      head.removeEventListener("pointerenter", enterWord);
      head.removeEventListener("pointerleave", leaveWord);
    });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,163,92,.55)" g2="rgba(110,160,255,.24)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center">
          <p className="mb-6 text-[13px] uppercase tracking-[0.22em] text-white/55">Monsoon festival · Type week</p>
          <h3 className="m395-h inline-block cursor-default whitespace-nowrap text-[clamp(96px,10.5vw,176px)] leading-none tracking-[-0.01em]" style={{ fontFamily: F.fr, fontVariationSettings: "'wght' 200" }}>
            Monsoon
          </h3>
          <p className="mt-8 text-[13px] uppercase tracking-[0.22em] text-white/60">Day pass · ₹1,200</p>
        </div>
      </div>
      <span className="m395-dot pointer-events-none absolute left-0 top-0 -ml-[8px] -mt-[8px] h-[16px] w-[16px] rounded-full border-2 border-white bg-white/30 opacity-0" aria-hidden />
    </Stage>
  );
}

/* ───────────────────────── M396 · Variable-font proximity (play, SplitText + auto pointer) ───────────────────────── */
function M396() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const head = el.querySelector<HTMLElement>(".m396-h")!;
    const dot = el.querySelector<HTMLElement>(".m396-dot")!;
    const split = SplitText.create(head, { type: "chars" });
    onClean(() => split.revert());
    const chars = split.chars as HTMLElement[];
    const rr = el.getBoundingClientRect();
    const hr = head.getBoundingClientRect();
    const ox = hr.left - rr.left;
    const oy = hr.top - rr.top;
    // centres cached at the thin base weight (no feedback jitter while letters swell)
    const centres = chars.map((c) => ({ x: ox + c.offsetLeft + c.offsetWidth / 2, y: oy + c.offsetTop + c.offsetHeight / 2 }));
    const w = chars.map(() => 160);
    const read = pointerSource(el, onClean);
    const fake = { u: 0 };
    const sweep = gsap.to(fake, { u: 1, duration: 3.4, ease: "sine.inOut", repeat: -1, yoyo: true });
    const R = hr.height * 1.6;
    tickWhile(sweep, onClean, (dt) => {
      const fx = ox - hr.width * 0.05 + fake.u * hr.width * 1.1;
      const fy = oy + hr.height * (0.5 + 0.45 * Math.sin(fake.u * Math.PI * 3));
      const p = read({ x: fx, y: fy });
      gsap.set(dot, { x: p.x, y: p.y, opacity: p.real ? 0 : 1 });
      const k = 1 - Math.exp(-dt * 12);
      chars.forEach((c, i) => {
        const d = Math.hypot(centres[i].x - p.x, centres[i].y - p.y);
        const f = Math.max(0, 1 - d / R);
        const target = 160 + 740 * f * f * (3 - 2 * f);
        w[i] += (target - w[i]) * k;
        c.style.fontVariationSettings = `'wght' ${w[i].toFixed(0)}`;
        c.style.color = `rgba(${Math.round(234 + 21 * f)},${Math.round(245 - 82 * f)},${Math.round(255 - 163 * f)},1)`;
      });
    });
    return sweep;
  });
  return (
    <Stage r={root} g1="rgba(255,163,92,.52)" g2="rgba(79,141,255,.24)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center">
          <p className="mb-6 text-[13px] uppercase tracking-[0.22em] text-white/55">Letterpress studio · Est. 2019</p>
          <h3 className="m396-h relative inline-block whitespace-nowrap text-[clamp(80px,7.6vw,128px)] leading-none tracking-[-0.01em]" style={{ fontFamily: F.fr, fontVariationSettings: "'wght' 160" }}>
            Hand-set type
          </h3>
          <p className="mt-8 text-[13px] uppercase tracking-[0.22em] text-white/60">Wedding suite · 50 cards · ₹6,500</p>
        </div>
      </div>
      <span className="m396-dot pointer-events-none absolute left-0 top-0 -ml-[8px] -mt-[8px] h-[16px] w-[16px] rounded-full border-2 border-white bg-white/30 opacity-0" aria-hidden />
    </Stage>
  );
}

/* ───────────────────────── M397 · Velocity marquee rows (scrub, gsap ticker) ───────────────────────── */
const M397_ROWS = [
  { items: ["Cold brew", "Oat flat white", "Pour over", "Masala mocha"], dir: -1, out: false },
  { items: ["Roasted in small lots", "Ground to order", "Since 2016"], dir: 1, out: true },
  { items: ["₹220 a cup", "Beans ₹780 / 250 g", "Free refills"], dir: -1, out: false },
];
function M397() {
  const root = useRef<HTMLDivElement>(null);
  const state = useRef({ p: 0, v: 0, dir: 1, acc: 0 });
  useScrub(
    root,
    (p, v) => {
      const s = state.current;
      s.p = p;
      if (Math.abs(v) > 0.002) {
        s.v = v;
        s.dir = v > 0 ? 1 : -1;
      }
    },
    { finalValue: 0 },
  );
  useTicker(root, (_t, dt) => {
    const el = root.current;
    if (!el) return;
    const s = state.current;
    const d = Math.min(0.05, dt);
    // base drift + scroll-velocity boost, direction flips with the scroll direction
    s.acc += s.dir * (70 + Math.abs(s.v) * 1400) * d;
    s.v *= Math.exp(-d * 3);
    el.querySelectorAll<HTMLElement>(".m397-track").forEach((tr, i) => {
      const row = M397_ROWS[i];
      const half = tr.scrollWidth / 2;
      const pos = row.dir * (s.acc + s.p * 1600); // linear scrub term + velocity term
      const x = -(((pos % half) + half) % half);
      tr.style.transform = `translate3d(${x.toFixed(1)}px,0,0) skewX(${(-row.dir * s.dir * Math.min(12, Math.abs(s.v) * 30)).toFixed(2)}deg)`;
    });
  });
  return (
    <Stage r={root} g1="rgba(255,163,92,.44)" g2="rgba(90,170,255,.24)">
      <div className="absolute inset-0 flex flex-col justify-center gap-[2vh] overflow-hidden">
        {M397_ROWS.map((row, i) => (
          <div key={i} className="overflow-hidden">
            <div className="m397-track flex w-max will-change-transform">
              {[0, 1].map((c) => (
                <div key={c} className="flex shrink-0">
                  {[...row.items, ...row.items].map((t, k) => (
                    <span
                      key={k}
                      className={`flex items-center whitespace-nowrap pr-[0.6em] text-[clamp(64px,7vw,116px)] font-[800] leading-[1.05] tracking-[-0.02em] ${row.out ? "m397-out" : i === 2 ? "text-[#ffa35c]" : ""}`}
                      style={{ fontFamily: F.sy }}
                    >
                      {t}
                      <span className="ml-[0.6em] inline-block h-[0.22em] w-[0.22em] rounded-full bg-current" aria-hidden />
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Caption>Scroll faster · the rows speed up and turn with you</Caption>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M386", name: "Text set on an arc", how: "The headline's letters bend from a straight line into a convex arc, back, then into a concave arc · loops on screen", kind: "play", C: M386 },
  { code: "M387", name: "Text wrapped on rotating barrel", how: "Three rings of letters wrap a 3D cylinder; scroll turns the barrel so words come round the front and exit at the back", kind: "scrub", C: M387 },
  { code: "M388", name: "Text-based loading screen", how: "A text-only loader: lines flicker-type in with a counter, then it slides up and the page headline rises in · loops", kind: "play", C: M388 },
  { code: "M389", name: "Turbulence-displaced text reveal", how: "Text resolves out of heavy SVG turbulence displacement (280 → 0) while stretched scaleX 2.4 → 1 · loops on screen", kind: "play", C: M389 },
  { code: "M390", name: "Two-direction slide-in", how: "Lines enter from alternating sides with a fade, meet in the centre, then exit to the opposite sides · loops", kind: "play", C: M390 },
  { code: "M391", name: "Type folds like paper", how: "Each paper-strip headline folds its upper half over the crease, with shading, as it crosses the middle · scrub", kind: "scrub", C: M391 },
  { code: "M392", name: "Typewriter with delete and word cycle", how: "Types a word at ~50 ms/char, blinks the caret in the pause, deletes at ~30 ms/char and types the next · loops", kind: "play", C: M392 },
  { code: "M393", name: "Typography page transition", how: "A colour panel of giant type fills the frame, then slides away revealing the next page · loops A → B → A", kind: "play", C: M393 },
  { code: "M394", name: "Username slot reel", how: "A slot reel of handles spins vertically, blurs with speed and decelerates to land on the next name · loops", kind: "play", C: M394 },
  { code: "M395", name: "Variable font morph on hover", how: "Hovering the word morphs weight, slant and width letter by letter in a wave · a fake pointer hovers it by itself", kind: "play", C: M395 },
  { code: "M396", name: "Variable-font proximity", how: "Each letter's weight follows its distance to the pointer, so letters near it swell bold · auto pointer sweep", kind: "play", C: M396 },
  { code: "M397", name: "Velocity marquee rows", how: "Three rows of big text run in opposite directions; scroll velocity speeds them up and flips their direction · scrub", kind: "scrub", C: M397 },
];
