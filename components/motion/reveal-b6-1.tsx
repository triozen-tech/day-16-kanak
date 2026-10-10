"use client";

// MOTION-MENU M230–M241 (reveal group, batch 6 · group 1): small focused demos for /lab/motion.
// Every demo is "play": it starts when on screen, loops, and pauses off screen. Each one also has a CSS-only glow loop
// (and a second one on top when photos / canvas cover the stage). ?static=1 / reduced motion: no JS motion, the markup
// shows the final state.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, loadPlugin, prefersReducedMotion } from "@/lib/gsap";
import { scene } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const GROTESK = "'Space Grotesk Variable', system-ui, sans-serif";
const SERIF = "'Fraunces Variable', Georgia, serif";
const EDITORIAL = "'Instrument Serif', Georgia, serif";
const WIDE = "'Syne Variable', 'Space Grotesk Variable', system-ui, sans-serif";
const BODY = "'Manrope Variable', system-ui, sans-serif";

const CSS = `
.b6r1-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.5)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.22)),transparent 70%);animation:b6r1-drift 5.2s linear infinite alternate;will-change:transform}
@keyframes b6r1-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b6r1-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4);pointer-events:none;z-index:40}
.b6r1-chip{transition:background-color .3s,color .3s,border-color .3s}
.b6r1-chip.on{background:var(--chip,#f4e9d8);color:#121016;border-color:var(--chip,#f4e9d8)}
.m238-ring{position:absolute;left:50%;top:100%;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;border:2px solid var(--pin,#ffb36b);animation:m238-pulse 1.8s ease-out infinite;animation-delay:var(--d,0s);pointer-events:none}
@keyframes m238-pulse{0%{transform:scale(.3);opacity:.9}100%{transform:scale(2.4);opacity:0}}
.m238-head{width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:var(--pin,#ffb36b);box-shadow:0 6px 18px rgba(0,0,0,.45)}
.m238-head::after{content:"";position:absolute;inset:8px;border-radius:50%;background:#0d0f17}
html.is-static .b6r1-glow,html.is-static .m238-ring{animation:none}
html.is-static .m238-ring{opacity:0}
html.is-static {.b6r1-glow,.m238-ring{animation:none}.m238-ring{opacity:0}}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", bg = "#0a0d16", g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; bg?: string; g1?: string; g2?: string }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 text-[#eef2ff] ${className}`} style={{ background: bg }}>
      <style href="b6r1-css" precedence="default">
        {CSS}
      </style>
      <div className="b6r1-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/** The CSS glow loop again, ON TOP of photos / canvas (screen blend), so busy demos never freeze. */
const Sheen = ({ g1 }: { g1?: string }) => (
  <div className="b6r1-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.45, zIndex: 35 } as CSSProperties} aria-hidden />
);

/** Play: a looping timeline that starts when the demo is on screen and pauses off screen. Nothing runs with reduced motion. */
function usePlay(root: RefObject<HTMLDivElement | null>, build: (el: HTMLDivElement) => gsap.core.Timeline) {
  const fn = useRef(build);
  fn.current = build;
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    let tl: gsap.core.Timeline | null = null;
    let on = false;
    let dead = false;
    const ctx = gsap.context(() => {}, el);
    const io = new IntersectionObserver(
      ([e]) => {
        on = e.isIntersecting;
        if (on) tl?.play();
        else tl?.pause();
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    Promise.resolve(document.fonts?.ready).then(() => {
      if (dead) return;
      ctx.add(() => {
        tl = fn.current(el);
        if (on) tl.play();
        else tl.pause();
      });
    });
    return () => {
      dead = true;
      io.disconnect();
      ctx.revert();
    };
  }, [root]);
}

/** rAF loop (gsap ticker) that only runs while the element is on screen; dt in seconds, clamped. */
function useOnScreenLoop(root: RefObject<HTMLElement | null>, setup: (el: HTMLElement) => { tick: (dt: number) => void; dispose?: () => void } | null) {
  const fn = useRef(setup);
  fn.current = setup;
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    let on = false;
    let dead = false;
    let api: { tick: (dt: number) => void; dispose?: () => void } | null = null;
    const io = new IntersectionObserver(([e]) => (on = e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    const t = (_time: number, dt: number) => {
      if (on && api) api.tick(Math.min(dt / 1000, 1 / 30));
    };
    Promise.resolve(document.fonts?.ready).then(() => {
      if (dead) return;
      api = fn.current(el);
      gsap.ticker.add(t);
    });
    return () => {
      dead = true;
      io.disconnect();
      gsap.ticker.remove(t);
      api?.dispose?.();
    };
  }, [root]);
}

const all = (root: Element, sel: string) => [...root.querySelectorAll<HTMLElement>(sel)];
const inr = (n: number) => `₹ ${n.toLocaleString("en-IN")}`;
const setChips = (el: Element, k: number) => all(el, ".b6r1-chip").forEach((c, j) => c.classList.toggle("on", j === k));

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, className = "", style, label = "", w = 1200, h = 900 }: { i: number; className?: string; style?: CSSProperties; label?: string; w?: number; h?: number }) => (
  <img src={scene(i, w, h, label)} alt="" className={`h-full w-full object-cover ${className}`} style={style} draggable={false} />
);

const Chips = ({ items, color }: { items: string[]; color: string }) => (
  <div className="flex flex-wrap gap-2" style={{ "--chip": color } as CSSProperties}>
    {items.map((d, k) => (
      <span key={d} className={`b6r1-chip rounded-full border border-white/25 px-3.5 py-1.5 text-[13px] text-white/80 ${k === 0 ? "on" : ""}`} style={{ fontFamily: GROTESK }}>
        {d}
      </span>
    ))}
  </div>
);

/* ---------- M230 · Grid items enter in 3D (variant of M31: one 3D entrance style per grid, six styles cycling) ---------- */
type Style3D = { label: string; from: gsap.TweenVars; origin: string; ease: string };
const M230_STYLES: Style3D[] = [
  { label: "Fly up", from: { y: 220, rotationX: -28, autoAlpha: 0 }, origin: "50% 100%", ease: "power3.out" },
  { label: "Rotate in on X", from: { rotationX: -110, z: -260, autoAlpha: 0 }, origin: "50% 0%", ease: "power3.out" },
  { label: "Helix", from: { rotationY: -300, y: 120, scale: 0.7, autoAlpha: 0 }, origin: "50% 50%", ease: "power2.out" },
  { label: "Fall from above", from: { y: -320, rotation: -9, autoAlpha: 0 }, origin: "50% 50%", ease: "power3.out" },
  { label: "Pop", from: { scale: 0.15, autoAlpha: 0 }, origin: "50% 50%", ease: "back.out(2.2)" },
  { label: "Flip on Y", from: { rotationY: 92, autoAlpha: 0 }, origin: "0% 50%", ease: "power3.out" },
];
const M230_TO = { x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, rotation: 0, scale: 1, autoAlpha: 1 };
function M230() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const tiles = all(el, ".m230-t");
    const tl = gsap.timeline({ repeat: -1 });
    M230_STYLES.forEach((s, k) => {
      tl.call(() => setChips(el, k))
        .set(tiles, { transformOrigin: s.origin })
        .fromTo(tiles, s.from, { ...M230_TO, duration: 0.75, ease: s.ease, stagger: 0.07 })
        .to(tiles, { autoAlpha: 0, scale: 0.92, duration: 0.25, ease: "power2.in", stagger: 0.025 }, "+=0.12");
    });
    return tl;
  });
  return (
    <Stage r={root} bg="#0d0b14" g1="rgba(150,120,255,.5)" g2="rgba(255,140,190,.22)">
      <div className="absolute left-[6%] top-[10%] w-[28%]">
        <p className="text-[13px] uppercase tracking-[0.22em] text-white/55" style={{ fontFamily: BODY }}>
          Studio Vetra · Autumn objects
        </p>
        <h3 className="mt-3 text-[clamp(40px,4.4vw,70px)] leading-[0.95] text-[#f2ecff]" style={{ fontFamily: SERIF, fontWeight: 500 }}>
          Eight pieces, one entrance.
        </h3>
        <p className="mt-4 text-[15px] leading-relaxed text-white/55" style={{ fontFamily: BODY }}>
          Each grid picks a single 3D style.
        </p>
        <div className="mt-6">
          <Chips items={M230_STYLES.map((s) => s.label)} color="#d9ccff" />
        </div>
      </div>
      <div className="absolute bottom-[10%] right-[5%] top-[10%] grid w-[58%] grid-cols-4 grid-rows-2 gap-4" style={{ perspective: "1100px" }}>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="m230-t relative overflow-hidden rounded-[16px] border border-white/10 will-change-transform" style={{ backfaceVisibility: "hidden" }}>
            <Img i={i % 4} w={500} h={620} style={{ filter: `hue-rotate(${200 + i * 17}deg) saturate(.9)` }} />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/70 to-transparent p-3 text-[13px]" style={{ fontFamily: GROTESK }}>
              <span>Vessel {String(i + 1).padStart(2, "0")}</span>
              <span className="text-white/70">{inr(2400 + i * 650)}</span>
            </div>
          </div>
        ))}
      </div>
      <Sheen g1="rgba(150,120,255,.5)" />
    </Stage>
  );
}

