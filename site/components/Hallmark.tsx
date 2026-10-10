"use client";
// SP06 restyled (ours): a centred BIS seal with a ring of text, four promises, and the gold rate, always labelled as a
// sample. M103: the text ring turns all the time. X18 stamp-pop: as the section arrives (its arch flattening over the
// product) the seal stamps down once it is on screen, and the soft gold shock ring fires the moment it lands; then the four promises rise in turn and the rate pill
// pulses once. A broad warm light keeps the hold alive. ?static=1: all in place.
import { useRef } from "react";
import { trust, RATE, inr, SAMPLE_NOTE } from "../content";
import { useEnter } from "./useEnter";

export default function Hallmark() {
  const ring = trust.ring.repeat(2);
  const root = useRef<HTMLElement>(null);
  useEnter(
    root,
    (tl, q) => {
      tl.from(q("[data-seal]"), {
        scale: 1.45,
        opacity: 0,
        duration: 0.45,
        ease: "power3.in",
      })
        .fromTo(
          q("[data-shock]"),
          { scale: 0.6, opacity: 0.9 },
          // immediateRender off: a paused fromTo would otherwise paint the ring at once, on an empty screen
          {
            scale: 2.6,
            opacity: 0,
            duration: 1.1,
            ease: "power2.out",
            immediateRender: false,
          },
          ">",
        )
        .fromTo(
          q("[data-seal]"),
          { y: 6 },
          { y: 0, duration: 0.35, ease: "power2.out", immediateRender: false },
          "<",
        )
        .from(
          q("[data-promise]"),
          {
            y: 46,
            opacity: 0,
            duration: 0.7,
            stagger: 0.16,
            ease: "power3.out",
          },
          "<0.1",
        )
        .from(
          q("[data-rate]"),
          { y: 24, opacity: 0, duration: 0.5, ease: "power3.out" },
          "<0.45",
        )
        .to(q("[data-rate]"), {
          scale: 1.06,
          duration: 0.3,
          yoyo: true,
          repeat: 1,
          ease: "sine.inOut",
        });
    },
    { start: "center 72%", trigger: "[data-seal]", arch: true },
  );
  return (
    <section
      ref={root}
      className="kj-arch-top relative z-10 -mt-[40px] overflow-hidden bg-[var(--paper)] pb-[120px] pt-[150px] text-center"
      data-section="trust"
      data-record-time="0.9"
      data-record-hold="1.2"
      data-record-label="Trust"
    >
      <div
        className="kj-band"
        style={{
          ["--band" as string]: "rgba(214, 168, 88, 0.3)",
          ["--band-blend" as string]: "multiply",
        }}
        aria-hidden
      />
      <div className="relative mx-auto h-[340px] w-[340px]">
        <div
          className="pointer-events-none absolute inset-0 rounded-full opacity-0"
          style={{
            background:
              "radial-gradient(circle, transparent 52%, rgba(201,160,74,.45) 62%, transparent 72%)",
          }}
          data-shock
          aria-hidden
        />
        <div className="absolute inset-0" data-seal>
          <svg
            viewBox="0 0 340 340"
            className="kj-spin absolute inset-0 h-full w-full"
            data-seal-ring
            aria-hidden
          >
            <defs>
              <path
                id="kj-ring"
                d="M170,170 m-138,0 a138,138 0 1,1 276,0 a138,138 0 1,1 -276,0"
              />
            </defs>
            <circle
              cx="170"
              cy="170"
              r="166"
              fill="none"
              stroke="var(--gold-light)"
              strokeWidth="1.5"
            />
            <circle
              cx="170"
              cy="170"
              r="112"
              fill="none"
              stroke="var(--kj-line)"
            />
            <text
              fontSize="15"
              letterSpacing="5.2"
              fill="var(--gold)"
              fontFamily="Figtree Variable, sans-serif"
              fontWeight="600"
            >
              <textPath href="#kj-ring">{ring}</textPath>
            </text>
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div>
              <div className="kj-eyebrow text-[12px]">BIS hallmark</div>
              <div className="kj-display text-[120px] leading-[0.9] text-[var(--gold)]">
                {trust.seal}
              </div>
              <div className="kj-eyebrow text-[12px]">22 karat</div>
            </div>
          </div>
        </div>
      </div>
      <div
        className="mx-auto mt-14 grid w-[1080px] grid-cols-4 gap-10"
        data-promises
      >
        {trust.promises.map(([b, s]) => (
          <div key={b} data-promise>
            <div className="kj-display text-[30px]">{b}</div>
            <div className="mt-1 text-[15px] text-[var(--muted)]">{s}</div>
          </div>
        ))}
      </div>
      <div
        className="mt-12 inline-flex items-center gap-4 rounded-full border border-dashed border-[var(--gold-light)] px-6 py-3 text-[15px]"
        data-rate
      >
        <span>
          22K <b className="kj-num">{inr(RATE["22K"])} / g</b> · 18K{" "}
          <b className="kj-num">{inr(RATE["18K"])} / g</b>
        </span>
        <em className="rounded-full bg-[var(--sand)] px-3 py-1 text-[12px] not-italic tracking-[0.06em]">
          {SAMPLE_NOTE}
        </em>
      </div>
    </section>
  );
}
