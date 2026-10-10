"use client";

// Text motions, batch 8 · group 1 (MOTION-MENU M350–M361). Small focused demos for /lab/motion, rebuilt in GSAP / CSS / canvas
// from the idea only. Every demo: plays by itself on screen (or follows the scroll), loops, has a CSS glow loop that never
// stops, and shows a sensible final state in ?static=1 / reduced motion.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, SplitText, prefersReducedMotion } from "@/lib/gsap";
import { useScrub, useTicker } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = { sg: "Space Grotesk Variable", fr: "Fraunces Variable", is: "Instrument Serif", sy: "Syne Variable", mr: "Manrope Variable" };
const ACC = "#ffa35c";

const CSS = `
.b8g1-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 32% 38%,var(--g1,rgba(255,163,92,.42)),transparent 70%),radial-gradient(34% 40% at 70% 66%,var(--g2,rgba(79,141,255,.22)),transparent 70%);animation:b8g1-drift 6s linear infinite alternate;will-change:transform}
.b8g1-top{mix-blend-mode:screen;opacity:.45;z-index:5}
@keyframes b8g1-drift{0%{transform:translate3d(-7%,-5%,0) scale(1)}100%{transform:translate3d(7%,6%,0) scale(1.15)}}
.m350-out{color:transparent;-webkit-text-stroke:1.5px rgba(234,245,255,.72)}
.m353-px{position:absolute;left:50%;top:50%;height:.7em;width:.5em;transform:translate(-50%,-52%);visibility:hidden;overflow:visible}
.m357-caret{animation:m357-blink .5s steps(2) infinite}
@keyframes m357-blink{0%{opacity:1}100%{opacity:.15}}
.m360-w,.m361-w{grid-area:1/1}
html.is-static .b8g1-glow,html.is-static .m357-caret{animation:none}
html.is-static {.b8g1-glow,.m357-caret{animation:none}}
`;

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). `top` adds a second glow over the content. */
function Stage({
  r,
  children,
  className = "",
  g1,
  g2,
  top = false,
}: {
  r?: RefObject<HTMLDivElement | null>;
  children: ReactNode;
  className?: string;
  g1?: string;
  g2?: string;
  top?: boolean;
}) {
  const vars = { "--g1": g1, "--g2": g2 } as CSSProperties;
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0f1c] text-[#eaf5ff] ${className}`}>
      <style href="b8g1-css" precedence="default">
        {CSS}
      </style>
      <div className="b8g1-glow" style={vars} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
      {top && <div className="b8g1-glow b8g1-top" style={vars} aria-hidden />}
    </div>
  );
}

/** "play" helper: waits for fonts, builds the looping animation in a gsap.context, plays it only on screen, reverts on unmount. */
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

/** Small deterministic random (same rhythm every loop and every load). */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const Caption = ({ children }: { children: ReactNode }) => (
  <p className="absolute bottom-5 left-6 text-[13px] uppercase tracking-[0.18em] text-white/60">{children}</p>
);

/** Scrub footer: caption + a progress line. */
function ScrubBar({ bar, children }: { bar: RefObject<HTMLSpanElement | null>; children: ReactNode }) {
  return (
    <div className="absolute bottom-5 left-6 z-10 flex items-center gap-4 text-[13px] uppercase tracking-[0.18em] text-white/65">
      <span>{children}</span>
      <span className="relative block h-px w-[160px] bg-white/15">
        <span ref={bar} className="absolute inset-0 origin-left bg-[#ffa35c]" style={{ transform: "scaleX(0)" }} />
      </span>
    </div>
  );
}

