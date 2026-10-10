"use client";

// CT · Call-to-action layouts, batch 4 (docs/SECTION-MENU.md). Sample prices for a concept site.
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const INCLUDES = ["Cleanser, serum and SPF, sized for 30 days", "A skin check with a therapist every quarter", "Swap any product, any month, free", "Pause or cancel from your phone"];

/** CT09 · CTA card with inset price box: one card split in two, heading + text + a short checklist left, an inset
 *  muted box right with 'Starting at', a large price, a small note and a button.
 *  Motion M18: the card opens from its corner; the price in the box counts up; the checklist lights in turn. */
function CT09() {
  const r = useRef<HTMLDivElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  useSectionMotion(r, "M18");
  const [lit, setLit] = useState(-1);

  // the 'Starting at' price counts up as the card lands
  useEffect(() => {
    const el = r.current;
    const n = num.current;
    if (!el || !n || prefersReducedMotion()) return;
    const final = n.textContent ?? "";
    const target = parseFloat(final.replace(/,/g, ""));
    const o = { v: 0 };
    const tw = gsap.to(o, {
      v: target,
      duration: 1.6,
      delay: 0.5,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 75%", toggleActions: "play none none reverse" },
      onUpdate: () => (n.textContent = Math.round(o.v).toLocaleString("en-IN")),
      onComplete: () => (n.textContent = final),
    });
    return () => {
      tw.scrollTrigger?.kill();
      tw.kill();
      n.textContent = final;
    };
  }, []);

  // hands-free: the checklist lights one line at a time while on screen
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    let t: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (e.isIntersecting) t = setInterval(() => setLit((v) => (v + 1) % INCLUDES.length), 1100);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, []);

  return (
    <Sec innerRef={r} theme="ink" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <style>{`
        @keyframes ct09-spin { to { transform: rotate(360deg) } }
        .ct09-spin { animation: ct09-spin 14s linear infinite; }
        html.is-static .ct09-spin { animation: none; }
        html.is-static { .ct09-spin { animation: none; } }
      `}</style>
      <div data-m-card className="relative mx-auto grid max-w-[1240px] grid-cols-1 items-stretch gap-[clamp(28px,3vw,48px)] overflow-hidden rounded-[calc(var(--sx-radius)+10px)] border border-[var(--sx-line)] bg-[var(--sx-surface)] p-[clamp(20px,2.4vw,36px)] md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        {/* a slow rotating light inside the card (large, soft) keeps the frame alive */}
        <div className="ct09-spin pointer-events-none absolute -left-[25%] -top-[60%] aspect-square w-[80%] rounded-full bg-[conic-gradient(from_0deg,transparent,color-mix(in_srgb,var(--sx-accent)_30%,transparent),transparent_40%,color-mix(in_srgb,var(--sx-accent)_18%,transparent),transparent_75%)] blur-[50px]" />

        <div className="relative p-[clamp(8px,1.6vw,28px)]">
          <H className="max-w-[13ch] text-[clamp(40px,4.6vw,76px)] font-[600]">Your ritual, delivered monthly.</H>
          <P className="mt-6 max-w-[42ch]">The Dewline routine, refilled before you run out. Formulated in Pune for humid summers and dry winters alike.</P>
          <ul className="mt-9 space-y-3">
            {INCLUDES.map((x, k) => (
              <li key={x} className={`flex items-center gap-4 text-[16px] transition-colors duration-500 ${k === lit ? "text-[var(--sx-text)]" : "text-[var(--sx-muted)]"}`}>
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border transition-all duration-500 ${k === lit ? "scale-110 border-transparent bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "border-[var(--sx-line)]"}`}>
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                </span>
                {x}
              </li>
            ))}
          </ul>
        </div>

        {/* inset price box */}
        <div className="relative flex flex-col justify-between rounded-[var(--sx-radius)] bg-[color-mix(in_srgb,var(--sx-text)_6%,var(--sx-bg))] p-[clamp(24px,3vw,48px)]">
          <div>
            <p className="text-[13px] font-[600] uppercase tracking-[0.16em] text-[var(--sx-muted)]">Starting at</p>
            <p className="sx-display mt-4 flex items-baseline gap-2 whitespace-nowrap font-[600] leading-none tabular-nums">
              <span className="text-[clamp(36px,3.4vw,56px)]">₹</span>
              <span ref={num} className="text-[clamp(64px,7vw,112px)] tracking-[-0.04em]">
                1,180
              </span>
            </p>
            <p className="mt-5 max-w-[32ch] text-[14px] leading-relaxed text-[var(--sx-muted)]">Per month, for the three-step routine. First box ships free with a travel pouch worth ₹450.</p>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Btn className="w-full justify-center md:w-auto">Start my ritual</Btn>
            <Btn kind="link">Take the skin quiz →</Btn>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "CT09", name: "CTA card with inset price box", motion: "M18", C: CT09 }];
