"use client";

import { useEffect } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger, SplitText } from "@/lib/gsap";
import { onSiteReady } from "@/lib/loading";

/**
 * Site-wide scroll animations driven by data attributes, so sections stay simple:
 *
 *   data-reveal            fade + slide up when it enters the screen
 *   data-reveal="stagger"  animate its direct children one after another
 *   data-split             line-by-line masked reveal, GSAP SplitText (use <SplitText>)
 *   data-parallax="0.15"   moves slower/faster than the page (0.1–0.3)
 *   data-count="850"       counts up (optional data-decimals, data-prefix, data-suffix)
 *   data-zoom              image slowly zooms out while it scrolls into view
 */
export default function Animations() {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    let ctx: gsap.Context | undefined;

    const setup = () => {
      ctx = gsap.context(() => {
        const START = "top 85%";

        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
          const targets = el.dataset.reveal === "stagger" ? Array.from(el.children) : [el];
          gsap.from(targets, {
            y: 48,
            opacity: 0,
            duration: 1.1,
            ease: "power3.out",
            stagger: 0.1,
            scrollTrigger: { trigger: el, start: START, once: true },
          });
        });

        // line-by-line reveal (GSAP SplitText: masked lines, re-split on font load / resize)
        gsap.utils.toArray<HTMLElement>("[data-split]").forEach((el) => {
          SplitText.create(el, {
              type: "lines",
              mask: "lines",
              autoSplit: true,
              onSplit: (self) =>
                gsap.from(self.lines, {
                  yPercent: 110,
                  duration: 0.9,
                  ease: "power3.out",
                  stagger: 0.08,
                  scrollTrigger: { trigger: el, start: START, once: true },
                }),
          }); // reverted with the context
        });

        gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
          const amount = Number(el.dataset.parallax || 0.15);
          gsap.fromTo(
            el,
            { yPercent: -amount * 100 },
            {
              yPercent: amount * 100,
              ease: "none",
              scrollTrigger: { trigger: el.parentElement || el, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        });

        gsap.utils.toArray<HTMLElement>("[data-zoom]").forEach((el) => {
          gsap.fromTo(
            el,
            { scale: 1.25 },
            { scale: 1, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom center", scrub: true } },
          );
        });

        gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
          const end = Number(el.dataset.count);
          const decimals = Number(el.dataset.decimals || 0);
          const prefix = el.dataset.prefix || "";
          const suffix = el.dataset.suffix || "";
          const obj = { v: 0 };
          gsap.to(obj, {
            v: end,
            duration: 2.2,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: START, once: true },
            onUpdate: () => {
              el.textContent = prefix + obj.v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
            },
          });
        });
      });
      ScrollTrigger.refresh();
    };

    const off = onSiteReady(setup);
    return () => {
      off();
      ctx?.revert();
    };
  }, []);

  return null;
}
