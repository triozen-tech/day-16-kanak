"use client";

// MOTION-MENU M692–M696 (text group, batch 15 · part 4): small focused demos for /lab/motion.
// "play" demos start when on screen and loop (paused off screen); the "scrub" demo maps the panel scroll linearly.
// Every demo also has a CSS-only glow loop, so a still moment never reads as a frozen frame.
// ?static=1 / reduced motion: no animation, the markup shows a sensible final state. Motion ideas only, rebuilt from scratch.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { useScrub, useTicker } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const GROTESK = "'Space Grotesk Variable', system-ui, sans-serif";
const SERIF = "'Fraunces Variable', Georgia, serif";
const EDITORIAL = "'Instrument Serif', Georgia, serif";
const WIDE = "'Syne Variable', 'Space Grotesk Variable', system-ui, sans-serif";
const MANROPE = "'Manrope Variable', system-ui, sans-serif";
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};
/** Deterministic 0..1 noise per integer (same on server and client, so no hydration mismatch). */
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/* ---------- shared helpers (local copies) ---------- */

const CSS = `
.b15t4-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 38%,var(--g1,rgba(255,163,92,.5)),transparent 70%),radial-gradient(34% 40% at 70% 66%,var(--g2,rgba(79,141,255,.24)),transparent 70%);animation:b15t4-drift 5.2s linear infinite alternate;will-change:transform}
.b15t4-top{mix-blend-mode:screen;opacity:.45;z-index:30}
@keyframes b15t4-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
html.is-static .b15t4-glow{animation:none}
html.is-static {.b15t4-glow{animation:none}}
`;

/** Demo frame: dark rounded panel + the CSS-only glow loop. `top` adds a second glow over the content (covered stages). */
function Stage({ r, children, bg = "#090b14", g1, g2, top = false }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; bg?: string; g1?: string; g2?: string; top?: boolean }) {
  const vars = { "--g1": g1, "--g2": g2 } as CSSProperties;
  return (
    <div ref={r} className="relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 text-[#f3efe8]" style={{ background: bg }}>
      <style href="b15t4-css" precedence="default">
        {CSS}
      </style>
      <div className="b15t4-glow" style={vars} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
      {top && <div className="b15t4-glow b15t4-top" style={vars} aria-hidden />}
    </div>
  );
}

/** Scoped keyframes for one demo; `stop` lists its animated selectors so they stop in ?static=1 / reduced motion. */
function Css({ css, stop }: { css: string; stop: string }) {
  return <style>{`${css}\nhtml.is-static ${stop.split(",").join(",html.is-static ")}{animation:none!important}\nhtml.is-static {${stop}{animation:none!important}}`}</style>;
}

/** "play" helper: builds the looping timeline the first time the stage is on screen (after fonts), pauses it off screen. */
function usePlay(ref: RefObject<HTMLElement | null>, build: (el: HTMLElement) => gsap.core.Animation | void) {
  const b = useRef(build);
  b.current = build;
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let ctx: gsap.Context | null = null;
    let anim: gsap.core.Animation | void;
    let on = false;
    let dead = false;
    const start = () => {
      if (ctx || dead) return;
      ctx = gsap.context(() => {
        anim = b.current(el);
      }, el);
      if (!on) anim?.pause();
    };
    const io = new IntersectionObserver(([e]) => {
      on = e.isIntersecting;
      if (on) {
        if (!ctx) (document.fonts?.ready ?? Promise.resolve()).then(start);
        else anim?.resume();
      } else anim?.pause();
    });
    io.observe(el);
    return () => {
      dead = true;
      io.disconnect();
      ctx?.revert();
    };
  }, [ref]);
}

