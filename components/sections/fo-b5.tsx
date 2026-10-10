"use client";

// FO · Footer layouts, batch 5 (docs/SECTION-MENU.md). Invented house name; concept note kept.
import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { FlickeringGrid } from "../fx/more";
import { Odometer } from "../fx/text";
import { Btn, Sec } from "./kit";
import type { SectionDef } from "./types";

const R = 100;
/** Small wireframe globe: meridians are half-ellipses that widen and narrow as it turns (gsap.ticker, on screen only). */
function SpinGlobe({ className = "" }: { className?: string }) {
  const s = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = s.current;
    if (!svg) return;
    const mer = Array.from(svg.querySelectorAll<SVGPathElement>("[data-mer]"));
    const rad = Math.PI / 180;
    const draw = (deg: number) =>
      mer.forEach((p, i) => {
        const th = (i * 20 + deg) * rad;
        const rx = Math.max(0.4, Math.abs(Math.sin(th)) * R);
        p.setAttribute("d", `M0,${-R} A${rx.toFixed(2)},${R} 0 0 ${Math.sin(th) > 0 ? 1 : 0} 0,${R}`);
        p.setAttribute("stroke-opacity", Math.cos(th) > 0 ? "0.95" : "0.2");
      });
    let a = 10;
    draw(a);
    if (prefersReducedMotion()) return;
    let on = false;
    const tick = (_t: number, dt: number) => {
      if (!on) return;
      a = (a + (Math.min(dt, 50) / 1000) * 30) % 360;
      draw(a);
    };
    const io = new IntersectionObserver(([e]) => (on = e.isIntersecting));
    io.observe(svg);
    gsap.ticker.add(tick);
    return () => {
      io.disconnect();
      gsap.ticker.remove(tick);
    };
  }, []);
  return (
    <svg ref={s} viewBox={`${-R - 2} ${-R - 2} ${2 * R + 4} ${2 * R + 4}`} className={className} aria-hidden>
      <circle r={R} fill="var(--sx-bg)" fillOpacity="0.55" stroke="var(--sx-text)" strokeOpacity="0.9" strokeWidth="0.9" />
      {[-60, -30, 0, 30, 60].map((l) => {
        const y = -R * Math.sin((l * Math.PI) / 180);
        const w = R * Math.cos((l * Math.PI) / 180);
        return <line key={l} x1={-w} x2={w} y1={y} y2={y} stroke="var(--sx-text)" strokeOpacity={l ? 0.35 : 0.75} strokeWidth="0.6" />;
      })}
      {Array.from({ length: 18 }, (_, i) => (
        <path key={i} data-mer fill="none" stroke="var(--sx-accent)" strokeWidth="0.8" />
      ))}
    </svg>
  );
}

const INDEX = ["Speakers", "Headphones", "Turntables", "Listening rooms", "Journal"];
const LINKS = [
  { t: "Shop", l: ["Ondu One · ₹42,000", "Ondu Pair · ₹68,500", "Field headphones", "Gift cards"] },
  { t: "Support", l: ["Set-up guides", "Warranty", "Repairs", "Shipping"] },
  { t: "Studio", l: ["Our workshop", "Careers", "Press kit", "Dealers"] },
  { t: "Follow", l: ["Instagram", "YouTube", "Newsletter", "Podcast"] },
];

/** FO13 · Hairline grid footer with ticket card: a ruled grid — section index top-left, CTA top-right, a spinning
 *  wireframe globe in the centre cell, link columns in the cells below, and a ticket-shaped card at the bottom with a
 *  status and a rolling number. Motion M60: the cells flicker on, a flickering dot field lives behind the globe, the
 *  ticket number rolls on an odometer. */
