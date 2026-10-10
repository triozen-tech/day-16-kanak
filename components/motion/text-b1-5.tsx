"use client";

// Motion lab · text batch 1 group 5 (M123–M134). Small focused demos, rebuilt in GSAP from the idea only.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, SplitText, prefersReducedMotion } from "@/lib/gsap";
import { useScrub } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = {
  grotesk: "Space Grotesk Variable, sans-serif",
  fraunces: "Fraunces Variable, serif",
  serif: "Instrument Serif, serif",
  syne: "Syne Variable, sans-serif",
  manrope: "Manrope Variable, sans-serif",
};

const CODES = ["m123", "m124", "m125", "m126", "m127", "m128", "m129", "m130", "m131", "m132", "m133", "m134"];
const glowSel = CODES.map((c) => `.${c}-glow`).join(",");
const CSS = `
${glowSel}{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(42% 46% at 50% 50%,var(--g,#2f8cff) 0%,transparent 70%);opacity:.38;animation:mt5-drift 6s linear infinite alternate}
@keyframes mt5-drift{0%{transform:translate(-14%,-6%) scale(1)}100%{transform:translate(14%,8%) scale(1.15)}}
.m127-ink{background-image:linear-gradient(90deg,#f4efe6 0%,#f4efe6 31%,#ff4d6d 35%,#ffb36b 39%,#c8ff8a 43%,#4fd8ff 47%,#8a7bff 51%,transparent 55%,transparent 100%);background-size:300% 100%;background-position:100% 0;-webkit-background-clip:text;background-clip:text;color:transparent;opacity:0}
.m127-on .m127-ink{animation:m127-sweep 2.4s linear infinite}
@keyframes m127-sweep{0%{background-position:100% 0;opacity:0}8%{opacity:1}62%{background-position:0% 0;opacity:1}86%{background-position:0% 0;opacity:1}100%{background-position:0% 0;opacity:0}}
.m134-caret{animation:m134-blink .7s steps(1) infinite}
@keyframes m134-blink{50%{opacity:0}}
.m130-bar{transform-origin:0 50%}
html.is-static ${glowSel},html.is-static .m127-on .m127-ink,html.is-static .m134-caret{animation:none}
html.is-static .m127-ink{opacity:1;background-position:0% 0}
html.is-static {${glowSel},.m127-on .m127-ink,.m134-caret{animation:none}.m127-ink{opacity:1;background-position:0% 0}}
`;

function Stage({ code, glow = "#2f8cff", children, refEl, className = "" }: { code: string; glow?: string; children: ReactNode; refEl?: RefObject<HTMLDivElement | null>; className?: string }) {
  return (
    <div ref={refEl} className={`relative h-full w-full overflow-hidden rounded-[18px] border border-white/10 bg-[#070b16] ${className}`}>
      <div className={`${code}-glow`} style={{ "--g": glow } as CSSProperties} aria-hidden />
      <style>{CSS}</style>
      {children}
    </div>
  );
}

/** Builds a looping timeline once fonts are ready; plays only while the stage is on screen; reverts everything on unmount. */
function usePlay(ref: RefObject<HTMLElement | null>, build: (el: HTMLElement) => gsap.core.Timeline | void) {
  const fn = useRef(build);
  fn.current = build;
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let dead = false;
    let tl: gsap.core.Timeline | void;
    let on = false;
    const ctx = gsap.context(() => {}, el);
    const io = new IntersectionObserver(([e]) => {
      on = e.isIntersecting;
      if (tl) (on ? tl.play() : tl.pause());
    }, { threshold: 0.1 });
    document.fonts.ready.then(() => {
      if (dead) return;
      ctx.add(() => {
        tl = fn.current(el);
        if (tl) (on ? tl.play() : tl.pause());
      });
      io.observe(el);
    });
    return () => {
      dead = true;
      io.disconnect();
      ctx.revert();
    };
  }, [ref]);
}

const H = ({ children, font = F.grotesk, size = "clamp(48px,7.4vw,118px)", className = "" }: { children: ReactNode; font?: string; size?: string; className?: string }) => (
  <h3 className={`leading-[0.95] tracking-[-0.02em] text-[#f4efe6] ${className}`} style={{ fontFamily: font, fontSize: size }}>
    {children}
  </h3>
);

