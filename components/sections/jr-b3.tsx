"use client";

// JR · Journal layouts (docs/SECTION-MENU.md), batch 3. Each is a full designed section; motion via useSectionMotion.
// Every auto-play stops off screen, in ?static=1.
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { Avatar, Btn, H, P, Pic, Price, Product, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Hands-free cycling: steps an index every `ms` while the section is on screen (stops off screen and in ?static=1). */
function useAutoCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms = 1600) {
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

const JR_CSS = `.jr3-sweep{background:linear-gradient(105deg,transparent 30%,rgba(255,255,255,.2) 47%,transparent 64%) 0 0/280% 100%;animation:jr3-sweep 2.6s linear infinite}@keyframes jr3-sweep{from{background-position:130% 0}to{background-position:-30% 0}}
.jr3-push img{animation:jr3-push 5s ease-in-out infinite alternate}@keyframes jr3-push{from{scale:1.02}to{scale:1.12}}
.jr3-pan{background-size:220% 220%;animation:jr3-pan 3.4s ease-in-out infinite alternate}@keyframes jr3-pan{from{background-position:0% 30%}to{background-position:100% 70%}}
.jr3-float{animation:jr3-float 2.8s ease-in-out infinite alternate}@keyframes jr3-float{from{translate:0 6%;rotate:-4deg}to{translate:0 -6%;rotate:4deg}}
.jr3-track{animation:jr3-marq 32s linear infinite}@keyframes jr3-marq{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.is-static .jr3-sweep,.is-static .jr3-push img,.is-static .jr3-pan,.is-static .jr3-float,.is-static .jr3-track{animation:none}
html.is-static {.jr3-sweep,.jr3-push img,.jr3-pan,.jr3-float,.jr3-track{animation:none}}`;

// ── JR05 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const SPREADS = [
  {
    i: 3,
    place: "Jaipur",
    title: "Before noon in the block-print quarter",
    by: "Words by Ira Menon",
    q: "“The indigo vat smells like rain on stone.”",
    body: [
      "The printers start at six, while the courtyard is still cool. Teak blocks the size of a palm are inked, lifted and pressed down eight hundred times before breakfast.",
      "Our summer linen is printed here in two colours only, madder and indigo, and washed four times in the canal behind the workshop until the edges soften.",
    ],
    pg: [14, 15],
  },
  {
    i: 1,
    place: "Kutch",
    title: "The weavers who count in threads",
    by: "Words by Kabir Shah",
    q: "“A good shirt is mostly air.”",
    body: [
      "Forty threads to the centimetre, set on a pit loom that has not moved in thirty years. The cloth comes off the beam the colour of oatmeal and we leave it that way.",
      "A single bolt takes three days. It becomes eleven shirts, cut so the selvedge runs down the placket and nothing is wasted.",
    ],
    pg: [22, 23],
  },
  {
    i: 2,
    place: "Goa",
    title: "Wearing it in, by the sea",
    by: "Words by Tara Dsouza",
    q: "“Linen keeps a record of every summer.”",
    body: [
      "We shot the edit over one long weekend in a house with green shutters, mostly in the hour after lunch when the light turns to honey and nobody wants to move.",
      "The Aldona shirt, ₹4,200, the Saligao trouser, ₹3,600, and the Candolim dress, ₹5,400, all in washed oat, sea and rust.",
    ],
    pg: [30, 31],
  },
];
type Spread = (typeof SPREADS)[number];

