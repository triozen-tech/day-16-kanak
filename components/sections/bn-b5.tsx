"use client";

// BN · Bento layouts, batch 5 (BN11). A full designed section; motion via useSectionMotion plus small hands-free loops
// so it never freezes on camera. ?static=1 shows the final state.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Runs `fn` every `ms` while the element is on screen (stops off screen and in ?static=1 / reduced motion). */
function useOnScreenInterval(ref: React.RefObject<HTMLElement | null>, ms: number, fn: () => void) {
  const cb = useRef(fn);
  cb.current = fn;
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let t: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (e.isIntersecting) t = setInterval(() => cb.current(), ms);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, [ref, ms]);
}

const BN11_CSS = `
.bn11-ping{animation:bn11-ping var(--d,1.8s) ease-out infinite;transform-box:fill-box;transform-origin:center}
@keyframes bn11-ping{from{transform:scale(1);opacity:.75}to{transform:scale(4.2);opacity:0}}
.bn11-wave{animation:bn11-wave 6s linear infinite}
@keyframes bn11-wave{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.bn11-scan{animation:bn11-scan 2.6s ease-in-out infinite alternate}
@keyframes bn11-scan{from{left:8%}to{left:92%}}
html.is-static .bn11-ping,html.is-static .bn11-wave,html.is-static .bn11-scan{animation:none}
html.is-static .bn11-ping{opacity:0}
html.is-static {.bn11-ping,.bn11-wave,.bn11-scan{animation:none}.bn11-ping{opacity:0}}
`;

/** A seamless wave over 2 periods of 1200 units (sine terms divide 1200, so the two halves match). */
function wavePath(w = 2400, h = 220, fill = false) {
  const pts: string[] = [];
  for (let x = 0; x <= w; x += 12) {
    const y = h * 0.68 + 34 * Math.sin((2 * Math.PI * x) / 400) + 16 * Math.sin((2 * Math.PI * x) / 240 + 1);
    pts.push(`${x},${y.toFixed(1)}`);
  }
  return fill ? `M0,${h} L${pts.join(" L")} L${w},${h} Z` : `M${pts.join(" L")}`;
}

const BN11_PINS = [
  { x: 132, y: 92, d: "1.8s" },
  { x: 318, y: 176, d: "2.3s" },
  { x: 452, y: 84, d: "2.0s" },
  { x: 236, y: 250, d: "2.6s" },
  { x: 520, y: 232, d: "1.6s" },
];

/** BN11 · One bordered box ruled into cells: row 1 = a hand-drawn service map with a floating tag | an app window with a
 *  live water reading, split by a vertical rule; row 2 = a full-width band with one giant stat; row 3 = a full-width
 *  chart with its text overlaid top-left. The stat counts up (M3); pins ping, the reading ticks and the chart scrolls. */