/* ───────────────────────── M350 · Outline text fills on hover (play, CSS clip + auto pointer) ───────────────────────── */
const M350_ITEMS = ["Collections", "Atelier", "Journal", "Stores"];
const CLIP_HIDE = "inset(0% 100% 0% 0%)";
const CLIP_FULL = "inset(0% 0% 0% 0%)";
const CLIP_GONE = "inset(0% 0% 0% 100%)";
function M350() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const items = gsap.utils.toArray<HTMLElement>(".m350-i", el);
    const fills = items.map((i) => i.querySelector<HTMLElement>(".m350-fill")!);
    const dot = el.querySelector<HTMLElement>(".m350-dot")!;
    const rr = el.getBoundingClientRect();
    const at = (i: number) => {
      const r = items[i].getBoundingClientRect();
      return { x: r.left - rr.left + r.width * 0.72, y: r.top - rr.top + r.height * 0.55 };
    };
    const p0 = at(0);
    gsap.set(fills, { clipPath: CLIP_HIDE });
    gsap.set(dot, { x: p0.x - 60, y: p0.y + 40, opacity: 1 });
    const tl = gsap.timeline({ repeat: -1 });
    items.forEach((_, i) => {
      const p = at(i);
      const t = i * 0.95;
      tl.to(dot, { x: p.x, y: p.y, duration: 0.4, ease: "power2.inOut" }, t);
      tl.fromTo(fills[i], { clipPath: CLIP_HIDE }, { clipPath: CLIP_FULL, duration: 0.55, ease: "power2.out" }, t + 0.3);
      // leaving: the fill wipes out to the right while the pointer travels on
      tl.to(fills[i], { clipPath: CLIP_GONE, duration: 0.5, ease: "power1.in" }, t + 1.1);
    });
    tl.to(dot, { x: p0.x - 60, y: p0.y + 40, duration: 0.4, ease: "power2.inOut" }, items.length * 0.95 - 0.1);
    // real hover still works: the auto walk pauses while the mouse is over the menu
    const list = el.querySelector<HTMLElement>(".m350-list")!;
    let resume: gsap.core.Tween | null = null;
    const enters = items.map((it, i) => {
      const en = () => gsap.fromTo(fills[i], { clipPath: CLIP_HIDE }, { clipPath: CLIP_FULL, duration: 0.5, ease: "power2.out", overwrite: true });
      const le = () => gsap.to(fills[i], { clipPath: CLIP_GONE, duration: 0.45, ease: "power1.in", overwrite: true });
      it.addEventListener("mouseenter", en);
      it.addEventListener("mouseleave", le);
      return () => {
        it.removeEventListener("mouseenter", en);
        it.removeEventListener("mouseleave", le);
      };
    });
    const lin = () => {
      resume?.kill();
      tl.pause();
      gsap.set(fills, { clipPath: CLIP_HIDE });
      gsap.to(dot, { opacity: 0, duration: 0.2 });
    };
    const lout = () => {
      resume = gsap.delayedCall(0.8, () => {
        gsap.set(dot, { opacity: 1 });
        tl.restart();
      });
    };
    list.addEventListener("mouseenter", lin);
    list.addEventListener("mouseleave", lout);
    onClean(() => {
      enters.forEach((f) => f());
      list.removeEventListener("mouseenter", lin);
      list.removeEventListener("mouseleave", lout);
      resume?.kill();
    });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,163,92,.42)" g2="rgba(120,110,255,.22)">
      <div className="absolute inset-0 flex items-center justify-between px-[8%]">
        <ul className="m350-list" style={{ fontFamily: F.sy }}>
          {M350_ITEMS.map((w, i) => (
            <li key={w} className="m350-i relative w-fit cursor-pointer py-[0.04em] text-[clamp(56px,6.2vw,104px)] font-[800] uppercase leading-[1.02] tracking-[-0.01em]">
              <span className="m350-out block">{w}</span>
              <span className="m350-fill absolute inset-0 py-[0.04em] text-[#ffa35c]" style={{ clipPath: CLIP_HIDE }} aria-hidden>
                {w}
              </span>
              <span className="absolute -left-[2.2em] top-1/2 text-[13px] font-[500] tracking-[0.2em] text-white/45" style={{ fontFamily: F.sg }}>
                0{i + 1}
              </span>
            </li>
          ))}
        </ul>
        <div className="max-w-[260px] text-right text-[14px] leading-relaxed text-white/60" style={{ fontFamily: F.mr }}>
          Maison Orelle
          <br />
          Autumn tailoring from ₹14,900
        </div>
      </div>
      <span className="m350-dot pointer-events-none absolute left-0 top-0 -ml-[9px] -mt-[9px] h-[18px] w-[18px] rounded-full border-2 border-white bg-white/25 opacity-0" aria-hidden />
    </Stage>
  );
}

/* ───────────────────────── M351 · Pinned words fly back and up (scrub, SplitText 3D) ───────────────────────── */
function M351() {
  const root = useRef<HTMLDivElement>(null);
  const para = useRef<HTMLParagraphElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const last = useRef(0);
  useEffect(() => {
    const p = para.current;
    if (!p || prefersReducedMotion()) return;
    let dead = false;
    let split: SplitText | null = null;
    const ctx = gsap.context(() => {}, p);
    document.fonts.ready.then(() => {
      if (dead) return;
      ctx.add(() => {
        split = SplitText.create(p, { type: "words" });
        const words = split.words as HTMLElement[];
        gsap.set(words, { display: "inline-block" });
        const r = rng(351);
        const order = words.map((_, i) => ({ i, k: r() })).sort((a, b) => a.k - b.k);
        const tl = gsap.timeline({ paused: true });
        const n = words.length;
        // starts spread linearly over 0..0.7 of the timeline, each flight 0.3 long → the last word lands exactly at 1
        order.forEach(({ i }, k) => {
          tl.to(
            words[i],
            {
              rotationX: gsap.utils.interpolate(-110, 110, r()),
              rotationY: gsap.utils.interpolate(-80, 80, r()),
              rotationZ: gsap.utils.interpolate(-40, 40, r()),
              y: -gsap.utils.interpolate(160, 380, r()),
              z: -gsap.utils.interpolate(200, 700, r()),
              opacity: 0,
              duration: 0.3,
              ease: "power1.in",
            },
            (k / Math.max(1, n - 1)) * 0.7,
          );
        });
        tlRef.current = tl;
        tl.progress(last.current);
      });
    });
    return () => {
      dead = true;
      tlRef.current = null;
      ctx.revert();
      split?.revert();
    };
  }, []);
  useScrub(
    root,
    (p) => {
      last.current = p;
      tlRef.current?.progress(p);
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    },
    { finalValue: 0 },
  );
  return (
    <Stage r={root} g1="rgba(255,163,92,.38)" g2="rgba(92,200,255,.24)">
      <div className="absolute inset-0 grid place-items-center px-[8%]" style={{ perspective: "1000px" }}>
        <p
          ref={para}
          className="max-w-[24ch] text-center text-[clamp(36px,4vw,64px)] leading-[1.14] tracking-[-0.01em]"
          style={{ fontFamily: F.fr, transformStyle: "preserve-3d" }}
        >
          Light as a breath, our paper kites lift on the faintest coastal wind and carry your name out past the dunes.
        </p>
      </div>
      <ScrubBar bar={bar}>Driftline kites · rice paper · ₹2,400</ScrubBar>
    </Stage>
  );
}

