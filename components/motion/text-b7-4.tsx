"use client";

// Text motions, batch 7 · group 4 (MOTION-MENU M326–M337). Small focused demos for /lab/motion, rebuilt in GSAP / CSS / SVG
// from the idea only. Every demo: plays by itself on screen (or follows the scroll), loops, has a CSS glow loop that never
// stops, and shows a sensible final state in ?static=1 / reduced motion.
import "@fontsource-variable/instrument-sans/wdth.css";
import { useEffect, useId, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, SplitText, loadPlugin, prefersReducedMotion } from "@/lib/gsap";
import { useScrub } from "@/components/fx/shared";
import { Product } from "@/components/sections/kit";
import type { MotionDef } from "./types";

const F = { sg: "Space Grotesk Variable", fr: "Fraunces Variable", is: "Instrument Serif", sy: "Syne Variable", mr: "Manrope Variable", ins: "Instrument Sans Variable" };
const ACC = "#ff9a5c";
const INK = "#eaf5ff";

const CSS = `
.b7g4-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 32% 38%,var(--g1,rgba(255,154,92,.42)),transparent 70%),radial-gradient(34% 40% at 70% 66%,var(--g2,rgba(79,141,255,.22)),transparent 70%);animation:b7g4-drift 6s linear infinite alternate;will-change:transform}
@keyframes b7g4-drift{0%{transform:translate3d(-7%,-5%,0) scale(1)}100%{transform:translate3d(7%,6%,0) scale(1.15)}}
.m327-t{background-image:linear-gradient(90deg,#f6f9ff 0%,#ffd9bf 41%,${ACC} 45%,rgba(234,245,255,.2) 55%,rgba(234,245,255,.2) 100%);background-size:300% 100%;background-repeat:no-repeat;background-position:calc((1 - var(--m327-p,1)) * 100%) 0;-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-box-decoration-break:slice;box-decoration-break:slice}
.m332-k{display:inline-block;font-size:1em;color:${ACC};font-style:italic}
.m332-on .m332-k{font-size:2.4em}
.m332-r{display:inline-block;scale:var(--m332-s,1)}
.m335-float{animation:m335-bob 3.2s ease-in-out infinite alternate}
@keyframes m335-bob{0%{transform:translateY(-10px) rotate(-1.5deg)}100%{transform:translateY(10px) rotate(1.5deg)}}
html.is-static .b7g4-glow,html.is-static .m335-float{animation:none}
html.is-static {.b7g4-glow,.m335-float{animation:none}}
`;

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0f1c] text-[#eaf5ff] ${className}`}>
      <style href="b7g4-css" precedence="default">
        {CSS}
      </style>
      <div className="b7g4-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/**
 * "play" helper: waits for fonts (and an optional plugin), builds the looping animation inside a gsap.context, plays it
 * only while the demo is on screen, and reverts everything on unmount. Nothing runs with prefersReducedMotion().
 */
function usePlay(
  ref: RefObject<HTMLElement | null>,
  build: (root: HTMLElement, onClean: (fn: () => void) => void) => gsap.core.Animation | void,
  need?: () => Promise<unknown>,
) {
  const b = useRef(build);
  b.current = build;
  const n = useRef(need);
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
    Promise.all([document.fonts.ready, n.current ? n.current() : null]).then(() => {
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

/** Element box relative to the root. */
const rel = (el: Element, root: Element) => {
  const a = el.getBoundingClientRect();
  const b = root.getBoundingClientRect();
  return { x: a.left - b.left, y: a.top - b.top, w: a.width, h: a.height };
};

const Ring = ({ cls, size = 28 }: { cls: string; size?: number }) => (
  <span
    className={`${cls} pointer-events-none absolute left-0 top-0 z-30 rounded-full border-2 border-white bg-white/10 opacity-0`}
    style={{ width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 }}
    aria-hidden
  />
);

/* ───────────────────────── M326 · Font swap rollover (play, SplitText-style chars + auto pointer) ───────────────────────── */
const M326_WORD = "Maison Vela";
function M326() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const word = el.querySelector<HTMLElement>(".m326-w")!;
    const chars = gsap.utils.toArray<HTMLElement>(".m326-c", el);
    const ring = el.querySelector<HTMLElement>(".m326-ring")!;
    const swap = gsap.timeline({ paused: true });
    chars.forEach((c, i) => {
      const t = i * 0.07;
      swap.to(c, { yPercent: -35, opacity: 0, duration: 0.12, ease: "power1.in" }, t);
      swap.set(c, { fontFamily: F.is, fontStyle: "italic", fontWeight: 400, color: ACC }, t + 0.12);
      swap.fromTo(c, { yPercent: 35 }, { yPercent: 0, opacity: 1, duration: 0.2, ease: "power2.out", immediateRender: false }, t + 0.12);
    });
    const D = swap.duration();
    const master = gsap.timeline({ repeat: -1 });
    master.set(ring, { left: "80%", top: "78%", opacity: 1 });
    master.to(ring, { left: "46%", top: "50%", duration: 0.5, ease: "power2.inOut" });
    master.add(swap.tweenFromTo(0, D));
    master.to(ring, { left: "58%", top: "54%", duration: D, ease: "sine.inOut" }, "<");
    master.to(ring, { left: "20%", top: "26%", duration: 0.5, ease: "power2.inOut" });
    master.add(swap.tweenFromTo(D, 0));
    master.to(ring, { left: "80%", top: "78%", duration: D, ease: "sine.inOut" }, "<");
    // real hover still works: forward on enter, back on leave, then the auto loop resumes
    let resume: gsap.core.Tween | null = null;
    const enter = () => {
      resume?.kill();
      master.pause();
      gsap.set(ring, { opacity: 0 });
      swap.play();
    };
    const leave = () => {
      swap.reverse();
      resume = gsap.delayedCall(1.2, () => master.restart());
    };
    word.addEventListener("mouseenter", enter);
    word.addEventListener("mouseleave", leave);
    onClean(() => {
      resume?.kill();
      swap.kill();
      word.removeEventListener("mouseenter", enter);
      word.removeEventListener("mouseleave", leave);
    });
    return master;
  });
  return (
    <Stage r={root} g1="rgba(255,154,92,.5)" g2="rgba(79,141,255,.22)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center">
          <p className="mb-7 text-[13px] uppercase tracking-[0.24em] text-white/60">Hover the name</p>
          <h3 className="m326-w inline-block cursor-pointer whitespace-nowrap text-[clamp(72px,8.6vw,136px)] font-[600] leading-[1.05] tracking-[-0.02em]" style={{ fontFamily: F.sg }}>
            {M326_WORD.split("").map((c, i) =>
              c === " " ? (
                <span key={i} className="inline-block w-[0.26em]">
                  {" "}
                </span>
              ) : (
                <span key={i} className="m326-c inline-block">
                  {c}
                </span>
              ),
            )}
          </h3>
          <p className="mt-8 text-[13px] uppercase tracking-[0.22em] text-white/60">Boutique hotel · Lisbon · from ₹18,400 a night</p>
        </div>
      </div>
      <Ring cls="m326-ring" />
    </Stage>
  );
}

/* ───────────────────────── M327 · Gradient clip scroll read (scrub, CSS background-clip) ───────────────────────── */
function M327() {
  const root = useRef<HTMLDivElement>(null);
  const txt = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  useScrub(
    root,
    (p) => {
      txt.current?.style.setProperty("--m327-p", p.toFixed(4)); // linear over the whole panel
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    },
    { finalValue: 1 },
  );
  return (
    <Stage r={root} g1="rgba(255,154,92,.4)" g2="rgba(79,141,255,.22)">
      <div className="absolute inset-0 grid place-items-center px-[8%]">
        <p className="max-w-[30ch] text-[clamp(32px,3.5vw,54px)] leading-[1.18] tracking-[-0.01em]" style={{ fontFamily: F.fr }}>
          <span ref={txt} className="m327-t">
            We grow our tea on one steep hillside, pick only the top two leaves at dawn, and roll every batch by hand before the afternoon heat sets in.
          </span>
        </p>
      </div>
      <div className="absolute bottom-5 left-6 flex items-center gap-4 text-[13px] uppercase tracking-[0.18em] text-white/65">
        <span>Hill estate · first flush · ₹1,450</span>
        <span className="relative block h-px w-[160px] bg-white/15">
          <span ref={bar} className="absolute inset-0 origin-left bg-[#ff9a5c]" style={{ transform: "scaleX(1)" }} />
        </span>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M328 · Hero words blur-in + framing lines (play, SplitText) ───────────────────────── */
function M328() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const q = (s: string) => el.querySelector<HTMLElement>(s)!;
    const split = SplitText.create(q(".m328-h"), { type: "words" });
    const words = split.words as HTMLElement[];
    const dots = gsap.utils.toArray<HTMLElement>(".m328-dot", el);
    const rest = gsap.utils.toArray<HTMLElement>(".m328-x", el);
    const tl = gsap.timeline({ repeat: -1 });
    const draw = { duration: 0.6, ease: "power2.inOut" };
    tl.fromTo(dots[0], { scale: 0 }, { scale: 1, duration: 0.3, ease: "back.out(3)" }, 0);
    tl.fromTo(q(".m328-top"), { scaleX: 0 }, { scaleX: 1, ...draw }, 0.05);
    tl.fromTo(dots[1], { scale: 0 }, { scale: 1, duration: 0.3, ease: "back.out(3)" }, 0.6);
    tl.fromTo(q(".m328-right"), { scaleY: 0 }, { scaleY: 1, ...draw }, 0.25);
    tl.fromTo(dots[2], { scale: 0 }, { scale: 1, duration: 0.3, ease: "back.out(3)" }, 0.8);
    tl.fromTo(q(".m328-bot"), { scaleX: 0 }, { scaleX: 1, ...draw }, 0.45);
    tl.fromTo(dots[3], { scale: 0 }, { scale: 1, duration: 0.3, ease: "back.out(3)" }, 1.0);
    tl.fromTo(q(".m328-left"), { scaleY: 0 }, { scaleY: 1, ...draw }, 0.65);
    tl.fromTo(words, { yPercent: 70, opacity: 0, filter: "blur(14px)" }, { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 0.8, ease: "power2.out", stagger: 0.09 }, 0.2);
    tl.fromTo(rest, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", stagger: 0.08 }, 0.95);
    // out (after a ≤ 0.25 s hold), then restart from the same empty state
    tl.to(words, { yPercent: -40, opacity: 0, filter: "blur(10px)", duration: 0.45, ease: "power2.in", stagger: 0.03 }, ">0.25");
    tl.to(rest, { opacity: 0, duration: 0.35, ease: "power1.in" }, "<");
    tl.to([q(".m328-top"), q(".m328-bot")], { scaleX: 0, duration: 0.45, ease: "power2.in" }, "<0.1");
    tl.to([q(".m328-left"), q(".m328-right")], { scaleY: 0, duration: 0.45, ease: "power2.in" }, "<");
    tl.to(dots, { scale: 0, duration: 0.25, ease: "power2.in" }, "<0.2");
    return tl;
  });
  const line = "absolute bg-white/40";
  const dot = "m328-dot absolute h-[9px] w-[9px] rounded-full bg-[#ff9a5c]";
  return (
    <Stage r={root} g1="rgba(255,154,92,.4)" g2="rgba(120,140,255,.24)">
      <div className="absolute inset-[11%_13%]">
        <span className={`m328-top ${line} left-0 right-0 top-0 h-px origin-left`} />
        <span className={`m328-right ${line} bottom-0 right-0 top-0 w-px origin-top`} />
        <span className={`m328-bot ${line} bottom-0 left-0 right-0 h-px origin-right`} />
        <span className={`m328-left ${line} bottom-0 left-0 top-0 w-px origin-bottom`} />
        <span className={dot} style={{ left: -4, top: -4 }} />
        <span className={dot} style={{ right: -4, top: -4 }} />
        <span className={dot} style={{ right: -4, bottom: -4 }} />
        <span className={dot} style={{ left: -4, bottom: -4 }} />
        <div className="grid h-full place-items-center px-[6%] text-center">
          <div>
            <p className="m328-x text-[13px] uppercase tracking-[0.24em] text-[#ff9a5c]">Studio Halvard · est. 2019</p>
            <h3 className="m328-h mx-auto mt-6 max-w-[16ch] text-[clamp(52px,5.8vw,92px)] leading-[1.02] tracking-[-0.02em]" style={{ fontFamily: F.fr }}>
              Quiet tools for loud ideas
            </h3>
            <div className="m328-x mt-8 inline-flex items-center gap-3 rounded-full border border-white/25 px-6 py-3 text-[14px] tracking-[0.04em]" style={{ fontFamily: F.mr }}>
              Desk set · ₹7,800 <span className="text-[#ff9a5c]">→</span>
            </div>
          </div>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M329 · Highlight chars 3D drop-in (play, SplitText) ───────────────────────── */
function M329() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const hls = gsap.utils.toArray<HTMLElement>(".m329-hl", el);
    const split = SplitText.create(hls, { type: "words,chars" });
    const chars = split.chars as HTMLElement[];
    gsap.set(chars, { transformPerspective: 700, transformOrigin: "50% 100%" });
    const tl = gsap.timeline({ repeat: -1 });
    tl.fromTo(chars, { z: 300, rotationX: -45, opacity: 0 }, { z: 0, rotationX: 0, opacity: 1, duration: 0.75, ease: "power2.out", stagger: 0.045 });
    tl.to(chars, { z: 300, rotationX: -45, opacity: 0, duration: 0.45, ease: "power2.in", stagger: 0.02 }, ">0.2");
    return tl;
  });
  const hl = "m329-hl text-[1.12em] italic text-[#ff9a5c]";
  return (
    <Stage r={root} g1="rgba(255,154,92,.4)" g2="rgba(79,141,255,.22)">
      <div className="absolute inset-0 grid place-items-center px-[8%]">
        <div>
          <p className="max-w-[30ch] text-[clamp(32px,3.4vw,52px)] leading-[1.22] tracking-[-0.01em] text-white/80" style={{ fontFamily: F.mr }}>
            Our beans are roasted in <span className={hl} style={{ fontFamily: F.is }}>small batches</span> every Tuesday, rested for five days and shipped whole, so they reach your grinder at their{" "}
            <span className={hl} style={{ fontFamily: F.is }}>sweetest</span>.
          </p>
          <p className="mt-8 text-[13px] uppercase tracking-[0.2em] text-white/60">Ridge roasters · washed Arabica · 250 g · ₹720</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M330 · Highlight chars glow (play, SplitText) ───────────────────────── */
function M330() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const hls = gsap.utils.toArray<HTMLElement>(".m330-hl", el);
    const split = SplitText.create(hls, { type: "words,chars" });
    const chars = split.chars as HTMLElement[];
    const off = { color: "rgba(234,245,255,.5)", textShadow: "0 0 0px rgba(255,154,92,0), 0 0 0px rgba(255,236,214,0)" };
    const lit = { color: "#fff4ea", textShadow: "0 0 18px rgba(255,154,92,.95), 0 0 3px rgba(255,236,214,.9)" };
    const tl = gsap.timeline({ repeat: -1 });
    tl.fromTo(chars, off, { ...lit, duration: 0.45, ease: "power1.out", stagger: 0.06 });
    tl.to(chars, { ...off, duration: 0.6, ease: "sine.inOut", stagger: 0.015 }, ">0.2");
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,154,92,.38)" g2="rgba(79,141,255,.2)">
      <div className="absolute inset-0 grid place-items-center px-[8%]">
        <div>
          <p className="max-w-[31ch] text-[clamp(32px,3.4vw,52px)] leading-[1.24] tracking-[-0.01em] text-white/50" style={{ fontFamily: F.fr }}>
            Each cushion is filled with <span className="m330-hl text-[#fff4ea]">organic kapok</span>, stitched{" "}
            <span className="m330-hl text-[#fff4ea]">by hand</span> and soft enough to sink into after the{" "}
            <span className="m330-hl text-[#fff4ea]">longest day</span>.
          </p>
          <p className="mt-8 text-[13px] uppercase tracking-[0.2em] text-white/60">Floor cushion · undyed cotton · ₹3,150</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M331 · Highlight chars swell (play, SplitText) ───────────────────────── */
function M331() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const hl = el.querySelector<HTMLElement>(".m331-hl")!;
    const split = SplitText.create(hl, { type: "words,chars" });
    const chars = split.chars as HTMLElement[];
    gsap.set(chars, { transformOrigin: "50% 85%" });
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.12 });
    chars.forEach((c, i) => {
      const t = i * 0.055;
      tl.to(c, { scale: 1.45, color: ACC, duration: 0.22, ease: "power2.out" }, t);
      tl.to(c, { scale: 1, color: "#ffffff", duration: 0.4, ease: "sine.inOut" }, t + 0.22);
    });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,154,92,.4)" g2="rgba(140,110,255,.22)">
      <div className="absolute inset-0 grid place-items-center px-[8%]">
        <div>
          <p className="max-w-[30ch] text-[clamp(32px,3.4vw,52px)] leading-[1.3] tracking-[-0.01em] text-white/60" style={{ fontFamily: F.sg }}>
            Every rug is <span className="m331-hl font-[600] text-white">hand-knotted over eleven weeks</span>, then washed in river water to set its colours for good.
          </p>
          <p className="mt-8 text-[13px] uppercase tracking-[0.2em] text-white/60">Wool flatweave · 5 × 8 ft · ₹46,000</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M332 · Highlight word grows in paragraph (play, Flip) ───────────────────────── */
