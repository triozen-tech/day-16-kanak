"use client";

// PL · Poll layouts, batch 1 (PL01). A live vote with result bars; plays by itself while on screen.
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const PL01_CSS = `
.pl01-fill{transition:width .9s cubic-bezier(.22,1,.36,1)}
.pl01-fill::after{content:"";position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,color-mix(in srgb,var(--sx-surface) 55%,transparent) 50%,transparent 70%) 0 0/250% 100% no-repeat;animation:pl01-sheen 2.4s linear infinite}
@keyframes pl01-sheen{from{background-position:130% 0}to{background-position:-130% 0}}
html.is-static .pl01-fill::after{animation:none;opacity:0}
html.is-static {.pl01-fill::after{animation:none;opacity:0}}
`;

const OPTIONS = [
  { name: "Cardamom & rose", note: "Milk chocolate, crushed green cardamom, dried rose" },
  { name: "Kokum chilli", note: "70% dark, tart kokum, a slow bird's-eye finish" },
  { name: "Filter-coffee crunch", note: "Dark milk, chicory-roasted nibs, jaggery brittle" },
];

/** PL01 · Vote poll with live result bars: heading + line, three full-width option rows (radio, label, a fill bar with
 *  the % at the right), closing date under it. Rows snap in, bars grow while the numbers count up; then the poll
 *  auto-votes every ~2 s and the bars re-balance. */
function PL01() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M3");
  const [votes, setVotes] = useState([1412, 1187, 968]);
  const [pick, setPick] = useState<number | null>(null);
  const [grow, setGrow] = useState(1); // 0 → 1 while the bars fill (1 = final state, static)
  const step = useRef(0);
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    const o = { v: 0 };
    setGrow(0);
    let t: ReturnType<typeof setInterval> | undefined;
    let on = false;
    let ready = false;
    const vote = () => {
      const k = [1, 2, 0, 1, 2][step.current % 5];
      step.current += 1;
      setPick(k);
      setVotes((v) => v.map((n, j) => (j === k ? n + 140 + ((step.current * 37) % 60) : n)));
    };
    const run = () => {
      clearInterval(t);
      if (on && ready) t = setInterval(vote, 2000);
    };
    const tw = gsap.to(o, { v: 1, duration: 1.6, ease: "power3.out", delay: 0.45, paused: true, onUpdate: () => setGrow(o.v), onComplete: () => ((ready = true), run()) });
    const st = ScrollTrigger.create({ trigger: el, start: "top 75%", once: true, onEnter: () => tw.play() });
    const io = new IntersectionObserver(([e]) => ((on = e.isIntersecting), run()));
    io.observe(el);
    return () => {
      clearInterval(t);
      io.disconnect();
      st.kill();
      tw.kill();
    };
  }, []);
  const total = votes.reduce((a, b) => a + b, 0);
  const pct = votes.map((v) => (v / total) * 100);
  const lead = pct.indexOf(Math.max(...pct));
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <style>{PL01_CSS}</style>
      <div className="grid grid-cols-1 items-start gap-[clamp(36px,5vw,88px)] md:grid-cols-12">
        <div className="md:col-span-7">
          <H className="max-w-[14ch] text-[clamp(44px,5.6vw,96px)]">You pick the next bar.</H>
          <P className="mt-5 max-w-[46ch]">Three recipes from our test kitchen in Kochi. The winner goes into the January batch, and every voter gets the first bar free.</P>
          <form className="mt-[clamp(32px,4vw,56px)] flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
            {OPTIONS.map((o, k) => {
              const w = pct[k] * grow;
              const on = pick === k;
              return (
                <label key={o.name} data-m-card className={`relative flex cursor-pointer items-center gap-5 overflow-hidden rounded-[14px] border px-[clamp(16px,2vw,28px)] py-[clamp(16px,1.8vw,24px)] transition-colors duration-500 ${on ? "border-[var(--sx-accent)]" : "border-[var(--sx-line)]"}`}>
                  <span className="pl01-fill absolute inset-y-0 left-0 overflow-hidden bg-[color-mix(in_srgb,var(--sx-accent)_18%,transparent)]" style={{ width: `${w}%` }} />
                  <input
                    type="radio"
                    name="pl01"
                    checked={on}
                    onChange={() => {
                      setPick(k);
                      setVotes((v) => v.map((n, j) => (j === k ? n + 1 : n)));
                    }}
                    className="relative h-5 w-5 shrink-0 accent-[var(--sx-accent)]"
                  />
                  <span className="relative min-w-0 flex-1">
                    <span className="flex items-center gap-3 text-[clamp(17px,1.4vw,22px)] font-[650]">
                      {o.name}
                      {k === lead && grow === 1 && <span className="rounded-full bg-[var(--sx-accent)] px-2.5 py-1 text-[12px] font-[650] text-[var(--sx-accent-text)]">Leading</span>}
                    </span>
                    <span className="mt-1 block text-[14px] text-[var(--sx-muted)]">{o.note}</span>
                  </span>
                  <span className="sx-display relative shrink-0 text-[clamp(26px,2.4vw,40px)] font-[600] tabular-nums">{Math.round(w)}%</span>
                </label>
              );
            })}
          </form>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-[14px] text-[var(--sx-muted)]">
            <span>
              <b className="font-[650] tabular-nums text-[var(--sx-text)]">{Math.round(total * grow).toLocaleString("en-IN")}</b> votes so far
            </span>
            <span>Voting closes 30 November · winner in stores from ₹220</span>
          </div>
        </div>
        <div className="md:col-span-5 md:pt-[clamp(8px,2vw,32px)]">
          <div className="overflow-hidden rounded-[var(--sx-radius)]">
            <div className="fx-pan overflow-hidden rounded-[var(--sx-radius,18px)]"><Pic i={1} ratio="4/5" label="TEST KITCHEN" className="fx-drift" /></div>
          </div>
          <p className="mt-4 text-[14px] text-[var(--sx-muted)]">Tasting notes from the 42 people who tried all three in September.</p>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "PL01", name: "Vote poll with live result bars", motion: "M3", C: PL01 }];
