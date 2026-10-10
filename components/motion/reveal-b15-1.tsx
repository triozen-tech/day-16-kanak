"use client";

// MOTION-MENU M664–M667 (reveal group, batch 15 · group 1): small focused demos for /lab/motion.
// "play" demos start when on screen, loop, and pause off screen. Every demo also has a CSS-only glow loop (and a second
// one on top, screen-blended, so covered stages never freeze). ?static=1 / reduced motion: no JS motion, the markup
// shows the final state.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { scene, useTicker } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const GROTESK = "'Space Grotesk Variable', system-ui, sans-serif";
const SERIF = "'Fraunces Variable', Georgia, serif";
const WIDE = "'Syne Variable', 'Space Grotesk Variable', system-ui, sans-serif";

const CSS = `
.b15r1-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.5)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.22)),transparent 70%);animation:b15r1-drift 5.2s linear infinite alternate;will-change:transform}
@keyframes b15r1-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b15r1-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;pointer-events:none;z-index:40;opacity:0;transition:opacity .25s}
.b15r1-dot>span{display:block;width:100%;height:100%;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4)}

/* M666 floor glow */
.m666-g{position:absolute;left:-10%;right:-10%;bottom:0;height:88%;transform-origin:50% 100%;-webkit-mask-image:linear-gradient(to top,#000 30%,transparent 100%);mask-image:linear-gradient(to top,#000 30%,transparent 100%);overflow:hidden}
.m666-band{position:absolute;inset:0 -50% 0 -50%;background:radial-gradient(28% 70% at 20% 100%,rgba(255,94,135,.85),transparent 72%),radial-gradient(26% 80% at 38% 100%,rgba(255,190,90,.8),transparent 72%),radial-gradient(28% 75% at 56% 100%,rgba(120,240,170,.75),transparent 72%),radial-gradient(28% 85% at 74% 100%,rgba(90,160,255,.85),transparent 72%),radial-gradient(26% 70% at 90% 100%,rgba(190,120,255,.8),transparent 72%);animation:m666-pan 7s linear infinite alternate;will-change:transform}
@keyframes m666-pan{0%{transform:translate3d(-12%,0,0)}100%{transform:translate3d(12%,0,0)}}

/* M667 shattered glass */
.m667-f{position:absolute;inset:0;will-change:transform}
.m667-in{position:absolute;inset:0}
.m667-glass{position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.16),rgba(255,255,255,.03) 55%,rgba(255,255,255,.1))}
.m667-spec{position:absolute;inset:0;background:radial-gradient(circle at var(--sx,30%) var(--sy,30%),rgba(255,255,255,.55),rgba(255,255,255,0) 38%);mix-blend-mode:screen;opacity:var(--so,.5)}

html.is-static .b15r1-glow,html.is-static .m666-band{animation:none}
html.is-static {.b15r1-glow,.m666-band{animation:none}}
`;

/* ---------- shared helpers (local copies) ---------- */

function Stage({ r, children, bg = "#0a0d16", g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; bg?: string; g1?: string; g2?: string }) {
  return (
    <div ref={r} className="relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 text-[#eef2ff]" style={{ background: bg }}>
      <style href="b15r1-css" precedence="default">
        {CSS}
      </style>
      <div className="b15r1-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/** The CSS glow loop again, ON TOP (screen blend), so covered stages never freeze. */
const Sheen = ({ g1 }: { g1?: string }) => (
  <div className="b15r1-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.45, zIndex: 35 } as CSSProperties} aria-hidden />
);

/** Play: a looping timeline that starts when the demo is on screen and pauses off screen. */
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

type Pt = { x: number; y: number; inside: boolean };

/** Pointer driver: the real mouse wins for 2.5 s after it last moved; otherwise `script` moves a visible fake ring. */
function usePointer(
  root: RefObject<HTMLDivElement | null>,
  dot: RefObject<HTMLDivElement | null>,
  script: (t: number, el: HTMLDivElement) => Pt,
  frame: (p: Pt, el: HTMLDivElement, t: number, dt: number) => void,
) {
  const real = useRef({ x: 0, y: 0, inside: false, at: -1e9 });
  const sc = useRef(script);
  sc.current = script;
  const fr = useRef(frame);
  fr.current = frame;
  const t0 = useRef(-1);
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
    if (t0.current < 0) t0.current = t;
    const R = real.current;
    const useReal = performance.now() - R.at < 2500;
    const p = useReal ? { x: R.x, y: R.y, inside: R.inside } : sc.current(t - t0.current, el);
    const dn = dot.current;
    if (dn) {
      dn.style.transform = `translate3d(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px,0)`;
      dn.style.opacity = useReal ? "0" : "1";
    }
    fr.current(p, el, t - t0.current, dt);
  });
}

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, w = 700, h = 900 }: { i: number; w?: number; h?: number }) => (
  <img src={scene(i, w, h)} alt="" className="block h-full w-full object-cover" draggable={false} />
);

