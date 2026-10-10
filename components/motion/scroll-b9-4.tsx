"use client";

// MOTION-MENU M446–M457 (scroll group, batch 9 · part 4): small focused demos for /lab/motion.
// "scrub" demos map the panel's scroll LINEARLY (useScrub progress over the whole 220vh panel) onto a paused timeline
// or onto styles set directly. The one "play" demo (M452) starts on screen, loops and pauses off screen.
// Every demo also has a CSS-only glow loop, so a still scroll never reads as a frozen frame.
// ?static=1 / reduced motion: no animation, a sensible final state.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { scene, useScrub, useTicker } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const GROTESK = "'Space Grotesk Variable', system-ui, sans-serif";
const SERIF = "'Fraunces Variable', Georgia, serif";
const EDITORIAL = "'Instrument Serif', Georgia, serif";
const WIDE = "'Syne Variable', 'Space Grotesk Variable', system-ui, sans-serif";
const MANROPE = "'Manrope Variable', system-ui, sans-serif";
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);

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

/** Scrub: a paused timeline built once (after fonts); scroll progress (0..1 over the whole panel) drives tl.progress linearly. */
function useScrubTl(root: RefObject<HTMLDivElement | null>, build: (tl: gsap.core.Timeline, el: HTMLDivElement) => void) {
  const tl = useRef<gsap.core.Timeline | null>(null);
  const pr = useRef(0);
  const fn = useRef(build);
  fn.current = build;
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let dead = false;
    const ctx = gsap.context(() => {}, el);
    Promise.resolve(document.fonts?.ready).then(() => {
      if (dead) return;
      ctx.add(() => {
        const t = gsap.timeline({ paused: true, defaults: { ease: "none" } });
        fn.current(t, el);
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
const Img = ({ i, className = "", style, label = "", w = 1400, h = 900 }: { i: number; className?: string; style?: CSSProperties; label?: string; w?: number; h?: number }) => (
  <img src={scene(i, w, h, label)} alt="" className={`h-full w-full object-cover ${className}`} style={style} draggable={false} />
);

const Frame = ({ r, bg, children }: { r: RefObject<HTMLDivElement | null>; bg: string; children: ReactNode }) => (
  <div ref={r} className="relative h-full w-full overflow-hidden rounded-[24px]" style={{ background: bg }}>
    {children}
  </div>
);

/* ---------- M446 · Twin circular orbits (variant of M33: titles and cards ride two counter-turning circles) ---------- */
const M446_ITEMS: [string, string][] = [
  ["Saltmarsh", "Coastal retreat · 2021"],
  ["Lowlight", "Night bar · 2022"],
  ["Quarry", "Stone house · 2023"],
  ["Fernside", "Garden studio · 2024"],
  ["Harbour", "Ferry terminal · 2025"],
  ["Ridgeway", "Hill cabins · 2026"],
];
function M446() {
  const root = useRef<HTMLDivElement>(null);
  const apply = (p: number) => {
    const el = root.current;
    if (!el) return;
    const W = el.clientWidth;
    const H = el.clientHeight;
    const N = M446_ITEMS.length;
    const step = Math.PI / 6;
    const t = p * (N - 1);
    const cy = H / 2;
    const r1 = H * 1.05;
    const cx1 = W * 0.45 - r1; // title circle: its rightmost point is the focus spot left of centre
    const r2 = H * 0.95;
    const cx2 = W * 0.55 + r2; // card circle: its leftmost point is the focus spot right of centre
    el.querySelectorAll<HTMLElement>(".m446-t").forEach((n, i) => {
      const d = i - t;
      const a = d * step;
      const f = smooth(clamp01(1 - Math.abs(d)));
      const x = cx1 + r1 * Math.cos(a);
      const y = cy + r1 * Math.sin(a);
      n.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) translate(-100%,-50%) rotate(${a.toFixed(4)}rad) scale(${(0.62 + 0.38 * f).toFixed(3)})`;
      n.style.opacity = Math.abs(d) > 3.2 ? "0" : (0.22 + 0.78 * f).toFixed(3);
      n.style.color = f > 0.6 ? "#fff3e2" : "rgba(255,243,226,.75)";
    });
    el.querySelectorAll<HTMLElement>(".m446-c").forEach((n, i) => {
      const d = i - t;
      const a = d * step;
      const f = smooth(clamp01(1 - Math.abs(d)));
      const x = cx2 - r2 * Math.cos(a);
      const y = cy - r2 * Math.sin(a); // opposite turn: the next card waits above, the next title below
      n.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) translate(0,-50%) rotate(${(-a).toFixed(4)}rad) scale(${(0.6 + 0.4 * f).toFixed(3)})`;
      n.style.opacity = Math.abs(d) > 3.2 ? "0" : (0.3 + 0.7 * f).toFixed(3);
    });
    const idx = el.querySelector<HTMLElement>(".m446-idx");
    if (idx) idx.textContent = String(Math.round(t) + 1).padStart(2, "0");
  };
  useScrub(root, apply, { finalValue: 0.4 });
  return (
    <Frame r={root} bg="#100b08">
      <Glow code="m446" color="rgba(255,150,90,.4)" at="50% 50%" />
      <div className="pointer-events-none absolute left-1/2 top-[8%] bottom-[8%] w-px bg-white/15" aria-hidden />
      {M446_ITEMS.map(([t, s], i) => (
        <div key={t} className="m446-t absolute left-0 top-0 whitespace-nowrap text-right will-change-transform" style={{ transformOrigin: "100% 50%", opacity: i === 2 ? 1 : 0 }}>
          <p className="text-[clamp(40px,4.4vw,72px)] leading-none text-[#fff3e2]" style={{ fontFamily: SERIF, fontWeight: 500 }}>
            {t}
          </p>
          <p className="mt-2 text-[13px] uppercase tracking-[0.18em] text-white/60" style={{ fontFamily: GROTESK }}>
            {s}
          </p>
        </div>
      ))}
      {M446_ITEMS.map(([t], i) => (
        <figure key={t} className="m446-c absolute left-0 top-0 h-[42%] aspect-[4/3] overflow-hidden rounded-[18px] border border-white/10 will-change-transform" style={{ transformOrigin: "0% 50%", opacity: i === 2 ? 1 : 0 }}>
          <Img i={i % 4} w={800} h={600} />
        </figure>
      ))}
      <p className="pointer-events-none absolute bottom-4 left-5 text-[13px] uppercase tracking-[0.2em] text-white/60" style={{ fontFamily: GROTESK }}>
        Selected works · <span className="m446-idx">03</span> / 06
      </p>
      <Glow code="m446b" color="rgba(255,190,140,.3)" at="62% 50%" className="z-10 opacity-[.45] mix-blend-screen" />
    </Frame>
  );
}

/* ---------- M447 · Ring tips into drum index (variant of M30: a flat ring of titles tips into a turning 3D drum) ---------- */
const M447_ITEMS = ["Northlight", "Paper Moon", "Brine", "Hollow Oak", "Kiln Room", "Satellite", "Low Tide", "Ember Hall"];
function M447() {
  const root = useRef<HTMLDivElement>(null);
  const apply = (p: number) => {
    const el = root.current;
    if (!el) return;
    const H = el.clientHeight;
    const N = M447_ITEMS.length;
    const step = (Math.PI * 2) / N;
    // 0 → 0.28: the flat ring tips into a drum · 0.28 → 1: the drum turns one title per notch (snapping between notches)
    const k = smooth(clamp01(p / 0.28));
    const q = clamp01((p - 0.28) / 0.72);
    const n = q * (N - 1);
    const base = Math.floor(n);
    const snap = q >= 1 ? N - 1 : base + smooth(clamp01((n - base - 0.5) / 0.5));
    const rot = snap * step;
    const R1 = H * 0.36;
    const R2 = H * 0.3;
    el.querySelectorAll<HTMLElement>(".m447-i").forEach((node, i) => {
      const th = i * step - Math.PI / 2;
      const lx = (1 - k) * R1 * 1.7 * Math.cos(th);
      const ly = (1 - k) * R1 * Math.sin(th);
      let phi = i * step - rot;
      phi = Math.atan2(Math.sin(phi), Math.cos(phi));
      node.style.transform = `translate(-50%,-50%) translate3d(${lx.toFixed(1)}px,${ly.toFixed(1)}px,0) rotateX(${(-k * phi).toFixed(4)}rad) translateZ(${(k * R2).toFixed(1)}px)`;
      const front = Math.max(0, Math.cos(phi));
      node.style.opacity = (lerp(0.8, 0.12 + 0.88 * front * front, k)).toFixed(3);
      node.style.color = k > 0.85 && Math.abs(phi) < step / 2 ? "#c9ff6b" : "#eef3ea";
    });
    const c = el.querySelector<HTMLElement>(".m447-c");
    if (c) {
      c.style.transform = `translate3d(${(-k * el.clientWidth * 0.3).toFixed(1)}px,0,0) scale(${(1 - 0.45 * k).toFixed(3)})`;
      c.style.opacity = (1 - 0.35 * k).toFixed(3);
    }
    const idx = el.querySelector<HTMLElement>(".m447-n");
    if (idx) idx.textContent = String(Math.round(snap) + 1).padStart(2, "0");
  };
  useScrub(root, apply, { finalValue: 0.5 });
  return (
    <Frame r={root} bg="#0a0f0b">
      <Glow code="m447" color="rgba(150,230,90,.36)" at="50% 50%" />
      <div className="m447-c pointer-events-none absolute inset-0 grid place-items-center will-change-transform">
        <div className="text-center">
          <p className="text-[13px] uppercase tracking-[0.24em] text-white/55" style={{ fontFamily: GROTESK }}>
            Index · <span className="m447-n">01</span> / 08
          </p>
          <h3 className="mt-2 text-[clamp(48px,5vw,84px)] font-[800] uppercase leading-none tracking-[-0.03em] text-[#eef3ea]" style={{ fontFamily: WIDE }}>
            Works
          </h3>
        </div>
      </div>
      <div className="absolute inset-0" style={{ perspective: "1000px" }}>
        <div className="absolute left-1/2 top-1/2 h-0 w-0" style={{ transformStyle: "preserve-3d" }}>
          {M447_ITEMS.map((t, i) => (
            <p
              key={t}
              className="m447-i absolute left-0 top-0 whitespace-nowrap text-[clamp(26px,2.6vw,42px)] font-[600] leading-none tracking-[-0.02em] text-[#eef3ea] will-change-transform"
              style={{ fontFamily: GROTESK, backfaceVisibility: "hidden", transform: `translate(-50%,-50%) translate3d(${Math.round(Math.cos(i * 0.785 - 1.571) * 380)}px,${Math.round(Math.sin(i * 0.785 - 1.571) * 220)}px,0)` }}
            >
              {t}
            </p>
          ))}
        </div>
      </div>
      <p className="pointer-events-none absolute bottom-4 left-5 text-[13px] uppercase tracking-[0.2em] text-white/60">Atelier Vane · projects 2019–2026</p>
    </Frame>
  );
}

/* ---------- M448 · Stack spreads into radial orbit (variant of M4: a card stack spreads around a centre and keeps orbiting) ---------- */
const M448_CARDS: [string, string][] = [
  ["Moss tee", "₹1,290"],
  ["Dune shirt", "₹2,450"],
  ["Tide cap", "₹890"],
  ["Ash hoodie", "₹3,200"],
  ["Clay shorts", "₹1,690"],
  ["Pine jacket", "₹6,900"],
  ["Sand tote", "₹1,150"],
  ["Reef socks", "₹490"],
];
function M448() {
  const root = useRef<HTMLDivElement>(null);
  const apply = (p: number) => {
    const el = root.current;
    if (!el) return;
    const W = el.clientWidth;
    const H = el.clientHeight;
    const k = smooth(clamp01(p / 0.8));
    const N = M448_CARDS.length;
    el.querySelectorAll<HTMLElement>(".m448-card").forEach((n, i) => {
      const a = (i / N) * Math.PI * 2 - Math.PI / 2 + p * Math.PI * 0.5; // keeps orbiting over the whole panel
      const x = k * W * 0.33 * Math.cos(a);
      const y = k * H * 0.33 * Math.sin(a);
      const r = lerp((i - 3.5) * 4, 0, k);
      n.style.transform = `translate(-50%,-50%) translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${r.toFixed(2)}deg) scale(${lerp(1.1, 0.9, k).toFixed(3)})`;
    });
    const h = el.querySelector<HTMLElement>(".m448-h");
    if (h) {
      h.style.opacity = clamp01((k - 0.35) / 0.5).toFixed(3);
      h.style.transform = `scale(${lerp(0.85, 1, k).toFixed(3)})`;
    }
  };
  useScrub(root, apply, { finalValue: 1 });
  return (
    <Frame r={root} bg="#0b0d12">
      <Glow code="m448" color="rgba(110,160,255,.4)" at="50% 50%" />
      <div className="m448-h pointer-events-none absolute inset-0 grid place-items-center text-center will-change-transform">
        <div>
          <h3 className="text-[clamp(44px,4.6vw,76px)] leading-[0.95] text-[#eef2ff]" style={{ fontFamily: EDITORIAL }}>
            Eight pieces,
            <br />
            one summer.
          </h3>
          <p className="mt-3 text-[14px] uppercase tracking-[0.2em] text-white/60" style={{ fontFamily: GROTESK }}>
            Driftwear capsule · from ₹490
          </p>
        </div>
      </div>
      {M448_CARDS.map(([t, pr], i) => (
        <figure
          key={t}
          className="m448-card absolute left-1/2 top-1/2 h-[26%] aspect-[3/4] overflow-hidden rounded-[14px] border border-white/15 bg-[#11151e] shadow-[0_20px_50px_rgba(0,0,0,.5)] will-change-transform"
          style={{ zIndex: i, transform: `translate(-50%,-50%) rotate(${(i - 3.5) * 4}deg)` }}
        >
          <Img i={i % 4} w={480} h={640} />
          <figcaption className="absolute bottom-2 left-2 right-2 flex justify-between text-[12px] font-[600] text-white/90" style={{ fontFamily: GROTESK }}>
            <span>{t}</span>
            <span className="text-white/70">{pr}</span>
          </figcaption>
        </figure>
      ))}
      <Glow code="m448b" color="rgba(160,190,255,.28)" at="55% 45%" className="z-20 opacity-[.45] mix-blend-screen" />
    </Frame>
  );
}

/* ---------- M449 · Deck fans into semicircle (variant of M448: a fan into an inverted arc, plus pointer parallax) ---------- */
function M449() {
  const root = useRef<HTMLDivElement>(null);
  const prog = useRef(0);
  const ptr = useRef({ x: 0, y: 0, real: -10 });
  const render = (time: number) => {
    const el = root.current;
    if (!el) return;
    const W = el.clientWidth;
    const H = el.clientHeight;
    const p = prog.current;
    const k = smooth(p);
    // fake pointer (a visible ring) wanders by itself; a real mouse takes over for 1.5 s after it moves
    let px = Math.sin(time * 0.9) * 0.8;
    let py = Math.sin(time * 1.3 + 1) * 0.6;
    if (time - ptr.current.real < 1.5) {
      px = ptr.current.x;
      py = ptr.current.y;
    }
    const dot = el.querySelector<HTMLElement>(".m449-ptr");
    if (dot) dot.style.transform = `translate3d(${((px * 0.5 + 0.5) * W).toFixed(1)}px,${((py * 0.5 + 0.5) * H).toFixed(1)}px,0)`;
    const cx = W / 2;
    const cy = H * 0.12;
    const R = H * 0.6;
    el.querySelectorAll<HTMLElement>(".m449-card").forEach((n, i) => {
      const a = lerp(Math.PI * 0.95, Math.PI * 0.05, i / 7);
      const tx = cx + R * 1.55 * Math.cos(a);
      const ty = cy + R * Math.sin(a);
      const sx = cx;
      const sy = H * 0.6;
      const depth = 0.5 + (i % 3) * 0.45;
      const x = lerp(sx, tx, k) + px * 18 * depth * k;
      const y = lerp(sy, ty, k) + py * 14 * depth * k;
      const r = lerp((i - 3.5) * 2.5, ((a - Math.PI / 2) * 180) / Math.PI * 0.7, k);
      n.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) translate(-50%,-50%) rotate(${r.toFixed(2)}deg)`;
    });
    const h = el.querySelector<HTMLElement>(".m449-h");
    if (h) {
      h.style.opacity = (0.25 + 0.75 * k).toFixed(3);
      h.style.transform = `translate3d(${(-px * 10).toFixed(1)}px,${(-py * 8).toFixed(1)}px,0)`;
    }
  };
  useScrub(
    root,
    (p) => {
      prog.current = p;
      render(gsap.ticker.time);
    },
    { finalValue: 1 },
  );
  useTicker(root, (t) => render(t));
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const mv = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      ptr.current = { x: ((e.clientX - b.left) / b.width) * 2 - 1, y: ((e.clientY - b.top) / b.height) * 2 - 1, real: gsap.ticker.time };
    };
    el.addEventListener("pointermove", mv);
    return () => el.removeEventListener("pointermove", mv);
  }, []);
  return (
    <Frame r={root} bg="#120a10">
      <Glow code="m449" color="rgba(255,90,140,.38)" at="50% 40%" />
      <div className="m449-h pointer-events-none absolute inset-x-0 top-[22%] text-center will-change-transform">
        <h3 className="text-[clamp(48px,5vw,84px)] leading-[0.95] text-[#fff0f4]" style={{ fontFamily: SERIF, fontWeight: 500 }}>
          The night <span className="italic">edit</span>
        </h3>
        <p className="mt-3 text-[14px] uppercase tracking-[0.2em] text-white/60" style={{ fontFamily: GROTESK }}>
          Eight looks · Velour &amp; Pin · from ₹2,400
        </p>
      </div>
      {Array.from({ length: 8 }, (_, i) => (
        <figure
          key={i}
          className="m449-card absolute left-0 top-0 h-[30%] aspect-[3/4] overflow-hidden rounded-[14px] border border-white/15 shadow-[0_18px_40px_rgba(0,0,0,.5)] will-change-transform"
          style={{ zIndex: i, transform: "translate3d(50vw,40vh,0) translate(-50%,-50%)" }}
        >
          <Img i={(i + 1) % 4} w={480} h={640} />
        </figure>
      ))}
      <span className="m449-ptr pointer-events-none absolute left-0 top-0 z-30 -ml-[11px] -mt-[11px] h-[22px] w-[22px] rounded-full border-2 border-white/80 bg-white/10" aria-hidden />
      <Glow code="m449b" color="rgba(255,150,190,.28)" at="50% 70%" className="z-20 opacity-[.45] mix-blend-screen" />
    </Frame>
  );
}

/* ---------- M450 · Cards fly in to a fanned arc (variant of M4: cards travel in from far off and land rotated −30°→30°) ---------- */
const M450_N = 7;
function M450() {
  const root = useRef<HTMLDivElement>(null);
  useScrubTl(root, (tl, el) => {
    const W = el.clientWidth;
    const H = el.clientHeight;
    const cards = gsap.utils.toArray<HTMLElement>(".m450-card", el);
    tl.fromTo(
      cards,
      {
        x: (i: number) => (i % 2 ? 1 : -1) * W * (0.45 + 0.06 * i),
        y: (i: number) => (i % 2 ? -1 : 1) * H * 1.15,
        rotation: (i: number) => (i % 2 ? 70 : -70) + i * 6,
      },
      { x: 0, y: 0, rotation: (i: number) => -30 + (60 * i) / (M450_N - 1), duration: 0.44, stagger: 0.08 },
      0,
    ).fromTo(".m450-cap", { opacity: 0.35, y: 16 }, { opacity: 1, y: 0, duration: 0.3 }, 0.62);
  });
  return (
    <Frame r={root} bg="#0f0d08">
      <Glow code="m450" color="rgba(255,196,90,.4)" at="50% 60%" />
      <div className="m450-cap pointer-events-none absolute inset-x-0 bottom-[9%] text-center">
        <h3 className="text-[clamp(40px,4.2vw,68px)] font-[700] leading-none tracking-[-0.03em] text-[#fff6e0]" style={{ fontFamily: GROTESK }}>
          The spring deck
        </h3>
        <p className="mt-2 text-[14px] text-white/60" style={{ fontFamily: MANROPE }}>
          Seven prints · Marigold Press · ₹1,800 each
        </p>
      </div>
      {Array.from({ length: M450_N }, (_, i) => (
        <figure
          key={i}
          className="m450-card absolute left-1/2 top-[8%] overflow-hidden rounded-[14px] border border-white/15 shadow-[0_18px_40px_rgba(0,0,0,.5)] will-change-transform"
          style={{ width: "17vh", height: "24vh", marginLeft: "-8.5vh", transformOrigin: "50% 240%", zIndex: i, transform: `rotate(${-30 + (60 * i) / (M450_N - 1)}deg)` }}
        >
          <Img i={i % 4} w={400} h={560} label={`0${i + 1}`} />
        </figure>
      ))}
      <Glow code="m450b" color="rgba(255,220,150,.26)" at="50% 35%" className="z-20 opacity-[.45] mix-blend-screen" />
    </Frame>
  );
}

/* ---------- M451 · Sticky deck flips and spirals (variant of M4: each card flips back→front while the stack spirals open) ---------- */
const M451_N = 8;
const M451_NAMES = ["Fig", "Smoke", "Neroli", "Vetiver", "Iris", "Amber", "Cedar", "Salt"];
function M451() {
  const root = useRef<HTMLDivElement>(null);
  useScrubTl(root, (tl, el) => {
    const outers = gsap.utils.toArray<HTMLElement>(".m451-o", el);
    const inners = gsap.utils.toArray<HTMLElement>(".m451-in", el);
    gsap.set(inners, { transformPerspective: 900 });
    outers.forEach((o, i) => {
      tl.fromTo(o, { rotation: (i - 3.5) * 2.2 }, { rotation: (-360 * i) / M451_N, duration: 1 }, 0);
      tl.fromTo(inners[i], { rotationY: -180 }, { rotationY: 0, duration: 0.34, ease: "power1.inOut" }, i * 0.09);
    });
    tl.fromTo(".m451-mid", { opacity: 0.4, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.4 }, 0.6);
  });
  return (
    <Frame r={root} bg="#0e0a12">
      <Glow code="m451" color="rgba(190,120,255,.4)" at="50% 50%" />
      <div className="m451-mid pointer-events-none absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-[clamp(28px,2.6vw,40px)] leading-none text-[#f5ecff]" style={{ fontFamily: EDITORIAL }}>
            Eight notes
          </p>
          <p className="mt-1 text-[12px] uppercase tracking-[0.2em] text-white/60">₹2,200 each</p>
        </div>
      </div>
      {M451_NAMES.map((n, i) => (
        <div
          key={n}
          className="m451-o absolute left-1/2 top-1/2 will-change-transform"
          style={{ width: "12.5vh", height: "18vh", marginLeft: "-6.25vh", marginTop: "-25.2vh", transformOrigin: "50% 140%", zIndex: M451_N - i, transform: `rotate(${(-360 * i) / M451_N}deg)` }}
        >
          <div className="m451-in relative h-full w-full will-change-transform" style={{ transformStyle: "preserve-3d" }}>
            <div className="absolute inset-0 overflow-hidden rounded-[12px] border border-white/15" style={{ backfaceVisibility: "hidden" }}>
              <Img i={i % 4} w={360} h={520} />
              <p className="absolute bottom-2 left-2 text-[13px] font-[600] text-white" style={{ fontFamily: GROTESK }}>
                {n}
              </p>
            </div>
            <div
              className="absolute inset-0 grid place-items-center rounded-[12px] border border-[#cfa8ff]/40"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                background: "repeating-linear-gradient(45deg,#2a1840 0 8px,#1b1029 8px 16px)",
              }}
            >
              <span className="text-[22px] text-[#e7d3ff]" style={{ fontFamily: SERIF }}>
                Ō
              </span>
            </div>
          </div>
        </div>
      ))}
      <p className="pointer-events-none absolute bottom-4 left-5 text-[13px] uppercase tracking-[0.2em] text-white/60">Oriel parfums · discovery deck</p>
    </Frame>
  );
}

/* ---------- M452 · Depth stack, next comes forward (play: the front panel flies out, the stack steps forward) ---------- */
const M452_PANELS: [string, string, string][] = [
  ["Oct 2026", "Autumn release", "Wool coats, waxed jackets"],
  ["Jul 2026", "Monsoon capsule", "Rain shells from ₹4,900"],
  ["Apr 2026", "Linen week", "Shirts, trousers, ₹2,100"],
  ["Jan 2026", "Studio sale", "Up to 40% off archive"],
  ["Oct 2025", "First collection", "Twelve pieces, one mill"],
];
function M452() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const panels = gsap.utils.toArray<HTMLElement>(".m452-p", el);
    const N = panels.length;
    const slot = (k: number) => ({ z: -k * 150, y: -k * 34, opacity: k >= N - 1 ? 0.25 : 1 - k * 0.2, zIndex: N - k });
    let order = panels.map((_, i) => i);
    let running = false;
    let tl: gsap.core.Timeline | null = null;
    let dc: gsap.core.Tween | null = null;
    const ctx = gsap.context(() => {
      panels.forEach((p, i) => gsap.set(p, { ...slot(i), transformPerspective: 1100 }));
    }, el);
    if (prefersReducedMotion()) return () => ctx.revert();
    const step = () => {
      if (!running) return;
      const front = order[0];
      order = [...order.slice(1), front];
      ctx.add(() => {
        tl = gsap.timeline({
          onComplete: () => {
            if (running) dc = gsap.delayedCall(0.12, step);
          },
        });
        tl.to(panels[front], { z: 260, y: 70, opacity: 0, duration: 0.45, ease: "power2.in" }, 0);
        order.slice(0, -1).forEach((idx, k) => {
          tl!.set(panels[idx], { zIndex: N - k }, 0).to(panels[idx], { z: -k * 150, y: -k * 34, opacity: slot(k).opacity, duration: 0.75, ease: "power2.inOut" }, 0.08);
        });
        tl.set(panels[front], { ...slot(N - 1), opacity: 0 }, 0.46).to(panels[front], { opacity: slot(N - 1).opacity, duration: 0.37 }, 0.46);
      });
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !running) {
        running = true;
        step();
      } else if (!e.isIntersecting && running) {
        running = false;
        dc?.kill();
        tl?.progress(1);
      }
    });
    io.observe(el);
    // a wheel step over the stage hurries the current step (the stack still advances by itself for filming)
    const wheel = () => tl?.timeScale(2.2);
    el.addEventListener("wheel", wheel, { passive: true });
    return () => {
      running = false;
      io.disconnect();
      el.removeEventListener("wheel", wheel);
      dc?.kill();
      ctx.revert();
    };
  }, []);
  return (
    <Frame r={root} bg="#090c12">
      <Glow code="m452" color="rgba(90,170,255,.42)" at="50% 40%" />
      <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
        {M452_PANELS.map(([d, t, s], i) => (
          <article
            key={d}
            className="m452-p absolute left-[22%] top-[24%] h-[60%] w-[56%] overflow-hidden rounded-[22px] border border-white/15 bg-[#121823] shadow-[0_30px_80px_rgba(0,0,0,.55)] will-change-transform"
            style={{ zIndex: M452_PANELS.length - i }}
          >
            <Img i={i % 4} w={1200} h={700} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-[8%] left-[6%] right-[6%] flex items-end justify-between text-white">
              <div>
                <p className="text-[13px] uppercase tracking-[0.2em] text-white/70" style={{ fontFamily: GROTESK }}>
                  {d}
                </p>
                <h3 className="mt-1 text-[clamp(32px,3.2vw,52px)] leading-none" style={{ fontFamily: SERIF, fontWeight: 500 }}>
                  {t}
                </h3>
              </div>
              <p className="text-[14px] text-white/80" style={{ fontFamily: MANROPE }}>
                {s}
              </p>
            </div>
          </article>
        ))}
      </div>
      <p className="pointer-events-none absolute left-5 top-4 text-[13px] uppercase tracking-[0.2em] text-white/60">Fold &amp; Field · archive</p>
      <Glow code="m452b" color="rgba(140,200,255,.28)" at="50% 60%" className="z-10 opacity-[.45] mix-blend-screen" />
    </Frame>
  );
}

/* ---------- M453 · Page zooms out to overview (the view pulls back to a map of all sections, then dives into the next) ---------- */
const M453_SECTIONS: [string, string, string, number][] = [
  ["01", "Arrive", "A slow welcome by the lake.", 0],
  ["02", "Rooms", "Nine rooms from ₹14,500 a night.", 3],
  ["03", "Table", "Six courses, all from the garden.", 1],
  ["04", "Journal", "Notes from the lake house.", 2],
];
function M453() {
  const root = useRef<HTMLDivElement>(null);
  const apply = (p: number) => {
    const el = root.current;
    const world = el?.querySelector<HTMLElement>(".m453-w");
    if (!el || !world) return;
    const W = el.clientWidth;
    const H = el.clientHeight;
    const g = W * 0.06;
    const n = M453_SECTIONS.length;
    const Ww = n * W + (n - 1) * g;
    const sO = (0.9 * W) / Ww;
    const cS = (k: number) => k * (W + g) + W / 2;
    let cx: number;
    let s: number;
    if (p < 0.38) {
      const u = smooth(p / 0.38);
      cx = lerp(cS(0), Ww / 2, u);
      s = Math.exp(lerp(0, Math.log(sO), u));
    } else if (p < 0.58) {
      // the brief overview "hold" still drifts a touch so the frame never sits still
      const u = (p - 0.38) / 0.2;
      cx = Ww / 2;
      s = sO * (1 + 0.05 * Math.sin(u * Math.PI));
    } else {
      const u = smooth((p - 0.58) / 0.42);
      cx = lerp(Ww / 2, cS(1), u);
      s = Math.exp(lerp(Math.log(sO), 0, u));
    }
    const cy = H / 2;
    world.style.transform = `translate3d(${(W / 2 - cx * s).toFixed(2)}px,${(H / 2 - cy * s).toFixed(2)}px,0) scale(${s.toFixed(4)})`;
    const lab = el.querySelector<HTMLElement>(".m453-lab");
    if (lab) lab.style.opacity = clamp01(1 - Math.abs(Math.log(s / sO)) / Math.abs(Math.log(sO)) * 2.2).toFixed(3);
  };
  useScrub(root, apply, { finalValue: 0.48 });
  return (
    <Frame r={root} bg="#0c0a07">
      <Glow code="m453" color="rgba(255,190,110,.4)" at="50% 50%" />
      <div className="m453-w absolute inset-0 flex will-change-transform" style={{ transformOrigin: "0 0" }}>
        {M453_SECTIONS.map(([no, t, s, i], k) => (
          <section key={no} className="relative h-full w-full shrink-0 overflow-hidden rounded-[20px] border border-white/10" style={{ marginRight: k < M453_SECTIONS.length - 1 ? "6%" : 0 }}>
            <Img i={i} w={1400} h={900} />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />
            <div className="absolute left-[5%] right-[5%] top-[6%] flex justify-between text-[14px] uppercase tracking-[0.2em] text-white/75" style={{ fontFamily: GROTESK }}>
              <span>Halden House</span>
              <span>{no} / 04</span>
            </div>
            <div className="absolute bottom-[10%] left-[5%]">
              <p className="text-[72px] font-[700] leading-none text-[#ffd9a0]" style={{ fontFamily: GROTESK }}>
                {no}
              </p>
              <h3 className="text-[clamp(64px,7vw,116px)] leading-[0.9] text-[#fff7ea]" style={{ fontFamily: SERIF, fontWeight: 500 }}>
                {t}
              </h3>
              <p className="mt-3 text-[16px] text-white/80" style={{ fontFamily: MANROPE }}>
                {s}
              </p>
            </div>
          </section>
        ))}
      </div>
      <p className="m453-lab pointer-events-none absolute bottom-4 left-5 z-20 text-[13px] uppercase tracking-[0.2em] text-white/70" style={{ opacity: 0 }}>
        Overview · four sections
      </p>
      <Glow code="m453b" color="rgba(255,210,150,.28)" at="50% 45%" className="z-10 opacity-[.45] mix-blend-screen" />
    </Frame>
  );
}

/* ---------- M454 · Scroll-scrubbed year counter (variant of M3: the year follows the scroll both ways, images parallax beside it) ---------- */
const M454_FROM = 1890;
const M454_TO = 2026;
const M454_NOTES: [number, string][] = [
  [1890, "A tea counter opens on the harbour lane."],
  [1924, "Our blends travel by steamship."],
  [1958, "The tasting room opens upstairs."],
  [1991, "The second generation takes the kettle."],
  [2026, "136 years, still steeping."],
];
function M454() {
  const root = useRef<HTMLDivElement>(null);
  const apply = (p: number) => {
    const el = root.current;
    if (!el) return;
    const H = el.clientHeight;
    const yr = Math.round(lerp(M454_FROM, M454_TO, p));
    const out = el.querySelector<HTMLElement>(".m454-y");
    if (out) out.textContent = String(yr);
    const note = el.querySelector<HTMLElement>(".m454-note");
    if (note) {
      let txt = M454_NOTES[0][1];
      for (const [y, t] of M454_NOTES) if (yr >= y) txt = t;
      if (note.textContent !== txt) note.textContent = txt;
    }
    const bar = el.querySelector<HTMLElement>(".m454-bar");
    if (bar) bar.style.transform = `scaleX(${p.toFixed(4)})`;
    // two image columns parallax at different speeds
    el.querySelectorAll<HTMLElement>(".m454-col").forEach((c, i) => {
      const travel = c.scrollHeight - H;
      const y = -(i === 0 ? p : 0.15 + p * 0.6) * travel;
      c.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
    });
  };
  useScrub(root, apply, { finalValue: 1 });
  return (
    <Frame r={root} bg="#110d09">
      <Glow code="m454" color="rgba(230,160,80,.4)" at="30% 50%" />
      <div className="absolute left-[5%] top-1/2 w-[50%] -translate-y-1/2">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/60" style={{ fontFamily: GROTESK }}>
          Tallow &amp; Leaf · since
        </p>
        <p className="m454-y mt-2 text-[clamp(110px,13vw,210px)] leading-[0.85] tracking-[-0.03em] text-[#fff1dc]" style={{ fontFamily: SERIF, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
          {M454_TO}
        </p>
        <p className="m454-note mt-4 max-w-[30ch] text-[clamp(18px,1.5vw,24px)] leading-snug text-white/80" style={{ fontFamily: EDITORIAL }}>
          {M454_NOTES[M454_NOTES.length - 1][1]}
        </p>
        <div className="mt-6 h-[2px] w-[70%] bg-white/15">
          <div className="m454-bar h-full w-full origin-left bg-[#e6a050]" />
        </div>
      </div>
      <div className="absolute bottom-0 right-[4%] top-0 flex w-[38%] gap-[4%] overflow-hidden">
        {[0, 1].map((c) => (
          <div key={c} className="m454-col flex w-1/2 flex-col gap-[3vh] pt-[6vh] will-change-transform">
            {[0, 1, 2, 3, 4].map((k) => (
              <figure key={k} className="h-[34vh] shrink-0 overflow-hidden rounded-[12px] border border-white/10">
                <Img i={(k + c * 2) % 4} w={500} h={640} style={{ filter: "sepia(.55) saturate(.8)" }} />
              </figure>
            ))}
          </div>
        ))}
      </div>
      <Glow code="m454b" color="rgba(255,200,140,.26)" at="70% 50%" className="z-10 opacity-[.45] mix-blend-screen" />
    </Frame>
  );
}

/* ---------- M455 · Liquid-edge progress bar (variant of M26: the fill's leading edge is a wave that sloshes with velocity) ---------- */
function M455() {
  const root = useRef<HTMLDivElement>(null);
  const st = useRef({ p: 0, v: 0, lv: 0, slosh: 0, sv: 0 });
  const draw = (time: number) => {
    const el = root.current;
    const path = el?.querySelector<SVGPathElement>(".m455-f");
    const edge = el?.querySelector<SVGPathElement>(".m455-e");
    if (!el || !path || !edge) return;
    const s = st.current;
    const level = 1000 - s.lv * 1000;
    const amp = 6 + Math.min(40, Math.abs(s.slosh) * 0.5);
    const pts: string[] = [];
    for (let i = 0; i <= 24; i++) {
      const x = (i / 24) * 200;
      const y = level + Math.sin(i * 0.55 + time * 3.2) * amp * 0.6 + Math.sin(i * 0.23 - time * 2.1) * amp * 0.4 + s.slosh * ((x - 100) / 100);
      pts.push(`${x.toFixed(1)},${Math.min(1000, Math.max(-60, y)).toFixed(1)}`);
    }
    edge.setAttribute("d", `M${pts.join(" L")}`);
    path.setAttribute("d", `M0,1000 L${pts.join(" L")} L200,1000 Z`);
    const pct = el.querySelector<HTMLElement>(".m455-p");
    if (pct) pct.textContent = `${Math.round(s.p * 100)}%`;
  };
  useScrub(
    root,
    (p, v) => {
      const s = st.current;
      s.p = p;
      s.v = v;
      if (prefersReducedMotion()) {
        s.lv = p;
        draw(0);
      }
    },
    { finalValue: 0.64 },
  );
  useTicker(root, (t, dt) => {
    const s = st.current;
    const d = Math.min(0.05, dt);
    s.lv += (s.p - s.lv) * Math.min(1, d * 9);
    s.v *= Math.exp(-d * 4); // scroll stopped → the push fades and the surface settles
    const a = (s.v * 70 - s.slosh) * 110 - s.sv * 6;
    s.sv += a * d;
    s.slosh = Math.max(-70, Math.min(70, s.slosh + s.sv * d));
    draw(t);
  });
  return (
    <Frame r={root} bg="#06100f">
      <Glow code="m455" color="rgba(40,210,190,.4)" at="35% 60%" />
      <div className="absolute left-[16%] top-[10%] h-[80%] w-[150px] overflow-hidden rounded-full border-2 border-white/20 bg-white/[0.04]">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 200 1000" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="m455-g" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#7ff5e2" />
              <stop offset="1" stopColor="#0d7f8c" />
            </linearGradient>
          </defs>
          <path className="m455-f" d="M0,1000 L0,360 L200,360 L200,1000 Z" fill="url(#m455-g)" />
          <path className="m455-e" d="M0,360 L200,360" fill="none" stroke="#dffff9" strokeWidth="6" opacity=".7" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <div className="absolute left-[34%] top-1/2 w-[56%] -translate-y-1/2 text-[#e8fffb]">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/60" style={{ fontFamily: GROTESK }}>
          Cold brew · steeping
        </p>
        <p className="m455-p mt-1 text-[clamp(96px,11vw,180px)] font-[700] leading-[0.9] tracking-[-0.04em]" style={{ fontFamily: GROTESK, fontVariantNumeric: "tabular-nums" }}>
          64%
        </p>
        <p className="mt-3 max-w-[34ch] text-[clamp(18px,1.5vw,24px)] leading-snug text-white/80" style={{ fontFamily: EDITORIAL }}>
          Eighteen hours over ice. Scroll faster and watch it slosh. Stillwater bottle, ₹420.
        </p>
      </div>
    </Frame>
  );
}

/* ---------- M456 · Tracing beam with velocity length (variant of M8: a gradient beam runs down a rail, stretching with speed) ---------- */
const M456_POSTS: [string, string, string, number][] = [
  ["v4.2", "Shared notebooks", "Invite two friends to one notebook and write together in real time. Changes sync in under a second.", 0],
  ["v4.1", "Offline drafts", "Write on the train. Drafts wait on the device and upload the moment you are back online.", 1],
  ["v4.0", "A calmer editor", "New type scale, softer margins and a focus mode that hides everything but the line you are on.", 2],
  ["v3.9", "Plans from ₹149", "A single personal plan with unlimited pages. Teams start at ₹399 per seat.", 3],
];
function M456() {
  const root = useRef<HTMLDivElement>(null);
  const st = useRef({ p: 0, v: 0, len: 0, head: 0 });
  const draw = () => {
    const el = root.current;
    const col = el?.querySelector<HTMLElement>(".m456-col");
    const svg = el?.querySelector<SVGSVGElement>(".m456-svg");
    if (!el || !col || !svg) return;
    const s = st.current;
    const H = el.clientHeight;
    const CH = col.scrollHeight;
    col.style.transform = `translate3d(0,${(-s.p * (CH - H)).toFixed(1)}px,0)`;
    svg.setAttribute("height", String(CH));
    svg.setAttribute("viewBox", `0 0 40 ${CH}`);
    const top = 14;
    const head = top + s.head * (CH - top - 20);
    const tail = Math.max(top, head - (110 + s.len));
    el.querySelectorAll<SVGLineElement>(".m456-l").forEach((l) => l.setAttribute("y2", String(CH - 20)));
    const g = el.querySelector<SVGLinearGradientElement>("#m456-g");
    if (g) {
      g.setAttribute("y1", tail.toFixed(1));
      g.setAttribute("y2", head.toFixed(1));
    }
    const dot = el.querySelector<SVGCircleElement>(".m456-dot");
    if (dot) dot.setAttribute("fill", s.p > 0.015 ? "#8f7bff" : "#0b0b14");
  };
  useScrub(
    root,
    (p, v) => {
      const s = st.current;
      s.p = p;
      s.v = v;
      if (prefersReducedMotion()) {
        s.head = p;
        draw();
      }
    },
    { finalValue: 0.55 },
  );
  useTicker(root, (_t, dt) => {
    const s = st.current;
    const d = Math.min(0.05, dt);
    s.v *= Math.exp(-d * 5);
    s.len += (Math.abs(s.v) * 520 - s.len) * Math.min(1, d * 7);
    s.head += (s.p - s.head) * Math.min(1, d * 12);
    draw();
  });
  return (
    <Frame r={root} bg="#0b0b14">
      <Glow code="m456" color="rgba(143,123,255,.4)" at="30% 40%" />
      <div className="m456-col absolute left-1/2 top-0 w-[min(70%,860px)] will-change-transform" style={{ marginLeft: "calc(-1 * min(35%, 430px))" }}>
        <svg className="m456-svg absolute left-0 top-0 w-[40px]" height="1600" viewBox="0 0 40 1600" aria-hidden>
          <defs>
            <linearGradient id="m456-g" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="0" y2="1600">
              <stop offset="0" stopColor="#18ccfc" stopOpacity="0" />
              <stop offset=".35" stopColor="#18ccfc" />
              <stop offset=".8" stopColor="#8f7bff" />
              <stop offset="1" stopColor="#d8b4ff" />
            </linearGradient>
          </defs>
          <line className="m456-l" x1="20" x2="20" y1="14" y2="1580" stroke="rgba(255,255,255,.12)" strokeWidth="2" />
          <line className="m456-l" x1="20" x2="20" y1="14" y2="1580" stroke="url(#m456-g)" strokeWidth="3" strokeLinecap="round" />
          <circle className="m456-dot" cx="20" cy="14" r="7" fill="#8f7bff" stroke="#8f7bff" strokeWidth="2" style={{ transition: "fill .3s" }} />
        </svg>
        <div className="pl-[72px] pt-[6vh] pb-[18vh]">
          <p className="text-[13px] uppercase tracking-[0.24em] text-white/55" style={{ fontFamily: GROTESK }}>
            Quill notes · changelog
          </p>
          {M456_POSTS.map(([v, t, s, i]) => (
            <article key={v} className="mt-[7vh]">
              <span className="inline-block rounded-full border border-[#8f7bff]/50 px-3 py-1 text-[12px] text-[#cfc6ff]" style={{ fontFamily: GROTESK }}>
                {v}
              </span>
              <h3 className="mt-3 text-[clamp(32px,3vw,48px)] font-[600] leading-none tracking-[-0.02em] text-[#f1efff]" style={{ fontFamily: GROTESK }}>
                {t}
              </h3>
              <p className="mt-3 max-w-[52ch] text-[16px] leading-relaxed text-white/70" style={{ fontFamily: MANROPE }}>
                {s}
              </p>
              <div className="mt-4 h-[26vh] overflow-hidden rounded-[14px] border border-white/10">
                <Img i={i} w={1200} h={500} />
              </div>
            </article>
          ))}
        </div>
      </div>
      <Glow code="m456b" color="rgba(170,150,255,.26)" at="55% 55%" className="z-10 opacity-[.45] mix-blend-screen" />
    </Frame>
  );
}

/* ---------- M457 · Path draws, milestones pop (variant of M8: each milestone pops as the drawing tip reaches it) ---------- */
const M457_PTS: [number, number][] = [
  [90, 470],
  [310, 380],
  [520, 440],
  [720, 260],
  [930, 300],
  [1110, 120],
];
const M457_LABELS = ["Jan · Private beta", "Mar · Public launch", "Jun · Team plans", "Sep · Offline mode", "Dec · Version 1.0"];
const M457_D = M457_PTS.map(([x, y], i) => {
  if (i === 0) return `M${x} ${y}`;
  const [px, py] = M457_PTS[i - 1];
  const dx = (x - px) / 2;
  return `C${px + dx} ${py} ${x - dx} ${y} ${x} ${y}`;
}).join(" ");
function M457() {
  const root = useRef<HTMLDivElement>(null);
  const meta = useRef<{ L: number; at: number[]; shown: boolean[] } | null>(null);
  const apply = (p: number) => {
    const el = root.current;
    const path = el?.querySelector<SVGPathElement>(".m457-path");
    if (!el || !path) return;
    if (!meta.current) {
      const L = path.getTotalLength();
      const tmp = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const segs = M457_D.split(" C");
      const at = M457_PTS.slice(1).map((_, k) => {
        tmp.setAttribute("d", segs.slice(0, k + 2).join(" C"));
        return tmp.getTotalLength() / L;
      });
      meta.current = { L, at, shown: at.map(() => true) };
    }
    const m = meta.current;
    path.style.strokeDasharray = `${m.L}`;
    path.style.strokeDashoffset = `${(m.L * (1 - p)).toFixed(1)}`;
    const tip = el.querySelector<SVGCircleElement>(".m457-tip");
    if (tip) {
      const pt = path.getPointAtLength(m.L * p);
      tip.setAttribute("cx", pt.x.toFixed(1));
      tip.setAttribute("cy", pt.y.toFixed(1));
    }
    const reduce = prefersReducedMotion();
    el.querySelectorAll<SVGGElement>(".m457-m").forEach((g, k) => {
      const on = p >= m.at[k] - 0.002;
      if (on === m.shown[k]) return;
      m.shown[k] = on;
      if (reduce) gsap.set(g, { scale: on ? 1 : 0, opacity: on ? 1 : 0, transformOrigin: "50% 50%" });
      else if (on) gsap.to(g, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2.4)", transformOrigin: "50% 50%", overwrite: true });
      else gsap.to(g, { scale: 0, opacity: 0, duration: 0.25, ease: "power2.in", transformOrigin: "50% 50%", overwrite: true });
    });
  };
  useScrub(root, apply, { finalValue: 1 });
  return (
    <Frame r={root} bg="#0c0f0a">
      <Glow code="m457" color="rgba(200,255,120,.36)" at="60% 45%" />
      <div className="absolute left-[5%] top-[7%]">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/60" style={{ fontFamily: GROTESK }}>
          Roadmap 2026
        </p>
        <h3 className="mt-2 text-[clamp(40px,4vw,64px)] font-[700] leading-none tracking-[-0.03em] text-[#f3ffe6]" style={{ fontFamily: GROTESK }}>
          Where Tendril is heading
        </h3>
      </div>
      <svg className="absolute inset-x-[3%] bottom-[4%] h-[78%] w-[94%]" viewBox="0 0 1200 560" aria-hidden>
        <path d={M457_D} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="3" strokeDasharray="6 10" />
        <path className="m457-path" d={M457_D} fill="none" stroke="#c8ff7a" strokeWidth="4" strokeLinecap="round" />
        <circle cx={M457_PTS[0][0]} cy={M457_PTS[0][1]} r="9" fill="#c8ff7a" />
        <text x={M457_PTS[0][0] - 10} y={M457_PTS[0][1] + 42} fill="rgba(255,255,255,.65)" fontSize="18" fontFamily="Space Grotesk Variable, sans-serif">
          Today
        </text>
        {M457_PTS.slice(1).map(([x, y], k) => (
          <g key={k} className="m457-m">
            <circle cx={x} cy={y} r="26" fill="rgba(200,255,122,.16)" />
            <circle cx={x} cy={y} r="11" fill="#0c0f0a" stroke="#c8ff7a" strokeWidth="4" />
            <text x={x} y={y - 44} textAnchor="middle" fill="#f3ffe6" fontSize="22" fontWeight="600" fontFamily="Space Grotesk Variable, sans-serif">
              {M457_LABELS[k]}
            </text>
          </g>
        ))}
        <circle className="m457-tip" cx={M457_PTS[5][0]} cy={M457_PTS[5][1]} r="8" fill="#ffffff" style={{ filter: "drop-shadow(0 0 8px #c8ff7a)" }} />
      </svg>
    </Frame>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M446", name: "Twin circular orbits", how: "Titles ride one big circle on the left, image cards a counter-turning circle on the right; the pair meeting the centre eases into focus · scrubbed", kind: "scrub", C: M446 },
  { code: "M447", name: "Ring tips into drum index", how: "A flat ring of project titles around a centre title tips into a 3D drum (rotateX cylinder) that turns one title per notch, snapping between notches · scrubbed", kind: "scrub", C: M447 },
  { code: "M448", name: "Stack spreads into radial orbit", how: "A stack of product cards spreads radially into an orbit around the centre and keeps orbiting while a headline appears inside · scrubbed", kind: "scrub", C: M448 },
  { code: "M449", name: "Deck fans into semicircle", how: "Eight stacked images fan out into an inverted semicircle around the title, with slight pointer parallax (a fake pointer wanders by itself) · scrubbed", kind: "scrub", C: M449 },
  { code: "M450", name: "Cards fly in to a fanned arc", how: "Cards travel in from far above/below and off to the sides and land rotated −30°→30° around a pivot below them, forming a fan · scrubbed", kind: "scrub", C: M450 },
  { code: "M451", name: "Sticky deck flips and spirals", how: "A stack of face-down cards flips one by one (rotateY −180→0) while the stack spirals open (rotateZ staggered to −360) into a flower fan · scrubbed", kind: "scrub", C: M451 },
  { code: "M452", name: "Depth stack, next comes forward", how: "Panels recede into depth; the front panel flies out toward the viewer and the next steps forward from behind (translateZ + opacity), looping", kind: "play", C: M452 },
  { code: "M453", name: "Page zooms out to overview", how: "The view scales down from one section until all four sit side by side like a map, holds briefly, then dives into the next one · scrubbed", kind: "scrub", C: M453 },
  { code: "M454", name: "Scroll-scrubbed year counter", how: "A big year counts 1890→2026 with the scroll (and back down when scrolling up) while two columns of history images parallax beside it · scrubbed", kind: "scrub", C: M454 },
  { code: "M455", name: "Liquid-edge progress bar", how: "A tube fills with scroll; its surface is a live SVG wave that sloshes and tilts with scroll velocity and settles when you stop · scrubbed", kind: "scrub", C: M455 },
  { code: "M456", name: "Tracing beam with velocity length", how: "A gradient beam runs down a rail beside a changelog as you scroll; its length stretches with scroll speed and the top dot fills once started · scrubbed", kind: "scrub", C: M456 },
  { code: "M457", name: "Path draws, milestones pop", how: "A roadmap path draws on with the scroll and each milestone pops in (back-out scale) the moment the drawing tip reaches it · scrubbed", kind: "scrub", C: M457 },
];
