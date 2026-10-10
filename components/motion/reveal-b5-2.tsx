"use client";

// MOTION-MENU M223–M229 (reveal group, batch 5 · group 2): small focused demos for /lab/motion.
// "scrub" demos map the panel's scroll LINEARLY onto a paused timeline / frame index (useScrub over the whole panel).
// "play" demos start when on screen, loop (holds ≤ 0.25 s), and pause off screen. Every demo also has a CSS-only glow
// loop (and a second one on top, screen-blended, where images cover the stage). ?static=1 / reduced motion: final state.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, loadPlugin, prefersReducedMotion } from "@/lib/gsap";
import { scene, useScrub } from "@/components/fx/shared";
import type { Flip as FlipT } from "gsap/Flip";
import type { MotionDef } from "./types";

const GROTESK = "'Space Grotesk Variable', system-ui, sans-serif";
const SERIF = "'Fraunces Variable', Georgia, serif";
const EDITORIAL = "'Instrument Serif', Georgia, serif";
const WIDE = "'Syne Variable', 'Space Grotesk Variable', system-ui, sans-serif";
const MANROPE = "'Manrope Variable', system-ui, sans-serif";

/* ---------- shared helpers (local copies) ---------- */

/** A soft radial glow that drifts forever (CSS only, scoped to one code), stopped in ?static=1 / reduced motion. */
function Glow({ code, color, at = "50% 45%", className = "", style }: { code: string; color: string; at?: string; className?: string; style?: CSSProperties }) {
  const c = `${code}-glow`;
  const css = `.${c}{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(circle at ${at},${color} 0%,transparent 52%);animation:${c} 4.6s linear infinite alternate;will-change:transform}
@keyframes ${c}{0%{transform:translate3d(-9%,-5%,0) scale(1)}100%{transform:translate3d(9%,6%,0) scale(1.18)}}
html.is-static .${c}{animation:none}html.is-static {.${c}{animation:none}}`;
  return (
    <>
      <style>{css}</style>
      <div className={`${c} ${className}`} style={style} aria-hidden />
    </>
  );
}
/** The same glow again ON TOP of a covered stage (screen blend), so the recording never freezes. */
const TopGlow = ({ code, color, at }: { code: string; color: string; at?: string }) => (
  <Glow code={`${code}t`} color={color} at={at} className="z-30" style={{ mixBlendMode: "screen", opacity: 0.45 }} />
);

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

/** Play: a looping timeline that starts when the demo is on screen and pauses off screen. Reduced motion → nothing runs
 *  (the markup already shows the final state). `wait` (optional) is awaited first, e.g. a lazy plugin. */
function usePlay(root: RefObject<HTMLDivElement | null>, build: (el: HTMLDivElement, onClean: (fn: () => void) => void) => gsap.core.Timeline, wait?: () => Promise<unknown>) {
  const fn = useRef(build);
  fn.current = build;
  const w = useRef(wait);
  w.current = wait;
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    let dead = false;
    let on = false;
    let tl: gsap.core.Timeline | null = null;
    const cleans: (() => void)[] = [];
    const ctx = gsap.context(() => {}, el);
    const sync = () => (on ? tl?.play() : tl?.pause());
    const io = new IntersectionObserver(
      ([e]) => {
        on = e.isIntersecting;
        sync();
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    Promise.all([document.fonts?.ready, w.current?.()]).then(() => {
      if (dead) return;
      ctx.add(() => {
        tl = fn.current(el, (f) => cleans.push(f));
      });
      tl?.pause();
      sync();
    });
    return () => {
      dead = true;
      io.disconnect();
      cleans.forEach((f) => f());
      ctx.revert();
    };
  }, [root]);
}

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, className = "", style, label = "", w = 1400, h = 900 }: { i: number; className?: string; style?: CSSProperties; label?: string; w?: number; h?: number }) => <img src={scene(i, w, h, label)} alt="" className={`h-full w-full object-cover ${className}`} style={style} draggable={false} />;

const Frame = ({ r, bg, children }: { r: RefObject<HTMLDivElement | null>; bg: string; children: ReactNode }) => (
  <div ref={r} className="relative h-full w-full overflow-hidden rounded-[24px]" style={{ background: bg }}>
    {children}
  </div>
);

