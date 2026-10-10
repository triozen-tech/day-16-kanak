"use client";

// BN · Bento layouts (docs/SECTION-MENU.md). Each is a full designed section; motion via useSectionMotion or fx.
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { ShineText } from "../fx/text";
import { Avatar, Btn, H, P, Pic, Price, Product, Sec, Stars } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const vars = (o: Record<string, string>) => o as CSSProperties;

/** BN01 · Classic bento: one 2×2 hero cell + an image cell, a stat cell and a wide quote cell. */
function BN01() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[13ch] text-[clamp(44px,5.6vw,92px)]">Skin that drinks, not shines.</H>
        <P className="max-w-[36ch]">A three-step ritual built around one fermented rice essence. Fragrance-free, made for humid cities.</P>
      </div>
      <div className="mt-[clamp(36px,5vw,64px)] grid grid-cols-1 gap-[clamp(12px,1.4vw,20px)] md:grid-cols-4 md:grid-rows-[repeat(2,minmax(240px,auto))]">
        <div data-m-card className="sx-card relative overflow-hidden p-0 max-md:min-h-[520px] md:col-span-2 md:row-span-2">
          <Pic i={1} ratio="auto" round={false} className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgba(20,16,12,.78))]" />
          <div className="absolute inset-x-0 bottom-0 p-[clamp(20px,2.4vw,36px)] text-white">
            <p className="sx-display text-[clamp(30px,3vw,48px)] leading-[1]">The Rice Essence</p>
            <p className="mt-2 max-w-[38ch] text-[15px] text-white/75">Seven-day fermented, 92% rice ferment filtrate. 150 ml.</p>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <Btn>Add · ₹1,450</Btn>
              <Btn kind="link" className="!text-white">The ritual →</Btn>
            </div>
          </div>
        </div>
        <div data-m-card className="sx-card overflow-hidden">
          <Pic i={2} ratio="auto" round={false} className="h-full min-h-[240px] w-full" label="TEXTURE" />
        </div>
        <div data-m-card className="sx-card flex flex-col justify-between p-[clamp(20px,2vw,30px)]">
          <p className="text-[14px] text-[var(--sx-muted)]">After four weeks of daily use</p>
          <div>
            <p className="sx-display text-[clamp(64px,6vw,104px)] leading-[0.9] text-[var(--sx-accent)]">+41%</p>
            <p className="mt-2 text-[15px]">skin hydration, measured in a 60-person panel.</p>
          </div>
        </div>
        <figure data-m-card className="sx-card flex flex-col justify-between gap-6 p-[clamp(20px,2vw,30px)] md:col-span-2">
          <blockquote className="sx-display text-[clamp(22px,2vw,32px)] leading-[1.2]">“The only essence that sits right under sunscreen in Chennai heat.”</blockquote>
          <figcaption className="flex items-center gap-3 text-[14px]">
            <Avatar name="Ira Menon" i={1} size={36} />
            <span>
              <b className="block font-[650]">Ira Menon</b>
              <span className="text-[var(--sx-muted)]">Verified buyer · <Stars n={5} /></span>
            </span>
          </figcaption>
        </figure>
      </div>
    </Sec>
  );
}