function LeftPage({ s }: { s: Spread }) {
  return (
    <div className="jr3-push absolute inset-0 overflow-hidden bg-[var(--sx-surface)]">
      <Pic i={s.i} ratio="auto" round={false} className="absolute inset-0 h-full w-full" />
      <div className="jr3-sweep pointer-events-none absolute inset-0" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,9,15,.1),transparent_40%,rgba(7,9,15,.75))]" />
      <div className="absolute inset-x-0 bottom-0 p-[clamp(20px,2.6vw,40px)] text-white">
        <p className="text-[12px] font-[600] uppercase tracking-[0.2em] text-white/75">{s.place}</p>
        <p className="sx-display mt-3 max-w-[14ch] text-[clamp(30px,3.2vw,52px)] font-[700] leading-[0.98]">{s.title}</p>
        <p className="mt-5 text-[12px] tabular-nums text-white/70">{s.pg[0]}</p>
      </div>
    </div>
  );
}
function RightPage({ s }: { s: Spread }) {
  return (
    <div className="absolute inset-0 flex flex-col bg-[var(--sx-surface)] p-[clamp(22px,3vw,48px)]">
      <p className="text-[12px] font-[600] uppercase tracking-[0.2em] text-[var(--sx-accent)]">{s.by}</p>
      <p className="sx-display mt-4 text-[clamp(22px,2vw,32px)] italic leading-tight">{s.q}</p>
      <div className="mt-6 gap-[clamp(16px,2vw,28px)] text-[clamp(13px,0.95vw,15px)] leading-[1.65] text-[var(--sx-muted)] md:columns-2">
        {s.body.map((b, k) => (
          <p key={k} className={`mb-4 ${k === 0 ? "first-letter:float-left first-letter:mr-2 first-letter:font-[700] first-letter:text-[3.4em] first-letter:leading-[0.85] first-letter:text-[var(--sx-text)]" : ""}`}>
            {b}
          </p>
        ))}
      </div>
      <div className="mt-auto flex items-end justify-between border-t border-[var(--sx-line)] pt-4 text-[12px] text-[var(--sx-muted)]">
        <span>The Linen Journal · Issue 07</span>
        <span className="tabular-nums">{s.pg[1]}</span>
      </div>
    </div>
  );
}

/** JR05 · Magazine spread with page flip: a two-page spread (left: a big image with the title; right: text in two
 *  columns with a drop cap and pull quote). Arrows turn the page with a flat 3D page-turn around the spine; hands-free
 *  it turns to the next spread by itself. */