/* ───────────────────────── M352 · Pixel shimmer text reveal (play, canvas 2D) ───────────────────────── */
const M352_TEXT = "Midnight Bloom";
const M352_COLS = ["255,163,92", "255,214,160", "120,190,255", "234,245,255"];
function M352() {
  const root = useRef<HTMLDivElement>(null);
  const cvs = useRef<HTMLCanvasElement>(null);
  const fb = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const el = root.current;
    const canvas = cvs.current;
    if (!el || !canvas || prefersReducedMotion()) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let dead = false;
    let on = false;
    let raf = 0;
    let W = 0;
    let H = 0;
    let font = "";
    let cell = 8;
    let box = { x: 0, y: 0, w: 0, h: 0 };
    let cells: { x: number; y: number; ink: number; h: number }[] = [];
    let t0 = performance.now();

    const build = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      if (!W || !H) return;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      let size = Math.min(H * 0.26, W * 0.1);
      ctx.font = `800 ${size}px "${F.sy}", sans-serif`;
      const tw = ctx.measureText(M352_TEXT).width;
      if (tw > W * 0.74) size *= (W * 0.74) / tw;
      font = `800 ${size}px "${F.sy}", sans-serif`;
      ctx.font = font;
      const w = ctx.measureText(M352_TEXT).width;
      cell = Math.max(6, Math.round(size / 14));
      box = { x: (W - w) / 2 - cell * 3, y: H * 0.46 - size * 0.62, w: w + cell * 6, h: size * 1.2 };
      // rasterise the word once and sample each square cell for ink
      const off = document.createElement("canvas");
      off.width = Math.ceil(W);
      off.height = Math.ceil(H);
      const oc = off.getContext("2d", { willReadFrequently: true })!;
      oc.font = font;
      oc.textAlign = "center";
      oc.textBaseline = "middle";
      oc.fillStyle = "#fff";
      oc.fillText(M352_TEXT, W / 2, H * 0.46);
      const data = oc.getImageData(0, 0, off.width, off.height).data;
      const rand = rng(352);
      cells = [];
      for (let y = box.y; y < box.y + box.h; y += cell)
        for (let x = box.x; x < box.x + box.w; x += cell) {
          const cx = Math.min(off.width - 1, Math.max(0, Math.round(x + cell / 2)));
          const cy = Math.min(off.height - 1, Math.max(0, Math.round(y + cell / 2)));
          cells.push({ x, y, ink: data[(cy * off.width + cx) * 4 + 3] / 255, h: rand() });
        }
    };

    // one loop: shimmer passes in (1.5 s) → hold 0.25 s → shimmer passes again and takes the word away (1.1 s) → 0.15 s gap
    const IN = 1.5;
    const HOLD = 0.25;
    const OUT = 1.1;
    const GAP = 0.15;
    const LOOP = IN + HOLD + OUT + GAP;
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!on || !W) return;
      const t = ((now - t0) / 1000) % LOOP;
      ctx.clearRect(0, 0, W, H);
      const band = box.w * 0.28;
      let front = 0;
      let showLeft = true;
      if (t < IN) front = box.x - 10 + (box.w + band + 20) * (t / IN);
      else if (t < IN + HOLD) front = box.x + box.w + band + 20;
      else if (t < IN + HOLD + OUT) {
        front = box.x - 10 + (box.w + band + 20) * ((t - IN - HOLD) / OUT);
        showLeft = false;
      } else return;
      // crisp letters: behind the band on the way in, ahead of it on the way out
      ctx.save();
      ctx.beginPath();
      if (showLeft) ctx.rect(0, 0, Math.max(0, front - band), H);
      else ctx.rect(front, 0, W, H);
      ctx.clip();
      ctx.font = font;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#eaf5ff";
      ctx.fillText(M352_TEXT, W / 2, H * 0.46);
      ctx.restore();
      // the shimmer band of square cells (flicker re-rolls 24× a second)
      const tick = Math.floor(now / 42);
      for (let i = 0; i < cells.length; i++) {
        const c = cells[i];
        if (c.x > front || c.x < front - band) continue;
        const u = (front - c.x) / band; // 0 at the leading edge, 1 at the trailing edge
        const k = showLeft ? u : 1 - u;
        const fl = ((Math.sin((i * 12.9898 + tick * 78.233) * 0.5) * 43758.5453) % 1 + 1) % 1;
        let a: number;
        if (c.ink > 0.4) a = (0.35 + 0.65 * fl) * (0.4 + 0.6 * k);
        else a = fl > 0.82 ? (1 - k) * 0.55 * fl : 0;
        if (a < 0.03) continue;
        const col = M352_COLS[(i + tick) % (c.ink > 0.4 ? 4 : 3)];
        ctx.fillStyle = `rgba(${col},${a.toFixed(3)})`;
        const s = cell - 1.5;
        ctx.fillRect(c.x + 0.75, c.y + 0.75, s, s);
      }
    };

    const io = new IntersectionObserver(
      ([e]) => {
        const was = on;
        on = e.isIntersecting;
        if (on && !was) t0 = performance.now();
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    const ro = new ResizeObserver(() => build());
    document.fonts.ready.then(() => {
      if (dead) return;
      build();
      ro.observe(canvas);
      if (fb.current) fb.current.style.visibility = "hidden";
      raf = requestAnimationFrame(draw);
    });
    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      if (fb.current) fb.current.style.visibility = "";
    };
  }, []);
  return (
    <Stage r={root} g1="rgba(255,163,92,.4)" g2="rgba(120,190,255,.24)">
      <div className="absolute inset-0 grid place-items-center">
        <h3 ref={fb} className="-mt-[8%] whitespace-nowrap text-center text-[clamp(44px,6vw,96px)] font-[800] leading-none" style={{ fontFamily: F.sy }}>
          {M352_TEXT}
        </h3>
      </div>
      <canvas ref={cvs} className="absolute inset-0 h-full w-full" aria-label={M352_TEXT} />
      <p className="absolute bottom-[14%] left-0 right-0 text-center text-[13px] uppercase tracking-[0.22em] text-white/60">
        Night-blooming jasmine · eau de parfum 50 ml · ₹6,800
      </p>
    </Stage>
  );
}

