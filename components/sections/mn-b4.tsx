"use client";

// MN · Menu / service layouts (docs/SECTION-MENU.md), batch 4. The highlight steps through the rows by itself while
// on screen (hover takes over); loops stop in ?static=1.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Hands-free cycling: steps an index every `ms` while the section is on screen (stops off screen and in ?static=1). */
function useAutoCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms = 1600) {
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

const MN_CSS = `.mn4-sheen{background:linear-gradient(90deg,color-mix(in srgb,var(--sx-accent) 7%,transparent) 0%,color-mix(in srgb,var(--sx-accent) 20%,transparent) 50%,color-mix(in srgb,var(--sx-accent) 7%,transparent) 100%) 0 0/200% 100%;animation:mn4-sheen 2.2s linear infinite}@keyframes mn4-sheen{from{background-position:200% 0}to{background-position:0 0}}
.is-static .mn4-sheen{animation:none}
html.is-static {.mn4-sheen{animation:none}}`;

const SERVICES = [
  { t: "Cut & finish", d: ["Consultation", "Precision cut", "Blow-dry"], p: "₹1,800" },
  { t: "Colour & gloss", d: ["Root-to-tip colour", "Bond repair", "Gloss"], p: "₹4,200" },
  { t: "Balayage", d: ["Hand-painted lights", "Toner", "Treatment"], p: "₹7,500" },
  { t: "Scalp ritual", d: ["Warm steam", "Pressure massage", "Bhringraj oil"], p: "₹2,400" },
  { t: "Glow facial", d: ["Double cleanse", "Enzyme peel", "LED"], p: "₹3,600" },
  { t: "Bridal trial", d: ["Hair + make-up", "Two looks", "Photos"], p: "₹9,000" },
];

/** MN05 · Numbered service list with from-prices: six full-width rows (big number, service, deliverables, "from"
 *  price, arrow) split by hairlines; the active row lights up with a moving tint and its arrow turns. */
function MN05() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const [i, setI] = useAutoCycle(r, SERVICES.length, 1400);
  return (
    <Sec innerRef={r} theme="paper" font="editorial" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#9a4a3a" }}>
      <style>{MN_CSS}</style>
      <div className="grid grid-cols-1 items-end gap-8 md:grid-cols-12">
        <H className="text-[clamp(52px,6.6vw,112px)] md:col-span-7">The studio menu.</H>
        <div className="md:col-span-5 md:pb-3">
          <P className="max-w-[40ch]">Six services, priced from the chair up. Every visit starts with ten unhurried minutes of talking before any scissors come out.</P>
          <div className="mt-6">
            <Btn>Book a chair</Btn>
          </div>
        </div>
      </div>
      <ul className="mt-[clamp(44px,6vw,88px)] border-t border-[var(--sx-line)]">
        {SERVICES.map((s, k) => {
          const on = k === i;
          return (
            <li key={s.t} data-m-card onMouseEnter={() => setI(k)} className="relative border-b border-[var(--sx-line)]">
              <div className={`absolute inset-0 origin-left transition-[opacity,transform] duration-500 ease-out ${on ? "mn4-sheen scale-x-100 opacity-100" : "scale-x-0 opacity-0"}`} />
              <a href="#" onClick={(e) => e.preventDefault()} className="relative grid grid-cols-1 items-center gap-x-[clamp(16px,2.4vw,40px)] gap-y-2 px-[clamp(8px,1.4vw,24px)] py-[clamp(18px,2vw,30px)] md:grid-cols-[clamp(80px,9vw,140px)_minmax(0,1.1fr)_minmax(0,1.5fr)_auto_56px]">
                <span className={`sx-display text-[clamp(40px,4.6vw,76px)] leading-none tabular-nums transition-colors duration-500 ${on ? "text-[var(--sx-accent)]" : "text-[color-mix(in_srgb,var(--sx-text)_28%,transparent)]"}`}>{String(k + 1).padStart(2, "0")}</span>
                <span className="sx-display text-[clamp(26px,2.5vw,40px)] leading-[1.05]">{s.t}</span>
                <span className="flex flex-wrap gap-x-3 gap-y-1 text-[15px] text-[var(--sx-muted)]">
                  {s.d.map((x, j) => (
                    <span key={x} className="whitespace-nowrap">
                      {j > 0 && <span className="mr-3 text-[var(--sx-line)]">/</span>}
                      {x}
                    </span>
                  ))}
                </span>
                <span className="whitespace-nowrap text-right max-md:text-left">
                  <span className="mr-2 text-[13px] uppercase tracking-[0.14em] text-[var(--sx-muted)]">from</span>
                  <b className="text-[clamp(18px,1.5vw,24px)] font-[650] tabular-nums">{s.p}</b>
                </span>
                <span className={`grid h-12 w-12 place-items-center justify-self-end rounded-full border text-[20px] transition-all duration-500 max-md:hidden ${on ? "-rotate-45 border-[var(--sx-accent)] bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "border-[var(--sx-line)]"}`}>→</span>
              </a>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-[14px] text-[var(--sx-muted)]">Prices vary with length and density. Patch test 48 hours before any colour.</p>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "MN05", name: "Numbered service list with from-prices", motion: "M23", C: MN05 }];
