"use client";

// PR · Pricing layouts (docs/SECTION-MENU.md). Each is a full designed section; motion via useSectionMotion.
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { scene } from "../fx/shared";
import { Btn, H, P, Pic, Price, Product, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Cycles 0..n-1 every `ms` while the element is on screen (hands-free); stays on 0 in ?static=1. */
function useAutoCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms: number) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let id = 0;
    const io = new IntersectionObserver(([e]) => {
      window.clearInterval(id);
      if (e.isIntersecting) id = window.setInterval(() => setI((v) => (v + 1) % n), ms);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearInterval(id);
    };
  }, [ref, n, ms]);
  return [i, setI] as const;
}

const Tick = () => (
  <svg viewBox="0 0 16 16" className="mt-[3px] h-4 w-4 shrink-0 text-[var(--sx-accent)]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 8.5l3.2 3L13 4.5" />
  </svg>
);

/** PR01 · Three subscription tiers; the middle one is raised and filled with the accent. Tiles snap in from the sides. */
const TIERS = [
  { n: "Drip", p: "₹899", per: "/ month", d: "For one cup a day.", f: ["250 g single origin", "Ground to your brewer", "Pause or skip any month"] },
  { n: "Roaster’s Pick", p: "₹1,499", per: "/ month", d: "Our favourite lot, every month.", f: ["2 × 250 g rotating origins", "Tasting notes card", "Free shipping", "10% off gear"], hot: true },
  { n: "Café at Home", p: "₹2,399", per: "/ month", d: "For households and studios.", f: ["1 kg house espresso", "Priority roast day", "Free grinder service"] },
];
function PR01() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  return (
    <Sec innerRef={r} theme="ink" font="wide" className="py-[clamp(72px,9vw,140px)]">
      <div className="mx-auto max-w-[760px] text-center">
        <H className="text-[clamp(42px,5vw,84px)]">Fresh beans, on repeat.</H>
        <P className="mx-auto mt-5 max-w-[46ch]">Roasted on Tuesday, at your door by Friday. Change plans or cancel in two taps.</P>
      </div>
      <div className="mx-auto mt-[clamp(48px,6vw,88px)] grid grid-cols-1 max-w-[1180px] gap-[clamp(14px,1.6vw,24px)] md:grid-cols-3 md:items-center">
        {TIERS.map((t) => (
          <article
            key={t.n}
            data-m-card
            className={`relative flex flex-col rounded-[22px] p-[clamp(24px,2.4vw,36px)] ${t.hot ? "bg-[var(--sx-accent)] text-[var(--sx-accent-text)] md:py-[clamp(44px,4vw,60px)] md:shadow-[0_40px_80px_-40px_var(--sx-accent)]" : "sx-card"}`}
          >
            {t.hot && <span className="absolute right-5 top-5 rounded-full bg-[var(--sx-accent-text)] px-3 py-1 text-[12px] font-[700] text-[var(--sx-accent)]">Most picked</span>}
            <h3 className="sx-display text-[clamp(22px,1.8vw,28px)] font-[700]">{t.n}</h3>
            <p className={`mt-1 text-[15px] ${t.hot ? "opacity-75" : "text-[var(--sx-muted)]"}`}>{t.d}</p>
            <p className="mt-7 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="sx-display text-[clamp(38px,3.2vw,52px)] font-[800] leading-none tabular-nums">{t.p}</span>
              <span className={`whitespace-nowrap text-[14px] ${t.hot ? "opacity-75" : "text-[var(--sx-muted)]"}`}>{t.per}</span>
            </p>
            <ul className="mt-7 space-y-3 text-[15px]">
              {t.f.map((x) => (
                <li key={x} className="flex gap-3">
                  {t.hot ? <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-current" /> : <Tick />}
                  {x}
                </li>
              ))}
            </ul>
            <div className="mt-9">
              {t.hot ? (
                <a href="#" onClick={(e) => e.preventDefault()} className="sx-btn w-full justify-center bg-[var(--sx-accent-text)] text-[var(--sx-accent)]">
                  Start with this box
                </a>
              ) : (
                <Btn kind="ghost" className="w-full justify-center">
                  Choose {t.n}
                </Btn>
              )}
            </div>
          </article>
        ))}
      </div>
    </Sec>
  );
}

