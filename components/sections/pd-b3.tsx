"use client";

// PD · Process / how-it's-made layouts, batch 3 (docs/SECTION-MENU.md).
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/* ───────────────────────── PD04 · Self-typing step log ───────────────────────── */

const PD04_LINES = [
  { c: "weigh 18 g", n: "Kodai Ridge, medium-light roast" },
  { c: "grind medium-fine", n: "22 clicks, like coarse sand" },
  { c: "rinse the filter", n: "water at 92 °C, discard" },
  { c: "bloom 30 s", n: "40 ml, swirl once" },
  { c: "pour 250 ml", n: "three slow circles, centre out" },
  { c: "drawdown 2:45", n: "flat bed, no channels" },
];
const PD04_RESULT = "1 cup ready · cocoa, plum, jaggery. Drink it at 65 °C.";

/** Types the log line by line while on screen, then holds and starts over. Returns [line, chars] of the cursor. */
function useTypeLog(ref: React.RefObject<HTMLElement | null>, lines: string[]) {
  const total = lines.length;
  const [pos, setPos] = useState<[number, number]>([total, 0]); // static / first paint: everything confirmed
  const [run, setRun] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    let line = 0;
    let ch = 0;
    const step = () => {
      if (line >= total) {
        t = setTimeout(() => {
          line = 0;
          ch = 0;
          setPos([0, 0]);
          t = setTimeout(step, 400);
        }, 2200);
        return;
      }
      ch += 1;
      if (ch > lines[line].length) {
        line += 1;
        ch = 0;
        setPos([line, 0]);
        t = setTimeout(step, 260);
        return;
      }
      setPos([line, ch]);
      t = setTimeout(step, 26 + Math.random() * 30);
    };
    const io = new IntersectionObserver(([e]) => {
      clearTimeout(t);
      if (e.isIntersecting) {
        line = 0;
        ch = 0;
        setRun(true);
        setPos([0, 0]);
        t = setTimeout(step, 500);
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(t);
    };
  }, [ref, lines, total]);
  return [pos[0], pos[1], run] as const;
}

const CARET_CSS = `
.pd04-caret{animation:pd04-blink 1s steps(1) infinite}
@keyframes pd04-blink{50%{opacity:0}}
.pd04-fill{transform-origin:left;animation:pd04-fill 2.2s linear both}
@keyframes pd04-fill{from{transform:scaleX(0)}to{transform:scaleX(1)}}
html.is-static .pd04-caret{animation:none}
html.is-static {.pd04-caret{animation:none}}
`;

const PD04_TEXT = [...PD04_LINES.map((l) => `${l.c}  ·  ${l.n}`), PD04_RESULT];

/** PD04 · One wide dark window (title bar with three dots) under a centred heading; inside, the brew steps type out
 *  line by line, each confirmed line turning accent-coloured with a tick, ending in a result line. Recipe facts and
 *  the kit's price sit under the window. */
