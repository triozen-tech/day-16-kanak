"use client";

// NV · Navigation layouts, batch 5 (docs/SECTION-MENU.md). Each is shown as a full designed section in a live state
// (the menu plays by itself), so the gallery shows the whole idea; on a site the nav is fixed and driven by the user.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { scene, useTicker } from "../fx/shared";
import { Btn, H, P, Pic, Price, Product, Sec, Stars } from "./kit";
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

/** Scoped keyframes (all off in ?static=1 and with reduced motion). */
const NV_CSS = `
.nvb5-in{animation:nvb5-in .6s cubic-bezier(.2,.8,.2,1) both}
@keyframes nvb5-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.nvb5-bump{animation:nvb5-bump .55s cubic-bezier(.3,1.6,.5,1) both}
@keyframes nvb5-bump{0%{scale:.5}60%{scale:1.35}100%{scale:1}}
.nvb5-sweep{animation:nvb5-sweep 3.2s linear infinite}
@keyframes nvb5-sweep{from{translate:-120% 0}to{translate:320% 0}}
.nvb5-float{animation:nvb5-float 2.6s ease-in-out infinite alternate}
@keyframes nvb5-float{from{translate:0 -6px}to{translate:0 8px}}
html.is-static .nvb5-in,html.is-static .nvb5-bump,html.is-static .nvb5-sweep,html.is-static .nvb5-float{animation:none}
html.is-static {.nvb5-in,.nvb5-bump,.nvb5-sweep,.nvb5-float{animation:none}}
`;

/* ───────────────────────── NV18 · Nav with mini-cart dropdown ───────────────────────── */

const NV18_ITEMS = [
  { n: "Attikan Estate, 250 g", v: "Medium roast · whole bean", p: 640, a: 1, c: "#b5502a" },
  { n: "Cold Brew Cans × 6", v: "Black, unsweetened", p: 894, a: 0, c: "#2b3a55" },
  { n: "Monsoon Malabar, 250 g", v: "Dark roast · French press", p: 580, a: 2, c: "#5f7a4a" },
  { n: "Filter Decoction Kit", v: "Steel filter + 100 g", p: 1250, a: 3, c: "#7a3b22" },
];
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** NV18 · Logo + links left; right an account dropdown and a Cart button whose dropdown lists line items (name, price,
 *  qty, remove) with a subtotal and checkout. Items are added by themselves; the cart count bumps each time. */
