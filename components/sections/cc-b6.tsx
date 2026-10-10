"use client";

// CC · Contact layouts, batch 6 (CC11–CC12). Contact through named people (a vCard that opens by itself) and through a
// voice note (a record button under light rays). No phone numbers anywhere: call-backs and .example emails only.
// Loops stop in ?static=1.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { MagneticButton } from "../fx/layout";
import { LightRays } from "../fx/more";
import { Avatar, Btn, H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Runs `fn` every `ms` while the element is on screen (stops off screen and in ?static=1 / reduced motion). */
function useOnScreenInterval(ref: React.RefObject<HTMLElement | null>, ms: number, fn: () => void) {
  const cb = useRef(fn);
  useEffect(() => {
    cb.current = fn;
  });
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let t: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (e.isIntersecting) t = setInterval(() => cb.current(), ms);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, [ref, ms]);
}

const CC6_CSS = `
.cc6-glow{animation:cc6-glow 4.6s linear infinite alternate}
@keyframes cc6-glow{from{translate:-16% -8%}to{translate:16% 10%}}
.cc6-tilt{animation:cc6-tilt 1.8s ease-in-out infinite alternate}
@keyframes cc6-tilt{from{transform:rotateY(-7deg) rotateX(3deg)}to{transform:rotateY(7deg) rotateX(-3deg)}}
.cc6-ping{animation:cc6-ping 2.4s cubic-bezier(0,0,.2,1) infinite}
@keyframes cc6-ping{from{transform:scale(.7);opacity:.8}to{transform:scale(1.9);opacity:0}}
.cc6-bar{transform-origin:center;animation:cc6-bar var(--d,1s) ease-in-out infinite alternate}
@keyframes cc6-bar{from{transform:scaleY(.18)}to{transform:scaleY(1)}}
.cc6-blink{animation:cc6-blink 1s steps(1) infinite}
@keyframes cc6-blink{50%{opacity:.2}}
html.is-static .cc6-glow,html.is-static .cc6-tilt,html.is-static .cc6-bar,html.is-static .cc6-blink{animation:none}
html.is-static .cc6-ping{animation:none;opacity:0}
html.is-static {.cc6-glow,.cc6-tilt,.cc6-bar,.cc6-blink{animation:none}.cc6-ping{animation:none;opacity:0}}
`;

/* ───────────────────────── CC11 · People grid with vCard overlay ───────────────────────── */

const PEOPLE = [
  { n: "Ira Menon", r: "Founder, creative director", i: 3, city: "Mumbai · Fort" },
  { n: "Kabir Shah", r: "Head of brand strategy", i: 1, city: "Mumbai · Fort" },
  { n: "Tara Joseph", r: "Design director", i: 2, city: "Bengaluru" },
  { n: "Arjun Rao", r: "Motion & film lead", i: 0, city: "Bengaluru" },
  { n: "Meher Kapoor", r: "New business", i: 1, city: "Delhi · Lodhi" },
  { n: "Dev Iyer", r: "Technology partner", i: 3, city: "Remote" },
  { n: "Nila Das", r: "Producer", i: 0, city: "Mumbai · Fort" },
  { n: "Rohan Bhat", r: "Copy & naming", i: 2, city: "Goa" },
];
const mail = (n: string) => `${n.split(" ")[0].toLowerCase()}@studiowren.example`;

/** CC11 · A grid of the people you can contact; picking one opens a business card over the grid (photo, name, role,
 *  direct line, email, save contact). Tiles snap in from different sides (M34); hands-free, one card after another
 *  opens, tilts in 3D and closes again. */