const Eyebrow = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <p className={`text-[13px] uppercase tracking-[0.22em] text-white/55 ${className}`} style={{ fontFamily: GROTESK }}>
    {children}
  </p>
);

/* ───────────────────────── M664 · Back-in (placed card) ───────────────────────── */
const M664_D = ["left", "right", "up", "down"] as const;
function M664() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const card = el.querySelector<HTMLElement>(".m664-card");
    const chips = [...el.querySelectorAll<HTMLElement>(".m664-chip")];
    const w = el.clientWidth;
    const h = el.clientHeight;
    const far: Record<(typeof M664_D)[number], [number, number]> = { left: [-w * 1.1, 0], right: [w * 1.1, 0], up: [0, -h * 1.2], down: [0, h * 1.2] };
    const mark = (k: number) =>
      chips.forEach((c, i) => {
        c.style.background = i === k ? "#9ff0d0" : "transparent";
        c.style.color = i === k ? "#06140f" : "";
      });
    const tl = gsap.timeline({ repeat: -1, paused: true });
    M664_D.forEach((d, k) => {
      const [fx, fy] = far[d];
      tl.call(() => mark(k));
      tl.fromTo(card, { x: fx, y: fy, scale: 0.7, opacity: 0.7 }, { x: 0, y: 0, duration: 0.7, ease: "power2.out", immediateRender: false });
      tl.to(card, { scale: 1, opacity: 1, duration: 0.32, ease: "power2.out" });
      tl.to(card, { scale: 0.7, opacity: 0.7, duration: 0.26, ease: "power2.in" }, "+=0.14");
      tl.to(card, { x: -fx, y: -fy, duration: 0.5, ease: "power2.in" });
    });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(159,240,208,.5)" g2="rgba(120,140,255,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[3vh]" style={{ fontFamily: GROTESK }}>
        <div className="relative flex h-[66%] w-full items-center justify-center">
          <div className="absolute h-full w-[min(46%,600px)] rounded-[24px] border border-dashed border-white/20" aria-hidden />
          <div className="m664-card relative flex h-full w-[min(46%,600px)] overflow-hidden rounded-[24px] border border-white/12 bg-[#11151f] shadow-[0_30px_80px_rgba(0,0,0,.5)]">
            <div className="w-[48%] flex-none">
              <Img i={6} w={420} h={560} />
            </div>
            <div className="flex flex-1 flex-col justify-between p-7">
              <div>
                <Eyebrow>Back in stock</Eyebrow>
                <p className="mt-3 text-[clamp(30px,2.6vw,42px)] leading-[1] tracking-[-0.02em]" style={{ fontFamily: SERIF }}>
                  Ridge Trail Pack
                </p>
                <p className="mt-3 text-[15px] leading-snug text-white/60">28 litres, waxed canvas, a pocket for everything.</p>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[24px] font-[600]">₹7,450</span>
                <span className="rounded-full bg-[#9ff0d0] px-4 py-2 text-[14px] font-[700] text-[#06140f]">Add to bag</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          {M664_D.map((d, i) => (
            <span key={d} className="m664-chip rounded-full border border-white/20 px-5 py-2 text-[14px] font-[600] capitalize" style={i === 0 ? { background: "#9ff0d0", color: "#06140f" } : undefined}>
              From {d}
            </span>
          ))}
        </div>
      </div>
      <Sheen g1="rgba(159,240,208,.5)" />
    </Stage>
  );
}

