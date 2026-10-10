"use client";

// Loader motions, batch 3 · group 5 (MOTION-MENU I20–I30). Small focused demos for /lab/motion.
// Every loader is contained inside its demo frame (never fixed to the viewport) and loops its whole sequence:
// in → hold (≤ 0.3 s) → reveal the little page underneath → short hold → restart. It plays only while on screen,
// a CSS-only glow loop never stops, and ?static=1 / reduced motion shows the revealed page (loader covers start hidden).
import { useRef, useEffect, type CSSProperties, type ReactNode, type RefObject } from "react";
import type { Flip as FlipT } from "gsap/Flip";
import { gsap, loadPlugin, prefersReducedMotion } from "@/lib/gsap";
import { scene } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = {
  sg: "Space Grotesk Variable",
  fr: "Fraunces Variable",
  is: "Instrument Serif",
  sy: "Syne Variable",
  mr: "Manrope Variable",
};

const CSS = `
.b3g5-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.42)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.2)),transparent 70%);animation:b3g5-drift 5.6s linear infinite alternate;will-change:transform}
@keyframes b3g5-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b3g5-hide{visibility:hidden}
html.is-static .b3g5-glow{animation:none}
html.is-static {.b3g5-glow{animation:none}}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen) + a second glow ON TOP (loader covers hide the first). */
function Stage({ r, children, className = "", g1, g2, top = 0.4 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string; top?: number }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0d16] text-[#eef2ff] ${className}`}>
      <style href="b3g5-css" precedence="default">
        {CSS}
      </style>
      <div className="b3g5-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
      <div className="b3g5-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: top, zIndex: 60 } as CSSProperties} aria-hidden />
    </div>
  );
}

/** "play" helper: waits for fonts (+ an optional plugin), builds the looping timeline in a gsap.context, plays it only
 *  while on screen, reverts on unmount. Nothing runs with prefersReducedMotion(). */
function usePlay(ref: RefObject<HTMLElement | null>, build: (root: HTMLElement) => gsap.core.Animation | void, pre?: () => Promise<unknown>) {
  const b = useRef(build);
  b.current = build;
  const p = useRef(pre);
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
    Promise.all([document.fonts?.ready, p.current?.()]).then(() => {
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

let Flip: typeof FlipT | null = null;
const needFlip = () =>
  loadPlugin("Flip").then((f) => {
    Flip = f;
  });
type Fit = { x: number; y: number; scaleX?: number; scaleY?: number };
/** Flip.fit as plain vars: the transform that puts `el` exactly over `target` (el must be untransformed). */
const fit = (el: Element, target: Element): Fit => (Flip ? (Flip.fit(el, target, { scale: true, getVars: true }) as Fit) : { x: 0, y: 0 });

const all = (root: Element, sel: string) => [...root.querySelectorAll<HTMLElement>(sel)];

/** Adds a 0→100 counter to the timeline, written into every `els`. */
function count(tl: gsap.core.Timeline, els: Element[], duration: number, at?: gsap.Position, ease = "power1.inOut", pad = 3) {
  const o = { v: 0 };
  tl.fromTo(
    o,
    { v: 0 },
    {
      v: 100,
      duration,
      ease,
      onUpdate: () => {
        const s = String(Math.round(o.v)).padStart(pad, "0");
        els.forEach((e) => (e.textContent = s));
      },
    },
    at,
  );
}

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, className = "", label = "", w = 900, h = 700 }: { i: number; className?: string; label?: string; w?: number; h?: number }) => (
  <img src={scene(i, w, h, label)} alt="" className={`block h-full w-full object-cover ${className}`} draggable={false} />
);

/** A tiny nav row for the revealed "page". */
const MiniNav = ({ brand, links = ["Shop", "Journal", "Visit"], dark = false }: { brand: string; links?: string[]; dark?: boolean }) => (
  <div className={`flex items-center justify-between text-[13px] ${dark ? "text-[#141414]" : "text-white/75"}`}>
    <span className="text-[16px] font-[700] tracking-[-0.01em]" style={{ fontFamily: F.sg }}>
      {brand}
    </span>
    <span className="flex gap-6">
      {links.map((l) => (
        <span key={l}>{l}</span>
      ))}
    </span>
  </div>
);

/* ───────────────────────── I20 · Photo stack deals into the grid ───────────────────────── */
const I20_TITLE = "Field Notes";
function I20() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(
    root,
    (el) => {
      const cells = all(el, ".i20-cell");
      const anchor = el.querySelector<HTMLElement>(".i20-anchor")!;
      const page = el.querySelector<HTMLElement>(".i20-page")!;
      const cover = el.querySelector<HTMLElement>(".i20-cover")!;
      const chars = all(el, ".i20-ch");
      const title = el.querySelector<HTMLElement>(".i20-title")!;
      // the stack target: a centred card ~60% of a grid cell
      const c0 = cells[0].getBoundingClientRect();
      const pr = page.getBoundingClientRect();
      const w = c0.width * 0.6;
      const h = c0.height * 0.6;
      Object.assign(anchor.style, { width: `${w}px`, height: `${h}px`, left: `${(pr.width - w) / 2}px`, top: `${(pr.height - h) / 2 + pr.height * 0.04}px` });
      const fits = cells.map((c) => fit(c, anchor));
      const rots = [-12, 7, -4, 11, -8, 3];
      const tr = title.getBoundingClientRect();
      const mid = tr.left + tr.width / 2;
      const dx = chars.map((c) => {
        const b = c.getBoundingClientRect();
        return mid - (b.left + b.width / 2);
      });
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.2 });
      const cycle = (spring: boolean) => {
        tl.set(cover, { autoAlpha: 1 });
        tl.set(chars, { x: (i) => dx[i], opacity: 0 });
        tl.set(cells, {
          x: (i) => fits[i].x,
          y: (i) => fits[i].y - 60,
          scaleX: (i) => fits[i].scaleX ?? 1,
          scaleY: (i) => fits[i].scaleY ?? 1,
          rotation: (i) => rots[i % rots.length],
          autoAlpha: 0,
        });
        const t0 = tl.duration();
        count(tl, all(el, ".i20-n"), 1.1, t0);
        // photos drop onto the stack one by one
        tl.to(cells, { autoAlpha: 1, y: (i) => fits[i].y, duration: 0.32, ease: "power3.out", stagger: 0.12 }, t0 + 0.05);
        tl.to({}, { duration: 0.25 }); // hold
        tl.addLabel(spring ? "dealB" : "dealA");
        tl.to(cover, { autoAlpha: 0, duration: 0.5, ease: "power1.out" }, "<");
        tl.to(
          cells,
          {
            x: 0,
            y: 0,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            duration: spring ? 1.05 : 0.95,
            ease: spring ? "back.out(1.7)" : "expo.inOut",
            stagger: { each: 0.07, from: "random" },
          },
          "<",
        );
        tl.to(chars, { x: 0, opacity: 1, duration: 0.8, ease: "power3.out", stagger: { each: 0.03, from: "center" } }, "<0.35");
        tl.to({}, { duration: 0.3 }); // hold on the page
        tl.to(page, { opacity: 0.25, duration: 0.25, ease: "power1.in" });
        tl.set(page, { opacity: 1 });
      };
      cycle(false);
      cycle(true);
      return tl;
    },
    needFlip,
  );
  return (
    <Stage r={root} g1="rgba(255,190,120,.34)" g2="rgba(79,141,255,.22)">
      <div className="i20-page absolute inset-0 px-[4%] py-[3.5%]">
        <MiniNav brand="Wren & Pine" links={["Prints", "Stories", "About"]} />
        <div className="mt-[2%] flex items-end justify-between">
          <h3 className="i20-title text-[clamp(38px,4.4vw,68px)] leading-none" style={{ fontFamily: F.fr, fontWeight: 500 }}>
            {I20_TITLE.split("").map((c, i) => (
              <span key={i} className="i20-ch inline-block whitespace-pre">
                {c}
              </span>
            ))}
          </h3>
          <p className="text-[13px] uppercase tracking-[0.2em] text-white/55">Six prints · from ₹ 2,400</p>
        </div>
        <div className="i20-cover b3g5-hide absolute inset-0 z-10 bg-[#0d111c]">
          <p className="absolute bottom-[6%] left-[4%] text-[13px] uppercase tracking-[0.24em] text-white/55">Developing the roll</p>
          <p className="i20-n absolute bottom-[5%] right-[4%] text-[clamp(30px,3vw,46px)] font-[600] tabular-nums" style={{ fontFamily: F.sg }}>
            100
          </p>
        </div>
        <div className="relative z-20 mt-[2.5%] grid h-[66%] grid-cols-3 grid-rows-2 gap-[1.4%]">
          {[0, 1, 2, 3, 0, 1].map((s, i) => (
            <div key={i} className="i20-cell overflow-hidden rounded-[10px] bg-white shadow-[0_18px_40px_rgba(0,0,0,.45)]" style={{ padding: 6 }}>
              <Img i={s} w={700} h={460} className="rounded-[6px]" label={`N°0${i + 1}`} />
            </div>
          ))}
        </div>
        <div className="i20-anchor pointer-events-none absolute" aria-hidden />
      </div>
    </Stage>
  );
}

