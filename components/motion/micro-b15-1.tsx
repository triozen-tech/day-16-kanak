"use client";

// Micro-interactions, batch 15 · group 1 (MOTION-MENU U148–U155). Small focused demos for /lab/motion.
// Every hover / press / drag demo also plays by itself: a visible fake pointer (ring) walks over the targets or runs a
// scripted press / drag. The real mouse takes over for 2.5 s whenever it moves inside the stage.
// A CSS-only glow loop never stops (and sits on top again, screen-blended) so covered stages never freeze.
// ?static=1 / reduced motion: no JS, the markup shows a sensible final state.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, loadPlugin, prefersReducedMotion } from "@/lib/gsap";
import { scene, useTicker } from "@/components/fx/shared";
import type { MotionDef } from "./types";

type FlipT = typeof import("gsap/Flip").Flip;

const F = {
  sg: "Space Grotesk Variable",
  fr: "Fraunces Variable",
  is: "Instrument Serif",
  sy: "Syne Variable",
  mr: "Manrope Variable",
};

const EZ = "cubic-bezier(.2,.7,.2,1)";

const CSS = `
.b15g1-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.55)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.22)),transparent 70%);animation:b15g1-drift 5.4s linear infinite alternate;will-change:transform}
@keyframes b15g1-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b15g1-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;pointer-events:none;z-index:40;opacity:0;transition:opacity .25s}
.b15g1-dot>span{display:block;width:100%;height:100%;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4);transition:transform .2s,background-color .2s}
.b15g1-dot.press>span{transform:scale(.62);background:rgba(255,255,255,.6)}
.b15g1-dot.tap>span{animation:b15g1-tap .32s ease-out}
@keyframes b15g1-tap{40%{transform:scale(.55);background:rgba(255,255,255,.6)}100%{transform:scale(1)}}

/* U148 fanned stack */
.u148-k{position:absolute;left:50%;top:50%;width:min(17vw,232px);aspect-ratio:3/4;transform:translate(-50%,-50%) translateX(calc(var(--i)*22px)) translateY(calc(var(--a)*10px)) rotate(calc(var(--i)*15deg));transition:transform .75s ${EZ},box-shadow .75s;transition-delay:calc(var(--a)*40ms)}
.u148-s.on .u148-k{transform:translate(-50%,-50%) translateX(calc(var(--i)*112%)) translateY(0) rotate(0deg);box-shadow:0 30px 70px rgba(0,0,0,.5)}
.u148-hint{transition:opacity .4s}
.u148-s.on .u148-hint{opacity:0}

/* U149 hold button */
.u149-b{position:relative;overflow:hidden;touch-action:none;user-select:none;transition:transform .25s ${EZ}}
.u149-b.hold{transform:scale(.975)}
.u149-fill{position:absolute;inset:0;background:linear-gradient(90deg,#ff7a59,#ffb36b);transform:scaleX(0);transform-origin:0 50%}
.u149-lab{position:relative;display:grid}
.u149-lab>span{grid-area:1/1;transition:opacity .3s,transform .35s ${EZ}}
.u149-y{opacity:0;transform:translateY(60%)}
.u149-b.done .u149-n{opacity:0;transform:translateY(-60%)}
.u149-b.done .u149-y{opacity:1;transform:none}

/* U150 toolbar */
.u150-b{display:flex;align-items:center;gap:12px;overflow:hidden;white-space:nowrap;border-radius:16px;padding:14px;color:rgba(255,255,255,.65);transition:background-color .4s,color .4s}
.u150-b.on{background:#b8f36b;color:#10160a;padding:14px 22px 14px 16px}
.u150-l{display:none;font-size:18px;font-weight:600;letter-spacing:-.01em}
.u150-b.on .u150-l{display:inline}

/* U151 avatars */
.u151-tip{opacity:0;transform:translate(-50%,8px)}

/* U153 holo */
.u153-foil{position:absolute;inset:0;border-radius:inherit;mix-blend-mode:color-dodge;opacity:.62;background-image:repeating-linear-gradient(115deg,#ff6fd8 0%,#ffd36e 7%,#7affc9 14%,#6ea8ff 21%,#c58bff 28%,#ff6fd8 35%);background-size:300% 300%;background-position:40% 40%;pointer-events:none}
.u153-spark{position:absolute;inset:0;border-radius:inherit;mix-blend-mode:overlay;opacity:.5;background-image:radial-gradient(circle,rgba(255,255,255,.9) 0 1px,transparent 1.6px);background-size:14px 14px;pointer-events:none}
.u153-glare{position:absolute;inset:0;border-radius:inherit;mix-blend-mode:overlay;background:radial-gradient(circle at var(--mx,40%) var(--my,30%),rgba(255,255,255,.7),transparent 46%);pointer-events:none}

/* U155 shake tiles */
.u155-t{transition:background-color .3s,border-color .3s}
.u155-t.on{background:rgba(255,214,120,.12);border-color:rgba(255,214,120,.7)}
.u155-t .u155-ic{transition:color .3s}
.u155-t.on .u155-ic{color:#ffd678}

html.is-static .b15g1-glow{animation:none}
html.is-static {
  .b15g1-glow{animation:none}
  .u148-k,.u149-b,.u149-lab>span,.u150-b,.u155-t{transition:none}
}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop, again on top (screen blend) so covered stages never freeze. */
function Stage({ r, children, g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; g1?: string; g2?: string }) {
  return (
    <div ref={r} className="relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0d16] text-[#eef2ff]">
      <style href="b15g1-css" precedence="default">
        {CSS}
      </style>
      <div className="b15g1-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
      <div className="b15g1-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.42, zIndex: 35 } as CSSProperties} aria-hidden />
    </div>
  );
}

/** The visible fake pointer (a ring). */
const Dot = ({ r }: { r: RefObject<HTMLDivElement | null> }) => (
  <div ref={r} className="b15g1-dot" aria-hidden>
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
const mid = (b: Box): [number, number] => [b.l + b.w / 2, b.t + b.h / 2];
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const easeIO = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/** Pointer driver: the real mouse wins for 2.5 s after it last moved; otherwise `script` moves a visible fake ring. */
function usePointer(
  root: RefObject<HTMLDivElement | null>,
  dot: RefObject<HTMLDivElement | null>,
  script: (t: number, el: HTMLDivElement) => Pt,
  frame: (p: Pt, el: HTMLDivElement, fake: boolean, t: number, dt: number) => void,
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
    fr.current(p, el, !useReal, t - t0.current, dt);
  });
}

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
    off?: (w: number, h: number) => [number, number];
    onChange?: (now: number, prev: number, el: HTMLDivElement) => void;
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
      const pts: [number, number][] = o.order.map((i) => (i < 0 || !tg[i] ? (o.off ? o.off(w, h) : [w * 0.5, h * 0.92]) : mid(rel(tg[i], el))));
      const [x, y] = stepPath(t, pts, o.seg ?? 0.95, o.move ?? 0.48);
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
      o.onChange?.(idx, prev, el);
    },
  );
  return cur;
}

/** "play" helper: waits for fonts (and Flip when asked), builds a looping animation in a gsap.context, plays it only on screen. */
function usePlay(ref: RefObject<HTMLElement | null>, build: (root: HTMLElement, Flip: FlipT | null) => gsap.core.Animation | void, flip = false) {
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
    Promise.all([document.fonts?.ready, flip ? loadPlugin("Flip") : null]).then(([, Fl]) => {
      if (dead) return;
      ctx.add(() => {
        anim = b.current(root, (Fl as FlipT | null) ?? null);
      });
      sync();
    });
    return () => {
      dead = true;
      io.disconnect();
      ctx.revert();
      gsap.killTweensOf(root.querySelectorAll("*"));
    };
  }, [ref, flip]);
}

/** Real-mouse tracker for scripted demos: idle() is false for 2.5 s after the real pointer moved in the stage. */
function useIdle(root: RefObject<HTMLElement | null>) {
  const at = useRef(-1e9);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const mv = () => (at.current = performance.now());
    el.addEventListener("pointermove", mv);
    el.addEventListener("pointerdown", mv);
    return () => {
      el.removeEventListener("pointermove", mv);
      el.removeEventListener("pointerdown", mv);
    };
  }, [root]);
  return () => performance.now() - at.current > 2500;
}

/** Glide the fake ring (gsap x/y) to the centre of `target` (or a point), measured now. */
function goDot(dot: HTMLElement | null, root: HTMLElement, target: Element | [number, number] | null, dur = 0.45, idle = true) {
  if (!dot || !target) return;
  dot.style.opacity = idle ? "1" : "0";
  const [x, y] = Array.isArray(target) ? target : mid(rel(target, root));
  gsap.to(dot, { x, y, duration: dur, ease: "power2.inOut", overwrite: "auto" });
}

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, className = "", w = 700, h = 900 }: { i: number; className?: string; w?: number; h?: number }) => (
  <img src={scene(i, w, h)} alt="" className={`block h-full w-full object-cover ${className}`} draggable={false} />
);

const Eyebrow = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <p className={`text-[13px] uppercase tracking-[0.22em] text-white/55 ${className}`} style={{ fontFamily: F.sg }}>
    {children}
  </p>
);

/* ───────────────────────── U148 · Fanned card stack aligns on hover ───────────────────────── */
const U148_C = [
  { n: "Monsoon Trench", p: "₹8,900", i: 1 },
  { n: "Harbour Knit", p: "₹4,200", i: 2 },
  { n: "Salt Linen Shirt", p: "₹3,600", i: 3 },
];
function U148() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useWalk(root, dot, { sel: ".u148-s", order: [0, -1], seg: 1.1, move: 0.6, wob: 10, off: (w, h) => [w * 0.78, h * 0.88] });
  return (
    <Stage r={root} g1="rgba(255,170,120,.55)" g2="rgba(120,150,255,.24)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[3vh]" style={{ fontFamily: F.sg }}>
        <div className="text-center">
          <Eyebrow>The monsoon edit · 03 pieces</Eyebrow>
          <h3 className="mt-3 text-[clamp(40px,4.2vw,68px)] leading-none tracking-[-0.03em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
            Fanned, then laid out
          </h3>
        </div>
        <div className="u148-s relative h-[58%] w-[min(68%,820px)]">
          {U148_C.map((c, k) => (
            <div
              key={c.n}
              className="u148-k overflow-hidden rounded-[20px] border border-white/12 bg-[#12161f] shadow-[0_20px_50px_rgba(0,0,0,.45)]"
              style={{ "--i": k - 1, "--a": Math.abs(k - 1), zIndex: k === 1 ? 3 : 2 } as CSSProperties}
            >
              <div className="h-[78%]">
                <Img i={c.i} w={480} h={520} />
              </div>
              <div className="flex h-[22%] items-center justify-between px-4">
                <span className="text-[15px] font-[600] leading-tight">{c.n}</span>
                <span className="text-[15px] text-white/75">{c.p}</span>
              </div>
            </div>
          ))}
          <p className="u148-hint pointer-events-none absolute bottom-0 left-0 right-0 text-center text-[13px] uppercase tracking-[0.2em] text-white/45">Hover to lay them out</p>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U149 · Press-and-hold fill ───────────────────────── */
function U149() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const api = useRef<{ press: () => void; release: () => void } | null>(null);
  const idle = useIdle(root);
  usePlay(root, (el) => {
    const btn = el.querySelector<HTMLElement>(".u149-b")!;
    const fill = el.querySelector<HTMLElement>(".u149-fill")!;
    const d = dot.current;
    let done = false;
    const fillTw = gsap.fromTo(
      fill,
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: 2,
        ease: "none",
        paused: true,
        onComplete: () => {
          done = true;
          btn.classList.add("done");
          gsap.fromTo(btn, { scale: 0.975 }, { scale: 1.035, duration: 0.16, yoyo: true, repeat: 1, ease: "power2.out", clearProps: "scale" });
        },
      },
    );
    const press = () => {
      if (done) return;
      btn.classList.add("hold");
      fillTw.timeScale(1).play();
    };
    const release = () => {
      btn.classList.remove("hold");
      if (!done) fillTw.timeScale(5).reverse();
    };
    const reset = () => {
      done = false;
      btn.classList.remove("done", "hold");
      fillTw.timeScale(4).reverse();
    };
    api.current = { press, release };
    const off = (): [number, number] => [el.clientWidth * 0.74, el.clientHeight * 0.86];
    const on = (a: () => void) => () => void (idle() && a());
    const tl = gsap.timeline({ repeat: -1, paused: true });
    tl.call(() => goDot(d, el, btn, 0.45, idle()), [], 0)
      .call(on(() => (d?.classList.add("press"), press())), [], 0.48)
      .to(d, { x: "+=12", duration: 0.9, ease: "sine.inOut" }, 0.5)
      .call(on(() => (d?.classList.remove("press"), release())), [], 1.4)
      .to(d, { x: "-=12", duration: 0.35, ease: "sine.inOut" }, 1.4)
      .call(on(() => (d?.classList.add("press"), press())), [], 1.78)
      .to(d, { x: "+=18", duration: 2, ease: "sine.inOut" }, 1.78)
      .call(() => (d?.classList.remove("press"), btn.classList.remove("hold")), [], 3.86)
      .call(() => goDot(d, el, off(), 0.45, idle()), [], 3.9)
      .call(reset, [], 4.32)
      .to({}, { duration: 0.05 }, 4.8);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,140,100,.55)" g2="rgba(255,210,120,.24)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[5vh]" style={{ fontFamily: F.sg }}>
        <div className="text-center">
          <Eyebrow>Checkout · 1 item</Eyebrow>
          <h3 className="mt-3 text-[clamp(40px,4.2vw,68px)] leading-none tracking-[-0.03em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
            Sure about this one?
          </h3>
        </div>
        <div className="flex w-[min(52%,620px)] items-center gap-5 rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
          <div className="h-[92px] w-[92px] flex-none overflow-hidden rounded-[14px]">
            <Img i={5} w={200} h={200} />
          </div>
          <div className="flex-1">
            <p className="text-[19px] font-[600]">Ember Field Jacket</p>
            <p className="text-[14px] text-white/55">Rust · Size M · ships in 2 days</p>
          </div>
          <p className="text-[22px] font-[600]">₹6,900</p>
        </div>
        <button
          type="button"
          className="u149-b flex h-[92px] w-[min(52%,620px)] items-center justify-center rounded-full border border-white/20 bg-white/[0.06] text-[22px] font-[600]"
          onPointerDown={() => api.current?.press()}
          onPointerUp={() => api.current?.release()}
          onPointerLeave={() => api.current?.release()}
        >
          <span className="u149-fill" aria-hidden />
          <span className="u149-lab">
            <span className="u149-n">Hold to place order</span>
            <span className="u149-y">Order placed ✓</span>
          </span>
        </button>
        <p className="-mt-[2vh] text-[13px] uppercase tracking-[0.2em] text-white/45">Hold for 2 seconds · let go to cancel</p>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U150 · Expanding tool label ───────────────────────── */
const U150_T = [
  { n: "Select", d: "M6 3l13 8-6 1.6L10 19z" },
  { n: "Pen", d: "M4 20l4-1L19 8l-3-3L5 16zM14 7l3 3" },
  { n: "Shapes", d: "M4 4h8v8H4zM17 13a4 4 0 1 1 0 8a4 4 0 1 1 0-8" },
  { n: "Text", d: "M5 5h14M12 5v14M9 19h6" },
  { n: "Image", d: "M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4" },
  { n: "Comment", d: "M4 5h16v10H9l-5 4z" },
];
function U150() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const flip = useRef<FlipT | null>(null);
  const idle = useIdle(root);
  const select = (el: HTMLElement, i: number) => {
    const bs = [...el.querySelectorAll<HTMLElement>(".u150-b")];
    if (bs[i].classList.contains("on")) return;
    const Fl = flip.current;
    const st = Fl?.getState(bs);
    bs.forEach((b, k) => b.classList.toggle("on", k === i));
    if (Fl && st) Fl.from(st, { duration: 0.55, ease: "power3.inOut" });
    gsap.fromTo(bs[i].querySelector(".u150-l"), { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.4, delay: 0.14, ease: "power2.out" });
    const cap = el.querySelector<HTMLElement>(".u150-cap");
    if (cap) cap.textContent = `${U150_T[i].n} tool`;
  };
  usePlay(
    root,
    (el, Fl) => {
      flip.current = Fl;
      const bs = [...el.querySelectorAll<HTMLElement>(".u150-b")];
      const tl = gsap.timeline({ repeat: -1, paused: true });
      [1, 2, 3, 4, 5, 0].forEach((i, k) => {
        tl.call(() => goDot(dot.current, el, bs[i], 0.45, idle()), [], k * 0.95);
        tl.call(() => void (idle() && (tapDot(dot.current), select(el, i))), [], k * 0.95 + 0.48);
      });
      tl.to({}, { duration: 0.05 }, 6 * 0.95 - 0.05);
      return tl;
    },
    true,
  );
  return (
    <Stage r={root} g1="rgba(184,243,107,.5)" g2="rgba(110,200,255,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[6vh]" style={{ fontFamily: F.sg }}>
        <div className="text-center">
          <Eyebrow>Canvas · a whiteboard for small teams</Eyebrow>
          <h3 className="mt-3 text-[clamp(40px,4.2vw,68px)] leading-none tracking-[-0.03em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
            Tools that name themselves
          </h3>
        </div>
        <div className="flex items-center gap-2 rounded-[24px] border border-white/12 bg-[#121722] p-2 shadow-[0_30px_70px_rgba(0,0,0,.5)]">
          {U150_T.map((t, i) => (
            <button
              key={t.n}
              type="button"
              className={`u150-b ${i === 0 ? "on" : ""}`}
              onClick={() => root.current && select(root.current, i)}
              aria-label={t.n}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
                <path d={t.d} />
              </svg>
              <span className="u150-l">{t.n}</span>
            </button>
          ))}
        </div>
        <p className="u150-cap text-[14px] uppercase tracking-[0.2em] text-white/50">Select tool</p>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U151 · Avatar step-forward ───────────────────────── */
const U151_A = [
  { n: "Ira Sen", r: "Head chef", c: ["#ff9a76", "#ff5f6d"] },
  { n: "Kabir Rao", r: "Sommelier", c: ["#7af0c8", "#2fa7a0"] },
  { n: "Meher Das", r: "Pastry", c: ["#ffd27a", "#f08a3c"] },
  { n: "Vivaan Joshi", r: "Front of house", c: ["#9fc2ff", "#5a6cff"] },
  { n: "Tara Iyer", r: "Sous chef", c: ["#f2a7ff", "#a35cff"] },
  { n: "Neel Bose", r: "Bar lead", c: ["#c8ff8a", "#4fbf6a"] },
];
function U151() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useWalk(root, dot, {
    sel: ".u151-a",
    order: [0, 2, 3, 5, 4, 1, -1],
    seg: 0.8,
    move: 0.45,
    wob: 5,
    off: (w, h) => [w * 0.5, h * 0.84],
    onChange: (now, _prev, el) => {
      const slots = [...el.querySelectorAll<HTMLElement>(".u151-a")];
      slots.forEach((s, i) => {
        const inner = s.querySelector(".u151-in");
        const tip = s.querySelector(".u151-tip");
        const d = i - now;
        const x = now < 0 || d === 0 ? 0 : Math.sign(d) * Math.max(0, 26 - (Math.abs(d) - 1) * 12);
        s.style.zIndex = i === now ? "20" : String(10 - Math.abs(d));
        gsap.to(inner, { x, y: d === 0 ? -18 : 0, scale: d === 0 ? 1.16 : 1, duration: 0.45, ease: "power3.out", overwrite: "auto" });
        gsap.to(tip, { opacity: d === 0 ? 1 : 0, y: d === 0 ? -6 : 8, duration: 0.3, ease: "power2.out", overwrite: "auto" });
      });
    },
  });
  return (
    <Stage r={root} g1="rgba(255,154,118,.52)" g2="rgba(159,194,255,.24)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[7vh]" style={{ fontFamily: F.sg }}>
        <div className="text-center">
          <Eyebrow>Tonight&apos;s kitchen · Juhu</Eyebrow>
          <h3 className="mt-3 text-[clamp(40px,4.2vw,68px)] leading-none tracking-[-0.03em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
            Meet the people cooking
          </h3>
        </div>
        <div className="flex items-center pt-[60px]">
          {U151_A.map((a, i) => (
            <div key={a.n} className="u151-a relative" style={{ marginLeft: i ? -30 : 0, zIndex: 10 - i }}>
              <div className="u151-tip pointer-events-none absolute bottom-[calc(100%+14px)] left-1/2 whitespace-nowrap rounded-[12px] bg-white px-4 py-2 text-center text-[#10131a] shadow-[0_14px_30px_rgba(0,0,0,.35)]">
                <p className="text-[15px] font-[700] leading-tight">{a.n}</p>
                <p className="text-[12px] text-[#10131a]/60">{a.r}</p>
              </div>
              <div
                className="u151-in flex h-[112px] w-[112px] items-center justify-center rounded-full border-[4px] border-[#0a0d16] text-[30px] font-[700] text-[#0a0d16]"
                style={{ background: `linear-gradient(140deg,${a.c[0]},${a.c[1]})` }}
              >
                {a.n
                  .split(" ")
                  .map((w) => w[0])
                  .join("")}
              </div>
            </div>
          ))}
          <div className="ml-6 text-[18px] text-white/60">+14 more</div>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U152 · Spring tether drag ───────────────────────── */
function U152() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const line = useRef<SVGPathElement>(null);
  const halo = useRef<SVGPathElement>(null);
  const pin = useRef<SVGCircleElement>(null);
  const S = useRef({ x: 0, y: 0, vx: 0, vy: 0, init: false, realDrag: false, rx: 0, ry: 0, gx: 0, gy: 0, realAt: -1e9, t0: -1, cyc: -1 });
  useEffect(() => {
    const el = root.current;
    const k = knob.current;
    if (!el || !k) return;
    const s = S.current;
    const pt = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    const down = (e: PointerEvent) => {
      const [x, y] = pt(e);
      s.realDrag = true;
      s.gx = s.x - x;
      s.gy = s.y - y;
      s.rx = x;
      s.ry = y;
      s.realAt = performance.now();
    };
    const move = (e: PointerEvent) => {
      const [x, y] = pt(e);
      s.rx = x;
      s.ry = y;
      s.realAt = performance.now();
    };
    const up = () => (s.realDrag = false);
    k.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      k.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);
  useTicker(root, (t, dtRaw) => {
    const el = root.current;
    const k = knob.current;
    if (!el || !k) return;
    const s = S.current;
    const dt = Math.min(dtRaw, 1 / 30);
    const w = el.clientWidth;
    const h = el.clientHeight;
    const ax = w * 0.64;
    const ay = h * 0.48;
    if (!s.init) {
      s.x = ax;
      s.y = ay;
      s.init = true;
    }
    if (s.t0 < 0) s.t0 = t;
    const idle = performance.now() - s.realAt > 2500;
    let drag = false;
    let tx = ax;
    let ty = ay;
    const dn = dot.current;
    if (idle) {
      const L = 2.8;
      const tt = t - s.t0;
      const cyc = Math.floor(tt / L);
      const ph = tt - cyc * L;
      const odd = cyc % 2 === 1;
      const R: [number, number] = [ax + w * 0.16, ay + h * 0.3];
      const E: [number, number] = odd ? [ax + w * 0.22, ay - h * 0.26] : [ax - w * 0.22, ay + h * 0.22];
      const C: [number, number] = odd ? [ax + w * 0.02, ay - h * 0.34] : [ax - w * 0.04, ay - h * 0.3];
      let px: number;
      let py: number;
      if (ph < 0.45) {
        const m = easeIO(ph / 0.45);
        px = R[0] + (ax - R[0]) * m;
        py = R[1] + (ay - R[1]) * m;
      } else if (ph < 0.6) {
        px = ax;
        py = ay;
        if (s.cyc !== cyc) {
          s.cyc = cyc;
          tapDot(dn);
        }
      } else if (ph < 1.55) {
        const u = easeIO((ph - 0.6) / 0.95);
        const iu = 1 - u;
        px = iu * iu * ax + 2 * iu * u * C[0] + u * u * E[0];
        py = iu * iu * ay + 2 * iu * u * C[1] + u * u * E[1];
      } else if (ph < 2.1) {
        const m = easeIO((ph - 1.55) / 0.55);
        px = E[0] + (R[0] - E[0]) * m;
        py = E[1] + (R[1] - E[1]) * m;
      } else {
        px = R[0];
        py = R[1];
      }
      px += Math.sin(tt * 2.3) * 6;
      py += Math.cos(tt * 1.9) * 5;
      drag = ph >= 0.5 && ph < 1.55;
      if (drag) {
        tx = px;
        ty = py;
      }
      if (dn) {
        dn.style.transform = `translate3d(${px.toFixed(1)}px,${py.toFixed(1)}px,0)`;
        dn.style.opacity = "1";
        dn.classList.toggle("press", drag);
      }
    } else {
      if (dn) dn.style.opacity = "0";
      drag = s.realDrag;
      if (drag) {
        tx = s.rx + s.gx;
        ty = s.ry + s.gy;
      }
    }
    if (drag) {
      const f = 1 - Math.exp(-dt * 26);
      const nx = s.x + (tx - s.x) * f;
      const ny = s.y + (ty - s.y) * f;
      s.vx = (nx - s.x) / Math.max(dt, 1e-3);
      s.vy = (ny - s.y) / Math.max(dt, 1e-3);
      s.x = nx;
      s.y = ny;
    } else {
      const K = 190;
      const Cd = 8.5;
      s.vx += (-K * (s.x - ax) - Cd * s.vx) * dt;
      s.vy += (-K * (s.y - ay) - Cd * s.vy) * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
    }
    const dx = s.x - ax;
    const dy = s.y - ay;
    const len = Math.hypot(dx, dy);
    const mx = ax + dx / 2 - clamp(s.vx * 0.05, -80, 80);
    const my = ay + dy / 2 - clamp(s.vy * 0.05, -80, 80);
    const d = `M${ax.toFixed(1)} ${ay.toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${s.x.toFixed(1)} ${s.y.toFixed(1)}`;
    const sw = clamp(12 - len / 38, 2.5, 12);
    line.current?.setAttribute("d", d);
    line.current?.setAttribute("stroke-width", sw.toFixed(2));
    halo.current?.setAttribute("d", d);
    halo.current?.setAttribute("stroke-width", (sw * 4 + 10).toFixed(1));
    pin.current?.setAttribute("cx", ax.toFixed(1));
    pin.current?.setAttribute("cy", ay.toFixed(1));
    const sq = clamp(len / 900, 0, 0.18);
    const ang = Math.atan2(dy, dx);
    k.style.transform = `translate3d(${dx.toFixed(1)}px,${dy.toFixed(1)}px,0) rotate(${ang}rad) scale(${1 + sq},${1 - sq}) rotate(${-ang}rad)`;
  });
  return (
    <Stage r={root} g1="rgba(110,231,255,.52)" g2="rgba(255,122,200,.24)">
      <div className="absolute inset-0" style={{ fontFamily: F.sg }}>
        <div className="absolute left-[7%] top-1/2 w-[min(32%,420px)]" style={{ transform: "translateY(-50%)" }}>
          <Eyebrow>Members&apos; drop · Friday</Eyebrow>
          <h3 className="mt-4 text-[clamp(44px,4.4vw,72px)] leading-[0.98] tracking-[-0.03em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
            Stretch it, let it go
          </h3>
          <p className="mt-5 max-w-[34ch] text-[17px] leading-snug text-white/60">Pull the coupon off its pin. It always snaps back home.</p>
        </div>
        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
          <path ref={halo} fill="none" stroke="rgba(110,231,255,.14)" strokeLinecap="round" />
          <path ref={line} fill="none" stroke="#6ee7ff" strokeLinecap="round" />
          <circle ref={pin} r="9" fill="#0a0d16" stroke="#6ee7ff" strokeWidth="3" cx="-50" cy="-50" />
        </svg>
        <div
          ref={knob}
          className="absolute left-[64%] top-[48%] -ml-[74px] -mt-[74px] flex h-[148px] w-[148px] cursor-grab touch-none select-none flex-col items-center justify-center rounded-full text-[#06121a] shadow-[0_24px_60px_rgba(0,0,0,.45)]"
          style={{ background: "radial-gradient(circle at 35% 30%,#e9fdff,#6ee7ff 55%,#2a9fc4)" }}
        >
          <span className="text-[13px] font-[700] uppercase tracking-[0.18em]">Pull</span>
          <span className="text-[34px] font-[700] leading-none tracking-[-0.03em]">₹500</span>
          <span className="text-[13px] font-[600]">off today</span>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U153 · Holographic foil shift ───────────────────────── */
function U153() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const sm = useRef({ x: 0.4, y: 0.35 });
  usePointer(
    root,
    dot,
    (t, el) => {
      const card = el.querySelector(".u153-c");
      const b = card ? rel(card, el) : { l: 0, t: 0, w: el.clientWidth, h: el.clientHeight };
      const [cx, cy] = mid(b);
      return { x: cx + Math.sin(t * 1.25) * b.w * 0.55, y: cy + Math.sin(t * 2.5) * b.h * 0.32, inside: true };
    },
    (p, el, _fake, _t, dt) => {
      const card = el.querySelector<HTMLElement>(".u153-c");
      const foil = el.querySelector<HTMLElement>(".u153-foil");
      if (!card || !foil) return;
      const b = rel(card, el);
      const tx = p.inside ? clamp((p.x - b.l) / b.w, -0.2, 1.2) : 0.5;
      const ty = p.inside ? clamp((p.y - b.t) / b.h, -0.2, 1.2) : 0.5;
      const f = 1 - Math.exp(-dt * 9);
      const s = sm.current;
      s.x += (tx - s.x) * f;
      s.y += (ty - s.y) * f;
      const inner = card.firstElementChild as HTMLElement | null;
      if (inner) inner.style.transform = `rotateY(${((s.x - 0.5) * 22).toFixed(2)}deg) rotateX(${(-(s.y - 0.5) * 22).toFixed(2)}deg)`;
      const ang = 100 + (s.x - 0.5) * 70 + (s.y - 0.5) * 40;
      foil.style.backgroundImage = `repeating-linear-gradient(${ang.toFixed(1)}deg,#ff6fd8 0%,#ffd36e 7%,#7affc9 14%,#6ea8ff 21%,#c58bff 28%,#ff6fd8 35%)`;
      foil.style.backgroundPosition = `${(s.x * 100).toFixed(1)}% ${(s.y * 100).toFixed(1)}%`;
      foil.style.opacity = (0.45 + Math.min(0.4, Math.hypot(s.x - 0.5, s.y - 0.5) * 0.8)).toFixed(3);
      card.style.setProperty("--mx", `${(s.x * 100).toFixed(1)}%`);
      card.style.setProperty("--my", `${(s.y * 100).toFixed(1)}%`);
    },
  );
  return (
    <Stage r={root} g1="rgba(197,139,255,.55)" g2="rgba(122,255,201,.24)">
      <div className="absolute inset-0 flex items-center justify-center gap-[7vw] px-[7%]" style={{ fontFamily: F.sg }}>
        <div className="w-[min(36%,440px)]">
          <Eyebrow>Collector series · 1 of 250</Eyebrow>
          <h3 className="mt-4 text-[clamp(44px,4.4vw,72px)] leading-[0.98] tracking-[-0.03em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
            Foil that follows the light
          </h3>
          <p className="mt-5 text-[17px] text-white/60">Holo edition card · ₹1,250</p>
        </div>
        <div className="u153-c h-[min(80%,470px)] aspect-[5/7]" style={{ perspective: "1000px" }}>
          <div className="relative h-full w-full overflow-hidden rounded-[22px] border border-white/25 bg-[#141026] shadow-[0_40px_90px_rgba(0,0,0,.55)]" style={{ transformStyle: "preserve-3d" }}>
            <div className="absolute inset-[14px] bottom-[96px] overflow-hidden rounded-[14px]">
              <Img i={0} w={420} h={480} />
            </div>
            <div className="absolute inset-x-[18px] bottom-[18px]">
              <p className="text-[12px] uppercase tracking-[0.22em] text-white/60">No. 017 · Sky class</p>
              <p className="mt-1 text-[26px] font-[700] leading-none tracking-[-0.02em]" style={{ fontFamily: F.sy }}>
                Aurora Drake
              </p>
            </div>
            <div className="u153-foil" />
            <div className="u153-spark" />
            <div className="u153-glare" />
          </div>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U154 · Pulse scale ───────────────────────── */
function U154() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const main = el.querySelector(".u154-main");
    const halo = el.querySelector(".u154-halo");
    const soft = el.querySelector(".u154-soft");
    const tl = gsap.timeline({ repeat: -1, paused: true });
    // heartbeat: two quick beats, short rest (rest + ease tail < 0.3 s)
    tl.to(main, { scale: 1.05, duration: 0.16, ease: "sine.out" })
      .to(main, { scale: 1, duration: 0.16, ease: "sine.in" })
      .to(main, { scale: 1.05, duration: 0.16, ease: "sine.out" })
      .to(main, { scale: 1, duration: 0.36, ease: "sine.inOut" })
      .fromTo(halo, { scale: 1, opacity: 0.55 }, { scale: 1.35, opacity: 0, duration: 0.84, ease: "power2.out" }, 0)
      .to({}, { duration: 0.18 });
    const gentle = gsap.to(soft, { scale: 1.05, duration: 0.85, ease: "sine.inOut", yoyo: true, repeat: -1 });
    const all = gsap.timeline({ paused: true });
    all.add(tl, 0).add(gentle, 0);
    return all;
  });
  return (
    <Stage r={root} g1="rgba(255,110,140,.55)" g2="rgba(255,200,120,.24)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[6vh]" style={{ fontFamily: F.sg }}>
        <div className="text-center">
          <Eyebrow>Festive box · ends Sunday</Eyebrow>
          <h3 className="mt-3 text-[clamp(44px,4.6vw,76px)] leading-none tracking-[-0.03em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
            Sweets for the whole street
          </h3>
        </div>
        <div className="flex items-center gap-[6vw]">
          <div className="flex flex-col items-center gap-5">
            <div className="relative">
              <span className="u154-halo pointer-events-none absolute inset-0 rounded-full border-2 border-[#ff6e8c] opacity-0" aria-hidden />
              <a href="#" onClick={(e) => e.preventDefault()} className="u154-main relative block rounded-full bg-[#ff6e8c] px-12 py-6 text-[24px] font-[700] text-[#1a0610] shadow-[0_20px_50px_rgba(255,110,140,.35)]">
                Order the box · ₹1,499
              </a>
            </div>
            <Eyebrow>Heartbeat · 1 → 1.05</Eyebrow>
          </div>
          <div className="flex flex-col items-center gap-5">
            <a href="#" onClick={(e) => e.preventDefault()} className="u154-soft block rounded-full border border-white/30 px-10 py-6 text-[22px] font-[600]">
              See what&apos;s inside
            </a>
            <Eyebrow>Gentle loop</Eyebrow>
          </div>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── U155 · Shake (anchored) ───────────────────────── */
const SH_T = [0, -10, 10, -10, 10, -10, 10, -8, 8, 0];
const SH_R = [0, 4, -4, 4, -4, 4, -4, 3, -2, 0];
const SH_LR = [0, 10, -10, 10, -10, 10, -10, 8, -8, 0];
const U155_D: { n: string; o: string; k: "x" | "y" | "rotation"; v: number[] }[] = [
  { n: "Horizontal", o: "50% 50%", k: "x", v: SH_T },
  { n: "Vertical", o: "50% 50%", k: "y", v: SH_T.map((v) => v * 0.8) },
  { n: "Left–right", o: "50% 50%", k: "rotation", v: SH_LR },
  { n: "Top", o: "50% 0%", k: "rotation", v: SH_R },
  { n: "Top right", o: "100% 0%", k: "rotation", v: SH_R },
  { n: "Right", o: "100% 50%", k: "rotation", v: SH_R },
  { n: "Bottom right", o: "100% 100%", k: "rotation", v: SH_R },
  { n: "Bottom", o: "50% 100%", k: "rotation", v: SH_R },
  { n: "Bottom left", o: "0% 100%", k: "rotation", v: SH_R },
  { n: "Left", o: "0% 50%", k: "rotation", v: SH_R },
  { n: "Top left", o: "0% 0%", k: "rotation", v: SH_R },
];
function U155() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const tiles = [...el.querySelectorAll<HTMLElement>(".u155-t")];
    const tl = gsap.timeline({ repeat: -1, paused: true });
    tiles.forEach((t, i) => {
      const d = U155_D[i];
      gsap.set(t, { transformOrigin: d.o });
      const at = i * 0.42;
      tl.call(() => t.classList.add("on"), [], at);
      tl.to(t, { keyframes: { [d.k]: d.v, easeEach: "sine.inOut" }, duration: 0.8, ease: "none" }, at);
      tl.call(() => t.classList.remove("on"), [], at + 0.8);
    });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,214,120,.52)" g2="rgba(120,160,255,.24)">
      <div className="absolute inset-[6%] grid grid-cols-4 grid-rows-3 gap-4" style={{ fontFamily: F.sg }}>
        <div className="flex flex-col justify-center pr-4">
          <Eyebrow>Attention · 11 anchors</Eyebrow>
          <h3 className="mt-3 text-[clamp(34px,3.2vw,52px)] leading-[0.98] tracking-[-0.03em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
            Wrong code? Try again
          </h3>
        </div>
        {U155_D.map((d) => (
          <div key={d.n} className="u155-t flex items-center gap-4 rounded-[18px] border border-white/12 bg-white/[0.04] px-6">
            <svg className="u155-ic flex-none text-white/70" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5zM12 15v2" />
            </svg>
            <div>
              <p className="text-[19px] font-[600] leading-tight">{d.n}</p>
              <p className="text-[13px] text-white/50">PIN 4 4 • •</p>
            </div>
          </div>
        ))}
      </div>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  {
    code: "U148",
    name: "Fanned card stack aligns on hover",
    how: "Three cards fanned at ±15° straighten and line up side by side on hover, then fan back on leave. A fake pointer visits the stack.",
    kind: "play",
    C: U148,
  },
  {
    code: "U149",
    name: "Press-and-hold fill",
    how: "Holding the button fills it left to right over 2 s and confirms when full; letting go early rewinds the fill. A fake pointer lets go once, then holds.",
    kind: "play",
    C: U149,
  },
  {
    code: "U150",
    name: "Expanding tool label",
    how: "The picked toolbar icon widens to show its label while its siblings slide over (Flip). A fake pointer clicks through the tools.",
    kind: "play",
    C: U150,
  },
  {
    code: "U151",
    name: "Avatar step-forward",
    how: "In an overlapping avatar row the hovered face lifts and steps forward with its name, while neighbours slide apart. A fake pointer reads the row.",
    kind: "play",
    C: U151,
  },
  {
    code: "U152",
    name: "Spring tether drag",
    how: "A coupon tied to its pin by a stretchy line: dragging stretches and thins the line, letting go springs it back. A fake pointer drags and releases.",
    kind: "play",
    C: U152,
  },
  {
    code: "U153",
    name: "Holographic foil shift",
    how: "A rainbow foil and glare on a collector card shift hue, angle and light with the pointer while the card tilts. A fake pointer draws a figure-eight.",
    kind: "play",
    C: U153,
  },
  {
    code: "U154",
    name: "Pulse scale",
    how: "CTAs scale 1 → 1.05 and back on a loop: a double heartbeat with a fading ring on the main button, a slow breath on the second.",
    kind: "play",
    C: U154,
  },
  {
    code: "U155",
    name: "Shake (anchored)",
    how: "Eleven tiles shake in turn: horizontal, vertical, centre rotation and rotations pinned to each edge and corner.",
    kind: "play",
    C: U155,
  },
];
