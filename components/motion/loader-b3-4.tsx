"use client";

// Loaders, batch 3 · group 4 (MOTION-MENU I11–I19). Small focused demos for /lab/motion.
// Every loader is contained inside its demo frame (never fixed to the viewport) and loops its whole sequence:
// in → load → hold (≤ 0.3 s) → reveal the hero → hold → restart. It pauses off screen and has a CSS-only glow loop that
// never stops. ?static=1 / reduced motion: no JS motion, the markup shows the revealed hero (loader plates start hidden).
import "@fontsource-variable/instrument-sans/wdth.css";
import { useEffect, useId, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { scene, useTicker } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = {
  sg: "Space Grotesk Variable",
  fr: "Fraunces Variable",
  is: "Instrument Serif",
  sy: "Syne Variable",
  mr: "Manrope Variable",
  ins: "Instrument Sans Variable",
};

const CSS = `
.b3g4l-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.42)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.2)),transparent 70%);animation:b3g4l-drift 5.8s linear infinite alternate;will-change:transform}
@keyframes b3g4l-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.i13-pan{position:absolute;inset:-8%;animation:i13-pan 7s linear infinite alternate}
@keyframes i13-pan{0%{transform:translate3d(-5%,-2%,0) scale(1.04)}100%{transform:translate3d(5%,2%,0) scale(1.1)}}
.i15-wave{animation:i15-w 1.7s linear infinite}
.i15-wave.b{animation-duration:2.6s;animation-direction:reverse}
@keyframes i15-w{0%{transform:translateX(0)}100%{transform:translateX(-100px)}}
html.is-static .b3g4l-glow,html.is-static .i13-pan,html.is-static .i15-wave{animation:none}
html.is-static {.b3g4l-glow,.i13-pan,.i15-wave{animation:none}}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0d16] text-[#eef2ff] ${className}`}>
      <style href="b3g4l-css" precedence="default">
        {CSS}
      </style>
      <div className="b3g4l-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/** The CSS glow loop again, ON TOP of full-bleed plates/photos (screen blend), so loaders never freeze. */
const Sheen = ({ g1 }: { g1?: string }) => (
  <div className="b3g4l-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.45, zIndex: 35 } as CSSProperties} aria-hidden />
);

/** "play" helper: waits for fonts, builds a looping animation in a gsap.context, plays it only while on screen,
 *  reverts on unmount. Nothing runs with prefersReducedMotion(). */
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
    Promise.resolve(document.fonts?.ready).then(() => {
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

/** An element's box relative to the root. */
function rel(node: Element, root: Element) {
  const a = node.getBoundingClientRect();
  const r = root.getBoundingClientRect();
  return { l: a.left - r.left, t: a.top - r.top, w: a.width, h: a.height };
}

/** A tween that counts 0 → 100 into a text node (padded), for loader read-outs. */
function count(node: HTMLElement | null, duration: number, ease = "power1.inOut", pad = 0, onP?: (p: number) => void) {
  const o = { v: 0 };
  return gsap.fromTo(
    o,
    { v: 0 },
    {
      v: 100,
      duration,
      ease,
      onUpdate: () => {
        if (node) node.textContent = String(Math.round(o.v)).padStart(pad, "0");
        onP?.(o.v / 100);
      },
    },
  );
}

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, className = "", style, label = "", w = 1600, h = 1000 }: { i: number; className?: string; style?: CSSProperties; label?: string; w?: number; h?: number }) => (
  <img src={scene(i, w, h, label)} alt="" className={`h-full w-full object-cover ${className}`} style={style} draggable={false} />
);

/** The page every loader reveals: photo, a small nav and a two-line headline (lines in masks: `.hx-line`). */
function Hero({ i, brand, lines, sub, logo, links = ["Shop", "Journal", "Stores", "Bag (0)"], font = F.fr, weight = 500, imgClass = "" }: { i: number; brand: string; lines: string[]; sub: string; logo?: ReactNode; links?: string[]; font?: string; weight?: number; imgClass?: string }) {
  return (
    <div className="hx absolute inset-0">
      <div className={`hx-bg absolute inset-0 ${imgClass}`}>
        <Img i={i} />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,15,.4),rgba(5,8,15,0)_35%,rgba(5,8,15,.78))]" />
      <nav className="absolute inset-x-[5%] top-[7%] flex items-center justify-between text-[14px] text-white/80">
        {logo ?? (
          <span className="text-[22px] font-[700] tracking-[-0.03em] text-white" style={{ fontFamily: F.sg }}>
            {brand}
          </span>
        )}
        <ul className="flex gap-7">
          {links.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </nav>
      <div className="absolute bottom-[10%] left-[5%] max-w-[70%]">
        {lines.map((l) => (
          <span key={l} className="block overflow-hidden pb-[0.04em]">
            <span className="hx-line block text-[clamp(50px,6vw,96px)] leading-[1] tracking-[-0.03em]" style={{ fontFamily: font, fontWeight: weight }}>
              {l}
            </span>
          </span>
        ))}
        <p className="mt-4 text-[15px] text-white/75">{sub}</p>
      </div>
    </div>
  );
}