type FlipT = Awaited<ReturnType<typeof loadPlugin<"Flip">>>;
let FLIP: FlipT | null = null;
const needFlip = () =>
  loadPlugin("Flip").then((f) => {
    FLIP = f;
  });
const M332_TEXT = "Our linen is woven slowly on old shuttle looms, so every metre keeps a soft slub you can feel.";
const M332_KEY = "slowly";
function M332() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(
    root,
    (el, onClean) => {
      const p = el.querySelector<HTMLElement>(".m332-p")!;
      const words = gsap.utils.toArray<HTMLElement>(".m332-word", el);
      const rest = gsap.utils.toArray<HTMLElement>(".m332-r", el);
      const live: gsap.core.Animation[] = [];
      const go = (on: boolean) => {
        if (!FLIP) return;
        const st = FLIP.getState(words);
        p.classList.toggle("m332-on", on);
        live.push(FLIP.from(st, { duration: 0.85, ease: "power2.inOut", scale: true }));
        live.push(gsap.to(rest, { filter: on ? "blur(2.5px)" : "blur(0px)", opacity: on ? 0.42 : 1, duration: 0.85, ease: "power2.inOut", overwrite: "auto" }));
        live.push(gsap.to(p, { "--m332-s": on ? 0.94 : 1, duration: 0.85, ease: "power2.inOut", overwrite: "auto" }));
        if (live.length > 12) live.splice(0, live.length - 12);
      };
      const tl = gsap.timeline({ repeat: -1 });
      tl.call(() => go(true), [], 0);
      tl.call(() => go(false), [], 1.1);
      tl.to({}, { duration: 2.2 }, 0);
      onClean(() => {
        live.forEach((a) => a.kill());
        p.classList.remove("m332-on");
        gsap.set(words, { clearProps: "transform,filter,opacity" });
        p.style.removeProperty("--m332-s");
      });
      return tl;
    },
    needFlip,
  );
  return (
    <Stage r={root} g1="rgba(255,154,92,.4)" g2="rgba(79,141,255,.22)">
      <div className="absolute inset-0 grid place-items-center px-[8%]">
        <div className="text-center">
          <p className="m332-p mx-auto max-w-[28ch] text-[clamp(30px,3.1vw,48px)] leading-[1.25] tracking-[-0.01em]" style={{ fontFamily: F.fr }}>
            {M332_TEXT.split(" ").map((w, i) => (
              <span key={i}>
                <span className={`m332-word ${w === M332_KEY ? "m332-k" : "m332-r"}`}>{w}</span>{" "}
              </span>
            ))}
          </p>
          <p className="mt-8 text-[13px] uppercase tracking-[0.2em] text-white/60">Stonewashed linen sheet set · queen · ₹8,900</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M333 · Hover-highlighted word (play, auto pointer walk) ───────────────────────── */
const M333_TEXT = "A ceramic pour-over that keeps water at the right heat, drips evenly through the bed and brews a clean, bright cup in four minutes.";
const M333_KEYS = ["ceramic", "heat,", "evenly", "bright", "four"];
function M333() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const words = gsap.utils.toArray<HTMLElement>(".m333-w", el);
    const bar = el.querySelector<HTMLElement>(".m333-bar")!;
    const dot = el.querySelector<HTMLElement>(".m333-dot")!;
    const keys = M333_KEYS.map((k) => words.findIndex((w) => w.textContent === k)).filter((i) => i >= 0);
    const hl = (i: number) => {
      words.forEach((w, j) => gsap.to(w, { opacity: j === i ? 1 : 0.3, color: j === i ? ACC : INK, duration: 0.3, ease: "power1.out", overwrite: "auto" }));
      const r = rel(words[i], el);
      gsap.to(bar, { x: r.x, y: r.y + r.h - 2, width: r.w, opacity: 1, duration: 0.38, ease: "power2.out", overwrite: "auto" });
    };
    const centre = (i: number) => {
      const r = rel(words[i], el);
      return { x: r.x + r.w * 0.6, y: r.y + r.h * 0.6 };
    };
    const c0 = centre(keys[0]);
    gsap.set(dot, { x: c0.x - 140, y: c0.y + 90, opacity: 1 });
    const tl = gsap.timeline({ repeat: -1 });
    keys.forEach((k) => {
      tl.to(dot, { x: () => centre(k).x, y: () => centre(k).y, duration: 0.45, ease: "power2.inOut" });
      tl.call(() => hl(k));
      tl.to(dot, { x: () => centre(k).x + 12, duration: 0.35, ease: "sine.inOut" });
    });
    // real pointer: the word under it highlights, the auto walk waits
    let resume: gsap.core.Tween | null = null;
    const enters = words.map((w, j) => {
      const f = () => {
        resume?.kill();
        tl.pause();
        gsap.set(dot, { opacity: 0 });
        hl(j);
      };
      w.addEventListener("mouseenter", f);
      return f;
    });
    const leave = () => {
      resume = gsap.delayedCall(0.8, () => {
        gsap.set(dot, { opacity: 1 });
        tl.play();
      });
    };
    el.addEventListener("mouseleave", leave);
    onClean(() => {
      resume?.kill();
      gsap.killTweensOf([...words, bar]);
      words.forEach((w, j) => w.removeEventListener("mouseenter", enters[j]));
      el.removeEventListener("mouseleave", leave);
    });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,154,92,.5)" g2="rgba(79,141,255,.22)">
      <div className="absolute inset-0 grid place-items-center px-[8%]">
        <div>
          <p className="max-w-[30ch] text-[clamp(32px,3.4vw,52px)] leading-[1.26] tracking-[-0.01em]" style={{ fontFamily: F.is }}>
            {M333_TEXT.split(" ").map((w, i) => (
              <span key={i}>
                <span className="m333-w inline-block cursor-default">{w}</span>{" "}
              </span>
            ))}
          </p>
          <p className="mt-8 text-[13px] uppercase tracking-[0.2em] text-white/60">Pour-over dripper · stoneware · ₹2,350</p>
        </div>
      </div>
      <span className="m333-bar pointer-events-none absolute left-0 top-0 block h-[3px] w-0 rounded-full bg-[#ff9a5c] opacity-0" aria-hidden />
      <span className="m333-dot pointer-events-none absolute left-0 top-0 -ml-[7px] -mt-[7px] h-[14px] w-[14px] rounded-full border-2 border-white bg-white/30 opacity-0" aria-hidden />
    </Stage>
  );
}

