"use client";

// Transition motions, batch 13 · group 4 (MOTION-MENU X64–X75). Small focused demos for /lab/motion.
// Every demo loops A → B → A between two simple "pages" while on screen (auto-advance; a fake pointer dot stands in
// for clicks), pauses off screen, and has a CSS-only glow loop (also ON TOP of the pages) that never stops.
// ?static=1 / reduced motion: no JS motion, the markup shows page A with every cover / page B hidden.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import type { Flip as FlipT } from "gsap/Flip";
import { gsap, SplitText, loadPlugin, prefersReducedMotion } from "@/lib/gsap";
import { scene } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = { sg: "Space Grotesk Variable", fr: "Fraunces Variable", is: "Instrument Serif", sy: "Syne Variable", mr: "Manrope Variable" };

const CSS = `
.b13g4x-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(255,213,154,.52)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,143,122,.22)),transparent 70%);animation:b13g4x-drift 5.4s linear infinite alternate;will-change:transform}
@keyframes b13g4x-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b13g4x-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4);pointer-events:none;z-index:40}
.b13g4x-dot::after{content:"";position:absolute;inset:-8px;border-radius:50%;border:1.5px solid rgba(255,255,255,.7);animation:b13g4x-ping 1.2s ease-out infinite}
@keyframes b13g4x-ping{0%{transform:scale(.5);opacity:1}100%{transform:scale(1.8);opacity:0}}
.x65-space{background-image:radial-gradient(1.5px 1.5px at 12% 22%,#fff8,transparent),radial-gradient(1px 1px at 72% 18%,#fff9,transparent),radial-gradient(1.5px 1.5px at 38% 74%,#fff6,transparent),radial-gradient(1px 1px at 86% 66%,#fff8,transparent),radial-gradient(1px 1px at 55% 40%,#fff5,transparent),radial-gradient(1.5px 1.5px at 24% 58%,#fff7,transparent);background-size:420px 300px;animation:x65-pan 18s linear infinite}
@keyframes x65-pan{to{background-position:420px 300px}}
html.is-static .b13g4x-glow,html.is-static .b13g4x-dot::after,html.is-static .x65-space{animation:none}
html.is-static .b13g4x-dot{display:none}
html.is-static {
  .b13g4x-glow,.b13g4x-dot::after,.x65-space{animation:none}
  .b13g4x-dot{display:none}
}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", g1, g2, style }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string; style?: CSSProperties }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0b0a0d] text-[#f6f1ea] ${className}`} style={style}>
      <style href="b13g4x-css" precedence="default">
        {CSS}
      </style>
      <div className="b13g4x-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="x-in relative h-full w-full">{children}</div>
    </div>
  );
}

/** The CSS glow loop again, ON TOP of the pages (screen blend, g1 ≥ .5), so page swaps never read as a freeze. */
const Sheen = ({ g1 = "rgba(255,213,154,.55)" }: { g1?: string }) => (
  <div className="b13g4x-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.45, zIndex: 35 } as CSSProperties} aria-hidden />
);

/** Fake pointer (hidden until JS places it; hidden under ?static=1). */
const Dot = () => <div className="b13g4x-dot" style={{ opacity: 0 }} aria-hidden />;

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

type V = gsap.TweenVars;
type Pt = { x: number; y: number };

let flipMod: typeof FlipT | null = null;
const getFlip = () => loadPlugin("Flip").then((f) => (flipMod = f));
/** Flip.fit as plain tween vars (x, y, width, height): measured before any transform is applied. */
const fit = (a: Element, b: Element) => flipMod!.fit(a, b, { scale: false, getVars: true }) as V;

/** An element's box relative to another element. */
function rel(node: Element, root: Element) {
  const a = node.getBoundingClientRect();
  const r = root.getBoundingClientRect();
  return { x: a.left - r.left, y: a.top - r.top, w: a.width, h: a.height };
}
const mid = (node: Element, root: Element): Pt => {
  const r = rel(node, root);
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
};
const innerOf = (el: HTMLElement) => el.querySelector(".x-in") as HTMLElement;
const natural = (n: HTMLElement): V => ({ x: 0, y: 0, width: n.offsetWidth, height: n.offsetHeight });
const hold = (tl: gsap.core.Timeline, d = 0.3) => tl.to({}, { duration: d });
/** Fake pointer walks to a point and presses. */
function tap(tl: gsap.core.Timeline, dot: Element, p: Pt, d = 0.4) {
  tl.to(dot, { x: p.x, y: p.y, opacity: 1, duration: d, ease: "power2.inOut" }).to(dot, { scale: 0.6, duration: 0.1, yoyo: true, repeat: 1, ease: "power1.inOut" });
  return tl;
}

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, className = "", style, w = 1200, h = 1000 }: { i: number; className?: string; style?: CSSProperties; w?: number; h?: number }) => (
  <img src={scene(i, w, h)} alt="" className={`h-full w-full object-cover ${className}`} style={style} draggable={false} />
);

const HID: CSSProperties = { visibility: "hidden" };

/* ───────────────────────── X64 · Off-canvas page reveal styles ───────────────────────── */
const X64_LINKS = ["New in", "Outerwear", "Knitwear", "Journal", "Stores"];
type X64Fx = { n: string; z: number; mFrom: V; mTo: V; page: V };
function X64() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const inn = innerOf(el);
    const page = q(".x64-page")[0];
    const menu = q(".x64-menu")[0];
    const dim = q(".x64-dim")[0];
    const tag = q(".x64-tag")[0];
    const dot = q(".b13g4x-dot")[0];
    const links = q(".x64-link");
    const burger = mid(q(".x64-burger")[0], inn);
    const shut = { x: inn.offsetWidth * 0.8, y: inn.offsetHeight * 0.55 };
    const W = (menu as HTMLElement).offsetWidth;
    const base: V = { x: 0, y: 0, rotationX: 0, rotationY: 0, scale: 1, transformOrigin: "50% 50%" };
    const FX: X64Fx[] = [
      { n: "Slide in on top", z: 3, mFrom: { xPercent: -100, yPercent: 0 }, mTo: { xPercent: 0 }, page: {} },
      { n: "Push", z: 3, mFrom: { xPercent: -100, yPercent: 0 }, mTo: { xPercent: 0 }, page: { x: W } },
      { n: "Scale down, rotate back", z: 1, mFrom: { xPercent: -40, yPercent: 0 }, mTo: { xPercent: 0 }, page: { x: W * 0.7, rotationY: -14, scale: 0.8, transformOrigin: "0% 50%" } },
      { n: "Door", z: 1, mFrom: { xPercent: 0, yPercent: 0 }, mTo: { xPercent: 0 }, page: { rotationY: -38, transformOrigin: "100% 50%" } },
      { n: "Fall down", z: 3, mFrom: { xPercent: 0, yPercent: -100 }, mTo: { yPercent: 0 }, page: { x: W * 0.5, scale: 0.94 } },
      { n: "Slide along behind", z: 1, mFrom: { xPercent: -50, yPercent: 0 }, mTo: { xPercent: 0 }, page: { x: W } },
    ];
    gsap.set(dot, { x: burger.x, y: burger.y, opacity: 1 });
    const tl = gsap.timeline({ repeat: -1, defaults: { ease: "power2.inOut", duration: 0.5 } });
    FX.forEach((fx, k) => {
      tl.call(() => {
        tag.textContent = `Effect ${k + 1} / ${FX.length} · ${fx.n}`;
      })
        .set(menu, { zIndex: fx.z, autoAlpha: 1, ...fx.mFrom })
        .set(page, base);
      tap(tl, dot, burger, 0.3);
      tl.addLabel(`o${k}`)
        .to(menu, fx.mTo, `o${k}`)
        .to(page, { ...base, ...fx.page }, `o${k}`)
        .to(dim, { opacity: 0.35 }, `o${k}`)
        .fromTo(links, { x: -24, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, stagger: 0.04, ease: "power2.out", immediateRender: false }, `o${k}+=0.15`);
      hold(tl, 0.2);
      tap(tl, dot, shut, 0.35);
      tl.addLabel(`c${k}`)
        .to(menu, fx.mFrom, `c${k}`)
        .to(page, { ...base, ...(fx.page.transformOrigin ? { transformOrigin: fx.page.transformOrigin } : {}) }, `c${k}`)
        .to(dim, { opacity: 0 }, `c${k}`)
        .to(dot, { x: burger.x, y: burger.y, duration: 0.4 }, `c${k}`);
    });
    return tl;
  });
  return (
    <Stage r={root}>
      <div className="absolute inset-0" style={{ perspective: "1500px" }}>
        <nav className="x64-menu absolute left-0 top-0 flex h-full w-[30%] flex-col justify-center gap-5 bg-[#241a14] px-[3.2%]" style={{ zIndex: 3, transform: "translateX(-100%)", visibility: "hidden" }}>
          <p className="text-[13px] uppercase tracking-[0.24em] text-[#ffd59a]" style={{ fontFamily: F.mr }}>
            Menu
          </p>
          {X64_LINKS.map((l) => (
            <span key={l} className="x64-link text-[clamp(26px,2.4vw,38px)] leading-none" style={{ fontFamily: F.fr }}>
              {l}
            </span>
          ))}
          <p className="mt-4 text-[13px] text-white/50" style={{ fontFamily: F.mr }}>
            Free returns · ₹ 0 shipping over ₹ 4,000
          </p>
        </nav>
        <div className="x64-page absolute inset-0 overflow-hidden bg-[#120e0b]" style={{ zIndex: 2 }}>
          <div className="absolute inset-x-[4%] top-[6%] flex items-center justify-between" style={{ fontFamily: F.mr }}>
            <span className="x64-burger flex h-11 w-11 flex-col items-center justify-center gap-[5px] rounded-full border border-white/25">
              <i className="block h-[2px] w-4 bg-white" />
              <i className="block h-[2px] w-4 bg-white" />
            </span>
            <span className="text-[15px] font-[700] uppercase tracking-[0.3em]">Wren &amp; Vale</span>
            <span className="text-[13px] uppercase tracking-[0.2em] text-white/60">Bag (1)</span>
          </div>
          <div className="absolute inset-x-[4%] bottom-[8%] top-[20%] flex gap-[4%]">
            <div className="flex w-[44%] flex-col justify-end pb-[2%]">
              <p className="text-[13px] uppercase tracking-[0.22em] text-[#ffd59a]" style={{ fontFamily: F.mr }}>
                Autumn 26
              </p>
              <h3 className="mt-3 text-[clamp(44px,4.6vw,76px)] leading-[0.96]" style={{ fontFamily: F.fr }}>
                Wool for the long walk
              </h3>
              <p className="mt-4 text-[16px] text-white/60" style={{ fontFamily: F.mr }}>
                Overcoats from ₹ 14,900
              </p>
            </div>
            <div className="relative flex-1 overflow-hidden rounded-[20px]">
              <Img i={3} w={1000} h={800} />
            </div>
          </div>
          <div className="x64-dim pointer-events-none absolute inset-0 bg-black" style={{ opacity: 0 }} />
        </div>
      </div>
      <span className="x64-tag absolute bottom-[4%] right-[3%] z-30 rounded-full bg-black/60 px-4 py-2 text-[13px] tracking-[0.06em] text-white/85" style={{ fontFamily: F.mr }}>
        Effect 1 / 6 · Slide in on top
      </span>
      <Dot />
      <Sheen />
    </Stage>
  );
}

