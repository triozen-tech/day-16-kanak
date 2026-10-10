"use client";

// FT · Feature layouts, batch 7 (docs/SECTION-MENU.md): FT27 a sticky scroll-spy tab strip over long stacked service
// panels; the active underline slides to whichever panel is in view (tabs also jump to their panel on click).
// Panels show in full in ?static=1 (first tab underlined).
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { Btn, H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const CSS = `.ft7kb img{animation:ft7kbs 5.2s linear infinite alternate,ft7kbt 3.4s ease-in-out infinite alternate}
@keyframes ft7kbs{from{scale:1.05}to{scale:1.2}}@keyframes ft7kbt{from{translate:-3% 1.5%}to{translate:3% -1.5%}}
.ft7glow{animation:ft7gx 7s linear infinite alternate,ft7gs 4.3s ease-in-out infinite alternate}
@keyframes ft7gx{from{translate:-20% -6%}to{translate:24% 12%}}@keyframes ft7gs{from{scale:.8}to{scale:1.25}}
html.is-static .ft7kb img,html.is-static .ft7glow{animation:none}
html.is-static {.ft7kb img,.ft7glow{animation:none}}`;

const SERVICES = [
  {
    k: "Joinery",
    t: "Bespoke joinery",
    d: "Wardrobes, libraries and kitchen islands drawn to your walls, cut from solid timber in our Mysuru workshop.",
    items: ["Site measure + drawings", "Teak, sheesham or oak", "Hand-cut dovetails", "Natural oil finish"],
    from: "₹38,000",
    time: "6–8 weeks",
    i: 0,
  },
  {
    k: "Upholstery",
    t: "Upholstery, re-sprung",
    d: "Sofas and armchairs stripped to the frame, re-webbed by hand and dressed in linen, wool or leather.",
    items: ["Coil + webbing rebuild", "120 fabric swatches", "Feather-wrap cushions", "Pickup from home"],
    from: "₹14,500",
    time: "3–4 weeks",
    i: 2,
  },
  {
    k: "Restoration",
    t: "Heirloom restoration",
    d: "Your grandmother's planter chair, made sound again: joints re-glued, cane re-woven, scratches kept honest.",
    items: ["Condition report", "Joint + frame repair", "Cane and rattan work", "Shellac French polish"],
    from: "₹9,800",
    time: "2–5 weeks",
    i: 3,
  },
  {
    k: "Styling",
    t: "Room styling",
    d: "One designer, one room, one afternoon. We edit what you own, then fill the gaps from our floor.",
    items: ["Two-hour home visit", "Layout + lighting plan", "Shoppable mood board", "Fee off any order"],
    from: "₹6,000",
    time: "1 visit",
    i: 1,
  },
];

/** FT27 · A sticky tab strip under the nav lists the services; long panels scroll beneath and the underline follows the one in view. */
function FT27() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const panels = useRef<(HTMLElement | null)[]>([]);
  const [act, setAct] = useState(0);
  const [bar, setBar] = useState({ left: 0, width: 0 });

  // scroll-spy: the panel crossing the upper middle of the screen is the active tab
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const sts = panels.current.map((p, k) =>
      p ? ScrollTrigger.create({ trigger: p, start: "top 55%", end: "bottom 55%", onToggle: (s) => s.isActive && setAct(k) }) : null,
    );
    return () => sts.forEach((s) => s?.kill());
  }, []);

  // underline follows the active tab (re-measured on resize)
  useLayoutEffect(() => {
    const measure = () => {
      const t = tabs.current[act];
      if (t) setBar({ left: t.offsetLeft, width: t.offsetWidth });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [act]);

  return (
    <Sec innerRef={r} theme="stone" font="grotesk" className="overflow-clip! py-[clamp(72px,9vw,140px)]">
      <style>{CSS}</style>
      <span aria-hidden className="ft7glow pointer-events-none absolute left-[38%] top-[18%] h-[46%] w-[44%] rounded-full blur-[80px]" style={{ background: "radial-gradient(closest-side, color-mix(in srgb, var(--sx-accent) 42%, transparent), transparent)" }} />
      <div className="relative z-10 grid grid-cols-1 items-end gap-8 md:grid-cols-12">
        <H className="text-[clamp(48px,6vw,100px)] md:col-span-7">Made, mended, placed.</H>
        <P className="max-w-[40ch] md:col-span-5 md:pb-3">Four ways the Teakhouse workshop looks after a home, from the first drawing to the last cushion plumped.</P>
      </div>

      {/* sticky scroll-spy strip */}
      <div className="sticky top-0 z-30 -mx-[clamp(20px,5vw,96px)] mt-[clamp(40px,5vw,72px)] border-y border-[var(--sx-line)] bg-[color-mix(in_srgb,var(--sx-bg)_88%,transparent)] px-[clamp(20px,5vw,96px)] backdrop-blur-md">
        <div className="flex items-center justify-between gap-6">
          <div className="relative flex gap-[clamp(18px,3vw,48px)] overflow-x-auto" role="tablist">
            {SERVICES.map((s, k) => (
              <button
                key={s.k}
                ref={(el) => {
                  tabs.current[k] = el;
                }}
                role="tab"
                aria-selected={k === act}
                onClick={() => panels.current[k]?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className={`shrink-0 py-[clamp(16px,1.6vw,22px)] text-[clamp(15px,1.15vw,18px)] font-[600] transition-colors duration-300 ${k === act ? "text-[var(--sx-text)]" : "text-[var(--sx-muted)]"}`}
              >
                {s.k}
              </button>
            ))}
            <span aria-hidden className="absolute bottom-0 h-[3px] rounded-full bg-[var(--sx-accent)] transition-[left,width] duration-500 ease-[cubic-bezier(.65,0,.35,1)]" style={{ left: bar.left, width: bar.width }} />
          </div>
          <div className="max-md:hidden">
            <Btn kind="link">Book a workshop visit →</Btn>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        {SERVICES.map((s, k) => (
          <article
            key={s.k}
            ref={(el) => {
              panels.current[k] = el;
            }}
            className={`grid scroll-mt-[96px] grid-cols-1 items-center gap-[clamp(28px,4vw,72px)] py-[clamp(48px,6vw,88px)] md:grid-cols-12 ${k ? "border-t border-[var(--sx-line)]" : ""}`}
          >
            <div className={`md:col-span-5 ${k % 2 ? "md:order-2" : ""}`}>
              <h3 data-m-head className="sx-display text-[clamp(32px,3.2vw,52px)] font-[700] leading-[1] tracking-[-0.02em]">{s.t}</h3>
              <P className="mt-5 max-w-[42ch]">{s.d}</P>
              <ul className="mt-7 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                {s.items.map((it) => (
                  <li key={it} className="flex items-center gap-3 text-[15px]">
                    <span aria-hidden className="h-[7px] w-[7px] shrink-0 rounded-full bg-[var(--sx-accent)]" />
                    {it}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-[var(--sx-line)] pt-6">
                <p className="text-[14px] text-[var(--sx-muted)]">
                  From <b className="text-[18px] font-[650] text-[var(--sx-text)]">{s.from}</b>
                </p>
                <p className="text-[14px] text-[var(--sx-muted)]">
                  Lead time <b className="text-[16px] font-[600] text-[var(--sx-text)]">{s.time}</b>
                </p>
                <Btn kind="ghost" className="ml-auto max-md:ml-0">
                  Get a quote
                </Btn>
              </div>
            </div>
            <div className={`md:col-span-7 ${k % 2 ? "md:order-1" : ""}`}>
              <Pic i={s.i} ratio="16/9" className="ft7kb" label={s.k.toUpperCase()} />
            </div>
          </article>
        ))}
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "FT27", name: "Scroll-spy tab strip over long panels", motion: "M23", C: FT27 }];
