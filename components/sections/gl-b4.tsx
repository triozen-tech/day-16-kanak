"use client";

// GL · Gallery layouts, batch 4 (docs/SECTION-MENU.md): GL19 make-way grid (one tile grows to 2×2 and its neighbours
// slide aside), GL20 an oversized bento drifting diagonally behind a vignette, GL21 a slideshow whose every slide is
// its own grid composition, GL22 a shuffled deck that deals itself into a neat grid. All play hands-free while on
// screen and show their final (plain grid) state in ?static=1.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, loadPlugin, prefersReducedMotion } from "@/lib/gsap";
import type { Flip as FlipT } from "gsap/Flip";
import { Btn, H, P, Pic, Price, Sec } from "./kit";
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
  return i;
}

const CSS = `.gl4kb{animation:gl4kbs 4.6s ease-in-out infinite alternate,gl4kbt 3.3s ease-in-out infinite alternate}
.gl4kb.alt{animation-duration:5.6s,3.8s;animation-direction:alternate-reverse}
@keyframes gl4kbs{from{scale:1.06}to{scale:1.2}}@keyframes gl4kbt{from{translate:-3% 2%}to{translate:3% -2%}}
.gl4pan{animation:gl4pan 28s linear infinite}@keyframes gl4pan{from{translate:0 0}to{translate:-1280px -900px}}
.gl4sheen{animation:gl4sheen 2.6s ease-in-out infinite}@keyframes gl4sheen{from{translate:-140% 0}to{translate:240% 0}}
@keyframes gl4up{from{transform:translateY(105%)}}@keyframes gl4fade{from{opacity:0;transform:translateY(10px)}}
html.is-static .gl4kb,html.is-static .gl4pan,html.is-static .gl4sheen{animation:none}
html.is-static {.gl4kb,.gl4pan,.gl4sheen{animation:none}}`;

/* ───────────────────────────── GL19 · Make-way expanding grid ───────────────────────────── */

const BAKES = [
  { n: "Cardamom Knot", d: "Laminated dough, crushed green cardamom, a jaggery glaze that cracks.", p: "₹180", i: 2 },
  { n: "Sourdough Pav", d: "Our three-day starter in a soft Bombay bun. Baked at six, gone by ten.", p: "₹120", i: 0 },
  { n: "Filter Coffee Éclair", d: "Choux filled with chicory-coffee cream, a dark chocolate lid.", p: "₹220", i: 3 },
  { n: "Mango Danish", d: "Alphonso custard and fresh slices on a buttery square. April to June only.", p: "₹240", i: 1 },
  { n: "Rye & Fennel Loaf", d: "Dense, sour and fragrant. Keeps for a week, toasts for two.", p: "₹380", i: 2 },
  { n: "Pistachio Croissant", d: "Twice-baked, pistachio frangipane, a snow of icing sugar.", p: "₹260", i: 0 },
  { n: "Masala Chai Bun", d: "Spiced dough, brown butter and a chai-milk soak.", p: "₹160", i: 3 },
  { n: "Kokum Tart", d: "Sharp, pink kokum curd in a shortbread shell.", p: "₹200", i: 1 },
  { n: "Coconut Morning Bun", d: "Rolled with fresh coconut and palm sugar, baked in a tin.", p: "₹170", i: 2 },
];
// expansion spots that keep the 4 × 3 grid exactly full (dense flow)
const OPEN = [1, 6, 0, 5, 2];

