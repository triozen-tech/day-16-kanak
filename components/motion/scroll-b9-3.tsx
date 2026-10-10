"use client";

// MOTION-MENU M434–M445 (scroll group, batch 9 · part 3): small focused demos for /lab/motion.
// Every demo is a "scrub": the panel's scroll progress (useScrub, 0..1 over the whole 220vh panel) is mapped LINEARLY onto a
// paused timeline or onto styles set directly, so nothing finishes early and the last frame is never an empty stage.
// Every demo also has a CSS-only glow loop (and an on-top glow where images cover the stage), so a still scroll never freezes.
// ?static=1 / reduced motion: no animation, a sensible final state (useScrub reports its finalValue once).
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, loadPlugin, prefersReducedMotion } from "@/lib/gsap";
import { scene, useScrub, useTicker } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const GROTESK = "'Space Grotesk Variable', system-ui, sans-serif";
const SERIF = "'Fraunces Variable', Georgia, serif";
const EDITORIAL = "'Instrument Serif', Georgia, serif";
const WIDE = "'Syne Variable', 'Space Grotesk Variable', system-ui, sans-serif";
const MANROPE = "'Manrope Variable', system-ui, sans-serif";
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

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

/** On-top glow for stages that images cover (rule 13): screen-blended, never catches the pointer. */
const TopGlow = ({ code, color, at = "60% 55%" }: { code: string; color: string; at?: string }) => (
  <Glow code={`${code}t`} color={color} at={at} className="z-20 opacity-[.45] mix-blend-screen" />
);

/**
 * Scrub: a paused timeline built once (after fonts, and after `need` such as a lazy plugin); scroll progress
 * (0..1 over the whole panel) drives tl.progress linearly.
 */
