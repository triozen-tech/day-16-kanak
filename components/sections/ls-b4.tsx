"use client";

// LS · Listing layouts (docs/SECTION-MENU.md), batch 4. Pictures push in slowly (each at its own pace) and one card at a
// time is highlighted by itself; loops stop in ?static=1.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Hands-free cycling: steps an index every `ms` while the section is on screen (stops off screen and in ?static=1). */
function useAutoCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms = 1600) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let t: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (e.isIntersecting) t = setInterval(() => setI((v) => (v + 1) % n), ms);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, [ref, n, ms]);
  return [i, setI] as const;
}

const LS_CSS = `.ls4-pic img{animation:ls4-push var(--p,6s) ease-in-out infinite alternate;animation-delay:var(--dl,0s)}@keyframes ls4-push{from{scale:1.02;translate:-2.5% 0}to{scale:1.14;translate:2.5% -2%}}
.is-static .ls4-pic img{animation:none}
html.is-static {.ls4-pic img{animation:none}}`;

const TRIPS = [
  { s: "Jun – Sep", t: "Spiti, the cold desert", p: "₹2,40,000", d: "Eleven nights between monasteries at 4,000 m, by jeep and on foot, with a mountain doctor along.", i: 3, wide: true },
  { s: "Nov – Feb", t: "Rann under a full moon", p: "₹1,65,000", d: "White salt flats, camel trails and Kutchi embroidery villages. Tents with real beds.", i: 1, wide: true },
  { s: "Dec – Mar", t: "Backwater slow boat", p: "₹98,000", d: "Six nights on a teak kettuvallam, cooking with a Kuttanad family.", i: 0 },
  { s: "Oct – Nov", t: "Tea hills after rain", p: "₹1,12,000", d: "Walk estate to estate in Darjeeling, tasting each first light.", i: 2 },
  { s: "Jan – Apr", t: "Andaman reef weeks", p: "₹1,85,000", d: "Two islands, one marine biologist, morning dives only.", i: 3 },
];

/** LS04 · Itinerary cards with season + from-price: five trip cards in a 2-then-3 grid (the first two wider), each with
 *  a picture, season label, title, a "from" price that counts up, two lines of summary and a Learn more link. */
function LS04() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M3");
  const [i, setI] = useAutoCycle(r, TRIPS.length, 1700);
  return (
    <Sec innerRef={r} theme="stone" font="serif" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#2f5d73" }}>
      <style>{LS_CSS}</style>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[13ch] text-[clamp(48px,5.8vw,96px)]">Journeys for the season.</H>
        <div className="max-w-[36ch] pb-2">
          <P>Small groups of eight, one local guide the whole way, and nights you would never find on a map.</P>
          <div className="mt-6">
            <Btn kind="ghost">Plan a private trip</Btn>
          </div>
        </div>
      </div>
      <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 gap-[clamp(16px,2vw,28px)] md:grid-cols-6">
        {TRIPS.map((x, k) => {
          const on = k === i;
          return (
            <article key={x.t} data-m-card onMouseEnter={() => setI(k)} className={`group flex flex-col ${x.wide ? "md:col-span-3" : "md:col-span-2"}`}>
              <div className="ls4-pic relative" style={{ ["--p" as string]: `${5 + k * 0.7}s`, ["--dl" as string]: `${-k * 1.3}s` }}>
                <Pic i={x.i} ratio={x.wide ? "16/10" : "4/3"} label="" />
                <span className={`absolute left-4 top-4 rounded-full px-4 py-2 text-[13px] font-[600] tracking-[0.04em] backdrop-blur-md transition-colors duration-500 ${on ? "bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "bg-white/80 text-[#111418]"}`}>{x.s}</span>
              </div>
              <div className="mt-5 flex items-start justify-between gap-4">
                <h3 className="sx-display text-[clamp(24px,2.1vw,34px)] font-[600] leading-[1.05]">{x.t}</h3>
                <p className="shrink-0 pt-1 text-right">
                  <span className="block text-[12px] uppercase tracking-[0.14em] text-[var(--sx-muted)]">from</span>
                  <span data-m-num className="text-[clamp(17px,1.4vw,21px)] font-[650] tabular-nums">
                    {x.p}
                  </span>
                </p>
              </div>
              <p className="mt-2 line-clamp-2 max-w-[52ch] text-[15px] leading-relaxed text-[var(--sx-muted)]">{x.d}</p>
              <a href="#" onClick={(e) => e.preventDefault()} className="mt-4 inline-flex w-max items-center gap-2 text-[15px] font-[600]">
                Learn more
                <span className={`inline-block h-px bg-current transition-all duration-500 ${on ? "w-10" : "w-4"}`} />
              </a>
            </article>
          );
        })}
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "LS04", name: "Itinerary cards with season + from-price", motion: "M3", C: LS04 }];
