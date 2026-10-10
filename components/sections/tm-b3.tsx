"use client";

// TM · Team layouts, batch 3 (docs/SECTION-MENU.md). Every person is invented (initials / placeholder photos only).
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Pic, Sec } from "./kit";
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

/* ───────────────────────── TM05 · Ruled label, split intro, 4-up portraits ───────────────────────── */

const TM05_PEOPLE = [
  { n: "Ira Menon", r: "Founder · lead maker", i: 3 },
  { n: "Kabir Shah", r: "Joinery", i: 1 },
  { n: "Meera Pillai", r: "Upholstery & cane", i: 2 },
  { n: "Arjun Rao", r: "Oils & finishes", i: 0 },
];

/** Four L-shaped corner brackets; `on` pulls them in to the image edge and turns them accent. */
function Corners({ on }: { on: boolean }) {
  const base = "pointer-events-none absolute h-[22px] w-[22px] transition-all duration-700 ease-[cubic-bezier(.2,.8,.2,1)]";
  const c = on ? "border-[var(--sx-accent)] opacity-100" : "border-[var(--sx-bg)] opacity-70";
  const d = on ? "8px" : "22px";
  return (
    <>
      <span className={`${base} ${c} border-l-[3px] border-t-[3px]`} style={{ left: d, top: d }} />
      <span className={`${base} ${c} border-r-[3px] border-t-[3px]`} style={{ right: d, top: d }} />
      <span className={`${base} ${c} border-b-[3px] border-l-[3px]`} style={{ left: d, bottom: d }} />
      <span className={`${base} ${c} border-b-[3px] border-r-[3px]`} style={{ right: d, bottom: d }} />
    </>
  );
}

/** TM05 · A small "Team" label with a full-width hairline; a split row (title left, paragraph + button right); then
 *  four square portraits with name and role under each. The portrait corners animate (radius + brackets) on hover,
 *  and step through the four by themselves. */