/* ───────────────────────── M334 · Hyper text scramble on hover (play, ScrambleText) ───────────────────────── */
const M334_WORD = "OBSIDIAN";
const M334_SET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
function M334() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const word = el.querySelector<HTMLElement>(".m334-w")!;
    const cells = gsap.utils.toArray<HTMLElement>(".m334-c", el);
    const ring = el.querySelector<HTMLElement>(".m334-ring")!;
    const n = cells.length;
    const scramble = () =>
      cells.forEach((c, i) => {
        const d = 0.25 + (0.55 * i) / Math.max(1, n - 1); // ~0.8 s overall, resolves left to right
        gsap.to(c, { duration: d, scrambleText: { text: M334_WORD[i], chars: M334_SET, revealDelay: d - 0.06, speed: 0.7 }, overwrite: true });
        gsap.fromTo(c, { color: ACC }, { color: "#f6f9ff", duration: 0.2, delay: d - 0.08, ease: "none" });
      });
    scramble(); // on load
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(ring, { left: "80%", top: "78%", opacity: 1 });
    tl.to(ring, { left: "36%", top: "50%", duration: 0.45, ease: "power2.inOut" });
    tl.call(scramble);
    tl.to(ring, { left: "62%", top: "53%", duration: 0.8, ease: "sine.inOut" });
    tl.to(ring, { left: "80%", top: "78%", duration: 0.45, ease: "power2.inOut" });
    word.addEventListener("mouseenter", scramble);
    onClean(() => {
      word.removeEventListener("mouseenter", scramble);
      gsap.killTweensOf(cells);
    });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,154,92,.5)" g2="rgba(79,141,255,.24)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center">
          <p className="mb-7 text-[13px] uppercase tracking-[0.24em] text-white/60">New fragrance</p>
          <h3 className="m334-w inline-flex cursor-pointer text-[clamp(84px,9.4vw,150px)] font-[700] leading-none" style={{ fontFamily: F.sg }} aria-label={M334_WORD}>
            {M334_WORD.split("").map((c, i) => (
              <span key={i} className="m334-c inline-block w-[0.8em] text-center" aria-hidden>
                {c}
              </span>
            ))}
          </h3>
          <p className="mt-8 text-[13px] uppercase tracking-[0.22em] text-white/60">Eau de parfum · 50 ml · ₹5,900</p>
        </div>
      </div>
      <Ring cls="m334-ring" />
    </Stage>
  );
}

