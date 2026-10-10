"use client";

// Transitions, batch 3 · group 4 (MOTION-MENU X39–X41). Small focused demos for /lab/motion.
// Every "play" demo loops A → B → A between two simple pages inside its own frame, pauses off screen, and has a CSS-only
// glow loop that never stops. ?static=1 / reduced motion: no JS motion, the markup shows page A / the final state.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, SplitText, loadPlugin, prefersReducedMotion } from "@/lib/gsap";
import { scene, useScrub } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = {
  sg: "Space Grotesk Variable",
  fr: "Fraunces Variable",
  is: "Instrument Serif",
  sy: "Syne Variable",
  mr: "Manrope Variable",
};

const CSS = `
.b3g4t-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.42)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.2)),transparent 70%);animation:b3g4t-drift 5.8s linear infinite alternate;will-change:transform}
@keyframes b3g4t-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.x39-wheel{width:26px;height:42px;border:2px solid rgba(255,255,255,.75);border-radius:14px;position:relative}
.x39-wheel i{position:absolute;left:50%;top:9px;width:4px;height:8px;margin-left:-2px;border-radius:2px;background:#fff}
.x40-mark{animation:x40-shim 4s linear infinite alternate}
@keyframes x40-shim{0%{opacity:.55;letter-spacing:-.04em}100%{opacity:.9;letter-spacing:-.02em}}
html.is-static .b3g4t-glow,html.is-static .x40-mark{animation:none}
html.is-static {.b3g4t-glow,.x40-mark{animation:none}}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0d16] text-[#eef2ff] ${className}`}>
      <style href="b3g4t-css" precedence="default">
        {CSS}
      </style>
      <div className="b3g4t-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/** The CSS glow loop again, ON TOP of full-bleed pages (screen blend), so big image demos never freeze. */
const Sheen = ({ g1 }: { g1?: string }) => (
  <div className="b3g4t-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.45, zIndex: 35 } as CSSProperties} aria-hidden />
);

/** "play" helper: waits for fonts (+ an optional plugin), builds a looping animation in a gsap.context, plays it only
 *  while on screen, reverts on unmount. Nothing runs with prefersReducedMotion(). */
