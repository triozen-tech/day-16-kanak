"use client";

import { useEffect } from "react";
import { onSiteReady } from "@/lib/loading";
import { parseAt, waitForClock } from "@/lib/atTime";

/**
 * RECORD MODE — for filming the site with a camera.
 *
 *   Open:  http://localhost:3000/?record=1
 *   Options: &at=18:55:00          → start at that time on the device clock (see docs/RECORDING.md: the loader
 *                                    waits frozen and plays at that time; loaders without support: wait on the hero)
 *            &duration=30 / &speed=180 / &delay=3   (constant-speed mode only, see below)
 *
 * Two ways to scroll (full guide: docs/RECORDING.md):
 *
 * 1. SECTION TIMELINE (used when any element has data-record-time)
 *    Every marked element is a stop, in page order. Same seconds on every screen size, so a
 *    laptop and a phone recording line up exactly.
 *      data-record-time="2.5"      seconds to scroll from the previous stop to this one
 *      data-record-hold="5"        seconds to stay still once it arrives
 *      data-record-align="center"  where the element sits on screen: top (default) | center | bottom
 *      data-record-offset="-36"    extra px added to the scroll position
 *      data-record-label="FAQ"     name printed in the console
 *      any of them + "-mobile"     (e.g. data-record-hold-mobile="2") used below 768px wide.
 *                                  A shorter mobile hold gives its spare seconds to the next move,
 *                                  so the total stays identical to the laptop.
 *    Motion is one smooth curve through all stops: it only rests at holds, the start and the end.
 *    During a hold the stop element receives "record:hold" (detail.duration) and then "record:holdend".
 *    The clock starts once the loader has gone (engine loader, or any element with data-loader).
 *
 * 2. CONSTANT SPEED (no data-record-time on the page): scrolls the whole page at a steady speed,
 *    or in `duration` seconds.
 *
 * - Hides the mouse cursor and scrollbar
 * Keyboard (works any time, even without ?record):
 *   R  start / pause / resume      T  stop and jump back to the top      +/-  faster / slower (constant mode)
 */

type Stop = { el: HTMLElement; label: string; y: number; move: number; hold: number };
type Key = { t: number; y: number };

const MOBILE = 768;

function attr(el: HTMLElement, name: string) {
  const mobile = window.innerWidth < MOBILE ? el.getAttribute(`data-record-${name}-mobile`) : null;
  return mobile ?? el.getAttribute(`data-record-${name}`);
}

function buildStops(): Stop[] {
  const vh = window.innerHeight;
  const max = document.documentElement.scrollHeight - vh;
  const stops = Array.from(document.querySelectorAll<HTMLElement>("[data-record-time]")).map((el) => {
    const r = el.getBoundingClientRect();
    const top = r.top + window.scrollY;
    const align = attr(el, "align") ?? "top";
    let y = align === "center" ? top + r.height / 2 - vh / 2 : align === "bottom" ? top + r.height - vh : top;
    y = Math.min(max, Math.max(0, y + Number(attr(el, "offset") ?? 0)));
    const hold = Number(attr(el, "hold") ?? 0);
    const fullHold = Number(el.getAttribute("data-record-hold") ?? 0);
    return { el, label: el.dataset.recordLabel || el.id || el.tagName.toLowerCase(), y, move: Number(attr(el, "time") ?? 0), hold, spare: Math.max(0, fullHold - hold) };
  });
  // spare seconds of a shorter (mobile) hold go to the next move, so every screen size has the same total
  stops.forEach((s, i) => {
    if (s.spare && stops[i + 1]) stops[i + 1].move += s.spare;
  });
  return stops;
}

/** Monotone cubic (Fritsch–Butland) through the keys: smooth speed, never overshoots, rests where the page holds. */
function makeCurve(keys: Key[]) {
  const n = keys.length;
  const d = keys.slice(0, -1).map((k, i) => (keys[i + 1].y - k.y) / (keys[i + 1].t - k.t));
  const m = keys.map((_, i) => {
    if (i === 0 || i === n - 1) return 0; // ease in at the start, ease out at the end
    const d0 = d[i - 1];
    const d1 = d[i];
    if (d0 * d1 <= 0) return 0; // a hold (or a turn): come to rest
    const h0 = keys[i].t - keys[i - 1].t;
    const h1 = keys[i + 1].t - keys[i].t;
    return (3 * (h0 + h1)) / ((2 * h1 + h0) / d0 + (h1 + 2 * h0) / d1);
  });
  return (t: number) => {
    if (t <= keys[0].t) return keys[0].y;
    if (t >= keys[n - 1].t) return keys[n - 1].y;
    let i = 0;
    while (t > keys[i + 1].t) i++;
    const h = keys[i + 1].t - keys[i].t;
    const s = (t - keys[i].t) / h;
    const s2 = s * s;
    const s3 = s2 * s;
    return (
      (2 * s3 - 3 * s2 + 1) * keys[i].y + (s3 - 2 * s2 + s) * h * m[i] + (-2 * s3 + 3 * s2) * keys[i + 1].y + (s3 - s2) * h * m[i + 1]
    );
  };
}

const scrollToY = (y: number) => {
  if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true, force: true });
  else window.scrollTo(0, y);
};

/** Resolves once the loader has gone: the engine loader or any element marked data-loader. */
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

