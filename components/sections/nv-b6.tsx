"use client";

// NV · Navigation layouts, batch 6 (docs/SECTION-MENU.md). Each is shown as a full designed section in a live state
// (the menu plays by itself), so the gallery shows the whole idea; on a site the nav is fixed and driven by the user.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** Scoped keyframes (all off in ?static=1 and with reduced motion). The glow is the CSS-only never-frozen safety net. */
const NV_CSS = `
.nvb6-in{animation:nvb6-in .6s cubic-bezier(.2,.8,.2,1) both}
@keyframes nvb6-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.nvb6-glow{animation:nvb6-glow 4.6s linear infinite alternate}
@keyframes nvb6-glow{from{transform:translate(-16%,-8%) scale(.9)}to{transform:translate(20%,12%) scale(1.18)}}
.nvb6-glow2{animation:nvb6-glow2 3.4s linear infinite alternate}
@keyframes nvb6-glow2{from{transform:translate(14%,10%) scale(1.1)}to{transform:translate(-18%,-6%) scale(.86)}}
html.is-static .nvb6-in,html.is-static .nvb6-glow,html.is-static .nvb6-glow2{animation:none}
html.is-static {.nvb6-in,.nvb6-glow,.nvb6-glow2{animation:none}}
`;

/** Big soft accent glow that drifts linearly behind the content. */
const Glow = ({ className = "", alt = false }: { className?: string; alt?: boolean }) => (
  <div
    aria-hidden
    className={`${alt ? "nvb6-glow2" : "nvb6-glow"} pointer-events-none absolute aspect-square rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_38%,transparent),transparent)] ${className}`}
  />
);

/* ───────────────────────── NV23 · Menu row to content grid ───────────────────────── */

const NV23_ROOMS = [
  {
    t: "Living",
    c: "14 pieces",
    items: [
      { n: "Kora lounge chair", p: 48500, i: 3 },
      { n: "Sill low table", p: 21900, i: 0 },
      { n: "Dune sofa, 3-seat", p: 1_24_000, i: 1 },
      { n: "Reed floor lamp", p: 13400, i: 2 },
    ],
  },
  {
    t: "Dining",
    c: "9 pieces",
    items: [
      { n: "Banyan table, 6-seat", p: 86000, i: 0 },
      { n: "Pallav chair", p: 14800, i: 3 },
      { n: "Bench in teak", p: 32500, i: 2 },
      { n: "Clay pendant", p: 11200, i: 1 },
    ],
  },
  {
    t: "Bedroom",
    c: "11 pieces",
    items: [
      { n: "Monsoon bed, queen", p: 92000, i: 1 },
      { n: "Linen headboard", p: 26400, i: 2 },
      { n: "Two-drawer side", p: 17900, i: 3 },
      { n: "Cane wardrobe", p: 71500, i: 0 },
    ],
  },
  {
    t: "Outdoor",
    c: "7 pieces",
    items: [
      { n: "Veranda lounger", p: 38800, i: 2 },
      { n: "Courtyard stool", p: 6900, i: 0 },
      { n: "Rope swing chair", p: 29500, i: 3 },
      { n: "Terracotta planter", p: 4800, i: 1 },
    ],
  },
];

/** NV23 · A single row of menu titles, each with a tiny thumbnail strip under it; choosing one flies its four thumbnails
 *  into a 4-column preview grid below (FLIP). The rooms are chosen by themselves. */
