"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { loading } from "@/lib/loading";

/**
 * Intro loader: the brand name rises letter by letter, a thin line fills
 * while the first video frames load, then the screen wipes upward.
 */
export default function Loader({ text, enabled = true }: { text: string; enabled?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(!enabled);

  useEffect(() => {
    if (!enabled || prefersReducedMotion()) {
      setGone(true);
      loading.markFinished();
      return;
    }
    const el = root.current!;
    const letters = el.querySelectorAll(".ld-letter");
    const intro = gsap.timeline();
    intro.from(letters, { yPercent: 110, duration: 1.1, ease: "power4.out", stagger: 0.06 });

    let shown = 0;
    let exiting = false;
    const minTime = Date.now() + 1800; // always show the brand for a moment
    const hardLimit = setTimeout(() => exit(), 9000);

    let unsub = () => {};
    const exit = () => {
      if (exiting) return;
      exiting = true;
      unsub(); // stop listening — the bar is about to disappear
      clearTimeout(hardLimit);
      const wait = Math.max(0, minTime - Date.now());
      gsap
        .timeline({ delay: wait / 1000 })
        .to(bar.current, { scaleX: 1, duration: 0.4, ease: "power2.out" })
        .to(letters, { yPercent: -110, duration: 0.7, ease: "power3.in", stagger: 0.03 }, "+=0.1")
        .to(el, { yPercent: -100, duration: 1.1, ease: "power4.inOut" }, "-=0.25")
        .add(() => {
          setGone(true);
          loading.markFinished();
        }, "-=0.45");
    };

    unsub = loading.subscribe((p, done) => {
      if (exiting || !bar.current) return;
      shown = Math.max(shown, p);
      gsap.to(bar.current, { scaleX: shown, duration: 0.5, ease: "power2.out", overwrite: "auto" });
      if (done) exit();
    });

    return () => {
      unsub();
      clearTimeout(hardLimit);
      intro.kill();
    };
  }, [enabled]);

  if (gone) return null;

  return (
    <div ref={root} data-loader className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg" aria-hidden>
      <div className="font-display flex overflow-hidden text-[clamp(48px,9vw,140px)] leading-none" style={{ letterSpacing: "0.12em" }}>
        {text.split("").map((ch, i) => (
          <span key={i} className="ld-letter inline-block text-accent">
            {ch === " " ? " " : ch}
          </span>
        ))}
      </div>
      <div className="mt-10 h-px w-[min(280px,50vw)] bg-line">
        <div ref={bar} className="h-full origin-left scale-x-0 bg-accent" />
      </div>
    </div>
  );
}
