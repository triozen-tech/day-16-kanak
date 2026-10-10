"use client";

// CC · Contact layouts (docs/SECTION-MENU.md), batch 5. Maps are drawn here (SVG streets and pins, never map tiles);
// the forms type a sample message by themselves while on screen. Loops stop in ?static=1 (the finished text shows).
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Types `text` letter by letter while the section is on screen, holds, then starts again (full text in ?static=1). */
function useTypeLoop(ref: React.RefObject<HTMLElement | null>, text: string, ms = 45) {
  const [n, setN] = useState(text.length);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let t: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (!e.isIntersecting) return;
      let k = 0;
      t = setInterval(() => {
        k = (k + 1) % (text.length + 40); // ~40 ticks of hold before it clears and types again
        setN(Math.min(k, text.length));
      }, ms);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, [ref, text, ms]);
  return text.slice(0, n);
}

const CC_CSS = `.cc5-route{stroke-dasharray:14 12;animation:cc5-route 1.2s linear infinite}@keyframes cc5-route{to{stroke-dashoffset:-52}}
.cc5-ping{transform-box:fill-box;transform-origin:center;animation:cc5-ping 1.8s cubic-bezier(0,0,.2,1) infinite}@keyframes cc5-ping{from{transform:scale(.4);opacity:.75}to{transform:scale(2.4);opacity:0}}
.cc5-caret{animation:cc5-caret .8s steps(1) infinite}@keyframes cc5-caret{50%{opacity:0}}
.cc5-light{background:linear-gradient(110deg,transparent 30%,rgba(255,226,180,.32) 48%,transparent 66%) 0 0/260% 100%;animation:cc5-light 4.4s linear infinite}@keyframes cc5-light{from{background-position:140% 0}to{background-position:-40% 0}}
.is-static .cc5-route,.is-static .cc5-caret{animation:none}.is-static .cc5-ping,.is-static .cc5-light{animation:none;opacity:0}
html.is-static {.cc5-route,.cc5-caret{animation:none}.cc5-ping,.cc5-light{animation:none;opacity:0}}`;

/* ── CC09 ─────────────────────────────────────────────────────────────── */

/** City blocks for the drawn map (deterministic so server and client agree). */
const BLOCKS = Array.from({ length: 48 }, (_, k) => {
  const c = k % 8;
  const r = Math.floor(k / 8);
  const w = 92 + ((k * 37) % 30);
  const h = 70 + ((k * 23) % 26);
  return { x: 18 + c * 128 + ((r * 13) % 18), y: 14 + r * 108 + ((c * 11) % 14), w, h, park: k === 11 || k === 28 };
});
const ROUTE = "M120 600 L120 470 L380 470 L380 250 L640 250 L640 140 L770 140";

function DrawnMap() {
  return (
    <svg viewBox="0 0 1040 660" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
      <rect width="1040" height="660" className="fill-[color-mix(in_srgb,var(--sx-text)_9%,var(--sx-bg))]" />
      {BLOCKS.map((b, k) => (
        <rect key={k} x={b.x} y={b.y} width={b.w} height={b.h} rx="6" className={b.park ? "fill-[color-mix(in_srgb,var(--sx-accent)_28%,var(--sx-bg))]" : "fill-[var(--sx-surface)]"} />
      ))}
      <path d="M-20 560 C 220 520, 360 640, 560 590 S 900 520, 1080 600" fill="none" strokeWidth="34" className="stroke-[color-mix(in_srgb,#4f8dff_30%,var(--sx-bg))]" />
      <path d="M0 360 L1040 300" strokeWidth="20" className="stroke-[var(--sx-bg)]" />
      <path d="M520 -10 L470 680" strokeWidth="16" className="stroke-[var(--sx-bg)]" />
      <path d={ROUTE} fill="none" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" className="cc5-route stroke-[var(--sx-accent)]" />
      <circle cx="120" cy="600" r="11" className="fill-[var(--sx-text)]" />
      <circle cx="770" cy="140" r="26" className="cc5-ping fill-[var(--sx-accent)]" />
      <path d="M770 150 c-22-26 -30-38 -30-52 a30 30 0 0 1 60 0 c0 14 -8 26 -30 52z" className="fill-[var(--sx-accent)]" />
      <circle cx="770" cy="98" r="11" className="fill-[var(--sx-accent-text)]" />
      <text x="808" y="104" className="fill-[var(--sx-text)] text-[22px] font-[700]">
        Haldi Clinic
      </text>
      <text x="140" y="634" className="fill-[var(--sx-muted)] text-[18px] font-[600]">
        Metro exit B · 6 min walk
      </text>
    </svg>
  );
}

const FIELDS: [string, string][] = [
  ["Your name", "Ananya Pillai"],
  ["Email", "ananya@inbox.example"],
];

/** CC09 · Map panel with info card + side form: a drawn map over the left two thirds with a small info card pinned to
 *  its bottom (Address | Email + Phone); a feedback form in the right third. The map scales down into its frame as it
 *  scrolls in (M13), the info card slides up and the form labels mask-slide in. */
