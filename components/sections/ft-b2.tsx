"use client";

// FT · Feature layouts, batch 2 (FT11–FT13). Full designed sections; scroll-driven ones use short sticky stages
// (≤ 200svh, overflow-clip). ?static=1 shows each in a sensible final state.
import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { Btn, H, P, Pic, Price, Sec } from "./kit";
import type { SectionDef } from "./types";

/* ───────────────────────── FT11 · Pinned horizontal chapter track ───────────────────────── */

const FT11_CHAPTERS = [
  { t: "Picked ripe, by hand", d: "Only the red cherries, one tree at a time, three passes a season on our Coorg slopes.", f: "1,400 m · shade-grown", i: 0 },
  { t: "Forty hours in the tank", d: "A slow, cool ferment loosens the fruit and builds the plum and cocoa notes.", f: "18 °C · 40 h", i: 1 },
  { t: "Twenty days in the sun", d: "Raised beds, turned every hour, covered at the first sign of rain.", f: "11 % moisture", i: 2 },
  { t: "Eleven minutes in the drum", d: "Roasted in 5 kg batches every Tuesday, rested for four days before packing.", f: "Medium-light", i: 3 },
  { t: "In your cup within weeks", d: "Packed with a roast date, shipped in two days, best between day 7 and day 40.", f: "250 g · ₹780", i: 1 },
];

/** FT11 · The section pins; vertical scroll moves a horizontal track of five chapters (number + title + copy beside a
 *  photo). Each photo travels against its copy (M42: opposite travel). */
