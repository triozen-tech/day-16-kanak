"use client";

// ST · Stats layouts, batch 5 (docs/SECTION-MENU.md): ST13 stats written as sentences in a ruled list, beside a tall
// photo washed in the accent colour (the photo opens out of a frame with the scroll and keeps a slow drift).
import { useRef } from "react";
import { scene } from "../fx/shared";
import { Btn, H, P, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const CSS = `.st5kb img{animation:st5kbs 4.8s linear infinite alternate,st5kbt 3.4s ease-in-out infinite alternate}
@keyframes st5kbs{from{scale:1.04}to{scale:1.18}}@keyframes st5kbt{from{translate:-3% 2%}to{translate:3% -2.5%}}
.st5tint{animation:st5tint 2.6s ease-in-out infinite alternate}@keyframes st5tint{from{opacity:.45}to{opacity:.8}}
html.is-static .st5kb img,html.is-static .st5tint{animation:none}
html.is-static {.st5kb img,.st5tint{animation:none}}`;

const ROWS = [
  { n: "92%", s: "of the cotton in our linen blends is grown rain-fed in Vidarbha, with no canal water at all." },
  { n: "41 t", s: "of offcuts went back into yarn last year instead of landfill, spun again at a mill in Panipat." },
  { n: "1,860", s: "weavers are paid a fixed monthly wage, not by the metre, across eleven cooperative looms." },
];

/** ST13 · Left: heading, text and three hairline rows, each a sentence led by a bold number. Right: a tall accent-tinted image. */
function ST13() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M13");
  return (
    <Sec innerRef={r} theme="stone" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <style>{CSS}</style>
      <div className="grid grid-cols-1 gap-[clamp(36px,5vw,88px)] md:grid-cols-12">
        <div className="md:col-span-7">
          <H className="max-w-[15ch] text-[clamp(44px,5.2vw,88px)]">What a linen shirt costs the earth.</H>
          <P className="mt-6 max-w-[48ch]">We count it every season and print the numbers on the swing tag. Here is the summer ledger, checked by an outside auditor in March.</P>
          <ul className="mt-[clamp(36px,4.4vw,64px)] border-t border-[var(--sx-line)]">
            {ROWS.map((row) => (
              <li key={row.n} className="border-b border-[var(--sx-line)] py-[clamp(20px,2.4vw,34px)]">
                <p data-m-text className="text-[clamp(19px,1.7vw,26px)] leading-[1.4] text-[var(--sx-muted)]">
                  <b className="sx-display mr-2 align-baseline text-[clamp(30px,2.8vw,44px)] font-[700] tracking-[-0.02em] text-[var(--sx-text)]">{row.n}</b>
                  {row.s}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-9 flex flex-wrap items-center gap-6">
            <Btn>Read the impact report</Btn>
            <Btn kind="link">How we audit →</Btn>
          </div>
        </div>
        <div className="relative min-h-[520px] md:col-span-5">
          {/* the frame itself is the [data-m-img] so the accent wash opens out together with the photo (M13) */}
          <div data-m-img className="st5kb relative h-full min-h-[520px] overflow-hidden rounded-[var(--sx-radius,18px)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={scene(1, 1000, 1400, "")} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
            <div className="st5tint pointer-events-none absolute inset-0 bg-[var(--sx-accent)] mix-blend-multiply" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(10,14,12,.6))]" />
            <div className="absolute inset-x-0 bottom-0 p-[clamp(20px,2.4vw,32px)] text-white">
              <p className="text-[13px] uppercase tracking-[0.16em] text-white/70">Field notes</p>
              <p className="mt-2 max-w-[26ch] text-[clamp(17px,1.4vw,21px)] leading-snug">Flax and cotton drying in the sun outside Wardha, June.</p>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "ST13", name: "Stat sentences beside a tinted image", motion: "M13", C: ST13 }];
