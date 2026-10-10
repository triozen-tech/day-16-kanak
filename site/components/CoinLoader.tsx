"use client";
// I31 coin-spin mark + M146 wordmark docks into nav. Fixed 2.4 s (DESIGN.md reel time table).
// A gold K coin spins from the first paint (CSS, lesson 11) while the count climbs to 100; a large KANAK appears under
// it; then the ivory cover lifts and the wordmark flies into the nav's logo slot (the nav wordmark appears as it lands).
// `data-loader` keeps ?record=1 waiting until the cover is gone. ?static=1: no loader.
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

const TOTAL = 2.4;

export default function CoinLoader() {
  const [gone, setGone] = useState(false);
  const cover = useRef<HTMLDivElement>(null);
  const word = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setGone(true);
      return;
    }
    const slot = document.querySelector<HTMLElement>(
      "[data-wordmark-slot] > div",
    );
    if (slot) slot.style.opacity = "0";
    const counter = { v: 0 };
    const tl = gsap.timeline({
      onComplete: () => {
        if (slot) slot.style.opacity = "";
        setGone(true);
      },
    });
    tl.to(
      counter,
      {
        v: 100,
        duration: 1.5,
        ease: "power1.inOut",
        onUpdate: () =>
          count.current &&
          (count.current.textContent = String(Math.round(counter.v))),
      },
      0,
    )
      .fromTo(
        word.current,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
        0.55,
      )
      .add(() => {
        // fly the big wordmark into the nav slot
        if (!slot || !word.current) return;
        const a = word.current.getBoundingClientRect();
        const b = slot.getBoundingClientRect();
        gsap.to(word.current, {
          x: b.left + b.width / 2 - (a.left + a.width / 2),
          y: b.top + b.height / 2 - (a.top + a.height / 2),
          scale: b.height / a.height,
          duration: 0.8,
          ease: "power3.inOut",
        });
      }, 1.55)
      .to(
        cover.current,
        {
          clipPath: "inset(0% 0% 100% 0%)",
          duration: 0.8,
          ease: "power3.inOut",
        },
        1.6,
      )
      .set({}, {}, TOTAL);
    return () => {
      tl.kill();
      if (slot) slot.style.opacity = "";
    };
  }, []);

  if (gone) return null;
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[80]"
      data-loader
      aria-hidden
    >
      <div
        ref={cover}
        className="absolute inset-0 grid place-items-center overflow-hidden bg-[var(--ivory)]"
        style={{ clipPath: "inset(0% 0% 0% 0%)" }}
      >
        <div className="kj-coin-glow" />
        <div className="relative flex flex-col items-center">
          <div className="kj-coin" />
          <div className="kj-num mt-6 text-[13px] tracking-[0.3em] text-[var(--muted)]">
            <span ref={count}>0</span>
          </div>
        </div>
      </div>
      <div
        ref={word}
        className="kj-display absolute left-1/2 top-[64%] -translate-x-1/2 whitespace-nowrap text-[96px] leading-none tracking-[0.3em] pl-[0.3em] text-[var(--ink)] opacity-0"
        style={{ willChange: "transform" }}
      >
        KANAK
      </div>
    </div>
  );
}
