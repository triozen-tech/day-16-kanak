"use client";

// Text motions, batch 7 · group 2 (MOTION-MENU M302–M313). Small focused demos for /lab/motion, rebuilt in GSAP / CSS from the idea only.
// Every demo: plays by itself on screen (or follows the scroll), loops, has a CSS glow loop that never stops,
// and shows a sensible final state in ?static=1 / reduced motion.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, SplitText, prefersReducedMotion } from "@/lib/gsap";
import { useScrub } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = { sg: "Space Grotesk Variable", fr: "Fraunces Variable", is: "Instrument Serif", sy: "Syne Variable", mr: "Manrope Variable" };
const ACC = "#ff9a5c";
const INK = "#eaf5ff";

const CSS = `
.b7g2-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 32% 38%,var(--g1,rgba(255,154,92,.42)),transparent 70%),radial-gradient(34% 40% at 70% 66%,var(--g2,rgba(79,141,255,.22)),transparent 70%);animation:b7g2-drift 6s linear infinite alternate;will-change:transform}
@keyframes b7g2-drift{0%{transform:translate3d(-7%,-5%,0) scale(1)}100%{transform:translate3d(7%,6%,0) scale(1.15)}}
.m302-cell{-webkit-mask-image:linear-gradient(transparent,#000 16%,#000 84%,transparent);mask-image:linear-gradient(transparent,#000 16%,#000 84%,transparent)}
.m309-c{background:linear-gradient(#162036 50%,#101828 50%);padding:0 .07em;margin:0 .025em;border-radius:.07em;backface-visibility:hidden;-webkit-backface-visibility:hidden;box-shadow:inset 0 -1px 0 rgba(255,255,255,.06)}
.m309-tick{animation:m309-blink 1.6s linear infinite alternate}
@keyframes m309-blink{0%{opacity:.25}100%{opacity:1}}
html.is-static .b7g2-glow,html.is-static .m309-tick{animation:none}
html.is-static {.b7g2-glow,.m309-tick{animation:none}}
`;

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0f1c] text-[#eaf5ff] ${className}`}>
      <style href="b7g2-css" precedence="default">
        {CSS}
      </style>
      <div className="b7g2-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

type Clean = (fn: () => void) => void;

/**
 * "play" helper: waits for fonts, builds the looping animation inside a gsap.context, plays it only while the demo is
 * on screen, and reverts everything on unmount. Nothing runs with prefersReducedMotion() (markup = final state).
 */
function usePlay(ref: RefObject<HTMLElement | null>, build: (root: HTMLElement, onClean: Clean) => gsap.core.Animation | void) {
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

/**
 * "scrub" helper: after fonts load, `build` returns an apply(progress) function (usually a paused timeline's progress);
 * useScrub feeds it the linear progress of the whole panel. Reduced motion: nothing is built (markup = final state).
 */
function useScrubApply(ref: RefObject<HTMLElement | null>, build: (root: HTMLElement, onClean: Clean) => (p: number) => void) {
  const b = useRef(build);
  b.current = build;
  const apply = useRef<((p: number) => void) | null>(null);
  const last = useRef(0);
  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    let dead = false;
    const cleans: (() => void)[] = [];
    const ctx = gsap.context(() => {}, root);
    document.fonts.ready.then(() => {
      if (dead) return;
      ctx.add(() => {
        apply.current = b.current(root, (fn) => cleans.push(fn));
      });
      apply.current?.(last.current);
    });
    return () => {
      dead = true;
      apply.current = null;
      ctx.revert();
      cleans.forEach((f) => f());
    };
  }, [ref]);
  useScrub(
    ref,
    (p) => {
      last.current = p;
      apply.current?.(p);
    },
    { finalValue: 0.5 },
  );
}

/** Small deterministic random (same values every run). */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function splitChars(el: HTMLElement, onClean: Clean, charsClass?: string) {
  const split = SplitText.create(el, { type: "words,chars", charsClass });
  onClean(() => split.revert());
  return { words: split.words as HTMLElement[], chars: split.chars as HTMLElement[] };
}

