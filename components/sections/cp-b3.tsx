"use client";

// CP · Compare layouts, batch 3 (docs/SECTION-MENU.md).
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Price, Product, Sec } from "./kit";
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

const CP03_CSS = `
.cp03-in{animation:cp03-in .8s cubic-bezier(.2,.8,.2,1) both}
@keyframes cp03-in{from{opacity:0;transform:translateY(28px) rotate(-4deg)}to{opacity:1;transform:none}}
html.is-static .cp03-in{animation:none}
html.is-static {.cp03-in{animation:none}}
`;

/* ───────────────────────── CP03 · Colour pairing suggestions ───────────────────────── */

const CP03_WAYS = [
  { n: "Clay", c: "#c46a3c", note: "Warm terracotta knit, gum sole", fit: "Pairs with olive, cream and denim" },
  { n: "Moss", c: "#5f7a4a", note: "Deep green knit, off-white sole", fit: "Pairs with khaki, rust and black" },
  { n: "Ink", c: "#2b3a55", note: "Midnight knit, tonal sole", fit: "Pairs with grey, white and tan" },
  { n: "Chalk", c: "#d8d0bf", note: "Undyed knit, natural sole", fit: "Pairs with everything linen" },
];

/** CP03 · One product in the chosen colourway on the left; on the right "Pairs well with" lists the other three as
 *  swatch + mini product rows, each one click to swap the main shoe. The main colourway swaps by itself. */
function CP03() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  const [a, setA] = useAutoCycle(r, CP03_WAYS.length, 2400);
  const w = CP03_WAYS[a];
  const others = [1, 2, 3].map((d) => (a + d) % CP03_WAYS.length);
  return (
    <Sec innerRef={r} theme="stone" font="wide" className="py-[clamp(72px,9vw,140px)]">
      <style>{CP03_CSS}</style>
      <div className="grid grid-cols-1 items-end gap-[clamp(24px,4vw,64px)] md:grid-cols-12">
        <H className="text-[clamp(40px,5vw,84px)] md:col-span-7">One runner, four moods.</H>
        <P className="max-w-[40ch] md:col-span-5 md:pb-2">Pick a colour and we show the three that sit best beside it, on the shelf or on the same feet across a week.</P>
      </div>

      <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 gap-[clamp(16px,2vw,28px)] md:grid-cols-12">
        {/* the main shoe */}
        <div className="sx-card relative flex flex-col overflow-hidden p-[clamp(20px,2.4vw,36px)] md:col-span-7">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="sx-display text-[clamp(24px,2.2vw,36px)] font-[700] tracking-[-0.02em]">
              Lattice Runner <span className="text-[var(--sx-muted)]">· {w.n}</span>
            </p>
            <Price now="₹8,490" className="text-[20px]" />
          </div>
          <div className="relative mt-4 grid min-h-[clamp(320px,42vh,460px)] flex-1 place-items-center">
            <div className="fx-pan absolute inset-[6%] rounded-full transition-[background] duration-700" style={{ background: `radial-gradient(closest-side, color-mix(in srgb, ${w.c} 50%, transparent), transparent)` }} />
            <div className="fx-drift relative">
              <Product key={a} angle={a % 4} accent={w.c} className="cp03-in h-[clamp(280px,38vh,420px)] w-auto" />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--sx-line)] pt-5">
            <div className="flex items-center gap-3">
              {CP03_WAYS.map((x, k) => (
                <button key={x.n} aria-label={x.n} onClick={() => setA(k)} className={`h-7 w-7 rounded-full border-2 transition-all duration-500 ${k === a ? "scale-110 border-[var(--sx-text)]" : "border-transparent"}`} style={{ background: x.c }} />
              ))}
              <span className="ml-2 text-[14px] text-[var(--sx-muted)]">{w.note}</span>
            </div>
            <Btn>Add to bag</Btn>
          </div>
        </div>

        {/* pairs well with */}
        <div className="flex flex-col md:col-span-5">
          <div className="flex items-baseline justify-between border-b border-[var(--sx-line)] pb-4">
            <p className="text-[15px] font-[650]">Pairs well with</p>
            <p className="text-[14px] text-[var(--sx-muted)]">{w.fit}</p>
          </div>
          <div className="mt-[clamp(12px,1.4vw,18px)] flex flex-1 flex-col gap-[clamp(10px,1.2vw,16px)]">
            {others.map((k) => {
              const x = CP03_WAYS[k];
              return (
                <button key={x.n} data-m-card onClick={() => setA(k)} className="sx-card group flex flex-1 items-center gap-[clamp(14px,1.6vw,24px)] p-[clamp(12px,1.2vw,18px)] text-left transition-colors hover:border-[var(--sx-text)]">
                  <span className="relative grid aspect-square w-[clamp(84px,8vw,120px)] shrink-0 place-items-center overflow-hidden rounded-[12px]" style={{ background: `radial-gradient(closest-side, color-mix(in srgb, ${x.c} 45%, transparent), var(--sx-bg))` }}>
                    <Product key={`${a}-${k}`} angle={(k + 1) % 4} accent={x.c} className="cp03-in absolute inset-0 m-auto h-[82%] w-[82%]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 rounded-full" style={{ background: x.c }} />
                      <span className="text-[17px] font-[650]">{x.n}</span>
                    </span>
                    <span className="mt-1 block text-[14px] text-[var(--sx-muted)]">{x.note}</span>
                  </span>
                  <span className="shrink-0 rounded-full border border-[var(--sx-line)] px-4 py-2 text-[13px] font-[650] transition-colors group-hover:bg-[var(--sx-text)] group-hover:text-[var(--sx-bg)]">Swap</span>
                </button>
              );
            })}
          </div>
          <p className="mt-5 text-[14px] text-[var(--sx-muted)]">Buy any two colourways and save ₹1,500. Free returns for 30 days.</p>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "CP03", name: "Colour pairing suggestions", motion: "M34", C: CP03 }];