/* ───────────────────────── M353 · Pixel-font character cycling (play, gsap) ───────────────────────── */
// 5×7 bitmaps for the letters of the word.
const M353_GLYPH: Record<string, string[]> = {
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
};
const M353_WORD = "REPLAY";
const M353_STYLES = 4; // square, round, outline, scanline
function M353Glyph({ ch, style }: { ch: string; style: number }) {
  const on: [number, number][] = [];
  M353_GLYPH[ch].forEach((row, y) => row.split("").forEach((b, x) => b === "1" && on.push([x, y])));
  return (
    <svg viewBox="0 0 5 7" className={`m353-px m353-s${style}`} aria-hidden>
      {on.map(([x, y]) =>
        style === 0 ? (
          <rect key={`${x}${y}`} x={x + 0.06} y={y + 0.06} width={0.88} height={0.88} fill={ACC} />
        ) : style === 1 ? (
          <circle key={`${x}${y}`} cx={x + 0.5} cy={y + 0.5} r={0.42} fill="#eaf5ff" />
        ) : style === 2 ? (
          <rect key={`${x}${y}`} x={x + 0.14} y={y + 0.14} width={0.72} height={0.72} fill="none" stroke="#7cc4ff" strokeWidth={0.12} />
        ) : (
          <rect key={`${x}${y}`} x={x} y={y + 0.3} width={1.02} height={0.4} fill="#ffd6a0" />
        ),
      )}
    </svg>
  );
}
function M353() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const slots = gsap.utils.toArray<HTMLElement>(".m353-slot", el);
    const layers = slots.map((s) => [...gsap.utils.toArray<Element>(".m353-px", s), s.querySelector<HTMLElement>(".m353-f")!]);
    const show = (tl: gsap.core.Timeline, i: number, k: number, t: number) => {
      layers[i].forEach((l, j) => tl.set(l, { visibility: j === k ? "visible" : "hidden" }, t));
    };
    const rand = rng(353);
    const tl = gsap.timeline({ repeat: -1 });
    const STEP = 0.075;
    // settle: wave left → right, each character flicks through pixel styles, then lands on the real font
    let end = 0;
    slots.forEach((_, i) => {
      let t = 0.05 + i * 0.09;
      show(tl, i, Math.floor(rand() * M353_STYLES), 0);
      const n = 4 + Math.floor(rand() * 3);
      for (let s = 0; s < n; s++) {
        show(tl, i, (i + s) % M353_STYLES, t);
        t += STEP;
      }
      show(tl, i, M353_STYLES, t);
      end = Math.max(end, t);
    });
    // hold the word, then dissolve back into pixels in random order
    const back = end + 0.3;
    const order = slots.map((_, i) => ({ i, k: rand() })).sort((a, b) => a.k - b.k);
    order.forEach(({ i }, o) => {
      let t = back + o * 0.07;
      for (let s = 0; s < 4; s++) {
        show(tl, i, (s + o) % M353_STYLES, t);
        t += STEP;
      }
      end = Math.max(end, t);
    });
    tl.to({}, { duration: 0.12 }, end);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,163,92,.42)" g2="rgba(124,196,255,.26)">
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="mb-6 text-[13px] uppercase tracking-[0.22em] text-white/55">Arcade bar · Level 2</p>
          <div className="flex justify-center text-[clamp(80px,9vw,150px)] font-[800] leading-none" style={{ fontFamily: F.sy }}>
            {M353_WORD.split("").map((c, i) => (
              <span key={i} className="m353-slot relative inline-grid w-[0.82em] place-items-center">
                {Array.from({ length: M353_STYLES }, (_, s) => (
                  <M353Glyph key={s} ch={c} style={s} />
                ))}
                <span className="m353-f">{c}</span>
              </span>
            ))}
          </div>
          <p className="mt-8 text-[13px] uppercase tracking-[0.22em] text-white/60">Unlimited play pass · ₹899 a night</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M354 · Pointer-drawn box highlight (play, gsap) ───────────────────────── */
