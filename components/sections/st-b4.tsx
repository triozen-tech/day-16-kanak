"use client";

// ST · Stats layouts, batch 4 (docs/SECTION-MENU.md): ST11 a big statement left with ruled stats sunk to the bottom of
// the right column, ST12 one hero metric beside a supporting photo with a row of smaller figures below.
import { useRef } from "react";
import { Btn, H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const CSS = `.st4orb{animation:st4orbm 7.5s ease-in-out infinite alternate,st4orbo 4.2s ease-in-out infinite alternate}
@keyframes st4orbm{from{translate:-14% -8%}to{translate:16% 10%}}@keyframes st4orbo{from{opacity:.45;scale:.9}to{opacity:1;scale:1.12}}
.st4kb img{animation:st4kbs 4.6s ease-in-out infinite alternate,st4kbt 3.3s ease-in-out infinite alternate}
@keyframes st4kbs{from{scale:1.06}to{scale:1.18}}@keyframes st4kbt{from{translate:-2.5% 1.5%}to{translate:2.5% -1.5%}}
.st4sheen{animation:st4sheen 3.6s ease-in-out infinite}@keyframes st4sheen{from{translate:-120% 0}to{translate:120% 0}}
html.is-static .st4orb,html.is-static .st4kb img,html.is-static .st4sheen{animation:none}
html.is-static {.st4orb,.st4kb img,.st4sheen{animation:none}}`;

/** ST11 · 2 columns: a big 2-line statement left; right a paragraph, a very large gap, then 3 ruled stats at the bottom. */
function ST11() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M3");
  return (
    <Sec innerRef={r} theme="stone" font="editorial" className="py-[clamp(80px,10vw,150px)]">
      <style>{CSS}</style>
      {/* slow light drifting across the room */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="st4orb absolute left-[38%] top-[8%] aspect-square w-[62vw] max-w-[980px] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_22%,transparent),transparent)]" />
      </div>
      <div className="relative grid grid-cols-1 gap-[clamp(40px,6vw,120px)] md:grid-cols-12">
        <div className="md:col-span-7">
          <H className="text-[clamp(52px,6.4vw,104px)]">
            Slow rooms.
            <br />
            <span className="text-[var(--sx-muted)]">Long mornings.</span>
          </H>
          <div className="mt-10">
            <Btn kind="ghost">See the rooms</Btn>
          </div>
        </div>
        <div className="flex flex-col md:col-span-5">
          <P className="max-w-[40ch]">
            A tea estate bungalow above Munnar, rebuilt slowly around the old verandas. Breakfast runs until noon, the pool is warm until midnight, and nobody will ask when you are checking out.
          </P>
          <div className="mt-32 grid grid-cols-1 gap-10 md:mt-44 md:grid-cols-3 md:gap-6">
            {[
              ["38", "rooms and cottages, none above two floors"],
              ["4.9", "average guest score across 2,140 stays"],
              ["1,450", "metres above the sea, cool all year"],
            ].map(([n, t]) => (
              <div key={t} data-m-card className="border-t border-[var(--sx-text)] pt-5">
                <p data-m-num className="sx-display text-[clamp(36px,3vw,52px)] font-[700] leading-none tabular-nums tracking-[-0.02em]">
                  {n}
                </p>
                <p className="mt-3 text-[14px] leading-snug text-[var(--sx-muted)]">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Sec>
  );
}

/** ST12 · One huge headline metric (6/12) beside a supporting image (6/12); a row of four smaller figures below. */
function ST12() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M13");
  return (
    <Sec innerRef={r} theme="ink" font="condensed" className="py-[clamp(72px,9vw,140px)]">
      <style>{CSS}</style>
      <div className="grid grid-cols-1 items-stretch gap-[clamp(32px,4vw,72px)] md:grid-cols-12">
        <div className="flex flex-col justify-between md:col-span-6">
          <P className="max-w-[36ch]">What our coffee growers in Chikmagalur were paid last harvest, above the auction price.</P>
          <div className="my-10">
            <p data-m-head className="sx-display text-[clamp(120px,15vw,240px)] font-[800] leading-[0.82] tracking-[-0.03em] text-[var(--sx-accent)]">
              +46%
            </p>
            <H className="mt-6 max-w-[16ch] text-[clamp(30px,3vw,48px)]">Fair price, paid at the farm gate.</H>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Btn>Read the 2025 report</Btn>
            <Btn kind="link">Meet the growers</Btn>
          </div>
        </div>
        <div className="relative md:col-span-6">
          <div className="st4kb relative h-full overflow-hidden rounded-[var(--sx-radius,18px)]">
            <Pic i={1} ratio="4/5" round={false} label="DECEMBER" className="h-full w-full" />
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="st4sheen absolute inset-y-0 w-[45%] bg-[linear-gradient(100deg,transparent,rgba(255,255,255,.14),transparent)]" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-[clamp(48px,6vw,88px)] grid grid-cols-2 border-t border-[var(--sx-line)] md:grid-cols-4">
        {[
          ["1,140", "growers on direct contracts"],
          ["312 t", "green coffee bought in 2025"],
          ["62%", "of farms now shade-grown"],
          ["₹9.8 Cr", "paid before the harvest"],
        ].map(([n, t], k) => (
          <div key={t} className={`pt-7 pr-6 ${k ? "md:border-l md:border-[var(--sx-line)] md:pl-7" : ""}`}>
            <p data-m-text className="sx-display text-[clamp(36px,3.4vw,56px)] font-[700] leading-none tabular-nums">{n}</p>
            <p className="mt-3 text-[14px] text-[var(--sx-muted)]">{t}</p>
          </div>
        ))}
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "ST11", name: "Statement left, ruled stats sink bottom-right", motion: "M3", C: ST11 },
  { code: "ST12", name: "Hero metric + image + figure row", motion: "M13", C: ST12 },
];
