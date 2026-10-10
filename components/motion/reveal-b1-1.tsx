"use client";

// MOTION-MENU M75–M86 (reveal group, batch 1): small focused demos for /lab/motion.
// "scrub" demos map the panel's scroll LINEARLY onto a paused timeline (useScrub → tl.progress(p)).
// "play" demos start when on screen, loop, and pause off screen. Every demo also has a CSS-only glow loop.
// ?static=1 / reduced motion: no animation, final state.
import { useEffect, useRef, type CSSProperties, type RefObject } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { scene, useScrub } from "@/components/fx/shared";
import { Product } from "@/components/sections/kit";
import type { MotionDef } from "./types";

const GROTESK = "'Space Grotesk Variable', system-ui, sans-serif";
const SERIF = "'Fraunces Variable', Georgia, serif";
const EDITORIAL = "'Instrument Serif', Georgia, serif";
const WIDE = "'Syne Variable', 'Space Grotesk Variable', system-ui, sans-serif";

/* ---------- shared helpers ---------- */

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

/** Scrub: a paused timeline built once; scroll progress (0..1 over the whole panel) drives tl.progress linearly. */
function useScrubTl(root: RefObject<HTMLDivElement | null>, build: (tl: gsap.core.Timeline, el: HTMLDivElement) => void) {
  const tl = useRef<gsap.core.Timeline | null>(null);
  const pr = useRef(0);
  const fn = useRef(build);
  fn.current = build;
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const t = gsap.timeline({ paused: true, defaults: { ease: "none" } });
      fn.current(t, el);
      tl.current = t;
      t.progress(pr.current);
    }, el);
    return () => {
      tl.current = null;
      ctx.revert();
    };
  }, [root]);
  useScrub(root, (p) => {
    pr.current = p;
    tl.current?.progress(p);
  });
}

/** Play: a looping timeline that starts when the demo is on screen and pauses off screen. Reduced motion → `final`. */
function usePlay(root: RefObject<HTMLDivElement | null>, build: (el: HTMLDivElement) => gsap.core.Timeline, final?: (el: HTMLDivElement) => void) {
  const fn = useRef(build);
  fn.current = build;
  const fin = useRef(final);
  fin.current = final;
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      const ctx = gsap.context(() => fin.current?.(el), el);
      return () => ctx.revert();
    }
    let tl: gsap.core.Timeline | null = null;
    const ctx = gsap.context(() => {
      tl = fn.current(el);
      tl.pause();
    }, el);
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? tl?.play() : tl?.pause()), { threshold: 0.15 });
    io.observe(el);
    return () => {
      io.disconnect();
      ctx.revert();
    };
  }, [root]);
}

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, className = "", style, label = "", w = 1400, h = 900 }: { i: number; className?: string; style?: CSSProperties; label?: string; w?: number; h?: number }) => <img src={scene(i, w, h, label)} alt="" className={`h-full w-full object-cover ${className}`} style={style} draggable={false} />;

/* ---------- M75 · Product rises from behind a horizon (variant of M1: hard horizon mask + shadow, not a fade-up) ---------- */
function M75() {
  const root = useRef<HTMLDivElement>(null);
  useScrubTl(root, (tl) => {
    tl.fromTo(".m75-prod", { yPercent: 100 }, { yPercent: 0, duration: 1 }, 0)
      .fromTo(".m75-shadow", { opacity: 0, scaleX: 0.35 }, { opacity: 1, scaleX: 1, duration: 1 }, 0)
      .fromTo(".m75-copy", { yPercent: 30, opacity: 0.25 }, { yPercent: 0, opacity: 1, duration: 1 }, 0);
  });
  return (
    <div ref={root} className="relative h-full w-full overflow-hidden rounded-[24px] bg-[#1d120c]">
      <Glow code="m75" color="rgba(255,138,61,.55)" at="62% 55%" />
      {/* the table / colour band: its top edge is the horizon */}
      <div className="absolute inset-x-0 bottom-0 h-[30%] bg-[#e8743b]" />
      <div className="m75-shadow absolute bottom-[25%] left-[62%] h-[5%] w-[22%] -ml-[11%] rounded-[50%] bg-black/45 blur-[10px]" />
      {/* overflow hidden ends exactly at the horizon line */}
      <div className="absolute bottom-[30%] left-[62%] top-[6%] w-[22%] -ml-[11%] overflow-hidden">
        <div className="m75-prod flex h-full w-full items-end justify-center will-change-transform">
          <Product angle={1} accent="#e8743b" className="h-[96%] w-auto" />
        </div>
      </div>
      <div className="m75-copy absolute left-[6%] top-[14%] max-w-[38%]">
        <p className="text-[13px] uppercase tracking-[0.2em] text-[#ffcfae]/70">Batch 07 · Cold-pressed</p>
        <h3 className="mt-3 text-[clamp(40px,5.2vw,84px)] leading-[0.92] text-[#fff1e6]" style={{ fontFamily: SERIF, fontWeight: 600 }}>
          Bottled at first light.
        </h3>
      </div>
      <div className="absolute bottom-[9%] left-[6%] text-[#2a140a]">
        <p className="text-[clamp(18px,1.6vw,24px)] font-[700]" style={{ fontFamily: GROTESK }}>
          Dawn Tonic · 330 ml
        </p>
        <p className="text-[15px] opacity-75">₹ 240 · ships chilled</p>
      </div>
    </div>
  );
}