/* ---------- M231 · Group flip-down (variant of M31: cards hinge up from lying flat, on a spring) ---------- */
const M231_CARDS = [
  { t: "Morning", d: "Sencha · yuzu peel", p: 640 },
  { t: "Noon", d: "Oolong · roasted rice", p: 720 },
  { t: "Dusk", d: "Hojicha · cacao nib", p: 690 },
  { t: "Night", d: "Chamomile · lavender", p: 580 },
];
function M231() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const cards = all(el, ".m231-c");
    const shadows = all(el, ".m231-sh");
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(cards, { transformOrigin: "50% 100%" })
      .fromTo(cards, { rotationX: -90 }, { rotationX: 0, duration: 1.15, ease: "elastic.out(1,0.55)", stagger: 0.12 }, 0)
      .fromTo(shadows, { scaleY: 2.4, opacity: 0.15 }, { scaleY: 1, opacity: 0.6, duration: 0.8, ease: "power2.out", stagger: 0.12 }, 0)
      .to(cards, { rotationX: -90, duration: 0.42, ease: "power2.in", stagger: 0.06 }, "+=0.2")
      .to(shadows, { scaleY: 2.4, opacity: 0.15, duration: 0.42, ease: "power2.in", stagger: 0.06 }, "<");
    return tl;
  });
  return (
    <Stage r={root} bg="#0c1210" g1="rgba(120,200,150,.5)" g2="rgba(240,210,140,.2)">
      <div className="absolute left-0 right-0 top-[9%] text-center">
        <p className="text-[13px] uppercase tracking-[0.24em] text-[#cfe8d6]/60" style={{ fontFamily: BODY }}>
          Kettle & Leaf · The day in four cups
        </p>
        <h3 className="mt-3 text-[clamp(40px,4.6vw,72px)] leading-[0.95] text-[#eef8f0]" style={{ fontFamily: EDITORIAL }}>
          Picked up off the table.
        </h3>
      </div>
      <div className="absolute bottom-[10%] left-[8%] right-[8%] top-[36%] flex items-end justify-center gap-6" style={{ perspective: "900px" }}>
        {M231_CARDS.map((c, i) => (
          <div key={c.t} className="relative h-full flex-1">
            <div className="m231-sh absolute -bottom-3 left-[6%] right-[6%] h-6 rounded-[50%] bg-black/70 blur-md" style={{ transformOrigin: "50% 0%", opacity: 0.6 }} />
            <div className="m231-c relative flex h-full flex-col overflow-hidden rounded-[18px] border border-white/10 bg-[#16201b] will-change-transform">
              <div className="relative flex-1 overflow-hidden">
                <Img i={(i + 2) % 4} w={500} h={400} style={{ filter: `hue-rotate(${i * 25}deg)` }} />
              </div>
              <div className="flex items-end justify-between p-4">
                <div>
                  <p className="text-[22px] text-[#eef8f0]" style={{ fontFamily: SERIF, fontWeight: 500 }}>
                    {c.t}
                  </p>
                  <p className="mt-1 text-[13px] text-white/55" style={{ fontFamily: BODY }}>
                    {c.d}
                  </p>
                </div>
                <span className="text-[15px] text-[#bfe6c9]" style={{ fontFamily: GROTESK }}>
                  {inr(c.p)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Sheen g1="rgba(120,200,150,.45)" />
    </Stage>
  );
}

/* ---------- M232 · Slit-in (variant of M31: enters from deep Z as a thin slit, vertical / horizontal / diagonal) ---------- */
const M232_DIRS: { label: string; from: gsap.TweenVars }[] = [
  { label: "Vertical slit", from: { z: -800, rotationY: 90 } },
  { label: "Horizontal slit", from: { z: -800, rotationX: 90 } },
  { label: "Diagonal slit", from: { z: -800, rotationY: 90, rotation: 45 } },
];
function M232() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const card = el.querySelector(".m232-card");
    const flash = el.querySelector(".m232-flash");
    const tl = gsap.timeline({ repeat: -1 });
    M232_DIRS.forEach((d, k) => {
      tl.call(() => setChips(el, k))
        .fromTo(card, { ...d.from, autoAlpha: 1 }, { z: 0, rotationX: 0, rotationY: 0, rotation: 0, duration: 0.85, ease: "expo.out" })
        .fromTo(flash, { opacity: 0 }, { opacity: 0.55, duration: 0.22, ease: "power2.out", yoyo: true, repeat: 1 }, "<0.12")
        .to(card, { z: -500, autoAlpha: 0, duration: 0.3, ease: "power2.in" }, "+=0.2");
    });
    return tl;
  });
  return (
    <Stage r={root} bg="#0f0b0a" g1="rgba(255,120,80,.5)" g2="rgba(255,210,150,.22)">
      <div className="absolute left-[6%] top-1/2 w-[34%]" style={{ transform: "translateY(-50%)" }}>
        <p className="text-[13px] uppercase tracking-[0.22em] text-[#ffd2b5]/60" style={{ fontFamily: BODY }}>
          Ember Audio · Drop 03
        </p>
        <h3 className="mt-3 text-[clamp(44px,5vw,80px)] font-[800] uppercase leading-[0.9] tracking-[-0.02em] text-[#fff1e6]" style={{ fontFamily: WIDE }}>
          Opens like a slit.
        </h3>
        <div className="mt-7">
          <Chips items={M232_DIRS.map((d) => d.label)} color="#ffd2b5" />
        </div>
      </div>
      <div className="absolute bottom-[10%] right-[8%] top-[10%] flex w-[42%] items-center justify-center" style={{ perspective: "1000px" }}>
        <div className="m232-card relative aspect-[4/5] h-full overflow-hidden rounded-[22px] border border-white/15 will-change-transform">
          <Img i={1} w={800} h={1000} label="EMBER ONE" />
          <div className="m232-flash absolute inset-0 bg-[#ffe3cc] mix-blend-screen" style={{ opacity: 0 }} />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/70 to-transparent p-5" style={{ fontFamily: GROTESK }}>
            <span className="text-[18px]">Ember One · open-back</span>
            <span className="text-[18px] text-[#ffb36b]">{inr(18990)}</span>
          </div>
        </div>
      </div>
    </Stage>
  );
}

