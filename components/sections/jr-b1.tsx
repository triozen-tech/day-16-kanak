"use client";

// JR · Journal / news layouts (docs/SECTION-MENU.md), batch 1.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Hands-free cycling: steps an index every `ms` while the section is on screen (stops off screen and in ?static=1). */
function useAutoCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms = 2600) {
  const [i, setI] = useState(0);
  const [live, setLive] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    setLive(true);
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
  return [i, setI, live] as const;
}

/** JR01 · Featured post + filter pills + grid: a large featured story (image left, text right), then category pills
 *  that filter a 3-column grid of posts. The pills step through by themselves while on screen. */
function JR01() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M13");
  const cats = ["Latest", "Brewing", "Origins", "Recipes"] as const;
  const posts: { c: (typeof cats)[number]; t: string; m: string; i: number }[] = [
    { c: "Brewing", t: "The 1:16 pour-over, explained in one cup", m: "6 min read", i: 3 },
    { c: "Origins", t: "A week of picking on a Coorg estate", m: "9 min read", i: 2 },
    { c: "Recipes", t: "Cold brew tonic with kokum and salt", m: "3 min read", i: 1 },
    { c: "Brewing", t: "Why your moka pot tastes burnt", m: "5 min read", i: 0 },
    { c: "Origins", t: "Monsooned Malabar: the wind does the work", m: "7 min read", i: 3 },
    { c: "Recipes", t: "Filter-coffee tiramisu, no oven", m: "4 min read", i: 2 },
    { c: "Brewing", t: "Grind size, from espresso to French press", m: "8 min read", i: 1 },
    { c: "Origins", t: "Meet the roaster who tastes 200 cups a day", m: "6 min read", i: 0 },
    { c: "Recipes", t: "A jaggery affogato for warm afternoons", m: "3 min read", i: 3 },
  ];
  const [k, setK] = useAutoCycle(r, cats.length, 2600);
  const cat = cats[k];
  const shown = (cat === "Latest" ? posts : posts.filter((p) => p.c === cat)).slice(0, 3);
  return (
    <Sec innerRef={r} theme="paper" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <style>{`
        .jr01-in{animation:jr01-in .7s cubic-bezier(.22,1,.36,1) both}
        @keyframes jr01-in{from{opacity:0;translate:0 18px}}
        html.is-static .jr01-in{animation:none}
      `}</style>
      <div className="grid grid-cols-1 items-center gap-[clamp(28px,4vw,72px)] md:grid-cols-12">
        <div className="md:col-span-7">
          <div className="fx-drift overflow-hidden rounded-[var(--sx-radius)]">
            <Pic i={2} ratio="16/11" label="THE JOURNAL" />
          </div>
        </div>
        <div className="md:col-span-5">
          <p className="text-[13px] text-[var(--sx-muted)]">Origins · 12 min read · 28 Sep</p>
          <H className="mt-4 text-[clamp(40px,4.4vw,76px)]">The farm that waits for the monsoon.</H>
          <P className="mt-5 max-w-[42ch]">On a hillside in Chikmagalur, Asha Kariappa dries her cherries under the first rains on purpose. We spent a harvest finding out why.</P>
          <div className="mt-8">
            <Btn kind="link">Read the story →</Btn>
          </div>
        </div>
      </div>
      <div className="mt-[clamp(56px,7vw,104px)] flex flex-wrap items-center justify-between gap-5 border-t border-[var(--sx-line)] pt-8">
        <p className="sx-display text-[clamp(28px,2.6vw,40px)] leading-none">From the journal</p>
        <div className="flex flex-wrap gap-2" role="tablist">
          {cats.map((c, n) => (
            <button
              key={c}
              role="tab"
              aria-selected={n === k}
              onClick={() => setK(n)}
              className={`rounded-full border px-5 py-2.5 text-[14px] font-[600] transition-colors duration-300 ${n === k ? "border-[var(--sx-text)] bg-[var(--sx-text)] text-[var(--sx-bg)]" : "border-[var(--sx-line)] text-[var(--sx-muted)]"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-[clamp(20px,2.4vw,36px)] md:grid-cols-3">
        {shown.map((p, n) => (
          <article key={`${cat}-${p.t}`} className="jr01-in" style={{ animationDelay: `${n * 0.08}s` }}>
            <Pic i={p.i} ratio="4/3" />
            <p className="mt-4 text-[13px] text-[var(--sx-muted)]">
              <span className="text-[var(--sx-accent)]">{p.c}</span> · {p.m}
            </p>
            <p className="sx-display mt-2 text-[clamp(22px,1.8vw,28px)] leading-[1.15]">{p.t}</p>
          </article>
        ))}
      </div>
    </Sec>
  );
}

/** JR02 · Dated news ledger: six full-width rows (date left, headline middle, thumbnail + arrow right) on hairlines.
 *  Hands-free: a "now reading" fill sweeps across one row at a time. */
function JR02() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const rows = [
    ["02 Oct", "Our autumn tasting menu opens, eleven courses from the hills", 1],
    ["24 Sep", "Chef Rohan Iyer joins the kitchen from the coast", 3],
    ["11 Sep", "Two new rooms above the garden, booking from November", 2],
    ["30 Aug", "The bakery now opens at seven on weekends", 0],
    ["18 Aug", "A night of fermented things with the Kodai cheese makers", 1],
    ["02 Aug", "Notes from the kitchen garden: forty kinds of chilli", 3],
  ] as const;
  const [on, , live] = useAutoCycle(r, rows.length, 2200);
  return (
    <Sec innerRef={r} theme="stone" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[12ch] text-[clamp(44px,5.6vw,96px)]">News from the house.</H>
        <Btn kind="ghost">All news</Btn>
      </div>
      <div className="mt-[clamp(40px,5vw,72px)] border-b border-[var(--sx-line)]">
        {rows.map(([d, t, i], k) => (
          <a key={d} href="#" onClick={(e) => e.preventDefault()} className="relative grid grid-cols-1 items-center gap-4 overflow-hidden border-t border-[var(--sx-line)] py-[clamp(18px,2vw,28px)] md:grid-cols-[160px_minmax(0,1fr)_auto] md:gap-[clamp(20px,3vw,48px)]">
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 w-full origin-left bg-[color-mix(in_srgb,var(--sx-accent)_9%,transparent)]"
              style={{ transform: `scaleX(${live && on === k ? 1 : 0})`, transition: live && on === k ? "transform 2.2s linear" : "transform .35s ease-out" }}
            />
            <span className="relative text-[14px] uppercase tracking-[0.12em] text-[var(--sx-muted)] tabular-nums">{d} 2026</span>
            <span data-m-text className="sx-display relative text-[clamp(22px,2.2vw,34px)] leading-[1.15]">
              {t}
            </span>
            <span className="relative flex items-center gap-5">
              <Pic i={i} ratio="4/3" className="w-[clamp(96px,8vw,128px)]" round />
              <span className={`grid size-11 place-items-center rounded-full border border-[var(--sx-line)] transition-colors duration-300 ${live && on === k ? "bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : ""}`}>→</span>
            </span>
          </a>
        ))}
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "JR01", name: "Featured post + filter pills + grid", motion: "M13", C: JR01 },
  { code: "JR02", name: "Dated news ledger", motion: "M23", C: JR02 },
];
