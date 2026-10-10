"use client";

// PS · Product / shop layouts (docs/SECTION-MENU.md). Each is a full designed section; motion via useSectionMotion or fx.
// Anything that needs a click to show (variants, pack sizes, hotspots, steps) also cycles by itself while on screen.
import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { useScrub, useTicker } from "../fx/shared";
import { Btn, H, P, Pic, Price, Product, Sec, Stars } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const vars = (o: Record<string, string>) => o as CSSProperties;
const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

/** Auto-advance an index every `ms` while the section is on screen (hands-free filming). ?static=1 keeps index 0. */
function useCycle(ref: RefObject<HTMLElement | null>, n: number, ms = 2600) {
  const [i, setI] = useState(0);
  const paused = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let id: number | undefined;
    const stop = () => {
      if (id !== undefined) clearInterval(id);
      id = undefined;
    };
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && id === undefined) id = window.setInterval(() => !paused.current && setI((v) => (v + 1) % n), ms);
        else if (!e.isIntersecting) stop();
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      stop();
    };
  }, [ref, n, ms]);
  const hold = (k: number) => {
    paused.current = true;
    setI(k);
  };
  const release = () => {
    paused.current = false;
  };
  return [i, hold, release] as const;
}

/** A number that rolls to its new value whenever the target changes (the M3 counter, for prices that update). */
function useRollTo(target: number) {
  const [shown, setShown] = useState(target);
  const cur = useRef(target);
  useEffect(() => {
    if (prefersReducedMotion()) {
      cur.current = target;
      setShown(target);
      return;
    }
    const o = { v: cur.current };
    const tw = gsap.to(o, { v: target, duration: 0.7, ease: "power3.out", onUpdate: () => ((cur.current = o.v), setShown(o.v)) });
    return () => {
      tw.kill();
    };
  }, [target]);
  return shown;
}

/** PS01 · Product row: a heading column + three product cards (can, name, notes, price, Add) with a hover lift. */
function PS01() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  const items = [
    { name: "Nitro Original", notes: "Dark cocoa, toasted almond", price: "₹149", angle: 0, c: "#6b4a2f" },
    { name: "Vanilla Oat", notes: "Madagascar vanilla, oat milk", price: "₹169", angle: 1, c: "#c9a27a" },
    { name: "Salted Jaggery", notes: "Caramel, sea salt, a long finish", price: "₹169", angle: 0, c: "#a2552a" },
  ];
  return (
    <Sec innerRef={r} theme="paper" font="grotesk" className="py-[clamp(72px,9vw,140px)]" style={vars({ "--sx-accent": "#6b4a2f", "--sx-accent-text": "#fbf8f2" })}>
      <div className="grid grid-cols-1 gap-[clamp(14px,1.6vw,24px)] md:grid-cols-4">
        <div className="flex flex-col justify-between gap-8 md:pr-4">
          <div>
            <H className="text-[clamp(40px,4.4vw,72px)]">Cold brew, in three moods.</H>
            <P className="mt-5">Steeped for twelve hours, sealed with nitrogen, delivered cold.</P>
          </div>
          <div className="flex flex-col items-start gap-3">
            <Btn kind="link">All 11 brews →</Btn>
            <span className="text-[14px] text-[var(--sx-muted)]">Free delivery over ₹999</span>
          </div>
        </div>
        {items.map((p) => (
          <div key={p.name} data-m-card>
            <article className="group sx-card flex h-full flex-col p-[clamp(16px,1.6vw,22px)] transition-[translate,box-shadow] duration-500 ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-2 hover:shadow-[0_30px_60px_-30px_rgba(28,24,19,.35)]">
              <div className="relative grid aspect-[4/5] place-items-center overflow-hidden rounded-[14px] bg-[color-mix(in_srgb,var(--sx-bg)_70%,var(--sx-surface))]">
                <div className="absolute bottom-[12%] h-[8%] w-[46%] rounded-[50%] bg-[rgba(28,24,19,.18)] blur-md" />
                <Product angle={p.angle} accent={p.c} className="absolute inset-0 m-auto h-[82%] w-[82%] transition-[scale] duration-500 group-hover:scale-[1.04]" />
              </div>
              <div className="mt-5 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-[19px] font-[650]">{p.name}</h3>
                  <p className="mt-1 text-[14px] text-[var(--sx-muted)]">{p.notes}</p>
                </div>
                <Price now={p.price} className="text-[18px]" />
              </div>
              <Btn kind="ghost" className="mt-5 justify-center">Add to bag</Btn>
            </article>
          </div>
        ))}
      </div>
    </Sec>
  );
}

