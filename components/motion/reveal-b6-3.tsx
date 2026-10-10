"use client";

// MOTION-MENU M254–M257 (reveal group, batch 6 · group 3): small focused demos for /lab/motion.
// Every demo starts when on screen, loops, pauses off screen and has a CSS-only glow loop (plus one on top when
// photos cover the stage). ?static=1 / reduced motion: no JS motion, the markup shows a sensible final state.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { scene } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const GROTESK = "'Space Grotesk Variable', system-ui, sans-serif";
const SERIF = "'Fraunces Variable', Georgia, serif";
const EDITORIAL = "'Instrument Serif', Georgia, serif";
const WIDE = "'Syne Variable', 'Space Grotesk Variable', system-ui, sans-serif";
const BODY = "'Manrope Variable', system-ui, sans-serif";

const CSS = `
.b6r3-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.5)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.22)),transparent 70%);animation:b6r3-drift 5.2s linear infinite alternate;will-change:transform}
@keyframes b6r3-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b6r3-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4);pointer-events:none;z-index:40}
.m255-chip.on{background:#ffe7c2;color:#1a1208;border-color:#ffe7c2}
.m257-t.on{outline:2px solid #f2d27a;outline-offset:3px}
html.is-static .b6r3-glow{animation:none}
html.is-static {.b6r3-glow{animation:none}}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", bg = "#0a0d16", g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; bg?: string; g1?: string; g2?: string }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 text-[#eef2ff] ${className}`} style={{ background: bg }}>
      <style href="b6r3-css" precedence="default">
        {CSS}
      </style>
      <div className="b6r3-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/** The CSS glow loop again, ON TOP of photos (screen blend), so image-heavy demos never freeze. */
const Sheen = ({ g1 }: { g1?: string }) => (
  <div className="b6r3-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.45, zIndex: 35 } as CSSProperties} aria-hidden />
);

/** Play: a looping timeline that starts when the demo is on screen and pauses off screen. Nothing runs with reduced motion. */
function usePlay(root: RefObject<HTMLDivElement | null>, build: (el: HTMLDivElement) => gsap.core.Timeline) {
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
    Promise.resolve(document.fonts?.ready).then(() => {
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
  }, [root]);
}

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, className = "", style, label = "", w = 1200, h = 900 }: { i: number; className?: string; style?: CSSProperties; label?: string; w?: number; h?: number }) => (
  <img src={scene(i, w, h, label)} alt="" className={`h-full w-full object-cover ${className}`} style={style} draggable={false} />
);

