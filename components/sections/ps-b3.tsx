"use client";

// PS · Product-shop layouts, batch 3 (docs/SECTION-MENU.md): PS15 filter sidebar + product grid, PS16 list/grid view
// toggle catalogue. Both re-flow their items with GSAP Flip on a hands-free cycle while on screen, and show their final
// state in ?static=1.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, loadPlugin, prefersReducedMotion } from "@/lib/gsap";
import type { Flip as FlipT } from "gsap/Flip";
import { Btn, H, P, Pic, Price, Sec, Stars } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

type FlipState = ReturnType<typeof FlipT.getState>;

/** Steps an index every `ms` while `ref` is on screen (stops off screen and in ?static=1). */
function useCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms: number) {
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

/** Flip helper: call `capture()` before a state change; the layout change after render animates from the old spots. */
function useFlip(scope: React.RefObject<HTMLElement | null>, dep: unknown, vars: { duration?: number; nested?: boolean } = {}) {
  const F = useRef<typeof FlipT | null>(null);
  const st = useRef<FlipState | null>(null);
  useEffect(() => {
    loadPlugin("Flip").then((f) => (F.current = f as typeof FlipT));
  }, []);
  useLayoutEffect(() => {
    const s = st.current;
    const el = scope.current;
    if (!F.current || !s || !el) return;
    st.current = null;
    F.current.from(s, {
      targets: el.querySelectorAll("[data-flip-id]"),
      duration: vars.duration ?? 0.8,
      ease: "power3.inOut",
      nested: vars.nested,
      stagger: 0.03,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.6, ease: "power3.out", delay: 0.25 }),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dep]);
  return () => {
    const el = scope.current;
    if (F.current && el) st.current = F.current.getState(el.querySelectorAll("[data-flip-id]"));
  };
}

/* ───────────────────────────── PS15 · Filter sidebar + product grid ───────────────────────────── */

const LINEN = [
  { id: "a", n: "Kora Camp Shirt", cat: "Shirts", c: "Sand", p: 2890, i: 2 },
  { id: "b", n: "Tide Wrap Dress", cat: "Dresses", c: "Indigo", p: 5490, i: 0 },
  { id: "c", n: "Ghat Band-collar", cat: "Shirts", c: "Indigo", p: 2650, i: 1 },
  { id: "d", n: "Pleated Easy Trouser", cat: "Trousers", c: "Olive", p: 3990, i: 3 },
  { id: "e", n: "Monsoon Overshirt", cat: "Shirts", c: "Olive", p: 3450, i: 2 },
  { id: "f", n: "Sand Slip Dress", cat: "Dresses", c: "Sand", p: 4790, i: 1 },
  { id: "g", n: "Pocket Tee, Washed", cat: "Shirts", c: "Sand", p: 1690, i: 3 },
  { id: "h", n: "Drawstring Short", cat: "Trousers", c: "Indigo", p: 2190, i: 0 },
  { id: "i", n: "Kurta Shirt, Long", cat: "Shirts", c: "Clay", p: 2990, i: 1 },
  { id: "j", n: "Wide-leg Pant", cat: "Trousers", c: "Clay", p: 3690, i: 2 },
  { id: "k", n: "Tiered Sun Dress", cat: "Dresses", c: "Indigo", p: 5990, i: 3 },
  { id: "l", n: "Resort Shirt, Stripe", cat: "Shirts", c: "Indigo", p: 2790, i: 0 },
];
const SWATCH: Record<string, string> = { Sand: "#d9c6a5", Indigo: "#3b4a7a", Olive: "#6b7350", Clay: "#b5502a" };
type Preset = { chips: string[]; cat?: string; max?: number; colours?: string[]; sort: string };
const PRESETS: Preset[] = [
  { chips: [], sort: "Featured" },
  { chips: ["Shirts"], cat: "Shirts", sort: "Featured" },
  { chips: ["Under ₹3,000"], max: 3000, sort: "Price, low to high" },
  { chips: ["Indigo", "Sand"], colours: ["Indigo", "Sand"], sort: "Newest" },
];
const pick = (f: Preset) => {
  let list = LINEN.filter((x) => (!f.cat || x.cat === f.cat) && (!f.max || x.p < f.max) && (!f.colours || f.colours.includes(x.c)));
  if (f.sort === "Price, low to high") list = [...list].sort((a, b) => a.p - b.p);
  if (f.sort === "Newest") list = [...list].reverse();
  return list.slice(0, 6);
};
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const KB_CSS = `.pskb img{animation:pskb 4.8s ease-in-out infinite alternate}.pskb.alt img{animation-duration:6.4s;animation-direction:alternate-reverse}@keyframes pskb{from{transform:scale(1.04)}to{transform:scale(1.18) translate(2.5%,-2.5%)}}.is-static .pskb img{animation:none}html.is-static {.pskb img{animation:none}}`;

/** PS15 · Sticky filter sidebar (3/12) beside a toolbar of removable chips + sort and a 3-column grid that re-flows. */
function PS15() {
  const r = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  const [k, setK] = useCycle(r, PRESETS.length, 2400);
  const [shown, setShown] = useState(0);
  const capture = useFlip(grid, shown);
  // apply the auto-picked filter with a Flip re-flow
  useEffect(() => {
    if (k === shown) return;
    capture();
    setShown(k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k]);
  const f = PRESETS[shown];
  const items = pick(f);
  const lo = 1200;
  const hi = f.max ?? 6800;
  return (
    <Sec innerRef={r} theme="paper" font="editorial" className="py-[clamp(72px,9vw,140px)]" style={{ overflow: "clip" }}>
      <style>{KB_CSS}</style>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[14ch] text-[clamp(44px,5.4vw,88px)]">Summer linen, all of it.</H>
        <P className="max-w-[38ch]">Forty-eight pieces in washed European flax, cut in Jaipur. Filter by what you reach for most.</P>
      </div>

      <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 gap-[clamp(24px,3vw,48px)] md:grid-cols-12">
        {/* sticky sidebar */}
        <aside className="md:col-span-3">
          <div className="md:sticky md:top-24 flex flex-col gap-8">
            <div data-m-card>
              <p className="border-b border-[var(--sx-line)] pb-3 text-[13px] font-[650] uppercase tracking-[0.14em]">Category</p>
              <ul className="mt-4 flex flex-col gap-3 text-[15px]">
                {[
                  ["Shirts", 22],
                  ["Dresses", 11],
                  ["Trousers", 9],
                  ["Shorts", 6],
                ].map(([c, n]) => {
                  const on = f.cat === c;
                  return (
                    <li key={c} className="flex items-center justify-between">
                      <span className="flex items-center gap-3">
                        <span className={`grid h-[18px] w-[18px] place-items-center rounded-[5px] border transition-colors duration-300 ${on ? "border-[var(--sx-accent)] bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "border-[var(--sx-line)]"}`}>
                          <span className={`text-[12px] leading-none ${on ? "" : "opacity-0"}`}>✓</span>
                        </span>
                        <span className={on ? "font-[650]" : ""}>{c}</span>
                      </span>
                      <span className="text-[13px] text-[var(--sx-muted)]">{n}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div data-m-card>
              <p className="border-b border-[var(--sx-line)] pb-3 text-[13px] font-[650] uppercase tracking-[0.14em]">Price</p>
              <div className="relative mt-6 h-1 rounded-full bg-[var(--sx-line)]">
                <span className="absolute inset-y-0 left-0 rounded-full bg-[var(--sx-accent)] transition-[right] duration-700" style={{ right: `${100 - ((hi - 1200) / 5600) * 100}%` }} />
                <span className="absolute -top-[7px] left-0 h-[18px] w-[18px] rounded-full border-2 border-[var(--sx-accent)] bg-[var(--sx-surface)]" />
                <span className="absolute -top-[7px] h-[18px] w-[18px] -translate-x-full rounded-full border-2 border-[var(--sx-accent)] bg-[var(--sx-surface)] transition-[left] duration-700" style={{ left: `${((hi - 1200) / 5600) * 100}%` }} />
              </div>
              <p className="mt-4 flex justify-between text-[14px] tabular-nums text-[var(--sx-muted)]">
                <span>{inr(lo)}</span>
                <span>{inr(hi)}</span>
              </p>
            </div>
            <div data-m-card>
              <p className="border-b border-[var(--sx-line)] pb-3 text-[13px] font-[650] uppercase tracking-[0.14em]">Colour</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {Object.entries(SWATCH).map(([n, c]) => {
                  const on = f.colours?.includes(n);
                  return (
                    <span key={n} className="flex flex-col items-center gap-1.5 text-[12px] text-[var(--sx-muted)]">
                      <span className={`h-9 w-9 rounded-full transition-shadow duration-300 ${on ? "shadow-[0_0_0_2px_var(--sx-bg),0_0_0_4px_var(--sx-accent)]" : "shadow-[0_0_0_1px_var(--sx-line)]"}`} style={{ background: c }} />
                      {n}
                    </span>
                  );
                })}
              </div>
            </div>
            <div data-m-card>
              <p className="border-b border-[var(--sx-line)] pb-3 text-[13px] font-[650] uppercase tracking-[0.14em]">Rating</p>
              <div className="mt-4 flex flex-col gap-2 text-[14px]">
                <span className="flex items-center gap-2"><Stars n={5} /> <span className="text-[var(--sx-muted)]">only</span></span>
                <span className="flex items-center gap-2"><Stars n={4} /> <span className="text-[var(--sx-muted)]">&amp; up</span></span>
              </div>
            </div>
          </div>
        </aside>

        {/* toolbar + grid */}
        <div className="min-w-0 md:col-span-9">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--sx-line)] pb-5">
            <div className="flex min-h-[38px] flex-wrap items-center gap-2">
              <span className="mr-2 text-[14px] text-[var(--sx-muted)]">{f.chips.length ? `${items.length} of 48` : "All 48 pieces"}</span>
              {f.chips.map((c) => (
                <span key={c} className="inline-flex items-center gap-2 rounded-full border border-[var(--sx-text)] px-4 py-1.5 text-[14px] font-[600]" style={{ animation: "ps15-chip .5s cubic-bezier(.22,1,.36,1)" }}>
                  {c} <span className="text-[var(--sx-muted)]">×</span>
                </span>
              ))}
              {f.chips.length > 0 && <span className="ml-1 text-[13px] underline underline-offset-4 text-[var(--sx-muted)]">Clear all</span>}
            </div>
            <span className="rounded-full border border-[var(--sx-line)] bg-[var(--sx-surface)] px-5 py-2 text-[14px]">
              Sort: <b className="font-[650]">{f.sort}</b> <span className="ml-1 text-[var(--sx-muted)]">▾</span>
            </span>
            <style>{`@keyframes ps15-chip{from{opacity:0;transform:translateY(-8px) scale(.9)}}`}</style>
          </div>
          <div ref={grid} className="mt-8 grid grid-cols-1 gap-x-[clamp(14px,1.6vw,24px)] gap-y-9 md:grid-cols-3">
            {items.map((x, n) => (
              <article key={x.id} data-flip-id={x.id} data-m-card className="group">
                <div className={`pskb ${n % 2 ? "alt" : ""} relative overflow-hidden rounded-[var(--sx-radius)]`}>
                  <Pic i={x.i} ratio="4/5" round={false} label="" />
                  {x.p < 2000 && <span className="absolute left-3 top-3 rounded-full bg-[var(--sx-surface)] px-3 py-1 text-[12px] font-[650]">New</span>}
                </div>
                <div className="mt-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[16px] font-[650]">{x.n}</p>
                    <p className="mt-1 flex items-center gap-2 text-[13px] text-[var(--sx-muted)]">
                      <span className="h-3 w-3 rounded-full" style={{ background: SWATCH[x.c] }} /> {x.c} · {x.cat}
                    </p>
                  </div>
                  <Price now={inr(x.p)} className="text-[15px]" />
                </div>
              </article>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <Btn kind="ghost">Load 12 more</Btn>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────────── PS16 · List/grid view toggle catalogue ───────────────────────────── */

const WINES = [
  { id: "w1", n: "Sahyadri Reserve", t: "Red · Shiraz", r: "Nashik", y: 2019, p: "₹2,450", i: 3 },
  { id: "w2", n: "Godavari Blanc", t: "White · Sauvignon", r: "Nashik", y: 2023, p: "₹1,380", i: 0 },
  { id: "w3", n: "Nandi Hills Rosé", t: "Rosé · Grenache", r: "Karnataka", y: 2023, p: "₹1,190", i: 1 },
  { id: "w4", n: "Old Vine Cabernet", t: "Red · Cabernet", r: "Akluj", y: 2018, p: "₹3,900", i: 2 },
  { id: "w5", n: "Monsoon Brut", t: "Sparkling · Chenin", r: "Dindori", y: 2021, p: "₹2,250", i: 0 },
  { id: "w6", n: "Deccan Viognier", t: "White · Viognier", r: "Bijapur", y: 2022, p: "₹1,650", i: 3 },
  { id: "w7", n: "Tempranillo Lot 4", t: "Red · Tempranillo", r: "Nashik", y: 2020, p: "₹2,780", i: 1 },
  { id: "w8", n: "Late Harvest Chenin", t: "Dessert · Chenin", r: "Dindori", y: 2021, p: "₹1,990", i: 2 },
];

/** PS16 · The same eight wines as a text list or a 4-column image grid; a toggle (top right) switches and items fly between. */
function PS16() {
  const r = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const [k] = useCycle(r, 2, 2800);
  const [grid, setGrid] = useState(false);
  const [still, setStill] = useState(false);
  const [row, setRow] = useCycle(r, WINES.length, 650); // the "hovered" row in list view
  const capture = useFlip(box, grid, { duration: 0.95, nested: true });
  useEffect(() => {
    if (prefersReducedMotion()) {
      setStill(true);
      setGrid(true);
    }
  }, []);
  useEffect(() => {
    if (still) return;
    const next = k === 1;
    if (next === grid) return;
    capture();
    setGrid(next);
    setRow(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k]);
  return (
    <Sec innerRef={r} theme="ink" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <style>{KB_CSS}</style>
      <div className="flex flex-wrap items-end justify-between gap-8">
        <div>
          <H className="max-w-[13ch] text-[clamp(44px,5.6vw,92px)] font-[500]">The cellar, by the bottle.</H>
          <P className="mt-5 max-w-[42ch]">Eight wines from Deccan vineyards we visit every harvest. Read the list, or see the labels.</P>
        </div>
        <div className="flex items-center gap-5">
          <span className="text-[14px] text-[var(--sx-muted)]">8 wines</span>
          <div className="relative grid grid-cols-2 rounded-full border border-[var(--sx-line)] p-1 text-[14px] font-[600]">
            <span className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-[var(--sx-accent)] transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)]" style={{ transform: grid ? "translateX(100%)" : "none" }} />
            <button onClick={() => (capture(), setGrid(false))} className={`relative z-10 px-5 py-2 transition-colors ${grid ? "" : "text-[var(--sx-accent-text)]"}`}>
              List
            </button>
            <button onClick={() => (capture(), setGrid(true))} className={`relative z-10 px-5 py-2 transition-colors ${grid ? "text-[var(--sx-accent-text)]" : ""}`}>
              Grid
            </button>
          </div>
        </div>
      </div>

      <div ref={box} className={`mt-[clamp(36px,4vw,64px)] ${grid ? "grid grid-cols-1 gap-x-[clamp(14px,1.6vw,24px)] gap-y-10 md:grid-cols-4" : "flex flex-col border-t border-[var(--sx-line)]"}`}>
        {WINES.map((w, n) => (
          <article
            key={w.id}
            data-flip-id={w.id}
            data-m-card
            className={
              grid
                ? "flex flex-col"
                : `grid grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-x-[clamp(16px,2vw,32px)] border-b border-[var(--sx-line)] py-3 transition-colors duration-300 md:grid-cols-[72px_minmax(0,2.2fr)_1.4fr_1fr_80px_auto] ${!still && row === n ? "bg-[var(--sx-surface)]" : ""}`
            }
          >
            <div data-flip-id={`${w.id}-img`} className={`pskb ${n % 2 ? "alt" : ""} overflow-hidden rounded-[var(--sx-radius)] ${grid ? "w-full" : "w-[72px]"}`}>
              <Pic i={w.i} ratio={grid ? "4/5" : "1/1"} round={false} label="" />
            </div>
            <p className={`sx-display font-[500] tracking-[-0.01em] ${grid ? "mt-4 text-[22px]" : "text-[clamp(20px,1.9vw,28px)]"}`}>{w.n}</p>
            <p className={`text-[14px] text-[var(--sx-muted)] ${grid ? "mt-1" : "max-md:hidden"}`}>
              {w.t}
              {grid && ` · ${w.y}`}
            </p>
            {!grid && <p className="text-[14px] text-[var(--sx-muted)] max-md:hidden">{w.r}</p>}
            {!grid && <p className="text-[14px] tabular-nums text-[var(--sx-muted)] max-md:hidden">{w.y}</p>}
            <Price now={w.p} className={`text-[16px] ${grid ? "mt-2" : "justify-self-end"}`} />
          </article>
        ))}
      </div>
      <div className="mt-12 flex flex-wrap items-center justify-between gap-6 border-t border-[var(--sx-line)] pt-8">
        <P className="text-[15px]">Mixed case of six, chosen by our sommelier: ₹9,800 with free chilled delivery in Mumbai and Pune.</P>
        <Btn>Build a case</Btn>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "PS15", name: "Filter sidebar + product grid", motion: "M34", C: PS15 },
  { code: "PS16", name: "List/grid view toggle catalogue", motion: "M23", C: PS16 },
];
