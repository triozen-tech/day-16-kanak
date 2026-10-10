"use client";

import { useEffect, useRef } from "react";
import { onSiteReady } from "@/lib/loading";
import { prefersReducedMotion } from "@/lib/gsap";

/**
 * RECORD CURSOR: a visible, clean mouse pointer that glides through the page in ?record=1 and plays the site's
 * REAL hover states by itself, so every reel shows hovers without anyone touching the mouse.
 *
 * Mark what it visits (in page order, each one when it is on screen):
 *   data-hover-demo                 hover it (cards, swatches, buttons, links)
 *   data-hover-demo="click"         hover, then click it halfway through the stay (Add to cart, a swatch that swaps on click)
 *   data-hover-hold="1.4"           seconds to stay on it (default 1.1)
 *   data-hover-at="0.5,0.3"         where to rest inside it (fractions of its box); default: the first spot that
 *                                   keeps the pointer off headlines (h1–h3, [data-split], .font-display, [data-cursor-avoid])
 *   data-hover-label="Swatch"       name in the console
 *
 * How the hover is real: on arrival the element under the tip gets the same events a mouse sends (pointerover/
 * pointerenter/mouseover/mouseenter, then pointermove/mousemove while it rests, out/leave when it goes), so React
 * onMouseEnter/onPointerMove, Magnetic, TiltCard and GSAP hover code all run; and it plus its ancestors get
 * `.is-hover`, which every `:hover` / Tailwind `hover:` / `group-hover:` rule also matches
 * (lib/postcss-record-hover.cjs). Nothing is faked per site.
 *
 * Rules (CLAUDE.md, docs/RECORDING.md): ≥ 3 hover moments per reel (`npm run reel` fails otherwise; count in
 * window.__recordHovers); never rests on headline text; glides on a soft arc, never jumps; rides along with its target
 * while the page scrolls (lesson 83); fades out when idle. Off in ?static=1, with &cursor=0, or meta.record.cursor = false.
 */

const HEADLINE = "h1, h2, h3, [data-split], .font-display, [data-cursor-avoid]";
const SPOTS: [number, number][] = [
  [0.5, 0.5], [0.5, 0.36], [0.68, 0.3], [0.32, 0.66], [0.72, 0.72], [0.28, 0.3], [0.5, 0.8], [0.82, 0.5], [0.18, 0.5],
];
const BAND = { top: 0.16, bottom: 0.86 }; // a target is picked once its rest point is inside this part of the screen
const KEEP = { top: 0.06, bottom: 0.94 }; // and left early if it scrolls out of this part

type Target = { el: HTMLElement; fx: number; fy: number; hold: number; click: boolean; label: string };

declare global {
  interface Window {
    __recordHovers?: { label: string; at: number }[];
  }
}

function afterLoader(fn: () => void) {
  let raf = 0;
  const off = onSiteReady(() => {
    const check = () => {
      if (document.querySelector("[data-loader]")) raf = requestAnimationFrame(check);
      else fn();
    };
    check();
  });
  return () => {
    off();
    cancelAnimationFrame(raf);
  };
}

/** Is a headline (or a big display line) under this point? */
function onHeadline(x: number, y: number) {
  for (const el of document.elementsFromPoint(x, y)) {
    if (el.closest("[data-record-cursor]")) continue;
    if (el.closest(HEADLINE)) return true;
    const own = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent!.trim());
    if (own && parseFloat(getComputedStyle(el).fontSize) >= 32) return true;
    return false; // only the topmost real element counts
  }
  return false;
}

/** A rest point inside the element that keeps the arrow (tip + its body down-right) off headlines. */
function restSpot(el: HTMLElement): [number, number] {
  const at = el.dataset.hoverAt?.split(",").map(Number);
  if (at?.length === 2 && at.every((n) => Number.isFinite(n))) return [at[0], at[1]];
  const r = el.getBoundingClientRect();
  for (const [fx, fy] of SPOTS) {
    const x = r.left + r.width * fx;
    const y = r.top + r.height * fy;
    if (![[0, 0], [10, 12], [18, 24]].some(([dx, dy]) => onHeadline(x + dx, y + dy))) return [fx, fy];
  }
  return [0.5, 0.5];
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2); // cubic in-out

