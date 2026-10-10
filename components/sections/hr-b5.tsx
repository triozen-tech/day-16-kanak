"use client";

// HR · Hero layouts, batch 5 (HR34–HR38). Each is a full designed section; motion via useSectionMotion or its own small
// GSAP/timer code. ?static=1 shows every hero in its final state (the markup holds it). None is a "portal" opening.
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Pic, Price, Product, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Runs `fn` every `ms` while the element is on screen (stops off screen and in ?static=1 / reduced motion). */
function useOnScreenInterval(ref: React.RefObject<HTMLElement | null>, ms: number, fn: () => void) {
  const cb = useRef(fn);
  cb.current = fn;
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

/* ───────────────────────── HR34 · Text corridor (3D hallway) ───────────────────────── */

const HR34_CSS = `
.hr34-run{animation:hr34-run var(--d,14s) linear infinite;animation-direction:var(--dir,normal)}
@keyframes hr34-run{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.hr34-runy{animation:hr34-runy 9s linear infinite}
@keyframes hr34-runy{from{transform:translateY(0)}to{transform:translateY(-50%)}}
.hr34-door{animation:hr34-door 2.6s ease-in-out infinite alternate}
@keyframes hr34-door{from{opacity:.55;scale:.9}to{opacity:1;scale:1.12}}
html.is-static .hr34-run,html.is-static .hr34-runy,html.is-static .hr34-door{animation:none}
html.is-static {.hr34-run,.hr34-runy,.hr34-door{animation:none}}
`;

const DEPTH = 2600;

function HR34Strip({ word, n = 6, className = "" }: { word: string; n?: number; className?: string }) {
  const items = Array.from({ length: n * 2 }, (_, k) => k);
  return (
    <>
      {items.map((k) => (
        <span key={k} className={`shrink-0 pr-[0.35em] ${className}`}>
          {word}
          <span className="px-[0.25em] opacity-40">·</span>
        </span>
      ))}
    </>
  );
}

/** HR34 · A perspective hallway fills the screen: the headline words run along the left wall, the right wall and the
 *  floor toward a lit doorway at the vanishing point; the glossy floor reflects the light. Scroll dollies the camera
 *  down the corridor (M31, depth), and the words keep running toward the doorway on their own. */
function HR34() {
  const r = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = r.current;
    const w = world.current;
    if (!el || !w || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(w, { z: -240, rotationY: -2 }, { z: 360, rotationY: 2, ease: "none", scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true } });
    }, el);
    return () => ctx.revert();
  }, []);
  const wall = "absolute top-0 h-full overflow-hidden";
  return (
    <Sec innerRef={r} theme="ink" font="condensed" full style={{ ["--sx-accent" as string]: "#ff3d7f" }}>
      <style>{HR34_CSS}</style>
      <h1 className="sr-only">Sound after dark. Nightshift, three nights of music in Bengaluru.</h1>
      <div className="relative h-[clamp(640px,100svh,960px)] overflow-hidden" style={{ perspective: "560px", perspectiveOrigin: "50% 48%" }}>
        <div ref={world} className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
          {/* left wall */}
          <div className={`${wall} left-0`} style={{ width: DEPTH, transformOrigin: "0 50%", transform: "rotateY(90deg)", background: "linear-gradient(90deg,#141826,#07090f 70%)" }}>
            <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,.07)_0_2px,transparent_2px_220px)]" />
            <div className="hr34-run absolute inset-y-0 left-0 flex w-max items-center" style={{ ["--d" as string]: "16s", ["--dir" as string]: "reverse" }}>
              <HR34Strip word="SOUND" className="sx-display text-[clamp(220px,30vh,320px)] font-[800] leading-none text-[#eef2f7]" />
            </div>
          </div>
          {/* right wall */}
          <div className={`${wall} right-0`} style={{ width: DEPTH, transformOrigin: "100% 50%", transform: "rotateY(-90deg)", background: "linear-gradient(270deg,#141826,#07090f 70%)" }}>
            <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,.07)_0_2px,transparent_2px_220px)]" />
            <div className="hr34-run absolute inset-y-0 right-0 flex w-max items-center" style={{ ["--d" as string]: "13s" }}>
              <HR34Strip word="AFTER" className="sx-display text-[clamp(220px,30vh,320px)] font-[800] leading-none text-[var(--sx-accent)]" />
            </div>
          </div>
          {/* floor: glossy, with the third word running into the distance and the doorway light reflected */}
          <div className="absolute bottom-0 left-0 w-full overflow-hidden" style={{ height: DEPTH, transformOrigin: "50% 100%", transform: "rotateX(90deg)", background: "linear-gradient(0deg,#10131c,#07090f 75%)" }}>
            <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,.06)_0_2px,transparent_2px_200px)]" />
            <div className="absolute inset-x-[20%] top-0 h-[70%] bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,rgba(255,61,127,.45),transparent)]" />
            <div className="hr34-runy absolute inset-x-0 top-0 flex flex-col items-center">
              {Array.from({ length: 12 }, (_, k) => (
                <span key={k} className="sx-display block py-[60px] text-[240px] font-[800] leading-none text-transparent [-webkit-text-stroke:3px_rgba(238,242,247,.55)]">
                  DARK
                </span>
              ))}
            </div>
          </div>
          {/* ceiling */}
          <div className="absolute left-0 top-0 w-full" style={{ height: DEPTH, transformOrigin: "50% 0", transform: "rotateX(-90deg)", background: "linear-gradient(180deg,#0d1019,#07090f 70%)" }}>
            <div className="absolute inset-0 bg-[repeating-linear-gradient(180deg,rgba(255,255,255,.05)_0_2px,transparent_2px_260px)]" />
          </div>
        </div>
        {/* fog at the far end + the lit doorway */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_22%_26%_at_50%_48%,#07090f_30%,transparent)]" />
        <div className="hr34-door pointer-events-none absolute left-1/2 top-[48%] aspect-square w-[min(46vw,620px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,61,127,.55),transparent)]" />
        <div className="absolute left-1/2 top-[48%] z-10 w-[min(420px,84%)] -translate-x-1/2 -translate-y-1/2 rounded-[22px] border border-white/15 bg-[rgba(10,12,20,.72)] p-[clamp(22px,2.2vw,32px)] text-center backdrop-blur-md">
          <p className="text-[12px] font-[600] uppercase tracking-[0.2em] text-[var(--sx-accent)]">Nightshift · 13–15 Dec · Bengaluru</p>
          <p className="sx-display mt-3 text-[clamp(30px,2.6vw,40px)] font-[800] uppercase leading-[0.95]">Three nights, four stages</p>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--sx-muted)]">Twenty-two live sets in a converted mill. Doors at 8 pm, last train home at 1.</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Btn>Weekend pass · ₹2,800</Btn>
            <Btn kind="link">Lineup →</Btn>
          </div>
        </div>
        {/* floor reflection of the doorway */}
        <div className="pointer-events-none absolute left-1/2 top-[64%] h-[22%] w-[min(30vw,420px)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,61,127,.32),transparent)] blur-md" />
      </div>
    </Sec>
  );
}