/* ---------- M223 · Activity rings fill (variant of M26: three concentric arcs to values, staggered) ---------- */
const M223_RINGS = [
  { r: 128, v: 0.82, c: "#ff3d6e", n: "Move", val: "482 / 590 kcal" },
  { r: 98, v: 0.64, c: "#a6ff4d", n: "Train", val: "29 / 45 min" },
  { r: 68, v: 0.93, c: "#35d6ff", n: "Stand", val: "11 / 12 hrs" },
];
function M223() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, () =>
    gsap
      .timeline({ repeat: -1 })
      .fromTo(".m223-arc", { strokeDashoffset: 1 }, { strokeDashoffset: (i: number) => 1 - M223_RINGS[i].v, duration: 1.15, ease: "power2.out", stagger: 0.18 })
      .fromTo(".m223-row", { opacity: 0.35, x: -10 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.18, ease: "power2.out" }, 0)
      .to(".m223-arc", { strokeDashoffset: 1, duration: 0.45, ease: "power2.in", stagger: 0.05 }, "+=0.2")
      .to(".m223-row", { opacity: 0.35, duration: 0.45 }, "<"),
  );
  return (
    <Frame r={root} bg="#07080d">
      <Glow code="m223" color="rgba(255,61,110,.45)" at="35% 50%" />
      <div className="absolute inset-0 flex items-center justify-center gap-[7vw]">
        <svg viewBox="0 0 300 300" className="h-[80%] w-auto -rotate-90" aria-hidden>
          {M223_RINGS.map((g) => (
            <g key={g.n}>
              <circle cx="150" cy="150" r={g.r} fill="none" stroke={g.c} strokeOpacity=".16" strokeWidth="24" />
              <circle className="m223-arc" cx="150" cy="150" r={g.r} fill="none" stroke={g.c} strokeWidth="24" strokeLinecap="round" pathLength={1} strokeDasharray="1 2" strokeDashoffset={1 - g.v} />
            </g>
          ))}
        </svg>
        <div>
          <p className="text-[13px] uppercase tracking-[0.22em] text-white/55" style={{ fontFamily: GROTESK }}>
            Pulsewell · today
          </p>
          <p className="mt-3 text-[clamp(38px,4vw,64px)] leading-[0.95] text-white" style={{ fontFamily: EDITORIAL }}>
            Close every ring.
          </p>
          <div className="mt-7 flex flex-col gap-4">
            {M223_RINGS.map((g) => (
              <div key={g.n} className="m223-row flex items-baseline gap-4">
                <span className="h-3 w-3 rounded-full" style={{ background: g.c }} />
                <span className="w-[5.5em] text-[18px] font-[600] text-white" style={{ fontFamily: GROTESK }}>
                  {g.n}
                </span>
                <span className="text-[18px]" style={{ fontFamily: GROTESK, color: g.c }}>
                  {g.val}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Frame>
  );
}

/* ---------- M224 · Ring fill with centre counter (variant of M223: one ring + the number counting with it) ---------- */
const M224_VALUE = 87;
function M224() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const num = el.querySelector<HTMLElement>(".m224-num")!;
    const o = { v: 0 };
    const write = () => (num.textContent = String(Math.round(o.v)));
    return gsap
      .timeline({ repeat: -1 })
      .fromTo(".m224-arc", { strokeDashoffset: 1 }, { strokeDashoffset: 1 - M224_VALUE / 100, duration: 1.5, ease: "power2.out" })
      .fromTo(o, { v: 0 }, { v: M224_VALUE, duration: 1.5, ease: "power2.out", onUpdate: write }, 0)
      .to(".m224-arc", { strokeDashoffset: 1, duration: 0.45, ease: "power2.in" }, "+=0.2")
      .to(o, { v: 0, duration: 0.45, ease: "power2.in", onUpdate: write }, "<");
  });
  return (
    <Frame r={root} bg="#071210">
      <Glow code="m224" color="rgba(24,196,143,.5)" at="50% 50%" />
      <div className="absolute inset-0 flex items-center justify-center gap-[6vw]">
        <div className="relative h-[82%] aspect-square">
          <svg viewBox="0 0 300 300" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
            <defs>
              <linearGradient id="m224-g" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="#c8ff8a" />
                <stop offset="1" stopColor="#18c48f" />
              </linearGradient>
            </defs>
            <circle cx="150" cy="150" r="126" fill="none" stroke="#18c48f" strokeOpacity=".14" strokeWidth="18" />
            <circle className="m224-arc" cx="150" cy="150" r="126" fill="none" stroke="url(#m224-g)" strokeWidth="18" strokeLinecap="round" pathLength={1} strokeDasharray="1 2" strokeDashoffset={1 - M224_VALUE / 100} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="leading-none text-white" style={{ fontFamily: WIDE, fontWeight: 800, fontSize: "clamp(72px,8vw,128px)", fontVariantNumeric: "tabular-nums" }}>
              <span className="m224-num">{M224_VALUE}</span>
              <span className="text-[0.4em] text-[#c8ff8a]">%</span>
            </p>
            <p className="mt-2 text-[13px] uppercase tracking-[0.22em] text-white/55" style={{ fontFamily: GROTESK }}>
              on-time harvest
            </p>
          </div>
        </div>
        <div className="max-w-[min(34%,420px)]">
          <p className="text-[13px] uppercase tracking-[0.22em] text-white/55" style={{ fontFamily: GROTESK }}>
            Greenrow Farms · season report
          </p>
          <p className="mt-3 text-[clamp(36px,3.8vw,60px)] leading-[0.98] text-white" style={{ fontFamily: SERIF, fontWeight: 500 }}>
            Picked when it’s ready.
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-white/60" style={{ fontFamily: MANROPE }}>
            Weekly veg boxes from ₹649, cut the morning they ship.
          </p>
        </div>
      </div>
    </Frame>
  );
}

