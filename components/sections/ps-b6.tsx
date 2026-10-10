"use client";

// PS · Product / shop layouts, batch 6 (docs/SECTION-MENU.md): PS21 a horizontal bar of filter dropdowns + a sort
// select above a 4-up grid (the dropdowns open, filter and re-sort on their own while on screen), PS22 a dense wall of
// 24 small icon + label category tiles with a light that hops from tile to tile. ?static=1 shows the closed bar and
// the plain wall.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Flip as FlipT } from "gsap/Flip";
import { loadPlugin, prefersReducedMotion } from "@/lib/gsap";
import { scene } from "../fx/shared";
import { Btn, H, P, Price, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

type FlipState = ReturnType<typeof FlipT.getState>;

/** Calls `fn` every `ms` while `ref` is on screen (never in ?static=1). */
function useEvery(ref: React.RefObject<HTMLElement | null>, ms: number, fn: () => void) {
  const cb = useRef(fn);
  useEffect(() => {
    cb.current = fn;
  });
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let t: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (e.isIntersecting) t = setInterval(() => cb.current(), ms);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, [ref, ms]);
}

const CSS = `.ps6kb img{animation:ps6s 4.6s linear infinite alternate,ps6t 3.3s ease-in-out infinite alternate}
.ps6kb.alt img{animation-duration:5.4s,3.9s;animation-direction:alternate-reverse}
@keyframes ps6s{from{scale:1.04}to{scale:1.16}}@keyframes ps6t{from{translate:-2% 2%}to{translate:2% -2%}}
.ps6glow{animation:ps6g 8s linear infinite alternate}
@keyframes ps6g{from{translate:-30% -20%}to{translate:30% 25%}}
.ps6pop{animation:ps6in .35s cubic-bezier(.22,1,.36,1) both}
@keyframes ps6in{from{opacity:0;translate:0 -8px}to{opacity:1;translate:0 0}}
html.is-static .ps6kb img,html.is-static .ps6glow{animation:none}
html.is-static {.ps6kb img,.ps6glow,.ps6pop{animation:none}}`;

/* ───────────────────────────── PS21 · Filter dropdown bar + product grid ───────────────────────────── */

const SHOES = [
  { n: "Lattice Runner", c: "Chalk / Rust", p: 8490, i: 2, stock: true },
  { n: "Tempo Knit", c: "Ink / Lime", p: 6990, i: 0, stock: true },
  { n: "Monsoon Trail", c: "Moss", p: 11490, i: 1, stock: false },
  { n: "Court Low", c: "Bone", p: 5490, i: 3, stock: true },
  { n: "Pacer 2", c: "Slate / Coral", p: 7790, i: 1, stock: true },
  { n: "Ridge GTX", c: "Clay", p: 12990, i: 3, stock: false },
  { n: "Daily Flow", c: "Fog", p: 4990, i: 0, stock: true },
  { n: "Lattice Racer", c: "Night", p: 9990, i: 2, stock: true },
];
const inr = (v: number) => `₹${v.toLocaleString("en-IN")}`;

type Phase = { open: null | "avail" | "price" | "sort"; stock: boolean; price: boolean; sort: "featured" | "low" };
const PHASES: Phase[] = [
  { open: null, stock: false, price: false, sort: "featured" },
  { open: "avail", stock: false, price: false, sort: "featured" },
  { open: "avail", stock: true, price: false, sort: "featured" },
  { open: "price", stock: true, price: false, sort: "featured" },
  { open: "price", stock: true, price: true, sort: "featured" },
  { open: "sort", stock: true, price: true, sort: "featured" },
  { open: null, stock: true, price: true, sort: "low" },
  { open: null, stock: false, price: false, sort: "low" },
];

