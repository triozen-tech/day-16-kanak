"use client";

// Text motions, batch 6 · group 4 (MOTION-MENU M266–M277). Small focused demos for /lab/motion.
// Every demo: plays by itself on screen (or follows the scroll), loops, has a CSS glow loop that never stops,
// and shows a sensible final state in ?static=1 / reduced motion.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, SplitText, prefersReducedMotion } from "@/lib/gsap";
import { useScrub, useTicker } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = { sg: "Space Grotesk Variable", fr: "Fraunces Variable", is: "Instrument Serif", sy: "Syne Variable", mr: "Manrope Variable" };
const INK = "#eaf5ff";
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const CSS = `
.b6g4-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 32% 38%,var(--g1,rgba(79,141,255,.5)),transparent 70%),radial-gradient(34% 40% at 70% 66%,var(--g2,rgba(255,122,89,.22)),transparent 70%);animation:b6g4-drift 6s linear infinite alternate;will-change:transform}
.b6g4-top{mix-blend-mode:screen;opacity:.45;z-index:30}
@keyframes b6g4-drift{0%{transform:translate3d(-7%,-5%,0) scale(1)}100%{transform:translate3d(7%,6%,0) scale(1.15)}}

.m266-card{position:relative;width:.74em;height:1.08em;perspective:5em}
.m266-h{position:absolute;left:0;right:0;height:50%;overflow:hidden;background:linear-gradient(#141d33,#0f1628)}
.m266-h>span{position:absolute;left:0;right:0;height:200%;display:flex;align-items:center;justify-content:center;line-height:1}
.m266-t{top:0;border-radius:.09em .09em 0 0;transform-origin:50% 100%}
.m266-b{bottom:0;border-radius:0 0 .09em .09em;transform-origin:50% 0;background:linear-gradient(#0f1628,#0b1120)}
.m266-t>span{top:0}.m266-b>span{top:-100%}
.m266-f{backface-visibility:hidden;z-index:2}
.m266-card:after{content:"";position:absolute;left:0;right:0;top:50%;height:2px;margin-top:-1px;background:#05080f;z-index:3}

.m267-col{animation:m267-step 8s linear infinite}
.m267-bar{transform-origin:0 50%;animation:m267-fill 1.6s linear infinite}
.m267-off .m267-col,.m267-off .m267-bar{animation-play-state:paused}
@keyframes m267-step{
  0%,15%{transform:translateY(0)}
  18.5%{transform:translateY(-1.29em)}20%,35%{transform:translateY(-1.15em)}
  38.5%{transform:translateY(-2.44em)}40%,55%{transform:translateY(-2.3em)}
  58.5%{transform:translateY(-3.59em)}60%,75%{transform:translateY(-3.45em)}
  78.5%{transform:translateY(-4.74em)}80%,95%{transform:translateY(-4.6em)}
  98.5%{transform:translateY(-5.89em)}100%{transform:translateY(-5.75em)}
}
@keyframes m267-fill{0%{transform:scaleX(0)}100%{transform:scaleX(1)}}

.m268-h{--w:100%;--x:-70%;--a:1;padding:0 .12em;margin:0 -.04em;border-radius:.18em;-webkit-box-decoration-break:clone;box-decoration-break:clone;background-repeat:no-repeat;background-image:linear-gradient(90deg,transparent,rgba(160,205,255,.9),transparent),linear-gradient(90deg,rgba(79,141,255,0),rgba(79,141,255,calc(var(--a)*.34)) 10%,rgba(79,141,255,calc(var(--a)*.34)) 90%,rgba(79,141,255,0));background-size:40% 100%,var(--w) 100%;background-position:var(--x) 0,0 0}

.m273-sign{--g:1;color:#ffe3f1;text-shadow:0 0 calc(var(--g)*6px) #ff4fa3,0 0 calc(var(--g)*18px) #ff4fa3,0 0 calc(var(--g)*42px) rgba(255,79,163,.8),0 0 calc(var(--g)*80px) rgba(255,79,163,.5)}
.m273-tube{--g:1;box-shadow:0 0 calc(var(--g)*10px) #6ee7ff,inset 0 0 calc(var(--g)*10px) #6ee7ff;border-color:#c8f6ff}

html.is-static .b6g4-glow,html.is-static .m267-col,html.is-static .m267-bar{animation:none}
html.is-static {.b6g4-glow,.m267-col,.m267-bar{animation:none}}
`;

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). `top` adds a second glow above the content. */
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
      <style href="b6g4-css" precedence="default">
        {CSS}
      </style>
      <div className="b6g4-glow" style={vars} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
      {top && <div className="b6g4-glow b6g4-top" style={vars} aria-hidden />}
    </div>
  );
}

