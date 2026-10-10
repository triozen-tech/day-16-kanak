"use client";

// Transition motions, batch 13 · group 5 (MOTION-MENU X76–X87). Small focused demos for /lab/motion.
// Every demo loops A → B → A between two simple "pages" while on screen (auto-advance; a fake pointer stands in for
// clicks / drags), pauses off screen, and has a CSS-only glow loop (also ON TOP of the pages) that never stops.
// ?static=1 / reduced motion: no JS motion, the markup shows page A with every page-B element and cover hidden.
// X76–X85 are layout "Flip" transitions (Flip.fit vars measured once, then a looping timeline); X86–X87 are WebGL.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import type { Flip as FlipT } from "gsap/Flip";
import { gsap, loadPlugin, prefersReducedMotion } from "@/lib/gsap";
import { createShader, type GLHandle } from "@/lib/gl";
import { scene } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = { sg: "Space Grotesk Variable", fr: "Fraunces Variable", is: "Instrument Serif", sy: "Syne Variable", mr: "Manrope Variable" };

const CSS = `
.b13g5-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(255,213,154,.5)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,143,122,.22)),transparent 70%);animation:b13g5-drift 5.4s linear infinite alternate;will-change:transform}
@keyframes b13g5-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b13g5-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4);pointer-events:none;z-index:60}
.b13g5-dot::after{content:"";position:absolute;inset:-8px;border-radius:50%;border:1.5px solid rgba(255,255,255,.7);animation:b13g5-ping 1.2s ease-out infinite}
@keyframes b13g5-ping{0%{transform:scale(.5);opacity:1}100%{transform:scale(1.8);opacity:0}}
.b13g5-c{container-type:size}
html.is-static .b13g5-glow,html.is-static .b13g5-dot::after{animation:none}
html.is-static .b13g5-dot{display:none}
html.is-static {
  .b13g5-glow,.b13g5-dot::after{animation:none}
  .b13g5-dot{display:none}
}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). Children live in `.x-in`. */
function Stage({ r, children, className = "", g1, g2, style }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string; style?: CSSProperties }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0b0a0d] text-[#f6f1ea] ${className}`} style={style}>
      <style href="b13g5-css" precedence="default">
        {CSS}
      </style>
      <div className="b13g5-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="x-in relative h-full w-full">{children}</div>
    </div>
  );
}

/** The CSS glow loop again, ON TOP of the pages (screen blend), so covered stages never read as a freeze. */
const Sheen = ({ g1 = "rgba(255,213,154,.55)" }: { g1?: string }) => (
  <div className="b13g5-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.45, zIndex: 55 } as CSSProperties} aria-hidden />
);

/** The fake pointer (hidden until a timeline moves it; hidden in static). */
const Dot = ({ c }: { c: string }) => <div className={`b13g5-dot ${c}`} style={{ opacity: 0 }} aria-hidden />;

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

type Box = { x: number; y: number; w: number; h: number };
/** An element's box relative to another element (call in the untransformed base state). */
function rel(node: Element, root: Element): Box {
  const a = node.getBoundingClientRect();
  const r = root.getBoundingClientRect();
  return { x: a.left - r.left, y: a.top - r.top, w: a.width, h: a.height };
}
const boxVars = (b: Box) => ({ left: b.x, top: b.y, width: b.w, height: b.h });
const centre = (b: Box) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

const hold = (tl: gsap.core.Timeline, d = 0.25) => tl.to({}, { duration: d });

/** Fake pointer: glide to a point, then a short press. */
function tap(tl: gsap.core.Timeline, dot: Element, p: { x: number; y: number }, at?: gsap.Position) {
  tl.to(dot, { x: p.x, y: p.y, opacity: 1, duration: 0.45, ease: "power2.inOut" }, at);
  tl.to(dot, { scale: 0.7, duration: 0.1, ease: "power1.in" }).to(dot, { scale: 1, duration: 0.12, ease: "power1.out" });
}

/**
 * A→B→A from one forward timeline: `pre` (pointer to the trigger), forward, hold, `mid` (pointer to "back" + any
 * B-state extras), backward, hold. The forward timeline stays paused and is driven by tweenFromTo.
 */
function pingpong(fwd: gsap.core.Timeline, { pre, mid, h = 0.08 }: { pre?: (tl: gsap.core.Timeline) => void; mid?: (tl: gsap.core.Timeline) => void; h?: number } = {}) {
  fwd.pause(0);
  const D = fwd.duration();
  const tl = gsap.timeline({ repeat: -1 });
  pre?.(tl);
  tl.add(fwd.tweenFromTo(0, D, { ease: "none" }));
  hold(tl, h);
  mid?.(tl);
  tl.add(fwd.tweenFromTo(D, 0, { ease: "none" }));
  hold(tl, h);
  return tl;
}

let flipMod: typeof FlipT | null = null;
const getFlip = () => loadPlugin("Flip").then((f) => (flipMod = f));
/** Flip.fit vars (x, y, width, height, rotation) that move `el` onto `target`'s box. */
const fit = (el: Element, target: Element) => flipMod!.fit(el, target, { scale: false, getVars: true }) as gsap.TweenVars;

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, className = "", style, w = 1000, h = 1000 }: { i: number; className?: string; style?: CSSProperties; w?: number; h?: number }) => (
  <img src={scene(i, w, h)} alt="" className={`h-full w-full object-cover ${className}`} style={style} draggable={false} />
);

const HIDDEN: CSSProperties = { visibility: "hidden", opacity: 0 };
const Label = ({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) => (
  <p className={`text-[13px] uppercase tracking-[0.22em] text-white/60 ${className}`} style={{ fontFamily: F.mr, ...style }}>
    {children}
  </p>
);

/* ───────────────────────── X76 · Fullscreen to strip carousel ───────────────────────── */
const X76_S = [
  { t: "Dune Lines", n: "01", i: 0 },
  { t: "Salt Hour", n: "02", i: 3 },
  { t: "Iron Coast", n: "03", i: 1 },
  { t: "Tide Room", n: "04", i: 2 },
  { t: "Low Sun", n: "05", i: 3 },
];
function X76Slide({ s }: { s: (typeof X76_S)[number] }) {
  return (
    <div className="b13g5-c absolute inset-0 overflow-hidden">
      <Img i={s.i} w={1400} h={900} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="absolute bottom-[8%] left-[6%] right-[6%]">
        <p className="uppercase tracking-[0.22em] text-white/75" style={{ fontFamily: F.mr, fontSize: "max(12px, 1.3cqw)" }}>
          Series {s.n}
        </p>
        <p className="mt-[0.15em] leading-[0.95]" style={{ fontFamily: F.is, fontSize: "max(18px, 8cqw)" }}>
          {s.t}
        </p>
      </div>
    </div>
  );
}
function X76() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(
    root,
    (el) => {
      const q = gsap.utils.selector(el);
      const box = q(".x-in")[0];
      const track = q(".x76-track")[0];
      const slots = q(".x76-slot");
      const [fa, fb] = q(".x76-fs");
      const dot = q(".x76-dot")[0];
      const hint = q(".x76-hint")[0];
      const step = slots[1].getBoundingClientRect().left - slots[0].getBoundingClientRect().left;
      gsap.set(track, { x: 0 });
      const toS1 = fit(fa, slots[1]);
      gsap.set(track, { x: -step });
      const toS2 = fit(fb, slots[2]);
      gsap.set(track, { x: 0 });
      const full = { x: 0, y: 0, width: fa.offsetWidth, height: fa.offsetHeight };
      const W = box.clientWidth;
      const H = box.clientHeight;
      gsap.set(track, { autoAlpha: 1 });
      gsap.set(slots, { opacity: 0, scale: 0.86 });
      const tl = gsap.timeline({ repeat: -1 });
      const go = (from: Element, to: Element, fromV: gsap.TweenVars, toV: gsap.TweenVars, x0: number, x1: number) => {
        const dir = Math.sign(x1 - x0);
        tl.to(from, { ...fromV, borderRadius: 16, duration: 1, ease: "power2.inOut" })
          .to(slots, { opacity: 1, scale: 1, duration: 0.55, stagger: 0.05, ease: "power2.out" }, "<0.2")
          .to(hint, { autoAlpha: 1, duration: 0.3 }, "<0.3")
          .set(from, { autoAlpha: 0 })
          // drag with momentum: the pointer pulls part of the way, the strip glides on after release
          .set(dot, { x: W * 0.5, y: H * 0.5, scale: 1 })
          .to(dot, { opacity: 1, duration: 0.15 })
          .to(dot, { x: W * 0.5 + dir * step * 0.45, duration: 0.38, ease: "none" })
          .to(track, { x: x0 + dir * step * 0.45, duration: 0.38, ease: "none" }, "<")
          .to(track, { x: x1, duration: 0.75, ease: "expo.out" })
          .to(dot, { opacity: 0, duration: 0.25 }, "<")
          .set(to, { ...toV, borderRadius: 16, autoAlpha: 1 }, "-=0.2")
          .to(to, { ...full, borderRadius: 0, duration: 1, ease: "power2.inOut" }, "<")
          .to(hint, { autoAlpha: 0, duration: 0.3 }, "<")
          .set(slots, { opacity: 0, scale: 0.86 });
        hold(tl, 0.22);
      };
      go(fa, fb, toS1, toS2, 0, -step);
      go(fb, fa, toS2, toS1, -step, 0);
      return tl;
    },
    getFlip,
  );
  return (
    <Stage r={root} g1="rgba(255,213,154,.55)" g2="rgba(79,141,255,.22)">
      <div className="x76-track absolute left-0 top-[28%] flex h-[44%] w-full gap-[2%]" style={HIDDEN}>
        {X76_S.map((s, k) => (
          <div key={s.n} className={`x76-slot relative h-full w-[20%] shrink-0 overflow-hidden rounded-[16px] border border-white/10 ${k === 0 ? "ml-[18%]" : ""}`}>
            <X76Slide s={s} />
          </div>
        ))}
      </div>
      <Label className="x76-hint absolute bottom-[10%] left-0 right-0 text-center" style={HIDDEN}>
        ← Drag the strip →
      </Label>
      <div className="x76-fs absolute left-0 top-0 z-10 h-full w-full overflow-hidden">
        <X76Slide s={X76_S[1]} />
      </div>
      <div className="x76-fs absolute left-0 top-0 z-10 h-full w-full overflow-hidden" style={{ visibility: "hidden" }}>
        <X76Slide s={X76_S[2]} />
      </div>
      <Dot c="x76-dot" />
      <Sheen />
    </Stage>
  );
}

