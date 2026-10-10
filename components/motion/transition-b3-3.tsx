"use client";

// Transition motions, batch 3 · group 3 (MOTION-MENU X27–X38). Small focused demos for /lab/motion.
// Every demo loops A → B → A between two simple "pages" while on screen (auto-advance; a fake pointer stands in for
// clicks), pauses off screen, and has a CSS-only glow loop (also ON TOP of the pages) that never stops.
// ?static=1 / reduced motion: no JS motion, the markup shows page A with every cover hidden.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import type { Flip as FlipT } from "gsap/Flip";
import { gsap, loadPlugin, prefersReducedMotion } from "@/lib/gsap";
import { scene } from "@/components/fx/shared";
import { Product } from "@/components/sections/kit";
import type { MotionDef } from "./types";

const F = { sg: "Space Grotesk Variable", fr: "Fraunces Variable", is: "Instrument Serif", sy: "Syne Variable", mr: "Manrope Variable" };

const CSS = `
.b3g3x-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(255,213,154,.4)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,143,122,.2)),transparent 70%);animation:b3g3x-drift 5.6s linear infinite alternate;will-change:transform}
@keyframes b3g3x-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b3g3x-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4);pointer-events:none;z-index:40}
.b3g3x-dot::after{content:"";position:absolute;inset:-8px;border-radius:50%;border:1.5px solid rgba(255,255,255,.7);animation:b3g3x-ping 1.2s ease-out infinite}
@keyframes b3g3x-ping{0%{transform:scale(.5);opacity:1}100%{transform:scale(1.8);opacity:0}}
.x33-c{container-type:size}
.x38-tab{transition:color .3s}.x38-tab.on{color:#fff}
html.is-static .b3g3x-glow,html.is-static .b3g3x-dot::after{animation:none}
html.is-static .b3g3x-dot{display:none}
html.is-static {
  .b3g3x-glow,.b3g3x-dot::after{animation:none}
  .b3g3x-dot{display:none}
}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", g1, g2, style }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string; style?: CSSProperties }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0b0a0d] text-[#f6f1ea] ${className}`} style={style}>
      <style href="b3g3x-css" precedence="default">
        {CSS}
      </style>
      <div className="b3g3x-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="x-in relative h-full w-full">{children}</div>
    </div>
  );
}

/** The CSS glow loop again, ON TOP of full-bleed pages (screen blend), so page swaps never read as a freeze. */
const Sheen = ({ g1 }: { g1?: string }) => (
  <div className="b3g3x-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.45, zIndex: 35 } as CSSProperties} aria-hidden />
);

/**
 * "play" helper: waits for fonts (+ an optional plugin), builds the looping timeline inside a gsap.context, plays it
 * only while on screen, rebuilds after a resize (measured layouts), reverts on unmount. Nothing runs with
 * prefersReducedMotion().
 */
function usePlay(ref: RefObject<HTMLElement | null>, build: (root: HTMLElement) => gsap.core.Animation | void, pre?: () => Promise<unknown>) {
  const b = useRef(build);
  b.current = build;
  const p = useRef(pre);
  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    let dead = false;
    let on = false;
    let ready = false;
    let anim: gsap.core.Animation | void;
    let ctx = gsap.context(() => {}, root);
    let timer = 0;
    const sync = () => {
      if (!anim) return;
      if (on) anim.play();
      else anim.pause();
    };
    const make = () => {
      ctx.revert();
      ctx = gsap.context(() => {}, root);
      ctx.add(() => {
        anim = b.current(root);
      });
      sync();
    };
    const io = new IntersectionObserver(
      ([e]) => {
        on = e.isIntersecting;
        sync();
      },
      { threshold: 0.1 },
    );
    io.observe(root);
    const onResize = () => {
      if (!ready) return;
      clearTimeout(timer);
      timer = window.setTimeout(make, 220);
    };
    window.addEventListener("resize", onResize);
    Promise.all([document.fonts?.ready, p.current?.()]).then(() => {
      if (dead) return;
      ready = true;
      make();
    });
    return () => {
      dead = true;
      clearTimeout(timer);
      io.disconnect();
      window.removeEventListener("resize", onResize);
      ctx.revert();
    };
  }, [ref]);
}

/** An element's box relative to another element (layout px, ignores nothing: call before transforms are applied). */
function rel(node: Element, root: Element) {
  const a = node.getBoundingClientRect();
  const r = root.getBoundingClientRect();
  return { x: a.left - r.left, y: a.top - r.top, w: a.width, h: a.height };
}

const hold = (tl: gsap.core.Timeline, d = 0.3) => tl.to({}, { duration: d });

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, className = "", style, w = 1200, h = 1000 }: { i: number; className?: string; style?: CSSProperties; w?: number; h?: number }) => (
  <img src={scene(i, w, h)} alt="" className={`h-full w-full object-cover ${className}`} style={style} draggable={false} />
);

/* ---------- the two simple "pages" every transition swaps between ---------- */

type PageData = { brand: string; kicker: string; title: string; body: string; price: string; i: number; bg: string; acc: string };
const PA: PageData = {
  brand: "Halden & Loom",
  kicker: "Spring capsule · 01",
  title: "Linen for slow mornings",
  body: "Stone-washed flax, cut loose and finished by hand in small runs.",
  price: "₹ 3,450",
  i: 3,
  bg: "#15100a",
  acc: "#ffd59a",
};
const PB: PageData = {
  brand: "Halden & Loom",
  kicker: "Ceramics · 02",
  title: "Clay, thrown by hand",
  body: "Small-batch stoneware, glazed in wood ash and iron oxide.",
  price: "₹ 2,180",
  i: 1,
  bg: "#170a10",
  acc: "#ff9b85",
};