function NV18() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M18");
  // steps 0–2: cart open with 2, 3, 4 lines · step 3: cart closed, account open
  const [s] = useAutoCycle(r, 4, 2100);
  const lines = s === 3 ? 4 : s + 2;
  const qty = [1, 2, 1, 1];
  const count = NV18_ITEMS.slice(0, lines).reduce((a, _, k) => a + qty[k], 0);
  const sub = NV18_ITEMS.slice(0, lines).reduce((a, x, k) => a + x.p * qty[k], 0);
  const cartOpen = s !== 3;
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <style>{NV_CSS}</style>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[13ch] text-[clamp(44px,5.6vw,92px)]">Your bag, one glance away.</H>
        <P className="max-w-[38ch] pb-2">The cart opens right under the bar: change a quantity, drop a bag of beans, check out without leaving the page.</P>
      </div>

      <div data-m-card className="relative mt-[clamp(40px,5vw,72px)] rounded-[var(--sx-radius)] border border-[var(--sx-line)] bg-[var(--sx-surface)]">
        {/* the bar */}
        <nav className="relative z-30 flex items-center justify-between gap-6 border-b border-[var(--sx-line)] px-[clamp(20px,2.4vw,36px)] py-5">
          <div className="flex items-center gap-[clamp(20px,3vw,48px)]">
            <a href="#" onClick={noop} className="sx-display text-[26px] font-[700] italic tracking-[-0.01em]">
              Roastery Nine
            </a>
            <ul className="hidden items-center gap-7 text-[15px] md:flex">
              {["Shop beans", "Subscriptions", "Brew guides", "Our cafés"].map((l, k) => (
                <li key={l}>
                  <a href="#" onClick={noop} className={k === 0 ? "font-[650]" : "text-[var(--sx-muted)]"}>
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button type="button" className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-[14px] transition-colors ${!cartOpen ? "border-[var(--sx-text)]" : "border-[var(--sx-line)]"}`}>
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[#1f5f4a] text-[11px] font-[700] text-white">IM</span>
                Ira <span className={`text-[11px] transition-transform ${!cartOpen ? "rotate-180" : ""}`}>▾</span>
              </button>
              {/* account dropdown */}
              <div className={`absolute right-0 top-[calc(100%+12px)] w-[240px] rounded-[14px] border border-[var(--sx-line)] bg-[var(--sx-surface)] p-2 shadow-[0_30px_60px_-30px_rgba(28,24,19,.5)] transition-all duration-500 ${!cartOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"}`}>
                <p className="px-3 pb-2 pt-2 text-[12px] uppercase tracking-[0.14em] text-[var(--sx-muted)]">Ira Menon · member</p>
                {["Orders", "Subscription · every 2 weeks", "Saved addresses", "Sign out"].map((l) => (
                  <a key={l} href="#" onClick={noop} className="block rounded-[10px] px-3 py-2.5 text-[15px] hover:bg-[var(--sx-bg)]">
                    {l}
                  </a>
                ))}
              </div>
            </div>
            <button type="button" className={`relative flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-[650] transition-colors ${cartOpen ? "bg-[var(--sx-text)] text-[var(--sx-bg)]" : "border border-[var(--sx-line)]"}`}>
              Cart
              <span key={count} className="nvb5-bump grid h-6 min-w-6 place-items-center rounded-full bg-[var(--sx-accent)] px-1.5 text-[12px] tabular-nums text-[var(--sx-accent-text)]">
                {count}
              </span>
            </button>
          </div>
        </nav>

        {/* the page under the bar: copy left, picture right (the dropdown only ever covers the picture) */}
        <div className="grid grid-cols-1 md:grid-cols-12">
          <div className="flex flex-col justify-between gap-10 p-[clamp(24px,3vw,48px)] md:col-span-5">
            <div>
              <p className="sx-display text-[clamp(36px,3.6vw,58px)] font-[600] leading-[1]">Roasted Tuesday, at your door Thursday.</p>
              <p className="mt-5 max-w-[36ch] text-[16px] leading-relaxed text-[var(--sx-muted)]">Single-estate beans from the Western Ghats, roasted in eight-kilo batches and posted within a day.</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Btn>Shop beans</Btn>
              <span className="text-[14px] text-[var(--sx-muted)]">Free delivery over ₹999</span>
            </div>
          </div>
          <div className="relative min-h-[clamp(480px,44vw,640px)] overflow-hidden rounded-br-[var(--sx-radius)] md:col-span-7">
            <div className="fx-pan absolute inset-[-4%]">
              <div className="fx-drift absolute inset-0">
                <Pic i={3} ratio="auto" round={false} label="" className="absolute inset-0 h-full w-full" />
              </div>
            </div>
          </div>
        </div>

        {/* cart dropdown */}
        <div
          data-m-card
          className={`absolute right-[clamp(16px,2vw,32px)] top-[86px] z-20 w-[min(400px,calc(100%-32px))] rounded-[16px] border border-[var(--sx-line)] bg-[var(--sx-surface)] shadow-[0_40px_80px_-30px_rgba(28,24,19,.55)] transition-all duration-500 ${cartOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-3 opacity-0"}`}
        >
          <div className="flex items-center justify-between border-b border-[var(--sx-line)] px-5 py-4">
            <p className="text-[15px] font-[650]">Your bag</p>
            <p className="text-[13px] text-[var(--sx-muted)]">{count} items</p>
          </div>
          <ul className="px-5">
            {NV18_ITEMS.slice(0, lines).map((x, k) => (
              <li key={x.n} className={`flex items-center gap-4 border-b border-[var(--sx-line)] py-3.5 ${k === lines - 1 && s !== 3 ? "nvb5-in" : ""}`}>
                <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[10px]" style={{ background: `radial-gradient(circle at 50% 40%, ${x.c}55, ${x.c}22 70%)` }}>
                  <Product angle={x.a} accent={x.c} className="absolute inset-0 m-auto h-[82%] w-[82%]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-[600]">{x.n}</span>
                  <span className="block text-[13px] text-[var(--sx-muted)]">{x.v}</span>
                  <span className="mt-1.5 inline-flex items-center rounded-full border border-[var(--sx-line)] text-[13px]">
                    <span className="px-2.5">−</span>
                    <span className="tabular-nums">{qty[k]}</span>
                    <span className="px-2.5">+</span>
                  </span>
                </span>
                <span className="flex flex-col items-end gap-2">
                  <Price now={inr(x.p * qty[k])} className="text-[15px]" />
                  <a href="#" onClick={noop} className="text-[12px] text-[var(--sx-muted)] underline underline-offset-2">
                    Remove
                  </a>
                </span>
              </li>
            ))}
          </ul>
          <div className="px-5 py-4">
            <div className="flex items-baseline justify-between text-[15px]">
              <span className="text-[var(--sx-muted)]">Subtotal</span>
              <b key={sub} className="nvb5-in text-[20px] tabular-nums">{inr(sub)}</b>
            </div>
            <a href="#" onClick={noop} className="mt-4 block rounded-full bg-[var(--sx-accent)] py-3.5 text-center text-[15px] font-[650] text-[var(--sx-accent-text)]">
              Checkout
            </a>
            <p className="mt-3 text-center text-[12px] text-[var(--sx-muted)]">Roasted to order · ships in 24 h</p>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── NV19 · Scrollspy section header ───────────────────────── */

const NV19_MAIN = ["Overview", "Ingredients", "How to use", "Reviews"];
const NV19_MORE = ["FAQ", "Shipping"];
const NV19_ALL = [...NV19_MAIN, ...NV19_MORE];

/** NV19 · A product page in a window: the sticky header's anchor links light up as each part of the page scrolls past
 *  (the page scrolls by itself); the last parts live under "More", which opens when one of them is in view. */
function NV19() {
  const r = useRef<HTMLDivElement>(null);
  const view = useRef<HTMLDivElement>(null);
  const page = useRef<HTMLDivElement>(null);
  const off = useRef(0);
  const [act, setAct] = useState(0);
  const last = useRef(0);
  useSectionMotion(r, "M23");

  useTicker(view, (_, dt) => {
    const v = view.current;
    const pg = page.current;
    if (!v || !pg) return;
    const max = pg.scrollHeight - v.clientHeight;
    off.current += dt * 78;
    if (off.current > max + 120) off.current = 0;
    const y = Math.min(off.current, max);
    pg.style.transform = `translate3d(0, ${(-y).toFixed(1)}px, 0)`;
    const kids = Array.from(pg.children) as HTMLElement[];
    let a = 0;
    kids.forEach((k, n) => {
      if (k.offsetTop <= y + v.clientHeight * 0.35) a = n;
    });
    if (a !== last.current) {
      last.current = a;
      setAct(a);
    }
  });

  const inMore = act >= NV19_MAIN.length;
  return (
    <Sec innerRef={r} theme="stone" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <style>{NV_CSS}</style>
      <div className="grid grid-cols-1 items-end gap-[clamp(24px,4vw,64px)] md:grid-cols-12">
        <H className="text-[clamp(44px,5.6vw,92px)] md:col-span-7">One long page, always oriented.</H>
        <P className="max-w-[40ch] md:col-span-5 md:pb-2">A header that knows where you are: each link lights up as its part of the product page scrolls by, and the extras fold into More.</P>
      </div>

      <div data-m-card className="relative mt-[clamp(40px,5vw,72px)] overflow-hidden rounded-[var(--sx-radius)] border border-[var(--sx-line)] bg-[var(--sx-surface)]">
        {/* sticky header */}
        <header className="relative z-20 flex items-center justify-between gap-6 border-b border-[var(--sx-line)] bg-[var(--sx-surface)] px-[clamp(20px,2.4vw,36px)] py-4">
          <div className="flex items-center gap-4">
            <span className="sx-display text-[22px] font-[800] tracking-[-0.03em]">dew/lab</span>
            <span className="hidden text-[14px] text-[var(--sx-muted)] lg:block">Niacinamide 10% Serum</span>
          </div>
          <ul className="hidden items-center gap-1 md:flex">
            {NV19_MAIN.map((l, k) => (
              <li key={l}>
                <a href="#" onClick={noop} className={`relative block rounded-full px-4 py-2 text-[14px] font-[600] transition-colors duration-300 ${k === act ? "bg-[var(--sx-text)] text-[var(--sx-bg)]" : "text-[var(--sx-muted)]"}`}>
                  {l}
                </a>
              </li>
            ))}
            <li className="relative">
              <a href="#" onClick={noop} className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[14px] font-[600] transition-colors duration-300 ${inMore ? "bg-[var(--sx-text)] text-[var(--sx-bg)]" : "text-[var(--sx-muted)]"}`}>
                More <span className={`text-[11px] transition-transform ${inMore ? "rotate-180" : ""}`}>▾</span>
              </a>
              <div className={`absolute right-0 top-[calc(100%+10px)] w-[200px] rounded-[14px] border border-[var(--sx-line)] bg-[var(--sx-surface)] p-1.5 shadow-[0_24px_50px_-24px_rgba(17,20,24,.45)] transition-all duration-400 ${inMore ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"}`}>
                {NV19_MORE.map((l, k) => (
                  <a key={l} href="#" onClick={noop} className={`block rounded-[10px] px-3 py-2.5 text-[14px] ${act === NV19_MAIN.length + k ? "bg-[color-mix(in_srgb,var(--sx-accent)_14%,transparent)] font-[650] text-[var(--sx-accent)]" : ""}`}>
                    {l}
                  </a>
                ))}
              </div>
            </li>
          </ul>
          <div className="flex items-center gap-4">
            <Price now="₹1,450" className="hidden text-[16px] md:inline-flex" />
            <a href="#" onClick={noop} className="sx-btn sx-btn-solid">
              Add to bag
            </a>
          </div>
        </header>
        {/* progress under the header: which part of six */}
        <div className="relative z-20 grid grid-cols-6 gap-1 bg-[var(--sx-surface)] px-[clamp(20px,2.4vw,36px)] pb-3 pt-3">
          {NV19_ALL.map((l, k) => (
            <span key={l} className={`h-[5px] rounded-full transition-colors duration-500 ${k <= act ? "bg-[var(--sx-accent)]" : "bg-[var(--sx-line)]"}`} />
          ))}
        </div>

        {/* the page, scrolling by itself */}
        <div ref={view} className="relative h-[clamp(460px,48vw,600px)] overflow-hidden">
          <div ref={page} className="will-change-transform">
            <section className="grid grid-cols-1 items-center gap-10 px-[clamp(24px,4vw,72px)] py-12 md:grid-cols-2">
              <div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-[16px] bg-[radial-gradient(circle_at_50%_45%,color-mix(in_srgb,var(--sx-accent)_40%,transparent),transparent_70%)]">
                <Product angle={1} accent="#1f5f4a" className="absolute inset-0 m-auto h-[82%] w-[82%]" />
              </div>
              <div>
                <p className="text-[13px] uppercase tracking-[0.16em] text-[var(--sx-accent)]">Overview</p>
                <p className="sx-display mt-3 text-[clamp(34px,3.4vw,54px)] font-[800] leading-[0.98] tracking-[-0.02em]">Clearer skin in eight weeks.</p>
                <p className="mt-4 max-w-[40ch] text-[16px] leading-relaxed text-[var(--sx-muted)]">A light serum with 10% niacinamide and 1% zinc for oil, pores and uneven tone. 30 ml lasts about two months.</p>
              </div>
            </section>
            <section className="border-t border-[var(--sx-line)] px-[clamp(24px,4vw,72px)] py-12">
              <p className="text-[13px] uppercase tracking-[0.16em] text-[var(--sx-accent)]">Ingredients</p>
              <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                {[
                  ["10%", "Niacinamide", "evens tone, calms oil"],
                  ["1%", "Zinc PCA", "keeps pores clear"],
                  ["2%", "Panthenol", "soothes and hydrates"],
                  ["0%", "Fragrance", "nothing to irritate"],
                ].map(([n, t, d]) => (
                  <div key={t} className="rounded-[14px] border border-[var(--sx-line)] p-5">
                    <p className="sx-display text-[clamp(32px,3vw,48px)] font-[800] leading-none">{n}</p>
                    <p className="mt-3 text-[15px] font-[650]">{t}</p>
                    <p className="mt-1 text-[14px] text-[var(--sx-muted)]">{d}</p>
                  </div>
                ))}
              </div>
            </section>
            <section className="border-t border-[var(--sx-line)] px-[clamp(24px,4vw,72px)] py-12">
              <p className="text-[13px] uppercase tracking-[0.16em] text-[var(--sx-accent)]">How to use</p>
              <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                {["Cleanse, then pat skin almost dry.", "Press three drops into face and neck.", "Follow with moisturiser; SPF by day."].map((t, k) => (
                  <div key={t} className="flex gap-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--sx-accent)] text-[15px] font-[700] text-[var(--sx-accent-text)]">{k + 1}</span>
                    <p className="pt-2 text-[17px] leading-snug">{t}</p>
                  </div>
                ))}
              </div>
            </section>
            <section className="border-t border-[var(--sx-line)] px-[clamp(24px,4vw,72px)] py-12">
              <p className="text-[13px] uppercase tracking-[0.16em] text-[var(--sx-accent)]">Reviews · 4.8 from 2,140</p>
              <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                {[
                  ["Pores look smaller by week three, and it sits well under sunscreen.", "Ananya K."],
                  ["No sting, no smell. My T-zone is finally matte by lunch.", "Rohan Pillai"],
                ].map(([q, n]) => (
                  <figure key={n} className="rounded-[14px] bg-[var(--sx-bg)] p-6">
                    <Stars n={5} />
                    <blockquote className="mt-3 text-[18px] leading-snug">“{q}”</blockquote>
                    <figcaption className="mt-4 text-[14px] text-[var(--sx-muted)]">{n} · verified buyer</figcaption>
                  </figure>
                ))}
              </div>
            </section>
            <section className="border-t border-[var(--sx-line)] px-[clamp(24px,4vw,72px)] py-12">
              <p className="text-[13px] uppercase tracking-[0.16em] text-[var(--sx-accent)]">FAQ</p>
              <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
                {[
                  ["Can I use it with vitamin C?", "Yes: vitamin C in the morning, this serum at night works best."],
                  ["Is it safe for sensitive skin?", "It is fragrance free and patch tested on 120 people."],
                ].map(([q, a]) => (
                  <div key={q}>
                    <p className="text-[18px] font-[650]">{q}</p>
                    <p className="mt-2 text-[15px] leading-relaxed text-[var(--sx-muted)]">{a}</p>
                  </div>
                ))}
              </div>
            </section>
            <section className="border-t border-[var(--sx-line)] px-[clamp(24px,4vw,72px)] pb-16 pt-12">
              <p className="text-[13px] uppercase tracking-[0.16em] text-[var(--sx-accent)]">Shipping</p>
              <p className="mt-4 max-w-[52ch] text-[18px] leading-snug">Free over ₹999, out in 24 hours from our Pune lab, and returns within 30 days, even opened.</p>
            </section>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-[linear-gradient(0deg,var(--sx-surface),transparent)]" />
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── NV20 · Utility bar over main bar ───────────────────────── */

const NV20_GROUPS = [
  { t: "Visit", cols: [["Plan your day", ["Hours & admission", "Getting here", "Accessibility", "Café & shop"]], ["Tickets", ["General · ₹300", "Students · ₹120", "Members · free"]]], f: "Open late Fridays till 9 pm" },
  { t: "Explore", cols: [["On now", ["Woven Rivers", "The Clay Rooms", "Salt & Indigo"]], ["Collection", ["Textiles", "Ceramics", "Metalwork", "Archive"]]], f: "Woven Rivers · until 12 Jan" },
  { t: "Learn", cols: [["Classes", ["Block printing", "Wheel throwing", "Natural dyes"]], ["For schools", ["Guided visits", "Teacher packs", "Workshops"]]], f: "Weekend classes from ₹1,800" },
  { t: "About", cols: [["The museum", ["Our story", "The building", "Press room"]], ["People", ["Curators", "Makers in residence", "Careers"]]], f: "A converted salt warehouse, 1911" },
  { t: "Join", cols: [["Membership", ["Friend · ₹2,500/yr", "Patron · ₹12,000/yr", "Gift a membership"]], ["Support", ["Donate", "Volunteer", "Corporate partners"]]], f: "Members visit free, all year" },
];

/** Tiny generic social glyphs (no real logos). */
const Glyph = ({ k }: { k: number }) => (
  <svg viewBox="0 0 16 16" className="h-[14px] w-[14px]" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    {k === 0 && <rect x="2" y="2" width="12" height="12" rx="3.5" />}
    {k === 0 && <circle cx="8" cy="8" r="2.8" />}
    {k === 1 && <path d="M5.5 4.5v7l6-3.5z" fill="currentColor" stroke="none" />}
    {k === 2 && <circle cx="8" cy="8" r="6" />}
    {k === 2 && <path d="M2 8h12M8 2c2 2 2 10 0 12M8 2c-2 2-2 10 0 12" />}
    {k === 3 && <path d="M3 3l10 10M13 3L3 13" />}
  </svg>
);

/** NV20 · A thin utility strip (member, donate, class, newsletter · social icons) over the main bar: logo left, five
 *  grouped dropdown labels right. The dropdowns open one after another by themselves over the exhibition picture. */
function NV20() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M6");
  const [g, setG] = useAutoCycle(r, NV20_GROUPS.length, 2000);
  const grp = NV20_GROUPS[g];
  return (
    <Sec innerRef={r} theme="ink" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <style>{NV_CSS}</style>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[14ch] text-[clamp(44px,5.6vw,96px)]">Actions above, the museum below.</H>
        <P className="max-w-[38ch] pb-2">Membership, giving and classes live in the slim strip; visiting and the collection get the main bar.</P>
      </div>

      <div data-m-card className="relative mt-[clamp(40px,5vw,72px)] overflow-hidden rounded-[var(--sx-radius)] border border-[var(--sx-line)]">
        {/* utility strip, 32px */}
        <div className="relative z-30 flex h-8 items-center justify-between bg-[var(--sx-accent)] px-[clamp(20px,2.4vw,36px)] text-[12px] font-[600] text-[var(--sx-accent-text)]">
          <ul className="flex items-center gap-[clamp(14px,2vw,28px)]">
            {["Become a member", "Donate", "Take a class", "Newsletter"].map((l) => (
              <li key={l}>
                <a href="#" onClick={noop} className="hover:underline">
                  {l}
                </a>
              </li>
            ))}
          </ul>
          <ul className="flex items-center gap-3">
            {[0, 1, 2, 3].map((k) => (
              <li key={k}>
                <a href="#" onClick={noop} aria-label="Social link" className="grid h-6 w-6 place-items-center rounded-full">
                  <Glyph k={k} />
                </a>
              </li>
            ))}
          </ul>
        </div>
        {/* main bar, 80px */}
        <nav className="relative z-30 flex h-20 items-center justify-between border-b border-[var(--sx-line)] bg-[var(--sx-surface)] px-[clamp(20px,2.4vw,36px)]">
          <a href="#" onClick={noop} className="flex items-center gap-3">
            <svg viewBox="0 0 32 32" className="h-9 w-9 text-[var(--sx-accent)]" aria-hidden>
              <path d="M4 26h24M7 26V12M13 26V12M19 26V12M25 26V12M3 12L16 4l13 8z" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span className="leading-[1.05]">
              <span className="sx-display block text-[20px] font-[700]">Saltpan</span>
              <span className="block text-[12px] uppercase tracking-[0.18em] text-[var(--sx-muted)]">Museum of Craft</span>
            </span>
          </a>
          <ul className="flex items-center gap-1">
            {NV20_GROUPS.map((x, k) => (
              <li key={x.t}>
                <button type="button" onClick={() => setG(k)} className={`flex items-center gap-1.5 rounded-full px-[clamp(10px,1.2vw,18px)] py-2.5 text-[15px] font-[600] transition-colors duration-300 ${k === g ? "bg-[var(--sx-text)] text-[var(--sx-bg)]" : "text-[var(--sx-text)]"}`}>
                  {x.t} <span className={`text-[10px] transition-transform duration-300 ${k === g ? "rotate-180" : ""}`}>▾</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* the page: exhibition picture, copy at the bottom (the dropdown sits on the upper part only) */}
        <div className="relative h-[clamp(520px,46vw,640px)] overflow-hidden">
          <div className="fx-pan absolute inset-[-4%]">
            <div className="fx-drift absolute inset-0">
              <Pic i={1} ratio="auto" round={false} label="" className="absolute inset-0 h-full w-full" />
            </div>
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,9,15,.25),rgba(7,9,15,.1)_45%,rgba(7,9,15,.85))]" />
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-6 p-[clamp(24px,3vw,48px)] text-white">
            <div>
              <p className="text-[13px] uppercase tracking-[0.16em] text-white/70">Now showing · Gallery 2</p>
              <p className="sx-display mt-2 text-[clamp(40px,4.4vw,72px)] leading-[0.95]">Woven Rivers</p>
            </div>
            <Btn>Book a timed ticket</Btn>
          </div>

          {/* mega dropdown */}
          <div key={g} className="nvb5-in absolute right-[clamp(20px,2.4vw,36px)] top-0 z-20 grid w-[min(720px,calc(100%-40px))] grid-cols-1 gap-6 rounded-b-[16px] border border-t-0 border-[var(--sx-line)] bg-[var(--sx-surface)] p-[clamp(20px,2vw,28px)] shadow-[0_40px_80px_-30px_rgba(0,0,0,.7)] md:grid-cols-[1fr_1fr_200px]">
            {grp.cols.map(([h, links]) => (
              <div key={h as string}>
                <p className="text-[12px] uppercase tracking-[0.16em] text-[var(--sx-muted)]">{h as string}</p>
                <ul className="mt-3 space-y-2">
                  {(links as string[]).map((l) => (
                    <li key={l}>
                      <a href="#" onClick={noop} className="text-[16px]">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="hidden md:block">
              <Pic i={(g + 2) % 4} ratio="4/3" label="" />
              <p className="mt-3 text-[14px] leading-snug text-[var(--sx-muted)]">{grp.f}</p>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── NV21 · Thumbnail stack menu ───────────────────────── */

const NV21_LINKS = [
  { t: "Portraits", n: "112 sittings", i: 0 },
  { t: "Weddings", n: "48 stories", i: 3 },
  { t: "Editorial", n: "36 shoots", i: 1 },
  { t: "Travel", n: "19 journeys", i: 2 },
  { t: "Archive", n: "2009–2024", i: 3 },
];

/** NV21 · A small stack of overlapping thumbnails sits left of the link list; opening the menu fans the stack out into
 *  a row across the bottom, one picture per link. Plays by itself: fan out, light each link in turn, fold back. */
function NV21() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  // step 0: open, nothing lit · 1–5: open, link k lit · 6: folded back into the stack
  const [s, setS] = useAutoCycle(r, 7, 1150);
  const open = s !== 6;
  const lit = s >= 1 && s <= 5 ? s - 1 : -1;
  return (
    <Sec innerRef={r} theme="paper" font="wide" className="py-[clamp(72px,9vw,140px)]">
      <style>{NV_CSS}</style>
      <div className="grid grid-cols-1 items-end gap-[clamp(24px,4vw,64px)] md:grid-cols-12">
        <H className="text-[clamp(38px,4.4vw,72px)] md:col-span-7">Every link, a picture.</H>
        <P className="max-w-[40ch] md:col-span-5 md:pb-2">Closed, the menu keeps a little pile of prints beside the links. Open it and the pile deals itself out, one print per chapter.</P>
      </div>

      <div className="relative mt-[clamp(40px,5vw,72px)] overflow-hidden rounded-[var(--sx-radius)] bg-[#1c1813] text-[#f4efe6]" style={{ aspectRatio: "16 / 9" }}>
        {/* top bar */}
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-[4%] py-[2.4%]">
          <span className="sx-display text-[clamp(16px,1.4vw,22px)] font-[700] uppercase tracking-[0.06em]">Studio Meher</span>
          <button type="button" onClick={() => setS(open ? 6 : 0)} className="flex items-center gap-3 text-[13px] font-[650] uppercase tracking-[0.16em]">
            {open ? "Close" : "Menu"}
            <span className="relative grid h-10 w-10 place-items-center rounded-full border border-white/25">
              <span className={`absolute h-[1.5px] w-4 bg-current transition-transform duration-500 ${open ? "rotate-45" : "-translate-y-[3px]"}`} />
              <span className={`absolute h-[1.5px] w-4 bg-current transition-transform duration-500 ${open ? "-rotate-45" : "translate-y-[3px]"}`} />
            </span>
          </button>
        </div>

        {/* link list (right of the stack) */}
        <ul className="absolute left-[22%] top-[15%] z-10">
          {NV21_LINKS.map((l, k) => (
            <li key={l.t} className="flex items-baseline gap-4">
              <a href="#" onClick={noop} className={`sx-display block text-[clamp(28px,3.2vw,50px)] font-[700] uppercase leading-[1.08] transition-[color,translate] duration-500 ${lit === k ? "translate-x-3 text-[#e0913f]" : lit >= 0 ? "text-white/40" : ""}`}>
                {l.t}
              </a>
              <span className={`text-[13px] text-white/55 transition-opacity duration-500 ${lit === k ? "opacity-100" : "opacity-0"}`}>{l.n}</span>
            </li>
          ))}
        </ul>
        <div className="absolute right-[4%] top-[18%] z-10 hidden max-w-[24ch] text-right md:block">
          <p className="text-[14px] leading-relaxed text-white/60">Commissions for 2025 are open. Portrait sittings from ₹18,000.</p>
          <a href="#" onClick={noop} className="mt-4 inline-block border-b border-white/40 pb-1 text-[14px] font-[650]">
            Book a sitting →
          </a>
        </div>

        {/* the thumbnails: a stack at left, or a row along the bottom */}
        {NV21_LINKS.map((l, k) => {
          const pos = open
            ? { left: `${4 + k * 18.8}%`, top: "62%", width: "15.6%", rotate: "0deg", z: 10 }
            : { left: `${5.5 + k * 0.7}%`, top: `${17 + k * 3.2}%`, width: "11%", rotate: `${(k - 2) * 4}deg`, z: 10 + k };
          return (
            <div
              key={l.t}
              className="absolute transition-all duration-[850ms] ease-[cubic-bezier(.7,0,.2,1)]"
              style={{ left: pos.left, top: pos.top, width: pos.width, rotate: pos.rotate, zIndex: pos.z, transitionDelay: `${(open ? k : 4 - k) * 45}ms` }}
            >
              <div data-m-card className={`overflow-hidden rounded-[10px] shadow-[0_20px_40px_-20px_rgba(0,0,0,.8)] transition-transform duration-500 ${lit === k ? "-translate-y-4" : ""}`}>
                <div className={`fx-drift ${lit >= 0 && lit !== k ? "opacity-50" : ""} transition-opacity duration-500`}>
                  <Pic i={l.i} ratio="4/3" round={false} label="" />
                </div>
              </div>
              <p className={`mt-2 text-[12px] uppercase tracking-[0.14em] text-white/70 transition-opacity duration-500 ${open ? "opacity-100" : "opacity-0"}`}>{l.t}</p>
            </div>
          );
        })}
      </div>
    </Sec>
  );
}

/* ───────────────────────── NV22 · Menu over a background image grid ───────────────────────── */

const NV22_LINKS = [
  { t: "Rooms", d: "Twenty-two rooms over the backwaters, each with a deck and a hammock.", p: "from ₹18,500 a night" },
  { t: "Dining", d: "A kitchen garden menu, cooked over coconut husk, served on the jetty.", p: "tasting menu ₹4,200" },
  { t: "Spa", d: "Ayurvedic rituals in a riverside pavilion, booked by the hour.", p: "from ₹3,600" },
  { t: "Journeys", d: "Kettuvallam days, temple mornings and paddy-field walks with our guides.", p: "from ₹2,800" },
];

/** NV22 · Landing and menu are one screen: four centred links over a dim wall of 16 tiles. Choosing a link slides the
 *  tiles up into that page's header band; back to the menu, next link. Plays by itself. */
function NV22() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M13");
  // even steps: the menu (with link k/2 marked) · odd steps: the header of link (k-1)/2
  const [s, setS] = useAutoCycle(r, NV22_LINKS.length * 2, 2000);
  const header = s % 2 === 1;
  const li = Math.floor(s / 2);
  const link = NV22_LINKS[li];
  return (
    <Sec innerRef={r} theme="ink" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <style>{NV_CSS}</style>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[13ch] text-[clamp(44px,5.6vw,96px)]">The menu is the lobby.</H>
        <P className="max-w-[38ch] pb-2">Four ways in, over a wall of the house. Pick one and the wall rearranges itself into that page&apos;s header.</P>
      </div>

      <div data-m-img className="relative mt-[clamp(40px,5vw,72px)] overflow-hidden rounded-[var(--sx-radius)] bg-[#05070c]" style={{ aspectRatio: "16 / 9" }}>
        {/* soft full backdrop under the tiles */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={scene(3, 1600, 900, "")} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30 blur-[18px]" draggable={false} />
        <div className="fx-pan absolute inset-0">
          {Array.from({ length: 16 }, (_, k) => {
            const g = { l: (k % 4) * 25, t: Math.floor(k / 4) * 25, w: 25, h: 25 };
            const h = { l: (k % 8) * 12.5, t: Math.floor(k / 8) * 23, w: 12.5, h: 23 };
            const p = header ? h : g;
            return (
              <div
                key={k}
                className="absolute p-[0.35%] transition-all duration-[1000ms] ease-[cubic-bezier(.75,0,.2,1)]"
                style={{ left: `${p.l}%`, top: `${p.t}%`, width: `${p.w}%`, height: `${p.h}%`, transitionDelay: `${((k * 7) % 16) * 22}ms` }}
              >
                <div
                  className={`h-full w-full rounded-[6px] bg-cover bg-center transition-[opacity,filter] duration-700 ${header ? "opacity-100" : "opacity-40 saturate-50"}`}
                  style={{ backgroundImage: `url("${scene((k + li) % 4, 600, 400, "")}")` }}
                />
              </div>
            );
          })}
        </div>
        {/* a light passing over the wall, all the time */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="nvb5-sweep h-full w-[30%] bg-[linear-gradient(100deg,transparent,rgba(255,255,255,.24),transparent)]" />
        </div>
        <div className={`pointer-events-none absolute inset-0 transition-colors duration-700 ${header ? "bg-[linear-gradient(180deg,transparent_40%,rgba(5,7,12,.96)_52%)]" : "bg-[rgba(5,7,12,.45)]"}`} />

        {/* bar */}
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-[3.5%] py-[2.4%] text-white">
          <span className="sx-display text-[clamp(18px,1.6vw,26px)] italic">Kayal House</span>
          <span className="text-[13px] uppercase tracking-[0.16em] text-white/70">Alappuzha · Kerala</span>
        </div>

        {/* menu mode: four centred links */}
        <ul className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-[1.2%] text-white transition-all duration-700 ${header ? "pointer-events-none scale-95 opacity-0" : "opacity-100"}`}>
          {NV22_LINKS.map((x, k) => (
            <li key={x.t}>
              <button type="button" onClick={() => setS(k * 2 + 1)} className={`sx-display text-[clamp(40px,5vw,84px)] leading-[1.02] transition-colors duration-500 ${k === li ? "italic text-white" : "text-white/55"}`}>
                {x.t}
              </button>
            </li>
          ))}
        </ul>

        {/* header mode: the chosen page under its new band */}
        <div className={`absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-end justify-between gap-6 px-[3.5%] pb-[3.5%] text-white transition-all duration-700 ${header ? "translate-y-0 opacity-100 delay-500" : "pointer-events-none translate-y-6 opacity-0"}`}>
          <div className="max-w-[46ch]">
            <p className="sx-display text-[clamp(48px,6vw,104px)] leading-[0.92]">{link.t}</p>
            <p className="mt-4 text-[17px] leading-relaxed text-white/75">{link.d}</p>
          </div>
          <div className="flex flex-col items-end gap-4">
            <p className="text-[15px] text-white/75">{link.p}</p>
            <div className="flex items-center gap-5">
              <button type="button" onClick={() => setS(li * 2)} className="text-[14px] text-white/70">
                ← Menu
              </button>
              <Btn>Reserve</Btn>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "NV18", name: "Nav with mini-cart dropdown", motion: "M18", C: NV18 },
  { code: "NV19", name: "Scrollspy section header", motion: "M23", C: NV19 },
  { code: "NV20", name: "Utility bar over main bar", motion: "M6", C: NV20 },
  { code: "NV21", name: "Thumbnail stack menu", motion: "M34", C: NV21 },
  { code: "NV22", name: "Menu over a background image grid", motion: "M13", C: NV22 },
];