/* M123 · Per-char fade-in-blur rise */
function M123() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const split = SplitText.create(el.querySelector("h3")!, { type: "words,chars" });
    return gsap
      .timeline({ repeat: -1, repeatDelay: 0.15 })
      .from(split.chars, { y: 20, opacity: 0, filter: "blur(12px)", duration: 0.32, ease: "power2.out", stagger: 0.04 })
      .to(split.chars, { opacity: 0, filter: "blur(8px)", duration: 0.35, ease: "power1.in", stagger: 0.01 }, "+=0.3");
  });
  return (
    <Stage code="m123" glow="#7aa8ff" refEl={root} className="grid place-items-center">
      <div className="relative text-center">
        <p className="mb-4 text-[13px] uppercase tracking-[0.3em] text-white/50">Aurel Audio · Series 2</p>
        <H font={F.grotesk} className="font-[600]">Quietly brilliant.</H>
      </div>
    </Stage>
  );
}

/* M124 · Per-character slide-up (unmasked), directions cycle: from below → from above */
function M124() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const split = SplitText.create(el.querySelector("h3")!, { type: "words,chars" });
    const tag = el.querySelector<HTMLElement>(".m124-dir")!;
    const tl = gsap.timeline({ repeat: -1 });
    (
      [
        [20, "from below"],
        [-20, "from above"],
      ] as const
    ).forEach(([y, label]) => {
      tl.call(() => void (tag.textContent = label))
        .fromTo(split.chars, { y, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out", stagger: 0.03 })
        .to(split.chars, { y: -y * 0.6, opacity: 0, duration: 0.3, ease: "power2.in", stagger: 0.012 }, "+=0.3");
    });
    return tl;
  });
  return (
    <Stage code="m124" glow="#18c48f" refEl={root} className="grid place-items-center">
      <div className="relative text-center">
        <H font={F.syne} className="font-[700]">Fresh off the farm</H>
        <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-1.5 text-[13px] uppercase tracking-[0.2em] text-white/70">
          <span className="h-1.5 w-1.5 rounded-full bg-[#18c48f]" />
          <span className="m124-dir">from below</span>
        </p>
      </div>
    </Stage>
  );
}

/* M125 · Per-line slide-up (no mask) */
function M125() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const split = SplitText.create(el.querySelector("h3")!, { type: "lines" });
    return gsap
      .timeline({ repeat: -1, repeatDelay: 0.1 })
      .from(split.lines, { y: 20, opacity: 0, duration: 0.6, ease: "power3.out", stagger: 0.16 })
      .to(split.lines, { opacity: 0, duration: 0.35, ease: "power1.in", stagger: 0.05 }, "+=0.3");
  });
  return (
    <Stage code="m125" glow="#e0913f" refEl={root} className="flex items-center px-[8%]">
      <div className="relative w-[min(62%,880px)]">
        <p className="mb-5 text-[13px] uppercase tracking-[0.3em] text-[#ffd59a]/70">Kiln &amp; Co. · Stoneware</p>
        <H font={F.fraunces} size="clamp(40px,5.6vw,88px)" className="font-[400]">
          Thrown by hand, fired twice, made to last a lifetime.
        </H>
      </div>
    </Stage>
  );
}

/* M126 · Per-word blur dissolve-in (no movement; exit re-blurs in reverse order) */
function M126() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const split = SplitText.create(el.querySelector("h3")!, { type: "words" });
    return gsap
      .timeline({ repeat: -1 })
      .fromTo(split.words, { opacity: 0, filter: "blur(12px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.5, ease: "power2.out", stagger: 0.09 })
      .to(split.words, { opacity: 0, filter: "blur(12px)", duration: 0.4, ease: "power2.in", stagger: { each: 0.06, from: "end" } }, "+=0.3");
  });
  return (
    <Stage code="m126" glow="#9fd8ff" refEl={root} className="grid place-items-center">
      <div className="relative w-[min(70%,920px)] text-center">
        <H font={F.serif} size="clamp(48px,6.6vw,104px)">
          Light that moves the way you <em className="text-[#9fd8ff]">breathe</em>.
        </H>
      </div>
    </Stage>
  );
}