function JR05() {
  const r = useRef<HTMLDivElement>(null);
  const flipEl = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M1");
  const [i, setI] = useState(0);
  const [to, setTo] = useState<number | null>(null);
  const busy = useRef(false);
  const n = SPREADS.length;
  const go = (d: number) => {
    if (busy.current) return;
    busy.current = true;
    setTo((i + d + n) % n);
  };
  const goRef = useRef(go);
  goRef.current = go;
  useEffect(() => {
    if (to === null || !flipEl.current) return;
    const tw = gsap.fromTo(flipEl.current, { rotateY: 0 }, { rotateY: -180, duration: 1.1, ease: "power2.inOut", onComplete: () => {
      setI(to);
      setTo(null);
      busy.current = false;
    } });
    return () => {
      tw.kill();
    };
  }, [to]);
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    let t: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (e.isIntersecting) t = setInterval(() => goRef.current(1), 2400);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, []);
  const cur = SPREADS[i];
  const next = to === null ? null : SPREADS[to];
  return (
    <Sec innerRef={r} theme="paper" font="editorial" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#9a4a2b" }}>
      <style>{JR_CSS}</style>
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-end justify-between gap-6">
        <div>
          <H className="text-[clamp(40px,4.6vw,76px)]">The Linen Journal.</H>
          <P className="mt-4 max-w-[46ch]">Issue 07: three places, three makers, one summer of washed linen. Read it free or get the printed copy, ₹450.</P>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[14px] tabular-nums text-[var(--sx-muted)]">
            Spread {(to ?? i) + 1} of {n}
          </span>
          {[-1, 1].map((d) => (
            <button key={d} type="button" onClick={() => go(d)} aria-label={d < 0 ? "Previous spread" : "Next spread"} className="grid h-12 w-12 place-items-center rounded-full border border-[var(--sx-line)] text-[18px] transition-colors hover:bg-[var(--sx-text)] hover:text-[var(--sx-bg)]">
              {d < 0 ? "←" : "→"}
            </button>
          ))}
        </div>
      </div>
      <div className="relative mx-auto mt-[clamp(32px,4vw,56px)] grid max-w-[1120px] grid-cols-1 shadow-[0_40px_80px_-40px_rgba(28,24,19,.55)] [perspective:2400px] md:grid-cols-2">
        <div key={`l${i}`} className="relative aspect-[5/6] overflow-hidden rounded-l-[14px] max-md:rounded-[14px]">
          <LeftPage s={cur} />
        </div>
        <div className="relative aspect-[5/6] overflow-hidden rounded-r-[14px] max-md:hidden">
          <RightPage s={next ?? cur} />
        </div>
        {next && (
          <div ref={flipEl} className="absolute inset-y-0 left-1/2 w-1/2 origin-left [transform-style:preserve-3d] max-md:hidden">
            <div className="absolute inset-0 overflow-hidden rounded-r-[14px] [backface-visibility:hidden]">
              <RightPage s={cur} />
            </div>
            <div className="absolute inset-0 overflow-hidden rounded-l-[14px] [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <LeftPage s={next} />
            </div>
          </div>
        )}
        {/* spine shading */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-[80px] -translate-x-1/2 bg-[linear-gradient(90deg,transparent,rgba(28,24,19,.18)_45%,rgba(28,24,19,.28)_50%,rgba(28,24,19,.12)_55%,transparent)] max-md:hidden" />
      </div>
      <div className="mx-auto mt-8 flex max-w-[1120px] justify-center gap-2">
        {SPREADS.map((s, k) => (
          <span key={s.place} className={`h-1.5 rounded-full transition-all duration-500 ${k === (to ?? i) ? "w-10 bg-[var(--sx-text)]" : "w-4 bg-[var(--sx-line)]"}`} />
        ))}
      </div>
    </Sec>
  );
}

// ── JR06 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const TOC = ["The cherry, at 1,200 m", "Ninety days of monsoon", "What the wind does", "Brewing it at home"];
const RELATED = [
  { i: 1, c: "Origins", t: "Why our Arabica grows under silver oak", m: "6 min read", d: "Shade, birdsong and pepper vines: the slow case for a forest farm." },
  { i: 2, c: "At home", t: "A filter coffee ritual, step by step", m: "4 min read", d: "Brass, decoction and the right amount of chicory, explained by our roaster." },
  { i: 0, c: "People", t: "Meet the pickers of Baba Budangiri", m: "9 min read", d: "Twenty-two families, one harvest, and the songs that keep the pace." },
];

/** JR06 · Long-read with sticky side rail: an article column (title, meta, lead picture, body with subheads) and a
 *  350px tinted rail whose stack (contents list, author card, promo) stays in view while reading; related posts follow
 *  as full-width rows, picture left, text right. The contents list walks itself with a reading bar. */
