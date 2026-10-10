"use client";

// Ambient motions, batch 11 · group 5 (MOTION-MENU M578–M589). Small focused demos for /lab/motion.
// Every demo plays by itself while on screen and pauses off screen: M578–M583 are CSS keyframe loops (their play state
// is switched on by an IntersectionObserver), M584–M589 are OGL fragment shaders (dpr 1, created only when the stage is
// within ~1 screen, drawn only while visible). Each stage also has a CSS-only glow loop that never stops; a second one
// sits ON TOP of full-bleed colour / canvases. ?static=1 / reduced motion: no WebGL, CSS loops stop, the markup shows a
// sensible final state.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { createShader, type GLHandle } from "@/lib/gl";
import type { MotionDef } from "./types";

const F = {
  sg: "'Space Grotesk Variable', system-ui, sans-serif",
  fr: "'Fraunces Variable', Georgia, serif",
  is: "'Instrument Serif', Georgia, serif",
  sy: "'Syne Variable', 'Space Grotesk Variable', system-ui, sans-serif",
  mr: "'Manrope Variable', system-ui, sans-serif",
};

const CSS = `
@property --m581h{syntax:'<number>';inherits:true;initial-value:28}
.b11g5-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.5)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.22)),transparent 70%);animation:b11g5-drift 5.6s linear infinite alternate;will-change:transform}
@keyframes b11g5-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b11g5-run{animation-play-state:paused !important}
.b11g5-on .b11g5-run{animation-play-state:running !important}

/* M578 expanding blurred leaves */
.m578-field{position:absolute;inset:0;isolation:isolate}
.m578-leaf{position:absolute;width:var(--w);aspect-ratio:1/1.35;margin:calc(var(--w) * -.675) 0 0 calc(var(--w) * -.5);border-radius:0 100% 0 100%;background:radial-gradient(70% 70% at 35% 35%,var(--c),transparent 78%);filter:blur(26px);mix-blend-mode:screen;opacity:.7;transform:rotate(var(--r)) scale(1);animation:m578-bloom 6s cubic-bezier(.25,.6,.35,1) infinite;animation-delay:var(--dl);will-change:transform,opacity}
@keyframes m578-bloom{0%{transform:rotate(var(--r)) scale(.12);opacity:0}30%{opacity:.95}70%{opacity:.6}100%{transform:rotate(calc(var(--r) + 28deg)) scale(1.7);opacity:0}}

/* M579 background pan (three directions) */
.m579-card{position:relative;overflow:hidden;border-radius:22px;border:1px solid rgba(255,255,255,.12)}
.m579-lr{background:linear-gradient(90deg,#1d2b6b,#6a3fc4,#ff7a59,#ffc78f,#6a3fc4,#1d2b6b);background-size:300% 100%;background-position:0% 50%;animation:m579-lr 5s ease-in-out infinite alternate}
.m579-ud{background:linear-gradient(180deg,#0f3d3a,#2f8f7a,#d9e8a8,#2f8f7a,#0f3d3a,#123a5c);background-size:100% 300%;background-position:50% 0%;animation:m579-ud 4.6s ease-in-out infinite alternate}
.m579-dg{background:linear-gradient(135deg,#3a0f2e,#b23a6a,#ffb38a,#f7e6c4,#b23a6a,#3a0f2e);background-size:300% 300%;background-position:0% 0%;animation:m579-dg 5.4s ease-in-out infinite alternate}
@keyframes m579-lr{to{background-position:100% 50%}}
@keyframes m579-ud{to{background-position:50% 100%}}
@keyframes m579-dg{to{background-position:100% 100%}}

/* M580 background colour cycle */
.m580-bg{position:absolute;inset:0;background-color:#b5462a;animation:m580-cycle 10s infinite}
@keyframes m580-cycle{0%{background-color:#b5462a;animation-timing-function:ease-in-out}25%{background-color:#b0781a;animation-timing-function:ease-in-out}50%{background-color:#2f6b55;animation-timing-function:ease-in-out}75%{background-color:#34479a;animation-timing-function:ease-in-out}100%{background-color:#b5462a}}

/* M581 radial hue cycle */
.m581-light{position:absolute;left:50%;top:52%;width:min(78%,1000px);aspect-ratio:1;margin:calc(min(78%,1000px) * -.5) 0 0 calc(min(78%,1000px) * -.5);border-radius:50%;background:radial-gradient(closest-side,hsl(var(--m581h) 92% 66% / .95),hsl(calc(var(--m581h) + 38) 85% 50% / .5) 42%,hsl(calc(var(--m581h) + 70) 80% 40% / .14) 68%,transparent 100%);animation:m581-hue 16s linear infinite,m581-breathe 4.2s ease-in-out infinite alternate}
@keyframes m581-hue{0%{--m581h:28}100%{--m581h:388}}
@keyframes m581-breathe{0%{transform:scale(.92)}100%{transform:scale(1.08)}}

/* M582 moving gradient text */
.m582-text{background:linear-gradient(90deg,#ffd9a8,#ff8a6a,#fff3e6,#9cc0ff,#cdb2ff,#ffe1b8,#ff8a6a,#ffd9a8);background-size:300% 100%;background-position:0% 50%;-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;animation:m582-slide 3s ease-in-out infinite alternate}
@keyframes m582-slide{to{background-position:100% 50%}}

/* M583 rotating screen-blend blobs */
.m583-field{position:absolute;inset:0;isolation:isolate}
.m583-arm{position:absolute;left:50%;top:50%;width:0;height:0;mix-blend-mode:screen;transform:rotate(var(--a0));animation:m583-spin var(--du) linear infinite;animation-direction:var(--dir)}
.m583-blob{position:absolute;left:var(--rad);top:0;width:var(--s);height:var(--s);margin:calc(var(--s) * -.5) 0 0 calc(var(--s) * -.5);border-radius:50%;background:radial-gradient(closest-side,var(--c),transparent);filter:blur(30px)}
@keyframes m583-spin{0%{transform:rotate(var(--a0))}100%{transform:rotate(calc(var(--a0) + 360deg))}}

html.is-static .b11g5-glow,html.is-static .b11g5-run,html.is-static .m581-light{animation:none}
html.is-static {
  .b11g5-glow,.b11g5-run,.m581-light{animation:none}
}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", g1, g2, style }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string; style?: CSSProperties }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0d16] text-[#eef2ff] ${className}`} style={style}>
      <style href="b11g5-css" precedence="default">
        {CSS}
      </style>
      <div className="b11g5-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/** The CSS glow loop again, ON TOP of full-bleed colour / canvases, so those demos never freeze. */
