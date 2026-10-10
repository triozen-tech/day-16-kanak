"use client";

// SY · Story layouts, batch 3 (docs/SECTION-MENU.md): SY09 sticky image chapters with copy beneath, SY10 sticky-date
// timeline with a scroll beam. Each keeps moving while on screen (hands-free for filming) and shows its final state in
// ?static=1.
import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/* ───────────────────────────── SY09 · Sticky image chapters with copy beneath ───────────────────────────── */

const ROOMS = [
  { t: "The house", i: 3, h: "Nine rooms, one long verandah.", d: "A 1920s planter’s bungalow above Kasauli, restored beam by beam. Every room opens onto the deodars; none has a television.", m: "From ₹14,500 a night · breakfast included" },
  { t: "The kitchen", i: 1, h: "Supper from the hillside.", d: "Our cook, Nanda Thakur, works from the walled garden and the village market. Rajma on Sundays, apricot tart when the trees allow.", m: "Seven-course supper · ₹3,200 a guest" },
  { t: "The forest", i: 2, h: "Walks that start at the gate.", d: "Three marked trails through oak and pine, from a forty-minute loop to a full day to the ridge. Packed lunches and walking sticks are ours to lend.", m: "Guided dawn walk · ₹900" },
];
const SY09_CSS = `.sy09-kb{animation:sy09-kb 6s ease-in-out infinite alternate}.sy09-kb.alt{animation-duration:4.6s;animation-direction:alternate-reverse}@keyframes sy09-kb{from{transform:scale(1) translate(0,0)}to{transform:scale(1.12) translate(-2.5%,-2%)}}.is-static .sy09-kb{animation:none}html.is-static {.sy09-kb{animation:none}}`;

/** SY09 · Three chapters: a rounded full-width image with a big title sticks near the top while a two-column copy block scrolls up beneath it. */
function SY09() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M13");
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]" style={{ overflow: "clip" }}>
      <style>{SY09_CSS}</style>
      <div className="flex flex-col gap-[clamp(48px,6vw,96px)]">
        {ROOMS.map((c, k) => (
          <section key={c.t} className="relative">
            <div className="sticky top-[3vh] z-10 h-[clamp(380px,58vh,620px)] overflow-hidden rounded-[28px] shadow-[0_30px_60px_-40px_rgba(28,24,19,.6)]">
              <div className={`sy09-kb ${k % 2 ? "alt" : ""} absolute inset-0`}>
                <Pic i={c.i} ratio="auto" round={false} label="" className="absolute inset-0 h-full w-full" />
              </div>
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,16,12,.05),rgba(20,16,12,.55))]" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-[clamp(24px,3.4vw,52px)]">
                <h3 className="sx-display text-[clamp(56px,8vw,132px)] font-[500] leading-[0.9] tracking-[-0.02em] text-white">{c.t}</h3>
                <span className="mb-3 shrink-0 rounded-full border border-white/30 bg-black/25 px-4 py-2 text-[13px] text-white backdrop-blur max-md:hidden">
                  Chapter {k + 1} of {ROOMS.length}
                </span>
              </div>
            </div>
            {/* copy block: scrolls up and slides under the stuck image */}
            <div className="relative z-0 grid grid-cols-1 gap-6 px-[clamp(8px,2vw,32px)] pb-[clamp(24px,6vh,64px)] pt-[clamp(40px,5vw,72px)] md:grid-cols-12">
              <H as="h3" className="text-[clamp(30px,3vw,48px)] font-[500] leading-[1.05] md:col-span-5">{c.h}</H>
              <div className="md:col-span-6 md:col-start-7">
                <P>{c.d}</P>
                <div className="mt-6 flex flex-wrap items-center gap-5">
                  <span className="text-[15px] font-[600]">{c.m}</span>
                  {k === 0 ? <Btn>Check dates</Btn> : <Btn kind="link">Read more →</Btn>}
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
    </Sec>
  );
}

/* ───────────────────────────── SY10 · Sticky-date timeline with scroll beam ───────────────────────────── */

