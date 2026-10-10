"use client";

// ST · Story / stats layouts, batch 6 (docs/SECTION-MENU.md): ST14 a growth headline beside a 2×2 grid of metric
// cards that snap in and count up (M3), ST15 three horizontal "rails" carrying partner chips like stations on a line,
// the middle rail glowing under soft light rays (M61). Both keep a large CSS loop running; ?static=1 shows final values.
import { useRef } from "react";
import { LightRays } from "../fx/more";
import { Btn, H, P, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const CSS = `.st6glow{animation:st6g 8.5s linear infinite alternate}
@keyframes st6g{from{translate:-25% -15%}to{translate:25% 20%}}
.st6spark{stroke-dasharray:240;animation:st6d 3.2s linear infinite}
@keyframes st6d{from{stroke-dashoffset:240}to{stroke-dashoffset:-240}}
.st6rail{animation:st6r var(--d) linear infinite alternate}
@keyframes st6r{from{translate:calc(var(--a) * -1) 0}to{translate:var(--a) 0}}
.st6run{animation:st6x 3.6s linear infinite}
@keyframes st6x{from{left:-20%}to{left:100%}}
.st6ring{animation:st6spin 9s linear infinite}
@keyframes st6spin{from{rotate:0deg}to{rotate:360deg}}
html.is-static .st6glow,html.is-static .st6spark,html.is-static .st6rail,html.is-static .st6run,html.is-static .st6ring{animation:none}
html.is-static {.st6glow,.st6spark,.st6rail,.st6run,.st6ring{animation:none}}`;

/* ───────────────────────────── ST14 · Split headline + metric card grid ───────────────────────────── */

const METRICS = [
  { n: "2,40,000", l: "monthly subscribers, up from 300 in 2019", ic: "M4 18h16M6 18V9l6-4 6 4v9M10 18v-5h4v5", line: "M2 34 L20 30 L38 31 L56 22 L74 20 L92 12 L110 6" },
  { n: "40", l: "cities with next-morning delivery", ic: "M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z", line: "M2 32 L20 32 L38 26 L56 26 L74 18 L92 14 L110 8" },
  { n: "64%", l: "of customers reorder within six weeks", ic: "M4 12a8 8 0 0 1 14-5l2-2v6h-6l2-2a5 5 0 1 0 1 6", line: "M2 28 L20 24 L38 27 L56 19 L74 21 L92 13 L110 10" },
  { n: "4.9", l: "average rating across 18,600 reviews", ic: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z", line: "M2 20 L20 18 L38 17 L56 16 L74 14 L92 13 L110 12" },
];

/** ST14 · Left 5/12 headline + growth story; right 7/12 a 2×2 grid of metric cards (icon, number, label) that count up. */
function ST14() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M3");
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <style>{CSS}</style>
      <div aria-hidden className="st6glow pointer-events-none absolute right-[5%] top-[5%] h-[90%] w-[60%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_36%,transparent),transparent)]" />
      <div className="relative grid grid-cols-1 items-center gap-[clamp(40px,5vw,88px)] md:grid-cols-12">
        <div className="md:col-span-5">
          <H className="text-[clamp(44px,5vw,84px)]">From one roaster to forty cities.</H>
          <P className="mt-6 max-w-[40ch]">Hillmoor started with a five-kilo drum in a Coorg garage. Six years on, we still roast every bag to order, just a few more of them.</P>
          <div className="mt-9 flex flex-wrap items-center gap-5">
            <Btn>Start a subscription</Btn>
            <Btn kind="link">Our story →</Btn>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-[clamp(12px,1.4vw,20px)] sm:grid-cols-2 md:col-span-7">
          {METRICS.map((m, k) => (
            <div key={m.n} data-m-card className={`sx-card @container relative overflow-hidden p-[clamp(22px,2.4vw,34px)] ${k === 1 ? "bg-[var(--sx-accent)]! text-[var(--sx-accent-text)]" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <span className={`grid h-11 w-11 place-items-center rounded-full ${k === 1 ? "bg-white/20" : "bg-[color-mix(in_srgb,var(--sx-accent)_14%,transparent)] text-[var(--sx-accent)]"}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" aria-hidden>
                    <path d={m.ic} />
                  </svg>
                </span>
                <svg width="112" height="40" viewBox="0 0 112 40" fill="none" aria-hidden className="opacity-80">
                  <path d={m.line} stroke="currentColor" strokeOpacity=".18" strokeWidth="2" />
                  <path d={m.line} className="st6spark" stroke={k === 1 ? "currentColor" : "var(--sx-accent)"} strokeWidth="2.5" strokeLinecap="round" style={{ animationDelay: `${-k * 0.8}s` }} />
                </svg>
              </div>
              <p data-m-num className="sx-display mt-[clamp(28px,3vw,48px)] text-[min(18cqw,88px)] font-[600] leading-none tabular-nums">{m.n}</p>
              <p className={`mt-3 max-w-[26ch] text-[15px] leading-snug ${k === 1 ? "opacity-85" : "text-[var(--sx-muted)]"}`}>{m.l}</p>
            </div>
          ))}
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────────── ST15 · Chip rails (network lines) ───────────────────────────── */

const RAILS: { chips: [string, string][]; d: string; a: string }[] = [
  { chips: [["Mist Valley", "Darjeeling"], ["Kurseong Ridge", "Darjeeling"], ["Teesta Bend", "Kalimpong"]], d: "5.2s", a: "54px" },
  { chips: [["Nilgiri Blue", "Coonoor"], ["Munnar High", "Idukki"]], d: "4.1s", a: "30px" },
  { chips: [["Upper Assam", "Dibrugarh"], ["Kangra Hills", "Palampur"], ["Sikkim Terraces", "Ravangla"]], d: "6.3s", a: "48px" },
];

const Chip = ({ n, p }: { n: string; p: string }) => (
  <span className="flex shrink-0 items-center gap-2.5 rounded-full border border-[var(--sx-line)] bg-[var(--sx-surface)] py-2 pl-2 pr-4 shadow-[0_16px_30px_-18px_rgba(0,0,0,.7)]">
    <span className="grid h-7 w-7 place-items-center rounded-full bg-[color-mix(in_srgb,var(--sx-accent)_22%,transparent)] text-[var(--sx-accent)]">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14zM5 19l7-7" />
      </svg>
    </span>
    <span className="whitespace-nowrap text-[14px] font-[650]">{n}</span>
    <span className="whitespace-nowrap text-[13px] text-[var(--sx-muted)]">{p}</span>
  </span>
);

/** ST15 · A narrow centred block of three horizontal hairlines carrying partner chips; the middle one glows round a dashed-ring centre chip. Title, text, button below. */
function ST15() {
  return (
    <Sec theme="ink" font="grotesk" className="py-[clamp(72px,9vw,140px)]" style={{ ["--accent" as string]: "var(--sx-accent)" }}>
      <style>{CSS}</style>
      <LightRays className="absolute inset-0 opacity-70" count={7} />
      <div aria-hidden className="st6glow pointer-events-none absolute left-[25%] top-[12%] h-[56%] w-[50%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_40%,transparent),transparent)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(180deg,transparent,var(--sx-bg))]" />
      <div className="relative mx-auto max-w-[920px]">
        <div className="flex flex-col gap-[clamp(28px,3.4vw,48px)] [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
          {RAILS.map((rail, k) => {
            const mid = k === 1;
            return (
              <div key={k} className="relative flex h-[64px] items-center">
                <span className={`absolute inset-x-0 top-1/2 h-px ${mid ? "bg-[linear-gradient(90deg,transparent,var(--sx-accent),transparent)]" : "bg-[var(--sx-line)]"}`} />
                {mid && (
                  <>
                    <span className="absolute inset-x-0 top-1/2 h-[18px] -translate-y-1/2 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,color-mix(in_srgb,var(--sx-accent)_45%,transparent),transparent)] blur-[6px]" />
                    <span className="st6run absolute top-1/2 h-[6px] w-[20%] -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--sx-accent)_90%,white),transparent)] blur-[2px]" />
                  </>
                )}
                {mid ? (
                  <div className="relative flex w-full items-center justify-between">
                    <div className={`st6rail`} style={{ ["--d" as string]: rail.d, ["--a" as string]: rail.a }}>
                      <Chip n={rail.chips[0][0]} p={rail.chips[0][1]} />
                    </div>
                    <div className="relative grid h-[88px] w-[88px] place-items-center">
                      <span className="st6ring absolute inset-0 rounded-full border-2 border-dashed border-[color-mix(in_srgb,var(--sx-accent)_70%,transparent)]" />
                      <span className="grid h-[64px] w-[64px] place-items-center rounded-full bg-[var(--sx-accent)] text-[var(--sx-accent-text)] shadow-[0_0_40px_color-mix(in_srgb,var(--sx-accent)_60%,transparent)]">
                        <span className="sx-display text-[22px] font-[800] leading-none">N9</span>
                      </span>
                    </div>
                    <div className="st6rail" style={{ ["--d" as string]: rail.d, ["--a" as string]: rail.a, animationDirection: "alternate-reverse" }}>
                      <Chip n={rail.chips[1][0]} p={rail.chips[1][1]} />
                    </div>
                  </div>
                ) : (
                  <div className={`st6rail relative flex w-full items-center justify-around`} style={{ ["--d" as string]: rail.d, ["--a" as string]: rail.a, animationDirection: k ? "alternate-reverse" : "alternate" }}>
                    {rail.chips.map(([n, p]) => (
                      <Chip key={n} n={n} p={p} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mx-auto mt-[clamp(48px,6vw,88px)] max-w-[640px] text-center">
          <H className="text-[clamp(40px,4.6vw,76px)]">Eight gardens, one tin.</H>
          <P className="mx-auto mt-5 max-w-[46ch]">Ninefold buys whole-leaf tea straight from eight family estates, from Darjeeling to the Nilgiris, and pays them before the harvest.</P>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Btn>Meet the growers</Btn>
            <Btn kind="ghost">Taster tin · ₹690</Btn>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "ST14", name: "Split headline + metric card grid", motion: "M3", C: ST14 },
  { code: "ST15", name: "Chip rails (network lines)", motion: "M61", C: ST15 },
];
