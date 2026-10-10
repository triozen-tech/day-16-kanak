"use client";

// FO · Footer layouts, batch 2 (docs/SECTION-MENU.md).
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const COLS = [
  { t: "Stay", l: ["Garden suites", "Lake rooms", "The boathouse", "Long stays"] },
  { t: "Dine", l: ["Terrace kitchen", "Tea room", "Private dinners"] },
  { t: "House", l: ["Our story", "Spa & hammam", "Weddings", "Gift a stay"] },
];

/** FO09 · Curtain-reveal footer: the footer waits underneath; the last panel lifts away like a curtain and the big wordmark pops letter by letter. */
function FO09() {
  const foot = useRef<HTMLDivElement>(null);
  // the footer itself is the motion root, so the letters pop as it is uncovered (not when the curtain panel arrives)
  useSectionMotion(foot, "M12");
  const H = 720; // footer height in px (the curtain uncovers exactly this much)
  // ?static=1 / reduced motion: no sticky reveal, the footer simply sits in the flow in its final state
  const [still, setStill] = useState(false);
  useEffect(() => setStill(prefersReducedMotion()), []);
  return (
    <Sec theme="ink" font="editorial" full className="overflow-clip!">
      {/* the curtain: the last page panel, lifted over the footer with a shadowed rounded edge */}
      <Sec theme="paper" font="editorial" className="z-10 rounded-b-[clamp(28px,4vw,56px)] bg-[var(--sx-bg)] py-[clamp(72px,9vw,128px)] text-[var(--sx-text)] shadow-[0_40px_80px_-20px_rgba(0,0,0,.55)]">
        <div className="grid grid-cols-1 items-center gap-[clamp(28px,4vw,64px)] md:grid-cols-12">
          <div className="md:col-span-7">
            <p className="sx-display text-[clamp(40px,4.8vw,80px)] font-[500] leading-[1] tracking-[-0.02em]">Stay a little longer.</p>
            <p className="mt-5 max-w-[42ch] text-[clamp(16px,1.2vw,19px)] leading-relaxed text-[var(--sx-muted)]">Twenty-two rooms on the edge of Lake Pichola, from ₹18,500 a night with breakfast on the terrace.</p>
          </div>
          <div className="flex md:col-span-5 md:justify-end">
            <Btn>Check dates</Btn>
          </div>
        </div>
      </Sec>

      {/* the footer: sticky to the bottom of the viewport inside a clipped box, so it is uncovered from underneath */}
      <div ref={foot} className="relative -mt-[clamp(28px,4vw,56px)]" style={{ height: H, clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}>
        <div className="relative" style={still ? { height: H } : { height: `calc(100vh + ${H}px)`, top: "-100vh" }}>
          {/* top padding = normal padding + the curtain's rounded overlap (-mt above), so the top row is never under the curtain */}
          <footer className={`${still ? "relative" : "sticky"} flex flex-col justify-between overflow-hidden px-[clamp(20px,5vw,96px)] pb-[clamp(24px,3vw,40px)] pt-[calc(clamp(72px,8vw,112px)+clamp(28px,4vw,56px))]`} style={{ height: H, top: still ? 0 : `calc(100vh - ${H}px)` }}>
            <div className="pointer-events-none absolute inset-0 fx-pan" aria-hidden>
              <div className="fx-drift absolute -right-[8%] -top-[30%] aspect-square w-[60vw] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_22%,transparent),transparent)]" />
            </div>
            <div className="relative grid grid-cols-1 gap-[clamp(28px,4vw,64px)] md:grid-cols-12">
              <div className="md:col-span-4">
                <P className="max-w-[30ch]">Letters from the lake, four times a year. Seasonal menus, quiet weeks, first word on new rooms.</P>
                <div className="mt-6 flex max-w-[380px] items-center gap-2 rounded-full border border-[var(--sx-line)] p-1.5 pl-5">
                  <span className="flex-1 text-[15px] text-[var(--sx-muted)]">your@email.com</span>
                  <Btn className="py-2.5!">Subscribe</Btn>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6 md:col-span-5 md:col-start-6">
                {COLS.map((c) => (
                  <div key={c.t}>
                    <p className="text-[13px] uppercase tracking-[0.16em] text-[var(--sx-muted)]">{c.t}</p>
                    <ul className="mt-4 space-y-2.5 text-[15px]">
                      {c.l.map((x) => (
                        <li key={x}>
                          <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-[var(--sx-accent)]">
                            {x}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="hidden md:col-span-2 md:block">
                <Pic i={1} ratio="3/4" label="THE LAKE" />
              </div>
            </div>
            <div className="relative">
              <h2 data-m-head className="sx-display text-center text-[clamp(72px,13vw,220px)] font-[600] leading-[0.82] tracking-[-0.04em]">
                Haveli Neel
              </h2>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--sx-line)] pt-5 text-[13px] text-[var(--sx-muted)]">
                <span>© 2026 Haveli Neel · Concept website by Showreel Studio</span>
                <span>Instagram · Journal · Careers</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "FO09", name: "Curtain-reveal footer", motion: "M12", C: FO09 }];
