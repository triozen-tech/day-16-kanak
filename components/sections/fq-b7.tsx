"use client";

// FQ · FAQ layouts, batch 7 (docs/SECTION-MENU.md): FQ13 a product Q&A list: "Questions (147)" with a search field and
// an "Ask a question" button, then hairline rows with an answer-count badge, the question in quotes, the top answer and
// who answered. Rows slide up and the badges count up (M3); afterwards the search field types a topic and the matching
// row lights up, by itself. ?static=1 shows the plain list.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Avatar, Btn, H, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const CSS = `.fq7glow{animation:fq7gx 6.3s linear infinite alternate,fq7gs 3.8s ease-in-out infinite alternate}
@keyframes fq7gx{from{translate:-30% -10%}to{translate:30% 14%}}@keyframes fq7gs{from{scale:.8}to{scale:1.24}}
.fq7type{display:inline-block;overflow:hidden;white-space:nowrap;vertical-align:bottom;animation:fq7type .7s steps(var(--n)) both}
@keyframes fq7type{from{width:0}to{width:calc(var(--n) * 1ch)}}
.fq7caret{animation:fq7caret .8s steps(1) infinite}@keyframes fq7caret{50%{opacity:0}}
html.is-static .fq7glow,html.is-static .fq7type,html.is-static .fq7caret{animation:none}
html.is-static {.fq7glow,.fq7type,.fq7caret{animation:none}}`;

const QA = [
  { n: 12, key: "retinol", q: "Can I layer this under a retinol at night?", a: "Yes. Apply the serum first, wait a minute, then your retinol. The ceramides actually cut down the flaking I used to get.", who: "Ira Menon", when: "1 day ago", help: 48 },
  { n: 9, key: "sensitive", q: "Is it okay for very sensitive, rosacea-prone skin?", a: "It is fragrance free and patch-tested on sensitive skin. I have rosacea and had no flare-ups over six weeks.", who: "Kabir Shah", when: "3 days ago", help: 37 },
  { n: 21, key: "pregnancy", q: "Safe to use during pregnancy?", a: "There is no retinoid or salicylic acid in the formula. Our skin team still suggests checking with your doctor first.", who: "Dew Lab team", when: "5 days ago", help: 66 },
  { n: 7, key: "humid", q: "Will it feel sticky in Mumbai humidity?", a: "Not at all. It sinks in within a minute and feels like water. I skip moisturiser on monsoon days.", who: "Neha Fernandes", when: "1 week ago", help: 29 },
  { n: 15, key: "bottle", q: "How long does one 30 ml bottle last?", a: "About ten weeks using three drops morning and night. The dropper makes it easy not to overdo it.", who: "Vikram Bose", when: "2 weeks ago", help: 41 },
];

/** FQ13 · Header row (count left, search + ask right), then hairline rows: answer-count badge · question · top answer · answered by. */
function FQ13() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M3");
  const [i, setI] = useState(-1);
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    let t: ReturnType<typeof setInterval> | undefined;
    let first: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      clearTimeout(first);
      if (e.isIntersecting) {
        first = setTimeout(() => setI((v) => (v + 1) % QA.length), 900);
        t = setInterval(() => setI((v) => (v + 1) % QA.length), 2000);
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
      clearTimeout(first);
    };
  }, []);
  const term = i >= 0 ? QA[i].key : "";
  return (
    <Sec innerRef={r} theme="stone" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <style>{CSS}</style>
      <span aria-hidden className="fq7glow pointer-events-none absolute right-[6%] top-[12%] h-[56%] w-[50%] rounded-full blur-[90px]" style={{ background: "radial-gradient(closest-side, color-mix(in srgb, var(--sx-accent) 40%, transparent), transparent)" }} />
      <div className="relative z-10">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-[var(--sx-line)] pb-8">
          <div>
            <H className="text-[clamp(40px,4.4vw,72px)] font-[500]">
              Questions <span className="text-[var(--sx-muted)]">(147)</span>
            </H>
            <p className="mt-3 text-[15px] text-[var(--sx-muted)]">About Dew Barrier Serum · 30 ml · ₹1,290</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex h-[52px] w-[min(360px,80vw)] items-center gap-3 rounded-full border border-[var(--sx-line)] bg-[var(--sx-surface)] px-5">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0 text-[var(--sx-muted)]" aria-hidden>
                <circle cx="9" cy="9" r="6" />
                <path d="m14 14 4 4" strokeLinecap="round" />
              </svg>
              <span className="sr-only">Search questions</span>
              <span className="min-w-0 flex-1 truncate text-[15px]">
                {term ? (
                  <span key={term} className="fq7type" style={{ ["--n" as string]: term.length }}>
                    {term}
                  </span>
                ) : (
                  <span className="text-[var(--sx-muted)]">Search questions…</span>
                )}
                {term && <span className="fq7caret ml-[1px] inline-block h-[1.1em] w-[2px] translate-y-[3px] bg-[var(--sx-accent)]" />}
              </span>
            </label>
            <Btn>Ask a question</Btn>
          </div>
        </div>

        <div>
          {QA.map((x, k) => {
            const on = k === i;
            return (
              <article
                key={x.q}
                data-m-card
                className={`-mx-[clamp(12px,1.6vw,24px)] grid grid-cols-[minmax(0,1fr)] gap-[clamp(16px,2.4vw,40px)] rounded-[18px] border-b border-[var(--sx-line)] px-[clamp(12px,1.6vw,24px)] py-[clamp(22px,2.4vw,34px)] transition-colors duration-500 md:grid-cols-[clamp(96px,8vw,120px)_minmax(0,1fr)_auto] ${on ? "bg-[color-mix(in_srgb,var(--sx-accent)_14%,transparent)]" : ""}`}
              >
                <div className={`flex flex-col items-center justify-center rounded-[14px] border px-3 py-4 transition-colors duration-500 max-md:w-[110px] ${on ? "border-[var(--sx-accent)] bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "border-[var(--sx-line)] bg-[var(--sx-surface)]"}`}>
                  <span data-m-num className="sx-display text-[clamp(30px,2.6vw,42px)] font-[600] leading-none tabular-nums">
                    {x.n}
                  </span>
                  <span className={`mt-1 text-[12px] uppercase tracking-[0.12em] ${on ? "opacity-80" : "text-[var(--sx-muted)]"}`}>answers</span>
                </div>
                <div className="min-w-0">
                  <p className="sx-display text-[clamp(21px,1.8vw,28px)] leading-[1.2]">&ldquo;{x.q}&rdquo;</p>
                  <p className="mt-3 max-w-[70ch] text-[16px] leading-relaxed text-[var(--sx-muted)]">{x.a}</p>
                  <div className="mt-4 flex items-center gap-3 text-[13px] text-[var(--sx-muted)]">
                    <Avatar name={x.who} i={k} size={28} />
                    <span>
                      Answered {x.when} by <b className="font-[650] text-[var(--sx-text)]">{x.who}</b>
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-[13px] text-[var(--sx-muted)] md:flex-col md:items-end">
                  <span className="rounded-full border border-[var(--sx-line)] px-3 py-1.5">Helpful · {x.help}</span>
                  <Btn kind="link" className="text-[14px]">
                    All {x.n} answers →
                  </Btn>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <p className="text-[15px] text-[var(--sx-muted)]">Most questions get an answer from a buyer or our skin team within a day.</p>
          <Btn kind="ghost">See all 147 questions</Btn>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "FQ13", name: "Product Q&A list with search + ask", motion: "M3", C: FQ13 }];
