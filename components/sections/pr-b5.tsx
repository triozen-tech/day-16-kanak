"use client";

// PR · Offer / pricing layouts, batch 5 (docs/SECTION-MENU.md). Invented brands, sample prices in ₹.
import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Pic, Price, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const OFFERS = [
  { i: 1, l: "CROISSANT", t: "Butter croissant dozen", d: "Laminated over three days", now: "₹960", was: "₹1,080" },
  { i: 3, l: "BABKA", t: "Dark chocolate babka", d: "One loaf, serves eight", now: "₹620" },
  { i: 0, l: "BUNS", t: "Cardamom knots × 6", d: "Swedish fold, Kerala spice", now: "₹540", was: "₹600" },
  { i: 2, l: "CAKE", t: "Jaggery celebration cake", d: "Order two days ahead", now: "₹1,890" },
  { i: 1, l: "STARTER", t: "Rye starter kit", d: "Our 9-year-old culture", now: "₹480" },
  { i: 3, l: "PAIRING", t: "Filter coffee + pastry", d: "Weekdays before 11 am", now: "₹340", was: "₹410" },
];

/** PR11 · Hero offer + side offer carousel: one large primary offer card (5/12) anchors a carousel of smaller related
 *  offers (7/12) with arrows. Motion M13: the pictures open out of a frame with the scroll; the carousel drifts
 *  sideways on its own (arrows give it a push). */
function PR11() {
  const r = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const push = useRef({ v: 0 });
  useSectionMotion(r, "M13");

  useEffect(() => {
    const el = r.current;
    const row = track.current;
    if (!el || !row || prefersReducedMotion()) return;
    let x = 0;
    let on = false;
    const tick = (_t: number, dt: number) => {
      if (!on) return;
      const half = row.scrollWidth / 2;
      if (!half) return;
      x -= (Math.min(dt, 50) / 1000) * (56 + push.current.v);
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      gsap.set(row, { x });
    };
    const io = new IntersectionObserver(([e]) => (on = e.isIntersecting));
    io.observe(el);
    gsap.ticker.add(tick);
    return () => {
      io.disconnect();
      gsap.ticker.remove(tick);
    };
  }, []);

  const nudge = (dir: 1 | -1) => gsap.fromTo(push.current, { v: dir * 1400 }, { v: 0, duration: 0.9, ease: "power3.out" });

  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[13ch] text-[clamp(44px,5.6vw,96px)]">This week at the oven.</H>
        <P className="max-w-[38ch] pb-2">Wild Flour Bakehouse bakes in small runs from 4 am. Order by Thursday night for a Saturday doorstep.</P>
      </div>

      <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 gap-[clamp(24px,3vw,48px)] md:grid-cols-12">
        {/* primary offer */}
        <article className="sx-card flex flex-col overflow-hidden p-[clamp(14px,1.4vw,20px)] md:col-span-5">
          <div className="relative">
            <Pic i={3} ratio="5/4" label="" />
            <span className="absolute left-4 top-4 rounded-full bg-[var(--sx-accent)] px-4 py-2 text-[13px] font-[650] text-[var(--sx-accent-text)]">Save ₹330</span>
          </div>
          <div className="flex flex-1 flex-col px-[clamp(8px,1.2vw,18px)] pb-[clamp(8px,1vw,14px)] pt-[clamp(20px,2.2vw,32px)]">
            <h3 className="sx-display text-[clamp(32px,3vw,48px)] font-[700] leading-[1] tracking-[-0.02em]">The Sunday Box</h3>
            <p className="mt-3 max-w-[40ch] text-[16px] leading-relaxed text-[var(--sx-muted)]">Two country sourdoughs, six croissants, a babka and a jar of kokum jam. Enough for a long breakfast for four.</p>
            <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-8">
              <Price now="₹1,450" was="₹1,780" className="text-[clamp(26px,2.2vw,34px)]" />
              <Btn>Reserve a box</Btn>
            </div>
          </div>
        </article>

        {/* carousel of smaller offers */}
        <div className="flex min-w-0 flex-col md:col-span-7">
          <div className="flex items-center justify-between gap-4 border-b border-[var(--sx-line)] pb-5">
            <p className="text-[clamp(18px,1.4vw,22px)] font-[650]">More from the counter</p>
            <div className="flex gap-2">
              {([-1, 1] as const).map((d) => (
                <button key={d} type="button" aria-label={d < 0 ? "Previous offers" : "Next offers"} onClick={() => nudge(d)} className="grid h-12 w-12 place-items-center rounded-full border border-[var(--sx-line)] text-[18px] transition-colors hover:bg-[var(--sx-text)] hover:text-[var(--sx-bg)]">
                  {d < 0 ? "←" : "→"}
                </button>
              ))}
            </div>
          </div>
          <div className="relative mt-6 min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,#000_88%,transparent)]">
            <div ref={track} className="flex w-max gap-[clamp(14px,1.6vw,22px)] will-change-transform">
              {[...OFFERS, ...OFFERS].map((o, k) => (
                <article key={k} aria-hidden={k >= OFFERS.length} className="w-[clamp(220px,17vw,270px)] shrink-0">
                  <Pic i={o.i} ratio="4/5" label={o.l} />
                  <p className="mt-4 text-[17px] font-[650] leading-snug">{o.t}</p>
                  <p className="mt-1 text-[14px] text-[var(--sx-muted)]">{o.d}</p>
                  <Price now={o.now} was={o.was} className="mt-3 text-[17px]" />
                </article>
              ))}
            </div>
          </div>
          <p className="mt-6 text-[14px] text-[var(--sx-muted)]">Free delivery within 8 km of the bakery · pick-up from 7 am</p>
        </div>
      </div>
    </Sec>
  );
}

