"use client";

// Transition motions, batch 14 · group 2 (MOTION-MENU X93–X95). Small focused demos for /lab/motion.
// Every demo moves between two (or more) simple "pages" A → B → A: X93 follows the scroll (seam position scrubbed),
// X94–X95 loop by themselves while on screen and pause off screen. A CSS-only glow loop (also ON TOP of the pages,
// screen-blended) never stops. ?static=1 / reduced motion: no JS motion, the markup shows page A with page B hidden.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { scene, useScrub, useTicker } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = { sg: "Space Grotesk Variable", fr: "Fraunces Variable", is: "Instrument Serif", sy: "Syne Variable", mr: "Manrope Variable" };

const CSS = `
.b14t2-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(255,213,154,.55)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,143,122,.22)),transparent 70%);animation:b14t2-drift 5.2s linear infinite alternate;will-change:transform}
@keyframes b14t2-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b14t2-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4);pointer-events:none;z-index:60}
.b14t2-dot::after{content:"";position:absolute;inset:-8px;border-radius:50%;border:1.5px solid rgba(255,255,255,.7);animation:b14t2-ping 1.2s ease-out infinite}
@keyframes b14t2-ping{0%{transform:scale(.5);opacity:1}100%{transform:scale(1.8);opacity:0}}
.x94-kb{animation:x94-kb 6s linear infinite alternate}
@keyframes x94-kb{to{transform:scale(1.08) translate(-2%,1%)}}
.x95-kb{animation:x95-kb 7s linear infinite alternate}
@keyframes x95-kb{to{transform:scale(1.07) translate(1.5%,-1%)}}
html.is-static .b14t2-glow,html.is-static .b14t2-dot::after,html.is-static .x94-kb,html.is-static .x95-kb{animation:none}
html.is-static .b14t2-dot{display:none}
html.is-static {
  .b14t2-glow,.b14t2-dot::after,.x94-kb,.x95-kb{animation:none}
  .b14t2-dot{display:none}
}
`;

/* ---------- shared helpers (local copies) ---------- */

function Stage({ r, children, className = "", g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0b0a0d] text-[#f6f1ea] ${className}`}>
      <style href="b14t2-css" precedence="default">
        {CSS}
      </style>
      <div className="b14t2-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="x-in relative h-full w-full">{children}</div>
    </div>
  );
}

/** The CSS glow loop again, ON TOP of the pages (screen blend), so covered stages never read as a freeze. */
const Sheen = ({ g1 = "rgba(255,213,154,.55)" }: { g1?: string }) => (
  <div className="b14t2-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.45, zIndex: 55 } as CSSProperties} aria-hidden />
);

const Dot = ({ c }: { c: string }) => <div className={`b14t2-dot ${c}`} style={{ opacity: 0 }} aria-hidden />;

/** "play" helper: waits for fonts, builds the looping timeline in a gsap.context, plays only on screen, rebuilds on resize. */
function usePlay(ref: RefObject<HTMLElement | null>, build: (root: HTMLElement) => gsap.core.Animation | void) {
  const b = useRef(build);
  b.current = build;
  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    let dead = false;
    let on = false;
    let ready = false;
    let anim: gsap.core.Animation | void;
    let ctx = gsap.context(() => {}, root);
    let timer = 0;
    const sync = () => {
      if (!anim) return;
      if (on) anim.play();
      else anim.pause();
    };
    const make = () => {
      ctx.revert();
      ctx = gsap.context(() => {}, root);
      ctx.add(() => {
        anim = b.current(root);
      });
      sync();
    };
    const io = new IntersectionObserver(
      ([e]) => {
        on = e.isIntersecting;
        sync();
      },
      { threshold: 0.1 },
    );
    io.observe(root);
    const onResize = () => {
      if (!ready) return;
      clearTimeout(timer);
      timer = window.setTimeout(make, 220);
    };
    window.addEventListener("resize", onResize);
    document.fonts?.ready.then(() => {
      if (dead) return;
      ready = true;
      make();
    });
    return () => {
      dead = true;
      clearTimeout(timer);
      io.disconnect();
      window.removeEventListener("resize", onResize);
      ctx.revert();
    };
  }, [ref]);
}

type Box = { x: number; y: number; w: number; h: number };
function rel(node: Element, root: Element): Box {
  const a = node.getBoundingClientRect();
  const r = root.getBoundingClientRect();
  return { x: a.left - r.left, y: a.top - r.top, w: a.width, h: a.height };
}
const centre = (b: Box) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
const hold = (tl: gsap.core.Timeline, d = 0.2) => tl.to({}, { duration: d });

