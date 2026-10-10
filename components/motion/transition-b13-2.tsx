"use client";

// Transition motions, batch 13 · group 2 (MOTION-MENU X42–X51). Small focused demos for /lab/motion.
// Every demo loops A → B → A between two simple "pages" while on screen (auto-advance; a fake pointer stands in for
// clicks where the motion is a menu), pauses off screen, and has a CSS-only glow loop (also ON TOP of the pages) that
// never stops. X49 is WebGL (OGL via lib/gl, dpr 1, built only near the viewport, released on unmount).
// ?static=1 / reduced motion: no JS motion, the markup shows page A with every cover / page B hidden.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, SplitText, prefersReducedMotion } from "@/lib/gsap";
import { createShader, type GLHandle } from "@/lib/gl";
import { scene, toCanvas } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = {
  sg: "'Space Grotesk Variable', system-ui, sans-serif",
  fr: "'Fraunces Variable', Georgia, serif",
  is: "'Instrument Serif', Georgia, serif",
  sy: "'Syne Variable', 'Space Grotesk Variable', system-ui, sans-serif",
  mr: "'Manrope Variable', system-ui, sans-serif",
};

const CSS = `
.b13g2x-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(255,206,150,.5)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,140,120,.2)),transparent 70%);animation:b13g2x-drift 5.6s linear infinite alternate;will-change:transform}
@keyframes b13g2x-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b13g2x-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4);pointer-events:none;z-index:45;opacity:0}
.b13g2x-dot::after{content:"";position:absolute;inset:-8px;border-radius:50%;border:1.5px solid rgba(255,255,255,.7);animation:b13g2x-ping 1.2s ease-out infinite}
@keyframes b13g2x-ping{0%{transform:scale(.5);opacity:1}100%{transform:scale(1.8);opacity:0}}
.x46-c{perspective:1800px}
.x46-b{transform-style:preserve-3d}
.x46-f{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;background-repeat:no-repeat}
.x51-book{perspective:2400px}
.x51-leaf{transform-style:preserve-3d;transform-origin:0% 50%}
.x51-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden}
html.is-static .b13g2x-glow,html.is-static .b13g2x-dot::after{animation:none}
html.is-static .b13g2x-dot{display:none}
html.is-static {
  .b13g2x-glow,.b13g2x-dot::after{animation:none}
  .b13g2x-dot{display:none}
}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", g1, g2, style }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string; style?: CSSProperties }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0b0a0d] text-[#f6f1ea] ${className}`} style={style}>
      <style href="b13g2x-css" precedence="default">
        {CSS}
      </style>
      <div className="b13g2x-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/** The CSS glow loop again, ON TOP of full-bleed pages (screen blend), so page swaps never read as a freeze. */
const Sheen = ({ g1 = "rgba(255,206,150,.55)" }: { g1?: string }) => (
  <div className="b13g2x-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.45, zIndex: 35 } as CSSProperties} aria-hidden />
);

/** The visible fake pointer ring (moved by the timeline in root px). */
const Dot = ({ className = "" }: { className?: string }) => <div className={`b13g2x-dot ${className}`} aria-hidden />;

/**
 * "play" helper: waits for fonts, builds the looping timeline inside a gsap.context, plays it only while on screen,
 * rebuilds after a resize (measured layouts), reverts on unmount. Nothing runs with prefersReducedMotion().
 */
function usePlay(ref: RefObject<HTMLElement | null>, build: (root: HTMLElement) => gsap.core.Animation | void) {
  const b = useRef(build);
  b.current = build;
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
    Promise.resolve(document.fonts?.ready).then(() => {
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

/** Runs `fn` once the element is within ~1 screen of the viewport (no textures / GL contexts at page load). */
function useNear(ref: RefObject<HTMLElement | null>, start: () => (() => void) | void) {
  const s = useRef(start);
  s.current = start;
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let stop: (() => void) | void;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        stop = s.current();
      },
      { rootMargin: "900px 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      stop?.();
    };
  }, [ref]);
}

/** Centre of an element relative to another element (layout px). */
function centre(node: Element, root: Element) {
  const a = node.getBoundingClientRect();
  const r = root.getBoundingClientRect();
  return { x: a.left - r.left + a.width / 2, y: a.top - r.top + a.height / 2 };
}

const hold = (tl: gsap.core.Timeline, d = 0.2) => tl.to({}, { duration: d });

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, className = "", style, w = 1200, h = 1000 }: { i: number; className?: string; style?: CSSProperties; w?: number; h?: number }) => (
  <img src={scene(i, w, h)} alt="" className={`h-full w-full object-cover ${className}`} style={style} draggable={false} />
);

const HIDDEN: CSSProperties = { visibility: "hidden", opacity: 0 };

/** A small site nav strip used by the menu demos. */
function NavBar({ brand, menu, className = "" }: { brand: string; menu: ReactNode; className?: string }) {
  return (
    <div className={`absolute inset-x-[5%] top-[7%] flex items-center justify-between text-[13px] uppercase tracking-[0.2em] text-white/60 ${className}`} style={{ fontFamily: F.mr }}>
      <span className="font-[700] text-white">{brand}</span>
      {menu}
    </div>
  );
}

