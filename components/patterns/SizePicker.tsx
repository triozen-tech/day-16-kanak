"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";

/**
 * Hands-free size picker: product on a sizing pad + size grid (sold-out sizes crossed out), width toggle,
 * stock line and "Add to bag". Nobody touches the mouse on camera, so it plays a demo by itself:
 * tap ring on a first size → the demo size → the demo width → Add to bag (then calls onAdd).
 *  - Normal visit: plays once each time it comes on screen (a real click stops it).
 *  - ?record=1: put a data-record-hold on it (see `record`) and the demo is spread across the hold.
 * Tell your nav about the bag with `onAdd`, or listen for the "bag:add" window event (the default).
 * Reference: first built for a running-shoe site.
 */

const css = `
.sp-btn { position: relative; transition: background-color .35s ease, color .35s ease, box-shadow .35s ease; box-shadow: inset 0 0 0 1px var(--line); }
.sp-btn:hover:not(:disabled) { box-shadow: inset 0 0 0 1px var(--text); }
.sp-btn.is-on { background: var(--accent); color: var(--accent-text); box-shadow: none; }
.sp-btn:disabled { color: color-mix(in srgb, var(--muted) 60%, transparent); background: linear-gradient(to top right, transparent calc(50% - .5px), var(--line) 50%, transparent calc(50% + .5px)); }
.sp-tap { position: absolute; inset: -6px; border: 2px solid var(--accent); pointer-events: none; animation: sp-tap .7s ease-out forwards; }
@keyframes sp-tap { from { opacity: 1; transform: scale(.7); } to { opacity: 0; transform: scale(1.25); } }
.sp-dot { animation: sp-dot 1.4s ease-in-out infinite; }
@keyframes sp-dot { 50% { opacity: .25; } }
html.is-static { .sp-dot { animation: none; } }
`;

const addToBag = () => window.dispatchEvent(new Event("bag:add"));