/** A full mini landing page: nav strip, text column (lines marked data-l for staggers), product photo. */
function Page({ d, className = "", style }: { d: PageData; className?: string; style?: CSSProperties }) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`} style={{ background: d.bg, ...style }}>
      <div className="absolute inset-0" style={{ background: `radial-gradient(60% 70% at 78% 50%, ${d.acc}26, transparent 70%)` }} />
      <div className="absolute inset-x-[5%] top-[7%] flex items-center justify-between text-[13px] uppercase tracking-[0.2em] text-white/60" style={{ fontFamily: F.mr }}>
        <span className="font-[700] text-white">{d.brand}</span>
        <span className="flex gap-7">
          <span>Shop</span>
          <span>Journal</span>
          <span>Bag (0)</span>
        </span>
      </div>
      <div className="absolute inset-x-[5%] bottom-[8%] top-[18%] flex items-center gap-[5%]">
        <div className="w-[46%]">
          <p data-l className="text-[13px] uppercase tracking-[0.22em]" style={{ color: d.acc, fontFamily: F.mr }}>
            {d.kicker}
          </p>
          <h3 data-l className="mt-4 text-[clamp(44px,4.6vw,76px)] leading-[0.98]" style={{ fontFamily: F.fr }}>
            {d.title}
          </h3>
          <p data-l className="mt-5 max-w-[36ch] text-[16px] text-white/65" style={{ fontFamily: F.mr }}>
            {d.body}
          </p>
          <div data-l className="mt-7 flex items-center gap-5" style={{ fontFamily: F.sg }}>
            <span className="rounded-full px-6 py-3 text-[14px] font-[600] text-[#120d08]" style={{ background: d.acc }}>
              Shop the edit
            </span>
            <span className="text-[20px] tabular-nums">{d.price}</span>
          </div>
        </div>
        <div className="relative h-full flex-1 overflow-hidden rounded-[22px]">
          <Img i={d.i} w={1100} h={900} />
        </div>
      </div>
    </div>
  );
}

const HIDDEN: CSSProperties = { visibility: "hidden", opacity: 0 };

/* ───────────────────────── X27 · Colour stripe sweep ───────────────────────── */
const X27_COLS = ["#e0913f", "#ff9b85", "#ffd59a", "#4f8dff", "#f4efe6"];
function X27() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const [a, b] = q(".x27-p");
    const s = q(".x27-s");
    gsap.set(s, { x: 0, xPercent: -101 });
    const tl = gsap.timeline({ repeat: -1 });
    const half = (from: Element, to: Element, dir: 1 | -1) => {
      tl.set(s, { xPercent: -101 * dir })
        .to(s, { xPercent: 0, duration: 0.42, ease: "power3.in", stagger: 0.06 })
        .set(from, { autoAlpha: 0 })
        .set(to, { autoAlpha: 1 })
        .to(s, { xPercent: 101 * dir, duration: 0.45, ease: "power3.out", stagger: { each: 0.06, from: "end" } })
        .fromTo(to.querySelectorAll("[data-l]"), { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: "power3.out" }, "<0.1");
      hold(tl, 0.3);
    };
    half(a, b, 1);
    half(b, a, -1);
    return tl;
  });
  return (
    <Stage r={root}>
      <Page d={PA} className="x27-p" />
      <Page d={PB} className="x27-p" style={HIDDEN} />
      {X27_COLS.map((c, i) => (
        <div key={c} className="x27-s absolute inset-0 z-20 flex items-end justify-end p-[3%]" style={{ background: c, transform: "translateX(-101%)" }} aria-hidden>
          {i === X27_COLS.length - 1 && (
            <span className="text-[13px] font-[700] uppercase tracking-[0.3em] text-[#15100a]" style={{ fontFamily: F.mr }}>
              Halden &amp; Loom
            </span>
          )}
        </div>
      ))}
      <Sheen />
    </Stage>
  );
}

/* ───────────────────────── X28 · Staircase column overlay ───────────────────────── */
const X28_N = 7;
function X28() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const [a, b] = q(".x28-p");
    const cols = q(".x28-c");
    const tag = q(".x28-tag")[0];
    gsap.set(cols, { scaleY: 0, opacity: 1 });
    const stair = 0.05;
    const wave = (i: number) => 0.24 * Math.sin((i / (X28_N - 1)) * Math.PI);
    const tl = gsap.timeline({ repeat: -1 });
    const half = (from: Element, to: Element, mode: "stair" | "wave") => {
      const st = mode === "stair" ? stair : wave;
      tl.call(() => {
        tag.textContent = mode === "stair" ? "Stagger · staircase" : "Stagger · sine wave";
      })
        .set(cols, { transformOrigin: "50% 0%" })
        .to(cols, { scaleY: 1, duration: 0.6, ease: "power4.inOut", stagger: st })
        .set(from, { autoAlpha: 0 })
        .set(to, { autoAlpha: 1 })
        .set(cols, { transformOrigin: "50% 100%" })
        .to(cols, { scaleY: 0, duration: 0.6, ease: "power4.inOut", stagger: st })
        .fromTo(to.querySelectorAll("[data-l]"), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: "power3.out" }, "<0.15");
      hold(tl, 0.3);
    };
    half(a, b, "stair");
    half(b, a, "wave");
    return tl;
  });
  return (
    <Stage r={root}>
      <Page d={PA} className="x28-p" />
      <Page d={PB} className="x28-p" style={HIDDEN} />
      {Array.from({ length: X28_N }, (_, i) => (
        <div
          key={i}
          className="x28-c absolute bottom-0 top-0 z-20"
          style={{ left: `${(i * 100) / X28_N}%`, width: `${100 / X28_N + 0.15}%`, background: `color-mix(in oklab, #1d130c ${100 - i * 9}%, #e0913f)`, opacity: 0 }}
          aria-hidden
        />
      ))}
      <span className="x28-tag absolute bottom-[5%] right-[4%] z-30 rounded-full border border-white/25 bg-black/40 px-4 py-2 text-[12px] uppercase tracking-[0.18em] text-white/85 backdrop-blur" style={{ fontFamily: F.mr }}>
        Stagger · staircase
      </span>
      <Sheen />
    </Stage>
  );
}

/* ───────────────────────── X29 · Curved-edge cover swipe ───────────────────────── */
type Dir = "up" | "down" | "right" | "left";
const X29_DIRS: { d: Dir; label: string }[] = [
  { d: "up", label: "Bottom to top" },
  { d: "down", label: "Top to bottom" },
  { d: "right", label: "Left to right" },
  { d: "left", label: "Right to left" },
];
/** s = across the edge (0..100), u = along the travel (0 = start side, 1 = far side) → viewBox point. */
function x29pt(dir: Dir, s: number, u: number) {
  const v = 100 * u;
  const [x, y] = dir === "up" ? [s, 100 - v] : dir === "down" ? [s, v] : dir === "right" ? [v, s] : [100 - v, s];
  return `${x.toFixed(2)} ${y.toFixed(2)}`;
}
/** Panel between the leading edge L (centre pulled to cL) and the trailing edge T (centre pulled to cT). */
function x29path(dir: Dir, L: number, cL: number, T: number, cT: number) {
  const p = (s: number, u: number) => x29pt(dir, s, u);
  return `M${p(0, L)} Q${p(50, cL)} ${p(100, L)} L${p(100, T)} Q${p(50, cT)} ${p(0, T)} Z`;
}
function X29() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const pages = q(".x29-p");
    const path = q(".x29-path")[0] as unknown as SVGPathElement;
    const tag = q(".x29-tag")[0];
    const tl = gsap.timeline({ repeat: -1 });
    X29_DIRS.forEach(({ d, label }, k) => {
      const from = pages[k % 2];
      const to = pages[(k + 1) % 2];
      const pin = { v: 0 };
      const pout = { w: 0 };
      tl.call(() => {
        tag.textContent = label;
      })
        .set(pin, { v: 0 })
        .set(pout, { w: 0 })
        // in: the leading edge bulges ahead (centre first), then flattens into a full cover
        .to(pin, {
          v: 1,
          duration: 0.62,
          ease: "none",
          onUpdate: () => {
            const L = gsap.parseEase("power4.in")(pin.v);
            const cL = L + 0.9 * Math.sin(Math.PI * Math.min(1, pin.v * 1.05));
            path.setAttribute("d", x29path(d, L, Math.min(cL, 1.6), 0, 0));
          },
        })
        .set(from, { autoAlpha: 0 })
        .set(to, { autoAlpha: 1 })
        // out: it carries on off the far side, the trailing edge bowed the opposite way (centre lags)
        .to(pout, {
          w: 1,
          duration: 0.6,
          ease: "none",
          onUpdate: () => {
            const T = gsap.parseEase("power2.out")(pout.w);
            const cT = T - 0.8 * Math.sin(Math.PI * pout.w);
            path.setAttribute("d", x29path(d, 1.02, 1.02, T, cT));
          },
        })
        .call(() => path.setAttribute("d", "M0 0Z"))
        .fromTo(to.querySelectorAll("[data-l]"), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: "power3.out" }, "<-0.4");
      hold(tl, 0.3);
    });
    return tl;
  });
  return (
    <Stage r={root}>
      <Page d={PA} className="x29-p" />
      <Page d={PB} className="x29-p" style={HIDDEN} />
      <svg className="absolute inset-0 z-20 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="x29-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffd59a" />
            <stop offset="1" stopColor="#e0913f" />
          </linearGradient>
        </defs>
        <path className="x29-path" d="M0 0Z" fill="url(#x29-g)" />
      </svg>
      <span className="x29-tag absolute bottom-[5%] right-[4%] z-30 rounded-full border border-white/25 bg-black/40 px-4 py-2 text-[12px] uppercase tracking-[0.18em] text-white/85 backdrop-blur" style={{ fontFamily: F.mr }}>
        Bottom to top
      </span>
      <Sheen />
    </Stage>
  );
}