function CC11() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  // odd steps: card closed (the next tile is highlighted) · even steps: that person's card is open
  const [step, setStep] = useState(1);
  useOnScreenInterval(r, 1700, () => setStep((s) => s + 1));
  const who = Math.ceil(step / 2) % PEOPLE.length;
  const open = step % 2 === 0;
  const p = PEOPLE[who];
  return (
    <Sec innerRef={r} theme="paper" font="grotesk" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#3a5bd9", ["--sx-accent-text" as string]: "#f5f7ff" }}>
      <style>{CC6_CSS}</style>
      <div className="cc6-glow pointer-events-none absolute -right-[12%] top-[-12%] aspect-square w-[min(66vw,880px)] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_36%,transparent),transparent)]" />
      <div className="relative z-10 grid grid-cols-1 items-end gap-6 md:grid-cols-12">
        <H className="text-[clamp(44px,5.2vw,88px)] md:col-span-7">Talk to a person, not an inbox.</H>
        <P className="max-w-[40ch] md:col-span-5">Studio Wren is eighteen people across four cities. Pick whoever fits your question; they answer their own mail, usually the same day.</P>
      </div>

      <div className="relative z-10 mt-[clamp(36px,4.5vw,64px)]">
        <div className="grid grid-cols-2 gap-[clamp(12px,1.4vw,22px)] md:grid-cols-4">
          {PEOPLE.map((x, k) => {
            const hi = k === who;
            return (
              <div key={x.n} data-m-card role="button" tabIndex={0} onClick={() => setStep(k === 0 ? PEOPLE.length * 2 : k * 2)} className="cursor-pointer" data-cursor="Card">
                <div className={`rounded-[var(--sx-radius,18px)] transition-shadow duration-500 ${hi ? "shadow-[0_0_0_3px_var(--sx-accent)]" : ""}`}>
                  <Pic i={x.i} ratio="5/6" label="" />
                </div>
                <p className="mt-3 text-[16px] font-[650]">{x.n}</p>
                <p className="mt-0.5 text-[14px] text-[var(--sx-muted)]">{x.r}</p>
              </div>
            );
          })}
        </div>

        {/* the vCard overlay */}
        <div className={`absolute inset-[-12px] z-20 grid place-items-center rounded-[24px] transition-[background-color,backdrop-filter] duration-500 ${open ? "pointer-events-auto bg-[color-mix(in_srgb,var(--sx-bg)_62%,transparent)] backdrop-blur-[6px]" : "pointer-events-none bg-transparent"}`} onClick={() => setStep((s) => s + 1)}>
          <div
            className="w-[min(620px,92%)] transition-[transform,opacity] duration-700 ease-[cubic-bezier(.2,.8,.2,1)]"
            style={{ transform: open ? "perspective(1400px) rotateY(0deg) rotateX(0deg) scale(1)" : "perspective(1400px) rotateY(-58deg) rotateX(14deg) scale(.82)", opacity: open ? 1 : 0 }}
          >
            <div className="[perspective:1200px]">
              <div className={`${open ? "cc6-tilt" : ""} grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] overflow-hidden rounded-[22px] border border-[var(--sx-line)] bg-[var(--sx-surface)] shadow-[0_40px_90px_-30px_rgba(28,24,19,.55)]`} onClick={(e) => e.stopPropagation()}>
                <Pic i={p.i} ratio="auto" round={false} label="" className="h-full min-h-[300px] w-full" />
                <div className="p-[clamp(20px,2.2vw,32px)]">
                  <div className="flex items-center justify-between gap-3">
                    <Avatar name={p.n} i={who} size={36} />
                    <span className="text-[12px] font-[650] uppercase tracking-[0.14em] text-[var(--sx-muted)]">Studio Wren</span>
                  </div>
                  <p className="sx-display mt-5 text-[clamp(26px,2.2vw,34px)] font-[750] leading-[1.05]">{p.n}</p>
                  <p className="mt-1 text-[15px] text-[var(--sx-muted)]">{p.r}</p>
                  <dl className="mt-5 space-y-2.5 border-t border-[var(--sx-line)] pt-4 text-[14px]">
                    <div className="flex justify-between gap-4">
                      <dt className="text-[var(--sx-muted)]">Direct line</dt>
                      <dd className="text-right">Call-back on request</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-[var(--sx-muted)]">Email</dt>
                      <dd className="truncate text-right">{mail(p.n)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-[var(--sx-muted)]">Studio</dt>
                      <dd className="text-right">{p.city}</dd>
                    </div>
                  </dl>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Btn className="px-5!">Save contact</Btn>
                    <Btn kind="ghost" className="px-5!">
                      Book 20 min
                    </Btn>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── CC12 · Voice-note contact ───────────────────────── */

const BARS = Array.from({ length: 64 }, (_, k) => ({ h: 30 + ((k * 47) % 70), d: 0.55 + ((k * 13) % 9) / 12, delay: -((k * 29) % 17) / 10 }));

/** CC12 · A big round record button in the centre ("Leave us a voice note") pulsing under soft light rays (M61); a
 *  waveform draws itself on loop with a running timer, the button leans like a magnet; a text-form link below. */
function CC12() {
  const r = useRef<HTMLDivElement>(null);
  const [sec, setSec] = useState(24);
  useOnScreenInterval(r, 1000, () => setSec((s) => (s + 1) % 60));
  return (
    <Sec innerRef={r} theme="ink" font="editorial" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#ff6a4d", ["--sx-accent-text" as string]: "#1a0703", ["--accent" as string]: "#ff6a4d" }}>
      <style>{CC6_CSS}</style>
      <LightRays className="absolute inset-0" count={9} />
      <div className="pointer-events-none absolute inset-x-0 top-[30%] flex justify-center">
        <div className="cc6-glow aspect-square w-[min(70vw,860px)] shrink-0 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_38%,transparent),transparent)]" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_44%_30%_at_50%_24%,rgba(7,9,15,.55),transparent)]" />

      <div className="relative z-10 mx-auto flex max-w-[980px] flex-col items-center text-center">
        <H className="max-w-[14ch] text-[clamp(52px,6.4vw,112px)] font-[500]">Leave us a voice note.</H>
        <P className="mx-auto mt-6 max-w-[46ch] text-white/75">Hum the hook, describe the gig, pitch the record. Up to sixty seconds; a producer at Lowtide listens to every one.</P>

        <div className="relative mt-[clamp(32px,4vw,56px)] grid h-[clamp(240px,20vw,300px)] w-full place-items-center">
          <span className="cc6-ping absolute aspect-square w-[clamp(150px,13vw,196px)] rounded-full border-2 border-[var(--sx-accent)]" />
          <span className="cc6-ping absolute aspect-square w-[clamp(150px,13vw,196px)] rounded-full border-2 border-[var(--sx-accent)] [animation-delay:-1.2s]" />
          <MagneticButton className="relative grid! aspect-square w-[clamp(150px,13vw,196px)] place-items-center rounded-full! p-0! shadow-[0_0_80px_-10px_var(--sx-accent)]">
            <span className="flex flex-col items-center gap-2 text-[var(--sx-accent-text)]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-10 w-10" aria-hidden>
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
              </svg>
              <span className="text-[14px] font-[700] uppercase tracking-[0.12em]">Tap to record</span>
            </span>
          </MagneticButton>
        </div>

        <div className="mt-4 flex w-full items-center gap-5 rounded-full border border-white/12 bg-white/[0.04] px-6 py-4 backdrop-blur-sm">
          <span className="flex shrink-0 items-center gap-2 text-[14px] font-[650] tabular-nums text-white">
            <span className="cc6-blink h-2.5 w-2.5 rounded-full bg-[var(--sx-accent)]" />
            0:{String(sec).padStart(2, "0")}
          </span>
          <div className="flex h-[64px] min-w-0 flex-1 items-center justify-between gap-[3px] overflow-hidden" aria-hidden>
            {BARS.map((b, k) => (
              <span key={k} className="cc6-bar block w-[5px] shrink-0 rounded-full bg-[var(--sx-accent)]" style={{ height: `${b.h}%`, ["--d" as string]: `${b.d}s`, animationDelay: `${b.delay}s`, opacity: 0.55 + (k % 4) * 0.12 }} />
            ))}
          </div>
          <span className="shrink-0 text-[14px] text-white/60">/ 1:00</span>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[15px] text-white/70">
          <Btn kind="link">Rather type it? Use the form →</Btn>
          <span>or write to demos@lowtide.example</span>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "CC11", name: "People grid with vCard overlay", motion: "M34", C: CC11 },
  { code: "CC12", name: "Voice-note contact", motion: "M61", C: CC12 },
];
