"use client";

import { useEffect, useRef, useState } from "react";
import { getManifest, loadFrames, type FrameManifest } from "@/lib/frames";
import { loading } from "@/lib/loading";
/** A scroll video: frames folder + segments ("play the video up to `to` seconds over `secs` record seconds"). */
export type Segment = { to: number; secs: number; label: string };
export type Film = { frames: string; start: number; segments: Segment[]; poster: number };
/** Pinned scroll length per record second, so hand scrolling and ?record=1 feel alike. */
export const PIN_VH_PER_SEC = 55;

// Kit version of the scroll-video player (first built for an energy-drink site). Frames come from
// scripts/make_frames.py (manifest with "times"). Use with components/patterns/FilmPin.tsx. Skill: video-frames.

/**
 * Scroll videos driven by VIDEO TIME (seconds of the source clip), never by frame number.
 * Frames come from scripts/make_frames.py: their manifest lists the video second of every frame ("times"), with
 * extra frames where the video matters most. seekTime(t) finds the two frames around t and draws the later one over
 * the earlier one at the fractional opacity, so playback is smooth at any scroll / record speed.
 *  - phones (< 768px) use the lighter "<folder>-m" set (a 2:3 crop that follows the subject)
 *  - lazy: frames load only when the section is within ~1 screen (or when `loadWhen` is on screen: a still section
 *    earlier on the page, so a burst of loading never lands during another video) (eager for the hero: the loader waits for ALL of them)
 *  - the canvas only redraws when the time changes or new frames arrive
 */

type Manifest = FrameManifest & { times?: number[] };

/** Page background: frames are graded so their black is exactly this, and every edge fades into it. */
const PAGE = "#05080f";

/**
 * Where the video sits in its canvas (the canvas always fills the stage):
 *  x, y  centre of the picture as a fraction of the canvas (default 0.5, 0.5)
 *  h     height of the picture as a fraction of the canvas; omitted = cover the canvas
 *  w     width of the picture as a fraction of the canvas (instead of h), e.g. 1 = exactly the screen width
 *  fit   (instead of x/y/h/w) place by the SUBJECT: `box` is where the subject (product) is in the frame (its envelope over the whole
 *        clip, fractions x0 y0 x1 y1) and `area` the free space it must sit in (CSS px of the canvas, measured from the
 *        page layout); the picture is scaled so the whole subject fits the area and centred on it, on any screen size
 *  fade  soft edges, as a fraction of the picture's width (l, r) / height (t, b): the picture melts into the page
 *        colour over that band, so no edge of the video can ever show as a line
 *  onLayout  called with where the picture landed (CSS px of the canvas), e.g. to put a glow on the can's opening
 */
export type Area = { top: number; bottom: number; left?: number; right?: number };
export type Fit = { box: [number, number, number, number]; area: (canvas: HTMLCanvasElement) => Area };
export type Rect = { x: number; y: number; w: number; h: number };
export type Place = {
  x?: number;
  y?: number;
  h?: number;
  w?: number;
  fit?: Fit;
  fade?: { l?: number; r?: number; t?: number; b?: number };
  onLayout?: (r: Rect) => void;
};

/** Phone nav height + a small gap: the top of every phone area. */
export const NAV_GAP = 66;
/** Position of an element inside the canvas, in CSS px (both move together, pinned or not). */
export const within = (canvas: HTMLElement, sel: string) => {
  const el = canvas.parentElement?.querySelector<HTMLElement>(sel);
  const c = canvas.getBoundingClientRect();
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top - c.top, bottom: r.bottom - c.top, left: r.left - c.left, right: r.right - c.left };
};

/**
 * Where a picture of iw×ih is drawn in a canvas of cw×ch device px (dpr = device px per CSS px).
 * Shared by the player and by anything drawn over the video (the ice pane), so they always line up.
 */
