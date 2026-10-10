"use client";

// FT · Feature layouts (docs/SECTION-MENU.md). Each is a full designed section; motion via useSectionMotion or fx.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { BendMarquee } from "../fx/text";
import { Btn, H, P, Pic, Product, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Line icons drawn in SVG (stroke = currentColor), so they take the section's accent. */
const ICONS: Record<string, React.ReactNode> = {
  leaf: <path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14m0 0 7-7" />,
  drop: <path d="M12 3c3.5 4.6 6 8 6 11a6 6 0 0 1-12 0c0-3 2.5-6.4 6-11z" />,
  bolt: <path d="M13 3 5 13.5h6L10 21l8-10.5h-6z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" />
    </>
  ),
  box: <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5zM4 7.5 12 12l8-4.5M12 12v9" />,
  shield: <path d="M12 3 5 6v5c0 4.6 3 8.4 7 10 4-1.6 7-5.4 7-10V6zm-3 9 2.2 2.2L15.5 10" />,
  wave: <path d="M3 9c3-3 6 3 9 0s6 3 9 0M3 15c3-3 6 3 9 0s6 3 9 0" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  cross: <path d="m6.5 6.5 11 11m0-11-11 11" />,
};
const Icon = ({ name, className = "" }: { name: keyof typeof ICONS; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className={`h-[1em] w-[1em] ${className}`} aria-hidden>
    {ICONS[name]}
  </svg>
);

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

/** FT01 · Hairline feature row: four features split by vertical rules, a drawn icon each, no card boxes. */
function FT01() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M18");
  const f = [
    { ic: "leaf", t: "Grown in shade", d: "Arabica under silver oak and pepper vines, picked by hand at 1,200 m." },
    { ic: "sun", t: "Sun-dried slowly", d: "Twenty days on raised beds, turned every hour, never machine-dried." },
    { ic: "clock", t: "Roasted on Tuesday", d: "Small drums, one origin at a time, posted to you within 48 hours." },
    { ic: "box", t: "Packed to keep", d: "One-way valve bags, nitrogen flushed. Fresh for eight weeks sealed." },
  ] as const;
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[14ch] text-[clamp(40px,4.8vw,80px)]">Why it tastes like this.</H>
        <P className="max-w-[36ch]">Four decisions we make for every bag of Coorg estate coffee, before it reaches your grinder.</P>
      </div>
      <div className="mt-[clamp(40px,6vw,88px)] grid grid-cols-1 border-t border-[var(--sx-line)] sm:grid-cols-2 lg:grid-cols-4">
        {f.map((x, k) => (
          <div key={x.t} data-m-card className={`py-[clamp(28px,3vw,44px)] lg:px-[clamp(20px,2.2vw,36px)] ${k ? "lg:border-l lg:border-[var(--sx-line)]" : "lg:pl-0"} ${k % 2 ? "sm:border-l sm:border-[var(--sx-line)] sm:pl-6 lg:pl-[clamp(20px,2.2vw,36px)]" : ""} max-sm:border-b max-sm:border-[var(--sx-line)]`}>
            <Icon name={x.ic} className="text-[36px] text-[var(--sx-accent)]" />
            <h3 className="sx-display mt-8 text-[clamp(22px,1.9vw,30px)] leading-tight">{x.t}</h3>
            <p className="mt-3 max-w-[30ch] text-[15px] leading-relaxed text-[var(--sx-muted)]">{x.d}</p>
          </div>
        ))}
      </div>
    </Sec>
  );
}

