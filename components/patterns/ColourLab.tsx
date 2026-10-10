"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { onSiteReady } from "@/lib/loading";
import Button from "@/components/ui/Button";

/**
 * Colour Lab: one product, several colourways, pinned while you scroll. The colourway follows the scroll
 * (the pin is split into equal parts), so it plays by itself during any scroll and a ?record=1 laptop and
 * phone show the same colour at the same second. On each change the product slides out / in, the giant
 * outlined name behind it changes, the labels fade in and the page-wide glow (`--glow` on <html>) takes the
 * colourway's colour, all on one clock (`swap` seconds).
 * Put <PageGlow /> once near the top of the page so the glow shows behind every section.
 * Reference: first built as a running-shoe site's signature moment. Rebuilt from VariantHero.
 *
 * Needs cut-out product images, all the same size and angle (transparent PNG/WebP).
 * iOS Safari: pinning (position: sticky) breaks while body has `overflow-x: hidden` — use `overflow-x: clip`.
 */

export type Colourway = {
  id: string;
  name: string;
  /** swatch + label colour */
  color: string;
  /** page glow colour (defaults to color) */
  glow?: string;
  image: string;
  note?: string;
};

const setGlow = (c: string) => document.documentElement.style.setProperty("--glow", c);

/** Fixed glow behind the whole page, in the current `--glow` colour. Render it once, before <main>. */
export function PageGlow({ strength = 16 }: { strength?: number }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background: `radial-gradient(40% 45% at 92% 18%, color-mix(in srgb, var(--glow, var(--accent)) ${strength}%, transparent), transparent 70%), radial-gradient(45% 50% at 6% 88%, color-mix(in srgb, var(--glow, var(--accent)) ${Math.round(strength * 0.75)}%, transparent), transparent 70%)`,
      }}
    />
  );
}

const css = (swap: number) => `
@property --glow { syntax: "<color>"; inherits: true; initial-value: transparent; }
:root { transition: --glow ${swap}s cubic-bezier(.33,1,.68,1); }
.cl-swap { transition-property: transform, opacity, color, background-color, box-shadow, width, visibility; transition-duration: ${swap}s; transition-timing-function: cubic-bezier(.33,1,.68,1); }
.cl-out { visibility: hidden; transition-duration: ${swap * 0.45}s; }
.cl-in { display: inline-block; animation: cl-in ${swap}s cubic-bezier(.33,1,.68,1) both; }
@keyframes cl-in { from { opacity: 0; transform: translateX(10px) skewX(var(--sk, 0deg)); } to { opacity: 1; transform: translateX(0) skewX(var(--sk, 0deg)); } }
.cl-float { animation: cl-float 3.6s ease-in-out infinite alternate; }
@keyframes cl-float { from { transform: translate3d(0,-1.2%,0) rotate(-1.5deg); } to { transform: translate3d(0,1.2%,0) rotate(.5deg); } }
html.is-static { .cl-float { animation: none; } }
`;