/* ───────────────────────── I21 · Flash-built stack spreads to grid ───────────────────────── */
function I21() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(
    root,
    (el) => {
      const cells = all(el, ".i21-cell");
      const anchor = el.querySelector<HTMLElement>(".i21-anchor")!;
      const page = el.querySelector<HTMLElement>(".i21-page")!;
      const cover = el.querySelector<HTMLElement>(".i21-cover")!;
      const head = all(el, ".i21-head");
      const c0 = cells[0].getBoundingClientRect();
      const pr = page.getBoundingClientRect();
      const w = c0.width * 1.15;
      const h = c0.height * 1.15;
      Object.assign(anchor.style, { width: `${w}px`, height: `${h}px`, left: `${(pr.width - w) / 2}px`, top: `${(pr.height - h) / 2}px` });
      const fits = cells.map((c) => fit(c, anchor));
      const rots = [-3, 4, -5, 2, 5, -2, 3, -4];
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.2 });
      tl.set(cover, { autoAlpha: 1 });
      tl.set(head, { yPercent: 110 });
      tl.set(cells, {
        x: (i) => fits[i].x,
        y: (i) => fits[i].y,
        scaleX: (i) => fits[i].scaleX ?? 1,
        scaleY: (i) => fits[i].scaleY ?? 1,
        rotation: (i) => rots[i],
        autoAlpha: 0,
      });
      const nums = all(el, ".i21-n");
      const setN = (v: number) => () => nums.forEach((n) => (n.textContent = String(v).padStart(2, "0")));
      tl.call(setN(0), undefined, 0);
      // the flash build: each photo cuts in on top of the last, ~80 ms apart (hard cuts, no flying in)
      cells.forEach((c, i) => {
        tl.set(c, { autoAlpha: 1 }, 0.25 + i * 0.08);
        tl.call(setN(i + 1), undefined, 0.25 + i * 0.08);
      });
      tl.to({}, { duration: 0.3 }); // hold the finished stack
      tl.to(cover, { autoAlpha: 0, duration: 0.45 });
      tl.to(cells, { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, duration: 1.0, ease: "power4.inOut", stagger: { each: 0.035, from: "end" } }, "<");
      tl.to(head, { yPercent: 0, duration: 0.7, ease: "power3.out", stagger: 0.08 }, "-=0.45");
      tl.to({}, { duration: 0.3 });
      tl.to(page, { opacity: 0.2, duration: 0.25 });
      tl.set(page, { opacity: 1 });
      return tl;
    },
    needFlip,
  );
  return (
    <Stage r={root} g1="rgba(79,141,255,.4)" g2="rgba(255,90,140,.2)">
      <div className="i21-page absolute inset-0 px-[4%] py-[3.5%]">
        <MiniNav brand="Halden Archive" links={["Index", "Series", "Contact"]} />
        <div className="i21-cover b3g5-hide absolute inset-0 z-10 bg-[#07090f]">
          <p className="absolute left-[4%] top-[8%] text-[13px] uppercase tracking-[0.24em] text-white/55">Loading archive</p>
          <p className="absolute bottom-[5%] right-[4%] text-[clamp(28px,2.8vw,42px)] font-[600] tabular-nums" style={{ fontFamily: F.sg }}>
            <span className="i21-n">08</span>
            <span className="text-white/40"> / 08</span>
          </p>
        </div>
        <div className="relative z-20 mt-[3%] grid h-[62%] grid-cols-4 grid-rows-2 gap-[1.2%]">
          {[0, 1, 2, 3, 1, 2, 3, 0].map((s, i) => (
            <div key={i} className="i21-cell overflow-hidden rounded-[6px] shadow-[0_14px_34px_rgba(0,0,0,.5)]">
              <Img i={s} w={560} h={420} label={`A-${i + 11}`} />
            </div>
          ))}
        </div>
        <div className="mt-[2.5%] flex items-end justify-between">
          <h3 className="overflow-hidden text-[clamp(36px,4vw,62px)] font-[700] uppercase leading-[0.95] tracking-[-0.02em]" style={{ fontFamily: F.sy }}>
            <span className="i21-head inline-block">Archive ’26</span>
          </h3>
          <p className="overflow-hidden text-[14px] text-white/60">
            <span className="i21-head inline-block">Eight studies in light · prints from ₹ 3,200</span>
          </p>
        </div>
        <div className="i21-anchor pointer-events-none absolute" aria-hidden />
      </div>
    </Stage>
  );
}

