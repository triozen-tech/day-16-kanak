"use client";

// Transition motions, batch 13 · group 3 (MOTION-MENU X52–X63). Small focused demos for /lab/motion.
// Every demo loops A → B → A between two simple "pages" while on screen (auto-advance; a fake pointer stands in for
// clicks), pauses off screen, and has a CSS-only glow loop (also ON TOP of the pages, g1 ≥ .5) that never stops.
// ?static=1 / reduced motion: no JS motion, the markup shows page A with every cover / page B hidden.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import type { Flip as FlipT } from "gsap/Flip";
import { gsap, loadPlugin, prefersReducedMotion } from "@/lib/gsap";
import { scene } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = { sg: "Space Grotesk Variable", fr: "Fraunces Variable", is: "Instrument Serif", sy: "Syne Variable", mr: "Manrope Variable" };

const CSS = `
.b13g3x-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(184,227,198,.5)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,196,138,.22)),transparent 70%);animation:b13g3x-drift 5.4s linear infinite alternate;will-change:transform}
@keyframes b13g3x-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b13g3x-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4);pointer-events:none;z-index:40;opacity:0}
.b13g3x-dot::after{content:"";position:absolute;inset:-8px;border-radius:50%;border:1.5px solid rgba(255,255,255,.7);animation:b13g3x-ping 1.2s ease-out infinite}
@keyframes b13g3x-ping{0%{transform:scale(.5);opacity:1}100%{transform:scale(1.8);opacity:0}}
.x61-poster{animation:x61-pan 6s linear infinite alternate;will-change:transform}
@keyframes x61-pan{0%{transform:scale(1.08) translate3d(-3%,0,0)}100%{transform:scale(1.16) translate3d(3%,-2%,0)}}
html.is-static .b13g3x-glow,html.is-static .b13g3x-dot::after,html.is-static .x61-poster{animation:none}
html.is-static .b13g3x-dot{display:none}
html.is-static {
  .b13g3x-glow,.b13g3x-dot::after,.x61-poster{animation:none}
  .b13g3x-dot{display:none}
}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", g1, g2, style }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string; style?: CSSProperties }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#08090c] text-[#f3efe8] ${className}`} style={style}>
      <style href="b13g3x-css" precedence="default">
        {CSS}
      </style>
      <div className="b13g3x-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="x-in relative h-full w-full">{children}</div>
    </div>
  );
}

/** The CSS glow loop again, ON TOP of full-bleed pages (screen blend), so page swaps never read as a freeze. */
const Sheen = ({ g1 = "rgba(184,227,198,.55)" }: { g1?: string }) => (
  <div className="b13g3x-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.45, zIndex: 35 } as CSSProperties} aria-hidden />
);

const Dot = () => <div className="b13g3x-dot" aria-hidden />;

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

/** An element's box relative to another element (call before transforms are applied). */
function rel(node: Element, root: Element) {
  const a = node.getBoundingClientRect();
  const r = root.getBoundingClientRect();
  return { x: a.left - r.left, y: a.top - r.top, w: a.width, h: a.height };
}

const hold = (tl: gsap.core.Timeline, d = 0.3) => tl.to({}, { duration: d });

/** Fake pointer: glide to the centre of `target` (in `inner` coords), then a press pulse. */
function point(tl: gsap.core.Timeline, dot: Element, target: Element, inner: Element, dur = 0.45, at?: gsap.Position) {
  const b = rel(target, inner);
  tl.to(dot, { x: b.x + b.w / 2, y: b.y + b.h / 2, opacity: 1, duration: dur, ease: "power2.inOut" }, at).to(dot, { scale: 0.6, duration: 0.1, yoyo: true, repeat: 1, ease: "power1.inOut" });
}

let flipMod: typeof FlipT | null = null;
const getFlip = () => loadPlugin("Flip").then((f) => (flipMod = f));

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, className = "", style, w = 1200, h = 1000 }: { i: number; className?: string; style?: CSSProperties; w?: number; h?: number }) => (
  <img src={scene(i, w, h)} alt="" className={`h-full w-full object-cover ${className}`} style={style} draggable={false} />
);

/* ---------- the simple "pages" every transition swaps between ---------- */

type PageData = { brand: string; kicker: string; title: string; body: string; price: string; i: number; bg: string; acc: string };
const PA: PageData = {
  brand: "Marrow & Vale",
  kicker: "Field wear · 01",
  title: "Wool for long walks",
  body: "Undyed merino, knitted dense and warm for cold ridge mornings.",
  price: "₹ 4,250",
  i: 2,
  bg: "#0d1411",
  acc: "#b8e3c6",
};
const PB: PageData = {
  brand: "Marrow & Vale",
  kicker: "Hearth · 02",
  title: "Cast iron, slow cooked",
  body: "Skillets poured in sand moulds, seasoned twice, heavy enough to last.",
  price: "₹ 3,690",
  i: 3,
  bg: "#17100b",
  acc: "#ffc48a",
};
const PC: PageData = {
  brand: "Marrow & Vale",
  kicker: "Journal · 03",
  title: "Notes from the trail",
  body: "Short field stories, packing lists and the routes we keep going back to.",
  price: "₹ 1,150",
  i: 0,
  bg: "#0b0f19",
  acc: "#a9c1ff",
};

/** A full mini landing page: nav strip, text column (lines marked data-l for staggers), product photo. */
function Page({ d, className = "", style, children }: { d: PageData; className?: string; style?: CSSProperties; children?: ReactNode }) {
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
          <h3 data-l className="mt-4 text-[clamp(44px,4.4vw,74px)] leading-[0.98]" style={{ fontFamily: F.fr }}>
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
      {children}
    </div>
  );
}

const HIDDEN: CSSProperties = { visibility: "hidden", opacity: 0 };
const Tag = ({ cls, children }: { cls: string; children: ReactNode }) => (
  <span className={`${cls} absolute bottom-[5%] right-[4%] z-30 rounded-full border border-white/25 bg-black/45 px-4 py-2 text-[12px] uppercase tracking-[0.18em] text-white/85`} style={{ fontFamily: F.mr }}>
    {children}
  </span>
);

