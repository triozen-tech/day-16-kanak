"use client";

// Micro-interactions, batch 5 · group 4 (MOTION-MENU U79–U90). Small focused demos for /lab/motion.
// Every hover / click demo also plays by itself: a visible fake pointer (ring) walks a scripted path and drives the
// same state the real mouse does; the real mouse takes over for 2.5 s whenever it moves. Everything pauses off screen
// (the pointer runs on a ticker gated by an IntersectionObserver). A CSS-only glow loop never stops (and sits on top
// again, screen-blended). ?static=1 / reduced motion: no JS, the markup shows the hovered / open / final state.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, SplitText, loadPlugin, prefersReducedMotion } from "@/lib/gsap";
import { scene, useTicker } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = {
  sg: "Space Grotesk Variable",
  fr: "Fraunces Variable",
  is: "Instrument Serif",
  sy: "Syne Variable",
  mr: "Manrope Variable",
};

const EZ = "cubic-bezier(.2,.7,.2,1)";
const EIO = "cubic-bezier(.65,0,.35,1)";

const CSS = `
.b5g4-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.55)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.22)),transparent 70%);animation:b5g4-drift 5.6s linear infinite alternate;will-change:transform}
@keyframes b5g4-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b5g4-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;pointer-events:none;z-index:40;opacity:0;transition:opacity .25s}
.b5g4-dot>span{display:block;width:100%;height:100%;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4)}
.b5g4-dot.tap>span{animation:b5g4-tap .38s ${EZ}}
@keyframes b5g4-tap{0%{transform:scale(1)}35%{transform:scale(.55);background:rgba(255,255,255,.6)}100%{transform:scale(1)}}

/* U79 border spotlight */
.u79-card{position:relative;border-radius:26px;background:rgba(255,255,255,.025)}
.u79-card::before{content:"";position:absolute;inset:0;border-radius:inherit;border:1px solid rgba(255,255,255,.08);pointer-events:none}
.u79-edge{position:absolute;inset:0;border-radius:inherit;padding:1.5px;pointer-events:none;
  background:radial-gradient(240px circle at var(--x,40%) var(--y,0%),#c8ff8a 0%,rgba(79,141,255,.85) 32%,transparent 68%);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0)}

/* U80 tilt + spotlight + colourize */
.u80-img{filter:grayscale(1) contrast(1.05) brightness(.85);transition:filter .7s ${EZ},transform .9s ${EZ}}
.u80-card.on .u80-img{filter:grayscale(0) contrast(1) brightness(1);transform:scale(1.04)}
.u80-spot{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .35s;background:radial-gradient(260px circle at var(--x,50%) var(--y,40%),rgba(255,255,255,.34),rgba(255,255,255,.06) 45%,transparent 70%);mix-blend-mode:soft-light}
.u80-card.on .u80-spot{opacity:1}

/* U81 flip cards */
.u81-c{perspective:1100px}
.u81-in{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .85s ${EIO}}
.u81-x.on .u81-in{transform:rotateX(180deg)}
.u81-y.on .u81-in{transform:rotateY(180deg)}
.u81-d.on .u81-in{transform:rotate3d(1,1,0,180deg)}
.u81-f,.u81-b{position:absolute;inset:0;border-radius:22px;overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden}
.u81-x .u81-b{transform:rotateX(180deg)}
.u81-y .u81-b{transform:rotateY(180deg)}
.u81-d .u81-b{transform:rotate3d(1,1,0,180deg)}

/* U82 underline to block */
.u82-a{position:relative;isolation:isolate;display:inline-block;padding:0 .14em;color:#eef2ff;transition:color .42s ${EIO}}
.u82-a::before{content:"";position:absolute;left:0;right:0;bottom:.04em;height:3px;background:#ffb36b;z-index:-1;transition:height .45s ${EIO}}
.u82-a.on{color:#140c05}
.u82-a.on::before{height:calc(100% - .04em)}
.u82-n{transition:color .4s,transform .45s ${EZ}}
.u82-row.on .u82-n{color:#ffb36b;transform:translateX(6px)}

/* U84 plus to panel */
.u84-box{position:absolute;right:0;bottom:0;width:72px;height:72px;border-radius:36px;overflow:hidden;background:#f4efe6;color:#15130f;box-shadow:0 24px 60px rgba(0,0,0,.45)}
.u84-box.open{width:440px;height:340px;border-radius:30px}

/* U85 vertical slide */
.u85-m{display:block;overflow:hidden;height:1.3em;line-height:1.3em}
.u85-r{display:flex;flex-direction:column;transition:transform .34s cubic-bezier(.6,0,.2,1)}
.u85-r>span{height:1.3em}
.u85-b.on .u85-r{transform:translateY(-50%)}
.u85-b{transition:background-color .34s,color .34s,border-color .34s}
.u85-s.on{background:#c8ff8a;color:#0b1206}
.u85-o.on{border-color:#c8ff8a}
.u85-t.on{color:#c8ff8a}

/* U88 shifting dropdown */
.u88-it{transition:color .3s}
.u88-it.on{color:#fff}

/* U90 reparent */
.u90-tray .u90-chip{font-size:13px;padding:6px 12px 6px 6px}
.u90-tray .u90-th{width:30px;height:30px}

html.is-static .b5g4-glow{animation:none}
html.is-static {
  .b5g4-glow,.b5g4-dot.tap>span{animation:none}
  .u80-img,.u80-spot,.u81-in,.u82-a,.u82-a::before,.u82-n,.u85-r,.u85-b,.u88-it{transition:none}
}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop, again on top (screen blend) so covered stages never freeze. */
function Stage({ r, children, g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; g1?: string; g2?: string }) {
  return (
    <div ref={r} className="relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0d16] text-[#eef2ff]">
      <style href="b5g4-css" precedence="default">
        {CSS}
      </style>
      <div className="b5g4-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
      <div className="b5g4-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.45, zIndex: 35 } as CSSProperties} aria-hidden />
    </div>
  );
}

/** The visible fake pointer (a ring). */
const Dot = ({ r }: { r: RefObject<HTMLDivElement | null> }) => (
  <div ref={r} className="b5g4-dot" aria-hidden>
    <span />
  </div>
);
function tapDot(d: HTMLElement | null) {
  if (!d) return;
  d.classList.remove("tap");
  void d.offsetWidth;
  d.classList.add("tap");
}

type Pt = { x: number; y: number; inside: boolean };
type Box = { l: number; t: number; w: number; h: number };

function rel(node: Element, root: Element): Box {
  const a = node.getBoundingClientRect();
  const r = root.getBoundingClientRect();
  return { l: a.left - r.left, t: a.top - r.top, w: a.width, h: a.height };
}
const inBox = (b: Box, x: number, y: number, pad = 0) => x >= b.l - pad && x <= b.l + b.w + pad && y >= b.t - pad && y <= b.t + b.h + pad;
const centre = (node: Element, root: Element, fx = 0.5, fy = 0.5): [number, number] => {
  const b = rel(node, root);
  return [b.l + b.w * fx, b.t + b.h * fy];
};

/** Pointer driver: the real mouse wins for 2.5 s after it last moved; otherwise `script` moves a visible fake ring. */
function usePointer(
  root: RefObject<HTMLDivElement | null>,
  dot: RefObject<HTMLDivElement | null>,
  script: (t: number, el: HTMLDivElement) => Pt,
  frame: (p: Pt, el: HTMLDivElement, fake: boolean, dt: number) => void,
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
    fr.current(p, el, !useReal, dt);
  });
}

const easeIO = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/** A path that holds at each point and glides to the next during the last `move` part of every `seg` seconds. */
function stepPath(t: number, pts: [number, number][], seg: number, move = 0.35): [number, number] {
  const n = pts.length;
  const k = Math.floor(t / seg);
  const f = t / seg - k;
  const a = pts[k % n];
  const b = pts[(k + 1) % n];
  const m = f < 1 - move ? 0 : easeIO((f - (1 - move)) / move);
  return [a[0] + (b[0] - a[0]) * m, a[1] + (b[1] - a[1]) * m];
}

/** Hover walk: the fake ring visits targets (`sel`) in `order` (-1 = a resting spot off the targets); whichever target
 *  holds the pointer (fake or real) gets the class "on". `onChange` runs when the hovered target changes. */
function useWalk(
  root: RefObject<HTMLDivElement | null>,
  dot: RefObject<HTMLDivElement | null>,
  o: {
    sel: string;
    order: number[];
    seg?: number;
    move?: number;
    wob?: number;
    at?: (b: Box, i: number) => [number, number];
    off?: (w: number, h: number) => [number, number];
    onChange?: (now: number, prev: number, p: Pt, el: HTMLDivElement) => void;
  },
) {
  const cur = useRef(-2);
  usePointer(
    root,
    dot,
    (t, el) => {
      const tg = el.querySelectorAll(o.sel);
      const w = el.clientWidth;
      const h = el.clientHeight;
      const pts: [number, number][] = o.order.map((i) => {
        if (i < 0 || !tg[i]) return o.off ? o.off(w, h) : [w * 0.5, h * 0.92];
        const b = rel(tg[i], el);
        return o.at ? o.at(b, i) : [b.l + b.w / 2, b.t + b.h / 2];
      });
      const [x, y] = stepPath(t, pts, o.seg ?? 1.2, o.move ?? 0.4);
      const wb = o.wob ?? 8;
      return { x: x + Math.sin(t * 2.1) * wb, y: y + Math.cos(t * 1.7) * wb * 0.8, inside: true };
    },
    (p, el) => {
      const tg = [...el.querySelectorAll(o.sel)];
      const idx = p.inside ? tg.findIndex((n) => inBox(rel(n, el), p.x, p.y)) : -1;
      if (idx === cur.current) return;
      const prev = cur.current;
      cur.current = idx;
      tg.forEach((n, i) => n.classList.toggle("on", i === idx));
      o.onChange?.(idx, prev, p, el);
    },
  );
}

/** Slow figure-eight around a box (leaves it at both ends when `ax` > 0.5). */
function eight(b: Box, t: number, period: number, ax = 0.62, ay = 0.36): [number, number] {
  const w = (Math.PI * 2) / period;
  return [b.l + b.w / 2 + b.w * ax * Math.sin(t * w), b.t + b.h / 2 + b.h * ay * Math.sin(2 * t * w + 0.4)];
}

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, className = "", w = 600, h = 800 }: { i: number; className?: string; w?: number; h?: number }) => (
  <img src={scene(i, w, h)} alt="" className={`block h-full w-full object-cover ${className}`} draggable={false} />
);

const Eyebrow = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <p className={`text-[13px] uppercase tracking-[0.22em] text-white/55 ${className}`} style={{ fontFamily: F.sg }}>
    {children}
  </p>
);

type FlipT = typeof import("gsap/Flip").Flip;
function useFlip() {
  const f = useRef<FlipT | null>(null);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    loadPlugin("Flip").then((x) => (f.current = x));
  }, []);
  return f;
}

/* ───────────────────────── U79 · Spotlight border only ───────────────────────── */
const U79_PLANS = [
  { n: "Studio", p: "₹2,400", s: "per month", f: ["One desk, any day", "Meeting room · 4 h", "Locker + coffee"] },
  { n: "Resident", p: "₹6,900", s: "per month", f: ["Your own desk", "Meeting room · 12 h", "Mail + guest passes"] },
  { n: "Suite", p: "₹18,500", s: "per month", f: ["Private room for 4", "Unlimited meetings", "Event space credits"] },
];
function U79() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  usePointer(
    root,
    dot,
    (t, el) => {
      const row = el.querySelector(".u79-row");
      if (!row) return { x: 0, y: 0, inside: false };
      const [x, y] = eight(rel(row, el), t, 6.2, 0.5, 0.62);
      return { x, y, inside: true };
    },
    (p, el) => {
      el.querySelectorAll<HTMLElement>(".u79-card").forEach((c) => {
        const b = rel(c, el);
        c.style.setProperty("--x", `${(p.x - b.l).toFixed(1)}px`);
        c.style.setProperty("--y", `${(p.y - b.t).toFixed(1)}px`);
      });
    },
  );
  return (
    <Stage r={root} g1="rgba(79,141,255,.5)" g2="rgba(200,255,138,.18)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[5vh]">
        <Eyebrow>Kiln Street Commons · memberships</Eyebrow>
        <div className="u79-row flex gap-[1.8vw]">
          {U79_PLANS.map((pl, i) => (
            <div key={pl.n} className="u79-card w-[clamp(250px,22vw,320px)] px-8 pb-8 pt-9" style={{ "--x": `${30 + i * 20}%`, "--y": "0%" } as CSSProperties} data-cursor="Choose">
              <div className="u79-edge" aria-hidden />
              <p className="text-[14px] uppercase tracking-[0.2em] text-white/55" style={{ fontFamily: F.sg }}>
                {pl.n}
              </p>
              <p className="mt-5 text-[clamp(40px,4.4vh,54px)] leading-none" style={{ fontFamily: F.fr, fontWeight: 400 }}>
                {pl.p}
              </p>
              <p className="mt-2 text-[13px] text-white/45" style={{ fontFamily: F.sg }}>
                {pl.s}
              </p>
              <ul className="mt-7 flex flex-col gap-3 border-t border-white/10 pt-6 text-[15px] text-white/75" style={{ fontFamily: F.mr }}>
                {pl.f.map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <span className="h-[6px] w-[6px] rounded-full bg-[#c8ff8a]" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U80 · Tilt + spotlight + colourize ───────────────────────── */
function U80() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const q = useRef<{ rx: (v: number) => void; ry: (v: number) => void } | null>(null);
  const was = useRef(true);
  useEffect(() => {
    const card = root.current?.querySelector<HTMLElement>(".u80-card");
    if (!card || prefersReducedMotion()) return;
    gsap.set(card, { transformPerspective: 1000 });
    // soft wobbly spring: an elastic tail on every retarget
    q.current = {
      rx: gsap.quickTo(card, "rotationX", { duration: 1.1, ease: "elastic.out(1,0.42)" }),
      ry: gsap.quickTo(card, "rotationY", { duration: 1.1, ease: "elastic.out(1,0.42)" }),
    };
    return () => {
      gsap.killTweensOf(card);
      q.current = null;
    };
  }, []);
  usePointer(
    root,
    dot,
    (t, el) => {
      const c = el.querySelector(".u80-wrap");
      if (!c) return { x: 0, y: 0, inside: false };
      const [x, y] = eight(rel(c, el), t, 5.6, 0.78, 0.38);
      return { x, y, inside: true };
    },
    (p, el) => {
      const wrap = el.querySelector(".u80-wrap");
      const card = el.querySelector<HTMLElement>(".u80-card");
      if (!wrap || !card) return;
      const b = rel(wrap, el);
      const on = p.inside && inBox(b, p.x, p.y);
      if (on !== was.current) {
        card.classList.toggle("on", on);
        was.current = on;
      }
      card.style.setProperty("--x", `${(p.x - b.l).toFixed(1)}px`);
      card.style.setProperty("--y", `${(p.y - b.t).toFixed(1)}px`);
      const dx = gsap.utils.clamp(-1, 1, (p.x - b.l - b.w / 2) / (b.w / 2));
      const dy = gsap.utils.clamp(-1, 1, (p.y - b.t - b.h / 2) / (b.h / 2));
      // reverse tilt: the edge nearest the pointer lifts toward the viewer
      q.current?.ry(on ? -dx * 14 : 0);
      q.current?.rx(on ? dy * 12 : 0);
    },
  );
  return (
    <Stage r={root} g1="rgba(255,122,89,.5)" g2="rgba(79,141,255,.24)">
      <div className="absolute inset-0 flex items-center justify-center gap-[6vw]">
        <div className="max-w-[340px]" style={{ fontFamily: F.sg }}>
          <Eyebrow>Atelier Sorel · AW collection</Eyebrow>
          <h3 className="mt-5 text-[clamp(44px,5vw,72px)] leading-[0.95]" style={{ fontFamily: F.is }}>
            Ember wool overcoat
          </h3>
          <p className="mt-5 text-[16px] text-white/60">Hand-felted in small batches. Hover to see it in colour.</p>
          <p className="mt-6 text-[22px]">₹24,800</p>
        </div>
        <div className="u80-wrap relative h-[clamp(340px,56vh,480px)] w-[clamp(270px,22vw,360px)]" data-cursor="View">
          <div className="u80-card on relative h-full w-full overflow-hidden rounded-[24px] border border-white/15 shadow-[0_40px_80px_rgba(0,0,0,.55)]">
            <Img i={1} className="u80-img" w={720} h={960} />
            <div className="u80-spot" aria-hidden />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/70 to-transparent p-6" style={{ fontFamily: F.sg }}>
              <span className="text-[13px] uppercase tracking-[0.2em] text-white/80">Rust · 01/04</span>
              <span className="text-[13px] text-white/70">Size 38–46</span>
            </div>
          </div>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U81 · Flip card X or Y ───────────────────────── */
const U81_CARDS = [
  { ax: "u81-x", lbl: "X axis", n: "Coastline", d: "3 nights · Varkala cliff villa", p: "₹21,600", img: 0 },
  { ax: "u81-y", lbl: "Y axis", n: "High Pines", d: "4 nights · Munnar tea estate", p: "₹28,900", img: 2 },
  { ax: "u81-d", lbl: "Diagonal", n: "Salt Desert", d: "2 nights · Kutch tent camp", p: "₹17,400", img: 3 },
];
function U81() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useWalk(root, dot, { sel: ".u81-c", order: [0, 1, 2, -1], seg: 1.25, move: 0.6, off: (w, h) => [w * 0.5, h * 0.94] });
  return (
    <Stage r={root} g1="rgba(24,196,143,.5)" g2="rgba(255,179,107,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[4vh]">
        <Eyebrow>Wanderhaus Trips · weekend escapes</Eyebrow>
        <div className="flex gap-[2.2vw]">
          {U81_CARDS.map((c, i) => (
            <div key={c.n} className="flex flex-col items-center gap-4">
              <div className={`u81-c ${c.ax} ${i === 0 ? "on" : ""} h-[clamp(300px,46vh,400px)] w-[clamp(220px,19vw,290px)]`} data-cursor="Flip">
                <div className="u81-in">
                  <div className="u81-f border border-white/10">
                    <Img i={c.img} w={580} h={800} />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-6">
                      <p className="text-[clamp(30px,3.6vh,40px)] leading-none" style={{ fontFamily: F.fr, fontWeight: 500 }}>
                        {c.n}
                      </p>
                    </div>
                  </div>
                  <div className="u81-b flex flex-col justify-between border border-white/15 bg-[#f3eee4] p-7 text-[#14120e]" style={{ fontFamily: F.sg }}>
                    <span className="text-[12px] uppercase tracking-[0.24em] text-black/50">Itinerary</span>
                    <div>
                      <p className="text-[clamp(30px,3.6vh,40px)] leading-none" style={{ fontFamily: F.fr, fontWeight: 500 }}>
                        {c.n}
                      </p>
                      <p className="mt-3 text-[15px] text-black/65">{c.d}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[20px] font-[600]">{c.p}</span>
                      <span className="rounded-full bg-[#14120e] px-4 py-2 text-[13px] text-[#f3eee4]">Reserve</span>
                    </div>
                  </div>
                </div>
              </div>
              <span className="text-[12px] uppercase tracking-[0.22em] text-white/45" style={{ fontFamily: F.sg }}>
                {c.lbl}
              </span>
            </div>
          ))}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U82 · Underline grows into block ───────────────────────── */
const U82_LINKS = ["Rooms & suites", "The dining hall", "Spa by the river", "Private events"];
function U82() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useWalk(root, dot, {
    sel: ".u82-a",
    order: [0, 1, 2, 3, -1],
    seg: 1.05,
    move: 0.55,
    at: (b) => [b.l + b.w * 0.4, b.t + b.h * 0.55],
    off: (w, h) => [w * 0.78, h * 0.86],
    onChange: (now, _p, _pt, el) => el.querySelectorAll(".u82-row").forEach((r, i) => r.classList.toggle("on", i === now)),
  });
  return (
    <Stage r={root} g1="rgba(255,179,107,.5)" g2="rgba(255,77,109,.2)">
      <div className="absolute inset-0 flex items-center justify-center gap-[7vw]">
        <div className="max-w-[260px]">
          <Eyebrow>Hotel Marisol · menu</Eyebrow>
          <p className="mt-5 text-[16px] leading-relaxed text-white/55" style={{ fontFamily: F.mr }}>
            Forty rooms on the old harbour wall, a kitchen that cooks over fire, and a quiet spa on the river.
          </p>
        </div>
        <nav className="flex flex-col gap-[1.2vh]">
          {U82_LINKS.map((l, i) => (
            <div key={l} className={`u82-row ${i === 0 ? "on" : ""} flex items-baseline gap-6`}>
              <span className="u82-n w-8 text-[14px] text-white/40" style={{ fontFamily: F.sg }}>
                0{i + 1}
              </span>
              <a href="#" onClick={(e) => e.preventDefault()} className={`u82-a ${i === 0 ? "on" : ""} text-[clamp(44px,7.4vh,76px)] leading-[1.12]`} style={{ fontFamily: F.fr, fontWeight: 400 }}>
                {l}
              </a>
            </div>
          ))}
        </nav>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U83 · Variable weight by proximity ───────────────────────── */
function U83() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const chars = useRef<{ el: HTMLElement; w: number }[]>([]);
  useEffect(() => {
    const h = root.current?.querySelector<HTMLElement>(".u83-h");
    if (!h || prefersReducedMotion()) return;
    let split: SplitText | null = null;
    let dead = false;
    Promise.resolve(document.fonts?.ready).then(() => {
      if (dead) return;
      split = new SplitText(h, { type: "chars" });
      chars.current = (split.chars as HTMLElement[]).map((el) => ({ el, w: 200 }));
    });
    return () => {
      dead = true;
      chars.current = [];
      split?.revert();
    };
  }, []);
  usePointer(
    root,
    dot,
    (t, el) => {
      const h = el.querySelector(".u83-h");
      if (!h) return { x: 0, y: 0, inside: false };
      const b = rel(h, el);
      // a slow sweep along the word, dipping above and below the line
      const s = Math.sin((t * Math.PI * 2) / 4.8);
      return { x: b.l + b.w / 2 + b.w * 0.56 * s, y: b.t + b.h * 0.5 + Math.sin((t * Math.PI * 2) / 2.3) * b.h * 0.38, inside: true };
    },
    (p, el, _f, dt) => {
      const R = Math.max(160, el.clientWidth * 0.17);
      const k = 1 - Math.exp(-dt * 12);
      const r0 = el.getBoundingClientRect();
      for (const c of chars.current) {
        const b = c.el.getBoundingClientRect();
        const d = Math.hypot(b.left - r0.left + b.width / 2 - p.x, b.top - r0.top + b.height / 2 - p.y);
        const f = p.inside ? Math.max(0, 1 - d / R) : 0;
        const target = 200 + 700 * f * f * (3 - 2 * f);
        c.w += (target - c.w) * k;
        c.el.style.fontVariationSettings = `"wght" ${c.w.toFixed(0)}, "opsz" ${(9 + (c.w - 200) / 7).toFixed(0)}`;
      }
    },
  );
  return (
    <Stage r={root} g1="rgba(160,120,255,.5)" g2="rgba(255,122,89,.2)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[5vh]">
        <Eyebrow>Fernhill Press · spring catalogue</Eyebrow>
        <h3 className="u83-h whitespace-nowrap text-[clamp(64px,8.6vw,150px)] leading-none tracking-[-0.02em]" style={{ fontFamily: F.fr, fontVariationSettings: '"wght" 420' }}>
          Slow Mornings
        </h3>
        <p className="text-[16px] text-white/55" style={{ fontFamily: F.mr }}>
          Twelve essays on breakfast, light and doing less · ₹899
        </p>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U84 · Plus button expands into panel ───────────────────────── */
const U84_ROWS = [
  { n: "Lake room", s: "King bed · lake view", p: "₹8,400" },
  { n: "Garden suite", s: "Private deck · bath", p: "₹12,900" },
  { n: "Boathouse", s: "Sleeps 4 · own jetty", p: "₹18,500" },
];
function U84() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const flip = useFlip();
  const open = useRef(true);
  const lastPh = useRef(-1);
  const toggle = (want: boolean) => {
    const el = root.current;
    const box = el?.querySelector<HTMLElement>(".u84-box");
    const icon = el?.querySelector<HTMLElement>(".u84-ic");
    const items = el?.querySelectorAll<HTMLElement>(".u84-i");
    if (!el || !box || !icon || !items || want === open.current) return;
    open.current = want;
    const Fl = flip.current;
    const st = Fl?.getState(box, { props: "borderRadius" });
    box.classList.toggle("open", want);
    if (Fl && st) Fl.from(st, { duration: 0.62, ease: "power3.inOut" });
    gsap.to(icon, { rotation: want ? 45 : 0, duration: 0.5, ease: "back.out(2)", overwrite: true });
    if (want) gsap.fromTo(items, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.07, delay: 0.24, ease: "power3.out", overwrite: true });
    else gsap.to(items, { autoAlpha: 0, y: 8, duration: 0.18, stagger: -0.03, ease: "power2.in", overwrite: true });
  };
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    // the markup shows the open panel (static); start the loop closed
    el.querySelector(".u84-box")?.classList.remove("open");
    gsap.set(el.querySelectorAll(".u84-i"), { autoAlpha: 0 });
    gsap.set(el.querySelector(".u84-ic"), { rotation: 0 });
    open.current = false;
    return () => {
      gsap.killTweensOf(el.querySelectorAll(".u84-i,.u84-ic,.u84-box"));
    };
  }, []);
  const C = 3.1;
  usePointer(
    root,
    dot,
    (t, el) => {
      const ic = el.querySelector(".u84-ic");
      const rows = el.querySelectorAll(".u84-i");
      if (!ic) return { x: 0, y: 0, inside: false };
      const ph = t % C;
      const home = centre(ic, el);
      // taps: open at 0.25 s, close at 2.45 s of every cycle
      const prev = lastPh.current;
      lastPh.current = ph;
      const crossed = (a: number) => (prev <= ph ? prev < a && ph >= a : ph >= a || prev < a);
      if (prev >= 0 && crossed(0.25)) {
        tapDot(dot.current);
        toggle(true);
      }
      if (prev >= 0 && crossed(2.45)) {
        tapDot(dot.current);
        toggle(false);
      }
      let x = home[0];
      let y = home[1];
      if (ph > 0.5 && ph < 2.2 && rows.length > 2) {
        // read the rooms: glide up over the rows and back down to the ✕
        const pts: [number, number][] = [home, centre(rows[1], el, 0.32), centre(rows[2], el, 0.5), centre(rows[3], el, 0.62), home];
        const u = ((ph - 0.5) / 1.7) * (pts.length - 1);
        const k = Math.min(pts.length - 2, Math.floor(u));
        const m = easeIO(u - k);
        x = pts[k][0] + (pts[k + 1][0] - pts[k][0]) * m;
        y = pts[k][1] + (pts[k + 1][1] - pts[k][1]) * m;
      }
      return { x: x + Math.sin(t * 2.3) * 6, y: y + Math.cos(t * 1.9) * 5, inside: true };
    },
    () => {},
  );
  return (
    <Stage r={root} g1="rgba(79,141,255,.5)" g2="rgba(255,179,107,.22)">
      <div className="absolute inset-0 flex items-center justify-center gap-[6vw]">
        <div className="max-w-[360px]">
          <Eyebrow>Ferncliff Lodge · Kodaikanal</Eyebrow>
          <h3 className="mt-5 text-[clamp(44px,5vw,76px)] leading-[0.95]" style={{ fontFamily: F.is }}>
            Stay by the still water
          </h3>
          <p className="mt-5 text-[16px] text-white/55" style={{ fontFamily: F.mr }}>
            One quiet button holds the whole booking menu.
          </p>
        </div>
        <div className="relative h-[340px] w-[440px]">
          <div className="u84-box open" onClick={() => toggle(!open.current)} data-cursor="Open">
            <div className="absolute bottom-0 right-0 flex h-[340px] w-[440px] flex-col p-7 pb-[92px]" style={{ fontFamily: F.sg }}>
              <p className="u84-i text-[12px] uppercase tracking-[0.24em] text-black/50">Choose a room · per night</p>
              {U84_ROWS.map((r) => (
                <div key={r.n} className="u84-i mt-3 flex items-center justify-between rounded-[16px] bg-black/[0.05] px-5 py-[14px]">
                  <div>
                    <p className="text-[18px] font-[600]">{r.n}</p>
                    <p className="text-[13px] text-black/55">{r.s}</p>
                  </div>
                  <span className="text-[17px]">{r.p}</span>
                </div>
              ))}
            </div>
            <div className="u84-ic absolute bottom-0 right-0 flex h-[72px] w-[72px] cursor-pointer items-center justify-center" style={{ transform: "rotate(45deg)" }}>
              <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
                <path d="M12 4v16M4 12h16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U85 · Vertical text slide button ───────────────────────── */
function Roll({ a, b }: { a: string; b?: string }) {
  return (
    <span className="u85-m">
      <span className="u85-r">
        <span>{a}</span>
        <span>{b ?? a}</span>
      </span>
    </span>
  );
}
function U85() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useWalk(root, dot, { sel: ".u85-b", order: [0, 1, 2, -1], seg: 1.05, move: 0.55, off: (w, h) => [w * 0.5, h * 0.86] });
  return (
    <Stage r={root} g1="rgba(200,255,138,.5)" g2="rgba(79,141,255,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[6vh]" style={{ fontFamily: F.sg }}>
        <Eyebrow>Copper Kettle · supper club</Eyebrow>
        <h3 className="text-center text-[clamp(52px,6vw,96px)] leading-[0.95]" style={{ fontFamily: F.is }}>
          Seven courses, one long table
        </h3>
        <div className="flex items-center gap-6">
          <button type="button" className="u85-b u85-s on flex items-center gap-3 rounded-full bg-white px-8 py-[18px] text-[20px] font-[600] text-[#0a0d16]" data-cursor="Book">
            <Roll a="Book a seat" />
            <Roll a="→" b="↗" />
          </button>
          <button type="button" className="u85-b u85-o rounded-full border border-white/30 px-8 py-[18px] text-[20px] font-[500]">
            <Roll a="See the menu" b="₹3,200 a head" />
          </button>
          <button type="button" className="u85-b u85-t px-4 py-[18px] text-[20px] font-[500] text-white/80">
            <Roll a="Gift a dinner" />
          </button>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U86 · Stacked notifications expand ───────────────────────── */
const U86_NOTES = [
  { t: "Order #4821 has shipped", s: "Arrives Thursday · Linen throw, Sand", c: "linear-gradient(135deg,#18c48f,#0f6a74)", ago: "2m" },
  { t: "Ira from Kestrel Goods", s: "“Your custom glaze is out of the kiln”", c: "linear-gradient(135deg,#ff7a59,#b0306a)", ago: "18m" },
  { t: "Price drop · Oak side table", s: "Now ₹7,450 (was ₹8,900)", c: "linear-gradient(135deg,#ffd59a,#e0913f)", ago: "1h" },
  { t: "Weekend workshop confirmed", s: "Saturday 11:00 · Hand-building basics", c: "linear-gradient(135deg,#7fb2ff,#2f4cff)", ago: "3h" },
];
function U86() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const set = (expand: boolean, instant = false) => {
    const el = root.current;
    if (!el) return;
    const items = [...el.querySelectorAll<HTMLElement>(".u86-n")];
    const top0 = items[0]?.offsetTop ?? 0;
    const lbl = el.querySelector<HTMLElement>(".u86-lbl");
    if (lbl) lbl.textContent = expand ? "Show less" : `${items.length} new`;
    items.forEach((n, i) => {
      const v = expand
        ? { y: 0, scale: 1, autoAlpha: 1 }
        : { y: -(n.offsetTop - top0) + i * 15, scale: 1 - i * 0.05, autoAlpha: i < 3 ? 1 - i * 0.22 : 0 };
      if (instant) gsap.set(n, v);
      else gsap.to(n, { ...v, duration: 0.6, ease: "power3.inOut", delay: expand ? i * 0.04 : (items.length - 1 - i) * 0.03, overwrite: true });
    });
  };
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    set(false, true);
    return () => {
      gsap.killTweensOf(el.querySelectorAll(".u86-n"));
    };
  }, []);
  useWalk(root, dot, {
    sel: ".u86-hit",
    order: [0, -1],
    seg: 1.3,
    move: 0.62,
    at: (b) => [b.l + b.w * 0.62, b.t + 44],
    off: (w, h) => [w * 0.8, h * 0.62],
    onChange: (now) => set(now === 0),
  });
  return (
    <Stage r={root} g1="rgba(127,178,255,.5)" g2="rgba(24,196,143,.2)">
      <div className="absolute inset-0 flex items-start justify-center gap-[6vw] pt-[12%]">
        <div className="max-w-[300px] pt-4">
          <Eyebrow>Kestrel Goods · your account</Eyebrow>
          <h3 className="mt-5 text-[clamp(44px,5vw,72px)] leading-[0.95]" style={{ fontFamily: F.is }}>
            Good news, neatly stacked
          </h3>
        </div>
        <div className="u86-hit w-[min(440px,36vw)]" style={{ fontFamily: F.sg }}>
          <div className="mb-3 flex items-center justify-between px-1 text-[13px] text-white/55">
            <span className="uppercase tracking-[0.2em]">Notifications</span>
            <span className="u86-lbl">Show less</span>
          </div>
          <div className="relative flex flex-col gap-3">
            {U86_NOTES.map((n, i) => (
              <div key={n.t} className="u86-n relative flex items-center gap-4 rounded-[20px] border border-white/12 bg-[#151a28] px-5 py-4 shadow-[0_18px_40px_rgba(0,0,0,.45)]" style={{ zIndex: 10 - i, transformOrigin: "50% 0%" }}>
                <span className="h-11 w-11 shrink-0 rounded-full" style={{ background: n.c }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px] font-[600]">{n.t}</p>
                  <p className="truncate text-[13px] text-white/55">{n.s}</p>
                </div>
                <span className="text-[12px] text-white/40">{n.ago}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U87 · Folder fans out its contents ───────────────────────── */
const U87_OPEN = [
  { x: -150, y: -130, r: -15 },
  { x: 0, y: -175, r: 0 },
  { x: 150, y: -130, r: 15 },
];
function U87() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const set = (on: boolean, instant = false) => {
    const el = root.current;
    if (!el) return;
    const papers = el.querySelectorAll<HTMLElement>(".u87-p");
    const flap = el.querySelector<HTMLElement>(".u87-flap");
    const d = instant ? 0 : 1;
    gsap.to(flap, { rotationX: on ? -36 : 0, transformPerspective: 900, duration: 0.6 * d, ease: on ? "power3.out" : "power3.inOut", overwrite: true });
    papers.forEach((p, i) => {
      const o = U87_OPEN[i];
      gsap.to(p, {
        x: on ? o.x : 0,
        y: on ? o.y : 0,
        rotation: on ? o.r : 0,
        duration: (on ? 0.75 : 0.5) * d,
        delay: d * (on ? 0.08 + Math.abs(i - 1) * 0.07 : 0),
        ease: on ? "back.out(1.3)" : "power3.inOut",
        overwrite: true,
      });
    });
  };
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    // drop the static "open" transforms written in the markup, then start closed
    el.querySelectorAll<HTMLElement>(".u87-p,.u87-flap").forEach((n) => (n.style.transform = ""));
    set(false, true);
    return () => {
      gsap.killTweensOf(el.querySelectorAll(".u87-p,.u87-flap"));
    };
  }, []);
  useWalk(root, dot, {
    sel: ".u87-f",
    order: [0, -1],
    seg: 1.35,
    move: 0.64,
    at: (b) => [b.l + b.w * 0.58, b.t + b.h * 0.62],
    off: (w, h) => [w * 0.82, h * 0.8],
    onChange: (now) => set(now === 0),
  });
  return (
    <Stage r={root} g1="rgba(255,179,107,.5)" g2="rgba(79,141,255,.2)">
      <div className="absolute inset-0 flex items-center justify-center gap-[7vw]">
        <div className="max-w-[320px]">
          <Eyebrow>Okra & Ash Studio · case files</Eyebrow>
          <h3 className="mt-5 text-[clamp(44px,5vw,72px)] leading-[0.95]" style={{ fontFamily: F.is }}>
            Monsoon lookbook
          </h3>
          <p className="mt-5 text-[16px] text-white/55" style={{ fontFamily: F.mr }}>
            24 frames · 3 locations · shot on film
          </p>
        </div>
        <div className="u87-f relative mt-[14vh] h-[250px] w-[360px]" data-cursor="Open">
          <div className="absolute inset-0 rounded-[20px] bg-gradient-to-b from-[#b86a2a] to-[#7a4116]" />
          <div className="absolute -top-[24px] left-0 h-[34px] w-[42%] rounded-t-[14px] bg-[#b86a2a]" />
          {[0, 2, 3].map((img, i) => (
            <div
              key={img}
              className="u87-p absolute bottom-[10%] left-[17%] h-[82%] w-[66%] overflow-hidden rounded-[10px] border-[5px] border-[#f4efe6] shadow-[0_14px_30px_rgba(0,0,0,.4)]"
              style={{ transform: `translate(${U87_OPEN[i].x}px,${U87_OPEN[i].y}px) rotate(${U87_OPEN[i].r}deg)`, transformOrigin: "50% 100%", zIndex: i === 1 ? 3 : 2 }}
            >
              <Img i={img} w={480} h={400} />
            </div>
          ))}
          <div
            className="u87-flap absolute bottom-0 left-0 z-10 flex h-[76%] w-full items-end justify-between rounded-[20px] bg-gradient-to-b from-[#e0913f] to-[#a95a1e] p-6 shadow-[0_-10px_30px_rgba(0,0,0,.25)]"
            style={{ transformOrigin: "50% 100%", transform: "perspective(900px) rotateX(-36deg)", fontFamily: F.sg }}
          >
            <span className="text-[14px] font-[600] uppercase tracking-[0.2em] text-[#2a1406]">Lookbook · 03</span>
            <span className="text-[13px] text-[#2a1406]/70">2026</span>
          </div>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U88 · Shifting dropdown ───────────────────────── */
const U88_ITEMS = ["Shop", "Collections", "Journal", "Stores"];
const U88_W = [440, 600, 420, 360];
const U88_H = [210, 236, 200, 190];
function U88Panel({ i }: { i: number }) {
  if (i === 0)
    return (
      <div className="grid grid-cols-2 gap-x-10 gap-y-3 p-7 text-[16px]">
        {["New arrivals", "Linen shirts", "Knitwear", "Trousers", "Bags", "Gift cards"].map((x) => (
          <span key={x} className="text-black/80">
            {x}
          </span>
        ))}
      </div>
    );
  if (i === 1)
    return (
      <div className="flex gap-4 p-6">
        {["Coast", "Indigo", "Field"].map((x, k) => (
          <div key={x} className="flex-1">
            <div className="h-[130px] overflow-hidden rounded-[12px]">
              <Img i={k + 1} w={360} h={260} />
            </div>
            <p className="mt-3 text-[15px] font-[600]">{x}</p>
            <p className="text-[13px] text-black/55">from ₹2,190</p>
          </div>
        ))}
      </div>
    );
  if (i === 2)
    return (
      <div className="flex gap-5 p-6">
        <div className="h-[150px] w-[130px] shrink-0 overflow-hidden rounded-[12px]">
          <Img i={0} w={260} h={300} />
        </div>
        <div>
          <p className="text-[12px] uppercase tracking-[0.2em] text-black/50">Journal · 06</p>
          <p className="mt-2 text-[24px] leading-tight" style={{ fontFamily: F.fr }}>
            The weavers of Chanderi
          </p>
          <p className="mt-2 text-[13px] text-black/55">8 min read</p>
        </div>
      </div>
    );
  return (
    <div className="flex flex-col gap-3 p-7 text-[16px]">
      {["Bengaluru · Indiranagar", "Mumbai · Bandra", "Jaipur · C-Scheme"].map((x) => (
        <span key={x} className="flex items-center justify-between text-black/80">
          {x}
          <span className="text-black/40">→</span>
        </span>
      ))}
    </div>
  );
}
function U88() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const place = (now: number, prev: number) => {
    const el = root.current;
    const bar = el?.querySelector<HTMLElement>(".u88-bar");
    const panel = el?.querySelector<HTMLElement>(".u88-panel");
    const nub = el?.querySelector<HTMLElement>(".u88-nub");
    const items = el?.querySelectorAll<HTMLElement>(".u88-it");
    const cs = el?.querySelectorAll<HTMLElement>(".u88-c");
    if (!el || !bar || !panel || !nub || !items || !cs) return;
    if (now < 0) {
      gsap.to(panel, { autoAlpha: 0, y: 10, duration: 0.3, ease: "power2.in", overwrite: "auto" });
      return;
    }
    const bb = rel(bar, el);
    const ib = rel(items[now], el);
    const cx = ib.l - bb.l + ib.w / 2;
    const x = gsap.utils.clamp(0, bb.w - U88_W[now], cx - U88_W[now] / 2);
    const fresh = prev < 0;
    if (fresh) {
      gsap.set(panel, { x, width: U88_W[now], height: U88_H[now] });
      gsap.set(nub, { left: 0, x: cx - x - 8 });
      gsap.fromTo(panel, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.38, ease: "power3.out", overwrite: "auto" });
      cs.forEach((c, k) => gsap.set(c, { autoAlpha: k === now ? 1 : 0, x: 0 }));
      return;
    }
    const dir = now > prev ? 1 : -1;
    gsap.to(panel, { x, width: U88_W[now], height: U88_H[now], autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out", overwrite: "auto" });
    gsap.to(nub, { left: 0, x: cx - x - 8, duration: 0.5, ease: "power3.out", overwrite: true });
    cs.forEach((c, k) => {
      if (k === now) gsap.fromTo(c, { autoAlpha: 0, x: dir * 70 }, { autoAlpha: 1, x: 0, duration: 0.45, delay: 0.06, ease: "power3.out", overwrite: true });
      else if (k === prev) gsap.to(c, { autoAlpha: 0, x: -dir * 70, duration: 0.3, ease: "power2.in", overwrite: true });
      else gsap.set(c, { autoAlpha: 0 });
    });
  };
  useEffect(() => {
    const el = root.current;
    return () => {
      if (el) gsap.killTweensOf(el.querySelectorAll(".u88-panel,.u88-nub,.u88-c"));
    };
  }, []);
  useWalk(root, dot, {
    sel: ".u88-it",
    order: [0, 1, 3, 2, -1],
    seg: 1.1,
    move: 0.56,
    wob: 5,
    at: (b) => [b.l + b.w / 2, b.t + b.h * 0.55],
    off: (w, h) => [w * 0.5, h * 0.9],
    onChange: (now, prev) => place(now, prev < 0 ? -1 : prev),
  });
  return (
    <Stage r={root} g1="rgba(255,122,89,.5)" g2="rgba(127,178,255,.22)">
      <div className="absolute inset-0 flex flex-col items-center pt-[12%]" style={{ fontFamily: F.sg }}>
        <div className="relative w-[min(860px,72%)]">
          <div className="flex items-center justify-between rounded-full border border-white/12 bg-white/[0.05] py-2 pl-8 pr-2 backdrop-blur">
            <span className="text-[22px] font-[700] tracking-[-0.02em]">loomwell</span>
            <div className="u88-bar relative flex">
              {U88_ITEMS.map((it, i) => (
                <span key={it} className={`u88-it ${i === 0 ? "on" : ""} cursor-default px-6 py-3 text-[17px] text-white/60`}>
                  {it}
                </span>
              ))}
              <div className="u88-panel absolute left-0 top-[calc(100%+18px)] z-20 overflow-visible rounded-[20px] bg-[#f4efe6] text-[#15130f] shadow-[0_30px_70px_rgba(0,0,0,.5)]" style={{ width: U88_W[0], height: U88_H[0] }}>
                <span className="u88-nub absolute -top-[7px] left-6 block h-4 w-4">
                  <span className="block h-full w-full rotate-45 rounded-[3px] bg-[#f4efe6]" />
                </span>
                <div className="relative h-full w-full overflow-hidden rounded-[20px]">
                  {U88_ITEMS.map((it, i) => (
                    <div key={it} className="u88-c absolute left-0 top-0" style={{ width: U88_W[i], visibility: i === 0 ? "visible" : "hidden" }}>
                      <U88Panel i={i} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <span className="rounded-full bg-white px-5 py-3 text-[15px] font-[600] text-[#0a0d16]">Bag · 2</span>
          </div>
        </div>
        <h3 className="absolute bottom-[10%] left-[8%] text-[clamp(44px,5.4vw,84px)] leading-[0.95] text-white/90" style={{ fontFamily: F.is }}>
          Cloth for slow summers
        </h3>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U89 · Magnetic button with wiggle settle ───────────────────────── */
/** A CustomWiggle-style ease built as a plain function: decaying oscillation that still lands exactly on 1. */
const wiggleOut =
  (waves = 4, decay = 2.2) =>
  (p: number) =>
    1 - Math.cos(p * Math.PI * 2 * waves) * Math.pow(1 - p, decay);
function U89() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const inside = useRef(false);
  useEffect(() => {
    const el = root.current;
    return () => {
      if (el) gsap.killTweensOf(el.querySelectorAll(".u89-btn,.u89-lbl"));
    };
  }, []);
  usePointer(
    root,
    dot,
    (t, el) => {
      const home = el.querySelector(".u89-home");
      if (!home) return { x: 0, y: 0, inside: false };
      const [cx, cy] = centre(home, el);
      const w = el.clientWidth;
      const h = el.clientHeight;
      const pts: [number, number][] = [
        [cx - 70, cy - 40],
        [cx + 60, cy + 46],
        [w * 0.86, h * 0.74],
        [cx + 30, cy - 60],
        [cx - 58, cy + 30],
        [w * 0.16, h * 0.3],
      ];
      const [x, y] = stepPath(t, pts, 0.95, 0.5);
      return { x: x + Math.sin(t * 2.6) * 10, y: y + Math.cos(t * 2.1) * 8, inside: true };
    },
    (p, el) => {
      const home = el.querySelector(".u89-home");
      const btn = el.querySelector(".u89-btn");
      const lbl = el.querySelector(".u89-lbl");
      if (!home || !btn || !lbl) return;
      const [cx, cy] = centre(home, el);
      const R = 190;
      const dx = p.x - cx;
      const dy = p.y - cy;
      const now = p.inside && Math.hypot(dx, dy) < R;
      if (now) {
        // follow (overwrite "auto": each new follow only replaces the x/y it touches)
        gsap.to(btn, { x: dx * 0.42, y: dy * 0.42, rotation: dx * 0.03, duration: 0.45, ease: "power3.out", overwrite: "auto" });
        gsap.to(lbl, { x: dx * 0.16, y: dy * 0.16, duration: 0.45, ease: "power3.out", overwrite: "auto" });
      } else if (inside.current) {
        // leave: overwrite true kills the follow outright, then a decaying wiggle settles it home
        gsap.to(btn, { x: 0, y: 0, rotation: 0, duration: 1.05, ease: wiggleOut(4, 2.2), overwrite: true });
        gsap.to(lbl, { x: 0, y: 0, duration: 1.05, ease: wiggleOut(5, 2.4), overwrite: true });
      }
      inside.current = now;
    },
  );
  return (
    <Stage r={root} g1="rgba(200,255,138,.5)" g2="rgba(160,120,255,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[5vh]">
        <Eyebrow>Northlane Studio · brand & web</Eyebrow>
        <h3 className="text-center text-[clamp(52px,6vw,96px)] leading-[0.95]" style={{ fontFamily: F.is }}>
          Got something worth building?
        </h3>
        <div className="u89-home relative flex h-[200px] w-[200px] items-center justify-center">
          <span className="pointer-events-none absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/12" aria-hidden />
          <button type="button" className="u89-btn flex h-[180px] w-[180px] items-center justify-center rounded-full bg-[#c8ff8a] text-[#0b1206] shadow-[0_30px_60px_rgba(0,0,0,.45)]" data-cursor="Talk">
            <span className="u89-lbl inline-block text-[20px] font-[600]" style={{ fontFamily: F.sg }}>
              Start a project
            </span>
          </button>
        </div>
        <p className="text-[13px] text-white/45" style={{ fontFamily: F.sg }}>
          follow · overwrite auto &nbsp;/&nbsp; return · overwrite true + wiggle
        </p>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U90 · Reparent glide between containers ───────────────────────── */
const U90_ITEMS = [
  { n: "Indigo tote", p: 1490, img: 0 },
  { n: "Oat linen shirt", p: 2890, img: 3 },
  { n: "Clay mug set", p: 990, img: 1 },
  { n: "Rattan lamp", p: 4200, img: 2 },
  { n: "Jute rug", p: 3650, img: 3 },
  { n: "Brass candle", p: 1150, img: 1 },
];
const U90_SEQ = [2, 4, 1, 2, 4, 1];
const inr = (v: number) => `₹${v.toLocaleString("en-IN")}`;
function Chip({ i }: { i: number }) {
  return (
    <button type="button" data-i={i} className="u90-chip flex items-center gap-3 rounded-full border border-white/12 bg-[#151a28] py-2 pl-2 pr-5 text-[15px] text-left" data-cursor="Pick">
      <span className="u90-th block h-10 w-10 shrink-0 overflow-hidden rounded-full">
        <Img i={U90_ITEMS[i].img} w={120} h={120} />
      </span>
      <span className="whitespace-nowrap">
        {U90_ITEMS[i].n} <span className="text-white/50">· {inr(U90_ITEMS[i].p)}</span>
      </span>
    </button>
  );
}
function U90() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const flip = useFlip();
  const st = useRef({ k: -1, p0: [0, 0] as [number, number], tapped: false });
  const total = () => {
    const el = root.current;
    const out = el?.querySelector(".u90-total");
    if (!el || !out) return;
    const sum = [...el.querySelectorAll<HTMLElement>(".u90-tray .u90-chip")].reduce((a, c) => a + U90_ITEMS[Number(c.dataset.i)].p, 0);
    out.textContent = inr(sum);
  };
  const move = (i: number) => {
    const el = root.current;
    const grid = el?.querySelector<HTMLElement>(".u90-grid");
    const tray = el?.querySelector<HTMLElement>(".u90-tray");
    if (!el || !grid || !tray) return;
    const chips = [...el.querySelectorAll<HTMLElement>(".u90-chip")];
    const c = chips.find((d) => Number(d.dataset.i) === i);
    if (!c) return;
    const Fl = flip.current;
    const state = Fl?.getState(chips);
    if (c.parentElement === tray) {
      const after = [...grid.children].find((d) => Number((d as HTMLElement).dataset.i) > i);
      grid.insertBefore(c, after ?? null);
    } else tray.appendChild(c);
    if (Fl && state) Fl.from(state, { duration: 0.75, ease: "power3.inOut", absolute: true, scale: true });
    total();
  };
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const grid = el.querySelector<HTMLElement>(".u90-grid");
    const tray = el.querySelector<HTMLElement>(".u90-tray");
    const click = (e: MouseEvent) => {
      const c = (e.target as HTMLElement).closest<HTMLElement>(".u90-chip");
      if (c) move(Number(c.dataset.i));
    };
    el.addEventListener("click", click);
    return () => {
      el.removeEventListener("click", click);
      // put every chip back where React rendered it
      if (!grid || !tray) return;
      const chips = [...el.querySelectorAll<HTMLElement>(".u90-chip")].sort((a, b) => Number(a.dataset.i) - Number(b.dataset.i));
      chips.forEach((c) => {
        gsap.killTweensOf(c);
        (Number(c.dataset.i) === 0 ? tray : grid).appendChild(c);
      });
    };
  }, []);
  const SEG = 1.1;
  usePointer(
    root,
    dot,
    (t, el) => {
      const S = st.current;
      const k = Math.floor(t / SEG);
      const f = t / SEG - k;
      if (k !== S.k) {
        if (S.k < 0) S.p0 = [el.clientWidth * 0.5, el.clientHeight * 0.92];
        S.k = k;
        S.tapped = false;
      }
      const id = U90_SEQ[k % U90_SEQ.length];
      const chip = el.querySelector(`.u90-chip[data-i="${id}"]`);
      if (!chip) return { x: S.p0[0], y: S.p0[1], inside: true };
      let x: number;
      let y: number;
      if (!S.tapped) {
        const tg = centre(chip, el, 0.35, 0.5);
        const m = f < 0.42 ? easeIO(f / 0.42) : 1;
        x = S.p0[0] + (tg[0] - S.p0[0]) * m;
        y = S.p0[1] + (tg[1] - S.p0[1]) * m;
        if (f >= 0.5) {
          S.tapped = true;
          S.p0 = [x, y];
          tapDot(dot.current);
          move(id);
        }
      } else [x, y] = S.p0;
      return { x: x + Math.sin(t * 2.4) * 6, y: y + Math.cos(t * 2) * 5, inside: true };
    },
    () => {},
  );
  return (
    <Stage r={root} g1="rgba(255,122,89,.5)" g2="rgba(24,196,143,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[5vh]" style={{ fontFamily: F.sg }}>
        <div className="w-[min(900px,76%)]">
          <div className="flex items-end justify-between">
            <div>
              <Eyebrow>Palm & Pebble · build a gift box</Eyebrow>
              <h3 className="mt-3 text-[clamp(40px,4.6vw,68px)] leading-[0.95]" style={{ fontFamily: F.is }}>
                Pick what goes in
              </h3>
            </div>
          </div>
          <div className="u90-grid mt-[4vh] flex min-h-[140px] flex-wrap content-start gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Chip key={i} i={i} />
            ))}
          </div>
          <div className="mt-[4vh] rounded-[24px] border border-dashed border-white/20 bg-white/[0.03] p-5">
            <div className="mb-3 flex items-center justify-between text-[13px] uppercase tracking-[0.2em] text-white/55">
              <span>Your gift box</span>
              <span className="u90-total text-[16px] normal-case tracking-normal text-white">{inr(U90_ITEMS[0].p)}</span>
            </div>
            <div className="u90-tray flex min-h-[46px] flex-wrap gap-2">
              <Chip i={0} />
            </div>
          </div>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "U79", name: "Spotlight border only", how: "A pointer spotlight lights only the card borders near it; the insides stay dark. A fake pointer sweeps a figure-eight over three plans.", kind: "play", C: U79 },
  { code: "U80", name: "Tilt + spotlight + colourize", how: "The card tilts in reverse toward the pointer on a wobbly spring, a spotlight rides on it and the grey photo fades to colour (0.7 s). A fake pointer weaves in and out.", kind: "play", C: U80 },
  { code: "U81", name: "Flip card X or Y", how: "On hover each card flips 180° to its back: around X, around Y, or on the diagonal. A fake pointer visits all three.", kind: "play", C: U81 },
  { code: "U82", name: "Underline grows into block", how: "On hover the thin underline rises into a full block behind the word and the text inverts. A fake pointer reads down the menu.", kind: "play", C: U82 },
  { code: "U83", name: "Variable weight by proximity", how: "Letters near the pointer swell in variable weight, falling off with distance so the word bulges around it. A fake pointer sweeps along the word.", kind: "play", C: U83 },
  { code: "U84", name: "Plus button expands into panel", how: "A round + button grows into a rounded panel (Flip: size + radius), the + turns into an ×, the rows stagger in; a fake pointer opens, reads and closes it.", kind: "play", C: U84 },
  { code: "U85", name: "Vertical text slide button", how: "On hover the label slides up out of its mask while a copy rises from below (~0.3 s). A fake pointer hovers three buttons.", kind: "play", C: U85 },
  { code: "U86", name: "Stacked notifications expand", how: "A stack of offset, scaled notifications fans out into a full list on hover and stacks back on leave. A fake pointer enters and leaves.", kind: "play", C: U86 },
  { code: "U87", name: "Folder fans out its contents", how: "On hover the folder's front flap tilts open and three photos fan up and out of it. A fake pointer hovers in and out.", kind: "play", C: U87 },
  { code: "U88", name: "Shifting dropdown", how: "One dropdown panel slides and resizes between menu items, its contents swapping in the direction of travel. A fake pointer walks the menu.", kind: "play", C: U88 },
  { code: "U89", name: "Magnetic button with wiggle settle", how: "The button follows the pointer inside a radius; on leave the return kills the follow and settles home with a decaying wiggle. A fake pointer passes in and out.", kind: "play", C: U89 },
  { code: "U90", name: "Reparent glide between containers", how: "Chips jump between the product grid and the gift-box tray in the DOM; Flip glides and scales each to its new slot. A fake pointer picks and returns them.", kind: "play", C: U90 },
];