/* ---------- M76 · Product rises in front of giant type (variant of M25: two rates, product covers the letters) ---------- */
function M76() {
  const root = useRef<HTMLDivElement>(null);
  useScrubTl(root, (tl) => {
    tl.fromTo(".m76-word", { scale: 0.86, yPercent: 6 }, { scale: 1.06, yPercent: -4, duration: 1 }, 0)
      .fromTo(".m76-prod", { yPercent: 85, rotation: -14 }, { yPercent: -6, rotation: 5, duration: 1 }, 0)
      .fromTo(".m76-tag", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4 }, 0.6);
  });
  return (
    <div ref={root} className="relative h-full w-full overflow-hidden rounded-[24px] bg-[#0a0f1f]">
      <Glow code="m76" color="rgba(79,141,255,.6)" at="50% 60%" />
      <div className="absolute inset-0 grid place-items-center">
        <p className="m76-word select-none whitespace-nowrap text-[clamp(120px,19vw,300px)] font-[800] leading-none tracking-[-0.05em] text-[#cfe0ff] will-change-transform" style={{ fontFamily: WIDE }}>
          AERO
        </p>
      </div>
      <div className="m76-prod absolute bottom-[-4%] left-1/2 top-[8%] w-[20%] -ml-[10%] will-change-transform">
        <Product angle={0} accent="#4f8dff" className="h-full w-full drop-shadow-[0_40px_60px_rgba(0,0,0,.6)]" />
      </div>
      <div className="m76-tag absolute bottom-[8%] right-[5%] text-right">
        <p className="text-[clamp(18px,1.6vw,24px)] font-[700]" style={{ fontFamily: GROTESK }}>
          Aero Sparkling · Yuzu
        </p>
        <p className="text-[15px] text-white/60">₹ 180 · 12 g sugar less</p>
      </div>
    </div>
  );
}

/* ---------- M77 · Image seen through the headline (variant of M24: the text is the mask, then it scales away) ---------- */
function M77() {
  const root = useRef<HTMLDivElement>(null);
  useScrubTl(root, (tl) => {
    tl.fromTo(".m77-text", { scale: 1 }, { scale: 9, svgOrigin: "800 470", duration: 1, ease: "power1.in" }, 0)
      .fromTo(".m77-full", { opacity: 0 }, { opacity: 1, duration: 0.45 }, 0.5)
      .fromTo(".m77-par", { scale: 1.3, yPercent: 6 }, { scale: 1, yPercent: 0, duration: 1 }, 0)
      .fromTo(".m77-cap", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.25 }, 0.75);
  });
  const src = scene(1, 1600, 900);
  return (
    <div ref={root} className="relative h-full w-full overflow-hidden rounded-[24px] bg-[#0b0710]">
      <Glow code="m77" color="rgba(255,77,109,.38)" at="40% 50%" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-label="Amalfi">
        <defs>
          <mask id="m77-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1600" height="900">
            <rect width="1600" height="900" fill="black" />
            <g className="m77-text">
              <text x="800" y="560" textAnchor="middle" fill="white" fontSize="330" fontWeight="800" letterSpacing="-12" style={{ fontFamily: GROTESK }}>
                AMALFI
              </text>
            </g>
          </mask>
        </defs>
        <g className="m77-par">
          <image href={src} width="1600" height="900" preserveAspectRatio="xMidYMid slice" opacity="0.1" />
          <image href={src} width="1600" height="900" preserveAspectRatio="xMidYMid slice" mask="url(#m77-mask)" />
          <image className="m77-full" href={src} width="1600" height="900" preserveAspectRatio="xMidYMid slice" />
        </g>
      </svg>
      <div className="m77-cap absolute bottom-[8%] left-[5%]">
        <p className="text-[clamp(28px,3vw,48px)] leading-none" style={{ fontFamily: EDITORIAL }}>
          Seven nights on the coast
        </p>
        <p className="mt-2 text-[15px] text-white/65">From ₹ 1,84,000 per couple</p>
      </div>
    </div>
  );
}

