"use client";

// MOTION-MENU M506–M517 (image group, batch 10 · group 4): small focused demos for /lab/motion.
// Every "play" demo starts when on screen, loops, and pauses off screen. Hover / drag demos also play by themselves
// (a visible fake pointer or a scripted throw; the real pointer still works). Every stage has a CSS-only glow loop, and
// image-covered stages get a second glow ON TOP (screen blend) so a recording never reads as frozen.
// WebGL demos build their textures and GL context only when the stage is within ~1 screen of the viewport.
// ?static=1 / reduced motion: no JS motion, the markup shows a sensible final state.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, loadPlugin, prefersReducedMotion } from "@/lib/gsap";
import { createShader, type GLHandle } from "@/lib/gl";
import { scene, toCanvas } from "@/components/fx/shared";
import { Product } from "@/components/sections/kit";
import type { MotionDef } from "./types";

const GROTESK = "'Space Grotesk Variable', system-ui, sans-serif";
const SERIF = "'Fraunces Variable', Georgia, serif";
const EDITORIAL = "'Instrument Serif', Georgia, serif";
const WIDE = "'Syne Variable', 'Space Grotesk Variable', system-ui, sans-serif";
const MANROPE = "'Manrope Variable', system-ui, sans-serif";

type Q = (s: string) => HTMLElement[];
type Anim = gsap.core.Animation;

/* ---------- shared helpers (local to this file) ---------- */

const CSS = `
.b10g4i-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 44% at 30% 40%,var(--g1,rgba(79,141,255,.5)),transparent 70%),radial-gradient(34% 40% at 72% 64%,var(--g2,rgba(255,122,89,.22)),transparent 70%);animation:b10g4i-drift 5.2s linear infinite alternate;will-change:transform}
@keyframes b10g4i-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b10g4i-dot{position:absolute;left:0;top:0;width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4);pointer-events:none;z-index:40;opacity:0}
.m513-card{}
.m517-card{transition:transform .45s cubic-bezier(.22,1,.36,1),box-shadow .45s,border-color .45s}
.m517-card[data-on]{transform:scale(1.14);border-color:rgba(255,200,120,.9);box-shadow:0 0 0 1px rgba(255,200,120,.5),0 24px 60px rgba(255,170,80,.28)}
html.is-static .b10g4i-glow{animation:none}
html.is-static .m517-card{transition:none}
html.is-static {
  .b10g4i-glow{animation:none}
  .m517-card{transition:none}
}
`;

/** Demo frame: rounded dark panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", g1, g2, bg = "#0a0f1c", style }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string; bg?: string; style?: CSSProperties }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 text-[#eef3ff] ${className}`} style={{ background: bg, ...style }}>
      <style href="b10g4i-css" precedence="default">
        {CSS}
      </style>
      <div className="b10g4i-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/** The CSS glow loop again, ON TOP of photos / tiles / a canvas (screen blend), so big image stages never freeze (rule 13). */
const Sheen = ({ g1 }: { g1?: string }) => (
  <div className="b10g4i-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.45, zIndex: 35 } as CSSProperties} aria-hidden />
);

/** Visible fake pointer (drives hover / drag demos while nobody touches the mouse). */
const Dot = ({ r }: { r: RefObject<HTMLDivElement | null> }) => <div ref={r} className="b10g4i-dot" aria-hidden />;

/** "play" helper: waits for fonts (+ an optional plugin), builds looping animation(s) in a gsap.context, plays them only
 *  while on screen, reverts on unmount. Nothing runs with prefersReducedMotion(). */
function usePlay(ref: RefObject<HTMLElement | null>, build: (root: HTMLElement, q: Q, onClean: (fn: () => void) => void) => Anim | Anim[] | void, pre?: () => Promise<unknown>) {
  const b = useRef(build);
  b.current = build;
  const p = useRef(pre);
  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    let dead = false;
    let on = false;
    let anims: Anim[] = [];
    const cleans: (() => void)[] = [];
    const ctx = gsap.context(() => {}, root);
    const sync = () => anims.forEach((a) => (on ? a.play() : a.pause()));
    const io = new IntersectionObserver(
      ([e]) => {
        on = e.isIntersecting;
        sync();
      },
      { threshold: 0.1 },
    );
    io.observe(root);
    Promise.all([document.fonts?.ready, p.current?.()]).then(() => {
      if (dead) return;
      ctx.add(() => {
        const r = b.current(root, gsap.utils.selector(root) as Q, (fn) => cleans.push(fn));
        anims = r ? (Array.isArray(r) ? r : [r]) : [];
      });
      sync();
    });
    return () => {
      dead = true;
      io.disconnect();
      ctx.revert();
      cleans.forEach((f) => f());
    };
  }, [ref]);
}

/** A frame loop as an animation (so usePlay pauses it off screen). dt in seconds, clamped. */
function frameLoop(fn: (dt: number, t: number) => void) {
  let last = performance.now();
  const t0 = last;
  return gsap.to(
    {},
    {
      duration: 1,
      repeat: -1,
      ease: "none",
      onUpdate: () => {
        const now = performance.now();
        fn(Math.min(0.05, (now - last) / 1000), (now - t0) / 1000);
        last = now;
      },
    },
  );
}

/** Runs `start` once the element is within ~1 screen of the viewport (rule 20). `start` may return a cleanup. */
function useNear(ref: RefObject<HTMLElement | null>, start: () => (() => void) | void) {
  const s = useRef(start);
  s.current = start;
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let stop: (() => void) | void;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        stop = s.current();
      },
      { rootMargin: "900px 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      stop?.();
    };
  }, [ref]);
}

/** Centre of `el` relative to `root` (for the fake pointer). */
const centerIn = (el: Element, root: Element, fx = 0.5, fy = 0.5) => {
  const a = el.getBoundingClientRect();
  const b = root.getBoundingClientRect();
  return { x: a.left - b.left + a.width * fx, y: a.top - b.top + a.height * fy };
};

const bgUrl = (src: string) => `url("${src}")`;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, className = "", style, label = "", w = 1400, h = 900 }: { i: number; className?: string; style?: CSSProperties; label?: string; w?: number; h?: number }) => <img src={scene(i, w, h, label)} alt="" className={`h-full w-full object-cover ${className}`} style={style} draggable={false} />;

/* ---------- M506 · Interleaved strips swap two images (variant of M16) ---------- */
const M506_N = 12;
function M506() {
  const root = useRef<HTMLDivElement>(null);
  const tag = useRef<HTMLSpanElement>(null);
  const A = scene(1, 1600, 900);
  const B = scene(2, 1600, 900);
  usePlay(root, (_r, q) => {
    const a = q(".m506-a");
    const b = q(".m506-b");
    const strips = q(".m506-s");
    gsap.set(a, { y: 0, yPercent: 0 });
    gsap.set(b, { y: 0, yPercent: -50 });
    const say = (t: string) => () => {
      if (tag.current) tag.current.textContent = t;
    };
    const ease = "power3.inOut";
    return gsap
      .timeline({ repeat: -1 })
      .call(say("Clean swap"), [], 0)
      .to(a, { yPercent: -50, duration: 0.95, ease, stagger: 0.045 }, 0.05)
      .to(b, { yPercent: 0, duration: 0.95, ease, stagger: 0.045 }, 0.05)
      .call(say("Glitch swap"), [], 1.45)
      .to(a, { yPercent: 0, duration: 0.95, ease, stagger: 0.045 }, 1.55)
      .to(b, { yPercent: -50, duration: 0.95, ease, stagger: 0.045 }, 1.55)
      .to(strips, { x: () => gsap.utils.random(-22, 22), duration: 0.07, ease: "steps(1)", repeat: 9, repeatRefresh: true, stagger: { each: 0.025, from: "random" } }, 1.55)
      .to(strips, { x: 0, duration: 0.12, ease: "power2.out", overwrite: "auto" }, 2.62)
      .to({}, { duration: 0.05 }, 3.05);
  });
  const panel = (i: number, src: string) => (
    <div className="relative h-1/2 w-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="absolute top-0 h-full max-w-none object-cover" style={{ width: `${M506_N * 100}%`, left: `${-i * 100}%` }} draggable={false} />
    </div>
  );
  return (
    <Stage r={root} g1="rgba(255,120,150,.4)" g2="rgba(79,141,255,.25)">
      <div className="absolute inset-[3%] flex overflow-hidden rounded-[22px] bg-black">
        {Array.from({ length: M506_N }, (_, i) => (
          <div key={i} className="m506-s relative h-full flex-1 overflow-hidden">
            <div className={`${i % 2 ? "m506-b" : "m506-a"} absolute inset-x-0 top-0 h-[200%] will-change-transform`} style={i % 2 ? { transform: "translateY(-50%)" } : undefined}>
              {panel(i, A)}
              {panel(i, B)}
            </div>
          </div>
        ))}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="pointer-events-none absolute bottom-[8%] left-[5%]">
          <p className="text-[13px] uppercase tracking-[0.24em] text-white/70">
            Two Shores · <span ref={tag}>Clean swap</span>
          </p>
          <h3 className="mt-2 text-[clamp(44px,5.4vw,88px)] leading-[0.95]" style={{ fontFamily: EDITORIAL }}>
            Linen meets clay
          </h3>
          <p className="mt-2 text-[16px] text-white/75">Two collections, one wall · from ₹ 2,400</p>
        </div>
      </div>
      <Sheen g1="rgba(255,150,170,.45)" />
    </Stage>
  );
}

