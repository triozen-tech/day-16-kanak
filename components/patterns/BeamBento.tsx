"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

/**
 * Bento of dark glass tiles that light up one after another by themselves (first built for a
 * gaming / audio room): a beam of light runs round the lit tile's edge + a spotlight sweeps over it.
 * Hover lights a tile by hand (the spotlight follows the mouse). The first item is the big tile.
 * Laptop: big tile spans two rows on the left, 2×2 on the right. Phone: big tile on top, then 2×2.
 * Styles: .beam / .beam-spot in app/globals.css (colour: --beam-color).
 */
export type BeamItem = { image: string; title: string; kind?: string; text?: string; price?: string };

export default function BeamBento({ items, step = 1100, color = "#b56cff", className = "" }: { items: BeamItem[]; step?: number; color?: string; className?: string }) {
  const [lit, setLit] = useState(0);
  const grid = useRef<HTMLDivElement>(null);
  const hovering = useRef(false);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.35 });
    io.observe(grid.current!);
    const t = setInterval(() => visible && !hovering.current && setLit((a) => (a + 1) % items.length), step);
    return () => {
      clearInterval(t);
      io.disconnect();
    };
  }, [items.length, step]);

  useEffect(() => {
    if (prefersReducedMotion() || hovering.current) return;
    const tile = grid.current?.children[lit] as HTMLElement | undefined;
    if (tile) gsap.fromTo(tile, { "--mx": "10%", "--my": "15%" }, { "--mx": "85%", "--my": "75%", duration: step / 1000 + 0.4, ease: "sine.inOut" });
  }, [lit, step]);

  return (
    <div
      ref={grid}
      className={`grid grid-cols-2 gap-3 lg:h-[min(58vh,540px)] lg:grid-cols-[1.35fr_1fr_1fr] lg:grid-rows-2 ${className}`}
      style={{ "--beam-color": color } as React.CSSProperties}
      onMouseLeave={() => (hovering.current = false)}
    >
      {items.map((it, k) => {
        const big = k === 0;
        return (
          <article
            key={k}
            onMouseEnter={() => {
              hovering.current = true;
              setLit(k);
            }}
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
              e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
            }}
            className={`beam relative overflow-hidden rounded-[6px] border border-white/10 bg-[#140a2a]/60 text-white backdrop-blur-md ${lit === k ? "is-on" : ""} ${big ? "col-span-2 h-[270px] md:h-[340px] lg:col-span-1 lg:row-span-2 lg:h-auto" : "h-[200px] md:h-[230px] lg:h-auto"}`}
          >
            <span className="beam-spot pointer-events-none absolute inset-0 z-[1]" />
            <img
              src={it.image}
              alt={it.title}
              className={`absolute z-[2] object-contain ${big ? "left-1/2 top-[40%] w-[80%] -translate-x-1/2 -translate-y-1/2" : "bottom-[10%] right-[6%] h-[55%] w-auto max-w-[50%]"}`}
            />
            <div className={`absolute z-[2] flex flex-col ${big ? "bottom-6 left-6 right-6" : "bottom-4 left-4 top-4 max-w-[55%]"}`}>
              {it.kind && <p className="text-[12px] text-white/70">{it.kind}</p>}
              <h3 className={`font-display mt-1 ${big ? "text-[clamp(26px,2.6vw,44px)]" : "text-[clamp(18px,1.5vw,24px)]"}`}>{it.title}</h3>
              {it.text && <p className="mt-1 hidden text-[12px] text-white/75 md:block">{it.text}</p>}
              {it.price && <span className={`self-start rounded-[2px] bg-white px-2.5 py-1 text-[13px] font-semibold text-[#0f0820] ${big ? "mt-4" : "mt-auto"}`}>{it.price}</span>}
            </div>
          </article>
        );
      })}
    </div>
  );
}
