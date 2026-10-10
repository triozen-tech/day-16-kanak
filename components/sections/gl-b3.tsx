"use client";

// GL · Gallery layouts, batch 3 (docs/SECTION-MENU.md): GL15 grid tiles that expand in place, GL16 four-quadrant
// converge, GL17 perspective floor grid flying toward you, GL18 twin orbit roll.
// Each keeps moving while on screen (hands-free for filming) and shows its final state in ?static=1.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { useTicker } from "../fx/shared";
import { Btn, H, P, Pic, Price, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const KB_CSS = `.glkb{animation:glkb 5.2s ease-in-out infinite alternate}.glkb.alt{animation-duration:6.9s;animation-direction:alternate-reverse}@keyframes glkb{from{transform:scale(1) translate(0,0)}to{transform:scale(1.12) translate(-2.5%,-2%)}}.is-static .glkb{animation:none}html.is-static {.glkb{animation:none}}`;

/* ───────────────────────────── GL15 · Grid tiles that expand in place ───────────────────────────── */

const ROOMS = [
  { i: 3, t: "The courtyard table", d: "Twelve seats under the neem tree, lit by brass lamps. Our chef’s thali changes with the market every evening.", m: "Dinner from ₹2,400", span: "md:col-span-2" },
  { i: 1, t: "The bar", d: "Toddy-shop classics reworked: kokum sours, jaggery old fashioneds, a cashew feni flight.", m: "Cocktails from ₹650", span: "md:col-span-1" },
  { i: 2, t: "The chef’s counter", d: "Eight stools facing the tandoor. Seven courses, one sitting at 8 pm, Thursday to Sunday.", m: "Tasting menu ₹4,800", span: "md:col-span-1" },
  { i: 0, t: "The garden room", d: "A glasshouse for long lunches and private suppers of up to twenty-two guests.", m: "Private dining on request", span: "md:col-span-2" },
];

/** GL15 · A 3-column image grid (wide+narrow / narrow+wide); a tile grows to cover the grid with its caption while the others dim. */
function GL15() {
  const r = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const ov = useRef<HTMLDivElement>(null);
  const cap = useRef<HTMLDivElement>(null);
  const tiles = useRef<(HTMLDivElement | null)[]>([]);
  const [focus, setFocus] = useState(0);
  const [open, setOpen] = useState(false);
  useSectionMotion(r, "M18");

  // hands-free: open a tile, hold, close, next tile (only while on screen; never in ?static=1)
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    let t: ReturnType<typeof setInterval> | undefined;
    let phase = 0;
    const step = () => {
      phase++;
      if (phase % 2) {
        setFocus(Math.floor(phase / 2) % ROOMS.length);
        setOpen(true);
      } else setOpen(false);
    };
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (e.isIntersecting) t = setInterval(step, 1700);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, []);

  // grow the overlay from the tile's box to the whole grid (and back)
  useLayoutEffect(() => {
    const o = ov.current;
    const g = grid.current;
    const tile = tiles.current[focus];
    if (!o || !g || !tile) return;
    const box = { left: tile.offsetLeft, top: tile.offsetTop, width: tile.offsetWidth, height: tile.offsetHeight };
    gsap.killTweensOf([o, cap.current]);
    if (open) {
      gsap.fromTo(o, { ...box, autoAlpha: 1 }, { left: 0, top: 0, width: g.offsetWidth, height: g.offsetHeight, duration: 0.75, ease: "power3.inOut" });
      gsap.fromTo(cap.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out", delay: 0.45 });
    } else if (o.style.visibility === "visible") {
      gsap.to(cap.current, { opacity: 0, duration: 0.25 });
      gsap.to(o, { ...box, duration: 0.6, ease: "power3.inOut" });
      gsap.to(o, { autoAlpha: 0, duration: 0.2, delay: 0.6 });
    }
  }, [open, focus]);

  const f = ROOMS[focus];
  return (
    <Sec innerRef={r} theme="ink" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <style>{KB_CSS}</style>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[13ch] text-[clamp(44px,5.4vw,90px)]">Four rooms, one kitchen.</H>
        <div className="max-w-[38ch]">
          <P>Neem & Salt serves the same coastal menu in four very different rooms. Open one to look inside.</P>
          <div className="mt-6">
            <Btn>Book a table</Btn>
          </div>
        </div>
      </div>
      <div ref={grid} className="relative mt-[clamp(40px,5vw,72px)] grid grid-cols-1 gap-[clamp(10px,1.2vw,16px)] md:grid-cols-3" onClick={() => setOpen(false)}>
        {ROOMS.map((x, k) => (
          <div
            key={x.t}
            ref={(n) => {
              tiles.current[k] = n;
            }}
            data-m-card
            data-cursor="Open"
            onClick={(e) => (e.stopPropagation(), setFocus(k), setOpen(true))}
            className={`relative h-[clamp(240px,22vw,340px)] cursor-pointer overflow-hidden rounded-[var(--sx-radius)] transition-opacity duration-500 ${x.span} ${open && k !== focus ? "opacity-30" : ""}`}
          >
            <div className={`glkb ${k % 2 ? "alt" : ""} absolute inset-0`}>
              <Pic i={x.i} ratio="auto" round={false} label="" className="absolute inset-0 h-full w-full" />
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_50%,rgba(7,9,15,.7))]" />
            <p className="absolute bottom-5 left-6 text-[clamp(18px,1.5vw,22px)] font-[650] text-white">{x.t}</p>
          </div>
        ))}
        {/* the expanded view */}
        <div ref={ov} className="invisible absolute z-20 overflow-hidden rounded-[var(--sx-radius)] opacity-0 max-md:hidden" style={{ left: 0, top: 0, width: 0, height: 0 }}>
          <div className="glkb absolute inset-0">
            <Pic i={f.i} ratio="auto" round={false} label="" className="absolute inset-0 h-full w-full" />
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,9,15,.82),rgba(7,9,15,.2)_65%)]" />
          <div ref={cap} className="absolute bottom-0 left-0 max-w-[560px] p-[clamp(28px,4vw,60px)] text-white">
            <h3 className="sx-display text-[clamp(40px,4.4vw,72px)] font-[800] leading-[0.95] tracking-[-0.02em]">{f.t}</h3>
            <p className="mt-4 text-[17px] leading-relaxed text-white/80">{f.d}</p>
            <p className="mt-5 text-[15px] font-[650]">{f.m}</p>
            <p className="mt-6 text-[13px] uppercase tracking-[0.14em] text-white/60">Tap anywhere to close</p>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────────── GL16 · Four-quadrant converge ───────────────────────────── */

