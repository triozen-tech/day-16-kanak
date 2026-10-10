"use client";

// JR · Journal layouts, batch 7 (docs/SECTION-MENU.md). Invented authors and stories; placeholder photos.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Hands-free cycling: steps an index every `ms` while the section is on screen (stops off screen and in ?static=1). */
function useAutoCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms = 2200) {
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

const JR_CSS = `
.jrb7-glow{animation:jrb7-glow 4.6s linear infinite alternate}
@keyframes jrb7-glow{from{transform:translate(-26%,-6%) scale(.92)}to{transform:translate(26%,12%) scale(1.2)}}
html.is-static .jrb7-glow{animation:none}
html.is-static {.jrb7-glow{animation:none}}
`;

const POSTS = [
  { cat: "Origins", t: "A week on a shade-grown estate in Coorg", d: "12 Mar 2026", min: "7 min", i: 0, l: "Coorg" },
  { cat: "Brew guide", t: "The pour-over ratio we keep coming back to", d: "28 Feb 2026", min: "4 min", i: 1, l: "Pour-over" },
  { cat: "People", t: "Meet the roaster who tastes 300 cups a day", d: "14 Feb 2026", min: "6 min", i: 3, l: "Roastery" },
];

/** JR14 · Three-card journal row: a heading row with an 'All posts' link, then three equal article cards (image,
 *  category, title, date). The pictures open out of a frame with the scroll; the cards take turns being "read". */
function JR14() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M13");
  const [act] = useAutoCycle(r, POSTS.length, 1800);
  return (
    <Sec innerRef={r} theme="paper" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <style>{JR_CSS}</style>
      <div aria-hidden className="jrb7-glow pointer-events-none absolute left-[25%] top-[30%] aspect-square w-[55vw] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_36%,transparent),transparent)]" />
      <div className="relative z-10">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-[var(--sx-line)] pb-8">
          <H className="text-[clamp(48px,5.6vw,96px)]">From the roastery</H>
          <Btn kind="link">All posts →</Btn>
        </div>
        <div className="mt-[clamp(32px,4vw,56px)] grid grid-cols-1 gap-[clamp(18px,2.2vw,36px)] md:grid-cols-3">
          {POSTS.map((p, k) => {
            const on = k === act;
            return (
              <a key={p.t} href="#" onClick={(e) => e.preventDefault()} className="group block min-w-0">
                <div className={`overflow-hidden rounded-[var(--sx-radius)] transition-transform duration-700 ${on ? "-translate-y-2" : ""}`}>
                  <div className={`transition-transform duration-[1200ms] ease-out ${on ? "scale-[1.07]" : "scale-100"}`}>
                    <Pic i={p.i} ratio="4/3" label={p.l} />
                  </div>
                </div>
                <div className="mt-6 flex items-center gap-3 text-[13px]">
                  <span className={`rounded-full px-3 py-1 font-[600] transition-colors duration-500 ${on ? "bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "border border-[var(--sx-line)] text-[var(--sx-muted)]"}`}>{p.cat}</span>
                  <span className="text-[var(--sx-muted)]">{p.min} read</span>
                </div>
                <h3 data-m-text className="sx-display mt-4 text-[clamp(26px,2.3vw,36px)] leading-[1.1] text-[var(--sx-text)]">
                  <span className={`bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-700 ${on ? "bg-[length:100%_1px]" : ""}`}>{p.t}</span>
                </h3>
                <p className="mt-4 text-[14px] text-[var(--sx-muted)]">{p.d}</p>
              </a>
            );
          })}
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "JR14", name: "Three-card journal row", motion: "M13", C: JR14 }];
