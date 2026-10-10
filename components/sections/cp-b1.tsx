"use client";

// CP · Comparison layouts, batch 1 (docs/SECTION-MENU.md).
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { useTicker } from "../fx/shared";
import { Btn, H, P, Pic, Price, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** CP01 · Full-width before/after: one wide picture, a divider handle, "Before" / "After" labels in the top corners.
 *  The divider sweeps by itself (a slow back-and-forth); the pointer takes over when it moves over the picture. */
function CP01() {
  const r = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const before = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const ptr = useRef<{ x: number; at: number } | null>(null);
  const cur = useRef(50);
  useSectionMotion(r, "M13");
  useTicker(box, (t) => {
    const live = ptr.current && performance.now() - ptr.current.at < 1500;
    // hands-free: sweeps right, back left, and keeps breathing around the middle
    const target = live ? ptr.current!.x : 50 + 36 * Math.sin(t * 0.75);
    cur.current += (target - cur.current) * (live ? 0.2 : 0.08);
    const x = cur.current.toFixed(2);
    before.current!.style.clipPath = `inset(0 calc(100% - ${x}%) 0 0)`;
    bar.current!.style.left = `${x}%`;
  });
  return (
    <Sec innerRef={r} theme="stone" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[13ch] text-[clamp(48px,6.4vw,112px)]">Sixty years, gently undone.</H>
        <P className="max-w-[38ch] pb-2">A 1962 teak armchair, stripped by hand, re-glued, re-caned and oiled. Same chair, another sixty years.</P>
      </div>
      <div
        ref={box}
        onPointerMove={(e) => {
          const b = e.currentTarget.getBoundingClientRect();
          ptr.current = { x: Math.min(100, Math.max(0, ((e.clientX - b.left) / b.width) * 100)), at: performance.now() };
        }}
        className="relative mt-[clamp(36px,5vw,72px)] cursor-ew-resize select-none overflow-hidden rounded-[var(--sx-radius)]"
        style={{ aspectRatio: "21/9" }}
      >
        {/* after (underneath) */}
        <Pic i={0} ratio="auto" round={false} className="fx-drift absolute inset-0 h-full w-full" />
        {/* before (on top, clipped to the left of the divider) */}
        <div ref={before} className="absolute inset-0" style={{ clipPath: "inset(0 50% 0 0)" }}>
          <div className="absolute inset-0 [filter:grayscale(.75)_sepia(.55)_contrast(.8)_brightness(.72)_blur(.4px)]">
            <Pic i={0} ratio="auto" round={false} className="fx-drift absolute inset-0 h-full w-full" />
          </div>
          <div className="absolute inset-0 opacity-40 mix-blend-multiply [background:repeating-linear-gradient(115deg,transparent_0_6px,rgba(60,40,20,.25)_6px_7px),radial-gradient(circle_at_30%_60%,rgba(70,45,20,.5),transparent_45%)]" />
        </div>
        {/* divider + handle */}
        <div ref={bar} className="absolute inset-y-0 w-0" style={{ left: "50%" }}>
          <span className="absolute inset-y-0 -left-px w-[2px] bg-white/90 shadow-[0_0_20px_rgba(0,0,0,.35)]" />
          <span className="absolute left-0 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-[18px] text-[#111418] shadow-[0_10px_30px_rgba(0,0,0,.3)]" aria-hidden>
            ⇆
          </span>
        </div>
        <span className="absolute left-5 top-5 rounded-full bg-black/45 px-4 py-2 text-[13px] font-[600] uppercase tracking-[0.14em] text-white backdrop-blur-md">Before</span>
        <span className="absolute right-5 top-5 rounded-full bg-white/85 px-4 py-2 text-[13px] font-[600] uppercase tracking-[0.14em] text-[#111418] backdrop-blur-md">After</span>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-6 border-t border-[var(--sx-line)] pt-8 md:grid-cols-12 md:items-center">
        {[
          ["Piece", "Teak lounge chair, 1962"],
          ["Workshop time", "41 hours, two craftspeople"],
          ["Restoration", "from ₹38,500"],
        ].map(([k, v]) => (
          <div key={k} className="md:col-span-3">
            <p className="text-[12px] uppercase tracking-[0.14em] text-[var(--sx-muted)]">{k}</p>
            <p className="mt-1 text-[clamp(17px,1.3vw,20px)]">{v}</p>
          </div>
        ))}
        <div className="md:col-span-3 md:text-right">
          <Btn>Book a restoration</Btn>
        </div>
      </div>
    </Sec>
  );
}

/** CP02 · Size line-up: four bottles stand on one baseline at true relative scale (height ∝ ∛volume), with ml, price and
 *  "perfect for" under each. They snap in from different sides; the highlighted size steps by itself. */
function CP02() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  const sizes = [
    { k: "Mini", ml: 10, price: "₹1,150", fit: "your pocket, a first try" },
    { k: "Travel", ml: 30, price: "₹2,650", fit: "a weekend bag, cabin-safe" },
    { k: "Classic", ml: 50, price: "₹3,900", fit: "every day for a year" },
    { k: "Grand", ml: 100, price: "₹6,400", fit: "the dressing table, gifting" },
  ];
  const max = Math.cbrt(100);
  const [a, setA] = useState(2);
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    let t: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (e.isIntersecting) t = setInterval(() => setA((v) => (v + 1) % sizes.length), 2000);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, [sizes.length]);
  return (
    <Sec innerRef={r} theme="ink" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <style>{`
        .cp02-sweep { animation: cp02-sweep 6s ease-in-out infinite alternate; }
        @keyframes cp02-sweep { from { translate: -30% 0; } to { translate: 30% 0; } }
        .cp02-bob { animation: cp02-bob 2.6s ease-in-out infinite alternate; }
        @keyframes cp02-bob { from { translate: 0 0; } to { translate: 0 -12px; } }
        html.is-static .cp02-sweep, html.is-static .cp02-bob { animation: none; }
        html.is-static { .cp02-sweep, .cp02-bob { animation: none; } }
      `}</style>
      <div className="pointer-events-none absolute inset-x-0 top-[22%] h-[60%] overflow-hidden" aria-hidden>
        <div className="cp02-sweep absolute inset-y-0 left-[20%] w-[60%] bg-[radial-gradient(ellipse_50%_60%_at_50%_70%,color-mix(in_srgb,var(--sx-accent)_22%,transparent),transparent)]" />
      </div>
      <div className="relative grid grid-cols-1 items-end gap-6 md:grid-cols-12">
        <H className="text-[clamp(48px,6vw,104px)] md:col-span-7">Pick your size of Vesper.</H>
        <P className="md:col-span-5 md:pb-2">Oud, smoked vetiver and pink pepper. The same juice in four bottles, drawn here at their true size.</P>
      </div>

      <div className="relative mt-[clamp(48px,6vw,96px)]">
        <div className="grid grid-cols-2 items-end gap-x-[clamp(16px,3vw,56px)] gap-y-12 md:grid-cols-4">
          {sizes.map((s, k) => {
            const h = Math.cbrt(s.ml) / max; // true relative scale
            const on = k === a;
            return (
              <div key={s.k} role="button" tabIndex={0} aria-pressed={on} data-m-card onMouseEnter={() => setA(k)} onClick={() => setA(k)} className="group flex flex-col items-center text-center">
                <div className="flex h-[clamp(240px,30vw,420px)] w-full items-end justify-center">
                  <div className={`relative flex flex-col items-center ${on ? "cp02-bob" : ""}`} style={{ height: `${h * 100}%`, aspectRatio: "0.62" }}>
                    {/* cap + neck */}
                    <span className={`block h-[16%] w-[38%] rounded-t-[6px] transition-colors duration-500 ${on ? "bg-[var(--sx-accent)]" : "bg-[color-mix(in_srgb,var(--sx-text)_70%,transparent)]"}`} />
                    <span className="block h-[5%] w-[22%] bg-[color-mix(in_srgb,var(--sx-text)_35%,transparent)]" />
                    {/* glass body */}
                    <span
                      className={`relative block w-full flex-1 overflow-hidden rounded-[14%_14%_10%_10%/10%_10%_8%_8%] border transition-[border-color,box-shadow] duration-500 ${on ? "border-[var(--sx-accent)] shadow-[0_0_60px_-10px_color-mix(in_srgb,var(--sx-accent)_70%,transparent)]" : "border-[var(--sx-line)]"}`}
                      style={{ background: "linear-gradient(100deg, color-mix(in srgb, var(--sx-text) 14%, transparent), color-mix(in srgb, var(--sx-accent) 28%, transparent) 45%, color-mix(in srgb, var(--sx-text) 6%, transparent) 70%, color-mix(in srgb, var(--sx-text) 18%, transparent))" }}
                    >
                      <span className="absolute inset-x-0 bottom-0 h-[78%] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--sx-accent)_45%,transparent),color-mix(in_srgb,var(--sx-accent)_75%,transparent))]" />
                      <span className="absolute left-[12%] top-[8%] h-[70%] w-[8%] rounded-full bg-white/30 blur-[2px]" />
                      <span className="absolute inset-x-[18%] top-[42%] border-y border-white/35 py-[4%] text-center text-[12px] font-[600] uppercase tracking-[0.08em] text-white/90">Vesper</span>
                    </span>
                  </div>
                </div>
                <div className="mt-6 w-full border-t border-[var(--sx-line)] pt-5">
                  <p className={`sx-display text-[clamp(32px,3.2vw,52px)] leading-none tabular-nums transition-colors duration-500 ${on ? "text-[var(--sx-accent)]" : ""}`}>{s.ml} ml</p>
                  <p className="mt-2 text-[15px] font-[650]">
                    {s.k} · <Price now={s.price} />
                  </p>
                  <p className="mt-1 text-[14px] text-[var(--sx-muted)]">Perfect for {s.fit}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-12 flex flex-wrap items-center justify-center gap-5">
        <Btn>
          Add {sizes[a].k} {sizes[a].ml} ml · {sizes[a].price}
        </Btn>
        <Btn kind="ghost">Order a sample vial</Btn>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "CP01", name: "Full-width drag before/after", motion: "M13", C: CP01 },
  { code: "CP02", name: "Size line-up on a baseline", motion: "M34", C: CP02 },
];