/** GL19 · A tight 4 × 3 grid; one tile at a time grows to 2 × 2 (with caption, price, button) while the others make way. */
function GL19() {
  const r = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M18");
  const k = useCycle(r, OPEN.length, 2600);
  const [big, setBig] = useState(OPEN[0]);
  const F = useRef<typeof FlipT | null>(null);
  const st = useRef<FlipState | null>(null);
  useEffect(() => {
    loadPlugin("Flip").then((f) => (F.current = f as typeof FlipT));
  }, []);
  // capture the tiles' spots, then change the open tile; the re-flow animates from the captured spots
  useEffect(() => {
    if (OPEN[k] === big) return;
    if (F.current && grid.current) st.current = F.current.getState(grid.current.querySelectorAll("[data-flip-id]"));
    setBig(OPEN[k]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k]);
  useLayoutEffect(() => {
    const s = st.current;
    if (!F.current || !s || !grid.current) return;
    st.current = null;
    F.current.from(s, { targets: grid.current.querySelectorAll("[data-flip-id]"), duration: 0.85, ease: "power3.inOut", stagger: 0.02 });
  }, [big]);

  return (
    <Sec innerRef={r} theme="paper" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <style>{CSS}</style>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[12ch] text-[clamp(44px,5.4vw,88px)]">Out of the oven at six.</H>
        <div className="max-w-[38ch]">
          <P>Nine bakes on the counter today at our Bandra bakehouse. Order by eleven for same-day delivery.</P>
          <div className="mt-6">
            <Btn kind="ghost">Full menu</Btn>
          </div>
        </div>
      </div>

      <div ref={grid} className="mt-[clamp(40px,5vw,64px)] grid grid-flow-dense grid-cols-2 gap-[clamp(10px,1vw,16px)] md:grid-cols-4 md:grid-rows-[repeat(3,clamp(150px,13.5vw,240px))]">
        {BAKES.map((b, n) => {
          const on = n === big;
          return (
            <article key={b.n} data-flip-id={b.n} data-m-card className={`relative min-h-[150px] overflow-hidden rounded-[16px] ${on ? "col-span-2 row-span-2" : ""}`}>
              <div className={`gl4kb ${n % 2 ? "alt" : ""} absolute inset-0`}>
                <Pic i={b.i} ratio="auto" round={false} label="" className="absolute inset-0 h-full w-full" />
              </div>
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgba(20,14,8,.78))]" />
              {on ? (
                <div key={`c-${b.n}`} className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 p-[clamp(18px,2vw,28px)] text-white" style={{ animation: "gl4fade .6s .45s cubic-bezier(.22,1,.36,1) both" }}>
                  <div className="max-w-[34ch]">
                    <p className="text-[clamp(24px,2.2vw,34px)] font-[700] leading-tight">{b.n}</p>
                    <p className="mt-2 text-[15px] leading-relaxed text-white/80">{b.d}</p>
                  </div>
                  <span className="flex items-center gap-3">
                    <Price now={b.p} className="text-[18px]" />
                    <Btn>Add</Btn>
                  </span>
                </div>
              ) : (
                <p className="absolute inset-x-0 bottom-0 p-4 text-[14px] font-[600] text-white">{b.n}</p>
              )}
            </article>
          );
        })}
      </div>
    </Sec>
  );
}

/* ───────────────────────────── GL20 · Diagonal drifting oversized grid ───────────────────────────── */

// four column patterns, each exactly 900px tall per period (3 tiles + 3 gaps of 20px), so the pan loops seamlessly
const PATS = [
  [300, 240, 300],
  [420, 220, 200],
  [200, 360, 280],
  [260, 300, 280],
];

