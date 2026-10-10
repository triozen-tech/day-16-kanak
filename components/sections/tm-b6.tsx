"use client";

// TM · Team layouts, batch 6 (docs/SECTION-MENU.md). All people are invented (initials-free portraits are placeholders).
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

const noop = (e: React.MouseEvent) => e.preventDefault();

/** Scoped keyframes (off in ?static=1 and with reduced motion). The glow is the CSS-only never-frozen safety net. */
const TM_CSS = `
.tmb6-glow{animation:tmb6-glow 4.8s linear infinite alternate}
@keyframes tmb6-glow{from{transform:translate(-16%,-8%) scale(.9)}to{transform:translate(20%,12%) scale(1.16)}}
.tmb6-glow2{animation:tmb6-glow2 3.6s linear infinite alternate}
@keyframes tmb6-glow2{from{transform:translate(12%,14%) scale(1.12)}to{transform:translate(-16%,-10%) scale(.86)}}
html.is-static .tmb6-glow,html.is-static .tmb6-glow2{animation:none}
html.is-static {.tmb6-glow,.tmb6-glow2{animation:none}}
`;

const Glow = ({ className = "", alt = false }: { className?: string; alt?: boolean }) => (
  <div
    aria-hidden
    className={`${alt ? "tmb6-glow2" : "tmb6-glow"} pointer-events-none absolute aspect-square rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_38%,transparent),transparent)] ${className}`}
  />
);

/** Generic social marks (simple shapes, not real logos). */
const Social = ({ k }: { k: number }) => (
  <a href="#" onClick={noop} aria-label="Profile link" className="grid h-9 w-9 place-items-center rounded-full border border-[var(--sx-line)] text-[var(--sx-muted)] transition-colors hover:text-[var(--sx-text)]">
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      {k === 0 && <rect x="5" y="5" width="14" height="14" rx="4" />}
      {k === 1 && <path d="M4 7h16v10H4zM4 7l8 6 8-6" />}
      {k === 2 && <path d="M6 18V9M6 6v.01M10 18v-5a3 3 0 0 1 6 0v5M10 9v9" />}
    </svg>
  </a>
);

/* ───────────────────────── TM11 · Horizontal profile cards (2-up) ───────────────────────── */

const TM11_PEOPLE = [
  { n: "Ira Menon", r: "Founder · interior architect", b: "Twelve years of courtyard homes in Kerala. Starts every project by sitting in the empty room for an hour.", i: 3 },
  { n: "Kabir Shah", r: "Head of joinery", b: "Runs the teak workshop in Mysuru. Every drawer we ship has been opened and shut by him at least once.", i: 0 },
  { n: "Noor Fatima", r: "Colour and textiles", b: "Builds each palette from lime plaster, khadi and the light a room gets at four in the afternoon.", i: 2 },
  { n: "Dev Arora", r: "Projects and site lead", b: "Keeps nine trades on one calendar and sends you a photo of the site every Friday, finished or not.", i: 1 },
];

/** TM11 · A 2-column grid of cards: portrait on the left (≈40%), name, role, a two-line bio and social links on the right.
 *  The spotlight passes from card to card by itself. */
