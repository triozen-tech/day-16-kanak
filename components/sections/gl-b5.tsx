"use client";

// GL · Gallery layouts, batch 5 (docs/SECTION-MENU.md): GL23 a focus grid (one card sharp, the rest blurred, focus
// auto-cycles), GL24 three slides on a strip tilted about -10°, stepping on its own, GL25 a coverflow carousel, GL26 a
// ring of items around a title that opens into a 3D drum turned one item at a time by the scroll. All play hands-free
// while on screen and show a plain, readable state in ?static=1.
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { scene } from "../fx/shared";
import { Btn, H, P, Price, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

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

const CSS = `.gl5kb img{animation:gl5kbs 4.4s linear infinite alternate,gl5kbt 3.1s ease-in-out infinite alternate}
.gl5kb.alt img{animation-duration:5.2s,3.7s;animation-direction:alternate-reverse}
@keyframes gl5kbs{from{scale:1.05}to{scale:1.2}}@keyframes gl5kbt{from{translate:-3% 2%}to{translate:3% -2%}}
.gl5mq{animation:gl5mq 36s linear infinite}@keyframes gl5mq{from{translate:0 0}to{translate:-50% 0}}
.gl5halo{animation:gl5spin 14s linear infinite}@keyframes gl5spin{from{rotate:0deg}to{rotate:360deg}}
html.is-static .gl5kb img,html.is-static .gl5mq,html.is-static .gl5halo{animation:none}
html.is-static {.gl5kb img,.gl5mq,.gl5halo{animation:none}}`;

/** A placeholder photo whose image drifts slowly (two loops of different periods, so it never looks frozen). */
function Shot({ i, w = 1000, h = 1250, alt = false, className = "" }: { i: number; w?: number; h?: number; alt?: boolean; className?: string }) {
  return (
    <div className={`gl5kb ${alt ? "alt" : ""} absolute inset-0 overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={scene(i, w, h, "")} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
    </div>
  );
}

/* ───────────────────────────── GL23 · Focus grid ───────────────────────────── */

const SCENTS = [
  { n: "Oud Noir", d: "Smoked oud, saffron", p: "₹4,200", i: 3 },
  { n: "Monsoon Vetiver", d: "Wet earth, green khus", p: "₹3,600", i: 1 },
  { n: "Rose Attar", d: "Kannauj rose, honey", p: "₹3,900", i: 2 },
  { n: "Neroli Coast", d: "Orange blossom, salt", p: "₹3,400", i: 0 },
  { n: "Amber Hour", d: "Labdanum, warm resin", p: "₹4,050", i: 3 },
  { n: "White Tea", d: "Jasmine, cold steep", p: "₹3,200", i: 1 },
];

/** GL23 · 3×2 tall cards; the focused card stays sharp and shows its title while the others blur and shrink. Focus auto-cycles (hover takes over). */
function GL23() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M6");
  const live = useLive();
  const [f, setF] = useState(0);
  useEvery(r, 1900, () => setF((v) => (v + 1) % SCENTS.length));
  return (
    <Sec innerRef={r} theme="ink" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <style>{CSS}</style>
      <div className="mx-auto max-w-[1120px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <H className="max-w-[12ch] text-[clamp(44px,5.2vw,88px)]">Six scents. Meet one at a time.</H>
          <div className="max-w-[36ch] pb-2">
            <P>Each eau de parfum is blended in small batches and rested ninety days in glass before it is bottled.</P>
            <div className="mt-6">
              <Btn kind="ghost">Discovery set · ₹1,450</Btn>
            </div>
          </div>
        </div>
        <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 gap-[clamp(12px,1.6vw,22px)] md:grid-cols-3">
          {SCENTS.map((s, k) => {
            const on = k === f;
            const dim = live && !on;
            return (
              <div key={s.n} data-m-card onMouseEnter={() => setF(k)}>
                <div
                  data-cursor="View"
                  className="relative aspect-[4/5] overflow-hidden rounded-[var(--sx-radius,18px)] transition-[filter,scale,opacity] duration-700 ease-out"
                  style={{ filter: dim ? "blur(6px) saturate(.7)" : "none", scale: dim ? "0.96" : "1", opacity: dim ? 0.6 : 1 }}
                >
                  <Shot i={s.i} alt={k % 2 === 1} />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_50%,rgba(7,9,15,.82))] transition-opacity duration-700" style={{ opacity: on || !live ? 1 : 0 }} />
                  <div className="absolute inset-x-0 bottom-0 p-[clamp(16px,1.8vw,26px)] text-white transition-[opacity,translate] duration-700" style={{ opacity: on || !live ? 1 : 0, translate: on || !live ? "0 0" : "0 14px" }}>
                    <p className="sx-display text-[clamp(24px,2.2vw,34px)] font-[600] leading-none">{s.n}</p>
                    <p className="mt-2 flex items-baseline justify-between gap-4 text-[14px] text-white/75">
                      <span>{s.d}</span>
                      <Price now={s.p} className="text-white" />
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────────── GL24 · Inclined three-slide strip ───────────────────────────── */

const POSTERS = [
  { t: "Low Tide", d: "Goa · 14 June", i: 2 },
  { t: "Saltwater Radio", d: "Kochi · 22 June", i: 0 },
  { t: "Neon Monsoon", d: "Mumbai · 5 July", i: 3 },
  { t: "The Quiet Club", d: "Pune · 19 July", i: 1 },
  { t: "Paper Moons", d: "Delhi · 2 Aug", i: 2 },
];
const N24 = POSTERS.length;

/** GL24 · Three slides on a strip tilted about -10°; the centre one is large with its title over it. It steps on its own; arrows move it. */
function GL24() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M31");
  const live = useLive();
  // the strip holds three copies; `pos` stays in the middle copy (it jumps back by one copy, unanimated, after a step)
  const [pos, setPos] = useState(N24);
  const [snap, setSnap] = useState(false);
  useEvery(r, 2400, () => setPos((p) => Math.min(3 * N24 - 1, p + 1)));
  useEffect(() => {
    if (pos >= N24 && pos < 2 * N24) return;
    const t = setTimeout(() => {
      setSnap(true);
      setPos((p) => (p >= 2 * N24 ? p - N24 : p < N24 ? p + N24 : p));
    }, 950);
    return () => clearTimeout(t);
  }, [pos]);
  useEffect(() => {
    if (!snap) return;
    let b = 0;
    const a = requestAnimationFrame(() => (b = requestAnimationFrame(() => setSnap(false))));
    return () => {
      cancelAnimationFrame(a);
      cancelAnimationFrame(b);
    };
  }, [snap]);
  const go = (d: number) => setPos((p) => Math.max(0, Math.min(3 * N24 - 1, p + d)));
  const strip = [...POSTERS, ...POSTERS, ...POSTERS];
  const cur = POSTERS[pos % N24];
  return (
    <Sec innerRef={r} theme="paper" font="condensed" full className="py-[clamp(72px,9vw,140px)]">
      <style>{CSS}</style>
      <div className="grid grid-cols-1 items-end gap-6 px-[clamp(20px,5vw,96px)] md:grid-cols-12">
        <H className="text-[clamp(52px,6.4vw,110px)] uppercase md:col-span-7">Posters from the summer tour.</H>
        <div className="md:col-span-5 md:pb-3">
          <P>Five nights, five cities, five screen-printed posters. A2 on 300 gsm cotton paper, numbered, ₹1,200 each.</P>
        </div>
      </div>

      <div className="relative mt-[clamp(24px,3vw,48px)]" style={{ ["--w" as string]: "clamp(240px, 30vw, 460px)", height: "calc(var(--w) * 1.72)" }}>
        {/* slow marquee behind the strip (keeps the frame alive between steps) */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 min-w-0 -translate-y-1/2 overflow-hidden">
          <div className={`flex w-max whitespace-nowrap ${live ? "gl5mq" : ""}`}>
            {[0, 1].map((c) => (
              <span key={c} className="sx-display pr-[0.4em] text-[clamp(120px,15vw,240px)] font-[800] uppercase leading-none text-[color-mix(in_srgb,var(--sx-text)_9%,transparent)]">
                Riverside Nights · Summer tour ·{" "}
              </span>
            ))}
          </div>
        </div>
        {/* the tilted strip */}
        <div className="absolute inset-x-0 top-1/2 h-0" style={{ rotate: "-10deg" }}>
          <div
            className="absolute left-1/2 top-0 flex"
            style={{ transform: `translate(calc(${-(pos + 0.5)} * var(--w)), -50%)`, transition: snap || !live ? "none" : "transform .95s cubic-bezier(.65,0,.25,1)" }}
          >
            {strip.map((s, k) => {
              const on = k === pos;
              return (
                <div key={k} className="shrink-0 px-[clamp(8px,1vw,16px)]" style={{ width: "var(--w)" }}>
                  <div data-m-card>
                    <div
                      onClick={() => go(k - pos)}
                      className="relative aspect-[3/4] cursor-pointer overflow-hidden rounded-[6px] shadow-[0_40px_70px_-40px_rgba(28,24,19,.55)]"
                      style={{ scale: on ? "1" : "0.72", opacity: on ? 1 : 0.62, transition: snap || !live ? "none" : "scale .95s cubic-bezier(.65,0,.25,1), opacity .95s" }}
                    >
                      <Shot i={s.i} w={900} h={1200} alt={k % 2 === 1} />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,9,15,.05),rgba(7,9,15,.7))]" />
                      <div className="absolute inset-x-0 bottom-0 p-[clamp(16px,2vw,28px)] text-white">
                        <p className="sx-display text-[clamp(30px,3.4vw,56px)] font-[800] uppercase leading-[0.9]">{s.t}</p>
                        <p className="mt-2 text-[14px] text-white/75">{s.d}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-[clamp(16px,2vw,32px)] flex flex-wrap items-center justify-between gap-6 px-[clamp(20px,5vw,96px)]">
        <p className="text-[15px] text-[var(--sx-muted)]">
          Now showing <b className="font-[650] text-[var(--sx-text)]">{cur.t}</b> · print <Price now="₹1,200" className="text-[var(--sx-text)]" />
        </p>
        <div className="flex items-center gap-3">
          <button onClick={() => go(-1)} aria-label="Previous poster" className="grid h-12 w-12 place-items-center rounded-full border border-[var(--sx-line)] text-[18px]">←</button>
          <button onClick={() => go(1)} aria-label="Next poster" className="grid h-12 w-12 place-items-center rounded-full border border-[var(--sx-line)] text-[18px]">→</button>
          <Btn className="ml-3">Buy the set · ₹5,400</Btn>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────────── GL25 · Coverflow carousel ───────────────────────────── */

const RECORDS = [
  { t: "Blue Hour Ragas", a: "The Varkala Trio", p: "₹2,400", i: 0 },
  { t: "City of Rain", a: "Mira Fonseca", p: "₹2,200", i: 3 },
  { t: "Night Ferry", a: "Kabir Shah Quartet", p: "₹2,600", i: 2 },
  { t: "Tin Roof Songs", a: "Ira Menon", p: "₹1,900", i: 1 },
  { t: "Slow Coast", a: "Harbour Lights", p: "₹2,400", i: 3 },
  { t: "Paper Kites", a: "Dev Raman", p: "₹2,100", i: 0 },
  { t: "Last Train South", a: "Ochre Room", p: "₹2,800", i: 2 },
];
const N25 = RECORDS.length;
const FLOW = [
  { x: 0, z: 0, ry: 0, o: 1 },
  { x: 64, z: -170, ry: 48, o: 0.85 },
  { x: 112, z: -330, ry: 58, o: 0.55 },
  { x: 150, z: -480, ry: 62, o: 0 },
];

/** GL25 · Coverflow: the centre cover faces the viewer, side covers turn away in perspective and shrink. Auto-steps; arrows below. */
function GL25() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  const live = useLive();
  const [a, setA] = useState(0);
  useEvery(r, 2200, () => setA((v) => (v + 1) % N25));
  const rec = RECORDS[a];
  return (
    <Sec innerRef={r} theme="ink" font="wide" className="py-[clamp(72px,9vw,140px)]">
      <style>{CSS}</style>
      <div className="mx-auto max-w-[860px] text-center">
        <H className="text-[clamp(40px,4.8vw,80px)]">Seven records, pressed again.</H>
        <P className="mx-auto mt-5 max-w-[46ch]">Our reissue series: 180 g vinyl, cut from the original tapes, sleeves printed on recycled board.</P>
      </div>

      {/* side padding: rotated covers take more room than their box */}
      <div className="relative mx-auto mt-[clamp(40px,5vw,72px)] max-w-[1240px] px-[6%]" style={{ ["--w" as string]: "clamp(220px, 26vw, 400px)", perspective: "1600px" }}>
        <div className="relative" style={{ height: "calc(var(--w) * 1.08)", transformStyle: "preserve-3d" }}>
          {RECORDS.map((x, k) => {
            let o = (k - a + N25) % N25;
            if (o > N25 / 2) o -= N25;
            const s = FLOW[Math.min(3, Math.abs(o))];
            const sign = Math.sign(o);
            return (
              <div
                key={x.t}
                className="absolute left-1/2 top-0"
                style={{
                  width: "var(--w)",
                  marginLeft: "calc(var(--w) / -2)",
                  zIndex: 10 - Math.abs(o),
                  opacity: s.o,
                  transform: `translateX(${sign * s.x}%) translateZ(${s.z}px) rotateY(${-sign * s.ry}deg)`,
                  transition: live ? "transform .9s cubic-bezier(.65,0,.25,1), opacity .9s" : "none",
                }}
              >
                <div data-m-card>
                  <button onClick={() => setA(k)} aria-label={x.t} className="relative block aspect-square w-full overflow-hidden rounded-[10px] shadow-[0_40px_80px_-30px_rgba(0,0,0,.8)]">
                    <Shot i={x.i} w={900} h={900} alt={k % 2 === 1} />
                    <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,.14),transparent_45%)]" />
                    <span className="absolute left-[8%] top-[8%] text-left text-[13px] font-[700] uppercase tracking-[0.16em] text-white/85">{x.a}</span>
                  </button>
                  {/* soft reflection */}
                  <div className="mt-2 h-[18%] rounded-[10px] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--sx-text)_10%,transparent),transparent)]" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mx-auto mt-[clamp(20px,3vw,40px)] flex max-w-[860px] flex-col items-center text-center">
        <p key={rec.t} className="sx-display text-[clamp(24px,2.4vw,36px)] font-[700] leading-tight">{rec.t}</p>
        <p className="mt-1 text-[15px] text-[var(--sx-muted)]">
          {rec.a} · LP · <Price now={rec.p} className="text-[var(--sx-text)]" />
        </p>
        <div className="mt-7 flex items-center gap-3">
          <button onClick={() => setA((v) => (v - 1 + N25) % N25)} aria-label="Previous record" className="grid h-12 w-12 place-items-center rounded-full border border-[var(--sx-line)] text-[18px]">←</button>
          <Btn>Add to crate</Btn>
          <button onClick={() => setA((v) => (v + 1) % N25)} aria-label="Next record" className="grid h-12 w-12 place-items-center rounded-full border border-[var(--sx-line)] text-[18px]">→</button>
        </div>
        <div className="mt-6 flex gap-2">
          {RECORDS.map((x, k) => (
            <span key={x.t} className={`h-[6px] rounded-full transition-all duration-500 ${k === a ? "w-8 bg-[var(--sx-accent)]" : "w-[6px] bg-[var(--sx-line)]"}`} />
          ))}
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────────── GL26 · Ring around a title opening into a drum ───────────────────────────── */

const PIECES = [
  { n: "Rain bowl", p: "₹1,450", i: 0 },
  { n: "Ash plate", p: "₹1,200", i: 1 },
  { n: "Moss cup", p: "₹650", i: 2 },
  { n: "Kiln jug", p: "₹2,300", i: 3 },
  { n: "Salt dish", p: "₹780", i: 1 },
  { n: "Dune platter", p: "₹2,900", i: 0 },
  { n: "Rust mug", p: "₹720", i: 3 },
  { n: "River vase", p: "₹3,400", i: 2 },
  { n: "Pebble bowl", p: "₹980", i: 1 },
  { n: "Tide tray", p: "₹1,850", i: 0 },
];
const N26 = PIECES.length;
const STEP = 360 / N26;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (v: number) => v * v * (3 - 2 * v);

/** GL26 · Ten pieces sit in a ring around the title; scrolling tilts the ring into a 3D drum that turns one piece at a time. */
function GL26() {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLDivElement>(null);
  const cap = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLDivElement | null)[]>([]);
  const live = useLive();
  const [front, setFront] = useState(0);

  useEffect(() => {
    if (!live || !track.current || !stage.current) return;
    let prog = 0;
    let spin = 0;
    let seen = false;
    let shown = -1;
    const st = ScrollTrigger.create({ trigger: track.current, start: "top top", end: "bottom bottom", onUpdate: (s) => (prog = s.progress) });
    ScrollTrigger.refresh();
    prog = st.progress;
    const io = new IntersectionObserver(([e]) => (seen = e.isIntersecting));
    io.observe(track.current);
    const tick = (_t: number, dt: number) => {
      if (!seen || !stage.current) return;
      const w = stage.current.clientWidth;
      const h = stage.current.clientHeight;
      const R = Math.min(h * 0.34, w * 0.3);
      const t = smooth(clamp01((prog - 0.1) / 0.3)); // 0 = flat ring around the title, 1 = upright drum
      spin += (Math.min(dt, 50) / 1000) * 9 * (1 - t); // slow orbit while the ring is flat
      const aligned = Math.round(spin / STEP) * STEP;
      const f = clamp01((prog - 0.42) / 0.52) * (N26 - 1);
      const base = Math.floor(f);
      const turn = (base + smooth(clamp01((f - base - 0.3) / 0.4))) * STEP; // holds, then turns one piece
      const S = spin * (1 - t) + aligned * t - turn;
      const yOff = t * h * 0.07;
      items.current.forEach((el, k) => {
        if (!el) return;
        const phi = k * STEP + S;
        const rad = (phi * Math.PI) / 180;
        const c = Math.cos(rad);
        const norm = ((((phi + 180) % 360) + 360) % 360) - 180;
        const x = R * Math.sin(rad);
        const y = -R * c * (1 - t) + yOff;
        const z = R * c * t;
        el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,${z.toFixed(1)}px) rotateY(${(norm * t).toFixed(2)}deg)`;
        el.style.opacity = String(1 - t + t * clamp01((c - 0.15) / 0.45));
      });
      if (title.current) {
        title.current.style.transform = `translateY(${(-t * h * 0.36).toFixed(1)}px) scale(${(1 - 0.42 * t).toFixed(3)})`;
      }
      if (cap.current) cap.current.style.opacity = String(clamp01((t - 0.6) / 0.4));
      const fr = (((Math.round(-S / STEP) % N26) + N26) % N26) as number;
      if (fr !== shown) {
        shown = fr;
        setFront(fr);
      }
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      io.disconnect();
      st.kill();
    };
  }, [live]);

  const p = PIECES[front];
  return (
    <Sec theme="stone" font="serif" className="overflow-clip!">
      <style>{CSS}</style>
      <div ref={track} className="relative" style={{ height: live ? "190vh" : "auto" }}>
        <div
          ref={stage}
          className={`${live ? "sticky top-0 h-svh" : "relative h-[clamp(680px,100svh,920px)]"} overflow-hidden`}
          style={{ perspective: "1600px", ["--R" as string]: "calc(clamp(680px, 100svh, 920px) * 0.34)" }}
        >
          {/* a slow turning halo behind the ring (large-area ambient change) */}
          <div aria-hidden className={`pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[min(92vh,84vw)] rounded-full opacity-70 ${live ? "gl5halo" : ""}`} style={{ translate: "-50% -50%", background: "conic-gradient(from 0deg, transparent, color-mix(in srgb, var(--sx-accent) 38%, transparent), transparent 40%, color-mix(in srgb, var(--sx-accent) 26%, transparent), transparent 75%)", maskImage: "radial-gradient(closest-side, transparent 38%, #000 60%, transparent)" }} />

          <div ref={title} className="absolute inset-0 grid place-items-center">
            <div className="max-w-[340px] text-center">
              <H className="text-[clamp(36px,3.6vw,58px)]">Ten pieces for one table.</H>
              <p className="mt-3 text-[15px] text-[var(--sx-muted)]">Stoneware, thrown and glazed in Khurja.</p>
            </div>
          </div>

          <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
            {PIECES.map((x, k) => {
              const a = (k * STEP * Math.PI) / 180;
              return (
                <div
                  key={x.n}
                  ref={(el) => {
                    items.current[k] = el;
                  }}
                  className="absolute left-1/2 top-1/2 w-[clamp(104px,9.6vw,148px)]"
                  style={{ translate: "-50% -50%", transform: `translate(calc(var(--R) * ${Math.sin(a).toFixed(4)}), calc(var(--R) * ${(-Math.cos(a)).toFixed(4)}))`, backfaceVisibility: "hidden" }}
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-[12px] shadow-[0_24px_40px_-24px_rgba(17,20,24,.5)]">
                    <Shot i={x.i} w={600} h={800} alt={k % 2 === 1} />
                  </div>
                  <p className="mt-2 text-center text-[13px] font-[600]">{x.n}</p>
                </div>
              );
            })}
          </div>

          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 px-[clamp(0px,1vw,16px)] pb-[clamp(24px,4vh,48px)]">
            <p className="text-[15px] text-[var(--sx-muted)]">10 pieces · from ₹650</p>
            <div ref={cap} className="text-center" style={{ opacity: 0 }}>
              <p className="sx-display text-[clamp(22px,2vw,32px)] font-[700] leading-none">{p.n}</p>
              <p className="mt-2 text-[15px]">
                <Price now={p.p} />
              </p>
            </div>
            <Btn>Shop the set · ₹14,500</Btn>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "GL23", name: "Focus grid: one sharp, the rest blur", motion: "M6", C: GL23 },
  { code: "GL24", name: "Inclined three-slide strip", motion: "M31", C: GL24 },
  { code: "GL25", name: "Coverflow carousel", motion: "M34", C: GL25 },
  { code: "GL26", name: "Ring around a title opening into a drum", motion: "M33", C: GL26 },
];
