"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import type { FrameScrubSection } from "./types";
import { useFramePlayer } from "@/components/engine/useFramePlayer";

/**
 * Product moment: a pinned image sequence (e.g. a 360° product spin)
 * with spec callouts that appear at set points of the scroll.
 */
export default function FrameScrub({ s }: { s: FrameScrubSection }) {
  const outer = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const player = useFramePlayer(s.frames, canvas, { fit: s.fit ?? "contain" });
  const length = s.length ?? 3.5;

  useEffect(() => {
    if (prefersReducedMotion()) {
      player.current.seek(0.1);
      return;
    }
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: outer.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
          onUpdate: (self) => {
            player.current.seek(self.progress);
          },
        },
      });
      tl.to({}, { duration: 1 });
      tl.fromTo(bar.current, { scaleX: 0 }, { scaleX: 1, ease: "none", duration: 1 }, 0);
      (s.callouts ?? []).forEach((c, i) => {
        const el = outer.current!.querySelector(`[data-callout="${i}"]`);
        const line = el?.querySelector(".callout-line");
        tl.fromTo(el, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.05 }, c.at);
        if (line) tl.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 0.06 }, c.at);
        tl.to(el, { opacity: 0, duration: 0.05 }, Math.min(0.97, c.at + 0.22));
      });
    }, outer);
    return () => ctx.revert();
  }, [s.callouts, player]);

  return (
    <section ref={outer} id={s.id} className="relative" style={{ height: `${length * 100}vh` }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <canvas
          ref={canvas}
          className="absolute inset-0 h-full w-full lg:left-[24%] lg:w-[76%]"
          style={{ maskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)", WebkitMaskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)" }}
        />

        <div className="container-x absolute inset-x-0 top-[14vh]">
          <div data-reveal className="max-w-md lg:max-w-[30vw]">
            {s.eyebrow && <p className="eyebrow mb-5">{s.eyebrow}</p>}
            <h2 className="font-display text-[clamp(36px,3.8vw,72px)]">{s.heading}</h2>
            {s.text && <p className="mt-6 leading-relaxed text-muted">{s.text}</p>}
          </div>
        </div>

        {(s.callouts ?? []).map((c, i) => (
          <div
            key={i}
            data-callout={i}
            className={`absolute w-[min(320px,80vw)] opacity-0 ${c.side === "left" ? "left-[clamp(20px,5vw,80px)]" : "right-[clamp(20px,5vw,80px)] text-right"}`}
            style={{ top: c.top ?? "58%" }}
          >
            <div className={`callout-line mb-4 h-px w-24 bg-accent ${c.side === "left" ? "origin-left" : "ml-auto origin-right"}`} />
            <p className="eyebrow mb-2">{c.label}</p>
            <p className="text-lg leading-snug text-fg">{c.text}</p>
          </div>
        ))}

        <div className="container-x absolute inset-x-0 bottom-10">
          <div className="h-px w-full bg-line">
            <div ref={bar} className="h-full origin-left scale-x-0 bg-accent" />
          </div>
        </div>
      </div>
    </section>
  );
}
