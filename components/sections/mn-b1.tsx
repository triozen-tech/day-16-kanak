"use client";

// MN · Menu layouts (docs/SECTION-MENU.md). Each is a full designed section; motion via useSectionMotion.
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Hands-free cycling: steps an index every `ms` while the section is on screen (stops off screen and in ?static=1). */
function useAutoCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms = 1600) {
  const [i, setI] = useState(-1);
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
  return i;
}

type Dish = { n: string; d: string; p: string; tag?: string };
const COURSES: { t: string; dishes: Dish[] }[] = [
  {
    t: "Starters",
    dishes: [
      { n: "Charred corn bhel", d: "Puffed rice, raw mango, green chilli, lime", p: "₹380", tag: "VG" },
      { n: "Beetroot galouti", d: "Melt-in kebab, saffron sheermal, mint yoghurt", p: "₹460", tag: "V" },
      { n: "Tellicherry prawns", d: "Pepper butter, curry leaf, sourdough crumb", p: "₹720" },
    ],
  },
  {
    t: "Mains",
    dishes: [
      { n: "Slow lamb nihari", d: "Bone marrow, ginger, twelve-hour stock", p: "₹1,180" },
      { n: "Coconut moilee", d: "Line-caught seer fish, turmeric, appam", p: "₹980", tag: "GF" },
      { n: "Wild mushroom khichdi", d: "Aged rice, ghee, pickled shallot", p: "₹740", tag: "V" },
    ],
  },
  {
    t: "Desserts",
    dishes: [
      { n: "Jaggery crème brûlée", d: "Nolen gur, cardamom shortbread", p: "₹420", tag: "V" },
      { n: "Dark chocolate kulfi", d: "72% cacao, sea salt, rose praline", p: "₹390", tag: "GF" },
    ],
  },
  {
    t: "Drinks",
    dishes: [
      { n: "Kokum spritz", d: "Kokum, tonic, black salt, orange peel", p: "₹320", tag: "VG" },
      { n: "Filter coffee tonic", d: "Cold-brewed decoction, elderflower", p: "₹280", tag: "VG" },
    ],
  },
];

const MN_GLOW = `.mn-glow{position:absolute;z-index:-1;inset:-10%;pointer-events:none;background:radial-gradient(38% 30% at 25% 35%,color-mix(in srgb,var(--sx-accent) 13%,transparent),transparent 70%),radial-gradient(34% 28% at 75% 70%,color-mix(in srgb,var(--sx-accent) 10%,transparent),transparent 70%);animation:mn-glow 5s linear infinite alternate}@keyframes mn-glow{from{transform:translate(-7%,-3%) rotate(-4deg)}to{transform:translate(7%,3%) rotate(4deg)}}.is-static .mn-glow{animation:none}html.is-static {.mn-glow{animation:none}}`;
const MN01_CSS = `.mn01-row{position:relative;transition:background-color .6s ease,padding .6s ease}.mn01-row.is-on{background:color-mix(in srgb,var(--sx-accent) 12%,transparent)}.mn01-lead{transform-origin:0 50%;background-image:radial-gradient(circle,var(--sx-muted) 1px,transparent 1.4px);background-size:7px 3px;background-repeat:repeat-x;background-position:0 50%;height:4px;opacity:.7}`;

