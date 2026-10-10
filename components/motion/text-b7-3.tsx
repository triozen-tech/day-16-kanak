"use client";

// Text motions, batch 7 · group 3 (MOTION-MENU M314–M325). Small focused demos for /lab/motion, rebuilt in GSAP / CSS / SVG from the idea only.
// Every demo: plays by itself on screen (or follows the scroll), loops, has a CSS glow loop that never stops,
// and shows a sensible final state in ?static=1 / reduced motion.
import { useEffect, useId, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, SplitText, prefersReducedMotion } from "@/lib/gsap";
import { scene, useScrub } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = { sg: "Space Grotesk Variable", fr: "Fraunces Variable", is: "Instrument Serif", sy: "Syne Variable", mr: "Manrope Variable" };
const ACC = "#ffb347";

const GRAIN = `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .55 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>',
)}")`;

const CSS = `
.b7g3-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 32% 38%,var(--g1,rgba(255,179,71,.42)),transparent 70%),radial-gradient(34% 40% at 70% 66%,var(--g2,rgba(79,141,255,.22)),transparent 70%);animation:b7g3-drift 6s linear infinite alternate;will-change:transform}
.b7g3-top{position:absolute;inset:-25%;pointer-events:none;mix-blend-mode:screen;opacity:.45;background:radial-gradient(30% 36% at 35% 40%,var(--g1,rgba(255,179,71,.5)),transparent 70%);animation:b7g3-drift 5s linear infinite alternate-reverse;z-index:30}
@keyframes b7g3-drift{0%{transform:translate3d(-7%,-5%,0) scale(1)}100%{transform:translate3d(7%,6%,0) scale(1.15)}}
.m321-orbit{transform-style:preserve-3d;transform:rotateX(12deg) rotateY(-18deg);animation:m321-orbit 5.5s cubic-bezier(.4,0,.6,1) infinite alternate}
@keyframes m321-orbit{0%{transform:rotateX(16deg) rotateY(-30deg)}50%{transform:rotateX(-4deg) rotateY(0deg)}100%{transform:rotateX(14deg) rotateY(30deg)}}
.m321-tilt{transform-style:preserve-3d;transform:rotateX(var(--py,0deg)) rotateY(var(--px,0deg));transition:transform .35s ease-out}
.m321-off .m321-orbit,.m324-off .m324-grain{animation-play-state:paused}
.m324-grain{position:absolute;inset:-50%;background-image:${GRAIN};opacity:.16;animation:m324-grain .8s steps(4) infinite}
@keyframes m324-grain{0%{transform:translate(0,0)}25%{transform:translate(-4%,3%)}50%{transform:translate(3%,-5%)}75%{transform:translate(-2%,-2%)}100%{transform:translate(4%,4%)}}
html.is-static .b7g3-glow,html.is-static .b7g3-top,html.is-static .m321-orbit,html.is-static .m324-grain{animation:none}
html.is-static {.b7g3-glow,.b7g3-top,.m321-orbit,.m324-grain{animation:none}.m321-tilt{transition:none}}
`;

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). `top` adds a second glow above covering content. */
function Stage({ r, children, className = "", g1, g2, top }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string; top?: boolean }) {
  const vars = { "--g1": g1, "--g2": g2 } as CSSProperties;
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0f1c] text-[#eaf5ff] ${className}`}>
      <style href="b7g3-css" precedence="default">
        {CSS}
      </style>
      <div className="b7g3-glow" style={vars} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
      {top && <div className="b7g3-top" style={vars} aria-hidden />}
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

/** Toggles a class on the root while it is off screen (pauses its CSS loops). */
function useOffClass(ref: RefObject<HTMLElement | null>, cls: string) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => el.classList.toggle(cls, !e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, cls]);
}