/* ───────────────────────── M335 · Infinite text with scroll parallax (scrub) ───────────────────────── */
const M335_LINE = "Cold brew tonic · ";
function M335() {
  const root = useRef<HTMLDivElement>(null);
  const back = useRef<HTMLDivElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const front = useRef<HTMLDivElement>(null);
  const can = useRef<HTMLDivElement>(null);
  useScrub(
    root,
    (p) => {
      // three layers, three speeds, all linear over the whole panel
      if (back.current) gsap.set(back.current, { xPercent: -8 - p * 22 });
      if (top.current) gsap.set(top.current, { xPercent: -30 + p * 12 });
      if (front.current) gsap.set(front.current, { xPercent: -42 + p * 38 });
      if (can.current) gsap.set(can.current, { y: (0.5 - p) * 60, rotation: -6 + p * 12 });
    },
    { finalValue: 0.5 },
  );
  const strip = (n: number) => Array.from({ length: n }, () => M335_LINE).join("");
  return (
    <Stage r={root} g1="rgba(255,154,92,.42)" g2="rgba(79,141,255,.24)">
      <div ref={top} className="absolute left-0 top-[9%] whitespace-nowrap text-[clamp(18px,1.6vw,24px)] uppercase tracking-[0.3em] text-white/45" style={{ fontFamily: F.mr, transform: "translateX(-24%)" }} aria-hidden>
        {strip(14)}
      </div>
      <div
        ref={back}
        className="absolute left-0 top-[30%] whitespace-nowrap text-[clamp(110px,12vw,190px)] font-[800] uppercase leading-none tracking-[-0.01em] text-transparent"
        style={{ fontFamily: F.sy, WebkitTextStroke: "1.5px rgba(234,245,255,.42)", transform: "translateX(-19%)" }}
        aria-hidden
      >
        {strip(6)}
      </div>
      <div className="absolute inset-0 z-10 grid place-items-center">
        <div className="m335-float h-[78%]">
          <div ref={can} className="h-full">
            <Product angle={1} accent={ACC} className="h-full w-auto drop-shadow-[0_30px_40px_rgba(0,0,0,.55)]" />
          </div>
        </div>
      </div>
      <div
        ref={front}
        className="absolute left-0 top-[60%] z-20 whitespace-nowrap text-[clamp(64px,6.6vw,104px)] font-[800] uppercase leading-none tracking-[-0.01em] text-[#ff9a5c]"
        style={{ fontFamily: F.sy, transform: "translateX(-23%)" }}
        aria-hidden
      >
        {strip(10)}
      </div>
      <p className="absolute bottom-5 left-6 z-30 text-[13px] uppercase tracking-[0.18em] text-white/70">Cold brew tonic · 250 ml can · ₹180</p>
    </Stage>
  );
}

