"use client";

// Text motions, batch 8 · group 2 (MOTION-MENU M362–M373). Small focused demos for /lab/motion, rebuilt in GSAP / CSS / SVG
// from the idea only. Every demo: plays by itself on screen (or follows the scroll), loops, has a CSS glow loop that never
// stops, and shows a sensible final state in ?static=1 / reduced motion.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, SplitText, prefersReducedMotion } from "@/lib/gsap";
import { useScrub } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = { sg: "Space Grotesk Variable", fr: "Fraunces Variable", is: "Instrument Serif", sy: "Syne Variable", mr: "Manrope Variable" };
const ACC = "#ffa35c";
const INK = "#eaf5ff";

const CSS = `
.b8g2-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 32% 38%,var(--g1,rgba(255,163,92,.42)),transparent 70%),radial-gradient(34% 40% at 70% 66%,var(--g2,rgba(79,141,255,.22)),transparent 70%);animation:b8g2-drift 6s linear infinite alternate;will-change:transform}
.b8g2-top{mix-blend-mode:screen;opacity:.45;z-index:5}
@keyframes b8g2-drift{0%{transform:translate3d(-7%,-5%,0) scale(1)}100%{transform:translate3d(7%,6%,0) scale(1.15)}}
.m363-star{position:absolute;left:-260px;top:50%;width:260px;height:3px;margin-top:-1.5px;pointer-events:none;background:linear-gradient(90deg,transparent,rgba(255,214,160,.25) 45%,rgba(255,240,220,.95));border-radius:3px;opacity:0}
.m363-star::after{content:"";position:absolute;right:-7px;top:50%;width:14px;height:14px;margin-top:-7px;border-radius:50%;background:#fff;box-shadow:0 0 18px 6px rgba(255,214,160,.85),0 0 46px 14px rgba(255,163,92,.45)}
.m368-col,.m369-col{position:relative;display:inline-block;clip-path:inset(0 -60% 0 -60%)}
.m368-strip,.m369-strip{position:absolute;left:0;right:0;top:0;display:flex;flex-direction:column;align-items:center}
.m371-t{position:relative;display:inline-block;height:1.42em;width:1em;perspective:420px}
.m371-t::after{content:"";position:absolute;left:0;right:0;top:50%;height:2px;margin-top:-1px;background:#05080f;z-index:4}
.m371-h{position:absolute;left:0;right:0;height:50%;overflow:hidden;background:linear-gradient(180deg,#18213a,#111829)}
.m371-top{top:0;border-radius:7px 7px 0 0;transform-origin:50% 100%}
.m371-bot{bottom:0;border-radius:0 0 7px 7px;transform-origin:50% 0%;background:linear-gradient(180deg,#0f1625,#141c30)}
.m371-ft,.m371-fb{z-index:3;backface-visibility:hidden}
.m371-fb{transform:rotateX(90deg)}
.m371-g{position:absolute;left:0;right:0;height:200%;display:grid;place-items:center;line-height:1}
.m371-top .m371-g{top:0}
.m371-bot .m371-g{top:-100%}
html.is-static .b8g2-glow{animation:none}
html.is-static {.b8g2-glow{animation:none}}
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
      <style href="b8g2-css" precedence="default">
        {CSS}
      </style>
      <div className="b8g2-glow" style={vars} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
      {top && <div className="b8g2-glow b8g2-top" style={vars} aria-hidden />}
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

/** Small deterministic random (same rhythm every loop and every load, no hydration mismatch). */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Centre of `el` in `root`-relative px. */
function centreIn(el: HTMLElement, root: HTMLElement) {
  const a = el.getBoundingClientRect();
  const r = root.getBoundingClientRect();
  return { x: a.left - r.left + a.width / 2, y: a.top - r.top + a.height / 2 };
}

const Caption = ({ children }: { children: ReactNode }) => (
  <p className="absolute bottom-5 left-6 text-[13px] uppercase tracking-[0.18em] text-white/60">{children}</p>
);

/* ───────────────────────── M362 · Shimmer wave, 3D per-char bulge (play, SplitText) ───────────────────────── */
function M362() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const head = el.querySelector<HTMLElement>(".m362-h")!;
    const split = SplitText.create(head, { type: "chars" });
    onClean(() => split.revert());
    const chars = split.chars as HTMLElement[];
    gsap.set(chars, { transformPerspective: 520, transformOrigin: "50% 60%" });
    // one bulge travels along the word: forward in Z, a touch bigger, turned on Y, lighter — then back
    const tl = gsap.timeline({ repeat: -1 });
    tl.to(
      chars,
      {
        z: 10,
        scale: 1.1,
        rotationY: -12,
        color: "#ffffff",
        textShadow: "0 0 22px rgba(255,214,170,.55)",
        duration: 0.26,
        ease: "sine.inOut",
        stagger: { each: 0.065, yoyo: true, repeat: 1 },
      },
      0,
    );
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,163,92,.4)" g2="rgba(150,120,255,.24)">
      <div className="absolute inset-0 grid place-items-center px-[6%] text-center">
        <div>
          <p className="mb-6 text-[13px] uppercase tracking-[0.24em] text-white/55">Evening collection</p>
          <h3
            className="m362-h text-[clamp(56px,6.2vw,104px)] font-[400] italic leading-none tracking-[-0.015em] text-[#a9b6c8]"
            style={{ fontFamily: F.fr, textShadow: "0 0 0 rgba(255,214,170,0)" }}
          >
            Moonlit Silk
          </h3>
          <p className="mt-7 text-[14px] tracking-[0.06em] text-white/65">Mulberry silk slip · ₹6,800</p>
        </div>
      </div>
      <Caption>Shimmer wave · loops</Caption>
    </Stage>
  );
}

/* ───────────────────────── M363 · Shooting-star name reveal (play, SplitText) ───────────────────────── */
function M363() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const line = el.querySelector<HTMLElement>(".m363-line")!;
    const star = el.querySelector<HTMLElement>(".m363-star")!;
    const split = SplitText.create(line.querySelector(".m363-h")!, { type: "chars" });
    onClean(() => split.revert());
    const chars = split.chars as HTMLElement[];
    const W = line.offsetWidth;
    const D = 1.45;
    const x0 = -0.12 * W;
    const x1 = 1.18 * W;
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(chars, { opacity: 0 }, 0);
    tl.fromTo(star, { x: x0, opacity: 0 }, { x: x1, duration: D, ease: "none" }, 0);
    tl.to(star, { opacity: 1, duration: 0.12 }, 0);
    tl.to(star, { opacity: 0, duration: 0.18 }, D - 0.18);
    // each letter lights up just behind the head of the streak, then cools to the normal ink
    chars.forEach((c) => {
      const cx = c.offsetLeft + c.offsetWidth / 2;
      const t = ((cx - x0) / (x1 - x0)) * D + 0.03;
      tl.fromTo(
        c,
        { opacity: 0, y: 5, color: "#ffffff", textShadow: "0 0 20px rgba(255,214,160,.95)" },
        { opacity: 1, y: 0, duration: 0.12, ease: "power1.out" },
        t,
      );
      tl.to(c, { color: INK, textShadow: "0 0 0px rgba(255,214,160,0)", duration: 0.55, ease: "sine.out" }, t + 0.12);
    });
    tl.to(chars, { opacity: 0, duration: 0.28, stagger: 0.012, ease: "power1.in" }, D + 0.35);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,190,120,.38)" g2="rgba(79,141,255,.26)">
      <div className="absolute inset-0 grid place-items-center px-[6%] text-center">
        <div>
          <p className="mb-6 text-[13px] uppercase tracking-[0.24em] text-white/55">Atelier founder</p>
          <div className="m363-line relative inline-block">
            <h3 className="m363-h relative text-[clamp(56px,6vw,100px)] font-[500] leading-none tracking-[-0.02em]" style={{ fontFamily: F.sg }}>
              Mira Solanki
            </h3>
            <span className="m363-star" aria-hidden />
          </div>
          <p className="mt-7 text-[14px] tracking-[0.06em] text-white/65">Hand-set jewellery since 2011</p>
        </div>
      </div>
      <Caption>Shooting-star reveal · loops</Caption>
    </Stage>
  );
}

/* ───────────────────────── M364 · Short slide-right phrase (play, SplitText) ───────────────────────── */
function M364() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const block = el.querySelector<HTMLElement>(".m364-b")!;
    const split = SplitText.create(block.querySelector(".m364-h")!, { type: "words" });
    onClean(() => split.revert());
    const words = split.words as HTMLElement[];
    const tl = gsap.timeline({ repeat: -1 });
    // the block glides as ONE piece; the words only fade in, in order (no per-word movement)
    tl.fromTo(block, { x: -200, opacity: 1 }, { x: 0, duration: 1.25, ease: "power2.out" }, 0);
    tl.fromTo(words, { opacity: 0 }, { opacity: 1, duration: 0.38, ease: "none", stagger: 0.16 }, 0.05);
    tl.to(block, { opacity: 0, x: 36, duration: 0.36, ease: "power1.in" }, 1.55);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,163,92,.4)" g2="rgba(90,200,170,.2)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="m364-b">
          <p className="mb-5 text-[13px] uppercase tracking-[0.24em] text-white/55">Hearth bakery · Daily</p>
          <h3 className="m364-h max-w-[16ch] text-[clamp(52px,5.4vw,92px)] font-[600] leading-[1.02] tracking-[-0.025em]" style={{ fontFamily: F.mr }}>
            Fresh sourdough, every single morning.
          </h3>
          <p className="mt-6 text-[14px] tracking-[0.06em] text-white/65">Country loaf · 800 g · ₹320</p>
        </div>
      </div>
      <Caption>Short slide-right · loops</Caption>
    </Stage>
  );
}

/* ───────────────────────── M365 · Shutter slice headline (play, gsap clip strips) ───────────────────────── */
const M365_N = 7;
const M365_WORD = "NIGHTFALL";
function M365() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const strips = gsap.utils.toArray<HTMLElement>(".m365-s", el);
    const sub = el.querySelector<HTMLElement>(".m365-sub")!;
    const rand = rng(365);
    const offIn = strips.map((_, i) => (i % 2 ? 1 : -1) * (90 + rand() * 170));
    const offOut = strips.map((_, i) => (i % 2 ? -1 : 1) * (70 + rand() * 140));
    const tl = gsap.timeline({ repeat: -1 });
    tl.fromTo(strips, { x: (i: number) => offIn[i], opacity: 0 }, { x: 0, opacity: 1, duration: 0.7, ease: "power2.out", stagger: 0.07 }, 0);
    tl.fromTo(sub, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: "power1.out" }, 0.55);
    tl.to(strips, { x: (i: number) => offOut[i], opacity: 0, duration: 0.42, ease: "power2.in", stagger: 0.045 }, 1.5);
    tl.to(sub, { opacity: 0, duration: 0.3 }, 1.6);
    return tl;
  });
  const cls = "text-[clamp(60px,6.2vw,104px)] font-[800] uppercase leading-[1] tracking-[-0.01em]";
  return (
    <Stage r={root} g1="rgba(255,120,92,.4)" g2="rgba(79,141,255,.26)">
      <div className="absolute inset-0 grid place-items-center px-[6%] text-center">
        <div>
          <div className="relative inline-block" style={{ fontFamily: F.sy }}>
            <h3 className={`${cls} invisible`}>{M365_WORD}</h3>
            {Array.from({ length: M365_N }, (_, i) => (
              <span
                key={i}
                className={`m365-s absolute inset-0 ${cls}`}
                style={{ clipPath: `inset(${((i * 100) / M365_N).toFixed(3)}% 0 ${(100 - ((i + 1) * 100) / M365_N).toFixed(3)}% 0)` }}
                aria-hidden
              >
                {M365_WORD}
              </span>
            ))}
          </div>
          <p className="m365-sub mt-6 text-[14px] uppercase tracking-[0.22em] text-white/65">After-dark fragrance · 50 ml · ₹4,450</p>
        </div>
      </div>
      <Caption>Shutter slices · loops</Caption>
    </Stage>
  );
}

/* ───────────────────────── M366 · Skewed blurry words (scrub) ───────────────────────── */
const M366_TEXT = "Hand-loomed in small batches, dyed with indigo and turmeric, finished by four families in one quiet village.";
function M366() {
  const root = useRef<HTMLDivElement>(null);
  const para = useRef<HTMLParagraphElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  useScrub(
    root,
    (p) => {
      const words = para.current?.querySelectorAll<HTMLElement>(".m366-w");
      if (!words) return;
      const N = words.length;
      const w = 0.2;
      // linear over the whole panel: word i straightens + sharpens inside its own window; the last one ends at p = 1
      words.forEach((el, i) => {
        const s = (i / (N - 1)) * (1 - w);
        const l = gsap.utils.clamp(0, 1, (p - s) / w);
        el.style.transform = `skewX(${(-20 * (1 - l)).toFixed(2)}deg)`;
        el.style.filter = l >= 1 ? "none" : `blur(${(8 * (1 - l)).toFixed(2)}px)`;
        el.style.opacity = (0.28 + 0.72 * l).toFixed(3);
      });
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    },
    { finalValue: 1 },
  );
  const words = M366_TEXT.split(" ");
  return (
    <Stage r={root} g1="rgba(90,130,255,.36)" g2="rgba(255,190,90,.26)">
      <div className="absolute inset-0 grid place-items-center px-[8%]">
        <p ref={para} className="max-w-[24ch] text-[clamp(40px,4vw,66px)] font-[400] leading-[1.12] tracking-[-0.01em]" style={{ fontFamily: F.is }}>
          {words.map((wd, i) => (
            <span key={i} className={`m366-w inline-block will-change-transform ${i < words.length - 1 ? "mr-[0.26em]" : ""}`} style={{ transformOrigin: "0% 100%" }}>
              {wd}
            </span>
          ))}
        </p>
      </div>
      <div className="absolute bottom-5 left-6 flex items-center gap-4 text-[13px] uppercase tracking-[0.18em] text-white/65">
        <span>Indigo dhurrie · 5 × 8 ft · ₹18,900</span>
        <span className="relative block h-px w-[160px] bg-white/15">
          <span ref={bar} className="absolute inset-0 origin-left bg-[#ffa35c]" style={{ transform: "scaleX(1)" }} />
        </span>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M367 · Slide + blur sweep entrance (play, gsap) ───────────────────────── */
function M367() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const head = el.querySelector<HTMLElement>(".m367-h")!;
    const sub = el.querySelector<HTMLElement>(".m367-sub")!;
    const W = el.clientWidth;
    const tl = gsap.timeline({ repeat: -1 });
    // slides in from the left toward centre while the blur dissolves from heavy to none
    tl.fromTo(head, { x: -0.3 * W, filter: "blur(26px)", opacity: 0 }, { x: 0, filter: "blur(0px)", opacity: 1, duration: 1.15, ease: "power2.out" }, 0);
    tl.fromTo(sub, { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.5, ease: "power1.out" }, 0.6);
    tl.to([head, sub], { opacity: 0, x: 0.06 * W, filter: "blur(12px)", duration: 0.4, ease: "power1.in" }, 1.4);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(120,200,255,.34)" g2="rgba(255,163,92,.28)">
      <div className="absolute inset-0 grid place-items-center px-[6%] text-center">
        <div>
          <h3 className="m367-h text-[clamp(56px,6vw,100px)] font-[600] leading-none tracking-[-0.03em]" style={{ fontFamily: F.sg }}>
            Glide into summer.
          </h3>
          <p className="m367-sub mt-7 text-[14px] uppercase tracking-[0.22em] text-white/65">Featherweight runner · ₹7,299</p>
        </div>
      </div>
      <Caption>Slide + blur sweep · loops</Caption>
    </Stage>
  );
}

/* ───────────────────────── M368 · Slot-machine first letter menu (play, auto click) ───────────────────────── */
const M368_ITEMS = ["Shop", "Rituals", "Journal", "Stores", "Gift cards"];
const M368_K = 8;
const M368_ABC = "ABCDEFGHIJKLMNOPRSTUVWZ";
const m368Strips = (() => {
  const rand = rng(368);
  return M368_ITEMS.map((it) => [...Array.from({ length: M368_K - 1 }, () => M368_ABC[Math.floor(rand() * M368_ABC.length)]), it[0]]);
})();
function M368() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const btn = el.querySelector<HTMLElement>(".m368-btn")!;
    const label = el.querySelector<HTMLElement>(".m368-label")!;
    const dot = el.querySelector<HTMLElement>(".m368-dot")!;
    const rows = gsap.utils.toArray<HTMLElement>(".m368-row", el);
    const cols = rows.map((r) => r.querySelector<HTMLElement>(".m368-col")!);
    const strips = rows.map((r) => r.querySelector<HTMLElement>(".m368-strip")!);
    const rests = rows.map((r) => gsap.utils.toArray<HTMLElement>(".m368-c", r));
    const allRest = rests.flat();
    const b = centreIn(btn, el);
    const h1 = centreIn(rows[1], el);
    const h3 = centreIn(rows[3], el);
    const endY = -((M368_K - 1) / M368_K) * 100;
    gsap.set(dot, { x: b.x, y: b.y, opacity: 1 });
    gsap.set(strips, { y: 0 });
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(cols, { opacity: 0 }, 0).set(strips, { yPercent: 0 }, 0).set(allRest, { opacity: 0, x: -22 }, 0);
    // click: open
    tl.to(dot, { scale: 0.65, duration: 0.1, yoyo: true, repeat: 1, ease: "power1.inOut" }, 0.05);
    tl.to(btn, { scale: 0.94, duration: 0.1, yoyo: true, repeat: 1, ease: "power1.inOut" }, 0.05);
    tl.call(() => (label.textContent = "Close"), [], 0.15);
    // each first-letter column spins like a slot reel and stops on its item's first letter, then the rest slides in
    rows.forEach((_, i) => {
      const t = 0.22 + i * 0.09;
      const d = 0.78 + i * 0.07;
      tl.set(cols[i], { opacity: 1 }, t);
      tl.to(strips[i], { yPercent: endY, duration: d, ease: "power2.out" }, t);
      tl.to(rests[i], { opacity: 1, x: 0, duration: 0.34, ease: "power2.out", stagger: 0.028 }, t + d - 0.22);
    });
    // the pointer drifts over the open menu, then clicks Close
    tl.to(dot, { x: h1.x - 40, y: h1.y, duration: 0.6, ease: "sine.inOut" }, 0.45);
    tl.to(dot, { x: h3.x + 20, y: h3.y, duration: 0.55, ease: "sine.inOut" }, 1.05);
    tl.to(dot, { x: b.x, y: b.y, duration: 0.5, ease: "sine.inOut" }, 1.75);
    tl.to(dot, { scale: 0.65, duration: 0.1, yoyo: true, repeat: 1, ease: "power1.inOut" }, 2.25);
    tl.to(btn, { scale: 0.94, duration: 0.1, yoyo: true, repeat: 1, ease: "power1.inOut" }, 2.25);
    tl.call(() => (label.textContent = "Menu"), [], 2.35);
    tl.to(allRest, { opacity: 0, x: 14, duration: 0.24, ease: "power1.in", stagger: 0.006 }, 2.3);
    tl.to(cols, { opacity: 0, duration: 0.22, stagger: 0.03 }, 2.38);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,163,92,.46)" g2="rgba(79,141,255,.24)">
      <div className="absolute left-[7%] right-[7%] top-[7%] flex items-center justify-between text-[14px] uppercase tracking-[0.2em]">
        <span className="font-[600] text-white/85" style={{ fontFamily: F.sy }}>
          Kesar &amp; Clay
        </span>
        <button type="button" className="m368-btn rounded-full border border-white/25 px-5 py-2.5 text-white/90">
          <span className="m368-label">Close</span>
        </button>
      </div>
      <nav className="absolute left-[7%] top-[22%]" style={{ fontFamily: F.fr }}>
        {M368_ITEMS.map((it, i) => (
          <div key={it} className="m368-row flex items-baseline text-[clamp(42px,4.4vw,74px)] font-[400] leading-[1.1] tracking-[-0.01em]">
            <span className="m368-col h-[1.1em] w-[0.95em] text-[#ffa35c]">
              <span className="invisible block h-[1.1em] text-center leading-[1.1em]">{it[0]}</span>
              <span className="m368-strip" style={{ transform: `translateY(${-((M368_K - 1) / M368_K) * 100}%)` }} aria-hidden>
                {m368Strips[i].map((ch, k) => (
                  <span key={k} className="block h-[1.1em] leading-[1.1em]">
                    {ch}
                  </span>
                ))}
              </span>
            </span>
            {it
              .slice(1)
              .split("")
              .map((c, k) => (
                <span key={k} className="m368-c inline-block">
                  {c === " " ? " " : c}
                </span>
              ))}
          </div>
        ))}
      </nav>
      <span className="m368-dot pointer-events-none absolute left-0 top-0 -ml-[9px] -mt-[9px] h-[18px] w-[18px] rounded-full border-2 border-white bg-white/30 opacity-0" aria-hidden />
      <p className="absolute bottom-5 right-6 text-[13px] uppercase tracking-[0.18em] text-white/55">Handmade ceramics · from ₹890</p>
      <Caption>Slot first letters · auto click</Caption>
    </Stage>
  );
}

/* ───────────────────────── M369 · Slot-strip shuffle (play, gsap) ───────────────────────── */
const M369_WORD = "SAFFRON";
const M369_K = 10;
const M369_ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const m369Strips = (() => {
  const rand = rng(369);
  return M369_WORD.split("").map((ch) => [...Array.from({ length: M369_K - 1 }, () => M369_ABC[Math.floor(rand() * 26)]), ch]);
})();
function M369() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const strips = gsap.utils.toArray<HTMLElement>(".m369-strip", el);
    const endY = -((M369_K - 1) / M369_K) * 100;
    const rand = rng(1369);
    const randomDelay = strips.map(() => rand() * 0.38);
    gsap.set(strips, { y: 0 });
    const tl = gsap.timeline({ repeat: -1 });
    // cycle A: random delays · cycle B: even / odd delays — each strip slides a few letters and lands on the real one,
    // its colour fading from the accent to the ink
    const cycle = (t: number, delays: number[]) => {
      tl.set(strips, { yPercent: 0, color: ACC }, t);
      strips.forEach((s, i) => {
        tl.to(s, { yPercent: endY, duration: 0.85, ease: "power2.out" }, t + delays[i]);
        tl.to(s, { color: INK, duration: 0.75, ease: "none" }, t + delays[i] + 0.1);
      });
    };
    cycle(0, randomDelay);
    cycle(1.45, strips.map((_, i) => (i % 2) * 0.26));
    tl.to({}, { duration: 0.01 }, 2.74);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,163,92,.44)" g2="rgba(255,90,120,.22)">
      <div className="absolute inset-0 grid place-items-center px-[6%] text-center">
        <div>
          <p className="mb-6 text-[13px] uppercase tracking-[0.24em] text-white/55">Spice house · Grade A1</p>
          <h3 className="text-[clamp(60px,6.4vw,108px)] font-[800] uppercase leading-none tracking-[0.01em]" style={{ fontFamily: F.sy }} aria-label={M369_WORD}>
            {m369Strips.map((strip, i) => (
              <span key={i} className="m369-col h-[1em]" aria-hidden>
                <span className="invisible block h-[1em] leading-[1em]">{M369_WORD[i]}</span>
                <span className="m369-strip" style={{ transform: `translateY(${-((M369_K - 1) / M369_K) * 100}%)` }}>
                  {strip.map((ch, k) => (
                    <span key={k} className="block h-[1em] leading-[1em]">
                      {ch}
                    </span>
                  ))}
                </span>
              </span>
            ))}
          </h3>
          <p className="mt-7 text-[14px] tracking-[0.06em] text-white/65">Kashmiri saffron · 2 g tin · ₹1,150</p>
        </div>
      </div>
      <Caption>Slot-strip shuffle · loops</Caption>
    </Stage>
  );
}

/* ───────────────────────── M370 · Split-away words (play, SplitText) ───────────────────────── */
function M370() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const a = el.querySelector<HTMLElement>(".m370-a")!;
    const b = el.querySelector<HTMLElement>(".m370-b")!;
    const mid = el.querySelector<HTMLElement>(".m370-mid")!;
    const sa = SplitText.create(a, { type: "words" });
    const sb = SplitText.create(b, { type: "words" });
    onClean(() => {
      sa.revert();
      sb.revert();
    });
    // gap between the two halves when apart; together = each half moves half the gap toward the middle
    const gap = b.offsetTop - (a.offsetTop + a.offsetHeight);
    const d = gap / 2 + 4;
    const tl = gsap.timeline({ repeat: -1, yoyo: true, repeatDelay: 0.1 });
    tl.fromTo(sa.words, { y: d }, { y: 0, duration: 1.05, ease: "sine.inOut", stagger: 0.05 }, 0);
    tl.fromTo(sb.words, { y: -d }, { y: 0, duration: 1.05, ease: "sine.inOut", stagger: 0.05 }, 0);
    tl.fromTo(mid, { opacity: 0, scaleX: 0.6 }, { opacity: 1, scaleX: 1, duration: 0.7, ease: "sine.inOut" }, 0.45);
    return tl;
  });
  const cls = "text-[clamp(54px,5.6vw,96px)] font-[500] leading-[1] tracking-[-0.025em]";
  return (
    <Stage r={root} g1="rgba(255,163,92,.4)" g2="rgba(120,220,190,.22)">
      <div className="absolute inset-0 grid place-items-center px-[6%] text-center" style={{ fontFamily: F.sg }}>
        <div className="flex flex-col items-center">
          <h3 className={`m370-a ${cls}`}>Woven slow,</h3>
          <div className="m370-mid my-[clamp(28px,4.5vh,48px)] flex items-center gap-4 text-[14px] uppercase tracking-[0.22em] text-white/70">
            <span className="h-px w-12 bg-[#ffa35c]" />
            Handloom cotton throw · ₹3,600
            <span className="h-px w-12 bg-[#ffa35c]" />
          </div>
          <h3 className={`m370-b ${cls} italic text-[#ffa35c]`} style={{ fontFamily: F.fr }}>
            worn for years.
          </h3>
        </div>
      </div>
      <Caption>Split-away halves · loops</Caption>
    </Stage>
  );
}

