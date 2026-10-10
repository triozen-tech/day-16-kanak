"use client";

// TM · Team layouts, batch 7 (docs/SECTION-MENU.md). Fake people only (placeholder portraits + invented names).
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Pic, Sec } from "./kit";
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

const TM_CSS = `
.tmb7-glow{animation:tmb7-glow 5s linear infinite alternate}
@keyframes tmb7-glow{from{transform:translate(-22%,-6%) scale(.9)}to{transform:translate(24%,10%) scale(1.2)}}
.tmb7-glow2{animation:tmb7-glow2 3.6s linear infinite alternate}
@keyframes tmb7-glow2{from{transform:translate(18%,8%) scale(1.1)}to{transform:translate(-16%,-10%) scale(.85)}}
html.is-static .tmb7-glow,html.is-static .tmb7-glow2{animation:none}
html.is-static {.tmb7-glow,.tmb7-glow2{animation:none}}
`;

const GROWERS = [
  { n: "Ira Menon", r: "Cardamom, Idukki" },
  { n: "Kabir Shah", r: "Turmeric, Erode" },
  { n: "Lata Gowda", r: "Pepper, Coorg" },
  { n: "Rohan Dutta", r: "Ginger, Meghalaya" },
  { n: "Meera Pillai", r: "Cloves, Kanyakumari" },
  { n: "Arjun Rao", r: "Chilli, Guntur" },
  { n: "Tara Joseph", r: "Cinnamon, Wayanad" },
  { n: "Dev Kulkarni", r: "Saffron, Pampore" },
  { n: "Nila Bose", r: "Mustard, Bardhaman" },
  { n: "Sami Qureshi", r: "Fennel, Unjha" },
  { n: "Anya Varma", r: "Nutmeg, Kottayam" },
  { n: "Yash Patil", r: "Coriander, Kota" },
];

/** TM13 · Compact circular roster: a 6-column grid of small round portraits (~80px) with name and role centred under
 *  each, built for a big collective. A spotlight ring walks the roster by itself. */
function TM13() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  const [act] = useAutoCycle(r, GROWERS.length, 900);
  return (
    <Sec innerRef={r} theme="stone" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <style>{TM_CSS}</style>
      <div aria-hidden className="tmb7-glow pointer-events-none absolute left-[20%] top-[25%] aspect-square w-[55vw] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_38%,transparent),transparent)]" />
      <div aria-hidden className="tmb7-glow2 pointer-events-none absolute bottom-[-20%] right-[0%] aspect-square w-[38vw] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_30%,transparent),transparent)]" />
      <div className="relative z-10">
        <div className="mx-auto max-w-[760px] text-center">
          <H className="text-[clamp(44px,5.2vw,88px)]">Twelve farms, one tin.</H>
          <P className="mx-auto mt-6 max-w-[48ch]">Every spice in our masala box comes from a grower we know by name. They own a share of the co-op and set the price with us each harvest.</P>
        </div>
        <ul className="mx-auto mt-[clamp(48px,6vw,88px)] grid max-w-[1180px] grid-cols-2 gap-x-[clamp(16px,2vw,32px)] gap-y-[clamp(36px,4vw,56px)] sm:grid-cols-3 md:grid-cols-6">
          {GROWERS.map((g, k) => (
            <li key={g.n} data-m-card className="flex min-w-0 flex-col items-center text-center">
              <span className={`relative grid h-[88px] w-[88px] place-items-center rounded-full transition-[box-shadow,scale] duration-500 ${k === act ? "scale-110 shadow-[0_0_0_3px_var(--sx-accent)]" : "shadow-[0_0_0_1px_var(--sx-line)]"}`}>
                <span className="block h-[80px] w-[80px] overflow-hidden rounded-full">
                  <Pic i={k % 4} ratio="1/1" round={false} className="h-full w-full" />
                </span>
              </span>
              <span className="mt-4 text-[16px] font-[650] leading-tight">{g.n}</span>
              <span className={`mt-1 text-[13px] transition-colors duration-500 ${k === act ? "text-[var(--sx-accent)]" : "text-[var(--sx-muted)]"}`}>{g.r}</span>
            </li>
          ))}
        </ul>
        <div className="mt-[clamp(48px,6vw,80px)] flex flex-wrap items-center justify-center gap-4 border-t border-[var(--sx-line)] pt-8">
          <P className="text-[15px]">Spice co-op since 2014 · 340 member families</P>
          <Btn kind="link">Meet every grower →</Btn>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "TM13", name: "Compact circular roster", motion: "M34", C: TM13 }];
