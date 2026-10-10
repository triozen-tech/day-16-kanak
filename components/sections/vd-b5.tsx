"use client";

// VD · Video layouts (docs/SECTION-MENU.md), batch 5. The "video" is a moving placeholder (drifting scene + light pass +
// running progress), never an external file; loops stop in ?static=1.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const VD_CSS = `.vd5-light{background:linear-gradient(105deg,transparent 30%,rgba(255,236,205,.38) 48%,transparent 66%) 0 0/260% 100%;animation:vd5-light 4.2s linear infinite}@keyframes vd5-light{from{background-position:140% 0}to{background-position:-40% 0}}
.vd5-prog{transform-origin:0 50%;animation:vd5-prog 14s linear infinite}@keyframes vd5-prog{from{transform:scaleX(.08)}to{transform:scaleX(1)}}
.vd5-ring{animation:vd5-ring 1.6s cubic-bezier(0,0,.2,1) infinite}@keyframes vd5-ring{from{transform:scale(1);opacity:.6}to{transform:scale(1.7);opacity:0}}
.is-static .vd5-light,.is-static .vd5-ring{animation:none;opacity:0}.is-static .vd5-prog{animation:none;transform:scaleX(.35)}
html.is-static {.vd5-light,.vd5-ring{animation:none;opacity:0}.vd5-prog{animation:none;transform:scaleX(.35)}}`;

/** Running timecode while the section is on screen (frozen at a sensible value in ?static=1). */
function useTimecode(ref: React.RefObject<HTMLElement | null>) {
  const [s, setS] = useState(48);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let t: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (e.isIntersecting) t = setInterval(() => setS((v) => (v + 1) % 222), 1000);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, [ref]);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** VD10 · Inset video card in an editorial split: a large headline in the left 5 columns; a rounded video card with a
 *  play button and a duration label in the right 7, with a caption under it. The card opens out of its frame. */
function VD10() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M13");
  const tc = useTimecode(r);
  return (
    <Sec innerRef={r} theme="stone" font="serif" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#a4472a", ["--sx-accent-text" as string]: "#fff8f2" }}>
      <style>{VD_CSS}</style>
      <div className="grid grid-cols-1 items-center gap-[clamp(36px,5vw,96px)] md:grid-cols-12">
        <div className="md:col-span-5">
          <H className="text-[clamp(48px,5.4vw,92px)]">Every block is carved by hand.</H>
          <P className="mt-7 max-w-[38ch]">Three minutes inside our Sanganer studio, where each linen throw is stamped forty times before it dries in the sun.</P>
          <div className="mt-9 flex flex-wrap items-center gap-5">
            <Btn>Shop the linen</Btn>
            <Btn kind="link">Meet the printers</Btn>
          </div>
        </div>

        <figure className="md:col-span-7">
          <div className="relative overflow-hidden rounded-[28px]">
            <div className="fx-pan">
              <Pic i={2} ratio="16/10" label="" round={false} className="fx-drift" />
            </div>
            <div className="vd5-light pointer-events-none absolute inset-0" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(10,8,6,.1),rgba(10,8,6,.05)_50%,rgba(10,8,6,.55))]" />
            <span className="absolute right-5 top-5 rounded-full bg-black/45 px-3.5 py-1.5 text-[13px] font-[600] tabular-nums text-white backdrop-blur-md">3:42</span>
            <button type="button" aria-label="Play film" className="absolute inset-0 m-auto grid h-[clamp(72px,7vw,104px)] w-[clamp(72px,7vw,104px)] place-items-center rounded-full bg-white/90 text-[#1c1813] shadow-[0_20px_60px_rgba(0,0,0,.3)]">
              <span className="vd5-ring absolute inset-0 rounded-full border-2 border-white" />
              <svg viewBox="0 0 24 24" className="ml-1 h-[38%] w-[38%]" aria-hidden>
                <path d="M6 4l14 8-14 8z" fill="currentColor" />
              </svg>
            </button>
            <div className="absolute inset-x-5 bottom-5 flex items-center gap-4 text-[13px] font-[600] tabular-nums text-white">
              <span className="w-10">{tc}</span>
              <span className="relative h-[5px] flex-1 overflow-hidden rounded-full bg-white/25">
                <span className="vd5-prog absolute inset-0 rounded-full bg-white" />
              </span>
              <span className="w-10 text-right">3:42</span>
            </div>
          </div>
          <figcaption data-m-text className="mt-5 flex flex-wrap justify-between gap-3 text-[15px] text-[var(--sx-muted)]">
            <span>
              <b className="font-[650] text-[var(--sx-text)]">Forty stamps.</b> A short film from the Sanganer print floor.
            </span>
            <span>Filmed March 2026</span>
          </figcaption>
        </figure>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "VD10", name: "Inset video card in an editorial split", motion: "M13", C: VD10 }];
