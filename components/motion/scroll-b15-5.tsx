"use client";

// Scroll motions, batch 15 · group 5 (MOTION-MENU M704–M708): small focused demos for /lab/motion.
// "scrub" demos map the panel's scroll LINEARLY (useScrub over the whole 220vh panel) onto styles set directly.
// "play" demos run by themselves while on screen and loop with no rest over 0.3 s, pausing off screen.
// Every demo also has a CSS-only glow loop (plus a glow on top of covered stages), so it never reads as frozen.
// The canvas demo only rasterises once the stage is within ~1 screen of the viewport. ?static=1 / reduced motion:
// no JS motion, the markup is a sensible final state. Motion ideas only (rebuilt from scratch, no copied code).
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, prefersReducedMotion, isRecording } from "@/lib/gsap";
import { scene, toCanvas, useScrub, useTicker } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const GROTESK = "'Space Grotesk Variable', system-ui, sans-serif";
const SERIF = "'Fraunces Variable', Georgia, serif";
const EDITORIAL = "'Instrument Serif', Georgia, serif";
const WIDE = "'Syne Variable', 'Space Grotesk Variable', system-ui, sans-serif";
const MANROPE = "'Manrope Variable', system-ui, sans-serif";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mod = (a: number, n: number) => ((a % n) + n) % n;
const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};

const CSS = `
.b15s5-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.55)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.22)),transparent 70%);animation:b15s5-drift 5.4s linear infinite alternate;will-change:transform}
@keyframes b15s5-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.m706-sheen{position:absolute;top:0;bottom:0;width:30%;left:-30%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.22),transparent);animation:m706-sheen 3.2s linear infinite;pointer-events:none}
@keyframes m706-sheen{0%{transform:translate3d(0,0,0)}100%{transform:translate3d(440%,0,0)}}
.m707-stars{position:absolute;inset:-10%;background-image:radial-gradient(1.5px 1.5px at 12% 18%,#fff8,transparent),radial-gradient(1.5px 1.5px at 72% 12%,#fff6,transparent),radial-gradient(1px 1px at 40% 30%,#fff7,transparent),radial-gradient(1.5px 1.5px at 86% 34%,#fff5,transparent),radial-gradient(1px 1px at 26% 44%,#fff6,transparent),radial-gradient(1px 1px at 58% 8%,#fff8,transparent);animation:m707-stars 9s linear infinite alternate;pointer-events:none}
@keyframes m707-stars{0%{transform:translate3d(-2%,0,0)}100%{transform:translate3d(2%,-2%,0)}}
html.is-static .b15s5-glow,html.is-static .m706-sheen,html.is-static .m707-stars{animation:none}
html.is-static {.b15s5-glow,.m706-sheen,.m707-stars{animation:none}}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", bg = "#0a0d16", g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; bg?: string; g1?: string; g2?: string }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 text-[#eef2ff] ${className}`} style={{ background: bg }}>
      <style href="b15s5-css" precedence="default">
        {CSS}
      </style>
      <div className="b15s5-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/** The CSS glow loop again, ON TOP of photos/cards/canvas (screen blend), so covered stages never freeze. */
const Sheen = ({ g1 }: { g1?: string }) => (
  <div className="b15s5-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.45, zIndex: 350 } as CSSProperties} aria-hidden />
);

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, w = 1400, h = 900, label = "", className = "", style }: { i: number; w?: number; h?: number; label?: string; className?: string; style?: CSSProperties }) => (
  <img src={scene(i, w, h, label)} alt="" className={`h-full w-full object-cover ${className}`} style={style} draggable={false} />
);

/** True once the element is within ~1 screen of the viewport (no canvas rasterising before that). */
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

/** "play" helper: waits for fonts, builds a looping animation in a gsap.context, plays it only while on screen. */
function usePlay(ref: RefObject<HTMLElement | null>, build: (root: HTMLElement) => gsap.core.Animation | void) {
  const b = useRef(build);
  b.current = build;
  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    let dead = false;
    let on = false;
    let anim: gsap.core.Animation | void;
    const ctx = gsap.context(() => {}, root);
    const sync = () => {
      if (!anim) return;
      if (on) anim.play();
      else anim.pause();
    };
    const io = new IntersectionObserver(
      ([e]) => {
        on = e.isIntersecting;
        sync();
      },
      { threshold: 0.1 },
    );
    io.observe(root);
    Promise.resolve(document.fonts?.ready).then(() => {
      if (dead) return;
      ctx.add(() => {
        anim = b.current(root);
      });
      sync();
    });
    return () => {
      dead = true;
      io.disconnect();
      ctx.revert();
    };
  }, [ref]);
}

