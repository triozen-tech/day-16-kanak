"use client";

// PD · Process layouts, batch 5 (docs/SECTION-MENU.md).
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Hands-free cycling: steps an index every `ms` while the section is on screen (stops off screen and in ?static=1). */
function useAutoCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms = 2200) {
  const [i, setI] = useState(0);
  const [live, setLive] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let t: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      setLive(e.isIntersecting);
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

const PD_CSS = `
.pd5-fill{animation:pd5-fill var(--pd5-ms) linear both}
@keyframes pd5-fill{from{width:0%}to{width:100%}}
.pd5-in{animation:pd5-in .7s .15s cubic-bezier(.2,.8,.2,1) both}
@keyframes pd5-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
html.is-static .pd5-fill,html.is-static .pd5-in{animation:none}
html.is-static {.pd5-fill,.pd5-in{animation:none}}
`;

/* ───────────────────────── PD06 · Six-step numbered accordion ───────────────────────── */

const PD06_STEPS = [
  { t: "Consultation", d: "A long call with one of our polar guides: who is travelling, what you hope to see, how cold is too cold.", m: "Week 1 · 60 min call" },
  { t: "Confirmation", d: "We hold your cabin and send a written plan with dates, routes and the full price. A 20% deposit secures it.", m: "Week 2 · deposit" },
  { t: "Planning", d: "Flights, kit lists, medicals and insurance, all arranged by one planner who answers the phone.", m: "Weeks 3–12" },
  { t: "On-boarding", d: "Your parka, boots and gloves are fitted and shipped home. A fitness plan starts ten weeks out.", m: "Ten weeks out" },
  { t: "Briefing", d: "Two evenings in Cape Town with the expedition team: safety, wildlife rules and the first weather window.", m: "Two days before" },
  { t: "Departure", d: "A five-hour flight south to the ice runway. Your guide meets you on the blue ice, tea already poured.", m: "Day one" },
];
const PD06_MS = 2300;

/** PD06 · Heading left (4/12); six numbered rows right (8/12). One row opens at a time, by itself, with two lines of
 *  detail; a fill sweeps across the open row while it is read, then the next one opens. */
function PD06() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const [a, setA, live] = useAutoCycle(r, PD06_STEPS.length, PD06_MS);
  return (
    <Sec innerRef={r} theme="stone" font="editorial" className="py-[clamp(72px,9vw,140px)]" style={{ ["--pd5-ms" as string]: `${PD06_MS}ms` }}>
      {/* a large soft glow drifts linearly behind the steps so the section never sits still on camera */}
      <style>{`.pd06-glow{animation:pd06-glow 5s linear infinite alternate}@keyframes pd06-glow{from{transform:translate(-20%,-8%) scale(.9)}to{transform:translate(24%,12%) scale(1.15)}}html.is-static .pd06-glow{animation:none}html.is-static {.pd06-glow{animation:none}}`}</style>
      <div aria-hidden className="pd06-glow pointer-events-none absolute left-[30%] top-[15%] aspect-square w-[44vw] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_36%,transparent),transparent)]" />
      <style>{PD_CSS}</style>
      <div className="grid grid-cols-1 gap-[clamp(40px,5vw,96px)] md:grid-cols-12">
        <div className="md:col-span-4">
          <H className="text-[clamp(44px,4.8vw,80px)]">Six steps to the ice.</H>
          <P className="mt-6 max-w-[34ch]">From the first call to the blue-ice runway, one planner walks you through every stage of an Antarctic journey.</P>
          <div className="relative mt-10 overflow-hidden rounded-[var(--sx-radius)]">
            <div className="fx-pan">
              <div className="fx-drift">
                <Pic i={0} ratio="4/3" label="UNION GLACIER" />
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Btn>Start with a call</Btn>
            <span className="text-[14px] text-[var(--sx-muted)]">Journeys from ₹6,80,000</span>
          </div>
        </div>

        <ol className="border-t border-[var(--sx-line)] md:col-span-8">
          {PD06_STEPS.map((s, k) => {
            const on = k === a;
            return (
              <li key={s.t} data-m-card className="relative overflow-hidden border-b border-[var(--sx-line)]">
                {/* reading fill on the open row */}
                {on && live && <span key={`f${a}`} className="pd5-fill absolute inset-y-0 left-0 bg-[color-mix(in_srgb,var(--sx-accent)_16%,transparent)]" />}
                <button type="button" onClick={() => setA(k)} className="relative flex w-full items-center gap-[clamp(16px,2.4vw,40px)] py-[clamp(18px,1.8vw,28px)] text-left">
                  <span className={`sx-display w-[2.6ch] shrink-0 text-[clamp(22px,1.8vw,30px)] tabular-nums transition-colors duration-500 ${on ? "text-[var(--sx-accent)]" : "text-[var(--sx-muted)]"}`}>{String(k + 1).padStart(2, "0")}</span>
                  <span className={`sx-display flex-1 text-[clamp(28px,2.8vw,46px)] leading-[1.05] transition-[opacity] duration-500 ${on ? "" : "opacity-55"}`}>{s.t}</span>
                  <span className={`hidden text-[14px] text-[var(--sx-muted)] transition-opacity duration-500 md:block ${on ? "opacity-100" : "opacity-0"}`}>{s.m}</span>
                  <span className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-full border transition-colors duration-500 ${on ? "border-[var(--sx-accent)] bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "border-[var(--sx-line)]"}`}>
                    <span className="absolute h-[1.5px] w-3.5 bg-current" />
                    <span className={`absolute h-3.5 w-[1.5px] bg-current transition-transform duration-500 ${on ? "scale-y-0" : ""}`} />
                  </span>
                </button>
                <div className="relative grid transition-[grid-template-rows] duration-600 ease-[cubic-bezier(.7,0,.2,1)]" style={{ gridTemplateRows: on ? "1fr" : "0fr" }}>
                  <div className="min-h-0 overflow-hidden">
                    <p key={`d${a}`} className={`max-w-[56ch] pb-[clamp(20px,2vw,32px)] pl-[calc(2.6ch*1.4+clamp(16px,2.4vw,40px))] text-[clamp(16px,1.2vw,19px)] leading-relaxed text-[var(--sx-muted)] max-md:pl-0 ${on ? "pd5-in" : ""}`}>
                      {s.d}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "PD06", name: "Six-step numbered accordion", motion: "M23", C: PD06 }];