/* ---------- M692 · Moving hatched shadow text (variant of M49: the offset shadow is a sliding 45° hatch) ---------- */
function M692() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const io = new IntersectionObserver(([e]) => el.classList.toggle("m692-on", e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const hatch = (c: string, s: number) =>
    `linear-gradient(45deg,transparent 0 25%,${c} 25% 50%,transparent 50% 75%,${c} 75% 100%) 0 0/${s}px ${s}px`;
  const css = `.m692-sh{position:absolute;left:0;top:0;pointer-events:none;color:transparent;-webkit-background-clip:text;background-clip:text;animation:m692-slide .9s linear infinite;animation-play-state:paused}
.m692-sh.m692-a{background:${hatch("#e9b872", 10)};-webkit-background-clip:text;background-clip:text;transform:translate(.055em,.055em)}
.m692-sh.m692-b{background:${hatch("#e9b872", 6)};-webkit-background-clip:text;background-clip:text;transform:translate(.07em,.07em);animation-duration:.7s}
.m692-on .m692-sh{animation-play-state:running}
@keyframes m692-slide{0%{background-position:0 0}100%{background-position:var(--t) var(--t)}}`;
  return (
    <Stage r={root} bg="#0d0b09" g1="rgba(233,184,114,.5)" g2="rgba(120,90,255,.2)">
      <Css css={css} stop=".m692-sh" />
      <div className="flex h-full flex-col items-center justify-center text-center">
        <p className="text-[13px] uppercase tracking-[0.3em] text-white/55" style={{ fontFamily: GROTESK }}>
          Fine engraving · Atelier Morrow
        </p>
        <h3 className="relative mt-4 leading-[0.9]" style={{ fontFamily: SERIF, fontWeight: 800, fontSize: "clamp(80px,11vw,170px)", letterSpacing: "-0.03em" }}>
          <span className="m692-sh m692-a" style={{ "--t": "10px" } as CSSProperties} aria-hidden>
            Heirloom
          </span>
          <span className="relative">Heirloom</span>
        </h3>
        <p className="relative mt-6 text-[clamp(22px,2.2vw,34px)] italic" style={{ fontFamily: EDITORIAL }}>
          <span className="m692-sh m692-b" style={{ "--t": "6px" } as CSSProperties} aria-hidden>
            Hand-cut signet rings from ₹18,400
          </span>
          <span className="relative">Hand-cut signet rings from ₹18,400</span>
        </p>
      </div>
    </Stage>
  );
}

/* ---------- M693 · Organism seeks wordmark (variant of M45: a viscous particle blob crawls letter to letter) ---------- */
const M693_WORD = "VELORA".split("");
const M693_N = 64;
function M693() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const sim = useRef<{
    ready: boolean;
    w: number;
    h: number;
    x: Float32Array;
    y: Float32Array;
    vx: Float32Array;
    vy: Float32Array;
    lit: number[];
    target: number;
    scatter: number;
    centers: { x: number; y: number }[];
  } | null>(null);
  useEffect(() => {
    const el = root.current;
    const c = cv.current;
    if (!el || !c || prefersReducedMotion()) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      c.width = Math.max(1, Math.round(r.width));
      c.height = Math.max(1, Math.round(r.height));
      const s = sim.current;
      if (!s) return;
      s.w = c.width;
      s.h = c.height;
      s.centers = [...el.querySelectorAll<HTMLElement>(".m693-l")].map((l) => {
        const b = l.getBoundingClientRect();
        return { x: b.left - r.left + b.width / 2, y: b.top - r.top + b.height * 0.55 };
      });
    };
    let ro: ResizeObserver | null = null;
    // the simulation is only set up once the stage is near the viewport
    const near = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || sim.current) return;
        near.disconnect();
        const s = {
          ready: false,
          w: 1,
          h: 1,
          x: new Float32Array(M693_N),
          y: new Float32Array(M693_N),
          vx: new Float32Array(M693_N),
          vy: new Float32Array(M693_N),
          lit: M693_WORD.map(() => 1),
          target: 0,
          scatter: 0,
          centers: [] as { x: number; y: number }[],
        };
        sim.current = s;
        (document.fonts?.ready ?? Promise.resolve()).then(() => {
          measure();
          for (let i = 0; i < M693_N; i++) {
            s.x[i] = s.w * 0.08 + hash(i) * 60;
            s.y[i] = s.h * 0.82 + hash(i + 99) * 40;
          }
          s.ready = true;
          ro = new ResizeObserver(measure);
          ro.observe(el);
        });
      },
      { rootMargin: "900px 0px" },
    );
    near.observe(el);
    return () => {
      near.disconnect();
      ro?.disconnect();
      sim.current = null;
      c.width = c.height = 1;
    };
  }, []);
  useTicker(root, (t, dtRaw) => {
    const s = sim.current;
    const c = cv.current;
    const el = root.current;
    if (!s || !s.ready || !c || !el || !s.centers.length) return;
    const dt = Math.min(dtRaw, 0.04);
    const k = dt * 60;
    // centroid
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < M693_N; i++) {
      cx += s.x[i];
      cy += s.y[i];
    }
    cx /= M693_N;
    cy /= M693_N;
    const T = s.centers[s.target];
    s.scatter = Math.max(0, s.scatter - dt);
    const seeking = s.scatter <= 0;
    if (seeking && Math.hypot(T.x - cx, T.y - cy) < 34) {
      s.lit[s.target] = 1;
      if (s.target === M693_WORD.length - 1) {
        // the blob breaks apart at the end of the word, then reconnects and heads back to the first letter
        s.scatter = 0.75;
        for (let i = 0; i < M693_N; i++) {
          const a = hash(i * 7 + Math.floor(t)) * Math.PI * 2;
          s.vx[i] += Math.cos(a) * 9;
          s.vy[i] += Math.sin(a) * 9;
        }
        s.target = 0;
      } else s.target++;
    }
    const pull = seeking ? 0.0011 : 0.00015;
    const coh = seeking ? 0.006 : 0.0012;
    for (let i = 0; i < M693_N; i++) {
      // each particle leans to the target with a little wobble (pseudopods), keeps to the body, repels close neighbours
      const wob = Math.sin(t * 2.3 + i * 1.7) * 26;
      let ax = (T.x + wob - s.x[i]) * pull + (cx - s.x[i]) * coh;
      let ay = (T.y + Math.cos(t * 1.9 + i) * 18 - s.y[i]) * pull + (cy - s.y[i]) * coh;
      for (let j = 0; j < M693_N; j++) {
        if (j === i) continue;
        const dx = s.x[i] - s.x[j];
        const dy = s.y[i] - s.y[j];
        const d2 = dx * dx + dy * dy;
        if (d2 < 196 && d2 > 0.01) {
          const f = (196 - d2) / 196 / Math.sqrt(d2);
          ax += dx * f * 0.35;
          ay += dy * f * 0.35;
        }
      }
      s.vx[i] = (s.vx[i] + ax * k) * Math.pow(0.9, k);
      s.vy[i] = (s.vy[i] + ay * k) * Math.pow(0.9, k);
      const sp = Math.hypot(s.vx[i], s.vy[i]);
      const max = seeking ? 3.2 : 9;
      if (sp > max) {
        s.vx[i] *= max / sp;
        s.vy[i] *= max / sp;
      }
      s.x[i] += s.vx[i] * k;
      s.y[i] += s.vy[i] * k;
    }
    // letters dim slowly once lit, so the word keeps changing
    el.querySelectorAll<HTMLElement>(".m693-on").forEach((l, i) => {
      s.lit[i] = Math.max(0.0, s.lit[i] - dt * 0.28);
      l.style.opacity = s.lit[i].toFixed(3);
    });
    const x = c.getContext("2d");
    if (!x) return;
    x.clearRect(0, 0, s.w, s.h);
    // viscous strands between close cells
    x.lineCap = "round";
    for (let i = 0; i < M693_N; i++)
      for (let j = i + 1; j < M693_N; j++) {
        const d = Math.hypot(s.x[i] - s.x[j], s.y[i] - s.y[j]);
        if (d < 46) {
          x.strokeStyle = `rgba(150,255,190,${((1 - d / 46) * 0.5).toFixed(3)})`;
          x.lineWidth = (1 - d / 46) * 9;
          x.beginPath();
          x.moveTo(s.x[i], s.y[i]);
          x.lineTo(s.x[j], s.y[j]);
          x.stroke();
        }
      }
    x.globalCompositeOperation = "lighter";
    for (let i = 0; i < M693_N; i++) {
      const r = 16 + hash(i) * 8;
      const g = x.createRadialGradient(s.x[i], s.y[i], 0, s.x[i], s.y[i], r);
      g.addColorStop(0, "rgba(200,255,170,.55)");
      g.addColorStop(0.5, "rgba(60,220,150,.22)");
      g.addColorStop(1, "rgba(20,120,90,0)");
      x.fillStyle = g;
      x.beginPath();
      x.arc(s.x[i], s.y[i], r, 0, Math.PI * 2);
      x.fill();
    }
    x.globalCompositeOperation = "source-over";
  });
  return (
    <Stage r={root} bg="#050c0a" g1="rgba(40,210,140,.5)" g2="rgba(160,255,120,.2)" top>
      <canvas ref={cv} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />
      <div className="relative z-10 flex h-full flex-col items-center justify-center">
        <p className="text-[13px] uppercase tracking-[0.3em] text-white/50" style={{ fontFamily: GROTESK }}>
          Living materials lab
        </p>
        <h3 className="mt-5 flex leading-none" style={{ fontFamily: WIDE, fontWeight: 800, fontSize: "clamp(70px,9vw,140px)", letterSpacing: "0.04em" }} aria-label="Velora">
          {M693_WORD.map((ch, i) => (
            <span key={i} className="m693-l relative inline-block text-white/15" aria-hidden>
              {ch}
              <span className="m693-on absolute inset-0 text-[#d6ffc4]" style={{ textShadow: "0 0 24px rgba(90,255,170,.85),0 0 60px rgba(40,200,140,.5)" }}>
                {ch}
              </span>
            </span>
          ))}
        </h3>
        <p className="mt-6 text-[15px] text-white/60" style={{ fontFamily: MANROPE }}>
          Mycelium packaging · grown in 7 days
        </p>
      </div>
    </Stage>
  );
}