/** MN01 · Two-column course menu: centred title; two columns of courses, each dish with dotted leader to its price. */
function MN01() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const all = COURSES.flatMap((c) => c.dishes);
  const on = useAutoCycle(r, all.length, 1500);
  // the dotted leaders draw across to each price (part of the same entry, after the lines slide in)
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from(el.querySelectorAll(".mn01-lead"), { scaleX: 0, duration: 1.1, ease: "power3.inOut", stagger: 0.06, delay: 0.5, scrollTrigger: { trigger: el, start: "top 75%", toggleActions: "play none none reverse" } });
    }, el);
    return () => ctx.revert();
  }, []);
  let idx = -1;
  const col = (cs: typeof COURSES) =>
    cs.map((c) => (
      <div key={c.t} className="mb-[clamp(40px,5vw,72px)] last:mb-0">
        <h3 data-m-head className="sx-display border-b border-[var(--sx-line)] pb-4 text-[clamp(28px,2.6vw,42px)] italic leading-none">{c.t}</h3>
        <ul className="mt-3">
          {c.dishes.map((d) => {
            idx += 1;
            return (
              <li key={d.n} className={`mn01-row -mx-4 rounded-[12px] px-4 py-4 ${idx === on ? "is-on" : ""}`}>
                <div className="flex items-baseline gap-3">
                  <span data-m-text className="text-[clamp(17px,1.4vw,21px)] font-[600] text-[var(--sx-text)]">{d.n}</span>
                  <span className="mn01-lead min-w-[24px] flex-1" aria-hidden />
                  <span className="text-[clamp(17px,1.4vw,21px)] font-[600] tabular-nums">{d.p}</span>
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-3 text-[14px] text-[var(--sx-muted)]">
                  {d.d}
                  {d.tag && <span className="rounded-full border border-[var(--sx-line)] px-2 py-[1px] text-[12px] font-[650] tracking-[0.08em] text-[var(--sx-accent)]">{d.tag}</span>}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    ));
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="isolate py-[clamp(72px,9vw,140px)]">
      <style>{MN_GLOW + MN01_CSS}</style>
      <div className="mn-glow" aria-hidden />
      <div className="mx-auto max-w-[760px] text-center">
        <H className="text-[clamp(48px,6vw,104px)]">Supper at the long table.</H>
        <P className="mx-auto mt-5 max-w-[46ch]">A short menu that changes with the market. Served Wednesday to Sunday, seven till late.</P>
      </div>
      <div className="mx-auto mt-[clamp(48px,6vw,88px)] grid max-w-[1180px] grid-cols-1 gap-x-[clamp(40px,7vw,120px)] md:grid-cols-2">
        <div className="min-w-0">{col(COURSES.slice(0, 2))}</div>
        <div className="min-w-0">{col(COURSES.slice(2))}</div>
      </div>
      <p className="mx-auto mt-[clamp(40px,5vw,64px)] max-w-[1180px] border-t border-[var(--sx-line)] pt-6 text-center text-[13px] text-[var(--sx-muted)]">V vegetarian · VG vegan · GF gluten free · Prices include taxes</p>
    </Sec>
  );
}

const TASTING = [
  { c: "Tomato water, frozen", w: "Sparkling Nashik rosé" },
  { c: "Oyster, kokum, cucumber snow", w: "Dry chenin, Sula hills" },
  { c: "Bread from the wood oven, cultured ghee", w: "—" },
  { c: "Raw kingfish, green mango, curry leaf oil", w: "Riesling, late picked" },
  { c: "Asparagus under smoked mustard", w: "Orange wine, skin contact" },
  { c: "Morel, aged rice, black lime", w: "Pinot noir, cool climate" },
  { c: "Crab in its own butter, appam", w: "Viognier" },
  { c: "Duck, pepper, burnt jaggery", w: "Syrah, Nandi hills" },
  { c: "A small cup of rasam", w: "Pause" },
  { c: "Buffalo curd, wild honey, pollen", w: "Moscato" },
  { c: "Cacao from Idukki, three ways", w: "Tawny, twenty years" },
  { c: "Paan, frozen, to finish", w: "Filter coffee" },
];

/** MN02 · Tasting menu: one narrow centred column of 12 numbered courses with pairings; a photo breaks it every four. */
function MN02() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M13");
  const on = useAutoCycle(r, TASTING.length, 1300);
  const groups = [TASTING.slice(0, 4), TASTING.slice(4, 8), TASTING.slice(8)];
  return (
    <Sec innerRef={r} theme="ink" font="editorial" full className="isolate py-[clamp(72px,9vw,140px)]">
      <style>{MN_GLOW}</style>
      <div className="mn-glow" aria-hidden />
      <div className="mx-auto max-w-[620px] px-6 text-center">
        <H className="text-[clamp(48px,5.6vw,96px)]">Twelve courses, one evening.</H>
        <P className="mx-auto mt-5 max-w-[40ch]">The spring tasting menu. Three and a half hours, sixteen seats, one sitting a night.</P>
      </div>
      {groups.map((g, gi) => (
        <div key={gi}>
          <ol className="mx-auto mt-[clamp(48px,6vw,80px)] max-w-[620px] px-6">
            {g.map((t, k) => {
              const n = gi * 4 + k;
              return (
                <li key={t.c} className={`border-b border-[var(--sx-line)] py-5 text-center transition-opacity duration-700 ${on === -1 || on === n ? "opacity-100" : "opacity-45"}`}>
                  <span className="text-[13px] tabular-nums tracking-[0.2em] text-[var(--sx-accent)]">{String(n + 1).padStart(2, "0")}</span>
                  <p data-m-text className="sx-display mt-1 text-[clamp(22px,2vw,30px)] italic leading-snug">{t.c}</p>
                  <p className="mt-1 text-[14px] text-[var(--sx-muted)]">{t.w}</p>
                </li>
              );
            })}
          </ol>
          {gi < 2 && (
            <div className="mt-[clamp(48px,6vw,80px)] overflow-hidden">
              <div className="fx-pan scale-[1.06]">
                <Pic i={gi ? 3 : 2} ratio="21/9" round={false} className="w-full" label={gi ? "COURSE 08" : "COURSE 04"} />
              </div>
            </div>
          )}
        </div>
      ))}
      <div className="mx-auto mt-[clamp(48px,6vw,80px)] flex max-w-[620px] flex-wrap items-baseline justify-center gap-x-4 gap-y-2 px-6 text-center">
        <p className="sx-display text-[clamp(36px,3.6vw,56px)] leading-none">₹9,500</p>
        <p className="text-[15px] text-[var(--sx-muted)]">per guest · pairing ₹6,000</p>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "MN01", name: "Two-column course menu with dotted leaders", motion: "M23", C: MN01 },
  { code: "MN02", name: "Tasting menu sequence", motion: "M13", C: MN02 },
];
