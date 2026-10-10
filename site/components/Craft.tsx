"use client";
// PD03 restyled (ours): five steps as gold line drawings of tools, never hands. M251: left to right, each card's gold
// frame draws itself clockwise, the tool drawing writes in, a warm wash fills the card and its label rises (on the
// clock from arrival, so all five land inside the record hold). X1 overlap slide: the section slides up over the
// trust band on a rounded top. ?static=1: all drawn.
import { useRef } from "react";
import { craft } from "../content";
import { useEnter } from "./useEnter";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { useEffect } from "react";

const TOOLS = [
  // 01 sketch: a sheet with the necklace drawn on it + a pencil
  <g key="s">
    <rect
      x="32"
      y="16"
      width="148"
      height="132"
      rx="4"
      transform="rotate(-4 106 82)"
    />
    <path d="M60 46 q45 74 92 0" className="kj-gold" strokeDasharray="1 5" />
    <circle cx="59.0" cy="78.0" r="2.6" className="kj-gold kj-fill" />
    <circle cx="61.8" cy="66.4" r="2.6" className="kj-gold kj-fill" />
    <circle cx="69.8" cy="56.1" r="2.6" className="kj-gold kj-fill" />
    <circle cx="82.0" cy="48.6" r="2.6" className="kj-gold kj-fill" />
    <circle cx="97.0" cy="44.5" r="2.6" className="kj-gold kj-fill" />
    <circle cx="113.0" cy="44.5" r="2.6" className="kj-gold kj-fill" />
    <circle cx="128.0" cy="48.6" r="2.6" className="kj-gold kj-fill" />
    <circle cx="140.2" cy="56.1" r="2.6" className="kj-gold kj-fill" />
    <circle cx="148.2" cy="66.4" r="2.6" className="kj-gold kj-fill" />
    <circle cx="151.0" cy="78.0" r="2.6" className="kj-gold kj-fill" />
    <path d="M105 82 q-11 11 0 26 q11 -15 0 -26z" className="kj-gold" />
    <path d="M100 96 q5 -6 10 0" className="kj-gold" />
    <path d="M146 158 L212 92 l12 12 L158 170z M212 92 l8 -8 l12 12 l-8 8 M146 158 l-6 16 l18 -4" />
  </g>,
  // 02 wax: a carved wax block with a peacock curl + a carving knife
  <g key="w">
    <path d="M38 66 l70 -26 l78 22 l-70 30z M38 66 v54 l78 34 v-60 M186 62 v52 l-70 40" />
    <path
      d="M86 70 q14 -16 30 -4 q12 12 -2 20 q-12 4 -14 -8 q0 -8 10 -6"
      className="kj-gold"
    />
    <path d="M70 76 q8 -4 16 0 M126 82 q8 -6 16 -2" className="kj-gold" />
    <path d="M196 28 l26 -14 l6 8 l-26 14z M202 34 l-14 22 l-4 -2 l12 -24" />
  </g>,
  // 03 cast: tongs tilt a crucible, a gold stream fills the mould
  <g key="c">
    <path d="M60 30 h66 l-10 46 h-46z" transform="rotate(28 93 53)" />
    <path d="M30 18 l46 22 M34 34 l42 16" />
    <path
      d="M128 70 q10 16 8 40"
      className="kj-gold"
      strokeWidth="5"
      strokeLinecap="round"
    />
    <rect x="104" y="112" width="74" height="46" rx="6" />
    <path
      d="M141 120 q-12 10 0 26 q12 -16 0 -26z"
      className="kj-gold kj-fill"
    />
    <path
      d="M60 162 q8 -10 0 -18 q10 6 6 18 M84 162 q8 -12 0 -20 q10 8 6 20"
      className="kj-gold"
    />
  </g>,
  // 04 set: a loupe over a pendant setting, tweezers placing a pearl
  <g key="t">
    <path d="M70 70 q-20 22 0 54 q20 -32 0 -54z" className="kj-gold" />
    <path d="M70 82 q-10 14 0 30 q10 -16 0 -30z" className="kj-gold kj-fill" />
    <path d="M58 68 l-6 -6 M82 68 l6 -6 M54 104 l-8 4 M86 104 l8 4" />
    <circle cx="70" cy="96" r="44" />
    <path d="M101 127 l30 30" strokeWidth="6" strokeLinecap="round" />
    <path d="M226 28 l-70 52 M232 36 l-72 48" />
    <circle cx="150" cy="88" r="7" className="kj-gold" />
  </g>,
  // 05 polish: an agate burnisher on a bangle, a soft gleam where it touches
  <g key="p">
    <ellipse cx="96" cy="104" rx="70" ry="40" />
    <ellipse cx="96" cy="104" rx="56" ry="29" className="kj-gold" />
    <path d="M150 74 l52 -48 M160 82 l50 -46" />
    <path d="M150 74 q-14 2 -12 16 q12 -2 22 -8z" className="kj-gold kj-fill" />
    <path
      d="M128 70 q-6 -10 -16 -14 M120 82 q-12 -4 -22 0 M134 90 q-4 10 -2 18"
      className="kj-gold"
    />
    <path d="M30 86 q-10 18 4 40" className="kj-gold" strokeDasharray="2 6" />
  </g>,
];