/* ───────────────────────── I11 · Fog clears onto the hero ───────────────────────── */
// Two periodic value-noise fields (blurred by sampling + CSS blur) drift in opposite directions; the fog's density
// threshold `c` rises, so thin patches clear first and the hero emerges patch by patch.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function noiseField(W: number, H: number, seed: number) {
  const r = rng(seed);
  const out = new Float32Array(W * H);
  const octave = (cx: number, cy: number, amp: number) => {
    const g = Array.from({ length: cx * cy }, () => r());
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const gx = (x / W) * cx;
        const gy = (y / H) * cy;
        const x0 = Math.floor(gx);
        const y0 = Math.floor(gy);
        const fx = gx - x0;
        const fy = gy - y0;
        const sx = fx * fx * (3 - 2 * fx);
        const sy = fy * fy * (3 - 2 * fy);
        const at = (i: number, j: number) => g[(j % cy) * cx + (i % cx)];
        const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * sx;
        const b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * sx;
        out[y * W + x] += (a + (b - a) * sy) * amp;
      }
  };
  octave(6, 4, 0.65);
  octave(13, 8, 0.35);
  return out;
}
function sample(f: Float32Array, W: number, H: number, x: number, y: number) {
  x = ((x % W) + W) % W;
  y = ((y % H) + H) % H;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = (x0 + 1) % W;
  const y1 = (y0 + 1) % H;
  const fx = x - x0;
  const fy = y - y0;
  const a = f[y0 * W + x0] + (f[y0 * W + x1] - f[y0 * W + x0]) * fx;
  const b = f[y1 * W + x0] + (f[y1 * W + x1] - f[y1 * W + x0]) * fx;
  return a + (b - a) * fy;
}
function I11() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const fog = useRef({ c: -0.3, a: 1, ready: false });
  const data = useRef<{ f1: Float32Array; f2: Float32Array; img: ImageData; ctx: CanvasRenderingContext2D } | null>(null);
  const W = 200;
  const H = 120;
  useEffect(() => {
    const c = cv.current;
    if (!c || prefersReducedMotion()) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(W, H);
    for (let i = 0; i < W * H; i++) {
      img.data[i * 4] = 214;
      img.data[i * 4 + 1] = 222;
      img.data[i * 4 + 2] = 234;
    }
    data.current = { f1: noiseField(W, H, 7), f2: noiseField(W, H, 91), img, ctx };
    return () => {
      ctx.clearRect(0, 0, W, H);
      data.current = null;
    };
  }, []);
  useTicker(root, (t) => {
    const d = data.current;
    if (!d) return;
    const { c, a } = fog.current;
    const px = d.img.data;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const v = 0.5 * (sample(d.f1, W, H, x + t * 9, y + t * 2.2) + sample(d.f2, W, H, x - t * 7, y - t * 1.6));
        const k = Math.min(1, Math.max(0, (v - c) / 0.14));
        px[(y * W + x) * 4 + 3] = k * a * 245;
      }
    d.ctx.putImageData(d.img, 0, 0);
  });
  usePlay(root, (el) => {
    const s = fog.current;
    const label = el.querySelector<HTMLElement>(".i11-label")!;
    const pct = el.querySelector<HTMLElement>(".i11-pct")!;
    const bg = el.querySelector<HTMLElement>(".hx-bg")!;
    const lines = el.querySelectorAll<HTMLElement>(".hx-line");
    const tl = gsap.timeline({ repeat: -1, paused: true });
    // in: the fog rolls back over the page
    tl.to(s, { c: -0.3, a: 1, duration: 0.7, ease: "power2.in" })
      .to(lines, { yPercent: 110, duration: 0.4, ease: "power2.in" }, "<")
      .fromTo(label, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, "-=0.2")
      .set(bg, { scale: 1.08 })
      // loading under the fog (the fog itself keeps drifting)
      .add(count(pct, 0.9), "<")
      .to({}, { duration: 0.12 })
      // ready: density falls unevenly, thin patches clear first
      .addLabel("go")
      .to(label, { autoAlpha: 0, duration: 0.35 }, "go")
      .to(s, { c: 0.95, duration: 1.6, ease: "power1.inOut" }, "go")
      .to(s, { a: 0, duration: 0.5, ease: "power1.in" }, "go+=1.1")
      .to(bg, { scale: 1, duration: 1.6, ease: "power2.out" }, "go")
      .to(lines, { yPercent: 0, duration: 0.8, ease: "power3.out", stagger: 0.08 }, "go+=0.9")
      .to({}, { duration: 0.25 });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(160,190,230,.4)" g2="rgba(120,255,200,.14)">
      <Hero i={2} brand="Wraithmoor" lines={["Into the", "high moor."]} sub="Guided night walks · ₹ 2,200 a head" font={F.is} weight={400} />
      <canvas ref={cv} width={W} height={H} className="pointer-events-none absolute inset-0 z-10 h-full w-full" style={{ filter: "blur(10px)", transform: "scale(1.06)" }} aria-hidden />
      <div className="i11-label pointer-events-none absolute inset-0 z-20 grid place-items-center text-center text-[#1d2433]" style={{ visibility: "hidden" }}>
        <div>
          <p className="text-[13px] uppercase tracking-[0.3em]">Finding the trail</p>
          <p className="i11-pct mt-2 text-[44px] font-[600] leading-none" style={{ fontFamily: F.sg }}>
            0
          </p>
        </div>
      </div>
      <Sheen g1="rgba(200,215,240,.3)" />
    </Stage>
  );
}

