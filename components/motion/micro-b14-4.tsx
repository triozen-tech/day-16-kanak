"use client";

// Micro-interactions, batch 14 · group 4 (MOTION-MENU U124–U135). Small focused demos for /lab/motion.
// Every hover / click demo also plays by itself: a visible fake pointer (ring) walks over the targets (hover demos)
// or a scripted timeline moves it and "clicks" (click demos). The real mouse takes over for 2.5 s whenever it moves.
// A CSS-only glow loop never stops (and sits on top again, screen-blended) so covered stages never freeze.
// ?static=1 / reduced motion: no JS, the markup shows a sensible final state.
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

const EZ = "cubic-bezier(.2,.7,.2,1)";
const EIO = "cubic-bezier(.65,0,.35,1)";

const CSS = `
.b14g4-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.55)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.22)),transparent 70%);animation:b14g4-drift 5.4s linear infinite alternate;will-change:transform}
@keyframes b14g4-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b14g4-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;pointer-events:none;z-index:40;opacity:0;transition:opacity .25s}
.b14g4-dot>span{display:block;width:100%;height:100%;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4)}
.b14g4-dot.tap>span{animation:b14g4-tap .32s ease-out}
@keyframes b14g4-tap{40%{transform:scale(.55);background:rgba(255,255,255,.6)}100%{transform:scale(1)}}

/* U124 badge */
.u124-dot{position:relative;width:12px;height:12px;border-radius:50%;background:#7dffb2;flex:none}
.u124-dot::before,.u124-dot::after{content:"";position:absolute;inset:0;border-radius:50%;border:2px solid #7dffb2;animation:u124-ring 1.4s cubic-bezier(.2,.6,.3,1) infinite}
.u124-dot::after{animation-delay:.7s}
@keyframes u124-ring{0%{transform:scale(1);opacity:.9}100%{transform:scale(3.4);opacity:0}}
.u124-core{animation:u124-beat 1.4s ease-in-out infinite}
@keyframes u124-beat{0%,100%{transform:scale(1)}50%{transform:scale(1.25)}}

/* U125 attract */
.u125-p{position:absolute;left:0;top:0;border-radius:50%;pointer-events:none;will-change:transform}
.u125-b{transition:transform .45s ${EZ},box-shadow .45s,background-color .45s}
.u125-b.on{transform:scale(1.04);box-shadow:0 0 0 10px rgba(255,190,110,.12),0 20px 60px rgba(255,170,90,.35);background:#ffcf8a}

/* U126 burst */
.u126-sp{position:absolute;left:50%;top:50%;border-radius:50%;pointer-events:none;opacity:0}

/* U127 image zoom */
.u127-f{position:relative;overflow:hidden;border-radius:22px}
.u127-f img{transition:transform 1.1s ${EZ}}
.u127-f.on img{transform:scale(1.12)}
.u127-cap{transition:transform .6s ${EZ},opacity .6s}
.u127-f.on .u127-cap{transform:translateY(-6px)}

/* U128 polygon unfold */
.u128-c{clip-path:polygon(14% 0,100% 9%,86% 100%,0 91%);transition:clip-path .75s ${EIO},background-color .6s}
.u128-c.on{clip-path:polygon(0 0,100% 0,100% 100%,0 100%)}
.u128-t{display:inline-block;transform:rotate(-9deg) translateY(6px);transform-origin:0 100%;transition:transform .75s ${EIO}}
.u128-c.on .u128-t{transform:none}
.u128-c img{transform:scale(1.15);transition:transform .9s ${EZ}}
.u128-c.on img{transform:scale(1)}

/* U130 tooltip rail */
.u130-i{transition:background-color .35s,color .35s}
.u130-i.on{background:#fff;color:#0a0d16}
.u130-tip{clip-path:inset(0 100% 0 0 round 12px)}

/* U131 radial */
.u131-it{transition:background-color .3s,color .3s}
.u131-it.on{background:#fff;color:#0a0d16}

/* U132 swing */
.u132-sway{animation:u132-sway 3.2s ease-in-out infinite alternate}
@keyframes u132-sway{to{transform:translate3d(18px,-10px,0)}}

/* U133 grow */
.u133-a{transition:transform .38s ${EZ},box-shadow .38s,background-color .38s}
.u133-a.g.on{transform:scale(1.1);box-shadow:0 26px 60px rgba(160,140,255,.35)}
.u133-a.s.on{transform:scale(.9);background:rgba(255,255,255,.14)}

/* U134 float */
.u134-a{transition:transform .4s ${EZ},box-shadow .4s}
.u134-a.u.on{transform:translateY(-8px);box-shadow:0 30px 50px rgba(0,0,0,.55),0 0 0 1px rgba(120,220,255,.4)}
.u134-a.d.on{transform:translateY(8px);box-shadow:0 2px 6px rgba(0,0,0,.5),0 0 0 1px rgba(255,180,120,.4)}
.u134-sh{transition:transform .4s ${EZ},opacity .4s}
.u134-a.u.on+.u134-sh{transform:scaleX(.8);opacity:.35}
.u134-a.d.on+.u134-sh{transform:scaleX(1.06);opacity:.9}

/* U135 background fade */
.u135-t{transition:background-color .6s ease,color .6s ease,border-color .6s ease}
.u135-t.on{background:var(--c);color:#0b0c12;border-color:var(--c)}
.u135-ar{display:inline-block;transition:transform .5s ${EZ}}
.u135-t.on .u135-ar{transform:translateX(8px) rotate(-45deg)}

html.is-static .b14g4-glow,html.is-static .u124-dot::before,html.is-static .u124-dot::after,html.is-static .u124-core,html.is-static .u132-sway{animation:none}
html.is-static {
  .b14g4-glow,.u124-dot::before,.u124-dot::after,.u124-core,.u132-sway{animation:none}
  .u125-b,.u127-f img,.u127-cap,.u128-c,.u128-t,.u128-c img,.u130-i,.u131-it,.u133-a,.u134-a,.u134-sh,.u135-t,.u135-ar{transition:none}
}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop, again on top (screen blend) so covered stages never freeze. */
function Stage({ r, children, g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; g1?: string; g2?: string }) {
  return (
    <div ref={r} className="relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0d16] text-[#eef2ff]">
      <style href="b14g4-css" precedence="default">
        {CSS}
      </style>
      <div className="b14g4-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
      <div className="b14g4-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.4, zIndex: 35 } as CSSProperties} aria-hidden />
    </div>
  );
}

/** The visible fake pointer (a ring). */
const Dot = ({ r }: { r: RefObject<HTMLDivElement | null> }) => (
  <div ref={r} className="b14g4-dot" aria-hidden>
    <span />
  </div>
);

function tapDot(d: HTMLElement | null) {
  if (!d) return;
  d.classList.remove("tap");
  void d.offsetWidth;
  d.classList.add("tap");
}

type Box = { l: number; t: number; w: number; h: number };
function rel(node: Element, root: Element): Box {
  const a = node.getBoundingClientRect();
  const r = root.getBoundingClientRect();
  return { l: a.left - r.left, t: a.top - r.top, w: a.width, h: a.height };
}
const mid = (b: Box): [number, number] => [b.l + b.w / 2, b.t + b.h / 2];

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
      gsap.killTweensOf(root.querySelectorAll("*"));
    };
  }, [ref]);
}

/** Real-mouse tracker: idle() is false for 2.5 s after the real pointer moved in the stage. */
function useIdle(root: RefObject<HTMLElement | null>) {
  const at = useRef(-1e9);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const mv = () => (at.current = performance.now());
    el.addEventListener("pointermove", mv);
    return () => el.removeEventListener("pointermove", mv);
  }, [root]);
  return () => performance.now() - at.current > 2500;
}

/** Glide the fake ring (gsap x/y) to the centre of `target` (or a point), measured now. */
function goDot(dot: HTMLElement | null, root: HTMLElement, target: Element | [number, number] | null | undefined, dur = 0.45, idle = true) {
  if (!dot || !target) return;
  dot.style.opacity = idle ? "1" : "0";
  const [x, y] = Array.isArray(target) ? target : mid(rel(target, root));
  gsap.to(dot, { x, y, duration: dur, ease: "power3.inOut", overwrite: "auto" });
}

/** Hover walk: the fake ring visits targets (`sel`) in `order` (-1 = a resting spot off the targets), glides `move` s and
 *  rests `rest` s (≤ 0.5). The hovered target (fake or real mouse) gets class "on"; `onChange(now, prev, root)` fires on change. */
function useHoverWalk(
  root: RefObject<HTMLDivElement | null>,
  dot: RefObject<HTMLDivElement | null>,
  o: {
    sel: string;
    order: number[];
    move?: number;
    rest?: number;
    off?: (w: number, h: number) => [number, number];
    onChange?: (now: number, prev: number, el: HTMLElement) => void;
  },
) {
  const cur = useRef(-1);
  const oc = useRef(o);
  oc.current = o;
  const idle = useIdle(root);
  const set = (el: HTMLElement, i: number) => {
    if (i === cur.current) return;
    const prev = cur.current;
    cur.current = i;
    el.querySelectorAll(oc.current.sel).forEach((n, k) => n.classList.toggle("on", k === i));
    oc.current.onChange?.(i, prev, el);
  };
  // real mouse
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const tg = [...el.querySelectorAll<HTMLElement>(o.sel)];
    const offs = tg.map((n, i) => {
      const en = () => set(el, i);
      const lv = () => cur.current === i && set(el, -1);
      n.addEventListener("pointerenter", en);
      n.addEventListener("pointerleave", lv);
      return () => {
        n.removeEventListener("pointerenter", en);
        n.removeEventListener("pointerleave", lv);
      };
    });
    return () => offs.forEach((f) => f());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [root, o.sel]);
  // fake pointer
  usePlay(root, (el) => {
    const { order, move = 0.45, rest = 0.45 } = oc.current;
    const off = oc.current.off ?? ((w: number, h: number) => [w * 0.5, h * 0.9] as [number, number]);
    const [ox, oy] = off(el.clientWidth, el.clientHeight);
    gsap.set(dot.current, { x: ox, y: oy });
    const tl = gsap.timeline({ repeat: -1, paused: true });
    let t = 0;
    order.forEach((i) => {
      tl.call(
        () => {
          const tg = el.querySelectorAll(oc.current.sel);
          goDot(dot.current, el, i < 0 ? off(el.clientWidth, el.clientHeight) : tg[i], move, idle());
        },
        [],
        t,
      );
      tl.call(() => idle() && set(el, i), [], t + move * 0.8);
      t += move + rest;
    });
    tl.to({}, { duration: 0.01 }, t - 0.01);
    return tl;
  });
  return cur;
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

/* ───────────────────────── U124 · Badge pop-in with pulsing dot ───────────────────────── */
function U124() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const badge = el.querySelector(".u124-badge");
    const sub = el.querySelectorAll(".u124-sub");
    const tl = gsap.timeline({ repeat: -1, paused: true });
    tl.fromTo(badge, { y: 18, scale: 0.82, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.8)" })
      .fromTo(sub, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: "power3.out" }, 0.18)
      .to({}, { duration: 1.1 }) // the dot keeps pulsing (CSS rings) during the read
      .to(sub, { y: -14, opacity: 0, duration: 0.35, stagger: 0.05, ease: "power2.in" })
      .to(badge, { y: -10, scale: 0.9, opacity: 0, duration: 0.3, ease: "power2.in" }, "<0.05");
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(125,255,178,.5)" g2="rgba(79,141,255,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center px-[6%] text-center">
        <span
          className="u124-badge inline-flex items-center gap-4 rounded-full border border-[#7dffb2]/35 bg-[#7dffb2]/[0.08] py-3 pl-5 pr-7 text-[clamp(15px,1.25vw,19px)] font-[600] tracking-[0.08em] text-[#d9ffe9]"
          style={{ fontFamily: F.sg }}
        >
          <span className="u124-dot">
            <span className="u124-core absolute inset-0 rounded-full bg-[#7dffb2]" />
          </span>
          Winter drop · Live now
        </span>
        <h3 className="u124-sub mt-9 text-[clamp(52px,6vw,100px)] leading-[0.96] tracking-[-0.03em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
          Wool, washed in fog.
        </h3>
        <p className="u124-sub mt-6 max-w-[34ch] text-[18px] text-white/60" style={{ fontFamily: F.mr }}>
          Forty-two pieces, knitted in small runs. Shipping across India from ₹3,900.
        </p>
      </div>
    </Stage>
  );
}

/* ───────────────────────── U125 · Particles pulled into button ───────────────────────── */
const U125_N = 34;
const U125_COL = ["#ffcf8a", "#ff9b6a", "#fff1d6", "#ffd9a8"];
function U125() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const parts = useRef<{ hx: number; hy: number; x: number; y: number; vx: number; vy: number; ph: number }[]>([]);
  const cur = useHoverWalk(root, dot, { sel: ".u125-b", order: [0, -1], move: 0.45, rest: 0.5, off: (w, h) => [w * 0.72, h * 0.78] });
  useTicker(root, (t, dt) => {
    const el = root.current;
    if (!el) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    const cx = w / 2;
    const cy = h / 2;
    const P = parts.current;
    if (P.length === 0) {
      for (let i = 0; i < U125_N; i++) {
        const a = (i / U125_N) * Math.PI * 2 + Math.random() * 0.4;
        const r = 210 + Math.random() * Math.min(w, h) * 0.32;
        const hx = cx + Math.cos(a) * r * 1.35;
        const hy = cy + Math.sin(a) * r * 0.75;
        P.push({ hx, hy, x: hx, y: hy, vx: 0, vy: 0, ph: Math.random() * 6.28 });
      }
    }
    const pull = cur.current === 0;
    const k = pull ? 70 : 18;
    const damp = Math.pow(pull ? 0.02 : 0.08, Math.min(dt, 0.05));
    const nodes = el.querySelectorAll<HTMLElement>(".u125-p");
    if (nodes[0] && nodes[0].style.left !== "0px") nodes.forEach((n) => ((n.style.left = "0px"), (n.style.top = "0px")));
    P.forEach((p, i) => {
      const tx = pull ? cx + Math.cos(p.ph + t * 0.8) * 26 : p.hx + Math.sin(t * 0.7 + p.ph) * 22;
      const ty = pull ? cy + Math.sin(p.ph + t * 0.8) * 14 : p.hy + Math.cos(t * 0.6 + p.ph) * 18;
      const d = Math.min(dt, 0.05);
      p.vx = (p.vx + (tx - p.x) * k * d) * damp;
      p.vy = (p.vy + (ty - p.y) * k * d) * damp;
      p.x += p.vx * d * 4;
      p.y += p.vy * d * 4;
      const n = nodes[i];
      if (n) n.style.transform = `translate3d(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px,0)`;
    });
  });
  return (
    <Stage r={root} g1="rgba(255,190,110,.5)" g2="rgba(255,110,90,.22)">
      {Array.from({ length: U125_N }, (_, i) => {
        const s = 6 + (i % 4) * 3;
        const a = (i / U125_N) * Math.PI * 2;
        return (
          <span
            key={i}
            className="u125-p"
            style={{
              width: s,
              height: s,
              margin: `${-s / 2}px 0 0 ${-s / 2}px`,
              background: U125_COL[i % 4],
              boxShadow: `0 0 ${s * 2}px ${U125_COL[i % 4]}`,
              left: `calc(50% + ${Math.round(Math.cos(a) * 420)}px)`,
              top: `calc(50% + ${Math.round(Math.sin(a) * 230)}px)`,
            }}
            aria-hidden
          />
        );
      })}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center" style={{ fontFamily: F.sg }}>
        <button
          type="button"
          className="u125-b pointer-events-auto relative z-10 rounded-full bg-[#ffe7c2] px-14 py-7 text-[clamp(20px,1.7vw,26px)] font-[700] tracking-[-0.01em] text-[#1a0e04]"
        >
          Claim early access
        </button>
        <Eyebrow className="mt-10">Ember Studio · 400 seats · ₹0 to join</Eyebrow>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U126 · Click particle burst ───────────────────────── */
const U126_N = 18;
const U126_COL = ["#ff6fa8", "#ffd36b", "#8fe3ff", "#ffffff", "#b49bff"];
function U126() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const idle = useIdle(root);
  const count = useRef(0);
  const fire = () => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const btn = el.querySelector(".u126-btn");
    const sp = el.querySelectorAll<HTMLElement>(".u126-sp");
    gsap.timeline()
      .to(btn, { scaleX: 1.1, scaleY: 0.86, duration: 0.09, ease: "power2.out" })
      .to(btn, { scaleX: 1, scaleY: 1, duration: 0.55, ease: "elastic.out(1,0.4)" });
    sp.forEach((s, i) => {
      const a = (i / U126_N) * Math.PI * 2 + Math.random() * 0.3;
      const r = 150 + Math.random() * 120;
      gsap.fromTo(
        s,
        { x: 0, y: 0, scale: 1, opacity: 1 },
        { x: Math.cos(a) * r, y: Math.sin(a) * r * 0.8, scale: 0.2, opacity: 0, duration: 0.75 + Math.random() * 0.2, ease: "power3.out", overwrite: true },
      );
    });
    count.current++;
    const c = el.querySelector(".u126-n");
    if (c) c.textContent = String(1248 + count.current);
  };
  usePlay(root, (el) => {
    const btn = el.querySelector(".u126-btn");
    gsap.set(dot.current, { x: el.clientWidth * 0.66, y: el.clientHeight * 0.8 });
    const tl = gsap.timeline({ repeat: -1, paused: true });
    tl.call(() => goDot(dot.current, el, btn, 0.42, idle()), [], 0)
      .call(
        () => {
          if (!idle()) return;
          tapDot(dot.current);
          fire();
        },
        [],
        0.46,
      )
      .call(() => goDot(dot.current, el, [el.clientWidth * (0.36 + Math.random() * 0.3), el.clientHeight * 0.8], 0.45, idle()), [], 1.0)
      .to({}, { duration: 0.01 }, 1.5);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,111,168,.5)" g2="rgba(143,227,255,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ fontFamily: F.sg }}>
        <Eyebrow>Lumen Supply · saved by</Eyebrow>
        <p className="mt-3 text-[clamp(44px,4.6vw,76px)] font-[600] tracking-[-0.03em]">
          <span className="u126-n">1248</span> <span className="text-white/45">people</span>
        </p>
        <div className="relative mt-12">
          {Array.from({ length: U126_N }, (_, i) => {
            const s = 8 + (i % 3) * 4;
            return <span key={i} className="u126-sp" style={{ width: s, height: s, margin: `${-s / 2}px 0 0 ${-s / 2}px`, background: U126_COL[i % 5] }} aria-hidden />;
          })}
          <button
            type="button"
            onClick={fire}
            className="u126-btn relative z-10 flex items-center gap-4 rounded-full bg-[#ff6fa8] px-12 py-6 text-[clamp(19px,1.6vw,24px)] font-[700] text-[#1b0610] shadow-[0_20px_60px_rgba(255,111,168,.35)]"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 21s-7.5-4.6-9.6-9.2C1 8.6 3 5 6.6 5c2.1 0 3.6 1.2 5.4 3.1C13.8 6.2 15.3 5 17.4 5 21 5 23 8.6 21.6 11.8 19.5 16.4 12 21 12 21z" />
            </svg>
            Save to wishlist
          </button>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U127 · Image zoom on hover ───────────────────────── */
const U127_ITEMS = [
  { n: "Salt Room", p: "₹14,200 / night" },
  { n: "Cedar Loft", p: "₹18,600 / night" },
  { n: "Tide House", p: "₹22,900 / night" },
];
function U127() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useHoverWalk(root, dot, { sel: ".u127-f", order: [0, 1, 2, -1], move: 0.45, rest: 0.45, off: (w, h) => [w * 0.5, h * 0.9] });
  return (
    <Stage r={root} g1="rgba(120,200,255,.5)" g2="rgba(255,190,120,.2)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[4vh] px-[5%]" style={{ fontFamily: F.sg }}>
        <h3 className="text-[clamp(36px,3.6vw,58px)] tracking-[-0.02em]" style={{ fontFamily: F.is }}>
          Stays by the coast
        </h3>
        <div className="flex h-[min(66%,500px)] w-[min(92%,1100px)] gap-6">
          {U127_ITEMS.map((it, i) => (
            <div key={it.n} className="u127-f min-w-0 flex-1" data-cursor="View">
              <Img i={i + 21} w={620} h={760} />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 to-transparent" />
              <div className="u127-cap absolute inset-x-6 bottom-6 flex items-baseline justify-between">
                <span className="text-[22px] font-[600]">{it.n}</span>
                <span className="text-[15px] text-white/75">{it.p}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U128 · Polygon unfold card ───────────────────────── */
const U128_ITEMS = [
  { t: "Night Garden", s: "Eau de parfum · 50 ml", p: "₹6,800", c: "#2a1d3d" },
  { t: "Paper Moon", s: "Eau de parfum · 50 ml", p: "₹7,200", c: "#1d2f3a" },
];
function U128() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useHoverWalk(root, dot, { sel: ".u128-c", order: [0, 1], move: 0.45, rest: 0.5 });
  return (
    <Stage r={root} g1="rgba(190,140,255,.5)" g2="rgba(120,220,255,.22)">
      <div className="absolute inset-0 flex items-center justify-center gap-[4vw] px-[6%]">
        {U128_ITEMS.map((it, i) => (
          <div key={it.t} className="u128-c relative flex h-[min(78%,560px)] w-[min(34%,440px)] flex-col overflow-hidden" style={{ background: it.c }}>
            <div className="h-[58%] overflow-hidden">
              <Img i={i + 31} w={560} h={420} />
            </div>
            <div className="flex flex-1 flex-col justify-between p-8">
              <h4 className="u128-t text-[clamp(34px,3.2vw,52px)] leading-none" style={{ fontFamily: F.fr, fontWeight: 500 }}>
                {it.t}
              </h4>
              <div className="flex items-baseline justify-between" style={{ fontFamily: F.sg }}>
                <span className="text-[15px] text-white/65">{it.s}</span>
                <span className="text-[20px] font-[600]">{it.p}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U129 · Morphing hamburger ───────────────────────── */
const U129_LINKS = ["Menu", "Reserve", "Private dining", "Gift cards"];
function U129() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const idle = useIdle(root);
  const open = useRef(false);
  const toggle = (to = !open.current) => {
    const el = root.current;
    if (!el) return;
    open.current = to;
    const [a, b, c] = el.querySelectorAll(".u129-ln");
    const panel = el.querySelector(".u129-panel");
    const links = el.querySelectorAll(".u129-lk");
    if (prefersReducedMotion()) return;
    const d = 0.3;
    if (to) {
      gsap.to(a, { y: 11, rotation: 45, duration: d, ease: "power3.inOut", overwrite: true });
      gsap.to(b, { scaleX: 0, opacity: 0, duration: d * 0.7, ease: "power2.in", overwrite: true });
      gsap.to(c, { y: -11, rotation: -45, duration: d, ease: "power3.inOut", overwrite: true });
      gsap.to(panel, { clipPath: "inset(0% 0% 0% 0% round 28px)", duration: 0.5, ease: "power3.inOut", overwrite: true });
      gsap.fromTo(links, { yPercent: 110 }, { yPercent: 0, duration: 0.5, stagger: 0.06, delay: 0.12, ease: "power3.out", overwrite: true });
    } else {
      gsap.to([a, c], { y: 0, rotation: 0, duration: d, ease: "power3.inOut", overwrite: true });
      gsap.to(b, { scaleX: 1, opacity: 1, duration: d, delay: 0.08, ease: "power2.out", overwrite: true });
      gsap.to(links, { yPercent: -110, duration: 0.25, stagger: 0.03, ease: "power2.in", overwrite: true });
      gsap.to(panel, { clipPath: "inset(0% 0% 100% 100% round 28px)", duration: 0.4, delay: 0.1, ease: "power3.inOut", overwrite: true });
    }
  };
  usePlay(root, (el) => {
    const btn = el.querySelector(".u129-btn");
    gsap.set(dot.current, { x: el.clientWidth * 0.5, y: el.clientHeight * 0.8 });
    const tap = () => {
      if (!idle()) return;
      tapDot(dot.current);
      toggle();
    };
    const tl = gsap.timeline({ repeat: -1, paused: true });
    tl.call(() => goDot(dot.current, el, btn, 0.42, idle()), [], 0)
      .call(tap, [], 0.46)
      .call(() => goDot(dot.current, el, el.querySelectorAll(".u129-lk")[1], 0.45, idle()), [], 1.0)
      .call(() => goDot(dot.current, el, btn, 0.42, idle()), [], 1.5)
      .call(tap, [], 1.96)
      .call(() => goDot(dot.current, el, [el.clientWidth * 0.5, el.clientHeight * 0.8], 0.45, idle()), [], 2.35)
      .to({}, { duration: 0.01 }, 2.85);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,160,110,.5)" g2="rgba(120,160,255,.22)">
      <div className="absolute inset-0" style={{ fontFamily: F.sg }}>
        <header className="absolute left-[6%] right-[6%] top-[9%] flex items-center justify-between">
          <span className="text-[26px] tracking-[-0.01em]" style={{ fontFamily: F.fr }}>
            Oleander Kitchen
          </span>
          <button type="button" onClick={() => toggle()} aria-label="Menu" className="u129-btn relative z-20 grid h-[76px] w-[76px] place-items-center rounded-full bg-white text-[#0a0d16]">
            <span className="relative block h-[26px] w-[32px]">
              <span className="u129-ln absolute left-0 top-[1px] h-[3px] w-full rounded-full bg-current" />
              <span className="u129-ln absolute left-0 top-[12px] h-[3px] w-full rounded-full bg-current" />
              <span className="u129-ln absolute left-0 top-[23px] h-[3px] w-full rounded-full bg-current" />
            </span>
          </button>
        </header>
        <nav
          className="u129-panel absolute right-[6%] top-[9%] z-10 flex w-[min(46%,560px)] flex-col gap-2 rounded-[28px] bg-[#16110d] px-10 pb-10 pt-[110px]"
          style={{ clipPath: "inset(0% 0% 100% 100% round 28px)" }}
        >
          {U129_LINKS.map((l) => (
            <span key={l} className="block overflow-hidden">
              <a href="#" onClick={(e) => e.preventDefault()} className="u129-lk block text-[clamp(34px,3.2vw,50px)] leading-[1.15] tracking-[-0.02em]" style={{ fontFamily: F.fr }}>
                {l}
              </a>
            </span>
          ))}
          <p className="mt-6 text-[14px] text-white/50">Tasting menu ₹4,200 · Tue–Sun</p>
        </nav>
        <div className="absolute bottom-[12%] left-[6%]">
          <Eyebrow>Seasonal · coastal · slow</Eyebrow>
          <h3 className="mt-4 text-[clamp(52px,6vw,96px)] leading-[0.95] tracking-[-0.03em]" style={{ fontFamily: F.fr }}>
            Dinner, unhurried.
          </h3>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U130 · Vertical tooltip menu ───────────────────────── */
const U130_ITEMS: { l: string; d: string }[] = [
  { l: "Home", d: "M4 11l8-7 8 7v9h-5v-6H9v6H4z" },
  { l: "Search", d: "M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm5.5 12.5L21 21" },
  { l: "Saved pieces", d: "M12 20s-7-4.4-8.8-8.6C2 8.4 3.8 5 7 5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.2 0 5 3.4 3.8 6.4C19 15.6 12 20 12 20z" },
  { l: "Bag · 2 items", d: "M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2" },
  { l: "Account", d: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0" },
];
function U130() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useHoverWalk(root, dot, {
    sel: ".u130-i",
    order: [0, 1, 2, 3, 4, -1],
    move: 0.4,
    rest: 0.42,
    off: (w, h) => [w * 0.3, h * 0.5],
    onChange: (i, p, el) => {
      if (prefersReducedMotion()) return;
      const tips = el.querySelectorAll(".u130-tip");
      if (p >= 0) gsap.to(tips[p], { clipPath: "inset(0 100% 0 0 round 12px)", x: -8, duration: 0.3, ease: "power2.in", overwrite: true });
      if (i >= 0) gsap.fromTo(tips[i], { clipPath: "inset(0 100% 0 0 round 12px)", x: -8 }, { clipPath: "inset(0 0% 0 0 round 12px)", x: 0, duration: 0.45, ease: "power3.out", overwrite: true });
    },
  });
  return (
    <Stage r={root} g1="rgba(140,170,255,.55)" g2="rgba(255,140,200,.22)">
      <div className="absolute inset-0 flex items-center gap-[7vw] px-[8%]" style={{ fontFamily: F.sg }}>
        <ul className="relative z-10 flex flex-col gap-3 rounded-[26px] border border-white/12 bg-white/[0.05] p-3">
          {U130_ITEMS.map((it) => (
            <li key={it.l} className="relative">
              <button type="button" aria-label={it.l} className="u130-i grid h-[68px] w-[68px] place-items-center rounded-[18px] text-white/80">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={it.d} />
                </svg>
              </button>
              <span className="u130-tip pointer-events-none absolute left-[calc(100%+22px)] top-1/2 -mt-[24px] flex h-[48px] items-center whitespace-nowrap rounded-[12px] bg-white px-5 text-[17px] font-[600] text-[#0a0d16]">
                {it.l}
              </span>
            </li>
          ))}
        </ul>
        <div className="ml-[10vw] max-w-[620px]">
          <Eyebrow>Fieldnote Goods · new arrivals</Eyebrow>
          <h3 className="mt-5 text-[clamp(48px,5.4vw,88px)] leading-[0.96] tracking-[-0.03em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
            Made to be carried.
          </h3>
          <p className="mt-6 text-[18px] text-white/60">Canvas totes and field bags from ₹2,400.</p>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U131 · Radial fan-out menu ───────────────────────── */
const U131_ITEMS: { l: string; d: string }[] = [
  { l: "Call", d: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" },
  { l: "Chat", d: "M4 5h16v11H9l-5 4z" },
  { l: "Book", d: "M5 6h14v14H5zM5 10h14M9 4v4M15 4v4" },
  { l: "Map", d: "M12 21s-6-5.3-6-11a6 6 0 0 1 12 0c0 5.7-6 11-6 11zm0-9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" },
  { l: "Share", d: "M7 12a2 2 0 1 1 0-.1zM17 6a2 2 0 1 1 0-.1zM17 18a2 2 0 1 1 0-.1zM9 11l6-4M9 13l6 4" },
  { l: "Save", d: "M7 4h10v17l-5-4-5 4z" },
];
function U131() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const idle = useIdle(root);
  const open = useRef(false);
  const R = 190;
  const toggle = (to = !open.current) => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    open.current = to;
    const its = [...el.querySelectorAll<HTMLElement>(".u131-it")];
    const plus = el.querySelector(".u131-plus");
    const n = its.length;
    if (to) {
      its.forEach((it, i) => {
        const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
        gsap.fromTo(
          it,
          { x: 0, y: 0, scale: 0.2, rotation: -200, opacity: 0 },
          { x: Math.cos(a) * R, y: Math.sin(a) * R, scale: 1, rotation: 0, opacity: 1, duration: 0.65, delay: i * 0.05, ease: "back.out(1.7)", overwrite: true },
        );
      });
      gsap.to(plus, { rotation: 135, duration: 0.5, ease: "back.out(2)", overwrite: true });
    } else {
      // the reverse ease: faster, accelerating in, last item first
      its.forEach((it, i) => gsap.to(it, { x: 0, y: 0, scale: 0.2, rotation: -120, opacity: 0, duration: 0.32, delay: (n - 1 - i) * 0.03, ease: "power3.in", overwrite: true }));
      gsap.to(plus, { rotation: 0, duration: 0.35, ease: "power3.inOut", overwrite: true });
    }
  };
  usePlay(root, (el) => {
    const fab = el.querySelector(".u131-fab");
    gsap.set(dot.current, { x: el.clientWidth * 0.68, y: el.clientHeight * 0.82 });
    const tap = () => {
      if (!idle()) return;
      tapDot(dot.current);
      toggle();
    };
    const hover = (i: number) => {
      if (!idle()) return;
      el.querySelectorAll(".u131-it").forEach((n, k) => n.classList.toggle("on", k === i));
    };
    const tl = gsap.timeline({ repeat: -1, paused: true });
    tl.call(() => goDot(dot.current, el, fab, 0.42, idle()), [], 0)
      .call(tap, [], 0.46)
      .call(() => goDot(dot.current, el, el.querySelectorAll(".u131-it")[2], 0.42, idle()), [], 1.05)
      .call(() => hover(2), [], 1.4)
      .call(() => goDot(dot.current, el, fab, 0.4, idle()), [], 1.85)
      .call(() => hover(-1), [], 2.0)
      .call(tap, [], 2.27)
      .call(() => goDot(dot.current, el, [el.clientWidth * 0.68, el.clientHeight * 0.82], 0.45, idle()), [], 2.5)
      .to({}, { duration: 0.01 }, 2.95);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(120,230,210,.5)" g2="rgba(255,170,120,.22)">
      <div className="absolute left-[7%] top-1/2 max-w-[440px] -translate-y-1/2" style={{ fontFamily: F.sg }}>
        <Eyebrow>Harbour Clinic · Bandra</Eyebrow>
        <h3 className="mt-5 text-[clamp(44px,4.6vw,76px)] leading-[0.98] tracking-[-0.03em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
          Care, one tap away.
        </h3>
        <p className="mt-5 text-[17px] text-white/60">First consult ₹900.</p>
      </div>
      <div className="absolute left-[64%] top-1/2 h-0 w-0" style={{ fontFamily: F.sg }}>
        {U131_ITEMS.map((it) => (
          <button
            key={it.l}
            type="button"
            aria-label={it.l}
            className="u131-it absolute -ml-[36px] -mt-[36px] grid h-[72px] w-[72px] place-items-center rounded-full border border-white/15 bg-[#14202a] text-white/85 opacity-0"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d={it.d} />
            </svg>
          </button>
        ))}
        <button
          type="button"
          onClick={() => toggle()}
          aria-label="Open actions"
          className="u131-fab absolute -ml-[48px] -mt-[48px] grid h-[96px] w-[96px] place-items-center rounded-full bg-[#7fe9d6] text-[#04201b] shadow-[0_20px_60px_rgba(127,233,214,.35)]"
        >
          <svg className="u131-plus" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
            <path d="M12 4v16M4 12h16" />
          </svg>
        </button>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U132 · Swing from top ───────────────────────── */
function U132() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const sign = el.querySelector(".u132-sign");
    const tl = gsap.timeline({ repeat: -1, paused: true });
    // decaying swing about the nail; one beat per keyframe so the angle shrinks like a hanging board
    tl.to(sign, { keyframes: { rotation: [16, -11, 7, -4.5, 2.6, -1.4, 0], ease: "sine.inOut" }, duration: 2.1, ease: "none" }).to({}, { duration: 0.2 });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,200,120,.5)" g2="rgba(160,120,255,.22)">
      <div className="u132-sway absolute right-[8%] top-[18%] h-[180px] w-[180px] rounded-full bg-[#ffcf7a]/10" aria-hidden />
      <div className="absolute inset-x-0 top-[7%] mx-auto h-[2px] w-[min(56%,700px)] bg-white/20" />
      <div className="absolute inset-0 flex justify-center">
        <div className="u132-sign relative mt-[7%] flex flex-col items-center" style={{ transformOrigin: "50% 0" }}>
          <span className="relative z-10 h-[16px] w-[16px] -translate-y-1/2 rounded-full bg-[#d8c6a4] shadow-[0_2px_6px_rgba(0,0,0,.5)]" />
          <svg width="300" height="96" viewBox="0 0 300 96" className="-mt-2" aria-hidden>
            <path d="M150 0 L40 96 M150 0 L260 96" stroke="#d8c6a4" strokeWidth="2.5" fill="none" />
          </svg>
          <div className="-mt-1 flex w-[min(44vw,560px)] flex-col items-center rounded-[22px] border-[3px] border-[#d8c6a4]/70 bg-[#1b140c] px-12 py-10 text-center shadow-[0_40px_80px_rgba(0,0,0,.5)]">
            <Eyebrow className="text-[#ffcf7a]/80">Since 2014 · Fort Kochi</Eyebrow>
            <h3 className="mt-4 text-[clamp(48px,5vw,84px)] leading-[0.95] tracking-[-0.02em] text-[#fff3dc]" style={{ fontFamily: F.fr, fontWeight: 500 }}>
              Kiln &amp; Rye
            </h3>
            <p className="mt-5 text-[18px] text-[#fff3dc]/70" style={{ fontFamily: F.sg }}>
              Open till 9 · sourdough ₹280
            </p>
          </div>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── U133 · Grow ───────────────────────── */
function U133() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useHoverWalk(root, dot, { sel: ".u133-a", order: [0, -1, 1, -1], move: 0.42, rest: 0.42, off: (w, h) => [w * 0.5, h * 0.82] });
  return (
    <Stage r={root} g1="rgba(160,140,255,.55)" g2="rgba(255,150,200,.22)">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[7vh]" style={{ fontFamily: F.sg }}>
        <h3 className="text-[clamp(44px,4.6vw,76px)] tracking-[-0.03em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
          Pick your plan
        </h3>
        <div className="flex items-start gap-[5vw]">
          <div className="flex flex-col items-center gap-5">
            <button type="button" className="u133-a g rounded-[22px] bg-[#a08cff] px-14 py-8 text-left text-[#0e0920]">
              <span className="block text-[14px] font-[600] uppercase tracking-[0.2em] opacity-70">Studio</span>
              <span className="mt-2 block text-[clamp(30px,2.6vw,42px)] font-[700] tracking-[-0.02em]">₹1,499/mo</span>
            </button>
            <Eyebrow>grow · 1.1</Eyebrow>
          </div>
          <div className="flex flex-col items-center gap-5">
            <button type="button" className="u133-a s rounded-[22px] border border-white/20 bg-white/[0.06] px-14 py-8 text-left">
              <span className="block text-[14px] font-[600] uppercase tracking-[0.2em] text-white/60">Solo</span>
              <span className="mt-2 block text-[clamp(30px,2.6vw,42px)] font-[700] tracking-[-0.02em]">₹499/mo</span>
            </button>
            <Eyebrow>shrink · 0.9</Eyebrow>
          </div>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U134 · Float ───────────────────────── */
const U134_ITEMS = [
  { n: "Drift Lamp", p: "₹7,400", c: "u", l: "float · up 8px" },
  { n: "Moss Vase", p: "₹3,200", c: "d", l: "sink · down 8px" },
];
function U134() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useHoverWalk(root, dot, { sel: ".u134-a", order: [0, -1, 1, -1], move: 0.42, rest: 0.42, off: (w, h) => [w * 0.5, h * 0.88] });
  return (
    <Stage r={root} g1="rgba(120,220,255,.5)" g2="rgba(255,180,120,.22)">
      <div className="absolute inset-0 flex items-center justify-center gap-[6vw]" style={{ fontFamily: F.sg }}>
        {U134_ITEMS.map((it, i) => (
          <div key={it.n} className="flex flex-col items-center">
            <div className={`u134-a ${it.c} relative flex h-[min(52vh,420px)] w-[min(24vw,330px)] flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#121725] shadow-[0_14px_30px_rgba(0,0,0,.45)]`}>
              <div className="min-h-0 flex-1">
                <Img i={i + 41} w={460} h={420} />
              </div>
              <div className="flex items-baseline justify-between px-6 py-5">
                <span className="text-[20px] font-[600]">{it.n}</span>
                <span className="text-[17px] text-white/75">{it.p}</span>
              </div>
            </div>
            <div className="u134-sh mt-5 h-[14px] w-[70%] rounded-[50%] bg-black/70 opacity-60 blur-[8px]" aria-hidden />
            <Eyebrow className="mt-4">{it.l}</Eyebrow>
          </div>
        ))}
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ───────────────────────── U135 · Background fade ───────────────────────── */
const U135_ITEMS = [
  { t: "Bedroom", n: "128 pieces", c: "#f4c79a" },
  { t: "Kitchen", n: "96 pieces", c: "#a8e3c4" },
  { t: "Living", n: "214 pieces", c: "#b9c4ff" },
];
function U135() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useHoverWalk(root, dot, { sel: ".u135-t", order: [0, 1, 2, -1], move: 0.42, rest: 0.45, off: (w, h) => [w * 0.5, h * 0.9] });
  return (
    <Stage r={root} g1="rgba(244,199,154,.5)" g2="rgba(185,196,255,.22)">
      <div className="absolute inset-0 flex flex-col justify-center gap-4 px-[9%]" style={{ fontFamily: F.sg }}>
        <Eyebrow className="mb-4">Linden Home · shop by room</Eyebrow>
        {U135_ITEMS.map((it) => (
          <a
            key={it.t}
            href="#"
            onClick={(e) => e.preventDefault()}
            className="u135-t flex items-center justify-between rounded-[22px] border border-white/12 bg-white/[0.04] px-10 py-7"
            style={{ "--c": it.c } as CSSProperties}
          >
            <span className="text-[clamp(40px,4.2vw,68px)] leading-none tracking-[-0.03em]" style={{ fontFamily: F.fr, fontWeight: 400 }}>
              {it.t}
            </span>
            <span className="flex items-center gap-6 text-[18px] font-[600]">
              {it.n}
              <span className="u135-ar text-[30px]">→</span>
            </span>
          </a>
        ))}
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  {
    code: "U124",
    name: "Badge pop-in with pulsing dot",
    how: "An eyebrow pill scales and fades in from just below, then its status dot pulses with expanding rings while the headline settles; loops with a short rest.",
    kind: "play",
    C: U124,
  },
  {
    code: "U125",
    name: "Particles pulled into button",
    how: "Glowing particles drift around a button; on hover springs pull them into its centre and they float free on leave. A fake pointer hovers on a loop.",
    kind: "play",
    C: U125,
  },
  {
    code: "U126",
    name: "Click particle burst",
    how: "On click the button squashes and springs back while particles shoot out radially and fade. A fake pointer taps it on a loop.",
    kind: "play",
    C: U126,
  },
  {
    code: "U127",
    name: "Image zoom on hover",
    how: "The hovered photo scales up slightly inside its fixed frame (overflow hidden). A fake pointer walks across three cards.",
    kind: "play",
    C: U127,
  },
  {
    code: "U128",
    name: "Polygon unfold card",
    how: "Each card is clipped to a folded polygon; on hover it unfolds to a full rectangle while its rotated title straightens. A fake pointer visits both cards.",
    kind: "play",
    C: U128,
  },
  {
    code: "U129",
    name: "Morphing hamburger",
    how: "The three menu lines rotate and slide into an X (≈0.3 s) as the menu panel opens, and back when it closes. A fake pointer clicks open and shut.",
    kind: "play",
    C: U129,
  },
  {
    code: "U130",
    name: "Vertical tooltip menu",
    how: "A vertical icon rail; the hovered icon's label tooltip is revealed with a clip-path wipe to its right. A fake pointer reads down the rail.",
    kind: "play",
    C: U130,
  },
  {
    code: "U131",
    name: "Radial fan-out menu",
    how: "A round button fans six icons out on a circle with a staggered back-out ease and they spin upright; closing uses a faster ease-in, last item first. Auto-clicked on a loop.",
    kind: "play",
    C: U131,
  },
  {
    code: "U132",
    name: "Swing from top",
    how: "A hanging sign swings from its top-centre nail with a decaying angle, then settles; loops with a short rest.",
    kind: "play",
    C: U132,
  },
  {
    code: "U133",
    name: "Grow",
    how: "On hover one plan card scales to 1.1 and the other presses in to 0.9. A fake pointer hovers each in turn.",
    kind: "play",
    C: U133,
  },
  {
    code: "U134",
    name: "Float",
    how: "On hover one card lifts up 8 px (its shadow tightens) and the other sinks down 8 px. A fake pointer hovers each in turn.",
    kind: "play",
    C: U134,
  },
  {
    code: "U135",
    name: "Background fade",
    how: "On hover each room row cross-fades its background to its own colour and the arrow turns. A fake pointer walks down the rows.",
    kind: "play",
    C: U135,
  },
];
