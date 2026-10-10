"use client";

// Transition motions, batch 14 · group 1 (MOTION-MENU X88–X92). Small focused demos for /lab/motion.
// "play" demos loop A → B → A between two simple pages while on screen and pause off screen; "scrub" demos follow the
// scroll of their 220vh panel linearly. Every demo has a CSS-only glow loop (also ON TOP of the pages) that never stops.
// ?static=1 / reduced motion: no JS motion, the markup shows page A with every page-B element and cover hidden.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { createShader, type GLHandle } from "@/lib/gl";
import { scene, useScrub, useTicker } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = { sg: "Space Grotesk Variable", fr: "Fraunces Variable", is: "Instrument Serif", sy: "Syne Variable", mr: "Manrope Variable" };

const CSS = `
.b14t1-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(159,216,255,.5)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,143,122,.22)),transparent 70%);animation:b14t1-drift 5.4s linear infinite alternate;will-change:transform}
@keyframes b14t1-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
html.is-static .b14t1-glow{animation:none}
html.is-static {.b14t1-glow{animation:none}}
`;

/* ---------- shared helpers (local copies) ---------- */

function Stage({ r, children, g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; g1?: string; g2?: string }) {
  return (
    <div ref={r} className="relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0b10] text-[#f4f1ea]">
      <style href="b14t1-css" precedence="default">
        {CSS}
      </style>
      <div className="b14t1-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/** The CSS glow loop again, ON TOP of the pages (screen blend), so covered stages never read as a freeze. */
const Sheen = ({ g1 = "rgba(159,216,255,.55)" }: { g1?: string }) => (
  <div className="b14t1-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.45, zIndex: 55 } as CSSProperties} aria-hidden />
);

/** "play" helper: waits for fonts, builds the looping timeline in a gsap.context, plays only on screen, reverts on unmount. */
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

const hold = (tl: gsap.core.Timeline, d = 0.2) => tl.to({}, { duration: d });
const one = (root: Element, sel: string) => root.querySelector<HTMLElement>(sel)!;
const HIDDEN: CSSProperties = { visibility: "hidden", opacity: 0 };

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, className = "", w = 1400, h = 900 }: { i: number; className?: string; w?: number; h?: number }) => (
  <img src={scene(i, w, h)} alt="" className={`block h-full w-full object-cover ${className}`} draggable={false} />
);

const Label = ({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) => (
  <p className={`text-[13px] uppercase tracking-[0.22em] text-white/65 ${className}`} style={{ fontFamily: F.mr, ...style }}>
    {children}
  </p>
);

/* ───────────────────────── X88 · Prism facet sweep (WebGL) ───────────────────────── */
type PageData = { brand: string; kicker: string; title: string; price: string; i: number; acc: string };
const X88_PAGES: [PageData, PageData] = [
  { brand: "Lumen Optics", kicker: "Frames · 01", title: "Clear light, clean lines", price: "₹ 6,400", i: 0, acc: "#9fd8ff" },
  { brand: "Lumen Optics", kicker: "Sun · 02", title: "Amber for the late hour", price: "₹ 7,250", i: 3, acc: "#ffd59a" },
];

/** Paints a page (photo + left shade + text) into a canvas for a texture. Matches the HTML fallback below. */
async function paintPage(d: PageData, w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d")!;
  const img = new Image();
  img.src = scene(d.i, w, h);
  await img.decode();
  x.drawImage(img, 0, 0, w, h);
  const g = x.createLinearGradient(0, 0, w * 0.7, 0);
  g.addColorStop(0, "rgba(5,6,10,.82)");
  g.addColorStop(1, "rgba(5,6,10,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);
  const pad = w * 0.06;
  x.textBaseline = "top";
  x.fillStyle = "#ffffff";
  x.font = `700 13px "${F.mr}"`;
  x.fillText(d.brand.toUpperCase(), pad, h * 0.07);
  x.fillStyle = d.acc;
  x.font = `600 13px "${F.mr}"`;
  x.fillText(d.kicker.toUpperCase(), pad, h * 0.3);
  const fs = Math.round(Math.min(76, w * 0.054));
  x.fillStyle = "#f4f1ea";
  x.font = `400 ${fs}px "${F.fr}"`;
  const words = d.title.split(" ");
  const half = Math.ceil(words.length / 2);
  x.fillText(words.slice(0, half).join(" "), pad, h * 0.3 + 28);
  x.fillText(words.slice(half).join(" "), pad, h * 0.3 + 28 + fs * 1.02);
  x.font = `500 22px "${F.sg}"`;
  x.fillText(d.price, pad, h * 0.3 + 28 + fs * 2.3);
  return c;
}

function HtmlPage({ d }: { d: PageData }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <Img i={d.i} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(5,6,10,.82), rgba(5,6,10,0) 70%)" }} />
      <p className="absolute left-[6%] top-[7%] text-[13px] font-[700] uppercase text-white" style={{ fontFamily: F.mr }}>
        {d.brand}
      </p>
      <div className="absolute left-[6%] top-[30%] max-w-[44%]">
        <p className="text-[13px] font-[600] uppercase" style={{ fontFamily: F.mr, color: d.acc }}>
          {d.kicker}
        </p>
        <p className="mt-3 text-[clamp(40px,5.2vw,76px)] leading-[1.02]" style={{ fontFamily: F.fr }}>
          {d.title}
        </p>
        <p className="mt-5 text-[22px]" style={{ fontFamily: F.sg }}>
          {d.price}
        </p>
      </div>
    </div>
  );
}

