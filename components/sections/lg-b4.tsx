"use client";

// LG · Logo / partner layouts, batch 4 (docs/SECTION-MENU.md). Full designed sections; motion via useSectionMotion or fx.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { ShineText } from "../fx/text";
import { Btn, H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Hands-free cycling: steps an index every `ms` while the section is on screen (stops off screen and in ?static=1). */
function useAutoCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms = 2000) {
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

/* ───────────────────────── LG06 · Shuffle tile grid beside headline ───────────────────────── */

type Tile = { kind: "mark"; name: string; city: string; style: number } | { kind: "pic"; i: number };
const LG06_TILES: Tile[] = [
  { kind: "mark", name: "Blue Door", city: "Bandra", style: 0 },
  { kind: "pic", i: 0 },
  { kind: "mark", name: "Kettle & Kiln", city: "Indiranagar", style: 1 },
  { kind: "pic", i: 2 },
  { kind: "pic", i: 3 },
  { kind: "mark", name: "Monsoon Bar", city: "Fort Kochi", style: 2 },
  { kind: "pic", i: 1 },
  { kind: "mark", name: "Aster Café", city: "Hauz Khas", style: 3 },
  { kind: "mark", name: "Third Wave Room", city: "Koregaon Park", style: 1 },
  { kind: "pic", i: 2 },
  { kind: "mark", name: "Lantern", city: "Assagao", style: 0 },
  { kind: "pic", i: 0 },
  { kind: "pic", i: 3 },
  { kind: "mark", name: "Ochre", city: "Jubilee Hills", style: 2 },
  { kind: "pic", i: 1 },
  { kind: "mark", name: "Field Kitchen", city: "Auroville", style: 3 },
];

/** Shuffles a permutation a few swaps at a time, on a timer, while `ref` is on screen. Starts as the identity (SSR-safe). */
function useShuffle(ref: React.RefObject<HTMLElement | null>, n: number, ms: number) {
  const [perm, setPerm] = useState(() => Array.from({ length: n }, (_, k) => k));
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) % 1000) / 1000;
    let t: ReturnType<typeof setInterval> | undefined;
    const step = () =>
      setPerm((p) => {
        const q = [...p];
        for (let s = 0; s < 3; s++) {
          const a = Math.floor(rnd() * n);
          let b = Math.floor(rnd() * n);
          if (b === a) b = (a + 5) % n;
          [q[a], q[b]] = [q[b], q[a]];
        }
        return q;
      });
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (e.isIntersecting) t = setInterval(step, ms);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, [ref, n, ms]);
  return perm;
}

function Wordmark({ name, city, style }: { name: string; city: string; style: number }) {
  const looks = [
    "sx-display text-[clamp(17px,1.5vw,22px)] font-[800] uppercase tracking-[0.04em]",
    "font-serif text-[clamp(18px,1.6vw,24px)] italic",
    "text-[clamp(13px,1.05vw,15px)] font-[700] uppercase tracking-[0.26em]",
    "sx-display text-[clamp(18px,1.6vw,24px)] font-[500] lowercase tracking-[-0.02em]",
  ];
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-[14px] border border-[var(--sx-line)] bg-[var(--sx-surface)] p-3 text-center">
      <span className={`leading-tight ${looks[style]}`}>{name}</span>
      <span className="mt-2 text-[12px] text-[var(--sx-muted)]">{city}</span>
    </div>
  );
}

/** LG06 · Headline, copy and CTA in the left 5/12; a 4×4 grid of square tiles (café wordmarks and photos) on the right
 *  7/12 that trade places every few seconds, a few at a time. */
