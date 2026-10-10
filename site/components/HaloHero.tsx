"use client";
// HR10 · The Halo (A · hero-1) · M49 light sweep + a scroll zoom into the ruby (Round 4 review, option B).
// The hero is a 240vh pin. At rest: the A1 still with ETERNAL behind and GOLD in front of the necklace cut-out, the
// light band, glints and the soft pearl/ruby sparkle on the clock. Scrolling, the camera moves into the necklace,
// centred on the ruby pendant (scale 1 → 20, steady on a log scale): the letters, nav and copy drift outward and fade,
// the photo (podium, halo) fades to the warm backdrop while a wide halo glow opens and fades. A1 alone would blur, so
// at ~2× the A7a pendant close-up crossfades in, pixel-matched on the ruby (centre and size measured on both images:
// A1 ruby 53×72 px at 1200.5, 819.8 of 2400×1340; A7a ruby 151×205 px at 513.5, 588.2 of 1024²), and the zoom
// finishes on A7a. At the end the ruby's red melts into the Bridal pink, the colour Collections opens on, so the
// page hands straight over. ?static=1: the resting hero.
import { useEffect, useRef } from "react";
import CardNav from "./CardNav";
import { hero, priceOf, inr } from "../content";
import { ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

// measured on the A1 cut-out (fractions of the 2752×1536 canvas)
const GOLD_PTS = [
  [0.3924, 0.2148],
  [0.6105, 0.2539],
  [0.6105, 0.293],
  [0.5887, 0.332],
  [0.4142, 0.3711],
  [0.3924, 0.4102],
  [0.6105, 0.4102],
  [0.5669, 0.4492],
  [0.4578, 0.4883],
  [0.5669, 0.4883],
  [0.4797, 0.5273],
  [0.4578, 0.5664],
];
const PEARLS = [
  [0.367, 0.2995],
  [0.3815, 0.4297],
  [0.4251, 0.5339],
  [0.4688, 0.5859],
  [0.4833, 0.638],
  [0.5124, 0.612],
  [0.5269, 0.6641],
  [0.5705, 0.5078],
  [0.6141, 0.4297],
];
const RUBY = [0.5005, 0.6005];
// the ruby's centre on the stage (fractions) = the zoom's origin; the A7a box placed so its ruby sits exactly on A1's
const RUBY_C = [1200.5 / 2400, 819.8 / 1340];
const K = 53 / 151; // A7a px → A1 px
const ZOOM_BOX = {
  left: (1200.5 - 513.5 * K) / 2400,
  top: (819.8 - 588.2 * K) / 1340,
  w: (1024 * K) / 2400,
  h: (1024 * K) / 1340,
};
const MAX = 20; // final scale: the ruby fills the screen height
const PIN_VH = 240;
const BRIDAL = "#EBCFC6";
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ramp = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const smooth = (t: number) => t * t * (3 - 2 * t);
const SWEEP = 4.2; // seconds per sweep, left → right

export default function HaloHero() {
  const p = priceOf(hero.grams);
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  const outer = useRef<HTMLDivElement>(null);
  const q = (k: string) =>
    section.current?.querySelector<HTMLElement>(`[data-z="${k}"]`);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const st = ScrollTrigger.create({
      trigger: outer.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        const p = self.progress;
        const z = ramp(p, 0.04, 0.84); // the zoom, steady on a log scale
        const sc = Math.pow(MAX, z);
        const vh = window.innerHeight;
        const st = stage.current!;
        st.style.scale = String(sc);
        // drift the ruby from where it sits (61 % down the stage) to the screen centre as we go in
        const rubyY = (RUBY_C[1] - 0.5) * st.offsetHeight;
        st.style.translate = `-50% calc(-50% - ${(rubyY * smooth(z)).toFixed(1)}px)`;
        const out = smooth(ramp(p, 0.03, 0.22)); // letters, nav, copy: drift outward and fade
        const set = (k: string, css: Partial<CSSStyleDeclaration>) =>
          Object.assign(q(k)?.style ?? {}, css);
        set("behind", {
          opacity: String(1 - out),
          translate: `0 ${(-out * 40).toFixed(1)}%`,
        });
        set("front", {
          opacity: String(1 - out),
          translate: `${(out * 18).toFixed(1)}% ${(out * 20).toFixed(1)}%`,
        });
        set("ui", {
          opacity: String(1 - out),
          translate: `0 ${(out * 30).toFixed(1)}px`,
        });
        set("nav", {
          opacity: String(1 - out),
          translate: `0 ${(-out * 30).toFixed(1)}px`,
        });
        set("fx", { opacity: String(1 - smooth(ramp(p, 0.06, 0.26))) }); // sweep, glints, sparkle: first part only
        set("band", { opacity: String(1 - smooth(ramp(p, 0.06, 0.26))) });
        set("photo", { opacity: String(1 - smooth(ramp(p, 0.1, 0.3))) }); // podium + halo fade to the backdrop
        const halo = smooth(ramp(p, 0.04, 0.34)); // the halo widens and fades
        set("halo", {
          opacity: String(0.85 * (1 - halo)),
          scale: String(1 + halo * 1.6),
        });
        set("zoom", { opacity: String(smooth(ramp(p, 0.25, 0.37))) }); // A7a takes over at ~2×
        set("necklace", { opacity: String(1 - smooth(ramp(p, 0.36, 0.42))) });
        set("melt", { opacity: String(smooth(ramp(p, 0.78, 0.98))) }); // ruby red → Bridal pink
      },
    });
    return () => st.kill();
  }, []);

  return (
    <div
      ref={outer}
      id="top"
      className="relative"
      style={{ height: `${100 + PIN_VH}vh` }}
      data-hero-pin
    >
      {/* record: the resting hero (1 s of sweep and sparkle), then one stop halfway through the zoom, so the camera
          moves in at a steady pace */}
      <div className="absolute left-0 top-0 h-px w-px" data-record-time="0.001" data-record-hold="1.0" data-record-label="Hero" />
      <div
        className="absolute left-0 h-px w-px"
        style={{ top: `${PIN_VH * 0.5}vh` }}
        data-record-time="2.1"
        data-record-label="Hero · zoom"
      />
      <section
        ref={section}
        className="sticky top-0 h-screen overflow-hidden bg-[#efe4d2]"
        data-section="hero"
      >
        {/* the halo opens wide and fades as the camera goes in */}
        <div
          className="pointer-events-none absolute left-1/2 top-[44%] h-[760px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0"
          style={{
            background:
              "radial-gradient(circle, transparent 46%, rgba(255,236,190,.55) 56%, rgba(255,226,160,.18) 64%, transparent 72%)",
          }}
          data-z="halo"
          aria-hidden
        />
        <div
          ref={stage}
          className="absolute left-1/2 top-1/2"
          style={{
            width: "max(100vw, calc(100vh * 2752 / 1536))",
            aspectRatio: "2752 / 1536",
            translate: "-50% -50%",
            transformOrigin: `${RUBY_C[0] * 100}% ${RUBY_C[1] * 100}%`,
          }}
          data-hero-stage
        >
          <div
            className="kj-breath kj-anim absolute inset-0"
            style={{
              transformOrigin: `${RUBY_C[0] * 100}% ${RUBY_C[1] * 100}%`,
            }}
          >
            <img
              src={hero.image}
              alt=""
              className="absolute inset-0 h-full w-full"
              data-hero-photo
              data-z="photo"
            />
            <div
              className="kj-display absolute left-0 right-0 top-[15.5%] text-center text-[clamp(112px,10.6vw,196px)] leading-none tracking-[0.2em] pl-[0.2em]"
              data-behind
              data-z="behind"
            >
              <span className="kj-letters-behind kj-anim">{hero.behind}</span>
            </div>
            <img
              src={hero.necklace}
              alt="Mayuri Haar, a 22K gold peacock necklace"
              className="absolute inset-0 h-full w-full"
              data-hero-necklace
              data-z="necklace"
            />
            {/* A7a close-up, pixel-matched on the ruby; soft round edge so its frame never shows */}
            <img
              src={hero.zoom}
              alt=""
              className="pointer-events-none absolute opacity-0"
              style={{
                left: `${ZOOM_BOX.left * 100}%`,
                top: `${ZOOM_BOX.top * 100}%`,
                width: `${ZOOM_BOX.w * 100}%`,
                height: `${ZOOM_BOX.h * 100}%`,
                WebkitMaskImage:
                  "radial-gradient(closest-side, #000 72%, transparent 100%)",
                maskImage:
                  "radial-gradient(closest-side, #000 72%, transparent 100%)",
              }}
              data-z="zoom"
            />
            <div className="absolute inset-0" data-z="fx">
              {/* the light band, masked to the necklace itself */}
              <div
                className="kj-sweep kj-anim pointer-events-none absolute inset-0"
                style={{
                  WebkitMaskImage: `url(${hero.necklace})`,
                  maskImage: `url(${hero.necklace})`,
                  WebkitMaskSize: "100% 100%",
                  maskSize: "100% 100%",
                  animationDuration: `${SWEEP}s`,
                }}
                aria-hidden
              />
              {/* glints flash on the links as the band passes (delay follows x) */}
              {GOLD_PTS.map(([x, y], i) => (
                <span
                  key={i}
                  className="kj-glint kj-anim"
                  style={{
                    left: `${x * 100}%`,
                    top: `${y * 100}%`,
                    animationDuration: `${SWEEP}s`,
                    animationDelay: `${(((x - 0.3) / 0.4) * SWEEP * 0.62).toFixed(2)}s`,
                  }}
                  aria-hidden
                />
              ))}
              {/* soft round sparkle on a few pearls and the ruby (no star shapes) */}
              {PEARLS.map(([x, y], i) => (
                <span
                  key={i}
                  className="kj-pearl kj-anim"
                  style={{
                    left: `${x * 100}%`,
                    top: `${y * 100}%`,
                    animationDelay: `${((i * 0.73) % 2.6).toFixed(2)}s`,
                  }}
                  aria-hidden
                />
              ))}
              <span
                className="kj-ruby kj-anim"
                style={{ left: `${RUBY[0] * 100}%`, top: `${RUBY[1] * 100}%` }}
                aria-hidden
              />
            </div>
            <div
              className="kj-display absolute left-0 right-0 top-[47%] pl-[31%] text-center text-[clamp(120px,11.5vw,210px)] leading-none"
              data-front
              data-z="front"
            >
              <span className="kj-letters-gold kj-anim">{hero.front}</span>
            </div>
          </div>
        </div>
        {/* M49 light passing over the whole scene (broad, so record holds are never still) */}
        <div
          className="kj-band"
          style={{
            ["--band" as string]: "rgba(255, 238, 200, 0.42)",
            ["--band-dur" as string]: `${SWEEP}s`,
          }}
          data-z="band"
          aria-hidden
        />
        {/* the ruby's red melts into the Bridal pink that Collections opens on */}
        <div
          className="pointer-events-none absolute inset-0 z-[25] opacity-0"
          style={{ background: BRIDAL }}
          data-z="melt"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 z-30 [&>nav]:pointer-events-auto"
          data-z="nav"
        >
          <CardNav />
        </div>
        <div
          className="pointer-events-none absolute inset-0 z-20 [&>div]:pointer-events-auto"
          data-z="ui"
        >
          <div className="absolute bottom-14 left-16 z-20 w-[340px]">
            <div className="kj-eyebrow">{hero.eyebrow}</div>
            <p className="mb-6 mt-3 text-[17px] leading-relaxed text-[var(--muted)]">
              {hero.copy}
            </p>
            <a className="kj-btn" href="#collections">
              {hero.cta} <span aria-hidden>→</span>
            </a>
          </div>
          <div className="absolute bottom-14 right-16 z-20 text-right">
            <div className="kj-eyebrow">{hero.piece}</div>
            <div className="kj-display kj-num mt-2 text-[44px]">
              {inr(p.total)}
            </div>
            <div className="kj-eyebrow mt-1">22K · {hero.grams} g</div>
          </div>
        </div>
      </section>
    </div>
  );
}
