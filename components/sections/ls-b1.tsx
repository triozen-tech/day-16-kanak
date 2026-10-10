"use client";

// LS · Listing layouts (docs/SECTION-MENU.md). Each is a full designed section; motion via useSectionMotion.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** A tick that counts up every `ms` while the section is on screen (stops off screen and in ?static=1). */
function useTick(ref: React.RefObject<HTMLElement | null>, ms: number) {
  const [t, setT] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let id: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(id);
      if (e.isIntersecting) id = setInterval(() => setT((v) => v + 1), ms);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(id);
    };
  }, [ref, ms]);
  return [t, setT] as const;
}

const ICONS: Record<string, React.ReactNode> = {
  area: <path d="M3 3h6M3 3v6M17 17h-6M17 17v-6M3 3l14 14" />,
  land: <path d="M2 16c3-5 5-7 8-7s5 2 8 7M6 8a2 2 0 1 0 0-.01" />,
  bed: <path d="M2 15V6M2 11h16v4M18 15v-4a3 3 0 0 0-3-3H9v3" />,
  bath: <path d="M2 10h16v2a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5zM5 10V5a2 2 0 0 1 4 0" />,
};
const Ico = ({ k }: { k: string }) => (
  <svg viewBox="0 0 20 20" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {ICONS[k]}
  </svg>
);

const HOMES = [
  { t: "Casa Laterite", town: "Assagao, North Goa", m: ["420 m²", "1,800 m²", "4", "5"], p: "₹8.4 Cr" },
  { t: "The Coffee House", town: "Sakleshpur, Karnataka", m: ["610 m²", "2.1 ha", "5", "6"], p: "₹12.6 Cr" },
  { t: "Mist Cottage", town: "Coonoor, Nilgiris", m: ["240 m²", "900 m²", "3", "3"], p: "Price on request" },
  { t: "Villa Tamarind", town: "Alibaug, Maharashtra", m: ["510 m²", "3,200 m²", "5", "5"], p: "₹14.2 Cr" },
  { t: "Stone Barn", town: "Kasauli, Himachal", m: ["300 m²", "1,100 m²", "3", "4"], p: "₹5.9 Cr" },
  { t: "Backwater House", town: "Kumarakom, Kerala", m: ["380 m²", "1,500 m²", "4", "4"], p: "Price on request" },
];

const LS01_CSS = `.ls01-track{transition:transform .9s cubic-bezier(.65,0,.35,1)}`;