/* ───────────────────────── X30 · Arch-shape clip slideshow ───────────────────────── */
const X30_AR = 0.8; // card width / height, so the arch top reads as a true half circle
/** Arch inside the box (objectBoundingBox units): w = width share, h = height share, both anchored bottom-centre. */
function x30arch(w: number, h: number) {
  const rx = 0.5 * w;
  const ry = Math.min(rx * X30_AR, h);
  const x0 = 0.5 - rx;
  const x1 = 0.5 + rx;
  const y = 1 - h + ry;
  return `M${x0.toFixed(4)} 1 L${x0.toFixed(4)} ${y.toFixed(4)} A${Math.max(rx, 0.0001).toFixed(4)} ${Math.max(ry, 0.0001).toFixed(4)} 0 0 1 ${x1.toFixed(4)} ${y.toFixed(4)} L${x1.toFixed(4)} 1 Z`;
}
const X30_SLIDES = [
  { n: "Arc vase, ash glaze", p: "₹ 2,640", i: 3 },
  { n: "Dune pitcher, iron", p: "₹ 3,120", i: 1 },
];
function X30() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const layers = q(".x30-l");
    const inners = q(".x30-i");
    const paths = q(".x30-path") as unknown as SVGPathElement[];
    const caps = q(".x30-cap");
    const st = [
      { w: 1, h: 1 },
      { w: 0, h: 0.55 },
    ];
    const draw = (k: number) => paths[k].setAttribute("d", x30arch(st[k].w, st[k].h));
    gsap.set(layers[1], { autoAlpha: 1 });
    const tl = gsap.timeline({ repeat: -1 });
    const half = (a: number, b: number) => {
      tl.set(layers[b], { zIndex: 2 })
        .set(layers[a], { zIndex: 1 })
        // the current arch closes: narrows to a slit and drops
        .to(st[a], { w: 0, h: 0.55, duration: 0.45, ease: "power3.in", onUpdate: () => draw(a) })
        .to(caps[a], { y: -24, opacity: 0, duration: 0.35, ease: "power2.in" }, "<")
        .set(caps[a], { visibility: "hidden" })
        // the next one opens out of that same slit while its photo slides 50% → 0
        .fromTo(st[b], { w: 0, h: 0.55 }, { w: 1, h: 1, duration: 0.65, ease: "power3.inOut", onUpdate: () => draw(b) })
        .fromTo(inners[b], { xPercent: 50 }, { xPercent: 0, duration: 0.65, ease: "power3.out" }, "<")
        .set(caps[b], { visibility: "visible" }, "<")
        .fromTo(caps[b], { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" }, "<0.2");
      hold(tl, 0.3);
    };
    half(0, 1);
    half(1, 0);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(224,145,63,.4)">
      <svg width="0" height="0" className="absolute" aria-hidden>
        <defs>
          <clipPath id="x30-clip-0" clipPathUnits="objectBoundingBox">
            <path className="x30-path" d={x30arch(1, 1)} />
          </clipPath>
          <clipPath id="x30-clip-1" clipPathUnits="objectBoundingBox">
            <path className="x30-path" d={x30arch(0, 0.55)} />
          </clipPath>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center gap-[6%] px-[7%]">
        <div className="relative w-[40%]">
          <p className="text-[13px] uppercase tracking-[0.22em] text-[#ffd59a]/80" style={{ fontFamily: F.mr }}>
            Kilnhouse · Arched editions
          </p>
          <h3 className="mt-3 text-[clamp(44px,4.6vw,74px)] leading-[0.95]" style={{ fontFamily: F.is }}>
            Shapes that hold the light
          </h3>
          <div className="relative mt-8 h-[64px]" style={{ fontFamily: F.sg }}>
            {X30_SLIDES.map((s, k) => (
              <div key={s.n} className="x30-cap absolute inset-0" style={k ? { visibility: "hidden" } : undefined}>
                <p className="text-[20px] text-white/90">{s.n}</p>
                <p className="mt-1 text-[16px] tabular-nums text-white/55">{s.p}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative h-[86%]" style={{ aspectRatio: `${X30_AR}` }}>
          {X30_SLIDES.map((s, k) => (
            <div key={s.n} className="x30-l absolute inset-0 overflow-hidden" style={{ clipPath: `url(#x30-clip-${k})`, zIndex: k ? 1 : 2, ...(k ? { visibility: "hidden" } : {}) }}>
              <div className="x30-i absolute inset-0">
                <Img i={s.i} w={800} h={1000} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <Sheen />
    </Stage>
  );
}

/* ───────────────────────── X31 · Slit-open slide transition ───────────────────────── */
const X31_TOP = "polygon(0% 0%, 100% 0%, 100% 38%, 0% 62%)";
const X31_BOT = "polygon(0% 62%, 100% 38%, 100% 100%, 0% 100%)";
function X31() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const base = q(".x31-b");
    const halves = [q(".x31-h0"), q(".x31-h1")]; // [top, bottom] per page
    const line = q(".x31-line")[0];
    const ang = (Math.atan2(0.24 * el.offsetHeight, el.offsetWidth) * 180) / Math.PI;
    gsap.set(line, { rotation: -ang, scaleX: 0, opacity: 1 });
    const tl = gsap.timeline({ repeat: -1 });
    const half = (a: number, b: number) => {
      const [top, bot] = halves[a];
      tl.set([top, bot], { autoAlpha: 1, x: 0, xPercent: 0, yPercent: 0, rotation: 0, scale: 1 })
        .set(base[a], { autoAlpha: 0 })
        .set(base[b], { autoAlpha: 1 })
        .set(base[b].querySelectorAll("[data-l]"), { y: 40, opacity: 0 })
        // the cut: a bright line draws along the slit
        .fromTo(line, { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 0.28, ease: "power2.out" })
        // the halves slide apart diagonally with a little scale + rotation
        .to(top, { xPercent: -9, yPercent: -82, rotation: -5, scale: 1.08, duration: 1, ease: "power3.inOut" })
        .to(bot, { xPercent: 9, yPercent: 82, rotation: 5, scale: 1.08, duration: 1, ease: "power3.inOut" }, "<")
        .to(line, { opacity: 0, duration: 0.25 }, "<0.1")
        .to(base[b].querySelectorAll("[data-l]"), { y: 0, opacity: 1, duration: 0.55, stagger: 0.07, ease: "power3.out" }, "<0.45")
        .set([top, bot], { autoAlpha: 0 });
      hold(tl, 0.3);
    };
    half(0, 1);
    half(1, 0);
    return tl;
  });
  return (
    <Stage r={root}>
      <Page d={PA} className="x31-b" />
      <Page d={PB} className="x31-b" style={HIDDEN} />
      {[PA, PB].map((d, k) => (
        <div key={k} className="absolute inset-0 z-10" aria-hidden>
          <div className="x31-h0 absolute inset-0" style={{ clipPath: X31_TOP, visibility: "hidden" }}>
            <Page d={d} />
          </div>
          <div className="x31-h1 absolute inset-0" style={{ clipPath: X31_BOT, visibility: "hidden" }}>
            <Page d={d} />
          </div>
        </div>
      ))}
      <div className="x31-line absolute left-[-5%] top-1/2 z-20 -mt-px h-[2px] w-[110%] bg-[#ffd59a] shadow-[0_0_18px_#ffd59a]" style={{ opacity: 0 }} aria-hidden />
      <Sheen />
    </Stage>
  );
}

/* ───────────────────────── X32 · Full-screen image shrinks to a rounded pill row ───────────────────────── */
const X32_WORD = "TIDEWATER";
const X32_PILLS = [
  { l: "-9%", i: 2 },
  { l: "15%", i: 1 },
  { l: "65%", i: 3 },
  { l: "89%", i: 2 },
];
function X32() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const main = q(".x32-main")[0];
    const chars = q(".x32-ch");
    const pills = q(".x32-n");
    const cap = q(".x32-cap");
    gsap.set(main, { clipPath: "inset(0% 0% 0% 0% round 0px)" });
    gsap.set(pills, { z: 600, opacity: 0 });
    gsap.set(cap, { y: 20, opacity: 0 });
    // A → B plays forward, B → A is the same timeline in reverse (yoyo)
    return gsap
      .timeline({ repeat: -1, yoyo: true, repeatDelay: 0.3, defaults: { ease: "expo.inOut" } })
      .to(chars, { scaleY: 0, yPercent: -40, opacity: 0, duration: 0.5, stagger: 0.03, ease: "power3.in", transformOrigin: "50% 0%" }, 0)
      .to(main, { clipPath: "inset(22% 39% 22% 39% round 240px)", duration: 1.2 }, 0.1)
      .to(".x32-img", { scale: 1.12, duration: 1.2 }, 0.1)
      .to(pills, { z: 0, opacity: 1, duration: 1.2, stagger: 0.06 }, 0.15)
      .to(cap, { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: "power3.out" }, 0.95);
  });
  return (
    <Stage r={root} g1="rgba(79,141,255,.4)" g2="rgba(255,213,154,.2)" style={{ perspective: "1200px" }}>
      <div className="absolute inset-0" style={{ perspective: "1200px" }}>
        {X32_PILLS.map((p, k) => (
          <div key={k} className="x32-n absolute top-[22%] h-[56%] w-[22%] overflow-hidden rounded-[999px]" style={{ left: p.l, opacity: 0 }}>
            <Img i={p.i} w={600} h={800} />
          </div>
        ))}
        <div className="x32-main absolute inset-0 overflow-hidden">
          <Img i={0} className="x32-img" w={1600} h={1000} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
          <div className="absolute inset-x-[5%] bottom-[9%]">
            <p className="text-[13px] uppercase tracking-[0.24em] text-white/75" style={{ fontFamily: F.mr }}>
              Northbay Voyages · Journey 01
            </p>
            <h3 className="mt-2 whitespace-nowrap text-[6vw] font-[800] leading-[0.9]" style={{ fontFamily: F.sy }} aria-label={X32_WORD}>
              {X32_WORD.split("").map((c, k) => (
                <span key={k} className="x32-ch inline-block" aria-hidden>
                  {c}
                </span>
              ))}
            </h3>
          </div>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-[8%] flex justify-center gap-10 text-[13px] uppercase tracking-[0.22em] text-white/80" style={{ fontFamily: F.mr }}>
        <span className="x32-cap" style={{ opacity: 0 }}>
          Four journeys
        </span>
        <span className="x32-cap" style={{ opacity: 0 }}>
          From ₹ 48,000
        </span>
      </div>
      <Sheen g1="rgba(79,141,255,.4)" />
    </Stage>
  );
}

