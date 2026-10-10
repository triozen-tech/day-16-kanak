"use client";

// BN · Bento layouts, batch 2 (docs/SECTION-MENU.md): BN09 pillar bento with staggered seams.
// Keeps moving while on screen (hands-free for filming) and shows its final state in ?static=1.
import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/* ───────────────────────────── BN09 · Pillar bento with staggered seams ───────────────────────────── */

// two loops with different periods (LESSONS: one alternate loop has still turning points)
const BN09_CSS = `.bn09-kb img{animation:bn09-kb 5.2s ease-in-out infinite alternate}.bn09-kb:nth-child(odd) img{animation-duration:6.6s;animation-direction:alternate-reverse}@keyframes bn09-kb{from{transform:scale(1.04)}to{transform:scale(1.15) translate(-2%,-1.5%)}}.is-static .bn09-kb img{animation:none}html.is-static {.bn09-kb img{animation:none}}`;

type Tile = { t: string; d: string; link: string; i: number; place: string; side: "l" | "c" | "r" };
const BN09_TILES: Tile[] = [
  { t: "The Bayan bookcase", d: "Seven shelves of solid teak, 2.1 m tall. From ₹68,000.", link: "Shop shelving", i: 3, place: "md:[grid-area:1/2/4/3]", side: "c" },
  { t: "Lounge chairs", d: "Cane backs, deep seats, hand-woven in Channapatna.", link: "See 6 chairs", i: 1, place: "md:[grid-area:1/1/3/2]", side: "l" },
  { t: "Floor lamps", d: "Brass and linen, warm at night.", link: "See lamps", i: 0, place: "md:[grid-area:1/3/2/4]", side: "r" },
  { t: "Side tables", d: "Mango wood, oiled by hand.", link: "See tables", i: 2, place: "md:[grid-area:3/1/4/2]", side: "l" },
  { t: "Sofas", d: "Three-seaters in washed linen, made to order in 5 weeks.", link: "Build your sofa", i: 3, place: "md:[grid-area:2/3/4/4]", side: "r" },
];

/** BN09 · Three columns, three rows: a full-height centre pillar; side columns stack 2+1 and 1+2 so the seams stagger. */
function BN09() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const tiles = Array.from(el.querySelectorAll<HTMLElement>("[data-bn09]"));
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 70%", toggleActions: "play none none reverse" } });
      tiles.forEach((t, k) => {
        const side = t.dataset.bn09;
        // snap in from the centre pillar outward: the pillar opens first, side tiles slide out of its edges
        const from =
          side === "c"
            ? { clipPath: "inset(50% 0% 50% 0% round 18px)", y: 0, x: 0 }
            : side === "l"
              ? { clipPath: "inset(0% 0% 0% 100% round 18px)", x: 70, y: k > 2 ? 30 : -30 }
              : { clipPath: "inset(0% 100% 0% 0% round 18px)", x: -70, y: k > 2 ? -30 : 30 };
        tl.fromTo(t, from, { clipPath: "inset(0% 0% 0% 0% round 18px)", x: 0, y: 0, duration: side === "c" ? 1 : 0.9, ease: "power3.out" }, side === "c" ? 0 : 0.35 + (k - 1) * 0.14);
      });
    }, el);
    return () => ctx.revert();
  }, []);
  return (
    <Sec innerRef={r} theme="stone" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <style>{BN09_CSS}</style>
      <div className="grid grid-cols-1 items-end gap-6 md:grid-cols-12">
        <H className="text-[clamp(44px,5.6vw,96px)] md:col-span-7">Rooms, built in teak.</H>
        <div className="md:col-span-5 md:pb-2">
          <P className="max-w-[40ch]">Five lines of furniture from one workshop in Mysuru. Reclaimed teak, cane and brass, delivered and set up by the people who made it.</P>
          <div className="mt-6 flex flex-wrap gap-4">
            <Btn>Shop all furniture</Btn>
            <Btn kind="ghost">Visit the workshop</Btn>
          </div>
        </div>
      </div>
      <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 gap-[clamp(10px,1.2vw,16px)] md:grid-cols-3 md:grid-rows-[repeat(3,clamp(200px,17vw,250px))]">
        {BN09_TILES.map((t) => (
          <article key={t.t} data-bn09={t.side} className={`sx-card group flex min-h-[260px] min-w-0 flex-col overflow-hidden md:min-h-0 ${t.place}`} data-cursor="View">
            <div className="bn09-kb relative min-h-[120px] flex-1 overflow-hidden">
              <Pic i={t.i} ratio="auto" round={false} className="absolute inset-0 h-full w-full" />
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(180deg,transparent,var(--sx-surface))]" />
            </div>
            <div className="px-[clamp(18px,1.8vw,28px)] pb-[clamp(16px,1.6vw,24px)] pt-2">
              <h3 className={`sx-display font-[700] leading-[1.05] tracking-[-0.01em] ${t.side === "c" ? "text-[clamp(26px,2.4vw,38px)]" : "text-[clamp(20px,1.7vw,26px)]"}`}>{t.t}</h3>
              <p className="mt-1.5 max-w-[40ch] text-[14px] leading-snug text-[var(--sx-muted)]">{t.d}</p>
              <span className="mt-3 inline-flex items-center gap-2 text-[14px] font-[650] text-[var(--sx-accent)]">
                {t.link} <span className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </div>
          </article>
        ))}
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "BN09", name: "Pillar bento with staggered seams", motion: "M34", C: BN09 }];
