"use client";

// CT · Call-to-action layouts (docs/SECTION-MENU.md). Each is a full designed section; motion via useSectionMotion or fx.
import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { BendMarquee } from "../fx/text";
import { Btn, H, P, Pic, Product, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** CT01 · Accent band: a giant CTA line across the width and one button, letters pop from a mask. */
function CT01() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M12");
  return (
    <Sec innerRef={r} theme="ink" font="condensed" className="py-[clamp(72px,9vw,140px)]"
      // the band IS the accent: flip the theme so background = accent colour, text = dark
      style={{ ["--sx-bg" as string]: "#d7ff3a", ["--sx-text" as string]: "#0b0d06", ["--sx-muted" as string]: "rgba(11,13,6,.7)", ["--sx-line" as string]: "rgba(11,13,6,.2)" }}
    >
      <H className="text-[clamp(64px,12.5vw,220px)] leading-[0.86]">
        Charge the
        <br />
        whole day.
      </H>
      <div className="mt-[clamp(32px,4vw,56px)] flex flex-wrap items-end justify-between gap-6 border-t border-[var(--sx-line)] pt-8">
        <p data-m-text className="max-w-[40ch] text-[clamp(16px,1.2vw,19px)] leading-relaxed text-[var(--sx-muted)]">
          Twelve-can starter box, three flavours, free delivery. ₹1,140 instead of ₹1,320.
        </p>
        <a href="#" onClick={(e) => e.preventDefault()} data-m-card className="sx-btn bg-[var(--sx-text)] text-[var(--sx-bg)]">
          Get the starter box →
        </a>
      </div>
    </Sec>
  );
}