/* ---------- M233 · Tilt-in (variant of M31: slides in rotated 30° and skewed from a side, straightening as it lands) ---------- */
const M233_DIRS: { label: string; from: gsap.TweenVars }[] = [
  { label: "From top", from: { rotationY: 30, y: -300, skewY: -30 } },
  { label: "From right", from: { rotationX: -30, x: 300, skewX: 30 } },
  { label: "From bottom", from: { rotationY: 30, y: 300, skewY: 30 } },
  { label: "From left", from: { rotationX: -30, x: -300, skewX: -30 } },
];
function M233() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const card = el.querySelector(".m233-card");
    const tl = gsap.timeline({ repeat: -1 });
    M233_DIRS.forEach((d, k) => {
      tl.call(() => setChips(el, k))
        .fromTo(card, { ...d.from, autoAlpha: 0 }, { x: 0, y: 0, rotationX: 0, rotationY: 0, skewX: 0, skewY: 0, autoAlpha: 1, duration: 0.7, ease: "power3.out" })
        .to(card, { autoAlpha: 0, scale: 0.94, duration: 0.24, ease: "power2.in" }, "+=0.22")
        .set(card, { scale: 1 });
    });
    return tl;
  });
  return (
    <Stage r={root} bg="#0a0f17" g1="rgba(80,170,255,.5)" g2="rgba(255,220,120,.2)">
      <div className="absolute left-[6%] top-[12%] w-[34%]">
        <p className="text-[13px] uppercase tracking-[0.22em] text-[#bcd9ff]/60" style={{ fontFamily: BODY }}>
          Monsoon sale · this week only
        </p>
        <h3 className="mt-3 text-[clamp(42px,4.8vw,76px)] font-[700] leading-[0.92] tracking-[-0.03em] text-[#eef5ff]" style={{ fontFamily: GROTESK }}>
          Lands straight.
        </h3>
        <p className="mt-4 max-w-[34ch] text-[15px] leading-relaxed text-white/55" style={{ fontFamily: BODY }}>
          Tilted 30° and skewed on the way in, square on arrival.
        </p>
        <div className="mt-6">
          <Chips items={M233_DIRS.map((d) => d.label)} color="#bcd9ff" />
        </div>
      </div>
      <div className="absolute bottom-[12%] right-[10%] top-[12%] flex w-[38%] items-center justify-center" style={{ perspective: "900px" }}>
        <div className="m233-card relative flex h-full w-full flex-col overflow-hidden rounded-[22px] border border-white/15 bg-[#121a26] will-change-transform">
          <div className="relative flex-1">
            <Img i={0} w={900} h={700} label="RAINLINE" />
            <span className="absolute left-4 top-4 rounded-full bg-[#ffdc78] px-3 py-1 text-[13px] font-[600] text-[#1a1408]" style={{ fontFamily: GROTESK }}>
              −30%
            </span>
          </div>
          <div className="flex items-end justify-between p-5" style={{ fontFamily: GROTESK }}>
            <div>
              <p className="text-[22px] font-[600]">Rainline Shell Jacket</p>
              <p className="mt-1 text-[13px] text-white/50">Seam-sealed · 3 colours</p>
            </div>
            <div className="text-right">
              <p className="text-[13px] text-white/40 line-through">{inr(8990)}</p>
              <p className="text-[20px] text-[#ffdc78]">{inr(6290)}</p>
            </div>
          </div>
        </div>
      </div>
    </Stage>
  );
}

/* ---------- M234 · Masonry drop-in (variant of M32: blur → sharp from a direction, then a Flip reflow 4 ↔ 3 columns) ---------- */
const M234_H = [1.3, 0.9, 1.1, 1.4, 0.8, 1.2, 1, 1.35, 0.85, 1.15, 1.25, 0.95];
type Box = { l: number; t: number; w: number; h: number };
/** Masonry layout in percent of the container: each tile goes to the shortest column; tallest column fills 100%. */
function m234Layout(cols: number): Box[] {
  const gx = 1.6;
  const gy = 0.06;
  const w = (100 - gx * (cols - 1)) / cols;
  const colH = new Array(cols).fill(0);
  const raw = M234_H.map((h) => {
    const c = colH.indexOf(Math.min(...colH));
    const box = { c, t: colH[c], h };
    colH[c] += h + gy;
    return box;
  });
  const tall = Math.max(...colH) - gy;
  return raw.map((b) => ({ l: b.c * (w + gx), t: (b.t / tall) * 100, w, h: (b.h / tall) * 100 }));
}
const M234_DIRS: { label: string; from: (i: number) => gsap.TweenVars }[] = [
  { label: "From bottom", from: () => ({ y: 140 }) },
  { label: "From top", from: () => ({ y: -140 }) },
  { label: "From left", from: () => ({ x: -180 }) },
  { label: "Random", from: (i) => ({ x: Math.sin(i * 2.3) * 160, y: Math.cos(i * 1.7) * 140 }) },
];
type FlipMod = Awaited<ReturnType<typeof loadPlugin<"Flip">>>;
function M234() {
  const root = useRef<HTMLDivElement>(null);
  const flip = useRef<FlipMod | null>(null);
  useEffect(() => {
    let dead = false;
    loadPlugin("Flip").then((f) => {
      if (!dead) flip.current = f;
    });
    return () => {
      dead = true;
      const el = root.current;
      if (el) gsap.killTweensOf(all(el, ".m234-t"));
    };
  }, []);
  usePlay(root, (el) => {
    const tiles = all(el, ".m234-t");
    let cols = 4;
    const place = (n: number) => m234Layout(n).forEach((b, i) => Object.assign(tiles[i].style, { left: `${b.l}%`, top: `${b.t}%`, width: `${b.w}%`, height: `${b.h}%` }));
    const reflow = () => {
      cols = cols === 4 ? 3 : 4;
      const F = flip.current;
      if (F) {
        const st = F.getState(tiles);
        place(cols);
        F.from(st, { duration: 0.7, ease: "power3.inOut" });
      } else {
        m234Layout(cols).forEach((b, i) => gsap.to(tiles[i], { left: `${b.l}%`, top: `${b.t}%`, width: `${b.w}%`, height: `${b.h}%`, duration: 0.7, ease: "power3.inOut" }));
      }
    };
    const tl = gsap.timeline({ repeat: -1 });
    M234_DIRS.forEach((d, k) => {
      tl.call(() => setChips(el, k))
        .fromTo(
          tiles,
          { autoAlpha: 0, filter: "blur(14px)", x: (i: number) => Number(d.from(i).x ?? 0), y: (i: number) => Number(d.from(i).y ?? 0) },
          { autoAlpha: 1, filter: "blur(0px)", x: 0, y: 0, duration: 0.7, ease: "power3.out", stagger: k === 3 ? { each: 0.045, from: "random" } : 0.045 },
        )
        .call(reflow, undefined, "+=0.05")
        .to({}, { duration: 0.72 })
        .to(tiles, { autoAlpha: 0, filter: "blur(10px)", duration: 0.28, ease: "power2.in", stagger: 0.02 });
    });
    return tl;
  });
  const start = m234Layout(4);
  return (
    <Stage r={root} bg="#100d0b" g1="rgba(255,170,110,.5)" g2="rgba(190,150,255,.2)">
      <div className="absolute left-[5%] top-[10%] w-[30%]">
        <p className="text-[13px] uppercase tracking-[0.22em] text-[#ffd9bd]/60" style={{ fontFamily: BODY }}>
          Clay Room · Lookbook 12
        </p>
        <h3 className="mt-3 text-[clamp(40px,4.4vw,70px)] leading-[0.95] text-[#fff3e8]" style={{ fontFamily: SERIF, fontWeight: 500 }}>
          Drops in sharp, reflows soft.
        </h3>
        <p className="mt-4 max-w-[34ch] text-[15px] leading-relaxed text-white/55" style={{ fontFamily: BODY }}>
          Blur to sharp from one side, then the wall re-packs 4 ↔ 3 columns.
        </p>
        <div className="mt-6">
          <Chips items={M234_DIRS.map((d) => d.label)} color="#ffd9bd" />
        </div>
      </div>
      <div className="absolute bottom-[7%] right-[4%] top-[7%] w-[58%]">
        {start.map((b, i) => (
          <div key={i} className="m234-t absolute overflow-hidden rounded-[14px] will-change-transform" style={{ left: `${b.l}%`, top: `${b.t}%`, width: `${b.w}%`, height: `${b.h}%` }}>
            <Img i={(i + 3) % 4} w={500} h={650} style={{ filter: `hue-rotate(${(i * 29) % 120}deg)` }} />
            <span className="absolute bottom-2 left-2.5 text-[12px] text-white/80" style={{ fontFamily: GROTESK }}>
              {inr(1890 + i * 420)}
            </span>
          </div>
        ))}
      </div>
      <Sheen g1="rgba(255,170,110,.5)" />
    </Stage>
  );
}

