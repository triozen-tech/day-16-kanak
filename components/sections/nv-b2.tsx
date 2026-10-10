"use client";

// NV · Navigation layouts, batch 2 (docs/SECTION-MENU.md). Each is shown as a full designed section in a live state
// (the menu plays by itself), so the gallery shows the whole idea; on a site the bar is fixed and driven by the user.
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Pic, Price, Sec } from "./kit";
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

/** Plays a paused GSAP timeline only while `el` is on screen. */
function playWhileVisible(el: HTMLElement, tl: gsap.core.Timeline) {
  const io = new IntersectionObserver(([e]) => (e.isIntersecting ? tl.play() : tl.pause()));
  io.observe(el);
  return () => io.disconnect();
}

const noop = (e: React.MouseEvent) => e.preventDefault();

/* ───────────────────────── NV04 · Header morphs into a floating capsule ───────────────────────── */

/** NV04 · A framed page that scrolls by itself: at the top the header is a full-width transparent bar; reading down it
 *  folds into a centred blurred capsule with a reading-progress line; scrolling back up restores it. */
function NV04() {
  const r = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const page = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const [pill, setPill] = useState(false);
  useSectionMotion(r, "M6");
  useEffect(() => {
    const st = stage.current;
    const pg = page.current;
    if (!st || !pg || prefersReducedMotion()) return;
    const o = { y: 0 };
    let last = 0;
    let state = false;
    const tl = gsap.timeline({ repeat: -1, paused: true, defaults: { ease: "sine.inOut" } });
    tl.to(o, { y: 1, duration: 3.4 })
      .to(o, { y: 0.55, duration: 1.4 })
      .to(o, { y: 0.92, duration: 1.3 })
      .to(o, { y: 0, duration: 2.4 });
    tl.eventCallback("onUpdate", () => {
      const max = Math.max(0, pg.scrollHeight - st.clientHeight);
      const y = o.y * max;
      pg.style.transform = `translate3d(0, ${(-y).toFixed(1)}px, 0)`;
      if (bar.current) bar.current.style.transform = `scaleX(${o.y.toFixed(4)})`;
      const down = o.y > last + 0.0001;
      const up = o.y < last - 0.0001;
      last = o.y;
      const next = y < 40 ? false : down ? true : up ? false : state;
      if (next !== state) {
        state = next;
        setPill(next);
      }
    });
    return playWhileVisible(st, tl);
  }, []);
  const links = ["Shop", "Rooms", "Materials", "Journal"];
  const products = [
    { n: "Oslo lounge chair", p: "₹42,000", i: 1 },
    { n: "Tide oak side table", p: "₹14,500", i: 2 },
    { n: "Linen floor lamp", p: "₹9,800", i: 0 },
  ];
  return (
    <Sec innerRef={r} theme="stone" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[13ch] text-[clamp(44px,5.6vw,92px)]">A header that steps aside.</H>
        <P className="max-w-[40ch] pb-2">Full width at the top of the page. Start reading and it folds into a floating capsule; scroll up and it opens out again.</P>
      </div>
      <div ref={stage} data-m-card className="relative mt-[clamp(40px,5vw,72px)] h-[clamp(520px,64vh,660px)] overflow-hidden rounded-[var(--sx-radius)] border border-[var(--sx-line)] bg-[var(--sx-surface)] shadow-[0_40px_80px_-50px_rgba(17,20,24,.45)]">
        {/* the header: full-width bar ↔ floating capsule */}
        <header
          className={`absolute left-1/2 z-20 flex -translate-x-1/2 items-center justify-between overflow-hidden border transition-all duration-700 ease-[cubic-bezier(.2,.8,.2,1)] ${
            pill
              ? "top-4 w-[min(720px,86%)] rounded-full border-[var(--sx-line)] bg-[color-mix(in_srgb,var(--sx-surface)_70%,transparent)] px-5 py-2.5 shadow-[0_18px_40px_-20px_rgba(17,20,24,.45)] backdrop-blur-xl"
              : "top-0 w-full rounded-none border-transparent bg-transparent px-[clamp(20px,3vw,44px)] py-5"
          }`}
        >
          <span className="sx-display text-[clamp(18px,1.5vw,22px)] font-[700] tracking-[-0.02em]">Halden</span>
          <nav className="hidden items-center gap-[clamp(16px,2vw,32px)] text-[14px] font-[600] md:flex" aria-label="Main">
            {links.map((l) => (
              <a key={l} href="#" onClick={noop} className="text-[var(--sx-text)] opacity-80 hover:opacity-100">
                {l}
              </a>
            ))}
          </nav>
          <span className="flex items-center gap-4 text-[14px] font-[600]">
            <span className="hidden text-[var(--sx-muted)] md:inline">Bag (2)</span>
            <span className="rounded-full bg-[var(--sx-accent)] px-4 py-2 text-[13px] text-[var(--sx-accent-text)]">Visit a showroom</span>
          </span>
          <span ref={bar} className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 bg-[var(--sx-accent)]" />
        </header>

        {/* the page under it, scrolled by the timeline */}
        <div ref={page} className="will-change-transform">
          <div className="grid grid-cols-1 items-center gap-[clamp(24px,3vw,48px)] px-[clamp(20px,3vw,44px)] pb-14 pt-[clamp(96px,9vw,128px)] md:grid-cols-12">
            <div className="md:col-span-5">
              <p className="sx-display text-[clamp(40px,4.4vw,72px)] font-[700] leading-[0.95] tracking-[-0.03em]">Rooms that breathe.</p>
              <p className="mt-5 max-w-[34ch] text-[16px] leading-relaxed text-[var(--sx-muted)]">Solid oak, washed linen and cane, made to order in our Jodhpur workshop. Delivered and placed in 3 weeks.</p>
              <div className="mt-7">
                <Btn>Shop the living room</Btn>
              </div>
            </div>
            <Pic i={1} ratio="4/3" className="md:col-span-7" label="THE OAK ROOM" />
          </div>
          <div className="grid grid-cols-1 gap-[clamp(12px,1.6vw,22px)] px-[clamp(20px,3vw,44px)] pb-14 md:grid-cols-3">
            {products.map((p) => (
              <div key={p.n}>
                <Pic i={p.i} ratio="1/1" />
                <div className="mt-3 flex items-baseline justify-between gap-3 text-[15px]">
                  <span className="font-[600]">{p.n}</span>
                  <Price now={p.p} />
                </div>
              </div>
            ))}
          </div>
          <div className="border-y border-[var(--sx-line)] px-[clamp(20px,3vw,44px)] py-14 text-center">
            <p className="sx-display mx-auto max-w-[22ch] text-[clamp(28px,3vw,46px)] font-[600] leading-[1.1] tracking-[-0.02em]">&ldquo;Furniture you keep for thirty years, not three.&rdquo;</p>
          </div>
          <div className="px-[clamp(20px,3vw,44px)] py-14">
            <Pic i={3} ratio="21/9" label="TEAK & CANE · NEW" />
          </div>
          <div className="flex items-center justify-between border-t border-[var(--sx-line)] px-[clamp(20px,3vw,44px)] py-8 text-[14px] text-[var(--sx-muted)]">
            <span>Free white-glove delivery over ₹25,000</span>
            <span>Showrooms in Jodhpur and Pune</span>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── NV05 · Mega menu with featured story card ───────────────────────── */

const NV05_TABS = [
  {
    t: "Living",
    cols: [
      { h: "Seating", l: ["Sofas", "Lounge chairs", "Daybeds", "Ottomans & poufs"] },
      { h: "Tables", l: ["Coffee tables", "Side tables", "Consoles", "Nesting sets"] },
      { h: "Light", l: ["Floor lamps", "Table lamps", "Pendants", "Candle holders"] },
    ],
    f: { i: 1, k: "New in", t: "The courtyard sofa, in washed linen", p: "From ₹68,000" },
  },
  {
    t: "Dining",
    cols: [
      { h: "Tables", l: ["Extending tables", "Round tables", "Benches", "Bar tables"] },
      { h: "Chairs", l: ["Cane chairs", "Upholstered", "Stools", "Outdoor dining"] },
      { h: "Table", l: ["Stoneware", "Linen napkins", "Glassware", "Serving boards"] },
    ],
    f: { i: 2, k: "Story", t: "How a teak table is joined without one screw", p: "8 min read" },
  },
  {
    t: "Bedroom",
    cols: [
      { h: "Beds", l: ["Platform beds", "Four-posters", "Headboards", "Kids' beds"] },
      { h: "Storage", l: ["Wardrobes", "Chests", "Bedside tables", "Trunks"] },
      { h: "Linen", l: ["Duvet covers", "Sheets", "Throws", "Cushions"] },
    ],
    f: { i: 3, k: "Edit", t: "Sleep cooler: the summer linen set", p: "From ₹7,400" },
  },
  {
    t: "Outdoor",
    cols: [
      { h: "Lounging", l: ["Loungers", "Hammocks", "Outdoor sofas", "Planters"] },
      { h: "Dining", l: ["Teak tables", "Folding chairs", "Parasols", "Lanterns"] },
      { h: "Care", l: ["Teak oil", "Covers", "Cushion storage", "Repairs"] },
    ],
    f: { i: 0, k: "Guide", t: "Making a small balcony feel like a room", p: "6 min read" },
  },
];

/** NV05 · Top bar with a full-width panel dropped under it: three link columns with small group headings (2/3) and a
 *  featured story card (1/3). The active top link steps by itself; the panel swaps its columns and card. */
function NV05() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const [a, setA] = useAutoCycle(r, NV05_TABS.length, 2400);
  const tab = NV05_TABS[a];
  return (
    <Sec innerRef={r} theme="paper" font="editorial" full className="pb-[clamp(56px,6vw,96px)]">
      <style>{`
        .nv05-in { animation: nv05-in .65s cubic-bezier(.2,.8,.2,1) both; }
        @keyframes nv05-in { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: none; } }
        .nv05-feat { animation: nv05-feat 5s ease-in-out infinite alternate; }
        @keyframes nv05-feat { from { transform: scale(1.04) translate(-2%, 1%); } to { transform: scale(1.14) translate(2%, -2%); } }
        .nv05-sway { animation: nv05-sway 3.1s ease-in-out infinite alternate; }
        @keyframes nv05-sway { from { translate: 0 -6px; } to { translate: 0 6px; } }
        html.is-static .nv05-in, html.is-static .nv05-feat, html.is-static .nv05-sway { animation: none; }
        html.is-static { .nv05-in, .nv05-feat, .nv05-sway { animation: none; } }
      `}</style>
      {/* the bar */}
      <div className="flex items-center justify-between gap-6 border-b border-[var(--sx-line)] px-[clamp(20px,5vw,96px)] py-[clamp(18px,2vw,28px)]">
        <span className="sx-display text-[clamp(26px,2.2vw,34px)] italic leading-none">Marlow &amp; Teak</span>
        <nav className="hidden items-center gap-[clamp(18px,2.6vw,44px)] md:flex" aria-label="Main">
          {[...NV05_TABS.map((x) => x.t), "Journal"].map((l, k) => (
            <a key={l} href="#" onClick={noop} onMouseEnter={() => k < NV05_TABS.length && setA(k)} className={`relative py-2 text-[15px] font-[600] transition-colors duration-300 ${k === a ? "text-[var(--sx-text)]" : "text-[var(--sx-muted)]"}`}>
              {l}
              <span className={`absolute inset-x-0 -bottom-[clamp(19px,2vw,29px)] h-[2px] origin-left bg-[var(--sx-accent)] transition-transform duration-500 ${k === a ? "scale-x-100" : "scale-x-0"}`} />
            </a>
          ))}
        </nav>
        <span className="flex items-center gap-6 text-[14px] font-[600]">
          <span className="hidden text-[var(--sx-muted)] md:inline">Search</span>
          <span>Bag (1)</span>
        </span>
      </div>

      {/* the dropped panel */}
      <div data-m-card className="border-b border-[var(--sx-line)] bg-[var(--sx-surface)] px-[clamp(20px,5vw,96px)] py-[clamp(32px,3.6vw,56px)] shadow-[0_40px_60px_-40px_rgba(28,24,19,.35)]">
        <div className="grid grid-cols-1 gap-[clamp(28px,4vw,72px)] md:grid-cols-3">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 md:col-span-2">
            {tab.cols.map((c, k) => (
              <div key={`${a}-${c.h}`} className="nv05-in" style={{ animationDelay: `${k * 70}ms` }}>
                <p className="text-[12px] font-[700] uppercase tracking-[0.18em] text-[var(--sx-accent)]">{c.h}</p>
                <ul className="mt-4 space-y-2.5">
                  {c.l.map((l) => (
                    <li key={l}>
                      <a href="#" onClick={noop} className="sx-display text-[clamp(22px,1.9vw,30px)] leading-[1.15] hover:text-[var(--sx-accent)]">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <a key={`f${a}`} href="#" onClick={noop} className="nv05-in group block" style={{ animationDelay: "160ms" }}>
            <div className="relative overflow-hidden rounded-[var(--sx-radius)]" style={{ aspectRatio: "16/11" }}>
              <div className="nv05-feat absolute inset-0">
                <Pic i={tab.f.i} ratio="auto" round={false} className="absolute inset-0 h-full w-full" />
              </div>
              <span className="nv05-sway absolute bottom-4 right-4 grid h-12 w-12 place-items-center rounded-full bg-[var(--sx-surface)] text-[18px] text-[var(--sx-text)]">→</span>
            </div>
            <p className="mt-4 text-[12px] font-[700] uppercase tracking-[0.18em] text-[var(--sx-muted)]">
              {tab.f.k} · {tab.f.p}
            </p>
            <p className="sx-display mt-2 max-w-[22ch] text-[clamp(24px,2vw,32px)] leading-[1.1]">{tab.f.t}</p>
          </a>
        </div>
      </div>

      {/* the page peeking out under the panel */}
      <div className="flex flex-wrap items-end justify-between gap-6 px-[clamp(20px,5vw,96px)] pt-[clamp(40px,5vw,72px)] opacity-60">
        <H className="max-w-[14ch] text-[clamp(44px,5.4vw,88px)]">The courtyard edit, out now.</H>
        <P className="max-w-[34ch] pb-2">Teak, cane and washed linen for the slow months. Free delivery over ₹25,000.</P>
      </div>
    </Sec>
  );
}

/* ───────────────────────── NV06 · Hover menu with one morphing panel ───────────────────────── */

/** NV06 · A centred pill of three words; one shared panel under it resizes and swaps its content (a 2×2 product grid for
 *  one word, link lists for the others). Steps by itself; hover takes over. */
function NV06() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M18");
  const words = ["Sound", "Studio", "Support"];
  const [a, setA] = useAutoCycle(r, words.length, 2000);
  const boxes = useRef<(HTMLDivElement | null)[]>([]);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 780, h: 300 });
  useEffect(() => {
    const el = boxes.current[a];
    if (!el) return;
    const measure = () => setSize({ w: el.offsetWidth, h: el.offsetHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [a]);
  const products = [
    { n: "Halo One", d: "Over-ear, 40 h battery", p: "₹24,900", i: 3 },
    { n: "Pebble Buds", d: "Noise-cancelling earbuds", p: "₹9,990", i: 1 },
    { n: "Slab Speaker", d: "Room-filling, Wi-Fi", p: "₹18,500", i: 2 },
    { n: "Dock Mini", d: "Desk speaker + charger", p: "₹6,490", i: 0 },
  ];
  const studio = [
    ["Listening rooms", "Try every model in Bandra and Indiranagar"],
    ["Book a demo", "Thirty minutes with a sound engineer"],
    ["Sound lab", "How we tune drivers by ear"],
    ["Firmware notes", "What changed in version 4.2"],
  ];
  const support = ["Set-up guides", "Warranty & repairs", "Track an order", "Returns in 30 days"];
  const shift = [-150, 0, 150][a];
  return (
    <Sec innerRef={r} theme="ink" font="wide" className="py-[clamp(36px,4vw,56px)]">
      <style>{`
        .nv06-glow { animation: nv06-spin 14s linear infinite; }
        @keyframes nv06-spin { to { transform: rotate(1turn); } }
        html.is-static .nv06-glow { animation: none; }
        html.is-static { .nv06-glow { animation: none; } }
      `}</style>
      <div className="pointer-events-none absolute left-1/2 top-[30%] aspect-square w-[min(80vw,1000px)] -translate-x-1/2 -translate-y-1/2 opacity-60 blur-[90px]">
        <div className="nv06-glow h-full w-full rounded-full bg-[conic-gradient(from_0deg,color-mix(in_srgb,var(--sx-accent)_70%,transparent),transparent_30%,color-mix(in_srgb,var(--sx-accent)_35%,#8a5cf6)_55%,transparent_80%,color-mix(in_srgb,var(--sx-accent)_70%,transparent))]" />
      </div>

      {/* bar: logo · pill · bag */}
      <div className="relative z-10 flex items-center justify-between gap-6">
        <span className="sx-display text-[clamp(18px,1.5vw,22px)] font-[800] tracking-[-0.01em]">Quietform</span>
        <nav className="relative flex rounded-full border border-[var(--sx-line)] bg-[color-mix(in_srgb,var(--sx-surface)_70%,transparent)] p-1.5 backdrop-blur-md" aria-label="Main">
          {words.map((w, k) => (
            <a key={w} href="#" onClick={noop} onMouseEnter={() => setA(k)} className={`relative rounded-full px-[clamp(16px,2vw,28px)] py-2.5 text-[15px] font-[650] transition-colors duration-300 ${k === a ? "bg-[var(--sx-text)] text-[var(--sx-bg)]" : "text-[var(--sx-muted)]"}`}>
              {w}
            </a>
          ))}
        </nav>
        <span className="text-[14px] font-[600]">Cart (0)</span>
      </div>

      {/* the one shared panel */}
      <div className="relative z-10 mt-5 flex min-h-[clamp(380px,30vw,430px)] justify-center">
        <div
          data-m-card
          className="relative overflow-hidden rounded-[22px] border border-[var(--sx-line)] bg-[color-mix(in_srgb,var(--sx-surface)_88%,transparent)] shadow-[0_40px_80px_-30px_rgba(0,0,0,.7)] backdrop-blur-xl transition-[width,height,transform] duration-500 ease-[cubic-bezier(.2,.8,.2,1)]"
          style={{ width: size.w, height: size.h, transform: `translateX(${shift}px)` }}
        >
          {/* Sound: 2×2 product cards */}
          <div ref={(el) => void (boxes.current[0] = el)} className={`absolute left-0 top-0 w-[min(780px,90vw)] p-5 transition-opacity duration-300 ${a === 0 ? "opacity-100" : "pointer-events-none opacity-0"}`}>
            <div className="grid grid-cols-2 gap-3">
              {products.map((p) => (
                <a key={p.n} href="#" onClick={noop} className="flex items-center gap-4 rounded-[14px] p-2.5 transition-colors hover:bg-[color-mix(in_srgb,var(--sx-text)_6%,transparent)]">
                  <Pic i={p.i} ratio="1/1" className="w-[76px] shrink-0" />
                  <span className="min-w-0 flex-1 break-words">
                    <span className="block text-[16px] font-[700]">{p.n}</span>
                    <span className="block text-[14px] text-[var(--sx-muted)]">{p.d}</span>
                    <span className="mt-1 block text-[14px] text-[var(--sx-accent)]">{p.p}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>
          {/* Studio: two-line links */}
          <div ref={(el) => void (boxes.current[1] = el)} className={`absolute left-0 top-0 w-[min(460px,86vw)] p-7 transition-opacity duration-300 ${a === 1 ? "opacity-100" : "pointer-events-none opacity-0"}`}>
            <ul className="space-y-5">
              {studio.map(([t, d]) => (
                <li key={t}>
                  <a href="#" onClick={noop} className="block">
                    <span className="block text-[17px] font-[700]">{t}</span>
                    <span className="block text-[14px] text-[var(--sx-muted)]">{d}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          {/* Support: short list + a chat note */}
          <div ref={(el) => void (boxes.current[2] = el)} className={`absolute left-0 top-0 w-[min(340px,86vw)] p-7 transition-opacity duration-300 ${a === 2 ? "opacity-100" : "pointer-events-none opacity-0"}`}>
            <ul className="space-y-3 text-[16px] font-[600]">
              {support.map((s) => (
                <li key={s}>
                  <a href="#" onClick={noop}>{s}</a>
                </li>
              ))}
            </ul>
            <p className="mt-6 rounded-[12px] bg-[color-mix(in_srgb,var(--sx-accent)_16%,transparent)] px-4 py-3 text-[14px]">Live chat · replies in about 4 minutes</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-[clamp(24px,3vw,48px)] flex flex-wrap items-end justify-between gap-6 border-t border-[var(--sx-line)] pt-8">
        <H className="max-w-[16ch] text-[clamp(36px,4.4vw,72px)]">Hear the room, not the noise.</H>
        <div className="flex flex-wrap items-center gap-4 pb-2">
          <Btn>Shop headphones</Btn>
          <Btn kind="ghost">Find a listening room</Btn>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── NV07 · Corner circle menu ───────────────────────── */

/** NV07 · Menu button top-right; opening grows a circular clip from that corner over the whole stage, revealing four
 *  giant centred links with small descriptors to their right. Opens, holds, closes and reopens by itself. */
function NV07() {
  const r = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const ov = useRef<HTMLDivElement>(null);
  const [hi, setHi] = useState(-1);
  useSectionMotion(r, "M12");
  const links = [
    { t: "Fragrances", d: "Twelve eaux de parfum" },
    { t: "Atelier", d: "How we blend, by hand" },
    { t: "Gifting", d: "Sets from ₹2,400" },
    { t: "Visit", d: "The Kala Ghoda salon" },
  ];
  useEffect(() => {
    const st = stage.current;
    const o = ov.current;
    if (!st || !o || prefersReducedMotion()) return;
    const rows = o.querySelectorAll<HTMLElement>("[data-nv07-row]");
    const tl = gsap.timeline({ repeat: -1, paused: true });
    links.forEach((_, k) => tl.call(() => setHi(k), undefined, 0.15 + k * 0.6));
    tl.to(o, { "--nv07-r": "0%", duration: 0.9, ease: "power3.in" }, 2.6)
      .call(() => setHi(-1), undefined, 3.5)
      .to({}, { duration: 0.9 })
      .to(o, { "--nv07-r": "150%", duration: 1.2, ease: "power3.inOut" })
      .fromTo(rows, { y: 70, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", stagger: 0.08 }, "<0.35");
    return playWhileVisible(st, tl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Sec innerRef={r} theme="stone" font="serif" full>
      <style>{`
        .nv07-pic { animation: nv07-pic 6s ease-in-out infinite alternate; }
        @keyframes nv07-pic { from { transform: scale(1.05) translate(-1.5%, 0); } to { transform: scale(1.15) translate(1.5%, -2%); } }
        .nv07-glow { animation: nv07-glow 4.4s ease-in-out infinite alternate; }
        @keyframes nv07-glow { from { transform: translate(-12%, 6%) scale(.9); } to { transform: translate(14%, -8%) scale(1.15); } }
        html.is-static .nv07-pic, html.is-static .nv07-glow { animation: none; }
        html.is-static { .nv07-pic, .nv07-glow { animation: none; } }
      `}</style>
      <div ref={stage} className="relative h-[clamp(640px,94svh,920px)] overflow-hidden">
        {/* the page under the menu */}
        <div className="nv07-pic absolute inset-0">
          <Pic i={3} ratio="auto" round={false} className="absolute inset-0 h-full w-full" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,12,.35),rgba(10,10,12,.1)_40%,rgba(10,10,12,.75))]" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-[clamp(20px,5vw,96px)] pt-8 text-white">
          <span className="sx-display text-[clamp(22px,1.8vw,28px)] italic">Oudh &amp; Ash</span>
          <span className="flex items-center gap-4 text-[14px] font-[600] uppercase tracking-[0.14em]">
            Menu
            <span className="grid h-14 w-14 place-items-center rounded-full border border-white/40">
              <span className="block h-px w-5 bg-white shadow-[0_6px_0_#fff]" />
            </span>
          </span>
        </div>
        <div className="absolute bottom-0 left-0 px-[clamp(20px,5vw,96px)] pb-[clamp(28px,4vw,56px)] text-white">
          <p className="sx-display text-[clamp(48px,6vw,96px)] leading-none">Ash No. 7</p>
          <p className="mt-3 text-[16px] text-white/75">
            Smoked oud, saffron, dry rose · 50 ml <Price now="₹4,800" className="text-white" />
          </p>
        </div>

        {/* the overlay, clipped by a circle that grows from the menu button */}
        <div ref={ov} className="absolute inset-0 z-20 bg-[var(--sx-surface)]" style={{ clipPath: "circle(var(--nv07-r, 150%) at calc(100% - clamp(20px, 5vw, 96px) - 28px) 60px)" }}>
          <div className="nv07-glow pointer-events-none absolute left-[20%] top-[10%] aspect-square w-[60%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_22%,transparent),transparent)]" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-[clamp(20px,5vw,96px)] pt-8">
            <span className="sx-display text-[clamp(22px,1.8vw,28px)] italic">Oudh &amp; Ash</span>
            <span className="flex items-center gap-4 text-[14px] font-[600] uppercase tracking-[0.14em]">
              Close
              <span className="relative grid h-14 w-14 place-items-center rounded-full bg-[var(--sx-accent)] text-[var(--sx-accent-text)]">
                <span className="absolute h-px w-5 rotate-45 bg-current" />
                <span className="absolute h-px w-5 -rotate-45 bg-current" />
              </span>
            </span>
          </div>
          <nav className="relative flex h-full flex-col items-center justify-center gap-[clamp(4px,0.6vw,10px)] px-6" aria-label="Main">
            {links.map((l, k) => (
              <a key={l.t} data-nv07-row href="#" onClick={noop} onMouseEnter={() => setHi(k)} className={`flex items-start gap-[clamp(14px,1.6vw,24px)] transition-opacity duration-500 ${hi === -1 || hi === k ? "opacity-100" : "opacity-30"}`}>
                <span data-m-head className="sx-display text-[clamp(60px,8vw,128px)] leading-[1] tracking-[-0.03em]">
                  {l.t}
                </span>
                <span className={`mt-[1.2em] hidden w-[17ch] text-[14px] leading-snug md:block ${hi === k ? "text-[var(--sx-accent)]" : "text-[var(--sx-muted)]"}`}>{l.d}</span>
              </a>
            ))}
          </nav>
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap justify-between gap-4 px-[clamp(20px,5vw,96px)] pb-8 text-[14px] text-[var(--sx-muted)]">
            <span>Complimentary samples with every order</span>
            <span className="flex gap-6 text-[var(--sx-text)]">
              <a href="#" onClick={noop}>Instagram</a>
              <a href="#" onClick={noop}>Journal</a>
            </span>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── NV08 · Box grid menu ───────────────────────── */

/** NV08 · The menu opens as a bento of seven unequal boxes filling the screen: one large photo box for the main link,
 *  smaller link boxes, and a contact box. Boxes snap in from different sides; a highlight steps through the links. */
function NV08() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  const [hi] = useAutoCycle(r, 5, 1300);
  const box = (k: number) => (hi === k ? "bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "bg-[var(--sx-surface)]");
  const sub = (k: number) => (hi === k ? "text-[var(--sx-accent-text)] opacity-80" : "text-[var(--sx-muted)]");
  const cell = "relative flex flex-col justify-between overflow-hidden rounded-[var(--sx-radius)] border border-[var(--sx-line)] transition-colors duration-500";
  const pad = "p-[clamp(18px,2vw,30px)]";
  const word = "sx-display text-[clamp(40px,3.8vw,64px)] font-[800] leading-[0.9]";
  return (
    <Sec innerRef={r} theme="ink" font="condensed" className="py-[clamp(28px,3vw,44px)]">
      <style>{`
        .nv08-pic { animation: nv08-pic 5.5s ease-in-out infinite alternate; }
        @keyframes nv08-pic { from { transform: scale(1.04) translate(-2%, 1%); } to { transform: scale(1.16) translate(2%, -2%); } }
        .nv08-arrow { animation: nv08-arrow 1.7s ease-in-out infinite alternate; }
        @keyframes nv08-arrow { from { translate: -6px 6px; } to { translate: 6px -6px; } }
        html.is-static .nv08-pic, html.is-static .nv08-arrow { animation: none; }
        html.is-static { .nv08-pic, .nv08-arrow { animation: none; } }
      `}</style>
      <div className="flex items-center justify-between pb-[clamp(16px,2vw,26px)]">
        <span className="sx-display text-[clamp(24px,2vw,32px)] font-[800] tracking-[0.04em]">Rhea Atelier</span>
        <span className="text-[14px] font-[600] uppercase tracking-[0.14em]">Close ✕</span>
      </div>
      <nav aria-label="Main" className="grid grid-cols-1 gap-[clamp(8px,0.8vw,12px)] md:min-h-[clamp(620px,78svh,820px)] md:grid-cols-4 md:grid-rows-[repeat(3,minmax(0,1fr))]">
        {/* main link: large photo box */}
        <a href="#" onClick={noop} data-m-card className={`${cell} min-h-[340px] md:col-span-2 md:row-span-2 ${hi === 0 ? "ring-2 ring-[var(--sx-accent)]" : ""}`}>
          <div className="nv08-pic absolute inset-0">
            <Pic i={2} ratio="auto" round={false} className="absolute inset-0 h-full w-full" />
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,9,15,.1),rgba(7,9,15,.75))]" />
          <span className="nv08-arrow absolute right-[clamp(18px,2vw,30px)] top-[clamp(18px,2vw,30px)] grid h-14 w-14 place-items-center rounded-full bg-white text-[20px] text-[#07090f]">↗</span>
          <div className="relative mt-auto p-[clamp(20px,2.4vw,36px)] text-white">
            <p className="sx-display text-[clamp(72px,8vw,136px)] font-[800] leading-[0.85]">Projects</p>
            <p className="mt-3 text-[15px] text-white/75">42 homes and 6 restaurants across 9 cities</p>
          </div>
        </a>
        <a href="#" onClick={noop} data-m-card className={`${cell} ${pad} ${box(1)}`}>
          <span className={`text-[13px] uppercase tracking-[0.14em] ${sub(1)}`}>Who we are</span>
          <span className={word}>Studio</span>
        </a>
        {/* shop box: tall, with a product photo */}
        <a href="#" onClick={noop} data-m-card className={`${cell} ${pad} gap-4 md:row-span-2 ${box(2)}`}>
          <span className={word}>Objects</span>
          <Pic i={0} ratio="auto" className="min-h-[160px] w-full flex-1" />
          <span className={`text-[14px] ${sub(2)}`}>
            Lamps, rugs and stoneware · from <b className="font-[650]">₹3,800</b>
          </span>
        </a>
        <a href="#" onClick={noop} data-m-card className={`${cell} ${pad} ${box(3)}`}>
          <span className={`text-[13px] uppercase tracking-[0.14em] ${sub(3)}`}>Notes from site</span>
          <span className={word}>Journal</span>
        </a>
        <a href="#" onClick={noop} data-m-card className={`${cell} ${pad} ${box(4)}`}>
          <span className={`text-[13px] uppercase tracking-[0.14em] ${sub(4)}`}>Interiors · styling</span>
          <span className={word}>Services</span>
        </a>
        {/* contact box */}
        <div data-m-card className={`${cell} ${pad} border-dashed bg-transparent md:col-span-2`}>
          <p className="text-[13px] uppercase tracking-[0.14em] text-[var(--sx-muted)]">Start a project</p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[clamp(20px,1.8vw,26px)] font-[650]">hello@rhea-atelier.example</p>
              <p className="mt-1 text-[15px] text-[var(--sx-muted)]">Studio visits by appointment, Tuesday to Saturday</p>
            </div>
            <Btn>Book a call</Btn>
          </div>
        </div>
        <div data-m-card className={`${cell} ${pad} bg-[var(--sx-surface)]`}>
          <p className="text-[13px] uppercase tracking-[0.14em] text-[var(--sx-muted)]">Follow</p>
          <ul className="space-y-1.5 text-[16px] font-[600]">
            <li>Instagram</li>
            <li>Pinterest</li>
            <li>Monthly letter</li>
          </ul>
        </div>
      </nav>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "NV04", name: "Header morphs into a floating capsule", motion: "M6", C: NV04 },
  { code: "NV05", name: "Mega menu with featured story card", motion: "M23", C: NV05 },
  { code: "NV06", name: "Hover menu with one morphing panel", motion: "M18", C: NV06 },
  { code: "NV07", name: "Corner circle menu", motion: "M12", C: NV07 },
  { code: "NV08", name: "Box grid menu", motion: "M34", C: NV08 },
];
