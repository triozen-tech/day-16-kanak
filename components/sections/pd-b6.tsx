"use client";

// PD · Process layouts, batch 6 (docs/SECTION-MENU.md). The steps ARE a sequence here, so they carry numbers.
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Sec } from "./kit";
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

/** Scoped keyframes (off in ?static=1 and with reduced motion). The glow is the CSS-only never-frozen safety net. */
const PD_CSS = `
.pdb6-glow{animation:pdb6-glow 4.4s linear infinite alternate}
@keyframes pdb6-glow{from{transform:translate(-18%,-10%) scale(.88)}to{transform:translate(22%,14%) scale(1.16)}}
.pdb6-ping{animation:pdb6-ping 1.4s cubic-bezier(.2,.7,.3,1) infinite}
@keyframes pdb6-ping{from{transform:scale(1);opacity:.7}to{transform:scale(1.9);opacity:0}}
html.is-static .pdb6-glow,html.is-static .pdb6-ping{animation:none}
html.is-static .pdb6-ping{opacity:0}
html.is-static {.pdb6-glow,.pdb6-ping{animation:none}.pdb6-ping{opacity:0}}
`;

const Glow = ({ className = "" }: { className?: string }) => (
  <div aria-hidden className={`pdb6-glow pointer-events-none absolute aspect-square rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_38%,transparent),transparent)] ${className}`} />
);

/* ───────────────────────── PD07 · Big-number ledger steps ───────────────────────── */

const PD07_STEPS = [
  { l: "Days 1–6", t: "Ferment in leaf", d: "Fresh pods from two Idukki farms are split by hand and sweated under banana leaves until the pulp turns to vinegar and the bean wakes up." },
  { l: "Day 9", t: "Roast low, roast slow", d: "Twenty-two minutes in a drum we rebuilt ourselves, a little cooler than most, so the fruit stays in the bar." },
  { l: "Days 10–12", t: "Grind for three days", d: "Nibs and cane sugar turn in the stone melanger for seventy hours until the texture reads silk, not sand." },
  { l: "Day 40", t: "Rest, temper, wrap", d: "The chocolate ages a month in blocks, is tempered on marble, moulded at 72 g and wrapped in paper we print in-house." },
];

/** PD07 · Section title, then divided ledger rows: a huge step number, then the label, title and paragraph across the
 *  rest. The current step lights up in turn by itself. */