const INCLUDES = ["A 250 g tin of first-flush every month", "Members-only reserve lots, first pick", "Free refills of loose leaf in store", "One tasting evening each season", "Pause or cancel any month"];
const CLUBS = ["Kettle House", "Northfold", "Halcyon Cafés", "Arcwell Hotels", "Meridia", "Solano Rooms"];

/** PR12 · Single-plan split card: centred title; one wide card split by a vertical rule — plan name, huge price,
 *  button and an "includes" note on the left; a checklist and a row of customer logos on the right.
 *  Motion M18: the two halves unfold from their corners; a light sweep and the logo row keep moving. */
function PR12() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M18");
  return (
    <Sec innerRef={r} theme="ink" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <style>{`
        @keyframes pr12-sweep { from { transform: translateX(-60%) } to { transform: translateX(160%) } }
        @keyframes pr12-roll { to { transform: translateX(-50%) } }
        .pr12-sweep { animation: pr12-sweep 3.6s linear infinite; }
        .pr12-roll { animation: pr12-roll 16s linear infinite; }
        html.is-static .pr12-sweep, html.is-static .pr12-roll { animation: none; }
        html.is-static .pr12-sweep { opacity: 0; }
        html.is-static { .pr12-sweep, .pr12-roll { animation: none; } .pr12-sweep { opacity: 0; } }
      `}</style>
      <div className="mx-auto max-w-[860px] text-center">
        <H className="text-[clamp(44px,5.8vw,96px)]">One membership. Every leaf.</H>
        <P className="mx-auto mt-6 max-w-[46ch]">The Tea Circle is the only plan we sell: fresh Darjeeling and Nilgiri lots, picked for you each month.</P>
      </div>

      <div className="relative mx-auto mt-[clamp(48px,6vw,88px)] max-w-[1180px] overflow-hidden rounded-[var(--sx-radius,18px)] border border-[var(--sx-line)]">
        <div aria-hidden className="pr12-sweep pointer-events-none absolute inset-y-0 left-0 z-[1] w-[45%] bg-[linear-gradient(100deg,transparent,color-mix(in_srgb,var(--sx-accent)_38%,transparent),transparent)] mix-blend-screen" />
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div data-m-card className="flex flex-col items-center justify-center bg-[var(--sx-surface)] px-[clamp(24px,4vw,64px)] py-[clamp(40px,5vw,72px)] text-center">
            <p className="text-[clamp(18px,1.5vw,22px)] font-[650]">The Tea Circle</p>
            <p className="mt-6 flex items-start justify-center gap-1 leading-none">
              <span className="sx-display text-[clamp(72px,8vw,124px)] font-[800] tracking-[-0.04em] tabular-nums">₹1,290</span>
            </p>
            <p className="mt-3 text-[15px] text-[var(--sx-muted)]">a month, billed monthly</p>
            <div className="mt-9">
              <Btn>Join the circle</Btn>
            </div>
            <p className="mt-6 max-w-[34ch] text-[13px] leading-relaxed text-[var(--sx-muted)]">Includes shipping across India and a welcome tin of Glenmist Muscatel worth ₹890.</p>
          </div>
          <div data-m-card className="flex min-w-0 flex-col justify-between border-[var(--sx-line)] bg-[color-mix(in_srgb,var(--sx-surface)_55%,var(--sx-bg))] px-[clamp(24px,4vw,64px)] py-[clamp(40px,5vw,72px)] max-md:border-t md:border-l">
            <div>
              <p className="text-[14px] font-[600] uppercase tracking-[0.14em] text-[var(--sx-muted)]">What you get</p>
              <ul className="mt-6 space-y-4">
                {INCLUDES.map((x) => (
                  <li key={x} className="flex items-start gap-4 text-[17px] leading-snug">
                    <span className="mt-[2px] grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--sx-accent)] text-[13px] font-[800] text-[var(--sx-accent-text)]">✓</span>
                    {x}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-10 border-t border-[var(--sx-line)] pt-6">
              <p className="text-[13px] text-[var(--sx-muted)]">Poured at</p>
              <div className="mt-3 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
                <div className="pr12-roll flex w-max gap-10">
                  {[...CLUBS, ...CLUBS].map((c, k) => (
                    <span key={k} aria-hidden={k >= CLUBS.length} className={`whitespace-nowrap text-[17px] text-[var(--sx-text)] opacity-75 ${k % 2 ? "font-[700] italic" : "font-[600] uppercase tracking-[0.16em]"}`}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "PR11", name: "Hero offer + side offer carousel", motion: "M13", C: PR11 },
  { code: "PR12", name: "Single-plan split card", motion: "M18", C: PR12 },
];