/* ───────────────────────── X52 · Fold away / unfold in ───────────────────────── */
function X52() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const [a, b] = q(".x52-p");
    const [sa, sb] = q(".x52-sh");
    const tl = gsap.timeline({ repeat: -1 });
    // from folds away on edge `e`, to unfolds from the opposite edge, at the same time
    const half = (from: Element, to: Element, sf: Element, st: Element, e: "left" | "right") => {
      const o = e === "left" ? "0% 50%" : "100% 50%";
      const oo = e === "left" ? "100% 50%" : "0% 50%";
      const s = e === "left" ? 1 : -1;
      tl.set(from, { transformOrigin: o, rotationY: 0, autoAlpha: 1, zIndex: 1 })
        .set(to, { transformOrigin: oo, rotationY: -90 * s, autoAlpha: 1, zIndex: 2 })
        .set(st, { opacity: 0.7 })
        .to(from, { rotationY: 90 * s, duration: 0.8, ease: "power2.inOut" })
        .to(sf, { opacity: 0.75, duration: 0.8, ease: "power1.in" }, "<")
        .to(to, { rotationY: 0, duration: 0.8, ease: "power2.inOut" }, "<")
        .to(st, { opacity: 0, duration: 0.8, ease: "power1.out" }, "<")
        .set(from, { autoAlpha: 0 })
        .set(sf, { opacity: 0 });
      hold(tl, 0.3);
    };
    half(a, b, sa, sb, "left");
    half(b, a, sb, sa, "right");
    return tl;
  });
  return (
    <Stage r={root}>
      <div className="absolute inset-0" style={{ perspective: "1600px" }}>
        <Page d={PA} className="x52-p">
          <div className="x52-sh absolute inset-0 bg-black" style={{ opacity: 0 }} />
        </Page>
        <Page d={PB} className="x52-p" style={HIDDEN}>
          <div className="x52-sh absolute inset-0 bg-black" style={{ opacity: 0 }} />
        </Page>
      </div>
      <Sheen />
    </Stage>
  );
}

/* ───────────────────────── X53 · Edge hinge out, then in ───────────────────────── */
const X53_DIRS = [
  { label: "Left edge", origin: "0% 50%", prop: "rotationY", deg: 90 },
  { label: "Right edge", origin: "100% 50%", prop: "rotationY", deg: -90 },
  { label: "Top edge", origin: "50% 0%", prop: "rotationX", deg: -90 },
  { label: "Bottom edge", origin: "50% 100%", prop: "rotationX", deg: 90 },
] as const;
function X53() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const pages = q(".x53-p");
    const tag = q(".x53-tag")[0];
    const tl = gsap.timeline({ repeat: -1 });
    X53_DIRS.forEach((d, k) => {
      const from = pages[k % 2];
      const to = pages[(k + 1) % 2];
      tl.call(() => {
        tag.textContent = d.label;
      })
        .set([from, to], { transformOrigin: d.origin, rotationX: 0, rotationY: 0 })
        // strictly in sequence: out first …
        .to(from, { [d.prop]: d.deg, duration: 0.5, ease: "power2.in" })
        .to(from, { opacity: 0, duration: 0.15, ease: "none" }, "-=0.15")
        .set(from, { autoAlpha: 0 })
        // … then the next page swings in around the same edge
        .set(to, { autoAlpha: 1, [d.prop]: d.deg })
        .fromTo(to, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "none" })
        .to(to, { [d.prop]: 0, duration: 0.5, ease: "power2.out" }, "<");
      hold(tl, 0.3);
    });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,196,138,.5)">
      <div className="absolute inset-0" style={{ perspective: "1400px" }}>
        <Page d={PA} className="x53-p" />
        <Page d={PB} className="x53-p" style={HIDDEN} />
      </div>
      <Tag cls="x53-tag">Left edge</Tag>
      <Sheen g1="rgba(255,196,138,.55)" />
    </Stage>
  );
}

/* ───────────────────────── X54 · Cube rotate ───────────────────────── */
const X54_DIRS = [
  { label: "To the left", prop: "rotationY", s: -1 },
  { label: "To the right", prop: "rotationY", s: 1 },
  { label: "Upwards", prop: "rotationX", s: 1 },
  { label: "Downwards", prop: "rotationX", s: -1 },
] as const;
function X54() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const pages = q(".x54-p");
    const cube = q(".x54-cube")[0];
    const tag = q(".x54-tag")[0];
    const W = cube.clientWidth;
    const H = cube.clientHeight;
    gsap.set(pages, { backfaceVisibility: "hidden" });
    const tl = gsap.timeline({ repeat: -1 });
    X54_DIRS.forEach((d, k) => {
      const from = pages[k % 2];
      const to = pages[(k + 1) % 2];
      const depth = d.prop === "rotationY" ? W / 2 : H / 2;
      // both faces turn about the cube's centre (origin pushed back by half the face size)
      const origin = `50% 50% ${-depth}px`;
      tl.call(() => {
        tag.textContent = d.label;
      })
        .set([from, to], { transformOrigin: origin, rotationX: 0, rotationY: 0 })
        .set(to, { autoAlpha: 1, [d.prop]: -90 * d.s })
        .to(from, { [d.prop]: 90 * d.s, duration: 0.9, ease: "power2.inOut" })
        .to(to, { [d.prop]: 0, duration: 0.9, ease: "power2.inOut" }, "<")
        .to(cube, { scale: 0.86, duration: 0.45, ease: "sine.out", yoyo: true, repeat: 1 }, "<")
        .set(from, { autoAlpha: 0 });
      hold(tl, 0.3);
    });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(169,193,255,.5)">
      <div className="absolute inset-0" style={{ perspective: "1800px" }}>
        <div className="x54-cube absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
          <Page d={PA} className="x54-p" />
          <Page d={PB} className="x54-p" style={HIDDEN} />
        </div>
      </div>
      <Tag cls="x54-tag">To the left</Tag>
      <Sheen g1="rgba(169,193,255,.55)" />
    </Stage>
  );
}