/** Fake pointer: glide to a point, then a short press. */
function tap(tl: gsap.core.Timeline, dot: Element, p: { x: number; y: number }, at?: gsap.Position) {
  tl.to(dot, { x: p.x, y: p.y, opacity: 1, duration: 0.45, ease: "power2.inOut" }, at);
  tl.to(dot, { scale: 0.7, duration: 0.1, ease: "power1.in" }).to(dot, { scale: 1, duration: 0.12, ease: "power1.out" });
}

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, className = "", style, w = 1000, h = 1000, label = "" }: { i: number; className?: string; style?: CSSProperties; w?: number; h?: number; label?: string }) => (
  <img src={scene(i, w, h, label)} alt="" className={`h-full w-full object-cover ${className}`} style={style} draggable={false} />
);

const HIDDEN: CSSProperties = { visibility: "hidden", opacity: 0 };
const Label = ({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) => (
  <p className={`text-[13px] uppercase tracking-[0.22em] ${className}`} style={{ fontFamily: F.mr, ...style }}>
    {children}
  </p>
);

/* ───────────────────────── X93 · ASCII fray seam wipe (scrub) ───────────────────────── */
const X93_A = { bg: "#efe6d8", ink: "#2a1d12", hot: "#c2551f" };
const X93_B = { bg: "#0d1630", ink: "#9fd0ff", hot: "#e8f4ff" };
const X93_G = "01<>/\\|=+*#%@$&?!:;~^".split("");
const hash = (a: number, b: number, c: number) => {
  const x = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453;
  return x - Math.floor(x);
};

function X93Page({ p }: { p: "a" | "b" }) {
  const a = p === "a";
  const C = a ? X93_A : X93_B;
  return (
    <div className="absolute inset-0 grid grid-cols-[1.1fr_1fr] items-center gap-[5%] px-[6%]" style={{ background: C.bg, color: C.ink }}>
      <div>
        <Label style={{ color: C.hot }}>{a ? "Issue 07 · Autumn table" : "Issue 08 · Winter table"}</Label>
        <h3 className="mt-4 leading-[0.92]" style={{ fontFamily: F.fr, fontSize: "clamp(40px,6vw,104px)", fontWeight: 500 }}>
          {a ? "Slow Mornings" : "Night Kitchen"}
        </h3>
        <p className="mt-5 max-w-[34ch] text-[15px] leading-relaxed opacity-75" style={{ fontFamily: F.mr }}>
          {a ? "Hand-thrown stoneware, raw linen and a pot that keeps the second cup warm." : "Smoked glass, cast iron and candle light for the long dinners of December."}
        </p>
        <p className="mt-6 text-[17px] font-semibold" style={{ fontFamily: F.sg }}>
          {a ? "Breakfast set · ₹4,200" : "Supper set · ₹5,600"}
        </p>
      </div>
      <div className="relative h-[72%] overflow-hidden rounded-[22px]">
        <Img i={a ? 3 : 0} w={900} h={1000} />
      </div>
    </div>
  );
}

function X93() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const pb = useRef<HTMLDivElement>(null);
  const prog = useRef(0);
  const dims = useRef({ w: 0, h: 0 });

  useEffect(() => {
    const el = root.current;
    const c = cv.current;
    if (!el || !c) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      c.width = w;
      c.height = h;
      dims.current = { w, h };
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const seamX = (p: number, w: number) => {
    const half = w * 0.12;
    return -half + (w + half * 2) * p;
  };

  useScrub(
    root,
    (p) => {
      prog.current = p;
      const el = root.current;
      const b = pb.current;
      if (!el || !b) return;
      const w = el.clientWidth;
      const x = seamX(p, w);
      b.style.clipPath = `inset(0 ${Math.max(0, w - x).toFixed(1)}px 0 0)`;
    },
    { finalValue: 0 },
  );

  useTicker(root, (t) => {
    const c = cv.current;
    const g = c?.getContext("2d");
    if (!c || !g) return;
    const { w, h } = dims.current;
    if (!w) return;
    g.clearRect(0, 0, w, h);
    const X = seamX(prog.current, w);
    const half = w * 0.12;
    const cell = 16;
    const k = Math.floor(t * 14);
    g.font = `600 14px ui-monospace, "SF Mono", Menlo, monospace`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    const c0 = Math.max(0, Math.floor((X - half) / cell));
    const c1 = Math.min(Math.ceil(w / cell), Math.ceil((X + half) / cell));
    const rows = Math.ceil(h / cell);
    for (let r = 0; r < rows; r++) {
      const jit = (hash(r, 7, Math.floor(t * 3)) - 0.5) * 0.7;
      for (let col = c0; col < c1; col++) {
        const cx = col * cell + cell / 2;
        const u = (cx - X) / half + jit;
        const a = 1 - Math.abs(u);
        if (a <= 0) continue;
        if (hash(col, r, k) > a * 1.15) continue;
        const S = u > 0 ? X93_A : X93_B;
        g.globalAlpha = 0.92;
        g.fillStyle = S.bg;
        g.fillRect(col * cell, r * cell, cell, cell);
        g.globalAlpha = 0.45 + 0.55 * a;
        g.fillStyle = a > 0.82 ? S.hot : S.ink;
        g.fillText(X93_G[Math.floor(hash(col, r, k + 1) * X93_G.length)], cx, r * cell + cell / 2 + 1);
      }
    }
    g.globalAlpha = 1;
  });

  return (
    <Stage r={root} g1="rgba(255,213,154,.55)" g2="rgba(79,141,255,.25)">
      <X93Page p="a" />
      <div ref={pb} className="absolute inset-0" style={{ clipPath: "inset(0 100% 0 0)" }}>
        <X93Page p="b" />
      </div>
      <canvas ref={cv} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />
      <Sheen g1="rgba(255,213,154,.5)" />
    </Stage>
  );
}

/* ───────────────────────── X94 · Diagonal slideshow ───────────────────────── */
const X94_S = [
  { t: "Ember", d: "Wool throw", p: "₹3,400", i: 1 },
  { t: "Harbour", d: "Linen shirt", p: "₹2,900", i: 0 },
  { t: "Moss", d: "Field jacket", p: "₹7,800", i: 2 },
  { t: "Saffron", d: "Silk scarf", p: "₹4,100", i: 3 },
  { t: "Dusk", d: "Canvas tote", p: "₹1,650", i: 1 },
];
const X94_PATH = [2, 3, 2, 1];
const X94_STEP = 44; // % of the track per slide

function X94() {
  const root = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const box = q(".x-in")[0];
    const track = q(".x94-track")[0];
    const slides = q(".x94-s");
    const titles = q(".x94-t");
    const nums = q(".x94-n");
    const dot = q(".x94-dot")[0];
    const up = centre(rel(q(".x94-up")[0], box));
    const dn = centre(rel(q(".x94-dn")[0], box));
    const W = box.clientWidth;
    const H = box.clientHeight;
    gsap.set(titles, { autoAlpha: 0, yPercent: 110 });
    gsap.set(nums, { autoAlpha: 0, yPercent: 110 });
    gsap.set([titles[1], nums[1]], { autoAlpha: 1, yPercent: 0 });
    gsap.set(dot, { x: W * 0.8, y: H * 0.86 });
    const tl = gsap.timeline({ repeat: -1 });
    let cur = 1;
    X94_PATH.forEach((to, k) => {
      const from = cur;
      const btn = to > from ? dn : up;
      tl.addLabel(`m${k}`);
      tap(tl, dot, btn);
      tl.addLabel(`go${k}`);
      tl.to(track, { yPercent: -(to - 1) * X94_STEP, duration: 1, ease: "power3.inOut" }, `go${k}`)
        .to(slides[from], { scale: 0.88, opacity: 0.45, duration: 1, ease: "power3.inOut" }, `go${k}`)
        .to(slides[to], { scale: 1, opacity: 1, duration: 1, ease: "power3.inOut" }, `go${k}`)
        .to([titles[from], nums[from]], { yPercent: -110, autoAlpha: 0, duration: 0.5, ease: "power3.in", stagger: 0.05 }, `go${k}`)
        .fromTo([titles[to], nums[to]], { yPercent: 110, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.6, ease: "power3.out", stagger: 0.05 }, `go${k}+=0.45`)
        .to(dot, { x: btn.x - W * 0.07, y: btn.y + H * 0.05, duration: 0.8, ease: "sine.inOut" }, `go${k}+=0.1`);
      hold(tl, 0.15);
      cur = to;
    });
    tlRef.current = tl;
    return tl;
  });
  const jump = () => {
    const tl = tlRef.current;
    if (!tl) return;
    const labels = Object.entries(tl.labels)
      .filter(([n]) => n.startsWith("go"))
      .map(([, v]) => v)
      .sort((a, b) => a - b);
    const t = tl.time();
    tl.seek(labels.find((v) => v > t + 0.05) ?? labels[0]);
  };
  return (
    <Stage r={root} g1="rgba(255,190,140,.55)" g2="rgba(140,110,255,.24)">
      <div className="absolute left-[46%] top-1/2 h-[150%] w-[34%]" style={{ transform: "translate(-50%,-50%) rotate(-14deg)" }}>
        <div className="x94-track absolute inset-x-0 h-full" style={{ top: "-14%" }}>
          {X94_S.map((s, i) => (
            <div
              key={i}
              className="x94-s absolute inset-x-0 h-[40%] overflow-hidden rounded-[22px] border border-white/10 bg-[#141018]"
              style={{ top: `${i * X94_STEP}%`, opacity: i === 1 ? 1 : 0.45, transform: i === 1 ? "none" : "scale(.88)" }}
            >
              <div className="x94-kb absolute inset-0">
                <Img i={s.i} w={800} h={900} />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
              <div className="absolute bottom-[7%] left-[8%] right-[8%] flex items-end justify-between" style={{ fontFamily: F.mr }}>
                <span className="text-[14px] text-white/85">{s.d}</span>
                <span className="text-[15px] font-semibold">{s.p}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute left-[6%] top-[12%] bottom-[12%] flex w-[30%] flex-col justify-between">
        <Label className="text-white/60">Autumn edit · Slow wardrobe</Label>
        <div>
          <div className="relative overflow-hidden text-[15px] text-white/70" style={{ fontFamily: F.sg }}>
            {X94_S.map((s, i) => (
              <p key={i} className={`x94-n ${i === 1 ? "relative" : "absolute inset-x-0 top-0"}`} style={i === 1 ? undefined : HIDDEN}>
                {String(i + 1).padStart(2, "0")} / {String(X94_S.length).padStart(2, "0")}
              </p>
            ))}
          </div>
          <div className="relative mt-2 overflow-hidden pb-[0.12em]">
            {X94_S.map((s, i) => (
              <p
                key={i}
                className={`x94-t leading-[0.95] ${i === 1 ? "relative" : "absolute inset-x-0 top-0"}`}
                style={{ fontFamily: F.is, fontSize: "clamp(48px,6.4vw,112px)", ...(i === 1 ? {} : HIDDEN) }}
              >
                {s.t}
              </p>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute bottom-[10%] right-[6%] flex flex-col gap-3">
        <button type="button" onClick={jump} className="x94-up grid h-14 w-14 place-items-center rounded-full border border-white/25 text-[20px]" aria-label="Previous slide">
          ↑
        </button>
        <button type="button" onClick={jump} className="x94-dn grid h-14 w-14 place-items-center rounded-full border border-white/25 bg-white text-[20px] text-[#0b0a0d]" aria-label="Next slide">
          ↓
        </button>
      </div>
      <Sheen g1="rgba(255,190,140,.5)" />
      <Dot c="x94-dot" />
    </Stage>
  );
}

/* ───────────────────────── X95 · Per-slide grid composition ───────────────────────── */
type X95Cell = { area: string; i: number; label: string };
const X95_SLIDES: { title: string; sub: string; cols: string; rows: string; tone: string; cells: X95Cell[] }[] = [
  {
    title: "Coastline",
    sub: "Resort 26 · 4 looks",
    cols: "1.5fr 1fr 1fr",
    rows: "1fr 1fr",
    tone: "#ffd59a",
    cells: [
      { area: "1 / 1 / 3 / 2", i: 0, label: "" },
      { area: "1 / 2 / 2 / 3", i: 3, label: "" },
      { area: "1 / 3 / 3 / 4", i: 1, label: "" },
      { area: "2 / 2 / 3 / 3", i: 2, label: "" },
    ],
  },
  {
    title: "Highland",
    sub: "Winter 26 · 4 looks",
    cols: "1fr 1fr 1.7fr",
    rows: "1.25fr 1fr",
    tone: "#9fd8ff",
    cells: [
      { area: "1 / 1 / 2 / 3", i: 2, label: "" },
      { area: "2 / 1 / 3 / 2", i: 1, label: "" },
      { area: "2 / 2 / 3 / 3", i: 3, label: "" },
      { area: "1 / 3 / 3 / 4", i: 0, label: "" },
    ],
  },
];

function X95() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const q = gsap.utils.selector(el);
    const slides = q(".x95-slide");
    const heads = q(".x95-h");
    const tl = gsap.timeline({ repeat: -1 });
    gsap.set(slides[1], { autoAlpha: 0 });
    gsap.set(heads[1], { autoAlpha: 0, yPercent: 110 });
    const go = (a: number, b: number) => {
      const fromBlocks = slides[a].querySelectorAll(".x95-b");
      const toBlocks = slides[b].querySelectorAll(".x95-b");
      const toImgs = slides[b].querySelectorAll(".x95-im");
      tl.to(fromBlocks, { scaleX: 1, transformOrigin: "0% 50%", duration: 0.42, ease: "power3.in", stagger: 0.07 })
        .to(heads[a], { yPercent: -110, autoAlpha: 0, duration: 0.4, ease: "power3.in" }, "<")
        .set(slides[a], { autoAlpha: 0 })
        .set(fromBlocks, { scaleX: 0 })
        .set(toBlocks, { scaleX: 1, transformOrigin: "100% 50%" })
        .set(slides[b], { autoAlpha: 1 })
        .to(toBlocks, { scaleX: 0, duration: 0.5, ease: "power3.out", stagger: 0.07 })
        .fromTo(toImgs, { scale: 1.18 }, { scale: 1, duration: 0.8, ease: "power3.out", stagger: 0.07 }, "<")
        .fromTo(heads[b], { yPercent: 110, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.55, ease: "power3.out" }, "<0.1");
      hold(tl, 0.1);
    };
    go(0, 1);
    go(1, 0);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,213,154,.55)" g2="rgba(159,216,255,.24)">
      <div className="absolute left-[5%] right-[5%] top-[8%] flex items-end justify-between">
        <div className="relative overflow-hidden pb-[0.1em]">
          {X95_SLIDES.map((s, k) => (
            <div key={k} className={`x95-h ${k === 0 ? "relative" : "absolute inset-x-0 top-0"}`} style={k === 0 ? undefined : HIDDEN}>
              <p className="leading-none" style={{ fontFamily: F.sy, fontWeight: 800, fontSize: "clamp(36px,4.6vw,76px)", textTransform: "uppercase", letterSpacing: "-0.02em" }}>
                {s.title}
              </p>
            </div>
          ))}
        </div>
        <Label className="text-white/60">Lookbook · Grid stories</Label>
      </div>
      <div className="absolute bottom-[7%] left-[5%] right-[5%] top-[26%]">
        {X95_SLIDES.map((s, k) => (
          <div
            key={k}
            className="x95-slide absolute inset-0 grid gap-[14px]"
            style={{ gridTemplateColumns: s.cols, gridTemplateRows: s.rows, ...(k === 0 ? {} : { visibility: "hidden" }) }}
          >
            {s.cells.map((c, j) => (
              <div key={j} className="relative overflow-hidden rounded-[18px]" style={{ gridArea: c.area }}>
                <div className="x95-im absolute inset-0">
                  <div className="x95-kb absolute inset-0">
                    <Img i={c.i} w={1000} h={800} />
                  </div>
                </div>
                {j === 0 && (
                  <p className="absolute bottom-[8%] left-[6%] text-[14px] text-white/85" style={{ fontFamily: F.mr }}>
                    {s.sub}
                  </p>
                )}
                <div className="x95-b absolute inset-0" style={{ background: s.tone, transform: "scaleX(0)", transformOrigin: "0% 50%" }} />
              </div>
            ))}
          </div>
        ))}
      </div>
      <Sheen g1="rgba(255,213,154,.5)" />
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  {
    code: "X93",
    name: "ASCII fray seam wipe",
    how: "Scroll moves a seam across two pages: the seam is a flickering band of ASCII glyphs, the old page frays into characters and the new one resolves out of them (canvas).",
    kind: "scrub",
    C: X93,
  },
  {
    code: "X94",
    name: "Diagonal slideshow",
    how: "Tilted slides glide along the diagonal (~1 s) with the previous and next slides peeking above and below; the title swaps in a mask. A fake pointer presses the arrows.",
    kind: "play",
    C: X94,
  },
  {
    code: "X95",
    name: "Per-slide grid composition",
    how: "Each slide is its own grid composition; on change colour blocks wipe across every cell, the layout switches, and the new images reveal from their own blocks (~1.2 s).",
    kind: "play",
    C: X95,
  },
];