/**
 * Text swap loop A → B → A for the char-swap demos: the current line's chars leave with `out`, the next line's chars
 * come in from `from` to `to`. Lines share one grid cell (first in normal flow, the others `invisible` in markup).
 */
function swapLoop(
  root: HTMLElement,
  onClean: Clean,
  o: {
    out: gsap.TweenVars;
    from: gsap.TweenVars;
    to: gsap.TweenVars;
    stagger: number;
    gap: number; // when the next line starts, relative to the end of the out stagger (negative = overlap)
    hold: number;
    threeD?: boolean;
  },
) {
  const lines = gsap.utils.toArray<HTMLElement>(".b7g2-line", root);
  const sets = lines.map((l) => {
    const s = splitChars(l, onClean);
    if (o.threeD) gsap.set(s.words, { transformStyle: "preserve-3d" });
    return s.chars;
  });
  const tl = gsap.timeline({ repeat: -1, paused: true });
  let t = o.hold;
  lines.forEach((line, i) => {
    const j = (i + 1) % lines.length;
    const outDur = Number(o.out.duration ?? 0.5);
    const inDur = Number(o.to.duration ?? 0.6);
    tl.to(sets[i], { ...o.out, stagger: o.stagger }, t);
    const outEnd = t + outDur + o.stagger * (sets[i].length - 1);
    const tIn = outEnd + o.gap;
    tl.set(lines[j], { visibility: "visible" }, tIn);
    tl.fromTo(sets[j], { ...o.from }, { ...o.to, stagger: o.stagger, immediateRender: false }, tIn);
    tl.set(line, { visibility: "hidden" }, Math.max(outEnd, tIn));
    t = tIn + inDur + o.stagger * (sets[j].length - 1) + o.hold;
  });
  return tl;
}

/** Stacked swap lines: first in flow, the rest absolute-in-grid and hidden (static shows ONE line). */
function SwapLines({ texts, className, style }: { texts: string[]; className: string; style?: CSSProperties }) {
  return (
    <div className="grid place-items-center">
      {texts.map((t, i) => (
        <h3 key={t} className={`b7g2-line [grid-area:1/1] whitespace-nowrap ${i ? "invisible" : ""} ${className}`} style={style}>
          {t}
        </h3>
      ))}
    </div>
  );
}

function Caption({ children }: { children: ReactNode }) {
  return <p className="mt-9 text-center text-[13px] uppercase tracking-[0.22em] text-white/60">{children}</p>;
}