function FT11() {
  const tall = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = tall.current;
    const tr = track.current;
    if (!el || !tr || prefersReducedMotion()) return;
    const imgs = Array.from(tr.querySelectorAll<HTMLElement>("[data-par]"));
    const n = imgs.length;
    const set = (p: number) => {
      const max = tr.scrollWidth - tr.parentElement!.clientWidth;
      tr.style.transform = `translate3d(${(-p * max).toFixed(1)}px,0,0)`;
      imgs.forEach((im, k) => (im.style.transform = `translate3d(${((p * (n - 1) - k) * 9).toFixed(2)}%,0,0)`));
      if (bar.current) bar.current.style.transform = `scaleX(${p.toFixed(3)})`;
    };
    const st = ScrollTrigger.create({ trigger: el, start: "top top", end: "bottom bottom", onUpdate: (s) => set(s.progress), onRefresh: (s) => set(s.progress) });
    set(st.progress);
    return () => st.kill();
  }, []);
  return (
    <Sec theme="paper" font="serif" full className="overflow-clip!">
      <div ref={tall} className="relative h-[200svh]">
        <div className="sticky top-0 flex h-[100svh] min-h-[640px] flex-col justify-center overflow-hidden">
          <div className="flex items-end justify-between gap-8 px-[clamp(20px,5vw,96px)]">
            <H className="text-[clamp(36px,3.6vw,60px)]">From cherry to cup.</H>
            <div className="hidden w-[min(28vw,360px)] pb-3 md:block">
              <p className="text-[13px] uppercase tracking-[0.16em] text-[var(--sx-muted)]">Five chapters · 61 days</p>
              <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-[var(--sx-line)]">
                <div ref={bar} className="h-full origin-left scale-x-0 bg-[var(--sx-accent)]" />
              </div>
            </div>
          </div>
          <div className="mt-[clamp(28px,4vw,56px)] overflow-hidden">
            <div ref={track} className="flex w-max gap-[clamp(24px,3vw,48px)] px-[clamp(20px,5vw,96px)] will-change-transform">
              {FT11_CHAPTERS.map((c, k) => (
                <article key={c.t} className="grid w-[clamp(320px,62vw,1000px)] shrink-0 grid-cols-1 items-center gap-[clamp(20px,3vw,48px)] md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
                  <div>
                    <p className="sx-display text-[clamp(88px,10vw,168px)] font-[300] leading-[0.8] tracking-[-0.05em] text-[var(--sx-accent)]">{String(k + 1).padStart(2, "0")}</p>
                    <h3 className="sx-display mt-6 text-[clamp(28px,2.6vw,44px)] font-[600] leading-[1.02] tracking-[-0.01em]">{c.t}</h3>
                    <p className="mt-4 max-w-[36ch] text-[clamp(15px,1.1vw,18px)] leading-relaxed text-[var(--sx-muted)]">{c.d}</p>
                    <p className="mt-6 inline-block border-t border-[var(--sx-line)] pt-3 text-[14px] font-[600]">{c.f}</p>
                    {k === FT11_CHAPTERS.length - 1 && (
                      <div className="mt-6">
                        <Btn>Order the estate roast</Btn>
                      </div>
                    )}
                  </div>
                  <div className="relative aspect-[4/5] max-h-[62svh] overflow-hidden rounded-[var(--sx-radius,18px)]">
                    <div data-par className="absolute inset-y-0 -left-[14%] -right-[14%] will-change-transform">
                      <div className="fx-drift absolute inset-0">
                        <Pic i={c.i} ratio="auto" round={false} className="fx-pan absolute inset-0 h-full w-full" label={`CHAPTER 0${k + 1}`} />
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── FT12 · Stacked pinned card pile ───────────────────────── */

const FT12_STEPS = [
  { s: "Cleanse", n: "Rice Water Gel Cleanser", d: "A low-foam gel that lifts sunscreen and city grime without the squeak.", p: "₹690", sz: "150 ml", i: 2 },
  { s: "Treat", n: "10% Niacinamide Serum", d: "Evens tone and calms redness in four weeks. Three drops, morning and night.", p: "₹1,150", sz: "30 ml", i: 1 },
  { s: "Hydrate", n: "Cica Cloud Cream", d: "Whipped, weightless and fragrance free. Holds water in the skin for 72 hours.", p: "₹890", sz: "50 g", i: 3 },
  { s: "Protect", n: "Invisible SPF 50 Fluid", d: "No white cast on any skin tone, no grease by noon. Wear it every single day.", p: "₹790", sz: "50 ml", i: 0 },
];

/** FT12 · Full-width cards (copy + image) pin near the top; each next card slides over the last while earlier cards
 *  scale back and dim into a pile (M40). Short sticky stage. Static: the finished pile. */
function FT12() {
  const tall = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = tall.current;
    const sg = stage.current;
    if (!el || !sg) return;
    const cards = Array.from(sg.querySelectorAll<HTMLElement>("[data-pile]"));
    const n = cards.length;
    const set = (p: number) => {
      cards.forEach((c, i) => {
        const over = gsap.utils.clamp(0, n - 1 - i, p * (n - 1) - i);
        const y = gsap.utils.clamp(0, 1, i - p * (n - 1)) * 118;
        c.style.transform = `translateY(calc(${y.toFixed(2)}% - ${(over * 22).toFixed(1)}px)) scale(${(1 - over * 0.05).toFixed(4)})`;
        c.style.filter = `brightness(${(1 - over * 0.22).toFixed(3)})`;
      });
    };
    if (prefersReducedMotion()) return set(1);
    const st = ScrollTrigger.create({ trigger: el, start: "top top", end: "bottom bottom", onUpdate: (s) => set(gsap.utils.clamp(0, 1, s.progress * 1.12)), onRefresh: (s) => set(gsap.utils.clamp(0, 1, s.progress * 1.12)) });
    set(gsap.utils.clamp(0, 1, st.progress * 1.12));
    return () => st.kill();
  }, []);
  return (
    <Sec theme="ink" font="grotesk" full className="overflow-clip!">
      <div ref={tall} className="relative h-[200svh]">
        <div className="sticky top-0 flex h-[100svh] min-h-[680px] flex-col overflow-hidden px-[clamp(20px,5vw,96px)] pt-[clamp(48px,6vw,88px)] pb-[clamp(28px,3vw,48px)]">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <H className="text-[clamp(40px,4.6vw,76px)]">Four steps, ten minutes.</H>
            <p className="max-w-[36ch] pb-2 text-[16px] leading-relaxed text-[var(--sx-muted)]">The full routine for <Price now="₹3,020" was="₹3,520" className="text-[var(--sx-text)]" />, or pick only what your skin asks for.</p>
          </div>
          <div ref={stage} className="relative mt-[clamp(96px,7.5vw,128px)] flex-1">
            {FT12_STEPS.map((c, k) => (
              <article key={c.s} data-pile className="sx-card absolute inset-0 grid origin-top grid-cols-1 overflow-hidden bg-[var(--sx-surface)] shadow-[0_-30px_60px_-30px_rgba(0,0,0,.7)] will-change-transform md:grid-cols-12" style={{ zIndex: k + 1 }}>
                <div className="flex flex-col justify-between p-[clamp(24px,3.2vw,52px)] md:col-span-5">
                  <div>
                    <p className="text-[14px] font-[600] text-[var(--sx-accent)]">Step {k + 1} · {c.s}</p>
                    <h3 className="sx-display mt-4 text-[clamp(32px,3.4vw,56px)] font-[700] leading-[0.98] tracking-[-0.02em]">{c.n}</h3>
                    <p className="mt-4 max-w-[38ch] text-[clamp(15px,1.1vw,18px)] leading-relaxed text-[var(--sx-muted)]">{c.d}</p>
                  </div>
                  <div className="mt-8 flex flex-wrap items-center gap-5">
                    <Btn>Add · {c.p}</Btn>
                    <span className="text-[14px] text-[var(--sx-muted)]">{c.sz}</span>
                  </div>
                </div>
                <div className="relative min-h-[240px] overflow-hidden md:col-span-7">
                  <div className="fx-pan absolute -inset-[4%]">
                    <Pic i={c.i} ratio="auto" round={false} className="fx-drift absolute inset-0 h-full w-full" label={c.s.toUpperCase()} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── FT13 · Headline orbited by floating cards ───────────────────────── */

const FT13_CSS = `
.ft13-bob{animation:ft13-bob var(--d) ease-in-out infinite alternate}
@keyframes ft13-bob{from{translate:0 -9px;rotate:-1.2deg}to{translate:0 9px;rotate:1.2deg}}
html.is-static .ft13-bob{animation:none}
html.is-static {.ft13-bob{animation:none}}
`;
const FT13_CARDS = [
  { v: "160 mg", l: "natural caffeine, from green coffee", pos: "md:left-0 md:top-[4%]", bar: 0.8 },
  { v: "0 g", l: "sugar · sweetened with stevia leaf", pos: "md:right-0 md:top-[2%]", bar: 0.05 },
  { v: "6 h", l: "of steady focus, no four o'clock dip", pos: "md:left-[3%] md:top-[40%]", bar: 0.62 },
  { v: "+4", l: "electrolytes for long, hot days", pos: "md:right-[2%] md:top-[42%]", bar: 0.45 },
  { v: "12 kcal", l: "per 250 ml can", pos: "md:left-[1%] md:bottom-[2%]", bar: 0.12 },
  { v: "120%", l: "of your daily B12", pos: "md:right-[4%] md:bottom-[4%]", bar: 1 },
];

/** FT13 · A centred headline; six metric cards fly in from the centre and tilt out of 3D into corner and side
 *  positions around it as you scroll (M31), then float gently in place. */
function FT13() {
  const r = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const cards = Array.from(el.querySelectorAll<HTMLElement>("[data-orbit]"));
      const box = el.querySelector<HTMLElement>("[data-ft13-stage]")!;
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 90%", end: "top 10%", scrub: true, invalidateOnRefresh: true } });
      cards.forEach((c, k) => {
        const toCentre = () => {
          const b = box.getBoundingClientRect();
          const cr = c.getBoundingClientRect();
          return { x: b.left + b.width / 2 - (cr.left + cr.width / 2) - (Number(gsap.getProperty(c, "x")) || 0), y: b.top + b.height / 2 - (cr.top + cr.height / 2) - (Number(gsap.getProperty(c, "y")) || 0) };
        };
        const left = k % 2 === 0;
        tl.fromTo(
          c,
          { x: () => toCentre().x * 0.75, y: () => toCentre().y * 0.75, rotationY: left ? 70 : -70, rotationX: 35, scale: 0.55, opacity: 0 },
          { x: 0, y: 0, rotationY: 0, rotationX: 0, scale: 1, opacity: 1, ease: "power2.out", duration: 1 },
          k * 0.08,
        );
      });
      tl.from(el.querySelectorAll("[data-ft13-copy]"), { y: 30, opacity: 0, ease: "power2.out", duration: 0.5, stagger: 0.08 }, 0);
    }, el);
    return () => ctx.revert();
  }, []);
  return (
    <Sec innerRef={r} theme="stone" font="condensed" className="py-[clamp(72px,9vw,140px)]">
      <style>{FT13_CSS}</style>
      <div data-ft13-stage className="relative flex flex-col items-center md:min-h-[clamp(620px,78svh,820px)] md:justify-center [perspective:1400px]">
        <div className="relative z-10 mx-auto max-w-[min(46%,640px)] text-center max-md:max-w-none">
          <h2 data-ft13-copy className="sx-display text-balance text-[clamp(56px,6.4vw,112px)] font-[800] uppercase leading-[0.88] tracking-[-0.01em]">Focus that outlasts four o&apos;clock.</h2>
          <p data-ft13-copy className="mx-auto mt-6 max-w-[40ch] text-[clamp(16px,1.2vw,19px)] leading-relaxed text-[var(--sx-muted)]">Clean energy with yuzu and sea salt. Slow-release caffeine, nothing you can&apos;t pronounce.</p>
          <div data-ft13-copy className="mt-8 flex flex-wrap items-center justify-center gap-5">
            <Price now="₹1,320" was="₹1,440" className="text-[18px]" />
            <Btn>Shop a 12-pack</Btn>
          </div>
        </div>
        <div className="mt-10 grid w-full grid-cols-2 gap-3 md:contents">
          {FT13_CARDS.map((c, k) => (
            <div key={c.v} data-orbit className={`md:absolute ${c.pos}`}>
              <div className="ft13-bob sx-card w-full bg-[var(--sx-surface)] p-[clamp(16px,1.6vw,24px)] shadow-[0_30px_60px_-34px_rgba(17,20,24,.45)] md:w-[clamp(200px,16vw,240px)]" style={{ ["--d" as string]: `${2.6 + k * 0.45}s`, animationDelay: `${-k * 0.7}s` }}>
                <p className="sx-display text-[clamp(36px,3.2vw,52px)] font-[800] leading-none tabular-nums">{c.v}</p>
                <p className="mt-2 text-[14px] leading-snug text-[var(--sx-muted)]">{c.l}</p>
                <div className="mt-4 h-[4px] overflow-hidden rounded-full bg-[var(--sx-line)]">
                  <div className="h-full rounded-full bg-[var(--sx-accent)]" style={{ width: `${Math.max(6, c.bar * 100)}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "FT11", name: "Pinned horizontal chapter track", motion: "M42", C: FT11 },
  { code: "FT12", name: "Stacked pinned card pile", motion: "M40", C: FT12 },
  { code: "FT13", name: "Headline orbited by floating cards", motion: "M31", C: FT13 },
];
