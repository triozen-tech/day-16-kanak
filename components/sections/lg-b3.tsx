"use client";

// LG · Logo / stockist layouts, batch 3 (docs/SECTION-MENU.md). Every wordmark is invented.
import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Odometer } from "../fx/text";
import { Btn, H, P, Sec } from "./kit";
import type { SectionDef } from "./types";

/** An invented wordmark, styled by `v` so a row of them reads as different brands. */
function Mark({ name, v }: { name: string; v: number }) {
  const styles = [
    "font-[800] uppercase tracking-[0.18em] text-[16px]",
    "sx-display italic font-[500] text-[24px] tracking-[-0.01em]",
    "font-[700] text-[21px] tracking-[-0.03em] lowercase",
    "font-[600] uppercase tracking-[0.3em] text-[14px]",
    "sx-display font-[800] text-[19px] tracking-[0.01em]",
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

/* ───────────────────────── LG05 · Ruler carousel of logos ───────────────────────── */

const LG05_NAMES = ["Hourmark", "Atelier Vey", "Kessel", "Brightwell", "Tock & Tide", "Orrery", "Lumen Bench", "Caliber Row"];
const SLOT = 240; // px per logo on the ruler
const PERIOD = 1.9; // seconds per slot

/** LG05 · A horizontal ruler with tick marks runs across the width; invented stockist wordmarks sit on it and the
 *  ruler slides one slot at a time (eased, never fully stopping), the logo over the centre line snapping larger. A
 *  rolling odometer counts the stockists above it. */
function LG05() {
  const track = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const n = LG05_NAMES.length;
  const list = [...LG05_NAMES, ...LG05_NAMES, ...LG05_NAMES];
  useEffect(() => {
    const tr = track.current;
    const rw = row.current;
    if (!tr || !rw) return;
    const items = Array.from(rw.children) as HTMLElement[];
    // place a slot over the centre line: x so that item `n` (the middle copy) is centred at t = 0
    const layout = (shift: number) => {
      const w = tr.clientWidth;
      const base = w / 2 - (n * SLOT + SLOT / 2);
      const x = base - (shift % (n * SLOT));
      rw.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
      items.forEach((it, k) => {
        const cx = x + k * SLOT + SLOT / 2;
        const d = Math.min(1, Math.abs(cx - w / 2) / (SLOT * 0.85));
        const near = 1 - d;
        const logo = it.firstElementChild as HTMLElement;
        logo.style.transform = `translateY(${(-near * 10).toFixed(1)}px) scale(${(1 + near * near * 0.45).toFixed(3)})`;
        logo.style.opacity = (0.38 + near * 0.62).toFixed(3);
      });
    };
    layout(0);
    if (prefersReducedMotion()) {
      const ro = new ResizeObserver(() => layout(0));
      ro.observe(tr);
      return () => ro.disconnect();
    }
    let on = false;
    let raf = 0;
    let t = 0;
    let prev = 0;
    const io = new IntersectionObserver(([e]) => (on = e.isIntersecting), { rootMargin: "80px" });
    io.observe(tr);
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = prev ? Math.min(0.05, (now - prev) / 1000) : 0;
      prev = now;
      if (!on) return;
      t += dt;
      const f = (t / PERIOD) % 1;
      const slot = Math.floor(t / PERIOD);
      // eased step per slot that never stops dead (min speed ≈ 25% of the average), so the reel never freezes
      const eased = f - (Math.sin(2 * Math.PI * f) / (2 * Math.PI)) * 0.75;
      layout((slot + eased) * SLOT);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [n]);
  return (
    <Sec theme="ink" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <div className="grid grid-cols-1 items-end gap-[clamp(24px,4vw,64px)] md:grid-cols-12">
        <H className="text-[clamp(44px,5.4vw,88px)] md:col-span-7">Trusted on the bench.</H>
        <div className="md:col-span-5 md:pb-2">
          <p className="sx-display text-[clamp(56px,5.6vw,92px)] font-[700] leading-none tracking-[-0.02em] text-[var(--sx-accent)]">
            <Odometer value="1,240" />
          </p>
          <p className="mt-3 text-[15px] text-[var(--sx-muted)]">watchmakers and jewellers stock Calibre &amp; Co. screwdrivers, loupes and tweezers.</p>
        </div>
      </div>

      <div ref={track} className="relative mt-[clamp(48px,6vw,88px)] h-[200px] overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_14%,#000_86%,transparent)]">
        {/* centre reading line */}
        <div className="pointer-events-none absolute bottom-0 left-1/2 top-0 z-10 w-[2px] -translate-x-1/2 bg-[var(--sx-accent)]" />
        <div className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 border-x-[7px] border-t-[9px] border-x-transparent border-t-[var(--sx-accent)]" />
        <div ref={row} className="absolute left-0 top-0 flex h-full w-max will-change-transform">
          {list.map((name, k) => (
            <div key={k} className="relative flex h-full shrink-0 flex-col items-center" style={{ width: SLOT }}>
              <div className="mt-[42px] flex h-[56px] items-center will-change-transform">
                <Mark name={name} v={k % n} />
              </div>
              {/* ruler segment: minor ticks every 24px, a major tick + reading at the slot centre */}
              <div className="absolute inset-x-0 bottom-[34px] h-[18px] bg-[repeating-linear-gradient(90deg,var(--sx-muted)_0_1px,transparent_1px_24px)] opacity-50" />
              <div className="absolute bottom-[34px] left-1/2 h-[36px] w-[2px] -translate-x-1/2 bg-[var(--sx-text)]" />
              <span className="absolute bottom-[6px] left-1/2 -translate-x-1/2 text-[12px] tabular-nums text-[var(--sx-muted)]">{(k % n) * 10 + 10} mm</span>
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-[34px] h-px bg-[var(--sx-line)]" />
      </div>

      <div className="mt-[clamp(32px,4vw,56px)] flex flex-wrap items-center justify-between gap-6 border-t border-[var(--sx-line)] pt-8">
        <P className="max-w-[48ch]">Swiss-steel tips, hand-turned brass handles, measured to the tenth of a millimetre. Sold only where someone can show you how to hold them.</P>
        <div className="flex flex-wrap gap-4">
          <Btn>Become a stockist</Btn>
          <Btn kind="ghost">Find a bench near you</Btn>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "LG05", name: "Ruler carousel of logos", motion: "M48", C: LG05 }];
