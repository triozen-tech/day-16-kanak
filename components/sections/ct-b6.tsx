"use client";

// CT · Call-to-action layouts, batch 6 (docs/SECTION-MENU.md): CT12 two halves, a light CTA block (centred heading,
// text, outline button) beside a 2×2 photo quad that opens with curtain wipes in sequence.
import { useRef } from "react";
import { Btn, H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const CSS = `.ct6glow{animation:ct6gx 5.8s linear infinite alternate,ct6gs 3.6s ease-in-out infinite alternate}
@keyframes ct6gx{from{translate:-22% -12%}to{translate:22% 14%}}@keyframes ct6gs{from{scale:.8}to{scale:1.25}}
.ct6quad [data-m-img] img{animation:ct6kb 4.8s ease-in-out infinite alternate}
.ct6quad > :nth-child(2n) [data-m-img] img,.ct6quad > [data-m-img]:nth-child(2n) img{animation-duration:3.4s;animation-direction:alternate-reverse}
@keyframes ct6kb{from{translate:-4% 2%}to{translate:4% -2%}}
html.is-static .ct6glow,html.is-static .ct6quad [data-m-img] img{animation:none}
html.is-static {.ct6glow,.ct6quad [data-m-img] img{animation:none}}`;

const SHOTS = [
  { i: 1, label: "Sourdough" },
  { i: 3, label: "Croissant" },
  { i: 0, label: "Counter" },
  { i: 2, label: "Morning bake" },
];

/** CT12 · Left half: a light block with a centred heading, short copy and an outline button. Right half: four photos in a 2×2 grid. */
function CT12() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M1");
  return (
    <Sec innerRef={r} theme="stone" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <style>{CSS}</style>
      <div className="grid grid-cols-1 gap-[clamp(12px,1.2vw,18px)] md:grid-cols-2">
        <div className="relative flex min-h-[520px] flex-col items-center justify-center overflow-hidden rounded-[var(--sx-radius,18px)] bg-[var(--sx-surface)] px-[clamp(24px,4vw,72px)] py-[clamp(48px,6vw,96px)] text-center">
          <span aria-hidden className="ct6glow pointer-events-none absolute left-[10%] top-[10%] h-[80%] w-[80%] rounded-full blur-[70px]" style={{ background: "radial-gradient(closest-side, color-mix(in srgb, var(--sx-accent) 42%, transparent), transparent)" }} />
          <div className="relative z-10 flex flex-col items-center">
            <p className="text-[14px] font-[600] uppercase tracking-[0.18em] text-[var(--sx-accent)]">Ovenhouse Bakery · since 6 am</p>
            <H className="mt-6 max-w-[12ch] text-[clamp(44px,4.6vw,80px)] font-[600]">Still warm when you get here.</H>
            <P className="mt-6 max-w-[36ch]">Order before 10 pm and collect a box of tomorrow&apos;s first bake, still steaming, from any of our four counters.</P>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-5">
              <Btn kind="ghost">Reserve a morning box · ₹680</Btn>
            </div>
            <p className="mt-5 text-[14px] text-[var(--sx-muted)]">Six pastries, one loaf, butter from the hills</p>
          </div>
        </div>
        <div className="ct6quad grid grid-cols-2 gap-[clamp(12px,1.2vw,18px)]">
          {SHOTS.map((s) => (
            <Pic key={s.label} i={s.i} ratio="1/1" label="" className="w-full" />
          ))}
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "CT12", name: "CTA block + 2x2 image quad", motion: "M1", C: CT12 }];
