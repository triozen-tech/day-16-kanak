"use client";

// MN · Menu layouts (docs/SECTION-MENU.md), batch 5. The "tonight" card moves along the week by itself while on
// screen (a hover takes over); loops stop in ?static=1.
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

const MN_CSS = `.mn5-bar{transform-origin:0 50%;animation:mn5-bar 1.5s linear both}@keyframes mn5-bar{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.mn5-sweep{background:linear-gradient(100deg,transparent 30%,color-mix(in srgb,var(--sx-accent) 38%,transparent) 50%,transparent 70%) 0 0/260% 100%;animation:mn5-sweep 3.6s linear infinite}@keyframes mn5-sweep{from{background-position:130% 0}to{background-position:-30% 0}}
.is-static .mn5-bar{animation:none;transform:scaleX(1)}.is-static .mn5-sweep{animation:none;opacity:0}
html.is-static {.mn5-bar{animation:none}.mn5-sweep{animation:none;opacity:0}}`;

/** Simple line icons for each offer (stroke drawings). */
function Ico({ k }: { k: number }) {
  const s = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden>
      {k === 0 && <path d="M12 8h16l-2 24H14zM13 15h14" {...s} />}
      {k === 1 && (
        <>
          <circle cx="20" cy="22" r="11" {...s} />
          <circle cx="20" cy="22" r="6" {...s} />
          <path d="M8 8v8M5 8v5a3 3 0 006 0V8M33 8v24" {...s} />
        </>
      )}
      {k === 2 && <path d="M5 20c6-8 16-9 24-2l6-5v14l-6-5c-8 7-18 6-24-2zM12 19h0" {...s} />}
      {k === 3 && <path d="M20 34L6 9c9-4 19-4 28 0zM15 16h0M23 14h0M20 23h0M9 13c7-3 15-3 22 0" {...s} />}
      {k === 4 && <path d="M20 33C9 28 6 17 9 8c5 4 8 9 11 16 3-7 6-12 11-16 3 9 0 20-11 25zM20 24v9" {...s} />}
      {k === 5 && <path d="M13 6h14c0 9-3 14-7 14s-7-5-7-14zM20 20v12M14 33h12M13 12h14" {...s} />}
    </svg>
  );
}

const OFFERS = [
  { when: "Mon–Fri · 5–7 pm", title: "Happy hour", deal: "₹249 house pours, half-price small plates." },
  { when: "Mon–Fri · 12–3 pm", title: "Lunch special", deal: "Two courses and a lime soda, ₹449." },
  { when: "Tuesday · all day", title: "Tuesday fish", deal: "Catch of the day, grilled whole, ₹690." },
  { when: "Wednesday · 7 pm on", title: "Pizza night", deal: "Any wood-fired pie with a pint, ₹599." },
  { when: "Wednesday · 6–10 pm", title: "Mussel pots", deal: "A kilo in white wine and garlic, ₹780." },
  { when: "Thursday · 6 pm on", title: "Wine Thursday", deal: "Every bottle on the list 30% off." },
];

/** MN06 · Weekly offers strip: a one-row band of six small cards, one per standing offer (icon, day or time window in
 *  caps, one-line deal); the cards snap in, then a "tonight" marker walks along the week. */
function MN06() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  const [i, setI] = useAutoCycle(r, OFFERS.length, 1500);
  return (
    <Sec innerRef={r} theme="paper" font="condensed" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#c2412d", ["--sx-accent-text" as string]: "#fff7ef" }}>
      <style>{MN_CSS}</style>
      <div className="grid grid-cols-1 items-end gap-[clamp(24px,4vw,64px)] md:grid-cols-12">
        <H className="text-[clamp(52px,6.2vw,104px)] uppercase md:col-span-7">Something good, every night.</H>
        <div className="md:col-span-5">
          <P className="max-w-[40ch]">The standing deals at our Bandra taproom. No vouchers, no apps, just turn up on the right day and ask.</P>
          <div className="mt-6 flex flex-wrap gap-4">
            <Btn>Book a table</Btn>
            <Btn kind="link">Full menu</Btn>
          </div>
        </div>
      </div>

      <div className="relative mt-[clamp(40px,5vw,72px)]">
        <div className="mn5-sweep pointer-events-none absolute -inset-y-4 inset-x-0 rounded-[28px]" />
        <div className="relative z-10 grid grid-cols-1 gap-[clamp(10px,1vw,16px)] sm:grid-cols-3 lg:grid-cols-6">
          {OFFERS.map((o, k) => {
            const on = k === i;
            return (
              <div
                key={o.title}
                data-m-card
                onMouseEnter={() => setI(k)}
                className={`sx-card relative flex min-w-0 flex-col overflow-hidden rounded-[20px] border p-[clamp(16px,1.4vw,22px)] transition-colors duration-500 ${on ? "border-[var(--sx-accent)] bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "border-[var(--sx-line)] bg-[var(--sx-surface)]"}`}
              >
                <div className="flex items-start justify-between">
                  <span className={on ? "" : "text-[var(--sx-accent)]"}>
                    <Ico k={k} />
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-[12px] font-[650] uppercase tracking-[0.1em] transition-opacity duration-300 ${on ? "bg-[var(--sx-accent-text)] text-[var(--sx-accent)] opacity-100" : "opacity-0"}`}>Tonight</span>
                </div>
                <p className={`mt-6 text-[12px] font-[650] uppercase tracking-[0.14em] ${on ? "opacity-80" : "text-[var(--sx-muted)]"}`}>{o.when}</p>
                <p className="sx-display mt-2 text-[clamp(24px,2vw,32px)] font-[800] uppercase leading-none">{o.title}</p>
                <p className={`mt-3 text-[15px] leading-snug ${on ? "opacity-90" : "text-[var(--sx-muted)]"}`}>{o.deal}</p>
                <span className="mt-auto block pt-6">
                  <span className="block h-[4px] overflow-hidden rounded-full bg-[color-mix(in_srgb,currentColor_15%,transparent)]">
                    {on && <span key={`bar-${k}-${i}`} className="mn5-bar block h-full w-full rounded-full bg-[var(--sx-accent-text)]" />}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "MN06", name: "Weekly offers strip", motion: "M34", C: MN06 }];
