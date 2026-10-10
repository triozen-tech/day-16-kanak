"use client";

// SY · Story layouts (docs/SECTION-MENU.md). Each is a full designed section; motion via useSectionMotion.
import { useEffect, useRef, useState } from "react";
import { Btn, H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** SY01 · Split sticky story: the statement + chapter titles stay put on the left (CSS sticky), three chapters scroll on the right. */
const CHAPTERS = [
  { t: "The slope", b: "Our bushes grow at 1,900 m on a north-facing ridge above Munnar, where the mist sits until ten.", i: 2 },
  { t: "The plucking", b: "Two leaves and a bud, picked by hand at first light, weighed and withered within the hour.", i: 1 },
  { t: "The cup", b: "Rolled, rested and fired in small lots, then sealed the same week so it pours bright and honeyed.", i: 3 },
];
function SY01() {
  const r = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(0);
  useSectionMotion(r, "M20");
  useEffect(() => {
    const els = Array.from(r.current?.querySelectorAll<HTMLElement>("[data-chapter]") ?? []);
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setOn(Number((e.target as HTMLElement).dataset.chapter))), { rootMargin: "-45% 0px -45% 0px" });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
  return (
    // overflow: clip (not hidden) so position: sticky still works inside the section
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]" style={{ overflow: "clip" }}>
      <div className="grid grid-cols-1 gap-[clamp(32px,6vw,96px)] md:grid-cols-12">
        <div className="md:col-span-5">
          <div className="md:sticky md:top-[14vh]">
            <H className="max-w-[11ch] text-[clamp(44px,5.4vw,88px)]">Three chapters in every tin.</H>
            <ol className="mt-10 border-t border-[var(--sx-line)] max-md:hidden">
              {CHAPTERS.map((c, k) => (
                <li key={c.t} className={`flex items-baseline gap-5 border-b border-[var(--sx-line)] py-4 transition-[color,opacity] duration-500 ${on === k ? "text-[var(--sx-text)]" : "text-[var(--sx-muted)] opacity-60"}`}>
                  <span className="text-[13px] tabular-nums">0{k + 1}</span>
                  <span className="sx-display text-[clamp(22px,1.9vw,30px)]">{c.t}</span>
                  <span className={`ml-auto h-2 w-2 rounded-full bg-[var(--sx-accent)] transition-opacity duration-500 ${on === k ? "opacity-100" : "opacity-0"}`} />
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="flex flex-col gap-[clamp(48px,8vw,120px)] md:col-span-7">
          {CHAPTERS.map((c, k) => (
            <article key={c.t} data-chapter={k}>
              <Pic i={c.i} ratio="5/4" label={`CHAPTER ${k + 1}`} />
              <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-[1fr_1.4fr] md:gap-10">
                <h3 className="sx-display text-[clamp(28px,2.6vw,40px)] leading-[1.05]">{c.t}</h3>
                <P>{c.b}</P>
              </div>
            </article>
          ))}
        </div>
      </div>
    </Sec>
  );
}

/** SY02 · Timeline strip: a year ruler 2019 → 2026 with milestone cards (and small photos) hung under it. */
const YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
const MILESTONES = [
  { y: 2019, t: "A garage in Pune", b: "First 40 pairs, hand-lasted and sold out of a backpack at a Sunday run club.", i: 0 },
  { y: 2021, t: "The recycled sole", b: "Our foam switches to 60% recovered rubber. Same bounce, half the footprint.", i: 1 },
  { y: 2023, t: "Studio in Bengaluru", b: "A 12-person design floor and our own wear-test track on the roof.", i: 2 },
  { y: 2025, t: "100,000 pairs", b: "Worn on four continents, and still every pair is checked by hand.", i: 3 },
];
function SY02() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  return (
    <Sec innerRef={r} theme="stone" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[13ch] text-[clamp(42px,5vw,84px)]">Eight years, one good shoe.</H>
        <P className="max-w-[38ch]">From a garage workbench to a studio of twelve. The milestones that shaped every pair we make.</P>
      </div>
      {/* ruler (desktop) */}
      <div className="mt-[clamp(48px,6vw,88px)] max-md:hidden">
        <div className="grid grid-cols-8">
          {YEARS.map((y) => {
            const hit = MILESTONES.some((m) => m.y === y);
            return (
              <div key={y} className="relative">
                <p className={`text-[15px] tabular-nums ${hit ? "font-[700] text-[var(--sx-text)]" : "text-[var(--sx-muted)]"}`}>{y}</p>
                <div className="mt-3 flex h-4 items-end justify-between pr-[12%]">
                  {Array.from({ length: 10 }, (_, t) => (
                    <span key={t} className={`w-px ${t === 0 ? "h-4 bg-[var(--sx-text)]" : "h-2 bg-[var(--sx-line)]"}`} />
                  ))}
                </div>
                {hit && <span className="absolute -bottom-[5px] left-[-4px] h-[10px] w-[10px] rounded-full bg-[var(--sx-accent)]" />}
              </div>
            );
          })}
        </div>
        <div className="h-px bg-[var(--sx-text)]/40" />
      </div>
      <div className="mt-8 grid grid-cols-1 gap-[clamp(12px,1.6vw,24px)] md:grid-cols-8 max-md:mt-10">
        {MILESTONES.map((m) => (
          <article key={m.y} data-m-card className="sx-card flex gap-4 p-4 md:col-span-2 md:flex-col">
            <Pic i={m.i} ratio="4/3" className="w-[38%] shrink-0 md:w-full" />
            <div>
              <p className="text-[13px] font-[700] tabular-nums text-[var(--sx-accent)]">{m.y}</p>
              <h3 className="sx-display mt-1 text-[clamp(20px,1.6vw,26px)] font-[700] leading-[1.1]">{m.t}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--sx-muted)]">{m.b}</p>
            </div>
          </article>
        ))}
      </div>
    </Sec>
  );
}

