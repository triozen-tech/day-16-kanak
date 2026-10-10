"use client";

// BK · Booking layouts (docs/SECTION-MENU.md). Each is a full designed section; motion via useSectionMotion.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
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

const Field = ({ k, v, sub }: { k: string; v: string; sub?: string }) => (
  <div className="min-w-0 px-[clamp(16px,2vw,32px)] py-[clamp(16px,1.8vw,26px)]">
    <p className="text-[12px] font-[650] uppercase tracking-[0.14em] text-[var(--sx-muted)]">{k}</p>
    <p className="mt-1 truncate text-[clamp(16px,1.3vw,20px)] font-[600] text-[var(--sx-text)]">{v}</p>
    {sub && <p className="text-[13px] text-[var(--sx-muted)]">{sub}</p>}
  </div>
);

function Counter({ k, n, sub }: { k: string; n: number; sub: string }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-4 px-[clamp(16px,2vw,32px)] py-[clamp(16px,1.8vw,26px)]">
      <div>
        <p className="text-[12px] font-[650] uppercase tracking-[0.14em] text-[var(--sx-muted)]">{k}</p>
        <p className="text-[13px] text-[var(--sx-muted)]">{sub}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 place-items-center rounded-full border border-[var(--sx-line)] text-[16px]">−</span>
        <span key={n} className="bk01-tick w-5 text-center text-[clamp(18px,1.4vw,22px)] font-[650] tabular-nums">{n}</span>
        <span className="grid h-8 w-8 place-items-center rounded-full border border-[var(--sx-line)] text-[16px]">+</span>
      </div>
    </div>
  );
}

const BK01_CSS = `.bk01-tick{display:inline-block;animation:bk01-tick .5s cubic-bezier(.2,.8,.2,1)}@keyframes bk01-tick{from{transform:translateY(-60%);opacity:0}to{transform:none;opacity:1}}.bk01-cta{animation:bk01-pull 3.2s ease-in-out infinite}@keyframes bk01-pull{0%,100%{translate:0 0}50%{translate:4px -2px}}.is-static .bk01-tick,.is-static .bk01-cta{animation:none}html.is-static {.bk01-tick,.bk01-cta{animation:none}}`;

/** BK01 · Hero-docked availability bar: full-bleed hotel hero; one white bar across its bottom edge with dates, guests and Check rates. */
function BK01() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M18");
  // guest counters tick once on screen (then hold), so the bar reads as live on camera
  const [step] = useAutoCycle(r, 4, 1400);
  const adults = [2, 3, 3, 2][step];
  const kids = [0, 0, 1, 1][step];
  return (
    <Sec innerRef={r} theme="stone" font="serif" full>
      <style>{BK01_CSS}</style>
      <div className="relative min-h-[clamp(640px,100svh,980px)] overflow-hidden">
        <div className="fx-drift absolute inset-0">
          <Pic i={1} ratio="auto" round={false} className="absolute inset-0 h-full w-full" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,12,14,.15),rgba(10,12,14,.1)_45%,rgba(10,12,14,.65))]" />
        <div className="relative flex min-h-[clamp(640px,100svh,980px)] flex-col justify-end px-[clamp(20px,5vw,96px)] pb-[clamp(150px,14vw,190px)] pt-[clamp(96px,10vw,160px)] max-md:pb-10">
          <H as="h1" className="max-w-[12ch] text-[clamp(56px,8vw,140px)] text-white">A quiet house by the sea.</H>
          <p data-m-text className="mt-5 max-w-[44ch] text-[clamp(16px,1.2vw,19px)] leading-relaxed text-white/80">
            Twenty-two rooms under coconut palms in South Goa. Breakfast on the verandah, the tide at the gate.
          </p>
        </div>
        <div className="relative px-[clamp(20px,5vw,96px)] md:absolute md:inset-x-0 md:bottom-[clamp(24px,3vw,48px)]">
          <div data-m-card className="grid grid-cols-1 items-stretch divide-y divide-[var(--sx-line)] rounded-[var(--sx-radius)] bg-[var(--sx-surface)] shadow-[0_30px_80px_-30px_rgba(0,0,0,.5)] md:grid-cols-[1fr_1fr_1.25fr_1.25fr_auto] md:divide-x md:divide-y-0">
            <Field k="Arrival" v="Fri, 12 Dec" sub="from 2 pm" />
            <Field k="Departure" v="Mon, 15 Dec" sub="3 nights" />
            <Counter k="Adults" n={adults} sub="13 years +" />
            <Counter k="Children" n={kids} sub="up to 12" />
            <div className="flex items-center p-[clamp(12px,1.2vw,18px)]">
              <Btn className="bk01-cta w-full justify-center whitespace-nowrap">Check rates</Btn>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

const SPECS = [
  ["Length", "28 m"],
  ["Cabins", "4 double"],
  ["Guests", "8 overnight"],
  ["Crew", "5"],
  ["Cruising", "11 knots"],
  ["Built", "2021, Kochi"],
];
const AMENITIES = ["Chef on board", "Paddle boards", "Snorkel kit", "Jet tender", "Sunset deck bar", "Starlink Wi-Fi", "Air-conditioned cabins", "Kayaks"];