/* ───────────────────────── X42 · Fast mask slide with inner counter-move ───────────────────────── */
const X42_S = [
  { i: 2, t: "Saltmarsh", k: "Coastal linen · ₹ 4,200" },
  { i: 0, t: "Ember Ridge", k: "Wool overshirt · ₹ 5,650" },
];
function X42() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const slides = q(".x42-s");
    const inners = q(".x42-i");
    const titles = q(".x42-t");
    const kick = q(".x42-k");
    const nums = q(".x42-n");
    const chars = titles.map((t) => SplitText.create(t, { type: "chars", mask: "chars" }).chars);
    gsap.set([slides[1], titles[1], kick[1], nums[1]], { autoAlpha: 1 });
    gsap.set(slides[1], { yPercent: 100 });
    gsap.set(chars[1], { yPercent: 110 });
    gsap.set(kick[1], { opacity: 0, y: 14 });
    gsap.set(nums[1], { yPercent: 100 });
    const tl = gsap.timeline({ repeat: -1 });
    const half = (a: number, b: number) => {
      tl.set(slides[b], { zIndex: 2, yPercent: 100 })
        .set(slides[a], { zIndex: 1 })
        .set(inners[b], { yPercent: -30 })
        .to(chars[a], { yPercent: -110, duration: 0.38, stagger: 0.018, ease: "power2.in" })
        .to(kick[a], { opacity: 0, y: -14, duration: 0.3, ease: "power2.in" }, "<")
        // the mask wrapper slides up while the image inside it moves the other way (parallax swap)
        .to(slides[b], { yPercent: 0, duration: 0.9, ease: "power3.inOut" }, "-=0.12")
        .to(inners[b], { yPercent: 0, duration: 0.9, ease: "power3.inOut" }, "<")
        .to(inners[a], { yPercent: -18, duration: 0.9, ease: "power3.inOut" }, "<")
        .to(nums[a], { yPercent: -100, duration: 0.6, ease: "power3.inOut" }, "<0.2")
        .fromTo(nums[b], { yPercent: 100 }, { yPercent: 0, duration: 0.6, ease: "power3.inOut" }, "<")
        // then the title letters slide in
        .fromTo(chars[b], { yPercent: 110 }, { yPercent: 0, duration: 0.55, stagger: 0.03, ease: "power2.out" }, "-=0.35")
        .fromTo(kick[b], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }, "<0.15")
        .set(inners[a], { yPercent: 0 });
      hold(tl, 0.12);
    };
    half(0, 1);
    half(1, 0);
    return tl;
  });
  return (
    <Stage r={root}>
      {X42_S.map((s, n) => (
        <div key={s.t} className="x42-s absolute inset-0 overflow-hidden" style={n ? HIDDEN : undefined}>
          <div className="x42-i absolute inset-0">
            <Img i={s.i} w={1600} h={1000} />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.55),transparent_60%)]" />
          </div>
        </div>
      ))}
      <NavBar
        brand="Tidewell Supply"
        className="z-10"
        menu={
          <span className="flex gap-7">
            <span>Shop</span>
            <span>Stories</span>
            <span>Bag (0)</span>
          </span>
        }
      />
      <div className="absolute bottom-[10%] left-[6%] z-10 w-[60%]">
        <div className="relative">
          {X42_S.map((s, n) => (
            <p key={s.k} className={`x42-k text-[14px] uppercase tracking-[0.24em] text-[#ffd6a0] ${n ? "absolute left-0 top-0" : ""}`} style={{ fontFamily: F.mr, ...(n ? HIDDEN : {}) }}>
              {s.k}
            </p>
          ))}
        </div>
        <div className="relative mt-3">
          {X42_S.map((s, n) => (
            <h3 key={s.t} className={`x42-t whitespace-nowrap text-[clamp(64px,7.4vw,120px)] leading-[1] ${n ? "absolute left-0 top-0" : ""}`} style={{ fontFamily: F.fr, ...(n ? HIDDEN : {}) }}>
              {s.t}
            </h3>
          ))}
        </div>
      </div>
      <div className="absolute bottom-[10%] right-[6%] z-10 flex items-baseline gap-2 text-[22px] tabular-nums" style={{ fontFamily: F.sg }}>
        <span className="relative inline-block h-[1.2em] overflow-hidden">
          <span className="x42-n block">01</span>
          <span className="x42-n absolute left-0 top-0 block" style={HIDDEN}>
            02
          </span>
        </span>
        <span className="text-white/45">/ 02</span>
      </div>
      <Sheen />
    </Stage>
  );
}

