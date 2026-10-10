"use client";

// Image motions, batch 11 · group 3 (MOTION-MENU M554–M560). Small focused demos for /lab/motion.
// Every demo plays by itself while on screen (a scripted pointer ring stands in for the mouse; the real mouse takes
// over for 2.5 s when it moves), loops, pauses off screen, and has a CSS-only glow loop that never stops (a second one
// ON TOP when photos cover the stage). ?static=1 / reduced motion: no JS motion, the markup shows a sensible final state.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import type { Flip as FlipT } from "gsap/Flip";
import { gsap, loadPlugin, prefersReducedMotion } from "@/lib/gsap";
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
.b11i3-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.42)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.2)),transparent 70%);animation:b11i3-drift 5.4s linear infinite alternate;will-change:transform}
@keyframes b11i3-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b11i3-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4);pointer-events:none;z-index:60;opacity:0;transition:opacity .25s}
.m556-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:22px;overflow:hidden}
.m558-layer{position:absolute;inset:0;overflow:hidden;border-radius:18px;transform-origin:50% 50%;will-change:transform}
.m560-blur{position:absolute;inset:0;filter:blur(10px);transform:scale(1.06)}
html.is-static .b11i3-glow{animation:none}
html.is-static {.b11i3-glow{animation:none}}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0d16] text-[#eef2ff] ${className}`}>
      <style href="b11i3-css" precedence="default">
        {CSS}
      </style>
      <div className="b11i3-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/** The CSS glow loop again, ON TOP of photos (screen blend), so image-covered demos never freeze. */
const Sheen = ({ g1 }: { g1?: string }) => (
  <div className="b11i3-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.45, zIndex: 50 } as CSSProperties} aria-hidden />
);

/** The visible fake pointer (a ring) that drives pointer demos while nobody touches the mouse. */
const Dot = ({ r }: { r: RefObject<HTMLDivElement | null> }) => <div ref={r} className="b11i3-dot" aria-hidden />;

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ src, className = "", style }: { src: string; className?: string; style?: CSSProperties }) => <img src={src} alt="" className={`h-full w-full object-cover ${className}`} style={style} draggable={false} />;

/** "play" helper: builds a looping animation in a gsap.context, plays it only while on screen. */
function usePlay(ref: RefObject<HTMLElement | null>, build: (root: HTMLElement) => gsap.core.Animation | void) {
  const b = useRef(build);
  b.current = build;
  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    let anim: gsap.core.Animation | void;
    const ctx = gsap.context(() => {
      anim = b.current(root);
      anim?.pause();
    }, root);
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? anim?.play() : anim?.pause()), { threshold: 0.1 });
    io.observe(root);
    return () => {
      io.disconnect();
      ctx.revert();
    };
  }, [ref]);
}

type Pt = { x: number; y: number; inside: boolean };
type PtFrame = Pt & { vx: number; vy: number; real: boolean };

/**
 * Pointer driver: every frame (while on screen) gives a pointer position in root px. The real mouse wins for 2.5 s
 * after it last moved; otherwise `script(t, root)` drives a visible fake ring along a set path.
 */