function M354() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const box = el.querySelector<HTMLElement>(".m354-box")!;
    const targets = gsap.utils.toArray<HTMLElement>(".m354-t", el);
    const pad = 8;
    const tl = gsap.timeline({ repeat: -1 });
    let t = 0;
    targets.forEach((w) => {
      const x = w.offsetLeft - pad;
      const y = w.offsetTop - pad / 2;
      const bw = w.offsetWidth + pad * 2;
      const bh = w.offsetHeight + pad;
      tl.set(box, { left: x, top: y, width: 0, height: 0, opacity: 1 }, t)
        .set(w, { color: "#eaf5ff" }, t)
        .to(box, { width: bw, duration: 0.45, ease: "power2.inOut" }, t + 0.02)
        .to(box, { height: bh, duration: 0.35, ease: "power2.inOut" }, t + 0.47)
        .to(w, { color: ACC, duration: 0.3, ease: "sine.out" }, t + 0.6)
        .to(box, { opacity: 0, duration: 0.3, ease: "sine.in" }, t + 1.1)
        .to(w, { color: "#eaf5ff", duration: 0.3, ease: "sine.in" }, t + 1.1);
      t += 1.4;
    });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,163,92,.4)" g2="rgba(92,160,255,.22)">
      <div className="absolute inset-0 grid place-items-center px-[8%]">
        <div>
          <p className="mb-6 text-[13px] uppercase tracking-[0.22em] text-white/55">Ember & Oak roasters</p>
          <p className="m354-p relative max-w-[22ch] text-[clamp(40px,4.4vw,72px)] font-[500] leading-[1.15] tracking-[-0.01em]" style={{ fontFamily: F.sg }}>
            We roast in <span className="m354-t inline-block">small batches</span> so every bag tastes like the <span className="m354-t inline-block">very first</span>.
            <span className="m354-box pointer-events-none absolute left-0 top-0 h-0 w-0 border-[1.5px] border-[#ffa35c] bg-[#ffa35c]/10 opacity-0" aria-hidden>
              <svg viewBox="0 0 16 20" className="absolute -bottom-[22px] -right-[16px] h-[24px] w-[19px]" aria-hidden>
                <path d="M1 1 L1 16 L5 12 L8 19 L11 18 L8 11 L14 11 Z" fill="#ffa35c" stroke="#0a0f1c" strokeWidth={1.2} strokeLinejoin="round" />
              </svg>
            </span>
          </p>
          <p className="mt-8 text-[13px] uppercase tracking-[0.22em] text-white/60">House blend · 250 g · ₹690</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M355 · Receding text plane (scrub, CSS 3D) ───────────────────────── */
const M355_COPY = [
  "Long ago, before the first kettle sang, the hill farms kept a secret blend for the cold months.",
  "It was smoked over pine, rolled by hand and packed in tins that crossed three valleys by mule.",
  "Today we still pick the same slopes at dawn, dry the leaves in shade and seal each tin by noon.",
  "Open one on a grey morning and the whole room smells of woodsmoke, rain and a little honey.",
  "Brew it strong. Pour it slow. Pass the second cup to whoever needs it most.",
];
function M355() {
  const root = useRef<HTMLDivElement>(null);
  const plane = useRef<HTMLDivElement>(null);
  const crawl = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  useScrub(
    root,
    (p) => {
      const pl = plane.current;
      const c = crawl.current;
      if (!pl || !c) return;
      // linear over the whole panel: the copy starts half up the plane and crawls away past the horizon
      const y = gsap.utils.interpolate(pl.clientHeight * 0.45, -c.offsetHeight, p);
      c.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    },
    { finalValue: 0.3 },
  );
  return (
    <Stage r={root} g1="rgba(255,190,92,.36)" g2="rgba(92,140,255,.22)">
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          perspective: "520px",
          perspectiveOrigin: "50% 18%",
          maskImage: "linear-gradient(to bottom, transparent 6%, #000 42%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 6%, #000 42%)",
        }}
      >
        <div
          ref={plane}
          className="absolute bottom-0 left-[22%] right-[22%] top-[-60%] overflow-hidden"
          style={{ transform: "rotateX(55deg)", transformOrigin: "50% 100%" }}
        >
          <div ref={crawl} className="will-change-transform text-justify text-[clamp(30px,2.9vw,46px)] font-[600] leading-[1.32] text-[#ffd79a]" style={{ fontFamily: F.sg }}>
            <p className="mb-[0.6em] text-center text-[1.3em] font-[700] uppercase tracking-[0.06em]">Chapter IV · The Hill Blend</p>
            {M355_COPY.map((t, i) => (
              <p key={i} className="mb-[0.8em]">
                {t}
              </p>
            ))}
          </div>
        </div>
      </div>
      <ScrubBar bar={bar}>Pinecrest smoked tea · 100 g tin · ₹1,180</ScrubBar>
    </Stage>
  );
}

