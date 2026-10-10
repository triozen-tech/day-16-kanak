"use client";

// MOTION-MENU M181–M182 (ambient group, batch 2): always-on background loops for /lab/motion.
// Both are "play": they run while on screen and pause off screen. Every demo also has a CSS glow loop.
// ?static=1 / reduced motion: no animation, a still version of the same light shows.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { createShader, type GLHandle } from "@/lib/gl";
import type { MotionDef } from "./types";

const GROTESK = "'Space Grotesk Variable', system-ui, sans-serif";
const SERIF = "'Fraunces Variable', Georgia, serif";
const EDITORIAL = "'Instrument Serif', Georgia, serif";

const CSS = `
.b2g4a-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 44% at 30% 40%,var(--g1,rgba(79,141,255,.4)),transparent 70%),radial-gradient(34% 40% at 72% 64%,var(--g2,rgba(24,196,143,.2)),transparent 70%);animation:b2g4a-drift 5.2s linear infinite alternate;will-change:transform}
@keyframes b2g4a-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.m181-sky{position:absolute;inset:0;-webkit-mask-image:radial-gradient(120% 85% at 50% 0%,#000 18%,rgba(0,0,0,.55) 45%,transparent 75%);mask-image:radial-gradient(120% 85% at 50% 0%,#000 18%,rgba(0,0,0,.55) 45%,transparent 75%)}
.m181-band{position:absolute;inset:-12% -10% 20% -10%;filter:blur(38px) saturate(1.3);background-repeat:repeat-x}
.m181-a{opacity:.85;background-image:repeating-linear-gradient(100deg,rgba(80,255,190,.0) 0px,rgba(80,255,190,.9) 140px,rgba(60,200,255,.65) 260px,rgba(60,200,255,0) 380px,rgba(0,0,0,0) 470px,rgba(150,110,255,.75) 600px,rgba(150,110,255,0) 760px,rgba(0,0,0,0) 800px);background-size:1600px 100%;animation:m181-r 46s linear infinite}
.m181-b{opacity:.6;mix-blend-mode:screen;background-image:repeating-linear-gradient(80deg,rgba(255,120,200,0) 0px,rgba(255,120,200,.55) 120px,rgba(255,120,200,0) 260px,rgba(0,0,0,0) 420px,rgba(120,255,220,.6) 520px,rgba(120,255,220,0) 640px);background-size:1100px 100%;animation:m181-l 38s linear infinite}
@keyframes m181-r{from{background-position:0 0}to{background-position:1600px 0}}
@keyframes m181-l{from{background-position:0 0}to{background-position:-1100px 0}}
.m181-off .m181-band,.m181-off .b2g4a-glow{animation-play-state:paused}
.m182-fb{position:absolute;inset:0;background:radial-gradient(14% 70% at 22% 0%,rgba(80,255,190,.45),transparent 70%),radial-gradient(12% 80% at 47% 0%,rgba(60,200,255,.4),transparent 70%),radial-gradient(14% 70% at 70% 0%,rgba(160,110,255,.4),transparent 70%);filter:blur(18px)}
html.is-static .b2g4a-glow,html.is-static .m181-band{animation:none}
html.is-static {.b2g4a-glow,.m181-band{animation:none}}
`;

/** Demo frame: rounded dark panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", g1, g2, bg = "#04060d" }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string; bg?: string }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 text-[#eaf5ff] ${className}`} style={{ background: bg }}>
      <style href="b2g4a-css" precedence="default">
        {CSS}
      </style>
      <div className="b2g4a-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/* ---------- M181 · Aurora curtains (variant of M52): blurred repeating gradient bands slide sideways, CSS only ---------- */
function M181() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    // pause the CSS loop off screen
    el.classList.add("m181-off");
    const io = new IntersectionObserver(([e]) => el.classList.toggle("m181-off", !e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => {
      io.disconnect();
      el.classList.remove("m181-off");
    };
  }, []);
  return (
    <Stage r={root} g1="rgba(60,200,255,.22)" g2="rgba(150,110,255,.18)" bg="#03050c">
      <div className="m181-sky" aria-hidden>
        <div className="m181-band m181-a" />
        <div className="m181-band m181-b" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t from-[#03050c] to-transparent" />
      <div className="absolute inset-x-0 bottom-[12%] px-[6%] text-center">
        <p className="text-[13px] uppercase tracking-[0.24em] text-[#9ff5d6]">Polar Line Expeditions · Winter 2027</p>
        <h3 className="mx-auto mt-4 max-w-[16ch] text-[clamp(48px,6.4vw,104px)] leading-[0.95]" style={{ fontFamily: EDITORIAL }}>
          Sleep under moving light.
        </h3>
        <p className="mt-5 text-[16px] text-white/70">Nine nights above the Arctic Circle · from ₹ 3,40,000</p>
      </div>
    </Stage>
  );
}