const YEARS = [
  { y: "1962", h: "A pan of cocoa in Kottayam", d: "Ammini Varghese roasts beans from her own trees in a kitchen pan and sells slabs at the Sunday market, wrapped in banana leaf.", i: [3, 1, 2, 0] },
  { y: "1988", h: "The first stone grinder", d: "Her son Thomas builds a granite melanger by hand. Bars go to eleven shops in three towns; the recipe stays two ingredients.", i: [1, 2, 0, 3] },
  { y: "2009", h: "Single-estate bars", d: "We start naming the farm on every wrapper and paying growers above the fair-trade floor. The 70% Idukki wins its first award.", i: [2, 0, 3, 1] },
  { y: "2024", h: "Third generation, same pan", d: "Meera Varghese runs the factory now. The original pan hangs by the door; the Kottayam 72 still costs less than a cinema ticket.", i: [0, 3, 1, 2] },
];
const SY10_CSS = `.sy10-beam{background:linear-gradient(180deg,transparent,var(--sx-accent) 20%,#e2b450 50%,var(--sx-accent) 80%,transparent);background-size:100% 300px;animation:sy10-beam 1.8s linear infinite}@keyframes sy10-beam{to{background-position:0 300px}}.sy10-kb img{animation:sy10-kb 5s ease-in-out infinite alternate}.sy10-kb.alt img{animation-duration:6.8s;animation-direction:alternate-reverse}@keyframes sy10-kb{from{transform:scale(1.04)}to{transform:scale(1.2) translate(3%,-2%)}}.is-static .sy10-beam,.is-static .sy10-kb img{animation:none}html.is-static {.sy10-beam,.sy10-kb img{animation:none}}`;

/** SY10 · Intro, then entries: a huge year sticks on the left (with a dot on a vertical line) while text + a 2×2 image grid scroll on the right; the line fills with a gradient beam. */
function SY10() {
  const r = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  useEffect(() => {
    const l = line.current;
    const f = fill.current;
    if (!l || !f || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(f, { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: l, start: "top 55%", end: "bottom 55%", scrub: true } });
    }, l);
    return () => ctx.revert();
  }, []);
  return (
    <Sec innerRef={r} theme="stone" font="condensed" className="py-[clamp(72px,9vw,140px)]" style={{ overflow: "clip" }}>
      <style>{SY10_CSS}</style>
      <div className="grid grid-cols-1 items-end gap-8 md:grid-cols-12">
        <H className="text-[clamp(52px,6.6vw,112px)] uppercase md:col-span-7">Sixty years, one pan.</H>
        <div className="md:col-span-5">
          <P>How a market stall in Kottayam became a bean-to-bar maker, still family-run and still roasting on Tuesdays.</P>
          <div className="mt-6">
            <Btn kind="ghost">Visit the factory</Btn>
          </div>
        </div>
      </div>

      <div ref={line} className="relative mt-[clamp(56px,7vw,110px)]">
        {/* the line + its scroll beam */}
        <div className="absolute bottom-0 left-[15px] top-0 w-[4px] rounded-full bg-[var(--sx-line)]" />
        <div ref={fill} className="sy10-beam absolute bottom-0 left-[15px] top-0 w-[4px] origin-top rounded-full shadow-[0_0_18px_2px_color-mix(in_srgb,var(--sx-accent)_45%,transparent)]" />
        <div className="flex flex-col gap-[clamp(64px,9vw,140px)]">
          {YEARS.map((e, k) => (
            <article key={e.y} className="grid grid-cols-1 gap-6 md:grid-cols-[35%_minmax(0,1fr)]">
              <div className="relative self-start pl-[52px] md:sticky md:top-[16vh]">
                <span className="absolute left-[5px] top-[0.55em] h-6 w-6 rounded-full border-4 border-[var(--sx-bg)] bg-[var(--sx-accent)] shadow-[0_0_0_1px_var(--sx-line)]" />
                <p className="sx-display text-[clamp(72px,9vw,150px)] font-[800] leading-[0.85] tracking-[-0.02em]">{e.y}</p>
              </div>
              <div className="pl-[52px] md:pl-0">
                <h3 data-m-head className="sx-display text-[clamp(28px,2.6vw,42px)] font-[700] uppercase leading-[1]">{e.h}</h3>
                <P className="mt-4 max-w-[56ch]">{e.d}</P>
                <div className="mt-8 grid max-w-[620px] grid-cols-2 gap-[clamp(10px,1.2vw,16px)]">
                  {e.i.map((im, n) => (
                    <div key={n} className={`sy10-kb ${(n + k) % 2 ? "alt" : ""} overflow-hidden rounded-[var(--sx-radius)]`}>
                      <Pic i={im} ratio="4/3" round={false} label="" />
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "SY09", name: "Sticky image chapters with copy beneath", motion: "M13", C: SY09 },
  { code: "SY10", name: "Sticky-date timeline with scroll beam", motion: "M23", C: SY10 },
];