/** FT02 · Sticky title left; feature cards scroll past on the right. */
function FT02() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const cards = [
    { ic: "drop", t: "Niacinamide 5%", d: "Evens tone and tightens pores in four weeks, without the sting.", i: 0 },
    { ic: "shield", t: "Barrier first", d: "Ceramides and squalane rebuild the skin's outer layer overnight.", i: 1 },
    { ic: "leaf", t: "Fragrance free", d: "No essential oils, no added scent. Calm enough for reactive skin.", i: 2 },
    { ic: "sun", t: "Day and night", d: "Layers under sunscreen and over retinol. One step, both routines.", i: 3 },
  ] as const;
  return (
    <Sec innerRef={r} theme="stone" font="grotesk" className="overflow-clip! py-[clamp(72px,9vw,140px)]">
      <div className="grid grid-cols-1 gap-[clamp(32px,5vw,96px)] md:grid-cols-12">
        <div className="md:col-span-5">
          <div className="md:sticky md:top-[clamp(80px,14vh,140px)]">
            <H className="text-[clamp(40px,4.8vw,84px)]">A serum that does less, better.</H>
            <P className="mt-6 max-w-[38ch]">Four ingredients at clinical strength. Nothing added to make the label longer.</P>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Btn>Shop the serum · ₹1,190</Btn>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-[clamp(16px,2vw,28px)] md:col-span-7">
          {cards.map((c) => (
            <article key={c.t} data-m-card className="sx-card grid grid-cols-1 items-center gap-6 overflow-hidden p-[clamp(18px,2vw,28px)] sm:grid-cols-[1fr_0.8fr]">
              <div className="p-[clamp(4px,1vw,12px)]">
                <Icon name={c.ic} className="text-[30px] text-[var(--sx-accent)]" />
                <h3 className="sx-display mt-6 text-[clamp(24px,2.2vw,34px)] font-[700] leading-tight tracking-[-0.02em]">{c.t}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-[var(--sx-muted)]">{c.d}</p>
              </div>
              <Pic i={c.i} ratio="4/3" />
            </article>
          ))}
        </div>
      </div>
    </Sec>
  );
}

