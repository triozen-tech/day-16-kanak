"use client";

// BK · Booking layouts (docs/SECTION-MENU.md), batch 4. The picker selects a day and a slot by itself while on screen
// (a click takes over); loops stop in ?static=1.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Hands-free cycling: steps an index every `ms` while the section is on screen (stops off screen and in ?static=1). */
function useAutoCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms = 1600) {
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

const BK_CSS = `.bk4-chip{animation:bk4-snap .5s cubic-bezier(.2,.9,.25,1.15) both;animation-delay:calc(var(--k) * 35ms)}@keyframes bk4-snap{from{opacity:0;transform:translateY(14px) scale(.9)}to{opacity:1;transform:none}}
.bk4-unfold{animation:bk4-unfold .7s cubic-bezier(.2,.8,.2,1) both}@keyframes bk4-unfold{from{clip-path:polygon(100% 100%,100% 100%,100% 100%,100% 100%)}to{clip-path:polygon(0 0,100% 0,100% 100%,0 100%)}}
.bk4-glow{animation:bk4-glow 5s ease-in-out infinite alternate}@keyframes bk4-glow{from{translate:-18% -10%}to{translate:22% 12%}}
.bk4-glow2{animation:bk4-glow 3.4s ease-in-out infinite alternate-reverse}
.is-static .bk4-chip,.is-static .bk4-unfold,.is-static .bk4-glow,.is-static .bk4-glow2{animation:none}
html.is-static {.bk4-chip,.bk4-unfold,.bk4-glow,.bk4-glow2{animation:none}}`;

const DAYS = [
  { d: "Mon", n: "05", off: true },
  { d: "Tue", n: "06" },
  { d: "Wed", n: "07" },
  { d: "Thu", n: "08" },
  { d: "Fri", n: "09" },
  { d: "Sat", n: "10" },
  { d: "Sun", n: "11", off: true },
];
const SLOTS = ["10:00", "10:45", "11:30", "12:15", "14:00", "14:45", "15:30", "16:15", "17:00", "17:45", "18:30", "19:15"];
/** Which slots are already taken on each day (deterministic, so server and client agree). */
const taken = (day: number, s: number) => (day * 5 + s * 3) % 7 === 0 || (day + s) % 5 === 0;
/** The first free slot at or after `s` on that day. */
const free = (day: number, s: number) => {
  for (let k = 0; k < SLOTS.length; k++) if (!taken(day, (s + k) % SLOTS.length)) return (s + k) % SLOTS.length;
  return 0;
};
/** The auto-pick script: (day, slot) pairs (snapped to a free slot). */
const PICKS: [number, number][] = [
  [3, 7],
  [1, 2],
  [5, 9],
  [2, 6],
  [4, 1],
];

/** BK05 · Week strip + time-slot chips: a seven-day strip across the top of a booking card, a grid of slot chips for
 *  the chosen day below, and a summary card that unfolds from its corner when a slot is picked. */
function BK05() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  const [step] = useAutoCycle(r, PICKS.length, 1900);
  const [manual, setManual] = useState<[number, number] | null>(null);
  const [day, want] = manual ?? PICKS[step];
  const slot = free(day, want);
  useEffect(() => setManual(null), [step]);
  return (
    <Sec innerRef={r} theme="ink" font="wide" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#c8e06a", ["--sx-accent-text" as string]: "#10140a" }}>
      <style>{BK_CSS}</style>
      <div className="grid grid-cols-1 gap-[clamp(36px,5vw,80px)] md:grid-cols-12">
        <div className="md:col-span-4">
          <H className="text-[clamp(44px,4.8vw,80px)]">Sit in on a tasting.</H>
          <P className="mt-6 max-w-[36ch]">Six first-flush Darjeelings, poured side by side at our Kolkata tea room. Seventy-five minutes, eight seats, one long table.</P>
          <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-[var(--sx-line)] bg-[var(--sx-line)]">
            {[
              ["Length", "75 min"],
              ["Seats", "8 per table"],
              ["Per seat", "₹1,200"],
              ["Take home", "50 g tin"],
            ].map(([k, v]) => (
              <div key={k} className="bg-[var(--sx-bg)] px-5 py-4">
                <dt className="text-[12px] uppercase tracking-[0.14em] text-[var(--sx-muted)]">{k}</dt>
                <dd className="mt-1 text-[17px] font-[600]">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative isolate overflow-hidden rounded-[24px] border border-[var(--sx-line)] bg-[var(--sx-surface)] p-[clamp(20px,2.6vw,40px)] md:col-span-8">
          <div className="bk4-glow pointer-events-none absolute -left-[10%] -top-[30%] -z-10 h-[90%] w-[70%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_22%,transparent),transparent)]" />
          <div className="bk4-glow2 pointer-events-none absolute -bottom-[30%] right-[-10%] -z-10 h-[80%] w-[60%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,#6aa0e0_20%,transparent),transparent)]" />
          <div className="flex items-center justify-between">
            <p className="text-[18px] font-[650]">October 2026</p>
            <div className="flex gap-2 text-[var(--sx-muted)]">
              <span className="grid h-10 w-10 place-items-center rounded-full border border-[var(--sx-line)]">←</span>
              <span className="grid h-10 w-10 place-items-center rounded-full border border-[var(--sx-line)]">→</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-7 gap-[clamp(6px,0.8vw,12px)]">
            {DAYS.map((x, k) => {
              const on = k === day;
              return (
                <button
                  key={x.n}
                  type="button"
                  data-m-card
                  disabled={x.off}
                  onClick={() => setManual([k, free(k, 0)])}
                  className={`rounded-[14px] border px-1 py-[clamp(10px,1.2vw,16px)] text-center transition-colors duration-300 ${on ? "border-[var(--sx-accent)] bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : x.off ? "border-transparent text-[var(--sx-muted)] opacity-40" : "border-[var(--sx-line)] hover:border-[var(--sx-muted)]"}`}
                >
                  <span className="block text-[12px] uppercase tracking-[0.14em] opacity-75">{x.d}</span>
                  <span className="sx-display mt-1 block text-[clamp(22px,2vw,32px)] font-[700] leading-none tabular-nums">{x.n}</span>
                </button>
              );
            })}
          </div>

          <p className="mt-8 text-[13px] uppercase tracking-[0.14em] text-[var(--sx-muted)]">Free seats · {DAYS[day].d} {DAYS[day].n} Oct</p>
          <div key={day} className="mt-4 grid grid-cols-3 gap-[clamp(8px,0.9vw,12px)] md:grid-cols-6">
            {SLOTS.map((s, k) => {
              const t = taken(day, k);
              const on = k === slot && !t;
              return (
                <button
                  key={s}
                  type="button"
                  disabled={t}
                  onClick={() => setManual([day, k])}
                  className={`bk4-chip rounded-full border py-3 text-[15px] font-[600] tabular-nums transition-colors duration-300 ${on ? "border-[var(--sx-accent)] bg-[color-mix(in_srgb,var(--sx-accent)_18%,transparent)] text-[var(--sx-text)]" : t ? "border-transparent text-[var(--sx-muted)] line-through opacity-40" : "border-[var(--sx-line)]"}`}
                  style={{ ["--k" as string]: k }}
                >
                  {s}
                </button>
              );
            })}
          </div>

          <div key={`${day}-${slot}`} className="bk4-unfold mt-8 flex flex-wrap items-center justify-between gap-5 rounded-[18px] bg-[var(--sx-text)] p-[clamp(18px,2vw,28px)] text-[var(--sx-bg)]">
            <div>
              <p className="text-[12px] uppercase tracking-[0.14em] opacity-60">Your seat</p>
              <p className="mt-1 text-[clamp(18px,1.6vw,24px)] font-[650]">
                {DAYS[day].d} {DAYS[day].n} Oct · {SLOTS[slot]}
              </p>
              <p className="mt-1 text-[15px] opacity-70">First-flush flight · 75 min · ₹1,200</p>
            </div>
            <Btn>Confirm seat</Btn>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "BK05", name: "Week strip + time-slot chips", motion: "M34", C: BK05 }];
