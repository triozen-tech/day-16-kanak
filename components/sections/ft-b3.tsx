"use client";

// FT · Feature layouts, batch 3 (FT14–FT16). Full designed sections; ?static=1 shows each in its final state.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/* ───────────────────────── FT14 · Image + tag-pill marquee rows ───────────────────────── */

const FT14_CSS = `
.ft14-run{animation:ft14-run var(--d,20s) linear infinite}
.ft14-rev{animation-direction:reverse}
@keyframes ft14-run{from{transform:translateX(0)}to{transform:translateX(-50%)}}
html.is-static .ft14-run{animation:none}
html.is-static {.ft14-run{animation:none}}
`;

/** One endless line of tag pills (doubled for a seamless loop). `hot` pills take the accent fill. */
function PillLine({ tags, d, rev = false, hot = [] }: { tags: string[]; d: string; rev?: boolean; hot?: number[] }) {
  return (
    <div className="min-w-0 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <div className={`ft14-run flex w-max gap-3 ${rev ? "ft14-rev" : ""}`} style={{ ["--d" as string]: d }}>
        {[0, 1].flatMap((dup) =>
          tags.map((t, k) => (
            <span key={`${dup}-${k}`} aria-hidden={dup === 1} className={`whitespace-nowrap rounded-full border px-5 py-2.5 text-[clamp(14px,1.1vw,17px)] font-[600] ${hot.includes(k) ? "border-[var(--sx-accent)] bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "border-[var(--sx-line)] bg-[var(--sx-surface)] text-[var(--sx-text)]"}`}>
              {t}
            </span>
          )),
        )}
      </div>
    </div>
  );
}

/** FT14 · Two stacked rows: an image card on one side; on the other a headline and lines of tag pills drifting in
 *  opposite directions. The image cards open and settle inside their frames on scroll (M13). */