/* M127 · Rainbow sweep settling to ink (CSS): on enter the band sweeps once, ink settles behind it, then the loop restarts */
function M127() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const io = new IntersectionObserver(([e]) => el.classList.toggle("m127-on", e.isIntersecting), { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Stage code="m127" glow="#ff4d6d" refEl={root} className="grid place-items-center">
      <div className="relative text-center">
        <p className="mb-4 text-[13px] uppercase tracking-[0.3em] text-white/50">Prism Studio · Spring drop</p>
        <h3 className="m127-ink pb-2 font-[800] leading-[0.95] tracking-[-0.03em]" style={{ fontFamily: F.grotesk, fontSize: "clamp(56px,8.4vw,136px)" }}>
          Colour, unfiltered.
        </h3>
      </div>
    </Stage>
  );
}

/* M128 · Rolling drum text: chars roll over a cylinder behind the text (rotateX, origin pushed back) */
function M128() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const [a, b] = Array.from(el.querySelectorAll<HTMLElement>(".m128-line"));
    const ca = SplitText.create(a, { type: "chars" }).chars;
    const cb = SplitText.create(b, { type: "chars" }).chars;
    const d = parseFloat(getComputedStyle(a).fontSize) * 0.42;
    const origin = `50% 50% -${d}px`;
    gsap.set([...ca, ...cb], { transformOrigin: origin, backfaceVisibility: "hidden" });
    gsap.set(cb, { rotationX: -90, opacity: 0 });
    const roll = (out: Element[], inn: Element[]) =>
      gsap
        .timeline()
        .to(out, { rotationX: 90, opacity: 0, duration: 0.6, ease: "power2.inOut", stagger: 0.035 }, 0)
        .fromTo(inn, { rotationX: -90, opacity: 0 }, { rotationX: 0, opacity: 1, duration: 0.6, ease: "power2.inOut", stagger: 0.035 }, 0);
    return gsap.timeline({ repeat: -1 }).add(roll(ca, cb)).add(roll(cb, ca), "+=0.25").to({}, { duration: 0.25 });
  });
  return (
    <Stage code="m128" glow="#ffb36b" refEl={root} className="grid place-items-center">
      <div className="relative text-center" style={{ perspective: "900px" }}>
        <p className="mb-6 text-[13px] uppercase tracking-[0.3em] text-white/50">Night market · open till 2</p>
        <div className="relative font-[800] uppercase leading-none tracking-[-0.01em]" style={{ fontFamily: F.syne, fontSize: "clamp(56px,8vw,128px)", transformStyle: "preserve-3d" }}>
          <div className="m128-line text-[#f4efe6]">Late Bites</div>
          <div className="m128-line absolute inset-0 text-[#ffb36b]" aria-hidden>
            Late Bites
          </div>
        </div>
      </div>
    </Stage>
  );
}

/* M129 · Rotated line reveal: masked lines enter from yPercent 150 + rotate 15°, exit to yPercent −150 + rotate −5° */
function M129() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const split = SplitText.create(el.querySelector("h3")!, { type: "lines", mask: "lines" });
    gsap.set(split.lines, { transformOrigin: "0% 100%" });
    return gsap
      .timeline({ repeat: -1 })
      .fromTo(split.lines, { yPercent: 150, rotation: 15 }, { yPercent: 0, rotation: 0, duration: 1.2, ease: "expo.out", stagger: 0.04 })
      .to(split.lines, { yPercent: -150, rotation: -5, duration: 0.7, ease: "expo.in", stagger: 0.04 }, "-=0.15");
  });
  return (
    <Stage code="m129" glow="#8a7bff" refEl={root} className="flex items-center px-[8%]">
      <div className="relative">
        <H font={F.grotesk} size="clamp(48px,6.8vw,112px)" className="font-[700] uppercase leading-[1]">
          Fluid forms
          <br />
          for still rooms
          <br />
          <span className="text-[#b8b0ff]">— Atelier Nove</span>
        </H>
      </div>
    </Stage>
  );
}

