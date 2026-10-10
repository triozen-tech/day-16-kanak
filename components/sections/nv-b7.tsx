"use client";

// NV · Navigation layouts, batch 7 (docs/SECTION-MENU.md). Each is shown as a full designed section in a live state
// (the menu plays by itself), so the gallery shows the whole idea; on a site the nav is fixed and driven by the user.
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Pic, Price, Product, Sec } from "./kit";
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

/** Scoped keyframes (off in ?static=1 and with reduced motion). The two glows are the CSS-only never-frozen safety net. */
const NV_CSS = `
.nvb7-glow{animation:nvb7-glow 4.8s linear infinite alternate}
@keyframes nvb7-glow{from{transform:translate(-18%,-10%) scale(.9)}to{transform:translate(22%,14%) scale(1.2)}}
.nvb7-glow2{animation:nvb7-glow2 3.3s linear infinite alternate}
@keyframes nvb7-glow2{from{transform:translate(16%,10%) scale(1.1)}to{transform:translate(-20%,-8%) scale(.85)}}
.nvb7-bump{animation:nvb7-bump .5s cubic-bezier(.2,.8,.2,1)}
@keyframes nvb7-bump{0%{transform:scale(1)}40%{transform:scale(1.35)}100%{transform:scale(1)}}
html.is-static .nvb7-glow,html.is-static .nvb7-glow2,html.is-static .nvb7-bump{animation:none}
html.is-static {.nvb7-glow,.nvb7-glow2,.nvb7-bump{animation:none}}
`;

const Glow = ({ className = "", alt = false }: { className?: string; alt?: boolean }) => (
  <div
    aria-hidden
    className={`${alt ? "nvb7-glow2" : "nvb7-glow"} pointer-events-none absolute aspect-square rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_40%,transparent),transparent)] ${className}`}
  />
);

/* ───────────────────────── NV27 · Radial corner menu ───────────────────────── */

const NV27_ITEMS = [
  { t: "Shop", c: "#f2c14e", icon: "M4 7h16l-1.5 11h-13zM9 7a3 3 0 0 1 6 0" },
  { t: "Flavours", c: "#ef6f4c", icon: "M12 3c4 4 6 7 6 10a6 6 0 0 1-12 0c0-3 2-6 6-10z" },
  { t: "Packs", c: "#7bc67e", icon: "M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8" },
  { t: "Stores", c: "#5aa9e6", icon: "M12 21s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4" },
  { t: "Games", c: "#b48ef0", icon: "M6 9h12a3 3 0 0 1 3 3v2a3 3 0 0 1-5 2l-1-1H9l-1 1a3 3 0 0 1-5-2v-2a3 3 0 0 1 3-3zM8 11v3M6.5 12.5h3" },
  { t: "Bag", c: "#f08cb0", icon: "M6 8h12v12H6zM9 8V6a3 3 0 0 1 6 0v2" },
];

/** NV27 · A round button sits in the corner of the page; tapping it fans the menu items out around it in a full circle,
 *  and the open ring slowly orbits (items stay upright). It opens and closes by itself while on screen. */
