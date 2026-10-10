"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { onSiteReady } from "@/lib/loading";
import type { NavProps } from "./types";

/** Classic transparent → solid bar. One of many nav styles — see docs/DESIGN-MENU.md. */
export default function Nav({ logo, links, cta }: NavProps) {
  const ref = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const off = onSiteReady(() => {
      gsap.from(ref.current, { y: -30, opacity: 0, duration: 1, delay: 0.3, ease: "power3.out" });
    });
    return () => {
      off();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const wasOpen = useRef(false);
  useEffect(() => {
    if (open) window.__lenis?.stop();
    else if (wasOpen.current) window.__lenis?.start();
    wasOpen.current = open;
  }, [open]);

  return (
    <>
      <header
        ref={ref}
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ${
          scrolled ? "border-b border-line bg-bg/75 backdrop-blur-md" : "border-b border-transparent"
        }`}
        style={{ color: scrolled ? "var(--text)" : "var(--hero-text)" }}
      >
        <div className={`container-x flex items-center justify-between transition-[height] duration-500 ${scrolled ? "h-16" : "h-24"}`}>
          <a href="#" className="font-display text-2xl tracking-[0.18em]">
            {logo}
          </a>
          <nav className="hidden items-center gap-10 lg:flex">
            {links.map((l) => (
              <a key={l.label} href={l.href} className="link-underline pb-1 text-[11px] uppercase tracking-[0.24em] opacity-80 transition-opacity hover:opacity-100">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-6">
            {cta && (
              <a href={cta.href} className="btn btn-outline hidden !px-5 !py-3 sm:inline-flex">
                {cta.label}
              </a>
            )}
            <button className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <span className="h-px w-6 bg-current" />
              <span className="h-px w-6 bg-current" />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-bg">
          <div className="container-x flex h-24 items-center justify-between">
            <span className="font-display text-2xl tracking-[0.18em]">{logo}</span>
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="text-3xl text-accent">
              ×
            </button>
          </div>
          <nav className="container-x flex flex-1 flex-col justify-center gap-6">
            {links.map((l) => (
              <a key={l.label} href={l.href} onClick={() => setOpen(false)} className="font-display text-5xl">
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
