"use client";
// GL29 restyled as C's switcher (C · product-2 clip) · M145 words slide sideways in masks. Pinned for 200vh: the scroll
// steps Bridal → Temple → Daily wear → Gifting; per step the band colour washes over, the giant word swaps whole (the
// old word leaves first, then the new one slides in: lesson 85), the main piece crossfades and the floating pieces
// change. Each collection holds (record: a stop in the middle of each step); the colour turns first (0.45 s), the new
// pieces arrive just after it while the old ones stay until they are in (never an empty or pale frame), and the old
// name slides out before the new one slides in. The floats drift with the scroll and bob on the clock, so holds live.
// Chips and arrows scroll to their step. ?static=1 shows Bridal.
import { useEffect, useRef, useState } from "react";
import { collections, PIECE_SIZE } from "../content";
import { ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

const FLOAT_SPOTS = [
  { left: 38, top: 27, w: 150, r: -14, dx: 22, dy: 18 },
  { left: 76, top: 15, w: 130, r: 12, dx: 24, dy: 34 },
  { left: 79, top: 63, w: 170, r: -8, dx: 30, dy: -28 },
  { left: 13, top: 64, w: 140, r: 10, dx: -26, dy: -30 },
];
const N = collections.length;

export default function CollectionSwitch() {
  const [i, setI] = useState(0);
  const [lean, setLean] = useState(0); // -1 / 1 while an arrow is hovered: the piece tilts toward it
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    // until the pin starts the band is see-through (it slides up over the hero's zoom, pulled up one screen)
    inner.current?.style.setProperty("--enter", "0");
    inner.current?.style.setProperty("--enter-bg", "0");
    inner.current?.style.setProperty("--enter-pe", "none");
    const st = ScrollTrigger.create({
      trigger: outer.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        inner.current?.style.setProperty("--p", self.progress.toFixed(4));
        inner.current?.style.setProperty(
          "--enter-bg",
          self.progress > 0 ? "1" : "0",
        );
        inner.current?.style.setProperty(
          "--enter-pe",
          self.progress > 0 ? "auto" : "none",
        );
        // --q: 0 → 1 inside each step, so the word and the main piece keep drifting between swaps
        inner.current?.style.setProperty(
          "--q",
          ((self.progress * N) % 1).toFixed(4),
        );
        setI(Math.min(N - 1, Math.floor(self.progress * N)));
      },
    });
    // the content rises in over the last 64vh of the hero, starting while the ruby is still melting into this pink, so it is in place
    // the moment the pin starts
    const rise = ScrollTrigger.create({
      trigger: outer.current,
      start: "top 64%",
      end: "top top",
      onUpdate: (self) =>
        inner.current?.style.setProperty(
          "--enter",
          (1 - Math.pow(1 - self.progress, 3)).toFixed(4),
        ),
      onLeave: () => inner.current?.style.setProperty("--enter", "1"),
      onLeaveBack: () => inner.current?.style.setProperty("--enter", "0"),
    });
    return () => {
      st.kill();
      rise.kill();
    };
  }, []);

  const goTo = (k: number) => {
    const el = outer.current;
    if (!el || prefersReducedMotion()) return setI(k);
    const top = el.getBoundingClientRect().top + window.scrollY;
    const y = top + ((k + 0.5) / N) * (el.offsetHeight - window.innerHeight);
    if (window.__lenis) window.__lenis.scrollTo(y, { duration: 1 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  };
  const c = collections[i];

  return (
    <div
      ref={outer}
      id="collections"
      className="relative z-10 -mt-[100vh]"
      style={{ height: "300vh" }}
      data-section="collections"
    >
      {/* record stops: the hero zoom hands over at the pin's top, then one hold in the middle of each collection */}
      <div
        className="absolute left-0 top-0 h-px w-px"
        data-record-time="2.3"
        data-record-label="Collections"
      />
      {collections.map((x, k) => (
        <div
          key={x.id}
          className="absolute left-0 h-px w-px"
          style={{ top: `${((k + 0.5) / N) * 200}vh` }}
          data-record-time={k === 0 ? "0.6" : "0.75"}
          data-record-hold="0.6"
          data-record-label={`Collections · ${x.name}`}
        />
      ))}

      <section
        ref={inner}
        className="sticky top-0 h-screen overflow-hidden"
        style={{
          ["--p" as string]: "0",
          ["--q" as string]: "0.5",
          ["--enter" as string]: "1",
          pointerEvents: "var(--enter-pe, auto)" as never,
        }}
      >
        {/* the hero's melt ends on this same pink: the band (pulled up one screen under the hero's last frame) shows its
           pink the moment the pin starts, and the content rises in from below at full strength: no cut, no pale or
           empty frame */}
        <div
          className="absolute inset-0"
          style={{ translate: "0 calc((1 - var(--enter)) * 100vh)" }}
        >
          <div
            className="absolute inset-0 transition-colors duration-[450ms] ease-out"
            style={{
              background: c.tint,
              opacity: "var(--enter-bg, 1)",
              translate: "0 calc((var(--enter) - 1) * 100vh)",
            }}
            aria-hidden
          />
          <div
            className="kj-band"
            style={{
              ["--band" as string]: "rgba(255, 250, 240, 0.28)",
              ["--band-dur" as string]: "3.2s",
            }}
            aria-hidden
          />
          <div className="absolute left-16 top-16 z-10">
            <div className="kj-eyebrow" style={{ color: c.ink }}>
              Collections · {String(i + 1).padStart(2, "0")} /{" "}
              {String(N).padStart(2, "0")}
            </div>
            <div className="relative mt-3 h-[60px] overflow-hidden">
              {collections.map((x, k) => (
                <h2
                  key={x.id}
                  className="kj-display absolute left-0 top-0 whitespace-nowrap text-[56px] transition-[translate,opacity]"
                  style={{
                    translate: k === i ? "0 0" : k < i ? "0 -110%" : "0 110%",
                    opacity: k === i ? 1 : 0,
                    transitionDuration: k === i ? "0.5s" : "0.3s",
                    transitionDelay: k === i ? "0.3s" : "0s",
                  }}
                >
                  {x.name}
                </h2>
              ))}
            </div>
            <p className="mt-2 w-[300px] text-[16px] text-[var(--muted)]">
              {c.line}
            </p>
          </div>

          {/* M145: each giant word in its own mask; the old one leaves (0.28 s), then the new one wipes in */}
          <div
            className="absolute inset-x-0 top-1/2 h-[clamp(180px,19vw,300px)] -translate-y-1/2 overflow-hidden"
            aria-hidden
            data-coll-word
          >
            <div className="absolute inset-0">
              {collections.map((x, k) => (
                <span
                  key={x.id}
                  className="kj-display absolute inset-x-0 top-1/2 block text-center uppercase leading-none tracking-[0.02em]"
                  style={{
                    // sized per name so it always fits inside the screen (lesson: a cut word reads as two)
                    fontSize: Math.min(
                      280,
                      Math.floor(1200 / (x.name.length * 0.643)),
                    ),
                    transform: "translateY(-50%)",
                    color: x.ink,
                    translate:
                      k === i
                        ? "calc((0.5 - var(--q)) * 160px) 0"
                        : k < i
                          ? "-110% 0"
                          : "110% 0",
                    transition:
                      k === i
                        ? "translate 0.55s cubic-bezier(0.22,1,0.36,1) 0.36s"
                        : "translate 0.3s cubic-bezier(0.55,0,1,0.45) 0s",
                  }}
                >
                  {x.name}
                </span>
              ))}
            </div>
          </div>

          {collections.map((x, k) => {
            // only the active step drifts; the others rest where a step ends or starts (no jump at the swap)
            const q = k === i ? "var(--q)" : k < i ? "1" : "0";
            return (
              <div
                key={x.id}
                className="pointer-events-none absolute inset-0"
                style={{
                  // a clean push: the old pieces slide out left at full strength as the new ones slide in from the
                  // right, just behind the colour change (never a faded or empty frame)
                  translate: k === i ? "0 0" : k < i ? "-75vw 0" : "75vw 0",
                  visibility: Math.abs(k - i) > 1 ? "hidden" : "visible",
                  zIndex: k === i ? 2 : 1,
                  transition: "translate 0.8s cubic-bezier(.65,0,.35,1) 0.06s",
                }}
              >
                {FLOAT_SPOTS.map((s, n) => (
                  <img
                    key={n}
                    src={`/images/kanak/pieces/${x.floats[n]}.webp`}
                    alt=""
                    className="kj-bob absolute drop-shadow-[0_18px_24px_rgba(80,50,20,.18)]"
                    style={{
                      left: `${s.left}%`,
                      top: `${s.top}%`,
                      width: Math.round(s.w * (PIECE_SIZE[x.floats[n]] ?? 1)),
                      translate: `calc(-50% + ${q} * ${s.dx * 3}px) calc(-50% + ${q} * ${s.dy * 3}px)`,
                      rotate: `calc(${s.r}deg + var(--p) * ${s.r * 1.5}deg)`,
                      filter: n > 1 ? "blur(1.5px)" : undefined,
                      animationDelay: `${-n * 0.9}s`,
                    }}
                    data-coll-float
                  />
                ))}
                <img
                  src={x.image}
                  alt={k === i ? `${x.name} collection piece` : ""}
                  className="kj-bob kj-bob-slow absolute left-1/2 top-[52%] h-[64vh] w-auto drop-shadow-[0_30px_40px_rgba(80,50,20,.22)] transition-[scale,rotate] duration-700"
                  style={{
                    translate: `calc(-50% + (${q} - 0.5) * 70px) calc(-50% + (0.5 - ${q}) * 30px)`,
                    rotate: `calc((${q} - 0.5) * 5deg + ${k === i ? lean * 6 : 0}deg)`,
                    scale: k === i ? "calc(1.02 + var(--q) * 0.07)" : "0.94",
                  }}
                  data-coll-main
                />
              </div>
            );
          })}

          <div className="absolute bottom-14 left-16 z-10 flex gap-2.5">
            {collections.map((x, k) => (
              <button
                key={x.id}
                type="button"
                onClick={() => goTo(k)}
                className="h-[68px] w-[112px] rounded-[14px] px-3 py-2 text-left text-[13px] font-semibold transition-shadow"
                style={{
                  background: x.tint,
                  boxShadow:
                    k === i
                      ? `0 0 0 2px ${x.ink}`
                      : "0 0 0 1px rgba(43,33,23,.12)",
                  color: x.ink,
                }}
              >
                {x.name}
              </button>
            ))}
          </div>
          {/* arrows sit beside the chips, off the giant word */}
          <div className="absolute bottom-[66px] left-[590px] z-10 flex gap-2.5">
            {[-1, 1].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => goTo((i + d + N) % N)}
                onMouseEnter={() => setLean(d)}
                onMouseLeave={() => setLean(0)}
                aria-label={d < 0 ? "Previous collection" : "Next collection"}
                className="grid h-12 w-12 place-items-center rounded-full bg-white/75 text-[18px] transition-colors hover:bg-[var(--gold)] hover:text-white"
              >
                {d < 0 ? "←" : "→"}
              </button>
            ))}
          </div>
          <a className="kj-btn absolute bottom-14 right-16 z-10" href="#hours">
            Shop {c.name.toLowerCase()} · {c.count}
          </a>
        </div>
      </section>
    </div>
  );
}