/* ───────────────────────── X43 · Rounded panel with cover unreveal ───────────────────────── */
const X43_LINKS = ["Collections", "Workshop", "Journal", "Visit us"];
function X43() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const panel = q(".x43-panel")[0];
    const inner = q(".x43-inner")[0];
    const links = q(".x43-link");
    const pics = q(".x43-pic");
    const dot = q(".b13g2x-dot")[0];
    const open = centre(q(".x43-open")[0], el);
    const w = el.clientWidth;
    const h = el.clientHeight;
    gsap.set(panel, { autoAlpha: 1, yPercent: -100 });
    gsap.set(inner, { yPercent: 100 });
    gsap.set(dot, { x: w * 0.55, y: h * 0.62, opacity: 1 });
    const tl = gsap.timeline({ repeat: -1 });
    // fake pointer walks to "Menu" and clicks
    tl.to(dot, { x: open.x, y: open.y, duration: 0.55, ease: "power2.inOut" })
      .to(dot, { scale: 0.7, duration: 0.1, yoyo: true, repeat: 1 })
      // the panel slides down from the top while the cover inside it travels up (unreveal); titles rise, pictures drop
      .to(panel, { yPercent: 0, borderBottomLeftRadius: "4% 6%", borderBottomRightRadius: "4% 6%", duration: 1, ease: "expo.out" })
      .to(inner, { yPercent: 0, duration: 1, ease: "expo.out" }, "<")
      .fromTo(links, { y: 90, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.06, ease: "expo.out" }, "<0.12")
      .fromTo(pics, { y: -90, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: "expo.out" }, "<")
      // pointer moves to "Close" (the same corner) while the panel settles, then clicks
      .to(dot, { x: open.x - 40, y: open.y + 60, duration: 0.35, ease: "sine.inOut" }, "-=0.55")
      .to(dot, { x: open.x, y: open.y, duration: 0.35, ease: "sine.inOut" })
      .to(dot, { scale: 0.7, duration: 0.1, yoyo: true, repeat: 1 })
      // close: everything reverses (panel up, cover down, titles drop, pictures rise)
      .to(links, { y: 60, opacity: 0, duration: 0.45, stagger: 0.03, ease: "power2.in" })
      .to(pics, { y: -60, opacity: 0, duration: 0.45, stagger: 0.04, ease: "power2.in" }, "<")
      .to(panel, { yPercent: -100, borderBottomLeftRadius: "50% 30%", borderBottomRightRadius: "50% 30%", duration: 0.8, ease: "power3.inOut" }, "-=0.2")
      .to(inner, { yPercent: 100, duration: 0.8, ease: "power3.inOut" }, "<")
      .to(dot, { x: w * 0.55, y: h * 0.62, duration: 0.6, ease: "power2.inOut" }, "-=0.3");
    hold(tl, 0.1);
    return tl;
  });
  return (
    <Stage r={root}>
      <div className="absolute inset-0 overflow-hidden bg-[#12100c]">
        <div className="absolute inset-0 bg-[radial-gradient(60%_70%_at_78%_50%,rgba(255,206,150,.16),transparent_70%)]" />
        <NavBar
          brand="Oakhollow Studio"
          menu={
            <span className="x43-open relative z-30 rounded-full border border-white/30 px-5 py-2 text-white" style={{ fontFamily: F.mr }}>
              Menu
            </span>
          }
        />
        <div className="absolute inset-x-[5%] bottom-[9%] top-[20%] flex items-center gap-[5%]">
          <div className="w-[46%]">
            <p className="text-[13px] uppercase tracking-[0.22em] text-[#ffce96]" style={{ fontFamily: F.mr }}>
              Furniture · Edition 04
            </p>
            <h3 className="mt-4 text-[clamp(44px,4.6vw,76px)] leading-[0.98]" style={{ fontFamily: F.fr }}>
              Oak, oiled by hand
            </h3>
            <p className="mt-5 max-w-[36ch] text-[16px] text-white/65" style={{ fontFamily: F.mr }}>
              Low benches and side tables, joined without a single screw.
            </p>
            <span className="mt-7 inline-block text-[20px] tabular-nums" style={{ fontFamily: F.sg }}>
              From ₹ 18,400
            </span>
          </div>
          <div className="relative h-full flex-1 overflow-hidden rounded-[22px]">
            <Img i={3} w={1100} h={900} />
          </div>
        </div>
      </div>
      <div className="x43-panel absolute inset-0 z-20 overflow-hidden" style={{ ...HIDDEN, borderBottomLeftRadius: "50% 30%", borderBottomRightRadius: "50% 30%" }}>
        <div className="x43-inner absolute inset-0 bg-[#1d1710]">
          <Img i={1} w={1600} h={1000} className="absolute inset-0 opacity-35" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,14,9,.92)_35%,rgba(18,14,9,.4))]" />
          <div className="absolute inset-x-[6%] bottom-[10%] top-[20%] flex items-center justify-between">
            <ul className="space-y-1">
              {X43_LINKS.map((l, i) => (
                <li key={l} className="x43-link flex items-baseline gap-4 text-[clamp(44px,4.6vw,74px)] leading-[1.08]" style={{ fontFamily: F.fr }}>
                  <span className="text-[13px] tabular-nums text-[#ffce96]" style={{ fontFamily: F.mr }}>
                    0{i + 1}
                  </span>
                  {l}
                </li>
              ))}
            </ul>
            <div className="flex gap-4">
              {[2, 0, 5].map((i, n) => (
                <div key={i} className="x43-pic h-[clamp(160px,22vw,300px)] w-[clamp(110px,12vw,190px)] overflow-hidden rounded-[16px]" style={{ marginTop: n === 1 ? 60 : 0 }}>
                  <Img i={i} w={500} h={700} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Dot />
      <Sheen />
    </Stage>
  );
}

/* ───────────────────────── X44 · Rotating title chars + diagonal thumbs ───────────────────────── */
const X44_P = [
  { t: "Dune Hour", k: "Eau de parfum · 50 ml · ₹ 3,900", th: [4, 0, 2] },
  { t: "Night Bloom", k: "Extrait · 30 ml · ₹ 4,650", th: [5, 1, 3] },
];
const X44_POS = [
  { l: "57%", t: "8%", r: -7 },
  { l: "69%", t: "32%", r: 5 },
  { l: "81%", t: "56%", r: -4 },
];
function X44() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const titles = q(".x44-t");
    const kicks = q(".x44-k");
    const groups = q(".x44-g");
    const thumbs = groups.map((g) => Array.from(g.querySelectorAll<HTMLElement>(".x44-th")));
    const chars = titles.map((t) => SplitText.create(t, { type: "lines,chars", mask: "lines" }).chars);
    const w = el.clientWidth;
    gsap.set([titles[1], kicks[1], groups[1]], { autoAlpha: 1 });
    gsap.set(chars, { transformOrigin: "0% 100%" });
    gsap.set(chars[1], { yPercent: 120, rotation: 3 });
    gsap.set(kicks[1], { opacity: 0 });
    gsap.set(thumbs[1], { x: -w * 0.45, y: w * 0.45, opacity: 0 });
    const tl = gsap.timeline({ repeat: -1 });
    const half = (a: number, b: number) => {
      // outgoing: chars tip 3deg and slide up with a stagger, thumbs fly away to the top-right
      tl.to(chars[a], { yPercent: -120, rotation: 3, duration: 0.5, stagger: 0.025, ease: "power3.in" })
        .to(kicks[a], { opacity: 0, y: -12, duration: 0.3, ease: "power2.in" }, "<")
        .to(thumbs[a], { x: w * 0.45, y: -w * 0.45, opacity: 0, duration: 0.7, stagger: 0.06, ease: "power3.in" }, "<")
        // incoming: thumbs slide in along the same diagonal from the lower left, chars rotate back to 0 as they land
        .fromTo(thumbs[b], { x: -w * 0.45, y: w * 0.45, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 0.85, stagger: 0.07, ease: "power3.out" }, "-=0.2")
        .fromTo(chars[b], { yPercent: 120, rotation: 3 }, { yPercent: 0, rotation: 0, duration: 0.6, stagger: 0.03, ease: "power3.out" }, "<0.1")
        .fromTo(kicks[b], { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, "<0.2")
        .set(chars[a], { yPercent: 120 });
      hold(tl, 0.1);
    };
    half(0, 1);
    half(1, 0);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,190,150,.5)" g2="rgba(190,140,255,.22)">
      <NavBar
        brand="Maison Verel"
        menu={
          <span className="flex gap-7">
            <span>Scents</span>
            <span>Atelier</span>
            <span>Bag (0)</span>
          </span>
        }
      />
      {X44_P.map((p, n) => (
        <div key={p.t} className="x44-g absolute inset-0" style={n ? HIDDEN : undefined}>
          {X44_POS.map((s, i) => (
            <div key={i} className="x44-th absolute aspect-[3/4] w-[15%]" style={{ left: s.l, top: s.t }}>
              <div className="h-full w-full overflow-hidden rounded-[14px] shadow-[0_24px_60px_rgba(0,0,0,.5)]" style={{ transform: `rotate(${s.r}deg)` }}>
                <Img i={p.th[i]} w={600} h={800} />
              </div>
            </div>
          ))}
        </div>
      ))}
      <div className="absolute left-[6%] top-1/2 z-10 w-[52%] -translate-y-1/2">
        <div className="relative">
          {X44_P.map((p, n) => (
            <p key={p.k} className={`x44-k text-[14px] uppercase tracking-[0.22em] text-[#ffc9a3] ${n ? "absolute left-0 top-0" : ""}`} style={{ fontFamily: F.mr, ...(n ? HIDDEN : {}) }}>
              {p.k}
            </p>
          ))}
        </div>
        <div className="relative mt-4">
          {X44_P.map((p, n) => (
            <h3 key={p.t} className={`x44-t whitespace-nowrap text-[clamp(56px,6.2vw,104px)] font-[800] uppercase leading-[1.05] ${n ? "absolute left-0 top-0" : ""}`} style={{ fontFamily: F.sy, ...(n ? HIDDEN : {}) }}>
              {p.t}
            </h3>
          ))}
        </div>
        <span className="mt-8 inline-block rounded-full bg-[#ffc9a3] px-6 py-3 text-[14px] font-[600] text-[#1a0f0a]" style={{ fontFamily: F.sg }}>
          Discover the scent
        </span>
      </div>
      <Sheen g1="rgba(255,190,150,.55)" />
    </Stage>
  );
}