/* M130 · Rotating word slot: letters drop out, the next word rises in, the slot width follows */
const M130_WORDS = ["mornings.", "slow Sundays.", "long drives.", "you."];
function M130() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const slot = el.querySelector<HTMLElement>(".m130-slot")!;
    const bar = el.querySelector<HTMLElement>(".m130-bar")!;
    const words = Array.from(el.querySelectorAll<HTMLElement>(".m130-word"));
    const chars = words.map((w) => SplitText.create(w, { type: "chars" }).chars);
    const widths = words.map((w) => w.offsetWidth);
    gsap.set(slot, { width: widths[0] });
    words.forEach((w, i) => gsap.set(w, { opacity: i ? 0 : 1 }));
    const step = 1.6;
    const tl = gsap.timeline({ repeat: -1 });
    words.forEach((_, i) => {
      const n = (i + 1) % words.length;
      const t = i * step;
      tl.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: step, ease: "none" }, t)
        .to(chars[i], { yPercent: 120, opacity: 0, duration: 0.35, ease: "power2.in", stagger: 0.02 }, t + step - 0.55)
        .set(words[n], { opacity: 1 }, t + step - 0.4)
        .fromTo(chars[n], { yPercent: 120, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: "power3.out", stagger: 0.025 }, t + step - 0.4)
        .to(slot, { width: widths[n], duration: 0.6, ease: "power3.inOut" }, t + step - 0.45)
        .set(words[i], { opacity: 0 }, t + step);
    });
    return tl;
  });
  return (
    <Stage code="m130" glow="#2f8cff" refEl={root} className="grid place-items-center">
      <div className="relative">
        <h3 className="whitespace-nowrap font-[600] leading-[1.1] tracking-[-0.02em] text-[#f4efe6]" style={{ fontFamily: F.manrope, fontSize: "clamp(44px,6vw,96px)" }}>
          Made for{" "}
          <span className="m130-slot relative inline-block overflow-hidden align-bottom" style={{ height: "1.15em" }}>
            {M130_WORDS.map((w, i) => (
              <span key={w} className="m130-word absolute left-0 top-0 whitespace-nowrap text-[#7fb6ff]" style={i ? { opacity: 0 } : undefined}>
                {w}
              </span>
            ))}
            <span className="invisible whitespace-nowrap">{M130_WORDS[0]}</span>
          </span>
        </h3>
        <div className="mt-6 h-[2px] w-[min(320px,40vw)] overflow-hidden rounded bg-white/10">
          <div className="m130-bar h-full w-full bg-[#7fb6ff]" style={{ transform: "scaleX(0)" }} />
        </div>
        <p className="mt-3 text-[13px] uppercase tracking-[0.25em] text-white/50">Drift Coffee · Single origin</p>
      </div>
    </Stage>
  );
}

/* M131 · Scroll reveal with tilt + blur (scrub) */
function M131() {
  const root = useRef<HTMLDivElement>(null);
  const para = useRef<HTMLParagraphElement>(null);
  const words = useRef<HTMLElement[]>([]);
  useEffect(() => {
    if (prefersReducedMotion() || !para.current) return;
    const split = SplitText.create(para.current, { type: "words" });
    words.current = split.words as HTMLElement[];
    return () => {
      words.current = [];
      split.revert();
    };
  }, []);
  useScrub(root, (p) => {
    if (para.current) para.current.style.transform = `rotate(${(3 * (1 - p)).toFixed(3)}deg)`;
    const n = words.current.length;
    const W = 3;
    words.current.forEach((w, i) => {
      const f = gsap.utils.clamp(0, 1, (p * (n + W) - i) / W);
      w.style.opacity = (0.1 + 0.9 * f).toFixed(3);
      w.style.filter = `blur(${(4 * (1 - f)).toFixed(2)}px)`;
    });
  });
  return (
    <Stage code="m131" glow="#c8ff8a" refEl={root} className="flex items-center px-[8%]">
      <p ref={para} className="relative max-w-[24ch] leading-[1.12] tracking-[-0.01em] text-[#f1fff4]" style={{ fontFamily: F.fraunces, fontSize: "clamp(34px,4.4vw,68px)", transformOrigin: "0% 50%" }}>
        We grow tea on one steep hillside, pick it by hand at dawn, and ship it within a week of the leaf.
      </p>
    </Stage>
  );
}