/* ---------- M254 · Morphing path item reveal (variant of X3: each grid item is uncovered by an SVG cover whose path reshapes into a thin edge) ---------- */
// One path shape, four numbers: the bottom edge's two ends and its two curve handles. Same structure → GSAP tweens `d` directly.
const m254d = (a: number, b: number, c: number, d: number) => `M0 0 L100 0 L100 ${a} C70 ${b} 30 ${c} 0 ${d} Z`;
const M254_FULL = m254d(100, 100, 100, 100);
const M254_BLOB = m254d(62, 96, 18, 48);
const M254_EDGE = m254d(0, 0, 0, 0);
const M254_ITEMS = [
  { name: "Clay Pitcher", price: "₹ 2,400", i: 3 },
  { name: "Tide Carafe", price: "₹ 1,850", i: 0 },
  { name: "Moss Vase", price: "₹ 3,100", i: 2 },
  { name: "Ember Bowl", price: "₹ 1,290", i: 1 },
];
function M254() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const paths = el.querySelectorAll(".m254-p");
    const imgs = el.querySelectorAll(".m254-img");
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(paths, { attr: { d: M254_FULL } })
      .set(imgs, { scale: 1.18 })
      // cover reshapes into a wavy blob, then thins into the top edge: item by item
      .to(paths, { attr: { d: M254_BLOB }, duration: 0.4, ease: "power2.in", stagger: 0.16 }, 0.05)
      .to(paths, { attr: { d: M254_EDGE }, duration: 0.45, ease: "power2.out", stagger: 0.16 }, 0.45)
      .to(imgs, { scale: 1, duration: 1.1, ease: "power2.out", stagger: 0.16 }, 0.2)
      // the cover drops back (same morph in reverse) and the loop restarts
      .to(paths, { attr: { d: M254_BLOB }, duration: 0.35, ease: "power2.in", stagger: 0.12 }, "+=0.25")
      .to(paths, { attr: { d: M254_FULL }, duration: 0.35, ease: "power2.out", stagger: 0.12 }, "<0.35");
    return tl;
  });
  return (
    <Stage r={root} bg="#120e0b" g1="rgba(232,160,98,.5)" g2="rgba(255,226,180,.2)">
      <div className="absolute left-[6%] top-[9%]">
        <p className="text-[13px] uppercase tracking-[0.22em] text-[#f3dcc0]/60" style={{ fontFamily: BODY }}>
          Studio ceramics · drop 07
        </p>
        <h3 className="mt-2 text-[clamp(38px,4.2vw,64px)] leading-[0.95] text-[#fbefe1]" style={{ fontFamily: EDITORIAL }}>
          Uncovered, one by one.
        </h3>
      </div>
      <div className="absolute bottom-[8%] left-[6%] right-[6%] top-[34%] grid grid-cols-4 gap-4">
        {M254_ITEMS.map((it) => (
          <div key={it.name} className="relative overflow-hidden rounded-[16px]">
            <div className="m254-img absolute inset-0 will-change-transform">
              <Img i={it.i} w={600} h={700} />
            </div>
            <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-[#fff6ea]">
              <span className="text-[17px] font-[600]" style={{ fontFamily: GROTESK }}>
                {it.name}
              </span>
              <span className="text-[14px] text-[#ffd9a8]" style={{ fontFamily: GROTESK }}>
                {it.price}
              </span>
            </div>
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              <path className="m254-p" d={M254_EDGE} fill="#e8a062" />
            </svg>
          </div>
        ))}
      </div>
      <Sheen g1="rgba(232,160,98,.5)" />
    </Stage>
  );
}