/** LS01 · Property cards: 3-column grid; each card has its own 4-photo carousel with dots, an icon metrics row, title, town, price. */
function LS01() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  const [t] = useTick(r, 650);
  return (
    <Sec innerRef={r} theme="paper" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <style>{LS01_CSS}</style>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[14ch] text-[clamp(44px,5.4vw,92px)]">Homes with land around them.</H>
        <div className="max-w-[36ch]">
          <P>Hand-picked houses on a hectare or more. Every one walked, measured and photographed by us.</P>
        </div>
      </div>
      <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 gap-x-[clamp(16px,2vw,28px)] gap-y-[clamp(32px,4vw,56px)] md:grid-cols-3">
        {HOMES.map((h, k) => {
          const slide = Math.floor((t + k * 2) / 4) % 4;
          return (
            <article key={h.t} data-m-card className="min-w-0">
              <div className="relative overflow-hidden rounded-[var(--sx-radius)]">
                <div className="ls01-track flex" style={{ transform: `translateX(-${slide * 100}%)` }}>
                  {[0, 1, 2, 3].map((s) => (
                    <div key={s} className="w-full shrink-0">
                      <Pic i={(k + s) % 4} ratio="4/3" round={false} />
                    </div>
                  ))}
                </div>
                <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
                  {[0, 1, 2, 3].map((s) => (
                    <span key={s} className={`h-1.5 rounded-full transition-all duration-500 ${s === slide ? "w-5 bg-white" : "w-1.5 bg-white/55"}`} />
                  ))}
                </div>
                <span className="absolute left-3 top-3 rounded-full bg-[var(--sx-surface)] px-3 py-1 text-[12px] font-[650]">{k % 3 === 0 ? "New" : k % 3 === 1 ? "Exclusive" : "Off-market"}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[14px] text-[var(--sx-muted)]">
                {["area", "land", "bed", "bath"].map((ic, j) => (
                  <span key={ic} className="inline-flex items-center gap-1.5">
                    <Ico k={ic} />
                    {h.m[j]}
                  </span>
                ))}
              </div>
              <h3 className="sx-display mt-3 text-[clamp(24px,2vw,32px)] leading-tight">{h.t}</h3>
              <div className="mt-1 flex items-baseline justify-between gap-4 border-b border-[var(--sx-line)] pb-4">
                <p className="text-[15px] text-[var(--sx-muted)]">{h.town}</p>
                <p className="shrink-0 text-[16px] font-[650] tabular-nums">{h.p}</p>
              </div>
            </article>
          );
        })}
      </div>
      <nav className="mt-[clamp(40px,5vw,72px)] flex items-center justify-center gap-2 text-[15px]" aria-label="Pages">
        <span className="px-3 text-[var(--sx-muted)]">←</span>
        {["1", "2", "3", "4", "…", "9"].map((n) => (
          <span key={n} className={`grid h-10 w-10 place-items-center rounded-full ${n === "1" ? "bg-[var(--sx-text)] text-[var(--sx-bg)]" : "text-[var(--sx-muted)]"}`}>
            {n}
          </span>
        ))}
        <span className="px-3">→</span>
      </nav>
    </Sec>
  );
}

const VILLAS = [
  { t: "Villa Kesar", a: "Siolim", b: 4, g: 8, p: "₹38,000", x: 34, y: 28 },
  { t: "Casa Mar", a: "Morjim", b: 3, g: 6, p: "₹26,500", x: 22, y: 18 },
  { t: "The Palm Court", a: "Anjuna", b: 5, g: 10, p: "₹52,000", x: 30, y: 46 },
  { t: "Saligao Hill", a: "Saligao", b: 4, g: 8, p: "₹31,000", x: 52, y: 52 },
  { t: "Blue Shutters", a: "Candolim", b: 2, g: 4, p: "₹18,900", x: 40, y: 70 },
  { t: "Rio Verde", a: "Nerul", b: 6, g: 12, p: "₹64,000", x: 60, y: 76 },
];

