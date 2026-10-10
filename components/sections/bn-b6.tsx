"use client";

// BN · Bento layouts, batch 6 (docs/SECTION-MENU.md): BN12 an oversized canvas of small live-UI cards, far wider than
// the screen and cut by both page edges; its seven uneven columns drift against each other (M32) and keep breathing
// on their own while on screen. ?static=1 shows the canvas still, tops aligned.
import { useRef } from "react";
import { Btn, H, P, Price, Sec, Stars } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const CSS = `.bn6col{animation:bn6y var(--d) linear infinite alternate}
.bn6col.rev{animation-direction:alternate-reverse}
@keyframes bn6y{from{translate:0 calc(var(--a) * -1)}to{translate:0 var(--a)}}
.bn6glow{animation:bn6g 9s linear infinite alternate}
@keyframes bn6g{from{translate:-38% -10%}to{translate:38% 12%}}
.bn6bar{transform-origin:bottom;animation:bn6b 2.6s ease-in-out infinite alternate}
@keyframes bn6b{from{scale:1 .55}to{scale:1 1}}
.bn6dot{animation:bn6p 1.4s ease-out infinite}
@keyframes bn6p{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--sx-accent) 60%,transparent)}100%{box-shadow:0 0 0 12px transparent}}
html.is-static .bn6col,html.is-static .bn6glow,html.is-static .bn6bar,html.is-static .bn6dot{animation:none}
html.is-static {.bn6col,.bn6glow,.bn6bar,.bn6dot{animation:none}}`;

type Card =
  | { k: "review"; q: string; who: string; n?: number }
  | { k: "price"; name: string; size: string; now: string; was?: string }
  | { k: "chart"; t: string; big: string; bars: number[] }
  | { k: "alert"; t: string; d: string; cta: string }
  | { k: "form"; t: string }
  | { k: "list"; t: string; rows: [string, string][] }
  | { k: "stat"; big: string; d: string }
  | { k: "track"; id: string; step: number };

const COLS: Card[][] = [
  [
    { k: "review", q: "My skin stopped feeling tight by the second week.", who: "Ira Menon" },
    { k: "price", name: "Barrier Serum", size: "30 ml", now: "₹1,190" },
    { k: "chart", t: "Redness, 4 weeks", big: "−28%", bars: [80, 72, 66, 58, 54, 49] },
    { k: "alert", t: "Back in stock", d: "Ceramide Night Cream", cta: "Notify me" },
  ],
  [
    { k: "form", t: "Find your routine" },
    { k: "list", t: "In the Barrier Serum", rows: [["Ceramide NP", "3%"], ["Niacinamide", "5%"], ["Panthenol", "2%"], ["Squalane", "4%"]] },
    { k: "review", q: "Light enough for Chennai summers. No shine by noon.", who: "Kabir Shah", n: 4 },
    { k: "stat", big: "4.8 ★", d: "average from 12,400 reviews" },
  ],
  [
    { k: "chart", t: "Hydration, 8 weeks", big: "+41%", bars: [30, 38, 46, 52, 61, 70, 76, 84] },
    { k: "alert", t: "UV index 9 today", d: "Reapply SPF 50 at 1 pm", cta: "Set reminder" },
    { k: "price", name: "Daily Shield SPF 50", size: "50 ml", now: "₹849", was: "₹990" },
    { k: "review", q: "The first sunscreen my teenager actually wears.", who: "Meera Pillai" },
    { k: "track", id: "DW-2841", step: 2 },
  ],
  [
    { k: "stat", big: "92%", d: "felt softer skin in 7 days (panel of 210)" },
    { k: "review", q: "Fragrance-free and it still feels like a treat.", who: "Rohan Varma" },
    { k: "chart", t: "Repeat orders", big: "3 in 5", bars: [42, 50, 48, 63, 70, 74] },
    { k: "price", name: "Ceramide Night Cream", size: "50 g", now: "₹1,450" },
  ],
  [
    { k: "list", t: "Your AM routine", rows: [["Cleanse", "Gel wash"], ["Treat", "Barrier Serum"], ["Protect", "SPF 50"]] },
    { k: "track", id: "DW-2907", step: 1 },
    { k: "review", q: "Calmed my retinol flare-ups within days.", who: "Anaya Rao" },
    { k: "form", t: "Ask our chemist" },
  ],
  [
    { k: "alert", t: "Subscribe and save", d: "10% off every refill", cta: "Start" },
    { k: "chart", t: "Breakouts, 6 weeks", big: "−35%", bars: [74, 66, 60, 51, 45, 40] },
    { k: "price", name: "Gel Cleanser", size: "150 ml", now: "₹590" },
    { k: "review", q: "Packaging is plastic-free. Small thing, big deal.", who: "Dev Malhotra" },
    { k: "stat", big: "0", d: "fragrance, alcohol or dyes" },
  ],
  [
    { k: "review", q: "Bought one, now the whole family shares the shelf.", who: "Sana Qureshi" },
    { k: "stat", big: "48 h", d: "moisture lock in lab tests" },
    { k: "list", t: "Ships today", rows: [["Mumbai", "by 9 pm"], ["Pune", "tomorrow"], ["Delhi", "tomorrow"]] },
    { k: "price", name: "Travel Trio", size: "3 × 15 ml", now: "₹999" },
  ],
];

