"use client";

// SP · Social proof layouts, batch 6 (docs/SECTION-MENU.md): SP19 three video testimonial cards (a looping silent
// clip thumb, name, result stat, quote; they "play" in turn), SP20 one large photo + quote card straddling a tall
// colour column (auto-slides, arrows), SP21 a quote with avatar beside a 2×2 stat grid on thick rules (counts up).
// Everything auto-plays while on screen and holds its first state in ?static=1.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { scene } from "../fx/shared";
import { Avatar, Btn, H, P, Sec, Stars } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Steps an index every `ms` while `ref` is on screen (stops off screen and in ?static=1). `live` = motion allowed. */
function useCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms: number) {
  const [i, setI] = useState(0);
  const [live, setLive] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    setLive(true);
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
  return [i, setI, live] as const;
}

const CSS = `.sp6kb img{animation:sp6kbs 4.6s linear infinite alternate,sp6kbt 3.1s ease-in-out infinite alternate}
@keyframes sp6kbs{from{scale:1.04}to{scale:1.22}}@keyframes sp6kbt{from{translate:-4% 2%}to{translate:4% -2%}}
.sp6glow{animation:sp6gx 6s linear infinite alternate,sp6gs 3.7s ease-in-out infinite alternate}
@keyframes sp6gx{from{translate:-18% -8%}to{translate:18% 10%}}@keyframes sp6gs{from{scale:.85}to{scale:1.2}}
.sp6fill{animation:sp6fill var(--d) linear forwards}@keyframes sp6fill{from{scale:0 1}to{scale:1 1}}
.sp6in{animation:sp6in .7s cubic-bezier(.2,.7,.2,1) both}@keyframes sp6in{from{opacity:0;translate:24px 0}to{opacity:1;translate:0 0}}
.sp6scan{animation:sp6scan 2.4s linear infinite}@keyframes sp6scan{from{translate:0 -100%}to{translate:0 100%}}
html.is-static .sp6kb img,html.is-static .sp6glow,html.is-static .sp6fill,html.is-static .sp6in,html.is-static .sp6scan{animation:none}
html.is-static {.sp6kb img,.sp6glow,.sp6fill,.sp6in,.sp6scan{animation:none}}`;

