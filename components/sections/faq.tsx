"use client";

// FQ · FAQ layouts (docs/SECTION-MENU.md). Accordions and tabs open by themselves while on screen (hands-free filming);
// in ?static=1 the first item stays open as the final state.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Steps an index 0..count-1 every `ms` while the element is on screen; stops off screen and in ?static=1. */
function useCycle(ref: React.RefObject<HTMLElement | null>, count: number, ms = 3600) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let t: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(
      ([e]) => {
        clearInterval(t);
        if (e.isIntersecting) t = setInterval(() => setI((v) => (v + 1) % count), ms);
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, [ref, count, ms]);
  return [i, setI] as const;
}

type QA = [string, string];

/** One accordion row: question button + answer that grows open (grid-rows 0fr → 1fr, no fixed heights). */
function Row({ q, a, open, onClick, size = "md" }: { q: string; a: string; open: boolean; onClick: () => void; size?: "md" | "lg" }) {
  return (
    <div className="border-b border-[var(--sx-line)]">
      <button type="button" onClick={onClick} aria-expanded={open} className="flex w-full items-center justify-between gap-6 py-[clamp(18px,2vw,26px)] text-left">
        <span className={`font-[600] leading-snug ${size === "lg" ? "text-[clamp(18px,1.7vw,24px)]" : "text-[clamp(16px,1.3vw,19px)]"}`}>{q}</span>
        <span
          className={`relative grid size-9 shrink-0 place-items-center rounded-full border border-[var(--sx-line)] transition-colors duration-500 ${open ? "bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : ""}`}
          aria-hidden
        >
          <span className="absolute h-px w-3.5 bg-current" />
          <span className={`absolute h-3.5 w-px bg-current transition-transform duration-500 ${open ? "rotate-90 scale-y-0" : ""}`} />
        </span>
      </button>
      <div className={`grid transition-[grid-template-rows] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <p className={`max-w-[60ch] pb-[clamp(18px,2vw,26px)] pr-12 text-[clamp(15px,1.1vw,17px)] leading-relaxed text-[var(--sx-muted)] transition-opacity duration-700 ${open ? "opacity-100" : "opacity-0"}`}>{a}</p>
        </div>
      </div>
    </div>
  );
}

const TEA: QA[] = [
  ["Where do your leaves come from?", "Three family estates in Darjeeling and the Nilgiris. We buy each flush directly and print the garden on every tin."],
  ["How long does a tin last?", "A 100 g tin makes about forty cups. Keep it shut, away from the stove, and it stays bright for six months."],
  ["Do you ship across India?", "Yes, to every pin code. Metro orders arrive in two days; everywhere else in four to six."],
  ["Can I change my subscription?", "Pause, skip or swap teas any time from your account, up to two days before the next box ships."],
  ["Is the packaging recyclable?", "The tins are steel and endlessly recyclable. Inner pouches are paper-lined and home-compostable."],
];

/** FQ01 · Two columns: title + contact line left, accordion right that opens one item after another while on screen. */
function FQ01() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const [open, setOpen] = useCycle(r, TEA.length, 3800);
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <div className="grid grid-cols-1 gap-[clamp(40px,6vw,96px)] md:grid-cols-12">
        <div className="md:col-span-5">
          <H className="text-[clamp(44px,5.4vw,88px)]">Good questions, steeped answers.</H>
          <P className="mt-6 max-w-[38ch]">Everything about our first-flush teas, delivery and the monthly tasting box.</P>
          <p data-m-text className="mt-10 max-w-[34ch] text-[15px] leading-relaxed text-[var(--sx-muted)]">
            Still unsure? Write to <span className="text-[var(--sx-text)] underline decoration-[var(--sx-accent)] underline-offset-4">hello@leafandlantern.example</span>. A tea taster replies within a day.
          </p>
        </div>
        <div data-m-card className="border-t border-[var(--sx-line)] md:col-span-7">
          {TEA.map(([q, a], k) => (
            <Row key={q} q={q} a={a} open={open === k} onClick={() => setOpen(k)} size="lg" />
          ))}
        </div>
      </div>
    </Sec>
  );
}

const TABS: { tab: string; items: QA[] }[] = [
  {
    tab: "Orders",
    items: [
      ["When will my sneakers ship?", "In-stock pairs leave our Bengaluru studio within 24 hours. Drops ship on the release date."],
      ["Can I change my size after ordering?", "Yes, until the pair is packed. Message us with your order number and the new size."],
      ["Do you offer cash on delivery?", "On orders up to ₹15,000 in most cities. The option shows at checkout when it applies."],
    ],
  },
  {
    tab: "Sizing",
    items: [
      ["Do the Runner 02 fit true to size?", "They run half a size long. If you are between sizes, go down half a size."],
      ["Is there a wide fit?", "The Court Low comes in a wide last. Pick “W” next to the size on the product page."],
      ["How do I measure my foot?", "Stand on paper, mark heel and longest toe, measure in cm and match it to our size chart."],
    ],
  },
  {
    tab: "Returns",
    items: [
      ["What is the return window?", "Thirty days from delivery for unworn pairs in the original box. Pickup is free."],
      ["When do I get my refund?", "Within five working days of the pair reaching us, to the way you paid."],
      ["Can I exchange instead?", "Yes. Choose exchange in your account and the new pair ships when we collect the old one."],
    ],
  },
  {
    tab: "Care",
    items: [
      ["How do I clean the suede?", "Dry brush only, along the grain. Our care kit has the right brush and a protective spray."],
      ["Can they go in the washer?", "The knit uppers can, cold and gentle, insoles out. Never the leather or suede pairs."],
      ["Do you resole?", "Yes, the Court Low can be resoled once at our studio for ₹1,800."],
    ],
  },
];

/** FQ02 · Centred accordion with category tabs; the tabs cycle by themselves while on screen. */
function FQ02() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M6");
  const [tab, setTab] = useCycle(r, TABS.length, 4200);
  // open item per tab: a freshly shown tab starts with its first answer open
  const [pick, setPick] = useState<[number, number]>([0, 0]);
  const open = pick[0] === tab ? pick[1] : 0;
  return (
    <Sec innerRef={r} theme="ink" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <div className="mx-auto max-w-[860px] text-center">
        <H className="text-[clamp(44px,5.6vw,92px)]">Before you lace up.</H>
        <P className="mx-auto mt-5 max-w-[44ch]">Answers on orders, fit, returns and care for every pair we make.</P>
        <div data-m-card className="mt-10 inline-flex max-w-full flex-wrap justify-center gap-1 rounded-full border border-[var(--sx-line)] p-1.5">
          {TABS.map((t, k) => (
            <button
              key={t.tab}
              type="button"
              onClick={() => setTab(k)}
              className={`rounded-full px-[clamp(14px,1.8vw,24px)] py-2.5 text-[14px] font-[600] transition-colors duration-500 ${tab === k ? "bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "text-[var(--sx-muted)] hover:text-[var(--sx-text)]"}`}
            >
              {t.tab}
            </button>
          ))}
        </div>
        <div data-m-card key={tab} className="sx-fq-swap mt-10 border-t border-[var(--sx-line)] text-left">
          {TABS[tab].items.map(([q, a], k) => (
            <Row key={q} q={q} a={a} open={open === k} onClick={() => setPick([tab, k])} />
          ))}
        </div>
      </div>
      <style>{`.sx-fq-swap{animation:sxFqSwap .7s cubic-bezier(.22,1,.36,1)}@keyframes sxFqSwap{from{opacity:0;transform:translateY(14px)}}`}</style>
    </Sec>
  );
}