/* ───────────────────────── I12 · Variable-font breathing word ───────────────────────── */
function I12() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const plate = el.querySelector<HTMLElement>(".i12-plate")!;
    const words = el.querySelectorAll<HTMLElement>(".i12-w");
    const pct = el.querySelector<HTMLElement>(".i12-pct")!;
    const bg = el.querySelector<HTMLElement>(".hx-bg")!;
    const lines = el.querySelectorAll<HTMLElement>(".hx-line");
    const ax = { w: 400, s: 75 };
    const paint = () => words.forEach((w) => (w.style.fontVariationSettings = `"wght" ${ax.w.toFixed(0)}, "wdth" ${ax.s.toFixed(1)}`));
    const tl = gsap.timeline({ repeat: -1, paused: true });
    tl.fromTo(plate, { autoAlpha: 0, yPercent: 0 }, { autoAlpha: 1, duration: 0.35, ease: "power1.out" })
      .set(words, { yPercent: 0 })
      .set(ax, { w: 400, s: 75, onComplete: paint })
      .set(lines, { yPercent: 110 })
      .set(bg, { scale: 1.1 })
      // loading: the word breathes through its axes (weight and width out of phase)
      .addLabel("load")
      .to(ax, { w: 700, duration: 0.55, ease: "sine.inOut", yoyo: true, repeat: 3, onUpdate: paint }, "load")
      .to(ax, { s: 100, duration: 0.73, ease: "sine.inOut", yoyo: true, repeat: 2, onUpdate: paint }, "load")
      .add(count(pct, 2.2, "none"), "load")
      // ready: settles on the logo weight, then its lines slide away to the hero
      .to(ax, { w: 620, s: 88, duration: 0.35, ease: "power2.out", onUpdate: paint })
      .to({}, { duration: 0.1 })
      .addLabel("go")
      .to(words, { yPercent: -110, duration: 0.6, ease: "power3.in", stagger: 0.08 }, "go")
      .to(plate, { yPercent: -100, duration: 0.8, ease: "power3.inOut" }, "go+=0.35")
      .to(bg, { scale: 1, duration: 1.1, ease: "power2.out" }, "go+=0.35")
      .to(lines, { yPercent: 0, duration: 0.7, ease: "power3.out", stagger: 0.08 }, "go+=0.7")
      .to({}, { duration: 0.25 });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,200,120,.38)">
      <Hero i={3} brand="Marlow & Vey" lines={["Linen for", "long summers."]} sub="The resort edit · from ₹ 4,600" />
      <div className="i12-plate absolute inset-0 z-10 grid place-items-center bg-[#f1ebe1] text-[#16120d]" style={{ visibility: "hidden" }}>
        <div className="text-center">
          {["Marlow", "& Vey"].map((w) => (
            <span key={w} className="block overflow-hidden">
              <span className="i12-w block text-[clamp(90px,11vw,170px)] leading-[0.98] tracking-[-0.02em]" style={{ fontFamily: F.ins, fontVariationSettings: '"wght" 620, "wdth" 88' }}>
                {w}
              </span>
            </span>
          ))}
          <p className="mt-6 text-[13px] uppercase tracking-[0.3em] text-[#16120d]/55">
            Loading <span className="i12-pct inline-block w-[3ch] text-left">100</span>
          </p>
        </div>
      </div>
      <Sheen g1="rgba(255,190,120,.28)" />
    </Stage>
  );
}

/* ───────────────────────── I13 · Knockout word over moving image ───────────────────────── */
function I13() {
  const root = useRef<HTMLDivElement>(null);
  const id = useId().replace(/:/g, "");
  usePlay(root, (el) => {
    const plate = el.querySelector<SVGSVGElement>(".i13-plate")!;
    const pct = el.querySelector<HTMLElement>(".i13-pct")!;
    const bg = el.querySelector<HTMLElement>(".hx-bg")!;
    const lines = el.querySelectorAll<HTMLElement>(".hx-line");
    const nav = el.querySelector<HTMLElement>(".hx nav")!;
    const tl = gsap.timeline({ repeat: -1, paused: true });
    tl.fromTo(plate, { autoAlpha: 0, scale: 1 }, { autoAlpha: 1, duration: 0.35, ease: "power1.out" })
      .to(lines, { yPercent: 110, duration: 0.3 }, "<")
      .to(nav, { autoAlpha: 0, duration: 0.3 }, "<")
      .set(bg, { scale: 1.12 })
      // loading: the photo pans (CSS) behind the letters
      .add(count(pct, 1.1), ">-0.05")
      .to({}, { duration: 0.12 })
      // ready: the plate scales up and fades, the full image is the hero
      .addLabel("go")
      .to(plate, { scale: 9, duration: 1.1, ease: "power3.in" }, "go")
      .to(plate, { autoAlpha: 0, duration: 0.35, ease: "none" }, "go+=0.75")
      .to(bg, { scale: 1, duration: 1.3, ease: "power2.out" }, "go+=0.2")
      .to(nav, { autoAlpha: 1, duration: 0.4 }, "go+=0.9")
      .to(lines, { yPercent: 0, duration: 0.7, ease: "power3.out", stagger: 0.08 }, "go+=0.9")
      .to({}, { duration: 0.25 });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,140,90,.4)">
      <Hero i={1} brand="Luma" lines={["Golden hour,", "bottled."]} sub="Sun serum 30 ml · ₹ 1,850" imgClass="i13-pan" font={F.sy} weight={700} />
      <svg className="i13-plate pointer-events-none absolute inset-0 z-10 h-full w-full" style={{ visibility: "hidden", transformOrigin: "50% 50%" }} aria-hidden>
        <defs>
          <mask id={`i13m${id}`}>
            <rect width="100%" height="100%" fill="#fff" />
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fill="#000" style={{ fontFamily: F.sy, fontWeight: 800, fontSize: "min(16vw, 30vh)", letterSpacing: "-0.02em" }}>
              LUMA
            </text>
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="#f2ece2" mask={`url(#i13m${id})`} />
        <text x="50%" y="88%" textAnchor="middle" fill="#1c1712" style={{ fontFamily: F.sg, fontSize: 13, letterSpacing: "0.3em" }}>
          LOADING THE SUMMER EDIT ·{" "}
          <tspan className="i13-pct" fontWeight={700}>
            100
          </tspan>
        </text>
      </svg>
      <Sheen g1="rgba(255,170,110,.3)" />
    </Stage>
  );
}