/* ───────────────────────── X77 · Grid item opening styles ───────────────────────── */
const X77_ITEMS = [
  { t: "Ash Vase", p: "₹ 2,400", i: 3 },
  { t: "Linen Throw", p: "₹ 3,850", i: 1 },
  { t: "Tide Bowl", p: "₹ 1,650", i: 0 },
  { t: "Kiln Cup", p: "₹ 890", i: 2 },
  { t: "Oak Tray", p: "₹ 2,100", i: 2 },
  { t: "Salt Jar", p: "₹ 1,250", i: 0 },
  { t: "Dusk Lamp", p: "₹ 5,600", i: 3 },
  { t: "Reed Mat", p: "₹ 1,900", i: 1 },
];
const X77_PICKS = [
  { k: 1, style: "fall" },
  { k: 6, style: "split" },
  { k: 3, style: "shrink" },
] as const;
function X77() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const box = q(".x-in")[0];
    const items = q(".x77-it");
    const big = rel(q(".x77-big")[0], box);
    const dums = q(".x77-dum");
    const infos = q(".x77-info");
    const close = rel(q(".x77-close")[0], box);
    const dot = q(".x77-dot")[0];
    const W = box.clientWidth;
    const H = box.clientHeight;
    const r = items.map((it) => rel(it, box));
    const tl = gsap.timeline({ repeat: -1 });
    X77_PICKS.forEach(({ k, style }, n) => {
      const dum = dums[n];
      const info = infos[n];
      const lines = info.querySelectorAll("[data-l]");
      const others = items.filter((_, j) => j !== k);
      const col = k % 4;
      const row = Math.floor(k / 4);
      const away = (j: number): gsap.TweenVars => {
        const jc = j % 4;
        const jr = Math.floor(j / 4);
        if (style === "fall") return { y: H * 0.95, rotation: gsap.utils.random(-14, 14, 1), autoAlpha: 0 };
        if (style === "split") return jc === col ? { y: (jr < row ? -1 : 1) * H * 0.8, autoAlpha: 0 } : { x: (jc < col ? -1 : 1) * W * 0.7, autoAlpha: 0 };
        return { scale: 0.4, autoAlpha: 0 };
      };
      tap(tl, dot, centre(r[k]));
      tl.set(dum, { ...boxVars(r[k]), autoAlpha: 1 }).set(items[k], { autoAlpha: 0 });
      tl.to(dot, { opacity: 0, duration: 0.2 }, "<");
      const t0 = tl.duration();
      others.forEach((o) => {
        const j = items.indexOf(o);
        const d = Math.hypot(r[j].x - r[k].x, r[j].y - r[k].y) / W;
        tl.to(o, { ...away(j), duration: 0.75, ease: style === "fall" ? "power2.in" : "power2.inOut" }, t0 + d * 0.3);
      });
      tl.to(dum, { ...boxVars(big), borderRadius: 22, duration: 0.95, ease: "power2.inOut" }, t0 + 0.1);
      tl.set(info, { autoAlpha: 1 }, t0 + 0.6).fromTo(lines, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.07, ease: "power2.out" }, t0 + 0.65);
      hold(tl, 0.1);
      tap(tl, dot, centre(close));
      tl.to(lines, { y: -16, opacity: 0, duration: 0.3, stagger: 0.04, ease: "power1.in" });
      tl.set(info, { autoAlpha: 0 });
      const t1 = tl.duration() - 0.15;
      tl.to(dum, { ...boxVars(r[k]), borderRadius: 14, duration: 0.85, ease: "power2.inOut" }, t1);
      tl.to(others, { x: 0, y: 0, rotation: 0, scale: 1, autoAlpha: 1, duration: 0.8, stagger: 0.03, ease: "power2.inOut" }, t1 + 0.05);
      tl.to(dot, { opacity: 0, duration: 0.2 }, t1);
      tl.set(items[k], { autoAlpha: 1 }).set(dum, { autoAlpha: 0 });
    });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,190,140,.55)" g2="rgba(140,180,255,.2)">
      <Label className="absolute left-[5%] top-[5%]">Kestrel Home · eight pieces</Label>
      <div className="absolute inset-x-[5%] bottom-[7%] top-[13%] grid grid-cols-4 grid-rows-2 gap-[1.6%]">
        {X77_ITEMS.map((it) => (
          <div key={it.t} className="x77-it relative overflow-hidden rounded-[14px] border border-white/10">
            <Img i={it.i} w={600} h={600} />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-8 text-[13px]" style={{ fontFamily: F.mr }}>
              <span className="font-[700]">{it.t}</span>
              <span className="tabular-nums text-white/75">{it.p}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="x77-big pointer-events-none absolute left-[5%] top-[8%] h-[84%] w-[47%]" aria-hidden />
      {X77_PICKS.map(({ k }) => (
        <div key={k} className="x77-dum absolute left-0 top-0 z-20 overflow-hidden rounded-[14px]" style={{ ...HIDDEN, width: 10, height: 10 }}>
          <Img i={X77_ITEMS[k].i} w={900} h={900} />
        </div>
      ))}
      {X77_PICKS.map(({ k, style }) => (
        <div key={k} className="x77-info absolute left-[58%] right-[6%] top-[24%] z-20" style={HIDDEN}>
          <p data-l className="text-[13px] uppercase tracking-[0.22em] text-[#ffbe8c]" style={{ fontFamily: F.mr }}>
            Opening style · {style}
          </p>
          <h3 data-l className="mt-4 text-[clamp(44px,4.6vw,76px)] leading-[0.98]" style={{ fontFamily: F.fr }}>
            {X77_ITEMS[k].t}
          </h3>
          <p data-l className="mt-5 max-w-[34ch] text-[16px] text-white/65" style={{ fontFamily: F.mr }}>
            Hand-finished in a small studio run, glazed and fired twice.
          </p>
          <p data-l className="mt-7 text-[22px] tabular-nums" style={{ fontFamily: F.sg }}>
            {X77_ITEMS[k].p}
          </p>
        </div>
      ))}
      <Label className="x77-close absolute right-[6%] top-[8%] z-20 text-white">Close ✕</Label>
      <Dot c="x77-dot" />
      <Sheen g1="rgba(255,190,140,.55)" />
    </Stage>
  );
}

/* ───────────────────────── X78 · Grid to slider with colour return ───────────────────────── */
const X78_ITEMS = [
  { t: "Orchard Linen", i: 3 },
  { t: "Harbour Wool", i: 0 },
  { t: "Ember Silk", i: 1 },
  { t: "Moss Cotton", i: 2 },
  { t: "Saffron Knit", i: 3 },
  { t: "Night Twill", i: 0 },
];
const X78_SEL = 4;
const X78_SLOT_W = [16, 16, 34, 16, 16, 16];
const X78_DIM = "hue-rotate(80deg) saturate(0.45) brightness(0.55)";
const X78_ON = "hue-rotate(0deg) saturate(1) brightness(1)";
function X78() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(
    root,
    (el) => {
      const q = gsap.utils.selector(el);
      const items = q(".x78-it");
      const slots = q(".x78-sl");
      const head = q(".x78-head")[0];
      const title = q(".x78-title")[0];
      const sizes = items.map((it) => ({ width: it.offsetWidth, height: it.offsetHeight }));
      const vars = items.map((it, i) => fit(it, slots[(i - X78_SEL + 2 + 6) % 6]));
      const fwd = gsap.timeline();
      fwd.to(head, { yPercent: -110, duration: 0.45, ease: "power2.in" }, 0);
      items.forEach((it, i) => {
        const d = Math.abs(i - X78_SEL) * 0.04;
        fwd.set(it, { zIndex: i === X78_SEL ? 3 : 2 }, 0);
        fwd.fromTo(it, { filter: X78_ON }, { filter: X78_DIM, duration: 0.3, ease: "power1.out" }, d);
        fwd.fromTo(it, { x: 0, y: 0, ...sizes[i] }, { ...vars[i], duration: 1.1, ease: "power2.inOut" }, d);
        fwd.to(it, { filter: X78_ON, duration: 0.6, ease: "power1.inOut" }, d + 0.6);
      });
      fwd.set(title, { autoAlpha: 1 }, 0.7).fromTo(Array.from(title.children), { yPercent: 110 }, { yPercent: 0, duration: 0.55, stagger: 0.06, ease: "power2.out" }, 0.75);
      return pingpong(fwd, { h: 0.25 });
    },
    getFlip,
  );
  return (
    <Stage r={root} g1="rgba(255,213,154,.55)" g2="rgba(120,220,190,.22)">
      <div className="absolute left-[5%] top-[5%] overflow-hidden">
        <Label className="x78-head">Loomhouse · Collection of six</Label>
      </div>
      <div className="absolute inset-x-[20%] bottom-[8%] top-[14%] grid grid-cols-3 grid-rows-2 gap-[2.2%]">
        {X78_ITEMS.map((it) => (
          <div key={it.t} className="relative">
            <div className="x78-it absolute left-0 top-0 h-full w-full overflow-hidden rounded-[12px]">
              <Img i={it.i} w={700} h={700} />
            </div>
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute left-[-2%] top-[14%] flex h-[56%] w-[130%] gap-[1.2%]" aria-hidden>
        {X78_SLOT_W.map((w, k) => (
          <div key={k} className="x78-sl h-full shrink-0" style={{ width: `${(w / 130) * 100}%` }} />
        ))}
      </div>
      <div className="x78-title absolute bottom-[9%] left-0 right-0 flex justify-center gap-[0.3em] overflow-hidden" style={HIDDEN}>
        {X78_ITEMS[X78_SEL].t.split(" ").map((w) => (
          <span key={w} className="inline-block text-[clamp(40px,4.4vw,70px)] leading-[1.05]" style={{ fontFamily: F.fr }}>
            {w}
          </span>
        ))}
      </div>
      <Sheen />
    </Stage>
  );
}

/* ───────────────────────── X79 · Grid column split to slideshow ───────────────────────── */
const X79_COLS = [
  [0, 2, 1],
  [3, 1, 0],
  [2, 0, 3],
  [1, 3, 2],
];
const X79_WORDS = ["Northern", "Light", "Edition"];
function X79() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const box = q(".x-in")[0];
    const grid = q(".x79-grid")[0];
    const cols = q(".x79-col");
    const cell = q(".x79-sel")[0];
    const fly = q(".x79-fly")[0];
    const slide = rel(q(".x79-slide")[0], box);
    const words = q(".x79-w");
    const cap = q(".x79-cap")[0];
    const from = rel(cell, box);
    const H = box.clientHeight;
    const fwd = gsap.timeline({ defaults: { ease: "power2.inOut" } });
    fwd.set(fly, { ...boxVars(from), autoAlpha: 1 }, 0).set(cell, { autoAlpha: 0 }, 0);
    fwd.to(cap, { autoAlpha: 0, duration: 0.3 }, 0);
    fwd.fromTo(grid, { scale: 1 }, { scale: 2.5, duration: 1.3 }, 0);
    cols.forEach((c, k) => fwd.fromTo(c, { y: 0 }, { y: (k % 2 ? 1 : -1) * H * 2, duration: 1.3 }, 0.05 * k));
    fwd.to(fly, { ...boxVars(slide), borderRadius: 4, duration: 1.2 }, 0.05);
    fwd.set(q(".x79-title")[0], { autoAlpha: 1 }, 0.5);
    words.forEach((w, k) => fwd.fromTo(w, { yPercent: k % 2 ? -200 : 200 }, { yPercent: 0, duration: 0.8, ease: "power2.out" }, 0.6 + k * 0.08));
    return pingpong(fwd, { h: 0.25 });
  });
  return (
    <Stage r={root} g1="rgba(150,190,255,.55)" g2="rgba(255,190,140,.2)">
      <div className="x79-grid absolute inset-x-[16%] inset-y-[6%] flex gap-[2%]">
        {X79_COLS.map((col, c) => (
          <div key={c} className={`x79-col flex flex-1 flex-col gap-[3%] ${c % 2 ? "pt-[4%]" : ""}`}>
            {col.map((i, r) => (
              <div key={r} className={`relative flex-1 overflow-hidden rounded-[10px] ${c === 1 && r === 1 ? "x79-sel" : ""}`}>
                <Img i={i} w={500} h={500} />
              </div>
            ))}
          </div>
        ))}
      </div>
      <Label className="x79-cap absolute bottom-[2%] left-0 right-0 text-center">Field archive · twelve frames</Label>
      <div className="x79-slide pointer-events-none absolute left-[20%] top-[6%] h-[64%] w-[60%]" aria-hidden />
      <div className="x79-fly absolute left-0 top-0 z-10 overflow-hidden rounded-[10px]" style={{ ...HIDDEN, width: 10, height: 10 }}>
        <Img i={1} w={1200} h={800} />
      </div>
      <div className="x79-title absolute bottom-[6%] left-0 right-0 z-10 flex justify-center" style={HIDDEN}>
        {X79_WORDS.map((w, k) => (
          <span key={w} className={`overflow-hidden ${k < X79_WORDS.length - 1 ? "mr-[0.28em]" : ""}`}>
            <span className="x79-w inline-block text-[clamp(40px,4.6vw,74px)] font-[700] uppercase leading-[1.05] tracking-[-0.02em]" style={{ fontFamily: F.sy }}>
              {w}
            </span>
          </span>
        ))}
      </div>
      <Sheen g1="rgba(150,190,255,.55)" />
    </Stage>
  );
}

