"use client";

// MOTION-MENU M410–M421 (scroll group, batch 9 · part 1): small focused demos for /lab/motion.
// Every demo is "scrub": the panel's scroll (useScrub progress over the whole 220vh panel) is mapped LINEARLY onto a paused
// timeline or onto styles set directly, and no demo ends on an empty stage. Every demo also has a CSS-only glow loop (plus an
// on-top glow where images cover the stage), so a still scroll never reads as a frozen frame.
// ?static=1 / reduced motion: no animation, a sensible final state.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, loadPlugin } from "@/lib/gsap";
import { scene, useScrub } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const GROTESK = "'Space Grotesk Variable', system-ui, sans-serif";
const SERIF = "'Fraunces Variable', Georgia, serif";
const EDITORIAL = "'Instrument Serif', Georgia, serif";
const WIDE = "'Syne Variable', 'Space Grotesk Variable', system-ui, sans-serif";
const MANROPE = "'Manrope Variable', system-ui, sans-serif";
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (v: number) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};

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

/** Glow drawn ON TOP of images that cover the stage (rule 13). */
const TopGlow = ({ code, color, at }: { code: string; color: string; at?: string }) => (
  <Glow code={`${code}t`} color={color} at={at} className="z-30 opacity-[.45] mix-blend-screen" />
);