/* ───────────────────────── M314 · Chars spread from centre (scrub, SplitText) ───────────────────────── */
function M314() {
  const root = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLHeadingElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const chars = useRef<HTMLElement[]>([]);
  const last = useRef(1);
  const apply = (p: number) => {
    const cs = chars.current;
    const c = (cs.length - 1) / 2;
    cs.forEach((el, i) => gsap.set(el, { x: (i - c) * 150 * (1 - p), opacity: 0.2 + 0.8 * p }));
    if (bar.current) bar.current.style.transform = `scaleX(${p})`;
  };
  useEffect(() => {
    const h = head.current;
    if (!h || prefersReducedMotion()) return;
    let dead = false;
    let split: SplitText | null = null;
    document.fonts.ready.then(() => {
      if (dead) return;
      split = SplitText.create(h, { type: "chars" });
      chars.current = split.chars as HTMLElement[];
      apply(last.current);
    });
    return () => {
      dead = true;
      chars.current = [];
      split?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useScrub(
    root,
    (p) => {
      last.current = p; // linear over the whole panel: fully spread at the top, the word closes exactly at the end
      apply(p);
    },
    { finalValue: 1 },
  );
  return (
    <Stage r={root} g1="rgba(255,179,71,.4)" g2="rgba(79,141,255,.22)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center">
          <p className="text-[13px] uppercase tracking-[0.24em] text-white/60">Coastal collection</p>
          <h3 ref={head} className="mt-5 whitespace-nowrap text-[clamp(64px,6.4vw,104px)] font-[800] uppercase leading-none tracking-[-0.01em]" style={{ fontFamily: F.sy }}>
            Driftwood
          </h3>
          <p className="mt-7 text-[15px] text-white/70" style={{ fontFamily: F.mr }}>
            Reclaimed teak side table · ₹14,900
          </p>
        </div>
      </div>
      <span className="absolute bottom-6 left-6 block h-px w-[180px] bg-white/15">
        <span ref={bar} className="absolute inset-0 origin-left bg-[#ffb347]" />
      </span>
    </Stage>
  );
}

/* ───────────────────────── M315 · Decode-hold-encode loop (play, ScrambleText) ───────────────────────── */
const M315_WORDS = ["Encrypted", "Private", "Sealed"];
const GLYPHS = "▓▒░<>/\\#*+=%$&@";
const glyphs = (n: number) => Array.from({ length: n }, () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]).join("");
function M315() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const w = el.querySelector<HTMLElement>(".m315-w")!;
    const st = el.querySelector<HTMLElement>(".m315-st")!;
    const bar = el.querySelector<HTMLElement>(".m315-bar")!;
    w.textContent = glyphs(M315_WORDS[0].length);
    const tl = gsap.timeline({ repeat: -1 });
    M315_WORDS.forEach((word, i) => {
      const next = M315_WORDS[(i + 1) % M315_WORDS.length];
      tl.call(() => (st.textContent = "Decoding"));
      tl.to(w, { duration: 0.9, ease: "none", scrambleText: { text: word, chars: GLYPHS, speed: 0.8, revealDelay: 0.15 } });
      tl.call(() => (st.textContent = "Readable"));
      // the hold: the word stays readable while a progress line runs (never a still frame)
      tl.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 1, ease: "none", immediateRender: false });
      tl.call(() => (st.textContent = "Encrypting"));
      tl.to(w, { duration: 0.55, ease: "none", scrambleText: { text: glyphs(next.length), chars: GLYPHS, speed: 1, revealDelay: 0 } });
      tl.set(bar, { scaleX: 0 });
    });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(120,255,190,.32)" g2="rgba(79,141,255,.26)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center">
          <p className="text-[13px] uppercase tracking-[0.24em] text-[#8dffc8]">
            <span className="m315-st">Readable</span> · vault 07
          </p>
          <h3 className="m315-w mt-5 whitespace-nowrap text-[clamp(64px,7.4vw,120px)] font-[600] uppercase leading-none tracking-[0.02em]" style={{ fontFamily: F.sg }}>
            {M315_WORDS[0]}
          </h3>
          <span className="mx-auto mt-7 block h-[2px] w-[220px] bg-white/10">
            <span className="m315-bar block h-full origin-left bg-[#8dffc8]" />
          </span>
          <p className="mt-6 text-[15px] text-white/70" style={{ fontFamily: F.mr }}>
            Cloud backup · 2 TB plan · ₹249 / month
          </p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M316 · Depth hinge phrase flip (play, SplitText) ───────────────────────── */
