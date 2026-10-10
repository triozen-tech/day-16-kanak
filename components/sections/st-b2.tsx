"use client";

// ST · Story / stats layouts, batch 2 (docs/SECTION-MENU.md): ST07 proportion bar, ST08 provenance ledger.
// Each keeps moving while on screen (hands-free for filming) and shows its final state in ?static=1.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Price, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Steps an index every `ms` while the section is on screen (stops off screen and in ?static=1). */
function useAutoCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms: number) {
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

/* ───────────────────────────── ST07 · Proportion bar ───────────────────────────── */

const BLEND = [
  { n: "Coorg Arabica", p: 38, d: "body, cocoa" },
  { n: "Chikmagalur peaberry", p: 24, d: "bright, citrus" },
  { n: "Araku Valley", p: 18, d: "florals, honey" },
  { n: "Wayanad Robusta", p: 12, d: "crema, spice" },
  { n: "Monsooned Malabar", p: 8, d: "earth, low acid" },
];
// two loops with different periods: hatching that slides inside every segment + a sheen across the whole bar
const ST07_CSS = `.st07-hatch{background-image:repeating-linear-gradient(115deg,rgba(255,255,255,.24) 0 3px,transparent 3px 16px);background-size:60px 100%;animation:st07-hatch 1.3s linear infinite}@keyframes st07-hatch{to{background-position:60px 0}}.st07-sheen{background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.28) 50%,transparent 70%) 0 0/40% 100% no-repeat;animation:st07-sheen 4.2s ease-in-out infinite}@keyframes st07-sheen{from{background-position:-60% 0}to{background-position:160% 0}}.is-static .st07-hatch,.is-static .st07-sheen{animation:none}.is-static .st07-sheen{opacity:0}html.is-static {.st07-hatch,.st07-sheen{animation:none}}`;

/** ST07 · One full-width bar split into proportional segments; label + percentage under each. Segments unfold, one highlights in turn. */
function ST07() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M18");
  const [on] = useAutoCycle(r, BLEND.length, 1600);
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <style>{ST07_CSS}</style>
      <div className="grid grid-cols-1 items-end gap-6 md:grid-cols-12">
        <H className="text-[clamp(44px,5.4vw,92px)] md:col-span-7">Inside House Blend No. 4</H>
        <div className="md:col-span-5 md:pb-2">
          <P className="max-w-[40ch]">Five estates, one roast. We weigh every green lot by hand so each bag tastes like the last.</P>
          <div className="mt-6 flex flex-wrap items-center gap-5">
            <Price now="₹780" was="₹860" className="text-[18px]" />
            <span className="text-[14px] text-[var(--sx-muted)]">250 g · whole bean or ground</span>
          </div>
        </div>
      </div>

      <div className="relative mt-[clamp(48px,6vw,88px)] min-w-0">
        <div className="relative flex h-[clamp(110px,11vw,170px)] gap-[3px] overflow-hidden rounded-[var(--sx-radius)]">
          {BLEND.map((b, k) => (
            <div
              key={b.n}
              data-m-card
              className="relative h-full transition-[filter,transform] duration-500"
              style={{
                width: `${b.p}%`,
                background: `color-mix(in srgb, var(--sx-accent) ${100 - k * 17}%, var(--sx-text))`,
                filter: k === on ? "brightness(1.18) saturate(1.1)" : "none",
              }}
            >
              <div className="st07-hatch absolute inset-0" style={{ animationDelay: `${-k * 0.4}s`, opacity: k === on ? 1 : 0.45 }} />
            </div>
          ))}
          <div className="st07-sheen pointer-events-none absolute inset-0" />
        </div>
        <div className="mt-5 flex gap-[3px]">
          {BLEND.map((b, k) => (
            <div key={b.n} className="min-w-0 border-l-2 pl-3 transition-colors duration-500" style={{ width: `${b.p}%`, borderColor: k === on ? "var(--sx-accent)" : "var(--sx-line)" }}>
              <p className="sx-display text-[clamp(26px,2.6vw,42px)] font-[600] leading-none tabular-nums">{b.p}%</p>
              <p className="mt-2 text-[14px] font-[650] leading-snug">{b.n}</p>
              <p className="mt-0.5 text-[13px] leading-snug text-[var(--sx-muted)]">{b.d}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-[clamp(40px,5vw,72px)] flex flex-wrap items-center justify-between gap-6 border-t border-[var(--sx-line)] pt-8">
        <p className="max-w-[52ch] text-[15px] text-[var(--sx-muted)]">Medium roast · notes of cocoa, orange peel and jaggery · roasted every Monday in Bengaluru</p>
        <div className="flex flex-wrap gap-4">
          <Btn>Add to bag</Btn>
          <Btn kind="ghost">Subscribe & save 10%</Btn>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────────── ST08 · Provenance ledger ───────────────────────────── */

const LEDGER = [
  { ing: "Cacao", who: "Varkey family estate", where: "Idukki, Kerala", km: 412 },
  { ing: "Cane sugar", who: "Mandya growers' co-op", where: "Mandya, Karnataka", km: 118 },
  { ing: "Cocoa butter", who: "Pressed in our kitchen", where: "Bengaluru", km: 0 },
  { ing: "Sea salt", who: "Agariya salt pans", where: "Little Rann, Kutch", km: 1520 },
  { ing: "Cardamom", who: "Selvam spice garden", where: "Bodinayakanur, Tamil Nadu", km: 380 },
  { ing: "Milk", who: "Nandi Hills dairy", where: "Chikkaballapur", km: 46 },
];
const MAX_KM = 1600;
const ST08_CSS = `.st08-run{animation:st08-run var(--d,2.4s) linear infinite}@keyframes st08-run{from{left:0}to{left:100%}}.is-static .st08-run{animation:none;left:100%}html.is-static {.st08-run{animation:none;left:100%}}`;

/** ST08 · A ledger: ingredient, producer, region, km in hairline columns, with a distance bar per row; rows light up in turn. */
function ST08() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const [on] = useAutoCycle(r, LEDGER.length, 1500);
  const cols = "md:grid-cols-[1fr_1.35fr_1.25fr_0.55fr_1.5fr]";
  return (
    <Sec innerRef={r} theme="stone" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <style>{ST08_CSS}</style>
      <div className="grid grid-cols-1 items-end gap-6 md:grid-cols-12">
        <H className="text-[clamp(48px,6vw,104px)] md:col-span-6">Every ingredient, traced.</H>
        <div className="md:col-span-5 md:col-start-8 md:pb-3">
          <P>Six ingredients go into our 70% bar. Here is who grows each one, and how far it travels to reach the kitchen.</P>
        </div>
      </div>

      <div className="mt-[clamp(40px,5vw,72px)]">
        <div className={`hidden gap-6 border-b border-[var(--sx-line)] px-4 pb-3 text-[12px] font-[600] uppercase tracking-[0.14em] text-[var(--sx-muted)] md:grid ${cols}`}>
          <span>Ingredient</span>
          <span>Producer</span>
          <span>Region</span>
          <span className="text-right">Distance</span>
          <span>to Bengaluru</span>
        </div>
        {LEDGER.map((l, k) => (
          <div
            key={l.ing}
            data-m-card
            className={`grid grid-cols-2 items-center gap-x-6 gap-y-2 border-b border-[var(--sx-line)] px-4 py-[clamp(16px,1.6vw,24px)] transition-colors duration-700 ${cols}`}
            style={{ background: k === on ? "var(--sx-surface)" : "transparent" }}
          >
            <p className="sx-display text-[clamp(24px,2.2vw,34px)] leading-none">{l.ing}</p>
            <p className="text-[15px]">{l.who}</p>
            <p className="text-[15px] text-[var(--sx-muted)]">{l.where}</p>
            <p className="text-right text-[17px] font-[650] tabular-nums">{l.km.toLocaleString("en-IN")} km</p>
            <div className="relative col-span-2 h-[10px] rounded-full bg-[color-mix(in_srgb,var(--sx-text)_8%,transparent)] md:col-span-1">
              <div className="absolute inset-y-0 left-0 rounded-full transition-[background] duration-700" style={{ width: `${Math.max(2, (l.km / MAX_KM) * 100)}%`, background: k === on ? "var(--sx-accent)" : "color-mix(in srgb, var(--sx-accent) 45%, transparent)" }}>
                <span className="st08-run absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--sx-bg)] bg-[var(--sx-accent)]" style={{ ["--d" as string]: `${1.8 + k * 0.35}s` }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-6">
        <p className="text-[15px] text-[var(--sx-muted)]">Average journey: 413 km · no air freight, ever</p>
        <div className="flex flex-wrap items-center gap-5">
          <Price now="₹240" className="text-[18px]" />
          <Btn>Shop the 70% bar</Btn>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "ST07", name: "Proportion bar", motion: "M18", C: ST07 },
  { code: "ST08", name: "Provenance ledger", motion: "M23", C: ST08 },
];