/* ---------- M235 · Self-feeding list (variant of M34: a new card springs in at the top every second, the oldest fades out) ---------- */
const M235_FEED = [
  { who: "Aarav K.", what: "Linen overshirt · sand", p: 3490, city: "Pune" },
  { who: "Meera S.", what: "Clay mug set of 4", p: 1980, city: "Kochi" },
  { who: "Kabir R.", what: "Trail runner · moss", p: 7450, city: "Jaipur" },
  { who: "Ishita P.", what: "Cold brew kit", p: 2290, city: "Indore" },
  { who: "Rohan D.", what: "Wool throw · rust", p: 4150, city: "Shimla" },
  { who: "Tara V.", what: "Hand-block tote", p: 1290, city: "Surat" },
  { who: "Neel A.", what: "Brass desk lamp", p: 5890, city: "Mysuru" },
  { who: "Zoya H.", what: "Silk scrunchie trio", p: 890, city: "Lucknow" },
  { who: "Dev M.", what: "Cast-iron skillet", p: 3190, city: "Nagpur" },
  { who: "Anika B.", what: "Matcha starter tin", p: 1490, city: "Goa" },
];
const M235_SLOT = 92;
const M235_N = 6;
function M235() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(
    () => () => {
      const el = root.current;
      if (el) gsap.killTweensOf(all(el, ".m235-c"));
    },
    [],
  );
  usePlay(root, (el) => {
    const cards = all(el, ".m235-c");
    const slot = cards.map((_, i) => i);
    let next = M235_N;
    const fill = (c: HTMLElement, k: number) => {
      const d = M235_FEED[k % M235_FEED.length];
      const q = (s: string) => c.querySelector(s);
      q(".m235-a")!.textContent = d.who[0];
      q(".m235-n")!.textContent = `${d.who} ordered`;
      q(".m235-w")!.textContent = `${d.what} · ${d.city}`;
      q(".m235-p")!.textContent = inr(d.p);
    };
    gsap.set(cards, { y: (i: number) => i * M235_SLOT, autoAlpha: (i: number) => (i < M235_N - 1 ? 1 : 0), scale: 1, transformOrigin: "50% 0%" });
    const step = () => {
      cards.forEach((c, i) => {
        if (slot[i] === M235_N - 1) {
          slot[i] = 0;
          fill(c, next++);
          gsap.set(c, { y: 0, zIndex: 2 });
          gsap.fromTo(c, { scale: 0.9, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.65, ease: "back.out(1.8)", overwrite: true });
        } else {
          slot[i] += 1;
          const out = slot[i] === M235_N - 1;
          gsap.to(c, { y: slot[i] * M235_SLOT, autoAlpha: out ? 0 : 1, zIndex: 1, duration: 0.7, ease: "power3.out", overwrite: true });
        }
      });
    };
    const tl = gsap.timeline({ repeat: -1 });
    tl.call(step).to({}, { duration: 1 });
    return tl;
  });
  return (
    <Stage r={root} bg="#0b0e14" g1="rgba(100,220,180,.5)" g2="rgba(120,140,255,.22)">
      <div className="absolute left-[7%] top-1/2 w-[36%]" style={{ transform: "translateY(-50%)" }}>
        <p className="text-[13px] uppercase tracking-[0.22em] text-[#a8f0d6]/60" style={{ fontFamily: BODY }}>
          Live from the shop floor
        </p>
        <h3 className="mt-3 text-[clamp(42px,4.8vw,76px)] font-[700] leading-[0.92] tracking-[-0.03em] text-[#effff8]" style={{ fontFamily: GROTESK }}>
          Orders, as they happen.
        </h3>
        <p className="mt-5 text-[15px] text-white/55" style={{ fontFamily: BODY }}>
          1,284 parcels packed this week
        </p>
      </div>
      <div
        className="absolute right-[8%] top-[8%] w-[40%]"
        style={{ height: M235_SLOT * (M235_N - 1), WebkitMaskImage: "linear-gradient(#000 70%, transparent)", maskImage: "linear-gradient(#000 70%, transparent)" }}
      >
        {Array.from({ length: M235_N }, (_, i) => {
          const d = M235_FEED[i];
          return (
            <div
              key={i}
              className="m235-c absolute inset-x-0 top-0 flex h-[78px] items-center gap-4 rounded-[18px] border border-white/10 bg-[#141a24]/90 px-5 shadow-[0_10px_30px_rgba(0,0,0,.35)] will-change-transform"
              style={{ transform: `translateY(${i * M235_SLOT}px)`, visibility: i < M235_N - 1 ? "visible" : "hidden" }}
            >
              <span className="m235-a grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#64dcb4] text-[18px] font-[700] text-[#06231a]" style={{ fontFamily: GROTESK }}>
                {d.who[0]}
              </span>
              <div className="min-w-0 flex-1" style={{ fontFamily: BODY }}>
                <p className="m235-n truncate text-[16px] font-[600] text-white">{d.who} ordered</p>
                <p className="m235-w truncate text-[13px] text-white/50">
                  {d.what} · {d.city}
                </p>
              </div>
              <span className="m235-p text-[16px] text-[#a8f0d6]" style={{ fontFamily: GROTESK }}>
                {inr(d.p)}
              </span>
            </div>
          );
        })}
      </div>
    </Stage>
  );
}