const Sheen = ({ g1, blend = "screen", opacity = 0.45 }: { g1?: string; blend?: CSSProperties["mixBlendMode"]; opacity?: number }) => (
  <div className="b11g5-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: blend, opacity, zIndex: 35 } as CSSProperties} aria-hidden />
);

/** CSS-driven demos: toggles `b11g5-on` on the root while it is on screen (the `.b11g5-run` keyframes run only then). */
function useOn(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const io = new IntersectionObserver(([e]) => el.classList.toggle("b11g5-on", e.isIntersecting), { threshold: 0.1 });
    io.observe(el);
    return () => {
      io.disconnect();
      el.classList.remove("b11g5-on");
    };
  }, [ref]);
}

/**
 * One OGL canvas (dpr 1) over a CSS fallback. The GL context is created only once the stage is within ~1 screen of the
 * viewport; lib/gl draws only while on screen and the canvas fades in after its first frame. Reduced motion /
 * ?static=1: no WebGL, the fallback stays.
 */
function Shader({ frag, fallback }: { frag: string; fallback: string }) {
  const box = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = box.current;
    if (!el || prefersReducedMotion()) return;
    let dead = false;
    let started = false;
    let h: GLHandle | null = null;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || started) return;
        started = true;
        io.disconnect();
        (async () => {
          if (!cv.current || dead) return;
          h = await createShader(cv.current, frag, { dpr: 1 });
          if (dead) h?.destroy();
        })();
      },
      { rootMargin: "900px 0px" },
    );
    io.observe(el);
    return () => {
      dead = true;
      io.disconnect();
      h?.destroy();
    };
  }, [frag]);
  return (
    <div ref={box} className="absolute inset-0" style={{ background: fallback }}>
      <canvas ref={cv} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500" aria-hidden />
    </div>
  );
}

/* Our own small GLSL noise kit: hash → value noise → fbm, a gradient simplex noise, a 2D rotation. */
const NOISE = /* glsl */ `
float hsh(vec2 p) { p = fract(p * vec2(127.13, 311.71)); p += dot(p, p + 41.37); return fract(p.x * p.y); }
float vno(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hsh(i), hsh(i + vec2(1.0, 0.0)), f.x), mix(hsh(i + vec2(0.0, 1.0)), hsh(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  mat2 m = mat2(0.82, -0.57, 0.57, 0.82);
  for (int i = 0; i < 5; i++) { s += a * vno(p); p = m * p * 2.02 + 0.31; a *= 0.5; }
  return s;
}
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
vec2 sgrad(vec2 c, float t) { float a = hsh(c) * 6.2831853 + t * (0.6 + hsh(c + 7.1)); return vec2(cos(a), sin(a)); }
float snoise(vec2 p, float t) {
  const float K1 = 0.36602540, K2 = 0.21132487;
  vec2 i = floor(p + (p.x + p.y) * K1);
  vec2 a = p - i + (i.x + i.y) * K2;
  vec2 o = a.x > a.y ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec2 b = a - o + K2;
  vec2 c = a - 1.0 + 2.0 * K2;
  vec3 w = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
  w = w * w * w * w;
  vec3 n = vec3(dot(sgrad(i, t), a), dot(sgrad(i + o, t), b), dot(sgrad(i + 1.0, t), c));
  return 70.0 * dot(w, n);
}
`;

