"use client";

// MOTION-MENU M697–M703 (scroll group, batch 15 · part 4): small focused demos for /lab/motion.
// Every demo is "scrub": useScrub progress is mapped LINEARLY over the whole 220vh panel onto styles set directly.
// Each also has a CSS-only glow loop (plus an on-top glow where images / canvas cover the stage), so a still scroll never
// reads as a frozen frame. WebGL demos build their textures only near the viewport, run at dpr 1 and release on unmount.
// ?static=1 / reduced motion: no animation, a sensible state in the markup. Motion ideas only, rebuilt from scratch.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import type { Flip as FlipT } from "gsap/Flip";
import { gsap, loadPlugin, prefersReducedMotion } from "@/lib/gsap";
import { createShader, type GLHandle } from "@/lib/gl";
import { scene, useScrub, useTicker } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const GROTESK = "'Space Grotesk Variable', system-ui, sans-serif";
const SERIF = "'Fraunces Variable', Georgia, serif";
const EDITORIAL = "'Instrument Serif', Georgia, serif";
const WIDE = "'Syne Variable', 'Space Grotesk Variable', system-ui, sans-serif";
const MANROPE = "'Manrope Variable', system-ui, sans-serif";
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const mod = (a: number, n: number) => ((a % n) + n) % n;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};
/** Deterministic 0..1 noise per integer (same on server and client). */
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/* ---------- shared helpers (local copies) ---------- */

const CSS = `
.b15s4-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 38%,var(--g1,rgba(255,163,92,.5)),transparent 70%),radial-gradient(34% 40% at 70% 66%,var(--g2,rgba(79,141,255,.24)),transparent 70%);animation:b15s4-drift 5s linear infinite alternate;will-change:transform}
.b15s4-top{mix-blend-mode:screen;opacity:.45;z-index:40}
@keyframes b15s4-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
html.is-static .b15s4-glow{animation:none}
html.is-static {.b15s4-glow{animation:none}}
`;

/** Demo frame: dark rounded panel + the CSS-only glow loop. `top` adds a second glow over the content (covered stages). */
function Stage({ r, children, bg = "#080a12", g1, g2, top = false, style }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; bg?: string; g1?: string; g2?: string; top?: boolean; style?: CSSProperties }) {
  const vars = { "--g1": g1, "--g2": g2 } as CSSProperties;
  return (
    <div ref={r} className="relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 text-[#f3efe8]" style={{ background: bg, ...style }}>
      <style href="b15s4-css" precedence="default">
        {CSS}
      </style>
      <div className="b15s4-glow" style={vars} aria-hidden />
      {children}
      {top && <div className="b15s4-glow b15s4-top" style={vars} aria-hidden />}
    </div>
  );
}

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, className = "", style, label = "", w = 1000, h = 700 }: { i: number; className?: string; style?: CSSProperties; label?: string; w?: number; h?: number }) => (
  <img src={scene(i, w, h, label)} alt="" className={`block h-full w-full object-cover ${className}`} style={style} draggable={false} />
);

/** Draws scene() images into one canvas (a safe WebGL texture), only when called (i.e. near the viewport). */
async function paint(w: number, h: number, draw: (x: CanvasRenderingContext2D, img: (i: number, iw: number, ih: number) => Promise<HTMLImageElement>) => Promise<void> | void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d")!;
  await draw(x, async (i, iw, ih) => {
    const im = new Image();
    im.src = scene(i, iw, ih);
    await im.decode();
    return im;
  });
  return c;
}

/** Creates a WebGL handle once the stage is within ~1 screen (rootMargin 900px), destroys it on unmount. */
function useNearGL(box: RefObject<HTMLElement | null>, make: () => Promise<GLHandle | null>) {
  const mk = useRef(make);
  mk.current = make;
  const handle = useRef<GLHandle | null>(null);
  useEffect(() => {
    const el = box.current;
    if (!el || prefersReducedMotion()) return;
    let dead = false;
    let started = false;
    const near = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || started) return;
        started = true;
        near.disconnect();
        mk.current().then((h) => {
          if (dead) h?.destroy();
          else handle.current = h;
        });
      },
      { rootMargin: "900px 0px" },
    );
    near.observe(el);
    return () => {
      dead = true;
      near.disconnect();
      handle.current?.destroy();
      handle.current = null;
    };
  }, [box]);
  return handle;
}

