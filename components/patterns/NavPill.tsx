"use client";

import { useEffect, useState } from "react";
import type { NavProps } from "./types";

/**
 * Floating pill nav in the centre, logo left, icons right (Creamsy / Fruitivo style).
 * The active link gets a solid pill. Alternative to Nav.tsx.
 */
export default function NavPill({ logo, links, cta }: NavProps) {
  const [active, setActive] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className="fixed inset-x-0 top-4 z-50">
      <div className="container-x flex items-center justify-between">
        <a href="#" className="font-display text-2xl" style={{ color: scrolled ? "var(--text)" : "var(--hero-text)" }}>
          {logo}
        </a>
        <nav className={`hidden items-center gap-1 rounded-full border p-1 backdrop-blur-md transition-colors duration-500 md:flex ${scrolled ? "border-line bg-bg/80" : "border-white/20 bg-white/10"}`}>
          {links.map((l, i) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setActive(i)}
              className={`rounded-full px-5 py-2 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors duration-300 ${
                i === active ? "bg-accent text-accent-fg" : scrolled ? "text-fg/70 hover:text-fg" : "text-white/80 hover:text-white"
              }`}
            >
              {l.label}
            </a>
          ))}
        </nav>
        {cta ? (
          <a href={cta.href} className="rounded-full bg-accent px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-fg">
            {cta.label}
          </a>
        ) : (
          <span />
        )}
      </div>
    </header>
  );
}
