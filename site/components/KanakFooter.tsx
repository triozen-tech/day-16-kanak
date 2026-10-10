"use client";
// FO01 restyled (ours): a giant cropped KANAK in a gold outline + 3 link columns + the concept note.
// M269 gradient stroke name draw: when the footer comes into view the outline writes itself (on the clock, lesson 77)
// while its gold gradient keeps sliding, so the reel's last seconds are never still. X40: the footer is fixed under the
// page inside a clipped slot, so the reviews sheet lifts off it like a cover. ?static=1: drawn, still.
import { useEffect, useRef } from "react";
import { footer } from "../content";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

export default function KanakFooter() {
  const text = useRef<SVGTextElement>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion() || !text.current) return;
    const t = text.current;
    gsap.set(t, { strokeDasharray: 2600, strokeDashoffset: 2600 });
    const st = ScrollTrigger.create({
      trigger: root.current,
      start: "top bottom",
      once: true,
      onEnter: () =>
        gsap.to(t, {
          strokeDashoffset: 0,
          duration: 1.6,
          ease: "power2.inOut",
        }),
    });
    return () => st.kill();
  }, []);

  return (
    <div
      ref={root}
      className="relative h-[900px]"
      style={{ clipPath: "inset(0 0 0 0)" }}
      data-footer-slot
    >
      <footer
        className="fixed inset-x-0 bottom-0 h-[900px] overflow-hidden bg-[var(--ivory)] px-16 pt-[190px]"
        data-section="footer"
      >
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-10 text-[15px]">
          <div>
            <div className="kj-eyebrow">Book a viewing</div>
            <div className="kj-display mt-3 text-[40px] leading-tight">
              {footer.invite}
            </div>
            <a className="kj-btn mt-6" href="#piece">
              Book a viewing
            </a>
          </div>
          {footer.cols.map(([h, items]) => (
            <div key={h}>
              <div className="kj-eyebrow mb-3">{h}</div>
              {items.map((x) => (
                <div key={x} className="py-0.5">
                  <a className="kj-link" href="#collections">
                    {x}
                  </a>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div
          className="kj-band"
          style={{
            ["--band" as string]: "rgba(214, 168, 88, 0.32)",
            ["--band-blend" as string]: "multiply",
            ["--band-dur" as string]: "3.2s",
          }}
          aria-hidden
        />
        <div className="absolute left-16 top-[430px] z-10 text-[13px] text-[var(--muted)]">
          {footer.note}
        </div>
        <svg
          viewBox="0 0 1440 300"
          className="absolute bottom-[-40px] left-0 w-full"
          aria-label="Kanak"
          data-footer-word
        >
          <defs>
            <linearGradient id="kj-foot" x1="0" x2="0.5" spreadMethod="reflect">
              <stop offset="0" stopColor="#a87a2a" />
              <stop offset="0.5" stopColor="#f0d48a" />
              <stop offset="1" stopColor="#a87a2a" />
              <animateTransform
                attributeName="gradientTransform"
                type="translate"
                from="0 0"
                to="1 0"
                dur="3.2s"
                repeatCount="indefinite"
              />
            </linearGradient>
          </defs>
          <text
            ref={text}
            x="720"
            y="275"
            textAnchor="middle"
            fontFamily="Italiana, serif"
            fontSize="330"
            letterSpacing="40"
            fill="none"
            stroke="url(#kj-foot)"
            strokeWidth="1.8"
          >
            KANAK
          </text>
        </svg>
      </footer>
    </div>
  );
}