/* ───────────────────────── I22 · Photo grid, one grows to hero ───────────────────────── */
const I22_KEEP = 6;
function I22() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(
    root,
    (el) => {
      const thumbs = all(el, ".i22-thumb");
      const slot = el.querySelector<HTMLElement>(".i22-slot")!;
      const hero = el.querySelector<HTMLElement>(".i22-hero")!;
      const cover = el.querySelector<HTMLElement>(".i22-cover")!;
      const lines = all(el, ".i22-line");
      const page = el.querySelector<HTMLElement>(".i22-page")!;
      gsap.set(cover, { autoAlpha: 1 }); // measure the slot with the cover laid out
      const f = fit(hero, slot);
      gsap.set(cover, { autoAlpha: 0 });
      const sr = slot.getBoundingClientRect();
      const out = thumbs.map((t) => {
        const b = t.getBoundingClientRect();
        const vx = b.left + b.width / 2 - (sr.left + sr.width / 2);
        const vy = b.top + b.height / 2 - (sr.top + sr.height / 2);
        const len = Math.hypot(vx, vy) || 1;
        return { x: (vx / len) * 900, y: (vy / len) * 600 };
      });
      const order = [...thumbs.keys(), thumbs.length]; // the hero pops in at its own grid index
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.2 });
      tl.set(cover, { autoAlpha: 1 });
      tl.set(thumbs, { scale: 0, x: 0, y: 0, rotation: 0, autoAlpha: 1 });
      tl.set(hero, { x: f.x, y: f.y, scaleX: f.scaleX ?? 1, scaleY: f.scaleY ?? 1, autoAlpha: 0 });
      tl.set(lines, { yPercent: 110 });
      count(tl, all(el, ".i22-n"), 1.25, 0.1, "none");
      order.forEach((i) => {
        const at = 0.1 + (i < I22_KEEP ? i : i + 1) * 0.085;
        if (i === thumbs.length) tl.to(hero, { autoAlpha: 1, duration: 0.2 }, 0.1 + I22_KEEP * 0.085);
        else tl.to(thumbs[i], { scale: 1, duration: 0.4, ease: "back.out(2)" }, at);
      });
      tl.to({}, { duration: 0.25 }, ">");
      tl.addLabel("go");
      tl.to(thumbs, { x: (i) => out[i].x, y: (i) => out[i].y, rotation: (i) => (i % 2 ? 18 : -18), autoAlpha: 0, duration: 0.7, ease: "power3.in", stagger: { each: 0.025, from: "random" } }, "go");
      tl.to(cover, { autoAlpha: 0, duration: 0.5 }, "go+=0.45");
      tl.to(hero, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 1.1, ease: "expo.inOut" }, "go+=0.35");
      tl.to(lines, { yPercent: 0, duration: 0.8, ease: "power3.out", stagger: 0.08 }, "-=0.55");
      tl.to({}, { duration: 0.3 });
      tl.to(page, { opacity: 0.2, duration: 0.25 });
      tl.set(page, { opacity: 1 });
      return tl;
    },
    needFlip,
  );
  return (
    <Stage r={root} g1="rgba(24,196,143,.34)" g2="rgba(255,213,154,.2)">
      <div className="i22-page absolute inset-0 px-[4%] py-[3.5%]">
        <MiniNav brand="Casa Lumen" links={["Rooms", "Table", "Book"]} />
        <div className="absolute bottom-[12%] left-[4%] w-[40%]">
          <p className="overflow-hidden text-[13px] uppercase tracking-[0.22em] text-[#c8ff8a]">
            <span className="i22-line inline-block">Hill retreat · 9 rooms</span>
          </p>
          <h3 className="mt-3 text-[clamp(38px,4.3vw,66px)] leading-[0.98]" style={{ fontFamily: F.is }}>
            <span className="block overflow-hidden">
              <span className="i22-line inline-block">Quiet rooms,</span>
            </span>
            <span className="block overflow-hidden">
              <span className="i22-line inline-block">open sky.</span>
            </span>
          </h3>
          <p className="mt-4 overflow-hidden text-[15px] text-white/65">
            <span className="i22-line inline-block">Nights from ₹ 14,500 with breakfast</span>
          </p>
        </div>
        <div className="i22-cover b3g5-hide absolute inset-0 z-10 grid place-items-center bg-[#08110d]">
          <div className="grid grid-cols-4 gap-[10px]">
            {Array.from({ length: 12 }, (_, i) =>
              i === I22_KEEP ? (
                <div key={i} className="i22-slot aspect-[3/2] w-[clamp(90px,9vw,130px)]" />
              ) : (
                <div key={i} className="i22-thumb aspect-[3/2] w-[clamp(90px,9vw,130px)] overflow-hidden rounded-[4px]">
                  <Img i={(i + 2) % 4} w={300} h={200} />
                </div>
              ),
            )}
          </div>
          <p className="absolute bottom-[5%] left-[4%] text-[13px] uppercase tracking-[0.24em] text-white/55">Casa Lumen · loading</p>
          <p className="i22-n absolute bottom-[4%] right-[4%] text-[clamp(28px,2.8vw,42px)] font-[600] tabular-nums" style={{ fontFamily: F.sg }}>
            100
          </p>
        </div>
        <div className="i22-hero absolute right-[4%] top-[16%] z-20 aspect-[3/2] w-[50%] overflow-hidden rounded-[6px]">
          <Img i={2} w={1200} h={800} label="CASA LUMEN" />
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── I23 · Image trail collapses into hero ───────────────────────── */
const I23_N = 6;
function I23() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const copies = all(el, ".i23-copy"); // last = the hero (top)
    const clones = all(el, ".i23-clone"); // first = the real title (in flow)
    const counter = el.querySelector<HTMLElement>(".i23-count")!;
    const meta = all(el, ".i23-meta");
    const W = el.getBoundingClientRect().width;
    const H = el.getBoundingClientRect().height;
    const spread = copies.map((_, i) => {
      const k = i - (I23_N - 1);
      return { x: k * W * 0.085, y: -k * H * 0.05, s: 1 + k * 0.06 };
    });
    gsap.set(clones, { transformPerspective: 900, transformOrigin: "50% 50% -40px" });
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.2 });
    tl.set(counter, { autoAlpha: 1, y: 0 });
    tl.set(copies, { autoAlpha: 0, x: 0, y: 0, scale: 0.6 });
    tl.set(clones, { autoAlpha: 0, rotationY: 160 });
    tl.set(meta, { autoAlpha: 0, y: 14 });
    count(tl, [counter.querySelector(".i23-n")!], 1.1, 0, "steps(14)");
    tl.to({}, { duration: 0.2 });
    tl.to(counter, { autoAlpha: 0, y: -30, duration: 0.35, ease: "power2.in" });
    // stacked copies appear, then spread into a trail (oldest furthest away)
    tl.to(copies, { autoAlpha: (i) => 0.35 + (i / (I23_N - 1)) * 0.65, scale: 1, duration: 0.45, ease: "power3.out" }, "-=0.1");
    tl.to(copies, { x: (i) => spread[i].x, y: (i) => spread[i].y, scale: (i) => spread[i].s, duration: 0.9, ease: "expo.out", stagger: { each: 0.05, from: "end" } }, "-=0.15");
    tl.to(clones, { autoAlpha: (i) => (i === 0 ? 1 : 0.5 - i * 0.14), rotationY: 0, duration: 0.9, ease: "power3.out", stagger: 0.09 }, "<0.1");
    tl.to({}, { duration: 0.15 });
    // the trail collapses into the single hero
    tl.to(copies, { x: 0, y: 0, scale: 1, duration: 0.85, ease: "power4.inOut", stagger: { each: 0.04, from: "start" } });
    tl.to(copies.slice(0, -1), { autoAlpha: 0, duration: 0.3 }, "-=0.25");
    tl.to(clones.slice(1), { autoAlpha: 0, duration: 0.4 }, "<-0.2");
    tl.to(meta, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.08 }, "<");
    tl.to({}, { duration: 0.3 });
    tl.to([copies[I23_N - 1], clones[0], ...meta], { autoAlpha: 0, duration: 0.25 });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(224,145,63,.36)" g2="rgba(79,141,255,.2)">
      <div className="absolute inset-0 px-[4%] py-[3.5%]">
        <MiniNav brand="Triozen Tech" links={["Work", "Studio", "Say hi"]} />
        <div className="i23-meta absolute bottom-[6%] left-[4%] text-[14px] text-white/65">Ceramics & lighting, made slowly</div>
        <div className="i23-meta absolute bottom-[6%] right-[4%] text-[14px] text-white/65">Pendant N°4 · ₹ 18,900</div>
      </div>
      <div className="absolute left-1/2 top-[52%] aspect-[4/5] h-[66%] -translate-x-1/2 -translate-y-1/2">
        {Array.from({ length: I23_N }, (_, i) => (
          <div key={i} className={`i23-copy absolute inset-0 overflow-hidden rounded-[8px] shadow-[0_20px_50px_rgba(0,0,0,.5)] ${i < I23_N - 1 ? "b3g5-hide" : ""}`}>
            <Img i={3} w={600} h={750} />
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-[44%] z-10 text-center">
        <h3 className="relative inline-block text-[clamp(56px,7.4vw,112px)] font-[800] uppercase leading-none tracking-[-0.03em]" style={{ fontFamily: F.sy }}>
          {Array.from({ length: 4 }, (_, i) => (
            <span key={i} className={`i23-clone ${i === 0 ? "relative inline-block" : "b3g5-hide absolute left-0 top-0"}`} style={i ? { top: `${i * 0.16}em`, zIndex: -i } : undefined}>
              Triozen
            </span>
          ))}
        </h3>
      </div>
      <div className="i23-count b3g5-hide absolute inset-0 z-20 grid place-items-center">
        <p className="text-center">
          <span className="i23-n block text-[clamp(80px,10vw,150px)] font-[700] leading-none tabular-nums" style={{ fontFamily: F.sg }}>
            100
          </span>
          <span className="mt-2 block text-[13px] uppercase tracking-[0.3em] text-white/55">Loading the studio</span>
        </p>
      </div>
    </Stage>
  );
}

/* ───────────────────────── I24 · Logo pieces lock together ───────────────────────── */
// The mark: four shapes in a 200×200 box. Each has its own entry direction + spin.
const I24_PIECES = [
  { d: "M20 100 A80 80 0 0 1 180 100 Z", fill: "#ffb36b", from: { x: -320, y: -40, rotation: -120 } },
  { d: "M20 108 H96 V184 H20 Z", fill: "#eef2ff", from: { x: -60, y: 260, rotation: 90 } },
  { d: "M104 108 H180 L104 184 Z", fill: "#ff4d6d", from: { x: 340, y: 60, rotation: 180 } },
  { d: "M142 146 m-20 0 a20 20 0 1 0 40 0 a20 20 0 1 0 -40 0", fill: "#4f8dff", from: { x: 120, y: -280, rotation: -60 } },
];
function I24() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const cover = el.querySelector<HTMLElement>(".i24-cover")!;
    const logo = el.querySelector<HTMLElement>(".i24-logo")!;
    const pieces = all(el, ".i24-piece") as unknown as SVGPathElement[];
    const word = el.querySelector<HTMLElement>(".i24-word")!;
    const lines = all(el, ".i24-line");
    gsap.set(pieces, { transformOrigin: "50% 50%" });
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.2 });
    tl.set(cover, { autoAlpha: 1, yPercent: 0 });
    tl.set(logo, { y: 0, autoAlpha: 1, scale: 1 });
    tl.set(word, { autoAlpha: 0, letterSpacing: "0.5em" });
    tl.set(lines, { yPercent: 110 });
    pieces.forEach((p, i) => tl.set(p, { ...I24_PIECES[i].from, autoAlpha: 0 }, 0));
    tl.to(pieces, { x: 0, y: 0, rotation: 0, autoAlpha: 1, duration: 0.85, ease: "expo.out", stagger: 0.13 }, 0.15);
    tl.to(word, { autoAlpha: 1, letterSpacing: "0.22em", duration: 0.7, ease: "power3.out" }, "-=0.45");
    // the "lock": a tiny settle pulse while the assembled logo holds
    tl.to(logo, { scale: 1.045, duration: 0.18, ease: "power2.out" });
    tl.to(logo, { scale: 1, duration: 0.2, ease: "power2.in" });
    tl.to(logo, { y: -70, autoAlpha: 0, duration: 0.55, ease: "power3.in" });
    tl.to(cover, { yPercent: -100, duration: 0.9, ease: "power4.inOut" }, "-=0.3");
    tl.to(lines, { yPercent: 0, duration: 0.8, ease: "power3.out", stagger: 0.09 }, "-=0.5");
    tl.to({}, { duration: 0.3 });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,122,89,.36)" g2="rgba(79,141,255,.24)">
      <div className="absolute inset-0 px-[4%] py-[3.5%]">
        <MiniNav brand="Tessel" links={["Tiles", "Rooms", "Samples"]} />
        <div className="absolute bottom-[12%] left-[4%] right-[4%] flex items-end justify-between gap-8">
          <h3 className="text-[clamp(44px,5.6vw,88px)] font-[700] leading-[0.95] tracking-[-0.03em]" style={{ fontFamily: F.sg }}>
            <span className="block overflow-hidden">
              <span className="i24-line inline-block">Tiles cut</span>
            </span>
            <span className="block overflow-hidden">
              <span className="i24-line inline-block text-[#ffb36b]">like stone.</span>
            </span>
          </h3>
          <p className="max-w-[34ch] overflow-hidden pb-2 text-[15px] text-white/65">
            <span className="i24-line inline-block">Hand-pressed terrazzo in 24 colours. Sample box ₹ 1,200.</span>
          </p>
        </div>
      </div>
      <div className="i24-cover b3g5-hide absolute inset-0 z-20 grid place-items-center bg-[#11131c]">
        <div className="i24-logo flex flex-col items-center">
          <svg viewBox="0 0 200 200" className="h-[clamp(140px,22vh,210px)] w-auto overflow-visible" aria-hidden>
            {I24_PIECES.map((p, i) => (
              <path key={i} className="i24-piece" d={p.d} fill={p.fill} />
            ))}
          </svg>
          <p className="i24-word mt-5 text-[22px] font-[700] uppercase tracking-[0.22em]" style={{ fontFamily: F.sg }}>
            Tessel
          </p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── I25 · Burst-and-rewind assemble ───────────────────────── */
