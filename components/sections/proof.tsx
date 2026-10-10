"use client";

// SP · Social-proof layouts (docs/SECTION-MENU.md). Each is a full designed section; motion via useSectionMotion or fx.
import { useRef } from "react";
import { useScrub, useTicker } from "../fx/shared";
import { Avatar, Btn, H, Logos, P, Pic, Sec, Stars } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Endless sideways drift for a row whose children are listed twice (M44): calm idle speed, faster while scrolling. */
function useDrift(root: React.RefObject<HTMLDivElement | null>, row: React.RefObject<HTMLDivElement | null>, dir = 1, speed = 40) {
  const vel = useRef(0);
  const x = useRef(0);
  useScrub(root, (_, v) => (vel.current = Math.abs(v)), { finalValue: 0 });
  useTicker(root, (_, dt) => {
    const el = row.current;
    if (!el) return;
    vel.current *= 0.94;
    const half = el.scrollWidth / 2;
    x.current = (((x.current - dir * dt * speed * (1 + vel.current * 6)) % half) - half) % half;
    el.style.transform = `translate3d(${x.current}px,0,0)`;
  });
}

type Review = { n: string; q: string; s?: number; tag?: string };

const Card = ({ r, k, className = "" }: { r: Review; k: number; className?: string }) => (
  <figure className={`sx-card flex flex-col gap-4 p-[clamp(18px,1.8vw,26px)] ${className}`}>
    <Stars n={r.s ?? 5} />
    <blockquote className="text-[15px] leading-relaxed md:text-[16px]">“{r.q}”</blockquote>
    <figcaption className="mt-auto flex items-center gap-3 text-[14px]">
      <Avatar name={r.n} i={k} size={34} />
      <span>
        <b className="block font-[650]">{r.n}</b>
        {r.tag && <span className="text-[13px] text-[var(--sx-muted)]">{r.tag}</span>}
      </span>
    </figcaption>
  </figure>
);

/** SP01 · Two rows of review cards drifting in opposite directions, faded at both edges. */
const DRINK_A: Review[] = [
  { n: "Kabir Shah", q: "Replaced my 4 pm coffee. No jitters, no crash at seven.", tag: "Product designer" },
  { n: "Ananya Rao", q: "The yuzu one tastes like an actual fruit, not a sweet shop.", tag: "Runner, Pune" },
  { n: "Rohan Pillai", q: "I keep a case under my desk. The team keeps stealing it.", tag: "Founder" },
  { n: "Meher Gill", q: "Zero sugar and still tastes good. That never happens.", tag: "Verified buyer" },
];
const DRINK_B: Review[] = [
  { n: "Dev Arora", q: "Clean focus for a full sprint. My new deadline drink.", tag: "Engineer" },
  { n: "Sara Thomas", q: "Light, fizzy, and the can looks great on a shelf.", tag: "Verified buyer" },
  { n: "Nikhil Bose", q: "Took it on a 90 km ride. Electrolytes actually work.", tag: "Cyclist" },
  { n: "Tara Iyer", q: "Subscribed after one can. Delivery every month, no fuss.", tag: "Subscriber" },
];
function SP01() {
  const r = useRef<HTMLDivElement>(null);
  const a = useRef<HTMLDivElement>(null);
  const b = useRef<HTMLDivElement>(null);
  useDrift(r, a, 1, 34);
  useDrift(r, b, -1, 34);
  const row = (ref: React.RefObject<HTMLDivElement | null>, list: Review[], off: number) => (
    <div ref={ref} className="flex w-max will-change-transform">
      {[...list, ...list].map((rv, k) => (
        <div key={k} className="w-[clamp(280px,26vw,380px)] shrink-0 pr-[clamp(12px,1.4vw,20px)]">
          <Card r={rv} k={k + off} className="h-full" />
        </div>
      ))}
    </div>
  );
  return (
    <Sec innerRef={r} theme="paper" font="grotesk" full className="py-[clamp(72px,9vw,140px)]">
      <div className="flex flex-wrap items-end justify-between gap-6 px-[clamp(20px,5vw,96px)]">
        <H className="max-w-[12ch] text-[clamp(44px,5.4vw,92px)]">40,000 desks can’t be wrong.</H>
        <div className="flex items-center gap-3 pb-2 text-[15px]">
          <Stars n={5} />
          <span className="text-[var(--sx-muted)]">4.8 from 6,120 reviews</span>
        </div>
      </div>
      <div className="mt-[clamp(40px,5vw,72px)] flex flex-col gap-[clamp(12px,1.4vw,20px)] [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
        {row(a, DRINK_A, 0)}
        {row(b, DRINK_B, 2)}
      </div>
    </Sec>
  );
}

