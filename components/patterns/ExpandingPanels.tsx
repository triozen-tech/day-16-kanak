"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Row of image strips: one is wide open, the others are thin with a vertical label.
 * Hover opens a strip; while on screen it also opens the next one by itself (good for filming).
 * Reference: restaurant reel 'Dining at …' (reels_reference), Fruitivo "Find your fragrance mood".
 */
export default function ExpandingPanels({
  id,
  eyebrow,
  heading,
  text,
  items,
  interval = 2600,
}: {
  id?: string;
  eyebrow?: string;
  heading?: string;
  text?: string;
  items: { image: string; title: string; text?: string }[];
  interval?: number;
}) {
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hovering = useRef(false);

  useEffect(() => {
    if (!interval) return;
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.4 });
    io.observe(ref.current!);
    const t = setInterval(() => {
      if (visible && !hovering.current) setActive((a) => (a + 1) % items.length);
    }, interval);
    return () => {
      clearInterval(t);
      io.disconnect();
    };
  }, [interval, items.length]);

  return (
    <section id={id} className="section-y">
      <div className="container-x">
        {heading && (
          <div data-reveal className="mb-12 text-center">
            {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
            <h2 className="font-display text-[clamp(36px,4vw,64px)]">{heading}</h2>
            {text && <p className="mx-auto mt-4 max-w-md text-sm text-muted">{text}</p>}
          </div>
        )}
        <div
          ref={ref}
          data-reveal
          className="flex h-[clamp(360px,56vh,560px)] gap-2"
          onMouseLeave={() => (hovering.current = false)}
        >
          {items.map((it, i) => {
            const on = i === active;
            return (
              <div
                key={i}
                onMouseEnter={() => {
                  hovering.current = true;
                  setActive(i);
                }}
                className="relative min-w-0 cursor-pointer overflow-hidden rounded-[var(--radius)] transition-[flex-grow] duration-[900ms] ease-[cubic-bezier(.65,0,.35,1)]"
                style={{ flexGrow: on ? 6 : 1, flexBasis: 0 }}
              >
                <img src={it.image} alt={it.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s]" style={{ transform: on ? "scale(1)" : "scale(1.15)" }} />
                <div className={`absolute inset-0 transition-colors duration-700 ${on ? "bg-gradient-to-t from-black/70 via-transparent to-transparent" : "bg-black/45"}`} />
                <p
                  className="absolute bottom-6 left-1/2 origin-center -translate-x-1/2 whitespace-nowrap text-[11px] uppercase tracking-[0.3em] text-white transition-opacity duration-500 [writing-mode:vertical-rl] rotate-180"
                  style={{ opacity: on ? 0 : 0.9 }}
                >
                  {it.title}
                </p>
                <div className="absolute bottom-6 left-6 right-6 text-white transition-all duration-700" style={{ opacity: on ? 1 : 0, transform: on ? "none" : "translateY(16px)" }}>
                  <p className="font-display text-[clamp(26px,2.6vw,44px)]">{it.title}</p>
                  {it.text && <p className="mt-2 max-w-sm text-sm opacity-80">{it.text}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