const M316_PHRASES = ["Built to last.", "Made by hand.", "Priced fairly."];
function M316() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const phrases = gsap.utils.toArray<HTMLElement>(".m316-p", el);
    const splits = phrases.map((p) => SplitText.create(p, { type: "words,chars" }));
    onClean(() => splits.forEach((s) => s.revert()));
    const chars = splits.map((s) => s.chars as HTMLElement[]);
    gsap.set(chars.flat(), { transformPerspective: 700 });
    gsap.set(chars.slice(1).flat(), { rotationX: -90, opacity: 0 });
    gsap.set(phrases.slice(1), { visibility: "hidden" });
    const n = phrases.length;
    const tl = gsap.timeline({ repeat: -1 });
    for (let k = 0; k < n; k++) {
      const cur = k;
      const nxt = (k + 1) % n;
      const at = tl.duration() + 0.3; // short read, then the hinge
      tl.set(phrases[nxt], { visibility: "visible" }, at);
      // old phrase: each char hinges on its TOP edge until edge-on
      tl.to(chars[cur], { rotationX: 90, opacity: 0, transformOrigin: "50% 0%", duration: 0.5, ease: "power2.in", stagger: 0.03 }, at);
      // new phrase: chars swing in from the opposite (bottom) edge
      tl.fromTo(
        chars[nxt],
        { rotationX: -90, opacity: 0, transformOrigin: "50% 100%" },
        { rotationX: 0, opacity: 1, duration: 0.6, ease: "power2.out", stagger: 0.03, immediateRender: false },
        at + 0.18,
      );
      tl.set(phrases[cur], { visibility: "hidden" });
    }
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,179,71,.4)" g2="rgba(160,120,255,.22)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center">
          <p className="text-[13px] uppercase tracking-[0.24em] text-white/60">Walnut workshop</p>
          <div className="mt-5 grid place-items-center">
            {M316_PHRASES.map((p, i) => (
              <h3
                key={p}
                className="m316-p whitespace-nowrap text-[clamp(60px,6.6vw,108px)] font-[600] leading-[1.05] tracking-[-0.02em] [grid-area:1/1]"
                style={{ fontFamily: F.sg, visibility: i ? "hidden" : undefined }}
                aria-hidden={i > 0}
              >
                {p}
              </h3>
            ))}
          </div>
          <p className="mt-7 text-[15px] text-white/70" style={{ fontFamily: F.mr }}>
            Dining chair, solid walnut · ₹18,400
          </p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M317 · Depth parallax words (play, SplitText) ───────────────────────── */
const M317_Z = [-760, 380, -420, 300, -900, 420, -320];
function M317() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const h = el.querySelector<HTMLElement>(".m317-h")!;
    const split = SplitText.create(h, { type: "words" });
    onClean(() => split.revert());
    const words = split.words as HTMLElement[];
    const zOf = (i: number) => M317_Z[i % M317_Z.length];
    const tl = gsap.timeline({ repeat: -1 });
    tl.fromTo(words, { z: zOf, opacity: 0 }, { z: 0, opacity: 1, duration: 1.1, ease: "expo.out", stagger: 0.07, immediateRender: false });
    const inEnd = 1.1 + 0.07 * (words.length - 1);
    tl.to(words, { opacity: 0, z: -140, duration: 0.4, ease: "power2.in", stagger: 0.03 }, inEnd - 0.2);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,179,71,.38)" g2="rgba(79,141,255,.26)">
      <div className="absolute inset-0 grid place-items-center px-[8%]">
        <div className="text-center">
          <h3
            className="m317-h max-w-[15ch] text-[clamp(56px,6.4vw,104px)] leading-[1.04] tracking-[-0.02em]"
            style={{ fontFamily: F.fr, perspective: "800px", perspectiveOrigin: "50% 50%" }}
          >
            Sound that fills every room you own.
          </h3>
          <p className="mt-7 text-[13px] uppercase tracking-[0.22em] text-white/60">Room speaker, oak grille · ₹24,990</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M318 · Depth words (scale + blur) (play, SplitText) ───────────────────────── */
function M318() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const h = el.querySelector<HTMLElement>(".m318-h")!;
    const split = SplitText.create(h, { type: "words" });
    onClean(() => split.revert());
    const words = split.words as HTMLElement[];
    const tl = gsap.timeline({ repeat: -1 });
    tl.fromTo(
      words,
      { scale: 1.75, y: -22, opacity: 0, filter: "blur(14px)", transformOrigin: "50% 50%" },
      { scale: 1, y: 0, opacity: 1, filter: "blur(0px)", duration: 0.95, ease: "power2.out", stagger: 0.1, immediateRender: false },
    );
    tl.to(words, { opacity: 0, duration: 0.32, ease: "power1.in", stagger: 0.03 }, "+=0.2");
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,120,150,.36)" g2="rgba(255,179,71,.26)">
      <div className="absolute inset-0 grid place-items-center px-[8%]">
        <div className="text-center">
          <h3 className="m318-h max-w-[14ch] text-[clamp(56px,6.6vw,108px)] font-[700] leading-[1.02] tracking-[-0.025em]" style={{ fontFamily: F.mr }}>
            Closer than it ever looked.
          </h3>
          <p className="mt-7 text-[13px] uppercase tracking-[0.22em] text-white/60">Field binoculars 10×42 · ₹11,200</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M319 · Directional reveal (play) ───────────────────────── */