const PRISM = /* glsl */ `
uniform float uFlip;
vec3 pa(vec2 uv) { return texture2D(uTex0, cover(clamp(uv, 0.0, 1.0), uTexRes0)).rgb; }
vec3 pb(vec2 uv) { return texture2D(uTex1, cover(clamp(uv, 0.0, 1.0), uTexRes1)).rgb; }
vec3 fromPage(vec2 uv) { return mix(pa(uv), pb(uv), uFlip); }
vec3 toPage(vec2 uv) { return mix(pb(uv), pa(uv), uFlip); }
vec2 h2(vec2 p) { p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return fract(sin(p) * 43758.5453); }
void main() {
  float asp = uRes.x / uRes.y;
  float S = 6.5;
  vec2 p = vUv * vec2(asp, 1.0) * S;
  vec2 ip = floor(p);
  vec2 fp = fract(p);
  float d1 = 8.0;
  float d2 = 8.0;
  vec2 mc = vec2(0.0);
  vec2 mo = vec2(0.0);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 o = h2(ip + g);
      vec2 r = g + o - fp;
      float d = dot(r, r);
      if (d < d1) { d2 = d1; d1 = d; mc = ip + g; mo = o; }
      else if (d < d2) { d2 = d; }
    }
  }
  vec2 cell = (mc + mo) / S / vec2(asp, 1.0);
  float rnd = h2(mc + 3.1).x;
  // the facet field sweeps left → right; each facet refracts while the front passes it
  float front = mix(-0.4, 1.4, uProgress);
  float t = clamp((front - cell.x) / 0.32 + (rnd - 0.5) * 0.5, 0.0, 1.0);
  float band = sin(t * 3.14159);
  vec2 n = h2(mc + 7.7) - 0.5;
  vec2 off = n * 0.09 * band;
  float sp = 0.03 * band * (0.5 + rnd);
  vec2 uv = vUv + off;
  vec3 outC = vec3(fromPage(uv + vec2(sp, 0.0)).r, fromPage(uv).g, fromPage(uv - vec2(sp, sp * 0.4)).b);
  vec3 inC = toPage(vUv + off * 0.35 * (1.0 - t));
  float m = smoothstep(0.42, 0.62, t);
  vec3 col = mix(outC, inC, m);
  float edge = 1.0 - smoothstep(0.0, 0.08, sqrt(d2) - sqrt(d1));
  col += band * (0.08 + 0.16 * rnd) * vec3(0.85, 0.92, 1.0);
  col += edge * band * vec3(0.55, 0.75, 1.0) * 0.6;
  gl_FragColor = vec4(col, 1.0);
}`;

