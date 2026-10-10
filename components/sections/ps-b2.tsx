"use client";

// PS · Product-showcase layouts, batch 2 (docs/SECTION-MENU.md): PS13 magnifier inspection card, PS14 shop-by-category
// tile grid. Each keeps moving while on screen (hands-free for filming) and shows its final state in ?static=1.
import { useCallback, useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { scene, useTicker } from "../fx/shared";
import { Btn, H, P, Pic, Price, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Steps an index every `ms` while the section is on screen (stops off screen and in ?static=1). */
function useAutoCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms: number, start = 0) {
  const [i, setI] = useState(start);
  const paused = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let t: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (e.isIntersecting) t = setInterval(() => !paused.current && setI((v) => (v + 1) % n), ms);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, [ref, n, ms]);
  return [i, setI, paused] as const;
}

/* ───────────────────────────── PS13 · Magnifier inspection card ───────────────────────────── */

const PS13_SRC = scene(3, 1500, 1200, "");
const PS13_STOPS = [
  { x: 0.63, y: 0.52, t: "Hand-burnished toe", d: "Three coats of wax, rubbed in by hand until the leather turns deep conker brown." },
  { x: 0.42, y: 0.72, t: "Goodyear-welted sole", d: "Stitched, not glued: resole it in ten years and keep the uppers you broke in." },
  { x: 0.38, y: 0.5, t: "Vegetable-tanned calf", d: "Tanned for forty days in bark and water in Chennai. It darkens as you wear it." },
];
const ZOOM = 2.6;