/* ───────────────────────── X55 · Box expands, siblings shrink away ───────────────────────── */
const X55_BOX = [
  { t: "Outerwear", n: "Ridge parka", p: "₹ 12,400", i: 2, l: "0%", tp: "0%" },
  { t: "Knitwear", n: "Fell crewneck", p: "₹ 4,250", i: 0, l: "50%", tp: "0%" },
  { t: "Leather", n: "Saddle tote", p: "₹ 8,900", i: 3, l: "0%", tp: "50%" },
  { t: "Home", n: "Hearth skillet", p: "₹ 3,690", i: 1, l: "50%", tp: "50%" },
];
function X55Grid({ cls }: { cls: string }) {
  return (
    <>
      {X55_BOX.map((b) => (
        <div key={b.t} className={`${cls} absolute overflow-hidden`} style={{ left: b.l, top: b.tp, width: "50%", height: "50%", padding: 6 }}>
          <div className="relative h-full w-full overflow-hidden rounded-[18px]">
            <Img i={b.i} w={900} h={600} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <p className="absolute bottom-[8%] left-[6%] text-[clamp(28px,2.6vw,42px)] leading-none" style={{ fontFamily: F.fr }}>
              {b.t}
            </p>
            <div className="x55-d absolute bottom-[8%] right-[5%] text-right" style={{ visibility: "hidden" }}>
              <p className="text-[13px] uppercase tracking-[0.2em] text-white/70" style={{ fontFamily: F.mr }}>
                {b.n}
              </p>
              <p className="mt-1 text-[22px] tabular-nums" style={{ fontFamily: F.sg }}>
                {b.p}
              </p>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
function X55() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const inner = q(".x-in")[0];
    const boxes = q(".x55-b");
    const up = q(".x55-up")[0];
    const dot = q(".b13g3x-dot")[0];
    const tag = q(".x55-tag")[0];
    gsap.set(up, { yPercent: 100, autoAlpha: 1 });
    gsap.set(dot, { x: inner.clientWidth * 0.5, y: inner.clientHeight * 0.5 });
    const tl = gsap.timeline({ repeat: -1 });
    [1, 2].forEach((k) => {
      const box = boxes[k];
      const others = boxes.filter((_, j) => j !== k);
      const det = box.querySelector(".x55-d");
      // mode 1 · the chosen box grows to full screen, the other three shrink and fade
      tl.call(() => {
        tag.textContent = "Box expands";
      });
      point(tl, dot, box, inner, 0.4);
      tl.set(box, { zIndex: 3 })
        .to(dot, { opacity: 0, duration: 0.2 })
        .to(box, { left: "0%", top: "0%", width: "100%", height: "100%", padding: 0, duration: 1, ease: "power2.inOut" }, "<")
        .to(others, { scale: 0.6, opacity: 0, duration: 0.7, ease: "power2.inOut", stagger: 0.05 }, "<")
        .set(det, { visibility: "visible" }, "-=0.35")
        .fromTo(det, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power2.out" }, "<");
      hold(tl, 0.3);
      // mode 2 · a new panel (the grid) slides up from the bottom while the current one scales down behind it
      tl.call(() => {
        tag.textContent = "Panel slides up";
      })
        .to(up, { yPercent: 0, duration: 1, ease: "power2.inOut" })
        .to(box, { scale: 0.82, opacity: 0.35, duration: 1, ease: "power2.inOut" }, "<")
        // seamless reset under the identical grid panel
        .set(box, { left: X55_BOX[k].l, top: X55_BOX[k].tp, width: "50%", height: "50%", padding: 6, scale: 1, opacity: 1, zIndex: 1 })
        .set(det, { visibility: "hidden" })
        .set(others, { scale: 1, opacity: 1 })
        .set(up, { yPercent: 100 });
      hold(tl, 0.3);
    });
    return tl;
  });
  return (
    <Stage r={root}>
      <div className="absolute inset-[3%]">
        <X55Grid cls="x55-b" />
      </div>
      <div className="x55-up absolute inset-0 z-20 bg-[#08090c]" style={{ visibility: "hidden", transform: "translateY(100%)" }} aria-hidden>
        <div className="absolute inset-[3%]">
          <X55Grid cls="x55-u" />
        </div>
      </div>
      <Tag cls="x55-tag">Box expands</Tag>
      <Dot />
      <Sheen />
    </Stage>
  );
}

/* ───────────────────────── X56 · Pill clip with skewed side slides ───────────────────────── */
const X56_PILLS = [
  { l: "-9%", i: 3, s: -1 },
  { l: "15%", i: 1, s: -1 },
  { l: "65%", i: 0, s: 1 },
  { l: "89%", i: 3, s: 1 },
];
function X56() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const inner = q(".x-in")[0];
    const main = q(".x56-main")[0];
    const pills = q(".x56-n");
    const title = q(".x56-t");
    const cap = q(".x56-cap");
    const cx = inner.clientWidth / 2;
    gsap.set(main, { clipPath: "inset(0% 0% 0% 0% round 0px)" });
    // each side slide starts squeezed into the centre: skewed ±25°, stretched scaleX 5
    pills.forEach((p, k) => {
      const b = rel(p, inner);
      gsap.set(p, { x: cx - (b.x + b.w / 2), skewX: 25 * X56_PILLS[k].s, scaleX: 5, opacity: 0 });
    });
    gsap.set(cap, { y: 20, opacity: 0 });
    return gsap
      .timeline({ repeat: -1, yoyo: true, repeatDelay: 0.25, defaults: { ease: "power2.inOut" } })
      .to(title, { y: -40, opacity: 0, duration: 0.45, stagger: 0.05, ease: "power2.in" }, 0)
      .to(main, { clipPath: "inset(22% 39% 22% 39% round 240px)", duration: 1.2 }, 0.1)
      .to(".x56-img", { scale: 1.12, duration: 1.2 }, 0.1)
      .to(pills, { x: 0, skewX: 0, scaleX: 1, opacity: 1, duration: 1.1, stagger: 0.05 }, 0.2)
      .to(cap, { y: 0, opacity: 1, duration: 0.45, stagger: 0.06, ease: "power2.out" }, 0.95);
  });
  return (
    <Stage r={root} g1="rgba(255,196,138,.5)">
      {X56_PILLS.map((p, k) => (
        <div key={k} className="x56-n absolute top-[22%] h-[56%] w-[22%] overflow-hidden rounded-[999px]" style={{ left: p.l, opacity: 0 }}>
          <Img i={p.i} w={600} h={800} />
        </div>
      ))}
      <div className="x56-main absolute inset-0 overflow-hidden">
        <Img i={2} className="x56-img" w={1600} h={1000} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        <div className="absolute inset-x-[5%] bottom-[9%]">
          <p className="x56-t text-[13px] uppercase tracking-[0.24em] text-white/75" style={{ fontFamily: F.mr }}>
            Pinecrest Lodges · Stay 01
          </p>
          <h3 className="x56-t mt-2 whitespace-nowrap text-[6vw] font-[800] leading-[0.9]" style={{ fontFamily: F.sy }}>
            HIGHLAND
          </h3>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-[8%] flex justify-center gap-10 text-[13px] uppercase tracking-[0.22em] text-white/80" style={{ fontFamily: F.mr }}>
        <span className="x56-cap" style={{ opacity: 0 }}>
          Five lodges
        </span>
        <span className="x56-cap" style={{ opacity: 0 }}>
          From ₹ 18,500 a night
        </span>
      </div>
      <Sheen g1="rgba(255,196,138,.55)" />
    </Stage>
  );
}