/* ───────────────────────── M371 · Split-flap board (play, gsap 3D flaps) ───────────────────────── */
const M371_WORDS = ["NEW DROP", "LINEN 24", "MONSOON ", "SALE 30%"];
const M371_GLYPHS = "ABCDEFGHIJKLMNOPRSTUVWXYZ0123456789";
function M371() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const tiles = gsap.utils.toArray<HTMLElement>(".m371-t", el).map((t) => {
      const g = (s: string) => t.querySelector<HTMLElement>(`${s} .m371-g`)!;
      return {
        top: g(".m371-top:not(.m371-ft)"),
        bot: g(".m371-bot:not(.m371-fb)"),
        ftEl: t.querySelector<HTMLElement>(".m371-ft")!,
        fbEl: t.querySelector<HTMLElement>(".m371-fb")!,
        ft: g(".m371-ft"),
        fb: g(".m371-fb"),
      };
    });
    gsap.set(tiles.map((t) => t.fbEl), { rotationX: 90 });
    gsap.set(tiles.map((t) => t.ftEl), { rotationX: 0 });
    const rand = rng(371);
    const tl = gsap.timeline({ repeat: -1 });
    const FLIP = 0.06;
    // one flip a → b: the top flap (a) folds down to 90°, then the bottom flap (b) falls from 90° to flat
    const flip = (tile: (typeof tiles)[number], a: string, b: string, t: number) => {
      tl.call(
        () => {
          tile.top.textContent = b;
          tile.ft.textContent = a;
          tile.fb.textContent = b;
          tile.bot.textContent = a;
        },
        [],
        t,
      );
      tl.fromTo(tile.ftEl, { rotationX: 0 }, { rotationX: -90, duration: FLIP / 2, ease: "none", immediateRender: false }, t);
      tl.fromTo(tile.fbEl, { rotationX: 90 }, { rotationX: 0, duration: FLIP / 2, ease: "none", immediateRender: false }, t + FLIP / 2);
      tl.call(() => (tile.bot.textContent = b), [], t + FLIP);
    };
    let t = 0.05;
    M371_WORDS.forEach((from, w) => {
      const to = M371_WORDS[(w + 1) % M371_WORDS.length];
      let end = t;
      tiles.forEach((tile, i) => {
        const n = 3 + Math.floor(rand() * 6); // 3–8 flips
        let cur = from[i];
        let tt = t + i * 0.055;
        for (let k = 0; k < n; k++) {
          const next = k === n - 1 ? to[i] : M371_GLYPHS[Math.floor(rand() * M371_GLYPHS.length)];
          flip(tile, cur === " " ? "" : cur, next === " " ? "" : next, tt);
          cur = next;
          tt += FLIP;
        }
        end = Math.max(end, tt);
      });
      t = end + 0.24;
    });
    tl.to({}, { duration: 0.01 }, t - 0.01);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,163,92,.46)" g2="rgba(79,141,255,.24)" top>
      <div className="absolute inset-0 grid place-items-center px-[6%] text-center">
        <div>
          <p className="mb-7 text-[13px] uppercase tracking-[0.24em] text-white/55">Studio board · Platform 2</p>
          <div className="flex gap-[0.12em] text-[clamp(52px,5.2vw,88px)] font-[600] text-[#fff3e4]" style={{ fontFamily: F.sg }} aria-label={M371_WORDS[0]}>
            {M371_WORDS[0].split("").map((c, i) => {
              const ch = c === " " ? "" : c;
              return (
                <span key={i} className="m371-t" aria-hidden>
                  <span className="m371-h m371-top">
                    <span className="m371-g">{ch}</span>
                  </span>
                  <span className="m371-h m371-bot">
                    <span className="m371-g">{ch}</span>
                  </span>
                  <span className="m371-h m371-top m371-ft">
                    <span className="m371-g">{ch}</span>
                  </span>
                  <span className="m371-h m371-bot m371-fb">
                    <span className="m371-g">{ch}</span>
                  </span>
                </span>
              );
            })}
          </div>
          <p className="mt-7 text-[14px] tracking-[0.06em] text-white/65">Linen co-ord set · ₹5,490</p>
        </div>
      </div>
      <Caption>Split-flap board · loops</Caption>
    </Stage>
  );
}

