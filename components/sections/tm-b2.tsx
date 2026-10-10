"use client";

// TM · Team / founders layouts, batch 2 (docs/SECTION-MENU.md). Every person is invented; photos are placeholders.
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { Btn, H, P, Pic, Price, Sec } from "./kit";
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

/* ───────────────────────── TM03 · Rotating founders wheel ───────────────────────── */

const TM03_STEP = 48; // degrees between founders on the wheel
const TM03_CSS = `
.tm03-ring { animation: tm03-spin 40s linear infinite; }
.tm03-ring-r { animation: tm03-spin 60s linear infinite reverse; }
@keyframes tm03-spin { to { transform: rotate(1turn); } }
.tm03-face { animation: tm03-face 4.6s ease-in-out infinite alternate; }
@keyframes tm03-face { from { transform: scale(1.04) translate(-2%, 1%); } to { transform: scale(1.16) translate(2%, -2%); } }
html.is-static .tm03-ring, html.is-static .tm03-ring-r, html.is-static .tm03-face { animation: none; }
html.is-static { .tm03-ring, .tm03-ring-r, .tm03-face { animation: none; } }
`;

/** TM03 · Pinned founders wheel: three portraits sit on a big wheel centred below the bottom edge; scrolling rotates the
 *  wheel so each founder comes up to the top while their bio fades in on the left. Short sticky stage (200svh). */