/* ───────────────────────── X57 · Clip to small card with stretched chars ───────────────────────── */
const X57_WORD = "SALTLINE";
const X57_SLIDES = [
  { l: 6, t: 10, i: 0 },
  { l: 30, t: 6, i: 3 },
  { l: 62, t: 6, i: 1 },
  { l: 82, t: 12, i: 2 },
  { l: 4, t: 58, i: 1 },
  { l: 22, t: 66, i: 2 },
  { l: 66, t: 68, i: 0 },
  { l: 84, t: 58, i: 3 },
];
function X57() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const inner = q(".x-in")[0];
    const main = q(".x57-main")[0];
    const chars = q(".x57-ch");
    const slides = q(".x57-s");
    const cap = q(".x57-cap")[0];
    const cx = inner.clientWidth / 2;
    const cy = inner.clientHeight / 2;
    gsap.set(main, { clipPath: "inset(0% 0% 0% 0% round 0px)" });
    // radial offsets: each slide starts pushed outward along the line from the centre
    slides.forEach((s) => {
      const b = rel(s, inner);
      const dx = b.x + b.w / 2 - cx;
      const dy = b.y + b.h / 2 - cy;
      const len = Math.hypot(dx, dy) || 1;
      gsap.set(s, { x: (dx / len) * 700, y: (dy / len) * 500, opacity: 0, scale: 0.7 });
    });
    gsap.set(cap, { y: 16, opacity: 0 });
    return gsap
      .timeline({ repeat: -1, yoyo: true, repeatDelay: 0.25, defaults: { ease: "power2.inOut" } })
      .to(chars, { scaleY: 8, scaleX: 0.1, opacity: 0, duration: 0.6, stagger: { each: 0.035, from: "center" }, ease: "power2.in", transformOrigin: "50% 100%" }, 0)
      .to(main, { clipPath: "inset(30% 41% 30% 41% round 24px)", duration: 1.2 }, 0.1)
      .to(".x57-img", { scale: 1.15, duration: 1.2 }, 0.1)
      .to(slides, { x: 0, y: 0, opacity: 1, scale: 1, duration: 1.1, stagger: 0.04 }, 0.2)
      .to(cap, { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" }, 1.0);
  });
  return (
    <Stage r={root} g1="rgba(184,227,198,.5)">
      {X57_SLIDES.map((s, k) => (
        <div key={k} className="x57-s absolute h-[30%] w-[14%] overflow-hidden rounded-[16px]" style={{ left: `${s.l}%`, top: `${s.t}%`, opacity: 0 }}>
          <Img i={s.i} w={500} h={600} />
        </div>
      ))}
      <div className="x57-main absolute inset-0 overflow-hidden">
        <Img i={0} className="x57-img" w={1600} h={1000} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        <div className="absolute inset-x-[5%] bottom-[9%]">
          <h3 className="whitespace-nowrap text-[6.4vw] font-[800] leading-[0.9]" style={{ fontFamily: F.sy }} aria-label={X57_WORD}>
            {X57_WORD.split("").map((c, k) => (
              <span key={k} className="x57-ch inline-block" aria-hidden>
                {c}
              </span>
            ))}
          </h3>
        </div>
      </div>
      <p className="x57-cap absolute inset-x-0 bottom-[12%] text-center text-[13px] uppercase tracking-[0.22em] text-white/80" style={{ fontFamily: F.mr, opacity: 0 }}>
        Coastal edit · 8 pieces · from ₹ 2,400
      </p>
      <Sheen />
    </Stage>
  );
}

/* ───────────────────────── X58 · Clip to column with Y-rotated slides ───────────────────────── */
const X58_SIDE = [
  { l: 4, i: 3, s: -1 },
  { l: 18, i: 1, s: -1 },
  { l: 32, i: 2, s: -1 },
  { l: 58, i: 0, s: 1 },
  { l: 72, i: 3, s: 1 },
  { l: 86, i: 1, s: 1 },
];
function X58() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const main = q(".x58-main")[0];
    const slides = q(".x58-s");
    const title = q(".x58-t");
    gsap.set(main, { clipPath: "inset(0% 0% 0% 0% round 0px)" });
    slides.forEach((s, k) => gsap.set(s, { rotationY: 60 * X58_SIDE[k].s, opacity: 0, transformOrigin: X58_SIDE[k].s < 0 ? "100% 50%" : "0% 50%" }));
    return gsap
      .timeline({ repeat: -1, yoyo: true, repeatDelay: 0.25, defaults: { ease: "power2.inOut" } })
      .to(title, { y: 30, opacity: 0, duration: 0.45, stagger: 0.05, ease: "power2.in" }, 0)
      .to(main, { clipPath: "inset(6% 45% 6% 45% round 16px)", duration: 1.2 }, 0.1)
      .to(".x58-img", { scale: 1.1, duration: 1.2 }, 0.1)
      // side slides turn in on Y from ±60°, the ones nearest the column first
      .to(slides, { rotationY: 0, opacity: 1, duration: 1, stagger: (k: number) => 0.06 * Math.abs(k - 2.5) }, 0.2);
  });
  return (
    <Stage r={root} g1="rgba(169,193,255,.5)">
      <div className="absolute inset-0" style={{ perspective: "1100px" }}>
        {X58_SIDE.map((s, k) => (
          <div key={k} className="x58-s absolute top-[12%] h-[76%] w-[10%] overflow-hidden rounded-[14px]" style={{ left: `${s.l}%`, opacity: 0 }}>
            <Img i={s.i} w={400} h={800} />
          </div>
        ))}
      </div>
      <div className="x58-main absolute inset-0 overflow-hidden">
        <Img i={1} className="x58-img" w={1600} h={1000} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-[10%] left-[5%]">
          <p className="x58-t text-[13px] uppercase tracking-[0.24em] text-white/75" style={{ fontFamily: F.mr }}>
            Amberly Glassworks · Vessels
          </p>
          <h3 className="x58-t mt-3 text-[clamp(56px,6vw,96px)] leading-[0.92]" style={{ fontFamily: F.is }}>
            Blown, not poured
          </h3>
          <p className="x58-t mt-4 text-[18px] tabular-nums text-white/70" style={{ fontFamily: F.sg }}>
            Seven vessels · from ₹ 2,950
          </p>
        </div>
      </div>
      <Sheen g1="rgba(169,193,255,.55)" />
    </Stage>
  );
}