function TM11() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M18");
  const [act] = useAutoCycle(r, TM11_PEOPLE.length, 2000);
  return (
    <Sec innerRef={r} theme="stone" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <style>{TM_CSS}</style>
      <Glow className="left-[24%] top-[30%] w-[54vw]" />
      <div className="relative z-10">
        <div className="grid grid-cols-1 items-end gap-[clamp(20px,3vw,48px)] md:grid-cols-12">
          <H className="text-[clamp(44px,5.4vw,88px)] md:col-span-7">The four people in your rooms.</H>
          <div className="md:col-span-5 md:pb-2">
            <P className="max-w-[40ch]">Studio Ardent is small on purpose. The person who draws your plan is the one who stands on site with you.</P>
          </div>
        </div>

        <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 gap-[clamp(16px,1.8vw,28px)] md:grid-cols-2">
          {TM11_PEOPLE.map((p, k) => (
            <article
              key={p.n}
              data-m-card
              className={`sx-card grid grid-cols-1 overflow-hidden transition-[background-color,border-color,box-shadow] duration-500 sm:grid-cols-[40%_minmax(0,1fr)] ${k === act ? "border-[var(--sx-accent)] bg-[var(--sx-surface)] shadow-[0_30px_60px_-36px_rgba(17,20,24,.45)]" : "bg-[var(--sx-bg)]"}`}
            >
              <div className="relative min-h-[260px] overflow-hidden">
                <div className={`absolute inset-0 transition-[scale] duration-[1600ms] ease-out ${k === act ? "scale-[1.08]" : "scale-100"}`}>
                  <Pic i={p.i} ratio="auto" round={false} label="" className="absolute inset-0 h-full w-full" />
                </div>
              </div>
              <div className="flex flex-col justify-between gap-6 p-[clamp(20px,2.2vw,32px)]">
                <div>
                  <h3 className="sx-display text-[clamp(28px,2.4vw,38px)] font-[600] leading-[1]">{p.n}</h3>
                  <p className={`mt-2 text-[14px] font-[600] transition-colors duration-500 ${k === act ? "text-[var(--sx-accent)]" : "text-[var(--sx-muted)]"}`}>{p.r}</p>
                  <p className="mt-4 max-w-[38ch] text-[16px] leading-relaxed text-[var(--sx-muted)]">{p.b}</p>
                </div>
                <div className="flex items-center gap-2">
                  {[0, 1, 2].map((s) => (
                    <Social key={s} k={s} />
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-6 border-t border-[var(--sx-line)] pt-8">
          <span className="text-[15px] text-[var(--sx-muted)]">Taking four new homes for spring · consultations from ₹6,500</span>
          <Btn>Book a site visit</Btn>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── TM12 · Intro half + duo portraits ───────────────────────── */

const TM12_DUO = [
  { n: "Meher Kapoor", r: "Perfumer · the nose", i: 1 },
  { n: "Arjun Rao", r: "Maker · bottles and boxes", i: 3 },
];

/** TM12 · Two halves: heading and paragraph on the left; on the right a pair of tall portraits (curtain-open) with name
 *  and role under each. */
function TM12() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M1");
  return (
    <Sec innerRef={r} theme="ink" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <style>{TM_CSS}</style>
      <Glow className="right-[-6%] top-[8%] w-[48vw]" alt />
      <Glow className="-left-[12%] bottom-[-20%] w-[40vw]" />
      <div className="relative z-10 grid grid-cols-1 items-center gap-[clamp(40px,5vw,96px)] md:grid-cols-12">
        <div className="md:col-span-5">
          <H className="text-[clamp(48px,5.4vw,90px)]">Two people, one quiet perfume house.</H>
          <P className="mt-7 max-w-[40ch]">Meher spent a decade composing for other labels in Grasse; Arjun grew up in his family&apos;s glassworks in Firozabad. In 2019 they came home to Pondicherry and started making the scents they actually wear.</P>
          <P className="mt-4 max-w-[40ch]">Every bottle is blended in batches of eighty, and both of them smell every one before it leaves.</P>
          <div className="mt-9 flex flex-wrap items-center gap-6">
            <Btn>Shop the six scents</Btn>
            <Btn kind="link">Read our story</Btn>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-[clamp(14px,1.8vw,28px)] md:col-span-7">
          {TM12_DUO.map((p, k) => (
            <figure key={p.n} className={k === 1 ? "md:mt-[clamp(48px,6vw,96px)]" : ""}>
              <div className="fx-pan overflow-hidden rounded-[var(--sx-radius)]" style={{ animationDuration: k ? "5s" : "6.5s" }}>
                <div className="fx-drift" style={{ animationDuration: k ? "4s" : "5.5s" }}>
                  <Pic i={p.i} ratio="2/3" label="" />
                </div>
              </div>
              <figcaption className="mt-5 flex items-baseline justify-between gap-3 border-t border-[var(--sx-line)] pt-4">
                <span className="sx-display text-[clamp(24px,2vw,32px)] font-[600] leading-[1]">{p.n}</span>
                <span className="text-right text-[14px] text-[var(--sx-muted)]">{p.r}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "TM11", name: "Horizontal profile cards (2-up)", motion: "M18", C: TM11 },
  { code: "TM12", name: "Intro half + duo portraits", motion: "M1", C: TM12 },
];