/* ───────────────────────── M336 · Ink-blot hover text reveal (play, SVG mask + goo) ───────────────────────── */
const M336_WORD = "INKWELL";
const M336_VB = { w: 1400, h: 600 };
const M336_BLOBS = [
  { r: 96, k: 9, ox: 0, oy: 0 },
  { r: 58, k: 5.5, ox: 70, oy: -40 },
  { r: 46, k: 4, ox: -80, oy: 34 },
  { r: 38, k: 3, ox: 40, oy: 70 },
  { r: 30, k: 2.2, ox: -46, oy: -76 },
  { r: 22, k: 1.6, ox: 120, oy: 30 },
];
function M336() {
  const root = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  // fit the word by measuring: ~1000 of the 1400 viewBox units (≈ 71 % of the stage width)
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    let dead = false;
    document.fonts.ready.then(() => {
      if (dead) return;
      const texts = Array.from(svg.querySelectorAll<SVGTextElement>(".m336-t"));
      texts.forEach((t) => t.setAttribute("font-size", "200"));
      const len = texts[0].getComputedTextLength() || 1;
      const fs = Math.min(300, (200 * 1000) / len);
      texts.forEach((t) => t.setAttribute("font-size", fs.toFixed(1)));
    });
    return () => {
      dead = true;
    };
  }, []);
  usePlay(root, (el, onClean) => {
    const svg = svgRef.current!;
    const circles = Array.from(svg.querySelectorAll<SVGCircleElement>(".m336-b"));
    const ring = el.querySelector<HTMLElement>(".m336-ring")!;
    const read = pointerSource(el, onClean);
    const toSvg = (x: number, y: number) => {
      const m = svg.getScreenCTM();
      const r = el.getBoundingClientRect();
      if (!m) return { x, y };
      const pt = new DOMPoint(x + r.left, y + r.top).matrixTransform(m.inverse());
      return { x: pt.x, y: pt.y };
    };
    const toRoot = (x: number, y: number) => {
      const m = svg.getScreenCTM();
      const r = el.getBoundingClientRect();
      if (!m) return { x, y };
      const pt = new DOMPoint(x, y).matrixTransform(m);
      return { x: pt.x - r.left, y: pt.y - r.top };
    };
    const path = { u: 0 };
    const loop = gsap.to(path, { u: 1, duration: 4.2, ease: "none", repeat: -1 });
    const pos = M336_BLOBS.map(() => ({ x: M336_VB.w / 2, y: M336_VB.h / 2 }));
    let t = 0;
    tickWhile(loop, onClean, (dt) => {
      t += dt;
      const a = path.u * Math.PI * 2;
      const fx = M336_VB.w / 2 + 470 * Math.sin(a);
      const fy = M336_VB.h / 2 + 95 * Math.sin(a * 2);
      const fr = toRoot(fx, fy);
      const p = read(fr);
      gsap.set(ring, { x: p.x, y: p.y, opacity: p.real ? 0 : 1 });
      const target = toSvg(p.x, p.y);
      M336_BLOBS.forEach((b, i) => {
        const wob = Math.sin(t * (1.3 + i * 0.4) + i) * 14;
        const tx = target.x + b.ox + wob;
        const ty = target.y + b.oy + Math.cos(t * (1.1 + i * 0.3) + i) * 12;
        const k = 1 - Math.exp(-dt * b.k);
        pos[i].x += (tx - pos[i].x) * k;
        pos[i].y += (ty - pos[i].y) * k;
        circles[i].setAttribute("cx", pos[i].x.toFixed(1));
        circles[i].setAttribute("cy", pos[i].y.toFixed(1));
        circles[i].setAttribute("r", (b.r * (1 + 0.08 * Math.sin(t * 2.1 + i))).toFixed(1));
      });
    });
    return loop;
  });
  const cx = M336_VB.w / 2;
  const cy = M336_VB.h / 2;
  return (
    <Stage r={root} g1="rgba(255,154,92,.5)" g2="rgba(79,141,255,.24)">
      <div className="absolute inset-0 grid place-items-center">
        <svg ref={svgRef} viewBox={`0 0 ${M336_VB.w} ${M336_VB.h}`} className="h-[86%] w-full" preserveAspectRatio="xMidYMid meet" aria-label={M336_WORD} role="img">
          <defs>
            <filter id={`${uid}-goo`} x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="9" />
              <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8" />
            </filter>
            <mask id={`${uid}-mask`} maskUnits="userSpaceOnUse" x="0" y="0" width={M336_VB.w} height={M336_VB.h}>
              <rect width={M336_VB.w} height={M336_VB.h} fill="black" />
              <g filter={`url(#${uid}-goo)`}>
                {M336_BLOBS.map((b, i) => (
                  <circle key={i} className="m336-b" cx={cx + b.ox} cy={cy + b.oy} r={b.r} fill="white" />
                ))}
              </g>
            </mask>
            <linearGradient id={`${uid}-ink`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#ffe1c9" />
              <stop offset=".5" stopColor={ACC} />
              <stop offset="1" stopColor="#ff6a3d" />
            </linearGradient>
          </defs>
          <text className="m336-t" x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize="200" fontWeight="800" fill="none" stroke="rgba(234,245,255,.6)" strokeWidth="1.2" style={{ fontFamily: F.sy }}>
            {M336_WORD}
          </text>
          <text className="m336-t" x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize="200" fontWeight="800" fill={`url(#${uid}-ink)`} mask={`url(#${uid}-mask)`} style={{ fontFamily: F.sy }}>
            {M336_WORD}
          </text>
        </svg>
      </div>
      <p className="absolute bottom-5 left-6 text-[13px] uppercase tracking-[0.18em] text-white/65">Fountain pen ink · iron gall · 50 ml · ₹1,100</p>
      <span className="m336-ring pointer-events-none absolute left-0 top-0 z-30 -ml-[14px] -mt-[14px] h-[28px] w-[28px] rounded-full border-2 border-white bg-white/10 opacity-0" aria-hidden />
    </Stage>
  );
}