/* ---------- M236 · Gravity tag pile (variant of M34: tags drop, collide and pile up on a canvas; the pointer pushes them) ---------- */
const M236_TAGS = ["Small batch", "₹ 499", "Organic", "New drop", "Hand-poured", "Vegan", "Gift-ready", "Bestseller", "Oat milk", "Free shipping", "Limited", "Refill", "Cold brew", "Single origin"];
type Body = { x: number; y: number; w: number; h: number; vx: number; vy: number; a: number; on: boolean; t: string; k: number };
function M236() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const still = useRef<HTMLDivElement>(null);
  useOnScreenLoop(root, () => {
    const c = cv.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return null;
    if (still.current) still.current.style.display = "none";
    let W = 1;
    let H = 1;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const size = () => {
      const r = c.getBoundingClientRect();
      W = Math.max(1, r.width);
      H = Math.max(1, r.height);
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(c);
    const FONT = "600 19px 'Space Grotesk Variable', system-ui, sans-serif";
    ctx.font = FONT;
    let bodies: Body[] = [];
    const reset = () => {
      ctx.font = FONT;
      bodies = M236_TAGS.map((t, k) => {
        const w = ctx.measureText(t).width + 44;
        return { x: w / 2 + ((k * 0.618 * 997) % 1) * Math.max(1, W - w), y: -40, w, h: 48, vx: 0, vy: 0, a: 0, on: false, t, k };
      });
    };
    reset();
    const ptr = { x: -999, y: -999, px: -999, py: -999, realUntil: 0 };
    let clock = 0;
    let time = 0;
    const onMove = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      ptr.x = e.clientX - r.left;
      ptr.y = e.clientY - r.top;
      ptr.realUntil = clock + 1.5;
    };
    c.addEventListener("pointermove", onMove);
    const CYCLE = 6.4;
    const G = 2400;
    const solve = (floor: boolean) => {
      for (let it = 0; it < 4; it++) {
        for (let i = 0; i < bodies.length; i++) {
          const a = bodies[i];
          if (!a.on) continue;
          for (let j = i + 1; j < bodies.length; j++) {
            const b = bodies[j];
            if (!b.on) continue;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const ox = (a.w + b.w) / 2 - Math.abs(dx);
            const oy = (a.h + b.h) / 2 - Math.abs(dy);
            if (ox <= 0 || oy <= 0) continue;
            if (oy < ox) {
              const s = dy > 0 ? 1 : -1;
              a.y -= (s * oy) / 2;
              b.y += (s * oy) / 2;
              const rel = (b.vy - a.vy) * s;
              if (rel < 0) {
                const jv = (-(1 + 0.1) * rel) / 2;
                a.vy -= jv * s;
                b.vy += jv * s;
              }
              const m = (a.vx + b.vx) / 2;
              a.vx += (m - a.vx) * 0.15;
              b.vx += (m - b.vx) * 0.15;
            } else {
              const s = dx > 0 ? 1 : -1;
              a.x -= (s * ox) / 2;
              b.x += (s * ox) / 2;
              const rel = (b.vx - a.vx) * s;
              if (rel < 0) {
                const jv = (-(1 + 0.2) * rel) / 2;
                a.vx -= jv * s;
                b.vx += jv * s;
              }
            }
          }
        }
        for (const b of bodies) {
          if (!b.on) continue;
          if (b.x - b.w / 2 < 0) {
            b.x = b.w / 2;
            b.vx = Math.abs(b.vx) * 0.3;
          }
          if (b.x + b.w / 2 > W) {
            b.x = W - b.w / 2;
            b.vx = -Math.abs(b.vx) * 0.3;
          }
          if (floor && b.y + b.h / 2 > H - 8) {
            b.y = H - 8 - b.h / 2;
            if (b.vy > 0) b.vy = -b.vy * 0.15;
            b.vx *= 0.92;
          }
        }
      }
    };
    const draw = (fx: number, fy: number, showFake: boolean) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.font = FONT;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const b of bodies) {
        if (!b.on) continue;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.a);
        ctx.beginPath();
        ctx.roundRect(-b.w / 2, -b.h / 2, b.w, b.h, b.h / 2);
        const solid = b.k % 3 === 0;
        ctx.fillStyle = solid ? "#ffcf5a" : b.k % 3 === 1 ? "#1d2333" : "#f4efe6";
        ctx.fill();
        if (!solid && b.k % 3 === 1) {
          ctx.strokeStyle = "rgba(255,207,90,.7)";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        ctx.fillStyle = solid || b.k % 3 === 2 ? "#15120a" : "#ffe6a6";
        ctx.fillText(b.t, 0, 1);
        ctx.restore();
      }
      if (showFake) {
        ctx.beginPath();
        ctx.arc(fx, fy, 10, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,.18)";
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(255,255,255,.95)";
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(fx, fy, 70, 0, Math.PI * 2);
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(255,255,255,.18)";
        ctx.stroke();
      }
    };
    return {
      tick(dt) {
        clock += dt;
        time += dt;
        if (time > CYCLE) {
          time = 0;
          reset();
        }
        bodies.forEach((b, i) => {
          if (!b.on && time >= 0.1 + i * 0.12) b.on = true;
        });
        // fake pointer sweeps through the pile (real pointer wins for 1.5 s after a move)
        const fake = clock > ptr.realUntil;
        let fx = -999;
        let fy = -999;
        const sweep = (time - 2.3) / 2;
        if (fake) {
          if (sweep >= 0 && sweep <= 1) {
            fx = W * (0.08 + 0.84 * sweep);
            fy = H - 40 - Math.sin(sweep * Math.PI * 3) * 40;
          }
          ptr.x = fx;
          ptr.y = fy;
        }
        const pvx = ptr.px > -900 && ptr.x > -900 ? (ptr.x - ptr.px) / Math.max(dt, 1e-3) : 0;
        const pvy = ptr.py > -900 && ptr.y > -900 ? (ptr.y - ptr.py) / Math.max(dt, 1e-3) : 0;
        ptr.px = ptr.x;
        ptr.py = ptr.y;
        const floor = time < 5.2;
        const n = 3;
        const h = dt / n;
        for (let s = 0; s < n; s++) {
          for (const b of bodies) {
            if (!b.on) continue;
            b.vy += G * h;
            if (ptr.x > -900) {
              const dx = b.x - ptr.x;
              const dy = b.y - ptr.y;
              const d = Math.hypot(dx, dy);
              const reach = 70 + b.w / 2;
              if (d < reach) {
                const f = (1 - d / reach) * 5200 * h;
                b.vx += (dx / (d || 1)) * f + pvx * 0.04;
                b.vy += (dy / (d || 1)) * f - 900 * h + pvy * 0.02;
              }
            }
            b.vx *= 0.995;
            b.x += b.vx * h;
            b.y += b.vy * h;
          }
          solve(floor);
        }
        for (const b of bodies) b.a += (gsap.utils.clamp(-0.35, 0.35, b.vx * 0.0009) - b.a) * Math.min(1, dt * 8);
        draw(fx, fy, fake && fx > -900);
      },
      dispose() {
        ro.disconnect();
        c.removeEventListener("pointermove", onMove);
      },
    };
  });
  return (
    <Stage r={root} bg="#0d0c10" g1="rgba(255,200,90,.5)" g2="rgba(255,120,160,.2)">
      <div className="absolute left-0 right-0 top-[10%] text-center">
        <p className="text-[13px] uppercase tracking-[0.24em] text-[#ffe6a6]/60" style={{ fontFamily: BODY }}>
          Bean & Bloom · what&apos;s in the bag
        </p>
        <h3 className="mt-3 text-[clamp(44px,5.2vw,84px)] font-[800] uppercase leading-[0.9] tracking-[-0.02em] text-[#fff6dc]" style={{ fontFamily: WIDE }}>
          Everything, in a pile.
        </h3>
      </div>
      {/* static / reduced-motion fallback: the pile at rest */}
      <div ref={still} className="absolute bottom-3 left-[6%] right-[6%] flex flex-wrap-reverse justify-center gap-1.5">
        {M236_TAGS.map((t, k) => (
          <span
            key={t}
            className="rounded-full px-5 py-3 text-[19px] font-[600]"
            style={{ fontFamily: GROTESK, background: k % 3 === 0 ? "#ffcf5a" : k % 3 === 1 ? "#1d2333" : "#f4efe6", color: k % 3 === 1 ? "#ffe6a6" : "#15120a", transform: `rotate(${((k * 7) % 9) - 4}deg)` }}
          >
            {t}
          </span>
        ))}
      </div>
      <canvas ref={cv} className="absolute inset-0 h-full w-full" />
      <Sheen g1="rgba(255,200,90,.5)" />
    </Stage>
  );
}