const M319_BLOCKS = [
  { dir: "up", arrow: "↑", lines: ["Fresh from", "the kiln."], p: "Stoneware mug · ₹890", from: { yPercent: 100 }, out: { yPercent: -100 } },
  { dir: "down", arrow: "↓", lines: ["Poured by", "hand daily."], p: "Soy candle · ₹1,150", from: { yPercent: -100 }, out: { yPercent: 100 } },
  { dir: "left", arrow: "←", lines: ["Woven on", "wooden looms."], p: "Cotton throw · ₹3,600", from: { xPercent: 100 }, out: { xPercent: -100 } },
  { dir: "right", arrow: "→", lines: ["Dyed with", "marigold."], p: "Linen napkins · ₹1,480", from: { xPercent: -100 }, out: { xPercent: 100 } },
];
function M319() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const blocks = gsap.utils.toArray<HTMLElement>(".m319-b", el);
    const tl = gsap.timeline({ repeat: -1 });
    blocks.forEach((b, i) => {
      const lines = b.querySelectorAll(".m319-l");
      const d = M319_BLOCKS[i];
      tl.fromTo(lines, { xPercent: 0, yPercent: 0, ...d.from }, { xPercent: 0, yPercent: 0, duration: 0.7, ease: "power2.out", stagger: 0.12, immediateRender: false }, i * 0.14);
    });
    const inEnd = tl.duration();
    blocks.forEach((b, i) => {
      const lines = b.querySelectorAll(".m319-l");
      tl.to(lines, { ...M319_BLOCKS[i].out, duration: 0.45, ease: "power2.in", stagger: 0.08 }, inEnd + 0.25 + i * 0.06);
    });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,179,71,.4)" g2="rgba(120,200,160,.22)">
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-px p-[4%]">
        {M319_BLOCKS.map((b) => (
          <div key={b.dir} className="m319-b flex flex-col justify-center border-white/10 px-[8%]" style={{ fontFamily: F.is }}>
            <p className="mb-3 text-[13px] uppercase tracking-[0.22em] text-[#ffb347]" style={{ fontFamily: F.sg }}>
              {b.arrow} {b.dir}
            </p>
            {b.lines.map((l) => (
              <span key={l} className="block overflow-hidden">
                <span className="m319-l block whitespace-nowrap text-[clamp(40px,4.4vw,72px)] leading-[1.05]">{l}</span>
              </span>
            ))}
            <p className="mt-3 text-[13px] uppercase tracking-[0.18em] text-white/60" style={{ fontFamily: F.sg }}>
              {b.p}
            </p>
          </div>
        ))}
      </div>
    </Stage>
  );
}

