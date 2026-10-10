"use client";

// Text motions, batch 7 · group 1 (MOTION-MENU M290–M301). Small focused demos for /lab/motion, rebuilt in GSAP / CSS / canvas
// from the idea only. Every demo: plays by itself on screen (or follows the scroll), loops, has a CSS glow loop that never
// stops, and shows a sensible final state in ?static=1 / reduced motion.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";
import { useScrub } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = { sg: "Space Grotesk Variable", fr: "Fraunces Variable", is: "Instrument Serif", sy: "Syne Variable", mr: "Manrope Variable" };
const MONO = `ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace`;
const ACC = "#ff9a5c";

const CSS = `
.b7g1-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 32% 38%,var(--g1,rgba(255,154,92,.42)),transparent 70%),radial-gradient(34% 40% at 70% 66%,var(--g2,rgba(79,141,255,.22)),transparent 70%);animation:b7g1-drift 6s linear infinite alternate;will-change:transform}
.b7g1-top{mix-blend-mode:screen;opacity:.45;z-index:5;animation-duration:5s;animation-direction:alternate-reverse}
@keyframes b7g1-drift{0%{transform:translate3d(-7%,-5%,0) scale(1)}100%{transform:translate3d(7%,6%,0) scale(1.15)}}
.b7g1-off .b7g1-css{animation-play-state:paused}
.m290-bg{transform:scaleY(.07);transform-origin:50% 100%;transition:transform .5s cubic-bezier(.7,0,.2,1)}
.m290-t{transition:color .35s ease .08s}
.m290-l.on .m290-bg,.m290-l:hover .m290-bg{transform:scaleY(1)}
.m290-l.on .m290-t,.m290-l:hover .m290-t{color:#0a0f1c}
.m292-w{font-weight:500;letter-spacing:.01em;animation:m292-breath 2.6s cubic-bezier(.45,0,.55,1) infinite alternate}
@keyframes m292-breath{0%{font-weight:200;letter-spacing:.06em}100%{font-weight:800;letter-spacing:-.02em}}
.m292-in{animation:m292-cap 2.6s cubic-bezier(.45,0,.55,1) infinite alternate}
.m292-out{animation:m292-cap 2.6s cubic-bezier(.45,0,.55,1) infinite alternate-reverse}
@keyframes m292-cap{0%{opacity:.25}100%{opacity:1}}
@property --m295-a{syntax:'<angle>';inherits:false;initial-value:0deg}
.m295-pill{border:2px solid transparent;background:linear-gradient(#111829,#111829) padding-box,conic-gradient(from var(--m295-a),#ff9a5c,#ff4d8d,#8b7bff,#4fd1ff,#ff9a5c) border-box;animation:m295-spin 3s linear infinite}
@keyframes m295-spin{to{--m295-a:360deg}}
.m297-spin{animation:m297-spin 40s linear infinite}
@keyframes m297-spin{to{transform:rotate(360deg)}}
.m299-g{background-image:linear-gradient(90deg,#ff9a5c,#ff4d8d,#8b7bff,#4fd1ff,#ff9a5c);background-size:200% 100%;animation:m299-flow 3.2s linear infinite}
.m299-text{-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent}
.m299-btn{border:2px solid transparent;background:linear-gradient(#0d1322,#0d1322) padding-box,linear-gradient(90deg,#ff9a5c,#ff4d8d,#8b7bff,#4fd1ff,#ff9a5c) border-box;background-size:100% 100%,200% 100%;animation:m299-flow2 3.2s linear infinite}
@keyframes m299-flow{to{background-position:200% 0}}
@keyframes m299-flow2{to{background-position:0 0,200% 0}}
@property --m300-a{syntax:'<angle>';inherits:false;initial-value:120deg}
.m300-g{background-image:linear-gradient(var(--m300-a),#7cf7d4,#4f8dff 28%,#b07bff 52%,#ff7ab8 76%,#7cf7d4);background-size:280% 280%;-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;animation:m300-angle 14s linear infinite,m300-pos 7s cubic-bezier(.45,0,.55,1) infinite alternate}
.m300-blur{filter:blur(26px);opacity:.55}
@keyframes m300-angle{to{--m300-a:480deg}}
@keyframes m300-pos{0%{background-position:0% 30%}50%{background-position:70% 100%}100%{background-position:100% 0%}}
html.is-static .b7g1-glow,html.is-static .b7g1-css,html.is-static .m292-w,html.is-static .m292-in,html.is-static .m292-out,html.is-static .m295-pill,html.is-static .m297-spin,html.is-static .m299-g,html.is-static .m299-btn,html.is-static .m300-g{animation:none}
html.is-static {.b7g1-glow,.b7g1-css,.m292-w,.m292-in,.m292-out,.m295-pill,.m297-spin,.m299-g,.m299-btn,.m300-g{animation:none}.m290-bg,.m290-t{transition:none}}
`;

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). `top` adds a second glow above the content. */
function Stage({ r, children, className = "", g1, g2, top }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string; top?: boolean }) {
  const vars = { "--g1": g1, "--g2": g2 } as CSSProperties;
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0f1c] text-[#eaf5ff] ${className}`}>
      <style href="b7g1-css" precedence="default">
        {CSS}
      </style>
      <div className="b7g1-glow" style={vars} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
      {top ? <div className="b7g1-glow b7g1-top" style={vars} aria-hidden /> : null}
    </div>
  );
}