/** BK02 · Charter detail: left 8 cols scroll (gallery, specs, description, amenities); right 4 cols sticky booking card. */
function BK02() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M3");
  const shots = [
    { i: 3, l: "FLYBRIDGE" },
    { i: 0, l: "MASTER CABIN" },
    { i: 2, l: "AFT DECK" },
    { i: 1, l: "SALON" },
  ];
  const [g, setG] = useAutoCycle(r, shots.length, 2000);
  return (
    <Sec innerRef={r} theme="ink" font="wide" className="overflow-clip! py-[clamp(72px,9vw,140px)]">
      <div className="grid grid-cols-1 gap-[clamp(32px,4vw,64px)] md:grid-cols-12">
        <div className="min-w-0 md:col-span-8">
          <H className="text-[clamp(44px,5.4vw,92px)]">Saira, a slow yacht for the Andamans.</H>
          <P className="mt-5 max-w-[52ch]">A teak-decked motor yacht for week-long charters from Port Blair to Havelock and the reefs beyond.</P>

          <div className="relative mt-[clamp(32px,4vw,56px)] aspect-[16/10] overflow-hidden rounded-[var(--sx-radius)]">
            {shots.map((s, k) => (
              <div key={k} className={`absolute inset-0 transition-opacity duration-1000 ${k === g ? "opacity-100" : "opacity-0"}`}>
                <div className={k === g ? "fx-drift absolute inset-0" : "absolute inset-0"}>
                  <Pic i={s.i} ratio="auto" round={false} className="absolute inset-0 h-full w-full" label={s.l} />
                </div>
              </div>
            ))}
            <span className="absolute bottom-4 right-4 rounded-full bg-black/45 px-3 py-1 text-[13px] tabular-nums text-white backdrop-blur">
              {g + 1} / {shots.length}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-3">
            {shots.map((s, k) => (
              <button key={k} onClick={() => setG(k)} className={`overflow-hidden rounded-[12px] border-2 transition-colors ${k === g ? "border-[var(--sx-accent)]" : "border-transparent opacity-60"}`} aria-label={`Show ${s.l.toLowerCase()}`}>
                <Pic i={s.i} ratio="16/10" round={false} />
              </button>
            ))}
          </div>

          <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-2 border-t border-[var(--sx-line)] md:grid-cols-3">
            {SPECS.map(([k, v]) => (
              <div key={k} className="border-b border-[var(--sx-line)] py-5 pr-4">
                <p className="text-[13px] text-[var(--sx-muted)]">{k}</p>
                <p className="mt-1 text-[clamp(18px,1.5vw,24px)] font-[650]">{v}</p>
              </div>
            ))}
          </div>

          <div className="mt-[clamp(40px,5vw,64px)] grid grid-cols-1 gap-[clamp(24px,3vw,48px)] md:grid-cols-2">
            <P>Mornings anchored off empty beaches, afternoons diving the drop-offs, evenings grilling the day&apos;s catch on the aft deck while the islands go dark.</P>
            <P>Every charter is full board, with a menu planned around your table. Fuel, permits and two dive guides are included.</P>
          </div>

          <p className="mt-[clamp(40px,5vw,64px)] text-[15px] font-[650]">On board</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {AMENITIES.map((a) => (
              <span key={a} className="rounded-full border border-[var(--sx-line)] px-4 py-2 text-[14px] text-[var(--sx-muted)]">{a}</span>
            ))}
          </div>
        </div>

        <aside className="min-w-0 md:col-span-4">
          <div data-m-card className="sx-card p-[clamp(22px,2.4vw,36px)] md:sticky md:top-8">
            <p className="text-[14px] text-[var(--sx-muted)]">From</p>
            <p className="mt-1 flex items-baseline gap-2">
              <span data-m-num className="sx-display text-[clamp(40px,3.8vw,60px)] font-[700] leading-none tabular-nums">₹4,80,000</span>
            </p>
            <p className="mt-1 text-[14px] text-[var(--sx-muted)]">per week, up to 8 guests</p>
            <div className="mt-7 grid grid-cols-2 overflow-hidden rounded-[14px] border border-[var(--sx-line)]">
              <div className="border-r border-[var(--sx-line)] p-4">
                <p className="text-[12px] font-[650] uppercase tracking-[0.12em] text-[var(--sx-muted)]">Board</p>
                <p className="mt-1 text-[15px] font-[600]">Sat, 10 Jan</p>
              </div>
              <div className="p-4">
                <p className="text-[12px] font-[650] uppercase tracking-[0.12em] text-[var(--sx-muted)]">Return</p>
                <p className="mt-1 text-[15px] font-[600]">Sat, 17 Jan</p>
              </div>
              <div className="col-span-2 flex items-center justify-between border-t border-[var(--sx-line)] p-4">
                <div>
                  <p className="text-[12px] font-[650] uppercase tracking-[0.12em] text-[var(--sx-muted)]">Guests</p>
                  <p className="mt-1 text-[15px] font-[600]">6 adults</p>
                </div>
                <span className="text-[var(--sx-muted)]">▾</span>
              </div>
            </div>
            <Btn className="mt-6 w-full justify-center">Request this week</Btn>
            <div className="mt-6 space-y-2 border-t border-[var(--sx-line)] pt-5 text-[14px]">
              <p className="flex justify-between text-[var(--sx-muted)]">
                <span>7 nights, full board</span>
                <span className="tabular-nums">₹4,80,000</span>
              </p>
              <p className="flex justify-between text-[var(--sx-muted)]">
                <span>Fuel &amp; permits</span>
                <span>Included</span>
              </p>
            </div>
            <p className="mt-5 text-[13px] text-[var(--sx-muted)]">No charge until the captain confirms.</p>
          </div>
        </aside>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "BK01", name: "Hero-docked availability bar", motion: "M18", C: BK01 },
  { code: "BK02", name: "Detail page with sticky booking card", motion: "M3", C: BK02 },
];