function PD07() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M12");
  const [act] = useAutoCycle(r, PD07_STEPS.length, 1900);
  return (
    <Sec innerRef={r} theme="paper" font="condensed" className="py-[clamp(72px,9vw,140px)]">
      <style>{PD_CSS}</style>
      <Glow className="-right-[8%] top-[20%] w-[50vw]" />
      <div className="relative z-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <H className="max-w-[16ch] text-[clamp(52px,6.6vw,108px)] uppercase">From pod to bar in forty days.</H>
          <div className="max-w-[36ch] pb-2">
            <P>Four slow steps, all done in one small room in Kochi. Nothing skipped, nothing rushed, nothing added but cane sugar.</P>
            <Btn kind="ghost" className="mt-6">
              Book a factory tour
            </Btn>
          </div>
        </div>

        <ol className="mt-[clamp(48px,6vw,88px)] border-t border-[var(--sx-line)]">
          {PD07_STEPS.map((s, k) => (
            <li key={s.t} className="relative grid grid-cols-1 items-center gap-x-[clamp(16px,2.4vw,40px)] gap-y-3 border-b border-[var(--sx-line)] py-[clamp(18px,2vw,28px)] md:grid-cols-[1.1fr_0.7fr_1.2fr_1.8fr]">
              {/* moving highlight band behind the active row */}
              <span aria-hidden className={`absolute inset-y-0 -left-4 -right-4 origin-left rounded-[12px] bg-[color-mix(in_srgb,var(--sx-accent)_12%,transparent)] transition-transform duration-700 ease-[cubic-bezier(.7,0,.2,1)] ${k === act ? "scale-x-100" : "scale-x-0"}`} />
              <span data-m-head className={`sx-display relative text-[clamp(96px,10vw,172px)] font-[800] leading-[0.82] tabular-nums transition-colors duration-500 ${k === act ? "text-[var(--sx-accent)]" : "text-[color-mix(in_srgb,var(--sx-text)_20%,transparent)]"}`}>
                {String(k + 1).padStart(2, "0")}
              </span>
              <span className="relative text-[14px] font-[600] uppercase tracking-[0.14em] text-[var(--sx-muted)]">{s.l}</span>
              <span className="sx-display relative text-[clamp(30px,2.8vw,46px)] font-[700] uppercase leading-[0.95]">{s.t}</span>
              <p data-m-text className="relative max-w-[44ch] text-[16px] leading-relaxed text-[var(--sx-muted)]">
                {s.d}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </Sec>
  );
}

/* ───────────────────────── PD08 · Vertical numbered step rail ───────────────────────── */

const PD08_STEPS = [
  { t: "Book a slot online", d: "Pick a 35-minute visit at either studio. A short form asks about your skin so the doctor reads it before you arrive.", ic: 0, m: "2 min" },
  { t: "Skin scan and consult", d: "A polarised-light scan maps pigment, oil and redness. Dr. Tara Ahuja walks you through it on screen, no upselling.", ic: 1, m: "35 min" },
  { t: "A written plan", d: "You leave with a three-step routine, product names and doses, priced from ₹2,400 a month. Use what you already own.", ic: 2, m: "Same day" },
  { t: "Follow-up at six weeks", d: "A second scan, side by side with the first. We adjust the plan or tell you honestly that it's working.", ic: 3, m: "Included" },
];

const PD08Icon = ({ k }: { k: number }) => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
    {k === 0 && <path d="M4 6h16v14H4zM4 10h16M9 3v5M15 3v5" />}
    {k === 1 && <path d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM2 12h3M19 12h3" />}
    {k === 2 && <path d="M7 4h10v17H7zM10 2h4v4h-4zM10 11h4M10 15h4" />}
    {k === 3 && <path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5" />}
  </svg>
);

/** PD08 · A centred column: four steps down a dashed vertical rail, each with a numbered node, an icon, a title and copy
 *  to the right. The rail fills with the scroll; the current node pings in turn by itself. */
function PD08() {
  const r = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  useSectionMotion(r, "M23");
  const [act] = useAutoCycle(r, PD08_STEPS.length, 1800);
  useEffect(() => {
    const f = fill.current;
    if (!f || prefersReducedMotion()) return;
    const tw = gsap.fromTo(f, { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: f.parentElement, start: "top 75%", end: "bottom 55%", scrub: true } });
    return () => {
      tw.scrollTrigger?.kill();
      tw.kill();
      gsap.set(f, { clearProps: "transform" });
    };
  }, []);
  return (
    <Sec innerRef={r} theme="ink" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <style>{PD_CSS}</style>
      <Glow className="left-[18%] top-[26%] w-[54vw]" />
      <div className="relative z-10 mx-auto max-w-[860px]">
        <div className="text-center">
          <H className="text-[clamp(44px,5.2vw,84px)]">Four visits&apos; worth of care, in one plan.</H>
          <P className="mx-auto mt-5 max-w-[48ch]">How a first appointment at Lumen Skin Studio works, from the booking form to the six-week check.</P>
        </div>

        <ol className="relative mt-[clamp(48px,6vw,88px)]">
          {/* the rail: dashed track + solid fill that grows with the scroll */}
          <span aria-hidden className="absolute bottom-10 left-[31px] top-10 w-0 border-l-2 border-dashed border-[var(--sx-line)]" />
          <span ref={fill} aria-hidden className="absolute bottom-10 left-[30px] top-10 w-[4px] origin-top rounded-full bg-[var(--sx-accent)]" />
          {PD08_STEPS.map((s, k) => (
            <li key={s.t} className="relative grid grid-cols-[64px_minmax(0,1fr)] gap-[clamp(20px,3vw,44px)] pb-[clamp(28px,3.4vw,52px)] last:pb-0">
              <span className="relative z-10 grid h-16 w-16 place-items-center">
                {k === act && <span aria-hidden className="pdb6-ping absolute inset-0 rounded-full bg-[var(--sx-accent)]" />}
                <span className={`relative grid h-16 w-16 place-items-center rounded-full border-2 text-[20px] font-[700] tabular-nums transition-colors duration-500 ${k === act ? "border-[var(--sx-accent)] bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "border-[var(--sx-line)] bg-[var(--sx-bg)]"}`}>{k + 1}</span>
              </span>
              <div data-m-card className={`sx-card flex gap-5 p-[clamp(20px,2vw,28px)] transition-colors duration-500 ${k === act ? "border-[var(--sx-accent)] bg-[var(--sx-surface)]" : "bg-transparent"}`}>
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-[14px] transition-colors duration-500 ${k === act ? "bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "bg-[var(--sx-surface)] text-[var(--sx-accent)]"}`}>
                  <PD08Icon k={s.ic} />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h3 className="sx-display text-[clamp(24px,2.2vw,34px)] font-[600] leading-[1.05]">{s.t}</h3>
                    <span className="text-[13px] uppercase tracking-[0.12em] text-[var(--sx-muted)]">{s.m}</span>
                  </div>
                  <p data-m-text className="mt-2 max-w-[54ch] text-[16px] leading-relaxed text-[var(--sx-muted)]">
                    {s.d}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-[clamp(40px,5vw,64px)] flex flex-wrap items-center justify-center gap-5">
          <Btn>Book a first visit · ₹1,800</Btn>
          <span className="text-[14px] text-[var(--sx-muted)]">Fee comes off your first product order</span>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "PD07", name: "Big-number ledger steps", motion: "M12", C: PD07 },
  { code: "PD08", name: "Vertical numbered step rail", motion: "M23", C: PD08 },
];
