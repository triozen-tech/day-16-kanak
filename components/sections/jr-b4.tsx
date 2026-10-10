"use client";

// JR · Journal layouts (docs/SECTION-MENU.md), batch 4. Loops stop in ?static=1.
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

const JR_CSS = `.jr4-fill{transform-origin:left;animation:jr4-fill var(--d,1.3s) linear both}@keyframes jr4-fill{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.jr4-pic img{animation:jr4-push var(--p,6s) ease-in-out infinite alternate}@keyframes jr4-push{from{scale:1.03;translate:-2.5% 0}to{scale:1.16;translate:2.5% -2%}}
.jr4-sweep{background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.16) 48%,transparent 66%) 0 0/260% 100%;animation:jr4-sweep var(--s,2.6s) linear infinite}@keyframes jr4-sweep{from{background-position:130% 0}to{background-position:-30% 0}}
.is-static .jr4-fill,.is-static .jr4-pic img,.is-static .jr4-sweep{animation:none}
html.is-static {.jr4-fill,.jr4-pic img,.jr4-sweep{animation:none}}`;

// ── JR08 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const POSTS = [
  { t: "Why we stopped roasting dark", c: "Roastery", d: "28 Sep", m: 14 },
  { t: "A morning with the Baba Budan pickers", c: "Origins", d: "21 Sep", m: 22 },
  { t: "Filter coffee, the long way round", c: "Brewing", d: "14 Sep", m: 9 },
  { t: "What altitude does to a bean", c: "Science", d: "07 Sep", m: 17 },
  { t: "Six cups that changed our menu", c: "Menu", d: "31 Aug", m: 6 },
  { t: "The quiet economics of a café", c: "Notes", d: "24 Aug", m: 26 },
  { t: "Water is half the recipe", c: "Brewing", d: "17 Aug", m: 11 },
];
const MAXM = Math.max(...POSTS.map((p) => p.m));

/** JR08 · Index list with reading-length bars: numbered post titles with a running index marker in a left gutter and
 *  bars on the right showing how long each read is; the bars grow in, the marker steps down the list by itself. */
function JR08() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const ms = 1300;
  const [i, setI] = useAutoCycle(r, POSTS.length, ms);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = r.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setShown(true), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#6b4f2a" }}>
      <style>{JR_CSS}</style>
      <div className="grid grid-cols-1 items-end gap-8 md:grid-cols-12">
        <H className="text-[clamp(48px,5.8vw,96px)] md:col-span-7">The long pour, indexed.</H>
        <div className="md:col-span-5 md:pb-3">
          <P className="max-w-[40ch]">Essays from our roastery and the farms behind it. The bar on the right tells you how long each one takes with a cup.</P>
        </div>
      </div>
      <ol className="mt-[clamp(40px,5vw,72px)] border-t border-[var(--sx-text)]">
        {POSTS.map((p, k) => {
          const on = k === i;
          return (
            <li key={p.t} onMouseEnter={() => setI(k)} className="relative border-b border-[var(--sx-line)]">
              {on && <div key={`f${i}`} className="jr4-fill absolute inset-0 bg-[color-mix(in_srgb,var(--sx-accent)_10%,transparent)]" style={{ ["--d" as string]: `${ms}ms` }} />}
              <a href="#" onClick={(e) => e.preventDefault()} className="relative grid grid-cols-[36px_56px_minmax(0,1fr)] items-center gap-x-[clamp(10px,1.6vw,24px)] gap-y-2 py-[clamp(16px,1.7vw,24px)] md:grid-cols-[36px_64px_minmax(0,1fr)_150px_minmax(160px,300px)]">
                <span className={`text-center text-[20px] text-[var(--sx-accent)] transition-all duration-500 ${on ? "translate-x-0 opacity-100" : "-translate-x-3 opacity-0"}`}>▸</span>
                <span className="text-[15px] font-[600] tabular-nums text-[var(--sx-muted)]">{String(k + 1).padStart(2, "0")}</span>
                <span className={`sx-display text-[clamp(22px,2vw,32px)] leading-[1.15] transition-transform duration-500 ${on ? "translate-x-2" : ""}`}>{p.t}</span>
                <span className="text-[14px] text-[var(--sx-muted)] max-md:col-start-3">
                  {p.c} · {p.d}
                </span>
                <span className="flex items-center gap-3 max-md:col-start-3">
                  <span className="relative h-[10px] flex-1 overflow-hidden rounded-full bg-[var(--sx-line)]">
                    <span
                      className={`absolute inset-y-0 left-0 rounded-full transition-[width,background-color] duration-[1200ms] ease-out ${on ? "bg-[var(--sx-accent)]" : "bg-[color-mix(in_srgb,var(--sx-text)_55%,transparent)]"}`}
                      style={{ width: shown ? `${(p.m / MAXM) * 100}%` : "0%", transitionDelay: shown ? `${k * 80}ms, 0ms` : "0ms" }}
                    />
                  </span>
                  <span className="w-[52px] text-right text-[14px] tabular-nums">{p.m} min</span>
                </span>
              </a>
            </li>
          );
        })}
      </ol>
      <div className="mt-8">
        <Btn kind="link">All 64 essays →</Btn>
      </div>
    </Sec>
  );
}