function FT14() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M13");
  const rows = [
    {
      i: 3,
      label: "STRIDE 2",
      h: "Built for the long run.",
      p: "The Stride 2 trainer, from ₹9,490. Everything that matters at kilometre thirty, nothing that doesn't.",
      lines: [
        { tags: ["Recycled knit upper", "8 mm drop", "Carbon-free foam", "246 g", "Wide toe box", "Reflective heel"], d: "22s", hot: [2] },
        { tags: ["Grippy on wet roads", "Washable insole", "Vegan glue", "Made in Chennai", "500 km tested"], d: "26s", rev: true, hot: [] },
        { tags: ["Lock-lace eyelets", "Breathes at 38°", "Two-year sole warranty", "Half sizes", "Free returns"], d: "19s", hot: [1] },
      ],
    },
    {
      i: 1,
      label: "COURT LOW",
      h: "Made to be worn loud.",
      p: "The Court Low in eight colourways, from ₹6,990. Suede toe cap, cupsole stitched by hand.",
      lines: [
        { tags: ["Hand-stitched cupsole", "Suede toe cap", "8 colourways", "Cotton laces", "Padded collar"], d: "24s", rev: true, hot: [0] },
        { tags: ["Gum rubber outsole", "Leather lining", "Resoleable", "Limited run of 400", "Ships in 2 days"], d: "20s", hot: [3] },
      ],
    },
  ];
  return (
    <Sec innerRef={r} theme="ink" font="condensed" className="py-[clamp(72px,9vw,140px)]">
      <style>{FT14_CSS}</style>
      <div className="flex flex-col gap-[clamp(48px,6vw,96px)]">
        {rows.map((row, k) => (
          <div key={row.h} className="grid grid-cols-1 items-center gap-[clamp(28px,4vw,72px)] md:grid-cols-12">
            <div className={`md:col-span-5 ${k % 2 ? "md:order-2" : ""}`}>
              <Pic i={row.i} ratio="4/5" label={row.label} />
            </div>
            <div className={`min-w-0 md:col-span-7 ${k % 2 ? "md:order-1" : ""}`}>
              <H className="text-[clamp(52px,6vw,100px)]">{row.h}</H>
              <P className="mt-5 max-w-[46ch]">{row.p}</P>
              <div className="mt-8 flex flex-col gap-3">
                {row.lines.map((l, n) => (
                  <PillLine key={n} tags={l.tags} d={l.d} rev={l.rev} hot={l.hot} />
                ))}
              </div>
              <div className="mt-8">
                <Btn kind="link">Shop the {row.label.split(" · ")[0].toLowerCase().replace(/^\w/, (c) => c.toUpperCase())} →</Btn>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Sec>
  );
}

/* ───────────────────────── FT15 · Numbered features flanking a tall image ───────────────────────── */

const FT15_CSS = `
.ft15-sweep{animation:ft15-sweep 3.4s ease-in-out infinite}
@keyframes ft15-sweep{from{transform:translateX(-110%)}to{transform:translateX(110%)}}
html.is-static .ft15-sweep{animation:none;opacity:0}
html.is-static {.ft15-sweep{animation:none;opacity:0}}
`;

/** One numbered cell beside the FT15 portrait (hairline under the first of each pair). */
function FT15Cell({ c, first, right = false }: { c: { n: string; t: string; d: string }; first: boolean; right?: boolean }) {
  return (
    <div className={`flex flex-1 flex-col justify-center py-[clamp(24px,3vw,44px)] ${right ? "md:items-end md:text-right" : ""} ${first ? "border-b border-[var(--sx-line)]" : ""}`}>
      <p className="sx-display text-[clamp(32px,2.6vw,44px)] leading-none text-[var(--sx-accent)]">{c.n}</p>
      <h3 data-m-text className="mt-4 text-[clamp(20px,1.6vw,24px)] font-[650] text-[var(--sx-text)]">
        {c.t}
      </h3>
      <p data-m-text className="mt-3 max-w-[34ch] text-[16px] leading-relaxed text-[var(--sx-muted)]">
        {c.d}
      </p>
    </div>
  );
}

/** FT15 · Title + subline, then a 3fr / 4fr / 3fr grid: a tall portrait in the centre, two hairline-divided numbered
 *  cells on each side. The cells' lines mask-slide in and the portrait settles (M23); a soft light sweeps the bottle. */
function FT15() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const cells = [
    { n: "01", t: "Distilled, not mixed", d: "Jasmine sambac is steam-distilled into sandalwood oil in copper degs, the old Kannauj way." },
    { n: "02", t: "Aged ninety days", d: "Each batch rests in glass in a cool cellar until the top notes soften into the base." },
    { n: "03", t: "Twelve hours on skin", d: "An extrait at 28% concentration. Two touches at the wrist last through a long dinner." },
    { n: "04", t: "Refill for life", d: "Bring the bottle back to any of our stores and we refill it for ₹2,900." },
  ];
  const Cell = FT15Cell;
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <style>{FT15_CSS}</style>
      <div className="mx-auto max-w-[760px] text-center">
        <H className="text-[clamp(44px,5vw,84px)]">Jasmine Attar No. 7</H>
        <P className="mx-auto mt-5 max-w-[48ch]">One flower, one wood, made by a family of perfumers in their fourth generation. 12 ml for ₹5,400.</P>
      </div>
      <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 gap-[clamp(20px,3vw,56px)] md:grid-cols-[minmax(0,3fr)_minmax(0,4fr)_minmax(0,3fr)]">
        <div className="flex flex-col">
          <Cell c={cells[0]} first right />
          <Cell c={cells[1]} first={false} right />
        </div>
        <div className="relative overflow-hidden rounded-[var(--sx-radius,18px)]">
          <div className="fx-pan absolute -inset-[3%] max-md:hidden">
            <Pic i={2} ratio="auto" className="fx-drift absolute inset-0 h-full w-full" label="NO. 7 · 12 ML" />
          </div>
          <div className="aspect-[3/4] md:hidden">
            <Pic i={2} ratio="3/4" label="NO. 7 · 12 ML" />
          </div>
          <div className="aspect-[3/4] max-md:hidden" />
          <div className="ft15-sweep pointer-events-none absolute inset-y-0 left-0 w-full bg-[linear-gradient(100deg,transparent_30%,rgba(255,248,232,.28)_50%,transparent_70%)]" />
        </div>
        <div className="flex flex-col">
          <Cell c={cells[2]} first />
          <Cell c={cells[3]} first={false} />
        </div>
      </div>
      <div className="mt-[clamp(32px,4vw,56px)] flex justify-center gap-4">
        <Btn>Add to bag · ₹5,400</Btn>
        <Btn kind="ghost">Order a 2 ml sample</Btn>
      </div>
    </Sec>
  );
}

