"use client";

// LG · Logo layouts, batch 5 (docs/SECTION-MENU.md). All partner and stockist names are invented wordmarks.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { ShimmerButton } from "../fx/more";
import { H, P, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Hands-free cycling: steps an index every `ms` while the section is on screen (stops off screen and in ?static=1). */
function useAutoCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms = 2200) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let t: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (e.isIntersecting) t = setInterval(() => setI((v) => (v + 1) % n), ms);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, [ref, n, ms]);
  return [i, setI] as const;
}

const noop = (e: React.MouseEvent) => e.preventDefault();

const LG_CSS = `
.lg5-sheen{animation:lg5-sheen 1.6s linear infinite}
@keyframes lg5-sheen{from{translate:-110% 0}to{translate:260% 0}}
.lg5-band{animation:lg5-band 2.8s linear infinite}
@keyframes lg5-band{from{translate:-60% 0}to{translate:360% 0}}
html.is-static .lg5-sheen,html.is-static .lg5-band{animation:none;opacity:0}
html.is-static {.lg5-sheen,.lg5-band{animation:none;opacity:0}}
`;

/** Small invented marks for the wordmarks (simple shapes, never a real logo). */
const Mark = ({ k }: { k: number }) => (
  <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    {k % 8 === 0 && <circle cx="12" cy="12" r="8" />}
    {k % 8 === 1 && <path d="M12 4l8 16H4z" />}
    {k % 8 === 2 && <rect x="6" y="6" width="12" height="12" transform="rotate(45 12 12)" />}
    {k % 8 === 3 && <path d="M4 16a8 8 0 0 1 16 0M8 16a4 4 0 0 1 8 0" />}
    {k % 8 === 4 && <path d="M5 5h14v14H5zM5 12h14" />}
    {k % 8 === 5 && <circle cx="12" cy="12" r="8" fill="currentColor" />}
    {k % 8 === 6 && <path d="M4 18L12 6l8 12M8 18l4-6 4 6" />}
    {k % 8 === 7 && <path d="M12 4v16M4 12h16M6.5 6.5l11 11M17.5 6.5l-11 11" />}
  </svg>
);

/* ───────────────────────── LG08 · Partner perks grid ───────────────────────── */

const PERKS = [
  { b: "Kiln & Co", c: "Ceramics", o: "15% off", d: "Every studio piece, all year." },
  { b: "Northfold", c: "Luggage", o: "20% off", d: "Cabin and check-in cases." },
  { b: "Halcyon", c: "Airport lounges", o: "4 passes", d: "Each year, any terminal." },
  { b: "Meridia", c: "Spa", o: "1 free ritual", d: "A 60-minute massage, on us." },
  { b: "Arcwell", c: "Cycles", o: "3 months free", d: "Servicing for any bike." },
  { b: "Solano", c: "Wine bar", o: "A glass on us", d: "Every visit, before 8 pm." },
  { b: "Fennick", c: "Books", o: "10% off", d: "Plus first look at signed copies." },
  { b: "Orbitale", c: "Cinema", o: "2 for 1", d: "Tuesday screenings, any seat." },
];

/** LG08 · A 4-column grid of partner tiles: invented logo, a one-line offer and a small link. One tile at a time takes
 *  the spotlight (it flips to the accent colour with a passing sheen); the join button's border spark never stops. */
