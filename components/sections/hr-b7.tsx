"use client";

// HR · Hero layouts, batch 7 (docs/SECTION-MENU.md). Neither opens with a "shape grows to full screen" move.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { scene } from "../fx/shared";
import { ShimmerButton } from "../fx/more";
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

const HR_CSS = `
.hrb7-blob{animation:hrb7-blob 6s linear infinite alternate}
@keyframes hrb7-blob{from{transform:translate(-22%,-12%) scale(.9) rotate(0deg)}to{transform:translate(22%,14%) scale(1.25) rotate(40deg)}}
.hrb7-blob2{animation:hrb7-blob2 4.2s linear infinite alternate}
@keyframes hrb7-blob2{from{transform:translate(20%,10%) scale(1.15)}to{transform:translate(-24%,-10%) scale(.85)}}
.hrb7-in{animation:hrb7-in .55s cubic-bezier(.2,.8,.2,1) both}
@keyframes hrb7-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
html.is-static .hrb7-blob,html.is-static .hrb7-blob2,html.is-static .hrb7-in{animation:none}
html.is-static {.hrb7-blob,.hrb7-blob2,.hrb7-in{animation:none}}
`;

/* ───────────────────────── HR44 · Waitlist cover page ───────────────────────── */

/** HR44 · Waitlist cover: the whole first screen is one minimal cover. A tiny brand mark top-left, a centred block
 *  (small line, big headline, one line of copy, inline email + 'Join waitlist'), and a legal/social line pinned to the
 *  bottom. Nothing else. The join button's border spark runs forever (M64); two colour fields drift behind. */
function HR44() {
  return (
    <Sec theme="paper" font="editorial" className="relative" style={{ ["--accent" as string]: "var(--sx-accent)" }}>
      <style>{HR_CSS}</style>
      <div aria-hidden className="hrb7-blob pointer-events-none absolute left-[8%] top-[6%] aspect-square w-[52vw] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_42%,transparent),transparent)]" />
      <div aria-hidden className="hrb7-blob2 pointer-events-none absolute bottom-[-12%] right-[4%] aspect-square w-[44vw] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,#d9a441_45%,transparent),transparent)]" />
      <div className="relative z-10 flex min-h-[clamp(620px,100svh,980px)] flex-col py-[clamp(24px,3vw,40px)]">
        <a href="#" onClick={(e) => e.preventDefault()} className="flex items-center gap-2.5 self-start">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--sx-text)] text-[var(--sx-bg)]">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
              <path d="M12 3c3 3.5 5 6.4 5 9.5a5 5 0 0 1-10 0C7 9.4 9 6.5 12 3z" />
            </svg>
          </span>
          <span className="text-[16px] font-[650] tracking-[-0.01em]">Fennel &amp; Oat</span>
        </a>

        <div className="mx-auto flex max-w-[860px] flex-1 flex-col items-center justify-center py-[clamp(48px,6vw,96px)] text-center">
          <p className="text-[13px] font-[600] uppercase tracking-[0.18em] text-[var(--sx-accent)]">Bandra · opening 14 May</p>
          <H as="h1" className="mt-6 max-w-[13ch] text-[clamp(60px,8vw,136px)]">Wood-fired bread, first in line.</H>
          <P className="mx-auto mt-6 max-w-[44ch]">A tiny bakery-café with one oven and forty loaves a morning. The waitlist gets the first week&apos;s bread on us.</P>
          <form onSubmit={(e) => e.preventDefault()} className="mt-10 flex w-full max-w-[520px] items-center gap-2 rounded-full border border-[var(--sx-line)] bg-[var(--sx-surface)] p-1.5 pl-6 shadow-[0_30px_60px_-40px_rgba(28,24,19,.5)] max-sm:flex-col max-sm:rounded-[24px] max-sm:p-3">
            <label htmlFor="hr44-mail" className="sr-only">
              Email
            </label>
            <input id="hr44-mail" type="email" placeholder="you@example.com" className="min-w-0 flex-1 bg-transparent py-3 text-[16px] text-[var(--sx-text)] outline-none placeholder:text-[var(--sx-muted)] max-sm:w-full" />
            <ShimmerButton className="shrink-0 text-[15px] max-sm:w-full">Join waitlist</ShimmerButton>
          </form>
          <p className="mt-5 text-[14px] text-[var(--sx-muted)]">1,284 neighbours already on the list</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--sx-line)] pt-5 text-[13px] text-[var(--sx-muted)]">
          <span>© 2026 Fennel &amp; Oat · Concept website</span>
          <span className="flex gap-6">
            {["Instagram", "Newsletter", "Press kit"].map((s) => (
              <a key={s} href="#" onClick={(e) => e.preventDefault()} className="transition-colors hover:text-[var(--sx-text)]">
                {s}
              </a>
            ))}
          </span>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── HR45 · Headline over overlapping device pair ───────────────────────── */

