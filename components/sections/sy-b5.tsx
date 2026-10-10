"use client";

// SY · Story layouts, batch 5 (docs/SECTION-MENU.md): SY13 a row of years that act as tabs over a split image/text
// panel (the year rolls in like an odometer, auto-advancing), SY14 milestones on a slowly turning circle with the
// active one's card in the middle. Both play hands-free while on screen and hold a sensible state in ?static=1.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { scene } from "../fx/shared";
import { Odometer } from "../fx/text";
import { Btn, H, P, Sec } from "./kit";
import type { SectionDef } from "./types";

/** Steps an index every `ms` while `ref` is on screen (stops off screen and in ?static=1). */
function useCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms: number) {
  const [i, setI] = useState(0);
  const [live, setLive] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    setLive(true);
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
  return [i, setI, live] as const;
}

const CSS = `.sy5kb img{animation:sy5kbs 4.6s linear infinite alternate,sy5kbt 3.2s ease-in-out infinite alternate}
@keyframes sy5kbs{from{scale:1.05}to{scale:1.2}}@keyframes sy5kbt{from{translate:-3% 2%}to{translate:3% -2%}}
.sy5fill{animation:sy5fill var(--d) linear forwards}@keyframes sy5fill{from{scale:0 1}to{scale:1 1}}
.sy5in{animation:sy5in .7s cubic-bezier(.2,.7,.2,1) both}@keyframes sy5in{from{opacity:0;translate:0 18px}to{opacity:1;translate:0 0}}
.sy5orbit{animation:sy5spin 36s linear infinite}.sy5counter{animation:sy5spin 36s linear infinite reverse}
@keyframes sy5spin{from{rotate:0deg}to{rotate:360deg}}
html.is-static .sy5kb img,html.is-static .sy5fill,html.is-static .sy5in,html.is-static .sy5orbit,html.is-static .sy5counter{animation:none}
html.is-static {.sy5kb img,.sy5fill,.sy5in,.sy5orbit,.sy5counter{animation:none}}`;

/* ───────────────────────────── SY13 · Year selector timeline ───────────────────────────── */

const VINTAGES = [
  { y: "1987", t: "Six rows of Chenin", d: "A retired schoolteacher plants Chenin Blanc on a basalt slope above the river, against every piece of local advice.", meta: "First 300 bottles, given away", i: 3 },
  { y: "1996", t: "The stone cellar", d: "A cellar is cut into the hill, so the barrels sleep at a steady 16 °C through the hottest Mays on record.", meta: "Cellar capacity: 40 barrels", i: 0 },
  { y: "2004", t: "Our first Shiraz", d: "Shiraz goes into the lower terraces. The 2004 is still the bottle regulars ask about at the tasting room.", meta: "Library release · ₹6,400", i: 2 },
  { y: "2013", t: "Wild yeast only", d: "We stop buying yeast. Every vintage since has fermented on what lives on the grape skins and in the old wood.", meta: "Natural ferment since 2013", i: 1 },
  { y: "2024", t: "A quiet great year", d: "A long, dry harvest and small berries. Our best Chenin in a decade, bottled in March and nearly gone.", meta: "Estate Chenin · ₹2,850", i: 3 },
];