function NV27() {
  const r = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(true);
  const [tick, setTick] = useAutoCycle(r, 1000, 2600);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setOpen((o) => !o);
  }, [tick]);
  // M33 · the ring orbits; each item counter-rotates so the icons stay upright
  useEffect(() => {
    const el = ring.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.to(el, { rotation: 360, duration: 26, ease: "none", repeat: -1 });
      gsap.to(el.querySelectorAll("[data-upright]"), { rotation: -360, duration: 26, ease: "none", repeat: -1 });
    }, el);
    return () => ctx.revert();
  }, []);
  const R = 118;
  return (
    <Sec innerRef={r} theme="ink" font="wide" className="py-[clamp(72px,9vw,140px)]">
      <style>{NV_CSS}</style>
      <div className="relative z-10 grid grid-cols-1 items-center gap-[clamp(32px,5vw,80px)] md:grid-cols-12">
        <div className="md:col-span-5">
          <H className="text-[clamp(40px,4.6vw,76px)]">Snacks, one tap away.</H>
          <P className="mt-6 max-w-[38ch]">A single round button lives in the corner. Press it and the whole menu blooms around your thumb, then folds away again.</P>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <button type="button" onClick={() => setTick((v) => v + 1)} className="sx-btn sx-btn-solid">
              Try the menu
            </button>
            <span className="text-[15px] text-[var(--sx-muted)]">
              Party box from <Price now="₹349" className="text-[var(--sx-text)]" />
            </span>
          </div>
        </div>

        {/* the page stage the menu lives on (clipped, so the ring never reaches the copy) */}
        <div className="relative min-h-[clamp(460px,40vw,600px)] overflow-hidden rounded-[var(--sx-radius)] border border-[var(--sx-line)] bg-[var(--sx-surface)] md:col-span-7">
          <Glow className="left-[-10%] top-[-20%] w-[80%]" />
          <Glow alt className="bottom-[-30%] right-[10%] w-[60%]" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-7 py-5">
            <span className="sx-display text-[20px] font-[800] tracking-[-0.02em]">crnch.</span>
            <span className="text-[13px] text-[var(--sx-muted)]">Masala corn · Peri peri · Jaggery</span>
          </div>
          <div className="absolute left-[clamp(24px,4vw,56px)] top-1/2 flex -translate-y-1/2 items-center gap-[clamp(12px,2vw,28px)]">
            <Product angle={1} accent="#f2c14e" className="h-[clamp(220px,22vw,330px)] w-auto" />
          </div>

          {/* the corner button and its fan */}
          <p className="absolute bottom-6 left-7 text-[14px] text-[var(--sx-muted)]">
            <span className="font-[650] text-[var(--sx-text)]">Masala corn puffs</span> · air-popped · 90 g
          </p>
          <div className="absolute bottom-[clamp(170px,12.5vw,190px)] right-[clamp(170px,12.5vw,190px)] h-0 w-0">
            <div ref={ring} className="absolute left-0 top-0 h-0 w-0">
              {NV27_ITEMS.map((it, k) => {
                const a = (k / NV27_ITEMS.length) * Math.PI * 2 - Math.PI / 2;
                return (
                  <a
                    key={it.t}
                    href="#"
                    onClick={noop}
                    className="absolute left-0 top-0 transition-[translate,opacity,scale] duration-700 ease-[cubic-bezier(.2,.9,.25,1)]"
                    style={{
                      translate: open ? `calc(${Math.cos(a) * R}px - 50%) calc(${Math.sin(a) * R}px - 50%)` : "-50% -50%",
                      opacity: open ? 1 : 0,
                      scale: open ? "1" : ".3",
                      transitionDelay: `${(open ? k : NV27_ITEMS.length - k) * 45}ms`,
                    }}
                  >
                    <span data-upright className="flex flex-col items-center gap-1.5">
                      <span className="grid h-[52px] w-[52px] place-items-center rounded-full text-[#14110c] shadow-[0_16px_30px_-14px_rgba(0,0,0,.6)]" style={{ background: it.c }}>
                        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d={it.icon} />
                        </svg>
                      </span>
                      <span className="rounded-full bg-[color-mix(in_srgb,var(--sx-bg)_70%,transparent)] px-2 py-0.5 text-[12px] font-[600]">{it.t}</span>
                    </span>
                  </a>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-label="Menu"
              className="absolute left-0 top-0 grid h-[78px] w-[78px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[var(--sx-accent)] text-[var(--sx-accent-text)] shadow-[0_24px_50px_-18px_color-mix(in_srgb,var(--sx-accent)_80%,transparent)]"
            >
              <span className={`relative block h-6 w-6 transition-transform duration-500 ${open ? "rotate-45" : ""}`}>
                <span className="absolute left-0 top-1/2 h-[3px] w-full -translate-y-1/2 rounded bg-current" />
                <span className="absolute left-1/2 top-0 h-full w-[3px] -translate-x-1/2 rounded bg-current" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── NV28 · Three-zone bar (3/6/3) ───────────────────────── */

const NV28_LINKS = ["New in", "Shirts", "Trousers", "Dresses", "Home linen", "Journal"];

/** NV28 · One bar, three fixed zones on a 12-column grid: wordmark (3), centred link group (6), actions (3: search, bag
 *  with count, CTA). Shown on top of the page it heads; the active link and the bag count change by themselves. */
function NV28() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M6");
  const [act] = useAutoCycle(r, NV28_LINKS.length, 1500);
  const bag = 2 + (act % 3);
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <style>{NV_CSS}</style>
      <Glow className="right-[-8%] top-[20%] w-[55vw]" />
      <Glow alt className="bottom-[-20%] left-[5%] w-[40vw]" />
      <div className="relative z-10">
        {/* the bar */}
        <header data-m-card className="grid grid-cols-1 items-center gap-y-4 rounded-full border border-[var(--sx-line)] bg-[color-mix(in_srgb,var(--sx-surface)_85%,transparent)] px-[clamp(20px,2.4vw,36px)] py-4 backdrop-blur-md md:grid-cols-12">
          <a href="#" onClick={noop} className="sx-display text-[clamp(22px,1.9vw,28px)] font-[600] tracking-[-0.02em] md:col-span-3">
            Saal &amp; Sun
          </a>
          <nav className="flex flex-wrap items-center justify-center gap-x-[clamp(14px,1.8vw,30px)] gap-y-2 md:col-span-6">
            {NV28_LINKS.map((l, k) => (
              <a key={l} href="#" onClick={noop} className={`relative py-1 text-[15px] transition-colors duration-300 ${k === act ? "text-[var(--sx-text)]" : "text-[var(--sx-muted)]"}`}>
                {l}
                <span className={`absolute -bottom-0.5 left-0 h-[2px] w-full origin-left bg-[var(--sx-accent)] transition-transform duration-500 ${k === act ? "scale-x-100" : "scale-x-0"}`} />
              </a>
            ))}
          </nav>
          <div className="flex items-center justify-end gap-3 md:col-span-3">
            <a href="#" onClick={noop} aria-label="Search" className="grid h-11 w-11 place-items-center rounded-full border border-[var(--sx-line)]">
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                <circle cx="11" cy="11" r="6.5" />
                <path d="M16 16l4.5 4.5" strokeLinecap="round" />
              </svg>
            </a>
            <a href="#" onClick={noop} aria-label="Bag" className="relative grid h-11 w-11 place-items-center rounded-full border border-[var(--sx-line)]">
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                <path d="M5.5 8h13l-1 12h-11zM9 8V6.5a3 3 0 0 1 6 0V8" strokeLinejoin="round" />
              </svg>
              <span key={bag} className="nvb7-bump absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--sx-accent)] px-1 text-[12px] font-[700] text-[var(--sx-accent-text)]">
                {bag}
              </span>
            </a>
            <Btn className="max-lg:hidden">Shop linen</Btn>
          </div>
        </header>

        {/* the page under it */}
        <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 items-end gap-[clamp(24px,4vw,64px)] md:grid-cols-12">
          <div className="md:col-span-5">
            <H className="text-[clamp(48px,5.6vw,96px)]">Washed linen, worn in.</H>
            <P className="mt-6 max-w-[38ch]">Shirts and trousers in seven sun-faded tones, stonewashed twice so they feel lived in on day one.</P>
            <p className="mt-8 text-[15px] text-[var(--sx-muted)]">
              Camp-collar shirt <Price now="₹3,290" className="ml-2 text-[var(--sx-text)]" />
            </p>
          </div>
          <div className="grid grid-cols-2 gap-[clamp(10px,1.4vw,20px)] md:col-span-7">
            <div className="overflow-hidden rounded-[var(--sx-radius)]">
              <div className="fx-drift">
                <Pic i={3} ratio="4/5" label="Indigo" />
              </div>
            </div>
            <div className="mt-[18%] overflow-hidden rounded-[var(--sx-radius)]">
              <div className="fx-pan">
                <Pic i={1} ratio="4/5" label="Sand" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "NV27", name: "Radial corner menu", motion: "M33", C: NV27 },
  { code: "NV28", name: "Three-zone bar (3/6/3)", motion: "M6", C: NV28 },
];