/* ---------- M78 · Letterbox band opens (variant of M18: a horizontal band opening + counter-scale inside) ---------- */
function M78() {
  const root = useRef<HTMLDivElement>(null);
  useScrubTl(root, (tl) => {
    tl.fromTo(".m78-clip", { clipPath: "inset(45% 0% 45% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1 }, 0)
      .fromTo(".m78-img", { scale: 1.15 }, { scale: 1, duration: 1 }, 0)
      .fromTo(".m78-top", { yPercent: 0 }, { yPercent: -120, duration: 1 }, 0)
      .fromTo(".m78-bot", { yPercent: 0 }, { yPercent: 120, duration: 1 }, 0);
  });
  return (
    <div ref={root} className="relative h-full w-full overflow-hidden rounded-[24px] bg-[#120d06]">
      <Glow code="m78" color="rgba(224,145,63,.45)" at="50% 50%" />
      <div className="m78-clip absolute inset-0 overflow-hidden rounded-[24px] will-change-[clip-path]">
        <Img i={3} className="m78-img will-change-transform" label="WOOD FIRE" />
        <div className="absolute inset-0 grid place-items-center">
          <p className="text-center text-[clamp(44px,6vw,96px)] leading-[0.95] text-[#fff6e8] drop-shadow-[0_6px_30px_rgba(0,0,0,.5)]" style={{ fontFamily: EDITORIAL }}>
            Slow food, open fire
          </p>
        </div>
      </div>
      <p className="m78-top pointer-events-none absolute left-1/2 top-[33%] -ml-[150px] w-[300px] text-center text-[13px] uppercase tracking-[0.3em] text-[#ffd59a]/80">Ember Kitchen · Est. 2019</p>
      <p className="m78-bot pointer-events-none absolute bottom-[33%] left-1/2 -ml-[150px] w-[300px] text-center text-[13px] uppercase tracking-[0.3em] text-[#ffd59a]/80">Tasting menu ₹ 4,200</p>
    </div>
  );
}

/* ---------- M79 · Full-bleed hero shrinks into its frame (variant of M13: a shrink into the layout, not a portal) ---------- */
function M79() {
  const root = useRef<HTMLDivElement>(null);
  useScrubTl(root, (tl) => {
    tl.fromTo(".m79-hero", { clipPath: "inset(0% 0% 0% 0% round 0px)" }, { clipPath: "inset(10% 6% 10% 48% round 28px)", duration: 1 }, 0)
      .fromTo(".m79-img", { scale: 1.12 }, { scale: 1, duration: 1 }, 0)
      .fromTo(".m79-big", { opacity: 1, yPercent: 0 }, { opacity: 0, yPercent: -40, duration: 0.35 }, 0)
      .fromTo(".m79-in", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.08 }, 0.4);
  });
  return (
    <div ref={root} className="relative h-full w-full overflow-hidden rounded-[24px] bg-[#f1fff4] text-[#07140f]">
      <Glow code="m79" color="rgba(24,196,143,.4)" at="25% 50%" />
      <div className="absolute left-[6%] top-[14%] max-w-[38%]">
        <p className="m79-in text-[13px] uppercase tracking-[0.2em] text-[#0b5a42]">Spring collection</p>
        <h3 className="m79-in mt-3 text-[clamp(40px,4.6vw,76px)] font-[700] leading-[0.95] tracking-[-0.02em]" style={{ fontFamily: GROTESK }}>
          Linen for long days.
        </h3>
        <p className="m79-in mt-4 max-w-[36ch] text-[16px] text-[#07140f]/70">Washed linen sets in four field colours. Made in small runs.</p>
        <p className="m79-in mt-6 inline-flex rounded-full bg-[#07140f] px-6 py-3 text-[15px] font-[600] text-[#f1fff4]">Shop sets · from ₹ 3,900</p>
      </div>
      <div className="m79-hero absolute inset-0 overflow-hidden will-change-[clip-path]">
        <Img i={2} className="m79-img will-change-transform" />
        <p className="m79-big absolute inset-x-0 bottom-[10%] text-center text-[clamp(64px,10vw,160px)] font-[700] leading-none tracking-[-0.04em] text-[#f1fff4]" style={{ fontFamily: GROTESK }}>
          Fieldwear
        </p>
      </div>
    </div>
  );
}

/* ---------- M80 · Zoom-out reveals the gallery (variant of M28: one full-frame image becomes one tile of a grid) ---------- */
function M80() {
  const root = useRef<HTMLDivElement>(null);
  useScrubTl(root, (tl, el) => {
    const grid = el.querySelector<HTMLElement>(".m80-grid")!;
    const mid = el.querySelector<HTMLElement>(".m80-mid")!;
    const cover = () => Math.max(el.clientWidth / mid.offsetWidth, el.clientHeight / mid.offsetHeight) * 1.02;
    const others = gsap.utils.toArray<HTMLElement>(".m80-tile", grid);
    tl.fromTo(mid, { scale: cover }, { scale: 1, duration: 1 }, 0)
      .fromTo(mid.querySelector("img"), { scale: 1 }, { scale: 1.1, duration: 1 }, 0)
      .fromTo(others, { opacity: 0, scale: 0.85, y: (i) => (i % 2 ? 60 : -60) }, { opacity: 1, scale: 1, y: 0, duration: 0.55, stagger: 0.03 }, 0.35);
  });
  const labels = ["Lisbon", "Kyoto", "Oaxaca", "Hampi", "", "Tbilisi", "Porto", "Lamu", "Ronda"];
  return (
    <div ref={root} className="relative grid h-full w-full place-items-center overflow-hidden rounded-[24px] bg-[#0b1020]">
      <Glow code="m80" color="rgba(47,140,255,.45)" at="50% 50%" />
      <div className="m80-grid relative grid h-[88%] w-[min(92%,1100px)] grid-cols-3 grid-rows-3 gap-[1.4vw]">
        {labels.map((l, i) =>
          i === 4 ? (
            <figure key={i} className="m80-mid relative z-10 overflow-hidden rounded-[14px] will-change-transform">
              <Img i={0} w={1000} h={600} />
              <figcaption className="absolute bottom-3 left-4 text-[15px] font-[700]" style={{ fontFamily: GROTESK }}>
                Reykjavík · ₹ 92,000
              </figcaption>
            </figure>
          ) : (
            <figure key={i} className="m80-tile relative overflow-hidden rounded-[14px] will-change-transform">
              <Img i={i + 1} w={1000} h={600} />
              <figcaption className="absolute bottom-3 left-4 text-[14px] font-[600] text-white/85">{l}</figcaption>
            </figure>
          ),
        )}
      </div>
    </div>
  );
}

/* ---------- M81 · Media opens between two words (variant of M28: the window grows inside the line and pushes words apart) ---------- */
function M81() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(
    root,
    () =>
      gsap
        .timeline({ repeat: -1, yoyo: true, repeatDelay: 0.25 })
        .fromTo(".m81-win", { width: 0 }, { width: "clamp(160px,24vw,380px)", duration: 1, ease: "expo.out" }, 0)
        .fromTo(".m81-win img", { scale: 1.35 }, { scale: 1, duration: 1.2, ease: "expo.out" }, 0),
    () => gsap.set(".m81-win", { width: "clamp(160px,24vw,380px)" }),
  );
  return (
    <div ref={root} className="relative grid h-full w-full place-items-center overflow-hidden rounded-[24px] bg-[#140f07]">
      <Glow code="m81" color="rgba(224,145,63,.45)" at="50% 50%" />
      <div className="relative flex items-center whitespace-nowrap text-[clamp(56px,8vw,128px)] leading-none text-[#fff6e8]" style={{ fontFamily: SERIF, fontWeight: 500 }}>
        <span>Made</span>
        <span className="m81-win mx-[0.18em] inline-block h-[0.9em] w-0 overflow-hidden rounded-full">
          <Img i={3} w={800} h={500} />
        </span>
        <span className="italic">by hand</span>
      </div>
      <p className="absolute bottom-[8%] text-[15px] text-[#ffd59a]/70">Terracotta planters · from ₹ 1,450</p>
    </div>
  );
}