/** SY13 · A row of years across the top acts as tabs; the selected (auto-advancing) year swaps a split image / text panel below. */
function SY13() {
  const r = useRef<HTMLDivElement>(null);
  const [i, setI, live] = useCycle(r, VINTAGES.length, 2800);
  const v = VINTAGES[i];
  return (
    <Sec innerRef={r} theme="ink" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <style>{CSS}</style>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[13ch] text-[clamp(46px,5.6vw,96px)]">Five vintages that made us.</H>
        <div className="max-w-[38ch] pb-2">
          <P>Nearly forty harvests on one hillside in the Sahyadris. These are the years the wine changed.</P>
        </div>
      </div>

      <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-5 border-t border-[var(--sx-line)]" role="tablist">
        {VINTAGES.map((x, k) => (
          <button key={x.y} role="tab" aria-selected={k === i} onClick={() => setI(k)} className="group relative pt-6 text-left">
            <span aria-hidden className="absolute inset-x-0 -top-px h-[3px] overflow-hidden">
              {k === i && <span key={`f${i}`} className={`block h-full w-full origin-left bg-[var(--sx-accent)] ${live ? "sy5fill" : ""}`} style={{ ["--d" as string]: "2800ms" }} />}
            </span>
            <span className={`sx-display block text-[clamp(26px,2.8vw,44px)] leading-none tabular-nums transition-colors duration-500 ${k === i ? "text-[var(--sx-text)]" : "text-[color-mix(in_srgb,var(--sx-muted)_70%,transparent)]"}`}>{x.y}</span>
            <span className={`mt-2 block text-[13px] transition-colors duration-500 max-md:hidden ${k === i ? "text-[var(--sx-accent)]" : "text-[var(--sx-muted)]"}`}>{x.t}</span>
          </button>
        ))}
      </div>

      <div className="mt-[clamp(32px,4vw,56px)] grid grid-cols-1 items-center gap-[clamp(28px,4vw,72px)] md:grid-cols-12">
        <div className="relative aspect-[16/11] overflow-hidden rounded-[var(--sx-radius,18px)] md:col-span-7">
          {VINTAGES.map((x, k) => (
            <div key={x.y} className="sy5kb absolute inset-0 transition-opacity duration-700" style={{ opacity: k === i ? 1 : 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={scene(x.i, 1400, 960, "")} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
            </div>
          ))}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_60%,rgba(7,9,15,.55))]" />
          <p className="absolute bottom-5 left-6 text-[13px] uppercase tracking-[0.16em] text-white/80">Harvest {v.y}</p>
        </div>
        <div key={v.y} className={`md:col-span-5 ${live ? "sy5in" : ""}`}>
          <Odometer value={v.y} className="sx-display text-[clamp(64px,7vw,120px)] font-[500] leading-none tracking-[-0.03em] text-[var(--sx-accent)]" />
          <h3 className="sx-display mt-5 text-[clamp(28px,2.6vw,42px)] font-[700] leading-[1.05] tracking-[-0.01em]">{v.t}</h3>
          <p className="mt-4 max-w-[42ch] text-[clamp(16px,1.2vw,19px)] leading-relaxed text-[var(--sx-muted)]">{v.d}</p>
          <p className="mt-6 border-t border-[var(--sx-line)] pt-5 text-[15px]">{v.meta}</p>
          <div className="mt-7">
            <Btn kind="ghost">Book a cellar tasting</Btn>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────────── SY14 · Orbital timeline ───────────────────────────── */

const MILESTONES = [
  { y: "2014", t: "A garage in Pune", d: "Two friends build a valve amplifier from salvaged parts, and their neighbours start asking for one." },
  { y: "2016", t: "The first speaker", d: "The Tessel One ships in walnut and felt. 400 units, sold out in eleven days." },
  { y: "2018", t: "A listening room", d: "We open a room in Bengaluru with no sales desk, just a sofa and a record wall." },
  { y: "2020", t: "Wireless, done right", d: "Lossless streaming arrives without losing the warm, slightly lazy low end." },
  { y: "2022", t: "Recycled aluminium", d: "Every enclosure is now cast from reclaimed cans and old window frames." },
  { y: "2025", t: "Open-back headphones", d: "The Tessel Air: 290 g, hand-wound drivers, ₹21,900. Our quietest launch yet." },
];

/** SY14 · Milestone nodes on a slowly turning circle around a centre card; the active node (auto-advancing) shows its story in the middle. */
function SY14() {
  const r = useRef<HTMLDivElement>(null);
  const [i, setI, live] = useCycle(r, MILESTONES.length, 2400);
  const m = MILESTONES[i];
  const R = 41; // ring radius, % of the stage
  // the spoke always turns forward (2025 → 2014 keeps going clockwise instead of unwinding)
  const spoke = useRef({ i: 0, deg: 180 });
  if (spoke.current.i !== i) {
    spoke.current.deg += (((i - spoke.current.i + MILESTONES.length) % MILESTONES.length) * 360) / MILESTONES.length;
    spoke.current.i = i;
  }
  return (
    <Sec innerRef={r} theme="paper" font="wide" className="py-[clamp(72px,9vw,140px)]">
      <style>{CSS}</style>
      <div className="grid grid-cols-1 items-center gap-[clamp(40px,5vw,96px)] md:grid-cols-12">
        <div className="md:col-span-5">
          <H className="max-w-[12ch] text-[clamp(40px,4.4vw,72px)]">Eleven years of better sound.</H>
          <P className="mt-6 max-w-[40ch]">From a garage amplifier to headphones you forget you are wearing. Every product we have made still gets repaired, free, for life.</P>
          <div className="mt-9 flex flex-wrap items-center gap-5">
            <Btn>Shop the range</Btn>
            <Btn kind="link">Visit a listening room →</Btn>
          </div>
        </div>
        <div className="md:col-span-7">
          {/* the orbit lives in its own clipped square stage, beside (never over) the heading */}
          <div className="relative mx-auto aspect-square w-full max-w-[640px] overflow-hidden">
            <div className="absolute inset-[9%] rounded-full border border-dashed border-[color-mix(in_srgb,var(--sx-text)_22%,transparent)]" />
            <div className="absolute inset-[24%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_22%,transparent),transparent)]" />
            <div className={`absolute inset-0 ${live ? "sy5orbit" : ""}`}>
              {/* spoke from the centre to the active node */}
              <span
                aria-hidden
                className="absolute left-1/2 top-1/2 w-[2px] origin-top bg-[var(--sx-accent)] transition-[rotate] duration-700"
                style={{ height: `${R}%`, marginLeft: -1, rotate: `${spoke.current.deg}deg` }}
              />
              {MILESTONES.map((x, k) => {
                const a = (k / MILESTONES.length) * Math.PI * 2;
                const on = k === i;
                return (
                  <button
                    key={x.y}
                    onClick={() => setI(k)}
                    aria-label={`${x.y}: ${x.t}`}
                    className="absolute h-[clamp(60px,5.4vw,80px)] w-[clamp(60px,5.4vw,80px)]"
                    style={{ left: `${50 + R * Math.sin(a)}%`, top: `${50 - R * Math.cos(a)}%`, translate: "-50% -50%" }}
                  >
                    <span className={`grid h-full w-full place-items-center rounded-full border text-[clamp(13px,1vw,15px)] font-[700] tabular-nums transition-all duration-500 ${live ? "sy5counter" : ""} ${on ? "scale-110 border-[var(--sx-accent)] bg-[var(--sx-accent)] text-[var(--sx-accent-text)] shadow-[0_14px_34px_-12px_color-mix(in_srgb,var(--sx-accent)_70%,transparent)]" : "border-[var(--sx-line)] bg-[var(--sx-surface)] text-[var(--sx-text)]"}`}>
                      {x.y}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div key={m.y} className={`sx-card w-[46%] p-[clamp(18px,2vw,28px)] text-center ${live ? "sy5in" : ""}`}>
                <p className="sx-display text-[clamp(30px,3vw,46px)] font-[800] leading-none tabular-nums text-[var(--sx-accent)]">{m.y}</p>
                <p className="mt-3 text-[clamp(16px,1.3vw,19px)] font-[700] leading-tight">{m.t}</p>
                <p className="mt-2 text-[clamp(13px,1vw,15px)] leading-snug text-[var(--sx-muted)]">{m.d}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "SY13", name: "Year selector timeline", motion: "M48", C: SY13 },
  { code: "SY14", name: "Orbital timeline", motion: "M33", C: SY14 },
];