const CARDS: QA[] = [
  ["Is it really sugar-free?", "Yes. Sweetened with a touch of stevia and fruit, 6 kcal a can."],
  ["How much caffeine?", "80 mg per 250 ml, about one strong cup of coffee. No crash after."],
  ["When should I drink it?", "Mid-morning or before training. Skip it within six hours of sleep."],
  ["Is it vegan?", "Every flavour is plant-based, with no animal-derived colours."],
  ["Where can I buy it?", "Online, in 400+ cafés and at selected gyms across eight cities."],
  ["Can I return a pack?", "Unopened packs within 14 days. Damaged cans are replaced free."],
];

/** FQ03 · FAQ cards grid: 6 question cards with short answers, the question large and the answer quiet. */
function FQ03() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M18");
  return (
    <Sec innerRef={r} theme="stone" font="condensed" className="py-[clamp(72px,9vw,140px)]">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[14ch] text-[clamp(48px,6vw,104px)]">Straight answers. No fizz.</H>
        <P className="max-w-[36ch]">The six things people ask before their first can.</P>
      </div>
      <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 gap-[clamp(12px,1.4vw,20px)] sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map(([q, a], k) => (
          <article key={q} data-m-card className={`sx-card flex min-h-[220px] flex-col justify-between gap-8 p-[clamp(22px,2.4vw,34px)] ${k === 1 ? "bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : ""}`}>
            <h3 className="text-[clamp(22px,2vw,28px)] font-[650] leading-tight tracking-[-0.01em]">{q}</h3>
            <p className={`text-[15px] leading-relaxed ${k === 1 ? "opacity-80" : "text-[var(--sx-muted)]"}`}>{a}</p>
          </article>
        ))}
      </div>
    </Sec>
  );
}