/* ---------- M704 · Laptop lid opens, screen flies out (variant of M47) ---------- */
function M704() {
  const root = useRef<HTMLDivElement>(null);
  useScrub(
    root,
    (p) => {
      const el = root.current;
      if (!el) return;
      const q = <T extends HTMLElement>(s: string) => el.querySelector<T>(s);
      const lid = q(".m704-lid");
      const fly = q(".m704-fly");
      const off = q(".m704-off");
      const base = q(".m704-base");
      const head = q(".m704-head");
      const cap = q(".m704-cap");
      // phase 1 (0 → .38): the lid opens rotateX −28° → 0 and the screen powers on
      const a = clamp01(p / 0.38);
      // phase 2 (.38 → 1): the screen image scales up and travels toward the viewer, beyond the frame
      const f = clamp01((p - 0.38) / 0.62);
      const fe = f * f * (1.4 - 0.4 * f);
      if (lid) lid.style.transform = `rotateX(${lerp(-28, 0, a).toFixed(2)}deg)`;
      if (off) off.style.opacity = (0.88 * (1 - a)).toFixed(3);
      if (fly) {
        fly.style.transform = `translate3d(0,${(-fe * 26).toFixed(2)}%,0) scale(${lerp(1, 4.2, fe).toFixed(3)})`;
        fly.style.borderRadius = `${lerp(10, 2, f).toFixed(1)}px`;
      }
      if (base) {
        base.style.transform = `translate3d(0,${(fe * 60).toFixed(1)}px,0)`;
        base.style.opacity = (1 - fe * 0.9).toFixed(3);
      }
      if (head) {
        head.style.opacity = (1 - smooth(f * 2.2)).toFixed(3);
        head.style.transform = `translate3d(0,${(-a * 10 - f * 40).toFixed(1)}px,0)`;
      }
      if (cap) cap.style.opacity = smooth((f - 0.55) / 0.3).toFixed(3);
    },
    { finalValue: 0.38 },
  );
  return (
    <Stage r={root} bg="#07080d" g1="rgba(120,150,255,.55)" g2="rgba(255,160,120,.2)">
      <div className="m704-head absolute inset-x-0 top-[7%] z-20 text-center" style={{ fontFamily: SERIF }}>
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/55" style={{ fontFamily: GROTESK }}>
          Halcyon Book 14 · from ₹1,24,900
        </p>
        <h3 className="mt-2 text-[clamp(30px,3.6vw,54px)] font-light leading-none tracking-[-0.02em]">Open it. Step inside.</h3>
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-[8%]" style={{ perspective: "1500px", perspectiveOrigin: "50% 20%" }}>
        <div className="m704-lid relative z-10 aspect-[16/10] w-[min(42%,560px)] rounded-t-[18px] border border-white/15 bg-[#17191f] p-[1.3%] shadow-[0_-20px_60px_rgba(0,0,0,.4)]" style={{ transformOrigin: "50% 100%", transform: "rotateX(0deg)" }}>
          <div className="relative h-full w-full rounded-[10px] bg-black">
            <div className="m704-fly absolute inset-0 overflow-hidden rounded-[10px]" style={{ transformOrigin: "50% 38%", willChange: "transform" }}>
              <Img i={0} w={1280} h={800} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <p className="absolute bottom-[8%] left-[6%] text-[clamp(14px,1.5vw,22px)] font-semibold tracking-[-0.01em]" style={{ fontFamily: GROTESK }}>
                Liquid Retina · 3.2K
              </p>
            </div>
            <div className="m704-off pointer-events-none absolute inset-0 rounded-[10px] bg-black" style={{ opacity: 0 }} />
          </div>
        </div>
        <div className="m704-base relative h-[18px] w-[min(54%,720px)] rounded-b-[16px] rounded-t-[3px] bg-gradient-to-b from-[#c9ccd6] to-[#6d717c] shadow-[0_24px_40px_rgba(0,0,0,.55)]">
          <div className="mx-auto h-[6px] w-[16%] rounded-b-[8px] bg-[#4a4d56]" />
        </div>
      </div>
      <p className="m704-cap absolute inset-x-0 bottom-[10%] z-30 text-center text-[clamp(28px,3.4vw,52px)] leading-none text-white" style={{ fontFamily: EDITORIAL, opacity: 0 }}>
        Your whole studio, edge to edge.
      </p>
      <Sheen g1="rgba(120,150,255,.5)" />
    </Stage>
  );
}