function TM03() {
  const tall = useRef<HTMLDivElement>(null);
  const wheel = useRef<HTMLDivElement>(null);
  const [a, setA] = useState(0);
  const founders = [
    { n: "Ira Menon", role: "Co-founder · Sourcing", i: 0, b: "Spent six years walking cacao farms in Idukki and West Godavari. Pays every grower 40% over the market rate, and names them on the wrapper.", q: "Good chocolate starts on a farm you can visit." },
    { n: "Kabir Shah", role: "Co-founder · Head chocolatier", i: 3, b: "Trained in a three-room workshop in Lyon, came home to build a stone melanger out of a wet grinder. Still tastes every batch at 6 am.", q: "Seventy-two hours of grinding. No shortcuts." },
    { n: "Anaya Rao", role: "Co-founder · Design", i: 1, b: "Draws every wrapper by hand from the farm it came from. Made our packaging fully compostable in the first year, before the first sale.", q: "The wrapper should tell you where you are." },
  ];
  useEffect(() => {
    const el = tall.current;
    const w = wheel.current;
    if (!el || !w || prefersReducedMotion()) return;
    const ease = gsap.parseEase("power2.inOut");
    const last = founders.length - 1;
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        // hold a little at both ends, ease into each stop so the founder "lands" at the top
        const q = gsap.utils.clamp(0, last, ((self.progress - 0.08) / 0.84) * last);
        const seg = Math.min(last - 1, Math.floor(q));
        const pos = seg + ease(q - seg);
        w.style.setProperty("--rot", `${(-pos * TM03_STEP).toFixed(2)}deg`);
        setA(Math.round(pos));
      },
    });
    return () => st.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Sec theme="paper" font="serif" full className="overflow-clip!">
      <style>{TM03_CSS}</style>
      <div ref={tall} className="relative h-[200svh]">
        <div className="sticky top-0 h-[100svh] min-h-[620px] overflow-hidden">
          {/* the wheel: centre point just below the bottom edge */}
          <div className="pointer-events-none absolute left-[66%] top-[calc(100%+40px)] h-0 w-0 [--w:clamp(720px,62vw,980px)] max-md:left-1/2">
            <div className="tm03-ring absolute left-1/2 top-1/2 h-[calc(var(--w)+120px)] w-[calc(var(--w)+120px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[var(--sx-line)]" />
            <div className="tm03-ring-r absolute left-1/2 top-1/2 h-[calc(var(--w)-180px)] w-[calc(var(--w)-180px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[repeating-conic-gradient(from_0deg,color-mix(in_srgb,var(--sx-accent)_30%,transparent)_0deg_1.2deg,transparent_1.2deg_12deg)] [mask:radial-gradient(closest-side,transparent_calc(100%-26px),#000_calc(100%-25px))]" />
            <div ref={wheel} className="absolute left-1/2 top-1/2 h-[var(--w)] w-[var(--w)] rounded-full border border-[var(--sx-line)] bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_10%,transparent),transparent)]" style={{ transform: "translate(-50%,-50%) rotate(var(--rot, 0deg))" }}>
              {founders.map((f, k) => (
                <div key={f.n} className="absolute left-1/2 top-1/2 h-0 w-0" style={{ transform: `rotate(${k * TM03_STEP}deg)` }}>
                  <div className="absolute left-0 top-0" style={{ transform: "translate(-50%, -50%) translateY(calc(var(--w) / -2))" }}>
                    <div style={{ transform: `rotate(calc(${-k * TM03_STEP}deg - var(--rot, 0deg)))` }}>
                      <div className={`w-[clamp(190px,17vw,260px)] transition-[scale,opacity] duration-700 ${k === a ? "scale-100 opacity-100" : "scale-[.62] opacity-50"}`}>
                        <div className="relative overflow-hidden rounded-[999px_999px_24px_24px] shadow-[0_40px_60px_-30px_rgba(28,24,19,.55)]" style={{ aspectRatio: "4/5" }}>
                          <div className="tm03-face absolute inset-0">
                            <Pic i={f.i} ratio="auto" round={false} className="absolute inset-0 h-full w-full" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* bio column */}
          <div className="relative z-10 flex h-full flex-col justify-center px-[clamp(20px,5vw,96px)] pb-[18vh] md:max-w-[46%] md:pb-0">
            <H className="max-w-[11ch] text-[clamp(44px,5.4vw,92px)]">Three founders, one bar.</H>
            <div className="mt-[clamp(28px,3.4vw,52px)] grid">
              {founders.map((f, k) => (
                <div key={f.n} className={`[grid-area:1/1] transition-[opacity,translate] duration-700 ${k === a ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"}`} aria-hidden={k !== a}>
                  <p className="text-[13px] font-[650] uppercase tracking-[0.16em] text-[var(--sx-accent)]">{f.role}</p>
                  <p className="sx-display mt-2 text-[clamp(32px,3vw,48px)] leading-none">{f.n}</p>
                  <p className="mt-4 max-w-[40ch] text-[clamp(16px,1.2vw,18px)] leading-relaxed text-[var(--sx-muted)]">{f.b}</p>
                  <p className="sx-display mt-5 max-w-[30ch] text-[clamp(20px,1.6vw,24px)] italic leading-snug">&ldquo;{f.q}&rdquo;</p>
                </div>
              ))}
            </div>
            <div className="mt-[clamp(24px,3vw,40px)] flex flex-wrap items-center gap-5">
              <Btn kind="ghost">Read our story</Btn>
              <span className="text-[15px] text-[var(--sx-muted)]">
                Founders&apos; tasting box · <Price now="₹1,250" className="text-[var(--sx-text)]" />
              </span>
            </div>
          </div>
          {/* position dots */}
          <div className="absolute bottom-[clamp(20px,3vw,40px)] left-[clamp(20px,5vw,96px)] z-10 flex gap-2">
            {founders.map((f, k) => (
              <span key={f.n} className={`h-[6px] rounded-full transition-all duration-500 ${k === a ? "w-8 bg-[var(--sx-accent)]" : "w-[6px] bg-[var(--sx-line)]"}`} />
            ))}
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── TM04 · Hover-reveal bio portrait cards ───────────────────────── */

/** TM04 · Four tall darkened portrait cards with role and name at the bottom; the bio slides up from below on hover, and
 *  steps through the cards by itself while on screen. Booking strip underneath. */
function TM04() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M13");
  const team = [
    { n: "Meher Kapoor", role: "Head chef", i: 3, b: "Cooks over coconut husk and charcoal. Builds the nine courses around whatever came off the Malvan boats that morning." },
    { n: "Rohan Pillai", role: "Pastry", i: 1, b: "Laminates his own dough at 4 am. The jaggery mille-feuille has been on the menu since opening night." },
    { n: "Tara Iyer", role: "Tea & pairings", i: 2, b: "Pairs each course with a single-estate tea instead of wine, brewed cold, hot or smoked at the table." },
    { n: "Dev Arora", role: "Bread & ferments", i: 0, b: "Keeps a nine-year-old sourdough starter and a shelf of kanji, kokum and pickled mango ferments." },
  ];
  const [a, setA] = useAutoCycle(r, team.length, 2000);
  return (
    <Sec innerRef={r} theme="ink" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <style>{`
        .tm04-img { animation: tm04-img 5.4s ease-in-out infinite alternate; }
        @keyframes tm04-img { from { scale: 1; } to { scale: 1.08; } }
        .tm04-pan { animation: tm04-pan 3.8s ease-in-out infinite alternate; }
        @keyframes tm04-pan { from { translate: -1.5% 0; } to { translate: 1.5% -1%; } }
        html.is-static .tm04-img, html.is-static .tm04-pan { animation: none; }
        html.is-static { .tm04-img, .tm04-pan { animation: none; } }
      `}</style>
      <div className="grid grid-cols-1 items-end gap-6 md:grid-cols-12">
        <H className="text-[clamp(52px,6.6vw,116px)] md:col-span-7">The hands behind the menu.</H>
        <P className="max-w-[38ch] pb-2 md:col-span-5">Four cooks, one open kitchen and a counter of fourteen seats. Meet them before you sit down.</P>
      </div>
      <div className="mt-[clamp(40px,6vw,80px)] grid grid-cols-1 gap-[clamp(10px,1.2vw,18px)] md:grid-cols-4">
        {team.map((m, k) => {
          const on = k === a;
          return (
            <article key={m.n} onMouseEnter={() => setA(k)} className="relative overflow-hidden rounded-[var(--sx-radius)]" style={{ aspectRatio: "3/4.4" }}>
              <div className="tm04-pan absolute inset-[-3%]">
                <Pic i={m.i} ratio="auto" round={false} className="tm04-img absolute inset-0 h-full w-full" />
              </div>
              <div className={`absolute inset-0 transition-colors duration-700 ${on ? "bg-[rgba(7,9,15,.62)]" : "bg-[linear-gradient(180deg,rgba(7,9,15,.15),rgba(7,9,15,.78))]"}`} />
              <div className="absolute inset-x-0 bottom-0 p-[clamp(18px,1.8vw,28px)] text-white">
                <p className="text-[12px] font-[650] uppercase tracking-[0.18em] text-white/65">{m.role}</p>
                <p className="sx-display mt-1 text-[clamp(28px,2.4vw,40px)] leading-none">{m.n}</p>
                <div className={`grid transition-[grid-template-rows] duration-700 ease-[cubic-bezier(.2,.8,.2,1)] ${on ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <div className="overflow-hidden">
                    <p className={`pt-4 text-[15px] leading-relaxed text-white/85 transition-[opacity,translate] duration-700 ${on ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>{m.b}</p>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <div className="mt-[clamp(32px,4vw,56px)] flex flex-wrap items-center justify-between gap-6 border-t border-[var(--sx-line)] pt-8">
        <p className="text-[clamp(16px,1.3vw,19px)]">
          Chef&apos;s counter · nine courses · <Price now="₹6,500" /> per guest · Thursday to Sunday
        </p>
        <Btn>Book the counter</Btn>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "TM03", name: "Rotating founders wheel", motion: "M33", C: TM03 },
  { code: "TM04", name: "Hover-reveal bio portrait cards", motion: "M13", C: TM04 },
];
