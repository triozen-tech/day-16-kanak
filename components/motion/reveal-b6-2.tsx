"use client";

// MOTION-MENU M242–M253 (reveal group, batch 6 · group 2): small focused demos for /lab/motion.
// "play" demos start when on screen, loop, and pause off screen. Flip demos run as a CYCLE of single steps (each step
// captures its Flip state at the moment it starts, then hands over to the next). The one "scrub" demo maps the panel's
// scroll LINEARLY onto a paused timeline. Every demo also has a CSS-only glow loop (and a second one on top when photos
// or a canvas cover the stage). ?static=1 / reduced motion: no JS motion, the markup shows the final state.
import { useEffect, useId, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, loadPlugin, prefersReducedMotion } from "@/lib/gsap";
import { scene, toCanvas, useScrub } from "@/components/fx/shared";
import { createShader, type GLHandle } from "@/lib/gl";
import type { Flip as FlipPlugin } from "gsap/Flip";
import type { MotionDef } from "./types";

type FlipT = typeof FlipPlugin;

const GROTESK = "'Space Grotesk Variable', system-ui, sans-serif";
const SERIF = "'Fraunces Variable', Georgia, serif";
const EDITORIAL = "'Instrument Serif', Georgia, serif";
const WIDE = "'Syne Variable', 'Space Grotesk Variable', system-ui, sans-serif";
const BODY = "'Manrope Variable', system-ui, sans-serif";

const CSS = `
.b6r2-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.5)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.22)),transparent 70%);animation:b6r2-drift 5.2s linear infinite alternate;will-change:transform}
@keyframes b6r2-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b6r2-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4);pointer-events:none;z-index:40}
.m243-c{position:absolute;left:var(--pl);top:var(--pt);width:12%;height:34%}
.m243-c.open{left:var(--gl);top:20%;width:20.5%;height:58%}
.m247-c{position:absolute;left:var(--l);top:var(--t);width:21.5%;height:44%}
.m247-c.big{left:18%;top:0;width:64%;height:100%;z-index:20}
.m248-g{display:grid;gap:12px}
.m249-g{display:grid;gap:12px}
.m249-g.v-grid{grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:repeat(2,minmax(0,1fr))}
.m249-g.v-list{grid-template-columns:minmax(0,1fr);grid-template-rows:repeat(6,minmax(0,1fr));gap:8px}
.m249-g.v-cols{grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:repeat(3,minmax(0,1fr))}
.m249-c{display:flex;flex-direction:column;gap:10px;padding:10px;min-height:0;min-width:0;border-radius:16px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1)}
.m249-img{flex:1 1 auto;min-height:0;border-radius:10px;overflow:hidden}
.m249-meta{display:flex;flex-direction:column;justify-content:center;min-width:0;gap:2px}
.v-list .m249-c{flex-direction:row;align-items:center;padding:6px 14px 6px 6px}
.v-list .m249-img{flex:0 0 96px;height:100%}
.v-list .m249-meta{flex:1;flex-direction:row;align-items:center;justify-content:space-between}
.v-cols .m249-c{flex-direction:row}
.v-cols .m249-img{flex:0 0 44%;height:100%}
.m249-chip.on,.m248-chip.on,.m246-chip.on{background:#f4efe6;color:#12100c;border-color:#f4efe6}
.m250-cone{background:conic-gradient(from 150deg at 50% 0%,transparent 0deg,var(--lc) 22deg,var(--lc) 38deg,transparent 60deg);-webkit-mask-image:linear-gradient(to bottom,#000 10%,transparent 92%);mask-image:linear-gradient(to bottom,#000 10%,transparent 92%);transform-origin:50% 0}
.m245-fb{background-image:radial-gradient(circle,rgba(5,7,14,.55) 32%,transparent 36%);background-size:12px 12px}
html.is-static .b6r2-glow{animation:none}
html.is-static {.b6r2-glow{animation:none}}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", bg = "#0a0d16", g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; bg?: string; g1?: string; g2?: string }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 text-[#eef2ff] ${className}`} style={{ background: bg }}>
      <style href="b6r2-css" precedence="default">
        {CSS}
      </style>
      <div className="b6r2-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/** The CSS glow loop again, ON TOP of photos (screen blend), so image-heavy demos never freeze. */
const Sheen = ({ g1 }: { g1?: string }) => (
  <div className="b6r2-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.45, zIndex: 35 } as CSSProperties} aria-hidden />
);

/** Play: a looping timeline that starts when the demo is on screen and pauses off screen. Optional lazy plugins load first. */
function usePlay(root: RefObject<HTMLDivElement | null>, build: (el: HTMLDivElement) => gsap.core.Timeline, morph = false) {
  const fn = useRef(build);
  fn.current = build;
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    let tl: gsap.core.Timeline | null = null;
    let on = false;
    let dead = false;
    const ctx = gsap.context(() => {}, el);
    const io = new IntersectionObserver(
      ([e]) => {
        on = e.isIntersecting;
        if (on) tl?.play();
        else tl?.pause();
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    Promise.all([document.fonts?.ready, morph ? loadPlugin("MorphSVGPlugin") : null]).then(() => {
      if (dead) return;
      ctx.add(() => {
        tl = fn.current(el);
        if (on) tl.play();
        else tl.pause();
      });
    });
    return () => {
      dead = true;
      io.disconnect();
      ctx.revert();
    };
  }, [root, morph]);
}

/**
 * Cycle (Flip demos): `step(el, k, Flip)` builds ONE step (its Flip state is read right now); when it completes, the next
 * step starts. Starts on screen, pauses off screen.
 */
function useCycle(root: RefObject<HTMLDivElement | null>, step: (el: HTMLDivElement, k: number, Flip: FlipT) => gsap.core.Animation) {
  const fn = useRef(step);
  fn.current = step;
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    let on = false;
    let dead = false;
    let k = 0;
    let F: FlipT | null = null;
    let cur: gsap.core.Animation | null = null;
    const next = () => {
      if (dead || !F) return;
      cur = fn.current(el, k++, F);
      cur.eventCallback("onComplete", next);
      if (!on) cur.pause();
    };
    const kick = () => {
      if (dead || !F) return;
      if (on) {
        if (cur) cur.resume();
        else next();
      } else cur?.pause();
    };
    const io = new IntersectionObserver(
      ([e]) => {
        on = e.isIntersecting;
        kick();
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    Promise.all([document.fonts?.ready, loadPlugin("Flip")]).then(([, f]) => {
      if (dead) return;
      F = f;
      kick();
    });
    return () => {
      dead = true;
      io.disconnect();
      cur?.kill();
    };
  }, [root]);
}