type Anim = gsap.core.Animation;
/**
 * "play" helper: waits for fonts, builds the looping animation(s) inside a gsap.context, plays them only while the
 * demo is on screen, and reverts everything on unmount. Nothing runs with prefersReducedMotion().
 */
function usePlay(ref: RefObject<HTMLElement | null>, build: (root: HTMLElement, onClean: (fn: () => void) => void) => Anim | Anim[] | void) {
  const b = useRef(build);
  b.current = build;
  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    let dead = false;
    let on = false;
    let anims: Anim[] = [];
    const cleans: (() => void)[] = [];
    const ctx = gsap.context(() => {}, root);
    const sync = () => anims.forEach((a) => (on ? a.play() : a.pause()));
    const io = new IntersectionObserver(
      ([e]) => {
        on = e.isIntersecting;
        sync();
      },
      { threshold: 0.1 },
    );
    io.observe(root);
    Promise.resolve(document.fonts?.ready).then(() => {
      if (dead) return;
      ctx.add(() => {
        const r = b.current(root, (fn) => cleans.push(fn));
        anims = r ? (Array.isArray(r) ? r : [r]) : [];
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

/** CSS-only demos: adds `cls` while the demo is off screen (pauses its keyframes). */
function useOffClass(ref: RefObject<HTMLElement | null>, cls: string) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => el.classList.toggle(cls, !e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, cls]);
}

/* ───────────────────────── M266 · Flip clock digits (play) ───────────────────────── */
const M266_START = 2 * 3600 + 14 * 60 + 37;
const fmt = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const x = s % 60;
  return [h, m, x].map((n) => String(n).padStart(2, "0")).join("");
};
function FlipCard({ d }: { d: string }) {
  return (
    <div className="m266-card">
      <div className="m266-h m266-t m266-st">
        <span>{d}</span>
      </div>
      <div className="m266-h m266-b m266-sb">
        <span>{d}</span>
      </div>
      <div className="m266-h m266-t m266-f m266-ft">
        <span>{d}</span>
      </div>
      <div className="m266-h m266-b m266-f m266-fb" style={{ transform: "rotateX(90deg)" }}>
        <span>{d}</span>
      </div>
    </div>
  );
}
function M266() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const cards = gsap.utils.toArray<HTMLElement>(".m266-card", el);
    const q = (c: HTMLElement, s: string) => c.querySelector(`${s}>span`) as HTMLElement;
    let secs = M266_START;
    let prev = fmt(secs);
    const flip = (c: HTMLElement, from: string, to: string) => {
      const ft = c.querySelector(".m266-ft") as HTMLElement;
      const fb = c.querySelector(".m266-fb") as HTMLElement;
      q(c, ".m266-st").textContent = to; // revealed behind the falling flap
      q(c, ".m266-sb").textContent = from; // covered when the new bottom lands
      q(c, ".m266-ft").textContent = from;
      q(c, ".m266-fb").textContent = to;
      gsap
        .timeline()
        .set(ft, { rotationX: 0, filter: "brightness(1)" })
        .set(fb, { rotationX: 90 })
        .to(ft, { rotationX: -90, filter: "brightness(.55)", duration: 0.22, ease: "power2.in" })
        .to(fb, { rotationX: 0, duration: 0.24, ease: "power2.out" })
        .call(() => void (q(c, ".m266-sb").textContent = to));
    };
    const tick = () => {
      secs = secs <= M266_START - 90 ? M266_START : secs - 1;
      const next = fmt(secs);
      for (let i = 0; i < 6; i++) if (next[i] !== prev[i]) flip(cards[i], prev[i], next[i]);
      prev = next;
    };
    return gsap.timeline({ repeat: -1, onRepeat: tick }).to({}, { duration: 0.72 });
  });
  const digits = fmt(M266_START);
  const group = (i: number, label: string) => (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-[0.08em]">
        <FlipCard d={digits[i]} />
        <FlipCard d={digits[i + 1]} />
      </div>
      <span className="text-[13px] uppercase tracking-[0.24em] text-white/55" style={{ fontFamily: F.mr }}>
        {label}
      </span>
    </div>
  );
  return (
    <Stage r={root} g1="rgba(79,141,255,.5)" g2="rgba(255,122,89,.24)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-8">
        <p className="text-[clamp(22px,2vw,30px)] italic" style={{ fontFamily: F.fr }}>
          The Monsoon Edit closes in
        </p>
        <div className="flex items-start gap-[0.22em] text-[clamp(84px,9vw,140px)] font-[600] tabular-nums" style={{ fontFamily: F.sg }}>
          {group(0, "hours")}
          <span className="leading-[1.05] text-white/40">:</span>
          {group(2, "minutes")}
          <span className="leading-[1.05] text-white/40">:</span>
          {group(4, "seconds")}
        </div>
        <span className="rounded-full border border-white/20 px-5 py-2 text-[14px] text-white/80" style={{ fontFamily: F.mr }}>
          Linen kurtas from ₹1,890 · 30% off
        </span>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M267 · Flip-words drum (play, CSS) ───────────────────────── */
const M267_WORDS = ["early mornings.", "late deadlines.", "long drives.", "slow Sundays.", "first dates."];
function M267() {
  const root = useRef<HTMLDivElement>(null);
  useOffClass(root, "m267-off");
  return (
    <Stage r={root} g1="rgba(79,141,255,.48)" g2="rgba(224,145,63,.26)">
      <div className="absolute inset-0 flex flex-col items-center justify-center px-[6%]">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/55" style={{ fontFamily: F.mr }}>
          Cold brew concentrate · 500 ml · ₹420
        </p>
        <h3 className="mt-6 text-center text-[clamp(52px,6vw,96px)] font-[500] leading-[1.15] tracking-[-0.02em]" style={{ fontFamily: F.sg }}>
          Brewed for
          <span className="relative mx-auto block h-[1.15em] overflow-hidden text-[#7fb0ff]" style={{ fontFamily: F.fr, fontStyle: "italic" }}>
            <span className="m267-col block">
              {[...M267_WORDS, M267_WORDS[0]].map((w, i) => (
                <span key={i} className="block h-[1.15em]" aria-hidden={i > 0}>
                  {w}
                </span>
              ))}
            </span>
          </span>
        </h3>
        <div className="mt-6 h-[3px] w-[180px] overflow-hidden rounded-full bg-white/10">
          <div className="m267-bar h-full w-full bg-[#4f8dff]" />
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M268 · Gradient reveal highlight (play) ───────────────────────── */
function M268() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const hs = gsap.utils.toArray<HTMLElement>(".m268-h", el);
    gsap.set(hs, { "--w": "0%", "--x": "-70%", "--a": 1 });
    const tl = gsap.timeline({ repeat: -1 });
    hs.forEach((h, i) => {
      const at = 0.15 + i * 0.55;
      tl.to(h, { "--x": "170%", duration: 1.1, ease: "power1.inOut" }, at);
      tl.to(h, { "--w": "100%", duration: 0.95, ease: "power2.inOut" }, at + 0.08);
    });
    // stays as a gentle tint that breathes, then clears for the next pass
    tl.to(hs, { "--a": 0.62, duration: 0.7, ease: "sine.inOut", yoyo: true, repeat: 1 }, ">-0.1");
    tl.to(hs, { "--a": 0, duration: 0.45, ease: "power1.in" });
    tl.set(hs, { "--w": "0%", "--x": "-70%", "--a": 1 });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(79,141,255,.46)" g2="rgba(24,196,143,.2)">
      <div className="absolute inset-0 grid place-items-center px-[8%]">
        <div className="max-w-[1000px] text-center">
          <p className="text-[13px] uppercase tracking-[0.24em] text-white/55" style={{ fontFamily: F.mr }}>
            Orchard Row · dried fruit
          </p>
          <h3 className="mt-6 text-[clamp(40px,4.6vw,72px)] leading-[1.18] tracking-[-0.015em]" style={{ fontFamily: F.fr }}>
            Alphonso slices, <span className="m268-h">picked at first light</span>, sun-dried and packed{" "}
            <span className="m268-h">the same afternoon</span>.
          </h3>
          <p className="mt-6 text-[16px] text-white/70" style={{ fontFamily: F.mr }}>
            200 g pouch · ₹360
          </p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M269 · Gradient stroke name draw (play, DrawSVG) ───────────────────────── */
const M269_PATH =
  "M60 178 C 74 92, 118 52, 132 96 C 146 140, 104 214, 96 176 C 88 138, 150 92, 170 128 C 186 158, 168 196, 190 186 C 212 176, 222 120, 236 124 C 250 128, 230 190, 252 188 C 276 186, 286 110, 314 112 C 340 114, 318 182, 296 168 C 276 154, 318 120, 344 140 C 362 154, 356 196, 380 186 C 410 174, 420 60, 446 58 C 470 56, 452 150, 440 186 C 432 210, 470 178, 488 150 C 504 126, 528 122, 524 152 C 520 182, 496 190, 506 166 C 516 142, 548 136, 566 160 C 580 178, 584 192, 604 176 C 626 158, 640 120, 664 130 C 688 140, 660 196, 690 186 C 716 178, 730 140, 752 142 C 780 146, 760 190, 786 182 C 812 174, 836 132, 850 120 C 872 100, 880 150, 840 196 C 780 238, 560 232, 360 222 C 240 216, 140 214, 84 226";
function M269() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const path = el.querySelector(".m269-p");
    const dot = el.querySelector(".m269-dot");
    const grad = el.querySelector(".m269-g");
    // the gradient keeps sliding along the stroke (reflect), so the line shimmers while it writes and after
    const shimmer = gsap.fromTo(grad, { attr: { x1: 0, x2: 420 } }, { attr: { x1: 420, x2: 840 }, duration: 1.6, ease: "none", repeat: -1, yoyo: true });
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(dot, { scale: 0, transformOrigin: "50% 50%" })
      .fromTo(path, { drawSVG: "0%" }, { drawSVG: "100%", duration: 2.4, ease: "power1.inOut" })
      .to(dot, { scale: 1, duration: 0.25, ease: "back.out(3)" }, "-=0.15")
      .to(path, { drawSVG: "100% 100%", duration: 0.6, ease: "power2.in" }, "+=0.2")
      .to(dot, { scale: 0, duration: 0.25 }, "<");
    return [tl, shimmer];
  });
  return (
    <Stage r={root} g1="rgba(255,122,89,.42)" g2="rgba(79,141,255,.34)">
      <div className="absolute inset-0 flex flex-col items-center justify-center px-[6%]">
        <svg viewBox="0 0 920 260" className="w-[min(78%,980px)] overflow-visible" fill="none" aria-label="Signature: Mira Solenne">
          <defs>
            <linearGradient className="m269-g" id="m269-g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="420" y2="0" spreadMethod="reflect">
              <stop offset="0" stopColor="#ffb36b" />
              <stop offset="0.5" stopColor="#ff4d6d" />
              <stop offset="1" stopColor="#7fb0ff" />
            </linearGradient>
          </defs>
          <path className="m269-p" d={M269_PATH} stroke="url(#m269-g)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <circle className="m269-dot" cx="452" cy="30" r="7" fill="#ffb36b" />
        </svg>
        <p className="mt-6 text-[clamp(26px,2.4vw,38px)] italic" style={{ fontFamily: F.is }}>
          Mira Solenne — ceramic studio
        </p>
        <p className="mt-2 text-[13px] uppercase tracking-[0.24em] text-white/55" style={{ fontFamily: F.mr }}>
          Signed bowls · from ₹2,200
        </p>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M270 · Hover-repel particle text (play, canvas) ───────────────────────── */
type Pt = { hx: number; hy: number; x: number; y: number; vx: number; vy: number };
function M270() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const st = useRef<{ pts: Pt[]; w: number; h: number; dpr: number; real: { x: number; y: number; at: number } } | null>(null);

  const draw = () => {
    const s = st.current;
    const c = cv.current;
    if (!s || !c) return;
    const g = c.getContext("2d")!;
    g.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
    g.clearRect(0, 0, s.w, s.h);
    for (const p of s.pts) {
      const d = Math.min(1, Math.hypot(p.x - p.hx, p.y - p.hy) / 60);
      g.fillStyle = d > 0.05 ? `rgb(${Math.round(234 - 155 * d)},${Math.round(245 - 104 * d)},255)` : INK;
      g.fillRect(p.x - 1.1, p.y - 1.1, 2.2, 2.2);
    }
  };

  useEffect(() => {
    const el = root.current;
    const c = cv.current;
    if (!el || !c) return;
    let dead = false;
    const build = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const o = off.getContext("2d", { willReadFrequently: true })!;
      const size = Math.min(w * 0.135, h * 0.42);
      o.font = `800 ${size}px "${F.sy}", sans-serif`;
      o.textAlign = "center";
      o.textBaseline = "middle";
      o.fillStyle = "#fff";
      o.fillText("BLOOM", w / 2, h * 0.46);
      const data = o.getImageData(0, 0, w, h).data;
      const gap = 5;
      const pts: Pt[] = [];
      for (let y = 0; y < h; y += gap)
        for (let x = 0; x < w; x += gap)
          if (data[(y * w + x) * 4 + 3] > 128) pts.push({ hx: x, hy: y, x, y, vx: 0, vy: 0 });
      st.current = { pts, w, h, dpr, real: st.current?.real ?? { x: 0, y: 0, at: -1e9 } };
      draw();
    };
    Promise.all([document.fonts?.ready, document.fonts?.load(`800 100px "${F.sy}"`)]).then(() => !dead && build());
    const ro = new ResizeObserver(() => st.current && build());
    ro.observe(el);
    const move = (e: PointerEvent) => {
      const s = st.current;
      if (!s) return;
      const r = el.getBoundingClientRect();
      s.real = { x: e.clientX - r.left, y: e.clientY - r.top, at: performance.now() };
    };
    el.addEventListener("pointermove", move);
    return () => {
      dead = true;
      ro.disconnect();
      el.removeEventListener("pointermove", move);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useTicker(root, (t) => {
    const s = st.current;
    if (!s) return;
    // fake pointer sweeps across the word; the real pointer takes over for 1.5 s after it moves
    const useReal = performance.now() - s.real.at < 1500;
    const px = useReal ? s.real.x : s.w * (0.5 + 0.4 * Math.sin(t * 0.85));
    const py = useReal ? s.real.y : s.h * (0.46 + 0.2 * Math.sin(t * 1.9));
    if (ring.current) ring.current.style.transform = `translate3d(${px - 22}px,${py - 22}px,0)`;
    const R = 95;
    for (const p of s.pts) {
      const dx = p.x - px;
      const dy = p.y - py;
      const d2 = dx * dx + dy * dy;
      if (d2 < R * R) {
        const d = Math.sqrt(d2) || 1;
        const f = (1 - d / R) * 6;
        p.vx += (dx / d) * f;
        p.vy += (dy / d) * f;
      }
      p.vx = (p.vx + (p.hx - p.x) * 0.055) * 0.84;
      p.vy = (p.vy + (p.hy - p.y) * 0.055) * 0.84;
      p.x += p.vx;
      p.y += p.vy;
    }
    draw();
  });

  return (
    <Stage r={root} g1="rgba(79,141,255,.55)" g2="rgba(255,77,109,.26)" top>
      <canvas ref={cv} className="absolute inset-0 h-full w-full" aria-label="BLOOM" />
      <div ref={ring} className="pointer-events-none absolute left-0 top-0 h-11 w-11 rounded-full border-2 border-[#7fb0ff] bg-[#4f8dff]/15" aria-hidden />
      <p className="absolute bottom-6 left-1/2 w-max text-center text-[13px] uppercase tracking-[0.24em] text-white/60" style={{ fontFamily: F.mr, translate: "-50% 0" }}>
        Bloom florals · same-day bouquets from ₹1,250
      </p>
    </Stage>
  );
}

/* ───────────────────────── M271 · Letters shrink away from centre (scrub) ───────────────────────── */
const M271_LINES = ["Grown slow", "on the hills,", "picked by hand,", "poured warm."];
function M271() {
  const root = useRef<HTMLDivElement>(null);
  const block = useRef<HTMLDivElement>(null);
  const chars = useRef<HTMLElement[]>([]);
  const rel = useRef<number[]>([]);
  useEffect(() => {
    const b = block.current;
    if (!b) return;
    const split = SplitText.create(b.querySelectorAll(".m271-l"), { type: "words,chars" });
    chars.current = split.chars as HTMLElement[];
    const measure = () => {
      // char scale is about its own centre and the block translate moves both rects, so centres stay comparable
      const r = b.getBoundingClientRect();
      const mid = r.top + r.height / 2;
      rel.current = chars.current.map((c) => {
        const cr = c.getBoundingClientRect();
        return cr.top + cr.height / 2 - mid;
      });
    };
    measure();
    document.fonts?.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      split.revert();
      chars.current = [];
    };
  }, []);
  useScrub(
    root,
    (p) => {
      const el = root.current;
      const b = block.current;
      if (!el || !b) return;
      const H = el.clientHeight;
      // the block travels bottom → top through the stage, like a headline scrolling through the viewport
      const y = (0.5 - p) * H * 1.5;
      b.style.transform = `translate3d(0,${y}px,0)`;
      const cs = chars.current;
      const rs = rel.current;
      for (let i = 0; i < cs.length; i++) {
        const d = Math.abs((rs[i] ?? 0) + y) / (H * 0.5);
        cs[i].style.transform = `scale(${1 - 0.8 * clamp01(d)})`;
      }
    },
    { finalValue: 0.5 },
  );
  return (
    <Stage r={root} g1="rgba(24,196,143,.42)" g2="rgba(79,141,255,.3)">
      <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-px bg-white/10" aria-hidden />
      <div className="absolute inset-0 flex items-center justify-center">
        <div ref={block} className="relative text-center">
          {M271_LINES.map((l) => (
            <div key={l} className="m271-l text-[clamp(56px,6.4vw,104px)] font-[700] uppercase leading-[1.02] tracking-[-0.02em]" style={{ fontFamily: F.sg }}>
              {l}
            </div>
          ))}
        </div>
      </div>
      <p className="absolute bottom-5 left-6 text-[13px] uppercase tracking-[0.18em] text-white/60" style={{ fontFamily: F.mr }}>
        High Fold tea estate · first flush · ₹780
      </p>
    </Stage>
  );
}

/* ───────────────────────── M272 · Multi-language greeting cycle (play) ───────────────────────── */
const M272_WORDS: [string, string][] = [
  ["Hello", "English"],
  ["Namaste", "Hindi"],
  ["Bonjour", "French"],
  ["Hola", "Spanish"],
  ["Vanakkam", "Tamil"],
  ["Ciao", "Italian"],
  ["Konnichiwa", "Japanese"],
];
function M272() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const ws = gsap.utils.toArray<HTMLElement>(".m272-w", el);
    const bar = el.querySelector(".m272-bar");
    gsap.set(ws, { position: "absolute", left: 0, right: 0, top: 0, visibility: "hidden" });
    gsap.set(ws[0], { position: "relative", visibility: "visible" });
    gsap.set(ws.slice(1), { autoAlpha: 0 });
    let cur = 0;
    // every 1.5 s (one bar fill): the current word blurs out upward, the next blurs in from below
    const swap = () => {
      const w = ws[cur];
      cur = (cur + 1) % ws.length;
      const n = ws[cur];
      gsap.to(w, { yPercent: -45, filter: "blur(14px)", autoAlpha: 0, duration: 0.5, ease: "power2.in" });
      gsap.fromTo(n, { yPercent: 45, filter: "blur(14px)", autoAlpha: 0 }, { yPercent: 0, filter: "blur(0px)", autoAlpha: 1, duration: 0.55, ease: "power2.out", delay: 0.2 });
    };
    return gsap.timeline({ repeat: -1, onRepeat: swap }).fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 1.5, ease: "none" });
  });
  return (
    <Stage r={root} g1="rgba(79,141,255,.5)" g2="rgba(255,179,107,.26)">
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="relative w-[min(90%,1100px)] text-center">
          {M272_WORDS.map(([w, lang], i) => (
            <div key={w} className="m272-w" style={i ? { position: "absolute", left: 0, right: 0, top: 0, visibility: "hidden" } : undefined} aria-hidden={i > 0}>
              <div className="text-[clamp(72px,8.6vw,140px)] font-[400] leading-[1.05] tracking-[-0.02em]" style={{ fontFamily: F.is }}>
                {w}
              </div>
              <div className="mt-3 text-[13px] uppercase tracking-[0.28em] text-white/55" style={{ fontFamily: F.mr }}>
                {lang}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 h-[3px] w-[160px] overflow-hidden rounded-full bg-white/10">
          <div className="m272-bar h-full w-full origin-left bg-[#4f8dff]" />
        </div>
        <p className="mt-6 text-[15px] text-white/70" style={{ fontFamily: F.mr }}>
          Wayfarer hostels · 40 cities · beds from ₹899
        </p>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M273 · Neon flicker with glow (play) ───────────────────────── */
function M273() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const sign = el.querySelector(".m273-sign");
    const tube = el.querySelector(".m273-tube");
    const both = [sign, tube];
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(both, { opacity: 0.08, "--g": 0 })
      // irregular switch-on: flashes with gaps
      .to(both, {
        keyframes: [
          { opacity: 1, "--g": 0.4, duration: 0.05 },
          { opacity: 0.1, duration: 0.12 },
          { opacity: 0.9, "--g": 0.5, duration: 0.04 },
          { opacity: 0.15, duration: 0.2 },
          { opacity: 1, "--g": 0.7, duration: 0.05 },
          { opacity: 0.35, duration: 0.07 },
          { opacity: 1, duration: 0.04 },
        ],
      })
      // glow builds, then breathes
      .to(both, { "--g": 1.25, duration: 0.6, ease: "power2.out" })
      .to(both, { "--g": 0.85, duration: 0.55, ease: "sine.inOut", yoyo: true, repeat: 3 })
      .to(tube, { opacity: 0.2, duration: 0.05, yoyo: true, repeat: 1 }, "-=1.1")
      // power cut, then restart
      .to(both, { opacity: 0.08, "--g": 0, duration: 0.25, ease: "power2.in" });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,79,163,.42)" g2="rgba(110,231,255,.22)" className="!bg-[#07060d]">
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="m273-tube rounded-[48px] border-[3px] px-[clamp(40px,5vw,80px)] py-[clamp(18px,2.4vw,36px)]">
          <h3 className="m273-sign text-[clamp(72px,8.4vw,136px)] italic leading-none" style={{ fontFamily: F.is }}>
            Open late
          </h3>
        </div>
        <p className="mt-8 text-[13px] uppercase tracking-[0.26em] text-white/60" style={{ fontFamily: F.mr }}>
          Night Owl ramen bar · bowls from ₹380 · till 2 am
        </p>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M274 · Origami fold letters (play, SplitText) ───────────────────────── */
function M274() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const split = SplitText.create(el.querySelector(".m274-t"), { type: "words,chars" });
    onClean(() => split.revert());
    const cs = split.chars as HTMLElement[];
    gsap.set(cs, { transformOrigin: "50% 0%", transformPerspective: 700 });
    const tl = gsap.timeline({ repeat: -1 });
    tl.fromTo(cs, { rotationX: 90, opacity: 0, filter: "brightness(.35)" }, { rotationX: 0, opacity: 1, filter: "brightness(1)", duration: 0.7, ease: "power1.out", stagger: 0.06 })
      .to(cs, { rotationX: 90, opacity: 0, filter: "brightness(.35)", duration: 0.45, ease: "power1.in", stagger: 0.04 }, "+=0.05");
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,179,107,.42)" g2="rgba(79,141,255,.3)">
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <h3 className="m274-t text-center text-[clamp(64px,7.4vw,118px)] font-[700] uppercase leading-none tracking-[-0.01em]" style={{ fontFamily: F.sy }}>
          Folded by hand
        </h3>
        <p className="mt-8 text-[16px] text-white/70" style={{ fontFamily: F.mr }}>
          Kumo paper lamps · six sizes · from ₹2,400
        </p>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M275 · Paper-fold unfold, side hinge per char (play, SplitText) ───────────────────────── */
function M275() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const split = SplitText.create(el.querySelector(".m275-t"), { type: "words,chars" });
    onClean(() => split.revert());
    const cs = split.chars as HTMLElement[];
    gsap.set(cs, { transformOrigin: "0% 50%", transformPerspective: 600 });
    const tl = gsap.timeline({ repeat: -1 });
    // each char opens like a door from its left edge; the crease shade lifts as it lies flat
    tl.fromTo(cs, { rotationY: 92, filter: "brightness(.2)" }, { rotationY: 0, filter: "brightness(1)", duration: 0.8, ease: "power2.out", stagger: 0.07 })
      .to(cs, { rotationY: -92, filter: "brightness(.2)", duration: 0.45, ease: "power2.in", stagger: 0.035 }, "+=0.25");
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(79,141,255,.48)" g2="rgba(24,196,143,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/55" style={{ fontFamily: F.mr }}>
          Linen & Leaf · autumn catalogue
        </p>
        <h3 className="m275-t mt-6 text-center text-[clamp(64px,7.2vw,116px)] font-[500] leading-none tracking-[-0.02em]" style={{ fontFamily: F.fr }}>
          Unfold the season
        </h3>
        <p className="mt-8 text-[16px] text-white/70" style={{ fontFamily: F.mr }}>
          Throws and table linen from ₹1,150
        </p>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M276 · Per-word clone ticker (play, SplitText) ───────────────────────── */
function M276() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const split = SplitText.create(el.querySelector(".m276-t"), { type: "words" });
    onClean(() => split.revert());
    const ws = split.words as HTMLElement[];
    // each word gets a clipped twin underneath; both roll up by 100%, then snap back (identical text = seamless)
    const pairs = ws.map((w) => {
      const t = w.textContent ?? "";
      w.textContent = "";
      Object.assign(w.style, { overflow: "hidden", verticalAlign: "top", position: "relative" });
      const a = document.createElement("span");
      const b = document.createElement("span");
      a.textContent = t;
      b.textContent = t;
      a.style.display = "block";
      Object.assign(b.style, { display: "block", position: "absolute", left: "0", top: "100%" });
      b.setAttribute("aria-hidden", "true");
      w.append(a, b);
      return [a, b];
    });
    const tl = gsap.timeline();
    pairs.forEach((p, i) => {
      tl.add(gsap.fromTo(p, { yPercent: 0 }, { yPercent: -100, duration: 0.65, ease: "power3.inOut", repeat: -1, repeatDelay: 0.75 }), i * 0.11);
    });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(79,141,255,.5)" g2="rgba(255,122,89,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center px-[6%]">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/55" style={{ fontFamily: F.mr }}>
          Platform 9 sneakers · drop board
        </p>
        <h3 className="m276-t mt-6 max-w-[14ch] text-center text-[clamp(60px,6.8vw,108px)] font-[600] uppercase leading-[1.04] tracking-[-0.02em]" style={{ fontFamily: F.sg }}>
          Fresh drops every Friday at noon
        </h3>
        <p className="mt-8 text-[16px] text-white/70" style={{ fontFamily: F.mr }}>
          Runner 02 · ₹6,499
        </p>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M277 · Pinned words fan out from centre (scrub, SplitText) ───────────────────────── */
function M277() {
  const root = useRef<HTMLDivElement>(null);
  const block = useRef<HTMLHeadingElement>(null);
  const cta = useRef<HTMLDivElement>(null);
  const words = useRef<HTMLElement[]>([]);
  const off = useRef<{ dx: number; dy: number; n: number }[]>([]);
  useEffect(() => {
    const b = block.current;
    if (!b) return;
    const split = SplitText.create(b, { type: "words" });
    words.current = split.words as HTMLElement[];
    const measure = () => {
      // read untransformed positions (clear the scrub transforms for the read, then put them back)
      const ws = words.current;
      const saved = ws.map((w) => w.style.transform);
      ws.forEach((w) => (w.style.transform = ""));
      const r = b.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      off.current = ws.map((w) => {
        const wr = w.getBoundingClientRect();
        const dx = wr.left + wr.width / 2 - cx;
        const dy = wr.top + wr.height / 2 - cy;
        return { dx, dy, n: Math.max(-1, Math.min(1, dx / (r.width / 2))) };
      });
      ws.forEach((w, i) => (w.style.transform = saved[i]));
    };
    measure();
    document.fonts?.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      split.revert();
      words.current = [];
    };
  }, []);
  useScrub(
    root,
    (p) => {
      const H = root.current?.clientHeight ?? 700;
      words.current.forEach((w, i) => {
        const o = off.current[i];
        if (!o) return;
        const a = Math.abs(o.n);
        // spread outward from the centre; side words turn away (rotationY) and sink back, centre words come forward
        w.style.transform = `translate3d(${o.dx * p * 1.1}px,${-p * H * (0.3 + 0.45 * a) + o.dy * p * 0.6}px,${(220 - 620 * a) * p}px) rotateY(${o.n * 75 * p}deg)`;
        w.style.opacity = String(1 - p);
      });
      if (cta.current) {
        cta.current.style.opacity = String(clamp01((p - 0.35) / 0.65));
        cta.current.style.transform = `scale(${0.88 + 0.12 * p})`;
      }
    },
    { finalValue: 0 },
  );
  return (
    <Stage r={root} g1="rgba(79,141,255,.48)" g2="rgba(255,77,109,.24)">
      <div ref={cta} className="absolute inset-0 grid place-items-center" style={{ opacity: 0 }} aria-hidden>
        <div className="text-center">
          <p className="text-[clamp(26px,2.6vw,40px)] italic" style={{ fontFamily: F.fr }}>
            The coastline edit is live.
          </p>
          <span className="mt-5 inline-block rounded-full bg-[#4f8dff] px-6 py-3 text-[15px] font-[650] text-[#05080f]" style={{ fontFamily: F.mr }}>
            Swimwear from ₹1,799
          </span>
        </div>
      </div>
      <div className="absolute inset-0 grid place-items-center px-[6%]" style={{ perspective: "900px" }}>
        <h3 ref={block} className="max-w-[16ch] text-center text-[clamp(52px,5.8vw,92px)] font-[600] leading-[1.06] tracking-[-0.02em]" style={{ fontFamily: F.sg, transformStyle: "preserve-3d" }}>
          Salt in the air and sand in every pocket
        </h3>
      </div>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M266", name: "Flip clock digits", how: "Countdown digits are flip cards: the top half folds down, the new bottom half lands; one flip per change (auto)", kind: "play", C: M266 },
  { code: "M267", name: "Flip-words drum", how: "A word drum steps up one word at a time with a small overshoot at each stop, 8 s cycle (auto, CSS)", kind: "play", C: M267 },
  { code: "M268", name: "Gradient reveal highlight", how: "A soft gradient highlight wipes across two phrases on enter and stays as a gentle tint (auto)", kind: "play", C: M268 },
  { code: "M269", name: "Gradient stroke name draw", how: "A signature draws itself with a stroke whose gradient keeps sliding, so it writes and shimmers (auto)", kind: "play", C: M269 },
  { code: "M270", name: "Hover-repel particle text", how: "Canvas particles form the word; near the pointer they flee and spring back (fake pointer sweeps)", kind: "play", C: M270 },
  { code: "M271", name: "Letters shrink away from centre", how: "Each letter scales 1 → 0.2 with its distance from the centre line as the headline scrolls through (scrub)", kind: "scrub", C: M271 },
  { code: "M272", name: "Multi-language greeting cycle", how: "A greeting cycles languages: the word blurs out upward, the next blurs in from below, every 1.5 s (auto)", kind: "play", C: M272 },
  { code: "M273", name: "Neon flicker with glow", how: "A neon sign flickers on with gaps, its glow builds and breathes, then cuts out and restarts (auto)", kind: "play", C: M273 },
  { code: "M274", name: "Origami fold letters", how: "Letters hinge open from their top edge (rotateX 90 → 0) in a stagger, hold, then tuck shut (auto)", kind: "play", C: M274 },
  { code: "M275", name: "Paper-fold unfold, side hinge", how: "Characters open like doors from their left edge (rotateY 92 → 0) while a crease shade lifts (auto)", kind: "play", C: M275 },
  { code: "M276", name: "Per-word clone ticker", how: "Every word rolls up to its clipped twin in a staggered loop, like a departures board (auto)", kind: "play", C: M276 },
  { code: "M277", name: "Pinned words fan out from centre", how: "Words spread out from the centre with rotateY and depth by distance, flying up and fading (scrub)", kind: "scrub", C: M277 },
];
