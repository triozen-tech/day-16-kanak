"use client";

// CC · Contact layouts, batch 4 (CC07–CC08). Full designed sections; ?static=1 shows each in its final state.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, Kicker, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Hands-free cycling: steps an index every `ms` while the section is on screen (stops off screen and in ?static=1). */
function useAutoCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms = 2000) {
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

/** Small line icons (24 grid, stroke = currentColor). */
const ICONS: Record<string, string> = {
  mail: "M3 6.5h18v11H3z M3.5 7l8.5 6.5L20.5 7",
  chat: "M4 5h16v10H9l-5 4z M8 9.5h8 M8 12h5",
  pin: "M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z M12 7.6a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 1 0 0-4.8",
  calendar: "M4 6h16v14H4z M4 10h16 M8.5 3.5v4 M15.5 3.5v4",
  glass: "M7 3.5h10l-1 7a4 4 0 0 1-8 0z M12 14.5V20 M8.5 20.5h7",
};
const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d={ICONS[name]} />
  </svg>
);

/* ───────────────────────── CC07 · Intro column + 2×2 contact methods ───────────────────────── */

const CC07_CSS = `
.cc07-orb{animation:cc07-orb 5.4s ease-in-out infinite alternate}
@keyframes cc07-orb{from{transform:translate(-22%,-10%) scale(.95)}to{transform:translate(26%,14%) scale(1.2)}}
.cc07-ping{animation:cc07-ping 1.6s ease-out infinite}
@keyframes cc07-ping{from{transform:scale(1);opacity:.7}to{transform:scale(2.6);opacity:0}}
html.is-static .cc07-orb,html.is-static .cc07-ping{animation:none}
html.is-static {.cc07-orb,.cc07-ping{animation:none}}
`;

const CC07_METHODS = [
  { icon: "calendar", t: "Reservations", d: "Rooms, dates and the long-stay rate for seven nights or more.", v: "stay@casaalba.example" },
  { icon: "chat", t: "Concierge on WhatsApp", d: "Airport cars, a table at the beach shack, a late check-out.", v: "Start a chat →" },
  { icon: "glass", t: "Weddings & gatherings", d: "Up to sixty guests across the courtyard and the pool lawn.", v: "events@casaalba.example" },
  { icon: "pin", t: "Find the house", d: "A Portuguese villa behind the church in Assagao, North Goa.", v: "Open the map →" },
];

/** CC07 · Three columns: the intro (heading and one line) in the first, a 2×2 grid of contact methods (icon, title,
 *  line, value) across the other two. Lines mask-slide up and the cards settle in (M23); the cards take turns being
 *  the "answered now" one while a soft light drifts behind them. */
