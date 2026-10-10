"use client";

// PR · Pricing layouts, batch 6 (docs/SECTION-MENU.md): PR13 one offer card on the left (price, checklist, button)
// beside a billing / delivery / returns FAQ that opens itself one question at a time. First question open in ?static=1.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Price, Product, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Steps an index every `ms` while `ref` is on screen (stops off screen and in ?static=1). `live` = motion allowed. */
function useCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms: number) {
  const [i, setI] = useState(0);
  const [live, setLive] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    setLive(true);
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
  return [i, setI, live] as const;
}

const CSS = `.pr6glow{animation:pr6gx 6.4s linear infinite alternate,pr6gs 3.9s ease-in-out infinite alternate}
@keyframes pr6gx{from{translate:-16% -10%}to{translate:20% 12%}}@keyframes pr6gs{from{scale:.8}to{scale:1.2}}
.pr6fill{animation:pr6fill var(--d) linear forwards}@keyframes pr6fill{from{scale:0 1}to{scale:1 1}}
.pr6bob{animation:pr6bob 3.4s ease-in-out infinite alternate}@keyframes pr6bob{from{translate:0 -6px;rotate:-4deg}to{translate:0 8px;rotate:3deg}}
html.is-static .pr6glow,html.is-static .pr6fill,html.is-static .pr6bob{animation:none}
html.is-static {.pr6glow,.pr6fill,.pr6bob{animation:none}}`;

const PERKS = ["1 kg of fresh-roasted beans, ground or whole", "Roasted on Monday, at your door by Thursday", "Swap the origin any month from your account", "Skip, pause or cancel in two taps", "Free delivery across 140 cities"];

const ASKS = [
  { q: "When am I charged?", a: "On the same date each month, two days before we roast your order. You get an email the day before, so nothing is ever a surprise." },
  { q: "Can I pause or skip a month?", a: "Yes. Skip one delivery or pause for up to three months from your account. No calls, no forms, no reasons needed." },
  { q: "How fast is delivery?", a: "We roast on Mondays and ship the same afternoon. Most metro orders arrive by Thursday; smaller towns by Saturday." },
  { q: "What if I don't like a roast?", a: "Tell us within 14 days and we send a different origin free. Unopened bags can be returned for a full refund." },
  { q: "Which payment methods work?", a: "UPI autopay, all major cards and net banking. GST invoices are in your account for every order." },
];

/** PR13 · Left 5/12: one plan card with price, checklist and button. Right 7/12: a billing / delivery / returns FAQ that opens one row at a time by itself. */
function PR13() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const [i, setI, live] = useCycle(r, ASKS.length, 2600);
  return (
    <Sec innerRef={r} theme="ink" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <style>{CSS}</style>
      <span aria-hidden className="pr6glow pointer-events-none absolute left-[-6%] top-[18%] h-[72%] w-[44%] rounded-full blur-[80px]" style={{ background: "radial-gradient(closest-side, color-mix(in srgb, var(--sx-accent) 58%, transparent), transparent)" }} />
      <div className="relative z-10">
        <H className="max-w-[18ch] text-[clamp(44px,5.2vw,88px)]">One plan. Every question answered.</H>

        <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 items-start gap-[clamp(32px,4vw,80px)] md:grid-cols-12">
          {/* offer card */}
          <div data-m-card className="sx-card relative overflow-hidden p-[clamp(24px,2.8vw,44px)] md:col-span-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[14px] font-[600] uppercase tracking-[0.16em] text-[var(--sx-accent)]">Roaster&apos;s Refill</p>
                <p className="mt-2 text-[16px] text-[var(--sx-muted)]">Monthly, from Hillcrest Roasters</p>
              </div>
              <div className="relative h-[120px] w-[90px] shrink-0 rounded-[14px] bg-[radial-gradient(circle_at_50%_60%,color-mix(in_srgb,var(--sx-accent)_45%,transparent),transparent_70%)]">
                <Product angle={1} accent="#c98b4f" className="pr6bob absolute inset-0 m-auto h-[92%] w-[92%]" />
              </div>
            </div>
            <div className="mt-8 flex items-end gap-3 border-t border-[var(--sx-line)] pt-8">
              <Price now="₹1,290" className="sx-display text-[clamp(48px,4.6vw,76px)] leading-none tracking-[-0.03em]" />
              <span className="pb-2 text-[15px] leading-tight text-[var(--sx-muted)]">
                / month
                <br />
                <s>₹1,640</s> in the shop
              </span>
            </div>
            <ul className="mt-8 space-y-4">
              {PERKS.map((p) => (
                <li key={p} className="flex items-start gap-3 text-[16px] leading-snug">
                  <span aria-hidden className="mt-[3px] grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--sx-accent)] text-[12px] font-[800] text-[var(--sx-accent-text)]">✓</span>
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <Btn>Start my refill</Btn>
              <span className="text-[14px] text-[var(--sx-muted)]">First bag ships this Monday</span>
            </div>
          </div>

          {/* FAQ */}
          <div className="md:col-span-7">
            <P className="max-w-[46ch]">Billing, delivery and returns, before you ask. Still unsure? Write to hello@hillcrest.example and a roaster replies.</P>
            <ul className="mt-8 border-t border-[var(--sx-line)]">
              {ASKS.map((x, k) => {
                const on = k === i;
                return (
                  <li key={x.q} className="relative overflow-hidden border-b border-[var(--sx-line)]">
                    {on && live && <span key={`t${i}`} aria-hidden className="pr6fill pointer-events-none absolute inset-0 origin-left bg-[color-mix(in_srgb,var(--sx-accent)_16%,transparent)]" style={{ ["--d" as string]: "2600ms" }} />}
                    <button onClick={() => setI(k)} aria-expanded={on} className="relative flex w-full items-center justify-between gap-6 px-[clamp(8px,1vw,16px)] py-[clamp(18px,1.8vw,26px)] text-left">
                      <span className={`text-[clamp(18px,1.5vw,23px)] font-[600] transition-colors duration-500 ${on ? "text-[var(--sx-text)]" : "text-[color-mix(in_srgb,var(--sx-text)_70%,transparent)]"}`}>{x.q}</span>
                      <span aria-hidden className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border text-[18px] transition-all duration-500 ${on ? "rotate-45 border-[var(--sx-accent)] bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "border-[var(--sx-line)]"}`}>+</span>
                    </button>
                    <div className="relative grid transition-[grid-template-rows] duration-[600ms] ease-[cubic-bezier(.65,0,.25,1)]" style={{ gridTemplateRows: on ? "1fr" : "0fr" }}>
                      <div className="min-h-0 overflow-hidden">
                        <p className="max-w-[56ch] px-[clamp(8px,1vw,16px)] pb-6 text-[16px] leading-relaxed text-[var(--sx-muted)]">{x.a}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "PR13", name: "Offer card + billing FAQ split", motion: "M23", C: PR13 }];
