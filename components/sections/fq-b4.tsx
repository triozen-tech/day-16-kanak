"use client";

// FQ · FAQ layouts, batch 4 (docs/SECTION-MENU.md).
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { Btn, H, P, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const QUICK = [
  ["How much caffeine is in a can?", "160 mg, about a strong double espresso. Half-cans carry 80 mg."],
  ["Is there any sugar?", "Zero. It is sweetened with monk fruit and a little stevia, nothing else."],
  ["When should I drink it?", "Twenty minutes before a workout, a deadline or a long drive. Not after 4 pm."],
  ["Is it safe every day?", "One can a day sits well under the daily limit for healthy adults. Skip it if pregnant."],
  ["Why the electrolytes?", "Sodium, potassium and magnesium, so the lift lasts without the dry mouth."],
  ["Does it come in glass?", "Cans only: they chill faster, block light and recycle endlessly."],
  ["How fast is delivery?", "Next day in eight metro cities, three days everywhere else. Free over ₹999."],
  ["Can I pause my case?", "Yes, from your account in two taps. Skip a month or switch flavours any time."],
];

/** FQ08 · FAQ card marquee: heading above, a row of FAQ cards (question + short answer) looping sideways forever.
 *  Motion M44: the row drifts on its own and bends into an arc with the scroll speed. */
function FQ08() {
  const r = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = r.current;
    const st = stage.current;
    const rw = row.current;
    if (!el || !st || !rw || prefersReducedMotion()) return;
    let vel = 0;
    let smooth = 0;
    let x = 0;
    let on = false;
    const io = new IntersectionObserver(([e]) => (on = e.isIntersecting));
    io.observe(el);
    const trig = ScrollTrigger.create({ trigger: el, start: "top bottom", end: "bottom top", onUpdate: (s) => (vel = s.getVelocity() / 1000) });
    const cards = Array.from(rw.children) as HTMLElement[];
    const tick = (_t: number, dtMs: number) => {
      if (!on) return;
      const dt = Math.min(dtMs, 50) / 1000;
      smooth += (vel - smooth) * 0.08;
      vel *= 0.9;
      const half = cards[QUICK.length].offsetLeft - cards[0].offsetLeft;
      x = (x - dt * (70 + Math.abs(smooth) * 260)) % half;
      const w = st.clientWidth;
      const k = gsap.utils.clamp(-1, 1, smooth);
      for (const c of cards) {
        const cx = c.offsetLeft + x + c.offsetWidth / 2;
        const n = gsap.utils.clamp(0, 1, cx / w);
        // arc: deepest in the middle, flat at the edges; tilted cards follow the curve
        const y = Math.sin(n * Math.PI) * k * 60;
        c.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${(n - 0.5) * k * -8}deg)`;
      }
    };
    gsap.ticker.add(tick);
    const ctx = gsap.context(() => {
      const once = { trigger: el, start: "top 75%", toggleActions: "play none none reverse" } as const;
      gsap.from(el.querySelectorAll("[data-m-head], [data-m-text], [data-fq08-cta]"), { y: 28, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, scrollTrigger: once });
      gsap.from(st, { x: 220, opacity: 0, duration: 1.2, ease: "power3.out", delay: 0.15, scrollTrigger: once });
    }, el);
    return () => {
      gsap.ticker.remove(tick);
      trig.kill();
      io.disconnect();
      ctx.revert();
    };
  }, []);
  const list = [...QUICK, ...QUICK];
  return (
    <Sec innerRef={r} theme="ink" font="condensed" full className="py-[clamp(72px,9vw,140px)]">
      <div className="flex flex-wrap items-end justify-between gap-6 px-[clamp(20px,5vw,96px)]">
        <H className="max-w-[12ch] text-[clamp(52px,6.4vw,108px)] uppercase">Quick answers, cold.</H>
        <div data-fq08-cta className="max-w-[34ch] pb-2">
          <P>Everything people ask before their first can of Zestline, in one breath each.</P>
          <div className="mt-6">
            <Btn>Shop the 12-pack · ₹1,320</Btn>
          </div>
        </div>
      </div>
      {/* the stage: a wide band, starting at the content padding, bleeding off the right */}
      <div ref={stage} className="mt-[clamp(48px,6vw,88px)] min-w-0 overflow-hidden py-[70px] pl-[clamp(20px,5vw,96px)]">
        <div ref={row} className="flex w-max gap-[clamp(14px,1.4vw,20px)]">
          {list.map(([q, a], k) => (
            <article
              key={k}
              className={`flex w-[clamp(280px,25vw,360px)] shrink-0 flex-col justify-between gap-8 rounded-[var(--sx-radius)] border p-[clamp(22px,2vw,30px)] will-change-transform ${k % 4 === 1 ? "border-transparent bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "border-[var(--sx-line)] bg-[var(--sx-surface)]"}`}
              aria-hidden={k >= QUICK.length}
            >
              <h3 className="sx-display text-[clamp(24px,2vw,30px)] font-[700] uppercase leading-[1.02]">{q}</h3>
              <p className={`text-[15px] leading-relaxed ${k % 4 === 1 ? "text-[color-mix(in_srgb,var(--sx-accent-text)_80%,transparent)]" : "text-[var(--sx-muted)]"}`}>{a}</p>
            </article>
          ))}
        </div>
      </div>
    </Sec>
  );
}