/** BN02 · Product cell (tall), big-stat cell, review cell and a wide CTA cell. */
function BN02() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M18");
  return (
    <Sec innerRef={r} theme="ink" font="condensed" className="py-[clamp(72px,9vw,140px)]" style={vars({ "--sx-accent": "#c6ff3d", "--sx-accent-text": "#0a0d06" })}>
      <H className="max-w-[16ch] text-[clamp(52px,7vw,120px)]">Zero sugar. Full voltage.</H>
      <div className="mt-[clamp(36px,5vw,64px)] grid grid-cols-1 gap-[clamp(12px,1.4vw,20px)] md:grid-cols-3">
        <div data-m-card className="sx-card relative grid place-items-center overflow-hidden px-6 pb-8 pt-12 md:row-span-2">
          <div className="absolute inset-x-0 top-1/4 mx-auto aspect-square w-[80%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_40%,transparent),transparent)]" />
          <Product angle={1} accent="#c6ff3d" className="relative h-[min(52vh,460px)] w-auto max-md:h-[300px]" />
          <div className="relative mt-6 w-full text-center">
            <p className="sx-display text-[28px]">Kite Lime</p>
            <p className="mt-1 text-[14px] text-[var(--sx-muted)]">250 ml · 80 mg natural caffeine</p>
          </div>
        </div>
        <div data-m-card className="sx-card flex flex-col justify-between gap-8 p-[clamp(22px,2.2vw,34px)]">
          <p className="text-[14px] uppercase tracking-[0.14em] text-[var(--sx-muted)]">Calories per can</p>
          <p className="sx-display text-[clamp(96px,10vw,168px)] leading-[0.82] text-[var(--sx-accent)]">9</p>
          <p className="text-[15px] text-[var(--sx-muted)]">Sweetened with stevia leaf and a little monk fruit.</p>
        </div>
        <figure data-m-card className="sx-card flex flex-col justify-between gap-6 p-[clamp(22px,2.2vw,34px)]">
          <Stars n={5} />
          <blockquote className="text-[clamp(18px,1.5vw,22px)] leading-snug">“Clean lift for a 6 a.m. shift, no crash by lunch. I keep a crate in the car.”</blockquote>
          <figcaption className="flex items-center gap-3 text-[14px]">
            <Avatar name="Kabir Shah" i={0} size={36} />
            <span>
              <b className="block font-[650]">Kabir Shah</b>
              <span className="text-[var(--sx-muted)]">Night-shift nurse, Pune</span>
            </span>
          </figcaption>
        </figure>
        <div data-m-card className="flex flex-wrap items-center justify-between gap-6 rounded-[var(--sx-radius)] bg-[var(--sx-accent)] p-[clamp(22px,2.4vw,36px)] text-[var(--sx-accent-text)] md:col-span-2">
          <div>
            <p className="sx-display text-[clamp(32px,3.2vw,52px)] leading-[0.95]">First crate, 20% off</p>
            <p className="mt-2 text-[15px] opacity-75">
              12 cans <Price now="₹1,152" was="₹1,440" />
            </p>
          </div>
          <a href="#" onClick={(e) => e.preventDefault()} className="sx-btn bg-[var(--sx-accent-text)] text-[var(--sx-accent)]">
            Claim the crate →
          </a>
        </div>
      </div>
    </Sec>
  );
}

/** BN03 · Asymmetric rows: 8/4 then 4/8. Pictures and text cards swap sides row to row. */
function BN03() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M31");
  return (
    <Sec innerRef={r} theme="stone" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-end">
        <H className="text-[clamp(48px,6.4vw,112px)] md:col-span-7">Furniture that stays for decades.</H>
        <P className="md:col-span-4 md:col-start-9">Solid teak and cane, joined without a single screw. Every piece ships flat-free, fully built.</P>
      </div>
      <div className="mt-[clamp(36px,5vw,64px)] grid grid-cols-1 gap-[clamp(12px,1.4vw,20px)] md:grid-cols-12">
        <Pic i={2} ratio="16/10" className="md:col-span-8" label="THE KORA LOUNGE" />
        <div data-m-card className="sx-card flex flex-col justify-between gap-8 p-[clamp(22px,2.2vw,34px)] md:col-span-4">
          <div>
            <p className="sx-display text-[clamp(30px,2.6vw,42px)] leading-[1.05]">Kora Lounge Chair</p>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--sx-muted)]">Hand-woven cane back, kiln-dried teak frame, a seat set at 38 cm for long evenings.</p>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-[var(--sx-line)] pt-5">
            <Price now="₹48,500" className="text-[20px]" />
            <Btn kind="link">View →</Btn>
          </div>
        </div>
        <div data-m-card className="sx-card flex flex-col justify-between gap-8 p-[clamp(22px,2.2vw,34px)] max-md:order-last md:col-span-4">
          <p className="sx-display text-[clamp(26px,2.2vw,36px)] leading-[1.15]">“Built by four families of joiners in Saharanpur, signed under the seat.”</p>
          <div className="grid grid-cols-2 gap-4 border-t border-[var(--sx-line)] pt-5 text-[14px]">
            <p>
              <b className="block text-[22px] font-[650]">25 yr</b>
              <span className="text-[var(--sx-muted)]">frame warranty</span>
            </p>
            <p>
              <b className="block text-[22px] font-[650]">6 wk</b>
              <span className="text-[var(--sx-muted)]">made to order</span>
            </p>
          </div>
        </div>
        <Pic i={0} ratio="16/10" className="md:col-span-8" label="THE WORKSHOP" />
      </div>
    </Sec>
  );
}