/** FT03 · Tabbed features: a list of four on the left, one large media panel on the right that swaps (auto-cycles). */
function FT03() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M6");
  const tabs = [
    { t: "Adaptive noise cancelling", d: "Eight microphones read the room 50,000 times a second and cancel what you don't want.", i: 3 },
    { t: "Spatial sound", d: "Head-tracked audio that keeps the stage in front of you when you turn.", i: 1 },
    { t: "Forty-hour battery", d: "A week of commutes on one charge; twelve minutes gives five more hours.", i: 0 },
    { t: "Memory-foam cushions", d: "Protein-leather over slow foam, tuned to seal without pressing.", i: 2 },
  ];
  const [i, setI] = useAutoCycle(r, tabs.length, 3000);
  return (
    <Sec innerRef={r} theme="ink" font="wide" className="py-[clamp(72px,9vw,140px)]">
      <H className="max-w-[16ch] text-[clamp(40px,4.8vw,84px)]">Built for the long listen.</H>
      <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 items-stretch gap-[clamp(28px,4vw,64px)] md:grid-cols-12">
        <ul className="md:col-span-5" role="tablist">
          {tabs.map((x, k) => (
            <li key={x.t} className="border-t border-[var(--sx-line)] last:border-b">
              <button role="tab" aria-selected={k === i} onClick={() => setI(k)} className="group relative w-full py-[clamp(18px,2vw,28px)] text-left">
                <span className={`absolute left-0 top-[-1px] h-px bg-[var(--sx-accent)] transition-[width] ease-linear ${k === i ? "w-full duration-[3000ms]" : "w-0 duration-0"}`} />
                <span className={`block text-[clamp(20px,1.8vw,28px)] font-[650] transition-colors ${k === i ? "text-[var(--sx-text)]" : "text-[var(--sx-muted)]"}`}>{x.t}</span>
                <span className={`grid transition-[grid-template-rows,opacity] duration-500 ${k === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                  <span className="overflow-hidden">
                    <span data-m-text className="block max-w-[40ch] pt-3 text-[15px] leading-relaxed text-[var(--sx-muted)]">{x.d}</span>
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="relative md:col-span-7">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--sx-radius)]">
            {tabs.map((x, k) => (
              <div key={x.t} className={`absolute inset-0 transition-[opacity,transform] duration-700 ${k === i ? "scale-100 opacity-100" : "scale-[1.04] opacity-0"}`}>
                <Pic i={x.i} ratio="auto" round={false} className="h-full w-full" label={x.t.toUpperCase()} />
              </div>
            ))}
          </div>
          <p className="mt-4 text-[14px] text-[var(--sx-muted)]">Arc Over-Ear · ₹24,900 · in graphite, chalk and moss</p>
        </div>
      </div>
    </Sec>
  );
}

/** One FT04 callout: title + line, with a thin connector and dot pointing at the product (desktop). */
const Callout = ({ t, d, side }: { t: string; d: string; side: "l" | "r" }) => (
  <div data-m-card className={`flex items-center gap-4 ${side === "l" ? "md:flex-row md:text-right" : "md:flex-row-reverse"}`}>
    <div className="min-w-0 flex-1">
      <p className="text-[clamp(17px,1.4vw,20px)] font-[700]">{t}</p>
      <p className="mt-1 text-[14px] leading-snug text-[var(--sx-muted)]">{d}</p>
    </div>
    <span className="relative hidden h-px w-[clamp(40px,6vw,110px)] bg-[var(--sx-line)] md:block">
      <span className={`absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[var(--sx-accent)] ${side === "l" ? "right-0 translate-x-1/2" : "left-0 -translate-x-1/2"}`} />
    </span>
  </div>
);

/** FT04 · Product in the centre with six callouts around it, joined to it by thin lines. */
function FT04() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M12");
  const left = [
    ["Natural caffeine", "150 mg from green tea and guayusa"],
    ["Zero sugar", "Sweetened with monk fruit"],
    ["B-vitamins", "B3, B6 and B12 for steady focus"],
  ];
  const right = [
    ["Sea-salt electrolytes", "Sodium and potassium for long sessions"],
    ["Real fruit", "Pressed yuzu and blood orange"],
    ["Fully recyclable", "Aluminium can, infinitely reusable"],
  ];
  return (
    <Sec innerRef={r} theme="ink" font="condensed" className="py-[clamp(72px,9vw,140px)]">
      <H className="text-center text-[clamp(52px,7vw,124px)]">What&apos;s in the can</H>
      <div className="mt-[clamp(32px,5vw,72px)] grid grid-cols-1 items-center gap-[clamp(24px,3vw,40px)] md:grid-cols-[1fr_auto_1fr]">
        <div className="relative grid place-items-center md:order-2">
          <div className="absolute aspect-square w-[130%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_35%,transparent),transparent)]" />
          <Product angle={0} accent="#4f8dff" className="relative h-[min(62vh,540px)] w-auto max-md:h-[40svh]" />
        </div>
        <div className="grid gap-[clamp(20px,4vw,64px)] max-md:grid-cols-2 md:order-1">
          {left.map(([t, d]) => (
            <Callout key={t} t={t} d={d} side="l" />
          ))}
        </div>
        <div className="grid gap-[clamp(20px,4vw,64px)] max-md:grid-cols-2 md:order-3">
          {right.map(([t, d]) => (
            <Callout key={t} t={t} d={d} side="r" />
          ))}
        </div>
      </div>
    </Sec>
  );
}

/** FT05 · Alternating rows: exactly two image/text rows, the second mirrored. */
function FT05() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M1");
  const rows = [
    { t: "Washed until it's soft.", d: "Every shirt is stone-washed twice in Jaipur, so it drapes like it's been yours for years.", meta: "Relaxed shirt · ₹3,450", i: 3 },
    { t: "Dyed with what grows.", d: "Indigo, madder root and pomegranate rind. Six earth tones that fade gently, never flat.", meta: "Wide trouser · ₹3,890", i: 1 },
  ];
  return (
    <Sec innerRef={r} theme="paper" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <div className="flex flex-col gap-[clamp(64px,9vw,140px)]">
        {rows.map((x, k) => (
          <div key={x.t} className="grid grid-cols-1 items-center gap-[clamp(28px,5vw,96px)] md:grid-cols-12">
            <div className={`md:col-span-7 ${k ? "md:order-2" : ""}`}>
              <Pic i={x.i} ratio="5/4" />
            </div>
            <div className={`md:col-span-5 ${k ? "md:order-1" : ""}`}>
              <H className="max-w-[12ch] text-[clamp(40px,4.6vw,80px)]">{x.t}</H>
              <P className="mt-6 max-w-[38ch]">{x.d}</P>
              <div className="mt-8 flex flex-wrap items-center gap-6">
                <Btn kind="link">Shop the piece →</Btn>
                <span className="text-[14px] text-[var(--sx-muted)]">{x.meta}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Sec>
  );
}

/** FT06 · How it works: three numbered steps in a row, joined by one connecting line. */
function FT06() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const steps = [
    ["Pick your plan", "Choose a tea and how often: every two, four or six weeks."],
    ["We blend to order", "Leaves are weighed and sealed the morning your box ships."],
    ["Steep and adjust", "Rate each tin; the next box shifts toward what you liked."],
  ];
  return (
    <Sec innerRef={r} theme="stone" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <div className="mx-auto max-w-[760px] text-center">
        <H className="text-[clamp(40px,4.8vw,84px)]">Fresh tea in three steps.</H>
        <P className="mx-auto mt-6 max-w-[44ch]">A loose-leaf subscription from ₹490 a month. Skip, swap or stop whenever you like.</P>
      </div>
      <div className="relative mt-[clamp(48px,7vw,104px)]">
        <span className="absolute left-[16.66%] right-[16.66%] top-[28px] hidden h-px bg-[var(--sx-line)] md:block" />
        <span className="absolute bottom-6 left-[28px] top-[28px] w-px bg-[var(--sx-line)] md:hidden" />
        <ol className="relative grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-[clamp(20px,3vw,48px)]">
          {steps.map(([t, d], k) => (
            <li key={t} data-m-card className="flex gap-6 md:flex-col md:items-center md:text-center">
              <span className="sx-display grid h-14 w-14 shrink-0 place-items-center rounded-full border border-[var(--sx-line)] bg-[var(--sx-bg)] text-[22px] text-[var(--sx-accent)]">{k + 1}</span>
              <div>
                <h3 data-m-text className="sx-display text-[clamp(24px,2.2vw,34px)] leading-tight md:mt-6">{t}</h3>
                <p data-m-text className="mx-auto mt-3 max-w-[30ch] text-[15px] leading-relaxed text-[var(--sx-muted)]">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <div className="mt-[clamp(40px,6vw,80px)] flex justify-center">
        <Btn>Start your plan</Btn>
      </div>
    </Sec>
  );
}

/** FT07 · Before / after: paired cards, the old way against our way. */
function FT07() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M18");
  const old = ["Particleboard that sags in a year", "Ships in 14 boxes, 3 hours to build", "Glued joints you can't repair", "Ends up in landfill"];
  const ours = ["Solid sheesham, oiled by hand", "Arrives assembled, in one crate", "Wooden joinery you can re-tighten", "Bought back at 30% after ten years"];
  return (
    <Sec innerRef={r} theme="paper" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[14ch] text-[clamp(40px,4.8vw,84px)]">Furniture, the long way.</H>
        <P className="max-w-[36ch]">The Rowan dining table, ₹64,000. Here is what that pays for.</P>
      </div>
      <div className="mt-[clamp(40px,6vw,80px)] grid grid-cols-1 gap-[clamp(14px,1.6vw,24px)] md:grid-cols-2">
        <div data-m-card className="rounded-[var(--sx-radius)] border border-dashed border-[var(--sx-line)] p-[clamp(24px,3vw,48px)]">
          <p className="text-[14px] font-[650] uppercase tracking-[0.14em] text-[var(--sx-muted)]">The usual way</p>
          <ul className="mt-8 space-y-5">
            {old.map((x) => (
              <li key={x} className="flex items-start gap-4 text-[clamp(16px,1.3vw,19px)] text-[var(--sx-muted)]">
                <Icon name="cross" className="mt-1 shrink-0 text-[20px]" />
                <span className="line-through decoration-[var(--sx-line)]">{x}</span>
              </li>
            ))}
          </ul>
        </div>
        <div data-m-card className="sx-card relative overflow-hidden p-[clamp(24px,3vw,48px)]">
          <p className="text-[14px] font-[650] uppercase tracking-[0.14em] text-[var(--sx-accent)]">Our way</p>
          <ul className="mt-8 space-y-5">
            {ours.map((x) => (
              <li key={x} className="flex items-start gap-4 text-[clamp(16px,1.3vw,19px)] font-[600]">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--sx-accent)] text-[16px] text-[var(--sx-accent-text)]">
                  <Icon name="check" />
                </span>
                {x}
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <Btn>See the Rowan table</Btn>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/** FT08 · Big stat set inside the copy, with a checklist of features beside it. */
function FT08() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M3");
  const list = ["70% single-estate cacao, bean to bar", "No palm oil, no emulsifiers", "Sweetened with unrefined jaggery", "Wrapped in compostable paper", "Ships cool, even in May"];
  return (
    <Sec innerRef={r} theme="ink" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <div className="grid grid-cols-1 items-center gap-[clamp(40px,6vw,104px)] md:grid-cols-12">
        <div className="md:col-span-7">
          <p data-m-text className="sx-display text-[clamp(32px,3.6vw,60px)] leading-[1.12] tracking-[-0.02em]">
            Each bar takes{" "}
            <span data-m-num className="inline-block text-[1.9em] leading-[0.9] text-[var(--sx-accent)] tabular-nums">
              96
            </span>{" "}
            hours from cracked bean to wrapped bar, and we wouldn&apos;t cut a single one.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <Btn>Shop the bars · ₹240</Btn>
            <Btn kind="link">Visit the kitchen →</Btn>
          </div>
        </div>
        <ul className="border-t border-[var(--sx-line)] md:col-span-5">
          {list.map((x) => (
            <li key={x} data-m-card className="flex items-center gap-4 border-b border-[var(--sx-line)] py-5 text-[clamp(16px,1.3vw,19px)]">
              <Icon name="check" className="shrink-0 text-[22px] text-[var(--sx-accent)]" />
              {x}
            </li>
          ))}
        </ul>
      </div>
    </Sec>
  );
}

/** FT09 · Colour-band feature grid: a 2×3 icon grid on a full accent band (the theme colours flip). */
function FT09() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  const flip = {
    ["--sx-bg" as string]: "var(--sx-accent)",
    ["--sx-text" as string]: "var(--sx-accent-text)",
    ["--sx-muted" as string]: "color-mix(in srgb, var(--sx-accent-text) 72%, transparent)",
    ["--sx-line" as string]: "color-mix(in srgb, var(--sx-accent-text) 22%, transparent)",
  };
  const f = [
    { ic: "wave", t: "Breathes in heat", d: "Open-weave linen moves air at 40°C." },
    { ic: "drop", t: "Dries in an hour", d: "Rinse at night, wear it by morning." },
    { ic: "leaf", t: "Grown without irrigation", d: "European flax, fed by rain alone." },
    { ic: "shield", t: "Gets stronger washed", d: "Fibres tighten for the first ten washes." },
    { ic: "sun", t: "Natural dyes", d: "Plant colours that fade evenly with sun." },
    { ic: "box", t: "Free repairs", d: "Send it back any year; we mend it." },
  ] as const;
  return (
    <Sec innerRef={r} theme="stone" font="wide" className="py-[clamp(72px,9vw,140px)]" style={flip}>
      <div className="grid grid-cols-1 gap-[clamp(40px,6vw,96px)] lg:grid-cols-12">
        <div className="lg:col-span-4">
          <H className="text-[clamp(40px,4.6vw,80px)]">Linen that works in May.</H>
          <P className="mt-6 max-w-[34ch]">Six reasons our summer shirts outlast the summer. From ₹2,950.</P>
          <div className="mt-8">
            <a href="#" onClick={(e) => e.preventDefault()} className="sx-btn bg-[var(--sx-text)] text-[var(--sx-bg)]">
              Shop summer linen
            </a>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--sx-radius)] border border-[var(--sx-line)] bg-[var(--sx-line)] lg:col-span-8">
          {f.map((x) => (
            <div key={x.t} data-m-card className="bg-[var(--sx-bg)] p-[clamp(18px,2.6vw,40px)]">
              <Icon name={x.ic} className="text-[clamp(28px,2.4vw,36px)]" />
              <h3 className="mt-[clamp(20px,3vw,40px)] text-[clamp(16px,1.5vw,22px)] font-[700] leading-tight">{x.t}</h3>
              <p className="mt-2 text-[14px] leading-snug text-[var(--sx-muted)]">{x.d}</p>
            </div>
          ))}
        </div>
      </div>
    </Sec>
  );
}

/** FT10 · Two marquees of feature tags drifting in opposite directions (bending with scroll speed) around a centred statement. */
function FT10() {
  const top = ["Vegan suede", "Recycled sole", "Hand-stitched", "Cork insole", "Made in Agra", "Lifetime resole"];
  const bottom = ["Breathable knit", "1,200 km tested", "Carbon neutral", "Wide fits", "Free returns", "Repair kit"];
  return (
    <Sec theme="ink" font="condensed" full className="py-[clamp(72px,9vw,140px)]">
      <style>{`.ft10-rev{transform:scaleX(-1)}.ft10-rev .inline-block{scale:-1 1}`}</style>
      <BendMarquee words={top} className="text-[clamp(28px,4vw,64px)] uppercase text-[var(--sx-muted)]" />
      <div className="mx-auto max-w-[900px] px-6 py-[clamp(40px,6vw,88px)] text-center">
        <H className="text-[clamp(48px,6.4vw,112px)]">One shoe, made to last a decade.</H>
        <P className="mx-auto mt-6 max-w-[42ch]">The Field Runner, ₹7,990. Resoled for free for as long as you own it.</P>
        <div className="mt-8 flex justify-center">
          <Btn>Shop the Field Runner</Btn>
        </div>
      </div>
      <div className="ft10-rev">
        <BendMarquee words={bottom} className="text-[clamp(28px,4vw,64px)] uppercase text-[var(--sx-accent)]" />
      </div>
    </Sec>
  );
}

export const FEATURES: SectionDef[] = [
  { code: "FT01", name: "Hairline feature row", motion: "M18", C: FT01 },
  { code: "FT02", name: "Sticky title, cards scroll past", motion: "M23", C: FT02 },
  { code: "FT03", name: "Tabbed features + swapping media", motion: "M6", C: FT03 },
  { code: "FT04", name: "Product with callout lines", motion: "M12", C: FT04 },
  { code: "FT05", name: "Alternating image/text rows", motion: "M1", C: FT05 },
  { code: "FT06", name: "How it works (3 joined steps)", motion: "M23", C: FT06 },
  { code: "FT07", name: "Before / after cards", motion: "M18", C: FT07 },
  { code: "FT08", name: "Big stat in copy + checklist", motion: "M3", C: FT08 },
  { code: "FT09", name: "Colour-band icon grid", motion: "M34", C: FT09 },
  { code: "FT10", name: "Opposite marquees around a statement", motion: "M44", C: FT10 },
];
