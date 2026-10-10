"use client";

// Text motions, batch 15 · group 2 (MOTION-MENU M670–M679). Small focused demos for /lab/motion, rebuilt in GSAP / CSS /
// canvas 2D / OGL from the idea only. Every demo plays by itself while on screen, loops, pauses off screen, has a CSS glow
// loop that never stops (plus one ON TOP where a canvas covers the stage), and shows a sensible final state in ?static=1 /
// reduced motion. WebGL demos create their context only near the viewport (dpr 1) and release it on unmount.
import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, SplitText, prefersReducedMotion } from "@/lib/gsap";
import { createShader, type GLHandle } from "@/lib/gl";
import { useTicker } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const GROTESK = "'Space Grotesk Variable', system-ui, sans-serif";
const SERIF = "'Fraunces Variable', Georgia, serif";
const EDITORIAL = "'Instrument Serif', Georgia, serif";
const WIDE = "'Syne Variable', 'Space Grotesk Variable', system-ui, sans-serif";
const BODY = "'Manrope Variable', system-ui, sans-serif";
const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

const CSS = `
.b15t2-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 32% 38%,var(--g1,rgba(255,163,92,.55)),transparent 70%),radial-gradient(34% 40% at 70% 66%,var(--g2,rgba(79,141,255,.24)),transparent 70%);animation:b15t2-drift 5.6s linear infinite alternate;will-change:transform}
.b15t2-top{mix-blend-mode:screen;opacity:.45;z-index:30}
@keyframes b15t2-drift{0%{transform:translate3d(-7%,-5%,0) scale(1)}100%{transform:translate3d(7%,6%,0) scale(1.15)}}
.b15t2-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4);pointer-events:none;z-index:40;opacity:0}
.b15t2-cv{position:absolute;inset:0;width:100%;height:100%;opacity:0;transition:opacity .5s ease}
.m675-d{display:inline-block;width:.5em;height:.5em;margin:0 .07em;vertical-align:.04em;transform-style:preserve-3d;animation:m675-spin 2.4s linear infinite}
.m675-face{position:absolute;inset:0;transform:rotate(45deg);border-radius:.06em;background:linear-gradient(135deg,#fff6d8 0%,#ffc35a 38%,#ff7a3d 70%,#b8325a 100%);box-shadow:0 0 .25em rgba(255,170,80,.55)}
.m675-face::after{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(105deg,transparent 30%,rgba(255,255,255,.75) 46%,transparent 60%);background-size:260% 100%;animation:m675-shine 1.6s linear infinite}
@keyframes m675-spin{0%{transform:perspective(600px) rotateY(0deg) rotateZ(0deg)}100%{transform:perspective(600px) rotateY(360deg) rotateZ(180deg)}}
@keyframes m675-shine{0%{background-position:120% 0}100%{background-position:-120% 0}}
.m675-off .m675-d,.m675-off .m675-face::after{animation-play-state:paused}
html.is-static .b15t2-glow,html.is-static .m675-d,html.is-static .m675-face::after{animation:none}
html.is-static {.b15t2-glow,.m675-d,.m675-face::after{animation:none}}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). `top` adds a second glow over the content. */
function Stage({ r, children, bg = "#0a0f1c", g1, g2, top = false }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; bg?: string; g1?: string; g2?: string; top?: boolean }) {
  const vars = { "--g1": g1, "--g2": g2 } as CSSProperties;
  return (
    <div ref={r} className="relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 text-[#eaf5ff]" style={{ background: bg }}>
      <style href="b15t2-css" precedence="default">
        {CSS}
      </style>
      <div className="b15t2-glow" style={vars} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
      {top && <div className="b15t2-glow b15t2-top" style={vars} aria-hidden />}
    </div>
  );
}

/** Play: waits for fonts, builds a looping animation in a gsap.context, plays it only while on screen. */
function usePlay(root: RefObject<HTMLElement | null>, build: (el: HTMLElement) => gsap.core.Animation) {
  const fn = useRef(build);
  fn.current = build;
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    let a: gsap.core.Animation | null = null;
    let on = false;
    let dead = false;
    const ctx = gsap.context(() => {}, el);
    const io = new IntersectionObserver(
      ([e]) => {
        on = e.isIntersecting;
        if (on) a?.play();
        else a?.pause();
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    Promise.resolve(document.fonts?.ready).then(() => {
      if (dead) return;
      ctx.add(() => {
        a = fn.current(el);
        if (on) a.play();
        else a.pause();
      });
    });
    return () => {
      dead = true;
      io.disconnect();
      ctx.revert();
    };
  }, [root]);
}

/** True once the element is within ~1 screen of the viewport (WebGL / big canvases build nothing before that). */
function useNear(ref: RefObject<HTMLElement | null>) {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "900px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return near;
}

/** A 2D canvas sized to its parent (dpr capped); returns the context and CSS size, re-sizing when the box changes. */
function fitCanvas(cv: HTMLCanvasElement, maxDpr = 1.5) {
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  const box = cv.parentElement!.getBoundingClientRect();
  const w = Math.max(1, Math.round(box.width));
  const h = Math.max(1, Math.round(box.height));
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
  }
  const ctx = cv.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

/** Pointer inside the stage (real pointer wins for 1.2 s after it moves). */
function usePointer(root: RefObject<HTMLElement | null>) {
  const p = useRef({ x: 0.5, y: 0.5, t: -1e9, in: false });
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      p.current.x = (e.clientX - r.left) / r.width;
      p.current.y = (e.clientY - r.top) / r.height;
      p.current.t = performance.now();
      p.current.in = true;
    };
    const leave = () => (p.current.in = false);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [root]);
  return p;
}

/** Hand-split headline: words as inline-blocks (space OUTSIDE the span, as a right margin), chars inside. */
function Split({ text, charClass, wordClass = "", gap = "mr-[0.26em]" }: { text: string; charClass: string; wordClass?: string; gap?: string }) {
  const words = text.split(" ");
  return (
    <span aria-hidden>
      {words.map((w, wi) => (
        <span key={wi} className={`inline-block whitespace-nowrap ${wi < words.length - 1 ? gap : ""} ${wordClass}`}>
          {[...w].map((c, ci) => (
            <span key={ci} className={`inline-block ${charClass}`} data-ch={c}>
              {c}
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

/* ───────── M670 · Jitter text (loop): every letter trembles with tiny x/y/rotation keyframes, then a short pause ───────── */
function M670() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const chars = gsap.utils.toArray<HTMLElement>(".m670-ch", el);
    const tl = gsap.timeline({ repeat: -1 });
    const shake = () => {
      chars.forEach((c) => {
        const kf = Array.from({ length: 9 }, () => ({ x: rnd(-1.5, 1.5), y: rnd(-1.5, 1.5), rotation: rnd(-1.5, 1.5), duration: 0.055 }));
        kf.push({ x: 0, y: 0, rotation: 0, duration: 0.05 });
        tl.to(c, { keyframes: kf, ease: "none" }, 0);
      });
    };
    shake();
    tl.to({}, { duration: 0.3 }); // the pause (kept ≤ 0.3 s for the recorder)
    return tl;
  });
  return (
    <Stage r={root} bg="#0d0b12" g1="rgba(255,92,138,.55)" g2="rgba(255,200,92,.22)">
      <div className="flex h-full w-full flex-col items-center justify-center px-[6%] text-center">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/55" style={{ fontFamily: BODY }}>
          Late show · Hall B · 11:40 pm
        </p>
        <h3 className="mt-5 text-[clamp(64px,8.4vw,140px)] font-extrabold uppercase leading-[0.9] tracking-[-0.02em] text-[#ff5c8a]" style={{ fontFamily: WIDE }} aria-label="Almost gone">
          <Split text="Almost gone" charClass="m670-ch will-change-transform" />
        </h3>
        <p className="mt-6 text-[clamp(22px,2vw,30px)] text-white/80" style={{ fontFamily: EDITORIAL }}>
          Twelve seats left at ₹ 1,200 — the nerves are real.
        </p>
      </div>
    </Stage>
  );
}

/* ───────── M671 · Lightning text: jagged SVG bolts flash across a word in bursts, the letters flash white, then fade ───────── */
function boltPath(x1: number, y1: number, x2: number, y2: number, disp: number) {
  let pts: [number, number][] = [
    [x1, y1],
    [x2, y2],
  ];
  let d = disp;
  for (let k = 0; k < 6; k++) {
    const next: [number, number][] = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i];
      const [bx, by] = pts[i + 1];
      const len = Math.hypot(bx - ax, by - ay) || 1;
      const off = rnd(-d, d);
      next.push([(ax + bx) / 2 + (-(by - ay) / len) * off, (ay + by) / 2 + ((bx - ax) / len) * off]);
      next.push(pts[i + 1]);
    }
    pts = next;
    d *= 0.55;
  }
  let s = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) s += `L${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)}`;
  // one branch off a random midpoint
  const m = pts[Math.floor(rnd(0.25, 0.7) * pts.length)];
  const bx = m[0] + rnd(-140, 140);
  const by = m[1] + rnd(60, 150) * (Math.random() < 0.5 ? -1 : 1);
  let b: [number, number][] = [m, [bx, by]];
  let bd = disp * 0.4;
  for (let k = 0; k < 4; k++) {
    const nb: [number, number][] = [b[0]];
    for (let i = 0; i < b.length - 1; i++) {
      nb.push([(b[i][0] + b[i + 1][0]) / 2 + rnd(-bd, bd), (b[i][1] + b[i + 1][1]) / 2 + rnd(-bd, bd)]);
      nb.push(b[i + 1]);
    }
    b = nb;
    bd *= 0.55;
  }
  s += ` M${b[0][0].toFixed(1)} ${b[0][1].toFixed(1)}`;
  for (let i = 1; i < b.length; i++) s += `L${b[i][0].toFixed(1)} ${b[i][1].toFixed(1)}`;
  return s;
}
function M671() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const groups = gsap.utils.toArray<SVGGElement>(".m671-g", el);
    const white = el.querySelector(".m671-white")!;
    const flash = el.querySelector(".m671-flash")!;
    const regen = (g: SVGGElement) => {
      const across = Math.random() < 0.6;
      const d = across ? boltPath(rnd(40, 160), rnd(220, 300), rnd(840, 960), rnd(300, 380), 70) : boltPath(rnd(250, 750), -10, rnd(200, 800), rnd(300, 360), 60);
      g.querySelectorAll("path").forEach((p) => p.setAttribute("d", d));
    };
    const tl = gsap.timeline({ repeat: -1 });
    for (let k = 0; k < 5; k++) {
      const g = groups[k % groups.length];
      tl.call(() => regen(g))
        .set(g, { opacity: 1 })
        .to(white, { opacity: 1, duration: 0.04 }, "<")
        .to(flash, { opacity: 0.14, duration: 0.04 }, "<")
        .to(g, { opacity: 0.15, duration: 0.05 })
        .to(g, { opacity: 1, duration: 0.04 })
        .to([g, white, flash], { opacity: 0, duration: rnd(0.32, 0.45), ease: "power2.out" })
        .to({}, { duration: rnd(0.06, 0.2) });
    }
    return tl;
  });
  return (
    <Stage r={root} bg="#07081a" g1="rgba(122,110,255,.55)" g2="rgba(80,200,255,.24)">
      <div className="m671-flash pointer-events-none absolute inset-0 z-10 bg-[#cfd6ff] opacity-0" aria-hidden />
      <div className="flex h-full w-full flex-col items-center justify-center text-center">
        <p className="text-[13px] uppercase tracking-[0.24em] text-[#b9b4ff]/70" style={{ fontFamily: BODY }}>
          Storm-proof shells · AW collection
        </p>
        <h3 className="relative mt-4 text-[clamp(64px,7.6vw,128px)] font-extrabold uppercase leading-[1] tracking-[-0.01em]" style={{ fontFamily: WIDE }}>
          <span className="text-[#8f89d9]">Thunder</span>
          <span className="m671-white absolute inset-0 text-white opacity-0" style={{ textShadow: "0 0 18px rgba(190,200,255,.9), 0 0 48px rgba(140,150,255,.6)" }} aria-hidden>
            Thunder
          </span>
        </h3>
        <p className="mt-5 text-[clamp(20px,1.8vw,26px)] text-white/75" style={{ fontFamily: EDITORIAL }}>
          Taped seams, 20k waterproofing · from ₹ 8,900
        </p>
      </div>
      <svg viewBox="0 0 1000 600" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 z-20 h-full w-full" aria-hidden>
        {[0, 1].map((i) => (
          <g key={i} className="m671-g" opacity="0" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path stroke="#8e8cff" strokeOpacity=".22" strokeWidth="18" vectorEffect="non-scaling-stroke" />
            <path stroke="#c6c8ff" strokeOpacity=".7" strokeWidth="5" vectorEffect="non-scaling-stroke" />
            <path stroke="#ffffff" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
          </g>
        ))}
      </svg>
    </Stage>
  );
}

/* ───────── M672 · Paragraph wraps around a moving silhouette: canvas text re-flows per frame around an orb ───────── */
const M672_TEXT =
  "Every bottle we press starts in a grove at dawn, when the air is still cool and the fruit is heavy. We pick by hand, crush within the hour and let the oil settle for forty days in clay. Nothing is filtered away that does not need to go. The result tastes of cut grass, green almond and a little pepper at the back of the throat. Pour it on warm bread, over tomatoes, into soup at the very end. Keep it out of the light, use it within the season, and come back when the next harvest lands.";
function M672() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const fb = useRef<HTMLParagraphElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const ptr = usePointer(root);
  const st = useRef({ words: [] as string[], widths: [] as number[], space: 0, font: "", cx: 0.3, cy: 0.55, ready: false });
  useTicker(root, (time) => {
    const c = cv.current;
    const el = root.current;
    if (!c || !el) return;
    const t = time;
    const { ctx, w, h } = fitCanvas(c);
    const s = st.current;
    const size = Math.round(Math.max(17, Math.min(22, w / 62)));
    const font = `400 ${size}px 'Fraunces Variable', Georgia, serif`;
    if (s.font !== font) {
      ctx.font = font;
      s.words = (M672_TEXT + " " + M672_TEXT).split(" ");
      s.widths = s.words.map((wd) => ctx.measureText(wd).width);
      s.space = ctx.measureText(" ").width;
      s.font = font;
    }
    const left = w * 0.06;
    const right = w * 0.94;
    const top = h * 0.24;
    const bottom = h * 0.93;
    const lh = Math.round(size * 1.5);
    const R = Math.min(w, h) * 0.17;
    const gap = 16;
    // target: real pointer, else an auto path (Lissajous) through the paragraph
    const real = performance.now() - ptr.current.t < 1200 && ptr.current.in;
    const tx = real ? ptr.current.x : 0.5 + 0.34 * Math.sin(t * 0.55);
    const ty = real ? ptr.current.y : 0.6 + 0.17 * Math.sin(t * 0.95 + 1);
    s.cx += (tx - s.cx) * 0.08;
    s.cy += (gsap.utils.clamp(0.3, 0.88, ty) - s.cy) * 0.08;
    const cx = s.cx * w;
    const cy = s.cy * h;
    ctx.clearRect(0, 0, w, h);
    // orb
    const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R);
    g.addColorStop(0, "rgba(255,236,170,.95)");
    g.addColorStop(0.55, "rgba(186,214,92,.75)");
    g.addColorStop(1, "rgba(60,110,40,.15)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(230,255,180,.35)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, R + gap * 0.6, 0, Math.PI * 2);
    ctx.stroke();
    // text flow around the orb
    ctx.font = font;
    ctx.fillStyle = "rgba(240,236,222,.9)";
    ctx.textBaseline = "alphabetic";
    let wi = 0;
    const rr = R + gap;
    for (let y = top; y + lh <= bottom && wi < s.words.length; y += lh) {
      const near = Math.max(0, Math.abs(cy - (y + lh / 2)) - lh / 2);
      const segs: [number, number][] = [];
      if (near < rr) {
        const hw = Math.sqrt(rr * rr - near * near);
        if (cx - hw - left > 40) segs.push([left, cx - hw]);
        if (right - (cx + hw) > 40) segs.push([cx + hw, right]);
      } else segs.push([left, right]);
      for (const [a, b] of segs) {
        let x = a;
        while (wi < s.words.length && x + s.widths[wi] <= b) {
          ctx.fillText(s.words[wi], x, y + lh * 0.72);
          x += s.widths[wi] + s.space;
          wi++;
        }
      }
    }
    if (!s.ready) {
      s.ready = true;
      c.style.opacity = "1";
      if (fb.current) fb.current.style.visibility = "hidden";
    }
    if (dot.current) {
      dot.current.style.transform = `translate3d(${cx}px,${cy}px,0)`;
      dot.current.style.opacity = real ? "0" : "1";
    }
  });
  return (
    <Stage r={root} bg="#0b100a" g1="rgba(186,214,92,.5)" g2="rgba(255,200,120,.22)" top>
      <div className="absolute left-[6%] top-[8%] z-10 flex w-[88%] items-baseline justify-between">
        <h3 className="text-[clamp(34px,3.4vw,56px)] leading-none text-[#f4f0e2]" style={{ fontFamily: EDITORIAL }}>
          Pressed at first light
        </h3>
        <p className="text-[13px] uppercase tracking-[0.22em] text-[#d8e6a8]/60" style={{ fontFamily: BODY }}>
          Grove notes · 500 ml · ₹ 1,450
        </p>
      </div>
      <p ref={fb} className="absolute left-[6%] top-[24%] w-[88%] text-[20px] leading-[1.5] text-[#f0ecde]/90" style={{ fontFamily: SERIF }}>
        {M672_TEXT}
      </p>
      <canvas ref={cv} className="b15t2-cv" aria-hidden />
      <div ref={dot} className="b15t2-dot" aria-hidden />
    </Stage>
  );
}

/* ───────── M673 · Recursive type wordmark: a giant word built from a grid of tiny readable copy, lit in a slow wave ───────── */
const M673_COPY = "HAND-BOUND NOTEBOOKS · COTTON PAPER · ₹ 1,450 · STITCHED IN JAIPUR · MADE SLOW · LAY-FLAT SPINE · 120 PAGES · ";
type M673Cell = { x: number; y: number; ch: string; d: number; c: number; r: number };
function M673() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const fb = useRef<HTMLDivElement>(null);
  const st = useRef<{ key: string; cells: M673Cell[]; dim: HTMLCanvasElement | null; fonts: boolean; shown: boolean; cw: number }>({ key: "", cells: [], dim: null, fonts: false, shown: false, cw: 7 });
  useEffect(() => {
    let dead = false;
    Promise.resolve(document.fonts?.ready).then(() => {
      if (!dead) st.current.fonts = true;
    });
    return () => {
      dead = true;
    };
  }, []);
  useTicker(root, (t) => {
    const c = cv.current;
    const s = st.current;
    if (!c || !s.fonts) return;
    const { ctx, w, h } = fitCanvas(c);
    const font = `600 12px ${MONO}`;
    const key = `${w}x${h}`;
    const CH = 15;
    if (s.key !== key) {
      s.key = key;
      ctx.font = font;
      const cw = ctx.measureText("M").width;
      s.cw = cw;
      const cols = Math.floor(w / cw);
      const rows = Math.floor(h / CH);
      // mask at grid resolution, drawn in a y-stretched space so the word keeps its shape on non-square cells
      const m = document.createElement("canvas");
      m.width = cols;
      m.height = rows;
      const mc = m.getContext("2d")!;
      const vh = rows * (CH / cw);
      mc.setTransform(1, 0, 0, cw / CH, 0, 0);
      let fs = vh * 0.62;
      mc.font = `800 ${fs}px ${WIDE}`;
      const tw = mc.measureText("VELLUM").width;
      if (tw > cols * 0.88) fs *= (cols * 0.88) / tw;
      mc.font = `800 ${fs}px ${WIDE}`;
      mc.textAlign = "center";
      mc.textBaseline = "middle";
      mc.fillStyle = "#fff";
      mc.fillText("VELLUM", cols / 2, vh * 0.54);
      const data = mc.getImageData(0, 0, cols, rows).data;
      const cells: M673Cell[] = [];
      const dim = document.createElement("canvas");
      const dpr = c.width / w;
      dim.width = c.width;
      dim.height = c.height;
      const dc = dim.getContext("2d")!;
      dc.setTransform(dpr, 0, 0, dpr, 0, 0);
      dc.font = font;
      dc.fillStyle = "rgba(220,230,255,.07)";
      dc.textBaseline = "top";
      const L = M673_COPY.length;
      for (let r = 0; r < rows; r++) {
        for (let col = 0; col < cols; col++) {
          const ch = M673_COPY[(r * cols + col) % L];
          const x = col * cw;
          const y = r * CH;
          if (data[(r * cols + col) * 4 + 3] > 110) cells.push({ x, y, ch, c: col, r, d: (col / cols) * 0.78 + (r / rows) * 0.22 });
          else dc.fillText(ch, x, y);
        }
      }
      s.cells = cells;
      s.dim = dim;
    }
    ctx.clearRect(0, 0, w, h);
    if (s.dim) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(s.dim, 0, 0);
      ctx.restore();
    }
    // 6.4 s cycle: wave builds the word (0–2.4 s), shimmer while lit, wave clears it (4.2–6.4 s)
    const p = t % 6.4;
    const buckets: M673Cell[][] = Array.from({ length: 9 }, () => []);
    const front: M673Cell[] = [];
    for (const cell of s.cells) {
      const ain = gsap.utils.clamp(0, 1, (p - cell.d * 2) / 0.35);
      const aout = gsap.utils.clamp(0, 1, (p - 4.2 - cell.d * 1.8) / 0.35);
      const shimmer = 0.72 + 0.28 * Math.sin(t * 2.2 - cell.c * 0.11 + cell.r * 0.35);
      const a = ain * (1 - aout) * shimmer;
      if (a <= 0.02) continue;
      if ((ain > 0 && ain < 1) || (aout > 0 && aout < 1)) front.push(cell);
      else buckets[Math.min(8, Math.floor(a * 9))].push(cell);
    }
    ctx.font = font;
    ctx.textBaseline = "top";
    buckets.forEach((b, i) => {
      if (!b.length) return;
      ctx.fillStyle = `rgba(255,214,150,${((i + 1) / 9).toFixed(2)})`;
      for (const cell of b) ctx.fillText(cell.ch, cell.x, cell.y);
    });
    ctx.fillStyle = "#ffffff";
    for (const cell of front) ctx.fillText(cell.ch, cell.x, cell.y);
    if (!s.shown) {
      s.shown = true;
      c.style.opacity = "1";
      if (fb.current) fb.current.style.visibility = "hidden";
    }
  });
  return (
    <Stage r={root} bg="#0c0a08" g1="rgba(255,190,110,.5)" g2="rgba(120,150,255,.2)" top>
      <div ref={fb} className="absolute inset-0 flex items-center justify-center" aria-hidden>
        <span className="text-[clamp(90px,15vw,240px)] font-extrabold leading-none text-[#ffd696]" style={{ fontFamily: WIDE }}>
          VELLUM
        </span>
      </div>
      <canvas ref={cv} className="b15t2-cv" aria-label="VELLUM — hand-bound notebooks, built from small copy" />
    </Stage>
  );
}

/* ───────── M674 · Refractive glass headline (WebGL): the word as thick glass bending a moving colour field ───────── */
const M674_FRAG = /* glsl */ `
float blob(vec2 p, vec2 c, float r, float asp){ vec2 d=(p-c)*vec2(asp,1.0); return smoothstep(r,0.0,length(d)); }
vec3 field(vec2 p, float t, float asp){
  vec3 c = vec3(0.03,0.035,0.08);
  c += vec3(1.0,0.45,0.22)*blob(p, vec2(0.28+0.2*sin(t*0.41), 0.5+0.25*cos(t*0.33)), 0.62, asp);
  c += vec3(0.22,0.55,1.0)*blob(p, vec2(0.74+0.16*cos(t*0.37), 0.45+0.3*sin(t*0.29)), 0.66, asp);
  c += vec3(0.75,0.3,1.0)*0.85*blob(p, vec2(0.5+0.34*sin(t*0.23+1.0), 0.3+0.22*sin(t*0.43)), 0.5, asp);
  c += vec3(0.25,1.0,0.7)*0.5*blob(p, vec2(0.45+0.3*cos(t*0.31+2.0), 0.75+0.15*sin(t*0.5)), 0.42, asp);
  c += 0.07*sin((p.x*asp*1.4+p.y)*46.0 + t*1.3);
  return c;
}
void main(){
  float asp = uRes.x/uRes.y;
  vec2 uv = vUv;
  vec2 px = 1.5/uTexRes0;
  vec4 s = texture2D(uTex0, uv);
  float m = s.r;
  float hx = texture2D(uTex0, uv+vec2(px.x,0.0)).g - texture2D(uTex0, uv-vec2(px.x,0.0)).g;
  float hy = texture2D(uTex0, uv+vec2(0.0,px.y)).g - texture2D(uTex0, uv-vec2(0.0,px.y)).g;
  vec3 n = normalize(vec3(-hx*9.0, -hy*9.0, 1.0));
  vec2 off = n.xy*0.09*m;
  vec3 bg = field(uv, uTime, asp)*0.42;
  vec3 refr = vec3(field(uv+off*1.0, uTime, asp).r, field(uv+off*1.3, uTime, asp).g, field(uv+off*1.6, uTime, asp).b);
  vec3 L = normalize(vec3(-0.45,0.55,0.75));
  float spec = pow(max(dot(n,L),0.0), 48.0);
  float rim = (1.0-n.z);
  vec3 glass = refr*1.2 + vec3(1.0)*spec*0.9 + vec3(0.85,0.9,1.0)*rim*0.7 + 0.04;
  vec3 col = mix(bg, glass, m);
  gl_FragColor = vec4(col, 1.0);
}`;
function m674Tex(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d")!;
  x.fillStyle = "#000";
  x.fillRect(0, 0, w, h);
  let fs = h * 0.42;
  x.font = `800 ${fs}px ${WIDE}`;
  const tw = x.measureText("PRISM").width;
  if (tw > w * 0.8) fs *= (w * 0.8) / tw;
  x.font = `800 ${fs}px ${WIDE}`;
  x.textAlign = "center";
  x.textBaseline = "middle";
  const cy = h * 0.52;
  // G = soft height (shadow blur, drawn from far off-canvas so only the blurred shadow lands), R = sharp mask
  x.globalCompositeOperation = "lighter";
  x.shadowOffsetX = w * 2;
  [
    [Math.round(fs * 0.16), "rgb(0,120,0)"],
    [Math.round(fs * 0.06), "rgb(0,135,0)"],
  ].forEach(([b, col]) => {
    x.shadowBlur = b as number;
    x.shadowColor = col as string;
    x.fillStyle = "#000";
    x.fillText("PRISM", w / 2 - w * 2, cy);
  });
  x.shadowColor = "transparent";
  x.shadowBlur = 0;
  x.shadowOffsetX = 0;
  x.fillStyle = "rgb(255,0,0)";
  x.fillText("PRISM", w / 2, cy);
  return c;
}
function M674() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const near = useNear(root);
  useEffect(() => {
    const canvas = cv.current;
    if (!near || !canvas) return;
    let dead = false;
    let h: GLHandle | null = null;
    (async () => {
      await document.fonts?.ready;
      if (dead) return;
      const box = canvas.parentElement!.getBoundingClientRect();
      const tex = m674Tex(Math.max(2, Math.round(Math.min(box.width, 1600))), Math.max(2, Math.round(Math.min(box.height, 1000))));
      h = await createShader(canvas, M674_FRAG, { textures: [tex], dpr: 1 });
      if (dead) h?.destroy();
    })();
    return () => {
      dead = true;
      h?.destroy();
    };
  }, [near]);
  return (
    <Stage r={root} bg="#06070f" g1="rgba(120,140,255,.55)" g2="rgba(255,140,90,.24)" top>
      <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
        <span
          className="bg-clip-text text-[clamp(110px,17vw,280px)] font-extrabold leading-none text-transparent"
          style={{ fontFamily: WIDE, backgroundImage: "linear-gradient(120deg,#e9ecff 0%,#ffb38a 35%,#9fb6ff 65%,#e7d4ff 100%)" }}
        >
          PRISM
        </span>
      </div>
      <canvas ref={cv} className="b15t2-cv" aria-hidden />
      <div className="pointer-events-none absolute inset-x-[6%] top-[8%] z-10 flex items-baseline justify-between">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/60" style={{ fontFamily: BODY }}>
          Optics lab · Collection 03
        </p>
        <p className="text-[14px] text-white/70" style={{ fontFamily: GROTESK }}>
          Crystal tumblers · set of 4 · ₹ 3,800
        </p>
      </div>
      <h3 className="sr-only">Prism</h3>
    </Stage>
  );
}

/* ───────── M675 · Rotating diamond letter: one "o" is a diamond that spins on a loop; the rest of the word stays still ───────── */
function M675() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => el.classList.toggle("m675-off", !e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Stage r={root} bg="#100b0c" g1="rgba(255,150,80,.55)" g2="rgba(184,50,90,.26)">
      <div className="flex h-full w-full flex-col items-start justify-center px-[8%]">
        <p className="text-[13px] uppercase tracking-[0.24em] text-[#ffd2a8]/60" style={{ fontFamily: BODY }}>
          Independent design practice · Est. 2014
        </p>
        <h3 className="mt-4 text-[clamp(80px,10vw,170px)] font-semibold leading-[0.95] tracking-[-0.03em] text-[#fff1e6]" style={{ fontFamily: SERIF }} aria-label="Studio Nord">
          <span aria-hidden>
            Studi
            <span className="m675-d relative">
              <span className="m675-face" />
            </span>
            <span className="ml-[0.24em]">Nord</span>
          </span>
        </h3>
        <div className="mt-8 flex w-full max-w-[880px] items-baseline justify-between border-t border-white/15 pt-5 text-[15px] text-white/65" style={{ fontFamily: GROTESK }}>
          <span>Identity · Packaging · Spaces</span>
          <span>Brand sprint from ₹ 2,40,000</span>
        </div>
      </div>
    </Stage>
  );
}

/* ───────── M676 · Letter sphere scatter: glyphs on a spinning 3D sphere burst outward on a timed trigger (or click), then regrow ───────── */
const M676_TEXT = "ATELIER NORTH · SLOW KNITS · ";
type M676G = { x: number; y: number; z: number; ch: string; f: number; jx: number; jy: number; jz: number };
function M676() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const fb = useRef<HTMLDivElement>(null);
  const st = useRef({ s: 0, ring: 0, shown: false });
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const glyphs = useRef<M676G[]>([]);
  if (!glyphs.current.length) {
    const N = 150;
    const ga = Math.PI * (3 - Math.sqrt(5));
    let seed = 7;
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const rad = Math.sqrt(1 - y * y);
      const th = ga * i;
      glyphs.current.push({ x: Math.cos(th) * rad, y, z: Math.sin(th) * rad, ch: M676_TEXT[i % M676_TEXT.length], f: 0.6 + r() * 1.1, jx: r() - 0.5, jy: r() - 0.5, jz: r() - 0.5 });
    }
  }
  usePlay(root, () => {
    const s = st.current;
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(s, { ring: 0 })
      .to(s, { s: 1, duration: 0.85, ease: "power3.out" })
      .to(s, { ring: 1, duration: 0.9, ease: "power2.out" }, 0)
      .to(s, { s: 0, duration: 1.15, ease: "power2.inOut" }, 0.95)
      .to({}, { duration: 1.1 }); // sphere keeps spinning (never still) before the next burst
    tlRef.current = tl;
    return tl;
  });
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const click = () => tlRef.current?.restart();
    el.addEventListener("click", click);
    return () => el.removeEventListener("click", click);
  }, []);
  useTicker(root, (t) => {
    const c = cv.current;
    if (!c) return;
    const { ctx, w, h } = fitCanvas(c);
    const s = st.current;
    const R = Math.min(w, h) * 0.33;
    const cx = w / 2;
    const cy = h * 0.52;
    const ay = t * 0.4;
    const ax = 0.35 * Math.sin(t * 0.25);
    const [sy, cyr, sx, cxr] = [Math.sin(ay), Math.cos(ay), Math.sin(ax), Math.cos(ax)];
    const fov = R * 3.2;
    ctx.clearRect(0, 0, w, h);
    if (s.ring > 0 && s.ring < 1) {
      ctx.strokeStyle = `rgba(255,214,170,${(0.5 * (1 - s.ring)).toFixed(3)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, R * (0.3 + s.ring * 1.6), 0, Math.PI * 2);
      ctx.stroke();
    }
    const pts = glyphs.current.map((g) => {
      const k = 1 + s.s * 1.5 * g.f;
      let x = g.x * k + g.jx * s.s * 0.6;
      let y = g.y * k + g.jy * s.s * 0.6;
      let z = g.z * k + g.jz * s.s * 0.6;
      const x1 = x * cyr + z * sy;
      const z1 = -x * sy + z * cyr;
      const y1 = y * cxr - z1 * sx;
      const z2 = y * sx + z1 * cxr;
      x = x1;
      y = y1;
      z = z2;
      const sc = fov / (fov - z * R);
      return { ch: g.ch, px: cx + x * R * sc, py: cy + y * R * sc, z, sc };
    });
    pts.sort((a, b) => a.z - b.z);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const p of pts) {
      const depth = (p.z + 1.4) / 2.8;
      ctx.fillStyle = `rgba(255,${Math.round(200 + 40 * depth)},${Math.round(150 + 90 * depth)},${gsap.utils.clamp(0.18, 1, 0.2 + depth * 0.85).toFixed(3)})`;
      ctx.font = `700 ${Math.max(12, 22 * p.sc).toFixed(1)}px ${GROTESK}`;
      ctx.fillText(p.ch, p.px, p.py);
    }
    if (!s.shown) {
      s.shown = true;
      c.style.opacity = "1";
      if (fb.current) fb.current.style.visibility = "hidden";
    }
  });
  return (
    <Stage r={root} bg="#0b0910" g1="rgba(255,150,110,.55)" g2="rgba(130,120,255,.24)" top>
      <div ref={fb} className="absolute inset-0 flex items-center justify-center" aria-hidden>
        <div className="flex aspect-square h-[66%] items-center justify-center rounded-full border border-[#ffd6b0]/25 text-center text-[13px] uppercase leading-[2] tracking-[0.4em] text-[#ffd6b0]/70" style={{ fontFamily: GROTESK }}>
          Atelier North
          <br />
          Slow knits
        </div>
      </div>
      <canvas ref={cv} className="b15t2-cv cursor-pointer" aria-hidden />
      <div className="pointer-events-none absolute inset-x-[6%] bottom-[8%] z-10 flex items-baseline justify-between">
        <h3 className="text-[clamp(30px,3vw,48px)] leading-none text-[#fff1e6]" style={{ fontFamily: EDITORIAL }}>
          Spun, scattered, re-wound.
        </h3>
        <p className="text-[14px] text-white/65" style={{ fontFamily: GROTESK }}>
          Merino crew · ₹ 6,400
        </p>
      </div>
    </Stage>
  );
}

