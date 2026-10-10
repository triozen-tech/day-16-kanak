"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

/**
 * Colour-switcher hero: each product variant has its own colour. Switching (auto every few
 * seconds, or by clicking the pills) cross-fades the glow, the giant word behind the product,
 * the highlighted headline word and the product image.
 * Reference: Spectra bikes (Ridge / Vortex / Spectra), Creamsy flavours, Fruitivo perfumes.
 * Use cut-out product images (transparent PNG/WebP) for the best result.
 */
export type Variant = {
  name: string; // "Vortex"
  color: string; // "#22c55e"
  image: string;
  /** colour of text on top of `color` buttons (default white) */
  onColor?: string;
};

export default function VariantHero({
  id,
  eyebrow,
  lead,
  text,
  variants,
  features = [],
  specs = [],
  cta = "Pre-order now",
  interval = 3800,
  base = "#0a0a0a",
}: {
  id?: string;
  eyebrow?: string;
  /** first headline line, e.g. "Ride the" — the second line is the variant name in its colour */
  lead: string;
  text?: string;
  variants: Variant[];
  features?: { title: string; text: string }[];
  specs?: { value: string; label: string }[];
  cta?: string;
  /** ms between auto switches (0 = off) */
  interval?: number;
  /** section background under the glow */
  base?: string;
}) {
  const [i, setI] = useState(0);
  const paused = useRef(false);
  const img = useRef<HTMLDivElement>(null);
  const v = variants[i];

  useEffect(() => {
    if (!interval || variants.length < 2) return;
    const t = setInterval(() => !paused.current && setI((n) => (n + 1) % variants.length), interval);
    return () => clearInterval(t);
  }, [interval, variants.length]);

  useEffect(() => {
    if (prefersReducedMotion() || !img.current) return;
    gsap.fromTo(img.current, { x: 60, opacity: 0, rotate: 2 }, { x: 0, opacity: 1, rotate: 0, duration: 0.9, ease: "power3.out" });
  }, [i]);

  return (
    <section
      id={id}
      className="relative flex min-h-screen items-center overflow-hidden text-white"
      style={{ background: base }}
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
    >
      {variants.map((x, k) => (
        <div
          key={x.name}
          aria-hidden
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: k === i ? 1 : 0, background: `radial-gradient(60% 55% at 50% 45%, ${x.color}66, transparent 70%)` }}
        />
      ))}
      <p
        aria-hidden
        className="font-display pointer-events-none absolute inset-x-0 top-[16%] hidden select-none md:block text-center text-[clamp(90px,17vw,300px)] leading-none opacity-[0.14] transition-colors duration-700"
        style={{ color: v.color }}
      >
        {v.name}
      </p>

      <div className="container-x relative z-10 grid w-full items-center gap-10 pt-24 lg:grid-cols-[1fr_1.3fr_0.9fr]">
        <div>
          {eyebrow && (
            <p className="mb-5 inline-block rounded-full border border-white/20 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-white/70">{eyebrow}</p>
          )}
          <h1 className="font-display text-[clamp(44px,5vw,88px)]">
            {lead}
            <br />
            <span className="transition-colors duration-700" style={{ color: v.color }}>
              {v.name}
            </span>
          </h1>
          {text && <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/70">{text.replace("{name}", v.name)}</p>}
          <div className="mt-8 flex items-center gap-3">
            <a href="#" className="rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] transition-colors duration-700" style={{ background: v.color, color: v.onColor ?? "#fff" }}>
              {cta} →
            </a>
          </div>
          <div className="mt-10 flex gap-2">
            {variants.map((x, k) => (
              <button
                key={x.name}
                onClick={() => setI(k)}
                aria-label={x.name}
                className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] transition-all duration-500"
                style={{ borderColor: k === i ? x.color : "rgba(255,255,255,.15)", background: k === i ? `${x.color}22` : "transparent" }}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: x.color }} />
                {x.name}
              </button>
            ))}
          </div>
        </div>

        <div className="relative flex h-[min(60vh,560px)] items-center justify-center">
          <div ref={img} key={v.name} className="h-full w-full">
            <img src={v.image} alt={v.name} className="h-full w-full object-contain drop-shadow-[0_40px_40px_rgba(0,0,0,.6)]" />
          </div>
        </div>

        {features.length > 0 && (
          <ul className="hidden space-y-6 lg:block">
            {features.map((f) => (
              <li key={f.title} className="flex gap-4">
                <span className="mt-1 h-7 w-7 shrink-0 rounded-full border transition-colors duration-700" style={{ borderColor: v.color, background: `${v.color}22` }} />
                <div>
                  <p className="text-sm font-semibold">{f.title}</p>
                  <p className="mt-0.5 text-xs text-white/60">{f.text}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {specs.length > 0 && (
        <div className="absolute inset-x-0 bottom-8 z-10 hidden justify-center md:flex">
          <div className="flex gap-10 rounded-full border border-white/10 bg-white/5 px-10 py-4 backdrop-blur-md">
            {specs.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-sm font-semibold">{s.value}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