/* ───────────────────────── M302 · Blur digit change (play, gsap) ───────────────────────── */
const M302_VALS = [24990, 24590, 27590, 27560, 21560, 21590];
const m302fmt = (n: number) => {
  const s = String(n);
  return `${s.slice(0, 2)},${s.slice(2)}`;
};
function M302() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const cells = gsap.utils.toArray<HTMLElement>(".m302-cell", el).map((c) => ({
      c,
      a: c.querySelector<HTMLElement>(".m302-a")!,
      b: c.querySelector<HTMLElement>(".m302-b")!,
      cur: c.dataset.ch ?? "",
    }));
    onClean(() => cells.forEach((x) => gsap.killTweensOf([x.c, x.a, x.b])));
    const change = (from: number, to: number) => {
      const s = m302fmt(to);
      const dir = to > from ? 1 : -1; // up when the number grows, down when it falls
      let k = 0;
      cells.forEach((x, i) => {
        if (x.cur === s[i]) return; // unchanged digits stay perfectly still
        const d = k++ * 0.05;
        x.cur = s[i];
        x.b.textContent = s[i];
        gsap.set(x.b, { visibility: "visible" });
        gsap.fromTo(x.b, { yPercent: 100 * dir, filter: "blur(9px)", opacity: 0 }, { yPercent: 0, filter: "blur(0px)", opacity: 1, duration: 0.5, ease: "power2.inOut", delay: d });
        gsap.fromTo(
          x.a,
          { yPercent: 0, filter: "blur(0px)", opacity: 1 },
          {
            yPercent: -100 * dir,
            filter: "blur(9px)",
            opacity: 0,
            duration: 0.5,
            ease: "power2.inOut",
            delay: d,
            onComplete: () => {
              x.a.textContent = s[i];
              gsap.set(x.a, { yPercent: 0, filter: "blur(0px)", opacity: 1 });
              gsap.set(x.b, { visibility: "hidden" });
            },
          },
        );
        gsap.fromTo(x.c, { color: ACC }, { color: INK, duration: 0.8, ease: "sine.out", delay: d });
      });
    };
    const STEP = 0.8;
    const n = M302_VALS.length;
    const tl = gsap.timeline({ repeat: -1, paused: true });
    tl.to({}, { duration: n * STEP }, 0);
    for (let k = 0; k < n; k++) tl.call(() => change(M302_VALS[k], M302_VALS[(k + 1) % n]), [], k * STEP + 0.05);
    return tl;
  });
  const s = m302fmt(M302_VALS[0]);
  return (
    <Stage r={root} g1="rgba(255,154,92,.42)" g2="rgba(79,141,255,.22)">
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="mb-6 text-[13px] uppercase tracking-[0.22em] text-white/60">Cart total · 3 items</p>
          <div className="flex items-start justify-center text-[clamp(96px,11vw,170px)] font-[600] leading-[1.12] tracking-[-0.02em] tabular-nums" style={{ fontFamily: F.sg }}>
            <span className="text-white/55">₹</span>
            {s.split("").map((ch, i) =>
              ch === "," ? (
                <span key={i}>,</span>
              ) : (
                <span key={i} data-ch={ch} className="m302-cell relative inline-block overflow-hidden" style={{ height: "1.12em" }}>
                  <span className="m302-a block">{ch}</span>
                  <span className="m302-b invisible absolute left-0 top-0 block" aria-hidden>
                    {ch}
                  </span>
                </span>
              ),
            )}
          </div>
          <Caption>Walnut lounge chair · free delivery</Caption>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M303 · Blur-out-up exit (play, SplitText) ───────────────────────── */
const M303_LINES = ["First flush is here", "Picked at dawn", "Only 400 tins"];
function M303() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const lines = gsap.utils.toArray<HTMLElement>(".b7g2-line", el);
    const words = lines.map((l) => {
      const s = SplitText.create(l, { type: "words" });
      onClean(() => s.revert());
      return s.words as HTMLElement[];
    });
    const tl = gsap.timeline({ repeat: -1, paused: true });
    let t = 0.25;
    lines.forEach((line, i) => {
      const j = (i + 1) % lines.length;
      // the exit is the star: words leave upward one by one, blur 0 → 10px, fading out
      tl.to(words[i], { y: -46, filter: "blur(10px)", opacity: 0, duration: 0.6, ease: "power1.in", stagger: 0.11 }, t);
      const outEnd = t + 0.6 + 0.11 * (words[i].length - 1);
      tl.set(line, { visibility: "hidden" }, outEnd);
      tl.set(lines[j], { visibility: "visible" }, outEnd - 0.1);
      // a quick, plain entry so the exit reads clearly
      tl.fromTo(words[j], { y: 16, opacity: 0, filter: "blur(0px)" }, { y: 0, opacity: 1, duration: 0.4, ease: "power2.out", stagger: 0.04, immediateRender: false }, outEnd - 0.1);
      t = outEnd - 0.1 + 0.4 + 0.04 * (words[j].length - 1) + 0.25;
    });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(160,220,140,.36)" g2="rgba(255,154,92,.26)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div>
          <p className="mb-6 text-center text-[13px] uppercase tracking-[0.22em] text-white/60">Darjeeling estate tea</p>
          <SwapLines texts={M303_LINES} className="text-center text-[clamp(56px,6vw,96px)] font-[500] leading-[1.1] tracking-[-0.015em]" style={{ fontFamily: F.fr }} />
          <Caption>100 g tin · ₹1,450</Caption>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M304 · Breathing variable-font weight (play, SplitText + ticker) ───────────────────────── */
function M304() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const h = el.querySelector<HTMLElement>(".m304-h")!;
    const { chars } = splitChars(h, onClean);
    const clock = { t: 0 };
    // a linear clock tween drives the sine; the play helper pauses it (and so the wave) off screen
    const run = gsap.to(clock, { t: 1, duration: 2.6, ease: "none", repeat: -1, paused: true });
    let time = 0;
    const tick = (_t: number, dtMs: number) => {
      if (run.paused()) return;
      time += Math.min(0.05, dtMs / 1000);
      chars.forEach((c, i) => {
        const s = Math.sin((time / 2.6) * Math.PI * 2 - i * 0.55); // per-letter phase offset → a rolling wave
        c.style.fontVariationSettings = `"wght" ${Math.round(500 + 390 * s)}`;
      });
    };
    gsap.ticker.add(tick);
    onClean(() => {
      gsap.ticker.remove(tick);
      chars.forEach((c) => (c.style.fontVariationSettings = ""));
    });
    return run;
  });
  return (
    <Stage r={root} g1="rgba(255,170,120,.42)" g2="rgba(140,120,255,.22)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center">
          <h3 className="m304-h whitespace-nowrap text-[clamp(96px,10.5vw,164px)] font-[500] leading-none tracking-[-0.01em]" style={{ fontFamily: F.fr }}>
            Unhurried
          </h3>
          <Caption>Linen sleep set · stone wash · ₹6,400</Caption>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M305 · Calligraphy stroke on hover (play, svg DrawSVG + auto pointer) ───────────────────────── */
function M305() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const word = el.querySelector<HTMLElement>(".m305-w")!;
    const strokes = gsap.utils.toArray<SVGPathElement>(".m305-s", el);
    const ring = el.querySelector<HTMLElement>(".m305-ring")!;
    const rr = el.getBoundingClientRect();
    const wr = word.getBoundingClientRect();
    const wx = wr.left - rr.left;
    const wy = wr.top - rr.top + wr.height * 0.55;
    const home = { x: rr.width * 0.18, y: rr.height * 0.8 };
    gsap.set(strokes, { drawSVG: "0%" });
    gsap.set(ring, { x: home.x, y: home.y, opacity: 1 });
    const tl = gsap.timeline({ repeat: -1, paused: true });
    tl.to(ring, { x: wx + wr.width * 0.08, y: wy, duration: 0.6, ease: "power2.inOut" })
      .to(ring, { scale: 0.7, duration: 0.15, ease: "power1.out" }, "draw")
      .to(strokes, { drawSVG: "0% 100%", duration: 0.95, ease: "power2.out", stagger: 0.08 }, "draw")
      .to(ring, { x: wx + wr.width * 0.92, y: wy + 6, duration: 1.0, ease: "power2.out" }, "draw")
      .to(ring, { x: rr.width * 0.84, y: rr.height * 0.24, scale: 1, duration: 0.65, ease: "power2.inOut" }, "+=0.2")
      .to(strokes, { drawSVG: "100% 100%", duration: 0.5, ease: "power2.in" }, "<")
      .to(ring, { x: home.x, y: home.y, duration: 0.7, ease: "sine.inOut" })
      .set(strokes, { drawSVG: "0%" });
    // real hover still works: the stroke draws while the pointer is on the word, the auto loop resumes on leave
    const enter = () => {
      tl.pause();
      gsap.to(ring, { opacity: 0, duration: 0.2 });
      gsap.to(strokes, { drawSVG: "0% 100%", duration: 0.8, ease: "power2.out", overwrite: true });
    };
    const leave = () => {
      gsap.to(strokes, {
        drawSVG: "100% 100%",
        duration: 0.4,
        ease: "power2.in",
        overwrite: true,
        onComplete: () => {
          gsap.set(ring, { opacity: 1 });
          tl.restart();
        },
      });
    };
    word.addEventListener("pointerenter", enter);
    word.addEventListener("pointerleave", leave);
    onClean(() => {
      word.removeEventListener("pointerenter", enter);
      word.removeEventListener("pointerleave", leave);
      gsap.killTweensOf([ring, ...strokes]);
    });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(150,210,120,.42)" g2="rgba(255,154,92,.22)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center">
          <p className="mb-5 text-[13px] uppercase tracking-[0.22em] text-white/60">Ceremonial grade · Uji</p>
          <span className="m305-w relative inline-block cursor-pointer px-4">
            <span className="block whitespace-nowrap text-[clamp(96px,10vw,160px)] leading-[1.05] tracking-[-0.01em]" style={{ fontFamily: F.is }}>
              Slow matcha
            </span>
            <svg className="pointer-events-none absolute -bottom-[0.06em] left-0 h-[0.42em] w-full overflow-visible text-[clamp(96px,10vw,160px)]" viewBox="0 0 600 70" preserveAspectRatio="none" aria-hidden>
              <path className="m305-s" d="M14 44 C 110 22, 210 58, 318 38 S 500 22, 586 34 Q 596 36, 588 46" fill="none" stroke={ACC} strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
              <path className="m305-s" d="M30 52 C 140 36, 250 62, 360 46 S 520 36, 572 44" fill="none" stroke={ACC} strokeOpacity=".55" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </span>
          <Caption>Matcha tin · 30 g · ₹2,100</Caption>
        </div>
      </div>
      <span className="m305-ring pointer-events-none absolute left-0 top-0 -ml-4 -mt-4 block h-8 w-8 rounded-full border-2 border-white/90 opacity-0 shadow-[0_0_18px_rgba(255,255,255,.35)]" aria-hidden />
    </Stage>
  );
}