/* ───────── M677 · Shader bend text (WebGL, variant of M400): the type plate bends and creases in 3D under the pointer, with shading ───────── */
const M677_FRAG = /* glsl */ `
uniform vec2 uMouse;
uniform float uStr, uAng;
float height(vec2 uv, float asp){
  vec2 q = (uv - uMouse)*vec2(asp,1.0);
  vec2 dir = vec2(cos(uAng), sin(uAng));
  float d = dot(q, vec2(-dir.y, dir.x));
  float along = dot(q, dir);
  float fade = exp(-along*along/0.55);
  float ridge = exp(-d*d/0.018)*fade;
  float crease = max(0.0, 1.0-abs(d)/0.22)*fade;
  float bump = exp(-dot(q,q)/0.035);
  return uStr*(0.10*ridge + 0.07*crease + 0.06*bump);
}
void main(){
  float asp = uRes.x/uRes.y;
  vec2 e = vec2(0.0025, 0.0);
  float h0 = height(vUv, asp);
  float gx = (height(vUv+e.xy, asp) - height(vUv-e.xy, asp))/(2.0*e.x);
  float gy = (height(vUv+e.yx, asp) - height(vUv-e.yx, asp))/(2.0*e.x);
  vec2 uv = vUv - vec2(gx, gy)*0.035 - (vUv-0.5)*h0*0.25;
  vec3 tex = texture2D(uTex0, clamp(uv, 0.0, 1.0)).rgb;
  vec3 n = normalize(vec3(-gx*0.55, -gy*0.55, 1.0));
  vec3 L = normalize(vec3(-0.45, 0.55, 0.72));
  float diff = clamp(dot(n, L), 0.0, 1.0);
  float base = dot(vec3(0.0,0.0,1.0), L);
  vec3 H = normalize(L + vec3(0.0,0.0,1.0));
  float spec = pow(max(dot(n, H), 0.0), 60.0) - pow(max(H.z,0.0), 60.0);
  vec3 col = tex*(0.25 + 0.75*diff/base) + vec3(1.0,0.95,0.85)*max(spec,0.0)*0.6;
  gl_FragColor = vec4(col, 1.0);
}`;
function m677Tex(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d")!;
  const g = x.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#14303a");
  g.addColorStop(1, "#0d1424");
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);
  x.strokeStyle = "rgba(220,240,255,.08)";
  x.lineWidth = 1;
  for (let i = 1; i < 12; i++) {
    x.beginPath();
    x.moveTo((w / 12) * i, 0);
    x.lineTo((w / 12) * i, h);
    x.stroke();
  }
  let fs = h * 0.3;
  x.font = `800 ${fs}px ${WIDE}`;
  const tw = x.measureText("FOLDED").width;
  if (tw > w * 0.82) fs *= (w * 0.82) / tw;
  x.font = `800 ${fs}px ${WIDE}`;
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillStyle = "#e8f4ff";
  x.fillText("FOLDED", w / 2, h * 0.5);
  x.font = `500 ${Math.round(h * 0.034)}px ${BODY}`;
  x.fillStyle = "rgba(232,244,255,.65)";
  x.textAlign = "left";
  x.fillText("PAPER GOODS · ISSUE 07", w * 0.06, h * 0.12);
  x.textAlign = "right";
  x.fillText("Letterpress cards · ₹ 450", w * 0.94, h * 0.88);
  return c;
}
function M677() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const fb = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const ptr = usePointer(root);
  const near = useNear(root);
  useEffect(() => {
    const el = root.current;
    const canvas = cv.current;
    if (!near || !el || !canvas) return;
    let dead = false;
    let h: GLHandle | null = null;
    const cur = { x: 0.2, y: 0.5, s: 0 };
    let last = 0;
    let hid = false;
    (async () => {
      await document.fonts?.ready;
      if (dead) return;
      const box = canvas.parentElement!.getBoundingClientRect();
      const tex = m677Tex(Math.max(2, Math.round(Math.min(box.width, 1600))), Math.max(2, Math.round(Math.min(box.height, 1000))));
      h = await createShader(canvas, M677_FRAG, {
        textures: [tex],
        dpr: 1,
        uniforms: { uMouse: { value: [0.5, 0.5] }, uStr: { value: 0 }, uAng: { value: 0.4 } },
        onFrame: (u, t) => {
          const dt = Math.min(0.1, last ? t - last : 0.016);
          last = t;
          const p = ptr.current;
          const useReal = performance.now() - p.t < 1200;
          const tx = useReal ? p.x : 0.5 + 0.36 * Math.sin(t * 0.7);
          const ty = useReal ? p.y : 0.5 + 0.2 * Math.sin(t * 1.3 + 0.8);
          const on = useReal ? p.in : true;
          const k = 1 - Math.exp(-dt * 6);
          cur.x += (tx - cur.x) * k;
          cur.y += (ty - cur.y) * k;
          cur.s += ((on ? 1 : 0) - cur.s) * (1 - Math.exp(-dt * 4));
          u.uMouse.value = [cur.x, 1 - cur.y];
          u.uStr.value = cur.s * (0.85 + 0.15 * Math.sin(t * 2.1));
          u.uAng.value = 0.5 + 0.5 * Math.sin(t * 0.45);
          const d = dot.current;
          if (d) {
            d.style.transform = `translate3d(${cur.x * el.clientWidth}px,${cur.y * el.clientHeight}px,0)`;
            d.style.opacity = useReal ? "0" : "1";
          }
          if (!hid && fb.current) {
            hid = true;
            fb.current.style.visibility = "hidden";
          }
        },
      });
      if (dead) h?.destroy();
    })();
    return () => {
      dead = true;
      h?.destroy();
      if (fb.current) fb.current.style.visibility = "";
    };
  }, [near, ptr]);
  return (
    <Stage r={root} bg="#0d1424" g1="rgba(110,200,255,.5)" g2="rgba(255,190,120,.22)" top>
      <div ref={fb} className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#14303a] to-[#0d1424]" aria-hidden>
        <span className="text-[clamp(90px,13vw,220px)] font-extrabold leading-none text-[#e8f4ff]" style={{ fontFamily: WIDE }}>
          FOLDED
        </span>
      </div>
      <canvas ref={cv} className="b15t2-cv" aria-hidden />
      <div ref={dot} className="b15t2-dot" aria-hidden />
      <h3 className="sr-only">Folded — paper goods</h3>
    </Stage>
  );
}