/* ───────────────────────── X80 · Large image to grid slot ───────────────────────── */
const X80_SEL = 5;
function X80() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const box = q(".x-in")[0];
    const cells = q(".x80-cell");
    const fly = q(".x80-fly")[0];
    const cap = q(".x80-cap [data-l]");
    const W = box.clientWidth;
    const H = box.clientHeight;
    const big = rel(fly, box);
    const slot = rel(cells[X80_SEL], box);
    const others = cells.filter((_, i) => i !== X80_SEL);
    const fwd = gsap.timeline({ defaults: { ease: "power2.inOut" } });
    fwd.to(cap, { y: -24, opacity: 0, duration: 0.35, stagger: 0.04, ease: "power1.in" }, 0);
    fwd.fromTo(fly, { ...boxVars(big), borderRadius: 22 }, { ...boxVars(slot), borderRadius: 10, duration: 1.15 }, 0.1);
    others.forEach((c) => {
      const b = rel(c, box);
      const dx = b.x + b.w / 2 - W / 2;
      const dy = b.y + b.h / 2 - H / 2;
      const len = Math.max(1, Math.hypot(dx, dy));
      fwd.fromTo(c, { x: (dx / len) * W * 0.7, y: (dy / len) * H * 0.9, autoAlpha: 0 }, { x: 0, y: 0, autoAlpha: 1, duration: 1.05 }, 0.12 + (len / W) * 0.25);
    });
    return pingpong(fwd, { h: 0.25 });
  });
  return (
    <Stage r={root} g1="rgba(255,213,154,.55)" g2="rgba(255,120,150,.2)">
      <div className="absolute inset-x-[10%] inset-y-[7%] grid grid-cols-4 grid-rows-3 gap-[1.6%]">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="x80-cell relative overflow-hidden rounded-[10px]" style={i === X80_SEL ? { visibility: "hidden" } : HIDDEN}>
            <Img i={(i * 3 + 1) % 4} w={500} h={400} />
          </div>
        ))}
      </div>
      <div className="x80-fly absolute left-[5%] top-[6%] z-10 h-[88%] w-[52%] overflow-hidden rounded-[22px]">
        <Img i={(X80_SEL * 3 + 1) % 4} w={1000} h={900} />
      </div>
      <div className="x80-cap absolute left-[62%] right-[6%] top-[26%] z-10">
        <p data-l className="text-[13px] uppercase tracking-[0.22em] text-[#ffd59a]" style={{ fontFamily: F.mr }}>
          Frame 06 · Coastline
        </p>
        <h3 data-l className="mt-4 text-[clamp(44px,4.6vw,76px)] leading-[0.98]" style={{ fontFamily: F.is }}>
          The quiet harbour
        </h3>
        <p data-l className="mt-5 max-w-[32ch] text-[16px] text-white/65" style={{ fontFamily: F.mr }}>
          Archival pigment print on cotton rag, signed edition of forty.
        </p>
        <p data-l className="mt-6 text-[22px] tabular-nums" style={{ fontFamily: F.sg }}>
          ₹ 12,500
        </p>
      </div>
      <Sheen />
    </Stage>
  );
}