function JR06() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const [at] = useAutoCycle(r, TOC.length, 1600);
  return (
    <Sec innerRef={r} theme="stone" font="serif" className="overflow-clip! py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#7a4b2a" }}>
      <style>{JR_CSS}</style>
      <div className="grid grid-cols-1 gap-[clamp(32px,4vw,72px)] md:grid-cols-[minmax(0,1fr)_350px]">
        <article className="min-w-0 max-w-[760px]">
          <p className="text-[13px] text-[var(--sx-muted)]">
            <span className="font-[650] text-[var(--sx-accent)]">Field notes</span> · 2 October 2026 · 8 min read
          </p>
          <H className="mt-5 text-[clamp(42px,4.8vw,80px)]">The monsoon coffee that waits.</H>
          <P className="mt-6 text-[clamp(18px,1.4vw,22px)]">How a green bean turns gold in a seaside warehouse, and why Monsoon Malabar tastes of nothing else on earth.</P>
          <Pic i={0} ratio="16/9" className="mt-[clamp(28px,3vw,44px)]" label="MANGALURU · AUGUST" />
          {[
            ["The cherry, at 1,200 m", "It starts like any other Arabica: shade-grown, hand-picked in December, pulped and dried on brick patios until the beans rattle in their parchment. Then, instead of shipping, we wait."],
            ["Ninety days of monsoon", "From June the beans are spread a hand deep on the floor of an open warehouse by the sea. Wet wind blows through the slats day and night, and every few days someone rakes them over."],
            ["What the wind does", "The beans swell to nearly twice their size and fade from green to pale gold. Acidity drops away. What remains is heavy, low and earthy, with a finish of cedar and dark cocoa."],
          ].map(([h, b]) => (
            <div key={h} className="mt-[clamp(28px,3vw,44px)]">
              <H as="h3" className="text-[clamp(26px,2.2vw,36px)]">{h}</H>
              <P className="mt-4">{b}</P>
            </div>
          ))}
        </article>
        <aside className="rounded-[var(--sx-radius,18px)] bg-[color-mix(in_srgb,var(--sx-accent)_9%,var(--sx-bg))] p-6">
          <div className="sticky top-[96px] flex flex-col gap-5">
            <div className="rounded-[14px] bg-[var(--sx-surface)] p-5">
              <p className="text-[12px] font-[650] uppercase tracking-[0.16em] text-[var(--sx-muted)]">In this story</p>
              <div className="mt-3 h-[3px] rounded-full bg-[var(--sx-line)]">
                <div className="h-full rounded-full bg-[var(--sx-accent)] transition-[width] duration-700" style={{ width: `${((at + 1) / TOC.length) * 100}%` }} />
              </div>
              <ol className="mt-3">
                {TOC.map((t, k) => (
                  <li key={t} className={`flex gap-3 rounded-[10px] px-3 py-2.5 text-[15px] transition-colors duration-500 ${k === at ? "bg-[var(--sx-text)] text-[var(--sx-bg)]" : "text-[var(--sx-muted)]"}`}>
                    <span className="tabular-nums opacity-60">{k + 1}</span>
                    {t}
                  </li>
                ))}
              </ol>
            </div>
            <div className="flex items-center gap-4 rounded-[14px] bg-[var(--sx-surface)] p-5">
              <Avatar name="Kabir Shah" i={1} size={52} />
              <div className="min-w-0">
                <p className="text-[16px] font-[650]">Kabir Shah</p>
                <p className="text-[13px] leading-snug text-[var(--sx-muted)]">Head roaster, eleven harvests on the estate</p>
              </div>
            </div>
            <div className="jr3-pan relative overflow-hidden rounded-[14px] p-5 text-[#fbf6ee]" style={{ backgroundImage: "linear-gradient(135deg,#3a2316,#7a4b2a,#c08a52,#3a2316)" }}>
              <div className="grid h-[150px] place-items-center">
                <Product angle={1} accent="#c08a52" className="jr3-float h-[140px] w-auto" />
              </div>
              <p className="mt-3 text-[18px] font-[700]">Monsoon Malabar, 250 g</p>
              <p className="mt-1 text-[14px] opacity-80">
                Whole bean or filter grind · <Price now="₹640" />
              </p>
              <a href="#" onClick={(e) => e.preventDefault()} className="mt-4 inline-flex rounded-full bg-[#fbf6ee] px-5 py-2.5 text-[14px] font-[650] text-[#3a2316]">
                Add to bag
              </a>
            </div>
          </div>
        </aside>
      </div>
      <div className="mt-[clamp(56px,7vw,104px)] border-t border-[var(--sx-line)] pt-8">
        <p className="text-[13px] font-[650] uppercase tracking-[0.16em] text-[var(--sx-muted)]">Keep reading</p>
        {RELATED.map((x) => (
          <a key={x.t} href="#" onClick={(e) => e.preventDefault()} className="group grid grid-cols-1 items-center gap-[clamp(20px,3vw,48px)] border-b border-[var(--sx-line)] py-[clamp(20px,2.4vw,32px)] md:grid-cols-12">
            <Pic i={x.i} ratio="16/10" className="md:col-span-4" />
            <div className="md:col-span-7 md:col-start-6">
              <p className="text-[13px] text-[var(--sx-muted)]">
                <span className="font-[650] text-[var(--sx-accent)]">{x.c}</span> · {x.m}
              </p>
              <p className="sx-display mt-3 text-[clamp(24px,2.4vw,40px)] font-[700] leading-tight transition-colors group-hover:text-[var(--sx-accent)]">{x.t}</p>
              <p className="mt-3 max-w-[56ch] text-[16px] leading-relaxed text-[var(--sx-muted)]">{x.d}</p>
            </div>
          </a>
        ))}
      </div>
    </Sec>
  );
}