/** Placeholder photo with a slow two-loop drift. */
function Shot({ i, className = "" }: { i: number; className?: string }) {
  return (
    <div className={`sp6kb relative overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={scene(i, 900, 1100, "")} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
    </div>
  );
}

/** A big soft accent glow that drifts (the CSS safety-net loop, LESSONS batch 5). */
const Glow = ({ className = "" }: { className?: string }) => (
  <span aria-hidden className={`sp6glow pointer-events-none absolute rounded-full blur-[70px] ${className}`} style={{ background: "radial-gradient(closest-side, color-mix(in srgb, var(--sx-accent) 55%, transparent), transparent)" }} />
);

/* ───────────────────────────── SP19 · Video testimonial cards ───────────────────────────── */

const CLIENTS = [
  { who: "Rhea Kapadia", role: "Software lead · 38", stat: "−9 kg", note: "in 16 weeks", q: "Three short sessions a week, before my standup. I have never stuck with anything this long.", len: "0:42", i: 1 },
  { who: "Aman Sethi", role: "Chef · 44", stat: "120 kg", note: "first deadlift PR", q: "My coach rebuilt my hinge from scratch. My back stopped aching on double shifts.", len: "0:38", i: 3 },
  { who: "Zoya Mirza", role: "Teacher · 31", stat: "21 km", note: "first half marathon", q: "I could not run to the gate in January. In October I crossed a finish line in tears.", len: "0:51", i: 0 },
];

/** SP19 · Three cards, each a looping clip thumb with a play button and runtime, then the result stat, quote and name. Clips "play" in turn (or on click). */
function SP19() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  const [p, setP, live] = useCycle(r, CLIENTS.length, 2600);
  return (
    <Sec innerRef={r} theme="ink" font="condensed" className="py-[clamp(72px,9vw,140px)]">
      <style>{CSS}</style>
      <Glow className="-top-[10%] left-[30%] h-[60%] w-[46%] opacity-70" />
      <div className="relative z-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <H className="max-w-[13ch] text-[clamp(52px,6.4vw,108px)] uppercase">Hear it from the floor.</H>
          <div className="max-w-[36ch] pb-2">
            <P>Members filmed these on their own phones after a training block at the Foundry. No scripts, no retakes.</P>
          </div>
        </div>

        <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 gap-[clamp(16px,1.8vw,28px)] md:grid-cols-3">
          {CLIENTS.map((c, k) => {
            const on = live && k === p;
            return (
              <article key={c.who} data-m-card className={`sx-card flex flex-col overflow-hidden transition-colors duration-700 ${on ? "border-[var(--sx-accent)]!" : ""}`}>
                <button onClick={() => setP(k)} aria-label={`Play ${c.who}'s story`} className="relative block aspect-[16/11] w-full overflow-hidden text-left" data-cursor="Play">
                  <Shot i={c.i} className="absolute inset-0 h-full w-full" />
                  {/* scan-line shimmer while "playing" */}
                  {on && <span aria-hidden className="sp6scan pointer-events-none absolute inset-x-0 top-0 h-full bg-[linear-gradient(180deg,transparent,rgba(255,255,255,.14),transparent)]" />}
                  <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgba(0,0,0,.6))]" />
                  <span className={`absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full transition-all duration-500 ${on ? "scale-75 bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "bg-white/90 text-black"}`}>
                    {on ? (
                      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden><rect x="3" y="2" width="4" height="14" rx="1" fill="currentColor" /><rect x="11" y="2" width="4" height="14" rx="1" fill="currentColor" /></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden><path d="M5 2.5 15 9 5 15.5z" fill="currentColor" /></svg>
                    )}
                  </span>
                  <span className="absolute left-4 top-4 rounded-full bg-black/55 px-3 py-1 text-[12px] font-[600] uppercase tracking-[0.12em] text-white">{on ? "Playing · muted" : c.len}</span>
                  <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-white/20">
                    {on && <span key={`f${p}`} className="sp6fill block h-full w-full origin-left bg-[var(--sx-accent)]" style={{ ["--d" as string]: "2600ms" }} />}
                  </span>
                </button>
                <div className="flex flex-1 flex-col p-[clamp(20px,2vw,30px)]">
                  <div className="flex items-baseline gap-3">
                    <p className="sx-display text-[clamp(44px,4vw,64px)] font-[800] leading-none tracking-[-0.02em] text-[var(--sx-accent)]">{c.stat}</p>
                    <p className="text-[14px] uppercase tracking-[0.12em] text-[var(--sx-muted)]">{c.note}</p>
                  </div>
                  <p className="mt-4 flex-1 text-[clamp(16px,1.25vw,19px)] leading-[1.5]">&ldquo;{c.q}&rdquo;</p>
                  <div className="mt-6 flex items-center gap-3 border-t border-[var(--sx-line)] pt-5">
                    <Avatar name={c.who} i={k + 1} size={40} />
                    <div>
                      <p className="text-[15px] font-[650]">{c.who}</p>
                      <p className="text-[13px] text-[var(--sx-muted)]">{c.role}</p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <p className="text-[15px] text-[var(--sx-muted)]">Coached blocks from ₹6,500 a month · first week free</p>
          <Btn>Book a trial session</Btn>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────────── SP20 · Overlapping slider card on a colour column ───────────────────────────── */

const GUESTS = [
  { q: "We woke to mist on the tea slopes and breakfast already on the veranda. Nobody asked us to be anywhere.", who: "Nandini Rao", stay: "Hill Suite · 4 nights", i: 2 },
  { q: "The kind of quiet you forget exists. Our daughter learned every bird call by the third morning.", who: "Karan Malhotra", stay: "Garden Cottage · 3 nights", i: 0 },
  { q: "They remembered how I take my coffee from a stay two years ago. That is hospitality.", who: "Elena D'Souza", stay: "Lake Room · 2 nights", i: 3 },
  { q: "Linen sheets, a deep bath and a window full of hills. I cancelled the day trips I had planned.", who: "Siddharth Jain", stay: "Hill Suite · 5 nights", i: 1 },
];

/** SP20 · A tall colour block fills the left third; a large card (photo left, quote right) starts inside it and overlaps far into the light side. Auto-slides; arrows below. */
function SP20() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M18");
  const [i, setI, live] = useCycle(r, GUESTS.length, 3200);
  const g = GUESTS[i];
  const n = GUESTS.length;
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <style>{CSS}</style>
      {/* the colour column */}
      <div aria-hidden className="absolute inset-y-0 left-0 w-full overflow-hidden bg-[var(--sx-accent)] md:w-[33%]">
        <span className="sp6glow absolute left-[-30%] top-[10%] h-[70%] w-[160%] rounded-full blur-[60px]" style={{ background: "radial-gradient(closest-side, rgba(255,240,220,.45), transparent)" }} />
      </div>
      <div className="relative z-10">
        <div className="grid grid-cols-1 items-end gap-6 md:grid-cols-12">
          <p className="text-[15px] font-[600] uppercase tracking-[0.16em] text-[var(--sx-accent-text)] md:col-span-4">Guest book · Ooty</p>
          <div className="md:col-span-8">
            <H className="max-w-[16ch] text-[clamp(44px,5vw,84px)] font-[500]">Slow mornings, written down.</H>
          </div>
        </div>

        <div data-m-card className="sx-card mt-[clamp(40px,5vw,72px)] grid grid-cols-1 overflow-hidden bg-[var(--sx-surface)]! shadow-[0_40px_90px_-40px_rgba(0,0,0,.45)] md:ml-[6%] md:mr-[4%] md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="relative min-h-[340px] overflow-hidden">
            {GUESTS.map((x, k) => (
              <div key={x.who} className="absolute inset-0 transition-opacity duration-700" style={{ opacity: k === i ? 1 : 0 }}>
                <Shot i={x.i} className="h-full w-full" />
              </div>
            ))}
          </div>
          <div key={`q${i}`} className={`flex flex-col justify-between gap-10 p-[clamp(28px,3.4vw,60px)] ${live ? "sp6in" : ""}`}>
            <div>
              <span aria-hidden className="sx-display block text-[96px] leading-[0.6] text-[var(--sx-accent)]">&ldquo;</span>
              <blockquote className="sx-display mt-4 text-[clamp(24px,2.3vw,38px)] leading-[1.25]">{g.q}</blockquote>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--sx-line)] pt-6">
              <div className="flex items-center gap-3">
                <Avatar name={g.who} i={i} size={46} />
                <div>
                  <p className="text-[16px] font-[650]">{g.who}</p>
                  <p className="text-[13px] text-[var(--sx-muted)]">{g.stay}</p>
                </div>
              </div>
              <Stars />
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-5 md:ml-[6%] md:mr-[4%]">
          <div className="flex items-center gap-3">
            <button onClick={() => setI((v) => (v - 1 + n) % n)} aria-label="Previous story" className="grid h-12 w-12 place-items-center rounded-full border border-[var(--sx-line)] bg-[var(--sx-surface)] text-[18px]">←</button>
            <button onClick={() => setI((v) => (v + 1) % n)} aria-label="Next story" className="grid h-12 w-12 place-items-center rounded-full bg-[var(--sx-text)] text-[18px] text-[var(--sx-bg)]">→</button>
            <span className="ml-3 tabular-nums text-[15px] text-[var(--sx-muted)]">
              {i + 1} / {n}
            </span>
          </div>
          <Btn kind="link">Rooms from ₹14,800 a night →</Btn>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────────── SP21 · Quote + 2×2 stat grid ───────────────────────────── */