/* ---------- M507 · Sliced slide-in + scrambled label (variant of M16) ---------- */
const M507_N = 9;
const M507_R = [
  { t: "Tidal Lounge Chair", l: "NO. 01 — OAK + BOUCLE · ₹ 48,500", i: 0 },
  { t: "Ember Floor Lamp", l: "NO. 02 — BRASS + LINEN · ₹ 21,900", i: 1 },
  { t: "Moss Side Table", l: "NO. 03 — TRAVERTINE · ₹ 17,250", i: 2 },
];
function M507() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const api = useRef<{ hover: (i: number | null) => void }>({ hover: () => {} });
  const srcs = M507_R.map((r) => scene(r.i, 1200, 900));
  usePlay(root, (el, q) => {
    const rows = q(".m507-row");
    const base = q(".m507-base")[0];
    const slices = q(".m507-sl");
    const label = q(".m507-lab")[0];
    let cur = 0;
    const activate = (i: number) => {
      if (i === cur) return;
      const prev = cur;
      cur = i;
      base.style.backgroundImage = bgUrl(srcs[prev]);
      slices.forEach((s) => (s.style.backgroundImage = bgUrl(srcs[i])));
      const side = i > prev ? 1 : -1;
      gsap.fromTo(
        slices,
        { xPercent: () => side * -55 + gsap.utils.random(-28, 28), opacity: 0.2 },
        { xPercent: 0, opacity: 1, duration: 0.6, ease: "power4.out", stagger: { each: 0.025, from: "random" }, overwrite: true },
      );
      gsap.to(label, { duration: 0.6, scrambleText: { text: M507_R[i].l, chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+", speed: 0.7 }, overwrite: true });
      rows.forEach((r, k) => gsap.to(r, { x: k === i ? 18 : 0, opacity: k === i ? 1 : 0.42, duration: 0.45, ease: "power3.out", overwrite: true }));
    };
    const pts = rows.map((r) => centerIn(r, el, 0.32, 0.5));
    gsap.set(dot.current, { x: pts[0].x, y: pts[0].y, opacity: 1 });
    const tl = gsap.timeline({ repeat: -1 });
    [1, 2, 1, 0].forEach((k) => {
      tl.to(dot.current, { x: pts[k].x, y: pts[k].y, duration: 0.38, ease: "power2.inOut" })
        .call(() => activate(k))
        .to(dot.current, { x: `+=${14}`, y: "-=4", duration: 0.42, ease: "sine.inOut" });
    });
    api.current.hover = (i) => {
      if (i === null) {
        gsap.to(dot.current, { opacity: 1, duration: 0.2 });
        tl.play();
      } else {
        tl.pause();
        gsap.to(dot.current, { opacity: 0, duration: 0.2 });
        activate(i);
      }
    };
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(120,200,255,.5)" g2="rgba(255,200,120,.2)" bg="#0b0d14">
      <div className="absolute inset-0 grid grid-cols-[1fr_1.05fr] items-center gap-[4%] px-[5%]" onMouseLeave={() => api.current.hover(null)}>
        <ul className="flex flex-col gap-[clamp(14px,2.4vh,26px)]">
          {M507_R.map((r, k) => (
            <li key={k} className="m507-row cursor-pointer" style={{ opacity: k === 0 ? 1 : 0.42, transform: k === 0 ? "translateX(18px)" : undefined }} onMouseEnter={() => api.current.hover(k)}>
              <span className="block text-[13px] tracking-[0.2em] text-white/55" style={{ fontFamily: GROTESK }}>
                0{k + 1}
              </span>
              <span className="block text-[clamp(34px,3.6vw,58px)] leading-[1.02]" style={{ fontFamily: SERIF }}>
                {r.t}
              </span>
            </li>
          ))}
        </ul>
        <div>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[18px] bg-black">
            <div className="m507-base absolute inset-0 bg-cover bg-center" style={{ backgroundImage: bgUrl(srcs[0]) }} />
            {Array.from({ length: M507_N }, (_, k) => (
              <div
                key={k}
                className="m507-sl absolute inset-x-0 will-change-transform"
                style={{ top: `${(k * 100) / M507_N}%`, height: `${100 / M507_N + 0.2}%`, backgroundImage: bgUrl(srcs[0]), backgroundSize: `100% ${M507_N * 100}%`, backgroundPosition: `0 ${(k / (M507_N - 1)) * 100}%` }}
              />
            ))}
          </div>
          <p className="m507-lab mt-4 text-[14px] tracking-[0.16em] text-white/80" style={{ fontFamily: GROTESK }}>
            {M507_R[0].l}
          </p>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ---------- M508 · Prism-facet image flip (variant of M16) ---------- */
const M508_N = 24;
function M508() {
  const root = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const handle = useRef<HTMLDivElement>(null);
  const st = useRef({ h: -0.1, drag: false });
  const ctl = useRef<{ down: (x: number) => void; move: (x: number) => void; up: () => void }>({ down: () => {}, move: () => {}, up: () => {} });
  const A = scene(3, 1600, 900);
  const B = scene(0, 1600, 900);
  usePlay(root, (_el, q) => {
    const facets = q(".m508-f");
    const shA = q(".m508-sa");
    const shB = q(".m508-sb");
    const rot = facets.map((f) => gsap.quickSetter(f, "rotationY", "deg") as (v: number) => void);
    const s = st.current;
    const apply = () => {
      for (let i = 0; i < M508_N; i++) {
        const c = (i + 0.5) / M508_N;
        const t = clamp01((s.h - c) / 0.14 + 0.5);
        const e = t * t * (3 - 2 * t);
        rot[i](-90 * e);
        shA[i].style.opacity = String((1 - Math.cos((e * Math.PI) / 2)) * 0.85);
        shB[i].style.opacity = String((1 - Math.sin((e * Math.PI) / 2)) * 0.85);
      }
      if (handle.current) handle.current.style.left = `${s.h * 100}%`;
    };
    const tl = gsap
      .timeline({ repeat: -1, onUpdate: apply })
      .fromTo(s, { h: -0.1 }, { h: 1.1, duration: 1.6, ease: "sine.inOut" })
      .to(s, { h: -0.1, duration: 1.6, ease: "sine.inOut" });
    apply();
    let settle: gsap.core.Tween | null = null;
    const toH = (x: number) => {
      const r = box.current!.getBoundingClientRect();
      return (x - r.left) / r.width;
    };
    ctl.current = {
      down: (x) => {
        s.drag = true;
        tl.pause();
        settle?.kill();
        s.h = toH(x);
        apply();
      },
      move: (x) => {
        if (!s.drag) return;
        s.h = toH(x);
        apply();
      },
      up: () => {
        if (!s.drag) return;
        s.drag = false;
        const right = s.h > 0.5;
        settle = gsap.to(s, { h: right ? 1.1 : -0.1, duration: 0.6, ease: "power2.out", onUpdate: apply, onComplete: () => tl.play(right ? 1.6 : 0) });
      },
    };
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,200,110,.45)" g2="rgba(79,141,255,.25)">
      <div
        ref={box}
        className="absolute inset-[4%] flex cursor-ew-resize touch-none select-none [container-type:inline-size]"
        style={{ perspective: "1600px" }}
        onPointerDown={(e) => ctl.current.down(e.clientX)}
        onPointerMove={(e) => ctl.current.move(e.clientX)}
        onPointerUp={() => ctl.current.up()}
        onPointerLeave={() => ctl.current.up()}
      >
        {Array.from({ length: M508_N }, (_, i) => (
          <div key={i} className="m508-f relative h-full flex-1" style={{ transformStyle: "preserve-3d" }}>
            {[A, B].map((src, k) => (
              <div key={k} className="absolute inset-0 overflow-hidden [backface-visibility:hidden]" style={{ transform: k ? "rotateY(90deg) translateZ(calc(100cqw / 48))" : "translateZ(calc(100cqw / 48))" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="absolute top-0 h-full max-w-none object-cover" style={{ width: `${M508_N * 100}%`, left: `${-i * 100}%` }} draggable={false} />
                <div className={`${k ? "m508-sb" : "m508-sa"} absolute inset-0 bg-black`} style={{ opacity: k ? 0.85 : 0 }} />
              </div>
            ))}
          </div>
        ))}
        <div ref={handle} className="pointer-events-none absolute inset-y-[-2%] z-20 w-[2px] bg-white/90" style={{ left: "0%" }}>
          <span className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-black/40 text-[16px] backdrop-blur-sm">⇆</span>
        </div>
        <div className="pointer-events-none absolute bottom-[7%] left-[4%] z-10">
          <p className="text-[13px] uppercase tracking-[0.24em] text-white/75">Before / after · drag the blind</p>
          <h3 className="mt-2 text-[clamp(40px,4.8vw,76px)] font-[700] leading-[0.95]" style={{ fontFamily: WIDE }}>
            Day to dusk
          </h3>
        </div>
      </div>
      <Sheen g1="rgba(255,210,140,.45)" />
    </Stage>
  );
}

/* ---------- M509 · Diced image assembles (variant of M34) ---------- */
const M509_C = 8;
const M509_R = 5;
function M509() {
  const root = useRef<HTMLDivElement>(null);
  const src = scene(3, 1600, 820);
  usePlay(root, (_el, q) => {
    const tiles = q(".m509-t");
    const cap = q(".m509-cap");
    const grid: [number, number] = [M509_R, M509_C];
    const r = gsap.utils.random;
    return gsap
      .timeline({ repeat: -1, repeatRefresh: true })
      .fromTo(
        tiles,
        { z: () => r(-1100, -500), x: () => r(-90, 90), y: () => r(-70, 70), rotationX: () => r(-55, 55), rotationY: () => r(-55, 55), opacity: 0 },
        { z: 0, x: 0, y: 0, rotationX: 0, rotationY: 0, opacity: 1, duration: 1.05, ease: "power3.out", stagger: { grid, from: "center", amount: 0.55 } },
        0,
      )
      .fromTo(cap, { yPercent: 110 }, { yPercent: 0, duration: 0.6, ease: "power3.out", stagger: 0.06 }, 0.9)
      .to(tiles, { scale: 0.96, duration: 0.25, ease: "sine.inOut", yoyo: true, repeat: 1, stagger: { grid, from: "center", amount: 0.2 } }, 1.6)
      .to(cap, { yPercent: -110, duration: 0.35, ease: "power2.in" }, 2.15)
      .to(tiles, { z: () => r(250, 600), rotationX: () => r(-70, 70), rotationY: () => r(-70, 70), opacity: 0, duration: 0.55, ease: "power2.in", stagger: { grid, from: "edges", amount: 0.3 } }, 2.15);
  });
  return (
    <Stage r={root} g1="rgba(255,180,90,.5)" g2="rgba(255,110,80,.25)" bg="#0d0a08">
      <div className="absolute inset-0 grid place-items-center">
        <p className="text-[clamp(56px,7vw,120px)] italic text-white/15" style={{ fontFamily: SERIF }}>
          tile by tile
        </p>
      </div>
      <div className="absolute inset-x-[6%] inset-y-[7%]" style={{ perspective: "1300px" }}>
        <div className="relative h-full w-full" style={{ transformStyle: "preserve-3d" }}>
          {Array.from({ length: M509_C * M509_R }, (_, k) => {
            const c = k % M509_C;
            const rr = Math.floor(k / M509_C);
            return (
              <div
                key={k}
                className="m509-t absolute will-change-transform"
                style={{
                  left: `${(c * 100) / M509_C}%`,
                  top: `${(rr * 100) / M509_R}%`,
                  width: `${100 / M509_C}%`,
                  height: `${100 / M509_R}%`,
                  backgroundImage: bgUrl(src),
                  backgroundSize: `${M509_C * 100}% ${M509_R * 100}%`,
                  backgroundPosition: `${(c / (M509_C - 1)) * 100}% ${(rr / (M509_R - 1)) * 100}%`,
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,.07)",
                }}
              />
            );
          })}
        </div>
        <div className="pointer-events-none absolute bottom-[8%] left-[4%]" style={{ transform: "translateZ(1px)" }}>
          <div className="overflow-hidden">
            <p className="m509-cap text-[13px] uppercase tracking-[0.24em] text-white/80">Terracotta studio · new season</p>
          </div>
          <div className="overflow-hidden">
            <h3 className="m509-cap mt-1 text-[clamp(44px,5.4vw,86px)] font-[700] leading-[1]" style={{ fontFamily: GROTESK }}>
              Fired in pieces
            </h3>
          </div>
        </div>
      </div>
      <Sheen g1="rgba(255,190,120,.45)" />
    </Stage>
  );
}

/* ---------- M510 · Pieces fly out and reassemble the next image ---------- */
const M510_C = 9;
const M510_R = 5;
const M510_S = [
  { t: "Desert Bloom", s: "Glazed vases · ₹ 3,800" },
  { t: "Night Market", s: "Brass lanterns · ₹ 5,450" },
  { t: "Salt Flats", s: "Stoneware set · ₹ 7,200" },
];
function M510() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const sub = useRef<HTMLParagraphElement>(null);
  const real = useRef({ x: 0, y: 0, at: -1e9 });
  const srcs = [1, 3, 2].map((i) => scene(i, 1600, 820));
  usePlay(root, (el, q) => {
    const wraps = q(".m510-w");
    const pieces = q(".m510-p");
    const r = gsap.utils.random;
    const k = { cur: 0 };
    const show = (i: number) => {
      pieces.forEach((p) => (p.style.backgroundImage = bgUrl(srcs[i])));
      if (title.current) title.current.textContent = M510_S[i].t;
      if (sub.current) sub.current.textContent = M510_S[i].s;
      gsap.fromTo([title.current, sub.current], { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.06, ease: "power3.out", overwrite: true });
    };
    const tl = gsap.timeline({ repeat: -1, repeatRefresh: true });
    for (let s = 0; s < 3; s++) {
      tl.to(pieces, { x: () => r(-520, 520), y: () => r(-320, 320), z: () => r(-300, 700), rotationX: () => r(-110, 110), rotationY: () => r(-110, 110), rotationZ: () => r(-45, 45), opacity: 0, duration: 0.7, ease: "power3.in", stagger: { amount: 0.25, from: "random" } }, "+=0.15")
        .call(() => {
          k.cur = (k.cur + 1) % 3;
          show(k.cur);
        })
        .fromTo(
          pieces,
          { x: () => r(-520, 520), y: () => r(-320, 320), z: () => r(-600, 500), rotationX: () => r(-110, 110), rotationY: () => r(-110, 110), rotationZ: () => r(-45, 45), opacity: 0 },
          { x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, rotationZ: 0, opacity: 1, duration: 0.95, ease: "power3.out", stagger: { amount: 0.3, from: "random" } },
        );
    }
    // pointer tilt: every piece's wrapper leans with the (fake or real) pointer, by a slightly different amount
    const factor = wraps.map(() => r(0.6, 1.4));
    const rx = wraps.map((w) => gsap.quickTo(w, "rotationX", { duration: 0.6, ease: "power3.out" }));
    const ry = wraps.map((w) => gsap.quickTo(w, "rotationY", { duration: 0.6, ease: "power3.out" }));
    const onMove = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      real.current = { x: e.clientX - b.left, y: e.clientY - b.top, at: performance.now() };
    };
    el.addEventListener("pointermove", onMove);
    const loop = frameLoop((_dt, t) => {
      const b = el.getBoundingClientRect();
      const useReal = performance.now() - real.current.at < 2500;
      const px = useReal ? real.current.x : b.width * (0.5 + 0.32 * Math.sin(t * 1.3));
      const py = useReal ? real.current.y : b.height * (0.5 + 0.28 * Math.sin(t * 2.1 + 0.6));
      gsap.set(dot.current, { x: px, y: py, opacity: useReal ? 0 : 1 });
      const nx = px / b.width - 0.5;
      const ny = py / b.height - 0.5;
      wraps.forEach((_, i) => {
        rx[i](-ny * 22 * factor[i]);
        ry[i](nx * 26 * factor[i]);
      });
    });
    return [tl, loop];
  });
  return (
    <Stage r={root} g1="rgba(150,120,255,.5)" g2="rgba(255,140,90,.22)" bg="#0a0a14">
      <div className="absolute inset-x-[6%] inset-y-[8%]" style={{ perspective: "1400px" }}>
        <div className="relative h-full w-full" style={{ transformStyle: "preserve-3d" }}>
          {Array.from({ length: M510_C * M510_R }, (_, n) => {
            const c = n % M510_C;
            const rr = Math.floor(n / M510_C);
            return (
              <div key={n} className="m510-w absolute" style={{ left: `${(c * 100) / M510_C}%`, top: `${(rr * 100) / M510_R}%`, width: `${100 / M510_C}%`, height: `${100 / M510_R}%`, transformStyle: "preserve-3d" }}>
                <div
                  className="m510-p absolute inset-[1px] rounded-[3px] will-change-transform"
                  style={{
                    backgroundImage: bgUrl(srcs[0]),
                    backgroundSize: `${M510_C * 100}% ${M510_R * 100}%`,
                    backgroundPosition: `${(c / (M510_C - 1)) * 100}% ${(rr / (M510_R - 1)) * 100}%`,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-[11%] left-[8%] z-20">
        <h3 ref={title} className="text-[clamp(44px,5.2vw,84px)] leading-[0.95]" style={{ fontFamily: EDITORIAL }}>
          {M510_S[0].t}
        </h3>
        <p ref={sub} className="mt-2 text-[16px] text-white/80">
          {M510_S[0].s}
        </p>
      </div>
      <Sheen g1="rgba(170,140,255,.45)" />
      <Dot r={dot} />
    </Stage>
  );
}

/* ---------- M511 · Noise burn image change (WebGL, variant of M66) ---------- */
const M511_FRAG = /* glsl */ `
uniform float uA, uB;
vec3 pick(float i, vec2 uv) {
  if (i < 0.5) return texture2D(uTex0, cover(uv, uTexRes0)).rgb;
  if (i < 1.5) return texture2D(uTex1, cover(uv, uTexRes1)).rgb;
  return texture2D(uTex2, cover(uv, uTexRes2)).rgb;
}
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), u.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int k = 0; k < 5; k++) { v += a * vnoise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}
void main() {
  vec2 asp = vec2(uRes.x / uRes.y, 1.0);
  float n = fbm(vUv * asp * 2.6 + vec2(uTime * 0.12, -uTime * 0.18));   // drifting shreds
  n = n * 0.8 + (1.0 - vUv.y) * 0.1 + vUv.x * 0.1;
  float p = mix(-0.1, 1.1, uProgress);
  float d = n - p;                                   // < 0: already burnt through -> the incoming photo
  vec2 drift = (vUv - 0.5) * (1.0 - 0.025 * sin(uTime * 0.5)) + 0.5;
  vec3 a = pick(uA, drift);
  vec3 b = pick(uB, drift);
  float burnt = smoothstep(0.004, -0.004, d);
  float scorch = smoothstep(0.09, 0.0, d) * step(0.0, d);
  a *= 1.0 - scorch * 0.75;
  vec3 col = mix(a, b, burnt);
  float edge = exp(-d * d * 2600.0);
  float ember = smoothstep(0.035, 0.0, abs(d));
  vec3 fire = mix(vec3(1.0, 0.28, 0.04), vec3(1.0, 0.88, 0.5), edge);
  col += fire * (ember * 0.9 + edge * 0.8);
  gl_FragColor = vec4(col, 1.0);
}`;
const M511_S = [
  { t: "Charcoal & Cedar", s: "Smoked candles · ₹ 1,650" },
  { t: "Amber Hour", s: "Resin incense · ₹ 940" },
  { t: "Ash Garden", s: "Stone diffusers · ₹ 2,300" },
];
function M511() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const sub = useRef<HTMLParagraphElement>(null);
  const st = useRef({ p: 0, a: 0, b: 1 });
  const srcs = [3, 1, 2].map((i) => scene(i, 1600, 900));
  useNear(root, () => {
    let dead = false;
    let h: GLHandle | null = null;
    (async () => {
      const tex = await Promise.all(srcs.map((s) => toCanvas(s, 1024, 576)));
      if (dead || !canvas.current) return;
      h = await createShader(canvas.current, M511_FRAG, {
        dpr: 1,
        textures: tex,
        uniforms: { uA: { value: 0 }, uB: { value: 1 } },
        onFrame: (u) => {
          u.uProgress.value = st.current.p;
          u.uA.value = st.current.a;
          u.uB.value = st.current.b;
        },
      });
      if (dead) h?.destroy();
    })();
    return () => {
      dead = true;
      h?.destroy();
    };
  });
  usePlay(root, () => {
    const s = st.current;
    const text = () => {
      const n = M511_S[s.b];
      if (title.current) title.current.textContent = n.t;
      if (sub.current) sub.current.textContent = n.s;
      gsap.fromTo([title.current, sub.current], { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.06, ease: "power3.out", overwrite: true });
    };
    return gsap
      .timeline({
        repeat: -1,
        onRepeat: () => {
          s.a = s.b;
          s.b = (s.b + 1) % 3;
          s.p = 0;
        },
      })
      .fromTo(s, { p: 0 }, { p: 1, duration: 1.2, ease: "sine.inOut" }, 0)
      .call(text, [], 0.6)
      .to({}, { duration: 0.25 });
  });
  return (
    <Stage r={root} g1="rgba(255,120,40,.45)" g2="rgba(255,200,120,.2)" bg="#0d0806">
      <div className="absolute inset-[3%] overflow-hidden rounded-[22px] bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={srcs[0]} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        <canvas ref={canvas} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-300" aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="pointer-events-none absolute bottom-[9%] left-[5%]">
          <p className="text-[13px] uppercase tracking-[0.24em] text-white/70">Kiln &amp; Wick · auto-cycles</p>
          <h3 ref={title} className="mt-2 text-[clamp(44px,5.4vw,88px)] leading-[0.95]" style={{ fontFamily: SERIF }}>
            {M511_S[0].t}
          </h3>
          <p ref={sub} className="mt-2 text-[16px] text-white/80">
            {M511_S[0].s}
          </p>
        </div>
      </div>
      <Sheen g1="rgba(255,140,60,.45)" />
    </Stage>
  );
}

/* ---------- M512 · Paper curl slide change (WebGL, variant of M2) ---------- */
const M512_FRAG = /* glsl */ `
uniform float uA, uB;
#define PI 3.14159265
float asp;
vec3 pick(float i, vec2 uv) {
  if (i < 0.5) return texture2D(uTex0, cover(uv, uTexRes0)).rgb;
  if (i < 1.5) return texture2D(uTex1, cover(uv, uTexRes1)).rgb;
  return texture2D(uTex2, cover(uv, uTexRes2)).rgb;
}
bool inPage(vec2 P) { vec2 uv = P / vec2(asp, 1.0); return uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0; }
vec3 texA(vec2 P) { return pick(uA, P / vec2(asp, 1.0)); }
vec3 paperBack(vec2 P) { return mix(texA(P), vec3(0.95, 0.93, 0.89), 0.82); }
void main() {
  asp = uRes.x / uRes.y;
  vec2 P = vec2(vUv.x * asp, vUv.y);
  vec2 dir = normalize(vec2(1.0, 0.38));            // the page rolls up from the right-hand corner toward the left
  float R = 0.13;                                     // cylinder radius
  float xmax = asp * dir.x + dir.y;
  float a = mix(xmax + 0.02, -R - 0.03, uProgress);   // curl axis position along dir
  float x = dot(P, dir);
  vec3 B = pick(uB, vUv);
  vec3 col;
  if (x < a) {
    // flat part of the page; the rolled-over back of the paper may lie on top of it
    vec2 Q = P + dir * (PI * R + 2.0 * (a - x));
    if (inPage(Q)) col = paperBack(Q) * (0.8 + 0.2 * smoothstep(0.0, 0.3, a - x));
    else col = texA(P) * (1.0 - 0.3 * exp(-(a - x) * 30.0));
  } else if (x <= a + R) {
    float th = asin(clamp((x - a) / R, 0.0, 1.0));
    vec2 Q2 = P + dir * (a + R * (PI - th) - x);      // upper half of the cylinder: back of the paper
    vec2 Q1 = P + dir * (a + R * th - x);             // lower half: the front, curling up
    if (inPage(Q2)) col = paperBack(Q2) * (0.45 + 0.6 * cos(th));
    else if (inPage(Q1)) col = texA(Q1) * (0.4 + 0.6 * cos(th));
    else col = B * 0.55;
  } else {
    col = B * (1.0 - 0.55 * exp(-(x - a - R) * 16.0));  // shadow cast by the roll onto the next slide
  }
  gl_FragColor = vec4(col, 1.0);
}`;
const M512_S = [
  { t: "Paper Season", s: "Letterpress notebooks · ₹ 1,200" },
  { t: "Ink & Fold", s: "Origami desk kits · ₹ 860" },
  { t: "Rough Cut", s: "Deckle-edge cards · ₹ 540" },
];
function M512() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const sub = useRef<HTMLParagraphElement>(null);
  const st = useRef({ p: 0, a: 0, b: 1 });
  const srcs = [0, 2, 3].map((i) => scene(i, 1600, 900));
  useNear(root, () => {
    let dead = false;
    let h: GLHandle | null = null;
    (async () => {
      const tex = await Promise.all(srcs.map((s) => toCanvas(s, 1024, 576)));
      if (dead || !canvas.current) return;
      h = await createShader(canvas.current, M512_FRAG, {
        dpr: 1,
        textures: tex,
        uniforms: { uA: { value: 0 }, uB: { value: 1 } },
        onFrame: (u) => {
          u.uProgress.value = st.current.p;
          u.uA.value = st.current.a;
          u.uB.value = st.current.b;
        },
      });
      if (dead) h?.destroy();
    })();
    return () => {
      dead = true;
      h?.destroy();
    };
  });
  usePlay(root, () => {
    const s = st.current;
    const text = () => {
      const n = M512_S[s.b];
      if (title.current) title.current.textContent = n.t;
      if (sub.current) sub.current.textContent = n.s;
      gsap.fromTo([title.current, sub.current], { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.55, stagger: 0.06, ease: "power3.out", overwrite: true });
    };
    return gsap
      .timeline({
        repeat: -1,
        onRepeat: () => {
          s.a = s.b;
          s.b = (s.b + 1) % 3;
          s.p = 0;
        },
      })
      .fromTo(s, { p: 0 }, { p: 1, duration: 1.05, ease: "power2.inOut" }, 0)
      .call(text, [], 0.55)
      .to({}, { duration: 0.2 });
  });
  return (
    <Stage r={root} g1="rgba(255,230,190,.42)" g2="rgba(79,141,255,.22)" bg="#0d0c0a">
      <div className="absolute inset-[3%] overflow-hidden rounded-[22px] bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={srcs[0]} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        <canvas ref={canvas} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-300" aria-hidden />
        <div className="pointer-events-none absolute bottom-[9%] left-[5%]">
          <p className="text-[13px] uppercase tracking-[0.24em] text-white/75">Folio Press · page turn</p>
          <h3 ref={title} className="mt-2 text-[clamp(44px,5.4vw,88px)] leading-[0.95] [text-shadow:0_4px_30px_rgba(0,0,0,.45)]" style={{ fontFamily: EDITORIAL }}>
            {M512_S[0].t}
          </h3>
          <p ref={sub} className="mt-2 text-[16px] text-white/85">
            {M512_S[0].s}
          </p>
        </div>
      </div>
      <Sheen g1="rgba(255,235,200,.45)" />
    </Stage>
  );
}

/* ---------- M513 · Coverflow carousel (variant of M33) ---------- */
const M513_S = [
  { t: "Coastline", p: "₹ 2,900", i: 0 },
  { t: "Saffron Sun", p: "₹ 3,400", i: 1 },
  { t: "Fern Room", p: "₹ 2,150", i: 2 },
  { t: "Copper Dusk", p: "₹ 4,600", i: 3 },
  { t: "Blue Mill", p: "₹ 1,980", i: 0 },
  { t: "Rose Kiln", p: "₹ 3,750", i: 1 },
  { t: "Moss Path", p: "₹ 2,640", i: 2 },
];
const M513_N = M513_S.length;
const m513Pose = (off: number) => {
  const a = Math.abs(off);
  const s = Math.sign(off);
  return {
    xPercent: off === 0 ? 0 : s * (64 + (a - 1) * 36),
    z: off === 0 ? 60 : -200,
    rotationY: off === 0 ? 0 : -s * 58,
    opacity: a >= 3 ? 0 : 1,
    zIndex: 10 - a,
  };
};
const m513Off = (i: number, k: number) => ((i - k + M513_N + 3) % M513_N) - 3;
const m513Css = (off: number): CSSProperties => {
  const p = m513Pose(off);
  return { transform: `translateX(${p.xPercent}%) translateZ(${p.z}px) rotateY(${p.rotationY}deg)`, opacity: p.opacity, zIndex: p.zIndex };
};
function M513() {
  const root = useRef<HTMLDivElement>(null);
  const cap = useRef<HTMLParagraphElement>(null);
  const price = useRef<HTMLParagraphElement>(null);
  usePlay(root, (_el, q) => {
    const cards = q(".m513-card");
    cards.forEach((c, i) => gsap.set(c, { x: 0, ...m513Pose(m513Off(i, 0)) }));
    const tl = gsap.timeline({ repeat: -1, defaults: { ease: "power2.inOut", immediateRender: false } });
    for (let step = 1; step <= M513_N; step++) {
      const k = step % M513_N;
      const prev = (step - 1) % M513_N;
      const at = (step - 1) * 1.0 + 0.1;
      cards.forEach((c, i) => {
        const from = m513Off(i, prev);
        const to = m513Off(i, k);
        if (Math.abs(to - from) > 1) tl.set(c, m513Pose(to), at);
        else tl.fromTo(c, m513Pose(from), { ...m513Pose(to), duration: 0.8 }, at);
      });
      tl.call(
        () => {
          if (cap.current) cap.current.textContent = M513_S[k].t;
          if (price.current) price.current.textContent = M513_S[k].p;
          gsap.fromTo([cap.current, price.current], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.05, ease: "power3.out", overwrite: true });
        },
        [],
        at + 0.35,
      );
    }
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(79,141,255,.45)" g2="rgba(255,150,200,.2)" bg="#07090f">
      <div className="absolute inset-x-0 top-[7%] h-[56%]" style={{ perspective: "1300px" }}>
        {M513_S.map((s, i) => (
          <div key={i} className="m513-card absolute left-1/2 top-0 -ml-[11%] h-full w-[22%] overflow-hidden rounded-[10px] shadow-[0_18px_36px_rgba(0,0,0,.5)] will-change-transform" style={m513Css(m513Off(i, 0))}>
            <Img i={s.i} w={600} h={800} />
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-black/25" />
          </div>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-[7%] text-center">
        <p className="text-[13px] uppercase tracking-[0.28em] text-white/55">Vinyl editions · record shop</p>
        <p ref={cap} className="mt-2 text-[clamp(32px,3.4vw,54px)] font-[700] leading-none" style={{ fontFamily: GROTESK }}>
          {M513_S[0].t}
        </p>
        <p ref={price} className="mt-2 text-[16px] text-white/75">
          {M513_S[0].p}
        </p>
      </div>
    </Stage>
  );
}

/* ---------- M514 · Throwable 3D ring with lean (variant of M33) ---------- */
const M514_N = 10;
const M514_RAD = 400;
const M514_T = ["Cold Brew", "Oat Latte", "Mocha", "Flat White", "Cortado", "Affogato", "Chai", "Nitro", "Espresso", "Matcha"];
function M514() {
  const root = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const ctl = useRef<{ down: (x: number) => void; move: (x: number) => void; up: () => void }>({ down: () => {}, move: () => {}, up: () => {} });
  usePlay(
    root,
    (el, q, onClean) => {
      const leans = q(".m514-lean");
      const shades = q(".m514-sh");
      const proxy = { rot: 0 };
      let idle = 0;
      let last = 0;
      let vel = 0;
      let lean = 0;
      const drag = { on: false, x: 0, t: 0, v: 0 };
      const loop = frameLoop((dt) => {
        if (!drag.on) idle += 7 * dt;
        const total = proxy.rot + idle;
        const v = dt > 0 ? (total - last) / dt : 0;
        last = total;
        vel += (v - vel) * 0.18;
        lean += (gsap.utils.clamp(-16, 16, vel * 0.05) - lean) * 0.12;
        gsap.set(ring.current, { rotationX: -9, rotationY: total });
        leans.forEach((l) => gsap.set(l, { rotationZ: lean, skewX: -lean * 0.35 }));
        for (let i = 0; i < M514_N; i++) {
          const ang = ((i * 360) / M514_N + total) * (Math.PI / 180);
          shades[i].style.opacity = String(0.62 * (1 - (Math.cos(ang) + 1) / 2));
        }
      });
      // scripted throws: the fake pointer grabs, flicks, lets go; inertia carries the ring and the lean relaxes
      const w = () => el.getBoundingClientRect().width;
      const h = () => el.getBoundingClientRect().height;
      const throwOnce = (dir: number) =>
        gsap
          .timeline()
          .set(dot.current, { x: w() * (dir > 0 ? 0.36 : 0.64), y: h() * 0.55 })
          .to(dot.current, { opacity: 1, scale: 0.8, duration: 0.15 })
          .to(dot.current, { x: `+=${dir * w() * 0.22}`, duration: 0.42, ease: "power2.in" }, ">")
          .to(proxy, { rot: `+=${dir * 70}`, duration: 0.42, ease: "power2.in", overwrite: "auto" }, "<")
          .call(() => {
            gsap.to(proxy, { inertia: { rot: { velocity: dir * 420 }, resistance: 240 }, overwrite: "auto" });
          })
          .to(dot.current, { opacity: 0, scale: 1, duration: 0.25 });
      const tl = gsap
        .timeline({ repeat: -1 })
        .add(() => {
          throwOnce(1);
        }, 0.1)
        .add(() => {
          throwOnce(-1);
        }, 2.4)
        .to({}, { duration: 0.1 }, 4.7);
      let resume: gsap.core.Tween | null = null;
      ctl.current = {
        down: (x) => {
          drag.on = true;
          drag.x = x;
          drag.t = performance.now();
          drag.v = 0;
          tl.pause();
          resume?.kill();
          gsap.killTweensOf(proxy);
          gsap.to(dot.current, { opacity: 0, duration: 0.15 });
        },
        move: (x) => {
          if (!drag.on) return;
          const now = performance.now();
          const d = (x - drag.x) * 0.3;
          proxy.rot += d;
          drag.v = drag.v * 0.6 + (d / Math.max(1, now - drag.t)) * 1000 * 0.4;
          drag.x = x;
          drag.t = now;
        },
        up: () => {
          if (!drag.on) return;
          drag.on = false;
          gsap.to(proxy, { inertia: { rot: { velocity: drag.v }, resistance: 240 } });
          resume = gsap.delayedCall(3, () => tl.play());
        },
      };
      onClean(() => resume?.kill());
      return [loop, tl];
    },
    () => loadPlugin("InertiaPlugin"),
  );
  return (
    <Stage r={root} g1="rgba(255,170,90,.5)" g2="rgba(120,90,255,.22)" bg="#0c0907">
      <div
        className="absolute inset-0 cursor-grab touch-none select-none active:cursor-grabbing"
        style={{ perspective: "1500px" }}
        onPointerDown={(e) => ctl.current.down(e.clientX)}
        onPointerMove={(e) => ctl.current.move(e.clientX)}
        onPointerUp={() => ctl.current.up()}
        onPointerLeave={() => ctl.current.up()}
      >
        <div ref={ring} className="absolute left-1/2 top-[46%] h-0 w-0" style={{ transformStyle: "preserve-3d", transform: "rotateX(-9deg)" }}>
          {M514_T.map((t, i) => (
            <div key={i} className="absolute -ml-[90px] -mt-[125px] h-[250px] w-[180px]" style={{ transform: `rotateY(${(i * 360) / M514_N}deg) translateZ(${M514_RAD}px)`, transformStyle: "preserve-3d" }}>
              <div className="m514-lean relative h-full w-full overflow-hidden rounded-[16px] border border-white/15 bg-[#14100c]" style={{ transformOrigin: "50% 100%" }}>
                <Img i={i % 4} w={360} h={500} />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <p className="text-[15px] font-[650]" style={{ fontFamily: MANROPE }}>
                    {t}
                  </p>
                  <p className="text-[12px] text-white/70">₹ {180 + i * 20}</p>
                </div>
                <div className="m514-sh absolute inset-0 bg-black" style={{ opacity: 0 }} />
              </div>
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-[6%] text-center">
          <p className="text-[13px] uppercase tracking-[0.26em] text-white/60">Twelve brews · throw the ring</p>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

/* ---------- M515 · Inside-cylinder carousel (variant of M33) ---------- */
const M515_N = 14;
const M515_STEP = 360 / M515_N;
const M515_RAD = 640;
const M515_S = ["Monsoon", "Dune", "Harbour", "Orchard", "Basalt", "Lagoon", "Cinder"];
function M515() {
  const root = useRef<HTMLDivElement>(null);
  const cyl = useRef<HTMLDivElement>(null);
  const cap = useRef<HTMLParagraphElement>(null);
  const ctl = useRef<{ down: (x: number) => void; move: (x: number) => void; up: () => void }>({ down: () => {}, move: () => {}, up: () => {} });
  usePlay(root, (_el, q) => {
    const cards = q(".m515-c");
    const st = { rot: 0 };
    let shown = -1;
    const apply = () => {
      gsap.set(cyl.current, { rotationY: st.rot });
      cards.forEach((c, i) => {
        let a = (((i * M515_STEP + st.rot) % 360) + 540) % 360 - 180;
        a = Math.abs(a);
        c.style.opacity = String(clamp01((96 - a) / 14));
        c.style.visibility = a > 98 ? "hidden" : "visible";
      });
      const front = ((Math.round(-st.rot / M515_STEP) % M515_N) + M515_N) % M515_N;
      if (front !== shown) {
        shown = front;
        if (cap.current) cap.current.textContent = `${M515_S[front % M515_S.length]} · ₹ ${(2400 + front * 150).toLocaleString("en-IN")}`;
      }
    };
    apply();
    const tl = gsap
      .timeline({ repeat: -1, onUpdate: apply })
      .to(st, { rot: `-=${M515_STEP}`, duration: 1.15, ease: "elastic.out(1, 0.55)" })
      .to(st, { rot: `-=${M515_STEP}`, duration: 1.15, ease: "elastic.out(1, 0.55)" })
      .to(st, { rot: `-=${M515_STEP * 2}`, duration: 1.3, ease: "elastic.out(1, 0.6)" })
      .to(st, { rot: `+=${M515_STEP * 2}`, duration: 1.3, ease: "elastic.out(1, 0.6)" })
      .to(st, { rot: `+=${M515_STEP * 2}`, duration: 1.3, ease: "elastic.out(1, 0.6)" });
    const drag = { on: false, x: 0 };
    let settle: gsap.core.Tween | null = null;
    ctl.current = {
      down: (x) => {
        drag.on = true;
        drag.x = x;
        tl.pause();
        settle?.kill();
      },
      move: (x) => {
        if (!drag.on) return;
        st.rot += (x - drag.x) * 0.09;
        drag.x = x;
        apply();
      },
      up: () => {
        if (!drag.on) return;
        drag.on = false;
        settle = gsap.to(st, {
          rot: Math.round(st.rot / M515_STEP) * M515_STEP,
          duration: 1.1,
          ease: "elastic.out(1, 0.55)",
          onUpdate: apply,
          onComplete: () => {
            tl.invalidate().restart();
          },
        });
      },
    };
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(90,220,200,.45)" g2="rgba(79,141,255,.25)" bg="#060c0e">
      <div
        className="absolute inset-0 cursor-grab touch-none select-none"
        style={{ perspective: "900px" }}
        onPointerDown={(e) => ctl.current.down(e.clientX)}
        onPointerMove={(e) => ctl.current.move(e.clientX)}
        onPointerUp={() => ctl.current.up()}
        onPointerLeave={() => ctl.current.up()}
      >
        <div className="absolute left-1/2 top-[44%] h-0 w-0" style={{ transformStyle: "preserve-3d", transform: `translateZ(${M515_RAD - 500}px)` }}>
          <div ref={cyl} className="absolute h-0 w-0" style={{ transformStyle: "preserve-3d" }}>
            {Array.from({ length: M515_N }, (_, i) => {
              const a = Math.abs(((((i * M515_STEP) % 360) + 540) % 360) - 180);
              return (
                <div
                  key={i}
                  className="m515-c absolute -ml-[120px] -mt-[160px] h-[320px] w-[240px] overflow-hidden rounded-[14px] border border-white/10"
                  style={{ transform: `rotateY(${i * M515_STEP}deg) translateZ(${-M515_RAD}px)`, opacity: clamp01((96 - a) / 14), visibility: a > 98 ? "hidden" : "visible" }}
                >
                  <Img i={i % 4} w={480} h={640} />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3">
                    <p className="text-[14px] font-[650]" style={{ fontFamily: GROTESK }}>
                      {M515_S[i % M515_S.length]}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-[6%] text-center">
          <p className="text-[13px] uppercase tracking-[0.26em] text-white/60">Rug atlas · drag to turn</p>
          <p ref={cap} className="mt-2 text-[clamp(26px,2.6vw,40px)] leading-none" style={{ fontFamily: EDITORIAL }}>
            Monsoon · ₹ 2,400
          </p>
        </div>
      </div>
      <Sheen g1="rgba(110,230,210,.45)" />
    </Stage>
  );
}

/* ---------- M516 · 3D box turn to next face (variant of M2) — Y axis + X axis ---------- */
const M516_F = [
  { t: "Spring", p: "₹ 1,450", i: 2 },
  { t: "Summer", p: "₹ 1,690", i: 1 },
  { t: "Monsoon", p: "₹ 1,520", i: 0 },
  { t: "Winter", p: "₹ 1,880", i: 3 },
];
function M516Box({ axis }: { axis: "Y" | "X" }) {
  const half = axis === "Y" ? "calc(var(--w) / 2)" : "calc(var(--h) / 2)";
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative [--w:min(30vw,410px)] [--h:calc(var(--w)*0.68)]" style={{ width: "var(--w)", height: "var(--h)", perspective: "1400px" }}>
        <div className="absolute inset-0" style={{ transformStyle: "preserve-3d", transform: `translateZ(calc(${half} * -1))` }}>
          <div className={`m516-box m516-${axis} absolute inset-0`} style={{ transformStyle: "preserve-3d" }}>
            {M516_F.map((f, k) => (
              <div
                key={k}
                className="absolute inset-0 overflow-hidden rounded-[6px] [backface-visibility:hidden]"
                style={{ transform: `rotate${axis}(${k * 90}deg) translateZ(${half})` }}
              >
                <Img i={f.i} w={820} h={560} />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-10">
                  <span className="text-[22px] font-[700]" style={{ fontFamily: WIDE }}>
                    {f.t}
                  </span>
                  <span className="text-[14px] text-white/80">{f.p}</span>
                </div>
                <div className={`m516-sh-${axis} absolute inset-0 bg-black`} style={{ opacity: k === 0 ? 0 : 0.75 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="text-[13px] uppercase tracking-[0.24em] text-white/60">{axis === "Y" ? "Y axis · turns sideways" : "X axis · tumbles forward"}</p>
    </div>
  );
}
function M516() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (_el, q) => {
    const make = (axis: "Y" | "X", delay: number) => {
      const box = q(`.m516-${axis}`)[0];
      const sh = q(`.m516-sh-${axis}`);
      const prop = axis === "Y" ? "rotationY" : "rotationX";
      const st = { r: 0 };
      const apply = () => {
        gsap.set(box, { [prop]: st.r });
        sh.forEach((s, k) => {
          const f = Math.cos(((st.r + k * 90) * Math.PI) / 180);
          s.style.opacity = String((1 - Math.max(0, f)) * 0.75);
        });
      };
      const tl = gsap.timeline({ repeat: -1, delay, onUpdate: apply });
      for (let k = 1; k <= 4; k++) tl.to(st, { r: -90 * k, duration: 0.8, ease: "power2.out" }).to({}, { duration: 0.18 });
      apply();
      return tl;
    };
    return [make("Y", 0), make("X", 0.5)];
  });
  return (
    <Stage r={root} g1="rgba(255,190,110,.48)" g2="rgba(79,141,255,.25)">
      <div className="absolute inset-0 flex items-center justify-center gap-[7%]">
        <M516Box axis="Y" />
        <M516Box axis="X" />
      </div>
      <p className="pointer-events-none absolute left-1/2 top-[6%] -translate-x-1/2 text-[13px] uppercase tracking-[0.26em] text-white/55" style={{ fontFamily: GROTESK }}>
        Four seasons tea · one box
      </p>
    </Stage>
  );
}

/* ---------- M517 · Snap product wheel (variant of M33) ---------- */
const M517_N = 24;
const M517_STEP = 360 / M517_N;
const M517_RAD = 880;
const M517_P = [
  { t: "Lime Spark", p: "₹ 120", c: "#7ad35a" },
  { t: "Berry Fizz", p: "₹ 140", c: "#e0457b" },
  { t: "Mango Haze", p: "₹ 130", c: "#f2a33a" },
  { t: "Blue Tonic", p: "₹ 150", c: "#4f8dff" },
  { t: "Ginger Kick", p: "₹ 125", c: "#d4a24c" },
  { t: "Grape Mist", p: "₹ 145", c: "#8a5cf6" },
];
function M517() {
  const root = useRef<HTMLDivElement>(null);
  const wheel = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const name = useRef<HTMLParagraphElement>(null);
  const price = useRef<HTMLParagraphElement>(null);
  const ctl = useRef<{ down: (x: number) => void; move: (x: number) => void; up: () => void }>({ down: () => {}, move: () => {}, up: () => {} });
  usePlay(
    root,
    (el, q, onClean) => {
      const cards = q(".m517-card");
      const w = wheel.current!;
      const snap = (v: number) => Math.round(v / M517_STEP) * M517_STEP;
      let top = 0;
      const watch = frameLoop(() => {
        const rot = Number(gsap.getProperty(w, "rotation")) || 0;
        const k = ((Math.round(-rot / M517_STEP) % M517_N) + M517_N) % M517_N;
        if (k === top) return;
        cards[top].removeAttribute("data-on");
        cards[k].setAttribute("data-on", "");
        top = k;
        const p = M517_P[k % M517_P.length];
        if (name.current) name.current.textContent = p.t;
        if (price.current) price.current.textContent = p.p;
        gsap.fromTo([name.current, price.current], { opacity: 0.2, y: 10 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, ease: "power2.out", overwrite: true });
      });
      const idleStep = () => gsap.to(w, { rotation: snap(Number(gsap.getProperty(w, "rotation"))) - M517_STEP, duration: 1.05, ease: "power2.inOut", overwrite: "auto" });
      const flick = () => {
        const b = el.getBoundingClientRect();
        gsap
          .timeline()
          .set(dot.current, { x: b.width * 0.64, y: b.height * 0.42 })
          .to(dot.current, { opacity: 1, scale: 0.8, duration: 0.12 })
          .to(dot.current, { x: b.width * 0.4, duration: 0.34, ease: "power2.in" }, ">")
          .to(w, { rotation: "-=9", duration: 0.34, ease: "power2.in", overwrite: "auto" }, "<")
          .call(() => {
            gsap.to(w, { inertia: { rotation: { velocity: -150, end: snap }, duration: { min: 0.9, max: 1.3 } }, overwrite: "auto" });
          })
          .to(dot.current, { opacity: 0, scale: 1, duration: 0.25 });
      };
      const tl = gsap
        .timeline({ repeat: -1 })
        .add(() => {
          idleStep();
        }, 0)
        .add(() => {
          idleStep();
        }, 1.15)
        .add(() => {
          flick();
        }, 2.3)
        .to({}, { duration: 0.1 }, 4.0);
      const drag = { on: false, x: 0, t: 0, v: 0 };
      let resume: gsap.core.Tween | null = null;
      ctl.current = {
        down: (x) => {
          drag.on = true;
          drag.x = x;
          drag.t = performance.now();
          drag.v = 0;
          tl.pause();
          resume?.kill();
          gsap.killTweensOf(w);
        },
        move: (x) => {
          if (!drag.on) return;
          const now = performance.now();
          const d = (x - drag.x) * 0.06;
          gsap.set(w, { rotation: `+=${d}` });
          drag.v = drag.v * 0.6 + (d / Math.max(1, now - drag.t)) * 1000 * 0.4;
          drag.x = x;
          drag.t = now;
        },
        up: () => {
          if (!drag.on) return;
          drag.on = false;
          gsap.to(w, { inertia: { rotation: { velocity: drag.v, end: snap } } });
          resume = gsap.delayedCall(3, () => tl.restart());
        },
      };
      onClean(() => resume?.kill());
      return [watch, tl];
    },
    () => loadPlugin("InertiaPlugin"),
  );
  return (
    <Stage r={root} g1="rgba(255,190,110,.5)" g2="rgba(79,141,255,.25)" bg="#0c0a10">
      <div
        className="absolute inset-0 cursor-grab touch-none select-none"
        onPointerDown={(e) => ctl.current.down(e.clientX)}
        onPointerMove={(e) => ctl.current.move(e.clientX)}
        onPointerUp={() => ctl.current.up()}
        onPointerLeave={() => ctl.current.up()}
      >
        {/* the wheel's centre sits far below the stage; only its top arc shows */}
        <div className="absolute left-1/2 h-0 w-0" style={{ top: `calc(30% + ${M517_RAD}px)` }}>
          <div ref={wheel} className="absolute h-0 w-0">
            <div className="absolute rounded-full border border-white/10" style={{ left: -M517_RAD, top: -M517_RAD, width: M517_RAD * 2, height: M517_RAD * 2 }} />
            {Array.from({ length: M517_N }, (_, i) => {
              const p = M517_P[i % M517_P.length];
              return (
                <div key={i} className="absolute left-0 top-0" style={{ transform: `rotate(${i * M517_STEP}deg) translateY(${-M517_RAD}px)` }}>
                  <div
                    className="m517-card absolute -ml-[78px] -mt-[110px] flex h-[220px] w-[156px] flex-col items-center justify-end rounded-[20px] border border-white/12 bg-white/[0.04] pb-3"
                    data-on={i === 0 ? "" : undefined}
                  >
                    <Product angle={i % 4} accent={p.c} className="mb-2 h-[150px] w-auto" />
                    <span className="text-[13px] font-[650]" style={{ fontFamily: MANROPE }}>
                      {p.t}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="pointer-events-none absolute left-[5%] top-[8%]">
          <p className="text-[13px] uppercase tracking-[0.26em] text-white/55">Soda wheel · spin and snap</p>
          <p ref={name} className="mt-2 text-[clamp(34px,3.6vw,58px)] font-[700] leading-none" style={{ fontFamily: WIDE }}>
            {M517_P[0].t}
          </p>
          <p ref={price} className="mt-2 text-[17px] text-white/80">
            {M517_P[0].p}
          </p>
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M506", name: "Interleaved strips swap two images", how: "Auto: two photos cut into vertical strips swap by sliding odd strips up and even strips down (stagger); every other swap glitch-jitters the strips.", kind: "play", C: M506 },
  { code: "M507", name: "Sliced slide-in + scrambled label", how: "Hover (fake pointer): the image slides in from one side in horizontal slices that start randomly offset and snap into line while the label scrambles.", kind: "play", C: M507 },
  { code: "M508", name: "Prism-facet image flip", how: "Auto sweep or drag: 24 vertical prism facets turn 90° on Y one after another, like a rotating billboard, flipping photo A to photo B and back.", kind: "play", C: M508 },
  { code: "M509", name: "Diced image assembles", how: "Auto: a photo cut into a grid of tiles flies in from deep space and settles into place with a centre-out grid stagger, then lifts away and re-forms.", kind: "play", C: M509 },
  { code: "M510", name: "Pieces fly out and reassemble next image", how: "Auto: the image breaks into pieces that fly out in 3D and reassemble as the next image; every piece tilts with the pointer.", kind: "play", C: M510 },
  { code: "M511", name: "Noise burn image change", how: "Auto slider (WebGL): the next photo burns through the current one in drifting noise shreds with a glowing ember edge.", kind: "play", C: M511 },
  { code: "M512", name: "Paper curl slide change", how: "Auto slider (WebGL): the slide rolls away over a lit cylinder like a page curl, showing the paper back and a cast shadow over the next slide.", kind: "play", C: M512 },
  { code: "M513", name: "Coverflow carousel", how: "Auto-advance: the centre card faces front, its neighbours turn ±58° and stack behind it; every step slides the whole row one slot with eased rotation.", kind: "play", C: M513 },
  { code: "M514", name: "Throwable 3D ring with lean", how: "Drag / scripted throws: a 3D ring of cards spins with inertia, the cards lean into the direction of travel and relax as it slows; idles in a slow spin.", kind: "play", C: M514 },
  { code: "M515", name: "Inside-cylinder carousel", how: "Auto steps or drag: cards line the inside of a cylinder (centre far, edges loom large) and the cylinder turns with a springy settle.", kind: "play", C: M515 },
  { code: "M516", name: "3D box turn to next face", how: "Auto: photos on the faces of a CSS 3D box; the box turns 90° on Y (left) or X (right) to the next face, eased out, faces dimming by angle.", kind: "play", C: M516 },
  { code: "M517", name: "Snap product wheel", how: "Auto steps + flicks, or drag: products on a big wheel spin with inertia and snap a card to the top, which lights up and names itself.", kind: "play", C: M517 },
];