export function layoutFilm(at: Place, cw: number, ch: number, iw: number, ih: number, dpr: number, area?: Area | null): Rect {
  const ir = iw / ih;
  if (at.fit && area) {
    const [x0, y0, x1, y1] = at.fit.box;
    const left = (area.left ?? 16) * dpr;
    const right = (area.right ?? cw / dpr - 16) * dpr;
    const top = area.top * dpr;
    const bottom = Math.max(area.top + 80, area.bottom) * dpr;
    const s = Math.min((right - left) / ((x1 - x0) * iw), (bottom - top) / ((y1 - y0) * ih));
    const w = iw * s;
    const h = ih * s;
    return { x: (left + right) / 2 - ((x0 + x1) / 2) * w, y: (top + bottom) / 2 - ((y0 + y1) / 2) * h, w, h };
  }
  let w: number;
  let h: number;
  if (at.w) {
    w = at.w * cw;
    h = w / ir;
  } else if (at.h) {
    h = at.h * ch;
    w = h * ir;
  } else if (cw / ch > ir) {
    w = cw;
    h = cw / ir;
  } else {
    h = ch;
    w = ch * ir;
  }
  return { x: (at.x ?? 0.5) * cw - w / 2, y: (at.y ?? 0.5) * ch - h / 2, w, h };
}

