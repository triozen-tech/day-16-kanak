"use client";

// PR · Pricing layouts, batch 7 (docs/SECTION-MENU.md): PR14 a centred title over a vertical stack of full-width plan
// rows (radio dot, plan name + saving badge left, price a month right). The selection steps down the list by itself
// while on screen; one CTA under the list follows it. ?static=1 holds the recommended plan.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const CSS = `.pr7glow{animation:pr7gx 6.6s linear infinite alternate,pr7gs 3.9s ease-in-out infinite alternate}
@keyframes pr7gx{from{translate:-34% -4%}to{translate:34% 8%}}@keyframes pr7gs{from{scale:.8}to{scale:1.22}}
.pr7in{animation:pr7in .55s cubic-bezier(.2,.7,.2,1) both}@keyframes pr7in{from{opacity:0;translate:0 10px}to{opacity:1;translate:0 0}}
html.is-static .pr7glow,html.is-static .pr7in{animation:none}
html.is-static {.pr7glow,.pr7in{animation:none}}`;

const PLANS = [
  { k: "Monthly", save: "", price: "₹3,400", note: "Billed every month · cancel anytime", total: "₹3,400" },
  { k: "Quarterly", save: "Save 10%", price: "₹3,060", note: "Billed ₹9,180 every 3 months", total: "₹9,180" },
  { k: "Half-yearly", save: "Save 15%", price: "₹2,890", note: "Billed ₹17,340 every 6 months", total: "₹17,340" },
  { k: "Annual", save: "Save 20%", price: "₹2,720", note: "Billed ₹32,640 a year · 2 guest passes a month", total: "₹32,640" },
];
const START = 3;

/** PR14 · Centred title, a stack of plan rows with radio dots (max 640px), one CTA under the list. */
function PR14() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const [i, setI] = useState(START);
  const [live, setLive] = useState(false);
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    setLive(true);
    let t: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (e.isIntersecting) t = setInterval(() => setI((v) => (v + 1) % PLANS.length), 1700);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, []);
  const p = PLANS[i];
  return (
    <Sec innerRef={r} theme="ink" font="wide" className="py-[clamp(72px,9vw,140px)]">
      <style>{CSS}</style>
      <span aria-hidden className="pr7glow pointer-events-none absolute left-1/2 top-[30%] -ml-[30%] h-[60%] w-[60%] rounded-full blur-[90px]" style={{ background: "radial-gradient(closest-side, color-mix(in srgb, var(--sx-accent) 45%, transparent), transparent)" }} />
      <div className="relative z-10 mx-auto max-w-[760px] text-center">
        <H className="text-[clamp(40px,4.6vw,76px)]">Train on your terms.</H>
        <P className="mx-auto mt-5 max-w-[46ch]">Every plan opens all three Forge clubs, open 5 am to 11 pm, with classes, sauna and a coach check-in each month.</P>
      </div>

      <div className="relative z-10 mx-auto mt-[clamp(40px,5vw,64px)] max-w-[640px]" role="radiogroup" aria-label="Membership plan">
        <div className="flex flex-col gap-3">
          {PLANS.map((x, k) => {
            const on = k === i;
            return (
              <button
                key={x.k}
                data-m-card
                role="radio"
                aria-checked={on}
                onClick={() => setI(k)}
                className={`flex w-full items-center gap-5 rounded-[20px] border px-[clamp(18px,2vw,28px)] py-[clamp(16px,1.6vw,22px)] text-left transition-[background-color,border-color,box-shadow] duration-500 ${on ? "border-[var(--sx-accent)] bg-[color-mix(in_srgb,var(--sx-accent)_16%,var(--sx-surface))] shadow-[0_20px_50px_-24px_color-mix(in_srgb,var(--sx-accent)_70%,transparent)]" : "border-[var(--sx-line)] bg-[var(--sx-surface)]"}`}
              >
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors duration-300 ${on ? "border-[var(--sx-accent)]" : "border-[var(--sx-muted)]"}`}>
                  <span className={`h-3 w-3 rounded-full bg-[var(--sx-accent)] transition-transform duration-300 ${on ? "scale-100" : "scale-0"}`} />
                </span>
                <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-[clamp(17px,1.4vw,21px)] font-[650]">{x.k}</span>
                  {x.save && <span className="rounded-full bg-[var(--sx-accent)] px-3 py-1 text-[12px] font-[700] uppercase tracking-[0.08em] text-[var(--sx-accent-text)]">{x.save}</span>}
                </span>
                <span className="shrink-0 text-right">
                  <span className="sx-display text-[clamp(22px,2vw,30px)] font-[700] tabular-nums">{x.price}</span>
                  <span className="text-[14px] text-[var(--sx-muted)]"> /month</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col items-center gap-4 text-center">
          <Btn className="w-full justify-center">
            <span key={p.k} className={live ? "pr7in inline-block" : "inline-block"}>
              Join on {p.k} · {p.total}
            </span>
          </Btn>
          <p key={`n${p.k}`} className={`text-[14px] text-[var(--sx-muted)] ${live ? "pr7in" : ""}`}>
            {p.note}. No joining fee until Sunday.
          </p>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "PR14", name: "Radio plan list", motion: "M23", C: PR14 }];
