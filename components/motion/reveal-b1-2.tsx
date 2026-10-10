"use client";

// MOTION-MENU M87 · M88 · M89 (reveal, batch 1 group 2). Small focused demos for /lab/motion.
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";
import { scene, useScrub } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const GROTESK = "Space Grotesk Variable, system-ui, sans-serif";
const SERIF = "Fraunces Variable, Georgia, serif";

/** A large soft glow that drifts forever (CSS only), so the stage never freezes. Stops in ?static=1 / reduced motion. */
function Glow({ code, color = "#4f8dff" }: { code: string; color?: string }) {
  const c = `${code}-glow`;
  return (
    <>
      <style>{`
.${c}{position:absolute;inset:-20%;pointer-events:none;background:radial-gradient(40% 45% at 50% 50%, ${color}66, transparent 70%);animation:${c}-k 3.2s linear infinite alternate}
@keyframes ${c}-k{from{transform:translate3d(-14%,-6%,0) scale(1)}to{transform:translate3d(14%,8%,0) scale(1.15)}}
html.is-static .${c}{animation:none}
html.is-static {.${c}{animation:none}}
`}</style>
      <div className={c} aria-hidden />
    </>
  );
}

/* ------------------------------------------------------------------ M87 */
// Variant of M7 (layer parallax): here the TITLE never moves; only the image columns travel, each at its own
// data-speed, and two of the columns sit above the title so their images cross over it.
const COLS = [
  { x: "3%", speed: 0.75, over: false, imgs: [0, 2, 1, 3] },
  { x: "27%", speed: 1.3, over: true, imgs: [1, 3, 0, 2] },
  { x: "53%", speed: 0.95, over: false, imgs: [2, 0, 3, 1] },
  { x: "77%", speed: 1.15, over: true, imgs: [3, 1, 2, 0] },
];
function M87() {
  const root = useRef<HTMLDivElement>(null);
  useScrub(
    root,
    (p) => {
      const el = root.current;
      if (!el) return;
      const h = el.offsetHeight;
      el.querySelectorAll<HTMLElement>("[data-speed]").forEach((col) => {
        const s = Number(col.dataset.speed);
        const travel = (h + col.offsetHeight) * s;
        gsap.set(col, { y: h * 0.35 - p * travel });
      });
    },
    { finalValue: 0.5 },
  );
  return (
    <div ref={root} className="relative h-full w-full overflow-hidden rounded-[22px] bg-[#0a0d16]">
      <Glow code="m87" color="#ff7a4d" />
      <h3
        className="absolute inset-0 z-10 grid place-items-center text-center text-[clamp(56px,9vw,150px)] font-[600] leading-[0.9] tracking-[-0.03em] text-[#f4ede2]"
        style={{ fontFamily: SERIF }}
      >
        <span>
          Quiet
          <br />
          <em className="font-[400] text-[#ffb08a]">Objects</em>
        </span>
      </h3>
      {COLS.map((c, ci) => (
        <div key={ci} data-speed={c.speed} className={`absolute top-0 flex w-[20%] flex-col gap-5 ${c.over ? "z-20" : "z-0"}`} style={{ left: c.x }}>
          <span className="self-start rounded-full bg-black/50 px-2.5 py-1 text-[12px] tabular-nums text-white/70" style={{ fontFamily: GROTESK }}>
            data-speed {c.speed}
          </span>
          {c.imgs.map((i, k) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={k} src={scene(i, 600, 760)} alt="" className={`w-full rounded-[14px] object-cover shadow-2xl ${c.over ? "" : "opacity-80"}`} style={{ aspectRatio: k % 2 ? "4/5" : "3/4" }} draggable={false} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ M88 */
// Variant of M40 (sticky stacking cards): every card that gets covered tilts back in 3D and recedes in Z,
// so the stack reads as a real pile instead of flat cards sliding over each other.
const SERVICES = [
  { n: "01", t: "Brand identity", d: "Name, mark and voice", p: "from ₹2,40,000", i: 0 },
  { n: "02", t: "Packaging", d: "Boxes, labels, unboxing", p: "from ₹1,80,000", i: 1 },
  { n: "03", t: "Product film", d: "Hero spots and loops", p: "from ₹3,20,000", i: 3 },
  { n: "04", t: "Launch site", d: "Shop, story, motion", p: "from ₹2,90,000", i: 2 },
];
function M88() {
  const root = useRef<HTMLDivElement>(null);
  useScrub(root, (p) => {
    const el = root.current;
    if (!el) return;
    const cards = Array.from(el.querySelectorAll<HTMLElement>(".m88-card"));
    const n = cards.length;
    const enter = cards.map((_, i) => (i === 0 ? 1 : gsap.utils.clamp(0, 1, p * (n - 1) - (i - 1))));
    cards.forEach((card, i) => {
      // how many cards (fractionally) lie on top of this one
      const depth = enter.slice(i + 1).reduce((a, b) => a + b, 0);
      gsap.set(card, {
        yPercent: (1 - enter[i]) * 120,
        y: -depth * 22,
        rotationX: -10 * Math.min(depth, 1.6),
        z: -110 * depth,
        filter: `brightness(${1 - Math.min(depth, 3) * 0.18})`,
      });
    });
  });
  return (
    <div ref={root} className="relative h-full w-full overflow-hidden rounded-[22px] bg-[#0b0f18]">
      <Glow code="m88" />
      <div className="absolute inset-0 grid place-items-center" style={{ perspective: "1100px" }}>
        <div className="relative h-[min(56vh,440px)] w-[min(760px,82%)]" style={{ transformStyle: "preserve-3d" }}>
          {SERVICES.map((s, i) => (
            <article
              key={s.n}
              className="m88-card absolute inset-0 grid grid-cols-[1.1fr_1fr] overflow-hidden rounded-[22px] border border-white/10 bg-[#121827] shadow-[0_30px_80px_rgba(0,0,0,.55)]"
              style={{ transformOrigin: "50% 0%", zIndex: i + 1 }}
            >
              <div className="flex flex-col justify-between p-[clamp(20px,3vw,40px)]">
                <span className="text-[14px] tabular-nums text-[#4f8dff]" style={{ fontFamily: GROTESK }}>
                  {s.n} / 04
                </span>
                <div>
                  <h4 className="text-[clamp(32px,3.6vw,56px)] font-[600] leading-[0.95] tracking-[-0.02em]" style={{ fontFamily: GROTESK }}>
                    {s.t}
                  </h4>
                  <p className="mt-3 text-[15px] text-white/60">{s.d}</p>
                  <p className="mt-5 text-[15px] font-[650] text-white">{s.p}</p>
                </div>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={scene(s.i, 700, 800)} alt="" className="h-full w-full object-cover" draggable={false} />
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ M89 */
// Variant of M34 (stagger group reveal): ScrollTrigger.batch groups every card that enters in the same tick and
// staggers just that group. The demo feed scrolls by itself in slow drifts and fast bursts, so you can see small
// and big groups form; each new group flashes its size in the counter.
const ITEMS = ["Linen shirt", "Field jacket", "Wool scarf", "Canvas tote", "Desert boot", "Knit polo", "Cord trouser", "Overshirt"];
function M89() {
  const scroller = useRef<HTMLDivElement>(null);
  const badge = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const sc = scroller.current;
    if (!sc || prefersReducedMotion()) return;
    let on = false;
    let groups = 0;
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".m89-card", sc);
      const hide = (els: Element[]) => gsap.set(els, { opacity: 0, y: 60, scale: 0.9, overwrite: true });
      hide(cards);
      const show = (els: Element[]) => {
        groups++;
        if (badge.current) {
          badge.current.textContent = `group ${groups} · ${els.length} card${els.length > 1 ? "s" : ""}`;
          gsap.fromTo(badge.current, { scale: 1.15, color: "#ffffff" }, { scale: 1, color: "#9fd8ff", duration: 0.5, overwrite: true });
        }
        gsap.to(els, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out", stagger: 0.08, overwrite: true });
      };
      ScrollTrigger.batch(cards, {
        scroller: sc,
        start: "top 96%",
        end: "bottom 4%",
        onEnter: show,
        onEnterBack: show,
        onLeave: hide,
        onLeaveBack: hide,
      });
    }, sc);
    // auto-scroll: slow drift, then a fast burst (bigger batches), wrap at the end
    const tick = (time: number, dt: number) => {
      if (!on) return;
      const burst = time % 2.2 > 1.5;
      sc.scrollTop += (burst ? 900 : 70) * (dt / 1000);
      if (sc.scrollTop >= sc.scrollHeight - sc.clientHeight - 1) sc.scrollTop = 0;
    };
    gsap.ticker.add(tick);
    const io = new IntersectionObserver(([e]) => (on = e.isIntersecting));
    io.observe(sc);
    return () => {
      io.disconnect();
      gsap.ticker.remove(tick);
      ctx.revert();
    };
  }, []);
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[22px] bg-[#0b0f18]">
      <Glow code="m89" color="#18c48f" />
      <span
        ref={badge}
        className="absolute right-5 top-4 z-10 rounded-full border border-white/15 bg-black/60 px-3 py-1.5 text-[13px] tabular-nums text-[#9fd8ff]"
        style={{ fontFamily: GROTESK }}
      >
        ScrollTrigger.batch
      </span>
      <div ref={scroller} data-lenis-prevent className="m89-scroll relative h-full overflow-y-auto px-[4%] py-14" style={{ scrollbarWidth: "none" }}>
        <div className="grid grid-cols-4 gap-5">
          {Array.from({ length: 40 }, (_, i) => (
            <article key={i} className="m89-card overflow-hidden rounded-[16px] border border-white/10 bg-[#121827]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={scene(i % 4, 480, 300)} alt="" className="aspect-[16/10] w-full object-cover" draggable={false} />
              <div className="flex items-baseline justify-between px-4 py-3 text-[14px]">
                <span className="font-[600]">{ITEMS[i % ITEMS.length]}</span>
                <span className="tabular-nums text-white/60">₹{(2490 + ((i * 730) % 5200)).toLocaleString("en-IN")}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M87", name: "Images pass a fixed title", how: "The title stays put in the centre; image columns scroll past at their own data-speed, two of them crossing over it (scrub).", kind: "scrub", C: M87 },
  { code: "M88", name: "Stacking cards tilt back in 3D", how: "Cards slide up and stack; each covered card tilts back (rotateX −10°) and recedes in Z, a 3D pile (scrub).", kind: "scrub", C: M88 },
  { code: "M89", name: "Batched viewport stagger", how: "ScrollTrigger.batch groups cards entering in the same tick and staggers each group in (y 60, scale .9 → 1).", kind: "play", C: M89 },
];