/* ───────────────────────── I14 · Product outline draws as progress ───────────────────────── */
const I14_BOTTLE = "M50 10h20v34q0 8 8 14q24 16 24 48v164q0 16 -16 16h-52q-16 0 -16 -16v-164q0 -32 24 -48q8 -6 8 -14z";
function I14() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const prod = el.querySelector<HTMLElement>(".i14-prod")!;
    const strokes = el.querySelectorAll<SVGPathElement>(".i14-s");
    const fills = el.querySelectorAll<SVGElement>(".i14-f");
    const plate = el.querySelector<HTMLElement>(".i14-plate")!;
    const pct = el.querySelector<HTMLElement>(".i14-pct")!;
    const copy = el.querySelectorAll<HTMLElement>(".i14-copy");
    const dx = () => {
      const b = rel(prod, el);
      return el.clientWidth / 2 - (b.l + b.w / 2) - (Number(gsap.getProperty(prod, "x")) || 0);
    };
    const tl = gsap.timeline({ repeat: -1, repeatRefresh: true, paused: true });
    tl.fromTo(plate, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: "power1.out" })
      .to([prod, ...copy], { autoAlpha: 0, duration: 0.3 }, "<")
      .set(prod, { x: dx, scale: 0.78 })
      .set(fills, { fillOpacity: 0 })
      .set(strokes, { drawSVG: "0%" })
      .set(copy, { y: 24 })
      .set(prod, { autoAlpha: 1 })
      // loading: the outline draws with progress
      .addLabel("load")
      .to(strokes, { drawSVG: "100%", duration: 1.2, ease: "power1.inOut", stagger: 0.12 }, "load")
      .add(count(pct, 1.3), "load")
      // 100%: it fills with the brand colour, then hands over to the hero product
      .to(fills, { fillOpacity: 1, duration: 0.45, ease: "power2.out", stagger: 0.05 })
      .to({}, { duration: 0.1 })
      .addLabel("go")
      .to(prod, { x: 0, scale: 1, duration: 1.0, ease: "power3.inOut" }, "go")
      .to(plate, { autoAlpha: 0, duration: 0.6, ease: "power2.inOut" }, "go+=0.2")
      .to(copy, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.07 }, "go+=0.55")
      .to({}, { duration: 0.25 });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(200,220,90,.38)" g2="rgba(255,160,80,.2)">
      <div className="absolute inset-0 grid grid-cols-[1.1fr_1fr] items-center px-[6%]">
        <div className="relative z-[5]">
          <p className="i14-copy text-[13px] uppercase tracking-[0.25em] text-[#d4e07a]">Olivara · First harvest</p>
          <h3 className="i14-copy mt-4 text-[clamp(52px,5.6vw,90px)] leading-[0.98] tracking-[-0.02em]" style={{ fontFamily: F.fr, fontWeight: 500 }}>
            Cold-pressed,
            <br />
            <em className="font-[400]">the same morning.</em>
          </h3>
          <p className="i14-copy mt-5 text-[16px] text-white/70">Early-harvest olive oil · 500 ml · ₹ 1,450</p>
        </div>
        <div className="flex justify-center">
          <div className="i14-prod relative z-20 h-[min(78%,520px)]" style={{ aspectRatio: "120 / 310" }}>
            <svg viewBox="0 0 120 310" className="h-full w-full overflow-visible" fill="none" aria-hidden>
              <path className="i14-s i14-f" d={I14_BOTTLE} stroke="#e6f08c" strokeWidth={2} fill="#9db534" style={{ fillOpacity: 1 }} />
              <path className="i14-s i14-f" d="M22 150h76v80h-76z" stroke="#f6f2e4" strokeWidth={1.6} fill="#f6f2e4" style={{ fillOpacity: 1 }} />
              <path className="i14-s" d="M48 4h24v14h-24z" stroke="#e6f08c" strokeWidth={2} />
              <path className="i14-s" d="M34 176h52M34 192h34" stroke="#2b3410" strokeWidth={2} strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>
      <div className="i14-plate absolute inset-0 z-10 bg-[#0c0f08]" style={{ visibility: "hidden" }}>
        <p className="absolute inset-x-0 bottom-[8%] text-center text-[13px] uppercase tracking-[0.3em] text-white/60">
          Pressing <span className="i14-pct inline-block w-[3ch] text-left text-[#e6f08c]">100</span>%
        </p>
      </div>
      <Sheen g1="rgba(210,230,110,.3)" />
    </Stage>
  );
}