/* ───────────────────────── M372 · Splitting text (play, SplitText) ───────────────────────── */
function M372() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const head = el.querySelector<HTMLElement>(".m372-h")!;
    const split = SplitText.create(head, { type: "chars" });
    onClean(() => split.revert());
    const chars = split.chars as HTMLElement[];
    const rand = rng(372);
    const r = (a: number) => (rand() * 2 - 1) * a;
    const inFrom = chars.map(() => ({ x: r(320), y: r(200), rot: r(80) }));
    const outTo = chars.map(() => ({ x: r(300), y: r(190), rot: r(70) }));
    const tl = gsap.timeline({ repeat: -1 });
    // characters fly in from scattered offsets around the block and settle into the word
    tl.fromTo(
      chars,
      { x: (i: number) => inFrom[i].x, y: (i: number) => inFrom[i].y, rotation: (i: number) => inFrom[i].rot, opacity: 0, scale: 0.6 },
      { x: 0, y: 0, rotation: 0, opacity: 1, scale: 1, duration: 0.9, ease: "power2.out", stagger: { each: 0.04, from: "random" } },
      0,
    );
    tl.to(
      chars,
      { x: (i: number) => outTo[i].x, y: (i: number) => outTo[i].y, rotation: (i: number) => outTo[i].rot, opacity: 0, scale: 0.7, duration: 0.45, ease: "power2.in", stagger: { each: 0.018, from: "random" } },
      1.65,
    );
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(200,120,255,.36)" g2="rgba(255,163,92,.28)">
      <div className="absolute inset-0 grid place-items-center px-[6%] text-center">
        <div>
          <h3 className="m372-h text-[clamp(60px,6.4vw,108px)] font-[400] italic leading-none tracking-[-0.02em]" style={{ fontFamily: F.fr }}>
            Velvet hour
          </h3>
          <p className="mt-7 text-[14px] uppercase tracking-[0.22em] text-white/65">Plum velvet lounge chair · ₹42,000</p>
        </div>
      </div>
      <Caption>Splitting text · loops</Caption>
    </Stage>
  );
}