/** CT02 · CTA card sitting over a slow marquee of brand words that bends with scroll speed (BendMarquee = M44). */
function CT02() {
  return (
    <Sec theme="stone" font="wide" full className="py-[clamp(72px,9vw,140px)]">
      {/* marquee rows and the card share one grid cell, so the section grows with whichever is taller (no clipping on phones) */}
      <div className="grid grid-cols-[minmax(0,1fr)]">
        <div aria-hidden className="pointer-events-none min-w-0 select-none self-center text-[clamp(64px,10vw,180px)] leading-none text-[color-mix(in_srgb,var(--sx-text)_9%,transparent)] [grid-area:1/1] [&_.font-display]:font-[800] [&_.font-display]:[font-family:var(--sx-display-font)]">
          <BendMarquee words={["Studio sound", "Open back", "Hand tuned", "Walnut cups", "Forty hours"]} />
          <BendMarquee words={["Forty hours", "Walnut cups", "Studio sound", "Hand tuned", "Open back"]} className="-mt-[0.4em]" />
        </div>
        <div className="relative z-10 grid place-items-center px-[clamp(20px,5vw,96px)] py-6 [grid-area:1/1]">
          <div className="sx-card w-full max-w-[620px] p-[clamp(26px,3.4vw,52px)] text-center shadow-[0_30px_80px_-30px_rgba(17,20,24,.35)]">
            <H className="text-[clamp(36px,4.2vw,64px)]">Hear the room again.</H>
            <P className="mx-auto mt-4 max-w-[38ch]">The Aria open-back headphones, tuned by hand. Try them at home for 30 days.</P>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Btn>Order · ₹24,900</Btn>
              <Btn kind="ghost">Book a listening</Btn>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/** CT03 · Photo background with a frosted glass card holding the CTA; the photo opens up as it scrolls in. */
function CT03() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M13");
  return (
    <Sec innerRef={r} theme="ink" font="editorial" className="py-[clamp(40px,5vw,72px)]">
      <div className="relative min-h-[clamp(560px,82svh,820px)]">
        <Pic i={3} ratio="auto" className="absolute inset-0 h-full w-full" />
        <div className="relative flex min-h-[clamp(560px,82svh,820px)] items-end p-[clamp(16px,3vw,48px)] md:items-center">
          <div className="w-full max-w-[520px] rounded-[22px] border border-white/20 bg-white/10 p-[clamp(24px,3vw,44px)] text-white backdrop-blur-xl">
            <H className="text-[clamp(40px,4.6vw,72px)]">Sit a little longer.</H>
            <P className="mt-4 max-w-[36ch] text-white/75">The Oru lounge chair in solid teak and woven cane. Made to order in eight weeks.</P>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Btn>Reserve yours</Btn>
              <span data-m-text className="text-[15px] text-white/80">
                From <b className="font-[650] text-white">₹68,000</b>
              </span>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/** CT04 · Countdown launch banner: days / hrs / min / sec count up into place, then tick down every second. */
const START = { d: 6, h: 14, m: 32, s: 8 };
function CT04() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M3");
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    const cells = Array.from(el.querySelectorAll<HTMLElement>("[data-m-num]"));
    let left = ((START.d * 24 + START.h) * 60 + START.m) * 60 + START.s;
    let tick: ReturnType<typeof setInterval> | undefined;
    let wait: ReturnType<typeof setTimeout> | undefined;
    const paint = () => {
      const v = [Math.floor(left / 86400), Math.floor(left / 3600) % 24, Math.floor(left / 60) % 60, left % 60];
      cells.forEach((c, i) => (c.textContent = String(v[i]).padStart(2, "0")));
    };
    const io = new IntersectionObserver(
      ([e]) => {
        clearInterval(tick);
        clearTimeout(wait);
        // start ticking once the count-up (M3) has landed
        if (e.isIntersecting)
          wait = setTimeout(() => {
            tick = setInterval(() => {
              left = Math.max(0, left - 1);
              paint();
            }, 1000);
          }, 2000);
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(tick);
      clearTimeout(wait);
    };
  }, []);
  const units: [string, number][] = [
    ["Days", START.d],
    ["Hours", START.h],
    ["Minutes", START.m],
    ["Seconds", START.s],
  ];
  return (
    <Sec innerRef={r} theme="ink" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <div className="grid grid-cols-1 items-center gap-[clamp(36px,5vw,80px)] md:grid-cols-12">
        <div className="md:col-span-7">
          <H className="text-[clamp(44px,5.6vw,92px)]">The Kite 2 drops Friday.</H>
          <P className="mt-5 max-w-[42ch]">A lighter, louder runner in three colours and only 1,500 pairs. Join the list to get first access before the public sale.</P>
          <div className="mt-[clamp(32px,4vw,52px)] grid grid-cols-4 gap-[clamp(8px,1.2vw,16px)]">
            {units.map(([u, v]) => (
              <div key={u} data-m-card className="sx-card px-2 py-[clamp(16px,2vw,26px)] text-center">
                <span data-m-num className="sx-display block text-[clamp(36px,5vw,80px)] font-[700] leading-none tabular-nums">
                  {String(v).padStart(2, "0")}
                </span>
                <span className="mt-2 block text-[12px] uppercase tracking-[0.14em] text-[var(--sx-muted)]">{u}</span>
              </div>
            ))}
          </div>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Btn>Get early access</Btn>
            <span data-m-text className="text-[15px] text-[var(--sx-muted)]">
              Launch price <b className="font-[650] text-[var(--sx-text)]">₹11,499</b>
            </span>
          </div>
        </div>
        <div className="relative grid place-items-center md:col-span-5">
          <div className="absolute aspect-square w-[80%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_40%,transparent),transparent)]" />
          <Pic i={0} ratio="4/5" className="relative w-full max-w-[420px]" label="KITE 2" />
        </div>
      </div>
    </Sec>
  );
}

/** CT05 · Three steps that end in the CTA: steps 1 and 2 are cards, step 3 IS the button card. */
function CT05() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const steps = [
    ["Pick your roast", "Light, medium or dark. Not sure? Take the two-minute taste quiz."],
    ["Choose a rhythm", "250 g every one, two or four weeks. Skip or pause whenever you like."],
  ];
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <H className="max-w-[18ch] text-[clamp(44px,5.4vw,88px)]">Fresh beans in three steps.</H>
      <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 gap-[clamp(12px,1.4vw,20px)] md:grid-cols-3">
        {steps.map(([t, d], k) => (
          <div key={t} data-m-card className="sx-card flex min-h-[260px] flex-col justify-between gap-10 p-[clamp(22px,2.4vw,34px)]">
            <span className="sx-display text-[clamp(48px,4.6vw,72px)] leading-none text-[var(--sx-accent)]">{k + 1}</span>
            <div>
              <h3 className="text-[clamp(20px,1.7vw,24px)] font-[650]">{t}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[var(--sx-muted)]">{d}</p>
            </div>
          </div>
        ))}
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          data-m-card
          className="group flex min-h-[260px] flex-col justify-between gap-10 rounded-[var(--sx-radius)] bg-[var(--sx-accent)] p-[clamp(22px,2.4vw,34px)] text-[var(--sx-accent-text)]"
        >
          <span className="sx-display text-[clamp(48px,4.6vw,72px)] leading-none">3</span>
          <div>
            <h3 className="text-[clamp(20px,1.7vw,24px)] font-[650]">Start your subscription</h3>
            <p className="mt-2 flex items-center justify-between gap-4 text-[15px] opacity-85">
              First bag ₹399, then ₹549
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--sx-accent-text)] text-[var(--sx-accent)] transition-transform duration-500 group-hover:translate-x-1">→</span>
            </p>
          </div>
        </a>
      </div>
    </Sec>
  );
}