/* ───────────────────────── M337 · Intro with animated variable font (play, wght + wdth axes) ───────────────────────── */
const M337_WORD = "Halden";
const M337_LOGO = 0.26;
function M337() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const word = el.querySelector<HTMLElement>(".m337-word")!;
    const parts = gsap.utils.toArray<HTMLElement>(".m337-s", el);
    const ax = { w: 400, d: 100 };
    const apply = () => {
      word.style.fontVariationSettings = `"wght" ${ax.w.toFixed(0)}, "wdth" ${ax.d.toFixed(1)}`;
    };
    // fit by measuring: the widest state (heavy, normal width) stays ≤ 60 % of the stage
    gsap.set(word, { y: 0, scale: 1 });
    ax.w = 700;
    apply();
    const rw = el.getBoundingClientRect().width;
    const fs = parseFloat(getComputedStyle(word).fontSize);
    if (word.offsetWidth > rw * 0.6) word.style.fontSize = `${(fs * rw * 0.6) / word.offsetWidth}px`;
    ax.w = 400;
    apply();
    const b = rel(word, el);
    const Y = el.getBoundingClientRect().height / 2 - b.y - b.h / 2;
    const tl = gsap.timeline({ repeat: -1, onRepeat: apply });
    tl.set(word, { y: Y, scale: 1 });
    tl.set(parts, { opacity: 0, y: 24 });
    for (let k = 0; k < 3; k++) {
      tl.to(ax, { w: 700, duration: 0.34, ease: "sine.inOut", onUpdate: apply }); // thin → heavy
      tl.to(ax, { d: 75, duration: 0.3, ease: "sine.inOut", onUpdate: apply }); // → condensed
      tl.to(ax, { w: 400, d: 100, duration: 0.34, ease: "sine.inOut", onUpdate: apply }); // → back to thin, wide
    }
    tl.to(ax, { w: 620, d: 88, duration: 0.35, ease: "sine.out", onUpdate: apply }); // settle
    tl.to(word, { y: 0, scale: M337_LOGO, duration: 0.8, ease: "power2.inOut" });
    tl.to(parts, { opacity: 1, y: 0, duration: 0.55, ease: "power2.out", stagger: 0.08 }, "<0.35");
    tl.to(parts, { opacity: 0, y: -14, duration: 0.35, ease: "power1.in", stagger: 0.03 }, ">0.25");
    tl.to(word, { y: Y, scale: 1, duration: 0.6, ease: "power2.inOut" }, "<0.1");
    tl.to(ax, { w: 400, d: 100, duration: 0.6, ease: "power2.inOut", onUpdate: apply }, "<");
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,154,92,.42)" g2="rgba(79,141,255,.22)">
      <div className="absolute inset-x-0 top-[5%] z-10 flex justify-center">
        <h3
          className="m337-word whitespace-nowrap text-[clamp(120px,14vw,220px)] leading-[1] tracking-[-0.02em]"
          style={{ fontFamily: F.ins, fontVariationSettings: '"wght" 620, "wdth" 88', transform: `scale(${M337_LOGO})`, transformOrigin: "50% 0" }}
        >
          {M337_WORD}
        </h3>
      </div>
      <div className="m337-s absolute inset-x-[5%] top-[7%] flex justify-between text-[13px] uppercase tracking-[0.2em] text-white/70" style={{ fontFamily: F.mr }}>
        <span>Chairs · Tables · Lights</span>
        <span>Journal · Cart (0)</span>
      </div>
      <div className="absolute inset-x-[5%] bottom-[10%] flex items-end justify-between gap-10">
        <div>
          <p className="m337-s text-[13px] uppercase tracking-[0.24em] text-[#ff9a5c]">Autumn edit</p>
          <p className="m337-s mt-4 max-w-[12ch] text-[clamp(48px,5.4vw,86px)] leading-[0.98] tracking-[-0.02em]" style={{ fontFamily: F.fr }}>
            Furniture, made slow.
          </p>
        </div>
        <div className="m337-s w-[min(30%,340px)] rounded-[20px] border border-white/15 bg-white/[0.04] p-5">
          <div className="h-[120px] rounded-[14px] bg-[radial-gradient(70%_80%_at_40%_40%,rgba(255,154,92,.55),rgba(10,15,28,0)_70%),linear-gradient(135deg,#1b2233,#0d1220)]" />
          <p className="mt-4 text-[15px]" style={{ fontFamily: F.mr }}>
            Oak lounge chair
          </p>
          <p className="mt-1 text-[13px] text-white/60">₹38,500</p>
        </div>
      </div>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M326", name: "Font swap rollover", how: "Hover: the letters flip one by one into a serif italic in the accent colour, then back on leave · auto pointer", kind: "play", C: M326 },
  { code: "M327", name: "Gradient clip scroll read", how: "A soft bright-to-muted gradient front sweeps through the paragraph line by line, lighting the copy as you read · scrubbed", kind: "scrub", C: M327 },
  { code: "M328", name: "Hero words blur-in + framing lines", how: "Frame lines draw from the corners and corner dots pop while the headline words rise out of blur · loops", kind: "play", C: M328 },
  { code: "M329", name: "Highlight chars 3D drop-in", how: "Only the highlight words' letters drop from z 300 and rotationX -45 to flat, one by one; the paragraph stays still · loops", kind: "play", C: M329 },
  { code: "M330", name: "Highlight chars glow", how: "Key words inside calm body copy light up letter by letter with a warm glow and brightness, then dim · loops", kind: "play", C: M330 },
  { code: "M331", name: "Highlight chars swell", how: "Letters of the key phrase swell to 1.45 one after another and settle, a wave that leads the eye · loops", kind: "play", C: M331 },
  { code: "M332", name: "Highlight word grows in paragraph", how: "One word grows to 2.4× inside the paragraph (Flip on a class change) while the rest blurs and shrinks, then returns · loops", kind: "play", C: M332 },
  { code: "M333", name: "Hover-highlighted word", how: "The word under the pointer turns accent with a sliding underline while the rest dims · auto pointer walks the key words", kind: "play", C: M333 },
  { code: "M334", name: "Hyper text scramble on hover", how: "The uppercase word scrambles for ~0.8 s and resolves left to right, on load and on every hover · auto pointer", kind: "play", C: M334 },
  { code: "M335", name: "Infinite text with scroll parallax", how: "Endless text strips behind and in front of the can slide at three speeds and directions · scrubbed", kind: "scrub", C: M335 },
  { code: "M336", name: "Ink-blot hover text reveal", how: "A gooey ink-blot mask follows the pointer over an outlined word, revealing the solid ink fill · auto path", kind: "play", C: M336 },
  { code: "M337", name: "Intro with animated variable font", how: "The intro word cycles thin → heavy → condensed three times, settles into the logo and the page appears · loops", kind: "play", C: M337 },
];
