"use client";

// Text motions, batch 8 · group 5 (MOTION-MENU M398–M405). Small focused demos for /lab/motion, rebuilt in GSAP / CSS / OGL
// from the idea only. Every demo: plays by itself on screen (or follows the scroll), loops, has a CSS glow loop that never
// stops, and shows a sensible final state in ?static=1 / reduced motion.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import type { Flip as FlipT } from "gsap/Flip";
import { gsap, SplitText, loadPlugin, prefersReducedMotion } from "@/lib/gsap";
import { createShader, type GLHandle } from "@/lib/gl";
import { useScrub, useTicker } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = { sg: "Space Grotesk Variable", fr: "Fraunces Variable", is: "Instrument Serif", sy: "Syne Variable", mr: "Manrope Variable" };

const CSS = `
.b8g5-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 32% 38%,var(--g1,rgba(255,163,92,.42)),transparent 70%),radial-gradient(34% 40% at 70% 66%,var(--g2,rgba(79,141,255,.22)),transparent 70%);animation:b8g5-drift 5.6s linear infinite alternate;will-change:transform}
.b8g5-top{mix-blend-mode:screen;opacity:.45;z-index:5}
@keyframes b8g5-drift{0%{transform:translate3d(-7%,-5%,0) scale(1)}100%{transform:translate3d(7%,6%,0) scale(1.15)}}
.m399-h{grid-area:1/1;will-change:transform}
.m399-top{clip-path:inset(0 0 50% 0);animation:m399-top 2.8s linear infinite both}
.m399-bot{clip-path:inset(50% 0 0 0);animation:m399-bot 2.8s linear infinite both}
.m399-seam{animation:m399-seam 2.8s linear infinite both}
@keyframes m399-top{
0%{transform:translateX(-46vw);opacity:0;animation-timing-function:cubic-bezier(.2,.7,.3,1)}
6%{opacity:1}
42%{transform:translateX(0);opacity:1;animation-timing-function:linear}
50%{transform:translateX(.6vw);opacity:1;animation-timing-function:cubic-bezier(.6,0,.85,.4)}
93%{transform:translateX(46vw);opacity:0}
100%{transform:translateX(46vw);opacity:0}}
@keyframes m399-bot{
0%{transform:translateX(46vw);opacity:0;animation-timing-function:cubic-bezier(.2,.7,.3,1)}
6%{opacity:1}
42%{transform:translateX(0);opacity:1;animation-timing-function:linear}
50%{transform:translateX(-.6vw);opacity:1;animation-timing-function:cubic-bezier(.6,0,.85,.4)}
93%{transform:translateX(-46vw);opacity:0}
100%{transform:translateX(-46vw);opacity:0}}
@keyframes m399-seam{0%{transform:scaleX(0);opacity:0}34%{transform:scaleX(0);opacity:1}46%{transform:scaleX(1);opacity:1}62%{transform:scaleX(1);opacity:0}100%{transform:scaleX(0);opacity:0}}
.m399-off .m399-top,.m399-off .m399-bot,.m399-off .m399-seam{animation-play-state:paused}
html.is-static .b8g5-glow,html.is-static .m399-top,html.is-static .m399-bot{animation:none}
html.is-static .m399-seam{animation:none;transform:scaleX(1)}
html.is-static {.b8g5-glow,.m399-top,.m399-bot{animation:none}.m399-seam{animation:none;transform:scaleX(1)}}
`;

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). `top` adds a second glow over the content. */
function Stage({ r, children, className = "", g1, g2, top = false }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string; top?: boolean }) {
  const vars = { "--g1": g1, "--g2": g2 } as CSSProperties;
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0f1c] text-[#eaf5ff] ${className}`}>
      <style href="b8g5-css" precedence="default">
        {CSS}
      </style>
      <div className="b8g5-glow" style={vars} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
      {top && <div className="b8g5-glow b8g5-top" style={vars} aria-hidden />}
    </div>
  );
}