/* M132 · Sliced text glass effect (scrub): clipped horizontal slices converge into one crisp line */
const M132_SLICES = [
  { x: -160, y: -24, r: -3 },
  { x: 120, y: 14, r: 2 },
  { x: -70, y: -8, r: -1.5 },
  { x: 190, y: 20, r: 2.5 },
  { x: -120, y: 30, r: -2 },
];
function M132() {
  const root = useRef<HTMLDivElement>(null);
  const slices = useRef<(HTMLDivElement | null)[]>([]);
  useScrub(root, (p) => {
    const k = 1 - p;
    slices.current.forEach((s, i) => {
      if (!s) return;
      const o = M132_SLICES[i];
      s.style.transform = `translate(${(o.x * k).toFixed(1)}px,${(o.y * k).toFixed(1)}px) rotate(${(o.r * k).toFixed(2)}deg)`;
      s.style.opacity = (0.55 + 0.45 * p).toFixed(3);
    });
  });
  const n = M132_SLICES.length;
  return (
    <Stage code="m132" glow="#4fd8ff" refEl={root} className="grid place-items-center">
      <div className="relative">
        {M132_SLICES.map((_, i) => (
          <div
            key={i}
            ref={(e) => void (slices.current[i] = e)}
            className={`${i ? "absolute inset-0" : "relative"} whitespace-nowrap font-[800] uppercase leading-none tracking-[-0.03em] text-[#eaf5ff]`}
            style={{
              fontFamily: F.grotesk,
              fontSize: "clamp(64px,10vw,164px)",
              clipPath: `inset(${(i * 100) / n}% -20% ${100 - ((i + 1) * 100) / n}% -20%)`,
              textShadow: "0 0 24px rgba(79,216,255,.25)",
            }}
            aria-hidden={i ? true : undefined}
          >
            Clearwater
          </div>
        ))}
        <p className="mt-6 text-center text-[13px] uppercase tracking-[0.3em] text-white/50">Glass carafe · ₹2,490</p>
      </div>
    </Stage>
  );
}

/* M133 · Sliding digits: per-digit 0–9 columns, only changed digits slide (spring), separators stay */
const M133_VALUES = [12480, 12495, 13120, 12870, 18450];
const fmt = (v: number) => v.toLocaleString("en-IN");
function M133() {
  const root = useRef<HTMLDivElement>(null);
  const first = fmt(M133_VALUES[0]);
  usePlay(root, (el) => {
    const cols = Array.from(el.querySelectorAll<HTMLElement>(".m133-col"));
    const tl = gsap.timeline({ repeat: -1 });
    M133_VALUES.forEach((_, i) => {
      const from = fmt(M133_VALUES[i]).replace(/\D/g, "");
      const to = fmt(M133_VALUES[(i + 1) % M133_VALUES.length]).replace(/\D/g, "");
      const t = i * 1.05;
      cols.forEach((c, j) => {
        if (from[j] !== to[j]) tl.to(c, { yPercent: -10 * +to[j], duration: 0.8, ease: "elastic.out(1,0.7)" }, t + j * 0.04);
      });
      tl.to({}, { duration: 0.01 }, t + 1.05);
    });
    return tl;
  });
  return (
    <Stage code="m133" glow="#18c48f" refEl={root} className="grid place-items-center">
      <div className="relative rounded-[24px] border border-white/10 bg-white/[0.04] px-[clamp(28px,4vw,56px)] py-[clamp(24px,3.4vw,44px)] backdrop-blur">
        <p className="text-[13px] uppercase tracking-[0.25em] text-white/55">Ridgeline Pack 40L · live price</p>
        <div className="mt-3 flex items-baseline font-[700] leading-none tabular-nums text-[#f1fff4]" style={{ fontFamily: F.grotesk, fontSize: "clamp(64px,9vw,148px)" }}>
          <span className="mr-[0.08em] text-[0.7em] text-[#18c48f]">₹</span>
          {first.split("").map((ch, i) => {
            if (!/\d/.test(ch))
              return (
                <span key={i} className="text-white/60">
                  {ch}
                </span>
              );
            const digit = +ch;
            return (
              <span key={i} className="relative inline-block overflow-hidden" style={{ height: "1em", width: "0.62em" }}>
                <span className="m133-col absolute left-0 top-0 flex w-full flex-col text-center" style={{ transform: `translateY(${-10 * digit}%)` }}>
                  {Array.from({ length: 10 }, (_, n) => (
                    <span key={n} className="block" style={{ height: "1em" }}>
                      {n}
                    </span>
                  ))}
                </span>
              </span>
            );
          })}
        </div>
        <p className="mt-4 text-[14px] text-white/60">Price updates as you pick size and colour.</p>
      </div>
    </Stage>
  );
}