/** Scrub: a paused timeline built once (after fonts + optional plugin); progress (0..1 over the whole panel) drives it linearly. */
function useScrubTl(
  root: RefObject<HTMLDivElement | null>,
  build: (tl: gsap.core.Timeline, el: HTMLDivElement) => void,
  pre?: () => Promise<unknown>,
) {
  const tl = useRef<gsap.core.Timeline | null>(null);
  const pr = useRef(0);
  const fn = useRef(build);
  fn.current = build;
  const preRef = useRef(pre);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let dead = false;
    const ctx = gsap.context(() => {}, el);
    Promise.all([document.fonts?.ready, preRef.current?.()]).then(() => {
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

/* ---------- M410 · Centre clip opens among floating images (variant of M28: the frame opens by clip-path while satellites float past) ---------- */
const M410_FLOAT: { l: string; t: string; w: string; i: number; s: number; front: boolean }[] = [
  { l: "6%", t: "62%", w: "15%", i: 1, s: 1.5, front: true },
  { l: "22%", t: "78%", w: "11%", i: 2, s: 0.9, front: false },
  { l: "72%", t: "70%", w: "16%", i: 3, s: 1.3, front: true },
  { l: "84%", t: "40%", w: "11%", i: 2, s: 0.75, front: false },
  { l: "4%", t: "18%", w: "12%", i: 3, s: 0.8, front: false },
  { l: "64%", t: "8%", w: "13%", i: 1, s: 1.1, front: false },
];
function M410() {
  const root = useRef<HTMLDivElement>(null);
  useScrubTl(root, (tl, el) => {
    const H = el.clientHeight;
    // centre frame: a small inset window opens to the full stage over the whole scroll
    tl.fromTo(".m410-c", { clipPath: "inset(34% 38% 34% 38% round 18px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)", duration: 1 }, 0)
      .fromTo(".m410-ci", { scale: 1.3 }, { scale: 1, duration: 1 }, 0)
      .fromTo(".m410-t", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3 }, 0.7);
    // satellites float upward, each at its own speed (parallax), past and through the opening frame
    el.querySelectorAll<HTMLElement>(".m410-f").forEach((f) => {
      const s = Number(f.dataset.s);
      tl.fromTo(f, { y: H * 0.35 * s }, { y: -H * 1.05 * s, duration: 1 }, 0);
    });
  });
  return (
    <Frame r={root} bg="#0a0d14">
      <Glow code="m410" color="rgba(79,141,255,.42)" />
      {M410_FLOAT.filter((f) => !f.front).map((f, k) => (
        <div key={`b${k}`} data-s={f.s} className="m410-f absolute z-0 aspect-[4/5] overflow-hidden rounded-[14px] opacity-70 will-change-transform" style={{ left: f.l, top: f.t, width: f.w }}>
          <Img i={f.i} w={500} h={620} />
        </div>
      ))}
      <div className="m410-c absolute inset-0 z-10 overflow-hidden will-change-[clip-path]" style={{ clipPath: "inset(0% 0% 0% 0% round 0px)" }}>
        <Img i={0} w={1600} h={1000} className="m410-ci will-change-transform" label="NIGHT RUN" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
      </div>
      {M410_FLOAT.filter((f) => f.front).map((f, k) => (
        <div key={`f${k}`} data-s={f.s} className="m410-f absolute z-20 aspect-[4/5] overflow-hidden rounded-[14px] border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,.5)] will-change-transform" style={{ left: f.l, top: f.t, width: f.w }}>
          <Img i={f.i} w={500} h={620} />
        </div>
      ))}
      <div className="m410-t pointer-events-none absolute bottom-[8%] left-[5%] z-20 text-[#eaf5ff]">
        <p className="text-[clamp(44px,5vw,80px)] font-[700] leading-[0.95] tracking-[-0.03em]" style={{ fontFamily: GROTESK }}>
          Lights out, pace up.
        </p>
        <p className="mt-2 text-[14px] text-white/75">Lumen reflective runner · ₹8,990</p>
      </div>
      <TopGlow code="m410" color="rgba(150,200,255,.3)" at="60% 60%" />
    </Frame>
  );
}

/* ---------- M411 · Image tunnel from centre point (variant of M28: images grow from a centre point, oversaturated → true colour) ---------- */
const M411_IMGS: [number, string, string][] = [
  [0, "Glacier", "Day 1"],
  [1, "Ember", "Day 2"],
  [2, "Canopy", "Day 3"],
  [3, "Dunes", "Day 4"],
  [0, "Harbour", "Day 5"],
];
function M411() {
  const root = useRef<HTMLDivElement>(null);
  const N = M411_IMGS.length;
  const S = 0.55; // stagger between images (in u units)
  const K = 0.7 - 0.25 + (N - 1) * S; // last image reaches u = 0.7 + … at p = 1 (full size, never empty)
  const apply = (p: number) => {
    const el = root.current;
    if (!el) return;
    el.querySelectorAll<HTMLElement>(".m411-i").forEach((n, i) => {
      const last = i === N - 1;
      const u = clamp01(0.25 + p * (K + 0.25) - i * S);
      // approaching the viewer: exponential growth from a point to past the frame
      const sc = 0.02 * Math.pow(60, u);
      const sat = 3.2 - 2.2 * clamp01(u / 0.8);
      const con = 1.7 - 0.7 * clamp01(u / 0.8);
      const op = last ? clamp01(u * 8) : clamp01(u * 8) * (1 - clamp01((u - 0.8) / 0.12));
      n.style.transform = `scale(${sc.toFixed(4)})`;
      n.style.filter = `saturate(${sat.toFixed(2)}) contrast(${con.toFixed(2)})`;
      n.style.opacity = op.toFixed(3);
    });
    const cap = el.querySelectorAll<HTMLElement>(".m411-cap");
    const act = Math.min(N - 1, Math.max(0, Math.floor((0.25 + p * (K + 0.25) - 0.45) / S + 1)));
    cap.forEach((c, i) => (c.style.opacity = i === act ? "1" : "0"));
  };
  useScrub(root, apply);
  return (
    <Frame r={root} bg="#06080d">
      <Glow code="m411" color="rgba(24,196,180,.4)" at="50% 50%" />
      <div className="absolute inset-0 grid place-items-center">
        {M411_IMGS.map(([img, t], i) => (
          <div
            key={t}
            className="m411-i absolute h-[74%] w-[62%] overflow-hidden rounded-[18px] shadow-[0_30px_80px_rgba(0,0,0,.6)] will-change-transform"
            style={{ zIndex: N - i, opacity: i === N - 1 ? 1 : 0, transform: "scale(1)" }}
          >
            <Img i={img} w={1200} h={900} label={t.toUpperCase()} />
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute left-[5%] top-[7%] z-20 text-[#f1fff4]">
        <p className="text-[13px] uppercase tracking-[0.2em] text-white/60">Northbound · five-day route</p>
        <div className="relative mt-2 h-[1.1em] text-[clamp(36px,3.6vw,58px)] leading-none" style={{ fontFamily: EDITORIAL }}>
          {M411_IMGS.map(([, t, d], i) => (
            <span key={t} className="m411-cap absolute left-0 top-0 whitespace-nowrap transition-opacity duration-300" style={{ opacity: i === N - 1 ? 1 : 0 }}>
              {d} · {t}
            </span>
          ))}
        </div>
      </div>
      <p className="pointer-events-none absolute bottom-4 right-5 z-20 text-[14px] text-white/75" style={{ fontFamily: GROTESK }}>
        Full route from ₹64,000
      </p>
      <TopGlow code="m411" color="rgba(160,255,230,.28)" at="45% 55%" />
    </Frame>
  );
}

/* ---------- M412 · Quadrant choreography (variant of M28: four quadrants travel set paths, then one fills the stage) ---------- */
type Box = { left: string; top: string; width: string; height: string; rotation?: number };
const M412_PATH: Box[][] = [
  // tile 0 (expands at the end)
  [
    { left: "4%", top: "5%", width: "44%", height: "42%" },
    { left: "30%", top: "-2%", width: "40%", height: "38%", rotation: -4 },
    { left: "52%", top: "5%", width: "44%", height: "42%", rotation: 0 },
    { left: "0%", top: "0%", width: "100%", height: "100%", rotation: 0 },
  ],
  [
    { left: "52%", top: "5%", width: "44%", height: "42%" },
    { left: "64%", top: "32%", width: "34%", height: "34%", rotation: 5 },
    { left: "52%", top: "53%", width: "44%", height: "42%", rotation: 0 },
    { left: "78%", top: "110%", width: "30%", height: "30%", rotation: 8 },
  ],
  [
    { left: "52%", top: "53%", width: "44%", height: "42%" },
    { left: "30%", top: "64%", width: "40%", height: "34%", rotation: -5 },
    { left: "4%", top: "53%", width: "44%", height: "42%", rotation: 0 },
    { left: "-30%", top: "110%", width: "30%", height: "30%", rotation: -8 },
  ],
  [
    { left: "4%", top: "53%", width: "44%", height: "42%" },
    { left: "2%", top: "30%", width: "34%", height: "34%", rotation: 4 },
    { left: "4%", top: "5%", width: "44%", height: "42%", rotation: 0 },
    { left: "-30%", top: "-40%", width: "30%", height: "30%", rotation: -8 },
  ],
];
const M412_TILES: [number, string][] = [
  [1, "SAFFRON"],
  [0, "INDIGO"],
  [2, "MOSS"],
  [3, "OCHRE"],
];
function M412() {
  const root = useRef<HTMLDivElement>(null);
  useScrubTl(root, (tl, el) => {
    el.querySelectorAll<HTMLElement>(".m412-q").forEach((q, k) => {
      const [a, b, c, d] = M412_PATH[k];
      // 0 → .5: the quadrants travel their curved paths (a half turn round the stage); .5 → 1: tile 0 fills, the others leave
      tl.fromTo(q, { ...a, rotation: 0 }, { ...b, duration: 0.25 }, 0).to(q, { ...c, duration: 0.25 }, 0.25).to(q, { ...d, duration: 0.5 }, 0.5);
    });
    tl.fromTo(".m412-cap", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.25 }, 0.75).fromTo(".m412-h", { opacity: 1 }, { opacity: 0, duration: 0.2 }, 0.5);
  });
  return (
    <Frame r={root} bg="#140f07">
      <Glow code="m412" color="rgba(224,145,63,.42)" />
      <h3 className="m412-h pointer-events-none absolute inset-0 grid place-items-center text-center text-[clamp(44px,4.6vw,76px)] leading-none text-[#fff6e8]" style={{ fontFamily: SERIF, fontWeight: 500 }}>
        Four dyes, one loom.
      </h3>
      {M412_TILES.map(([i, l], k) => (
        <div
          key={l}
          className="m412-q absolute overflow-hidden rounded-[16px] will-change-transform"
          style={{ ...M412_PATH[k][0], zIndex: k === 0 ? 5 : 2 }}
        >
          <Img i={i} w={1400} h={900} label={l} />
        </div>
      ))}
      <div className="m412-cap pointer-events-none absolute bottom-[8%] left-[5%] z-10 text-[#fff6e8]" style={{ opacity: 0 }}>
        <p className="text-[clamp(36px,3.6vw,58px)] leading-none" style={{ fontFamily: EDITORIAL }}>
          Saffron handloom throw
        </p>
        <p className="mt-2 text-[14px] text-white/80">Warp &amp; Weft studio · ₹4,200</p>
      </div>
      <TopGlow code="m412" color="rgba(255,210,150,.3)" at="55% 50%" />
    </Frame>
  );
}

/* ---------- M413 · Inline image expands out of text (scrubbed Flip.fit from the inline slot to a large frame) ---------- */
function M413() {
  const root = useRef<HTMLDivElement>(null);
  useScrubTl(
    root,
    (tl, el) => {
      const slot = el.querySelector<HTMLElement>(".m413-slot");
      const big = el.querySelector<HTMLElement>(".m413-big");
      const target = el.querySelector<HTMLElement>(".m413-target");
      if (!slot || !big || !target) return;
      const sr = el.getBoundingClientRect();
      const r = slot.getBoundingClientRect();
      // the stage-level copy sits exactly on the inline image, which is hidden while the copy flies
      gsap.set(big, { left: r.left - sr.left, top: r.top - sr.top, width: r.width, height: r.height, x: 0, y: 0, visibility: "visible" });
      gsap.set(slot, { visibility: "hidden" });
      const Flip = M413_FLIP.f;
      let vars: gsap.TweenVars | null = null;
      if (Flip) vars = Flip.fit(big, target, { getVars: true, scale: false }) as gsap.TweenVars | null;
      if (!vars) {
        const tr = target.getBoundingClientRect();
        vars = { x: tr.left - r.left, y: tr.top - r.top, width: tr.width, height: tr.height };
      }
      tl.to(big, { ...vars, borderRadius: 22, duration: 0.8 }, 0)
        .fromTo(".m413-bigi", { scale: 1.6 }, { scale: 1, duration: 0.8 }, 0)
        .to(".m413-text", { yPercent: -38, skewY: -5, opacity: 0.18, duration: 0.8 }, 0)
        .fromTo(".m413-cap", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.2 }, 0.8);
    },
    () => loadPlugin("Flip").then((f) => void (M413_FLIP.f = f)),
  );
  return (
    <Frame r={root} bg="#0d0b14">
      <Glow code="m413" color="rgba(150,120,255,.42)" at="50% 50%" />
      <div className="m413-text absolute inset-0 flex items-center justify-center will-change-transform" style={{ transformOrigin: "50% 50%" }}>
        <p className="max-w-[17ch] text-center text-[clamp(44px,4.8vw,80px)] leading-[1.08] tracking-[-0.02em] text-[#efeaff]" style={{ fontFamily: SERIF, fontWeight: 500 }}>
          A chair carved from{" "}
          <span className="m413-slot relative inline-block h-[0.82em] w-[1.6em] overflow-hidden rounded-[0.18em] align-[-0.06em]">
            <Img i={3} w={600} h={320} />
          </span>{" "}
          one walnut log, finished by hand.
        </p>
      </div>
      <div className="m413-target pointer-events-none absolute left-[15%] top-[10%] h-[72%] w-[70%]" aria-hidden />
      <div className="m413-big absolute z-10 overflow-hidden will-change-transform" style={{ visibility: "hidden", borderRadius: 8 }}>
        <Img i={3} w={1400} h={900} className="m413-bigi will-change-transform" label="WALNUT" />
      </div>
      <div className="m413-cap pointer-events-none absolute bottom-[5%] left-[15%] right-[15%] z-20 flex justify-between text-[#efeaff]" style={{ fontFamily: GROTESK, opacity: 0 }}>
        <p className="text-[clamp(20px,1.8vw,28px)] font-[600]">Hollow lounge chair</p>
        <p className="text-[clamp(20px,1.8vw,28px)] font-[600] text-[#cbb8ff]">₹68,000</p>
      </div>
      <TopGlow code="m413" color="rgba(200,180,255,.28)" at="45% 50%" />
    </Frame>
  );
}
const M413_FLIP: { f: Awaited<ReturnType<typeof loadPlugin<"Flip">>> | null } = { f: null };

/* ---------- M414 · Sticky image shrinks under scrolling copy (variant of M13: the copy scrolls over a sticky shrinking image) ---------- */
function M414() {
  const root = useRef<HTMLDivElement>(null);
  const apply = (p: number) => {
    const el = root.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(".m414-card");
    const col = el.querySelector<HTMLElement>(".m414-col");
    const head = el.querySelector<HTMLElement>(".m414-head");
    if (!card || !col || !head) return;
    const H = el.clientHeight;
    // sticky image: full stage → a rounded card at 60%
    const s = 1 - 0.4 * p;
    card.style.transform = `scale(${s.toFixed(4)})`;
    card.style.borderRadius = `${(48 * p).toFixed(1)}px`;
    // copy column scrolls over it linearly; the heading moves at 1.5× (parallax)
    const travel = col.scrollHeight - H * 0.55;
    const y = H * 0.75 - p * travel;
    col.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
    head.style.transform = `translate3d(0,${(H * 0.5 - p * H * 1.25).toFixed(1)}px,0)`;
  };
  useScrub(root, apply);
  return (
    <Frame r={root} bg="#07140f">
      <Glow code="m414" color="rgba(24,196,143,.42)" />
      <div className="absolute inset-0 grid place-items-center">
        <div className="m414-card relative h-full w-full overflow-hidden will-change-transform">
          <Img i={2} w={1600} h={1000} label="FERN" />
          <div className="absolute inset-0 bg-black/25" />
        </div>
      </div>
      <h3
        className="m414-head pointer-events-none absolute left-[6%] top-0 z-10 text-[clamp(56px,6vw,100px)] font-[700] leading-[0.9] tracking-[-0.04em] text-[#f1fff4] will-change-transform"
        style={{ fontFamily: GROTESK }}
      >
        Grown slow.
      </h3>
      <div className="m414-col absolute right-[6%] top-0 z-20 w-[min(34%,420px)] will-change-transform">
        {[
          ["01 · Soil", "Every fern is potted in our own peat-free mix, aged for six weeks before planting."],
          ["02 · Light", "Shade-house raised under 40% cloth, so it settles into a north-facing room without sulking."],
          ["03 · Delivery", "Shipped in a ventilated crate with a care card. Boston fern, 30 cm pot · ₹1,250."],
        ].map(([t, d]) => (
          <div key={t} className="mb-[8vh] rounded-[18px] border border-white/15 bg-[#07140f]/80 p-6 backdrop-blur-md">
            <p className="text-[13px] uppercase tracking-[0.2em] text-[#c8ff8a]">{t}</p>
            <p className="mt-3 text-[16px] leading-relaxed text-white/85" style={{ fontFamily: MANROPE }}>
              {d}
            </p>
          </div>
        ))}
      </div>
      <TopGlow code="m414" color="rgba(200,255,140,.24)" at="40% 60%" />
    </Frame>
  );
}

/* ---------- M415 · Panel shrinks to framed card under next (variant of X1: the covered panel becomes a framed, dimmed card) ---------- */
const M415_PANELS: [number, string, string, string][] = [
  [0, "#0b1020", "Studio monitors", "₹38,000 the pair"],
  [1, "#1a0b12", "Turntable, belt drive", "₹29,500"],
  [3, "#140f07", "Valve amplifier", "₹74,000"],
];
function M415() {
  const root = useRef<HTMLDivElement>(null);
  useScrubTl(root, (tl) => {
    const seg = 1 / (M415_PANELS.length - 1);
    for (let k = 1; k < M415_PANELS.length; k++) {
      const t0 = (k - 1) * seg;
      // the incoming panel overshoots a little (overscroll) and settles back with momentum
      tl.fromTo(`.m415-p${k}`, { yPercent: 100 }, { yPercent: -3, duration: seg * 0.8 }, t0).to(`.m415-p${k}`, { yPercent: 0, duration: seg * 0.2, ease: "power1.out" }, t0 + seg * 0.8);
      // the pinned one becomes a framed, rounded, dimmed card
      tl.fromTo(`.m415-p${k - 1}`, { scale: 1, borderRadius: 0, filter: "brightness(1)" }, { scale: 0.84, borderRadius: 32, filter: "brightness(0.45)", duration: seg }, t0);
    }
  });
  return (
    <Frame r={root} bg="#05070b">
      <Glow code="m415" color="rgba(255,77,109,.38)" at="50% 50%" />
      {M415_PANELS.map(([i, bg, t, pr], k) => (
        <section
          key={t}
          className={`m415-p${k} absolute inset-0 overflow-hidden will-change-transform`}
          style={{ zIndex: k + 1, background: bg, transform: k === 0 ? undefined : "translateY(100%)" }}
        >
          <div className="absolute inset-y-0 right-0 w-[58%]">
            <Img i={i} w={1000} h={900} />
          </div>
          <div className="absolute inset-y-0 left-[6%] flex w-[36%] flex-col justify-center text-white">
            <p className="text-[13px] uppercase tracking-[0.2em] text-white/60">Hi-fi room · 0{k + 1}</p>
            <h3 className="mt-3 text-[clamp(40px,4.2vw,70px)] leading-[0.95]" style={{ fontFamily: EDITORIAL }}>
              {t}
            </h3>
            <p className="mt-4 text-[18px] font-[600] text-white/80" style={{ fontFamily: GROTESK }}>
              {pr}
            </p>
          </div>
        </section>
      ))}
      <TopGlow code="m415" color="rgba(255,180,160,.26)" at="40% 50%" />
    </Frame>
  );
}

/* ---------- M416 · Covered section darkens, lifts, image tilts (variant of M40) ---------- */
const M416_SECS: [number, string, string, string][] = [
  [1, "#1a0b12", "Hot sauce, slow fermented", "Ghost Ember · ₹480"],
  [3, "#140f07", "Smoked chilli oil", "Ash & Oil · ₹560"],
  [2, "#07140f", "Green mango pickle", "Raw Tang · ₹390"],
];
function M416() {
  const root = useRef<HTMLDivElement>(null);
  useScrubTl(root, (tl) => {
    const seg = 1 / (M416_SECS.length - 1);
    for (let k = 1; k < M416_SECS.length; k++) {
      const t0 = (k - 1) * seg;
      tl.fromTo(`.m416-s${k}`, { yPercent: 100 }, { yPercent: 0, duration: seg }, t0)
        .fromTo(`.m416-s${k - 1}`, { yPercent: 0, filter: "brightness(1) contrast(1)" }, { yPercent: -15, filter: "brightness(0.6) contrast(1.35)", duration: seg }, t0)
        .fromTo(`.m416-s${k - 1} .m416-img`, { rotationX: 0 }, { rotationX: -20, duration: seg }, t0);
    }
  });
  return (
    <Frame r={root} bg="#05070b">
      <Glow code="m416" color="rgba(255,120,60,.4)" />
      {M416_SECS.map(([i, bg, t, pr], k) => (
        <section
          key={t}
          className={`m416-s${k} absolute inset-0 flex items-center gap-[5%] overflow-hidden px-[6%] will-change-transform`}
          style={{ zIndex: k + 1, background: bg, transform: k === 0 ? undefined : "translateY(100%)" }}
        >
          <div className="w-[44%] text-white">
            <p className="text-[13px] uppercase tracking-[0.2em] text-white/60">Pantry · 0{k + 1}</p>
            <h3 className="mt-3 text-[clamp(40px,4.2vw,68px)] font-[500] leading-[0.95]" style={{ fontFamily: SERIF }}>
              {t}
            </h3>
            <p className="mt-4 text-[17px] font-[600] text-white/80" style={{ fontFamily: GROTESK }}>
              {pr}
            </p>
          </div>
          <div className="h-[72%] flex-1" style={{ perspective: "900px" }}>
            <div className="m416-img h-full w-full overflow-hidden rounded-[20px] will-change-transform" style={{ transformOrigin: "50% 100%" }}>
              <Img i={i} w={900} h={800} />
            </div>
          </div>
        </section>
      ))}
      <TopGlow code="m416" color="rgba(255,170,120,.26)" at="60% 45%" />
    </Frame>
  );
}

/* ---------- M417 · Covered section folds back (variant of M40: rotationX −90 from the top edge, scale .9, dim) ---------- */
const M417_SECS: [number, string, string, string][] = [
  [0, "#0b1020", "Ceramic pour-over", "Drip & Stone · ₹2,400"],
  [2, "#07140f", "Glass cold brewer", "Steep · ₹3,100"],
  [3, "#140f07", "Copper moka pot", "Burnish · ₹4,600"],
];
function M417() {
  const root = useRef<HTMLDivElement>(null);
  useScrubTl(root, (tl) => {
    const seg = 1 / (M417_SECS.length - 1);
    for (let k = 1; k < M417_SECS.length; k++) {
      const t0 = (k - 1) * seg;
      tl.fromTo(`.m417-s${k}`, { yPercent: 100 }, { yPercent: 0, duration: seg }, t0).fromTo(
        `.m417-s${k - 1}`,
        { rotationX: 0, scale: 1, filter: "brightness(1)" },
        { rotationX: -90, scale: 0.9, filter: "brightness(0.35)", duration: seg },
        t0,
      );
    }
  });
  return (
    <Frame r={root} bg="#05070b">
      <Glow code="m417" color="rgba(79,141,255,.4)" at="50% 30%" />
      <div className="absolute inset-0" style={{ perspective: "1200px", perspectiveOrigin: "50% 0%" }}>
        {M417_SECS.map(([i, bg, t, pr], k) => (
          <section
            key={t}
            className={`m417-s${k} absolute inset-0 overflow-hidden will-change-transform`}
            style={{ zIndex: k + 1, background: bg, transformOrigin: "50% 0%", transform: k === 0 ? undefined : "translateY(100%)" }}
          >
            <Img i={i} w={1600} h={1000} className="absolute inset-0 opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-[10%] left-[6%] text-white">
              <p className="text-[13px] uppercase tracking-[0.2em] text-white/65">Brew bar · 0{k + 1}</p>
              <h3 className="mt-3 text-[clamp(44px,4.6vw,76px)] font-[700] leading-[0.92] tracking-[-0.03em]" style={{ fontFamily: GROTESK }}>
                {t}
              </h3>
              <p className="mt-3 text-[17px] text-white/80">{pr}</p>
            </div>
          </section>
        ))}
      </div>
      <TopGlow code="m417" color="rgba(160,200,255,.26)" at="40% 60%" />
    </Frame>
  );
}

/* ---------- M418 · Stack with blur and rotation (variant of M40: buried cards shrink, turn a few degrees and blur) ---------- */
const M418_CARDS: [number, string, string, string][] = [
  [0, "Basic", "₹0", "Two projects, community help"],
  [1, "Studio", "₹1,200/mo", "Unlimited projects, brand kit"],
  [2, "Team", "₹3,900/mo", "Five seats, shared libraries"],
  [3, "Agency", "₹9,500/mo", "Client spaces, white label"],
  [0, "Enterprise", "Talk to us", "SSO, audit log, priority line"],
];
function M418() {
  const root = useRef<HTMLDivElement>(null);
  const N = M418_CARDS.length;
  const apply = (p: number) => {
    const el = root.current;
    if (!el) return;
    const H = el.clientHeight;
    // card 0 is already landed at p=0; cards 1..N-1 land one after another, the last one exactly at p=1
    const f = p * (N - 1); // how many cards have landed after the first
    el.querySelectorAll<HTMLElement>(".m418-c").forEach((c, k) => {
      const land = clamp01(f - (k - 1)); // 0 = below the stage, 1 = at the stack position
      const y = k === 0 ? 0 : (1 - land) * H * 0.95;
      const depth = Math.max(0, f - k); // cards landed on top of this one (continuous)
      const sc = 1 - 0.06 * depth;
      const rot = (k % 2 ? 1 : -1) * Math.min(depth, 3) * 2.2;
      const blur = Math.min(depth, 3) * 2.2;
      c.style.transform = `translate3d(-50%,${(y - depth * 14).toFixed(1)}px,0) scale(${sc.toFixed(3)}) rotate(${rot.toFixed(2)}deg)`;
      c.style.filter = `blur(${blur.toFixed(2)}px) brightness(${(1 - Math.min(depth, 3) * 0.12).toFixed(2)})`;
    });
  };
  useScrub(root, apply);
  return (
    <Frame r={root} bg="#0b0f17">
      <Glow code="m418" color="rgba(120,160,255,.42)" />
      <p className="pointer-events-none absolute left-[5%] top-[7%] text-[clamp(40px,4vw,64px)] leading-none text-[#eaf5ff]" style={{ fontFamily: EDITORIAL }}>
        Pick a plan.
      </p>
      {M418_CARDS.map(([i, t, pr, d], k) => (
        <article
          key={t}
          className="m418-c absolute left-1/2 top-[18%] flex h-[66%] w-[min(58%,720px)] overflow-hidden rounded-[22px] border border-white/15 bg-[#121826] shadow-[0_30px_70px_rgba(0,0,0,.55)] will-change-transform"
          style={{ zIndex: k + 1, transform: k === N - 1 ? "translate3d(-50%,0,0)" : `translate3d(-50%,${-(N - 1 - k) * 14}px,0) scale(${1 - 0.06 * (N - 1 - k)})`, transformOrigin: "50% 0%" }}
        >
          <div className="w-[42%]">
            <Img i={i} w={600} h={700} />
          </div>
          <div className="flex flex-1 flex-col justify-between p-[5%] text-white" style={{ fontFamily: MANROPE }}>
            <div>
              <p className="text-[13px] uppercase tracking-[0.2em] text-white/55">Plan 0{k + 1}</p>
              <h3 className="mt-2 text-[clamp(32px,3vw,48px)] font-[700] leading-none" style={{ fontFamily: GROTESK }}>
                {t}
              </h3>
              <p className="mt-3 text-[16px] text-white/75">{d}</p>
            </div>
            <p className="text-[clamp(24px,2.2vw,34px)] font-[700] text-[#9fd8ff]">{pr}</p>
          </div>
        </article>
      ))}
      <TopGlow code="m418" color="rgba(170,210,255,.24)" at="50% 60%" />
    </Frame>
  );
}

/* ---------- M419 · Sticky split image scale-swap (variant of M149: the sticky image scales a little and swaps per text step) ---------- */
const M419_STEPS: [number, string, string][] = [
  [1, "Pick your roast", "Light, medium or dark, roasted on Monday and shipped on Tuesday."],
  [3, "Set the grind", "Tell us your brewer and we grind for it, from espresso to French press."],
  [2, "Choose a rhythm", "Every two, three or four weeks. Skip or pause any time."],
  [0, "Brew at home", "250 g bag from ₹640, delivered free over ₹999."],
];
function M419() {
  const root = useRef<HTMLDivElement>(null);
  const N = M419_STEPS.length;
  const apply = (p: number) => {
    const el = root.current;
    if (!el) return;
    const col = el.querySelector<HTMLElement>(".m419-col");
    if (!col) return;
    const H = el.clientHeight;
    const blocks = col.querySelectorAll<HTMLElement>(".m419-b");
    const first = blocks[0];
    const last = blocks[N - 1];
    // the text column scrolls linearly: first block centred at p=0, last block centred at p=1
    const c0 = first.offsetTop + first.offsetHeight / 2;
    const c1 = last.offsetTop + last.offsetHeight / 2;
    const y = H / 2 - (c0 + p * (c1 - c0));
    col.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
    const f = p * (N - 1);
    blocks.forEach((b, i) => (b.style.opacity = (0.28 + 0.72 * clamp01(1 - Math.abs(f - i) * 1.6)).toFixed(3)));
    // sticky image: swaps (short crossfade) around each step's midpoint, scales up slightly through its step
    el.querySelectorAll<HTMLElement>(".m419-i").forEach((n, i) => {
      const lo = i === 0 ? -1 : i - 0.5;
      // later images sit on top: each fades in over the one below it, so the frame is never empty mid-swap
      const op = i === 0 ? 1 : clamp01((f - lo) / 0.12);
      const local = clamp01((f - (i - 0.5)) / 1);
      n.style.opacity = op.toFixed(3);
      n.style.transform = `scale(${(1 + 0.08 * local).toFixed(4)})`;
    });
    const num = el.querySelector<HTMLElement>(".m419-n");
    if (num) num.textContent = `0${Math.min(N, Math.round(f) + 1)}`;
  };
  useScrub(root, apply);
  return (
    <Frame r={root} bg="#100c08">
      <Glow code="m419" color="rgba(224,145,63,.42)" at="30% 50%" />
      <div className="m419-col absolute left-[6%] top-0 w-[38%] will-change-transform">
        {M419_STEPS.map(([, t, d], k) => (
          <div key={t} className="m419-b py-[16vh]" style={{ opacity: k === N - 1 ? 1 : 0.28 }}>
            <p className="text-[13px] uppercase tracking-[0.2em] text-[#ffd59a]">Step 0{k + 1}</p>
            <h3 className="mt-3 text-[clamp(36px,3.6vw,58px)] font-[500] leading-[0.95] text-[#fff6e8]" style={{ fontFamily: SERIF }}>
              {t}
            </h3>
            <p className="mt-4 max-w-[36ch] text-[16px] leading-relaxed text-white/70" style={{ fontFamily: MANROPE }}>
              {d}
            </p>
          </div>
        ))}
      </div>
      <div className="absolute right-[5%] top-[10%] h-[80%] w-[44%] overflow-hidden rounded-[24px] border border-white/10">
        {M419_STEPS.map(([i, t], k) => (
          <div key={t} className="m419-i absolute inset-0 will-change-transform" style={{ opacity: k === N - 1 ? 1 : 0 }}>
            <Img i={i} w={900} h={1000} label={t.toUpperCase()} />
          </div>
        ))}
        <p className="m419-n absolute right-5 top-4 text-[clamp(32px,3vw,48px)] font-[700] text-white/85" style={{ fontFamily: GROTESK }}>
          04
        </p>
      </div>
      <TopGlow code="m419" color="rgba(255,200,140,.26)" at="70% 50%" />
    </Frame>
  );
}

/* ---------- M420 · Centre item expands (variant of M50: the timeline item nearest the centre opens its details) ---------- */
const M420_ITEMS: [string, string, string][] = [
  ["v4.0", "Spring release", "Offline mode, a new editor and 40% faster sync across devices."],
  ["v4.1", "Shared spaces", "Invite up to five people to a space; comments land in real time."],
  ["v4.2", "Smart templates", "Start a page from twelve templates that fill themselves from your notes."],
  ["v4.3", "Calendar view", "Drag any task onto a day; reminders follow you to every device."],
  ["v4.4", "Quiet hours", "Notifications pause on your schedule and arrive as one calm digest."],
  ["v5.0", "Autumn release", "A rebuilt mobile app, dark mode everywhere and new Pro plan at ₹299/mo."],
];
function M420() {
  const root = useRef<HTMLDivElement>(null);
  const N = M420_ITEMS.length;
  const apply = (p: number) => {
    const el = root.current;
    if (!el) return;
    const col = el.querySelector<HTMLElement>(".m420-col");
    if (!col) return;
    const H = el.clientHeight;
    const f = p * (N - 1); // continuous index at the stage centre
    const items = col.querySelectorAll<HTMLElement>(".m420-it");
    items.forEach((it, i) => {
      const w = smooth(1 - Math.abs(f - i) * 1.4);
      const det = it.querySelector<HTMLElement>(".m420-det");
      const dot = it.querySelector<HTMLElement>(".m420-dot");
      if (det) {
        det.style.height = `${(w * 128).toFixed(1)}px`;
        det.style.opacity = clamp01(w * 1.4 - 0.3).toFixed(3);
      }
      if (dot) dot.style.transform = `scale(${(1 + w * 0.8).toFixed(3)})`;
      it.style.opacity = (0.35 + 0.65 * w).toFixed(3);
    });
    // keep the focus point (between the two nearest items' heads) on the centre line
    const a = Math.floor(f);
    const b = Math.min(N - 1, a + 1);
    const ha = items[a].offsetTop + 30;
    const hb = items[b].offsetTop + 30;
    const c = ha + (hb - ha) * (f - a);
    col.style.transform = `translate3d(0,${(H / 2 - c).toFixed(1)}px,0)`;
  };
  useScrub(root, apply);
  return (
    <Frame r={root} bg="#0b0f17">
      <Glow code="m420" color="rgba(79,141,255,.42)" at="60% 50%" />
      <div className="pointer-events-none absolute left-[6%] top-[8%] text-[#eaf5ff]">
        <p className="text-[13px] uppercase tracking-[0.2em] text-white/55">Notewell · changelog</p>
        <p className="mt-3 text-[clamp(40px,4vw,64px)] leading-none" style={{ fontFamily: EDITORIAL }}>
          What&rsquo;s new.
        </p>
      </div>
      <div className="pointer-events-none absolute left-[38%] right-[8%] top-1/2 h-px bg-white/10" aria-hidden />
      <div className="m420-col absolute left-[40%] top-0 w-[min(50%,640px)] border-l border-white/15 will-change-transform">
        {M420_ITEMS.map(([v, t, d], k) => (
          <div key={v} className="m420-it relative pb-6 pl-10" style={{ opacity: k === N - 1 ? 1 : 0.35 }}>
            <span className="m420-dot absolute -left-[7px] top-[23px] h-[13px] w-[13px] rounded-full bg-[#4f8dff] shadow-[0_0_18px_rgba(79,141,255,.8)]" />
            <div className="flex items-baseline gap-4 pt-3 text-white" style={{ fontFamily: GROTESK }}>
              <span className="text-[14px] font-[600] text-[#9fd8ff]">{v}</span>
              <span className="text-[clamp(26px,2.4vw,38px)] font-[600] leading-tight">{t}</span>
            </div>
            <div className="m420-det overflow-hidden" style={{ height: k === N - 1 ? 128 : 0, opacity: k === N - 1 ? 1 : 0 }}>
              <p className="max-w-[44ch] pt-3 text-[16px] leading-relaxed text-white/75" style={{ fontFamily: MANROPE }}>
                {d}
              </p>
              <span className="mt-3 inline-block rounded-full border border-white/20 px-3 py-1 text-[13px] text-white/80">Read notes →</span>
            </div>
          </div>
        ))}
      </div>
    </Frame>
  );
}

/* ---------- M421 · Active word at centre (variant of M20: the word on the centre line is bright, the rest dim) ---------- */
const M421_WORDS = ["Source", "Roast", "Rest", "Grind", "Bloom", "Pour", "Taste", "Repeat"];
function M421() {
  const root = useRef<HTMLDivElement>(null);
  const N = M421_WORDS.length;
  const apply = (p: number) => {
    const el = root.current;
    if (!el) return;
    const col = el.querySelector<HTMLElement>(".m421-col");
    if (!col) return;
    const H = el.clientHeight;
    const ws = col.querySelectorAll<HTMLElement>(".m421-w");
    const c0 = ws[0].offsetTop + ws[0].offsetHeight / 2;
    const c1 = ws[N - 1].offsetTop + ws[N - 1].offsetHeight / 2;
    const y = H / 2 - (c0 + p * (c1 - c0));
    col.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
    ws.forEach((w) => {
      const cy = y + w.offsetTop + w.offsetHeight / 2;
      const d = Math.abs(cy - H / 2) / w.offsetHeight; // distance from the centre line in word heights
      const on = clamp01(1 - d * 1.15);
      w.style.opacity = (0.16 + 0.84 * on).toFixed(3);
      w.style.color = on > 0.5 ? "#ffd59a" : "#fff6e8";
      w.style.transform = `translateX(${(on * 2.2).toFixed(2)}vw)`;
    });
  };
  useScrub(root, apply);
  return (
    <Frame r={root} bg="#100c08">
      <Glow code="m421" color="rgba(224,145,63,.45)" at="55% 50%" />
      <p className="pointer-events-none absolute left-[6%] top-1/2 -mt-[0.6em] text-[clamp(20px,1.8vw,28px)] text-white/70" style={{ fontFamily: EDITORIAL }}>
        Our daily ritual —
      </p>
      <div className="m421-col absolute left-[34%] top-0 will-change-transform">
        {M421_WORDS.map((w, k) => (
          <p
            key={w}
            className="m421-w text-[clamp(56px,6.4vw,104px)] font-[800] uppercase leading-[1.02] tracking-[-0.03em] will-change-transform"
            style={{ fontFamily: WIDE, color: "#fff6e8", opacity: k === N - 1 ? 1 : 0.16 }}
          >
            {w}
          </p>
        ))}
      </div>
      <p className="pointer-events-none absolute bottom-4 right-5 text-[14px] text-white/70" style={{ fontFamily: GROTESK }}>
        Ember Lane roasters · house blend ₹640
      </p>
    </Frame>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M410", name: "Centre clip opens among floating images", how: "A centre image's clip-path opens from a small inset window to the full stage while satellite images float past it at different speeds · scrubbed", kind: "scrub", C: M410 },
  { code: "M411", name: "Image tunnel from centre point", how: "Each image grows from a point at the centre toward the viewer, oversaturated and contrasty far away, true colour up close, then the next follows · scrubbed", kind: "scrub", C: M411 },
  { code: "M412", name: "Quadrant choreography", how: "Four quadrant images travel set paths round the stage, then one expands to fill it while the others leave · scrubbed", kind: "scrub", C: M412 },
  { code: "M413", name: "Inline image expands out of text", how: "A small image sitting inside the sentence Flips to a large frame while the text block skews, moves up and dims · scrubbed", kind: "scrub", C: M413 },
  { code: "M414", name: "Sticky image shrinks under scrolling copy", how: "A sticky full-stage image shrinks into a rounded card while copy cards scroll over it and the heading moves faster (parallax) · scrubbed", kind: "scrub", C: M414 },
  { code: "M415", name: "Panel shrinks to framed card under next", how: "As the next panel slides over (overshoots, then settles), the pinned one scales into a framed, rounded, dimmed card · scrubbed", kind: "scrub", C: M415 },
  { code: "M416", name: "Covered section darkens, lifts, image tilts", how: "As the next section covers it, the pinned one darkens (brightness 60%, contrast 135%), lifts 15% and its image tilts −20° · scrubbed", kind: "scrub", C: M416 },
  { code: "M417", name: "Covered section folds back", how: "The covered section folds back from its top edge (rotationX −90), scaling to 0.9 and dimming as the next arrives · scrubbed", kind: "scrub", C: M417 },
  { code: "M418", name: "Stack with blur and rotation", how: "Pricing cards land one after another on a stack; buried cards scale down, turn a few degrees and blur · scrubbed", kind: "scrub", C: M418 },
  { code: "M419", name: "Sticky split image scale-swap", how: "Text steps scroll on the left while the sticky image on the right scales slightly and swaps to the matching image at each step · scrubbed", kind: "scrub", C: M419 },
  { code: "M420", name: "Centre item expands", how: "In a scrolling changelog only the item at the centre line opens its details (height + fade) and collapses as the next arrives · scrubbed", kind: "scrub", C: M420 },
  { code: "M421", name: "Active word at centre", how: "A column of big words scrolls past a centre line; the word on it is bright and nudged right, the others dim · scrubbed", kind: "scrub", C: M421 },
];
