"use client";
// PR11 restyled (A · Collections-2 card fan): the ink festive band; five set cards around the title. M449 on hover
// (Round 4 review): the cards rest in one stack; hovering the deck spreads them into the fan, and the hovered card
// scales up (1.12×) and lifts while its neighbours move aside. The fan stays open while the pointer moves between
// cards and folds back into the stack shortly after it leaves. In ?record=1 the cursor opens it on the centre card,
// then lifts the next one. A warm glow drifts behind the deck. ?static=1: fanned.
import { useEffect, useRef, useState } from "react";
import { festive } from "../content";
import { useEnter } from "./useEnter";
import { prefersReducedMotion } from "@/lib/gsap";

const DEMO = [2, 3]; // the cards the record cursor visits, in order

export default function FestiveFan() {
  const root = useRef<HTMLElement>(null);
  const [hot, setHot] = useState<number | null>(null); // the hovered card
  const [open, setOpen] = useState(false); // the fan is spread
  const close = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (prefersReducedMotion()) setOpen(true);
    return () => {
      if (close.current) clearTimeout(close.current);
    };
  }, []);
  const enter = (i: number) => {
    if (close.current) clearTimeout(close.current);
    setHot(i);
    setOpen(true);
  };
  const leave = () => {
    setHot(null);
    if (close.current) clearTimeout(close.current);
    close.current = setTimeout(
      () => !prefersReducedMotion() && setOpen(false),
      1100,
    );
  };
  useEnter(
    root,
    (tl, q) => {
      tl.from(
        q("[data-festive-head] > *"),
        { y: 40, opacity: 0, duration: 0.7, stagger: 0.1, ease: "power3.out" },
        0,
      ).from(
        q("[data-fan]"),
        { y: 120, opacity: 0, duration: 0.9, ease: "power3.out" },
        0.15,
      );
    },
    { start: "top 70%" },
  );
  return (
    <section
      ref={root}
      className="relative h-[1000px] overflow-hidden bg-[linear-gradient(#2b2117,#3a2a1a)] pt-[110px] text-center text-[var(--paper)]"
      data-section="festive"
      data-record-time="0.9"
      data-record-hold="1.1"
      data-record-label="Festive"
    >
      <div
        className="absolute left-0 top-[16px] h-px w-px"
        data-record-time="0.3"
        data-record-hold="1.0"
        data-record-label="Festive · 2nd card"
      />
      <div
        className="kj-glow-drift pointer-events-none absolute left-1/2 top-[300px] h-[700px] w-[1100px] -translate-x-1/2 rounded-full"
        aria-hidden
      />
      <div className="relative" data-festive-head>
        <div className="kj-script text-[56px] leading-none text-[var(--gold-light)]">
          {festive.script}
        </div>
        <h2 className="kj-display mt-3 text-[104px] leading-none">
          {festive.title}
        </h2>
        <p className="mt-4 text-[17px] text-[#d8cbb6]">{festive.offer}</p>
      </div>
      <div className="absolute left-1/2 top-[420px]" data-fan>
        {festive.cards.map((c, i) => {
          const d = i - 2;
          const isHot = hot === i;
          // fanned: the arc; the hovered card lifts and grows, the others step aside
          const aside = hot === null || isHot ? 0 : i < hot ? -46 : 46;
          const transform = open
            ? `translateX(${d * 236 + aside}px) translateY(${Math.abs(d) * 34 - (isHot ? 34 : 0)}px) rotate(${d * (isHot ? 4 : 7)}deg) scale(${isHot ? 1.12 : d === 0 ? 1.02 : 0.92})`
            : `translateX(${d * 16}px) translateY(${Math.abs(d) * 6}px) rotate(${d * 3}deg) scale(${d === 0 ? 1 : 0.95})`;
          return (
            <figure
              key={c.name}
              onMouseEnter={() => enter(i)}
              onMouseLeave={leave}
              className="absolute -ml-[140px] h-[420px] w-[280px] overflow-hidden rounded-[22px] bg-[#1a120b] transition-[transform,box-shadow] duration-[650ms] ease-[cubic-bezier(.22,1,.36,1)]"
              style={{
                transform,
                zIndex: isHot ? 20 : 10 - Math.abs(d),
                boxShadow: isHot
                  ? "0 60px 90px rgba(0,0,0,.6), 0 0 0 1px rgba(201,160,74,.6)"
                  : "0 30px 60px rgba(0,0,0,.45)",
              }}
              {...(DEMO.includes(i)
                ? {
                    "data-hover-demo": "",
                    "data-hover-hold": "0.9",
                    "data-hover-at": "0.5,0.35",
                    "data-hover-label": `Festive card ${DEMO.indexOf(i) + 1}`,
                  }
                : {})}
              data-fan-card
              data-cursor="View set"
            >
              <img
                src={c.image}
                alt={c.name}
                className="h-full w-full object-cover"
              />
              <figcaption
                className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(26,18,11,.92)] to-transparent pb-5 pt-16 transition-opacity duration-500 ${d < 0 ? "pl-5 pr-16 text-left" : d > 0 ? "pl-16 pr-5 text-right" : "px-5 text-left"}`}
                style={{ opacity: open || d === 0 ? 1 : 0 }}
              >
                <div className="kj-display text-[26px] leading-tight">
                  {c.name}
                </div>
                <div className="kj-num mt-1 text-[14px] text-[#d8cbb6]">
                  {c.price}
                </div>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
