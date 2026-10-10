"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import type { HorizontalGallerySection } from "./types";

/** Page pins and the gallery slides sideways as you scroll down. */
export default function HorizontalGallery({ s }: { s: HorizontalGallerySection }) {
  const outer = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const distance = () => Math.max(0, track.current!.scrollWidth - window.innerWidth);
      const setHeight = () => {
        outer.current!.style.height = `${distance() + window.innerHeight}px`;
      };
      setHeight();
      gsap.to(track.current, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: outer.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
          invalidateOnRefresh: true,
          onRefreshInit: setHeight,
        },
      });
      gsap.utils.toArray<HTMLElement>(".hg-img").forEach((img) => {
        gsap.fromTo(img, { scale: 1.15 }, { scale: 1, ease: "none", scrollTrigger: { trigger: outer.current, start: "top bottom", end: "bottom top", scrub: true } });
      });
    }, outer);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={outer} id={s.id} className="relative">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="container-x mb-10 flex items-end justify-between gap-10">
          <div>
            {s.eyebrow && <p className="eyebrow mb-5">{s.eyebrow}</p>}
            <h2 className="font-display text-[clamp(36px,4vw,68px)]">{s.heading}</h2>
          </div>
          <p className="hidden text-xs uppercase tracking-[0.3em] text-muted md:block">Scroll →</p>
        </div>
        <div ref={track} className="flex w-max gap-6 pl-[clamp(20px,5vw,80px)] pr-[10vw]">
          {s.items.map((it, i) => (
            <figure key={i} data-cursor="View" className="group relative h-[58vh] w-[min(42vw,620px)] shrink-0 overflow-hidden rounded-[var(--radius)]">
              <img src={it.image} alt={it.title} className="hg-img h-full w-full object-cover transition-transform duration-1000 group-hover:scale-[1.04]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <figcaption className="absolute bottom-6 left-6 right-6">
                <p className="eyebrow mb-2">{String(i + 1).padStart(2, "0")}</p>
                <p className="font-display text-3xl">{it.title}</p>
                {it.caption && <p className="mt-2 text-sm text-fg/75">{it.caption}</p>}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
