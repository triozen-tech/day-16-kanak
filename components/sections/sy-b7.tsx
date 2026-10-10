"use client";

// SY · Story layouts, batch 7 (docs/SECTION-MENU.md): SY17 a full-width 16:9 image leads; underneath, a magazine
// caption split: headline left (max-w-md), paragraphs + button right. The image opens out of a frame as it scrolls in
// and keeps a slow two-loop drift afterwards.
import { useRef } from "react";
import { Btn, H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const CSS = `.sy7kb img{animation:sy7kbs 5.4s linear infinite alternate,sy7kbt 3.2s ease-in-out infinite alternate}
@keyframes sy7kbs{from{scale:1.06}to{scale:1.18}}@keyframes sy7kbt{from{translate:-2.5% 1%}to{translate:2.5% -1%}}
.sy7glow{animation:sy7gx 6.8s linear infinite alternate,sy7gs 4.1s ease-in-out infinite alternate}
@keyframes sy7gx{from{translate:-24% 0}to{translate:30% -10%}}@keyframes sy7gs{from{scale:.8}to{scale:1.25}}
html.is-static .sy7kb img,html.is-static .sy7glow{animation:none}
html.is-static {.sy7kb img,.sy7glow{animation:none}}`;

/** SY17 · Full-width 16:9 image first; under it headline left (max-w-md), two paragraphs + button right. */
function SY17() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M13");
  return (
    <Sec innerRef={r} theme="stone" font="wide" className="py-[clamp(72px,9vw,140px)]">
      <style>{CSS}</style>
      <span aria-hidden className="sy7glow pointer-events-none absolute bottom-[-6%] left-[10%] h-[46%] w-[50%] rounded-full blur-[90px]" style={{ background: "radial-gradient(closest-side, color-mix(in srgb, var(--sx-accent) 42%, transparent), transparent)" }} />
      <div className="relative z-10">
        <div className="relative">
          <Pic i={1} ratio="16/9" className="sy7kb w-full" label="" />
          <div className="pointer-events-none absolute bottom-[clamp(16px,2vw,28px)] left-[clamp(16px,2vw,28px)] flex flex-wrap gap-2">
            {["Kumarakom", "9 rooms", "On the lake"].map((t) => (
              <span key={t} className="rounded-full bg-[rgba(10,12,14,.5)] px-4 py-2 text-[13px] font-[600] uppercase tracking-[0.12em] text-white backdrop-blur-md">
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-[clamp(40px,5vw,80px)] grid grid-cols-1 gap-[clamp(28px,5vw,96px)] md:grid-cols-2">
          <H className="max-w-md text-[clamp(32px,3vw,46px)] leading-[1.02]">A house that floats on the backwaters.</H>
          <div className="md:pt-2">
            <P>Vellam House is nine rooms in a restored 1920s tharavad, built of laterite and jackwood on the edge of Vembanad Lake. Mornings start on the jetty with filter coffee and a kettukettu drifting past.</P>
            <P className="mt-5">We kept the carved ceilings and the courtyard well, then added deep baths, linen beds and a kitchen that cooks only what the boats bring in that day.</P>
            <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Btn>Check dates</Btn>
              <p className="text-[15px] text-[var(--sx-muted)]">
                Rooms from <b className="text-[18px] font-[650] text-[var(--sx-text)]">₹18,500</b> a night, breakfast included
              </p>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "SY17", name: "Wide image then two-column caption", motion: "M13", C: SY17 }];
