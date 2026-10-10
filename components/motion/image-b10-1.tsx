"use client";

// Image motions, batch 10 · group 1 (MOTION-MENU M475–M481). Small focused demos for /lab/motion.
// Every demo plays by itself while on screen (a scripted ring stands in for the pointer; the real mouse takes over when it
// moves), loops, pauses off screen, and has a CSS-only glow loop that never stops. ?static=1 / reduced motion: no JS
// motion, the markup shows a sensible final state. Motion ideas only (rebuilt from scratch, no copied code).
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { scene, useTicker } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = {
  sg: "Space Grotesk Variable",
  fr: "Fraunces Variable",
  is: "Instrument Serif",
  sy: "Syne Variable",
  mr: "Manrope Variable",
};

const CSS = `
.b10g1i-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.5)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.2)),transparent 70%);animation:b10g1i-drift 5.4s linear infinite alternate;will-change:transform}
@keyframes b10g1i-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b10g1i-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4);pointer-events:none;z-index:40;opacity:0;transition:opacity .25s}
.m478-pin::after{content:"";position:absolute;inset:-10px;border-radius:50%;border:2px solid rgba(255,255,255,.7);animation:m478-ping 1.5s ease-out infinite}
@keyframes m478-ping{0%{transform:scale(.5);opacity:.9}100%{transform:scale(1.6);opacity:0}}
.m479-ticks{animation:m479-spin 7s linear infinite}
@keyframes m479-spin{to{transform:rotate(360deg)}}
.m481-img{transition:transform .5s ease}
.m481-in .m481-img{transform:scale(1)}.m481-in.on .m481-img,.m481-in:hover .m481-img{transform:scale(1.25)}
.m481-out .m481-img{transform:scale(1.25)}.m481-out.on .m481-img,.m481-out:hover .m481-img{transform:scale(1)}
.m481-tile .m481-tag{transition:opacity .4s, transform .4s;opacity:0;transform:translateY(8px)}
.m481-tile.on .m481-tag,.m481-tile:hover .m481-tag{opacity:1;transform:none}
html.is-static .b10g1i-glow,html.is-static .m478-pin::after,html.is-static .m479-ticks{animation:none}
html.is-static .m481-img{transition:none}
html.is-static {
  .b10g1i-glow,.m478-pin::after,.m479-ticks{animation:none}
  .m481-img{transition:none}
}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0d16] text-[#eef2ff] ${className}`}>
      <style href="b10g1i-css" precedence="default">
        {CSS}
      </style>
      <div className="b10g1i-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/** The glow loop again, ON TOP of photos (screen blend), so full-bleed image demos never read as frozen. */
const Sheen = ({ g1 }: { g1?: string }) => (
  <div className="b10g1i-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.45, zIndex: 35 } as CSSProperties} aria-hidden />
);

/** The visible fake pointer (a ring) that drives hover demos while nobody touches the mouse. */
const Dot = ({ r }: { r: RefObject<HTMLDivElement | null> }) => <div ref={r} className="b10g1i-dot" aria-hidden />;

/** Resolve once the element is within ~1 screen of the viewport (heavy canvas setup never runs at page load). */
const near = (el: Element) =>
  new Promise<void>((res) => {
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          io.disconnect();
          res();
        }
      },
      { rootMargin: "900px 0px" },
    );
    io.observe(el);
  });

type Pt = { x: number; y: number; inside: boolean };
type PtFrame = Pt & { vx: number; vy: number; real: boolean };

/**
 * Pointer driver: every frame (while on screen) gives a pointer position in root px. The real mouse wins for 2.5 s after
 * it last moved; otherwise `script(t, root)` drives a visible fake ring along a set path.
 */
function usePointer(
  root: RefObject<HTMLDivElement | null>,
  dot: RefObject<HTMLDivElement | null>,
  script: (t: number, el: HTMLDivElement) => Pt,
  frame: (p: PtFrame, dt: number, el: HTMLDivElement) => void,
) {
  const real = useRef({ x: 0, y: 0, inside: false, at: -1e9 });
  const sc = useRef(script);
  sc.current = script;
  const fr = useRef(frame);
  fr.current = frame;
  const last = useRef({ x: 0, y: 0, t0: -1 });
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      real.current = { x: e.clientX - r.left, y: e.clientY - r.top, inside: true, at: performance.now() };
    };
    const leave = () => (real.current = { ...real.current, inside: false, at: performance.now() });
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [root]);
  useTicker(root, (t, dt) => {
    const el = root.current;
    if (!el) return;
    const L = last.current;
    if (L.t0 < 0) L.t0 = t;
    const R = real.current;
    const useReal = performance.now() - R.at < 2500;
    const p = useReal ? { x: R.x, y: R.y, inside: R.inside } : sc.current(t - L.t0, el);
    const d = Math.max(dt, 1 / 240);
    const vx = (p.x - L.x) / d;
    const vy = (p.y - L.y) / d;
    L.x = p.x;
    L.y = p.y;
    const dn = dot.current;
    if (dn) {
      dn.style.transform = `translate3d(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px,0)`;
      dn.style.opacity = useReal ? "0" : "1";
    }
    fr.current({ ...p, vx, vy, real: useReal }, Math.min(dt, 0.1), el);
  });
}