/* ───────────────────────── M320 · Distributed letters to image (play, SplitText + auto click) ───────────────────────── */
const M320_PANELS = [
  { t: "Saffron hour", p: "Tea set · ₹2,350", img: 3 },
  { t: "Blue monsoon", p: "Glass carafe · ₹1,690", img: 0 },
  { t: "Rose garden", p: "Bud vase · ₹980", img: 1 },
];
function M320() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const panels = gsap.utils.toArray<HTMLElement>(".m320-panel", el);
    const imgs = panels.map((p) => p.querySelector<HTMLElement>(".m320-img")!);
    const subs = panels.map((p) => p.querySelector<HTMLElement>(".m320-sub")!);
    const ring = el.querySelector<HTMLElement>(".m320-ring")!;
    const splits = subs.map((s) => SplitText.create(s, { type: "chars" }));
    onClean(() => splits.forEach((s) => s.revert()));
    const chars = splits.map((s) => s.chars as HTMLElement[]);
    const R = gsap.utils.random;
    const tl = gsap.timeline({ repeat: -1 });
    panels.forEach((panel, k) => {
      const W = imgs[k].offsetWidth;
      const H = imgs[k].offsetHeight;
      const cx = panel.offsetLeft + panel.offsetWidth / 2;
      const cy = panel.offsetTop + H * 0.5;
      // fake pointer walks to the panel and "clicks"
      tl.to(ring, { x: cx, y: cy, opacity: 1, duration: 0.45, ease: "power2.inOut" });
      tl.addLabel(`p${k}`);
      tl.to(ring, { scale: 0.65, duration: 0.14, yoyo: true, repeat: 1, ease: "power1.inOut" });
      // the other panels' images drift away, the chosen one leans in
      imgs.forEach((im, j) => {
        if (j === k) tl.to(im, { scale: 1.05, x: 0, y: 0, opacity: 1, duration: 0.8, ease: "power2.inOut" }, `p${k}`);
        else tl.to(im, { x: (j < k ? -1 : 1) * 70, y: j % 2 ? 40 : -40, scale: 0.9, opacity: 0.22, duration: 0.8, ease: "power2.inOut" }, `p${k}`);
      });
      subs.forEach((s, j) => j !== k && tl.to(s, { opacity: 0.2, duration: 0.4 }, `p${k}`));
      // letters scatter to random spots around the image (scale 1.1–2.1) …
      tl.set(chars[k], { x: () => R(-W * 0.6, W * 0.6), y: () => R(-H * 1.05, -H * 0.1), scale: () => R(1.1, 2.1), opacity: 0 }, `p${k}`);
      tl.to(chars[k], { opacity: 1, duration: 0.22, stagger: 0.012 }, `p${k}`);
      // … then converge into the subtitle line
      tl.to(chars[k], { x: 0, y: 0, scale: 1, duration: 0.95, ease: "power2.inOut", stagger: { each: 0.02, from: "random" } }, `p${k}+=0.3`);
      tl.to(imgs, { x: 0, y: 0, scale: 1, opacity: 1, duration: 0.5, ease: "power2.inOut" }, ">0.1");
      tl.to(subs, { opacity: 1, duration: 0.4 }, "<");
    });
    const click = (e: Event) => {
      const i = panels.indexOf(e.currentTarget as HTMLElement);
      if (i >= 0) tl.seek(`p${i}`);
    };
    panels.forEach((p) => p.addEventListener("click", click));
    onClean(() => panels.forEach((p) => p.removeEventListener("click", click)));
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,179,71,.42)" g2="rgba(79,141,255,.22)" top>
      <div className="absolute inset-0 grid grid-cols-3 items-center gap-[3%] px-[6%]">
        {M320_PANELS.map((p) => (
          <div key={p.t} className="m320-panel relative cursor-pointer" data-cursor="Open">
            <div className="m320-img aspect-[4/5] w-full overflow-hidden rounded-[18px] border border-white/10">
              <img src={scene(p.img, 640, 800)} alt="" className="h-full w-full object-cover" />
            </div>
            <p className="m320-sub mt-5 whitespace-nowrap text-center text-[clamp(28px,2.6vw,40px)] leading-none" style={{ fontFamily: F.is }}>
              {p.t}
            </p>
            <p className="mt-2 text-center text-[13px] uppercase tracking-[0.18em] text-white/60">{p.p}</p>
          </div>
        ))}
      </div>
      <span className="m320-ring pointer-events-none absolute left-0 top-0 -ml-[15px] -mt-[15px] h-[30px] w-[30px] rounded-full border-2 border-white opacity-0" aria-hidden />
    </Stage>
  );
}