/* ───────────────────────── I15 · Liquid fills the glass ───────────────────────── */
// A wave path, period 100 units, from x=-100 to x=500, closed far below: translating it by one period loops seamlessly.
const wave = (amp: number, depth = 400) => {
  let d = `M-100 0`;
  for (let x = -100; x < 500; x += 100) d += ` Q${x + 25} ${-amp} ${x + 50} 0 Q${x + 75} ${amp} ${x + 100} 0`;
  return `${d} L500 ${depth} L-100 ${depth}Z`;
};
const I15_GLASS = "M30 20L170 20L154 282Q153 296 139 296L61 296Q47 296 46 282Z";
function I15() {
  const root = useRef<HTMLDivElement>(null);
  const id = useId().replace(/:/g, "");
  usePlay(root, (el) => {
    const plate = el.querySelector<HTMLElement>(".i15-plate")!;
    const level = el.querySelector<SVGGElement>(".i15-level")!;
    const pct = el.querySelector<HTMLElement>(".i15-pct")!;
    const flood = el.querySelector<HTMLElement>(".i15-flood")!;
    const bg = el.querySelector<HTMLElement>(".hx-bg")!;
    const lines = el.querySelectorAll<HTMLElement>(".hx-line");
    const tl = gsap.timeline({ repeat: -1, paused: true });
    tl.set(level, { y: 300 })
      .fromTo(plate, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: "power1.out" })
      .set(lines, { yPercent: 110 })
      .set(bg, { scale: 1.1 })
      // loading: the surface (CSS wave) rises with progress
      .addLabel("load")
      .to(level, { y: 46, duration: 1.4, ease: "power1.inOut" }, "load")
      .add(count(pct, 1.4), "load")
      // 100%: the liquid floods up over the frame, then drains off the top onto the hero
      .addLabel("go")
      .fromTo(flood, { autoAlpha: 1, yPercent: 112 }, { yPercent: 0, duration: 0.6, ease: "power2.in" }, "go")
      .set(plate, { autoAlpha: 0 })
      .to(flood, { yPercent: -112, duration: 0.8, ease: "power2.out" })
      .to(bg, { scale: 1, duration: 1.1, ease: "power2.out" }, "<")
      .to(lines, { yPercent: 0, duration: 0.7, ease: "power3.out", stagger: 0.08 }, "<0.25")
      .set(flood, { autoAlpha: 0 })
      .to({}, { duration: 0.25 });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,120,150,.38)" g2="rgba(255,200,120,.2)">
      <Hero i={1} brand="Rosehaul" lines={["Sparkling rosé,", "zero proof."]} sub="Case of six · ₹ 2,940" />
      <div className="i15-plate absolute inset-0 z-10 flex items-center justify-center gap-[6%] bg-[#12080c]" style={{ visibility: "hidden" }}>
        <svg viewBox="0 0 200 300" className="h-[78%] overflow-visible" aria-hidden>
          <defs>
            <clipPath id={`i15c${id}`}>
              <path d={I15_GLASS} />
            </clipPath>
            <linearGradient id={`i15g${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ff8fa8" />
              <stop offset="1" stopColor="#c42d5b" />
            </linearGradient>
          </defs>
          <g clipPath={`url(#i15c${id})`}>
            <g className="i15-level" transform="translate(0 46)">
              <g transform="translate(0 -4)">
                <path className="i15-wave b" d={wave(5)} fill="#ff6f8f" opacity={0.5} />
              </g>
              <path className="i15-wave" d={wave(7)} fill={`url(#i15g${id})`} />
            </g>
          </g>
          <path d={I15_GLASS} fill="none" stroke="rgba(255,255,255,.7)" strokeWidth={2.5} />
          <path d="M44 40L36 200" stroke="rgba(255,255,255,.35)" strokeWidth={4} strokeLinecap="round" />
        </svg>
        <div>
          <p className="text-[13px] uppercase tracking-[0.3em] text-white/55">Pouring</p>
          <p className="text-[clamp(64px,7vw,110px)] font-[600] leading-none text-[#ff8fa8]" style={{ fontFamily: F.sg }}>
            <span className="i15-pct">100</span>
            <span className="text-[0.4em]">%</span>
          </p>
        </div>
      </div>
      <div className="i15-flood pointer-events-none absolute inset-x-0 bottom-0 top-0 z-30 bg-[#c42d5b]" style={{ visibility: "hidden" }} aria-hidden>
        <svg viewBox="0 0 400 30" preserveAspectRatio="none" className="absolute inset-x-0 -top-[38px] h-[40px] w-full overflow-visible">
          <g transform="translate(0 15)">
            <path className="i15-wave" d={wave(9, 40)} fill="#c42d5b" />
          </g>
        </svg>
      </div>
      <Sheen g1="rgba(255,140,170,.3)" />
    </Stage>
  );
}

/* ───────────────────────── I16 · Branded corner counter becomes the wipe ───────────────────────── */
function I16() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const plate = el.querySelector<HTMLElement>(".i16-plate")!;
    const num = el.querySelector<HTMLElement>(".i16-num")!;
    const digits = el.querySelector<HTMLElement>(".i16-d")!;
    const bg = el.querySelector<HTMLElement>(".hx-bg")!;
    const lines = el.querySelectorAll<HTMLElement>(".hx-line");
    const tl = gsap.timeline({ repeat: -1, paused: true });
    // in: the plate wipes back up from the bottom, the digits rise into their mask
    tl.call(() => (digits.textContent = "0"))
      .fromTo(plate, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.45, ease: "power3.inOut" })
      .fromTo(num, { yPercent: 110 }, { yPercent: 0, duration: 0.4, ease: "power3.out" }, "-=0.15")
      .set(lines, { yPercent: 110 })
      .set(bg, { scale: 1.12 })
      // loading: the corner counter runs 0 → 100
      .add(count(digits, 1.3, "power2.inOut"), "<")
      .to({}, { duration: 0.12 })
      // 100: digits slide up out of the mask, the colour plate wipes off (~0.8 s)
      .addLabel("go")
      .to(num, { yPercent: -110, duration: 0.45, ease: "power3.in" }, "go")
      .to(plate, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.8, ease: "power4.inOut" }, "go+=0.2")
      .to(bg, { scale: 1, duration: 1.1, ease: "power2.out" }, "go+=0.35")
      .to(lines, { yPercent: 0, duration: 0.7, ease: "power3.out", stagger: 0.08 }, "go+=0.6")
      .to({}, { duration: 0.25 });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,110,80,.4)">
      <Hero i={0} brand="Orrin Works" lines={["Interfaces with", "a pulse."]} sub="Product studio · projects from ₹ 9 lakh" font={F.sg} weight={600} />
      <div className="i16-plate absolute inset-0 z-10 bg-[#ff5b36] text-[#160603]" style={{ clipPath: "inset(0% 0% 100% 0%)" }}>
        <p className="absolute left-[5%] top-[7%] text-[22px] font-[700] tracking-[-0.03em]" style={{ fontFamily: F.sg }}>
          Orrin Works
        </p>
        <p className="absolute left-[5%] bottom-[8%] max-w-[260px] text-[14px] leading-snug text-[#160603]/70">Tuning the studio reel. One moment.</p>
        <div className="absolute bottom-[4%] right-[4%] overflow-hidden">
          <p className="i16-num flex items-start text-[clamp(140px,17vw,250px)] font-[700] leading-[0.86] tracking-[-0.05em]" style={{ fontFamily: F.sg, fontVariantNumeric: "tabular-nums" }}>
            <span className="i16-d">100</span>
            <span className="mt-[0.12em] text-[0.22em] tracking-normal">%</span>
          </p>
        </div>
      </div>
      <Sheen g1="rgba(255,140,100,.3)" />
    </Stage>
  );
}

