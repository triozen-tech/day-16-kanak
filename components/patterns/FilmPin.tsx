"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { onSiteReady } from "@/lib/loading";
import { filmPinVh, filmStops, filmTimeAt, useFilm, type Film, type FilmPlayer, type Place } from "@/lib/film";

/**
 * A pinned scroll video: the section is 100svh + the film's pin length; the stage sticks while the scroll plays the
 * video by its segments (video time, not frames). Record mode: the section top is a stop (`arrive` seconds), then one
 * invisible stop at the end of every segment, so each part of the video gets exactly its planned seconds.
 * ?static=1: no pin, the stage shows the film's poster second (its final picture).
 * Overlays are children; `onTime(videoSecond, progress)` runs on every scroll update (and once with the poster).
 */
export default function FilmPin({
  id,
  film,
  arrive,
  eager = false,
  blockLoader = false,
  className = "",
  canvasClass = "absolute inset-0 h-full w-full",
  onTime,
  playerRef,
  children,
  before,
  place,
  loadWhen,
  intro,
}: {
  id: string;
  film: Film;
  /** record seconds to scroll from the previous stop to this section's top */
  arrive: number;
  eager?: boolean;
  blockLoader?: boolean;
  className?: string;
  canvasClass?: string;
  onTime?: (t: number, p: number) => void;
  playerRef?: React.MutableRefObject<FilmPlayer | null>;
  children?: React.ReactNode;
  /** rendered under the canvas (backgrounds) */
  before?: React.ReactNode;
  /** where the video sits in the stage + its soft edges (laptop / phone) */
  place?: (phone: boolean) => Place;
  /** start loading the frames when this element is on screen (see useFilm) */
  loadWhen?: string;
  /** hero only: once the loader has gone the video plays by itself up to `to` seconds over `secs`; the scroll takes over
   *  as soon as it is further along (the shown time is the later of the two), so the first frame never waits */
  intro?: { to: number; secs: number };
}) {
  const outer = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const player = useFilm(film.frames, canvas, { eager, blockLoader, initial: film.start, place, loadWhen });
  const cb = useRef(onTime);
  cb.current = onTime;
  const pinVh = filmPinVh(film);

  useEffect(() => {
    if (playerRef) playerRef.current = player.current;
    if (prefersReducedMotion()) {
      player.current.seekTime(film.poster);
      cb.current?.(film.poster, 1);
      return;
    }
    const auto = { t: film.start };
    let lastP = 0;
    const apply = (p: number) => {
      lastP = p;
      const t = Math.max(filmTimeAt(film, p), auto.t);
      player.current.seekTime(t);
      cb.current?.(t, p);
    };
    apply(0);
    const st = ScrollTrigger.create({
      trigger: outer.current!,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => apply(self.progress),
      onRefresh: (self) => apply(self.progress),
    });
    const offIntro = intro
      ? onSiteReady(() => {
          gsap.to(auto, { t: intro.to, duration: intro.secs, ease: "sine.out", onUpdate: () => apply(lastP) });
        })
      : () => {};
    return () => {
      offIntro();
      st.kill();
    };
  }, [film, player, playerRef, intro]);

  const stops = filmStops(film);

  return (
    <section
      ref={outer}
      id={id}
      data-chapter={id}
      className={`pin-outer ${className}`}
      style={{ height: `calc(100svh + ${pinVh}vh)` }}
      data-record-time={arrive}
      data-record-label={id}
    >
      {stops.map((s) => (
        <div
          key={s.label}
          aria-hidden
          className="rec-stop pointer-events-none absolute left-0 h-px w-px"
          style={{ top: `${(pinVh * s.p).toFixed(2)}vh` }}
          data-record-time={s.secs}
          data-record-label={s.label}
        />
      ))}
      <div className="pin-stage">
        {before}
        <canvas ref={canvas} className={canvasClass} aria-hidden />
        {children}
      </div>
    </section>
  );
}
