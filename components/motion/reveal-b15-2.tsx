"use client";

// MOTION-MENU M668–M669 (reveal group, batch 15 · group 2): small focused demos for /lab/motion, rebuilt in GSAP from the
// idea only. Both "play": start on screen, loop (in → short hold → out → restart), pause off screen. Every demo has a
// CSS-only glow loop; ?static=1 / reduced motion shows the markup as written (everything in its final, settled place).
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { scene } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const GROTESK = "'Space Grotesk Variable', system-ui, sans-serif";
const SERIF = "'Fraunces Variable', Georgia, serif";
const EDITORIAL = "'Instrument Serif', Georgia, serif";
const WIDE = "'Syne Variable', 'Space Grotesk Variable', system-ui, sans-serif";
const BODY = "'Manrope Variable', system-ui, sans-serif";

const CSS = `
.b15r2-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.55)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.24)),transparent 70%);animation:b15r2-drift 5.2s linear infinite alternate;will-change:transform}
@keyframes b15r2-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
html.is-static .b15r2-glow{animation:none}
html.is-static {.b15r2-glow{animation:none}}
`;

/* ---------- shared helpers (local copies) ---------- */

function Stage({ r, children, bg = "#0a0d16", g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; bg?: string; g1?: string; g2?: string }) {
  return (
    <div ref={r} className="relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 text-[#eef2ff]" style={{ background: bg }}>
      <style href="b15r2-css" precedence="default">
        {CSS}
      </style>
      <div className="b15r2-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/** The glow again ON TOP of the cards (screen blend) so covered stages never freeze. */
const Sheen = ({ g1 }: { g1?: string }) => (
  <div className="b15r2-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.45, zIndex: 35 } as CSSProperties} aria-hidden />
);

/** Play: a looping timeline built after fonts load; plays on screen, pauses off screen. */
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

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, className = "", style, w = 700, h = 900 }: { i: number; className?: string; style?: CSSProperties; w?: number; h?: number }) => (
  <img src={scene(i, w, h)} alt="" className={`h-full w-full object-cover ${className}`} style={style} draggable={false} />
);

const inr = (n: number) => `₹ ${n.toLocaleString("en-IN")}`;