/* ───────────────────────── M665 · Elliptic slide-in ───────────────────────── */
const M665_D = [
  { n: "Top", from: { y: -600, rotationX: -30, transformOrigin: "50% 100%" }, to: { transformOrigin: "50% 1400px" }, t: "Morning ritual", p: "₹1,200", i: 0 },
  { n: "Left", from: { x: -800, rotationY: 30, transformOrigin: "-100% 50%" }, to: { transformOrigin: "1800px 50%" }, t: "Clay pour-over", p: "₹2,450", i: 3 },
  { n: "Right", from: { x: 800, rotationY: -30, transformOrigin: "200% 50%" }, to: { transformOrigin: "-1800px 50%" }, t: "Single estate", p: "₹890", i: 1 },
  { n: "Bottom", from: { y: 600, rotationX: 30, transformOrigin: "50% 0%" }, to: { transformOrigin: "50% -1400px" }, t: "Copper kettle", p: "₹4,300", i: 2 },
];
function M665() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const cards = [...el.querySelectorAll<HTMLElement>(".m665-c")];
    const tl = gsap.timeline({ repeat: -1, paused: true });
    cards.forEach((c, i) => {
      const d = M665_D[i];
      tl.fromTo(
        c,
        { ...d.from, scale: 0, opacity: 0 },
        { ...d.to, x: 0, y: 0, rotationX: 0, rotationY: 0, scale: 1, opacity: 1, duration: 0.8, ease: "power1.out" },
        i * 0.24,
      );
    });
    tl.to(cards, { opacity: 0, scale: 0.86, y: 24, duration: 0.36, ease: "power2.in", stagger: 0.06 }, "+=0.2");
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,190,120,.5)" g2="rgba(140,170,255,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[5vh] px-[6%]" style={{ fontFamily: GROTESK }}>
        <div className="text-center">
          <Eyebrow>The slow coffee shelf</Eyebrow>
          <h3 className="mt-3 text-[clamp(40px,4.2vw,68px)] leading-none tracking-[-0.03em]" style={{ fontFamily: SERIF, fontWeight: 400 }}>
            Swung in on an arc
          </h3>
        </div>
        <div className="grid w-full max-w-[1150px] grid-cols-4 gap-6" style={{ perspective: "1200px" }}>
          {M665_D.map((d) => (
            <div key={d.n} className="m665-c overflow-hidden rounded-[20px] border border-white/12 bg-[#12161f] shadow-[0_20px_50px_rgba(0,0,0,.45)]">
              <div className="h-[clamp(160px,26vh,260px)]">
                <Img i={d.i} w={420} h={420} />
              </div>
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-[17px] font-[600] leading-tight">{d.t}</p>
                  <p className="text-[12px] uppercase tracking-[0.18em] text-white/50">From {d.n.toLowerCase()}</p>
                </div>
                <p className="text-[16px] text-white/80">{d.p}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Sheen g1="rgba(255,190,120,.5)" />
    </Stage>
  );
}

/* ───────────────────────── M666 · Rainbow floor glow rise ───────────────────────── */
function M666() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const g = el.querySelector(".m666-g");
    const tl = gsap.timeline({ repeat: -1, paused: true });
    tl.fromTo(g, { scaleY: 0.06, opacity: 0.35 }, { scaleY: 1, opacity: 1, duration: 1.4, ease: "power2.out" })
      .to(g, { scaleY: 0.8, duration: 0.7, ease: "sine.inOut" })
      .to(g, { scaleY: 1, duration: 0.6, ease: "sine.inOut" })
      .to(g, { scaleY: 0.06, opacity: 0.35, duration: 0.8, ease: "power2.in" });
    return tl;
  });
  return (
    <Stage r={root} bg="#06070c" g1="rgba(120,140,255,.4)" g2="rgba(255,120,170,.2)">
      <div className="m666-g" aria-hidden>
        <div className="m666-band" />
      </div>
      <div className="absolute inset-0 flex flex-col justify-between px-[6%] py-[6%]" style={{ fontFamily: GROTESK }}>
        <div className="grid grid-cols-4 gap-8 text-[15px] text-white/70">
          <div>
            <p className="mb-3 text-[12px] uppercase tracking-[0.2em] text-white/45">Shop</p>
            <p>Loose leaf</p>
            <p>Gift tins</p>
            <p>Teaware</p>
          </div>
          <div>
            <p className="mb-3 text-[12px] uppercase tracking-[0.2em] text-white/45">Visit</p>
            <p>Tasting room</p>
            <p>Workshops</p>
            <p>Journal</p>
          </div>
          <div>
            <p className="mb-3 text-[12px] uppercase tracking-[0.2em] text-white/45">Help</p>
            <p>Shipping</p>
            <p>Returns</p>
            <p>Contact</p>
          </div>
          <div>
            <p className="mb-3 text-[12px] uppercase tracking-[0.2em] text-white/45">Letters</p>
            <p>One brew note a month.</p>
            <p className="mt-3 inline-block rounded-full border border-white/30 px-4 py-2 text-white">Subscribe</p>
          </div>
        </div>
        <div>
          <p className="text-[clamp(64px,9vw,150px)] font-[800] uppercase leading-[0.85] tracking-[-0.04em]" style={{ fontFamily: WIDE }}>
            Morrow&amp;Leaf
          </p>
          <div className="mt-4 flex justify-between text-[13px] text-white/60">
            <span>© 2026 Morrow &amp; Leaf Tea Co.</span>
            <span>Concept website · sample prices</span>
          </div>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M667 · Shattered glass headline ───────────────────────── */
// 5 × 3 jittered points → 4 × 2 quads → each split on a diagonal = 16 triangular shards (in % of the headline box).
const M667_P: [number, number][][] = (() => {
  const xs = [0, 25, 50, 75, 100];
  const ys = [0, 50, 100];
  const jit = [
    [0, 0, 0, 0, 0],
    [0, 6, -5, 4, 0],
    [0, 0, 0, 0, 0],
  ];
  const jy = [
    [0, 0, 0, 0, 0],
    [-9, 12, -7, 10, 6],
    [0, 0, 0, 0, 0],
  ];
  return ys.map((y, r) => xs.map((x, c) => [x + jit[r][c] * (c > 0 && c < 4 ? 1 : 0), y + jy[r][c]] as [number, number]));
})();
const M667_S: { pts: [number, number][]; c: [number, number] }[] = (() => {
  const out: { pts: [number, number][]; c: [number, number] }[] = [];
  for (let r = 0; r < 2; r++)
    for (let c = 0; c < 4; c++) {
      const a = M667_P[r][c];
      const b = M667_P[r][c + 1];
      const d = M667_P[r + 1][c];
      const e = M667_P[r + 1][c + 1];
      const tris: [number, number][][] = (r + c) % 2 ? [[a, b, e], [a, e, d]] : [[a, b, d], [b, e, d]];
      tris.forEach((pts) => out.push({ pts, c: [(pts[0][0] + pts[1][0] + pts[2][0]) / 3, (pts[0][1] + pts[1][1] + pts[2][1]) / 3] }));
    }
  return out;
})();
const M667_WORD = "Built to break";
function M667() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const sm = useRef({ x: 0.5, y: 0.5 });
  usePlay(root, (el) => {
    const shards = [...el.querySelectorAll<HTMLElement>(".m667-f")];
    const tl = gsap.timeline({ repeat: -1, paused: true });
    const scatter = (_s: HTMLElement, i: number) => {
      const c = M667_S[i].c;
      const dx = (c[0] - 50) / 50;
      const dy = (c[1] - 50) / 50;
      return { x: dx * 340 + (i % 3) * 30 - 30, y: dy * 260 + ((i * 7) % 5) * 20 - 40, rotation: ((i * 47) % 70) - 35, scale: 0.9, opacity: 0 };
    };
    const sc = (k: "x" | "y" | "rotation") => (i: number, s: HTMLElement) => scatter(s, i)[k];
    tl.fromTo(shards, { x: sc("x"), y: sc("y"), rotation: sc("rotation"), scale: 0.9, opacity: 0 }, { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1, duration: 0.85, ease: "power3.out", stagger: { each: 0.03, from: "center" } });
    tl.to(shards, { duration: 1.5 }); // assembled: the tilt + light follow the pointer (ticker) meanwhile
    tl.to(shards, { x: sc("x"), y: sc("y"), rotation: sc("rotation"), opacity: 0, scale: 0.9, duration: 0.6, ease: "power2.in", stagger: { each: 0.02, from: "random" } });
    return tl;
  });
  usePointer(
    root,
    dot,
    (t, el) => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      return { x: w * (0.5 + Math.sin(t * 1.1) * 0.32), y: h * (0.5 + Math.sin(t * 2.2) * 0.22), inside: true };
    },
    (p, el, _t, dt) => {
      const b = box.current;
      if (!b) return;
      const r = b.getBoundingClientRect();
      const o = el.getBoundingClientRect();
      const tx = p.inside ? (p.x - (r.left - o.left)) / r.width : 0.5;
      const ty = p.inside ? (p.y - (r.top - o.top)) / r.height : 0.5;
      const f = 1 - Math.exp(-dt * 8);
      const s = sm.current;
      s.x += (tx - s.x) * f;
      s.y += (ty - s.y) * f;
      b.style.setProperty("--sx", `${(s.x * 100).toFixed(1)}%`);
      b.style.setProperty("--sy", `${(s.y * 100).toFixed(1)}%`);
      b.querySelectorAll<HTMLElement>(".m667-in").forEach((n, i) => {
        const c = M667_S[i].c;
        const dx = s.x - c[0] / 100;
        const dy = s.y - c[1] / 100;
        const z = (i % 3) * 14;
        n.style.transform = `perspective(900px) translateZ(${z}px) rotateY(${(dx * 22).toFixed(2)}deg) rotateX(${(-dy * 30).toFixed(2)}deg)`;
        const txt = n.querySelector<HTMLElement>(".m667-t");
        if (txt) txt.style.transform = `translate(${(dx * 10).toFixed(1)}px,${(dy * 6).toFixed(1)}px)`;
        n.style.setProperty("--so", (0.25 + Math.max(0, 0.75 - Math.hypot(dx, dy * 0.6) * 1.6)).toFixed(3));
      });
    },
  );
  const word = (cls: string, style?: CSSProperties) => (
    <div className={`absolute inset-0 flex items-center justify-center ${cls}`}>
      <p className="m667-t whitespace-nowrap text-[clamp(64px,8.4vw,136px)] leading-none tracking-[-0.035em]" style={{ fontFamily: SERIF, fontWeight: 500, ...style }}>
        {M667_WORD}
      </p>
    </div>
  );
  return (
    <Stage r={root} g1="rgba(140,200,255,.5)" g2="rgba(255,140,200,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[4vh]">
        <Eyebrow>Tempered glassware · Studio Kaanch</Eyebrow>
        <div ref={box} className="relative h-[46%] w-[min(88%,1160px)]" >
          {word("", { color: "rgba(238,242,255,.42)" })}
          {M667_S.map((s, i) => {
            const poly = s.pts.map(([x, y]) => `${x}% ${y}%`).join(",");
            return (
              <div key={i} className="m667-f" style={{ transformOrigin: `${s.c[0]}% ${s.c[1]}%` }}>
                <div className="m667-in" style={{ clipPath: `polygon(${poly})`, transformOrigin: `${s.c[0]}% ${s.c[1]}%` }}>
                  <div className="m667-glass" />
                  {word("", { color: "#f4f8ff", textShadow: "0 0 24px rgba(160,210,255,.35)" })}
                  <div className="m667-spec" />
                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
                    <polygon points={s.pts.map(([x, y]) => `${x},${y}`).join(" ")} fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[15px] text-white/55" style={{ fontFamily: GROTESK }}>
          Borosilicate tumblers, set of four · ₹2,800
        </p>
      </div>
      <Sheen g1="rgba(140,200,255,.5)" />
      <div ref={dot} className="b15r1-dot" aria-hidden>
        <span />
      </div>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  {
    code: "M664",
    name: "Back-in (placed card)",
    how: "A product card flies in from far off-screen at 70% scale, slides into its slot while small, then grows to full size; it cycles left, right, up and down.",
    kind: "play",
    C: M664,
  },
  {
    code: "M665",
    name: "Elliptic slide-in",
    how: "Four cards swing in on elliptic arcs (rotateX/Y with a far transform-origin that travels), one from each side, then fade away and repeat.",
    kind: "play",
    C: M665,
  },
  {
    code: "M666",
    name: "Rainbow floor glow rise",
    how: "At the foot of a footer a tall soft rainbow gradient stretches up from the floor, breathes, sinks and rises again while its colours drift.",
    kind: "play",
    C: M666,
  },
  {
    code: "M667",
    name: "Shattered glass headline",
    how: "Sixteen glass shards assemble over a headline, tilt toward the pointer with a moving specular light, then shatter and re-form. A fake pointer sweeps.",
    kind: "play",
    C: M667,
  },
];
