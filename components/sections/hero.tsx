"use client";

// HR · Hero layouts (docs/SECTION-MENU.md). Each is a full designed section; motion via useSectionMotion or fx.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { scene } from "../fx/shared";
import { LightRays } from "../fx/more";
import { Btn, H, Logos, P, Pic, Price, Product, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** HR01 · Split product hero: copy left (5/12), product right on a glow, proof strip of logos below. */
function HR01() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M6");
  return (
    <Sec innerRef={r} theme="ink" font="grotesk" className="py-[clamp(72px,10vw,140px)]">
      <div className="grid grid-cols-1 items-center gap-[clamp(32px,5vw,80px)] md:grid-cols-12">
        <div className="md:col-span-5">
          <H as="h1" className="text-[clamp(48px,6.4vw,104px)]">Cold brew, built for long days.</H>
          <P className="mt-6 max-w-[42ch]">Twelve-hour steeped, nitrogen-sealed, no sugar. One can, a clear head until the evening.</P>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Btn>Shop the range</Btn>
            <Btn kind="ghost">Find a store</Btn>
          </div>
          <p className="mt-8 text-[14px] text-[var(--sx-muted)]">
            From <Price now="₹149" className="text-[var(--sx-text)]" /> · free delivery over ₹999
          </p>
        </div>
        <div className="relative grid place-items-center md:col-span-7">
          <div className="absolute aspect-square w-[78%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_45%,transparent),transparent)]" />
          <Product angle={1} className="relative h-[min(64vh,560px)] w-auto max-md:h-[44svh]" />
        </div>
      </div>
      <div className="mt-[clamp(48px,7vw,96px)] border-t border-[var(--sx-line)] pt-8">
        <Logos />
      </div>
    </Sec>
  );
}

/** HR02 · Full-bleed photo with a centred statement and a bottom info bar (3 short facts + CTA). */
function HR02() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M13");
  return (
    <Sec innerRef={r} theme="ink" font="editorial" full className="relative">
      <div className="relative h-[clamp(620px,100svh,980px)]">
        <Pic i={3} ratio="auto" round={false} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,9,15,.2),rgba(7,9,15,.15)_40%,rgba(7,9,15,.85))]" />
        <div className="relative flex h-full flex-col items-center justify-center px-6 text-center">
          <H as="h1" className="max-w-[14ch] text-[clamp(56px,8.5vw,148px)] text-white">The slow roast, made light.</H>
          <P className="mt-6 max-w-[46ch] text-white/75">Single-origin beans, roasted in small drums every Tuesday.</P>
        </div>
        <div className="absolute inset-x-0 bottom-0 grid grid-cols-2 gap-px border-t border-white/15 bg-white/10 backdrop-blur-md md:grid-cols-4">
          {[
            ["Origin", "Chikmagalur, 1,200 m"],
            ["Roast", "Medium-light"],
            ["Notes", "Cocoa, plum, jaggery"],
          ].map(([k, v]) => (
            <div key={k} className="bg-[#07090f]/40 px-6 py-5 max-md:py-4">
              <p className="text-[12px] uppercase tracking-[0.14em] text-white/55">{k}</p>
              <p className="mt-1 text-[16px] text-white">{v}</p>
            </div>
          ))}
          <div className="flex items-center justify-end bg-[#07090f]/40 px-6 py-5 max-md:col-span-2 max-md:justify-start">
            <Btn>Order beans</Btn>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/** HR03 · Editorial collage: oversized headline across the top, three pictures at different sizes and heights below. */
function HR03() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M1");
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,128px)]">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H as="h1" className="max-w-[12ch] text-[clamp(56px,8vw,136px)]">Linen, slowly made.</H>
        <div className="max-w-[34ch] pb-3">
          <P>A summer edit of washed linen in six earth tones, cut and sewn in Jaipur.</P>
          <div className="mt-6">
            <Btn kind="link">See the edit →</Btn>
          </div>
        </div>
      </div>
      <div className="mt-[clamp(40px,6vw,80px)] grid grid-cols-12 items-start gap-[clamp(12px,2vw,28px)]">
        <Pic i={3} ratio="3/4" className="col-span-5" label="NO. 01" />
        <Pic i={1} ratio="1/1" className="col-span-4 mt-[18%]" label="NO. 02" />
        <Pic i={2} ratio="2/3" className="col-span-3 mt-[6%]" label="NO. 03" />
      </div>
    </Sec>
  );
}