const box = "sx-card relative overflow-hidden bg-[var(--sx-surface)] p-5";

function Tile({ c, i }: { c: Card; i: number }) {
  switch (c.k) {
    case "review":
      return (
        <div className={box}>
          <Stars n={c.n ?? 5} />
          <p className="mt-3 text-[16px] leading-snug">&ldquo;{c.q}&rdquo;</p>
          <p className="mt-4 text-[13px] text-[var(--sx-muted)]">{c.who} · verified buyer</p>
        </div>
      );
    case "price":
      return (
        <div className={`${box} flex items-center gap-4`}>
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[12px] bg-[color-mix(in_srgb,var(--sx-accent)_16%,var(--sx-bg))]">
            <span className="h-10 w-5 rounded-[6px] bg-[var(--sx-accent)]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-[650]">{c.name}</p>
            <p className="text-[13px] text-[var(--sx-muted)]">{c.size}</p>
          </div>
          <div className="text-right">
            <Price now={c.now} was={c.was} className="text-[15px]" />
            <p className="mt-1 text-[13px] font-[650] text-[var(--sx-accent)]">Add +</p>
          </div>
        </div>
      );
    case "chart":
      return (
        <div className={box}>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[13px] text-[var(--sx-muted)]">{c.t}</p>
            <p className="sx-display text-[28px] font-[750] leading-none">{c.big}</p>
          </div>
          <div className="mt-5 flex h-[96px] items-end gap-2">
            {c.bars.map((b, k) => (
              <span key={k} className="bn6bar flex-1 rounded-t-[5px] bg-[var(--sx-accent)]" style={{ height: `${b}%`, opacity: 0.35 + (k / c.bars.length) * 0.65, animationDelay: `${-(k * 0.33 + i * 0.5)}s` }} />
            ))}
          </div>
        </div>
      );
    case "alert":
      return (
        <div className={`${box} flex items-center gap-4 border-[color-mix(in_srgb,var(--sx-accent)_45%,transparent)]`}>
          <span className="bn6dot h-3 w-3 shrink-0 rounded-full bg-[var(--sx-accent)]" />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-[650]">{c.t}</p>
            <p className="text-[13px] text-[var(--sx-muted)]">{c.d}</p>
          </div>
          <span className="shrink-0 rounded-full border border-[var(--sx-line)] px-3 py-1.5 text-[13px] font-[600]">{c.cta}</span>
        </div>
      );
    case "form":
      return (
        <div className={box}>
          <p className="text-[17px] font-[650]">{c.t}</p>
          <p className="mt-3 text-[13px] text-[var(--sx-muted)]">Skin type</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {["Dry", "Oily", "Combination", "Sensitive"].map((t, k) => (
              <span key={t} className={`rounded-full px-3 py-1.5 text-[13px] ${k === 2 ? "bg-[var(--sx-text)] text-[var(--sx-bg)]" : "border border-[var(--sx-line)]"}`}>
                {t}
              </span>
            ))}
          </div>
          <div className="mt-4 rounded-[10px] border border-[var(--sx-line)] px-3 py-2.5 text-[14px] text-[var(--sx-muted)]">you@studio.example</div>
          <span className="mt-3 block rounded-full bg-[var(--sx-accent)] py-2.5 text-center text-[14px] font-[650] text-[var(--sx-accent-text)]">Send my plan</span>
        </div>
      );
    case "list":
      return (
        <div className={box}>
          <p className="text-[15px] font-[650]">{c.t}</p>
          <ul className="mt-3 divide-y divide-[var(--sx-line)]">
            {c.rows.map(([a, b]) => (
              <li key={a} className="flex justify-between gap-3 py-2 text-[14px]">
                <span>{a}</span>
                <span className="tabular-nums text-[var(--sx-muted)]">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    case "stat":
      return (
        <div className={`${box} bg-[var(--sx-text)]! text-[var(--sx-bg)]`}>
          <p className="sx-display text-[48px] font-[800] leading-none tracking-[-0.03em]">{c.big}</p>
          <p className="mt-2 text-[14px] opacity-70">{c.d}</p>
        </div>
      );
    case "track":
      return (
        <div className={box}>
          <div className="flex justify-between text-[13px]">
            <span className="font-[650]">Order {c.id}</span>
            <span className="text-[var(--sx-muted)]">{["Packed", "Shipped", "Out for delivery"][c.step]}</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-1.5">
            {[0, 1, 2].map((s) => (
              <span key={s} className={`h-2 rounded-full ${s <= c.step ? "bg-[var(--sx-accent)]" : "bg-[var(--sx-line)]"}`} />
            ))}
          </div>
        </div>
      );
  }
}

/** BN12 · A 7-column wall of ~380px live-UI cards, about 2780px wide and centred so both outer columns are cut by the page edges. */
function BN12() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M32");
  return (
    <Sec innerRef={r} theme="stone" font="grotesk" full className="py-[clamp(72px,9vw,140px)]">
      <style>{CSS}</style>
      <div className="grid grid-cols-1 items-end gap-[clamp(24px,4vw,64px)] px-[clamp(20px,5vw,96px)] md:grid-cols-12">
        <H className="text-[clamp(44px,5.6vw,96px)] md:col-span-7">Twelve thousand small proofs.</H>
        <div className="md:col-span-5 md:pb-2">
          <P className="max-w-[40ch]">Lab results, routines, restocks and real reviews for Dewline skincare, all on one wall. Every card is something a customer asked us.</P>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Btn>Build my routine</Btn>
            <Btn kind="link">Read the lab notes →</Btn>
          </div>
        </div>
      </div>

      <div className="relative mt-[clamp(40px,5vw,72px)] overflow-hidden border-y border-[var(--sx-line)] bg-[color-mix(in_srgb,var(--sx-text)_5%,var(--sx-bg))] py-[clamp(36px,4vw,64px)]">
        <div aria-hidden className="bn6glow pointer-events-none absolute left-1/2 top-1/2 -ml-[45vw] -mt-[30vh] h-[60vh] w-[90vw] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_42%,transparent),transparent)]" />
        <div className="relative left-1/2 ml-[-1390px] grid w-[2780px] grid-cols-[repeat(7,380px)] items-start gap-5">
          {COLS.map((col, c) => (
            <div key={c} data-m-col>
              <div className={`bn6col flex flex-col gap-4 ${c % 2 ? "rev" : ""}`} style={{ ["--d" as string]: `${5 + (c % 3) * 1.3}s`, ["--a" as string]: `${18 + (c % 4) * 6}px` }}>
                {col.map((card, k) => (
                  <Tile key={k} c={card} i={c * 5 + k} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-[8vw] bg-[linear-gradient(90deg,color-mix(in_srgb,var(--sx-text)_5%,var(--sx-bg)),transparent)]" />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-[8vw] bg-[linear-gradient(270deg,color-mix(in_srgb,var(--sx-text)_5%,var(--sx-bg)),transparent)]" />
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "BN12", name: "Oversized canvas cropped by the viewport", motion: "M32", C: BN12 }];