/* ───────────────────────── FT16 · Triptych images + checklist ───────────────────────── */

/** FT16 · 12 columns: the left 7 hold three photos side by side at different widths (4/3/5) and heights; the right 5
 *  hold the heading, a paragraph and a three-item checklist. Photos curtain open left to right (M1); the checklist
 *  highlights one promise at a time, by itself. */
function FT16() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M1");
  const [on, setOn] = useState(0);
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    let t: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (e.isIntersecting) t = setInterval(() => setOn((v) => (v + 1) % 3), 1700);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, []);
  const checks = [
    ["Picked by hand, only when red", "Our pickers pass each bush four times a season."],
    ["Roasted on Tuesdays, shipped Wednesdays", "Beans reach you within six days of the drum."],
    ["Paid 40% above the market rate", "Published every year, estate by estate."],
  ];
  return (
    <Sec innerRef={r} theme="stone" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <div className="grid grid-cols-1 items-center gap-[clamp(32px,5vw,80px)] md:grid-cols-12">
        <div className="grid grid-cols-12 items-center gap-[clamp(8px,1vw,16px)] md:col-span-7">
          {[
            { i: 0, ratio: "3/5", c: "col-span-4", l: "CHERRY", d: "7s" },
            { i: 3, ratio: "1/2", c: "col-span-3", l: "DRUM", d: "5.5s" },
            { i: 1, ratio: "4/5", c: "col-span-5", l: "CUP", d: "6.4s" },
          ].map((p) => (
            <div key={p.l} className={`fx-drift ${p.c}`} style={{ animationDuration: p.d }}>
              <Pic i={p.i} ratio={p.ratio} label="" />
            </div>
          ))}
        </div>
        <div className="md:col-span-5">
          <H className="text-[clamp(44px,4.6vw,78px)]">From one hillside, honestly.</H>
          <P className="mt-5 max-w-[42ch]">Every bag of Ridgeline coffee comes from a single estate in the Baba Budan hills. 250 g from ₹620.</P>
          <ul className="mt-8 flex flex-col gap-2">
            {checks.map(([t, d], k) => (
              <li key={t} data-m-text className={`flex gap-4 rounded-[14px] px-4 py-4 transition-colors duration-500 ${k === on ? "bg-[color-mix(in_srgb,var(--sx-accent)_14%,transparent)]" : "bg-transparent"}`}>
                <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-[14px] font-[700] transition-colors duration-500 ${k === on ? "bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "border border-[var(--sx-line)] text-[var(--sx-accent)]"}`}>✓</span>
                <span>
                  <span className="block text-[17px] font-[650] text-[var(--sx-text)]">{t}</span>
                  <span className="mt-1 block text-[15px] leading-relaxed text-[var(--sx-muted)]">{d}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Btn>Shop the estate roast</Btn>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "FT14", name: "Image + tag-pill marquee rows", motion: "M13", C: FT14 },
  { code: "FT15", name: "Numbered features flanking a tall image", motion: "M23", C: FT15 },
  { code: "FT16", name: "Triptych images + checklist", motion: "M1", C: FT16 },
];
