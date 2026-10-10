"use client";

// PR · Pricing layouts, batch 3 (docs/SECTION-MENU.md). Sample prices in ₹ (concept site).
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { ShimmerButton } from "../fx/more";
import { H, P, Product, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const inr = (n: number) => n.toLocaleString("en-IN");

/** Rolling digits (M48 odometer, live): every digit is a 0–9 column that rolls to its value whenever the number
 *  changes. Columns are keyed from the right, so units stay units when the number grows a digit. */
function Roll({ text, className = "" }: { text: string; className?: string }) {
  const chars = text.split("");
  return (
    <span className={`inline-flex items-baseline tabular-nums ${className}`} aria-label={text}>
      {chars.map((ch, k) => {
        const key = chars.length - k;
        return /\d/.test(ch) ? (
          <span key={`d${key}`} className="relative inline-block h-[1.1em] overflow-hidden leading-[1.1]" aria-hidden>
            <span className="invisible">0</span>
            <span className="absolute left-0 top-0 flex flex-col transition-transform duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)]" style={{ transform: `translateY(-${Number(ch) * 1.1}em)` }}>
              {Array.from({ length: 10 }, (_, j) => (
                <span key={j} className="block h-[1.1em]">
                  {j}
                </span>
              ))}
            </span>
          </span>
        ) : (
          <span key={`c${key}`} aria-hidden>
            {ch}
          </span>
        );
      })}
    </span>
  );
}

const STEPS = [1, 2, 3, 4, 5, 4, 3, 2];
const OURS = 62; // ₹ per cup on the refill plan

/** PR08 · Savings calculator: a cups-per-day slider (auto-drags while on screen) and a café-price input on the left;
 *  a large yearly-savings number rolling on an odometer with a three-line breakdown and CTA on the right. Motion M48. */
function PR08() {
  const r = useRef<HTMLDivElement>(null);
  const [cups, setCups] = useState(2);
  const [cafe, setCafe] = useState(260);
  const touched = useRef(false);

  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    let k = 1;
    let t: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (e.isIntersecting)
        t = setInterval(() => {
          if (touched.current) return;
          k = (k + 1) % STEPS.length;
          setCups(STEPS[k]);
        }, 1100);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, []);

  const year = cups * 365;
  const cafeSpend = year * cafe;
  const ourSpend = year * OURS;
  const save = Math.max(0, cafeSpend - ourSpend);
  const pct = ((cups - 1) / 4) * 100;

  return (
    <Sec innerRef={r} theme="ink" font="wide" className="py-[clamp(72px,9vw,140px)]">
      <div className="grid grid-cols-1 items-stretch gap-[clamp(28px,4vw,64px)] md:grid-cols-12">
        <div className="flex flex-col justify-between md:col-span-6">
          <div>
            <H className="max-w-[12ch] text-[clamp(40px,4.4vw,76px)]">Skip the café queue.</H>
            <P className="mt-6 max-w-[40ch]">Fresh-roasted beans and a brew guide, delivered every fortnight. Move the slider and see what a year of home coffee keeps in your pocket.</P>
          </div>

          <div className="mt-12 border-t border-[var(--sx-line)] pt-8">
            <div className="flex items-end justify-between gap-6">
              <p className="text-[13px] uppercase tracking-[0.16em] text-[var(--sx-muted)]">Cups per day</p>
              <p className="sx-display text-[clamp(44px,4vw,64px)] font-[800] leading-none tabular-nums">
                <Roll text={String(cups)} />
              </p>
            </div>
            {/* custom track + thumb (smooth when it auto-drags), a transparent native range on top for real dragging */}
            <div className="relative mt-6 h-11">
              <div className="absolute inset-x-0 top-1/2 h-[10px] -translate-y-1/2 rounded-full bg-[var(--sx-line)]" />
              <div className="absolute left-0 top-1/2 h-[10px] -translate-y-1/2 rounded-full bg-[var(--sx-accent)] transition-[width] duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)]" style={{ width: `${pct}%` }} />
              <div
                className="absolute top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[var(--sx-accent)] bg-[var(--sx-text)] shadow-[0_0_0_8px_color-mix(in_srgb,var(--sx-accent)_22%,transparent)] transition-[left] duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)]"
                style={{ left: `${pct}%` }}
              />
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={cups}
                aria-label="Cups per day"
                onChange={(e) => {
                  touched.current = true;
                  setCups(Number(e.target.value));
                }}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </div>
            <div className="mt-3 flex justify-between text-[13px] text-[var(--sx-muted)] tabular-nums">
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n}>{n}</span>
              ))}
            </div>
            <label className="mt-8 flex max-w-[380px] items-center justify-between gap-4 rounded-full border border-[var(--sx-line)] py-2 pl-5 pr-2">
              <span className="text-[14px] text-[var(--sx-muted)]">Your café price per cup</span>
              <span className="flex items-center gap-1 rounded-full bg-[var(--sx-surface)] px-4 py-2 text-[16px] tabular-nums">
                ₹
                <input
                  type="number"
                  min={80}
                  max={900}
                  value={cafe}
                  onChange={(e) => setCafe(Math.max(0, Math.min(900, Number(e.target.value) || 0)))}
                  className="w-[4ch] bg-transparent outline-none"
                />
              </span>
            </label>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[var(--sx-radius,18px)] border border-[var(--sx-line)] bg-[var(--sx-surface)] p-[clamp(28px,3.4vw,56px)] md:col-span-6">
          <div className="pointer-events-none absolute inset-0 fx-pan" aria-hidden>
            <div className="fx-drift absolute -right-[20%] -top-[30%] aspect-square w-[90%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_32%,transparent),transparent)]" />
          </div>
          <div className="relative flex h-full flex-col [container-type:inline-size]">
            <p className="text-[13px] uppercase tracking-[0.16em] text-[var(--sx-muted)]">You keep, every year</p>
            {/* sized by the card width (cqw) so the widest value (₹3,61,350 at 5 cups) always fits */}
            <p className="sx-display mt-4 whitespace-nowrap text-[min(88px,12cqw)] font-[800] leading-none tabular-nums text-[var(--sx-accent)]">
              <Roll text={`₹${inr(save)}`} />
            </p>
            <div className="mt-10 space-y-0 border-t border-[var(--sx-line)] text-[15px]">
              {[
                ["Café coffee", `${cups} × 365 × ₹${cafe}`, `₹${inr(cafeSpend)}`],
                ["Home refill plan", `${cups} × 365 × ₹${OURS}`, `₹${inr(ourSpend)}`],
                ["That is", "months of plan, free", `${Math.floor(save / 1890)}`],
              ].map(([k, how, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-4 border-b border-[var(--sx-line)] py-4">
                  <div>
                    <p>{k}</p>
                    <p className="mt-0.5 text-[13px] text-[var(--sx-muted)] tabular-nums">{how}</p>
                  </div>
                  <span className="text-[18px] font-[650] tabular-nums">{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-10">
              <p className="text-[14px] text-[var(--sx-muted)]">Plan from ₹1,890 a month, pause any time.</p>
              <a href="#" onClick={(e) => e.preventDefault()} className="sx-btn sx-btn-solid">
                Start my refills
              </a>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ---------------------------------------------------------------------------------------------------------------- */

const CHECKS = ["24 cans of Batch 001, numbered", "Three flavours: yuzu, guava-chilli, kokum", "Zero sugar, 140 mg natural caffeine", "Founders' enamel pin and sticker sheet", "Free delivery anywhere in India", "Locked price on your next three crates"];
const TRUST = [
  { t: "7-day returns", d: "M4 12a8 8 0 1 0 3-6.2M4 4v4h4" },
  { t: "Ships 2 Dec", d: "M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-.1M17 19a2 2 0 1 0 0-.1" },
  { t: "Secure checkout", d: "M6 10V8a6 6 0 1 1 12 0v2M5 10h14v10H5z" },
];

/** PR09 · Single centred offer card: one ~480px card with a compare-at price, a six-line checklist, a trust row and a
 *  full-width shimmering CTA. Motion M18: the card unfolds from its corner. */
function PR09() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M18");
  return (
    <Sec innerRef={r} theme="paper" font="condensed" className="py-[clamp(72px,9vw,140px)]">
      <style>{`
        @keyframes pr09-spin { to { transform: translate(-50%, -50%) rotate(360deg) } }
        .pr09-halo { animation: pr09-spin 14s linear infinite; }
        html.is-static .pr09-halo { animation: none; }
        html.is-static { .pr09-halo { animation: none; } }
      `}</style>
      <div
        className="pr09-halo pointer-events-none absolute left-1/2 top-[56%] aspect-square w-[min(1100px,90vw)] rounded-full opacity-60 blur-[40px]"
        style={{ transform: "translate(-50%, -50%)", background: "conic-gradient(from 0deg, transparent, color-mix(in srgb, var(--sx-accent) 38%, transparent), transparent 40%, color-mix(in srgb, var(--sx-accent) 24%, transparent) 70%, transparent)" }}
        aria-hidden
      />
      <div className="relative text-center">
        <H className="mx-auto max-w-[16ch] text-[clamp(48px,5.8vw,96px)] uppercase">One crate. First batch.</H>
        <P className="mx-auto mt-5 max-w-[44ch]">Only 2,000 numbered crates of our launch run. When they are gone, Batch 001 is gone.</P>
      </div>

      <article data-m-card className="sx-card relative mx-auto mt-[clamp(36px,4vw,56px)] w-full max-w-[480px] overflow-hidden bg-[var(--sx-surface)] shadow-[0_40px_80px_-40px_rgba(28,24,19,.45)]">
        <div className="relative aspect-[2/1] bg-[radial-gradient(70%_90%_at_50%_100%,color-mix(in_srgb,var(--sx-accent)_40%,transparent),transparent),linear-gradient(180deg,var(--sx-bg),var(--sx-surface))]">
          <Product angle={1} accent="#b5502a" className="fx-drift absolute inset-0 m-auto h-[86%] w-[86%]" />
          <span className="absolute left-4 top-4 rounded-full bg-[var(--sx-accent)] px-3 py-1 text-[12px] font-[650] uppercase tracking-[0.12em] text-[var(--sx-accent-text)]">Pre-order</span>
        </div>
        <div className="p-[clamp(22px,2.4vw,32px)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="sx-display text-[30px] font-[800] uppercase leading-none">Founders&apos; Crate</h3>
              <p className="mt-2 text-[14px] text-[var(--sx-muted)]">Spark energy · 24 × 330 ml</p>
            </div>
            <span className="rounded-full border border-[var(--sx-accent)] px-3 py-1 text-[12px] font-[650] text-[var(--sx-accent)]">Save 14%</span>
          </div>
          <p className="mt-5 flex items-baseline gap-3 tabular-nums">
            <b className="sx-display text-[44px] font-[800] leading-none">₹2,880</b>
            <s className="text-[18px] text-[var(--sx-muted)]">₹3,360</s>
            <span className="text-[13px] text-[var(--sx-muted)]">₹120 a can</span>
          </p>
          <ul className="mt-6 space-y-2.5 border-t border-[var(--sx-line)] pt-5 text-[15px]">
            {CHECKS.map((c) => (
              <li key={c} className="flex items-start gap-3">
                <svg viewBox="0 0 20 20" className="mt-[3px] h-[16px] w-[16px] shrink-0 text-[var(--sx-accent)]" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                  <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {c}
              </li>
            ))}
          </ul>
          <div className="mt-6" style={{ ["--accent" as string]: "var(--sx-accent)" }}>
            <ShimmerButton className="w-full text-[16px]">Pre-order the crate · ₹2,880</ShimmerButton>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 border-t border-[var(--sx-line)] pt-5">
            {TRUST.map((b) => (
              <div key={b.t} className="flex flex-col items-center gap-2 text-center text-[12px] text-[var(--sx-muted)]">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-[var(--sx-text)]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={b.d} />
                </svg>
                {b.t}
              </div>
            ))}
          </div>
        </div>
      </article>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "PR08", name: "Savings calculator", motion: "M48", C: PR08 },
  { code: "PR09", name: "Single centred offer card", motion: "M18", C: PR09 },
];
