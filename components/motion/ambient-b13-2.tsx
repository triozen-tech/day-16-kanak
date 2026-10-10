"use client";

// Ambient motions, batch 13 · group 2 (MOTION-MENU M662–M663): breathing paragraph lines and an aurora card top.
// Small focused demos for /lab/motion. Both are "play": they start on screen, loop, and pause off screen. Each stage
// has a CSS-only glow loop that never stops. The pointer demo drives a visible fake pointer ring by itself; the real
// mouse takes over while it moves. ?static=1 / reduced motion: no JS motion, CSS loops stop, the markup shows a
// sensible final state (plain paragraph · a CSS aurora behind the card top).
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, SplitText, prefersReducedMotion } from "@/lib/gsap";
import { useTicker } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = {
  sg: "'Space Grotesk Variable', system-ui, sans-serif",
  fr: "'Fraunces Variable', Georgia, serif",
  is: "'Instrument Serif', Georgia, serif",
  sy: "'Syne Variable', 'Space Grotesk Variable', system-ui, sans-serif",
  mr: "'Manrope Variable', system-ui, sans-serif",
};

const CSS = `
.b13g2a-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(255,196,140,.5)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(120,150,255,.22)),transparent 70%);animation:b13g2a-drift 5.6s linear infinite alternate;will-change:transform}
@keyframes b13g2a-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b13g2a-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4);pointer-events:none;z-index:40;opacity:0;transition:opacity .25s}

/* M662 breathing lines */
.m662-p{color:rgba(246,241,234,.62)}
.m662-l{transform-origin:0% 60%;will-change:transform}

/* M663 aurora card fallback (shows under the canvas; the canvas paints over it once running) */
.m663-sky{background:radial-gradient(60% 50% at 30% 78%,rgba(70,255,190,.45),transparent 70%),radial-gradient(50% 45% at 70% 70%,rgba(150,110,255,.4),transparent 70%),radial-gradient(40% 30% at 55% 85%,rgba(255,120,200,.25),transparent 70%),linear-gradient(#050817,#0b1a2e)}
.m663-pulse{animation:m663-pulse 2.6s ease-in-out infinite alternate}
@keyframes m663-pulse{0%{opacity:.55}100%{opacity:1}}

html.is-static .b13g2a-glow,html.is-static .m663-pulse{animation:none}
html.is-static .b13g2a-dot{display:none}
html.is-static {
  .b13g2a-glow,.m663-pulse{animation:none}
  .b13g2a-dot{display:none}
}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", g1, g2, style }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string; style?: CSSProperties }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0b0a10] text-[#f6f1ea] ${className}`} style={style}>
      <style href="b13g2a-css" precedence="default">
        {CSS}
      </style>
      <div className="b13g2a-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/**
 * "play" helper: waits for fonts, builds the looping animation inside a gsap.context, plays it only while on screen,
 * rebuilds after a resize (line splits are measured), reverts on unmount. Nothing runs with prefersReducedMotion().
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

/** The visible fake pointer ring. */
const Dot = ({ r }: { r: RefObject<HTMLDivElement | null> }) => <div ref={r} className="b13g2a-dot" aria-hidden />;

/**
 * Pointer for "pointer" demos: every frame (on screen) it reports a position in root px. The real mouse wins for 2 s after
 * it last moved; otherwise `script(t, w, h)` drives the visible fake ring along a set path.
 */
function usePointer(root: RefObject<HTMLDivElement | null>, dot: RefObject<HTMLDivElement | null>, script: (t: number, w: number, h: number) => [number, number], frame: (x: number, y: number, dt: number, t: number) => void) {
  const real = useRef({ x: 0, y: 0, at: -1e9 });
  const sc = useRef(script);
  sc.current = script;
  const fr = useRef(frame);
  fr.current = frame;
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      real.current = { x: e.clientX - r.left, y: e.clientY - r.top, at: performance.now() };
    };
    el.addEventListener("pointermove", move);
    return () => el.removeEventListener("pointermove", move);
  }, [root]);
  useTicker(root, (t, dt) => {
    const el = root.current;
    if (!el) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    const live = performance.now() - real.current.at < 2000;
    const [x, y] = live ? [real.current.x, real.current.y] : sc.current(t, w, h);
    if (dot.current) {
      dot.current.style.opacity = live ? "0" : "1";
      dot.current.style.transform = `translate3d(${x}px,${y}px,0)`;
    }
    fr.current(x, y, Math.min(dt, 0.05), t);
  });
}