/* ---------- M705 · Scanner beam turns cards to ASCII (variant of M14) ---------- */
const M705_CARDS = [
  { name: "Tidal Can 330", price: "₹180" },
  { name: "Amber Tonic", price: "₹240" },
  { name: "Fern Soda", price: "₹160" },
  { name: "Ember Cola", price: "₹190" },
  { name: "Night Brew", price: "₹260" },
];
const M705_RAMP = " .:-=+*#%@";
type M705Card = { card: HTMLCanvasElement; ascii: HTMLCanvasElement };
async function m705Build(i: number, w: number, h: number): Promise<M705Card> {
  const src = await toCanvas(scene(i % 4, w, h), w, h);
  const card = document.createElement("canvas");
  card.width = w;
  card.height = h;
  const x = card.getContext("2d")!;
  x.save();
  x.beginPath();
  x.roundRect(0, 0, w, h, 22);
  x.clip();
  x.drawImage(src, 0, 0, w, h);
  const g = x.createLinearGradient(0, h * 0.55, 0, h);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,.7)");
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);
  x.fillStyle = "#fff";
  x.font = `600 ${Math.round(h * 0.075)}px "Space Grotesk Variable", system-ui, sans-serif`;
  x.fillText(M705_CARDS[i].name, w * 0.07, h * 0.88);
  x.textAlign = "right";
  x.fillStyle = "rgba(255,255,255,.75)";
  x.fillText(M705_CARDS[i].price, w * 0.93, h * 0.88);
  x.restore();
  // the ASCII twin: every 8 px cell becomes a character chosen by brightness, tinted mint
  const data = x.getImageData(0, 0, w, h).data;
  const ascii = document.createElement("canvas");
  ascii.width = w;
  ascii.height = h;
  const a = ascii.getContext("2d")!;
  a.beginPath();
  a.roundRect(0, 0, w, h, 22);
  a.clip();
  a.fillStyle = "#060a0c";
  a.fillRect(0, 0, w, h);
  const cell = 8;
  a.font = `700 ${cell + 2}px ui-monospace, Menlo, monospace`;
  a.textBaseline = "top";
  for (let y = 0; y < h; y += cell)
    for (let xx = 0; xx < w; xx += cell * 0.75) {
      const k = (Math.min(h - 1, Math.floor(y + cell / 2)) * w + Math.min(w - 1, Math.floor(xx + cell / 3))) * 4;
      const lum = (data[k] * 0.3 + data[k + 1] * 0.59 + data[k + 2] * 0.11) / 255;
      const ch = M705_RAMP[Math.min(M705_RAMP.length - 1, Math.floor(lum * M705_RAMP.length))];
      if (ch === " ") continue;
      a.fillStyle = `rgba(${Math.round(90 + lum * 150)},${Math.round(200 + lum * 55)},${Math.round(170 + lum * 70)},${(0.45 + lum * 0.55).toFixed(2)})`;
      a.fillText(ch, xx, y);
    }
  return { card, ascii };
}
function M705() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const fb = useRef<HTMLDivElement>(null);
  const cards = useRef<M705Card[] | null>(null);
  const sparks = useRef<{ x: number; y: number; vx: number; vy: number; life: number }[]>([]);
  const near = useNear(root);
  useEffect(() => {
    if (!near) return;
    let dead = false;
    Promise.resolve(document.fonts?.ready).then(async () => {
      const list = await Promise.all(M705_CARDS.map((_, i) => m705Build(i, 420, 270)));
      if (!dead) cards.current = list;
    });
    const c = cv.current;
    const ro = new ResizeObserver(() => {
      if (!c) return;
      c.width = Math.max(1, c.clientWidth);
      c.height = Math.max(1, c.clientHeight);
    });
    if (c) ro.observe(c);
    return () => {
      dead = true;
      ro.disconnect();
      cards.current = null;
    };
  }, [near]);
  useTicker(root, (t, dt) => {
    const c = cv.current;
    const list = cards.current;
    if (!c || !list) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const W = c.width;
    const H = c.height;
    ctx.clearRect(0, 0, W, H);
    const ch = H * 0.44;
    const cw = (ch * 420) / 270;
    const gap = cw * 0.12;
    const pitch = cw + gap;
    const total = pitch * list.length;
    const y0 = H * 0.5 - ch / 2 + H * 0.04;
    const bx = W / 2;
    const off = (t * 150) % total;
    let hit = false;
    for (let i = 0; i < list.length; i++) {
      const x = mod(i * pitch - off, total) - pitch * 0.6;
      if (x > W || x + cw < 0) continue;
      // clean card on the near (right) side of the beam
      if (x + cw > bx) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(bx, 0, W - bx, H);
        ctx.clip();
        ctx.drawImage(list[i].card, x, y0, cw, ch);
        ctx.restore();
      }
      // ASCII twin on the far (left) side
      if (x < bx) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, bx, H);
        ctx.clip();
        ctx.drawImage(list[i].ascii, x, y0, cw, ch);
        ctx.restore();
      }
      if (x < bx && x + cw > bx) hit = true;
    }
    // sparks fly off the beam while a card passes under it
    const sp = sparks.current;
    if (hit)
      for (let k = 0; k < 3; k++) sp.push({ x: bx, y: y0 + Math.random() * ch, vx: -40 - Math.random() * 160, vy: (Math.random() - 0.5) * 60, life: 0.5 + Math.random() * 0.4 });
    ctx.globalCompositeOperation = "lighter";
    const beam = ctx.createLinearGradient(bx - 70, 0, bx + 70, 0);
    beam.addColorStop(0, "rgba(80,255,200,0)");
    beam.addColorStop(0.5, `rgba(80,255,200,${hit ? 0.5 : 0.28})`);
    beam.addColorStop(1, "rgba(80,255,200,0)");
    ctx.fillStyle = beam;
    ctx.fillRect(bx - 70, y0 - ch * 0.25, 140, ch * 1.5);
    ctx.fillStyle = "rgba(220,255,245,.95)";
    ctx.fillRect(bx - 1.5, y0 - ch * 0.2, 3, ch * 1.4);
    for (let k = sp.length - 1; k >= 0; k--) {
      const s = sp[k];
      s.life -= dt;
      if (s.life <= 0) {
        sp.splice(k, 1);
        continue;
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      ctx.fillStyle = `rgba(140,255,220,${Math.min(1, s.life * 1.6).toFixed(2)})`;
      ctx.fillRect(s.x, s.y, 2, 2);
    }
    if (sp.length > 260) sp.splice(0, sp.length - 260);
    ctx.globalCompositeOperation = "source-over";
    if (c.style.opacity !== "1") {
      c.style.opacity = "1";
      if (fb.current) fb.current.style.visibility = "hidden";
    }
  });
  return (
    <Stage r={root} bg="#05080a" g1="rgba(60,220,170,.5)" g2="rgba(90,120,255,.2)">
      <div className="absolute inset-x-0 top-[7%] z-20 text-center">
        <p className="text-[13px] uppercase tracking-[0.26em] text-[#8fffd8]/70" style={{ fontFamily: GROTESK }}>
          Catalogue · live scan
        </p>
        <h3 className="mt-2 text-[clamp(30px,3.4vw,52px)] font-semibold leading-none tracking-[-0.03em]" style={{ fontFamily: GROTESK }}>
          Every can, decoded.
        </h3>
      </div>
      <span className="absolute bottom-[8%] left-[6%] z-20 text-[12px] uppercase tracking-[0.22em] text-[#8fffd8]/70" style={{ fontFamily: "ui-monospace, monospace" }}>
        ← parsed
      </span>
      <span className="absolute bottom-[8%] right-[6%] z-20 text-[12px] uppercase tracking-[0.22em] text-white/60" style={{ fontFamily: "ui-monospace, monospace" }}>
        incoming →
      </span>
      <div ref={fb} className="absolute inset-x-0 top-[32%] flex h-[44%] items-center justify-center gap-[2%]">
        {[1, 2, 3].map((i) => (
          <div key={i} className="aspect-[42/27] h-full overflow-hidden rounded-[18px]">
            <Img i={i} w={420} h={270} />
          </div>
        ))}
        <div className="absolute left-1/2 top-[-10%] h-[120%] w-[3px] bg-[#dcfff4] shadow-[0_0_30px_8px_rgba(80,255,200,.45)]" />
      </div>
      <canvas ref={cv} className="absolute inset-0 h-full w-full" style={{ opacity: 0 }} />
      <Sheen g1="rgba(60,220,170,.5)" />
    </Stage>
  );
}

