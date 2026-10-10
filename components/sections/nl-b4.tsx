"use client";

// NL · Newsletter / signup layouts, batch 4 (docs/SECTION-MENU.md).
import { useRef } from "react";
import { H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const PREVIEWS = [
  { i: 1, ratio: "4/5", l: "UPPER · KNIT" },
  { i: 3, ratio: "1/1", l: "SOLE · FOAM" },
  { i: 0, ratio: "3/4", l: "COLOUR · DUSK" },
  { i: 2, ratio: "4/5", l: "HEEL · CLIP" },
  { i: 1, ratio: "1/1", l: "LACE · FLAT" },
];

const SOCIAL = [
  { l: "Photos", d: "M4 8a2 2 0 012-2h2l1.5-2h5L16 6h2a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2zM12 16a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" },
  { l: "Films", d: "M4 6h16v12H4zM10 9.5v5l4.5-2.5z" },
  { l: "Community chat", d: "M5 5h14v10H10l-4 4v-4H5z" },
];

/** NL05 · Launch signup + auto-scrolling preview column: left 6/12 a launch badge, headline, email signup and social
 *  buttons; right 6/12 a tall column of preview images scrolling upward on its own.
 *  Motion M32: the two preview columns drift at different speeds with the scroll while they auto-scroll. */
function NL05() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M32");
  const col = (offset: number) => [...PREVIEWS.slice(offset), ...PREVIEWS.slice(0, offset)];
  return (
    <Sec innerRef={r} theme="stone" font="wide" className="py-[clamp(56px,6vw,96px)]">
      <style>{`
        @keyframes nl05-up { from { transform: translateY(0) } to { transform: translateY(-50%) } }
        .nl05-up { animation: nl05-up var(--d, 24s) linear infinite; }
        html.is-static .nl05-up { animation: none; }
        html.is-static { .nl05-up { animation: none; } }
      `}</style>
      <div className="grid grid-cols-1 items-center gap-[clamp(40px,5vw,80px)] md:grid-cols-12">
        <div className="md:col-span-6">
          <span data-m-text className="inline-flex items-center gap-3 rounded-full border border-[var(--sx-line)] bg-[var(--sx-surface)] py-1.5 pl-1.5 pr-4 text-[13px] font-[600]">
            <span className="rounded-full bg-[var(--sx-accent)] px-3 py-1 text-[12px] uppercase tracking-[0.12em] text-[var(--sx-accent-text)]">Drop 07</span>
            Lands Friday, 21 November
          </span>
          <H className="mt-8 max-w-[12ch] text-[clamp(40px,4.8vw,80px)]">The Kite runner, almost here.</H>
          <P className="mt-6 max-w-[42ch]">
            A 212-gram trainer knitted from one recycled thread. 600 pairs in the first drop at ₹9,490. The list hears first, a full hour early.
          </P>
          <form onSubmit={(e) => e.preventDefault()} className="mt-9 flex max-w-[520px] items-center gap-2 rounded-full border border-[var(--sx-line)] bg-[var(--sx-surface)] p-1.5 focus-within:border-[var(--sx-accent)]">
            <input type="email" required placeholder="you@example.com" aria-label="Email address" className="min-w-0 flex-1 bg-transparent px-5 py-3 text-[16px] outline-none placeholder:text-[var(--sx-muted)]" />
            <button type="submit" className="sx-btn sx-btn-solid shrink-0">
              Join the list
            </button>
          </form>
          <p className="mt-4 text-[13px] text-[var(--sx-muted)]">4,812 people are already on it. One email on launch day, nothing else.</p>
          <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-[var(--sx-line)] pt-8">
            <span className="mr-2 text-[14px] text-[var(--sx-muted)]">Follow the build</span>
            {SOCIAL.map((s) => (
              <a key={s.l} href="#" onClick={(e) => e.preventDefault()} aria-label={s.l} className="grid h-12 w-12 place-items-center rounded-full border border-[var(--sx-line)] transition-colors hover:bg-[var(--sx-text)] hover:text-[var(--sx-bg)]">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
                  <path d={s.d} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* preview column: two lanes inside a tall window, faded top and bottom */}
        <div className="relative h-[clamp(560px,82vh,820px)] overflow-hidden rounded-[calc(var(--sx-radius)+6px)] md:col-span-6 [mask-image:linear-gradient(180deg,transparent,#000_12%,#000_88%,transparent)]">
          <div className="grid h-full grid-cols-2 gap-[clamp(10px,1vw,16px)]">
            {[
              { o: 0, d: "22s", mt: "0%" },
              { o: 2, d: "30s", mt: "-18%" },
            ].map((lane, k) => (
              <div key={k} data-m-col className="min-w-0" style={{ marginTop: lane.mt }}>
                <div className="nl05-up flex flex-col gap-[clamp(10px,1vw,16px)] pb-[clamp(10px,1vw,16px)]" style={{ ["--d" as string]: lane.d }}>
                  {[...col(lane.o), ...col(lane.o)].map((p, j) => (
                    <Pic key={j} i={p.i} ratio={p.ratio} label={p.l} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "NL05", name: "Launch signup + auto-scrolling preview column", motion: "M32", C: NL05 }];