const I25_WORD = "KORVA";
function I25() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(
    root,
    (el) => {
      const cover = el.querySelector<HTMLElement>(".i25-cover")!;
      const pieces = all(el, ".i25-p");
      const lines = all(el, ".i25-line");
      const sheen = el.querySelector<HTMLElement>(".i25-sheen")!;
      gsap.set(pieces, { transformOrigin: "50% 50%" });
      // the burst: velocity + gravity flings every piece off the frame (built paused, then played BACKWARDS)
      const rnd = gsap.utils.random;
      const burst = gsap.timeline({ paused: true });
      pieces.forEach((p) => {
        burst.to(
          p,
          {
            physics2D: { velocity: rnd(900, 1400), angle: rnd(-165, -15), gravity: 1100 },
            rotation: rnd(-540, 540),
            scale: rnd(0.6, 1.4),
            duration: 1.5,
            ease: "none",
          },
          0,
        );
      });
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.2 });
      tl.set(cover, { autoAlpha: 1, yPercent: 0 });
      tl.set(lines, { yPercent: 110 });
      tl.set(sheen, { xPercent: -120, opacity: 1 });
      tl.fromTo(burst, { progress: 1 }, { progress: 0, duration: 1.5, ease: "power2.out" }, 0.1);
      tl.to(sheen, { xPercent: 120, duration: 0.5, ease: "power2.inOut" });
      tl.to(cover, { yPercent: -100, duration: 0.9, ease: "power4.inOut" }, "+=0.05");
      tl.to(lines, { yPercent: 0, duration: 0.8, ease: "power3.out", stagger: 0.09 }, "-=0.5");
      tl.to({}, { duration: 0.3 });
      return tl;
    },
    () => loadPlugin("Physics2DPlugin"),
  );
  return (
    <Stage r={root} g1="rgba(150,110,255,.36)" g2="rgba(255,122,89,.2)">
      <div className="absolute inset-0 px-[4%] py-[3.5%]">
        <MiniNav brand="Korva Audio" links={["Speakers", "Sound", "Stores"]} />
        <div className="absolute inset-x-[4%] bottom-[12%] flex items-end justify-between gap-8">
          <h3 className="text-[clamp(44px,5.6vw,88px)] font-[700] leading-[0.95] tracking-[-0.03em]" style={{ fontFamily: F.sg }}>
            <span className="block overflow-hidden">
              <span className="i25-line inline-block">Sound you</span>
            </span>
            <span className="block overflow-hidden">
              <span className="i25-line inline-block text-[#b9a6ff]">can see.</span>
            </span>
          </h3>
          <p className="max-w-[32ch] overflow-hidden pb-2 text-[15px] text-white/65">
            <span className="i25-line inline-block">Monolith One shelf speaker, walnut. ₹ 38,000 the pair.</span>
          </p>
        </div>
      </div>
      <div className="i25-cover b3g5-hide absolute inset-0 z-20 grid place-items-center bg-[#0c0a16]">
        <div className="relative flex items-center gap-[clamp(14px,1.6vw,26px)] overflow-hidden px-4 py-2">
          <svg viewBox="0 0 120 120" className="h-[clamp(84px,11vw,150px)] w-auto overflow-visible" aria-hidden>
            {Array.from({ length: 6 }, (_, i) => {
              const a0 = (i * Math.PI) / 3 - Math.PI / 2;
              const a1 = a0 + Math.PI / 3;
              const r = 56;
              const pts = `60,60 ${60 + r * Math.cos(a0)},${60 + r * Math.sin(a0)} ${60 + r * Math.cos(a1)},${60 + r * Math.sin(a1)}`;
              return <polygon key={i} className="i25-p" points={pts} fill={i % 2 ? "#b9a6ff" : "#ff8a6b"} stroke="#0c0a16" strokeWidth="2" />;
            })}
          </svg>
          <p className="text-[clamp(64px,8vw,124px)] font-[800] leading-none tracking-[-0.02em]" style={{ fontFamily: F.sy }}>
            {I25_WORD.split("").map((c, i) => (
              <span key={i} className="i25-p inline-block">
                {c}
              </span>
            ))}
          </p>
          <div className="i25-sheen pointer-events-none absolute inset-y-0 left-0 w-full mix-blend-overlay" style={{ background: "linear-gradient(100deg,transparent 30%,rgba(255,255,255,.75) 50%,transparent 70%)", opacity: 0 }} aria-hidden />
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── I26 · Split grid + ticker preloader ───────────────────────── */
const I26_COLS = 6;
const I26_TICK = ["Loading", "024", "Multiform", "Index", "118", "Frames", "Motion", "063", "Studio"];
function I26() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const wrap = el.querySelector<HTMLElement>(".i26-wrap")!;
    const cols = all(el, ".i26-col");
    const panels = all(el, ".i26-panel");
    const tick = el.querySelector<HTMLElement>(".i26-tick")!;
    const strip = el.querySelector<HTMLElement>(".i26-strip")!;
    const lines = all(el, ".i26-line");
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0 });
    tl.set(wrap, { autoAlpha: 1 });
    tl.set(cols, { yPercent: 0 });
    tl.set(panels, { scaleY: 0, transformOrigin: "50% 0%" });
    tl.set(tick, { autoAlpha: 0 });
    tl.set(lines, { yPercent: 110 });
    tl.to(panels, { scaleY: 1, duration: 0.45, ease: "power3.out", stagger: { each: 0.025, from: "random" } }, 0.05);
    tl.to(tick, { autoAlpha: 1, duration: 0.3 }, 0.35);
    tl.fromTo(strip, { xPercent: 0 }, { xPercent: -50, duration: 2.1, ease: "none" }, 0.3);
    count(tl, all(el, ".i26-n"), 1.6, 0.4);
    tl.to(tick, { autoAlpha: 0, duration: 0.25 }, 2.1);
    tl.addLabel("split", 2.2);
    tl.to(cols, { yPercent: (i) => (i % 2 ? 100 : -100), duration: 1.0, ease: "power4.inOut", stagger: 0.06 }, "split");
    tl.to(lines, { yPercent: 0, duration: 0.8, ease: "power3.out", stagger: 0.08 }, "split+=0.55");
    tl.set(wrap, { autoAlpha: 0 });
    tl.to({}, { duration: 0.1 });
    return tl;
  });
  const words = [...I26_TICK, ...I26_TICK];
  return (
    <Stage r={root} g1="rgba(200,255,138,.3)" g2="rgba(79,141,255,.24)">
      <div className="absolute inset-0 px-[4%] py-[3.5%]">
        <MiniNav brand="Multiform" links={["Work", "Services", "Contact"]} />
        <h3 className="absolute left-[4%] top-[24%] text-[clamp(52px,7vw,108px)] font-[800] uppercase leading-[0.9] tracking-[-0.03em]" style={{ fontFamily: F.sy }}>
          <span className="block overflow-hidden">
            <span className="i26-line inline-block">We make</span>
          </span>
          <span className="block overflow-hidden">
            <span className="i26-line inline-block text-[#c8ff8a]">brands move</span>
          </span>
        </h3>
        <p className="absolute bottom-[8%] left-[4%] max-w-[44ch] overflow-hidden text-[15px] text-white/65">
          <span className="i26-line inline-block">Identity, film and launch sites for food and drink brands. Projects from ₹ 4 lakh.</span>
        </p>
      </div>
      <div className="i26-wrap b3g5-hide absolute inset-0 z-20 flex">
        {Array.from({ length: I26_COLS }, (_, c) => (
          <div key={c} className="i26-col flex h-full flex-1 flex-col">
            {[0, 1, 2].map((r) => (
              <div key={r} className="i26-panel flex-1 border border-[#c8ff8a]/15 bg-[#0f1a0c]" />
            ))}
          </div>
        ))}
        <div className="i26-tick pointer-events-none absolute inset-x-0 top-1/2 -mt-[34px] h-[68px] overflow-hidden border-y border-[#c8ff8a]/30 bg-[#0f1a0c]/80">
          <div className="i26-strip flex h-full w-max items-center whitespace-nowrap">
            {words.map((w, i) => (
              <span key={i} className={`px-6 text-[34px] font-[700] uppercase tracking-[-0.01em] ${i % 3 === 1 ? "text-[#c8ff8a]" : "text-white/85"}`} style={{ fontFamily: F.sg }}>
                {w} <span className="text-white/30">/</span>
              </span>
            ))}
          </div>
        </div>
        <p className="i26-n pointer-events-none absolute bottom-[4%] right-[4%] text-[clamp(28px,2.8vw,42px)] font-[600] tabular-nums text-[#c8ff8a]" style={{ fontFamily: F.sg }}>
          100
        </p>
      </div>
    </Stage>
  );
}