function PD04() {
  const r = useRef<HTMLDivElement>(null);
  const win = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M6");
  const [line, ch, run] = useTypeLog(win, PD04_TEXT);
  const last = PD04_TEXT.length - 1;
  return (
    <Sec innerRef={r} theme="paper" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <style>{CARET_CSS}</style>
      <div className="mx-auto max-w-[900px] text-center">
        <H className="text-[clamp(44px,5.6vw,92px)]">Brew it like the bar does.</H>
        <P className="mx-auto mt-6 max-w-[46ch]">Our head brewer&apos;s pour-over, step by step. Six moves, three minutes, one very good cup.</P>
      </div>

      <div ref={win} data-m-card className="mx-auto mt-[clamp(40px,5vw,72px)] max-w-[1040px] overflow-hidden rounded-[var(--sx-radius)] bg-[var(--sx-text)] text-[var(--sx-bg)] shadow-[0_50px_100px_-50px_rgba(28,24,19,.7)]">
        <div className="flex items-center gap-2 border-b border-[color-mix(in_srgb,var(--sx-bg)_14%,transparent)] px-5 py-4">
          <span className="h-3 w-3 rounded-full bg-[color-mix(in_srgb,var(--sx-accent)_90%,var(--sx-bg))]" />
          <span className="h-3 w-3 rounded-full bg-[color-mix(in_srgb,var(--sx-bg)_40%,transparent)]" />
          <span className="h-3 w-3 rounded-full bg-[color-mix(in_srgb,var(--sx-bg)_22%,transparent)]" />
          <span className="ml-4 text-[13px] text-[color-mix(in_srgb,var(--sx-bg)_55%,transparent)]">v60-recipe.log</span>
          <span className="ml-auto text-[13px] tabular-nums text-[color-mix(in_srgb,var(--sx-bg)_55%,transparent)]">
            {Math.min(line, PD04_LINES.length)}/{PD04_LINES.length} steps
          </span>
        </div>
        <div className="min-h-[clamp(330px,40vh,400px)] px-[clamp(20px,3vw,44px)] py-[clamp(22px,2.6vw,36px)] font-mono text-[clamp(14px,1.25vw,18px)] leading-[2]">
          {PD04_TEXT.map((txt, k) => {
            if (k > line) return null;
            const done = k < line;
            const shown = done ? txt : txt.slice(0, ch);
            const isResult = k === last;
            return (
              <p key={k} className={`flex gap-4 whitespace-pre-wrap transition-colors duration-300 ${done ? (isResult ? "font-[700] text-[var(--sx-accent)]" : "text-[color-mix(in_srgb,var(--sx-accent)_85%,var(--sx-bg))]") : "text-[var(--sx-bg)]"}`}>
                <span className={`w-4 shrink-0 ${done ? "text-[var(--sx-accent)]" : "text-[color-mix(in_srgb,var(--sx-bg)_50%,transparent)]"}`}>{isResult ? "→" : done ? "✓" : ">"}</span>
                <span>
                  {shown}
                  {!done && <span className="pd04-caret ml-0.5 inline-block h-[1.1em] w-[0.55em] translate-y-[0.2em] bg-[var(--sx-accent)]" />}
                </span>
              </p>
            );
          })}
          {run && line > last && (
            <p className="flex gap-4 text-[color-mix(in_srgb,var(--sx-bg)_50%,transparent)]">
              <span className="w-4 shrink-0">&gt;</span>
              <span>
                brew again<span className="pd04-caret ml-0.5 inline-block h-[1.1em] w-[0.55em] translate-y-[0.2em] bg-[var(--sx-accent)]" />
              </span>
            </p>
          )}
        </div>
        {/* while the finished log holds, a brew-timer bar fills the window's foot, then the log starts over */}
        <div className="h-[6px] bg-[color-mix(in_srgb,var(--sx-bg)_10%,transparent)]">{run && line > last && <div className="pd04-fill h-full bg-[var(--sx-accent)]" />}</div>
      </div>

      <div className="mx-auto mt-[clamp(32px,4vw,56px)] grid max-w-[1040px] grid-cols-1 items-center gap-8 md:grid-cols-12">
        <div className="grid grid-cols-3 border-y border-[var(--sx-line)] md:col-span-8">
          {[
            ["18 g", "coffee"],
            ["250 ml", "water at 92 °C"],
            ["3:15", "total time"],
          ].map(([v, l], k) => (
            <div key={l} className={`py-5 ${k ? "border-l border-[var(--sx-line)] pl-[clamp(12px,2vw,28px)]" : ""}`}>
              <p className="sx-display text-[clamp(26px,2.4vw,38px)] font-[700] leading-none tabular-nums">{v}</p>
              <p className="mt-2 text-[14px] text-[var(--sx-muted)]">{l}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-start gap-3 md:col-span-4 md:items-end">
          <Btn>Get the pour-over kit · ₹2,450</Btn>
          <span className="text-[14px] text-[var(--sx-muted)]">Dripper, filters and 250 g of beans</span>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "PD04", name: "Self-typing step log", motion: "M6", C: PD04 }];