/* ───────────────────────── X81 · Menu row thumbs fly to grid ───────────────────────── */
const X81_ROWS = [
  { t: "Coastal", th: [0, 3, 1] },
  { t: "Highland", th: [2, 0, 3] },
  { t: "Desert", th: [3, 1, 2] },
  { t: "Harbour", th: [1, 2, 0] },
];
const X81_SEL = 1;
function X81() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(
    root,
    (el) => {
      const q = gsap.utils.selector(el);
      const box = q(".x-in")[0];
      const titles = q(".x81-t");
      const rows = q(".x81-row");
      const thumbs = Array.from(rows[X81_SEL].querySelectorAll(".x81-th"));
      const otherThumbs = q(".x81-th").filter((t) => !thumbs.includes(t));
      const slots = q(".x81-slot");
      const cover = q(".x81-cover")[0];
      const pageB = q(".x81-b")[0];
      const bt = q(".x81-bt");
      const dot = q(".x81-dot")[0];
      const vars = thumbs.map((t, i) => fit(t, slots[i]));
      const fwd = gsap.timeline({ defaults: { ease: "power2.inOut" } });
      fwd.to(titles, { yPercent: -115, rotation: 15, duration: 0.6, stagger: 0.04, ease: "power2.in" }, 0);
      fwd.to(otherThumbs, { opacity: 0, duration: 0.3 }, 0);
      fwd.set(cover, { transformOrigin: "50% 100%" }, 0).fromTo(cover, { scaleY: 0 }, { scaleY: 1, duration: 0.6 }, 0.1);
      thumbs.forEach((t, i) => {
        fwd.set(t, { zIndex: 30 }, 0);
        fwd.to(t, { ...vars[i], borderRadius: 14, duration: 1, ease: "power2.inOut" }, 0.15 + i * 0.08);
      });
      fwd.set(pageB, { autoAlpha: 1 }, 0.7).set(cover, { transformOrigin: "50% 0%" }, 0.7).to(cover, { scaleY: 0, duration: 0.6 }, 0.72);
      fwd.set(q(".x81-bwrap"), { autoAlpha: 1 }, 0.85).fromTo(bt, { yPercent: 115, rotation: 15 }, { yPercent: 0, rotation: 0, duration: 0.6, stagger: 0.06, ease: "power2.out" }, 0.9);
      const rowC = centre(rel(titles[X81_SEL], box));
      const back = centre(rel(q(".x81-back")[0], box));
      return pingpong(fwd, {
        pre: (tl) => {
          tap(tl, dot, rowC);
          tl.to(dot, { opacity: 0, duration: 0.2 });
        },
        mid: (tl) => {
          tap(tl, dot, back);
          tl.to(dot, { opacity: 0, duration: 0.2 });
        },
      });
    },
    getFlip,
  );
  return (
    <Stage r={root} g1="rgba(255,200,150,.55)" g2="rgba(120,160,255,.2)">
      <Label className="absolute left-[6%] top-[6%]">Wayfarer Prints · regions</Label>
      <div className="absolute inset-x-[6%] bottom-[8%] top-[16%] flex flex-col justify-between">
        {X81_ROWS.map((r) => (
          <div key={r.t} className="x81-row flex items-center justify-between border-b border-white/10 pb-[1.2%]">
            <div className="overflow-hidden">
              <p className="x81-t origin-bottom-left text-[clamp(40px,4.6vw,72px)] leading-[1.02]" style={{ fontFamily: F.fr }}>
                {r.t}
              </p>
            </div>
            <div className="flex gap-3">
              {r.th.map((i, k) => (
                <div key={k} className="relative h-[72px] w-[58px]">
                  <div className="x81-th absolute left-0 top-0 h-full w-full overflow-hidden rounded-[8px]">
                    <Img i={i} w={300} h={380} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="x81-b absolute inset-0 z-10 bg-[#1a120c]" style={HIDDEN}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(60% 70% at 50% 60%, rgba(255,200,150,.18), transparent 70%)" }} />
        <div className="absolute inset-x-[16%] bottom-[8%] top-[30%] flex gap-[3%]">
          {[0, 1, 2].map((k) => (
            <div key={k} className="x81-slot h-full flex-1 rounded-[14px] border border-white/10" />
          ))}
        </div>
      </div>
      <div className="x81-cover absolute inset-0 z-20 bg-[#ffc896]" style={{ transform: "scaleY(0)" }} aria-hidden />
      <div className="x81-bwrap absolute inset-x-[6%] top-[7%] z-30 flex items-end justify-between" style={HIDDEN}>
        <div>
          <div className="overflow-hidden">
            <p className="x81-bt origin-bottom-left text-[13px] uppercase tracking-[0.22em] text-[#ffc896]" style={{ fontFamily: F.mr }}>
              Region 02 · nine prints
            </p>
          </div>
          <div className="overflow-hidden">
            <p className="x81-bt origin-bottom-left text-[clamp(44px,5vw,80px)] leading-[1.02]" style={{ fontFamily: F.fr }}>
              Highland
            </p>
          </div>
        </div>
        <Label className="x81-back text-white">← All regions</Label>
      </div>
      <Dot c="x81-dot" />
      <Sheen g1="rgba(255,200,150,.55)" />
    </Stage>
  );
}

/* ───────────────────────── X82 · Stack to gallery column ───────────────────────── */
const X82_STACK = [
  { i: 0, r: -9, tx: -26, ty: 6 },
  { i: 3, r: 6, tx: 22, ty: -4 },
  { i: 1, r: -3, tx: -8, ty: -8 },
  { i: 2, r: 10, tx: 30, ty: 8 },
  { i: 3, r: -1, tx: 0, ty: 0 },
];
const X82_ACTIVE = 2;
function X82() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(
    root,
    (el) => {
      const q = gsap.utils.selector(el);
      const imgs = q(".x82-img");
      const slots = q(".x82-slot");
      const col = q(".x82-col")[0];
      const headA = q(".x82-a [data-l]");
      const bt = q(".x82-bt");
      const arrows = q(".x82-arr");
      const counter = q(".x82-n")[0];
      const step = slots[1].getBoundingClientRect().top - slots[0].getBoundingClientRect().top;
      const vars = imgs.map((im, k) => fit(im, slots[k]));
      const fwd = gsap.timeline({ defaults: { ease: "power2.inOut" } });
      fwd.to(headA, { yPercent: -110, opacity: 0, duration: 0.4, stagger: 0.04, ease: "power1.in" }, 0);
      imgs.forEach((im, k) => fwd.to(im, { ...vars[k], duration: 1, ease: "power2.inOut" }, 0.05 + Math.abs(k - X82_ACTIVE) * 0.06));
      fwd.set(q(".x82-b"), { autoAlpha: 1 }, 0.5);
      fwd.fromTo(bt, { yPercent: 110 }, { yPercent: 0, duration: 0.55, stagger: 0.06, ease: "power2.out" }, 0.55);
      fwd.fromTo(arrows, { x: 30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45, stagger: 0.08, ease: "power2.out" }, 0.7);
      return pingpong(fwd, {
        mid: (tl) => {
          // wheel-style steps through the column (down one, back up), arrows pulse with each step
          [-step, 0].forEach((y, s) => {
            tl.to(col, { y, duration: 0.6, ease: "power2.inOut" });
            tl.fromTo(arrows[s], { scale: 1 }, { scale: 1.25, duration: 0.15, yoyo: true, repeat: 1, ease: "power1.out", immediateRender: false }, "<");
            tl.call(() => {
              counter.textContent = s === 0 ? "04 / 05" : "03 / 05";
            }, [], "<0.3");
            hold(tl, 0.15);
          });
        },
      });
    },
    getFlip,
  );
  return (
    <Stage r={root} g1="rgba(255,213,154,.55)" g2="rgba(150,200,255,.2)">
      <div className="x82-a absolute left-[6%] top-[30%]">
        <div className="overflow-hidden">
          <p data-l className="text-[13px] uppercase tracking-[0.22em] text-[#ffd59a]" style={{ fontFamily: F.mr }}>
            Field notes · vol. 3
          </p>
        </div>
        <div className="overflow-hidden">
          <h3 data-l className="mt-3 text-[clamp(44px,4.6vw,76px)] leading-[1]" style={{ fontFamily: F.is }}>
            Five quiet rooms
          </h3>
        </div>
      </div>
      <div className="x82-col absolute inset-0">
        {X82_STACK.map((_, k) => (
          <div key={k} className="x82-slot pointer-events-none absolute left-[39%] h-[50%] w-[22%]" style={{ top: `${25 + (k - X82_ACTIVE) * 54}%` }} aria-hidden />
        ))}
        {X82_STACK.map((s, k) => (
          <div
            key={k}
            className="x82-img absolute left-[39%] top-[22%] h-[56%] w-[22%] overflow-hidden rounded-[14px] border border-white/10 shadow-2xl"
            style={{ transform: `translate(${s.tx}%, ${s.ty}%) rotate(${s.r}deg)`, zIndex: k === X82_ACTIVE ? 6 : 1 + k }}
          >
            <Img i={s.i} w={500} h={640} />
          </div>
        ))}
      </div>
      <div className="x82-b absolute inset-0 z-10" style={HIDDEN}>
        <div className="absolute left-[6%] top-[38%]">
          <div className="overflow-hidden">
            <p className="x82-bt text-[13px] uppercase tracking-[0.22em] text-[#ffd59a]" style={{ fontFamily: F.mr }}>
              Room <span className="x82-n">03 / 05</span>
            </p>
          </div>
          <div className="overflow-hidden">
            <p className="x82-bt mt-3 text-[clamp(40px,4vw,64px)] leading-[1]" style={{ fontFamily: F.is }}>
              Salt kitchen
            </p>
          </div>
        </div>
        <div className="absolute right-[7%] top-[40%] flex flex-col gap-4 text-[22px]" style={{ fontFamily: F.sg }}>
          <span className="x82-arr flex h-12 w-12 items-center justify-center rounded-full border border-white/30">↓</span>
          <span className="x82-arr flex h-12 w-12 items-center justify-center rounded-full border border-white/30">↑</span>
        </div>
      </div>
      <Sheen />
    </Stage>
  );
}

/* ───────────────────────── X83 · Thumbnail to full-width header ───────────────────────── */
const X83_CARDS = [
  { t: "Copper & clay", k: "Journal 11", i: 3 },
  { t: "A house of stone", k: "Journal 12", i: 0 },
  { t: "After the monsoon", k: "Journal 13", i: 1 },
];
function X83() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const box = q(".x-in")[0];
    const cards = q(".x83-card");
    const outer = q(".x83-o")[0];
    const inner = q(".x83-i")[0];
    const caps = q(".x83-cap");
    const lines = q(".x83-line");
    const body = q(".x83-body")[0];
    const dot = q(".x83-dot")[0];
    const W = box.clientWidth;
    const H = box.clientHeight;
    const t = rel(outer, box);
    const head = { x: 0, y: 0, w: W, h: H * 0.56 };
    const sx = head.w / t.w;
    const sy = head.h / t.h;
    gsap.set(outer, { transformOrigin: "0 0", zIndex: 20 });
    // inner image at the header's final size, centred, counter-scaled every frame -> never distorts
    gsap.set(inner, { position: "absolute", left: "50%", top: "50%", width: head.w, height: head.h, xPercent: -50, yPercent: -50 });
    const pr = { p: 0 };
    const draw = () => {
      const p = pr.p;
      const csx = 1 + (sx - 1) * p;
      const csy = 1 + (sy - 1) * p;
      const rad = 16 * (1 - p);
      gsap.set(outer, { x: (head.x - t.x) * p, y: (head.y - t.y) * p, scaleX: csx, scaleY: csy, borderRadius: `${rad / csx}px / ${rad / csy}px` });
      gsap.set(inner, { scaleX: 1 / csx, scaleY: 1 / csy });
    };
    draw();
    const fwd = gsap.timeline({ defaults: { ease: "power2.inOut" } });
    fwd.to(caps, { y: 20, opacity: 0, duration: 0.35, ease: "power1.in" }, 0);
    fwd.to(pr, { p: 1, duration: 1.1, onUpdate: draw }, 0.05);
    [cards[0], cards[2]].forEach((c, k) => fwd.to(c, { rotationY: k ? -75 : 75, x: (k ? 1 : -1) * W * 0.12, autoAlpha: 0, transformPerspective: 900, duration: 0.9 }, 0.05));
    fwd.set(q(".x83-art"), { autoAlpha: 1 }, 0.6);
    fwd.fromTo(lines, { yPercent: 100, rotation: 3 }, { yPercent: 0, rotation: 0, duration: 0.6, stagger: 0.08, ease: "power2.out" }, 0.65);
    fwd.fromTo(body, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }, 0.8);
    const back = centre(rel(q(".x83-back")[0], box));
    return pingpong(fwd, {
      pre: (tl) => {
        tap(tl, dot, centre(t));
        tl.to(dot, { opacity: 0, duration: 0.2 });
      },
      mid: (tl) => {
        tap(tl, dot, back);
        tl.to(dot, { opacity: 0, duration: 0.2 });
      },
    });
  });
  return (
    <Stage r={root} g1="rgba(255,190,150,.55)" g2="rgba(150,200,255,.2)">
      <Label className="absolute left-[6%] top-[7%]">Terrace Journal · latest</Label>
      <div className="absolute inset-x-[8%] bottom-[10%] top-[18%] flex gap-[3%]">
        {X83_CARDS.map((c, k) => (
          <div key={c.t} className="x83-card flex flex-1 flex-col">
            <div className={`relative flex-1 overflow-hidden rounded-[16px] ${k === 1 ? "x83-o" : ""}`}>
              <div className={k === 1 ? "x83-i absolute inset-0" : "absolute inset-0"}>
                <Img i={c.i} w={1400} h={700} />
              </div>
            </div>
            <div className="x83-cap mt-4">
              <p className="text-[13px] uppercase tracking-[0.2em] text-white/55" style={{ fontFamily: F.mr }}>
                {c.k}
              </p>
              <p className="mt-1 text-[clamp(22px,2vw,30px)] leading-[1.1]" style={{ fontFamily: F.fr }}>
                {c.t}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="x83-art absolute inset-x-[6%] top-[61%] z-30 flex items-start justify-between gap-[6%]" style={HIDDEN}>
        <div>
          {["A house", "of stone"].map((l) => (
            <div key={l} className="overflow-hidden">
              <p className="x83-line origin-bottom-left text-[clamp(44px,4.8vw,78px)] leading-[1]" style={{ fontFamily: F.fr }}>
                {l}
              </p>
            </div>
          ))}
        </div>
        <div className="x83-body max-w-[36ch] pt-2 text-[16px] text-white/70" style={{ fontFamily: F.mr }}>
          <p>Laterite walls, lime plaster and a courtyard that keeps the afternoon cool. A visit to a home built slowly.</p>
          <p className="x83-back mt-5 text-[13px] uppercase tracking-[0.2em] text-white">← Back to journal</p>
        </div>
      </div>
      <Dot c="x83-dot" />
      <Sheen g1="rgba(255,190,150,.55)" />
    </Stage>
  );
}

/* ───────────────────────── X84 · Thumbnails flow into grid with spin ───────────────────────── */
const X84_A = [3, 0, 1, 2, 0, 3];
const X84_B = [1, 2, 3, 0, 2, 1];
function X84() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(
    root,
    (el) => {
      const q = gsap.utils.selector(el);
      const box = q(".x-in")[0];
      const a = q(".x84-a");
      const b = q(".x84-b");
      const strip = q(".x84-st");
      const dot = q(".x84-dot")[0];
      const page = q(".x84-page")[0];
      const next = centre(rel(q(".x84-next")[0], box));
      const prev = centre(rel(q(".x84-prev")[0], box));
      const sizes = a.map((it) => ({ width: it.offsetWidth, height: it.offsetHeight }));
      const toStrip = a.map((it, i) => fit(it, strip[i]));
      const tl = gsap.timeline({ repeat: -1 });
      // thumbnails scale in on the strip, then flow into the grid
      tl.set(a, { autoAlpha: 1, rotation: 0 }).set(b, { autoAlpha: 0 });
      a.forEach((it, i) => tl.set(it, { ...toStrip[i], scale: 0, zIndex: 2 }, 0));
      tl.to(a, { scale: 1, duration: 0.4, stagger: 0.06, ease: "power2.out" });
      a.forEach((it, i) => tl.to(it, { x: 0, y: 0, ...sizes[i], duration: 0.9, ease: "power2.inOut" }, 0.55 + i * 0.05));
      hold(tl, 0.1);
      const swap = (out: Element[], inn: Element[], p: { x: number; y: number }, label: string, dir: number) => {
        tap(tl, dot, p);
        tl.to(dot, { opacity: 0, duration: 0.2 });
        const t0 = tl.duration() - 0.2;
        tl.to(out, { rotation: 120 * dir, scale: 0, duration: 0.6, stagger: 0.05, ease: "power2.in" }, t0);
        tl.set(inn, { autoAlpha: 1 }, t0 + 0.3).fromTo(inn, { rotation: -120 * dir, scale: 0 }, { rotation: 0, scale: 1, duration: 0.7, stagger: 0.05, ease: "power2.out", immediateRender: false }, t0 + 0.3);
        tl.call(() => {
          page.textContent = label;
        }, [], t0 + 0.4);
        tl.set(out, { autoAlpha: 0 });
        hold(tl, 0.1);
      };
      swap(a, b, next, "02 / 02", 1);
      swap(b, a, prev, "01 / 02", -1);
      // flow back to the strip and shrink away, so the loop restarts cleanly
      a.forEach((it, i) => tl.to(it, { ...toStrip[i], duration: 0.8, ease: "power2.inOut" }, `>-${i ? 0.75 : 0}`));
      tl.to(a, { scale: 0, duration: 0.35, stagger: 0.04, ease: "power2.in" });
      return tl;
    },
    getFlip,
  );
  return (
    <Stage r={root} g1="rgba(255,213,154,.55)" g2="rgba(255,120,160,.22)">
      <Label className="absolute left-[6%] top-[6%]">Marigold Ceramics · glaze studies</Label>
      <div className="absolute inset-x-[18%] bottom-[16%] top-[13%] grid grid-cols-3 grid-rows-2 gap-[2%]">
        {X84_A.map((ia, k) => (
          <div key={k} className="relative">
            <div className="x84-a absolute left-0 top-0 h-full w-full overflow-hidden rounded-[12px]">
              <Img i={ia} w={600} h={500} />
            </div>
            <div className="x84-b absolute left-0 top-0 h-full w-full overflow-hidden rounded-[12px]" style={HIDDEN}>
              <Img i={X84_B[k]} w={600} h={500} />
            </div>
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute bottom-[4%] left-1/2 flex h-[9%] w-[44%] gap-[1.5%]" style={{ marginLeft: "-22%" }} aria-hidden>
        {X84_A.map((_, k) => (
          <div key={k} className="x84-st h-full flex-1" />
        ))}
      </div>
      <div className="absolute bottom-[6%] right-[6%] flex items-center gap-6 text-[14px]" style={{ fontFamily: F.sg }}>
        <span className="x84-prev">← Prev</span>
        <span className="x84-page tabular-nums text-white/60">01 / 02</span>
        <span className="x84-next">Next →</span>
      </div>
      <Dot c="x84-dot" />
      <Sheen />
    </Stage>
  );
}

/* ───────────────────────── X85 · Type rows open an inline image ───────────────────────── */
const X85_ROWS = [
  { a: "Quiet", b: "mornings", i: 3 },
  { a: "Oak &", b: "linen", i: 1 },
  { a: "Salt", b: "ceramics", i: 0 },
  { a: "Night", b: "garden", i: 2 },
];
const X85_SEL = 1;
function X85() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const box = q(".x-in")[0];
    const W = box.clientWidth;
    const H = box.clientHeight;
    const pills = q(".x85-pill");
    const wa = q(".x85-wa");
    const wb = q(".x85-wb");
    const dum = q(".x85-dum")[0];
    const big = rel(q(".x85-big")[0], box);
    const from = rel(pills[X85_SEL], box);
    const cap = q(".x85-cap [data-l]");
    const dot = q(".x85-dot")[0];
    const fwd = gsap.timeline({ defaults: { ease: "power2.inOut" } });
    fwd.set(dum, { ...boxVars(from), borderRadius: from.h / 2, autoAlpha: 1 }, 0).set(pills[X85_SEL], { autoAlpha: 0 }, 0);
    X85_ROWS.forEach((_, k) => {
      const s = Math.abs(k - X85_SEL) * 0.05;
      const dir = k % 2 ? 1 : -1;
      fwd.to(wa[k], { x: -W * 0.7 * (k === X85_SEL ? 1 : -dir), duration: 0.9 }, s);
      fwd.to(wb[k], { x: W * 0.7 * (k === X85_SEL ? 1 : -dir), duration: 0.9 }, s + 0.03);
      if (k !== X85_SEL) fwd.to(pills[k], { y: (k < X85_SEL ? -1 : 1) * H * 0.8, duration: 0.9 }, s);
    });
    fwd.to(dum, { ...boxVars(big), borderRadius: 20, duration: 1.05 }, 0.08);
    fwd.set(q(".x85-cap"), { autoAlpha: 1 }, 0.7).fromTo(cap, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.07, ease: "power2.out" }, 0.75);
    const back = centre(rel(q(".x85-back")[0], box));
    return pingpong(fwd, {
      pre: (tl) => {
        tap(tl, dot, centre(from));
        tl.to(dot, { opacity: 0, duration: 0.2 });
      },
      mid: (tl) => {
        tap(tl, dot, back);
        tl.to(dot, { opacity: 0, duration: 0.2 });
      },
    });
  });
  return (
    <Stage r={root} g1="rgba(255,213,154,.55)" g2="rgba(160,140,255,.22)">
      <Label className="absolute left-[6%] top-[6%]">Fernhill Living · index</Label>
      <div className="absolute inset-x-0 bottom-[8%] top-[15%] flex flex-col justify-center gap-[2.2%]">
        {X85_ROWS.map((r) => (
          <div key={r.a} className="flex items-center justify-center text-[clamp(48px,6vw,96px)] leading-[1.02]" style={{ fontFamily: F.fr }}>
            <span className="x85-wa mr-[0.25em] inline-block">{r.a}</span>
            <span className="x85-pill relative mr-[0.25em] inline-block h-[0.78em] w-[1.7em] overflow-hidden rounded-full">
              <Img i={r.i} w={400} h={200} />
            </span>
            <span className="x85-wb inline-block italic">{r.b}</span>
          </div>
        ))}
      </div>
      <div className="x85-big pointer-events-none absolute left-[28%] top-[8%] h-[70%] w-[44%]" aria-hidden />
      <div className="x85-dum absolute left-0 top-0 z-10 overflow-hidden" style={{ ...HIDDEN, width: 10, height: 10 }}>
        <Img i={X85_ROWS[X85_SEL].i} w={1000} h={700} />
      </div>
      <div className="x85-cap absolute inset-x-[28%] bottom-[6%] z-10 flex items-end justify-between" style={HIDDEN}>
        <div>
          <p data-l className="text-[13px] uppercase tracking-[0.22em] text-[#ffd59a]" style={{ fontFamily: F.mr }}>
            Bedroom · 02
          </p>
          <p data-l className="mt-1 text-[clamp(26px,2.4vw,38px)]" style={{ fontFamily: F.fr }}>
            Oak & linen <span className="tabular-nums text-white/70">₹ 4,200</span>
          </p>
        </div>
        <Label className="x85-back text-white">✕ Close</Label>
      </div>
      <Dot c="x85-dot" />
      <Sheen />
    </Stage>
  );
}

/* ---------- WebGL transitions (X86–X87) ---------- */

type Uniforms = Record<string, { value: unknown }>;
type PageData = { brand: string; kicker: string; title: string; price: string; i: number; acc: string };
const GL_PAGES: Record<string, [PageData, PageData]> = {
  luma: [
    { brand: "Saltgrass", kicker: "Summer edit · 01", title: "Linen for the long light", price: "₹ 3,450", i: 3, acc: "#ffd59a" },
    { brand: "Saltgrass", kicker: "Evening edit · 02", title: "Silk after sundown", price: "₹ 5,900", i: 0, acc: "#9fd8ff" },
  ],
  ripple: [
    { brand: "Tidewater", kicker: "Still water · 01", title: "Glass that holds the sea", price: "₹ 2,750", i: 0, acc: "#9fd8ff" },
    { brand: "Tidewater", kicker: "Green hour · 02", title: "Fern & river stone", price: "₹ 1,980", i: 2, acc: "#c8ff8a" },
  ],
};

/** Paints a page (photo + left shade + text) into a canvas for a texture. Matches the HTML fallback below. */
async function paintPage(d: PageData, w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d")!;
  const img = new Image();
  img.src = scene(d.i, w, h);
  await img.decode();
  x.drawImage(img, 0, 0, w, h);
  const g = x.createLinearGradient(0, 0, w * 0.7, 0);
  g.addColorStop(0, "rgba(5,6,10,.82)");
  g.addColorStop(1, "rgba(5,6,10,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);
  const pad = w * 0.06;
  x.textBaseline = "top";
  x.fillStyle = "#ffffff";
  x.font = `700 13px "${F.mr}"`;
  x.fillText(d.brand.toUpperCase(), pad, h * 0.07);
  x.fillStyle = d.acc;
  x.font = `600 13px "${F.mr}"`;
  x.fillText(d.kicker.toUpperCase(), pad, h * 0.3);
  const fs = Math.round(Math.min(78, w * 0.055));
  x.fillStyle = "#f6f1ea";
  x.font = `400 ${fs}px "${F.fr}"`;
  const words = d.title.split(" ");
  const half = Math.ceil(words.length / 2);
  x.fillText(words.slice(0, half).join(" "), pad, h * 0.3 + 28);
  x.fillText(words.slice(half).join(" "), pad, h * 0.3 + 28 + fs * 1.02);
  x.font = `500 22px "${F.sg}"`;
  x.fillText(d.price, pad, h * 0.3 + 28 + fs * 2.3);
  return c;
}

function HtmlPage({ d }: { d: PageData }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <Img i={d.i} w={1400} h={900} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(5,6,10,.82), rgba(5,6,10,0) 70%)" }} />
      <p className="absolute left-[6%] top-[7%] text-[13px] font-[700] uppercase tracking-[0.06em] text-white" style={{ fontFamily: F.mr }}>
        {d.brand}
      </p>
      <div className="absolute left-[6%] top-[30%] max-w-[44%]">
        <p className="text-[13px] font-[600] uppercase" style={{ fontFamily: F.mr, color: d.acc }}>
          {d.kicker}
        </p>
        <p className="mt-3 text-[clamp(40px,5.2vw,78px)] leading-[1.02]" style={{ fontFamily: F.fr }}>
          {d.title}
        </p>
        <p className="mt-5 text-[22px]" style={{ fontFamily: F.sg }}>
          {d.price}
        </p>
      </div>
    </div>
  );
}

