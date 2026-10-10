"use client";

// BK · Booking layouts (docs/SECTION-MENU.md), batch 2. Each is a full designed section; motion via useSectionMotion.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Hands-free loop that starts in its FINAL step (so ?static=1 shows the finished state) and replays from 0 on screen. */
function useReplay(ref: React.RefObject<HTMLElement | null>, n: number, ms: number) {
  const [i, setI] = useState(n - 1);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let t: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (e.isIntersecting) {
        setI(0);
        t = setInterval(() => setI((v) => (v + 1) % n), ms);
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, [ref, n, ms]);
  return i;
}

const BK03_CSS = `.bk03-pop{animation:bk03-pop .45s cubic-bezier(.2,.9,.25,1.2)}@keyframes bk03-pop{from{transform:scale(.55);opacity:.2}to{transform:none;opacity:1}}
.bk03-tick{display:inline-block;animation:bk03-tick .4s cubic-bezier(.2,.8,.2,1)}@keyframes bk03-tick{from{transform:translateY(-55%);opacity:0}to{transform:none;opacity:1}}
.is-static .bk03-pop,.is-static .bk03-tick{animation:none}html.is-static {.bk03-pop,.bk03-tick{animation:none}}`;

// December 2026 + January 2027. Day index: Dec d = d, Jan d = 31 + d.
const MONTHS = [
  { name: "December 2026", y: 2026, m: 11, days: 31, base: 0 },
  { name: "January 2027", y: 2027, m: 0, days: 31, base: 31 },
];
const BOOKED = new Set([24, 25, 26, 40, 41, 42]);
const CHECK_IN = 28; // Mon 28 Dec
const NIGHTS = 5; // to Sat 2 Jan
const RATE = 14500;
const CLEANING = 2500;
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const label = (idx: number) => {
  const mo = idx > 31 ? MONTHS[1] : MONTHS[0];
  const d = idx - mo.base;
  return `${WD[new Date(mo.y, mo.m, d).getDay()]}, ${d} ${mo.name.slice(0, 3)}`;
};
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** BK03 · Two-month range picker + stay summary: two months side by side, the check-in / check-out range picks itself
 *  on screen and fills day by day while nights and the total count up in the summary on the right. */
