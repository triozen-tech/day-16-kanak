"use client";

// GL · Gallery layouts, batch 6 (docs/SECTION-MENU.md): GL27 one set of cards that morphs between grid, tilted grid,
// ring and gallery formations, GL28 album cards on a spinning helix column (receding cards dither out), GL29 themed
// photo sets behind tabs with prev/next and a count, GL30 filter chips with counts that reflow a grid (click opens a
// lightbox), GL31 a pinned tunnel where each image grows from a dot at the centre. All play hands-free while on
// screen and show a plain, readable state in ?static=1.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Flip as FlipT } from "gsap/Flip";
import { gsap, loadPlugin, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { scene } from "../fx/shared";
import { Btn, H, P, Price, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

type FlipState = ReturnType<typeof FlipT.getState>;

/** True once we know motion is allowed (false on the server, in ?static=1 and with reduced motion). */
function useLive() {
  const [live, setLive] = useState(false);
  useEffect(() => {
    if (!prefersReducedMotion()) setLive(true);
  }, []);
  return live;
}

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

const CSS = `.gl6kb img{animation:gl6s 4.4s linear infinite alternate,gl6t 3.1s ease-in-out infinite alternate}
.gl6kb.alt img{animation-duration:5.2s,3.7s;animation-direction:alternate-reverse}
@keyframes gl6s{from{scale:1.05}to{scale:1.2}}@keyframes gl6t{from{translate:-3% 2%}to{translate:3% -2%}}
.gl6glow{animation:gl6g 8s linear infinite alternate}
@keyframes gl6g{from{translate:-30% -18%}to{translate:30% 22%}}
.gl6swap{animation:gl6sw 1.1s cubic-bezier(.22,1,.36,1) both}
@keyframes gl6sw{from{opacity:.2;scale:1.18}to{opacity:1;scale:1}}
html.is-static .gl6kb img,html.is-static .gl6glow,html.is-static .gl6swap{animation:none}
html.is-static {.gl6kb img,.gl6glow,.gl6swap{animation:none}}`;

/** A placeholder photo whose image drifts slowly (two loops of different periods, so it never looks frozen). */
function Shot({ i, w = 1000, h = 1250, alt = false, className = "" }: { i: number; w?: number; h?: number; alt?: boolean; className?: string }) {
  return (
    <div className={`gl6kb ${alt ? "alt" : ""} absolute inset-0 overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={scene(i, w, h, "")} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
    </div>
  );
}

const Glow = ({ className = "" }: { className?: string }) => (
  <div aria-hidden className={`gl6glow pointer-events-none absolute rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_38%,transparent),transparent)] ${className}`} />
);

/* ───────────────────────────── GL27 · Formation switcher gallery ───────────────────────────── */

const PIECES = [
  { n: "Arc Chair", p: "₹38,500", i: 2 },
  { n: "Dune Sofa", p: "₹1,24,000", i: 0 },
  { n: "Pebble Stool", p: "₹12,800", i: 3 },
  { n: "Halo Lamp", p: "₹18,900", i: 1 },
  { n: "Slab Table", p: "₹86,000", i: 0 },
  { n: "Reed Screen", p: "₹42,000", i: 2 },
  { n: "Moor Bench", p: "₹29,500", i: 1 },
  { n: "Ripple Rug", p: "₹56,000", i: 3 },
];
const N27 = PIECES.length;
const FORMS = ["Grid", "Tilted", "Ring", "Gallery"] as const;
const FORM_ICON = [
  "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  "M3 12l9-8 9 8-9 8z",
  "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  "M3 4h12v16H3zM18 4h3v4h-3zM18 10h3v4h-3zM18 16h3v4h-3z",
];

/** One transform per card for formation `f` (same function list every time, so CSS interpolates each part). */
function pose(f: number, k: number, focus: number, cw: number, ch: number) {
  let x = 0, y = 0, ry = 0, z = 0, s = 1;
  if (f === 0 || f === 1) {
    x = ((k % 4) - 1.5) * cw * 1.14;
    y = (Math.floor(k / 4) - 0.5) * ch * 1.1;
    z = f === 1 ? (k % 2 ? 50 : 0) : 0;
  } else if (f === 2) {
    const a = k * (360 / N27);
    ry = a > 180 ? a - 360 : a;
    z = cw * 1.55;
  } else {
    if (k === focus) {
      x = -cw * 1.45;
      s = 1.8;
    } else {
      const j = (k - focus + N27) % N27 - 1; // 0..6
      x = cw * 0.6 + (j % 4) * cw * 0.72;
      y = (Math.floor(j / 4) - 0.5) * ch * 0.74;
      s = 0.62;
    }
  }
  return { t: `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0px) rotateY(${ry}deg) translateZ(${z.toFixed(1)}px) scale(${s})`, big: s >= 1 };
}

/** GL27 · The same eight cards morph between a flat grid, a tilted grid, a ring and a gallery (one big + thumbnails). Auto-switches; the control takes over. */
function GL27() {
  const r = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M31");
  const live = useLive();
  const [step, setStep] = useState(0);
  const [cw, setCw] = useState(170);
  useEvery(r, 2800, () => setStep((v) => v + 1));
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setCw(Math.round(Math.min(200, Math.max(96, el.clientWidth * 0.135)))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const f = step % 4;
  const focus = Math.floor(step / 4) % N27;
  const ch = Math.round(cw * 1.3);
  const ease = "cubic-bezier(.65,0,.35,1)";
  const tr = live ? `transform 1.1s ${ease}, opacity .6s` : "none";
  const fp = PIECES[focus];
  return (
    <Sec innerRef={r} theme="paper" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <style>{CSS}</style>
      <Glow className="left-[20%] top-[25%] h-[70%] w-[60%]" />
      <div className="relative flex flex-wrap items-end justify-between gap-6">
        <div>
          <H className="max-w-[13ch] text-[clamp(44px,5.2vw,88px)]">Eight pieces, four ways to see them.</H>
          <P className="mt-5 max-w-[44ch]">The Tarn collection by Oru Studio: solid ash and hand-loomed wool, made to order in Mysuru in eight weeks.</P>
        </div>
        <div className="inline-grid grid-cols-4 rounded-full border border-[var(--sx-line)] bg-[var(--sx-surface)] p-1" role="tablist" aria-label="Formation">
          {FORMS.map((x, k) => (
            <button key={x} role="tab" aria-selected={k === f} onClick={() => setStep((v) => v - (v % 4) + k)} className={`flex items-center gap-2 rounded-full px-[clamp(12px,1.4vw,20px)] py-2.5 text-[14px] font-[650] transition-colors ${k === f ? "bg-[var(--sx-text)] text-[var(--sx-bg)]" : "text-[var(--sx-muted)]"}`}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d={FORM_ICON[k]} />
              </svg>
              {x}
            </button>
          ))}
        </div>
      </div>

      <div data-m-card className="relative mt-[clamp(28px,3vw,48px)]">
        <div ref={stage} className="relative h-[clamp(540px,66vh,660px)] overflow-hidden rounded-[var(--sx-radius)] border border-[var(--sx-line)] bg-[color-mix(in_srgb,var(--sx-text)_4%,var(--sx-bg))]" style={{ perspective: "1600px" }}>
          <div className="absolute left-1/2 top-1/2 h-0 w-0" style={{ transformStyle: "preserve-3d", transform: f === 1 ? "rotateX(50deg) rotateZ(-24deg) scale(.84)" : f === 2 ? "rotateX(-10deg)" : "none", transition: live ? `transform 1.1s ${ease}` : "none" }}>
            <div className="absolute left-0 top-0" style={{ transformStyle: "preserve-3d", transform: `rotateY(${f === 2 ? -45 : 0}deg)`, transition: live ? (f === 2 ? "transform 2.8s linear" : `transform 1.1s ${ease}`) : "none" }}>
              {PIECES.map((p, k) => {
                const ps = pose(f, k, focus, cw, ch);
                return (
                  <div key={p.n} className="absolute overflow-hidden rounded-[14px] shadow-[0_30px_50px_-30px_rgba(28,24,19,.55)]" style={{ width: cw, height: ch, left: -cw / 2, top: -ch / 2, transform: ps.t, transition: tr, backfaceVisibility: "hidden" }}>
                    <Shot i={p.i} w={600} h={780} alt={k % 2 === 1} />
                    <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(20,14,8,.75))] p-3 text-white transition-opacity duration-500" style={{ opacity: ps.big ? 1 : 0 }}>
                      <p className="text-[13px] font-[650] leading-tight">{p.n}</p>
                      <p className="text-[12px] text-white/75">{p.p}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 text-[15px]">
          <p className="text-[var(--sx-muted)]">
            {FORMS[f]} view · <span className="text-[var(--sx-text)]">{f === 3 ? fp.n : "8 pieces"}</span> {f === 3 && <Price now={fp.p} className="ml-1" />}
          </p>
          <Btn kind="link">Request the catalogue →</Btn>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────────── GL28 · Helix column carousel ───────────────────────────── */

const ALBUMS = [
  { t: "Night Bus", a: "Kavi & the Lows", i: 3 },
  { t: "Glass Monsoon", a: "Saira Bloom", i: 1 },
  { t: "Static Garden", a: "Fourth Floor", i: 0 },
  { t: "Low Orbit", a: "Neel Arora", i: 2 },
  { t: "Paper Engines", a: "The Quiet Club", i: 3 },
  { t: "Saltwater FM", a: "Mira Das", i: 1 },
  { t: "Copper Sky", a: "Harbour Lights", i: 0 },
  { t: "Afterhours", a: "Ritu Sen", i: 2 },
  { t: "Signal Fire", a: "Kavi & the Lows", i: 1 },
  { t: "Tin Roof Rain", a: "Saira Bloom", i: 3 },
  { t: "Blue Hour", a: "Fourth Floor", i: 0 },
  { t: "Coastline", a: "Neel Arora", i: 2 },
  { t: "Last Ferry", a: "Mira Das", i: 1 },
  { t: "Lantern", a: "Harbour Lights", i: 3 },
];
const N28 = ALBUMS.length;
const TURNS = 2;

function helix(k: number, a: number, span: number, R: number) {
  const s = k / (N28 - 1);
  const ang = s * TURNS * 360 + a;
  const c = Math.cos((ang * Math.PI) / 180);
  const f = (c + 1) / 2; // 1 = facing us, 0 = at the back
  return {
    t: `translate(-50%,-50%) translateY(${((s - 0.5) * span).toFixed(1)}px) rotateY(${ang.toFixed(2)}deg) translateZ(${R.toFixed(1)}px)`,
    o: 0.12 + 0.88 * f * f,
    d: 1 - f,
    c,
  };
}

/** GL28 · Fourteen album cards sit on a spiral column that spins at the centre; cards turning away dither and fade. */
function GL28() {
  const stage = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const dith = useRef<(HTMLDivElement | null)[]>([]);
  const [front, setFront] = useState(0);
  useEffect(() => {
    const el = stage.current;
    if (!el || prefersReducedMotion()) return;
    let seen = false;
    let a = 0;
    let shown = -1;
    const io = new IntersectionObserver(([e]) => (seen = e.isIntersecting));
    io.observe(el);
    const tick = (_t: number, dt: number) => {
      if (!seen) return;
      a = (a + (Math.min(dt, 50) / 1000) * 24) % 360;
      const span = el.clientHeight * 0.74;
      const R = Math.min(el.clientWidth * 0.27, 200);
      let best = 0;
      let bc = -2;
      cards.current.forEach((c, k) => {
        if (!c) return;
        const h = helix(k, a, span, R);
        c.style.transform = h.t;
        c.style.opacity = h.o.toFixed(3);
        const d = dith.current[k];
        if (d) d.style.opacity = h.d.toFixed(3);
        // the front-most card nearest the middle of the column is "now playing"
        const score = h.c - Math.abs(k / (N28 - 1) - 0.5) * 1.2;
        if (score > bc) {
          bc = score;
          best = k;
        }
      });
      if (best !== shown) {
        shown = best;
        setFront(best);
      }
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      io.disconnect();
    };
  }, []);
  const al = ALBUMS[front];
  return (
    <Sec theme="ink" font="wide" className="py-[clamp(72px,9vw,140px)]">
      <style>{CSS}</style>
      <Glow className="left-[25%] top-[10%] h-[80%] w-[50%]" />
      <div className="relative grid grid-cols-1 items-center gap-[clamp(32px,4vw,64px)] md:grid-cols-12">
        <div className="md:col-span-3">
          <H className="text-[clamp(30px,2.8vw,46px)]">Late Signal, Volume Four.</H>
          <P className="mt-5">Fourteen records from the label&apos;s night sessions, pressed on 180 g vinyl in Mumbai. 500 copies of each.</P>
          <div className="mt-8">
            <Btn>Pre-order the box</Btn>
          </div>
        </div>
        <div ref={stage} className="relative h-[clamp(540px,72vh,700px)] overflow-hidden [mask-image:linear-gradient(180deg,transparent,#000_14%,#000_86%,transparent)] md:col-span-6">
          <div className="absolute inset-0" style={{ perspective: "1100px", transformStyle: "preserve-3d" }}>
            {ALBUMS.map((x, k) => {
              const h = helix(k, 0, 520, 180);
              return (
                <div
                  key={x.t}
                  ref={(el) => {
                    cards.current[k] = el;
                  }}
                  className="absolute left-1/2 top-1/2 h-[clamp(96px,8.6vw,132px)] w-[clamp(96px,8.6vw,132px)] overflow-hidden rounded-[10px] shadow-[0_20px_40px_-20px_rgba(0,0,0,.8)]"
                  style={{ transform: h.t, opacity: h.o }}
                >
                  <Shot i={x.i} w={400} h={400} alt={k % 2 === 1} />
                  <div
                    ref={(el) => {
                      dith.current[k] = el;
                    }}
                    className="absolute inset-0 bg-[radial-gradient(rgba(7,9,15,.95)_1.1px,transparent_1.7px)] bg-[length:4px_4px]"
                    style={{ opacity: h.d }}
                  />
                </div>
              );
            })}
          </div>
        </div>
        <div className="md:col-span-3">
          <p className="text-[13px] uppercase tracking-[0.14em] text-[var(--sx-muted)]">Now turning</p>
          <p className="sx-display mt-3 text-[clamp(22px,2vw,30px)] font-[700] leading-tight">{al.t}</p>
          <p className="mt-1 text-[15px] text-[var(--sx-muted)]">{al.a}</p>
          <ul className="mt-8 divide-y divide-[var(--sx-line)] border-y border-[var(--sx-line)] text-[15px]">
            {[
              ["Single LP", "₹1,890"],
              ["Box of 14", "₹21,500"],
              ["Test pressing", "₹4,200"],
            ].map(([k, v]) => (
              <li key={k} className="flex justify-between py-3">
                <span>{k}</span>
                <Price now={v} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────────── GL29 · Tabbed photo sets ───────────────────────────── */

const SETS = [
  { t: "Suites", d: "Eleven suites on stilts above the Sabar river, each with a plunge pool and an outdoor bath.", from: "Suites from ₹38,000 a night", pics: [3, 1, 0, 2, 1], caps: ["River Suite", "Bath deck", "Morning light", "Reading nook", "Plunge pool"] },
  { t: "Dining", d: "A firelit kitchen, a long table under the fig tree and breakfast brought to your deck.", from: "Full board included", pics: [0, 2, 3, 1], caps: ["Fig tree table", "Open kitchen", "Deck breakfast", "Wine room"] },
  { t: "Wellness", d: "An open-air spa in the old granary: Ayurvedic oils, river-stone massage and a cold plunge.", from: "Treatments from ₹6,500", pics: [1, 3, 2, 0], caps: ["Granary spa", "Yoga deck", "Cold plunge", "Steam room"] },
  { t: "Wildlife", d: "Leopards on the ridge, otters at dusk. Two guided drives a day with naturalists who grew up here.", from: "Drives included", pics: [2, 0, 3, 1, 2], caps: ["Ridge drive", "Otter bend", "Bird hide", "Night walk", "Salt lick"] },
];
const FLAT = SETS.flatMap((s, t) => s.pics.map((_, k) => [t, k] as const));

/** GL29 · Tabs (Suites, Dining, Wellness, Wildlife) above a large main image with prev/next and a count; steps through each set on its own. */
function GL29() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  const live = useLive();
  const [n, setN] = useState(0);
  useEvery(r, 2200, () => setN((v) => (v + 1) % FLAT.length));
  const [t, k] = FLAT[n];
  const set = SETS[t];
  const go = (d: number) => setN((v) => (v + d + FLAT.length) % FLAT.length);
  const tab = (x: number) => setN(FLAT.findIndex(([a]) => a === x));
  return (
    <Sec innerRef={r} theme="stone" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <style>{CSS}</style>
      <Glow className="right-[0%] top-[0%] h-[60%] w-[50%]" />
      <div className="relative">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <H className="max-w-[14ch] text-[clamp(48px,6vw,104px)]">Stay a while at Sabar Lodge.</H>
          <div data-m-card className="flex flex-wrap gap-2" role="tablist">
            {SETS.map((s, x) => (
              <button key={s.t} role="tab" aria-selected={x === t} onClick={() => tab(x)} className={`rounded-full border px-5 py-2.5 text-[15px] font-[600] transition-colors ${x === t ? "border-[var(--sx-text)] bg-[var(--sx-text)] text-[var(--sx-bg)]" : "border-[var(--sx-line)] text-[var(--sx-muted)]"}`}>
                {s.t} <span className="ml-1 tabular-nums opacity-60">{s.pics.length}</span>
              </button>
            ))}
          </div>
        </div>

        <div data-m-card className="relative mt-[clamp(28px,3vw,44px)] aspect-[21/9] overflow-hidden rounded-[var(--sx-radius)] max-md:aspect-[4/3]">
          <div key={`${t}-${k}`} className={`absolute inset-0 ${live ? "gl6swap" : ""}`}>
            <Shot i={set.pics[k]} w={1800} h={780} alt={k % 2 === 1} />
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(10,12,14,.7))]" />
          {[-1, 1].map((d) => (
            <button key={d} aria-label={d < 0 ? "Previous" : "Next"} onClick={() => go(d)} className={`absolute top-1/2 grid h-14 w-14 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-[20px] text-[#111418] backdrop-blur ${d < 0 ? "left-5" : "right-5"}`}>
              {d < 0 ? "←" : "→"}
            </button>
          ))}
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-[clamp(18px,2.4vw,32px)] text-white">
            <p className="sx-display text-[clamp(26px,2.6vw,40px)] leading-none">{set.caps[k]}</p>
            <p className="text-[15px] tabular-nums text-white/85">
              {String(k + 1).padStart(2, "0")} / {String(set.pics.length).padStart(2, "0")}
            </p>
          </div>
        </div>

        <div data-m-card className="mt-6 grid grid-cols-1 items-center gap-6 md:grid-cols-12">
          <P className="md:col-span-7">{set.d}</P>
          <div className="flex flex-wrap items-center justify-end gap-5 md:col-span-5">
            <span className="text-[15px] text-[var(--sx-muted)]">{set.from}</span>
            <Btn>Check dates</Btn>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────────── GL30 · Filter-chip gallery with lightbox ───────────────────────────── */

