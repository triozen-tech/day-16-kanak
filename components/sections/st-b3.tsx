"use client";

// ST · Stats layouts, batch 3 (docs/SECTION-MENU.md): ST09 ring gauge row, ST10 ring chart composition.
// Each keeps moving while on screen (hands-free for filming) and shows its final state in ?static=1.
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/* ───────────────────────────── ST09 · Ring gauge row ───────────────────────────── */

const RINGS = [
  { v: 94, suf: "%", k: "Hydration", d: "felt skin stayed plump through the day", t: 5.2 },
  { v: 87, suf: "%", k: "Even tone", d: "saw fewer dark spots by week four", t: 6.6 },
  { v: 72, suf: "%", k: "Fine lines", d: "noticed softer lines around the eyes", t: 4.4 },
  { v: 98, suf: "%", k: "Gentle", d: "had no redness, even on sensitive skin", t: 7.4 },
];
const ST09_CSS = `.st09-orbit{animation:st09-orbit linear infinite}@keyframes st09-orbit{to{transform:rotate(360deg)}}.st09-glow{animation:st09-glow 3.2s ease-in-out infinite alternate}@keyframes st09-glow{from{opacity:.25;transform:scale(.9)}to{opacity:.7;transform:scale(1.08)}}.is-static .st09-orbit,.is-static .st09-glow{animation:none}html.is-static {.st09-orbit,.st09-glow{animation:none}}`;

/** ST09 · Left-aligned heading, then four large circular rings whose arcs fill to a value with the number counting inside. */
function ST09() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M3");
  // the arcs fill alongside M3's count (markup already holds the final arc for ?static=1)
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    const arcs = el.querySelectorAll<SVGCircleElement>("[data-arc]");
    const ctx = gsap.context(() => {
      gsap.from(arcs, { strokeDashoffset: 100, duration: 1.6, ease: "power3.out", stagger: 0.12, scrollTrigger: { trigger: el, start: "top 75%", toggleActions: "play none none reverse" } });
    }, el);
    return () => ctx.revert();
  }, []);
  return (
    <Sec innerRef={r} theme="stone" font="wide" className="py-[clamp(72px,9vw,140px)]">
      <style>{ST09_CSS}</style>
      <div className="grid grid-cols-1 items-end gap-8 md:grid-cols-12">
        <H className="text-[clamp(40px,4.6vw,76px)] md:col-span-7">Visible in four weeks.</H>
        <P className="md:col-span-5">An independent panel of 212 women and men used the Dew Serum twice a day for 28 days. Here is what they reported.</P>
      </div>
      <div className="mt-[clamp(48px,6vw,96px)] grid grid-cols-1 gap-[clamp(28px,3vw,48px)] sm:grid-cols-2 md:grid-cols-4">
        {RINGS.map((g, k) => (
          <div key={g.k} data-m-card className="flex flex-col items-start">
            <div className="relative aspect-square w-[clamp(170px,15vw,240px)] [container-type:inline-size]">
              <div className="st09-glow absolute inset-[12%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_35%,transparent),transparent)]" style={{ animationDelay: `${-k * 0.8}s` }} />
              <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full -rotate-90">
                <circle cx="100" cy="100" r="86" fill="none" stroke="var(--sx-line)" strokeWidth="12" />
                <circle data-arc cx="100" cy="100" r="86" fill="none" stroke="var(--sx-accent)" strokeWidth="12" strokeLinecap="round" pathLength={100} strokeDasharray="100 100" strokeDashoffset={100 - g.v} />
              </svg>
              {/* a light that runs round the track */}
              <div className="st09-orbit absolute inset-0" style={{ animationDuration: `${g.t}s` }}>
                <span className="absolute left-1/2 top-[1%] h-[14px] w-[14px] -translate-x-1/2 rounded-full bg-[var(--sx-surface)] shadow-[0_0_0_3px_var(--sx-accent),0_0_18px_4px_color-mix(in_srgb,var(--sx-accent)_60%,transparent)]" />
              </div>
              <div className="absolute inset-0 grid place-items-center">
                <span className="sx-display text-[21cqw] leading-none font-[800] tabular-nums tracking-[-0.03em]">
                  <span data-m-num>{g.v}</span>
                  <span className="text-[0.5em] text-[var(--sx-muted)]">{g.suf}</span>
                </span>
              </div>
            </div>
            <p className="mt-6 text-[clamp(18px,1.4vw,22px)] font-[700]">{g.k}</p>
            <p className="mt-2 max-w-[28ch] text-[15px] leading-relaxed text-[var(--sx-muted)]">{g.d}</p>
          </div>
        ))}
      </div>
      <div className="mt-[clamp(48px,5vw,80px)] flex flex-wrap items-center justify-between gap-6 border-t border-[var(--sx-line)] pt-8">
        <p className="text-[14px] text-[var(--sx-muted)]">Self-assessed results, 28-day consumer study, 212 participants aged 24–61.</p>
        <Btn>Shop Dew Serum · ₹1,290</Btn>
      </div>
    </Sec>
  );
}

/* ───────────────────────────── ST10 · Ring chart composition ───────────────────────────── */