/* ───────────────────────── M306 · Centre-out vertical cut reveal (play, SplitText) ───────────────────────── */
function M306() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const h = el.querySelector<HTMLElement>(".m306-h")!;
    const { chars } = splitChars(h, onClean);
    const tl = gsap.timeline({ repeat: -1, paused: true });
    // reveal: each char's bottom inset wipes 100% → 0, the centre char first, then outward
    tl.fromTo(
      chars,
      { clipPath: "inset(0% -12% 100% -12%)" },
      { clipPath: "inset(0% -12% 0% -12%)", duration: 0.7, ease: "power2.out", stagger: { each: 0.06, from: "center" } },
    )
      // leave: the cut carries on downward (top inset grows), edges first, so the loop restarts cleanly
      .to(chars, { clipPath: "inset(100% -12% 0% -12%)", duration: 0.5, ease: "power2.in", stagger: { each: 0.04, from: "edges" } }, "+=0.25");
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(90,170,255,.4)" g2="rgba(255,154,92,.24)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center">
          <h3 className="m306-h whitespace-nowrap text-[clamp(72px,8vw,124px)] font-[700] uppercase leading-[1.05] tracking-[-0.02em]" style={{ fontFamily: F.sg }}>
            Monsoon edit
          </h3>
          <Caption>Rain-ready shells · from ₹3,900</Caption>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M307 · Chars door-swing with back(4) (play, SplitText) ───────────────────────── */