function X88() {
  const box = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = box.current;
    if (!el || prefersReducedMotion()) return;
    let dead = false;
    let started = false;
    let h: GLHandle | null = null;
    let tl: gsap.core.Timeline | null = null;
    let on = false;
    const vis = new IntersectionObserver(
      ([e]) => {
        on = e.isIntersecting;
        if (tl) (on ? tl.play() : tl.pause());
      },
      { threshold: 0.15 },
    );
    vis.observe(el);
    const start = async () => {
      await document.fonts?.ready;
      const r = el.getBoundingClientRect();
      const w = Math.round(Math.min(1400, Math.max(320, r.width)));
      const hh = Math.round(Math.max(200, (w * r.height) / Math.max(1, r.width)));
      const [a, b] = await Promise.all([paintPage(X88_PAGES[0], w, hh), paintPage(X88_PAGES[1], w, hh)]);
      if (dead || !cv.current) return;
      h = await createShader(cv.current, PRISM, { textures: [a, b], dpr: 1, uniforms: { uFlip: { value: 0 } } });
      if (dead) {
        h?.destroy();
        h = null;
        return;
      }
      if (!h) return;
      const u = h.uniforms;
      tl = gsap.timeline({ repeat: -1, paused: !on });
      [0, 1].forEach((k) => {
        tl!.set(u.uFlip, { value: k });
        tl!.set(u.uProgress, { value: 0 });
        tl!.to(u.uProgress, { value: 1, duration: 1.25, ease: "power1.inOut" });
        hold(tl!, 0.22);
      });
    };
    const near = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started) {
          started = true;
          near.disconnect();
          start();
        }
      },
      { rootMargin: "900px 0px" },
    );
    near.observe(el);
    return () => {
      dead = true;
      vis.disconnect();
      near.disconnect();
      tl?.kill();
      h?.destroy();
    };
  }, []);
  return (
    <Stage r={box} g1="rgba(159,216,255,.55)">
      <HtmlPage d={X88_PAGES[0]} />
      <canvas ref={cv} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500" aria-hidden />
      <Sheen g1="rgba(159,216,255,.55)" />
    </Stage>
  );
}

/* ───────────────────────── X89 · Brightness flash slide ───────────────────────── */
const X89_S = [
  { k: "Look 01 · Linen", t: "Salt-washed linen", p: "₹ 3,900", i: 3 },
  { k: "Look 02 · Night", t: "Ink-blue evening", p: "₹ 5,600", i: 0 },
];
function X89() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const s = [one(el, ".x89-a"), one(el, ".x89-b")];
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(s[0], { xPercent: 0, filter: "brightness(1)", autoAlpha: 1, zIndex: 2 });
    tl.set(s[1], { xPercent: 30, filter: "brightness(8)", autoAlpha: 0, zIndex: 3 });
    hold(tl, 0.25);
    const go = (from: HTMLElement, to: HTMLElement) => {
      tl.set(to, { xPercent: 30, filter: "brightness(8)", autoAlpha: 0, zIndex: 3 });
      tl.set(from, { zIndex: 2 });
      // the current slide slides out while flashing to 800 %…
      tl.to(from, { xPercent: -30, filter: "brightness(8)", duration: 0.8, ease: "power2.in" });
      tl.to(from, { autoAlpha: 0, duration: 0.25, ease: "power1.in" }, "<0.55");
      // …and the next one slides in from that overexposed state back to normal
      tl.to(to, { autoAlpha: 1, duration: 0.25, ease: "power1.out" }, "<");
      tl.to(to, { xPercent: 0, filter: "brightness(1)", duration: 0.8, ease: "power2.out" }, "<");
      tl.fromTo(to.querySelectorAll("[data-l]"), { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: "power2.out", stagger: 0.06 }, "<0.2");
      hold(tl, 0.22);
    };
    go(s[0], s[1]);
    go(s[1], s[0]);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,236,200,.55)">
      {X89_S.map((d, i) => (
        <div key={i} className={`${i ? "x89-b" : "x89-a"} absolute inset-0 overflow-hidden`} style={i ? HIDDEN : undefined}>
          <Img i={d.i} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute bottom-[9%] left-[6%]">
            <div data-l>
              <Label>{d.k}</Label>
            </div>
            <p data-l className="mt-2 text-[clamp(44px,5.4vw,82px)] leading-none" style={{ fontFamily: F.is }}>
              {d.t}
            </p>
            <p data-l className="mt-3 text-[20px] text-white/80" style={{ fontFamily: F.sg }}>
              {d.p}
            </p>
          </div>
        </div>
      ))}
      <p className="absolute right-[5%] top-[7%] z-10 text-[13px] uppercase tracking-[0.22em] text-white/75" style={{ fontFamily: F.mr }}>
        Overexposed · SS26
      </p>
      <Sheen g1="rgba(255,236,200,.5)" />
    </Stage>
  );
}