function usePlay(ref: RefObject<HTMLElement | null>, build: (root: HTMLElement, onClean: (fn: () => void) => void) => gsap.core.Animation | void, pre?: () => Promise<unknown>) {
  const b = useRef(build);
  b.current = build;
  const p = useRef(pre);
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
    Promise.all([document.fonts?.ready, p.current?.()]).then(() => {
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

/** An element's box relative to the root. */
function rel(node: Element, root: Element) {
  const a = node.getBoundingClientRect();
  const r = root.getBoundingClientRect();
  return { l: a.left - r.left, t: a.top - r.top, w: a.width, h: a.height };
}

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, className = "", style, label = "", w = 1600, h = 1000 }: { i: number; className?: string; style?: CSSProperties; label?: string; w?: number; h?: number }) => (
  <img src={scene(i, w, h, label)} alt="" className={`h-full w-full object-cover ${className}`} style={style} draggable={false} />
);

/* ───────────────────────── X39 · Wheel-gesture section slides ───────────────────────── */
const X39_PAGES = [
  { i: 0, n: "01", t: "Low tide", s: "Washed linen for slow coastal mornings.", p: "From ₹ 3,900" },
  { i: 1, n: "02", t: "Ember hour", s: "Brushed wool cut for the first cold evening.", p: "From ₹ 6,400" },
];
function X39() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(
    root,
    (el, onClean) => {
      const secs = gsap.utils.toArray<HTMLElement>(".x39-sec", el);
      const inners = secs.map((s) => s.querySelector<HTMLElement>(".x39-in")!);
      const imgs = secs.map((s) => s.querySelector<HTMLElement>(".x39-img")!);
      const subs = secs.map((s) => s.querySelectorAll<HTMLElement>(".x39-sub"));
      const chars = secs.map((s) => SplitText.create(s.querySelector(".x39-t"), { type: "chars", charsClass: "x39-ch" }).chars);
      const wheel = el.querySelector<HTMLElement>(".x39-wheel i");
      gsap.set(secs, { zIndex: (i) => 2 - i });
      gsap.set(secs[1], { autoAlpha: 0 });
      const D = 1.2;
      const tl = gsap.timeline({ repeat: -1, paused: true });
      const step = (from: number, to: number, dir: 1 | -1, label: string) => {
        // the fake gesture: the wheel dot flicks (a scroll / swipe), then one timeline swaps the sections
        tl.addLabel(label)
          .fromTo(wheel, { y: 0, autoAlpha: 1 }, { y: dir * 12, autoAlpha: 0, duration: 0.28, ease: "power2.in" })
          .set(secs[to], { autoAlpha: 1, zIndex: 3 })
          .set(secs[from], { zIndex: 2 })
          .fromTo(secs[to], { yPercent: 100 * dir }, { yPercent: 0, duration: D, ease: "power2.inOut" }, "<")
          .fromTo(inners[to], { yPercent: -100 * dir }, { yPercent: 0, duration: D, ease: "power2.inOut" }, "<")
          .fromTo(imgs[to], { yPercent: 14 * dir, scale: 1.18 }, { yPercent: 0, scale: 1.04, duration: D, ease: "power2.inOut" }, "<")
          .to(secs[from], { yPercent: -100 * dir, duration: D, ease: "power2.inOut" }, "<")
          .to(imgs[from], { yPercent: 40 * dir, duration: D, ease: "power2.inOut" }, "<")
          .fromTo(chars[to], { yPercent: 130 * dir, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.9, ease: "power3.out", stagger: { each: 0.035, from: dir > 0 ? "start" : "end" } }, `<${D * 0.35}`)
          .fromTo(subs[to], { y: 18 * dir, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, ease: "power2.out", stagger: 0.08 }, "<0.2")
          .set(wheel, { y: 0, autoAlpha: 1 })
          .set(secs[from], { autoAlpha: 0, yPercent: 0 })
          .set(imgs[from], { yPercent: 0 })
          .to({}, { duration: 0.25 });
      };
      step(0, 1, 1, "toB");
      step(1, 0, -1, "toA");
      // a real swipe / drag inside the frame also steps (Observer; page scroll is left alone)
      loadPlugin("Observer").then((Observer) => {
        if (!el.isConnected) return;
        const ob = Observer.create({
          target: el,
          type: "touch,pointer",
          tolerance: 24,
          dragMinimum: 6,
          onUp: () => go(),
          onDown: () => go(),
        });
        onClean(() => ob.kill());
      });
      const go = () => {
        const at = tl.time();
        const next = at < tl.labels.toA ? "toA" : "toB";
        tl.play(next);
      };
      return tl;
    },
    () => loadPlugin("Observer"),
  );
  return (
    <Stage r={root} g1="rgba(120,170,255,.4)">
      {X39_PAGES.map((pg, k) => (
        <section key={pg.n} className="x39-sec absolute inset-0 overflow-hidden" style={k ? { visibility: "hidden" } : undefined} aria-hidden={k > 0}>
          <div className="x39-in absolute inset-0 overflow-hidden">
            <div className="x39-img absolute inset-0" style={{ transform: "scale(1.04)" }}>
              <Img i={pg.i} />
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,15,.15),rgba(5,8,15,.7))]" />
            <div className="absolute inset-x-[6%] bottom-[12%] flex items-end justify-between gap-10">
              <div>
                <p className="x39-sub mb-3 text-[13px] uppercase tracking-[0.24em] text-white/70">Chapter {pg.n} · Saltfern Studio</p>
                <h2 className="x39-t overflow-hidden pb-[0.06em] text-[clamp(64px,8.4vw,132px)] leading-[0.95] tracking-[-0.03em]" style={{ fontFamily: F.fr, fontWeight: 500 }}>
                  {pg.t}
                </h2>
              </div>
              <div className="max-w-[300px] text-right">
                <p className="x39-sub text-[15px] text-white/80">{pg.s}</p>
                <p className="x39-sub mt-2 text-[20px] font-[600]" style={{ fontFamily: F.sg }}>
                  {pg.p}
                </p>
              </div>
            </div>
            <p className="absolute right-[6%] top-[9%] text-[13px] tracking-[0.2em] text-white/70" style={{ fontFamily: F.sg }}>
              {pg.n} / 02
            </p>
          </div>
        </section>
      ))}
      <div className="pointer-events-none absolute left-[6%] top-[8%] z-20 flex items-center gap-3 text-[13px] uppercase tracking-[0.2em] text-white/80">
        <span className="x39-wheel" aria-hidden>
          <i />
        </span>
        One gesture, one section
      </div>
      <Sheen g1="rgba(150,190,255,.35)" />
    </Stage>
  );
}

