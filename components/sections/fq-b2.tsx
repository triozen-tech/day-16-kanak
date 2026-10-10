"use client";

// FQ · FAQ layouts, batch 2 (docs/SECTION-MENU.md). Both play by themselves on camera (auto-open / cycling highlight).
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Avatar, Btn, H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Hands-free cycling: steps an index every `ms` while the section is on screen (stops off screen and in ?static=1). */
function useAutoCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms = 2200) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
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
  return [i, setI] as const;
}

/* ---------------------------------------------------------------------------------------------------------------- */

const CHAT = [
  { q: "Is the gel cleanser okay for oily, acne-prone skin?", a: "Yes. It's pH 5.5 with 2% niacinamide and no sulphates, so it clears oil without the tight, squeaky feel." },
  { q: "How long before I see a difference?", a: "Most people notice softer texture in a week. Tone and spots take six to eight weeks of daily use." },
  { q: "Can I use the vitamin C serum with retinol?", a: "Use vitamin C in the morning under SPF and retinol at night. Same day is fine, just not the same step." },
  { q: "What if it doesn't suit my skin?", a: "Send it back within 30 days, even if it's half used. We refund every rupee, no form to fill." },
];

/** FQ05 · Chat-bubble FAQ: questions as right-aligned bubbles; one is auto-tapped, typing dots show, then the answer bubble rises in. */
function FQ05() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M6");
  const [open, setOpen] = useAutoCycle(r, CHAT.length, 2600);
  const [typing, setTyping] = useState(false);

  // every newly opened question first shows typing dots, then its answer
  useEffect(() => {
    if (prefersReducedMotion()) return;
    setTyping(true);
    const t = setTimeout(() => setTyping(false), 750);
    return () => clearTimeout(t);
  }, [open]);

  return (
    <Sec innerRef={r} theme="stone" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <style>{`
        @keyframes fq05-dot { 0%, 60%, 100% { transform: translateY(0); opacity: .35 } 30% { transform: translateY(-5px); opacity: 1 } }
        .fq05-dot { animation: fq05-dot 1s ease-in-out infinite; }
        @keyframes fq05-rise { from { opacity: 0; transform: translateY(14px) scale(.97) } to { opacity: 1; transform: none } }
        .fq05-rise { animation: fq05-rise .5s cubic-bezier(.2,.8,.2,1) both; transform-origin: 0 100%; }
        @keyframes fq05-ping { from { transform: scale(1); opacity: .6 } to { transform: scale(2.4); opacity: 0 } }
        .fq05-ping { animation: fq05-ping 1.4s ease-out infinite; }
        html.is-static .fq05-dot, html.is-static .fq05-rise, html.is-static .fq05-ping { animation: none; }
      `}</style>
      <div className="grid grid-cols-1 items-start gap-[clamp(32px,5vw,96px)] md:grid-cols-12">
        <div className="md:col-span-5">
          <H className="max-w-[11ch] text-[clamp(44px,5.4vw,92px)]">Ask us like you&apos;d ask a friend.</H>
          <P className="mt-6 max-w-[40ch]">The questions we get most, answered by the Dewline skin team. Still unsure? A real person replies within the hour.</P>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Btn>Chat with the team</Btn>
            <Btn kind="link">Take the skin quiz →</Btn>
          </div>
        </div>

        <div data-m-card className="sx-card relative isolate overflow-hidden md:col-span-7">
          <div className="pointer-events-none absolute inset-0 -z-10 fx-pan" aria-hidden>
            <div className="fx-drift absolute -left-[10%] bottom-[-30%] aspect-square w-[70%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_14%,transparent),transparent)]" />
          </div>
          <div className="flex items-center gap-3 border-b border-[var(--sx-line)] px-[clamp(20px,2.4vw,32px)] py-4">
            <Avatar name="Dew Line" i={2} size={38} />
            <div className="leading-tight">
              <p className="text-[15px] font-[650]">Dewline skin team</p>
              <p className="flex items-center gap-2 text-[13px] text-[var(--sx-muted)]">
                <span className="relative inline-block h-2 w-2">
                  <span className="fq05-ping absolute inset-0 rounded-full bg-[var(--sx-accent)]" />
                  <span className="absolute inset-0 rounded-full bg-[var(--sx-accent)]" />
                </span>
                Online · replies in minutes
              </p>
            </div>
          </div>
          <div className="flex min-h-[clamp(440px,52vh,560px)] flex-col gap-3 px-[clamp(20px,2.4vw,32px)] py-6">
            {CHAT.map((c, k) => (
              <div key={c.q} className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(k)}
                  className={`ml-auto max-w-[78%] rounded-[20px] rounded-br-[6px] px-5 py-3 text-left text-[16px] leading-snug transition-colors duration-300 ${k === open ? "bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "bg-[color-mix(in_srgb,var(--sx-text)_7%,transparent)]"}`}
                >
                  {c.q}
                </button>
                {k === open &&
                  (typing ? (
                    <div key="dots" className="fq05-rise flex w-fit gap-1.5 rounded-[20px] rounded-bl-[6px] bg-[var(--sx-bg)] px-5 py-4" aria-label="Typing">
                      {[0, 1, 2].map((d) => (
                        <span key={d} className="fq05-dot h-2 w-2 rounded-full bg-[var(--sx-muted)]" style={{ animationDelay: `${d * 0.15}s` }} />
                      ))}
                    </div>
                  ) : (
                    <p key="answer" className="fq05-rise max-w-[82%] rounded-[20px] rounded-bl-[6px] bg-[var(--sx-bg)] px-5 py-3 text-[16px] leading-relaxed">
                      {c.a}
                    </p>
                  ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ---------------------------------------------------------------------------------------------------------------- */

const LEDGER = [
  { q: "How should I store an opened bottle?", a: "Upright, cork in, somewhere cool and dark. Reds keep two to three days; our sparkling stays lively for a day with the stopper we send." },
  { q: "When do orders arrive?", a: "Mumbai, Pune and Bengaluru in two working days. Elsewhere in four to six, always in a temperature-safe box." },
  { q: "Are your wines vegan?", a: "All of them. We fine with bentonite clay, never egg white, isinglass or milk protein." },
  { q: "Can I visit the vineyard?", a: "Tastings run on Saturdays from November to March in the Nashik hills. Booking opens a month ahead, ₹1,800 a seat." },
  { q: "Do you ship gifts with a note?", a: "Yes. Add a handwritten card at checkout and we'll leave the price off the box." },
];

/** FQ06 · Ledger FAQ: divided rows, question in the left 5 columns and the answer in the right 7, both always visible. */
function FQ06() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const [hi] = useAutoCycle(r, LEDGER.length, 1800);
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <div className="grid grid-cols-1 items-end gap-[clamp(24px,4vw,64px)] md:grid-cols-12">
        <H className="max-w-[12ch] text-[clamp(48px,6vw,104px)] md:col-span-7">Questions, poured plainly.</H>
        <div className="flex items-end gap-6 md:col-span-5">
          <div className="fx-pan w-[clamp(96px,10vw,150px)] shrink-0 overflow-hidden rounded-[var(--sx-radius,18px)]">
            <div className="fx-drift">
              <Pic i={3} ratio="3/4" />
            </div>
          </div>
          <div className="pb-2">
            <P>Small-lot wines from the Sahyadri slopes. If yours isn&apos;t here, our cellar team will answer.</P>
            <div className="mt-5">
              <Btn kind="link">Write to the cellar →</Btn>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-[clamp(48px,6vw,88px)] border-t border-[var(--sx-text)]">
        {LEDGER.map((l, k) => (
          <div key={l.q} className="relative grid grid-cols-1 gap-x-[clamp(24px,4vw,64px)] gap-y-3 border-b border-[var(--sx-line)] py-[clamp(24px,2.6vw,36px)] md:grid-cols-12">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 -left-[clamp(12px,1.6vw,24px)] -right-[clamp(12px,1.6vw,24px)] origin-left rounded-[12px] bg-[color-mix(in_srgb,var(--sx-accent)_9%,transparent)] transition-[opacity,transform] duration-700"
              style={{ opacity: k === hi ? 1 : 0, transform: k === hi ? "scaleX(1)" : "scaleX(0.96)" }}
            />
            <h3 data-m-text className={`sx-display relative text-[clamp(22px,2vw,30px)] leading-[1.2] text-[var(--sx-text)] transition-colors duration-500 md:col-span-5 ${k === hi ? "text-[var(--sx-accent)]!" : ""}`}>
              {l.q}
            </h3>
            <p data-m-text className="relative text-[clamp(16px,1.2vw,18px)] leading-relaxed text-[var(--sx-muted)] md:col-span-7">
              {l.a}
            </p>
          </div>
        ))}
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "FQ05", name: "Chat-bubble FAQ", motion: "M6", C: FQ05 },
  { code: "FQ06", name: "Ledger FAQ (question left, answer right)", motion: "M23", C: FQ06 },
];