const LOOKS = [
  { i: 2, n: "Ochre wrap coat" },
  { i: 0, n: "Indigo co-ord" },
  { i: 3, n: "Rust slip dress" },
  { i: 1, n: "Chalk tailoring" },
];
const HERO_LOOK = 1;

/** GL16 · Four images start in the corners, travel to a tight 2×2 in the centre on scroll, then one expands to fill the screen. */
function GL16() {
  const r = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const boxes = useRef<(HTMLDivElement | null)[]>([]);
  const cap = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M13");
  useEffect(() => {
    const w = wrap.current;
    const s = stage.current;
    if (!w || !s) return;
    const update = (p: number) => {
      const W = s.clientWidth;
      const Hh = s.clientHeight;
      const a = easeInOut(clamp01(p / 0.45));
      const b = easeInOut(clamp01((p - 0.55) / 0.33));
      const gap = 10;
      boxes.current.forEach((el, k) => {
        if (!el) return;
        const sx = k % 2 ? 1 : -1;
        const sy = k < 2 ? -1 : 1;
        const w0 = W * 0.24, h0 = Hh * 0.34;
        const w1 = W * 0.17, h1 = Hh * 0.27;
        const x0 = W / 2 + sx * W * 0.33 - w0 / 2, y0 = Hh / 2 + sy * Hh * 0.27 - h0 / 2;
        const x1 = W / 2 + sx * (w1 / 2 + gap / 2) - w1 / 2, y1 = Hh / 2 + sy * (h1 / 2 + gap / 2) - h1 / 2;
        let x = lerp(x0, x1, a), y = lerp(y0, y1, a), bw = lerp(w0, w1, a), bh = lerp(h0, h1, a);
        let op = 1;
        let rad = 18;
        if (k === HERO_LOOK) {
          x = lerp(x, 0, b);
          y = lerp(y, 0, b);
          bw = lerp(bw, W, b);
          bh = lerp(bh, Hh, b);
          rad = lerp(18, 0, b);
        } else op = 1 - clamp01(b * 1.6);
        el.style.transform = `translate(${x}px, ${y}px)`;
        el.style.width = `${bw}px`;
        el.style.height = `${bh}px`;
        el.style.opacity = String(op);
        el.style.borderRadius = `${rad}px`;
        const lbl = el.querySelector<HTMLElement>("[data-lbl]");
        if (lbl) lbl.style.opacity = String(1 - b);
      });
      if (cap.current) cap.current.style.opacity = String(clamp01((p - 0.82) / 0.12));
    };
    if (prefersReducedMotion()) {
      update(1);
      const ro = () => update(1);
      window.addEventListener("resize", ro);
      return () => window.removeEventListener("resize", ro);
    }
    const st = ScrollTrigger.create({ trigger: w, start: "top top", end: "bottom bottom", onUpdate: (x) => update(x.progress), onRefresh: (x) => update(x.progress) });
    update(st.progress);
    return () => st.kill();
  }, []);
  return (
    <Sec innerRef={r} theme="stone" font="grotesk" full style={{ overflow: "clip" }}>
      <style>{KB_CSS}</style>
      <div className="grid grid-cols-1 items-end gap-8 px-[clamp(20px,5vw,96px)] pt-[clamp(72px,9vw,140px)] md:grid-cols-12">
        <H className="text-[clamp(44px,5.6vw,92px)] md:col-span-7">Four looks, one cloth.</H>
        <P className="md:col-span-5">The monsoon edit is cut from a single hand-loomed khadi, dyed four ways. Keep scrolling to meet the one we can’t stop wearing.</P>
      </div>
      <div ref={wrap} className="relative h-[190vh]">
        <div ref={stage} className="sticky top-0 h-[100svh] overflow-hidden">
          {LOOKS.map((l, k) => (
            <div
              key={l.n}
              ref={(n) => {
                boxes.current[k] = n;
              }}
              className="absolute left-0 top-0 overflow-hidden will-change-transform"
              style={{ zIndex: k === HERO_LOOK ? 2 : 1, width: "24%", height: "34%" }}
            >
              <div className={`glkb ${k % 2 ? "alt" : ""} absolute inset-0`}>
                <Pic i={l.i} ratio="auto" round={false} label="" className="absolute inset-0 h-full w-full" />
              </div>
              <span data-lbl className="absolute bottom-3 left-4 z-[1] text-[13px] font-[600] uppercase tracking-[0.12em] text-white drop-shadow">{l.n}</span>
            </div>
          ))}
          <div ref={cap} className="absolute inset-0 z-10 flex items-end bg-[linear-gradient(180deg,transparent_45%,rgba(17,20,24,.7))] p-[clamp(24px,5vw,96px)] opacity-0">
            <div className="flex w-full flex-wrap items-end justify-between gap-6 text-white">
              <div>
                <p className="sx-display text-[clamp(52px,7vw,120px)] font-[800] leading-[0.9] tracking-[-0.03em]">Indigo co-ord.</p>
                <p className="mt-4 max-w-[44ch] text-[17px] text-white/80">Boxy shirt and wide trouser in vat-dyed khadi. Softens with every wash.</p>
              </div>
              <div className="flex items-center gap-5">
                <Price now="₹6,450" was="₹7,200" className="text-[20px]" />
                <Btn>Shop the look</Btn>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────────── GL17 · Perspective floor grid flying toward you ───────────────────────────── */

const PAIRS = ["Airloop 2", "Trail Kite", "Court 71", "Ridge Mid", "Pacer Lite", "Dune Runner", "Halo Knit", "Metro Low"];
const PRICES = ["₹8,990", "₹11,490", "₹6,790", "₹12,990", "₹7,490", "₹9,990", "₹10,490", "₹5,990"];
const ROWS = 7;
const COLS = 6;

/** GL17 · A wide image grid tilted back like a floor that keeps moving toward the viewer (faster with the scroll), under a floating heading. */
function GL17() {
  const r = useRef<HTMLDivElement>(null);
  const belt = useRef<HTMLDivElement>(null);
  const off = useRef(0);
  const lastY = useRef<number | null>(null);
  useSectionMotion(r, "M31");
  useTicker(r, (_t, dt) => {
    const b = belt.current;
    if (!b) return;
    const y = window.scrollY;
    const dy = lastY.current === null ? 0 : y - lastY.current;
    lastY.current = y;
    const period = b.scrollHeight / 2; // the rows are drawn twice: loop seamlessly
    off.current = (off.current + dt * 70 + Math.max(0, dy) * 0.8) % period;
    b.style.transform = `translate3d(0, ${off.current - period}px, 0)`;
  });
  const tile = (n: number) => {
    const k = n % PAIRS.length;
    return (
      <div key={n} className="overflow-hidden rounded-[14px] border border-[var(--sx-line)] bg-[var(--sx-surface)]">
        <Pic i={(n * 3) % 4} ratio="4/3" round={false} label={`${PAIRS[k].toUpperCase()} · ${PRICES[k]}`} />
      </div>
    );
  };
  return (
    <Sec innerRef={r} theme="ink" font="wide" full>
      <div className="relative flex h-[clamp(680px,100svh,980px)] flex-col">
        {/* the floor: its own box below the CTA row (never behind the copy); the vanishing point is the box's top centre */}
        <div className="relative order-2 mt-[clamp(12px,2vh,28px)] min-h-[240px] flex-1 overflow-hidden [mask-image:linear-gradient(180deg,transparent_0%,#000_38%)]" style={{ perspective: "900px", perspectiveOrigin: "50% 0%" }}>
          {/* 180% wide and centred (translate only in the transform: no Tailwind translate class, which would add a second -50%) */}
          <div className="absolute bottom-[-8%] left-1/2 h-[175%] w-[180%] overflow-hidden" style={{ transform: "translateX(-50%) rotateX(62deg)", transformOrigin: "50% 100%" }}>
            <div ref={belt} className="will-change-transform">
              {[0, 1].map((rep) => (
                <div key={rep} className="grid grid-cols-6 gap-[18px] pb-[18px]">
                  {Array.from({ length: ROWS * COLS }, (_, n) => tile(n + rep * 1000))}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[18%] bg-[linear-gradient(180deg,transparent,var(--sx-bg))]" />
        {/* floating heading */}
        <div className="relative z-10 order-1 mx-auto flex w-full max-w-[980px] shrink-0 flex-col items-center px-[clamp(20px,5vw,96px)] pt-[clamp(72px,9vh,120px)] text-center">
          <H className="text-[clamp(40px,5vw,84px)] uppercase leading-[0.95]">Every pair, on the floor.</H>
          <P className="mt-5 max-w-[46ch]">Forty-two silhouettes, from track spikes to everyday knits. Walk the whole wall in one scroll.</P>
          <div className="mt-7 flex flex-wrap justify-center gap-4">
            <Btn>Shop all sneakers</Btn>
            <Btn kind="ghost">New this week</Btn>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────────── GL18 · Twin orbit roll ───────────────────────────── */

const SCENTS = [
  { n: "Monsoon Oud", note: "Oud, wet earth, vetiver", p: "₹4,200", i: 3 },
  { n: "Rose Attar", note: "Damask rose, saffron", p: "₹3,600", i: 1 },
  { n: "Neroli Ghat", note: "Orange blossom, sea salt", p: "₹2,900", i: 0 },
  { n: "Smoked Chai", note: "Black tea, cardamom, birch", p: "₹3,100", i: 2 },
  { n: "Jasmine Night", note: "Sambac, tuberose, musk", p: "₹3,800", i: 1 },
  { n: "Cedar Fog", note: "Himalayan cedar, incense", p: "₹3,400", i: 3 },
  { n: "Vetiver Rain", note: "Khus, grapefruit, moss", p: "₹2,700", i: 2 },
  { n: "Amber Fort", note: "Amber, labdanum, honey", p: "₹4,600", i: 0 },
];
const STEP = 360 / SCENTS.length;
const wrapDeg = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;

/** GL18 · Pinned: names orbit a circle on the left, image cards a second circle on the right; the pair at the centre line is in focus. */
function GL18() {
  const r = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const left = useRef<HTMLDivElement>(null);
  const right = useRef<HTMLDivElement>(null);
  const names = useRef<(HTMLDivElement | null)[]>([]);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const prog = useRef(0);
  const [focus, setFocus] = useState(0);
  const focusRef = useRef(0);

  const draw = (theta: number) => {
    if (left.current) left.current.style.transform = `rotate(${theta}deg)`;
    if (right.current) right.current.style.transform = `rotate(${-theta}deg)`;
    let best = 0;
    let bestD = 999;
    SCENTS.forEach((_, k) => {
      const d = Math.abs(wrapDeg(k * STEP + theta));
      if (d < bestD) (bestD = d), (best = k);
      const near = clamp01(1 - d / (STEP * 1.6));
      // only the readable arc shows: fade out from 50° and hide past 70° from the focus line
      const arc = clamp01((70 - d) / 20);
      const n = names.current[k];
      const c = cards.current[k];
      if (n) {
        n.style.opacity = String((0.22 + 0.78 * near) * clamp01((38 - d) / 14)); // names: only the readable middle of the arc (no clipped stray letters)
        n.style.scale = String(0.8 + 0.3 * near);
      }
      if (c) {
        c.style.opacity = String((0.3 + 0.7 * near) * arc);
        c.style.scale = String(0.72 + 0.4 * near);
      }
    });
    if (best !== focusRef.current) {
      focusRef.current = best;
      setFocus(best);
    }
  };

  // M33 orbit: the wheels turn by themselves (and further with the scroll through the pinned stage)
  useEffect(() => {
    const w = wrap.current;
    if (!w) return;
    if (prefersReducedMotion()) {
      draw(0);
      return;
    }
    const st = ScrollTrigger.create({ trigger: w, start: "top top", end: "bottom bottom", onUpdate: (s) => (prog.current = s.progress) });
    return () => st.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useTicker(r, (t) => draw(-(t * 14 + prog.current * 150)));
  useLayoutEffect(() => draw(0), []); // eslint-disable-line react-hooks/exhaustive-deps

  const s = SCENTS[focus];
  return (
    <Sec innerRef={r} theme="ink" font="serif" full style={{ overflow: "clip" }}>
      <div className="grid grid-cols-1 items-end gap-8 px-[clamp(20px,5vw,96px)] pt-[clamp(72px,9vw,140px)] md:grid-cols-12">
        <H className="text-[clamp(44px,5.6vw,92px)] font-[500] md:col-span-7">Eight scents, in rotation.</H>
        <P className="md:col-span-5">Our eaux de parfum are blended in Kannauj in small runs. The wheel turns; stop on the one that sounds like you.</P>
      </div>
      <div ref={wrap} className="relative mt-[clamp(24px,3vw,48px)] h-[170vh]">
        <div className="sticky top-0 h-[100svh] overflow-hidden [clip-path:inset(0)]">
          {/* left wheel: names; centre sits off the left edge, focus at 3 o'clock */}
          <div ref={left} className="absolute top-1/2 h-0 w-0" style={{ left: "-12vw" }}>
            {SCENTS.map((x, k) => (
              <div key={x.n} className="absolute left-0 top-0 h-0 w-0" style={{ transform: `rotate(${k * STEP}deg) translateX(42vw)`, transformOrigin: "0 0" }}>
                <div
                  ref={(n) => {
                    names.current[k] = n;
                  }}
                  className="-translate-y-1/2 origin-left whitespace-nowrap"
                >
                  <p className="sx-display text-[clamp(30px,3vw,54px)] font-[500] leading-none tracking-[-0.01em]">{x.n}</p>
                </div>
              </div>
            ))}
          </div>
          {/* right wheel: image cards; centre off the right edge, focus at 9 o'clock */}
          <div ref={right} className="absolute top-1/2 h-0 w-0" style={{ left: "112vw" }}>
            {SCENTS.map((x, k) => (
              <div key={x.n} className="absolute left-0 top-0 h-0 w-0" style={{ transform: `rotate(${-k * STEP}deg) translateX(-42vw)`, transformOrigin: "0 0" }}>
                <div
                  ref={(n) => {
                    cards.current[k] = n;
                  }}
                  className="absolute left-0 top-0 w-[clamp(170px,15vw,260px)] -translate-x-1/2 -translate-y-1/2"
                >
                  <Pic i={x.i} ratio="3/4" label="" />
                </div>
              </div>
            ))}
          </div>
          {/* the focused pair's details, between the wheels */}
          <div className="absolute bottom-[7%] left-1/2 z-10 w-[min(300px,80vw)] -translate-x-1/2 text-center">
            <p className="text-[14px] text-[var(--sx-muted)]">{s.note}</p>
            <div className="mt-3 flex items-center justify-center gap-4">
              <Price now={s.p} className="text-[17px]" />
              <Btn>Add · 50 ml</Btn>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "GL15", name: "Grid tiles that expand in place", motion: "M18", C: GL15 },
  { code: "GL16", name: "Four-quadrant converge", motion: "M13", C: GL16 },
  { code: "GL17", name: "Perspective floor grid flying toward you", motion: "M31", C: GL17 },
  { code: "GL18", name: "Twin orbit roll", motion: "M33", C: GL18 },
];