/** BN04 · Launch bento: a ticking countdown cell, the product and three perks. */
function BN04() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M3");
  // fixed start value (same on server and client), ticks down once on screen; ?static=1 keeps the start value
  const [left, setLeft] = useState(12 * 86400 + 7 * 3600 + 41 * 60 + 26);
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    let id: number | undefined;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && id === undefined) id = window.setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
      else if (!e.isIntersecting && id !== undefined) {
        clearInterval(id);
        id = undefined;
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      if (id !== undefined) clearInterval(id);
    };
  }, []);
  const parts: [string, number][] = [
    ["Days", Math.floor(left / 86400)],
    ["Hrs", Math.floor((left % 86400) / 3600)],
    ["Min", Math.floor((left % 3600) / 60)],
    ["Sec", left % 60],
  ];
  return (
    <Sec innerRef={r} theme="ink" font="wide" className="py-[clamp(72px,9vw,140px)]" style={vars({ "--sx-accent": "#ff6a3d", "--sx-accent-text": "#120804" })}>
      <div className="grid grid-cols-1 gap-[clamp(12px,1.4vw,20px)] md:grid-cols-6">
        <div data-m-card className="sx-card flex flex-col justify-between gap-10 p-[clamp(24px,3vw,48px)] md:col-span-4">
          <div>
            <H className="max-w-[14ch] text-[clamp(40px,4.8vw,80px)]">Runner 02 drops soon.</H>
            <P className="mt-4 max-w-[44ch]">A 7.4 mm carbon plate under a foam that comes back every stride. Only a few thousand pairs in the first run.</P>
          </div>
          <div className="grid grid-cols-4 gap-[clamp(6px,1vw,16px)]">
            {parts.map(([k, v]) => (
              <div key={k} className="rounded-[14px] border border-[var(--sx-line)] bg-[var(--sx-bg)] px-2 py-[clamp(14px,2vw,26px)] text-center">
                <p className="sx-display text-[clamp(30px,4.6vw,76px)] leading-none tabular-nums">{String(v).padStart(2, "0")}</p>
                <p className="mt-2 text-[12px] uppercase tracking-[0.16em] text-[var(--sx-muted)]">{k}</p>
              </div>
            ))}
          </div>
        </div>
        <div data-m-card className="sx-card overflow-hidden md:col-span-2">
          <Pic i={3} ratio="4/5" round={false} className="h-full w-full" label="RUNNER 02" />
        </div>
        {[
          ["2,400", "pairs in the first run", "Numbered tongue tag"],
          ["48", "hr early access", "For list members only"],
          ["₹0", "delivery and returns", "Across 19,000 pin codes"],
        ].map(([n, t, s], i) => (
          <div key={t} data-m-card className={`sx-card flex flex-col justify-between gap-6 p-[clamp(22px,2.2vw,32px)] md:col-span-2 ${i === 2 ? "bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : ""}`}>
            <p className="text-[14px] opacity-70">{s}</p>
            <p>
              <span data-m-num className="sx-display block text-[clamp(44px,4.4vw,72px)] leading-none">
                {n}
              </span>
              <span className="mt-2 block text-[15px]">{t}</span>
            </p>
          </div>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Btn>Join the drop list</Btn>
        <span className="text-[14px] text-[var(--sx-muted)]">
          Launch price <Price now="₹14,999" className="text-[var(--sx-text)]" />
        </span>
      </div>
    </Sec>
  );
}

/** BN05 · Photo mosaic: all-image bento in three drifting columns, captions on a bottom gradient. */
function BN05() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M32");
  const cols: { i: number; ratio: string; t: string; s: string }[][] = [
    [
      { i: 3, ratio: "3/4", t: "Sand overshirt", s: "₹4,200" },
      { i: 1, ratio: "1/1", t: "Washed sheets", s: "₹6,800" },
    ],
    [
      { i: 2, ratio: "4/5", t: "Clay wide trousers", s: "₹3,900" },
      { i: 0, ratio: "3/4", t: "The Jaipur atelier", s: "Since 2014" },
    ],
    [
      { i: 1, ratio: "1/1", t: "Indigo kurta", s: "₹3,600" },
      { i: 3, ratio: "4/5", t: "Rust slip dress", s: "₹5,200" },
    ],
  ];
  return (
    <Sec innerRef={r} theme="paper" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[12ch] text-[clamp(48px,6.4vw,112px)]">Worn in, from day one.</H>
        <div className="max-w-[34ch]">
          <P>Garment-washed linen in six earth tones. Softer at every wash, never stiff.</P>
          <div className="mt-5">
            <Btn kind="link">Shop the summer edit →</Btn>
          </div>
        </div>
      </div>
      <div className="mt-[clamp(40px,6vw,88px)] grid grid-cols-2 items-start gap-[clamp(10px,1.4vw,20px)] md:grid-cols-3">
        {cols.map((col, c) => (
          <div key={c} data-m-col className={`grid gap-[clamp(10px,1.4vw,20px)] ${c === 1 ? "md:mt-[12%]" : ""} ${c === 2 ? "max-md:hidden" : ""}`}>
            {col.map((p) => (
              <figure key={p.t} className="relative overflow-hidden rounded-[var(--sx-radius)]">
                <Pic i={p.i} ratio={p.ratio} round={false} />
                <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-[linear-gradient(180deg,transparent,rgba(20,16,12,.75))] px-[clamp(12px,1.4vw,20px)] pb-[clamp(12px,1.4vw,18px)] pt-14 text-white">
                  <span className="sx-display text-[clamp(18px,1.7vw,26px)] leading-[1.05]">{p.t}</span>
                  <span className="shrink-0 text-[13px] text-white/75">{p.s}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        ))}
      </div>
    </Sec>
  );
}

/** BN06 · Flavour bento: one colour cell per variant (its own accent), the can in each. */
function BN06() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  const flavours = [
    { name: "Yuzu Green", note: "Sencha, yuzu peel, a pinch of salt", price: "₹120", bg: "#d8f0a8", ink: "#16220a", can: "#7fb82e", cls: "md:col-span-2 md:row-span-2", big: true },
    { name: "Hibiscus Rose", note: "Hibiscus, rose, sour plum", price: "₹120", bg: "#f6b7c4", ink: "#2a0b12", can: "#d1365a", cls: "md:col-span-2", big: false },
    { name: "Masala Peach", note: "White tea, peach, cardamom", price: "₹130", bg: "#ffd3a1", ink: "#2b1606", can: "#e27a1f", cls: "", big: false },
    { name: "Blue Butterfly", note: "Butterfly pea, lime, mint", price: "₹130", bg: "#b7cff8", ink: "#0a1630", can: "#3561c9", cls: "", big: false },
  ];
  return (
    <Sec innerRef={r} theme="stone" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[14ch] text-[clamp(44px,5.6vw,96px)]">Four teas, lightly sparkling.</H>
        <Btn kind="ghost">Mixed case · ₹1,440</Btn>
      </div>
      <div className="mt-[clamp(36px,5vw,64px)] grid grid-cols-1 gap-[clamp(12px,1.4vw,20px)] sm:grid-cols-2 md:grid-cols-4 md:grid-rows-[repeat(2,minmax(260px,auto))]">
        {flavours.map((f) => (
          <div
            key={f.name}
            data-m-card
            className={`relative flex overflow-hidden rounded-[var(--sx-radius)] p-[clamp(20px,2vw,30px)] ${f.big ? "flex-col justify-between max-sm:min-h-[460px]" : "min-h-[260px] items-end"} ${f.cls}`}
            style={{ background: f.bg, color: f.ink }}
          >
            <div className={`relative z-10 ${f.big ? "" : "max-w-[58%]"}`}>
              <p className={`sx-display font-[700] leading-[0.95] tracking-[-0.02em] ${f.big ? "text-[clamp(40px,4.4vw,72px)]" : "text-[clamp(24px,2vw,32px)]"}`}>{f.name}</p>
              <p className="mt-2 text-[14px] opacity-70">{f.note}</p>
              <p className="mt-4 text-[15px] font-[650]">{f.price} / can</p>
            </div>
            <Product
              angle={f.big ? 0 : 1}
              accent={f.can}
              className={f.big ? "relative mx-auto mt-6 h-[min(46vh,420px)] w-auto max-md:h-[300px]" : "absolute -bottom-6 right-2 h-[88%] w-auto rotate-[8deg]"}
            />
          </div>
        ))}
      </div>
    </Sec>
  );
}

/** BN07 · Headline bento: one huge headline cell over two rows, tiny detail cells beside it. */
function BN07() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M12");
  return (
    <Sec innerRef={r} theme="paper" font="condensed" className="py-[clamp(72px,9vw,140px)]" style={vars({ "--sx-accent": "#7a3b1d", "--sx-accent-text": "#fbf8f2" })}>
      <div className="grid grid-cols-1 gap-[clamp(12px,1.4vw,20px)] md:grid-cols-4 md:grid-rows-[repeat(2,minmax(220px,auto))]">
        <div className="sx-card flex flex-col justify-between gap-8 p-[clamp(24px,3vw,48px)] md:col-span-2 md:row-span-2">
          <H className="text-[clamp(64px,9vw,168px)] leading-[0.86]">Bean to bar, in one room.</H>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-[34ch] text-[15px] text-[var(--sx-muted)]">Idukki cacao, stone-ground for 72 hours, tempered by hand on marble.</p>
            <Btn>Shop bars</Btn>
          </div>
        </div>
        <div data-m-card className="sx-card flex flex-col justify-between p-6">
          <p className="text-[13px] uppercase tracking-[0.14em] text-[var(--sx-muted)]">Cacao</p>
          <p className="sx-display text-[clamp(56px,5vw,88px)] leading-none text-[var(--sx-accent)]">72%</p>
        </div>
        <div data-m-card className="overflow-hidden rounded-[var(--sx-radius)]">
          <Pic i={0} ratio="auto" round={false} className="h-full min-h-[220px] w-full" label="IDUKKI" />
        </div>
        <div data-m-card className="sx-card flex flex-col justify-between gap-4 p-6">
          <p className="text-[13px] uppercase tracking-[0.14em] text-[var(--sx-muted)]">Tasting notes</p>
          <p className="text-[18px] leading-snug">Raisin, roasted coffee, a long jaggery finish.</p>
        </div>
        <div data-m-card className="flex flex-col justify-between gap-4 rounded-[var(--sx-radius)] bg-[var(--sx-accent)] p-6 text-[var(--sx-accent-text)]">
          <p className="text-[13px] uppercase tracking-[0.14em] opacity-70">70 g bar</p>
          <p className="sx-display text-[clamp(40px,3.6vw,60px)] leading-none">₹340</p>
        </div>
      </div>
    </Sec>
  );
}

/** BN08 · Dark glass bento: frosted cells with a light sheen running along their borders, shining heading. */
const BN08_CSS = `
.bn08-cell{position:relative;background:linear-gradient(160deg,rgba(255,255,255,.07),rgba(255,255,255,.02));backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-radius:var(--sx-radius);border:1px solid rgba(255,255,255,.08)}
.bn08-cell::before{content:"";position:absolute;inset:-1px;border-radius:inherit;padding:1px;pointer-events:none;
background:linear-gradient(115deg,transparent 35%,rgba(255,255,255,.85) 48%,var(--sx-accent) 52%,transparent 65%) 0 0/300% 100% no-repeat;
-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);
animation:bn08-sheen 4.8s linear infinite;animation-delay:var(--d,0s)}
@keyframes bn08-sheen{0%{background-position:120% 0}60%,100%{background-position:-120% 0}}
.is-static .bn08-cell::before{animation:none;background-position:50% 0}
html.is-static {.bn08-cell::before{animation:none;background-position:50% 0}}
`;
function BN08() {
  const cell = (d: number) => vars({ "--d": `${d}s` });
  return (
    <Sec theme="ink" font="grotesk" className="py-[clamp(72px,9vw,140px)]" style={vars({ "--sx-accent": "#8fb6ff" })}>
      <style>{BN08_CSS}</style>
      <div className="pointer-events-none absolute -left-[10%] top-[10%] aspect-square w-[50%] rounded-full bg-[radial-gradient(closest-side,rgba(79,141,255,.35),transparent)]" />
      <div className="pointer-events-none absolute -right-[8%] bottom-0 aspect-square w-[40%] rounded-full bg-[radial-gradient(closest-side,rgba(160,110,255,.28),transparent)]" />
      <div className="relative">
        <h2 className="sx-display max-w-[16ch] text-balance text-[clamp(48px,6.4vw,112px)] font-[800] leading-[0.95] tracking-[-0.02em]">
          <ShineText>Silence, tuned to you.</ShineText>
        </h2>
        <div className="mt-[clamp(36px,5vw,64px)] grid grid-cols-1 gap-[clamp(12px,1.4vw,20px)] md:grid-cols-3">
          <div className="bn08-cell overflow-hidden p-[clamp(22px,2.4vw,36px)] md:col-span-2 md:row-span-2" style={cell(0)}>
            <p className="text-[clamp(26px,2.4vw,38px)] font-[700] leading-[1.05]">Halo One headphones</p>
            <p className="mt-2 max-w-[40ch] text-[15px] text-[var(--sx-muted)]">Adaptive noise cancelling that re-reads the room 50,000 times a second.</p>
            <Pic i={2} ratio="16/9" className="mt-8" label="HALO ONE" />
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <Price now="₹24,990" was="₹27,990" className="text-[20px]" />
              <Btn>Pre-order</Btn>
            </div>
          </div>
          <div className="bn08-cell flex flex-col justify-between gap-6 p-[clamp(22px,2.2vw,32px)]" style={cell(0.6)}>
            <p className="text-[14px] text-[var(--sx-muted)]">Battery, ANC on</p>
            <p className="text-[clamp(56px,5vw,88px)] font-[700] leading-none tracking-[-0.03em]">
              60<span className="text-[0.4em] text-[var(--sx-muted)]"> hr</span>
            </p>
          </div>
          <div className="bn08-cell flex flex-col justify-between gap-6 p-[clamp(22px,2.2vw,32px)]" style={cell(1.2)}>
            <p className="text-[14px] text-[var(--sx-muted)]">Spatial audio</p>
            <p className="text-[18px] leading-snug">Head-tracked sound that stays put when you turn.</p>
          </div>
          <div className="bn08-cell flex flex-wrap items-center gap-x-8 gap-y-3 p-[clamp(22px,2.2vw,32px)] md:col-span-3" style={cell(1.8)}>
            {["Lossless over USB-C", "Multipoint pairing", "38 g lighter", "2-year cover"].map((t) => (
              <span key={t} className="text-[15px] text-[var(--sx-text)]">
                <span className="mr-2 text-[var(--sx-accent)]">●</span>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const BENTO: SectionDef[] = [
  { code: "BN01", name: "Classic bento: 2×2 hero + image, stat, quote", motion: "M34", C: BN01 },
  { code: "BN02", name: "Product, big stat, review and CTA cells", motion: "M18", C: BN02 },
  { code: "BN03", name: "Asymmetric rows 8/4 then 4/8", motion: "M31", C: BN03 },
  { code: "BN04", name: "Launch bento with a ticking countdown", motion: "M3", C: BN04 },
  { code: "BN05", name: "Photo mosaic with gradient captions", motion: "M32", C: BN05 },
  { code: "BN06", name: "Flavour bento, one colour cell per variant", motion: "M34", C: BN06 },
  { code: "BN07", name: "Headline bento: huge headline + tiny details", motion: "M12", C: BN07 },
  { code: "BN08", name: "Dark glass bento with border sheen", motion: "M49", C: BN08 },
];