const WORKS = [
  { n: "Moon jar", c: "Ceramics", p: "₹9,800", i: 1 },
  { n: "Indigo throw", c: "Textiles", p: "₹6,400", i: 3 },
  { n: "Paper pendant", c: "Lighting", p: "₹11,200", i: 0 },
  { n: "Ash stool", c: "Furniture", p: "₹14,500", i: 2 },
  { n: "Ash glaze bowl", c: "Ceramics", p: "₹2,600", i: 0 },
  { n: "Cane sconce", c: "Lighting", p: "₹7,900", i: 1 },
  { n: "Kantha cushion", c: "Textiles", p: "₹3,200", i: 2 },
  { n: "Ink vase", c: "Ceramics", p: "₹4,100", i: 3 },
  { n: "Brass floor lamp", c: "Lighting", p: "₹24,000", i: 2 },
  { n: "Teak side table", c: "Furniture", p: "₹18,600", i: 1 },
  { n: "Handloom runner", c: "Textiles", p: "₹5,300", i: 0 },
  { n: "Salt cellar", c: "Ceramics", p: "₹1,450", i: 2 },
];
const CHIPS = ["All", "Ceramics", "Textiles", "Lighting", "Furniture"];

/** GL30 · Chips with counts above a 4-column grid; choosing a chip (auto-cycles) moves its pieces to the front and dims the rest. Click a piece for a lightbox. */
function GL30() {
  const r = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M6");
  const [c, setC] = useState(0);
  const [lb, setLb] = useState<number | null>(null);
  const F = useRef<typeof FlipT | null>(null);
  const st = useRef<FlipState | null>(null);
  useEffect(() => {
    loadPlugin("Flip").then((f) => (F.current = f as typeof FlipT));
  }, []);
  const pick = (x: number) => {
    if (F.current && grid.current) st.current = F.current.getState(grid.current.querySelectorAll("[data-flip-id]"));
    setC(x);
  };
  useEvery(r, 2400, () => {
    if (lb === null) pick((c + 1) % CHIPS.length);
  });
  useLayoutEffect(() => {
    const s = st.current;
    if (!F.current || !s || !grid.current) return;
    st.current = null;
    F.current.from(s, { targets: grid.current.querySelectorAll("[data-flip-id]"), duration: 0.8, ease: "power3.inOut", stagger: 0.025 });
  }, [c]);
  const cat = CHIPS[c];
  const match = (w: (typeof WORKS)[number]) => cat === "All" || w.c === cat;
  const list = [...WORKS.filter(match), ...WORKS.filter((w) => !match(w))];
  const box = lb === null ? null : WORKS[lb];
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <style>{CSS}</style>
      <Glow className="left-[10%] top-[30%] h-[70%] w-[55%]" />
      <div className="relative">
        <div className="grid grid-cols-1 items-end gap-6 md:grid-cols-12">
          <H className="text-[clamp(44px,5.4vw,92px)] md:col-span-7">The Kora shelf.</H>
          <P className="max-w-[40ch] md:col-span-5 md:pb-2">Twelve objects from our studio in Auroville, each made by one maker, start to finish. Pick a craft to bring it forward.</P>
        </div>
        <div className="mt-[clamp(28px,3vw,44px)] flex flex-wrap gap-2">
          {CHIPS.map((x, k) => (
            <button key={x} onClick={() => pick(k)} className={`flex items-center gap-2 rounded-full border px-4 py-2 text-[15px] font-[600] transition-colors ${k === c ? "border-[var(--sx-accent)] bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "border-[var(--sx-line)]"}`}>
              {x}
              <span className={`rounded-full px-2 text-[12px] tabular-nums ${k === c ? "bg-white/25" : "bg-[color-mix(in_srgb,var(--sx-text)_8%,transparent)]"}`}>{x === "All" ? WORKS.length : WORKS.filter((w) => w.c === x).length}</span>
            </button>
          ))}
        </div>
        <div ref={grid} className="mt-[clamp(24px,2.6vw,36px)] grid grid-cols-2 gap-[clamp(10px,1.2vw,18px)] md:grid-cols-4">
          {list.map((w) => {
            const on = match(w);
            const idx = WORKS.indexOf(w);
            return (
              <button key={w.n} data-flip-id={w.n} data-m-card data-cursor="View" onClick={() => setLb(idx)} className="group relative aspect-[4/3] overflow-hidden rounded-[14px] text-left transition-[opacity,filter] duration-700" style={{ opacity: on ? 1 : 0.28, filter: on ? "none" : "grayscale(1)" }}>
                <Shot i={w.i} w={800} h={600} alt={idx % 2 === 1} />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_50%,rgba(20,14,8,.72))]" />
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3 text-white">
                  <span>
                    <span className="block text-[15px] font-[650] leading-tight">{w.n}</span>
                    <span className="block text-[12px] text-white/70">{w.c}</span>
                  </span>
                  <Price now={w.p} className="text-[14px]" />
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {box && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-[rgba(20,14,8,.82)] p-6 backdrop-blur-sm" onClick={() => setLb(null)}>
          <div className="relative w-[min(90vw,980px)]" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-[18px]">
              <Shot i={box.i} w={1400} h={1050} />
            </div>
            <div className="mt-4 flex items-center justify-between gap-4 text-white">
              <p className="text-[18px] font-[650]">
                {box.n} <span className="ml-2 text-[15px] font-[400] text-white/70">{box.c}</span>
              </p>
              <span className="flex items-center gap-5">
                <Price now={box.p} className="text-[17px]" />
                <button onClick={() => setLb(null)} className="rounded-full border border-white/30 px-4 py-2 text-[14px]">
                  Close
                </button>
              </span>
            </div>
          </div>
        </div>
      )}
    </Sec>
  );
}

