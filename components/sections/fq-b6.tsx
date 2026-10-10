"use client";

// FQ · FAQ layouts, batch 6 (docs/SECTION-MENU.md): FQ12 heading + search on one row, then a 3-column grid of topic
// cards (image, topic, 3–4 question links). The search types example queries by itself and the matching question
// lights up; ?static=1 shows the grid with no highlight.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const CSS = `.fq6glow{animation:fq6gx 6.6s linear infinite alternate,fq6gs 4.1s ease-in-out infinite alternate}
@keyframes fq6gx{from{translate:-20% 0}to{translate:22% 8%}}@keyframes fq6gs{from{scale:.85}to{scale:1.2}}
.fq6kb [data-m-img] img{animation:fq6kb 5.2s ease-in-out infinite alternate}@keyframes fq6kb{from{translate:-3% 1.5%}to{translate:3% -1.5%}}
.fq6caret{animation:fq6caret .9s steps(1) infinite}@keyframes fq6caret{50%{opacity:0}}
html.is-static .fq6glow,html.is-static .fq6kb [data-m-img] img,html.is-static .fq6caret{animation:none}
html.is-static {.fq6glow,.fq6kb [data-m-img] img,.fq6caret{animation:none}}`;

const TOPICS = [
  { t: "Delivery & assembly", pic: 0, label: "Delivery", qs: ["When will my sofa arrive?", "Do you carry it upstairs?", "Is assembly included?", "Can I pick a delivery slot?"] },
  { t: "Fabrics & care", pic: 2, label: "Fabrics", qs: ["Which fabrics suit pets?", "Can I wash the covers?", "How do I treat a stain?", "Do you send swatches?"] },
  { t: "Orders & returns", pic: 3, label: "Returns", qs: ["How do I return a chair?", "What is the 100-night trial?", "Can I change my order?", "When is my refund paid?"] },
  { t: "Sizing & fit", pic: 1, label: "Sizing", qs: ["Will it fit through my door?", "Do you make custom sizes?", "What is the seat height?"] },
  { t: "Wood & finishes", pic: 0, label: "Oak", qs: ["Is the wood solid or veneer?", "Where is the teak from?", "How do I oil a tabletop?"] },
  { t: "Warranty & repairs", pic: 2, label: "Warranty", qs: ["What does the warranty cover?", "Can a leg be replaced?", "Do you repair old pieces?"] },
];

// the search "types" one of these, then the matching question lights up (topic index, question index)
const QUERIES = [
  { s: "pets", t: 1, q: 0 },
  { s: "door", t: 3, q: 0 },
  { s: "return", t: 2, q: 0 },
  { s: "teak", t: 4, q: 1 },
  { s: "upstairs", t: 0, q: 1 },
  { s: "repair", t: 5, q: 2 },
];

/** Types the queries letter by letter while on screen; returns [typed text, current query index, live]. */
function useTyper(ref: React.RefObject<HTMLElement | null>) {
  const [txt, setTxt] = useState("");
  const [k, setK] = useState(-1);
  const [live, setLive] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    setLive(true);
    let t: ReturnType<typeof setTimeout> | undefined;
    let qi = 0;
    let ch = 0;
    const step = () => {
      const word = QUERIES[qi].s;
      if (ch <= word.length) {
        setTxt(word.slice(0, ch));
        if (ch === word.length) setK(qi);
        ch++;
        t = setTimeout(step, ch > word.length ? 1500 : 90);
      } else {
        qi = (qi + 1) % QUERIES.length;
        ch = 0;
        setK(-1);
        setTxt("");
        t = setTimeout(step, 160);
      }
    };
    const io = new IntersectionObserver(([e]) => {
      clearTimeout(t);
      if (e.isIntersecting) step();
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(t);
    };
  }, [ref]);
  return [txt, k, live] as const;
}

/** FQ12 · Heading and a search field on one row; below, six topic cards in three columns, each an image, a topic title and its question links. */
function FQ12() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M13");
  const [txt, k, live] = useTyper(r);
  const hit = k >= 0 ? QUERIES[k] : null;
  return (
    <Sec innerRef={r} theme="paper" font="grotesk" className="fq6kb py-[clamp(72px,9vw,140px)]">
      <style>{CSS}</style>
      <span aria-hidden className="fq6glow pointer-events-none absolute right-[-8%] top-[-6%] h-[50%] w-[52%] rounded-full blur-[80px]" style={{ background: "radial-gradient(closest-side, color-mix(in srgb, var(--sx-accent) 45%, transparent), transparent)" }} />
      <div className="relative z-10">
        <div className="grid grid-cols-1 items-end gap-8 md:grid-cols-12">
          <div className="md:col-span-7">
            <H className="max-w-[14ch] text-[clamp(44px,5vw,84px)]">Good questions, good answers.</H>
            <P className="mt-5 max-w-[44ch]">Everything about living with Teakwood furniture, sorted by topic. Most answers take under a minute to read.</P>
          </div>
          <label className="flex items-center gap-3 rounded-full border border-[var(--sx-line)] bg-[var(--sx-surface)] px-6 py-4 md:col-span-5">
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden className="shrink-0 text-[var(--sx-muted)]">
              <circle cx="8.5" cy="8.5" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="m13 13 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="min-w-0 flex-1 truncate text-[17px]">
              {txt ? <span>{txt}</span> : <span className="text-[var(--sx-muted)]">Search 120 answers…</span>}
              {live && <span aria-hidden className="fq6caret ml-[1px] inline-block h-[1.1em] w-[2px] translate-y-[3px] bg-[var(--sx-accent)]" />}
            </span>
            <span className="rounded-full bg-[var(--sx-text)] px-4 py-2 text-[13px] font-[600] text-[var(--sx-bg)]">Search</span>
          </label>
        </div>

        <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 gap-[clamp(16px,1.8vw,28px)] md:grid-cols-3">
          {TOPICS.map((tp, ti) => {
            const lit = hit?.t === ti;
            return (
              <article key={tp.t} className={`sx-card flex flex-col p-[clamp(12px,1.2vw,16px)] transition-[border-color,box-shadow] duration-500 ${lit ? "border-[var(--sx-accent)]! shadow-[0_24px_60px_-30px_color-mix(in_srgb,var(--sx-accent)_70%,transparent)]" : ""}`}>
                <Pic i={tp.pic} ratio="16/8" label={tp.label} className="w-full" />
                <div className="flex flex-1 flex-col px-[clamp(8px,1vw,14px)] pb-2 pt-5">
                  <h3 className="text-[clamp(20px,1.6vw,24px)] font-[700] tracking-[-0.01em]">{tp.t}</h3>
                  <ul className="mt-3">
                    {tp.qs.map((q, qi) => {
                      const on = lit && hit?.q === qi;
                      return (
                        <li key={q}>
                          <a href="#" onClick={(e) => e.preventDefault()} className={`flex items-center justify-between gap-3 border-t border-[var(--sx-line)] py-[10px] text-[15px] transition-colors duration-300 ${on ? "font-[600] text-[var(--sx-accent)]" : "text-[var(--sx-muted)]"}`}>
                            <span>{q}</span>
                            <span aria-hidden className={`transition-[translate] duration-300 ${on ? "translate-x-1" : ""}`}>→</span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
        <p className="mt-10 text-[15px] text-[var(--sx-muted)]">
          Not here? Chat with a Teakwood designer, every day 9 am – 9 pm, or write to care@teakwood.example.
        </p>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "FQ12", name: "Topic cards with question lists", motion: "M13", C: FQ12 }];