function useScrubTl(root: RefObject<HTMLDivElement | null>, build: (tl: gsap.core.Timeline, el: HTMLDivElement) => void, need?: () => Promise<unknown>) {
  const tl = useRef<gsap.core.Timeline | null>(null);
  const pr = useRef(0);
  const fn = useRef(build);
  fn.current = build;
  const needRef = useRef(need);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let dead = false;
    const ctx = gsap.context(() => {}, el);
    Promise.all([document.fonts?.ready, needRef.current?.()]).then(() => {
      if (dead) return;
      ctx.add(() => {
        const t = gsap.timeline({ paused: true, defaults: { ease: "none" } });
        fn.current(t, el);
        tl.current = t;
        t.progress(pr.current);
      });
    });
    return () => {
      dead = true;
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
const Img = ({ i, className = "", style, label = "", w = 1400, h = 900 }: { i: number; className?: string; style?: CSSProperties; label?: string; w?: number; h?: number }) => (
  <img src={scene(i, w, h, label)} alt="" className={`h-full w-full object-cover ${className}`} style={style} draggable={false} />
);

const Frame = ({ r, bg, children }: { r: RefObject<HTMLDivElement | null>; bg: string; children: ReactNode }) => (
  <div ref={r} className="relative h-full w-full overflow-hidden rounded-[24px]" style={{ background: bg }}>
    {children}
  </div>
);

const all = (root: Element, sel: string) => [...root.querySelectorAll<HTMLElement>(sel)];

/* ---------- M434 · Elastic column lag (variant of M7: each column chases the scroll with its own smoothing) ---------- */
const M434_ITEMS: [string, string][] = [
  ["Clay mug", "₹890"],
  ["Linen napkin", "₹450"],
  ["Oak board", "₹2,100"],
  ["Brass spoon", "₹620"],
  ["Stone bowl", "₹1,350"],
  ["Glass carafe", "₹1,780"],
  ["Cotton apron", "₹1,190"],
  ["Ash tray set", "₹740"],
];
const M434_LAG = [16, 9, 5.5, 3.4]; // per-column follow speed (higher = tighter)
function M434() {
  const root = useRef<HTMLDivElement>(null);
  const target = useRef(0);
  const cur = useRef<number[]>([0, 0, 0, 0]);
  const write = () => {
    const el = root.current;
    if (!el) return;
    all(el, ".m434-col").forEach((c, i) => (c.style.transform = `translate3d(0,${cur.current[i].toFixed(1)}px,0)`));
  };
  useScrub(
    root,
    (p) => {
      const el = root.current;
      const col = el?.querySelector<HTMLElement>(".m434-col");
      if (!el || !col) return;
      // the whole grid travels linearly: first row at the top at 0, last row at the bottom at 1
      target.current = -p * Math.max(0, col.scrollHeight - el.clientHeight);
      if (prefersReducedMotion()) {
        cur.current = cur.current.map(() => target.current);
        write();
      }
    },
    { finalValue: 0.45 },
  );
  useTicker(root, (_t, dt) => {
    const d = Math.min(dt, 0.05);
    cur.current = cur.current.map((v, i) => v + (target.current - v) * (1 - Math.exp(-d * M434_LAG[i])));
    write();
  });
  return (
    <Frame r={root} bg="#0f0d0b">
      <Glow code="m434" color="rgba(224,145,63,.42)" />
      <div className="absolute inset-x-[4%] top-0 grid grid-cols-4 gap-[1.4vw]">
        {[0, 1, 2, 3].map((c) => (
          <div key={c} className="m434-col flex flex-col gap-[1.4vw] pt-[3vh] will-change-transform">
            {M434_ITEMS.map((_, k) => (
              <figure key={k} className="relative h-[34vh] overflow-hidden rounded-[16px] border border-white/10">
                <Img i={(k + c) % 4} w={600} h={760} />
                <figcaption className="absolute bottom-3 left-3 right-3 flex justify-between text-[13px] font-[600] text-white/90" style={{ fontFamily: GROTESK }}>
                  <span>{M434_ITEMS[(k + c * 3) % 8][0]}</span>
                  <span className="text-white/70">{M434_ITEMS[(k + c * 3) % 8][1]}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        ))}
      </div>
      <TopGlow code="m434" color="rgba(255,190,120,.35)" />
      <p className="pointer-events-none absolute bottom-4 left-5 z-30 rounded-full bg-black/55 px-3 py-1 text-[13px] uppercase tracking-[0.2em] text-white/80">Hearth &amp; Table · kitchen goods</p>
    </Frame>
  );
}

/* ---------- M435 · Columns stagger speeds (variant of M32: same direction, faster per column, images drift inside) ---------- */
const M435_NAMES = ["Atlas tee", "Drift shorts", "Pace cap", "Tempo socks", "Stride vest", "Loop hoodie", "Ridge pants", "Bolt jacket"];
const M435_PRICES = ["₹1,290", "₹1,690", "₹790", "₹390", "₹2,490", "₹3,290", "₹2,790", "₹5,490"];
function M435() {
  const root = useRef<HTMLDivElement>(null);
  const apply = (p: number) => {
    const el = root.current;
    if (!el) return;
    const cols = all(el, ".m435-col");
    if (!cols.length) return;
    const H = el.clientHeight;
    const CH = cols[0].scrollHeight;
    const extra = 0.1 * (cols.length - 1); // the fastest column's extra yPercent
    const base = Math.max(0, Math.min(CH * 0.4, CH - H - CH * extra));
    cols.forEach((c, i) => {
      // shared travel + yPercent −10×index, all linear with progress
      c.style.transform = `translate3d(0,${(-p * (base + CH * 0.1 * i)).toFixed(1)}px,0)`;
    });
    const shift = lerp(-30, 30, p);
    all(el, ".m435-img").forEach((im) => (im.style.transform = `translate3d(0,${shift.toFixed(1)}px,0) scale(1.18)`));
  };
  useScrub(root, apply, { finalValue: 0.5 });
  return (
    <Frame r={root} bg="#0a0f14">
      <Glow code="m435" color="rgba(47,140,255,.42)" />
      <div className="absolute inset-x-[5%] top-0 grid grid-cols-3 gap-[1.6vw]">
        {[0, 1, 2].map((c) => (
          <div key={c} className="m435-col flex flex-col gap-[1.6vw] pt-[4vh] will-change-transform">
            {M435_NAMES.map((n, k) => {
              const j = (k + c * 3) % M435_NAMES.length;
              return (
                <figure key={k} className="relative h-[32vh] overflow-hidden rounded-[12px]">
                  <Img i={(k + c) % 4} w={760} h={560} className="m435-img will-change-transform" style={{ transform: "scale(1.18)" }} />
                  <figcaption className="absolute bottom-3 left-3 right-3 flex justify-between text-[13px] font-[600] text-white" style={{ fontFamily: MANROPE }}>
                    <span>{M435_NAMES[j]}</span>
                    <span className="text-white/75">{M435_PRICES[j]}</span>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        ))}
      </div>
      <TopGlow code="m435" color="rgba(140,200,255,.32)" />
      <p className="pointer-events-none absolute bottom-4 left-5 z-30 rounded-full bg-black/55 px-3 py-1 text-[13px] uppercase tracking-[0.2em] text-white/80">Northpace · running kit</p>
    </Frame>
  );
}

/* ---------- M436 · Pinned Flip between layouts (variant of M54: scattered → grid, images scale 2 → 1 inside) ---------- */
type FlipT = Awaited<ReturnType<typeof loadPlugin<"Flip">>>;
let Flip436: FlipT | null = null;
const need436 = () =>
  loadPlugin("Flip").then((f) => {
    Flip436 = f;
  });
const M436_ROOMS = ["Hall", "Study", "Kitchen", "Garden", "Loft", "Bath"];
function M436() {
  const root = useRef<HTMLDivElement>(null);
  useScrubTl(
    root,
    (tl, el) => {
      const box = el.querySelector<HTMLElement>(".m436-box");
      const items = all(el, ".m436-item");
      if (!box || !Flip436) return;
      // record the scattered layout, return to the grid, and let Flip build the scattered → grid tween
      box.classList.add("m436-a");
      const state = Flip436.getState(items);
      box.classList.remove("m436-a");
      tl.add(Flip436.from(state, { duration: 0.86, ease: "none", scale: true }), 0)
        .fromTo(".m436-in", { scale: 2 }, { scale: 1, duration: 1 }, 0)
        .fromTo(".m436-title", { opacity: 1, y: 0 }, { opacity: 0.25, y: -24, duration: 0.5 }, 0.2)
        .fromTo(".m436-cap", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.14 }, 0.86);
    },
    need436,
  );
  const css = `.m436-a .m436-item{position:absolute;width:15%;aspect-ratio:1.55;height:auto}
.m436-a .m436-item:nth-child(1){left:-8%;top:-4%;transform:rotate(-9deg)}
.m436-a .m436-item:nth-child(2){left:30%;top:-14%;transform:rotate(6deg)}
.m436-a .m436-item:nth-child(3){left:84%;top:4%;transform:rotate(-5deg)}
.m436-a .m436-item:nth-child(4){left:-4%;top:78%;transform:rotate(7deg)}
.m436-a .m436-item:nth-child(5){left:48%;top:88%;transform:rotate(-7deg)}
.m436-a .m436-item:nth-child(6){left:90%;top:70%;transform:rotate(10deg)}`;
  return (
    <Frame r={root} bg="#0e0c12">
      <style>{css}</style>
      <Glow code="m436" color="rgba(190,140,255,.42)" />
      <div className="m436-title pointer-events-none absolute inset-0 grid place-items-center">
        <h3 className="text-[clamp(52px,6.4vw,104px)] leading-none text-[#f3eeff]" style={{ fontFamily: EDITORIAL }}>
          Six rooms, <span className="italic">one house.</span>
        </h3>
      </div>
      <div className="absolute inset-0 grid place-items-center">
        <div className="m436-box relative grid h-[70%] w-[min(80%,1060px)] grid-cols-3 grid-rows-2 gap-[1.2vw]">
          {M436_ROOMS.map((r, i) => (
            <figure key={r} className="m436-item relative h-full w-full overflow-hidden rounded-[14px] border border-white/10 will-change-transform">
              <div className="m436-in h-full w-full will-change-transform">
                <Img i={i % 4} w={700} h={450} />
              </div>
              <figcaption className="absolute bottom-2 left-3 text-[13px] font-[600] uppercase tracking-[0.16em] text-white/90" style={{ fontFamily: GROTESK }}>
                {String(i + 1).padStart(2, "0")} · {r}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
      <TopGlow code="m436" color="rgba(210,180,255,.3)" />
      <p className="m436-cap pointer-events-none absolute bottom-4 left-5 z-30 text-[14px] text-white/80" style={{ fontFamily: MANROPE }}>
        Larkspur House · weekend stays from ₹38,000
      </p>
    </Frame>
  );
}

/* ---------- M437 · Grid assembles from below (variant of M34: rise + random tilt from the top, frame shrinks and darkens) ---------- */
const M437_ROT = [-22, 14, -9, 26, 18, -27, 8, -15, 21, -12, 24, -19];
const M437_DROP = [1.5, 1.9, 1.6, 2.1, 1.8, 1.55, 2.0, 1.7, 1.65, 2.2, 1.75, 1.95];
function M437() {
  const root = useRef<HTMLDivElement>(null);
  useScrubTl(root, (tl, el) => {
    const H = el.clientHeight;
    tl.fromTo(".m437-title", { xPercent: 0, opacity: 1 }, { xPercent: -115, opacity: 0, duration: 0.35 }, 0);
    all(el, ".m437-tile").forEach((t, i) => {
      tl.fromTo(
        t,
        { y: H * M437_DROP[i], rotation: M437_ROT[i], transformOrigin: "50% 0%" },
        { y: 0, rotation: 0, duration: 0.42, ease: "none" },
        0.04 + i * 0.03,
      );
    });
    tl.fromTo(".m437-frame", { scale: 1 }, { scale: 0.86, duration: 0.42 }, 0.58)
      .fromTo(".m437-dark", { opacity: 0 }, { opacity: 0.45, duration: 0.42 }, 0.58)
      .fromTo(".m437-cap", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.2 }, 0.8);
  });
  return (
    <Frame r={root} bg="#0b120e">
      <Glow code="m437" color="rgba(24,196,143,.42)" />
      <h3
        className="m437-title pointer-events-none absolute left-[5%] top-[6%] z-10 text-[clamp(40px,4.6vw,76px)] font-[700] leading-none tracking-[-0.03em] text-[#eafff4] will-change-transform"
        style={{ fontFamily: WIDE }}
      >
        From the ground up.
      </h3>
      <div className="m437-frame absolute bottom-[5%] left-1/2 top-[20%] w-[min(84%,1100px)] -ml-[min(42%,550px)] overflow-hidden rounded-[18px] border border-white/10 bg-[#07100b] will-change-transform">
        <div className="grid h-full w-full grid-cols-4 grid-rows-3 gap-[0.8vw] p-[0.8vw]">
          {M437_ROT.map((_, i) => (
            <div key={i} className="m437-tile overflow-hidden rounded-[10px] will-change-transform">
              <Img i={(i + 2) % 4} w={520} h={340} />
            </div>
          ))}
        </div>
        <div className="m437-dark pointer-events-none absolute inset-0 bg-black opacity-0" />
        <div className="m437-cap pointer-events-none absolute inset-0 grid place-items-center text-center">
          <p className="text-[clamp(30px,3.2vw,52px)] leading-none text-white" style={{ fontFamily: EDITORIAL }}>
            Twelve plots. Pick yours.
            <span className="mt-3 block text-[15px] text-white/80" style={{ fontFamily: MANROPE }}>
              Greenfold Estates · from ₹42 lakh
            </span>
          </p>
        </div>
      </div>
      <TopGlow code="m437" color="rgba(140,255,200,.3)" />
    </Frame>
  );
}

/* ---------- M438 · 3D grid fly-in from depth (variant of M31: items arrive from random z and x into a flat grid) ---------- */
const M438_Z = [-2600, -1500, -2200, -1800, -1300, -2800, -1700, -2400, -2000, -1400, -2700, -1600];
const M438_X = [-380, 220, -140, 420, -300, 60, -440, 260, -90, 360, -220, 160];
const M438_NAMES = ["Tide", "Ember", "Moss", "Dusk", "Salt", "Fern", "Ash", "Clay", "Reed", "Slate", "Sage", "Wren"];
function M438() {
  const root = useRef<HTMLDivElement>(null);
  useScrubTl(root, (tl, el) => {
    all(el, ".m438-card").forEach((c, i) => {
      tl.fromTo(
        c,
        { z: M438_Z[i], x: M438_X[i], opacity: 0.15, filter: "brightness(0.3)" },
        { z: 0, x: 0, opacity: 1, filter: "brightness(1)", duration: 0.7 },
        i * 0.0275,
      );
    });
    tl.fromTo(".m438-grid", { rotationX: 14 }, { rotationX: 0, duration: 1 }, 0).fromTo(".m438-bg", { scale: 0.9, opacity: 0.9 }, { scale: 1.05, opacity: 0.35, duration: 1 }, 0);
  });
  return (
    <Frame r={root} bg="#0a0b14">
      <Glow code="m438" color="rgba(79,141,255,.42)" />
      <div className="m438-bg pointer-events-none absolute inset-0 grid place-items-center will-change-transform">
        <h3 className="text-[clamp(64px,8vw,132px)] font-[800] uppercase leading-none tracking-[-0.04em] text-white/90" style={{ fontFamily: WIDE }}>
          Depth
        </h3>
      </div>
      <div className="absolute inset-0 grid place-items-center" style={{ perspective: "1000px" }}>
        <div className="m438-grid grid h-[78%] w-[min(78%,1020px)] grid-cols-4 grid-rows-3 gap-[1vw] will-change-transform" style={{ transformStyle: "preserve-3d" }}>
          {M438_NAMES.map((n, i) => (
            <figure key={n} className="m438-card relative overflow-hidden rounded-[12px] border border-white/10 will-change-transform">
              <Img i={i % 4} w={520} h={340} />
              <figcaption className="absolute bottom-2 left-3 text-[12px] font-[600] uppercase tracking-[0.16em] text-white/90" style={{ fontFamily: GROTESK }}>
                {n} · ₹{(1290 + i * 210).toLocaleString("en-IN")}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
      <TopGlow code="m438" color="rgba(140,180,255,.3)" />
      <p className="pointer-events-none absolute bottom-4 left-5 z-30 text-[13px] uppercase tracking-[0.2em] text-white/70">Twelve candles · winter set</p>
    </Frame>
  );
}

/* ---------- M439 · Isometric grid drifts diagonally (scroll moves the plane; cards rise in Z on hover, auto-hover on a timer) ---------- */
const M439_N = 7;
const M439_CELL = 196;
const M439_GAP = 22;
function M439() {
  const root = useRef<HTMLDivElement>(null);
  const apply = (p: number) => {
    const plane = root.current?.querySelector<HTMLElement>(".m439-plane");
    if (!plane) return;
    // linear along the plane's own Y axis: on screen the grid drifts on the diagonal
    const y = lerp(380, -380, p);
    const x = lerp(-120, 120, p);
    plane.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
  };
  useScrub(root, apply, { finalValue: 0.5 });
  // auto-hover: one card after another rises while the demo is on screen (the real pointer still lifts cards via :hover)
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const cards = all(el, ".m439-card");
    const order = [24, 17, 31, 23, 16, 30, 25, 18, 32, 22, 15, 29];
    let k = 0;
    let id = 0;
    const step = () => {
      cards.forEach((c) => c.classList.remove("is-up"));
      cards[order[k % order.length]]?.classList.add("is-up");
      k++;
    };
    const io = new IntersectionObserver(([e]) => {
      window.clearInterval(id);
      if (e.isIntersecting) {
        step();
        id = window.setInterval(step, 620);
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearInterval(id);
      cards.forEach((c) => c.classList.remove("is-up"));
    };
  }, []);
  const S = M439_N * (M439_CELL + M439_GAP);
  const css = `.m439-lift{transform:translateZ(0);transition:transform .36s cubic-bezier(.3,.7,.3,1),box-shadow .36s}
.m439-card.is-up .m439-lift,.m439-card:hover .m439-lift{transform:translateZ(54px);box-shadow:-18px 18px 30px rgba(0,0,0,.55)}
.m439-card.is-up .m439-tag,.m439-card:hover .m439-tag{opacity:1}`;
  return (
    <Frame r={root} bg="#0d0f0c">
      <style>{css}</style>
      <Glow code="m439" color="rgba(200,255,138,.36)" />
      <div className="absolute left-1/2 top-1/2 h-0 w-0" style={{ transform: "rotateX(55deg) rotateZ(-45deg)", transformStyle: "preserve-3d" }}>
        <div className="m439-plane absolute will-change-transform" style={{ left: -S / 2, top: -S / 2, width: S, height: S, transformStyle: "preserve-3d" }}>
          <div className="grid" style={{ gridTemplateColumns: `repeat(${M439_N}, ${M439_CELL}px)`, gap: M439_GAP, transformStyle: "preserve-3d" }}>
            {Array.from({ length: M439_N * M439_N }, (_, i) => (
              <div key={i} className="m439-card relative" style={{ width: M439_CELL, height: M439_CELL, transformStyle: "preserve-3d" }}>
                <div className="absolute inset-0 rounded-[10px] bg-black/50" aria-hidden />
                <div className="m439-lift absolute inset-0 overflow-hidden rounded-[10px] border border-white/10">
                  <Img i={(i * 3) % 4} w={400} h={400} />
                  <span className="m439-tag absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[12px] font-[600] text-white opacity-0 transition-opacity" style={{ fontFamily: GROTESK }}>
                    ₹{(450 + (i % 9) * 120).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <TopGlow code="m439" color="rgba(220,255,170,.3)" />
      <div className="pointer-events-none absolute bottom-[6%] left-[5%] z-30">
        <p className="text-[clamp(30px,3.2vw,52px)] leading-none text-[#f1fff4]" style={{ fontFamily: SERIF, fontWeight: 500 }}>
          The tile library.
        </p>
        <p className="mt-2 text-[14px] text-white/75">Terrace Tileworks · 49 glazes</p>
      </div>
    </Frame>
  );
}

/* ---------- M440 · Image clip shape morphs on scroll (variant of M53: polygon → polygon, inner layers turn on Y, label types in) ---------- */
// three 8-point polygons in the same point order (TL, T, TR, R, BR, B, BL, L)
const M440_SHAPES = [
  [30, 10, 50, 10, 70, 10, 70, 50, 70, 90, 50, 90, 30, 90, 30, 50],
  [22, 22, 50, 3, 78, 22, 97, 50, 78, 78, 50, 97, 22, 78, 3, 50],
  [6, 12, 50, 4, 94, 12, 97, 50, 94, 88, 50, 96, 6, 88, 3, 50],
];
const M440_LABEL = "Dune lamp";
const poly = (pts: number[]) => `polygon(${Array.from({ length: pts.length / 2 }, (_, k) => `${pts[k * 2].toFixed(2)}% ${pts[k * 2 + 1].toFixed(2)}%`).join(",")})`;
function M440() {
  const root = useRef<HTMLDivElement>(null);
  const apply = (p: number) => {
    const el = root.current;
    if (!el) return;
    const clip = el.querySelector<HTMLElement>(".m440-clip");
    const back = el.querySelector<HTMLElement>(".m440-back");
    const front = el.querySelector<HTMLElement>(".m440-front");
    if (!clip || !back || !front) return;
    const seg = p < 0.5 ? 0 : 1;
    const t = p < 0.5 ? p * 2 : (p - 0.5) * 2;
    const pts = M440_SHAPES[seg].map((v, k) => lerp(v, M440_SHAPES[seg + 1][k], t));
    clip.style.clipPath = poly(pts);
    back.style.transform = `rotateY(${lerp(40, -40, p).toFixed(2)}deg) scale(${lerp(1.45, 1.1, p).toFixed(3)})`;
    front.style.transform = `rotateY(${lerp(-40, 40, p).toFixed(2)}deg) scale(${lerp(0.7, 1, p).toFixed(3)})`;
    const chars = all(el, ".m440-ch");
    const n = chars.length;
    chars.forEach((c, k) => {
      const u = clamp01(p * (n + 2) - k);
      c.style.opacity = u.toFixed(3);
      c.style.transform = `translate3d(0,${((1 - u) * 0.5).toFixed(3)}em,0)`;
    });
  };
  useScrub(root, apply);
  return (
    <Frame r={root} bg="#120d08">
      <Glow code="m440" color="rgba(255,179,107,.42)" at="35% 50%" />
      <div className="absolute inset-y-[7%] left-[6%] aspect-square">
        <div className="m440-clip absolute inset-0 overflow-hidden will-change-[clip-path]" style={{ clipPath: poly(M440_SHAPES[2]), perspective: "900px" }}>
          <div className="m440-back absolute inset-0 will-change-transform" style={{ transform: "rotateY(-40deg) scale(1.1)" }}>
            <Img i={3} w={900} h={900} />
          </div>
          <div className="m440-front absolute inset-[22%] overflow-hidden rounded-[12px] border border-white/20 will-change-transform" style={{ transform: "rotateY(40deg) scale(1)" }}>
            <Img i={1} w={600} h={600} />
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute right-[6%] top-1/2 w-[38%] -translate-y-1/2 text-[#fff1e6]">
        <p className="text-[13px] uppercase tracking-[0.2em] text-white/60">Hearthform · lighting</p>
        <h3 className="mt-3 text-[clamp(52px,6vw,100px)] leading-none" style={{ fontFamily: EDITORIAL }}>
          {M440_LABEL.split("").map((ch, k) => (
            <span key={k} className="m440-ch inline-block">
              {ch === " " ? " " : ch}
            </span>
          ))}
        </h3>
        <p className="mt-4 max-w-[32ch] text-[16px] leading-relaxed text-white/75" style={{ fontFamily: MANROPE }}>
          Hand-cast sandstone base, linen shade, warm 2700 K glow.
        </p>
        <p className="mt-4 text-[22px] font-[600]" style={{ fontFamily: GROTESK }}>
          ₹6,450
        </p>
      </div>
    </Frame>
  );
}

/* ---------- M441 · Colour rises over grayscale (variant of M1: a colour copy is unmasked from the bottom, panel by panel) ---------- */
const M441_PANELS: [string, string, number][] = [
  ["Saffron fields", "₹1,250 / 10 g", 3],
  ["Chilli harvest", "₹480 / 250 g", 1],
  ["Cardamom hills", "₹960 / 100 g", 2],
];
function M441() {
  const root = useRef<HTMLDivElement>(null);
  const apply = (p: number) => {
    const el = root.current;
    if (!el) return;
    all(el, ".m441-panel").forEach((panel, i) => {
      const r = clamp01(p * 1.4 - i * 0.2);
      const col = panel.querySelector<HTMLElement>(".m441-col");
      const line = panel.querySelector<HTMLElement>(".m441-line");
      if (col) col.style.clipPath = `inset(${((1 - r) * 100).toFixed(2)}% 0% 0% 0%)`;
      if (line) {
        line.style.top = `${((1 - r) * 100).toFixed(2)}%`;
        line.style.opacity = r > 0 && r < 1 ? "1" : "0";
      }
    });
  };
  useScrub(root, apply);
  return (
    <Frame r={root} bg="#100b08">
      <Glow code="m441" color="rgba(255,120,60,.4)" />
      <div className="absolute inset-x-[5%] bottom-[16%] top-[7%] grid grid-cols-3 gap-[1.4vw]">
        {M441_PANELS.map(([n, pr, i]) => (
          <figure key={n} className="m441-panel relative overflow-hidden rounded-[16px]">
            <Img i={i} w={600} h={800} className="absolute inset-0" style={{ filter: "grayscale(1) contrast(1.05) brightness(.85)" }} />
            <div className="m441-col absolute inset-0 will-change-[clip-path]" style={{ clipPath: "inset(0% 0% 0% 0%)" }}>
              <Img i={i} w={600} h={800} style={{ filter: "saturate(1.35)" }} />
            </div>
            <div className="m441-line absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent opacity-0 shadow-[0_0_18px_rgba(255,220,180,.9)]" style={{ top: "0%" }} />
            <figcaption className="absolute bottom-3 left-3 right-3 flex justify-between text-[14px] font-[600] text-white" style={{ fontFamily: MANROPE }}>
              <span>{n}</span>
              <span className="text-white/80">{pr}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <TopGlow code="m441" color="rgba(255,170,110,.3)" />
      <div className="pointer-events-none absolute bottom-[4%] left-[5%] right-[5%] z-30 flex items-end justify-between text-[#fff1e6]">
        <p className="text-[clamp(28px,3vw,48px)] leading-none" style={{ fontFamily: SERIF, fontWeight: 500 }}>
          Picked in colour.
        </p>
        <p className="text-[13px] uppercase tracking-[0.2em] text-white/65">Ochre Spice Co. · single-origin</p>
      </div>
    </Frame>
  );
}

/* ---------- M442 · Background zoom-out blur (variant of M19: the backdrop shrinks, blurs and dims behind rising content) ---------- */
const M442_CABINS: [string, string][] = [
  ["Cabin No. 2", "₹8,400 / night"],
  ["Cabin No. 4", "₹9,800 / night"],
  ["The Lookout", "₹14,200 / night"],
];
function M442() {
  const root = useRef<HTMLDivElement>(null);
  const apply = (p: number) => {
    const el = root.current;
    if (!el) return;
    const bg = el.querySelector<HTMLElement>(".m442-bg");
    const col = el.querySelector<HTMLElement>(".m442-col");
    if (!bg || !col) return;
    bg.style.transform = `scale(${lerp(1.12, 0.84, p).toFixed(4)})`;
    bg.style.filter = `blur(${lerp(0, 8, p).toFixed(2)}px) brightness(${lerp(1, 0.55, p).toFixed(3)})`;
    bg.style.borderRadius = `${lerp(0, 34, p).toFixed(1)}px`;
    col.style.transform = `translate3d(0,${(-p * Math.max(0, col.scrollHeight - el.clientHeight)).toFixed(1)}px,0)`;
  };
  useScrub(root, apply);
  return (
    <Frame r={root} bg="#070c0a">
      <Glow code="m442" color="rgba(24,196,143,.4)" />
      <div className="m442-bg absolute inset-0 overflow-hidden will-change-transform" style={{ transform: "scale(.84)", filter: "blur(8px) brightness(.55)", borderRadius: 34 }}>
        <Img i={2} w={1600} h={1000} />
      </div>
      <TopGlow code="m442" color="rgba(160,255,210,.28)" />
      <div className="m442-col absolute inset-x-0 top-0 z-30 will-change-transform">
        <div className="grid h-[70vh] place-items-center text-center">
          <div>
            <h3 className="text-[clamp(60px,7.4vw,124px)] leading-[0.92] text-[#f1fff4]" style={{ fontFamily: SERIF, fontWeight: 500 }}>
              Into the pines.
            </h3>
            <p className="mt-4 text-[15px] uppercase tracking-[0.22em] text-white/80">Pinehollow cabins · since 2011</p>
          </div>
        </div>
        <div className="mx-auto grid w-[min(84%,1080px)] grid-cols-3 gap-[1.4vw] pb-[8vh]">
          {M442_CABINS.map(([n, pr], i) => (
            <div key={n} className="rounded-[18px] border border-white/15 bg-white/10 p-[1.2vw] backdrop-blur-md">
              <div className="h-[26vh] overflow-hidden rounded-[12px]">
                <Img i={(i + 1) % 4} w={600} h={420} />
              </div>
              <p className="mt-3 text-[clamp(18px,1.6vw,24px)] font-[600] text-white" style={{ fontFamily: GROTESK }}>
                {n}
              </p>
              <p className="mt-1 text-[14px] text-white/75" style={{ fontFamily: MANROPE }}>
                {pr}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
}

/* ---------- M443 · Frame scrub with step cards (variant of M27: a drawn frame sequence, glass cards caption its stages) ---------- */
const M443_FRAMES = 120;
const M443_STEPS: [string, string, number, number][] = [
  ["01", "Woven fabric shell", 0.04, 0.34],
  ["02", "50 mm neodymium driver", 0.36, 0.66],
  ["03", "Sealed bass chamber", 0.68, 1.01],
];
function drawSpeaker(ctx: CanvasRenderingContext2D, w: number, h: number, f: number) {
  ctx.clearRect(0, 0, w, h);
  const u = f / (M443_FRAMES - 1);
  const spread = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; // eased per frame, like a rendered sequence
  const cx = w * 0.5;
  const rx = Math.min(w * 0.17, h * 0.3);
  const ry = rx * (0.28 + 0.12 * Math.sin(u * Math.PI));
  const thick = rx * 0.16;
  const gap = rx * 0.55 * spread;
  const colors = [
    ["#3a2416", "#e0913f"],
    ["#2b1a10", "#ffb36b"],
    ["#402818", "#ffd59a"],
    ["#22150c", "#c97a35"],
    ["#4a3020", "#fff1e0"],
  ];
  const n = colors.length;
  const total = n * thick + (n - 1) * gap;
  const baseY = h * 0.5 + total / 2;
  const turn = u * Math.PI * 1.5;
  // floor shadow
  ctx.fillStyle = "rgba(0,0,0,.45)";
  ctx.beginPath();
  ctx.ellipse(cx, baseY + ry * 0.9, rx * 1.15, ry * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let k = 0; k < n; k++) {
    const y = baseY - k * (thick + gap);
    const [dark, light] = colors[k];
    const g = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0);
    const hl = 0.5 + 0.35 * Math.sin(turn + k * 0.6);
    g.addColorStop(0, dark);
    g.addColorStop(Math.max(0, hl - 0.15), dark);
    g.addColorStop(hl, light);
    g.addColorStop(Math.min(1, hl + 0.15), dark);
    g.addColorStop(1, dark);
    // side
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cx, y, rx, ry, 0, 0, Math.PI);
    ctx.lineTo(cx - rx, y - thick);
    ctx.ellipse(cx, y - thick, rx, ry, 0, Math.PI, 0, true);
    ctx.closePath();
    ctx.fill();
    // top
    const tg = ctx.createRadialGradient(cx - rx * 0.3, y - thick - ry * 0.4, rx * 0.1, cx, y - thick, rx);
    tg.addColorStop(0, light);
    tg.addColorStop(1, dark);
    ctx.fillStyle = tg;
    ctx.beginPath();
    ctx.ellipse(cx, y - thick, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    // ring detail
    ctx.strokeStyle = "rgba(255,240,220,.35)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(cx, y - thick, rx * (0.5 + 0.08 * k), ry * (0.5 + 0.08 * k), 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}
function M443() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const frame = useRef(-1);
  const wanted = useRef(M443_FRAMES - 1);
  const draw = (force = false) => {
    const c = canvas.current;
    if (!c) return;
    const f = wanted.current;
    if (!force && f === frame.current) return;
    frame.current = f;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawSpeaker(ctx, c.width / dpr, c.height / dpr, f);
    const out = root.current?.querySelector<HTMLElement>(".m443-f");
    if (out) out.textContent = String(f + 1).padStart(3, "0");
  };
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const size = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      c.width = Math.round(c.clientWidth * dpr);
      c.height = Math.round(c.clientHeight * dpr);
      draw(true);
    };
    const ro = new ResizeObserver(size);
    ro.observe(c);
    size();
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const apply = (p: number) => {
    wanted.current = Math.round(p * (M443_FRAMES - 1));
    draw();
    const el = root.current;
    if (!el) return;
    all(el, ".m443-card").forEach((card, i) => {
      const [, , a, b] = M443_STEPS[i];
      const u = (p - a) / (b - a);
      const last = i === M443_STEPS.length - 1;
      const inn = clamp01(u / 0.18);
      const out = last ? 0 : clamp01((u - 0.82) / 0.18);
      card.style.opacity = (u < 0 || u > 1 ? (last && u > 1 ? 1 : 0) : inn * (1 - out)).toFixed(3);
      card.style.transform = `translate3d(0,${((1 - inn) * 36 - out * 36).toFixed(1)}px,0)`;
    });
  };
  useScrub(root, apply);
  return (
    <Frame r={root} bg="#0f0b08">
      <Glow code="m443" color="rgba(224,145,63,.42)" />
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute left-[5%] top-[7%] text-[#fff6e8]">
        <p className="text-[13px] uppercase tracking-[0.2em] text-white/60">Halo One · smart speaker</p>
        <p className="mt-2 text-[clamp(30px,3vw,48px)] leading-none" style={{ fontFamily: EDITORIAL }}>
          Built in five layers.
        </p>
      </div>
      <p className="pointer-events-none absolute bottom-4 left-5 text-[13px] tabular-nums tracking-[0.2em] text-white/65" style={{ fontFamily: GROTESK }}>
        FRAME <span className="m443-f">120</span> / {M443_FRAMES} · ₹14,900
      </p>
      <div className="pointer-events-none absolute right-[6%] top-1/2 h-0 w-[min(26%,340px)]">
        {M443_STEPS.map(([n, t], i) => (
          <div
            key={n}
            className="m443-card absolute inset-x-0 -top-[60px] rounded-[18px] border border-white/20 bg-white/10 p-5 text-white shadow-[0_20px_50px_rgba(0,0,0,.4)] backdrop-blur-md will-change-transform"
            style={{ opacity: i === M443_STEPS.length - 1 ? 1 : 0 }}
          >
            <p className="text-[13px] tracking-[0.2em] text-[#ffd59a]" style={{ fontFamily: GROTESK }}>
              STEP {n}
            </p>
            <p className="mt-2 text-[clamp(18px,1.6vw,24px)] font-[600] leading-tight" style={{ fontFamily: MANROPE }}>
              {t}
            </p>
          </div>
        ))}
      </div>
    </Frame>
  );
}

/* ---------- M444 · Images on a giant arc (variant of M30: a circle bigger than the screen turns, images stay upright) ---------- */
const M444_N = 20;
const M444_STEP = 7.5; // degrees between images
const M444_PLACES = ["Kovalam", "Varkala", "Gokarna", "Palolem", "Murudeshwar", "Tarkarli", "Kapu", "Marari", "Diveagar", "Agonda"];
function M444() {
  const root = useRef<HTMLDivElement>(null);
  const apply = (p: number) => {
    const el = root.current;
    if (!el) return;
    const W = el.clientWidth;
    const H = el.clientHeight;
    const R = W * 1.05;
    const cx = W / 2;
    const cy = H * 0.4 + R;
    const span = (M444_N - 1) * M444_STEP;
    const rot = -p * (span - 56);
    const ring = el.querySelector<HTMLElement>(".m444-ring");
    if (ring) ring.style.transform = `translate3d(${(cx - R).toFixed(1)}px,${(cy - R).toFixed(1)}px,0) rotate(${rot.toFixed(2)}deg)`;
    if (ring) {
      ring.style.width = `${(R * 2).toFixed(1)}px`;
      ring.style.height = `${(R * 2).toFixed(1)}px`;
    }
    all(el, ".m444-img").forEach((im, i) => {
      const a = ((-28 + i * M444_STEP + rot) * Math.PI) / 180;
      const x = cx + R * Math.sin(a) - im.offsetWidth / 2;
      const y = cy - R * Math.cos(a) - im.offsetHeight / 2;
      // upright: translate only, never rotate
      im.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
    });
    const out = el.querySelector<HTMLElement>(".m444-n");
    if (out) out.textContent = String(Math.min(M444_N, 1 + Math.round(p * (M444_N - 1)))).padStart(2, "0");
  };
  useScrub(root, apply, { finalValue: 0.5 });
  return (
    <Frame r={root} bg="#070d14">
      <Glow code="m444" color="rgba(47,140,255,.42)" at="50% 35%" />
      <div className="m444-ring pointer-events-none absolute left-0 top-0 rounded-full border border-dashed border-white/20" style={{ width: 2400, height: 2400, transform: "translate3d(-500px,240px,0)" }} />
      {Array.from({ length: M444_N }, (_, i) => (
        <figure
          key={i}
          className="m444-img absolute left-0 top-0 h-[34%] w-[min(13%,180px)] overflow-hidden rounded-[14px] border border-white/15 shadow-[0_16px_40px_rgba(0,0,0,.5)] will-change-transform"
          style={{ transform: `translate3d(${80 + i * 150}px,120px,0)` }}
        >
          <Img i={i % 4} w={360} h={480} />
          <figcaption className="absolute bottom-2 left-2 text-[12px] font-[600] text-white/90" style={{ fontFamily: GROTESK }}>
            {M444_PLACES[i % M444_PLACES.length]}
          </figcaption>
        </figure>
      ))}
      <TopGlow code="m444" color="rgba(150,200,255,.28)" />
      <div className="pointer-events-none absolute bottom-[8%] left-0 right-0 z-30 text-center text-[#eaf5ff]">
        <p className="text-[clamp(40px,4.6vw,76px)] leading-none" style={{ fontFamily: EDITORIAL }}>
          Twenty bays, one coast.
        </p>
        <p className="mt-3 text-[14px] tabular-nums uppercase tracking-[0.2em] text-white/70" style={{ fontFamily: GROTESK }}>
          Saltline Stays · bay <span className="m444-n">10</span> / {M444_N} · from ₹6,900
        </p>
      </div>
    </Frame>
  );
}

/* ---------- M445 · Scroll-scrubbed 3D ring (variant of M33: Y 0 → −180°, X/Z tilt ±3°, cards turn on Z, back cards dim) ---------- */
const M445_N = 10;
const M445_WOODS = ["Teak", "Walnut", "Oak", "Ash", "Cedar", "Maple", "Sheesham", "Mango", "Cherry", "Birch"];
function M445() {
  const root = useRef<HTMLDivElement>(null);
  const apply = (p: number) => {
    const el = root.current;
    if (!el) return;
    const ring = el.querySelector<HTMLElement>(".m445-ring");
    if (!ring) return;
    const R = Math.min(440, el.clientWidth * 0.3);
    const ry = -180 * p;
    const tx = 3 * Math.sin(p * Math.PI * 2);
    const tz = 3 * Math.cos(p * Math.PI * 2);
    ring.style.transform = `rotateX(${tx.toFixed(2)}deg) rotateZ(${tz.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    all(el, ".m445-card").forEach((c, i) => {
      const a = (360 / M445_N) * i;
      const cz = 6 * Math.sin(p * Math.PI * 2 + i);
      c.style.transform = `rotateY(${a}deg) translateZ(${R.toFixed(1)}px) rotateZ(${cz.toFixed(2)}deg)`;
      const facing = Math.cos(((a + ry) * Math.PI) / 180); // 1 front, −1 back
      c.style.filter = `brightness(${(0.3 + 0.7 * ((facing + 1) / 2)).toFixed(3)})`;
      c.style.zIndex = String(Math.round((facing + 1) * 50));
    });
  };
  useScrub(root, apply, { finalValue: 0.5 });
  return (
    <Frame r={root} bg="#100c09">
      <Glow code="m445" color="rgba(224,145,63,.42)" />
      <div className="pointer-events-none absolute inset-x-0 top-[6%] text-center text-[#fff6e8]">
        <p className="text-[13px] uppercase tracking-[0.2em] text-white/60">Grainhouse · veneer library</p>
        <p className="mt-2 text-[clamp(30px,3.2vw,52px)] leading-none" style={{ fontFamily: SERIF, fontWeight: 500 }}>
          Ten woods, one turn.
        </p>
      </div>
      <div className="absolute inset-0 top-[10%] grid place-items-center" style={{ perspective: "1400px" }}>
        <div className="m445-ring relative h-0 w-0 will-change-transform" style={{ transformStyle: "preserve-3d" }}>
          {M445_WOODS.map((n, i) => (
            <figure
              key={n}
              className="m445-card absolute -ml-[100px] -mt-[136px] h-[272px] w-[200px] overflow-hidden rounded-[14px] border border-white/15"
              style={{ transform: `rotateY(${(360 / M445_N) * i}deg) translateZ(420px)`, backfaceVisibility: "visible" }}
            >
              <Img i={i % 4} w={400} h={544} />
              <figcaption className="absolute bottom-2 left-3 right-3 flex justify-between text-[12px] font-[600] text-white" style={{ fontFamily: GROTESK }}>
                <span>{n}</span>
                <span className="text-white/75">₹{(180 + i * 35).toLocaleString("en-IN")}/sq ft</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
      <TopGlow code="m445" color="rgba(255,200,140,.28)" />
    </Frame>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M434", name: "Elastic column lag", how: "Four columns follow the scroll, each smoothed with its own lag, so they stretch apart while scrolling and rejoin when it stops · scrubbed", kind: "scrub", C: M434 },
  { code: "M435", name: "Columns stagger speeds", how: "Columns travel the same way at different speeds (yPercent −10 × index) while each image drifts ±30 px inside its frame · scrubbed", kind: "scrub", C: M435 },
  { code: "M436", name: "Pinned Flip between layouts", how: "A pinned gallery Flips from a scattered, tilted layout into a tidy grid while the inner images scale 2 → 1 · scrubbed", kind: "scrub", C: M436 },
  { code: "M437", name: "Grid assembles from below", how: "Tiles rise from far below with a stagger and a random tilt from their top edge, the title slides out, then the frame shrinks and darkens · scrubbed", kind: "scrub", C: M437 },
  { code: "M438", name: "3D grid fly-in from depth", how: "Cards arrive from random depths and side offsets into a flat grid, brightening as they land, while the grid tilts flat · scrubbed", kind: "scrub", C: M438 },
  { code: "M439", name: "Isometric grid drifts diagonally", how: "An isometric card grid drifts on the diagonal with scroll; cards rise in Z on hover (one after another by themselves) · scrubbed", kind: "scrub", C: M439 },
  { code: "M440", name: "Image clip shape morphs on scroll", how: "An image's clip-path morphs through two polygons while its inner layers turn on Y (±40°) and scale, and the label types in · scrubbed", kind: "scrub", C: M440 },
  { code: "M441", name: "Colour rises over grayscale", how: "A full-colour copy of grayscale photos is unmasked from the bottom up, panel by panel, with a bright edge line · scrubbed", kind: "scrub", C: M441 },
  { code: "M442", name: "Background zoom-out blur", how: "The backdrop photo zooms out, blurs, dims and rounds its corners while the content scrolls up over it · scrubbed", kind: "scrub", C: M442 },
  { code: "M443", name: "Frame scrub with step cards", how: "A drawn 120-frame sequence (a speaker separating into layers) follows the scroll while glass step cards float in and out at set frames · scrubbed", kind: "scrub", C: M443 },
  { code: "M444", name: "Images on a giant arc", how: "Images sit on a circle bigger than the screen (only its top arc shows); scroll turns the circle and the images travel the arc, staying upright · scrubbed", kind: "scrub", C: M444 },
  { code: "M445", name: "Scroll-scrubbed 3D ring", how: "A ring of cards turns on Y (0 → −180°) with a ±3° X/Z wobble and per-card Z turn; front cards bright, back cards dim · scrubbed", kind: "scrub", C: M445 },
];
