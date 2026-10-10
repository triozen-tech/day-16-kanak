"use client";

// BK · Booking layouts (docs/SECTION-MENU.md), batch 5. Both pickers choose by themselves while on screen (a click
// takes over); loops stop in ?static=1.
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
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

const BK_CSS = `.bk5-rise{animation:bk5-rise .55s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--k) * 60ms)}@keyframes bk5-rise{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
.bk5-scan{background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--sx-accent) 36%,transparent),transparent) 0 0/40% 100% no-repeat;animation:bk5-scan 2.8s linear infinite}@keyframes bk5-scan{from{background-position:-60% 0}to{background-position:160% 0}}
.bk5-beam{animation:bk5-beam 3.2s linear infinite}@keyframes bk5-beam{from{translate:-70% 0}to{translate:170% 0}}
.bk5-pop{animation:bk5-pop .45s cubic-bezier(.2,.9,.25,1.2) both}@keyframes bk5-pop{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:none}}
.is-static .bk5-rise,.is-static .bk5-pop{animation:none}.is-static .bk5-scan,.is-static .bk5-beam{animation:none;opacity:0}
html.is-static {.bk5-rise,.bk5-pop{animation:none}.bk5-scan,.bk5-beam{animation:none;opacity:0}}`;

/* ── BK06 ─────────────────────────────────────────────────────────────── */

// October 2026 starts on a Thursday (Monday-first grid: 3 empty cells).
const OFFSET = 3;
const CLOSED = (d: number) => (d + OFFSET) % 7 === 0 || d < 5; // Mondays closed, and the past
const BK6_SLOTS = ["10:00", "10:30", "11:15", "12:00", "13:30", "14:15", "15:00", "15:45", "16:30", "17:15", "18:00"];
const busy = (d: number, s: number) => (d * 3 + s * 5) % 7 === 0 || (d + s * 2) % 9 === 0;
/** The auto-pick script: [day, slot] (each day is shown twice: first its list rises, then a slot is picked). */
const BK6_PICKS: [number, number][] = [
  [9, 1],
  [9, 4],
  [14, 2],
  [14, 6],
  [21, 0],
  [21, 5],
  [17, 3],
  [17, 5],
];

/** BK06 · Month calendar + slot list card: a month calendar on the left, the free time slots for the chosen day as a
 *  list on the right, a confirm button below. Days snap in; the slot list rises item by item after a day is picked. */