const easeIO = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/** A path that rests at each point and glides to the next during the last `move` part of every `seg` seconds. */
function stepPath(t: number, pts: [number, number][], seg: number, move = 0.4): [number, number] {
  const n = pts.length;
  const k = Math.floor(t / seg);
  const f = t / seg - k;
  const a = pts[k % n];
  const b = pts[(k + 1) % n];
  const m = f < 1 - move ? 0 : easeIO((f - (1 - move)) / move);
  return [a[0] + (b[0] - a[0]) * m, a[1] + (b[1] - a[1]) * m];
}

/** An element's box relative to the root. */
function rel(node: Element, root: Element) {
  const a = node.getBoundingClientRect();
  const r = root.getBoundingClientRect();
  return { l: a.left - r.left, t: a.top - r.top, w: a.width, h: a.height };
}

/** Index of the first element under (x, y), or -1. */
function hit(nodes: Element[], root: Element, x: number, y: number) {
  return nodes.findIndex((n) => {
    const b = rel(n, root);
    return x >= b.l && x <= b.l + b.w && y >= b.t && y <= b.t + b.h;
  });
}

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, className = "", style, label = "", w = 1200, h = 900 }: { i: number; className?: string; style?: CSSProperties; label?: string; w?: number; h?: number }) => (
  <img src={scene(i, w, h, label)} alt="" className={`h-full w-full object-cover ${className}`} style={style} draggable={false} />
);

