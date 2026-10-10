"use client";

// EV · Event layouts (docs/SECTION-MENU.md). Each is a full designed section; motion via useSectionMotion.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Price, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Hands-free cycling: steps an index every `ms` while the section is on screen (stops off screen and in ?static=1). */
function useAutoCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms = 1000) {
  const [i, setI] = useState(-1);
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
  return i;
}

const DAYS = [
  {
    d: "Fri",
    n: "14",
    m: "February",
    rows: [
      ["5:30 pm", "Gates open, welcome kombucha", "Main lawn", "Free"],
      ["7:00 pm", "Fire-pit supper with the Coorg Kitchen", "The Orchard", "Food"],
      ["9:30 pm", "Mira Joseph Quartet", "Banyan Stage", "Music"],
    ],
  },
  {
    d: "Sat",
    n: "15",
    m: "February",
    rows: [
      ["7:00 am", "Sunrise breathwork by the lake", "Jetty", "Wellness"],
      ["11:00 am", "Cold-brew masterclass", "Roastery tent", "Talk"],
      ["4:00 pm", "Natural wine and small plates", "The Orchard", "Food"],
      ["10:00 pm", "Late set: Kabir Shah b2b Ira Menon", "Banyan Stage", "Music"],
    ],
  },
  {
    d: "Sun",
    n: "16",
    m: "February",
    rows: [
      ["9:00 am", "Slow breakfast, long tables", "Main lawn", "Food"],
      ["12:00 pm", "Closing circle and farewell lunch", "Banyan Stage", "Free"],
    ],
  },
];

const EV01_CSS = `.ev01-row{position:relative;isolation:isolate}.ev01-row::before{content:"";position:absolute;inset:0 -16px;z-index:-1;border-radius:12px;opacity:0;transition:opacity .8s ease;background:linear-gradient(100deg,color-mix(in srgb,var(--sx-accent) 6%,transparent) 20%,color-mix(in srgb,var(--sx-accent) 22%,transparent) 50%,color-mix(in srgb,var(--sx-accent) 6%,transparent) 80%) 0 0/250% 100%;animation:ev01-sheen 2.2s linear infinite}.ev01-row.is-on::before{opacity:1}@keyframes ev01-sheen{from{background-position:110% 0}to{background-position:-10% 0}}.is-static .ev01-row::before{animation:none}html.is-static {.ev01-row::before{animation:none}}`;