/** Scrub: a paused timeline built once; scroll progress (0..1 over the whole panel) drives tl.progress linearly. */
function useScrubTl(root: RefObject<HTMLDivElement | null>, build: (tl: gsap.core.Timeline, el: HTMLDivElement) => void) {
  const tl = useRef<gsap.core.Timeline | null>(null);
  const pr = useRef(0);
  const fn = useRef(build);
  fn.current = build;
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const t = gsap.timeline({ paused: true, defaults: { ease: "none" } });
      fn.current(t, el);
      tl.current = t;
      t.progress(pr.current);
    }, el);
    return () => {
      tl.current = null;
      ctx.revert();
    };
  }, [root]);
  useScrub(root, (p) => {
    pr.current = p;
    tl.current?.progress(p);
  });
}

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, className = "", style, label = "", w = 1200, h = 900 }: { i: number; className?: string; style?: CSSProperties; label?: string; w?: number; h?: number }) => (
  <img src={scene(i, w, h, label)} alt="" className={`h-full w-full object-cover ${className}`} style={style} draggable={false} />
);

const inr = (n: number) => `₹ ${n.toLocaleString("en-IN")}`;

/* ---------- M242 · Top card tucks to the back (variant of M4: the stack does not fan, the top card slides off and re-enters at the bottom) ---------- */
const M242_CARDS = [
  { name: "Dusk Field", n: "01", p: 4200 },
  { name: "Salt Hour", n: "02", p: 3800 },
  { name: "Green Room", n: "03", p: 4600 },
  { name: "Ember Coast", n: "04", p: 5100 },
  { name: "Low Tide", n: "05", p: 3900 },
];
const M242_ROT = [0, -4, 5, -7, 3];
const depth = (d: number) => ({ y: -d * 20, scale: 1 - d * 0.05, rotation: M242_ROT[d], zIndex: 10 - d, filter: `brightness(${1 - d * 0.12})` });
function M242() {
  const root = useRef<HTMLDivElement>(null);
  const order = useRef([0, 1, 2, 3, 4]);
  useCycle(root, (el) => {
    const cards = gsap.utils.toArray<HTMLElement>(".m242-c", el);
    const o = order.current;
    const top = o[0];
    const nextOrder = [...o.slice(1), top];
    order.current = nextOrder;
    const tl = gsap.timeline();
    tl.to(cards[top], { x: 360, y: -40, rotation: 16, duration: 0.5, ease: "power2.in" })
      .set(cards[top], { zIndex: 0 })
      .add("in");
    nextOrder.forEach((ci, d) => {
      const { zIndex, ...rest } = depth(d);
      if (ci !== top) tl.set(cards[ci], { zIndex }, "in");
      tl.to(cards[ci], { ...rest, x: 0, duration: 0.6, ease: "power3.out" }, "in");
    });
    tl.set(cards[top], { zIndex: 10 - (nextOrder.length - 1) }).to({}, { duration: 0.15 });
    return tl;
  });
  return (
    <Stage r={root} bg="#120d0c" g1="rgba(255,150,100,.5)" g2="rgba(255,214,150,.22)">
      <div className="absolute left-[6%] top-[12%] max-w-[36%]">
        <p className="text-[13px] uppercase tracking-[0.22em] text-[#ffd9b8]/60" style={{ fontFamily: BODY }}>
          Archive prints · Series 04
        </p>
        <h3 className="mt-3 text-[clamp(44px,5vw,80px)] leading-[0.95] text-[#fff1e6]" style={{ fontFamily: EDITORIAL }}>
          One print up. The rest wait their turn.
        </h3>
        <p className="mt-5 max-w-[36ch] text-[15px] leading-relaxed text-white/60" style={{ fontFamily: BODY }}>
          Giclée on cotton rag · signed and numbered · framed in oak
        </p>
      </div>
      <div className="absolute left-[60%] top-[16%] h-[72%] w-[min(24%,320px)]">
        {M242_CARDS.map((c, i) => {
          const d = depth(i);
          return (
            <div
              key={c.n}
              className="m242-c absolute inset-0 overflow-hidden rounded-[18px] border border-white/15 bg-[#1d1512] shadow-[0_30px_60px_rgba(0,0,0,.45)] will-change-transform"
              style={{ zIndex: d.zIndex, transform: `translateY(${d.y}px) rotate(${d.rotation}deg) scale(${d.scale})`, filter: d.filter }}
            >
              <div className="absolute inset-[10px] bottom-[64px] overflow-hidden rounded-[12px]">
                <Img i={i % 4} w={600} h={800} style={{ filter: `hue-rotate(${i * 18}deg)` }} />
              </div>
              <div className="absolute inset-x-[14px] bottom-[14px] flex items-end justify-between text-[#fff1e6]">
                <div>
                  <p className="text-[12px] uppercase tracking-[0.18em] opacity-60" style={{ fontFamily: GROTESK }}>
                    No. {c.n}
                  </p>
                  <p className="text-[20px] leading-tight" style={{ fontFamily: SERIF }}>
                    {c.name}
                  </p>
                </div>
                <p className="text-[14px]" style={{ fontFamily: GROTESK }}>
                  {inr(c.p)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <Sheen g1="rgba(255,150,100,.45)" />
    </Stage>
  );
}

/* ---------- M243 · Piles fly into the grid (variant of M4: rotated piles; the opened pile's cards Flip out to grid slots, the other piles fade) ---------- */
const M243_PILES = [
  { name: "Ceramics", n: 4, i: 3 },
  { name: "Linen", n: 4, i: 0 },
  { name: "Brass", n: 4, i: 1 },
];
const M243_ROT = [-9, 6, -3, 11];
function M243() {
  const root = useRef<HTMLDivElement>(null);
  useCycle(root, (el, k, Flip) => {
    const p = (k >> 1) % 3;
    const opening = k % 2 === 0;
    const mine = gsap.utils.toArray<HTMLElement>(`.m243-c[data-p="${p}"]`, el);
    const others = gsap.utils.toArray<HTMLElement>(`.m243-c:not([data-p="${p}"]), .m243-l:not([data-p="${p}"])`, el);
    const caps = gsap.utils.toArray<HTMLElement>(`.m243-c[data-p="${p}"] .m243-cap`, el);
    const tl = gsap.timeline();
    if (!opening) tl.to(caps, { autoAlpha: 0, duration: 0.2 });
    const state = Flip.getState(mine);
    mine.forEach((c) => c.classList.toggle("open", opening));
    gsap.set(mine, { rotation: (i: number) => (opening ? 0 : Number(mine[i].dataset.r)) });
    tl.add(Flip.from(state, { duration: 0.8, ease: "power3.inOut", stagger: { each: opening ? 0.06 : 0.05, from: opening ? "start" : "end" } }), 0);
    tl.to(others, { autoAlpha: opening ? 0 : 1, scale: opening ? 0.85 : 1, duration: 0.5, ease: "power2.inOut" }, opening ? 0 : 0.3);
    if (opening) tl.fromTo(caps, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.05 }, 0.6);
    tl.to({}, { duration: 0.2 });
    return tl;
  });
  return (
    <Stage r={root} bg="#0d0f0c" g1="rgba(200,190,140,.45)" g2="rgba(110,170,140,.22)">
      <div className="absolute left-[4%] top-[4%]">
        <p className="text-[13px] uppercase tracking-[0.22em] text-[#e9e4cf]/60" style={{ fontFamily: BODY }}>
          Studio Halden · homeware
        </p>
        <h3 className="mt-2 text-[clamp(30px,3vw,48px)] leading-none text-[#f4efe6]" style={{ fontFamily: SERIF, fontWeight: 500 }}>
          Pick a pile.
        </h3>
      </div>
      <div className="absolute inset-0">
        {M243_PILES.map((pl, p) =>
          Array.from({ length: pl.n }, (_, j) => {
            const r = M243_ROT[(j + p) % 4];
            return (
              <div
                key={`${p}-${j}`}
                data-p={p}
                data-r={r}
                className="m243-c overflow-hidden rounded-[12px] border border-white/20 shadow-[0_18px_40px_rgba(0,0,0,.45)] will-change-transform"
                style={{ "--pl": `${10 + p * 33 + j * 0.8}%`, "--pt": `${36 + j * 1.2}%`, "--gl": `${6 + j * 22.5}%`, transform: `rotate(${r}deg)`, zIndex: j } as CSSProperties}
              >
                <Img i={(pl.i + j) % 4} w={500} h={700} style={{ filter: `hue-rotate(${j * 20 + p * 40}deg)` }} />
                <div className="m243-cap invisible absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-8 text-[#f4efe6]">
                  <p className="text-[15px]" style={{ fontFamily: SERIF }}>
                    {pl.name} {["No. 1", "No. 2", "No. 3", "No. 4"][j]}
                  </p>
                  <p className="text-[12px] opacity-75" style={{ fontFamily: GROTESK }}>
                    {inr(1490 + j * 650 + p * 300)}
                  </p>
                </div>
              </div>
            );
          }),
        )}
        {M243_PILES.map((pl, p) => (
          <p key={pl.name} data-p={p} className="m243-l absolute top-[78%] text-[14px] uppercase tracking-[0.2em] text-[#f4efe6]/75" style={{ left: `${11 + p * 33}%`, fontFamily: GROTESK }}>
            {pl.name} · {pl.n}
          </p>
        ))}
      </div>
      <Sheen g1="rgba(200,190,140,.45)" />
    </Stage>
  );
}

/* ---------- M244 · Stacking cards spell a sentence (variant of M40: each card's top edge carries one word; the stack reads as a line) ---------- */
const M244_WORDS = ["We", "craft", "slow", "light", "for", "quiet", "rooms."];
const M244_LAMPS = ["Orla pendant", "Wren sconce", "Moss table lamp", "Halo floor lamp", "Pip clip light", "Dune lantern", "Tor ceiling rose"];
function M244() {
  const root = useRef<HTMLDivElement>(null);
  useScrubTl(root, (tl, el) => {
    const cards = gsap.utils.toArray<HTMLElement>(".m244-c", el);
    cards.slice(1).forEach((c, i) => {
      tl.fromTo(c, { y: () => el.clientHeight * 0.95 }, { y: 0, duration: 1 }, i);
      if (i > 0) tl.to(cards[i], { filter: "brightness(.72)", duration: 1 }, i);
    });
  });
  const tones = ["#2a1d14", "#33241a", "#3d2c1f", "#463324", "#4f3a29", "#59422f", "#644a35"];
  return (
    <Stage r={root} bg="#0f0b08" g1="rgba(255,190,120,.5)" g2="rgba(255,140,90,.22)">
      <div className="absolute inset-x-[10%] bottom-0 top-[5%]">
        {M244_WORDS.map((w, i) => (
          <div
            key={w}
            className="m244-c absolute inset-x-0 h-[40%] overflow-hidden rounded-t-[20px] border border-white/10 shadow-[0_-12px_30px_rgba(0,0,0,.35)] will-change-transform"
            style={{ top: `${i * 9.5}%`, background: tones[i], zIndex: i }}
          >
            <div className="flex h-[23%] items-center" style={{ paddingLeft: `${4 + i * 10}%` }}>
              <span className="text-[clamp(30px,3.2vw,48px)] leading-none text-[#ffe9cf]" style={{ fontFamily: SERIF, fontWeight: 500 }}>
                {w}
              </span>
              <span className="ml-4 text-[12px] uppercase tracking-[0.2em] text-[#ffe9cf]/45" style={{ fontFamily: GROTESK }}>
                0{i + 1}
              </span>
            </div>
            <div className="flex h-[77%] items-center gap-6 px-[4%] pb-4">
              <div className="h-full w-[26%] overflow-hidden rounded-[12px]">
                <Img i={(i + 3) % 4} w={600} h={400} style={{ filter: `hue-rotate(${i * 12}deg)` }} />
              </div>
              <div className="text-[#ffe9cf]">
                <p className="text-[22px]" style={{ fontFamily: SERIF }}>
                  {M244_LAMPS[i]}
                </p>
                <p className="mt-1 text-[14px] text-[#ffe9cf]/60" style={{ fontFamily: BODY }}>
                  Hand-thrown shade · warm 2700K · {inr(5400 + i * 1250)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Sheen g1="rgba(255,190,120,.4)" />
    </Stage>
  );
}

/* ---------- M245 · Halftone resolve (variant of M43: a duotone dot matrix, and a moving lens dissolves the dots into the sharp photo) ---------- */
const M245_FRAG = /* glsl */ `
uniform vec2 uPt;
uniform float uRad;
void main() {
  vec2 px = vUv * uRes;
  vec3 photo = texture2D(uTex0, cover(vUv, uTexRes0)).rgb;
  float cell = 12.0;
  vec2 c = (floor(px / cell) + 0.5) * cell;
  vec3 sampleCol = texture2D(uTex0, cover(c / uRes, uTexRes0)).rgb;
  float lum = dot(sampleCol, vec3(0.299, 0.587, 0.114));
  float r = cell * 0.62 * sqrt(clamp(lum * 1.3, 0.0, 1.0));
  float ink = 1.0 - smoothstep(r - 0.8, r + 0.8, length(px - c));
  vec3 duo = mix(vec3(0.03, 0.04, 0.09), vec3(1.0, 0.56, 0.38), ink);
  float d = length(px - uPt * uRes);
  float m = 1.0 - smoothstep(uRad * 0.55, uRad, d);
  vec3 col = mix(duo, photo, m);
  col += vec3(1.0, 0.8, 0.7) * 0.25 * (smoothstep(uRad * 0.9, uRad, d) - smoothstep(uRad, uRad * 1.06, d));
  gl_FragColor = vec4(col, 1.0);
}`;
function M245() {
  const box = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const c = cv.current;
    const b = box.current;
    if (!c || !b || prefersReducedMotion()) return;
    let h: GLHandle | null = null;
    let dead = false;
    const ptr = { x: 0.5, y: 0.5, t: -10 };
    const onMove = (e: PointerEvent) => {
      const r = b.getBoundingClientRect();
      ptr.x = (e.clientX - r.left) / r.width;
      ptr.y = (e.clientY - r.top) / r.height;
      ptr.t = performance.now() / 1000;
    };
    b.addEventListener("pointermove", onMove);
    (async () => {
      const tex = await toCanvas(scene(1, 1200, 800, "FIELD NOTES"), 1200, 800);
      if (dead) return;
      const cur = { x: 0.5, y: 0.5 };
      h = await createShader(c, M245_FRAG, {
        textures: [tex],
        dpr: 1,
        uniforms: { uPt: { value: [0.5, 0.5] }, uRad: { value: 120 } },
        onFrame: (u, t) => {
          const user = performance.now() / 1000 - ptr.t < 1.5;
          const tx = user ? ptr.x : 0.5 + 0.33 * Math.sin(t * 0.9);
          const ty = user ? ptr.y : 0.5 + 0.3 * Math.sin(t * 1.4 + 1);
          cur.x += (tx - cur.x) * 0.12;
          cur.y += (ty - cur.y) * 0.12;
          (u.uPt as { value: number[] }).value = [cur.x, 1 - cur.y];
          const res = (u.uRes as { value: number[] }).value;
          u.uRad.value = Math.min(res[0], res[1]) * (0.3 + 0.06 * Math.sin(t * 2.1));
          if (dot.current) dot.current.style.transform = `translate(${cur.x * b.clientWidth}px, ${cur.y * b.clientHeight}px)`;
        },
      });
      if (dead) h?.destroy();
    })();
    return () => {
      dead = true;
      b.removeEventListener("pointermove", onMove);
      h?.destroy();
    };
  }, []);
  return (
    <Stage bg="#07080f" g1="rgba(255,140,100,.5)" g2="rgba(120,140,255,.22)">
      <div className="absolute left-[5%] top-[10%] z-40 max-w-[30%]">
        <p className="text-[13px] uppercase tracking-[0.22em] text-[#ffc9b0]/70" style={{ fontFamily: BODY }}>
          Field Notes · Issue 12
        </p>
        <h3 className="mt-3 text-[clamp(44px,4.8vw,78px)] font-[700] leading-[0.92] tracking-[-0.02em] text-[#fff1e6]" style={{ fontFamily: GROTESK }}>
          Printed in dots. Seen in full.
        </h3>
        <p className="mt-5 text-[15px] leading-relaxed text-white/60" style={{ fontFamily: BODY }}>
          Riso quarterly · 96 pages · {inr(1150)}
        </p>
      </div>
      <div ref={box} className="absolute bottom-[6%] right-[4%] top-[6%] w-[58%] overflow-hidden rounded-[20px] border border-white/15">
        <Img i={1} w={1200} h={800} label="FIELD NOTES" />
        <div className="m245-fb absolute inset-0 opacity-0" aria-hidden />
        <canvas ref={cv} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500" aria-hidden />
        <div ref={dot} className="b6r2-dot" style={{ transform: "translate(50%, 50%)" }} aria-hidden />
      </div>
      <Sheen g1="rgba(255,140,100,.45)" />
    </Stage>
  );
}

/* ---------- M246 · Morphing shape mask (variant of M53: the shape is a MASK over a photo, cycling arch → blob → diamond → wave) ---------- */
const M246_SHAPES = [
  { name: "Arch", d: "M210,950 L210,430 C210,190 380,60 500,60 C620,60 790,190 790,430 L790,950 Z" },
  { name: "Blob", d: "M500,80 C730,70 910,250 900,480 C890,710 730,910 500,920 C270,930 100,760 90,520 C80,280 270,90 500,80 Z" },
  { name: "Diamond", d: "M500,50 L950,500 L500,950 L50,500 Z" },
  { name: "Wave", d: "M70,210 C250,120 360,300 500,210 C640,120 750,300 930,210 L930,790 C750,880 640,700 500,790 C360,880 250,700 70,790 Z" },
];
function M246() {
  const root = useRef<HTMLDivElement>(null);
  const id = `m246c${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  usePlay(
    root,
    (el) => {
      const shapes = el.querySelectorAll(".m246-p");
      const chips = Array.from(el.querySelectorAll(".m246-chip"));
      const img = el.querySelector(".m246-img");
      const tl = gsap.timeline({ repeat: -1 });
      [1, 2, 3, 0].forEach((s, j) => {
        tl.to(shapes, { morphSVG: M246_SHAPES[s].d, duration: 0.9, ease: "power2.inOut" })
          .to(img, { scale: j % 2 ? 1 : 1.12, duration: 1, ease: "sine.inOut", transformOrigin: "50% 50%" }, "<")
          .call(() => chips.forEach((c, j) => c.classList.toggle("on", j === s)), undefined, "-=0.45")
          .to({}, { duration: 0.1 });
      });
      return tl;
    },
    true,
  );
  return (
    <Stage r={root} bg="#0c0a12" g1="rgba(180,140,255,.5)" g2="rgba(255,170,200,.22)">
      <div className="absolute left-[6%] top-[12%] max-w-[36%]">
        <p className="text-[13px] uppercase tracking-[0.22em] text-[#e6d9ff]/60" style={{ fontFamily: BODY }}>
          Maison Liora · skin rituals
        </p>
        <h3 className="mt-3 text-[clamp(44px,5vw,80px)] leading-[0.95] text-[#f6f0ff]" style={{ fontFamily: SERIF, fontWeight: 500 }}>
          One ritual, many shapes.
        </h3>
        <div className="mt-7 flex flex-wrap gap-2">
          {M246_SHAPES.map((s, j) => (
            <span key={s.name} className={`m246-chip rounded-full border border-white/25 px-4 py-1.5 text-[13px] transition-colors duration-300 ${j === 0 ? "on" : ""}`} style={{ fontFamily: GROTESK }}>
              {s.name}
            </span>
          ))}
        </div>
      </div>
      <svg viewBox="0 0 1000 1000" className="absolute right-[8%] top-[3%] h-[94%] w-auto overflow-visible" aria-hidden>
        <defs>
          <clipPath id={id}>
            <path className="m246-p" d={M246_SHAPES[0].d} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id})`}>
          <image className="m246-img" href={scene(0, 1000, 1000, "LIORA 02")} x="0" y="0" width="1000" height="1000" preserveAspectRatio="xMidYMid slice" />
        </g>
        <path className="m246-p" d={M246_SHAPES[0].d} fill="none" stroke="rgba(246,240,255,.55)" strokeWidth="3" />
      </svg>
      <Sheen g1="rgba(180,140,255,.4)" />
    </Stage>
  );
}

/* ---------- M247 · Chosen card zooms, others split away (variant of M54: neighbours slide out to the left and right edges) ---------- */
const M247_CASES = ["Kestrel Coffee", "Arda Ceramics", "Nimbus Air", "Folio Press", "Juno Swim", "Larch Studio", "Ondine Tea", "Pell & Rowe"];
const M247_PICK = [1, 6, 4, 3];
const M247_ROT = [-3, 2, -1.5, 3, 2.5, -2, 1.5, -3.5];
function M247() {
  const root = useRef<HTMLDivElement>(null);
  useCycle(root, (el, k, Flip) => {
    const wrap = el.querySelector<HTMLElement>(".m247-w")!;
    const cards = gsap.utils.toArray<HTMLElement>(".m247-c", el);
    const pi = M247_PICK[(k >> 1) % M247_PICK.length];
    const chosen = cards[pi];
    const cap = chosen.querySelector(".m247-cap");
    const opening = k % 2 === 0;
    const cc = pi % 4;
    const tl = gsap.timeline();
    if (!opening) tl.to(cap, { autoAlpha: 0, duration: 0.2 });
    const state = Flip.getState(chosen);
    chosen.classList.toggle("big", opening);
    gsap.set(chosen, { rotation: opening ? 0 : M247_ROT[pi] });
    tl.add(Flip.from(state, { duration: 0.85, ease: "power3.inOut" }), opening ? 0 : 0.15);
    const s = wrap.getBoundingClientRect();
    cards.forEach((c, i) => {
      if (i === pi) return;
      if (!opening) {
        tl.to(c, { x: 0, autoAlpha: 1, duration: 0.85, ease: "power3.inOut" }, 0.15);
        return;
      }
      const col = i % 4;
      const dir = col < cc ? -1 : col > cc ? 1 : cc < 2 ? -1 : 1;
      const r = c.getBoundingClientRect();
      const x = dir < 0 ? -(r.left - s.left) - r.width * 0.62 : s.right - r.right + r.width * 0.62;
      tl.to(c, { x, autoAlpha: 0.55, duration: 0.85, ease: "power3.inOut" }, 0);
    });
    if (opening) tl.fromTo(cap, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.4 }, 0.55);
    tl.to({}, { duration: 0.25 });
    return tl;
  });
  return (
    <Stage r={root} bg="#0b0e12" g1="rgba(120,200,255,.5)" g2="rgba(255,200,140,.2)">
      <div className="m247-w absolute inset-x-[4%] bottom-[6%] top-[6%]">
        {M247_CASES.map((name, i) => (
          <div
            key={name}
            className="m247-c overflow-hidden rounded-[14px] border border-white/15 bg-[#121821] shadow-[0_20px_40px_rgba(0,0,0,.45)] will-change-transform"
            style={{ "--l": `${1 + (i % 4) * 25}%`, "--t": `${i < 4 ? 2 : 54}%`, transform: `rotate(${M247_ROT[i]}deg)` } as CSSProperties}
          >
            <Img i={i % 4} w={900} h={700} style={{ filter: `hue-rotate(${i * 30}deg)` }} />
            <p className="absolute left-3 top-3 rounded-full bg-black/45 px-3 py-1 text-[12px] text-white/90" style={{ fontFamily: GROTESK }}>
              Case {String(i + 1).padStart(2, "0")} · {name}
            </p>
            <div className="m247-cap invisible absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-[5%] pb-[4%] pt-[10%] text-white">
              <p className="text-[13px] uppercase tracking-[0.2em] text-white/60" style={{ fontFamily: BODY }}>
                Identity · packaging · web
              </p>
              <p className="mt-1 text-[clamp(36px,3.6vw,60px)] font-[700] leading-none tracking-[-0.02em]" style={{ fontFamily: WIDE }}>
                {name}
              </p>
            </div>
          </div>
        ))}
      </div>
      <Sheen g1="rgba(120,200,255,.42)" />
    </Stage>
  );
}

/* ---------- M248 · Grid reflow (variant of M54: the WHOLE grid changes column count / order, every tile Flips to its new place, one pass spins) ---------- */
const M248_LAYOUTS = [
  { cols: 4, order: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], spin: false, label: "4 columns" },
  { cols: 6, order: [5, 0, 9, 2, 11, 7, 1, 4, 10, 3, 8, 6], spin: false, label: "6 columns · shuffled" },
  { cols: 3, order: [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0], spin: true, label: "3 columns · spin" },
];
const M248_ITEMS = ["Tote", "Cap", "Scarf", "Mug", "Jar", "Comb", "Socks", "Pouch", "Lamp", "Tray", "Vase", "Bowl"];
function M248() {
  const root = useRef<HTMLDivElement>(null);
  useCycle(root, (el, k, Flip) => {
    const L = M248_LAYOUTS[(k + 1) % M248_LAYOUTS.length];
    const g = el.querySelector<HTMLElement>(".m248-g")!;
    const items = gsap.utils.toArray<HTMLElement>(".m248-t", el);
    const state = Flip.getState(items);
    g.style.gridTemplateColumns = `repeat(${L.cols}, minmax(0, 1fr))`;
    g.style.gridTemplateRows = `repeat(${12 / L.cols}, minmax(0, 1fr))`;
    items.forEach((it, i) => (it.style.order = String(L.order.indexOf(i))));
    el.querySelectorAll(".m248-chip").forEach((c, j) => c.classList.toggle("on", M248_LAYOUTS[j] === L));
    const tl = gsap.timeline();
    tl.add(Flip.from(state, { duration: 0.8, ease: "power2.inOut", absolute: true, spin: L.spin, stagger: 0.015 })).to({}, { duration: 0.2 });
    return tl;
  });
  return (
    <Stage r={root} bg="#0e0d0b" g1="rgba(255,200,120,.48)" g2="rgba(140,200,255,.2)">
      <div className="absolute left-[5%] top-[8%] max-w-[26%]">
        <p className="text-[13px] uppercase tracking-[0.22em] text-[#ffe2b8]/60" style={{ fontFamily: BODY }}>
          Marrow Goods · shop all
        </p>
        <h3 className="mt-3 text-[clamp(40px,4.2vw,68px)] font-[700] leading-[0.95] tracking-[-0.02em] text-[#fff4e4]" style={{ fontFamily: GROTESK }}>
          Same shelf, new order.
        </h3>
        <div className="mt-6 flex flex-col items-start gap-2">
          {M248_LAYOUTS.map((l, j) => (
            <span key={l.label} className={`m248-chip rounded-full border border-white/25 px-4 py-1.5 text-[13px] transition-colors duration-300 ${j === 0 ? "on" : ""}`} style={{ fontFamily: GROTESK }}>
              {l.label}
            </span>
          ))}
        </div>
      </div>
      <div className="m248-g absolute bottom-[6%] right-[4%] top-[6%] w-[62%]" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gridTemplateRows: "repeat(3, minmax(0, 1fr))" }}>
        {M248_ITEMS.map((n, i) => (
          <div key={n} className="m248-t relative min-h-0 min-w-0 overflow-hidden rounded-[12px] border border-white/10">
            <Img i={i % 4} w={500} h={500} style={{ filter: `hue-rotate(${(i * 29) % 120}deg)` }} />
            <p className="absolute bottom-2 left-2.5 text-[12px] text-white/85" style={{ fontFamily: GROTESK }}>
              {n} · {inr(590 + i * 210)}
            </p>
          </div>
        ))}
      </div>
      <Sheen g1="rgba(255,200,120,.42)" />
    </Stage>
  );
}

