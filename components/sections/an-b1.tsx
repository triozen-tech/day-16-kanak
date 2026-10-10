"use client";

// AN · Announcement layouts (docs/SECTION-MENU.md), batch 1. Each is shown in a little page context (nav + first
// screen, or a shop block) so the gallery reads where the announcement lives.
import { useEffect, useRef, useState } from "react";
import { isRecording, prefersReducedMotion } from "@/lib/gsap";
import { ShineText } from "../fx/text";
import { ShimmerButton } from "../fx/more";
import { MagneticButton } from "../fx/layout";
import { Btn, H, P, Pic, Price, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** AN01 · Slim top bar with pill label: a full-width slim bar above the nav (pill label, one line, inline arrow link,
 *  dismiss at the right edge). The pill carries a running shine; once the bar is stuck to the top, scrolling down folds
 *  it away and scrolling up drops it back (not while recording). */
function AN01() {
  const r = useRef<HTMLDivElement>(null);
  const [folded, setFolded] = useState(false);
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion() || isRecording()) return;
    let last = window.scrollY;
    const on = () => {
      const y = window.scrollY;
      const stuck = el.getBoundingClientRect().top <= 0 && el.getBoundingClientRect().bottom > 120;
      if (Math.abs(y - last) > 4) setFolded(stuck && y > last);
      last = y;
    };
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <Sec innerRef={r} theme="ink" font="grotesk" full style={{ overflow: "clip" }}>
      <style>{`
        .an01-rise{animation:an01-rise .9s cubic-bezier(.22,1,.36,1) .2s both}
        @keyframes an01-rise{from{opacity:0;translate:0 100%}}
        html.is-static .an01-rise{animation:none}
      `}</style>
      <div className={`sticky top-0 z-30 grid transition-[grid-template-rows] duration-500 ease-out ${folded || gone ? "grid-rows-[0fr]" : "grid-rows-[1fr]"}`}>
        <div className="min-h-0 overflow-hidden">
          <div className="relative flex items-center justify-center border-b border-[var(--sx-line)] bg-[var(--sx-accent)] px-14 py-3 text-[var(--sx-accent-text)]">
            <p className="an01-rise flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-[14px] font-[550]">
              <span className="rounded-full bg-[var(--sx-accent-text)] px-3 py-1 text-[12px] font-[750] uppercase tracking-[0.12em] text-[var(--sx-accent)]">
                <ShineText>New</ShineText>
              </span>
              <span>The SPF 50 gel cream is here, 20% off in launch week.</span>
              <a href="#" onClick={(e) => e.preventDefault()} className="inline-flex items-center gap-1 font-[700] underline underline-offset-4">
                Shop it <span aria-hidden>→</span>
              </a>
            </p>
            <button type="button" aria-label="Dismiss" onClick={() => !isRecording() && setGone(true)} className="absolute right-[clamp(12px,2vw,28px)] top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-[18px] leading-none opacity-70 hover:opacity-100">
              ×
            </button>
          </div>
        </div>
      </div>
      <nav className="flex items-center justify-between px-[clamp(20px,5vw,96px)] py-6">
        <span className="sx-display text-[22px] font-[700] tracking-[-0.02em]">dew&amp;dune</span>
        <ul className="flex gap-8 text-[15px] text-[var(--sx-muted)] max-md:hidden">
          {["Face", "Body", "Sun", "Sets", "Journal"].map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <span className="text-[15px]">Bag (2)</span>
      </nav>
      <div className="grid grid-cols-1 items-center gap-[clamp(32px,5vw,80px)] px-[clamp(20px,5vw,96px)] pb-[clamp(72px,9vw,140px)] pt-[clamp(24px,4vw,56px)] md:grid-cols-12">
        <div className="md:col-span-6">
          <H className="text-[clamp(48px,6vw,100px)]">Sun care that sinks in.</H>
          <P className="mt-6 max-w-[40ch]">A weightless gel with zinc and niacinamide. No white cast, no shine, made for humid afternoons.</P>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Btn>Shop SPF 50 · ₹749</Btn>
            <Price now="₹599" was="₹749" className="text-[17px]" />
          </div>
        </div>
        <div className="md:col-span-6">
          <div className="fx-drift overflow-hidden rounded-[var(--sx-radius)]">
            <Pic i={2} ratio="5/4" label="SPF 50" />
          </div>
        </div>
      </div>
    </Sec>
  );
}

/** AN02 · Three-part sale strip with code chip: a full-width coloured band in three parts: a loud "Up to 50% off" left,
 *  "plus free shipping, use code" with a boxed code chip in the middle, a shop button right. */