/** PR02 · Subscribe vs one-time: the toggle flips by itself while on screen; price and savings update. */
function PR02() {
  const r = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useAutoCycle(r, 2, 3200);
  const sub = mode === 0;
  useSectionMotion(r, "M3");
  const priceRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!priceRef.current || prefersReducedMotion()) return;
    gsap.fromTo(priceRef.current, { yPercent: 30, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: "power3.out" });
  }, [mode]);
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <div className="grid grid-cols-1 gap-[clamp(32px,5vw,80px)] md:grid-cols-12 md:items-center">
        <div className="relative grid place-items-center md:col-span-6">
          <div className="absolute aspect-square w-[70%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_30%,transparent),transparent)]" />
          <div className="relative flex items-end">
            <Product angle={2} accent="#b5502a" className="relative z-[1] h-[min(52vh,460px)] w-auto max-md:h-[38svh]" />
            <Product angle={1} accent="#b5502a" className="-ml-[18%] h-[min(44vh,390px)] w-auto opacity-90 max-md:h-[32svh]" />
          </div>
        </div>
        <div className="md:col-span-6">
          <H className="text-[clamp(40px,4.6vw,76px)]">The 24-can case.</H>
          <P className="mt-5 max-w-[42ch]">Yuzu &amp; ginger sparkling energy. 120 mg green-tea caffeine, zero sugar. One case lasts a month of afternoons.</P>
          <div role="radiogroup" className="relative mt-9 inline-grid grid-cols-2 rounded-full border border-[var(--sx-line)] p-1 text-[14px] font-[650]">
            <span className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-[var(--sx-text)] transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)]" style={{ transform: sub ? "none" : "translateX(100%)" }} />
            {["Subscribe", "One-time"].map((l, k) => (
              <button key={l} type="button" role="radio" aria-checked={mode === k} onClick={() => setMode(k)} className={`relative z-[1] rounded-full px-6 py-2.5 transition-colors duration-500 ${mode === k ? "text-[var(--sx-bg)]" : "text-[var(--sx-muted)]"}`}>
                {l}
              </button>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-end gap-x-5 gap-y-2">
            <span key={mode} ref={priceRef} data-m-num className="sx-display text-[clamp(56px,5.6vw,92px)] leading-none tabular-nums">
              {sub ? "₹1,199" : "₹1,499"}
            </span>
            <span className={`mb-2 rounded-full px-3 py-1 text-[13px] font-[700] transition-all duration-500 ${sub ? "bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "bg-[var(--sx-line)] text-[var(--sx-muted)]"}`}>
              {sub ? "You save ₹300 (20%)" : "Save 20% with a subscription"}
            </span>
          </div>
          <p className="mt-3 text-[14px] text-[var(--sx-muted)]">{sub ? "₹50 a can · delivered every 4 weeks · skip anytime" : "₹62 a can · single delivery"}</p>
          <div className="mt-9 flex flex-wrap items-center gap-5">
            <Btn>{sub ? "Subscribe & save" : "Add to cart"}</Btn>
            <span className="text-[14px] text-[var(--sx-muted)]">
              <b data-m-num className="font-[700] text-[var(--sx-text)]">18,400</b> people subscribe
            </span>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/** PR03 · Two bundle cards, each with what's inside and a "you save" figure; cards unfold from a corner. */
const BUNDLES = [
  { n: "The Daily Pair", d: "Tempo Runner + 3 pairs merino socks + care kit", now: "₹9,499", was: "₹11,297", save: "₹1,798", pics: [0, 2, 1] },
  { n: "The Weekender", d: "Ghat Trail + Easy Slip + waterproof shoe bag", now: "₹14,999", was: "₹17,497", save: "₹2,498", pics: [2, 3, 0] },
];
function PR03() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M18");
  return (
    <Sec innerRef={r} theme="stone" font="condensed" className="py-[clamp(72px,9vw,140px)]">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="text-[clamp(52px,6.6vw,116px)]">Better in pairs.</H>
        <P className="max-w-[36ch] pb-2">Two bundles built around how you actually move. Free returns for 60 days.</P>
      </div>
      <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 gap-[clamp(14px,1.8vw,28px)] md:grid-cols-2">
        {BUNDLES.map((b, k) => (
          <article key={b.n} data-m-card className="sx-card flex flex-col p-[clamp(16px,1.8vw,26px)]">
            <div className="grid grid-cols-[1.6fr_1fr] gap-3">
              <Pic i={b.pics[0]} ratio="4/3" className="row-span-2" />
              <Pic i={b.pics[1]} ratio="auto" className="h-full min-h-[80px]" />
              <Pic i={b.pics[2]} ratio="auto" className="h-full min-h-[80px]" />
            </div>
            <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="sx-display text-[clamp(30px,2.8vw,44px)] font-[800] leading-none">{b.n}</h3>
                <p className="mt-2 max-w-[34ch] text-[15px] text-[var(--sx-muted)]">{b.d}</p>
              </div>
              <span className={`rounded-full px-3.5 py-1.5 text-[13px] font-[700] ${k === 0 ? "bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "border border-[var(--sx-accent)] text-[var(--sx-accent)]"}`}>You save {b.save}</span>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--sx-line)] pt-5">
              <Price now={b.now} was={b.was} className="text-[22px]" />
              <Btn kind={k === 0 ? "solid" : "ghost"}>Add bundle</Btn>
            </div>
          </article>
        ))}
      </div>
    </Sec>
  );
}

