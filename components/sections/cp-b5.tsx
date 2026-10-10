"use client";

// CP · Compare layouts, batch 5 (docs/SECTION-MENU.md).
import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { scene } from "../fx/shared";
import { Btn, H, P, Price, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/* ───────────────────────── CP04 · Compare slider + highlights sidebar ───────────────────────── */

const CP04_ROWS = [
  { at: 0.22, t: "Fewer breakouts", d: "Active spots down 62% by week eight.", icon: "dot" },
  { at: 0.42, t: "Smaller-looking pores", d: "Zinc PCA keeps the T-zone matte till evening.", icon: "ring" },
  { at: 0.62, t: "More even tone", d: "Red marks fade as niacinamide calms the skin.", icon: "half" },
  { at: 0.8, t: "Stronger barrier", d: "Water loss down 28%, measured on 64 people.", icon: "shield" },
];

const Icon = ({ k }: { k: string }) => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
    {k === "dot" && <circle cx="12" cy="12" r="4" fill="currentColor" />}
    {k === "dot" && <circle cx="12" cy="12" r="9" />}
    {k === "ring" && <circle cx="12" cy="12" r="8" strokeDasharray="3 3" />}
    {k === "half" && <circle cx="12" cy="12" r="8.5" />}
    {k === "half" && <path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" />}
    {k === "shield" && <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" />}
  </svg>
);

/** CP04 · Left 8/12: an after / before slider (week 8 left of the handle, week 0 right) that sweeps by itself, back and forth. Right 4/12: four
 *  highlight rows that light up one by one as the handle passes their point. */
function CP04() {
  const r = useRef<HTMLDivElement>(null);
  const after = useRef<HTMLDivElement>(null);
  const handle = useRef<HTMLDivElement>(null);
  const rows = useRef<(HTMLLIElement | null)[]>([]);
  useSectionMotion(r, "M18");

  useEffect(() => {
    const el = r.current;
    const paint = (p: number) => {
      if (after.current) after.current.style.clipPath = `inset(0 ${(100 - p * 100).toFixed(2)}% 0 0)`;
      if (handle.current) handle.current.style.left = `${(p * 100).toFixed(2)}%`;
      rows.current.forEach((row, k) => row?.setAttribute("data-on", p >= CP04_ROWS[k].at ? "1" : "0"));
    };
    paint(0.5);
    if (!el || prefersReducedMotion()) return;
    // the "after" side (left of the handle) grows as the handle sweeps right, and back
    const o = { p: 0.06 };
    const tl = gsap.timeline({ paused: true, repeat: -1, yoyo: true, onUpdate: () => paint(o.p) });
    tl.fromTo(o, { p: 0.06 }, { p: 0.94, duration: 3.4, ease: "sine.inOut" });
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? tl.play() : tl.pause()));
    io.observe(el);
    return () => {
      io.disconnect();
      tl.kill();
    };
  }, []);

  const img = scene(1, 1600, 1100, "");
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <style>{`.cp5-row[data-on="1"]{background:color-mix(in srgb,var(--sx-accent) 13%,transparent);border-color:color-mix(in srgb,var(--sx-accent) 45%,transparent)}
.cp5-row[data-on="1"] .cp5-ic{background:var(--sx-accent);color:var(--sx-accent-text)}
.cp5-row[data-on="1"] .cp5-t{color:var(--sx-text)}
.cp5-row{transition:background-color .5s,border-color .5s}.cp5-ic,.cp5-t{transition:background-color .5s,color .5s}`}</style>
      <div className="grid grid-cols-1 items-end gap-[clamp(24px,4vw,64px)] md:grid-cols-12">
        <H className="text-[clamp(44px,5.4vw,92px)] md:col-span-8">Eight weeks, side by side.</H>
        <div className="md:col-span-4 md:pb-2">
          <P>One serum, used twice a day. Same light, same camera, week zero against week eight.</P>
        </div>
      </div>

      <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 gap-[clamp(16px,2vw,32px)] md:grid-cols-12">
        {/* slider */}
        <div data-m-card className="relative overflow-hidden rounded-[var(--sx-radius)] md:col-span-8" style={{ aspectRatio: "16 / 11" }}>
          {/* before: dull, blotchy */}
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${img}")`, filter: "saturate(.35) brightness(.78) contrast(.9) sepia(.25)" }} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_35%,rgba(150,50,40,.38)_0_3%,transparent_6%),radial-gradient(circle_at_62%_28%,rgba(150,50,40,.32)_0_2.5%,transparent_5%),radial-gradient(circle_at_48%_62%,rgba(150,50,40,.35)_0_3.5%,transparent_7%),radial-gradient(circle_at_72%_58%,rgba(150,50,40,.3)_0_2%,transparent_4.5%),radial-gradient(circle_at_22%_70%,rgba(150,50,40,.3)_0_2.5%,transparent_5%)]" />
          {/* after: clear */}
          <div ref={after} className="absolute inset-0" style={{ clipPath: "inset(0 50% 0 0)" }}>
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${img}")`, filter: "saturate(1.15) brightness(1.06)" }} />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_40%,rgba(255,240,220,.22),transparent_60%)]" />
          </div>
          <span className="absolute left-5 top-5 z-10 rounded-full bg-white/80 px-4 py-2 text-[13px] font-[600] text-[#1c1813] backdrop-blur-md">Week 8</span>
          <span className="absolute right-5 top-5 z-10 rounded-full bg-black/45 px-4 py-2 text-[13px] font-[600] text-white backdrop-blur-md">Week 0</span>
          <div ref={handle} className="absolute inset-y-0 w-0" style={{ left: "50%" }}>
            <span className="absolute inset-y-0 -left-px w-[2px] bg-white shadow-[0_0_20px_rgba(0,0,0,.35)]" />
            <span className="absolute left-0 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-[18px] font-[700] text-[#1c1813] shadow-[0_10px_30px_rgba(0,0,0,.3)]">‹ ›</span>
          </div>
        </div>

        {/* highlights */}
        <div className="flex flex-col md:col-span-4">
          <ul className="flex flex-1 flex-col gap-3">
            {CP04_ROWS.map((x, k) => (
              <li
                key={x.t}
                ref={(n) => {
                  rows.current[k] = n;
                }}
                data-m-card
                data-on="0"
                className="cp5-row flex flex-1 items-start gap-4 rounded-[16px] border border-[var(--sx-line)] p-[clamp(16px,1.6vw,24px)]"
              >
                <span className="cp5-ic grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--sx-surface)] text-[var(--sx-accent)]">
                  <Icon k={x.icon} />
                </span>
                <span>
                  <span className="cp5-t sx-display block text-[clamp(20px,1.7vw,26px)] leading-[1.1] text-[var(--sx-muted)]">{x.t}</span>
                  <span className="mt-1.5 block text-[15px] leading-snug text-[var(--sx-muted)]">{x.d}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--sx-line)] pt-5">
            <p className="text-[15px]">
              Clear Serum, 30 ml · <Price now="₹1,250" />
            </p>
            <Btn>Add to bag</Btn>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "CP04", name: "Compare slider + highlights sidebar", motion: "M18", C: CP04 }];
