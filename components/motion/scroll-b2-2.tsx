"use client";

// MOTION-MENU M147–M158 (scroll group, batch 2 · part 2): small focused demos for /lab/motion.
// "scrub" demos map the panel's scroll LINEARLY onto a paused timeline (useScrub → tl.progress(p)) or set styles directly.
// "play" demos start when on screen, loop, and pause off screen. Every demo also has a CSS-only glow loop.
// ?static=1 / reduced motion: no animation, final state.
import { useEffect, useRef, type CSSProperties, type RefObject } from "react";
import type { Flip as FlipT } from "gsap/Flip";
import { gsap, loadPlugin, prefersReducedMotion } from "@/lib/gsap";
import { scene, useScrub, useTicker } from "@/components/fx/shared";
import { Product } from "@/components/sections/kit";
import type { MotionDef } from "./types";

const GROTESK = "'Space Grotesk Variable', system-ui, sans-serif";
const SERIF = "'Fraunces Variable', Georgia, serif";
const EDITORIAL = "'Instrument Serif', Georgia, serif";
const WIDE = "'Syne Variable', 'Space Grotesk Variable', system-ui, sans-serif";
const MANROPE = "'Manrope Variable', system-ui, sans-serif";
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/* ---------- shared helpers (local copies) ---------- */

/** A soft radial glow that drifts forever (CSS only, scoped to one code), stopped in ?static=1 / reduced motion. */
function Glow({ code, color, at = "50% 45%", className = "" }: { code: string; color: string; at?: string; className?: string }) {
  const c = `${code}-glow`;
  const css = `.${c}{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(circle at ${at},${color} 0%,transparent 52%);animation:${c} 4.6s linear infinite alternate;will-change:transform}
@keyframes ${c}{0%{transform:translate3d(-9%,-5%,0) scale(1)}100%{transform:translate3d(9%,6%,0) scale(1.18)}}
html.is-static .${c}{animation:none}html.is-static {.${c}{animation:none}}`;
  return (
    <>
      <style>{css}</style>
      <div className={`${c} ${className}`} aria-hidden />
    </>
  );
}

/**
 * Scrub: a paused timeline built once (after an optional plugin load); scroll progress (0..1 over the whole panel)
 * drives tl.progress linearly. In reduced motion useScrub reports 1 once → final state.
 */
function useScrubTl(root: RefObject<HTMLDivElement | null>, build: (tl: gsap.core.Timeline, el: HTMLDivElement, plug: unknown) => void, pre?: () => Promise<unknown>) {
  const tl = useRef<gsap.core.Timeline | null>(null);
  const pr = useRef(0);
  const fn = useRef(build);
  fn.current = build;
  const pf = useRef(pre);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let dead = false;
    const ctx = gsap.context(() => {}, el);
    Promise.all([pf.current?.(), document.fonts?.ready]).then(([plug]) => {
      if (dead) return;
      ctx.add(() => {
        const t = gsap.timeline({ paused: true, defaults: { ease: "none" } });
        fn.current(t, el, plug);
        tl.current = t;
        t.progress(pr.current);
      });
    });
    return () => {
      dead = true;
      tl.current = null;
      ctx.revert();
    };
  }, [root]);
  useScrub(root, (p) => {
    pr.current = p;
    tl.current?.progress(p);
  });
}

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, className = "", style, label = "", w = 1400, h = 900 }: { i: number; className?: string; style?: CSSProperties; label?: string; w?: number; h?: number }) => <img src={scene(i, w, h, label)} alt="" className={`h-full w-full object-cover ${className}`} style={style} draggable={false} />;

