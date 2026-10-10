"use client";

// ST · Stats / ingredient layouts (docs/SECTION-MENU.md). Each is a full designed section; motion via useSectionMotion or a
// scoped loop (M33 orbit). Numbers hold their final value in the markup so ?static=1 reads correctly.
import { useEffect, useRef, type CSSProperties } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Pic, Product, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const vars = (o: Record<string, string>) => o as CSSProperties;

const ST01_CSS = `.st01-shine{background:linear-gradient(100deg,var(--sx-text) 40%,var(--sx-accent) 50%,var(--sx-text) 60%) 0 0/300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:st01-shine 3.2s linear infinite}@keyframes st01-shine{from{background-position:100% 0}to{background-position:0% 0}}.is-static .st01-shine{animation:none;background-position:100% 0}html.is-static {.st01-shine{animation:none}}`;

/** ST01 · Big numbers row: four stats split by vertical hairlines, each number counts up. */
function ST01() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M3");
  const stats = [
    ["60", "hr", "Battery with noise cancelling on"],
    ["32", "ms", "Latency in game mode"],
    ["6", "mics", "Beam-formed for calls in traffic"],
    ["4.8", "★", "From 12,400 owner reviews"],
  ];
  return (
    <Sec innerRef={r} theme="ink" font="wide" className="py-[clamp(72px,9vw,140px)]" style={vars({ "--sx-accent": "#9d8cff" })}>
      {/* a light runs through the numbers after they count up, so the row never sits still on camera */}
      <style>{ST01_CSS}</style>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[16ch] text-[clamp(40px,4.8vw,80px)]">Numbers you can hear.</H>
        <Btn kind="ghost">Compare earbuds</Btn>
      </div>
      <div className="mt-[clamp(40px,6vw,88px)] grid grid-cols-2 border-y border-[var(--sx-line)] md:grid-cols-4">
        {stats.map(([n, u, t], k) => (
          <div key={t} className={`border-[var(--sx-line)] px-[clamp(14px,2vw,32px)] py-[clamp(28px,4vw,56px)] ${k % 2 ? "border-l border-[var(--sx-line)]" : ""} ${k === 2 ? "md:border-l" : ""} ${k > 1 ? "max-md:border-t" : ""} ${k === 0 ? "md:pl-0" : ""}`}>
            <p className="sx-display flex flex-wrap items-baseline gap-x-2 font-[800] leading-none">
              <span data-m-num className="st01-shine text-[clamp(44px,7vw,124px)] tabular-nums tracking-[-0.03em]">
                {n}
              </span>
              <span className="text-[clamp(18px,1.6vw,26px)] text-[var(--sx-accent)]">{u}</span>
            </p>
            <p className="mt-4 max-w-[22ch] text-[15px] text-[var(--sx-muted)]">{t}</p>
          </div>
        ))}
      </div>
    </Sec>
  );
}

