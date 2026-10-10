"use client";

// FO · Footer layouts, batch 6 (docs/SECTION-MENU.md): FO14 a photo fills the left two of five columns, contact,
// hours, socials and links on the right; FO15 everything stacked on the centre axis (logo, socials, links, copyright).
// Invented house names; the concept note is kept. No phone numbers (email / chat only).
import { useRef } from "react";
import { scene } from "../fx/shared";
import { Btn, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const CSS = `.fo6kb img{animation:fo6kbs 5.4s linear infinite alternate,fo6kbt 3.3s ease-in-out infinite alternate}
@keyframes fo6kbs{from{scale:1.04}to{scale:1.2}}@keyframes fo6kbt{from{translate:-3% 2%}to{translate:3% -2%}}
.fo6glow{animation:fo6gx 6.2s linear infinite alternate,fo6gs 3.8s ease-in-out infinite alternate}
@keyframes fo6gx{from{translate:-20% -8%}to{translate:20% 10%}}@keyframes fo6gs{from{scale:.82}to{scale:1.22}}
.fo6spin{animation:fo6spin 9s linear infinite}@keyframes fo6spin{to{rotate:360deg}}
.fo6pulse{animation:fo6pulse 1.6s ease-out infinite}@keyframes fo6pulse{from{box-shadow:0 0 0 0 color-mix(in srgb,var(--sx-accent) 70%,transparent)}to{box-shadow:0 0 0 12px transparent}}
html.is-static .fo6kb img,html.is-static .fo6glow,html.is-static .fo6spin,html.is-static .fo6pulse{animation:none}
html.is-static {.fo6kb img,.fo6glow,.fo6spin,.fo6pulse{animation:none}}`;

/** Simple generic social glyphs (not any platform's logo). */
const ICONS = [
  { n: "Photos", d: <><rect x="4" y="4" width="16" height="16" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.8" /></> },
  { n: "Videos", d: <><rect x="3" y="6" width="18" height="12" rx="4" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M10.5 9.5v5l4-2.5z" fill="currentColor" /></> },
  { n: "Journal", d: <><path d="M5 5h14v14H5z" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M8 9h8M8 12h8M8 15h5" stroke="currentColor" strokeWidth="1.6" /></> },
  { n: "Letters", d: <><rect x="3.5" y="6" width="17" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.6" /></> },
];
const Social = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    {ICONS.map((s) => (
      <a key={s.n} href="#" onClick={(e) => e.preventDefault()} aria-label={s.n} data-m-card className="grid h-11 w-11 place-items-center rounded-full border border-[var(--sx-line)] transition-colors hover:border-[var(--sx-accent)] hover:text-[var(--sx-accent)]">
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
          {s.d}
        </svg>
      </a>
    ))}
  </div>
);

/* ───────────────────────────── FO14 · Image-side footer ───────────────────────────── */

const HOURS = [
  ["Mon – Thu", "8 am – 10 pm"],
  ["Fri – Sat", "8 am – 12 am"],
  ["Sunday", "9 am – 9 pm"],
  ["Kitchen", "last order 45 min before close"],
];
const COLS = [
  { t: "Visit", l: ["Menu", "Private dining", "Gift cards", "Events"] },
  { t: "House", l: ["Our story", "Suppliers", "Careers", "Press"] },
];

/** FO14 · Five columns: the left two are one tall photo; the right three hold booking contact, opening hours, socials, two link columns and a legal row. */
function FO14() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  return (
    <Sec innerRef={r} theme="ink" font="serif" full>
      <style>{CSS}</style>
      <footer className="grid grid-cols-1 md:grid-cols-5">
        <div data-m-img className="fo6kb relative min-h-[420px] overflow-hidden md:col-span-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={scene(3, 1000, 1400, "")} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
          <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(0,0,0,.55))]" />
          <p className="absolute bottom-8 left-8 right-8 sx-display text-[clamp(28px,2.6vw,42px)] font-[600] leading-[1.05] text-white">Saffron Table</p>
        </div>

        <div className="relative overflow-hidden px-[clamp(24px,4vw,80px)] py-[clamp(56px,6vw,104px)] md:col-span-3">
          <span aria-hidden className="fo6glow pointer-events-none absolute right-[-10%] top-[-10%] h-[70%] w-[60%] rounded-full blur-[80px]" style={{ background: "radial-gradient(closest-side, color-mix(in srgb, var(--sx-accent) 50%, transparent), transparent)" }} />
          <div className="relative z-10">
            <div className="grid grid-cols-1 gap-[clamp(32px,4vw,64px)] md:grid-cols-2">
              <div>
                <p className="text-[14px] font-[600] uppercase tracking-[0.16em] text-[var(--sx-muted)]">Book a table</p>
                <p data-m-head className="sx-display mt-3 text-[clamp(32px,3vw,48px)] font-[600] leading-[1.05]">Come hungry.</p>
                <a href="#" onClick={(e) => e.preventDefault()} className="mt-3 inline-block text-[17px] text-[var(--sx-accent)] underline-offset-4 hover:underline">tables@saffron.example</a>
                <p data-m-text className="mt-4 max-w-[34ch] text-[16px] leading-relaxed text-[var(--sx-muted)]">
                  Or ask for a call-back and we ring you within the hour. 14 Lake Road, Bandra West.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <Btn>Reserve online</Btn>
                  <span className="flex items-center gap-2 text-[14px] text-[var(--sx-muted)]">
                    <span className="fo6pulse h-2.5 w-2.5 rounded-full bg-[var(--sx-accent)]" /> Open now
                  </span>
                </div>
              </div>
              <div>
                <p className="text-[14px] font-[600] uppercase tracking-[0.16em] text-[var(--sx-muted)]">Hours</p>
                <dl className="mt-3">
                  {HOURS.map(([d, h]) => (
                    <div key={d} className="flex items-baseline justify-between gap-4 border-b border-[var(--sx-line)] py-3">
                      <dt data-m-text className="text-[16px]">{d}</dt>
                      <dd data-m-text className="text-right text-[15px] text-[var(--sx-muted)]">{h}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 gap-[clamp(32px,4vw,64px)] border-t border-[var(--sx-line)] pt-[clamp(32px,4vw,56px)] md:grid-cols-3">
              <div>
                <p className="text-[14px] font-[600] uppercase tracking-[0.16em] text-[var(--sx-muted)]">Follow</p>
                <Social className="mt-4" />
              </div>
              {COLS.map((c) => (
                <div key={c.t}>
                  <p className="text-[14px] font-[600] uppercase tracking-[0.16em] text-[var(--sx-muted)]">{c.t}</p>
                  <ul className="mt-4 space-y-3">
                    {c.l.map((l) => (
                      <li key={l}>
                        <a data-m-text href="#" onClick={(e) => e.preventDefault()} className="text-[17px] transition-colors hover:text-[var(--sx-accent)]">
                          {l}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-[clamp(40px,5vw,72px)] flex flex-wrap items-center justify-between gap-4 border-t border-[var(--sx-line)] pt-6 text-[13px] text-[var(--sx-muted)]">
              <span>© 2026 Saffron Table · Concept website by Showreel Studio</span>
              <span className="flex gap-6">
                <a href="#" onClick={(e) => e.preventDefault()}>Privacy</a>
                <a href="#" onClick={(e) => e.preventDefault()}>Allergens</a>
                <a href="#" onClick={(e) => e.preventDefault()}>Accessibility</a>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </Sec>
  );
}

/* ───────────────────────────── FO15 · Centred stacked footer ───────────────────────────── */

const LINKS = ["Fragrances", "Discovery set", "Refills", "Our perfumer", "Boutiques", "Journal", "Care"];

/** FO15 · Everything on the centre axis: wordmark, a row of social icons, a row of text links, then copyright. */
function FO15() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M6");
  return (
    <Sec innerRef={r} theme="paper" font="wide" className="py-[clamp(72px,9vw,140px)]">
      <style>{CSS}</style>
      <span aria-hidden className="fo6glow pointer-events-none absolute left-[22%] top-[0%] h-[90%] w-[56%] rounded-full blur-[90px]" style={{ background: "radial-gradient(closest-side, color-mix(in srgb, var(--sx-accent) 45%, transparent), transparent)" }} />
      <footer className="relative z-10 flex flex-col items-center text-center">
        <div className="relative grid place-items-center">
          <span aria-hidden className="fo6spin absolute h-[clamp(220px,22vw,340px)] w-[clamp(220px,22vw,340px)] rounded-full opacity-70 blur-[2px]" style={{ background: "conic-gradient(from 0deg, transparent, color-mix(in srgb, var(--sx-accent) 55%, transparent), transparent 40%, color-mix(in srgb, var(--sx-accent) 30%, transparent), transparent 75%)", mask: "radial-gradient(closest-side, transparent 78%, #000 80%, #000 100%)", WebkitMask: "radial-gradient(closest-side, transparent 78%, #000 80%, #000 100%)" }} />
          <p data-m-head className="sx-display relative text-[clamp(48px,6vw,96px)] font-[700] uppercase leading-none tracking-[0.06em]">
            Maison Oru
          </p>
        </div>
        <p data-m-text className="mt-6 max-w-[40ch] text-[16px] leading-relaxed text-[var(--sx-muted)]">
          Small-batch eaux de parfum, blended in Pondicherry. From ₹4,200 for 50 ml.
        </p>
        <Social className="mt-10" />
        <nav className="mt-10 flex flex-wrap justify-center gap-x-[clamp(20px,2.6vw,40px)] gap-y-3 text-[16px]">
          {LINKS.map((l) => (
            <a key={l} href="#" onClick={(e) => e.preventDefault()} className="transition-colors hover:text-[var(--sx-accent)]">
              {l}
            </a>
          ))}
        </nav>
        <p className="mt-12 border-t border-[var(--sx-line)] px-10 pt-6 text-[13px] text-[var(--sx-muted)]">© 2026 Maison Oru · Concept website by Showreel Studio · hello@oru.example</p>
      </footer>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "FO14", name: "Image-side footer", motion: "M23", C: FO14 },
  { code: "FO15", name: "Centred stacked footer", motion: "M6", C: FO15 },
];
