"use client";

// MP · Map & location layouts (docs/SECTION-MENU.md), batch 5. The hours grid spotlights one service after another by
// itself while on screen (a hover takes over); loops stop in ?static=1.
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

const MP_CSS = `.mp5-sheen{background:linear-gradient(100deg,transparent 25%,color-mix(in srgb,var(--sx-accent) 42%,transparent) 50%,transparent 75%) 0 0/250% 100%;animation:mp5-sheen 2.6s linear infinite}@keyframes mp5-sheen{from{background-position:130% 0}to{background-position:-30% 0}}
.mp5-ping{animation:mp5-ping 1.4s cubic-bezier(0,0,.2,1) infinite}@keyframes mp5-ping{from{transform:scale(1);opacity:.7}to{transform:scale(3.2);opacity:0}}
.is-static .mp5-sheen,.is-static .mp5-ping{animation:none;opacity:0}
html.is-static {.mp5-sheen,.mp5-ping{animation:none;opacity:0}}`;

const SERVICES = ["Dining", "Bar", "Breakfast", "Happy hour", "Takeaway", "Delivery"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TODAY = 4; // Friday
/** Hours per day × service ("" = closed). */
const HOURS: string[][] = [
  ["", "", "", "", "12–10", "12–10"],
  ["12–11", "5–12", "", "5–7", "12–10", "12–10"],
  ["12–11", "5–12", "", "5–7", "12–10", "12–10"],
  ["12–11", "5–12", "", "5–7", "12–10", "12–10"],
  ["12–12", "5–1", "", "5–7", "12–11", "12–11"],
  ["11–12", "4–1", "8–12", "", "11–11", "11–11"],
  ["11–11", "4–12", "8–1", "", "11–10", "11–10"],
];

/** MP09 · Address card + weekly hours grid: an address card with an Open-now pill on the left; on the right a grid of
 *  days (rows) × services (columns) with today's row highlighted. Numbers count up; one service is spotlit at a time. */
function MP09() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M3");
  const [col, setCol] = useAutoCycle(r, SERVICES.length, 1300);
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#2f7a54", ["--sx-accent-text" as string]: "#f3fbf6" }}>
      <style>{MP_CSS}</style>
      <H className="max-w-[16ch] text-[clamp(44px,5vw,84px)]">Open early, close late.</H>

      <div className="mt-[clamp(36px,4.5vw,64px)] grid grid-cols-1 gap-[clamp(24px,3vw,48px)] md:grid-cols-12">
        <div data-m-card className="sx-card flex flex-col rounded-[24px] border border-[var(--sx-line)] bg-[var(--sx-surface)] p-[clamp(22px,2.4vw,36px)] md:col-span-4">
          <span className="inline-flex w-max items-center gap-2.5 rounded-full bg-[var(--sx-accent)] px-4 py-2 text-[14px] font-[650] text-[var(--sx-accent-text)]">
            <span className="relative grid h-2.5 w-2.5 place-items-center">
              <span className="mp5-ping absolute inset-0 rounded-full bg-[var(--sx-accent-text)]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--sx-accent-text)]" />
            </span>
            Open now · until midnight
          </span>
          <p className="sx-display mt-8 text-[clamp(26px,2.2vw,34px)] font-[650] leading-tight">Saffron Yard</p>
          <P className="mt-3">
            Ground floor, Mill Compound
            <br />
            Lower Parel, Mumbai 400013
          </P>
          <div className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-[14px] border border-[var(--sx-line)] bg-[var(--sx-line)]">
            {[
              ["96", "seats"],
              ["84", "hrs a week"],
              ["4.8", "guest rating"],
            ].map(([n, k]) => (
              <div key={k} className="bg-[var(--sx-surface)] px-3 py-4">
                <p data-m-num className="sx-display text-[clamp(26px,2.2vw,34px)] font-[700] leading-none tabular-nums">
                  {n}
                </p>
                <p className="mt-1.5 text-[12px] uppercase tracking-[0.1em] text-[var(--sx-muted)]">{k}</p>
              </div>
            ))}
          </div>
          <div className="mt-auto flex flex-wrap gap-4 pt-8">
            <Btn>Get directions</Btn>
            <Btn kind="link">Call to book</Btn>
          </div>
        </div>

        <div className="min-w-0 overflow-hidden rounded-[24px] border border-[var(--sx-line)] md:col-span-8">
          <div className="grid grid-cols-[minmax(0,1.6fr)_repeat(6,minmax(0,1fr))] border-b border-[var(--sx-line)] bg-[var(--sx-surface)]">
            <span className="px-4 py-4 text-[12px] uppercase tracking-[0.12em] text-[var(--sx-muted)]">Day</span>
            {SERVICES.map((s, k) => (
              <button
                key={s}
                type="button"
                onMouseEnter={() => setCol(k)}
                className={`px-2 py-4 text-left text-[12px] font-[650] uppercase tracking-[0.08em] transition-colors duration-300 ${k === col ? "bg-[var(--sx-text)] text-[var(--sx-bg)]" : "text-[var(--sx-muted)]"}`}
              >
                {s}
              </button>
            ))}
          </div>
          {DAYS.map((d, ri) => {
            const today = ri === TODAY;
            return (
              <div key={d} data-m-card className={`relative grid grid-cols-[minmax(0,1.6fr)_repeat(6,minmax(0,1fr))] border-b border-[var(--sx-line)] last:border-b-0 ${today ? "bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : ""}`}>
                {today && <span className="mp5-sheen pointer-events-none absolute inset-0" />}
                <span className="relative flex items-center gap-2 px-4 py-[clamp(12px,1.25vw,18px)] text-[15px] font-[650]">
                  {d}
                  {today && <span className="rounded-full bg-[var(--sx-accent-text)] px-2 py-0.5 text-[12px] font-[700] uppercase tracking-[0.08em] text-[var(--sx-accent)]">Today</span>}
                </span>
                {HOURS[ri].map((h, k) => (
                  <span
                    key={k}
                    className={`relative flex items-center px-2 text-[15px] tabular-nums transition-colors duration-300 ${k === col && !today ? "bg-[color-mix(in_srgb,var(--sx-text)_8%,transparent)] font-[650]" : ""} ${h ? "" : "opacity-40"}`}
                  >
                    {h || "Closed"}
                  </span>
                ))}
              </div>
            );
          })}
          <p className="bg-[var(--sx-surface)] px-4 py-3 text-[13px] text-[var(--sx-muted)]">All times pm unless marked · Breakfast 8 am weekends only · Last orders 30 min before close</p>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "MP09", name: "Address card + weekly hours grid", motion: "M3", C: MP09 }];