/* ───────────────────────── X40 · Footer revealed under the page ───────────────────────── */
const X40_LIFT = 58; // footer height, % of the stage: the sheet lifts exactly this much
function X40() {
  const root = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const foot = useRef<HTMLDivElement>(null);
  useScrub(
    root,
    (p) => {
      if (!sheet.current || !foot.current) return;
      gsap.set(sheet.current, { y: 0, yPercent: -X40_LIFT * p });
      gsap.set(foot.current, { yPercent: -22 * (1 - p), scale: 0.94 + 0.06 * p, opacity: 0.35 + 0.65 * p });
    },
    { finalValue: 1 },
  );
  return (
    <Stage r={root} g1="rgba(255,150,90,.42)" g2="rgba(79,141,255,.24)">
      {/* the footer: fixed in place behind the last section */}
      <footer className="absolute inset-x-0 bottom-0 overflow-hidden" style={{ height: `${X40_LIFT}%` }}>
        <div ref={foot} className="flex h-full flex-col justify-between px-[6%] pb-[3%] pt-[4%]" style={{ transformOrigin: "50% 100%" }}>
          <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-8 text-[14px] text-white/70">
            <p className="text-[clamp(20px,1.8vw,28px)] leading-tight text-white" style={{ fontFamily: F.is }}>
              Small-batch ceramics,
              <br />
              fired twice by hand.
            </p>
            {[
              ["Shop", "Tableware", "Vases", "Gift cards"],
              ["Studio", "Our kiln", "Workshops", "Journal"],
              ["Help", "Shipping", "Care guide", "Returns"],
            ].map((c) => (
              <ul key={c[0]} className="space-y-1.5">
                <li className="mb-2 text-[12px] uppercase tracking-[0.2em] text-white/45">{c[0]}</li>
                {c.slice(1).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            ))}
          </div>
          <div>
            <p className="x40-mark text-[clamp(60px,7.8vw,124px)] font-[800] uppercase leading-[0.8] text-[#ff9a62]" style={{ fontFamily: F.sy }}>
              Kilnworth
            </p>
            <div className="mt-3 flex justify-between text-[12px] text-white/45">
              <span>Concept website by Studio Halvard</span>
              <span>Sample prices · ₹ INR</span>
            </div>
          </div>
        </div>
      </footer>
      {/* the last section: a sheet that lifts off the footer */}
      <div ref={sheet} className="absolute inset-0 z-10 overflow-hidden rounded-b-[28px] bg-[#efe7da] text-[#1b1712] shadow-[0_40px_80px_rgba(0,0,0,.55)]" style={{ transform: `translateY(-${X40_LIFT}%)` }}>
        <div className="grid h-full grid-cols-[1.1fr_1fr] gap-[5%] px-[6%] py-[5%]">
          <div className="flex flex-col justify-between">
            <p className="text-[13px] uppercase tracking-[0.22em] text-[#1b1712]/55">Visit the kiln · Saturdays</p>
            <h3 className="text-[clamp(44px,5vw,80px)] leading-[0.98] tracking-[-0.02em]" style={{ fontFamily: F.fr, fontWeight: 500 }}>
              Throw your own
              <br />
              <em className="font-[400]">dinner set.</em>
            </h3>
            <div className="flex items-center gap-5">
              <span className="rounded-full bg-[#1b1712] px-6 py-3 text-[14px] font-[600] text-[#efe7da]">Book a seat · ₹ 2,400</span>
              <span className="text-[14px] text-[#1b1712]/60">3 hours · clay included</span>
            </div>
          </div>
          <div className="overflow-hidden rounded-[20px]">
            <Img i={3} w={1000} h={1000} />
          </div>
        </div>
      </div>
      <Sheen g1="rgba(255,170,110,.3)" />
    </Stage>
  );
}

/* ───────────────────────── X41 · Intro logo settles into the hero ───────────────────────── */
function X41() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const slot = el.querySelector<HTMLElement>(".x41-slot")!;
    const logo = el.querySelector<HTMLElement>(".x41-logo")!;
    const plate = el.querySelector<HTMLElement>(".x41-plate")!;
    const bar = el.querySelector<HTMLElement>(".x41-bar i")!;
    const pct = el.querySelector<HTMLElement>(".x41-pct")!;
    const bg = el.querySelector<HTMLElement>(".x41-bg")!;
    const links = el.querySelectorAll<HTMLElement>(".x41-link");
    const lines = el.querySelectorAll<HTMLElement>(".x41-line");
    // FLIP by hand: the logo's home is the nav slot (its markup position); "first" is the stage centre, big.
    const box = () => rel(slot, el);
    const dx = () => {
      const b = box();
      return el.clientWidth / 2 - (b.l + b.w / 2);
    };
    const dy = () => {
      const b = box();
      return el.clientHeight * 0.46 - (b.t + b.h / 2);
    };
    const S = () => Math.min(6.5, (el.clientWidth * 0.46) / Math.max(1, box().w));
    const n = { v: 0 };
    const tl = gsap.timeline({ repeat: -1, repeatRefresh: true, paused: true });
    // in: the loader plate comes back over the hero
    tl.fromTo(plate, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: "power1.out" })
      .to([logo, ...links], { autoAlpha: 0, duration: 0.25 }, "<")
      .set(bg, { autoAlpha: 0, scale: 1.22 })
      .set(lines, { yPercent: 110 })
      .set(n, { v: 0 })
      .set(bar, { scaleX: 0 })
      .set([bar.parentElement, pct], { autoAlpha: 1 })
      .fromTo(logo, { x: dx, y: dy, scale: () => S() * 0.9, autoAlpha: 0 }, { x: dx, y: dy, scale: S, autoAlpha: 1, duration: 0.45, ease: "power2.out" })
      // loading
      .to(bar, { scaleX: 1, duration: 0.9, ease: "power1.inOut" }, "<0.1")
      .to(n, { v: 100, duration: 0.9, ease: "power1.inOut", onUpdate: () => (pct.textContent = String(Math.round(n.v)).padStart(3, "0")) }, "<")
      .to({}, { duration: 0.12 })
      // ready: the logo never leaves, it flies home while the hero grows in around it
      .addLabel("go")
      .to([bar.parentElement, pct], { autoAlpha: 0, duration: 0.3 }, "go")
      .to(logo, { x: 0, y: 0, scale: 1, duration: 1.2, ease: "power3.inOut" }, "go")
      .to(plate, { autoAlpha: 0, duration: 0.9, ease: "power2.inOut" }, "go+=0.15")
      .to(bg, { autoAlpha: 1, scale: 1, duration: 1.2, ease: "power2.out" }, "go+=0.15")
      .to(links, { autoAlpha: 1, duration: 0.5, stagger: 0.06 }, "go+=0.8")
      .to(lines, { yPercent: 0, duration: 0.8, ease: "power3.out", stagger: 0.08 }, "go+=0.75")
      .to({}, { duration: 0.25 });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(150,120,255,.42)" g2="rgba(79,200,255,.22)">
      <div className="x41-bg absolute inset-0">
        <Img i={0} />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,15,.35),rgba(5,8,15,.1)_40%,rgba(5,8,15,.75))]" />
      </div>
      <div className="x41-plate absolute inset-0 z-10 bg-[#07080f]" style={{ visibility: "hidden" }}>
        <div className="x41-bar absolute left-1/2 top-[64%] h-[2px] w-[220px] overflow-hidden bg-white/15" style={{ marginLeft: -110 }}>
          <i className="absolute inset-0 block origin-left bg-[#a78bff]" />
        </div>
        <p className="x41-pct absolute inset-x-0 top-[68%] text-center text-[13px] tracking-[0.3em] text-white/60" style={{ fontFamily: F.sg }}>
          100
        </p>
      </div>
      <nav className="absolute inset-x-[5%] top-[7%] z-20 flex items-center justify-between">
        <span className="x41-slot inline-block">
          <span className="x41-logo inline-block text-[28px] font-[700] leading-none tracking-[-0.04em]" style={{ fontFamily: F.sg }}>
            nexora<span className="text-[#a78bff]">.</span>
          </span>
        </span>
        <ul className="flex gap-8 text-[14px] text-white/80">
          {["Platform", "Studio", "Pricing", "Sign in"].map((x) => (
            <li key={x} className="x41-link">
              {x}
            </li>
          ))}
        </ul>
      </nav>
      <div className="absolute bottom-[11%] left-[5%] z-[5]">
        {["Light that", "learns your room."].map((l) => (
          <span key={l} className="block overflow-hidden">
            <span className="x41-line block text-[clamp(54px,6.6vw,104px)] font-[600] leading-[1] tracking-[-0.035em]" style={{ fontFamily: F.sg }}>
              {l}
            </span>
          </span>
        ))}
        <p className="mt-4 text-[15px] text-white/70">Smart lamp kit from ₹ 8,900</p>
      </div>
      <Sheen g1="rgba(170,140,255,.32)" />
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  {
    code: "X39",
    name: "Wheel-gesture section slides",
    how: "One wheel/swipe gesture swaps full-screen sections: the old one slides up, the new one slides in with its image counter-moving and its title splitting in by chars (1.2 s).",
    kind: "play",
    C: X39,
  },
  {
    code: "X40",
    name: "Footer revealed under the page",
    how: "Scrub: the last section lifts off like a sheet, uncovering the footer that sits fixed behind it.",
    kind: "scrub",
    C: X40,
  },
  {
    code: "X41",
    name: "Intro logo settles into the hero",
    how: "When loading ends the big intro logo flies home to the nav (FLIP) while the hero image fades and scales up around it.",
    kind: "play",
    C: X41,
  },
];