function TM05() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const [a, setA] = useAutoCycle(r, TM05_PEOPLE.length, 1600);
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <div className="flex items-center gap-6">
        <span className="text-[13px] font-[650] uppercase tracking-[0.18em]">Team</span>
        <span className="h-px flex-1 bg-[var(--sx-line)]" />
        <span className="text-[13px] text-[var(--sx-muted)]">Tide &amp; Grain · Jodhpur</span>
      </div>
      <div className="mt-[clamp(32px,4vw,56px)] grid grid-cols-1 gap-[clamp(24px,4vw,64px)] md:grid-cols-2">
        <H className="max-w-[13ch] text-[clamp(44px,5.4vw,88px)]">Four pairs of hands per chair.</H>
        <div className="md:pt-3">
          <P className="max-w-[44ch]">We are a workshop of four. Every chair is cut, joined, woven and oiled here, and signed under the seat by whoever finished it last.</P>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Btn>Visit the workshop</Btn>
            <Btn kind="link">We&apos;re hiring a joiner →</Btn>
          </div>
        </div>
      </div>
      <div className="mt-[clamp(48px,6vw,88px)] grid grid-cols-2 gap-[clamp(12px,1.6vw,24px)] md:grid-cols-4">
        {TM05_PEOPLE.map((p, k) => {
          const on = k === a;
          return (
            <figure key={p.n} onMouseEnter={() => setA(k)}>
              <div className={`relative overflow-hidden transition-[border-radius] duration-700 ease-[cubic-bezier(.2,.8,.2,1)] ${on ? "rounded-[56px_6px_56px_6px]" : "rounded-[6px]"}`}>
                <div className="fx-drift" style={{ animationDelay: `${-k * 1.8}s` }}>
                  <Pic i={p.i} ratio="1/1" round={false} label="" />
                </div>
                <Corners on={on} />
              </div>
              <figcaption className="mt-4 flex items-baseline justify-between gap-3 border-t border-[var(--sx-line)] pt-3">
                <span className="sx-display text-[clamp(20px,1.7vw,26px)] font-[500]">{p.n}</span>
                <span className={`text-right text-[13px] transition-colors duration-500 ${on ? "text-[var(--sx-accent)]" : "text-[var(--sx-muted)]"}`}>{p.r}</span>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </Sec>
  );
}

/* ───────────────────────── TM06 · Colour band with overlapping portrait cards ───────────────────────── */

const TM06_PEOPLE = [
  { n: "Rhea D'Souza", r: "Head of house", ask: "the quiet beaches south of Agonda", i: 3 },
  { n: "Nikhil Kamat", r: "Chef, Casa Lagoa kitchen", ask: "the kokum fish curry recipe", i: 2 },
  { n: "Ana Fernandes", r: "Spa & wellbeing", ask: "a sunset massage on the deck", i: 1 },
];

const TM06_CSS = `
.tm06-glow{animation:tm06-glow 5s ease-in-out infinite alternate}
.tm06-glow2{animation:tm06-glow 3.3s ease-in-out infinite alternate-reverse}
@keyframes tm06-glow{from{transform:translateX(-10%) scale(1)}to{transform:translateX(10%) scale(1.12)}}
html.is-static .tm06-glow,html.is-static .tm06-glow2{animation:none}
html.is-static {.tm06-glow,.tm06-glow2{animation:none}}
`;

/** TM06 · A tall accent band holds the centred heading and intro; a 3-up grid of portrait cards starts inside the band
 *  and overlaps down into the page below it. */
function TM06() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M13");
  return (
    <Sec innerRef={r} theme="stone" font="editorial" full className="pb-[clamp(72px,9vw,140px)]">
      <style>{TM06_CSS}</style>
      <div className="relative overflow-hidden bg-[var(--sx-accent)] px-[clamp(20px,5vw,96px)] pb-[clamp(200px,20vw,300px)] pt-[clamp(72px,9vw,140px)] text-[var(--sx-accent-text)]">
        <div className="tm06-glow pointer-events-none absolute -left-[10%] -top-[30%] h-[120%] w-[70%] rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,.22),transparent)]" />
        <div className="tm06-glow2 pointer-events-none absolute -bottom-[40%] -right-[10%] h-[120%] w-[60%] rounded-full bg-[radial-gradient(closest-side,rgba(0,0,0,.22),transparent)]" />
        <div className="relative mx-auto max-w-[920px] text-center">
          <H className="text-[clamp(48px,6vw,104px)]">The people who learn your name.</H>
          <P className="mx-auto mt-6 max-w-[48ch] text-[color-mix(in_srgb,var(--sx-accent-text)_82%,transparent)]!">Twelve rooms, twenty-one of us. Meet the three you will see most at Casa Lagoa, a slow guesthouse on the Goan coast.</P>
        </div>
      </div>
      <div className="relative -mt-[clamp(160px,16vw,240px)] grid grid-cols-1 gap-[clamp(16px,2vw,28px)] px-[clamp(20px,5vw,96px)] md:grid-cols-3">
        {TM06_PEOPLE.map((p, k) => (
          <article key={p.n} className="sx-card p-[clamp(12px,1.2vw,16px)] shadow-[0_40px_80px_-50px_rgba(17,20,24,.5)]">
            <div className="fx-pan overflow-hidden rounded-[14px]" style={{ animationDelay: `${-k * 2}s` }}>
              <div className="fx-drift" style={{ animationDelay: `${-k * 2.3}s` }}>
                <Pic i={p.i} ratio="4/5" round={false} label="" />
              </div>
            </div>
            <div className="px-2 pb-2 pt-5">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="sx-display text-[clamp(26px,2.2vw,34px)] leading-none">{p.n}</h3>
              </div>
              <p className="mt-2 text-[14px] font-[600] uppercase tracking-[0.12em] text-[var(--sx-accent)]">{p.r}</p>
              <p className="mt-4 border-t border-[var(--sx-line)] pt-4 text-[15px] leading-relaxed text-[var(--sx-muted)]">
                Ask about <span className="text-[var(--sx-text)]">{p.ask}</span>.
              </p>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-[clamp(40px,5vw,64px)] flex flex-wrap items-center justify-center gap-4 px-6">
        <Btn>Book a room · from ₹9,800</Btn>
        <Btn kind="ghost">Meet the whole house</Btn>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "TM05", name: "Ruled label, split intro, 4-up portraits", motion: "M23", C: TM05 },
  { code: "TM06", name: "Colour band with overlapping portrait cards", motion: "M13", C: TM06 },
];