/* ───────────────────────── X65 · Flip in from deep space ───────────────────────── */
const X65_S = [
  { k: "Collection 07", t: "Night swim", b: "Recycled-nylon swimwear, ₹ 3,200", i: 2 },
  { k: "Collection 08", t: "Salt hour", b: "Linen beach shirts, ₹ 2,650", i: 0 },
];
function X65() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const [a, b] = q(".x65-s");
    gsap.set(b, { autoAlpha: 0 });
    const tl = gsap.timeline({ repeat: -1 });
    const go = (from: Element, to: Element) => {
      tl.set(to, { autoAlpha: 1, rotationX: 140, scale: 0.1, z: -1000, zIndex: 2 })
        .set(from, { zIndex: 1 })
        .to(from, { z: -500, scale: 0.7, autoAlpha: 0, duration: 0.9, ease: "power2.in" })
        .to(to, { rotationX: 0, scale: 1, z: 0, duration: 1.2, ease: "expo.out" }, "<0.1")
        .fromTo(to.querySelectorAll("[data-l]"), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: "power2.out", immediateRender: false }, "<0.5");
      hold(tl, 0.1);
    };
    go(a, b);
    go(b, a);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(140,170,255,.5)" g2="rgba(255,213,154,.2)">
      <div className="x65-space absolute inset-0" aria-hidden />
      <div className="absolute inset-0" style={{ perspective: "1100px" }}>
        {X65_S.map((s, k) => (
          <div key={s.t} className="x65-s absolute inset-[7%] overflow-hidden rounded-[24px] border border-white/10" style={k ? HID : undefined}>
            <Img i={s.i} w={1300} h={800} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-[9%] left-[6%]">
              <p data-l className="text-[13px] uppercase tracking-[0.24em] text-white/75" style={{ fontFamily: F.mr }}>
                {s.k}
              </p>
              <h3 data-l className="mt-2 text-[clamp(52px,6vw,96px)] leading-[0.95]" style={{ fontFamily: F.is }}>
                {s.t}
              </h3>
              <p data-l className="mt-3 text-[16px] text-white/70" style={{ fontFamily: F.mr }}>
                {s.b}
              </p>
            </div>
          </div>
        ))}
      </div>
      <Sheen g1="rgba(140,170,255,.55)" />
    </Stage>
  );
}

/* ───────────────────────── X66 · Triple-panel 3D slider ───────────────────────── */
const X66_I = [
  { t: "Dune", p: "₹ 5,400", i: 0 },
  { t: "Kelp", p: "₹ 4,800", i: 1 },
  { t: "Ember", p: "₹ 6,200", i: 2 },
  { t: "Frost", p: "₹ 5,900", i: 3 },
  { t: "Moss", p: "₹ 4,400", i: 1 },
];
const x66Slot = (o: number) => {
  const c = Math.max(-2, Math.min(2, o));
  const s = Math.sign(c);
  if (c === 0) return { xPercent: 0, rotationY: 0, scale: 1, z: 0, autoAlpha: 1, sh: 0, zi: 3 };
  if (Math.abs(c) === 1) return { xPercent: 104 * s, rotationY: -38 * s, scale: 0.84, z: -160, autoAlpha: 1, sh: 0.45, zi: 2 };
  return { xPercent: 190 * s, rotationY: -60 * s, scale: 0.7, z: -320, autoAlpha: 0, sh: 0.6, zi: 1 };
};
const x66Css = (o: number): CSSProperties => {
  const v = x66Slot(o);
  return { transform: `translateX(${v.xPercent}%) translateZ(${v.z}px) rotateY(${v.rotationY}deg) scale(${v.scale})`, visibility: v.autoAlpha ? "visible" : "hidden", zIndex: v.zi };
};
function X66() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const inn = innerOf(el);
    const items = q(".x66-i");
    const shades = q(".x66-sh");
    const dot = q(".b13g4x-dot")[0];
    const next = mid(q(".x66-next")[0], inn);
    const prev = mid(q(".x66-prev")[0], inn);
    const put = (cur: number) =>
      items.forEach((it, k) => {
        const { sh, zi, ...v } = x66Slot(k - cur);
        gsap.set(it, { ...v, zIndex: zi });
        gsap.set(shades[k], { opacity: sh });
      });
    put(1);
    gsap.set(dot, { x: next.x, y: next.y, opacity: 1 });
    const tl = gsap.timeline({ repeat: -1 });
    let cur = 1;
    [2, 3, 2, 1].forEach((to, s) => {
      tap(tl, dot, to > cur ? next : prev, 0.3);
      const L = `s${s}`;
      tl.addLabel(L);
      items.forEach((it, k) => {
        const { sh, zi, ...v } = x66Slot(k - to);
        tl.set(it, { zIndex: zi }, L)
          .to(it, { ...v, duration: 0.9, ease: "power2.inOut" }, L)
          .to(shades[k], { opacity: sh, duration: 0.9, ease: "power2.inOut" }, L);
      });
      hold(tl, 0.2);
      cur = to;
    });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,190,140,.5)" g2="rgba(120,160,255,.22)">
      <p className="absolute left-[4%] top-[6%] text-[13px] uppercase tracking-[0.24em] text-white/60" style={{ fontFamily: F.mr }}>
        Fennow Rugs · hand-knotted
      </p>
      <div className="absolute inset-0" style={{ perspective: "1400px" }}>
        {X66_I.map((it, k) => (
          <div key={it.t + k} className="x66-i absolute left-[33%] top-[12%] h-[64%] w-[34%] overflow-hidden rounded-[22px]" style={x66Css(k - 1)}>
            <Img i={it.i} w={800} h={900} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-[6%] left-[7%] right-[7%] flex items-end justify-between">
              <span className="text-[clamp(30px,2.8vw,46px)] leading-none" style={{ fontFamily: F.fr }}>
                {it.t}
              </span>
              <span className="text-[15px] tabular-nums text-white/80" style={{ fontFamily: F.sg }}>
                {it.p}
              </span>
            </div>
            <div className="x66-sh absolute inset-0 bg-black" style={{ opacity: k === 1 ? 0 : 0.45 }} />
          </div>
        ))}
      </div>
      <div className="absolute bottom-[7%] left-0 right-0 z-10 flex items-center justify-center gap-4" style={{ fontFamily: F.sg }}>
        <span className="x66-prev flex h-12 w-12 items-center justify-center rounded-full border border-white/30 text-[18px]">←</span>
        <span className="x66-next flex h-12 w-12 items-center justify-center rounded-full border border-white/30 text-[18px]">→</span>
      </div>
      <Dot />
      <Sheen />
    </Stage>
  );
}