/* ---------- M237 · Ripple stagger from an item (variant of M34: the grid hides / shows radiating out from the tapped tile) ---------- */
const M237_COLS = 6;
const M237_ROWS = 4;
const M237_ORIGINS = [9, 20, 3, 14];
function M237() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const tiles = all(el, ".m237-t");
    const dot = el.querySelector<HTMLElement>(".b6r1-dot");
    const ring = el.querySelector<HTMLElement>(".m237-ring");
    const at = (i: number) => {
      const r = el.getBoundingClientRect();
      const b = tiles[i].getBoundingClientRect();
      return { x: b.left - r.left + b.width / 2, y: b.top - r.top + b.height / 2 };
    };
    gsap.set(dot, { autoAlpha: 1, x: () => at(M237_ORIGINS[0]).x + 120, y: () => at(M237_ORIGINS[0]).y + 90 });
    const tl = gsap.timeline({ repeat: -1 });
    M237_ORIGINS.forEach((o, k) => {
      const grid: gsap.StaggerVars = { grid: [M237_ROWS, M237_COLS], from: o, each: 0.06 };
      const move = k % 2 === 0;
      tl.to(dot, { x: () => at(o).x, y: () => at(o).y, duration: 0.45, ease: "power2.inOut" })
        .fromTo(dot, { scale: 1 }, { scale: 0.7, duration: 0.1, yoyo: true, repeat: 1 })
        .set(ring, { x: () => at(o).x, y: () => at(o).y }, "<")
        .fromTo(ring, { scale: 0.3, opacity: 0.9 }, { scale: 2.6, opacity: 0, duration: 0.6, ease: "power2.out" }, "<")
        .to(tiles, move ? { y: 46, autoAlpha: 0, duration: 0.32, ease: "power2.in", stagger: grid } : { scale: 0, autoAlpha: 0, duration: 0.32, ease: "power2.in", stagger: grid }, "<")
        .to(tiles, { y: 0, scale: 1, autoAlpha: 1, duration: 0.5, ease: "back.out(1.6)", stagger: grid }, "-=0.05");
    });
    return tl;
  });
  return (
    <Stage r={root} bg="#0b0d16" g1="rgba(110,150,255,.55)" g2="rgba(120,255,210,.2)">
      <div className="absolute left-[5%] top-[10%] w-[27%]">
        <p className="text-[13px] uppercase tracking-[0.22em] text-[#c3d2ff]/60" style={{ fontFamily: BODY }}>
          Northfield Goods · 24 picks
        </p>
        <h3 className="mt-3 text-[clamp(40px,4.4vw,70px)] leading-[0.95] text-[#eef2ff]" style={{ fontFamily: EDITORIAL }}>
          Tap one. The grid ripples out from it.
        </h3>
      </div>
      <div className="absolute bottom-[8%] right-[4%] top-[8%] grid w-[62%] gap-2.5" style={{ gridTemplateColumns: `repeat(${M237_COLS},1fr)`, gridTemplateRows: `repeat(${M237_ROWS},1fr)` }}>
        {Array.from({ length: M237_COLS * M237_ROWS }, (_, i) => (
          <div key={i} className="m237-t relative overflow-hidden rounded-[12px] will-change-transform">
            <Img i={i % 4} w={360} h={360} style={{ filter: `hue-rotate(${(i * 15) % 140}deg)` }} />
            <span className="absolute bottom-1.5 left-2 text-[12px] text-white/80" style={{ fontFamily: GROTESK }}>
              {inr(690 + i * 210)}
            </span>
          </div>
        ))}
      </div>
      <div className="m237-ring pointer-events-none absolute left-0 top-0 z-30 -ml-[30px] -mt-[30px] h-[60px] w-[60px] rounded-full border-2 border-white/80" style={{ opacity: 0 }} aria-hidden />
      <div className="b6r1-dot invisible" aria-hidden />
      <Sheen g1="rgba(110,150,255,.5)" />
    </Stage>
  );
}

/* ---------- M238 · Map pins drop in (variant of M34: pins pop onto a dotted map with a stagger + a pulse ring) ---------- */
const M238_LAND: [number, number, number, number][] = [
  [210, 150, 125, 80],
  [300, 335, 55, 100],
  [495, 125, 60, 45],
  [525, 290, 75, 110],
  [705, 160, 175, 90],
  [680, 250, 38, 48],
  [830, 360, 65, 40],
];
const M238_DOTS = (() => {
  const out: [number, number][] = [];
  for (let gy = 0; gy < 40; gy++)
    for (let gx = 0; gx < 80; gx++) {
      const x = gx * 12.5 + 6;
      const y = gy * 12.5 + 6;
      if (M238_LAND.some(([cx, cy, rx, ry]) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1)) out.push([x, y]);
    }
  return out;
})();
const M238_PINS = [
  { n: "Mumbai", x: 668, y: 250, c: "#ffb36b" },
  { n: "Dubai", x: 612, y: 212, c: "#9fd8ff" },
  { n: "London", x: 478, y: 108, c: "#9fd8ff" },
  { n: "New York", x: 272, y: 150, c: "#9fd8ff" },
  { n: "Singapore", x: 748, y: 270, c: "#9fd8ff" },
  { n: "Tokyo", x: 845, y: 150, c: "#9fd8ff" },
  { n: "Sydney", x: 862, y: 372, c: "#9fd8ff" },
];
function M238() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const pins = all(el, ".m238-in");
    const tl = gsap.timeline({ repeat: -1 });
    tl.fromTo(pins, { xPercent: -50, y: -70, autoAlpha: 0, scale: 0.6 }, { xPercent: -50, y: 0, autoAlpha: 1, scale: 1, duration: 0.7, ease: "bounce.out", stagger: 0.17, transformOrigin: "50% 100%" })
      .to(pins, { y: -24, autoAlpha: 0, scale: 0.7, duration: 0.28, ease: "power2.in", stagger: 0.04 }, "+=0.2");
    return tl;
  });
  return (
    <Stage r={root} bg="#090c14" g1="rgba(90,150,255,.5)" g2="rgba(255,179,107,.22)">
      <div className="absolute left-[5%] top-[9%] w-[26%]">
        <p className="text-[13px] uppercase tracking-[0.22em] text-[#9fd8ff]/60" style={{ fontFamily: BODY }}>
          Saffron Thread · Stores
        </p>
        <h3 className="mt-3 text-[clamp(40px,4.4vw,70px)] font-[700] leading-[0.92] tracking-[-0.03em] text-[#eef5ff]" style={{ fontFamily: GROTESK }}>
          Seven cities. One loom.
        </h3>
        <p className="mt-4 text-[15px] text-white/55" style={{ fontFamily: BODY }}>
          Flagship in Mumbai · ships to 40 countries
        </p>
      </div>
      <div className="absolute right-[3%] top-1/2 aspect-[2/1] w-[66%]" style={{ transform: "translateY(-46%)" }}>
        <svg viewBox="0 0 1000 500" className="absolute inset-0 h-full w-full" aria-hidden>
          {M238_DOTS.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={2.6} fill="#c8d8ff" opacity={0.22} />
          ))}
        </svg>
        {M238_PINS.map((p, i) => (
          <div key={p.n} className="absolute" style={{ left: `${p.x / 10}%`, top: `${p.y / 5}%` }}>
            <span className="m238-ring" style={{ "--pin": p.c, "--d": `${i * 0.25}s` } as CSSProperties} />
            <div className="m238-in absolute bottom-0 left-0 flex flex-col items-center will-change-transform" style={{ transform: "translateX(-50%)" }}>
              <span className="mb-2 whitespace-nowrap rounded-full bg-[#121a2b]/90 px-2.5 py-1 text-[12px] text-white/85" style={{ fontFamily: GROTESK }}>
                {p.n}
              </span>
              <span className="m238-head relative" style={{ "--pin": p.c } as CSSProperties} />
            </div>
          </div>
        ))}
      </div>
    </Stage>
  );
}

