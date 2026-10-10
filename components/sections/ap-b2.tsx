"use client";

// AP · App download layouts (docs/SECTION-MENU.md), batch 2. Each is a full designed section; motion via useSectionMotion.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Hands-free cycling: steps an index every `ms` while the section is on screen (stops off screen and in ?static=1). */
function useAutoCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms = 900) {
  const [i, setI] = useState(n - 1);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let t: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (e.isIntersecting) {
        setI(0);
        t = setInterval(() => setI((v) => (v + 1) % n), ms);
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, [ref, n, ms]);
  return i;
}

// A decorative QR-style code (25 × 25 modules, seeded pattern + three finder squares). Not a real, scannable code.
const N = 25;
const finder = (x: number, y: number) => {
  for (const [fx, fy] of [[0, 0], [N - 7, 0], [0, N - 7]]) {
    if (x >= fx - 1 && x <= fx + 7 && y >= fy - 1 && y <= fy + 7) return true;
  }
  return false;
};
const MODULES: [number, number][] = [];
for (let y = 0; y < N; y++)
  for (let x = 0; x < N; x++) {
    if (finder(x, y)) continue;
    const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    if (h - Math.floor(h) > 0.52) MODULES.push([x, y]);
  }

const AP03_CSS = `.ap03-scan{animation:ap03-scan 1.8s ease-in-out infinite alternate}@keyframes ap03-scan{from{top:-6%}to{top:96%}}
.ap03-stamp{animation:ap03-stamp .45s cubic-bezier(.2,.9,.25,1.3)}@keyframes ap03-stamp{from{transform:scale(1.8) rotate(-20deg);opacity:0}to{transform:none;opacity:1}}
.ap03-float{animation:ap03-float 4.6s ease-in-out infinite alternate}@keyframes ap03-float{from{translate:0 -6px;rotate:-1deg}to{translate:0 8px;rotate:1.5deg}}
.is-static .ap03-scan,.is-static .ap03-stamp,.is-static .ap03-float{animation:none}.is-static .ap03-scan{opacity:0}
html.is-static {.ap03-scan,.ap03-stamp,.ap03-float{animation:none}.ap03-scan{opacity:0}}`;

const PERKS = [
  ["Order ahead, skip the queue", "Your usual is ready when you walk in."],
  ["Every ninth cup is on us", "Stamps add up across all eleven cafés."],
  ["Beans at your door", "A fresh 250 g bag every fortnight, from ₹540."],
  ["Members' price on pour-overs", "₹40 off every single-origin brew."],
  ["First seats at cupping nights", "Taste new lots before they reach the menu."],
];

function Phone({ stamps }: { stamps: number }) {
  return (
    <div className="ap03-float relative w-[clamp(180px,15vw,230px)] rounded-[34px] bg-[#0d0f12] p-[7px] shadow-[0_40px_70px_-30px_rgba(17,20,24,.6)]">
      <div className="overflow-hidden rounded-[28px] bg-[var(--sx-surface)] px-4 pb-5 pt-7 text-[var(--sx-text)]">
        <div className="mx-auto mb-4 h-[5px] w-14 rounded-full bg-[var(--sx-line)]" />
        <p className="text-[12px] font-[650] uppercase tracking-[0.14em] text-[var(--sx-muted)]">Good morning, Ira</p>
        <p className="sx-display mt-1 text-[24px] font-[800] leading-[1]">Your card</p>
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-[14px] bg-[var(--sx-bg)] p-3">
          {Array.from({ length: 9 }, (_, j) => (
            <span key={j} className="grid aspect-square place-items-center rounded-full border border-dashed border-[var(--sx-line)]">
              {j < stamps && (
                <span className={`ap03-stamp grid h-full w-full place-items-center rounded-full text-[13px] font-[800] ${j === 8 ? "bg-[var(--sx-text)] text-[var(--sx-bg)]" : "bg-[var(--sx-accent)] text-[var(--sx-accent-text)]"}`}>
                  {j === 8 ? "★" : "✓"}
                </span>
              )}
            </span>
          ))}
        </div>
        <p className="mt-3 text-[12px] text-[var(--sx-muted)]">{stamps >= 9 ? "Free cup unlocked" : `${9 - stamps} more to a free cup`}</p>
        <div className="mt-4 rounded-[14px] bg-[var(--sx-text)] p-3 text-[var(--sx-bg)]">
          <p className="text-[12px] opacity-70">Your usual</p>
          <p className="text-[14px] font-[650]">Oat flat white · ₹220</p>
        </div>
      </div>
    </div>
  );
}

/** AP03 · QR card + benefits split: left the headline, a benefits list and store buttons; right a QR card with the app
 *  on a phone. The card unfolds from its corner, the benefits rise line by line; the loyalty card fills itself. */