/* ───────────────────────── M662 · Breathing paragraph lines ───────────────────────── */
function M662() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const p = el.querySelector(".m662-p") as HTMLElement;
    const split = SplitText.create(p, { type: "lines", linesClass: "m662-l" });
    // each line lifts, swells and flashes warm, then settles; the lines take turns (phase offset) in an endless yoyo
    return gsap.to(split.lines, {
      y: -10,
      scale: 1.1,
      color: "#ffd2a1",
      duration: 1.15,
      ease: "sine.inOut",
      stagger: { each: 0.42, repeat: -1, yoyo: true },
    });
  });
  return (
    <Stage r={root} g1="rgba(255,176,110,.5)" g2="rgba(120,140,255,.2)">
      <div className="flex h-full w-full items-center px-[8%]">
        <div className="w-[min(72%,980px)]">
          <p className="text-[13px] uppercase tracking-[0.28em] text-[#ffc58f]" style={{ fontFamily: F.mr }}>
            Atelier Marrow · Letter from the studio
          </p>
          <p className="m662-p mt-7 text-[clamp(26px,2.5vw,40px)] leading-[1.32]" style={{ fontFamily: F.fr }}>
            Every throw is woven on a slow loom in the hills, one row of undyed wool at a time. We let the yarn rest between
            passes, so the cloth keeps its breath, its weight and its warmth for the long winters ahead.
          </p>
          <div className="mt-9 flex items-center gap-5 text-[15px] text-white/70" style={{ fontFamily: F.sg }}>
            <span className="rounded-full border border-white/25 px-5 py-2.5">Read the journal</span>
            <span className="tabular-nums">Hill throw · ₹ 6,400</span>
          </div>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M663 · Aurora card top ───────────────────────── */
type Star = { x: number; y: number; z: number; r: number; ph: number; sp: number };
type Ribbon = { base: number; amp: number; f: number; sp: number; ph: number; len: number; col: [number, number, number]; a: number };
const M663_RIB: Ribbon[] = [
  { base: 0.74, amp: 0.07, f: 2.1, sp: 0.55, ph: 0.0, len: 0.5, col: [70, 255, 190], a: 0.55 },
  { base: 0.66, amp: 0.09, f: 1.4, sp: -0.4, ph: 1.7, len: 0.42, col: [140, 110, 255], a: 0.42 },
  { base: 0.82, amp: 0.05, f: 3.0, sp: 0.8, ph: 3.1, len: 0.34, col: [255, 120, 200], a: 0.3 },
];
function M663() {
  const root = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const st = useRef({ lx: 0, ly: 0, stars: [] as Star[], w: 0, h: 0 });
  usePointer(
    root,
    dot,
    // scripted pointer: a slow figure-eight that sweeps across and around the card
    (t, w, h) => [w * (0.5 + 0.3 * Math.sin(t * 0.9)), h * (0.48 + 0.26 * Math.sin(t * 1.8 + 0.6))],
    (px, py, dt, t) => {
      const c = cv.current;
      const k = card.current;
      const r = root.current;
      if (!c || !k || !r) return;
      const s = st.current;
      const cw = c.clientWidth;
      const ch = c.clientHeight;
      if (cw !== s.w || ch !== s.h) {
        s.w = cw;
        s.h = ch;
        c.width = Math.round(cw);
        c.height = Math.round(ch);
        let seed = 7;
        const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
        s.stars = Array.from({ length: 110 }, () => ({ x: rnd() * cw, y: rnd() * ch * 0.8, z: 0.2 + rnd() * 0.8, r: 0.5 + rnd() * 1.3, ph: rnd() * 6.28, sp: 1 + rnd() * 2.5 }));
      }
      // lean target: pointer relative to the card top centre, -1..1 (clamped a little past the edges)
      const kr = k.getBoundingClientRect();
      const rr = r.getBoundingClientRect();
      const tx = gsap.utils.clamp(-1.3, 1.3, (px - (kr.left - rr.left + kr.width / 2)) / (kr.width / 2));
      const ty = gsap.utils.clamp(-1.3, 1.3, (py - (kr.top - rr.top + ch / 2)) / (ch / 2 + 60));
      const e = Math.min(1, dt * 3.5);
      s.lx += (tx - s.lx) * e;
      s.ly += (ty - s.ly) * e;
      const g = c.getContext("2d");
      if (!g) return;
      const sky = g.createLinearGradient(0, 0, 0, ch);
      sky.addColorStop(0, "#040714");
      sky.addColorStop(1, "#0b1a2e");
      g.globalCompositeOperation = "source-over";
      g.fillStyle = sky;
      g.fillRect(0, 0, cw, ch);
      // stars drift toward the pointer by depth and twinkle
      for (const p of s.stars) {
        const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * p.sp + p.ph));
        g.globalAlpha = a * p.z;
        g.fillStyle = "#eaf2ff";
        g.beginPath();
        g.arc(p.x + s.lx * p.z * 22, p.y + s.ly * p.z * 10, p.r, 0, 6.283);
        g.fill();
      }
      g.globalAlpha = 1;
      g.globalCompositeOperation = "lighter";
      // aurora curtains: a waving bottom edge, rays rising from it that lean toward the pointer
      for (const rb of M663_RIB) {
        const step = 8;
        const lean = s.lx * ch * 0.32;
        const ys: number[] = [];
        for (let x = -step; x <= cw + step * 2; x += step) {
          const u = x / cw;
          ys.push(ch * (rb.base + s.ly * 0.04 + rb.amp * Math.sin(u * rb.f * 6.283 + t * rb.sp + rb.ph) + rb.amp * 0.4 * Math.sin(u * 13 + t * 1.3 + rb.ph)));
        }
        const top = ch * (rb.base - rb.len);
        const grad = g.createLinearGradient(0, top, 0, ch * (rb.base + rb.amp));
        const [cr, cg, cb] = rb.col;
        grad.addColorStop(0, `rgba(${cr},${cg},${cb},0)`);
        grad.addColorStop(0.75, `rgba(${cr},${cg},${cb},${rb.a * 0.55})`);
        grad.addColorStop(1, `rgba(${cr},${cg},${cb},${rb.a})`);
        g.fillStyle = grad;
        g.beginPath();
        let i = 0;
        for (let x = -step; x <= cw + step * 2; x += step) {
          const y = ys[i++];
          const flick = 0.82 + 0.18 * Math.sin(x * 0.07 + t * 3 + rb.ph);
          const yt = y - ch * rb.len * flick;
          if (x === -step) g.moveTo(x + lean, yt);
          else g.lineTo(x + lean * ((y - yt) / (ch * rb.len)), yt);
        }
        for (let x = cw + step * 2, j = ys.length - 1; x >= -step; x -= step, j--) g.lineTo(x, ys[j]);
        g.closePath();
        g.fill();
        // bright hem along the wave
        g.strokeStyle = `rgba(${cr},${cg},${cb},${rb.a * 0.9})`;
        g.lineWidth = 2;
        g.beginPath();
        i = 0;
        for (let x = -step; x <= cw + step * 2; x += step) {
          if (i === 0) g.moveTo(x, ys[i]);
          else g.lineTo(x, ys[i]);
          i++;
        }
        g.stroke();
      }
      g.globalCompositeOperation = "source-over";
      // fade the canvas into the card body
      const fade = g.createLinearGradient(0, ch * 0.82, 0, ch);
      fade.addColorStop(0, "rgba(14,16,26,0)");
      fade.addColorStop(1, "rgba(14,16,26,1)");
      g.fillStyle = fade;
      g.fillRect(0, ch * 0.82, cw, ch * 0.18);
    },
  );
  return (
    <Stage r={root} g1="rgba(70,230,180,.5)" g2="rgba(150,110,255,.25)">
      <div className="flex h-full w-full items-center justify-center">
        <div ref={card} className="relative h-[86%] w-[min(40%,540px)] overflow-hidden rounded-[26px] border border-white/15 bg-[#0e101a] shadow-[0_40px_120px_rgba(0,0,0,.55)]">
          <div className="relative h-[60%] w-full overflow-hidden">
            <div className="m663-sky m663-pulse absolute inset-0" aria-hidden />
            <canvas ref={cv} className="absolute inset-0 h-full w-full" aria-hidden />
            <span className="absolute left-5 top-5 rounded-full bg-black/40 px-3.5 py-1.5 text-[12px] uppercase tracking-[0.22em] text-white/80" style={{ fontFamily: F.mr }}>
              Polar edition
            </span>
          </div>
          <div className="px-7 pb-7 pt-3">
            <p className="text-[12px] uppercase tracking-[0.24em] text-[#7ff0c8]" style={{ fontFamily: F.mr }}>
              Northlight Goods · Wool
            </p>
            <h3 className="mt-2 text-[clamp(28px,2.4vw,38px)] leading-[1.02]" style={{ fontFamily: F.fr }}>
              Aurora night throw
            </h3>
            <p className="mt-2 text-[14px] text-white/60" style={{ fontFamily: F.mr }}>
              Merino and alpaca, woven in sky-green and dusk violet.
            </p>
            <div className="mt-4 flex items-center justify-between" style={{ fontFamily: F.sg }}>
              <span className="text-[22px] tabular-nums">₹ 7,250</span>
              <span className="rounded-full bg-[#7ff0c8] px-5 py-2.5 text-[14px] font-[600] text-[#06140f]">Add to bag</span>
            </div>
          </div>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M662", name: "Breathing paragraph lines", how: "Each line of a split paragraph lifts, swells and flashes warm in turn, in an endless slow alternating loop", kind: "play", C: M662 },
  { code: "M663", name: "Aurora card top", how: "A card top paints aurora curtains and twinkling stars that lean toward the pointer (canvas, scripted pointer)", kind: "play", C: M663 },
];
