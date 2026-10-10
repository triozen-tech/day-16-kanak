"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import type { MarqueeSection } from "./types";

/** Endless strip of big words. Speeds up / reverses with the scroll. */
export default function Marquee({ s }: { s: MarqueeSection }) {
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const tween = gsap.to(track.current, { xPercent: -50, duration: s.speed ?? 30, ease: "none", repeat: -1 });
    const st = ScrollTrigger.create({
      onUpdate: (self) => {
        const v = self.getVelocity() / 400;
        gsap.to(tween, { timeScale: gsap.utils.clamp(-5, 5, v === 0 ? 1 : v * self.direction), duration: 0.3, overwrite: true });
        gsap.to(tween, { timeScale: 1, duration: 1.2, delay: 0.3, overwrite: false });
      },
    });
    return () => {
      tween.kill();
      st.kill();
    };
  }, [s.speed]);

  const words = [...s.words, ...s.words];
  return (
    <section id={s.id} className="overflow-hidden border-y border-line py-10" aria-label={s.words.join(", ")}>
      <div ref={track} className="flex w-max whitespace-nowrap">
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0 items-center" aria-hidden>
            {words.map((w, i) => (
              <span
                key={i}
                className="font-display px-8 text-[clamp(56px,8vw,140px)]"
                style={s.outline ? { color: "transparent", WebkitTextStroke: "1px var(--accent)" } : { color: "var(--text)" }}
              >
                {w}
                <span className="pl-16 text-accent" style={{ WebkitTextStroke: 0 }}>
                  ✦
                </span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