// ── JR07 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const NINE = [
  ["Catch the Chinese nets at dawn", "The cantilevered nets go down at first light; the fishermen will let you pull a rope if you ask."],
  ["Walk Jew Town before the shops open", "Spice-sack warehouses, blue shutters and the smell of dried ginger at eight in the morning."],
  ["Eat appam on Princess Street", "Lacy rice pancakes with a pepper-sharp stew, at the corner stall with the green bench."],
  ["Cycle the old Dutch quarter", "Flat lanes, rain trees and houses with low verandas. Our bikes are free for guests."],
  ["See a Kathakali make-up session", "Ninety minutes of rice paste and pigment, before a one-hour performance at six."],
  ["Take the ferry to Vypeen", "Four rupees, twelve minutes across the harbour mouth, dolphins if you are lucky."],
  ["Find the art cafés of Burgher Street", "Old godowns turned galleries, most with a garden and a cold coffee."],
  ["Learn to cook a meen curry", "Kodampuli, coconut and curry leaf, in our kitchen, with lunch at the end."],
  ["Watch the sun set at the beach walk", "Sea wall, roasted peanuts, and the whole town out for an hour."],
];
const EXPERIENCES = [
  { i: 1, t: "Dawn nets & harbour breakfast", dur: "3 hours", lvl: 1, p: "₹2,400" },
  { i: 2, t: "Spice quarter walk with a historian", dur: "2.5 hours", lvl: 2, p: "₹1,800" },
  { i: 3, t: "Kathakali backstage evening", dur: "3 hours", lvl: 1, p: "₹2,900" },
  { i: 0, t: "Backwater kayak to Kumbalangi", dur: "5 hours", lvl: 3, p: "₹4,200" },
];
const MORE = [
  { i: 2, t: "48 hours in Alleppey" },
  { i: 0, t: "A monsoon packing list" },
  { i: 3, t: "Where Kochi eats breakfast" },
  { i: 1, t: "The ferry routes, mapped" },
  { i: 2, t: "Five quiet beaches up the coast" },
  { i: 3, t: "Our chef's market morning" },
];

/** JR07 · Numbered guide with bookable experiences: a long-form article column with numbered subheads (nine things to
 *  do), ending in a row of experience cards (duration, activity level, price, Reserve) that snap in, then a related
 *  articles carousel that drifts by itself from the content edge. */