/** GL20 · An oversized bento (bigger than the screen) drifts slowly on a diagonal behind a vignette; a title sits centred. */
function GL20() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M32");
  return (
    <Sec innerRef={r} theme="ink" font="serif" full className="relative">
      <style>{CSS}</style>
      <div className="relative h-[clamp(620px,100svh,980px)] overflow-hidden">
        <div aria-hidden className="gl4pan absolute left-[-200px] top-[-300px] flex gap-5">
          {Array.from({ length: 12 }, (_, c) => (
            <div key={c} data-m-col className="flex w-[300px] shrink-0 flex-col gap-5">
              {[0, 1, 2].flatMap((rep) =>
                PATS[c % 4].map((h, t) => (
                  <div key={`${rep}-${t}`} className="relative shrink-0 overflow-hidden rounded-[16px]" style={{ height: h }}>
                    <Pic i={(c + t) % 4} ratio="auto" round={false} label="" className="absolute inset-0 h-full w-full" />
                  </div>
                )),
              )}
            </div>
          ))}
        </div>
        {/* vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_50%,color-mix(in_srgb,var(--sx-bg)_72%,transparent),color-mix(in_srgb,var(--sx-bg)_25%,transparent)_70%,var(--sx-bg))]" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          <H className="max-w-[13ch] text-[clamp(56px,7vw,116px)]">Linen, all summer long.</H>
          <P className="mx-auto mt-6 max-w-[42ch] text-[var(--sx-text)] opacity-80">Sixty pieces in washed flax for the festival months, from ₹1,890. Breathes at forty degrees.</P>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Btn>Shop the lookbook</Btn>
            <Btn kind="ghost">Find your size</Btn>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────────── GL21 · Per-slide grid compositions ───────────────────────────── */

type Slide = { t: string; s: string; cols: string; areas: string; tiles: { a: string; i: number }[] };
const SLIDES: Slide[] = [
  { t: "The monsoon room", s: "Lime-washed walls, a cane daybed, a window left open.", cols: "2fr 1fr 1fr", areas: "'a b c' 'a d d'", tiles: [{ a: "a", i: 1 }, { a: "b", i: 2 }, { a: "c", i: 0 }, { a: "d", i: 3 }] },
  { t: "Clay & cotton", s: "Hand-thrown pots beside block-printed throws from Bagru.", cols: "1fr 1fr 1.4fr", areas: "'a b c' 'd d c'", tiles: [{ a: "a", i: 0 }, { a: "b", i: 3 }, { a: "c", i: 2 }, { a: "d", i: 1 }] },
  { t: "A kitchen for slow Sundays", s: "Open shelves, brass, and a table long enough for twelve.", cols: "1fr 1.6fr 1fr", areas: "'a b c' 'd b e'", tiles: [{ a: "a", i: 2 }, { a: "b", i: 0 }, { a: "c", i: 3 }, { a: "d", i: 1 }, { a: "e", i: 2 }] },
  { t: "Bedrooms in indigo", s: "Deep blue linen, low beds, and lamps that only glow.", cols: "1.3fr 1fr", areas: "'a b' 'a c'", tiles: [{ a: "a", i: 3 }, { a: "b", i: 1 }, { a: "c", i: 0 }] },
];

function SlideGrid({ s, z, reveal, first }: { s: Slide; z: number; reveal: boolean; first: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !reveal || prefersReducedMotion()) return;
    const tiles = Array.from(el.querySelectorAll<HTMLElement>("[data-tile]"));
    const st = first ? { trigger: el, start: "top 80%", toggleActions: "play none none reverse" } : undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo(tiles, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1, ease: "power4.inOut", stagger: 0.13, scrollTrigger: st });
      gsap.fromTo(tiles.map((t) => t.querySelector("img")), { scale: 1.3 }, { scale: 1, duration: 1.5, ease: "power3.out", stagger: 0.13, scrollTrigger: st });
    }, el);
    return () => ctx.revert();
  }, [reveal, first]);
  return (
    <div ref={ref} className="absolute inset-0 grid gap-[clamp(10px,1vw,16px)]" style={{ zIndex: z, gridTemplateColumns: s.cols, gridTemplateAreas: s.areas, gridTemplateRows: "1fr 1fr" }}>
      {s.tiles.map((t, n) => (
        <div key={t.a} data-tile className="relative min-h-0 overflow-hidden rounded-[14px]" style={{ gridArea: t.a }}>
          <div className={`gl4kb ${n % 2 ? "alt" : ""} absolute inset-0`}>
            <Pic i={t.i} ratio="auto" round={false} label="" className="absolute inset-0 h-full w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** GL21 · A slideshow where every slide is its own 3–5 image grid; it auto-advances, revealing the next one tile by tile. */
function GL21() {
  const r = useRef<HTMLDivElement>(null);
  const n = useCycle(r, SLIDES.length, 2900);
  // [current, previous] change together so the outgoing slide stays mounted underneath while the new one reveals
  const [[k, prev], setPair] = useState<[number, number | null]>([0, null]);
  useEffect(() => {
    setPair(([c, p]) => (c === n ? [c, p] : [n, c]));
  }, [n]);
  const s = SLIDES[k];
  return (
    <Sec innerRef={r} theme="stone" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <style>{CSS}</style>
      <div className="grid grid-cols-1 items-end gap-6 md:grid-cols-12">
        <div className="md:col-span-8">
          <p className="text-[14px] text-[var(--sx-muted)]">Issue 14 · Rooms we loved this season</p>
          <div className="mt-4 overflow-hidden pb-[0.08em]">
            <H key={k} className="text-[clamp(44px,5.2vw,86px)]">
              <span className="block" style={{ animation: "gl4up .8s cubic-bezier(.22,1,.36,1)" }}>
                {s.t}
              </span>
            </H>
          </div>
        </div>
        <div className="md:col-span-4">
          <p key={`s-${k}`} className="max-w-[36ch] text-[17px] leading-relaxed text-[var(--sx-muted)]" style={{ animation: "gl4fade .7s .15s cubic-bezier(.22,1,.36,1) both" }}>
            {s.s}
          </p>
          <div className="mt-6 flex items-center gap-4">
            <span className="text-[14px] tabular-nums">
              {String(k + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
            </span>
            <span className="flex flex-1 gap-1.5">
              {SLIDES.map((_, n) => (
                <span key={n} className={`h-[3px] flex-1 rounded-full transition-colors duration-500 ${n === k ? "bg-[var(--sx-accent)]" : "bg-[var(--sx-line)]"}`} />
              ))}
            </span>
          </div>
        </div>
      </div>

      <div className="relative mt-[clamp(36px,4vw,56px)] h-[clamp(440px,60vh,620px)]">
        {prev !== null && prev !== k && <SlideGrid key={`s-${prev}`} s={SLIDES[prev]} z={1} reveal={false} first={false} />}
        <SlideGrid key={`s-${k}`} s={s} z={2} reveal first={prev === null} />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--sx-line)] pt-6">
        <p className="text-[15px] text-[var(--sx-muted)]">Every piece shown is in stock, from ₹2,400.</p>
        <Btn kind="link">Shop the rooms</Btn>
      </div>
    </Sec>
  );
}

/* ───────────────────────────── GL22 · Deck that deals into a grid ───────────────────────────── */

const BARS = [
  { n: "Idukki 72%", o: "Single estate, Kerala", p: "₹340", i: 3 },
  { n: "Sea Salt Jaggery", o: "Milk 48%, Kolhapur jaggery", p: "₹290", i: 1 },
  { n: "Filter Coffee 64%", o: "With Coorg robusta nibs", p: "₹320", i: 0 },
  { n: "Kokum & Chilli", o: "Dark 70%, Konkan kokum", p: "₹360", i: 2 },
  { n: "Toasted Coconut", o: "White 34%, Malabar coconut", p: "₹280", i: 1 },
  { n: "Wayanad 85%", o: "Bean to bar, very dark", p: "₹380", i: 3 },
  { n: "Rose & Pistachio", o: "Milk 45%, Kannauj rose", p: "₹350", i: 0 },
  { n: "Cardamom Crunch", o: "Dark 62%, Idukki cardamom", p: "₹310", i: 2 },
];

/** GL22 · A shuffled deck of bar cards at centre deals itself out into a neat 4 × 2 grid, holds, gathers and deals again. */
function GL22() {
  const r = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = r.current;
    const g = grid.current;
    if (!el || !g || prefersReducedMotion()) return;
    const cards = Array.from(g.querySelectorAll<HTMLElement>("[data-deal]"));
    const rot = cards.map((_, n) => [-7, 5, -3, 8, -5, 3, -8, 6][n % 8]);
    // offsets from each card's grid spot to the middle of the grid (layout values, not affected by transforms)
    const dx = (n: number) => g.offsetWidth / 2 - (cards[n].offsetLeft + cards[n].offsetWidth / 2) + n * 1.5;
    const dy = (n: number) => g.offsetHeight / 2 - (cards[n].offsetTop + cards[n].offsetHeight / 2) - n * 1.5;
    const deck = { x: (n: number) => dx(n), y: (n: number) => dy(n), rotation: (n: number) => rot[n] };
    gsap.set(cards, deck);
    const tl = gsap.timeline({ paused: true, repeat: -1, delay: 0.3 });
    tl.to(cards, { x: 0, y: 0, rotation: 0, duration: 0.9, ease: "power3.out", stagger: { each: 0.09, from: "end" } })
      .to({}, { duration: 2.2 })
      .to(cards, { ...deck, duration: 0.7, ease: "power3.inOut", stagger: 0.04 })
      .to({}, { duration: 0.35 });
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? tl.play() : tl.pause()), { threshold: 0.25 });
    io.observe(g);
    return () => {
      io.disconnect();
      tl.kill();
      gsap.set(cards, { clearProps: "transform" });
    };
  }, []);
  return (
    <Sec innerRef={r} theme="paper" font="condensed" className="py-[clamp(72px,9vw,140px)]">
      <style>{CSS}</style>
      <div className="grid grid-cols-1 items-end gap-6 md:grid-cols-12">
        <H className="text-[clamp(52px,6.4vw,104px)] md:col-span-7">Pick a bar, any bar.</H>
        <div className="md:col-span-5">
          <P className="max-w-[40ch]">Eight bars made bean to bar in Kochi, with cocoa from farms we visit every harvest. Any four for ₹1,199.</P>
          <div className="mt-6 flex flex-wrap gap-4">
            <Btn>Build a box of four</Btn>
            <Btn kind="ghost">Tasting notes</Btn>
          </div>
        </div>
      </div>

      <div ref={grid} className="relative mt-[clamp(40px,5vw,72px)] grid grid-cols-2 gap-[clamp(14px,1.6vw,24px)] md:grid-cols-4">
        {BARS.map((b, n) => (
          <article key={b.n} data-deal className="sx-card relative overflow-hidden shadow-[0_18px_40px_-24px_rgba(28,24,19,.45)]">
            <div className={`relative aspect-[4/3] overflow-hidden`}>
              <div className={`gl4kb ${n % 2 ? "alt" : ""} absolute inset-0`}>
                <Pic i={b.i} ratio="auto" round={false} label="" className="absolute inset-0 h-full w-full" />
              </div>
              <span className="absolute left-3 top-3 rounded-full bg-[var(--sx-surface)] px-3 py-1 text-[12px] font-[650]">{b.n.match(/\d+%/)?.[0] ?? "Bar"}</span>
            </div>
            <div className="flex items-end justify-between gap-3 border-t-[6px] border-[var(--sx-accent)] p-4">
              <div className="min-w-0">
                <p className="truncate text-[17px] font-[650]">{b.n}</p>
                <p className="mt-1 truncate text-[13px] text-[var(--sx-muted)]">{b.o}</p>
              </div>
              <Price now={b.p} className="text-[15px]" />
            </div>
            {/* light sweeping over the card */}
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="gl4sheen absolute inset-y-0 w-[40%] bg-[linear-gradient(100deg,transparent,rgba(255,255,255,.28),transparent)]" style={{ animationDelay: `${n * 0.12}s` }} />
            </div>
          </article>
        ))}
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "GL19", name: "Make-way expanding grid", motion: "M18", C: GL19 },
  { code: "GL20", name: "Diagonal drifting oversized grid", motion: "M32", C: GL20 },
  { code: "GL21", name: "Per-slide grid compositions", motion: "M1", C: GL21 },
  { code: "GL22", name: "Deck that deals into a grid", motion: "M34", C: GL22 },
];