function usePointer(root: RefObject<HTMLDivElement | null>, dot: RefObject<HTMLDivElement | null>, script: (t: number, el: HTMLDivElement) => Pt, frame: (p: PtFrame, dt: number, el: HTMLDivElement, t: number) => void) {
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
    fr.current({ ...p, vx, vy, real: useReal }, Math.min(dt, 0.1), el, t - L.t0);
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

/** Pointer → -1..1 relative to an element's centre (clamped). */
function norm(p: { x: number; y: number }, b: { l: number; t: number; w: number; h: number }) {
  const c = (v: number) => Math.max(-1, Math.min(1, v));
  return [c(((p.x - b.l) / b.w) * 2 - 1), c(((p.y - b.t) / b.h) * 2 - 1)];
}

/* ───────────────────────── M554 · Shuffling hero grid (Flip) ───────────────────────── */
const M554_TILES = Array.from({ length: 16 }, (_, i) => scene(i % 4, 480, 480, `LOOK ${String(i + 1).padStart(2, "0")}`));
function M554() {
  const root = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const g = grid.current;
    const el = root.current;
    if (!g || !el || prefersReducedMotion()) return;
    const orig = [...g.children] as HTMLElement[];
    let Flip: typeof FlipT | null = null;
    let dead = false;
    let on = false;
    let busy = false;
    let n = 1;
    let tw: gsap.core.Animation | null = null;
    let wait: gsap.core.Tween | null = null;
    const step = () => {
      if (dead || !Flip) return;
      if (!on) {
        busy = false;
        return;
      }
      busy = true;
      const kids = [...g.children] as HTMLElement[];
      const state = Flip.getState(kids);
      gsap.utils.shuffle(kids.slice()).forEach((k) => g.appendChild(k)); // new DOM order = new grid positions
      n = (n % 99) + 1;
      if (count.current) count.current.textContent = String(n).padStart(2, "0");
      tw = Flip.from(state, {
        duration: 0.85,
        ease: "power3.inOut",
        stagger: { amount: 0.16, from: "random" },
        onComplete: () => {
          wait = gsap.delayedCall(0.18, step); // short hold, well under 0.3 s
        },
      });
    };
    const io = new IntersectionObserver(
      ([e]) => {
        on = e.isIntersecting;
        if (on) {
          if (tw?.paused() || wait?.paused()) {
            tw?.resume();
            wait?.resume();
          } else if (!busy) step();
        } else {
          tw?.pause();
          wait?.pause();
        }
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    loadPlugin("Flip").then((f) => {
      Flip = f;
      if (on && !busy) step();
    });
    return () => {
      dead = true;
      io.disconnect();
      tw?.kill();
      wait?.kill();
      orig.forEach((k) => g.appendChild(k));
      gsap.set(orig, { clearProps: "all" });
    };
  }, []);
  return (
    <Stage r={root} g1="rgba(255,150,110,.42)" g2="rgba(79,141,255,.22)">
      <div className="absolute bottom-[10%] left-[5%] top-[10%] z-[20] flex w-[34%] flex-col justify-between">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/65">Fieldnote · Autumn edit</p>
        <div>
          <h3 className="text-[clamp(46px,5vw,80px)] font-[700] leading-[0.94] tracking-[-0.035em]" style={{ fontFamily: F.sg }}>
            Sixteen looks, one season.
          </h3>
          <p className="mt-5 max-w-[34ch] text-[16px] leading-relaxed text-white/70">Layer it your way: knits, outerwear and soft tailoring, reshuffled daily.</p>
        </div>
        <div className="flex items-center gap-5 text-[14px]" style={{ fontFamily: F.sg }}>
          <span className="rounded-full bg-white px-5 py-3 font-[600] text-[#0a0d16]">Shop the edit · from ₹ 2,400</span>
          <span className="tabular-nums text-white/60">
            Shuffle <span ref={count}>01</span>
          </span>
        </div>
      </div>
      <div ref={grid} className="absolute bottom-[7%] right-[4%] top-[7%] grid aspect-square grid-cols-4 grid-rows-4 gap-[10px]">
        {M554_TILES.map((src, i) => (
          <div key={i} className="relative overflow-hidden rounded-[12px] border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,.35)]">
            <Img src={src} />
          </div>
        ))}
      </div>
      <Sheen g1="rgba(255,170,130,.5)" />
    </Stage>
  );
}

/* ───────────────────────── M555 · Layered copies tilt ───────────────────────── */
const M555_LAYERS = [0.22, 0.32, 0.45, 0.62, 1]; // back → front opacity
function M555() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const sm = useRef({ x: 0, y: 0 });
  const src = scene(3, 900, 1100, "VESSEL 07");
  usePointer(
    root,
    dot,
    (t, el) => {
      const b = rel(box.current!, el);
      return { x: b.l + b.w * (0.5 + 0.46 * Math.sin(t * 1.25)), y: b.t + b.h * (0.5 + 0.4 * Math.sin(t * 1.85 + 0.6)), inside: true };
    },
    (p, dt, el) => {
      const bx = box.current;
      if (!bx) return;
      const [nx, ny] = p.inside ? norm(p, rel(bx, el)) : [0, 0];
      const S = sm.current;
      const k = 1 - Math.exp(-dt * 6);
      S.x += (nx - S.x) * k;
      S.y += (ny - S.y) * k;
      const layers = bx.querySelectorAll<HTMLElement>(".m555-layer");
      const n = layers.length;
      layers.forEach((l, i) => {
        const d = n - 1 - i; // 0 = front
        const tx = -S.x * (6 + d * 16);
        const ty = -S.y * (5 + d * 12);
        const rz = S.x * d * 1.8;
        l.style.transform = `translate3d(${tx.toFixed(2)}px,${ty.toFixed(2)}px,0) rotate(${rz.toFixed(2)}deg)`;
      });
      bx.style.transform = `perspective(1200px) rotateX(${(-S.y * 7).toFixed(2)}deg) rotateY(${(S.x * 9).toFixed(2)}deg)`;
    },
  );
  return (
    <Stage r={root} g1="rgba(224,145,63,.42)" g2="rgba(255,213,154,.18)">
      <div className="absolute left-[6%] top-1/2 z-[20] w-[34%] -translate-y-1/2">
        <p className="text-[13px] uppercase tracking-[0.24em] text-[#ffd59a]/75">Studio Kiln · Ceramics</p>
        <h3 className="mt-4 text-[clamp(44px,4.8vw,78px)] leading-[0.95]" style={{ fontFamily: F.fr, fontWeight: 500 }}>
          Thrown by hand, fired twice.
        </h3>
        <p className="mt-5 text-[16px] text-white/70">Vessel 07 · stoneware · ₹ 6,200</p>
      </div>
      <div ref={box} className="absolute bottom-[10%] right-[12%] top-[10%] aspect-[9/11] will-change-transform">
        {M555_LAYERS.map((o, i) => (
          <div key={i} className="m555-layer absolute inset-0 overflow-hidden rounded-[18px] will-change-transform" style={{ opacity: o, boxShadow: i === M555_LAYERS.length - 1 ? "0 30px 60px rgba(0,0,0,.45)" : "none" }}>
            <Img src={src} />
          </div>
        ))}
      </div>
      <Sheen g1="rgba(255,200,140,.5)" />
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M556 · Tilt card that flips ───────────────────────── */
function M556() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const glare = useRef<HTMLDivElement>(null);
  const st = useRef({ flip: 0, extra: 0, x: 0, y: 0 });
  usePlay(root, () => {
    const s = st.current;
    // auto flip: front → back → front (the tilt keeps moving during each view, so nothing rests)
    return gsap
      .timeline({ repeat: -1 })
      .to(s, { flip: 180, duration: 0.9, ease: "power3.inOut" })
      .to(s, { flip: 180, duration: 1.0 })
      .to(s, { flip: 360, duration: 0.9, ease: "power3.inOut" })
      .to(s, { flip: 360, duration: 1.0 });
  });
  usePointer(
    root,
    dot,
    (t, el) => {
      const b = rel(card.current!, el);
      return { x: b.l + b.w * (0.5 + 0.38 * Math.sin(t * 1.3)), y: b.t + b.h * (0.5 + 0.34 * Math.sin(t * 2.1 + 1)), inside: true };
    },
    (p, dt, el) => {
      const c = card.current;
      if (!c) return;
      const [nx, ny] = p.inside ? norm(p, rel(c, el)) : [0, 0];
      const S = st.current;
      const k = 1 - Math.exp(-dt * 7);
      S.x += (nx - S.x) * k;
      S.y += (ny - S.y) * k;
      c.style.transform = `perspective(1100px) rotateX(${(-S.y * 12).toFixed(2)}deg) rotateY(${(S.x * 14 + S.flip + S.extra).toFixed(2)}deg)`;
      if (glare.current) glare.current.style.transform = `translate3d(${(S.x * 40).toFixed(1)}%,${(S.y * 40).toFixed(1)}%,0)`;
    },
  );
  const click = () => {
    if (prefersReducedMotion()) return;
    gsap.to(st.current, { extra: st.current.extra + 180, duration: 0.8, ease: "power3.inOut" });
  };
  return (
    <Stage r={root} g1="rgba(79,141,255,.42)" g2="rgba(24,196,143,.2)">
      <div className="absolute left-[7%] top-1/2 z-[20] w-[36%] -translate-y-1/2">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/60">Strata Run · Spring drop</p>
        <h3 className="mt-4 text-[clamp(46px,5vw,80px)] font-[700] uppercase leading-[0.92] tracking-[-0.03em]" style={{ fontFamily: F.sy }}>
          Turn it over.
        </h3>
        <p className="mt-5 text-[16px] text-white/70">Tilt the card, tap to flip: every detail is on the back.</p>
      </div>
      <div className="absolute bottom-[9%] right-[16%] top-[9%] aspect-[3/4]">
        <div ref={card} onClick={click} className="relative h-full w-full cursor-pointer will-change-transform" style={{ transformStyle: "preserve-3d" }}>
          <div className="m556-face border border-white/15 bg-[#0e1424] shadow-[0_30px_70px_rgba(0,0,0,.5)]">
            <Img src={scene(0, 900, 1200)} className="absolute inset-0" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6">
              <p className="text-[13px] uppercase tracking-[0.2em] text-white/70">Road · neutral</p>
              <p className="mt-1 text-[30px] font-[600] tracking-[-0.02em]" style={{ fontFamily: F.sg }}>
                Aero Knit 2
              </p>
            </div>
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div ref={glare} className="absolute inset-[-40%] bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,.28),transparent_45%)] mix-blend-screen" />
            </div>
          </div>
          <div className="m556-face flex flex-col justify-between border border-white/15 bg-[#eef2ff] p-7 text-[#0a0d16]" style={{ transform: "rotateY(180deg)" }}>
            <div>
              <p className="text-[13px] uppercase tracking-[0.2em] text-[#2f8cff]">Details</p>
              <p className="mt-2 text-[32px] font-[700] leading-none tracking-[-0.02em]" style={{ fontFamily: F.sg }}>
                Aero Knit 2
              </p>
              <ul className="mt-5 space-y-2 text-[15px] text-[#0a0d16]/75">
                <li>· 212 g, 8 mm drop</li>
                <li>· Recycled knit upper</li>
                <li>· Foam midsole, 30-day trial</li>
              </ul>
            </div>
            <div>
              <div className="flex gap-2 text-[14px]">
                {["7", "8", "9", "10"].map((s, i) => (
                  <span key={s} className={`grid h-10 w-10 place-items-center rounded-full border ${i === 1 ? "border-[#0a0d16] bg-[#0a0d16] text-white" : "border-[#0a0d16]/25"}`}>
                    {s}
                  </span>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between">
                <span className="text-[26px] font-[700] tabular-nums" style={{ fontFamily: F.sg }}>
                  ₹ 8,499
                </span>
                <span className="rounded-full bg-[#2f8cff] px-5 py-3 text-[14px] font-[600] text-white">Add to bag</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Sheen g1="rgba(120,170,255,.5)" />
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M557 · Image segments pop out ───────────────────────── */
// [left, top, width, height] in % of the picture; each segment carries the same photo, aligned, so it looks cut out.
const M557_SEGS: [number, number, number, number][] = [
  [6, 10, 24, 38],
  [36, 6, 22, 30],
  [64, 16, 28, 40],
  [12, 56, 30, 34],
  [48, 46, 26, 44],
];
const M557_DEPTH = [22, 34, 18, 28, 40];
function segStyle([l, t, w, h]: [number, number, number, number], src: string): CSSProperties {
  return {
    left: `${l}%`,
    top: `${t}%`,
    width: `${w}%`,
    height: `${h}%`,
    backgroundImage: `url("${src}")`,
    backgroundSize: `${(100 / w) * 100}% ${(100 / h) * 100}%`,
    backgroundPosition: `${(l / (100 - w)) * 100}% ${(t / (100 - h)) * 100}%`,
  };
}
function M557() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const pops = useRef(M557_SEGS.map(() => ({ p: 0 })));
  const sm = useRef({ x: 0, y: 0 });
  const src = scene(1, 1600, 1000, "ATRIUM HOUSE · LOBBY");
  usePlay(root, (el) => {
    const dim = el.querySelector(".m557-dim");
    return gsap
      .timeline({ repeat: -1 })
      .to(pops.current, { p: 1, duration: 0.75, ease: "power3.out", stagger: 0.1 })
      .to(dim, { opacity: 0.55, duration: 0.6, ease: "power2.out" }, 0)
      .to({}, { duration: 1.1 })
      .to(pops.current, { p: 0, duration: 0.6, ease: "power2.inOut", stagger: 0.06 })
      .to(dim, { opacity: 0, duration: 0.6, ease: "power2.inOut" }, "<")
      .to({}, { duration: 0.15 });
  });
  usePointer(
    root,
    dot,
    (t, el) => {
      const b = rel(box.current!, el);
      return { x: b.l + b.w * (0.5 + 0.4 * Math.sin(t * 1.1)), y: b.t + b.h * (0.5 + 0.36 * Math.sin(t * 1.7 + 0.8)), inside: true };
    },
    (p, dt, el) => {
      const bx = box.current;
      if (!bx) return;
      const [nx, ny] = p.inside ? norm(p, rel(bx, el)) : [0, 0];
      const S = sm.current;
      const k = 1 - Math.exp(-dt * 6);
      S.x += (nx - S.x) * k;
      S.y += (ny - S.y) * k;
      bx.querySelectorAll<HTMLElement>(".m557-seg").forEach((s, i) => {
        const q = pops.current[i].p;
        const d = M557_DEPTH[i];
        s.style.transform = `translate3d(${(S.x * d * q).toFixed(2)}px,${(S.y * d * q - 10 * q).toFixed(2)}px,0) scale(${(1 + 0.07 * q).toFixed(4)})`;
        s.style.boxShadow = `0 ${(30 * q).toFixed(1)}px ${(60 * q).toFixed(1)}px rgba(0,0,0,${(0.6 * q).toFixed(3)}), 0 0 0 ${(1.5 * q).toFixed(2)}px rgba(255,255,255,${(0.55 * q).toFixed(3)})`;
      });
    },
  );
  return (
    <Stage r={root} g1="rgba(255,77,109,.42)" g2="rgba(255,179,107,.2)">
      <div ref={box} className="absolute bottom-[16%] left-[6%] right-[6%] top-[7%] rounded-[18px]">
        <div className="absolute inset-0 overflow-hidden rounded-[18px]">
          <Img src={src} />
          <div className="m557-dim absolute inset-0 bg-[#07040a]" style={{ opacity: 0 }} />
        </div>
        {M557_SEGS.map((s, i) => (
          <div key={i} className="m557-seg absolute rounded-[6px] will-change-transform" style={segStyle(s, src)} />
        ))}
      </div>
      <div className="absolute bottom-[4%] left-[6%] right-[6%] z-[20] flex items-baseline justify-between">
        <h3 className="text-[clamp(30px,3vw,48px)] leading-none" style={{ fontFamily: F.is }}>
          Atrium House, piece by piece
        </h3>
        <p className="text-[15px] text-white/70">Suites from ₹ 21,500 a night</p>
      </div>
      <Sheen g1="rgba(255,140,150,.5)" />
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M558 · Nested repetition tunnel on hover ───────────────────────── */
const M558_N = 7;
function M558() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const st = useRef({ hov: false, ready: false });
  const src = scene(2, 1200, 900, "GREENHOUSE · No. 3");
  useEffect(() => {
    if (prefersReducedMotion()) return;
    st.current.ready = true;
    const bx = box.current;
    return () => {
      const ls = bx?.querySelectorAll(".m558-layer");
      if (ls) {
        gsap.killTweensOf(ls);
        gsap.set(ls, { clearProps: "transform" });
      }
      st.current = { hov: false, ready: false };
    };
  }, []);
  usePointer(
    root,
    dot,
    (t, el) => {
      const b = rel(box.current!, el);
      const pts: [number, number][] = [
        [b.l + b.w * 0.35, b.t + b.h * 0.45], // inside
        [b.l + b.w * 0.66, b.t + b.h * 0.58], // inside
        [b.l + b.w * 1.18, b.t + b.h * 0.7], // outside: the tunnel closes
        [b.l + b.w * 1.12, b.t + b.h * 0.2], // outside
      ];
      const [x, y] = stepPath(t, pts, 0.85, 0.42);
      return { x: x + Math.sin(t * 2.3) * 22, y: y + Math.cos(t * 2.9) * 14, inside: true };
    },
    (p, _dt, el) => {
      const S = st.current;
      const bx = box.current;
      if (!S.ready || !bx) return;
      const b = rel(bx, el);
      const hov = p.inside && p.x >= b.l && p.x <= b.l + b.w && p.y >= b.t && p.y <= b.t + b.h;
      if (hov === S.hov) return;
      S.hov = hov;
      const ls = bx.querySelectorAll(".m558-layer");
      gsap.to(ls, {
        scale: (i: number) => (hov ? 1 - i * 0.12 : 1),
        duration: 0.9,
        ease: "power3.inOut",
        stagger: { each: 0.06, from: hov ? "start" : "end" },
        overwrite: "auto",
      });
    },
  );
  return (
    <Stage r={root} g1="rgba(24,196,143,.42)" g2="rgba(200,255,138,.18)">
      <div className="absolute left-[6%] top-1/2 z-[20] w-[30%] -translate-y-1/2">
        <p className="text-[13px] uppercase tracking-[0.24em] text-[#c8ff8a]/75">Verdant Co. · Plant studio</p>
        <h3 className="mt-4 text-[clamp(44px,4.6vw,76px)] leading-[0.95]" style={{ fontFamily: F.fr, fontWeight: 500 }}>
          Go deeper in.
        </h3>
        <p className="mt-5 text-[16px] text-white/70">The greenhouse kit · 3 sizes · from ₹ 3,450</p>
      </div>
      <div ref={box} className="absolute bottom-[10%] right-[6%] top-[10%] aspect-[4/3]">
        {Array.from({ length: M558_N }, (_, i) => (
          <div key={i} className="m558-layer border border-white/25 shadow-[0_18px_40px_rgba(0,0,0,.45)]" style={{ zIndex: i + 1 }}>
            <Img src={src} />
          </div>
        ))}
      </div>
      <Sheen g1="rgba(120,230,170,.5)" />
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M559 · Cursor image trail ───────────────────────── */
const M559_POOL = Array.from({ length: 10 }, (_, i) => scene(i % 4, 440, 560, `No. ${String(i + 1).padStart(2, "0")}`));
const M559_W = 170;
const M559_H = 216;
const M559_STATIC: [number, number, number][] = [
  [18, 22, -6],
  [70, 18, 5],
  [26, 64, 4],
  [76, 62, -4],
];
function M559() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const st = useRef({ acc: 0, k: 0, z: 10, lx: -1, ly: -1, ready: false });
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const imgs = el.querySelectorAll<HTMLElement>(".m559-img");
    imgs.forEach((n) => (n.style.rotate = "")); // the static layout's CSS tilt; GSAP owns rotation from here
    gsap.set(imgs, { opacity: 0, left: 0, top: 0 });
    st.current.ready = true;
    return () => {
      gsap.killTweensOf(imgs);
      gsap.set(imgs, { clearProps: "all" });
      st.current = { acc: 0, k: 0, z: 10, lx: -1, ly: -1, ready: false };
    };
  }, []);
  usePointer(
    root,
    dot,
    (t, el) => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      return { x: w * (0.5 + 0.38 * Math.sin(t * 1.15)), y: h * (0.5 + 0.3 * Math.sin(t * 1.8 + 0.5)), inside: true };
    },
    (p, _dt, el) => {
      const S = st.current;
      if (!S.ready || !p.inside) return;
      if (S.lx < 0) {
        S.lx = p.x;
        S.ly = p.y;
      }
      S.acc += Math.hypot(p.x - S.lx, p.y - S.ly);
      S.lx = p.x;
      S.ly = p.y;
      if (S.acc < 80) return; // one image every ~80 px of travel
      S.acc = 0;
      const imgs = el.querySelectorAll<HTMLElement>(".m559-img");
      const n = imgs[S.k % imgs.length];
      S.k++;
      gsap.killTweensOf(n);
      gsap.set(n, { x: p.x - M559_W / 2, y: p.y - M559_H / 2, zIndex: ++S.z, rotate: gsap.utils.random(-7, 7) });
      gsap
        .timeline()
        .fromTo(n, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "power3.out" })
        .to(n, { scale: 0.3, opacity: 0, duration: 0.55, ease: "power2.in" }, 0.85);
    },
  );
  return (
    <Stage r={root} g1="rgba(255,179,107,.45)" g2="rgba(255,77,109,.2)">
      <div className="pointer-events-none absolute inset-0 z-[5] flex flex-col items-center justify-center text-center">
        <p className="text-[13px] uppercase tracking-[0.26em] text-white/60">Archive Room · Prints & posters</p>
        <h3 className="mt-4 text-[clamp(56px,6.4vw,104px)] leading-[0.92]" style={{ fontFamily: F.is }}>
          Wander the archive
        </h3>
        <p className="mt-5 text-[16px] text-white/70">Archival prints from ₹ 1,850 · move to explore</p>
      </div>
      {M559_POOL.map((src, i) => {
        const s = M559_STATIC[i];
        return (
          <div
            key={i}
            className="m559-img pointer-events-none absolute overflow-hidden rounded-[10px] shadow-[0_20px_40px_rgba(0,0,0,.45)] will-change-transform"
            style={{ width: M559_W, height: M559_H, zIndex: 10, left: s ? `${s[0]}%` : 0, top: s ? `${s[1]}%` : 0, opacity: s ? 1 : 0, rotate: s ? `${s[2]}deg` : undefined }}
          >
            <Img src={src} />
          </div>
        );
      })}
      <Sheen g1="rgba(255,190,130,.5)" />
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── M560 · Mouse-depth floating collage ───────────────────────── */
// [left %, top %, width px, depth, scene]
const M560_ITEMS: [number, number, number, number, number][] = [
  [6, 10, 200, 0.35, 0],
  [26, 58, 170, 0.8, 1],
  [40, 6, 150, 0.5, 2],
  [70, 8, 230, 1.1, 3],
  [80, 54, 180, 0.6, 1],
  [54, 70, 210, 1.3, 0],
  [8, 62, 140, 1.0, 3],
  [62, 34, 120, 0.25, 2],
];
function M560() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const sm = useRef({ x: 0, y: 0 });
  // fade in from blur on every entry: a fixed-blur copy shows first, the sharp copy fades in over it (no blur tween)
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    let tl: gsap.core.Timeline | null = null;
    const ctx = gsap.context(() => {
      tl = gsap
        .timeline({ paused: true })
        .fromTo(".m560-item", { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out", stagger: 0.1 })
        .fromTo(".m560-sharp", { opacity: 0 }, { opacity: 1, duration: 0.9, ease: "power2.inOut", stagger: 0.1 }, 0.3);
    }, el);
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? tl?.restart() : tl?.pause()), { threshold: 0.2 });
    io.observe(el);
    return () => {
      io.disconnect();
      ctx.revert();
    };
  }, []);
  usePointer(
    root,
    dot,
    (t, el) => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      // Lissajous 3:2 path for filming
      return { x: w * (0.5 + 0.36 * Math.sin(t * 0.9)), y: h * (0.5 + 0.3 * Math.sin(t * 1.35 + 0.7)), inside: true };
    },
    (p, dt, el, t) => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const tx = p.inside ? (p.x / w) * 2 - 1 : 0;
      const ty = p.inside ? (p.y / h) * 2 - 1 : 0;
      const S = sm.current;
      const k = 1 - Math.exp(-dt * 3.2); // smoothed lag
      S.x += (tx - S.x) * k;
      S.y += (ty - S.y) * k;
      el.querySelectorAll<HTMLElement>(".m560-move").forEach((n, i) => {
        const d = M560_ITEMS[i][3];
        const x = -S.x * 70 * d + Math.sin(t * 0.5 + i * 1.7) * 10 * d;
        const y = -S.y * 50 * d + Math.cos(t * 0.42 + i * 1.3) * 8 * d;
        n.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)`;
      });
    },
  );
  return (
    <Stage r={root} g1="rgba(159,216,255,.42)" g2="rgba(255,122,89,.2)">
      <div className="pointer-events-none absolute inset-0 z-[30] flex flex-col items-center justify-center text-center">
        <p className="text-[13px] uppercase tracking-[0.26em] text-white/65">Drift Journal · Issue 12</p>
        <h3 className="mt-3 text-[clamp(52px,6vw,96px)] font-[700] leading-[0.92] tracking-[-0.035em] drop-shadow-[0_6px_30px_rgba(0,0,0,.6)]" style={{ fontFamily: F.sg }}>
          Places we kept
        </h3>
        <p className="mt-4 text-[16px] text-white/75">Print edition · 148 pages · ₹ 1,299</p>
      </div>
      {M560_ITEMS.map(([l, t, w, d, s], i) => (
        <div key={i} className="m560-move absolute will-change-transform" style={{ left: `${l}%`, top: `${t}%`, width: w, zIndex: Math.round(d * 10) + (d > 0.9 ? 25 : 0) }}>
          <div className="m560-item relative aspect-[4/5] overflow-hidden rounded-[10px] shadow-[0_20px_45px_rgba(0,0,0,.45)]">
            <div className="m560-blur">
              <Img src={scene(s, 400, 500)} />
            </div>
            <div className="m560-sharp absolute inset-0">
              <Img src={scene(s, 400, 500)} />
            </div>
          </div>
        </div>
      ))}
      <Sheen g1="rgba(160,200,255,.5)" />
      <Dot r={dot} />
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M554", name: "Shuffling hero grid", how: "A 4×4 image grid reshuffles every tile to a new spot with a Flip layout animation (~0.85 s), then shuffles again, on a loop.", kind: "play", C: M554 },
  { code: "M555", name: "Layered copies tilt", how: "One image stacked as five semi-transparent copies: the pointer shifts and turns each copy by a different amount, so the picture gains layered depth.", kind: "play", C: M555 },
  { code: "M556", name: "Tilt card that flips", how: "A product card tilts with the pointer and flips over (rotateY 180) by itself or on click to show the details on the back.", kind: "play", C: M556 },
  { code: "M557", name: "Image segments pop out", how: "Five rectangles cut from the photo pop forward with a shadow while the rest dims, and shift with the pointer at different depths.", kind: "play", C: M557 },
  { code: "M558", name: "Nested repetition tunnel on hover", how: "Hover the picture: seven nested copies of it shrink one after another into a tunnel of the same image; leaving closes it.", kind: "play", C: M558 },
  { code: "M559", name: "Cursor image trail", how: "Every ~80 px of pointer travel drops the next image from a pool: it pops in (0.8→1) and shrinks away after ~0.5 s.", kind: "play", C: M559 },
  { code: "M560", name: "Mouse-depth floating collage", how: "A collage at different depths slides opposite the pointer with a lag, deeper pieces moving more, drifting on its own; it fades in from blur.", kind: "play", C: M560 },
];