/** CT06 · Split choice: two halves (Shop online / Find a store), each its own CTA; halves unfold from a corner. */
function CT06() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M18");
  return (
    <Sec innerRef={r} theme="stone" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <H className="max-w-[16ch] text-[clamp(44px,5.4vw,88px)]">Two ways to smell it first.</H>
      <div className="mt-[clamp(36px,5vw,64px)] grid grid-cols-1 gap-[clamp(12px,1.4vw,20px)] md:grid-cols-2">
        <div data-m-card className="relative flex min-h-[clamp(380px,40vw,560px)] flex-col justify-between overflow-hidden rounded-[var(--sx-radius)] bg-[var(--sx-text)] p-[clamp(24px,3vw,44px)] text-[var(--sx-bg)]">
          <div className="relative z-10">
            <h3 className="sx-display text-[clamp(34px,3.4vw,54px)] leading-none">Shop online</h3>
            <p className="mt-3 max-w-[30ch] text-[15px] leading-relaxed opacity-70">Five 2 ml samplers of the Monsoon collection, delivered in two days. ₹750, credited to your first bottle.</p>
          </div>
          <Product angle={2} accent="#c99a5b" className="pointer-events-none absolute -right-[4%] bottom-0 h-[78%] w-auto max-md:h-[62%]" />
          <a href="#" onClick={(e) => e.preventDefault()} className="sx-btn relative z-10 self-start bg-[var(--sx-bg)] text-[var(--sx-text)]">
            Order the samplers →
          </a>
        </div>
        <div data-m-card className="relative flex min-h-[clamp(380px,40vw,560px)] flex-col justify-between overflow-hidden rounded-[var(--sx-radius)] p-[clamp(24px,3vw,44px)] text-white">
          <Pic i={3} ratio="auto" round={false} className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.45),rgba(0,0,0,.05)_45%,rgba(0,0,0,.55))]" />
          <div className="relative">
            <h3 className="sx-display text-[clamp(34px,3.4vw,54px)] leading-none">Find a store</h3>
            <p className="mt-3 max-w-[30ch] text-[15px] leading-relaxed text-white/75">Twelve fragrance bars in six cities. Walk in, try all nine scents, leave with a free decant.</p>
          </div>
          <a href="#" onClick={(e) => e.preventDefault()} className="sx-btn relative self-start border border-white/40 text-white">
            See the stores →
          </a>
        </div>
      </div>
    </Sec>
  );
}

export const CTA: SectionDef[] = [
  { code: "CT01", name: "Accent band, giant CTA line", motion: "M12", C: CT01 },
  { code: "CT02", name: "CTA card over a bending marquee", motion: "M44", C: CT02 },
  { code: "CT03", name: "Photo with frosted glass CTA card", motion: "M13", C: CT03 },
  { code: "CT04", name: "Countdown launch banner", motion: "M3", C: CT04 },
  { code: "CT05", name: "Three steps ending in the CTA", motion: "M23", C: CT05 },
  { code: "CT06", name: "Split choice: shop online / find a store", motion: "M18", C: CT06 },
];
