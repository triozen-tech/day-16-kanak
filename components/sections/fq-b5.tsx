"use client";

// FQ · FAQ / help layouts, batch 5 (docs/SECTION-MENU.md). Invented brands, sample answers.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Runs `step` every `ms` while `ref` is on screen (never in ?static=1 / reduced motion); stops when `paused`. */
function useOnScreenLoop(ref: React.RefObject<HTMLElement | null>, step: () => void, ms: number, paused = false) {
  const fn = useRef(step);
  useEffect(() => {
    fn.current = step;
  });
  useEffect(() => {
    const el = ref.current;
    if (!el || paused || prefersReducedMotion()) return;
    let t: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (e.isIntersecting) t = setInterval(() => fn.current(), ms);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, [ref, ms, paused]);
}

const FAQS = [
  { q: "How do I find my size?", a: "Our lasts run true to size. If you are between sizes, go half a size up for the Lattice and true for the Field runner. Every pair ships with a paper fit guide." },
  { q: "What is your return policy?", a: "Return or exchange any unworn pair within 30 days. Book a pickup from your order page; the refund reaches you within 5 working days of the check." },
  { q: "Do you offer cash on delivery (COD)?", a: "Yes, COD is available on orders up to ₹15,000 in 19,000 pin codes. A ₹49 handling fee applies; prepaid orders ship free." },
  { q: "How long does shipping take?", a: "Metros in 2–3 days, everywhere else in 4–6. You get a tracking link on WhatsApp the moment the box leaves Chennai." },
  { q: "Can I return a pair I have worn outside?", a: "Worn pairs can't be returned, but the 6-month sole warranty still covers splits, glue failure and broken eyelets." },
  { q: "How should I clean knit uppers?", a: "Cold water, a soft brush and a drop of mild soap. Air-dry away from the sun; never in a machine dryer." },
  { q: "Is there a size exchange fee?", a: "Your first size exchange is free. We send the new pair out as soon as the courier collects the old one." },
];
const TERMS = ["return", "size", "cod", "crypto"];

/** FQ10 · Search-filter FAQ: centred heading, a search box, then an accordion that filters live as you type, with an
 *  empty state + contact link. Motion M23: heading and copy slide up line by line; in record mode a word types into
 *  the box and the accordion filters live. */
function FQ10() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(0);
  const [user, setUser] = useState(false);
  // script: type a term, hold, delete it, next term
  const s = useRef({ term: 0, pos: 0, phase: "type" as "type" | "hold" | "del", hold: 0 });
  useOnScreenLoop(
    r,
    () => {
      const st = s.current;
      const word = TERMS[st.term];
      if (st.phase === "type") {
        st.pos += 1;
        setQ(word.slice(0, st.pos));
        if (st.pos >= word.length) {
          st.phase = "hold";
          st.hold = 0;
        }
      } else if (st.phase === "hold") {
        st.hold += 1;
        if (st.hold >= 6) st.phase = "del";
      } else {
        st.pos -= 1;
        setQ(word.slice(0, Math.max(0, st.pos)));
        if (st.pos <= 0) {
          st.phase = "type";
          st.term = (st.term + 1) % TERMS.length;
        }
      }
    },
    130,
    user,
  );
  const term = q.trim().toLowerCase();
  const hits = FAQS.map((f, k) => ({ ...f, k })).filter((f) => !term || `${f.q} ${f.a}`.toLowerCase().includes(term));
  const shown = term ? (hits[0]?.k ?? -1) : open;
  const mark = (t: string) => {
    if (!term) return t;
    const i = t.toLowerCase().indexOf(term);
    if (i < 0) return t;
    return (
      <>
        {t.slice(0, i)}
        <mark className="rounded-[4px] bg-[color-mix(in_srgb,var(--sx-accent)_28%,transparent)] px-[2px] text-[var(--sx-text)]">{t.slice(i, i + term.length)}</mark>
        {t.slice(i + term.length)}
      </>
    );
  };

  return (
    <Sec innerRef={r} theme="stone" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <div className="mx-auto max-w-[880px]">
        <div className="text-center">
          <H className="text-[clamp(44px,5.6vw,92px)]">Ask us anything about your pair.</H>
          <P className="mx-auto mt-6 max-w-[44ch]">Sizing, returns, delivery and care for every Stride Atelier shoe. Start typing, the answers narrow as you go.</P>
        </div>

        <label className="mt-[clamp(36px,4vw,56px)] flex items-center gap-4 rounded-full border border-[var(--sx-line)] bg-[var(--sx-surface)] px-6 py-4 shadow-[0_20px_50px_-30px_rgba(17,20,24,.35)] focus-within:border-[var(--sx-accent)]">
          <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-[var(--sx-muted)]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={q}
            onChange={(e) => {
              setUser(true);
              setQ(e.target.value);
            }}
            onFocus={() => setUser(true)}
            placeholder="Search returns, sizing, COD…"
            className="min-w-0 flex-1 bg-transparent text-[clamp(17px,1.4vw,21px)] outline-none placeholder:text-[var(--sx-muted)]"
            aria-label="Search the FAQ"
          />
          <span className="shrink-0 rounded-full bg-[var(--sx-bg)] px-3 py-1 text-[13px] tabular-nums text-[var(--sx-muted)]">
            {hits.length} {hits.length === 1 ? "answer" : "answers"}
          </span>
        </label>

        <div className="mt-8 min-h-[460px]">
          {hits.length ? (
            <ul className="border-t border-[var(--sx-line)]">
              {hits.map((f) => {
                const isOpen = shown === f.k;
                return (
                  <li key={f.k} data-m-card className="border-b border-[var(--sx-line)]">
                    <button type="button" onClick={() => (setUser(true), setOpen(isOpen ? -1 : f.k))} className="flex w-full items-center justify-between gap-6 py-5 text-left" aria-expanded={isOpen}>
                      <span className="text-[clamp(18px,1.5vw,22px)] font-[600]">{mark(f.q)}</span>
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--sx-line)] text-[18px] transition-transform duration-300 ${isOpen ? "rotate-45 bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : ""}`}>+</span>
                    </button>
                    <div className={`grid transition-[grid-template-rows] duration-500 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                      <div className="overflow-hidden">
                        <p className="max-w-[62ch] pb-6 text-[16px] leading-relaxed text-[var(--sx-muted)]">{mark(f.a)}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="sx-card flex flex-col items-center px-8 py-14 text-center">
              <p className="sx-display text-[clamp(28px,2.6vw,40px)] leading-tight">No answers for &ldquo;{q}&rdquo;.</p>
              <p className="mt-3 max-w-[40ch] text-[16px] text-[var(--sx-muted)]">Our fit team replies within an hour, 9 am to 9 pm, every day.</p>
              <div className="mt-7">
                <Btn kind="ghost">Write to the fit team →</Btn>
              </div>
            </div>
          )}
        </div>
      </div>
    </Sec>
  );
}

const SUGGEST = ["Track my order", "Change my delivery date", "Skip next month's box", "Update my card", "Return an opened serum"];
const TOPICS = [
  [
    { t: "Orders", l: ["Track a parcel", "Edit an order", "Missing items"] },
    { t: "Billing", l: ["Payment methods", "GST invoices", "Refund status"] },
  ],
  [
    { t: "Subscription", l: ["Skip or pause", "Change frequency", "Swap products"] },
    { t: "Account", l: ["Reset password", "Saved addresses", "Delete my data"] },
  ],
  [
    { t: "Products", l: ["Patch test guide", "Ingredients list", "Shelf life"] },
    { t: "Contact", l: ["Chat with a chemist", "Email support", "Store visits"] },
  ],
];
const LINKS = TOPICS.flatMap((c) => c.flatMap((g) => g.l));

/** FQ11 · Help-centre search + topic columns: centred title and a large search field; below, three columns of divided
 *  topic links. Motion M6: title and field rise from blur, the columns follow; the field types suggestions and a
 *  highlight walks through the links on its own. */
function FQ11() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M6");
  const [typed, setTyped] = useState({ s: 0, n: SUGGEST[0].length });
  const [hl, setHl] = useState(-1);
  const tick = useRef(0);
  useOnScreenLoop(
    r,
    () => {
      tick.current += 1;
      setTyped(({ s, n }) => {
        const w = SUGGEST[s];
        if (n < w.length + 8) return { s, n: n + 1 }; // type, then hold for 8 steps
        return { s: (s + 1) % SUGGEST.length, n: 0 };
      });
      if (tick.current % 5 === 0) setHl((v) => (v + 1) % LINKS.length);
    },
    95,
  );
  const shownText = SUGGEST[typed.s].slice(0, Math.min(typed.n, SUGGEST[typed.s].length));

  return (
    <Sec innerRef={r} theme="paper" font="wide" className="py-[clamp(72px,9vw,140px)]">
      <style>{`
        @keyframes fq11-caret { 50% { opacity: 0 } }
        .fq11-caret { animation: fq11-caret 1s steps(1) infinite; }
        html.is-static .fq11-caret { animation: none; }
      `}</style>
      <div className="mx-auto max-w-[980px] text-center">
        <H className="text-[clamp(40px,5.4vw,88px)]">How can we help?</H>
        <P className="mx-auto mt-6 max-w-[46ch]">Answers from the Saanvi Skin care team, for orders, subscriptions and the products themselves.</P>
        <div data-m-card className="mx-auto mt-[clamp(36px,4vw,56px)] flex max-w-[820px] items-center gap-4 rounded-[20px] border border-[var(--sx-line)] bg-[var(--sx-surface)] py-3 pl-7 pr-3 text-left shadow-[0_30px_70px_-40px_rgba(28,24,19,.5)]">
          <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0 text-[var(--sx-accent)]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <p className="min-w-0 flex-1 truncate text-[clamp(18px,1.6vw,24px)]" aria-label="Search help articles">
            {shownText || <span className="text-[var(--sx-muted)]">Search help articles</span>}
            <span className="fq11-caret ml-[2px] inline-block h-[1.05em] w-[2px] translate-y-[3px] bg-[var(--sx-accent)]" />
          </p>
          <Btn>Search</Btn>
        </div>
        <p className="mt-5 text-[14px] text-[var(--sx-muted)]">Popular: refund status · skip a box · patch test</p>
      </div>

      <div className="mt-[clamp(56px,7vw,104px)] grid grid-cols-1 border-t border-[var(--sx-line)] md:grid-cols-3">
        {TOPICS.map((col, ci) => (
          <div key={ci} data-m-card className={`px-[clamp(8px,2.6vw,40px)] ${ci ? "md:border-l md:border-[var(--sx-line)]" : "md:pl-0"} ${ci === 2 ? "md:pr-0" : ""}`}>
            {col.map((g, gi) => (
              <div key={g.t} className={`py-[clamp(24px,2.6vw,36px)] ${gi ? "border-t border-[var(--sx-line)]" : ""}`}>
                <p className="sx-display text-[clamp(20px,1.7vw,26px)] font-[700]">{g.t}</p>
                <ul className="mt-4 divide-y divide-[var(--sx-line)]">
                  {g.l.map((l) => {
                    const on = LINKS[hl] === l;
                    return (
                      <li key={l}>
                        <a href="#" onClick={(e) => e.preventDefault()} className={`flex items-center justify-between gap-4 rounded-[10px] px-3 py-3 text-[16px] transition-[background-color,color,padding] duration-300 hover:bg-[var(--sx-surface)] ${on ? "bg-[var(--sx-accent)] pl-5 text-[var(--sx-accent-text)]" : ""}`}>
                          {l}
                          <span aria-hidden className={`transition-transform duration-300 ${on ? "translate-x-0" : "-translate-x-1 opacity-50"}`}>→</span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "FQ10", name: "Search-filter FAQ", motion: "M23", C: FQ10 },
  { code: "FQ11", name: "Help-centre search + topic columns", motion: "M6", C: FQ11 },
];
