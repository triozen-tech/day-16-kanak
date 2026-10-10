"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

/**
 * One product at a time, big: image in the middle, the previous one fading out as a blurred ghost,
 * details (name, rating, price, sizes, colours) on the right. Changes by itself while on screen.
 * Reference: Drift "Unbroken relaxed tee", saree "Ivory organza bloom".
 */
export type ShowcaseItem = {
  image: string;
  name: string;
  price: string;
  rating?: string; // "4.6 (102)"
  text?: string;
  sizes?: string[];
  colors?: string[]; // hex
  crumb?: string; // "Home › Tops"
};

export default function ProductShowcase({ id, items, interval = 3200, cta = "Add to bag" }: { id?: string; items: ShowcaseItem[]; interval?: number; cta?: string }) {
  const [i, setI] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const root = useRef<HTMLElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const info = useRef<HTMLDivElement>(null);
  const it = items[i];

  const go = (n: number) => {
    setPrev(i);
    setI((n + items.length) % items.length);
  };

  useEffect(() => {
    if (!interval) return;
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.5 });
    io.observe(root.current!);
    const t = setInterval(() => {
      if (!visible) return;
      setI((cur) => {
        setPrev(cur);
        return (cur + 1) % items.length;
      });
    }, interval);
    return () => {
      clearInterval(t);
      io.disconnect();
    };
  }, [interval, items.length]);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    gsap.fromTo(img.current, { opacity: 0, x: 80, filter: "blur(8px)" }, { opacity: 1, x: 0, filter: "blur(0px)", duration: 0.9, ease: "power3.out" });
    gsap.fromTo(info.current!.children, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: "power2.out" });
  }, [i]);

  return (
    <section ref={root} id={id} className="relative overflow-hidden py-16">
      <div className="container-x grid min-h-[80vh] items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="relative flex h-[62vh] items-center justify-center px-16">
          {prev !== null && (
            <img key={`g${prev}-${i}`} src={items[prev].image} alt="" aria-hidden className="showcase-ghost absolute left-0 top-1/2 max-h-[55%] max-w-[55%] -translate-y-1/2 object-contain opacity-30 blur-[3px]" />
          )}
          <img ref={img} src={it.image} alt={it.name} className="relative z-10 max-h-full max-w-full object-contain drop-shadow-[0_30px_30px_rgba(0,0,0,.35)]" />
          <button onClick={() => go(i - 1)} className="absolute left-0 top-1/2 z-20 text-[11px] uppercase tracking-[0.2em] text-muted hover:text-fg">
            ‹ Prev
          </button>
          <button onClick={() => go(i + 1)} className="absolute right-0 top-1/2 z-20 text-[11px] uppercase tracking-[0.2em] text-muted hover:text-fg">
            Next ›
          </button>
        </div>
        <div ref={info} className="max-w-md">
          {it.crumb && <p className="text-[10px] uppercase tracking-[0.2em] text-muted">{it.crumb}</p>}
          {it.rating && <p className="mt-3 text-xs text-muted">★ {it.rating}</p>}
          <h3 className="font-display mt-2 text-[clamp(34px,3.4vw,56px)]">{it.name}</h3>
          <p className="mt-3 text-xl font-semibold">{it.price}</p>
          {it.sizes && (
            <div className="mt-6">
              <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-muted">Select size</p>
              <div className="flex gap-2">
                {it.sizes.map((s, k) => (
                  <span key={s} className={`grid h-10 min-w-10 place-items-center rounded-full border px-2 text-xs ${k === 2 ? "border-fg" : "border-line text-muted"}`}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {it.colors && (
            <div className="mt-5">
              <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-muted">Select colour</p>
              <div className="flex gap-2">
                {it.colors.map((c, k) => (
                  <span key={c} className={`h-8 w-8 rounded-[6px] ${k === i % it.colors!.length ? "ring-2 ring-fg ring-offset-2 ring-offset-bg" : ""}`} style={{ background: c }} />
                ))}
              </div>
            </div>
          )}
          {it.text && <p className="mt-6 text-sm leading-relaxed text-muted">{it.text}</p>}
          <a href="#" className="mt-8 flex w-full items-center justify-center rounded-full bg-fg py-4 text-xs font-semibold uppercase tracking-[0.2em] text-bg transition-opacity hover:opacity-85">
            {cta}
          </a>
        </div>
      </div>
    </section>
  );
}