/* ───────────────────────── X90 · Frosted glass divider band (scrub) ───────────────────────── */
function X90Col() {
  return (
    <div className="px-[6%]">
      <section className="flex h-[110%] min-h-[520px] items-center gap-[6%] py-[6%]">
        <div className="w-[44%]">
          <Label>Chapter one · Clay</Label>
          <p className="mt-3 text-[clamp(44px,5vw,78px)] leading-[0.98]" style={{ fontFamily: F.fr }}>
            Hand-thrown, kiln-quiet
          </p>
          <p className="mt-5 max-w-[34ch] text-[15px] leading-relaxed text-white/70" style={{ fontFamily: F.mr }}>
            Stoneware cups fired twice and glazed in small batches by the river studio.
          </p>
        </div>
        <div className="h-[420px] flex-1 overflow-hidden rounded-[22px]">
          <Img i={3} w={1000} h={800} />
        </div>
      </section>
      <section className="py-[6%]">
        <Label>Chapter two · The table</Label>
        <p className="mt-3 text-[clamp(40px,4.4vw,68px)] leading-none" style={{ fontFamily: F.fr }}>
          Set for six
        </p>
        <div className="mt-8 grid grid-cols-3 gap-[3%]">
          {[
            { n: "Ember cup", p: "₹ 890", i: 1 },
            { n: "River plate", p: "₹ 1,450", i: 0 },
            { n: "Ash bowl", p: "₹ 1,180", i: 2 },
          ].map((c) => (
            <div key={c.n} className="overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.04]">
              <div className="h-[300px]">
                <Img i={c.i} w={700} h={600} />
              </div>
              <div className="flex items-center justify-between px-5 py-4 text-[16px]" style={{ fontFamily: F.sg }}>
                <span>{c.n}</span>
                <span className="text-white/70">{c.p}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="py-[6%]">
        <p className="text-[clamp(48px,6vw,96px)] leading-none" style={{ fontFamily: F.is }}>
          Made slow, used daily.
        </p>
      </section>
    </div>
  );
}
function X90() {
  const root = useRef<HTMLDivElement>(null);
  const disp = useRef<SVGFEDisplacementMapElement>(null);
  const vel = useRef({ target: 0, v: 0, last: -1 });
  useScrub(
    root,
    (p, v) => {
      const el = root.current;
      if (!el) return;
      const base = el.querySelector<HTMLElement>(".x90-col")!;
      const copy = el.querySelector<HTMLElement>(".x90-copy")!;
      const band = el.querySelector<HTMLElement>(".x90-band")!;
      const travel = Math.max(0, base.offsetHeight - el.clientHeight);
      const y = -p * travel;
      base.style.transform = `translate3d(0,${y}px,0)`;
      copy.style.transform = `translate3d(0,${y - band.offsetTop}px,0)`;
      vel.current.target = Math.abs(v);
    },
    { finalValue: 0.42 },
  );
  // the displacement scale breathes and grows with scroll speed (the noise itself never re-tweens)
  useTicker(root, (t) => {
    const s = vel.current;
    s.v += (s.target - s.v) * 0.08;
    s.target *= 0.94;
    const sc = Math.round((22 + 10 * Math.sin(t * 1.3) + s.v * 70) * 2) / 2;
    if (sc !== s.last && disp.current) {
      s.last = sc;
      disp.current.setAttribute("scale", String(sc));
    }
  });
  return (
    <Stage r={root} g1="rgba(255,200,160,.5)" g2="rgba(159,216,255,.22)">
      <svg width="0" height="0" className="absolute" aria-hidden>
        <filter id="x90-warp" x="-5%" y="-10%" width="110%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.011 0.07" numOctaves={1} seed={4} result="n" />
          <feDisplacementMap ref={disp} in="SourceGraphic" in2="n" scale={24} xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation={2.5} />
        </filter>
      </svg>
      <div className="x90-col absolute inset-x-0 top-0 will-change-transform">
        <X90Col />
      </div>
      <div className="x90-band absolute inset-x-0 top-[41%] z-10 h-[20%] overflow-hidden border-y border-white/25">
        <div style={{ filter: "url(#x90-warp)" }} className="absolute inset-0 overflow-hidden">
          <div className="x90-copy absolute inset-x-0 top-0 will-change-transform" style={{ transform: "translate3d(0,-41vh,0)" }}>
            <X90Col />
          </div>
        </div>
        <div className="absolute inset-0 bg-white/[0.07]" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,.35), inset 0 -1px 0 rgba(255,255,255,.12)" }} />
        <p className="absolute right-[4%] top-1/2 -mt-[9px] text-[13px] uppercase tracking-[0.3em] text-white/80" style={{ fontFamily: F.mr }}>
          Frosted divider
        </p>
      </div>
      <Sheen g1="rgba(255,200,160,.5)" />
    </Stage>
  );
}

/* ───────────────────────── X91 · Animated SVG frame ───────────────────────── */
const X91_S = [
  { k: "Residence 04 · Goa", t: "Courtyard house", p: "Stays from ₹ 24,000", i: 2 },
  { k: "Residence 07 · Coorg", t: "Mist & timber", p: "Stays from ₹ 19,500", i: 1 },
];
const framePath = (W: number, H: number, k: number) => {
  const kx = Math.min(k, W / 2);
  const ky = Math.min(k, H / 2);
  return `M0,0H${W}V${H}H0Z M${kx},${ky}V${H - ky}H${W - kx}V${ky}Z`;
};
function X91() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const win = one(el, ".x91-win");
    const svg = el.querySelector<SVGSVGElement>(".x91-svg")!;
    const frame = one(el, ".x91-frame");
    const line = one(el, ".x91-line");
    const s = [one(el, ".x91-a"), one(el, ".x91-b")];
    const caps = [one(el, ".x91-ca"), one(el, ".x91-cb")];
    const W = win.clientWidth;
    const H = win.clientHeight;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const st = { k: 0 };
    const draw = () => {
      frame.setAttribute("d", framePath(W, H, st.k));
      const g = Math.min(st.k + 14, H / 2);
      line.setAttribute("d", `M${g},${g}H${W - g}V${H - g}H${g}Z`);
      line.style.opacity = String(st.k > 2 && st.k < H / 2 - 16 ? 1 : 0);
    };
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(s[0], { autoAlpha: 1, rotation: 0, scale: 1 });
    tl.set(s[1], { autoAlpha: 0 });
    tl.set(caps[0], { autoAlpha: 1 });
    tl.set(caps[1], { autoAlpha: 0 });
    tl.set(st, { k: 0, onComplete: draw });
    hold(tl, 0.2);
    const go = (a: number, b: number) => {
      // the frame grows in from every edge until it covers the image (slight rotation underneath)
      tl.to(st, { k: H / 2 + 2, duration: 0.55, ease: "power2.in", onUpdate: draw });
      tl.to(s[a], { rotation: 2.5, scale: 1.06, duration: 0.55, ease: "power2.in" }, "<");
      tl.to(caps[a], { autoAlpha: 0, y: -16, duration: 0.3, ease: "power1.in" }, "<");
      tl.set(s[a], { autoAlpha: 0 });
      tl.set(s[b], { autoAlpha: 1, rotation: -2.5, scale: 1.06 });
      // …then retracts as the next slide appears
      tl.to(st, { k: 0, duration: 0.6, ease: "power2.out", onUpdate: draw });
      tl.to(s[b], { rotation: 0, scale: 1, duration: 0.7, ease: "power2.out" }, "<");
      tl.fromTo(caps[b], { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" }, "<0.2");
      hold(tl, 0.2);
    };
    go(0, 1);
    go(1, 0);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,213,154,.5)" g2="rgba(200,255,138,.18)">
      <div className="absolute inset-0 flex items-center gap-[5%] px-[5%]">
        <div className="relative w-[34%]">
          {X91_S.map((d, i) => (
            <div key={i} className={`${i ? "x91-cb" : "x91-ca"} ${i ? "absolute inset-x-0 top-0" : "relative"}`} style={i ? HIDDEN : undefined}>
              <Label className="text-[#ffd59a]">{d.k}</Label>
              <p className="mt-3 text-[clamp(40px,4.4vw,70px)] leading-[0.98]" style={{ fontFamily: F.fr }}>
                {d.t}
              </p>
              <p className="mt-5 text-[18px] text-white/75" style={{ fontFamily: F.sg }}>
                {d.p}
              </p>
            </div>
          ))}
        </div>
        <div className="x91-win relative h-[78%] flex-1 overflow-hidden rounded-[6px]">
          {X91_S.map((d, i) => (
            <div key={i} className={`${i ? "x91-b" : "x91-a"} absolute inset-0`} style={i ? HIDDEN : undefined}>
              <Img i={d.i} w={1200} h={900} />
            </div>
          ))}
          <svg className="x91-svg absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden>
            <path className="x91-frame" d="M0,0H1V1H0Z M0,0V1H1V0Z" fill="#f2e6d2" fillRule="evenodd" />
            <path className="x91-line" d="M0,0" fill="none" stroke="#a8814f" strokeWidth={1.5} style={{ opacity: 0 }} />
          </svg>
        </div>
      </div>
      <Sheen g1="rgba(255,213,154,.5)" />
    </Stage>
  );
}

/* ───────────────────────── X92 · Elastic footer edge (scrub) ───────────────────────── */
const X92_EDGE = (b: number) => `M0,100 L0,56 Q500,${56 + b} 1000,56 L1000,100 Z`;
function X92() {
  const root = useRef<HTMLDivElement>(null);
  const st = useRef({ b: 0 });
  useEffect(() => {
    const s = st.current;
    return () => {
      gsap.killTweensOf(s);
    };
  }, []);
  useScrub(
    root,
    (p, v) => {
      const el = root.current;
      if (!el) return;
      const col = el.querySelector<HTMLElement>(".x92-col")!;
      const foot = el.querySelector<HTMLElement>(".x92-foot")!;
      const edge = el.querySelector<SVGPathElement>(".x92-edge")!;
      const travel = Math.max(0, col.offsetHeight - el.clientHeight);
      const y = -p * travel;
      col.style.transform = `translate3d(0,${y}px,0)`;
      if (!v) return;
      // only while the footer's edge is on screen: bulge by scroll velocity, then snap back flat like a trampoline
      const top = foot.offsetTop + y;
      if (top > el.clientHeight || top < -40) return;
      const s = st.current;
      const draw = () => edge.setAttribute("d", X92_EDGE(s.b));
      const target = gsap.utils.clamp(-50, 42, v * 260);
      gsap.to(s, {
        b: target,
        duration: 0.18,
        ease: "power1.out",
        overwrite: true,
        onUpdate: draw,
        onComplete: () => {
          gsap.to(s, { b: 0, duration: 1.3, ease: "elastic.out(1.1,0.25)", overwrite: true, onUpdate: draw });
        },
      });
    },
    { finalValue: 1 },
  );
  return (
    <Stage r={root} g1="rgba(200,255,138,.45)" g2="rgba(159,216,255,.22)">
      <div className="x92-col absolute inset-x-0 top-0 will-change-transform">
        <section className="flex h-[620px] items-center gap-[6%] px-[6%]">
          <div className="w-[42%]">
            <Label>Trail kit · 2026</Label>
            <p className="mt-3 text-[clamp(46px,5.2vw,82px)] font-[700] leading-[0.95] tracking-[-0.02em]" style={{ fontFamily: F.sy }}>
              Pack light, go far
            </p>
            <p className="mt-5 text-[18px] text-white/75" style={{ fontFamily: F.sg }}>
              Ridge 28 L daypack · ₹ 5,490
            </p>
          </div>
          <div className="h-[440px] flex-1 overflow-hidden rounded-[22px]">
            <Img i={2} w={1000} h={800} />
          </div>
        </section>
        <section className="grid h-[380px] grid-cols-3 gap-[3%] px-[6%] pb-[60px]">
          {[
            { n: "Ridge bottle", p: "₹ 1,290", i: 0 },
            { n: "Switchback cap", p: "₹ 990", i: 1 },
            { n: "Scree gloves", p: "₹ 1,750", i: 3 },
          ].map((c) => (
            <div key={c.n} className="overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.04]">
              <div className="h-[250px]">
                <Img i={c.i} w={700} h={500} />
              </div>
              <div className="flex items-center justify-between px-5 py-4 text-[16px]" style={{ fontFamily: F.sg }}>
                <span>{c.n}</span>
                <span className="text-white/70">{c.p}</span>
              </div>
            </div>
          ))}
        </section>
        <footer className="x92-foot relative">
          <svg className="block h-[140px] w-full" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden>
            <path className="x92-edge" d={X92_EDGE(0)} fill="#c8ff8a" />
          </svg>
          <div className="-mt-px bg-[#c8ff8a] px-[6%] pb-[60px] pt-[10px] text-[#0e140a]">
            <p className="text-[clamp(72px,9vw,140px)] font-[800] uppercase leading-[0.9] tracking-[-0.02em]" style={{ fontFamily: F.sy }}>
              Ridgeway
            </p>
            <div className="mt-8 flex items-end justify-between text-[14px]" style={{ fontFamily: F.mr }}>
              <span className="flex gap-8 font-[600]">
                <span>Shop</span>
                <span>Trails</span>
                <span>Repairs</span>
                <span>Journal</span>
              </span>
              <span className="text-[#0e140a]/70">Concept website · sample prices</span>
            </div>
          </div>
        </footer>
      </div>
      <Sheen g1="rgba(200,255,138,.4)" />
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "X88", name: "Prism facet sweep", how: "Auto A→B→A: a faceted (Voronoi) prism field sweeps across; each facet refracts and splits the outgoing page into colour channels as the new page shows behind (WebGL, ~1.2 s).", kind: "play", C: X88 },
  { code: "X89", name: "Brightness flash slide", how: "Auto A→B→A: the current slide slides out while flashing to 800 % brightness, and the next slides in from that overexposed state down to normal (filter + x, ~0.8 s).", kind: "play", C: X89 },
  { code: "X90", name: "Frosted glass divider band", how: "Scrub: a still frosted band sits across the stage; the page scrolling under it warps through fractal-noise displacement and a soft fixed blur, stronger with scroll speed.", kind: "scrub", C: X90 },
  { code: "X91", name: "Animated SVG frame", how: "Auto A→B→A: an SVG border frame grows in from every edge until it covers the image (which tilts slightly), then retracts as the next slide appears.", kind: "play", C: X91 },
  { code: "X92", name: "Elastic footer edge", how: "Scrub: the footer's top edge is an SVG curve; when it scrolls into view it bulges by scroll velocity, then snaps back flat with an elastic ease like a trampoline.", kind: "scrub", C: X92 },
];
