"use client";

// MN · Menu layouts, batch 6 (docs/SECTION-MENU.md). Dishes, prices and the cook are invented.
import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Pic, Price, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Scoped keyframes (off in ?static=1 and with reduced motion). The glow is the CSS-only never-frozen safety net. */
const MN_CSS = `
.mnb6-glow{animation:mnb6-glow 4.4s linear infinite alternate}
@keyframes mnb6-glow{from{transform:translate(-18%,-8%) scale(.9)}to{transform:translate(20%,12%) scale(1.16)}}
.mnb6-sway{animation:mnb6-sway 3.2s ease-in-out infinite alternate}
@keyframes mnb6-sway{from{rotate:-1.6deg}to{rotate:1.4deg}}
html.is-static .mnb6-glow,html.is-static .mnb6-sway{animation:none}
html.is-static {.mnb6-glow,.mnb6-sway{animation:none}}
`;

/* ───────────────────────── MN07 · Weekly specials + cook's note ───────────────────────── */

const MN07_DISHES = [
  { n: "Burnt-butter gnocchi", d: "Potato gnocchi, sage from the terrace, brown butter and a snow of aged Kalimpong cheese.", p: 640, tag: "Vegetarian", i: 3 },
  { n: "Goan prawn risotto", d: "Carnaroli cooked in prawn-head stock, kokum, green chilli and a squeeze of bimbli to finish.", p: 890, tag: "Until Sunday", i: 1 },
];

/** MN07 · Two featured dish cards side by side (photo, name, description, price) on the left 8 columns; on the right
 *  4 columns, a paper note card with a short handwritten-style message signed by the cook. The note tilts in and sways. */
function MN07() {
  const r = useRef<HTMLDivElement>(null);
  const note = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M18");
  useEffect(() => {
    const n = note.current;
    if (!n || prefersReducedMotion()) return;
    const tw = gsap.fromTo(
      n,
      { rotation: -16, y: 90, x: 40, opacity: 0 },
      { rotation: 0, y: 0, x: 0, opacity: 1, duration: 1.3, ease: "power3.out", delay: 0.35, scrollTrigger: { trigger: n, start: "top 85%", toggleActions: "play none none reverse" } },
    );
    return () => {
      tw.scrollTrigger?.kill();
      tw.kill();
      gsap.set(n, { clearProps: "transform,opacity" });
    };
  }, []);

  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <style>{MN_CSS}</style>
      <div aria-hidden className="mnb6-glow pointer-events-none absolute left-[10%] top-[24%] aspect-square w-[54vw] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_36%,transparent),transparent)]" />
      <div className="relative z-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <H className="max-w-[14ch] text-[clamp(48px,5.8vw,96px)]">This week, from the pass.</H>
          <P className="max-w-[36ch] pb-2">Two specials at Casa Basilico, cooked until Sunday night or until the last plate goes, whichever comes first.</P>
        </div>

        <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 items-start gap-[clamp(20px,2.4vw,40px)] md:grid-cols-12">
          {/* the two dishes */}
          <div className="grid grid-cols-1 gap-[clamp(16px,1.8vw,28px)] sm:grid-cols-2 md:col-span-8">
            {MN07_DISHES.map((x, k) => (
              <article key={x.n} data-m-card className="sx-card overflow-hidden bg-[var(--sx-surface)]">
                <div className="relative overflow-hidden">
                  <div className="fx-drift" style={{ animationDuration: k ? "5s" : "6.5s" }}>
                    <Pic i={x.i} ratio="4/3" round={false} label="" />
                  </div>
                  <span className="absolute left-4 top-4 rounded-full bg-[var(--sx-surface)] px-3 py-1.5 text-[12px] font-[650] uppercase tracking-[0.12em]">{x.tag}</span>
                </div>
                <div className="p-[clamp(20px,2vw,28px)]">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="sx-display text-[clamp(26px,2.2vw,36px)] font-[600] leading-[1.05]">{x.n}</h3>
                    <Price now={`₹${x.p}`} className="text-[18px]" />
                  </div>
                  <p className="mt-3 text-[16px] leading-relaxed text-[var(--sx-muted)]">{x.d}</p>
                </div>
              </article>
            ))}
          </div>

          {/* the cook's note */}
          <div className="md:col-span-4 md:pt-6">
            <div ref={note} className="relative">
              <div className="mnb6-sway relative origin-[50%_0] rounded-[6px] bg-[var(--sx-surface)] px-[clamp(24px,2.4vw,36px)] pb-9 pt-12 shadow-[0_40px_70px_-34px_rgba(28,24,19,.55)]" style={{ backgroundImage: "repeating-linear-gradient(180deg, transparent 0 33px, var(--sx-line) 33px 34px)", backgroundPositionY: "46px" }}>
                {/* tape */}
                <span aria-hidden className="absolute -top-3 left-1/2 h-7 w-28 -translate-x-1/2 rotate-[-3deg] bg-[color-mix(in_srgb,var(--sx-accent)_30%,transparent)]" />
                <p className="text-[13px] font-[600] uppercase tracking-[0.16em] text-[var(--sx-accent)]">From the kitchen</p>
                <p className="sx-display mt-4 text-[clamp(22px,1.8vw,27px)] italic leading-[34px]">
                  The prawns came in from Malpe at six this morning, so the risotto had to happen. The gnocchi is my nonna&apos;s, made the slow way. Order both and share.
                </p>
                <p className="sx-display mt-6 text-right text-[clamp(24px,2vw,30px)] italic leading-[34px]">— Rhea</p>
                <p className="mt-1 text-right text-[13px] text-[var(--sx-muted)]">Rhea Fernandes, head cook</p>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Btn>Reserve a table</Btn>
              <span className="text-[14px] text-[var(--sx-muted)]">Tue–Sun · 7 to 11 pm</span>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "MN07", name: "Weekly specials + cook's note", motion: "M18", C: MN07 }];