/** ST02 · Ingredient dossier: specimen cards like lab index cards (latin name, role, dose, source). */
function ST02() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M18");
  const cards = [
    { no: "A-14", common: "Centella", latin: "Centella asiatica", role: "Calms redness, rebuilds barrier", dose: "2.0%", source: "Wayanad, Kerala" },
    { no: "B-02", common: "Rice ferment", latin: "Oryza sativa (ferment)", role: "Brightens, softens texture", dose: "8.5%", source: "Palakkad, Kerala" },
    { no: "C-31", common: "Niacinamide", latin: "Nicotinamide", role: "Evens tone, tightens pores", dose: "4.0%", source: "Lab-made, Pune" },
    { no: "D-07", common: "Turmeric root", latin: "Curcuma longa", role: "Antioxidant shield", dose: "0.5%", source: "Erode, Tamil Nadu" },
  ];
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]" style={vars({ "--sx-accent": "#8c3b2a" })}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-end">
        <H className="text-[clamp(44px,5.6vw,96px)] md:col-span-7">Four actives, on the record.</H>
        <P className="md:col-span-4 md:col-start-9">Every ingredient in the Barrier Serum, at the exact dose, with where it comes from. Nothing hidden behind “and more”.</P>
      </div>
      <div className="mt-[clamp(36px,5vw,64px)] grid grid-cols-1 gap-[clamp(12px,1.4vw,20px)] sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, k) => (
          <article
            key={c.no}
            data-m-card
            className="relative overflow-hidden rounded-[6px] border border-[var(--sx-line)] bg-[var(--sx-surface)] p-[clamp(18px,1.8vw,26px)] shadow-[0_18px_40px_-28px_rgba(28,24,19,.4)]"
            style={{ backgroundImage: "repeating-linear-gradient(180deg, transparent 0 31px, color-mix(in srgb, var(--sx-accent) 10%, transparent) 31px 32px)", rotate: `${[-0.8, 0.6, -0.4, 0.9][k]}deg` }}
          >
            <div className="flex items-center justify-between border-b-2 border-[var(--sx-accent)] pb-3 font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--sx-accent)]">
              <span>Specimen {c.no}</span>
              <span className="size-3 rounded-full border border-[var(--sx-accent)]" aria-hidden />
            </div>
            <p className="sx-display mt-5 text-[clamp(28px,2.4vw,38px)] leading-[1.05]">{c.common}</p>
            <p className="mt-1 text-[15px] italic text-[var(--sx-muted)]">{c.latin}</p>
            <dl className="mt-6 grid gap-3 text-[14px]">
              {(
                [
                  ["Role", c.role],
                  ["Dose", c.dose],
                  ["Source", c.source],
                ] as const
              ).map(([k2, v]) => (
                <div key={k2} className="grid grid-cols-[64px_1fr] gap-3">
                  <dt className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--sx-muted)]">{k2}</dt>
                  <dd className={k2 === "Dose" ? "text-[20px] font-[650] leading-none" : ""}>{v}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
    </Sec>
  );
}