/* ---------- M249 · Staggered view switch (variant of M248: grid / list / columns views, cards move with a stagger, first- or last-first, expo.inOut) ---------- */
const M249_VIEWS = [
  { cls: "v-grid", label: "Grid", from: "start" as const },
  { cls: "v-list", label: "List", from: "end" as const },
  { cls: "v-cols", label: "Columns", from: "start" as const },
];
const M249_ITEMS = [
  { n: "Ridge runner", p: 8990 },
  { n: "Trail mid GTX", p: 11490 },
  { n: "Court low", p: 6490 },
  { n: "Harbour slip-on", p: 4990 },
  { n: "Summit boot", p: 13990 },
  { n: "City trainer", p: 7490 },
];
function M249() {
  const root = useRef<HTMLDivElement>(null);
  useCycle(root, (el, k, Flip) => {
    const v = M249_VIEWS[(k + 1) % M249_VIEWS.length];
    const g = el.querySelector<HTMLElement>(".m249-g")!;
    const cards = gsap.utils.toArray<HTMLElement>(".m249-c", el);
    const imgs = gsap.utils.toArray<HTMLElement>(".m249-img", el);
    const state = Flip.getState([...cards, ...imgs]);
    M249_VIEWS.forEach((x) => g.classList.toggle(x.cls, x === v));
    el.querySelectorAll(".m249-chip").forEach((c, j) => c.classList.toggle("on", M249_VIEWS[j] === v));
    const lbl = el.querySelector(".m249-from");
    if (lbl) lbl.textContent = v.from === "start" ? "First card moves first" : "Last card moves first";
    const tl = gsap.timeline();
    tl.add(Flip.from(state, { targets: [...cards, ...imgs], duration: 0.9, ease: "expo.inOut", nested: true, absolute: cards, stagger: { each: 0.06, from: v.from } })).to({}, { duration: 0.2 });
    return tl;
  });
  return (
    <Stage r={root} bg="#0b0d10" g1="rgba(150,255,190,.42)" g2="rgba(120,160,255,.22)">
      <div className="absolute left-[5%] top-[8%] max-w-[26%]">
        <p className="text-[13px] uppercase tracking-[0.22em] text-[#c9ffd9]/60" style={{ fontFamily: BODY }}>
          Northpaw footwear · 6 styles
        </p>
        <h3 className="mt-3 text-[clamp(40px,4.2vw,68px)] font-[700] leading-[0.95] tracking-[-0.02em] text-[#f1fff5]" style={{ fontFamily: WIDE }}>
          View it your way.
        </h3>
        <div className="mt-6 flex gap-2">
          {M249_VIEWS.map((x, j) => (
            <span key={x.cls} className={`m249-chip rounded-full border border-white/25 px-4 py-1.5 text-[13px] transition-colors duration-300 ${j === 0 ? "on" : ""}`} style={{ fontFamily: GROTESK }}>
              {x.label}
            </span>
          ))}
        </div>
        <p className="m249-from mt-4 text-[13px] text-white/55" style={{ fontFamily: BODY }}>
          First card moves first
        </p>
      </div>
      <div className="m249-g v-grid absolute bottom-[5%] right-[4%] top-[5%] w-[62%]">
        {M249_ITEMS.map((it, i) => (
          <div key={it.n} className="m249-c">
            <div className="m249-img">
              <Img i={3} w={600} h={400} style={{ filter: `hue-rotate(${i * 50}deg)` }} />
            </div>
            <div className="m249-meta">
              <p className="truncate text-[16px] text-[#f1fff5]" style={{ fontFamily: GROTESK }}>
                {it.n}
              </p>
              <p className="text-[13px] text-white/60" style={{ fontFamily: BODY }}>
                {inr(it.p)}
              </p>
            </div>
          </div>
        ))}
      </div>
      <Sheen g1="rgba(150,255,190,.4)" />
    </Stage>
  );
}