function CC07() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const [i] = useAutoCycle(r, CC07_METHODS.length, 1700);
  return (
    <Sec innerRef={r} theme="stone" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <style>{CC07_CSS}</style>
      <div className="grid grid-cols-1 gap-[clamp(32px,4vw,72px)] md:grid-cols-3">
        <div className="flex flex-col justify-between">
          <div>
            <H className="max-w-[11ch] text-[clamp(44px,4.6vw,78px)]">Talk to the house.</H>
            <P className="mt-6 max-w-[34ch]">Eight rooms, one courtyard and a small team who answer every message themselves.</P>
          </div>
          <div data-m-text className="mt-10 flex items-center gap-3 text-[14px] text-[var(--sx-muted)]">
            <span className="relative inline-grid h-2.5 w-2.5 place-items-center">
              <span className="cc07-ping absolute inset-0 rounded-full bg-[var(--sx-accent)]" />
              <span className="relative h-2.5 w-2.5 rounded-full bg-[var(--sx-accent)]" />
            </span>
            Front desk online · 8 am to 11 pm
          </div>
        </div>
        <div className="relative md:col-span-2">
          <div className="pointer-events-none absolute inset-[-10%] grid place-items-center">
            <div className="cc07-orb aspect-square w-[70%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_26%,transparent),transparent)]" />
          </div>
          <div className="relative grid grid-cols-1 gap-[clamp(12px,1.4vw,20px)] md:grid-cols-2">
            {CC07_METHODS.map((m, k) => {
              const on = k === i;
              return (
                <a
                  key={m.t}
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  data-m-card
                  className={`sx-card flex min-h-[clamp(220px,17vw,280px)] flex-col p-[clamp(22px,2.4vw,36px)] transition-[background-color,border-color,translate] duration-500 ${on ? "-translate-y-1.5 border-[var(--sx-accent)]! bg-[color-mix(in_srgb,var(--sx-accent)_9%,var(--sx-surface))]!" : ""}`}
                >
                  <span className={`grid h-12 w-12 place-items-center rounded-full border transition-colors duration-500 ${on ? "border-[var(--sx-accent)] bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "border-[var(--sx-line)] text-[var(--sx-text)]"}`}>
                    <Icon name={m.icon} className="h-5 w-5" />
                  </span>
                  <p className="mt-6 text-[clamp(18px,1.5vw,22px)] font-[650]">{m.t}</p>
                  <p className="mt-2 text-[15px] leading-relaxed text-[var(--sx-muted)]">{m.d}</p>
                  <p className={`mt-auto pt-5 text-[15px] font-[600] transition-colors duration-500 ${on ? "text-[var(--sx-accent)]" : "text-[var(--sx-text)]"}`}>{m.v}</p>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── CC08 · Heading, wide image, method row ───────────────────────── */

const CC08_CSS = `
.cc08-sweep{animation:cc08-sweep 2.8s linear infinite}
@keyframes cc08-sweep{from{transform:translateX(-60%) skewX(-16deg)}to{transform:translateX(330%) skewX(-16deg)}}
.cc08-breathe{animation:cc08-breathe 6.4s ease-in-out infinite alternate}
@keyframes cc08-breathe{from{scale:1}to{scale:1.025}}
html.is-static .cc08-sweep,html.is-static .cc08-breathe{animation:none}
html.is-static .cc08-sweep{opacity:0}
html.is-static {.cc08-sweep,.cc08-breathe{animation:none}.cc08-sweep{opacity:0}}
`;

const CC08_METHODS = [
  { icon: "calendar", t: "Book a table", d: "Tables for two to twelve, released thirty days ahead at noon.", v: "Reserve online →" },
  { icon: "mail", t: "Private dining", d: "The upstairs room seats twenty-two, set menus from ₹3,800 a head.", v: "events@korakitchen.example" },
  { icon: "pin", t: "Find us", d: "Down the lane off Pali Hill, Bandra West. Valet from 7 pm.", v: "Get directions →" },
];

/** CC08 · Centred eyebrow, heading and line; a wide landscape photo that scales down into its frame with the scroll
 *  (M13); a three-column row of contact methods under it. A slow light sweeps the photo while it holds. */
function CC08() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M13");
  return (
    <Sec innerRef={r} theme="ink" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <style>{CC08_CSS}</style>
      <div className="mx-auto max-w-[760px] text-center">
        <Kicker>Kora · coastal kitchen</Kicker>
        <H className="mt-5 text-[clamp(52px,6.4vw,108px)]">Come hungry, stay late.</H>
        <P className="mx-auto mt-6 max-w-[44ch]">Kerala fish curries, Mangalorean ghee roast and a long bar that pours until one. Walk-ins welcome before eight.</P>
      </div>
      <div className="relative mx-auto mt-[clamp(40px,5vw,72px)] max-w-[1320px]">
        <div className="cc08-breathe">
          <Pic i={3} ratio="21/9" label="" />
        </div>
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[var(--sx-radius)]">
          <div className="cc08-sweep absolute inset-y-0 left-0 w-[26%] bg-[linear-gradient(90deg,transparent,rgba(255,236,200,.16),transparent)]" />
          <div className="absolute inset-x-0 bottom-0 h-[40%] bg-[linear-gradient(180deg,transparent,rgba(7,9,15,.55))]" />
        </div>
        <div className="absolute left-[clamp(16px,2vw,28px)] top-[clamp(16px,2vw,28px)] flex items-center gap-2.5 rounded-full border border-white/15 bg-[#07090f]/45 px-4 py-2 text-[13px] text-white backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-[#5fd38d]" />
          Open tonight · kitchen until 11:30 pm
        </div>
      </div>
      <div className="mx-auto mt-[clamp(36px,4vw,64px)] grid max-w-[1320px] grid-cols-1 md:grid-cols-3">
        {CC08_METHODS.map((m, k) => (
          <div key={m.t} data-m-text className={`flex gap-5 py-6 md:px-[clamp(16px,2.4vw,40px)] ${k ? "border-t border-[var(--sx-line)] md:border-l md:border-t-0" : "md:pl-0"}`}>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[var(--sx-line)] text-[var(--sx-accent)]">
              <Icon name={m.icon} className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="sx-display text-[clamp(24px,2vw,30px)] leading-none">{m.t}</p>
              <p className="mt-3 text-[15px] leading-relaxed text-[var(--sx-muted)]">{m.d}</p>
              <p className="mt-4 break-words text-[15px] font-[600] text-[var(--sx-text)]">{m.v}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-[clamp(32px,4vw,56px)] flex justify-center">
        <Btn>Reserve a table</Btn>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "CC07", name: "Intro column + 2x2 contact methods", motion: "M23", C: CC07 },
  { code: "CC08", name: "Heading, wide image, method row", motion: "M13", C: CC08 },
];