/* ───────────────────────── X59 · Overlay grows from the item ───────────────────────── */
const X59_ITEMS = [
  { n: "Fell crewneck", p: "₹ 4,250", i: 2, c: "#1d2a22", d: "Undyed merino, dense knit, made in small runs." },
  { n: "Hearth skillet", p: "₹ 3,690", i: 3, c: "#2a1c12", d: "Sand-cast iron, seasoned twice, built for decades." },
  { n: "Trail flask", p: "₹ 1,890", i: 1, c: "#2a1219", d: "Double-walled steel that keeps tea hot all day." },
  { n: "Ridge bottle", p: "₹ 1,450", i: 0, c: "#121a2a", d: "Light, dent-proof and sized for one long climb." },
];
const X59_PICK = [1, 3];
function X59() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(
    root,
    (el) => {
      const Flip = flipMod!;
      const q = gsap.utils.selector(el);
      const inner = q(".x-in")[0];
      const cards = q(".x59-card");
      const imgs = q(".x59-ci");
      const ov = q(".x59-ov")[0];
      const flies = q(".x59-fly") as HTMLElement[];
      const pvs = q(".x59-pv");
      const dot = q(".b13g3x-dot")[0];
      const W = inner.clientWidth;
      const H = inner.clientHeight;
      gsap.set(ov, { transformOrigin: "0 0", autoAlpha: 0 });
      gsap.set(dot, { x: W * 0.5, y: H * 0.85 });
      const tl = gsap.timeline({ repeat: -1 });
      X59_PICK.forEach((k, n) => {
        const card = cards[k];
        const fly = flies[n];
        const pv = pvs[n];
        const r = rel(card, inner);
        const full = { x: 0, y: 0, width: fly.offsetWidth, height: fly.offsetHeight, borderRadius: 18 };
        const toItem = Flip.fit(fly, imgs[k], { scale: false, getVars: true }) as gsap.TweenVars;
        const lines = pv.querySelectorAll("[data-l]");
        point(tl, dot, card, inner, 0.45);
        // the overlay starts as the item's exact rect and scales to full screen
        tl.set(ov, { backgroundColor: X59_ITEMS[k].c, x: r.x, y: r.y, scaleX: r.w / W, scaleY: r.h / H, autoAlpha: 1 })
          .to(dot, { opacity: 0, duration: 0.2 })
          .to(ov, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.6, ease: "power2.inOut" }, "<")
          // then the item's image flips into the preview layout
          .set(fly, { ...toItem, borderRadius: 14, autoAlpha: 1 })
          .set(imgs[k], { opacity: 0 })
          .to(fly, { ...full, duration: 0.6, ease: "power2.inOut" })
          .set(pv, { visibility: "visible" }, "<0.25")
          .fromTo(lines, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: "power2.out" }, "<");
        hold(tl, 0.3);
        // back to the grid: reverse the same path
        tl.to(lines, { y: -16, opacity: 0, duration: 0.25, stagger: 0.03, ease: "power2.in" })
          .set(pv, { visibility: "hidden" })
          .to(fly, { ...toItem, borderRadius: 14, duration: 0.55, ease: "power2.inOut" }, "-=0.1")
          .to(ov, { x: r.x, y: r.y, scaleX: r.w / W, scaleY: r.h / H, duration: 0.55, ease: "power2.inOut" }, "<0.1")
          .set(imgs[k], { opacity: 1 })
          .set([fly, ov], { autoAlpha: 0 });
        hold(tl, 0.2);
      });
      return tl;
    },
    getFlip,
  );
  return (
    <Stage r={root}>
      <div className="absolute inset-x-[5%] top-[8%] flex items-end justify-between">
        <h3 className="text-[clamp(40px,4vw,64px)] leading-none" style={{ fontFamily: F.fr }}>
          The carry list
        </h3>
        <p className="text-[13px] uppercase tracking-[0.2em] text-white/60" style={{ fontFamily: F.mr }}>
          Marrow &amp; Vale · 4 pieces
        </p>
      </div>
      <div className="absolute inset-x-[5%] bottom-[9%] top-[26%] grid grid-cols-4 gap-[2%]">
        {X59_ITEMS.map((it) => (
          <div key={it.n} className="x59-card flex flex-col">
            <div className="x59-ci relative flex-1 overflow-hidden rounded-[14px]">
              <Img i={it.i} w={600} h={700} />
            </div>
            <div className="mt-3 flex items-baseline justify-between" style={{ fontFamily: F.sg }}>
              <span className="text-[17px]">{it.n}</span>
              <span className="text-[15px] tabular-nums text-white/60">{it.p}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="x59-ov absolute left-0 top-0 z-10 h-full w-full" style={{ visibility: "hidden", opacity: 0 }} aria-hidden />
      {X59_PICK.map((k, n) => (
        <div key={k}>
          <div className="x59-fly absolute left-[6%] top-[10%] z-20 h-[80%] w-[42%] overflow-hidden rounded-[18px]" style={{ visibility: "hidden" }} aria-hidden>
            <Img i={X59_ITEMS[k].i} w={900} h={1000} />
          </div>
          <div className="x59-pv absolute left-[54%] top-[22%] z-20 w-[38%]" style={{ visibility: "hidden" }}>
            <p data-l className="text-[13px] uppercase tracking-[0.22em] text-white/60" style={{ fontFamily: F.mr }}>
              Preview · {String(k + 1).padStart(2, "0")}
            </p>
            <h4 data-l className="mt-3 text-[clamp(44px,4.4vw,72px)] leading-[0.95]" style={{ fontFamily: F.fr }}>
              {X59_ITEMS[k].n}
            </h4>
            <p data-l className="mt-4 text-[16px] text-white/70" style={{ fontFamily: F.mr }}>
              {X59_ITEMS[k].d}
            </p>
            <div data-l className="mt-6 flex items-center gap-5" style={{ fontFamily: F.sg }}>
              <span className="rounded-full bg-[#f3efe8] px-6 py-3 text-[14px] font-[600] text-[#111]">Add to bag</span>
              <span className="text-[22px] tabular-nums">{X59_ITEMS[k].p}</span>
            </div>
          </div>
        </div>
      ))}
      <Dot />
      <Sheen />
    </Stage>
  );
}

/* ───────────────────────── X60 · Split halves push to side ───────────────────────── */
const X60_SIDES = [
  { name: "Studio", kick: "Tailored · indoor", body: "Pressed wool trousers, soft shirting and quiet knits for long desk days.", p: "From ₹ 3,200", i: 0, bg: "#10141c" },
  { name: "Field", kick: "Rugged · outdoor", body: "Waxed cotton, ripstop shells and boots that take the long way home.", p: "From ₹ 4,800", i: 2, bg: "#121a14" },
];
function X60() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const inner = q(".x-in")[0];
    const [L, R] = q(".x60-h");
    const intros = q(".x60-in");
    const dets = q(".x60-d");
    const dot = q(".b13g3x-dot")[0];
    gsap.set(dot, { x: inner.clientWidth * 0.5, y: inner.clientHeight * 0.8 });
    const tl = gsap.timeline({ repeat: -1 });
    const pick = (k: 0 | 1) => {
      const me = k ? R : L;
      const other = k ? L : R;
      const s = k ? 1 : -1; // side the content comes from
      point(tl, dot, intros[k], inner, 0.45);
      tl.to(dot, { opacity: 0, duration: 0.2 })
        .to(me, { left: "0%", width: "100%", duration: 1, ease: "power2.inOut" }, "<")
        .to(other, { left: k ? "-50%" : "100%", duration: 1, ease: "power2.inOut" }, "<")
        .to(intros[k], { opacity: 0, duration: 0.3, ease: "power1.in" }, "<")
        .set(dets[k], { visibility: "visible" }, "-=0.55")
        .fromTo(dets[k].children, { xPercent: 60 * s, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 0.6, stagger: 0.06, ease: "power2.out" }, "<");
      hold(tl, 0.3);
      // back to the split view
      tl.to(dets[k].children, { xPercent: 30 * s, opacity: 0, duration: 0.3, stagger: 0.03, ease: "power2.in" })
        .set(dets[k], { visibility: "hidden" })
        .to(me, { left: k ? "50%" : "0%", width: "50%", duration: 0.9, ease: "power2.inOut" }, "-=0.1")
        .to(other, { left: k ? "0%" : "50%", duration: 0.9, ease: "power2.inOut" }, "<")
        .to(intros[k], { opacity: 1, duration: 0.4 }, "-=0.4");
      hold(tl, 0.2);
    };
    pick(0);
    pick(1);
    return tl;
  });
  return (
    <Stage r={root}>
      {X60_SIDES.map((s, k) => (
        <div key={s.name} className="x60-h absolute top-0 h-full overflow-hidden" style={{ left: k ? "50%" : "0%", width: "50%", background: s.bg }}>
          <div className="absolute inset-0 opacity-60">
            <Img i={s.i} w={1400} h={1000} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/30" />
          <div className="x60-in absolute bottom-[10%] left-0 w-[46vw] max-w-full px-[7%]">
            <p className="text-[13px] uppercase tracking-[0.24em] text-white/70" style={{ fontFamily: F.mr }}>
              Collection {k + 1}
            </p>
            <h3 className="mt-2 text-[clamp(64px,7vw,112px)] font-[700] leading-[0.9]" style={{ fontFamily: F.sy }}>
              {s.name}
            </h3>
          </div>
          <div className="x60-d absolute bottom-[12%] left-[6%] w-[46%]" style={{ visibility: "hidden" }}>
            <p className="text-[13px] uppercase tracking-[0.24em] text-white/70" style={{ fontFamily: F.mr }}>
              {s.kick}
            </p>
            <h4 className="mt-3 text-[clamp(56px,6vw,96px)] leading-[0.92]" style={{ fontFamily: F.fr }}>
              The {s.name} edit
            </h4>
            <p className="mt-4 max-w-[40ch] text-[16px] text-white/75" style={{ fontFamily: F.mr }}>
              {s.body}
            </p>
            <p className="mt-5 text-[20px] tabular-nums" style={{ fontFamily: F.sg }}>
              {s.p}
            </p>
          </div>
        </div>
      ))}
      <Dot />
      <Sheen />
    </Stage>
  );
}