function JR07() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  const [hi] = useAutoCycle(r, NINE.length, 1300);
  return (
    <Sec innerRef={r} theme="ink" font="wide" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#f0b74a", ["--sx-accent-text" as string]: "#120c02" }}>
      <style>{JR_CSS}</style>
      <article className="mx-auto max-w-[820px]">
        <p className="text-[13px] text-[var(--sx-muted)]">
          <span className="font-[650] text-[var(--sx-accent)]">Guides</span> · Fort Kochi · 11 min read
        </p>
        <H className="mt-5 text-[clamp(40px,4.6vw,76px)]">Nine slow things to do in Fort Kochi.</H>
        <P className="mt-6">The harbour town our hotel calls home, as our concierge Ira Menon would show it to a friend: mostly on foot, mostly before ten or after four.</P>
      </article>
      <Pic i={3} ratio="21/9" className="mx-auto mt-[clamp(32px,4vw,56px)] max-w-[1180px]" label="FORT KOCHI · THE HARBOUR MOUTH" />
      <ol className="mx-auto mt-[clamp(40px,5vw,72px)] max-w-[820px]">
        {NINE.map(([h, b], k) => (
          <li key={h} className="grid grid-cols-[clamp(56px,6vw,84px)_minmax(0,1fr)] gap-4 border-t border-[var(--sx-line)] py-6">
            <span className={`sx-display text-[clamp(34px,3.4vw,52px)] font-[700] leading-none tabular-nums transition-colors duration-500 ${k === hi ? "text-[var(--sx-accent)]" : "text-[color-mix(in_srgb,var(--sx-text)_22%,transparent)]"}`}>{k + 1}</span>
            <div>
              <h3 className="text-[clamp(20px,1.7vw,26px)] font-[700] leading-tight">{h}</h3>
              <p className="mt-2 text-[16px] leading-relaxed text-[var(--sx-muted)]">{b}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-[clamp(56px,7vw,104px)] flex flex-wrap items-end justify-between gap-4">
        <H as="h3" className="text-[clamp(30px,3vw,48px)]">Book it with us.</H>
        <p className="text-[15px] text-[var(--sx-muted)]">Hosted by our team · free cancellation up to 24 hours before</p>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-[clamp(14px,1.6vw,24px)] sm:grid-cols-2 lg:grid-cols-4">
        {EXPERIENCES.map((x) => (
          <div key={x.t} data-m-card className="sx-card flex flex-col overflow-hidden">
            <Pic i={x.i} ratio="4/3" round={false} />
            <div className="flex flex-1 flex-col p-[clamp(18px,1.8vw,26px)]">
              <p className="text-[18px] font-[700] leading-snug">{x.t}</p>
              <div className="mt-4 flex items-center justify-between text-[13px] text-[var(--sx-muted)]">
                <span>{x.dur}</span>
                <span className="flex items-center gap-1.5">
                  Activity
                  {[1, 2, 3].map((d) => (
                    <span key={d} className={`h-2 w-2 rounded-full ${d <= x.lvl ? "bg-[var(--sx-accent)]" : "bg-[var(--sx-line)]"}`} />
                  ))}
                </span>
              </div>
              <div className="mt-auto flex items-center justify-between gap-3 pt-6">
                <span className="text-[15px]">
                  <Price now={x.p} /> <span className="text-[var(--sx-muted)]">/ guest</span>
                </span>
                <Btn className="px-4! py-2.5! text-[14px]!">Reserve</Btn>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-[clamp(56px,7vw,104px)] flex items-center justify-between gap-4">
        <p className="text-[13px] font-[650] uppercase tracking-[0.16em] text-[var(--sx-muted)]">More from the journal</p>
        <Btn kind="link">All guides →</Btn>
      </div>
      <div className="mt-6 grid min-w-0 grid-cols-[minmax(0,1fr)] overflow-hidden">
        <div className="jr3-track flex w-max gap-[clamp(14px,1.6vw,24px)]">
          {[...MORE, ...MORE].map((m, k) => (
            <a key={k} href="#" onClick={(e) => e.preventDefault()} aria-hidden={k >= MORE.length} className="w-[clamp(240px,22vw,320px)] shrink-0">
              <Pic i={m.i} ratio="3/2" />
              <p className="mt-3 text-[17px] font-[650] leading-snug">{m.t}</p>
            </a>
          ))}
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "JR05", name: "Magazine spread with page flip", motion: "M1", C: JR05 },
  { code: "JR06", name: "Long-read with sticky side rail", motion: "M23", C: JR06 },
  { code: "JR07", name: "Numbered guide with bookable experiences", motion: "M34", C: JR07 },
];