const STATS = [
  { n: "92%", c: "felt steadier energy by week three" },
  { n: "48k", c: "monthly members across India" },
  { n: "6", c: "clean ingredients, nothing else" },
  { n: "4.8", c: "average from 9,600 reviews" },
];

/** SP21 · Left 5 cols: heading, paragraph and a quote with avatar. Right 6 cols: a 2×2 stat grid on thick rules; the numbers count up. */
function SP21() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M3");
  return (
    <Sec innerRef={r} theme="stone" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <style>{CSS}</style>
      <Glow className="right-[2%] top-[8%] h-[80%] w-[48%] opacity-80" />
      <div className="relative z-10 grid grid-cols-1 items-center gap-[clamp(40px,5vw,96px)] md:grid-cols-12">
        <div className="md:col-span-5">
          <H className="max-w-[12ch] text-[clamp(44px,4.8vw,80px)]">Proof in the daily scoop.</H>
          <P className="mt-6 max-w-[40ch]">Daybreak Greens is one spoon of spirulina, moringa and amla in your morning water. We asked members what changed.</P>
          <figure className="mt-[clamp(32px,4vw,56px)] border-l-[3px] border-[var(--sx-accent)] pl-6">
            <blockquote data-m-text className="text-[clamp(19px,1.6vw,24px)] font-[500] leading-[1.4] text-[var(--sx-text)]">
              &ldquo;I swapped my second coffee for it. My 4 pm slump simply stopped showing up.&rdquo;
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              <Avatar name="Mihir Batra" i={2} size={44} />
              <div>
                <p className="text-[15px] font-[650]">Mihir Batra</p>
                <p className="text-[13px] text-[var(--sx-muted)]">Member since 2024 · Delhi</p>
              </div>
            </figcaption>
          </figure>
          <div className="mt-9 flex flex-wrap items-center gap-5">
            <Btn>Start for ₹1,499 / month</Btn>
            <Btn kind="link">Read the study →</Btn>
          </div>
        </div>

        <div className="grid grid-cols-2 md:col-span-6 md:col-start-7">
          {STATS.map((s, k) => (
            <div key={s.c} data-m-card className={`px-[clamp(16px,2.2vw,36px)] py-[clamp(28px,3.4vw,56px)] ${k % 2 ? "border-l-[3px]" : ""} ${k > 1 ? "border-t-[3px]" : ""} border-[var(--sx-text)]`}>
              <p className="sx-display text-[clamp(52px,5.4vw,96px)] font-[800] leading-[0.9] tracking-[-0.04em]">
                <span data-m-num className="tabular-nums">{s.n}</span>
              </p>
              <p className="mt-4 max-w-[22ch] text-[clamp(14px,1.1vw,17px)] leading-snug text-[var(--sx-muted)]">{s.c}</p>
            </div>
          ))}
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "SP19", name: "Video testimonial cards", motion: "M34", C: SP19 },
  { code: "SP20", name: "Overlapping slider card on a colour column", motion: "M18", C: SP20 },
  { code: "SP21", name: "Quote + 2x2 stat grid", motion: "M3", C: SP21 },
];
