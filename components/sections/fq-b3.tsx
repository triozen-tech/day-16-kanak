"use client";

// FQ · FAQ layouts, batch 3 (docs/SECTION-MENU.md).
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const CATS = [
  {
    t: "Orders",
    qs: [
      ["Can I change my order after paying?", "Yes, for two hours. Reply to your confirmation email with the change and the workshop will update the build sheet before cutting starts."],
      ["Do you take custom sizes?", "Tables and benches can be cut to any length between 90 and 240 cm for ₹2,400 extra. Sofas come in the three listed sizes only."],
      ["Is there a showroom I can visit?", "Our Bengaluru studio is open on weekends by appointment. Book a 40-minute slot and sit on everything."],
      ["Can I pay in instalments?", "No-cost EMI over 3, 6 or 9 months on orders above ₹25,000, with most cards."],
    ],
  },
  {
    t: "Delivery",
    qs: [
      ["How long does delivery take?", "In-stock pieces arrive in 5–8 days. Made-to-order pieces take 4–6 weeks; we send photos from the bench along the way."],
      ["Do you assemble on delivery?", "Always. Two of our own fitters carry it in, assemble it, and take every scrap of packaging away."],
      ["Do you deliver to upper floors?", "Yes, with or without a lift. Tell us about narrow stairs and we plan the route a day early."],
      ["What does delivery cost?", "Free in 22 cities. Elsewhere a flat ₹1,500, whatever the size of the order."],
    ],
  },
  {
    t: "Materials",
    qs: [
      ["Which wood do you use?", "Plantation-grown teak and mango from certified Karnataka estates, kiln-dried for nine days so it never warps."],
      ["Are the fabrics washable?", "Every sofa cover zips off. The linen blends go in a cold machine wash; the boucle prefers a dry clean."],
      ["How do I care for oiled wood?", "Wipe with a damp cloth, oil once a year. Each order ships with a small tin of our hardwax oil."],
      ["Can I order swatches first?", "Six fabric swatches and two wood chips, posted free. Most people order a second set."],
    ],
  },
  {
    t: "Returns",
    qs: [
      ["What if it does not fit my room?", "You have 30 days. We collect it, refund you in full and keep only the delivery fee for made-to-order pieces."],
      ["Is there a warranty?", "Ten years on frames and joinery, two years on upholstery and foam. Repairs are done in our own workshop."],
      ["My piece arrived damaged.", "Send a photo within 48 hours. A replacement part or a new piece is on its way within the week."],
      ["Do you buy back old pieces?", "Yes. Our pieces bought back in good shape earn 30% of the price as store credit."],
    ],
  },
];
const STEP = 1300; // ms per tick: each category opens two questions, then the rail steps on

/** FQ07 · Category rail + filtered accordion: a vertical category rail left (3/12), the accordion right (9/12) filtered
 *  by the selected category. Hands-free, the rail steps through the categories and the answers open in turn. Motion M23. */
function FQ07() {
  const r = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const [t, setT] = useState(0);
  const [live, setLive] = useState(false);
  const [pick, setPick] = useState<number | null>(null);
  const paused = useRef(false);

  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    setLive(true);
    let iv: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(iv);
      if (e.isIntersecting) iv = setInterval(() => !paused.current && setT((v) => (v + 1) % (CATS.length * 2)), STEP);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(iv);
    };
  }, []);

  const cat = Math.floor(t / 2);
  const open = pick ?? t % 2;

  // re-filter: the new category's questions slide in one after another
  const first = useRef(true);
  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const l = list.current;
    if (!l || prefersReducedMotion()) return;
    gsap.fromTo(l.children, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out", stagger: 0.06 });
  }, [cat]);

  return (
    <Sec innerRef={r} theme="stone" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <style>{`
        @keyframes fq07-fill { from { transform: scaleX(0) } to { transform: scaleX(1) } }
        .fq07-fill { transform-origin: 0 50%; animation: fq07-fill ${STEP * 2}ms linear both; }
        html.is-static .fq07-fill { animation: none; transform: scaleX(1); }
      `}</style>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[14ch] text-[clamp(44px,5.2vw,88px)]">Questions, sorted.</H>
        <P className="max-w-[36ch] pb-2">Solid-wood furniture, made to order in Bengaluru. Pick a topic, or let it walk you through.</P>
      </div>
      <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 gap-[clamp(32px,4vw,72px)] md:grid-cols-12">
        <div className="md:col-span-3">
          <nav data-m-card className="flex flex-col gap-2" aria-label="FAQ categories">
            {CATS.map((c, k) => {
              const on = k === cat;
              return (
                <button
                  key={c.t}
                  type="button"
                  onClick={() => {
                    paused.current = true;
                    setPick(null);
                    setT(k * 2);
                  }}
                  className={`relative flex items-center justify-between overflow-hidden rounded-full border px-5 py-3.5 text-left text-[16px] transition-colors duration-500 ${on ? "border-[var(--sx-accent)] text-[var(--sx-text)]" : "border-[var(--sx-line)] text-[var(--sx-muted)]"}`}
                >
                  {on && <span key={cat} className={`absolute inset-0 bg-[color-mix(in_srgb,var(--sx-accent)_16%,transparent)] ${live && !paused.current ? "fq07-fill" : ""}`} aria-hidden />}
                  <span className="relative font-[600]">{c.t}</span>
                  <span className="relative text-[13px] tabular-nums">{c.qs.length}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="md:col-span-9 md:pl-[clamp(0px,3vw,48px)]">
          <div ref={list} className="border-t border-[var(--sx-line)]">
            {CATS[cat].qs.map(([q, a], k) => {
              const isOpen = k === open;
              return (
                <div key={`${cat}-${k}`} className="border-b border-[var(--sx-line)]">
                  <button type="button" onClick={() => {
                      paused.current = true;
                      setPick(k);
                    }} className="flex w-full items-center justify-between gap-6 py-[clamp(20px,2vw,30px)] text-left">
                    <span className={`sx-display text-[clamp(22px,2vw,32px)] font-[650] leading-tight tracking-[-0.01em] transition-colors duration-500 ${isOpen ? "text-[var(--sx-text)]" : "text-[color-mix(in_srgb,var(--sx-text)_72%,transparent)]"}`}>{q}</span>
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border transition-all duration-500 ${isOpen ? "rotate-45 border-[var(--sx-accent)] bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "border-[var(--sx-line)]"}`}
                      aria-hidden
                    >
                      +
                    </span>
                  </button>
                  <div className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(.22,1,.36,1)]" style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}>
                    <div className="overflow-hidden">
                      <p className="max-w-[62ch] pb-[clamp(20px,2vw,30px)] pr-16 text-[clamp(16px,1.2vw,18px)] leading-relaxed text-[var(--sx-muted)]">{a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-6">
            <p className="text-[15px] text-[var(--sx-muted)]">Still unsure? A designer replies within the hour, 10 am to 7 pm.</p>
            <Btn kind="ghost">Ask the studio</Btn>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "FQ07", name: "Category rail + filtered accordion", motion: "M23", C: FQ07 }];
