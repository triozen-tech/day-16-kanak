"use client";

// Scroll motions, batch 2 · group 1 (MOTION-MENU M146). Small focused demo for /lab/motion, rebuilt in GSAP from the idea only.
// Follows the scroll linearly over the whole panel, plus a CSS glow loop that never stops; ?static=1 shows the hero state.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import type { Flip as FlipT } from "gsap/Flip";
import { gsap, loadPlugin, prefersReducedMotion } from "@/lib/gsap";
import { scene, useScrub } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = { sg: "Space Grotesk Variable", sy: "Syne Variable" };

const CSS = `
.b2s1-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 32% 38%,var(--g1,rgba(79,141,255,.42)),transparent 70%),radial-gradient(34% 40% at 70% 66%,var(--g2,rgba(255,122,89,.2)),transparent 70%);animation:b2s1-drift 6s linear infinite alternate;will-change:transform}
@keyframes b2s1-drift{0%{transform:translate3d(-7%,-5%,0) scale(1)}100%{transform:translate3d(7%,6%,0) scale(1.15)}}
html.is-static .b2s1-glow{animation:none}
html.is-static {.b2s1-glow{animation:none}}
`;

function Stage({ r, children, g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; g1?: string; g2?: string }) {
  return (
    <div ref={r} className="relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0f1c] text-[#eaf5ff]">
      <style href="b2s1-css" precedence="default">
        {CSS}
      </style>
      <div className="b2s1-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/* ───────────────────────── M146 · Giant wordmark docks into nav (scrub, Flip.fit) ───────────────────────── */
const BRAND = "Aurelle";
function M146() {
  const root = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLHeadingElement>(null);
  const slot = useRef<HTMLSpanElement>(null);
  const nav = useRef<HTMLDivElement>(null);
  const sub = useRef<HTMLParagraphElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const prog = useRef(0);
  const fit = useRef<gsap.core.Tween | null>(null);

  const apply = (p: number) => {
    prog.current = p;
    fit.current?.progress(p); // the wordmark shrinks + slides up into the nav slot, linearly over the whole panel
    if (sub.current) {
      sub.current.style.opacity = String(Math.max(0, 1 - p * 1.6));
      sub.current.style.transform = `translateY(${-p * 40}px)`;
    }
    if (nav.current) nav.current.style.backgroundColor = `rgba(10,15,28,${0.15 + 0.7 * p})`;
    if (card.current) {
      card.current.style.opacity = String(p);
      card.current.style.transform = `translateY(${(1 - p) * 120}px)`;
    }
  };

  useEffect(() => {
    const el = mark.current;
    const to = slot.current;
    if (!el || !to) return;
    let dead = false;
    let Flip: typeof FlipT | null = null;
    const build = () => {
      if (!Flip || dead) return;
      fit.current?.kill();
      gsap.set(el, { clearProps: "transform" });
      // ghost copy in the slot has the same text + font, so the fit scales uniformly
      fit.current = Flip.fit(el, to, { scale: true, duration: 1, ease: "none", paused: true }) as gsap.core.Tween | null;
      fit.current?.progress(prog.current);
    };
    Promise.all([document.fonts.ready, loadPlugin("Flip")]).then(([, f]) => {
      Flip = f;
      build();
    });
    const onResize = () => build();
    window.addEventListener("resize", onResize);
    return () => {
      dead = true;
      window.removeEventListener("resize", onResize);
      fit.current?.kill();
      fit.current = null;
      gsap.set(el, { clearProps: "transform" });
    };
  }, []);

  useScrub(root, apply, { finalValue: prefersReducedMotion() ? 0 : 1 });

  return (
    <Stage r={root} g1="rgba(79,141,255,.32)" g2="rgba(224,145,63,.22)">
      {/* nav bar with the empty logo slot */}
      <div ref={nav} className="absolute inset-x-0 top-0 z-20 flex h-16 items-center justify-between border-b border-white/10 px-7" style={{ backgroundColor: "rgba(10,15,28,.15)" }}>
        <span ref={slot} className="text-[30px] font-[800] uppercase leading-none tracking-[-0.03em] opacity-0" style={{ fontFamily: F.sy }} aria-hidden>
          {BRAND}
        </span>
        <nav className="flex gap-8 text-[14px] text-white/75" style={{ fontFamily: F.sg }}>
          <span>Coats</span>
          <span>Knitwear</span>
          <span>Journal</span>
          <span>Stores</span>
        </nav>
        <span className="rounded-full border border-white/20 px-4 py-1.5 text-[13px]" style={{ fontFamily: F.sg }}>
          Bag (2)
        </span>
      </div>

      {/* hero: the full-width wordmark */}
      <div className="absolute inset-x-0 top-16 bottom-0 flex flex-col items-center justify-center">
        <h3 ref={mark} className="relative z-30 whitespace-nowrap text-[clamp(80px,11vw,176px)] font-[800] uppercase leading-none tracking-[-0.03em]" style={{ fontFamily: F.sy }}>
          {BRAND}
        </h3>
        <p ref={sub} className="mt-4 text-[13px] uppercase tracking-[0.26em] text-white/65">
          Outerwear for cold coasts · from ₹12,900
        </p>
      </div>

      {/* what the hero becomes once the mark has docked */}
      <div ref={card} className="absolute inset-x-[6%] bottom-[7%] top-[22%] z-10 flex items-end gap-6" style={{ opacity: 0 }}>
        <div className="relative h-full flex-1 overflow-hidden rounded-[20px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={scene(0, 1400, 800)} alt="" className="h-full w-full object-cover" />
          <div className="absolute bottom-6 left-6">
            <p className="text-[13px] uppercase tracking-[0.2em] text-white/70">Winter 26</p>
            <p className="mt-1 text-[clamp(28px,3vw,44px)] font-[600] leading-tight" style={{ fontFamily: F.sg }}>
              The Fjord parka
            </p>
            <p className="mt-1 text-[15px] text-white/80">₹24,500</p>
          </div>
        </div>
        <div className="relative hidden h-[78%] w-[28%] overflow-hidden rounded-[20px] md:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={scene(2, 700, 900)} alt="" className="h-full w-full object-cover" />
          <p className="absolute bottom-5 left-5 text-[15px]">Merino rib knit · ₹8,900</p>
        </div>
      </div>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M146", name: "Giant wordmark docks into nav", how: "Full-width hero wordmark shrinks and slides into the nav logo slot (Flip.fit scrubbed); scroll back re-enlarges it", kind: "scrub", C: M146 },
];