/* ---------- M250 · Lamp light cone (variant of M61: ONE cone hangs from a lamp line and spreads open over the heading as it enters) ---------- */
function M250() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const tl = gsap.timeline({ repeat: -1 });
    tl.fromTo(".m250-line", { scaleX: 0.15, opacity: 0.4 }, { scaleX: 1, opacity: 1, duration: 0.7, ease: "power3.out" }, 0)
      .fromTo(".m250-cone", { scaleX: 0.18, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 1.1, ease: "power2.out" }, 0.1)
      .fromTo(".m250-src", { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: "power2.out" }, 0.05)
      .fromTo(".m250-h", { y: 50, opacity: 0, filter: "blur(10px)" }, { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.9, ease: "power3.out" }, 0.35)
      .fromTo(".m250-sub", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }, 0.6)
      .to(".m250-cone", { scaleX: 0.92, duration: 0.6, ease: "sine.inOut", yoyo: true, repeat: 1 }, 1.25)
      .to([".m250-h", ".m250-sub"], { opacity: 0, y: -14, duration: 0.4, ease: "power2.in" }, 2.45)
      .to([".m250-cone", ".m250-src"], { opacity: 0, duration: 0.45, ease: "power2.in" }, 2.5)
      .to(".m250-line", { scaleX: 0.15, opacity: 0.4, duration: 0.45, ease: "power2.in" }, 2.5);
    void el;
    return tl;
  });
  return (
    <Stage r={root} bg="#04070c" g1="rgba(120,210,255,.5)" g2="rgba(80,120,255,.2)">
      <div className="absolute inset-x-0 top-[3%] h-[26%]">
        <div className="absolute bottom-0 left-1/2 top-0 w-px bg-white/25" />
      </div>
      <div className="m250-src absolute left-[35%] right-[35%] top-[22%] h-[14%] rounded-[50%] bg-[rgba(150,225,255,.55)] blur-[30px]" aria-hidden />
      <div className="m250-cone absolute left-[12%] right-[12%] top-[29%] h-[66%]" style={{ "--lc": "rgba(130,215,255,.42)" } as CSSProperties} aria-hidden />
      <div className="m250-line absolute left-[30%] right-[30%] top-[29%] h-[3px] rounded-full bg-[#d8f3ff] shadow-[0_0_24px_6px_rgba(130,215,255,.7)]" />
      <div className="absolute inset-x-0 top-[44%] text-center">
        <h3 className="m250-h mx-auto max-w-[16ch] text-[clamp(48px,5.6vw,92px)] font-[700] leading-[0.95] tracking-[-0.03em] text-[#f2fbff]" style={{ fontFamily: GROTESK }}>
          Light that finds the page.
        </h3>
        <p className="m250-sub mt-5 text-[15px] text-[#cfeeff]/70" style={{ fontFamily: BODY }}>
          Lumen reading lamp · brushed brass · {inr(7800)}
        </p>
      </div>
    </Stage>
  );
}