/* ───────────────────────────── GL31 · Centre-point image tunnel ───────────────────────────── */

const FILM = [
  { t: "Salt", d: "Washed linen shirts, Kutch", i: 3 },
  { t: "Dust", d: "Raw-hem trousers, Jaisalmer", i: 2 },
  { t: "Tide", d: "Indigo co-ords, Alibaug", i: 1 },
  { t: "Heat", d: "Open-weave dresses, Hampi", i: 0 },
  { t: "Dusk", d: "Night linen, Varkala", i: 2 },
];
const N31 = FILM.length;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease31 = (v: number) => 1 - Math.pow(1 - v, 3);

/** GL31 · Pinned stage: each image grows from a dot at the centre to full frame (oversaturated → true colour), then the next starts. */
function GL31() {
  const track = useRef<HTMLDivElement>(null);
  const layers = useRef<(HTMLDivElement | null)[]>([]);
  const dots = useRef<(HTMLSpanElement | null)[]>([]);
  const live = useLive();
  const [act, setAct] = useState(0);
  useEffect(() => {
    if (!live || !track.current) return;
    let shown = 0;
    const apply = (p: number) => {
      const f = p * (N31 - 1); // 0 … 4
      let a = 0;
      for (let k = 1; k < N31; k++) {
        const el = layers.current[k];
        const pre = f - (k - 1);
        const e = ease31(clamp01((pre - 0.1) / 0.8));
        if (el) {
          el.style.clipPath = `circle(${(0.6 + e * 74).toFixed(2)}% at 50% 50%)`;
          el.style.filter = `saturate(${(2.6 - 1.6 * e).toFixed(2)})`;
          const img = el.firstElementChild as HTMLElement | null;
          if (img) img.style.transform = `scale(${(1.45 - 0.45 * e).toFixed(3)})`;
        }
        const d = dots.current[k];
        if (d) d.style.opacity = pre > -0.2 && pre < 0.2 ? "1" : "0"; // the dot shows just before its image opens
        if (e > 0.55) a = k;
      }
      if (a !== shown) {
        shown = a;
        setAct(a);
      }
    };
    const st = ScrollTrigger.create({ trigger: track.current, start: "top top", end: "bottom bottom", onUpdate: (s) => apply(s.progress) });
    ScrollTrigger.refresh();
    apply(st.progress);
    return () => st.kill();
  }, [live]);
  const cur = FILM[act];
  return (
    <Sec theme="ink" font="condensed" full className="overflow-clip!">
      <style>{CSS}</style>
      <div ref={track} className="relative" style={{ height: live ? "190vh" : "auto" }}>
        <div className={`${live ? "sticky top-0 h-svh" : "relative h-[clamp(620px,100svh,920px)]"} overflow-hidden`}>
          {FILM.map((x, k) => (
            <div
              key={x.t}
              ref={(el) => {
                layers.current[k] = el;
              }}
              className="absolute inset-0 overflow-hidden"
              style={k ? { clipPath: "circle(0% at 50% 50%)", filter: "saturate(2.6)" } : undefined}
            >
              <div className="absolute inset-0">
                <Shot i={x.i} w={1800} h={1100} alt={k % 2 === 1} />
              </div>
            </div>
          ))}
          {FILM.map((x, k) =>
            k ? (
              <span
                key={`d${x.t}`}
                ref={(el) => {
                  dots.current[k] = el;
                }}
                className="pointer-events-none absolute left-1/2 top-1/2 -ml-[7px] -mt-[7px] h-[14px] w-[14px] rounded-full bg-[var(--sx-accent)] shadow-[0_0_24px_var(--sx-accent)] transition-opacity duration-300"
                style={{ opacity: 0 }}
              />
            ) : null,
          )}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(7,9,15,.55),transparent_30%,transparent_60%,rgba(7,9,15,.8))]" />
          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-6 px-[clamp(20px,5vw,96px)] pt-[clamp(28px,5vh,56px)] text-white">
            <p className="max-w-[30ch] text-[15px] text-white/80">Saltmark · Summer 26, a short film in five places</p>
            <p className="text-[15px] tabular-nums text-white/80">
              {String(act + 1).padStart(2, "0")} / {String(N31).padStart(2, "0")}
            </p>
          </div>
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-6 px-[clamp(20px,5vw,96px)] pb-[clamp(28px,6vh,64px)] text-white">
            <div key={cur.t} className={live ? "gl6swap" : ""}>
              <H className="text-[clamp(72px,11vw,180px)] leading-[0.85]">{cur.t}</H>
              <p className="mt-3 text-[16px] text-white/80">{cur.d}</p>
            </div>
            <Btn>Shop the film</Btn>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "GL27", name: "Formation switcher gallery", motion: "M31", C: GL27 },
  { code: "GL28", name: "Helix column carousel", motion: "M33", C: GL28 },
  { code: "GL29", name: "Tabbed photo sets", motion: "M34", C: GL29 },
  { code: "GL30", name: "Filter-chip gallery with lightbox", motion: "M6", C: GL30 },
  { code: "GL31", name: "Centre-point image tunnel", motion: "M13", C: GL31 },
];
