"use client";

// CT · Call-to-action layouts, batch 5 (docs/SECTION-MENU.md). Invented brands.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { ShimmerButton } from "../fx/more";
import { Btn, H, P, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const ico = (d: ReactNode) => (
  <svg viewBox="0 0 32 32" className="h-[clamp(30px,2.6vw,40px)] w-[clamp(30px,2.6vw,40px)]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {d}
  </svg>
);
const TILES = [
  { t: "Reserve a table", d: "Lunch & dinner, up to 10 guests", i: ico(<><rect x="5" y="7" width="22" height="20" rx="3" /><path d="M5 13h22M11 4v6M21 4v6M11 19h4" /></>) },
  { t: "Call the kitchen", d: "Open 12 pm – 11 pm daily", i: ico(<path d="M8 5h5l2 6-3 2a15 15 0 0 0 7 7l2-3 6 2v5a2 2 0 0 1-2 2A20 20 0 0 1 6 7a2 2 0 0 1 2-2Z" />) },
  { t: "Order online", d: "Delivery within 6 km, 45 min", i: ico(<><path d="M5 9h22l-2 14H7Z" /><path d="M11 13V8a5 5 0 0 1 10 0v5" /></>) },
  { t: "Gift a dinner", d: "Cards from ₹2,000, sent by email", i: ico(<><rect x="5" y="12" width="22" height="15" rx="2" /><path d="M3 12h26M16 12v15M16 12c-3-6-9-6-8-2s8 2 8 2Zm0 0c3-6 9-6 8-2s-8 2-8 2Z" /></>) },
];

/** CT10 · Four action tiles on a band: four equal tiles (reserve, call, order, gift) each with an icon, label and arrow,
 *  on a coloured band. Motion M34: the tiles snap in from different sides; then a highlight walks the row and the
 *  arrows nudge forward on a loop. */
function CT10() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  const [on, setOn] = useState(-1);
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    let t: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (e.isIntersecting) t = setInterval(() => setOn((v) => (v + 1) % TILES.length), 900);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, []);
  return (
    <Sec innerRef={r} theme="paper" font="condensed" className="py-[clamp(56px,7vw,110px)]">
      <style>{`
        @keyframes ct10-nudge { 0%, 100% { transform: translateX(0) } 50% { transform: translateX(18px) } }
        .ct10-arrow { animation: ct10-nudge 0.8s ease-in-out infinite; }
        html.is-static .ct10-arrow { animation: none; }
        html.is-static { .ct10-arrow { animation: none; } }
      `}</style>
      <div className="rounded-[calc(var(--sx-radius,18px)*1.6)] bg-[var(--sx-accent)] px-[clamp(24px,4vw,72px)] py-[clamp(48px,6vw,96px)] text-[var(--sx-accent-text)]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <H className="max-w-[14ch] text-[clamp(52px,6.6vw,112px)] uppercase">Come hungry, leave slowly.</H>
          <p data-m-text className="max-w-[36ch] pb-2 text-[clamp(16px,1.2vw,19px)] leading-relaxed text-[color-mix(in_srgb,var(--sx-accent-text)_82%,transparent)]">
            Kaavi Kitchen cooks coastal Karnataka on a wood fire in Indiranagar. Pick the way you want to eat with us tonight.
          </p>
        </div>
        <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 gap-[clamp(10px,1.2vw,16px)] sm:grid-cols-2 md:grid-cols-4">
          {TILES.map((x, k) => {
            const lit = on === k;
            return (
              <a
                key={x.t}
                href="#"
                onClick={(e) => e.preventDefault()}
                data-m-card
                className={`group flex min-h-[clamp(220px,19vw,290px)] flex-col justify-between rounded-[var(--sx-radius,18px)] border p-[clamp(20px,2vw,30px)] transition-colors duration-500 ${
                  lit ? "border-transparent bg-[var(--sx-accent-text)] text-[var(--sx-accent)]" : "border-[color-mix(in_srgb,var(--sx-accent-text)_30%,transparent)] bg-[color-mix(in_srgb,var(--sx-accent-text)_8%,transparent)] hover:bg-[var(--sx-accent-text)] hover:text-[var(--sx-accent)]"
                }`}
              >
                {x.i}
                <div>
                  <p className="sx-display text-[clamp(28px,2.4vw,40px)] font-[700] uppercase leading-[0.95]">{x.t}</p>
                  <div className="mt-4 flex items-end justify-between gap-4">
                    <p className={`text-[14px] leading-snug ${lit ? "text-[var(--sx-text)]" : "text-[color-mix(in_srgb,var(--sx-accent-text)_78%,transparent)]"}`}>{x.d}</p>
                    <span className="ct10-arrow shrink-0 text-[26px] leading-none" style={{ animationDelay: `${k * 0.1}s` }} aria-hidden>
                      →
                    </span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </Sec>
  );
}

/** Wireframe globe (orthographic, SVG): meridians are half-ellipses whose width follows the rotation, port dots ride
 *  on the surface. Spins with gsap.ticker while on screen; a fixed angle in ?static=1. Draws in a -R..R viewBox. */
const R = 100;
const PORTS = [
  [9.9, 76.3],
  [19, 72.8],
  [25.3, 55.3],
  [51.9, 4.5],
  [1.3, 103.8],
  [35.4, 139.6],
  [40.7, -74],
  [-33.9, 18.4],
];
function useGlobe(svg: React.RefObject<SVGSVGElement | null>, speed = 18) {
  useEffect(() => {
    const s = svg.current;
    if (!s) return;
    const mer = Array.from(s.querySelectorAll<SVGPathElement>("[data-mer]"));
    const dots = Array.from(s.querySelectorAll<SVGCircleElement>("[data-port]"));
    const rad = Math.PI / 180;
    const draw = (deg: number) => {
      mer.forEach((p, i) => {
        const th = (i * 15 + deg) * rad;
        const rx = Math.max(0.4, Math.abs(Math.sin(th)) * R);
        const front = Math.cos(th) > 0;
        p.setAttribute("d", `M0,${-R} A${rx.toFixed(2)},${R} 0 0 ${Math.sin(th) > 0 ? 1 : 0} 0,${R}`);
        p.setAttribute("stroke-opacity", front ? "0.9" : "0.18");
      });
      dots.forEach((c, i) => {
        const [lat, lon] = PORTS[i];
        const l = (lon + deg) * rad;
        const x = R * Math.cos(lat * rad) * Math.sin(l);
        const y = -R * Math.sin(lat * rad);
        c.setAttribute("cx", x.toFixed(2));
        c.setAttribute("cy", y.toFixed(2));
        c.setAttribute("opacity", Math.cos(l) > 0 ? "1" : "0");
      });
    };
    let a = 20;
    draw(a);
    if (prefersReducedMotion()) return;
    let on = false;
    const tick = (_t: number, dt: number) => {
      if (!on) return;
      a = (a + (Math.min(dt, 50) / 1000) * speed) % 360;
      draw(a);
    };
    const io = new IntersectionObserver(([e]) => (on = e.isIntersecting));
    io.observe(s);
    gsap.ticker.add(tick);
    return () => {
      io.disconnect();
      gsap.ticker.remove(tick);
    };
  }, [svg, speed]);
}
function WireGlobe({ className = "" }: { className?: string }) {
  const s = useRef<SVGSVGElement>(null);
  useGlobe(s, 16);
  const lats = [-75, -60, -45, -30, -15, 0, 15, 30, 45, 60, 75];
  return (
    <svg ref={s} viewBox={`${-R - 2} ${-R - 2} ${2 * R + 4} ${2 * R + 4}`} className={className} aria-hidden>
      <defs>
        <radialGradient id="ct11-sphere" cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="var(--sx-accent)" stopOpacity="0.45" />
          <stop offset="0.6" stopColor="var(--sx-accent)" stopOpacity="0.12" />
          <stop offset="1" stopColor="var(--sx-accent)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle r={R} fill="url(#ct11-sphere)" stroke="var(--sx-accent)" strokeOpacity="0.9" strokeWidth="0.8" />
      {lats.map((l) => {
        const y = -R * Math.sin((l * Math.PI) / 180);
        const w = R * Math.cos((l * Math.PI) / 180);
        return <line key={l} x1={-w} x2={w} y1={y} y2={y} stroke="var(--sx-accent)" strokeOpacity={l ? 0.35 : 0.7} strokeWidth="0.5" />;
      })}
      {Array.from({ length: 24 }, (_, i) => (
        <path key={i} data-mer fill="none" stroke="var(--sx-accent)" strokeWidth="0.55" />
      ))}
      {PORTS.map((_, i) => (
        <circle key={i} data-port r="2.6" fill="var(--sx-text)" stroke="var(--sx-accent)" strokeWidth="1.4" />
      ))}
    </svg>
  );
}

/** CT11 · Dark CTA card with cropped corner globe: headline, paragraph and two buttons on the left half; a large
 *  wireframe globe placed off the bottom-right corner so only its upper-left quarter shows inside the card.
 *  Motion M33: the globe spins in the corner forever; the primary button carries a shimmer. */
function CT11() {
  const r = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const once = { trigger: el, start: "top 75%", toggleActions: "play none none reverse" } as const;
      gsap.from(el.querySelector("[data-ct11-globe]"), { rotation: -50, scale: 0.75, opacity: 0, transformOrigin: "50% 50%", duration: 1.6, ease: "power3.out", scrollTrigger: once });
      gsap.from(el.querySelectorAll("[data-m-head], [data-m-text], [data-ct11-cta]"), { y: 28, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, delay: 0.2, scrollTrigger: once });
    }, el);
    return () => ctx.revert();
  }, []);
  return (
    <Sec innerRef={r} theme="stone" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <div
        className="relative overflow-hidden rounded-[calc(var(--sx-radius,18px)*1.8)] px-[clamp(28px,5vw,88px)] py-[clamp(56px,7vw,112px)]"
        style={{ ["--sx-surface" as string]: "#0d1218", ["--sx-text" as string]: "#eef2f7", ["--sx-muted" as string]: "#93a0b1", ["--sx-line" as string]: "rgba(255,255,255,.12)", ["--sx-accent" as string]: "#3fbf8f", ["--sx-accent-text" as string]: "#05070c", background: "linear-gradient(140deg,#0b1016,#121a22 60%,#0d1612)", color: "var(--sx-text)" }}
      >
        {/* globe: centre on the card's bottom-right corner → only the upper-left quarter is inside */}
        <div data-ct11-globe className="pointer-events-none absolute bottom-0 right-0 aspect-square w-[min(84vw,920px)] translate-x-1/2 translate-y-1/2 max-md:opacity-40">
          <WireGlobe className="h-full w-full" />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_0%_0%,rgba(31,95,74,.35),transparent)]" />
        <div className="relative max-w-[min(560px,48%)] max-md:max-w-none">
          <H className="text-[clamp(40px,4.8vw,80px)] text-[var(--sx-text)]">Kerala pepper, at your port in 21 days.</H>
          <P className="mt-6 max-w-[42ch]">Malabar Coast Spice Co. ships graded Tellicherry pepper, cardamom and cloves to buyers in 38 countries, with lab reports for every lot.</P>
          <div data-ct11-cta className="mt-10 flex flex-wrap items-center gap-4" style={{ ["--accent" as string]: "#3fbf8f" }}>
            <ShimmerButton className="text-[16px]">Request a sample crate</ShimmerButton>
            <Btn kind="ghost" className="border-white/25! text-white!">Download price list</Btn>
          </div>
          <div className="mt-12 flex flex-wrap gap-x-10 gap-y-4 border-t border-[var(--sx-line)] pt-7 text-[14px] text-[var(--sx-muted)]">
            <p>
              <b className="block text-[22px] font-[700] text-[var(--sx-text)]">38</b>countries served
            </p>
            <p>
              <b className="block text-[22px] font-[700] text-[var(--sx-text)]">1 t</b>minimum order
            </p>
            <p>
              <b className="block text-[22px] font-[700] text-[var(--sx-text)]">FOB</b>Kochi or Mumbai
            </p>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "CT10", name: "Four action tiles on a band", motion: "M34", C: CT10 },
  { code: "CT11", name: "Dark CTA card with cropped corner globe", motion: "M33", C: CT11 },
];