/** SY03 · Founder letter: a big serif opening line, a short letter, an ink signature and a small portrait. */
function SY03() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  return (
    <Sec innerRef={r} theme="paper" font="editorial" className="py-[clamp(72px,10vw,150px)]">
      <div className="mx-auto grid grid-cols-1 max-w-[1180px] gap-[clamp(32px,6vw,96px)] md:grid-cols-12">
        <figure className="md:col-span-3 max-md:flex max-md:items-end max-md:gap-4">
          <Pic i={1} ratio="3/4" className="max-md:w-[42%]" />
          <figcaption className="mt-4 text-[14px] leading-snug text-[var(--sx-muted)]">
            <b className="block font-[650] text-[var(--sx-text)]">Ira Menon</b>
            Founder &amp; head chocolatier, Kochi
          </figcaption>
        </figure>
        <div className="md:col-span-8 md:col-start-5">
          <H className="text-[clamp(40px,4.6vw,76px)] leading-[1.02]">Dear friend, it started with one cocoa pod.</H>
          <div className="mt-10 max-w-[58ch] space-y-5">
            <P>My grandmother kept three cocoa trees behind her house in Idukki. Every March she split the pods, fermented the beans under banana leaves and roasted them in an iron kadai.</P>
            <P>We still do it her way, only a little bigger. Forty farms, one small factory, and bars that list exactly what is inside them: cocoa, cane sugar, nothing to hide.</P>
            <P>Thank you for tasting what we make. Write to me if a bar ever lets you down.</P>
          </div>
          <div data-m-card className="mt-10 flex items-end gap-6">
            <svg viewBox="0 0 240 80" className="h-[64px] w-auto text-[var(--sx-text)]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-label="Signature">
              <path d="M8 58c10-30 22-48 28-44s-10 46-6 48 18-34 26-32-4 26 2 26 12-18 18-16-2 14 4 14 10-22 20-20 0 22 8 20 16-28 26-26-8 30 2 28c12-2 20-20 30-18s2 16 10 14 18-10 26-14" />
              <path d="M20 70c50-6 120-8 200-6" strokeWidth="1.4" opacity=".55" />
            </svg>
            <p className="pb-2 text-[13px] uppercase tracking-[0.16em] text-[var(--sx-muted)]">Kochi, March</p>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/** SY04 · Manifesto: one long statement across the full width; its words light up as you scroll. */
function SY04() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M20");
  return (
    <Sec innerRef={r} theme="ink" font="condensed" className="py-[clamp(88px,12vw,180px)]">
      <H className="text-[clamp(40px,6.2vw,112px)] leading-[0.98]">
        We make energy for people who <span className="text-[var(--sx-accent)]">build things.</span> No neon sugar crash, no fake fruit, no shouting. Just clean caffeine from green tea, electrolytes that work, and a can you are proud to <span className="text-[var(--sx-accent)]">leave on the desk.</span>
      </H>
      <div className="mt-[clamp(40px,5vw,72px)] flex flex-wrap items-center justify-between gap-6 border-t border-[var(--sx-line)] pt-8">
        <P className="max-w-[44ch]">120 mg natural caffeine, 0 g sugar, 9 calories. Brewed and canned in Nashik.</P>
        <Btn>Try the starter pack</Btn>
      </div>
    </Sec>
  );
}