/* ───────────────────────── I17 · Circle fills, then shrinks into the logo ───────────────────────── */
function I17() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const plate = el.querySelector<HTMLElement>(".i17-plate")!;
    const ring = el.querySelector<HTMLElement>(".i17-ring")!;
    const arc = el.querySelector<SVGCircleElement>(".i17-arc")!;
    const disc = el.querySelector<SVGCircleElement>(".i17-disc")!;
    const pct = el.querySelector<HTMLElement>(".i17-pct")!;
    const dot = el.querySelector<HTMLElement>(".i17-dot")!;
    const bg = el.querySelector<HTMLElement>(".hx-bg")!;
    const lines = el.querySelectorAll<HTMLElement>(".hx-line");
    // where the logo dot sits, relative to the ring's centred home
    const target = () => {
      const d = rel(dot, el);
      const r = rel(ring, el);
      const x0 = Number(gsap.getProperty(ring, "x")) || 0;
      const y0 = Number(gsap.getProperty(ring, "y")) || 0;
      return { x: d.l + d.w / 2 - (r.l - x0 + r.w / 2), y: d.t + d.h / 2 - (r.t - y0 + r.h / 2), s: d.w / Math.max(1, ring.offsetWidth), cx: ((d.l + d.w / 2) / el.clientWidth) * 100, cy: ((d.t + d.h / 2) / el.clientHeight) * 100 };
    };
    const tl = gsap.timeline({ repeat: -1, repeatRefresh: true, paused: true });
    tl.set(plate, { clipPath: "circle(150% at 50% 50%)" })
      .set(ring, { x: 0, y: 0, scale: 1 })
      .set(arc, { drawSVG: "0%" })
      .set(disc, { scale: 0, transformOrigin: "50% 50%" })
      .set(pct, { autoAlpha: 1 })
      .call(() => (pct.textContent = "0"))
      .fromTo([plate, ring], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: "power1.out" })
      .set(lines, { yPercent: 110 })
      .set(bg, { scale: 1.1 })
      // loading: the outline fills with progress
      .addLabel("load")
      .to(arc, { drawSVG: "100%", duration: 1.2, ease: "power1.inOut" }, "load")
      .add(count(pct, 1.2), "load")
      // 100%: the circle fills solid…
      .to(pct, { autoAlpha: 0, duration: 0.2 })
      .to(disc, { scale: 1, duration: 0.4, ease: "power3.out" }, "<")
      .to({}, { duration: 0.08 })
      // …then shrinks into the logo spot in the nav, and the plate closes onto it, uncovering the page
      .addLabel("go")
      .to(ring, { x: () => target().x, y: () => target().y, scale: () => target().s, duration: 0.9, ease: "power3.inOut" }, "go")
      .to(plate, { clipPath: () => `circle(0% at ${target().cx.toFixed(2)}% ${target().cy.toFixed(2)}%)`, duration: 0.9, ease: "power3.inOut" }, "go")
      .to(bg, { scale: 1, duration: 1.1, ease: "power2.out" }, "go+=0.2")
      .to(lines, { yPercent: 0, duration: 0.7, ease: "power3.out", stagger: 0.08 }, "go+=0.55")
      .set(ring, { autoAlpha: 0 })
      .to({}, { duration: 0.25 });
    return tl;
  });
  const logo = (
    <span className="flex items-center gap-2.5 text-[22px] font-[700] tracking-[-0.03em] text-white" style={{ fontFamily: F.sg }}>
      <span className="i17-dot inline-block h-[22px] w-[22px] rounded-full bg-[#46e0b4]" />
      dora expo
    </span>
  );
  return (
    <Stage r={root} g1="rgba(70,224,180,.36)">
      <Hero i={2} brand="dora expo" logo={logo} lines={["Design week,", "after dark."]} sub="Three nights · passes from ₹ 1,200" links={["Programme", "Venues", "Passes"]} font={F.sg} weight={600} />
      <div className="i17-plate absolute inset-0 z-10 bg-[#06100d]" style={{ visibility: "hidden" }} />
      <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center">
        <div className="i17-ring relative h-[200px] w-[200px]" style={{ visibility: "hidden" }}>
          <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
            <circle cx="100" cy="100" r="96" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth={4} />
            <circle className="i17-arc" cx="100" cy="100" r="96" fill="none" stroke="#46e0b4" strokeWidth={4} strokeLinecap="round" transform="rotate(-90 100 100)" />
            <circle className="i17-disc" cx="100" cy="100" r="98" fill="#46e0b4" />
          </svg>
          <p className="absolute inset-0 grid place-items-center text-[40px] font-[600] text-white" style={{ fontFamily: F.sg }}>
            <span className="i17-pct">100</span>
          </p>
        </div>
      </div>
      <Sheen g1="rgba(90,230,190,.28)" />
    </Stage>
  );
}

