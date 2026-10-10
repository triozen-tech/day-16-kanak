"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { atFromUrl, waitForClock } from "@/lib/atTime";

/**
 * Race-start loader (I3 counter, sport version): start lights come on one by one in the stop colour,
 * all turn to the go colour, then a slanted bar in the go colour sweeps across and slides away,
 * revealing the page. Always takes exactly `lights + sweep` seconds (default 2.5 s).
 * Reference: first built for a running-shoe site.
 *
 * Use as the site loader: set `meta.loader = false` in site/site.ts and render it first in site/Page.tsx.
 *  - `onLoaderReveal(fn)` runs fn once the page is revealed (use it to start hero intros).
 *  - `?record=1&at=HH:MM:SS`: shows its first frame frozen (lights off, name visible), preloads every image
 *    on the page and plays at that time, so two devices start together (docs/RECORDING.md).
 * `inline` = a looping preview inside its parent box (for /patterns); it never touches the page scroll.
 */

let revealed = false;
const REVEAL_EVENT = "loader:reveal";

/** Run once the start-lights loader has opened (immediately if it already has, or with ?static=1). */
export function onLoaderReveal(fn: () => void) {
  if (revealed) {
    fn();
    return () => {};
  }
  const h = () => fn();
  window.addEventListener(REVEAL_EVENT, h, { once: true });
  return () => window.removeEventListener(REVEAL_EVENT, h);
}

function reveal() {
  if (revealed) return;
  revealed = true;
  window.dispatchEvent(new Event(REVEAL_EVENT));
}

const loadImage = (src: string) =>
  new Promise<void>((done) => {
    const img = new Image();
    img.onload = img.onerror = () => done();
    img.src = src;
  });

/** Every <img> on the page (fetched by URL, so lazy or hidden ones count too) and the fonts. */
async function preloadAll() {
  const urls = [...new Set(Array.from(document.images).map((i) => i.currentSrc || i.src).filter(Boolean))];
  await Promise.all([...urls.map(loadImage), document.fonts.ready]);
}

/** A CSS colour or var(--token) resolved to a real colour (GSAP can't tween to var()). */
function resolve(color: string, el: Element) {
  const m = color.match(/^var\((--[^)]+)\)$/);
  return m ? getComputedStyle(el).getPropertyValue(m[1]).trim() || "#ffffff" : color;
}