export default function ColourLab({
  id = "lab",
  eyebrow = "Colour Lab",
  heading = ["Pick your", "colour."],
  model,
  price,
  specs = [],
  colourways,
  cta,
  pin = 320,
  pinMobile = 340,
  swap = 0.5,
  restGlow = "var(--accent)",
  lean = true,
  record,
}: {
  id?: string;
  eyebrow?: string;
  /** two lines; the second takes the colourway colour */
  heading?: [string, string];
  /** product name above the colourway name */
  model: string;
  price?: string;
  specs?: { label: string; value: string }[];
  colourways: Colourway[];
  cta?: { label: string; href: string };
  /** section height in vh on laptop / phone (longer = more scroll per colourway) */
  pin?: number;
  pinMobile?: number;
  /** seconds for one colour change (product, name, labels and glow together) */
  swap?: number;
  /** page glow above the lab (scrolling back up) */
  restGlow?: string;
  /** slanted sport headings */
  lean?: boolean;
  /** ?record=1 stops: seconds to arrive at the pin, then seconds for all colourways */
  record?: { start: number; run: number };
}) {
  const [i, setI] = useState(0);
  const [still, setStill] = useState(false);
  const root = useRef<HTMLElement>(null);
  const live = useRef(false);
  const cur = useRef(colourways[0].glow ?? colourways[0].color);
  const cw = colourways[i];
  const n = colourways.length;
  const skew = lean ? "skewX(-8deg)" : "none";

  useEffect(() => {
    if (prefersReducedMotion()) {
      setStill(true);
      return;
    }
    let st: ScrollTrigger[] = [];
    const off = onSiteReady(() => {
      st.push(
        ScrollTrigger.create({
          trigger: root.current,
          start: "top top",
          end: "bottom bottom",
          onUpdate: (self) => setI(Math.min(n - 1, Math.floor(self.progress * n))),
        }),
        ScrollTrigger.create({
          trigger: root.current,
          start: "top 70%",
          onEnter: () => {
            live.current = true;
            setGlow(cur.current);
          },
          onLeaveBack: () => {
            live.current = false;
            setGlow(restGlow);
          },
        }),
      );
    });
    return () => {
      off();
      st.forEach((t) => t.kill());
      st = [];
    };
  }, [n, restGlow]);

  // same frame as the product and labels
  useLayoutEffect(() => {
    cur.current = cw.glow ?? cw.color;
    if (!still && live.current) setGlow(cur.current);
  }, [cw, still]);

  const pick = (k: number) => {
    if (still || !root.current || !window.__lenis) return setI(k);
    const r = root.current.getBoundingClientRect();
    window.__lenis.scrollTo(r.top + window.scrollY + ((k + 0.5) / n) * (r.height - window.innerHeight), { duration: 1.1 });
  };

  const dot = (c: Colourway, k: number) => (
    <span
      className="cl-swap h-6 w-6 shrink-0 rounded-full"
      style={{ background: c.color, transform: k === i ? "scale(1.15)" : "scale(.8)", boxShadow: k === i ? `0 0 0 3px var(--bg), 0 0 0 4px ${c.color}, 0 0 18px ${c.color}` : "none" }}
    />
  );

  return (
    <section
      ref={root}
      id={id}
      aria-label={`${eyebrow}: ${model}`}
      className={`relative z-[1] ${still ? "" : "h-[var(--pin-m)] md:h-[var(--pin)]"}`}
      style={{ "--pin": `${pin}vh`, "--pin-m": `${pinMobile}vh` } as React.CSSProperties}
    >
      <style>{css(swap)}</style>
      {record && (
        <>
          <div aria-hidden data-record-label={`${eyebrow}: start`} data-record-time={record.start} className="pointer-events-none absolute inset-x-0 top-0 h-px" />
          <div aria-hidden data-record-label={`${eyebrow}: all colours`} data-record-time={record.run} data-record-align="bottom" className="pointer-events-none absolute inset-x-0 bottom-0 h-px" />
        </>
      )}

      <div className={`${still ? "relative min-h-[100svh] py-28" : "sticky top-0 h-[100svh]"} flex flex-col overflow-hidden pt-[var(--nav-h,80px)]`}>
        {/* the lab's own light, in the glow colour */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-[54%] left-1/2 h-[min(120vh,1100px)] w-[min(120vh,1100px)] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "radial-gradient(closest-side, color-mix(in srgb, var(--glow, var(--accent)) 34%, transparent), color-mix(in srgb, var(--glow, var(--accent)) 8%, transparent) 55%, transparent)" }}
        />

        {/* giant outlined colourway name */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[50%] -translate-y-1/2 select-none">
          {colourways.map((c, k) => (
            <p
              key={c.id}
              className={`cl-swap ${k === i ? "" : "cl-out"} font-display absolute inset-x-0 -translate-y-1/2 text-center text-[clamp(120px,24vw,420px)] leading-none whitespace-nowrap text-transparent`}
              style={{ WebkitTextStroke: `1.5px ${c.color}`, opacity: k === i ? 0.55 : 0, transform: `translateY(-50%) ${skew} translateX(${k === i ? 0 : k < i ? -5 : 5}%)` }}
            >
              {c.name}
            </p>
          ))}
        </div>

        <div className="container-x relative grid flex-1 grid-rows-[auto_1fr_auto] items-center gap-4 py-5 lg:grid-cols-[minmax(0,300px)_1fr_minmax(0,300px)] lg:grid-rows-1 lg:gap-8 lg:py-8">
          {/* heading + swatches */}
          <div className="flex flex-col gap-4 lg:gap-7">
            <div>
              <p className="eyebrow">
                {eyebrow} ·{" "}
                <span key={i} className="cl-in tabular-nums">
                  {String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
                </span>
              </p>
              <h2 className="font-display mt-3 text-[clamp(44px,5vw,88px)]">
                <span className="block" style={{ transform: skew }}>
                  {heading[0]}
                </span>
                <span className="cl-swap block" style={{ transform: skew, color: cw.color }}>
                  {heading[1]}
                </span>
              </h2>
            </div>
            <ul className="hidden flex-col lg:flex">
              {colourways.map((c, k) => (
                <li key={c.id}>
                  <button onClick={() => pick(k)} className="group flex w-full items-center gap-4 border-b border-line py-3 text-left">
                    {dot(c, k)}
                    <span className="flex flex-col">
                      <span className={`cl-swap text-[15px] font-semibold ${k === i ? "text-fg" : "text-muted group-hover:text-fg"}`}>{c.name}</span>
                      {c.note && <span className="text-[12px] text-muted">{c.note}</span>}
                    </span>
                    <span className="cl-swap ml-auto h-[2px]" style={{ width: k === i ? 28 : 0, background: c.color }} />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* the product */}
          <div className="relative h-full min-h-[220px] w-full">
            <div className="cl-float absolute inset-0">
              {colourways.map((c, k) => (
                <img
                  key={c.id}
                  src={c.image}
                  alt={k === i ? `${model} in ${c.name}` : ""}
                  aria-hidden={k !== i}
                  className={`cl-swap ${k === i ? "" : "cl-out"} absolute inset-0 m-auto h-full max-h-[min(52vh,560px)] w-full object-contain md:drop-shadow-[0_40px_36px_rgba(0,0,0,.65)] lg:max-h-[min(62vh,620px)]`}
                  style={{ opacity: k === i ? 1 : 0, transform: `translateX(${k === i ? 0 : k < i ? -16 : 16}%) rotate(${k === i ? 0 : k < i ? -3 : 3}deg) scale(${k === i ? 1.04 : 0.96})` }}
                />
              ))}
            </div>
            <div aria-hidden className="cl-swap absolute bottom-[6%] left-1/2 h-10 w-[62%] -translate-x-1/2 rounded-[50%] blur-2xl" style={{ background: `color-mix(in srgb, ${cw.color} 32%, transparent)` }} />
          </div>

          {/* model, specs, price */}
          <div className="flex flex-col gap-4 lg:gap-6">
            <div className="flex items-center justify-between gap-2 lg:hidden">
              {colourways.map((c, k) => (
                <button key={c.id} onClick={() => pick(k)} aria-label={c.name} className="flex flex-1 flex-col items-center gap-1.5">
                  {dot(c, k)}
                  <span className={`cl-swap text-[12px] font-semibold whitespace-nowrap ${k === i ? "text-fg" : "text-muted"}`}>{c.name}</span>
                </button>
              ))}
            </div>
            <div className="flex items-end justify-between gap-4 lg:block">
              <div>
                <p className="text-[12px] font-semibold tracking-[0.16em] text-muted uppercase">{model}</p>
                <p key={i} className="cl-in font-display mt-2 text-[clamp(32px,2.8vw,48px)]" style={{ color: cw.color, "--sk": lean ? "-8deg" : "0deg" } as React.CSSProperties}>
                  {cw.name}
                </p>
              </div>
              {price && <p className="text-[clamp(26px,2.3vw,38px)] font-bold tabular-nums lg:mt-5">{price}</p>}
            </div>
            {specs.length > 0 && (
              <dl className="hidden grid-cols-2 gap-px bg-line lg:grid">
                {specs.map((s) => (
                  <div key={s.label} className="bg-bg/90 p-3.5">
                    <dt className="text-[12px] font-semibold tracking-[0.16em] text-muted uppercase">{s.label}</dt>
                    <dd className="mt-1 text-[15px] font-semibold">{s.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {cta && (
              <div>
                <Button href={cta.href} label={cta.label} />
              </div>
            )}
          </div>
        </div>

        {/* progress */}
        <div className="container-x relative pb-6 lg:pb-8">
          <div className="flex gap-2" aria-hidden>
            {colourways.map((c, k) => (
              <span key={c.id} className="h-[3px] flex-1 bg-line">
                <span className="cl-swap block h-full origin-left" style={{ background: c.color, transform: `scaleX(${k <= i ? 1 : 0})` }} />
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