function BK03() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M3");
  // step 0 = nothing picked · 1 = check-in · 2..6 = range grows a night at a time · 7..10 = hold
  const step = useReplay(r, 11, 430);
  const nights = Math.max(0, Math.min(NIGHTS, step - 1));
  const picked = step >= 1;
  const out = CHECK_IN + nights;
  const sub = nights * RATE;
  const tax = Math.round((sub + (nights ? CLEANING : 0)) * 0.12);
  const total = nights ? sub + CLEANING + tax : 0;
  return (
    <Sec innerRef={r} theme="stone" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <style>{BK03_CSS}</style>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[14ch] text-[clamp(44px,5.4vw,92px)]">Pick your nights in the pines.</H>
        <P className="max-w-[38ch]">The Fern Cabin, Mukteshwar. A two-bedroom timber cabin with a wood stove and the Himalaya at the window.</P>
      </div>

      <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 gap-[clamp(16px,2vw,28px)] md:grid-cols-12">
        <div data-m-card className="sx-card grid grid-cols-1 gap-[clamp(24px,3vw,48px)] p-[clamp(20px,2.6vw,40px)] md:col-span-8 md:grid-cols-2">
          {MONTHS.map((mo, mi) => {
            const lead = (new Date(mo.y, mo.m, 1).getDay() + 6) % 7; // Monday first
            return (
              <div key={mo.name} className="min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-[clamp(18px,1.4vw,22px)] font-[650]">{mo.name}</p>
                  <span className="grid h-9 w-9 place-items-center rounded-full border border-[var(--sx-line)] text-[15px] text-[var(--sx-muted)]">{mi ? "→" : "←"}</span>
                </div>
                <div className="mt-5 grid grid-cols-7 text-center text-[12px] font-[650] uppercase tracking-[0.1em] text-[var(--sx-muted)]">
                  {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
                    <span key={d} className="py-2">{d}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-y-1.5">
                  {Array.from({ length: lead }, (_, k) => (
                    <span key={`l${k}`} />
                  ))}
                  {Array.from({ length: mo.days }, (_, k) => {
                    const d = k + 1;
                    const idx = mo.base + d;
                    const isIn = picked && idx === CHECK_IN;
                    const isOut = nights > 0 && idx === out;
                    const mid = nights > 0 && idx > CHECK_IN && idx < out;
                    const booked = BOOKED.has(idx);
                    const col = (lead + k) % 7;
                    return (
                      <div key={d} className="relative grid h-[clamp(36px,3.2vw,46px)] place-items-center">
                        {(mid || (isIn && nights > 0) || isOut) && (
                          <span
                            className={`absolute inset-y-[3px] bg-[color-mix(in_srgb,var(--sx-accent)_16%,transparent)] ${isIn ? "left-1/2 right-0" : isOut ? "left-0 right-1/2" : "inset-x-0"} ${mid && col === 0 ? "rounded-l-full" : ""} ${mid && col === 6 ? "rounded-r-full" : ""}`}
                          />
                        )}
                        <span
                          key={isIn || isOut ? `on${idx}` : idx}
                          className={`relative grid aspect-square h-full place-items-center rounded-full text-[15px] tabular-nums transition-colors duration-300 ${
                            isIn || isOut ? "bk03-pop bg-[var(--sx-accent)] font-[700] text-[var(--sx-accent-text)]" : booked ? "text-[var(--sx-muted)] line-through opacity-50" : mid ? "font-[600]" : ""
                          }`}
                        >
                          {d}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[var(--sx-line)] pt-5 text-[13px] text-[var(--sx-muted)] md:col-span-2">
            <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[var(--sx-accent)]" />Check-in / out</span>
            <span className="flex items-center gap-2"><span className="h-3 w-5 rounded-full bg-[color-mix(in_srgb,var(--sx-accent)_16%,transparent)]" />Your stay</span>
            <span className="flex items-center gap-2"><span className="line-through">24</span> Already booked</span>
            <span className="ml-auto">Minimum two nights · check-in from 2 pm</span>
          </div>
        </div>

        <div data-m-card className="flex flex-col rounded-[var(--sx-radius,18px)] bg-[var(--sx-text)] p-[clamp(22px,2.6vw,40px)] text-[var(--sx-bg)] md:col-span-4">
          <p className="text-[13px] font-[650] uppercase tracking-[0.14em] opacity-60">Your stay</p>
          <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-[14px] bg-[color-mix(in_srgb,var(--sx-bg)_18%,transparent)]">
            {[
              ["Check-in", picked ? label(CHECK_IN) : "Add date"],
              ["Check-out", nights ? label(out) : "Add date"],
            ].map(([k, v]) => (
              <div key={k} className="bg-[var(--sx-text)] p-4">
                <p className="text-[12px] uppercase tracking-[0.12em] opacity-55">{k}</p>
                <p key={v} className="bk03-tick mt-1 text-[clamp(16px,1.3vw,19px)] font-[600]">{v}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-end gap-3">
            <span key={nights} className="bk03-tick sx-display text-[clamp(64px,6vw,104px)] font-[800] leading-[0.85] tabular-nums">{nights}</span>
            <span className="pb-2 text-[17px] opacity-70">{nights === 1 ? "night" : "nights"} · 4 guests</span>
          </div>
          <div className="mt-8 space-y-3 border-t border-[color-mix(in_srgb,var(--sx-bg)_20%,transparent)] pt-6 text-[15px]">
            <div className="flex justify-between"><span className="opacity-70">{inr(RATE)} × {nights} nights</span><span className="tabular-nums">{inr(sub)}</span></div>
            <div className="flex justify-between"><span className="opacity-70">Cleaning</span><span className="tabular-nums">{nights ? inr(CLEANING) : "—"}</span></div>
            <div className="flex justify-between"><span className="opacity-70">Taxes (12%)</span><span className="tabular-nums">{inr(tax)}</span></div>
          </div>
          <div className="mt-6 flex items-end justify-between border-t border-[color-mix(in_srgb,var(--sx-bg)_20%,transparent)] pt-6">
            <span className="text-[15px] opacity-70">Total</span>
            <span key={total} className="bk03-tick sx-display text-[clamp(32px,2.8vw,46px)] font-[700] leading-none tabular-nums">{inr(total)}</span>
          </div>
          <div className="mt-auto pt-8">
            <Btn className="w-full justify-center">Reserve the cabin</Btn>
            <p className="mt-4 text-center text-[13px] opacity-60">
              Rated <span data-m-num>4.92</span> from 318 stays · free cancellation for 7 days
            </p>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "BK03", name: "Two-month range picker + stay summary", motion: "M3", C: BK03 }];