/* ───────────────────────── X33 · Chapter scale jump (Flip.fit) ───────────────────────── */
let flipMod: typeof FlipT | null = null;
const getFlip = () => loadPlugin("Flip").then((f) => (flipMod = f));
const X33_CH = [
  { n: "01", t: "The harbour", i: 0 },
  { n: "02", t: "Salt & stone", i: 3 },
  { n: "03", t: "Night ferry", i: 1 },
  { n: "04", t: "Low tide", i: 2 },
];
function Chapter({ c }: { c: (typeof X33_CH)[number] }) {
  return (
    <div className="x33-c absolute inset-0 overflow-hidden">
      <Img i={c.i} w={1400} h={900} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />
      <div className="absolute bottom-[8%] left-[6%] right-[6%]">
        <p className="uppercase tracking-[0.22em] text-white/75" style={{ fontFamily: F.mr, fontSize: "max(12px, 1.3cqw)" }}>
          Chapter {c.n}
        </p>
        <p className="mt-[0.2em] leading-[0.95]" style={{ fontFamily: F.fr, fontSize: "max(18px, 7cqw)" }}>
          {c.t}
        </p>
      </div>
    </div>
  );
}
function X33() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(
    root,
    (el) => {
      const Flip = flipMod!;
      const q = gsap.utils.selector(el);
      const [hA, hB] = q(".x33-hero");
      const track = q(".x33-track")[0];
      const slots = q(".x33-slot");
      const step = slots[1].getBoundingClientRect().left - slots[0].getBoundingClientRect().left;
      gsap.set(track, { x: 0 });
      const toSlot0 = Flip.fit(hA, slots[0], { scale: false, getVars: true }) as gsap.TweenVars;
      gsap.set(track, { x: -step });
      const toSlot1 = Flip.fit(hB, slots[1], { scale: false, getVars: true }) as gsap.TweenVars;
      gsap.set(track, { x: 0 });
      const full = { x: 0, y: 0, width: hA.offsetWidth, height: hA.offsetHeight };
      const tl = gsap.timeline({ repeat: -1, defaults: { ease: "power3.inOut" } });
      const go = (from: Element, to: Element, fromSlot: gsap.TweenVars, toSlot: gsap.TweenVars, x: number) => {
        tl.to(from, { ...fromSlot, borderRadius: 18, duration: 0.6 })
          .set(from, { autoAlpha: 0 })
          .to(track, { x, duration: 0.55 })
          .set(to, { ...toSlot, borderRadius: 18, autoAlpha: 1 })
          .to(to, { ...full, borderRadius: 0, duration: 0.65 });
        hold(tl, 0.3);
      };
      go(hA, hB, toSlot0, toSlot1, -step);
      go(hB, hA, toSlot1, toSlot0, 0);
      return tl;
    },
    getFlip,
  );
  return (
    <Stage r={root} g1="rgba(255,213,154,.36)" g2="rgba(79,141,255,.22)">
      <div className="x33-track absolute left-0 top-[24%] flex h-[52%] w-full gap-[2.5%]">
        {X33_CH.map((c) => (
          <div key={c.n} className={`x33-slot relative h-full w-[22%] shrink-0 ${c.n === "01" ? "ml-[39%]" : ""} overflow-hidden rounded-[18px] border border-white/10`}>
            <Chapter c={c} />
          </div>
        ))}
      </div>
      <p className="absolute left-[4%] top-[8%] text-[13px] uppercase tracking-[0.22em] text-white/60" style={{ fontFamily: F.mr }}>
        Saltmarsh Films · four chapters
      </p>
      <div className="x33-hero absolute left-0 top-0 z-10 h-full w-full overflow-hidden">
        <Chapter c={X33_CH[0]} />
      </div>
      <div className="x33-hero absolute left-0 top-0 z-10 h-full w-full overflow-hidden" style={{ visibility: "hidden" }}>
        <Chapter c={X33_CH[1]} />
      </div>
      <Sheen />
    </Stage>
  );
}

