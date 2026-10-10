"use client";

// Shared building blocks for the SECTION-MENU layouts (docs/SECTION-MENU.md, demo: /lab/sections).
// Every layout is a full designed section built from these, so they share one premium standard:
//   <Sec theme>      the section shell (3 themes: ink = dark, paper = warm light, stone = cool light), generous padding
//   <Btn>            pill buttons (solid / ghost / link), <Pic> photo placeholders, <Product> transparent product art,
//   <Price>, <Stars>, <Avatar> (initials, fake people only), <Logos> (fake wordmarks), <Kicker> (small label; use rarely)
// Placeholders (never a day's real images) so the gallery never breaks. A site copies a layout into site/components/
// and swaps in its own content, fonts and colours (theme variables).
import type { CSSProperties, ReactNode } from "react";
import { scene } from "../fx/shared";
import { productAngle } from "../fx/travel/art";

export type Theme = "ink" | "paper" | "stone";
const THEMES: Record<Theme, CSSProperties> = {
  ink: { ["--sx-bg" as string]: "#07090f", ["--sx-surface" as string]: "#10141d", ["--sx-text" as string]: "#eef2f7", ["--sx-muted" as string]: "#93a0b1", ["--sx-line" as string]: "rgba(255,255,255,.1)", ["--sx-accent" as string]: "#4f8dff", ["--sx-accent-text" as string]: "#05070c" },
  paper: { ["--sx-bg" as string]: "#f4efe6", ["--sx-surface" as string]: "#fbf8f2", ["--sx-text" as string]: "#1c1813", ["--sx-muted" as string]: "#6d6457", ["--sx-line" as string]: "rgba(28,24,19,.12)", ["--sx-accent" as string]: "#b5502a", ["--sx-accent-text" as string]: "#fbf8f2" },
  stone: { ["--sx-bg" as string]: "#e9ecef", ["--sx-surface" as string]: "#f7f8f9", ["--sx-text" as string]: "#111418", ["--sx-muted" as string]: "#5b6470", ["--sx-line" as string]: "rgba(17,20,24,.12)", ["--sx-accent" as string]: "#1f5f4a", ["--sx-accent-text" as string]: "#f7f8f9" },
};

/** Section shell: theme variables + background + padding. `full` = edge-to-edge (no side padding). */
export type DisplayFont = "condensed" | "serif" | "editorial" | "grotesk" | "wide";
export function Sec({ theme = "ink", font = "grotesk", full = false, className = "", style, children, innerRef }: { theme?: Theme; font?: DisplayFont; full?: boolean; className?: string; style?: CSSProperties; children: ReactNode; innerRef?: React.Ref<HTMLDivElement> }) {
  return (
    <div ref={innerRef} className={`sx sx-f-${font} relative overflow-hidden ${full ? "" : "px-[clamp(20px,5vw,96px)]"} ${className}`} style={{ ...THEMES[theme], ...style }}>
      {children}
    </div>
  );
}

/** Pill button. kind: solid (accent fill) · ghost (outline) · link (text + arrow line) */
export function Btn({ children, kind = "solid", className = "" }: { children: ReactNode; kind?: "solid" | "ghost" | "link"; className?: string }) {
  const k = kind === "solid" ? "sx-btn sx-btn-solid" : kind === "ghost" ? "sx-btn sx-btn-ghost" : "sx-btn-link";
  return (
    <a href="#" onClick={(e) => e.preventDefault()} className={`${k} ${className}`}>
      {children}
    </a>
  );
}

/** Photo placeholder (a moody product scene). `i` picks the palette, `ratio` the aspect, `label` an optional caption. */
export function Pic({ i = 0, ratio = "4/5", className = "", label = "", round = true }: { i?: number; ratio?: string; className?: string; label?: string; round?: boolean }) {
  return (
    // "relative" only when the caller doesn't position it (relative + absolute in one class list: relative wins)
    <div data-m-img className={`${/\b(absolute|fixed|sticky)\b/.test(className) ? "" : "relative"} overflow-hidden ${round ? "rounded-[var(--sx-radius,18px)]" : ""} ${className}`} style={{ aspectRatio: ratio }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={scene(i, 1200, 1500, label)} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
    </div>
  );
}

/** Transparent product (can) at an angle 0–3, in an accent colour. */
export function Product({ angle = 0, accent = "#4f8dff", className = "" }: { angle?: number; accent?: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img data-m-product src={productAngle(angle, accent)} alt="Product" className={`object-contain ${className}`} draggable={false} />;
}

export const Price = ({ now, was, className = "" }: { now: string; was?: string; className?: string }) => (
  <span className={`inline-flex items-baseline gap-2 tabular-nums ${className}`}>
    <b className="font-[650]">{now}</b>
    {was && <s className="text-[0.85em] text-[var(--sx-muted)]">{was}</s>}
  </span>
);

export const Stars = ({ n = 5 }: { n?: number }) => (
  <span className="tracking-[2px] text-[var(--sx-accent)]" aria-label={`${n} out of 5`}>
    {"★★★★★".slice(0, n)}
    <span className="text-[var(--sx-line)]">{"★★★★★".slice(n)}</span>
  </span>
);

/** Initials avatar (fake people only, never real faces or names). */
export const Avatar = ({ name, i = 0, size = 40 }: { name: string; i?: number; size?: number }) => {
  const hues = ["#4f8dff", "#b5502a", "#1f5f4a", "#8a5cf6", "#d4a24c"];
  return (
    <span className="grid shrink-0 place-items-center rounded-full font-[700] text-white" style={{ width: size, height: size, background: hues[i % hues.length], fontSize: Math.max(12, size * 0.38) }}>
      {name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)}
    </span>
  );
};

/** A row of fake partner/press wordmarks (invented names). */
export const LOGOS = ["Northfold", "Kiln & Co", "Halcyon", "Meridia", "Arcwell", "Solano", "Fennick", "Orbitale"];
export const Logos = ({ className = "" }: { className?: string }) => (
  <div className={`flex flex-wrap items-center gap-x-[clamp(24px,4vw,56px)] gap-y-3 text-[var(--sx-muted)] ${className}`}>
    {LOGOS.slice(0, 6).map((l, k) => (
      <span key={l} className={`text-[clamp(15px,1.3vw,19px)] tracking-[0.02em] ${k % 2 ? "font-[700] italic" : "font-[600] uppercase tracking-[0.18em]"}`}>
        {l}
      </span>
    ))}
  </div>
);

/** Small label above a heading. Use sparingly (LESSONS 40: not above every heading). */
export const Kicker = ({ children }: { children: ReactNode }) => <p className="text-[13px] font-[600] uppercase tracking-[0.16em] text-[var(--sx-accent)]">{children}</p>;

/** Big display heading with the section's display font. */
export const H = ({ children, className = "", as: Tag = "h2" }: { children: ReactNode; className?: string; as?: "h1" | "h2" | "h3" }) => (
  <Tag data-m-head className={`sx-display text-balance font-[800] leading-[0.95] tracking-[-0.02em] ${className}`}>
    {children}
  </Tag>
);
export const P = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <p data-m-text className={`text-pretty text-[clamp(16px,1.2vw,19px)] leading-relaxed text-[var(--sx-muted)] ${className}`}>
    {children}
  </p>
);