/* ───────────────────────── M356 · Scale-up word pop (play, SplitText) ───────────────────────── */
function M356() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const head = el.querySelector<HTMLElement>(".m356-h")!;
    const split = SplitText.create(head, { type: "words" });
    onClean(() => split.revert());
    const words = split.words as HTMLElement[];
    gsap.set(words, { display: "inline-block", transformOrigin: "50% 50%" });
    const tl = gsap.timeline({ repeat: -1 });
    tl.fromTo(words, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: "power2.out", stagger: 0.05 })
      .to(words, { opacity: 0, scale: 0.85, duration: 0.38, ease: "power1.in", stagger: 0.025 }, "+=0.25")
      .to({}, { duration: 0.08 });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,163,92,.42)" g2="rgba(190,120,255,.22)">
      <div className="absolute inset-0 grid place-items-center px-[8%]">
        <div className="text-center">
          <h3 className="m356-h mx-auto max-w-[20ch] text-[clamp(44px,4.8vw,80px)] leading-[1.1] tracking-[-0.015em]" style={{ fontFamily: F.fr }}>
            Small-batch candles, poured by hand and cured for two full weeks.
          </h3>
          <p className="mt-8 text-[13px] uppercase tracking-[0.22em] text-white/60">Hearth & Wick · fig and cedar · ₹1,450</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M357 · Scramble-led typing (play, gsap) ───────────────────────── */
const M357_TEXT = "Tailored in the old quarter, shipped worldwide.";
const M357_GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghkmnpqrstuvwxyz0123456789#%&*+=/";
function M357() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const done = el.querySelector<HTMLElement>(".m357-d")!;
    const run = el.querySelector<HTMLElement>(".m357-r")!;
    const rest = el.querySelector<HTMLElement>(".m357-x")!;
    const RUN = 4;
    const L = M357_TEXT.length;
    const st = { n: 0 };
    let lastI = -1;
    let lastT = 0;
    const render = () => {
      const i = Math.floor(st.n);
      const now = performance.now();
      if (i === lastI && now - lastT < 55) return;
      lastI = i;
      lastT = now;
      const end = Math.min(L, i + RUN);
      let s = "";
      for (let k = i; k < end; k++) s += M357_TEXT[k] === " " ? " " : M357_GLYPHS[Math.floor(Math.random() * M357_GLYPHS.length)];
      done.textContent = M357_TEXT.slice(0, i);
      run.textContent = s;
      rest.textContent = M357_TEXT.slice(end);
    };
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(st, { n: 0 })
      .to(st, { n: L, duration: L * 0.045, ease: "none", onUpdate: render })
      .to(st, { n: 0, duration: L * 0.016, ease: "none", onUpdate: render }, "+=0.3")
      .to({}, { duration: 0.1, onUpdate: render });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,163,92,.4)" g2="rgba(79,141,255,.24)">
      <div className="absolute inset-0 grid place-items-center px-[8%]">
        <div>
          <p className="mb-6 text-[13px] uppercase tracking-[0.22em] text-white/55">Saffron Row tailors · Est. 1962</p>
          <p className="max-w-[22ch] whitespace-pre-wrap text-[clamp(40px,4.4vw,72px)] font-[500] leading-[1.15] tracking-[-0.01em]" style={{ fontFamily: F.sg }}>
            <span className="m357-d">{M357_TEXT}</span>
            <span className="m357-caret mx-[0.04em] inline-block h-[0.9em] w-[3px] translate-y-[0.12em] bg-[#ffa35c]" aria-hidden />
            <span className="m357-r text-[#ffa35c]" />
            <span className="m357-x opacity-0" />
          </p>
          <p className="mt-8 text-[13px] uppercase tracking-[0.22em] text-white/60">Bespoke linen suit · from ₹24,500</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M358 · Scroll swap text (scrub, gsap masks) ───────────────────────── */
const M358_LINES = ["Grind it fresh.", "Brew it slow.", "Pour it warm.", "Share it twice.", "Order a bag."];
function M358() {
  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  useScrub(
    root,
    (p) => {
      const el = root.current;
      if (!el) return;
      const lines = el.querySelectorAll<HTMLElement>(".m358-l");
      const N = lines.length;
      const s = p * (N - 1);
      const k = Math.min(N - 1, Math.floor(s));
      const f = s - k;
      // each swap uses the middle 70 % of its scroll segment (linear in progress, sine-shaped in the mask)
      const u = gsap.parseEase("sine.inOut")(gsap.utils.clamp(0, 1, (f - 0.15) / 0.7));
      lines.forEach((l, i) => {
        let y = i < k ? -110 : i > k + 1 ? 110 : 0;
        if (i === k) y = -110 * u;
        if (i === k + 1) y = 110 * (1 - u);
        l.style.visibility = "visible";
        l.style.transform = `translate3d(0,${y.toFixed(2)}%,0)`;
      });
      if (num.current) num.current.textContent = `0${Math.min(N, k + (u > 0.5 ? 2 : 1))} / 0${N}`;
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    },
    { finalValue: 0 },
  );
  return (
    <Stage r={root} g1="rgba(255,163,92,.4)" g2="rgba(120,200,160,.22)">
      <div className="absolute inset-0 grid place-items-center px-[8%]">
        <div className="text-center">
          <span ref={num} className="mb-6 block text-[13px] uppercase tracking-[0.22em] text-white/55">
            01 / 05
          </span>
          <div className="grid overflow-hidden py-[0.06em] text-[clamp(64px,7vw,116px)] font-[700] leading-[1.05] tracking-[-0.02em]" style={{ fontFamily: F.sg }}>
            {M358_LINES.map((l, i) => (
              <span key={l} className="m358-l whitespace-nowrap will-change-transform" style={{ gridArea: "1/1", visibility: i ? "hidden" : "visible" }} aria-hidden={i > 0}>
                {l}
              </span>
            ))}
          </div>
          <p className="mt-8 text-[13px] uppercase tracking-[0.22em] text-white/60">Copperpot coffee · whole bean 500 g · ₹1,120</p>
        </div>
      </div>
      <ScrubBar bar={bar}>Scroll to swap</ScrubBar>
    </Stage>
  );
}

