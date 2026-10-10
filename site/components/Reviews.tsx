"use client";
// SP02 restyled (ours): three paper cards, gold stars, Italiana quotes, no faces. M117: the cards rise in turn and a
// soft gold highlight sweeps behind each marked phrase, left to right. Hover: a gold hairline frame draws round a card
// (by hand only; the reel keeps its hover moments for the shop sections). X29 curved-edge cover: the paper sheet slides
// over the festive band on an arch that flattens as it passes. ?static=1: highlighted.
import { useRef } from "react";
import { reviews } from "../content";
import { useEnter } from "./useEnter";

export default function Reviews() {
  const root = useRef<HTMLElement>(null);
  useEnter(
    root,
    (tl, q) => {
      tl.from(
        q("[data-review]"),
        { y: 70, opacity: 0, duration: 0.8, stagger: 0.14, ease: "power3.out" },
        0,
      ).fromTo(
        q("[data-mark]"),
        { backgroundSize: "0% 100%" },
        {
          backgroundSize: "100% 100%",
          duration: 0.8,
          stagger: 0.25,
          ease: "power2.inOut",
        },
        0.45,
      );
    },
    { start: "top 75%", arch: true },
  );
  return (
    <section
      ref={root}
      className="kj-arch-top relative z-10 -mt-[40px] bg-[var(--paper)] px-16 pb-[130px] pt-[140px] text-center"
      data-section="reviews"
      data-record-time="2.1"
      data-record-label="Reviews"
    >
      <div className="kj-eyebrow">{reviews.eyebrow}</div>
      <h2 className="kj-display mt-4 text-[68px]">{reviews.title}</h2>
      <div className="mt-14 grid grid-cols-3 gap-10">
        {reviews.items.map((r) => {
          const [a, b] = r.quote.split(r.mark);
          return (
            <figure
              key={r.who}
              data-review
              className="kj-card group relative px-9 py-9 transition-shadow duration-500 hover:shadow-[0_0_0_1px_var(--kj-line),0_34px_60px_rgba(90,62,22,.16)]"
            >
              {/* a gold hairline frame draws round the card on hover */}
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                aria-hidden
              >
                <rect
                  x="0.75"
                  y="0.75"
                  width="99.8%"
                  height="99.6%"
                  rx="19"
                  fill="none"
                  stroke="var(--gold)"
                  strokeWidth="1.5"
                  pathLength={1}
                  strokeDasharray="1 1"
                  className="[stroke-dashoffset:1] transition-[stroke-dashoffset] duration-[900ms] ease-[cubic-bezier(.65,0,.35,1)] group-hover:[stroke-dashoffset:0]"
                />
              </svg>
              <div className="tracking-[0.2em] text-[var(--gold-light)]">
                ★★★★★
              </div>
              <blockquote className="kj-display mt-4 text-[30px] leading-[1.2]">
                <span className="kj-quote">“</span>
                {a}
                <mark
                  className="bg-transparent bg-[linear-gradient(transparent_55%,rgba(201,160,74,.38)_55%)] bg-no-repeat px-0.5 text-inherit [background-size:100%_100%] [box-decoration-break:clone]"
                  data-mark
                >
                  {r.mark}
                </mark>
                {b}
                <span className="kj-quote">”</span>
              </blockquote>
              <figcaption className="mt-5 text-[14px] text-[var(--muted)]">
                {r.who}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
