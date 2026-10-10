"use client";

import { createContext, useContext, useEffect, useRef, type RefObject } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

/**
 * Placeholder "photo" as an SVG data URI (works on the server too, so the plain <img> fallback is in the HTML).
 * A moody gradient, a glow and a product silhouette (can / bottle / box / sneaker-ish blob), 4 palettes.
 * Demos use these so they never depend on a day's images (CLAUDE.md: pattern demos use placeholders).
 */
const PALETTES = [
  ["#0b1020", "#2f8cff", "#9fd8ff", "#eaf5ff"],
  ["#1a0b12", "#ff4d6d", "#ffb36b", "#fff1e6"],
  ["#07140f", "#18c48f", "#c8ff8a", "#f1fff4"],
  ["#140f07", "#e0913f", "#ffd59a", "#fff6e8"],
];
export function scene(i = 0, w = 1600, h = 1000, label = "") {
  const [bg, a, b, c] = PALETTES[i % PALETTES.length];
  const shape = [
    `<rect x="${w * 0.42}" y="${h * 0.2}" width="${w * 0.16}" height="${h * 0.62}" rx="${w * 0.03}" fill="url(#p)"/><rect x="${w * 0.42}" y="${h * 0.42}" width="${w * 0.16}" height="${h * 0.02}" fill="${c}" opacity=".8"/>`,
    `<path d="M${w * 0.47} ${h * 0.14}h${w * 0.06}v${h * 0.12}q${w * 0.07} ${h * 0.05} ${w * 0.07} ${h * 0.16}v${h * 0.4}q0 ${h * 0.04} -${w * 0.04} ${h * 0.04}h-${w * 0.12}q-${w * 0.04} 0 -${w * 0.04} -${h * 0.04}v-${h * 0.4}q0 -${h * 0.11} ${w * 0.07} -${h * 0.16}z" fill="url(#p)"/>`,
    `<rect x="${w * 0.36}" y="${h * 0.3}" width="${w * 0.28}" height="${h * 0.44}" rx="${w * 0.01}" fill="url(#p)" transform="rotate(-8 ${w / 2} ${h / 2})"/>`,
    `<path d="M${w * 0.3} ${h * 0.62}q${w * 0.05} -${h * 0.22} ${w * 0.2} -${h * 0.2}q${w * 0.12} ${h * 0.02} ${w * 0.2} ${h * 0.1}q${w * 0.04} ${h * 0.06} 0 ${h * 0.12}h-${w * 0.38}q-${w * 0.04} 0 -${w * 0.02} -${h * 0.02}z" fill="url(#p)"/>`,
  ][i % 4];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><radialGradient id="g" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="${a}" stop-opacity=".85"/><stop offset=".45" stop-color="${a}" stop-opacity=".18"/><stop offset="1" stop-color="${bg}" stop-opacity="0"/></radialGradient><linearGradient id="p" x1="0" x2="1"><stop offset="0" stop-color="${bg}"/><stop offset=".45" stop-color="${b}"/><stop offset=".55" stop-color="${c}"/><stop offset="1" stop-color="${bg}"/></linearGradient></defs><rect width="100%" height="100%" fill="${bg}"/><rect width="100%" height="100%" fill="url(#g)"/><ellipse cx="${w / 2}" cy="${h * 0.84}" rx="${w * 0.3}" ry="${h * 0.04}" fill="${a}" opacity=".35"/>${shape}${
    label ? `<text x="${w * 0.06}" y="${h * 0.9}" font-family="Arial, sans-serif" font-weight="700" font-size="${h * 0.06}" fill="${c}" opacity=".7" letter-spacing="${h * 0.01}">${label}</text>` : ""
  }</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** "relative" unless the caller already positions the element (absolute/fixed/sticky): avoids class clashes. */
export const pos = (className = "") => (/\b(absolute|fixed|sticky)\b/.test(className) ? className : `relative ${className}`);

/** Rasterises a data URI / URL into a canvas (a safe WebGL texture source). */
export async function toCanvas(src: string, w = 1600, h = 1000) {
  const img = new Image();
  img.src = src;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  c.getContext("2d")!.drawImage(img, 0, 0, w, h);
  return c;
}

/** A tall section with a sticky stage provides itself here, so effects inside scrub over the whole section. */
export const ScrubRoot = createContext<RefObject<HTMLElement | null> | null>(null);

/**
 * Scroll progress (0..1) for an effect. Inside a <ScrubRoot> (tall section + sticky stage): 0 when the section's top
 * reaches the top of the screen, 1 when its bottom reaches the bottom. Otherwise: the effect's own pass through the
 * screen (0 entering at the bottom, 1 leaving at the top). `onProgress` runs on every change; velocity is -1..1.
 * In ?static=1 it reports `finalValue` once (the effect's final state) and never animates.
 */
export function useScrub(
  own: RefObject<HTMLElement | null>,
  onProgress: (p: number, velocity: number) => void,
  { finalValue = 1 }: { finalValue?: number } = {},
) {
  const root = useContext(ScrubRoot);
  const cb = useRef(onProgress);
  cb.current = onProgress;
  const last = useRef(0);
  useEffect(() => {
    const el = (root ?? own).current;
    const [start, end] = root ? ["top top", "bottom bottom"] : ["top bottom", "bottom top"];
    if (!el) return;
    if (prefersReducedMotion()) {
      last.current = finalValue;
      cb.current(finalValue, 0);
      return;
    }
    const st = ScrollTrigger.create({
      trigger: el,
      start,
      end,
      onUpdate: (self) => {
        last.current = self.progress;
        cb.current(self.progress, gsap.utils.clamp(-1, 1, self.getVelocity() / 2500));
      },
      onRefresh: (self) => cb.current(self.progress, 0),
    });
    cb.current(st.progress, 0);
    return () => st.kill();
  }, [root, own, finalValue]);
  return last;
}

/** Runs `fn` every frame while the element is on screen (time-based ambient motion: never frozen in record mode). */
export function useTicker(el: RefObject<HTMLElement | null>, fn: (t: number, dt: number) => void) {
  const cb = useRef(fn);
  cb.current = fn;
  useEffect(() => {
    const node = el.current;
    if (!node || prefersReducedMotion()) return;
    let on = false;
    const io = new IntersectionObserver(([e]) => (on = e.isIntersecting), { rootMargin: "80px" });
    io.observe(node);
    const tick = (time: number, dt: number) => {
      if (on) cb.current(time, dt / 1000);
    };
    gsap.ticker.add(tick);
    return () => {
      io.disconnect();
      gsap.ticker.remove(tick);
    };
  }, [el]);
}
