"use client";

// MOTION-MENU M406–M409 (scroll group, batch 8 · part 5): small focused demos for /lab/motion.
// "scrub" demos map the panel's scroll LINEARLY (useScrub progress over the whole 220vh panel) onto a paused timeline
// or onto styles set directly. Every demo also has a CSS-only glow loop, so a still scroll never reads as a frozen frame.
// ?static=1 / reduced motion: no animation, a sensible final state.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap } from "@/lib/gsap";
import { scene, useScrub } from "@/components/fx/shared";
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

/* ---------- M406 · Tiles roll through the viewport (variant of M31: each row rolls on X like a drum as it crosses) ---------- */
const M406_ROWS: [string, string, string, number][] = [
  ["Linen shirt", "Linen shorts", "₹2,900", 0],
  ["Field jacket", "Field cap", "₹7,400", 1],
  ["Rope sandal", "Rope belt", "₹1,900", 2],
  ["Canvas tote", "Canvas pouch", "₹1,450", 3],
  ["Wool beanie", "Wool socks", "₹990", 0],
  ["Rain shell", "Rain hat", "₹5,600", 1],
  ["Knit polo", "Knit vest", "₹2,300", 2],
];
function M406() {
  const root = useRef<HTMLDivElement>(null);
  const apply = (p: number) => {
    const el = root.current;
    if (!el) return;
    const col = el.querySelector<HTMLElement>(".m406-col");
    if (!col) return;
    const H = el.clientHeight;
    const CH = col.scrollHeight;
    // the grid scrolls through the stage linearly: first row enters at the bottom, last row leaves at the top
    const y = H * 0.85 - p * (CH + H * 0.7);
    col.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
    // perspective origin follows the stage centre (in column coordinates)
    col.style.perspectiveOrigin = `50% ${(H / 2 - y).toFixed(1)}px`;
    col.querySelectorAll<HTMLElement>(".m406-row").forEach((row) => {
      const cy = y + row.offsetTop + row.offsetHeight / 2;
      const n = gsap.utils.clamp(-1, 1, (cy - H / 2) / (H / 2));
      // below centre: tilted back (+70°), flat at centre, tilted the other way above
      row.style.transform = `rotateX(${(n * 70).toFixed(2)}deg) scale(${(1 - Math.abs(n) * 0.12).toFixed(3)})`;
      row.style.opacity = (1 - Math.max(0, Math.abs(n) - 0.6) * 1.6).toFixed(3);
    });
  };
  useScrub(root, apply, { finalValue: 0.42 });
  return (
    <Frame r={root} bg="#0b0f17">
      <Glow code="m406" color="rgba(79,141,255,.4)" />
      <div className="m406-col absolute left-1/2 top-0 w-[min(76%,980px)] -ml-[min(38%,490px)] will-change-transform" style={{ perspective: "900px" }}>
        {M406_ROWS.map(([t, t2, pr, i], k) => (
          <div key={k} className="m406-row mb-[2.2vh] grid grid-cols-3 gap-[1.2vw] will-change-transform" style={{ transformStyle: "preserve-3d" }}>
            {[0, 1, 2].map((c) => (
              <figure key={c} className="relative h-[24vh] overflow-hidden rounded-[14px] border border-white/10">
                <Img i={(i + c) % 4} w={700} h={460} />
                <figcaption className="absolute bottom-2 left-3 right-3 flex justify-between text-[13px] font-[600] text-white/90" style={{ fontFamily: GROTESK }}>
                  <span>{c === 1 ? t2 : t}</span>
                  <span className="text-white/70">{pr}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        ))}
      </div>
      <p className="pointer-events-none absolute bottom-4 left-5 text-[13px] uppercase tracking-[0.2em] text-white/60">Coastline · summer drop</p>
    </Frame>
  );
}

/* ---------- M407 · Tilted device flattens and climbs over headline (variant of M31) ---------- */
function M407() {
  const root = useRef<HTMLDivElement>(null);
  useScrubTl(root, (tl, el) => {
    const bal = { v: 0 };
    const out = el.querySelector<HTMLElement>(".m407-bal");
    tl.fromTo(".m407-phone", { yPercent: 62, rotationX: 62, scale: 0.86 }, { yPercent: 0, rotationX: 0, scale: 1, duration: 1 }, 0)
      .fromTo(".m407-shadow", { opacity: 0.2, scaleX: 1.4 }, { opacity: 0.6, scaleX: 1, duration: 1 }, 0)
      .fromTo(".m407-head", { scale: 1.06, opacity: 1 }, { scale: 0.96, opacity: 0.55, duration: 1 }, 0)
      .fromTo(
        bal,
        { v: 0 },
        { v: 48250, duration: 0.6, onUpdate: () => void (out && (out.textContent = (Math.round(bal.v / 10) * 10).toLocaleString("en-IN"))) },
        0.4,
      );
  });
  return (
    <Frame r={root} bg="#0d0b14">
      <Glow code="m407" color="rgba(150,120,255,.42)" at="50% 55%" />
      <div className="m407-head pointer-events-none absolute inset-0 grid place-items-center text-center will-change-transform">
        <h3 className="text-[clamp(64px,8.4vw,136px)] font-[800] leading-[0.9] tracking-[-0.04em] text-[#efeaff]" style={{ fontFamily: WIDE }}>
          MONEY,
          <br />
          CALMER.
        </h3>
      </div>
      <div className="absolute inset-0 grid place-items-center" style={{ perspective: "1100px" }}>
        <div className="m407-phone relative h-[86%] aspect-[9/18.5] will-change-transform" style={{ transformOrigin: "50% 100%" }}>
          <div className="m407-shadow absolute -bottom-[4%] left-[8%] right-[8%] h-[6%] rounded-full bg-black/70 blur-xl" aria-hidden />
          <div className="relative h-full w-full rounded-[38px] border-[6px] border-[#2a2638] bg-[#14111d] p-[7%] shadow-[0_30px_80px_rgba(0,0,0,.6)]" style={{ fontFamily: MANROPE }}>
            <div className="mx-auto mb-[8%] h-[3%] w-[32%] rounded-full bg-black/60" />
            <p className="text-[12px] uppercase tracking-[0.16em] text-white/55">Pebl · balance</p>
            <p className="mt-1 text-[clamp(22px,2.2vw,34px)] font-[800] text-white">
              ₹<span className="m407-bal">48,250</span>
            </p>
            <div className="mt-[8%] h-[24%] rounded-[16px] bg-gradient-to-br from-[#8f7bff] via-[#b48cff] to-[#ffb36b] p-[8%]">
              <p className="text-[12px] font-[700] uppercase tracking-[0.14em] text-[#14111d]">Pebl card</p>
              <p className="mt-2 text-[13px] font-[600] text-[#14111d]/80">•••• 4417</p>
            </div>
            {[
              ["Chai corner", "−₹80"],
              ["Salary", "+₹92,000"],
              ["Metro card", "−₹500"],
            ].map(([a, b]) => (
              <div key={a} className="mt-[7%] flex justify-between border-b border-white/10 pb-[5%] text-[13px] text-white/80">
                <span>{a}</span>
                <span className={b.startsWith("+") ? "text-[#9effc8]" : ""}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="pointer-events-none absolute bottom-4 left-5 text-[13px] uppercase tracking-[0.2em] text-white/60">Pebl · free savings account</p>
    </Frame>
  );
}

/* ---------- M408 · Media expands, title splits apart (variant of M28: pinned frame grows to full, title parts to the sides) ---------- */
function M408() {
  const root = useRef<HTMLDivElement>(null);
  useScrubTl(root, (tl, el) => {
    const W = el.clientWidth;
    const H = el.clientHeight;
    const ix = Math.max(0, (W - 400) / 2);
    const iy = Math.max(0, (H - 300) / 2);
    // 0 → 0.7: frame grows from 400×300 (radius 24) to the full stage (radius 0), media zooms, title halves part
    tl.fromTo(".m408-m", { clipPath: `inset(${iy}px ${ix}px ${iy}px ${ix}px round 24px)` }, { clipPath: "inset(0px 0px 0px 0px round 0px)", duration: 0.7 }, 0)
      .fromTo(".m408-img", { scale: 1 }, { scale: 1.14, duration: 1 }, 0)
      .fromTo(".m408-l", { xPercent: 0 }, { xPercent: -150, duration: 0.7 }, 0)
      .fromTo(".m408-r", { xPercent: 0 }, { xPercent: 150, duration: 0.7 }, 0)
      // 0.7 → 1: the hold before release, the caption rises over the full-bleed media
      .fromTo(".m408-cap", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.3 }, 0.7);
  });
  return (
    <Frame r={root} bg="#071019">
      <Glow code="m408" color="rgba(24,196,180,.42)" at="50% 50%" />
      <div className="m408-m absolute inset-0 overflow-hidden will-change-[clip-path]">
        <Img i={0} w={1600} h={1000} className="m408-img will-change-transform" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-[0.3em] text-[clamp(60px,7.4vw,124px)] leading-none text-[#eafffb]" style={{ fontFamily: SERIF, fontWeight: 500 }}>
        <span className="m408-l inline-block will-change-transform">Deep</span>
        <span className="m408-r inline-block italic will-change-transform">blue.</span>
      </div>
      <div className="m408-cap pointer-events-none absolute bottom-[8%] left-[5%] text-[#eafffb]">
        <p className="text-[clamp(28px,2.8vw,44px)] leading-none" style={{ fontFamily: EDITORIAL }}>
          Seven nights on the reef.
        </p>
        <p className="mt-2 text-[14px] text-white/80">Tidewater liveaboard · from ₹1,48,000</p>
      </div>
    </Frame>
  );
}

/* ---------- M409 · Image widens and squares as it enters (variant of M28: no pin, the image grows with its own entry) ---------- */
function M409() {
  const root = useRef<HTMLDivElement>(null);
  const apply = (p: number) => {
    const el = root.current;
    if (!el) return;
    const col = el.querySelector<HTMLElement>(".m409-col");
    const fig = el.querySelector<HTMLElement>(".m409-fig");
    const img = el.querySelector<HTMLElement>(".m409-img");
    if (!col || !fig || !img) return;
    const H = el.clientHeight;
    // the "page" scrolls through the stage linearly (nothing is pinned)
    const y = -p * (col.scrollHeight - H);
    col.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
    // the image's own entry: 0 when its top meets the stage bottom, 1 when its top reaches 20% of the stage
    const top = y + fig.offsetTop;
    const e = clamp01((H - top) / (H * 0.8));
    fig.style.width = `${(62 + 38 * e).toFixed(2)}%`;
    fig.style.borderRadius = `${(40 * (1 - e)).toFixed(1)}px`;
    img.style.transform = `scale(${(1.35 - 0.35 * e).toFixed(3)})`;
  };
  useScrub(root, apply, { finalValue: 0.6 });
  return (
    <Frame r={root} bg="#100c08">
      <Glow code="m409" color="rgba(224,145,63,.42)" at="40% 40%" />
      <div className="m409-col absolute inset-x-0 top-0 will-change-transform">
        <div className="mx-auto w-[min(76%,980px)] pb-[14vh] pt-[10vh]">
          <p className="text-[13px] uppercase tracking-[0.2em] text-white/55">Kiln &amp; Clay · studio notes</p>
          <h3 className="mt-3 max-w-[14ch] text-[clamp(48px,5vw,84px)] leading-[0.95] text-[#fff6e8]" style={{ fontFamily: SERIF, fontWeight: 500 }}>
            Thrown by hand, fired twice.
          </h3>
          <p className="mt-5 max-w-[46ch] text-[16px] leading-relaxed text-white/70" style={{ fontFamily: MANROPE }}>
            Every bowl starts as a 900 g ball of stoneware and spends two days in the kiln. No two glazes land the same.
          </p>
        </div>
        <div className="m409-fig relative mx-auto h-[62vh] overflow-hidden" style={{ width: "100%", borderRadius: 0 }}>
          <Img i={3} w={1600} h={900} className="m409-img will-change-transform" label="KILN" />
        </div>
        <div className="mx-auto flex w-[min(76%,980px)] justify-between pb-[24vh] pt-[6vh] text-[#fff6e8]" style={{ fontFamily: GROTESK }}>
          <p className="text-[clamp(22px,2vw,32px)] font-[600]">Rust bowl set</p>
          <p className="text-[clamp(22px,2vw,32px)] font-[600] text-[#ffd59a]">₹3,600</p>
        </div>
      </div>
      <Glow code="m409b" color="rgba(255,200,140,.32)" at="60% 60%" className="z-10 opacity-[.45] mix-blend-screen" />
    </Frame>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M406", name: "Tiles roll through the viewport", how: "Grid rows cross the stage rolling on X like a drum: tilted back as they enter, flat at the centre, tilted the other way as they leave · scrubbed", kind: "scrub", C: M406 },
  { code: "M407", name: "Tilted device flattens and climbs over headline", how: "A phone lying tilted back flattens (rotateX → 0) and climbs up over the big headline, ending upright in front of it · scrubbed", kind: "scrub", C: M407 },
  { code: "M408", name: "Media expands, title splits apart", how: "A 400×300 rounded media frame grows to full stage (radius → 0, slight zoom) while the title halves part to the sides, then a caption rises · scrubbed", kind: "scrub", C: M408 },
  { code: "M409", name: "Image widens and squares as it enters", how: "Without pinning, an image widens to full width, zooms out inside and loses its corner radius as it scrolls into view · scrubbed", kind: "scrub", C: M409 },
];