/* ───────────────────────── X61 · Video tile opens to player ───────────────────────── */
function Poster() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="x61-poster absolute inset-0">
        <Img i={1} w={1400} h={900} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
    </div>
  );
}
function X61() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(
    root,
    (el) => {
      const Flip = flipMod!;
      const q = gsap.utils.selector(el);
      const inner = q(".x-in")[0];
      const tile = q(".x61-tile")[0];
      const pl = q(".x61-pl")[0] as HTMLElement;
      const ui = q(".x61-ui");
      const ctr = q(".x61-ctr")[0];
      const bar = q(".x61-bar")[0];
      const dot = q(".b13g3x-dot")[0];
      const full = { x: 0, y: 0, width: pl.offsetWidth, height: pl.offsetHeight, borderRadius: 0 };
      const toTile = Flip.fit(pl, tile, { scale: false, getVars: true }) as gsap.TweenVars;
      gsap.set(dot, { x: inner.clientWidth * 0.3, y: inner.clientHeight * 0.75 });
      gsap.set(bar, { scaleX: 0, transformOrigin: "0 50%" });
      const tl = gsap.timeline({ repeat: -1 });
      point(tl, dot, tile, inner, 0.45);
      tl.set(pl, { ...toTile, borderRadius: 20, autoAlpha: 1 })
        .set(tile, { opacity: 0 })
        .to(dot, { opacity: 0, duration: 0.2 })
        // the tile grows to fill the screen while the UI around it moves away
        .to(pl, { ...full, duration: 1, ease: "power2.inOut" }, "<")
        .to(ui, { y: (k: number) => (k % 2 ? 60 : -60), opacity: 0, duration: 0.6, stagger: 0.04, ease: "power2.in" }, "<")
        // then the player controls fade in
        .set(ctr, { visibility: "visible" })
        .fromTo(ctr, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" })
        .fromTo(bar, { scaleX: 0.04 }, { scaleX: 0.38, duration: 1.2, ease: "none" }, "<");
      // close again
      tl.to(ctr, { opacity: 0, duration: 0.25 })
        .set(ctr, { visibility: "hidden" })
        .to(pl, { ...toTile, borderRadius: 20, duration: 0.85, ease: "power2.inOut" })
        .to(ui, { y: 0, opacity: 1, duration: 0.6, stagger: 0.04, ease: "power2.out" }, "<0.3")
        .set(tile, { opacity: 1 })
        .set(pl, { autoAlpha: 0 });
      hold(tl, 0.2);
      return tl;
    },
    getFlip,
  );
  return (
    <Stage r={root} g1="rgba(255,196,138,.5)">
      <div className="absolute inset-0 flex items-center gap-[6%] px-[6%]">
        <div className="w-[44%]">
          <p className="x61-ui text-[13px] uppercase tracking-[0.24em] text-[#ffc48a]" style={{ fontFamily: F.mr }}>
            Lumen Reel · Film 04
          </p>
          <h3 className="x61-ui mt-3 text-[clamp(48px,5vw,84px)] leading-[0.95]" style={{ fontFamily: F.is }}>
            Made at the forge
          </h3>
          <p className="x61-ui mt-4 max-w-[36ch] text-[16px] text-white/65" style={{ fontFamily: F.mr }}>
            Four minutes inside the foundry where every skillet is poured by hand.
          </p>
          <div className="x61-ui mt-6 flex gap-6 text-[14px] text-white/70" style={{ fontFamily: F.sg }}>
            <span>4:12 min</span>
            <span>Chapter 2 of 6</span>
          </div>
        </div>
        <div className="x61-tile relative aspect-[16/10] flex-1 overflow-hidden rounded-[20px]">
          <Poster />
          <span className="absolute left-1/2 top-1/2 flex h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90">
            <span className="ml-1 h-0 w-0 border-y-[11px] border-l-[18px] border-y-transparent border-l-[#111]" />
          </span>
        </div>
      </div>
      <div className="x61-pl absolute left-0 top-0 z-20 h-full w-full overflow-hidden" style={{ visibility: "hidden" }} aria-hidden>
        <Poster />
        <div className="x61-ctr absolute inset-x-[4%] bottom-[6%] flex items-center gap-5" style={{ visibility: "hidden", fontFamily: F.sg }}>
          <span className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full bg-white/90">
            <span className="flex gap-[4px]">
              <span className="h-[14px] w-[4px] bg-[#111]" />
              <span className="h-[14px] w-[4px] bg-[#111]" />
            </span>
          </span>
          <span className="text-[14px] tabular-nums text-white/85">1:34</span>
          <span className="relative h-[4px] flex-1 overflow-hidden rounded-full bg-white/25">
            <span className="x61-bar absolute inset-0 rounded-full bg-[#ffc48a]" />
          </span>
          <span className="text-[14px] tabular-nums text-white/85">4:12</span>
        </div>
      </div>
      <Dot />
      <Sheen g1="rgba(255,196,138,.55)" />
    </Stage>
  );
}