/* ---------- M694 · Pill-flicker typer (variant of M22: each char flickers pill → accent → outline → plain) ---------- */
const M694_LINES = [
  ["Signals,", "not"],
  ["noise."],
];
function M694() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const chars = [...el.querySelectorAll<HTMLElement>(".m694-c")];
    const FG = "#f4f1ea";
    const ACC = "#7cf0c8";
    const BG = "#0a0d16";
    gsap.set(chars, { opacity: 0 });
    const tl = gsap.timeline({ repeat: -1 });
    const st = 0.045;
    chars.forEach((c, i) => {
      const t0 = i * st;
      tl.set(c, { opacity: 1, backgroundColor: FG, color: "rgba(0,0,0,0)", borderColor: FG }, t0)
        .set(c, { backgroundColor: ACC, color: BG, borderColor: ACC }, t0 + 0.07)
        .set(c, { backgroundColor: "rgba(0,0,0,0)", color: ACC, borderColor: ACC }, t0 + 0.14)
        .set(c, { color: FG, borderColor: "rgba(0,0,0,0)" }, t0 + 0.21);
    });
    const inEnd = (chars.length - 1) * st + 0.21;
    // hold 0.25 s, then flicker out (outline, then gone) from the end and type again
    const outStart = inEnd + 0.25;
    chars
      .slice()
      .reverse()
      .forEach((c, i) => {
        const t0 = outStart + i * 0.022;
        tl.set(c, { color: ACC, borderColor: ACC }, t0).set(c, { opacity: 0, borderColor: "rgba(0,0,0,0)" }, t0 + 0.06);
      });
    tl.to({}, { duration: 0.12 });
    const caret = el.querySelector<HTMLElement>(".m694-caret");
    if (caret) gsap.to(caret, { opacity: 0.15, duration: 0.35, repeat: -1, yoyo: true, ease: "none" });
    return tl;
  });
  const css = `.m694-c{display:inline-block;padding:0 .045em;margin:0 .01em;border:2px solid transparent;border-radius:.18em}`;
  return (
    <Stage r={root} bg="#0a0d16" g1="rgba(124,240,200,.5)" g2="rgba(120,140,255,.22)">
      <style>{css}</style>
      <div className="flex h-full flex-col justify-center px-[8%]">
        <p className="text-[13px] uppercase tracking-[0.3em] text-white/55" style={{ fontFamily: GROTESK }}>
          Quiet analytics · Halcyon Data
        </p>
        <h3 className="mt-5 leading-[1.02]" style={{ fontFamily: GROTESK, fontWeight: 700, fontSize: "clamp(64px,8.4vw,132px)", letterSpacing: "-0.03em" }} aria-label="Signals, not noise.">
          {M694_LINES.map((words, li) => (
            <span key={li} className="block" aria-hidden>
              {words.map((w, wi) => (
                <span key={wi} className={`inline-block whitespace-nowrap ${wi < words.length - 1 ? "mr-[0.28em]" : ""}`}>
                  {w.split("").map((ch, ci) => (
                    <span key={ci} className="m694-c">
                      {ch}
                    </span>
                  ))}
                </span>
              ))}
              {li === M694_LINES.length - 1 && <span className="m694-caret ml-[0.08em] inline-block h-[0.8em] w-[0.08em] translate-y-[0.08em] bg-[#7cf0c8]" />}
            </span>
          ))}
        </h3>
        <p className="mt-7 max-w-[520px] text-[17px] leading-relaxed text-white/65" style={{ fontFamily: MANROPE }}>
          One weekly brief instead of forty dashboards. Plans from ₹2,400 a month.
        </p>
      </div>
    </Stage>
  );
}