/* ---------- M182 · Vertical aurora ribbons (shader, variant of M181) ---------- */
const M182_FRAG = /* glsl */ `
float h3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float n3(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1, 0, 0)), f.x), mix(h3(i + vec3(0, 1, 0)), h3(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(h3(i + vec3(0, 0, 1)), h3(i + vec3(1, 0, 1)), f.x), mix(h3(i + vec3(0, 1, 1)), h3(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
// cosine palette: greens -> teals -> violets, shifting very slowly
vec3 pal(float t) { return vec3(0.32, 0.55, 0.55) + vec3(0.3, 0.42, 0.4) * cos(6.28318 * (t + vec3(0.0, 0.12, 0.32))); }
void main() {
  vec2 uv = vUv;
  float asp = uRes.x / max(uRes.y, 1.0);
  float t = uTime * 0.12;
  vec3 col = vec3(0.0);
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float base = 0.16 + fi * 0.23;
    // 3D noise (y, time, ribbon) bends each ribbon and sways it
    float bend = (n3(vec3(uv.y * 1.7, t * 1.5, fi * 3.1)) - 0.5) * 0.5 + sin(uv.y * 3.0 + t * 2.2 + fi * 1.3) * 0.05;
    float d = (uv.x - base - bend) * asp;
    float w = 0.06 + 0.05 * n3(vec3(uv.y * 3.0, t, fi + 7.0));
    float core = exp(-d * d / (w * w));
    // fine vertical curtain rays that shimmer upward
    float rays = 0.45 + 0.55 * n3(vec3(uv.x * 70.0, uv.y * 1.5 - t * 3.5, fi));
    float fall = smoothstep(0.08, 0.9, uv.y);
    vec3 c = pal(t * 0.12 + fi * 0.17 + uv.y * 0.22);
    col += c * core * rays * fall * 0.8;
  }
  float a = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0);
  gl_FragColor = vec4(col, a);
}`;
function M182() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (prefersReducedMotion() || !canvas.current) return;
    let dead = false;
    let h: GLHandle | null = null;
    // createShader draws only while the canvas is on screen; dpr capped at 1 (soft light needs no detail)
    createShader(canvas.current, M182_FRAG, { dpr: 1 }).then((x) => {
      h = x;
      if (dead) h?.destroy();
    });
    return () => {
      dead = true;
      h?.destroy();
    };
  }, []);
  return (
    <Stage r={root} g1="rgba(80,255,190,.16)" g2="rgba(150,110,255,.16)" bg="#02040a">
      <div className="m182-fb" aria-hidden />
      <canvas ref={canvas} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-700" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 h-[34%] bg-gradient-to-t from-[#02040a] to-transparent" />
      <div className="absolute bottom-[10%] left-[6%] max-w-[46%]">
        <p className="text-[13px] uppercase tracking-[0.24em] text-[#9ff5d6]">Kaamos Lodge · Glass cabins</p>
        <h3 className="mt-4 text-[clamp(44px,5.6vw,92px)] font-[500] leading-[0.95]" style={{ fontFamily: SERIF }}>
          The sky does the show.
        </h3>
      </div>
      <div className="absolute bottom-[10%] right-[6%] text-right">
        <p className="text-[clamp(18px,1.6vw,24px)] font-[650]" style={{ fontFamily: GROTESK }}>
          Aurora week · 6 nights
        </p>
        <p className="text-[15px] text-white/65">from ₹ 2,85,000</p>
      </div>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M181", name: "Aurora curtains", how: "Auto (CSS): soft blurred colour bands slide sideways on a 40–50 s linear loop, faded out by a radial mask toward the bottom edge.", kind: "play", C: M181 },
  { code: "M182", name: "Vertical aurora ribbons (shader)", how: "Auto (WebGL): vertical northern-light ribbons sway and shimmer with 3D noise while a cosine palette drifts their colours.", kind: "play", C: M182 },
];