export default function StartLightsLoader({
  name,
  count = 3,
  stopColor = "#ff2a2a",
  goColor = "var(--accent)",
  steps = ["Ready", "Set", "Set"],
  goWord = "Go",
  idleText = "On your marks",
  lights = 1.7,
  sweep = 0.8,
  inline = false,
}: {
  /** brand name under the lights */
  name: string;
  /** number of start lights */
  count?: number;
  stopColor?: string;
  /** lights on "go" + the sweeping bar (a CSS colour or var(--token)) */
  goColor?: string;
  /** status word shown as each light comes on (last one repeats) */
  steps?: string[];
  goWord?: string;
  /** status word on the first (frozen) frame */
  idleText?: string;
  /** seconds for the lights, then for the sweep */
  lights?: number;
  sweep?: number;
  /** looping preview inside its parent (position: relative) instead of a full-screen loader */
  inline?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const black = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const word = useRef<HTMLDivElement>(null);
  const status = useRef<HTMLSpanElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) {
      if (!inline) {
        setGone(true);
        reveal();
      }
      return;
    }
    if (!inline) {
      window.scrollTo(0, 0);
      window.__lenis?.stop();
    }

    // &at= (full-screen only): freeze on the first frame, preload everything, play at that time
    const target = inline ? null : atFromUrl();
    let ready = !target;
    let cancelClock = () => {};
    if (target) {
      const t0 = performance.now();
      preloadAll().then(() => {
        ready = true;
        console.log(`[record] loader: all images ready in ${((performance.now() - t0) / 1000).toFixed(1)} s`);
      });
    }

    const bulbs = Array.from(row.current!.children) as HTMLElement[];
    const stop = resolve(stopColor, root.current!);
    const go = resolve(goColor, root.current!);
    const say = (s: string) => () => {
      if (status.current) status.current.textContent = s;
    };
    const gap = (lights - 0.4) / Math.max(1, count);
    const glow = (c: string, a: number) => `0 0 ${34 + a * 10}px ${6 + a * 4}px color-mix(in srgb, ${c} 55%, transparent)`;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: !!target, repeat: inline ? -1 : 0, repeatDelay: inline ? 1.2 : 0 });
      if (inline) tl.set([black.current, stage.current], { autoAlpha: 1 }, 0).set(bulbs, { clearProps: "backgroundColor,boxShadow" }, 0).add(say(idleText), 0);
      if (!target) tl.from(word.current, { opacity: 0, y: 16, duration: 0.6, ease: "power3.out" }, 0);
      bulbs.forEach((b, i) => {
        tl.add(say(steps[Math.min(i, steps.length - 1)]), 0.2 + i * gap);
        tl.to(b, { backgroundColor: stop, boxShadow: glow(stop, 0), duration: 0.12, ease: "none" }, 0.2 + i * gap);
      });
      tl.addLabel("go", lights - 0.1)
        .add(() => {
          // &at= and still loading: hold on the stop colour until everything is in, then go
          if (ready) return;
          tl.pause();
          const wait = () => (ready ? tl.play() : requestAnimationFrame(wait));
          wait();
        }, "go")
        .add(say(goWord), "go")
        .to(bulbs, { backgroundColor: go, boxShadow: glow(go, 1), duration: 0.1, ease: "none" }, "go")
        .addLabel("sweep", lights)
        .fromTo(bar.current, { xPercent: -101, autoAlpha: 1 }, { xPercent: 0, duration: sweep * 0.4, ease: "power3.in" }, "sweep")
        .set([black.current, stage.current], { autoAlpha: 0 }, `sweep+=${sweep * 0.4}`)
        .add(() => {
          if (inline) return;
          window.__lenis?.start();
          reveal();
        }, `sweep+=${sweep * 0.4}`)
        .to(bar.current, { xPercent: 101, duration: sweep * 0.6, ease: "power3.out" }, `sweep+=${sweep * 0.4}`)
        .add(() => !inline && setGone(true), lights + sweep);

      if (target) {
        if (Date.now() < target.getTime()) console.log(`[record] loader frozen until ${target.toLocaleTimeString()}`);
        cancelClock = waitForClock(target, () => {
          if (!ready) console.warn("[record] assets not ready at start time: the lights stay on until they are");
          tl.play(0);
        });
      }
    });

    return () => {
      cancelClock();
      ctx.revert();
    };
    // props are fixed for a page load: the timeline is built once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inline]);

  if (gone) return null;

  return (
    <div
      ref={root}
      data-loader={inline ? undefined : ""}
      aria-hidden
      className={`${inline ? "absolute" : "fixed z-[100]"} inset-0 overflow-hidden`}
    >
      <div ref={black} className="absolute inset-0 bg-bg" />
      <div ref={stage} className="absolute inset-0 flex flex-col items-center justify-center gap-10">
        <div className="flex items-center rounded-[14px] border border-line bg-surface px-[clamp(18px,2.4vw,30px)] py-[clamp(14px,1.8vw,22px)]">
          <div ref={row} className="flex gap-[clamp(14px,2vw,26px)]">
            {Array.from({ length: count }, (_, i) => (
              <span
                key={i}
                className="block h-[clamp(40px,5vw,68px)] w-[clamp(40px,5vw,68px)] rounded-full bg-[color-mix(in_srgb,var(--surface)_70%,#000)] shadow-[inset_0_2px_6px_rgba(0,0,0,.6)]"
              />
            ))}
          </div>
        </div>
        <div ref={word} className="flex flex-col items-center gap-3">
          <span className="font-display inline-block text-[clamp(40px,5.4vw,84px)]" style={{ transform: "skewX(-8deg)" }}>
            {name}
          </span>
          <span ref={status} className="text-[12px] font-semibold tracking-[0.4em] text-muted uppercase">
            {idleText}
          </span>
        </div>
      </div>
      <div
        ref={bar}
        className="invisible absolute inset-y-0 -left-[8%] w-[116%]"
        style={{ background: goColor, clipPath: "polygon(8% 0, 100% 0, 92% 100%, 0 100%)" }}
      />
    </div>
  );
}
