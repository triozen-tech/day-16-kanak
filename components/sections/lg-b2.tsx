"use client";

// LG · Logo / stockist layouts, batch 2 (docs/SECTION-MENU.md). Every wordmark is invented.
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { useScrub, useTicker } from "../fx/shared";
import { Btn, H, P, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** An invented wordmark, styled by `v` so a row of them reads as different brands. */
function Mark({ name, v }: { name: string; v: number }) {
  const styles = [
    "font-[800] uppercase tracking-[0.2em] text-[clamp(14px,1.2vw,18px)]",
    "sx-display italic font-[500] text-[clamp(22px,2vw,30px)] tracking-[-0.01em]",
    "font-[700] text-[clamp(18px,1.6vw,24px)] tracking-[-0.03em] lowercase",
    "font-[600] uppercase tracking-[0.34em] text-[clamp(12px,1vw,15px)]",
    "sx-display font-[800] text-[clamp(16px,1.3vw,21px)] tracking-[0.01em]",
  ];
  const shape = v % 3;
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      {v % 2 === 0 && (
        <svg viewBox="0 0 20 20" className="h-[1.1em] w-[1.1em] shrink-0" fill="currentColor" aria-hidden>
          {shape === 0 ? <circle cx="10" cy="10" r="8" /> : shape === 1 ? <path d="M10 1 19 18H1z" /> : <rect x="2" y="2" width="16" height="16" rx="4" />}
        </svg>
      )}
      <span className={styles[v % styles.length]}>{name}</span>
    </span>
  );
}

/* ───────────────────────── LG03 · Endless logo strip with edge fades ───────────────────────── */

/** LG03 · Slim band: a small centred caption, then one full-width row of invented wordmarks drifting left forever behind
 *  soft edge fades. The row bends with scroll speed (M44) and keeps a calm idle wave. */
function LG03() {
  const root = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const vel = useRef(0);
  const smooth = useRef(0);
  const x = useRef(0);
  useScrub(root, (_, v) => (vel.current = v), { finalValue: 0 });
  useTicker(root, (_, dt) => {
    smooth.current += (vel.current - smooth.current) * 0.08;
    vel.current *= 0.92;
    const items = row.current!.children as HTMLCollectionOf<HTMLElement>;
    const half = row.current!.scrollWidth / 2;
    x.current = (x.current - dt * (70 + Math.abs(smooth.current) * 500)) % half;
    const w = root.current!.clientWidth;
    for (const it of items) {
      const n = gsap.utils.clamp(0, 1, (it.offsetLeft + x.current + it.offsetWidth / 2) / w);
      const y = Math.sin(n * Math.PI) * (smooth.current * 50) + Math.sin(n * Math.PI * 2 + performance.now() / 1000) * 3;
      it.style.transform = `translate3d(${x.current.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    }
  });
  const names = ["The Morning Ledger", "Larder & Lane", "Saltbox", "Weekend Gazette", "Kilnhouse", "Hearth Market", "Field Notes Weekly", "Ochre Foods", "Copper & Crema", "Tamarind Store"];
  const list = [...names, ...names];
  return (
    <Sec theme="paper" font="editorial" full className="border-y border-[var(--sx-line)] py-[clamp(44px,5vw,76px)]">
      <p className="px-6 text-center text-[13px] font-[600] uppercase tracking-[0.2em] text-[var(--sx-muted)]">
        Stocked by 300 shops <span className="mx-3 text-[var(--sx-accent)]">·</span> as seen in
      </p>
      <div ref={root} className="mt-[clamp(24px,3vw,40px)] overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_14%,#000_86%,transparent)]">
        <div ref={row} className="flex w-max items-center py-3 text-[color-mix(in_srgb,var(--sx-text)_62%,transparent)]">
          {list.map((n, k) => (
            <span key={k} className="inline-block px-[clamp(28px,3.4vw,56px)] will-change-transform">
              <Mark name={n} v={k % names.length} />
            </span>
          ))}
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── LG04 · Logo grid with merged CTA cell ───────────────────────── */

/** LG04 · A 4×3 hairline grid of café wordmarks; the first two cells merge into an accent card, "Trusted by 2,000
 *  cafés", whose number counts up, with a CTA. A soft highlight steps from cell to cell. */
function LG04() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M3");
  const cafes = ["Third Wave Room", "Brewhouse 41", "Little Kettle", "Copper & Crema", "The Slow Pour", "Ridge Street", "Bean Theory", "Monsoon Bar", "Daybreak Co.", "Old Port Café"];
  const [hi, setHi] = useState(-1);
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    const order = [0, 5, 2, 7, 4, 9, 1, 6, 3, 8];
    let k = 0;
    let t: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (e.isIntersecting) t = setInterval(() => setHi(order[k++ % order.length]), 850);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, []);
  return (
    <Sec innerRef={r} theme="stone" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <style>{`
        .lg04-sheen { background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,.2) 48%, transparent 66%); background-size: 260% 100%; animation: lg04-sheen 3.4s linear infinite; }
        @keyframes lg04-sheen { from { background-position: 130% 0; } to { background-position: -130% 0; } }
        html.is-static .lg04-sheen { animation: none; opacity: 0; }
        html.is-static { .lg04-sheen { animation: none; opacity: 0; } }
      `}</style>
      <div className="grid grid-cols-1 items-end gap-6 md:grid-cols-12">
        <H className="text-[clamp(44px,5.6vw,96px)] md:col-span-7">Poured in good company.</H>
        <P className="max-w-[38ch] pb-2 md:col-span-5">Our single-estate beans run through the grinders of independent cafés in 38 cities. A few of the regulars:</P>
      </div>
      <div className="mt-[clamp(40px,6vw,80px)] grid grid-cols-2 border-l border-t border-[var(--sx-line)] md:grid-cols-4">
        {/* the merged CTA cell (first two cells) */}
        <div data-m-card className="relative col-span-2 flex min-h-[clamp(150px,12vw,184px)] flex-col justify-between gap-5 overflow-hidden border-b border-r border-[var(--sx-line)] bg-[var(--sx-accent)] p-[clamp(20px,2.2vw,32px)] text-[var(--sx-accent-text)] md:flex-row md:items-end">
          <span className="lg04-sheen pointer-events-none absolute inset-0" />
          <p className="sx-display relative text-[clamp(28px,2.6vw,42px)] font-[700] leading-[1.02] tracking-[-0.02em]">
            Trusted by <span data-m-num className="tabular-nums">2,000</span>
            <br />
            cafés
          </p>
          <a href="#" onClick={(e) => e.preventDefault()} className="sx-btn relative shrink-0 bg-[var(--sx-accent-text)] text-[var(--sx-accent)]">
            Open a wholesale account
          </a>
        </div>
        {cafes.map((c, k) => (
          <div key={c} data-m-card className={`grid min-h-[clamp(150px,12vw,184px)] place-items-center border-b border-r border-[var(--sx-line)] px-4 transition-colors duration-500 ${hi === k ? "bg-[var(--sx-surface)] text-[var(--sx-text)]" : "text-[var(--sx-muted)]"}`}>
            <Mark name={c} v={k} />
          </div>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 text-[15px] text-[var(--sx-muted)]">
        <span>Wholesale from ₹1,100 a kilo · roasted to order every Monday</span>
        <Btn kind="link">Ask for a tasting kit →</Btn>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "LG03", name: "Endless logo strip with edge fades", motion: "M44", C: LG03 },
  { code: "LG04", name: "Logo grid with merged CTA cell", motion: "M3", C: LG04 },
];