const BLEND = [
  { k: "Assam CTC", v: 52, d: "Malty base from second-flush gardens", c: "#c9773b" },
  { k: "Dry ginger", v: 14, d: "Sun-dried in Kochi, for the warmth", c: "#e2b450" },
  { k: "Green cardamom", v: 12, d: "Idukki pods, cracked the day we pack", c: "#7fae6e" },
  { k: "Cinnamon bark", v: 10, d: "True Ceylon, sweet and soft", c: "#9c4a3a" },
  { k: "Clove & pepper", v: 7, d: "Just enough to lift the finish", c: "#5b3b2e" },
  { k: "Fennel", v: 5, d: "A cooling note to round it off", c: "#c6c08a" },
];
const ST10_CSS = `.st10-spin{animation:st10-spin 26s linear infinite}@keyframes st10-spin{to{transform:rotate(360deg)}}.is-static .st10-spin{animation:none}html.is-static {.st10-spin{animation:none}}`;

/** ST10 · A donut chart with a big centre number (left) beside a legend list with values and short notes (right). */
function ST10() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const [on, setOn] = useState(0);
  // hands-free: the highlighted ingredient steps round the ring while on screen
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    let t: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (e.isIntersecting) t = setInterval(() => setOn((v) => (v + 1) % BLEND.length), 1700);
    });
    io.observe(el);
    const segs = el.querySelectorAll<SVGCircleElement>("[data-seg]");
    const ctx = gsap.context(() => {
      gsap.from(segs, { strokeDasharray: "0 100", duration: 0.9, ease: "power2.out", stagger: 0.12, scrollTrigger: { trigger: el, start: "top 75%", toggleActions: "play none none reverse" } });
    }, el);
    return () => {
      io.disconnect();
      clearInterval(t);
      ctx.revert();
    };
  }, []);
  let start = 0;
  const segs = BLEND.map((b) => {
    const s = { ...b, start };
    start += b.v;
    return s;
  });
  const a = BLEND[on];
  return (
    <Sec innerRef={r} theme="ink" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <style>{ST10_CSS}</style>
      <div className="grid grid-cols-1 items-center gap-[clamp(40px,6vw,110px)] md:grid-cols-12">
        <div className="relative mx-auto aspect-square w-full max-w-[520px] md:col-span-6">
          <div className="st10-spin absolute inset-0">
            <svg viewBox="0 0 400 400" className="h-full w-full -rotate-90">
              {segs.map((s, k) => (
                <circle
                  key={s.k}
                  data-seg
                  cx="200"
                  cy="200"
                  r="160"
                  fill="none"
                  stroke={s.c}
                  pathLength={100}
                  strokeDasharray={`${s.v - 0.6} ${100 - s.v + 0.6}`}
                  strokeDashoffset={-s.start}
                  style={{ strokeWidth: k === on ? 60 : 40, opacity: k === on ? 1 : 0.55, transition: "stroke-width .6s cubic-bezier(.22,1,.36,1), opacity .6s" }}
                />
              ))}
            </svg>
          </div>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <p key={on} className="sx-display text-[clamp(72px,8vw,132px)] font-[700] leading-none tracking-[-0.04em]" style={{ animation: "st10-in .6s cubic-bezier(.22,1,.36,1)" }}>
                {a.v}
                <span className="text-[0.4em] text-[var(--sx-muted)]">%</span>
              </p>
              <p className="mt-3 text-[15px] font-[600] uppercase tracking-[0.14em] text-[var(--sx-muted)]">{a.k}</p>
            </div>
          </div>
          <style>{`@keyframes st10-in{from{opacity:0;transform:translateY(14px)}}`}</style>
        </div>

        <div className="md:col-span-6">
          <H className="max-w-[12ch] text-[clamp(42px,4.8vw,80px)]">Inside Monsoon Chai.</H>
          <P className="mt-5 max-w-[44ch]">Six ingredients, weighed by hand in Pune. Nothing ground until the week it ships.</P>
          <ul className="mt-10 border-t border-[var(--sx-line)]">
            {BLEND.map((b, k) => (
              <li key={b.k} data-m-card className={`grid grid-cols-[14px_minmax(0,1fr)_auto] items-center gap-x-5 border-b border-[var(--sx-line)] px-3 py-4 transition-colors duration-500 ${k === on ? "bg-[var(--sx-surface)]" : ""}`}>
                <span className="h-3.5 w-3.5 rounded-full" style={{ background: b.c }} />
                <span className="min-w-0">
                  <span className="block text-[17px] font-[650]">{b.k}</span>
                  <span className="block text-[14px] text-[var(--sx-muted)]">{b.d}</span>
                </span>
                <span className="sx-display text-[clamp(22px,2vw,30px)] font-[700] tabular-nums">{b.v}%</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Btn>Buy a 250 g tin · ₹420</Btn>
            <Btn kind="link">Brewing guide →</Btn>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "ST09", name: "Ring gauge row", motion: "M3", C: ST09 },
  { code: "ST10", name: "Ring chart composition", motion: "M23", C: ST10 },
];