/* ───────── M678 · Squash-bounce letters: chars fall in, squash on landing (scaleY .7 / scaleX 1.2), spring back, staggered ───────── */
function M678() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const h = el.querySelector(".m678-h") as HTMLElement;
    const split = SplitText.create(h, { type: "words,chars" });
    const chars = split.chars as HTMLElement[];
    gsap.set(chars, { transformOrigin: "50% 100%", display: "inline-block" });
    const tl = gsap.timeline({ repeat: -1 });
    chars.forEach((c, i) => {
      const at = i * 0.065;
      tl.fromTo(c, { y: -320, opacity: 0, scaleX: 0.9, scaleY: 1.14 }, { y: 0, opacity: 1, duration: 0.42, ease: "power2.in" }, at)
        .to(c, { scaleX: 1.2, scaleY: 0.7, duration: 0.07, ease: "power1.out" }, at + 0.42)
        .to(c, { scaleX: 1, scaleY: 1, duration: 0.5, ease: "elastic.out(1,0.42)" }, at + 0.49);
    });
    tl.to({}, { duration: 0.1 }).to(chars, { y: -46, opacity: 0, duration: 0.32, ease: "power2.in", stagger: 0.03 });
    return tl;
  });
  return (
    <Stage r={root} bg="#140b10" g1="rgba(255,110,150,.55)" g2="rgba(255,200,90,.26)">
      <div className="flex h-full w-full flex-col items-center justify-center text-center">
        <p className="text-[13px] uppercase tracking-[0.24em] text-[#ffc6d6]/65" style={{ fontFamily: BODY }}>
          Fruit gummies · New flavour
        </p>
        <h3 className="m678-h mt-5 text-[clamp(60px,7vw,118px)] font-extrabold uppercase leading-[1] tracking-[-0.01em] text-[#ff8fb0]" style={{ fontFamily: WIDE }}>
          Gummy Drop
        </h3>
        <div className="mt-4 h-[3px] w-[min(46%,560px)] rounded-full bg-[#ff8fb0]/25" aria-hidden />
        <p className="mt-6 text-[clamp(20px,1.8vw,26px)] text-white/75" style={{ fontFamily: EDITORIAL }}>
          Mango chilli · pack of 12 · ₹ 240
        </p>
      </div>
    </Stage>
  );
}