/** Greyscale reveal-order maps (dark = switches first): 0 = drifting organic bands, 1 = petal burst from the centre. */
function lumaMap(kind: 0 | 1, w = 256, h = 160) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d")!;
  const im = x.createImageData(w, h);
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const u = i / w;
      const v = j / h;
      let l: number;
      if (kind === 0) l = u * 0.62 + 0.38 * (0.5 + 0.5 * Math.sin(u * 13 + Math.sin(v * 7) * 2.2) * Math.cos(v * 9 - u * 4));
      else {
        const dx = (u - 0.5) * (w / h);
        const dy = v - 0.5;
        const r = Math.hypot(dx, dy) / 0.95;
        l = r * 0.72 + 0.28 * (0.5 + 0.5 * Math.sin(Math.atan2(dy, dx) * 6 + r * 6));
      }
      const g = Math.max(0, Math.min(255, Math.round(l * 255)));
      const o = (j * w + i) * 4;
      im.data[o] = im.data[o + 1] = im.data[o + 2] = g;
      im.data[o + 3] = 255;
    }
  x.putImageData(im, 0, 0);
  return c;
}

/**
 * Paints both pages (+ optional extra textures) only once the stage is within ~1 screen (rule 20), runs `frag` at
 * dpr 1, loops `play(uniforms)` while on screen, and releases the GL context on unmount. HTML page A underneath is
 * the fallback (static / reduced motion / no WebGL).
 */