export default function Craft() {
  const root = useRef<HTMLElement>(null);
  useEnter(
    root,
    (tl, q) => {
      const steps = q("[data-step]");
      steps.forEach((st, i) => {
        const at = i * 0.36;
        const frame = st.querySelector("[data-frame]");
        const lines = st.querySelectorAll(
          "svg[data-tool] path, svg[data-tool] rect, svg[data-tool] circle, svg[data-tool] ellipse",
        );
        tl.fromTo(
          frame,
          { strokeDashoffset: 1 },
          { strokeDashoffset: 0, duration: 0.6, ease: "power2.inOut" },
          at,
        )
          .from(
            lines,
            { drawSVG: "0%", duration: 0.7, stagger: 0.02, ease: "power2.out" },
            at + 0.25,
          )
          .fromTo(
            st.querySelector("[data-wash]"),
            { scaleY: 0 },
            { scaleY: 1, duration: 0.7, ease: "power3.inOut" },
            at + 0.3,
          )
          .from(
            st.querySelectorAll("[data-label]"),
            {
              y: 22,
              opacity: 0,
              duration: 0.5,
              stagger: 0.06,
              ease: "power3.out",
            },
            at + 0.45,
          );
      });
    },
    { start: "top 45%" },
  );
  // X1: slide up over the trust band as it arrives
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const tw = gsap.fromTo(
      el,
      { y: 90 },
      {
        y: 0,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "top 35%",
          scrub: true,
        },
      },
    );
    return () => {
      tw.scrollTrigger?.kill();
      tw.kill();
    };
  }, []);
  return (
    <section
      ref={root}
      className="relative z-20 -mt-[44px] overflow-x-clip rounded-t-[44px] bg-[var(--ivory)] px-16 pb-[230px] pt-[120px] shadow-[0_-24px_50px_rgba(90,62,22,.10)]"
      data-section="craft"
      data-record-time="0.9"
      data-record-hold="1.3"
      data-record-offset="-90"
      data-record-label="Craft"
    >
      <div
        className="kj-band"
        style={{
          ["--band" as string]: "rgba(214, 168, 88, 0.26)",
          ["--band-blend" as string]: "multiply",
        }}
        aria-hidden
      />
      <div className="kj-eyebrow">{craft.eyebrow}</div>
      <h2 className="kj-display mt-4 w-[720px] text-[76px] leading-[1]">
        {craft.title}
      </h2>
      <div className="mt-16 grid grid-cols-5 gap-6">
        {craft.steps.map(([b, p], i) => (
          <div
            key={b}
            className="relative overflow-hidden rounded-[18px] px-5 pb-6 pt-5"
            style={{ boxShadow: "inset 0 0 0 1px var(--kj-line)" }}
            data-step
          >
            <div
              className="absolute inset-0 origin-bottom bg-[linear-gradient(180deg,rgba(243,230,204,.25),rgba(233,214,176,.85))]"
              data-wash
              aria-hidden
            />
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
              aria-hidden
            >
              <rect
                x="1"
                y="1"
                width="99.6%"
                height="99.6%"
                rx="17"
                fill="none"
                stroke="var(--gold)"
                strokeWidth="1.6"
                pathLength={1}
                strokeDasharray="1 1"
                data-frame
              />
            </svg>
            <div className="kj-eyebrow relative" data-label>
              0{i + 1}
            </div>
            <svg
              viewBox="0 0 240 170"
              data-tool
              className="relative my-4 h-[150px] w-full fill-none stroke-[var(--ink)] [stroke-width:2] [&_.kj-gold]:stroke-[var(--gold)] [&_.kj-fill]:fill-[rgba(201,160,74,.28)]"
              aria-hidden
            >
              {TOOLS[i]}
            </svg>
            <div className="kj-display relative text-[34px]" data-label>
              {b}
            </div>
            <p
              className="relative mt-1 text-[15px] text-[var(--muted)]"
              data-label
            >
              {p}
            </p>
          </div>
        ))}
      </div>
      {/* X14 atmospheric bleed: the ivory darkens into the festive ink band through a soft warm haze */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[200px] bg-[linear-gradient(180deg,rgba(43,33,23,0)_0%,rgba(120,84,40,.18)_40%,#2b2117_100%)]"
        aria-hidden
      />
      <div
        className="kj-haze pointer-events-none absolute inset-x-0 bottom-[40px] h-[140px]"
        aria-hidden
      />
    </section>
  );
}