/* ───────────────────────── X62 · Page stack navigation ───────────────────────── */
const X62_PAGES = [PA, PB, PC];
const X62_NAMES = ["Field wear", "Hearth", "Journal"];
function X62() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const inner = q(".x-in")[0];
    const pages = q(".x62-p");
    const menu = q(".x62-m")[0];
    const items = q(".x62-mi");
    const burger = q(".x62-burger")[0];
    const dot = q(".b13g3x-dot")[0];
    gsap.set(pages, { z: 0, yPercent: 0, transformOrigin: "50% 0%" });
    gsap.set(menu, { autoAlpha: 0 });
    gsap.set(dot, { x: inner.clientWidth * 0.8, y: inner.clientHeight * 0.4 });
    const slot = (s: number) => ({ z: -320 - s * 220, yPercent: 30 - s * 9 });
    const tl = gsap.timeline({ repeat: -1 });
    // menu open from page `cur`: it is pushed back, the rest of the stack fans out behind it
    const open = (cur: number) => {
      const rest = [0, 1, 2].filter((j) => j !== cur);
      point(tl, dot, burger, inner, 0.4);
      tl.to(pages[cur], { ...slot(0), duration: 0.8, ease: "power2.inOut" })
        .to(dot, { opacity: 0, duration: 0.2 }, "<");
      rest.forEach((j, s) => {
        tl.set(pages[j], { zIndex: 1 }, "<").fromTo(pages[j], { ...slot(s + 1), z: slot(s + 1).z - 300, autoAlpha: 0 }, { ...slot(s + 1), autoAlpha: 1, duration: 0.8, ease: "power2.inOut" }, "<");
      });
      tl.set(menu, { autoAlpha: 1 }, "<").fromTo(items, { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: "power2.out" }, "<0.3");
    };
    // pick page `to`: it comes forward to full size, everything else sinks back and goes
    const pick = (to: number) => {
      const rest = [0, 1, 2].filter((j) => j !== to);
      point(tl, dot, items[to], inner, 0.4);
      tl.to(items, { opacity: 0, x: -20, duration: 0.3, stagger: 0.03, ease: "power2.in" })
        .set(menu, { autoAlpha: 0 })
        .to(pages[to], { z: 0, yPercent: 0, duration: 0.8, ease: "power2.inOut" }, "<")
        .to(dot, { opacity: 0, duration: 0.2 }, "<")
        .to(rest.map((j) => pages[j]), { z: "-=260", autoAlpha: 0, duration: 0.7, ease: "power2.in" }, "<");
      hold(tl, 0.3);
    };
    open(0);
    pick(1);
    open(1);
    pick(0);
    return tl;
  });
  return (
    <Stage r={root}>
      <div className="absolute inset-0" style={{ perspective: "1400px", perspectiveOrigin: "50% 20%" }}>
        <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
          {X62_PAGES.map((d, k) => (
            <Page key={k} d={d} className="x62-p rounded-[18px] shadow-[0_30px_80px_rgba(0,0,0,.6)]" style={k ? HIDDEN : undefined} />
          ))}
        </div>
      </div>
      <div className="x62-m absolute left-[5%] top-[10%] z-30" style={{ visibility: "hidden", opacity: 0 }}>
        {X62_NAMES.map((n, k) => (
          <p key={n} className="x62-mi text-[clamp(28px,2.6vw,40px)] leading-[1.3]" style={{ fontFamily: F.fr }}>
            <span className="mr-3 align-middle text-[13px] tabular-nums text-white/50" style={{ fontFamily: F.mr }}>
              0{k + 1}
            </span>
            {n}
          </p>
        ))}
      </div>
      <span className="x62-burger absolute right-[4%] top-[5.5%] z-30 flex h-[40px] w-[40px] flex-col items-center justify-center gap-[5px] rounded-full border border-white/30 bg-black/40" aria-hidden>
        <span className="h-[2px] w-[16px] bg-white" />
        <span className="h-[2px] w-[16px] bg-white" />
      </span>
      <Dot />
      <Sheen />
    </Stage>
  );
}