const SLOTS = ["10:00", "11:30", "13:00", "14:30", "16:00", "17:30", "19:00", "20:30"];
const THERAPISTS = [
  { n: "Ira Menon", s: "Deep tissue · 60 min", p: "₹2,400", i: 2 },
  { n: "Kabir Shah", s: "Abhyanga oil · 75 min", p: "₹3,100", i: 1 },
  { n: "Tara Joseph", s: "Foot ritual · 45 min", p: "₹1,600", i: 3 },
  { n: "Rohan Dutta", s: "Hot stone · 90 min", p: "₹3,800", i: 0 },
];

/** HR45 · Headline over an overlapping device pair: a centred badge, headline and two CTAs; below, a wide laptop screen
 *  with a phone overlapping its lower-right corner, both cropped by the bottom of the section. The devices tilt up
 *  from depth with the scroll (M31); on the screens a booking slot and a therapist get picked by themselves. */
function HR45() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M31");
  const [slot] = useAutoCycle(r, SLOTS.length, 1000);
  const t = THERAPISTS[slot % THERAPISTS.length];
  return (
    <Sec innerRef={r} theme="ink" font="wide" className="pt-[clamp(72px,9vw,140px)]">
      <style>{HR_CSS}</style>
      <div aria-hidden className="hrb7-blob pointer-events-none absolute left-[18%] top-[30%] aspect-square w-[64vw] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_42%,transparent),transparent)]" />
      <div className="relative z-10 mx-auto max-w-[960px] text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--sx-line)] bg-[var(--sx-surface)] px-4 py-2 text-[13px]">
          <span className="h-2 w-2 rounded-full bg-[var(--sx-accent)]" />
          New · same-evening bookings in 40 cities
        </span>
        <H as="h1" className="mx-auto mt-7 max-w-[15ch] text-[clamp(44px,5.8vw,92px)]">Your evening, booked in two taps.</H>
        <P className="mx-auto mt-6 max-w-[46ch]">Unwind finds a free therapist near you, holds the slot and pays the spa. No calls, no waiting on hold.</P>
        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <Btn>Get the app</Btn>
          <Btn kind="ghost">List your spa</Btn>
        </div>
      </div>

      {/* device pair, cropped by the section bottom */}
      <div className="relative z-10 mx-auto mt-[clamp(48px,6vw,88px)] h-[clamp(340px,33vw,520px)] max-w-[1180px] overflow-hidden">
        {/* laptop */}
        <div data-m-card className="absolute left-[2%] top-0 w-[82%] rounded-t-[20px] border border-[var(--sx-line)] bg-[#0b0e14] p-[1.2%] shadow-[0_-20px_80px_-30px_color-mix(in_srgb,var(--sx-accent)_50%,transparent)]">
          <div className="aspect-[16/10] overflow-hidden rounded-[10px] bg-[var(--sx-surface)]">
            <div className="flex items-center gap-2 border-b border-[var(--sx-line)] px-5 py-3">
              {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
              ))}
              <span className="ml-4 rounded-full bg-[var(--sx-bg)] px-4 py-1 text-[12px] text-[var(--sx-muted)]">unwind.example/bandra</span>
            </div>
            <div className="grid h-full grid-cols-12">
              <aside className="col-span-3 border-r border-[var(--sx-line)] p-5 text-[13px]">
                <p className="text-[15px] font-[700]">Unwind</p>
                {["Today", "Therapists", "Spas near you", "Gift cards", "My bookings"].map((x, k) => (
                  <p key={x} className={`mt-3 rounded-[8px] px-3 py-2 ${k === 0 ? "bg-[var(--sx-bg)] text-[var(--sx-text)]" : "text-[var(--sx-muted)]"}`}>
                    {x}
                  </p>
                ))}
              </aside>
              <div className="col-span-9 p-6">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[13px] text-[var(--sx-muted)]">Friday, 15 May</p>
                    <p className="mt-1 text-[22px] font-[700]">Free slots tonight</p>
                  </div>
                  <span className="rounded-full bg-[var(--sx-accent)] px-4 py-1.5 text-[13px] font-[650] text-[var(--sx-accent-text)]">{SLOTS[slot]} held</span>
                </div>
                <div className="mt-5 grid grid-cols-4 gap-2.5">
                  {SLOTS.map((s, k) => (
                    <span key={s} className={`rounded-[10px] border py-3 text-center text-[14px] font-[600] tabular-nums transition-colors duration-300 ${k === slot ? "border-[var(--sx-accent)] bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "border-[var(--sx-line)] text-[var(--sx-muted)]"}`}>
                      {s}
                    </span>
                  ))}
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[0, 1, 3].map((i, k) => (
                    <div key={k} className="relative aspect-[4/3] overflow-hidden rounded-[10px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={scene(i, 600, 450, "")} alt="" className={`absolute inset-0 h-full w-full object-cover ${k === 1 ? "fx-drift" : "fx-pan"}`} draggable={false} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* phone, overlapping the laptop's lower-right corner */}
        <div data-m-card className="absolute right-[3%] top-[22%] w-[clamp(200px,19vw,260px)] rounded-[36px] border border-[var(--sx-line)] bg-[#0b0e14] p-[9px] shadow-[0_40px_80px_-30px_rgba(0,0,0,.8)]">
          <div className="relative aspect-[9/19] overflow-hidden rounded-[28px] bg-[var(--sx-bg)] px-4 pt-9">
            <span className="absolute left-1/2 top-2.5 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />
            <p className="text-[12px] text-[var(--sx-muted)]">Near Bandra West</p>
            <p className="mt-1 text-[18px] font-[700] leading-tight">Pick a therapist</p>
            <div className="mt-4 space-y-2.5">
              {THERAPISTS.map((x) => (
                <div key={x.n} className={`flex items-center gap-3 rounded-[14px] border p-2.5 transition-colors duration-300 ${x.n === t.n ? "border-[var(--sx-accent)] bg-[color-mix(in_srgb,var(--sx-accent)_16%,transparent)]" : "border-[var(--sx-line)]"}`}>
                  <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={scene(x.i, 120, 120, "")} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-[650]">{x.n}</span>
                    <span className="block truncate text-[12px] text-[var(--sx-muted)]">{x.s}</span>
                  </span>
                  <span className="text-[12px] font-[650] tabular-nums">{x.p}</span>
                </div>
              ))}
            </div>
            <div key={t.n} className="hrb7-in mt-4 rounded-[14px] bg-[var(--sx-accent)] p-3 text-[13px] font-[650] text-[var(--sx-accent-text)]">
              Book {t.n.split(" ")[0]} · {SLOTS[slot]}
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "HR44", name: "Waitlist cover page", motion: "M64", C: HR44 },
  { code: "HR45", name: "Headline over overlapping device pair", motion: "M31", C: HR45 },
];
