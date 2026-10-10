"use client";

// Travelling object driver (DESIGN/MOTION-MENU F1–F8, demo: /lab/travel). One product stays on screen and travels
// from anchor to anchor as you scroll (idea: Codrops "Consecutive Scroll Animations with One Element", Flip + ScrollTrigger).
//
// Each section holds an invisible anchor: <div data-anchor data-rot="-8" data-turn="0.25" data-tilt="10" />
//   its box = where/how big the object is in that section (laid out by CSS, so phones get their own anchors)
//   data-rot = 2D rotation (deg) · data-turn = turn around its own axis (0..1 = 0..360°, for angles / 3D)
//   data-tilt = tilt towards the camera (deg, 3D) · data-spin = extra full turns while travelling INTO this anchor
// The driver measures every anchor in PAGE coordinates and builds one scrubbed timeline whose time = scrollY: while a
// section is centred the object rests on its anchor (and scrolls with the page); between sections it flies to the next.
// The result is a single state object (page coords) that each version draws: a PNG (F1), a 3D model (F2/F3), a
// <model-viewer> (F6). An idle float (bob + sway) runs on top all the time, so it is never frozen in ?record=1.
import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

export type TravelState = { x: number; y: number; w: number; h: number; rot: number; turn: number; tilt: number; section: number };

type Anchor = TravelState & { hold: [number, number] };

function measure(page: HTMLElement): Anchor[] {
  const vh = window.innerHeight;
  const max = Math.max(1, document.documentElement.scrollHeight - vh);
  const pr = page.getBoundingClientRect();
  let spins = 0; // full turns added so far (data-spin), so later anchors never "unwind" them
  return Array.from(page.querySelectorAll<HTMLElement>("[data-anchor]")).map((a, i) => {
    spins += Number(a.dataset.spin ?? 0);
    const r = a.getBoundingClientRect();
    const sec = a.closest<HTMLElement>("[data-travel-section]") ?? a;
    const sr = sec.getBoundingClientRect();
    const secTop = sr.top - pr.top;
    // the scroll range in which this section "owns" the object: from when it fills most of the screen to its end
    const from = gsap.utils.clamp(0, max, secTop + Math.min(sr.height, vh) * 0.5 - vh * 0.5);
    const to = gsap.utils.clamp(0, max, secTop + sr.height - vh * 0.75);
    return {
      x: r.left - pr.left + r.width / 2,
      y: r.top - pr.top + r.height / 2,
      w: r.width,
      h: r.height,
      rot: Number(a.dataset.rot ?? 0),
      turn: Number(a.dataset.turn ?? 0) + spins, // data-spin adds full turns on the way in (kept afterwards)
      tilt: Number(a.dataset.tilt ?? 0),
      section: i,
      hold: [from, Math.max(from, to)],
    };
  });
}

/**
 * Drives `state` (page coordinates of the object's centre + size + angles) from the scroll.
 * `onFrame(state, t)` runs every frame while the page is visible: draw the object there (+ the idle float).
 */
export function useTravel(page: React.RefObject<HTMLElement | null>, onFrame: (s: TravelState, t: number) => void) {
  const state = useRef<TravelState>({ x: 0, y: 0, w: 1, h: 1, rot: 0, turn: 0, tilt: 0, section: 0 });
  const cb = useRef(onFrame);
  cb.current = onFrame;

  useEffect(() => {
    const el = page.current;
    if (!el) return;
    let tl: gsap.core.Timeline | null = null;
    const still = prefersReducedMotion();

    const build = () => {
      tl?.kill();
      tl = null;
      const anchors = measure(el);
      if (!anchors.length) return;
      Object.assign(state.current, anchors[0]);
      if (still) return; // ?static=1: the object sits on the first anchor (the hero), its final readable state
      const s = state.current;
      tl = gsap.timeline({ paused: true });
      // timeline time = scroll pixels: rest on each anchor during its hold, fly between holds
      for (let i = 1; i < anchors.length; i++) {
        const a = anchors[i];
        const start = anchors[i - 1].hold[1];
        const dur = Math.max(1, a.hold[0] - start);
        tl.to(s, { x: a.x, y: a.y, w: a.w, h: a.h, rot: a.rot, turn: a.turn, tilt: a.tilt, duration: dur, ease: "power2.inOut" }, start);
        tl.set(s, { section: i }, start + dur / 2);
      }
      tl.to({}, { duration: 1 }, Math.max(tl.duration(), document.documentElement.scrollHeight - window.innerHeight));
      tl.time(window.scrollY, false);
    };

    build();
    // re-measure after layout changes (fonts, images, resize), debounced
    let t0 = 0;
    const later = () => {
      clearTimeout(t0);
      t0 = window.setTimeout(build, 120);
    };
    const ro = new ResizeObserver(later);
    ro.observe(el);
    document.fonts?.ready.then(later);

    // every frame: the timeline follows the scroll position (Lenis moves window.scrollY), then the version draws
    const tick = (t: number) => {
      tl?.time(window.scrollY, false);
      cb.current(state.current, t);
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      clearTimeout(t0);
      ro.disconnect();
      tl?.kill();
    };
  }, [page]);

  return state;
}

/** Idle float on top of the travel state (never frozen): a slow bob and sway, in px / deg. */
export const idle = (t: number) => ({ dy: Math.sin(t * 1.6) * 10, rot: Math.sin(t * 0.9) * 2.2, turn: Math.sin(t * 0.7) * 0.02 });