/** PR04 · Pricing bento: one flagship plan cell and smaller add-on cells; they tilt up from depth as you scroll. */
const ADDONS = [
  { n: "Travel atomiser", d: "10 ml, refillable brass", p: "₹690" },
  { n: "Engraving", d: "Up to 12 letters on the cap", p: "₹450" },
  { n: "Refill club", d: "50 ml every 3 months", p: "₹2,400" },
  { n: "Gift wrap", d: "Handmade paper + note", p: "₹250" },
];
function PR04() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M31");
  return (
    <Sec innerRef={r} theme="ink" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <H className="max-w-[14ch] text-[clamp(42px,5vw,84px)]">Build your scent wardrobe.</H>
      <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-2 gap-[clamp(10px,1.2vw,18px)] md:grid-cols-4 md:grid-rows-2">
        <article data-m-card className="sx-card relative col-span-2 flex min-h-[420px] flex-col justify-between overflow-hidden p-[clamp(22px,2.4vw,36px)] md:row-span-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={scene(3, 1200, 1200)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" draggable={false} />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_30%,var(--sx-surface))]" />
          <span className="relative self-start rounded-full bg-[var(--sx-accent)] px-3 py-1 text-[12px] font-[700] text-[var(--sx-accent-text)]">Flagship</span>
          <div className="relative">
            <h3 className="sx-display text-[clamp(30px,3vw,48px)] font-[700] leading-[1]">The Full Wardrobe</h3>
            <p className="mt-2 max-w-[38ch] text-[15px] text-[var(--sx-muted)]">All five eaux de parfum, 50 ml each, in an oak case. Rain Stone, Vetiver Noir, Jasmine Hour, Salt Fig, Smoke &amp; Rose.</p>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <Price now="₹18,900" was="₹22,500" className="text-[24px]" />
              <Btn>Reserve a case</Btn>
            </div>
          </div>
        </article>
        {ADDONS.map((a) => (
          <article key={a.n} data-m-card className="sx-card flex min-h-[170px] flex-col justify-between p-[clamp(16px,1.8vw,24px)]">
            <div>
              <h3 className="text-[16px] font-[700]">{a.n}</h3>
              <p className="mt-1 text-[13px] text-[var(--sx-muted)]">{a.d}</p>
            </div>
            <p className="mt-4 flex items-center justify-between">
              <Price now={a.p} className="text-[18px]" />
              <span className="grid h-8 w-8 place-items-center rounded-full border border-[var(--sx-line)] text-[18px] leading-none">+</span>
            </p>
          </article>
        ))}
      </div>
    </Sec>
  );
}