/* ---------- M695 · Scroll burn manifesto (variant of M57: blocks scale toward you, RGB-split, burn from the middle out) ---------- */
const M695_BLOCKS = ["We make fewer things, and make them to last.", "No seasons. No noise. Only the work.", "Built slowly, worn for decades."];
function M695() {
  const root = useRef<HTMLDivElement>(null);
  const apply = (p: number) => {
    const el = root.current;
    if (!el) return;
    el.querySelectorAll<HTMLElement>(".m695-b").forEach((b, k) => {
      const local = clamp01(p * 3 - k);
      const show = k === 0 ? local < 1 : local > 0 && local < 1;
      b.style.visibility = show ? "visible" : "hidden";
      if (!show) return;
      const enter = k === 0 ? 1 : smooth(local / 0.1);
      b.style.opacity = enter.toFixed(3);
      b.style.transform = `scale(${lerp(0.8, 1.32, local).toFixed(4)})`;
      const o = (local * 11).toFixed(2);
      b.style.textShadow = `${o}px 0 rgba(255,40,90,${(0.15 + local * 0.6).toFixed(3)}),-${o}px 0 rgba(40,220,255,${(0.15 + local * 0.6).toFixed(3)})`;
      b.querySelectorAll<HTMLElement>(".m695-c").forEach((c) => {
        const d = Number(c.dataset.d);
        const q = clamp01((local - (0.2 + d * 0.62)) / 0.12);
        if (q <= 0) {
          c.style.opacity = "1";
          c.style.color = "";
          c.style.transform = "";
          return;
        }
        // ember: white → orange → gone, lifting and shrinking a little
        const r = 255;
        const g = Math.round(lerp(244, 110, clamp01(q * 2)));
        const bl = Math.round(lerp(234, 30, clamp01(q * 2)));
        c.style.color = `rgb(${r},${g},${bl})`;
        c.style.opacity = (1 - smooth(q)).toFixed(3);
        c.style.transform = `translate3d(0,${(-q * 0.35).toFixed(3)}em,0) scale(${(1 - q * 0.45).toFixed(3)})`;
      });
    });
  };
  useScrub(root, apply, { finalValue: 0 });
  const css = `.m695-ember{animation:m695-ember 1.6s ease-in-out infinite alternate}
@keyframes m695-ember{0%{opacity:.35;transform:scaleY(.9)}100%{opacity:.8;transform:scaleY(1.15)}}`;
  return (
    <Stage r={root} bg="#0b0807" g1="rgba(255,110,50,.5)" g2="rgba(60,200,255,.18)">
      <Css css={css} stop=".m695-ember" />
      <div className="m695-ember pointer-events-none absolute inset-x-0 bottom-0 h-[40%] origin-bottom" style={{ background: "radial-gradient(60% 100% at 50% 100%,rgba(255,96,30,.35),transparent 70%)" }} aria-hidden />
      <p className="absolute left-[6%] top-[8%] text-[13px] uppercase tracking-[0.3em] text-white/50" style={{ fontFamily: GROTESK }}>
        Manifesto · Ashgrove Workwear
      </p>
      <div className="absolute inset-0 grid place-items-center">
        {M695_BLOCKS.map((txt, k) => {
          const words = txt.split(" ");
          const n = txt.replace(/ /g, "").length;
          let ci = 0;
          return (
            <p
              key={k}
              className="m695-b col-start-1 row-start-1 max-w-[16ch] text-center leading-[1.04]"
              style={{ fontFamily: SERIF, fontWeight: 500, fontSize: "clamp(44px,4.8vw,78px)", color: "#fff4ea", visibility: k === 0 ? "visible" : "hidden", transform: "scale(0.8)", willChange: "transform" }}
            >
              {words.map((w, wi) => (
                <span key={wi} className={`inline-block whitespace-nowrap ${wi < words.length - 1 ? "mr-[0.26em]" : ""}`}>
                  {w.split("").map((ch, j) => {
                    const d = Math.abs(ci++ - (n - 1) / 2) / ((n - 1) / 2);
                    return (
                      <span key={j} className="m695-c inline-block" data-d={d.toFixed(3)}>
                        {ch}
                      </span>
                    );
                  })}
                </span>
              ))}
            </p>
          );
        })}
      </div>
      <p className="absolute bottom-[8%] right-[6%] text-[14px] text-white/55" style={{ fontFamily: MANROPE }}>
        Chore jackets from ₹7,800
      </p>
    </Stage>
  );
}