/** Kicker / headline / meta text block used on the overlays. */
function Copy({ kicker, title, meta, font = F.fr, className = "", size = "clamp(48px,5.6vw,92px)", color }: { kicker: string; title: ReactNode; meta?: string; font?: string; className?: string; size?: string; color?: string }) {
  return (
    <div className={`pointer-events-none relative z-40 ${className}`} style={{ color }}>
      <p className="text-[13px] uppercase tracking-[0.26em] opacity-75">{kicker}</p>
      <h3 className="mt-3 font-[500] leading-[0.94] tracking-[-0.02em]" style={{ fontFamily: font, fontSize: size }}>
        {title}
      </h3>
      {meta && <p className="mt-4 text-[15px] opacity-80">{meta}</p>}
    </div>
  );
}

/* ---------- M578 · Expanding blurred leaves (variant of M52: soft leaves bloom from points and mix where they cross) ---------- */
const LEAVES: { x: string; y: string; w: string; c: string; r: number }[] = [
  { x: "28%", y: "40%", w: "34%", c: "#7be0a8", r: -24 },
  { x: "66%", y: "34%", w: "30%", c: "#ffb36b", r: 38 },
  { x: "48%", y: "70%", w: "36%", c: "#5aa8ff", r: 110 },
  { x: "78%", y: "68%", w: "28%", c: "#e07bd0", r: -70 },
  { x: "18%", y: "72%", w: "28%", c: "#ffe08a", r: 160 },
  { x: "56%", y: "26%", w: "32%", c: "#3fd0c4", r: 12 },
  { x: "38%", y: "52%", w: "30%", c: "#ff7a7a", r: -130 },
  { x: "84%", y: "38%", w: "26%", c: "#a99bff", r: 72 },
];
function M578() {
  const root = useRef<HTMLDivElement>(null);
  useOn(root);
  return (
    <Stage r={root} className="bg-[#070b0a]" g1="rgba(120,230,170,.5)">
      <div className="m578-field" aria-hidden>
        {LEAVES.map((l, i) => (
          <span key={i} className="m578-leaf b11g5-run" style={{ left: l.x, top: l.y, "--w": l.w, "--c": l.c, "--r": `${l.r}deg`, "--dl": `${-i * 0.75}s` } as CSSProperties} />
        ))}
      </div>
      <Sheen g1="rgba(150,240,190,.5)" />
      <div className="absolute inset-0 grid place-items-center text-center">
        <Copy kicker="Verdane Botanica · Spring Edit" title="Grown, not made." meta="Leaf serum · 30 ml · ₹ 1,850" className="text-[#f4fff8]" size="clamp(56px,6.6vw,110px)" />
      </div>
    </Stage>
  );
}