/* ---------- M706 · Distorted glass header ---------- */
const M706_ITEMS = [
  { n: "Drift Lounge Chair", p: "₹48,500" },
  { n: "Halo Floor Lamp", p: "₹18,900" },
  { n: "Basalt Side Table", p: "₹22,400" },
  { n: "Linen Daybed", p: "₹96,000" },
  { n: "Cove Shelf", p: "₹31,200" },
  { n: "Moss Rug 2×3", p: "₹27,800" },
];
function M706Page() {
  return (
    <div className="px-[6%] pb-[6%] pt-[15%]" style={{ fontFamily: MANROPE }}>
      <h3 className="text-[clamp(44px,6vw,92px)] leading-[0.92] tracking-[-0.03em] text-[#1d1a17]" style={{ fontFamily: SERIF }}>
        Quiet pieces <br />
        <em className="text-[#b5532e]">for loud rooms.</em>
      </h3>
      <div className="mt-[5%] grid grid-cols-3 gap-[2.4%]">
        {M706_ITEMS.map((it, i) => (
          <div key={i}>
            <div className="aspect-[4/3] overflow-hidden rounded-[12px]">
              <Img i={(i + 1) % 4} w={640} h={480} />
            </div>
            <p className="mt-2 flex justify-between text-[15px] text-[#1d1a17]">
              <span>{it.n}</span>
              <span className="text-[#1d1a17]/55">{it.p}</span>
            </p>
          </div>
        ))}
      </div>
      <p className="mt-[6%] text-[clamp(30px,3.8vw,58px)] leading-none tracking-[-0.02em] text-[#1d1a17]" style={{ fontFamily: EDITORIAL }}>
        Made slowly in Jaipur. Shipped in a week.
      </p>
    </div>
  );
}
function M706() {
  const root = useRef<HTMLDivElement>(null);
  const id = `m706g${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  useScrub(
    root,
    (p, v) => {
      const el = root.current;
      if (!el) return;
      // both copies of the page scroll together; the copy inside the header is seen through the displaced glass
      el.querySelectorAll<HTMLElement>(".m706-page").forEach((pg) => (pg.style.transform = `translate3d(0,${(-p * 45).toFixed(2)}%,0)`));
      const d = el.querySelector<SVGFEDisplacementMapElement>(".m706-disp");
      if (d) d.setAttribute("scale", (30 + 16 * Math.sin(p * Math.PI * 5) + Math.abs(v) * 30).toFixed(1));
      const bar = el.querySelector<HTMLElement>(".m706-bar");
      if (bar) bar.style.transform = `scaleX(${p.toFixed(4)})`;
    },
    { finalValue: 0.3 },
  );
  return (
    <Stage r={root} bg="#0c0b0a" g1="rgba(255,170,120,.5)" g2="rgba(140,170,255,.22)">
      <svg width="0" height="0" className="absolute" aria-hidden>
        <filter id={id} x="-4%" y="-10%" width="108%" height="120%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.009 0.05" numOctaves={1} seed={7} result="n" />
          <feDisplacementMap className="m706-disp" in="SourceGraphic" in2="n" scale="34" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <div className="absolute inset-[5%] overflow-hidden rounded-[18px] bg-[#f2ece3] shadow-[0_30px_80px_rgba(0,0,0,.5)]">
        <div className="m706-page absolute inset-x-0 top-0">
          <M706Page />
        </div>
        {/* sticky glass header: the same page underneath, displaced by fractal noise */}
        <div className="absolute inset-x-0 top-0 z-10 h-[22%] overflow-hidden border-b border-white/60">
          <div className="absolute inset-0" style={{ filter: `url(#${id})` }}>
            <div className="m706-page absolute inset-x-0 top-0 bg-[#f2ece3]">
              <M706Page />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-white/45 to-white/15" />
          <div className="m706-sheen" />
          <div className="absolute inset-x-0 top-0 h-px bg-white" />
          <div className="relative flex h-full items-center justify-between px-[4%] text-[#1d1a17]" style={{ fontFamily: GROTESK }}>
            <span className="text-[22px] font-semibold tracking-[-0.02em]">Morrow &amp; Pine</span>
            <span className="flex gap-[28px] text-[13px] uppercase tracking-[0.18em] text-[#1d1a17]/70">
              <span>Living</span>
              <span>Lighting</span>
              <span>Journal</span>
              <span className="text-[#b5532e]">Cart · 2</span>
            </span>
          </div>
          <div className="m706-bar absolute bottom-0 left-0 h-[2px] w-full origin-left bg-[#b5532e]" style={{ transform: "scaleX(.3)" }} />
        </div>
      </div>
    </Stage>
  );
}