function GLSwap({ pair, frag, play, g1, extra }: { pair: [PageData, PageData]; frag: string; play: (u: Uniforms) => gsap.core.Timeline; g1: string; extra?: () => TexImageSource[] }) {
  const box = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const pl = useRef(play);
  pl.current = play;
  const ex = useRef(extra);
  useEffect(() => {
    const el = box.current;
    if (!el || prefersReducedMotion()) return;
    let dead = false;
    let started = false;
    let h: GLHandle | null = null;
    let tl: gsap.core.Timeline | null = null;
    let on = false;
    const vis = new IntersectionObserver(
      ([e]) => {
        on = e.isIntersecting;
        if (tl) (on ? tl.play() : tl.pause());
      },
      { threshold: 0.15 },
    );
    vis.observe(el);
    const start = async () => {
      await document.fonts?.ready;
      const r = el.getBoundingClientRect();
      const w = Math.round(Math.min(1400, Math.max(320, r.width)));
      const hh = Math.round(Math.max(200, (w * r.height) / Math.max(1, r.width)));
      const [a, b] = await Promise.all([paintPage(pair[0], w, hh), paintPage(pair[1], w, hh)]);
      if (dead || !cv.current) return;
      h = await createShader(cv.current, frag, {
        textures: [a, b, ...(ex.current?.() ?? [])],
        dpr: 1,
        uniforms: { uFlip: { value: 0 }, uMap: { value: 0 } },
      });
      if (dead) {
        h?.destroy();
        h = null;
        return;
      }
      if (!h) return;
      tl = pl.current(h.uniforms);
      if (on) tl.play();
      else tl.pause();
    };
    const near = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started) {
          started = true;
          near.disconnect();
          start();
        }
      },
      { rootMargin: "900px 0px" },
    );
    near.observe(el);
    return () => {
      dead = true;
      vis.disconnect();
      near.disconnect();
      tl?.kill();
      h?.destroy();
    };
  }, [pair, frag]);
  return (
    <Stage r={box} g1={g1}>
      <HtmlPage d={pair[0]} />
      <canvas ref={cv} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500" aria-hidden />
      <Sheen g1={g1} />
    </Stage>
  );
}