function LG06() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  const perm = useShuffle(r, LG06_TILES.length, 1500);
  return (
    <Sec innerRef={r} theme="paper" font="condensed" className="py-[clamp(72px,9vw,140px)]">
      <div className="grid grid-cols-1 items-center gap-[clamp(40px,5vw,96px)] md:grid-cols-12">
        <div className="md:col-span-5">
          <H className="text-[clamp(52px,6vw,104px)] uppercase">Poured in 140 cafés.</H>
          <P className="mt-6 max-w-[40ch]">Our single-estate Darjeeling and cold-brew concentrate are on the menu from Bandra to Auroville. Ask for it by name.</P>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Btn>Stock our tea</Btn>
            <Btn kind="link">Find a café near you →</Btn>
          </div>
          <p className="mt-8 text-[14px] text-[var(--sx-muted)]">Wholesale from ₹1,150 a kilo · samples free for cafés</p>
        </div>
        <div className="md:col-span-7">
          <div className="relative mx-auto aspect-square w-full max-w-[720px]">
            {LG06_TILES.map((t, k) => {
              const slot = perm[k];
              return (
                <div
                  key={k}
                  data-m-card
                  className="absolute p-[clamp(4px,0.5vw,7px)] transition-[left,top] duration-[900ms] ease-[cubic-bezier(.65,0,.25,1)]"
                  style={{ left: `${(slot % 4) * 25}%`, top: `${Math.floor(slot / 4) * 25}%`, width: "25%", height: "25%" }}
                >
                  {t.kind === "mark" ? (
                    <Wordmark name={t.name} city={t.city} style={t.style} />
                  ) : (
                    <div className="relative h-full overflow-hidden rounded-[14px]">
                      <div className="fx-drift absolute inset-0">
                        <Pic i={t.i} ratio="auto" round={false} className="absolute inset-0 h-full w-full" label="" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── LG07 · 3x3 tile grid with cycling featured tile ───────────────────────── */

const LG07_FARMS = [
  { n: "Idukki cacao", where: "Kerala", what: "Single-estate beans, fermented six days", d: "M12 3c4 2.5 6 5.5 6 9s-2 6.5-6 9c-4-2.5-6-5.5-6-9s2-6.5 6-9Zm0 0c-1.5 4-1.5 14 0 18" },
  { n: "Malabar vanilla", where: "Wayanad", what: "Pods cured for four months", d: "M5 19c6-1 11-6 14-14M7 21c1-5 4-10 9-13M9 14l-3-1M12 11l-2-3" },
  { n: "Kutch salt", where: "Gujarat", what: "Sea salt raked by hand at dawn", d: "M4 18h16M6 18l3-6 3 3 3-7 3 10M8 6h.01M16 5h.01" },
  { n: "Nilgiri honey", where: "Kotagiri", what: "Wild comb from the shola forest", d: "M12 3l7 4v8l-7 4-7-4V7l7-4Zm0 5l3 2v4l-3 2-3-2v-4l3-2Z" },
  { n: "Coorg coffee", where: "Karnataka", what: "Arabica for the mocha bar", d: "M12 4c3.5 0 6 3.6 6 8s-2.5 8-6 8-6-3.6-6-8 2.5-8 6-8Zm0 0c-2 3-2 13 0 16" },
  { n: "Alphonso mango", where: "Ratnagiri", what: "Dried slices for the summer bar", d: "M14 4c4 1 6 5 5 9-1 5-6 8-10 7S3 15 5 11c1-3 4-4 6-5M14 4c-1 1-1 2 0 3" },
  { n: "Kashmir saffron", where: "Pampore", what: "Hand-picked stigmas, grade one", d: "M12 21v-8M12 13c-3-1-5-4-5-8 3 0 5 2 5 5 0-3 2-5 5-5 0 4-2 7-5 8Z" },
  { n: "Jaggery mill", where: "Kolhapur", what: "Unrefined cane, boiled in iron pans", d: "M7 21V9M12 21V5M17 21v-9M5 9h4M10 5h4M15 12h4" },
  { n: "Sea-coast coconut", where: "Konkan", what: "Cold-pressed milk for the dairy-free bar", d: "M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm-2 6h.01M14 10h.01M12 14h.01" },
];

/** LG07 · Heading and CTA in the left 5/12; a 3×3 grid of icon tiles on the right 7/12. One tile at a time becomes
 *  featured (raised, glowing, with its label), cycling through the farms. The heading carries a light sweep (M49). */
function LG07() {
  const r = useRef<HTMLDivElement>(null);
  const [a, setA] = useAutoCycle(r, LG07_FARMS.length, 1500);
  const f = LG07_FARMS[a];
  return (
    <Sec innerRef={r} theme="ink" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <div className="grid grid-cols-1 items-center gap-[clamp(40px,5vw,96px)] md:grid-cols-12">
        <div className="md:col-span-5">
          <H className="text-[clamp(48px,5.6vw,96px)]">
            <ShineText>Nine farms, one bar.</ShineText>
          </H>
          <P className="mt-6 max-w-[40ch]">Everything in a Kaavi bar comes from a farm we have walked. We buy direct, pay above market, and print the farm on the wrapper.</P>
          <div className="mt-8 rounded-[16px] border border-[var(--sx-line)] p-5">
            <p className="text-[12px] uppercase tracking-[0.16em] text-[var(--sx-muted)]">In this month&apos;s bar</p>
            <p key={a} className="mt-2 text-[18px] font-[600] [animation:lgb4-in_.6s_cubic-bezier(.2,.8,.2,1)_both]">
              {f.n} <span className="font-[400] text-[var(--sx-muted)]">· {f.where}</span>
            </p>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Btn>Shop the farm bars · ₹350</Btn>
            <Btn kind="ghost">Our sourcing</Btn>
          </div>
        </div>
        <div className="md:col-span-7">
          <style>{`@keyframes lgb4-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}html.is-static [class*="lgb4-in"]{animation:none!important}html.is-static {[class*="lgb4-in"]{animation:none!important}}`}</style>
          <div className="mx-auto grid max-w-[680px] grid-cols-3 gap-[clamp(10px,1.4vw,20px)] p-[clamp(8px,1.4vw,20px)]">
            {LG07_FARMS.map((x, k) => {
              const on = k === a;
              return (
                <button
                  key={x.n}
                  type="button"
                  onMouseEnter={() => setA(k)}
                  className={`relative flex aspect-square flex-col items-center justify-center gap-3 rounded-[var(--sx-radius)] border p-3 text-center transition-all duration-500 ${
                    on ? "z-10 scale-[1.07] border-[var(--sx-accent)] bg-[color-mix(in_srgb,var(--sx-accent)_16%,var(--sx-surface))] shadow-[0_0_70px_-10px_var(--sx-accent)]" : "border-[var(--sx-line)] bg-[var(--sx-surface)]"
                  }`}
                >
                  <svg viewBox="0 0 24 24" className={`h-[clamp(30px,3vw,46px)] w-[clamp(30px,3vw,46px)] transition-colors duration-500 ${on ? "text-[var(--sx-accent)]" : "text-[var(--sx-muted)]"}`} fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d={x.d} />
                  </svg>
                  <span className="text-[clamp(13px,1.05vw,16px)] font-[600] leading-tight">{x.n}</span>
                  <span className={`text-[12px] leading-snug text-[var(--sx-muted)] transition-opacity duration-500 ${on ? "opacity-100" : "opacity-0"} max-lg:hidden`}>{x.what}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "LG06", name: "Shuffle tile grid beside headline", motion: "M34", C: LG06 },
  { code: "LG07", name: "3x3 tile grid with cycling featured tile", motion: "M49", C: LG07 },
];
