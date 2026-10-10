"use client";

// Text motions, batch 7 · group 5 (MOTION-MENU M338–M349). Small focused demos for /lab/motion, rebuilt in GSAP / CSS / canvas
// from the idea only. Every demo: plays by itself on screen (or follows the scroll), loops, has a CSS glow loop that never
// stops, and shows a sensible final state in ?static=1 / reduced motion.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, SplitText, prefersReducedMotion } from "@/lib/gsap";
import { useScrub } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = { sg: "Space Grotesk Variable", fr: "Fraunces Variable", is: "Instrument Serif", sy: "Syne Variable", mr: "Manrope Variable" };
const ACC = "#ffa35c";

/* M346 text-shadow lists (same count in every keyframe so they interpolate) */
const M346_N = 6;
const m346Shadow = (step: number, a: number) =>
  Array.from({ length: M346_N }, (_, k) => `${-(k + 1) * step}px 0 ${Math.round(2 + k * 1.5)}px rgba(234,245,255,${((a * (M346_N - k)) / M346_N).toFixed(3)})`).join(",");
const M346_BIG = m346Shadow(26, 0.42);
const M346_ZERO = m346Shadow(0, 0);

const CSS = `
.b7g5-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 32% 38%,var(--g1,rgba(255,163,92,.42)),transparent 70%),radial-gradient(34% 40% at 70% 66%,var(--g2,rgba(79,141,255,.22)),transparent 70%);animation:b7g5-drift 6s linear infinite alternate;will-change:transform}
.b7g5-top{mix-blend-mode:screen;opacity:.45;z-index:5}
@keyframes b7g5-drift{0%{transform:translate3d(-7%,-5%,0) scale(1)}100%{transform:translate3d(7%,6%,0) scale(1.15)}}
.m338-caret{animation:none}
.m339-stack{transform-style:preserve-3d;transition:transform 1s cubic-bezier(.6,0,.3,1)}
.m339-c{transform:translateZ(calc(var(--i) * -2px));transition:transform 1s cubic-bezier(.6,0,.3,1);transition-delay:calc(var(--i) * 30ms)}
.m339-w.on .m339-stack,.m339-w:hover .m339-stack{transform:rotateX(16deg) rotateY(-26deg)}
.m339-w.on .m339-c,.m339-w:hover .m339-c{transform:translateZ(calc(var(--i) * -42px)) translate(calc(var(--i) * 3px),calc(var(--i) * -2px))}
.m345-base,.m345-leak{grid-area:1/1}
.m345-leak{color:transparent;-webkit-background-clip:text;background-clip:text;background-size:300% 300%;background-repeat:no-repeat;background-position:0% 0%;animation:m345-wash var(--d,5.4s) linear infinite;animation-delay:var(--dl,0s)}
.m345-soft{animation:m345-soft 5.4s linear infinite}
@keyframes m345-wash{0%{background-position:110% 110%}100%{background-position:-10% -10%}}
@keyframes m345-soft{0%{transform:translate3d(-60%,-50%,0)}100%{transform:translate3d(60%,50%,0)}}
.m345-off .m345-leak,.m345-off .m345-soft,.m346-off .m346-w{animation-play-state:paused}
.m346-w{grid-area:1/1;visibility:hidden;animation:m346-run 2.7s linear infinite both}
.m346-w.first{visibility:visible}
.m346-w:nth-child(2){animation-delay:.9s}
.m346-w:nth-child(3){animation-delay:1.8s}
@keyframes m346-run{
0%{visibility:visible;opacity:0;transform:translateX(-62vw) skewX(-10deg);text-shadow:${M346_BIG};animation-timing-function:cubic-bezier(.15,.75,.25,1)}
3%{opacity:1}
13%{visibility:visible;opacity:1;transform:translateX(0) skewX(0);text-shadow:${M346_ZERO};animation-timing-function:linear}
28%{visibility:visible;opacity:1;transform:translateX(1.6vw) skewX(0);text-shadow:${M346_ZERO};animation-timing-function:cubic-bezier(.6,0,.9,.45)}
36%{visibility:visible;opacity:0;transform:translateX(62vw) skewX(10deg);text-shadow:${M346_BIG}}
36.1%{visibility:hidden;opacity:0;transform:translateX(62vw)}
100%{visibility:hidden;opacity:0;transform:translateX(62vw)}}
html.is-static .b7g5-glow,html.is-static .m345-leak,html.is-static .m345-soft,html.is-static .m346-w{animation:none}
html.is-static .m339-stack,html.is-static .m339-c{transition:none}
html.is-static {.b7g5-glow,.m345-leak,.m345-soft,.m346-w{animation:none}.m339-stack,.m339-c{transition:none}}
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
      <style href="b7g5-css" precedence="default">
        {CSS}
      </style>
      <div className="b7g5-glow" style={vars} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
      {top && <div className="b7g5-glow b7g5-top" style={vars} aria-hidden />}
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

/** Toggles a class on the element while it is off screen (pauses CSS-only loops). */
function useOffClass(ref: RefObject<HTMLElement | null>, cls: string) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => el.classList.toggle(cls, !e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, cls]);
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

/* ───────────────────────── M338 · Irregular human typewriter (play, gsap) ───────────────────────── */
const M338_TEXT = "Slow coffee, roasted fast.";
function M338() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const chars = gsap.utils.toArray<HTMLElement>(".m338-c", el);
    const caret = el.querySelector<HTMLElement>(".m338-caret")!;
    const right = (i: number) => (i < 0 ? 0 : chars[i].offsetLeft + chars[i].offsetWidth);
    gsap.set(caret, { left: 0 });
    const rand = rng(338);
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(chars, { visibility: "hidden" }, 0).set(caret, { x: 0, opacity: 1 }, 0);
    let t = 0.12;
    chars.forEach((c, i) => {
      tl.set(c, { visibility: "visible" }, t).set(caret, { x: right(i) }, t);
      const ch = M338_TEXT[i];
      const r = rand();
      // human rhythm: quick bursts, normal keys, and short thinking pauses after commas / some spaces
      let d = r < 0.3 ? 0.035 + r * 0.05 : 0.07 + r * 0.09;
      if (ch === ",") d = 0.28;
      else if (ch === " " && r > 0.55) d = 0.2;
      t += d;
    });
    // caret blinks at the end of the line (changes every 0.22 s), then a quick backspace run clears it
    for (let k = 0; k < 4; k++) {
      t += 0.22;
      tl.set(caret, { opacity: k % 2 === 0 ? 0 : 1 }, t);
    }
    t += 0.22;
    tl.set(caret, { opacity: 1 }, t);
    for (let i = chars.length - 1; i >= 0; i--) {
      t += 0.022;
      tl.set(chars[i], { visibility: "hidden" }, t).set(caret, { x: right(i - 1) }, t);
    }
    tl.to({}, { duration: 0.15 }, t);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,163,92,.4)" g2="rgba(79,141,255,.2)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div>
          <p className="mb-6 text-[13px] uppercase tracking-[0.22em] text-white/55">Roastery journal · No. 14</p>
          <div className="m338-line relative inline-block whitespace-pre text-[clamp(44px,4.4vw,72px)] font-[500] leading-none tracking-[-0.01em]" style={{ fontFamily: F.sg }}>
            {M338_TEXT.split("").map((c, i) => (
              <span key={i} className="m338-c">
                {c}
              </span>
            ))}
            <span
              className="m338-caret absolute top-[0.06em] ml-[0.06em] inline-block h-[0.95em] w-[0.5em] bg-[#ffa35c]"
              style={{ left: "100%" }}
              aria-hidden
            />
          </div>
          <p className="mt-8 text-[13px] uppercase tracking-[0.22em] text-white/60">Single-origin beans · 250 g · ₹780</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M339 · Layered depth text (play, CSS 3D + timed hover) ───────────────────────── */
const M339_N = 8;
function M339() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const w = el.querySelector<HTMLElement>(".m339-w")!;
    // the hover state toggles by itself for filming (transition 1 s + 0.21 s copy delay, toggled every 1.3 s)
    const tl = gsap.timeline({ repeat: -1 });
    tl.call(() => w.classList.add("on"), [], 0)
      .call(() => w.classList.remove("on"), [], 1.3)
      .to({}, { duration: 1.3 }, 1.3);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,163,92,.42)" g2="rgba(130,110,255,.24)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center">
          <div className="m339-w inline-block cursor-default" style={{ perspective: "1100px" }}>
            <div className="m339-stack relative">
              {Array.from({ length: M339_N }, (_, i) => (
                <span
                  key={i}
                  className={`m339-c block whitespace-nowrap text-[clamp(80px,9.5vw,156px)] font-[800] uppercase leading-[0.95] tracking-[-0.01em] ${i ? "absolute inset-0" : "relative"}`}
                  style={
                    {
                      fontFamily: F.sy,
                      "--i": i,
                      color: i === 0 ? "#eaf5ff" : `rgba(255,${163 - i * 10},${92 + i * 12},${(0.95 - (i / M339_N) * 0.82).toFixed(2)})`,
                    } as CSSProperties
                  }
                  aria-hidden={i > 0}
                >
                  Strata
                </span>
              ))}
            </div>
          </div>
          <p className="mt-10 text-[13px] uppercase tracking-[0.22em] text-white/60">Layered shell jacket · 3 plies · ₹11,900</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M340 · Layered stroke letters (play, DrawSVG) ───────────────────────── */
// Block letters H E L M as closed outlines on a 100-unit grid.
const M340_LETTERS = [
  "M0 0H22V39H58V0H80V100H58V61H22V100H0Z",
  "M0 0H74V21H22V39H62V60H22V79H74V100H0Z",
  "M0 0H22V79H72V100H0Z",
  "M0 100V0H22L40 36L58 0H80V100H58V44L40 78L22 44V100Z",
];
const M340_X = [0, 104, 200, 294];
const M340_LAYERS = [
  { c: "#ff5c8a", d: -10 },
  { c: "#ffa35c", d: -6.5 },
  { c: "#5cc8ff", d: -3 },
  { c: "#eaf5ff", d: 0 },
];
function M340() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const layers = M340_LAYERS.map((_, k) => gsap.utils.toArray<SVGPathElement>(`.m340-l${k} path`, el));
    const fill = el.querySelector<SVGGElement>(".m340-fill")!;
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(layers.flat(), { drawSVG: "0%" }, 0).set(fill, { opacity: 0 }, 0);
    layers.forEach((paths, k) => {
      tl.to(paths, { drawSVG: "100%", duration: 0.85, ease: "power1.inOut", stagger: 0.09 }, 0.1 + k * 0.3);
    });
    tl.to(fill, { opacity: 1, duration: 0.5, ease: "sine.inOut" }, ">-0.15");
    tl.to(layers.flat(), { drawSVG: "100% 100%", duration: 0.55, ease: "power1.in", stagger: 0.015 }, "+=0.2");
    tl.to(fill, { opacity: 0, duration: 0.45, ease: "sine.in" }, "<0.2");
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,120,150,.36)" g2="rgba(92,200,255,.26)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="grid w-[min(62%,820px)] place-items-center">
          <svg viewBox="-24 -24 422 152" className="w-full overflow-visible" aria-label="Helm">
            {M340_LAYERS.map((l, k) => (
              <g key={k} className={`m340-l${k}`} transform={`translate(${l.d} ${l.d})`} fill="none" stroke={l.c} strokeWidth={2.2} strokeLinejoin="round">
                {M340_LETTERS.map((d, i) => (
                  <path key={i} d={d} transform={`translate(${M340_X[i]} 0)`} />
                ))}
              </g>
            ))}
            <g className="m340-fill" fill="#eaf5ff">
              {M340_LETTERS.map((d, i) => (
                <path key={i} d={d} transform={`translate(${M340_X[i]} 0)`} />
              ))}
            </g>
          </svg>
          <p className="mt-10 text-[13px] uppercase tracking-[0.22em] text-white/60">Helm Outfitters · sailing smock · ₹12,400</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M341 · LED lightboard scroll (play, canvas 2D) ───────────────────────── */
const M341_MSG = "NOW BOARDING · PLATFORM 4 · OVERNIGHT COACH TO THE HILLS · ₹1,850 ·";
const M341_ROWS = 15;
function M341() {
  const root = useRef<HTMLDivElement>(null);
  const cvs = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = root.current;
    const canvas = cvs.current;
    if (!el || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const still = prefersReducedMotion();
    let dead = false;
    let on = false;
    let W = 0;
    let H = 0;
    let pitch = 10;
    let cols = 0;
    let total = 1;
    let bits = new Uint8Array(0);
    let dot: HTMLCanvasElement | null = null;
    let lastCol = -1;

    const build = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      if (!W || !H) return;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pitch = H / M341_ROWS;
      cols = Math.ceil(W / pitch);
      // rasterise the message by measuring it at 8 px per LED cell, then sample each cell
      const S = 8;
      const off = document.createElement("canvas");
      const oc = off.getContext("2d", { willReadFrequently: true })!;
      const font = `700 ${Math.round(M341_ROWS * S * 0.62)}px "${F.sg}", sans-serif`;
      oc.font = font;
      const textW = Math.ceil(oc.measureText(M341_MSG).width);
      const msgCols = Math.ceil(textW / S) + 2;
      total = msgCols + Math.ceil(cols * 0.35); // a gap after the message
      off.width = msgCols * S;
      off.height = M341_ROWS * S;
      oc.font = font;
      oc.fillStyle = "#fff";
      oc.textBaseline = "middle";
      oc.fillText(M341_MSG, S, (M341_ROWS * S) / 2 + S * 0.4);
      const data = oc.getImageData(0, 0, off.width, off.height).data;
      bits = new Uint8Array(total * M341_ROWS);
      for (let c = 0; c < msgCols; c++)
        for (let r = 0; r < M341_ROWS; r++) {
          let sum = 0;
          for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) sum += data[((r * S + y) * off.width + c * S + x) * 4 + 3];
          bits[c * M341_ROWS + r] = sum / (S * S * 255) > 0.38 ? 1 : 0;
        }
      // one glowing LED sprite, reused for every lit dot
      const g = Math.ceil(pitch * 2);
      dot = document.createElement("canvas");
      dot.width = dot.height = g * 2;
      const dc = dot.getContext("2d")!;
      const rg = dc.createRadialGradient(g, g, 0, g, g, g);
      rg.addColorStop(0, "rgba(255,240,210,1)");
      rg.addColorStop(0.16, "rgba(255,190,110,1)");
      rg.addColorStop(0.26, "rgba(255,150,60,.55)");
      rg.addColorStop(0.6, "rgba(255,120,40,.12)");
      rg.addColorStop(1, "rgba(255,120,40,0)");
      dc.fillStyle = rg;
      dc.fillRect(0, 0, g * 2, g * 2);
      lastCol = -1;
    };

    const draw = (offset: number) => {
      if (!W || !dot) return;
      ctx.clearRect(0, 0, W, H);
      const rad = pitch * 0.32;
      const g = dot.width / 2;
      ctx.fillStyle = "rgba(255,170,90,.09)";
      for (let c = 0; c < cols; c++)
        for (let r = 0; r < M341_ROWS; r++) {
          if (bits[((c + offset) % total) * M341_ROWS + r]) continue;
          ctx.beginPath();
          ctx.arc(c * pitch + pitch / 2, r * pitch + pitch / 2, rad, 0, Math.PI * 2);
          ctx.fill();
        }
      ctx.globalCompositeOperation = "lighter";
      for (let c = 0; c < cols; c++)
        for (let r = 0; r < M341_ROWS; r++)
          if (bits[((c + offset) % total) * M341_ROWS + r]) ctx.drawImage(dot, c * pitch + pitch / 2 - g, r * pitch + pitch / 2 - g);
      ctx.globalCompositeOperation = "source-over";
    };

    const io = new IntersectionObserver(([e]) => (on = e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    const ro = new ResizeObserver(() => {
      if (dead) return;
      build();
      draw(0);
    });
    let t0 = 0;
    const tick = (time: number) => {
      if (!on || !W) return;
      const col = Math.floor((time - t0) * 17) % total; // steps one LED column at a time, like a station sign
      if (col !== lastCol) {
        lastCol = col;
        draw(col);
      }
    };
    document.fonts.ready.then(() => {
      if (dead) return;
      build();
      draw(0);
      ro.observe(canvas);
      if (!still) {
        t0 = gsap.ticker.time;
        gsap.ticker.add(tick);
      }
    });
    return () => {
      dead = true;
      io.disconnect();
      ro.disconnect();
      gsap.ticker.remove(tick);
    };
  }, []);
  return (
    <Stage r={root} g1="rgba(255,150,60,.42)" g2="rgba(79,141,255,.2)" top>
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="w-[min(86%,1120px)]">
          <div className="mb-4 flex items-center justify-between text-[13px] uppercase tracking-[0.22em] text-white/55">
            <span>Departures · Gate B</span>
            <span>23:40</span>
          </div>
          <div className="rounded-[18px] border border-white/10 bg-[#07090f] p-[2.2%] shadow-[inset_0_0_40px_rgba(0,0,0,.8)]">
            <canvas ref={cvs} className="block h-[clamp(160px,30vh,280px)] w-full" aria-label={M341_MSG} />
          </div>
        </div>
      </div>
      <Caption>Night coach · sleeper berth · ₹1,850</Caption>
    </Stage>
  );
}

/* ───────────────────────── M342 · Letters repel from cursor (play, SplitText + spring + auto pointer) ───────────────────────── */
function M342() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const head = el.querySelector<HTMLElement>(".m342-h")!;
    const dot = el.querySelector<HTMLElement>(".m342-dot")!;
    const split = SplitText.create(head, { type: "chars" });
    onClean(() => split.revert());
    const chars = split.chars as HTMLElement[];
    const st = chars.map(() => ({ x: 0, y: 0, vx: 0, vy: 0 }));
    const set = chars.map((c) => ({ x: gsap.quickSetter(c, "x", "px"), y: gsap.quickSetter(c, "y", "px"), r: gsap.quickSetter(c, "rotation", "deg") }));
    const read = pointerSource(el, onClean);
    const fake = { u: 0 };
    const sweep = gsap.to(fake, { u: 1, duration: 3.2, ease: "sine.inOut", repeat: -1, yoyo: true });
    tickWhile(sweep, onClean, (dt) => {
      const rr = el.getBoundingClientRect();
      const hr = head.getBoundingClientRect();
      const ox = hr.left - rr.left;
      const oy = hr.top - rr.top;
      const fx = ox - hr.width * 0.04 + fake.u * hr.width * 1.08;
      const fy = oy + hr.height * (0.5 + 0.34 * Math.sin(fake.u * Math.PI * 4));
      const p = read({ x: fx, y: fy });
      gsap.set(dot, { x: p.x, y: p.y, opacity: p.real ? 0 : 1 });
      const R = hr.height * 1.25;
      const sub = dt / 2;
      chars.forEach((c, i) => {
        const cx = ox + c.offsetLeft + c.offsetWidth / 2;
        const cy = oy + c.offsetTop + c.offsetHeight / 2;
        const dx = cx - p.x;
        const dy = cy - p.y;
        const d = Math.max(1, Math.hypot(dx, dy));
        const f = Math.max(0, 1 - d / R);
        const push = f * f * hr.height * 0.55;
        const tx = (dx / d) * push;
        const ty = (dy / d) * push;
        const s = st[i];
        for (let k = 0; k < 2; k++) {
          s.vx += ((tx - s.x) * 160 - s.vx * 15) * sub;
          s.vy += ((ty - s.y) * 160 - s.vy * 15) * sub;
          s.x += s.vx * sub;
          s.y += s.vy * sub;
        }
        set[i].x(s.x);
        set[i].y(s.y);
        set[i].r(s.x * 0.18);
      });
    });
    return sweep;
  });
  return (
    <Stage r={root} g1="rgba(255,163,92,.52)" g2="rgba(79,141,255,.24)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center">
          <p className="mb-6 text-[13px] uppercase tracking-[0.22em] text-white/55">Field journal · Volume 03</p>
          <h3 className="m342-h relative whitespace-nowrap text-[clamp(84px,10vw,168px)] font-[800] leading-none tracking-[-0.02em]" style={{ fontFamily: F.sy }}>
            Wildwood
          </h3>
          <p className="mt-8 text-[13px] uppercase tracking-[0.22em] text-white/60">Camp blanket · merino wool · ₹6,800</p>
        </div>
      </div>
      <span className="m342-dot pointer-events-none absolute left-0 top-0 -ml-[8px] -mt-[8px] h-[16px] w-[16px] rounded-full border-2 border-white bg-white/30 opacity-0" aria-hidden />
    </Stage>
  );
}

/* ───────────────────────── M343 · Letters rotate by distance to centre (scrub) ───────────────────────── */
const M343_LINES = ["Grown slow", "on high hills,", "picked by hand", "rolled at dawn,", "dried in shade", "sealed by noon."];
function M343() {
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
      // linear over the whole panel: the column travels from just below centre to just above it
      const y = gsap.utils.interpolate(H * 0.56, H * 0.44 - L, p);
      l.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
      let n = 0;
      l.querySelectorAll<HTMLElement>(".m343-line").forEach((line) => {
        const c = y + line.offsetTop + line.offsetHeight / 2;
        const d = gsap.utils.clamp(-1, 1, (c - H / 2) / (H / 2));
        line.querySelectorAll<HTMLElement>(".m343-c").forEach((ch) => {
          const sign = n % 2 ? -1 : 1;
          const amt = 0.65 + ((n * 37) % 10) / 28;
          ch.style.transform = `rotate(${(d * 15 * sign * amt).toFixed(2)}deg) scale(${(1 - 0.5 * Math.abs(d)).toFixed(3)})`;
          n++;
        });
      });
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    },
    { finalValue: 0.5 },
  );
  return (
    <Stage r={root} g1="rgba(160,220,120,.32)" g2="rgba(255,163,92,.26)">
      <div ref={stage} className="absolute inset-0 overflow-hidden">
        <span className="absolute left-[6%] right-[6%] top-1/2 h-px bg-white/10" aria-hidden />
        <div ref={list} className="absolute inset-x-0 top-0 text-center will-change-transform" style={{ fontFamily: F.fr }}>
          {M343_LINES.map((line, li) => (
            <div key={li} className="m343-line py-[0.12em] text-[clamp(48px,5.4vw,88px)] leading-[1.05] tracking-[-0.01em]">
              {line.split(" ").map((w, wi) => (
                <span key={wi} className={`inline-block whitespace-nowrap ${wi < line.split(" ").length - 1 ? "mr-[0.28em]" : ""}`}>
                  {w.split("").map((c, ci) => (
                    <span key={ci} className="m343-c inline-block" style={{ transformOrigin: "50% 60%" }}>
                      {c}
                    </span>
                  ))}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-5 left-6 flex items-center gap-4 text-[13px] uppercase tracking-[0.18em] text-white/65">
        <span>First-flush oolong · 100 g · ₹1,240</span>
        <span className="relative block h-px w-[160px] bg-white/15">
          <span ref={bar} className="absolute inset-0 origin-left bg-[#ffa35c]" style={{ transform: "scaleX(0)" }} />
        </span>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M344 · Letters slide in from spacing (play, SplitText) ───────────────────────── */
function M344() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const head = el.querySelector<HTMLElement>(".m344-h")!;
    const sub = el.querySelector<HTMLElement>(".m344-sub")!;
    const split = SplitText.create(head, { type: "chars" });
    onClean(() => split.revert());
    const chars = split.chars as HTMLElement[];
    const tl = gsap.timeline({ repeat: -1 });
    tl.fromTo(chars, { x: -20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: "power2.out", stagger: 0.065 }, 0);
    tl.fromTo(sub, { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" }, ">-0.3");
    tl.to(chars, { opacity: 0, x: 14, duration: 0.32, ease: "power1.in", stagger: 0.022 }, "+=0.25");
    tl.to(sub, { opacity: 0, duration: 0.3, ease: "power1.in" }, "<");
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,200,140,.38)" g2="rgba(79,141,255,.2)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center">
          <h3 className="m344-h whitespace-nowrap text-[clamp(64px,7.4vw,120px)] font-[500] leading-none tracking-[-0.015em]" style={{ fontFamily: F.sg }}>
            Loosely woven
          </h3>
          <p className="m344-sub mt-8 text-[13px] uppercase tracking-[0.22em] text-white/60">Washed linen throw · 3 colours · ₹4,350</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M345 · Light leak text (play, CSS background-clip) ───────────────────────── */
const M345_LEAKS = [
  { bg: "radial-gradient(16% 22% at 50% 50%, rgba(255,120,50,.95), rgba(255,80,60,.5) 45%, rgba(255,80,60,0) 100%)", d: "5.4s", dl: "0s" },
  { bg: "radial-gradient(12% 26% at 50% 50%, rgba(255,214,110,.95), rgba(255,170,80,.4) 50%, rgba(255,170,80,0) 100%)", d: "6.6s", dl: "-2.4s" },
  { bg: "radial-gradient(14% 18% at 50% 50%, rgba(255,70,120,.85), rgba(255,70,120,.3) 50%, rgba(255,70,120,0) 100%)", d: "4.6s", dl: "-3.5s" },
];
function M345() {
  const root = useRef<HTMLDivElement>(null);
  useOffClass(root, "m345-off");
  return (
    <Stage r={root} g1="rgba(255,140,70,.4)" g2="rgba(255,90,120,.18)">
      <div
        className="m345-soft pointer-events-none absolute left-1/2 top-1/2 h-[90%] w-[70%]"
        style={{ marginLeft: "-35%", marginTop: "-22%", background: "radial-gradient(closest-side, rgba(255,150,70,.22), transparent)", mixBlendMode: "screen" }}
        aria-hidden
      />
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center">
          <h3 className="grid whitespace-nowrap text-[clamp(84px,10vw,168px)] italic leading-none tracking-[-0.02em]" style={{ fontFamily: F.is }}>
            <span className="m345-base text-[#f3ead8]">Golden hour</span>
            {M345_LEAKS.map((l, i) => (
              <span key={i} className="m345-leak" style={{ backgroundImage: l.bg, "--d": l.d, "--dl": l.dl } as CSSProperties} aria-hidden>
                Golden hour
              </span>
            ))}
          </h3>
          <p className="mt-8 text-[13px] uppercase tracking-[0.22em] text-white/60">35 mm film camera · refurbished · ₹18,500</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M346 · Motion blur text (play, CSS keyframes + text-shadow) ───────────────────────── */
const M346_WORDS = ["Faster.", "Lighter.", "Further."];
function M346() {
  const root = useRef<HTMLDivElement>(null);
  useOffClass(root, "m346-off");
  return (
    <Stage r={root} g1="rgba(92,200,255,.36)" g2="rgba(255,163,92,.24)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center">
          <h3 className="grid whitespace-nowrap text-[clamp(60px,7vw,112px)] font-[800] uppercase leading-none tracking-[-0.01em]" style={{ fontFamily: F.sy }}>
            {M346_WORDS.map((w, i) => (
              <span key={w} className={`m346-w${i === 0 ? " first" : ""}`} aria-hidden={i > 0}>
                {w}
              </span>
            ))}
          </h3>
          <p className="mt-8 text-[13px] uppercase tracking-[0.22em] text-white/60">Carbon road shoe · 198 g · ₹14,990</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M347 · Number ticker (spring count) (play, gsap) ───────────────────────── */
const M347_FMT2 = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const M347_FMT0 = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const M347_FMT1 = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const M347_STATS = [
  { v: 248950.5, f: (n: number) => `₹${M347_FMT2.format(n)}`, big: true, l: "Paid out to makers this month" },
  { v: 3412, f: (n: number) => M347_FMT0.format(n), big: false, l: "Orders shipped" },
  { v: 98.6, f: (n: number) => `${M347_FMT1.format(n)}%`, big: false, l: "Delivered on time" },
];
function M347() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const outs = gsap.utils.toArray<HTMLElement>(".m347-n", el);
    const p = { t: 0 };
    const render = () => outs.forEach((o, i) => (o.textContent = M347_STATS[i].f(M347_STATS[i].v * p.t)));
    const tl = gsap.timeline({ repeat: -1, onUpdate: render });
    // soft spring-like settle: fast start, long gentle landing (decimals keep moving to the end)
    tl.fromTo(p, { t: 0 }, { t: 1, duration: 2.3, ease: "expo.out" }, 0);
    tl.to(p, { t: 0, duration: 0.45, ease: "power2.in" }, "+=0.2");
    render();
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,163,92,.4)" g2="rgba(120,220,160,.2)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center" style={{ fontFamily: F.sg }}>
          <p className="mb-5 text-[13px] uppercase tracking-[0.22em] text-white/55">{M347_STATS[0].l}</p>
          <p className="m347-n text-[clamp(72px,8vw,132px)] font-[600] leading-none tracking-[-0.02em] tabular-nums">{M347_STATS[0].f(M347_STATS[0].v)}</p>
          <div className="mt-12 flex justify-center gap-16">
            {M347_STATS.slice(1).map((s) => (
              <div key={s.l}>
                <p className="m347-n text-[clamp(32px,3vw,48px)] font-[500] leading-none tabular-nums text-[#ffa35c]">{s.f(s.v)}</p>
                <p className="mt-3 text-[13px] uppercase tracking-[0.18em] text-white/55">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Caption>Craft collective · monthly report</Caption>
    </Stage>
  );
}

/* ───────────────────────── M348 · Number wheel (play, gsap + CSS 3D) ───────────────────────── */
const M348_FROM = 4200;
const M348_N = 37; // 4,200 → 4,236
const M348_STEP = 20; // degrees between faces
const M348_R = 0.6 / Math.tan(((M348_STEP / 2) * Math.PI) / 180); // em
const m348Face = (i: number, pos: number) => {
  const a = (i - pos) * M348_STEP;
  const vis = Math.abs(a) < 90;
  const o = vis ? Math.pow(Math.cos((a * Math.PI) / 180), 2.2) : 0;
  return { transform: `rotateX(${(-a).toFixed(2)}deg) translateZ(${M348_R.toFixed(3)}em)`, opacity: o, visibility: vis ? "visible" : "hidden" } as const;
};
function M348() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const faces = gsap.utils.toArray<HTMLElement>(".m348-f", el);
    const p = { pos: 0 };
    const render = () =>
      faces.forEach((f, i) => {
        const s = m348Face(i, p.pos);
        f.style.transform = s.transform;
        f.style.opacity = String(s.opacity);
        f.style.visibility = s.visibility;
      });
    const tl = gsap.timeline({ repeat: -1, onUpdate: render });
    tl.fromTo(p, { pos: 0 }, { pos: M348_N - 1, duration: 2.4, ease: "power2.out" }, 0);
    tl.to(p, { pos: 0, duration: 0.75, ease: "power2.inOut" }, "+=0.2");
    render();
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,163,92,.42)" g2="rgba(79,141,255,.24)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center" style={{ fontFamily: F.sg }}>
          <p className="mb-6 text-[13px] uppercase tracking-[0.22em] text-white/55">Orders packed today</p>
          <div className="relative mx-auto h-[3.4em] w-[4.2em] text-[clamp(84px,9vw,150px)] font-[600] leading-none tabular-nums" style={{ perspective: "900px" }}>
            {Array.from({ length: M348_N }, (_, i) => (
              <span
                key={i}
                className="m348-f absolute inset-x-0 top-1/2 -mt-[0.6em] flex h-[1.2em] items-center justify-center"
                style={{ ...m348Face(i, M348_N - 1), backfaceVisibility: "hidden" }}
                aria-hidden={i !== M348_N - 1}
              >
                {(M348_FROM + i).toLocaleString("en-IN")}
              </span>
            ))}
            <span className="pointer-events-none absolute inset-x-[-10%] top-1/2 -mt-[0.62em] h-[1.24em] border-y border-white/12" aria-hidden />
          </div>
          <p className="mt-6 text-[13px] uppercase tracking-[0.22em] text-white/60">Ceramic mug · 350 ml · ₹890</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M349 · Outline text draw + cursor gradient reveal (play, SVG) ───────────────────────── */
function M349() {
  const root = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  // fit the word by measuring it: viewBox = text bbox + padding, the svg itself is ≤ 75 % of the stage
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    let dead = false;
    document.fonts.ready.then(() => {
      if (dead) return;
      const t = svg.querySelector<SVGTextElement>(".m349-base");
      if (!t) return;
      const b = t.getBBox();
      if (b.width) svg.setAttribute("viewBox", `${(b.x - 16).toFixed(1)} ${(b.y - 16).toFixed(1)} ${(b.width + 32).toFixed(1)} ${(b.height + 32).toFixed(1)}`);
    });
    return () => {
      dead = true;
    };
  }, []);
  usePlay(root, (el, onClean) => {
    const svg = svgRef.current!;
    const draw = el.querySelector<SVGTextElement>(".m349-draw")!;
    const rg = el.querySelector<SVGRadialGradientElement>(".m349-rg")!;
    const dot = el.querySelector<HTMLElement>(".m349-dot")!;
    const read = pointerSource(el, onClean);
    const m = { r: 0 };
    const fake = { u: 0 };
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(draw, { strokeDashoffset: 3000 }, 0).set(m, { r: 0 }, 0);
    tl.to(draw, { strokeDashoffset: 0, duration: 4, ease: "sine.inOut" }, 0);
    tl.to(m, { r: 1, duration: 0.6, ease: "sine.out" }, 3.4);
    tl.to({}, { duration: 2.6 }, 4);
    tl.to(m, { r: 0, duration: 0.45, ease: "sine.in" }, ">-0.35");
    tl.to(draw, { strokeDashoffset: -3000, duration: 0.8, ease: "power1.in" }, "<");
    const sweep = gsap.to(fake, { u: 1, duration: 2.6, ease: "sine.inOut", repeat: -1, yoyo: true });
    onClean(() => sweep.kill());
    tickWhile(tl, onClean, () => {
      const vb = svg.viewBox.baseVal;
      const rr = el.getBoundingClientRect();
      const ctm = svg.getScreenCTM();
      if (!ctm || !vb.width) return;
      // fake point in svg units, sweeping along the word
      const sx = vb.x + vb.width * (0.08 + 0.84 * fake.u);
      const sy = vb.y + vb.height * (0.5 + 0.28 * Math.sin(fake.u * Math.PI * 3));
      const scr = new DOMPoint(sx, sy).matrixTransform(ctm);
      const p = read({ x: scr.x - rr.left, y: scr.y - rr.top });
      const inv = ctm.inverse();
      const sp = new DOMPoint(p.x + rr.left, p.y + rr.top).matrixTransform(inv);
      rg.setAttribute("cx", sp.x.toFixed(1));
      rg.setAttribute("cy", sp.y.toFixed(1));
      rg.setAttribute("r", (vb.height * 0.75 * m.r + 0.01).toFixed(1));
      gsap.set(dot, { x: p.x, y: p.y, opacity: p.real ? 0 : m.r });
    });
    return tl;
  });
  const txt = { x: 500, y: 170, textAnchor: "middle" as const, fontSize: 200, style: { fontFamily: F.sy, fontWeight: 800, letterSpacing: "0.02em" } };
  return (
    <Stage r={root} g1="rgba(190,120,255,.5)" g2="rgba(92,200,255,.24)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="grid w-[min(75%,1000px)] place-items-center">
          <svg ref={svgRef} viewBox="0 0 1000 220" className="w-full overflow-visible" aria-label="Lumen">
            <defs>
              <linearGradient id="m349-grad" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor="#ff5c8a" />
                <stop offset=".35" stopColor="#ffa35c" />
                <stop offset=".65" stopColor="#5cc8ff" />
                <stop offset="1" stopColor="#a77bff" />
              </linearGradient>
              <radialGradient id="m349-rg" className="m349-rg" gradientUnits="userSpaceOnUse" cx="500" cy="110" r="0.01">
                <stop offset="0" stopColor="#fff" />
                <stop offset="1" stopColor="#000" />
              </radialGradient>
              <mask id="m349-mask" maskUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000">
                <rect x="-2000" y="-2000" width="6000" height="6000" fill="url(#m349-rg)" />
              </mask>
            </defs>
            <text {...txt} className="m349-base" fill="none" stroke="rgba(234,245,255,.16)" strokeWidth={1.2}>
              LUMEN
            </text>
            <text {...txt} className="m349-draw" fill="none" stroke="#eaf5ff" strokeOpacity={0.75} strokeWidth={1.6} strokeDasharray={3000} strokeDashoffset={0}>
              LUMEN
            </text>
            <text {...txt} fill="none" stroke="url(#m349-grad)" strokeWidth={2.6} mask="url(#m349-mask)">
              LUMEN
            </text>
          </svg>
          <p className="mt-8 text-[13px] uppercase tracking-[0.22em] text-white/60">Lumen studio lamp · brass · ₹9,200</p>
        </div>
      </div>
      <span className="m349-dot pointer-events-none absolute left-0 top-0 -ml-[8px] -mt-[8px] h-[16px] w-[16px] rounded-full border-2 border-white bg-white/30 opacity-0" aria-hidden />
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M338", name: "Irregular human typewriter", how: "Letters type in with a human rhythm (bursts, pauses after commas) while a block caret jumps along in steps, blinks, then backspaces · loops", kind: "play", C: M338 },
  { code: "M339", name: "Layered depth text", how: "Eight stacked copies of a word fan apart in Z while the stack tilts in 3D, then settle back into one solid word · hover, auto-toggled", kind: "play", C: M339 },
  { code: "M340", name: "Layered stroke letters", how: "Offset outline layers in four colours draw on one after another (DrawSVG), then the solid fill fades in · loops", kind: "play", C: M340 },
  { code: "M341", name: "LED lightboard scroll", how: "A canvas grid of round LEDs scrolls a station-sign message column by column; lit dots glow amber, unlit stay dim · loops", kind: "play", C: M341 },
  { code: "M342", name: "Letters repel from cursor", how: "Big letters spring away from the pointer with a slight tilt and spring back as it passes · auto pointer path", kind: "play", C: M342 },
  { code: "M343", name: "Letters rotate by distance to centre", how: "Each letter's tilt (±15°) and scale (1 → 0.5) follow its distance from the screen centre, so lines straighten as they pass the middle · scrubbed", kind: "scrub", C: M343 },
  { code: "M344", name: "Letters slide in from spacing", how: "Characters slide in from the left (x -20 → 0) and fade up one by one, assembling the word · loops", kind: "play", C: M344 },
  { code: "M345", name: "Light leak text", how: "Warm light-leak gradients wash diagonally across a word through background-clip text, like film light hitting the type · CSS loop", kind: "play", C: M345 },
  { code: "M346", name: "Motion blur text", how: "Words shoot in from the side with a trail of stacked text-shadows that collapses to zero as they stop, then blur out the other side · CSS loop", kind: "play", C: M346 },
  { code: "M347", name: "Number ticker (spring count)", how: "Numbers count from 0 to their target with a soft spring-like landing, formatted with ₹, separators and decimals while counting · loops", kind: "play", C: M347 },
  { code: "M348", name: "Number wheel", how: "Numbers sit on a 3D wheel that spins past values, fading toward the edges, and lands on the target · loops", kind: "play", C: M348 },
  { code: "M349", name: "Outline text draw + cursor gradient reveal", how: "A huge outlined word strokes on over 4 s, then a radial mask follows the pointer showing a multicolour stroke near it · auto sweep", kind: "play", C: M349 },
];