/* ---------- M251 · Borders draw, then images (variant of M8: each cell's outline draws clockwise first, then its photo fades and scales in) ---------- */
const M251_CELLS = ["Kitchen", "Bath", "Garden", "Study", "Hall", "Nursery"];
function M251() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const cells = gsap.utils.toArray<HTMLElement>(".m251-cell", el);
    const tl = gsap.timeline({ repeat: -1 });
    cells.forEach((c, i) => {
      const [t, r, b, l] = Array.from(c.querySelectorAll<HTMLElement>(".m251-b"));
      const at = i * 0.12;
      tl.fromTo(t, { scaleX: 0 }, { scaleX: 1, duration: 0.22, ease: "none" }, at)
        .fromTo(r, { scaleY: 0 }, { scaleY: 1, duration: 0.16, ease: "none" }, at + 0.22)
        .fromTo(b, { scaleX: 0 }, { scaleX: 1, duration: 0.22, ease: "none" }, at + 0.38)
        .fromTo(l, { scaleY: 0 }, { scaleY: 1, duration: 0.16, ease: "none" }, at + 0.6);
    });
    tl.fromTo(".m251-img", { autoAlpha: 0, scale: 1.18 }, { autoAlpha: 1, scale: 1, duration: 0.7, ease: "power1.out", stagger: 0.08 }, 1.2)
      .fromTo(".m251-lb", { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.08 }, 1.5)
      .to(".m251-img, .m251-lb", { autoAlpha: 0, duration: 0.35, ease: "power1.in", stagger: 0.04 }, "+=0.02")
      .to(".m251-b", { opacity: 0, duration: 0.25 }, "<0.15")
      .set(".m251-b", { opacity: 1 });
    return tl;
  });
  return (
    <Stage r={root} bg="#0b0b0e" g1="rgba(255,255,255,.3)" g2="rgba(255,180,120,.22)">
      <div className="absolute left-[5%] top-[12%] max-w-[30%]">
        <p className="text-[13px] uppercase tracking-[0.22em] text-white/55" style={{ fontFamily: BODY }}>
          Ferro Tiles · by room
        </p>
        <h3 className="mt-3 text-[clamp(44px,4.8vw,78px)] leading-[0.95] text-[#f6f3ee]" style={{ fontFamily: EDITORIAL }}>
          Lines first. Then the rooms.
        </h3>
        <p className="mt-5 text-[15px] leading-relaxed text-white/60" style={{ fontFamily: BODY }}>
          Glazed terracotta from {inr(240)} per tile
        </p>
      </div>
      <div className="absolute bottom-[8%] right-[5%] top-[8%] grid w-[56%] grid-cols-3 grid-rows-2 gap-4">
        {M251_CELLS.map((n, i) => (
          <div key={n} className="m251-cell relative">
            <span className="m251-b absolute left-0 right-0 top-0 h-px origin-left bg-white/80" />
            <span className="m251-b absolute bottom-0 right-0 top-0 w-px origin-top bg-white/80" />
            <span className="m251-b absolute bottom-0 left-0 right-0 h-px origin-right bg-white/80" />
            <span className="m251-b absolute bottom-0 left-0 top-0 w-px origin-bottom bg-white/80" />
            <div className="absolute inset-[8px] overflow-hidden">
              <Img i={i % 4} w={600} h={600} className="m251-img" style={{ filter: `hue-rotate(${i * 35}deg) saturate(.8)` }} />
            </div>
            <p className="m251-lb absolute bottom-3 left-4 text-[13px] uppercase tracking-[0.16em] text-white/90" style={{ fontFamily: GROTESK }}>
              {n}
            </p>
          </div>
        ))}
      </div>
      <Sheen g1="rgba(255,255,255,.3)" />
    </Stage>
  );
}