/* ───────────────────────── I18 · Word drains to its second colour ───────────────────────── */
const I18_DIRS = [
  { k: "tb", label: "Top to bottom", clip: (p: number) => `inset(${(p * 100).toFixed(2)}% 0% 0% 0%)` },
  { k: "lr", label: "Left to right", clip: (p: number) => `inset(0% 0% 0% ${(p * 100).toFixed(2)}%)` },
];
function I18() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const plate = el.querySelector<HTMLElement>(".i18-plate")!;
    const tops = I18_DIRS.map((d) => el.querySelector<HTMLElement>(`.i18-top-${d.k}`)!);
    const rows = el.querySelectorAll<HTMLElement>(".i18-row");
    const pct = el.querySelector<HTMLElement>(".i18-pct")!;
    const bg = el.querySelector<HTMLElement>(".hx-bg")!;
    const lines = el.querySelectorAll<HTMLElement>(".hx-line");
    const fill = (p: number) => tops.forEach((t, i) => (t.style.clipPath = I18_DIRS[i].clip(p)));
    const tl = gsap.timeline({ repeat: -1, paused: true });
    tl.set(plate, { yPercent: 0 })
      .set(rows, { yPercent: 0 })
      .call(() => fill(0))
      .fromTo(plate, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: "power1.out" })
      .set(lines, { yPercent: 110 })
      .set(bg, { scale: 1.1 })
      // loading: the top copy's clip shrinks, the word empties into its second colour
      .add(count(pct, 1.5, "power1.inOut", 0, fill))
      .to({}, { duration: 0.12 })
      .addLabel("go")
      .to(rows, { yPercent: -110, duration: 0.5, ease: "power3.in", stagger: 0.07 }, "go")
      .to(plate, { yPercent: -100, duration: 0.8, ease: "power3.inOut" }, "go+=0.3")
      .to(bg, { scale: 1, duration: 1.1, ease: "power2.out" }, "go+=0.3")
      .to(lines, { yPercent: 0, duration: 0.7, ease: "power3.out", stagger: 0.08 }, "go+=0.65")
      .to({}, { duration: 0.25 });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(245,194,107,.38)" g2="rgba(91,108,255,.24)">
      <Hero i={3} brand="Verano" lines={["Sun-dried", "on the coast."]} sub="Sea-salt crisps · 6 tins ₹ 1,140" />
      <div className="i18-plate absolute inset-0 z-10 flex flex-col items-center justify-center gap-[4%] bg-[#0d1020]" style={{ visibility: "hidden" }}>
        {I18_DIRS.map((d) => (
          <div key={d.k} className="overflow-hidden">
            <div className="i18-row text-center">
              <p className="mb-1 text-[12px] uppercase tracking-[0.3em] text-white/45">{d.label}</p>
              <div className="relative text-[clamp(80px,9vw,140px)] font-[800] uppercase leading-[0.95] tracking-[-0.02em]" style={{ fontFamily: F.sy }}>
                <span className="block text-[#3a4677]">Verano</span>
                <span className={`i18-top-${d.k} absolute inset-0 block text-[#f5c26b]`} aria-hidden>
                  Verano
                </span>
              </div>
            </div>
          </div>
        ))}
        <p className="text-[13px] tracking-[0.3em] text-white/55" style={{ fontFamily: F.sg }}>
          <span className="i18-pct">100</span>%
        </p>
      </div>
      <Sheen g1="rgba(245,194,107,.28)" />
    </Stage>
  );
}

