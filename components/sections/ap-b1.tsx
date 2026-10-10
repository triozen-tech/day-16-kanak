"use client";

// AP · App download layouts (docs/SECTION-MENU.md), batch 1. Phone frames are drawn in CSS; the screens are small
// hand-built app UIs (no real app, no real store badges: plain "iOS app / Android app" pills).
import { useRef, type ReactNode } from "react";
import { Btn, H, P, Price, Product, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** A phone frame (CSS only): bezel, island, rounded screen. Width from the className. */
function Phone({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative aspect-[9/19.2] rounded-[clamp(30px,3vw,46px)] bg-[#0c0d10] p-[clamp(7px,0.7vw,10px)] shadow-[0_50px_100px_-40px_rgba(0,0,0,.55),inset_0_0_0_1.5px_rgba(255,255,255,.14)] ${className}`}>
      <div className="relative h-full w-full overflow-hidden rounded-[clamp(24px,2.4vw,38px)] bg-[var(--sx-surface)]">
        {children}
        <span className="absolute left-1/2 top-[1.6%] z-20 h-[3.4%] w-[30%] -translate-x-1/2 rounded-full bg-[#0c0d10]" />
      </div>
    </div>
  );
}

/** Plain store pills (never the real store badges). */
const StorePills = ({ className = "" }: { className?: string }) => (
  <div className={`flex flex-wrap gap-3 ${className}`}>
    {[
      ["iOS app", "M12 3c2 0 3 1.4 3 1.4S13.8 6 13.8 7.6C13.8 9.5 15.5 10 15.5 10s-.9 3-2.6 3c-.9 0-1.3-.5-2.3-.5S9 13 8.2 13C6.6 13 5 10.2 5 8c0-2.4 1.6-3.6 3-3.6 1 0 1.6.6 2.3.6.6 0 1-.6 1.7-2z"],
      ["Android app", "M5 8h10v6a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1zM6.5 4.5l1 1.6M13.5 4.5l-1 1.6M5 7.5a5 5 0 0 1 10 0z"],
    ].map(([t, d]) => (
      <a key={t} href="#" onClick={(e) => e.preventDefault()} className="inline-flex items-center gap-3 rounded-[14px] bg-[var(--sx-text)] px-5 py-3 text-[var(--sx-bg)]">
        <svg viewBox="0 0 20 18" className="size-5 fill-current" aria-hidden>
          <path d={d} />
        </svg>
        <span className="leading-tight">
          <span className="block text-[12px] opacity-70">Get the</span>
          <span className="block text-[15px] font-[650]">{t}</span>
        </span>
      </a>
    ))}
  </div>
);

/** AP01 · Centre phone flanked by feature callouts: heading on top, one tall phone looping its screen, two callouts each
 *  side at different heights, store pills under the phone. Callouts tilt up in alternating order (L, R, L, R). */
function AP01() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M31");
  const calls = [
    { t: "Your roast, on repeat", d: "Pick a bag size and a rhythm. We roast on Monday, it lands Wednesday.", side: "md:left-0 md:top-[10%] md:text-right", icon: "M4 10a6 6 0 1 0 2-4.5M4 3v3h3" },
    { t: "Pause from the lock screen", d: "Travelling? Skip a delivery in one tap, no emails.", side: "md:right-0 md:top-[22%]", icon: "M7 4v12M13 4v12" },
    { t: "Earn a free bag every 8th", d: "Beans, brewers and café visits all count.", side: "md:left-[3%] md:top-[56%] md:text-right", icon: "M10 3l2 4.5 5 .5-3.8 3.3 1.1 4.9L10 13.7 5.7 16.2l1.1-4.9L3 8l5-.5z" },
    { t: "Brew guides that time you", d: "A built-in timer for pour-over, French press and moka.", side: "md:right-[3%] md:top-[66%]", icon: "M10 5v5l3 2M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" },
  ];
  const menu = [
    ["Attikan Estate", "Chocolate, orange peel", "₹640"],
    ["Ratnagiri Natural", "Berry, wine, cacao", "₹720"],
    ["Baba Budan", "Caramel, spice", "₹590"],
    ["Monsooned Malabar", "Earthy, low acid", "₹560"],
    ["Kalledevarapura", "Jaggery, plum", "₹680"],
  ];
  const loop = [...menu, ...menu];
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <style>{`
        .ap01-feed{animation:ap01-feed 14s linear infinite}
        @keyframes ap01-feed{to{transform:translateY(-50%)}}
        html.is-static .ap01-feed{animation:none}
        html.is-static {.ap01-feed{animation:none}}
      `}</style>
      <div className="mx-auto max-w-[820px] text-center">
        <H className="text-[clamp(44px,5.6vw,96px)]">Your coffee, in your pocket.</H>
        <P className="mx-auto mt-5 max-w-[44ch]">The Kaapi Club app runs your subscription, your rewards and your morning brew.</P>
      </div>
      <div className="relative mx-auto mt-[clamp(40px,5vw,72px)] max-w-[1180px]">
        <div className="relative z-10 mx-auto w-[clamp(260px,22vw,330px)]" data-m-card>
          <Phone>
            <div className="flex h-full flex-col">
              <div className="bg-[var(--sx-accent)] px-5 pb-5 pt-[18%] text-[var(--sx-accent-text)]">
                <p className="text-[12px] opacity-80">Good morning, Ira</p>
                <p className="sx-display mt-1 text-[24px] leading-none">Next bag: Wed</p>
                <div className="mt-4 h-1.5 rounded-full bg-white/25">
                  <div className="h-full w-[62%] rounded-full bg-white" />
                </div>
                <p className="mt-2 text-[12px] opacity-80">5 of 8 stamps to a free bag</p>
              </div>
              <div className="relative min-h-0 flex-1 overflow-hidden">
                <div className="ap01-feed px-4 pt-3">
                  {loop.map(([n, notes, p], k) => (
                    <div key={k} className="flex items-center gap-3 border-b border-[var(--sx-line)] py-3">
                      <span className="size-10 shrink-0 rounded-[10px]" style={{ background: ["#7a3b22", "#b5502a", "#3d2a1d", "#8a6a3b", "#5a2f1f"][k % 5] }} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-[650]">{n}</p>
                        <p className="truncate text-[12px] text-[var(--sx-muted)]">{notes}</p>
                      </div>
                      <p className="text-[13px] font-[650] tabular-nums">{p}</p>
                    </div>
                  ))}
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(transparent,var(--sx-surface))]" />
              </div>
            </div>
          </Phone>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 md:mt-0 md:block">
          {calls.map((c) => (
            <div key={c.t} data-m-card className={`max-w-[300px] md:absolute ${c.side}`}>
              <span className={`grid size-11 place-items-center rounded-full border border-[var(--sx-line)] bg-[var(--sx-surface)] text-[var(--sx-accent)] ${c.side.includes("text-right") ? "md:ml-auto" : ""}`}>
                <svg viewBox="0 0 20 20" className="size-5 fill-none stroke-current" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={c.icon} />
                </svg>
              </span>
              <p className="mt-4 text-[18px] font-[650]">{c.t}</p>
              <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--sx-muted)]">{c.d}</p>
            </div>
          ))}
        </div>
      </div>
      <StorePills className="mt-[clamp(32px,4vw,56px)] justify-center" />
    </Sec>
  );
}