/* ───────────────────────── M359 · Scroll weight wave (scrub, variable font) ───────────────────────── */
const M359_LINES = [["Light", "shifts,", "weight", "follows,"], ["every", "word", "leans", "in."]];
function M359() {
  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const target = useRef(-1.5);
  const cur = useRef(-1.5);
  const apply = (c: number) => {
    const el = root.current;
    if (!el) return;
    el.querySelectorAll<HTMLElement>(".m359-w").forEach((w, i) => {
      const d = Math.abs(i - c) / 1.7;
      const x = gsap.utils.clamp(0, 1, 1 - d);
      const f = x * x * (3 - 2 * x); // smoothstep window, overlapping its neighbours
      w.style.transform = `translate3d(0,${(-0.14 * f).toFixed(3)}em,0) scale(${(1 + 0.22 * f).toFixed(3)})`;
      w.style.letterSpacing = `${(0.05 * f - 0.01).toFixed(3)}em`;
      w.style.fontWeight = String(Math.round(250 + 550 * f));
      w.style.color = f > 0.5 ? ACC : "";
    });
  };
  useScrub(
    root,
    (p) => {
      // the crest travels from before the first word to past the last one, linear over the whole panel
      target.current = -1.5 + p * 10;
      if (prefersReducedMotion()) apply(target.current);
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    },
    { finalValue: -0.15 },
  );
  useTicker(root, (_t, dt) => {
    const k = 1 - Math.exp(-dt * 9);
    cur.current += (target.current - cur.current) * k;
    apply(cur.current);
  });
  return (
    <Stage r={root} g1="rgba(255,163,92,.4)" g2="rgba(140,120,255,.24)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center text-[clamp(52px,5.6vw,92px)] leading-[1.2] tracking-[-0.01em]" style={{ fontFamily: F.mr }}>
          {M359_LINES.map((line, li) => (
            <div key={li} className="whitespace-nowrap">
              {line.map((w, wi) => (
                <span
                  key={wi}
                  className={`m359-w inline-block origin-bottom ${wi < line.length - 1 ? "mr-[0.28em]" : ""}`}
                  style={{ fontWeight: 250 }}
                >
                  {w}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <ScrubBar bar={bar}>Kinetic type · Manrope 200–800</ScrubBar>
    </Stage>
  );
}

/* ───────────────────────── M360 · Shared-axis Y per word, hard cut (play, gsap) ───────────────────────── */
const M360_PHRASES = [
  ["Linen", "made", "for", "summer"],
  ["Cotton", "cut", "for", "travel"],
  ["Wool", "spun", "for", "winter"],
];
function M360() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const slots = gsap.utils.toArray<HTMLElement>(".m360-slot", el).map((s) => gsap.utils.toArray<HTMLElement>(".m360-w", s));
    const P = M360_PHRASES.length;
    slots.forEach((ws) => ws.forEach((w, p) => gsap.set(w, { visibility: "visible", yPercent: p ? 110 : 0 })));
    const tl = gsap.timeline({ repeat: -1 });
    let t = 0.3;
    for (let p = 0; p < P; p++) {
      const q = (p + 1) % P;
      // staircase: each word slot cuts 0.08 s after the one before it, quick and sharp
      slots.forEach((ws, j) => {
        tl.fromTo(ws[p], { yPercent: 0 }, { yPercent: -110, duration: 0.34, ease: "power2.in" }, t + j * 0.08);
        tl.fromTo(ws[q], { yPercent: 110 }, { yPercent: 0, duration: 0.34, ease: "power2.out" }, t + j * 0.08 + 0.06);
      });
      t += 0.4 + (slots.length - 1) * 0.08 + 0.3;
    }
    tl.to({}, { duration: 0.01 }, t - 0.3);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,163,92,.42)" g2="rgba(92,180,255,.22)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center">
          <p className="mb-6 text-[13px] uppercase tracking-[0.22em] text-white/55">Fold & Field · seasonal edit</p>
          <div className="flex justify-center text-[clamp(56px,6vw,100px)] font-[700] uppercase leading-[1.05] tracking-[-0.02em]" style={{ fontFamily: F.sg }}>
            {M360_PHRASES[0].map((_, j) => (
              <span key={j} className={`m360-slot grid justify-items-center overflow-hidden py-[0.04em] ${j < 3 ? "mr-[0.28em]" : ""}`}>
                {M360_PHRASES.map((ph, p) => (
                  <span key={p} className={`m360-w whitespace-nowrap ${j === 2 ? "text-[#ffa35c]" : ""}`} style={{ visibility: p ? "hidden" : "visible" }} aria-hidden={p > 0}>
                    {ph[j]}
                  </span>
                ))}
              </span>
            ))}
          </div>
          <p className="mt-8 text-[13px] uppercase tracking-[0.22em] text-white/60">Overshirts from ₹3,900</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M361 · Shared-axis Z, depth swap (play, gsap) ───────────────────────── */
const M361_ITEMS = [
  { h: "Quiet power.", s: "Electric coupe · 0–100 in 3.9 s" },
  { h: "Soft structure.", s: "Hand-stitched cabin · 14 tones" },
  { h: "Lasting form.", s: "From ₹58,00,000 ex-showroom" },
];
function M361() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const items = gsap.utils.toArray<HTMLElement>(".m361-w", el);
    const N = items.length;
    gsap.set(items, { visibility: "visible", transformOrigin: "50% 50%" });
    gsap.set(items.slice(1), { opacity: 0, scale: 0.8 });
    const tl = gsap.timeline({ repeat: -1 });
    let t = 0.3;
    for (let i = 0; i < N; i++) {
      const a = items[i];
      const b = items[(i + 1) % N];
      // old text moves toward the viewer and fades; new text rises out of depth (0.8 → 1) behind it
      tl.fromTo(a, { scale: 1, opacity: 1 }, { scale: 1.14, opacity: 0, duration: 0.6, ease: "power2.in" }, t);
      tl.fromTo(b, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, ease: "power2.out" }, t + 0.18);
      t += 0.88 + 0.3;
    }
    tl.to({}, { duration: 0.01 }, t - 0.3);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,163,92,.4)" g2="rgba(92,140,255,.26)">
      <div className="absolute inset-0 grid place-items-center px-[8%]">
        <div className="grid place-items-center text-center">
          {M361_ITEMS.map((it, i) => (
            <div key={i} className="m361-w will-change-transform" style={{ visibility: i ? "hidden" : "visible" }} aria-hidden={i > 0}>
              <h3 className="whitespace-nowrap text-[clamp(72px,8vw,132px)] leading-none tracking-[-0.01em]" style={{ fontFamily: F.is }}>
                {it.h}
              </h3>
              <p className="mt-6 text-[13px] uppercase tracking-[0.22em] text-white/60">{it.s}</p>
            </div>
          ))}
        </div>
      </div>
      <Caption>Velora motors · concept</Caption>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M350", name: "Outline text fills on hover", how: "Outlined menu words fill solid left to right as the pointer lands (clip of a filled copy) and wipe out to the right as it leaves · auto pointer walk", kind: "play", C: M350 },
  { code: "M351", name: "Pinned words fly back and up", how: "The paragraph stays pinned while each word tumbles on X/Y/Z, drifts up and fades away into 1000px perspective, as if blown off the page · scrubbed", kind: "scrub", C: M351 },
  { code: "M352", name: "Pixel shimmer text reveal", how: "A band of flickering square pixels sweeps across and resolves into crisp letters behind it, then sweeps again to take them away · canvas loop", kind: "play", C: M352 },
  { code: "M353", name: "Pixel-font character cycling", how: "Each letter flicks through four pixel-font styles (square, round, outline, scanline) in a wave before landing on the real font · loops", kind: "play", C: M353 },
  { code: "M354", name: "Pointer-drawn box highlight", how: "A thin box draws around a phrase from its top-left (width, then height) with a little arrow cursor riding its bottom-right corner · loops over two phrases", kind: "play", C: M354 },
  { code: "M355", name: "Receding text plane", how: "Copy lies on a plane tilted back 55° in strong perspective and crawls away toward the horizon as you scroll, like an opening crawl · scrubbed", kind: "scrub", C: M355 },
  { code: "M356", name: "Scale-up word pop", how: "Words scale from 0.5 to 1 around their own centres while fading in, staggered 0.05 s with a soft ease-out, no overshoot · loops", kind: "play", C: M356 },
  { code: "M357", name: "Scramble-led typing", how: "Text types left to right while a short run of random characters rides just ahead of the caret and resolves into the real letters · loops", kind: "play", C: M357 },
  { code: "M358", name: "Scroll swap text", how: "One line at a time: the current line slides up out of its mask while the next rises into place, scrubbed by the scroll", kind: "scrub", C: M358 },
  { code: "M359", name: "Scroll weight wave", how: "A smoothed crest of weight, scale, lift and letter-spacing travels word by word through the phrase as you scroll · scrubbed", kind: "scrub", C: M359 },
  { code: "M360", name: "Shared-axis Y per word (hard cut)", how: "Word by word, old words slide up out of their masks as new ones slide up from below in a quick staircase · loops through three phrases", kind: "play", C: M360 },
  { code: "M361", name: "Shared-axis Z (depth swap)", how: "The old headline grows slightly and fades toward the viewer while the new one scales up from 0.8 behind it · loops", kind: "play", C: M361 },
];