/** "play" helper: waits for fonts (+ an optional plugin), builds the looping animation in a gsap.context, plays it only on screen. */
function usePlay(
  ref: RefObject<HTMLElement | null>,
  build: (root: HTMLElement, plug: unknown, onClean: (fn: () => void) => void) => gsap.core.Animation | void,
  pre?: () => Promise<unknown>,
) {
  const b = useRef(build);
  b.current = build;
  const pf = useRef(pre);
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
    Promise.all([pf.current?.(), document.fonts.ready]).then(([plug]) => {
      if (dead) return;
      ctx.add(() => {
        anim = b.current(root, plug, (fn) => cleans.push(fn));
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

/** Toggles a class on the element while it is off screen (pauses CSS-only loops). */
function useOffClass(ref: RefObject<HTMLElement | null>, cls: string) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => el.classList.toggle(cls, !e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, cls]);
}

/** Small deterministic random (same rhythm every loop and every load). */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const Caption = ({ children }: { children: ReactNode }) => <p className="absolute bottom-5 left-6 text-[13px] uppercase tracking-[0.18em] text-white/60">{children}</p>;

/* ───────────────────────── M398 · Velocity spring text (scrub, gsap ticker spring) ───────────────────────── */
const M398_LINES = [
  ["Move", "fast."],
  ["Stay", "loose."],
  ["Land", "soft."],
];
function M398() {
  const root = useRef<HTMLDivElement>(null);
  const st = useRef({ p: 0, v: 0, at: 0 });
  const springs = useRef(M398_LINES.flat().map(() => ({ y: 0, vy: 0 })));
  useScrub(
    root,
    (p, v) => {
      st.current.p = p;
      st.current.v = v;
      st.current.at = performance.now();
      // linear part: lines drift sideways in opposite directions over the whole panel
      const el = root.current;
      if (!el) return;
      const w = el.clientWidth;
      el.querySelectorAll<HTMLElement>(".m398-line").forEach((l, i) => {
        l.style.transform = `translate3d(${(p - 0.5) * (i % 2 ? 1 : -1) * w * 0.12}px,0,0)`;
      });
      const bar = el.querySelector<HTMLElement>(".m398-p");
      if (bar) bar.style.transform = `scaleX(${p})`;
    },
    { finalValue: 0.5 },
  );
  useTicker(root, (_t, dt) => {
    const el = root.current;
    if (!el) return;
    const s = st.current;
    // velocity stops counting ~90 ms after the last scroll event → the words spring home
    const v = performance.now() - s.at > 90 ? 0 : s.v;
    const words = el.querySelectorAll<HTMLElement>(".m398-w");
    const h = Math.min(0.033, dt || 0.016);
    words.forEach((w, j) => {
      const sp = springs.current[j];
      const target = gsap.utils.clamp(-1, 1, v * 3) * 90 * (1 + j * 0.22);
      const k = 140 - j * 12;
      const c = 2 * Math.sqrt(k) * 0.55; // under-damped: a small spring back
      sp.vy += (k * (target - sp.y) - c * sp.vy) * h;
      sp.y += sp.vy * h;
      w.style.transform = `translate3d(0,${sp.y.toFixed(2)}px,0) skewY(${(sp.vy * 0.012).toFixed(3)}deg)`;
    });
    const meter = el.querySelector<HTMLElement>(".m398-v");
    if (meter) meter.style.transform = `scaleX(${Math.min(1, Math.abs(v) * 3).toFixed(3)})`;
  });
  return (
    <Stage r={root} g1="rgba(255,163,92,.42)" g2="rgba(79,141,255,.24)">
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          {M398_LINES.map((l, i) => (
            <div key={i} className="m398-line whitespace-nowrap text-[clamp(56px,6.4vw,104px)] font-[800] uppercase leading-[1.02] tracking-[-0.02em]" style={{ fontFamily: F.sy }}>
              {l.map((w, k) => (
                <span key={k} className={`m398-w inline-block will-change-transform ${k < l.length - 1 ? "mr-[0.28em]" : ""} ${k === 1 ? "text-[#ffa35c]" : ""}`}>
                  {w}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-5 right-6 w-[180px] text-right text-[12px] uppercase tracking-[0.18em] text-white/60">
        <p>Scroll speed</p>
        <div className="mt-2 h-[3px] w-full overflow-hidden rounded bg-white/15">
          <div className="m398-v h-full w-full origin-left bg-[#ffa35c]" style={{ transform: "scaleX(0)" }} />
        </div>
        <div className="mt-2 h-[2px] w-full overflow-hidden rounded bg-white/10">
          <div className="m398-p h-full w-full origin-left bg-white/60" style={{ transform: "scaleX(.5)" }} />
        </div>
      </div>
      <Caption>Kestrel Run · Tempo 3 · ₹11,490</Caption>
    </Stage>
  );
}

/* ───────────────────────── M399 · Vertical split halves (play, CSS) ───────────────────────── */
function M399() {
  const root = useRef<HTMLDivElement>(null);
  useOffClass(root, "m399-off");
  const head = "text-[clamp(60px,7vw,116px)] font-[500] leading-none tracking-[-0.02em] whitespace-nowrap";
  return (
    <Stage r={root} g1="rgba(255,163,92,.4)" g2="rgba(160,110,255,.22)">
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="mb-6 text-[13px] uppercase tracking-[0.22em] text-white/55">Maison Orel · autumn atelier</p>
          <div className="relative grid" style={{ fontFamily: F.fr }}>
            <span className={`m399-h m399-top ${head}`}>Two halves, one coat.</span>
            <span className={`m399-h m399-bot ${head} text-[#ffd2a8]`} aria-hidden>
              Two halves, one coat.
            </span>
            <span className="m399-seam pointer-events-none absolute left-[-3%] right-[-3%] top-1/2 h-px origin-center bg-[#ffa35c]" aria-hidden />
          </div>
          <p className="mt-8 text-[13px] uppercase tracking-[0.22em] text-white/60">Double-face wool · ₹24,800</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M400 · Warp-refraction text (play, OGL lens + auto pointer) ───────────────────────── */
const M400_FRAG = /* glsl */ `
uniform vec2 uMouse;
uniform float uStr;
float m(vec2 uv){ return texture2D(uTex0, cover(uv, uTexRes0)).a; }
void main(){
  vec2 asp = vec2(uRes.x / uRes.y, 1.0);
  vec2 off = vUv - uMouse;
  float dist = length(off * asp);
  float R = 0.21;
  float k = (1.0 - smoothstep(0.0, R, dist)) * uStr;
  k = k * k * (3.0 - 2.0 * k);
  float s = 1.0 - 0.45 * k;
  float ca = 0.04 * k;
  float r = m(uMouse + off * (s - ca));
  float g = m(uMouse + off * s);
  float b = m(uMouse + off * (s + ca));
  vec3 col = vec3(r, g, b) * vec3(0.93, 0.96, 1.0);
  float a = max(max(r, g), b);
  float ring = (1.0 - smoothstep(0.0, 0.005, abs(dist - R * 0.97))) * uStr * 0.35;
  col = mix(col, vec3(1.0, 0.64, 0.36), ring);
  a = max(a, ring);
  gl_FragColor = vec4(col, a);
}`;
function m400Text(w: number, h: number) {
  const d = 1.5;
  const c = document.createElement("canvas");
  c.width = Math.round(w * d);
  c.height = Math.round(h * d);
  const x = c.getContext("2d")!;
  x.scale(d, d);
  x.fillStyle = "#fff";
  x.textAlign = "center";
  x.textBaseline = "middle";
  const big = "See sharper.";
  let size = h * 0.26;
  x.font = `600 ${size}px "${F.fr}", Georgia, serif`;
  const mw = x.measureText(big).width;
  if (mw > w * 0.72) size *= (w * 0.72) / mw;
  x.font = `600 ${size}px "${F.fr}", Georgia, serif`;
  x.fillText(big, w / 2, h * 0.46);
  x.font = `500 ${Math.max(14, size * 0.16)}px "${F.mr}", system-ui, sans-serif`;
  x.fillText("OPTIKA · TITANIUM FRAMES · FROM ₹4,900", w / 2, h * 0.46 + size * 0.72);
  return c;
}
function M400() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const fb = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = root.current;
    const canvas = cv.current;
    if (!el || !canvas || prefersReducedMotion()) return;
    let dead = false;
    let h: GLHandle | null = null;
    const real = { x: 0.5, y: 0.5, t: -1e9, in: false };
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      real.x = (e.clientX - r.left) / r.width;
      real.y = (e.clientY - r.top) / r.height;
      real.t = performance.now();
      real.in = true;
    };
    const leave = () => (real.in = false);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    const cur = { x: 0.1, y: 0.5, s: 0 };
    let last = 0;
    let hid = false;
    (async () => {
      await document.fonts.ready;
      if (dead) return;
      const box = canvas.parentElement!.getBoundingClientRect();
      const tex = m400Text(Math.max(1, box.width), Math.max(1, box.height));
      h = await createShader(canvas, M400_FRAG, {
        textures: [tex],
        uniforms: { uMouse: { value: [0.5, 0.5] }, uStr: { value: 0 } },
        onFrame: (u, t) => {
          const dt = Math.min(0.1, last ? t - last : 0.016);
          last = t;
          const useReal = performance.now() - real.t < 1200;
          let tx: number, ty: number, on: boolean;
          if (useReal) {
            tx = real.x;
            ty = real.y;
            on = real.in;
          } else {
            // auto path for filming: a wide sweep that leaves the frame at both ends (lens eases out and back in)
            tx = 0.5 + 0.6 * Math.sin(t * 0.85);
            ty = 0.47 + 0.13 * Math.sin(t * 1.9 + 0.6);
            on = tx > 0.05 && tx < 0.95;
          }
          const k = 1 - Math.exp(-dt * 7);
          cur.x += (tx - cur.x) * k;
          cur.y += (ty - cur.y) * k;
          cur.s += ((on ? 1 : 0) - cur.s) * (1 - Math.exp(-dt * 5));
          u.uMouse.value = [cur.x, 1 - cur.y];
          u.uStr.value = cur.s;
          const d = dot.current;
          if (d) {
            d.style.transform = `translate3d(${cur.x * el.clientWidth}px,${cur.y * el.clientHeight}px,0)`;
            d.style.opacity = useReal ? "0" : (0.25 + 0.75 * cur.s).toFixed(2);
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
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      if (fb.current) fb.current.style.visibility = "";
    };
  }, []);
  return (
    <Stage r={root} g1="rgba(79,141,255,.42)" g2="rgba(255,163,92,.24)">
      <div ref={fb} className="absolute inset-0" aria-hidden>
        <p className="absolute left-0 right-0 top-[46%] -translate-y-1/2 text-center text-[clamp(64px,8.6vw,150px)] font-[600] leading-none text-[#eef4ff]" style={{ fontFamily: F.fr }}>
          See sharper.
        </p>
      </div>
      <div className="absolute inset-0">
        <canvas ref={cv} className="absolute inset-0 h-full w-full" style={{ opacity: 0 }} aria-label="See sharper." />
      </div>
      <span ref={dot} className="pointer-events-none absolute left-0 top-0 -ml-[9px] -mt-[9px] h-[18px] w-[18px] rounded-full border-2 border-white bg-white/20 opacity-0" aria-hidden />
    </Stage>
  );
}

/* ───────────────────────── M401 · Whip-in / roll-in text presets (play, SplitText) ───────────────────────── */
function M401() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const head = el.querySelector<HTMLElement>(".m401-h")!;
    const words = SplitText.create(head, { type: "words" }).words as HTMLElement[];
    const [cw, cr] = gsap.utils.toArray<HTMLElement>(".m401-chip", el);
    gsap.set(words, { transformOrigin: "50% 100% -30px" });
    const on = { opacity: 1, backgroundColor: "rgba(255,163,92,.95)", color: "#0a0f1c", duration: 0.2 };
    const off = { opacity: 0.55, backgroundColor: "rgba(255,255,255,0)", color: "#eaf5ff", duration: 0.2 };
    const tl = gsap.timeline({ repeat: -1 });
    // preset 1 · whip: a fast skewed slide from the left with an overshoot
    tl.to(cw, on, 0).to(cr, off, 0);
    tl.fromTo(
      words,
      { x: -170, skewX: -32, rotationX: 0, yPercent: 0, y: 0, autoAlpha: 0 },
      { x: 0, skewX: 0, autoAlpha: 1, duration: 0.6, ease: "back.out(2.6)", stagger: 0.07, immediateRender: false },
      0,
    );
    tl.to(words, { y: -26, autoAlpha: 0, duration: 0.28, ease: "power2.in", stagger: 0.03 }, "+=0.12");
    // preset 2 · roll: each word rolls up on X from below
    tl.to(cr, on, "<").to(cw, off, "<");
    tl.fromTo(
      words,
      { x: 0, skewX: 0, y: 0, rotationX: -100, yPercent: 70, autoAlpha: 0 },
      { rotationX: 0, yPercent: 0, autoAlpha: 1, duration: 0.7, ease: "power2.out", stagger: 0.08, immediateRender: false },
    );
    tl.to(words, { y: -26, autoAlpha: 0, duration: 0.28, ease: "power2.in", stagger: 0.03 }, "+=0.12");
    return tl;
  });
  const chip = "m401-chip rounded-full border border-white/25 px-4 py-1.5 text-[13px] font-[600] uppercase tracking-[0.16em]";
  return (
    <Stage r={root} g1="rgba(255,163,92,.42)" g2="rgba(79,141,255,.22)">
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="mb-8 flex justify-center gap-3" style={{ fontFamily: F.sg }}>
            <span className={chip} style={{ background: "rgba(255,163,92,.95)", color: "#0a0f1c" }}>
              Preset · Whip
            </span>
            <span className={chip} style={{ opacity: 0.55 }}>
              Preset · Roll
            </span>
          </div>
          <h3 className="m401-h max-w-[16ch] text-[clamp(56px,6.2vw,100px)] font-[700] leading-[1.02] tracking-[-0.03em]" style={{ fontFamily: F.sg, perspective: "800px" }}>
            Built for the night run.
          </h3>
          <p className="mt-8 text-[13px] uppercase tracking-[0.22em] text-white/60">Nightline reflective jacket · ₹6,900</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M402 · Word token re-layout morph (play, Flip) ───────────────────────── */
// every token of both sentences; a/b = its position in sentence A / B (-1 = not in that sentence)
const M402_T = [
  { w: "your", a: 4, b: 0 },
  { w: "morning", a: 5, b: 1 },
  { w: "starts", a: -1, b: 2 },
  { w: "with", a: -1, b: 3 },
  { w: "slow", a: 0, b: 4 },
  { w: "baked", a: 1, b: 5 },
  { w: "sourdough", a: 2, b: 6 },
  { w: "for", a: 3, b: -1 },
];
function M402() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(
    root,
    (el, plug) => {
      const Flip = plug as typeof FlipT;
      const toks = gsap.utils.toArray<HTMLElement>(".m402-t", el);
      const rand = rng(402);
      let cur: "a" | "b" = "a";
      const morph = () => {
        const next = cur === "a" ? "b" : "a";
        const stay = toks.filter((_, i) => M402_T[i][cur] >= 0 && M402_T[i][next] >= 0);
        const leave = toks.filter((_, i) => M402_T[i][cur] >= 0 && M402_T[i][next] < 0);
        const enter = toks.filter((_, i) => M402_T[i][cur] < 0 && M402_T[i][next] >= 0);
        const state = Flip.getState(stay);
        // leaving words come out of the flow where they stand, then fly off
        leave.forEach((t) => {
          const l = t.offsetLeft;
          const tp = t.offsetTop;
          gsap.set(t, { position: "absolute", left: l, top: tp, margin: 0 });
        });
        toks.forEach((t, i) => {
          const o = M402_T[i][next];
          t.style.order = String(o >= 0 ? o : 99);
        });
        enter.forEach((t) => gsap.set(t, { display: "inline-block" }));
        Flip.from(state, { duration: 0.85, ease: "power2.inOut", stagger: 0.02 });
        gsap.to(leave, {
          x: () => (rand() - 0.5) * 520,
          y: () => -120 - rand() * 160,
          rotation: () => (rand() - 0.5) * 70,
          autoAlpha: 0,
          duration: 0.6,
          ease: "power2.in",
          onComplete: () => {
            gsap.set(leave, { clearProps: "position,left,top,margin,x,y,rotation", display: "none", autoAlpha: 1 });
          },
        });
        gsap.fromTo(enter, { autoAlpha: 0, scale: 0.4, y: 30 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.6, ease: "back.out(1.8)", delay: 0.3, stagger: 0.08 });
        cur = next;
      };
      const tl = gsap.timeline({ repeat: -1 });
      tl.call(morph, [], 0.05).call(morph, [], 1.25).to({}, { duration: 0.01 }, 2.44);
      return tl;
    },
    () => loadPlugin("Flip"),
  );
  return (
    <Stage r={root} g1="rgba(255,163,92,.42)" g2="rgba(24,196,143,.2)">
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="mb-7 text-[13px] uppercase tracking-[0.22em] text-white/55">Hearth bakehouse · since dawn</p>
          <div
            className="m402-box relative mx-auto flex w-[min(74vw,1000px)] flex-wrap justify-center gap-x-[0.28em] text-[clamp(48px,5vw,84px)] font-[500] leading-[1.12] tracking-[-0.01em]"
            style={{ fontFamily: F.fr }}
          >
            {M402_T.map((t, i) => (
              <span key={i} className={`m402-t inline-block ${t.w === "sourdough" ? "italic text-[#ffb36b]" : ""}`} style={{ order: t.a >= 0 ? t.a : 99, display: t.a >= 0 ? "inline-block" : "none" }}>
                {t.w}
              </span>
            ))}
          </div>
          <p className="mt-8 text-[13px] uppercase tracking-[0.22em] text-white/60">Country loaf · 800 g · ₹340</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── shared: phrase swap (M403–M405) ───────────────────────── */
type SwapFx = { set: (w: HTMLElement[]) => void; out: gsap.TweenVars; inFrom: gsap.TweenVars; inTo: gsap.TweenVars; inAt: number; outLen: number; hold: number };
/** N phrases stacked in one grid cell; out/in tweens swap them in a seamless loop (phrase 0 again at the end). */
function useSwap(root: RefObject<HTMLDivElement | null>, fx: (rand: () => number) => SwapFx, mask = false) {
  usePlay(root, (el) => {
    const lines = gsap.utils.toArray<HTMLElement>(".sw-line", el);
    const words = lines.map((l) => SplitText.create(l, mask ? { type: "words", mask: "words" } : { type: "words" }).words as HTMLElement[]);
    const f = fx(rng(lines.length * 97 + 5));
    lines.forEach((l) => gsap.set(l, { visibility: "visible" }));
    words.forEach((w) => f.set(w));
    words.slice(1).forEach((w) => gsap.set(w, f.inFrom));
    const tl = gsap.timeline({ repeat: -1 });
    let t = f.hold;
    for (let i = 0; i < lines.length; i++) {
      const a = words[i];
      const b = words[(i + 1) % lines.length];
      tl.to(a, { ...f.out, immediateRender: false }, t);
      tl.fromTo(b, { ...f.inFrom }, { ...f.inTo, immediateRender: false }, t + f.inAt);
      t += f.outLen + f.hold;
    }
    // first phrase was already shown at time 0: make sure its words are flat at the loop start
    const flat: gsap.TweenVars = { ...f.inTo };
    delete flat.duration;
    delete flat.ease;
    delete flat.stagger;
    tl.set(words[0], flat, 0);
    tl.to({}, { duration: 0.01 }, t);
    return tl;
  });
}
function SwapLines({ phrases, className, style }: { phrases: string[]; className: string; style?: CSSProperties }) {
  return (
    <div className="grid justify-items-center" style={style}>
      {phrases.map((p, i) => (
        <h3 key={i} className={`sw-line [grid-area:1/1] ${className}`} style={{ visibility: i === 0 ? "visible" : "hidden" }} aria-hidden={i > 0}>
          {p}
        </h3>
      ))}
    </div>
  );
}

/* ───────────────────────── M403 · Words flip down on X (play, SplitText) ───────────────────────── */
function M403() {
  const root = useRef<HTMLDivElement>(null);
  useSwap(root, () => ({
    set: (w) => gsap.set(w, { transformPerspective: 700 }),
    out: { rotationX: -90, transformOrigin: "50% 100%", autoAlpha: 0, duration: 0.42, ease: "power2.in", stagger: 0.05 },
    inFrom: { rotationX: 90, transformOrigin: "50% 0%", autoAlpha: 0 },
    inTo: { rotationX: 0, transformOrigin: "50% 0%", autoAlpha: 1, duration: 0.5, ease: "power2.out", stagger: 0.05 },
    inAt: 0.3,
    outLen: 0.95,
    hold: 0.2,
  }));
  return (
    <Stage r={root} g1="rgba(255,163,92,.42)" g2="rgba(79,141,255,.24)">
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="mb-7 text-[13px] uppercase tracking-[0.22em] text-white/55">Hotel Saltmarsh · Goa</p>
          <SwapLines
            phrases={["Rooms by the sea.", "Breakfast till noon.", "Late checkout, always."]}
            className="whitespace-nowrap text-[clamp(52px,5.6vw,92px)] font-[700] leading-none tracking-[-0.03em]"
            style={{ fontFamily: F.sg }}
          />
          <p className="mt-8 text-[13px] uppercase tracking-[0.22em] text-white/60">Sea-view suite · from ₹14,500 / night</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M404 · Words rise out with tilt (play, SplitText masks) ───────────────────────── */
function M404() {
  const root = useRef<HTMLDivElement>(null);
  useSwap(
    root,
    () => ({
      set: (w) => gsap.set(w, { transformOrigin: "0% 100%" }),
      out: { yPercent: -125, rotation: 3, duration: 0.5, ease: "power2.in", stagger: 0.04 },
      inFrom: { yPercent: 125, rotation: 3 },
      inTo: { yPercent: 0, rotation: 0, duration: 0.6, ease: "back.out(1.7)", stagger: 0.05 },
      inAt: 0.32,
      outLen: 1.0,
      hold: 0.18,
    }),
    true,
  );
  return (
    <Stage r={root} g1="rgba(255,122,160,.4)" g2="rgba(255,190,110,.22)">
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="mb-7 text-[13px] uppercase tracking-[0.22em] text-white/55">Velour skin · night ritual</p>
          <SwapLines
            phrases={["Soft by morning.", "Glow, not shine.", "Three drops, done."]}
            className="whitespace-nowrap text-[clamp(56px,6vw,100px)] leading-[1.08] tracking-[-0.01em]"
            style={{ fontFamily: F.is }}
          />
          <p className="mt-8 text-[13px] uppercase tracking-[0.22em] text-white/60">Rosehip night oil · 30 ml · ₹1,850</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M405 · Words scatter into Z depth (play, SplitText 3D) ───────────────────────── */
function M405() {
  const root = useRef<HTMLDivElement>(null);
  useSwap(root, (rand) => ({
    set: (w) => gsap.set(w, { transformPerspective: 1200 }),
    out: { z: () => -400 - rand() * 300, rotationX: () => (rand() - 0.5) * 140, autoAlpha: 0, duration: 0.6, ease: "power2.in", stagger: 0.04 },
    inFrom: { z: () => 400 + rand() * 300, rotationX: () => (rand() - 0.5) * 60, autoAlpha: 0 },
    inTo: { z: 0, rotationX: 0, autoAlpha: 1, duration: 0.7, ease: "power2.out", stagger: 0.05 },
    inAt: 0.35,
    outLen: 1.1,
    hold: 0.15,
  }));
  return (
    <Stage r={root} g1="rgba(120,140,255,.42)" g2="rgba(255,163,92,.22)" top>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="mb-7 text-[13px] uppercase tracking-[0.22em] text-white/55">Orbit audio · studio line</p>
          <SwapLines
            phrases={["Hear every layer.", "Silence on demand.", "Forty hours of play."]}
            className="whitespace-nowrap text-[clamp(40px,4.3vw,70px)] font-[800] uppercase leading-none tracking-[-0.02em]"
            style={{ fontFamily: F.sy }}
          />
          <p className="mt-8 text-[13px] uppercase tracking-[0.22em] text-white/60">Orbit One headphones · ₹18,990</p>
        </div>
      </div>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M398", name: "Velocity spring text", how: "Words lag behind the scroll by its speed and spring back when it stops, while the lines drift sideways with the scroll · scrubbed", kind: "scrub", C: M398 },
  { code: "M399", name: "Vertical split halves", how: "Top and bottom halves of a line (two clipped copies) slide in from opposite sides and meet into one line · CSS loop", kind: "play", C: M399 },
  { code: "M400", name: "Warp-refraction text (WebGL)", how: "A lens bulges and refracts the type with a chromatic fringe around the pointer, easing back when it leaves · auto pointer path", kind: "play", C: M400 },
  { code: "M401", name: "Whip-in / roll-in text presets", how: "Words whip in (fast skewed slide with overshoot), leave, then roll up on X from below · two presets, loops", kind: "play", C: M401 },
  { code: "M402", name: "Word token re-layout morph", how: "One sentence becomes another: shared words glide to new places (Flip), dropped words fly off, new words pop in · loops", kind: "play", C: M402 },
  { code: "M403", name: "Words flip down on X", how: "Old words turn down to -90° on their bottom edge and new words flip in from 90°, like flaps turning over · loops", kind: "play", C: M403 },
  { code: "M404", name: "Words rise out with tilt", how: "Old words rise out of their masks with a 3° tilt, new words arrive from below with a back ease · loops", kind: "play", C: M404 },
  { code: "M405", name: "Words scatter into Z depth", how: "Old words fly back into depth with random tilt, new words arrive from in front of the screen and land flat · loops", kind: "play", C: M405 },
];