// ── JR09 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
type Entry = { date: string; drop: string; title: string; chips: string[]; lede: string; added: string[]; fixed: string[]; pics: number[] };
const LOG: Entry[] = [
  {
    date: "02 Oct 2026",
    drop: "Drop 14",
    title: "Runner 9 in Monsoon Grey",
    chips: ["Running", "New colourway"],
    lede: "Our everyday trainer, now in a wet-slate grey with a reflective heel tab for dark mornings.",
    added: ["Monsoon Grey and Chalk upper, ₹8,990", "Reflective heel tab and lace tips", "Sizes UK 5 to 13, half sizes included"],
    fixed: ["Toe box widened by 2 mm after your feedback"],
    pics: [3],
  },
  {
    date: "11 Sep 2026",
    drop: "Drop 13",
    title: "Court Low, restocked",
    chips: ["Lifestyle", "Restock"],
    lede: "The white-on-gum low top is back in every size, with a firmer heel counter.",
    added: ["All sizes back, ₹7,490", "Spare cotton laces in the box"],
    fixed: ["Heel counter stiffened, no more slipping", "Insole glue switched to a water-based one"],
    pics: [1, 2],
  },
  {
    date: "20 Aug 2026",
    drop: "Drop 12",
    title: "Trail 3 field test",
    chips: ["Trail", "Limited"],
    lede: "Two hundred pairs for runners who will tell us the truth about the new lug pattern.",
    added: ["200 numbered pairs, ₹10,490", "5 mm lugs in a recycled rubber"],
    fixed: [],
    pics: [],
  },
];

/** JR09 · Sticky-date release log: a narrow 190px left column holds the date + drop number and stays put while its entry
 *  scrolls; the right column holds the entry (title, chips, lede, picture, "New" and "Fixed" lists). Newest first. */
function JR09() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M6");
  return (
    <Sec innerRef={r} theme="ink" font="condensed" className="overflow-clip! py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#ff6a3d" }}>
      <style>{JR_CSS}</style>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="text-[clamp(56px,7vw,120px)] uppercase">Drop log.</H>
        <P className="max-w-[40ch] pb-2">Every release, restock and fix, newest first. Drops land on the first Thursday of the month at 10 am.</P>
      </div>
      <div className="mt-[clamp(40px,5vw,72px)] border-t border-[var(--sx-line)]">
        {LOG.map((e, k) => (
          <article key={e.drop} className="grid grid-cols-1 gap-x-[clamp(24px,4vw,72px)] gap-y-4 border-b border-[var(--sx-line)] py-[clamp(28px,3vw,44px)] md:grid-cols-[190px_minmax(0,1fr)]">
            <div className="self-start md:sticky md:top-24">
              <p className="text-[15px] tabular-nums text-[var(--sx-muted)]">{e.date}</p>
              <p className="sx-display mt-2 text-[clamp(30px,2.6vw,42px)] font-[800] uppercase leading-none">{e.drop}</p>
              {k === 0 && (
                <span className="mt-4 inline-flex rounded-full bg-[var(--sx-accent)] px-3 py-1 text-[12px] font-[700] uppercase tracking-[0.14em] text-[#140804]">Latest</span>
              )}
            </div>
            <div className="max-w-[860px]">
              <h3 data-m-head className="sx-display text-[clamp(32px,3.2vw,52px)] font-[800] uppercase leading-[0.95]">
                {e.title}
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {e.chips.map((c) => (
                  <span key={c} className="rounded-full border border-[var(--sx-line)] px-3 py-1 text-[13px] text-[var(--sx-muted)]">
                    {c}
                  </span>
                ))}
              </div>
              <p data-m-text className="mt-5 max-w-[58ch] text-[clamp(16px,1.2vw,19px)] leading-relaxed text-[var(--sx-muted)]">
                {e.lede}
              </p>
              {e.pics.length > 0 && (
                <div className={`mt-7 grid max-w-[760px] gap-4 ${e.pics.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                  {e.pics.map((p, j) => (
                    <div key={p} className="jr4-pic relative overflow-hidden rounded-[var(--sx-radius,18px)]" style={{ ["--p" as string]: `${5 + j * 1.2}s` }}>
                      <Pic i={p} ratio={e.pics.length > 1 ? "16/10" : "16/5.5"} label="" />
                      <div className="jr4-sweep pointer-events-none absolute inset-0" style={{ ["--s" as string]: `${2.4 + j * 0.5}s` }} />
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-7 grid grid-cols-1 gap-6 md:grid-cols-2">
                {[
                  ["New", e.added],
                  ["Fixed", e.fixed],
                ]
                  .filter(([, l]) => (l as string[]).length > 0)
                  .map(([h, l]) => (
                    <div key={h as string}>
                      <p className={`text-[13px] font-[700] uppercase tracking-[0.16em] ${h === "New" ? "text-[var(--sx-accent)]" : "text-[#7fc8a9]"}`}>{h as string}</p>
                      <ul className="mt-3 space-y-2">
                        {(l as string[]).map((x) => (
                          <li key={x} className="flex gap-3 text-[15px] leading-snug">
                            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />
                            {x}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "JR08", name: "Index list with reading-length bars", motion: "M23", C: JR08 },
  { code: "JR09", name: "Sticky-date release log", motion: "M6", C: JR09 },
];