/** ST03 · Ingredient orbit: the product centred, six ingredient chips circling slowly (M33). Phone: chips become a slow marquee. */
const ST03_CSS = `
@keyframes st03-marq{to{transform:translateX(-50%)}}
.st03-marq{animation:st03-marq 22s linear infinite}
.is-static .st03-marq{animation:none}
html.is-static {.st03-marq{animation:none}}
`;
function ST03() {
  const r = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const chips = [
    ["Green coffee", "80 mg caffeine"],
    ["Taurine", "1,000 mg"],
    ["Vitamin B12", "100% RDA"],
    ["Ginseng", "200 mg"],
    ["L-theanine", "100 mg, no jitters"],
    ["Electrolytes", "Na · K · Mg"],
  ];
  useEffect(() => {
    const el = ring.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, paused: true });
      tl.to(el, { rotation: 360, duration: 48, ease: "none" }, 0).to(el.querySelectorAll("[data-chip]"), { rotation: -360, duration: 48, ease: "none" }, 0);
      const io = new IntersectionObserver(([e]) => (e.isIntersecting ? tl.play() : tl.pause()));
      io.observe(el);
      return () => io.disconnect();
    }, el);
    return () => ctx.revert();
  }, []);
  return (
    <Sec innerRef={r} theme="ink" font="condensed" className="py-[clamp(72px,9vw,140px)]" style={vars({ "--sx-accent": "#ffd23f", "--sx-accent-text": "#141003" })}>
      <style>{ST03_CSS}</style>
      <div className="grid grid-cols-1 items-center gap-[clamp(32px,4vw,64px)] md:grid-cols-12">
        <div className="md:col-span-4">
          <H className="text-[clamp(52px,6vw,108px)] leading-[0.88]">Six things inside. Nothing else.</H>
          <P className="mt-6 max-w-[36ch]">Every can of Sunrise Charge runs on the same short list, printed in full on the side.</P>
          <div className="mt-8">
            <Btn>See the full label</Btn>
          </div>
        </div>
        <div className="relative md:col-span-8">
          <div className="relative mx-auto aspect-square w-[min(100%,640px)] max-md:hidden">
            <div className="absolute inset-[14%] rounded-full border border-dashed border-[var(--sx-line)]" />
            <div className="absolute inset-[30%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_30%,transparent),transparent)]" />
            <div className="absolute inset-0 grid place-items-center">
              <Product angle={0} accent="#ffb703" className="h-[54%] w-auto" />
            </div>
            <div ref={ring} className="absolute inset-[14%]">
              {chips.map(([t, s], k) => {
                const ang = (k / chips.length) * Math.PI * 2 - Math.PI / 2;
                return (
                  <div key={t} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${50 + 50 * Math.cos(ang)}%`, top: `${50 + 50 * Math.sin(ang)}%` }}>
                    <div data-chip className="sx-card whitespace-nowrap px-4 py-2.5 text-center shadow-[0_12px_30px_-12px_rgba(0,0,0,.6)]">
                      <b className="block text-[15px] font-[650]">{t}</b>
                      <span className="text-[13px] text-[var(--sx-accent)]">{s}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* phone: product, then the chips drift past as a slow marquee */}
          <div className="md:hidden">
            <div className="relative grid place-items-center py-4">
              <div className="absolute aspect-square w-[80%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_28%,transparent),transparent)]" />
              <Product angle={0} accent="#ffb703" className="relative h-[340px] w-auto" />
            </div>
            <div className="-mx-[clamp(20px,5vw,96px)] mt-6 overflow-hidden">
              <div className="st03-marq flex w-max gap-3">
                {[...chips, ...chips].map(([t, s], k) => (
                  <div key={k} className="sx-card shrink-0 whitespace-nowrap px-4 py-2.5">
                    <b className="block text-[15px] font-[650]">{t}</b>
                    <span className="text-[13px] text-[var(--sx-accent)]">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/** ST04 · Nutrition label: a typographic facts panel (like a food label) beside a short claim. */
function ST04() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const rows: [string, string, string, boolean][] = [
    ["Total fat", "12.4 g", "16%", true],
    ["Saturated fat", "7.6 g", "38%", false],
    ["Total carbohydrate", "9.8 g", "4%", true],
    ["Dietary fibre", "3.9 g", "14%", false],
    ["Total sugars", "6.1 g", "", false],
    ["Protein", "2.6 g", "", true],
    ["Iron", "3.2 mg", "18%", true],
    ["Magnesium", "68 mg", "16%", true],
  ];
  return (
    <Sec innerRef={r} theme="stone" font="editorial" className="py-[clamp(72px,9vw,140px)]" style={vars({ "--sx-accent": "#6b2f1a" })}>
      <div className="grid grid-cols-1 items-center gap-[clamp(36px,6vw,104px)] md:grid-cols-12">
        <div className="md:col-span-6">
          <H className="text-[clamp(52px,6.4vw,112px)]">Less sugar than an apple.</H>
          <P className="mt-6 max-w-[42ch]">Our 72% Idukki bar carries 6 grams of sugar per serving, sweetened only with raw cane jaggery. Read the label, it is the whole story.</P>
          <div className="mt-6 flex flex-wrap items-center gap-6">
            <Pic i={0} ratio="1/1" className="w-24" />
            <div>
              <p className="text-[17px] font-[650]">The 72% Idukki bar</p>
              <p className="text-[15px] text-[var(--sx-muted)]">70 g · ₹340</p>
            </div>
          </div>
        </div>
        <div data-m-card className="w-full max-w-[460px] justify-self-center border-[3px] border-[var(--sx-text)] bg-[var(--sx-surface)] p-[clamp(14px,1.6vw,20px)] font-sans text-[var(--sx-text)] md:col-span-6 md:justify-self-end">
          <p className="text-[clamp(34px,3.6vw,48px)] font-[900] leading-none tracking-[-0.02em]">Nutrition Facts</p>
          <p className="mt-2 border-b border-[var(--sx-text)] pb-2 text-[14px]">7 servings per bar</p>
          <div className="flex items-baseline justify-between border-b-[10px] border-[var(--sx-text)] py-1.5 text-[15px] font-[800]">
            <span>Serving size</span>
            <span>10 g (2 squares)</span>
          </div>
          <div className="flex items-end justify-between border-b-[5px] border-[var(--sx-text)] py-2">
            <span className="text-[15px] font-[800] leading-tight">
              Amount per serving
              <br />
              <span className="text-[30px] font-[900]">Calories</span>
            </span>
            <span className="text-[44px] font-[900] leading-none">58</span>
          </div>
          <p className="border-b border-[var(--sx-text)] py-1 text-right text-[12px] font-[800]">% Daily Value*</p>
          {rows.map(([k, v, d, bold]) => (
            <div key={k} className={`flex justify-between gap-4 border-b border-[var(--sx-text)] py-1 text-[14px] ${bold ? "" : "pl-5"}`}>
              <span>
                <b className={bold ? "font-[800]" : "font-[400]"}>{k}</b> {v}
              </span>
              <b className="font-[800]">{d}</b>
            </div>
          ))}
          <p className="mt-2 text-[12px] leading-snug">* Percent Daily Values are based on a 2,000 calorie diet. Ingredients: cacao beans, raw cane jaggery, cacao butter.</p>
        </div>
      </div>
    </Sec>
  );
}

/** ST05 · Stats band: an accent-coloured full-width band, three stats and a thin marquee line running under them. */
const ST05_CSS = `
@keyframes st05-marq{to{transform:translateX(-50%)}}
.st05-marq{animation:st05-marq 30s linear infinite}
.is-static .st05-marq{animation:none}
html.is-static {.st05-marq{animation:none}}
`;
function ST05() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M3");
  const stats = [
    ["86", "tea gardens we buy from directly"],
    ["1,200", "metres, our highest Darjeeling estate"],
    ["48", "hours from leaf to sealed tin"],
  ];
  const line = ["First flush", "Hand-rolled", "Single estate", "Plastic-free tins", "Fair-price contracts", "Picked at dawn"];
  return (
    <Sec innerRef={r} theme="paper" font="grotesk" full style={vars({ "--sx-accent": "#2f5d3a", "--sx-accent-text": "#f2f0e3" })}>
      <style>{ST05_CSS}</style>
      <div className="bg-[var(--sx-accent)] text-[var(--sx-accent-text)]">
        <div className="px-[clamp(20px,5vw,96px)] pb-[clamp(48px,6vw,88px)] pt-[clamp(72px,9vw,128px)]">
          <H className="max-w-[20ch] text-[clamp(36px,4vw,64px)]">A tea company, by the numbers.</H>
          <div className="mt-[clamp(36px,5vw,64px)] grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-[clamp(24px,4vw,64px)]">
            {stats.map(([n, t]) => (
              <div key={t} className="border-t border-current/25 pt-6">
                <p data-m-num className="sx-display text-[clamp(52px,8vw,144px)] font-[800] leading-[0.9] tracking-[-0.04em] tabular-nums">
                  {n}
                </p>
                <p className="mt-3 max-w-[26ch] text-[16px] opacity-80">{t}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="overflow-hidden border-t border-current/25 py-3.5">
          <div className="st05-marq flex w-max whitespace-nowrap text-[13px] font-[600] uppercase tracking-[0.18em]">
            {[...line, ...line, ...line, ...line].map((w, k) => (
              <span key={k} className="px-6">
                {w}
                <span className="ml-12 opacity-50">✦</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </Sec>
  );
}

const ST06_CSS = `.st06-sheen{position:relative;overflow:hidden}.st06-sheen::after{content:"";position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.55) 50%,transparent 70%);transform:translateX(-120%);animation:st06-sweep 2.6s ease-in-out infinite}@keyframes st06-sweep{to{transform:translateX(120%)}}.is-static .st06-sheen::after{animation:none;opacity:0}html.is-static {.st06-sheen::after{animation:none;opacity:0}}`;

/** ST06 · Comparison bars: "ours vs regular" horizontal bars that grow to their value while the numbers count. */
function ST06() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M3");
  useEffect(() => {
    // the bars grow in step with the M3 counters (same trigger); final widths are in the markup for ?static=1
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-bar]", { scaleX: 0, transformOrigin: "0 50%", duration: 1.6, ease: "power3.out", stagger: 0.08, scrollTrigger: { trigger: el, start: "top 75%", toggleActions: "play none none reverse" } });
    }, el);
    return () => ctx.revert();
  }, []);
  const rows: { k: string; unit: string; ours: number; reg: number; max: number }[] = [
    { k: "Caffeine", unit: "mg", ours: 210, reg: 95, max: 240 },
    { k: "Sugar", unit: "g", ours: 0, reg: 24, max: 30 },
    { k: "Acidity", unit: "% of hot brew", ours: 33, reg: 100, max: 100 },
    { k: "Steep time", unit: "hr", ours: 18, reg: 1, max: 20 },
  ];
  return (
    <Sec innerRef={r} theme="ink" font="grotesk" className="py-[clamp(72px,9vw,140px)]" style={vars({ "--sx-accent": "#e0a458", "--sx-accent-text": "#140c03" })}>
      {/* a slow light sweep along "our" bars keeps the section alive after the counters land (never frozen on camera) */}
      <style>{ST06_CSS}</style>
      <div className="grid grid-cols-1 gap-[clamp(36px,5vw,80px)] md:grid-cols-12">
        <div className="md:col-span-4">
          <H className="text-[clamp(44px,5vw,84px)]">Ours vs. the regular can.</H>
          <P className="mt-5 max-w-[36ch]">Slow cold brew against an average store-bought iced coffee, per 250 ml serving.</P>
          <div className="mt-8 flex flex-wrap gap-5 text-[14px]">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-6 rounded-full bg-[var(--sx-accent)]" /> Slowpour cold brew
            </span>
            <span className="flex items-center gap-2 text-[var(--sx-muted)]">
              <span className="h-2.5 w-6 rounded-full bg-[var(--sx-line)]" /> Regular iced coffee
            </span>
          </div>
        </div>
        <div className="grid gap-[clamp(24px,3vw,40px)] md:col-span-8">
          {rows.map((x) => (
            <div key={x.k}>
              <div className="flex items-baseline justify-between gap-4 border-b border-[var(--sx-line)] pb-2">
                <span className="text-[clamp(20px,1.8vw,26px)] font-[650]">{x.k}</span>
                <span className="text-[13px] text-[var(--sx-muted)]">{x.unit}</span>
              </div>
              <div className="mt-4 grid gap-2.5">
                {(
                  [
                    [x.ours, true],
                    [x.reg, false],
                  ] as const
                ).map(([v, ours], k) => (
                  <div key={k} className="flex items-center gap-4">
                    <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--sx-text)_5%,transparent)]">
                      <div data-bar className={`h-full rounded-full ${ours ? "st06-sheen bg-[var(--sx-accent)]" : "bg-[var(--sx-muted)] opacity-50"}`} style={{ width: `${Math.max(1.5, (v / x.max) * 100)}%` }} />
                    </div>
                    <span data-m-num className={`w-14 text-right text-[18px] font-[650] tabular-nums ${ours ? "text-[var(--sx-accent)]" : "text-[var(--sx-muted)]"}`}>
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Sec>
  );
}

export const STATS: SectionDef[] = [
  { code: "ST01", name: "Big numbers row with hairline dividers", motion: "M3", C: ST01 },
  { code: "ST02", name: "Ingredient dossier: specimen index cards", motion: "M18", C: ST02 },
  { code: "ST03", name: "Ingredient orbit around the product", motion: "M33", C: ST03 },
  { code: "ST04", name: "Nutrition facts label + claim", motion: "M23", C: ST04 },
  { code: "ST05", name: "Accent stats band with marquee line", motion: "M3", C: ST05 },
  { code: "ST06", name: "Comparison bars: ours vs regular", motion: "M3", C: ST06 },
];
