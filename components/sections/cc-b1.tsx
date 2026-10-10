"use client";

// CC · Contact layouts (docs/SECTION-MENU.md), batch 1. House style: no phone numbers or real addresses; invented
// e-mail domains only.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Types `text` into view while on screen, pauses, clears, repeats (hands-free form demo). Static: full text. */
function useTyping(ref: React.RefObject<HTMLElement | null>, text: string) {
  const [n, setN] = useState(text.length);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let t: ReturnType<typeof setInterval> | undefined;
    let k = 0;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (!e.isIntersecting) return;
      t = setInterval(() => {
        k = k >= text.length + 30 ? 0 : k + 1; // ~30 ticks of rest on the full line, then type again
        setN(Math.min(k, text.length));
      }, 55);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, [ref, text]);
  return text.slice(0, n);
}

/** CC01 · Channels list + big form card: heading and line on top; then a 5-column grid: contact channels on the left
 *  (2 cols), a large form card on the right (3 cols) with paired fields, selects, a message and submit. */
function CC01() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M18");
  const msg = useTyping(r, "We're fitting out a 40-room hotel in Goa and would love to see the teak lounge range in person.");
  const channels = [
    ["Trade & projects", "For architects, hotels and offices.", "trade@neemhouse.studio"],
    ["Press", "Samples, images and interviews.", "press@neemhouse.studio"],
    ["Showroom visits", "Tuesday to Sunday, by appointment.", "visit@neemhouse.studio"],
    ["Care & repairs", "Ten-year frame guarantee on every piece.", "care@neemhouse.studio"],
  ];
  const field = "mt-2 w-full rounded-[12px] border border-[var(--sx-line)] bg-[var(--sx-bg)] px-4 py-3.5 text-[15px] text-[var(--sx-text)]";
  return (
    <Sec innerRef={r} theme="stone" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <style>{`
        .cc01-sheen{background:radial-gradient(40% 60% at 0% 0%,color-mix(in srgb,var(--sx-accent) 14%,transparent),transparent 70%);background-size:200% 200%;animation:cc01-sheen 6s ease-in-out infinite alternate}
        @keyframes cc01-sheen{from{background-position:0% 0%}to{background-position:100% 100%}}
        .cc01-caret{animation:cc01-caret 1s steps(1) infinite}
        @keyframes cc01-caret{50%{opacity:0}}
        html.is-static .cc01-sheen,html.is-static .cc01-caret{animation:none}
        html.is-static {.cc01-sheen,.cc01-caret{animation:none}}
      `}</style>
      <div className="max-w-[760px]">
        <H className="text-[clamp(44px,5.4vw,92px)]">Let&apos;s make a room together.</H>
        <P className="mt-5 max-w-[48ch]">Solid teak and cane furniture, made to order in Mysuru. Tell us about your space and the right person writes back within a day.</P>
      </div>
      <div className="mt-[clamp(48px,6vw,88px)] grid grid-cols-1 gap-[clamp(32px,4vw,64px)] md:grid-cols-5">
        <div className="md:col-span-2">
          {channels.map(([t, d, mail]) => (
            <div key={t} className="border-t border-[var(--sx-line)] py-6 first:border-t-0 first:pt-0">
              <p data-m-text className="text-[19px] font-[650]">
                {t}
              </p>
              <p data-m-text className="mt-1 text-[15px] text-[var(--sx-muted)]">
                {d}
              </p>
              <a data-m-text href="#" onClick={(e) => e.preventDefault()} className="mt-3 inline-block text-[16px] text-[var(--sx-accent)] underline decoration-[var(--sx-line)] underline-offset-4">
                {mail}
              </a>
            </div>
          ))}
        </div>
        <form data-m-card onSubmit={(e) => e.preventDefault()} className="sx-card relative overflow-hidden p-[clamp(24px,3vw,48px)] md:col-span-3">
          <div aria-hidden className="cc01-sheen pointer-events-none absolute inset-0" />
          <div className="relative grid grid-cols-1 gap-5 md:grid-cols-2">
            <label className="text-[14px] font-[600]">
              Full name
              <input readOnly value="Meera Pillai" className={field} />
            </label>
            <label className="text-[14px] font-[600]">
              E-mail
              <input readOnly value="meera@tideline.example" className={field} />
            </label>
            <label className="text-[14px] font-[600]">
              I&apos;m writing about
              <span className="relative block">
                <select className={`${field} appearance-none pr-10`} defaultValue="Trade & projects">
                  {channels.map(([t]) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 mt-1 text-[var(--sx-muted)]">⌄</span>
              </span>
            </label>
            <label className="text-[14px] font-[600]">
              Budget
              <span className="relative block">
                <select className={`${field} appearance-none pr-10`} defaultValue="₹5–15 lakh">
                  {["Under ₹5 lakh", "₹5–15 lakh", "₹15 lakh +"].map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 mt-1 text-[var(--sx-muted)]">⌄</span>
              </span>
            </label>
            <label className="text-[14px] font-[600] md:col-span-2">
              Message
              <span className={`${field} block min-h-[132px] font-[400] leading-relaxed`}>
                {msg}
                <span className="cc01-caret ml-0.5 inline-block h-[1.1em] w-px translate-y-[3px] bg-[var(--sx-accent)]" />
              </span>
            </label>
          </div>
          <div className="relative mt-7 flex flex-wrap items-center justify-between gap-4">
            <p className="text-[13px] text-[var(--sx-muted)]">We reply within one working day.</p>
            <Btn>Send enquiry</Btn>
          </div>
        </form>
      </div>
    </Sec>
  );
}

/** CC02 · Giant e-mail across an image: an off-centre photo, the address set huge across the width and overlapping it,
 *  small studio details and socials in the corners. */
function CC02() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M12");
  return (
    <Sec innerRef={r} theme="ink" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <div className="relative min-h-[clamp(560px,84svh,860px)]">
        <div className="flex flex-wrap justify-between gap-6 text-[14px] leading-relaxed text-[var(--sx-muted)]">
          <p>
            Maison Vetiver
            <br />
            Perfume atelier, Mumbai
          </p>
          <p className="text-right">
            Appointments
            <br />
            Thursday to Saturday
          </p>
        </div>
        <div className="mt-8 md:absolute md:left-[44%] md:top-[6%] md:mt-0 md:w-[34%]">
          <div className="fx-drift overflow-hidden rounded-[var(--sx-radius)]">
            <Pic i={1} ratio="4/5" label="ATELIER" />
          </div>
        </div>
        <div className="relative z-10 mt-8 text-white mix-blend-difference md:absolute md:inset-x-0 md:top-1/2 md:mt-0 md:-translate-y-1/2">
          <p className="mb-3 text-[15px] text-white/70 md:mb-5">Commissions, wholesale and the odd love letter</p>
          <a href="#" onClick={(e) => e.preventDefault()} className="block">
            <H as="h2" className="whitespace-nowrap text-[clamp(30px,7.2vw,132px)] leading-[0.9]">
              hello@maisonvetiver.in
            </H>
          </a>
        </div>
        <div className="mt-10 flex flex-wrap items-end justify-between gap-6 md:absolute md:inset-x-0 md:bottom-0 md:mt-0">
          <div className="flex gap-6 text-[14px]">
            {["Letters", "Journal", "Stockists"].map((s) => (
              <a key={s} href="#" onClick={(e) => e.preventDefault()} className="sx-btn-link">
                {s}
              </a>
            ))}
          </div>
          <p className="text-[14px] text-[var(--sx-muted)]">Bespoke scents from ₹38,000 · six-week wait</p>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "CC01", name: "Channels list + big form card", motion: "M18", C: CC01 },
  { code: "CC02", name: "Giant email across an image", motion: "M12", C: CC02 },
];