/** true below 768px, kept up to date: a frame set switch when the window crosses the breakpoint. */
export function usePhone() {
  // read at the first client render (not one render later), so the hero registers with the loader in time
  const [phone, setPhone] = useState<boolean | null>(() =>
    typeof window === "undefined" ? null : window.matchMedia("(max-width: 767px)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const on = () => setPhone(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return phone;
}

export type FilmPlayer = {
  seekTime: (t: number) => void;
  /** The video second currently drawn. */
  time: () => number;
};

export const isPhone = () => typeof window !== "undefined" && window.innerWidth < 768;

export function useFilm(
  folder: string,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  {
    eager = false,
    blockLoader = false,
    initial = 0,
    place,
    loadWhen,
  }: {
    eager?: boolean;
    blockLoader?: boolean;
    initial?: number;
    place?: (phone: boolean) => Place;
    /** start loading when this element is on screen (a calm section earlier on the page) instead of ~1 screen before */
    loadWhen?: string;
  } = {},
) {
  const time = useRef(initial);
  const api = useRef<FilmPlayer>({ seekTime: (t) => (time.current = t), time: () => time.current });
  const phoneNow = usePhone();

  useEffect(() => {
    if (phoneNow === null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const phone = phoneNow;
    const src = phone ? `${folder}-m` : folder;
    const at = place?.(phone) ?? {};
    const taskId = `frames:${src}`;
    if (blockLoader) loading.register(taskId);

    let m: Manifest | null = null;
    let times: number[] = [];
    let player: ReturnType<typeof loadFrames> | null = null;
    let raf = 0;
    let dirty = true;
    let visible = true;
    let cancelled = false;
    let last = { pos: -1, a: undefined as HTMLImageElement | undefined, b: undefined as HTMLImageElement | undefined };

    let dpr = 1;
    let area: Area | null = null;
    let lastRect = "";
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      area = at.fit ? at.fit.area(canvas) : null; // the free space, measured from the page layout
      dirty = true;
    };

    /** Fractional frame index of video second t. */
    const indexOf = (t: number) => {
      if (!times.length) return 0;
      if (t <= times[0]) return 0;
      const n = times.length - 1;
      if (t >= times[n]) return n;
      let lo = 0;
      let hi = n;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (times[mid] <= t) lo = mid;
        else hi = mid;
      }
      return lo + (t - times[lo]) / (times[hi] - times[lo]);
    };

    const render = () => {
      raf = requestAnimationFrame(render);
      if (!m || !player || !visible) return;
      const pos = indexOf(time.current);
      const i = Math.floor(pos);
      const frac = pos - i;
      const a = player.get(i);
      if (!a) return;
      const b = frac > 0.002 && i + 1 < m.count ? player.get(i + 1) : undefined;
      if (!dirty && Math.abs(pos - last.pos) < 0.0005 && a === last.a && b === last.b) return;
      const cw = canvas.width;
      const ch = canvas.height;
      const { x: dx, y: dy, w: dw, h: dh } = layoutFilm(at, cw, ch, a.naturalWidth, a.naturalHeight, dpr, area);
      if (at.onLayout) {
        const key = `${dx}|${dy}|${dw}|${dh}`;
        if (key !== lastRect) {
          lastRect = key;
          at.onLayout({ x: dx / dpr, y: dy / dpr, w: dw / dpr, h: dh / dpr });
        }
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = PAGE;
      ctx.fillRect(0, 0, cw, ch);
      ctx.drawImage(a, dx, dy, dw, dh);
      if (b && b !== a) {
        ctx.globalAlpha = frac;
        ctx.drawImage(b, dx, dy, dw, dh);
        ctx.globalAlpha = 1;
      }
      // soft edges: page colour → transparent over each band (only where the picture's edge is on screen)
      const f = at.fade ?? {};
      const band = (x0: number, y0: number, x1: number, y1: number) => {
        const g = ctx.createLinearGradient(x0, y0, x1, y1);
        g.addColorStop(0, PAGE);
        g.addColorStop(0.35, "rgba(5,8,15,0.72)");
        g.addColorStop(1, "rgba(5,8,15,0)");
        return g;
      };
      if (f.l) {
        const w = f.l * dw;
        ctx.fillStyle = band(dx, 0, dx + w, 0);
        ctx.fillRect(dx, dy, w, dh);
      }
      if (f.r) {
        const w = f.r * dw;
        ctx.fillStyle = band(dx + dw, 0, dx + dw - w, 0);
        ctx.fillRect(dx + dw - w, dy, w, dh);
      }
      if (f.t) {
        const w = f.t * dh;
        ctx.fillStyle = band(0, dy, 0, dy + w);
        ctx.fillRect(dx, dy, dw, w);
      }
      if (f.b) {
        const w = f.b * dh;
        ctx.fillStyle = band(0, dy + dh, 0, dy + dh - w);
        ctx.fillRect(dx, dy + dh - w, dw, w);
      }
      last = { pos, a, b };
      dirty = false;
    };

    api.current.seekTime = (t: number) => {
      time.current = t;
    };

    const start = () => {
      getManifest(src)
        .then((man) => {
          if (cancelled) return;
          m = man as Manifest;
          times = m.times ?? Array.from({ length: m.count }, (_, i) => i / 24);
          const t0 = performance.now();
          player = loadFrames(src, m, (loaded, total) => {
            if (blockLoader) loading.update(taskId, loaded / total); // the loader waits for every hero frame
            // debug (console: __films): how far each folder has loaded
            const w = window as unknown as { __films?: Record<string, string> };
            (w.__films ??= {})[src] = `${loaded}/${total} after ${((performance.now() - t0) / 1000).toFixed(1)} s (started ${(t0 / 1000).toFixed(1)} s)`;
            dirty = true;
          });
        })
        .catch((err) => {
          console.warn(err.message);
          if (blockLoader) loading.update(taskId, 1);
        });
    };

    // lazy: start loading when the section is near; draw only while on screen
    let near: IntersectionObserver | null = null;
    if (eager) start();
    else {
      near = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            near?.disconnect();
            near = null;
            start();
          }
        },
        { rootMargin: loadWhen ? "0px" : "100% 0px 100% 0px" },
      );
      near.observe((loadWhen && document.querySelector(loadWhen)) || canvas);
    }
    const seen = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
      if (visible) dirty = true;
    });
    seen.observe(canvas);

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    // the measured areas depend on the text: measure again once the fonts are in, and after the first layout settles
    document.fonts?.ready.then(() => !cancelled && resize());
    const late = window.setTimeout(resize, 600);
    raf = requestAnimationFrame(render);

    return () => {
      cancelled = true;
      window.clearTimeout(late);
      cancelAnimationFrame(raf);
      ro.disconnect();
      near?.disconnect();
      seen.disconnect();
      player?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folder, canvasRef, eager, blockLoader, phoneNow]);

  return api;
}

/** Record seconds of a film's pin (sum of its segments). */
export const filmSecs = (film: Film) => film.segments.reduce((s, x) => s + x.secs, 0);

/** Pinned scroll length (vh) of a film. */
export const filmPinVh = (film: Film) => Math.round(filmSecs(film) * PIN_VH_PER_SEC);

/** Scroll progress (0..1 of the pin) → video second, piecewise linear through the segments. */
export function filmTimeAt(film: Film, p: number) {
  const total = filmSecs(film);
  let acc = 0;
  let from = film.start;
  const q = Math.min(1, Math.max(0, p)) * total;
  for (const s of film.segments) {
    if (q <= acc + s.secs) return from + ((q - acc) / s.secs) * (s.to - from);
    acc += s.secs;
    from = s.to;
  }
  return from;
}

/** Scroll progress (0..1) at the end of each segment (where the record-mode stops sit). */
export function filmStops(film: Film) {
  const total = filmSecs(film);
  let acc = 0;
  return film.segments.map((s) => {
    acc += s.secs;
    return { p: acc / total, secs: s.secs, label: s.label };
  });
}