/* ───────────────────────── I27 · Palette stripes fill like a chart ───────────────────────── */
const I27_COLS = ["#ff6b4a", "#ffb347", "#ffe066", "#5ad19a", "#3fb6ff", "#7b6cff", "#f06bd0"];
const I27_MID = [0.42, 0.7, 0.28, 0.58, 0.81, 0.36, 0.64];
const I27_DUR = [1.0, 0.7, 1.3, 0.85, 0.6, 1.15, 0.9];
function I27() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const base = el.querySelector<HTMLElement>(".i27-base")!;
    const bars = all(el, ".i27-bar");
    const lines = all(el, ".i27-line");
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.2 });
    tl.set(base, { autoAlpha: 1 });
    tl.set(bars, { scaleY: 0, yPercent: 0, transformOrigin: "50% 100%" });
    tl.set(lines, { yPercent: 110 });
    // first climb: a bar chart (each to its own height), then each finishes at its own speed
    bars.forEach((b, i) => {
      tl.to(b, { scaleY: I27_MID[i], duration: I27_DUR[i] * 0.7, ease: "power2.out" }, 0.1 + i * 0.04);
      tl.to(b, { scaleY: 1, duration: I27_DUR[i] * 0.8, ease: "power2.inOut" }, 0.1 + I27_DUR[i] * 0.7 + 0.15);
    });
    tl.to({}, { duration: 0.2 });
    tl.set(base, { autoAlpha: 0 });
    tl.to(bars, { yPercent: -100, duration: 0.85, ease: "power4.inOut", stagger: 0.05 });
    tl.to(lines, { yPercent: 0, duration: 0.8, ease: "power3.out", stagger: 0.08 }, "-=0.45");
    tl.to({}, { duration: 0.3 });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,179,71,.34)" g2="rgba(123,108,255,.26)">
      <div className="absolute inset-0 px-[4%] py-[3.5%]">
        <MiniNav brand="Palette Club" links={["Paints", "Colour lab", "Stockists"]} />
        <div className="absolute inset-x-[4%] top-[26%] text-center">
          <h3 className="text-[clamp(48px,6.4vw,98px)] leading-[0.95]" style={{ fontFamily: F.fr, fontWeight: 600 }}>
            <span className="block overflow-hidden">
              <span className="i27-line inline-block">Colour, by</span>
            </span>
            <span className="block overflow-hidden">
              <span className="i27-line inline-block italic text-[#ffb347]">the litre.</span>
            </span>
          </h3>
          <p className="mx-auto mt-5 max-w-[46ch] overflow-hidden text-[15px] text-white/65">
            <span className="i27-line inline-block">Seven new matt shades for walls and wood. Tester pots ₹ 450.</span>
          </p>
        </div>
      </div>
      <div className="i27-base b3g5-hide absolute inset-0 z-10 bg-[#0d0d12]">
        <div className="absolute inset-x-0 top-1/4 border-t border-dashed border-white/10" />
        <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-white/10" />
        <div className="absolute inset-x-0 top-3/4 border-t border-dashed border-white/10" />
        <p className="absolute left-[3%] top-[5%] text-[13px] uppercase tracking-[0.24em] text-white/55">Mixing the palette</p>
      </div>
      <div className="pointer-events-none absolute inset-0 z-20 flex">
        {I27_COLS.map((c, i) => (
          <div key={c} className="i27-bar h-full flex-1" style={{ background: c, transform: "scaleY(0)", transformOrigin: "50% 100%" }} />
        ))}
      </div>
    </Stage>
  );
}