function FO13() {
  const r = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const cells = gsap.utils.shuffle(Array.from(el.querySelectorAll<HTMLElement>("[data-fo13-cell]")));
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 80%", toggleActions: "play none none reverse" } });
      cells.forEach((c, i) => {
        tl.fromTo(c, { opacity: 0 }, { keyframes: [{ opacity: 0.7, duration: 0.05 }, { opacity: 0.1, duration: 0.06 }, { opacity: 0.9, duration: 0.05 }, { opacity: 0.3, duration: 0.05 }, { opacity: 1, duration: 0.1 }] }, i * 0.07);
      });
    }, el);
    return () => ctx.revert();
  }, []);
  const cell = "bg-[var(--sx-bg)] p-[clamp(20px,2.2vw,36px)]";
  const head = "text-[13px] font-[600] uppercase tracking-[0.16em] text-[var(--sx-muted)]";
  return (
    <Sec innerRef={r} theme="ink" font="condensed" className="pt-[clamp(72px,9vw,140px)] pb-10">
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[var(--sx-radius,18px)] border border-[var(--sx-line)] bg-[var(--sx-line)] md:grid-cols-12">
        {/* top-left: section index */}
        <div data-fo13-cell className={`${cell} md:col-span-4`}>
          <p className={head}>Index</p>
          <ol className="mt-5 space-y-1">
            {INDEX.map((x, k) => (
              <li key={x}>
                <a href="#" onClick={(e) => e.preventDefault()} className="group flex items-baseline gap-4 py-1 transition-colors hover:text-[var(--sx-accent)]">
                  <span className="w-7 text-[13px] tabular-nums text-[var(--sx-muted)]">{String(k + 1).padStart(2, "0")}</span>
                  <span className="sx-display text-[clamp(24px,2.2vw,36px)] font-[700] uppercase leading-[1.05]">{x}</span>
                </a>
              </li>
            ))}
          </ol>
        </div>

        {/* centre: globe on a flickering field (spans two rows) */}
        <div data-fo13-cell className="relative grid min-h-[360px] place-items-center overflow-hidden bg-[var(--sx-bg)] md:col-span-4 md:row-span-2">
          <FlickeringGrid className="absolute inset-0" color="79,141,255" size={4} gap={6} chance={0.5} maxOpacity={0.55} />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(closest-side,var(--sx-bg)_55%,transparent)]" />
          <div className="relative flex flex-col items-center gap-5 py-8">
            <SpinGlobe className="h-[clamp(200px,19vw,300px)] w-[clamp(200px,19vw,300px)]" />
            <p className="text-[13px] uppercase tracking-[0.2em] text-[var(--sx-muted)]">Shipping to 31 countries</p>
          </div>
        </div>

        {/* top-right: CTA */}
        <div data-fo13-cell className={`${cell} flex flex-col justify-between md:col-span-4`}>
          <p className={head}>Hear it first</p>
          <div className="mt-6">
            <p className="sx-display text-[clamp(32px,3vw,52px)] font-[800] uppercase leading-[0.95]">Book a listening room.</p>
            <p className="mt-3 max-w-[34ch] text-[15px] leading-relaxed text-[var(--sx-muted)]">Forty minutes, your own records, our speakers. Bengaluru and Pune.</p>
            <div className="mt-6">
              <Btn>Reserve a slot</Btn>
            </div>
          </div>
        </div>

        {/* link columns: two cells left, two right */}
        {LINKS.map((c) => (
          <div key={c.t} data-fo13-cell className={`${cell} md:col-span-2`}>
            <p className={head}>{c.t}</p>
            <ul className="mt-4 space-y-2.5">
              {c.l.map((x) => (
                <li key={x}>
                  <a href="#" onClick={(e) => e.preventDefault()} className="text-[15px] transition-colors hover:text-[var(--sx-accent)]">
                    {x}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* ticket row */}
        <div data-fo13-cell className={`${cell} flex flex-wrap items-center justify-between gap-8 md:col-span-12`}>
          <div>
            <p className="sx-display text-[clamp(56px,7.4vw,120px)] font-[800] uppercase leading-[0.8] tracking-[-0.01em]">Ondu Audio</p>
            <p className="mt-4 text-[14px] text-[var(--sx-muted)]">Hand-built loudspeakers from a workshop in Mysuru, since 2014.</p>
          </div>
          <div
            className="flex w-full max-w-[520px] items-stretch rounded-[16px] bg-[var(--sx-surface)] text-[var(--sx-text)]"
            style={{
              WebkitMask: "radial-gradient(circle 14px at 70% 0, #0000 98%, #000) top / 100% 51% no-repeat, radial-gradient(circle 14px at 70% 100%, #0000 98%, #000) bottom / 100% 51% no-repeat",
              mask: "radial-gradient(circle 14px at 70% 0, #0000 98%, #000) top / 100% 51% no-repeat, radial-gradient(circle 14px at 70% 100%, #0000 98%, #000) bottom / 100% 51% no-repeat",
            }}
          >
            <div className="flex-[7] border-r-2 border-dashed border-[var(--sx-line)] p-6">
              <p className="text-[12px] uppercase tracking-[0.18em] text-[var(--sx-muted)]">Listening session · Sat 14 Nov</p>
              <p className="mt-3 flex items-center gap-2 text-[15px] font-[650]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#38d39f] shadow-[0_0_0_4px_rgba(56,211,159,.2)]" />
                Seats open · 6 left
              </p>
              <p className="mt-2 text-[14px] text-[var(--sx-muted)]">Indiranagar room · 7:30 pm · ₹500, redeemable</p>
            </div>
            <div className="flex flex-[3] flex-col justify-center p-6">
              <p className="text-[12px] uppercase tracking-[0.18em] text-[var(--sx-muted)]">Ticket</p>
              <p className="sx-display mt-1 text-[clamp(30px,2.6vw,42px)] font-[800] leading-none text-[var(--sx-accent)]">
                <Odometer value="0471" prefix="№" />
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 text-[13px] text-[var(--sx-muted)]">
        <p>© 2026 Ondu Audio · Concept website by Showreel Studio</p>
        <div className="flex flex-wrap gap-6">
          {["Privacy", "Terms", "Returns", "Contact"].map((x) => (
            <a key={x} href="#" onClick={(e) => e.preventDefault()} className="transition-colors hover:text-[var(--sx-text)]">
              {x}
            </a>
          ))}
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "FO13", name: "Hairline grid footer with ticket card", motion: "M60", C: FO13 }];