/* ───────────────────────── I19 · Tracking breath ───────────────────────── */
function I19() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const halves = el.querySelectorAll<HTMLElement>(".i19-half");
    const word = el.querySelector<HTMLElement>(".i19-w")!;
    const note = el.querySelector<HTMLElement>(".i19-note")!;
    const bg = el.querySelector<HTMLElement>(".hx-bg")!;
    const lines = el.querySelectorAll<HTMLElement>(".hx-line");
    const tl = gsap.timeline({ repeat: -1, paused: true });
    tl.set(halves, { yPercent: 0 })
      .set(word, { yPercent: 0, letterSpacing: "2px", opacity: 1 })
      .fromTo([...halves, word, note], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: "power1.out" })
      .set(lines, { yPercent: 110 })
      .set(bg, { scale: 1.1 })
      // loading: the tracking opens while the word fades, then closes back: a slow breath out and in
      .to(word, { letterSpacing: "32px", opacity: 0.28, duration: 0.85, ease: "sine.inOut", yoyo: true, repeat: 1 })
      // ready: it locks at the logo spacing
      .to(word, { letterSpacing: "12px", opacity: 1, duration: 0.45, ease: "power2.out" })
      .to({}, { duration: 0.12 })
      .addLabel("go")
      .to([word, note], { yPercent: -120, autoAlpha: 0, duration: 0.45, ease: "power3.in" }, "go")
      .to(halves[0], { yPercent: -100, duration: 0.8, ease: "power3.inOut" }, "go+=0.25")
      .to(halves[1], { yPercent: 100, duration: 0.8, ease: "power3.inOut" }, "<")
      .to(bg, { scale: 1, duration: 1.1, ease: "power2.out" }, "<")
      .to(lines, { yPercent: 0, duration: 0.7, ease: "power3.out", stagger: 0.08 }, "go+=0.6")
      .to({}, { duration: 0.25 });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(160,200,255,.38)">
      <Hero i={0} brand="HALCYON" lines={["Sleep, tuned", "to the tide."]} sub="Weighted linen duvet · ₹ 12,800" font={F.mr} weight={500} />
      <div className="i19-half absolute inset-x-0 top-0 z-10 h-1/2 bg-[#e9eef5]" style={{ visibility: "hidden" }} />
      <div className="i19-half absolute inset-x-0 bottom-0 z-10 h-1/2 bg-[#e9eef5]" style={{ visibility: "hidden" }} />
      <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center text-[#121826]">
        <div className="overflow-hidden text-center">
          <p className="i19-w text-[clamp(56px,6.6vw,100px)] font-[500] uppercase leading-[1.05]" style={{ fontFamily: F.mr, letterSpacing: "12px", visibility: "hidden" }}>
            Halcyon
          </p>
          <p className="i19-note mt-3 text-[13px] uppercase tracking-[0.3em] text-[#121826]/55" style={{ visibility: "hidden" }}>
            Breathe in · loading
          </p>
        </div>
      </div>
      <Sheen g1="rgba(170,205,255,.28)" />
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "I11", name: "Fog clears onto the hero", how: "Two drifting noise fogs (canvas) cover the page while loading; on ready their density falls unevenly and the hero emerges patch by patch (~1.6 s).", kind: "play", C: I11 },
  { code: "I12", name: "Variable-font breathing word", how: "The brand word breathes through its weight and width axes while loading, settles on the logo weight, then its lines slide away to the hero.", kind: "play", C: I12 },
  { code: "I13", name: "Knockout word over moving image", how: "A huge word is knocked out of a plate so the panning photo shows only through the letters; on ready the plate scales up and fades into the hero.", kind: "play", C: I13 },
  { code: "I14", name: "Product outline draws as progress", how: "The bottle outline draws with load progress (DrawSVG), fills with the brand colour at 100% and glides into its hero spot.", kind: "play", C: I14 },
  { code: "I15", name: "Liquid fills the glass", how: "A wavy liquid rises inside the glass with progress; at 100% it floods up over the frame and drains off the top onto the hero.", kind: "play", C: I15 },
  { code: "I16", name: "Branded corner counter becomes the wipe", how: "A big 0–100 counter in the corner; at 100 the digits slide up out of their mask and the colour plate wipes off the hero (~0.8 s).", kind: "play", C: I16 },
  { code: "I17", name: "Circle fills, then shrinks into the logo", how: "A ring draws with progress, fills solid at 100%, then shrinks into the nav logo dot while the plate closes onto it.", kind: "play", C: I17 },
  { code: "I18", name: "Word drains to its second colour", how: "The word's top copy is clipped away with progress so it empties into its second colour: top to bottom and left to right.", kind: "play", C: I18 },
  { code: "I19", name: "Tracking breath", how: "The word's letter-spacing opens (2 → 32 px) as it fades, closes back, locks at the logo spacing, then the plate splits to the hero.", kind: "play", C: I19 },
];