/* ---------- M239 · Ink-stamp reveal (variant of M38: organic ink blots are stamped on a paper mask, wiping it away) ---------- */
type Stamp = { x: number; y: number; R: number; age: number; seed: number };
function M239() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useOnScreenLoop(root, () => {
    const c = cv.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return null;
    let W = 1;
    let H = 1;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const paper = (upTo = 1) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, H * upTo);
      ctx.clip();
      ctx.fillStyle = "#efe6d4";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(60,40,20,.08)";
      ctx.lineWidth = 1;
      for (let y = 24; y < H; y += 24) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      ctx.fillStyle = "#2a1f14";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `400 ${Math.round(H * 0.11)}px 'Instrument Serif', Georgia, serif`;
      ctx.fillText("Press to print.", W / 2, H * 0.46);
      ctx.font = "600 13px 'Manrope Variable', system-ui, sans-serif";
      ctx.fillText("INK & OCHRE · HAND-BLOCK STUDIO", W / 2, H * 0.6);
      ctx.restore();
    };
    const size = () => {
      const r = c.getBoundingClientRect();
      W = Math.max(1, r.width);
      H = Math.max(1, r.height);
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
      paper();
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(c);
    const stamps: Stamp[] = [];
    let seed = 1;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const blob = (s: Stamp, r: number) => {
      ctx.beginPath();
      const n = 30;
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * Math.PI * 2;
        const k = 1 + 0.16 * Math.sin(a * 3 + s.seed) + 0.09 * Math.sin(a * 7 + s.seed * 2.1) + 0.05 * Math.sin(a * 13 + s.seed * 3.7);
        const px = s.x + Math.cos(a) * r * k;
        const py = s.y + Math.sin(a) * r * k;
        if (i) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      if (r > s.R * 0.8)
        for (let i = 0; i < 6; i++) {
          const a = s.seed * 5 + i * 1.9;
          const d = s.R * (1.15 + 0.4 * Math.abs(Math.sin(s.seed + i)));
          ctx.beginPath();
          ctx.arc(s.x + Math.cos(a) * d, s.y + Math.sin(a) * d, s.R * (0.05 + 0.08 * Math.abs(Math.cos(s.seed * 2 + i))), 0, Math.PI * 2);
          ctx.fill();
        }
    };
    const add = (x: number, y: number, R: number) => stamps.push({ x, y, R, age: 0, seed: rnd() * 10 });
    let real = 0;
    let lastReal = 0;
    let clock = 0;
    const onMove = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      real = clock + 1.5;
      if (clock - lastReal > 0.06) {
        lastReal = clock;
        add(e.clientX - r.left, e.clientY - r.top, 50 + rnd() * 30);
      }
    };
    c.addEventListener("pointermove", onMove);
    let time = 0;
    let nextStamp = 0;
    const STAMP_END = 2.9;
    const CYCLE = 4.1;
    return {
      tick(dt) {
        clock += dt;
        time += dt;
        if (time > CYCLE) {
          time = 0;
          nextStamp = 0;
          stamps.length = 0;
          paper();
        }
        const auto = clock > real;
        // auto stamping path (Lissajous across the sheet)
        const px = W * (0.5 + 0.4 * Math.sin(time * 2.1));
        const py = H * (0.5 + 0.36 * Math.sin(time * 3.3 + 0.6));
        if (auto && time < STAMP_END && time >= nextStamp) {
          nextStamp = time + 0.11;
          add(px, py, 55 + rnd() * 60);
        }
        if (auto && time >= STAMP_END && time - dt < STAMP_END) {
          add(W * 0.3, H * 0.4, Math.max(W, H) * 0.32);
          add(W * 0.72, H * 0.6, Math.max(W, H) * 0.32);
        }
        if (dot.current) {
          const show = auto && time < STAMP_END;
          dot.current.style.visibility = show ? "visible" : "hidden";
          dot.current.style.transform = `translate3d(${px}px,${py}px,0)`;
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = "#000";
        for (let i = stamps.length - 1; i >= 0; i--) {
          const s = stamps[i];
          s.age += dt;
          const p = Math.min(1, s.age / 0.32);
          blob(s, s.R * (1 - (1 - p) ** 3));
          if (p >= 1) stamps.splice(i, 1);
        }
        ctx.globalCompositeOperation = "source-over";
        // paper rolls back down over the print, then the loop restarts
        if (time > STAMP_END + 0.55) paper(Math.min(1, (time - STAMP_END - 0.55) / 0.55));
      },
      dispose() {
        ro.disconnect();
        c.removeEventListener("pointermove", onMove);
      },
    };
  });
  return (
    <Stage r={root} bg="#140c08" g1="rgba(230,120,60,.55)" g2="rgba(255,210,150,.22)">
      <div className="absolute inset-[5%] overflow-hidden rounded-[22px]">
        <Img i={1} w={1400} h={700} label="INK & OCHRE" style={{ filter: "hue-rotate(-20deg) saturate(1.1)" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />
        <div className="absolute left-[6%] top-1/2 w-[46%]" style={{ transform: "translateY(-50%)" }}>
          <p className="text-[13px] uppercase tracking-[0.22em] text-[#ffd9b0]/75" style={{ fontFamily: BODY }}>
            Hand-block cotton · Bagru, 2026
          </p>
          <h3 className="mt-3 text-[clamp(46px,5.4vw,88px)] leading-[0.92] text-[#fff1e2]" style={{ fontFamily: SERIF, fontWeight: 500 }}>
            Every print, stamped by hand.
          </h3>
          <p className="mt-4 text-[18px] text-[#ffb36b]" style={{ fontFamily: GROTESK }}>
            Indigo dohar · {inr(5600)}
          </p>
        </div>
        <canvas ref={cv} className="absolute inset-0 h-full w-full" />
        <div ref={dot} className="b6r1-dot" style={{ visibility: "hidden", borderColor: "#2a1f14", background: "rgba(42,31,20,.25)" }} aria-hidden />
      </div>
      <Sheen g1="rgba(230,120,60,.45)" />
    </Stage>
  );
}

/* ---------- M240 · Bounce-in fanned cards (variant of M4: five cards scale from 0 with elastic overshoot into a fanned arc) ---------- */
const M240_FAN = [-2, -1, 0, 1, 2].map((k) => ({ x: k * 165, y: Math.abs(k) * 22, r: k * 5 }));
const M240_NAMES = ["Saffron", "Rose", "Vetiver", "Oud", "Neroli"];
function M240() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const cards = all(el, ".m240-c");
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(cards, { x: (i: number) => M240_FAN[i].x, y: (i: number) => M240_FAN[i].y, rotation: (i: number) => M240_FAN[i].r })
      .fromTo(cards, { scale: 0 }, { scale: 1, duration: 1.15, ease: "elastic.out(1,0.5)", stagger: 0.06 })
      .to(cards, { scale: 0, duration: 0.3, ease: "back.in(1.6)", stagger: { each: 0.04, from: "end" } }, "+=0.1");
    return tl;
  });
  return (
    <Stage r={root} bg="#120c10" g1="rgba(255,120,170,.5)" g2="rgba(255,200,140,.22)">
      <div className="absolute left-0 right-0 top-[8%] text-center">
        <p className="text-[13px] uppercase tracking-[0.24em] text-[#ffc9dc]/60" style={{ fontFamily: BODY }}>
          Maison Ilaya · Discovery set
        </p>
        <h3 className="mt-3 text-[clamp(40px,4.6vw,72px)] leading-[0.95] text-[#fff0f5]" style={{ fontFamily: EDITORIAL }}>
          Five notes, fanned out.
        </h3>
        <p className="mt-2 text-[16px] text-[#ffb36b]" style={{ fontFamily: GROTESK }}>
          5 × 10 ml · {inr(4200)}
        </p>
      </div>
      <div className="absolute left-1/2 top-[64%] h-0 w-0">
        {M240_FAN.map((f, i) => (
          <div
            key={i}
            className="m240-c absolute -ml-[100px] -mt-[135px] h-[270px] w-[200px] overflow-hidden rounded-[18px] border-4 border-[#fff0f5] shadow-[0_18px_40px_rgba(0,0,0,.45)] will-change-transform"
            style={{ transform: `translate(${f.x}px, ${f.y}px) rotate(${f.r}deg)`, zIndex: 5 - Math.abs(i - 2) }}
          >
            <Img i={(i + 1) % 4} w={400} h={540} style={{ filter: `hue-rotate(${-30 + i * 22}deg)` }} />
            <span className="absolute bottom-3 left-3 text-[15px] text-white" style={{ fontFamily: SERIF }}>
              {M240_NAMES[i]}
            </span>
          </div>
        ))}
      </div>
      <Sheen g1="rgba(255,120,170,.45)" />
    </Stage>
  );
}

