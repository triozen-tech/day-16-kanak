"use client";

// M72 · M73 · M74 motions, X12–X18 transitions, I10 loader (ideas from MIT design skills, see docs/SOURCES.md).
// Every scrubbed one uses the whole scroll range and keeps both scenes moving (slow opposite zoom), so it is never
// frozen in ?record=1. ?static=1 shows the final state.
import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger, SplitText } from "@/lib/gsap";
import { scene, useScrub, useTicker } from "./shared";

const Img = ({ i, label = "", className = "" }: { i: number; label?: string; className?: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={scene(i, 1200, 800, label)} alt="" className={`h-full w-full object-cover ${className}`} draggable={false} />
);
const smooth = (x: number) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};

/** Two scenes for a transition: A under, B on top; `apply(p, a, b, overlay)` styles them every scroll update. */
function TwoScenes({ apply, a = 0, b = 1, overlay, children }: { apply: (p: number, A: HTMLElement, B: HTMLElement, o: HTMLElement | null) => void; a?: number; b?: number; overlay?: string; children?: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const A = useRef<HTMLDivElement>(null);
  const B = useRef<HTMLDivElement>(null);
  const O = useRef<HTMLDivElement>(null);
  useScrub(root, (p) => {
    // never-frozen base: A slowly zooms in, B settles 1.2 → 1 across the whole pass
    A.current!.style.scale = String(1 + p * 0.15);
    B.current!.style.scale = String(1.2 - p * 0.2);
    apply(p, A.current!, B.current!, O.current);
  });
  return (
    <div ref={root} className="relative h-full w-full overflow-hidden rounded-[18px] bg-black">
      {/* fx-pan: a slow time-based pan on both scenes (CSS `translate`), so even where the scroll is slow (the ends of
          a scrub) the picture keeps moving on camera */}
      <div ref={A} className="fx-pan absolute inset-0">
        <Img i={a} label="SCENE A" />
      </div>
      <div ref={B} className="fx-pan absolute inset-0 opacity-0" style={{ animationDelay: "-3s" }}>
        <Img i={b} label="SCENE B" />
      </div>
      {overlay !== undefined && <div ref={O} className={`pointer-events-none absolute inset-0 ${overlay}`} />}
      {children}
    </div>
  );
}

/** X12 · Fade through black: A fades to black, a held darkness (with a moving light so it is alive), B fades up. */
export const FadeThroughBlack = () => (
  <TwoScenes
    overlay="bg-black"
    apply={(p, A, B, o) => {
      const out = smooth(p / 0.4);
      const inn = smooth((p - 0.6) / 0.4);
      o!.style.opacity = String(Math.min(out, 1 - inn));
      A.style.opacity = p < 0.5 ? "1" : "0";
      B.style.opacity = p >= 0.5 ? "1" : "0";
    }}
  >
    <div className="lab-glow pointer-events-none absolute inset-0 opacity-40 mix-blend-screen" />
  </TwoScenes>
);

/** X13 · Inversion cut: B opens as the photographic negative of the cut and settles to normal, tilting from 2°. */
export const InversionCut = () => (
  <TwoScenes
    a={1}
    b={2}
    apply={(p, A, B) => {
      const k = smooth((p - 0.5) / 0.2); // first 20% after the cut
      A.style.opacity = p < 0.5 ? "1" : "0";
      B.style.opacity = p >= 0.5 ? "1" : "0";
      B.style.transform = `perspective(900px) rotateX(${(2 * (1 - k)).toFixed(2)}deg)`;
      // a true negative copy of B on top, fading out (a half-strength invert would turn the photo grey)
      const neg = B.parentElement!.querySelector<HTMLElement>(".x13-neg");
      if (neg) {
        neg.style.opacity = p >= 0.5 ? String(1 - k) : "0";
        neg.style.scale = B.style.scale;
        neg.style.transform = B.style.transform;
      }
    }}
  >
    <div className="x13-neg fx-pan pointer-events-none absolute inset-0 opacity-0" style={{ filter: "invert(1) hue-rotate(180deg)", animationDelay: "-3s" }}>
      <Img i={2} />
    </div>
  </TwoScenes>
);

/** X14 · Atmospheric bleed: a drifting haze rises over A, holds, then clears onto B. */
export function AtmosphericBleed() {
  return (
    <TwoScenes
      a={3}
      b={0}
      overlay="fx-haze"
      apply={(p, A, B, o) => {
        const up = smooth(p / 0.4);
        const down = smooth((p - 0.6) / 0.4);
        o!.style.opacity = String(Math.min(up, 1 - down));
        A.style.opacity = p < 0.5 ? "1" : "0";
        B.style.opacity = p >= 0.5 ? "1" : "0";
      }}
    />
  );
}

/** X15 · Vignette spotlight: the edges close in to a spotlight, cut, and the vignette opens again on B. */
export const VignetteSpotlight = () => (
  <TwoScenes
    a={2}
    b={3}
    overlay=""
    apply={(p, A, B, o) => {
      const close = p < 0.5 ? smooth(p / 0.5) : 1 - smooth((p - 0.5) / 0.5);
      const r = 75 - close * 52; // spotlight radius %
      o!.style.background = `radial-gradient(circle at 50% 52%, transparent ${r.toFixed(1)}%, rgba(0,0,0,.92) ${(r + 18).toFixed(1)}%)`;
      A.style.opacity = p < 0.5 ? "1" : "0";
      B.style.opacity = p >= 0.5 ? "1" : "0";
    }}
  />
);

/** X16 · Cut-and-stamp: a hard cut with a 2px jolt that settles at once, like a press closing. */
export function CutAndStamp() {
  const side = useRef(0);
  return (
    <TwoScenes
      a={1}
      b={3}
      apply={(p, A, B) => {
        const s = p >= 0.5 ? 1 : 0;
        A.style.opacity = s ? "0" : "1";
        B.style.opacity = s ? "1" : "0";
        if (s !== side.current) {
          side.current = s;
          const el = (s ? B : A).parentElement!;
          if (!prefersReducedMotion()) gsap.fromTo(el, { y: 2, x: -1 }, { y: 0, x: 0, duration: 0.35, ease: "expo.inOut", clearProps: "x,y" });
        }
      }}
    />
  );
}

/** X17 · Lock-on reticle wipe: B opens inside a circle traced by an accent reticle (DrawSVG). */
export function ReticleWipe() {
  const svg = useRef<SVGSVGElement>(null);
  return (
    <TwoScenes
      a={0}
      b={2}
      apply={(p, A, B) => {
        const r = smooth(p) * 72; // % for clip-path circle()
        A.style.opacity = "1";
        B.style.opacity = "1";
        B.style.clipPath = `circle(${r.toFixed(2)}% at 50% 50%)`;
        const s = svg.current;
        if (!s) return;
        // CSS circle(%) uses sqrt(w² + h²) / √2 as 100%: draw the ring with the same radius, in real pixels
        const { width: w, height: h } = s.getBoundingClientRect();
        s.setAttribute("viewBox", `0 0 ${w.toFixed(0)} ${h.toFixed(0)}`);
        const rp = Math.max(6, (r / 100) * Math.sqrt(w * w + h * h) / Math.SQRT2);
        const ring = s.querySelector<SVGCircleElement>(".rt-ring")!;
        ring.setAttribute("cx", String(w / 2));
        ring.setAttribute("cy", String(h / 2));
        ring.setAttribute("r", rp.toFixed(1));
        gsap.set(ring, { drawSVG: `0% ${Math.round(Math.min(1, p * 1.8) * 100)}%` });
        s.querySelectorAll<SVGLineElement>(".rt-tick").forEach((l, i) => {
          const ang = (i * Math.PI) / 2;
          l.setAttribute("x1", String(w / 2 + Math.cos(ang) * (rp + 6)));
          l.setAttribute("y1", String(h / 2 + Math.sin(ang) * (rp + 6)));
          l.setAttribute("x2", String(w / 2 + Math.cos(ang) * (rp + 22)));
          l.setAttribute("y2", String(h / 2 + Math.sin(ang) * (rp + 22)));
        });
        s.style.opacity = String(1 - smooth((p - 0.8) / 0.2));
      }}
    >
      <svg ref={svg} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
        <circle className="rt-ring" fill="none" stroke="var(--accent,#2f8cff)" strokeWidth="2" />
        {[0, 1, 2, 3].map((k) => (
          <line key={k} className="rt-tick" stroke="var(--accent,#2f8cff)" strokeWidth="2" />
        ))}
      </svg>
    </TwoScenes>
  );
}

/** X18 · Stamp-pop dissolve: a short crossfade while a stamp shape pops 1 → 1.05 → 1 (and keeps turning slowly). */
export function StampPopDissolve() {
  const stamp = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  useTicker(wrap, (t) => {
    if (stamp.current) stamp.current.style.rotate = `${(t * 14) % 360}deg`;
  });
  return (
    <div ref={wrap} className="h-full w-full">
      <TwoScenes
        a={3}
        b={1}
        apply={(p, A, B) => {
          const k = smooth((p - 0.425) / 0.15); // 15% crossfade in the middle
          A.style.opacity = String(1 - k);
          B.style.opacity = String(k);
          if (stamp.current) stamp.current.style.scale = String(1 + 0.05 * Math.sin(Math.PI * Math.min(1, Math.max(0, (p - 0.35) / 0.3))));
        }}
      >
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div ref={stamp} className="fx-stamp grid h-[min(26vw,200px)] w-[min(26vw,200px)] place-items-center rounded-full text-center">
            <span className="font-display text-[clamp(16px,2vw,26px)] font-[900] leading-none">
              NEW
              <br />
              SEASON
            </span>
          </div>
        </div>
      </TwoScenes>
    </div>
  );
}

/** M72 · Glacial-then-sudden pin: 60% slow linear drift (haze, slow push), then a 40% payoff reveal (power2.out). */
export function GlacialPin() {
  const root = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLDivElement>(null);
  const haze = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLDivElement>(null);
  useScrub(root, (p) => {
    const drift = Math.min(p, 0.6) / 0.6; // linear
    const pay = gsap.parseEase("power2.out")(Math.max(0, (p - 0.6) / 0.4));
    img.current!.style.transform = `scale(${(1.25 - drift * 0.1 - pay * 0.15).toFixed(4)}) translateY(${(drift * -2).toFixed(2)}%)`;
    img.current!.style.filter = `brightness(${(0.45 + pay * 0.55).toFixed(3)}) blur(${(4 - pay * 4).toFixed(2)}px)`;
    haze.current!.style.opacity = String(0.85 - drift * 0.25 - pay * 0.6);
    title.current!.style.opacity = String(pay);
    title.current!.style.transform = `translateY(${(30 - pay * 30).toFixed(1)}px)`;
  });
  return (
    <div ref={root} className="relative h-full w-full overflow-hidden rounded-[18px] bg-black">
      <div ref={img} className="absolute inset-0">
        <Img i={3} />
      </div>
      <div ref={haze} className="fx-haze absolute inset-0" />
      <div ref={title} className="absolute inset-x-[6%] bottom-[10%] opacity-0">
        <p className="font-display text-[clamp(40px,7vw,110px)] font-[900] leading-[0.9]">Out of the haze.</p>
      </div>
    </div>
  );
}

/** M73 · Velocity-skew type: each letter skews and lifts with damped scroll speed (capped), plus an idle wave. */
export function VelocitySkewText({ text, className = "" }: { text: string; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const chars = useRef<HTMLElement[]>([]);
  const vel = useRef(0);
  const damp = useRef(0);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const split = SplitText.create(root.current!.querySelector("p")!, { type: "words,chars" });
    chars.current = split.chars as HTMLElement[];
    const st = ScrollTrigger.create({ trigger: root.current, start: "top bottom", end: "bottom top", onUpdate: (s) => (vel.current = s.getVelocity()) });
    return () => {
      st.kill();
      split.revert();
    };
  }, [text]);
  useTicker(root, (t, dt) => {
    // damped velocity: 1 − e^(−k·dt) smoothing, capped at ~6° skew / 0.18em lift
    const k = 1 - Math.exp(-8 * dt);
    damp.current += (gsap.utils.clamp(-1, 1, vel.current / 2500) - damp.current) * k;
    vel.current *= 0.9;
    const v = damp.current;
    chars.current.forEach((c, i) => {
      const w = Math.sin(t * 2.2 + i * 0.45);
      c.style.transform = `translateY(${(-v * 0.18 * (0.6 + 0.4 * w) - 0.03 * w).toFixed(3)}em) skewX(${(-v * 6 * (0.7 + 0.3 * w)).toFixed(2)}deg)`;
    });
  });
  return (
    <div ref={root} className={className}>
      <p className="font-display leading-[0.95]">{text}</p>
    </div>
  );
}