function AN02() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M12");
  return (
    <Sec innerRef={r} theme="paper" font="condensed" full>
      <style>{`
        .an02-band{background-image:repeating-linear-gradient(-45deg,rgba(255,255,255,.07) 0 18px,transparent 18px 44px);background-size:124px 124px;animation:an02-band 3s linear infinite}
        @keyframes an02-band{to{background-position:124px 0}}
        html.is-static .an02-band{animation:none}
        html.is-static {.an02-band{animation:none}}
      `}</style>
      <div className="relative bg-[var(--sx-accent)] text-[var(--sx-accent-text)]">
        <div aria-hidden className="an02-band absolute inset-0" />
        <div className="relative grid grid-cols-1 items-center gap-8 px-[clamp(20px,5vw,96px)] py-[clamp(40px,5vw,72px)] md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] md:gap-[clamp(24px,4vw,64px)]">
          <div>
            <H className="text-[clamp(52px,6.4vw,112px)] leading-[0.86]">Up to 50% off</H>
          </div>
          <div className="md:border-l md:border-current/25 md:pl-[clamp(24px,4vw,64px)]">
            <p data-m-text className="text-[clamp(17px,1.4vw,21px)] leading-snug">
              The linen summer sale. Plus free shipping on everything, use code
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <span className="inline-flex" style={{ ["--accent" as string]: "#fff" }}>
                <ShimmerButton className="text-[16px] tracking-[0.2em]">LINEN50</ShimmerButton>
              </span>
              <span className="text-[13px] opacity-75">Ends Sunday, midnight</span>
            </div>
          </div>
          <div className="flex justify-start md:justify-end">
            <MagneticButton className="bg-[var(--sx-accent-text)] text-[var(--sx-accent)]">Shop the sale →</MagneticButton>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/** AN03 · Floating bottom promo pill: a small rounded bar (not full width) that docks ~24px above the bottom edge of the
 *  screen while this block scrolls, with one line of offer, a link and a dismiss (kept open while recording). */
function AN03() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M18");
  const [gone, setGone] = useState(false);
  const scents = [
    ["Saffron Dusk", "Saffron, oud, smoked vanilla", "₹4,200"],
    ["Monsoon Vetiver", "Wet earth, vetiver, green tea", "₹3,600"],
    ["White Champa", "Champa, pear, white musk", "₹3,900"],
  ];
  return (
    <Sec innerRef={r} theme="paper" font="editorial" className="py-[clamp(72px,9vw,140px)]" style={{ overflow: "clip" }}>
      <div className="grid grid-cols-1 items-center gap-[clamp(32px,5vw,96px)] md:grid-cols-12">
        <div className="md:col-span-6">
          <div className="fx-drift overflow-hidden rounded-[var(--sx-radius)]">
            <Pic i={3} ratio="4/5" label="EAU DE PARFUM" />
          </div>
        </div>
        <div className="md:col-span-6">
          <H className="text-[clamp(48px,5.6vw,96px)]">Three scents for the evening.</H>
          <P className="mt-5 max-w-[42ch]">Eaux de parfum blended in Kannauj, aged ninety days in glass. 50 ml, refillable.</P>
          <ul className="mt-10 border-t border-[var(--sx-line)]">
            {scents.map(([n, notes, p]) => (
              <li key={n} className="flex items-baseline justify-between gap-6 border-b border-[var(--sx-line)] py-5">
                <span>
                  <span className="sx-display block text-[clamp(24px,2.2vw,34px)] leading-none">{n}</span>
                  <span className="mt-2 block text-[14px] text-[var(--sx-muted)]">{notes}</span>
                </span>
                <Price now={p} className="text-[17px]" />
              </li>
            ))}
          </ul>
        </div>
      </div>
      {!gone && (
        <div className="pointer-events-none sticky bottom-6 z-20 mt-[clamp(40px,5vw,72px)] flex justify-center">
          <div data-m-card className="pointer-events-auto flex items-center gap-4 rounded-full border border-[var(--sx-line)] bg-[var(--sx-text)] py-2.5 pl-6 pr-2.5 text-[15px] text-[var(--sx-bg)] shadow-[0_24px_60px_-20px_rgba(28,24,19,.55)]">
            <span className="size-2 shrink-0 rounded-full bg-[var(--sx-accent)]" />
            <span>A free 10 ml travel spray with any full bottle</span>
            <a href="#" onClick={(e) => e.preventDefault()} className="font-[650] underline underline-offset-4 max-md:hidden">
              Choose yours
            </a>
            <button type="button" aria-label="Dismiss" onClick={() => !isRecording() && setGone(true)} className="grid size-9 place-items-center rounded-full bg-[color-mix(in_srgb,var(--sx-bg)_14%,transparent)] text-[18px] leading-none">
              ×
            </button>
          </div>
        </div>
      )}
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "AN01", name: "Slim top bar with pill label", motion: "M49", C: AN01 },
  { code: "AN02", name: "Three-part sale strip with code chip", motion: "M12", C: AN02 },
  { code: "AN03", name: "Floating bottom promo pill", motion: "M18", C: AN03 },
];