/* ---------- M241 · Card deck spreads (variant of M4: a pile spreads as a fan, a row, or both, card by card, then closes) ---------- */
const M241_N = 6;
const M241_MODES: { label: string; r: number; x: number }[] = [
  { label: "Fan", r: 9, x: 0 },
  { label: "Lateral row", r: 0, x: 125 },
  { label: "Fan + row", r: 6, x: 80 },
];
const M241_CARDS = ["Ace of Clay", "Two Rivers", "Three Kilns", "Four Winds", "Five Looms", "Six Lamps"];
function M241() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const cards = all(el, ".m241-c");
    const c0 = (M241_N - 1) / 2;
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(cards, { rotation: 0, x: 0, y: (i: number) => -i * 2, transformOrigin: "50% 240%" });
    M241_MODES.forEach((m, k) => {
      tl.call(() => setChips(el, k))
        .to(cards, { rotation: (i: number) => (i - c0) * m.r, x: (i: number) => (i - c0) * m.x, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.07 })
        .to(cards, { rotation: 0, x: 0, y: (i: number) => -i * 2, duration: 0.5, ease: "power3.inOut", stagger: { each: 0.05, from: "end" } }, "+=0.2");
    });
    return tl;
  });
  return (
    <Stage r={root} bg="#0c0f12" g1="rgba(255,190,110,.5)" g2="rgba(110,200,255,.2)">
      <div className="absolute left-[6%] top-[10%] w-[28%]">
        <p className="text-[13px] uppercase tracking-[0.22em] text-[#ffe0b8]/60" style={{ fontFamily: BODY }}>
          Kiln Club · Members&apos; deck
        </p>
        <h3 className="mt-3 text-[clamp(40px,4.4vw,70px)] font-[700] leading-[0.92] tracking-[-0.03em] text-[#fff7ec]" style={{ fontFamily: GROTESK }}>
          Deal the whole deck.
        </h3>
        <p className="mt-4 text-[15px] text-white/55" style={{ fontFamily: BODY }}>
          Six workshops · {inr(2800)} each
        </p>
        <div className="mt-6">
          <Chips items={M241_MODES.map((m) => m.label)} color="#ffe0b8" />
        </div>
      </div>
      <div className="absolute left-[66%] top-[50%] h-0 w-0">
        {M241_CARDS.map((t, i) => (
          <div
            key={t}
            className="m241-c absolute -ml-[90px] -mt-[125px] flex h-[250px] w-[180px] flex-col overflow-hidden rounded-[16px] border border-white/20 bg-[#f6efe3] text-[#1b160f] shadow-[0_14px_34px_rgba(0,0,0,.45)] will-change-transform"
            style={{ transformOrigin: "50% 240%", transform: `rotate(${(i - (M241_N - 1) / 2) * 9}deg)` }}
          >
            <div className="relative h-[62%] overflow-hidden">
              <Img i={(i + 3) % 4} w={360} h={320} style={{ filter: `hue-rotate(${i * 20}deg)` }} />
            </div>
            <div className="flex flex-1 flex-col justify-between p-3">
              <p className="text-[17px] leading-tight" style={{ fontFamily: SERIF, fontWeight: 500 }}>
                {t}
              </p>
              <p className="text-[12px] uppercase tracking-[0.14em] text-[#1b160f]/55" style={{ fontFamily: BODY }}>
                No. {String(i + 1).padStart(2, "0")} · Sat 11am
              </p>
            </div>
          </div>
        ))}
      </div>
      <Sheen g1="rgba(255,190,110,.45)" />
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M230", name: "Grid items enter in 3D (styles)", how: "Grid tiles enter in 3D with one style per grid: fly up, rotate in on X, helix, fall, pop, flip on Y (cycling).", kind: "play", C: M230 },
  { code: "M231", name: "Group flip-down", how: "Cards hinge up from lying flat (rotateX −90° → 0) on a spring, 0.12 s apart, like cards lifted off a table.", kind: "play", C: M231 },
  { code: "M232", name: "Slit-in", how: "The card flies in from deep Z rotated 90° as a thin slit and opens flat with a sharp ease-out (vertical / horizontal / diagonal).", kind: "play", C: M232 },
  { code: "M233", name: "Tilt-in", how: "The card slides in from a side tilted 30° and skewed, straightening as it lands (top / right / bottom / left).", kind: "play", C: M233 },
  { code: "M234", name: "Masonry drop-in", how: "Masonry tiles drop in from a direction, blur to sharp with a stagger, then reflow 4 ↔ 3 columns with Flip.", kind: "play", C: M234 },
  { code: "M235", name: "Self-feeding list", how: "Every second a new order card springs in at the top (0.9 → 1), pushing the list down while the oldest fades out.", kind: "play", C: M235 },
  { code: "M236", name: "Gravity tag pile", how: "Product tags drop, collide and pile up at the bottom (canvas physics); the pointer (auto on camera) pushes them around.", kind: "play", C: M236 },
  { code: "M237", name: "Ripple stagger from an item", how: "Tapping a tile hides and re-shows the grid in a ripple radiating out from that tile (scale, then slide).", kind: "play", C: M237 },
  { code: "M238", name: "Map pins drop in", how: "Store pins drop onto a dotted world map one by one with a bounce, each with a pulsing ring.", kind: "play", C: M238 },
  { code: "M239", name: "Ink-stamp reveal", how: "Organic ink blots stamped along a path (or by the pointer) wipe away a paper cover to reveal the content.", kind: "play", C: M239 },
  { code: "M240", name: "Bounce-in fanned cards", how: "Five cards scale from 0 with an elastic overshoot, 0.06 s apart, into a fanned arc (−10° to 10°).", kind: "play", C: M240 },
  { code: "M241", name: "Card deck spreads", how: "A pile of cards spreads card by card as a fan, a row, then both, and collapses back each time.", kind: "play", C: M241 },
];