/* ───────────────────────── X63 · Page pushed back to reveal menu ───────────────────────── */
const X63_LINKS = ["Shop", "Journal", "Stores", "Account"];
const X63_MODES = [
  { label: "Move left", origin: "0% 50%", to: { x: "-34%", rotationY: 38, z: -160 }, menu: 0 },
  { label: "Rotate top", origin: "50% 0%", to: { rotationX: -42, z: -120, yPercent: -6 }, menu: 1 },
  { label: "Lay down", origin: "50% 100%", to: { rotationX: 68, z: -80, yPercent: 8 }, menu: 2 },
];
function X63() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const inner = q(".x-in")[0];
    const page = q(".x63-page")[0];
    const menus = q(".x63-menu");
    const burger = q(".x63-burger")[0];
    const tag = q(".x63-tag")[0];
    const dot = q(".b13g3x-dot")[0];
    gsap.set(dot, { x: inner.clientWidth * 0.5, y: inner.clientHeight * 0.5 });
    const tl = gsap.timeline({ repeat: -1 });
    X63_MODES.forEach((m) => {
      const menu = menus[m.menu];
      const links = menu.children;
      tl.call(() => {
        tag.textContent = m.label;
      }).set(page, { transformOrigin: m.origin, x: 0, rotationX: 0, rotationY: 0, z: 0, yPercent: 0 });
      point(tl, dot, burger, inner, 0.4);
      // open: the whole page is pushed back in 3D and the menu shows beside it
      tl.set(menu, { visibility: "visible" })
        .to(page, { ...m.to, duration: 0.6, ease: "power2.inOut" })
        .fromTo(links, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: "power2.out" }, "<0.2");
      hold(tl, 0.2);
      // click the page: it comes back
      const pb = page.getBoundingClientRect();
      const ib = inner.getBoundingClientRect();
      const tx = m.menu === 0 ? pb.left - ib.left + pb.width * 0.2 : pb.left - ib.left + pb.width * 0.5;
      const ty = m.menu === 1 ? ib.height * 0.3 : m.menu === 2 ? ib.height * 0.82 : ib.height * 0.5;
      tl.to(dot, { x: tx, y: ty, duration: 0.4, ease: "power2.inOut" })
        .to(dot, { scale: 0.6, duration: 0.1, yoyo: true, repeat: 1 })
        .to(links, { opacity: 0, y: -10, duration: 0.25, stagger: 0.03, ease: "power2.in" })
        .to(page, { x: 0, rotationX: 0, rotationY: 0, z: 0, yPercent: 0, duration: 0.6, ease: "power2.inOut" }, "<")
        .to(dot, { opacity: 0, duration: 0.2 }, "<")
        .set(menu, { visibility: "hidden" });
      hold(tl, 0.2);
    });
    return tl;
  });
  const link = (l: string, k: number) => (
    <span key={l} className="block" style={{ opacity: 0 }}>
      <span className="mr-3 text-[13px] tabular-nums text-white/45" style={{ fontFamily: F.mr }}>
        0{k + 1}
      </span>
      {l}
    </span>
  );
  return (
    <Stage r={root} g1="rgba(184,227,198,.5)">
      {/* menu for "move left": a column on the right */}
      <div className="x63-menu absolute right-[6%] top-1/2 flex -translate-y-1/2 flex-col gap-3 text-[clamp(32px,3vw,48px)] leading-[1.1]" style={{ fontFamily: F.fr, visibility: "hidden" }}>
        {X63_LINKS.map(link)}
      </div>
      {/* menu for "rotate top": a row along the bottom */}
      <div className="x63-menu absolute inset-x-0 bottom-[8%] flex justify-center gap-12 text-[clamp(28px,2.6vw,40px)]" style={{ fontFamily: F.fr, visibility: "hidden" }}>
        {X63_LINKS.map(link)}
      </div>
      {/* menu for "lay down": a row along the top */}
      <div className="x63-menu absolute inset-x-0 top-[12%] flex justify-center gap-12 text-[clamp(28px,2.6vw,40px)]" style={{ fontFamily: F.fr, visibility: "hidden" }}>
        {X63_LINKS.map(link)}
      </div>
      <div className="absolute inset-0" style={{ perspective: "1500px" }}>
        <div className="x63-page absolute inset-0 overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,.65)]">
          <Page d={PA} />
          <span className="x63-burger absolute right-[4%] top-[5.5%] flex h-[40px] w-[40px] flex-col items-center justify-center gap-[5px] rounded-full border border-white/30 bg-black/40" aria-hidden>
            <span className="h-[2px] w-[16px] bg-white" />
            <span className="h-[2px] w-[16px] bg-white" />
          </span>
        </div>
      </div>
      <Tag cls="x63-tag">Move left</Tag>
      <Dot />
      <Sheen />
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "X52", name: "Fold away / unfold in", how: "Auto A→B→A: the page folds away on one edge like a hinged panel (rotateY 90°, darkening) while the next unfolds from the opposite edge, 0.8 s.", kind: "play", C: X52 },
  { code: "X53", name: "Edge hinge out, then in", how: "Auto, cycling 4 edges: the page swings out around one edge, then the next page swings in around the same edge, strictly in sequence (0.5 s each).", kind: "play", C: X53 },
  { code: "X54", name: "Cube rotate", how: "Auto, cycling 4 directions: the two pages are faces of a cube that turns 90° about its centre, so the next face rotates into view (0.9 s).", kind: "play", C: X54 },
  { code: "X55", name: "Box expands, siblings shrink away", how: "Auto click: one of four boxes grows to full screen while the others shrink and fade; then the grid slides up from the bottom as the box scales down behind it.", kind: "play", C: X55 },
  { code: "X56", name: "Pill clip with skewed side slides", how: "Auto yoyo: the full-screen photo clips to a pill while the side slides arrive from the centre skewed ±25° and stretched scaleX 5, snapping straight.", kind: "play", C: X56 },
  { code: "X57", name: "Clip to small card with stretched chars", how: "Auto yoyo: the title chars stretch to scaleY 8 / scaleX 0.1 as they leave, the photo clips to a small card and a grid of slides flies in from radial offsets.", kind: "play", C: X57 },
  { code: "X58", name: "Clip to column with Y-rotated slides", how: "Auto yoyo: the full-screen photo clips to a narrow column while the side slides turn in on Y from ±60° into place.", kind: "play", C: X58 },
  { code: "X59", name: "Overlay grows from the item", how: "Auto click: an overlay scales from the card's exact rect to full screen, then the card image Flips into the preview layout; then back.", kind: "play", C: X59 },
  { code: "X60", name: "Split halves push to side", how: "Auto click: one half widens to full width and pushes the other off, its content sliding in from that side; then back, then the other half.", kind: "play", C: X60 },
  { code: "X61", name: "Video tile opens to player", how: "Auto click: the looping video tile Flips up to fill the screen while the text around it moves away, then the player controls fade in; then it closes.", kind: "play", C: X61 },
  { code: "X62", name: "Page stack navigation", how: "Auto: the menu pushes the page back in perspective to reveal the stack behind it; picking a page brings it forward to full size (A→B→A).", kind: "play", C: X62 },
  { code: "X63", name: "Page pushed back to reveal menu", how: "Auto, cycling 3 modes (move left, rotate top, lay down): the whole page tilts back in 3D so the menu shows beside it; a click brings it back.", kind: "play", C: X63 },
];