/* ---------- M225 · Bar chart grow (variant of M26: bars scale up from the baseline in a stagger) ---------- */
const M225_BARS = [
  { m: "Jan", v: 0.42 },
  { m: "Feb", v: 0.55 },
  { m: "Mar", v: 0.5 },
  { m: "Apr", v: 0.68 },
  { m: "May", v: 0.61 },
  { m: "Jun", v: 0.79 },
  { m: "Jul", v: 0.74 },
  { m: "Aug", v: 0.9 },
  { m: "Sep", v: 1 },
];
function M225() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, () =>
    gsap
      .timeline({ repeat: -1 })
      .fromTo(".m225-bar", { scaleY: 0 }, { scaleY: 1, duration: 0.75, ease: "power3.out", stagger: 0.07 })
      .fromTo(".m225-val", { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.07 }, 0.3)
      .to(".m225-val", { opacity: 0, duration: 0.2 }, "+=0.15")
      .to(".m225-bar", { scaleY: 0, duration: 0.35, ease: "power2.in", stagger: { each: 0.03, from: "end" } }, "<"),
  );
  return (
    <Frame r={root} bg="#100c07">
      <Glow code="m225" color="rgba(224,145,63,.5)" at="60% 70%" />
      <div className="absolute inset-0 flex flex-col px-[6%] pb-[6%] pt-[5%]">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[13px] uppercase tracking-[0.22em] text-white/55" style={{ fontFamily: GROTESK }}>
              Kiln & Clay · orders 2026
            </p>
            <p className="mt-2 text-[clamp(32px,3.4vw,54px)] leading-none text-white" style={{ fontFamily: SERIF, fontWeight: 500 }}>
              Nine months, up 2.4×
            </p>
          </div>
          <p className="text-[15px] text-white/60" style={{ fontFamily: GROTESK }}>
            avg basket ₹2,380
          </p>
        </div>
        <div className="mt-[4%] flex min-h-0 flex-1 items-end gap-[1.6vw] border-b border-white/20">
          {M225_BARS.map((b, i) => (
            <div key={b.m} className="flex h-full flex-1 flex-col justify-end">
              <div className="relative flex flex-col justify-end" style={{ height: `${b.v * 88}%` }}>
                <p className="m225-val absolute -top-7 left-0 right-0 text-center text-[13px] text-white/75" style={{ fontFamily: GROTESK }}>
                  {Math.round(b.v * 1240)}
                </p>
                <div className="m225-bar h-full w-full origin-bottom rounded-t-[10px]" style={{ background: i === M225_BARS.length - 1 ? "#ffb36b" : "linear-gradient(180deg,#e0913f,#6b3d14)" }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-[1.6vw]">
          {M225_BARS.map((b) => (
            <p key={b.m} className="flex-1 text-center text-[13px] uppercase tracking-[0.14em] text-white/50" style={{ fontFamily: GROTESK }}>
              {b.m}
            </p>
          ))}
        </div>
      </div>
    </Frame>
  );
}

/* ---------- M226 · Stepped still-frame scroll (variant of M27: held stills that cut, not a smooth video) ---------- */
const M226_FRAMES = [
  { i: 0, s: 1.0, x: 0, y: 0, cap: "Wide · the ridge at dawn" },
  { i: 0, s: 1.35, x: -12, y: 4, cap: "Closer · the trail turns" },
  { i: 3, s: 1.1, x: 6, y: -2, cap: "Warm · first light on stone" },
  { i: 3, s: 1.55, x: 10, y: 6, cap: "Detail · boots on granite" },
  { i: 2, s: 1.2, x: -6, y: -4, cap: "Summit · the cairn" },
];
function M226() {
  const root = useRef<HTMLDivElement>(null);
  const last = M226_FRAMES.length - 1;
  useScrub(root, (p) => {
    const el = root.current;
    if (!el) return;
    const k = Math.min(last, Math.floor(p * M226_FRAMES.length));
    el.querySelectorAll<HTMLElement>(".m226-f").forEach((f, i) => (f.style.visibility = i === k ? "visible" : "hidden"));
    const n = el.querySelector(".m226-n");
    if (n) n.textContent = String(k + 1).padStart(2, "0");
    const c = el.querySelector(".m226-cap");
    if (c) c.textContent = M226_FRAMES[k].cap;
    el.querySelectorAll<HTMLElement>(".m226-tick").forEach((t, i) => (t.style.opacity = i <= k ? "1" : ".25"));
    const bar = el.querySelector<HTMLElement>(".m226-bar");
    if (bar) bar.style.transform = `scaleX(${p.toFixed(4)})`;
  });
  return (
    <Frame r={root} bg="#05070d">
      <Glow code="m226" color="rgba(79,141,255,.45)" />
      {M226_FRAMES.map((f, i) => (
        <div key={i} className="m226-f absolute inset-0" style={{ visibility: i === last ? "visible" : "hidden" }}>
          <Img i={f.i} w={1600} h={900} style={{ transform: `scale(${f.s}) translate(${f.x}%,${f.y}%)` }} />
        </div>
      ))}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
      <TopGlow code="m226" color="rgba(79,141,255,.5)" at="40% 40%" />
      <div className="absolute left-[5%] top-[7%] z-40">
        <p className="text-[13px] uppercase tracking-[0.22em] text-white/70" style={{ fontFamily: GROTESK }}>
          Northfold Outfitters · field notes
        </p>
        <p className="mt-2 text-[clamp(40px,4.6vw,76px)] leading-[0.92] text-white" style={{ fontFamily: EDITORIAL }}>
          Five stills, one climb.
        </p>
      </div>
      <div className="absolute inset-x-[5%] bottom-[7%] z-40 flex items-end justify-between gap-8">
        <p className="m226-cap text-[18px] text-white/85" style={{ fontFamily: GROTESK }}>
          {M226_FRAMES[last].cap}
        </p>
        <div className="flex flex-col items-end gap-3">
          <p className="text-white" style={{ fontFamily: WIDE, fontWeight: 800, fontSize: "clamp(40px,4vw,64px)", lineHeight: 1 }}>
            <span className="m226-n">{String(M226_FRAMES.length).padStart(2, "0")}</span>
            <span className="text-[0.45em] text-white/50"> / {String(M226_FRAMES.length).padStart(2, "0")}</span>
          </p>
          <div className="flex gap-2">
            {M226_FRAMES.map((_, i) => (
              <span key={i} className="m226-tick h-[6px] w-10 rounded-full bg-white" />
            ))}
          </div>
          <div className="h-[2px] w-[min(320px,30vw)] bg-white/20">
            <div className="m226-bar h-full w-full origin-left bg-[#4f8dff]" />
          </div>
        </div>
      </div>
    </Frame>
  );
}

/* ---------- M227 · Video thumbnail opens to player (variant of M28: Flip from the thumbnail, 3 entry styles) ---------- */
const M227_STYLES = ["Morph from thumbnail", "Slide up", "Zoom from centre"];
const M227_CSS = `
.m227-pulse{position:absolute;inset:-14px;border-radius:999px;border:2px solid rgba(255,255,255,.7);animation:m227-pulse 1.4s ease-out infinite}
@keyframes m227-pulse{0%{transform:scale(.8);opacity:.9}100%{transform:scale(1.5);opacity:0}}
.m227-prog{animation:m227-prog 3.2s linear infinite}
@keyframes m227-prog{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.m227-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;pointer-events:none;z-index:50}
.m227-dot>span{display:block;width:100%;height:100%;border-radius:50%;border:2px solid #fff;background:rgba(255,255,255,.2);box-shadow:0 4px 14px rgba(0,0,0,.45)}
.m227-media.big .m227-play{opacity:0}
.m227-media:not(.big) .m227-ui{opacity:0}
html.is-static .m227-pulse,html.is-static .m227-prog{animation:none}
html.is-static .m227-dot{display:none}
html.is-static {.m227-pulse,.m227-prog{animation:none}.m227-dot{display:none}}
`;
function M227() {
  const root = useRef<HTMLDivElement>(null);
  const api = useRef<{ open: (s: number) => void; close: () => void; isOpen: () => boolean }>({ open: () => {}, close: () => {}, isOpen: () => false });
  const flip = useRef<typeof FlipT | null>(null);
  usePlay(
    root,
    (el, onClean) => {
      const Flip = flip.current!;
      const media = el.querySelector<HTMLElement>(".m227-media")!;
      const thumb = el.querySelector<HTMLElement>(".m227-thumb")!;
      const big = el.querySelector<HTMLElement>(".m227-big")!;
      const label = el.querySelector<HTMLElement>(".m227-style")!;
      const shade = el.querySelector<HTMLElement>(".m227-shade")!;
      const d = el.querySelector<HTMLElement>(".m227-dot")!;
      let open = false;
      const anims: gsap.core.Animation[] = [];
      const keep = (a: gsap.core.Animation) => (anims.push(a), a);
      const doOpen = (s: number) => {
        if (open) return;
        open = true;
        label.textContent = M227_STYLES[s];
        const state = Flip.getState(media);
        big.appendChild(media);
        media.classList.add("big");
        keep(gsap.to(shade, { opacity: 1, duration: 0.5 }));
        if (s === 0) keep(Flip.from(state, { duration: 0.8, ease: "power3.inOut", absolute: true }));
        else if (s === 1) keep(gsap.fromTo(media, { yPercent: 110, opacity: 0.4 }, { yPercent: 0, opacity: 1, duration: 0.75, ease: "power3.out" }));
        else keep(gsap.fromTo(media, { scale: 0.25, opacity: 0, borderRadius: "40px" }, { scale: 1, opacity: 1, borderRadius: "18px", duration: 0.7, ease: "power3.out" }));
      };
      const doClose = () => {
        if (!open) return;
        open = false;
        const state = Flip.getState(media);
        thumb.appendChild(media);
        media.classList.remove("big");
        keep(gsap.to(shade, { opacity: 0, duration: 0.4 }));
        keep(Flip.from(state, { duration: 0.6, ease: "power3.inOut", absolute: true }));
      };
      api.current = { open: doOpen, close: doClose, isOpen: () => open };
      // React owns the media node inside the thumbnail: put it back (and stop stray tweens) before unmount / revert
      onClean(() => {
        anims.forEach((a) => a.kill());
        if (media.parentElement !== thumb) thumb.appendChild(media);
        media.classList.remove("big");
        api.current = { open: () => {}, close: () => {}, isOpen: () => false };
      });
      const tl = gsap.timeline({ repeat: -1 });
      const playPt = () => {
        const b = rel(el.querySelector(".m227-play")!, el);
        return { x: b.l + b.w / 2, y: b.t + b.h / 2 };
      };
      tl.add(() => {
        if (open) doClose();
      }, 0);
      M227_STYLES.forEach((_, s) => {
        tl.to(d, { x: () => playPt().x, y: () => playPt().y, duration: 0.5, ease: "power2.inOut" })
          .to(d.firstElementChild, { scale: 0.6, duration: 0.1, yoyo: true, repeat: 1 })
          .add(() => doOpen(s), "<0.1")
          // the pointer drifts to the player's close button while the clip "plays"
          .to(d, { x: () => rel(big, el).l + rel(big, el).w - 34, y: () => rel(big, el).t + 34, duration: 0.9, ease: "sine.inOut" }, "+=0.15")
          .to(d.firstElementChild, { scale: 0.6, duration: 0.1, yoyo: true, repeat: 1 })
          .add(() => doClose(), "<0.1")
          .to(d, { x: "-=60", y: "+=40", duration: 0.5, ease: "sine.inOut" });
      });
      gsap.set(d, { x: el.clientWidth * 0.4, y: el.clientHeight * 0.8 });
      return tl;
    },
    () => loadPlugin("Flip").then((f) => (flip.current = f as typeof FlipT)),
  );
  return (
    <Frame r={root} bg="#0a0712">
      <style>{M227_CSS}</style>
      <Glow code="m227" color="rgba(166,108,255,.5)" at="30% 50%" />
      <div className="absolute inset-0 flex items-center gap-[5vw] px-[6%]">
        <div className="max-w-[min(36%,440px)]">
          <p className="text-[13px] uppercase tracking-[0.22em] text-white/55" style={{ fontFamily: GROTESK }}>
            Loomhouse · the making-of
          </p>
          <p className="mt-3 text-[clamp(38px,4vw,64px)] leading-[0.95] text-white" style={{ fontFamily: SERIF, fontWeight: 500 }}>
            Watch one rug, start to finish.
          </p>
          <p className="mt-4 text-[15px] text-white/60" style={{ fontFamily: MANROPE }}>
            Hand-knotted wool from ₹38,000 · 2 min film
          </p>
          <p className="mt-6 text-[13px] uppercase tracking-[0.2em] text-[#c9a6ff]" style={{ fontFamily: GROTESK }}>
            Entry · <span className="m227-style">{M227_STYLES[0]}</span>
          </p>
        </div>
        <div className="m227-thumb relative ml-auto aspect-video w-[30%]">
          <div className="m227-media relative h-full w-full overflow-hidden rounded-[18px] shadow-[0_30px_60px_rgba(0,0,0,.5)]" data-cursor="Play">
            <Img i={3} w={1280} h={720} />
            <button
              type="button"
              aria-label="Play film"
              onClick={() => (api.current.isOpen() ? api.current.close() : api.current.open(0))}
              className="m227-play absolute left-1/2 top-1/2 -ml-8 -mt-8 grid h-16 w-16 place-items-center rounded-full bg-white/90 transition-opacity"
            >
              <span className="m227-pulse" aria-hidden />
              <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6" fill="#120a1c" aria-hidden>
                <path d="M7 4.5v15l12.5-7.5z" />
              </svg>
            </button>
            <div className="m227-ui absolute inset-x-0 bottom-0 p-5 transition-opacity">
              <div className="flex items-center justify-between text-[13px] text-white/85" style={{ fontFamily: GROTESK }}>
                <span>From fleece to floor</span>
                <span>02:04</span>
              </div>
              <div className="mt-2 h-[3px] bg-white/25">
                <div className="m227-prog h-full origin-left bg-[#c9a6ff]" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="m227-shade pointer-events-none absolute inset-0 z-10 bg-black/60 opacity-0" />
      <div className="m227-big pointer-events-none absolute inset-x-[12%] inset-y-[8%] z-20 [&>*]:pointer-events-auto" />
      <TopGlow code="m227" color="rgba(166,108,255,.45)" at="60% 50%" />
      <div className="m227-dot" aria-hidden>
        <span />
      </div>
    </Frame>
  );
}
function rel(node: Element, root: Element) {
  const a = node.getBoundingClientRect();
  const r = root.getBoundingClientRect();
  return { l: a.left - r.left, t: a.top - r.top, w: a.width, h: a.height };
}

/* ---------- M228 · Full-screen panels pinned in turn (variant of M29: the covered panel scales to .9 + darkens) ---------- */
const M228_PANELS = [
  { i: 0, k: "01", t: "Harbour Line", s: "Ferry identity · 2026", c: "#9fd8ff" },
  { i: 1, k: "02", t: "Saffron Hall", s: "Restaurant launch film", c: "#ffb36b" },
  { i: 2, k: "03", t: "Greenrow", s: "Farm-box packaging", c: "#c8ff8a" },
  { i: 3, k: "04", t: "Copperleaf", s: "Coffee roaster campaign", c: "#ffd59a" },
];
function M228() {
  const root = useRef<HTMLDivElement>(null);
  useScrubTl(root, (tl, el) => {
    const panels = gsap.utils.toArray<HTMLElement>(".m228-p", el);
    panels.forEach((p, k) => {
      if (k === 0) return;
      const prev = panels[k - 1];
      const at = k - 1;
      gsap.set(p, { y: 0, yPercent: 100 }); // the markup's translateY(100%) becomes yPercent (never px + percent)
      tl.fromTo(p, { yPercent: 100 }, { yPercent: 0, duration: 1 }, at)
        .fromTo(p.querySelector(".m228-img"), { yPercent: -14 }, { yPercent: 0, duration: 1 }, at)
        .fromTo(prev, { scale: 1 }, { scale: 0.9, duration: 1 }, at)
        .fromTo(prev.querySelector(".m228-shade"), { opacity: 0 }, { opacity: 0.7, duration: 1 }, at)
        .fromTo(prev.querySelector(".m228-img"), { yPercent: 0 }, { yPercent: 12, duration: 1 }, at);
    });
  });
  return (
    <Frame r={root} bg="#05070d">
      <Glow code="m228" color="rgba(79,141,255,.45)" />
      {M228_PANELS.map((p, k) => (
        <div key={p.k} className="m228-p absolute inset-0 overflow-hidden rounded-[24px] will-change-transform" style={{ zIndex: k + 1, transform: k === 0 ? undefined : "translateY(100%)" }}>
          <div className="m228-img absolute inset-[-14%_0]">
            <Img i={p.i} w={1600} h={1100} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute bottom-[8%] left-[5%] right-[5%] flex items-end justify-between">
            <div>
              <p className="text-[13px] uppercase tracking-[0.22em]" style={{ fontFamily: GROTESK, color: p.c }}>
                Case {p.k} · {p.s}
              </p>
              <p className="mt-2 text-[clamp(52px,6vw,96px)] leading-[0.9] text-white" style={{ fontFamily: WIDE, fontWeight: 800, letterSpacing: "-0.03em" }}>
                {p.t}
              </p>
            </div>
            <p className="text-white/80" style={{ fontFamily: GROTESK, fontSize: "clamp(28px,2.6vw,40px)" }}>
              {p.k}
              <span className="text-white/40"> / 04</span>
            </p>
          </div>
          <div className="m228-shade pointer-events-none absolute inset-0 bg-black opacity-0" />
        </div>
      ))}
      <TopGlow code="m228" color="rgba(79,141,255,.5)" at="55% 40%" />
    </Frame>
  );
}

/* ---------- M229 · Flip-in from edge (variant of M31: 80° rotation around top / bottom / left / right / diagonal axis) ---------- */
const M229_DIRS: { d: string; from: gsap.TweenVars; i: number; t: string; p: string }[] = [
  { d: "Top", from: { rotationX: -80, transformOrigin: "50% 0%" }, i: 0, t: "Tide", p: "₹1,450" },
  { d: "Bottom", from: { rotationX: 80, transformOrigin: "50% 100%" }, i: 1, t: "Ember", p: "₹1,690" },
  { d: "Left", from: { rotationY: 80, transformOrigin: "0% 50%" }, i: 2, t: "Moss", p: "₹1,520" },
  { d: "Right", from: { rotationY: -80, transformOrigin: "100% 50%" }, i: 3, t: "Amber", p: "₹1,780" },
  { d: "Diagonal", from: { rotationX: -60, rotationY: 60, transformOrigin: "0% 0%" }, i: 0, t: "Dusk", p: "₹1,990" },
];
function M229() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const cards = gsap.utils.toArray<HTMLElement>(".m229-c", el);
    const tl = gsap.timeline({ repeat: -1 });
    cards.forEach((c, k) => {
      tl.fromTo(c, { ...M229_DIRS[k].from, opacity: 0 }, { rotationX: 0, rotationY: 0, opacity: 1, duration: 0.5, ease: "power2.out" }, k * 0.14);
    });
    tl.to(cards, { opacity: 0, y: -16, duration: 0.3, ease: "power2.in", stagger: 0.04 }, "+=0.2").set(cards, { y: 0 });
    return tl;
  });
  return (
    <Frame r={root} bg="#0b0910">
      <Glow code="m229" color="rgba(255,122,89,.45)" at="50% 60%" />
      <div className="absolute inset-0 flex flex-col justify-center px-[5%]">
        <p className="text-[13px] uppercase tracking-[0.22em] text-white/55" style={{ fontFamily: GROTESK }}>
          Wick & Wane · candle notes
        </p>
        <p className="mt-2 text-[clamp(36px,3.8vw,60px)] leading-none text-white" style={{ fontFamily: EDITORIAL }}>
          Five scents, five entrances.
        </p>
        <div className="mt-[5vh] grid grid-cols-5 gap-[1.8vw]">
          {M229_DIRS.map((c) => (
            <div key={c.d} className="[perspective:900px]">
              <div className="m229-c overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.05] will-change-transform">
                <div className="aspect-[4/5]">
                  <Img i={c.i} w={500} h={620} />
                </div>
                <div className="flex items-baseline justify-between px-4 py-3">
                  <p className="text-[18px] font-[600] text-white" style={{ fontFamily: GROTESK }}>
                    {c.t}
                  </p>
                  <p className="text-[14px] text-white/60">{c.p}</p>
                </div>
              </div>
              <p className="mt-3 text-center text-[12px] uppercase tracking-[0.24em] text-[#ffb36b]" style={{ fontFamily: GROTESK }}>
                from {c.d}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
}

export const DEFS: MotionDef[] = [
  {
    code: "M223",
    name: "Activity rings fill",
    how: "Three concentric rings draw their arcs to their values in a stagger (stroke-dashoffset, ease out), then drain and refill.",
    kind: "play",
    C: M223,
  },
  {
    code: "M224",
    name: "Ring fill with centre counter",
    how: "One ring stroke draws from 0 to 87% while the number in its centre counts up with it.",
    kind: "play",
    C: M224,
  },
  {
    code: "M225",
    name: "Bar chart grow",
    how: "Bars grow from the baseline to their heights in a stagger (scaleY from bottom) and their values pop in above.",
    kind: "play",
    C: M225,
  },
  {
    code: "M226",
    name: "Stepped still-frame scroll",
    how: "Scroll steps the hero through five held still frames with hard cuts (not smooth video); the counter and ticks step with it.",
    kind: "scrub",
    C: M226,
  },
  {
    code: "M227",
    name: "Video thumbnail opens to player",
    how: "A pulsing play button on a poster; a click (auto here) opens the player from the thumbnail: Flip morph, slide up or zoom, then it closes back.",
    kind: "play",
    C: M227,
  },
  {
    code: "M228",
    name: "Full-screen panels pinned in turn",
    how: "Each panel holds while the next slides over it; the covered one scales to 0.9 and darkens, its image parallaxing inside. Scroll-scrubbed.",
    kind: "scrub",
    C: M228,
  },
  {
    code: "M229",
    name: "Flip-in from edge",
    how: "Cards rotate in from 80° around a top, bottom, left, right or diagonal axis with a fade (~0.5 s each), then reset and repeat.",
    kind: "play",
    C: M229,
  },
];