/** SY05 · Heritage chapter: caps heading, two lines of copy, a full-bleed image with a bracketed CTA on its bottom edge. */
function SY05() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M13");
  return (
    <Sec innerRef={r} theme="ink" font="wide" full className="pt-[clamp(72px,9vw,140px)]">
      <div className="grid grid-cols-1 gap-6 px-[clamp(20px,5vw,96px)] md:grid-cols-12 md:items-end">
        <H className="text-[clamp(34px,4.4vw,72px)] uppercase tracking-[0.01em] md:col-span-7">Distilled in Kannauj since 1962</H>
        <P className="md:col-span-4 md:col-start-9">Rose and vetiver, drawn by deg-bhapka copper stills over a wood fire. Four generations, the same slow method.</P>
      </div>
      <div className="relative mt-[clamp(40px,5vw,72px)]">
        <Pic i={3} ratio="auto" round={false} className="h-[clamp(420px,52vw,820px)] w-full max-md:h-[72svh]" label="THE STILL HOUSE" />
        <div className="absolute inset-x-0 bottom-0 flex justify-center">
          <a href="#" onClick={(e) => e.preventDefault()} className="translate-y-1/2 bg-[var(--sx-bg)] px-8 py-4 text-[14px] font-[650] uppercase tracking-[0.22em] text-[var(--sx-text)] transition-colors hover:text-[var(--sx-accent)] max-md:px-5 max-md:text-[13px]">
            [ Visit the house ]
          </a>
        </div>
      </div>
      <div className="h-[clamp(56px,6vw,96px)]" />
    </Sec>
  );
}

/** SY06 · Process: four photo steps in a row (harvest → roast → rest → pour), each with a short caption. */
const STEPS = [
  { t: "Harvest", b: "Ripe cherries only, hand-picked across three passes in Chikmagalur.", i: 1 },
  { t: "Roast", b: "Twelve minutes in a 5 kg drum, dropped the moment first crack settles.", i: 2 },
  { t: "Rest", b: "Five days in valved bags so the gas escapes and the sweetness opens.", i: 0 },
  { t: "Pour", b: "15 g to 250 ml at 93°C. Bloom, wait, pour slowly in circles.", i: 3 },
];
function SY06() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M1");
  return (
    <Sec innerRef={r} theme="paper" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-end">
        <H className="text-[clamp(42px,5vw,84px)] md:col-span-6">From cherry to cup in four steps.</H>
        <P className="md:col-span-4 md:col-start-9">Every bag on our shelf went through the same hands and the same clock. Here is the whole of it.</P>
      </div>
      <div className="mt-[clamp(40px,6vw,88px)] grid grid-cols-2 gap-x-[clamp(12px,2vw,28px)] gap-y-10 md:grid-cols-4">
        {STEPS.map((s, k) => (
          <article key={s.t} className={k % 2 ? "md:mt-[14%]" : ""}>
            <Pic i={s.i} ratio="3/4" />
            <div className="mt-5 flex items-baseline gap-3 border-t border-[var(--sx-line)] pt-4">
              <span className="text-[13px] font-[700] tabular-nums text-[var(--sx-accent)]">0{k + 1}</span>
              <h3 className="sx-display text-[clamp(22px,2vw,32px)] font-[700] leading-none">{s.t}</h3>
            </div>
            <p data-m-text className="mt-3 text-[14px] leading-relaxed text-[var(--sx-muted)] md:text-[15px]">{s.b}</p>
          </article>
        ))}
      </div>
    </Sec>
  );
}

export const STORY: SectionDef[] = [
  { code: "SY01", name: "Split sticky story", motion: "M20", C: SY01 },
  { code: "SY02", name: "Timeline strip", motion: "M23", C: SY02 },
  { code: "SY03", name: "Founder letter", motion: "M23", C: SY03 },
  { code: "SY04", name: "Manifesto", motion: "M20", C: SY04 },
  { code: "SY05", name: "Heritage chapter", motion: "M13", C: SY05 },
  { code: "SY06", name: "Process steps", motion: "M1", C: SY06 },
];