export default function SizePicker({
  id = "fit",
  eyebrow = "Size picker",
  heading = ["Find your", "fit."],
  model,
  image,
  sizes,
  soldOut = [],
  low = {},
  widths = ["Regular", "Wide"],
  price,
  demo,
  demoSeconds = 4,
  perks = [],
  sizeLabel = "Size (UK)",
  sizeUnit = "",
  measure,
  onAdd = addToBag,
  record,
}: {
  id?: string;
  eyebrow?: string;
  /** two lines; the second is in the accent colour */
  heading?: [string, string];
  model: string;
  /** cut-out product image */
  image: string;
  sizes: string[];
  soldOut?: string[];
  /** sizes with few left, e.g. { "9": 3 } */
  low?: Record<string, number>;
  widths?: string[];
  price: string;
  /** the hands-free demo: first tap, then the size and width it settles on */
  demo: { first?: string; size: string; width?: string };
  /** length of the demo on a normal visit */
  demoSeconds?: number;
  perks?: { title: string; text: string }[];
  sizeLabel?: string;
  /** written before a size in the stock line, e.g. "UK" → "Only 3 left in UK 9" */
  sizeUnit?: string;
  /** optional length readout on the pad: size `from` = `base`, each size step adds `step` (plain numbers, so a server page can pass it) */
  measure?: { from: number; base: number; step: number; unit?: string; label?: string };
  onAdd?: () => void;
  /** ?record=1 stop: seconds to arrive, seconds to hold (the demo plays during the hold) */
  record?: { time: number; hold: number };
}) {
  const [size, setSize] = useState<string | null>(null);
  const [width, setWidth] = useState(widths[0]);
  const [added, setAdded] = useState(false);
  const [tap, setTap] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const stage = useRef<HTMLDivElement>(null);
  const touched = useRef(false);
  const add = useRef(onAdd);
  add.current = onAdd;

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const press = (key: string, fn: () => void) => {
    setTap(`${key}-${Date.now()}`);
    fn();
  };

  /** the hands-free demo, spread over `total` seconds */
  const play = (total: number) => {
    clear();
    setSize(null);
    setWidth(widths[0]);
    setAdded(false);
    const at = (f: number, fn: () => void) => timers.current.push(setTimeout(fn, total * 1000 * f));
    if (demo.first) at(0.08, () => press(`size-${demo.first}`, () => setSize(demo.first!)));
    at(0.3, () => press(`size-${demo.size}`, () => setSize(demo.size)));
    if (demo.width) at(0.52, () => press(`width-${demo.width}`, () => setWidth(demo.width!)));
    at(0.74, () =>
      press("add", () => {
        setAdded(true);
        add.current();
      }),
    );
  };

  useEffect(() => {
    const el = stage.current!;
    const recording = new URLSearchParams(window.location.search).has("record");
    const onHold = (e: Event) => play((e as CustomEvent<{ duration: number }>).detail.duration);
    el.addEventListener("record:hold", onHold);
    let io: IntersectionObserver | undefined;
    if (!recording && !prefersReducedMotion()) {
      io = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting && !touched.current) play(demoSeconds);
          if (!e.isIntersecting) clear();
        },
        { threshold: 0.55 },
      );
      io.observe(el);
    }
    return () => {
      el.removeEventListener("record:hold", onHold);
      io?.disconnect();
      clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const user = (fn: () => void) => {
    touched.current = true;
    clear();
    fn();
  };

  const left = size ? low[size] : undefined;
  const ring = (key: string) => (tap?.startsWith(`${key}-`) ? <span key={tap} className="sp-tap" aria-hidden /> : null);

  return (
    <section id={id} className="section-y relative z-[1]">
      <style>{css}</style>
      <div ref={stage} className="container-x relative">
        {record && <div aria-hidden data-record-label={`${eyebrow} (demo)`} data-record-time={record.time} data-record-hold={record.hold} data-record-align="center" className="pointer-events-none absolute inset-0" />}

        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          {/* the product on a sizing pad */}
          <div className="relative aspect-[4/3] w-full border border-line bg-surface" style={{ clipPath: "polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 22px 100%, 0 calc(100% - 22px))" }}>
            <div aria-hidden className="absolute inset-x-6 bottom-6 flex items-end justify-between">
              {Array.from({ length: 41 }, (_, k) => (
                <span key={k} className={`w-px ${k % 5 === 0 ? "h-4 bg-fg/50" : "h-2 bg-fg/25"}`} />
              ))}
            </div>
            {measure && (
              <p aria-hidden className="absolute top-5 left-6 text-[12px] font-semibold tracking-[0.16em] text-muted uppercase tabular-nums">
                {measure.label ?? "Foot length"} ·{" "}
                <span className="text-fg">{size ? `${(measure.base + (Number(size) - measure.from) * measure.step).toFixed(1)} ${measure.unit ?? "cm"}` : "—"}</span>
              </p>
            )}
            <p aria-hidden className="font-display absolute top-2 right-5 text-[clamp(90px,10vw,170px)] leading-none text-transparent" style={{ WebkitTextStroke: "1.5px color-mix(in srgb, var(--accent) 40%, transparent)" }}>
              {size ?? "—"}
            </p>
            <img src={image} alt={model} className="absolute inset-x-[4%] top-[18%] w-[92%] -rotate-[4deg] object-contain md:drop-shadow-[0_36px_30px_rgba(0,0,0,.6)]" />
          </div>

          {/* the picker */}
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2 className="font-display mt-4 text-[clamp(52px,6vw,108px)]">
              <span className="block">{heading[0]}</span>
              <span className="block text-accent">{heading[1]}</span>
            </h2>
            <p className="mt-5 text-[14px] font-semibold tracking-[0.1em] text-muted uppercase">{model}</p>

            <p className="mt-8 text-[12px] font-semibold tracking-[0.16em] text-muted uppercase">{sizeLabel}</p>
            <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-7 lg:grid-cols-5 xl:grid-cols-7">
              {sizes.map((s) => (
                <button
                  key={s}
                  disabled={soldOut.includes(s)}
                  onClick={() => user(() => setSize(s))}
                  aria-pressed={size === s}
                  className={`sp-btn h-12 text-[15px] font-semibold tabular-nums ${size === s ? "is-on" : ""}`}
                >
                  {s}
                  {ring(`size-${s}`)}
                </button>
              ))}
            </div>

            {widths.length > 1 && (
              <div className="mt-6 flex items-center gap-4">
                <span className="w-16 text-[12px] font-semibold tracking-[0.16em] text-muted uppercase">Width</span>
                <div className="flex gap-2">
                  {widths.map((w) => (
                    <button key={w} onClick={() => user(() => setWidth(w))} aria-pressed={width === w} className={`sp-btn h-11 px-5 text-[13px] font-semibold tracking-[0.08em] uppercase ${width === w ? "is-on" : ""}`}>
                      {w}
                      {ring(`width-${w}`)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="mt-6 flex min-h-6 items-center gap-2 text-[14px] font-semibold">
              {left ? (
                <>
                  <span className="sp-dot h-2 w-2 rounded-full bg-accent" />
                  Only <span className="tabular-nums">{left}</span> left in {sizeUnit ? `${sizeUnit} ${size}` : size}
                </>
              ) : size ? (
                <span className="text-muted">In stock · ships in 24 hours</span>
              ) : (
                <span className="text-muted">Pick a size to see stock</span>
              )}
            </p>

            <button
              onClick={() =>
                user(() => {
                  setAdded(true);
                  add.current();
                })
              }
              className="btn btn-solid relative mt-6 w-full justify-center !py-5 text-[14px]"
            >
              {added ? "Added to bag ✓" : `Add to bag · ${price}`}
              {ring("add")}
            </button>
          </div>
        </div>

        {perks.length > 0 && (
          <ul className="mt-16 grid gap-px border-y border-line bg-line sm:grid-cols-3 lg:mt-20">
            {perks.map((p) => (
              <li key={p.title} className="bg-bg px-2 py-6 sm:px-6">
                <p className="text-[15px] font-bold">{p.title}</p>
                <p className="text-[13px] text-muted">{p.text}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