/* ───────────────────────── M475 · Direction-aware second-image reveal ───────────────────────── */
type Side = "top" | "right" | "bottom" | "left";
const M475_OFF: Record<Side, { xPercent: number; yPercent: number }> = {
  top: { xPercent: 0, yPercent: -101 },
  right: { xPercent: 101, yPercent: 0 },
  bottom: { xPercent: 0, yPercent: 101 },
  left: { xPercent: -101, yPercent: 0 },
};
const M475_TILES = [
  { a: 0, b: 2, n: "Glacier tonic", p: "₹240" },
  { a: 3, b: 1, n: "Ember cola", p: "₹220" },
  { a: 2, b: 0, n: "Orchard fizz", p: "₹260" },
];
// tile boxes in stage fractions: x 8–34, 37–63, 66–92 · y 30–84
const M475_PATH: [number, number][] = [
  [0.02, 0.57],
  [0.21, 0.57], // T0 in from the left
  [0.21, 0.19], // out through the top
  [0.5, 0.19],
  [0.5, 0.57], // T1 in from the top
  [0.5, 0.94], // out through the bottom
  [0.79, 0.94],
  [0.79, 0.57], // T2 in from the bottom
  [0.98, 0.57], // out right
  [0.79, 0.57], // T2 in from the right
  [0.5, 0.57], // out left → T1 in from the right
  [0.21, 0.57], // T0 in from the right
  [0.21, 0.94], // out through the bottom
  [0.02, 0.94],
];
function M475() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const st = useRef<{ inside: boolean[]; ready: boolean }>({ inside: [false, false, false], ready: false });
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const ovs = el.querySelectorAll<HTMLElement>(".m475-ov");
    gsap.set(ovs, { xPercent: -101, yPercent: 0, visibility: "visible" });
    st.current.ready = true;
    return () => {
      gsap.killTweensOf(ovs);
      gsap.set(ovs, { clearProps: "all" });
      st.current = { inside: [false, false, false], ready: false };
    };
  }, []);
  usePointer(
    root,
    dot,
    (t, el) => {
      const [x, y] = stepPath(t, M475_PATH, 0.62, 0.62);
      return { x: x * el.clientWidth, y: y * el.clientHeight, inside: true };
    },
    (p, _dt, el) => {
      const s = st.current;
      if (!s.ready) return;
      el.querySelectorAll<HTMLElement>(".m475-tile").forEach((tile, i) => {
        const b = rel(tile, el);
        const inside = p.inside && p.x >= b.l && p.x <= b.l + b.w && p.y >= b.t && p.y <= b.t + b.h;
        if (inside === s.inside[i]) return;
        s.inside[i] = inside;
        // which edge: compare the pointer's offset from the centre, normalised by the tile's half sizes
        const dx = (p.x - (b.l + b.w / 2)) / (b.w / 2);
        const dy = (p.y - (b.t + b.h / 2)) / (b.h / 2);
        const side: Side = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : dy < 0 ? "top" : "bottom";
        const ov = tile.querySelector<HTMLElement>(".m475-ov");
        const tag = tile.querySelector<HTMLElement>(".m475-dir");
        if (tag) tag.textContent = `${inside ? "in" : "out"} · ${side}`;
        if (!ov) return;
        if (inside) gsap.fromTo(ov, M475_OFF[side], { xPercent: 0, yPercent: 0, duration: 0.35, ease: "power2.out", overwrite: true });
        else gsap.to(ov, { ...M475_OFF[side], duration: 0.35, ease: "power2.out", overwrite: true });
      });
    },
  );
  return (
    <Stage r={root} g1="rgba(79,141,255,.5)" g2="rgba(255,122,89,.24)">
      <div className="absolute left-[8%] right-[8%] top-[7%] flex items-end justify-between">
        <h3 className="text-[clamp(30px,3vw,48px)] leading-none" style={{ fontFamily: F.fr, fontWeight: 500 }}>
          Small-batch sodas
        </h3>
        <p className="text-[13px] uppercase tracking-[0.2em] text-white/55" style={{ fontFamily: F.sg }}>
          Fizzwell · hover a can
        </p>
      </div>
      {M475_TILES.map((t, i) => (
        <div key={t.n} className="m475-tile absolute top-[30%] h-[54%] w-[26%] overflow-hidden rounded-[18px] border border-white/10" style={{ left: `${8 + i * 29}%` }}>
          <Img i={t.a} w={700} h={800} />
          <div className="m475-ov absolute inset-0" style={{ visibility: "hidden" }}>
            <Img i={t.b} w={700} h={800} />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-5 pb-4 pt-12">
              <p className="text-[22px] text-white" style={{ fontFamily: F.fr }}>
                {t.n}
              </p>
              <p className="mt-1 text-[14px] text-white/75" style={{ fontFamily: F.sg }}>
                {t.p} · 330 ml
              </p>
            </div>
          </div>
          <span className="m475-dir absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 text-[12px] uppercase tracking-[0.16em] text-white/85" style={{ fontFamily: F.sg }}>
            hover
          </span>
        </div>
      ))}
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M476 · Cursor circle shows second layer ───────────────────────── */
const M476Copy = ({ night }: { night?: boolean }) => (
  <div className="absolute left-[6%] top-[9%]" style={{ color: night ? "#ffb36b" : "#eaf5ff" }}>
    <p className="text-[13px] uppercase tracking-[0.22em] opacity-70" style={{ fontFamily: F.sg }}>
      {night ? "After dark · SS26" : "By day · SS26"}
    </p>
    <h3 className="mt-2 text-[clamp(44px,5vw,84px)] leading-[0.92]" style={{ fontFamily: F.is, fontStyle: night ? "italic" : "normal" }}>
      The Coastline
      <br />
      Capsule
    </h3>
  </div>
);
function M476() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const st = useRef({ x: -1, y: -1, r: 0 });
  usePointer(
    root,
    dot,
    (t, el) => {
      const keys = [...el.querySelectorAll(".m476-key")].map((k) => {
        const b = rel(k, el);
        return [(b.l + b.w / 2) / el.clientWidth, (b.t + b.h / 2) / el.clientHeight] as [number, number];
      });
      const pts: [number, number][] = [[0.3, 0.42], keys[0] ?? [0.2, 0.75], [0.55, 0.3], [0.72, 0.58], keys[1] ?? [0.8, 0.75], [0.46, 0.62]];
      const [x, y] = stepPath(t, pts, 0.9, 0.55);
      return { x: (x + Math.sin(t * 2.1) * 0.012) * el.clientWidth, y: (y + Math.cos(t * 1.7) * 0.015) * el.clientHeight, inside: true };
    },
    (p, dt, el) => {
      const s = st.current;
      if (s.x < 0) {
        s.x = p.x;
        s.y = p.y;
      }
      // the circle eases after the pointer (lag), and grows over the key items
      const k = 1 - Math.exp(-dt * 7);
      s.x += (p.x - s.x) * k;
      s.y += (p.y - s.y) * k;
      const keys = [...el.querySelectorAll(".m476-key")];
      const over = p.inside && hit(keys, el, p.x, p.y) >= 0;
      const target = !p.inside ? 0 : over ? Math.min(el.clientWidth, el.clientHeight) * 0.42 : Math.min(el.clientWidth, el.clientHeight) * 0.19;
      s.r += (target - s.r) * (1 - Math.exp(-dt * 6));
      const top = el.querySelector<HTMLElement>(".m476-top");
      if (top) top.style.clipPath = `circle(${s.r.toFixed(1)}px at ${s.x.toFixed(1)}px ${s.y.toFixed(1)}px)`;
      keys.forEach((kk, i) => kk.classList.toggle("ring-2", over && hit(keys, el, p.x, p.y) === i));
    },
  );
  return (
    <Stage r={root} g1="rgba(255,122,89,.5)">
      <div className="absolute inset-0">
        <Img i={0} w={1600} h={900} />
        <M476Copy />
      </div>
      <div className="m476-top absolute inset-0" style={{ clipPath: "circle(22% at 60% 45%)" }}>
        <Img i={1} w={1600} h={900} />
        <M476Copy night />
      </div>
      <button type="button" className="m476-key absolute bottom-[12%] left-[8%] rounded-full bg-black/55 px-6 py-3 text-[15px] font-[600] text-white ring-white/80 backdrop-blur" style={{ fontFamily: F.sg }}>
        Shop the look · ₹7,400
      </button>
      <button type="button" className="m476-key absolute bottom-[12%] right-[8%] rounded-full bg-black/55 px-6 py-3 text-[15px] font-[600] text-white ring-white/80 backdrop-blur" style={{ fontFamily: F.sg }}>
        See both palettes
      </button>
      <Sheen g1="rgba(255,179,107,.5)" />
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M477 · Cursor erases cover layer (refills) ───────────────────────── */
function M477() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const st = useRef<{ ctx: CanvasRenderingContext2D | null; cover: HTMLCanvasElement | null; dpr: number; lx: number; ly: number; fresh: boolean }>({ ctx: null, cover: null, dpr: 1, lx: -1, ly: -1, fresh: true });
  useEffect(() => {
    const el = root.current;
    const c = cv.current;
    if (!el || !c || prefersReducedMotion()) return;
    let dead = false;
    let ro: ResizeObserver | null = null;
    const build = () => {
      const s = st.current;
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      const w = el.clientWidth;
      const h = el.clientHeight;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      // the cover artwork (solid colour + type) is drawn once; the refill fades it back in over the erased trail
      const cover = document.createElement("canvas");
      cover.width = c.width;
      cover.height = c.height;
      const g = cover.getContext("2d")!;
      g.scale(dpr, dpr);
      g.fillStyle = "#e9e1d3";
      g.fillRect(0, 0, w, h);
      g.fillStyle = "rgba(43,33,24,.07)";
      for (let y = 0; y < h; y += 28) g.fillRect(0, y, w, 1);
      g.fillStyle = "#2b2118";
      g.font = `500 ${Math.round(Math.min(w * 0.075, 110))}px "${F.fr}", Georgia, serif`;
      g.textBaseline = "alphabetic";
      g.fillText("Draw to reveal", w * 0.06, h * 0.3);
      g.font = `600 13px "${F.sg}", system-ui, sans-serif`;
      g.fillStyle = "rgba(43,33,24,.6)";
      g.fillText("VERDANT HOUSE · THE FERN EDIT", w * 0.06, h * 0.1);
      g.fillText("RUN THE CURSOR ACROSS THE PAPER", w * 0.06, h * 0.92);
      const ctx = c.getContext("2d")!;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.drawImage(cover, 0, 0);
      Object.assign(st.current, { ctx, cover, dpr, fresh: true });
      s.lx = -1;
    };
    near(el)
      .then(() => document.fonts?.ready)
      .then(() => {
        if (dead) return;
        build();
        ro = new ResizeObserver(() => build());
        ro.observe(el);
      });
    return () => {
      dead = true;
      ro?.disconnect();
      st.current.ctx = null;
      st.current.cover = null;
    };
  }, []);
  usePointer(
    root,
    dot,
    (t, el) => ({
      x: (0.5 + Math.sin(t * 1.15) * 0.38 + Math.sin(t * 2.9) * 0.04) * el.clientWidth,
      y: (0.52 + Math.sin(t * 2.3 + 0.6) * 0.3) * el.clientHeight,
      inside: true,
    }),
    (p, dt) => {
      const s = st.current;
      const ctx = s.ctx;
      const c = cv.current;
      if (!ctx || !s.cover || !c) return;
      // 1) refill: the cover fades back over the trail (~1 s to close)
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1 - Math.pow(0.03, dt);
      ctx.drawImage(s.cover, 0, 0);
      ctx.globalAlpha = 1;
      // 2) erase: soft round brush stamped along the pointer's segment
      if (!p.inside) {
        s.lx = -1;
        return;
      }
      const x = p.x * s.dpr;
      const y = p.y * s.dpr;
      if (s.lx < 0) {
        s.lx = x;
        s.ly = y;
      }
      const R = 95 * s.dpr;
      ctx.globalCompositeOperation = "destination-out";
      const dist = Math.hypot(x - s.lx, y - s.ly);
      const steps = Math.max(1, Math.ceil(dist / (R * 0.18)));
      for (let i = 1; i <= steps; i++) {
        const sx = s.lx + ((x - s.lx) * i) / steps;
        const sy = s.ly + ((y - s.ly) * i) / steps;
        const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, R);
        g.addColorStop(0, "rgba(0,0,0,.55)");
        g.addColorStop(0.55, "rgba(0,0,0,.3)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(sx, sy, R, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
      s.lx = x;
      s.ly = y;
    },
  );
  return (
    <Stage r={root} g1="rgba(24,196,143,.5)">
      <div className="absolute inset-0">
        <Img i={2} w={1600} h={900} />
        <div className="absolute bottom-[9%] right-[6%] text-right text-[#f1fff4]">
          <p className="text-[13px] uppercase tracking-[0.22em] text-white/65" style={{ fontFamily: F.sg }}>
            Fern serum · 30 ml
          </p>
          <p className="mt-1 text-[clamp(30px,3vw,48px)]" style={{ fontFamily: F.fr }}>
            ₹1,890
          </p>
        </div>
      </div>
      <canvas ref={cv} className="absolute inset-0 h-full w-full" aria-hidden />
      <Sheen g1="rgba(200,255,138,.45)" />
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M478 · Hotspots light up the image ───────────────────────── */
const M478_SPOTS = [
  { x: 0.5, y: 0.34, n: "Brushed steel cap", d: "Twist-lock, leak-proof", p: "₹1,290" },
  { x: 0.58, y: 0.56, n: "Double-wall body", d: "Cold 24 h · hot 12 h", p: "₹2,450" },
  { x: 0.42, y: 0.74, n: "Grip band", d: "Recycled silicone", p: "₹390" },
  { x: 0.5, y: 0.86, n: "Weighted base", d: "Won't tip on a desk", p: "₹590" },
];
function M478() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const st = useRef({ hover: 0, open: 0, r: 170, x: M478_SPOTS[0].x, y: M478_SPOTS[0].y, dwell: 0, clicked: false });
  const openCard = (el: HTMLElement, i: number) => {
    const s = st.current;
    if (s.open === i) return;
    s.open = i;
    const card = el.querySelector<HTMLElement>(".m478-card");
    if (!card) return;
    const sp = M478_SPOTS[i];
    gsap.to(card, {
      autoAlpha: 0,
      y: 10,
      duration: 0.15,
      overwrite: true,
      onComplete: () => {
        const [n, d, p] = card.querySelectorAll<HTMLElement>("[data-f]");
        n.textContent = sp.n;
        d.textContent = sp.d;
        p.textContent = sp.p;
        card.style.left = `calc(${(sp.x * 100).toFixed(1)}% + 46px)`;
        card.style.top = `calc(${(sp.y * 100).toFixed(1)}% - 40px)`;
        gsap.fromTo(card, { autoAlpha: 0, y: 10, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.3, ease: "power3.out" });
      },
    });
    el.querySelectorAll<HTMLElement>(".m478-pin").forEach((pin, k) => (pin.style.background = k === i ? "#fff" : "rgba(255,255,255,.2)"));
  };
  usePointer(
    root,
    dot,
    (t, el) => {
      const img = el.querySelector(".m478-img");
      const b = img ? rel(img, el) : { l: 0, t: 0, w: el.clientWidth, h: el.clientHeight };
      const pts: [number, number][] = M478_SPOTS.map((sp) => [b.l + sp.x * b.w, b.t + sp.y * b.h]);
      pts.splice(2, 0, [b.l + b.w * 0.85, b.t + b.h * 0.45]);
      const [x, y] = stepPath(t, pts, 1, 0.5);
      return { x, y, inside: true };
    },
    (p, dt, el) => {
      const s = st.current;
      const img = el.querySelector<HTMLElement>(".m478-img");
      if (!img) return;
      const b = rel(img, el);
      let hov = -1;
      M478_SPOTS.forEach((sp, i) => {
        if (Math.hypot(p.x - (b.l + sp.x * b.w), p.y - (b.t + sp.y * b.h)) < 46) hov = i;
      });
      if (hov !== s.hover) {
        s.hover = hov;
        s.dwell = 0;
        s.clicked = false;
      }
      if (hov >= 0) {
        s.x = M478_SPOTS[hov].x;
        s.y = M478_SPOTS[hov].y;
        s.dwell += dt;
        // scripted "click" after a short dwell opens the hotspot's content (a real click does it at once)
        if (!p.real && !s.clicked && s.dwell > 0.15) {
          s.clicked = true;
          dot.current?.animate([{ boxShadow: "0 0 0 0 rgba(255,255,255,.8)" }, { boxShadow: "0 0 0 26px rgba(255,255,255,0)" }], { duration: 420, easing: "ease-out" });
          openCard(el, hov);
        }
      }
      const target = hov >= 0 ? Math.min(b.w, b.h) * 0.36 : 0;
      s.r += (target - s.r) * (1 - Math.exp(-dt * 7));
      img.style.setProperty("--x", `${(s.x * 100).toFixed(2)}%`);
      img.style.setProperty("--y", `${(s.y * 100).toFixed(2)}%`);
      img.style.setProperty("--r", `${s.r.toFixed(1)}px`);
    },
  );
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const pins = [...el.querySelectorAll<HTMLElement>(".m478-pin")];
    const fns = pins.map((pin, i) => {
      const f = () => openCard(el, i);
      pin.addEventListener("click", f);
      return f;
    });
    return () => pins.forEach((pin, i) => pin.removeEventListener("click", fns[i]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const mask = "radial-gradient(circle at var(--x) var(--y), #000 0, #000 calc(var(--r) * .4), transparent var(--r))";
  return (
    <Stage r={root} g1="rgba(79,141,255,.5)">
      <div className="absolute left-[6%] top-[9%] max-w-[30%]">
        <p className="text-[13px] uppercase tracking-[0.22em] text-white/55" style={{ fontFamily: F.sg }}>
          Trailcraft · 750 ml flask
        </p>
        <h3 className="mt-2 text-[clamp(34px,3.4vw,56px)] leading-[0.95]" style={{ fontFamily: F.fr, fontWeight: 500 }}>
          Built for the long climb
        </h3>
        <p className="mt-4 text-[15px] text-white/60" style={{ fontFamily: F.mr }}>
          Tap a point to see what makes it.
        </p>
      </div>
      <div
        className="m478-img absolute left-[40%] top-[7%] h-[86%] w-[54%] overflow-hidden rounded-[22px]"
        style={{ "--x": `${M478_SPOTS[0].x * 100}%`, "--y": `${M478_SPOTS[0].y * 100}%`, "--r": "170px" } as CSSProperties}
      >
        <Img i={0} w={1000} h={1000} style={{ filter: "brightness(.3) saturate(.45)" }} />
        <div className="absolute inset-0" style={{ maskImage: mask, WebkitMaskImage: mask }}>
          <Img i={0} w={1000} h={1000} />
        </div>
        {M478_SPOTS.map((sp, i) => (
          <button
            key={sp.n}
            type="button"
            aria-label={sp.n}
            className="m478-pin absolute h-[18px] w-[18px] rounded-full border-2 border-white"
            style={{ left: `${sp.x * 100}%`, top: `${sp.y * 100}%`, margin: "-9px 0 0 -9px", background: i === 0 ? "#fff" : "rgba(255,255,255,.2)" }}
          />
        ))}
        <div className="m478-card pointer-events-none absolute w-[230px] rounded-[14px] bg-[#0d1322]/90 p-4 shadow-[0_18px_40px_rgba(0,0,0,.5)] backdrop-blur" style={{ left: `calc(${M478_SPOTS[0].x * 100}% + 46px)`, top: `calc(${M478_SPOTS[0].y * 100}% - 40px)` }}>
          <p data-f className="text-[18px]" style={{ fontFamily: F.fr }}>
            {M478_SPOTS[0].n}
          </p>
          <p data-f className="mt-1 text-[13px] text-white/60" style={{ fontFamily: F.mr }}>
            {M478_SPOTS[0].d}
          </p>
          <p data-f className="mt-2 text-[15px] font-[600] text-[#9fd8ff]" style={{ fontFamily: F.sg }}>
            {M478_SPOTS[0].p}
          </p>
        </div>
      </div>
      <Sheen g1="rgba(79,141,255,.5)" />
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M479 · Parked loupe tour (variant of M165: no pointer, parked spots on a timer) ───────────────────────── */
const M479_Z = 2.4;
const M479_L = 190; // loupe diameter px
const M479_SPOTS = [
  { x: 0.5, y: 0.2, n: "Hand-cut glass stopper" },
  { x: 0.57, y: 0.5, n: "Brushed brass collar" },
  { x: 0.45, y: 0.66, n: "Amber, aged 90 days" },
  { x: 0.52, y: 0.82, n: "Weighted crystal base" },
];
const M479_SRC = scene(1, 1000, 1000);
function m479Bg(x: number, y: number, z: number, S: number): CSSProperties {
  return {
    left: x * S - M479_L / 2,
    top: y * S - M479_L / 2,
    backgroundSize: `${(S * z).toFixed(1)}px ${(S * z).toFixed(1)}px`,
    backgroundPosition: `${(M479_L / 2 - x * S * z).toFixed(1)}px ${(M479_L / 2 - y * S * z).toFixed(1)}px`,
  };
}
function M479() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const box = el.querySelector<HTMLElement>(".m479-box");
    const lp = el.querySelector<HTMLElement>(".m479-loupe");
    const labels = [...el.querySelectorAll<HTMLElement>(".m479-label")];
    if (!box || !lp) return;
    const P = { x: M479_SPOTS[0].x, y: M479_SPOTS[0].y, z: M479_Z };
    const render = () => Object.assign(lp.style, Object.fromEntries(Object.entries(m479Bg(P.x, P.y, P.z, box.clientWidth)).map(([k, v]) => [k, typeof v === "number" ? `${v}px` : v])));
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, paused: true, onUpdate: render });
      M479_SPOTS.forEach((_, i) => {
        const nx = M479_SPOTS[(i + 1) % M479_SPOTS.length];
        // parked: the magnification breathes a little (never frozen), then a ~1 s glide to the next spot
        tl.to(P, { z: M479_Z + 0.25, duration: 0.5, ease: "sine.inOut" })
          .to(P, { x: nx.x, y: nx.y, z: M479_Z, duration: 1, ease: "power2.inOut" })
          .to(labels[i], { autoAlpha: 0, x: -10, duration: 0.3 }, "<")
          .fromTo(labels[(i + 1) % labels.length], { autoAlpha: 0, x: 12 }, { autoAlpha: 1, x: 0, duration: 0.4, immediateRender: false }, "<0.6");
      });
      const io = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) tl.play();
        else tl.pause();
      });
      io.observe(el);
      render();
      return () => io.disconnect();
    }, el);
    const ro = new ResizeObserver(render);
    ro.observe(box);
    return () => {
      ro.disconnect();
      ctx.revert();
    };
  }, []);
  return (
    <Stage r={root} g1="rgba(255,77,109,.5)" g2="rgba(255,179,107,.26)">
      <div className="absolute left-[6%] top-[10%] max-w-[30%]">
        <p className="text-[13px] uppercase tracking-[0.22em] text-white/55" style={{ fontFamily: F.sg }}>
          Maison Calder · Eau de parfum
        </p>
        <h3 className="mt-2 text-[clamp(38px,3.8vw,62px)] leading-[0.95]" style={{ fontFamily: F.is }}>
          Ash No. 7
        </h3>
        <p className="mt-3 text-[clamp(22px,2vw,30px)] text-[#ffb36b]" style={{ fontFamily: F.fr }}>
          ₹6,400 · 50 ml
        </p>
        <div className="relative mt-8 h-[40px]">
          {M479_SPOTS.map((s, i) => (
            <p key={s.n} className="m479-label absolute left-0 top-0 whitespace-nowrap text-[18px] text-white/85" style={{ fontFamily: F.mr, visibility: i === 0 ? "visible" : "hidden" }}>
              <span className="mr-3 inline-block h-[2px] w-8 bg-[#ffb36b] align-middle" />
              {s.n}
            </p>
          ))}
        </div>
      </div>
      <div className="m479-box absolute right-[10%] top-1/2 aspect-square h-[86%] -translate-y-1/2 overflow-hidden rounded-[24px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={M479_SRC} alt="" className="h-full w-full object-cover" draggable={false} />
        <div
          className="m479-loupe absolute overflow-hidden rounded-full border-[3px] border-white/90 shadow-[0_20px_50px_rgba(0,0,0,.55)]"
          style={{ width: M479_L, height: M479_L, backgroundImage: `url("${M479_SRC}")`, backgroundRepeat: "no-repeat", ...m479Bg(M479_SPOTS[0].x, M479_SPOTS[0].y, M479_Z, 540) }}
        >
          <svg className="m479-ticks absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden>
            {Array.from({ length: 24 }, (_, k) => (
              <line key={k} x1="50" y1="2" x2="50" y2={k % 6 === 0 ? 8 : 5} stroke="rgba(255,255,255,.7)" strokeWidth="0.8" transform={`rotate(${k * 15} 50 50)`} />
            ))}
          </svg>
        </div>
      </div>
      <Sheen g1="rgba(255,122,89,.42)" />
    </Stage>
  );
}

