"use client";

// PR · Pricing layouts, batch 2 (docs/SECTION-MENU.md). Sample prices in ₹ (concept site).
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const BASE = { name: "The Roaster's Box", line: "Two 250 g bags, chosen fresh each month", price: 1200 };
const ADDONS = [
  { name: "Third bag of the month", line: "250 g, a wild-card single origin", price: 540, pic: 0 },
  { name: "Hand grinder", line: "Ceramic burr, 30 click settings", price: 2400, pic: 1 },
  { name: "Glass pour-over set", line: "Dripper, carafe and 100 filters", price: 1650, pic: 3 },
  { name: "Cold brew kit", line: "1 L bottle and four steep bags", price: 890, pic: 2 },
  { name: "Tasting notebook", line: "Cupping wheel and 60 log pages", price: 350, pic: 1 },
  { name: "Gift wrap and card", line: "Hand-stamped, with your note", price: 150, pic: 0 },
];
// scripted hands-free toggles: build up the box, take one thing back out, add another
const START = [true, false, true, false, false, false];
const START_TOTAL = BASE.price + ADDONS.reduce((s, a, k) => s + (START[k] ? a.price : 0), 0);
const SCRIPT = [1, 3, 4, 1, 5, 2, 3, 4, 2, 5, 0, 0];
const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/** PR07 · Build-your-box add-ons + sticky total: add-on rows with toggles (7/12), a sticky summary whose total counts as items toggle (5/12). */
function PR07() {
  const r = useRef<HTMLDivElement>(null);
  const totalEl = useRef<HTMLSpanElement>(null);
  const shown = useRef(0);
  useSectionMotion(r, "M34");
  const [on, setOn] = useState<boolean[]>(START);
  const total = BASE.price + ADDONS.reduce((s, a, k) => s + (on[k] ? a.price : 0), 0);

  // hands-free: toggle the next add-on in the script every 1.7 s while on screen
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    let step = 0;
    let t: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (e.isIntersecting)
        t = setInterval(() => {
          const k = SCRIPT[step++ % SCRIPT.length];
          setOn((o) => o.map((v, j) => (j === k ? !v : v)));
        }, 1700);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, []);

  // the total counts from the old value to the new one
  useEffect(() => {
    const n = totalEl.current;
    if (!n) return;
    if (prefersReducedMotion() || !shown.current) {
      shown.current = total;
      n.textContent = inr(total);
      return;
    }
    const o = { v: shown.current };
    const tw = gsap.to(o, { v: total, duration: 0.9, ease: "power3.out", onUpdate: () => (n.textContent = inr(o.v)), onComplete: () => void (shown.current = total) });
    return () => {
      tw.kill();
      shown.current = o.v;
    };
  }, [total]);

  const picked = ADDONS.filter((_, k) => on[k]);
  return (
    <Sec innerRef={r} theme="paper" font="wide" className="overflow-clip! py-[clamp(72px,9vw,140px)]">
      <div className="grid grid-cols-1 items-start gap-[clamp(32px,4vw,72px)] md:grid-cols-12">
        <div className="min-w-0 md:col-span-7">
          <H className="max-w-[14ch] text-[clamp(38px,4.6vw,76px)]">Build the box you&apos;ll open daily.</H>
          <P className="mt-5 max-w-[46ch]">Start with two fresh bags a month, then add the gear. Pause, skip or change it any time.</P>

          <div className="mt-[clamp(32px,4vw,56px)] border-t border-[var(--sx-line)]">
            <div className="flex items-center gap-5 border-b border-[var(--sx-line)] py-5">
              <Pic i={2} ratio="1/1" className="w-[clamp(56px,5vw,76px)] shrink-0" round />
              <div className="min-w-0 flex-1">
                <p className="text-[17px] font-[650]">{BASE.name}</p>
                <p className="text-[14px] text-[var(--sx-muted)]">{BASE.line}</p>
              </div>
              <span className="text-[16px] tabular-nums">{inr(BASE.price)}/mo</span>
              <span className="w-[52px] text-right text-[12px] uppercase tracking-[0.12em] text-[var(--sx-muted)]">Base</span>
            </div>
            {ADDONS.map((a, k) => (
              <div key={a.name} data-m-card className={`flex items-center gap-5 border-b border-[var(--sx-line)] py-5 transition-colors duration-500 ${on[k] ? "" : "opacity-80"}`}>
                <Pic i={a.pic} ratio="1/1" className="w-[clamp(56px,5vw,76px)] shrink-0" round />
                <div className="min-w-0 flex-1">
                  <p className="text-[17px] font-[650]">{a.name}</p>
                  <p className="text-[14px] text-[var(--sx-muted)]">{a.line}</p>
                </div>
                <span className="text-[16px] tabular-nums">+{inr(a.price)}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on[k]}
                  aria-label={`Add ${a.name}`}
                  onClick={() => setOn((o) => o.map((v, j) => (j === k ? !v : v)))}
                  className={`relative h-[30px] w-[52px] shrink-0 rounded-full border transition-colors duration-300 ${on[k] ? "border-transparent bg-[var(--sx-accent)]" : "border-[var(--sx-line)] bg-[var(--sx-surface)]"}`}
                >
                  <span className={`absolute top-[3px] h-[22px] w-[22px] rounded-full shadow-sm transition-all duration-300 ${on[k] ? "left-[25px] bg-[var(--sx-accent-text)]" : "left-[3px] bg-[color-mix(in_srgb,var(--sx-text)_35%,transparent)]"}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <aside data-m-card className="sx-card relative isolate overflow-hidden p-[clamp(24px,2.6vw,40px)] md:sticky md:top-[clamp(24px,8vh,96px)] md:col-span-5">
          <div className="pointer-events-none absolute inset-0 -z-10 fx-pan" aria-hidden>
            <div className="fx-drift absolute -right-[20%] -top-[30%] aspect-square w-[90%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_22%,transparent),transparent)]" />
          </div>
          <p className="text-[14px] text-[var(--sx-muted)]">Your box, every month</p>
          <p className="sx-display mt-3 text-[clamp(52px,5.4vw,92px)] font-[800] leading-none tracking-[-0.03em] tabular-nums">
            <span ref={totalEl}>{inr(START_TOTAL)}</span>
          </p>
          <p className="mt-2 text-[14px] text-[var(--sx-muted)]">Free delivery · cancel any time</p>
          <ul className="mt-8 space-y-3 border-t border-[var(--sx-line)] pt-6 text-[15px]">
            <li className="flex justify-between gap-4">
              <span>{BASE.name}</span>
              <span className="tabular-nums">{inr(BASE.price)}</span>
            </li>
            {picked.map((a) => (
              <li key={a.name} className="pr07-in flex justify-between gap-4">
                <span>{a.name}</span>
                <span className="tabular-nums text-[var(--sx-muted)]">+{inr(a.price)}</span>
              </li>
            ))}
          </ul>
          <style>{`
            @keyframes pr07-in { from { opacity: 0; transform: translateX(-12px) } to { opacity: 1; transform: none } }
            .pr07-in { animation: pr07-in .45s ease-out both; }
            html.is-static .pr07-in { animation: none; }
          `}</style>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Btn>Checkout · {picked.length + 1} items</Btn>
            <Btn kind="link">Gift it instead →</Btn>
          </div>
        </aside>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "PR07", name: "Build-your-box add-ons + sticky total", motion: "M34", C: PR07 }];
