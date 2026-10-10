"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

/**
 * Endless row of images bent around a curve, drifting sideways (faster while you scroll).
 * Reference: Emango / Drift "Express your identity", saree "Woven to be remembered".
 *   curve="concave" → edges come toward you (cinema screen)
 *   curve="convex"  → edges bend away (a drum)
 */
export default function CurvedGallery({
  id,
  eyebrow,
  heading,
  text,
  items,
  curve = "concave",
  speed = 40,
  strength = 1,
}: {
  id?: string;
  eyebrow?: string;
  heading?: string;
  text?: string;
  items: { image: string; title?: string; caption?: string }[];
  curve?: "concave" | "convex";
  /** pixels per second of the idle drift */
  speed?: number;
  /** 0.5 = gentle bend, 1 = normal, 1.5 = strong */
  strength?: number;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = track.current!;
    const cards = Array.from(el.children) as HTMLElement[];
    const still = prefersReducedMotion();
    const sign = curve === "concave" ? 1 : -1;
    let x = 0;
    let boost = 0;
    let visible = true;

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: "200px" });
    io.observe(stage.current!);

    const onWheelish = () => {
      const v = window.__lenis?.velocity ?? 0;
      boost = Math.max(-25, Math.min(25, v)) * 18;
    };

    const bend = () => {
      const w = window.innerWidth;
      const half = el.scrollWidth / 2;
      for (const c of cards) {
        const r = c.getBoundingClientRect();
        const d = Math.max(-1.3, Math.min(1.3, (r.left + r.width / 2 - w / 2) / (w / 2)));
        const angle = -d * 32 * strength * sign;
        const z = d * d * 140 * strength * sign;
        c.style.transform = `translateZ(${z}px) rotateY(${angle}deg)`;
      }
      return half;
    };

    const tick = (_t: number, dt: number) => {
      if (!visible) return;
      if (!still) {
        onWheelish();
        x -= ((speed + Math.abs(boost)) * dt) / 1000;
        const half = el.scrollWidth / 2;
        if (-x >= half) x += half;
        el.style.transform = `translate3d(${x}px,0,0)`;
      }
      bend();
    };
    bend();
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      io.disconnect();
    };
  }, [curve, speed, strength]);

  const all = [...items, ...items];
  return (
    <section id={id} className="section-y overflow-hidden">
      {heading && (
        <div data-reveal className="container-x mb-14 text-center">
          {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
          <h2 className="font-display mx-auto max-w-3xl text-[clamp(36px,4vw,68px)]">{heading}</h2>
          {text && <p className="mx-auto mt-5 max-w-lg leading-relaxed text-muted">{text}</p>}
        </div>
      )}
      <div ref={stage} style={{ perspective: "1100px", perspectiveOrigin: "50% 50%" }}>
        <div ref={track} className="flex w-max gap-4 will-change-transform" style={{ transformStyle: "preserve-3d" }}>
          {all.map((it, i) => (
            <figure
              key={i}
              data-cursor={it.title ? "View" : undefined}
              className="group relative h-[clamp(220px,27vw,400px)] w-[clamp(150px,15vw,250px)] shrink-0 overflow-hidden rounded-[var(--radius)] bg-surface"
              style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
            >
              <img src={it.image} alt={it.title ?? ""} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              {it.title && (
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12 text-white">
                  <p className="font-display text-xl">{it.title}</p>
                  {it.caption && <p className="mt-1 text-xs opacity-80">{it.caption}</p>}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