/** EV01 · Agenda list grouped by day: a big day heading on the left of each block, rows of time, title, location and tag on the right. */
function EV01() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M6");
  const total = DAYS.reduce((s, d) => s + d.rows.length, 0);
  const on = useAutoCycle(r, total, 1000);
  let idx = -1;
  return (
    <Sec innerRef={r} theme="stone" font="condensed" className="py-[clamp(72px,9vw,140px)]">
      <style>{EV01_CSS}</style>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[12ch] text-[clamp(56px,7vw,124px)] uppercase">Three days by the lake.</H>
        <div className="max-w-[36ch]">
          <P>The Monsoon Weekender programme: music, long suppers and slow mornings at Kalpa Lake Estate.</P>
          <div className="mt-6">
            <Btn>Get a pass</Btn>
          </div>
        </div>
      </div>
      <div className="mt-[clamp(48px,6vw,96px)] border-t border-[var(--sx-text)]">
        {DAYS.map((day) => (
          <div key={day.n} className="grid grid-cols-1 gap-[clamp(16px,3vw,48px)] border-b border-[var(--sx-line)] py-[clamp(24px,3vw,44px)] md:grid-cols-12">
            <div className="md:col-span-3">
              <p data-m-head className="sx-display text-[clamp(48px,5vw,88px)] uppercase leading-[0.85]">
                {day.d} {day.n}
              </p>
              <p className="mt-2 text-[14px] text-[var(--sx-muted)]">{day.m}</p>
            </div>
            <ul className="min-w-0 md:col-span-9">
              {day.rows.map(([t, title, loc, tag]) => {
                idx += 1;
                return (
                  <li key={t + title} className={`ev01-row grid grid-cols-[88px_minmax(0,1fr)] items-baseline gap-x-6 gap-y-1 border-b border-[var(--sx-line)] py-4 last:border-b-0 md:grid-cols-[110px_minmax(0,1fr)_180px_100px] ${idx === on ? "is-on" : ""}`}>
                    <span className="text-[15px] font-[600] tabular-nums text-[var(--sx-muted)]">{t}</span>
                    <span data-m-text className="text-[clamp(18px,1.6vw,24px)] font-[600] leading-snug text-[var(--sx-text)]">{title}</span>
                    <span className="text-[14px] text-[var(--sx-muted)] max-md:col-start-2">{loc}</span>
                    <span className="justify-self-start rounded-full border border-[var(--sx-line)] px-3 py-1 text-[12px] font-[650] uppercase tracking-[0.1em] max-md:col-start-2 md:justify-self-end">{tag}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </Sec>
  );
}

const TICKETS = [
  { k: "Early bird", p: "₹4,500", inc: ["All three days", "Welcome kombucha", "Lawn camping spot"], sold: true },
  { k: "Student", p: "₹3,200", inc: ["All three days", "Lawn camping spot", "Valid college ID at the gate"], sold: false },
  { k: "Regular", p: "₹6,000", inc: ["All three days", "Fire-pit supper seat", "Lakeside tent for two"], sold: false },
];
const PERKS = [
  ["Kiln & Co", "15% off ceramics at the market"],
  ["Halcyon Rail", "Return shuttle from Pune, ₹600"],
  ["Meridia", "Free cold brew every morning"],
  ["Arcwell Stays", "Late checkout on Sunday"],
  ["Solano Wines", "Tasting flight with every pass"],
  ["Fennick Bikes", "Free cycle hire around the lake"],
];

const EV02_CSS = `.ev02-ticket{position:relative;overflow:hidden}.ev02-ticket::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(105deg,transparent 38%,rgba(255,255,255,.09) 50%,transparent 62%) 0 0/260% 100%;animation:ev02-sheen 3.2s linear infinite}.ev02-ticket:nth-child(2)::after{animation-delay:-1s}.ev02-ticket:nth-child(3)::after{animation-delay:-2s}@keyframes ev02-sheen{from{background-position:120% 0}to{background-position:-20% 0}}.is-static .ev02-ticket::after{animation:none;opacity:0}html.is-static {.ev02-ticket::after{animation:none;opacity:0}}`;

/** EV02 · Ticket cards: three perforated ticket tiers (the first SOLD OUT under a stamp), partner perks grid below. */
function EV02() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M18");
  return (
    <Sec innerRef={r} theme="ink" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <style>{EV02_CSS}</style>
      <div className="mx-auto max-w-[820px] text-center">
        <H className="text-[clamp(48px,6vw,104px)]">Passes for the weekend.</H>
        <P className="mx-auto mt-5 max-w-[44ch]">Three days, one lake, four hundred guests. Early bird went in a week; the rest are going.</P>
      </div>
      <div className="mt-[clamp(48px,6vw,88px)] grid grid-cols-1 gap-[clamp(16px,2vw,28px)] md:grid-cols-3">
        {TICKETS.map((t) => (
          <article key={t.k} data-m-card className={`ev02-ticket sx-card flex flex-col ${t.sold ? "opacity-80" : ""} ${t.k === "Regular" ? "border-[var(--sx-accent)]!" : ""}`}>
            <div className="p-[clamp(22px,2.4vw,36px)]">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[13px] font-[650] uppercase tracking-[0.16em] text-[var(--sx-muted)]">{t.k}</p>
                <p className="text-[12px] tabular-nums text-[var(--sx-muted)]">14 – 16 Feb</p>
              </div>
              <p className={`sx-display mt-5 text-[clamp(44px,4.4vw,72px)] font-[800] leading-none tabular-nums ${t.sold ? "text-[var(--sx-muted)] line-through decoration-[3px]" : ""}`}>{t.p}</p>
              <ul className="mt-6 space-y-2 text-[15px] text-[var(--sx-muted)]">
                {t.inc.map((x) => (
                  <li key={x} className="flex gap-3">
                    <span className="text-[var(--sx-accent)]">+</span>
                    {x}
                  </li>
                ))}
              </ul>
            </div>
            {/* perforation: two notches + a dashed tear line */}
            <div className="relative mt-auto h-0 border-t-2 border-dashed border-[var(--sx-line)]">
              <span className="absolute -left-[15px] -top-[14px] h-[28px] w-[28px] rounded-full border border-[var(--sx-line)] bg-[var(--sx-bg)]" />
              <span className="absolute -right-[15px] -top-[14px] h-[28px] w-[28px] rounded-full border border-[var(--sx-line)] bg-[var(--sx-bg)]" />
            </div>
            <div className="flex items-center justify-between gap-4 p-[clamp(18px,2vw,28px)]">
              <p className="font-mono text-[12px] tracking-[0.2em] text-[var(--sx-muted)]">MW-{t.k.slice(0, 2).toUpperCase()}-2026</p>
              {t.sold ? <span className="sx-btn sx-btn-ghost pointer-events-none opacity-50">Sold out</span> : <Btn kind={t.k === "Regular" ? "solid" : "ghost"}>Buy pass</Btn>}
            </div>
            {t.sold && (
              <div data-m-card className="pointer-events-none absolute right-[clamp(12px,1.6vw,24px)] top-[clamp(40px,4vw,64px)] rotate-[-14deg] rounded-[10px] border-[3px] border-[var(--sx-accent)] px-5 py-2 text-[clamp(22px,2.2vw,34px)] font-[900] uppercase tracking-[0.12em] text-[var(--sx-accent)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--sx-accent)_18%,transparent)]">
                Sold out
              </div>
            )}
          </article>
        ))}
      </div>
      <div className="mt-[clamp(56px,7vw,104px)]">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-[var(--sx-line)] pb-5">
          <h3 className="sx-display text-[clamp(26px,2.4vw,38px)] font-[700]">Every pass comes with</h3>
          <p className="text-[14px] text-[var(--sx-muted)]">
            Group of 6? <Price now="₹30,000" className="text-[var(--sx-text)]" /> for six regular passes
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {PERKS.map(([n, d], k) => (
            <div key={n} className={`border-b border-[var(--sx-line)] py-6 pr-6 ${k % 3 ? "md:border-l md:pl-6" : ""}`}>
              <p className={`text-[17px] ${k % 2 ? "font-[700] italic" : "font-[650] uppercase tracking-[0.14em]"}`}>{n}</p>
              <p className="mt-2 text-[15px] text-[var(--sx-muted)]">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "EV01", name: "Agenda list grouped by day", motion: "M6", C: EV01 },
  { code: "EV02", name: "Ticket cards with sold-out state", motion: "M18", C: EV02 },
];