/* ───────────────────────── M321 · Extruded layered depth type (play, CSS 3D) ───────────────────────── */
const M321_LAYERS = 16;
const M321_WORD = "BLOCK";
function M321() {
  const root = useRef<HTMLDivElement>(null);
  const tilt = useRef<HTMLDivElement>(null);
  useOffClass(root, "m321-off");
  useEffect(() => {
    const el = root.current;
    const t = tilt.current;
    if (!el || !t || prefersReducedMotion()) return;
    let idle = 0;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      t.style.setProperty("--px", `${((e.clientX - r.left) / r.width - 0.5) * 36}deg`);
      t.style.setProperty("--py", `${-((e.clientY - r.top) / r.height - 0.5) * 24}deg`);
      clearTimeout(idle);
      idle = window.setTimeout(() => {
        t.style.setProperty("--px", "0deg");
        t.style.setProperty("--py", "0deg");
      }, 1200);
    };
    el.addEventListener("pointermove", move);
    return () => {
      clearTimeout(idle);
      el.removeEventListener("pointermove", move);
    };
  }, []);
  const shade = (i: number) => gsap.utils.interpolate("#c4561c", "#2a0c03", i / (M321_LAYERS - 1));
  const cls = "whitespace-nowrap text-[clamp(110px,11vw,180px)] font-[800] leading-none tracking-[0.01em]";
  return (
    <Stage r={root} g1="rgba(255,140,70,.42)" g2="rgba(79,141,255,.22)">
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center" style={{ perspective: "1100px" }}>
          <div ref={tilt} className="m321-tilt">
            <div className="m321-orbit relative" style={{ fontFamily: F.sy }}>
              {Array.from({ length: M321_LAYERS - 1 }, (_, k) => M321_LAYERS - 1 - k).map((i) => (
                <span key={i} className={`absolute inset-0 ${cls}`} style={{ transform: `translateZ(${-i * 5}px)`, color: shade(i) }} aria-hidden>
                  {M321_WORD}
                </span>
              ))}
              <span className={`relative block text-[#ffe3c4] ${cls}`}>{M321_WORD}</span>
            </div>
          </div>
          <p className="mt-12 text-[13px] uppercase tracking-[0.22em] text-white/60">Terracotta planter block · ₹2,200</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M322 · Fill-up text loader (play, SVG clipPath wave) ───────────────────────── */
const M322_WORD = "BREWING";
const M322_P = 300; // wave period (svg units)
const M322_WAVE = (() => {
  let d = `M-${M322_P * 4} 0`;
  for (let x = -M322_P * 4; x < M322_P * 8; x += M322_P) d += ` q${M322_P / 4} -16 ${M322_P / 2} 0 t${M322_P / 2} 0`;
  return `${d} V900 H-${M322_P * 4} Z`;
})();
function M322() {
  const root = useRef<HTMLDivElement>(null);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  usePlay(root, (el, onClean) => {
    const svg = el.querySelector<SVGSVGElement>(".m322-svg")!;
    const txt = el.querySelector<SVGTextElement>(".m322-t")!;
    const rise = el.querySelector<SVGGElement>(".m322-rise")!;
    const wave = el.querySelector<SVGPathElement>(".m322-wave")!;
    const pct = el.querySelector<HTMLElement>(".m322-pct")!;
    const bar = el.querySelector<HTMLElement>(".m322-bar")!;
    // fit the word by measuring: the viewBox hugs the glyphs, the svg width caps it at ~70 % of the stage
    const bb = txt.getBBox();
    svg.setAttribute("viewBox", `${bb.x - 8} ${bb.y - 8} ${bb.width + 16} ${bb.height + 16}`);
    const bottom = bb.y + bb.height + 18;
    const top = bb.y - 18;
    const s = { p: 0, x: 0 };
    const draw = () => {
      rise.setAttribute("transform", `translate(0 ${(bottom + (top - bottom) * s.p).toFixed(2)})`);
      wave.setAttribute("transform", `translate(${s.x.toFixed(2)} 0)`);
      const v = Math.round(s.p * 100);
      pct.textContent = `${v}%`;
      bar.style.transform = `scaleX(${s.p})`;
    };
    const tl = gsap.timeline({ repeat: -1 });
    tl.fromTo(s, { p: 0 }, { p: 1, duration: 2.4, ease: "power1.inOut" });
    tl.to(s, { p: 0, duration: 0.55, ease: "power2.in" }, "+=0.2");
    // the wave top sways sideways all the time (one period per 1.1 s), only while the loop plays
    tickWhile(tl, onClean, (dt) => {
      s.x = (s.x - (dt * M322_P) / 1.1) % M322_P;
      draw();
    });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,179,71,.4)" g2="rgba(140,90,40,.3)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="flex w-full flex-col items-center text-center">
          <svg className="m322-svg block w-[min(70%,940px)] overflow-visible" viewBox="0 -10 1200 240" aria-label={M322_WORD}>
            <defs>
              <clipPath id={`m322c${uid}`}>
                <g className="m322-rise" transform="translate(0 -40)">
                  <path className="m322-wave" d={M322_WAVE} />
                </g>
              </clipPath>
            </defs>
            <text className="m322-t" x="600" y="190" textAnchor="middle" fontSize="180" fontWeight="800" fill="none" stroke="rgba(255,227,196,.55)" strokeWidth="2" style={{ fontFamily: F.sy }}>
              {M322_WORD}
            </text>
            <text x="600" y="190" textAnchor="middle" fontSize="180" fontWeight="800" fill={ACC} clipPath={`url(#m322c${uid})`} style={{ fontFamily: F.sy }} aria-hidden>
              {M322_WORD}
            </text>
          </svg>
          <div className="mt-8 flex items-center gap-4 text-[13px] uppercase tracking-[0.22em] text-white/65">
            <span>Cold brew concentrate · ₹540</span>
            <span className="relative block h-px w-[140px] bg-white/15">
              <span className="m322-bar absolute inset-0 origin-left bg-[#ffb347]" />
            </span>
            <span className="m322-pct w-[3.5em] text-left tabular-nums">100%</span>
          </div>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M323 · Fixed title letters scramble on section change (play, ScrambleText) ───────────────────────── */
const M323_SECTIONS = [
  { n: "Rooms", p: "Lake suite from ₹12,400 / night", img: 0 },
  { n: "Dining", p: "Seven-course tasting · ₹4,800", img: 3 },
  { n: "Spa", p: "Hot stone ritual · ₹6,200", img: 2 },
  { n: "Journeys", p: "Sunrise boat ride · ₹2,100", img: 1 },
];
function M323() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const col = el.querySelector<HTMLElement>(".m323-col")!;
    const title = el.querySelector<HTMLElement>(".m323-title")!;
    const idx = el.querySelector<HTMLElement>(".m323-idx")!;
    const n = M323_SECTIONS.length;
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(col, { yPercent: 0 });
    for (let k = 1; k <= n; k++) {
      const s = M323_SECTIONS[k % n];
      tl.to(col, { yPercent: -100 * k, duration: 0.85, ease: "power2.inOut" }, "+=0.25");
      // the fixed title re-scrambles to the arriving section's name as it settles
      tl.to(title, { duration: 0.7, ease: "none", scrambleText: { text: s.n, chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", speed: 0.7, revealDelay: 0.2 } }, "<0.35");
      tl.call(() => (idx.textContent = `0${(k % n) + 1} / 0${n}`), [], "<");
    }
    tl.set(col, { yPercent: 0 }); // the last panel is a copy of the first: seamless restart
    return tl;
  });
  const list = [...M323_SECTIONS, M323_SECTIONS[0]];
  return (
    <Stage r={root} g1="rgba(255,179,71,.42)" g2="rgba(79,141,255,.24)" top>
      <div className="absolute inset-0 overflow-hidden">
        <div className="m323-col relative h-full w-full">
          {list.map((s, i) => (
            <div key={i} className="absolute inset-x-0 h-full" style={{ top: `${i * 100}%` }} aria-hidden={i === list.length - 1}>
              <img src={scene(s.img, 1400, 800)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1c] via-[#0a0f1c]/30 to-[#0a0f1c]/60" />
              <p className="absolute bottom-[9%] right-[6%] text-[15px] uppercase tracking-[0.18em] text-white/80">{s.p}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute left-[5%] top-[8%] z-20">
        <p className="m323-idx text-[13px] uppercase tracking-[0.24em] text-[#ffb347]">01 / 04</p>
        <h3 className="m323-title mt-3 whitespace-nowrap text-[clamp(56px,6vw,96px)] font-[800] uppercase leading-none" style={{ fontFamily: F.sy }}>
          {M323_SECTIONS[0].n}
        </h3>
        <p className="mt-3 text-[13px] uppercase tracking-[0.22em] text-white/60">Lakeside retreat</p>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M324 · Flashlight text reveal (play, CSS mask + roaming light) ───────────────────────── */
function M324() {
  const root = useRef<HTMLDivElement>(null);
  useOffClass(root, "m324-off");
  usePlay(root, (el, onClean) => {
    const read = pointerSource(el, onClean);
    const s = { t: 0 };
    const roam = gsap.to(s, { t: Math.PI * 2, duration: 6, ease: "none", repeat: -1 });
    tickWhile(roam, onClean, () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      // lissajous path across the words
      const fake = { x: w * (0.5 + 0.36 * Math.sin(s.t)), y: h * (0.46 + 0.16 * Math.sin(s.t * 2 + 0.6)) };
      const p = read(fake);
      el.style.setProperty("--lx", `${p.x.toFixed(1)}px`);
      el.style.setProperty("--ly", `${p.y.toFixed(1)}px`);
    });
    onClean(() => {
      el.style.removeProperty("--lx");
      el.style.removeProperty("--ly");
    });
    return roam;
  });
  const words = (
    <div className="text-center">
      <h3 className="max-w-[13ch] text-[clamp(64px,7.4vw,120px)] leading-[1.02] tracking-[-0.02em]" style={{ fontFamily: F.fr }}>
        Light it after dark.
      </h3>
      <p className="mt-7 text-[15px] uppercase tracking-[0.2em]">Night-bloom candle · ₹1,480</p>
    </div>
  );
  const mask = "radial-gradient(circle 210px at var(--lx,50%) var(--ly,46%), #000 0%, rgba(0,0,0,.65) 45%, transparent 75%)";
  return (
    <Stage r={root} className="!bg-[#06080d]" g1="rgba(255,179,71,.3)" g2="rgba(79,141,255,.16)">
      <div className="absolute inset-0 overflow-hidden" aria-hidden>
        <div className="m324-grain" />
      </div>
      {/* the light itself on the surface */}
      <div
        className="pointer-events-none absolute inset-0 mix-blend-screen"
        style={{ background: "radial-gradient(circle 260px at var(--lx,50%) var(--ly,46%), rgba(255,200,130,.28), transparent 70%)" }}
        aria-hidden
      />
      {/* dim copy: almost invisible on the surface */}
      <div className="absolute inset-0 grid place-items-center px-[8%] text-white/[0.07]" aria-hidden>
        {words}
      </div>
      {/* bright copy, masked by the moving light */}
      <div className="absolute inset-0 grid place-items-center px-[8%] text-[#fff1d8]" style={{ maskImage: mask, WebkitMaskImage: mask }}>
        {words}
      </div>
    </Stage>
  );
}

/* ───────────────────────── M325 · Fluid ink morph text (play, SVG turbulence displacement) ───────────────────────── */
function M325() {
  const root = useRef<HTMLDivElement>(null);
  const uid = `m325f${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  usePlay(root, (el) => {
    const h = el.querySelector<HTMLElement>(".m325-h")!;
    const disp = el.querySelector<SVGFEDisplacementMapElement>(".m325-disp")!;
    const turb = el.querySelector<SVGFETurbulenceElement>(".m325-turb")!;
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(disp, { attr: { scale: 150 } });
    tl.set(turb, { attr: { baseFrequency: "0.02 0.035", seed: () => Math.round(Math.random() * 90) } });
    tl.set(h, { opacity: 0, color: "#7fd8ff" });
    tl.to(disp, { attr: { scale: 0 }, duration: 1.5, ease: "power1.out" }, 0);
    tl.to(h, { opacity: 1, duration: 0.6, ease: "power1.out" }, 0);
    tl.to(h, { color: "#f6eadb", duration: 1.6, ease: "sine.inOut" }, 0.1);
    tl.to(disp, { attr: { scale: 110 }, duration: 0.6, ease: "power1.in" }, ">");
    tl.to(h, { opacity: 0, duration: 0.6, ease: "power1.in" }, "<");
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(90,170,255,.52)" g2="rgba(255,179,71,.26)">
      <svg className="absolute h-0 w-0" aria-hidden>
        <filter id={uid} x="-20%" y="-40%" width="140%" height="180%">
          <feTurbulence className="m325-turb" type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="1" seed="7" result="n" />
          <feDisplacementMap className="m325-disp" in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center">
          <p className="text-[13px] uppercase tracking-[0.24em] text-white/60">Stationery atelier</p>
          <h3 className="m325-h mt-4 whitespace-nowrap text-[clamp(84px,9.6vw,156px)] leading-none tracking-[-0.01em] text-[#f6eadb]" style={{ fontFamily: F.is, filter: `url(#${uid})` }}>
            Ink &amp; Paper
          </h3>
          <p className="mt-7 text-[15px] text-white/70" style={{ fontFamily: F.mr }}>
            Fountain pen, iron-gall ink · ₹3,450
          </p>
        </div>
      </div>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M314", name: "Chars spread from centre", how: "Letters start pushed apart by their distance from the middle letter and close into the word as you scroll · scrubbed", kind: "scrub", C: M314 },
  { code: "M315", name: "Decode-hold-encode loop", how: "A word decodes from random glyphs, stays readable, then re-encrypts into glyphs and decodes the next word · loops", kind: "play", C: M315 },
  { code: "M316", name: "Depth hinge phrase flip", how: "Each letter hinges on its top edge to edge-on while the next phrase swings up from the bottom edge, 0.03 s apart · cycles", kind: "play", C: M316 },
  { code: "M317", name: "Depth parallax words", how: "Words start at different depths (some behind, some in front) and fly to the flat plane in real perspective · loops", kind: "play", C: M317 },
  { code: "M318", name: "Depth words (scale + blur)", how: "Words arrive from a bigger, blurred scale with a slight downward drift, as if from in front of the screen · loops", kind: "play", C: M318 },
  { code: "M319", name: "Directional reveal", how: "Lines slide out of their own masks from a chosen side: up, down, left or right, one direction per block · loops", kind: "play", C: M319 },
  { code: "M320", name: "Distributed letters to image", how: "A click scatters the panel's title letters around its image, then they gather into the line while the other images drift away · auto click", kind: "play", C: M320 },
  { code: "M321", name: "Extruded layered depth type", how: "Sixteen stacked copies of a word, each set further back and darker, form a solid block that slowly orbits (tilts to the pointer)", kind: "play", C: M321 },
  { code: "M322", name: "Fill-up text loader", how: "A liquid fill with a waving top edge rises inside an outlined word from 0 to 100 %, drains, and fills again · loops", kind: "play", C: M322 },
  { code: "M323", name: "Fixed title letters scramble on section change", how: "A fixed corner title scrambles to each new section's name as that section scrolls in · auto-scrolls", kind: "play", C: M323 },
  { code: "M324", name: "Flashlight text reveal", how: "Words hide on a dark grainy surface; a soft light circle reveals them and roams by itself (follows the pointer)", kind: "play", C: M324 },
  { code: "M325", name: "Fluid ink morph text", how: "Letters dissolve in from an ink-like turbulence displacement that settles to crisp, shifting from a blue tint to ink · loops", kind: "play", C: M325 },
];
