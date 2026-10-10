"use client";

// VD · Video / device layouts, batch 7 (docs/SECTION-MENU.md). The "screen" is a moving placeholder (drifting art,
// running equaliser and progress), never an external video. Mid-page only: never use it as the hero.
import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { scene } from "../fx/shared";
import { Btn, H, P, Sec } from "./kit";
import type { SectionDef } from "./types";

const VD_CSS = `
.vdb7-glow{animation:vdb7-glow 5s linear infinite alternate}
@keyframes vdb7-glow{from{transform:translate(-24%,-8%) scale(.9)}to{transform:translate(24%,10%) scale(1.18)}}
.vdb7-bar{transform-origin:50% 100%;animation:vdb7-bar .9s ease-in-out infinite alternate}
@keyframes vdb7-bar{from{transform:scaleY(.18)}to{transform:scaleY(1)}}
.vdb7-prog{transform-origin:0 50%;animation:vdb7-prog 14s linear infinite}
@keyframes vdb7-prog{from{transform:scaleX(.08)}to{transform:scaleX(1)}}
.vdb7-art{animation:vdb7-art 6s linear infinite alternate}
@keyframes vdb7-art{from{transform:scale(1.05) translate(-3%,-2%)}to{transform:scale(1.18) translate(3%,2%)}}
html.is-static .vdb7-glow,html.is-static .vdb7-bar,html.is-static .vdb7-art{animation:none}
html.is-static .vdb7-prog{animation:none;transform:scaleX(.42)}
html.is-static {.vdb7-glow,.vdb7-bar,.vdb7-art{animation:none}.vdb7-prog{animation:none;transform:scaleX(.42)}}
`;

const BARS = 40;
const KEYS = 14 * 4;

/** VD13 · Laptop opens, screen flies out: a centred title over a front-view laptop with its lid half shut; on scroll
 *  the lid opens and the screen picture lifts, scales and moves out of the laptop toward the viewer, while the keyboard
 *  deck stays below. Markup = the final state (lid open, screen out), so ?static=1 shows it. */