/** M74 · Thrown curved path (pure CSS): typed @property --x/--y on separate keyframes = a curved, thrown arc. */
export const ThrownPath = () => (
  <div className="relative h-full w-full overflow-hidden rounded-[18px] border border-white/10 bg-[#070b16]">
    {[0, 1, 2].map((i) => (
      <div key={i} className="fx-thrown absolute left-[8%] top-[70%]" style={{ animationDelay: `${-i * 0.9}s` }}>
        <div className="fx-stamp grid h-[clamp(56px,7vw,96px)] w-[clamp(56px,7vw,96px)] place-items-center rounded-full">
          <span className="font-display text-[clamp(13px,1.3vw,18px)] font-[900]">₹149</span>
        </div>
      </div>
    ))}
  </div>
);

/** I10 · Preloader-to-hero overlap: a counter (≤ 1.6 s) whose plate wipes off WHILE the hero title already rises. */
export function PreloaderOverlap() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const q = gsap.utils.selector(root);
    const n = { v: 0 };
    const tl = gsap
      .timeline({ repeat: -1, repeatDelay: 0.5 })
      .set(q(".po-plate"), { clipPath: "inset(0 0 0% 0)" })
      .set(q(".po-line"), { yPercent: 110 })
      .set(n, { v: 0 })
      .to(n, { v: 100, duration: 1.6, ease: "power2.inOut", onUpdate: () => (q(".po-count")[0].textContent = String(Math.round(n.v)).padStart(2, "0")) })
      .to(q(".po-plate"), { clipPath: "inset(0 0 100% 0)", duration: 0.9, ease: "expo.inOut" }, "+=0.05")
      // the hero title starts 0.35 s BEFORE the plate is gone: overlap, never a gap
      .to(q(".po-line"), { yPercent: 0, duration: 0.9, ease: "power4.out", stagger: 0.08 }, "-=0.55")
      .to({}, { duration: 1.2 });
    return () => {
      tl.kill();
    };
  }, []);
  return (
    <div ref={root} className="relative h-full w-full overflow-hidden rounded-[18px] bg-black">
      <Img i={0} />
      <div className="absolute inset-x-[6%] bottom-[10%]">
        {["Built for", "the night."].map((l) => (
          <div key={l} className="overflow-hidden">
            <p className="po-line font-display text-[clamp(40px,7vw,110px)] font-[900] leading-[0.92]">{l}</p>
          </div>
        ))}
      </div>
      <div className="po-plate absolute inset-0 grid place-items-center bg-[#0b1020]">
        <span className="po-count font-display text-[clamp(64px,12vw,180px)] font-[900] tabular-nums">00</span>
      </div>
    </div>
  );
}