function M307() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) =>
    swapLoop(el, onClean, {
      out: { rotationY: -45, z: -160, opacity: 0, transformOrigin: "0% 50%", duration: 0.45, ease: "power2.in" },
      from: { rotationY: 80, z: 0, opacity: 0, transformOrigin: "0% 50%" },
      to: { rotationY: 0, z: 0, opacity: 1, duration: 0.7, ease: "back.out(4)" },
      stagger: 0.035,
      gap: -0.15,
      hold: 0.25,
      threeD: true,
    }),
  );
  return (
    <Stage r={root} g1="rgba(255,154,92,.42)" g2="rgba(200,120,255,.2)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div style={{ perspective: "900px" }}>
          <p className="mb-6 text-center text-[13px] uppercase tracking-[0.22em] text-white/60">Casa Ombra · hill house</p>
          <SwapLines
            texts={["Rooms open", "Doors at nine"]}
            className="text-center text-[clamp(72px,8vw,124px)] font-[600] leading-[1.1] tracking-[-0.02em] [perspective:900px]"
            style={{ fontFamily: F.fr }}
          />
          <Caption>Garden suite · from ₹14,800 a night</Caption>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M308 · Chars flatten from top (play, SplitText) ───────────────────────── */
function M308() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) =>
    swapLoop(el, onClean, {
      out: { scaleY: 0, transformOrigin: "50% 0%", duration: 0.4, ease: "power2.in" },
      from: { scaleY: 0, transformOrigin: "50% 0%" },
      to: { scaleY: 1, duration: 0.55, ease: "power2.out" },
      stagger: 0.04,
      gap: -0.05,
      hold: 0.25,
    }),
  );
  return (
    <Stage r={root} g1="rgba(120,230,200,.38)" g2="rgba(255,154,92,.24)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div>
          <p className="mb-6 text-center text-[13px] uppercase tracking-[0.22em] text-white/60">Court sneaker · drop 04</p>
          <SwapLines texts={["New season", "Restocked"]} className="text-center text-[clamp(64px,6.4vw,104px)] font-[800] leading-[1.1] tracking-[-0.02em]" style={{ fontFamily: F.sy }} />
          <Caption>Chalk white · ₹8,990</Caption>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M309 · Chars flip on X like flaps (scrub, SplitText) ───────────────────────── */
const M309_ROWS = [
  ["Goa", "06:40"],
  ["Pune", "08:15"],
  ["Kochi", "11:30"],
  ["Udaipur", "14:05"],
  ["Mysuru", "17:50"],
];
function M309() {
  const root = useRef<HTMLDivElement>(null);
  useScrubApply(root, (el, onClean) => {
    const col = el.querySelector<HTMLElement>(".m309-col")!;
    const rows = gsap.utils.toArray<HTMLElement>(".m309-row", el);
    const tls = rows.map((row) => {
      const { words, chars } = splitChars(row.querySelector<HTMLElement>(".m309-t")!, onClean, "m309-c");
      gsap.set(words, { transformStyle: "preserve-3d" });
      const tl = gsap.timeline({ paused: true });
      // enter: -90 → 0 (flaps fall flat) · short flat stretch · leave: 0 → +90
      tl.fromTo(chars, { rotationX: -90 }, { rotationX: 0, duration: 0.6, ease: "power1.out", stagger: { amount: 0.4 } }, 0)
        .to(chars, { rotationX: 90, duration: 0.6, ease: "power1.in", stagger: { amount: 0.4 } }, 1.2);
      return tl;
    });
    return (p) => {
      const H = el.clientHeight;
      const ch = col.offsetHeight;
      const y = (0.5 - p) * (H + ch) * 0.85; // the board scrolls linearly through the stage
      gsap.set(col, { y });
      rows.forEach((row, i) => {
        const cy = col.offsetTop + y + row.offsetTop + row.offsetHeight / 2;
        tls[i].progress(gsap.utils.clamp(0, 1, 1 - cy / H));
      });
    };
  });
  return (
    <Stage r={root} g1="rgba(255,190,90,.36)" g2="rgba(79,141,255,.24)">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="m309-col relative w-[min(78%,980px)]">
          {M309_ROWS.map(([city, time]) => (
            <div key={city} className="m309-row flex items-center justify-between border-b border-white/10 py-3">
              <span className="m309-t inline-block whitespace-nowrap text-[clamp(52px,5.6vw,88px)] font-[600] uppercase leading-[1.1]" style={{ fontFamily: F.sg, perspective: "700px" }}>
                {city} {time}
              </span>
              <span className="flex items-center gap-2 text-[13px] uppercase tracking-[0.2em] text-white/60">
                <span className="m309-tick block h-2 w-2 rounded-full bg-[#ff9a5c]" />
                On time
              </span>
            </div>
          ))}
        </div>
      </div>
      <p className="absolute bottom-5 left-6 text-[13px] uppercase tracking-[0.2em] text-white/65">Coastal rail · window seat from ₹1,240</p>
    </Stage>
  );
}

/* ───────────────────────── M310 · Chars flip on Y between texts (play, SplitText) ───────────────────────── */
function M310() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) =>
    swapLoop(el, onClean, {
      out: { rotationY: 90, opacity: 0, duration: 0.4, ease: "power2.in" },
      from: { rotationY: -90, opacity: 0 },
      to: { rotationY: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      stagger: 0.04,
      gap: -0.1,
      hold: 0.25,
      threeD: true,
    }),
  );
  return (
    <Stage r={root} g1="rgba(255,140,90,.42)" g2="rgba(79,141,255,.22)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div>
          <p className="mb-6 text-center text-[13px] uppercase tracking-[0.22em] text-white/60">Kettle &amp; Crow roasters</p>
          <SwapLines
            texts={["Hand roasted", "Single origin"]}
            className="text-center text-[clamp(72px,8vw,124px)] font-[700] leading-[1.1] tracking-[-0.03em] [perspective:800px]"
            style={{ fontFamily: F.sg }}
          />
          <Caption>Attikan estate · 250 g · ₹780</Caption>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M311 · Chars fly from Z depth (scrub, SplitText) ───────────────────────── */
function M311() {
  const root = useRef<HTMLDivElement>(null);
  useScrubApply(root, (el, onClean) => {
    const h = el.querySelector<HTMLElement>(".m311-h")!;
    const { words, chars } = splitChars(h, onClean);
    gsap.set(words, { transformStyle: "preserve-3d" });
    const r = rng(311);
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(h, { yPercent: 70 }, { yPercent: -70, duration: 2.3, ease: "none" }, 0)
      .fromTo(
        chars,
        { rotationX: () => (r() * 2 - 1) * 120, z: () => (r() * 2 - 1) * 200, opacity: 0 },
        { rotationX: 0, z: 0, opacity: 1, duration: 0.6, ease: "power2.out", stagger: { amount: 0.4 } },
        0,
      )
      .to(chars, { z: -800, opacity: 0, duration: 0.6, ease: "power1.in", stagger: { amount: 0.4 } }, 1.3);
    return (p) => tl.progress(p);
  });
  return (
    <Stage r={root} g1="rgba(255,120,80,.4)" g2="rgba(79,141,255,.24)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <h3 className="m311-h whitespace-nowrap text-center text-[clamp(84px,9.5vw,148px)] font-[700] leading-[1.05] tracking-[-0.02em]" style={{ fontFamily: F.fr, perspective: "900px" }}>
          Built to last
        </h3>
      </div>
      <p className="absolute bottom-5 left-6 text-[13px] uppercase tracking-[0.2em] text-white/65">Cast-iron skillet · 26 cm · ₹3,250</p>
    </Stage>
  );
}

/* ───────────────────────── M312 · Chars pop from random rotation (scrub, SplitText) ───────────────────────── */
function M312() {
  const root = useRef<HTMLDivElement>(null);
  useScrubApply(root, (el, onClean) => {
    const h = el.querySelector<HTMLElement>(".m312-h")!;
    const { chars } = splitChars(h, onClean);
    const r = rng(312);
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(h, { yPercent: 80 }, { yPercent: -80, duration: 1.6, ease: "none" }, 0).fromTo(
      chars,
      { opacity: 0, scale: 0.6, rotation: () => (r() * 2 - 1) * 20 },
      { opacity: 1, scale: 1, rotation: 0, duration: 0.6, ease: "power1.out", stagger: { amount: 0.45 } },
      0,
    );
    return (p) => tl.progress(p);
  });
  return (
    <Stage r={root} g1="rgba(255,154,92,.42)" g2="rgba(120,220,160,.22)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <h3 className="m312-h whitespace-nowrap text-center text-[clamp(72px,8vw,124px)] font-[700] leading-[1.05] tracking-[-0.02em]" style={{ fontFamily: F.sy }}>
          Pick your roast
        </h3>
      </div>
      <p className="absolute bottom-5 left-6 text-[13px] uppercase tracking-[0.2em] text-white/65">Light · medium · dark · from ₹620</p>
    </Stage>
  );
}

/* ───────────────────────── M313 · Chars scale out/in (play, SplitText) ───────────────────────── */
function M313() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) =>
    swapLoop(el, onClean, {
      out: { scale: 0, duration: 0.4, ease: "power1.in" },
      from: { scale: 0 },
      to: { scale: 1, duration: 0.55, ease: "power3.out" },
      stagger: 0.035,
      gap: -0.1,
      hold: 0.15,
    }),
  );
  return (
    <Stage r={root} g1="rgba(255,200,90,.4)" g2="rgba(79,141,255,.22)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div>
          <p className="mb-6 text-center text-[13px] uppercase tracking-[0.22em] text-white/60">Small-batch bakery</p>
          <SwapLines texts={["Fresh batch", "Ships today"]} className="text-center text-[clamp(72px,8vw,124px)] font-[800] leading-[1.1] tracking-[-0.03em]" style={{ fontFamily: F.mr }} />
          <Caption>Sourdough box · 4 loaves · ₹1,180</Caption>
        </div>
      </div>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M302", name: "Blur digit change", how: "A price changes and only the digits that differ slide up or down to the new value, blurred in travel; the rest stay still · cycles", kind: "play", C: M302 },
  { code: "M303", name: "Blur-out-up exit", how: "Headline swap exit: words leave upward one by one, blurring 0 → 10px as they fade; the next line drops in plainly · cycles", kind: "play", C: M303 },
  { code: "M304", name: "Breathing variable-font weight", how: "Each letter's variable weight breathes on a sine with a per-letter phase, so a wave of boldness rolls through the word · loops", kind: "play", C: M304 },
  { code: "M305", name: "Calligraphy stroke on hover", how: "Hovering the word draws a brush stroke under it (DrawSVG, ease-out); leaving wipes it away · auto pointer", kind: "play", C: M305 },
  { code: "M306", name: "Centre-out vertical cut reveal", how: "Each character is revealed by a vertical clip wipe, starting at the centre character and spreading outward · loops", kind: "play", C: M306 },
  { code: "M307", name: "Chars door-swing with back(4)", how: "Swap: chars swing open like doors (rotateY −45 from the left edge, pushed back in z); new chars swing shut with back.out(4) · A ↔ B", kind: "play", C: M307 },
  { code: "M308", name: "Chars flatten from top", how: "Swap: chars flatten to scaleY 0 against their top edge, new chars unroll downward from it, staggered like blinds · A ↔ B", kind: "play", C: M308 },
  { code: "M309", name: "Chars flip on X like flaps", how: "Departure-board rows: chars flip from rotateX −90 to flat as a row enters and on to +90 as it leaves · scrubbed", kind: "scrub", C: M309 },
  { code: "M310", name: "Chars flip on Y between texts", how: "Swap: chars turn on Y to 90° and fade, new chars turn in from −90°, staggered like cards · A ↔ B", kind: "play", C: M310 },
  { code: "M311", name: "Chars fly from Z depth", how: "Chars tumble in from random rotateX ±120 and z ±200 to settle flat, then sink to z −800 on the way out · scrubbed", kind: "scrub", C: M311 },
  { code: "M312", name: "Chars pop from random rotation", how: "Chars grow from scale 0.6, opacity 0 and a random ±20° tilt to upright as the heading scrolls through · scrubbed", kind: "scrub", C: M312 },
  { code: "M313", name: "Chars scale out/in", how: "Swap: chars shrink to 0 (power1.in) and the new chars grow from 0 (power3.out), staggered across the line · A ↔ B", kind: "play", C: M313 },
];