function VD13() {
  const r = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const lid = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from(el.querySelectorAll("[data-m-head], [data-m-text]"), { y: 28, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, scrollTrigger: { trigger: el, start: "top 75%", toggleActions: "play none none reverse" } });
      const tl = gsap.timeline({ scrollTrigger: { trigger: stage.current, start: "top 92%", end: "center 52%", scrub: 0.6 } });
      tl.fromTo(lid.current, { rotationX: -74 }, { rotationX: 0, ease: "power2.out", duration: 0.6 }, 0)
        .fromTo(screen.current, { yPercent: 0, scale: 1, boxShadow: "0 0 0 0 rgba(0,0,0,0)" }, { yPercent: -9, scale: 1.13, boxShadow: "0 60px 120px -40px rgba(0,0,0,.65)", ease: "power2.inOut", duration: 0.45 }, 0.5);
    }, el);
    return () => ctx.revert();
  }, []);
  return (
    <Sec innerRef={r} theme="stone" font="grotesk" className="overflow-clip! py-[clamp(72px,9vw,140px)]">
      <style>{VD_CSS}</style>
      <div aria-hidden className="vdb7-glow pointer-events-none absolute left-[22%] top-[38%] aspect-square w-[56vw] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_40%,transparent),transparent)]" />
      <div className="relative z-10">
        <div className="mx-auto max-w-[820px] text-center">
          <H className="text-[clamp(44px,5.4vw,92px)]">Open it. The room goes quiet.</H>
          <P className="mx-auto mt-6 max-w-[48ch]">Hush turns any laptop into a listening room: lossless albums, spatial mixes and a focus mode that mutes every ping.</P>
        </div>

        {/* the laptop (front view) */}
        <div ref={stage} className="relative mx-auto mt-[clamp(110px,10vw,150px)] w-[min(78%,980px)] [perspective:1600px]">
          <div ref={lid} className="relative [transform-origin:50%_100%] [transform-style:preserve-3d]">
            <div className="relative aspect-[16/10] rounded-t-[clamp(14px,1.4vw,22px)] bg-[#0d0f13] p-[1.8%] shadow-[inset_0_0_0_1px_rgba(255,255,255,.08)]">
              {/* empty glass left behind once the picture lifts out */}
              <div className="h-full w-full rounded-[6px] bg-[radial-gradient(ellipse_at_50%_40%,#1b2230,#07090d)]" />
              <span className="absolute left-1/2 top-[0.7%] h-[6px] w-[6px] -translate-x-1/2 rounded-full bg-[#2a2f38]" />
              {/* the picture that flies out */}
              <div ref={screen} className="absolute inset-[1.8%] overflow-hidden rounded-[8px] bg-[#0b0d12] text-white" style={{ transform: "translateY(-9%) scale(1.13)", boxShadow: "0 60px 120px -40px rgba(0,0,0,.65)" }}>
                <div className="grid h-full grid-cols-12">
                  <div className="relative col-span-5 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={scene(3, 900, 1000, "")} alt="" className="vdb7-art absolute inset-0 h-full w-full object-cover" draggable={false} />
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_60%,#0b0d12)]" />
                  </div>
                  <div className="col-span-7 flex flex-col justify-between p-[clamp(16px,2.6%,32px)]">
                    <div className="flex items-center justify-between text-[13px] text-white/60">
                      <span className="font-[700] tracking-[0.14em] text-white">HUSH</span>
                      <span>Lossless · 24-bit / 96 kHz</span>
                    </div>
                    <div>
                      <p className="text-[13px] uppercase tracking-[0.14em] text-white/55">Now playing</p>
                      <p className="mt-2 text-[clamp(20px,2.4vw,36px)] font-[700] leading-[1.05]">Monsoon Sessions, Vol. 2</p>
                      <p className="mt-1 text-[14px] text-white/60">Rhea Kapoor Trio · Side A</p>
                    </div>
                    <div className="flex h-[26%] items-end gap-[3px]">
                      {Array.from({ length: BARS }, (_, k) => (
                        <span key={k} className="vdb7-bar block flex-1 rounded-t-[2px] bg-[var(--sx-accent)]" style={{ height: `${30 + ((k * 37) % 70)}%`, animationDelay: `${-((k * 0.13) % 0.9)}s`, animationDuration: `${0.6 + ((k * 7) % 5) * 0.12}s`, opacity: 0.55 + ((k * 3) % 5) * 0.09 }} />
                      ))}
                    </div>
                    <div>
                      <div className="h-[4px] w-full overflow-hidden rounded-full bg-white/15">
                        <div className="vdb7-prog h-full w-full rounded-full bg-white" />
                      </div>
                      <div className="mt-2 flex justify-between text-[12px] tabular-nums text-white/55">
                        <span>Track 3 of 9</span>
                        <span>6:48</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* keyboard deck, stays put */}
          <div className="relative -mx-[7%] [perspective:900px]">
            <div className="h-[clamp(70px,7vw,104px)] origin-top rounded-b-[14px] bg-[linear-gradient(180deg,#c9ced6,#9aa1ab)] px-[9%] pt-[1.2%] [transform:rotateX(52deg)]">
              <div className="grid grid-cols-14 gap-[3px]" style={{ gridTemplateColumns: "repeat(14, minmax(0,1fr))" }}>
                {Array.from({ length: KEYS }, (_, k) => (
                  <span key={k} className="block h-[clamp(10px,1vw,15px)] rounded-[2px] bg-[#2b2f36]" />
                ))}
              </div>
              <div className="mx-auto mt-[1.5%] h-[clamp(14px,1.4vw,22px)] w-[28%] rounded-[4px] bg-[#b3b9c2] shadow-[inset_0_0_0_1px_rgba(0,0,0,.12)]" />
            </div>
            <div className="mx-auto -mt-[clamp(26px,2.6vw,40px)] h-[10px] w-[96%] rounded-full bg-[radial-gradient(closest-side,rgba(0,0,0,.35),transparent)] blur-[2px]" />
          </div>
        </div>

        <div className="mt-[clamp(32px,4vw,56px)] flex flex-wrap items-center justify-center gap-4">
          <Btn>Start a 30-day trial</Btn>
          <span className="text-[15px] text-[var(--sx-muted)]">then ₹199 a month · cancel any time</span>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "VD13", name: "Laptop opens, screen flies out", motion: "M31", C: VD13 }];
