"use client";

// Text motions, batch 1 · group 4 (MOTION-MENU M111–M122). Small focused demos for /lab/motion.
// Every demo: plays by itself on screen (or follows the scroll), loops, has a CSS glow loop that never stops,
// and shows a sensible final state in ?static=1 / reduced motion.
import { Fragment, useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import type { Flip as FlipT } from "gsap/Flip";
import { gsap, SplitText, loadPlugin, prefersReducedMotion } from "@/lib/gsap";
import { scene, useScrub, useTicker } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = { sg: "Space Grotesk Variable", fr: "Fraunces Variable", is: "Instrument Serif", sy: "Syne Variable", mr: "Manrope Variable" };
const ACC = "#4f8dff";
const INK = "#eaf5ff";
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const CSS = `
.b1g4-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 32% 38%,var(--g1,rgba(79,141,255,.42)),transparent 70%),radial-gradient(34% 40% at 70% 66%,var(--g2,rgba(255,122,89,.2)),transparent 70%);animation:b1g4-drift 6s linear infinite alternate;will-change:transform}
@keyframes b1g4-drift{0%{transform:translate3d(-7%,-5%,0) scale(1)}100%{transform:translate3d(7%,6%,0) scale(1.15)}}
.m121-c{opacity:0;-webkit-background-clip:text;background-clip:text;color:transparent;background-repeat:no-repeat;animation:m121-pan 9s linear infinite alternate,m121-fade 9s linear infinite both}
@keyframes m121-pan{0%{background-size:165% auto;background-position:0% 35%}100%{background-size:128% auto;background-position:100% 65%}}
@keyframes m121-fade{0%{opacity:0}6%{opacity:1}33%{opacity:1}40%{opacity:0}100%{opacity:0}}
.m121-off .m121-c{animation-play-state:paused}
html.is-static .b1g4-glow,html.is-static .m121-c{animation:none}
html.is-static .m121-c1{opacity:1;background-size:140% auto;background-position:50% 50%}
html.is-static {
  .b1g4-glow,.m121-c{animation:none}
  .m121-c1{opacity:1;background-size:140% auto;background-position:50% 50%}
}
`;

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0f1c] text-[#eaf5ff] ${className}`}>
      <style href="b1g4-css" precedence="default">
        {CSS}
      </style>
      <div className="b1g4-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/**
 * "play" helper: waits for fonts (+ an optional plugin), builds the looping animation inside a gsap.context, plays it
 * only while the demo is on screen, and reverts everything on unmount. Nothing runs with prefersReducedMotion().
 */
function usePlay(
  ref: RefObject<HTMLElement | null>,
  build: (root: HTMLElement, onClean: (fn: () => void) => void) => gsap.core.Animation | void,
  pre?: () => Promise<unknown>,
) {
  const b = useRef(build);
  b.current = build;
  const p = useRef(pre);
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
    Promise.all([document.fonts?.ready, p.current?.()]).then(() => {
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

/* ───────────────────────── M111 · Headline splits in half (scrub) ───────────────────────── */
function M111() {
  const root = useRef<HTMLDivElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const bot = useRef<HTMLDivElement>(null);
  const mid = useRef<HTMLDivElement>(null);
  const cut = useRef<HTMLDivElement>(null);
  const labA = useRef<HTMLSpanElement>(null);
  const labB = useRef<HTMLSpanElement>(null);
  useScrub(
    root,
    (p) => {
      const el = root.current;
      if (!el) return;
      // first half: opens up/down and closes again; second half: opens diagonally (top-left / bottom-right) to the end
      const tri = (x: number) => (x < 0.6 ? x / 0.6 : 1 - (x - 0.6) / 0.4);
      const a = p < 0.5 ? tri(p / 0.5) : 0;
      const d = p >= 0.5 ? (p - 0.5) / 0.5 : 0;
      const open = Math.max(a, d);
      const H = el.clientHeight;
      const W = el.clientWidth;
      gsap.set(top.current, { y: -open * H * 0.24, x: -d * W * 0.12 });
      gsap.set(bot.current, { y: open * H * 0.24, x: d * W * 0.12 });
      gsap.set(mid.current, { opacity: open, scale: 0.86 + 0.14 * open });
      gsap.set(cut.current, { scaleX: open, rotation: d * -6 });
      if (labA.current) labA.current.style.opacity = p < 0.5 ? "1" : "0.35";
      if (labB.current) labB.current.style.opacity = p >= 0.5 ? "1" : "0.35";
    },
    { finalValue: 1 },
  );
  const head = (r: RefObject<HTMLDivElement | null>, clip: string) => (
    <div ref={r} className="absolute inset-0 z-10 grid place-items-center" style={{ clipPath: clip }}>
      <h3 className="whitespace-nowrap text-[clamp(64px,11vw,176px)] font-[800] uppercase leading-none tracking-[-0.03em]" style={{ fontFamily: F.sy }}>
        Open Air
      </h3>
    </div>
  );
  return (
    <Stage r={root}>
      <div ref={cut} className="absolute left-[8%] right-[8%] top-1/2 h-px origin-center bg-[#4f8dff]" aria-hidden />
      <div ref={mid} className="absolute inset-0 grid place-items-center text-center" style={{ opacity: 0 }}>
        <div>
          <p className="text-[13px] uppercase tracking-[0.24em] text-white/60">Festival of design · 14–16 March</p>
          <p className="mt-3 text-[clamp(22px,2.2vw,32px)] font-[500]" style={{ fontFamily: F.fr }}>
            Three days, forty studios, one open hall.
          </p>
          <span className="mt-5 inline-block rounded-full bg-[#4f8dff] px-6 py-3 text-[15px] font-[650] text-[#05080f]">Passes from ₹1,499</span>
        </div>
      </div>
      {head(top, "inset(0 0 50% 0)")}
      {head(bot, "inset(50% 0 0 0)")}
      <p className="absolute bottom-5 left-6 flex gap-4 text-[13px] uppercase tracking-[0.18em]">
        <span ref={labA}>↕ up / down</span>
        <span ref={labB} style={{ opacity: 0.35 }}>
          ⤡ top-left / bottom-right
        </span>
      </p>
    </Stage>
  );
}

/* ───────────────────────── M112 · Inline image text reveal (scrub) ───────────────────────── */
type Tok = string | { img: number };
const M112_TOKS: Tok[] = [
  ..."We roast in small batches".split(" "),
  { img: 3 },
  ..."from farms we know by name".split(" "),
  { img: 1 },
  ..."and ship within 48 hours".split(" "),
  { img: 0 },
  ..."to your door. ₹640 a bag.".split(" "),
];
function M112() {
  const root = useRef<HTMLDivElement>(null);
  const els = useRef<(HTMLSpanElement | null)[]>([]);
  useScrub(
    root,
    (p) => {
      const N = M112_TOKS.length;
      M112_TOKS.forEach((t, i) => {
        const el = els.current[i];
        if (!el) return;
        const l = clamp01(p * N - i);
        if (typeof t === "string") el.style.opacity = String(0.16 + 0.84 * l);
        else {
          el.style.width = `${l * 2.6}em`;
          el.style.marginInline = `${l * 0.14}em`;
          const img = el.firstElementChild as HTMLElement | null;
          if (img) img.style.scale = String(1.45 - 0.45 * l);
        }
      });
    },
    { finalValue: 1 },
  );
  return (
    <Stage r={root} g2="rgba(224,145,63,.24)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <p className="max-w-[1080px] text-center text-[clamp(30px,3.7vw,56px)] leading-[1.28] tracking-[-0.01em]" style={{ fontFamily: F.fr }}>
          {M112_TOKS.map((t, i) => {
            const next = M112_TOKS[i + 1];
            const space = next !== undefined && typeof next === "string" ? " " : "";
            return typeof t === "string" ? (
              <Fragment key={i}>
                <span ref={(n) => void (els.current[i] = n)} style={{ opacity: 0.16 }}>
                  {t}
                </span>
                {space}
              </Fragment>
            ) : (
              <Fragment key={i}>
                <span
                  ref={(n) => void (els.current[i] = n)}
                  className="relative inline-block h-[0.84em] overflow-hidden rounded-full align-[-0.1em]"
                  style={{ width: 0 }}
                  aria-hidden
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={scene(t.img, 520, 200)} alt="" className="absolute inset-y-0 left-1/2 h-full w-[2.6em] max-w-none -translate-x-1/2 object-cover" />
                </span>{" "}
              </Fragment>
            );
          })}
        </p>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M113 · Kinetic centre build (play, Flip) ───────────────────────── */
const M113_WORDS = ["Made", "for", "the", "long", "run."];
let flip: typeof FlipT | null = null;
function M113() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(
    root,
    (el, onClean) => {
      const Flip = flip!;
      const words = gsap.utils.toArray<HTMLElement>(".m113-w", el);
      const bar = el.querySelector(".m113-bar");
      const last = words.length - 1;
      onClean(() => {
        gsap.killTweensOf(words);
        gsap.set(words, { clearProps: "all" });
      });
      const reset = () => {
        gsap.set(words, { x: 0, y: 0, opacity: 1, filter: "blur(0px)", color: INK, display: "inline-block" });
        gsap.set(words.slice(1), { display: "none" });
      };
      const add = (w: HTMLElement) => {
        const shown = words.filter((x) => x.style.display !== "none");
        const state = Flip.getState(shown);
        gsap.set(w, { display: "inline-block" });
        // existing words slide left (layout change animated by Flip) so the growing line stays centred
        Flip.from(state, { duration: 0.6, ease: "power3.inOut" });
        gsap.fromTo(w, { x: "0.9em", opacity: 0, filter: "blur(14px)" }, { x: 0, opacity: 1, filter: "blur(0px)", duration: 0.6, ease: "power3.out" });
      };
      const tl = gsap.timeline({ repeat: -1 });
      tl.call(reset, [], 0);
      tl.fromTo(words[0], { opacity: 0, scale: 0.9, filter: "blur(14px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.55, ease: "power3.out", immediateRender: false }, 0.01);
      for (let i = 1; i <= last; i++) tl.call(() => add(words[i]), [], 0.45 + (i - 1) * 0.62);
      const lock = 0.45 + (last - 1) * 0.62 + 0.62;
      tl.fromTo(bar, { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: 0.45, ease: "power3.inOut", immediateRender: false }, lock);
      tl.to(words[last], { color: ACC, duration: 0.3 }, lock);
      tl.to(words, { opacity: 0, y: -22, filter: "blur(10px)", duration: 0.42, stagger: 0.04, ease: "power2.in" }, lock + 0.75);
      tl.to(bar, { scaleX: 0, transformOrigin: "100% 50%", duration: 0.4, ease: "power2.in" }, lock + 0.75);
      return tl;
    },
    () => loadPlugin("Flip").then((f) => (flip = f)),
  );
  return (
    <Stage r={root}>
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative inline-flex flex-nowrap items-baseline justify-center gap-x-[0.26em] whitespace-nowrap text-[clamp(48px,7vw,112px)] font-[700] leading-none tracking-[-0.03em]" style={{ fontFamily: F.sy }}>
          {M113_WORDS.map((w, i) => (
            <span key={w} className="m113-w inline-block" style={i === M113_WORDS.length - 1 ? { color: ACC } : undefined}>
              {w}
            </span>
          ))}
          <span className="m113-bar absolute -bottom-[0.18em] left-0 right-0 h-[4px] rounded-full bg-[#4f8dff]" aria-hidden />
        </div>
      </div>
      <p className="absolute bottom-5 left-6 text-[13px] uppercase tracking-[0.18em] text-white/55">Trail runner · ₹8,990</p>
    </Stage>
  );
}

/* ───────────────────────── M114 · Letter roll-up on hover (play) ───────────────────────── */
const M114_WORDS = ["Shop", "Studio", "Journal"];
const M114_DIRS = ["↑ roll up from below", "↓ drop in from above"];
function M114() {
  const root = useRef<HTMLDivElement>(null);
  const ptr = useRef<HTMLDivElement>(null);
  const lab = useRef<HTMLSpanElement>(null);
  usePlay(root, (el, onClean) => {
    const words = gsap.utils.toArray<HTMLElement>(".m114-word", el);
    const stacks = words.map((w) => w.querySelectorAll<HTMLElement>(".m114-stack"));
    const r = el.getBoundingClientRect();
    const pts = words.map((w) => {
      const b = w.getBoundingClientRect();
      return { x: b.left - r.left + b.width * 0.6, y: b.top - r.top + b.height * 0.8 };
    });
    const roll = (yPercent: number) => ({ yPercent, duration: 0.42, ease: "power3.inOut", stagger: 0.02 });
    // real pointer still works
    words.forEach((w, i) => {
      const enter = () => gsap.to(stacks[i], { ...roll(-33.3333), overwrite: "auto" });
      const leave = () => gsap.to(stacks[i], { ...roll(0), overwrite: "auto" });
      w.addEventListener("mouseenter", enter);
      w.addEventListener("mouseleave", leave);
      onClean(() => {
        w.removeEventListener("mouseenter", enter);
        w.removeEventListener("mouseleave", leave);
      });
    });
    const n = words.length - 1;
    gsap.set(ptr.current, { xPercent: -50, yPercent: -50, x: pts[0].x - 140, y: pts[0].y + 70, opacity: 1 });
    const tl = gsap.timeline({ repeat: -1 });
    [-33.3333, 33.3333].forEach((target, d) => {
      tl.call(() => {
        if (lab.current) lab.current.textContent = M114_DIRS[d];
      });
      words.forEach((_, i) => {
        tl.to(ptr.current, { x: pts[i].x, y: pts[i].y, duration: 0.4, ease: "power2.inOut" });
        tl.to(stacks[i], roll(target), "-=0.12");
        if (i > 0) tl.to(stacks[i - 1], roll(0), "<");
      });
      tl.to(ptr.current, { x: pts[n].x + 140, y: pts[n].y + 70, duration: 0.4, ease: "power2.inOut" });
      tl.to(stacks[n], roll(0), "<");
      tl.to(ptr.current, { x: pts[0].x - 140, y: pts[0].y + 70, duration: 0.3, ease: "power1.inOut" });
    });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(79,141,255,.36)" g2="rgba(24,196,143,.18)">
      <div className="absolute inset-0 grid place-items-center">
        <nav className="flex gap-[0.7em] text-[clamp(44px,6.4vw,104px)] font-[600] tracking-[-0.02em]" style={{ fontFamily: F.sg }}>
          {M114_WORDS.map((w) => (
            <a key={w} href="#" onClick={(e) => e.preventDefault()} className="m114-word inline-flex" aria-label={w}>
              {w.split("").map((c, i) => (
                <span key={i} className="relative inline-block h-[1.1em] overflow-hidden" aria-hidden>
                  <span className="m114-stack relative block" style={{ top: "-1.1em" }}>
                    <span className="block h-[1.1em] leading-[1.1em] text-[#4f8dff]">{c}</span>
                    <span className="block h-[1.1em] leading-[1.1em]">{c}</span>
                    <span className="block h-[1.1em] leading-[1.1em] text-[#4f8dff]">{c}</span>
                  </span>
                </span>
              ))}
            </a>
          ))}
        </nav>
      </div>
      <div ref={ptr} className="pointer-events-none absolute left-0 top-0 grid h-8 w-8 place-items-center rounded-full border-2 border-white/80 opacity-0" aria-hidden>
        <span className="h-1.5 w-1.5 rounded-full bg-white" />
      </div>
      <p className="absolute bottom-5 left-6 text-[13px] uppercase tracking-[0.18em] text-white/70">
        <span ref={lab}>{M114_DIRS.join(" · ")}</span>
      </p>
    </Stage>
  );
}

/* ───────────────────────── M115 · Letter scroll reveal (scrub) ───────────────────────── */
function M115() {
  const root = useRef<HTMLDivElement>(null);
  const txt = useRef<HTMLParagraphElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const prog = useRef(0);
  useEffect(() => {
    const t = txt.current;
    if (!t) return;
    let dead = false;
    let split: SplitText | null = null;
    document.fonts.ready.then(() => {
      if (dead) return;
      split = SplitText.create(t, { type: "words,chars" });
      tl.current = gsap
        .timeline({ paused: true })
        .fromTo(split.chars, { opacity: 0.12, color: "#7d8bab", y: "0.14em" }, { opacity: 1, color: INK, y: 0, duration: 0.4, stagger: 0.035, ease: "none" });
      tl.current.progress(prog.current);
    });
    return () => {
      dead = true;
      tl.current?.kill();
      tl.current = null;
      split?.revert();
    };
  }, []);
  useScrub(
    root,
    (p) => {
      prog.current = p;
      tl.current?.progress(p);
    },
    { finalValue: 1 },
  );
  return (
    <Stage r={root} g1="rgba(79,141,255,.3)" g2="rgba(255,179,107,.2)">
      <div className="absolute inset-0 grid place-items-center px-[7%]">
        <div className="max-w-[1100px] text-center">
          <p className="mb-6 text-[13px] uppercase tracking-[0.24em] text-white/50">Atelier No. 4 · Eau de parfum</p>
          <p ref={txt} className="text-[clamp(34px,4.4vw,68px)] leading-[1.12]" style={{ fontFamily: F.is }}>
            Every bottle is filled by hand, sealed by hand and signed before it leaves the bench.
          </p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M116 · Line-by-line slide-left (play) ───────────────────────── */
const M116_DIRS = ["→ from left", "← from right"];
function M116() {
  const root = useRef<HTMLDivElement>(null);
  const para = useRef<HTMLParagraphElement>(null);
  const labs = useRef<(HTMLSpanElement | null)[]>([]);
  usePlay(root, () => {
    const lines = SplitText.create(para.current!, { type: "lines" }).lines;
    const tl = gsap.timeline({ repeat: -1 });
    [-1, 1].forEach((s, k) => {
      tl.call(() => labs.current.forEach((l, j) => l && (l.style.opacity = j === k ? "1" : "0.3")));
      tl.fromTo(lines, { x: s * 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.7, stagger: 0.1, ease: "power3.out", immediateRender: k === 0 });
      tl.to(lines, { x: -s * 40, opacity: 0, duration: 0.5, stagger: 0.1, ease: "power2.in" }, "+=0.3");
    });
    return tl;
  });
  return (
    <Stage r={root} g2="rgba(24,196,143,.18)">
      <div className="absolute inset-0 grid place-items-center px-[8%]">
        <div className="max-w-[920px]">
          <p className="mb-5 text-[13px] uppercase tracking-[0.24em] text-white/50">The linen edit · from ₹3,200</p>
          <p ref={para} className="text-[clamp(26px,2.7vw,40px)] font-[500] leading-[1.3] tracking-[-0.01em]" style={{ fontFamily: F.mr }}>
            Small-batch linen, cut in Jaipur and finished by hand. Every piece is washed twice for softness, pressed flat and folded into recycled paper. Ships in three days.
          </p>
        </div>
      </div>
      <p className="absolute bottom-5 left-6 flex gap-4 text-[13px] uppercase tracking-[0.18em]">
        {M116_DIRS.map((d, i) => (
          <span key={d} ref={(n) => void (labs.current[i] = n)}>
            {d}
          </span>
        ))}
      </p>
    </Stage>
  );
}

/* ───────────────────────── M117 · Marker highlight sweep (play) ───────────────────────── */
const M117_DIRS = [
  { n: "from left", o: "0% 50%", h: true },
  { n: "from right", o: "100% 50%", h: true },
  { n: "from top", o: "50% 0%", h: false },
  { n: "from bottom", o: "50% 100%", h: false },
];
function Hi({ children }: { children: ReactNode }) {
  return (
    <span className="m117-hw relative isolate inline-block whitespace-nowrap px-[0.08em]" style={{ color: "#0b0f1a" }}>
      <span className="m117-bar absolute inset-x-0 bottom-[0.04em] top-[0.14em] -z-10 rounded-[0.12em] bg-[#ffd84d]" aria-hidden />
      {children}
    </span>
  );
}
function M117() {
  const root = useRef<HTMLDivElement>(null);
  const lab = useRef<HTMLSpanElement>(null);
  usePlay(root, (el) => {
    const bars = gsap.utils.toArray<HTMLElement>(".m117-bar", el);
    const words = gsap.utils.toArray<HTMLElement>(".m117-hw", el);
    const tl = gsap.timeline({ repeat: -1 });
    M117_DIRS.forEach((d) => {
      tl.call(() => {
        if (lab.current) lab.current.textContent = d.n;
      });
      tl.set(bars, { transformOrigin: d.o, scaleX: d.h ? 0 : 1, scaleY: d.h ? 1 : 0, opacity: 1 });
      tl.set(words, { color: INK });
      tl.to(bars, { scaleX: 1, scaleY: 1, duration: 0.55, ease: "power3.inOut", stagger: 0.22 });
      tl.to(words, { color: "#0b0f1a", duration: 0.3, stagger: 0.22 }, "<0.2");
      tl.to(bars, { opacity: 0, duration: 0.3, ease: "power1.in" }, "+=0.3");
      tl.to(words, { color: INK, duration: 0.3 }, "<");
    });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,216,77,.22)" g2="rgba(79,141,255,.3)">
      <div className="absolute inset-0 grid place-items-center px-[7%]">
        <div className="max-w-[1100px] text-center">
          <p className="text-[clamp(32px,4.2vw,64px)] font-[650] leading-[1.25] tracking-[-0.02em]" style={{ fontFamily: F.mr }}>
            Cold-pressed every morning, <Hi>zero added sugar</Hi>, bottled in <Hi>glass</Hi> and at your door <Hi>by 8 am</Hi>.
          </p>
          <p className="mt-6 text-[15px] text-white/60">₹180 a bottle · six-pack ₹960</p>
        </div>
      </div>
      <p className="absolute bottom-5 left-6 text-[13px] uppercase tracking-[0.18em] text-white/70">
        Highlighter <span ref={lab} className="text-[#ffd84d]">from left · right · top · bottom</span>
      </p>
    </Stage>
  );
}

/* ───────────────────────── M118 · Marker highlight sweeps words (scrub) ───────────────────────── */
const M118_TEXT =
  "Halo is the sunscreen you actually want to wear. Mineral filters, no white cast, a finish that disappears in seconds. SPF 50, reef-safe and made for long days outdoors. ₹749 for 50 ml.";
const M118_WORDS = M118_TEXT.split(" ");
function M118() {
  const root = useRef<HTMLDivElement>(null);
  const els = useRef<(HTMLSpanElement | null)[]>([]);
  useScrub(
    root,
    (p) => {
      const N = M118_WORDS.length;
      els.current.forEach((el, i) => {
        if (!el) return;
        const l = clamp01(p * N - i);
        el.style.backgroundSize = `${l * 100}% 78%`;
        el.style.opacity = String(0.5 + 0.5 * l);
      });
    },
    { finalValue: 1 },
  );
  return (
    <Stage r={root} g1="rgba(79,141,255,.34)" g2="rgba(255,179,107,.22)">
      <div className="absolute inset-0 grid place-items-center px-[7%]">
        <p className="max-w-[1080px] text-[clamp(30px,3.5vw,52px)] leading-[1.32]" style={{ fontFamily: F.is }}>
          {M118_WORDS.map((w, i) => (
            <Fragment key={i}>
              <span
                ref={(n) => void (els.current[i] = n)}
                className="rounded-[0.08em] px-[0.04em]"
                style={{
                  backgroundImage: "linear-gradient(rgba(79,141,255,.62),rgba(79,141,255,.62))",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "0 82%",
                  backgroundSize: "0% 78%",
                  boxDecorationBreak: "clone",
                  WebkitBoxDecorationBreak: "clone",
                  opacity: 0.5,
                }}
              >
                {w}
              </span>{" "}
            </Fragment>
          ))}
        </p>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M119 · Mask-filled heading, word rise (play) ───────────────────────── */
const M119_LINES = [
  ["Into", "the"],
  ["wild", "blue"],
];
const M119_FILL = `linear-gradient(rgba(236,232,224,.42),rgba(236,232,224,.42)),radial-gradient(36% 55% at 22% 34%,rgba(255,122,89,.95),transparent 70%),radial-gradient(40% 60% at 78% 64%,rgba(79,141,255,.95),transparent 70%),url("${scene(0, 1600, 700)}")`;
function M119() {
  const root = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLHeadingElement>(null);
  const size = useRef({ w: 0, h: 0 });
  // measure each word's place in the heading so one big fill (scaled 1.25) reads continuous across all words
  useEffect(() => {
    const h = head.current;
    if (!h) return;
    let dead = false;
    const measure = () => {
      if (dead) return;
      const hr = h.getBoundingClientRect();
      size.current = { w: hr.width, h: hr.height };
      h.style.setProperty("--bw", `${hr.width * 1.25}px`);
      h.style.setProperty("--bh", `${hr.height * 1.25}px`);
      h.style.setProperty("--dx", `${-hr.width * 0.125}px`);
      h.style.setProperty("--dy", `${-hr.height * 0.125}px`);
      h.querySelectorAll<HTMLElement>(".m119-w").forEach((w) => {
        const r = w.getBoundingClientRect();
        // words may be mid-rise: offsetTop is transform-free, use it for y
        w.style.setProperty("--ox", `${r.left - hr.left}px`);
        w.style.setProperty("--oy", `${(w.parentElement?.offsetTop ?? 0) + w.offsetTop}px`);
      });
    };
    document.fonts.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => {
      dead = true;
      window.removeEventListener("resize", measure);
    };
  }, []);
  useTicker(root, (t) => {
    const h = head.current;
    const { w, h: hh } = size.current;
    if (!h || !w) return;
    h.style.setProperty("--dx", `${-w * 0.125 + Math.sin(t * 0.42) * w * 0.1}px`);
    h.style.setProperty("--dy", `${-hh * 0.125 + Math.cos(t * 0.31) * hh * 0.1}px`);
  });
  usePlay(root, (el) => {
    const words = gsap.utils.toArray<HTMLElement>(".m119-w", el);
    const tl = gsap.timeline({ repeat: -1 });
    tl.fromTo(words, { yPercent: 115 }, { yPercent: 0, duration: 1, stagger: 0.08, ease: "power3.out" });
    tl.to(words, { yPercent: -115, duration: 0.6, stagger: 0.06, ease: "power3.in" }, "+=0.3");
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(79,141,255,.26)" g2="rgba(255,122,89,.16)">
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <h3 ref={head} className="relative text-[clamp(60px,9.5vw,156px)] font-[800] uppercase leading-[0.92] tracking-[-0.03em]" style={{ fontFamily: F.sy }}>
            {M119_LINES.map((line, li) => (
              <span key={li} className="relative block overflow-hidden pb-[0.06em]">
                {line.map((w, wi) => (
                  <Fragment key={w}>
                    <span
                      className="m119-w relative inline-block"
                      style={{
                        backgroundImage: M119_FILL,
                        backgroundSize: "var(--bw,125%) var(--bh,125%)",
                        backgroundPosition: "calc(var(--dx,0px) - var(--ox,0px)) calc(var(--dy,0px) - var(--oy,0px))",
                        backgroundRepeat: "no-repeat",
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        color: "transparent",
                      }}
                    >
                      {w}
                    </span>
                    {wi < line.length - 1 ? " " : ""}
                  </Fragment>
                ))}
              </span>
            ))}
          </h3>
          <p className="mt-6 text-[13px] uppercase tracking-[0.24em] text-white/55">Coastal kayak tours · from ₹4,500</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M120 · One word in a sentence changes (scrub) ───────────────────────── */
const M120_OPTS = ["early mornings", "long drives", "slow Sundays", "late deadlines", "all of you"];
function M120() {
  const root = useRef<HTMLDivElement>(null);
  const slot = useRef<HTMLSpanElement>(null);
  const col = useRef<HTMLSpanElement>(null);
  const rows = useRef<(HTMLSpanElement | null)[]>([]);
  const dots = useRef<(HTMLSpanElement | null)[]>([]);
  const widths = useRef<number[]>([]);
  const last = useRef(0);
  const apply = (p: number) => {
    last.current = p;
    const N = M120_OPTS.length;
    const x = p * (N - 1);
    const i = Math.min(N - 1, Math.floor(x));
    const f = x - i;
    const s = clamp01((f - 0.55) / 0.45);
    const e = s * s * (3 - 2 * s); // hold on each word, then slide to the next at the scroll step
    const pos = i + e;
    if (col.current) col.current.style.transform = `translateY(${-pos * 1.15}em)`;
    rows.current.forEach((r, k) => r && (r.style.opacity = String(clamp01(1 - Math.abs(pos - k) * 1.2))));
    const w = widths.current;
    if (slot.current && w.length) slot.current.style.width = `${w[i] + ((w[Math.min(N - 1, i + 1)] ?? w[i]) - w[i]) * e}px`;
    const on = Math.round(pos);
    dots.current.forEach((d, k) => d && (d.style.background = k === on ? ACC : "rgba(255,255,255,.22)"));
  };
  useEffect(() => {
    let dead = false;
    const measure = () => {
      if (dead) return;
      widths.current = rows.current.map((r) => (r?.firstElementChild as HTMLElement | null)?.offsetWidth ?? 0);
      apply(last.current);
    };
    document.fonts.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => {
      dead = true;
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useScrub(root, apply, { finalValue: 1 });
  return (
    <Stage r={root} g1="rgba(224,145,63,.3)" g2="rgba(79,141,255,.22)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center">
          <p className="text-[clamp(40px,5.4vw,88px)] font-[500] leading-[1.15] tracking-[-0.02em]" style={{ fontFamily: F.fr }}>
            Small-batch coffee,
            <br />
            roasted for{" "}
            <span ref={slot} className="relative inline-block h-[1.15em] overflow-hidden text-left align-bottom">
              <span ref={col} className="block w-max">
                {M120_OPTS.map((o, k) => (
                  <span key={o} ref={(n) => void (rows.current[k] = n)} className="block h-[1.15em] whitespace-nowrap leading-[1.15em]">
                    <span className="inline-block italic text-[#ffb36b]">{o}</span>
                  </span>
                ))}
              </span>
            </span>
            .
          </p>
          <div className="mt-8 flex justify-center gap-2">
            {M120_OPTS.map((o, k) => (
              <span key={o} ref={(n) => void (dots.current[k] = n)} className="h-2 w-8 rounded-full bg-white/20" />
            ))}
          </div>
          <p className="mt-4 text-[13px] uppercase tracking-[0.22em] text-white/50">House blend · 250 g · ₹540</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M121 · Panning image inside type (play, CSS) ───────────────────────── */
function M121() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    el.classList.add("m121-off");
    const io = new IntersectionObserver(([e]) => el.classList.toggle("m121-off", !e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const word = "Atlas";
  const cls = "absolute inset-0 grid place-items-center whitespace-nowrap";
  const type = "text-[clamp(110px,19vw,300px)] font-[800] uppercase leading-none tracking-[-0.04em]";
  // three photo copies crossfade every 3 s (negative delays line them up); each pans + scales inside the letters
  const delays = ["0s, -1s", "-3s, -7s", "-6s, -4s"];
  return (
    <Stage r={root} g1="rgba(24,196,143,.24)" g2="rgba(79,141,255,.24)">
      <div className="absolute inset-x-0 bottom-[16%] top-0">
        <div className={cls} aria-hidden>
          <span className={type} style={{ fontFamily: F.sy, color: "transparent", WebkitTextStroke: "1.5px rgba(234,245,255,.28)" }}>
            {word}
          </span>
        </div>
        {[2, 0, 3].map((img, k) => (
          <div key={k} className={cls} aria-hidden={k > 0}>
            <span className={`m121-c m121-c${k + 1} ${type}`} style={{ fontFamily: F.sy, backgroundImage: `url("${scene(img, 1200, 700)}")`, animationDelay: delays[k] }}>
              {word}
            </span>
          </div>
        ))}
      </div>
      <div className="absolute inset-x-6 bottom-6 flex items-end justify-between text-[13px] uppercase tracking-[0.2em] text-white/60">
        <span>Field guide No. 7 · 240 pages</span>
        <span className="text-[#eaf5ff]">₹2,400</span>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M122 · Paper-fold line unfold, top hinge (play) ───────────────────────── */
const M122_LINES = ["Tonight’s tasting menu:", "seven courses from", "the western coast,", "paired with natural wine."];
function M122() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const lines = gsap.utils.toArray<HTMLElement>(".m122-line", el);
    const creases = gsap.utils.toArray<HTMLElement>(".m122-crease", el);
    const tl = gsap.timeline({ repeat: -1 });
    tl.fromTo(lines, { rotationX: -92, transformOrigin: "50% 0%" }, { rotationX: 0, duration: 0.9, stagger: 0.14, ease: "power3.out" }, 0);
    tl.fromTo(creases, { opacity: 1 }, { opacity: 0, duration: 0.9, stagger: 0.14, ease: "power2.out" }, 0);
    tl.to(lines, { rotationX: -92, duration: 0.55, stagger: { each: 0.08, from: "end" }, ease: "power2.in" }, "+=0.3");
    tl.to(creases, { opacity: 1, duration: 0.55, stagger: { each: 0.08, from: "end" }, ease: "power2.in" }, "<");
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(224,145,63,.28)" g2="rgba(255,77,109,.16)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="rounded-[22px] border border-white/10 bg-[#0e1424]/80 px-[clamp(28px,4vw,64px)] py-[clamp(24px,4vh,48px)]">
          <p className="mb-4 text-[13px] uppercase tracking-[0.24em] text-[#ffb36b]">Saltwater Kitchen · Friday</p>
          <div style={{ perspective: "900px" }}>
            {M122_LINES.map((l) => (
              <div key={l} className="m122-line relative" style={{ backfaceVisibility: "hidden" }}>
                <p className="text-[clamp(32px,4.2vw,64px)] font-[500] leading-[1.14] tracking-[-0.015em]" style={{ fontFamily: F.fr }}>
                  {l}
                </p>
                <span className="m122-crease pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-black/25 to-transparent opacity-0" aria-hidden />
              </div>
            ))}
          </div>
          <p className="mt-5 text-[15px] text-white/65">₹4,800 per guest · wine pairing ₹2,200</p>
        </div>
      </div>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M111", name: "Headline splits in half", how: "Scroll: a headline cut into top/bottom halves slides apart (up/down, then diagonal) to open a gap with the next content.", kind: "scrub", C: M111 },
  { code: "M112", name: "Inline image text reveal", how: "Scroll: words light up in order and small inline photo pills grow from 0 to pill width as the reveal reaches them.", kind: "scrub", C: M112 },
  { code: "M113", name: "Kinetic centre build", how: "Auto: each new word blurs in from the right and pushes the others left (Flip) so the line stays centred, then locks.", kind: "play", C: M113 },
  { code: "M114", name: "Letter roll-up on hover", how: "Auto pointer hovers each link: letters roll up to an accent copy from below, next loop they drop in from above.", kind: "play", C: M114 },
  { code: "M115", name: "Letter scroll reveal", how: "Scroll: letter by letter the statement brightens from muted to white with a small lift.", kind: "scrub", C: M115 },
  { code: "M116", name: "Line-by-line slide-left", how: "Auto: each line slides in 40px from the side while fading (no mask), then flows out the other side; left then right.", kind: "play", C: M116 },
  { code: "M117", name: "Marker highlight sweep", how: "Auto: a yellow highlighter bar sweeps in behind chosen words, cycling from left, right, top and bottom.", kind: "play", C: M117 },
  { code: "M118", name: "Marker highlight sweeps words", how: "Scroll: a highlighter (background-size 0→100%) sweeps behind every word in reading order.", kind: "scrub", C: M118 },
  { code: "M119", name: "Mask-filled heading, word rise", how: "Auto: words of a photo/mesh-filled heading rise out of line masks; the fill keeps drifting inside the letters.", kind: "play", C: M119 },
  { code: "M120", name: "One word in a sentence changes", how: "Scroll: the keyword slides up and out at each scroll step and the next one slides in; the line re-centres.", kind: "scrub", C: M120 },
  { code: "M121", name: "Panning image inside type", how: "Auto (CSS): a photo pans and scales inside a giant word and crossfades to the next photo every 3 s.", kind: "play", C: M121 },
  { code: "M122", name: "Paper-fold line unfold (top hinge)", how: "Auto: each line swings down flat from a top hinge (rotateX -92° → 0) with a fading crease shadow.", kind: "play", C: M122 },
];
