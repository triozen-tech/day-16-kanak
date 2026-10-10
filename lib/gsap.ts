"use client";

// THE one place GSAP plugins are registered (every former Club plugin is free since GSAP 3.13).
//  - Always on (small, used on most sites): ScrollTrigger, SplitText, ScrambleText, DrawSVG, CustomEase.
//  - On demand (bigger, used by a few sections): `await loadPlugin("Flip")` imports + registers it once and returns it.
// Lenis stays the scroller (components/engine/SmoothScroll.tsx): never add ScrollSmoother on top of it.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { CustomEase } from "gsap/CustomEase";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, DrawSVGPlugin, CustomEase);
}

const lazy = {
  Flip: () => import("gsap/Flip").then((m) => m.Flip),
  MorphSVGPlugin: () => import("gsap/MorphSVGPlugin").then((m) => m.MorphSVGPlugin),
  MotionPathPlugin: () => import("gsap/MotionPathPlugin").then((m) => m.MotionPathPlugin),
  Physics2DPlugin: () => import("gsap/Physics2DPlugin").then((m) => m.Physics2DPlugin),
  InertiaPlugin: () => import("gsap/InertiaPlugin").then((m) => m.InertiaPlugin),
  Observer: () => import("gsap/Observer").then((m) => m.Observer),
};
type Lazy = typeof lazy;
const loaded = new Map<keyof Lazy, Promise<unknown>>();

/** Imports a bigger plugin the first time a section needs it, registers it, and returns it. */
export function loadPlugin<K extends keyof Lazy>(name: K): ReturnType<Lazy[K]> {
  if (!loaded.has(name))
    loaded.set(
      name,
      lazy[name]().then((p) => {
        gsap.registerPlugin(p as gsap.Plugin);
        return p;
      }),
    );
  return loaded.get(name) as ReturnType<Lazy[K]>;
}

/** True ONLY when the page is opened with ?static=1 (layout review). The OS reduce-motion setting is never used:
 *  it is ON by default on many Windows machines and turned the live sites into flat static pages. */
export const prefersReducedMotion = () => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("static");

/** True in ?record=1 (filming): hover/click effects must play by themselves. */
export const isRecording = () =>
  typeof window !== "undefined" &&
  (document.documentElement.classList.contains("is-recording") || new URLSearchParams(window.location.search).has("record"));

export { gsap, ScrollTrigger, SplitText, ScrambleTextPlugin, DrawSVGPlugin, CustomEase };