export default function RecordCursor({ enabled = true }: { enabled?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const arrow = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!enabled || !params.has("record") || params.get("cursor") === "0" || prefersReducedMotion()) return;
    const box = root.current!;
    window.__recordHovers = [];

    const pos = { x: window.innerWidth * 0.82, y: window.innerHeight * 0.9 };
    let alpha = 0;
    let fade = 0; // target opacity
    let state: "idle" | "glide" | "dwell" = "idle";
    let target: Target | null = null;
    let anchor: Target | null = null; // the last target: the pointer rides along with it while idle
    let t0 = 0;
    let from = { x: 0, y: 0 };
    let bend = 0;
    let glideMs = 700;
    let clicked = false;
    let idleSince = performance.now();
    let hovered: Element | null = null;
    let started = false;
    const done = new WeakSet<HTMLElement>();
    const vw = () => window.innerWidth;
    const vh = () => window.innerHeight;

    const point = (t: Target) => {
      const r = t.el.getBoundingClientRect();
      return { x: r.left + r.width * t.fx, y: r.top + r.height * t.fy };
    };

    // ---------- the same events a real mouse sends ----------
    const chain = (el: Element | null) => {
      const out: Element[] = [];
      for (let e = el; e && e !== document.body && e !== document.documentElement; e = e.parentElement) out.push(e);
      return out;
    };
    const fire = (el: Element, type: string, related: Element | null, bubbles = true) => {
      const init = { bubbles, cancelable: true, composed: true, clientX: pos.x, clientY: pos.y, relatedTarget: related, view: window };
      el.dispatchEvent(
        type.startsWith("pointer") ? new PointerEvent(type, { ...init, pointerId: 1, pointerType: "mouse", isPrimary: true }) : new MouseEvent(type, init),
      );
    };
    const setHover = (next: Element | null) => {
      const prev = hovered;
      if (prev === next) return;
      const a = chain(prev);
      const b = chain(next);
      const keep = new Set(b);
      const had = new Set(a);
      if (prev) ["pointerout", "mouseout"].forEach((t) => fire(prev, t, next));
      for (const el of a)
        if (!keep.has(el)) {
          el.classList.remove("is-hover");
          ["pointerleave", "mouseleave"].forEach((t) => fire(el, t, next, false));
        }
      if (next) ["pointerover", "mouseover"].forEach((t) => fire(next, t, prev));
      for (const el of [...b].reverse())
        if (!had.has(el)) {
          el.classList.add("is-hover");
          ["pointerenter", "mouseenter"].forEach((t) => fire(el, t, prev, false));
        }
      hovered = next;
    };
    const move = () => {
      const el = hovered ?? document.documentElement;
      fire(el, "pointermove", null);
      fire(el, "mousemove", null);
    };
    const press = (el: Element) => {
      ["pointerdown", "mousedown", "pointerup", "mouseup", "click"].forEach((t) => fire(el, t, null));
      ring.current?.animate([{ scale: 1, opacity: 0.9 }, { scale: 1.9, opacity: 0 }], { duration: 520, easing: "ease-out" });
      arrow.current?.animate([{ scale: 1 }, { scale: 0.84 }, { scale: 1 }], { duration: 260, easing: "ease-in-out" });
    };

    // ---------- choosing the next target ----------
    const next = (): Target | null => {
      for (const el of document.querySelectorAll<HTMLElement>("[data-hover-demo]")) {
        if (done.has(el)) continue;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height || !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
        const [fx, fy] = restSpot(el);
        const y = r.top + r.height * fy;
        const x = r.left + r.width * fx;
        if (y < vh() * BAND.top) {
          // scrolled past before there was time: never go back up for it
          done.add(el);
          console.warn(`[record] cursor skipped ${el.dataset.hoverLabel || el.textContent?.trim().slice(0, 24) || el.tagName}`);
          continue;
        }
        if (y > vh() * BAND.bottom || x < 0 || x > vw()) return null; // page order: wait for this one to arrive
        return {
          el,
          fx,
          fy,
          hold: Number(el.dataset.hoverHold) || 1.1,
          click: el.dataset.hoverDemo === "click",
          label: el.dataset.hoverLabel || el.getAttribute("aria-label") || el.textContent?.trim().replace(/\s+/g, " ").slice(0, 32) || el.tagName,
        };
      }
      return null;
    };

    const startGlide = (t: Target) => {
      done.add(t.el);
      target = t;
      state = "glide";
      t0 = performance.now();
      if (alpha < 0.05) {
        // appear a little below-right of the target, as if the hand just moved in
        const p = point(t);
        pos.x = Math.min(vw() - 30, p.x + 170);
        pos.y = Math.min(vh() - 30, p.y + 130);
      }
      from = { ...pos };
      const p = point(t);
      const dist = Math.hypot(p.x - from.x, p.y - from.y);
      glideMs = Math.min(1000, Math.max(480, 420 + dist * 0.55));
      bend = (Math.random() < 0.5 ? -1 : 1) * Math.min(0.12, 40 / Math.max(dist, 1)) * dist * 0.9;
      fade = 1;
    };

    const endDwell = (why: string) => {
      setHover(null);
      if (why === "done") {
        window.__recordHovers!.push({ label: target!.label, at: Math.round(performance.now()) });
        console.log(`[record] hover ${window.__recordHovers!.length}: ${target!.label}`);
      }
      anchor = why === "done" ? target : null;
      target = null;
      state = "idle";
      idleSince = performance.now();
    };

    let raf = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (state === "idle") {
        const t = next();
        if (t) startGlide(t);
        else {
          // ride along with the last target; fade out after a moment or once it leaves the screen
          if (anchor) {
            const p = point(anchor);
            pos.x = p.x;
            pos.y = p.y;
            if (p.y < vh() * KEEP.top || p.y > vh() * KEEP.bottom) anchor = null;
          }
          if (!anchor || now - idleSince > 900) fade = 0;
        }
      }
      if (state === "glide" && target) {
        const p = point(target);
        const k = Math.min(1, (now - t0) / glideMs);
        const e = ease(k);
        // a soft arc: quadratic bezier whose control point sits off the straight line
        const mx = (from.x + p.x) / 2;
        const my = (from.y + p.y) / 2;
        const len = Math.hypot(p.x - from.x, p.y - from.y) || 1;
        const cx = mx + (-(p.y - from.y) / len) * bend;
        const cy = my + ((p.x - from.x) / len) * bend;
        pos.x = (1 - e) * (1 - e) * from.x + 2 * (1 - e) * e * cx + e * e * p.x;
        pos.y = (1 - e) * (1 - e) * from.y + 2 * (1 - e) * e * cy + e * e * p.y;
        move();
        if (k >= 1) {
          state = "dwell";
          t0 = now;
          clicked = false;
          box.style.visibility = "hidden"; // never hit-test our own pointer
          const under = document.elementFromPoint(pos.x, pos.y);
          box.style.visibility = "";
          setHover(under && target.el.contains(under) ? under : target.el);
          ring.current?.animate([{ scale: 0.4, opacity: 0 }, { scale: 1, opacity: 0.85 }], { duration: 260, easing: "ease-out", fill: "forwards" });
        }
      }
      if (state === "dwell" && target) {
        const p = point(target);
        const s = (now - t0) / 1000;
        // a tiny hand drift so tilt / magnetic hovers visibly follow (never more than a few px)
        pos.x = p.x + Math.sin(s * 2.1) * 5;
        pos.y = p.y + Math.sin(s * 1.4 + 1) * 3;
        move();
        if (target.click && !clicked && s >= target.hold * 0.45) {
          clicked = true;
          press(hovered ?? target.el);
        }
        if (p.y < vh() * KEEP.top || p.y > vh() * KEEP.bottom) {
          ring.current?.animate([{ opacity: 0.85 }, { opacity: 0 }], { duration: 200, fill: "forwards" });
          endDwell(s >= 0.6 ? "done" : "left");
        } else if (s >= target.hold) {
          ring.current?.animate([{ opacity: 0.85 }, { opacity: 0 }], { duration: 260, fill: "forwards" });
          endDwell("done");
        }
      }
      alpha += (fade - alpha) * 0.12;
      box.style.opacity = alpha.toFixed(3);
      box.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    };

    const off = afterLoader(() => {
      if (started) return;
      started = true;
      const n = document.querySelectorAll("[data-hover-demo]").length;
      if (n < 3) console.warn(`[record] only ${n} [data-hover-demo] targets: every reel needs at least 3 hover moments`);
      raf = requestAnimationFrame(frame);
    });
    return () => {
      off();
      cancelAnimationFrame(raf);
      setHover(null);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <div
      ref={root}
      data-record-cursor
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[2147483000] opacity-0"
      style={{ willChange: "transform" }}
    >
      <div
        ref={ring}
        className="absolute -left-[26px] -top-[26px] h-[52px] w-[52px] rounded-full opacity-0"
        style={{ background: "color-mix(in oklab, var(--accent) 22%, transparent)", border: "1.5px solid color-mix(in oklab, var(--accent) 70%, white)" }}
      />
      <svg ref={arrow} width="34" height="39" viewBox="0 0 26 30" className="absolute -left-[4px] -top-[3px] block" style={{ transformOrigin: "4px 3px", filter: "drop-shadow(0 2px 4px rgba(0,0,0,.35))" }}>
        <path d="M3 2 L3 24 L8.6 18.6 L12.4 27.2 L16.4 25.4 L12.7 17 L20.6 17 Z" fill="#fff" stroke="#111" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