/** PS13 · Big image card (7 cols) with a round lens that glides over details (follows the pointer); callouts on the right. */
function PS13() {
  const r = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const lens = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: PS13_STOPS[0].x, y: PS13_STOPS[0].y });
  const wob = useRef({ x: 0, y: 0 });
  const [i, setI, paused] = useAutoCycle(r, PS13_STOPS.length, 2400);
  useSectionMotion(r, "M23");

  const apply = useCallback(() => {
    const c = card.current;
    const l = lens.current;
    const n = inner.current;
    if (!c || !l || !n) return;
    const W = c.clientWidth;
    const H = c.clientHeight;
    const R = l.offsetWidth / 2;
    const x = (pos.current.x + wob.current.x) * W;
    const y = (pos.current.y + wob.current.y) * H;
    l.style.transform = `translate3d(${x - R}px, ${y - R}px, 0)`;
    n.style.width = `${W * ZOOM}px`;
    n.style.height = `${H * ZOOM}px`;
    n.style.transform = `translate3d(${-x * ZOOM + R}px, ${-y * ZOOM + R}px, 0)`;
  }, []);

  // first placement + on resize (also the ?static=1 state: lens resting on detail 1)
  useEffect(() => {
    apply();
    const ro = new ResizeObserver(apply);
    if (card.current) ro.observe(card.current);
    return () => ro.disconnect();
  }, [apply]);

  // glide to the active detail
  useEffect(() => {
    if (prefersReducedMotion() || paused.current) return;
    const s = PS13_STOPS[i];
    const tw = gsap.to(pos.current, { x: s.x, y: s.y, duration: 1.1, ease: "power2.inOut" });
    return () => void tw.kill();
  }, [i, paused]);

  // a slow hand-held wobble (two periods), so the magnified view never stands still
  useTicker(r, (t) => {
    wob.current.x = Math.sin(t * 1.3) * 0.018 + Math.sin(t * 0.47) * 0.01;
    wob.current.y = Math.cos(t * 1.05) * 0.016;
    apply();
  });

  const onMove = (e: React.PointerEvent) => {
    const b = card.current!.getBoundingClientRect();
    paused.current = true;
    gsap.to(pos.current, { x: (e.clientX - b.left) / b.width, y: (e.clientY - b.top) / b.height, duration: 0.35, ease: "power2.out", overwrite: true });
  };

  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <div className="grid grid-cols-1 items-center gap-[clamp(32px,4.5vw,72px)] md:grid-cols-12">
        <div
          ref={card}
          data-m-img
          onPointerMove={onMove}
          onPointerLeave={() => (paused.current = false)}
          className="relative aspect-[5/4] cursor-crosshair overflow-hidden rounded-[var(--sx-radius)] shadow-[0_40px_80px_-50px_rgba(28,24,19,.6)] md:col-span-7"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={PS13_SRC} alt="The Halden derby" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
          <div ref={lens} className="pointer-events-none absolute left-0 top-0 aspect-square w-[clamp(150px,15vw,230px)] overflow-hidden rounded-full border-2 border-white/80 shadow-[0_24px_60px_-10px_rgba(0,0,0,.55),inset_0_0_0_6px_rgba(255,255,255,.12)] will-change-transform">
            <div ref={inner} className="absolute left-0 top-0 will-change-transform">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={PS13_SRC} alt="" className="h-full w-full object-cover" draggable={false} />
            </div>
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,.35),transparent_45%)]" />
          </div>
          <p className="absolute bottom-4 left-5 rounded-full bg-black/45 px-3 py-1.5 text-[12px] font-[600] uppercase tracking-[0.14em] text-white backdrop-blur">× {ZOOM} detail</p>
        </div>
        <div className="md:col-span-5">
          <H className="text-[clamp(40px,4.4vw,76px)]">Look closer. Then closer.</H>
          <P className="mt-5 max-w-[40ch]">The Halden derby, lasted and stitched over eleven days by four cobblers in Agra.</P>
          <ol className="mt-8 border-t border-[var(--sx-line)]">
            {PS13_STOPS.map((s, k) => (
              <li key={s.t} className="relative border-b border-[var(--sx-line)] py-5 pl-8 transition-opacity duration-500" style={{ opacity: k === i ? 1 : 0.45 }}>
                <span className={`absolute left-0 top-[26px] h-3 w-3 rounded-full border-2 border-[var(--sx-accent)] transition-colors duration-500 ${k === i ? "bg-[var(--sx-accent)]" : ""}`} />
                <button type="button" onClick={() => setI(k)} className="text-left">
                  <p className="text-[18px] font-[650]">{s.t}</p>
                  <p className="mt-1 text-[15px] leading-relaxed text-[var(--sx-muted)]">{s.d}</p>
                </button>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Price now="₹14,900" className="text-[20px]" />
            <Btn>Choose your size</Btn>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────────── PS14 · Shop-by-category tile grid ───────────────────────────── */

const CATS = [
  { n: "New in: monsoon linen", c: 64, i: 3, f: true },
  { n: "Shirts", c: 42, i: 1 },
  { n: "Dresses", c: 38, i: 2 },
  { n: "Trousers", c: 27, i: 0 },
  { n: "Kurta sets", c: 31, i: 3 },
  { n: "Knitwear", c: 18, i: 2 },
  { n: "Bags", c: 22, i: 0 },
  { n: "Scarves", c: 26, i: 1 },
  { n: "Home linen", c: 19, i: 3 },
];
const PS14_CSS = `.ps14-z{transition:transform 1.4s cubic-bezier(.22,1,.36,1)}.ps14-on .ps14-z{transform:scale(1.1)}.ps14-on .ps14-dot{background:var(--sx-accent);color:var(--sx-accent-text)}.is-static .ps14-z{transition:none}`;

/** PS14 · 4-column category grid; the first card spans 2×2 as "featured"; each image zooms slightly in turn. */
function PS14() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M13");
  const [on] = useAutoCycle(r, CATS.length, 1300, -1);
  return (
    <Sec innerRef={r} theme="ink" font="wide" className="py-[clamp(72px,9vw,140px)]">
      <style>{PS14_CSS}</style>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[16ch] text-[clamp(38px,4.4vw,72px)]">Shop by category</H>
        <div className="flex flex-wrap items-center gap-5 pb-1">
          <P className="text-[15px]">294 pieces, cut in Jaipur</P>
          <Btn kind="ghost">All categories</Btn>
        </div>
      </div>
      <div className="mt-[clamp(32px,4vw,56px)] grid grid-cols-2 gap-[clamp(10px,1.2vw,18px)] md:grid-cols-4">
        {CATS.map((c, k) => (
          <a
            key={c.n}
            href="#"
            onClick={(e) => e.preventDefault()}
            data-cursor="Shop"
            className={`group relative block min-w-0 overflow-hidden rounded-[var(--sx-radius)] ${c.f ? "col-span-2 row-span-2 min-h-[360px] md:min-h-0" : ""} ${k === on ? "ps14-on" : ""}`}
          >
            {c.f ? (
              <div className="ps14-z absolute inset-0 group-hover:scale-[1.1]">
                <Pic i={c.i} ratio="auto" round={false} className="absolute inset-0 h-full w-full" />
              </div>
            ) : (
              <div className="ps14-z group-hover:scale-[1.1]">
                <Pic i={c.i} ratio="4/5" round={false} className="w-full" />
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgba(7,9,15,.82))]" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-[clamp(14px,1.6vw,26px)] text-white">
              <div className="min-w-0">
                <p className={`sx-display font-[700] leading-[1.05] ${c.f ? "text-[clamp(26px,2.6vw,42px)]" : "text-[clamp(17px,1.4vw,22px)]"}`}>{c.n}</p>
                <p className="mt-1 text-[13px] text-white/70">{c.c} items</p>
              </div>
              <span className="ps14-dot grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/40 text-[15px] transition-colors duration-500">→</span>
            </div>
            {c.f && <span className="absolute left-[clamp(14px,1.6vw,26px)] top-[clamp(14px,1.6vw,26px)] rounded-full bg-[var(--sx-accent)] px-3 py-1.5 text-[12px] font-[700] uppercase tracking-[0.12em] text-[var(--sx-accent-text)]">Featured</span>}
          </a>
        ))}
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "PS13", name: "Magnifier inspection card", motion: "M23", C: PS13 },
  { code: "PS14", name: "Shop-by-category tile grid", motion: "M13", C: PS14 },
];
