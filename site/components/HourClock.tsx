"use client";
// GL26 restyled as the signature clock (A · shop-2 clock + shop-1 hover card) · M445 scroll-scrubbed hand (Round 4
// review). Pinned for 180vh. The dial and its twelve daily-wear pieces stay still; the LONG hand moves with the scroll
// from piece to piece and snaps to a stop (1 → 3 → 4 o'clock: hold, move, hold, move, hold). The piece it stops on
// lights up and lifts, and its card (name · 22K · grams · ₹ · Add to bag) sits right beside it, tied by a gold hairline;
// on the next stop the card slides to sit beside the new piece. The short hand creeps 1/12 as fast. Hover lights any
// piece by hand. In ?record=1 the cursor lifts the 1 and 4 o'clock pieces and clicks Add to bag at 3 o'clock (the Bag
// count goes up). The lilac of Gifting washes to ivory as the clock arrives (X2). ?static=1: the hand on 4 o'clock.
import { useEffect, useRef, useState } from "react";
import { clock, hours, priceOf, inr, collections } from "../content";
import { ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

const DIAL = 720;
const C = DIAL / 2;
const R = 284; // piece ring radius
const PIECE = 120;
const PIN_VH = 180;
const CARD_GAP = 24; // card's left edge: this far right of the dial
const STOPS_H = [1, 3, 4]; // the hours the long hand stops on
// scroll progress → the hand's hour: hold · move · hold · move · hold (the hand snaps: eased into each stop)
const SEG: [number, number, number, number][] = [
  [0, 0.22, 1, 1],
  [0.22, 0.42, 1, 3],
  [0.42, 0.66, 3, 3],
  [0.66, 0.8, 3, 4],
  [0.8, 1, 4, 4],
];
const ease = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function hourAt(p: number) {
  for (const [a, b, h0, h1] of SEG)
    if (p <= b)
      return h0 + (h1 - h0) * ease(Math.min(1, Math.max(0, (p - a) / (b - a))));
  return STOPS_H[STOPS_H.length - 1];
}
// record stops (fractions of the pin) in the middle of each hold; 3 o'clock holds longer for the Add to bag click
const STOPS = [
  { p: 0.11, time: "0.8", hold: "0.8", label: "Clock 1" },
  { p: 0.54, time: "0.7", hold: "1.3", label: "Clock 3 · bag" },
  { p: 0.9, time: "0.6", hold: "0.8", label: "Clock 4" },
];
const pos = (k: number) => {
  const a = ((k * 30 - 90) * Math.PI) / 180;
  return { x: C + R * Math.cos(a), y: C + R * Math.sin(a) };
};

export default function HourClock() {
  const [hand, setHand] = useState(STOPS_H[0]); // the long hand's hour (fractional while moving)
  const [hover, setHover] = useState<number | null>(null);
  const [added, setAdded] = useState<Record<number, boolean>>({});
  const outer = useRef<HTMLDivElement>(null);
  const minute = useRef<HTMLSpanElement>(null);
  const hourHand = useRef<HTMLSpanElement>(null);
  const sticky = useRef<HTMLElement>(null);

  const apply = (h: number) => {
    if (minute.current) minute.current.style.rotate = `${h * 30}deg`;
    if (hourHand.current)
      hourHand.current.style.rotate = `${300 + (h * 30) / 12}deg`;
  };

  useEffect(() => {
    const last = STOPS_H[STOPS_H.length - 1];
    if (prefersReducedMotion()) {
      setHand(last);
      apply(last);
      return;
    }
    apply(STOPS_H[0]);
    const st = ScrollTrigger.create({
      trigger: outer.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        const h = hourAt(self.progress);
        apply(h);
        setHand(Math.round(h * 100) / 100);
      },
    });
    // X2 colour wash: the dial arrives on the last collection's lilac, which washes out to ivory as it reaches the top
    const wash = ScrollTrigger.create({
      trigger: outer.current,
      start: "top bottom",
      end: "top top",
      onUpdate: (self) =>
        sticky.current?.style.setProperty("--wash", self.progress.toFixed(4)),
    });
    return () => {
      st.kill();
      wash.kill();
    };
  }, []);

  // the stop the hand rests on (null while it moves); the card keeps the last stop until the next one is reached
  const atStop = STOPS_H.find((k) => Math.abs(hand - k) < 0.02) ?? null;
  const lastStop = useRef(STOPS_H[0]);
  if (atStop !== null) lastStop.current = atStop;
  const lit = hover ?? atStop; // lit + lifted piece
  const cardK = hover ?? lastStop.current;
  const p = hours[cardK];
  const price = priceOf(p.grams);
  const cardY = pos(lastStop.current).y; // the card sits beside the stop piece (hover only swaps its content)
  const lineX = pos(lastStop.current).x + PIECE / 2 + 6;

  return (
    <div
      ref={outer}
      id="hours"
      className="relative"
      style={{ height: `${100 + PIN_VH}vh` }}
      data-section="clock"
    >
      {STOPS.map((s) => (
        <div
          key={s.label}
          className="absolute left-0 h-px w-px"
          style={{ top: `${s.p * PIN_VH}vh` }}
          data-record-time={s.time}
          data-record-hold={s.hold}
          data-record-label={s.label}
        />
      ))}
      <section
        ref={sticky}
        className="sticky top-0 h-screen min-h-[900px] overflow-hidden"
        style={{
          ["--wash" as string]: "1",
          background: `color-mix(in srgb, ${collections[collections.length - 1].tint} calc((1 - var(--wash)) * 100%), var(--ivory))`,
        }}
      >
        <div
          className="kj-band"
          style={{
            ["--band" as string]: "rgba(214, 168, 88, 0.3)",
            ["--band-blend" as string]: "multiply",
          }}
          aria-hidden
        />
        <div className="absolute left-16 top-[120px] z-10 w-[296px]">
          <div className="kj-eyebrow">{clock.eyebrow}</div>
          <h2 className="kj-display mt-4 text-[64px] leading-[1]">
            {clock.title[0]}
            <br />
            {clock.title[1]}
          </h2>
          <p className="mt-5 text-[17px] text-[var(--muted)]">{clock.copy}</p>
        </div>

        {/* dial centred at 50% + 60px: left edge 420px, a 56px gap after the 364px text column */}
        <div
          className="absolute top-1/2 rounded-full"
          style={{
            left: `calc(50% + 60px - ${C}px)`,
            width: DIAL,
            height: DIAL,
            marginTop: -C,
            background: "radial-gradient(circle, #fffaf2 0, #f3e8d6 70%)",
            boxShadow: "inset 0 0 0 1px var(--kj-line)",
          }}
          data-dial
        >
          {hours.map((_, k) => (
            <span
              key={k}
              className="absolute h-[20px] w-[2px] bg-[var(--gold-light)]"
              style={{
                left: C - 1,
                top: C,
                transform: `rotate(${k * 30 + 15}deg) translateY(-${C - 8}px)`,
                transformOrigin: "50% 0",
              }}
            />
          ))}
          {/* the twelve pieces, still */}
          {hours.map((h, k) => {
            const { x, y } = pos(k);
            const on = k === lit;
            const demo = atStop === k && k !== 3 && hover === null; // the cursor lifts the 1 and 4 o'clock pieces
            return (
              <button
                key={h.id}
                type="button"
                onMouseEnter={() => setHover(k)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(k)}
                onBlur={() => setHover(null)}
                className="group absolute rounded-full transition-[translate] duration-500 ease-[cubic-bezier(.22,1,.36,1)]"
                style={{
                  width: PIECE,
                  height: PIECE,
                  left: `${Math.round(x - PIECE / 2)}px`,
                  top: `${Math.round(y - PIECE / 2)}px`,
                  translate: on ? "0 -8px" : "0 0",
                  zIndex: on ? 2 : 1,
                }}
                aria-label={`${k === 0 ? 12 : k} o'clock: ${h.name}`}
                {...(demo
                  ? {
                      "data-hover-demo": "",
                      "data-hover-hold": "0.9",
                      "data-hover-at": "0.5,0.6",
                      "data-hover-label": `${k} o'clock`,
                    }
                  : {})}
                data-hour={k}
                data-cursor="Shop"
              >
                <span
                  className="absolute inset-[-18px] rounded-full transition-opacity duration-500"
                  style={{
                    background:
                      "radial-gradient(circle, var(--gold-glow), transparent 68%)",
                    opacity: on ? 1 : 0,
                  }}
                />
                <img
                  src={h.image}
                  alt=""
                  className="relative h-full w-full object-contain transition-[scale,filter] duration-500"
                  style={{
                    scale: String(h.size * (on ? 1.16 : 1)),
                    filter: on
                      ? "drop-shadow(0 14px 14px rgba(90,60,20,.28))"
                      : "none",
                  }}
                  data-piece-img
                />
              </button>
            );
          })}
          {/* hands: a short thick hour hand pointing up at the lit piece, a long thin minute hand */}
          <span
            ref={hourHand}
            className="absolute rounded-full bg-gradient-to-b from-[#c9a04a] to-[#6e4a10]"
            style={{
              rotate: "302.5deg",
              left: C - 5,
              top: C - 150,
              width: 10,
              height: 150,
              transformOrigin: "50% 100%",
            }}
            data-hand-hour
          />
          <span
            ref={minute}
            className="absolute rounded-full bg-gradient-to-b from-[#d9b25e] to-[#7a5212]"
            style={{
              left: C - 1.5,
              top: C - 226,
              width: 3,
              height: 226,
              transformOrigin: "50% 100%",
              rotate: "30deg",
            }}
            data-hand-minute
          />
          <span
            className="absolute h-7 w-7 rounded-full"
            style={{
              left: C - 14,
              top: C - 14,
              background:
                "radial-gradient(circle at 35% 30%, #f3d27a, #7a5212)",
            }}
          />
        </div>

        {/* a gold hairline ties the stop piece to its card */}
        <span
          className="pointer-events-none absolute z-[5] h-px bg-[var(--gold-light)] transition-[top,left,width,opacity] duration-[550ms] ease-[cubic-bezier(.65,0,.35,1)]"
          style={{
            top: `calc(50% - ${C}px + ${Math.round(cardY)}px)`,
            left: `calc(50% + 60px - ${C}px + ${Math.round(lineX)}px)`,
            width: Math.round(DIAL + CARD_GAP - lineX),
            opacity: atStop === null ? 0 : 1,
          }}
          aria-hidden
        />
        <div
          className="kj-card absolute z-10 w-[246px] -translate-y-1/2 px-6 py-5 transition-[top] duration-[550ms] ease-[cubic-bezier(.65,0,.35,1)]"
          style={{
            left: `calc(50% + 60px + ${C}px + ${CARD_GAP}px)`,
            top: `calc(50% - ${C}px + ${Math.round(cardY)}px)`,
          }}
          data-hour-card
        >
          <div className="kj-eyebrow whitespace-nowrap text-[12px] tracking-[0.14em]">
            {cardK === 0 ? 12 : cardK} o&apos;clock · {p.type}
          </div>
          <div className="kj-display mt-2 text-[30px] leading-tight">
            {p.name}
          </div>
          <div className="kj-num mt-1 text-[15px] text-[var(--muted)]">
            22K · {p.grams} g · {inr(price.total)}
          </div>
          <button
            type="button"
            className="kj-btn mt-4 px-5 py-3 text-[13px]"
            onClick={() => {
              setAdded((a) => ({ ...a, [cardK]: true }));
              window.dispatchEvent(new CustomEvent("kj:add"));
            }}
            {...(atStop === 3 && hover === null && !added[3]
              ? {
                  "data-hover-demo": "click",
                  "data-hover-hold": "1.2",
                  "data-hover-at": "0.86,0.6",
                  "data-hover-label": "Clock · Add to bag",
                }
              : {})}
          >
            {added[cardK] ? "Added ✓" : "Add to bag"}
          </button>
        </div>
      </section>
    </div>
  );
}
