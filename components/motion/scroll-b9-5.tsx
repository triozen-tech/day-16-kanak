"use client";

// MOTION-MENU M458–M469 (scroll group, batch 9 · part 5): small focused demos for /lab/motion.
// "scrub" demos map the panel's scroll LINEARLY (useScrub progress over the whole 220vh panel) onto styles set directly.
// "play" demos run by themselves while on screen (useTicker / timers) and loop. Every demo also has a CSS-only glow loop,
// so a still scroll never reads as a frozen frame. ?static=1 / reduced motion: no animation, a sensible final state.
// Motion ideas only (rebuilt from scratch, no copied code).
import { useEffect, useId, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { createShader, type GLHandle } from "@/lib/gl";
import { scene, toCanvas, useScrub, useTicker } from "@/components/fx/shared";
import type { MotionDef } from "./types";

/** Resolve once the element is within ~1 screen of the viewport, so heavy WebGL setup never runs at page load. */
const near = (el: Element) =>
  new Promise<void>((res) => {
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          io.disconnect();
          res();
        }
      },
      { rootMargin: "900px 0px" },
    );
    io.observe(el);
  });

const GROTESK = "'Space Grotesk Variable', system-ui, sans-serif";
const SERIF = "'Fraunces Variable', Georgia, serif";
const EDITORIAL = "'Instrument Serif', Georgia, serif";
const WIDE = "'Syne Variable', 'Space Grotesk Variable', system-ui, sans-serif";
const MANROPE = "'Manrope Variable', system-ui, sans-serif";
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const mod = (a: number, n: number) => ((a % n) + n) % n;

/* ---------- shared helpers (local copies) ---------- */

/** A soft radial glow that drifts forever (CSS only, scoped to one code), stopped in ?static=1 / reduced motion. */
function Glow({ code, color, at = "50% 45%", className = "" }: { code: string; color: string; at?: string; className?: string }) {
  const c = `${code}-glow`;
  const css = `.${c}{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(circle at ${at},${color} 0%,transparent 52%);animation:${c} 4.6s linear infinite alternate;will-change:transform}
@keyframes ${c}{0%{transform:translate3d(-9%,-5%,0) scale(1)}100%{transform:translate3d(9%,6%,0) scale(1.18)}}
html.is-static .${c}{animation:none}html.is-static {.${c}{animation:none}}`;
  return (
    <>
      <style>{css}</style>
      <div className={`${c} ${className}`} aria-hidden />
    </>
  );
}

/** Scoped keyframes for one demo; the caller lists its animated classes so they stop in ?static=1 / reduced motion. */
function Css({ css, stop }: { css: string; stop: string }) {
  return <style>{`${css}\nhtml.is-static ${stop.split(",").join(",html.is-static ")}{animation:none!important}\nhtml.is-static {${stop}{animation:none!important}}`}</style>;
}

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, className = "", style, label = "", w = 1400, h = 900 }: { i: number; className?: string; style?: CSSProperties; label?: string; w?: number; h?: number }) => (
  <img src={scene(i, w, h, label)} alt="" className={`h-full w-full object-cover ${className}`} style={style} draggable={false} />
);

const Frame = ({ r, bg, children }: { r: RefObject<HTMLDivElement | null>; bg: string; children: ReactNode }) => (
  <div ref={r} className="relative h-full w-full overflow-hidden rounded-[24px]" style={{ background: bg }}>
    {children}
  </div>
);

/** Small mouse icon whose wheel dot ticks down on every (real or auto) wheel step. */
const MouseIcon = ({ className = "", dotClass }: { className?: string; dotClass: string }) => (
  <div className={`flex items-center gap-2 text-[12px] uppercase tracking-[0.18em] text-white/60 ${className}`} style={{ fontFamily: GROTESK }}>
    <span className="relative block h-[30px] w-[19px] rounded-full border-2 border-white/60">
      <span className={`${dotClass} absolute left-1/2 top-[5px] -ml-[2px] block h-[6px] w-[4px] rounded-full bg-white`} />
    </span>
    wheel
  </div>
);