/* ---------------------------------------------------------------------------------------------------------------- */

const GROUPS = [
  {
    t: "Booking",
    d: "Dates, deposits and changes.",
    qs: [
      ["How far ahead should I book?", "Weekends from October to March fill about eight weeks out. Weekdays are usually open a fortnight ahead."],
      ["Is a deposit required?", "30% secures the room. The rest is due on arrival, by card or UPI."],
      ["Can I change my dates?", "Free of charge up to 14 days before arrival, subject to the new dates being open."],
    ],
  },
  {
    t: "Your stay",
    d: "Rooms, check-in, the little things.",
    qs: [
      ["What time is check-in?", "From 2 pm, and we hold bags from 9 am. Early arrivals get breakfast on the terrace."],
      ["Are children welcome?", "Yes. Two family suites have a second bed, and the kitchen cooks for small appetites."],
      ["Do the rooms have air-conditioning?", "All fourteen do, along with ceiling fans and windows that actually open onto the courtyards."],
    ],
  },
  {
    t: "Food & tea",
    d: "Breakfast, dinners and the tea list.",
    qs: [
      ["Is breakfast included?", "Always: a set Rajasthani breakfast, fruit from the garden and our house blend of Assam."],
      ["Can you cater for allergies?", "Tell us when you book. The kitchen cooks from scratch, so most diets are easy."],
      ["Can non-guests come for dinner?", "On Friday and Saturday evenings, by reservation, at the long table. ₹2,800 a person."],
    ],
  },
];
const FLAT = GROUPS.flatMap((g, gi) => g.qs.map((_, qi) => `${gi}-${qi}`));

/** FQ09 · Grouped FAQ rows: heading, then hairline-divided groups; each group is a row with its label left
 *  (~max 384px) and its expandable questions right. Hands-free, the answers open one after another.
 *  Motion M6: labels and questions rise from blur, word by word. */
function FQ09() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M6");
  const [open, setOpen] = useState(FLAT[0]);
  const [live, setLive] = useState(false);
  const paused = useRef(false);
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    setLive(true);
    let t: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (e.isIntersecting) t = setInterval(() => !paused.current && setOpen((o) => FLAT[(FLAT.indexOf(o) + 1) % FLAT.length]), 1800);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, []);
  return (
    <Sec innerRef={r} theme="paper" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <style>{`
        @keyframes fq09-sweep { from { transform: translateX(-100%) } to { transform: translateX(400%) } }
        .fq09-sweep { animation: fq09-sweep 1.8s linear infinite; }
        html.is-static .fq09-sweep { display: none; }
        html.is-static { .fq09-sweep { display: none; } }
      `}</style>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[14ch] text-[clamp(44px,5.4vw,88px)]">Before you arrive at the Haveli.</H>
        <P className="max-w-[34ch] pb-2">Still wondering? Write to the front desk and a person replies within the hour.</P>
      </div>
      <div className="mt-[clamp(40px,5vw,72px)] border-t border-[var(--sx-line)]">
        {GROUPS.map((g, gi) => (
          <div key={g.t} className="grid grid-cols-1 gap-6 border-b border-[var(--sx-line)] py-[clamp(28px,3.4vw,52px)] md:grid-cols-[minmax(0,384px)_minmax(0,1fr)] md:gap-[clamp(32px,5vw,80px)]">
            <div>
              <p data-m-text className="sx-display text-[clamp(26px,2.4vw,38px)] font-[700] leading-none tracking-[-0.02em]">{g.t}</p>
              <p className="mt-3 text-[15px] text-[var(--sx-muted)]">{g.d}</p>
            </div>
            <div onPointerEnter={() => (paused.current = true)} onPointerLeave={() => (paused.current = false)}>
              {g.qs.map(([q, a], qi) => {
                const id = `${gi}-${qi}`;
                const isOpen = open === id;
                return (
                  <div key={q} data-m-card className={`relative overflow-hidden rounded-[14px] transition-colors duration-500 ${isOpen ? "bg-[var(--sx-surface)]" : ""}`}>
                    {isOpen && live && <div className="fq09-sweep pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-[linear-gradient(100deg,transparent,color-mix(in_srgb,var(--sx-accent)_14%,transparent),transparent)]" />}
                    <button onClick={() => setOpen(id)} aria-expanded={isOpen} className="relative flex w-full items-center justify-between gap-6 px-5 py-5 text-left">
                      <span className="text-[clamp(17px,1.4vw,21px)] font-[600]">{q}</span>
                      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-all duration-500 ${isOpen ? "rotate-45 border-transparent bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "border-[var(--sx-line)]"}`} aria-hidden>
                        +
                      </span>
                    </button>
                    <div className={`relative grid transition-[grid-template-rows] duration-500 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                      <div className="overflow-hidden">
                        <p className="max-w-[60ch] px-5 pb-6 text-[16px] leading-relaxed text-[var(--sx-muted)]">{a}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Btn>Check dates · from ₹14,500</Btn>
        <Btn kind="link">Write to the front desk →</Btn>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "FQ08", name: "FAQ card marquee", motion: "M44", C: FQ08 },
  { code: "FQ09", name: "Grouped FAQ rows", motion: "M6", C: FQ09 },
];