/* ───────────────────────── I28 · Greeting cycle preloader ───────────────────────── */
const I28_WORDS = ["Hello", "Namaste", "Hola", "Bonjour", "Ciao", "Olá", "Hallo", "Vanakkam", "Salaam", "Hej"];
function I28() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const panel = el.querySelector<HTMLElement>(".i28-panel")!;
    const words = all(el, ".i28-w");
    const lines = all(el, ".i28-line");
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.2 });
    tl.set(panel, { autoAlpha: 1, yPercent: 0 });
    tl.set(words, { autoAlpha: 0 });
    tl.set(lines, { yPercent: 110 });
    tl.fromTo(words[0], { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" }, 0.05);
    let t = 0.55;
    words.forEach((w, i) => {
      if (i === 0) return;
      tl.set(words[i - 1], { autoAlpha: 0 }, t);
      tl.set(w, { autoAlpha: 1 }, t);
      t += 0.15;
    });
    tl.to({}, { duration: 0.2 }, t);
    tl.to(panel, { yPercent: -100, duration: 0.9, ease: "power4.inOut" });
    tl.to(lines, { yPercent: 0, duration: 0.8, ease: "power3.out", stagger: 0.08 }, "-=0.5");
    tl.to({}, { duration: 0.3 });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,77,109,.32)" g2="rgba(255,213,154,.24)">
      <div className="absolute inset-0 px-[4%] py-[3.5%]">
        <MiniNav brand="Aara Stays" links={["Homes", "Guides", "Host"]} />
        <div className="absolute bottom-[12%] left-[4%] right-[4%] grid grid-cols-[1.2fr_1fr] items-end gap-10">
          <h3 className="text-[clamp(46px,6vw,92px)] leading-[0.95]" style={{ fontFamily: F.is }}>
            <span className="block overflow-hidden">
              <span className="i28-line inline-block">A home in</span>
            </span>
            <span className="block overflow-hidden">
              <span className="i28-line inline-block italic text-[#ffb3a0]">every language.</span>
            </span>
          </h3>
          <div className="h-[clamp(160px,26vh,260px)] overflow-hidden rounded-[14px]">
            <div className="i28-line h-full">
              <Img i={1} w={900} h={520} label="GOA · ₹ 9,800 / NIGHT" />
            </div>
          </div>
        </div>
      </div>
      <div className="i28-panel b3g5-hide absolute inset-0 z-20 grid place-items-center bg-[#16090d]">
        <div className="relative text-[clamp(56px,7vw,108px)] leading-none" style={{ fontFamily: F.fr, fontWeight: 500 }}>
          {I28_WORDS.map((w, i) => (
            <span key={w} className={`i28-w flex items-center gap-[0.3em] whitespace-nowrap ${i === 0 ? "relative" : "absolute left-1/2 top-0 b3g5-hide"}`} style={i ? { transform: "translateX(-50%)" } : undefined}>
              <span className="inline-block h-[0.16em] w-[0.16em] rounded-full bg-[#ff4d6d]" />
              {w}
            </span>
          ))}
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── I29 · Split shutter preloader ───────────────────────── */
// Directions: left / right halves, then top / bottom halves (the loop alternates the two).
function ShutterFace() {
  return (
    <div className="absolute inset-0 bg-[#e9e4da] text-[#141414]">
      <p className="absolute left-[4%] top-[6%] text-[13px] uppercase tracking-[0.24em] text-black/55">Halden Home · loading 24 images</p>
      <p className="absolute right-[4%] top-[6%] text-[13px] uppercase tracking-[0.24em] text-black/55">Est. 2019</p>
      <div className="absolute inset-0 grid place-items-center">
        <span className="i29-n text-[clamp(110px,15vw,220px)] font-[700] leading-none tracking-[-0.04em] tabular-nums" style={{ fontFamily: F.sg }}>
          100
        </span>
      </div>
    </div>
  );
}
function I29() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const lr = all(el, ".i29-lr");
    const tb = all(el, ".i29-tb");
    const seams = all(el, ".i29-seam");
    const lines = all(el, ".i29-line");
    const nums = all(el, ".i29-n");
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.2 });
    const cycle = (halves: HTMLElement[], seam: HTMLElement, horizontal: boolean) => {
      const at = tl.duration();
      tl.set(halves, { autoAlpha: 1, xPercent: 0, yPercent: 0 }, at);
      tl.set(seam, { autoAlpha: 1, scaleX: horizontal ? 1 : 0, scaleY: horizontal ? 0 : 1 }, at);
      tl.set(lines, { yPercent: 110 }, at);
      count(tl, nums, 1.15, at + 0.05);
      tl.to(seam, horizontal ? { scaleY: 1, duration: 0.35, ease: "power2.inOut" } : { scaleX: 1, duration: 0.35, ease: "power2.inOut" }, at + 1.0);
      tl.to(halves[0], horizontal ? { xPercent: -100, duration: 1.0, ease: "power4.inOut" } : { yPercent: -100, duration: 1.0, ease: "power4.inOut" }, at + 1.45);
      tl.to(halves[1], horizontal ? { xPercent: 100, duration: 1.0, ease: "power4.inOut" } : { yPercent: 100, duration: 1.0, ease: "power4.inOut" }, at + 1.45);
      tl.to(seam, { autoAlpha: 0, duration: 0.2 }, at + 1.45);
      tl.to(lines, { yPercent: 0, duration: 0.8, ease: "power3.out", stagger: 0.08 }, at + 1.95);
      tl.set(halves, { autoAlpha: 0 }, at + 2.5);
      tl.to({}, { duration: 0.3 }, at + 2.75);
    };
    cycle(lr, seams[0], true);
    cycle(tb, seams[1], false);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,213,154,.32)" g2="rgba(79,141,255,.22)">
      <div className="absolute inset-0 px-[4%] py-[3.5%]">
        <MiniNav brand="Halden Home" links={["Living", "Dining", "Outdoor"]} />
        <div className="absolute inset-x-[4%] bottom-[10%] top-[18%] grid grid-cols-[1fr_1.1fr] items-end gap-[4%]">
          <div>
            <h3 className="text-[clamp(44px,5.4vw,84px)] leading-[0.95] tracking-[-0.01em]" style={{ fontFamily: F.fr, fontWeight: 500 }}>
              <span className="block overflow-hidden">
                <span className="i29-line inline-block">Made to</span>
              </span>
              <span className="block overflow-hidden">
                <span className="i29-line inline-block italic text-[#ffd59a]">sit with.</span>
              </span>
            </h3>
            <p className="mt-4 overflow-hidden text-[15px] text-white/65">
              <span className="i29-line inline-block">Oak lounge chair, hand-oiled · ₹ 46,000</span>
            </p>
          </div>
          <div className="h-full overflow-hidden rounded-[12px]">
            <Img i={3} w={900} h={800} />
          </div>
        </div>
      </div>
      {/* left / right pair */}
      <div className="i29-lr b3g5-hide absolute inset-y-0 left-0 z-20 w-1/2 overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-[200%]">
          <ShutterFace />
        </div>
      </div>
      <div className="i29-lr b3g5-hide absolute inset-y-0 left-1/2 z-20 w-1/2 overflow-hidden">
        <div className="absolute inset-y-0 left-[-100%] w-[200%]">
          <ShutterFace />
        </div>
      </div>
      {/* top / bottom pair */}
      <div className="i29-tb b3g5-hide absolute inset-x-0 top-0 z-20 h-1/2 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[200%]">
          <ShutterFace />
        </div>
      </div>
      <div className="i29-tb b3g5-hide absolute inset-x-0 top-1/2 z-20 h-1/2 overflow-hidden">
        <div className="absolute inset-x-0 top-[-100%] h-[200%]">
          <ShutterFace />
        </div>
      </div>
      <div className="i29-seam b3g5-hide pointer-events-none absolute inset-y-0 left-1/2 z-30 ml-[-1px] w-[2px] bg-[#141414]" style={{ transform: "scaleY(0)" }} />
      <div className="i29-seam b3g5-hide pointer-events-none absolute inset-x-0 top-1/2 z-30 mt-[-1px] h-[2px] bg-[#141414]" style={{ transform: "scaleX(0)" }} />
    </Stage>
  );
}