/* ---------- M696 · Speed-lines word cover (variant of M49: light streaks through a boxed word that shakes on hover) ---------- */
const M696_LINES = 22;
const M696_SPARKS = [
  [-4, -18],
  [22, -26],
  [58, -22],
  [96, -14],
  [104, 108],
  [70, 124],
  [30, 120],
  [-6, 104],
];
function M696() {
  const root = useRef<HTMLDivElement>(null);
  const st = useRef({ h: 0, real: false, lastMove: -10, t: 0 });
  useEffect(() => {
    const el = root.current;
    const box = el?.querySelector<HTMLElement>(".m696-box");
    if (!el || !box) return;
    const enter = () => (st.current.real = true);
    const leave = () => (st.current.real = false);
    const move = () => (st.current.lastMove = st.current.t);
    box.addEventListener("pointerenter", enter);
    box.addEventListener("pointerleave", leave);
    el.addEventListener("pointermove", move);
    return () => {
      box.removeEventListener("pointerenter", enter);
      box.removeEventListener("pointerleave", leave);
      el.removeEventListener("pointermove", move);
    };
  }, []);
  useTicker(root, (t, dtRaw) => {
    const el = root.current;
    if (!el) return;
    const s = st.current;
    s.t = t;
    const dt = Math.min(dtRaw, 0.05);
    const box = el.querySelector<HTMLElement>(".m696-box");
    const ptr = el.querySelector<HTMLElement>(".m696-ptr");
    if (!box || !ptr) return;
    const R = el.getBoundingClientRect();
    const B = box.getBoundingClientRect();
    const bx = B.left - R.left + B.width * 0.55;
    const by = B.top - R.top + B.height * 0.6;
    const rx = R.width * 0.82;
    const ry = R.height * 0.82;
    // fake pointer: glide in (0.45 s) → hover (1.2 s) → glide out (0.45 s) → rest (0.3 s, the streaks keep moving)
    const user = t - s.lastMove < 3;
    const f = t % 2.4;
    let px = rx;
    let py = ry;
    let auto = false;
    if (f < 0.45) {
      const e = smooth(f / 0.45);
      px = lerp(rx, bx, e);
      py = lerp(ry, by, e);
    } else if (f < 1.65) {
      px = bx + Math.sin(t * 3) * 6;
      py = by + Math.cos(t * 2.4) * 4;
      auto = true;
    } else if (f < 2.1) {
      const e = smooth((f - 1.65) / 0.45);
      px = lerp(bx, rx, e);
      py = lerp(by, ry, e);
    }
    ptr.style.opacity = user ? "0" : "1";
    ptr.style.transform = `translate3d(${px.toFixed(1)}px,${py.toFixed(1)}px,0)`;
    const hover = user ? s.real : auto;
    s.h += ((hover ? 1 : 0) - s.h) * Math.min(1, dt * 7);
    const h = s.h;
    // streaks: slow drift at rest, warp speed on hover
    const W = B.width;
    el.querySelectorAll<HTMLElement>(".m696-line").forEach((l, i) => {
      const sp = 0.25 + hash(i) * 0.5;
      const base = (hash(i + 40) + t * sp * lerp(0.35, 2.6, h)) % 1.5;
      l.style.transform = `translate3d(${((base - 0.45) * W).toFixed(1)}px,0,0) scaleX(${lerp(0.6, 1.8, h).toFixed(3)})`;
      l.style.opacity = lerp(0.25, 0.95, h).toFixed(3);
    });
    const word = el.querySelector<HTMLElement>(".m696-word");
    if (word) {
      const a = 2.6 * h;
      const jx = (hash(Math.floor(t * 40)) - 0.5) * 2 * a;
      const jy = (hash(Math.floor(t * 40) + 7) - 0.5) * 2 * a;
      word.style.transform = `translate3d(${jx.toFixed(2)}px,${jy.toFixed(2)}px,0) scale(${(1 + 0.05 * h).toFixed(4)})`;
    }
    const lit = el.querySelector<HTMLElement>(".m696-lit");
    if (lit) lit.style.opacity = h.toFixed(3);
    el.querySelectorAll<HTMLElement>(".m696-spark").forEach((sp, i) => {
      const pulse = 0.5 + 0.5 * Math.sin(t * 9 + i * 1.9);
      const v = h * pulse;
      sp.style.opacity = v.toFixed(3);
      sp.style.transform = `scale(${(0.3 + v * 0.9).toFixed(3)}) rotate(${(t * 90 + i * 40).toFixed(1)}deg)`;
    });
  });
  return (
    <Stage r={root} bg="#070a14" g1="rgba(90,150,255,.5)" g2="rgba(190,120,255,.22)">
      <div className="flex h-full flex-col items-center justify-center text-center">
        <p className="text-[13px] uppercase tracking-[0.3em] text-white/55" style={{ fontFamily: GROTESK }}>
          Edge hosting · Northwind Cloud
        </p>
        <h3 className="mt-5 leading-[1.05]" style={{ fontFamily: GROTESK, fontWeight: 700, fontSize: "clamp(56px,6.4vw,104px)", letterSpacing: "-0.03em" }}>
          <span className="block">Deploy worldwide</span>
          <span className="mt-[0.1em] inline-flex items-center">
            <span className="mr-[0.28em]">at</span>
            <span className="m696-box relative inline-block overflow-visible rounded-[0.16em]" data-cursor="Warp">
              <span className="absolute inset-0 overflow-hidden rounded-[0.16em] border border-white/15 bg-[linear-gradient(180deg,#121a36,#0b1024)]">
                {Array.from({ length: M696_LINES }, (_, i) => (
                  <span
                    key={i}
                    className="m696-line absolute left-0 h-[2px] w-[34%] origin-left"
                    style={{
                      top: `${(4 + (i / (M696_LINES - 1)) * 92).toFixed(1)}%`,
                      background: `linear-gradient(90deg,transparent,${i % 3 === 0 ? "#b9d4ff" : i % 3 === 1 ? "#8fb6ff" : "#d6b8ff"},transparent)`,
                      transform: `translate3d(${((hash(i + 40) - 0.45) * 100).toFixed(1)}%,0,0)`,
                      opacity: 0.3,
                    }}
                  />
                ))}
              </span>
              <span className="m696-lit pointer-events-none absolute inset-0 rounded-[0.16em] shadow-[0_0_40px_rgba(120,170,255,.55),inset_0_0_30px_rgba(140,180,255,.35)]" style={{ opacity: 0 }} aria-hidden />
              <span className="m696-word relative inline-block px-[0.22em] py-[0.04em] text-white">warp speed</span>
              {M696_SPARKS.map(([x, y], i) => (
                <svg key={i} className="m696-spark pointer-events-none absolute h-[18px] w-[18px]" style={{ left: `${x}%`, top: `${y}%`, opacity: 0 }} viewBox="0 0 20 20" aria-hidden>
                  <path d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z" fill="#e6efff" />
                </svg>
              ))}
            </span>
          </span>
        </h3>
        <p className="mt-7 text-[16px] text-white/60" style={{ fontFamily: MANROPE }}>
          38 regions · from ₹1,900 a month
        </p>
      </div>
      <span className="m696-ptr pointer-events-none absolute left-0 top-0 z-20 -ml-[9px] -mt-[9px] h-[18px] w-[18px] rounded-full border-2 border-white bg-white/25 shadow-[0_0_14px_rgba(255,255,255,.6)]" aria-hidden />
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M692", name: "Moving hatched shadow text", how: "A word casts a 45° hatched shadow offset down-right; the stripes slide forever like a moving engraving · loops on screen", kind: "play", C: M692 },
  { code: "M693", name: "Organism seeks wordmark", how: "A viscous particle blob crawls letter to letter, lighting each one, then breaks apart and reconnects · canvas, continuous", kind: "play", C: M693 },
  { code: "M694", name: "Pill-flicker typer", how: "Each character flickers through a filled pill, an accent fill and an outline before settling as plain text, staggered · loops", kind: "play", C: M694 },
  { code: "M695", name: "Scroll burn manifesto", how: "Scroll: manifesto blocks scale toward you, pick up an RGB split and burn away glyph by glyph from the middle outward", kind: "scrub", C: M695 },
  { code: "M696", name: "Speed-lines word cover", how: "Hover (auto pointer): light streaks race through the word's box, the word shakes and scales and sparkles pop", kind: "play", C: M696 },
];
