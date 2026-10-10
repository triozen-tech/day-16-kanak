"use client";
// Plays a GSAP timeline once, on the clock, when a section starts arriving (lessons 77, 108: timed reveals start while
// the section is still coming in, so they land inside its record hold). Also scrubs an optional "arch" var from 0 to 1
// over the section's entry, for the S3 arch edges that flatten as they pass. ?static=1: nothing runs, final state.
import { useEffect, type RefObject } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

export function useEnter(
  root: RefObject<HTMLElement | null>,
  build: (tl: gsap.core.Timeline, q: (sel: string) => Element[]) => void,
  opts: { start?: string; arch?: boolean; trigger?: string } = {},
) {
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true });
      build(tl, (sel) => gsap.utils.toArray<Element>(sel, el));
      ScrollTrigger.create({
        trigger: (opts.trigger && el.querySelector(opts.trigger)) || el,
        start: opts.start ?? "top 70%",
        once: true,
        onEnter: () => tl.play(),
      });
      if (opts.arch)
        gsap.fromTo(
          el,
          { "--arch": 0 },
          {
            "--arch": 1,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top bottom",
              end: "top 20%",
              scrub: true,
            },
          },
        );
    }, el);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