/* ───────────────────────── X34 · Kinetic type wipe ───────────────────────── */
const X34_WORD = "HALDEN";
function X34() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const pages = q(".x34-p");
    const w = q(".x34-w")[0];
    const lines = q(".x34-ln");
    gsap.set(w, { autoAlpha: 0, scale: 1, rotation: 0 });
    const tl = gsap.timeline({ repeat: -1 });
    const half = (from: Element, to: Element) => {
      const t0 = tl.duration();
      tl.set(w, { autoAlpha: 1, scale: 1, rotation: 0 }, t0)
        .set(lines, { x: "0%" }, t0)
        .fromTo(w, { opacity: 0 }, { opacity: 1, duration: 0.25 }, t0)
        .to(w, { scale: 2.7, rotation: -90, duration: 1, ease: "power3.inOut" }, t0)
        .to(from, { opacity: 0, duration: 0.4, ease: "power1.in" }, t0 + 0.3)
        .set(from, { visibility: "hidden" }, t0 + 0.7)
        // the type now fills the frame: the new page fades up behind it
        .set(to, { visibility: "visible" }, t0 + 0.75)
        .fromTo(to, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, t0 + 0.8);
      lines.forEach((ln, i) => {
        tl.to(ln, { x: "20%", duration: 0.35, ease: "power2.out" }, t0).to(ln, { x: "-200%", duration: 0.85 + (i % 3) * 0.17, ease: "power3.in" }, t0 + 0.4 + (i % 2) * 0.05);
      });
      tl.set(w, { autoAlpha: 0 });
      hold(tl, 0.3);
    };
    half(pages[0], pages[1]);
    half(pages[1], pages[0]);
    return tl;
  });
  const row = Array.from({ length: 5 }, () => X34_WORD).join(" · ");
  return (
    <Stage r={root}>
      <Page d={PA} className="x34-p" />
      <Page d={PB} className="x34-p" style={HIDDEN} />
      <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center" aria-hidden>
        <div className="x34-w flex flex-col items-center" style={{ opacity: 0, visibility: "hidden" }}>
          {Array.from({ length: 7 }, (_, i) => (
            <span
              key={i}
              className="x34-ln whitespace-nowrap text-[5vw] font-[800] leading-[0.92]"
              style={{
                fontFamily: F.sy,
                color: i % 2 ? "transparent" : "#ffd59a",
                WebkitTextStroke: i % 2 ? "1.5px #ff9b85" : undefined,
              }}
            >
              {row}
            </span>
          ))}
        </div>
      </div>
      <Sheen />
    </Stage>
  );
}

/* ───────────────────────── X35 · Repeating image trail along a path ───────────────────────── */
const X35_N = 8;
const X35_THUMBS = [2, 0, 3, 1];
const X35_PICK = 1;
function X35() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const inner = q(".x-in")[0];
    const thumbs = q(".x35-t");
    const dest = q(".x35-d")[0];
    const copies = q(".x35-c");
    const dot = q(".b3g3x-dot")[0];
    const aOut = q(".x35-a");
    const bIn = q(".x35-bl");
    const T = rel(thumbs[X35_PICK], inner);
    const D = rel(dest, inner);
    gsap.set(copies, { left: D.x, top: D.y, width: D.w, height: D.h, transformOrigin: "0 0" });
    gsap.set(dot, { x: T.x + T.w * 0.5, y: T.y + T.h * 0.5 });
    const place = (c: Element, p: number) => {
      const e = gsap.parseEase("power2.inOut")(p);
      const w = T.w + (D.w - T.w) * e;
      const h = T.h + (D.h - T.h) * e;
      const x = T.x + (D.x - T.x) * p + Math.sin(Math.PI * 2 * p) * 40;
      const y = T.y + (D.y - T.y) * p - Math.sin(Math.PI * p) * 120;
      gsap.set(c, { x: x - D.x, y: y - D.y, scaleX: w / D.w, scaleY: h / D.h });
    };
    copies.forEach((c) => place(c, 0));
    const tl = gsap.timeline({ repeat: -1, yoyo: true, repeatDelay: 0.3 });
    // the fake click on the thumbnail
    tl.fromTo(dot, { scale: 1 }, { scale: 0.6, duration: 0.12, yoyo: true, repeat: 1, ease: "power2.inOut" }, 0)
      .to(aOut, { opacity: 0, y: -20, duration: 0.4, stagger: 0.03, ease: "power2.in" }, 0.15)
      .set(thumbs[X35_PICK], { opacity: 0 }, 0.25)
      .to(dot, { opacity: 0, duration: 0.2 }, 0.25)
      .set(copies, { visibility: "visible" }, 0.25);
    copies.forEach((c, i) => {
      const o = { p: 0 };
      tl.to(o, { p: 1, duration: 0.95, ease: "power3.inOut", onUpdate: () => place(c, o.p) }, 0.25 + i * 0.045);
      if (i < X35_N - 1) tl.to(c, { opacity: 0, duration: 0.25 }, 0.25 + i * 0.045 + 0.9);
    });
    tl.fromTo(bIn, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: "power3.out" }, 1.25);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,155,133,.38)">
      {/* page A: the archive grid */}
      <div className="absolute left-[5%] top-[9%] w-[44%]">
        <p className="x35-a text-[13px] uppercase tracking-[0.22em] text-[#ff9b85]" style={{ fontFamily: F.mr }}>
          Field notes · archive
        </p>
        <h3 className="x35-a mt-3 text-[clamp(40px,4.2vw,68px)] leading-[0.96]" style={{ fontFamily: F.fr }}>
          Four rooms, one summer
        </h3>
      </div>
      <div className="absolute bottom-[9%] left-[5%] flex w-[52%] gap-[3%]">
        {X35_THUMBS.map((i, k) => (
          <div key={k} className={`x35-t ${k === X35_PICK ? "" : "x35-a"} relative aspect-[4/5] flex-1 overflow-hidden rounded-[12px]`} data-cursor="Open">
            <Img i={i} w={480} h={600} />
          </div>
        ))}
      </div>
      {/* page B: the story page; its photo IS the last copy of the trail */}
      <div className="absolute left-[5%] top-[20%] w-[38%]">
        <p className="x35-bl text-[13px] uppercase tracking-[0.22em] text-[#ff9b85]" style={{ fontFamily: F.mr, opacity: 0 }}>
          Room 02 · Casa Aurel
        </p>
        <h3 className="x35-bl mt-3 text-[clamp(40px,4.2vw,68px)] leading-[0.96]" style={{ fontFamily: F.fr, opacity: 0 }}>
          The blue hour kitchen
        </h3>
        <p className="x35-bl mt-4 max-w-[34ch] text-[16px] text-white/65" style={{ fontFamily: F.mr, opacity: 0 }}>
          Limewash walls, a long oak table and nine slow dinners.
        </p>
      </div>
      <div className="x35-d pointer-events-none absolute left-[56%] top-[9%] aspect-[4/5] h-[82%]" aria-hidden />
      {Array.from({ length: X35_N }, (_, i) => {
        const c = (1 - i / (X35_N - 1)) * 40;
        return (
          <div key={i} className="x35-c pointer-events-none absolute left-0 top-0 overflow-hidden rounded-[12px]" style={{ visibility: "hidden", clipPath: `inset(${c}% 0% ${c}% 0%)`, zIndex: 10 + i }} aria-hidden>
            <Img i={X35_THUMBS[X35_PICK]} w={800} h={1000} />
          </div>
        );
      })}
      <div className="b3g3x-dot" aria-hidden />
      <Sheen g1="rgba(255,155,133,.38)" />
    </Stage>
  );
}