/** PS02 · Editorial product index: a typographic list (name ····· price); a preview image follows the active row. */
function PS02() {
  const r = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLOListElement>(null);
  useSectionMotion(r, "M23");
  const rows = [
    { name: "Vetiver Monsoon", fam: "Earthy · wet soil, vetiver", price: "₹6,400", i: 2 },
    { name: "Night Jasmine", fam: "Floral · mogra, musk", price: "₹5,900", i: 3 },
    { name: "Oud & Smoke", fam: "Woody · oud, birch tar", price: "₹8,200", i: 0 },
    { name: "Saffron Leather", fam: "Amber · saffron, suede", price: "₹7,600", i: 1 },
    { name: "Fig Courtyard", fam: "Green · fig leaf, cedar", price: "₹5,400", i: 2 },
  ];
  const preview = useRef<HTMLDivElement>(null);
  const [a, hold, release] = useCycle(r, rows.length, 2200);
  const [top, setTop] = useState(0);
  useEffect(() => {
    // centre the preview on the active row, kept inside the list's height so it never rides over the heading
    const place = () => {
      const li = list.current?.children[a] as HTMLElement | undefined;
      const h = preview.current?.offsetHeight ?? 0;
      const max = (list.current?.offsetHeight ?? 0) - h;
      if (li) setTop(Math.max(0, Math.min(max, li.offsetTop - (list.current?.offsetTop ?? 0) + li.offsetHeight / 2 - h / 2)));
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [a]);
  return (
    <Sec innerRef={r} theme="ink" font="editorial" className="py-[clamp(72px,9vw,140px)]" style={vars({ "--sx-accent": "#d9b77a", "--sx-accent-text": "#120d05" })}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-end">
        <H className="text-[clamp(52px,7vw,124px)] md:col-span-7">The fragrance index.</H>
        <P className="md:col-span-4 md:col-start-9">Five extraits de parfum, 50 ml each, blended in small batches in Kannauj.</P>
      </div>
      <div className="relative mt-[clamp(40px,6vw,80px)] grid grid-cols-1 gap-8 md:grid-cols-12">
        {/* phone: one preview above the list, swapping in place */}
        <div className="relative mx-auto aspect-[4/5] w-[min(100%,320px)] md:hidden">
          {rows.map((p, k) => (
            <div key={k} className={`absolute inset-0 transition-opacity duration-700 ${k === a ? "opacity-100" : "opacity-0"}`}>
              <Pic i={p.i} ratio="4/5" label={p.name.toUpperCase()} />
            </div>
          ))}
        </div>
        <ol ref={list} className="md:col-span-8" onMouseLeave={release}>
          {rows.map((p, k) => (
            <li
              key={p.name}
              onMouseEnter={() => hold(k)}
              className={`cursor-pointer border-b border-[var(--sx-line)] py-[clamp(16px,2vw,26px)] transition-colors duration-500 first:border-t ${k === a ? "text-[var(--sx-text)]" : "text-[var(--sx-muted)]"}`}
            >
              <div className="flex items-baseline gap-4">
                <span className="sx-display text-[clamp(28px,3.6vw,60px)] leading-none">{p.name}</span>
                <span className="mb-[0.35em] min-w-6 flex-1 border-b border-dotted border-current opacity-40" />
                <span className={`text-[clamp(16px,1.4vw,20px)] tabular-nums transition-colors ${k === a ? "text-[var(--sx-accent)]" : ""}`}>{p.price}</span>
              </div>
              <p className="mt-2 text-[14px] opacity-80">{p.fam}</p>
            </li>
          ))}
        </ol>
        {/* desktop: the preview glides to the active row */}
        <div className="relative max-md:hidden md:col-span-4">
          <div ref={preview} className="absolute inset-x-0 top-0 aspect-[4/5] transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)]" style={{ transform: `translateY(${top}px)` }}>
            {rows.map((p, k) => (
              <div key={k} className={`absolute inset-0 transition-[opacity,scale] duration-700 ${k === a ? "scale-100 opacity-100" : "scale-[0.94] opacity-0"}`}>
                <Pic i={p.i} ratio="4/5" label={p.name.toUpperCase()} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Sec>
  );
}

/** PS03 · Variant switcher: a big product, colour swatches, name and price that swap (auto-cycles). The section accent follows the variant. */
function PS03() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M6");
  const v = [
    { name: "Arctic Berry", note: "Blueberry, blackcurrant, a cold mint finish", price: "₹110", c: "#4b6bff" },
    { name: "Mango Chili", note: "Alphonso mango with a slow kanthari heat", price: "₹110", c: "#f08a1c" },
    { name: "Kokum Cola", note: "Cola nut, kokum, a little black salt", price: "₹120", c: "#c2264a" },
    { name: "Citrus Storm", note: "Lime, pomelo, ginger", price: "₹110", c: "#3fae4a" },
  ];
  const [a, hold, release] = useCycle(r, v.length, 2600);
  const cur = v[a];
  return (
    <Sec innerRef={r} theme="stone" font="wide" className="py-[clamp(72px,9vw,140px)]" style={vars({ "--sx-accent": cur.c, "--sx-accent-text": "#fff" })}>
      <div className="grid grid-cols-1 items-center gap-[clamp(32px,5vw,80px)] md:grid-cols-12">
        <div className="relative grid min-h-[min(70vh,620px)] place-items-center max-md:min-h-[400px] md:order-2 md:col-span-7">
          <div className="absolute aspect-square w-[min(90%,560px)] rounded-full transition-colors duration-700" style={{ background: `radial-gradient(closest-side, color-mix(in srgb, ${cur.c} 38%, transparent), transparent)` }} />
          {v.map((p, k) => (
            <div key={p.name} className={`absolute inset-0 grid place-items-center transition-[opacity,translate,rotate] duration-700 ease-[cubic-bezier(.22,1,.36,1)] ${k === a ? "translate-y-0 rotate-0 opacity-100" : "translate-y-8 rotate-[6deg] opacity-0"}`}>
              <Product angle={1} accent={p.c} className="h-[min(62vh,540px)] w-auto max-md:h-[360px]" />
            </div>
          ))}
        </div>
        <div className="md:order-1 md:col-span-5">
          <H className="text-[clamp(44px,5.4vw,92px)]">Pick your charge.</H>
          <P className="mt-5 max-w-[40ch]">Four flavours, one clean formula: 120 mg green-tea caffeine, B-vitamins, no sugar.</P>
          <div className="mt-10 border-t border-[var(--sx-line)] pt-6">
            <div className="flex items-baseline justify-between gap-4">
              <p key={cur.name} className="sx-display text-[clamp(28px,2.6vw,40px)] font-[800] leading-none text-[var(--sx-accent)] transition-colors">
                {cur.name}
              </p>
              <Price now={cur.price} className="text-[20px]" />
            </div>
            <p className="mt-2 min-h-[1.6em] text-[15px] text-[var(--sx-muted)]">{cur.note}</p>
            <div className="mt-6 flex gap-3" onMouseLeave={release}>
              {v.map((p, k) => (
                <button
                  key={p.name}
                  aria-label={p.name}
                  onMouseEnter={() => hold(k)}
                  onClick={() => hold(k)}
                  className={`size-11 rounded-full border-2 transition-[scale,border-color] duration-300 ${k === a ? "scale-110 border-[var(--sx-text)]" : "border-transparent"}`}
                  style={{ background: p.c }}
                />
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Btn>Add 6 · {inr(parseInt(cur.price.slice(1)) * 6)}</Btn>
              <Btn kind="ghost">Try the mixed pack</Btn>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/** PS04 · Spotlight: one product large, a spec table and a buy box (quantity, price, Add to cart). */
function PS04() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M3");
  const [qty, setQty] = useState(4);
  const unit = 180;
  const total = useRollTo(qty * unit);
  const specs: [string, string][] = [
    ["Volume", "330 ml"],
    ["Live cultures", "12 strains"],
    ["Sugar", "3.2 g"],
    ["Brewed for", "21 days"],
    ["Calories", "18 kcal"],
  ];
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]" style={vars({ "--sx-accent": "#3f6b3a", "--sx-accent-text": "#fbf8f2" })}>
      <div className="grid grid-cols-1 items-center gap-[clamp(32px,5vw,72px)] md:grid-cols-12">
        <div className="relative grid place-items-center md:col-span-5">
          <div className="absolute aspect-square w-[85%] rounded-full bg-[var(--sx-surface)]" />
          <Product angle={0} accent="#3f6b3a" className="relative h-[min(68vh,600px)] w-auto max-md:h-[380px]" />
        </div>
        <div className="md:col-span-7">
          <div className="flex items-center gap-3 text-[14px] text-[var(--sx-muted)]">
            <Stars n={5} /> 4.9 from 1,860 reviews
          </div>
          <H className="mt-4 text-[clamp(44px,5.4vw,88px)]">Tulsi Ginger Kombucha</H>
          <P className="mt-5 max-w-[48ch]">Raw, unpasteurised and brewed in small oak vats with holy basil and a fresh ginger kick.</P>
          <div className="mt-8 grid grid-cols-1 gap-[clamp(16px,2vw,28px)] lg:grid-cols-[1fr_minmax(260px,320px)]">
            <dl className="border-t border-[var(--sx-line)]">
              {specs.map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-4 border-b border-[var(--sx-line)] py-3 text-[15px]">
                  <dt className="text-[var(--sx-muted)]">{k}</dt>
                  <dd data-m-num className="font-[600] tabular-nums">
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
            <div data-m-card className="sx-card flex flex-col gap-5 p-6">
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-[var(--sx-muted)]">Quantity</span>
                <div className="flex items-center rounded-full border border-[var(--sx-line)]">
                  <button aria-label="Less" onClick={() => setQty((q) => Math.max(1, q - 1))} className="size-10 text-[18px]">
                    −
                  </button>
                  <span className="w-8 text-center tabular-nums">{qty}</span>
                  <button aria-label="More" onClick={() => setQty((q) => Math.min(24, q + 1))} className="size-10 text-[18px]">
                    +
                  </button>
                </div>
              </div>
              <div className="flex items-baseline justify-between border-t border-[var(--sx-line)] pt-4">
                <span className="text-[14px] text-[var(--sx-muted)]">{inr(unit)} each</span>
                <span className="text-[30px] font-[650] tabular-nums">{inr(total)}</span>
              </div>
              <Btn className="justify-center">Add to cart</Btn>
              <p className="text-center text-[13px] text-[var(--sx-muted)]">Ships chilled · arrives in 2 days</p>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/** PS05 · Shelf: a row of product cards that drifts sideways on its own and bends/speeds up with the scroll (M44, cards instead of words). */
function PS05() {
  const r = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const vel = useRef(0);
  const smooth = useRef(0);
  const x = useRef(0);
  useScrub(r, (_, v) => (vel.current = v), { finalValue: 0 });
  useTicker(r, (_, dt) => {
    smooth.current += (vel.current - smooth.current) * 0.08;
    vel.current *= 0.92;
    const items = row.current!.children as HTMLCollectionOf<HTMLElement>;
    const half = row.current!.scrollWidth / 2;
    x.current = (x.current - dt * (40 + Math.abs(smooth.current) * 500)) % half;
    const w = r.current!.clientWidth;
    for (const it of items) {
      const n = gsap.utils.clamp(0, 1, (it.offsetLeft + x.current + it.offsetWidth / 2) / w);
      const y = Math.sin(n * Math.PI) * smooth.current * 140;
      it.style.transform = `translate3d(${x.current}px, ${y}px, 0) rotate(${(n - 0.5) * smooth.current * -14}deg)`;
    }
  });
  const shoes = [
    { name: "Strata Runner", tag: "Road", price: "₹11,999", i: 0 },
    { name: "Kettle Trail", tag: "Trail", price: "₹13,499", i: 2 },
    { name: "Loom Knit Low", tag: "Everyday", price: "₹8,999", i: 1 },
    { name: "Tempo Spike", tag: "Track", price: "₹15,999", i: 3 },
    { name: "Drift Slide", tag: "Recovery", price: "₹3,499", i: 2 },
    { name: "Arc Court", tag: "Court", price: "₹9,499", i: 0 },
  ];
  return (
    <Sec innerRef={r} theme="ink" font="condensed" full className="py-[clamp(72px,9vw,140px)]" style={vars({ "--sx-accent": "#ff5a36", "--sx-accent-text": "#120604" })}>
      <div className="flex flex-wrap items-end justify-between gap-6 px-[clamp(20px,5vw,96px)]">
        <H className="max-w-[14ch] text-[clamp(56px,8vw,140px)] leading-[0.86]">The whole shelf, moving.</H>
        <div className="max-w-[32ch]">
          <P>Six silhouettes for road, trail and rest days. Free returns for 30 days.</P>
          <div className="mt-5">
            <Btn>Shop all shoes</Btn>
          </div>
        </div>
      </div>
      <div className="mt-[clamp(40px,6vw,80px)] overflow-hidden">
        <div ref={row} className="flex w-max gap-[clamp(12px,1.4vw,20px)] py-10">
          {[...shoes, ...shoes].map((s, k) => (
            <article key={k} className="sx-card w-[clamp(220px,22vw,320px)] shrink-0 p-3 will-change-transform">
              <Pic i={s.i} ratio="1/1" label={s.tag.toUpperCase()} />
              <div className="flex items-baseline justify-between gap-3 px-2 pb-2 pt-4">
                <span className="text-[17px] font-[650]">{s.name}</span>
                <Price now={s.price} className="text-[15px] text-[var(--sx-accent)]" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </Sec>
  );
}

/** PS06 · Pack-size selector: single / 6-pack / 12-pack; price and per-unit price roll to the new value (auto-cycles). */
function PS06() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M3");
  const packs = [
    { k: "Single", n: 1, total: 99, save: "" },
    { k: "6-pack", n: 6, total: 540, save: "Save 9%" },
    { k: "12-pack", n: 12, total: 984, save: "Save 17%" },
  ];
  const [a, hold, release] = useCycle(r, packs.length, 2400);
  const p = packs[a];
  const total = useRollTo(p.total);
  const unit = useRollTo(p.total / p.n);
  return (
    <Sec innerRef={r} theme="stone" font="grotesk" className="py-[clamp(72px,9vw,140px)]" style={vars({ "--sx-accent": "#0e7c86", "--sx-accent-text": "#f7f8f9" })}>
      <div className="grid grid-cols-1 items-center gap-[clamp(32px,5vw,80px)] md:grid-cols-12">
        <div className="relative flex items-end justify-center gap-0 md:col-span-6">
          <div className="absolute bottom-0 h-[70%] w-[90%] rounded-[var(--sx-radius)] bg-[var(--sx-surface)]" />
          {[2, 0, 1].map((ang, k) => (
            <div key={k} className={`relative transition-[opacity,translate] duration-700 ${k === 1 || p.n > 1 ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} ${k !== 1 ? "-mx-[6%]" : "z-10"}`}>
              <Product angle={ang} accent="#0e7c86" className={`w-auto ${k === 1 ? "h-[min(56vh,480px)] max-md:h-[300px]" : "h-[min(44vh,380px)] max-md:h-[230px]"}`} />
            </div>
          ))}
        </div>
        <div className="md:col-span-6">
          <H className="text-[clamp(44px,5.4vw,92px)]">Stock the fridge, pay less.</H>
          <P className="mt-5 max-w-[44ch]">Daybreak electrolyte water: sodium, potassium and magnesium in a 500 ml can, no sugar.</P>
          <div className="mt-9 grid grid-cols-3 rounded-full border border-[var(--sx-line)] bg-[var(--sx-surface)] p-1.5" onMouseLeave={release}>
            {packs.map((q, k) => (
              <button
                key={q.k}
                onMouseEnter={() => hold(k)}
                onClick={() => hold(k)}
                className={`rounded-full px-2 py-3 text-[15px] font-[650] transition-colors duration-300 ${k === a ? "bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "text-[var(--sx-muted)]"}`}
              >
                {q.k}
              </button>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-end justify-between gap-6 border-b border-[var(--sx-line)] pb-6">
            <div>
              <p className="text-[clamp(52px,5.6vw,88px)] font-[700] leading-none tracking-[-0.03em] tabular-nums">{inr(total)}</p>
              <p className="mt-2 text-[15px] text-[var(--sx-muted)]">
                <span className="tabular-nums">{inr(unit)}</span> per can
                <span className={`ml-3 rounded-full bg-[color-mix(in_srgb,var(--sx-accent)_14%,transparent)] px-2.5 py-1 text-[13px] font-[650] text-[var(--sx-accent)] transition-opacity ${p.save ? "opacity-100" : "opacity-0"}`}>{p.save || "·"}</span>
              </p>
            </div>
            <Btn>Add to cart</Btn>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4 text-[14px] text-[var(--sx-muted)]">
            <p>
              <b data-m-num className="block text-[22px] text-[var(--sx-text)]">
                1,200
              </b>
              mg sodium / L
            </p>
            <p>
              <b data-m-num className="block text-[22px] text-[var(--sx-text)]">
                0
              </b>
              g sugar
            </p>
            <p>
              <b data-m-num className="block text-[22px] text-[var(--sx-text)]">
                14
              </b>
              kcal per can
            </p>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/** PS07 · Configurator: three steps joined by arrows: pick a model (line drawings), pick a finish (swatches), order. Auto-plays. */
const CHAIRS = [
  // simple line drawings, 120×120 viewBox
  "M30 20v80M30 60h60v40M90 60V96M30 60c0-10 4-14 10-14h40c6 0 10 4 10 14",
  "M40 14h40v42H40zM34 62h52M40 62v44M80 62v44M40 84h40",
  "M24 50c0-18 14-30 36-30s36 12 36 30v14H24zM20 64h80v14H20zM32 78l-6 28M88 78l6 28",
];
function PS07() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M18");
  const models = [
    { name: "Ira Lounge", base: 38000 },
    { name: "Kora Dining", base: 18500 },
    { name: "Nilo Club", base: 54000 },
  ];
  const finishes = [
    { name: "Natural oak", c: "#d6b48a", add: 0 },
    { name: "Smoked walnut", c: "#5a3b26", add: 4500 },
    { name: "Ebonised ash", c: "#22201d", add: 3000 },
  ];
  const [t] = useCycle(r, 9, 1700);
  const m = Math.floor(t / 3) % 3;
  const f = t % 3;
  const price = useRollTo(models[m].base + finishes[f].add);
  const arrow = (
    <div className="grid place-items-center text-[28px] text-[var(--sx-muted)] max-md:rotate-90" aria-hidden>
      →
    </div>
  );
  return (
    <Sec innerRef={r} theme="stone" font="serif" className="py-[clamp(72px,9vw,140px)]" style={vars({ "--sx-accent": "#8a4b2a", "--sx-accent-text": "#f7f8f9" })}>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[14ch] text-[clamp(44px,5.6vw,96px)]">Build your chair, in three steps.</H>
        <P className="max-w-[34ch]">Every piece is made to order in our Mysuru workshop and delivered in six weeks.</P>
      </div>
      <div className="mt-[clamp(36px,5vw,64px)] grid grid-cols-1 gap-4 md:grid-cols-[1fr_40px_1fr_40px_1fr]">
        <div data-m-card className="sx-card p-[clamp(20px,2vw,30px)]">
          <p className="text-[14px] text-[var(--sx-muted)]">Step 1 · Model</p>
          <div className="mt-5 grid grid-cols-3 gap-3">
            {models.map((x, k) => (
              <div key={x.name} className={`rounded-[14px] border p-2 text-center transition-colors duration-500 ${k === m ? "border-[var(--sx-accent)] text-[var(--sx-accent)]" : "border-[var(--sx-line)] text-[var(--sx-muted)]"}`}>
                <svg viewBox="0 0 120 120" className="mx-auto aspect-square w-full" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d={CHAIRS[k]} />
                </svg>
                <p className="mt-1 text-[12px] font-[600] leading-tight">{x.name}</p>
              </div>
            ))}
          </div>
        </div>
        {arrow}
        <div data-m-card className="sx-card p-[clamp(20px,2vw,30px)]">
          <p className="text-[14px] text-[var(--sx-muted)]">Step 2 · Finish</p>
          <div className="mt-5 flex gap-4">
            {finishes.map((x, k) => (
              <span key={x.name} className={`size-14 rounded-full ring-2 ring-offset-4 ring-offset-[var(--sx-surface)] transition-shadow duration-500 ${k === f ? "ring-[var(--sx-accent)]" : "ring-transparent"}`} style={{ background: x.c }} />
            ))}
          </div>
          <p className="sx-display mt-6 text-[clamp(24px,2vw,32px)] leading-tight">{finishes[f].name}</p>
          <p className="mt-1 text-[14px] text-[var(--sx-muted)]">{finishes[f].add ? `+ ${inr(finishes[f].add)}` : "Included"}</p>
        </div>
        {arrow}
        <div data-m-card className="flex flex-col justify-between gap-6 rounded-[var(--sx-radius)] bg-[var(--sx-text)] p-[clamp(20px,2vw,30px)] text-[var(--sx-bg)]">
          <p className="text-[14px] opacity-60">Step 3 · Order</p>
          <div>
            <p className="sx-display text-[clamp(26px,2.2vw,36px)] leading-tight">{models[m].name}</p>
            <p className="mt-1 text-[14px] opacity-60">in {finishes[f].name.toLowerCase()}</p>
            <p className="mt-5 text-[clamp(36px,3.4vw,52px)] font-[650] leading-none tabular-nums">{inr(price)}</p>
          </div>
          <a href="#" onClick={(e) => e.preventDefault()} className="sx-btn sx-btn-solid justify-center">
            Reserve with ₹5,000
          </a>
        </div>
      </div>
    </Sec>
  );
}

/** PS08 · Shop the look: one big photo with three numbered pulsing hotspots + the product list beside it (auto-cycles the active item). */
const PS08_CSS = `
.ps08-dot::before{content:"";position:absolute;inset:-6px;border-radius:999px;border:2px solid #fff;opacity:.8;animation:ps08-pulse 2s cubic-bezier(.22,1,.36,1) infinite}
@keyframes ps08-pulse{0%{transform:scale(.7);opacity:.9}100%{transform:scale(1.9);opacity:0}}
.is-static .ps08-dot::before{animation:none;opacity:0}
html.is-static {.ps08-dot::before{animation:none;opacity:0}}
`;
function PS08() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M1");
  const items = [
    { name: "Ochre wrap shirt", note: "Washed linen, relaxed fit", price: "₹4,600", x: 46, y: 30, i: 3 },
    { name: "Wide pleat trousers", note: "Linen-cotton, sand", price: "₹3,900", x: 52, y: 64, i: 1 },
    { name: "Woven jute tote", note: "Hand-braided in Assam", price: "₹2,200", x: 28, y: 58, i: 2 },
  ];
  const [a, hold, release] = useCycle(r, items.length, 2400);
  return (
    <Sec innerRef={r} theme="paper" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <style>{PS08_CSS}</style>
      <div className="grid grid-cols-1 items-center gap-[clamp(28px,4vw,64px)] md:grid-cols-12">
        <div className="relative md:col-span-7">
          <Pic i={0} ratio="4/5" label="THE MONSOON LOOK" />
          {items.map((p, k) => (
            <button
              key={p.name}
              aria-label={p.name}
              onMouseEnter={() => hold(k)}
              onMouseLeave={release}
              className={`ps08-dot absolute grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-[14px] font-[700] transition-[background-color,color,scale] duration-500 ${k === a ? "scale-110 bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "bg-white text-[#1c1813]"}`}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              {k + 1}
            </button>
          ))}
        </div>
        <div className="md:col-span-5">
          <H className="text-[clamp(44px,5.4vw,88px)]">Shop the monsoon look.</H>
          <P className="mt-5 max-w-[40ch]">Three pieces, one easy outfit for wet afternoons. Breathes in the heat, dries by evening.</P>
          <ul className="mt-8 border-t border-[var(--sx-line)]" onMouseLeave={release}>
            {items.map((p, k) => (
              <li
                key={p.name}
                onMouseEnter={() => hold(k)}
                className={`flex items-center gap-4 border-b border-[var(--sx-line)] py-4 transition-opacity duration-500 ${k === a ? "opacity-100" : "opacity-55"}`}
              >
                <span className={`grid size-8 shrink-0 place-items-center rounded-full text-[13px] font-[700] transition-colors duration-500 ${k === a ? "bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "border border-[var(--sx-line)]"}`}>{k + 1}</span>
                <span className="w-14 shrink-0">
                  <Pic i={p.i} ratio="1/1" round />
                </span>
                <span className="min-w-0 flex-1">
                  <b className="block text-[17px] font-[650]">{p.name}</b>
                  <span className="text-[14px] text-[var(--sx-muted)]">{p.note}</span>
                </span>
                <Price now={p.price} className="text-[16px]" />
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Btn>Add the look · ₹10,700</Btn>
            <span className="text-[14px] text-[var(--sx-muted)]">Save ₹1,000 on all three</span>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const PRODUCT: SectionDef[] = [
  { code: "PS01", name: "Product row with hover lift", motion: "M34", C: PS01 },
  { code: "PS02", name: "Editorial product index with following preview", motion: "M23", C: PS02 },
  { code: "PS03", name: "Variant switcher (auto-cycles)", motion: "M6", C: PS03 },
  { code: "PS04", name: "Spotlight: product, spec table, buy box", motion: "M3", C: PS04 },
  { code: "PS05", name: "Shelf of cards drifting and bending with scroll", motion: "M44", C: PS05 },
  { code: "PS06", name: "Pack-size selector with rolling prices", motion: "M3", C: PS06 },
  { code: "PS07", name: "Three-step configurator", motion: "M18", C: PS07 },
  { code: "PS08", name: "Shop the look with pulsing hotspots", motion: "M1", C: PS08 },
];