const PAGES_GLSL = /* glsl */ `
uniform float uFlip, uMap;
vec3 pa(vec2 uv) { return texture2D(uTex0, cover(clamp(uv, 0.0, 1.0), uTexRes0)).rgb; }
vec3 pb(vec2 uv) { return texture2D(uTex1, cover(clamp(uv, 0.0, 1.0), uTexRes1)).rgb; }
vec3 fromPage(vec2 uv) { return mix(pa(uv), pb(uv), uFlip); }
vec3 toPage(vec2 uv) { return mix(pb(uv), pa(uv), uFlip); }
`;

/* ---------- X86 · Luma-map transition (variant of M66: the reveal order comes from a greyscale map, step(luma, progress)) ---------- */
const LUMA = /* glsl */ `${PAGES_GLSL}
void main() {
  float l = mix(texture2D(uTex2, vUv).r, texture2D(uTex3, vUv).r, uMap);
  float s = 0.08;
  float p = uProgress * (1.0 + s);
  float m = smoothstep(l, l + s, p);
  float edge = m * (1.0 - m) * 4.0;
  vec3 col = mix(fromPage(vUv), toPage(vUv), m);
  col += edge * mix(vec3(1.0, 0.78, 0.45), vec3(0.55, 0.8, 1.0), uMap) * 0.55;
  gl_FragColor = vec4(col, 1.0);
}`;
function X86() {
  return (
    <GLSwap
      pair={GL_PAGES.luma}
      frag={LUMA}
      g1="rgba(255,213,154,.55)"
      extra={() => [lumaMap(0), lumaMap(1)]}
      play={(u) => {
        const tl = gsap.timeline({ repeat: -1 });
        [0, 1].forEach((k) => {
          tl.set(u.uFlip, { value: k });
          tl.set(u.uMap, { value: k });
          tl.set(u.uProgress, { value: 0 });
          tl.to(u.uProgress, { value: 1, duration: 1.2, ease: "power1.inOut" });
          hold(tl, 0.22);
        });
        return tl;
      }}
    />
  );
}