/** CSS-only demos: pause their keyframes (class b7g1-css or own) while the demo is off screen. */
function useOffscreen(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => el.classList.toggle("b7g1-off", !e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
}

/**
 * "play" helper: waits for fonts, builds the looping animation inside a gsap.context, plays it only while the demo is
 * on screen, and reverts everything on unmount. Nothing runs with prefersReducedMotion() (markup = final state).
 */
function usePlay(ref: RefObject<HTMLElement | null>, build: (root: HTMLElement, onClean: (fn: () => void) => void) => gsap.core.Animation | void) {
  const b = useRef(build);
  b.current = build;
  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    let dead = false;
    let on = false;
    let anim: gsap.core.Animation | void;
    const cleans: (() => void)[] = [];
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
    document.fonts.ready.then(() => {
      if (dead) return;
      ctx.add(() => {
        anim = b.current(root, (fn) => cleans.push(fn));
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

/** Runs fn on gsap's ticker while `anim` is playing (the play helper pauses it off screen). */
function tickWhile(anim: gsap.core.Animation, onClean: (fn: () => void) => void, fn: (dt: number) => void) {
  const tick = (_t: number, dtMs: number) => {
    if (!anim.paused()) fn(Math.min(0.05, dtMs / 1000));
  };
  gsap.ticker.add(tick);
  onClean(() => gsap.ticker.remove(tick));
}

/** Centre of `t` in px relative to `root` (for fake-pointer walks). */
function centreIn(root: HTMLElement, t: HTMLElement) {
  const r = root.getBoundingClientRect();
  const b = t.getBoundingClientRect();
  return { left: b.left - r.left + b.width / 2, top: b.top - r.top + b.height / 2 };
}

const Ring = ({ cls, at = { left: "82%", top: "80%" } }: { cls: string; at?: { left: string; top: string } }) => (
  <span className={`${cls} pointer-events-none absolute z-20 -ml-[14px] -mt-[14px] h-[28px] w-[28px] rounded-full border-2 border-white bg-white/10 opacity-0`} style={at} aria-hidden />
);

/* ───────────────────────── M290 · Underline grows to background (play, CSS + auto pointer) ───────────────────────── */
const M290_LINKS = ["linen edit", "care guide", "fitting"];
function M290() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const links = gsap.utils.toArray<HTMLElement>(".m290-l", el);
    const ring = el.querySelector<HTMLElement>(".m290-ring")!;
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(ring, { left: "82%", top: "84%", opacity: 1 });
    links.forEach((l) => {
      tl.to(ring, { left: () => centreIn(el, l).left, top: () => centreIn(el, l).top + 6, duration: 0.5, ease: "power2.inOut" });
      tl.call(() => l.classList.add("on"));
      tl.to(ring, { scale: 0.75, duration: 0.15, yoyo: true, repeat: 1, ease: "power1.inOut" });
      tl.to(ring, { left: () => centreIn(el, l).left + 40, duration: 0.25, ease: "sine.inOut" });
      tl.call(() => l.classList.remove("on"), [], ">0.05");
    });
    tl.to(ring, { left: "82%", top: "84%", duration: 0.55, ease: "sine.inOut" });
    return tl;
  });
  const L = (t: string) => (
    <a href="#" onClick={(e) => e.preventDefault()} className="m290-l relative inline-block cursor-pointer whitespace-nowrap px-[0.08em] no-underline">
      <span className="m290-bg absolute inset-0 block rounded-[3px] bg-[#ff9a5c]" aria-hidden />
      <span className="m290-t relative text-[#ff9a5c]">{t}</span>
    </a>
  );
  return (
    <Stage r={root} g1="rgba(255,154,92,.4)" g2="rgba(79,141,255,.22)">
      <div className="absolute inset-0 grid place-items-center px-[8%]">
        <div>
          <p className="max-w-[22ch] text-[clamp(44px,4.6vw,72px)] leading-[1.18] tracking-[-0.01em]" style={{ fontFamily: F.is }}>
            Browse the {L(M290_LINKS[0])}, read our {L(M290_LINKS[1])}, or book a {L(M290_LINKS[2])} at the studio.
          </p>
          <p className="mt-8 text-[13px] uppercase tracking-[0.2em] text-white/60">Atelier Mirelle · linen shirts from ₹3,490</p>
        </div>
      </div>
      <Ring cls="m290-ring" at={{ left: "82%", top: "84%" }} />
    </Stage>
  );
}

/* ───────────────────────── M291 · Vapour text (play, canvas particles) ───────────────────────── */
const M291_WORDS = ["Smoke", "Amber", "Vetiver", "Rain"];
type VP = { hx: number; hy: number; u: number; dx: number; dy: number; cx: number; cy: number; j: number; a: boolean };
function M291() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const cv = el.querySelector<HTMLCanvasElement>(".m291-cv")!;
    const fb = el.querySelector<HTMLElement>(".m291-fb")!;
    const g = cv.getContext("2d")!;
    const font = `"${F.sy}", sans-serif`;
    let W = 0;
    let H = 0;
    let dpr = 1;
    let size = 2;
    let sets: VP[][] = [];
    const sample = (word: string): VP[] => {
      const off = document.createElement("canvas");
      off.width = Math.max(1, Math.round(W));
      off.height = Math.max(1, Math.round(H));
      const o = off.getContext("2d", { willReadFrequently: true })!;
      // fit by measuring: the word takes at most 72 % of the stage width and 42 % of its height
      o.font = `700 100px ${font}`;
      const m = o.measureText(word).width || 1;
      const fs = Math.min((100 * 0.72 * W) / m, H * 0.42);
      o.font = `700 ${fs}px ${font}`;
      o.textAlign = "center";
      o.textBaseline = "middle";
      o.fillStyle = "#fff";
      o.fillText(word, W / 2, H * 0.47);
      const tw = o.measureText(word).width;
      const left = W / 2 - tw / 2;
      const step = Math.max(3, Math.round(fs / 46));
      size = step * 0.72;
      const data = o.getImageData(0, 0, off.width, off.height).data;
      const out: VP[] = [];
      for (let y = 0; y < off.height; y += step) {
        for (let x = 0; x < off.width; x += step) {
          if (data[(y * off.width + x) * 4 + 3] > 120) {
            out.push({
              hx: x,
              hy: y,
              u: gsap.utils.clamp(0, 1, (x - left) / tw),
              dx: (Math.random() - 0.25) * 90,
              dy: -(50 + Math.random() * 170),
              cx: (Math.random() - 0.5) * 140,
              cy: 40 + Math.random() * 110,
              j: Math.random() * Math.PI * 2,
              a: Math.random() < 0.14,
            });
          }
        }
      }
      return out;
    };
    const layout = () => {
      const r = cv.getBoundingClientRect();
      W = r.width;
      H = r.height;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      sets = M291_WORDS.map(sample);
    };
    layout();
    const ro = new ResizeObserver(() => layout());
    ro.observe(cv);
    onClean(() => ro.disconnect());
    gsap.set(fb, { opacity: 0 });

    const CYCLE = 2.6;
    const st = { t: 0, i: 0 };
    const loop = gsap.to(st, {
      t: 1,
      duration: CYCLE,
      ease: "none",
      repeat: -1,
      onRepeat: () => {
        st.i = (st.i + 1) % M291_WORDS.length;
      },
    });
    let clock = 0;
    const smooth = (x: number) => x * x * (3 - 2 * x);
    tickWhile(loop, onClean, (dt) => {
      clock += dt;
      const s = st.t * CYCLE;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      const cur = sets[st.i] ?? [];
      const nxt = sets[(st.i + 1) % sets.length] ?? [];
      // the current word vaporises left → right, drifting up and fading
      for (const p of cur) {
        const v = gsap.utils.clamp(0, 1, (s - p.u * 0.7) / 0.9);
        if (v >= 1) continue;
        const e = Math.pow(v, 1.35);
        const a = Math.pow(1 - v, 1.4);
        const x = p.hx + p.dx * e + Math.sin(p.j + v * 5) * 10 * e + (v === 0 ? Math.sin(clock * 3 + p.j) * 0.4 : 0);
        const y = p.hy + p.dy * e;
        const z = size * (1 + v * 1.6);
        g.globalAlpha = a;
        g.fillStyle = p.a ? ACC : "#f6eee2";
        g.fillRect(x - z / 2, y - z / 2, z, z);
      }
      // the next word condenses in its place from a loose cloud below
      for (const p of nxt) {
        const c = gsap.utils.clamp(0, 1, (s - 0.75 - p.u * 0.7) / 0.9);
        if (c <= 0) continue;
        const k = 1 - smooth(c);
        const x = p.hx + p.cx * k * k + Math.sin(p.j + c * 4) * 6 * k + (c === 1 ? Math.sin(clock * 3 + p.j) * 0.4 : 0);
        const y = p.hy + p.cy * k * k;
        const z = size * (1 + k * 1.2);
        g.globalAlpha = smooth(c);
        g.fillStyle = p.a ? ACC : "#f6eee2";
        g.fillRect(x - z / 2, y - z / 2, z, z);
      }
      g.globalAlpha = 1;
    });
    return loop;
  });
  return (
    <Stage r={root} g1="rgba(255,170,110,.42)" g2="rgba(140,120,255,.22)" top>
      <canvas className="m291-cv absolute inset-0 h-full w-full" aria-hidden />
      <div className="m291-fb pointer-events-none absolute inset-x-0 top-[47%] -translate-y-1/2 text-center text-[clamp(96px,13vw,200px)] font-[700] leading-none text-[#f6eee2]" style={{ fontFamily: F.sy }}>
        {M291_WORDS[0]}
      </div>
      <p className="absolute bottom-5 left-6 z-10 text-[13px] uppercase tracking-[0.18em] text-white/60">Attar No. 7 · eau de parfum · 50 ml · ₹4,800</p>
      <span className="sr-only">{M291_WORDS.join(", ")}</span>
    </Stage>
  );
}

