"use client";

// JR · Journal & editorial layouts (docs/SECTION-MENU.md), batch 6. The archive table opens one row after another by
// itself while on screen (a click takes over); the long-read's beam follows the scroll. Loops stop in ?static=1 (the first row then shows open and the beam full).
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { Odometer } from "../fx/text";
import { Btn, H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Hands-free cycling: steps an index every `ms` while the section is on screen (stops off screen and in ?static=1). */
function useAutoCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms = 2400) {
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

const JR_CSS = `.jr6-glow{background:radial-gradient(closest-side,color-mix(in srgb,var(--sx-accent) 40%,transparent),transparent);animation:jr6-glow 6s linear infinite alternate}@keyframes jr6-glow{from{translate:-28% -10%}to{translate:26% 14%}}
.jr6-glow2{animation-duration:4.4s;animation-direction:alternate-reverse}
.jr6-ping{animation:jr6-ping 1.5s cubic-bezier(0,0,.2,1) infinite}@keyframes jr6-ping{from{transform:scale(1);opacity:.7}to{transform:scale(3);opacity:0}}
.is-static .jr6-glow{animation:none}.is-static .jr6-ping{animation:none;opacity:0}
html.is-static {.jr6-glow{animation:none}.jr6-ping{animation:none;opacity:0}}`;

const ISSUES = [
  { y: 2026, n: 64, t: "The Night Shift", type: "Print", s: "Bakers, signal-men and radio hosts: twelve people whose working day starts at ten pm.", i: 3 },
  { y: 2025, n: 63, t: "Salt", type: "Print", s: "From the pans of the Rann to a pastry kitchen in Pondicherry, one mineral, eight stories.", i: 0 },
  { y: 2025, n: 62, t: "Rooms We Listen In", type: "Audio", s: "A four-part audio issue recorded in living rooms, temples and one very loud bus depot.", i: 1 },
  { y: 2024, n: 61, t: "Hand-me-downs", type: "Print", s: "Clothes, recipes and grudges: what families pass on, and what they quietly keep.", i: 2 },
  { y: 2024, n: 60, t: "Field Notes", type: "Zine", s: "A pocket-size zine of sketches from monsoon walks across the Western Ghats.", i: 1 },
  { y: 2023, n: 59, t: "The Long Table", type: "Print", s: "Twenty-two shared meals, photographed from above, with every recipe at the back.", i: 3 },
  { y: 2023, n: 58, t: "Second Cities", type: "Online", s: "Essays on the towns people leave and the ones they choose to come back to.", i: 0 },
];

/** JR12 · Archive index table: a dense table of year, issue, title and type with sortable column headers; one row at a
 *  time expands with a cover image and a short summary. Archive totals roll in on odometers. */
function JR12() {
  const r = useRef<HTMLDivElement>(null);
  const [on, setOn] = useAutoCycle(r, ISSUES.length, 2400);
  const cols = "grid-cols-[72px_80px_minmax(0,1fr)_90px_28px] md:grid-cols-[110px_120px_minmax(0,1fr)_160px_40px]";
  return (
    <Sec innerRef={r} theme="paper" font="grotesk" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#3d4fd1", ["--sx-accent-text" as string]: "#f3f4ff" }}>
      <style>{JR_CSS}</style>
      <div className="jr6-glow pointer-events-none absolute right-[-12%] top-[-8%] aspect-square w-[55%] rounded-full" />
      <div className="relative grid grid-cols-1 items-end gap-[clamp(24px,4vw,64px)] md:grid-cols-12">
        <div className="md:col-span-6">
          <H className="max-w-[12ch] text-[clamp(48px,5.6vw,96px)]">Every issue, since 2009.</H>
          <P className="mt-6 max-w-[40ch]">The full archive of The Long Margin, a quarterly of slow journalism. Back issues ship from ₹650.</P>
        </div>
        <div className="grid grid-cols-3 gap-4 border-t border-[var(--sx-line)] pt-6 md:col-span-6">
          {[
            ["64", "issues"],
            ["412", "essays"],
            ["18", "years in print"],
          ].map(([n, k]) => (
            <div key={k}>
              <Odometer value={n} className="sx-display text-[clamp(40px,4.4vw,72px)] font-[800] leading-none" />
              <p className="mt-2 text-[14px] text-[var(--sx-muted)]">{k}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mt-[clamp(36px,4.5vw,64px)] border-t-2 border-[var(--sx-text)]">
        <div className={`grid ${cols} gap-4 border-b border-[var(--sx-line)] py-3 text-[12px] font-[650] uppercase tracking-[0.14em] text-[var(--sx-muted)]`}>
          {["Year", "Issue", "Title", "Type"].map((h, k) => (
            <button key={h} type="button" className={`inline-flex items-center gap-1.5 text-left ${k === 0 ? "text-[var(--sx-text)]" : ""}`}>
              {h}
              <span className={k === 0 ? "text-[var(--sx-accent)]" : "opacity-40"}>{k === 0 ? "↓" : "↕"}</span>
            </button>
          ))}
          <span />
        </div>
        {ISSUES.map((x, k) => {
          const open = k === on;
          return (
            <div key={x.n} className={`border-b border-[var(--sx-line)] transition-colors duration-500 ${open ? "bg-[var(--sx-surface)]" : ""}`}>
              <button type="button" onClick={() => setOn(k)} className={`grid w-full ${cols} items-center gap-4 py-3.5 text-left text-[15px]`}>
                <span className="tabular-nums text-[var(--sx-muted)]">{x.y}</span>
                <span className="tabular-nums">No. {x.n}</span>
                <span className={`truncate font-[650] transition-colors duration-500 ${open ? "text-[var(--sx-accent)]" : ""}`}>{x.t}</span>
                <span className="text-[var(--sx-muted)]">{x.type}</span>
                <span className={`text-right text-[18px] leading-none transition-transform duration-500 ${open ? "rotate-45 text-[var(--sx-accent)]" : ""}`}>+</span>
              </button>
              <div className={`grid transition-[grid-template-rows] duration-700 ease-[cubic-bezier(.2,.8,.2,1)] ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <div className="min-h-0 overflow-hidden">
                  <div className={`grid grid-cols-[110px_minmax(0,1fr)] gap-[clamp(16px,2vw,32px)] pb-6 transition-opacity duration-500 md:grid-cols-[110px_120px_minmax(0,1fr)_200px] ${open ? "opacity-100 delay-200" : "opacity-0"}`}>
                    <span className="max-md:hidden" />
                    <Pic i={x.i} ratio="3/4" label="" className="w-[110px] md:w-[120px]" />
                    <div className="min-w-0 self-center">
                      <p className="max-w-[52ch] text-[16px] leading-relaxed text-[var(--sx-muted)]">{x.s}</p>
                    </div>
                    <div className="flex items-center md:justify-end">
                      <Btn kind="link">Order back issue →</Btn>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Sec>
  );
}

const CHAPTERS = [
  {
    badge: "2019 · The first batch",
    t: "A wok, a hairdryer and forty kilos of beans.",
    i: 3,
    p: [
      "We roasted the first batch on a gas stove in a rented flat in Kochi. The hairdryer was for winnowing; the neighbours thought we were burning toast for a week.",
      "It tasted of smoke and not much else. But underneath, faint, there was a note of dried plum we could not stop thinking about.",
    ],
  },
  {
    badge: "2021 · Finding the farm",
    t: "Cacao that grows under coconut palms.",
    i: 1,
    p: [
      "Joseph and Anna Varghese grow cacao between their palms in Idukki. They had been selling pods to a trader for whatever he offered that morning.",
      "We now pay three times the market rate and ferment the beans on their farm, in wooden boxes Joseph built from old window frames.",
    ],
  },
  {
    badge: "2024 · The bean room",
    t: "Small enough to taste every batch.",
    i: 0,
    p: [
      "Our workshop has one roaster, two stone grinders and a tempering table older than both of us. Everything we sell passes through these four machines.",
      "We make about nine hundred bars a week. Each one is wrapped by hand and stamped with the batch it came from, so you can write to us about it.",
    ],
  },
];

/** JR13 · Long-read column with a tracing scroll beam: a single centred article column (~720px) of chapters (badge, title,
 *  image, paragraphs); to its left a thin track with a dot at the top and a gradient beam that grows with the scroll. */
function JR13() {
  const r = useRef<HTMLDivElement>(null);
  const beam = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLSpanElement>(null);
  const track = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  useEffect(() => {
    if (prefersReducedMotion() || !track.current) return;
    const st = { trigger: track.current, start: "top 60%", end: "bottom 60%", scrub: 0.6 };
    const ctx = gsap.context(() => {
      gsap.fromTo(beam.current, { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: st });
      gsap.fromTo(head.current, { top: "0%" }, { top: "100%", ease: "none", scrollTrigger: st });
    });
    return () => ctx.revert();
  }, []);
  return (
    <Sec innerRef={r} theme="ink" font="serif" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#e0905a", ["--sx-accent-text" as string]: "#1a0e06" }}>
      <style>{JR_CSS}</style>
      <div className="jr6-glow pointer-events-none absolute left-[-15%] top-[4%] aspect-square w-[50%] rounded-full" />
      <div className="jr6-glow jr6-glow2 pointer-events-none absolute right-[-15%] top-[38%] aspect-square w-[50%] rounded-full" />
      <div className="jr6-glow pointer-events-none absolute bottom-[2%] left-[-10%] aspect-square w-[45%] rounded-full" />

      <article className="relative mx-auto max-w-[720px] md:pl-0">
        <header className="mb-[clamp(48px,6vw,88px)]">
          <H className="text-[clamp(44px,5vw,84px)]">Notes from the bean room</H>
          <P className="mt-6 max-w-[48ch]">How two friends went from a kitchen experiment to a small chocolate workshop in Kochi. A founder story, in three parts.</P>
          <p className="mt-6 text-[14px] text-[var(--sx-muted)]">By Anika Rao · 9 min read</p>
        </header>

        <div ref={track} className="relative">
          {/* tracing beam: track + dot at top + beam that grows with the scroll */}
          <div className="absolute bottom-0 top-0 -left-[clamp(28px,4vw,64px)] w-px bg-[var(--sx-line)] max-md:-left-3">
            <span className="absolute -left-[6px] -top-[6px] grid h-[13px] w-[13px] place-items-center rounded-full border border-[var(--sx-accent)] bg-[var(--sx-bg)]">
              <span className="h-[5px] w-[5px] rounded-full bg-[var(--sx-accent)]" />
            </span>
            <div ref={beam} className="absolute inset-x-[-1px] top-0 h-full origin-top bg-[linear-gradient(180deg,transparent,var(--sx-accent)_12%,#f5c99a_70%,var(--sx-accent))]" />
            <span ref={head} className="absolute -left-[5px] top-full -mt-[5px] h-[11px] w-[11px]">
              <span className="jr6-ping absolute inset-0 rounded-full bg-[var(--sx-accent)]" />
              <span className="absolute inset-0 rounded-full bg-[var(--sx-accent)] shadow-[0_0_24px_6px_color-mix(in_srgb,var(--sx-accent)_60%,transparent)]" />
            </span>
          </div>

          {CHAPTERS.map((c, k) => (
            <section key={c.t} className={k ? "mt-[clamp(64px,8vw,120px)]" : ""}>
              <span className="inline-block rounded-full bg-[var(--sx-accent)] px-3.5 py-1.5 text-[13px] font-[650] text-[var(--sx-accent-text)]">{c.badge}</span>
              <h3 data-m-text className="sx-display mt-5 text-[clamp(30px,2.8vw,44px)] font-[600] leading-[1.08] tracking-[-0.01em]">{c.t}</h3>
              <Pic i={c.i} ratio="16/9" label="" className="mt-7 w-full" />
              {c.p.map((t) => (
                <P key={t.slice(0, 20)} className="mt-6 text-[clamp(17px,1.3vw,20px)] text-[color-mix(in_srgb,var(--sx-text)_78%,transparent)]">
                  {t}
                </P>
              ))}
            </section>
          ))}

          <div className="mt-[clamp(56px,7vw,96px)] flex flex-wrap items-center justify-between gap-5 border-t border-[var(--sx-line)] pt-8">
            <p className="text-[16px]">Taste the Idukki 72% · ₹420</p>
            <Btn>Shop the bars</Btn>
          </div>
        </div>
      </article>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "JR12", name: "Archive index table", motion: "M48", C: JR12 },
  { code: "JR13", name: "Long-read column with a tracing scroll beam", motion: "M23", C: JR13 },
];