/** AP02 · Three fanned phones beside copy: copy + store pills left (5 cols), a fan of three phones right (7 cols): the
 *  centre one upright in front, the side ones smaller, offset up / down behind it, each showing a different screen. */
function AP02() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  return (
    <Sec innerRef={r} theme="ink" font="wide" className="py-[clamp(72px,9vw,140px)]">
      <style>{`
        .ap02-bob{animation:ap02-bob 5s ease-in-out infinite alternate}
        .ap02-bob.b{animation-delay:-2.5s}
        @keyframes ap02-bob{from{translate:0 -10px}to{translate:0 10px}}
        .ap02-ring{animation:ap02-ring 3.6s linear infinite}
        @keyframes ap02-ring{to{stroke-dashoffset:-226}}
        html.is-static .ap02-bob,html.is-static .ap02-ring{animation:none}
        html.is-static {.ap02-bob,.ap02-ring{animation:none}}
      `}</style>
      <div className="grid grid-cols-1 items-center gap-[clamp(40px,5vw,80px)] md:grid-cols-12">
        <div className="md:col-span-5">
          <H className="text-[clamp(44px,5.2vw,88px)]">First in line for every drop.</H>
          <P className="mt-6 max-w-[40ch]">The Stride Club app: enter raffles, track your pair from our Pune warehouse, and spend the points you earn on every run you log.</P>
          <div className="mt-8 grid max-w-[420px] grid-cols-3 gap-4 border-y border-[var(--sx-line)] py-5">
            {[
              ["4.8", "store rating"],
              ["2 min", "to enter a drop"],
              ["₹0", "to join"],
            ].map(([n, l]) => (
              <div key={l}>
                <p className="sx-display text-[clamp(24px,2.2vw,34px)] leading-none">{n}</p>
                <p className="mt-1.5 text-[13px] text-[var(--sx-muted)]">{l}</p>
              </div>
            ))}
          </div>
          <StorePills className="mt-8" />
        </div>
        <div className="relative md:col-span-7">
          <div className="absolute left-1/2 top-1/2 aspect-square w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_38%,transparent),transparent)]" />
          <div className="relative flex items-center justify-center py-[6%]">
            {/* left: order tracking (offset up, behind) */}
            <div data-m-card className="relative z-0 -mr-[8%] w-[clamp(170px,15vw,230px)] -translate-y-[10%] max-md:hidden">
              <div className="ap02-bob">
                <Phone className="opacity-90">
                  <div className="flex h-full flex-col px-4 pt-[22%]">
                    <p className="text-[12px] text-[var(--sx-muted)]">Order #SC-4471</p>
                    <p className="sx-display mt-1 text-[18px] leading-tight">Out for delivery</p>
                    <div className="mt-5 space-y-4">
                      {["Packed in Pune", "Left the warehouse", "In your city", "At your door by 6 pm"].map((s, k) => (
                        <div key={s} className="flex items-center gap-3 text-[12px]">
                          <span className={`size-3 shrink-0 rounded-full ${k < 3 ? "bg-[var(--sx-accent)]" : "border border-[var(--sx-line)]"}`} />
                          <span className={k < 3 ? "" : "text-[var(--sx-muted)]"}>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Phone>
              </div>
            </div>
            {/* centre: the drop (upright, in front) */}
            <div data-m-card className="relative z-10 w-[clamp(220px,19vw,290px)]">
              <Phone>
                <div className="flex h-full flex-col">
                  <div className="relative min-h-0 flex-[1.1] bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_40%,transparent),transparent)]">
                    <Product angle={2} accent="#c8ff4a" className="absolute inset-0 m-auto mt-[16%] h-[78%] w-[78%]" />
                  </div>
                  <div className="px-4 pb-5">
                    <p className="text-[12px] uppercase tracking-[0.14em] text-[var(--sx-accent)]">Raffle closes in 02:14:09</p>
                    <p className="sx-display mt-1.5 text-[19px] leading-tight">Lattice Runner · Lime</p>
                    <div className="mt-2 flex items-center justify-between text-[13px]">
                      <Price now="₹8,490" />
                      <span className="text-[var(--sx-muted)]">1,204 entered</span>
                    </div>
                    <span className="mt-4 block rounded-full bg-[var(--sx-accent)] py-2.5 text-center text-[13px] font-[700] text-[var(--sx-accent-text)]">Enter the draw</span>
                  </div>
                </div>
              </Phone>
            </div>
            {/* right: rewards (offset down, behind) */}
            <div data-m-card className="relative z-0 -ml-[8%] w-[clamp(170px,15vw,230px)] translate-y-[12%] max-md:hidden">
              <div className="ap02-bob b">
                <Phone className="opacity-90">
                  <div className="flex h-full flex-col items-center px-4 pt-[24%] text-center">
                    <p className="text-[12px] text-[var(--sx-muted)]">Your points</p>
                    <div className="relative mt-3 grid size-[72%] place-items-center">
                      <svg viewBox="0 0 80 80" className="absolute inset-0 -rotate-90">
                        <circle cx="40" cy="40" r="36" fill="none" stroke="var(--sx-line)" strokeWidth="5" />
                        <circle className="ap02-ring" cx="40" cy="40" r="36" fill="none" stroke="var(--sx-accent)" strokeWidth="5" strokeDasharray="150 76" strokeLinecap="round" />
                      </svg>
                      <span className="sx-display text-[22px] leading-none">2,460</span>
                    </div>
                    <p className="mt-4 text-[12px] leading-snug text-[var(--sx-muted)]">540 more for a free pair of race socks</p>
                  </div>
                </Phone>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <Btn kind="link">See what&apos;s dropping →</Btn>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "AP01", name: "Centre phone flanked by feature callouts", motion: "M31", C: AP01 },
  { code: "AP02", name: "Three fanned phones beside copy", motion: "M34", C: AP02 },
];