/* ---------- M255 · Pixel-swap patterns (variant of X8: a pixel grid assembles in a pattern, swaps the content, dissolves in the same order) ---------- */
const M255_C = 12;
const M255_R = 8;
const M255_DIRS = ["Centre", "Edges", "Spiral", "Diagonal", "Left to right"] as const;
/** Normalised order (0..1) per cell for each direction pattern. */
function m255Orders(): number[][] {
  const n = M255_C * M255_R;
  const cx = (M255_C - 1) / 2;
  const cy = (M255_R - 1) / 2;
  const dist = Array.from({ length: n }, (_, i) => Math.hypot((i % M255_C) - cx, Math.floor(i / M255_C) - cy));
  const maxD = Math.max(...dist);
  const centre = dist.map((d) => d / maxD);
  const edges = dist.map((d) => 1 - d / maxD);
  // spiral: walk the grid from the outer ring inwards, clockwise
  const spiral = new Array<number>(n).fill(0);
  let top = 0, bottom = M255_R - 1, left = 0, right = M255_C - 1, k = 0;
  while (top <= bottom && left <= right) {
    for (let x = left; x <= right; x++) spiral[top * M255_C + x] = k++;
    for (let y = top + 1; y <= bottom; y++) spiral[y * M255_C + right] = k++;
    if (top < bottom) for (let x = right - 1; x >= left; x--) spiral[bottom * M255_C + x] = k++;
    if (left < right) for (let y = bottom - 1; y > top; y--) spiral[y * M255_C + left] = k++;
    top++; bottom--; left++; right--;
  }
  const diagonal = Array.from({ length: n }, (_, i) => ((i % M255_C) + Math.floor(i / M255_C)) / (M255_C + M255_R - 2));
  const ltr = Array.from({ length: n }, (_, i) => (i % M255_C) / (M255_C - 1));
  return [centre, edges, spiral.map((v) => v / (n - 1)), diagonal, ltr];
}
function M255() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const px = el.querySelectorAll(".m255-px");
    const chips = Array.from(el.querySelectorAll(".m255-chip"));
    const a = el.querySelector(".m255-a");
    const b = el.querySelector(".m255-b");
    const orders = m255Orders();
    const SPREAD = 0.65;
    let showB = false;
    const tl = gsap.timeline({ repeat: -1 });
    orders.forEach((ord, k) => {
      tl.call(() => chips.forEach((c, j) => c.classList.toggle("on", j === k)))
        .fromTo(
          px,
          { scale: 0, rotate: 90, borderRadius: "30px" },
          { scale: 1.04, rotate: 0, borderRadius: "3px", duration: 0.32, ease: "power2.out", stagger: (i: number) => ord[i] * SPREAD },
        )
        .call(() => {
          showB = !showB; // A → B → A … (5 patterns: a toggle keeps every pass a real swap)
          gsap.set(a, { autoAlpha: showB ? 0 : 1 });
          gsap.set(b, { autoAlpha: showB ? 1 : 0 });
        })
        .to(px, { scale: 0, rotate: -90, borderRadius: "30px", duration: 0.3, ease: "power2.in", stagger: (i: number) => ord[i] * SPREAD }, "+=0.05");
    });
    return tl;
  });
  return (
    <Stage r={root} bg="#110c08" g1="rgba(255,170,80,.5)" g2="rgba(255,96,72,.22)">
      <div className="absolute left-[6%] top-1/2 w-[32%] -translate-y-1/2">
        <p className="text-[13px] uppercase tracking-[0.22em] text-[#ffe7c2]/60" style={{ fontFamily: BODY }}>
          Two colourways · one tote
        </p>
        <h3 className="mt-3 text-[clamp(40px,4.4vw,70px)] font-[700] leading-[0.92] tracking-[-0.03em] text-[#fff4e4]" style={{ fontFamily: GROTESK }}>
          Pixel by pixel, it swaps.
        </h3>
        <div className="mt-6 flex flex-wrap gap-2">
          {M255_DIRS.map((d, k) => (
            <span key={d} className={`m255-chip rounded-full border border-white/25 px-4 py-1.5 text-[13px] transition-colors duration-300 ${k === 0 ? "on" : ""}`} style={{ fontFamily: GROTESK }}>
              {d}
            </span>
          ))}
        </div>
      </div>
      <div className="absolute bottom-[8%] right-[5%] top-[8%] w-[54%] overflow-hidden rounded-[20px]">
        <div className="m255-a absolute inset-0">
          <Img i={3} w={1000} h={760} label="EMBER TOTE · ₹ 4,200" />
        </div>
        <div className="m255-b absolute inset-0" style={{ visibility: "hidden", opacity: 0 }}>
          <Img i={1} w={1000} h={760} label="BLUSH TOTE · ₹ 4,200" />
        </div>
        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${M255_C},1fr)`, gridTemplateRows: `repeat(${M255_R},1fr)` }}>
          {Array.from({ length: M255_C * M255_R }, (_, i) => (
            <span key={i} className="m255-px will-change-transform" style={{ background: i % 3 ? "#ffaa50" : "#ff8a3d", transform: "scale(0)" }} />
          ))}
        </div>
      </div>
      <Sheen g1="rgba(255,170,80,.45)" />
    </Stage>
  );
}

/* ---------- M256 · Staggered logo slot swap (variant of M14: every slot swaps its logo with a vertical blur slide, rippling across the row) ---------- */
const M256_SLOTS: { n: string; f: string; w: number; glyph: "circle" | "square" | "tri" | "none" }[][] = [
  [
    { n: "Northvale", f: SERIF, w: 600, glyph: "circle" },
    { n: "OKAPI", f: WIDE, w: 800, glyph: "none" },
    { n: "Lumen & Rye", f: EDITORIAL, w: 400, glyph: "none" },
  ],
  [
    { n: "KILNHOUSE", f: GROTESK, w: 700, glyph: "square" },
    { n: "Marigold", f: SERIF, w: 500, glyph: "none" },
    { n: "TESSERA", f: WIDE, w: 700, glyph: "tri" },
  ],
  [
    { n: "Halden", f: EDITORIAL, w: 400, glyph: "none" },
    { n: "BRISKO", f: WIDE, w: 800, glyph: "circle" },
    { n: "Fernway", f: GROTESK, w: 600, glyph: "tri" },
  ],
  [
    { n: "Solace", f: SERIF, w: 700, glyph: "tri" },
    { n: "Parcel/9", f: GROTESK, w: 700, glyph: "none" },
    { n: "Orrin", f: EDITORIAL, w: 400, glyph: "square" },
  ],
  [
    { n: "VANTIQ", f: WIDE, w: 800, glyph: "none" },
    { n: "Copperleaf", f: SERIF, w: 500, glyph: "circle" },
    { n: "ARCADIA", f: GROTESK, w: 600, glyph: "square" },
  ],
];
const M256_G = ({ g }: { g: "circle" | "square" | "tri" | "none" }) =>
  g === "none" ? null : (
    <svg width="22" height="22" viewBox="0 0 22 22" className="mr-2 shrink-0" aria-hidden>
      {g === "circle" && <circle cx="11" cy="11" r="9" fill="none" stroke="currentColor" strokeWidth="3" />}
      {g === "square" && <rect x="3" y="3" width="16" height="16" rx="3" fill="currentColor" />}
      {g === "tri" && <path d="M11 2 L20 19 H2 Z" fill="currentColor" />}
    </svg>
  );
function M256() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const slots = Array.from(el.querySelectorAll(".m256-slot")).map((s) => Array.from(s.querySelectorAll(".m256-l")));
    const tl = gsap.timeline({ repeat: -1 });
    const N = 3;
    for (let j = 0; j < N; j++) {
      const at = j * 1.05;
      slots.forEach((logos, s) => {
        const cur = logos[j];
        const nxt = logos[(j + 1) % N];
        tl.to(cur, { yPercent: -110, filter: "blur(8px)", autoAlpha: 0, duration: 0.5, ease: "power3.in" }, at + s * 0.11).fromTo(
          nxt,
          { yPercent: 110, filter: "blur(8px)", autoAlpha: 0 },
          { yPercent: 0, filter: "blur(0px)", autoAlpha: 1, duration: 0.55, ease: "power3.out", immediateRender: false },
          at + s * 0.11 + 0.28,
        );
      });
    }
    return tl;
  });
  return (
    <Stage r={root} bg="#0b0f14" g1="rgba(120,200,255,.5)" g2="rgba(160,255,214,.2)">
      <div className="absolute left-0 right-0 top-[16%] text-center">
        <p className="text-[13px] uppercase tracking-[0.24em] text-[#bfe6ff]/60" style={{ fontFamily: BODY }}>
          Stocked in 400+ concept stores
        </p>
        <h3 className="mx-auto mt-3 max-w-[18ch] text-[clamp(40px,4.6vw,72px)] leading-[0.95] text-[#eef8ff]" style={{ fontFamily: SERIF, fontWeight: 400 }}>
          The shelves we share.
        </h3>
      </div>
      <div className="absolute bottom-[18%] left-[6%] right-[6%] grid h-[24%] grid-cols-5 gap-4">
        {M256_SLOTS.map((logos, s) => (
          <div key={s} className="m256-slot relative overflow-hidden rounded-[18px] border border-white/12 bg-white/[0.04]">
            {logos.map((l, k) => (
              <div
                key={l.n}
                className="m256-l absolute inset-0 flex items-center justify-center text-[clamp(20px,1.9vw,30px)] text-[#eef8ff] will-change-transform"
                style={{ fontFamily: l.f, fontWeight: l.w, ...(k === 0 ? {} : { visibility: "hidden", opacity: 0 }) }}
              >
                <M256_G g={l.glyph} />
                {l.n}
              </div>
            ))}
          </div>
        ))}
      </div>
      <p className="absolute bottom-[8%] left-0 right-0 text-center text-[13px] text-white/45" style={{ fontFamily: BODY }}>
        Partner names are placeholders
      </p>
    </Stage>
  );
}

/* ---------- M257 · Inline expanding preview row (a thumbnail opens a full-width preview right below its row, pushing later rows down) ---------- */
const M257_ROWS = [
  [
    { n: "Linen Shirt", p: "₹ 3,290", i: 0 },
    { n: "Pleat Trouser", p: "₹ 4,150", i: 1 },
    { n: "Rope Belt", p: "₹ 1,190", i: 2 },
    { n: "Canvas Cap", p: "₹ 990", i: 3 },
  ],
  [
    { n: "Knit Polo", p: "₹ 2,750", i: 2 },
    { n: "Field Jacket", p: "₹ 6,800", i: 3 },
    { n: "Loop Sock", p: "₹ 490", i: 0 },
    { n: "Suede Mule", p: "₹ 5,400", i: 1 },
  ],
];
function M257Preview({ row, open }: { row: number; open?: number }) {
  return (
    <div className={`m257-pv m257-pv${row} relative overflow-hidden`} style={{ height: open === undefined ? 0 : "40%" }}>
      <span className="m257-arrow absolute top-0 h-0 w-0 border-x-[12px] border-b-[12px] border-x-transparent border-b-[#f4ead8]" style={{ left: "calc(37.5% - 12px)" }} aria-hidden />
      <div className="absolute inset-x-0 bottom-2 top-[12px] rounded-[18px] bg-[#f4ead8] text-[#1b1610]">
        {M257_ROWS[row].map((it, k) => (
          <div key={it.n} className={`m257-c m257-c${k} absolute inset-0 flex items-center gap-8 p-5`} style={k === open ? {} : { visibility: "hidden", opacity: 0 }}>
            <div className="h-full w-[34%] overflow-hidden rounded-[12px]">
              <Img i={it.i} w={700} h={500} />
            </div>
            <div>
              <p className="text-[12px] uppercase tracking-[0.2em] text-[#1b1610]/55" style={{ fontFamily: BODY }}>
                Summer linen · in stock
              </p>
              <p className="mt-1 text-[clamp(30px,3vw,46px)] leading-none" style={{ fontFamily: SERIF, fontWeight: 600 }}>
                {it.n}
              </p>
              <p className="mt-2 text-[18px]" style={{ fontFamily: GROTESK }}>
                {it.p}
              </p>
              <span className="mt-3 inline-block rounded-full bg-[#1b1610] px-5 py-2 text-[13px] text-[#f4ead8]" style={{ fontFamily: GROTESK }}>
                Add to bag
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function M257() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const region = el.querySelector<HTMLElement>(".m257-region")!;
    const dot = el.querySelector(".b6r3-dot");
    const pv = [el.querySelector<HTMLElement>(".m257-pv0")!, el.querySelector<HTMLElement>(".m257-pv1")!];
    const thumbs = [0, 1].map((r) => Array.from(el.querySelectorAll<HTMLElement>(`.m257-row${r} .m257-t`)));
    const allThumbs = el.querySelectorAll(".m257-t");
    gsap.set(pv, { height: 0 });
    gsap.set(el.querySelectorAll(".m257-c"), { autoAlpha: 0 });
    const H = region.clientHeight * 0.4;
    const sr = el.getBoundingClientRect();
    const rr = region.getBoundingClientRect();
    // thumb centres (stage px) measured with every preview closed
    const ctr = (r: number, c: number) => {
      const b = thumbs[r][c].getBoundingClientRect();
      return { x: b.left - sr.left + b.width / 2, y: b.top - sr.top + b.height / 2, ax: b.left - rr.left + b.width / 2 - 12 };
    };
    const card = (r: number, c: number) => pv[r].querySelector(`.m257-c${c}`);
    const arrow = (r: number) => pv[r].querySelector(".m257-arrow");
    const press = (tl: gsap.core.Timeline, r: number, c: number) =>
      tl
        .to(dot, { scale: 0.65, duration: 0.12, ease: "power2.in" })
        .to(dot, { scale: 1, duration: 0.15, ease: "power2.out" })
        .call(() => allThumbs.forEach((t) => t.classList.toggle("on", t === thumbs[r][c])), undefined, "<");
    const a = ctr(0, 1);
    const b = ctr(1, 2);
    const c3 = ctr(0, 3);
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(dot, { x: sr.width * 0.5, y: sr.height * 0.94, scale: 1, opacity: 1 })
      .call(() => allThumbs.forEach((t) => t.classList.remove("on")))
      // 1 · open the preview under row 1 (thumb 2)
      .to(dot, { x: a.x, y: a.y, duration: 0.5, ease: "power2.inOut" });
    press(tl, 0, 1);
    tl.set(arrow(0), { left: a.ax })
      .set(card(0, 1), { autoAlpha: 1 })
      .to(pv[0], { height: H, duration: 0.6, ease: "power3.inOut" })
      .fromTo(card(0, 1), { y: 24 }, { y: 0, duration: 0.5, ease: "power3.out" }, "<0.15")
      // 2 · choose a thumb in row 2 (pushed down by H): row 1's preview closes while row 2's opens, the pointer rides with the row
      .to(dot, { x: b.x, y: b.y + H, duration: 0.5, ease: "power2.inOut" }, "+=0.1");
    press(tl, 1, 2);
    tl.set(arrow(1), { left: b.ax })
      .set(card(1, 2), { autoAlpha: 1 })
      .to(pv[0], { height: 0, duration: 0.6, ease: "power3.inOut" })
      .to(pv[1], { height: H, duration: 0.6, ease: "power3.inOut" }, "<")
      .to(dot, { y: b.y, duration: 0.6, ease: "power3.inOut" }, "<")
      .fromTo(card(1, 2), { y: 24 }, { y: 0, duration: 0.5, ease: "power3.out" }, "<0.15")
      .set(card(0, 1), { autoAlpha: 0 })
      // 3 · back to row 1, last thumb: the arrow now points at column 4
      .to(dot, { x: c3.x, y: c3.y, duration: 0.5, ease: "power2.inOut" }, "+=0.1");
    press(tl, 0, 3);
    tl.set(arrow(0), { left: c3.ax })
      .set(card(0, 3), { autoAlpha: 1 })
      .to(pv[1], { height: 0, duration: 0.6, ease: "power3.inOut" })
      .to(pv[0], { height: H, duration: 0.6, ease: "power3.inOut" }, "<")
      .fromTo(card(0, 3), { y: 24 }, { y: 0, duration: 0.5, ease: "power3.out" }, "<0.15")
      .set(card(1, 2), { autoAlpha: 0 })
      // 4 · pointer leaves, the preview folds away, loop
      .to(dot, { x: sr.width * 0.5, y: sr.height * 0.94, duration: 0.5, ease: "power2.inOut" }, "+=0.1")
      .to(pv[0], { height: 0, duration: 0.5, ease: "power3.inOut" }, "<")
      .call(() => allThumbs.forEach((t) => t.classList.remove("on")), undefined, "<")
      .set(card(0, 3), { autoAlpha: 0 });
    return tl;
  });
  return (
    <Stage r={root} bg="#100f0c" g1="rgba(242,210,122,.5)" g2="rgba(255,150,110,.2)">
      <div className="absolute left-[5%] right-[5%] top-[5%] flex items-baseline justify-between">
        <h3 className="text-[clamp(30px,2.8vw,44px)] leading-none text-[#f4ead8]" style={{ fontFamily: EDITORIAL }}>
          The summer rail
        </h3>
        <p className="text-[13px] uppercase tracking-[0.22em] text-[#f4ead8]/55" style={{ fontFamily: BODY }}>
          8 pieces · tap to preview
        </p>
      </div>
      <div className="m257-region absolute bottom-[3%] left-[5%] right-[5%] top-[15%] flex flex-col overflow-hidden">
        {M257_ROWS.map((row, r) => (
          <div key={r} className="contents">
            <div className={`m257-row${r} flex h-[27%] shrink-0 gap-3 pb-3`}>
              {row.map((it) => (
                <div key={it.n} className="m257-t relative flex-1 overflow-hidden rounded-[14px]">
                  <Img i={it.i} w={500} h={300} />
                  <span className="absolute bottom-2 left-3 text-[13px] text-white/85" style={{ fontFamily: GROTESK }}>
                    {it.n}
                  </span>
                </div>
              ))}
            </div>
            <M257Preview row={r} open={r === 0 ? 1 : undefined} />
          </div>
        ))}
      </div>
      <span className="b6r3-dot" style={{ opacity: 0 }} aria-hidden />
      <Sheen g1="rgba(242,210,122,.5)" />
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M254", name: "Morphing path item reveal", how: "On view, each grid item is uncovered by an SVG cover whose path morphs from full cover to a wavy blob to a thin top edge, item by item.", kind: "play", C: M254 },
  { code: "M255", name: "Pixel-swap patterns", how: "A pixel grid assembles over the image in a pattern (centre, edges, spiral, diagonal, left to right), swaps the content, then dissolves in the same order.", kind: "play", C: M255 },
  { code: "M256", name: "Staggered logo slot swap", how: "Every logo slot swaps to its next logo with a vertical blur slide on a timer, staggered so the change ripples across the row.", kind: "play", C: M256 },
  { code: "M257", name: "Inline expanding preview row", how: "Choosing a thumbnail opens a full-width preview right below its row (height tween), pushing later rows down, with an arrow pointing to the source.", kind: "play", C: M257 },
];