/* ---------- M82 · Block reveal, two-phase box wipe, the four directions cycling ---------- */
const M82_DIRS = [
  { label: "left to right", axis: "scaleX", a: "left center", b: "right center" },
  { label: "right to left", axis: "scaleX", a: "right center", b: "left center" },
  { label: "top to bottom", axis: "scaleY", a: "center top", b: "center bottom" },
  { label: "bottom to top", axis: "scaleY", a: "center bottom", b: "center top" },
] as const;
const M82_ITEMS = [
  { title: "Indigo Field Jacket", price: "₹ 6,800", i: 0 },
  { title: "Clay Knit Pullover", price: "₹ 4,200", i: 1 },
  { title: "Moss Cargo Trouser", price: "₹ 3,600", i: 2 },
  { title: "Saffron Overshirt", price: "₹ 3,900", i: 3 },
];
function M82() {
  const root = useRef<HTMLDivElement>(null);
  const swap = (el: HTMLElement, k: number) => {
    const it = M82_ITEMS[k % M82_ITEMS.length];
    el.querySelector<HTMLImageElement>(".m82-img")!.src = scene(it.i, 900, 1100);
    el.querySelector(".m82-title")!.textContent = it.title;
    el.querySelector(".m82-price")!.textContent = it.price;
  };
  usePlay(
    root,
    (el) => {
      const blocks = gsap.utils.toArray<HTMLElement>(".m82-block", el);
      const tl = gsap.timeline({ repeat: -1 });
      M82_DIRS.forEach((d, k) => {
        const other = d.axis === "scaleX" ? "scaleY" : "scaleX";
        tl.set(blocks, { [d.axis]: 0, [other]: 1, transformOrigin: d.a })
          .call(() => {
            el.querySelector(".m82-dir")!.textContent = `${k + 1} / 4 · ${d.label}`;
          })
          .to(blocks, { [d.axis]: 1, duration: 0.5, ease: "power3.inOut", stagger: 0.12 })
          .call(() => swap(el, k + 1))
          .set(blocks, { transformOrigin: d.b })
          .to(blocks, { [d.axis]: 0, duration: 0.5, ease: "power3.inOut", stagger: 0.12 })
          .to({}, { duration: 0.2 });
      });
      return tl;
    },
    (el) => {
      gsap.set(".m82-block", { scaleX: 0 });
      swap(el, 0);
    },
  );
  const first = M82_ITEMS[0];
  return (
    <div ref={root} className="relative h-full w-full overflow-hidden rounded-[24px] bg-[#0d0a14]">
      <Glow code="m82" color="rgba(138,92,246,.45)" at="35% 55%" />
      <div className="relative flex h-full items-center gap-[5vw] px-[6%]">
        <div className="relative h-[82%] w-[min(30%,380px)] overflow-hidden rounded-[18px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="m82-img h-full w-full object-cover" src={scene(first.i, 900, 1100)} alt="" />
          <div className="m82-block absolute inset-0 bg-[#b9a2ff] will-change-transform" style={{ transform: "scaleX(0)", transformOrigin: "left center" }} />
        </div>
        <div className="relative">
          <p className="m82-dir mb-6 inline-flex rounded-full border border-white/20 px-4 py-1.5 text-[13px] uppercase tracking-[0.16em] text-white/70">1 / 4 · left to right</p>
          <div className="relative w-fit overflow-hidden pr-2">
            <h3 className="m82-title text-[clamp(40px,5vw,84px)] font-[700] leading-[0.95] tracking-[-0.02em]" style={{ fontFamily: GROTESK }}>
              {first.title}
            </h3>
            <div className="m82-block absolute inset-0 bg-[#b9a2ff] will-change-transform" style={{ transform: "scaleX(0)", transformOrigin: "left center" }} />
          </div>
          <div className="relative mt-4 w-fit overflow-hidden">
            <p className="m82-price text-[clamp(20px,2vw,30px)] text-white/75">{first.price}</p>
            <div className="m82-block absolute inset-0 bg-[#b9a2ff] will-change-transform" style={{ transform: "scaleX(0)", transformOrigin: "left center" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- M83 · Paper-tear headline reveal (variant of M62: the word rips in two, an image rises behind) ---------- */
const M83_TEAR = (() => {
  // deterministic jagged tear line from top to bottom around x = 800
  const pts: [number, number][] = [];
  let s = 7;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let y = -60; y <= 960; y += 34) pts.push([800 + (rnd() - 0.5) * 70 + Math.sin(y / 90) * 22, y]);
  return pts;
})();
const m83Line = M83_TEAR.map(([x, y]) => `${x.toFixed(1)},${y}`).join(" ");
const m83Left = `-1200,-60 ${m83Line} -1200,960`;
const m83Right = `2800,-60 ${m83Line} 2800,960`;
function M83() {
  const root = useRef<HTMLDivElement>(null);
  useScrubTl(root, (tl) => {
    tl.fromTo(".m83-crack", { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.2 }, 0)
      .to(".m83-crack", { opacity: 0, duration: 0.05 }, 0.2)
      .fromTo(".m83-l", { x: 0, rotation: 0 }, { x: -980, rotation: -9, svgOrigin: "800 900", duration: 0.8 }, 0.2)
      .fromTo(".m83-r", { x: 0, rotation: 0 }, { x: 980, rotation: 9, svgOrigin: "800 900", duration: 0.8 }, 0.2)
      .fromTo(".m83-img", { yPercent: 35, scale: 1.12 }, { yPercent: 0, scale: 1, duration: 0.85 }, 0.15)
      .fromTo(".m83-cap", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.25 }, 0.75);
  });
  const half = (side: "l" | "r") => (
    <g className={`m83-${side}`} clipPath={`url(#m83-${side}clip)`}>
      <rect x="-1200" y="-60" width="4000" height="1020" fill="#efe6d6" />
      <rect x="-1200" y="-60" width="4000" height="1020" fill="url(#m83-grain)" opacity=".5" />
      <text x="800" y="580" textAnchor="middle" fill="#1b140c" fontSize="380" fontWeight="800" letterSpacing="-14" style={{ fontFamily: WIDE }}>
        WILD
      </text>
      <polyline points={m83Line} fill="none" stroke="#fffaf0" strokeWidth="10" strokeLinejoin="round" />
    </g>
  );
  return (
    <div ref={root} className="relative h-full w-full overflow-hidden rounded-[24px] bg-[#07140f]">
      <Glow code="m83" color="rgba(200,255,138,.35)" at="50% 40%" />
      <div className="m83-img absolute inset-0 will-change-transform">
        <Img i={2} label="TRAIL 04" />
      </div>
      <div className="m83-cap absolute bottom-[8%] left-[5%]">
        <p className="text-[clamp(26px,2.6vw,40px)] font-[700]" style={{ fontFamily: GROTESK }}>
          Ridge Runner GTX
        </p>
        <p className="text-[15px] text-white/70">₹ 11,990 · built for loose ground</p>
      </div>
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-label="Wild">
        <defs>
          <clipPath id="m83-lclip">
            <polygon points={m83Left} />
          </clipPath>
          <clipPath id="m83-rclip">
            <polygon points={m83Right} />
          </clipPath>
          <pattern id="m83-grain" width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="#efe6d6" />
            <circle cx="1.5" cy="2" r=".8" fill="#cdbfa6" />
            <circle cx="4.5" cy="4.6" r=".6" fill="#d9ccb5" />
          </pattern>
        </defs>
        {half("l")}
        {half("r")}
        <polyline className="m83-crack" points={m83Line} fill="none" stroke="#1b140c" strokeWidth="5" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/* ---------- M84 · Folded flyer unfolds (variant of M2: panels rotate open on hinges in 3D, with shading) ---------- */
const M84_MENU = [
  [
    ["Charred corn", "₹ 340"],
    ["Burrata, fig", "₹ 620"],
    ["Smoked beet", "₹ 380"],
  ],
  [
    ["Saffron risotto", "₹ 780"],
    ["Lamb, black lime", "₹ 1,140"],
    ["Wild mushroom", "₹ 720"],
  ],
  [
    ["Cardamom flan", "₹ 360"],
    ["Mango, chilli", "₹ 320"],
    ["Jaggery tart", "₹ 340"],
  ],
];
function M84Panel({ k, title }: { k: number; title: string }) {
  return (
    <div className="absolute inset-0 flex flex-col bg-[#f7efe1] p-[clamp(16px,2vw,30px)] text-[#2a1a0e] [backface-visibility:hidden]">
      <p className="text-[13px] uppercase tracking-[0.2em] text-[#a0521d]">{["Small plates", "Mains", "Sweets"][k]}</p>
      <p className="mt-2 text-[clamp(26px,2.4vw,38px)] leading-none" style={{ fontFamily: EDITORIAL }}>
        {title}
      </p>
      <ul className="mt-auto space-y-3">
        {M84_MENU[k].map(([n, p]) => (
          <li key={n} className="flex items-baseline justify-between gap-3 border-b border-[#2a1a0e]/15 pb-2 text-[15px]">
            <span>{n}</span>
            <span className="tabular-nums text-[#a0521d]">{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
function M84Back({ cover }: { cover: boolean }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-[#2a1a0e] text-center text-[#f7efe1] [backface-visibility:hidden] [transform:rotateY(180deg)]">
      {cover ? (
        <div>
          <p className="text-[13px] uppercase tracking-[0.3em] text-[#e0913f]">Supper menu</p>
          <p className="mt-3 text-[clamp(34px,3.4vw,54px)] leading-[0.95]" style={{ fontFamily: EDITORIAL }}>
            Saffron
            <br />
            House
          </p>
        </div>
      ) : (
        <p className="text-[13px] uppercase tracking-[0.3em] text-white/50">Thank you</p>
      )}
    </div>
  );
}
function M84() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, () =>
    gsap
      .timeline({ repeat: -1, yoyo: true, repeatDelay: 0.3, defaults: { ease: "power2.inOut" } })
      .fromTo(".m84-left", { rotationY: 180 }, { rotationY: 0, duration: 0.75 }, 0)
      .fromTo(".m84-left .m84-shade", { opacity: 0.55 }, { opacity: 0, duration: 0.75 }, 0)
      .fromTo(".m84-right", { rotationY: -180 }, { rotationY: 0, duration: 0.75 }, 0.6)
      .fromTo(".m84-right .m84-shade", { opacity: 0.55 }, { opacity: 0, duration: 0.75 }, 0.6),
  );
  return (
    <div ref={root} className="relative grid h-full w-full place-items-center overflow-hidden rounded-[24px] bg-[#1a100a]" style={{ perspective: "1800px" }}>
      <Glow code="m84" color="rgba(224,145,63,.45)" at="50% 50%" />
      <div className="m84-flyer relative flex h-[82%] w-[min(84%,1000px)] [transform-style:preserve-3d]">
        <div className="m84-left relative z-[2] h-full flex-1 origin-right [transform-style:preserve-3d]" style={{ transform: "translateZ(2px)" }}>
          <M84Panel k={0} title="To share" />
          <M84Back cover />
          <div className="m84-shade pointer-events-none absolute inset-0 bg-black opacity-0 [backface-visibility:hidden]" />
        </div>
        <div className="relative z-0 h-full flex-1">
          <M84Panel k={1} title="From the fire" />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-[#2a1a0e]/20" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-[#2a1a0e]/20" />
        </div>
        <div className="m84-right relative z-[1] h-full flex-1 origin-left [transform-style:preserve-3d]" style={{ transform: "translateZ(1px)" }}>
          <M84Panel k={2} title="To finish" />
          <M84Back cover={false} />
          <div className="m84-shade pointer-events-none absolute inset-0 bg-black opacity-0 [backface-visibility:hidden]" />
        </div>
      </div>
    </div>
  );
}

/* ---------- M85 · Sticky text with clip-path image steps (variant of M18: steps open one by one, heading swaps, icon ticks) ---------- */
const M85_STEPS = [
  { h: "Pick your roast", t: "Light, medium or dark: we roast to order.", i: 3 },
  { h: "We grind it fresh", t: "Set for your brewer, sealed the same hour.", i: 1 },
  { h: "At your door Friday", t: "250 g bags from ₹ 560, pause any week.", i: 0 },
];
function M85() {
  const root = useRef<HTMLDivElement>(null);
  useScrubTl(root, (tl) => {
    M85_STEPS.forEach((_, k) => {
      tl.fromTo(`.m85-img-${k}`, { clipPath: "inset(100% 0% 0% 0% round 20px)" }, { clipPath: "inset(0% 0% 0% 0% round 20px)", duration: 0.7 }, k)
        .fromTo(`.m85-img-${k} img`, { scale: 1.2 }, { scale: 1, duration: 1 }, k)
        .fromTo(`.m85-tick-${k}`, { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.25 }, k + 0.6)
        .fromTo(`.m85-dot-${k}`, { backgroundColor: "rgba(255,255,255,0)" }, { backgroundColor: "#e0913f", duration: 0.2 }, k + 0.55);
      if (k > 0) tl.to(`.m85-h-${k - 1}`, { yPercent: -110, opacity: 0, duration: 0.3 }, k + 0.15);
      tl.fromTo(`.m85-h-${k}`, { yPercent: k ? 110 : 0, opacity: k ? 0 : 1 }, { yPercent: 0, opacity: 1, duration: k ? 0.3 : 0.001 }, k + 0.15);
    });
  });
  return (
    <div ref={root} className="relative h-full w-full overflow-hidden rounded-[24px] bg-[#140f07]">
      <Glow code="m85" color="rgba(224,145,63,.38)" at="30% 50%" />
      <div className="relative grid h-full grid-cols-[1fr_1fr] items-center gap-[4vw] px-[6%]">
        <div>
          <div className="relative h-[clamp(120px,14vw,200px)] overflow-hidden">
            {M85_STEPS.map((s, k) => (
              <div key={k} className={`m85-h-${k} absolute inset-0 will-change-transform`}>
                <p className="text-[13px] uppercase tracking-[0.2em] text-[#ffd59a]/70">Step 0{k + 1}</p>
                <h3 className="mt-2 text-[clamp(38px,4.4vw,72px)] leading-[0.95] text-[#fff6e8]" style={{ fontFamily: SERIF, fontWeight: 600 }}>
                  {s.h}
                </h3>
                <p className="mt-2 text-[16px] text-[#fff6e8]/65">{s.t}</p>
              </div>
            ))}
          </div>
          <ul className="mt-8 flex gap-4">
            {M85_STEPS.map((_, k) => (
              <li key={k} className={`m85-dot-${k} grid h-11 w-11 place-items-center rounded-full border border-[#e0913f]/60`}>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#140f07" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path className={`m85-tick-${k}`} d="M5 12.5l4.2 4.2L19 7" />
                </svg>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative h-[86%]">
          {M85_STEPS.map((s, k) => (
            <figure key={k} className={`m85-img-${k} absolute inset-0 overflow-hidden rounded-[20px] will-change-[clip-path]`} style={{ zIndex: k }}>
              <Img i={s.i} w={1000} h={1100} />
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- M86 · Pinned list with cross-swapping visual (variant of M29: list highlight + visual slides up out / up in) ---------- */
const M86_ITEMS = [
  { n: "Guided treks", d: "Small groups, local guides", i: 2 },
  { n: "Coastal stays", d: "Rooms a step from the sea", i: 0 },
  { n: "Food trails", d: "Markets, kitchens, home cooks", i: 3 },
  { n: "Rail journeys", d: "Slow routes, window seats", i: 1 },
];
function M86() {
  const root = useRef<HTMLDivElement>(null);
  useScrubTl(root, (tl) => {
    const n = M86_ITEMS.length;
    M86_ITEMS.forEach((_, k) => {
      // each item owns 1 unit: its line fills; at the end the visual swaps to the next one
      tl.fromTo(`.m86-bar-${k}`, { scaleX: 0 }, { scaleX: 1, duration: 1 }, k);
      if (k === 0) tl.set(".m86-row-0", { opacity: 1, x: 24 }, 0);
      else tl.set(`.m86-vis-${k}`, { yPercent: 100 }, 0);
      if (k < n - 1) {
        const at = k + 0.75;
        tl.to(`.m86-row-${k}`, { opacity: 0.32, x: 0, duration: 0.25 }, at)
          .fromTo(`.m86-row-${k + 1}`, { opacity: 0.32, x: 0 }, { opacity: 1, x: 24, duration: 0.25 }, at)
          .to(`.m86-vis-${k}`, { yPercent: -100, duration: 0.25 }, at)
          .fromTo(`.m86-vis-${k + 1}`, { yPercent: 100 }, { yPercent: 0, duration: 0.25 }, at)
          .fromTo(`.m86-vis-${k + 1} img`, { scale: 1.25 }, { scale: 1, duration: 0.5 }, at);
      }
    });
  });
  return (
    <div ref={root} className="relative h-full w-full overflow-hidden rounded-[24px] bg-[#0b1020]">
      <Glow code="m86" color="rgba(47,140,255,.42)" at="70% 50%" />
      <div className="relative grid h-full grid-cols-[1fr_1fr] items-center gap-[4vw] px-[6%]">
        <ul>
          {M86_ITEMS.map((it, k) => (
            <li key={k} className={`m86-row-${k} border-b border-white/10 py-[clamp(10px,1.6vh,18px)] will-change-transform`} style={{ opacity: k ? 0.32 : 1 }}>
              <p className="text-[clamp(30px,3.4vw,54px)] font-[700] leading-none tracking-[-0.02em]" style={{ fontFamily: GROTESK }}>
                <span className="mr-4 text-[15px] align-middle text-[#4f8dff]">0{k + 1}</span>
                {it.n}
              </p>
              <p className="mt-1 text-[15px] text-white/60">{it.d}</p>
              <div className={`m86-bar-${k} mt-3 h-[2px] bg-[#4f8dff]`} style={{ transform: "scaleX(0)", transformOrigin: "left center" }} />
            </li>
          ))}
        </ul>
        <div className="relative h-[80%] overflow-hidden rounded-[20px]">
          {M86_ITEMS.map((it, k) => (
            <figure key={k} className={`m86-vis-${k} absolute inset-0 overflow-hidden will-change-transform`}>
              <Img i={it.i} w={1000} h={1000} label={it.n.toUpperCase()} />
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M75", name: "Product rises from behind a horizon", how: "Scroll: the product slides up from behind a hard colour-band edge while its shadow grows on the table.", kind: "scrub", C: M75 },
  { code: "M76", name: "Product rises in front of giant type", how: "Scroll: the product rises and turns in front of a huge word that scales up more slowly.", kind: "scrub", C: M76 },
  { code: "M77", name: "Image seen through the headline", how: "Scroll: the photo shows only through the letters, then the word scales away and the full photo appears.", kind: "scrub", C: M77 },
  { code: "M78", name: "Letterbox band opens", how: "Scroll: a thin horizontal band opens to the full frame while the image inside settles from 1.15 to 1.", kind: "scrub", C: M78 },
  { code: "M79", name: "Full-bleed hero shrinks into its frame", how: "Scroll: the full-bleed hero shrinks into a rounded frame on the right while the page copy arrives around it.", kind: "scrub", C: M79 },
  { code: "M80", name: "Zoom-out reveals the gallery", how: "Scroll: one full-frame image scales down into the middle tile of a gallery as the other tiles arrive.", kind: "scrub", C: M80 },
  { code: "M81", name: "Media opens between two words", how: "On view: an image window grows from zero width inside the headline and pushes the two words apart.", kind: "play", C: M81 },
  { code: "M82", name: "Block reveal (two-phase box wipe)", how: "On view: a colour block wipes in, the content changes under it, it wipes out; the 4 directions cycle.", kind: "play", C: M82 },
  { code: "M83", name: "Paper-tear headline reveal", how: "Scroll: a crack draws down the word, the paper rips in two and the halves pull apart over a rising image.", kind: "scrub", C: M83 },
  { code: "M84", name: "Folded flyer unfolds", how: "On view: a tri-fold menu opens its side panels on their hinges in 3D, one after another, with shading.", kind: "play", C: M84 },
  { code: "M85", name: "Sticky text with clip-path image steps", how: "Scroll: each step's image opens with an inset clip, the sticky heading swaps and its tick draws in.", kind: "scrub", C: M85 },
  { code: "M86", name: "Pinned list with cross-swapping visual", how: "Scroll: the list highlights one item at a time and the visual swaps (old slides up out, new slides up in).", kind: "scrub", C: M86 },
];