/* ---------- M668 · Corner-pivot rotate-in: each card swings in like a door around its own corner (or the centre) ---------- */
const M668_CARDS = [
  { name: "Linen Robe", p: 3400, pivot: "top left", o: "0% 0%", r: -90 },
  { name: "Clay Mug Set", p: 1850, pivot: "top right", o: "100% 0%", r: 90 },
  { name: "Wool Throw", p: 4600, pivot: "centre", o: "50% 50%", r: -75 },
  { name: "Brass Lamp", p: 6200, pivot: "bottom left", o: "0% 100%", r: 60 },
  { name: "Cedar Tray", p: 1290, pivot: "bottom right", o: "100% 100%", r: -60 },
];
function M668() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const cards = gsap.utils.toArray<HTMLElement>(".m668-c", el);
    gsap.set(cards, { transformOrigin: (i: number) => M668_CARDS[i].o });
    const tl = gsap.timeline({ repeat: -1 });
    tl.fromTo(
      cards,
      { rotation: (i: number) => M668_CARDS[i].r, opacity: 0 },
      { rotation: 0, opacity: 1, duration: 0.85, ease: "power2.out", stagger: 0.12 },
    )
      .to({}, { duration: 0.12 })
      .to(cards, { rotation: (i: number) => -M668_CARDS[i].r * 0.7, opacity: 0, duration: 0.5, ease: "power2.in", stagger: 0.06 });
    return tl;
  });
  return (
    <Stage r={root} bg="#0f0c0a" g1="rgba(255,170,110,.55)" g2="rgba(255,226,170,.22)">
      <div className="absolute left-[6%] top-[9%] flex w-[88%] items-end justify-between">
        <h3 className="text-[clamp(40px,4.4vw,72px)] leading-[0.95] text-[#fff1e6]" style={{ fontFamily: EDITORIAL }}>
          Doors open at nine.
        </h3>
        <p className="mb-2 text-[13px] uppercase tracking-[0.22em] text-[#ffd9b8]/60" style={{ fontFamily: BODY }}>
          Home edit · Winter drop
        </p>
      </div>
      <div className="absolute inset-x-[6%] bottom-[9%] top-[30%] grid grid-cols-5 gap-[1.6%]">
        {M668_CARDS.map((c, i) => (
          <div key={c.name} className="m668-c relative overflow-hidden rounded-[18px] border border-white/15 bg-[#1c1612] shadow-[0_30px_60px_rgba(0,0,0,.45)] will-change-transform">
            <div className="absolute inset-[8px] bottom-[70px] overflow-hidden rounded-[12px]">
              <Img i={i % 4} style={{ filter: `hue-rotate(${i * 14}deg)` }} />
            </div>
            <div className="absolute inset-x-[14px] bottom-[14px] text-[#fff1e6]">
              <p className="text-[12px] uppercase tracking-[0.18em] opacity-60" style={{ fontFamily: GROTESK }}>
                pivot · {c.pivot}
              </p>
              <div className="mt-1 flex items-baseline justify-between gap-2">
                <p className="truncate text-[19px] leading-tight" style={{ fontFamily: SERIF }}>
                  {c.name}
                </p>
                <p className="shrink-0 text-[14px]" style={{ fontFamily: GROTESK }}>
                  {inr(c.p)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Sheen g1="rgba(255,170,110,.55)" />
    </Stage>
  );
}

/* ---------- M669 · Roll-in: round badges roll in from a side (left, right, top, bottom) like wheels, then roll on out ---------- */
const M669_B = [
  { from: "left", x: -620, y: 0, r: -420, label: "New", price: 899, col: "#ff7a59" },
  { from: "top", x: 0, y: -520, r: -300, label: "Fresh", price: 1290, col: "#ffd166" },
  { from: "bottom", x: 0, y: 520, r: 300, label: "Drop", price: 640, col: "#7ce0c3" },
  { from: "right", x: 620, y: 0, r: 420, label: "Hot", price: 1750, col: "#8fb3ff" },
];
function M669() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const b = gsap.utils.toArray<HTMLElement>(".m669-b", el);
    const tl = gsap.timeline({ repeat: -1 });
    tl.fromTo(
      b,
      { x: (i: number) => M669_B[i].x, y: (i: number) => M669_B[i].y, rotation: (i: number) => M669_B[i].r, opacity: 0 },
      { x: 0, y: 0, rotation: 0, opacity: 1, duration: 1, ease: "power2.out", stagger: 0.12 },
    )
      .to({}, { duration: 0.12 })
      // keep rolling the same way, out of the opposite side
      .to(b, { x: (i: number) => -M669_B[i].x, y: (i: number) => -M669_B[i].y, rotation: (i: number) => -M669_B[i].r, opacity: 0, duration: 0.6, ease: "power2.in", stagger: 0.08 });
    return tl;
  });
  return (
    <Stage r={root} bg="#0b0d14" g1="rgba(124,160,255,.55)" g2="rgba(255,122,89,.26)">
      <div className="absolute left-[6%] top-[10%]">
        <p className="text-[13px] uppercase tracking-[0.22em] text-white/55" style={{ fontFamily: BODY }}>
          Corner bakery · Today only
        </p>
        <h3 className="mt-3 text-[clamp(40px,4.6vw,76px)] font-extrabold uppercase leading-[0.95] tracking-[-0.02em]" style={{ fontFamily: WIDE }}>
          Fresh off the line
        </h3>
      </div>
      <div className="absolute inset-x-[6%] bottom-[10%] top-[38%] grid grid-cols-4 items-center gap-[3%]">
        {M669_B.map((c, i) => (
          <div key={c.from} className="flex flex-col items-center gap-4">
            <div className="m669-b relative aspect-square w-[min(80%,220px)] will-change-transform">
              <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full" aria-hidden>
                <defs>
                  <path id={`m669-ring-${i}`} d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
                </defs>
                <circle cx="100" cy="100" r="98" fill={c.col} />
                <circle cx="100" cy="100" r="62" fill="#0b0d14" opacity=".12" />
                <circle cx="100" cy="100" r="90" fill="none" stroke="#0b0d14" strokeOpacity=".35" strokeDasharray="2 6" />
                <text fontSize="15" fontWeight="700" letterSpacing="4" fill="#0b0d14" style={{ fontFamily: GROTESK }}>
                  <textPath href={`#m669-ring-${i}`}>{`${c.label.toUpperCase()} · BAKED AT SIX · ${c.label.toUpperCase()} · BAKED AT SIX ·`}</textPath>
                </text>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[#0b0d14]">
                <span className="text-[12px] uppercase tracking-[0.2em] opacity-70" style={{ fontFamily: GROTESK }}>
                  {c.label}
                </span>
                <span className="text-[clamp(22px,2.2vw,34px)] leading-none" style={{ fontFamily: SERIF }}>
                  {inr(c.price)}
                </span>
              </div>
            </div>
            <p className="text-[13px] uppercase tracking-[0.2em] text-white/50" style={{ fontFamily: GROTESK }}>
              from {c.from}
            </p>
          </div>
        ))}
      </div>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M668", name: "Corner-pivot rotate-in", how: "Each card swings into place around its own corner (or the centre) from 60–90°, fading in like a door · loops on screen", kind: "play", C: M668 },
  { code: "M669", name: "Roll-in", how: "Round badges roll in like wheels from the left, right, top and bottom (travel + matching spin), then roll on out · loops on screen", kind: "play", C: M669 },
];