/* ---------- M579 · Background pan (variant of M52: one oversized gradient slides its position, three directions) ---------- */
function M579() {
  const root = useRef<HTMLDivElement>(null);
  useOn(root);
  const cards: { cls: string; dir: string; name: string; price: string }[] = [
    { cls: "m579-lr", dir: "Left ↔ right", name: "Dusk Throw", price: "₹ 4,200" },
    { cls: "m579-ud", dir: "Up ↕ down", name: "Tide Runner", price: "₹ 2,650" },
    { cls: "m579-dg", dir: "Diagonal ⤡", name: "Rosewater Slip", price: "₹ 3,900" },
  ];
  return (
    <Stage r={root} g1="rgba(160,120,255,.5)">
      <div className="flex h-full flex-col px-[5%] py-[5%]">
        <div className="flex items-end justify-between gap-6">
          <Copy kicker="Halcyon Loom · Colour Study" title="One gradient, always moving." size="clamp(36px,3.8vw,62px)" />
          <p className="max-w-[300px] pb-2 text-[14px] text-white/65">An oversized background slides its position slowly back and forth.</p>
        </div>
        <div className="mt-[3%] grid min-h-0 flex-1 grid-cols-3 gap-[2%]">
          {cards.map((c) => (
            <div key={c.cls} className={`m579-card b11g5-run ${c.cls}`}>
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/55 to-transparent p-5 pt-16">
                <div>
                  <p className="text-[12px] uppercase tracking-[0.22em] text-white/75">{c.dir}</p>
                  <p className="mt-1 text-[22px] font-[500] text-white" style={{ fontFamily: F.sg }}>
                    {c.name}
                  </p>
                </div>
                <p className="text-[15px] text-white/85">{c.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Sheen g1="rgba(200,160,255,.5)" opacity={0.3} />
    </Stage>
  );
}

/* ---------- M580 · Background colour cycle (variant of M10: the colour changes on a time loop, not with scroll) ---------- */
function M580() {
  const root = useRef<HTMLDivElement>(null);
  useOn(root);
  const shades = ["#b5462a", "#b0781a", "#2f6b55", "#34479a"];
  return (
    <Stage r={root} g1="rgba(255,255,255,.5)">
      <div className="m580-bg b11g5-run" aria-hidden />
      <Sheen g1="rgba(255,240,220,.5)" opacity={0.35} />
      <div className="relative z-40 flex h-full flex-col justify-between p-[6%] text-white">
        <p className="text-[13px] uppercase tracking-[0.3em] text-white/80">Kalm Ceramics · Glaze Library</p>
        <div>
          <h3 className="max-w-[12ch] text-[clamp(60px,7vw,120px)] font-[500] leading-[0.9] tracking-[-0.03em]" style={{ fontFamily: F.is }}>
            Every glaze, in turn.
          </h3>
          <div className="mt-8 flex items-center gap-6">
            <div className="flex gap-2">
              {shades.map((s) => (
                <span key={s} className="h-7 w-7 rounded-full border-2 border-white/80" style={{ background: s }} />
              ))}
            </div>
            <p className="text-[15px] text-white/85">Stoneware cup · four glazes · ₹ 1,450</p>
          </div>
        </div>
      </div>
    </Stage>
  );
}

/* ---------- M581 · Radial hue cycle (variant of M580: only the centre light changes hue, slowly) ---------- */
function M581() {
  const root = useRef<HTMLDivElement>(null);
  useOn(root);
  return (
    <Stage r={root} className="bg-[#06070c]" g1="rgba(255,255,255,.14)" g2="transparent">
      <div className="m581-light b11g5-run" aria-hidden />
      <div className="absolute inset-0 grid place-items-center text-center">
        <Copy kicker="Lumen Habitat · Smart Lamp" title={<>Light that changes<br />its mind.</>} meta="Halo lamp · 16 M colours · ₹ 8,900" className="text-white" size="clamp(52px,6vw,100px)" />
      </div>
    </Stage>
  );
}

/* ---------- M582 · Moving gradient text (variant of M49: the fill slides back and forth inside the letters) ---------- */
function M582() {
  const root = useRef<HTMLDivElement>(null);
  useOn(root);
  return (
    <Stage r={root} g1="rgba(255,138,106,.5)" g2="rgba(156,192,255,.3)">
      <div className="flex h-full flex-col items-center justify-center px-[6%] text-center">
        <p className="text-[13px] uppercase tracking-[0.3em] text-white/70">Orbit Audio · Drop 04</p>
        <h3 className="m582-text b11g5-run mt-4 text-[clamp(72px,9vw,150px)] font-[800] uppercase leading-[0.9] tracking-[-0.03em]" style={{ fontFamily: F.sy }}>
          Made to move
        </h3>
        <p className="mt-6 text-[16px] text-white/75">Wireless buds · 40 h battery · ₹ 5,499</p>
        <span className="mt-8 rounded-full border border-white/25 px-6 py-3 text-[14px] text-white/90">Pre-order now</span>
      </div>
    </Stage>
  );
}

/* ---------- M583 · Rotating screen-blend blobs (variant of M52: blobs orbit the centre; overlaps brighten) ---------- */
const ORBS: { rad: string; s: string; c: string; du: string; dir: string; a0: number }[] = [
  { rad: "8vw", s: "34vw", c: "#ff3d6e", du: "7s", dir: "normal", a0: 0 },
  { rad: "14vw", s: "30vw", c: "#2f7bff", du: "9s", dir: "reverse", a0: 120 },
  { rad: "18vw", s: "26vw", c: "#18d6a0", du: "6s", dir: "normal", a0: 240 },
  { rad: "4vw", s: "22vw", c: "#ffb020", du: "5s", dir: "reverse", a0: 60 },
  { rad: "22vw", s: "20vw", c: "#a24bff", du: "11s", dir: "normal", a0: 200 },
];
function M583() {
  const root = useRef<HTMLDivElement>(null);
  useOn(root);
  return (
    <Stage r={root} className="bg-[#04050a]" g1="rgba(120,140,255,.5)">
      <div className="m583-field" aria-hidden>
        {ORBS.map((o, i) => (
          <div key={i} className="m583-arm b11g5-run" style={{ "--du": o.du, "--dir": o.dir, "--a0": `${o.a0}deg` } as CSSProperties}>
            <div className="m583-blob" style={{ "--rad": o.rad, "--s": o.s, "--c": o.c } as CSSProperties} />
          </div>
        ))}
      </div>
      <Sheen g1="rgba(160,170,255,.5)" opacity={0.35} />
      <div className="absolute bottom-[9%] left-[6%]">
        <Copy kicker="Prism Labs · Studio Display" title="Colour, in orbit." meta="27″ panel · 98% P3 · ₹ 64,000" font={F.sg} className="text-white" size="clamp(48px,5.4vw,88px)" />
      </div>
    </Stage>
  );
}

/* ---------- M584 · Sine colour bands (variant of M52: hard-edged stacked bands undulate as sine waves with phase drift) ---------- */
const BANDS = /* glsl */ `
vec3 pal7(float k) {
  k = clamp(k, 0.0, 6.0);
  vec3 c0 = vec3(0.04, 0.06, 0.14), c1 = vec3(0.10, 0.15, 0.38), c2 = vec3(0.23, 0.23, 0.60), c3 = vec3(0.48, 0.29, 0.77);
  vec3 c4 = vec3(0.82, 0.34, 0.60), c5 = vec3(1.00, 0.54, 0.42), c6 = vec3(1.00, 0.78, 0.56);
  if (k < 1.0) return mix(c0, c1, k);
  if (k < 2.0) return mix(c1, c2, k - 1.0);
  if (k < 3.0) return mix(c2, c3, k - 2.0);
  if (k < 4.0) return mix(c3, c4, k - 3.0);
  if (k < 5.0) return mix(c4, c5, k - 4.0);
  return mix(c5, c6, k - 5.0);
}
void main() {
  vec2 uv = vUv;
  float asp = uRes.x / max(uRes.y, 1.0);
  float x = uv.x * asp;
  float t = uTime;
  float idx = 0.0;
  float shade = 0.0;
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float b = (fi + 1.0) / 7.0
      + 0.05 * sin(x * (1.5 + fi * 0.32) + t * (0.6 + fi * 0.13) + fi * 1.7)
      + 0.022 * sin(x * (3.4 - fi * 0.25) - t * (0.45 + fi * 0.09) + fi * 2.9);
    float d = uv.y - b;
    idx += smoothstep(-0.004, 0.004, d);
    shade += d > 0.0 ? exp(-d * 34.0) * 0.22 : 0.0;
    shade -= d < 0.0 ? exp(d * 60.0) * 0.08 : 0.0;
  }
  vec3 col = pal7(6.0 - idx);
  col *= 1.0 - shade;
  col += 0.03 * sin(x * 2.0 + t * 0.7 + uv.y * 3.0);
  gl_FragColor = vec4(col, 1.0);
}`;
function M584() {
  return (
    <Stage className="bg-[#0a0f24]" g1="rgba(150,120,255,.5)">
      <Shader frag={BANDS} fallback="linear-gradient(180deg,#0a0f24 0 14%,#1a2660 14% 28%,#3b3a9a 28% 43%,#7b4bc4 43% 57%,#d0569a 57% 71%,#ff8a6a 71% 86%,#ffc78f 86%)" />
      <Sheen g1="rgba(200,160,255,.5)" opacity={0.3} />
      <div className="absolute left-[6%] top-[8%]">
        <Copy kicker="Strata Swim · Resort 26" title="Wear the horizon." meta="Striped one-piece · ₹ 3,200" font={F.sg} className="text-white" size="clamp(44px,5vw,82px)" />
      </div>
    </Stage>
  );
}

/* ---------- M585 · Simplex noise bands (variant of M52: noise contours quantised into soft colour bands) ---------- */
const NBANDS = /* glsl */ `${NOISE}
vec3 pal6(float k) {
  k = mod(k, 6.0);
  vec3 c0 = vec3(0.95, 0.91, 0.83), c1 = vec3(0.87, 0.73, 0.55), c2 = vec3(0.76, 0.48, 0.33);
  vec3 c3 = vec3(0.42, 0.30, 0.25), c4 = vec3(0.25, 0.36, 0.30), c5 = vec3(0.56, 0.66, 0.52);
  if (k < 1.0) return mix(c0, c1, k);
  if (k < 2.0) return mix(c1, c2, k - 1.0);
  if (k < 3.0) return mix(c2, c3, k - 2.0);
  if (k < 4.0) return mix(c3, c4, k - 3.0);
  if (k < 5.0) return mix(c4, c5, k - 4.0);
  return mix(c5, c0, k - 5.0);
}
void main() {
  float asp = uRes.x / max(uRes.y, 1.0);
  vec2 p = (vUv - 0.5) * vec2(asp, 1.0);
  float t = uTime * 0.35;
  float n = snoise(p * 1.25 + vec2(t * 0.18, -t * 0.12), t) * 0.7 + snoise(p * 2.6 - vec2(t * 0.1, 0.0), t * 1.3) * 0.3;
  float k = (n * 0.5 + 0.5) * 6.0 + 0.4;
  float f = fract(k);
  float i = floor(k);
  vec3 col = mix(pal6(i), pal6(i + 1.0), smoothstep(0.82, 1.0, f));
  col *= 0.94 + 0.06 * smoothstep(0.0, 0.25, f);
  gl_FragColor = vec4(col, 1.0);
}`;
function M585() {
  return (
    <Stage className="bg-[#efe6d4]" g1="rgba(255,236,200,.5)">
      <Shader frag={NBANDS} fallback="radial-gradient(60% 70% at 30% 40%,#f2e8d4 0 30%,#ddb98c 30% 45%,#c27a54 45% 58%,transparent 58%),radial-gradient(50% 60% at 75% 65%,#405c4c 0 25%,#8fa885 25% 45%,transparent 45%),#6b4c40" />
      <Sheen g1="rgba(255,236,200,.5)" opacity={0.3} />
      <div className="absolute inset-0 grid place-items-center">
        <div className="rounded-[26px] border border-white/40 bg-[#1c1512]/55 px-12 py-10 text-center">
          <Copy kicker="Terrain Atelier · Rug Collection" title="Mapped by hand." meta="Hand-tufted wool · 6 × 9 ft · ₹ 38,000" className="text-[#fbf3e6]" size="clamp(46px,5vw,84px)" />
        </div>
      </div>
    </Stage>
  );
}

/* ---------- M586 · Warp stripes (variant of M52: straight stripes bent by noise so they flow like fabric) ---------- */
const WARP = /* glsl */ `${NOISE}
void main() {
  float asp = uRes.x / max(uRes.y, 1.0);
  vec2 p = vUv * vec2(asp, 1.0);
  float t = uTime;
  vec2 w = vec2(fbm(p * 1.3 + vec2(t * 0.07, -t * 0.05)), fbm(p * 1.3 + vec2(5.2, 1.7) - vec2(t * 0.06, t * 0.04))) - 0.5;
  vec2 q = p + w * 0.75;
  float s = sin((q.x * 0.9 + q.y * 0.45) * 30.0);
  float stripe = smoothstep(-0.25, 0.25, s);
  float fold = 0.5 + 0.5 * sin((w.x - w.y) * 9.0 + t * 0.35);
  vec3 ink = vec3(0.07, 0.08, 0.18);
  vec3 silk = vec3(0.78, 0.80, 0.92);
  vec3 col = mix(ink, silk, stripe * 0.85);
  col *= 0.55 + 0.75 * fold;
  col += vec3(0.95, 0.75, 0.55) * pow(fold, 6.0) * 0.18;
  gl_FragColor = vec4(col, 1.0);
}`;
function M586() {
  return (
    <Stage className="bg-[#0b0d1c]" g1="rgba(150,160,255,.5)">
      <Shader frag={WARP} fallback="repeating-linear-gradient(115deg,#121530 0 14px,#9a9cb8 14px 26px),#0b0d1c" />
      <Sheen g1="rgba(190,190,255,.5)" opacity={0.3} />
      <div className="absolute bottom-[9%] left-[6%] rounded-[22px] bg-[#070814]/70 px-9 py-8">
        <Copy kicker="Norrow Textiles · Pinstripe 02" title="It drapes itself." meta="Silk-blend scarf · 180 cm · ₹ 2,900" className="text-white" size="clamp(42px,4.6vw,76px)" />
      </div>
    </Stage>
  );
}

/* ---------- M587 · Swirl (variant of M52: polar rotation stronger toward the centre twists the colours) ---------- */
const SWIRL = /* glsl */ `${NOISE}
void main() {
  float asp = uRes.x / max(uRes.y, 1.0);
  vec2 p = (vUv - vec2(0.62, 0.5)) * vec2(asp, 1.0);
  float t = uTime;
  float d = length(p);
  float a = atan(p.y, p.x);
  a += (1.4 + 0.5 * sin(t * 0.25)) / (d + 0.22) + t * 0.22;
  float v1 = 0.5 + 0.5 * sin(a * 3.0 + d * 5.0);
  float v2 = 0.5 + 0.5 * sin(a * 2.0 - d * 7.0 + t * 0.4);
  vec3 c1 = vec3(0.98, 0.42, 0.26), c2 = vec3(0.99, 0.82, 0.55), c3 = vec3(0.16, 0.12, 0.42);
  vec3 col = mix(c3, c1, smoothstep(0.15, 0.85, v1));
  col = mix(col, c2, smoothstep(0.55, 1.0, v2) * 0.75);
  col *= 1.0 - smoothstep(0.3, 1.25, d) * 0.55;
  col += 0.04 * (vno(p * 8.0 + t) - 0.5);
  gl_FragColor = vec4(col, 1.0);
}`;
function M587() {
  return (
    <Stage className="bg-[#120e2a]" g1="rgba(255,140,90,.5)">
      <Shader frag={SWIRL} fallback="conic-gradient(from 40deg at 62% 50%,#f96b42,#fdd18c,#2a1f6b,#f96b42,#fdd18c,#2a1f6b,#f96b42)" />
      <Sheen g1="rgba(255,170,120,.5)" opacity={0.3} />
      <div className="absolute left-[6%] top-1/2" style={{ transform: "translateY(-50%)" }}>
        <div className="rounded-[22px] bg-[#0b0820]/60 px-9 py-8">
          <Copy kicker="Vortex Gelato · Summer Cup" title={<>Stir it<br />slowly.</>} meta="Mango swirl · 500 ml · ₹ 420" className="text-white" size="clamp(52px,6vw,100px)" />
        </div>
      </div>
    </Stage>
  );
}

/* ---------- M588 · Sliding colour panels (variant of M52: tall translucent panels slide apart and back, blending) ---------- */
const PANELS = /* glsl */ `${NOISE}
vec3 pcol(float i) {
  if (i < 0.5) return vec3(1.0, 0.36, 0.30);
  if (i < 1.5) return vec3(1.0, 0.70, 0.28);
  if (i < 2.5) return vec3(0.30, 0.80, 0.70);
  if (i < 3.5) return vec3(0.34, 0.48, 1.0);
  return vec3(0.72, 0.40, 0.98);
}
void main() {
  float asp = uRes.x / max(uRes.y, 1.0);
  vec2 p = (vUv - 0.5) * vec2(asp, 1.0);
  float t = uTime;
  float open = 0.5 - 0.5 * cos(t * 0.85);
  vec3 col = vec3(0.025, 0.03, 0.06) + 0.05 * vec3(0.3, 0.3, 0.6) * (1.0 - length(p));
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float side = fi - 2.0;
    float depth = 0.78 + 0.08 * fi;
    vec2 c = vec2(side * (0.06 + 0.3 * open) + 0.04 * sin(t * 0.6 + fi * 1.9), 0.02 * sin(t * 0.5 + fi));
    float ang = side * (0.05 + 0.12 * open) + 0.05 * sin(t * 0.45 + fi * 2.3);
    vec2 lp = rot(ang) * (p - c) / depth;
    float wdt = 0.13, hgt = 0.62;
    float m = (1.0 - smoothstep(wdt - 0.003, wdt, abs(lp.x))) * (1.0 - smoothstep(hgt - 0.003, hgt, abs(lp.y)));
    float grad = 0.45 + 0.55 * smoothstep(-hgt, hgt, lp.y);
    float edge = (1.0 - smoothstep(0.0, 0.012, abs(abs(lp.x) - wdt + 0.006))) * step(abs(lp.y), hgt);
    vec3 pc = pcol(fi) * grad;
    col = 1.0 - (1.0 - col) * (1.0 - pc * 0.62 * m);
    col += edge * 0.18 * m;
  }
  col += 0.025 * (vno(vUv * uRes * 0.5) - 0.5);
  gl_FragColor = vec4(col, 1.0);
}`;
function M588() {
  return (
    <Stage className="bg-[#06070e]" g1="rgba(120,160,255,.5)">
      <Shader
        frag={PANELS}
        fallback="linear-gradient(90deg,transparent 22%,rgba(255,92,77,.6) 22% 30%,transparent 30% 34%,rgba(255,178,71,.6) 34% 42%,transparent 42% 46%,rgba(77,204,179,.6) 46% 54%,transparent 54% 58%,rgba(87,122,255,.6) 58% 66%,transparent 66% 70%,rgba(184,102,250,.6) 70% 78%,transparent 78%),#06070e"
      />
      <Sheen g1="rgba(160,180,255,.5)" opacity={0.3} />
      <div className="absolute inset-x-0 bottom-[8%] text-center">
        <Copy kicker="Spectra Glassworks · Studio Series" title="Light, in layers." meta="Tinted glass screens · from ₹ 12,500" font={F.sg} className="text-white" size="clamp(44px,5vw,82px)" />
      </div>
    </Stage>
  );
}

/* ---------- M589 · Ink warp (variant of M52: domain-warped noise flows like ink on paper) ---------- */
const INK = /* glsl */ `${NOISE}
void main() {
  float asp = uRes.x / max(uRes.y, 1.0);
  vec2 p = vUv * vec2(asp, 1.0) * 1.6;
  float t = uTime * 0.6;
  vec2 q = vec2(fbm(p + vec2(0.0, t * 0.08)), fbm(p + vec2(5.2, 1.3) - vec2(t * 0.06, 0.0)));
  vec2 r = vec2(fbm(p + 3.6 * q + vec2(1.7, 9.2) + t * 0.11), fbm(p + 3.6 * q + vec2(8.3, 2.8) - t * 0.09));
  float f = fbm(p + 3.4 * r);
  vec3 paper = vec3(0.94, 0.91, 0.86);
  vec3 ink = vec3(0.06, 0.07, 0.10);
  vec3 blue = vec3(0.12, 0.20, 0.42);
  float body = smoothstep(0.46, 0.74, f);
  vec3 col = mix(paper, mix(blue, ink, smoothstep(0.3, 0.9, length(q))), body);
  col = mix(col, paper * 0.86, smoothstep(0.35, 0.46, f) * (1.0 - body) * 0.6);
  col *= 0.97 + 0.03 * vno(vUv * uRes * 0.6);
  gl_FragColor = vec4(col, 1.0);
}`;
function M589() {
  return (
    <Stage className="bg-[#efe8dc]" g1="rgba(40,60,120,.5)" g2="transparent">
      <Shader frag={INK} fallback="radial-gradient(40% 50% at 30% 40%,#1a2242,transparent 70%),radial-gradient(35% 45% at 72% 62%,#10121a,transparent 70%),#efe8dc" />
      <Sheen g1="rgba(70,90,160,.5)" blend="multiply" opacity={0.25} />
      <div className="absolute right-[6%] top-1/2" style={{ transform: "translateY(-50%)" }}>
        <div className="rounded-[22px] bg-[#f4efe6]/90 px-10 py-9 text-[#141720]">
          <Copy kicker="Sumi & Sons · Writing Ink" title={<>Every drop<br />finds its way.</>} meta="Iron-gall ink · 50 ml · ₹ 950" font={F.is} size="clamp(48px,5.2vw,88px)" />
        </div>
      </div>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M578", name: "Expanding blurred leaves", how: "Soft blurred leaf shapes bloom from points, grow and overlap (screen blend mixes their colours), then fade as new ones open (always on)", kind: "play", C: M578 },
  { code: "M579", name: "Background pan", how: "An oversized gradient slides its background position back and forth: left–right, up–down and diagonal (pure CSS loop)", kind: "play", C: M579 },
  { code: "M580", name: "Background colour cycle", how: "The whole section background eases through four brand colours on a 10 s time loop, not with scroll (on screen)", kind: "play", C: M580 },
  { code: "M581", name: "Radial hue cycle", how: "One radial glow behind the headline slowly cycles its hue round the wheel (~16 s) while it breathes (on screen)", kind: "play", C: M581 },
  { code: "M582", name: "Moving gradient text", how: "The headline is filled with a 300%-wide gradient (clipped to the text) that slides back and forth on a 3 s loop", kind: "play", C: M582 },
  { code: "M583", name: "Rotating screen-blend blobs", how: "Five blurred colour blobs orbit the centre at different radii and speeds; screen blend brightens their overlaps (on screen)", kind: "play", C: M583 },
  { code: "M584", name: "Sine colour bands", how: "Seven stacked colour bands with crisp edges undulate as drifting sine waves (shader, always on)", kind: "play", C: M584 },
  { code: "M585", name: "Simplex noise bands", how: "Simplex-noise contours split the stage into soft earthy colour bands that shift and reshape slowly (shader)", kind: "play", C: M585 },
  { code: "M586", name: "Warp stripes", how: "Straight pinstripes are bent by flowing noise so they fold and drape like fabric, with a moving sheen (shader)", kind: "play", C: M586 },
  { code: "M587", name: "Swirl", how: "Colours twist round a centre point; the polar rotation grows toward the middle and the swirl keeps turning (shader)", kind: "play", C: M587 },
  { code: "M588", name: "Sliding colour panels", how: "Five tall translucent colour panels slide apart and back together, tilting and blending where they overlap (shader loop)", kind: "play", C: M588 },
  { code: "M589", name: "Ink warp", how: "Domain-warped noise flows continuously like dark ink spreading through water over paper (shader)", kind: "play", C: M589 },
];