/* M134 · Smooth typewriter: a linear clip-path sweep reveals the line, a block caret rides the clip edge */
function M134() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const line = el.querySelector<HTMLElement>(".m134-line")!;
    const caret = el.querySelector<HTMLElement>(".m134-caret-wrap")!;
    const w = line.offsetWidth;
    const s = { p: 0 };
    const apply = () => {
      line.style.clipPath = `inset(-10% ${(100 - s.p * 100).toFixed(2)}% -10% 0)`;
      caret.style.transform = `translateX(${(s.p * w).toFixed(1)}px)`;
    };
    apply();
    return gsap
      .timeline({ repeat: -1 })
      .to(s, { p: 1, duration: 2, ease: "none", onUpdate: apply })
      .to(s, { p: 0, duration: 0.45, ease: "power2.in", onUpdate: apply }, "+=0.3");
  });
  return (
    <Stage code="m134" glow="#ff4d6d" refEl={root} className="flex items-center px-[7%]">
      <div className="relative">
        <p className="mb-5 text-[13px] uppercase tracking-[0.3em] text-white/50">Kiln Roasters · Batch 07</p>
        <div className="relative inline-block">
          <h3 className="m134-line whitespace-nowrap font-[700] leading-[1.05] tracking-[-0.02em] text-[#f4efe6]" style={{ fontFamily: F.grotesk, fontSize: "clamp(40px,5.2vw,84px)" }}>
            Brewed slow. Poured <span className="text-[#ff8a5c]">bright.</span>
          </h3>
          <span className="m134-caret-wrap pointer-events-none absolute left-0 top-[8%] h-[84%]" aria-hidden>
            <span className="m134-caret ml-[4px] block h-full w-[0.32em] min-w-[10px] rounded-[2px] bg-[#ff8a5c]" style={{ fontSize: "clamp(40px,5.2vw,84px)" }} />
          </span>
        </div>
      </div>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M123", name: "Per-char fade-in-blur rise", how: "Each letter rises 20px while clearing blur(12px) and fading in, 0.04 s stagger, 0.3 s each; plays on enter, loops.", kind: "play", C: M123 },
  { code: "M124", name: "Per-character slide-up (unmasked)", how: "Letters travel ~20px with opacity and no mask, 0.03 s stagger; cycles from below → from above.", kind: "play", C: M124 },
  { code: "M125", name: "Per-line slide-up (no mask)", how: "Whole lines rise 20px and fade in one after another, no mask, visible while travelling.", kind: "play", C: M125 },
  { code: "M126", name: "Per-word blur dissolve-in", how: "Words clear from blur(12px) + opacity 0 in place (no movement); on exit they re-blur in reverse order.", kind: "play", C: M126 },
  { code: "M127", name: "Rainbow sweep settling to ink", how: "A rainbow band sweeps once across the headline as it fades in; behind the band the letters settle to ink (CSS).", kind: "play", C: M127 },
  { code: "M128", name: "Rolling drum text", how: "Letters sit on a cylinder behind the text and roll over it in a stagger, the next word coming up from below.", kind: "play", C: M128 },
  { code: "M129", name: "Rotated line reveal", how: "Masked lines enter from yPercent 150 + rotate 15° (expo.out, 1.2 s) and leave to yPercent −150 + rotate −5°.", kind: "play", C: M129 },
  { code: "M130", name: "Rotating word slot", how: "One word swaps through a list: letters drop out, the next word's letters rise in, the slot width follows.", kind: "play", C: M130 },
  { code: "M131", name: "Scroll reveal with tilt + blur", how: "Scrub: the paragraph rotates from 3° to flat while each word goes from 0.1 opacity + blur(4px) to sharp, in order.", kind: "scrub", C: M131 },
  { code: "M132", name: "Sliced text glass effect", how: "Scrub: horizontal clipped slices of the headline start offset and tilted, then converge into one crisp line.", kind: "scrub", C: M132 },
  { code: "M133", name: "Sliding digits", how: "Each digit is a 0–9 column; when the price changes only the changed digits spring to the new number.", kind: "play", C: M133 },
  { code: "M134", name: "Smooth typewriter (clip sweep)", how: "A linear clip-path sweep reveals the line left to right in 2 s, a blinking block caret riding the edge.", kind: "play", C: M134 },
];