/* ---------- M458 · Path with scenes at stops (variant of M457: the drawn path pauses at stops where small scenes pop in) ---------- */
const M458_D = "M 70 70 C 230 60, 210 250, 330 262 S 560 110, 640 250 S 690 450, 790 440 S 1010 290, 1050 420 S 1020 610, 1130 628";
const M458_STOPS: [number, number, string, string][] = [
  [330, 262, "Picked at dawn", "Estate · 1,400 m"],
  [790, 440, "Roasted slow", "Small batch · 14 min"],
  [1130, 628, "In your cup", "₹890 / month"],
];
function M458() {
  const root = useRef<HTMLDivElement>(null);
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const geo = useRef<{ L: number; fr: number[] } | null>(null);
  const prog = useRef(0);
  const apply = (p: number) => {
    prog.current = p;
    const el = root.current;
    const g = geo.current;
    if (!el || !g) return;
    const mask = el.querySelector<SVGPathElement>(".m458-mask");
    if (mask) mask.style.strokeDashoffset = `${(g.L * (1 - p)).toFixed(1)}`;
    el.querySelectorAll<SVGGElement>(".m458-pop").forEach((s, i) => {
      // each scene pops in over the stretch of path just before its stop (back-out overshoot)
      const k = clamp01((p - (g.fr[i] - 0.07)) / 0.07);
      const e = k === 0 ? 0 : 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2);
      s.style.transform = `scale(${e.toFixed(3)})`;
      s.style.opacity = clamp01(k * 2).toFixed(2);
    });
  };
  useEffect(() => {
    const el = root.current;
    const path = el?.querySelector<SVGPathElement>(".m458-base");
    const mask = el?.querySelector<SVGPathElement>(".m458-mask");
    if (!path || !mask) return;
    const L = path.getTotalLength();
    // where along the path each stop sits (nearest sampled point)
    const fr = M458_STOPS.map(([x, y]) => {
      let best = 0;
      let bd = Infinity;
      for (let s = 0; s <= 400; s++) {
        const pt = path.getPointAtLength((s / 400) * L);
        const d = (pt.x - x) ** 2 + (pt.y - y) ** 2;
        if (d < bd) {
          bd = d;
          best = s / 400;
        }
      }
      return best;
    });
    mask.style.strokeDasharray = `${L} ${L}`;
    geo.current = { L, fr };
    apply(prog.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useScrub(root, apply, { finalValue: 1 });
  const css = `.m458-pop{transform-box:fill-box;transform-origin:center}
.m458-rays{transform-box:fill-box;transform-origin:center;animation:m458-spin 6s linear infinite}
.m458-flame{transform-box:fill-box;transform-origin:50% 100%;animation:m458-flick .55s ease-in-out infinite alternate}
.m458-steam{stroke-dasharray:10 14;animation:m458-steam 1.1s linear infinite}
.m458-dots{animation:m458-dots 1.6s linear infinite}
@keyframes m458-spin{to{transform:rotate(360deg)}}
@keyframes m458-flick{0%{transform:scale(.86,.8)}100%{transform:scale(1.08,1.12)}}
@keyframes m458-steam{to{stroke-dashoffset:48}}
@keyframes m458-dots{to{stroke-dashoffset:-30}}`;
  return (
    <Frame r={root} bg="#0f0b08">
      <Css css={css} stop=".m458-rays,.m458-flame,.m458-steam,.m458-dots" />
      <Glow code="m458" color="rgba(224,145,63,.42)" at="45% 50%" />
      <div className="pointer-events-none absolute right-[5%] top-[7%] text-right text-[#fff6e8]">
        <p className="text-[13px] uppercase tracking-[0.2em] text-white/55">Hillgrove · single origin</p>
        <h3 className="mt-2 text-[clamp(36px,3.6vw,58px)] leading-[0.95]" style={{ fontFamily: SERIF, fontWeight: 500 }}>
          From farm
          <br />
          <span className="italic">to cup.</span>
        </h3>
      </div>
      <svg viewBox="0 0 1200 700" className="absolute inset-[3%] h-[94%] w-[94%]" preserveAspectRatio="xMidYMid meet" aria-hidden>
        <defs>
          <mask id={`m458m${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width="1200" height="700">
            <path className="m458-mask" d={M458_D} fill="none" stroke="#fff" strokeWidth="18" strokeLinecap="round" style={{ strokeDasharray: "4000 4000", strokeDashoffset: 0 }} />
          </mask>
        </defs>
        <path className="m458-base" d={M458_D} fill="none" stroke="#ffd59a" strokeOpacity=".12" strokeWidth="5" strokeLinecap="round" strokeDasharray="0 15" />
        <g mask={`url(#m458m${id})`}>
          <path className="m458-dots" d={M458_D} fill="none" stroke="#ffd59a" strokeWidth="6" strokeLinecap="round" strokeDasharray="0 15" />
        </g>
        {M458_STOPS.map(([x, y, t, s], i) => (
          <g key={t} transform={`translate(${x} ${y})`}>
            <g className="m458-pop">
              <circle r="54" fill="#1d150e" stroke="#e0913f" strokeWidth="3" />
              {i === 0 && (
                <g>
                  <g className="m458-rays">
                    {Array.from({ length: 8 }, (_, k) => (
                      <rect key={k} x="-2.5" y="-36" width="5" height="11" rx="2.5" fill="#ffd59a" transform={`rotate(${k * 45})`} />
                    ))}
                  </g>
                  <circle r="16" fill="#ffb36b" />
                </g>
              )}
              {i === 1 && <path className="m458-flame" d="M0 30 C-22 30 -24 6 -10 -8 C-6 2 0 2 0 -6 C0 -18 6 -26 12 -32 C12 -14 26 -4 22 12 C20 24 12 30 0 30 Z" fill="#ff8a3d" />}
              {i === 2 && (
                <g>
                  <path d="M-24 0 h44 v14 a18 18 0 0 1 -18 18 h-8 a18 18 0 0 1 -18 -18 z" fill="#fff1e6" />
                  <path d="M20 4 a9 9 0 0 1 0 16" fill="none" stroke="#fff1e6" strokeWidth="4" />
                  {[-12, 0, 12].map((sx) => (
                    <path key={sx} className="m458-steam" d={`M${sx} -6 c-6 -8 6 -14 0 -24`} fill="none" stroke="#ffd59a" strokeWidth="3.5" strokeLinecap="round" />
                  ))}
                </g>
              )}
              <text x="0" y={i === 2 ? -78 : 84} textAnchor={i === 2 ? "end" : "middle"} dx={i === 2 ? 50 : 0} fill="#fff6e8" fontSize="24" fontWeight="600" style={{ fontFamily: GROTESK }}>
                {t}
              </text>
              <text x="0" y={i === 2 ? -54 : 108} textAnchor={i === 2 ? "end" : "middle"} dx={i === 2 ? 50 : 0} fill="#ffd59a" fillOpacity=".75" fontSize="17" style={{ fontFamily: GROTESK }}>
                {s}
              </text>
            </g>
          </g>
        ))}
      </svg>
    </Frame>
  );
}

/* ---------- M459 · Path draws with riding marker (variant of M8: a marker rides the drawing tip, turned to the tangent) ---------- */
const M459_D = "M 40 430 C 200 140, 360 140, 460 320 S 700 540, 820 310 S 1040 90, 1160 210";
function M459() {
  const root = useRef<HTMLDivElement>(null);
  const L = useRef(0);
  const prog = useRef(0);
  const apply = (p: number) => {
    prog.current = p;
    const el = root.current;
    if (!el || !L.current) return;
    const path = el.querySelector<SVGPathElement>(".m459-base");
    const draw = el.querySelector<SVGPathElement>(".m459-draw");
    const mk = el.querySelector<SVGGElement>(".m459-mk");
    const km = el.querySelector<HTMLElement>(".m459-km");
    if (!path || !draw || !mk) return;
    const len = Math.max(0.012, p) * L.current;
    draw.style.strokeDashoffset = `${(L.current - len).toFixed(1)}`;
    const a = path.getPointAtLength(len);
    const b = path.getPointAtLength(Math.min(L.current, len + 2));
    const c = len + 2 > L.current ? path.getPointAtLength(len - 2) : a;
    const ang = len + 2 > L.current ? Math.atan2(a.y - c.y, a.x - c.x) : Math.atan2(b.y - a.y, b.x - a.x);
    mk.setAttribute("transform", `translate(${a.x.toFixed(1)} ${a.y.toFixed(1)}) rotate(${((ang * 180) / Math.PI).toFixed(1)})`);
    if (km) km.textContent = Math.round(p * 2740).toLocaleString("en-IN");
  };
  useEffect(() => {
    const el = root.current;
    const path = el?.querySelector<SVGPathElement>(".m459-base");
    const draw = el?.querySelector<SVGPathElement>(".m459-draw");
    if (!path || !draw) return;
    L.current = path.getTotalLength();
    draw.style.strokeDasharray = `${L.current} ${L.current}`;
    apply(prog.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useScrub(root, apply, { finalValue: 1 });
  const css = `.m459-ring{transform-box:fill-box;transform-origin:center;animation:m459-ring 1.2s ease-out infinite}
@keyframes m459-ring{0%{transform:scale(.6);opacity:.9}100%{transform:scale(2.2);opacity:0}}`;
  return (
    <Frame r={root} bg="#070d18">
      <Css css={css} stop=".m459-ring" />
      <Glow code="m459" color="rgba(79,141,255,.42)" at="55% 50%" />
      <div className="pointer-events-none absolute left-[5%] top-[7%] text-[#eaf5ff]">
        <p className="text-[13px] uppercase tracking-[0.2em] text-white/55">Northline freight</p>
        <h3 className="mt-2 text-[clamp(36px,3.8vw,60px)] font-[700] leading-[0.95] tracking-[-0.03em]" style={{ fontFamily: GROTESK }}>
          Shipped in 48 hours.
        </h3>
      </div>
      <svg viewBox="0 0 1200 600" className="absolute inset-x-[2%] bottom-[4%] h-[78%] w-[96%]" preserveAspectRatio="xMidYMid meet" aria-hidden>
        <defs>
          <linearGradient id="m459g" x1="0" x2="1">
            <stop offset="0" stopColor="#2f8cff" />
            <stop offset="1" stopColor="#9fd8ff" />
          </linearGradient>
        </defs>
        <path className="m459-base" d={M459_D} fill="none" stroke="#9fd8ff" strokeOpacity=".16" strokeWidth="3" strokeDasharray="6 10" />
        <path className="m459-draw" d={M459_D} fill="none" stroke="url(#m459g)" strokeWidth="6" strokeLinecap="round" style={{ strokeDasharray: "4000 4000", strokeDashoffset: 0 }} />
        <circle cx="40" cy="430" r="9" fill="#2f8cff" />
        <circle cx="1160" cy="210" r="9" fill="none" stroke="#9fd8ff" strokeWidth="3" />
        <g className="m459-mk" transform="translate(1160 210) rotate(-30)">
          <circle className="m459-ring" r="14" fill="none" stroke="#9fd8ff" strokeWidth="2" />
          <path d="M22 0 L-14 -15 L-7 0 L-14 15 Z" fill="#eaf5ff" />
        </g>
      </svg>
      <div className="pointer-events-none absolute bottom-[6%] right-[5%] text-right text-[#eaf5ff]" style={{ fontFamily: GROTESK }}>
        <p className="text-[13px] uppercase tracking-[0.2em] text-white/55">Mumbai → Shillong</p>
        <p className="mt-1 text-[clamp(26px,2.4vw,38px)] font-[700]">
          <span className="m459-km">2,740</span> km
        </p>
      </div>
    </Frame>
  );
}

/* ---------- M460 · Image marquee along a curve (variant of M39: cards ride an S-curve, turned to its tangent; scroll speeds it up) ---------- */
const M460_D = "M -180 470 C 180 470, 260 130, 600 300 S 1020 130, 1380 150";
const M460_ITEMS: [string, string][] = [
  ["Dune runner", "₹6,490"],
  ["Ember flask", "₹1,290"],
  ["Tide jacket", "₹8,900"],
  ["Moss tote", "₹2,150"],
  ["Halo lamp", "₹4,700"],
  ["Ridge cap", "₹990"],
  ["Coast slide", "₹1,850"],
  ["Ash mug", "₹690"],
  ["Field pack", "₹5,400"],
  ["Glow serum", "₹1,450"],
];
function M460() {
  const root = useRef<HTMLDivElement>(null);
  const st = useRef({ off: 0, boost: 0, lastY: 0, L: 0 });
  const layout = () => {
    const el = root.current;
    const path = el?.querySelector<SVGPathElement>(".m460-path");
    if (!el || !path) return;
    const s = st.current;
    if (!s.L) s.L = path.getTotalLength();
    const sx = el.clientWidth / 1200;
    const sy = el.clientHeight / 600;
    const cards = el.querySelectorAll<HTMLElement>(".m460-card");
    const n = cards.length;
    cards.forEach((c, i) => {
      const u = mod(s.off + i / n, 1);
      const a = path.getPointAtLength(u * s.L);
      const b = path.getPointAtLength(Math.min(s.L, u * s.L + 3));
      const ang = Math.atan2((b.y - a.y) * sy, (b.x - a.x) * sx);
      c.style.transform = `translate3d(${(a.x * sx).toFixed(1)}px,${(a.y * sy).toFixed(1)}px,0) translate(-50%,-50%) rotate(${((ang * 180) / Math.PI).toFixed(2)}deg)`;
    });
  };
  useEffect(() => {
    layout();
    const s = st.current;
    s.lastY = window.scrollY;
    const onScroll = () => {
      const dy = window.scrollY - s.lastY;
      s.lastY = window.scrollY;
      // scroll velocity adds to the speed (and direction); it eases back to cruise in the ticker
      s.boost = gsap.utils.clamp(-0.6, 0.6, s.boost + dy * 0.0012);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(layout);
    if (root.current) ro.observe(root.current);
    return () => {
      window.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useTicker(root, (_t, dt) => {
    const s = st.current;
    const d = Math.min(0.05, dt);
    s.boost *= Math.exp(-d * 2.2);
    s.off = mod(s.off + d * (0.045 + s.boost), 1);
    layout();
  });
  return (
    <Frame r={root} bg="#0b0f17">
      <Glow code="m460" color="rgba(255,77,109,.38)" at="50% 55%" />
      <div className="pointer-events-none absolute left-1/2 top-[7%] w-[min(70%,900px)] -translate-x-1/2 text-center text-[#fff1e6]">
        <p className="text-[13px] uppercase tracking-[0.2em] text-white/55">Arcade store · this week</p>
        <h3 className="mt-2 text-[clamp(38px,3.8vw,62px)] leading-none" style={{ fontFamily: EDITORIAL }}>
          New arrivals, <span className="italic">in motion.</span>
        </h3>
      </div>
      <svg viewBox="0 0 1200 600" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
        <path className="m460-path" d={M460_D} fill="none" stroke="#ffb36b" strokeOpacity=".22" strokeWidth="1.5" strokeDasharray="4 8" vectorEffect="non-scaling-stroke" />
      </svg>
      {M460_ITEMS.map(([t, p], i) => (
        <figure
          key={t}
          className="m460-card absolute left-0 top-0 w-[clamp(120px,10.5vw,160px)] overflow-hidden rounded-[14px] border border-white/15 bg-[#151a26] shadow-[0_18px_40px_rgba(0,0,0,.45)] will-change-transform"
          style={{ transform: `translate3d(${80 + i * 120}px,${300 + (i % 2) * 40}px,0) translate(-50%,-50%)` }}
        >
          <div className="aspect-[4/5]">
            <Img i={i % 4} w={400} h={500} />
          </div>
          <figcaption className="flex justify-between px-2.5 py-2 text-[12px] font-[600] text-white/90" style={{ fontFamily: GROTESK }}>
            <span>{t}</span>
            <span className="text-[#ffb36b]">{p}</span>
          </figcaption>
        </figure>
      ))}
      <Glow code="m460b" color="rgba(255,179,107,.3)" at="60% 60%" className="z-10 opacity-[.45] mix-blend-screen" />
    </Frame>
  );
}

/* ---------- M461 · Endless curved image band (variant of M44: an auto-scrolling band on a curved WebGL plane; scroll adds speed) ---------- */
const M461_TILES = ["DUNE", "SALT", "MOSS", "KILN", "TIDE", "ASH"];
const M461_FRAG = /* glsl */ `
uniform float uOff, uAspect;
void main() {
  float x = vUv.x - 0.5;
  float xx = x * x * 4.0;                 // 0 at the centre, 1 at the edges
  float hh = 0.25 * (1.0 + 0.32 * xx);    // the band grows toward the edges (a concave plane wrapping round the viewer)
  float cy = 0.45 + 0.05 * xx;            // ...and lifts a little at the ends
  float yl = (vUv.y - cy) / hh;
  if (abs(yl) > 1.0) { gl_FragColor = vec4(0.0); return; }
  float vis = uRes.x / (uAspect * 2.0 * 0.25 * uRes.y);   // strip widths across the screen
  float s = x * (1.0 - 0.16 * xx);
  vec4 c = texture2D(uTex0, vec2(fract(uOff + (s + 0.5) * vis), yl * 0.5 + 0.5));
  c.rgb *= 0.62 + 0.38 * (1.0 - xx);
  c.a *= smoothstep(1.0, 0.98, abs(yl));
  gl_FragColor = c;
}`;
function M461() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const fb = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const canvas = cv.current;
    if (!canvas || prefersReducedMotion()) return;
    let dead = false;
    let h: GLHandle | null = null;
    (async () => {
      await near(canvas);
      if (dead) return;
      // one long strip texture: six tiles with gaps (transparent between)
      const TW = 480;
      const TH = 600;
      const G = 60;
      const strip = document.createElement("canvas");
      strip.width = M461_TILES.length * (TW + G);
      strip.height = TH;
      const ctx = strip.getContext("2d")!;
      for (let i = 0; i < M461_TILES.length; i++) {
        const tile = await toCanvas(scene(i % 4, TW, TH, M461_TILES[i]), TW, TH);
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(i * (TW + G) + G / 2, 0, TW, TH, 26);
        ctx.clip();
        ctx.drawImage(tile, i * (TW + G) + G / 2, 0);
        ctx.restore();
      }
      if (dead) return;
      let off = 0;
      let boost = 0;
      let last = 0;
      let hid = false;
      h = await createShader(canvas, M461_FRAG, {
        textures: [strip],
        uniforms: { uOff: { value: 0 }, uAspect: { value: strip.width / strip.height } },
        onFrame: (u, t) => {
          const dt = Math.min(0.05, last ? t - last : 0.016);
          last = t;
          // page scroll adds to speed and direction, then eases back to the cruise speed
          boost += ((u.uVel.value as number) * 1.4 - boost) * (1 - Math.exp(-dt * 2.5));
          off = mod(off + dt * (0.028 + boost * 0.12), 1);
          u.uOff.value = off;
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
    };
  }, []);
  const css = `.m461-row{animation:m461-row 22s linear infinite}
@keyframes m461-row{to{transform:translateX(-50%)}}`;
  return (
    <Frame r={root} bg="#0a0d14">
      <Css css={css} stop=".m461-row" />
      <Glow code="m461" color="rgba(24,196,143,.36)" at="50% 50%" />
      {/* plain fallback strip (static / no WebGL), hidden after the first GL frame */}
      <div ref={fb} className="absolute inset-x-0 top-[22%] h-[46%] overflow-hidden">
        <div className="m461-row flex h-full w-max gap-[2vw]">
          {[...M461_TILES, ...M461_TILES].map((t, i) => (
            <div key={i} className="aspect-[4/5] h-full overflow-hidden rounded-[18px]">
              <Img i={i % 4} w={480} h={600} label={t} />
            </div>
          ))}
        </div>
      </div>
      <canvas ref={cv} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500" aria-hidden />
      <div className="pointer-events-none absolute bottom-[6%] left-[5%] right-[5%] flex items-end justify-between text-[#f1fff4]">
        <h3 className="text-[clamp(32px,3.2vw,52px)] leading-none" style={{ fontFamily: SERIF, fontWeight: 500 }}>
          The archive, <span className="italic">always moving.</span>
        </h3>
        <p className="text-[13px] uppercase tracking-[0.2em] text-white/55">Verda studio · 36 series</p>
      </div>
      <Glow code="m461b" color="rgba(200,255,138,.26)" at="40% 45%" className="z-10 opacity-[.45] mix-blend-screen" />
    </Frame>
  );
}

/* ---------- M462 · Gallery waves with scroll speed (variant of M68: WebGL tiles ripple in proportion to scroll velocity, flat at rest) ---------- */
const M462_FRAG = /* glsl */ `
uniform float uScroll, uAmp;
vec4 pick(float i, vec2 uv) {
  if (i < 0.5) return texture2D(uTex0, uv);
  if (i < 1.5) return texture2D(uTex1, uv);
  if (i < 2.5) return texture2D(uTex2, uv);
  return texture2D(uTex3, uv);
}
void main() {
  vec2 uv = vUv;
  // the ripple: a sine wave whose height follows the scroll speed (zero when the page is still)
  uv.x += sin(uv.y * 10.0 + uTime * 5.0) * 0.022 * uAmp;
  uv.y += sin(uv.x * 7.0 + uTime * 4.0) * 0.014 * uAmp;
  vec2 px = vec2(uv.x, 1.0 - uv.y) * uRes;
  float m = uRes.x * 0.12;
  float g = uRes.x * 0.022;
  float cw = (uRes.x - 2.0 * m - 2.0 * g) / 3.0;
  float th = cw * 1.2;
  float lx = px.x - m;
  float col = floor(lx / (cw + g));
  float inx = lx - col * (cw + g);
  if (col < 0.0 || col > 2.0 || inx > cw) { gl_FragColor = vec4(0.0); return; }
  float y = px.y + uScroll + (abs(col - 1.0) < 0.5 ? th * 0.5 : 0.0);
  float row = floor(y / (th + g));
  float iny = y - row * (th + g);
  if (iny > th) { gl_FragColor = vec4(0.0); return; }
  vec2 q = vec2(inx, iny);
  vec2 d = abs(q - vec2(cw, th) * 0.5) - vec2(cw, th) * 0.5 + 18.0;
  float r = length(max(d, 0.0)) - 18.0;
  vec4 c = pick(mod(row * 3.0 + col, 4.0), vec2(inx / cw, 1.0 - iny / th));
  c.a *= smoothstep(1.0, -1.0, r);
  gl_FragColor = c;
}`;
const M462_LABELS = ["LOOK 01", "LOOK 02", "LOOK 03", "LOOK 04"];
function M462() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const fb = useRef<HTMLDivElement>(null);
  const prog = useRef(0.3);
  const applyFb = (p: number) => {
    prog.current = p;
    const el = root.current;
    const f = fb.current;
    if (!el || !f || f.style.visibility === "hidden") return;
    const H = el.clientHeight;
    const W = el.clientWidth;
    const th = ((W * 0.76 - W * 0.044) / 3) * 1.2;
    f.querySelectorAll<HTMLElement>(".m462-c").forEach((c, j) => {
      c.style.transform = `translate3d(0,${(-p * 2.4 * H - (j === 1 ? th * 0.5 : 0)).toFixed(1)}px,0)`;
    });
  };
  useScrub(root, applyFb, { finalValue: 0.3 });
  useEffect(() => {
    const canvas = cv.current;
    if (!canvas || prefersReducedMotion()) return;
    let dead = false;
    let h: GLHandle | null = null;
    (async () => {
      await near(canvas);
      if (dead) return;
      const tex = await Promise.all(M462_LABELS.map((l, i) => toCanvas(scene(i, 600, 720, l), 600, 720)));
      if (dead) return;
      let amp = 0;
      let last = 0;
      let hid = false;
      h = await createShader(canvas, M462_FRAG, {
        textures: tex,
        uniforms: { uScroll: { value: 0 }, uAmp: { value: 0 } },
        onFrame: (u, t) => {
          const dt = Math.min(0.05, last ? t - last : 0.016);
          last = t;
          const res = u.uRes.value as number[];
          u.uScroll.value = prog.current * 2.4 * res[1];
          amp += (gsap.utils.clamp(-1, 1, (u.uVel.value as number) * 3) - amp) * (1 - Math.exp(-dt * 6));
          u.uAmp.value = amp;
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
    };
  }, []);
  return (
    <Frame r={root} bg="#0d0a10">
      <Glow code="m462" color="rgba(255,77,109,.36)" at="50% 45%" />
      {/* plain fallback grid (static / no WebGL): scrolls the same way, without the ripple */}
      <div ref={fb} className="absolute inset-y-0 left-[12%] right-[12%] grid grid-cols-3 gap-[2.9%]">
        {[0, 1, 2].map((j) => (
          <div key={j} className="m462-c flex flex-col gap-[3.6vh] will-change-transform">
            {Array.from({ length: 9 }, (_, r) => (
              <div key={r} className="aspect-[5/6] shrink-0 overflow-hidden rounded-[18px]">
                <Img i={(r * 3 + j) % 4} w={600} h={720} label={M462_LABELS[(r * 3 + j) % 4]} />
              </div>
            ))}
          </div>
        ))}
      </div>
      <canvas ref={cv} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500" aria-hidden />
      <div className="pointer-events-none absolute left-[3%] top-[6%] z-10 text-[#fff1e6]">
        <p className="text-[13px] uppercase tracking-[0.2em] text-white/70">Rouge atelier</p>
        <p className="mt-1 text-[clamp(28px,2.6vw,42px)] leading-none" style={{ fontFamily: EDITORIAL }}>
          Lookbook
        </p>
      </div>
      <p className="pointer-events-none absolute bottom-[6%] right-[3%] z-10 text-right text-[13px] uppercase tracking-[0.2em] text-white/70">
        Scroll faster,
        <br />
        it ripples
      </p>
      <Glow code="m462b" color="rgba(255,179,107,.3)" at="55% 55%" className="z-10 opacity-[.45] mix-blend-screen" />
    </Frame>
  );
}

/* ---------- M463 · Wheel-stepped slider with bend (variant of M55: one slide per wheel gesture; the plane bows while it travels) ---------- */
const M463_SLIDES = ["Salt flats", "Night ferry", "Glass house", "Low tide"];
const M463_FRAG = /* glsl */ `
uniform float uPos, uBend, uPlane;
vec4 pick(float i, vec2 uv) {
  if (i < 0.5) return texture2D(uTex0, uv);
  if (i < 1.5) return texture2D(uTex1, uv);
  if (i < 2.5) return texture2D(uTex2, uv);
  return texture2D(uTex3, uv);
}
void main() {
  vec2 p = vUv;
  // the bend: the middle of the plane trails behind the edges along the travel direction, and it pinches a little
  p.x += uBend * 0.07 * sin(p.y * 3.14159);
  p.y = 0.5 + (p.y - 0.5) * (1.0 + abs(uBend) * 0.1 * sin(p.x * 3.14159));
  float mx = 0.06;
  float my = 0.1;
  vec2 s2 = vec2((p.x - mx) / (1.0 - 2.0 * mx), (p.y - my) / (1.0 - 2.0 * my));
  if (s2.x < 0.0 || s2.x > 1.0 || s2.y < 0.0 || s2.y > 1.0) { gl_FragColor = vec4(0.0); return; }
  float gap = 0.05;
  float s = uPos + (s2.x - 0.5) * (1.0 + gap) + 0.5;
  float local = fract(s);
  if (local < gap * 0.5 || local > 1.0 - gap * 0.5) { gl_FragColor = vec4(0.0); return; }
  vec2 tuv = vec2((local - gap * 0.5) / (1.0 - gap), s2.y);
  // cover-fit with the plane's aspect (uPlane), so the image never stretches while it bends
  float ta = uTexRes0.x / uTexRes0.y;
  if (uPlane < ta) tuv.x = 0.5 + (tuv.x - 0.5) * uPlane / ta; else tuv.y = 0.5 + (tuv.y - 0.5) * ta / uPlane;
  vec4 c = pick(mod(floor(s), 4.0), tuv);
  c.rgb *= 1.0 - abs(uBend) * 0.18 * (1.0 - sin(p.x * 3.14159));
  gl_FragColor = c;
}`;
function M463() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const fb = useRef<HTMLDivElement>(null);
  const st = useRef({ pos: 0, target: 0, lock: 0, real: 0 });
  useEffect(() => {
    const el = root.current;
    const canvas = cv.current;
    if (!el || !canvas || prefersReducedMotion()) return;
    const s = st.current;
    let dead = false;
    let h: GLHandle | null = null;
    let on = false;
    const io = new IntersectionObserver(([e]) => (on = e.isIntersecting));
    io.observe(el);
    const label = () => {
      const i = mod(s.target, 4);
      const n = el.querySelector<HTMLElement>(".m463-n");
      const t = el.querySelector<HTMLElement>(".m463-t");
      if (n) n.textContent = `0${i + 1}`;
      if (t) t.textContent = M463_SLIDES[i];
      gsap.fromTo(el.querySelector(".m463-dot"), { y: 0, opacity: 1 }, { y: 9, opacity: 0.2, duration: 0.45, ease: "power2.out", yoyo: true, repeat: 1 });
      gsap.fromTo(el.querySelector(".m463-t"), { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: "power3.out" });
    };
    const step = (dir: number) => {
      s.target += dir;
      s.lock = performance.now() + 700;
      gsap.to(s, { pos: s.target, duration: 1.1, ease: "power2.inOut", overwrite: true });
      label();
    };
    // a real wheel gesture: one slide per gesture (the page itself does not scroll), except past the first/last slide
    const wheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 4) return;
      const dir = e.deltaY > 0 ? 1 : -1;
      const i = mod(s.target, 4);
      if ((dir > 0 && i === 3) || (dir < 0 && i === 0)) return;
      e.preventDefault();
      s.real = performance.now();
      if (performance.now() < s.lock) return;
      step(dir);
    };
    el.addEventListener("wheel", wheel, { passive: false });
    // filming: an auto "wheel gesture" every 1.25 s while on screen (pauses after real input)
    const auto = window.setInterval(() => {
      if (on && performance.now() - s.real > 3000) step(1);
    }, 1250);
    (async () => {
      await near(canvas);
      if (dead) return;
      const tex = await Promise.all(M463_SLIDES.map((l, i) => toCanvas(scene(i, 1400, 820, l.toUpperCase()), 1400, 820)));
      if (dead) return;
      let last = 0;
      let lastPos = s.pos;
      let bend = 0;
      let hid = false;
      h = await createShader(canvas, M463_FRAG, {
        textures: tex,
        uniforms: { uPos: { value: 0 }, uBend: { value: 0 }, uPlane: { value: 1.6 } },
        onFrame: (u, t) => {
          const dt = Math.min(0.05, last ? t - last : 0.016);
          last = t;
          const v = (s.pos - lastPos) / Math.max(0.001, dt);
          lastPos = s.pos;
          bend += (gsap.utils.clamp(-1.4, 1.4, v * 0.9) - bend) * (1 - Math.exp(-dt * 10));
          const res = u.uRes.value as number[];
          u.uPos.value = s.pos;
          u.uBend.value = bend;
          u.uPlane.value = (res[0] * 0.88) / (res[1] * 0.8);
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
      io.disconnect();
      window.clearInterval(auto);
      el.removeEventListener("wheel", wheel);
      gsap.killTweensOf(s);
    };
  }, []);
  return (
    <Frame r={root} bg="#080b12">
      <Glow code="m463" color="rgba(47,140,255,.4)" at="50% 50%" />
      <div ref={fb} className="absolute inset-x-[6%] inset-y-[10%] overflow-hidden">
        <Img i={0} w={1400} h={820} label="SALT FLATS" />
      </div>
      <canvas ref={cv} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500" aria-hidden />
      <div className="pointer-events-none absolute bottom-[2.4%] left-[6%] right-[6%] z-10 flex items-end justify-between text-[#eaf5ff]">
        <div className="flex items-baseline gap-3 overflow-hidden" style={{ fontFamily: GROTESK }}>
          <span className="m463-n text-[15px] font-[700] text-[#9fd8ff]">01</span>
          <span className="text-[13px] text-white/50">/ 04</span>
          <span className="m463-t ml-2 inline-block text-[clamp(18px,1.6vw,26px)]" style={{ fontFamily: EDITORIAL }}>
            Salt flats
          </span>
        </div>
        <MouseIcon dotClass="m463-dot" />
      </div>
      <p className="pointer-events-none absolute left-[6%] top-[3%] z-10 text-[13px] uppercase tracking-[0.2em] text-white/60">Iris Vale · photographs</p>
      <Glow code="m463b" color="rgba(159,216,255,.28)" at="45% 45%" className="z-10 opacity-[.45] mix-blend-screen" />
    </Frame>
  );
}

/* ---------- M464 · Lock-snap section scroll (variant of M154: each wheel gesture travels exactly one full section with lerp easing) ---------- */
const M464_SECTIONS: [string, string, string, number][] = [
  ["Arrive", "Check in at the cliff house", "From ₹18,500 / night", 0],
  ["Unwind", "Salt pool, open till midnight", "Included with every stay", 2],
  ["Taste", "Seven courses, all local", "Tasting menu ₹4,200", 3],
  ["Stay", "Book the long weekend", "Three nights ₹49,000", 1],
];
function M464() {
  const root = useRef<HTMLDivElement>(null);
  const win = useRef<HTMLDivElement>(null);
  const st = useRef({ cur: 0, target: 0, next: 0, lock: 0, real: 0 });
  const pulse = () => {
    const el = root.current;
    if (!el) return;
    gsap.fromTo(el.querySelector(".m464-dot"), { y: 0, opacity: 1 }, { y: 9, opacity: 0.2, duration: 0.4, ease: "power2.out", yoyo: true, repeat: 1 });
  };
  useEffect(() => {
    const w = win.current;
    if (!w || prefersReducedMotion()) return;
    const s = st.current;
    // real wheel: one section per gesture; past the last (or before the first) section the page scrolls on
    const wheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 4) return;
      const dir = e.deltaY > 0 ? 1 : -1;
      const i = mod(s.target, 4);
      if ((dir > 0 && i === 3) || (dir < 0 && i === 0)) return;
      e.preventDefault();
      s.real = performance.now();
      if (performance.now() < s.lock) return;
      s.target = i + dir;
      s.lock = performance.now() + 550;
      pulse();
    };
    w.addEventListener("wheel", wheel, { passive: false });
    return () => w.removeEventListener("wheel", wheel);
  }, []);
  useTicker(root, (t, dt) => {
    const el = root.current;
    const w = win.current;
    if (!el || !w) return;
    const s = st.current;
    const d = Math.min(0.05, dt);
    const H = w.clientHeight;
    // filming: an auto wheel gesture every 1.15 s (the 5th section is a copy of the 1st, so the loop wraps seamlessly)
    if (t > s.next && performance.now() - s.real > 2500) {
      s.next = t + 1.15;
      if (s.target >= 4) {
        s.target = 0;
        s.cur -= 4;
      }
      s.target += 1;
      pulse();
    }
    // the lerp easing (smooth-scroll style): every frame closes a fixed share of the remaining distance
    s.cur += (s.target - s.cur) * (1 - Math.exp(-d * 6.5));
    const page = w.querySelector<HTMLElement>(".m464-page");
    if (page) page.style.transform = `translate3d(0,${(-s.cur * H).toFixed(1)}px,0)`;
    const act = mod(Math.round(s.cur), 4);
    el.querySelectorAll<HTMLElement>(".m464-nav span").forEach((n, i) => {
      n.style.transform = `scaleY(${i === act ? 2.4 : 1})`;
      n.style.opacity = i === act ? "1" : ".35";
    });
  });
  return (
    <Frame r={root} bg="#0c0f0d">
      <Glow code="m464" color="rgba(24,196,143,.42)" at="50% 50%" />
      <div className="absolute left-1/2 top-1/2 h-[84%] w-[min(66%,880px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[18px] border border-white/15 bg-[#101512] shadow-[0_30px_80px_rgba(0,0,0,.5)]">
        <div className="flex h-[30px] items-center gap-1.5 border-b border-white/10 px-3">
          {[0, 1, 2].map((k) => (
            <span key={k} className="h-2.5 w-2.5 rounded-full bg-white/20" />
          ))}
          <span className="ml-3 text-[12px] text-white/45" style={{ fontFamily: GROTESK }}>
            cliffhouse.stay
          </span>
        </div>
        <div ref={win} className="relative h-[calc(100%-30px)] overflow-hidden">
          <div className="m464-page absolute inset-0 will-change-transform">
            {[...M464_SECTIONS, M464_SECTIONS[0]].map(([t, s, p, i], k) => (
              <section key={k} className="relative h-full overflow-hidden">
                <div className="absolute inset-0">
                  <Img i={i} w={1200} h={760} />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />
                </div>
                <div className="absolute bottom-[12%] left-[7%] text-[#f1fff4]">
                  <p className="text-[13px] uppercase tracking-[0.2em] text-white/60">0{(k % 4) + 1} · Cliff House</p>
                  <h3 className="mt-2 text-[clamp(48px,5vw,84px)] leading-[0.9]" style={{ fontFamily: SERIF, fontWeight: 500 }}>
                    {t}.
                  </h3>
                  <p className="mt-3 text-[16px] text-white/85" style={{ fontFamily: MANROPE }}>
                    {s}
                  </p>
                  <p className="mt-1 text-[14px] text-[#c8ff8a]" style={{ fontFamily: MANROPE }}>
                    {p}
                  </p>
                </div>
              </section>
            ))}
          </div>
          <div className="m464-nav pointer-events-none absolute right-4 top-1/2 flex -translate-y-1/2 flex-col gap-3">
            {[0, 1, 2, 3].map((k) => (
              <span key={k} className="block h-[10px] w-[3px] rounded-full bg-white transition-[transform,opacity] duration-300" style={{ opacity: k === 0 ? 1 : 0.35 }} />
            ))}
          </div>
        </div>
      </div>
      <MouseIcon className="absolute bottom-[4%] right-[4%]" dotClass="m464-dot" />
      <p className="pointer-events-none absolute left-[4%] top-[6%] max-w-[16ch] text-[13px] uppercase tracking-[0.2em] text-white/55">One gesture, one section</p>
    </Frame>
  );
}

/* ---------- M465 · Infinite loop menu (variant of M14: a big menu list wraps forever with scroll, it never reaches an end) ---------- */
const M465_ITEMS = ["Stories", "Atelier", "Objects", "Journal", "Studio", "Visit"];
function M465() {
  const root = useRef<HTMLDivElement>(null);
  const setH = useRef(0);
  const prog = useRef(0);
  const apply = (p: number) => {
    prog.current = p;
    const el = root.current;
    const list = el?.querySelector<HTMLElement>(".m465-list");
    if (!el || !list || !setH.current) return;
    const S = setH.current;
    const H = el.clientHeight;
    // 2.5 laps over the panel; the wrap jumps by exactly one copy, so the seam never shows
    const y = -mod(p * 2.5 * S, S);
    list.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
    list.querySelectorAll<HTMLElement>(".m465-i").forEach((it) => {
      const cy = y + it.offsetTop + it.offsetHeight / 2;
      const d = gsap.utils.clamp(-1, 1, (cy - H / 2) / (H / 2));
      it.style.opacity = (0.22 + 0.78 * (1 - Math.abs(d)) ** 2).toFixed(3);
      it.style.transform = `translate3d(${(Math.abs(d) * 4).toFixed(2)}vw,0,0)`;
    });
  };
  useEffect(() => {
    const el = root.current;
    const first = el?.querySelector<HTMLElement>(".m465-set");
    if (!el || !first) return;
    const measure = () => {
      setH.current = first.offsetHeight;
      apply(prog.current);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useScrub(root, apply, { finalValue: 0 });
  return (
    <Frame r={root} bg="#0d0b09">
      <Glow code="m465" color="rgba(224,145,63,.4)" at="50% 50%" />
      <div className="pointer-events-none absolute inset-x-0 top-1/2 z-0 h-[17%] -translate-y-1/2 border-y border-white/10" />
      <div className="m465-list absolute inset-x-0 top-0 will-change-transform">
        {[0, 1, 2].map((c) => (
          <div key={c} className="m465-set" aria-hidden={c > 0}>
            {M465_ITEMS.map((t, i) => (
              <div key={t} className="m465-i flex items-baseline justify-center gap-[1.4vw] py-[1.6vh] will-change-transform">
                <span className="text-[13px] text-[#ffd59a]" style={{ fontFamily: GROTESK }}>
                  0{i + 1}
                </span>
                <span className="text-[clamp(56px,6.4vw,104px)] leading-none text-[#fff6e8]" style={{ fontFamily: SERIF, fontWeight: 400 }}>
                  {i % 2 ? <span className="italic">{t}</span> : t}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <p className="pointer-events-none absolute left-[4%] top-[6%] text-[13px] uppercase tracking-[0.2em] text-white/55">Maison Oro · menu</p>
      <p className="pointer-events-none absolute bottom-[6%] right-[4%] text-[13px] uppercase tracking-[0.2em] text-white/55">Scroll · it never ends</p>
    </Frame>
  );
}

/* ---------- M466 · Infinite loop with item scaling (variant of M465: items squash to 0 on Y as they leave the top, grow from 0 as they enter) ---------- */
const M466_ITEMS: [string, string, number][] = [
  ["Dune vase", "₹2,400", 3],
  ["Tide bowl", "₹1,650", 0],
  ["Moss jar", "₹980", 2],
  ["Ember cup", "₹740", 1],
  ["Salt plate", "₹1,200", 0],
];
function M466() {
  const root = useRef<HTMLDivElement>(null);
  const prog = useRef(0.1);
  const apply = (p: number) => {
    prog.current = p;
    const el = root.current;
    if (!el) return;
    const H = el.clientHeight;
    const h = H * 0.36;
    const pitch = h + H * 0.04;
    const n = M466_ITEMS.length;
    const S = n * pitch;
    const off = mod(p * 2.2 * S, S);
    el.querySelectorAll<HTMLElement>(".m466-i").forEach((it, j) => {
      const y = j * pitch - off - pitch;
      // leaving the top: shrinks to 0 (pinned to its bottom edge); entering the bottom: grows from 0 (pinned to its top edge)
      const sTop = clamp01((y + h) / h);
      const sBot = clamp01((H - y) / h);
      const sc = Math.min(sTop, sBot);
      it.style.height = `${h.toFixed(1)}px`;
      it.style.transformOrigin = y + h / 2 < H / 2 ? "50% 100%" : "50% 0%";
      it.style.transform = `translate3d(0,${y.toFixed(1)}px,0) scaleY(${sc.toFixed(4)})`;
      it.style.visibility = sc <= 0.001 ? "hidden" : "visible";
    });
  };
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const ro = new ResizeObserver(() => apply(prog.current));
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useScrub(root, apply, { finalValue: 0.1 });
  const all = [...M466_ITEMS, ...M466_ITEMS, ...M466_ITEMS];
  return (
    <Frame r={root} bg="#0f0c0a">
      <Glow code="m466" color="rgba(255,179,107,.38)" at="50% 50%" />
      {all.map(([t, pr, i], j) => (
        <figure
          key={j}
          className="m466-i absolute left-[14%] right-[14%] top-0 overflow-hidden rounded-[14px] will-change-transform"
          style={{ height: "36%", transform: `translate3d(0,${(j - 1) * 40}vh,0)`, visibility: j >= 1 && j <= 3 ? "visible" : "hidden" }}
          aria-hidden={j >= M466_ITEMS.length}
        >
          <Img i={i} w={1300} h={420} />
          <figcaption className="absolute inset-x-[3%] bottom-[10%] flex items-end justify-between text-[#fff6e8]">
            <span className="text-[clamp(30px,3vw,48px)] leading-none" style={{ fontFamily: SERIF, fontWeight: 500 }}>
              {t}
            </span>
            <span className="text-[15px] font-[600]" style={{ fontFamily: GROTESK }}>
              No. 0{(j % M466_ITEMS.length) + 1} · {pr}
            </span>
          </figcaption>
        </figure>
      ))}
      <p className="pointer-events-none absolute left-[2%] top-[4%] z-10 text-[13px] uppercase tracking-[0.2em] text-white/60 [writing-mode:vertical-rl]">Clayform · ceramics</p>
      <Glow code="m466b" color="rgba(255,213,154,.28)" at="45% 50%" className="z-10 opacity-[.45] mix-blend-screen" />
    </Frame>
  );
}

/* ---------- M467 · Infinite layered pinning (variant of M29: panels stack one over the other and the stack loops back to the first) ---------- */
const M467_PANELS: [string, string, string, string, number][] = [
  ["Dawn", "Cold brew tonic", "₹240", "#1a2a4a", 0],
  ["Noon", "Citrus soda", "₹180", "#4a2a12", 3],
  ["Dusk", "Hibiscus fizz", "₹220", "#4a1424", 1],
  ["Night", "Mint cooler", "₹200", "#0f3328", 2],
];
function M467() {
  const root = useRef<HTMLDivElement>(null);
  const apply = (p: number) => {
    const el = root.current;
    if (!el) return;
    const N = M467_PANELS.length;
    // 8 hand-overs over the panel = two full laps; at the end the first panel is back on top
    const f = p * 2 * N;
    const k = Math.min(Math.floor(f), 2 * N);
    const t = f - k;
    const base = k % N;
    const inc = (k + 1) % N;
    el.querySelectorAll<HTMLElement>(".m467-p").forEach((pn, i) => {
      const shade = pn.querySelector<HTMLElement>(".m467-shade");
      if (i === base) {
        pn.style.visibility = "visible";
        pn.style.zIndex = "1";
        pn.style.transform = `translate3d(0,0,0) scale(${(1 - 0.08 * t).toFixed(4)})`;
        if (shade) shade.style.opacity = (0.6 * t).toFixed(3);
      } else if (i === inc && t > 0) {
        pn.style.visibility = "visible";
        pn.style.zIndex = "2";
        pn.style.transform = `translate3d(0,${((1 - t) * 100).toFixed(3)}%,0)`;
        if (shade) shade.style.opacity = "0";
      } else {
        pn.style.visibility = "hidden";
      }
    });
    const n = el.querySelector<HTMLElement>(".m467-n");
    if (n) n.textContent = `0${(t > 0.5 ? inc : base) + 1}`;
  };
  useScrub(root, apply, { finalValue: 0 });
  return (
    <Frame r={root} bg="#06080e">
      <Glow code="m467" color="rgba(150,120,255,.4)" at="50% 50%" />
      {M467_PANELS.map(([w, d, pr, bg, i], k) => (
        <section
          key={w}
          className="m467-p absolute inset-0 grid grid-cols-[1fr_1.05fr] overflow-hidden will-change-transform"
          style={{ background: bg, visibility: k === 0 ? "visible" : "hidden", transform: k === 0 ? "none" : "translate3d(0,100%,0)", transformOrigin: "50% 0%" }}
          aria-hidden={k > 0}
        >
          <div className="relative overflow-hidden">
            <Img i={i} w={900} h={900} />
          </div>
          <div className="flex flex-col justify-center px-[6%] text-[#fff6e8]">
            <p className="text-[13px] uppercase tracking-[0.2em] text-white/60">Hourglass drinks · all day</p>
            <h3 className="mt-3 text-[clamp(72px,7.4vw,124px)] font-[800] uppercase leading-[0.86] tracking-[-0.04em]" style={{ fontFamily: WIDE }}>
              {w}
            </h3>
            <p className="mt-5 text-[18px] text-white/85" style={{ fontFamily: MANROPE }}>
              {d} <span className="ml-3 font-[700] text-white">{pr}</span>
            </p>
          </div>
          <div className="m467-shade pointer-events-none absolute inset-0 bg-black opacity-0" />
        </section>
      ))}
      <p className="pointer-events-none absolute bottom-[5%] right-[4%] z-10 text-[14px] font-[700] text-white/80" style={{ fontFamily: GROTESK }}>
        <span className="m467-n">01</span> <span className="text-white/45">/ 04 · loops</span>
      </p>
      <Glow code="m467b" color="rgba(180,140,255,.3)" at="55% 45%" className="z-10 opacity-[.45] mix-blend-screen" />
    </Frame>
  );
}

/* ---------- M468 · Fixed media under scrolling panels (variant of M7: the media stays put, solid panels slide over it, it shows in the gaps) ---------- */
const M468_PANELS: [string, string, string][] = [
  ["01 · The source", "Spring water from 1,900 m, bottled within the hour.", "750 ml · ₹160"],
  ["02 · The glass", "Hand-blown, tinted with river sand, made to be refilled.", "Refill at ₹60"],
  ["03 · The table", "Poured in 120 kitchens across the coast this season.", "Trade price on request"],
];
function M468() {
  const root = useRef<HTMLDivElement>(null);
  const apply = (p: number) => {
    const el = root.current;
    const col = el?.querySelector<HTMLElement>(".m468-col");
    if (!el || !col) return;
    const H = el.clientHeight;
    // the panels (with gaps between them) cross the stage linearly; the media layer does not move with them
    const y = H * 0.55 - p * (col.scrollHeight - H * 0.1);
    col.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
  };
  useScrub(root, apply, { finalValue: 0.3 });
  const css = `.m468-kb{animation:m468-kb 9s linear infinite alternate;transform-origin:50% 50%}
@keyframes m468-kb{0%{transform:scale(1.04) translate3d(-1.5%,0,0)}100%{transform:scale(1.16) translate3d(1.5%,-1%,0)}}`;
  return (
    <Frame r={root} bg="#071019">
      <Css css={css} stop=".m468-kb" />
      <div className="absolute inset-0 overflow-hidden">
        <Img i={0} w={1600} h={1000} label="HIGHSPRING" className="m468-kb will-change-transform" />
        <div className="absolute inset-0 bg-black/15" />
      </div>
      <Glow code="m468" color="rgba(159,216,255,.3)" at="50% 40%" className="opacity-[.6] mix-blend-screen" />
      <div className="m468-col absolute inset-x-0 top-0 will-change-transform" style={{ transform: "translate3d(0,18vh,0)" }}>
        {M468_PANELS.map(([t, d, pr]) => (
          <div key={t} className="mb-[38vh] flex min-h-[44vh] items-center bg-[#08111c] px-[8%] text-[#eaf5ff] shadow-[0_-20px_60px_rgba(0,0,0,.35)]">
            <div className="grid w-full grid-cols-[1.1fr_1fr] items-end gap-[6%]">
              <h3 className="text-[clamp(40px,4.2vw,68px)] leading-[0.95]" style={{ fontFamily: SERIF, fontWeight: 500 }}>
                {t.split(" · ")[1]}
                <span className="mt-2 block text-[13px] uppercase tracking-[0.2em] text-[#9fd8ff]" style={{ fontFamily: GROTESK }}>
                  {t.split(" · ")[0]}
                </span>
              </h3>
              <div style={{ fontFamily: MANROPE }}>
                <p className="text-[17px] leading-relaxed text-white/75">{d}</p>
                <p className="mt-3 text-[15px] font-[700] text-[#9fd8ff]">{pr}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="pointer-events-none absolute left-[4%] top-[5%] text-[13px] uppercase tracking-[0.2em] text-white/80">Highspring water</p>
    </Frame>
  );
}

/* ---------- M469 · Sticky screen, content scrolls inside (the device frame stays pinned; its page scrolls with the page scroll) ---------- */
const M469_PRODUCTS: [string, string, number][] = [
  ["Rain shell", "₹5,600", 0],
  ["Trail tee", "₹1,290", 2],
  ["Cord trousers", "₹3,400", 3],
  ["Wool beanie", "₹990", 1],
  ["Canvas tote", "₹1,450", 2],
  ["Rope sandal", "₹1,900", 3],
];
function M469() {
  const root = useRef<HTMLDivElement>(null);
  const apply = (p: number) => {
    const el = root.current;
    const scr = el?.querySelector<HTMLElement>(".m469-screen");
    const page = el?.querySelector<HTMLElement>(".m469-page");
    const thumb = el?.querySelector<HTMLElement>(".m469-thumb");
    if (!el || !scr || !page) return;
    const travel = Math.max(0, page.scrollHeight - scr.clientHeight);
    page.style.transform = `translate3d(0,${(-p * travel).toFixed(1)}px,0)`;
    if (thumb) thumb.style.transform = `translate3d(0,${(p * (scr.clientHeight - thumb.offsetHeight - 8)).toFixed(1)}px,0)`;
  };
  useScrub(root, apply, { finalValue: 0.35 });
  return (
    <Frame r={root} bg="#0b0d12">
      <Glow code="m469" color="rgba(255,77,109,.36)" at="62% 50%" />
      <div className="pointer-events-none absolute left-[5%] top-1/2 w-[26%] -translate-y-1/2 text-[#fff1e6]">
        <p className="text-[13px] uppercase tracking-[0.2em] text-white/55">Monsoon store · live</p>
        <h3 className="mt-3 text-[clamp(36px,3.4vw,56px)] font-[700] leading-[0.95] tracking-[-0.03em]" style={{ fontFamily: GROTESK }}>
          The whole shop, one scroll.
        </h3>
        <p className="mt-4 text-[15px] text-white/65" style={{ fontFamily: MANROPE }}>
          The frame stays put. The page inside it moves with yours.
        </p>
      </div>
      <div className="absolute right-[5%] top-1/2 aspect-[16/10.4] h-[84%] max-w-[62%] -translate-y-1/2 rounded-[22px] border border-white/15 bg-[#1a1d24] p-[1.2%] shadow-[0_30px_90px_rgba(0,0,0,.6)]">
        <div className="m469-screen relative h-full w-full overflow-hidden rounded-[12px] bg-[#f6f1ea]" style={{ fontFamily: MANROPE }}>
          <div className="m469-page will-change-transform">
            <div className="flex items-center justify-between px-[5%] py-3 text-[13px] font-[700] text-[#1a1410]">
              <span style={{ fontFamily: GROTESK }}>MONSOON</span>
              <span className="flex gap-4 font-[500] text-[#1a1410]/70">
                <span>New</span>
                <span>Men</span>
                <span>Women</span>
                <span>Bag (2)</span>
              </span>
            </div>
            <div className="relative mx-[3%] h-[220px] overflow-hidden rounded-[10px]">
              <Img i={1} w={1000} h={440} />
              <div className="absolute bottom-4 left-5 text-white">
                <p className="text-[12px] uppercase tracking-[0.18em] text-white/80">Drop 04</p>
                <p className="text-[34px] leading-none" style={{ fontFamily: SERIF, fontWeight: 500 }}>
                  The rain edit
                </p>
              </div>
            </div>
            <p className="px-[5%] pb-2 pt-5 text-[13px] font-[700] uppercase tracking-[0.16em] text-[#1a1410]/60">Bestsellers</p>
            <div className="grid grid-cols-3 gap-3 px-[3%]">
              {M469_PRODUCTS.map(([n, pr, i]) => (
                <div key={n}>
                  <div className="aspect-[4/5] overflow-hidden rounded-[8px]">
                    <Img i={i} w={360} h={450} />
                  </div>
                  <p className="mt-1.5 flex justify-between text-[12px] font-[600] text-[#1a1410]">
                    <span>{n}</span>
                    <span>{pr}</span>
                  </p>
                </div>
              ))}
            </div>
            <div className="mx-[3%] mt-5 rounded-[10px] bg-[#1a1410] px-5 py-5 text-[#f6f1ea]">
              <p className="text-[22px]" style={{ fontFamily: SERIF, fontWeight: 500 }}>
                Free shipping over ₹1,999
              </p>
              <p className="mt-1 text-[13px] text-white/65">Easy returns for 30 days, always.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 px-[3%] pt-5">
              {[
                ["“Kept me dry on a 9 km walk.”", "Asha R."],
                ["“The tote goes everywhere now.”", "Dev K."],
              ].map(([q, a]) => (
                <div key={a} className="rounded-[10px] border border-[#1a1410]/10 p-4 text-[13px] text-[#1a1410]">
                  <p>{q}</p>
                  <p className="mt-2 text-[12px] font-[700] text-[#1a1410]/55">{a} · ★★★★★</p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-between bg-[#e9e1d6] px-[5%] py-6 text-[12px] text-[#1a1410]/70">
              <span style={{ fontFamily: GROTESK }} className="font-[700] text-[#1a1410]">
                MONSOON
              </span>
              <span>Concept store · sample prices</span>
            </div>
          </div>
          <div className="m469-thumb absolute right-1 top-1 h-[18%] w-[4px] rounded-full bg-[#1a1410]/35 will-change-transform" />
        </div>
      </div>
    </Frame>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M458", name: "Path with scenes at stops", how: "A dotted path draws across the stage with scroll; at each stop a small animated scene pops in, then the path carries on · scrubbed", kind: "scrub", C: M458 },
  { code: "M459", name: "Path draws with riding marker", how: "A route draws with scroll while a marker rides its tip, turned to the path's tangent; the km counter follows · scrubbed", kind: "scrub", C: M459 },
  { code: "M460", name: "Image marquee along a curve", how: "Product cards travel forever along an S-curve, each turned to the curve's tangent; page scroll speeds them up, then they ease back · auto", kind: "play", C: M460 },
  { code: "M461", name: "Endless curved image band", how: "A band of images auto-scrolls forever on a curved WebGL plane; page scroll adds speed and direction, then it eases back to cruise · auto", kind: "play", C: M461 },
  { code: "M462", name: "Gallery waves with scroll speed", how: "A WebGL image gallery scrolls with the page and ripples in a sine wave as strong as the scroll speed; still scroll = flat · scrubbed", kind: "scrub", C: M462 },
  { code: "M463", name: "Wheel-stepped slider with bend", how: "Each wheel gesture moves a WebGL slider exactly one slide; the plane bows along its travel and flattens as it settles · auto + wheel", kind: "play", C: M463 },
  { code: "M464", name: "Lock-snap section scroll", how: "Each wheel gesture travels exactly one full section of a mini page with smooth lerp easing, like slides on native scroll · auto + wheel", kind: "play", C: M464 },
  { code: "M465", name: "Infinite loop menu", how: "A big menu list wraps forever with scroll (cloned sets, position wrap), the centred item lit; it never reaches an end · scrubbed", kind: "scrub", C: M465 },
  { code: "M466", name: "Infinite loop with item scaling", how: "An endless column of image rows: rows squash to 0 on Y as they leave the top and grow from 0 as they enter the bottom · scrubbed", kind: "scrub", C: M466 },
  { code: "M467", name: "Infinite layered pinning", how: "Full panels slide up and stack over the one before (it dips and darkens); after the last, the first comes round again · scrubbed", kind: "scrub", C: M467 },
  { code: "M468", name: "Fixed media under scrolling panels", how: "A still media layer stays fixed behind; solid content panels scroll over it, so it shows only through the gaps · scrubbed", kind: "scrub", C: M468 },
  { code: "M469", name: "Sticky screen, content scrolls inside", how: "A device frame stays pinned while the shop page on its screen scrolls inside it, in sync with the page scroll · scrubbed", kind: "scrub", C: M469 },
];
