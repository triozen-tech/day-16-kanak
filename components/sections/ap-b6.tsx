"use client";

// AP · App download layouts (docs/SECTION-MENU.md), batch 6. A QR-first card: the code is drawn here (a decorative
// pattern, not a real link). A light band keeps sweeping over the QR frame; loops stop in ?static=1.
import { useRef } from "react";
import { H, P, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const AP_CSS = `.ap6-glow{background:radial-gradient(closest-side,color-mix(in srgb,var(--sx-accent) 46%,transparent),transparent);animation:ap6-glow 5s linear infinite alternate}@keyframes ap6-glow{from{translate:-34% -12%}to{translate:34% 14%}}
.ap6-glow2{background:radial-gradient(closest-side,color-mix(in srgb,var(--sx-accent) 36%,transparent),transparent);animation:ap6-glow2 7s linear infinite alternate}@keyframes ap6-glow2{from{translate:30% 10%}to{translate:-30% -16%}}
.ap6-shine{background:linear-gradient(115deg,transparent 35%,rgba(255,255,255,.85) 48%,color-mix(in srgb,var(--sx-accent) 45%,transparent) 52%,transparent 64%) 0 0/300% 100%;mix-blend-mode:screen;animation:ap6-shine 2.6s linear infinite}@keyframes ap6-shine{from{background-position:120% 0}to{background-position:-20% 0}}
.is-static .ap6-glow,.is-static .ap6-glow2{animation:none}.is-static .ap6-shine{animation:none;opacity:0}
html.is-static {.ap6-glow,.ap6-glow2{animation:none}.ap6-shine{animation:none;opacity:0}}`;

/** A decorative QR-style grid (deterministic): three finder squares + a seeded module pattern. */
const N = 25;
const MODULES: [number, number][] = (() => {
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const finder = (x: number, y: number) => (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9);
  const out: [number, number][] = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!finder(x, y) && rnd() > 0.52) out.push([x, y]);
  return out;
})();
const Finder = ({ x, y }: { x: number; y: number }) => (
  <g>
    <rect x={x} y={y} width="7" height="7" rx="1.4" fill="#111" />
    <rect x={x + 1} y={y + 1} width="5" height="5" rx="1" fill="#fff" />
    <rect x={x + 2} y={y + 2} width="3" height="3" rx="0.7" fill="#111" />
  </g>
);

/** AP06 · Scan-to-get narrow QR card: a narrow centred card with a large QR code in a white rounded frame on top, a
 *  centred title and one line under it, and a full-width secondary button at the bottom. */
function AP06() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M18");
  return (
    <Sec innerRef={r} theme="ink" font="editorial" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#3fb27f", ["--sx-accent-text" as string]: "#06150e" }}>
      <style>{AP_CSS}</style>
      <div className="ap6-glow pointer-events-none absolute left-[20%] top-[5%] aspect-square w-[60%] rounded-full" />
      <div className="ap6-glow2 pointer-events-none absolute bottom-[-20%] left-[30%] aspect-square w-[45%] rounded-full" />

      <div className="relative mx-auto flex w-full max-w-[400px] flex-col items-center">
        <div data-m-card className="w-full rounded-[30px] border border-[var(--sx-line)] bg-[var(--sx-surface)] p-[clamp(20px,2vw,28px)] text-center shadow-[0_50px_100px_-50px_rgba(0,0,0,.9)]">
          <div className="relative overflow-hidden rounded-[22px] bg-white p-[clamp(18px,1.8vw,26px)]">
            <svg viewBox={`-1 -1 ${N + 2} ${N + 2}`} className="relative block h-auto w-full" shapeRendering="crispEdges" role="img" aria-label="QR code">
              {MODULES.map(([x, y]) => (
                <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#111" />
              ))}
              <Finder x={0} y={0} />
              <Finder x={N - 7} y={0} />
              <Finder x={0} y={N - 7} />
              <rect x={N / 2 - 3} y={N / 2 - 3} width="6" height="6" rx="1.6" fill="#fff" />
              <rect x={N / 2 - 2.2} y={N / 2 - 2.2} width="4.4" height="4.4" rx="1.2" fill="var(--sx-accent)" />
            </svg>
            <div className="ap6-shine pointer-events-none absolute inset-0" />
          </div>
          <H className="mt-7 text-[clamp(30px,2.6vw,40px)] leading-[1.02]">Scan to get the app</H>
          <P className="mx-auto mt-3 max-w-[30ch] text-[16px]">Order from your table, pay by UPI, and every eighth filter coffee is on us.</P>
          <a href="#" onClick={(e) => e.preventDefault()} className="mt-7 flex w-full items-center justify-center rounded-full border border-[var(--sx-line)] bg-[color-mix(in_srgb,var(--sx-text)_6%,transparent)] px-6 py-4 text-[15px] font-[650] transition-colors hover:bg-[color-mix(in_srgb,var(--sx-text)_12%,transparent)]">
            Or open the menu in your browser
          </a>
        </div>
        <p data-m-text className="mt-6 text-center text-[14px] text-[var(--sx-muted)]">Tiffin Room · iOS and Android · free</p>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "AP06", name: "Scan-to-get narrow QR card", motion: "M18", C: AP06 }];