/* ---------- M252 · Line draws from the centre out (variant of M8: DrawSVG "50% 50%" → "0% 100%", frame + divider + underline) ---------- */
function M252() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const paths = el.querySelectorAll(".m252-p");
    const tl = gsap.timeline({ repeat: -1 });
    tl.fromTo(paths, { drawSVG: "50% 50%" }, { drawSVG: "0% 100%", duration: 1, ease: "none", stagger: 0.18 })
      .fromTo(".m252-t", { opacity: 0.25, letterSpacing: "0.02em" }, { opacity: 1, letterSpacing: "-0.02em", duration: 0.9, ease: "power2.out" }, 0.1)
      .to(paths, { drawSVG: "50% 50%", duration: 0.6, ease: "none", stagger: 0.08 })
      .to(".m252-t", { opacity: 0.25, duration: 0.5, ease: "power2.in" }, "<");
    return tl;
  });
  return (
    <Stage r={root} bg="#0a0c10" g1="rgba(255,214,120,.48)" g2="rgba(120,180,255,.2)">
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative w-[min(72%,940px)]">
          <svg viewBox="0 0 1000 400" className="block w-full overflow-visible" aria-hidden>
            <path className="m252-p" d="M500,4 H996 V396 H4 V4 H500" fill="none" stroke="#ffd98a" strokeWidth="2.5" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center px-[6%] text-center">
            <p className="text-[13px] uppercase tracking-[0.26em] text-[#ffd98a]/75" style={{ fontFamily: BODY }}>
              Atelier Verso · bookbinding
            </p>
            <h3 className="m252-t mt-3 text-[clamp(44px,5vw,82px)] leading-[1] text-[#fff6e4]" style={{ fontFamily: SERIF, fontWeight: 500 }}>
              Bound by{" "}
              <span className="relative inline-block">
                hand
                <svg viewBox="0 0 200 20" className="absolute -bottom-3 left-0 w-full overflow-visible" aria-hidden>
                  <path className="m252-p" d="M4,12 C60,4 140,4 196,12" fill="none" stroke="#ffd98a" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
              , not by rule.
            </h3>
            <svg viewBox="0 0 1000 4" className="mt-8 w-[60%] overflow-visible" aria-hidden>
              <path className="m252-p" d="M0,2 H1000" fill="none" stroke="rgba(255,217,138,.7)" strokeWidth="2" />
            </svg>
            <p className="mt-5 text-[15px] text-white/60" style={{ fontFamily: BODY }}>
              Linen journals from {inr(1650)} · made to order
            </p>
          </div>
        </div>
      </div>
    </Stage>
  );
}