/* ───────────────────────── X36 · List row grows into the next page (Flip.fit) ───────────────────────── */
const X36_ROWS = [
  { n: "Ostra Residence", c: "Interiors", y: "2026", i: 2 },
  { n: "Marlow Bakehouse", c: "Identity", y: "2025", i: 3 },
  { n: "Casa Pell", c: "Architecture", y: "2025", i: 0 },
  { n: "Fenwick Tea Rooms", c: "Spatial", y: "2024", i: 1 },
  { n: "Lowfield Press", c: "Editorial", y: "2024", i: 2 },
];
const X36_PICK = 2;
function X36() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(
    root,
    (el) => {
      const Flip = flipMod!;
      const q = gsap.utils.selector(el);
      const inner = q(".x-in")[0];
      const rows = q(".x36-r");
      const thumb = q(".x36-th")[X36_PICK];
      const fly = q(".x36-fly")[0];
      const dot = q(".b3g3x-dot")[0];
      const head = q(".x36-head");
      const bLines = q(".x36-bl");
      const above = rows.slice(0, X36_PICK);
      const below = rows.slice(X36_PICK + 1);
      const pickText = rows[X36_PICK].querySelectorAll(".x36-txt");
      const hero = { x: 0, y: 0, width: fly.offsetWidth, height: fly.offsetHeight };
      const toThumb = Flip.fit(fly, thumb, { scale: false, getVars: true }) as gsap.TweenVars;
      const T = rel(thumb, inner);
      gsap.set(dot, { x: T.x + T.w * 0.5, y: T.y + T.h * 0.5 });
      gsap.set(fly, toThumb);
      const H = el.offsetHeight;
      return gsap
        .timeline({ repeat: -1, yoyo: true, repeatDelay: 0.3 })
        .to(rows[X36_PICK], { backgroundColor: "rgba(255,255,255,.07)", duration: 0.2 }, 0)
        .fromTo(dot, { scale: 1 }, { scale: 0.6, duration: 0.12, yoyo: true, repeat: 1 }, 0)
        .to(dot, { opacity: 0, duration: 0.2 }, 0.2)
        .set(fly, { visibility: "visible", opacity: 1 }, 0.2)
        .set(thumb, { opacity: 0 }, 0.2)
        .to(head, { y: -40, opacity: 0, duration: 0.45, ease: "power3.in" }, 0.05)
        .to(above, { y: -H * 0.7, opacity: 0, duration: 0.6, ease: "power3.in", stagger: { each: 0.05, from: "end" } }, 0.1)
        .to(below, { y: H * 0.7, opacity: 0, duration: 0.6, ease: "power3.in", stagger: 0.05 }, 0.1)
        .to(pickText, { x: -30, opacity: 0, duration: 0.35, ease: "power2.in", stagger: 0.03 }, 0.15)
        .to(fly, { ...hero, borderRadius: 20, duration: 1, ease: "expo.inOut" }, 0.25)
        .fromTo(bLines, { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: "power3.out" }, 1.0);
    },
    getFlip,
  );
  return (
    <Stage r={root} g1="rgba(255,213,154,.34)" g2="rgba(255,155,133,.2)">
      <div className="absolute inset-x-[5%] top-[7%] flex items-end justify-between">
        <h3 className="x36-head text-[clamp(36px,3.6vw,58px)] leading-none" style={{ fontFamily: F.is }}>
          Selected work
        </h3>
        <p className="x36-head text-[13px] uppercase tracking-[0.22em] text-white/55" style={{ fontFamily: F.mr }}>
          Atelier Venn · 2024–26
        </p>
      </div>
      <div className="absolute inset-x-[5%] top-[24%]" style={{ fontFamily: F.sg }}>
        {X36_ROWS.map((r, k) => (
          <div key={r.n} className="x36-r flex items-center gap-6 border-t border-white/12 px-3 py-[1.15vh]">
            <span className="x36-txt w-[5%] text-[13px] tabular-nums text-white/45">0{k + 1}</span>
            <span className="x36-txt flex-1 text-[clamp(22px,2vw,32px)]">{r.n}</span>
            <span className="x36-txt w-[18%] text-[14px] text-white/55">{r.c}</span>
            <span className="x36-txt w-[8%] text-[14px] tabular-nums text-white/55">{r.y}</span>
            <div className="x36-th h-[56px] w-[84px] overflow-hidden rounded-[10px]">
              <Img i={r.i} w={300} h={200} />
            </div>
          </div>
        ))}
      </div>
      {/* page B: the flyer's natural box is the hero */}
      <div className="x36-fly absolute left-[5%] right-[5%] top-[7%] z-10 h-[58%] overflow-hidden rounded-[20px]" style={{ visibility: "hidden" }} aria-hidden>
        <Img i={X36_ROWS[X36_PICK].i} w={1400} h={700} />
      </div>
      <div className="absolute inset-x-[5%] bottom-[7%] z-20 flex items-end justify-between">
        <h3 className="x36-bl text-[clamp(44px,4.6vw,74px)] leading-[0.95]" style={{ fontFamily: F.fr, opacity: 0 }}>
          {X36_ROWS[X36_PICK].n}
        </h3>
        <p className="x36-bl pb-2 text-[13px] uppercase tracking-[0.22em] text-white/60" style={{ fontFamily: F.mr, opacity: 0 }}>
          Architecture · 2025
        </p>
      </div>
      <div className="b3g3x-dot" aria-hidden />
      <Sheen />
    </Stage>
  );
}