/* ───────────────────────── M373 · Spring path drawing (play, svg + DrawSVG) ───────────────────────── */
// each path is drawn a little LONGER than it needs to be and settles below 100 %, so the back-ease overshoot is visible
const M373_CIRCLE = "M44 34 C110 4 262 10 286 52 C306 92 204 116 132 112 C52 108 8 86 18 58 C28 28 92 14 162 14 C204 14 236 20 256 30";
const M373_CROSS_A = "M6 86 L194 16";
const M373_CROSS_B = "M8 16 L192 86";
const M373_RECT = "M24 8 H176 Q194 8 194 26 V74 Q194 92 176 92 H24 Q6 92 6 74 V26 Q6 8 24 8 H84";
function M373() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const circle = el.querySelector<SVGPathElement>(".m373-circle")!;
    const cross = gsap.utils.toArray<SVGPathElement>(".m373-cross", el);
    const rect = el.querySelector<SVGPathElement>(".m373-rect")!;
    const all = [circle, ...cross, rect];
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(all, { drawSVG: "0% 0%", opacity: 1 }, 0);
    tl.to(circle, { drawSVG: "0% 90%", duration: 0.72, ease: "back.out(2.6)" }, 0.05);
    tl.to(cross[0], { drawSVG: "0% 88%", duration: 0.5, ease: "back.out(2.8)" }, 0.45);
    tl.to(cross[1], { drawSVG: "0% 88%", duration: 0.5, ease: "back.out(2.8)" }, 0.68);
    tl.to(rect, { drawSVG: "0% 93%", duration: 0.75, ease: "back.out(2.2)" }, 0.9);
    tl.to(all, { drawSVG: "100% 100%", duration: 0.36, ease: "power1.in", stagger: 0.05 }, 1.88);
    return tl;
  });
  const stroke = { fill: "none", stroke: ACC, strokeWidth: 3.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <Stage r={root} g1="rgba(255,163,92,.42)" g2="rgba(79,141,255,.24)">
      <div className="absolute inset-0 grid place-items-center px-[6%] text-center" style={{ fontFamily: F.sg }}>
        <div className="text-[clamp(48px,5vw,84px)] font-[500] leading-[1.25] tracking-[-0.02em]">
          <p>
            <span className="mr-[0.28em]">The</span>
            <span className="relative mr-[0.28em] inline-block">
              linen
              <svg className="pointer-events-none absolute left-[-18%] top-[-22%] h-[144%] w-[136%] overflow-visible" viewBox="0 0 300 120" preserveAspectRatio="none" aria-hidden>
                <path className="m373-circle" d={M373_CIRCLE} {...stroke} />
              </svg>
            </span>
            <span>shirt</span>
          </p>
          <p className="mt-[0.2em]">
            <span className="relative mr-[0.5em] inline-block text-white/55">
              ₹2,400
              <svg className="pointer-events-none absolute left-[-8%] top-[8%] h-[84%] w-[116%] overflow-visible" viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden>
                <path className="m373-cross" d={M373_CROSS_A} {...stroke} />
                <path className="m373-cross" d={M373_CROSS_B} {...stroke} />
              </svg>
            </span>
            <span className="relative inline-block text-[#ffd2ad]">
              ₹1,890
              <svg className="pointer-events-none absolute left-[-12%] top-[-6%] h-[112%] w-[124%] overflow-visible" viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden>
                <path className="m373-rect" d={M373_RECT} {...stroke} />
              </svg>
            </span>
          </p>
        </div>
      </div>
      <Caption>Spring path drawing · loops</Caption>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M362", name: "Shimmer wave (3D per-char bulge)", how: "A bulge travels along the word: each letter in turn pushes forward in Z, scales to 1.1, turns slightly on Y and lightens, then settles · loops", kind: "play", C: M362 },
  { code: "M363", name: "Shooting-star name reveal", how: "A bright streak crosses the line and each letter lights up just behind its head, then cools to the ink colour · loops", kind: "play", C: M363 },
  { code: "M364", name: "Short slide-right phrase", how: "The whole phrase glides in from the left as one block while its words appear in order by opacity only · loops", kind: "play", C: M364 },
  { code: "M365", name: "Shutter slice headline", how: "A big headline cut into 7 clipped strips shutters in one after another from alternating x offsets and settles into one crisp line · loops", kind: "play", C: M365 },
  { code: "M366", name: "Skewed blurry words", how: "Words start skewed (-20°) and blurred (8px) and straighten and sharpen one by one as you scroll · scrubbed", kind: "scrub", C: M366 },
  { code: "M367", name: "Slide + blur sweep entrance", how: "A headline slides in from the left toward centre while a heavy blur dissolves to sharp · loops", kind: "play", C: M367 },
  { code: "M368", name: "Slot-machine first letter menu", how: "Opening the menu, each item's first-letter column spins like a slot reel and stops on its letter, then the rest of the word slides in · auto click", kind: "play", C: M368 },
  { code: "M369", name: "Slot-strip shuffle", how: "Every letter is a strip of random letters that rolls like a slot reel and lands on the real one (random, then even/odd delays), colour fading from accent to ink · loops", kind: "play", C: M369 },
  { code: "M370", name: "Split-away words", how: "Two halves of a phrase start pressed together and separate vertically, one up and one down, opening a product line between them · loops", kind: "play", C: M370 },
  { code: "M371", name: "Split-flap board", how: "Each character is a split-flap tile that flips through 3–8 random glyphs with a 3D half-fold at ~60 ms a flip, left to right, landing on the next word · loops", kind: "play", C: M371 },
  { code: "M372", name: "Splitting text", how: "Characters fly in from scattered offsets and rotations around the block and settle into the word in random order · loops", kind: "play", C: M372 },
  { code: "M373", name: "Spring path drawing", how: "A circle, a cross and a rounded box draw around words with DrawSVG and a springy back-ease overshoot that settles · loops", kind: "play", C: M373 },
];