/* ---------- M697 · Grid images shrink to random corners (variant of M13) ---------- */
const M697_COLS = 4;
const M697_ROWS = 8;
const M697_NAMES = ["Dune", "Ember", "Moss", "Tide", "Salt", "Cedar", "Ash", "Fern"];
function M697() {
  const root = useRef<HTMLDivElement>(null);
  const apply = (p: number) => {
    const el = root.current;
    if (!el) return;
    const grid = el.querySelector<HTMLElement>(".m697-grid");
    if (!grid) return;
    const H = el.clientHeight;
    const travel = grid.offsetHeight - H * 0.2;
    const ty = H * 0.12 - p * travel;
    grid.style.transform = `translate3d(0,${ty.toFixed(1)}px,0)`;
    el.querySelectorAll<HTMLElement>(".m697-cell").forEach((cell) => {
      const top = cell.offsetTop + ty;
      const ch = cell.offsetHeight;
      // shrink starts when the row's top passes 38% of the frame, ends as its bottom leaves the top edge
      const s = clamp01((H * 0.38 - top) / (H * 0.38 + ch));
      const pic = cell.firstElementChild as HTMLElement | null;
      if (pic) pic.style.transform = `scale(${(1 - smooth(s)).toFixed(4)})`;
    });
  };
  useScrub(root, apply, { finalValue: 0 });
  return (
    <Stage r={root} bg="#0b0a0c" g1="rgba(255,150,90,.5)" g2="rgba(110,160,255,.22)" top>
      <div className="m697-grid absolute inset-x-[5%] top-0 grid grid-cols-4 gap-[1.6%]" style={{ transform: "translate3d(0,12%,0)" }}>
        {Array.from({ length: M697_COLS * M697_ROWS }, (_, i) => {
          const corner = hash(i * 3.7) < 0.5 ? "0% 100%" : "100% 100%";
          return (
            <div key={i} className="m697-cell relative aspect-[16/10]">
              <div className="h-full w-full overflow-hidden rounded-[12px]" style={{ transformOrigin: corner }}>
                <Img i={(i * 3 + Math.floor(i / 4)) % 4} w={640} h={400} />
                <span className="absolute bottom-2 left-3 text-[12px] font-[600] uppercase tracking-[0.18em] text-white/85" style={{ fontFamily: GROTESK }}>
                  {M697_NAMES[i % 8]} · {String(i + 1).padStart(2, "0")}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between bg-gradient-to-b from-[#0b0a0c] via-[#0b0a0c]/70 to-transparent px-[5%] pb-10 pt-[2.4%]">
        <h3 className="text-[clamp(34px,3.6vw,58px)] leading-none" style={{ fontFamily: EDITORIAL }}>
          Field archive, <span className="italic">vol. 3</span>
        </h3>
        <p className="mt-2 text-[13px] uppercase tracking-[0.24em] text-white/60" style={{ fontFamily: GROTESK }}>
          32 prints · from ₹2,200
        </p>
      </div>
    </Stage>
  );
}

/* ---------- M698 · Book-spine columns with flaps (variant of M2) ---------- */
const M698_COLS = 5;
const M698_ITEMS = 7;
const M698_TITLES = ["Salt & Stone", "The Long Field", "Night Ferries", "Paper Moons", "Quiet Hours", "Low Tide", "Inland", "North Light"];
function M698() {
  const root = useRef<HTMLDivElement>(null);
  const apply = (p: number) => {
    const el = root.current;
    if (!el) return;
    const H = el.clientHeight;
    el.querySelectorAll<HTMLElement>(".m698-col").forEach((col, ci) => {
      const colH = col.offsetHeight;
      const off = ci % 2 ? H * 0.22 : 0;
      const ty = H * 0.55 + off - p * (colH + H * 0.1);
      // the spines turn from one side to the other across the panel, each column a little later
      const ry = lerp(58, -58, clamp01(p * 1.25 - ci * 0.0625));
      col.style.transform = `translate3d(0,${ty.toFixed(1)}px,0) rotateY(${ry.toFixed(2)}deg)`;
      col.querySelectorAll<HTMLElement>(".m698-item").forEach((it) => {
        const top = it.offsetTop + ty;
        // flaps hang flat (rotationX −90) below the fold and flip down as they come up into view
        const q = clamp01((H * 1.02 - top) / (H * 0.42));
        it.style.transform = `rotateX(${(-90 * (1 - smooth(q))).toFixed(2)}deg)`;
        it.style.opacity = (0.25 + 0.75 * smooth(q)).toFixed(3);
      });
    });
  };
  useScrub(root, apply, { finalValue: 0.35 });
  return (
    <Stage r={root} bg="#0c0907" g1="rgba(255,190,110,.5)" g2="rgba(255,90,120,.2)" top>
      <div className="absolute inset-x-[4%] inset-y-0 flex justify-between" style={{ perspective: "1200px" }}>
        {Array.from({ length: M698_COLS }, (_, ci) => (
          <div key={ci} className="m698-col flex w-[17.5%] flex-col gap-[18px] self-start" style={{ transformStyle: "preserve-3d", transform: `translate3d(0,${ci % 2 ? 140 : 40}px,0)` }}>
            {Array.from({ length: M698_ITEMS }, (_, j) => {
              const k = ci * M698_ITEMS + j;
              return (
                <div key={j} className="m698-item origin-top overflow-hidden rounded-[10px] bg-[#1a1410] shadow-[0_16px_40px_rgba(0,0,0,.45)]" style={{ backfaceVisibility: "hidden" }}>
                  <div className="aspect-[3/4]">
                    <Img i={(k * 5 + j) % 4} w={420} h={560} />
                  </div>
                  <div className="flex items-baseline justify-between px-3 py-2 text-[13px]" style={{ fontFamily: MANROPE }}>
                    <span className="truncate text-white/85">{M698_TITLES[k % 8]}</span>
                    <span className="ml-2 shrink-0 text-white/55">₹{[499, 650, 720, 549, 899][k % 5]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute left-1/2 top-[6%] z-30 rounded-full border border-white/15 bg-[#0c0907]/70 px-5 py-2 text-[13px] uppercase tracking-[0.24em] text-white/80" style={{ fontFamily: GROTESK, transform: "translateX(-50%)" }}>
        Margin Books · the spring shelf
      </div>
    </Stage>
  );
}

/* ---------- M699 · Images stretch out of frames (+ Flip into the content page) ---------- */
const M699_ITEMS = [
  { t: "Kiln Room", s: "Stoneware, fired twice", pr: "₹3,600", i: 3 },
  { t: "Salt Flats", s: "Linen in raw white", pr: "₹5,400", i: 0 },
  { t: "Green Hour", s: "Hand-blown glass", pr: "₹2,900", i: 2 },
  { t: "Ember Lane", s: "Copper and oak", pr: "₹8,200", i: 1 },
  { t: "Tidewater", s: "Indigo-dyed cotton", pr: "₹4,100", i: 0 },
];
const M699_OPEN = 0.84;
function M699() {
  const root = useRef<HTMLDivElement>(null);
  const state = useRef({ open: -1, auto: -1 });
  const flip = useRef<typeof FlipT | null>(null);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let dead = false;
    loadPlugin("Flip").then((f) => {
      if (!dead) flip.current = f as typeof FlipT;
    });
    return () => {
      dead = true;
    };
  }, []);
  const open = (i: number) => {
    const el = root.current;
    const F = flip.current;
    if (!el || state.current.open === i) return;
    const img = el.querySelector<HTMLElement>(`.m699-img[data-i="${i}"]`);
    const page = el.querySelector<HTMLElement>(".m699-page");
    const big = el.querySelector<HTMLElement>(".m699-big");
    if (!img || !page || !big) return;
    if (state.current.open >= 0) {
      const prev = el.querySelector<HTMLElement>(`.m699-img[data-i="${state.current.open}"]`);
      if (prev) prev.style.visibility = "visible";
    }
    state.current.open = i;
    const it = M699_ITEMS[i];
    big.querySelector("img")?.setAttribute("src", scene(it.i, 1000, 700));
    const tt = page.querySelector(".m699-pt");
    const ts = page.querySelector(".m699-ps");
    if (tt) tt.textContent = it.t;
    if (ts) ts.textContent = `${it.s} · ${it.pr}`;
    el.querySelectorAll<HTMLElement>(".m699-img").forEach((m) => m.removeAttribute("data-flip-id"));
    img.dataset.flipId = "m699";
    const st = F?.getState(img);
    gsap.killTweensOf([page, big, ".m699-ptxt"]);
    gsap.set(page, { visibility: "visible", opacity: 1 });
    img.style.visibility = "hidden";
    if (F && st) F.from(st, { targets: big, duration: 0.8, ease: "power3.inOut", scale: true, absolute: true });
    gsap.fromTo(el.querySelectorAll(".m699-ptxt"), { yPercent: 110 }, { yPercent: 0, duration: 0.6, ease: "power3.out", stagger: 0.06, delay: 0.35 });
    gsap.fromTo(page.querySelector(".m699-veil"), { opacity: 0 }, { opacity: 1, duration: 0.5 });
  };
  const close = () => {
    const el = root.current;
    if (!el || state.current.open < 0) return;
    const page = el.querySelector<HTMLElement>(".m699-page");
    const i = state.current.open;
    state.current.open = -1;
    gsap.to(page, {
      opacity: 0,
      duration: 0.4,
      onComplete: () => {
        if (state.current.open < 0 && page) page.style.visibility = "hidden";
      },
    });
    const img = el.querySelector<HTMLElement>(`.m699-img[data-i="${i}"]`);
    if (img) img.style.visibility = "visible";
  };
  const apply = (p: number) => {
    const el = root.current;
    if (!el) return;
    const H = el.clientHeight;
    const list = el.querySelector<HTMLElement>(".m699-list");
    if (!list) return;
    const ty = H * 0.42 - p * (list.offsetHeight - H * 0.05);
    list.style.transform = `translate3d(0,${ty.toFixed(1)}px,0)`;
    let nearest = 0;
    let best = 1e9;
    el.querySelectorAll<HTMLElement>(".m699-row").forEach((row, i) => {
      const c = row.offsetTop + ty + row.offsetHeight / 2;
      const rel = (c - H / 2) / H;
      if (Math.abs(rel) < best) {
        best = Math.abs(rel);
        nearest = i;
      }
      // past the centre: the title slides up out of its mask, the image stretches and rises out of its frame
      const k = smooth(-rel / 0.5);
      const title = row.querySelector<HTMLElement>(".m699-title");
      const img = row.querySelector<HTMLElement>(".m699-img");
      if (title) title.style.transform = `translate3d(0,${(-112 * k).toFixed(2)}%,0)`;
      if (img) img.style.transform = `translate3d(0,${(-70 * k).toFixed(2)}%,0) scaleY(${(1 + 0.8 * k).toFixed(4)})`;
    });
    // auto "click" for filming: the fake pointer reaches the centred item, then Flip opens its page
    const ptr = el.querySelector<HTMLElement>(".m699-ptr");
    if (state.current.auto < 0 || p < M699_OPEN - 0.1) state.current.auto = nearest;
    const target = el.querySelector<HTMLElement>(`.m699-frame[data-i="${state.current.auto}"]`);
    if (ptr && target) {
      const R = el.getBoundingClientRect();
      const B = target.getBoundingClientRect();
      const e = smooth((p - (M699_OPEN - 0.1)) / 0.1);
      const x = lerp(R.width * 0.9, B.left - R.left + B.width * 0.5, e);
      const y = lerp(R.height * 0.9, B.top - R.top + B.height * 0.5, e);
      ptr.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${p >= M699_OPEN ? 0.75 : 1})`;
      ptr.style.opacity = p > M699_OPEN - 0.12 && p < 0.97 ? "1" : "0";
    }
    if (prefersReducedMotion()) return;
    if (p >= M699_OPEN && state.current.open < 0) open(state.current.auto);
    else if (p < M699_OPEN && state.current.open >= 0 && state.current.open === state.current.auto) close();
  };
  useScrub(root, apply, { finalValue: 0.2 });
  return (
    <Stage r={root} bg="#f1ece4" g1="rgba(255,170,110,.55)" g2="rgba(120,150,255,.25)" style={{ color: "#1d1813" }}>
      <div className="m699-list absolute inset-x-[7%] top-0" style={{ transform: "translate3d(0,40%,0)" }}>
        {M699_ITEMS.map((it, i) => (
          <div key={i} className="m699-row flex items-center justify-between border-t border-[#1d1813]/15 py-[3.2%]">
            <div>
              <p className="text-[13px] uppercase tracking-[0.24em] text-[#1d1813]/55" style={{ fontFamily: GROTESK }}>
                No. {String(i + 1).padStart(2, "0")} · {it.pr}
              </p>
              <div className="mt-2 overflow-hidden">
                <h3 className="m699-title text-[clamp(44px,4.8vw,80px)] leading-[1.02]" style={{ fontFamily: SERIF, fontWeight: 500, letterSpacing: "-0.02em" }}>
                  {it.t}
                </h3>
              </div>
            </div>
            <button type="button" data-i={i} className="m699-frame relative aspect-[16/10] w-[38%] cursor-pointer overflow-hidden rounded-[14px] bg-[#d8d0c4]" onClick={() => open(i)} data-cursor="Open" aria-label={`Open ${it.t}`}>
              <div data-i={i} className="m699-img absolute inset-0 origin-bottom">
                <Img i={it.i} w={1000} h={700} />
              </div>
            </button>
          </div>
        ))}
      </div>
      {/* the content page the image Flips into */}
      <div className="m699-page absolute inset-0 z-20" style={{ visibility: "hidden" }} onClick={close}>
        <div className="m699-veil absolute inset-0 bg-[#f1ece4]" />
        <div className="relative flex h-full items-center gap-[5%] p-[4%]">
          <div className="m699-big h-full w-[56%] overflow-hidden rounded-[18px]" data-flip-id="m699">
            <Img i={0} w={1000} h={700} />
          </div>
          <div className="w-[38%]">
            <div className="overflow-hidden">
              <p className="m699-ptxt text-[13px] uppercase tracking-[0.24em] text-[#1d1813]/55" style={{ fontFamily: GROTESK }}>
                Hearth & Hand · the collection
              </p>
            </div>
            <div className="mt-3 overflow-hidden">
              <h3 className="m699-ptxt m699-pt text-[clamp(48px,5vw,84px)] leading-none" style={{ fontFamily: SERIF, fontWeight: 500 }}>
                Kiln Room
              </h3>
            </div>
            <div className="mt-4 overflow-hidden">
              <p className="m699-ptxt m699-ps text-[17px] text-[#1d1813]/70" style={{ fontFamily: MANROPE }}>
                Stoneware, fired twice · ₹3,600
              </p>
            </div>
            <div className="mt-6 overflow-hidden">
              <span className="m699-ptxt inline-block rounded-full bg-[#1d1813] px-6 py-3 text-[14px] font-[600] text-[#f1ece4]" style={{ fontFamily: MANROPE }}>
                Add to bag
              </span>
            </div>
          </div>
        </div>
      </div>
      <span className="m699-ptr pointer-events-none absolute left-0 top-0 z-30 -ml-[10px] -mt-[10px] h-[20px] w-[20px] rounded-full border-2 border-[#1d1813] bg-[#1d1813]/20" style={{ opacity: 0 }} aria-hidden />
    </Stage>
  );
}

/* ---------- M700 · Reflection floor scroll ---------- */
const M700_FLOOR = 0.6; // floor line (fraction of the frame height)
const M700_ITEMS: { kind: "word" | "pic"; t: string; i?: number }[] = [
  { kind: "word", t: "Still water" },
  { kind: "pic", t: "Lake house · ₹42,000 / night", i: 0 },
  { kind: "word", t: "Slow light" },
  { kind: "pic", t: "Cedar sauna · ₹6,500", i: 3 },
  { kind: "word", t: "Deep rest" },
  { kind: "pic", t: "Boat at dawn · ₹3,200", i: 2 },
  { kind: "word", t: "Stay longer" },
];
const M700_GAP = 0.46; // spacing between items (fraction of the top half)
function m700Place(i: number, p: number) {
  const N = M700_ITEMS.length;
  // bottom offset (fraction of the upper half): rises linearly over the whole panel from the floor
  const yb = 0.3 + p * (N * M700_GAP + 0.7) - i * M700_GAP;
  const k = smooth(yb / 1);
  return {
    bottom: `${(yb * 100).toFixed(2)}%`,
    transform: `translate3d(-50%,0,${(-420 * k).toFixed(1)}px) rotateX(${(70 * k).toFixed(2)}deg)`,
    opacity: (clamp01((1.05 - yb) / 0.25) * clamp01((yb + 0.15) / 0.15)).toFixed(3),
  };
}
function M700Items() {
  return (
    <>
      {M700_ITEMS.map((it, i) => {
        const st = m700Place(i, 0);
        return (
          <div key={i} className="m700-it absolute left-1/2 origin-bottom" style={{ bottom: st.bottom, transform: st.transform, opacity: Number(st.opacity) }}>
            {it.kind === "word" ? (
              <p className="whitespace-nowrap text-center leading-none text-[#eef3ff]" style={{ fontFamily: WIDE, fontWeight: 800, fontSize: "clamp(56px,6vw,100px)", letterSpacing: "-0.01em" }}>
                {it.t}
              </p>
            ) : (
              <div className="w-[min(34vw,460px)]">
                <div className="aspect-[16/9] overflow-hidden rounded-[14px] shadow-[0_20px_50px_rgba(0,0,0,.5)]">
                  <Img i={it.i ?? 0} w={800} h={450} />
                </div>
                <p className="mt-2 text-center text-[14px] text-white/75" style={{ fontFamily: MANROPE }}>
                  {it.t}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
function M700() {
  const root = useRef<HTMLDivElement>(null);
  const apply = (p: number) => {
    const el = root.current;
    if (!el) return;
    // the same transforms go to the real items and to their mirrored copies under the floor
    el.querySelectorAll<HTMLElement>(".m700-half").forEach((half) => {
      half.querySelectorAll<HTMLElement>(".m700-it").forEach((it, i) => {
        const st = m700Place(i, p);
        it.style.bottom = st.bottom;
        it.style.transform = st.transform;
        it.style.opacity = st.opacity;
      });
    });
  };
  useScrub(root, apply, { finalValue: 0 });
  const half = { height: `${M700_FLOOR * 100}%`, perspective: "900px", perspectiveOrigin: "50% 100%" } as CSSProperties;
  return (
    <Stage r={root} bg="#05070d" g1="rgba(90,140,255,.5)" g2="rgba(140,230,255,.22)" top>
      <div className="m700-half absolute inset-x-0 top-0 overflow-hidden" style={half}>
        <M700Items />
      </div>
      {/* mirrored copy: flipped about the floor line, fading into the dark */}
      <div
        className="m700-half pointer-events-none absolute inset-x-0 overflow-hidden opacity-[.32]"
        style={{ ...half, top: `${M700_FLOOR * 100}%`, transform: "scaleY(-1)", WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,.9) 60%, transparent 100%)", maskImage: "linear-gradient(to top, rgba(0,0,0,.9) 60%, transparent 100%)" }}
        aria-hidden
      >
        <M700Items />
      </div>
      <div className="pointer-events-none absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" style={{ top: `${M700_FLOOR * 100}%` }} aria-hidden />
      <p className="absolute left-[5%] top-[6%] z-20 text-[13px] uppercase tracking-[0.26em] text-white/55" style={{ fontFamily: GROTESK }}>
        Lakeside retreat · Halvard Lodge
      </p>
    </Stage>
  );
}

/* ---------- M701 · Image helix (variant of M33) ---------- */
const M701_N = 18;
const M701_TURN = 6; // items per turn
function M701() {
  const root = useRef<HTMLDivElement>(null);
  const st = useRef({ p: 0, drift: 0 });
  const place = () => {
    const el = root.current;
    if (!el) return;
    const W = el.clientWidth;
    const H = el.clientHeight;
    const R = Math.min(W * 0.26, 360);
    const dy = H * 0.085;
    const adv = st.current.p * M701_N * 0.7 + st.current.drift;
    el.querySelectorAll<HTMLElement>(".m701-card").forEach((c, i) => {
      const u = mod(i - adv, M701_N) - M701_N / 2;
      const th = (u / M701_TURN) * Math.PI * 2;
      const x = Math.sin(th) * R;
      const z = Math.cos(th) * R;
      const y = u * dy;
      const near = (z + R) / (2 * R);
      const ends = clamp01((M701_N / 2 - Math.abs(u)) / 2.2);
      c.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,${z.toFixed(1)}px) translate(-50%,-50%) rotateY(${((th * 180) / Math.PI).toFixed(2)}deg)`;
      c.style.opacity = ((0.12 + 0.88 * near * near) * ends).toFixed(3);
      c.style.zIndex = String(Math.round(near * 100));
    });
  };
  useScrub(
    root,
    (p) => {
      st.current.p = p;
      place();
    },
    { finalValue: 0.3 },
  );
  useTicker(root, (_t, dt) => {
    st.current.drift += Math.min(dt, 0.05) * 0.35; // keeps turning slowly when the scroll stops
    place();
  });
  useEffect(() => place(), []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Stage r={root} bg="#07080e" g1="rgba(150,120,255,.5)" g2="rgba(90,220,255,.22)" top>
      <div className="absolute inset-0" style={{ perspective: "1300px" }}>
        <div className="absolute left-1/2 top-1/2" style={{ transformStyle: "preserve-3d", transform: "rotateX(-8deg) rotateZ(-6deg)" }}>
          {Array.from({ length: M701_N }, (_, i) => (
            <div key={i} className="m701-card absolute left-0 top-0 h-[150px] w-[230px] overflow-hidden rounded-[12px] shadow-[0_14px_36px_rgba(0,0,0,.5)]" style={{ transform: `translate3d(${(i - 9) * 40}px,0,0) translate(-50%,-50%)`, opacity: i > 6 && i < 12 ? 1 : 0 }}>
              <Img i={i % 4} w={460} h={300} />
            </div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-[7%] left-[5%] z-[60]">
        <p className="text-[13px] uppercase tracking-[0.26em] text-white/55" style={{ fontFamily: GROTESK }}>
          Orbit Studio · 18 frames
        </p>
        <h3 className="mt-2 text-[clamp(40px,4.2vw,68px)] leading-none" style={{ fontFamily: EDITORIAL }}>
          A spiral of <span className="italic">small films</span>
        </h3>
      </div>
    </Stage>
  );
}

/* ---------- M702 · Smoke distortion by scroll speed (variant of M68, WebGL) ---------- */
const M702_FRAG = /* glsl */ `
uniform float uShift, uStr;
float h21(vec2 p) { p = fract(p * vec2(233.34, 851.73)); p += dot(p, p + 23.45); return fract(p.x * p.y); }
float vn(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { s += a * vn(p); p = p * 2.03 + 0.17; a *= 0.5; }
  return s;
}
vec3 strip(vec2 frameUv) {
  // 4 images stacked top to bottom in one texture; frameUv.y = 0 at the top of the frame
  float sy = fract((frameUv.y + uShift) / 4.0);
  return texture2D(uTex0, vec2(clamp(frameUv.x, 0.001, 0.999), 1.0 - sy)).rgb;
}
void main() {
  vec2 uv = vUv;
  vec2 f = vec2(uv.x, 1.0 - uv.y);
  float t = uTime;
  vec2 q = vec2(uv.x * uRes.x / uRes.y, uv.y);
  vec2 n = vec2(fbm(q * 2.6 + vec2(0.0, t * 0.35)), fbm(q * 2.6 + vec2(5.2, 1.3) - vec2(t * 0.3, 0.0)));
  float s = clamp(uStr, 0.0, 1.0);
  vec2 d = (n - 0.5) * (0.012 + s * 0.22);
  vec3 col;
  col.r = strip(f + d * 1.08).r;
  col.g = strip(f + d).g;
  col.b = strip(f + d * 0.92).b;
  // vapour: soft noise smoke rises over the image and eats it as the speed grows
  float smoke = fbm(q * 3.4 + n * 1.6 + vec2(0.0, -t * 0.5));
  float eat = smoothstep(0.62 - s * 0.42, 0.95 - s * 0.3, smoke + s * 0.15);
  vec3 vapour = vec3(0.86, 0.9, 0.98) * (0.55 + 0.45 * smoke);
  col = mix(col, vapour, eat * (0.12 + s * 0.75));
  col = mix(col, vec3(0.02, 0.025, 0.04), eat * s * 0.35);
  gl_FragColor = vec4(col, 1.0);
}`;
const M702_PICS = [
  { i: 0, t: "Glacier", c: "Merino base layer · ₹6,400" },
  { i: 3, t: "Ridge", c: "Down shell · ₹18,900" },
  { i: 2, t: "Pine", c: "Trail pack · ₹9,200" },
  { i: 1, t: "Ember", c: "Camp stove · ₹4,750" },
];
function M702() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const live = useRef({ p: 0, v: 0, str: 0 });
  useNearGL(root, async () => {
    const c = cv.current;
    if (!c) return null;
    const tex = await paint(960, 1920, async (x, img) => {
      for (let k = 0; k < 4; k++) {
        const im = await img(M702_PICS[k].i, 960, 480);
        x.drawImage(im, 0, k * 480, 960, 480);
      }
    });
    return createShader(c, M702_FRAG, {
      textures: [tex],
      dpr: 1,
      uniforms: { uShift: { value: 0 }, uStr: { value: 0 } },
      onFrame: (u) => {
        const L = live.current;
        // strength follows scroll speed, smoothed; it decays back when the scroll stops
        L.v *= 0.94;
        const target = Math.min(1, Math.abs(L.v) * 2.4 + Math.abs(u.uVel.value as number) * 0.8);
        L.str += (target - L.str) * 0.08;
        u.uShift.value = L.p * 3;
        u.uStr.value = L.str;
      },
    });
  });
  useScrub(
    root,
    (p, v) => {
      live.current.p = p;
      if (Math.abs(v) > Math.abs(live.current.v)) live.current.v = v;
      const el = root.current;
      const s = el?.querySelector<HTMLElement>(".m702-strip");
      if (s) s.style.transform = `translate3d(0,${(-p * 75).toFixed(3)}%,0)`;
      const cap = el?.querySelector<HTMLElement>(".m702-cap");
      const idx = Math.min(3, Math.floor(p * 3 + 0.5));
      if (cap && cap.dataset.k !== String(idx)) {
        cap.dataset.k = String(idx);
        cap.textContent = M702_PICS[idx].c;
      }
    },
    { finalValue: 0 },
  );
  return (
    <Stage r={root} bg="#06080d" g1="rgba(170,200,255,.5)" g2="rgba(255,255,255,.18)" top>
      {/* fallback (static / no WebGL): the same strip as plain images */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="m702-strip absolute inset-x-0 top-0 h-[400%]">
          {M702_PICS.map((pic) => (
            <div key={pic.t} className="h-1/4">
              <Img i={pic.i} w={960} h={480} />
            </div>
          ))}
        </div>
      </div>
      <canvas ref={cv} className="pointer-events-none absolute inset-0 h-full w-full" style={{ opacity: 0, transition: "opacity .4s" }} aria-hidden />
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
      <div className="pointer-events-none absolute bottom-[8%] left-[5%] z-20">
        <p className="text-[13px] uppercase tracking-[0.26em] text-white/65" style={{ fontFamily: GROTESK }}>
          Altitude outfitters · winter 26
        </p>
        <h3 className="mt-2 text-[clamp(44px,4.8vw,80px)] leading-none" style={{ fontFamily: WIDE, fontWeight: 800 }}>
          Into thin air
        </h3>
        <p className="m702-cap mt-3 text-[15px] text-white/75" style={{ fontFamily: MANROPE }} data-k="0">
          {M702_PICS[0].c}
        </p>
      </div>
      <p className="pointer-events-none absolute right-[5%] top-[7%] z-20 text-[13px] uppercase tracking-[0.22em] text-white/60" style={{ fontFamily: GROTESK }}>
        Scroll faster · it turns to vapour
      </p>
    </Stage>
  );
}

/* ---------- M703 · Refracting crystal over headline (variant of M604, WebGL) ---------- */
const M703_FRAG = /* glsl */ `
uniform float uRot;
vec3 bg(vec2 uv) { return texture2D(uTex0, cover(clamp(uv, 0.0, 1.0), uTexRes0)).rgb; }
void main() {
  vec2 uv = vUv;
  float asp = uRes.x / uRes.y;
  vec2 p = (uv - vec2(0.5, 0.5)) * vec2(asp, 1.0);
  float rot = uRot;
  // fake turn about Y: the crystal narrows as it turns edge-on
  float squash = 0.55 + 0.45 * abs(cos(rot));
  vec2 q = p / vec2(squash, 1.0);
  float tilt = 0.18 * sin(rot * 0.5);
  q = mat2(cos(tilt), -sin(tilt), sin(tilt), cos(tilt)) * q;
  float R = 0.33;
  float seg = 6.2831853 / 6.0;
  float a = atan(q.y, q.x) + rot;
  float aa = mod(a, seg) - seg * 0.5;
  float r = length(q);
  float rad = r * cos(aa);              // distance to the hexagon edge direction
  float edge = R * cos(seg * 0.5);
  float inside = 1.0 - smoothstep(edge - 0.003, edge + 0.003, rad);
  vec3 base = bg(uv);
  if (inside <= 0.0) {
    // soft caustic glow and shadow around the crystal
    float g = exp(-pow(max(rad - edge, 0.0) * 9.0, 2.0));
    gl_FragColor = vec4(base * (0.9 + 0.1 * g) + vec3(0.25, 0.3, 0.5) * g * 0.25, 1.0);
    return;
  }
  float id = floor(a / seg);
  float inner = step(rad, edge * 0.48);
  float ac = (id + 0.5) * seg - rot;
  vec2 nrm = vec2(cos(ac), sin(ac)) * mix(0.9, 0.2, inner);
  nrm += vec2(sin(rot) * 0.35, cos(rot * 0.7) * 0.15) * inner;
  nrm.x *= squash;
  vec2 off = -nrm * 0.075;
  vec3 col;
  col.r = bg(uv + off * 0.85).r;
  col.g = bg(uv + off * 1.0).g;
  col.b = bg(uv + off * 1.2).b;
  // facet light + lines on the facet borders
  vec3 L = normalize(vec3(cos(rot * 1.3), 0.6, 1.0));
  float spec = pow(max(dot(normalize(vec3(nrm, 1.0)), L), 0.0), 18.0);
  float ring = 1.0 - smoothstep(0.0, 0.004, abs(rad - edge * 0.48));
  float rim = 1.0 - smoothstep(0.0, 0.006, edge - rad);
  col = col * vec3(0.92, 0.96, 1.05) + spec * 0.55 + (ring * 0.35 + rim * 0.6) * vec3(0.85, 0.92, 1.0);
  float spoke = 1.0 - smoothstep(0.0, 0.005, abs(abs(aa) - seg * 0.5) * r);
  col += spoke * 0.35;
  gl_FragColor = vec4(mix(base, col, inside), 1.0);
}`;
function M703() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const live = useRef({ p: 0 });
  useNearGL(root, async () => {
    const c = cv.current;
    const el = root.current;
    if (!c || !el) return null;
    await (document.fonts?.ready ?? Promise.resolve());
    const W = Math.min(1400, Math.max(600, Math.round(el.clientWidth)));
    const H = Math.round((W * el.clientHeight) / Math.max(1, el.clientWidth));
    const tex = await paint(W, H, (x) => {
      const g = x.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, "#0a0812");
      g.addColorStop(1, "#120a1c");
      x.fillStyle = g;
      x.fillRect(0, 0, W, H);
      // faint grid so the refraction reads everywhere
      x.strokeStyle = "rgba(255,255,255,.06)";
      x.lineWidth = 1;
      for (let gx = 0; gx < W; gx += 48) {
        x.beginPath();
        x.moveTo(gx + 0.5, 0);
        x.lineTo(gx + 0.5, H);
        x.stroke();
      }
      for (let gy = 0; gy < H; gy += 48) {
        x.beginPath();
        x.moveTo(0, gy + 0.5);
        x.lineTo(W, gy + 0.5);
        x.stroke();
      }
      const fs = Math.round(W * 0.155);
      x.textAlign = "center";
      x.textBaseline = "middle";
      x.font = `500 ${fs}px ${SERIF}`;
      const tg = x.createLinearGradient(W * 0.2, 0, W * 0.8, 0);
      tg.addColorStop(0, "#ffd3a8");
      tg.addColorStop(0.5, "#ffffff");
      tg.addColorStop(1, "#b9c8ff");
      x.fillStyle = tg;
      x.fillText("Clarity", W / 2, H * 0.5);
      x.font = `600 ${Math.round(W * 0.0105)}px ${GROTESK}`;
      x.fillStyle = "rgba(255,255,255,.6)";
      x.fillText("PRISMA OPTICS  ·  HAND-POLISHED LENSES", W / 2, H * 0.16);
      x.font = `400 ${Math.round(W * 0.012)}px ${MANROPE}`;
      x.fillText("Frames from ₹12,500", W / 2, H * 0.84);
    });
    return createShader(c, M703_FRAG, {
      textures: [tex],
      dpr: 1,
      uniforms: { uRot: { value: 0 } },
      onFrame: (u, t) => {
        // scroll turns the crystal (one full turn over the panel) + a slow idle spin so it never stops
        u.uRot.value = live.current.p * Math.PI * 2 + t * 0.12;
      },
    });
  });
  useScrub(
    root,
    (p) => {
      live.current.p = p;
    },
    { finalValue: 0 },
  );
  return (
    <Stage r={root} bg="#0b0814" g1="rgba(190,160,255,.5)" g2="rgba(255,200,150,.22)" top>
      {/* fallback (static / no WebGL): the headline as HTML with a soft crystal outline */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center" style={{ background: "linear-gradient(135deg,#0a0812,#120a1c)" }}>
        <p className="text-[13px] uppercase tracking-[0.3em] text-white/60" style={{ fontFamily: GROTESK }}>
          Prisma Optics · hand-polished lenses
        </p>
        <h3 className="mt-6 bg-[linear-gradient(90deg,#ffd3a8,#ffffff,#b9c8ff)] bg-clip-text leading-none text-transparent" style={{ fontFamily: SERIF, fontWeight: 500, fontSize: "clamp(120px,15vw,220px)" }}>
          Clarity
        </h3>
        <p className="mt-6 text-[15px] text-white/60" style={{ fontFamily: MANROPE }}>
          Frames from ₹12,500
        </p>
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[66%] aspect-square border border-white/25 bg-white/[.04]" style={{ clipPath: "polygon(25% 6%,75% 6%,100% 50%,75% 94%,25% 94%,0 50%)", transform: "translate(-50%,-50%)" }} aria-hidden />
      </div>
      <canvas ref={cv} className="pointer-events-none absolute inset-0 h-full w-full" style={{ opacity: 0, transition: "opacity .4s" }} aria-hidden />
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M697", name: "Grid images shrink to random corners", how: "Scroll: as grid rows leave the top, each image scales to 0 toward a random bottom corner", kind: "scrub", C: M697 },
  { code: "M698", name: "Book-spine columns with flaps", how: "Scroll: columns turn on Y in perspective like book spines while their cards flip down from rotationX −90", kind: "scrub", C: M698 },
  { code: "M699", name: "Images stretch out of frames", how: "Scroll: titles slide up and images stretch (scaleY 1.8) up out of their frames; a click (auto near the end) Flips one into its page", kind: "scrub", C: M699 },
  { code: "M700", name: "Reflection floor scroll", how: "Scroll: words and photos rise off a mirrored floor, tilting back on X to 70° and receding in depth, their reflections following", kind: "scrub", C: M700 },
  { code: "M701", name: "Image helix", how: "Scroll (and a slow idle drift): images ride a 3D helix that screws forward; near ones large, far ones faded", kind: "scrub", C: M701 },
  { code: "M702", name: "Smoke distortion by scroll speed", how: "Scroll: a photo strip is warped by smoke noise whose strength follows scroll speed, dissolving into vapour when fast · WebGL", kind: "scrub", C: M702 },
  { code: "M703", name: "Refracting crystal over headline", how: "Scroll: a faceted crystal refracts the headline behind it with chromatic dispersion and turns as you scroll · WebGL", kind: "scrub", C: M703 },
];