/** Hands-free cycling: steps an index every `ms` while the section is on screen (stops off screen and in ?static=1). */
function useAutoCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms = 2600) {
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

/** HR04 · Giant wordmark behind a centred product, three spec chips floating around it. */
function HR04() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M12");
  const chips = [
    { k: "Caffeine", v: "160 mg", c: "md:left-[14%] md:top-[34%]" },
    { k: "Sugar", v: "0 g", c: "md:right-[16%] md:top-[22%]" },
    { k: "Electrolytes", v: "+3", c: "md:right-[20%] md:bottom-[18%]" },
  ];
  return (
    <Sec innerRef={r} theme="ink" font="condensed" className="py-[clamp(72px,9vw,128px)]">
      <div className="relative grid min-h-[clamp(520px,82svh,860px)] place-items-center">
        <H as="h1" className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[clamp(96px,27vw,440px)] leading-[0.8] text-[color-mix(in_srgb,var(--sx-text)_92%,transparent)]">
          Kite
        </H>
        <div className="absolute left-1/2 top-1/2 aspect-square w-[min(70vw,560px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_40%,transparent),transparent)]" />
        <Product angle={0} accent="#4f8dff" className="relative h-[min(68vh,600px)] w-auto max-md:h-[48svh]" />
        <div className="relative flex flex-wrap justify-center gap-2 max-md:mt-6 md:contents">
        {chips.map((c) => (
          <div key={c.k} data-m-card className={`rounded-full border border-[var(--sx-line)] bg-[color-mix(in_srgb,var(--sx-surface)_70%,transparent)] px-5 py-3 backdrop-blur-md max-md:px-4 max-md:py-2 md:absolute ${c.c}`}>
            <p className="text-[12px] uppercase tracking-[0.14em] text-[var(--sx-muted)]">{c.k}</p>
            <p className="text-[clamp(16px,1.5vw,22px)] font-[700] tabular-nums">{c.v}</p>
          </div>
        ))}
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-6 border-t border-[var(--sx-line)] pt-8">
        <P className="max-w-[40ch]">A clean charge for late shifts and early starts. Citrus, sea salt, no crash.</P>
        <div className="flex flex-wrap items-center gap-4">
          <Price now="₹120" className="text-[18px]" />
          <Btn>Add a 12-pack</Btn>
        </div>
      </div>
    </Sec>
  );
}

/** HR05 · Image fan: centred headline and CTA, five photos splayed like playing cards below. */
function HR05() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  const fan = [
    { i: 2, rot: -16, y: 18, l: "Rose" },
    { i: 1, rot: -8, y: 5, l: "Neroli" },
    { i: 3, rot: 0, y: 0, l: "Oud" },
    { i: 0, rot: 8, y: 5, l: "Vetiver" },
    { i: 2, rot: 16, y: 18, l: "Amber" },
  ];
  return (
    <Sec innerRef={r} theme="paper" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <div className="mx-auto max-w-[900px] text-center">
        <H as="h1" className="text-[clamp(52px,7.6vw,128px)]">Five scents, one evening.</H>
        <P className="mx-auto mt-6 max-w-[44ch]">Small-batch eaux de parfum, blended in Kannauj and aged for ninety days in glass.</P>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Btn>Try the discovery set · ₹1,450</Btn>
          <Btn kind="ghost">Find your scent</Btn>
        </div>
      </div>
      <div className="relative mx-auto mt-[clamp(48px,7vw,96px)] flex max-w-[1100px] justify-center">
        {fan.map((f, k) => (
          <div key={k} data-m-card className={`relative w-[clamp(110px,19vw,250px)] shrink-0 ${k ? "-ml-[clamp(44px,6vw,70px)]" : ""} ${k === 0 || k === 4 ? "max-md:hidden" : ""}`} style={{ zIndex: 5 - Math.abs(k - 2) }}>
            <div className="shadow-[0_30px_60px_-30px_rgba(28,24,19,.45)]" style={{ rotate: `${f.rot}deg`, translate: `0 ${f.y}%`, transformOrigin: "50% 120%" }}>
              <Pic i={f.i} ratio="3/4" label={f.l.toUpperCase()} />
            </div>
          </div>
        ))}
      </div>
    </Sec>
  );
}