/** LS02 · Finder: count + sort + Map/List toggle on top; filters in 3 cols; 3-col villa grid in 9 cols, flipping to split map view. */
function LS02() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  // one 0.7 s tick drives both: the highlighted villa steps every tick, the List/Map view flips every 4 ticks
  const [t, setT] = useTick(r, 700);
  const map = Math.floor(t / 4) % 2 === 1;
  const pin = t % VILLAS.length;
  return (
    <Sec innerRef={r} theme="stone" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[16ch] text-[clamp(40px,4.8vw,80px)]">Find your villa in North Goa.</H>
        <P className="max-w-[38ch]">Private pools, a cook on call and the beach a short ride away. Prices per night.</P>
      </div>
      <div className="mt-[clamp(32px,4vw,56px)] flex flex-wrap items-center justify-between gap-4 border-y border-[var(--sx-line)] py-4">
        <p className="text-[15px]">
          <b className="font-[650]">48 villas</b> <span className="text-[var(--sx-muted)]">· 12–15 Dec · 6 guests</span>
        </p>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-[var(--sx-line)] px-4 py-2 text-[14px]">Sort: Recommended ▾</span>
          <div className="inline-grid grid-cols-2 rounded-full border border-[var(--sx-line)] p-1" role="tablist">
            {["List", "Map"].map((v, k) => (
              <button key={v} role="tab" aria-selected={map === !!k} onClick={() => setT(k * 4)} className={`rounded-full px-5 py-2 text-[14px] font-[650] transition-colors duration-500 ${map === !!k ? "bg-[var(--sx-text)] text-[var(--sx-bg)]" : "text-[var(--sx-muted)]"}`}>
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-[clamp(24px,3vw,40px)] grid grid-cols-1 gap-[clamp(24px,3vw,48px)] md:grid-cols-12">
        <aside className="min-w-0 space-y-7 md:col-span-3">
          <div>
            <p className="text-[13px] font-[650] uppercase tracking-[0.12em] text-[var(--sx-muted)]">Dates</p>
            <p className="mt-2 rounded-[12px] border border-[var(--sx-line)] bg-[var(--sx-surface)] px-4 py-3 text-[15px]">Fri 12 – Mon 15 Dec</p>
          </div>
          <div>
            <p className="flex justify-between text-[13px] font-[650] uppercase tracking-[0.12em] text-[var(--sx-muted)]">
              <span>Price</span>
              <span className="normal-case tracking-normal">₹15k – ₹70k</span>
            </p>
            <div className="relative mt-4 h-1 rounded-full bg-[var(--sx-line)]">
              <span className="absolute inset-y-0 left-[12%] right-[22%] rounded-full bg-[var(--sx-accent)]" />
              <span className="absolute left-[12%] top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--sx-accent)] bg-[var(--sx-surface)]" />
              <span className="absolute right-[22%] top-1/2 h-4 w-4 -translate-y-1/2 translate-x-1/2 rounded-full border-2 border-[var(--sx-accent)] bg-[var(--sx-surface)]" />
            </div>
          </div>
          {[
            ["Guests", "6"],
            ["Bedrooms", "3+"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between">
              <p className="text-[13px] font-[650] uppercase tracking-[0.12em] text-[var(--sx-muted)]">{k}</p>
              <p className="flex items-center gap-3 text-[15px] tabular-nums">
                <span className="grid h-7 w-7 place-items-center rounded-full border border-[var(--sx-line)]">−</span>
                {v}
                <span className="grid h-7 w-7 place-items-center rounded-full border border-[var(--sx-line)]">+</span>
              </p>
            </div>
          ))}
          <div>
            <p className="text-[13px] font-[650] uppercase tracking-[0.12em] text-[var(--sx-muted)]">Area</p>
            <div className="mt-3 space-y-2 text-[15px]">
              {["Anjuna & Vagator", "Siolim & Morjim", "Candolim"].map((a, k) => (
                <p key={a} className="flex items-center gap-3">
                  <span className={`grid h-4 w-4 place-items-center rounded-[4px] border ${k < 2 ? "border-[var(--sx-accent)] bg-[var(--sx-accent)] text-[10px] text-[var(--sx-accent-text)]" : "border-[var(--sx-line)]"}`}>{k < 2 ? "✓" : ""}</span>
                  {a}
                </p>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[13px] font-[650] uppercase tracking-[0.12em] text-[var(--sx-muted)]">Amenities</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Pool", "Chef", "Sea view", "Pet friendly", "Gym"].map((a, k) => (
                <span key={a} className={`rounded-full border px-3 py-1.5 text-[13px] ${k < 2 ? "border-[var(--sx-text)] bg-[var(--sx-text)] text-[var(--sx-bg)]" : "border-[var(--sx-line)] text-[var(--sx-muted)]"}`}>{a}</span>
              ))}
            </div>
          </div>
          <Btn kind="link">Clear all</Btn>
        </aside>

        <div className="min-w-0 md:col-span-9">
          {!map ? (
            <div key="list" className="ls02-in grid grid-cols-1 gap-[clamp(14px,1.6vw,22px)] md:grid-cols-3">
              {VILLAS.map((v, k) => (
                <article key={v.t} data-m-card className={`sx-card overflow-hidden transition-[border-color,translate] duration-500 ${k === pin ? "-translate-y-1.5 border-[var(--sx-accent)]!" : ""}`}>
                  <Pic i={k % 4} ratio="4/3" round={false} />
                  <div className="p-4">
                    <h3 className="text-[17px] font-[650]">{v.t}</h3>
                    <p className="mt-1 text-[14px] text-[var(--sx-muted)]">
                      {v.a} · {v.b} bedrooms · {v.g} guests
                    </p>
                    <p className="mt-3 text-[15px]">
                      <b className="font-[650] tabular-nums">{v.p}</b> <span className="text-[var(--sx-muted)]">/ night</span>
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div key="map" className="ls02-in grid grid-cols-1 gap-[clamp(14px,1.6vw,22px)] md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              <div className="space-y-3">
                {VILLAS.map((v, k) => (
                  <div key={v.t} className={`flex items-center gap-4 rounded-[14px] border p-2 pr-4 transition-colors duration-500 ${k === pin ? "border-[var(--sx-accent)] bg-[var(--sx-surface)]" : "border-[var(--sx-line)]"}`}>
                    <div className="w-[92px] shrink-0">
                      <Pic i={k % 4} ratio="4/3" round />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-[650]">{v.t}</p>
                      <p className="text-[13px] text-[var(--sx-muted)]">
                        {v.a} · {v.b} bd
                      </p>
                    </div>
                    <p className="text-[14px] font-[650] tabular-nums">{v.p}</p>
                  </div>
                ))}
              </div>
              <div className="relative min-h-[520px] overflow-hidden rounded-[var(--sx-radius)] border border-[var(--sx-line)] bg-[var(--sx-surface)]">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
                  <path d="M0 0H8C10 14 6 22 9 34S5 52 10 64 6 84 12 100H0Z" fill="color-mix(in srgb, var(--sx-accent) 16%, transparent)" />
                  <path d="M8 0C10 14 6 22 9 34S5 52 10 64 6 84 12 100" fill="none" stroke="var(--sx-accent)" strokeOpacity=".35" strokeWidth=".4" />
                  {[18, 36, 54, 72, 90].map((y) => (
                    <path key={y} d={`M10 ${y}Q50 ${y - 6} 100 ${y + 3}`} fill="none" stroke="var(--sx-line)" strokeWidth=".35" />
                  ))}
                  {[30, 50, 70, 88].map((x) => (
                    <path key={x} d={`M${x} 0Q${x - 5} 50 ${x + 4} 100`} fill="none" stroke="var(--sx-line)" strokeWidth=".35" />
                  ))}
                  <path d="M14 10Q40 30 46 50T70 96" fill="none" stroke="var(--sx-muted)" strokeOpacity=".5" strokeWidth=".8" />
                </svg>
                <span className="absolute left-[3%] top-[40%] -rotate-90 text-[12px] uppercase tracking-[0.3em] text-[var(--sx-accent)]">Arabian Sea</span>
                {VILLAS.map((v, k) => (
                  <span
                    key={v.t}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-3 py-1.5 text-[13px] font-[650] tabular-nums shadow-[0_8px_20px_-8px_rgba(0,0,0,.35)] transition-all duration-500 ${k === pin ? "z-10 scale-110 bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "bg-[var(--sx-bg)] text-[var(--sx-text)]"}`}
                    style={{ left: `${v.x + 20}%`, top: `${v.y}%` }}
                  >
                    {v.p.replace(",000", "k").replace(",500", ".5k").replace(",900", ".9k")}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="mt-[clamp(28px,3vw,44px)] flex justify-center">
            <Btn kind="ghost">Load more villas</Btn>
          </div>
        </div>
      </div>
      <style>{`.ls02-in{animation:ls02-in .7s cubic-bezier(.2,.8,.2,1)}@keyframes ls02-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}.is-static .ls02-in{animation:none}`}</style>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "LS01", name: "Property cards with photo carousel + metrics", motion: "M34", C: LS01 },
  { code: "LS02", name: "Finder: filters + results + map toggle", motion: "M23", C: LS02 },
];