function NV23() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  const [act, setAct] = useAutoCycle(r, NV23_ROOMS.length, 2600);
  const thumbs = useRef<(HTMLElement | null)[][]>(NV23_ROOMS.map(() => []));
  const tiles = useRef<(HTMLDivElement | null)[]>([]);
  const first = useRef(true);

  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (prefersReducedMotion()) return;
    const tw: gsap.core.Tween[] = [];
    tiles.current.forEach((t, k) => {
      const src = thumbs.current[act]?.[k];
      if (!t || !src) return;
      const a = src.getBoundingClientRect();
      const b = t.getBoundingClientRect();
      if (!b.width || !b.height) return;
      tw.push(
        gsap.fromTo(
          t,
          { x: a.left - b.left, y: a.top - b.top, scaleX: a.width / b.width, scaleY: a.height / b.height, transformOrigin: "0 0", opacity: 0.7 },
          { x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 1, duration: 0.95, ease: "power3.inOut", delay: k * 0.07 },
        ),
      );
    });
    return () => tw.forEach((t) => t.progress(1).kill());
  }, [act]);

  const room = NV23_ROOMS[act];
  return (
    <Sec innerRef={r} theme="paper" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <style>{NV_CSS}</style>
      <Glow className="left-[30%] top-[30%] w-[52vw]" />
      <div className="relative z-10">
        <div className="grid grid-cols-1 items-end gap-[clamp(20px,3vw,48px)] md:grid-cols-12">
          <H className="text-[clamp(44px,5.4vw,88px)] md:col-span-7">Pick a room. The room comes to you.</H>
          <P className="max-w-[40ch] md:col-span-5 md:pb-2">The menu shows a peek of every collection. Choose one and its pieces step out of the strip into the page, priced and ready to open.</P>
        </div>

        {/* the menu row */}
        <nav className="mt-[clamp(40px,5vw,72px)] grid grid-cols-2 gap-x-6 gap-y-8 border-y border-[var(--sx-line)] py-7 md:grid-cols-4">
          {NV23_ROOMS.map((x, k) => (
            <a
              key={x.t}
              href="#"
              data-m-card
              onClick={(e) => {
                noop(e);
                setAct(k);
              }}
              className="group relative block min-w-0"
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className={`sx-display text-[clamp(30px,3vw,48px)] font-[600] leading-[1] transition-colors duration-500 ${k === act ? "text-[var(--sx-text)]" : "text-[var(--sx-muted)]"}`}>{x.t}</span>
                <span className="text-[13px] text-[var(--sx-muted)]">{x.c}</span>
              </span>
              <span className="mt-4 flex gap-1.5">
                {x.items.map((it, j) => (
                  <span
                    key={it.n}
                    ref={(el) => {
                      thumbs.current[k][j] = el;
                    }}
                    className={`block w-[clamp(34px,3vw,46px)] overflow-hidden rounded-[6px] transition-opacity duration-500 ${k === act ? "opacity-30" : "opacity-100"}`}
                  >
                    <Pic i={it.i} ratio="4/5" round={false} />
                  </span>
                ))}
              </span>
              <span className={`absolute -bottom-7 left-0 h-[3px] w-full origin-left bg-[var(--sx-accent)] transition-transform duration-700 ${k === act ? "scale-x-100" : "scale-x-0"}`} />
            </a>
          ))}
        </nav>

        {/* the grid the thumbnails fly into */}
        <div className="mt-[clamp(32px,4vw,56px)] grid grid-cols-1 gap-[clamp(14px,1.6vw,24px)] md:grid-cols-4">
          {room.items.map((it, k) => (
            <div key={`${act}-${k}`} data-m-card className="min-w-0">
              <div
                ref={(el) => {
                  tiles.current[k] = el;
                }}
                className="overflow-hidden rounded-[var(--sx-radius)]"
              >
                <div className="fx-drift">
                  <Pic i={it.i} ratio="4/5" label="" />
                </div>
              </div>
              <div className="nvb6-in mt-4 flex items-baseline justify-between gap-3" style={{ animationDelay: `${0.35 + k * 0.07}s` }}>
                <span className="truncate text-[16px] font-[600]">{it.n}</span>
                <Price now={inr(it.p)} className="text-[15px]" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex items-center justify-between gap-6">
          <span className="text-[15px] text-[var(--sx-muted)]">
            Showing <b className="font-[650] text-[var(--sx-text)]">{room.t}</b> · made to order in 5–7 weeks
          </span>
          <Btn kind="link">See all {room.t.toLowerCase()}</Btn>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── NV24 · Curved side drawer menu ───────────────────────── */

const NV24_BULGE = "M100 0 H24 Q-18 50 24 100 H100 Z";
const NV24_REST = "M100 0 H24 Q10 50 24 100 H100 Z";
const NV24_LINKS = ["Rituals", "Face", "Body & bath", "Gift sets", "Journal"];

/** NV24 · A side drawer slides in from the right with a bulging curved left edge that settles as it lands; big links
 *  stacked, socials at the bottom. It opens and closes by itself. */
function NV24() {
  const r = useRef<HTMLDivElement>(null);
  const drawer = useRef<HTMLDivElement>(null);
  const path = useRef<SVGPathElement>(null);
  useSectionMotion(r, "M23");
  const [i] = useAutoCycle(r, 2, 2300);
  const open = i === 0;
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const d = drawer.current;
    const p = path.current;
    if (!d || !p) return;
    const links = d.querySelectorAll("[data-nv24-link]");
    const tl = gsap.timeline();
    if (open) {
      tl.fromTo(d, { xPercent: 104 }, { xPercent: 0, duration: 0.9, ease: "power3.out" }, 0)
        .fromTo(p, { attr: { d: NV24_BULGE } }, { attr: { d: NV24_REST }, duration: 1.2, ease: "power2.out" }, 0)
        .fromTo(links, { x: 70, opacity: 0 }, { x: 0, opacity: 1, duration: 0.7, ease: "power3.out", stagger: 0.06 }, 0.15);
    } else {
      tl.to(p, { attr: { d: NV24_BULGE }, duration: 0.55, ease: "power2.in" }, 0).to(d, { xPercent: 104, duration: 0.75, ease: "power3.in" }, 0.05);
    }
    return () => {
      tl.kill();
    };
  }, [open]);

  return (
    <Sec innerRef={r} theme="stone" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <style>{NV_CSS}</style>
      <Glow className="-left-[10%] top-[10%] w-[46vw]" />
      <div className="relative z-10 grid grid-cols-1 items-center gap-[clamp(32px,4vw,72px)] md:grid-cols-12">
        <div className="md:col-span-4">
          <H className="text-[clamp(44px,4.8vw,80px)]">A menu that arrives like a wave.</H>
          <P className="mt-6 max-w-[34ch]">The drawer rolls in from the right with a soft, curved edge, so opening the menu feels like part of the ritual rather than a pop-up.</P>
          <ul className="mt-8 space-y-3 border-t border-[var(--sx-line)] pt-6 text-[15px] text-[var(--sx-muted)]">
            <li>Five big links, nothing nested</li>
            <li>Curved edge settles as it lands</li>
            <li>Socials and bag tucked at the bottom</li>
          </ul>
        </div>

        {/* the page in a window */}
        <div data-m-card className="relative min-h-[clamp(520px,42vw,660px)] overflow-hidden rounded-[var(--sx-radius)] border border-[var(--sx-line)] md:col-span-8">
          <div className="fx-pan absolute inset-[-4%]">
            <div className="fx-drift absolute inset-0">
              <Pic i={2} ratio="auto" round={false} label="" className="absolute inset-0 h-full w-full" />
            </div>
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,color-mix(in_srgb,var(--sx-text)_55%,transparent),transparent_70%)]" />
          <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-8 py-6 text-[var(--sx-bg)]">
            <span className="sx-display text-[26px] font-[600] italic">saltmoon</span>
            <span className="flex items-center gap-3 text-[14px] font-[600]">
              Menu
              <span className="flex flex-col gap-[5px]">
                <span className="block h-[2px] w-6 bg-current" />
                <span className="block h-[2px] w-6 bg-current" />
              </span>
            </span>
          </header>
          <div className="absolute bottom-8 left-8 z-10 max-w-[30%] text-[var(--sx-bg)]">
            <p className="sx-display text-[clamp(28px,2.6vw,42px)] font-[600] leading-[1.05]">Salt, oil and slow mornings.</p>
            <p className="mt-3 text-[14px] opacity-80">Body oil · 100 ml · ₹1,450</p>
          </div>
          {/* dim layer while the drawer is open */}
          <div className={`absolute inset-0 bg-[var(--sx-text)] transition-opacity duration-700 ${open ? "opacity-20" : "opacity-0"}`} />

          {/* the curved drawer */}
          <div ref={drawer} className="absolute inset-y-0 right-0 z-20 w-[60%] text-[var(--sx-accent-text)]">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
              <path ref={path} d={NV24_REST} fill="var(--sx-accent)" />
            </svg>
            <div className="relative flex h-full flex-col justify-between py-8 pl-[28%] pr-10">
              <div className="flex items-center justify-between text-[14px] font-[600]">
                <span className="opacity-70">Menu</span>
                <span className="grid h-10 w-10 place-items-center rounded-full border border-current text-[18px]">×</span>
              </div>
              <ul className="space-y-1">
                {NV24_LINKS.map((l, k) => (
                  <li key={l} data-nv24-link>
                    <a href="#" onClick={noop} className="sx-display flex items-baseline gap-3 text-[clamp(30px,2.9vw,46px)] font-[600] leading-[1.15]">
                      {l}
                      {k === 0 && <span className="text-[13px] font-[500] opacity-70">new</span>}
                    </a>
                  </li>
                ))}
              </ul>
              <div data-nv24-link className="flex items-center justify-between border-t border-current/30 pt-5 text-[13px]">
                <span className="flex gap-2">
                  {[0, 1, 2].map((k) => (
                    <span key={k} className="grid h-9 w-9 place-items-center rounded-full border border-current/50">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        {k === 0 && <rect x="5" y="5" width="14" height="14" rx="4" />}
                        {k === 1 && <path d="M8 6l10 6-10 6z" />}
                        {k === 2 && <path d="M4 7h16v10H4zM4 7l8 6 8-6" />}
                      </svg>
                    </span>
                  ))}
                </span>
                <span className="font-[600]">Bag (2)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── NV25 · Pill that expands into a menu panel ───────────────────────── */

const NV25_LINKS = [
  { l: "Sleep", s: "240 soundscapes" },
  { l: "Focus", s: "Deep work, 25 min" },
  { l: "Stories", s: "Read in low voices" },
  { l: "For teams", s: "Quiet rooms at work" },
];

/** NV25 · A small floating pill (logo + menu) at top centre expands into a dark rounded panel with links and a CTA
 *  card, then folds back. Plays by itself. */
function NV25() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M6");
  const [i] = useAutoCycle(r, 2, 2400);
  const open = i === 0;
  return (
    <Sec innerRef={r} theme="paper" font="wide" className="py-[clamp(72px,9vw,140px)]">
      <style>{NV_CSS}</style>
      <Glow className="right-[6%] top-[4%] w-[40vw]" alt />
      <div className="relative z-10 mx-auto max-w-[900px] text-center">
        <H className="text-[clamp(40px,4.6vw,76px)]">Small until you need it.</H>
        <P className="mx-auto mt-5 max-w-[46ch]">The whole nav lives in one pill. Tap it and it grows into a calm, dark panel with every room of the app and one clear way in.</P>
      </div>

      <div className="relative z-10 mt-[clamp(40px,5vw,72px)] min-h-[clamp(520px,44vw,640px)] overflow-hidden rounded-[var(--sx-radius)]">
        <div className="fx-pan absolute inset-[-4%]">
          <div className="fx-drift absolute inset-0">
            <Pic i={0} ratio="auto" round={false} label="" className="absolute inset-0 h-full w-full" />
          </div>
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(0deg,color-mix(in_srgb,var(--sx-text)_70%,transparent),transparent_55%)]" />
        <div className="absolute bottom-10 left-10 z-10 max-w-[40ch] text-[var(--sx-bg)]">
          <p className="sx-display text-[clamp(26px,2.4vw,40px)] font-[700] leading-[1.05]">Asleep in eleven minutes.</p>
          <p className="mt-3 text-[15px] opacity-80">Rain on a tin roof · 42 min · offline</p>
        </div>

        {/* the pill → panel */}
        <div
          className="absolute left-1/2 top-6 z-20 -translate-x-1/2 overflow-hidden rounded-[29px] bg-[var(--sx-text)] text-[var(--sx-bg)] shadow-[0_40px_80px_-30px_rgba(0,0,0,.6)]"
          style={{
            width: open ? "min(780px, calc(100% - 48px))" : "236px",
            height: open ? 372 : 58,
            transition: "width .75s cubic-bezier(.7,0,.2,1), height .75s cubic-bezier(.7,0,.2,1)",
          }}
        >
          <div className="flex h-[58px] items-center justify-between gap-6 pl-6 pr-2">
            <span className="sx-display text-[17px] font-[800] tracking-[-0.01em]">tidepool</span>
            <span className="flex items-center gap-3">
              <span className={`text-[13px] transition-opacity duration-500 ${open ? "opacity-60" : "opacity-0"}`}>Close</span>
              <span className="relative grid h-[42px] w-[42px] place-items-center rounded-full bg-[var(--sx-accent)] text-[var(--sx-accent-text)]">
                <span className={`absolute h-[2px] w-4 bg-current transition-transform duration-500 ${open ? "rotate-45" : "-translate-y-[3px]"}`} />
                <span className={`absolute h-[2px] w-4 bg-current transition-transform duration-500 ${open ? "-rotate-45" : "translate-y-[3px]"}`} />
              </span>
            </span>
          </div>
          <div className={`grid min-w-[700px] grid-cols-[1.3fr_1fr] gap-6 px-6 pb-6 pt-3 transition-opacity duration-500 ${open ? "opacity-100 delay-300" : "opacity-0"}`}>
            <ul className="border-t border-[color-mix(in_srgb,var(--sx-bg)_18%,transparent)]">
              {NV25_LINKS.map((x) => (
                <li key={x.l} className="flex items-baseline justify-between gap-4 border-b border-[color-mix(in_srgb,var(--sx-bg)_18%,transparent)] py-3.5">
                  <a href="#" onClick={noop} className="sx-display text-[26px] font-[700] leading-[1]">
                    {x.l}
                  </a>
                  <span className="text-[13px] opacity-60">{x.s}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col justify-between rounded-[20px] bg-[color-mix(in_srgb,var(--sx-bg)_10%,transparent)] p-5">
              <div>
                <p className="text-[13px] uppercase tracking-[0.14em] opacity-60">Membership</p>
                <p className="sx-display mt-3 text-[30px] font-[800] leading-[1]">7 nights free</p>
                <p className="mt-2 text-[14px] opacity-70">then ₹299 a month · cancel any time</p>
              </div>
              <Btn className="w-full justify-center">Start sleeping</Btn>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── NV26 · Floating segmented notch ───────────────────────── */

const NV26_MODES = ["Dine in", "Takeaway", "Delivery"];
const NV26_ITEMS = [
  { n: "Masala chai cold brew", p: 180, a: 0, c: "#c9733a" },
  { n: "Kashmiri kahwa", p: 220, a: 1, c: "#d4a24c" },
  { n: "Hibiscus iced tea", p: 190, a: 2, c: "#c2415b" },
  { n: "Smoked lapsang tonic", p: 240, a: 3, c: "#5b6b4a" },
];
const NV26_DELTA = [0, -10, 30];

/** NV26 · A small rounded notch pinned at the bottom centre with segmented items; the indicator slides to the chosen
 *  mode and the notch grows to show that mode's options. The mode changes by itself. */
function NV26() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M18");
  const [mode] = useAutoCycle(r, 3, 2600);
  const [open, setOpen] = useState(true);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setOpen(false);
    const t = setTimeout(() => setOpen(true), 420);
    return () => clearTimeout(t);
  }, [mode]);

  const SEG = 140;
  return (
    <Sec innerRef={r} theme="ink" font="condensed" className="py-[clamp(72px,9vw,140px)]">
      <style>{NV_CSS}</style>
      <Glow className="left-[20%] top-[34%] w-[56vw]" />
      <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[14ch] text-[clamp(52px,6.4vw,104px)] uppercase">One menu, three ways to drink it.</H>
        <P className="max-w-[36ch] pb-2">A little notch at the bottom switches the whole page between dine in, takeaway and delivery, and shows only the choices that mode needs.</P>
      </div>

      <div className="relative z-10 mt-[clamp(40px,5vw,72px)] rounded-[var(--sx-radius)] border border-[var(--sx-line)] bg-[var(--sx-surface)] px-[clamp(20px,2.4vw,36px)] pb-[200px] pt-[clamp(24px,2.4vw,36px)]">
        <div className="mb-6 flex items-center justify-between">
          <span className="sx-display text-[24px] font-[800] uppercase tracking-[0.02em]">Kettle &amp; Clay</span>
          <span key={mode} className="nvb6-in text-[14px] text-[var(--sx-muted)]">
            Prices for <b className="text-[var(--sx-text)]">{NV26_MODES[mode].toLowerCase()}</b>
          </span>
        </div>
        <div className="grid grid-cols-1 gap-[clamp(12px,1.4vw,20px)] md:grid-cols-4">
          {NV26_ITEMS.map((x) => (
            <div key={x.n} data-m-card className="sx-card overflow-hidden bg-[var(--sx-bg)]">
              <div className="relative aspect-[4/3]" style={{ background: `radial-gradient(circle at 50% 45%, ${x.c}88, ${x.c}22 70%)` }}>
                <Product angle={x.a} accent={x.c} className="absolute inset-0 m-auto h-[82%] w-[82%]" />
              </div>
              <div className="flex items-baseline justify-between gap-3 p-4">
                <span className="text-[15px] font-[600]">{x.n}</span>
                <Price key={mode} now={inr(x.p + NV26_DELTA[mode])} className="nvb6-in text-[15px]" />
              </div>
            </div>
          ))}
        </div>

        {/* the notch */}
        <div className="absolute bottom-7 left-1/2 w-[454px] -translate-x-1/2 overflow-hidden rounded-[26px] bg-[var(--sx-text)] p-2 text-[var(--sx-bg)] shadow-[0_30px_60px_-20px_rgba(0,0,0,.6)]">
          <div className="overflow-hidden transition-[height] duration-500 ease-[cubic-bezier(.7,0,.2,1)]" style={{ height: open ? 104 : 0 }}>
            <div key={mode} className="nvb6-in px-4 pb-3 pt-3">
              {mode === 0 && (
                <>
                  <p className="text-[14px] font-[650]">Table for two · 7:30 pm</p>
                  <div className="mt-3 flex gap-2 text-[13px]">
                    {["Window", "Courtyard", "Counter"].map((c, k) => (
                      <span key={c} className={`rounded-full px-3.5 py-1.5 ${k === 1 ? "bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "border border-[color-mix(in_srgb,var(--sx-bg)_25%,transparent)]"}`}>
                        {c}
                      </span>
                    ))}
                  </div>
                </>
              )}
              {mode === 1 && (
                <>
                  <p className="text-[14px] font-[650]">Ready at the counter in</p>
                  <div className="mt-3 flex gap-2 text-[13px]">
                    {["10 min", "20 min", "30 min"].map((c, k) => (
                      <span key={c} className={`rounded-full px-3.5 py-1.5 ${k === 0 ? "bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "border border-[color-mix(in_srgb,var(--sx-bg)_25%,transparent)]"}`}>
                        {c}
                      </span>
                    ))}
                    <span className="self-center opacity-60">bring a cup, ₹10 off</span>
                  </div>
                </>
              )}
              {mode === 2 && (
                <>
                  <p className="text-[14px] font-[650]">To Indiranagar · about 35 min</p>
                  <div className="mt-3 flex items-center justify-between text-[13px]">
                    <span className="opacity-70">Free delivery over ₹499</span>
                    <span className="rounded-full bg-[var(--sx-accent)] px-3.5 py-1.5 text-[var(--sx-accent-text)]">Change address</span>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="relative flex">
            <span className="absolute inset-y-0 left-0 rounded-[20px] bg-[var(--sx-accent)] transition-transform duration-500 ease-[cubic-bezier(.7,0,.2,1)]" style={{ width: SEG + 6, transform: `translateX(${mode * (SEG + 6)}px)` }} />
            {NV26_MODES.map((m, k) => (
              <a key={m} href="#" onClick={noop} className={`relative z-10 py-3 text-center text-[15px] font-[650] transition-colors duration-500 ${k === mode ? "text-[var(--sx-accent-text)]" : "opacity-70"}`} style={{ width: SEG + 6 }}>
                {m}
              </a>
            ))}
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "NV23", name: "Menu row to content grid", motion: "M34", C: NV23 },
  { code: "NV24", name: "Curved side drawer menu", motion: "M23", C: NV24 },
  { code: "NV25", name: "Pill that expands into a menu panel", motion: "M6", C: NV25 },
  { code: "NV26", name: "Floating segmented notch", motion: "M18", C: NV26 },
];