/* ───────────────────────── M292 · Weight breath, whole word (play, CSS variable weight) ───────────────────────── */
function M292() {
  const root = useRef<HTMLDivElement>(null);
  useOffscreen(root);
  return (
    <Stage r={root} g1="rgba(150,200,255,.36)" g2="rgba(255,154,92,.22)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center">
          <h3 className="m292-w b7g1-css whitespace-nowrap text-[clamp(96px,12vw,190px)] leading-none" style={{ fontFamily: F.mr }}>
            Exhale
          </h3>
          <p className="mt-8 flex justify-center gap-6 text-[13px] uppercase tracking-[0.24em]">
            <span className="m292-in b7g1-css text-[#ff9a5c]">Inhale</span>
            <span className="text-white/40">·</span>
            <span className="m292-out b7g1-css text-white/80">Exhale</span>
          </p>
          <p className="mt-4 text-[14px] text-white/60" style={{ fontFamily: F.mr }}>
            Washed linen sleep set · ₹6,200
          </p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M293 · Word cube roll (play, gsap 3D boxes) ───────────────────────── */
// faces: front (0°) EN, top (90°) IT, back (180°) FR, bottom (270°) ES. Each step rolls the boxes -180°.
const M293_FACES = [
  ["Fresh", "bread", "daily"],
  ["Pane", "fresco", "sempre"],
  ["Pain", "frais", "du jour"],
  ["Pan", "fresco", "cada día"],
];
const M293_LANG = ["EN", "IT", "FR", "ES"];
function M293() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const boxes = gsap.utils.toArray<HTMLElement>(".m293-box", el);
    const tag = el.querySelector<HTMLElement>(".m293-tag")!;
    gsap.set(boxes, { rotationX: 0 });
    const tl = gsap.timeline({ repeat: -1 });
    tl.to(boxes, { rotationX: -180, duration: 1.05, ease: "power2.inOut", stagger: 0.14 });
    tl.call(() => (tag.textContent = "FR · from the oven"), [], 0.5);
    tl.to(boxes, { rotationX: -360, duration: 1.05, ease: "power2.inOut", stagger: 0.14 }, ">0.12");
    tl.call(() => (tag.textContent = "EN · from the oven"), [], ">-0.7");
    tl.set(boxes, { rotationX: 0 }, ">0.1");
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,180,110,.4)" g2="rgba(79,141,255,.2)">
      <div className="absolute inset-0 grid place-items-center px-[5%]">
        <div className="text-center">
          <p className="m293-tag text-[13px] uppercase tracking-[0.24em] text-[#ff9a5c]">EN · from the oven</p>
          <h3 className="mt-6 flex justify-center gap-[0.28em] whitespace-nowrap text-[clamp(56px,6vw,96px)] font-[700] leading-[1.1] tracking-[-0.02em]" style={{ fontFamily: F.sg }}>
            {M293_FACES[0].map((_, w) => (
              <span key={w} className="inline-block" style={{ perspective: "900px" }}>
                <span className="m293-box relative inline-grid" style={{ transformStyle: "preserve-3d" }}>
                  {M293_FACES.map((f, k) => (
                    <span key={`s${k}`} className="invisible [grid-area:1/1]" aria-hidden>
                      {f[w]}
                    </span>
                  ))}
                  {M293_FACES.map((f, k) => (
                    <span
                      key={k}
                      className={`absolute inset-0 flex items-center justify-center ${k % 2 ? "text-[#ff9a5c]" : ""}`}
                      style={{ transform: `rotateX(${k * 90}deg) translateZ(0.55em)`, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                      aria-hidden={k > 0}
                      title={M293_LANG[k]}
                    >
                      {f[w]}
                    </span>
                  ))}
                </span>
              </span>
            ))}
          </h3>
          <p className="mt-8 text-[13px] uppercase tracking-[0.2em] text-white/60">Forno Vela · sourdough loaf · 800 g · ₹340</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M294 · Word loop 3D roll with blur (play, gsap) ───────────────────────── */
const M294_WORDS = ["the long haul", "cold starts", "city miles", "wet weekends"];
function M294() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const words = gsap.utils.toArray<HTMLElement>(".m294-w", el);
    gsap.set(words, { transformOrigin: "50% 50% -24px", transformPerspective: 700 });
    gsap.set(words.slice(1), { autoAlpha: 0 });
    gsap.set(words[0], { autoAlpha: 1 });
    const tl = gsap.timeline({ repeat: -1 });
    words.forEach((w, i) => {
      const n = words[(i + 1) % words.length];
      tl.to(w, { rotationX: -90, y: -20, filter: "blur(4px)", autoAlpha: 0, duration: 0.5, ease: "power2.in" });
      tl.fromTo(
        n,
        { rotationX: 90, y: 20, filter: "blur(4px)", autoAlpha: 0 },
        { rotationX: 0, y: 0, filter: "blur(0px)", autoAlpha: 1, duration: 1.05, ease: "back.out(1.25)", immediateRender: false },
        "<0.22",
      );
      tl.set(w, { rotationX: 0, y: 0, filter: "blur(0px)" }, ">-0.2");
    });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,154,92,.4)" g2="rgba(120,200,160,.2)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div>
          <h3 className="flex items-baseline gap-[0.28em] whitespace-nowrap text-[clamp(56px,6.2vw,100px)] leading-[1.1] tracking-[-0.015em]" style={{ fontFamily: F.fr }}>
            <span>Built for</span>
            <span className="inline-grid">
              {M294_WORDS.map((w, i) => (
                <span key={w} className="m294-w italic text-[#ff9a5c] [grid-area:1/1]" style={i ? { visibility: "hidden" } : undefined} aria-hidden={i > 0}>
                  {w}
                </span>
              ))}
            </span>
          </h3>
          <p className="mt-8 text-[13px] uppercase tracking-[0.2em] text-white/60">Halden &amp; Co · waxed field jacket · ₹12,900</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M295 · Word swap inside a sized pill (play, gsap) ───────────────────────── */
const M295_WORDS = ["convert", "scale", "feel premium", "sell out"];
function M295() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const wrap = el.querySelector<HTMLElement>(".m295-wrap")!;
    const words = gsap.utils.toArray<HTMLElement>(".m295-w", el);
    const chars = words.map((w) => Array.from(w.querySelectorAll<HTMLElement>(".m295-c")));
    const widths = words.map((w) => w.offsetWidth);
    gsap.set(wrap, { width: widths[0] });
    gsap.set(words.slice(1), { visibility: "hidden" });
    const tl = gsap.timeline({ repeat: -1 });
    words.forEach((w, i) => {
      const j = (i + 1) % words.length;
      tl.to(chars[i], { opacity: 0, filter: "blur(6px)", y: -8, duration: 0.24, ease: "power1.in", stagger: 0.015 }, "+=0.5");
      tl.set(w, { visibility: "hidden" });
      tl.set(words[j], { visibility: "visible" });
      tl.to(wrap, { width: widths[j], duration: 0.7, ease: "back.out(1.7)" });
      tl.fromTo(
        chars[j],
        { opacity: 0, filter: "blur(8px)", y: 8 },
        { opacity: 1, filter: "blur(0px)", y: 0, duration: 0.42, ease: "power2.out", stagger: 0.045, immediateRender: false },
        "<0.05",
      );
      tl.set(chars[i], { opacity: 1, filter: "blur(0px)", y: 0 });
    });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,120,170,.36)" g2="rgba(79,180,255,.26)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center">
          <h3 className="flex items-center justify-center gap-[0.3em] whitespace-nowrap text-[clamp(52px,5.6vw,92px)] font-[600] leading-[1.1] tracking-[-0.02em]" style={{ fontFamily: F.sg }}>
            <span>Stores that</span>
            <span className="m295-pill b7g1-css inline-flex rounded-[0.32em] px-[0.32em] py-[0.06em]">
              <span className="m295-wrap relative inline-block whitespace-nowrap text-left">
                {M295_WORDS.map((w, i) => (
                  <span key={w} className={`m295-w whitespace-nowrap ${i ? "absolute left-0 top-0" : "relative"}`} style={i ? { visibility: "hidden" } : undefined} aria-hidden={i > 0}>
                    {w.split("").map((c, k) => (
                      <span key={k} className="m295-c inline-block">
                        {c === " " ? " " : c}
                      </span>
                    ))}
                  </span>
                ))}
              </span>
            </span>
          </h3>
          <p className="mt-8 text-[13px] uppercase tracking-[0.2em] text-white/60">Studio Nella · store builds from ₹49,000</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M296 · 3D letter flip on hover (play, gsap cubes + auto pointer) ───────────────────────── */
const M296_WORD = "VELOCITY";
const M296_MODES = ["start", "end", "center", "random"] as const;
const M296_LABEL: Record<(typeof M296_MODES)[number], string> = { start: "from first", end: "from last", center: "from centre", random: "random" };
function M296() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const head = el.querySelector<HTMLElement>(".m296-h")!;
    const cubes = gsap.utils.toArray<HTMLElement>(".m296-cube", el);
    const ring = el.querySelector<HTMLElement>(".m296-ring")!;
    const tag = el.querySelector<HTMLElement>(".m296-tag")!;
    const h = cubes[0]?.offsetHeight ?? 100;
    gsap.set(cubes, { transformOrigin: `50% 50% ${-h / 2}px`, rotationX: 0 });
    const flip = (to: number, from: (typeof M296_MODES)[number]) => ({ rotationX: to, duration: 0.7, ease: "back.out(1.8)", stagger: { each: 0.05, from } });
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(ring, { left: "84%", top: "82%", opacity: 1 });
    M296_MODES.forEach((m) => {
      tl.call(() => (tag.textContent = `stagger · ${M296_LABEL[m]}`));
      tl.to(ring, { left: () => centreIn(el, head).left + (m === "end" ? 120 : -120), top: () => centreIn(el, head).top, duration: 0.45, ease: "power2.inOut" });
      tl.to(cubes, flip(90, m), "<0.3");
      tl.to(ring, { left: "+=60", duration: 0.5, ease: "sine.inOut" }, "<");
      tl.to(ring, { left: "84%", top: "82%", duration: 0.45, ease: "power2.inOut" }, ">0.1");
      tl.to(cubes, flip(0, m), "<0.15");
    });
    // the real pointer still works: hover pauses the auto loop and flips; leaving flips back and resumes
    let resume: gsap.core.Tween | null = null;
    const enter = () => {
      resume?.kill();
      tl.pause();
      gsap.set(ring, { opacity: 0 });
      gsap.to(cubes, flip(90, "start"));
    };
    const leave = () => {
      gsap.to(cubes, flip(0, "start"));
      resume = gsap.delayedCall(0.9, () => {
        gsap.set(ring, { opacity: 1 });
        tl.restart();
      });
    };
    head.addEventListener("pointerenter", enter);
    head.addEventListener("pointerleave", leave);
    onClean(() => {
      resume?.kill();
      head.removeEventListener("pointerenter", enter);
      head.removeEventListener("pointerleave", leave);
    });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,154,92,.5)" g2="rgba(79,141,255,.24)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center">
          <p className="m296-tag text-[13px] uppercase tracking-[0.24em] text-[#ff9a5c]">stagger · from first</p>
          <h3
            className="m296-h mt-6 inline-flex cursor-pointer whitespace-nowrap text-[clamp(64px,7vw,112px)] font-[800] uppercase leading-none tracking-[-0.01em]"
            style={{ fontFamily: F.sy, perspective: "900px" }}
            aria-label={M296_WORD}
          >
            {M296_WORD.split("").map((c, i) => (
              <span key={i} className="m296-cube relative inline-block" style={{ transformStyle: "preserve-3d" }} aria-hidden>
                <span className="block" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
                  {c}
                </span>
                <span
                  className="absolute left-0 top-full block w-full text-[#ff9a5c]"
                  style={{ transformOrigin: "50% 0", transform: "rotateX(-90deg)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                >
                  {c}
                </span>
              </span>
            ))}
          </h3>
          <p className="mt-8 text-[13px] uppercase tracking-[0.2em] text-white/60">Track spike · carbon plate · ₹11,490</p>
        </div>
      </div>
      <Ring cls="m296-ring" at={{ left: "84%", top: "82%" }} />
    </Stage>
  );
}