/** SP02 · Three columns of reviews drifting at different speeds inside a frame faded top and bottom. */
const SKIN: Review[] = [
  { n: "Ira Menon", q: "My skin stopped feeling tight by day three. The serum is weightless.", tag: "Combination skin" },
  { n: "Zoya Khan", q: "Finally a sunscreen with no white cast on my skin tone.", tag: "SPF 50 gel" },
  { n: "Aditi Sen", q: "The barrier cream got me through a Delhi winter.", tag: "Dry skin" },
  { n: "Priya Nair", q: "Fragrance-free, gentle, and the pump bottle lasts ages.", tag: "Sensitive skin" },
  { n: "Mira Joshi", q: "I use three products now instead of nine. Glowing.", tag: "Routine kit" },
  { n: "Leela Das", q: "Dark spots visibly lighter in six weeks. Not exaggerating.", tag: "Niacinamide 10%" },
  { n: "Rhea Kapoor", q: "Packaging is beautiful but the formula is the real star.", tag: "Verified buyer", s: 4 },
  { n: "Naina Shah", q: "My dermatologist asked what I changed. This.", tag: "Acne-prone" },
  { n: "Kiara Bose", q: "Gifted the kit to my sister. Now she orders it monthly.", tag: "Gift set" },
];
function SP02() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M32");
  const cols = [SKIN.slice(0, 3), SKIN.slice(3, 6), SKIN.slice(6, 9)];
  return (
    <Sec innerRef={r} theme="stone" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <div className="grid grid-cols-1 gap-[clamp(32px,5vw,80px)] md:grid-cols-12 md:items-center">
        <div className="md:col-span-4">
          <H className="text-[clamp(42px,4.6vw,80px)]">Skin people talk about.</H>
          <P className="mt-6 max-w-[34ch]">Twelve thousand reviews, all from verified orders. Unedited, including the four-stars.</P>
          <div className="mt-8 flex items-center gap-3">
            <span className="sx-display text-[48px] leading-none">4.9</span>
            <span className="text-[14px] leading-snug text-[var(--sx-muted)]">
              <Stars n={5} />
              <br />
              12,408 reviews
            </span>
          </div>
          <div className="mt-8">
            <Btn kind="ghost">Read them all</Btn>
          </div>
        </div>
        <div className="relative h-[clamp(520px,72vh,720px)] overflow-hidden [mask-image:linear-gradient(180deg,transparent,#000_16%,#000_84%,transparent)] md:col-span-8 max-md:h-[560px]">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cols.map((c, k) => (
              <div key={k} data-m-col className={`flex flex-col gap-4 ${k === 1 ? "pt-16" : ""} ${k === 1 ? "max-sm:hidden" : ""} ${k === 2 ? "max-lg:hidden" : ""}`}>
                {[...c, ...cols[(k + 1) % 3]].map((rv, j) => (
                  <Card key={j} r={rv} k={j + k} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Sec>
  );
}

/** SP03 · One large quote beside a portrait. */
function SP03() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  return (
    <Sec innerRef={r} theme="stone" font="editorial" className="py-[clamp(72px,10vw,150px)]">
      <div className="grid grid-cols-1 gap-[clamp(32px,6vw,96px)] md:grid-cols-12 md:items-center">
        <Pic i={2} ratio="4/5" className="md:col-span-5 max-md:mx-auto max-md:w-[78%]" label="KABIR, MUMBAI" />
        <div className="md:col-span-7">
          <span className="sx-display block text-[clamp(80px,9vw,140px)] leading-[0.6] text-[var(--sx-accent)]" aria-hidden>
            “
          </span>
          <H className="mt-2 text-[clamp(34px,3.8vw,64px)] leading-[1.05]">The sofa outlived two apartments and one toddler. It still looks new, and I still nap on it every Sunday.</H>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-[var(--sx-line)] pt-6">
            <p className="text-[15px]">
              <b className="font-[650]">Kabir Shah</b> <span className="text-[var(--sx-muted)]">· owner of the Bay Sofa since 2019</span>
            </p>
            <Stars n={5} />
            <span className="ml-auto max-md:ml-0">
              <Btn kind="link">See the Bay Sofa →</Btn>
            </span>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/** SP04 · Press wall: three huge pull-quotes in a display serif, invented publication names in small caps, no cards. */
const PRESS = [
  { q: "A perfume that smells like rain on hot stone.", p: "The Morning Ledger", d: "Fragrance of the year, 2025" },
  { q: "Quietly the most beautiful bottle on the shelf.", p: "Atelier Weekly", d: "The gift edit" },
  { q: "It lasts until dinner, and people ask.", p: "Salt & Signal", d: "Tested for 30 days" },
];
function SP04() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M6");
  return (
    <Sec innerRef={r} theme="ink" font="serif" className="py-[clamp(72px,10vw,150px)]">
      <div className="border-t border-[var(--sx-line)]">
        {PRESS.map((x, k) => (
          <figure key={x.p} className={`grid gap-5 border-b border-[var(--sx-line)] py-[clamp(36px,5vw,72px)] md:grid-cols-12 md:items-end ${k === 1 ? "md:text-right" : ""}`}>
            <blockquote className={`md:col-span-9 ${k === 1 ? "md:order-2 md:col-start-4" : ""}`}>
              <H as="h3" className="text-[clamp(36px,5.2vw,92px)] leading-[1]">“{x.q}”</H>
            </blockquote>
            <figcaption data-m-card className={`md:col-span-3 ${k === 1 ? "md:order-1 md:text-left" : "md:text-right"}`}>
              <p className="text-[14px] font-[650] uppercase tracking-[0.2em] [font-variant:small-caps]">{x.p}</p>
              <p className="mt-1 text-[13px] text-[var(--sx-muted)]">{x.d}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </Sec>
  );
}

/** SP05 · Rating summary: big average, star-bar breakdown, three review cards. Numbers count up. */
const BARS = [
  { s: 5, pct: 86, n: "1,878" },
  { s: 4, pct: 10, n: "218" },
  { s: 3, pct: 2, n: "44" },
  { s: 2, pct: 1, n: "26" },
  { s: 1, pct: 1, n: "18" },
];
const AUDIO: Review[] = [
  { n: "Arjun Mehta", q: "Noise cancelling rivals pairs twice the price. Wore them on a 14-hour flight.", tag: "Halo One · Graphite" },
  { n: "Sana Qureshi", q: "The pads are so soft I forget they are on. Calls sound crisp.", tag: "Halo One · Sand" },
  { n: "Vikram Rao", q: "Battery lasted my whole work week. The case is lovely too.", tag: "Halo One · Graphite", s: 4 },
];
function SP05() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M3");
  return (
    <Sec innerRef={r} theme="paper" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <div className="grid grid-cols-1 gap-[clamp(32px,5vw,80px)] md:grid-cols-12">
        <div className="md:col-span-4">
          <H className="text-[clamp(36px,3.6vw,60px)]">Rated by people who listen.</H>
          <div className="mt-8 flex items-end gap-4">
            <span data-m-num className="sx-display text-[clamp(88px,9vw,140px)] font-[800] leading-[0.8] tabular-nums">4.9</span>
            <span className="pb-1 text-[14px] text-[var(--sx-muted)]">
              <Stars n={5} />
              <br />
              <span data-m-num>2,184</span> reviews
            </span>
          </div>
          <ul className="mt-8 space-y-2.5">
            {BARS.map((b) => (
              <li key={b.s} className="grid grid-cols-[28px_1fr_48px] items-center gap-3 text-[13px] tabular-nums">
                <span>{b.s}★</span>
                <span className="h-2 overflow-hidden rounded-full bg-[var(--sx-line)]">
                  <span className="block h-full rounded-full bg-[var(--sx-accent)]" style={{ width: `${b.pct}%` }} />
                </span>
                <span data-m-num className="text-right text-[var(--sx-muted)]">
                  {b.n}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-1 gap-[clamp(12px,1.4vw,20px)] md:col-span-8 md:grid-cols-3 md:items-start">
          {AUDIO.map((rv, k) => (
            <div key={rv.n} data-m-card className={k === 1 ? "md:mt-12" : ""}>
              <Card r={rv} k={k} />
            </div>
          ))}
          <div className="md:col-span-3">
            <Btn kind="ghost">Write a review</Btn>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/** SP06 · Trust strip: logo cloud, three stats and invented certification badges, unfolding from a corner. */
const BADGES = [
  { t: "Fair Farm", s: "Certified 2026" },
  { t: "Carbon Light", s: "Roastery" },
  { t: "Small Batch", s: "Guild member" },
];
function SP06() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M18");
  return (
    <Sec innerRef={r} theme="stone" font="wide" className="py-[clamp(64px,8vw,120px)]">
      <div className="grid grid-cols-1 gap-[clamp(28px,4vw,56px)] md:grid-cols-12 md:items-end">
        <H className="text-[clamp(34px,3.6vw,60px)] md:col-span-6">Poured in 380 cafés.</H>
        <P className="md:col-span-5 md:col-start-8">The beans we roast for home are the ones we roast for these kitchens. Same lot, same Tuesday.</P>
      </div>
      <div className="mt-[clamp(32px,4vw,56px)] border-y border-[var(--sx-line)] py-8">
        <Logos className="justify-between" />
      </div>
      <div className="mt-[clamp(24px,3vw,40px)] grid grid-cols-1 gap-[clamp(12px,1.4vw,20px)] md:grid-cols-6">
        {[
          ["380", "partner cafés"],
          ["42", "farms paid 30% above market"],
          ["96 h", "roast to your door"],
        ].map(([n, l]) => (
          <div key={l} data-m-card className="sx-card p-6 md:col-span-2 max-md:flex max-md:items-baseline max-md:gap-4">
            <p className="sx-display text-[clamp(36px,3.4vw,52px)] font-[800] leading-none tabular-nums">{n}</p>
            <p className="mt-2 text-[14px] text-[var(--sx-muted)]">{l}</p>
          </div>
        ))}
        {BADGES.map((b) => (
          <div key={b.t} data-m-card className="flex items-center gap-4 rounded-[var(--sx-radius)] border border-dashed md:col-span-2 border-[var(--sx-line)] p-5">
            <svg viewBox="0 0 48 48" className="h-12 w-12 shrink-0 text-[var(--sx-accent)]" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <circle cx="24" cy="24" r="21" />
              <circle cx="24" cy="24" r="16" strokeDasharray="2 3" />
              <path d="M16 24.5l5 5 11-11" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="leading-tight">
              <b className="block text-[15px] font-[700]">{b.t}</b>
              <span className="text-[13px] text-[var(--sx-muted)]">{b.s}</span>
            </p>
          </div>
        ))}
      </div>
    </Sec>
  );
}

export const PROOF: SectionDef[] = [
  { code: "SP01", name: "Two-row review marquee", motion: "M44", C: SP01 },
  { code: "SP02", name: "Three-column review wall", motion: "M32", C: SP02 },
  { code: "SP03", name: "Large quote + portrait", motion: "M23", C: SP03 },
  { code: "SP04", name: "Press wall", motion: "M6", C: SP04 },
  { code: "SP05", name: "Rating summary", motion: "M3", C: SP05 },
  { code: "SP06", name: "Trust strip", motion: "M18", C: SP06 },
];