function CC09() {
  const r = useRef<HTMLDivElement>(null);
  const msg = useTypeLoop(r, "Booked a facial for Saturday. Is there parking near the side entrance?");

  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const map = el.querySelector("[data-cc-map]");
      const scrub = { trigger: map, start: "top bottom", end: "center center", scrub: true };
      gsap.fromTo(map, { clipPath: "inset(8% 6% round 32px)" }, { clipPath: "inset(0% 0% round 24px)", ease: "none", scrollTrigger: scrub });
      gsap.fromTo(el.querySelector("[data-cc-zoom]"), { scale: 1.28 }, { scale: 1, ease: "none", scrollTrigger: scrub });
      const once = { trigger: el, start: "top 70%", toggleActions: "play none none reverse" } as const;
      gsap.from(el.querySelector("[data-cc-info]"), { yPercent: 120, opacity: 0, duration: 1, ease: "power4.out", delay: 0.3, scrollTrigger: once });
      gsap.from(el.querySelectorAll("[data-cc-lab]"), { yPercent: 110, duration: 0.8, ease: "power4.out", stagger: 0.09, delay: 0.2, scrollTrigger: once });
      gsap.from(el.querySelectorAll("[data-m-head], [data-m-text]"), { y: 28, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, scrollTrigger: once });
    }, el);
    return () => ctx.revert();
  }, []);

  const field = "mt-2 w-full rounded-[12px] border border-[var(--sx-line)] bg-[var(--sx-surface)] px-4 py-3 text-[15px]";
  const lab = (t: string) => (
    <span className="block overflow-hidden">
      <span data-cc-lab className="block text-[13px] font-[600] uppercase tracking-[0.12em] text-[var(--sx-muted)]">
        {t}
      </span>
    </span>
  );
  return (
    <Sec innerRef={r} theme="stone" font="grotesk" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#d2552f", ["--sx-accent-text" as string]: "#fff6f1" }}>
      <style>{CC_CSS}</style>
      <div className="grid grid-cols-1 items-end gap-6 md:grid-cols-12">
        <H className="text-[clamp(44px,5vw,84px)] md:col-span-8">Find us, or drop a note.</H>
        <P className="max-w-[40ch] md:col-span-4">Walk-ins welcome before noon. For anything else, write to us and a therapist replies the same day.</P>
      </div>

      <div className="mt-[clamp(36px,4.5vw,64px)] grid grid-cols-1 gap-[clamp(20px,2.4vw,40px)] md:grid-cols-3">
        <div data-cc-map className="relative min-h-[clamp(480px,44vw,640px)] overflow-hidden rounded-[24px] md:col-span-2">
          <div data-cc-zoom className="fx-pan absolute -inset-[3%]">
            <DrawnMap />
          </div>
          <div data-cc-info className="absolute inset-x-[clamp(14px,1.6vw,24px)] bottom-[clamp(14px,1.6vw,24px)] grid grid-cols-1 gap-px overflow-hidden rounded-[18px] bg-[var(--sx-line)] shadow-[0_24px_60px_rgba(17,20,24,.18)] md:grid-cols-2">
            <div className="bg-[var(--sx-surface)] p-[clamp(16px,1.8vw,26px)]">
              <p className="text-[12px] font-[650] uppercase tracking-[0.14em] text-[var(--sx-muted)]">Address</p>
              <p className="mt-2 text-[16px] leading-snug">
                12 Jasmine Lane, Indiranagar
                <br />
                Bengaluru 560038
              </p>
            </div>
            <div className="bg-[var(--sx-surface)] p-[clamp(16px,1.8vw,26px)]">
              <p className="text-[12px] font-[650] uppercase tracking-[0.14em] text-[var(--sx-muted)]">Email + Phone</p>
              <p className="mt-2 text-[16px] leading-snug">
                hello@haldiclinic.example
                <br />
                Call-back from the front desk · 9 am–8 pm
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="flex flex-col rounded-[24px] border border-[var(--sx-line)] p-[clamp(20px,2.2vw,32px)]">
          <p className="sx-display text-[clamp(24px,2vw,30px)] font-[700] leading-tight">Tell us how it went.</p>
          <div className="mt-6 space-y-5">
            {FIELDS.map(([l, v]) => (
              <label key={l} className="block">
                {lab(l)}
                <input readOnly value={v} className={field} />
              </label>
            ))}
            <div>
              {lab("About")}
              <div className="mt-2 flex flex-wrap gap-2">
                {["Visit", "Booking", "Products"].map((c, k) => (
                  <span key={c} className={`rounded-full border px-3.5 py-1.5 text-[14px] ${k === 1 ? "border-[var(--sx-accent)] bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "border-[var(--sx-line)]"}`}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <label className="block">
              {lab("Message")}
              <span className={`${field} block min-h-[108px] leading-relaxed`}>
                {msg}
                <span className="cc5-caret ml-px inline-block h-[1.05em] w-[2px] translate-y-[3px] bg-[var(--sx-accent)]" />
              </span>
            </label>
          </div>
          <Btn className="mt-8 w-full justify-center">Send feedback</Btn>
        </form>
      </div>
    </Sec>
  );
}

/* ── CC10 ─────────────────────────────────────────────────────────────── */

/** Light theme variables for the form card on the dark photo. */
const LIGHT = {
  ["--sx-bg" as string]: "#f4efe6",
  ["--sx-surface" as string]: "#fbf8f2",
  ["--sx-text" as string]: "#1c1813",
  ["--sx-muted" as string]: "#6d6457",
  ["--sx-line" as string]: "rgba(28,24,19,.12)",
};

/** CC10 · Photo backdrop with split form card: a full-bleed photo under a dark overlay; the left half carries the
 *  headline, a rule, a get-in-touch button and socials; the right half a light form card (name, email, message) that
 *  unfolds from its corner (M18). */
function CC10() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M18");
  const msg = useTypeLoop(r, "Two of us, late March, the cabin with the stove. Can you pick us up from the station?", 42);
  const field = "mt-2 w-full rounded-[12px] border border-[var(--sx-line)] bg-[var(--sx-bg)] px-4 py-3 text-[15px] text-[var(--sx-text)]";
  return (
    <Sec innerRef={r} theme="ink" font="condensed" full style={{ ["--sx-accent" as string]: "#e9a23b", ["--sx-accent-text" as string]: "#1a1004" }}>
      <style>{CC_CSS}</style>
      <div className="relative">
        <div className="fx-pan absolute -inset-[3%]">
          <Pic i={3} ratio="auto" label="" round={false} className="fx-drift absolute inset-0 h-full w-full" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,9,15,.85),rgba(7,9,15,.55)_55%,rgba(7,9,15,.35))]" />
        <div className="cc5-light pointer-events-none absolute inset-0" />

        <div className="relative grid grid-cols-1 items-center gap-[clamp(36px,5vw,96px)] px-[clamp(20px,5vw,96px)] py-[clamp(80px,10vw,150px)] md:grid-cols-2">
          <div className="text-white">
            <H className="text-[clamp(60px,7vw,108px)] uppercase">Come up the mountain.</H>
            <div data-m-text className="mt-8 h-[3px] w-24 bg-[var(--sx-accent)]" />
            <P className="mt-8 max-w-[40ch] text-white/75">Eleven cabins above the pines, two hours from the nearest town. Tell us your dates and we will plan the rest, from the station pickup to the first fire.</P>
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <Btn>Get in touch</Btn>
              <div className="flex gap-3">
                {[
                  <path key="a" d="M5 8a3 3 0 013-3h8a3 3 0 013 3v8a3 3 0 01-3 3H8a3 3 0 01-3-3zM12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" />,
                  <path key="b" d="M4 7h16v10H4zM10 10l4 2-4 2z" />,
                  <path key="c" d="M12 21s-6-5.5-6-10a6 6 0 0112 0c0 4.5-6 10-6 10zM12 13a2 2 0 100-4 2 2 0 000 4z" />,
                ].map((p, k) => (
                  <span key={k} className="grid h-11 w-11 place-items-center rounded-full border border-white/30 text-white">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
                      {p}
                    </svg>
                  </span>
                ))}
              </div>
            </div>
            <p className="mt-6 text-[14px] text-white/60">@ridgeline.cabins · replies within a day</p>
          </div>

          <form data-m-card onSubmit={(e) => e.preventDefault()} className="rounded-[26px] bg-[var(--sx-surface)] p-[clamp(24px,3vw,44px)] text-[var(--sx-text)] shadow-[0_40px_100px_rgba(0,0,0,.4)] md:justify-self-end md:w-full md:max-w-[560px]" style={LIGHT}>
            <p className="sx-display text-[clamp(34px,3vw,48px)] font-[800] uppercase leading-none">Plan your stay</p>
            <p className="mt-2 text-[15px] text-[var(--sx-muted)]">Cabins from ₹7,800 a night, breakfast and dinner included.</p>
            <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block text-[13px] font-[600] uppercase tracking-[0.1em] text-[var(--sx-muted)]">
                Name
                <input readOnly value="Rohan Bedi" className={field} />
              </label>
              <label className="block text-[13px] font-[600] uppercase tracking-[0.1em] text-[var(--sx-muted)]">
                Email
                <input readOnly value="rohan@mail.example" className={field} />
              </label>
            </div>
            <label className="mt-4 block text-[13px] font-[600] uppercase tracking-[0.1em] text-[var(--sx-muted)]">
              Message
              <span className={`${field} block min-h-[124px] normal-case tracking-normal leading-relaxed`}>
                {msg}
                <span className="cc5-caret ml-px inline-block h-[1.05em] w-[2px] translate-y-[3px] bg-[var(--sx-accent)]" />
              </span>
            </label>
            <Btn className="mt-7 w-full justify-center">Send enquiry</Btn>
          </form>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "CC09", name: "Map panel with info card + side form", motion: "M13", C: CC09 },
  { code: "CC10", name: "Photo backdrop with split form card", motion: "M18", C: CC10 },
];