/* ───────────────────────── X37 · Product card expands with rotating image (Flip.fit) ───────────────────────── */
const X37_CARDS = [
  { n: "Yuzu Fizz", p: "₹ 180", a: 1, c: "#2a2410", acc: "#ffd34d" },
  { n: "Hibiscus Cold Brew", p: "₹ 220", a: 0, c: "#2c0f1a", acc: "#ff4d6d" },
  { n: "Mint Tonic", p: "₹ 190", a: 2, c: "#0d2a20", acc: "#18c48f" },
];
const X37_PICK = 1;
function X37() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(
    root,
    (el) => {
      const Flip = flipMod!;
      const q = gsap.utils.selector(el);
      const cards = q(".x37-card");
      const bg = q(".x37-bg")[X37_PICK];
      const img = q(".x37-img")[X37_PICK];
      const exp = q(".x37-exp")[0];
      const fly = q(".x37-fly")[0];
      const flyImg = q(".x37-fimg")[0];
      const dot = q(".b3g3x-dot")[0];
      const inner = q(".x-in")[0];
      const others = cards.filter((_, k) => k !== X37_PICK);
      const pickText = cards[X37_PICK].querySelectorAll(".x37-txt");
      const det = q(".x37-dl");
      const full = { x: 0, y: 0, width: exp.offsetWidth, height: exp.offsetHeight };
      const flyEnd = { x: 0, y: 0, width: fly.offsetWidth, height: fly.offsetHeight };
      const bgVars = Flip.fit(exp, bg, { scale: false, getVars: true }) as gsap.TweenVars;
      const imgVars = Flip.fit(fly, img, { scale: false, getVars: true }) as gsap.TweenVars;
      gsap.set(exp, bgVars);
      gsap.set(fly, imgVars);
      const B = rel(bg, inner);
      gsap.set(dot, { x: B.x + B.w * 0.5, y: B.y + B.h * 0.82 });
      return gsap
        .timeline({ repeat: -1, yoyo: true, repeatDelay: 0.3 })
        .fromTo(dot, { scale: 1 }, { scale: 0.6, duration: 0.12, yoyo: true, repeat: 1 }, 0)
        .to(dot, { opacity: 0, duration: 0.2 }, 0.2)
        .set([exp, fly], { visibility: "visible", opacity: 1 }, 0.2)
        .set(exp, { borderRadius: 22 }, 0.2)
        .set([bg, img], { opacity: 0 }, 0.2)
        .to(others, { y: 40, opacity: 0, duration: 0.45, ease: "power3.in", stagger: 0.05 }, 0.1)
        .to(pickText, { opacity: 0, y: 12, duration: 0.25 }, 0.15)
        .to(exp, { ...full, borderRadius: 0, duration: 1, ease: "expo.inOut" }, 0.25)
        .to(fly, { ...flyEnd, duration: 1, ease: "expo.inOut" }, 0.25)
        .fromTo(flyImg, { rotation: 0, scale: 1 }, { rotation: 90, scale: 1.3, duration: 1, ease: "expo.inOut" }, 0.25)
        .fromTo(det, { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: "power3.out" }, 0.95);
    },
    getFlip,
  );
  const pick = X37_CARDS[X37_PICK];
  return (
    <Stage r={root} g1="rgba(255,77,109,.34)" g2="rgba(255,211,77,.18)">
      <p className="absolute left-[5%] top-[7%] text-[13px] uppercase tracking-[0.22em] text-white/60" style={{ fontFamily: F.mr }}>
        Brightwell Soda Co. · Summer cans
      </p>
      <div className="absolute inset-x-[8%] bottom-[8%] top-[17%] flex gap-[3%]">
        {X37_CARDS.map((c, k) => (
          <div key={c.n} className="x37-card relative flex-1">
            <div className="x37-bg absolute inset-0 rounded-[22px]" style={{ background: `linear-gradient(160deg, ${c.c}, #0b0a0d)` }} />
            <div className="relative flex h-full flex-col items-center px-[8%] pb-[6%] pt-[6%]">
              <div className="x37-img relative w-full flex-1">
                <Product angle={c.a} accent={c.acc} className="absolute inset-0 h-full w-full" />
              </div>
              <div className="x37-txt mt-3 flex w-full items-baseline justify-between" style={{ fontFamily: F.sg }}>
                <span className="text-[18px]">{c.n}</span>
                <span className="text-[16px] tabular-nums text-white/70">{c.p}</span>
              </div>
            </div>
            {k === X37_PICK && <span className="sr-only">Open {c.n}</span>}
          </div>
        ))}
      </div>
      {/* page B: detail layout (expander fills the stage, the can lies rotated on the left) */}
      <div className="x37-exp absolute inset-0 z-10" style={{ background: `linear-gradient(160deg, ${pick.c}, #0b0a0d)`, visibility: "hidden" }} aria-hidden />
      <div className="x37-fly absolute left-[5%] top-[14%] z-20 h-[72%] w-[46%]" style={{ visibility: "hidden" }} aria-hidden>
        <div className="x37-fimg absolute inset-0">
          <Product angle={pick.a} accent={pick.acc} className="absolute inset-0 h-full w-full" />
        </div>
      </div>
      <div className="absolute right-[6%] top-1/2 z-20 w-[38%] -translate-y-1/2" style={{ fontFamily: F.sg }}>
        <p className="x37-dl text-[13px] uppercase tracking-[0.22em]" style={{ color: pick.acc, fontFamily: F.mr, opacity: 0 }}>
          Cold brew · 330 ml
        </p>
        <h3 className="x37-dl mt-3 text-[clamp(40px,4.2vw,66px)] leading-[0.95]" style={{ fontFamily: F.fr, opacity: 0 }}>
          {pick.n}
        </h3>
        <p className="x37-dl mt-4 max-w-[34ch] text-[16px] text-white/65" style={{ fontFamily: F.mr, opacity: 0 }}>
          Dried hibiscus, cold-steeped for 18 hours, a squeeze of lime. Lightly sparkling.
        </p>
        <div className="x37-dl mt-6 flex items-center gap-5" style={{ opacity: 0 }}>
          <span className="rounded-full px-6 py-3 text-[14px] font-[600] text-[#0b0a0d]" style={{ background: pick.acc }}>
            Add 12-pack
          </span>
          <span className="text-[20px] tabular-nums">₹ 2,400</span>
        </div>
      </div>
      <div className="b3g3x-dot" aria-hidden />
      <Sheen g1="rgba(255,77,109,.34)" />
    </Stage>
  );
}

