"use client";

// PS · Product / shop layouts, batch 7 (docs/SECTION-MENU.md): PS23 an intro (heading, paragraph, link) beside a
// wrapping cloud of category links laid out like chips. A highlight walks the chips by itself and the "latest in"
// line under the cloud follows it. ?static=1 holds the first chip.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Steps an index every `ms` while `ref` is on screen (stops off screen and in ?static=1). */
function useCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms: number) {
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

const CSS = `.ps7glow{animation:ps7gx 6.5s linear infinite alternate,ps7gs 3.9s ease-in-out infinite alternate}
@keyframes ps7gx{from{translate:-22% 10%}to{translate:20% -12%}}@keyframes ps7gs{from{scale:.8}to{scale:1.22}}
.ps7in{animation:ps7in .6s cubic-bezier(.2,.7,.2,1) both}@keyframes ps7in{from{opacity:0;translate:0 14px}to{opacity:1;translate:0 0}}
html.is-static .ps7glow,html.is-static .ps7in{animation:none}
html.is-static {.ps7glow,.ps7in{animation:none}}`;

const CATS = [
  { t: "First flush", n: 18, read: "The week Darjeeling wakes up", min: 6 },
  { t: "Oolong", n: 24, read: "Rolling leaves by hand in Nuxalbari", min: 8 },
  { t: "Brewing guides", n: 31, read: "Water at 85°, and why it matters", min: 4 },
  { t: "Estate visits", n: 12, read: "Three days on a Nilgiri slope", min: 11 },
  { t: "Tisanes", n: 16, read: "Tulsi, lemongrass and a long night", min: 5 },
  { t: "Ceramics", n: 9, read: "The potter behind our tasting cups", min: 7 },
  { t: "Recipes", n: 27, read: "Masala chai, the slow way", min: 5 },
  { t: "Tasting notes", n: 40, read: "Muscatel, explained without jargon", min: 6 },
];

/** PS23 · Two halves: heading, paragraph and link left; a "Categories" label over a wrapping cloud of eight chip-like links right. */
function PS23() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M6");
  const [i, setI] = useCycle(r, CATS.length, 1500);
  const c = CATS[i];
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <style>{CSS}</style>
      <span aria-hidden className="ps7glow pointer-events-none absolute right-[4%] top-[8%] h-[80%] w-[52%] rounded-full blur-[80px]" style={{ background: "radial-gradient(closest-side, color-mix(in srgb, var(--sx-accent) 40%, transparent), transparent)" }} />
      <div className="relative z-10 grid grid-cols-1 items-center gap-[clamp(40px,6vw,110px)] md:grid-cols-2">
        <div>
          <H className="max-w-[12ch] text-[clamp(48px,5.8vw,96px)] font-[500]">Notes from the tea garden.</H>
          <P className="mt-7 max-w-[40ch]">The Steep Journal: estate visits, brewing guides and quiet essays from the people who pick, roll and pour our teas. A new issue every second Sunday.</P>
          <div className="mt-9 flex flex-wrap items-center gap-6">
            <Btn>Read the latest issue</Btn>
            <Btn kind="link">Subscribe, it&apos;s free →</Btn>
          </div>
        </div>

        <div>
          <p className="text-[13px] font-[600] uppercase tracking-[0.16em] text-[var(--sx-muted)]">Categories</p>
          <div className="mt-6 flex flex-wrap gap-[clamp(10px,1vw,14px)]">
            {CATS.map((x, k) => {
              const on = k === i;
              return (
                <a
                  key={x.t}
                  href="#"
                  data-m-card
                  onClick={(e) => {
                    e.preventDefault();
                    setI(k);
                  }}
                  className={`group inline-flex items-baseline gap-2 rounded-full border px-[clamp(18px,1.6vw,26px)] py-[clamp(10px,1vw,14px)] transition-[background-color,color,border-color] duration-500 ${on ? "border-[var(--sx-accent)] bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "border-[var(--sx-line)] bg-[color-mix(in_srgb,var(--sx-surface)_70%,transparent)] hover:border-[var(--sx-text)]"}`}
                >
                  <span className="sx-display text-[clamp(20px,1.8vw,28px)] leading-none">{x.t}</span>
                  <sup className={`text-[12px] font-[600] tabular-nums ${on ? "opacity-80" : "text-[var(--sx-muted)]"}`}>{x.n}</sup>
                </a>
              );
            })}
          </div>
          <div className="mt-[clamp(28px,3vw,44px)] border-t border-[var(--sx-line)] pt-6">
            <div key={c.t} className="ps7in flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <p className="text-[15px] text-[var(--sx-muted)]">
                Latest in <span className="font-[650] text-[var(--sx-accent)]">{c.t}</span>
              </p>
              <p className="text-[14px] text-[var(--sx-muted)]">{c.min} min read</p>
              <p className="sx-display w-full text-[clamp(22px,2vw,32px)] leading-[1.2]">&ldquo;{c.read}&rdquo;</p>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "PS23", name: "Intro + category chip cloud", motion: "M6", C: PS23 }];