/* ---------- M707 · Horizon rim wipe (variant of M61) ---------- */
function M707() {
  const root = useRef<HTMLDivElement>(null);
  useScrub(
    root,
    (p) => {
      const el = root.current;
      if (!el) return;
      const rim = el.querySelector<HTMLElement>(".m707-rim");
      const atm = el.querySelector<HTMLElement>(".m707-atm");
      const soft = el.querySelector<HTMLElement>(".m707-soft");
      const sharp = el.querySelector<HTMLElement>(".m707-sharp");
      const sub = el.querySelector<HTMLElement>(".m707-sub");
      // the rim wipes on from the centre outward over the whole panel
      if (rim) rim.style.setProperty("--w", `${(p * 54).toFixed(2)}%`);
      if (atm) atm.style.opacity = (0.15 + p * 0.85).toFixed(3);
      // the headline un-blurs: a fixed-blur copy fades out while the sharp copy fades in and tightens
      const k = smooth(p * 1.05);
      if (soft) soft.style.opacity = (1 - k).toFixed(3);
      if (sharp) {
        sharp.style.opacity = k.toFixed(3);
        sharp.style.letterSpacing = `${lerp(0.14, -0.02, k).toFixed(3)}em`;
      }
      if (soft) soft.style.letterSpacing = `${lerp(0.14, -0.02, k).toFixed(3)}em`;
      if (sub) sub.style.opacity = smooth((p - 0.6) / 0.35).toFixed(3);
    },
    { finalValue: 1 },
  );
  const rimMask = "linear-gradient(90deg,transparent calc(50% - var(--w)),#000 calc(50% - var(--w) + 6%),#000 calc(50% + var(--w) - 6%),transparent calc(50% + var(--w)))";
  return (
    <Stage r={root} bg="#03050b" g1="rgba(90,140,255,.5)" g2="rgba(160,110,255,.2)">
      <div className="m707-stars" aria-hidden />
      <div className="absolute inset-x-0 top-[16%] z-10 text-center">
        <div className="relative inline-block">
          <h3 className="m707-soft absolute inset-0 text-[clamp(46px,6vw,96px)] font-extrabold uppercase leading-none" style={{ fontFamily: WIDE, filter: "blur(12px)", opacity: 0, letterSpacing: "-0.02em" }} aria-hidden>
            Beyond orbit
          </h3>
          <h3 className="m707-sharp text-[clamp(46px,6vw,96px)] font-extrabold uppercase leading-none" style={{ fontFamily: WIDE, letterSpacing: "-0.02em" }}>
            Beyond orbit
          </h3>
        </div>
        <p className="m707-sub mt-4 text-[15px] tracking-[0.06em] text-white/70" style={{ fontFamily: MANROPE }}>
          Satellite broadband for remote studios · ₹2,499 / month
        </p>
      </div>
      {/* atmosphere glow above the rim */}
      <div className="m707-atm absolute inset-x-[-10%] top-[46%] h-[50%]" style={{ background: "radial-gradient(50% 60% at 50% 100%,rgba(110,160,255,.45),transparent 70%)" }} aria-hidden />
      {/* the planet body */}
      <div className="absolute left-[-40%] top-[66%] aspect-square w-[180%] rounded-full" style={{ background: "radial-gradient(60% 50% at 50% 0%,#0d1830,#03050b 60%)" }} aria-hidden />
      {/* the rim of light, wiped on through a mask */}
      <div
        className="m707-rim absolute left-[-40%] top-[66%] aspect-square w-[180%] rounded-full"
        style={{ "--w": "54%", boxShadow: "inset 0 3px 0 rgba(220,235,255,.95), inset 0 14px 30px rgba(120,170,255,.55), 0 -6px 40px rgba(120,170,255,.6), 0 -2px 8px rgba(230,240,255,.9)", maskImage: rimMask, WebkitMaskImage: rimMask } as CSSProperties}
        aria-hidden
      />
    </Stage>
  );
}

