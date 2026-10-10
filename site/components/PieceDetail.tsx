"use client";
// PS04 restyled as C's stage (C · product-1 clip + product-4 + product-3): name + total on top, the piece large in the
// centre on a soft gold band, spec row under it, a sticky price drawer on the right with 22K/18K chips, itemised rows,
// a faceless try-on view (A9) and Add to bag. Thumbnail rail = A7 + A7a–c.
// 22K/18K crossfades the pixel-aligned A7 / A8 cut-outs. M165 loupe follows the pointer (the record cursor too) and
// reads the sharp A7a macro wherever its frame covers the piece, A7 elsewhere.
// Add to bag: the piece arcs into the fixed Bag pill (BagPill) and its count bumps. Round 4: the five numbers roll.
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { flyToBag } from "./BagPill";
import Roll from "./Roll";
import { useMagnetic } from "./useMagnetic";
import { product, priceOf, inr, SAMPLE_NOTE, type Karat } from "../content";

const LOUPE = 170;
const ZOOM = 2.0;
const W = 680; // stage box
const D = 540; // the square image inside it (object-contain): x offset (W - D) / 2
const OX = (W - D) / 2;

export default function PieceDetail() {
  const [karat, setKarat] = useState<Karat>("22K");
  const [view, setView] = useState(0);
  const [bag, setBag] = useState(0);
  const [loupe, setLoupe] = useState<{ x: number; y: number }>({
    x: OX + D * 0.47,
    y: D * 0.775,
  }); // parked on the pendant
  const stage = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLElement>(null);
  const bagBtn = useRef<HTMLButtonElement>(null);
  useMagnetic(bagBtn);
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pill, setPill] = useState({ x: 0, w: 0 });
  useEffect(() => {
    const c = chipRefs.current[karat];
    if (c) setPill({ x: c.offsetLeft, w: c.offsetWidth });
  }, [karat]);
  useEffect(() => {
    const v = root.current?.querySelector<HTMLElement>("[data-vignette]");
    if (!v || prefersReducedMotion()) return;
    const tw = gsap.fromTo(
      v,
      { "--r": "140px" },
      {
        "--r": "1600px",
        ease: "power1.in",
        scrollTrigger: {
          trigger: root.current,
          start: "top 85%",
          end: "top top",
          scrub: true,
        },
      },
    );
    return () => {
      tw.scrollTrigger?.kill();
      tw.kill();
    };
  }, []);
  const p = priceOf(product.grams[karat], karat);
  const v = product.views[view];

  const move = (e: React.PointerEvent) => {
    const r = stage.current!.getBoundingClientRect();
    setLoupe({ x: e.clientX - r.left, y: e.clientY - r.top });
  };

  // what the loupe shows at (x, y): the A7a macro inside its frame, the A7 / A8 cut-out elsewhere
  const u = (loupe.x - OX) / D;
  const w = loupe.y / D;
  const f = product.loupeFrame;
  const inMacro =
    u > f.left + 0.03 &&
    u < f.left + f.size - 0.03 &&
    w > f.top + 0.03 &&
    w < f.top + f.size - 0.03;
  const src = inMacro ? product.loupe[karat] : product.cut[karat];
  const size = inMacro ? D * ZOOM * f.size : D * ZOOM; // the macro covers f.size of the piece
  const fu = inMacro ? (u - f.left) / f.size : u;
  const fw = inMacro ? (w - f.top) / f.size : w;

  return (
    <section
      id="piece"
      className="relative h-screen min-h-[900px] overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #ecd9b0 0%, #f4e9d5 52%, var(--ivory) 74%)",
      }}
      data-section="product"
      ref={root}
    >
      {/* X15 vignette spotlight: the page darkens round the piece as it arrives, then the light opens out */}
      <div
        className="pointer-events-none absolute inset-0 z-[15]"
        style={{
          ["--r" as string]: "1600px",
          background:
            "radial-gradient(circle at 540px 500px, transparent var(--r), rgba(30, 22, 14, 0.62) calc(var(--r) + 260px))",
        }}
        data-vignette
        aria-hidden
      />
      {/* record stops: loupe (1.0) · 18K chip (1.2) · Add to bag (1.2); the page creeps between them (holds ≤ 1.2 s, lesson 74) */}
      <div
        className="absolute left-0 top-0 h-px w-px"
        data-record-time="0.8"
        data-record-hold="0.9"
        data-record-label="Product · loupe"
      />
      <div
        className="absolute left-0 top-[8px] h-px w-px"
        data-record-time="0.4"
        data-record-hold="1.0"
        data-record-label="Product · 18K"
      />
      <div
        className="absolute left-0 top-[16px] h-px w-px"
        data-record-time="0.4"
        data-record-hold="1.2"
        data-record-label="Product · bag"
      />
      <div
        className="absolute left-0 top-[24px] h-px w-px"
        data-record-time="0.4"
        data-record-hold="1.3"
        data-record-label="Product · bag 2"
      />
      <div
        className="kj-band twin"
        style={{
          ["--band" as string]: "rgba(206, 156, 72, 0.4)",
          ["--band-blend" as string]: "multiply",
          ["--band-dur" as string]: "3.4s",
        }}
        aria-hidden
      />
      {/* thumbnail rail (A · product-4): A7 + A7a–c */}
      <div className="absolute left-12 top-1/2 z-10 grid -translate-y-1/2 gap-3">
        {product.views.map((t, k) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setView(k)}
            className="h-[84px] w-[84px] overflow-hidden rounded-xl bg-[var(--paper)] transition-shadow"
            style={{
              boxShadow:
                k === view
                  ? "0 0 0 2px var(--gold)"
                  : "0 0 0 1px var(--kj-line)",
            }}
            aria-label={t.label}
          >
            <img src={t.thumb} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      <div className="absolute left-[180px] top-[86px] z-10">
        <div className="kj-eyebrow">Bridal · {product.index}</div>
        <h2
          className="kj-display mt-3 text-[64px] leading-none"
          data-piece-title
        >
          {product.name}
        </h2>
        <div className="kj-display mt-1 text-[28px] italic text-[var(--muted)]">
          {product.kind}
        </div>
      </div>
      <div
        className="absolute right-[540px] top-[92px] z-10 text-right"
        data-piece-price
      >
        <div className="kj-num text-[36px] font-semibold">
          <Roll value={p.total} format={(v) => inr(Math.round(v))} />
        </div>
        <div className="text-[14px] text-[var(--muted)]">
          Total · {karat} · {SAMPLE_NOTE}
        </div>
      </div>

      {/* the stage */}
      {v.image === null ? (
        <div
          ref={stage}
          className="absolute left-[200px] top-[236px] h-[540px] w-[680px]"
          onPointerMove={move}
          onPointerLeave={() => setLoupe({ x: OX + D * 0.47, y: D * 0.775 })}
          data-hover-demo=""
          data-hover-at="0.476,0.775"
          data-hover-hold="1.0"
          data-hover-label="Loupe"
          data-cursor="Zoom"
        >
          {(["22K", "18K"] as Karat[]).map((k) => (
            <img
              key={k}
              src={product.cut[k]}
              alt={k === karat ? `${product.name} in ${k} gold` : ""}
              className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_30px_36px_rgba(90,60,20,.22)] transition-opacity duration-700"
              style={{ opacity: k === karat ? 1 : 0 }}
              data-karat-image={k}
            />
          ))}
          <div
            className="pointer-events-none absolute rounded-full border-[3px] border-white shadow-[0_20px_40px_rgba(60,40,10,.25)]"
            style={{
              width: LOUPE,
              height: LOUPE,
              left: loupe.x - LOUPE / 2,
              top: loupe.y - LOUPE / 2,
              backgroundColor: "#f3e7cf",
              backgroundImage: `url(${src})`,
              backgroundRepeat: "no-repeat",
              backgroundSize: `${size}px ${size}px`,
              backgroundPosition: `${-fu * size + LOUPE / 2}px ${-fw * size + LOUPE / 2}px`,
            }}
            data-loupe
          />
        </div>
      ) : (
        <div className="absolute left-[270px] top-[236px] h-[540px] w-[540px] overflow-hidden rounded-[24px] shadow-[0_30px_60px_rgba(90,60,20,.18)]">
          <img
            src={v.image}
            alt={v.label}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="absolute bottom-[56px] left-[200px] z-10 grid w-[680px] grid-cols-4 border-t border-[rgba(43,33,23,.16)] pt-5">
        {[
          ["Purity", karat === "22K" ? "22K · 916" : "18K · 750"],
          [
            "Weight",
            <Roll
              key="w"
              value={p.grams}
              format={(v) => `${v.toFixed(1)} g`}
            />,
          ],
          [
            "Making",
            <Roll
              key="m"
              value={p.making}
              format={(v) => inr(Math.round(v))}
            />,
          ],
          [
            "Full details",
            <a key="d" href="#piece" className="kj-link">
              →
            </a>,
          ],
        ].map(([k, val]) => (
          <div key={k as string}>
            <div className="text-[13px] text-[var(--muted)]">{k}</div>
            <div className="kj-num mt-1 text-[24px] font-semibold">{val}</div>
          </div>
        ))}
      </div>

      {/* the sticky price drawer */}
      <aside
        className="kj-card absolute right-16 top-[130px] z-10 w-[440px] px-8 py-7"
        data-drawer
      >
        <div className="kj-eyebrow">Price, itemised</div>
        <div className="relative mt-4 flex gap-2.5" data-chips>
          {/* the filled pill slides under the chosen chip */}
          <span
            className="absolute top-0 h-full rounded-full bg-[var(--ink)] transition-[translate,width] duration-500 ease-[cubic-bezier(.65,0,.35,1)]"
            style={{
              width: pill.w,
              translate: `${pill.x}px 0`,
              opacity: pill.w ? 1 : 0,
            }}
            aria-hidden
          />
          {(["22K", "18K"] as Karat[]).map((k) => (
            <button
              key={k}
              type="button"
              ref={(n) => {
                chipRefs.current[k] = n;
              }}
              className="kj-chip kj-chip-slide relative"
              aria-pressed={karat === k}
              onClick={() => setKarat(k)}
              {...(k === "18K"
                ? {
                    "data-hover-demo": "click",
                    "data-hover-hold": "1.0",
                    "data-hover-at": "0.86,0.7",
                    "data-hover-label": "18K chip",
                  }
                : {})}
            >
              {k} · {k === "22K" ? "916" : "750"}
            </button>
          ))}
        </div>
        <dl className="mt-4 text-[15px]">
          {[
            ["Weight", p.grams, (v: number) => `${v.toFixed(2)} g`],
            [
              `Gold rate (${karat}) · sample`,
              p.rate,
              (v: number) => `${inr(Math.round(v))}/g`,
            ],
            ["Gold value", p.gold, (v: number) => inr(Math.round(v))],
            ["Making (12%)", p.making, (v: number) => inr(Math.round(v))],
            ["GST (3%)", p.gst, (v: number) => inr(Math.round(v))],
          ]
            .map((row) => row as [string, number, (v: number) => string])
            .map(([k, val, f], n) => (
              <div
                key={n}
                className="flex justify-between border-b border-dashed border-[var(--kj-line)] py-2.5"
              >
                <dt>{k}</dt>
                <dd className="kj-num" data-price-row>
                  <Roll value={val} format={f} />
                </dd>
              </div>
            ))}
          <div className="flex justify-between pt-3.5 text-[22px] font-semibold">
            <dt>Total</dt>
            <dd className="kj-num" data-price-row>
              <Roll value={p.total} format={(v) => inr(Math.round(v))} />
            </dd>
          </div>
        </dl>
        <div className="mt-4 flex items-center gap-4 rounded-2xl bg-[#f5efe6] p-3">
          <div className="relative h-[96px] w-[124px] shrink-0 overflow-hidden rounded-xl bg-[#e9ddcb]">
            <img
              src={product.tryon}
              alt="The necklace on a plain display bust"
              className="h-full w-full object-cover object-[50%_42%]"
            />
          </div>
          <div className="text-[14px]">
            <b>Try-on view</b>
            <div className="text-[var(--muted)]">
              On a plain bust, true to scale. No faces.
            </div>
          </div>
        </div>
        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            ref={bagBtn}
            className="kj-btn flex-1"
            onClick={() => {
              // the piece arcs into the Bag; the count bumps as it lands
              // route: up through the gap between the name and the price, along the top edge above both, into the
              // Bag pill (never across the price card or a heading: lesson 99)
              const sr = stage.current!.getBoundingClientRect();
              const tr = root
                .current!.querySelector("[data-piece-title]")!
                .getBoundingClientRect();
              const pr = root
                .current!.querySelector("[data-piece-price]")!
                .getBoundingClientRect();
              const gx = (tr.right + pr.left) / 2;
              const top = Math.max(18, Math.min(tr.top, pr.top) - 36);
              const start = { x: sr.left + OX + D * 0.5, y: sr.top + D * 0.78 };
              const via = [
                { x: gx - 10, y: sr.top + D * 0.3 },
                { x: gx, y: top + 6 },
                { x: pr.right + 40, y: top },
              ];
              flyToBag(start, via, product.cut[karat], () => {
                const n = bag + 1;
                setBag(n);
                window.dispatchEvent(new CustomEvent("kj:add"));
              });
            }}
            data-hover-demo="click"
            data-hover-hold="1.5"
            data-hover-at="0.88,0.62"
            data-hover-label="Add to bag"
          >
            Add to bag {bag ? `· ${bag}` : ""}
          </button>
          <button type="button" className="kj-btn ghost px-5" aria-label="Save">
            ♡
          </button>
        </div>
        <p className="mt-3 text-[12px] text-[var(--muted)]">
          {SAMPLE_NOTE}. Gold, making and GST shown line by line.
        </p>
      </aside>
    </section>
  );
}