/* ───────────────────────── X38 · Sequential category slide ───────────────────────── */
const X38_SETS = [
  {
    cat: "Teas",
    items: [
      { n: "Smoked oolong", p: "₹ 640", i: 3 },
      { n: "First-flush Darjeeling", p: "₹ 720", i: 2 },
      { n: "Roasted hojicha", p: "₹ 560", i: 0 },
      { n: "Wild rose chai", p: "₹ 480", i: 1 },
    ],
  },
  {
    cat: "Teaware",
    items: [
      { n: "Ash glaze cup", p: "₹ 890", i: 1 },
      { n: "Iron kettle", p: "₹ 4,200", i: 0 },
      { n: "Bamboo whisk", p: "₹ 650", i: 3 },
      { n: "Stoneware pot", p: "₹ 2,350", i: 2 },
    ],
  },
];
function X38() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const inner = q(".x-in")[0];
    const tabs = q(".x38-tab");
    const bar = q(".x38-bar")[0];
    const sets = q(".x38-set");
    const cards = sets.map((s) => Array.from(s.querySelectorAll(".x38-card")));
    const dot = q(".b3g3x-dot")[0];
    const R = tabs.map((t) => rel(t, inner));
    gsap.set(bar, { x: 0, width: R[0].w });
    gsap.set(dot, { x: R[0].x + R[0].w / 2, y: R[0].y + R[0].h / 2 + 4 });
    const tl = gsap.timeline({ repeat: -1 });
    const go = (a: number, b: number, dir: 1 | -1) => {
      const t = R[b];
      tl.to(dot, { x: t.x + t.w / 2, y: t.y + t.h / 2 + 4, duration: 0.45, ease: "power2.inOut" })
        .to(dot, { scale: 0.6, duration: 0.12, yoyo: true, repeat: 1 })
        .call(() => {
          tabs[a].classList.remove("on");
          tabs[b].classList.add("on");
        })
        .to(bar, { x: t.x - R[0].x, width: t.w, duration: 0.5, ease: "power3.inOut" }, "<")
        // the current products leave one after another in the slide direction…
        .to(cards[a], { xPercent: -120 * dir, opacity: 0, duration: 0.5, ease: "power3.in", stagger: { each: 0.06, from: dir > 0 ? "start" : "end" } }, "<")
        .set(sets[a], { visibility: "hidden" })
        .set(sets[b], { visibility: "visible" })
        // …then the new category's products arrive one by one from the opposite side
        .fromTo(cards[b], { xPercent: 120 * dir, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 0.6, ease: "power3.out", stagger: { each: 0.06, from: dir > 0 ? "start" : "end" } });
      hold(tl, 0.3);
    };
    go(0, 1, 1);
    go(1, 0, -1);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(24,196,143,.3)" g2="rgba(255,213,154,.2)">
      <div className="absolute inset-x-[5%] top-[7%] flex items-end justify-between">
        <h3 className="text-[clamp(36px,3.6vw,58px)] leading-none" style={{ fontFamily: F.fr }}>
          The Steeped Shelf
        </h3>
        <div className="relative flex gap-8 pb-2 text-[15px] uppercase tracking-[0.18em] text-white/45" style={{ fontFamily: F.mr }}>
          {X38_SETS.map((s, k) => (
            <span key={s.cat} className={`x38-tab ${k === 0 ? "on" : ""}`}>
              {s.cat}
            </span>
          ))}
          <span className="x38-bar absolute bottom-0 left-0 h-[2px] w-[44px] bg-[#18c48f]" />
        </div>
      </div>
      <div className="absolute inset-x-[5%] bottom-[8%] top-[22%] overflow-hidden">
        {X38_SETS.map((s, k) => (
          <div key={s.cat} className={`x38-set ${k ? "absolute inset-0" : "relative h-full"} grid grid-cols-4 gap-[2%]`} style={k ? { visibility: "hidden" } : undefined}>
            {s.items.map((it) => (
              <div key={it.n} className="x38-card flex h-full flex-col">
                <div className="relative flex-1 overflow-hidden rounded-[16px]">
                  <Img i={it.i} w={600} h={750} />
                </div>
                <div className="mt-3 flex items-baseline justify-between gap-3" style={{ fontFamily: F.sg }}>
                  <span className="text-[17px]">{it.n}</span>
                  <span className="text-[15px] tabular-nums text-white/60">{it.p}</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="b3g3x-dot" aria-hidden />
      <Sheen g1="rgba(24,196,143,.3)" />
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "X27", name: "Colour stripe sweep", how: "Auto A→B→A: five brand-colour panels sweep across one after another (stagger 0.06 s), cover, then pull away the same way onto the next page.", kind: "play", C: X27 },
  { code: "X28", name: "Staircase column overlay", how: "Auto A→B→A: seven columns drop in with a staircase stagger to cover, then lift away from the bottom; the return trip uses the sine-wave edge.", kind: "play", C: X28 },
  { code: "X29", name: "Curved-edge cover swipe", how: "Auto, cycling 4 directions: a colour panel rises with a bulging curved edge, flattens to a full cover, then leaves off the far side with the opposite curve.", kind: "play", C: X29 },
  { code: "X30", name: "Arch-shape clip slideshow", how: "Auto slideshow: the arched clip closes to a slit, then the next photo opens out of that same slit while sliding 50% → 0 inside it.", kind: "play", C: X30 },
  { code: "X31", name: "Slit-open slide transition", how: "Auto A→B→A: a bright line cuts the page on a slant, the two halves slide apart diagonally (scale + tilt) and the next page's lines stagger in.", kind: "play", C: X31 },
  { code: "X32", name: "Full-screen image shrinks to a rounded pill row", how: "Auto yoyo: the title chars squash away, the full-screen photo insets to a rounded pill and a row of pills flies in from z 600; then it expands back.", kind: "play", C: X32 },
  { code: "X33", name: "Chapter scale jump", how: "Auto A→B→A: the full-screen chapter shrinks into its card in the chapter row (Flip.fit), the row slides one step and the next card scales up to full screen.", kind: "play", C: X33 },
  { code: "X34", name: "Kinetic type wipe", how: "Auto A→B→A: rows of the brand word scale 2.7× and turn -90°, each row sliding past at its own speed, while the next page fades up behind.", kind: "play", C: X34 },
  { code: "X35", name: "Repeating image trail along a path", how: "Auto click: eight sliced copies of the thumbnail arc along a wobbly path to the story page, staggered 0.045 s; the last copy becomes the photo.", kind: "play", C: X35 },
  { code: "X36", name: "List row grows into the next page", how: "Auto click: the row's thumbnail grows into the next page's hero (Flip.fit, expo.inOut) while the rows above slide up and the rows below slide down.", kind: "play", C: X36 },
  { code: "X37", name: "Product card expands with rotating image", how: "Auto click: the card's background expands to fill the view (Flip.fit) while the can rotates 90° and scales into the detail layout; the text slides in.", kind: "play", C: X37 },
  { code: "X38", name: "Sequential category slide", how: "Auto tab switch: the products leave one by one in the slide direction, then the new category's arrive one by one from the other side.", kind: "play", C: X38 },
];