/* ---------- M708 · Direction-aware illustration ---------- */
function M708() {
  const root = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  // the real scroll direction steers it too (outside record mode): a mismatched phase jumps to the matching turn
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let last = window.scrollY;
    const onScroll = () => {
      const d = window.scrollY - last;
      last = window.scrollY;
      const tl = tlRef.current;
      if (!tl || isRecording() || Math.abs(d) < 3) return;
      const tUp = tl.labels.flipUp;
      const tDown = tl.labels.flipDown;
      const t = tl.time();
      const inUp = t >= tUp && t < tDown;
      if (d > 0 && inUp) tl.seek(tDown);
      if (d < 0 && !inUp) tl.seek(tUp);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      tlRef.current = null;
    };
  }, []);
  usePlay(root, (el) => {
    const q = (s: string) => el.querySelector(s);
    const rider = q(".m708-rider");
    const body = q(".m708-body");
    const wheels = el.querySelectorAll(".m708-wheel");
    const thumb = q(".m708-thumb");
    const road = q(".m708-road");
    const lines = q(".m708-lines");
    const stars = el.querySelectorAll(".m708-star");
    const dn = q(".m708-dn");
    const up = q(".m708-up");
    gsap.set(wheels, { transformOrigin: "50% 50%" });
    gsap.set(rider, { x: -300, scaleX: 1, transformOrigin: "50% 100%" });
    gsap.set(body, { transformOrigin: "30% 100%" });
    gsap.set(up, { autoAlpha: 0 });
    gsap.set(stars, { scale: 0, transformOrigin: "50% 50%" });
    const tl = gsap.timeline({ repeat: -1, defaults: { ease: "none" } });
    // scrolling DOWN: drive forward, wheels spin, speed lines stream behind
    tl.addLabel("down")
      .to(rider, { x: 300, duration: 2 }, "down")
      .to(wheels, { rotation: "+=900", duration: 2 }, "down")
      .to(thumb, { y: 150, duration: 2 }, "down")
      .to(road, { attr: { "stroke-dashoffset": -400 }, duration: 2 }, "down")
      .fromTo(lines, { opacity: 0.2, x: 0 }, { opacity: 0.9, x: -30, duration: 0.5, yoyo: true, repeat: 3, ease: "sine.inOut" }, "down")
      .to(body, { y: -4, duration: 0.25, yoyo: true, repeat: 7, ease: "sine.inOut" }, "down");
    // scrolling UP: a different animation — the scooter hops and turns around, then pops a wheelie back
    tl.addLabel("flipUp")
      .to(dn, { autoAlpha: 0, y: -10, duration: 0.2 }, "flipUp")
      .fromTo(up, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.2 }, "flipUp+=.1")
      .to(rider, { keyframes: [{ y: -50, scaleX: 0, duration: 0.22, ease: "power2.out" }, { y: 0, scaleX: -1, duration: 0.23, ease: "power2.in" }] }, "flipUp")
      .to(lines, { opacity: 0, duration: 0.2 }, "flipUp")
      .addLabel("up")
      .to(rider, { x: -300, duration: 2 }, "up")
      .to(wheels, { rotation: "+=900", duration: 2 }, "up")
      .to(thumb, { y: 0, duration: 2 }, "up")
      .to(road, { attr: { "stroke-dashoffset": 0 }, duration: 2 }, "up")
      .to(body, { rotation: -14, duration: 0.5, yoyo: true, repeat: 3, ease: "sine.inOut" }, "up")
      .to(stars, { scale: 1, rotation: 180, duration: 0.5, stagger: 0.25, yoyo: true, repeat: 1, ease: "sine.inOut" }, "up+=.2");
    tl.addLabel("flipDown")
      .to(up, { autoAlpha: 0, y: -10, duration: 0.2 }, "flipDown")
      .fromTo(dn, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.2 }, "flipDown+=.1")
      .to(rider, { keyframes: [{ y: -50, scaleX: 0, duration: 0.22, ease: "power2.out" }, { y: 0, scaleX: 1, duration: 0.23, ease: "power2.in" }] }, "flipDown");
    tlRef.current = tl;
    return tl;
  });
  const Wheel = ({ cx }: { cx: number }) => (
    <g className="m708-wheel">
      <circle cx={cx} cy={128} r={22} fill="#141824" stroke="#e9edf7" strokeWidth={5} />
      <path d={`M${cx - 18} 128H${cx + 18}M${cx} 110V146M${cx - 12} 116L${cx + 12} 140M${cx + 12} 116L${cx - 12} 140`} stroke="#e9edf7" strokeWidth={2.5} />
      <circle cx={cx} cy={128} r={4} fill="#ffb347" />
    </g>
  );
  return (
    <Stage r={root} bg="#0b0d14" g1="rgba(255,170,80,.5)" g2="rgba(90,140,255,.24)">
      <div className="absolute left-[6%] top-[8%] z-10" style={{ fontFamily: GROTESK }}>
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/55">Swiftly · 20-minute delivery</p>
        <h3 className="mt-2 text-[clamp(30px,3.4vw,52px)] font-semibold leading-none tracking-[-0.03em]">It rides with your scroll.</h3>
      </div>
      {/* the fake scroll: a mini scrollbar + the direction label (one label in flow, the other hidden) */}
      <div className="absolute right-[6%] top-[10%] z-10 flex items-start gap-4" style={{ fontFamily: "ui-monospace, monospace" }}>
        <div className="relative text-[13px] uppercase tracking-[0.18em] text-[#ffb347]">
          <span className="m708-dn block">↓ scrolling down</span>
          <span className="m708-up invisible absolute right-0 top-0 whitespace-nowrap">↑ scrolling up</span>
        </div>
        <div className="relative h-[190px] w-[6px] rounded-full bg-white/12">
          <div className="m708-thumb absolute left-0 top-0 h-[40px] w-[6px] rounded-full bg-[#ffb347]" />
        </div>
      </div>
      <svg viewBox="-450 0 900 220" className="absolute inset-x-0 bottom-[10%] h-[56%] w-full" aria-hidden>
        <line className="m708-road" x1={-450} y1={152} x2={450} y2={152} stroke="rgba(255,255,255,.35)" strokeWidth={3} strokeDasharray="30 20" strokeDashoffset={0} />
        <g className="m708-rider">
          <g className="m708-lines" opacity={0.2} stroke="#ffb347" strokeWidth={3} strokeLinecap="round">
            <path d="M-120 70H-70M-140 95H-80M-110 120H-75" />
          </g>
          <g className="m708-body">
            {/* delivery box */}
            <rect x={-62} y={40} width={58} height={50} rx={6} fill="#ffb347" />
            <path d="M-62 58H-4" stroke="#7a4a12" strokeWidth={3} />
            {/* scooter frame */}
            <path d="M-50 128H30L52 70H66" fill="none" stroke="#e9edf7" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M-60 104Q-40 88 -6 96H30L20 124H-48Z" fill="#4f7cff" />
            {/* rider */}
            <circle cx={22} cy={22} r={13} fill="#f1d3b5" />
            <path d="M8 18Q22 2 36 18Z" fill="#ffb347" />
            <path d="M14 36Q0 60 8 96H30L34 60Q36 44 22 36Z" fill="#2b3350" />
            <path d="M30 48L58 70" stroke="#2b3350" strokeWidth={8} strokeLinecap="round" />
            <Wheel cx={-40} />
            <Wheel cx={52} />
          </g>
        </g>
        {[-180, 0, 180].map((x, i) => (
          <path key={i} className="m708-star" d={`M${x} 30l5 12 12 5-12 5-5 12-5-12-12-5 12-5z`} fill="#ffe2a8" />
        ))}
      </svg>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M704", name: "Laptop lid opens, screen flies out", how: "Scroll opens the laptop lid (rotateX −28° → 0), then the screen image scales up and flies past the viewer, out of the frame.", kind: "scrub", C: M704 },
  { code: "M705", name: "Scanner beam turns cards to ASCII", how: "Product cards stream under a central scanner beam and come out the far side as ASCII art, with sparks at the beam.", kind: "play", C: M705 },
  { code: "M706", name: "Distorted glass header", how: "A sticky glass header with fractal-noise displacement warps the page content scrolling underneath it.", kind: "scrub", C: M706 },
  { code: "M707", name: "Horizon rim wipe", how: "A planet-horizon rim of light wipes on from the centre while the headline un-blurs, both following the scroll.", kind: "scrub", C: M707 },
  { code: "M708", name: "Direction-aware illustration", how: "An SVG scooter drives forward while scrolling down and hops, turns and pops a wheelie when scrolling up (auto-alternates).", kind: "play", C: M708 },
];