function LG08() {
  const r = useRef<HTMLDivElement>(null);
  const [a] = useAutoCycle(r, PERKS.length, 1500);
  return (
    <Sec innerRef={r} theme="stone" font="condensed" className="py-[clamp(72px,9vw,140px)]" style={{ ["--accent" as string]: "var(--sx-accent)" }}>
      <style>{LG_CSS}</style>
      <div className="grid grid-cols-1 items-end gap-[clamp(24px,4vw,64px)] md:grid-cols-12">
        <H className="text-[clamp(48px,6vw,104px)] uppercase md:col-span-7">Membership that pays for itself.</H>
        <div className="md:col-span-5 md:pb-2">
          <P>Members of The Verandah Club get standing offers from eight neighbours we love, on top of the rooms and the pool.</P>
          <div className="mt-7 flex flex-wrap items-center gap-5">
            <ShimmerButton className="text-[15px]">Become a member · ₹9,500 a year</ShimmerButton>
            <span className="text-[14px] text-[var(--sx-muted)]">Perks worth ₹38,000+</span>
          </div>
        </div>
      </div>

      <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 gap-[clamp(10px,1vw,16px)] sm:grid-cols-2 md:grid-cols-4">
        {PERKS.map((p, k) => {
          const on = k === a;
          return (
            <article
              key={p.b}
              className={`relative flex min-h-[clamp(220px,17vw,280px)] flex-col justify-between overflow-hidden rounded-[var(--sx-radius)] border p-[clamp(20px,1.8vw,28px)] transition-colors duration-500 ${on ? "border-[var(--sx-accent)] bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "border-[var(--sx-line)] bg-[var(--sx-surface)]"}`}
            >
              {on && <span className="lg5-sheen pointer-events-none absolute inset-y-0 left-0 w-[45%] bg-[linear-gradient(100deg,transparent,rgba(255,255,255,.28),transparent)]" />}
              <div className="relative flex items-center justify-between gap-3">
                <span className="flex items-center gap-2.5">
                  <Mark k={k} />
                  <span className={`text-[17px] ${k % 2 ? "font-[700] italic" : "font-[650] uppercase tracking-[0.14em]"}`}>{p.b}</span>
                </span>
                <span className={`text-[12px] uppercase tracking-[0.12em] ${on ? "opacity-75" : "text-[var(--sx-muted)]"}`}>{p.c}</span>
              </div>
              <div className="relative">
                <p className="sx-display text-[clamp(34px,3vw,50px)] font-[800] uppercase leading-[0.95]">{p.o}</p>
                <p className={`mt-2 text-[15px] leading-snug ${on ? "opacity-85" : "text-[var(--sx-muted)]"}`}>{p.d}</p>
                <a href="#" onClick={noop} className="mt-4 inline-block border-b border-current pb-0.5 text-[14px] font-[650]">
                  Claim with your card →
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </Sec>
  );
}

/* ───────────────────────── LG09 · Logo grid with hover-reveal CTA ───────────────────────── */

const STOCKISTS = [
  { n: "MAISON VELA", s: "uppercase tracking-[0.3em] font-[600] text-[15px]" },
  { n: "the Linden", s: "italic font-[500] text-[24px]" },
  { n: "Orbitale", s: "font-[800] tracking-[-0.03em] text-[24px]" },
  { n: "KESAR & ROW", s: "uppercase tracking-[0.18em] font-[700] text-[15px]" },
  { n: "Fennick", s: "italic font-[700] text-[25px]" },
  { n: "atelier noor", s: "lowercase tracking-[0.06em] font-[400] text-[22px]" },
  { n: "HALCYON", s: "uppercase tracking-[0.4em] font-[300] text-[16px]" },
  { n: "Solano", s: "font-[650] text-[23px] underline decoration-1 underline-offset-[6px]" },
];

/** LG09 · A centred 4 × 2 grid of stockist wordmarks. On hover (and by itself every couple of seconds) the grid blurs
 *  and dims, and a centred "See the network" link scales in on top. */
function LG09() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  const [s, setS] = useAutoCycle(r, 2, 2100);
  const [hover, setHover] = useState(false);
  const show = hover || s === 1;
  return (
    <Sec innerRef={r} theme="ink" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <style>{LG_CSS}</style>
      <div className="mx-auto max-w-[820px] text-center">
        <H className="text-[clamp(44px,5.6vw,96px)]">On the shelves we admire.</H>
        <P className="mx-auto mt-6 max-w-[46ch]">Our attars and eaux de parfum are poured in Kannauj and stocked by forty independent shops in nine cities.</P>
      </div>

      <div
        className="relative mx-auto mt-[clamp(40px,5vw,72px)] max-w-[1180px] overflow-hidden rounded-[var(--sx-radius)]"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => {
          setHover(false);
          setS(0);
        }}
      >
        <div className={`relative grid grid-cols-2 gap-px bg-[var(--sx-line)] transition-[filter,opacity] duration-700 md:grid-cols-4 ${show ? "opacity-35 blur-[6px]" : ""}`}>
          {STOCKISTS.map((x, k) => (
            <div key={x.n} data-m-card className="grid h-[clamp(130px,11vw,170px)] place-items-center bg-[color-mix(in_srgb,var(--sx-bg)_82%,transparent)] px-4">
              <span className="flex items-center gap-2.5 text-[var(--sx-text)]">
                {k % 3 === 0 && <Mark k={k + 1} />}
                <span className={x.s}>{x.n}</span>
              </span>
            </div>
          ))}
        </div>
        {/* a light band passing over the cells, all the time */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="lg5-band h-full w-[28%] bg-[linear-gradient(100deg,transparent,color-mix(in_srgb,var(--sx-accent)_30%,transparent),transparent)]" />
        </div>
        <div className={`pointer-events-none absolute inset-0 grid place-items-center transition-all duration-700 ${show ? "scale-100 opacity-100" : "scale-[.85] opacity-0"}`}>
          <a href="#" onClick={noop} className={`sx-display flex items-center gap-4 rounded-full border border-[var(--sx-line)] bg-[var(--sx-surface)] px-[clamp(24px,2.6vw,40px)] py-[clamp(14px,1.4vw,20px)] text-[clamp(22px,2.2vw,34px)] shadow-[0_30px_80px_-20px_rgba(0,0,0,.8)] ${show ? "pointer-events-auto" : ""}`}>
            See the network
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--sx-accent)] text-[18px] text-[var(--sx-accent-text)]">→</span>
          </a>
        </div>
      </div>
      <p className="mt-8 text-center text-[14px] text-[var(--sx-muted)]">Mumbai · Delhi · Bengaluru · Jaipur · Goa · Kochi · Pune · Kolkata · Chennai</p>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "LG08", name: "Partner perks grid", motion: "M64", C: LG08 },
  { code: "LG09", name: "Logo grid with hover-reveal CTA", motion: "M34", C: LG09 },
];