function Drop({ label, on, n, children, right = false }: { label: string; on: boolean; n?: number; children?: React.ReactNode; right?: boolean }) {
  return (
    <div className="relative">
      <span className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-[14px] font-[600] transition-colors ${on ? "border-[var(--sx-text)] bg-[var(--sx-text)] text-[var(--sx-bg)]" : "border-[var(--sx-line)]"}`}>
        {label}
        {!!n && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[var(--sx-accent)] px-1 text-[12px] text-[var(--sx-accent-text)]">{n}</span>}
        <svg width="12" height="12" viewBox="0 0 12 12" className={`transition-transform ${on ? "rotate-180" : ""}`} aria-hidden>
          <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </span>
      {on && children && <div className={`ps6pop sx-card absolute top-[calc(100%+10px)] z-20 w-[280px] p-4 shadow-[0_30px_60px_-30px_rgba(28,24,19,.5)] ${right ? "right-0" : "left-0"}`}>{children}</div>}
    </div>
  );
}

const Check = ({ on, label }: { on: boolean; label: string }) => (
  <p className="flex items-center gap-3 py-1.5 text-[14px]">
    <span className={`grid h-5 w-5 place-items-center rounded-[6px] border ${on ? "border-[var(--sx-accent)] bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "border-[var(--sx-line)]"}`}>{on ? "✓" : ""}</span>
    {label}
  </p>
);

/** PS21 · Header, then a bar of filter dropdowns (Availability, Price, Size) left and a sort select right, above a 4-up grid. */
function PS21() {
  const r = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  const [ph, setPh] = useState(0);
  const F = useRef<typeof FlipT | null>(null);
  const st = useRef<FlipState | null>(null);
  useEffect(() => {
    loadPlugin("Flip").then((f) => (F.current = f as typeof FlipT));
  }, []);
  useEvery(r, 1500, () => {
    if (F.current && grid.current) st.current = F.current.getState(grid.current.querySelectorAll("[data-flip-id]"));
    setPh((v) => (v + 1) % PHASES.length);
  });
  useLayoutEffect(() => {
    const s = st.current;
    if (!F.current || !s || !grid.current) return;
    st.current = null;
    F.current.from(s, { targets: grid.current.querySelectorAll("[data-flip-id]"), duration: 0.8, ease: "power3.inOut", stagger: 0.03 });
  }, [ph]);

  const f = PHASES[ph];
  const list = f.sort === "low" ? [...SHOES].sort((a, b) => a.p - b.p) : SHOES;
  const keep = (s: (typeof SHOES)[number]) => (!f.stock || s.stock) && (!f.price || (s.p >= 5000 && s.p <= 10000));
  const shown = SHOES.filter(keep).length;

  return (
    <Sec innerRef={r} theme="paper" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <style>{CSS}</style>
      <div aria-hidden className="ps6glow pointer-events-none absolute right-[5%] top-[20%] h-[70%] w-[55%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_36%,transparent),transparent)]" />
      <div className="relative grid grid-cols-1 items-end gap-6 md:grid-cols-12">
        <H className="text-[clamp(44px,5.4vw,92px)] md:col-span-7">The running edit.</H>
        <P className="max-w-[40ch] md:col-span-5 md:pb-2">Eight pairs for road, trail and the walk home. Knit in Tiruppur, finished by hand, free returns for 30 days.</P>
      </div>

      <div data-m-card className="relative z-10 mt-[clamp(36px,4vw,56px)] flex flex-wrap items-center justify-between gap-4 border-y border-[var(--sx-line)] py-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="mr-2 text-[14px] text-[var(--sx-muted)]">Filter</span>
          <Drop label="Availability" on={f.open === "avail"} n={f.stock ? 1 : 0}>
            <div className="flex items-center justify-between border-b border-[var(--sx-line)] pb-2 text-[13px] text-[var(--sx-muted)]">
              <span>{f.stock ? "1 selected" : "0 selected"}</span>
              <span className="underline">Reset</span>
            </div>
            <div className="mt-2">
              <Check on={f.stock} label="In stock (6)" />
              <Check on={false} label="Pre-order (2)" />
            </div>
          </Drop>
          <Drop label="Price" on={f.open === "price"} n={f.price ? 1 : 0}>
            <div className="flex items-center justify-between border-b border-[var(--sx-line)] pb-2 text-[13px] text-[var(--sx-muted)]">
              <span>Highest price is ₹12,990</span>
              <span className="underline">Reset</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {[f.price ? "5,000" : "", f.price ? "10,000" : ""].map((v, k) => (
                <span key={k} className="rounded-[10px] border border-[var(--sx-line)] px-3 py-2 text-[14px] tabular-nums">
                  ₹ <span className={v ? "" : "text-[var(--sx-muted)]"}>{v || (k ? "To" : "From")}</span>
                </span>
              ))}
            </div>
          </Drop>
          <Drop label="Size" on={false} />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[14px] tabular-nums text-[var(--sx-muted)]">{shown} of 8</span>
          <Drop label={`Sort: ${f.sort === "low" ? "Price, low to high" : "Featured"}`} on={f.open === "sort"} right>
            {["Featured", "Price, low to high", "Price, high to low", "Newest"].map((o, k) => (
              <p key={o} className={`rounded-[8px] px-3 py-2 text-[14px] ${k === 1 ? "bg-[color-mix(in_srgb,var(--sx-accent)_14%,transparent)] font-[650]" : ""}`}>
                {o}
              </p>
            ))}
          </Drop>
        </div>
      </div>

      <div ref={grid} className="relative mt-[clamp(28px,3vw,44px)] grid grid-cols-2 gap-x-[clamp(12px,1.6vw,24px)] gap-y-[clamp(28px,3vw,44px)] md:grid-cols-4">
        {list.map((s, k) => {
          const on = keep(s);
          return (
            <article key={s.n} data-flip-id={s.n} data-m-card className="transition-opacity duration-500" style={{ opacity: on ? 1 : 0.3 }}>
              <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--sx-radius)] bg-[var(--sx-surface)]">
                <div className={`ps6kb ${k % 2 ? "alt" : ""} absolute inset-0`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={scene(s.i, 800, 1000, "")} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
                </div>
                {!s.stock && <span className="absolute left-3 top-3 rounded-full bg-[var(--sx-surface)] px-3 py-1 text-[12px] font-[650]">Pre-order</span>}
              </div>
              <div className="mt-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[16px] font-[650]">{s.n}</p>
                  <p className="text-[14px] text-[var(--sx-muted)]">{s.c}</p>
                </div>
                <Price now={inr(s.p)} className="text-[15px]" />
              </div>
            </article>
          );
        })}
      </div>
    </Sec>
  );
}

/* ───────────────────────────── PS22 · Category tile wall ───────────────────────────── */

const ICON: Record<string, string> = {
  leaf: "M5 19c0-8 6-14 14-14 0 8-6 14-14 14zM5 19l7-7",
  drop: "M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z",
  loaf: "M4 11a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8H4zM9 7v4M15 7v4",
  egg: "M12 3c3.5 0 6 6 6 10a6 6 0 0 1-12 0c0-4 2.5-10 6-10z",
  fish: "M3 12c3-4 7-5 11-4l4-3v14l-4-3c-4 1-8 0-11-4zM8 11h.01",
  apple: "M12 7c-3-2-8-1-8 5s4 9 8 8c4 1 8-2 8-8s-5-7-8-5zM12 7c0-2 1-4 3-4",
  cup: "M5 8h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 10h2a2 2 0 0 1 0 4h-2",
  jar: "M7 4h10v3H7zM6 7h12v13H6zM9 12h6",
  carrot: "M5 19l9-9a3 3 0 0 0-4-4zM14 6l3-3M15 9l4-1",
  cheese: "M3 17l11-11 7 6v5zM3 17h18M10 14h.01M15 13h.01",
  grain: "M12 21V8M12 8c-3 0-4-3-4-5 3 0 4 3 4 5zM12 8c3 0 4-3 4-5-3 0-4 3-4 5zM12 14c-3 0-4-3-4-5M12 14c3 0 4-3 4-5",
  bottle: "M10 3h4v4l2 3v11H8V10l2-3zM8 14h8",
};
const CATS: [string, string, number][] = [
  ["Fruits", "apple", 142], ["Vegetables", "carrot", 188], ["Leafy greens", "leaf", 64], ["Milk & curd", "bottle", 58],
  ["Eggs", "egg", 22], ["Bakery", "loaf", 96], ["Fish & prawns", "fish", 41], ["Paneer & cheese", "cheese", 37],
  ["Rice & millets", "grain", 74], ["Atta & flours", "grain", 52], ["Dals & pulses", "jar", 88], ["Oils & ghee", "drop", 46],
  ["Masalas", "jar", 120], ["Tea & coffee", "cup", 79], ["Cold-pressed juice", "bottle", 31], ["Namkeen", "loaf", 104],
  ["Chocolate", "cheese", 66], ["Pickles & jams", "jar", 49], ["Breakfast", "cup", 57], ["Frozen", "drop", 43],
  ["Herbs", "leaf", 28], ["Sprouts & salads", "leaf", 19], ["Dry fruits", "apple", 61], ["Baby food", "egg", 24],
];
const HOP = [5, 14, 2, 19, 9, 22, 0, 12, 17, 7, 20, 3, 15, 10, 23, 6, 1, 18, 11, 21, 4, 16, 8, 13];

/** PS22 · "Shop by category" with a See-all link, then a 4-column wall of 24 small horizontal icon + label tiles. */
function PS22() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M6");
  const [h, setH] = useState(-1);
  useEvery(r, 650, () => setH((v) => (v + 1) % HOP.length));
  const lit = h < 0 ? -1 : HOP[h];
  return (
    <Sec innerRef={r} theme="ink" font="condensed" className="py-[clamp(72px,9vw,140px)]">
      <style>{CSS}</style>
      <div aria-hidden className="ps6glow pointer-events-none absolute left-[20%] top-[10%] h-[80%] w-[60%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_38%,transparent),transparent)]" />
      <div className="relative">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <H className="text-[clamp(48px,6vw,100px)]">Shop by category</H>
            <P className="mt-3 max-w-[46ch]">Fresh from farms around Pune, packed at 5 am and at your door by 7. Over 1,600 things, in 24 aisles.</P>
          </div>
          <Btn kind="link">See all 48 aisles →</Btn>
        </div>
        <div className="mt-[clamp(36px,4vw,60px)] grid grid-cols-2 gap-[clamp(8px,0.9vw,14px)] md:grid-cols-4">
          {CATS.map(([n, ic, c], k) => {
            const on = k === lit;
            return (
              <a
                key={n}
                href="#"
                onClick={(e) => e.preventDefault()}
                data-m-card
                data-cursor="Shop"
                className={`sx-card flex items-center gap-4 px-4 py-3.5 transition-[background-color,border-color,translate] duration-500 ${on ? "translate-y-[-3px] border-[var(--sx-accent)] bg-[color-mix(in_srgb,var(--sx-accent)_22%,var(--sx-surface))]" : ""}`}
              >
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors duration-500 ${on ? "bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "bg-[color-mix(in_srgb,var(--sx-text)_8%,transparent)] text-[var(--sx-text)]"}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d={ICON[ic]} />
                  </svg>
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-[650]">{n}</span>
                  <span className="block text-[13px] tabular-nums text-[var(--sx-muted)]">{c} items</span>
                </span>
              </a>
            );
          })}
        </div>
        <p className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px] text-[var(--sx-muted)]">
          <span>Free delivery over ₹499</span>
          <span>·</span>
          <span>
            First order <Price now="₹100 off" className="text-[var(--sx-text)]" />
          </span>
        </p>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "PS21", name: "Filter dropdown bar + product grid", motion: "M34", C: PS21 },
  { code: "PS22", name: "Category tile wall (many small tiles)", motion: "M6", C: PS22 },
];
