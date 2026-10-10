"use client";

// ER · Error page layouts, batch 1 (ER01). A branded not-found page.
import { useEffect, useRef } from "react";
import { gsap, isRecording, prefersReducedMotion } from "@/lib/gsap";
import { useTicker } from "../fx/shared";
import { MagneticButton } from "../fx/layout";
import { H, P, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** ER01 · Oversized-numeral 404: a huge "404" filling the width, short headline + copy, two magnetic buttons. The digits
 *  pop from their masks one at a time, then drift with the pointer (a slow automatic drift when filming / no pointer). */
function ER01() {
  const r = useRef<HTMLDivElement>(null);
  const digits = useRef<(HTMLSpanElement | null)[]>([]);
  const ptr = useRef<{ x: number; y: number; at: number } | null>(null);
  const pos = useRef([0, 0, 0].map(() => ({ x: 0, y: 0 })));
  useSectionMotion(r, "M12");
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    const inner = digits.current.map((d) => d?.firstElementChild).filter(Boolean);
    const tw = gsap.from(inner, { yPercent: 105, duration: 1.1, ease: "power4.out", stagger: 0.16, scrollTrigger: { trigger: el, start: "top 75%", toggleActions: "play none none reverse" } });
    const move = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      ptr.current = { x: (e.clientX - b.left) / b.width - 0.5, y: (e.clientY - b.top) / b.height - 0.5, at: performance.now() };
    };
    el.addEventListener("pointermove", move);
    return () => {
      el.removeEventListener("pointermove", move);
      tw.scrollTrigger?.kill();
      tw.kill();
    };
  }, []);
  useTicker(r, (t) => {
    const live = ptr.current && performance.now() - ptr.current.at < 1500 && !isRecording();
    digits.current.forEach((d, k) => {
      if (!d) return;
      const depth = [1, 1.7, 1.2][k];
      const tx = live ? ptr.current!.x * 46 * depth : Math.sin(t * 0.7 + k * 1.9) * 16 * depth;
      const ty = live ? ptr.current!.y * 30 * depth : Math.cos(t * 0.55 + k * 1.3) * 12 * depth;
      const p = pos.current[k];
      p.x += (tx - p.x) * 0.08;
      p.y += (ty - p.y) * 0.08;
      d.style.transform = `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, 0) rotate(${(p.x * 0.06).toFixed(2)}deg)`;
    });
  });
  return (
    <Sec innerRef={r} theme="ink" font="condensed" className="py-[clamp(72px,8vw,128px)]">
      <div className="fx-pan pointer-events-none absolute left-1/2 top-[34%] aspect-square w-[min(90vw,1100px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_26%,transparent),transparent)]" />
      <div className="relative flex min-h-[clamp(560px,86svh,900px)] flex-col justify-between gap-[clamp(32px,4vw,56px)]">
        <div className="flex items-center justify-between text-[14px] text-[var(--sx-muted)]">
          <span className="sx-display text-[18px] font-[800] tracking-[0.1em] text-[var(--sx-text)]">KILNHOUSE</span>
          <span>Error 404 · page not found</span>
        </div>
        <p aria-label="404" className="sx-display flex select-none justify-center gap-[0.02em] text-[clamp(220px,34vw,600px)] font-[800] leading-[0.9] tracking-[-0.02em]">
          {["4", "0", "4"].map((c, k) => (
            <span
              key={k}
              ref={(n) => {
                digits.current[k] = n;
              }}
              className="inline-block overflow-hidden will-change-transform"
            >
              <span className={`block ${k === 1 ? "text-transparent [-webkit-text-stroke:2px_var(--sx-accent)]" : ""}`}>{c}</span>
            </span>
          ))}
        </p>
        <div className="grid grid-cols-1 items-end gap-8 border-t border-[var(--sx-line)] pt-[clamp(24px,3vw,40px)] md:grid-cols-12">
          <div className="md:col-span-6">
            <H className="text-[clamp(40px,4.6vw,80px)]">This page went for a walk.</H>
            <P className="mt-4 max-w-[46ch]">The link may be old, or the page has moved. Your cart, the shop and the studio journal are all still here.</P>
          </div>
          <div className="flex flex-col gap-6 md:col-span-6 md:items-end">
            <div className="flex flex-wrap gap-4">
              <MagneticButton className="bg-[var(--sx-accent)]! text-[15px] text-[var(--sx-accent-text)]!">Back to home</MagneticButton>
              <MagneticButton className="border border-[var(--sx-line)] bg-transparent! text-[15px] text-[var(--sx-text)]!">Browse ceramics</MagneticButton>
            </div>
            <p className="text-[14px] text-[var(--sx-muted)]">Popular: Stoneware mugs from ₹890 · Gift cards · Track an order</p>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "ER01", name: "Oversized-numeral 404", motion: "M12", C: ER01 }];
