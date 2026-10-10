"use client";

// EV · Events layouts (docs/SECTION-MENU.md), batch 5. The calendar spotlights one event after another by itself while
// on screen (a hover takes over); loops stop in ?static=1.
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, Sec } from "./kit";
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

const EV_CSS = `.ev5-sweep{background:linear-gradient(120deg,transparent 30%,color-mix(in srgb,var(--sx-accent) 22%,transparent) 50%,transparent 70%) 0 0/250% 250%;animation:ev5-sweep 3.4s linear infinite}@keyframes ev5-sweep{from{background-position:120% 120%}to{background-position:-20% -20%}}
.ev5-in{animation:ev5-in .5s cubic-bezier(.2,.8,.2,1) both}@keyframes ev5-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.is-static .ev5-sweep{animation:none;opacity:0}.is-static .ev5-in{animation:none}
html.is-static {.ev5-sweep{animation:none;opacity:0}.ev5-in{animation:none}}`;

type Ev = { day: number; time: string; title: string; price: string; seats: string; loud?: boolean };
const EVENTS: Ev[] = [
  { day: 2, time: "6 pm", title: "Pour-over 101", price: "₹900", seats: "4 seats left" },
  { day: 6, time: "7 pm", title: "Cupping night", price: "₹1,200", seats: "6 seats left", loud: true },
  { day: 10, time: "11 am", title: "Kids' cocoa lab", price: "₹600", seats: "10 seats left" },
  { day: 10, time: "5 pm", title: "Latte art jam", price: "₹750", seats: "2 seats left" },
  { day: 14, time: "8 pm", title: "Roaster's table", price: "₹2,400", seats: "Waitlist", loud: true },
  { day: 17, time: "9 am", title: "Farm-to-cup talk", price: "Free", seats: "Open" },
  { day: 21, time: "7 pm", title: "Live jazz & cold brew", price: "₹500", seats: "12 seats left" },
  { day: 24, time: "10 am", title: "Home roasting", price: "₹1,800", seats: "5 seats left", loud: true },
  { day: 28, time: "6 pm", title: "Single-origin flight", price: "₹1,100", seats: "8 seats left" },
  { day: 31, time: "8 pm", title: "Harvest party", price: "₹1,500", seats: "20 seats left", loud: true },
];

// October 2026 starts on a Thursday (Monday-first grid): Sep 28–30 lead in, Nov 1 trails.
const CELLS = [...[28, 29, 30].map((d) => ({ d, out: true })), ...Array.from({ length: 31 }, (_, k) => ({ d: k + 1, out: false })), { d: 1, out: true }];
const TODAY = 9;

/** EV06 · Month grid calendar of events: a full month with events as chips inside their days and a month switcher
 *  above. Day cells snap in diagonally, then the chips rise into their days; one event at a time is spotlit. */
