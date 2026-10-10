"use client";

// PS · Product-showcase layouts, batch 5 (PS19–PS20). Each is a full designed section; motion via useSectionMotion plus
// a hands-free auto-cycle (what a click would do) so it never freezes on camera. ?static=1 shows the final state.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Price, Sec } from "./kit";
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

/* ───────────────────────── PS19 · Material swatch library ───────────────────────── */

type Mat = "Fabric" | "Wood" | "Leather";
const fabric = (a: string, b: string) => `repeating-linear-gradient(45deg,${a} 0 4px,${b} 4px 8px),repeating-linear-gradient(-45deg,${a} 0 4px,${b} 4px 8px)`;
const wood = (a: string, b: string, c: string) => `repeating-linear-gradient(96deg,${a} 0 9px,${b} 9px 12px,${a} 12px 22px,${c} 22px 25px,${a} 25px 38px)`;
const leather = (a: string, b: string) => `radial-gradient(circle at 30% 28%,rgba(255,255,255,.22),transparent 55%),radial-gradient(${b} 1.4px,transparent 2px) 0 0/7px 7px,${a}`;

const PS19_SW: { n: Mat; t: string; bg: string; care: string[]; price: string; unit: string }[] = [
  { n: "Fabric", t: "Oat bouclé", bg: fabric("#d9cdb6", "#c8b99c"), care: ["Vacuum weekly on low", "Blot spills, never rub", "Dry-clean the covers"], price: "₹2,400", unit: "a metre" },
  { n: "Wood", t: "Smoked teak", bg: wood("#5b3a22", "#4a2e1a", "#6e4a2e"), care: ["Oil twice a year", "Keep out of direct sun", "Wipe with a dry cloth"], price: "₹9,800", unit: "a sq ft" },
  { n: "Leather", t: "Cognac aniline", bg: leather("#9a5a2e", "rgba(60,30,10,.35)"), care: ["Condition every 6 months", "Patina is welcome", "Keep 50 cm from heat"], price: "₹6,900", unit: "a hide panel" },
  { n: "Fabric", t: "Indigo khadi", bg: fabric("#2e3f63", "#24324f"), care: ["Hand-wash cold", "Fades softly, as it should", "Dry in the shade"], price: "₹1,850", unit: "a metre" },
  { n: "Wood", t: "Pale mango", bg: wood("#d8b98c", "#c9a777", "#e2c69c"), care: ["Wax every season", "Coasters for hot cups", "Wipe with a damp cloth"], price: "₹5,200", unit: "a sq ft" },
  { n: "Leather", t: "Ink nubuck", bg: leather("#26303a", "rgba(255,255,255,.12)"), care: ["Brush with a suede brush", "Spray-proof once a year", "Avoid water spots"], price: "₹7,400", unit: "a hide panel" },
  { n: "Fabric", t: "Rust linen", bg: fabric("#b5502a", "#a24622"), care: ["Machine-wash covers at 30°", "Iron while damp", "Softens with every wash"], price: "₹2,100", unit: "a metre" },
  { n: "Wood", t: "Black walnut", bg: wood("#3a2a20", "#2c1f17", "#4a3628"), care: ["Oil once a year", "Rotate pieces in the sun", "Never use silicone sprays"], price: "₹12,400", unit: "a sq ft" },
  { n: "Leather", t: "Sand saddle", bg: leather("#c9a46a", "rgba(80,50,20,.25)"), care: ["Darkens with use", "Condition twice a year", "Blot, then air-dry"], price: "₹6,200", unit: "a hide panel" },
  { n: "Fabric", t: "Moss velvet", bg: fabric("#4f6b3f", "#445e36"), care: ["Brush along the pile", "Steam, never iron", "Professional clean only"], price: "₹2,900", unit: "a metre" },
  { n: "Wood", t: "Whitewashed oak", bg: wood("#e6dccb", "#d6c9b3", "#efe6d6"), care: ["Soap finish, wash gently", "Re-soap once a year", "Wipe spills quickly"], price: "₹8,600", unit: "a sq ft" },
  { n: "Leather", t: "Oxblood calf", bg: leather("#5e1f24", "rgba(255,255,255,.1)"), care: ["Condition every 6 months", "Keep from window light", "Buff with a soft cloth"], price: "₹7,900", unit: "a hide panel" },
];