/* ---------- M253 · Halves slide in from both edges (variant of X1: no overlap — each section's left and right halves enter from their own edges and meet) ---------- */
const M253_SECTIONS = [
  { k: "Chapter 01", h: "Built for the long way round.", s: "Touring frame · steel · from ₹ 64,000", bg: "#1b2a22", i: 2, c: "#d8ffe6" },
  { k: "Chapter 02", h: "Light enough to carry upstairs.", s: "City frame · alloy · from ₹ 48,500", bg: "#2a1c22", i: 1, c: "#ffe0e6" },
  { k: "Chapter 03", h: "Made to be fixed, not replaced.", s: "Repair kit · lifetime parts · ₹ 3,200", bg: "#1c2232", i: 0, c: "#dfe9ff" },
];
function M253() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const secs = gsap.utils.toArray<HTMLElement>(".m253-s", el);
    const tl = gsap.timeline({ repeat: -1 });
    secs.forEach((s) => {
      const L = s.querySelector(".m253-l");
      const R = s.querySelector(".m253-r");
      const txt = s.querySelectorAll(".m253-x");
      tl.set(secs, { autoAlpha: 0 })
        .set(s, { autoAlpha: 1 })
        .fromTo(L, { xPercent: -100 }, { xPercent: 0, duration: 0.8, ease: "power3.out" })
        .fromTo(R, { xPercent: 100 }, { xPercent: 0, duration: 0.8, ease: "power3.out" }, "<")
        .fromTo(txt, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: "power2.out" }, "<0.35")
        .to(L, { xPercent: -100, duration: 0.55, ease: "power2.in" }, "+=0.2")
        .to(R, { xPercent: 100, duration: 0.55, ease: "power2.in" }, "<");
    });
    return tl;
  });
  return (
    <Stage r={root} bg="#07090c" g1="rgba(160,255,200,.42)" g2="rgba(255,160,190,.22)">
      {M253_SECTIONS.map((s, i) => (
        <div key={s.k} className="m253-s absolute inset-0 overflow-hidden" style={{ visibility: i === 0 ? "visible" : "hidden" }}>
          <div className="m253-l absolute bottom-0 left-0 top-0 w-1/2 overflow-hidden will-change-transform">
            <Img i={s.i} w={900} h={900} label="VELO ROWAN" />
          </div>
          <div className="m253-r absolute bottom-0 right-0 top-0 flex w-1/2 flex-col justify-center px-[6%] will-change-transform" style={{ background: s.bg, color: s.c }}>
            <p className="m253-x text-[13px] uppercase tracking-[0.24em] opacity-60" style={{ fontFamily: BODY }}>
              Velo Rowan · {s.k}
            </p>
            <h3 className="m253-x mt-4 text-[clamp(40px,4.4vw,72px)] font-[700] leading-[0.95] tracking-[-0.02em]" style={{ fontFamily: GROTESK }}>
              {s.h}
            </h3>
            <p className="m253-x mt-6 text-[15px] opacity-70" style={{ fontFamily: BODY }}>
              {s.s}
            </p>
          </div>
        </div>
      ))}
      <Sheen g1="rgba(160,255,200,.42)" />
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M242", name: "Top card tucks to the back", how: "The top print slides off the stack and tucks in at the back while the rest step up; loops on a timer.", kind: "play", C: M242 },
  { code: "M243", name: "Piles fly into the grid", how: "One rotated pile opens: its cards Flip out to grid slots while the other piles fade, then fold back; next pile.", kind: "play", C: M243 },
  { code: "M244", name: "Stacking cards spell a sentence", how: "Scroll: cards stack up and each top edge adds one word, so the stack reads as a sentence.", kind: "scrub", C: M244 },
  { code: "M245", name: "Halftone resolve", how: "A duotone halftone image; a moving lens (or your cursor) dissolves the dots into the sharp photo (shader).", kind: "play", C: M245 },
  { code: "M246", name: "Morphing shape mask", how: "A photo shows through a mask that morphs arch → blob → diamond → wave on a loop (MorphSVG).", kind: "play", C: M246 },
  { code: "M247", name: "Chosen card zooms, others split away", how: "From cards on a table, one zooms to fill the area (Flip) while its neighbours slide to the left and right edges.", kind: "play", C: M247 },
  { code: "M248", name: "Grid reflow", how: "The grid changes column count and order; every tile Flips to its new place and size, one pass spins.", kind: "play", C: M248 },
  { code: "M249", name: "Staggered view switch", how: "Grid → list → columns: each card Flips to the new view with a stagger (first- or last-first), expo.inOut.", kind: "play", C: M249 },
  { code: "M250", name: "Lamp light cone", how: "A lamp line widens and one cone of light spreads open over the heading as it rises in; loops.", kind: "play", C: M250 },
  { code: "M251", name: "Borders draw, then images", how: "Each grid cell draws its outline clockwise, then its photo fades and scales in; loops.", kind: "play", C: M251 },
  { code: "M252", name: "Line draws from the centre out", how: "Frame, underline and divider start as a dot at their middle and grow to both ends (DrawSVG 50% 50% → 0% 100%).", kind: "play", C: M252 },
  { code: "M253", name: "Halves slide in from both edges", how: "Each section's left and right halves slide in from their own screen edges and meet in the middle; three sections loop.", kind: "play", C: M253 },
];
