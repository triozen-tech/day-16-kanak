"use client";

// PR · Pricing layouts, batch 4 (docs/SECTION-MENU.md). Sample prices for a concept site.
import { useRef } from "react";
import { Btn, H, P, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const TIERS = [
  { name: "Taster", desc: "Two single-origin bags a month, roasted the week they ship.", limit: "2 × 250 g", per: "every month", price: "690", hot: false },
  { name: "Daily Ritual", desc: "Four bags for a household that brews twice a day, with a rotating guest roast.", limit: "4 × 250 g", per: "every month", price: "1,290", hot: true },
  { name: "Home Barista", desc: "Six bags, a tasting card for each, and first pick of the micro-lots.", limit: "6 × 250 g", per: "every month", price: "1,840", hot: false },
  { name: "Café", desc: "Wholesale beans for cafés and offices, with a roast profile set to your machine.", limit: "15 kg", per: "every month", price: "14,800", hot: false },
];

/** PR10 · Stacked horizontal tier rows: centred title; full-width cards stacked top to bottom, each a row of
 *  name + description | a vertical rule + the limit | price + button; a muted note box below.
 *  Motion M3: rows rise in and the prices count up; a light sweeps the featured row. */
function PR10() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M3");
  return (
    <Sec innerRef={r} theme="stone" font="wide" className="py-[clamp(72px,9vw,140px)]">
      <style>{`
        @keyframes pr10-sweep { from { transform: translateX(-120%) } to { transform: translateX(320%) } }
        .pr10-sweep { animation: pr10-sweep 2.6s linear infinite; }
        @keyframes pr10-dot { 0%,100% { opacity: 1 } 50% { opacity: .25 } }
        .pr10-dot { animation: pr10-dot 1.2s ease-in-out infinite; }
        html.is-static .pr10-sweep, html.is-static .pr10-dot { animation: none; opacity: 0; }
        html.is-static .pr10-dot { opacity: 1; }
        html.is-static { .pr10-sweep, .pr10-dot { animation: none; } .pr10-sweep { opacity: 0; } }
      `}</style>
      <div className="mx-auto max-w-[900px] text-center">
        <H className="text-[clamp(40px,4.8vw,78px)]">Fresh beans, on a schedule.</H>
        <P className="mx-auto mt-5 max-w-[46ch]">Pick how much you brew. Pause, skip or switch roasts from your account any month.</P>
      </div>

      <div className="mx-auto mt-[clamp(40px,5vw,72px)] flex max-w-[1180px] flex-col gap-[clamp(10px,1vw,14px)]">
        {TIERS.map((t) => (
          <div
            key={t.name}
            data-m-card
            className={`relative grid grid-cols-1 items-center gap-6 overflow-hidden rounded-[var(--sx-radius)] border p-[clamp(22px,2.4vw,36px)] md:grid-cols-[minmax(0,1fr)_200px_auto] md:gap-[clamp(24px,3vw,48px)] ${t.hot ? "border-transparent bg-[var(--sx-text)] text-[var(--sx-bg)]" : "border-[var(--sx-line)] bg-[var(--sx-surface)]"}`}
          >
            {t.hot && <div className="pr10-sweep pointer-events-none absolute inset-y-0 left-0 w-[30%] bg-[linear-gradient(100deg,transparent,color-mix(in_srgb,var(--sx-accent)_55%,transparent),transparent)]" />}
            <div className="relative min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="sx-display text-[clamp(22px,2vw,32px)] font-[700] leading-none tracking-[-0.01em]">{t.name}</h3>
                {t.hot && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-[var(--sx-accent)] px-3 py-1 text-[12px] font-[650] text-[var(--sx-accent-text)]">
                    <span className="pr10-dot h-1.5 w-1.5 rounded-full bg-current" />
                    Most chosen
                  </span>
                )}
              </div>
              <p className={`mt-3 max-w-[52ch] text-[15px] leading-relaxed ${t.hot ? "opacity-70" : "text-[var(--sx-muted)]"}`}>{t.desc}</p>
            </div>
            <div className={`relative md:border-l md:pl-[clamp(24px,3vw,48px)] ${t.hot ? "md:border-white/20" : "md:border-[var(--sx-line)]"}`}>
              <p className="text-[clamp(20px,1.6vw,26px)] font-[650] tabular-nums">{t.limit}</p>
              <p className={`mt-1 text-[14px] ${t.hot ? "opacity-65" : "text-[var(--sx-muted)]"}`}>{t.per}</p>
            </div>
            <div className="relative flex flex-wrap items-center gap-x-6 gap-y-3 md:justify-end">
              <p className="sx-display whitespace-nowrap text-[clamp(30px,2.8vw,44px)] font-[700] leading-none tabular-nums">
                ₹<span data-m-num>{t.price}</span>
                <span className={`ml-1 text-[14px] font-[500] ${t.hot ? "opacity-65" : "text-[var(--sx-muted)]"}`}>/mo</span>
              </p>
              <Btn kind={t.hot ? "solid" : "ghost"}>{t.hot ? "Start brewing" : "Choose"}</Btn>
            </div>
          </div>
        ))}

        <div data-m-card className="mt-[clamp(10px,1.4vw,20px)] flex flex-wrap items-center justify-between gap-4 rounded-[var(--sx-radius)] bg-[color-mix(in_srgb,var(--sx-text)_6%,transparent)] px-[clamp(22px,2.4vw,36px)] py-5">
          <p className="text-[15px] text-[var(--sx-muted)]">Free delivery on every plan · grind it your way · first bag ships within 48 hours.</p>
          <Btn kind="link">Gift a subscription →</Btn>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "PR10", name: "Stacked horizontal tier rows", motion: "M3", C: PR10 }];