function AP03() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M18");
  const stamps = useAutoCycle(r, 12, 750); // 0..9 stamps then a short hold
  return (
    <Sec innerRef={r} theme="stone" font="condensed" className="py-[clamp(72px,9vw,140px)]">
      <style>{AP03_CSS}</style>
      <div className="grid grid-cols-1 items-center gap-[clamp(40px,6vw,104px)] md:grid-cols-12">
        <div className="min-w-0 md:col-span-6">
          <H className="max-w-[11ch] text-[clamp(52px,6.4vw,112px)] uppercase">Your coffee, one scan away.</H>
          <ul className="mt-[clamp(28px,3.4vw,48px)] border-t border-[var(--sx-line)]">
            {PERKS.map(([t, d]) => (
              <li key={t} data-m-text className="flex items-start gap-4 border-b border-[var(--sx-line)] py-4">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--sx-accent)] text-[13px] font-[800] text-[var(--sx-accent-text)]">✓</span>
                <span>
                  <span className="block text-[clamp(17px,1.3vw,20px)] font-[650]">{t}</span>
                  <span className="block text-[15px] text-[var(--sx-muted)]">{d}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Btn>
              <svg width="16" height="18" viewBox="0 0 16 18" aria-hidden className="-ml-1 mr-1 inline-block">
                <rect x="2" y="1" width="12" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="8" cy="14" r="1.1" fill="currentColor" />
              </svg>
              iPhone app
            </Btn>
            <Btn kind="ghost">
              <svg width="16" height="18" viewBox="0 0 16 18" aria-hidden className="-ml-1 mr-1 inline-block">
                <path d="M3 6h10v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM5 2l1.5 2.5M11 2 9.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              Android app
            </Btn>
            <span className="text-[14px] text-[var(--sx-muted)]">Free · 4.8 from 12,400 ratings</span>
          </div>
        </div>

        <div className="md:col-span-6">
          <div data-m-card className="relative grid grid-cols-1 items-center gap-[clamp(20px,2.6vw,40px)] overflow-hidden rounded-[var(--sx-radius,18px)] bg-[var(--sx-surface)] p-[clamp(22px,3vw,48px)] shadow-[0_50px_100px_-50px_rgba(17,20,24,.45)] md:grid-cols-[1fr_auto]">
            <div className="pointer-events-none absolute -bottom-[30%] -left-[20%] aspect-square w-[70%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_18%,transparent),transparent)] fx-pan" />
            <div className="relative">
              <p className="text-[13px] font-[650] uppercase tracking-[0.16em] text-[var(--sx-muted)]">Point your camera here</p>
              <div className="relative mt-4 aspect-square w-full max-w-[260px] overflow-hidden rounded-[16px] border border-[var(--sx-line)] bg-white p-[6%]">
                <svg viewBox={`-1 -1 ${N + 2} ${N + 2}`} className="h-full w-full" aria-label="QR code to download the app">
                  {MODULES.map(([x, y]) => (
                    <rect key={`${x}-${y}`} x={x + 0.06} y={y + 0.06} width=".88" height=".88" rx=".2" fill="#111418" />
                  ))}
                  {[[0, 0], [N - 7, 0], [0, N - 7]].map(([fx, fy]) => (
                    <g key={`${fx}-${fy}`}>
                      <rect x={fx + 0.5} y={fy + 0.5} width="6" height="6" rx="1.6" fill="none" stroke="#111418" strokeWidth="1" />
                      <rect x={fx + 2} y={fy + 2} width="3" height="3" rx=".8" fill="#111418" />
                    </g>
                  ))}
                  <rect x={N / 2 - 2.6} y={N / 2 - 2.6} width="5.2" height="5.2" rx="1.4" fill="#fff" />
                  <circle cx={N / 2} cy={N / 2} r="1.8" style={{ fill: "var(--sx-accent)" }} />
                </svg>
                <div className="ap03-scan pointer-events-none absolute inset-x-0 h-[10%] bg-[linear-gradient(180deg,transparent,color-mix(in_srgb,var(--sx-accent)_45%,transparent),transparent)]" />
              </div>
              <p className="sx-display mt-5 text-[clamp(26px,2.2vw,36px)] font-[800] uppercase leading-[1]">Third Pour Club</p>
              <p className="mt-2 max-w-[30ch] text-[15px] text-[var(--sx-muted)]">Scan in any of our cafés and your first cup is ₹99.</p>
            </div>
            <div className="relative justify-self-center">
              <Phone stamps={stamps} />
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "AP03", name: "QR card + benefits split", motion: "M18", C: AP03 }];