function BN11() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M3");
  const [tds, setTds] = useState(62);
  useOnScreenInterval(r, 900, () => setTds((v) => (v >= 66 ? 58 : v + 1 + (v % 2))));
  const cell = "relative overflow-hidden p-[clamp(22px,2.6vw,40px)]";
  return (
    <Sec innerRef={r} theme="ink" font="wide" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#4fd1e8", ["--sx-accent-text" as string]: "#05070c" }}>
      <style>{BN11_CSS}</style>
      <div className="grid grid-cols-1 items-end gap-[clamp(24px,4vw,64px)] md:grid-cols-12">
        <H className="text-[clamp(36px,4.4vw,72px)] md:col-span-7">Water you can check, not trust.</H>
        <div className="md:col-span-5 md:pb-2">
          <P>The Kaveri One purifier tests every litre and sends the numbers to your phone. Installed free in 48 hours, ₹18,990.</P>
          <div className="mt-6">
            <Btn>Book a free demo</Btn>
          </div>
        </div>
      </div>

      <div className="mt-[clamp(40px,5vw,72px)] overflow-hidden rounded-[var(--sx-radius)] border border-[var(--sx-line)]">
        {/* row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div data-m-card className={`${cell} border-b border-[var(--sx-line)] md:border-b-0 md:border-r`}>
            <p className="text-[clamp(18px,1.5vw,22px)] font-[700]">Service in 140 cities</p>
            <p className="mt-1 text-[15px] text-[var(--sx-muted)]">A technician near you, any day of the week.</p>
            <div className="relative mt-6">
              <svg viewBox="0 0 600 320" className="block h-auto w-full" aria-hidden>
                <rect width="600" height="320" rx="14" style={{ fill: "color-mix(in srgb, var(--sx-text) 4%, transparent)" }} />
                <path d="M-10 210 C120 170 200 240 320 200 S520 120 620 150" fill="none" style={{ stroke: "color-mix(in srgb, var(--sx-accent) 30%, transparent)" }} strokeWidth="16" />
                {[40, 100, 160, 220, 280].map((y) => (
                  <line key={`h${y}`} x1="0" x2="600" y1={y} y2={y + (y % 3) * 6} stroke="rgba(255,255,255,.08)" strokeWidth="3" />
                ))}
                {[70, 170, 270, 370, 470, 560].map((x) => (
                  <line key={`v${x}`} x1={x} x2={x - 30} y1="0" y2="320" stroke="rgba(255,255,255,.08)" strokeWidth="3" />
                ))}
                <path d="M0 130 L600 60" stroke="rgba(255,255,255,.16)" strokeWidth="6" />
                {BN11_PINS.map((p) => (
                  <g key={`${p.x}`}>
                    <circle className="bn11-ping" cx={p.x} cy={p.y} r="8" fill="var(--sx-accent)" style={{ ["--d" as string]: p.d }} />
                    <circle cx={p.x} cy={p.y} r="7" fill="var(--sx-accent)" stroke="var(--sx-bg)" strokeWidth="3" />
                  </g>
                ))}
              </svg>
              <div className="absolute left-[56%] top-[12%] rounded-xl border border-[var(--sx-line)] bg-[color-mix(in_srgb,var(--sx-surface)_88%,transparent)] px-4 py-3 shadow-[0_20px_40px_-20px_rgba(0,0,0,.7)] backdrop-blur-md">
                <p className="text-[12px] uppercase tracking-[0.14em] text-[var(--sx-muted)]">Indiranagar</p>
                <p className="mt-0.5 text-[15px] font-[650]">Technician 18 min away</p>
              </div>
            </div>
          </div>
          <div data-m-card className={cell}>
            <p className="text-[clamp(18px,1.5vw,22px)] font-[700]">Every reading, on your phone</p>
            <p className="mt-1 text-[15px] text-[var(--sx-muted)]">TDS, filter life and litres used, live.</p>
            <div className="mt-6 overflow-hidden rounded-[14px] border border-[var(--sx-line)] bg-[var(--sx-surface)]">
              <div className="flex items-center gap-2 border-b border-[var(--sx-line)] px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="ml-3 text-[12px] text-[var(--sx-muted)]">Kaveri · Kitchen</span>
              </div>
              <div className="grid grid-cols-2 gap-px bg-[var(--sx-line)]">
                <div className="bg-[var(--sx-surface)] p-5">
                  <p className="text-[12px] uppercase tracking-[0.14em] text-[var(--sx-muted)]">TDS now</p>
                  <p className="sx-display mt-2 text-[clamp(40px,4vw,60px)] font-[700] leading-none tabular-nums text-[var(--sx-accent)]">
                    {tds}
                    <span className="ml-1 text-[16px] font-[500] text-[var(--sx-muted)]">ppm</span>
                  </p>
                </div>
                <div className="bg-[var(--sx-surface)] p-5">
                  <p className="text-[12px] uppercase tracking-[0.14em] text-[var(--sx-muted)]">Filter life</p>
                  <p className="sx-display mt-2 text-[clamp(40px,4vw,60px)] font-[700] leading-none">82%</p>
                  <div className="mt-3 h-[6px] rounded-full bg-white/10">
                    <div className="h-full w-[82%] rounded-full bg-[var(--sx-text)]" />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between px-5 py-3.5 text-[14px]">
                <span className="text-[var(--sx-muted)]">Today</span>
                <span className="tabular-nums">14.2 litres · 9 glasses</span>
              </div>
            </div>
          </div>
        </div>
        {/* row 2: the stat band */}
        <div data-m-card className="border-t border-[var(--sx-line)] px-6 py-[clamp(40px,5vw,72px)] text-center">
          <p data-m-num className="sx-display text-[clamp(88px,13vw,210px)] font-[800] leading-[0.9] tracking-[-0.03em] tabular-nums">
            99.99%
          </p>
          <p className="mt-4 text-[clamp(16px,1.3vw,19px)] text-[var(--sx-muted)]">of bacteria and viruses removed, tested by an independent lab in Pune</p>
        </div>
        {/* row 3: the chart */}
        <div data-m-card className="relative h-[clamp(240px,22vw,320px)] overflow-hidden border-t border-[var(--sx-line)]">
          <div className="bn11-wave absolute inset-y-0 left-0 w-[200%]">
            <svg viewBox="0 0 2400 220" preserveAspectRatio="none" className="h-full w-full" aria-hidden>
              <defs>
                <linearGradient id="bn11-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="var(--sx-accent)" stopOpacity=".42" />
                  <stop offset="1" stopColor="var(--sx-accent)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={wavePath(2400, 220, true)} fill="url(#bn11-fill)" />
              <path d={wavePath(2400, 220)} fill="none" stroke="var(--sx-accent)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
          <div className="bn11-scan absolute inset-y-0 w-[2px] bg-[color-mix(in_srgb,var(--sx-text)_40%,transparent)]" />
          <div className="absolute left-0 top-0 max-w-[420px] p-[clamp(22px,2.6vw,40px)]">
            <p className="text-[clamp(20px,1.8vw,26px)] font-[700]">Every litre, logged.</p>
            <p className="mt-2 text-[15px] text-[var(--sx-muted)]">Seven days of readings from a home in Jayanagar. Steady, even when the tanker water isn&apos;t.</p>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "BN11", name: "Ruled grid with a full-width stat band", motion: "M3", C: BN11 }];
