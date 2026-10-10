"use client";

// BK · Booking & enquiry layouts (docs/SECTION-MENU.md), batch 6. The enquiry opens its second row of fields by itself
// once on screen and the destination picker steps through the lodges; loops stop in ?static=1 (the form then shows fully open).
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const BK_CSS = `.bk6-glow{background:radial-gradient(closest-side,color-mix(in srgb,var(--sx-accent) 42%,transparent),transparent);animation:bk6-glow 6s linear infinite alternate}@keyframes bk6-glow{from{translate:-22% -10%}to{translate:20% 12%}}
.bk6-sheen{background:linear-gradient(100deg,transparent 30%,rgba(255,240,215,.32) 50%,transparent 70%) 0 0/260% 100%;animation:bk6-sheen 3.4s linear infinite}@keyframes bk6-sheen{from{background-position:140% 0}to{background-position:-40% 0}}
.is-static .bk6-glow,.is-static .bk6-sheen{animation:none}.is-static .bk6-sheen{opacity:0}
html.is-static {.bk6-glow,.bk6-sheen{animation:none}.bk6-sheen{opacity:0}}`;

const PLACES = [
  { d: "Masai Mara, Kenya", n: "12 – 16 Feb · 4 nights", g: "2 adults" },
  { d: "Okavango Delta, Botswana", n: "3 – 8 Mar · 5 nights", g: "2 adults, 1 child" },
  { d: "Ruaha, Tanzania", n: "9 – 12 Jul · 3 nights", g: "4 adults" },
];

const Chevron = () => (
  <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-[var(--sx-muted)]" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
    <path d="M4 6l4 4 4-4" />
  </svg>
);

/** BK08 · Plan-your-stay enquiry beside a half image: one big photo fills the left half; on the right a centred heading
 *  over a single picker row (destination, dates, guests) that opens into name, email, phone and notes on its own. */
function BK08() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M13");
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  useEffect(() => {
    const el = r.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      setOpen(true);
      return;
    }
    let t: ReturnType<typeof setInterval> | undefined;
    let o: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      clearTimeout(o);
      if (e.isIntersecting) {
        o = setTimeout(() => setOpen(true), 900);
        t = setInterval(() => setI((v) => (v + 1) % PLACES.length), 1800);
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
      clearTimeout(o);
    };
  }, []);
  const p = PLACES[i];
  const field = "flex flex-col gap-1.5 border-[var(--sx-line)] px-5 py-4 text-left";
  const lab = "text-[12px] font-[650] uppercase tracking-[0.14em] text-[var(--sx-muted)]";
  return (
    <Sec innerRef={r} theme="paper" font="serif" full style={{ ["--sx-accent" as string]: "#a5652b", ["--sx-accent-text" as string]: "#fff8ef" }}>
      <style>{BK_CSS}</style>
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="relative min-h-[clamp(420px,60vw,920px)] overflow-hidden">
          <Pic i={1} ratio="auto" round={false} label="" className="absolute inset-0 h-full w-full" />
          <div className="bk6-sheen pointer-events-none absolute inset-0" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(180deg,transparent,rgba(20,14,8,.6))]" />
          <p className="absolute bottom-[clamp(20px,3vw,40px)] left-[clamp(20px,3vw,44px)] text-[14px] tracking-[0.04em] text-white/85">Riverbank tent · Sand River camp</p>
        </div>

        <div className="relative flex flex-col items-center justify-center overflow-hidden px-[clamp(20px,5vw,96px)] py-[clamp(72px,9vw,140px)] text-center">
          <div className="bk6-glow pointer-events-none absolute left-[10%] top-[8%] aspect-square w-[80%] rounded-full" />
          <div className="relative w-full max-w-[660px]">
            <H className="mx-auto max-w-[14ch] text-[clamp(44px,4.6vw,80px)]">Start planning your tailored stay</H>
            <P className="mx-auto mt-6 max-w-[40ch]">Tell us where and when. A travel designer replies within a day with a route, three camps and a price per person.</P>

            <form onSubmit={(e) => e.preventDefault()} className="mt-[clamp(32px,4vw,52px)] overflow-hidden rounded-[22px] border border-[var(--sx-line)] bg-[var(--sx-surface)] shadow-[0_30px_70px_-40px_rgba(60,40,20,.45)]">
              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1.25fr)_minmax(0,1fr)]">
                <label className={`${field} md:border-r`}>
                  <span className={lab}>Destination</span>
                  <span className="flex items-center justify-between gap-2 text-[16px] font-[600]">
                    <span key={p.d} className="truncate transition-opacity duration-500">{p.d}</span>
                    <Chevron />
                  </span>
                </label>
                <label className={`${field} max-md:border-t md:border-r`}>
                  <span className={lab}>Dates</span>
                  <span className="flex items-center justify-between gap-2 text-[16px] font-[600]">
                    <span className="truncate">{p.n}</span>
                    <Chevron />
                  </span>
                </label>
                <label className={`${field} max-md:border-t`}>
                  <span className={lab}>Guests</span>
                  <span className="flex items-center justify-between gap-2 text-[16px] font-[600]">
                    <span className="truncate">{p.g}</span>
                    <Chevron />
                  </span>
                </label>
              </div>

              <div className={`grid transition-[grid-template-rows] duration-700 ease-[cubic-bezier(.2,.8,.2,1)] ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <div className="min-h-0 overflow-hidden">
                  <div className={`grid grid-cols-1 border-t border-[var(--sx-line)] transition-opacity duration-500 md:grid-cols-3 ${open ? "opacity-100 delay-200" : "opacity-0"}`}>
                    {[
                      ["Your name", "Ira Menon"],
                      ["Email", "ira@studio.example"],
                      ["Phone", "For a call-back"],
                    ].map(([k, v], n) => (
                      <label key={k} className={`${field} ${n < 2 ? "md:border-r" : ""} ${n ? "max-md:border-t" : ""}`}>
                        <span className={lab}>{k}</span>
                        <span className="truncate text-[16px] text-[var(--sx-muted)]">{v}</span>
                      </label>
                    ))}
                    <label className={`${field} border-t md:col-span-3`}>
                      <span className={lab}>Anything we should know</span>
                      <span className="text-[16px] text-[var(--sx-muted)]">Anniversary trip, keen on a walking safari and one night under the stars.</span>
                    </label>
                    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--sx-line)] px-5 py-4 md:col-span-3">
                      <span className="text-[14px] text-[var(--sx-muted)]">Tailored stays from ₹3,40,000 per person</span>
                      <Btn>Send my enquiry</Btn>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "BK08", name: "Plan-your-stay enquiry beside a half image", motion: "M13", C: BK08 }];