/* ───────── M679 · ASCII cascade collapse (variant of M22): letters scramble into noise glyphs that fall away, then rise back and re-form ───────── */
const NOISE = "#%&*+=<>/\\|01:;~^$@";
const M679_WORD = "Static Bloom";
function M679() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const slots = gsap.utils.toArray<HTMLElement>(".m679-s", el);
    const pick = () => NOISE[Math.floor(Math.random() * NOISE.length)];
    const tl = gsap.timeline({ repeat: -1 });
    const collapse = 0;
    const back = slots.length * 0.05 + 1.0;
    slots.forEach((s, i) => {
      const c = s.querySelector(".m679-c") as HTMLElement;
      const real = c.dataset.ch ?? "";
      const gl = gsap.utils.toArray<HTMLElement>(".m679-g", s);
      const a = collapse + i * 0.05;
      const proxy = { v: 0 };
      tl.to(proxy, { v: 1, duration: 0.26, ease: "none", onUpdate: () => (c.textContent = pick()) }, a)
        .to(c, { opacity: 0, y: 22, duration: 0.14, ease: "power1.in" }, a + 0.2);
      gl.forEach((g, j) => {
        tl.call(() => void (g.textContent = pick()), undefined, a + 0.1)
          .fromTo(g, { y: 0, x: 0, rotation: 0, opacity: 1 }, { y: 150 + j * 70, x: rnd(-26, 26), rotation: rnd(-40, 40), opacity: 0, duration: 0.7, ease: "power2.in" }, a + 0.12 + j * 0.05);
      });
      // reassemble: glyphs rise back into the slot, the letter scrambles and settles on itself
      const b = back + i * 0.05;
      gl.forEach((g, j) => {
        tl.fromTo(g, { y: 170 + j * 60, x: rnd(-20, 20), rotation: rnd(-30, 30), opacity: 0 }, { y: 0, x: 0, rotation: 0, opacity: 0.9, duration: 0.5, ease: "power3.out" }, b + j * 0.04).set(g, { opacity: 0 }, b + 0.5 + j * 0.04);
      });
      const proxy2 = { v: 0 };
      tl.fromTo(c, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.2, ease: "power2.out" }, b + 0.42)
        .to(proxy2, { v: 1, duration: 0.24, ease: "none", onUpdate: () => (c.textContent = proxy2.v > 0.96 ? real : pick()), onComplete: () => void (c.textContent = real) }, b + 0.42);
    });
    tl.to({}, { duration: 0.15 });
    return tl;
  });
  const words = M679_WORD.split(" ");
  return (
    <Stage r={root} bg="#070b0d" g1="rgba(90,255,200,.5)" g2="rgba(120,140,255,.22)">
      <div className="flex h-full w-full flex-col items-center justify-start pt-[14%] text-center">
        <p className="text-[13px] uppercase tracking-[0.24em] text-[#9ff5d8]/60" style={{ fontFamily: MONO }}>
          Synth pedal · limited run · ₹ 14,900
        </p>
        <h3 className="mt-5 text-[clamp(64px,7.4vw,124px)] font-bold leading-[1] tracking-[-0.02em] text-[#dffff4]" style={{ fontFamily: GROTESK }} aria-label={M679_WORD}>
          <span aria-hidden>
            {words.map((w, wi) => (
              <span key={wi} className={`inline-block whitespace-nowrap ${wi < words.length - 1 ? "mr-[0.26em]" : ""}`}>
                {[...w].map((ch, ci) => (
                  <span key={ci} className="m679-s relative inline-block">
                    <span className="m679-c inline-block" data-ch={ch}>
                      {ch}
                    </span>
                    {[0, 1, 2, 3].map((j) => (
                      <span key={j} className="m679-g absolute left-0 top-0 w-full text-center text-[#5dffc4] opacity-0" style={{ fontFamily: MONO }}>
                        {NOISE[(ci * 4 + j) % NOISE.length]}
                      </span>
                    ))}
                  </span>
                ))}
              </span>
            ))}
          </span>
        </h3>
      </div>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M670", name: "Jitter text (loop)", how: "Every letter trembles with tiny x/y (±1.5px) and rotation (±1.5°) keyframes, then a short pause · loops on screen", kind: "play", C: M670 },
  { code: "M671", name: "Lightning text", how: "Jagged SVG bolts flash across and down onto a word in bursts, the letters flash white, then fade · random-interval loop", kind: "play", C: M671 },
  { code: "M672", name: "Paragraph wraps around moving silhouette", how: "A canvas paragraph re-flows every frame around a moving orb, parting and closing behind it · pointer, auto path when idle", kind: "play", C: M672 },
  { code: "M673", name: "Recursive type wordmark", how: "A giant word drawn as a grid of tiny readable copy; its cells light up in a slow wave, shimmer, then clear · loops", kind: "play", C: M673 },
  { code: "M674", name: "Refractive glass headline (WebGL)", how: "The word is thick glass: a moving colour field bends through the letters with prism fringes and a specular rim · runs on screen", kind: "play", C: M674 },
  { code: "M675", name: "Rotating diamond letter", how: "One letter (the 'o') is a diamond that spins in 3D on a CSS loop while the rest of the word stays still", kind: "play", C: M675 },
  { code: "M676", name: "Letter sphere scatter", how: "Glyphs sit on a spinning 3D sphere; a timed trigger (or click) scatters them outward, then they regrow onto the sphere", kind: "play", C: M676 },
  { code: "M677", name: "Shader bend text (WebGL)", how: "The type plate bends and creases in 3D under the pointer with real light and shade · auto pointer path when idle", kind: "play", C: M677 },
  { code: "M678", name: "Squash-bounce letters", how: "Letters fall in one by one, squash on landing (scaleY .7 / scaleX 1.2) and spring back to shape · loops on screen", kind: "play", C: M678 },
  { code: "M679", name: "ASCII cascade collapse", how: "The heading scrambles letter by letter into noise glyphs that fall below it, then they rise back and re-form the word · loops", kind: "play", C: M679 },
];