export default function RecordMode({ speed = 220, duration, delay = 2.5 }: { speed?: number; duration?: number; delay?: number }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const auto = params.has("record");
    const timelineMode = () => document.querySelector("[data-record-time]") !== null;

    // ---------- 1. section timeline ----------
    let tRaf = 0;
    let tRunning = false;
    let tStarted = false;
    let clockStart = 0;
    let pausedAt = 0;
    let curve: ((t: number) => number) | null = null;
    let events: { t: number; fire: () => void }[] = [];
    let end = 0;

    const tick = () => {
      if (!tRunning || !curve) return;
      const t = (performance.now() - clockStart) / 1000;
      scrollToY(curve(t));
      while (events.length && events[0].t <= t) events.shift()!.fire();
      if (t >= end) {
        tRunning = false;
        console.log(`[record] done at ${t.toFixed(2)} s`);
        return;
      }
      tRaf = requestAnimationFrame(tick);
    };

    const startTimeline = () => {
      scrollToY(0);
      const stops = buildStops();
      const keys: Key[] = [{ t: 0, y: 0 }];
      const plan: Record<string, string>[] = [];
      events = [];
      let t = 0;
      const log = (msg: string) => () => console.log(`[record] ${msg}`);
      for (const s of stops) {
        const from = t;
        const move = Math.max(s.move, 0.001);
        t += move;
        keys.push({ t, y: s.y });
        events.push({ t: from, fire: log(`${from.toFixed(2)} s  → ${s.label}`) });
        plan.push({ section: s.label, "starts (s)": from.toFixed(2), "arrives (s)": t.toFixed(2), "hold (s)": String(s.hold), "scrollY (px)": String(Math.round(s.y)) });
        if (s.hold > 0) {
          const at = t;
          events.push({ t: at, fire: () => s.el.dispatchEvent(new CustomEvent("record:hold", { bubbles: true, detail: { duration: s.hold } })) });
          t += s.hold;
          keys.push({ t, y: s.y });
          events.push({ t, fire: () => s.el.dispatchEvent(new CustomEvent("record:holdend", { bubbles: true })) });
        }
      }
      events.sort((a, b) => a.t - b.t);
      end = t;
      curve = makeCurve(keys);
      console.log(`[record] section timeline, ${window.innerWidth}×${window.innerHeight}, total ${end.toFixed(2)} s`);
      console.table(plan);
      clockStart = performance.now();
      tStarted = true;
      tRunning = true;
      tRaf = requestAnimationFrame(tick);
    };

    const pauseTimeline = () => {
      tRunning = false;
      pausedAt = performance.now();
      cancelAnimationFrame(tRaf);
    };
    const resumeTimeline = () => {
      clockStart += performance.now() - pausedAt;
      tRunning = true;
      tRaf = requestAnimationFrame(tick);
    };
    const stopTimeline = () => {
      tRunning = false;
      tStarted = false;
      cancelAnimationFrame(tRaf);
    };

    // ---------- 2. constant speed ----------
    const urlSpeed = Number(params.get("speed")) || 0;
    const urlDuration = Number(params.get("duration")) || 0;
    // A speed in the URL wins; then a duration (URL or config); then the config speed.
    const secs = urlSpeed ? 0 : urlDuration || duration || 0;
    let pxPerSec = urlSpeed || speed;
    const wait = (params.get("delay") !== null ? Number(params.get("delay")) : delay) * 1000;

    let running = false;
    let raf = 0;
    let last = 0;
    let y = 0;

    const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;

    const step = (t: number) => {
      if (!running) return;
      const dt = last ? (t - last) / 1000 : 0;
      last = t;
      y = Math.min(maxScroll(), y + pxPerSec * dt);
      scrollToY(y);
      if (y >= maxScroll()) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(step);
    };

    let first = true;
    const start = () => {
      if (running) return;
      if (first && secs > 0) pxPerSec = Math.max(40, (maxScroll() - window.scrollY) / secs);
      first = false;
      running = true;
      last = 0;
      y = window.scrollY;
      raf = requestAnimationFrame(step);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input, textarea")) return;
      const k = e.key.toLowerCase();
      if (k === "r") {
        document.documentElement.classList.add("is-recording");
        if (timelineMode()) {
          if (!tStarted) startTimeline();
          else if (tRunning) pauseTimeline();
          else resumeTimeline();
        } else if (running) stop();
        else start();
      } else if (k === "t") {
        stop();
        stopTimeline();
        window.__lenis?.scrollTo(0, { immediate: true, force: true });
        window.scrollTo(0, 0);
      } else if (k === "+" || k === "=") pxPerSec = Math.round(pxPerSec * 1.15);
      else if (k === "-") pxPerSec = Math.round(pxPerSec / 1.15);
    };
    window.addEventListener("keydown", onKey);

    let timer: ReturnType<typeof setTimeout> | undefined;
    let off = () => {};
    let offClock = () => {};
    if (auto) {
      document.documentElement.classList.add("is-recording");
      off = afterLoader(() => {
        // with &at= a loader that supports it (e.g. patterns/StartLightsLoader) already waited, so this passes straight through
        const target = parseAt(params.get("at"));
        if (target && Date.now() < target.getTime()) console.log(`[record] waiting for ${target.toLocaleTimeString()}`);
        offClock = waitForClock(target, () => {
          if (timelineMode()) startTimeline();
          else timer = setTimeout(start, wait);
        });
      });
    }

    return () => {
      stop();
      stopTimeline();
      off();
      offClock();
      if (timer) clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [speed, duration, delay]);

  return null;
}
