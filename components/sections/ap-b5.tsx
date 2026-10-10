"use client";

// AP · App layouts (docs/SECTION-MENU.md), batch 5. Store badges are generic (simple device glyphs and plain words,
// never a store's real logo). Loops stop in ?static=1.
import { useRef } from "react";
import { ShimmerButton } from "../fx/more";
import { H, Kicker, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const AP_CSS = `.ap5-band{background:repeating-linear-gradient(115deg,color-mix(in srgb,var(--sx-accent) 0%,transparent) 0 46px,color-mix(in srgb,var(--sx-accent) 40%,transparent) 46px 50px);animation:ap5-band 6s linear infinite}@keyframes ap5-band{from{background-position:0 0}to{background-position:-551.7px 0}}
.ap5-glow{animation:ap5-glow 4.6s linear infinite}@keyframes ap5-glow{from{translate:-60% 0}to{translate:160% 0}}
.is-static .ap5-band,.is-static .ap5-glow{animation:none}
html.is-static {.ap5-band,.ap5-glow{animation:none}}`;

function Badge({ phone, top, name }: { phone?: boolean; top: string; name: string }) {
  return (
    <span className="inline-block" style={{ ["--accent" as string]: "var(--sx-accent)" }}>
      <ShimmerButton className="!px-6 !py-3.5">
        <span className="flex items-center gap-3 text-left">
          <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            {phone ? (
              <>
                <rect x="9" y="3" width="14" height="26" rx="4" />
                <path d="M14 7h4M15 25h2" />
              </>
            ) : (
              <>
                <path d="M16 4v15M10 13l6 6 6-6" />
                <path d="M6 22v3a3 3 0 003 3h14a3 3 0 003-3v-3" />
              </>
            )}
          </svg>
          <span className="leading-tight">
            <span className="block text-[12px] font-[500] opacity-70">{top}</span>
            <span className="block text-[18px] font-[700]">{name}</span>
          </span>
        </span>
      </ShimmerButton>
    </span>
  );
}

/** AP05 · One-row app badge strip: eyebrow + headline on the left, two store badges on the right, vertically centred.
 *  The badges carry a running shimmer border (M64); the copy rises from blur. */
function AP05() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M6");
  return (
    <Sec innerRef={r} theme="ink" font="wide" className="py-[clamp(56px,7vw,110px)]" style={{ ["--sx-accent" as string]: "#7cf0c4", ["--sx-accent-text" as string]: "#04140e" }}>
      <style>{AP_CSS}</style>
      <div className="relative isolate overflow-hidden rounded-[28px] border border-[var(--sx-line)] bg-[var(--sx-surface)] px-[clamp(24px,4vw,72px)] py-[clamp(36px,4.4vw,64px)]">
        <div className="ap5-band pointer-events-none absolute inset-0 -z-10 opacity-60 [mask-image:linear-gradient(90deg,transparent,#000_55%)]" />
        <div className="ap5-glow pointer-events-none absolute -inset-y-1/2 left-0 -z-10 w-[40%] bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_40%,transparent),transparent)]" />
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-12">
          <div className="md:col-span-7">
            <Kicker>The Kettle app</Kicker>
            <H className="mt-4 max-w-[17ch] text-[clamp(34px,3.6vw,56px)]">Your usual chai, ready when you walk in.</H>
          </div>
          <div data-m-card className="flex flex-wrap items-center gap-4 md:col-span-5 md:justify-end">
            <Badge phone top="Download for" name="iPhone" />
            <Badge top="Get it for" name="Android" />
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "AP05", name: "One-row app badge strip", motion: "M64", C: AP05 }];