/* ───────────────────────── M297 · 3D typography tunnel (scrub, CSS 3D rings) ───────────────────────── */
const M297_RINGS = 10;
const M297_GAP = 360;
const M297_SPAN = M297_RINGS * M297_GAP;
const M297_NEAR = 560;
const M297_PER = 6;
const M297_R = 300;
const M297_WORDS = ["Night", "Market", "Smoke", "Spice", "Neon", "Noodles", "Late", "Street", "Grill", "Salt"];
function m297Ring(k: number, p: number) {
  // camera moves forward = every ring travels toward the viewer; rings wrap from the near plane back to the far end
  const travel = M297_SPAN * 1.6;
  const z = gsap.utils.wrap(M297_NEAR - M297_SPAN, M297_NEAR, -k * M297_GAP + p * travel);
  const far = gsap.utils.clamp(0, 1, (z - (M297_NEAR - M297_SPAN)) / 900);
  const near = gsap.utils.clamp(0, 1, (M297_NEAR - z) / 260);
  return { transform: `translate3d(0,0,${z.toFixed(1)}px)`, opacity: (far * near).toFixed(3) };
}
function M297() {
  const root = useRef<HTMLDivElement>(null);
  const rings = useRef<(HTMLDivElement | null)[]>([]);
  const bar = useRef<HTMLSpanElement>(null);
  useScrub(
    root,
    (p) => {
      rings.current.forEach((r, k) => {
        if (!r) return;
        const s = m297Ring(k, p); // linear over the whole panel
        r.style.transform = s.transform;
        r.style.opacity = s.opacity;
      });
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    },
    { finalValue: 0 },
  );
  return (
    <Stage r={root} g1="rgba(255,154,92,.38)" g2="rgba(255,70,140,.22)" top>
      <div className="absolute inset-0" style={{ perspective: "700px", perspectiveOrigin: "50% 50%" }}>
        <div className="m297-spin absolute left-1/2 top-1/2 h-0 w-0" style={{ transformStyle: "preserve-3d" }}>
          {Array.from({ length: M297_RINGS }, (_, k) => {
            const s = m297Ring(k, 0);
            return (
              <div
                key={k}
                ref={(n) => {
                  rings.current[k] = n;
                }}
                className="absolute left-0 top-0"
                style={{ transformStyle: "preserve-3d", transform: s.transform, opacity: Number(s.opacity) }}
                aria-hidden
              >
                {Array.from({ length: M297_PER }, (_, i) => (
                  <span
                    key={i}
                    className={`absolute left-0 top-0 whitespace-nowrap text-[40px] font-[800] uppercase leading-none tracking-[0.04em] ${(k + i) % 3 === 0 ? "text-[#ff9a5c]" : "text-[#eaf5ff]"}`}
                    style={{ fontFamily: F.sy, transform: `translate(-50%,-50%) rotate(${i * (360 / M297_PER) + (k % 2) * 30}deg) translateY(-${M297_R}px)` }}
                  >
                    {M297_WORDS[(k * 3 + i) % M297_WORDS.length]}
                  </span>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="rounded-full border border-white/15 bg-[#0a0f1c]/70 px-6 py-3 text-center backdrop-blur-sm">
          <p className="text-[13px] uppercase tracking-[0.22em] text-white/70">Lantern Lane night market</p>
          <p className="mt-1 text-[20px]" style={{ fontFamily: F.fr }}>
            Fri–Sun · entry ₹299
          </p>
        </div>
      </div>
      <div className="absolute bottom-5 left-6 z-10 flex items-center gap-4 text-[13px] uppercase tracking-[0.18em] text-white/65">
        <span>Scroll to walk in</span>
        <span className="relative block h-px w-[160px] bg-white/15">
          <span ref={bar} className="absolute inset-0 origin-left bg-[#ff9a5c]" style={{ transform: "scaleX(0)" }} />
        </span>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M298 · Alternating vertical marquee columns (play, gsap ticker + scroll velocity) ───────────────────────── */
const M298_CARDS = [
  { q: "Sears like a restaurant pan. Heavier than it looks.", n: "Riya M.", c: "Pune" },
  { q: "Pre-seasoned properly. Eggs slid off on day one.", n: "Kabir S.", c: "Delhi" },
  { q: "Goes from stove to oven to table. One pan, done.", n: "Anaya P.", c: "Goa" },
  { q: "The handle stays cooler than my old one did.", n: "Dev R.", c: "Indore" },
  { q: "Bought one, then two more as wedding gifts.", n: "Meher K.", c: "Jaipur" },
  { q: "Dosa night is a different sport now.", n: "Arjun T.", c: "Chennai" },
];
function M298() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const cols = gsap.utils.toArray<HTMLElement>(".m298-col", el);
    const st = cols.map((c, i) => {
      const half = c.scrollHeight / 2;
      const dir = i % 2 ? 1 : -1;
      return { c, half, dir, y: dir > 0 ? -half : 0, set: gsap.quickSetter(c, "y", "px") };
    });
    let boost = 0;
    const trig = ScrollTrigger.create({
      trigger: el,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (s) => {
        boost = Math.max(boost, Math.min(4, Math.abs(s.getVelocity()) / 700));
      },
    });
    onClean(() => trig.kill());
    const clock = gsap.to({}, { duration: 1, repeat: -1 });
    tickWhile(clock, onClean, (dt) => {
      boost += (0 - boost) * (1 - Math.exp(-dt * 2.5));
      st.forEach((s, i) => {
        s.y = gsap.utils.wrap(-s.half, 0, s.y + s.dir * (42 + i * 8) * (1 + boost) * dt);
        s.set(s.y);
      });
    });
    return clock;
  });
  const col = (offset: number) => [...M298_CARDS.slice(offset), ...M298_CARDS.slice(0, offset)];
  return (
    <Stage r={root} g1="rgba(255,154,92,.42)" g2="rgba(79,141,255,.22)" top>
      <div className="absolute inset-0 grid grid-cols-[38%_1fr] gap-[3%] pl-[6%] pr-[3%]">
        <div className="self-center">
          <p className="text-[13px] uppercase tracking-[0.22em] text-[#ff9a5c]">4.9 from 2,140 reviews</p>
          <h3 className="mt-5 text-[clamp(44px,4.4vw,70px)] leading-[1.02] tracking-[-0.02em]" style={{ fontFamily: F.fr }}>
            Loved in 1,200 home kitchens.
          </h3>
          <p className="mt-6 text-[15px] text-white/70" style={{ fontFamily: F.mr }}>
            Ironleaf cast-iron skillet · 26 cm · ₹3,450
          </p>
        </div>
        <div className="relative grid grid-cols-3 gap-4 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,#000_14%,#000_86%,transparent)]">
          {[0, 2, 4].map((o, ci) => (
            <div key={ci} className="m298-col flex flex-col">
              {[...col(o), ...col(o)].map((c, k) => (
                <figure key={k} className="mb-4 rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-sm" aria-hidden={k >= M298_CARDS.length}>
                  <p className="text-[13px] tracking-[0.2em] text-[#ffb98a]">★★★★★</p>
                  <blockquote className="mt-3 text-[16px] leading-[1.4] text-white/90" style={{ fontFamily: F.mr }}>
                    {c.q}
                  </blockquote>
                  <figcaption className="mt-4 text-[13px] text-white/55">
                    {c.n} · {c.c}
                  </figcaption>
                </figure>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M299 · Animated gradient text (play, CSS) ───────────────────────── */
function M299() {
  const root = useRef<HTMLDivElement>(null);
  useOffscreen(root);
  return (
    <Stage r={root} g1="rgba(255,90,160,.34)" g2="rgba(79,180,255,.26)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center">
          <h3 className="whitespace-nowrap text-[clamp(56px,6.4vw,104px)] font-[800] uppercase leading-[0.95] tracking-[-0.02em]" style={{ fontFamily: F.sy }}>
            <span className="m299-g m299-text b7g1-css">Summer drop</span>
          </h3>
          <p className="mt-6 text-[15px] text-white/70" style={{ fontFamily: F.mr }}>
            Twelve swim shorts, four prints, one weekend only.
          </p>
          <span className="m299-btn b7g1-css mt-8 inline-flex items-center gap-3 rounded-full px-7 py-3 text-[15px] font-[600]" style={{ fontFamily: F.sg }}>
            Shop the drop <span className="text-white/60">from ₹2,499</span>
          </span>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M300 · Aurora gradient text (play, CSS) ───────────────────────── */
function M300() {
  const root = useRef<HTMLDivElement>(null);
  useOffscreen(root);
  const cls = "whitespace-nowrap text-[clamp(84px,9.6vw,156px)] font-[600] leading-[1] tracking-[-0.03em]";
  return (
    <Stage r={root} g1="rgba(110,240,200,.3)" g2="rgba(176,123,255,.3)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center">
          <p className="text-[13px] uppercase tracking-[0.24em] text-white/60">Tromsø glass lamp · hand-blown</p>
          <div className="relative mt-5">
            <h3 className={`m300-g m300-blur b7g1-css absolute inset-0 ${cls}`} style={{ fontFamily: F.fr }} aria-hidden>
              Northern light
            </h3>
            <h3 className={`m300-g b7g1-css relative ${cls}`} style={{ fontFamily: F.fr }}>
              Northern light
            </h3>
          </div>
          <p className="mt-6 text-[15px] text-white/70" style={{ fontFamily: F.mr }}>
            A slow glow for long evenings · ₹8,900
          </p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M301 · Block-glyph scramble from centre (play, gsap) ───────────────────────── */
const M301_SETS = [
  ["SIGNAL / NOISE", "FIELD RECORDER MK II", "₹24,900 · IN STOCK"],
  ["PURE ANALOG", "TAPE SATURATION UNIT", "₹18,500 · PRE-ORDER"],
];
const M301_BLOCKS = ["░", "▒", "▓", "█"];
const m301Pad = (s: string, n: number) => {
  const l = Math.floor((n - s.length) / 2);
  return " ".repeat(l) + s + " ".repeat(n - s.length - l);
};
const M301_LEN = M301_SETS[0].map((_, li) => Math.max(...M301_SETS.map((s) => s[li].length)));
const M301_TEXT = M301_SETS.map((s) => s.map((l, li) => m301Pad(l, M301_LEN[li])));
function M301() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const lines = gsap.utils.toArray<HTMLElement>(".m301-line", el).map((l) => Array.from(l.querySelectorAll<HTMLElement>(".m301-c")));
    const nL = lines.length;
    const mid = (nL - 1) / 2;
    const maxOrder = Math.ceil(mid);
    const jit = lines.map((cs) => cs.map(() => Math.random() * 0.06));
    const shown = lines.map((cs) => cs.map((c) => c.textContent ?? ""));
    const st = { t: 0, set: 0 };
    const TOTAL = 2.15;
    const render = () => {
      const t = st.t;
      const text = M301_TEXT[st.set];
      lines.forEach((cs, li) => {
        const order = Math.abs(li - mid); // centre line first, outer lines after
        const n = cs.length;
        const cc = (n - 1) / 2;
        cs.forEach((c, i) => {
          const ch = text[li][i];
          let out = " ";
          if (ch !== " ") {
            const d = cc ? Math.abs(i - cc) / cc : 0; // 0 at the centre, 1 at the edges
            const rs = order * 0.18 + d * 0.5 + jit[li][i];
            const g = Math.floor((t - rs) / 0.065);
            if (t < 1.2) {
              out = g < 0 ? " " : g < 4 ? M301_BLOCKS[g] : ch;
            } else {
              // clear in reverse: outer lines and edges go first, char → █ ▓ ▒ ░ → blank
              const cs0 = 1.2 + (maxOrder - order) * 0.14 + (1 - d) * 0.4 + jit[li][i];
              const k = Math.floor((t - cs0) / 0.055);
              out = k < 0 ? ch : k < 4 ? M301_BLOCKS[3 - k] : " ";
            }
          }
          if (shown[li][i] !== out) {
            shown[li][i] = out;
            c.textContent = out;
          }
        });
      });
    };
    const tl = gsap.to(st, {
      t: TOTAL,
      duration: TOTAL,
      ease: "none",
      repeat: -1,
      onUpdate: render,
      onRepeat: () => {
        st.set = (st.set + 1) % M301_TEXT.length;
      },
    });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(120,255,190,.32)" g2="rgba(255,154,92,.26)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center" style={{ fontFamily: MONO }} aria-label={M301_SETS[0].join(" ")}>
          {M301_TEXT[0].map((l, li) => (
            <p
              key={li}
              className={`m301-line whitespace-pre leading-[1.25] ${li === 1 ? "text-[clamp(44px,4.8vw,76px)] font-[700] text-[#eaf5ff]" : "text-[clamp(26px,2.6vw,40px)] text-[#9fffd0]"}`}
              aria-hidden
            >
              {l.split("").map((c, i) => (
                <span key={i} className="m301-c">
                  {c === " " ? " " : c}
                </span>
              ))}
            </p>
          ))}
          <p className="mt-8 text-[13px] uppercase tracking-[0.24em] text-white/55" style={{ fontFamily: F.sg }}>
            Lumen Audio · portable tape deck
          </p>
        </div>
      </div>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M290", name: "Underline grows to background", how: "A thin underline grows upward into a full background block and the link text flips colour · auto pointer hovers each link", kind: "play", C: M290 },
  { code: "M291", name: "Vapour text", how: "The word vaporises into particles that drift up and fade, left to right, while the next word condenses in its place · canvas, cycles", kind: "play", C: M291 },
  { code: "M292", name: "Weight breath (whole word)", how: "The whole word's variable weight swells 200 → 800 and relaxes on a slow loop, like breathing · CSS", kind: "play", C: M292 },
  { code: "M293", name: "Word cube roll", how: "Each word is a 4-face 3D box; the boxes roll -180° in a stagger, one language rolling into another · loops", kind: "play", C: M293 },
  { code: "M294", name: "Word loop 3D roll with blur", how: "Old word rolls to -90° with blur, the new one rolls up from 90° + y 20 + blur(4px) to flat and sharp on a heavy spring · cycles", kind: "play", C: M294 },
  { code: "M295", name: "Word swap inside a sized pill", how: "On each swap the pill springs to the new word's width while its letters blur in one by one · auto cycle", kind: "play", C: M295 },
  { code: "M296", name: "3D letter flip on hover", how: "Each letter is a cube that rolls 90° on X to a duplicate face, staggered from first, last, centre or random · auto pointer", kind: "play", C: M296 },
  { code: "M297", name: "3D typography tunnel", how: "Rings of words sit along a 3D tunnel; scroll moves the camera forward so the rings rush toward and past you · scrubbed", kind: "scrub", C: M297 },
  { code: "M298", name: "Alternating vertical marquee columns", how: "Three columns of review cards scroll endlessly, neighbours in opposite directions, faster with scroll speed · ticker loop", kind: "play", C: M298 },
  { code: "M299", name: "Animated gradient text", how: "A four-colour gradient clipped into the letters slides sideways so colour flows through them, with a matching flowing border · CSS loop", kind: "play", C: M299 },
  { code: "M300", name: "Aurora gradient text", how: "A large multi-colour gradient drifts its position and angle through the letters, with a soft blurred aurora behind · CSS loop", kind: "play", C: M300 },
  { code: "M301", name: "Block-glyph scramble from centre", how: "Letters resolve out of ░▒▓█ blocks sweeping from the centre outward, centre line first, then block away in reverse · cycles", kind: "play", C: M301 },
];