/** HR06 · Bento hero: headline cell, product cell, stat cell and a flavour-swatch cell make the first screen. */
function HR06() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M18");
  const swatches = [
    ["Yuzu", "#e9d34a"],
    ["Hibiscus", "#c23a5b"],
    ["Mint", "#5fb48a"],
    ["Mango", "#f09a3a"],
  ];
  return (
    <Sec innerRef={r} theme="stone" font="wide" className="py-[clamp(48px,6vw,96px)]">
      <div className="grid grid-cols-1 gap-[clamp(10px,1.2vw,16px)] md:grid-cols-12 md:grid-rows-[auto_auto]">
        <div data-m-card className="sx-card flex flex-col justify-between p-[clamp(24px,3.4vw,52px)] md:col-span-7 md:row-span-1">
          <H as="h1" className="text-[clamp(36px,5.6vw,96px)]">Sparkling tea, nothing hidden.</H>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Btn>Shop the mixed case</Btn>
            <P className="text-[15px]">12 cans · ₹780</P>
          </div>
        </div>
        <div data-m-card className="relative grid min-h-[340px] place-items-center overflow-hidden rounded-[var(--sx-radius)] bg-[var(--sx-accent)] md:col-span-5 md:row-span-2">
          <div className="absolute aspect-square w-[90%] rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,.28),transparent)]" />
          <Product angle={1} accent="#e9d34a" className="relative h-[min(58vh,520px)] w-auto max-md:h-[40svh]" />
        </div>
        <div data-m-card className="sx-card p-[clamp(22px,2.6vw,36px)] md:col-span-3">
          <p className="sx-display text-[clamp(48px,5vw,84px)] font-[800] leading-none tracking-[-0.03em]">14</p>
          <p className="mt-3 text-[15px] text-[var(--sx-muted)]">calories a can, from real tea and fruit</p>
        </div>
        <div data-m-card className="sx-card p-[clamp(22px,2.6vw,36px)] md:col-span-4">
          <p className="text-[15px] font-[650]">Four flavours</p>
          <div className="mt-5 grid grid-cols-4 gap-3">
            {swatches.map(([n, c]) => (
              <div key={n} className="text-center">
                <span className="mx-auto block aspect-square w-full max-w-[56px] rounded-full border border-[var(--sx-line)]" style={{ background: c }} />
                <span className="mt-2 block text-[12px] text-[var(--sx-muted)]">{n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Sec>
  );
}

/** HR07 · Pack-size hero: product left, a single / 6 / 12 segmented selector with a live price; auto-cycles. */
function HR07() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M3");
  const packs = [
    { k: "Single", n: 1, price: "₹180", per: "₹180 a bar", save: "" },
    { k: "6-pack", n: 3, price: "₹990", per: "₹165 a bar", save: "Save 8%" },
    { k: "12-pack", n: 5, price: "₹1,800", per: "₹150 a bar", save: "Save 17%" },
  ];
  const [i, setI] = useAutoCycle(r, packs.length, 2400);
  const p = packs[i];
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <div className="grid grid-cols-1 items-center gap-[clamp(32px,5vw,80px)] md:grid-cols-2">
        <div className="relative grid aspect-square place-items-center overflow-hidden rounded-[var(--sx-radius)] bg-[var(--sx-surface)] md:order-none">
          <div className="absolute aspect-square w-[70%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_30%,transparent),transparent)]" />
          <div className="relative flex items-end justify-center">
            {Array.from({ length: p.n }, (_, k) => (
              <Product key={`${i}-${k}`} angle={k % 3} accent="#7a3b22" className={`h-[min(46vh,420px)] w-auto transition-all duration-500 max-md:h-[32svh] ${k ? "-ml-[16%]" : ""}`} />
            ))}
          </div>
        </div>
        <div>
          <H as="h1" className="text-[clamp(48px,6vw,104px)]">Dark chocolate, sea-salt sharp.</H>
          <P className="mt-6 max-w-[42ch]">72% Idukki cacao, stone-ground for three days, finished with flaked salt from Kutch.</P>
          <div className="mt-9 inline-grid grid-cols-3 rounded-full border border-[var(--sx-line)] p-1" role="tablist">
            {packs.map((x, k) => (
              <button key={x.k} role="tab" aria-selected={k === i} onClick={() => setI(k)} className={`rounded-full px-[clamp(14px,2vw,26px)] py-3 text-[14px] font-[650] transition-colors ${k === i ? "bg-[var(--sx-text)] text-[var(--sx-bg)]" : "text-[var(--sx-muted)]"}`}>
                {x.k}
              </button>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-end gap-x-6 gap-y-2">
            <p data-m-num key={p.price} className="sx-display text-[clamp(44px,4.6vw,72px)] font-[600] leading-none tabular-nums">{p.price}</p>
            <p className="pb-2 text-[15px] text-[var(--sx-muted)]">
              {p.per} {p.save && <span className="ml-2 font-[650] text-[var(--sx-accent)]">{p.save}</span>}
            </p>
          </div>
          <div className="mt-8">
            <Btn>Add to bag</Btn>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/** HR08 · Two-mood split: two full-height halves (morning / night) with the title sitting on the seam. */
function HR08() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  return (
    <Sec innerRef={r} theme="ink" font="editorial" full>
      <div className="relative grid grid-cols-1 md:min-h-[clamp(620px,100svh,960px)] md:grid-cols-2">
        {[
          { i: 1, t: "Morning", d: "Bright first-flush Darjeeling, for the hour before email.", price: "₹640" },
          { i: 3, t: "Night", d: "Chamomile, tulsi and rose. Caffeine free, slow to finish.", price: "₹560" },
        ].map((h, k) => (
          <div key={h.t} className="relative flex min-h-[72svh] flex-col justify-end overflow-hidden p-[clamp(24px,4vw,64px)] md:min-h-full">
            <Pic i={h.i} ratio="auto" round={false} className="absolute inset-0 h-full w-full" />
            <div className={`absolute inset-0 ${k ? "bg-[linear-gradient(180deg,rgba(7,9,15,.35),rgba(7,9,15,.85))]" : "bg-[linear-gradient(180deg,rgba(7,9,15,.05),rgba(7,9,15,.7))]"}`} />
            <div className={`relative max-w-[34ch] text-white ${k ? "md:ml-auto md:text-right" : ""}`}>
              <p data-m-text className="sx-display text-[clamp(32px,3vw,48px)] leading-none">{h.t}</p>
              <p data-m-text className="mt-3 text-[16px] leading-relaxed text-white/75">{h.d}</p>
              <p className="mt-5 text-[15px]">
                50 g tin · <Price now={h.price} />
              </p>
            </div>
          </div>
        ))}
        <div className="pointer-events-none absolute inset-x-0 top-[clamp(48px,9vw,120px)] px-6 text-center">
          <H as="h1" className="mx-auto max-w-[12ch] text-[clamp(48px,8vw,140px)] text-white drop-shadow-[0_10px_40px_rgba(0,0,0,.4)]">
            Two teas, one day.
          </H>
        </div>
        <span className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-white/25 max-md:hidden" />
      </div>
    </Sec>
  );
}

/** HR09 · Chapter opener: huge numeral, chapter title lit word by word, one stat and one image. Use when the page IS a sequence. */
function HR09() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M20");
  return (
    <Sec innerRef={r} theme="stone" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <div className="grid grid-cols-1 gap-[clamp(32px,5vw,80px)] md:grid-cols-12">
        <div className="md:col-span-7">
          <p className="sx-display text-[clamp(120px,22vw,340px)] font-[300] leading-[0.75] tracking-[-0.06em] text-[var(--sx-accent)]">01</p>
          <H as="h1" className="mt-[clamp(24px,3vw,48px)] max-w-[14ch] text-[clamp(44px,5.4vw,92px)]">It starts with the forest floor.</H>
          <div className="mt-10 flex flex-wrap items-end gap-x-10 gap-y-6 border-t border-[var(--sx-line)] pt-8">
            <div>
              <p className="sx-display text-[clamp(40px,4vw,64px)] font-[500] leading-none">1,400 m</p>
              <p className="mt-2 text-[14px] text-[var(--sx-muted)]">where our Arabica grows, under silver oak</p>
            </div>
            <P className="max-w-[34ch]">Chapter one of how a bag of Coorg coffee is made, from shade-grown cherry to your cup.</P>
          </div>
        </div>
        <div className="md:col-span-5 md:pt-[12%]">
          <Pic i={0} ratio="4/5" label="CHAPTER 01" />
        </div>
      </div>
    </Sec>
  );
}

/** HR10 · Product on a plinth, with a four-figure spec bar underneath (numbers count up). */
function HR10() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M3");
  const specs = [
    ["40", "hours of battery"],
    ["38", "dB noise cancelling"],
    ["250", "grams, all-day light"],
    ["12", "minutes for 5 h of play"],
  ];
  return (
    <Sec innerRef={r} theme="ink" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <div className="text-center">
        <H as="h1" className="mx-auto max-w-[16ch] text-[clamp(48px,6.4vw,112px)]">Quiet, finally.</H>
        <P className="mx-auto mt-5 max-w-[46ch]">Over-ear headphones in brushed aluminium and vegan leather. ₹24,900.</P>
      </div>
      <div className="relative mx-auto mt-[clamp(32px,5vw,64px)] flex max-w-[680px] flex-col items-center">
        <div className="absolute top-[8%] aspect-square w-[80%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_35%,transparent),transparent)]" />
        <Product angle={2} accent="#4f8dff" className="relative z-10 -mb-[6%] h-[min(52vh,460px)] w-auto max-md:h-[38svh]" />
        <div className="relative h-[clamp(60px,8vw,110px)] w-[min(78%,520px)]">
          <div className="absolute inset-x-0 bottom-0 top-[17%] rounded-b-[18px] bg-[linear-gradient(90deg,var(--sx-surface),color-mix(in_srgb,var(--sx-text)_10%,var(--sx-surface)),var(--sx-surface))]" />
          <div className="absolute inset-x-0 top-0 h-[34%] rounded-[50%] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--sx-text)_22%,var(--sx-surface)),var(--sx-surface))]" />
        </div>
      </div>
      <div className="mt-[clamp(40px,6vw,80px)] grid grid-cols-2 border-y border-[var(--sx-line)] md:grid-cols-4">
        {specs.map(([n, l], k) => (
          <div key={l} data-m-card className={`px-[clamp(12px,2vw,28px)] py-[clamp(20px,2.6vw,36px)] ${k ? "md:border-l md:border-[var(--sx-line)]" : ""} ${k % 2 ? "max-md:border-l max-md:border-[var(--sx-line)]" : ""} ${k > 1 ? "max-md:border-t max-md:border-[var(--sx-line)]" : ""}`}>
            <p data-m-num className="sx-display text-[clamp(40px,4.4vw,72px)] font-[700] leading-none tabular-nums">{n}</p>
            <p className="mt-2 text-[14px] text-[var(--sx-muted)]">{l}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Btn>Pre-order now</Btn>
        <Btn kind="ghost">Compare models</Btn>
      </div>
    </Sec>
  );
}

/** HR11 · Diced hero: one image cut into a grid of tiles, in offset columns that drift against each other with the scroll. */
function HR11() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M32");
  const cols = 5;
  const rows = 4;
  const src = scene(1, 1600, 1280, "");
  return (
    <Sec innerRef={r} theme="ink" font="wide" className="py-[clamp(72px,9vw,140px)]">
      <div className="grid grid-cols-1 items-end gap-[clamp(24px,4vw,64px)] md:grid-cols-12">
        <H as="h1" className="text-[clamp(38px,6.4vw,112px)] md:col-span-7">Sneakers, cut from one piece.</H>
        <div className="md:col-span-5 md:pb-3">
          <P>A single knitted upper, no seams, no glue. The Lattice runner, from ₹8,490.</P>
          <div className="mt-6 flex flex-wrap gap-4">
            <Btn>Shop the Lattice</Btn>
            <Btn kind="link">How it&apos;s knit →</Btn>
          </div>
        </div>
      </div>
      <div className="mt-[clamp(40px,6vw,80px)] grid gap-[clamp(6px,0.8vw,12px)]" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
        {Array.from({ length: cols }, (_, c) => (
          <div key={c} data-m-col className="flex flex-col gap-[clamp(6px,0.8vw,12px)]" style={{ marginTop: `${(c % 2) * 6}%` }}>
            {Array.from({ length: rows }, (_, rr) => (
              <div
                key={rr}
                className="aspect-square rounded-[clamp(6px,0.8vw,12px)] bg-[var(--sx-surface)]"
                style={{ backgroundImage: `url("${src}")`, backgroundSize: `${cols * 100}% ${rows * 100}%`, backgroundPosition: `${(c / (cols - 1)) * 100}% ${(rr / (rows - 1)) * 100}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </Sec>
  );
}

/** HR12 · Atmospheric: minimal centred copy over a living background of light rays that sway and breathe. */
function HR12() {
  return (
    <Sec theme="ink" font="editorial" className="relative" style={{ ["--accent" as string]: "var(--sx-accent)" }}>
      <LightRays className="fx-drift absolute inset-0" count={8} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(180deg,transparent,var(--sx-bg))]" />
      {/* soft dark pool behind the copy so it reads over the brightest rays (phones especially) */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_52%,rgba(7,9,15,.6),transparent)] max-md:bg-[radial-gradient(ellipse_80%_45%_at_50%_45%,rgba(7,9,15,.72),transparent)]" />
      <div className="relative flex min-h-[clamp(600px,100svh,980px)] flex-col items-center justify-center py-[clamp(72px,9vw,140px)] text-center">
        <H as="h1" className="max-w-[13ch] text-[clamp(56px,8vw,140px)]">Scent of the first rain.</H>
        <P className="mt-6 max-w-[40ch] text-white/80">Petrichor, vetiver and wet stone. An attar distilled once a year, the week the monsoon arrives.</P>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Btn>Reserve a bottle · ₹3,200</Btn>
          <Btn kind="ghost">The story</Btn>
        </div>
      </div>
    </Sec>
  );
}

export const HERO: SectionDef[] = [
  { code: "HR01", name: "Split product hero + logo strip", motion: "M6", C: HR01 },
  { code: "HR02", name: "Full-bleed photo, centred statement, info bar", motion: "M13", C: HR02 },
  { code: "HR03", name: "Editorial collage", motion: "M1", C: HR03 },
  { code: "HR04", name: "Giant wordmark behind product + spec chips", motion: "M12", C: HR04 },
  { code: "HR05", name: "Image fan under a centred headline", motion: "M34", C: HR05 },
  { code: "HR06", name: "Bento hero (headline, product, stat, swatches)", motion: "M18", C: HR06 },
  { code: "HR07", name: "Pack-size hero with live price", motion: "M3", C: HR07 },
  { code: "HR08", name: "Two-mood split with title on the seam", motion: "M23", C: HR08 },
  { code: "HR09", name: "Chapter opener", motion: "M20", C: HR09 },
  { code: "HR10", name: "Product on a plinth + spec bar", motion: "M3", C: HR10 },
  { code: "HR11", name: "Diced image hero (drifting tile columns)", motion: "M32", C: HR11 },
  { code: "HR12", name: "Atmospheric light-ray hero", motion: "M61", C: HR12 },
];
