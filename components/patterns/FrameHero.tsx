"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { onSiteReady } from "@/lib/loading";
import type { Caption, FrameHeroSection } from "./types";
import { useFramePlayer } from "@/components/engine/useFramePlayer";
import Button from "@/components/ui/Button";

const captionPos: Record<NonNullable<Caption["position"]>, string> = {
  left: "left-[clamp(20px,5vw,80px)] top-1/2 -translate-y-1/2 text-left max-w-xl",
  right: "right-[clamp(20px,5vw,80px)] top-1/2 -translate-y-1/2 text-right max-w-xl",
  center: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center max-w-3xl",
  bottom: "left-1/2 bottom-[14vh] -translate-x-1/2 text-center max-w-3xl",
};

/**
 * THE SIGNATURE SECTION: a video that plays as you scroll.
 * The screen stays pinned while the frames advance; captions fade in and out.
 */
export default function FrameHero({ s, first = false }: { s: FrameHeroSection; first?: boolean }) {
  const outer = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLDivElement>(null);
  const player = useFramePlayer(s.frames, canvas, { blockLoader: first });
  const length = s.length ?? 4;
  const align = s.align ?? "left";

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: outer.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
          onUpdate: (self) => player.current.seek(self.progress),
        },
      });
      tl.to({}, { duration: 1 }); // timeline length = 1 so captions use 0–1
      tl.to(intro.current, { opacity: 0, y: -60, duration: 0.1, ease: "none" }, 0.04);
      tl.to(hint.current, { opacity: 0, duration: 0.04 }, 0.01);

      (s.captions ?? []).forEach((c, i) => {
        const el = outer.current!.querySelector(`[data-caption="${i}"]`);
        const d = c.duration ?? 0.18;
        tl.fromTo(el, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: d * 0.3, ease: "power2.out" }, c.at);
        tl.to(el, { opacity: 0, y: -30, duration: d * 0.25, ease: "power2.in" }, c.at + d * 0.75);
      });
    }, outer);

    // Intro text animation once the loader is gone
    const off = onSiteReady(() => {
      const lines = intro.current?.querySelectorAll(".hero-line > span");
      const rest = intro.current?.querySelectorAll("[data-hero-fade]");
      if (lines) gsap.from(lines, { yPercent: 110, duration: 1.2, ease: "power4.out", stagger: 0.12 });
      if (rest) gsap.from(rest, { opacity: 0, y: 24, duration: 1, delay: 0.45, stagger: 0.12, ease: "power3.out" });
    });

    return () => {
      off();
      ctx.revert();
    };
  }, [s.captions, player]);

  const overlay = s.overlay ?? 0.45;

  return (
    <section ref={outer} id={s.id} className="relative" style={{ height: `${length * 100}vh` }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden text-[var(--hero-text)]">
        <canvas ref={canvas} className="absolute inset-0 h-full w-full" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              align === "left"
                ? `linear-gradient(90deg, rgba(0,0,0,${overlay + 0.15}) 0%, rgba(0,0,0,${overlay * 0.4}) 55%, transparent 80%), linear-gradient(0deg, var(--bg) 0%, transparent 28%)`
                : `radial-gradient(ellipse at center, rgba(0,0,0,${overlay * 0.6}), rgba(0,0,0,${overlay})), linear-gradient(0deg, var(--bg) 0%, transparent 28%)`,
          }}
        />

        {/* Intro title */}
        <div
          ref={intro}
          className={`container-x absolute inset-x-0 top-1/2 -translate-y-1/2 ${align === "center" ? "text-center" : ""}`}
        >
          {s.eyebrow && (
            <p className="eyebrow mb-6" data-hero-fade>
              {s.eyebrow}
            </p>
          )}
          <h1 className="font-display text-[clamp(32px,6vw,108px)]">
            {s.title.map((line, i) => (
              <span key={i} className="hero-line block overflow-hidden pb-[0.06em] lg:whitespace-nowrap">
                <span className="block">{line}</span>
              </span>
            ))}
          </h1>
          {s.subtitle && (
            <p
              data-hero-fade
              className={`mt-8 max-w-xl text-[clamp(15px,1.15vw,19px)] leading-relaxed opacity-85 ${align === "center" ? "mx-auto" : ""}`}
            >
              {s.subtitle}
            </p>
          )}
          {s.buttons && (
            <div data-hero-fade className={`mt-10 flex flex-wrap gap-4 ${align === "center" ? "justify-center" : ""}`}>
              {s.buttons.map((b) => (
                <Button key={b.label} href={b.href} label={b.label} style={b.style} />
              ))}
            </div>
          )}
        </div>

        {/* Captions that appear during the scroll */}
        {(s.captions ?? []).map((c, i) => (
          <div key={i} data-caption={i} className={`absolute opacity-0 ${captionPos[c.position ?? "left"]}`}>
            <h2 className="font-display text-[clamp(40px,5vw,88px)]">{c.title}</h2>
            {c.text && <p className="mt-5 text-[clamp(15px,1.1vw,18px)] leading-relaxed opacity-85">{c.text}</p>}
          </div>
        ))}

        <div ref={hint} className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3">
          <span className="text-[10px] uppercase tracking-[0.4em] text-muted">Scroll</span>
          <span className="block h-10 w-px animate-pulse bg-accent" />
        </div>
      </div>
    </section>
  );
}