function BK06() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M6");
  const [step] = useAutoCycle(r, BK6_PICKS.length, 1200);
  const [manual, setManual] = useState<[number, number] | null>(null);
  const [day, slot] = manual ?? BK6_PICKS[step];
  useEffect(() => setManual(null), [step]);
  const slots = BK6_SLOTS.map((t, k) => ({ t, k, busy: busy(day, k) && k !== slot }));
  return (
    <Sec innerRef={r} theme="stone" font="editorial" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#3b4fd8", ["--sx-accent-text" as string]: "#f5f6ff" }}>
      <style>{BK_CSS}</style>
      <div className="grid grid-cols-1 items-center gap-[clamp(36px,5vw,88px)] md:grid-cols-12">
        <div className="md:col-span-4">
          <H className="text-[clamp(48px,5.2vw,88px)]">A private hour with the collection.</H>
          <P className="mt-6 max-w-[36ch]">Book a one-to-one viewing at our Colaba gallery. A specialist walks you through the new ceramics, tea is on us.</P>
          <ul className="mt-9 space-y-3 text-[15px]">
            {["45 minutes, by appointment only", "Up to three guests", "Complimentary, no purchase expected"].map((x) => (
              <li key={x} className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[var(--sx-accent)]" />
                {x}
              </li>
            ))}
          </ul>
        </div>

        <div className="sx-card relative overflow-hidden rounded-[26px] border border-[var(--sx-line)] bg-[var(--sx-surface)] md:col-span-8">
          <div className="bk5-beam pointer-events-none absolute inset-y-0 left-0 w-[40%] bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--sx-accent)_16%,transparent),transparent)]" />
          <div className="bk5-scan pointer-events-none absolute inset-x-0 top-0 h-[6px]" />
          <div className="relative grid grid-cols-1 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <div className="border-[var(--sx-line)] p-[clamp(20px,2.4vw,36px)] md:border-r">
              <div className="flex items-center justify-between">
                <p className="sx-display text-[clamp(26px,2.2vw,34px)] leading-none">October 2026</p>
                <div className="flex gap-2 text-[var(--sx-muted)]">
                  <span className="grid h-9 w-9 place-items-center rounded-full border border-[var(--sx-line)]">‹</span>
                  <span className="grid h-9 w-9 place-items-center rounded-full border border-[var(--sx-line)]">›</span>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-7 text-center text-[12px] uppercase tracking-[0.12em] text-[var(--sx-muted)]">
                {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
                  <span key={d} className="py-2">
                    {d}
                  </span>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-[clamp(4px,0.5vw,8px)]">
                {Array.from({ length: OFFSET }, (_, k) => (
                  <span key={`e${k}`} />
                ))}
                {Array.from({ length: 31 }, (_, k) => {
                  const d = k + 1;
                  const off = CLOSED(d);
                  const on = d === day;
                  return (
                    <button
                      key={d}
                      type="button"
                      data-m-card
                      disabled={off}
                      onClick={() => setManual([d, 0])}
                      className={`aspect-square rounded-full text-[clamp(14px,1.1vw,17px)] font-[550] tabular-nums transition-colors duration-300 ${on ? "bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : off ? "text-[var(--sx-muted)] opacity-40 line-through" : "hover:bg-[color-mix(in_srgb,var(--sx-accent)_12%,transparent)]"}`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col p-[clamp(20px,2.4vw,36px)]">
              <p className="text-[12px] uppercase tracking-[0.14em] text-[var(--sx-muted)]">Free times</p>
              <p className="sx-display mt-1 text-[clamp(24px,2vw,30px)] leading-none">{`${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][(day + OFFSET - 1) % 7]} ${day} Oct`}</p>
              <div className="relative mt-5 max-h-[400px] overflow-hidden [mask-image:linear-gradient(180deg,#000_80%,transparent)]">
                <ul key={day} className="space-y-2 pb-8">
                  {slots.map((s) => {
                    const on = s.k === slot;
                    return (
                      <li key={s.t} className="bk5-rise" style={{ ["--k" as string]: s.k }}>
                        <button
                          type="button"
                          disabled={s.busy}
                          onClick={() => setManual([day, s.k])}
                          className={`flex w-full items-center justify-between rounded-[12px] border px-4 py-2.5 text-[15px] tabular-nums transition-colors duration-300 ${on ? "border-[var(--sx-accent)] bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : s.busy ? "border-transparent text-[var(--sx-muted)] opacity-45" : "border-[var(--sx-line)]"}`}
                        >
                          <span className="font-[600]">{s.t}</span>
                          <span className="text-[13px] opacity-75">{s.busy ? "Taken" : on ? "Selected" : "45 min"}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
          <div className="relative flex flex-wrap items-center justify-between gap-4 border-t border-[var(--sx-line)] px-[clamp(20px,2.4vw,36px)] py-5">
            <p className="text-[15px] text-[var(--sx-muted)]">
              <b className="font-[650] text-[var(--sx-text)]">{`${day} October · ${BK6_SLOTS[slot]}`}</b> · Colaba gallery, first floor
            </p>
            <Btn>Confirm viewing</Btn>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ── BK07 ─────────────────────────────────────────────────────────────── */

const ROWS = ["A", "B", "C", "D", "E", "F", "G"];
const PER = 14;
const PRICE = 650;
const sold = (r: number, c: number) => (r * 7 + c * 3) % 5 === 0 || (r === 0 && c > 9) || (r + c) % 11 === 0;
/** Auto-pick script: the selected seats at each step (two seats get picked, then a new pair). */
const PAIRS: [number, number][][] = [
  [[3, 6], [3, 7]],
  [[5, 2], [5, 3]],
  [[2, 4], [2, 5]],
];
const STEPS: [number, number][][] = PAIRS.flatMap((p) => [[], [p[0]], p, p]);

/** BK07 · Seat map picker + total panel: a seat grid facing the screen bar, a legend (free / taken / yours), and a side
 *  panel with the chosen seats and the total. Seats snap in row by row from the screen; two get picked and the total
 *  counts up. */
function BK07() {
  const r = useRef<HTMLDivElement>(null);
  const [step] = useAutoCycle(r, STEPS.length, 900);
  const [manual, setManual] = useState<[number, number][] | null>(null);
  useEffect(() => setManual(null), [step]);
  const picked = manual ?? STEPS[step];
  const total = picked.length * PRICE + (picked.length ? 40 : 0);
  const [shown, setShown] = useState(total);
  const shownRef = useRef(total);

  // M3 · the total rolls up to its new value whenever the selection changes
  useEffect(() => {
    if (prefersReducedMotion()) return setShown(total);
    const o = { v: shownRef.current };
    const tw = gsap.to(o, { v: total, duration: 0.6, ease: "power2.out", onUpdate: () => ((shownRef.current = o.v), setShown(Math.round(o.v))) });
    return () => {
      tw.kill();
    };
  }, [total]);

  // entry: seats snap in row by row away from the screen bar, the panel numbers count from zero
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const once = { trigger: el, start: "top 75%", toggleActions: "play none none reverse" } as const;
      el.querySelectorAll<HTMLElement>("[data-bk-row]").forEach((row, i) => {
        gsap.from(row.children, { y: -28, scale: 0.4, opacity: 0, duration: 0.55, ease: "back.out(1.6)", stagger: { each: 0.018, from: "center" }, delay: 0.15 + i * 0.09, scrollTrigger: once });
      });
      gsap.from(el.querySelectorAll("[data-m-head], [data-m-text], [data-bk-panel]"), { y: 26, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, scrollTrigger: once });
    }, el);
    return () => ctx.revert();
  }, []);

  const isPicked = (rr: number, c: number) => picked.some(([a, b]) => a === rr && b === c);
  const toggle = (rr: number, c: number) => {
    const cur = manual ?? picked;
    setManual(isPicked(rr, c) ? cur.filter(([a, b]) => !(a === rr && b === c)) : [...cur, [rr, c] as [number, number]].slice(-4));
  };

  return (
    <Sec innerRef={r} theme="ink" font="wide" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#ff6a3d", ["--sx-accent-text" as string]: "#160803" }}>
      <style>{BK_CSS}</style>
      <div className="grid grid-cols-1 items-end gap-6 md:grid-cols-12">
        <H className="text-[clamp(40px,4.4vw,72px)] md:col-span-7">Pick your seats under the stars.</H>
        <P className="max-w-[44ch] md:col-span-5">Saturday rooftop screening, 8:30 pm. Blankets, popcorn and a cold brew at every seat. Row A reclines.</P>
      </div>

      <div className="mt-[clamp(36px,4.5vw,64px)] grid grid-cols-1 gap-[clamp(24px,3vw,48px)] md:grid-cols-12">
        <div className="relative min-w-0 overflow-hidden rounded-[24px] border border-[var(--sx-line)] bg-[var(--sx-surface)] p-[clamp(20px,2.6vw,40px)] md:col-span-8">
          <div className="bk5-beam pointer-events-none absolute inset-y-0 left-0 w-[45%] bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--sx-accent)_30%,transparent),transparent)]" />
          <div className="relative">
            <div className="mx-auto h-[10px] w-[78%] rounded-full bg-[var(--sx-accent)] shadow-[0_18px_60px_color-mix(in_srgb,var(--sx-accent)_60%,transparent)]" />
            <p className="mt-3 text-center text-[12px] uppercase tracking-[0.3em] text-[var(--sx-muted)]">Screen</p>
            <div className="mt-[clamp(22px,2.6vw,36px)] space-y-[clamp(6px,0.7vw,10px)]">
              {ROWS.map((row, ri) => (
                <div key={row} className="flex items-center justify-center gap-[clamp(10px,1.2vw,18px)]">
                  <span className="w-5 text-[12px] font-[650] text-[var(--sx-muted)]">{row}</span>
                  <div data-bk-row className="flex gap-[clamp(4px,0.5vw,8px)]">
                    {Array.from({ length: PER }, (_, c) => {
                      const s = sold(ri, c);
                      const on = isPicked(ri, c);
                      return (
                        <button
                          key={c}
                          type="button"
                          disabled={s}
                          onClick={() => toggle(ri, c)}
                          aria-label={`Seat ${row}${c + 1}`}
                          className={`h-[clamp(20px,1.9vw,30px)] w-[clamp(20px,1.9vw,30px)] rounded-t-[9px] rounded-b-[4px] transition-colors duration-300 ${c === 6 ? "mr-[clamp(12px,1.6vw,26px)]" : ""} ${on ? "bg-[var(--sx-accent)]" : s ? "bg-[color-mix(in_srgb,var(--sx-text)_12%,transparent)]" : "border border-[color-mix(in_srgb,var(--sx-text)_40%,transparent)] hover:border-[var(--sx-accent)]"}`}
                        />
                      );
                    })}
                  </div>
                  <span className="w-5 text-right text-[12px] font-[650] text-[var(--sx-muted)]">{row}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2 text-[13px] text-[var(--sx-muted)]">
              <span className="flex items-center gap-2">
                <i className="h-3.5 w-3.5 rounded-[4px] border border-[color-mix(in_srgb,var(--sx-text)_40%,transparent)]" /> Free
              </span>
              <span className="flex items-center gap-2">
                <i className="h-3.5 w-3.5 rounded-[4px] bg-[color-mix(in_srgb,var(--sx-text)_12%,transparent)]" /> Taken
              </span>
              <span className="flex items-center gap-2">
                <i className="h-3.5 w-3.5 rounded-[4px] bg-[var(--sx-accent)]" /> Yours
              </span>
            </div>
          </div>
        </div>

        <aside data-bk-panel className="flex flex-col rounded-[24px] border border-[var(--sx-line)] p-[clamp(20px,2.4vw,36px)] md:col-span-4">
          <p className="text-[12px] uppercase tracking-[0.14em] text-[var(--sx-muted)]">Sat 17 Oct · 8:30 pm</p>
          <p className="sx-display mt-2 text-[clamp(22px,1.8vw,28px)] font-[700] leading-tight">The Long Summer</p>
          <p className="mt-1 text-[14px] text-[var(--sx-muted)]">Rooftop 2 · 2 h 06 min · English, subtitled</p>

          <div className="mt-8 min-h-[112px] border-t border-[var(--sx-line)] pt-6">
            <p className="text-[12px] uppercase tracking-[0.14em] text-[var(--sx-muted)]">Your seats</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {picked.length === 0 && <span className="text-[15px] text-[var(--sx-muted)]">Tap a free seat</span>}
              {picked.map(([a, b]) => (
                <span key={`${a}-${b}`} className="bk5-pop rounded-full bg-[var(--sx-accent)] px-3.5 py-1.5 text-[14px] font-[650] text-[var(--sx-accent-text)]">
                  {ROWS[a]}
                  {b + 1}
                </span>
              ))}
            </div>
          </div>

          <dl className="mt-6 space-y-2 border-t border-[var(--sx-line)] pt-6 text-[15px]">
            <div className="flex justify-between">
              <dt className="text-[var(--sx-muted)]">{`${picked.length} × ₹${PRICE}`}</dt>
              <dd className="tabular-nums">₹{(picked.length * PRICE).toLocaleString("en-IN")}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--sx-muted)]">Booking fee</dt>
              <dd className="tabular-nums">₹{picked.length ? 40 : 0}</dd>
            </div>
          </dl>
          <div className="mt-6 flex items-end justify-between border-t border-[var(--sx-line)] pt-6">
            <span className="text-[13px] uppercase tracking-[0.14em] text-[var(--sx-muted)]">Total</span>
            <span className="sx-display text-[clamp(36px,3.2vw,52px)] font-[700] leading-none tabular-nums">₹{shown.toLocaleString("en-IN")}</span>
          </div>
          <Btn className="mt-8 justify-center">Pay and book</Btn>
        </aside>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "BK06", name: "Month calendar + slot list card", motion: "M6", C: BK06 },
  { code: "BK07", name: "Seat map picker + total panel", motion: "M3", C: BK07 },
];