const SKIN: QA[] = [
  ["Is the serum safe for sensitive skin?", "It is fragrance-free and patch-tested on 120 volunteers with sensitive skin. Start every other night for the first week."],
  ["Can I use it with retinol?", "Yes, on alternate nights. Use the serum in the morning and your retinol at night for the smoothest routine."],
  ["When will I see results?", "Most people notice softer, more even skin in two weeks and a visible glow by week six."],
  ["How long does a bottle last?", "Two to three drops a day: a 30 ml bottle lasts about ten weeks."],
];

/** FQ04 · FAQ + help card split: accordion left, a "still curious?" card with a photo and a button right. */
function FQ04() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M1");
  const [open, setOpen] = useCycle(r, SKIN.length, 4000);
  return (
    <Sec innerRef={r} theme="paper" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <H className="max-w-[16ch] text-[clamp(48px,6vw,100px)]">Your skin, your questions.</H>
      <div className="mt-[clamp(36px,5vw,64px)] grid grid-cols-1 items-start gap-[clamp(28px,4vw,64px)] md:grid-cols-12">
        <div className="border-t border-[var(--sx-line)] md:col-span-7">
          {SKIN.map(([q, a], k) => (
            <Row key={q} q={q} a={a} open={open === k} onClick={() => setOpen(k)} size="lg" />
          ))}
        </div>
        <aside className="sx-card overflow-hidden md:col-span-5">
          <Pic i={1} ratio="16/10" round={false} className="w-full" />
          <div className="p-[clamp(22px,2.4vw,34px)]">
            <h3 className="sx-display text-[clamp(30px,2.8vw,42px)] leading-[1.02]">Still curious?</h3>
            <p data-m-text className="mt-3 max-w-[36ch] text-[15px] leading-relaxed text-[var(--sx-muted)]">Book a free 15-minute video call with one of our skin advisors. No sales pitch, just a routine that fits.</p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Btn>Book a call</Btn>
              <Btn kind="link">Read the guide →</Btn>
            </div>
          </div>
        </aside>
      </div>
    </Sec>
  );
}

export const FAQ: SectionDef[] = [
  { code: "FQ01", name: "Two-column FAQ, self-opening accordion", motion: "M23", C: FQ01 },
  { code: "FQ02", name: "Centred accordion with auto-cycling tabs", motion: "M6", C: FQ02 },
  { code: "FQ03", name: "FAQ cards grid", motion: "M18", C: FQ03 },
  { code: "FQ04", name: "FAQ + help card split", motion: "M1", C: FQ04 },
];