/* ───────────────────────── X67 · Tiles merge into one image ───────────────────────── */
const X67_R = [
  { t: "Ember", n: "Vases", i: 2 },
  { t: "Tidal", n: "Lamps", i: 1 },
  { t: "Quarry", n: "Stools", i: 3 },
];
const X67_PICK = 1;
const QUAD = ["0% 0%", "100% 0%", "0% 100%", "100% 100%"];
function X67() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(
    root,
    (el) => {
      const q = gsap.utils.selector(el);
      const inn = innerOf(el);
      const rows = q(".x67-row");
      const pick = Array.from(rows[X67_PICK].querySelectorAll<HTMLElement>(".x67-tile"));
      const others = rows.filter((_, k) => k !== X67_PICK).flatMap((r) => Array.from(r.querySelectorAll(".x67-tile")));
      const slots = q(".x67-slot");
      const dot = q(".b13g4x-dot")[0];
      const cap = q(".x67-cap");
      const back = q(".x67-back")[0];
      const vars = pick.map((t, k) => fit(t, slots[k]));
      const split = SplitText.create(q(".x67-t"), { type: "chars", mask: "chars" });
      const pRow = mid(rows[X67_PICK].querySelector(".x67-t")!, inn);
      const pBack = mid(back, inn);
      gsap.set(dot, { x: pRow.x, y: pRow.y + 60, opacity: 1 });
      const open = gsap.timeline({ paused: true });
      open
        .to(split.chars, { xPercent: -100, duration: 0.5, ease: "power2.in", stagger: 0.012 }, 0)
        .to(others, { opacity: 0, scale: 0.6, duration: 0.4, stagger: 0.02, ease: "power2.in" }, 0);
      pick.forEach((t, k) => open.to(t, { ...vars[k], borderRadius: 0, duration: 0.95, ease: "power2.inOut" }, 0.15 + k * 0.07));
      open.set(back, { visibility: "visible" }, 0.6).fromTo(cap.concat(back), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.06, ease: "power2.out" }, 0.75);
      const D = open.duration();
      const tl = gsap.timeline({ repeat: -1 });
      tap(tl, dot, pRow, 0.35);
      tl.add(open.tweenFromTo(0, D));
      hold(tl, 0.3);
      tap(tl, dot, pBack, 0.35);
      tl.add(open.tweenFromTo(D, 0));
      tl.to(dot, { x: pRow.x, y: pRow.y + 60, duration: 0.3, ease: "power2.inOut" });
      return tl;
    },
    getFlip,
  );
  return (
    <Stage r={root} g1="rgba(255,200,140,.5)">
      <p className="absolute left-[5%] top-[8%] text-[13px] uppercase tracking-[0.24em] text-white/60" style={{ fontFamily: F.mr }}>
        Calder Glassworks · series
      </p>
      <div className="absolute left-[5%] top-[22%] z-10 flex flex-col gap-[4vh]">
        {X67_R.map((r) => (
          <div key={r.t} className="x67-row flex items-center gap-8">
            <h4 className="x67-t w-[5.2em] text-[clamp(44px,4.4vw,72px)] leading-none" style={{ fontFamily: F.fr }}>
              {r.t}
            </h4>
            <div className="flex gap-2">
              {QUAD.map((qd) => (
                <div key={qd} className="relative h-[56px] w-[56px]">
                  <div className="x67-tile absolute left-0 top-0 h-full w-full rounded-[8px]" style={{ backgroundImage: `url(${scene(r.i, 900, 900)})`, backgroundSize: "200% 200%", backgroundPosition: qd }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="absolute right-[5%] top-[10%] grid h-[80%] w-[42%] grid-cols-2 grid-rows-2" style={HID} aria-hidden>
        {QUAD.map((qd) => (
          <div key={qd} className="x67-slot" />
        ))}
      </div>
      <span className="x67-back absolute left-[5%] top-[14%] z-20 text-[14px] text-white/75" style={{ fontFamily: F.mr, ...HID }}>
        ← All series
      </span>
      <div className="absolute bottom-[10%] left-[5%] z-20">
        <h3 className="x67-cap text-[clamp(48px,5vw,82px)] leading-none" style={{ fontFamily: F.is, opacity: 0 }}>
          Tidal lamps
        </h3>
        <p className="x67-cap mt-3 text-[16px] text-white/65" style={{ fontFamily: F.mr, opacity: 0 }}>
          Hand-blown glass, 9 pieces · from ₹ 6,800
        </p>
      </div>
      <Dot />
      <Sheen />
    </Stage>
  );
}

/* ───────────────────────── X68 · Thumb stack to horizontal line ───────────────────────── */
const X68_ROWS = ["Field studies", "Studio archive", "Commissions"];
const X68_PICK = 1;
const X68_SC = [
  { x: -8, y: 6, r: -9, i: 0 },
  { x: 9, y: -6, r: 7, i: 1 },
  { x: -4, y: -10, r: -3, i: 2 },
  { x: 11, y: 7, r: 11, i: 3 },
  { x: 0, y: 0, r: -1, i: 1 },
];
const X68_CAP = ["Kiln, 2019", "Bench, 2021", "Weir, 2022", "Loft, 2024", "Yard, 2025"];
function X68() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(
    root,
    (el) => {
      const q = gsap.utils.selector(el);
      const inn = innerOf(el);
      const thumbs = q(".x68-th");
      const slots = q(".x68-slot");
      const circ = q(".x68-circ")[0];
      const rows = q(".x68-row");
      const caps = q(".x68-cap");
      const dot = q(".b13g4x-dot")[0];
      gsap.set(thumbs, { x: 0, y: 0, rotation: 0 });
      const vars = thumbs.map((t, k) => fit(t, slots[k]));
      thumbs.forEach((t, k) => gsap.set(t, { x: X68_SC[k].x, y: X68_SC[k].y, rotation: X68_SC[k].r }));
      const pRow = mid(rows[X68_PICK], inn);
      const pOut = { x: inn.offsetWidth * 0.5, y: inn.offsetHeight * 0.18 };
      gsap.set(dot, { x: pRow.x, y: pRow.y + 50, opacity: 1 });
      const open = gsap.timeline({ paused: true });
      open
        .to(rows.filter((_, k) => k !== X68_PICK), { opacity: 0.2, duration: 0.4 }, 0)
        .to(rows[X68_PICK], { color: "#ffd59a", duration: 0.4 }, 0)
        .to(circ, { scale: 3, opacity: 0.55, duration: 0.9, ease: "power2.inOut" }, 0);
      thumbs.forEach((t, k) => open.to(t, { ...vars[k], rotation: 0, borderRadius: 14, duration: 0.95, ease: "power2.inOut" }, 0.08 + k * 0.05));
      open.fromTo(caps, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, stagger: 0.05, ease: "power2.out" }, 0.85);
      const D = open.duration();
      const tl = gsap.timeline({ repeat: -1 });
      tap(tl, dot, pRow, 0.35);
      tl.add(open.tweenFromTo(0, D));
      hold(tl, 0.3);
      tap(tl, dot, pOut, 0.35);
      tl.add(open.tweenFromTo(D, 0));
      tl.to(dot, { x: pRow.x, y: pRow.y + 50, duration: 0.3, ease: "power2.inOut" });
      return tl;
    },
    getFlip,
  );
  return (
    <Stage r={root} g1="rgba(255,213,154,.5)" g2="rgba(255,120,150,.2)">
      <div className="absolute left-[5%] top-[9%] z-10 flex flex-col gap-3">
        {X68_ROWS.map((r, k) => (
          <div key={r} className="flex items-center gap-10">
            <span className="x68-row text-[clamp(36px,3.6vw,58px)] leading-[1.05]" style={{ fontFamily: F.sy, fontWeight: 600 }}>
              {r}
            </span>
            {k === X68_PICK && (
              <div className="relative h-[120px] w-[96px]">
                <div className="x68-circ absolute left-1/2 top-1/2 -ml-[80px] -mt-[80px] h-[160px] w-[160px] rounded-full bg-[#ffd59a]" style={{ opacity: 0.18 }} aria-hidden />
                {X68_SC.map((s, j) => (
                  <div key={j} className="x68-th absolute left-0 top-0 h-full w-full overflow-hidden rounded-[10px] border border-white/15 shadow-[0_10px_30px_rgba(0,0,0,.4)]" style={{ transform: `translate(${s.x}px,${s.y}px) rotate(${s.r}deg)` }}>
                    <Img i={s.i} w={400} h={500} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="absolute bottom-[8%] left-[5%] right-[5%] top-[50%] flex gap-[2%]" aria-hidden>
        {X68_CAP.map((c) => (
          <div key={c} className="relative flex-1">
            <div className="x68-slot absolute inset-x-0 top-0 bottom-[34px]" />
            <span className="x68-cap absolute bottom-0 left-0 text-[13px] text-white/70" style={{ fontFamily: F.mr, opacity: 0 }}>
              {c}
            </span>
          </div>
        ))}
      </div>
      <Dot />
      <Sheen />
    </Stage>
  );
}

/* ───────────────────────── X69 · Double slideshow, opposite travel ───────────────────────── */
const X69_S = [
  { t: "Highland", i: 0, j: 2 },
  { t: "Coastline", i: 3, j: 1 },
];
function X69() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const bg = q(".x69-bg");
    const fg = q(".x69-fg");
    const bgi = q(".x69-bgi");
    const fgi = q(".x69-fgi");
    const titles = q(".x69-t");
    const num = q(".x69-n")[0];
    const chars = titles.map((t) => SplitText.create(t, { type: "chars", mask: "lines" }).chars);
    gsap.set([bg[1], fg[1], titles[1]], { autoAlpha: 1 });
    gsap.set(bg[1], { xPercent: 100 });
    gsap.set(fg[1], { xPercent: -100 });
    gsap.set(chars[1], { yPercent: 110 });
    const tl = gsap.timeline({ repeat: -1 });
    const E = "power2.inOut";
    const half = (a: number, b: number, d: 1 | -1) => {
      const t0 = tl.duration();
      tl.call(() => {
        num.textContent = `0${b + 1} / 02`;
      }, [], t0)
        .set(bg[b], { xPercent: 100 * d }, t0)
        .set(fg[b], { xPercent: -100 * d }, t0)
        .to(bg[a], { xPercent: -100 * d, duration: 1.2, ease: E }, t0)
        .to(bg[b], { xPercent: 0, duration: 1.2, ease: E }, t0)
        .to(fg[a], { xPercent: 100 * d, duration: 1.2, ease: E }, t0)
        .to(fg[b], { xPercent: 0, duration: 1.2, ease: E }, t0)
        .to([bgi[a], bgi[b]], { rotation: -15 * d, scaleY: 2.8, duration: 0.6, ease: "power2.in" }, t0)
        .to([bgi[a], bgi[b]], { rotation: 0, scaleY: 1, duration: 0.6, ease: "power2.out" }, t0 + 0.6)
        .to([fgi[a], fgi[b]], { rotation: 15 * d, scaleY: 2.8, duration: 0.6, ease: "power2.in" }, t0)
        .to([fgi[a], fgi[b]], { rotation: 0, scaleY: 1, duration: 0.6, ease: "power2.out" }, t0 + 0.6)
        .to(chars[a], { yPercent: -110, rotation: -14, duration: 0.5, stagger: 0.025, ease: "power2.in" }, t0)
        .fromTo(chars[b], { yPercent: 110, rotation: 14 }, { yPercent: 0, rotation: 0, duration: 0.6, stagger: 0.03, ease: "power2.out", immediateRender: false }, t0 + 0.55);
      hold(tl, 0.25);
    };
    half(0, 1, 1);
    half(1, 0, -1);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,213,154,.5)">
      <div className="absolute inset-0 overflow-hidden">
        {X69_S.map((s, k) => (
          <div key={s.t} className="x69-bg absolute inset-0 overflow-hidden" style={k ? HID : undefined}>
            <div className="x69-bgi absolute inset-0">
              <Img i={s.i} w={1400} h={900} />
            </div>
            <div className="absolute inset-0 bg-black/45" />
          </div>
        ))}
      </div>
      <div className="absolute right-[9%] top-[13%] h-[74%] w-[28%] overflow-hidden rounded-[18px] border border-white/20 shadow-[0_30px_80px_rgba(0,0,0,.5)]">
        {X69_S.map((s, k) => (
          <div key={s.t} className="x69-fg absolute inset-0 overflow-hidden" style={k ? HID : undefined}>
            <div className="x69-fgi absolute inset-0">
              <Img i={s.j} w={700} h={900} />
            </div>
          </div>
        ))}
      </div>
      <p className="absolute left-[6%] top-[8%] text-[13px] uppercase tracking-[0.24em] text-white/70" style={{ fontFamily: F.mr }}>
        Ostrel Outfitters · trail guide
      </p>
      <div className="absolute bottom-[14%] left-[6%] h-[1.1em] w-[52%] text-[clamp(56px,6.2vw,104px)] leading-none" style={{ fontFamily: F.sy, fontWeight: 700 }}>
        {X69_S.map((s, k) => (
          <h3 key={s.t} className="x69-t absolute left-0 top-0 whitespace-nowrap uppercase" style={k ? HID : undefined}>
            {s.t}
          </h3>
        ))}
      </div>
      <p className="x69-n absolute bottom-[8%] left-[6%] text-[14px] tabular-nums text-white/70" style={{ fontFamily: F.sg }}>
        01 / 02
      </p>
      <Sheen />
    </Stage>
  );
}

/* ───────────────────────── X70 · Button morphs into a panel ───────────────────────── */
function X70() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(
    root,
    (el) => {
      const q = gsap.utils.selector(el);
      const inn = innerOf(el);
      const btn = q(".x70-btn")[0];
      const lbl = q(".x70-lbl")[0];
      const slot = q(".x70-slot")[0];
      const pc = q(".x70-pc")[0];
      const lines = q(".x70-pl");
      const dim = q(".x70-dim")[0];
      const dot = q(".b13g4x-dot")[0];
      const v = fit(btn, slot);
      const pBtn = mid(btn, inn);
      const pX = mid(q(".x70-x")[0], inn);
      gsap.set(dot, { x: pBtn.x + 60, y: pBtn.y + 70, opacity: 1 });
      const open = gsap.timeline({ paused: true });
      open
        .to(lbl, { opacity: 0, duration: 0.15 }, 0)
        .to(dim, { opacity: 0.6, duration: 0.5 }, 0)
        .to(btn, { ...v, borderRadius: 26, backgroundColor: "#1d1712", duration: 0.7, ease: "power2.inOut" }, 0.05)
        .set(pc, { visibility: "visible" }, 0.55)
        .fromTo(lines, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, stagger: 0.05, ease: "power2.out" }, 0.55);
      const D = open.duration();
      const tl = gsap.timeline({ repeat: -1 });
      tap(tl, dot, pBtn, 0.35);
      tl.add(open.tweenFromTo(0, D));
      hold(tl, 0.3);
      tap(tl, dot, pX, 0.35);
      tl.add(open.tweenFromTo(D, 0));
      tl.to(dot, { x: pBtn.x + 60, y: pBtn.y + 70, duration: 0.3, ease: "power2.inOut" });
      return tl;
    },
    getFlip,
  );
  return (
    <Stage r={root} g1="rgba(255,170,120,.5)">
      <div className="absolute inset-0 bg-[#120d0a]">
        <div className="absolute inset-0" style={{ background: "radial-gradient(55% 65% at 76% 50%, #ffb07a22, transparent 70%)" }} />
        <div className="absolute inset-x-[5%] top-[7%] flex justify-between text-[13px] uppercase tracking-[0.22em] text-white/60" style={{ fontFamily: F.mr }}>
          <span className="font-[700] text-white">Sable Kitchen</span>
          <span>Menu · Wine · Visit</span>
        </div>
        <div className="absolute left-[5%] top-[26%] w-[44%]">
          <p className="text-[13px] uppercase tracking-[0.22em] text-[#ffb07a]" style={{ fontFamily: F.mr }}>
            Fridays · 8 pm
          </p>
          <h3 className="mt-3 text-[clamp(48px,5vw,84px)] leading-[0.95]" style={{ fontFamily: F.fr }}>
            Supper club by the fire
          </h3>
          <p className="mt-4 text-[16px] text-white/60" style={{ fontFamily: F.mr }}>
            Seven courses, one long table, ₹ 2,400 a guest.
          </p>
          <div className="relative z-20 mt-8 h-[58px] w-[230px]">
            <div className="x70-btn absolute left-0 top-0 h-full w-full bg-[#ffb07a]" style={{ borderRadius: 29 }}>
              <span className="x70-lbl absolute inset-0 flex items-center justify-center text-[15px] font-[600] text-[#1a0f08]" style={{ fontFamily: F.sg }}>
                Reserve a table
              </span>
            </div>
          </div>
        </div>
        <div className="absolute right-[5%] top-[22%] h-[64%] w-[40%] overflow-hidden rounded-[22px]">
          <Img i={2} w={900} h={800} />
        </div>
      </div>
      <div className="x70-dim pointer-events-none absolute inset-0 z-10 bg-black" style={{ opacity: 0 }} />
      <div className="x70-slot absolute left-[27%] top-[13%] h-[74%] w-[46%]" style={HID} aria-hidden />
      <div className="x70-pc absolute left-[27%] top-[13%] z-30 flex h-[74%] w-[46%] flex-col gap-4 p-[3%]" style={{ fontFamily: F.mr, ...HID }}>
        <div className="x70-pl flex items-start justify-between">
          <h4 className="text-[clamp(32px,3vw,48px)] leading-none" style={{ fontFamily: F.fr }}>
            Reserve a table
          </h4>
          <span className="x70-x flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-[16px]">✕</span>
        </div>
        <p className="x70-pl text-[15px] text-white/60">Friday supper club · seven courses</p>
        <div className="x70-pl grid grid-cols-2 gap-3">
          <div className="rounded-[14px] border border-white/15 px-4 py-3 text-[14px]">
            <span className="block text-[12px] uppercase tracking-[0.16em] text-white/45">Date</span>Fri, 14 Nov
          </div>
          <div className="rounded-[14px] border border-white/15 px-4 py-3 text-[14px]">
            <span className="block text-[12px] uppercase tracking-[0.16em] text-white/45">Guests</span>2 people
          </div>
        </div>
        <div className="x70-pl mt-auto flex items-center justify-between">
          <span className="text-[20px] tabular-nums" style={{ fontFamily: F.sg }}>
            ₹ 4,800
          </span>
          <span className="rounded-full bg-[#ffb07a] px-6 py-3 text-[14px] font-[600] text-[#1a0f08]" style={{ fontFamily: F.sg }}>
            Confirm
          </span>
        </div>
      </div>
      <Dot />
      <Sheen />
    </Stage>
  );
}

/* ───────────────────────── X71 · Card morphs into a centred dialog ───────────────────────── */
const X71_C = [
  { t: "Walnut desk", p: "₹ 38,000", i: 0 },
  { t: "Oak lounge chair", p: "₹ 24,500", i: 2 },
  { t: "Ash side table", p: "₹ 9,800", i: 3 },
];
const X71_PICK = 1;
function X71() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(
    root,
    (el) => {
      const q = gsap.utils.selector(el);
      const inn = innerOf(el);
      const cards = q(".x71-card");
      const card = cards[X71_PICK];
      const ci = q(".x71-ci")[X71_PICK];
      const ct = q(".x71-ct")[X71_PICK] as HTMLElement;
      const df = q(".x71-df")[0] as HTMLElement;
      const di = q(".x71-di")[0] as HTMLElement;
      const dt = q(".x71-dt")[0] as HTMLElement;
      const db = q(".x71-db");
      const dim = q(".x71-dim")[0];
      const dot = q(".b13g4x-dot")[0];
      const vF = fit(df, card);
      const vI = fit(di, ci);
      const T = rel(ct, inn);
      const Dt = rel(dt, inn);
      const s = parseFloat(getComputedStyle(ct).fontSize) / parseFloat(getComputedStyle(dt).fontSize);
      gsap.set(dt, { transformOrigin: "0 0" });
      const pCard = mid(card, inn);
      const pX = mid(q(".x71-x")[0], inn);
      gsap.set(dot, { x: pCard.x + 40, y: pCard.y + 90, opacity: 1 });
      const E = "power2.inOut";
      const open = gsap.timeline({ paused: true });
      open
        .set([df, di, dt], { visibility: "visible" }, 0.001)
        .set(card, { opacity: 0 }, 0.001)
        .fromTo(df, { ...vF, borderRadius: 20 }, { ...natural(df), borderRadius: 28, duration: 0.6, ease: E }, 0)
        .fromTo(di, { ...vI, borderRadius: "20px 20px 0px 0px" }, { ...natural(di), borderRadius: "28px 0px 0px 28px", duration: 0.6, ease: E }, 0)
        .fromTo(dt, { x: T.x - Dt.x, y: T.y - Dt.y, scale: s }, { x: 0, y: 0, scale: 1, duration: 0.6, ease: E }, 0)
        .to(dim, { opacity: 0.6, duration: 0.5 }, 0)
        .to(cards.filter((c) => c !== card), { scale: 0.96, duration: 0.6, ease: E }, 0)
        .fromTo(db, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, stagger: 0.05, ease: "power2.out" }, 0.4);
      const D = open.duration();
      const tl = gsap.timeline({ repeat: -1 });
      tap(tl, dot, pCard, 0.35);
      tl.add(open.tweenFromTo(0, D));
      hold(tl, 0.3);
      tap(tl, dot, pX, 0.35);
      tl.add(open.tweenFromTo(D, 0));
      tl.to(dot, { x: pCard.x + 40, y: pCard.y + 90, duration: 0.3, ease: "power2.inOut" });
      return tl;
    },
    getFlip,
  );
  return (
    <Stage r={root} g1="rgba(255,213,154,.5)">
      <h3 className="absolute left-[5%] top-[7%] text-[clamp(36px,3.4vw,56px)] leading-none" style={{ fontFamily: F.is }}>
        This season&apos;s pieces
      </h3>
      <p className="absolute right-[5%] top-[9%] text-[13px] uppercase tracking-[0.22em] text-white/55" style={{ fontFamily: F.mr }}>
        Harrow Joinery
      </p>
      <div className="absolute inset-x-[5%] bottom-[7%] top-[24%] flex gap-[3%]">
        {X71_C.map((c) => (
          <div key={c.t} className="x71-card relative flex flex-1 flex-col overflow-hidden rounded-[20px] bg-[#1b1611]">
            <div className="x71-ci h-[64%] overflow-hidden rounded-t-[20px]">
              <Img i={c.i} w={700} h={600} />
            </div>
            <div className="flex flex-1 flex-col justify-center gap-2 px-[7%]">
              <span className="x71-ct self-start text-[26px] leading-none" style={{ fontFamily: F.fr }}>
                {c.t}
              </span>
              <span className="text-[15px] tabular-nums text-white/60" style={{ fontFamily: F.sg }}>
                {c.p}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="x71-dim pointer-events-none absolute inset-0 z-10 bg-black" style={{ opacity: 0 }} />
      <div className="x71-df absolute left-[16%] top-[9%] z-20 h-[82%] w-[68%] rounded-[28px] bg-[#1b1611]" style={HID} />
      <div className="x71-di absolute left-[16%] top-[9%] z-20 h-[82%] w-[32%] overflow-hidden" style={{ borderRadius: "28px 0 0 28px", ...HID }}>
        <Img i={X71_C[X71_PICK].i} w={700} h={800} />
      </div>
      <span className="x71-dt absolute left-[51%] top-[16%] z-20 text-[54px] leading-none" style={{ fontFamily: F.fr, ...HID }}>
        {X71_C[X71_PICK].t}
      </span>
      <div className="absolute left-[51%] right-[19%] top-[30%] z-20 flex flex-col gap-4" style={{ fontFamily: F.mr }}>
        <p className="x71-db text-[16px] leading-relaxed text-white/65" style={{ opacity: 0 }}>
          Solid white oak, steam-bent arms and a woven paper-cord seat. Made to order in eight weeks.
        </p>
        <p className="x71-db text-[14px] uppercase tracking-[0.18em] text-white/45" style={{ opacity: 0 }}>
          W 72 · D 78 · H 74 cm
        </p>
        <div className="x71-db mt-4 flex items-center gap-5" style={{ opacity: 0 }}>
          <span className="rounded-full bg-[#ffd59a] px-6 py-3 text-[14px] font-[600] text-[#1a120a]" style={{ fontFamily: F.sg }}>
            Add to bag
          </span>
          <span className="text-[20px] tabular-nums" style={{ fontFamily: F.sg }}>
            {X71_C[X71_PICK].p}
          </span>
        </div>
      </div>
      <span className="x71-x x71-db absolute right-[18%] top-[13%] z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-[16px]" style={{ opacity: 0 }}>
        ✕
      </span>
      <Dot />
      <Sheen />
    </Stage>
  );
}

/* ───────────────────────── X72 · Shared-element morph between different elements ───────────────────────── */
const X72_M = [
  { n: "Ines Corvo", c: "Ceramics · 24 pieces", i: 0 },
  { n: "Tomas Reyl", c: "Glass · 12 pieces", i: 2 },
  { n: "Aya Lindqvist", c: "Textiles · 31 pieces", i: 3 },
  { n: "Bram Okoro", c: "Wood · 18 pieces", i: 1 },
];
const X72_PICK = 1;
function X72() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(
    root,
    (el) => {
      const q = gsap.utils.selector(el);
      const inn = innerOf(el);
      const thumb = q(".x72-th")[X72_PICK] as HTMLElement;
      const hdr = q(".x72-hdr")[0] as HTMLElement;
      const aText = q(".x72-a");
      const chips = q(".x72-chip");
      const bl = q(".x72-bl");
      const back = q(".x72-back")[0];
      const dot = q(".b13g4x-dot")[0];
      const vH = fit(hdr, thumb);
      const vT = fit(thumb, hdr);
      const pChip = mid(chips[X72_PICK], inn);
      const pBack = mid(back, inn);
      gsap.set(dot, { x: pChip.x + 30, y: pChip.y + 60, opacity: 1 });
      const E = "power2.inOut";
      const open = gsap.timeline({ paused: true });
      open
        .set([hdr, back], { visibility: "visible" }, 0.001)
        .fromTo(hdr, { ...vH, borderRadius: 999, opacity: 0 }, { ...natural(hdr), borderRadius: 24, opacity: 1, duration: 0.8, ease: E }, 0)
        .to(thumb, { ...vT, borderRadius: 24, duration: 0.8, ease: E }, 0)
        .to(thumb, { opacity: 0, duration: 0.6, ease: "power1.inOut" }, 0.15)
        .to(aText, { opacity: 0, y: -18, duration: 0.35, stagger: 0.04 }, 0)
        .to(chips.filter((_, k) => k !== X72_PICK), { opacity: 0.25, duration: 0.4 }, 0)
        .fromTo(bl.concat(back), { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.06, ease: "power2.out" }, 0.55);
      const D = open.duration();
      const tl = gsap.timeline({ repeat: -1 });
      tap(tl, dot, pChip, 0.35);
      tl.add(open.tweenFromTo(0, D));
      hold(tl, 0.3);
      tap(tl, dot, pBack, 0.35);
      tl.add(open.tweenFromTo(D, 0));
      tl.to(dot, { x: pChip.x + 30, y: pChip.y + 60, duration: 0.3, ease: "power2.inOut" });
      return tl;
    },
    getFlip,
  );
  return (
    <Stage r={root} g1="rgba(255,213,154,.5)" g2="rgba(140,200,180,.2)">
      <div className="absolute left-[5%] top-[10%] z-10 flex w-[28%] flex-col gap-3" style={{ fontFamily: F.mr }}>
        <p className="text-[13px] uppercase tracking-[0.22em] text-white/55">Makers</p>
        {X72_M.map((m) => (
          <div key={m.n} className="x72-chip flex items-center gap-4 rounded-full border border-white/12 bg-white/[0.04] py-2 pl-2 pr-5">
            <div className="relative h-[52px] w-[52px] shrink-0">
              <div className="x72-th absolute left-0 top-0 h-full w-full overflow-hidden rounded-full">
                <Img i={m.i} w={500} h={400} />
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-[17px] font-[600] leading-tight">{m.n}</p>
              <p className="text-[13px] text-white/55">{m.c}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute left-[40%] right-[5%] top-[18%]">
        <h3 className="x72-a text-[clamp(52px,5.6vw,92px)] leading-[0.92]" style={{ fontFamily: F.is }}>
          Made by hand, in small rooms
        </h3>
        <p className="x72-a mt-5 max-w-[40ch] text-[16px] text-white/60" style={{ fontFamily: F.mr }}>
          Four makers, one market. Pick a studio to see the work.
        </p>
      </div>
      <div className="x72-hdr absolute left-[38%] right-[5%] top-[8%] z-20 h-[58%] overflow-hidden rounded-[24px]" style={HID}>
        <Img i={X72_M[X72_PICK].i} w={1000} h={700} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
        <div className="absolute bottom-[8%] left-[6%]">
          <p className="text-[13px] uppercase tracking-[0.22em] text-white/75" style={{ fontFamily: F.mr }}>
            Studio · Glass
          </p>
          <p className="mt-2 text-[clamp(44px,4.4vw,72px)] leading-none" style={{ fontFamily: F.fr }}>
            {X72_M[X72_PICK].n}
          </p>
        </div>
      </div>
      <span className="x72-back absolute left-[38%] top-[2.5%] z-20 text-[13px] text-white/75" style={{ fontFamily: F.mr, ...HID }}>
        ← All makers
      </span>
      <div className="absolute bottom-[8%] left-[38%] right-[5%] z-20 flex items-end justify-between gap-6" style={{ fontFamily: F.mr }}>
        <p className="x72-bl max-w-[44ch] text-[16px] leading-relaxed text-white/65" style={{ opacity: 0 }}>
          Mouth-blown vessels in smoke, moss and amber, each one signed on the base.
        </p>
        <span className="x72-bl shrink-0 text-[20px] tabular-nums" style={{ fontFamily: F.sg, opacity: 0 }}>
          from ₹ 3,900
        </span>
      </div>
      <Dot />
      <Sheen />
    </Stage>
  );
}

/* ───────────────────────── X73 · Device frame morph ───────────────────────── */
const X73_M = [
  { n: "Desktop · 1440", w: 0.56, h: 0.6, r: 16, p: 12, stand: 1, base: 0 },
  { n: "Laptop · 1280", w: 0.5, h: 0.54, r: 14, p: 10, stand: 0, base: 1 },
  { n: "Tablet · 834", w: 0.3, h: 0.72, r: 30, p: 16, stand: 0, base: 0 },
  { n: "Phone · 390", w: 0.165, h: 0.74, r: 38, p: 9, stand: 0, base: 0 },
];
const Blk = ({ c = "bg-white/12", className = "" }: { c?: string; className?: string }) => <div data-b className={`rounded-[6px] ${c} ${className}`} />;
const X73_ACC = "bg-[#ffd59a]";
function X73Layouts() {
  const img = (i: number, cls: string) => (
    <div data-b className={`overflow-hidden rounded-[8px] ${cls}`}>
      <Img i={i} w={600} h={400} />
    </div>
  );
  return (
    <>
      <div className="x73-l absolute inset-0 flex flex-col gap-[5%] p-[5%]">
        <div className="flex h-[6%] items-center justify-between">
          <Blk c={X73_ACC} className="h-full w-[14%]" />
          <Blk className="h-[60%] w-[34%]" />
        </div>
        <div className="flex h-[48%] gap-[4%]">
          <div className="flex w-[44%] flex-col justify-center gap-[10%]">
            <Blk c="bg-white/80" className="h-[16%] w-[90%]" />
            <Blk c="bg-white/80" className="h-[16%] w-[70%]" />
            <Blk className="h-[8%] w-[60%]" />
            <Blk c={X73_ACC} className="h-[14%] w-[34%]" />
          </div>
          {img(2, "flex-1")}
        </div>
        <div className="flex flex-1 gap-[3%]">
          {img(0, "flex-1")}
          {img(1, "flex-1")}
          {img(3, "flex-1")}
        </div>
      </div>
      <div className="x73-l absolute inset-0 flex flex-col gap-[5%] p-[5%]" style={HID}>
        <div className="flex h-[7%] items-center justify-between">
          <Blk c={X73_ACC} className="h-full w-[16%]" />
          <Blk className="h-[60%] w-[30%]" />
        </div>
        <div className="relative h-[52%] overflow-hidden rounded-[8px]">
          {img(2, "absolute inset-0")}
          <Blk c="bg-white/85" className="absolute bottom-[14%] left-[6%] h-[12%] w-[46%]" />
        </div>
        <div className="flex flex-1 gap-[4%]">
          {img(0, "flex-1")}
          {img(3, "flex-1")}
        </div>
      </div>
      <div className="x73-l absolute inset-0 flex flex-col gap-[4%] p-[7%]" style={HID}>
        <div className="flex h-[4%] items-center justify-between">
          <Blk c={X73_ACC} className="h-full w-[26%]" />
          <Blk className="h-full w-[12%]" />
        </div>
        {img(2, "h-[36%]")}
        <Blk c="bg-white/80" className="h-[4%] w-[86%]" />
        <Blk c="bg-white/80" className="h-[4%] w-[60%]" />
        <div className="flex flex-1 gap-[5%]">
          {img(0, "flex-1")}
          {img(1, "flex-1")}
        </div>
      </div>
      <div className="x73-l absolute inset-0 flex flex-col gap-[3.5%] px-[9%] py-[12%]" style={HID}>
        <div className="flex h-[3%] items-center justify-between">
          <Blk c={X73_ACC} className="h-full w-[36%]" />
          <Blk className="h-full w-[14%]" />
        </div>
        {img(2, "h-[38%]")}
        <Blk c="bg-white/80" className="h-[4%] w-[92%]" />
        <Blk c="bg-white/80" className="h-[4%] w-[64%]" />
        <Blk c={X73_ACC} className="h-[6%] w-full rounded-full" />
        {img(0, "flex-1")}
      </div>
    </>
  );
}
function X73() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const inn = innerOf(el);
    const dev = q(".x73-dev")[0];
    const scr = q(".x73-scr")[0];
    const stand = q(".x73-stand")[0];
    const base = q(".x73-base")[0];
    const layouts = q(".x73-l");
    const blocks = layouts.map((l) => Array.from(l.querySelectorAll("[data-b]")));
    const tag = q(".x73-tag")[0];
    const W = inn.offsetWidth;
    const H = inn.offsetHeight;
    const geo = (m: (typeof X73_M)[number]): V => ({ width: W * m.w, height: H * m.h, borderRadius: m.r, padding: m.p });
    gsap.set(dev, { xPercent: -50, yPercent: -50, ...geo(X73_M[0]) });
    const tl = gsap.timeline({ repeat: -1 });
    const E = "power2.inOut";
    [1, 2, 3, 0].forEach((m, s) => {
      const prev = (m + 3) % 4;
      const M = X73_M[m];
      const L = `m${s}`;
      tl.addLabel(L)
        .call(() => {
          tag.textContent = M.n;
        }, [], L)
        .to(blocks[prev], { opacity: 0, y: -10, duration: 0.3, stagger: 0.025, ease: "power2.in" }, L)
        .to(dev, { ...geo(M), duration: 1, ease: E }, L)
        .to(scr, { borderRadius: Math.max(4, M.r - M.p), duration: 1, ease: E }, L)
        .to(stand, { opacity: M.stand, duration: 0.5 }, L)
        .to(base, { opacity: M.base, duration: 0.5 }, `${L}+=0.3`)
        .set(layouts[prev], { autoAlpha: 0 }, `${L}+=0.5`)
        .set(layouts[m], { autoAlpha: 1 }, `${L}+=0.5`)
        .fromTo(blocks[m], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: "power2.out", immediateRender: false }, `${L}+=0.55`);
      hold(tl, 0.2);
    });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,213,154,.5)" g2="rgba(120,160,255,.24)">
      <p className="absolute left-[4%] top-[6%] text-[13px] uppercase tracking-[0.24em] text-white/60" style={{ fontFamily: F.mr }}>
        Pell Studio · responsive build
      </p>
      <span className="x73-tag absolute right-[4%] top-[5%] rounded-full border border-white/20 px-4 py-2 text-[14px] tabular-nums" style={{ fontFamily: F.sg }}>
        Desktop · 1440
      </span>
      <div className="x73-dev absolute left-1/2 top-[47%] border border-white/15 bg-[#141418] shadow-[0_30px_80px_rgba(0,0,0,.55)]" style={{ width: "56%", height: "60%", padding: 12, borderRadius: 16, transform: "translate(-50%,-50%)" }}>
        <div className="x73-scr relative h-full w-full overflow-hidden bg-[#1d1813]" style={{ borderRadius: 6 }}>
          <X73Layouts />
        </div>
        <div className="x73-stand absolute left-[42%] right-[42%] top-full h-[36px] rounded-b-[6px] bg-[#2b2b31]" aria-hidden />
        <div className="x73-base absolute left-[-7%] right-[-7%] top-full h-[14px] rounded-b-[14px] bg-[#2b2b31]" style={{ opacity: 0 }} aria-hidden />
      </div>
      <Sheen />
    </Stage>
  );
}

/* ───────────────────────── X74 · Excerpt opens into the article ───────────────────────── */
const X74_E = [
  { h: "Salt roads of Kutch", t: "Three days with the salt farmers before the monsoon.", i: 0 },
  { h: "The last indigo vat", t: "A dye house that still ferments its blue by hand.", i: 3 },
  { h: "Tea at altitude", t: "Notes from a 1,900 m estate at first flush.", i: 2 },
];
const X74_PICK = 1;
function X74() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(
    root,
    (el) => {
      const q = gsap.utils.selector(el);
      const inn = innerOf(el);
      const cards = q(".x74-card");
      const card = cards[X74_PICK];
      const img = q(".x74-img")[X74_PICK];
      const slot = q(".x74-hero")[0];
      const at = q(".x74-at")[0];
      const bl = q(".x74-bl");
      const head = q(".x74-head");
      const back = q(".x74-back")[0];
      const dot = q(".b13g4x-dot")[0];
      const vI = fit(img, slot);
      const hChars = SplitText.create(card.querySelector(".x74-h")!, { type: "chars", mask: "lines" }).chars;
      const aChars = SplitText.create(at, { type: "chars", mask: "lines" }).chars;
      const pCard = mid(img, inn);
      const pBack = mid(back, inn);
      gsap.set(dot, { x: pCard.x + 40, y: pCard.y + 120, opacity: 1 });
      const open = gsap.timeline({ paused: true });
      open
        .to(hChars, { yPercent: -110, duration: 0.4, stagger: 0.012, ease: "power2.in" }, 0)
        .to(card.querySelectorAll(".x74-ex"), { opacity: 0, duration: 0.3 }, 0)
        .to(cards.filter((c) => c !== card), { opacity: 0, y: 24, duration: 0.4, stagger: 0.05, ease: "power2.in" }, 0)
        .to(head, { opacity: 0, y: -16, duration: 0.35 }, 0)
        .to(img, { ...vI, borderRadius: 22, duration: 1, ease: "power2.inOut" }, 0.15)
        .set([at, back], { visibility: "visible" }, 0.6)
        .fromTo(aChars, { yPercent: 110 }, { yPercent: 0, duration: 0.55, stagger: 0.018, ease: "power2.out" }, 0.7)
        .fromTo(bl.concat(back), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.06, ease: "power2.out" }, 0.9);
      const D = open.duration();
      const tl = gsap.timeline({ repeat: -1 });
      tap(tl, dot, pCard, 0.35);
      tl.add(open.tweenFromTo(0, D));
      hold(tl, 0.3);
      tap(tl, dot, pBack, 0.35);
      tl.add(open.tweenFromTo(D, 0));
      tl.to(dot, { x: pCard.x + 40, y: pCard.y + 120, duration: 0.3, ease: "power2.inOut" });
      return tl;
    },
    getFlip,
  );
  return (
    <Stage r={root} g1="rgba(150,180,255,.5)" g2="rgba(255,213,154,.2)">
      <div className="absolute inset-x-[5%] top-[7%] flex items-end justify-between">
        <h3 className="x74-head text-[clamp(40px,3.8vw,62px)] leading-none" style={{ fontFamily: F.is }}>
          Field Notes
        </h3>
        <p className="x74-head text-[13px] uppercase tracking-[0.22em] text-white/55" style={{ fontFamily: F.mr }}>
          Journal · issue 12
        </p>
      </div>
      <div className="absolute inset-x-[5%] bottom-[8%] top-[24%] flex gap-[3%]">
        {X74_E.map((e, k) => (
          <div key={e.h} className={`x74-card relative flex flex-1 flex-col gap-4 ${k === X74_PICK ? "z-10" : ""}`}>
            <div className="relative h-[54%]">
              <div className="x74-img absolute left-0 top-0 h-full w-full overflow-hidden rounded-[14px]">
                <Img i={e.i} w={1100} h={700} />
              </div>
            </div>
            <h4 className="x74-h text-[clamp(26px,2.2vw,34px)] leading-[1.05]" style={{ fontFamily: F.fr }}>
              {e.h}
            </h4>
            <p className="x74-ex text-[15px] text-white/60" style={{ fontFamily: F.mr }}>
              {e.t}
            </p>
            <p className="x74-ex text-[13px] uppercase tracking-[0.18em] text-white/40" style={{ fontFamily: F.mr }}>
              8 min read
            </p>
          </div>
        ))}
      </div>
      <div className="x74-hero absolute left-[5%] right-[5%] top-[7%] h-[52%]" style={HID} aria-hidden />
      <span className="x74-back absolute left-[5%] top-[2.2%] z-20 text-[13px] text-white/75" style={{ fontFamily: F.mr, ...HID }}>
        ← Journal
      </span>
      <h3 className="x74-at absolute left-[5%] top-[64%] z-20 text-[clamp(52px,5.4vw,90px)] leading-none" style={{ fontFamily: F.fr, ...HID }}>
        {X74_E[X74_PICK].h}
      </h3>
      <div className="absolute bottom-[7%] left-[5%] right-[5%] z-20 flex gap-[4%]" style={{ fontFamily: F.mr }}>
        <p className="x74-bl w-[30%] text-[13px] uppercase tracking-[0.18em] text-white/50" style={{ opacity: 0 }}>
          Words by Mira Seln · Photos by Ravi Ott
        </p>
        <p className="x74-bl flex-1 text-[16px] leading-relaxed text-white/70" style={{ opacity: 0 }}>
          The vat is older than the house around it. Every morning it is fed lime, jaggery and patience, and every evening it turns cloth the colour of deep water.
        </p>
      </div>
      <Dot />
      <Sheen g1="rgba(150,180,255,.55)" />
    </Stage>
  );
}

/* ───────────────────────── X75 · Fluid filter reposition ───────────────────────── */
const X75_ALL = [
  { n: "Arc floor lamp", p: "₹ 8,900", i: 0, keep: true },
  { n: "Oak stool", p: "₹ 4,200", i: 1, keep: false },
  { n: "Dome pendant", p: "₹ 6,400", i: 2, keep: true },
  { n: "Linen throw", p: "₹ 2,900", i: 3, keep: false },
  { n: "Clay table lamp", p: "₹ 3,600", i: 3, keep: true },
  { n: "Rattan tray", p: "₹ 1,800", i: 0, keep: false },
  { n: "Brass wall light", p: "₹ 5,200", i: 1, keep: true },
  { n: "Wool rug", p: "₹ 12,500", i: 2, keep: false },
];
const X75_NEW = [
  { n: "Paper lantern", p: "₹ 2,400", i: 1 },
  { n: "Glass bedside lamp", p: "₹ 4,700", i: 2 },
];
function X75Card({ c, className = "", style }: { c: { n: string; p: string; i: number }; className?: string; style?: CSSProperties }) {
  return (
    <div className={`flex flex-col gap-2 overflow-hidden rounded-[16px] bg-[#1a1612] p-2 ${className}`} style={style}>
      <div className="min-h-0 flex-1 overflow-hidden rounded-[10px]">
        <Img i={c.i} w={600} h={500} />
      </div>
      <div className="flex items-center justify-between gap-2 px-1 pb-1 text-[14px]" style={{ fontFamily: F.mr }}>
        <span className="truncate">{c.n}</span>
        <span className="shrink-0 tabular-nums text-white/60" style={{ fontFamily: F.sg }}>
          {c.p}
        </span>
      </div>
    </div>
  );
}
function X75() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(
    root,
    (el) => {
      const q = gsap.utils.selector(el);
      const inn = innerOf(el);
      const grid = q(".x75-grid")[0];
      const cards = q(".x75-card");
      const slots = q(".x75-slot");
      const news = q(".x75-new");
      const tabs = q(".x75-tab");
      const ind = q(".x75-ind")[0];
      const dot = q(".b13g4x-dot")[0];
      const keepers = cards.filter((_, k) => X75_ALL[k].keep);
      const leavers = cards.filter((_, k) => !X75_ALL[k].keep);
      const vK = keepers.map((c, k) => fit(c, slots[k]));
      news.forEach((n, k) => {
        const r = rel(slots[4 + k], grid);
        gsap.set(n, { left: r.x, top: r.y, width: r.w, height: r.h, autoAlpha: 0, scale: 0.5 });
      });
      const tA = rel(tabs[0], tabs[0].parentElement!);
      const tB = rel(tabs[1], tabs[0].parentElement!);
      gsap.set(ind, { x: tA.x, width: tA.w });
      const pA = mid(tabs[0], inn);
      const pB = mid(tabs[1], inn);
      gsap.set(dot, { x: pA.x, y: pA.y + 40, opacity: 1 });
      const open = gsap.timeline({ paused: true });
      open
        .to(ind, { x: tB.x, width: tB.w, duration: 0.4, ease: "power2.inOut" }, 0)
        .to(tabs[1], { color: "#120d08", duration: 0.3 }, 0)
        .to(tabs[0], { color: "rgba(255,255,255,.7)", duration: 0.3 }, 0)
        .to(leavers, { scale: 0.4, opacity: 0, duration: 0.4, stagger: 0.04, ease: "power2.in" }, 0);
      keepers.forEach((c, k) => open.to(c, { ...vK[k], duration: 0.7, ease: "power2.inOut" }, 0.12 + k * 0.05));
      open.fromTo(news, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.5, stagger: 0.07, ease: "power2.out", immediateRender: false }, 0.45);
      const D = open.duration();
      const tl = gsap.timeline({ repeat: -1 });
      tap(tl, dot, pB, 0.35);
      tl.add(open.tweenFromTo(0, D));
      hold(tl, 0.3);
      tap(tl, dot, pA, 0.35);
      tl.add(open.tweenFromTo(D, 0));
      hold(tl, 0.15);
      return tl;
    },
    getFlip,
  );
  return (
    <Stage r={root} g1="rgba(255,213,154,.5)">
      <div className="absolute inset-x-[5%] top-[7%] flex items-end justify-between">
        <h3 className="text-[clamp(38px,3.6vw,58px)] leading-none" style={{ fontFamily: F.sy, fontWeight: 600 }}>
          The home shop
        </h3>
        <div className="relative flex gap-2 rounded-full border border-white/15 p-1 text-[14px] font-[600]" style={{ fontFamily: F.sg }}>
          <span className="x75-ind absolute left-0 top-1 bottom-1 w-[96px] rounded-full bg-[#ffd59a]" style={{ transform: "translateX(4px)" }} aria-hidden />
          <span className="x75-tab relative w-[96px] py-2 text-center text-[#120d08]">All</span>
          <span className="x75-tab relative w-[96px] py-2 text-center text-white/70">Lamps</span>
        </div>
      </div>
      <div className="x75-grid absolute bottom-[6%] left-[5%] right-[5%] top-[22%]">
        <div className="grid h-full w-full grid-cols-4 grid-rows-2 gap-4">
          {X75_ALL.map((c) => (
            <div key={c.n} className="relative">
              <X75Card c={c} className="x75-card absolute left-0 top-0 h-full w-full" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-4" style={HID} aria-hidden>
          {Array.from({ length: 6 }, (_, k) => (
            <div key={k} className="x75-slot" />
          ))}
        </div>
        {X75_NEW.map((c) => (
          <X75Card key={c.n} c={c} className="x75-new absolute left-0 top-0 h-0 w-0" style={HID} />
        ))}
      </div>
      <Dot />
      <Sheen />
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "X64", name: "Off-canvas page reveal styles", how: "Auto burger click, six styles in turn: the menu slides over, pushes, the page scales down and turns back in 3D, swings like a door, the menu falls down, or slides along behind (~0.5 s each way).", kind: "play", C: X64 },
  { code: "X65", name: "Flip in from deep space", how: "Auto A→B→A: the next slide flips up from rotationX 140, scale 0.1, z -1000 to face the camera (1.2 s expo.out) while the current one recedes.", kind: "play", C: X65 },
  { code: "X66", name: "Triple-panel 3D slider", how: "Auto arrow clicks: previous / current / next panels; the centre slides aside and turns back in 3D while the next panel swings in to the centre (0.9 s).", kind: "play", C: X66 },
  { code: "X67", name: "Tiles merge into one image", how: "Auto click: the row's four small tiles fly together (Flip.fit, staggered) into one full image while every title's letters slide out sideways; back reverses it.", kind: "play", C: X67 },
  { code: "X68", name: "Thumb stack to horizontal line", how: "Auto click: a messy stack of tilted thumbnails straightens out into one horizontal line of images (Flip.fit) while a circle behind scales 3×.", kind: "play", C: X68 },
  { code: "X69", name: "Double slideshow, opposite travel", how: "Auto A→B→A: the background slides one way and the framed foreground the other; inner images tilt ±15° and stretch 2.8× mid-move; title letters swap with a twist.", kind: "play", C: X69 },
  { code: "X70", name: "Button morphs into a panel", how: "Auto click: the pill button's own box grows into a booking panel (Flip.fit + radius), the form fades in after; the ✕ collapses it back into the button.", kind: "play", C: X70 },
  { code: "X71", name: "Card morphs into a centred dialog", how: "Auto click: the card's frame, image and title each morph into a centred dialog over a dimmed page (shared layout, 0.6 s soft ease); ✕ morphs it back.", kind: "play", C: X71 },
  { code: "X72", name: "Shared-element morph between different elements", how: "Auto click: a round maker chip turns into the large header card elsewhere on the page; the two cross-fade while position, size and radius morph.", kind: "play", C: X72 },
  { code: "X73", name: "Device frame morph", how: "Auto: the device frame morphs desktop → laptop → tablet → phone (size, bezel, radius) while the screen layout swaps to match with a block stagger.", kind: "play", C: X73 },
  { code: "X74", name: "Excerpt opens into the article", how: "Auto click: the excerpt's heading letters slide out, its image grows into the article header (Flip.fit), the others fade and the article title rises letter by letter.", kind: "play", C: X74 },
  { code: "X75", name: "Fluid filter reposition", how: "Auto tab switch: leaving products scale out, the kept ones slide and resize into the new 3-column grid with a stagger, and new ones scale in; switching back reverses it.", kind: "play", C: X75 },
];