/* ---------- M147 · Zoom parallax cluster (variant of M28: many images scale from one centre at different rates) ---------- */
// x / y: tile centre offset from the stage centre (% of stage width / height); w / h: tile size (%); s: final scale.
const M147_T = [
  { i: 0, x: 0, y: 0, w: 25, h: 25, s: 4, l: "ATELIER" },
  { i: 1, x: 2.5, y: -30, w: 30, h: 30, s: 5, l: "" },
  { i: 2, x: -27.5, y: -10, w: 20, h: 45, s: 6, l: "" },
  { i: 3, x: 27.5, y: 0, w: 25, h: 25, s: 5, l: "" },
  { i: 1, x: 5, y: 27.5, w: 20, h: 25, s: 6, l: "" },
  { i: 2, x: -22.5, y: 27.5, w: 30, h: 25, s: 8, l: "" },
  { i: 3, x: 22.5, y: 22.5, w: 15, h: 15, s: 9, l: "" },
];
function M147() {
  const root = useRef<HTMLDivElement>(null);
  useScrubTl(root, (tl, el) => {
    gsap.utils.toArray<HTMLElement>(".m147-w", el).forEach((w, k) => tl.fromTo(w, { scale: 1 }, { scale: M147_T[k].s, duration: 1 }, 0));
    tl.fromTo(".m147-intro", { opacity: 1, y: 0 }, { opacity: 0, y: -20, duration: 0.2 }, 0.04).fromTo(".m147-cap", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.24 }, 0.74);
  });
  return (
    <div ref={root} className="relative h-full w-full overflow-hidden rounded-[24px] bg-[#0d0a12]">
      <Glow code="m147" color="rgba(255,77,109,.4)" at="50% 50%" />
      {M147_T.map((t, k) => (
        <div key={k} className={`m147-w absolute inset-0 flex items-center justify-center will-change-transform ${k === 0 ? "z-10" : ""}`}>
          <div className="relative overflow-hidden rounded-[10px]" style={{ width: `${t.w}%`, height: `${t.h}%`, left: `${t.x}%`, top: `${t.y}%` }}>
            <Img i={t.i + k} w={900} h={700} label={t.l} />
          </div>
        </div>
      ))}
      <div className="m147-intro pointer-events-none absolute bottom-[6%] left-[4%] z-20">
        <p className="text-[13px] uppercase tracking-[0.2em] text-white/60">Studio Kessa · open atelier</p>
        <p className="mt-1 text-[clamp(28px,3vw,46px)] leading-none text-[#fff1e6]" style={{ fontFamily: EDITORIAL }}>
          Step closer.
        </p>
      </div>
      <div className="m147-cap pointer-events-none absolute inset-0 z-20 grid place-items-center text-center">
        <div>
          <p className="text-[clamp(56px,8vw,128px)] leading-[0.9] text-[#fff1e6] drop-shadow-[0_8px_40px_rgba(0,0,0,.55)]" style={{ fontFamily: SERIF, fontWeight: 500 }}>
            Made in the room.
          </p>
          <p className="mt-3 text-[16px] text-white/80">Open studio Sundays · pieces from ₹ 8,400</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- M148 · Full-bleed shrinks into bento (variant of M34: Flip tied to scroll, tiles fly in from their own sides) ---------- */
const M148_TILES = [
  { a: "a", i: 1, t: "Linen shirts", p: "₹ 2,900", from: { xPercent: -160, rotation: -8 } },
  { a: "b", i: 2, t: "Rain shells", p: "₹ 5,400", from: { yPercent: -180, rotation: 4 } },
  { a: "c", i: 3, t: "Field bags", p: "₹ 3,200", from: { xPercent: 160, rotation: 8 } },
  { a: "d", i: 0, t: "Cotton knits", p: "₹ 2,600", from: { xPercent: -160, rotation: 6 } },
  { a: "e", i: 1, t: "Sandals", p: "₹ 1,900", from: { xPercent: 160, rotation: -6 } },
  { a: "f", i: 2, t: "Hats", p: "₹ 1,200", from: { yPercent: 180, rotation: -5 } },
  { a: "g", i: 3, t: "Umbrellas", p: "₹ 1,600", from: { yPercent: 180, rotation: 5 } },
];
function M148() {
  const root = useRef<HTMLDivElement>(null);
  useScrubTl(
    root,
    (tl, el, plug) => {
      const Flip = plug as typeof FlipT;
      const hero = el.querySelector<HTMLElement>(".m148-hero")!;
      const full = el.querySelector<HTMLElement>(".m148-full")!;
      // hero sits in its bento slot (final layout); Flip measures what it takes to cover the whole stage, scroll plays it back
      const vars = Flip.fit(hero, full, { getVars: true }) as gsap.TweenVars;
      tl.from(hero, { ...vars, borderRadius: 0, duration: 0.7 }, 0)
        .fromTo(".m148-hero img", { scale: 1.25 }, { scale: 1, duration: 1 }, 0)
        .fromTo(".m148-big", { opacity: 1, scale: 1 }, { opacity: 0, scale: 0.8, duration: 0.3 }, 0.02);
      gsap.utils.toArray<HTMLElement>(".m148-tile", el).forEach((t, k) => {
        tl.fromTo(t, { ...M148_TILES[k].from, opacity: 0 }, { xPercent: 0, yPercent: 0, rotation: 0, opacity: 1, duration: 0.5 }, 0.24 + k * 0.035);
      });
      tl.fromTo(".m148-cap", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.2 }, 0.8);
    },
    () => loadPlugin("Flip"),
  );
  return (
    <div ref={root} className="relative grid h-full w-full place-items-center overflow-hidden rounded-[24px] bg-[#0c1410]">
      <Glow code="m148" color="rgba(24,196,143,.42)" at="50% 50%" />
      <div className="m148-full pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="relative grid h-[88%] w-[min(94%,1180px)] gap-[1vw]"
        style={{ gridTemplateAreas: '"a b b c" "a h h c" "d h h e" "d f g e"', gridTemplateColumns: "1fr 1.25fr 1.25fr 1fr", gridTemplateRows: "repeat(4,1fr)" }}
      >
        {M148_TILES.map((t) => (
          <figure key={t.a} className="m148-tile relative overflow-hidden rounded-[16px] will-change-transform" style={{ gridArea: t.a }}>
            <Img i={t.i} w={800} h={700} />
            <figcaption className="absolute bottom-3 left-4 right-4 flex justify-between text-[14px] font-[600] text-white/90" style={{ fontFamily: GROTESK }}>
              <span>{t.t}</span>
              <span className="text-white/70">{t.p}</span>
            </figcaption>
          </figure>
        ))}
        <div className="relative z-20" style={{ gridArea: "h" }}>
          <div className="m148-hero absolute inset-0 overflow-hidden rounded-[16px] will-change-transform">
            <Img i={0} w={1600} h={1000} />
            <p className="m148-big absolute inset-0 grid place-items-center text-[clamp(64px,10vw,160px)] font-[800] leading-none tracking-[-0.04em] text-[#f1fff4]" style={{ fontFamily: WIDE }}>
              MONSOON
            </p>
            <div className="m148-cap absolute bottom-4 left-5 text-[#f1fff4]">
              <p className="text-[clamp(22px,2vw,32px)] font-[700] leading-none" style={{ fontFamily: GROTESK }}>
                The Monsoon Edit
              </p>
              <p className="mt-1 text-[14px] text-white/75">42 pieces · from ₹ 1,200</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- M149 · Sticky half with image swap per block (variant of M42: one side pinned, the other scrolls) ---------- */
const M149_B = [
  { n: "01", t: "Teak lounge chair", d: "Oiled teak, woven cane back. Built to be sat in for decades.", p: "₹ 38,500", l: "TEAK" },
  { n: "02", t: "Cane daybed", d: "Hand-woven cane on a low frame. Long afternoons, sorted.", p: "₹ 64,000", l: "CANE" },
  { n: "03", t: "Brass floor lamp", d: "Spun brass shade, linen cord, a warm 2700K glow.", p: "₹ 12,800", l: "BRASS" },
  { n: "04", t: "Slub linen sofa", d: "Deep seat, washed slub linen, covers that come off.", p: "₹ 92,000", l: "LINEN" },
];
function M149() {
  const root = useRef<HTMLDivElement>(null);
  useScrubTl(root, (tl, el) => {
    const imgs = gsap.utils.toArray<HTMLElement>(".m149-img", el);
    const blocks = gsap.utils.toArray<HTMLElement>(".m149-b", el);
    tl.fromTo(".m149-col", { yPercent: 0 }, { yPercent: -75, duration: 1 }, 0);
    for (let k = 1; k < imgs.length; k++) {
      const at = k / 3 - 0.12;
      tl.fromTo(imgs[k], { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 0.16 }, at)
        .to(blocks[k - 1], { opacity: 0.25, duration: 0.16 }, at)
        .to(blocks[k], { opacity: 1, duration: 0.16 }, at);
    }
  });
  return (
    <div ref={root} className="relative h-full w-full overflow-hidden rounded-[24px] bg-[#16110c] text-[#f6efe4]">
      <Glow code="m149" color="rgba(224,145,63,.4)" at="70% 50%" />
      <div className="absolute bottom-0 left-0 top-0 w-1/2 p-[2.2%]">
        <div className="relative h-full w-full overflow-hidden rounded-[18px]">
          {M149_B.map((b, k) => (
            <div key={k} className="m149-img absolute inset-0 will-change-[opacity,transform]" style={k ? { opacity: 0 } : undefined}>
              <Img i={k + 3} w={1000} h={1000} label={b.l} />
            </div>
          ))}
        </div>
      </div>
      <div className="m149-col absolute right-0 top-[22%] h-[224%] w-1/2 will-change-transform">
        {M149_B.map((b, k) => (
          <div key={k} className="m149-b flex h-1/4 flex-col justify-center pl-[7%] pr-[9%]" style={{ opacity: k ? 0.25 : 1 }}>
            <p className="text-[13px] tracking-[0.2em] text-[#ffd59a]/70">{b.n} / 04</p>
            <h3 className="mt-2 text-[clamp(34px,3.6vw,58px)] leading-[0.95]" style={{ fontFamily: SERIF, fontWeight: 500 }}>
              {b.t}
            </h3>
            <p className="mt-3 max-w-[38ch] text-[16px] text-[#f6efe4]/70">{b.d}</p>
            <p className="mt-4 text-[17px] font-[700]" style={{ fontFamily: GROTESK }}>
              {b.p}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- M150 · Pinned side index drives image swap (one timeline with labels) ---------- */
const M150_W = [
  { w: "Origin", t: "Chikmagalur estate, 1,400 m", p: "Single estate · ₹ 690 / 250 g" },
  { w: "Roast", t: "Medium, 11 minutes, by hand", p: "Roasted every Monday" },
  { w: "Grind", t: "Burr-ground to your brewer", p: "Six grind settings" },
  { w: "Brew", t: "Pour-over at 93°C, 3:30", p: "Brew guide in the box" },
  { w: "Pour", t: "Cocoa, fig and a long finish", p: "Subscribe · ₹ 620 / month" },
];
function M150() {
  const root = useRef<HTMLDivElement>(null);
  useScrubTl(root, (tl, el) => {
    const items = gsap.utils.toArray<HTMLElement>(".m150-w", el);
    const cards = gsap.utils.toArray<HTMLElement>(".m150-card", el);
    const bar = el.querySelector<HTMLElement>(".m150-bar")!;
    const n = items.length;
    gsap.set(bar, { y: items[0].offsetTop, height: items[0].offsetHeight });
    tl.to({}, { duration: n }, 0).fromTo(".m150-fill", { scaleY: 0 }, { scaleY: 1, duration: n }, 0);
    for (let k = 0; k < n; k++) tl.addLabel(`s${k}`, k + 0.5);
    for (let k = 0; k < n - 1; k++) {
      const at = k + 0.75;
      tl.to(bar, { y: items[k + 1].offsetTop, duration: 0.5, ease: "power2.inOut" }, at)
        .to(items[k], { color: "rgba(234,245,255,.28)", x: 0, duration: 0.5 }, at)
        .to(items[k + 1], { color: "#ffb36b", x: 18, duration: 0.5 }, at)
        .fromTo(cards[k + 1], { yPercent: 115, y: 0, rotation: 7 }, { yPercent: 0, y: 0, rotation: 0, duration: 0.5, ease: "power2.out" }, at)
        .to(cards[k], { scale: 0.88, opacity: 0.3, yPercent: -6, duration: 0.5 }, at);
    }
  });
  return (
    <div ref={root} className="relative h-full w-full overflow-hidden rounded-[24px] bg-[#120b08] text-[#eaf5ff]">
      <Glow code="m150" color="rgba(255,138,61,.36)" at="72% 55%" />
      <div className="absolute bottom-[10%] left-[5%] top-[10%] flex w-[40%] items-center">
        <div className="absolute bottom-0 left-0 top-0 w-[3px] rounded-full bg-white/10">
          <div className="m150-fill h-full w-full origin-top rounded-full bg-[#ffb36b]/60" style={{ transform: "scaleY(0)" }} />
        </div>
        <div className="relative pl-[12%]">
          <div className="m150-bar absolute left-[3%] top-0 h-[1em] w-[6px] rounded-full bg-[#ffb36b]" />
          {M150_W.map((w, k) => (
            <p
              key={w.w}
              className="m150-w text-[clamp(44px,5.4vw,88px)] font-[700] leading-[1.02] tracking-[-0.03em]"
              style={{ fontFamily: GROTESK, color: k ? "rgba(234,245,255,.28)" : "#ffb36b", transform: k ? undefined : "translateX(18px)" }}
            >
              {w.w}
            </p>
          ))}
        </div>
      </div>
      <div className="absolute bottom-[8%] right-[6%] top-[8%] w-[38%]">
        {M150_W.map((w, k) => (
          <article
            key={w.w}
            className="m150-card absolute inset-0 overflow-hidden rounded-[22px] border border-white/10 bg-[#1d130d] shadow-[0_30px_80px_rgba(0,0,0,.5)] will-change-transform"
            style={k ? { transform: "translateY(115%)" } : undefined}
          >
            <div className="h-[68%]">
              <Img i={(k % 4) + 1} w={900} h={700} label={w.w.toUpperCase()} />
            </div>
            <div className="p-[6%]">
              <p className="text-[13px] uppercase tracking-[0.2em] text-[#ffd59a]/70">Kettle &amp; Kiln · step {k + 1}</p>
              <p className="mt-2 text-[clamp(20px,1.8vw,28px)] font-[600] leading-tight" style={{ fontFamily: GROTESK }}>
                {w.t}
              </p>
              <p className="mt-1 text-[15px] text-white/60">{w.p}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

/* ---------- M151 · Sticky copy + colour + card swap (variant of M10: the whole section colour follows the active item) ---------- */
const M151_I = [
  { t: "Cleanse", d: "A low-foam oat cleanser that leaves the barrier alone.", bg: "#1b0f2e", g: ["#7b2ff7", "#f2416b"], p: "₹ 890" },
  { t: "Tone", d: "Rice water and niacinamide, patted in with bare hands.", bg: "#0b2a24", g: ["#18c48f", "#c8ff8a"], p: "₹ 1,150" },
  { t: "Serum", d: "Ten drops of bakuchiol at night. Calm, not tight.", bg: "#2e1408", g: ["#ff8a3d", "#ffd59a"], p: "₹ 2,400" },
  { t: "Seal", d: "A squalane balm that melts on contact and stays put.", bg: "#0b1d33", g: ["#2f8cff", "#9fd8ff"], p: "₹ 1,700" },
];
function M151() {
  const root = useRef<HTMLDivElement>(null);
  useScrubTl(root, (tl, el) => {
    const items = gsap.utils.toArray<HTMLElement>(".m151-i", el);
    const cards = gsap.utils.toArray<HTMLElement>(".m151-card", el);
    tl.fromTo(".m151-col", { yPercent: 0 }, { yPercent: -75, duration: 1 }, 0);
    for (let k = 1; k < M151_I.length; k++) {
      const at = k / 3 - 0.13;
      tl.to(el, { backgroundColor: M151_I[k].bg, duration: 0.18 }, at)
        .fromTo(cards[k], { opacity: 0, scale: 1.1, rotation: -4 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.18 }, at)
        .to(items[k - 1], { opacity: 0.22, duration: 0.18 }, at)
        .to(items[k], { opacity: 1, duration: 0.18 }, at);
    }
  });
  return (
    <div ref={root} className="relative h-full w-full overflow-hidden rounded-[24px] text-[#f5f1ff]" style={{ backgroundColor: M151_I[0].bg }}>
      <Glow code="m151" color="rgba(255,255,255,.16)" at="70% 45%" />
      <div className="m151-col absolute left-0 top-[25%] h-[200%] w-[52%] will-change-transform">
        {M151_I.map((it, k) => (
          <div key={it.t} className="m151-i flex h-1/4 flex-col justify-center pl-[10%] pr-[6%]" style={{ opacity: k ? 0.22 : 1 }}>
            <p className="text-[13px] uppercase tracking-[0.22em] text-white/55">Velour Lab · step {k + 1} of 4</p>
            <h3 className="mt-2 text-[clamp(52px,6vw,96px)] leading-[0.9]" style={{ fontFamily: EDITORIAL }}>
              {it.t}
            </h3>
            <p className="mt-3 max-w-[34ch] text-[17px] text-white/70">{it.d}</p>
          </div>
        ))}
      </div>
      <div className="absolute bottom-[10%] right-[7%] top-[10%] w-[34%]">
        {M151_I.map((it, k) => (
          <div
            key={it.t}
            className="m151-card absolute inset-0 flex flex-col items-center justify-end overflow-hidden rounded-[26px] p-[7%] shadow-[0_30px_80px_rgba(0,0,0,.45)] will-change-[opacity,transform]"
            style={{ background: `linear-gradient(150deg, ${it.g[0]}, ${it.g[1]})`, opacity: k ? 0 : 1 }}
          >
            <Product angle={k} accent={it.g[0]} className="absolute left-[18%] top-[6%] h-[70%] w-[64%] drop-shadow-[0_30px_40px_rgba(0,0,0,.35)]" />
            <div className="relative w-full rounded-[16px] bg-black/25 px-5 py-3 backdrop-blur-sm">
              <p className="text-[18px] font-[700]" style={{ fontFamily: GROTESK }}>
                {it.t} · 50 ml
              </p>
              <p className="text-[15px] text-white/80">{it.p}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- M152 · Pinned full-bleed wipe slideshow (variant of M1: clip wipes bottom → top, title swaps in a mask) ---------- */
const M152_S = [
  { t: "The Salt Room", p: "Sea-facing suite · ₹ 24,000 / night", i: 0 },
  { t: "Night Garden", p: "Courtyard villa · ₹ 31,500 / night", i: 2 },
  { t: "Cedar Loft", p: "Two-level loft · ₹ 28,000 / night", i: 3 },
  { t: "Glass House", p: "Cliff pavilion · ₹ 46,000 / night", i: 1 },
];
function M152() {
  const root = useRef<HTMLDivElement>(null);
  useScrubTl(root, (tl, el) => {
    const slides = gsap.utils.toArray<HTMLElement>(".m152-s", el);
    const imgs = gsap.utils.toArray<HTMLElement>(".m152-i", el);
    const titles = gsap.utils.toArray<HTMLElement>(".m152-t", el);
    const nums = gsap.utils.toArray<HTMLElement>(".m152-n", el);
    for (let k = 1; k < slides.length; k++) {
      const at = k - 1 + 0.1;
      tl.fromTo(slides[k], { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: "power1.inOut" }, at)
        .fromTo(imgs[k], { scale: 1.25 }, { scale: 1, duration: 0.9 }, at)
        .to(imgs[k - 1], { yPercent: -10, duration: 0.9 }, at)
        .to([titles[k - 1], nums[k - 1]], { yPercent: -110, duration: 0.3, ease: "power2.in" }, at + 0.3)
        .fromTo([titles[k], nums[k]], { yPercent: 110, autoAlpha: 1 }, { yPercent: 0, autoAlpha: 1, duration: 0.3, ease: "power2.out" }, at + 0.55);
    }
  });
  return (
    <div ref={root} className="relative h-full w-full overflow-hidden rounded-[24px] bg-[#0b1020] text-[#fff6e8]">
      {M152_S.map((s, k) => (
        <div key={s.t} className="m152-s absolute inset-0 overflow-hidden will-change-[clip-path]" style={k ? { clipPath: "inset(100% 0% 0% 0%)" } : undefined}>
          <Img i={s.i} w={1600} h={1000} className="m152-i will-change-transform" />
        </div>
      ))}
      <Glow code="m152" color="rgba(255,179,107,.22)" at="30% 70%" />
      <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute bottom-[8%] left-[5%] right-[5%] flex items-end justify-between gap-6">
        <div>
          <p className="text-[13px] uppercase tracking-[0.22em] text-white/65">Casa Albura · rooms</p>
          <div className="relative mt-2 overflow-hidden">
            {M152_S.map((s, k) => (
              <div key={s.t} className={`m152-t ${k ? "absolute inset-x-0 top-0" : "relative"}`} style={k ? { visibility: "hidden" } : undefined}>
                <p className="whitespace-nowrap text-[clamp(52px,7vw,112px)] leading-[1] tracking-[-0.01em]" style={{ fontFamily: EDITORIAL }}>
                  {s.t}
                </p>
                <p className="mt-1 text-[16px] text-white/75">{s.p}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative overflow-hidden text-[clamp(28px,2.6vw,40px)] font-[600] tabular-nums" style={{ fontFamily: GROTESK }}>
          {M152_S.map((s, k) => (
            <p key={s.t} className={`m152-n ${k ? "absolute inset-0" : "relative"}`} style={k ? { visibility: "hidden" } : undefined}>
              0{k + 1}
              <span className="text-white/45"> / 04</span>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- M153 · Horizontal gallery with inner image parallax (variant of M11: photos slide inside their windows) ---------- */
const M153_C = [
  { t: "Coral linen set", p: "₹ 4,800", i: 1 },
  { t: "Dune overshirt", p: "₹ 3,400", i: 3 },
  { t: "Lagoon swim short", p: "₹ 2,200", i: 0 },
  { t: "Palm cord trouser", p: "₹ 3,900", i: 2 },
  { t: "Tide knit polo", p: "₹ 2,700", i: 1 },
  { t: "Sunset rope sandal", p: "₹ 1,950", i: 3 },
];
function M153() {
  const root = useRef<HTMLDivElement>(null);
  const geo = useRef<{ D: number; S: number; cards: { L: number; W: number }[] }>({ D: 0, S: 0, cards: [] });
  const last = useRef(0);
  const apply = (p: number) => {
    const el = root.current;
    if (!el) return;
    const track = el.querySelector<HTMLElement>(".m153-track");
    const imgs = el.querySelectorAll<HTMLElement>(".m153-img");
    const { D, S, cards } = geo.current;
    if (!track || !cards.length) return;
    const x = -D * p;
    track.style.transform = `translate3d(${x}px,0,0)`;
    imgs.forEach((img, k) => {
      const c = cards[k];
      // 0 when the card enters on the right, 1 when it leaves on the left; the photo travels the other way inside its window
      const t = clamp01((S - (c.L + x)) / (S + c.W));
      img.style.transform = `translate3d(${(t * 2 - 1) * 13}%,0,0)`;
    });
    const bar = el.querySelector<HTMLElement>(".m153-bar");
    if (bar) bar.style.transform = `scaleX(${p})`;
  };
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const measure = () => {
      const cards = Array.from(el.querySelectorAll<HTMLElement>(".m153-card"));
      const S = el.clientWidth;
      const lastC = cards[cards.length - 1];
      geo.current = { S, D: Math.max(0, lastC.offsetLeft + lastC.offsetWidth + S * 0.05 - S), cards: cards.map((c) => ({ L: c.offsetLeft, W: c.offsetWidth })) };
      apply(last.current);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useScrub(root, (p) => {
    last.current = p;
    apply(p);
  });
  return (
    <div ref={root} className="relative h-full w-full overflow-hidden rounded-[24px] bg-[#0b1418] text-[#eafaff]">
      <Glow code="m153" color="rgba(47,196,180,.34)" at="40% 50%" />
      <div className="absolute left-[5%] right-[5%] top-[6%] flex items-end justify-between">
        <p className="text-[clamp(30px,3vw,48px)] font-[700] leading-none tracking-[-0.02em]" style={{ fontFamily: GROTESK }}>
          The Summer Edit
        </p>
        <div className="h-[3px] w-[22%] overflow-hidden rounded-full bg-white/15">
          <div className="m153-bar h-full w-full origin-left bg-[#5fe0cf]" style={{ transform: "scaleX(0)" }} />
        </div>
      </div>
      <div className="m153-track absolute bottom-[7%] left-0 top-[20%] flex gap-[2vw] pl-[5%] will-change-transform">
        {M153_C.map((c) => (
          <figure key={c.t} className="m153-card relative h-full w-[clamp(260px,27vw,420px)] shrink-0">
            <div className="relative h-[84%] overflow-hidden rounded-[18px]">
              <div className="m153-img absolute bottom-0 top-0 w-[140%] -left-[20%] will-change-transform">
                <Img i={c.i} w={1100} h={900} />
              </div>
            </div>
            <figcaption className="mt-3 flex justify-between text-[16px]" style={{ fontFamily: MANROPE }}>
              <span className="font-[600]">{c.t}</span>
              <span className="text-white/60">{c.p}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

/* ---------- M154 · One gesture = one section (GSAP Observer; auto-advances for filming) ---------- */
const M154_S = [
  { k: "Studio Merak", t: "Rooms that hold the light.", c: "View houses", i: 3 },
  { k: "Residential · 14 homes", t: "Built slow, on purpose.", c: "Read the process", i: 0 },
  { k: "Book a site visit", t: "Start with a walk.", c: "Fees from ₹ 4 lakh", i: 2 },
];
function M154() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    let dead = false;
    let on = false;
    let cur = 0;
    let busy = false;
    let timer: gsap.core.Tween | null = null;
    let tl: gsap.core.Timeline | null = null;
    let obs: { kill: () => void } | null = null;
    const ctx = gsap.context(() => {}, el);
    const slides = gsap.utils.toArray<HTMLElement>(".m154-s", el);
    const dots = gsap.utils.toArray<HTMLElement>(".m154-dot", el);
    const go = (dir: 1 | -1, auto: boolean) => {
      if (busy) return;
      busy = true;
      timer?.kill();
      const n = slides.length;
      const next = (cur + dir + n) % n;
      const a = slides[cur];
      const b = slides[next];
      ctx.add(() => {
        tl = gsap
          .timeline({
            defaults: { ease: "power3.inOut" },
            onComplete: () => {
              busy = false;
              cur = next;
              schedule();
            },
          })
          .set(a, { zIndex: 1 })
          .set(b, { zIndex: 2 })
          .fromTo(b, { yPercent: 100 * dir, y: 0 }, { yPercent: 0, y: 0, duration: 1 }, 0)
          .fromTo(a, { yPercent: 0, y: 0 }, { yPercent: -30 * dir, duration: 1 }, 0)
          .fromTo(a.querySelector(".m154-dim"), { opacity: 0 }, { opacity: 0.7, duration: 1 }, 0)
          .fromTo(b.querySelector(".m154-dim"), { opacity: 0.5 }, { opacity: 0, duration: 1 }, 0)
          .fromTo(b.querySelectorAll(".m154-c"), { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: "power3.out" }, 0.4)
          .to(dots, { scaleY: (k) => (k === next ? 1 : 0.35), opacity: (k) => (k === next ? 1 : 0.4), duration: 0.5 }, 0.2);
        // fake gesture: the scroll cue's wheel dot flicks down when the demo advances by itself
        if (auto) tl.fromTo(".m154-wheel", { y: 0, opacity: 1 }, { y: 10, opacity: 0, duration: 0.45, ease: "power2.out" }, 0).set(".m154-wheel", { y: 0, opacity: 1 }, 0.7);
      });
    };
    const schedule = () => {
      timer?.kill();
      timer = null;
      if (on && !dead) timer = gsap.delayedCall(0.25, () => go(1, true));
    };
    const io = new IntersectionObserver(
      ([e]) => {
        on = e.isIntersecting;
        if (on) {
          if (busy) tl?.play();
          else schedule();
        } else {
          timer?.kill();
          tl?.pause();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    loadPlugin("Observer").then((O) => {
      if (dead) return;
      // real wheel / swipe over the demo moves exactly one section; gestures during a transition are ignored
      obs = O.create({ target: el, type: "wheel,touch", wheelSpeed: -1, tolerance: 30, onDown: () => go(-1, false), onUp: () => go(1, false) });
    });
    return () => {
      dead = true;
      io.disconnect();
      timer?.kill();
      obs?.kill();
      ctx.revert();
    };
  }, []);
  return (
    <div ref={root} className="relative h-full w-full overflow-hidden rounded-[24px] bg-[#0a0d14] text-[#fff6e8]">
      {M154_S.map((s, k) => (
        <section key={s.t} className="m154-s absolute inset-0 overflow-hidden will-change-transform" style={k ? { transform: "translateY(100%)" } : undefined}>
          <Img i={s.i} w={1600} h={1000} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent" />
          <div className="absolute bottom-[12%] left-[6%] max-w-[60%]">
            <p className="m154-c text-[13px] uppercase tracking-[0.22em] text-[#ffd59a]/85">{s.k}</p>
            <h3 className="m154-c mt-3 text-[clamp(48px,6vw,96px)] leading-[0.95]" style={{ fontFamily: SERIF, fontWeight: 500 }}>
              {s.t}
            </h3>
            <p className="m154-c mt-5 inline-flex rounded-full border border-white/40 px-6 py-3 text-[15px] font-[600]">{s.c}</p>
          </div>
          <div className="m154-dim pointer-events-none absolute inset-0 bg-black opacity-0" />
        </section>
      ))}
      <Glow code="m154" color="rgba(255,213,154,.2)" at="70% 40%" className="z-[3] mix-blend-screen" />
      <div className="absolute right-[4%] top-1/2 z-[4] flex -translate-y-1/2 flex-col gap-2">
        {M154_S.map((s, k) => (
          <span key={s.t} className="m154-dot block h-8 w-[3px] origin-center rounded-full bg-[#fff6e8]" style={{ transform: `scaleY(${k ? 0.35 : 1})`, opacity: k ? 0.4 : 1 }} />
        ))}
      </div>
      <div className="absolute bottom-[5%] right-[4%] z-[4] flex items-center gap-3 text-[13px] text-white/70">
        <span>One scroll · one section</span>
        <span className="relative block h-9 w-6 rounded-full border-2 border-white/60">
          <span className="m154-wheel absolute left-1/2 top-[6px] -ml-[2px] block h-2 w-[4px] rounded-full bg-white" />
        </span>
      </div>
    </div>
  );
}

/* ---------- M155 · Footer revealed underneath (CSS variable driven by scroll) ---------- */
const M155_CSS = `.m155{--m155-p:0}
.m155-body{transform:translate3d(0,calc(var(--m155-p) * -100%),0)}
.m155-foot{transform:translate3d(0,calc((1 - var(--m155-p)) * 34%),0) scale(calc(.94 + var(--m155-p) * .06));opacity:calc(.3 + var(--m155-p) * .7)}
.m155-shade{opacity:calc(1 - var(--m155-p))}`;
function M155() {
  const root = useRef<HTMLDivElement>(null);
  useScrub(root, (p) => root.current?.style.setProperty("--m155-p", p.toFixed(4)));
  return (
    <div ref={root} className="m155 relative h-full w-full overflow-hidden rounded-[24px] bg-[#e9e1d3]">
      <style>{M155_CSS}</style>
      {/* the footer sits underneath, fixed in the stage */}
      <footer className="absolute inset-0 flex flex-col justify-between bg-[#1f1712] p-[4%] text-[#f3e9da]">
        <Glow code="m155" color="rgba(224,145,63,.42)" at="50% 80%" />
        <div className="m155-foot relative flex h-full flex-col justify-between will-change-transform">
          <div className="grid grid-cols-3 gap-8 text-[15px]" style={{ fontFamily: MANROPE }}>
            <div>
              <p className="text-[13px] uppercase tracking-[0.2em] text-[#ffd59a]/70">Shop</p>
              <p className="mt-3">Tableware</p>
              <p>Vases</p>
              <p>Gift cards</p>
            </div>
            <div>
              <p className="text-[13px] uppercase tracking-[0.2em] text-[#ffd59a]/70">Studio</p>
              <p className="mt-3">Workshops</p>
              <p>Journal</p>
              <p>Stockists</p>
            </div>
            <div>
              <p className="text-[13px] uppercase tracking-[0.2em] text-[#ffd59a]/70">Letters</p>
              <p className="mt-3 max-w-[28ch] text-white/70">One kiln diary a month. No spam, no sales every day.</p>
              <p className="mt-3 inline-flex rounded-full bg-[#f3e9da] px-5 py-2 font-[600] text-[#1f1712]">Join · it&apos;s free</p>
            </div>
          </div>
          <div>
            <p className="whitespace-nowrap text-[clamp(90px,15vw,230px)] font-[800] leading-[0.8] tracking-[-0.05em]" style={{ fontFamily: WIDE }}>
              OSTRA
            </p>
            <p className="mt-4 text-[13px] text-white/50">Concept website by Studio Halden · sample prices</p>
          </div>
        </div>
        <div className="m155-shade pointer-events-none absolute inset-0 bg-black/70" />
      </footer>
      {/* the page body lifts away */}
      <div className="m155-body absolute inset-0 z-10 flex flex-col justify-center rounded-b-[36px] bg-[#e9e1d3] px-[6%] text-[#1f1712] shadow-[0_40px_80px_rgba(0,0,0,.55)] will-change-transform">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-b-[36px]">
          <Glow code="m155b" color="rgba(224,145,63,.3)" at="75% 40%" />
        </div>
        <p className="relative text-[13px] uppercase tracking-[0.2em] text-[#8a5a2b]">Ostra Ceramics · last firing of the season</p>
        <h3 className="relative mt-3 max-w-[16ch] text-[clamp(48px,6vw,96px)] leading-[0.92]" style={{ fontFamily: SERIF, fontWeight: 500 }}>
          Take the long table home.
        </h3>
        <div className="relative mt-8 flex gap-4">
          {[
            ["Ash dinner plate", "₹ 1,400"],
            ["Kiln mug", "₹ 950"],
            ["Salt bowl set", "₹ 2,200"],
          ].map(([t, p], k) => (
            <div key={t} className="flex items-center gap-3 rounded-full bg-[#1f1712]/[0.07] py-2 pl-2 pr-5">
              <span className="block h-10 w-10 overflow-hidden rounded-full">
                <Img i={k + 1} w={200} h={200} />
              </span>
              <span className="text-[15px] font-[600]">{t}</span>
              <span className="text-[15px] text-[#1f1712]/60">{p}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- M156 · Liquid level rises in bottle, velocity slosh (variant of M26: a liquid level with physics) ---------- */
const M156_BOTTLE = "M170 40 H230 V140 C230 172 300 186 300 240 V540 Q300 570 270 570 H130 Q100 570 100 540 V240 C100 186 170 172 170 140 Z";
const M156_TOP = 172;
const M156_BOT = 566;
function m156Path(level: number, tilt: number, amp: number, t: number) {
  const base = M156_BOT - level * (M156_BOT - M156_TOP);
  let d = "";
  for (let x = 90; x <= 310; x += 10) {
    const y = base + tilt * (x - 200) + amp * Math.sin(x * 0.035 + t * 3) + amp * 0.5 * Math.sin(x * 0.07 - t * 2.1);
    d += `${x === 90 ? "M" : "L"}${x} ${y.toFixed(2)} `;
  }
  return `${d}L310 600 L90 600 Z`;
}
const M156_BUBBLES = Array.from({ length: 12 }, (_, k) => ({ x: 118 + ((k * 37) % 168), r: 2 + (k % 3), dur: 2.4 + (k % 4) * 0.55, delay: -(k * 0.37) }));
const M156_CSS = `.m156-b{animation:m156-rise var(--d) linear infinite;animation-delay:var(--dl)}
@keyframes m156-rise{0%{transform:translate3d(0,0,0);opacity:0}10%{opacity:.85}100%{transform:translate3d(6px,-400px,0);opacity:.85}}
html.is-static .m156-b{animation:none}html.is-static {.m156-b{animation:none}}`;
function M156() {
  const root = useRef<HTMLDivElement>(null);
  const liq = useRef<SVGPathElement>(null);
  const clip = useRef<SVGPathElement>(null);
  const shine = useRef<SVGPathElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const s = useRef({ p: 0, target: 0, vel: 0, tilt: 0, tiltV: 0, t: 0 });
  const draw = () => {
    const st = s.current;
    const d = m156Path(st.p, st.tilt, 2.5 + Math.min(14, Math.abs(st.tilt) * 70 + Math.abs(st.vel) * 10), st.t);
    liq.current?.setAttribute("d", d);
    clip.current?.setAttribute("d", d);
    shine.current?.setAttribute("d", m156Path(st.p, st.tilt, 2.5 + Math.abs(st.tilt) * 40, st.t + 0.6));
    if (num.current) num.current.textContent = String(Math.round(st.p * 750));
  };
  useScrub(
    root,
    (p, v) => {
      const st = s.current;
      st.target = p;
      st.vel = v;
      if (prefersReducedMotion()) {
        st.p = p;
        draw();
      }
    },
    { finalValue: 0.86 },
  );
  useTicker(root, (_t, dt) => {
    const st = s.current;
    const k = Math.min(dt, 0.05);
    st.t += k;
    st.p += (st.target - st.p) * Math.min(1, k * 9);
    st.vel *= Math.exp(-k * 5);
    // spring: the surface tilts against the scroll direction, overshoots and settles when scrolling stops
    st.tiltV += ((-st.vel * 0.32 - st.tilt) * 70 - st.tiltV * 4.5) * k;
    st.tilt += st.tiltV * k;
    draw();
  });
  const d0 = m156Path(0.86, 0, 2.5, 0);
  return (
    <div ref={root} className="relative h-full w-full overflow-hidden rounded-[24px] bg-[#140d07] text-[#fff1e0]">
      <style>{M156_CSS}</style>
      <Glow code="m156" color="rgba(240,170,80,.42)" at="62% 55%" />
      <div className="absolute left-[6%] top-1/2 max-w-[38%] -translate-y-1/2">
        <p className="text-[13px] uppercase tracking-[0.22em] text-[#ffd59a]/70">Amarelle · almond spirit</p>
        <h3 className="mt-3 text-[clamp(44px,5vw,84px)] leading-[0.92]" style={{ fontFamily: SERIF, fontWeight: 500 }}>
          Poured slow, to the brim.
        </h3>
        <p className="mt-5 text-[clamp(40px,4vw,64px)] font-[700] leading-none tabular-nums" style={{ fontFamily: GROTESK }}>
          <span ref={num}>645</span>
          <span className="text-[0.45em] text-white/55"> / 750 ml</span>
        </p>
        <p className="mt-2 text-[15px] text-white/60">₹ 3,200 · 28% vol</p>
      </div>
      <svg className="absolute bottom-[3%] right-[10%] top-[3%] h-[94%] w-auto" viewBox="0 0 400 600" aria-label="Bottle filling">
        <defs>
          <clipPath id="m156-bottle">
            <path d={M156_BOTTLE} />
          </clipPath>
          <clipPath id="m156-liq">
            <path ref={clip} d={d0} />
          </clipPath>
          <linearGradient id="m156-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#f6b24a" />
            <stop offset="1" stopColor="#9a4a12" />
          </linearGradient>
          <linearGradient id="m156-glass" x1="0" x2="1">
            <stop offset="0" stopColor="#fff" stopOpacity=".1" />
            <stop offset=".25" stopColor="#fff" stopOpacity=".28" />
            <stop offset=".4" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#fff" stopOpacity=".06" />
          </linearGradient>
        </defs>
        <g clipPath="url(#m156-bottle)">
          <rect width="400" height="600" fill="#ffffff" opacity=".04" />
          <path ref={liq} d={d0} fill="url(#m156-fill)" />
          <path ref={shine} d={d0} fill="none" stroke="#ffe2a8" strokeWidth="3" opacity=".7" />
          <g clipPath="url(#m156-liq)">
            {M156_BUBBLES.map((b, k) => (
              <circle key={k} className="m156-b" cx={b.x} cy={560} r={b.r} fill="#fff3d6" opacity=".85" style={{ "--d": `${b.dur}s`, "--dl": `${b.delay}s` } as CSSProperties} />
            ))}
          </g>
          <rect width="400" height="600" fill="url(#m156-glass)" />
        </g>
        <path d={M156_BOTTLE} fill="none" stroke="#fff1e0" strokeOpacity=".75" strokeWidth="3" />
        {[0.25, 0.5, 0.75].map((f) => {
          const y = M156_BOT - f * (M156_BOT - M156_TOP);
          return (
            <g key={f} opacity=".55">
              <line x1="304" x2="320" y1={y} y2={y} stroke="#fff1e0" strokeWidth="2" />
              <text x="326" y={y + 5} fontSize="14" fill="#fff1e0" style={{ fontFamily: GROTESK }}>
                {Math.round(f * 750)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ---------- M157 · Flavour gradient crossfade by block (variant of M10: two-colour gradient leads each block, no pin) ---------- */
const M157_F = [
  { n: "Blood Orange", d: "Sicilian orange, a pinch of salt.", g: ["#ff5a36", "#ffb347"], ink: "#2a0d05", a: "#ff5a36" },
  { n: "Yuzu Mint", d: "Bright yuzu, cold garden mint.", g: ["#b7f36b", "#2fc58f"], ink: "#062216", a: "#2fc58f" },
  { n: "Wild Berry", d: "Jamun, blackberry, a dry finish.", g: ["#7b2ff7", "#f2416b"], ink: "#fff1f6", a: "#7b2ff7" },
  { n: "Cold Brew Tonic", d: "Coffee, quinine, long bubbles.", g: ["#3b2416", "#c8894d"], ink: "#fff3e6", a: "#c8894d" },
];
function M157() {
  const root = useRef<HTMLDivElement>(null);
  useScrubTl(root, (tl, el) => {
    const layers = gsap.utils.toArray<HTMLElement>(".m157-g", el);
    tl.fromTo(".m157-col", { yPercent: 0 }, { yPercent: -75, duration: 1 }, 0);
    // colour leads: each gradient lands halfway between two blocks, before the next can is centred
    for (let k = 1; k < layers.length; k++) tl.fromTo(layers[k], { opacity: 0 }, { opacity: 1, duration: 0.14 }, (k - 0.5) / 3 - 0.07);
    gsap.utils.toArray<HTMLElement>(".m157-p", el).forEach((p, k) => tl.fromTo(p, { rotation: -10, yPercent: 8 }, { rotation: 8, yPercent: -8, duration: 0.5 }, Math.max(0, k / 3 - 0.25)));
  });
  return (
    <div ref={root} className="relative h-full w-full overflow-hidden rounded-[24px]">
      {M157_F.map((f, k) => (
        <div key={f.n} className="m157-g absolute inset-0" style={{ background: `linear-gradient(135deg, ${f.g[0]}, ${f.g[1]})`, opacity: k ? 0 : 1 }} />
      ))}
      <Glow code="m157" color="rgba(255,255,255,.3)" at="35% 40%" />
      <div className="m157-col absolute inset-x-0 top-0 h-[400%] will-change-transform">
        {M157_F.map((f, k) => (
          <div key={f.n} className={`flex h-1/4 items-center gap-[5%] px-[8%] ${k % 2 ? "flex-row-reverse text-right" : ""}`} style={{ color: f.ink }}>
            <div className="h-[82%] w-[26%] shrink-0">
              <Product angle={k} accent={f.a} className="m157-p h-full w-full drop-shadow-[0_30px_40px_rgba(0,0,0,.3)] will-change-transform" />
            </div>
            <div>
              <p className="text-[13px] font-[700] uppercase tracking-[0.22em] opacity-70">Fizzwell · sparkling · 0{k + 1}</p>
              <h3 className="mt-2 text-[clamp(56px,7vw,112px)] font-[800] leading-[0.9] tracking-[-0.03em]" style={{ fontFamily: WIDE }}>
                {f.n}
              </h3>
              <p className="mt-3 text-[18px] opacity-80">{f.d}</p>
              <p className="mt-4 text-[18px] font-[700]" style={{ fontFamily: GROTESK }}>
                ₹ 120 · 330 ml · 6-pack ₹ 660
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- M158 · Bottle rolls across on scroll (variant of M35: rolling without slipping, label turns on the cylinder) ---------- */
// Flat-lay view: the bottle lies on the table (cap up the screen) and rolls sideways. Rotation = distance / radius;
// the label is a texture wrapped on the cylinder and re-projected column by column on a 2D canvas.
type M158G = { W: number; H: number; dpr: number; R: number; Rn: number; top: number; neckEnd: number; bodyTop: number; bodyEnd: number; tex: HTMLCanvasElement | null; neck: HTMLCanvasElement | null };
function m158Textures(g: M158G) {
  const { dpr, R, Rn } = g;
  const bodyLen = (g.bodyEnd - g.bodyTop) * dpr;
  const C = Math.max(4, Math.round(2 * Math.PI * R * dpr));
  const tex = document.createElement("canvas");
  tex.width = C;
  tex.height = Math.max(4, Math.round(bodyLen));
  const c = tex.getContext("2d")!;
  c.fillStyle = "#1d3a2a";
  c.fillRect(0, 0, C, tex.height);
  // glass seams so the roll reads on the bare glass too
  c.fillStyle = "rgba(200,255,220,.18)";
  c.fillRect(C * 0.97, 0, 2 * dpr, tex.height);
  c.fillRect(C * 0.47, 0, 2 * dpr, tex.height * 0.16);
  // front label
  const ly = tex.height * 0.2;
  const lh = tex.height * 0.55;
  c.fillStyle = "#efe6d2";
  c.fillRect(0, ly, C * 0.5, lh);
  c.fillStyle = "#a3241c";
  c.fillRect(0, ly + lh * 0.06, C * 0.5, 3 * dpr);
  c.fillRect(0, ly + lh * 0.94 - 3 * dpr, C * 0.5, 3 * dpr);
  c.fillStyle = "#1a120c";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.font = `800 ${Math.round(R * dpr * 0.42)}px 'Syne Variable', 'Space Grotesk Variable', sans-serif`;
  c.fillText("HALCYONE", C * 0.25, ly + lh * 0.42, C * 0.46);
  c.font = `600 ${Math.round(R * dpr * 0.2)}px 'Space Grotesk Variable', sans-serif`;
  c.fillText("AMARO · 700 ML", C * 0.25, ly + lh * 0.66, C * 0.44);
  // back label
  c.fillStyle = "#d9cdb4";
  c.fillRect(C * 0.62, ly + lh * 0.25, C * 0.24, lh * 0.5);
  c.fillStyle = "#3a2a1c";
  c.font = `600 ${Math.round(R * dpr * 0.16)}px 'Space Grotesk Variable', sans-serif`;
  c.fillText("BATCH 12", C * 0.74, ly + lh * 0.5, C * 0.22);
  // neck: gold foil with stripes
  const Cn = Math.max(4, Math.round(2 * Math.PI * Rn * dpr));
  const neck = document.createElement("canvas");
  neck.width = Cn;
  neck.height = Math.max(4, Math.round((g.neckEnd - g.top) * dpr));
  const n = neck.getContext("2d")!;
  n.fillStyle = "#c99a3c";
  n.fillRect(0, 0, Cn, neck.height);
  n.fillStyle = "#7a1c16";
  for (let k = 0; k < 6; k++) n.fillRect((k / 6) * Cn, 0, Cn / 18, neck.height);
  n.fillStyle = "#1d3a2a";
  n.fillRect(0, neck.height * 0.62, Cn, neck.height * 0.38);
  g.tex = tex;
  g.neck = neck;
}
function m158Cyl(ctx: CanvasRenderingContext2D, src: HTMLCanvasElement, cx: number, y0: number, h: number, r: number, d: number, dpr: number) {
  const cols = Math.max(8, Math.round(2 * r * dpr));
  const C = src.width;
  const Rd = r * dpr;
  for (let k = 0; k < cols; k++) {
    const u0 = (k / cols) * 2 - 1;
    const u1 = ((k + 1) / cols) * 2 - 1;
    const th = Math.asin((u0 + u1) / 2);
    const sw = Math.max(1, Rd * (Math.asin(u1) - Math.asin(u0)));
    let sx = (((th * Rd - d * dpr) % C) + C) % C;
    if (sx + sw > C) sx = C - sw;
    ctx.drawImage(src, sx, 0, sw, src.height, (cx - r) * dpr + k * ((2 * Rd) / cols), y0 * dpr, (2 * Rd) / cols + 0.6, h * dpr);
  }
}
function m158Outline(ctx: CanvasRenderingContext2D, g: M158G, cx: number) {
  const { R, Rn, top, neckEnd, bodyTop, bodyEnd } = g;
  ctx.beginPath();
  ctx.moveTo(cx - Rn, top);
  ctx.lineTo(cx + Rn, top);
  ctx.lineTo(cx + Rn, neckEnd);
  ctx.bezierCurveTo(cx + Rn, neckEnd + (bodyTop - neckEnd) * 0.5, cx + R, bodyTop - (bodyTop - neckEnd) * 0.35, cx + R, bodyTop);
  ctx.lineTo(cx + R, bodyEnd - R * 0.25);
  ctx.quadraticCurveTo(cx + R, bodyEnd, cx + R * 0.75, bodyEnd);
  ctx.lineTo(cx - R * 0.75, bodyEnd);
  ctx.quadraticCurveTo(cx - R, bodyEnd, cx - R, bodyEnd - R * 0.25);
  ctx.lineTo(cx - R, bodyTop);
  ctx.bezierCurveTo(cx - R, bodyTop - (bodyTop - neckEnd) * 0.35, cx - Rn, neckEnd + (bodyTop - neckEnd) * 0.5, cx - Rn, neckEnd);
  ctx.closePath();
}
function M158() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const shadow = useRef<HTMLDivElement>(null);
  const turns = useRef<HTMLSpanElement>(null);
  const last = useRef(0.5);
  const g = useRef<M158G>({ W: 0, H: 0, dpr: 1, R: 0, Rn: 0, top: 0, neckEnd: 0, bodyTop: 0, bodyEnd: 0, tex: null, neck: null });
  const draw = (p: number) => {
    const canvas = cv.current;
    const G = g.current;
    if (!canvas || !G.tex || !G.neck) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const x0 = G.W * 0.1;
    const cx = x0 + G.W * 0.8 * p;
    const d = cx - x0; // distance rolled = arc length turned (no slipping)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(G.dpr, G.dpr);
    m158Outline(ctx, G, cx);
    ctx.fillStyle = "#1d3a2a";
    ctx.fill();
    ctx.clip();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    m158Cyl(ctx, G.tex, cx, G.bodyTop, G.bodyEnd - G.bodyTop, G.R, d, G.dpr);
    m158Cyl(ctx, G.neck, cx, G.top, G.neckEnd - G.top, G.Rn, d * (G.Rn / G.R), G.dpr); // same turn angle, smaller radius
    ctx.scale(G.dpr, G.dpr);
    // fixed light: the shading never turns, only the surface under it does
    const sh = ctx.createLinearGradient(cx - G.R, 0, cx + G.R, 0);
    sh.addColorStop(0, "rgba(0,0,0,.6)");
    sh.addColorStop(0.28, "rgba(255,255,255,.22)");
    sh.addColorStop(0.36, "rgba(255,255,255,.04)");
    sh.addColorStop(0.7, "rgba(0,0,0,.18)");
    sh.addColorStop(1, "rgba(0,0,0,.65)");
    ctx.fillStyle = sh;
    ctx.fillRect(cx - G.R, G.top, 2 * G.R, G.bodyEnd - G.top);
    ctx.restore();
    if (shadow.current) shadow.current.style.transform = `translate3d(${cx}px,0,0)`;
    if (turns.current) turns.current.textContent = `${Math.round(((d / G.R) * 180) / Math.PI)}°`;
  };
  useEffect(() => {
    const el = root.current;
    const canvas = cv.current;
    if (!el || !canvas) return;
    let dead = false;
    const measure = () => {
      const W = el.clientWidth;
      const H = el.clientHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      const L = H * 0.7;
      const top = H * 0.05;
      const R = L * 0.135;
      g.current = { W, H, dpr, R, Rn: R * 0.36, top, neckEnd: top + L * 0.24, bodyTop: top + L * 0.36, bodyEnd: top + L, tex: null, neck: null };
      if (shadow.current) {
        shadow.current.style.top = `${top + L * 0.1}px`;
        shadow.current.style.height = `${L * 0.92}px`;
        shadow.current.style.width = `${R * 2.3}px`;
        shadow.current.style.marginLeft = `${-R * 0.95}px`;
      }
      m158Textures(g.current);
      draw(last.current);
    };
    document.fonts?.ready.then(() => !dead && measure());
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      dead = true;
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useScrub(
    root,
    (p) => {
      last.current = p;
      draw(p);
    },
    { finalValue: 0.5 },
  );
  return (
    <div
      ref={root}
      className="relative h-full w-full overflow-hidden rounded-[24px] text-[#f3e6d4]"
      style={{ background: "repeating-linear-gradient(90deg,#2a1d14 0 46px,#2e2016 46px 92px)" }}
    >
      <Glow code="m158" color="rgba(255,190,120,.3)" at="50% 40%" />
      <div ref={shadow} className="pointer-events-none absolute left-0 rounded-[50%] bg-black/55 blur-[18px] will-change-transform" />
      <canvas ref={cv} className="absolute inset-0 h-full w-full" aria-label="Bottle rolling across the table" />
      <div className="absolute bottom-[5%] left-[5%] right-[5%] flex items-end justify-between">
        <div>
          <p className="text-[13px] uppercase tracking-[0.22em] text-[#ffd59a]/70">Amaro Halcyone · 700 ml</p>
          <p className="mt-1 text-[clamp(30px,3.2vw,52px)] leading-none" style={{ fontFamily: EDITORIAL }}>
            Rolled out, never rushed. <span className="text-[#ffd59a]">₹ 2,450</span>
          </p>
        </div>
        <p className="text-[15px] text-white/60 tabular-nums" style={{ fontFamily: GROTESK }}>
          turned <span ref={turns}>0°</span>
        </p>
      </div>
    </div>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M147", name: "Zoom parallax cluster", how: "Scroll: seven images scale up from one centre at different rates; the outer ones fly past the edges while the centre one fills the frame.", kind: "scrub", C: M147 },
  { code: "M148", name: "Full-bleed shrinks into bento", how: "Scroll: one full-frame image shrinks (Flip) into the centre tile of a bento grid while the other tiles fly in from their own sides.", kind: "scrub", C: M148 },
  { code: "M149", name: "Sticky half with image swap per block", how: "Scroll: the left image half stays put while the right blocks scroll; each block reaching the centre crossfades the image to its picture.", kind: "scrub", C: M149 },
  { code: "M150", name: "Pinned side index drives image swap", how: "Scroll: the highlight bar steps down a word list while the cards on the right deal in, one per word (one timeline with labels).", kind: "scrub", C: M150 },
  { code: "M151", name: "Sticky copy + colour + card swap", how: "Scroll: the copy scrolls on the left; as each item becomes active the whole section colour crossfades and the sticky card swaps.", kind: "scrub", C: M151 },
  { code: "M152", name: "Pinned full-bleed wipe slideshow", how: "Scroll: each full-bleed photo wipes up over the last with a clip-path inset while the title and counter swap in a mask.", kind: "scrub", C: M152 },
  { code: "M153", name: "Horizontal gallery with inner image parallax", how: "Scroll: the row slides sideways and every photo drifts the other way inside its window.", kind: "scrub", C: M153 },
  { code: "M154", name: "One gesture = one section", how: "Auto (or one wheel / swipe): exactly one full-screen section per gesture; the old one slides up and dims, the new one's content staggers in.", kind: "play", C: M154 },
  { code: "M155", name: "Footer revealed underneath", how: "Scroll: the page body lifts away to uncover the footer sitting underneath, whose content drifts up as it is revealed.", kind: "scrub", C: M155 },
  { code: "M156", name: "Liquid level rises in bottle (velocity slosh)", how: "Scroll: the bottle fills; the wavy surface tilts and sloshes with scroll speed and settles when you stop, bubbles rising.", kind: "scrub", C: M156 },
  { code: "M157", name: "Flavour gradient crossfade by block", how: "Scroll: as each flavour block passes, the full background gradient crossfades to that flavour's two colours, just ahead of the can.", kind: "scrub", C: M157 },
  { code: "M158", name: "Bottle rolls across on scroll", how: "Scroll: a bottle lying on the table rolls across without slipping (turn = distance / radius); its label turns on the glass, shadow following.", kind: "scrub", C: M158 },
];