const PS19_CSS = `
.ps19-pan{animation:ps19-pan 3.2s linear infinite alternate}
@keyframes ps19-pan{from{translate:-7% -3%;scale:1}to{translate:7% 3%;scale:1.08}}
.ps19-sheen{animation:ps19-sheen 2.6s linear infinite}
@keyframes ps19-sheen{from{transform:translateX(-120%) skewX(-14deg)}to{transform:translateX(330%) skewX(-14deg)}}
html.is-static .ps19-pan,html.is-static .ps19-sheen{animation:none}
html.is-static .ps19-sheen{opacity:0}
html.is-static {.ps19-pan,.ps19-sheen{animation:none}.ps19-sheen{opacity:0}}
`;

/** PS19 · A material library: filter chips by material type above a 6-column grid of square swatches (fabric, wood,
 *  leather) with names; one swatch opens large beside the grid with care notes and a price. Tiles snap in (M34); the
 *  selection walks through the library by itself and the chips follow (a click picks one). */
function PS19() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  const [sel, setSel] = useState(2);
  const [filter, setFilter] = useState<Mat | null>(null);
  useOnScreenInterval(r, 1800, () => setSel((v) => (v + 1) % PS19_SW.length));
  const s = PS19_SW[sel];
  const activeChip = filter ?? s.n;
  return (
    <Sec innerRef={r} theme="stone" font="editorial" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#8a4b2a", ["--sx-accent-text" as string]: "#f7f8f9" }}>
      <style>{PS19_CSS}</style>
      <div className="flex flex-wrap items-end justify-between gap-8">
        <div>
          <H className="max-w-[16ch] text-[clamp(40px,4.8vw,80px)] font-[500]">Choose what you&apos;ll touch every day.</H>
          <P className="mt-5 max-w-[48ch]">Every sofa, chair and table in our Jodhpur workshop comes in these twelve materials. Free samples, posted in two days.</P>
        </div>
        <div className="flex flex-wrap gap-2" role="tablist">
          {(["All", "Fabric", "Wood", "Leather"] as const).map((c) => {
            const on = c === "All" ? false : c === activeChip;
            return (
              <button
                key={c}
                role="tab"
                aria-selected={on}
                onClick={() => setFilter(c === "All" ? null : c)}
                className={`rounded-full border px-5 py-2.5 text-[14px] font-[600] transition-colors duration-500 ${on ? "border-[var(--sx-text)] bg-[var(--sx-text)] text-[var(--sx-bg)]" : "border-[var(--sx-line)] text-[var(--sx-muted)]"}`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-[clamp(40px,5vw,64px)] grid grid-cols-1 gap-[clamp(24px,3vw,48px)] md:grid-cols-12">
        <div className="grid grid-cols-3 gap-[clamp(10px,1.2vw,16px)] md:col-span-8 md:grid-cols-6">
          {PS19_SW.map((w, k) => {
            const on = k === sel;
            const dim = filter && w.n !== filter;
            return (
              <button key={w.t} data-m-card onClick={() => setSel(k)} className={`text-left transition-opacity duration-500 ${dim ? "opacity-30" : ""}`}>
                <span
                  className={`block aspect-square rounded-[14px] transition-[box-shadow,scale] duration-500 ${on ? "scale-[1.04] shadow-[0_0_0_3px_var(--sx-bg),0_0_0_5px_var(--sx-accent)]" : "shadow-[inset_0_0_0_1px_rgba(0,0,0,.08)]"}`}
                  style={{ background: w.bg }}
                />
                <span className={`mt-2 block text-[13px] leading-tight ${on ? "font-[650]" : "text-[var(--sx-muted)]"}`}>{w.t}</span>
                <span className="block text-[12px] text-[var(--sx-muted)]">{w.n}</span>
              </button>
            );
          })}
        </div>
        <aside data-m-card className="sx-card overflow-hidden md:col-span-4">
          <div className="relative aspect-[4/3] overflow-hidden">
            <div key={sel} className="ps19-pan absolute inset-[-14%]" style={{ background: s.bg }} />
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="ps19-sheen absolute inset-y-0 left-0 w-[34%] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.28),transparent)]" />
            </div>
            <span className="absolute left-4 top-4 rounded-full bg-black/40 px-3.5 py-1.5 text-[12px] uppercase tracking-[0.14em] text-white backdrop-blur-md">{s.n}</span>
          </div>
          <div className="p-[clamp(20px,2vw,28px)]">
            <p className="sx-display text-[clamp(26px,2.2vw,34px)] leading-tight">{s.t}</p>
            <p className="mt-2 text-[15px]">
              <Price now={s.price} /> <span className="text-[var(--sx-muted)]">{s.unit}</span>
            </p>
            <ul className="mt-5 space-y-2 border-t border-[var(--sx-line)] pt-4 text-[15px] text-[var(--sx-muted)]">
              {s.care.map((c) => (
                <li key={c} className="flex gap-3">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--sx-accent)]" />
                  {c}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Btn>Order a free sample</Btn>
            </div>
          </div>
        </aside>
      </div>
    </Sec>
  );
}

/* ───────────────────────── PS20 · Size guide table ───────────────────────── */

const PS20_CSS = `
.ps20-tape{animation:ps20-tape 1.6s linear infinite}
@keyframes ps20-tape{to{stroke-dashoffset:-28}}
html.is-static .ps20-tape{animation:none}
html.is-static {.ps20-tape{animation:none}}
`;

const PS20_COLS = ["Chest", "Waist", "Hips", "Length"] as const;
const PS20_ROWS: [string, number[]][] = [
  ["XS", [84, 66, 90, 68]],
  ["S", [89, 71, 95, 70]],
  ["M", [94, 76, 100, 72]],
  ["L", [100, 82, 106, 74]],
  ["XL", [106, 88, 112, 76]],
];

/** PS20 · Size guide: a titled table of sizes (XS–XL) by measurement (chest, waist, hips, length) with a cm/in toggle
 *  above, and a narrow right column with a "how to measure" drawing and the model note. Lines slide up from their masks
 *  (M23); the unit toggle flips by itself and the measurement in focus walks across the columns and the drawing. */
function PS20() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const [inch, setInch] = useState(false);
  const [col, setCol] = useState(0);
  useOnScreenInterval(r, 2400, () => setInch((v) => !v));
  useOnScreenInterval(r, 1200, () => setCol((v) => (v + 1) % PS20_COLS.length));
  const fmt = (cm: number) => (inch ? (cm / 2.54).toFixed(1) : String(cm));
  // measuring lines on the drawing: [x1,y1,x2,y2] per column
  const lines: [number, number, number, number][] = [
    [62, 92, 178, 92],
    [72, 150, 168, 150],
    [64, 196, 176, 196],
    [196, 52, 196, 262],
  ];
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#9a5b3a" }}>
      <style>{PS20_CSS}</style>
      <div className="grid grid-cols-1 gap-[clamp(32px,4vw,64px)] md:grid-cols-12">
        <div className="md:col-span-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <H className="text-[clamp(40px,4.6vw,76px)] font-[500]">Find your linen fit.</H>
              <P className="mt-4 max-w-[46ch]">The Ganga wrap dress, cut relaxed through the body. Between sizes? Take the smaller one; washed linen gives.</P>
            </div>
            <div className="inline-grid grid-cols-2 rounded-full border border-[var(--sx-line)] p-1" role="tablist" aria-label="Units">
              {["cm", "in"].map((u, k) => {
                const on = (k === 1) === inch;
                return (
                  <button key={u} role="tab" aria-selected={on} onClick={() => setInch(k === 1)} className={`rounded-full px-6 py-2.5 text-[14px] font-[650] transition-colors duration-500 ${on ? "bg-[var(--sx-text)] text-[var(--sx-bg)]" : "text-[var(--sx-muted)]"}`}>
                    {u}
                  </button>
                );
              })}
            </div>
          </div>
          <div data-m-card className="mt-[clamp(28px,3vw,44px)] overflow-hidden rounded-[var(--sx-radius)] border border-[var(--sx-line)]">
            <table className="w-full border-collapse text-left tabular-nums">
              <thead>
                <tr className="bg-[var(--sx-surface)]">
                  <th className="px-[clamp(14px,2vw,28px)] py-4 text-[13px] font-[600] uppercase tracking-[0.14em] text-[var(--sx-muted)]">Size</th>
                  {PS20_COLS.map((c, k) => (
                    <th key={c} className={`px-[clamp(14px,2vw,28px)] py-4 text-[13px] font-[600] uppercase tracking-[0.14em] transition-colors duration-500 ${k === col ? "text-[var(--sx-accent)]" : "text-[var(--sx-muted)]"}`}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PS20_ROWS.map(([s, v]) => (
                  <tr key={s} className={`border-t border-[var(--sx-line)] ${s === "M" ? "bg-[color-mix(in_srgb,var(--sx-accent)_7%,transparent)]" : ""}`}>
                    <td className="px-[clamp(14px,2vw,28px)] py-[clamp(14px,1.4vw,20px)] text-[clamp(18px,1.5vw,22px)] font-[700]">
                      {s}
                      {s === "M" && <span className="ml-3 text-[12px] font-[600] uppercase tracking-[0.12em] text-[var(--sx-accent)]">Most chosen</span>}
                    </td>
                    {v.map((n, k) => (
                      <td key={k} className={`px-[clamp(14px,2vw,28px)] py-[clamp(14px,1.4vw,20px)] text-[clamp(17px,1.4vw,21px)] transition-colors duration-500 ${k === col ? "bg-[color-mix(in_srgb,var(--sx-accent)_14%,transparent)] font-[650]" : ""}`}>
                        {fmt(n)}
                        <span className="ml-1 text-[13px] text-[var(--sx-muted)]">{inch ? "in" : "cm"}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <aside data-m-card className="sx-card flex flex-col p-[clamp(20px,2vw,30px)] md:col-span-4 md:ml-[8%]">
          <p className="text-[15px] font-[650]">How to measure</p>
          <svg viewBox="0 0 240 290" className="mx-auto mt-4 h-auto w-full max-w-[260px]" aria-hidden>
            <path d="M88 30 L120 44 L152 30 L196 52 L182 96 L170 92 L168 150 L182 262 L58 262 L72 150 L70 92 L58 96 L44 52 Z" fill="none" stroke="var(--sx-text)" strokeOpacity=".45" strokeWidth="2" strokeLinejoin="round" />
            {lines.map(([x1, y1, x2, y2], k) => (
              <g key={k}>
                <line
                  className={k === col ? "ps20-tape" : ""}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={k === col ? "var(--sx-accent)" : "var(--sx-muted)"}
                  strokeOpacity={k === col ? 1 : 0.4}
                  strokeWidth={k === col ? 5 : 2}
                  strokeDasharray="10 4"
                  strokeLinecap="round"
                />
                <circle cx={x1} cy={y1} r={k === col ? 5 : 3} fill={k === col ? "var(--sx-accent)" : "var(--sx-muted)"} />
                <circle cx={x2} cy={y2} r={k === col ? 5 : 3} fill={k === col ? "var(--sx-accent)" : "var(--sx-muted)"} />
              </g>
            ))}
          </svg>
          <p className="mt-4 text-[15px]">
            <b className="font-[650] text-[var(--sx-accent)]">{PS20_COLS[col]}:</b>{" "}
            <span className="text-[var(--sx-muted)]">
              {["around the fullest part, tape level", "at the narrowest point, relaxed", "around the widest part of the seat", "from the shoulder seam to the hem"][col]}
            </span>
          </p>
          <div className="mt-auto border-t border-[var(--sx-line)] pt-4">
            <p className="mt-4 text-[14px] leading-relaxed text-[var(--sx-muted)]">Our model Kavya is 5′7″ (170 cm) and wears size S.</p>
            <p className="mt-3 text-[14px]">
              Ganga wrap dress · <Price now="₹4,290" />
            </p>
          </div>
        </aside>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "PS19", name: "Material swatch library", motion: "M34", C: PS19 },
  { code: "PS20", name: "Size guide table", motion: "M23", C: PS20 },
];