/** PR05 · Comparison table: 3 plans × 8 rows, header row sticks to the top while the rows scroll (inside the section). */
const PLANS = [
  { n: "Halo", p: "₹14,990" },
  { n: "Halo One", p: "₹24,990", hot: true },
  { n: "Halo Studio", p: "₹39,990" },
];
const ROWS: [string, (string | boolean)[]][] = [
  ["Battery life", ["30 h", "40 h", "60 h"]],
  ["Active noise cancelling", [false, true, true]],
  ["Spatial audio", [false, true, true]],
  ["Lossless (wired)", [true, true, true]],
  ["Ear pads", ["Foam", "Lambskin", "Lambskin, cooling"]],
  ["Multipoint pairing", ["2 devices", "3 devices", "4 devices"]],
  ["Weight", ["240 g", "262 g", "298 g"]],
  ["Warranty", ["1 year", "2 years", "3 years"]],
];
function PR05() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const cell = (v: string | boolean) => (v === true ? <span className="text-[var(--sx-accent)]">✓</span> : v === false ? <span className="text-[var(--sx-muted)]">—</span> : v);
  return (
    // overflow: clip (not hidden) so the sticky header row still sticks
    <Sec innerRef={r} theme="paper" font="grotesk" className="py-[clamp(72px,9vw,140px)]" style={{ overflow: "clip" }}>
      <div className="mx-auto max-w-[1100px]">
        <H className="max-w-[14ch] text-[clamp(40px,4.6vw,76px)]">Pick the pair that fits your day.</H>
        <P className="mt-5 max-w-[44ch]">Same tuning across all three. The difference is battery, comfort and how many devices you switch between.</P>
        <div data-m-card className="mt-[clamp(36px,5vw,64px)]">
          <div className="sticky top-0 z-10 grid grid-cols-[1.25fr_repeat(3,1fr)] border-b border-[var(--sx-line)] bg-[var(--sx-bg)] py-4 md:grid-cols-[1.6fr_repeat(3,1fr)]">
            <span />
            {PLANS.map((p) => (
              <div key={p.n} className="px-1.5 text-center md:px-3">
                <p className={`text-[13px] font-[700] md:text-[17px] ${p.hot ? "text-[var(--sx-accent)]" : ""}`}>{p.n}</p>
                <p className="text-[12px] tabular-nums text-[var(--sx-muted)] md:text-[14px]">{p.p}</p>
              </div>
            ))}
          </div>
          {ROWS.map(([label, vals]) => (
            <div key={label} className="grid grid-cols-[1.25fr_repeat(3,1fr)] items-center border-b border-[var(--sx-line)] py-[clamp(14px,1.6vw,22px)] text-[13px] md:grid-cols-[1.6fr_repeat(3,1fr)] md:text-[16px]">
              <span className="pr-2 font-[600]">{label}</span>
              {vals.map((v, k) => (
                <span key={k} className={`px-1.5 text-center md:px-3 ${k === 1 ? "font-[650]" : "text-[var(--sx-muted)]"}`}>
                  {cell(v)}
                </span>
              ))}
            </div>
          ))}
          <div className="grid grid-cols-[1.25fr_repeat(3,1fr)] pt-6 md:grid-cols-[1.6fr_repeat(3,1fr)]">
            <span />
            {PLANS.map((p) => (
              <div key={p.n} className="flex justify-center px-1">
                <Btn kind={p.hot ? "solid" : "link"} className="max-md:px-3! max-md:text-[13px]!">
                  Buy
                </Btn>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Sec>
  );
}

/** PR06 · Stockist ledger: cities as big headings, shop names + areas in rows; "coming soon" cities greyed out. */
const CITIES = [
  { c: "Mumbai", shops: [["Second Shelf Grocers", "Bandra West"], ["The Pantry Room", "Colaba"], ["Leaf & Ladle", "Powai"]] },
  { c: "Bengaluru", shops: [["Common Store", "Indiranagar"], ["Kettle House", "Jayanagar"]] },
  { c: "Delhi", shops: [["Monsoon Provisions", "Khan Market"], ["Little Larder", "Hauz Khas"]] },
  { c: "Pune", soon: "Opening March 2027", shops: [] },
  { c: "Kochi", soon: "Opening May 2027", shops: [] },
];
function PR06() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M6");
  return (
    <Sec innerRef={r} theme="stone" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[12ch] text-[clamp(44px,5.4vw,92px)]">Find our tea on a shelf near you.</H>
        <Btn kind="ghost">Become a stockist</Btn>
      </div>
      <div className="mt-[clamp(40px,6vw,88px)] border-t border-[var(--sx-text)]">
        {CITIES.map((city) => (
          <div key={city.c} className={`grid gap-4 border-b border-[var(--sx-line)] py-[clamp(20px,2.6vw,36px)] md:grid-cols-12 ${city.soon ? "opacity-40" : ""}`}>
            <h3 data-m-head className="sx-display text-[clamp(36px,4.4vw,72px)] leading-[0.95] md:col-span-5">{city.c}</h3>
            <div className="md:col-span-7">
              {city.soon ? (
                <p data-m-card className="text-[15px] uppercase tracking-[0.16em] text-[var(--sx-muted)] md:pt-4">Coming soon · {city.soon}</p>
              ) : (
                <ul>
                  {city.shops.map(([s, a]) => (
                    <li key={s} data-m-card className="flex items-baseline justify-between gap-4 border-b border-[var(--sx-line)] py-3 last:border-b-0">
                      <span className="text-[clamp(16px,1.3vw,19px)] font-[600]">{s}</span>
                      <span className="text-right text-[14px] text-[var(--sx-muted)]">{a} · <a href="#" onClick={(e) => e.preventDefault()} className="underline-offset-4 hover:underline">Map →</a></span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </Sec>
  );
}

export const PRICING: SectionDef[] = [
  { code: "PR01", name: "Three tiers, raised middle", motion: "M34", C: PR01 },
  { code: "PR02", name: "Subscribe vs one-time toggle (auto)", motion: "M3", C: PR02 },
  { code: "PR03", name: "Two bundle cards", motion: "M18", C: PR03 },
  { code: "PR04", name: "Pricing bento", motion: "M31", C: PR04 },
  { code: "PR05", name: "Comparison table, sticky header", motion: "M23", C: PR05 },
  { code: "PR06", name: "Stockist ledger", motion: "M6", C: PR06 },
];