/* ---------- X87 · Concentric ripple page transition (variant of M69: a ring wavefront distorts as it expands and reveals) ---------- */
const RIPPLE = /* glsl */ `${PAGES_GLSL}
void main() {
  float asp = uRes.x / uRes.y;
  vec2 p = (vUv - 0.5) * vec2(asp, 1.0);
  float d = length(p);
  float R = length(vec2(asp, 1.0)) * 0.5 + 0.12;
  float r = uProgress * R;
  float x = d - r;
  float ring = exp(-x * x * 70.0) * step(0.001, uProgress) * (1.0 - smoothstep(0.9, 1.0, uProgress));
  float wave = sin(x * 48.0 - uTime * 7.0) * ring;
  float inside = smoothstep(0.02, -0.25, x) * sin(uProgress * 3.14159);
  float trail = sin(d * 38.0 - uTime * 5.0) * 0.35 * inside;
  vec2 dir = d > 0.0001 ? p / d : vec2(0.0);
  vec2 off = dir * (wave * 0.035 + trail * 0.006) / vec2(asp, 1.0);
  vec2 uv = vUv + off;
  float m = smoothstep(0.012, -0.012, x);
  vec3 col = mix(fromPage(uv), toPage(uv), m);
  col += ring * max(wave, 0.0) * 0.18;
  gl_FragColor = vec4(col, 1.0);
}`;
function X87() {
  return (
    <GLSwap
      pair={GL_PAGES.ripple}
      frag={RIPPLE}
      g1="rgba(159,216,255,.55)"
      play={(u) => {
        const tl = gsap.timeline({ repeat: -1 });
        [0, 1].forEach((k) => {
          tl.set(u.uFlip, { value: k });
          tl.set(u.uProgress, { value: 0 });
          tl.to(u.uProgress, { value: 1, duration: 1.3, ease: "power1.inOut" });
          hold(tl, 0.22);
        });
        return tl;
      }}
    />
  );
}

export const DEFS: MotionDef[] = [
  { code: "X76", name: "Fullscreen to strip carousel", how: "Auto A→B→A: the full-screen slide zooms out into a small strip carousel (Flip.fit), a fake drag throws the strip one slide with momentum, and the next slide zooms back to full screen.", kind: "play", C: X76 },
  { code: "X77", name: "Grid item opening styles", how: "Auto click: a grid image grows into its large view through a dummy element while the other items fall away, split to the sides or shrink (three presets in turn); the text reveals, then it closes.", kind: "play", C: X77 },
  { code: "X78", name: "Grid to slider with colour return", how: "Auto A→B→A: the grid images Flip into a slider strip with the chosen one centred, going hue-rotated and dim as they move and back to full colour as they settle; the title slides up.", kind: "play", C: X78 },
  { code: "X79", name: "Grid column split to slideshow", how: "Auto A→B→A: the grid scales up ×2.5 while its columns split apart (alternate up / down two screens), one image flies into the slide and the title words arrive from ±200%.", kind: "play", C: X79 },
  { code: "X80", name: "Large image to grid slot", how: "Auto A→B→A: the large detail image flies back into its grid cell while the other cells fly in from directions pointing away from the centre (and back out again).", kind: "play", C: X80 },
  { code: "X81", name: "Menu row thumbs fly to grid", how: "Auto click: the menu titles slide up with a 15° tilt, the chosen row's thumbnails Flip into a preview grid with a stagger, and a colour cover sweeps up and wipes away to the new view.", kind: "play", C: X81 },
  { code: "X82", name: "Stack to gallery column", how: "Auto A→B→A: a tilted stack of photos Flips into a vertical gallery column, the title slides up and arrows enter, the column steps down and back like a wheel, then it stacks again.", kind: "play", C: X82 },
  { code: "X83", name: "Thumbnail to full-width header", how: "Auto click: the middle thumbnail scales to a full-width article header (counter-scaled inner image, no distortion), the side cards rotate away on Y and the title lines rise from 3° to 0.", kind: "play", C: X83 },
  { code: "X84", name: "Thumbnails flow into grid with spin", how: "Auto: thumbnails scale in on a strip and Flip into a grid; Next / Prev spin the current set out and the next set in, then the grid flows back to the strip.", kind: "play", C: X84 },
  { code: "X85", name: "Type rows open an inline image", how: "Auto click: the small image inside a line of type flies to a large preview while the words slide out sideways and the other inline images slide out up / down.", kind: "play", C: X85 },
  { code: "X86", name: "Luma-map transition", how: "Auto A→B→A: the next page appears in the order of a greyscale map (dark first, light last) with a soft glowing edge; WebGL step(luma, progress), a different map each way.", kind: "play", C: X86 },
  { code: "X87", name: "Concentric ripple page transition", how: "Auto A→B→A: a fluid ripple ring expands from the centre, bending the page as it passes, and the new page appears behind the wavefront (WebGL).", kind: "play", C: X87 },
];