/* ───────────────────────── I30 · Word beats then curved curtain ───────────────────────── */
const I30_WORDS = ["Grown.", "Pressed.", "Poured."];
function I30() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const light = el.querySelector<HTMLElement>(".i30-light")!;
    const words = all(el, ".i30-w");
    const path = el.querySelector<SVGPathElement>(".i30-path")!;
    const lines = all(el, ".i30-line");
    // one band: top edge (curved by tc) to bottom edge (curved by bc), in a 0–100 box stretched over the frame
    const c = { top: 100, tc: 0, bot: 100, bc: 0 };
    const draw = () => path.setAttribute("d", `M0 ${c.top} Q50 ${c.top - c.tc} 100 ${c.top} L100 ${c.bot} Q50 ${c.bot + c.bc} 0 ${c.bot} Z`);
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.2, onUpdate: draw });
    tl.set(light, { autoAlpha: 1 });
    tl.set(words, { autoAlpha: 0, y: 24 });
    tl.set(c, { top: 100, tc: 0, bot: 100, bc: 0 });
    tl.set(lines, { yPercent: 110 });
    words.forEach((w, i) => {
      const at = 0.1 + i * 0.55;
      tl.to(w, { autoAlpha: 1, y: 0, duration: 0.25, ease: "power2.out" }, at);
      tl.to(w, { autoAlpha: 0, y: -24, duration: 0.22, ease: "power2.in" }, at + 0.33);
    });
    // the dark curtain rises with a curved top that flattens as it lands (≈1.2 s)
    tl.addLabel("rise", 0.1 + I30_WORDS.length * 0.55);
    tl.to(c, { top: 0, duration: 1.2, ease: "power3.inOut" }, "rise");
    tl.to(c, { tc: 22, duration: 0.6, ease: "power2.out" }, "rise");
    tl.to(c, { tc: 0, duration: 0.6, ease: "power2.in" }, "rise+=0.6");
    tl.set(light, { autoAlpha: 0 });
    // …then lifts off the top, its lower edge sagging and flattening, to reveal the page
    tl.to(c, { bot: 0, duration: 1.0, ease: "power3.inOut" }, "+=0.05");
    tl.to(c, { bc: 16, duration: 0.5, ease: "power2.out" }, "<");
    tl.to(c, { bc: 0, duration: 0.5, ease: "power2.in" }, "<0.5");
    tl.to(lines, { yPercent: 0, duration: 0.8, ease: "power3.out", stagger: 0.08 }, "<-0.1");
    tl.to({}, { duration: 0.3 });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(24,196,143,.32)" g2="rgba(255,213,154,.22)" top={0.3}>
      <div className="absolute inset-0 bg-[#0b1611] px-[4%] py-[3.5%]">
        <MiniNav brand="Olivar Groves" links={["Oils", "Harvest", "Gifts"]} />
        <div className="absolute inset-x-[4%] bottom-[10%] top-[20%] grid grid-cols-[1.1fr_1fr] items-center gap-[4%]">
          <div>
            <p className="overflow-hidden text-[13px] uppercase tracking-[0.22em] text-[#c8ff8a]">
              <span className="i30-line inline-block">First cold press · 2026</span>
            </p>
            <h3 className="mt-3 text-[clamp(46px,5.8vw,90px)] leading-[0.95]" style={{ fontFamily: F.is }}>
              <span className="block overflow-hidden">
                <span className="i30-line inline-block">Green gold,</span>
              </span>
              <span className="block overflow-hidden">
                <span className="i30-line inline-block italic text-[#d9f0b0]">bottled young.</span>
              </span>
            </h3>
            <p className="mt-4 overflow-hidden text-[15px] text-white/65">
              <span className="i30-line inline-block">Single-estate extra virgin, 500 ml · ₹ 1,450</span>
            </p>
          </div>
          <div className="h-full overflow-hidden rounded-[14px]">
            <Img i={2} w={800} h={700} />
          </div>
        </div>
      </div>
      <div className="i30-light b3g5-hide absolute inset-0 z-20 grid place-items-center bg-[#efe9df] text-[#1a1a17]">
        <div className="relative text-[clamp(60px,7.4vw,116px)] leading-none" style={{ fontFamily: F.is }}>
          {I30_WORDS.map((w, i) => (
            <span key={w} className={`i30-w block whitespace-nowrap ${i === 0 ? "relative" : "absolute left-0 top-0 b3g5-hide"}`}>
              {w}
            </span>
          ))}
        </div>
        <p className="absolute bottom-[6%] left-1/2 -translate-x-1/2 text-[13px] uppercase tracking-[0.26em] text-black/50">Olivar Groves</p>
      </div>
      <svg className="pointer-events-none absolute inset-0 z-30 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <path className="i30-path" d="M0 100 Q50 100 100 100 L100 100 Q50 100 0 100 Z" fill="#101311" />
      </svg>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  {
    code: "I20",
    name: "Photo stack deals into the grid",
    how: "A rotated photo stack sits on the loader; on ready each photo flies to its grid slot (Flip.fit), unrotating with random delays (2nd loop: spring overshoot) while the title spreads from the centre.",
    kind: "play",
    C: I20,
  },
  {
    code: "I21",
    name: "Flash-built stack spreads to grid",
    how: "Photos hard-cut in on top of each other every 80 ms into a centred, slightly rotated stack, then the stack spreads out into the page grid (Flip.fit).",
    kind: "play",
    C: I21,
  },
  {
    code: "I22",
    name: "Photo grid, one grows to hero",
    how: "Small photos pop into a grid with the counter; when done all but one fly out and the last grows into the hero image's place (Flip.fit, not a portal).",
    kind: "play",
    C: I22,
  },
  {
    code: "I23",
    name: "Image trail collapses into hero",
    how: "A steps(14) counter, then stacked image copies spread into a trail while title clones turn in on Y from 160°, and the trail collapses into one hero image.",
    kind: "play",
    C: I23,
  },
  {
    code: "I24",
    name: "Logo pieces lock together",
    how: "The mark's four shapes slide and spin in from different sides and lock (stagger, expo.out), hold with a small pulse, then lift away as the hero arrives.",
    kind: "play",
    C: I24,
  },
  {
    code: "I25",
    name: "Burst-and-rewind assemble",
    how: "Logo shards and letters are flung off-frame with Physics2D (velocity + gravity); the burst plays in reverse so they fly back and lock into the logo (~1.5 s).",
    kind: "play",
    C: I25,
  },
  {
    code: "I26",
    name: "Split grid + ticker preloader",
    how: "A grid of panels draws in while a ticker of words and numbers runs across; at 100 the columns split apart, alternately up and down, to reveal the page.",
    kind: "play",
    C: I26,
  },
  {
    code: "I27",
    name: "Palette stripes fill like a chart",
    how: "Seven palette stripes fill from the bottom like a bar chart, each at its own speed; when all are full they slide away upward to reveal the hero.",
    kind: "play",
    C: I27,
  },
  {
    code: "I28",
    name: "Greeting cycle preloader",
    how: "The preloader flashes 'Hello' in ten languages, ~0.15 s each, then the panel slides up to reveal the page.",
    kind: "play",
    C: I28,
  },
  {
    code: "I29",
    name: "Split shutter preloader",
    how: "The counting loader splits along a centre seam and the halves slide apart (power4.inOut, ~1 s); loops left/right, then top/bottom.",
    kind: "play",
    C: I29,
  },
  {
    code: "I30",
    name: "Word beats then curved curtain",
    how: "Short words fade through on a light screen, then a dark curtain with a curved top rises (SVG path curve → flat) and lifts off to reveal the page.",
    kind: "play",
    C: I30,
  },
];