function EV06() {
  const r = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useAutoCycle(r, EVENTS.length, 1500);
  const cur = EVENTS[sel];

  // M34 · snap-in tiles, on a diagonal: cells lock in from the top-left corner outwards, then chips rise
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const once = { trigger: el, start: "top 75%", toggleActions: "play none none reverse" } as const;
      el.querySelectorAll<HTMLElement>("[data-ev-cell]").forEach((c, k) => {
        const row = Math.floor(k / 7);
        const col = k % 7;
        gsap.from(c, { x: -40, y: -40, scale: 0.82, opacity: 0, duration: 0.6, ease: "power3.out", delay: (row + col) * 0.05, scrollTrigger: once });
      });
      gsap.from(el.querySelectorAll("[data-ev-chip]"), { y: 18, opacity: 0, duration: 0.5, ease: "power2.out", stagger: 0.05, delay: 0.75, scrollTrigger: once });
      gsap.from(el.querySelectorAll("[data-m-head], [data-ev-top]"), { y: 26, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, scrollTrigger: once });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <Sec innerRef={r} theme="ink" font="grotesk" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#e8b04a", ["--sx-accent-text" as string]: "#1a1205" }}>
      <style>{EV_CSS}</style>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="text-[clamp(44px,5vw,84px)]">What&apos;s on at the roastery.</H>
        <div data-ev-top className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full border border-[var(--sx-line)] text-[var(--sx-muted)]">‹</span>
          <div className="flex rounded-full border border-[var(--sx-line)] p-1 text-[14px] font-[600]">
            {["Sep", "Oct", "Nov"].map((m) => (
              <span key={m} className={`rounded-full px-4 py-2 ${m === "Oct" ? "bg-[var(--sx-text)] text-[var(--sx-bg)]" : "text-[var(--sx-muted)]"}`}>
                {m} 2026
              </span>
            ))}
          </div>
          <span className="grid h-11 w-11 place-items-center rounded-full border border-[var(--sx-line)] text-[var(--sx-muted)]">›</span>
        </div>
      </div>

      <div className="relative mt-[clamp(32px,4vw,56px)] overflow-hidden rounded-[22px] border border-[var(--sx-line)]">
        <div className="relative grid grid-cols-7 border-b border-[var(--sx-line)] text-[12px] font-[650] uppercase tracking-[0.14em] text-[var(--sx-muted)]">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <span key={d} className="px-3 py-3">
              {d}
            </span>
          ))}
        </div>
        <div className="relative grid grid-cols-7 gap-px bg-[var(--sx-line)]">
          {CELLS.map((c, k) => {
            const evs = c.out ? [] : EVENTS.filter((e) => e.day === c.d);
            const on = !c.out && cur.day === c.d;
            return (
              <div
                key={k}
                data-ev-cell
                className={`flex min-h-[clamp(92px,8.4vw,124px)] min-w-0 flex-col gap-1.5 p-[clamp(6px,0.7vw,10px)] transition-colors duration-300 ${on ? "bg-[color-mix(in_srgb,var(--sx-accent)_16%,var(--sx-bg))]" : "bg-[var(--sx-bg)]"}`}
              >
                <span className={`grid h-7 w-7 place-items-center rounded-full text-[13px] font-[650] tabular-nums ${c.out ? "text-[var(--sx-muted)] opacity-40" : c.d === TODAY ? "bg-[var(--sx-text)] text-[var(--sx-bg)]" : ""}`}>{c.d}</span>
                {evs.map((e) => {
                  const active = e === cur;
                  return (
                    <button
                      key={e.title}
                      type="button"
                      data-ev-chip
                      onMouseEnter={() => setSel(EVENTS.indexOf(e))}
                      className={`min-w-0 truncate rounded-[8px] px-2 py-1 text-left text-[12px] font-[600] leading-snug transition-colors duration-300 ${active ? "bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : e.loud ? "bg-[color-mix(in_srgb,var(--sx-accent)_22%,transparent)] text-[var(--sx-text)]" : "border border-[var(--sx-line)] text-[var(--sx-text)]"}`}
                    >
                      <span className="opacity-70">{e.time}</span> {e.title}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div className="ev5-sweep pointer-events-none absolute inset-0 z-[1] mix-blend-screen" />
      </div>

      <div key={sel} className="ev5-in mt-6 flex flex-wrap items-center justify-between gap-5 rounded-[18px] border border-[var(--sx-line)] bg-[var(--sx-surface)] px-[clamp(18px,2vw,28px)] py-5">
        <p className="text-[clamp(17px,1.4vw,21px)]">
          <b className="font-[650]">{cur.title}</b>
          <span className="text-[var(--sx-muted)]">{` · ${cur.day} Oct, ${cur.time} · ${cur.seats}`}</span>
        </p>
        <div className="flex items-center gap-6">
          <span className="text-[18px] font-[650] tabular-nums">{cur.price}</span>
          <Btn>Reserve a spot</Btn>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "EV06", name: "Month grid calendar of events", motion: "M34", C: EV06 }];