/* ───────────────────────── M480 · Zoom at cursor point (variant of M13: zoom 1→1.8 around the pointer) ───────────────────────── */
function M480() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const st = useRef({ s: 1, ox: 50, oy: 50 });
  usePointer(
    root,
    dot,
    (t, el) => {
      const fr = el.querySelector(".m480-frame");
      const b = fr ? rel(fr, el) : { l: 0, t: 0, w: el.clientWidth, h: el.clientHeight };
      const pts: [number, number][] = [
        [-0.12, 0.5], // outside: zoom out
        [0.3, 0.35],
        [0.62, 0.3],
        [0.7, 0.62],
        [0.4, 0.72],
        [0.5, 1.14], // outside again
      ];
      const [x, y] = stepPath(t, pts, 0.75, 0.62);
      return { x: b.l + x * b.w + Math.sin(t * 1.9) * 10, y: b.t + y * b.h + Math.cos(t * 2.3) * 8, inside: true };
    },
    (p, dt, el) => {
      const s = st.current;
      const fr = el.querySelector<HTMLElement>(".m480-frame");
      const img = el.querySelector<HTMLElement>(".m480-img");
      if (!fr || !img) return;
      const b = rel(fr, el);
      const inside = p.inside && p.x >= b.l && p.x <= b.l + b.w && p.y >= b.t && p.y <= b.t + b.h;
      const k = 1 - Math.exp(-dt * 7);
      s.s += ((inside ? 1.8 : 1) - s.s) * k;
      if (inside) {
        s.ox += (((p.x - b.l) / b.w) * 100 - s.ox) * (1 - Math.exp(-dt * 10));
        s.oy += (((p.y - b.t) / b.h) * 100 - s.oy) * (1 - Math.exp(-dt * 10));
      }
      img.style.transformOrigin = `${s.ox.toFixed(2)}% ${s.oy.toFixed(2)}%`;
      img.style.transform = `scale(${s.s.toFixed(4)})`;
      const ro = el.querySelector<HTMLElement>(".m480-read");
      if (ro) ro.textContent = `${s.s.toFixed(2)}× · ${Math.round(s.ox)}% ${Math.round(s.oy)}%`;
    },
  );
  return (
    <Stage r={root} g1="rgba(224,145,63,.5)" g2="rgba(79,141,255,.2)">
      <div className="m480-frame absolute left-[6%] top-[8%] h-[84%] w-[52%] overflow-hidden rounded-[22px] border border-white/10">
        <Img i={3} w={1200} h={1000} className="m480-img" style={{ transformOrigin: "50% 50%" }} />
      </div>
      <div className="absolute left-[64%] top-[14%] w-[30%]">
        <p className="text-[13px] uppercase tracking-[0.22em] text-white/55" style={{ fontFamily: F.sg }}>
          Strideworks · Trail runner
        </p>
        <h3 className="mt-2 text-[clamp(36px,3.6vw,58px)] leading-[0.95]" style={{ fontFamily: F.fr, fontWeight: 500 }}>
          Trailform 2
        </h3>
        <p className="mt-3 text-[clamp(22px,2vw,30px)] text-[#ffd59a]" style={{ fontFamily: F.sg }}>
          ₹8,990
        </p>
        <p className="mt-5 text-[15px] leading-relaxed text-white/60" style={{ fontFamily: F.mr }}>
          Hover to inspect the knit, the lugs and the stitching up close.
        </p>
        <p className="m480-read mt-8 inline-block rounded-full border border-white/20 px-4 py-2 text-[13px] tracking-[0.08em] text-white/80" style={{ fontFamily: F.sg }}>
          1.00× · 50% 50%
        </p>
      </div>
      <Sheen g1="rgba(255,213,154,.4)" />
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M481 · Hover zoom inside frame (zoom in · zoom out) ───────────────────────── */
const M481_ITEMS = [
  ["Sunday tote", "₹2,400"],
  ["Rib knit", "₹3,100"],
  ["Coast cap", "₹990"],
  ["Field watch", "₹12,900"],
  ["Linen shirt", "₹4,200"],
  ["Clay mug", "₹650"],
  ["Trail sock", "₹450"],
  ["Desk lamp", "₹5,800"],
];
function M481() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const st = useRef(-1);
  usePointer(
    root,
    dot,
    (t, el) => {
      const tiles = [...el.querySelectorAll(".m481-tile")];
      const order = [0, 1, 2, 3, 7, 6, 5, 4];
      const pts: [number, number][] = order.map((i) => {
        const b = rel(tiles[i], el);
        return [b.l + b.w * 0.5, b.t + b.h * 0.5];
      });
      const [x, y] = stepPath(t, pts, 0.85, 0.42);
      return { x: x + Math.sin(t * 2.4) * 14, y: y + Math.cos(t * 1.9) * 10, inside: true };
    },
    (p, _dt, el) => {
      const tiles = [...el.querySelectorAll(".m481-tile")];
      const idx = p.inside ? hit(tiles, el, p.x, p.y) : -1;
      if (idx === st.current) return;
      st.current = idx;
      tiles.forEach((tl, i) => tl.classList.toggle("on", i === idx));
    },
  );
  return (
    <Stage r={root} g1="rgba(24,196,143,.5)" g2="rgba(79,141,255,.24)">
      <div className="absolute left-[6%] right-[6%] top-[6%] flex items-end justify-between">
        <h3 className="text-[clamp(30px,3vw,48px)] leading-none" style={{ fontFamily: F.fr, fontWeight: 500 }}>
          New this week
        </h3>
        <p className="text-[13px] uppercase tracking-[0.2em] text-white/55" style={{ fontFamily: F.sg }}>
          Oakhaven goods · 8 pieces
        </p>
      </div>
      {[0, 1].map((row) => (
        <div key={row} className="absolute left-[6%] right-[6%] grid grid-cols-[110px_repeat(4,1fr)] items-center gap-[1.6%]" style={{ top: row === 0 ? "19%" : "58%", height: "36%" }}>
          <p className="text-[13px] uppercase tracking-[0.2em] text-white/60" style={{ fontFamily: F.sg }}>
            {row === 0 ? "Zoom in" : "Zoom out"}
          </p>
          {M481_ITEMS.slice(row * 4, row * 4 + 4).map(([n, pr], k) => (
            <div key={n} className={`m481-tile ${row === 0 ? "m481-in" : "m481-out"} relative h-full overflow-hidden rounded-[16px] border border-white/10`}>
              <Img i={(k + row * 2) % 4} w={700} h={520} className="m481-img" />
              <div className="m481-tag absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-8 text-[14px] text-white" style={{ fontFamily: F.sg }}>
                <span>{n}</span>
                <span className="text-white/75">{pr}</span>
              </div>
            </div>
          ))}
        </div>
      ))}
      <Dot r={dot} />
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  {
    code: "M475",
    name: "Direction-aware second-image reveal",
    how: "Hover: the second image slides in from the edge the pointer entered and leaves toward the edge it exits (0.35 s); auto-tours all four sides.",
    kind: "play",
    C: M475,
  },
  {
    code: "M476",
    name: "Cursor circle shows second layer",
    how: "Hover: a lagging circle around the pointer shows a second photo layer through the first, and grows over the key buttons.",
    kind: "play",
    C: M476,
  },
  {
    code: "M477",
    name: "Cursor erases cover layer (refills)",
    how: "Hover: the pointer erases a soft trail through a paper-coloured cover to show the photo, and the cover fades back in about a second.",
    kind: "play",
    C: M477,
  },
  {
    code: "M478",
    name: "Hotspots light up the image",
    how: "Hover a hotspot: the dimmed photo lights up in a soft circle around it; a click opens its detail card. Auto-walks the points.",
    kind: "play",
    C: M478,
  },
  {
    code: "M479",
    name: "Parked loupe tour",
    how: "Auto: a 2.4× loupe sits parked on one product detail, then glides (~1 s) to the next spot while its caption swaps.",
    kind: "play",
    C: M479,
  },
  {
    code: "M480",
    name: "Zoom at cursor point",
    how: "Hover: the photo zooms 1→1.8 inside its frame with the origin under the pointer, so it inspects whatever you point at.",
    kind: "play",
    C: M480,
  },
  {
    code: "M481",
    name: "Hover zoom inside frame",
    how: "Hover: each photo zooms 1→1.25 inside its fixed frame (0.5 s); the second row runs the other way, zooming out. Auto-hovers in turn.",
    kind: "play",
    C: M481,
  },
];