/* ───────────────────────── HR35 · Typewriter headline + portrait inset ───────────────────────── */

const HR35_CSS = `
.hr35-caret{animation:hr35-caret .9s steps(1) infinite}
@keyframes hr35-caret{50%{opacity:0}}
.hr35-kb{animation:hr35-kb 4.4s ease-in-out infinite alternate}
@keyframes hr35-kb{from{scale:1.02;translate:-2% 1%}to{scale:1.14;translate:2% -2%}}
html.is-static .hr35-caret,html.is-static .hr35-kb{animation:none}
html.is-static {.hr35-caret,.hr35-kb{animation:none}}
`;

const HR35_LINES = ["I cook coastal", "Konkan food for"];
const HR35_ENDS = ["twelve guests.", "long Sundays.", "small weddings."];
const HR35_DISHES = [
  { i: 3, n: "Kokum prawns" },
  { i: 1, n: "Sol kadhi" },
  { i: 0, n: "Bangda fry" },
  { i: 2, n: "Ukadiche modak" },
];

/** HR35 · The headline types itself line by line across the left 8 columns (the last line keeps re-typing its ending);
 *  a small square photo sits inset at the right and swaps dish on a loop. The inset opens from a zoomed frame (M13). */
function HR35() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M13");
  const base = HR35_LINES.join("").length;
  const [st, setSt] = useState({ n: base + HR35_ENDS[0].length, e: 0, hold: 0, dir: 1 });
  const [pic, setPic] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    const io = new IntersectionObserver(([x]) => {
      if (x.isIntersecting && !started.current) {
        started.current = true;
        setSt({ n: 0, e: 0, hold: 0, dir: 1 });
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useOnScreenInterval(r, 58, () =>
    setSt((s) => {
      const full = base + HR35_ENDS[s.e].length;
      if (s.dir === 1) return s.n < full ? { ...s, n: s.n + 1 } : { ...s, dir: 0, hold: 0 };
      if (s.dir === 0) return s.hold < 26 ? { ...s, hold: s.hold + 1 } : { ...s, dir: -1 };
      return s.n > base ? { ...s, n: s.n - 1 } : { n: base, e: (s.e + 1) % HR35_ENDS.length, hold: 0, dir: 1 };
    }),
  );
  useOnScreenInterval(r, 1900, () => setPic((p) => (p + 1) % HR35_DISHES.length));
  const lines = [...HR35_LINES, HR35_ENDS[st.e]];
  const longestEnd = HR35_ENDS.reduce((a, b) => (b.length > a.length ? b : a));
  let left = st.n;
  const shown = lines.map((l) => {
    const take = Math.max(0, Math.min(l.length, left));
    left -= take;
    return l.slice(0, take);
  });
  const active = shown.findIndex((s, k) => s.length < lines[k].length);
  const caretAt = active === -1 ? 2 : active;
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <style>{HR35_CSS}</style>
      <div className="grid grid-cols-1 gap-[clamp(32px,4vw,64px)] md:grid-cols-12">
        <div className="md:col-span-8">
          <H as="h1" className="text-[clamp(48px,6.2vw,100px)] font-[500] leading-[1.02]">
            {lines.map((l, k) => (
              <span key={k} className="relative block">
                <span className="invisible">{k === 2 ? longestEnd : l}</span>
                <span className="absolute inset-0 whitespace-nowrap">
                  <span className={k === 2 ? "italic text-[var(--sx-accent)]" : ""}>{shown[k]}</span>
                  {k === caretAt && <span className="hr35-caret ml-[0.04em] inline-block h-[0.82em] w-[0.06em] translate-y-[0.1em] bg-[var(--sx-accent)]" />}
                </span>
              </span>
            ))}
          </H>
          <P className="mt-8 max-w-[44ch]">Private dinners by Ananya Rao: a long table, eight courses from the Malvan coast, cooked in your kitchen and cleared before dessert.</P>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Btn>Book a table</Btn>
            <Btn kind="ghost">See sample menus</Btn>
          </div>
          <p className="mt-7 text-[14px] text-[var(--sx-muted)]">
            Next open date 14 Dec · from <Price now="₹4,500" className="text-[var(--sx-text)]" /> a guest
          </p>
        </div>
        <div className="md:col-span-4 md:pt-[clamp(8px,1vw,16px)]">
          <div className="ml-auto w-full max-w-[320px]">
            <div className="relative aspect-square overflow-hidden rounded-[var(--sx-radius)]">
              <div className="hr35-kb absolute inset-0">
                {HR35_DISHES.map((d, k) => (
                  <div key={d.n} className="absolute inset-0 transition-opacity duration-700" style={{ opacity: k === pic ? 1 : 0 }}>
                    <Pic i={d.i} ratio="auto" round={false} label="" className="absolute inset-0 h-full w-full" />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-[var(--sx-line)] pt-3 text-[14px]">
              <span className="text-[var(--sx-muted)]">Tonight&apos;s course</span>
              <span key={pic} className="font-[600]">{HR35_DISHES[pic].n}</span>
            </div>
            <div className="mt-3 flex gap-1.5">
              {HR35_DISHES.map((d, k) => (
                <span key={d.n} className={`h-[3px] flex-1 rounded-full transition-colors duration-500 ${k === pic ? "bg-[var(--sx-accent)]" : "bg-[var(--sx-line)]"}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-[clamp(48px,6vw,88px)] grid grid-cols-1 border-t border-[var(--sx-line)] md:grid-cols-3">
        {[
          ["8 courses", "seasonal, from the Malvan coast"],
          ["6–14 guests", "your home or a farm in Alibaug"],
          ["4 hours", "aperitif to the last coffee"],
        ].map(([a, b], k) => (
          <div key={a} className={`py-6 ${k ? "md:border-l md:border-[var(--sx-line)] md:pl-8" : ""}`}>
            <p className="sx-display text-[clamp(24px,2vw,32px)]">{a}</p>
            <p className="mt-1 text-[14px] text-[var(--sx-muted)]">{b}</p>
          </div>
        ))}
      </div>
    </Sec>
  );
}

/* ───────────────────────── HR36 · Floating info cards over a mood photo ───────────────────────── */

const HR36_CSS = `
.hr36-pan{animation:hr36-pan 5.3s ease-in-out infinite alternate}
@keyframes hr36-pan{from{translate:-2.5% 1%}to{translate:2.5% -1.5%}}
html.is-static .hr36-pan{animation:none}
html.is-static {.hr36-pan{animation:none}}
`;

const HR36_CARDS = [
  { k: "Lake Suite", t: "2 guests · 14–16 Mar", v: "₹18,400", s: "a night, breakfast included" },
  { k: "Sunset boat", t: "Daily at 5:40 pm", v: "Free", s: "for suite guests, 90 minutes" },
  { k: "Spa ritual", t: "Kansa massage · 75 min", v: "₹6,200", s: "add to any stay" },
];

/** HR36 · Centred two-line headline (second line muted); below it a soft-edged 3:2 mood photo with two glass info cards
 *  stacked dead-centre (back one smaller and higher). The stack keeps shuffling: a new card slides to the front and the
 *  covered one shrinks back and dims (M40, hands-free). Under the photo, a ratings row. */
function HR36() {
  const r = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(0);
  useOnScreenInterval(r, 2300, () => setTop((t) => (t + 1) % HR36_CARDS.length));
  const n = HR36_CARDS.length;
  return (
    <Sec innerRef={r} theme="ink" font="editorial" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#d9b07a" }}>
      <style>{HR36_CSS}</style>
      <div className="mx-auto max-w-[900px] text-center">
        <H as="h1" className="text-[clamp(48px,6vw,100px)] font-[500]">
          A house on the lake,
          <span className="block text-[var(--sx-muted)]">for slow weekends.</span>
        </H>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Btn>Check dates</Btn>
          <Btn kind="ghost">The suites</Btn>
        </div>
      </div>
      <div className="relative mx-auto mt-[clamp(32px,4vw,56px)] aspect-[3/2] w-full max-w-4xl">
        <div className="absolute inset-0 overflow-hidden [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_58%,transparent)]">
          <div className="hr36-pan absolute inset-[-4%]">
            <Pic i={3} ratio="auto" round={false} label="" className="fx-drift absolute inset-0 h-full w-full" />
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_50%_50%,rgba(7,9,15,.35),transparent)]" />
        </div>
        <div className="absolute inset-0 grid place-items-center">
          {HR36_CARDS.map((c, k) => {
            const slot = (k - top + n) % n; // 0 front, 1 back, 2 hidden behind
            const style = [
              { transform: "translateY(0%) scale(.85)", opacity: 1, zIndex: 3 },
              { transform: "translateY(-30%) scale(.75)", opacity: 0.62, zIndex: 2 },
              { transform: "translateY(36%) scale(.9)", opacity: 0, zIndex: 4 },
            ][slot];
            return (
              <div
                key={c.k}
                className="absolute w-[min(420px,64%)] rounded-[22px] border border-white/20 bg-[rgba(16,20,29,.55)] p-[clamp(18px,2vw,28px)] text-white shadow-[0_30px_80px_-30px_rgba(0,0,0,.7)] backdrop-blur-xl transition-[transform,opacity] duration-[900ms] ease-[cubic-bezier(.2,.8,.2,1)]"
                style={style}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="sx-display text-[clamp(24px,2.2vw,34px)] leading-none">{c.k}</p>
                    <p className="mt-2 text-[14px] text-white/65">{c.t}</p>
                  </div>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--sx-accent)] text-[18px] text-[#07090f]">→</span>
                </div>
                <div className="mt-5 flex items-baseline justify-between gap-3 border-t border-white/15 pt-4">
                  <p className="text-[clamp(22px,1.9vw,28px)] font-[650] tabular-nums">{c.v}</p>
                  <p className="text-right text-[13px] text-white/60">{c.s}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-[clamp(20px,2.4vw,32px)] text-center text-[14px] text-[var(--sx-muted)]">Trusted by 9,000 guests since 2019</p>
      <div className="mt-5 flex flex-wrap justify-center gap-[clamp(12px,1.6vw,20px)]">
        {[
          ["4.9", "Wanderlog Weekly"],
          ["9.6", "The Stay Report"],
          ["4.8", "Coastline Guide"],
        ].map(([s, src]) => (
          <div key={src} className="flex items-center gap-3 rounded-full border border-[var(--sx-line)] px-5 py-3">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-[var(--sx-accent)]" aria-hidden>
              <path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.2 1.3-6.6L2.5 9.3l6.6-.8z" fill="currentColor" />
            </svg>
            <b className="text-[17px] font-[700] tabular-nums">{s}</b>
            <span className="text-[14px] text-[var(--sx-muted)]">{src}</span>
          </div>
        ))}
      </div>
    </Sec>
  );
}

/* ───────────────────────── HR37 · Inset rounded canvas with overhanging media ───────────────────────── */

const HR37_CSS = `
.hr37-kb{animation:hr37-kb 6s ease-in-out infinite alternate}
@keyframes hr37-kb{from{scale:1.04;translate:-3% 0}to{scale:1.16;translate:3% -2%}}
.hr37-sheen{animation:hr37-sheen 2.8s linear infinite}
@keyframes hr37-sheen{from{transform:translateX(-120%) skewX(-14deg)}to{transform:translateX(320%) skewX(-14deg)}}
html.is-static .hr37-kb,html.is-static .hr37-sheen{animation:none}
html.is-static .hr37-sheen{opacity:0}
html.is-static {.hr37-kb,.hr37-sheen{animation:none}.hr37-sheen{opacity:0}}
`;

const HR37_ACTIVES = [
  { n: "Bakuchiol", d: "a gentle retinol alternative", c: "#c9a46a" },
  { n: "Rice water", d: "softens and evens tone", c: "#e9e1cf" },
  { n: "Kumkumadi oil", d: "saffron for a calm glow", c: "#e0913f" },
];

/** HR37 · The hero lives on a muted rounded canvas inset 4px from the viewport and ending 8rem above the section end:
 *  announcement badge, centred title, text, two buttons. A wide media frame starts inside the canvas and overhangs its
 *  lower edge onto the page. The frame unfolds from its corner (M18); the photo drifts and the active ingredient cycles. */
function HR37() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M18");
  const [a, setA] = useState(0);
  useOnScreenInterval(r, 1800, () => setA((v) => (v + 1) % HR37_ACTIVES.length));
  const act = HR37_ACTIVES[a];
  return (
    <Sec innerRef={r} theme="stone" font="wide" full className="pb-[clamp(48px,5vw,80px)] pt-1" style={{ ["--sx-accent" as string]: "#8a5a3c" }}>
      <style>{HR37_CSS}</style>
      <div className="relative">
        <div className="absolute inset-x-1 bottom-32 top-0 rounded-[clamp(20px,2.4vw,36px)] bg-[color-mix(in_srgb,var(--sx-text)_7%,var(--sx-bg))]">
          <div className="absolute inset-0 rounded-[inherit] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,color-mix(in_srgb,var(--sx-accent)_16%,transparent),transparent)]" />
        </div>
        <div className="relative px-[clamp(20px,5vw,96px)] pt-[clamp(72px,8vw,128px)]">
          <div className="mx-auto max-w-[900px] text-center">
            <p data-m-text className="inline-flex items-center gap-3 rounded-full border border-[var(--sx-line)] bg-[var(--sx-surface)] py-1.5 pl-1.5 pr-4 text-[13px]">
              <span className="rounded-full bg-[var(--sx-accent)] px-2.5 py-1 text-[12px] font-[650] text-[var(--sx-accent-text)]">New</span>
              The winter repair kit is here →
            </p>
            <H as="h1" className="mt-7 text-[clamp(40px,5vw,84px)] font-[700]">Skin care, kept quiet.</H>
            <P className="mx-auto mt-6 max-w-[48ch]">Four steps, nine actives, no fragrance. Made in small batches in Pune and refilled in glass for life.</P>
            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <Btn>Shop the kit · ₹3,600</Btn>
              <Btn kind="ghost">Take the skin quiz</Btn>
            </div>
          </div>
          <div data-m-card className="relative mx-auto mt-[clamp(48px,6vw,88px)] grid max-w-[1180px] grid-cols-1 overflow-hidden rounded-[clamp(18px,2vw,28px)] border border-[var(--sx-line)] bg-[var(--sx-surface)] shadow-[0_40px_90px_-40px_rgba(17,20,24,.45)] md:grid-cols-12">
            <div className="relative min-h-[300px] overflow-hidden md:col-span-7 md:min-h-[440px]">
              <div className="hr37-kb absolute inset-0">
                <Pic i={3} ratio="auto" round={false} label="" className="absolute inset-0 h-full w-full" />
              </div>
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="hr37-sheen absolute inset-y-0 left-0 w-[30%] bg-[linear-gradient(90deg,transparent,rgba(255,240,220,.22),transparent)]" />
              </div>
              <p className="absolute bottom-5 left-5 rounded-full bg-black/35 px-4 py-2 text-[13px] text-white backdrop-blur-md">The ritual, 6 minutes a night</p>
            </div>
            <div className="relative flex flex-col justify-between gap-6 p-[clamp(22px,2.6vw,40px)] md:col-span-5">
              <div className="relative mx-auto aspect-square w-[min(100%,260px)] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_30%,transparent),transparent)]">
                <Product angle={2} accent={act.c} className="absolute inset-0 m-auto h-[82%] w-[82%] transition-all duration-700" />
              </div>
              <div>
                <p className="text-[12px] uppercase tracking-[0.16em] text-[var(--sx-muted)]">Active in focus</p>
                <p key={a} className="sx-display mt-2 text-[clamp(22px,2vw,30px)] font-[700] leading-tight">{act.n}</p>
                <p className="mt-1 text-[15px] text-[var(--sx-muted)]">{act.d}</p>
                <div className="mt-4 flex gap-1.5">
                  {HR37_ACTIVES.map((x, k) => (
                    <span key={x.n} className={`h-[4px] flex-1 rounded-full transition-colors duration-500 ${k === a ? "bg-[var(--sx-accent)]" : "bg-[var(--sx-line)]"}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── HR38 · Skewed product plate bleeding off the right ───────────────────────── */

const HR38_CSS = `
.hr38-eq{animation:hr38-eq var(--d,.9s) ease-in-out infinite alternate;animation-delay:var(--dl,0s);transform-origin:50% 100%}
@keyframes hr38-eq{from{transform:scaleY(.18)}to{transform:scaleY(1)}}
.hr38-prog{animation:hr38-prog 9s linear infinite}
@keyframes hr38-prog{from{width:8%}to{width:96%}}
.hr38-float{animation:hr38-float 4.2s ease-in-out infinite alternate}
@keyframes hr38-float{from{translate:0 -10px}to{translate:0 12px}}
html.is-static .hr38-eq,html.is-static .hr38-prog,html.is-static .hr38-float{animation:none}
html.is-static {.hr38-eq,.hr38-prog,.hr38-float{animation:none}}
`;

const HR38_TRACKS = [
  ["Monsoon Sessions", "Rhea Kulkarni", "4:12"],
  ["Night Ferry", "The Lowtides", "3:48"],
  ["Paper Kites", "Arun Varma Trio", "5:02"],
  ["Slow Lane", "Mira & the Hum", "3:27"],
];

/** HR38 · Copy on the left half (headline, text, two buttons, a "Trusted by" logo row); from the vertical centre line
 *  past the right edge, a large app plate skewed in perspective with a ghost plate behind it. Text rises from blur and
 *  the plate floats up (M6); inside, the EQ bars and progress keep playing. */
function HR38() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M6");
  const bars = Array.from({ length: 28 }, (_, k) => k);
  const plate = "perspective(1600px) rotateY(-16deg) rotateX(8deg) skewY(-6deg)";
  return (
    <Sec innerRef={r} theme="ink" font="grotesk" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#7cf0c5", ["--sx-accent-text" as string]: "#05070c" }}>
      <style>{HR38_CSS}</style>
      <div className="relative md:min-h-[clamp(560px,72svh,760px)]">
        <div className="relative z-10 flex flex-col justify-center md:min-h-[clamp(560px,72svh,760px)] md:w-[46%]">
          <H as="h1" className="text-[clamp(46px,5.4vw,92px)]">Hear every room you play in.</H>
          <P className="mt-6 max-w-[40ch]">The Hush app tunes your Studio One headphones to the space around you, in real time. ₹24,900 with the app free for life.</P>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Btn>Buy Studio One</Btn>
            <Btn kind="ghost">Get the app</Btn>
          </div>
          <div data-m-text className="mt-12 border-t border-[var(--sx-line)] pt-6">
            <p className="text-[13px] text-[var(--sx-muted)]">Trusted by studios at</p>
            <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3 text-[var(--sx-muted)]">
              {["Northfold", "Halcyon", "Meridia", "Arcwell"].map((l, k) => (
                <span key={l} className={`text-[16px] ${k % 2 ? "font-[700] italic" : "font-[600] uppercase tracking-[0.16em]"}`}>
                  {l}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="relative mt-12 md:absolute md:inset-y-0 md:left-1/2 md:mt-0 md:w-[min(980px,72vw)]">
          <div className="relative h-full md:flex md:items-center">
            <div data-m-card className="hr38-float relative w-full">
              {/* ghost plate */}
              <div className="absolute inset-0 rounded-[22px] border border-[color-mix(in_srgb,var(--sx-accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--sx-accent)_6%,transparent)]" style={{ transform: `${plate} translate(56px,-48px)` }} />
              <div className="relative overflow-hidden rounded-[22px] border border-[var(--sx-line)] bg-[var(--sx-surface)] shadow-[0_60px_120px_-40px_rgba(0,0,0,.8)]" style={{ transform: plate }}>
                <div className="flex items-center gap-2 border-b border-[var(--sx-line)] px-5 py-3.5">
                  <span className="h-3 w-3 rounded-full bg-white/15" />
                  <span className="h-3 w-3 rounded-full bg-white/15" />
                  <span className="h-3 w-3 rounded-full bg-white/15" />
                  <span className="ml-4 text-[13px] text-[var(--sx-muted)]">Hush · Studio One connected</span>
                </div>
                <div className="grid grid-cols-[180px_minmax(0,1fr)]">
                  <div className="border-r border-[var(--sx-line)] p-5 text-[14px]">
                    {["Listen", "Room tune", "EQ presets", "Library", "Settings"].map((x, k) => (
                      <p key={x} className={`rounded-lg px-3 py-2 ${k === 1 ? "bg-[color-mix(in_srgb,var(--sx-accent)_16%,transparent)] text-[var(--sx-accent)]" : "text-[var(--sx-muted)]"}`}>{x}</p>
                    ))}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-5">
                      <Pic i={0} ratio="1/1" label="" className="w-[110px] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[12px] uppercase tracking-[0.16em] text-[var(--sx-muted)]">Now playing</p>
                        <p className="mt-1 text-[22px] font-[700]">Monsoon Sessions</p>
                        <p className="text-[14px] text-[var(--sx-muted)]">Rhea Kulkarni · Live at the Mill</p>
                      </div>
                    </div>
                    <div className="mt-6 flex h-[110px] items-end gap-[5px]">
                      {bars.map((k) => (
                        <span key={k} className="hr38-eq h-full flex-1 rounded-sm bg-[var(--sx-accent)]" style={{ ["--d" as string]: `${0.42 + ((k * 7) % 9) * 0.07}s`, ["--dl" as string]: `${-((k * 3) % 11) * 0.09}s`, opacity: 0.55 + ((k * 5) % 9) * 0.05 }} />
                      ))}
                    </div>
                    <div className="mt-4 h-[5px] rounded-full bg-white/10">
                      <div className="hr38-prog h-full w-[46%] rounded-full bg-[var(--sx-text)]" />
                    </div>
                    <div className="mt-5 divide-y divide-[var(--sx-line)] text-[14px]">
                      {HR38_TRACKS.slice(1).map(([t, a, d]) => (
                        <div key={t} className="flex items-center justify-between gap-4 py-2.5">
                          <span>
                            {t} <span className="text-[var(--sx-muted)]">· {a}</span>
                          </span>
                          <span className="tabular-nums text-[var(--sx-muted)]">{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "HR34", name: "Text corridor (3D hallway)", motion: "M31", C: HR34 },
  { code: "HR35", name: "Typewriter headline + portrait inset", motion: "M13", C: HR35 },
  { code: "HR36", name: "Floating info cards over a mood photo", motion: "M40", C: HR36 },
  { code: "HR37", name: "Inset rounded canvas with overhanging media", motion: "M18", C: HR37 },
  { code: "HR38", name: "Skewed product plate bleeding off the right", motion: "M6", C: HR38 },
];