/* ───────────────────────── X45 · Section scale-zoom slideshow ───────────────────────── */
const X45_P = [
  { i: 2, t: "Larch Valley", k: "Trek 01 · Autumn", f: [["Altitude", "3,100 m"], ["Trail", "14 km · 2 days"], ["Guided", "₹ 8,900"]] },
  { i: 4, t: "Glass Lake", k: "Trek 02 · Winter", f: [["Altitude", "4,250 m"], ["Trail", "22 km · 3 days"], ["Guided", "₹ 12,400"]] },
];
function X45() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const masks = q(".x45-m");
    const inners = q(".x45-i");
    const facts = q(".x45-f");
    const rows = facts.map((f) => Array.from(f.querySelectorAll<HTMLElement>("[data-r]")));
    const nums = q(".x45-n");
    gsap.set([masks[1], facts[1], nums[1]], { autoAlpha: 1 });
    gsap.set(masks[1], { yPercent: 100 });
    gsap.set(rows[1], { x: 60, opacity: 0 });
    gsap.set(nums[1], { yPercent: 100 });
    const tl = gsap.timeline({ repeat: -1 });
    // dir 1: the next section comes up from below (scale from its bottom edge); dir -1: down from above (top edge)
    const half = (a: number, b: number, dir: 1 | -1) => {
      tl.set(masks[b], { zIndex: 2 })
        .set(masks[a], { zIndex: 1 })
        .to(rows[a], { x: -40, opacity: 0, duration: 0.4, stagger: 0.05, ease: "power2.in" })
        .fromTo(masks[b], { yPercent: 100 * dir }, { yPercent: 0, duration: 1.2, ease: "expo.out" }, "-=0.15")
        .fromTo(inners[b], { scale: 1.8, transformOrigin: dir === 1 ? "50% 100%" : "50% 0%" }, { scale: 1, duration: 1.2, ease: "expo.out" }, "<")
        .to(masks[a], { yPercent: -40 * dir, duration: 1.2, ease: "expo.out" }, "<")
        .to(nums[a], { yPercent: -100 * dir, duration: 0.7, ease: "expo.out" }, "<")
        .fromTo(nums[b], { yPercent: 100 * dir }, { yPercent: 0, duration: 0.7, ease: "expo.out" }, "<")
        .fromTo(rows[b], { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: "power3.out" }, "<0.2")
        .set(masks[a], { yPercent: 100 });
      hold(tl, 0.15);
    };
    half(0, 1, 1);
    half(1, 0, -1);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(150,210,190,.5)" g2="rgba(255,200,140,.2)">
      <NavBar
        brand="Cairnline Treks"
        menu={
          <span className="flex gap-7">
            <span>Routes</span>
            <span>Gear</span>
            <span>Book</span>
          </span>
        }
      />
      <div className="absolute bottom-[8%] left-[5%] top-[18%] w-[52%] overflow-hidden rounded-[22px] bg-black/40">
        {X45_P.map((p, n) => (
          <div key={p.t} className="x45-m absolute inset-0 overflow-hidden" style={n ? HIDDEN : undefined}>
            <div className="x45-i absolute inset-0">
              <Img i={p.i} w={1100} h={900} />
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-[8%] right-[5%] top-[18%] w-[34%]">
        {X45_P.map((p, n) => (
          <div key={p.t} className="x45-f absolute inset-0 flex flex-col justify-center" style={n ? HIDDEN : undefined}>
            <p data-r className="text-[13px] uppercase tracking-[0.24em] text-[#9fe0c8]" style={{ fontFamily: F.mr }}>
              {p.k}
            </p>
            <h3 data-r className="mt-3 text-[clamp(44px,4.4vw,72px)] leading-[1]" style={{ fontFamily: F.fr }}>
              {p.t}
            </h3>
            <dl className="mt-7 border-t border-white/15" style={{ fontFamily: F.sg }}>
              {p.f.map(([k, v]) => (
                <div key={k} data-r className="flex items-baseline justify-between border-b border-white/15 py-3.5">
                  <dt className="text-[13px] uppercase tracking-[0.2em] text-white/55">{k}</dt>
                  <dd className="text-[20px] tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
      <div className="absolute bottom-[8%] right-[5%] flex items-baseline gap-2 text-[20px] tabular-nums" style={{ fontFamily: F.sg }}>
        <span className="relative inline-block h-[1.2em] overflow-hidden">
          <span className="x45-n block">01</span>
          <span className="x45-n absolute left-0 top-0 block" style={HIDDEN}>
            02
          </span>
        </span>
        <span className="text-white/45">/ 02</span>
      </div>
      <Sheen g1="rgba(150,210,190,.5)" />
    </Stage>
  );
}

/* ───────────────────────── X46 · 3D slice-box turn ───────────────────────── */
const X46_N = 7;
const X46_P = [
  { i: 1, t: "Copper kettle", k: "Kitchen · ₹ 3,250" },
  { i: 3, t: "Stone mortar", k: "Kitchen · ₹ 1,780" },
];
function X46() {
  const root = useRef<HTMLDivElement>(null);
  const urls = X46_P.map((p) => `url("${scene(p.i, 1600, 900)}")`);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const boxes = q(".x46-b");
    const caps = q(".x46-cap");
    const H = (q(".x46-c")[0] as HTMLElement).clientHeight;
    // faces sit on a box H deep: front (A), -90 (B), -180 (A), -270 (B); every +90 turn shows the next image
    boxes.forEach((b) => {
      b.querySelectorAll<HTMLElement>(".x46-f").forEach((f, k) => {
        f.style.transform = `rotateX(${-90 * k}deg) translateZ(${H / 2}px)`;
        f.style.visibility = "visible";
      });
    });
    gsap.set(boxes, { z: -H / 2, rotationX: 0, transformOrigin: "50% 50%" });
    gsap.set(caps[1], { autoAlpha: 0 });
    const tl = gsap.timeline({ repeat: -1 });
    const half = (to: number, b: number, a: number) => {
      tl.to(boxes, { rotationX: to, duration: 1, ease: "power2.inOut", stagger: { each: 0.08, from: "center" } })
        .to(caps[a], { autoAlpha: 0, y: -14, duration: 0.35, ease: "power2.in" }, "<")
        .fromTo(caps[b], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.45");
      hold(tl, 0.2);
    };
    half(90, 1, 0);
    half(180, 0, 1);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,170,110,.5)" g2="rgba(120,170,255,.22)">
      <div className="x46-c absolute left-[8%] right-[8%] top-[8%] h-[70%]">
        {Array.from({ length: X46_N }, (_, i) => (
          <div key={i} className="x46-b absolute top-0 h-full" style={{ left: `${(i * 100) / X46_N}%`, width: `${100 / X46_N + 0.05}%` }}>
            {[0, 1, 0, 1].map((p, k) => (
              <div
                key={k}
                className="x46-f"
                style={{
                  backgroundImage: urls[p],
                  backgroundSize: `${X46_N * 100}% 100%`,
                  backgroundPosition: `${(i / (X46_N - 1)) * 100}% 50%`,
                  ...(k ? { visibility: "hidden" } : {}),
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="absolute bottom-[6%] left-[8%] right-[8%] flex items-end justify-between">
        <div className="relative">
          {X46_P.map((p, n) => (
            <div key={p.t} className={`x46-cap ${n ? "absolute bottom-0 left-0" : ""}`} style={n ? HIDDEN : undefined}>
              <p className="text-[13px] uppercase tracking-[0.22em] text-[#ffc08a]" style={{ fontFamily: F.mr }}>
                {p.k}
              </p>
              <h3 className="mt-1 whitespace-nowrap text-[clamp(34px,3.2vw,52px)] leading-[1.05]" style={{ fontFamily: F.fr }}>
                {p.t}
              </h3>
            </div>
          ))}
        </div>
        <span className="rounded-full border border-white/25 px-5 py-2.5 text-[14px] text-white/80" style={{ fontFamily: F.sg }}>
          Ember &amp; Iron · Cookware
        </span>
      </div>
      <Sheen g1="rgba(255,170,110,.55)" />
    </Stage>
  );
}

/* ───────────────────────── X47 · Four-quadrant split-out ───────────────────────── */
const X47_P = [
  { i: 5, t: "Monsoon edit", k: "Rainwear · from ₹ 2,900" },
  { i: 2, t: "Summer edit", k: "Linen · from ₹ 1,850" },
];
// quadrant box + where its copy of the full image sits + the way it slides out (pinwheel)
const X47_Q = [
  { l: "0%", t: "0%", ox: "0%", oy: "0%", x: 0, y: -100 },
  { l: "50%", t: "0%", ox: "-100%", oy: "0%", x: 100, y: 0 },
  { l: "50%", t: "50%", ox: "-100%", oy: "-100%", x: 0, y: 100 },
  { l: "0%", t: "50%", ox: "0%", oy: "-100%", x: -100, y: 0 },
];
function X47() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const quads = q(".x47-q");
    const qa = q(".x47-qa");
    const qb = q(".x47-qb");
    const ua = q(".x47-ua")[0];
    const ub = q(".x47-ub")[0];
    const caps = q(".x47-cap");
    gsap.set([ub, ...qb], { autoAlpha: 0 });
    gsap.set(caps[1], { autoAlpha: 0 });
    const tl = gsap.timeline({ repeat: -1 });
    // top = page shown by the quadrants, under = the page revealed beneath them
    const half = (top: "a" | "b") => {
      const [qTop, qUnder, uTop, uUnder] = top === "a" ? [qa, qb, ua, ub] : [qb, qa, ub, ua];
      const [cOut, cIn] = top === "a" ? [caps[0], caps[1]] : [caps[1], caps[0]];
      tl.set(qTop, { autoAlpha: 1 })
        .set(qUnder, { autoAlpha: 0 })
        .set(uUnder, { autoAlpha: 1 })
        .set(uTop, { autoAlpha: 0 })
        .set(quads, { xPercent: 0, yPercent: 0 })
        .to(cOut, { autoAlpha: 0, y: -16, duration: 0.35, ease: "power2.in" })
        .to(quads, { xPercent: (i: number) => X47_Q[i].x, yPercent: (i: number) => X47_Q[i].y, duration: 0.9, stagger: 0.07, ease: "power3.inOut" }, "<0.05")
        .fromTo(cIn, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.45");
      hold(tl, 0.2);
    };
    half("a");
    half("b");
    return tl;
  });
  return (
    <Stage r={root}>
      <div className="absolute inset-0">
        <Img i={X47_P[0].i} w={1600} h={1000} className="x47-ua absolute inset-0" />
        <Img i={X47_P[1].i} w={1600} h={1000} className="x47-ub absolute inset-0" />
      </div>
      {X47_Q.map((s, i) => (
        <div key={i} className="x47-q absolute h-1/2 w-1/2 overflow-hidden" style={{ left: s.l, top: s.t }}>
          <div className="absolute h-[200%] w-[200%]" style={{ left: s.ox, top: s.oy }}>
            <Img i={X47_P[0].i} w={1600} h={1000} className="x47-qa absolute inset-0" />
            <Img i={X47_P[1].i} w={1600} h={1000} className="x47-qb absolute inset-0" style={{ visibility: "hidden" }} />
          </div>
        </div>
      ))}
      <div className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(0deg,rgba(0,0,0,.55),transparent_45%)]" />
      <NavBar
        brand="Rainfold"
        className="z-20"
        menu={
          <span className="flex gap-7">
            <span>Women</span>
            <span>Men</span>
            <span>Bag (0)</span>
          </span>
        }
      />
      <div className="absolute bottom-[9%] left-[6%] z-20">
        {X47_P.map((p, n) => (
          <div key={p.t} className={`x47-cap ${n ? "absolute bottom-0 left-0" : ""}`} style={n ? HIDDEN : undefined}>
            <p className="text-[14px] uppercase tracking-[0.24em] text-[#ffe0b0]" style={{ fontFamily: F.mr }}>
              {p.k}
            </p>
            <h3 className="mt-2 whitespace-nowrap text-[clamp(56px,6vw,100px)] leading-[1]" style={{ fontFamily: F.is }}>
              {p.t}
            </h3>
          </div>
        ))}
      </div>
      <Sheen />
    </Stage>
  );
}

/* ───────────────────────── X48 · Row cover with opposite slide-in ───────────────────────── */
const X48_ROWS = 6;
const X48_ITEMS = [
  { i: 0, n: "Field jacket", p: "₹ 6,900" },
  { i: 3, n: "Canvas tote", p: "₹ 2,450" },
  { i: 5, n: "Trail cap", p: "₹ 1,290" },
];
function X48() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const [pa, pb] = q(".x48-p");
    const rows = q(".x48-r");
    const wrap = q(".x48-w")[0];
    const inner = q(".x48-in")[0];
    const la = pa.querySelectorAll("[data-l]");
    const lb = pb.querySelectorAll("[data-l]");
    gsap.set(rows, { scaleY: 0 });
    const tl = gsap.timeline({ repeat: -1 });
    const cover = () =>
      tl.set(rows, { transformOrigin: "50% 100%" }).to(rows, { scaleY: 1, duration: 0.45, stagger: 0.06, ease: "power2.in" });
    const retract = () => tl.set(rows, { transformOrigin: "50% 0%" }).to(rows, { scaleY: 0, duration: 0.55, stagger: 0.06, ease: "power2.out" });
    // A → B: rows cover the list page, then the preview and its image slide in from opposite sides as the rows retract
    cover();
    tl.set(pa, { autoAlpha: 0 }).set(pb, { autoAlpha: 1 });
    retract();
    tl.fromTo(wrap, { xPercent: -101 }, { xPercent: 0, duration: 0.9, ease: "power2.out" }, "<")
      .fromTo(inner, { xPercent: 101 }, { xPercent: 0, duration: 0.9, ease: "power2.out" }, "<")
      .fromTo(lb, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.06, ease: "power2.out" }, "<0.25");
    hold(tl, 0.2);
    // B → A
    cover();
    tl.set(pb, { autoAlpha: 0 }).set(pa, { autoAlpha: 1 });
    retract();
    tl.fromTo(la, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: "power2.out" }, "<0.1");
    hold(tl, 0.2);
    return tl;
  });
  return (
    <Stage r={root}>
      <div className="x48-p absolute inset-0 bg-[#0f1210]">
        <NavBar
          brand="Fieldnote Goods"
          menu={
            <span className="flex gap-7">
              <span>Archive</span>
              <span>About</span>
              <span>Bag (0)</span>
            </span>
          }
        />
        <div className="absolute inset-x-[5%] bottom-[8%] top-[18%] flex flex-col">
          <h3 data-l className="text-[clamp(44px,4.6vw,76px)] leading-[1]" style={{ fontFamily: F.fr }}>
            The autumn archive
          </h3>
          <div className="mt-[3%] grid flex-1 grid-cols-3 gap-[2.5%]">
            {X48_ITEMS.map((it) => (
              <div key={it.n} data-l className="flex min-h-0 flex-col">
                <div className="min-h-0 flex-1 overflow-hidden rounded-[16px]">
                  <Img i={it.i} w={700} h={600} />
                </div>
                <div className="mt-3 flex justify-between text-[16px]" style={{ fontFamily: F.sg }}>
                  <span>{it.n}</span>
                  <span className="tabular-nums text-white/70">{it.p}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="x48-p absolute inset-0 bg-[#e9e3d6] text-[#141612]" style={HIDDEN}>
        <div className="absolute inset-x-[5%] top-[7%] flex justify-between text-[13px] uppercase tracking-[0.2em]" style={{ fontFamily: F.mr }}>
          <span className="font-[700]">Fieldnote Goods</span>
          <span>← Back to archive</span>
        </div>
        <div className="absolute inset-x-[5%] bottom-[8%] top-[18%] flex items-center gap-[5%]">
          <div className="w-[40%]">
            <p data-l className="text-[13px] uppercase tracking-[0.22em] text-[#7a5a2a]" style={{ fontFamily: F.mr }}>
              Outerwear · 01
            </p>
            <h3 data-l className="mt-3 text-[clamp(48px,5vw,84px)] leading-[0.98]" style={{ fontFamily: F.fr }}>
              Field jacket
            </h3>
            <p data-l className="mt-4 max-w-[34ch] text-[16px] text-black/60" style={{ fontFamily: F.mr }}>
              Waxed cotton, corduroy collar, four deep pockets for the walk home.
            </p>
            <div data-l className="mt-6 flex items-center gap-5" style={{ fontFamily: F.sg }}>
              <span className="rounded-full bg-[#141612] px-6 py-3 text-[14px] font-[600] text-[#e9e3d6]">Add to bag</span>
              <span className="text-[20px] tabular-nums">₹ 6,900</span>
            </div>
          </div>
          <div className="x48-w relative h-full flex-1 overflow-hidden rounded-[22px]">
            <div className="x48-in absolute inset-0">
              <Img i={0} w={1100} h={900} />
            </div>
          </div>
        </div>
      </div>
      {Array.from({ length: X48_ROWS }, (_, i) => (
        <div
          key={i}
          className="x48-r absolute inset-x-0 z-20"
          style={{ top: `${(i * 100) / X48_ROWS}%`, height: `${100 / X48_ROWS + 0.2}%`, background: i % 2 ? "#c9a46a" : "#d6b47c", transform: "scaleY(0)" }}
          aria-hidden
        />
      ))}
      <Sheen />
    </Stage>
  );
}

/* ───────────────────────── X49 · Diagonal stripe shutter (WebGL) ───────────────────────── */
const X49_FRAG = /* glsl */ `
uniform float uCount;
void main() {
  // stripes run along the diagonal; d = 0 at the top-left corner, 1 at the bottom-right
  float d = (vUv.x + (1.0 - vUv.y)) * 0.5;
  float s = d * uCount;
  float idx = floor(s);
  float f = fract(s);
  // each slat closes a little after the one before it
  float p = clamp(uProgress * 1.7 - (idx / uCount) * 0.7, 0.0, 1.0);
  float m = sin(p * 3.14159265);
  float side = mod(idx, 2.0) * 2.0 - 1.0;
  // slats slide along their length while they move (alternate directions), plus a slow drift
  vec2 along = vec2(0.7071, 0.7071) * side * m * 0.05;
  vec2 drift = (vUv - 0.5) * (1.0 - 0.02 * sin(uTime * 0.6)) + 0.5;
  vec3 a = texture2D(uTex0, cover(drift + along, uTexRes0)).rgb;
  vec3 b = texture2D(uTex1, cover(drift - along, uTexRes1)).rgb;
  float k = smoothstep(p - 0.015, p + 0.015, f);
  vec3 col = mix(b, a, k);
  // slat shading + a bright edge where the blind is moving
  col *= 1.0 - 0.28 * m * (1.0 - f);
  col += vec3(1.0, 0.9, 0.75) * exp(-pow((f - p) * 60.0, 2.0)) * m * 0.55;
  gl_FragColor = vec4(col, 1.0);
}`;
const X49_P = [
  { i: 4, t: "Blue hour lamp", k: "Lighting · ₹ 5,400" },
  { i: 6, t: "Dusk pendant", k: "Lighting · ₹ 7,850" },
];
function X49() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const st = useRef({ p: 0 });
  useNear(root, () => {
    let dead = false;
    let h: GLHandle | null = null;
    (async () => {
      const tex = await Promise.all(X49_P.map((p) => toCanvas(scene(p.i, 1600, 1000), 1024, 640)));
      if (dead || !cv.current) return;
      h = await createShader(cv.current, X49_FRAG, {
        dpr: 1,
        textures: tex,
        uniforms: { uCount: { value: 9 } },
        onFrame: (u) => {
          u.uProgress.value = st.current.p;
        },
      });
      if (dead) h?.destroy();
    })();
    return () => {
      dead = true;
      h?.destroy();
    };
  });
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const caps = q(".x49-cap");
    const s = st.current;
    s.p = 0;
    gsap.set(caps[1], { autoAlpha: 0 });
    const tl = gsap.timeline({ repeat: -1 });
    const half = (to: number, a: number, b: number) => {
      tl.to(s, { p: to, duration: 1.05, ease: "power2.inOut" })
        .to(caps[a], { autoAlpha: 0, y: -14, duration: 0.35, ease: "power2.in" }, "<0.1")
        .fromTo(caps[b], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.45");
      hold(tl, 0.2);
    };
    half(1, 0, 1);
    half(0, 1, 0);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(120,170,255,.5)" g2="rgba(255,190,130,.22)">
      <div className="absolute inset-0">
        <Img i={X49_P[0].i} w={1600} h={1000} className="absolute inset-0" />
        <canvas ref={cv} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-300" aria-hidden />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,.55),transparent_45%)]" />
      <NavBar
        brand="Lumenhaus"
        menu={
          <span className="flex gap-7">
            <span>Lamps</span>
            <span>Studio</span>
            <span>Bag (0)</span>
          </span>
        }
      />
      <div className="absolute bottom-[9%] left-[6%]">
        {X49_P.map((p, n) => (
          <div key={p.t} className={`x49-cap ${n ? "absolute bottom-0 left-0" : ""}`} style={n ? HIDDEN : undefined}>
            <p className="text-[14px] uppercase tracking-[0.24em] text-[#bcd4ff]" style={{ fontFamily: F.mr }}>
              {p.k}
            </p>
            <h3 className="mt-2 whitespace-nowrap text-[clamp(52px,5.6vw,92px)] leading-[1]" style={{ fontFamily: F.fr }}>
              {p.t}
            </h3>
          </div>
        ))}
      </div>
      <Sheen g1="rgba(120,170,255,.55)" />
    </Stage>
  );
}

/* ───────────────────────── X50 · Corner polygon menu takeover ───────────────────────── */
const X50_LINKS = ["Models", "Configure", "Heritage", "Test drive", "Contact"];
const X50_SHUT = "polygon(100% 0%, 100% 0%, 100% 0%)";
const X50_OPEN = "polygon(100% 0%, -100% 0%, 100% 200%)";
function X50() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const menu = q(".x50-menu")[0];
    const links = q(".x50-link");
    const bars = q(".x50-bar");
    const dot = q(".b13g2x-dot")[0];
    const burger = centre(q(".x50-burger")[0], el);
    const w = el.clientWidth;
    const h = el.clientHeight;
    gsap.set(menu, { autoAlpha: 1, clipPath: X50_SHUT });
    gsap.set(links, { yPercent: 110 });
    gsap.set(dot, { x: w * 0.6, y: h * 0.6, opacity: 1 });
    const hover = links[1];
    const tl = gsap.timeline({ repeat: -1 });
    tl.to(dot, { x: burger.x, y: burger.y, duration: 0.55, ease: "power2.inOut" })
      .to(dot, { scale: 0.7, duration: 0.1, yoyo: true, repeat: 1 })
      // open: the polygon grows from the burger corner over the whole screen, links rise inside
      .to(menu, { clipPath: X50_OPEN, duration: 0.8, ease: "power4.inOut" })
      .to(bars[0], { rotation: 45, y: 4, duration: 0.4, ease: "power2.inOut" }, "<")
      .to(bars[1], { rotation: -45, y: -4, duration: 0.4, ease: "power2.inOut" }, "<")
      .to(links, { yPercent: 0, duration: 0.6, stagger: 0.06, ease: "power3.out" }, "-=0.35")
      // the pointer visits one link (it nudges), then goes back to close
      .to(dot, { x: () => centre(hover, el).x - 80, y: () => centre(hover, el).y, duration: 0.45, ease: "power2.inOut" }, "-=0.3")
      .to(hover, { x: 18, color: "#ffb35c", duration: 0.3, ease: "power2.out" }, "-=0.1")
      .to(hover, { x: 0, color: "#f6f1ea", duration: 0.3, ease: "power2.inOut" }, "+=0.15")
      .to(dot, { x: burger.x, y: burger.y, duration: 0.45, ease: "power2.inOut" }, "<")
      .to(dot, { scale: 0.7, duration: 0.1, yoyo: true, repeat: 1 })
      // close: links drop out, the polygon folds back into the corner
      .to(links, { yPercent: -110, duration: 0.35, stagger: 0.03, ease: "power2.in" })
      .to(menu, { clipPath: X50_SHUT, duration: 0.8, ease: "power4.inOut" }, "-=0.15")
      .to(bars, { rotation: 0, y: 0, duration: 0.4, ease: "power2.inOut" }, "<0.2")
      .set(links, { yPercent: 110 })
      .to(dot, { x: w * 0.6, y: h * 0.6, duration: 0.5, ease: "power2.inOut" }, "-=0.35");
    hold(tl, 0.1);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,150,80,.5)">
      <div className="absolute inset-0 bg-[#101114]">
        <div className="absolute inset-0 bg-[radial-gradient(55%_65%_at_70%_55%,rgba(255,150,80,.16),transparent_70%)]" />
        <div className="absolute inset-x-[5%] top-[7%] text-[13px] font-[700] uppercase tracking-[0.2em]" style={{ fontFamily: F.mr }}>
          Velocar Works
        </div>
        <div className="absolute inset-x-[5%] bottom-[9%] top-[20%] flex items-end justify-between gap-[5%]">
          <div>
            <p className="text-[13px] uppercase tracking-[0.22em] text-[#ffb35c]" style={{ fontFamily: F.mr }}>
              Electric GT · 2027
            </p>
            <h3 className="mt-3 whitespace-nowrap text-[clamp(56px,6vw,100px)] font-[800] uppercase leading-[0.95]" style={{ fontFamily: F.sy }}>
              Arc Seven
            </h3>
            <p className="mt-4 text-[20px] tabular-nums text-white/70" style={{ fontFamily: F.sg }}>
              From ₹ 84,00,000
            </p>
          </div>
          <div className="h-[80%] w-[46%] overflow-hidden rounded-[22px]">
            <Img i={0} w={1100} h={800} />
          </div>
        </div>
      </div>
      <div className="x50-menu absolute inset-0 z-20 bg-[#1b120b]" style={{ ...HIDDEN, clipPath: X50_SHUT }}>
        <div className="absolute inset-0 bg-[radial-gradient(60%_70%_at_85%_10%,rgba(255,150,80,.28),transparent_70%)]" />
        <ul className="absolute left-[8%] top-1/2 -translate-y-1/2 space-y-1">
          {X50_LINKS.map((l, i) => (
            <li key={l} className="overflow-hidden">
              <span className="x50-link flex items-baseline gap-5 text-[clamp(44px,4.8vw,78px)] font-[700] uppercase leading-[1.08]" style={{ fontFamily: F.sy }}>
                <span className="text-[13px] font-[500] tabular-nums text-[#ffb35c]" style={{ fontFamily: F.mr }}>
                  0{i + 1}
                </span>
                {l}
              </span>
            </li>
          ))}
        </ul>
        <p className="absolute bottom-[8%] right-[5%] text-[13px] uppercase tracking-[0.2em] text-white/50" style={{ fontFamily: F.mr }}>
          Showroom by appointment
        </p>
      </div>
      <span className="x50-burger absolute right-[5%] top-[6%] z-30 flex h-12 w-12 flex-col items-center justify-center gap-[6px] rounded-full border border-white/30" aria-hidden>
        <span className="x50-bar block h-[2px] w-5 bg-white" />
        <span className="x50-bar block h-[2px] w-5 bg-white" />
      </span>
      <Dot />
      <Sheen g1="rgba(255,150,80,.5)" />
    </Stage>
  );
}

/* ───────────────────────── X51 · Booklet page turn ───────────────────────── */
function X51TextPage({ k, t, b, price }: { k: string; t: string; b: string; price: string }) {
  return (
    <div className="flex h-full w-full flex-col justify-center bg-[#f3ece0] px-[10%] text-[#1c1712]">
      <p className="text-[12px] uppercase tracking-[0.24em] text-[#9a6a3a]" style={{ fontFamily: F.mr }}>
        {k}
      </p>
      <h3 className="mt-3 text-[clamp(34px,3.2vw,54px)] leading-[1]" style={{ fontFamily: F.fr }}>
        {t}
      </h3>
      <p className="mt-4 text-[15px] leading-[1.5] text-black/60" style={{ fontFamily: F.mr }}>
        {b}
      </p>
      <p className="mt-5 text-[18px] tabular-nums" style={{ fontFamily: F.sg }}>
        {price}
      </p>
    </div>
  );
}
const X51_SHADE = "x51-sh pointer-events-none absolute inset-0 opacity-0";
function X51() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const leaf = q(".x51-leaf")[0];
    const [shL, shU, shF, shB] = q(".x51-sh");
    const tabs = q(".x51-tab");
    const s = { p: 0 };
    const apply = () => {
      const p = s.p;
      gsap.set(leaf, { rotationY: -180 * p });
      // shadows darken both sides while the page is in the air
      gsap.set(shF, { opacity: Math.min(0.6, p * 1.2) });
      gsap.set(shB, { opacity: Math.min(0.6, (1 - p) * 1.2) });
      gsap.set(shU, { opacity: 0.5 * (1 - p) * Math.min(1, p * 6) });
      gsap.set(shL, { opacity: 0.5 * p * Math.min(1, (1 - p) * 6) });
    };
    apply();
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(tabs, { opacity: 0.45 })
      .set(tabs[1], { opacity: 1 })
      .to(s, { p: 1, duration: 1.05, ease: "sine.inOut", onUpdate: apply })
      .to({}, { duration: 0.25 })
      .set(tabs, { opacity: 0.45 })
      .set(tabs[0], { opacity: 1 })
      .to(s, { p: 0, duration: 1.05, ease: "sine.inOut", onUpdate: apply })
      .to({}, { duration: 0.25 });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,196,130,.5)" g2="rgba(140,120,255,.18)">
      <div className="x51-book absolute left-1/2 top-[9%] h-[72%] w-[min(74%,1000px)] -translate-x-1/2">
        <div className="absolute inset-0 rounded-[10px] shadow-[0_40px_100px_rgba(0,0,0,.6)]" />
        {/* left page (spread A) */}
        <div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden rounded-l-[10px]">
          <Img i={1} w={800} h={900} />
          <div className={X51_SHADE} style={{ background: "linear-gradient(90deg,rgba(0,0,0,.2),rgba(0,0,0,.85))" }} />
        </div>
        {/* right page under the leaf (spread B) */}
        <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden rounded-r-[10px]">
          <Img i={3} w={800} h={900} />
          <div className={X51_SHADE} style={{ background: "linear-gradient(90deg,rgba(0,0,0,.85),rgba(0,0,0,.2))" }} />
        </div>
        {/* the turning leaf: front = spread A right, back = spread B left */}
        <div className="x51-leaf absolute inset-y-0 right-0 w-1/2">
          <div className="x51-face overflow-hidden rounded-r-[10px]">
            <X51TextPage k="Chapter one · Orchard" t="Quince, slow-set" b="Late-autumn quince cooked down with jaggery and a single star anise, set in small glass jars." price="Jar of 250 g · ₹ 640" />
            <div className={X51_SHADE} style={{ background: "linear-gradient(90deg,rgba(0,0,0,.75),rgba(0,0,0,.15))" }} />
          </div>
          <div className="x51-face overflow-hidden rounded-l-[10px]" style={{ transform: "rotateY(180deg)" }}>
            <X51TextPage k="Chapter two · Pantry" t="Smoked chilli oil" b="Kashmiri chillies, garlic and sesame, smoked over applewood and steeped for a week." price="Bottle of 200 ml · ₹ 520" />
            <div className={X51_SHADE} style={{ background: "linear-gradient(90deg,rgba(0,0,0,.15),rgba(0,0,0,.75))" }} />
          </div>
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-[3px] -translate-x-1/2 bg-black/30" />
      </div>
      <div className="absolute bottom-[7%] left-1/2 flex -translate-x-1/2 items-center gap-8 text-[14px] uppercase tracking-[0.2em]" style={{ fontFamily: F.sg }}>
        <span className="x51-tab">‹ Prev</span>
        <span className="text-[#ffd09a]" style={{ fontFamily: F.is, fontSize: 22, letterSpacing: 0, textTransform: "none" }}>
          The Larder Book
        </span>
        <span className="x51-tab opacity-45">Next ›</span>
      </div>
      <Sheen g1="rgba(255,196,130,.55)" />
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "X42", name: "Fast mask slide with inner counter-move", how: "The next image slides up through a mask while the picture inside moves the other way; then the title letters slide in", kind: "play", C: X42 },
  { code: "X43", name: "Rounded panel with cover unreveal", how: "A rounded menu panel slides down while the cover inside it travels up; titles rise and pictures drop in, then it all reverses", kind: "play", C: X43 },
  { code: "X44", name: "Rotating title chars + diagonal thumbs", how: "Title letters tip 3deg and slide out in a stagger as tilted thumbs fly off diagonally; the next title rotates back to 0", kind: "play", C: X44 },
  { code: "X45", name: "Section scale-zoom slideshow", how: "The next section's image slides in from below (or above) scaling 1.8 to 1 from that edge; facts slide in and the counter steps", kind: "play", C: X45 },
  { code: "X46", name: "3D slice-box turn", how: "The picture is cut into 3D slice boxes that turn 90deg one after another from the centre to show the next image", kind: "play", C: X46 },
  { code: "X47", name: "Four-quadrant split-out", how: "The image splits into four quadrants that slide out in four directions, revealing the next image underneath", kind: "play", C: X47 },
  { code: "X48", name: "Row cover with opposite slide-in", how: "Horizontal bands stagger in to cover the page, then retract as the preview and its picture slide in from opposite sides", kind: "play", C: X48 },
  { code: "X49", name: "Diagonal stripe shutter", how: "Diagonal slats slide and snap shut like a blind to swap two frames, then open back (WebGL shader)", kind: "play", C: X49 },
  { code: "X50", name: "Corner polygon menu takeover", how: "A clip-path polygon grows from the burger corner to cover the screen, links rise inside; closing folds it back", kind: "play", C: X50 },
  { code: "X51", name: "Booklet page turn", how: "The right half of a booklet lifts and flips 180deg round the spine, shadows darkening both sides; then it turns back", kind: "play", C: X51 },
];
