"use client";

// MOTION-MENU M99–M110 (batch 1 · text group 3). Small focused demos for /lab/motion. Every "play" demo starts when it
// enters the screen, loops while on screen and pauses off screen; every demo also has a CSS-only glow loop.
// ?static=1 / reduced motion: no animation, the markup already shows the final state.
import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, SplitText, prefersReducedMotion } from "@/lib/gsap";
import { useScrub } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = {
  sg: "Space Grotesk Variable",
  fr: "Fraunces Variable",
  is: "Instrument Serif",
  sy: "Syne Variable",
  mn: "Manrope Variable",
};

const CSS = `
.tb13-glow{background:radial-gradient(42% 52% at 50% 50%,color-mix(in srgb,var(--g,#4f8dff) 46%,transparent),transparent 70%);animation:tb13-glow 3.4s linear infinite alternate}
@keyframes tb13-glow{from{transform:translate(-16%,-6%) scale(.9)}to{transform:translate(16%,7%) scale(1.12)}}
.m101-c,.m102-c,.m99-c{display:inline-block;will-change:transform}
.m101-c{backface-visibility:hidden}
.m103-ring{animation:m103-spin 10s linear infinite}
@keyframes m103-spin{from{rotate:0deg}to{rotate:360deg}}
.m106-word{background:linear-gradient(90deg,#ffb36b,#ff4d6d,#ffd166,#ffb36b);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:m106-shine 3s linear infinite}
.m106-word span{background:inherit;-webkit-background-clip:text;background-clip:text}
@keyframes m106-shine{from{background-position:0% 50%}to{background-position:300% 50%}}
html.is-static .tb13-glow,html.is-static .m103-ring,html.is-static .m106-word{animation:none}
html.is-static {.tb13-glow,.m103-ring,.m106-word{animation:none}}
`;

/** The demo frame: a dark rounded stage with a drifting CSS glow (never frozen) and centred content. */
function Frame({ refEl, glow = "#4f8dff", children, className = "" }: { refEl: RefObject<HTMLDivElement | null>; glow?: string; children: ReactNode; className?: string }) {
  return (
    <div ref={refEl} className="relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#070b16]">
      <style>{CSS}</style>
      <div className="tb13-glow pointer-events-none absolute inset-[-20%]" style={{ "--g": glow } as CSSProperties} aria-hidden />
      <div className={`relative grid h-full w-full place-items-center px-[4%] ${className}`}>{children}</div>
    </div>
  );
}

/** Builds a looping timeline (inside a gsap.context) and plays it only while the demo is on screen. */
function usePlay(root: RefObject<HTMLElement | null>, build: (el: HTMLElement) => gsap.core.Timeline | undefined, deps: unknown[] = []) {
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    let tl: gsap.core.Timeline | undefined;
    const ctx = gsap.context(() => {
      tl = build(el);
    }, el);
    tl?.pause(0);
    const io = new IntersectionObserver(
      ([e]) => {
        if (!tl) return;
        if (e.isIntersecting) tl.play();
        else tl.pause();
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/* ───────────────── M99 · Bottom-up letters staircase (directions: bottom-up, top-down) ───────────────── */
function M99() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const split = SplitText.create(el.querySelector(".m99-h"), { type: "words,chars", charsClass: "m99-c" });
    const tag = el.querySelector(".m99-dir")!;
    const tl = gsap.timeline({ repeat: -1 });
    const pass = (from: number, label: string) => {
      tl.call(() => void (tag.textContent = label))
        .fromTo(split.chars, { yPercent: from }, { yPercent: 0, duration: 0.5, ease: "power3.out", stagger: 0.085 })
        .fromTo(split.chars, { opacity: 0 }, { opacity: 1, duration: 0.12, ease: "none", stagger: 0.085 }, "<")
        .to({}, { duration: 0.25 })
        .to(split.chars, { yPercent: -from * 0.7, opacity: 0, duration: 0.32, ease: "power2.in", stagger: 0.025 });
    };
    pass(190, "↑ bottom-up");
    pass(-190, "↓ top-down");
    return tl;
  });
  return (
    <Frame refEl={root} glow="#ff6a3d">
      <div className="text-center">
        <h3 className="m99-h text-[clamp(64px,10vw,164px)] font-[800] leading-none tracking-[-0.02em] text-[#fff1e6]" style={{ fontFamily: F.sy }}>
          Fresh Batch
        </h3>
        <p className="mt-6 text-[15px] text-white/60" style={{ fontFamily: F.mn }}>
          Sourdough, out of the oven at 6 am · ₹180 a loaf
        </p>
      </div>
      <p className="m99-dir absolute bottom-[6%] left-0 right-0 text-center text-[13px] uppercase tracking-[0.22em] text-[#ffb36b]" style={{ fontFamily: F.sg }}>
        ↑ bottom-up
      </p>
    </Frame>
  );
}

/* ───────────────── M100 · Box reveal wipe ───────────────── */
function M100() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const items = gsap.utils.toArray<HTMLElement>(".m100-item", el);
    const boxes = items.map((i) => i.querySelector(".m100-box"));
    const texts = items.map((i) => i.querySelector(".m100-text"));
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(boxes, { xPercent: -101 })
      .to(boxes, { xPercent: 0, duration: 0.35, ease: "power3.inOut", stagger: 0.08 })
      .set(texts, { y: 75, opacity: 0 });
    items.forEach((_, i) => {
      const at = 0.62 + i * 0.32;
      tl.to(boxes[i], { xPercent: 101, duration: 0.5, ease: "power3.inOut" }, at).to(texts[i], { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, at + 0.06);
    });
    tl.to({}, { duration: 0.3 });
    return tl;
  });
  const box = <span className="m100-box absolute inset-0 bg-[#ff6a3d]" style={{ transform: "translateX(101%)" }} aria-hidden />;
  return (
    <Frame refEl={root} glow="#ff6a3d">
      <div className="w-full max-w-[880px]">
        <div className="m100-item relative w-fit overflow-hidden">
          <h3 className="m100-text text-[clamp(56px,7.4vw,118px)] font-[600] leading-[1] tracking-[-0.02em]" style={{ fontFamily: F.fr }}>
            Harvest Edit
          </h3>
          {box}
        </div>
        <div className="m100-item relative mt-5 w-fit overflow-hidden">
          <p className="m100-text text-[clamp(18px,1.7vw,26px)] text-white/75" style={{ fontFamily: F.mn }}>
            Linen, clay and long summer evenings. Twelve pieces, made in small runs.
          </p>
          {box}
        </div>
        <div className="m100-item relative mt-8 w-fit overflow-hidden rounded-full">
          <span className="m100-text inline-block rounded-full bg-[#fff1e6] px-7 py-4 text-[15px] font-[700] text-[#1a0b12]" style={{ fontFamily: F.sg }}>
            Shop the edit · from ₹2,890
          </span>
          {box}
        </div>
      </div>
    </Frame>
  );
}

/* ───────────────── M101 · Char flip-up (rotateX 90 → 0) ───────────────── */
function M101() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const lines = gsap.utils.toArray<HTMLElement>(".m101-l", el).map((l) => SplitText.create(l, { type: "words,chars", charsClass: "m101-c" }).chars);
    const tl = gsap.timeline({ repeat: -1 });
    lines.forEach((chars, i) => {
      tl.fromTo(
        chars,
        { rotationX: 90, y: 10, opacity: 0, transformOrigin: "50% 100%" },
        { rotationX: 0, y: 0, opacity: 1, duration: 0.22, ease: "power2.out", stagger: 0.05 },
        i === 0 ? 0 : "-=0.25",
      );
    });
    tl.to({}, { duration: 0.3 }).to(lines.flat(), { rotationX: -90, opacity: 0, transformOrigin: "50% 0%", duration: 0.22, ease: "power2.in", stagger: 0.015 });
    return tl;
  });
  return (
    <Frame refEl={root} glow="#18c48f">
      <div className="text-center" style={{ perspective: "700px" }}>
        <h3 className="m101-l text-[clamp(60px,8.4vw,136px)] font-[700] leading-[1.02] tracking-[-0.03em]" style={{ fontFamily: F.sg }}>
          Cold pressed
        </h3>
        <h3 className="m101-l text-[clamp(60px,8.4vw,136px)] font-[400] italic leading-[1.02] text-[#c8ff8a]" style={{ fontFamily: F.fr }}>
          at sunrise.
        </h3>
        <p className="mt-6 text-[15px] text-white/60" style={{ fontFamily: F.mn }}>
          Green No. 4 · 300 ml · ₹160
        </p>
      </div>
    </Frame>
  );
}

/* ───────────────── M102 · Chars stretch down from above (scrub) ───────────────── */
function M102() {
  const root = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const split = SplitText.create(el.querySelector(".m102-h"), { type: "words,chars", charsClass: "m102-c" });
      tl.current = gsap
        .timeline({ paused: true })
        .fromTo(
          split.chars,
          { yPercent: 120, scaleY: 2.3, scaleX: 0.7, opacity: 0, transformOrigin: "50% 0%" },
          { yPercent: 0, scaleY: 1, scaleX: 1, opacity: 1, duration: 1, ease: "back.inOut(2)", stagger: 0.09 },
        );
      tl.current.progress(last.current);
    }, el);
    return () => {
      ctx.revert();
      tl.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const last = useScrub(root, (p) => tl.current?.progress(p));
  return (
    <Frame refEl={root} glow="#2f8cff">
      <div className="text-center">
        <h3 className="m102-h text-[clamp(80px,12vw,200px)] font-[700] leading-[0.95] tracking-[-0.04em]" style={{ fontFamily: F.sg }}>
          Go further.
        </h3>
        <p className="mt-8 text-[15px] text-white/60" style={{ fontFamily: F.mn }}>
          Trail 02 · carbon plate, 212 g · ₹14,990
        </p>
      </div>
    </Frame>
  );
}

/* ───────────────── M103 · Circular text ring (auto hover) ───────────────── */
const RING = "FRESH DAILY • STONE BAKED • SINCE 5 AM • ";
function M103() {
  const root = useRef<HTMLDivElement>(null);
  const hoverRef = useRef<(on: boolean) => void>(() => {});
  usePlay(root, (el) => {
    const ring = el.querySelector<HTMLElement>(".m103-ring")!;
    const wrap = el.querySelector(".m103-wrap");
    const dot = el.querySelector(".m103-dot");
    const anim = ring.getAnimations()[0];
    const rate = { r: 1 };
    hoverRef.current = (on) => {
      gsap.to(rate, { r: on ? 4.5 : 1, duration: 0.6, ease: "power2.out", onUpdate: () => anim && (anim.playbackRate = rate.r) });
      gsap.to(wrap, { scale: on ? 1.1 : 1, duration: 0.6, ease: "power3.out" });
      gsap.to(ring, { color: on ? "#ffd166" : "#fff1e6", duration: 0.4 });
    };
    const tl = gsap.timeline({ repeat: -1 });
    tl.fromTo(dot, { x: -460, y: 170, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 0.8, ease: "power2.inOut" })
      .call(() => hoverRef.current(true))
      .to(dot, { scale: 1.6, duration: 0.25, yoyo: true, repeat: 1 })
      .to({}, { duration: 0.8 })
      .call(() => hoverRef.current(false))
      .to(dot, { x: 420, y: -150, opacity: 0, duration: 0.8, ease: "power2.inOut" })
      .to({}, { duration: 0.2 });
    return tl;
  });
  const chars = RING.split("");
  return (
    <Frame refEl={root} glow="#e0913f">
      <div
        className="m103-wrap relative size-[min(46vh,400px)]"
        onPointerEnter={() => hoverRef.current(true)}
        onPointerLeave={() => hoverRef.current(false)}
        data-cursor="Fresh"
      >
        <div className="m103-ring absolute inset-0 text-[#fff1e6]" style={{ fontFamily: F.sg }} aria-label={RING}>
          {chars.map((c, i) => (
            <span
              key={i}
              aria-hidden
              className="absolute left-1/2 top-0 h-1/2 w-[1em] -ml-[0.5em] origin-bottom text-center text-[clamp(16px,1.5vw,22px)] font-[700]"
              style={{ transform: `rotate(${(i * 360) / chars.length}deg)` }}
            >
              {c}
            </span>
          ))}
        </div>
        <div className="absolute inset-[22%] grid place-items-center rounded-full bg-[#140f07] text-center shadow-[0_0_80px_rgba(224,145,63,.35)]">
          <div>
            <p className="text-[clamp(34px,3.6vw,56px)] font-[500] leading-none text-[#ffd59a]" style={{ fontFamily: F.fr }}>
              ₹180
            </p>
            <p className="mt-2 text-[13px] uppercase tracking-[0.18em] text-white/60" style={{ fontFamily: F.sg }}>
              country loaf
            </p>
          </div>
        </div>
      </div>
      <span className="m103-dot pointer-events-none absolute left-1/2 top-1/2 -ml-[11px] -mt-[11px] size-[22px] rounded-full border-2 border-white bg-white/25 opacity-0" aria-hidden />
    </Frame>
  );
}

/* ───────────────── M104 · Colour block line wipe ───────────────── */
const M104_LINES = ["Linen that", "softens with", "every wash."];
function M104() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const lines = gsap.utils.toArray<HTMLElement>(".m104-line", el);
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(".m104-t", { opacity: 0 });
    lines.forEach((l, i) => {
      const b = l.querySelector(".m104-b");
      const t = l.querySelector(".m104-t");
      const at = 0.05 + i * 0.12;
      tl.set(b, { transformOrigin: "0% 50%" }, at)
        .fromTo(b, { scaleX: 0 }, { scaleX: 1, duration: 0.42, ease: "power3.inOut" }, at)
        .set(t, { opacity: 1 }, at + 0.42)
        .set(b, { transformOrigin: "100% 50%" }, at + 0.42)
        .to(b, { scaleX: 0, duration: 0.42, ease: "power3.inOut" }, at + 0.42);
    });
    tl.to({}, { duration: 0.3 }).to(".m104-t", { opacity: 0, y: -8, duration: 0.3, stagger: 0.06, ease: "power2.in" }).set(".m104-t", { y: 0 });
    return tl;
  });
  return (
    <Frame refEl={root} glow="#c8ff8a">
      <div>
        {M104_LINES.map((l) => (
          <span key={l} className="m104-line relative block w-fit">
            <span className="m104-t block text-[clamp(60px,8vw,128px)] leading-[1.02] tracking-[-0.01em]" style={{ fontFamily: F.is }}>
              {l}
            </span>
            <span className="m104-b absolute inset-x-0 inset-y-[8%] bg-[#c8ff8a]" style={{ transform: "scaleX(0)" }} aria-hidden />
          </span>
        ))}
        <p className="mt-6 text-[15px] text-white/60" style={{ fontFamily: F.mn }}>
          Stonewashed sheet set · Oat · ₹6,400
        </p>
      </div>
    </Frame>
  );
}

/* ───────────────── M105 · Echo-trail entrance (directions: right, up, diagonal) ───────────────── */
const GHOSTS = [0.55, 0.42, 0.3, 0.2, 0.12];
const TINTS = ["#9fd8ff", "#7fb6ff", "#8a7dff", "#b06bff", "#ff6bd6"];
function M105() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const main = el.querySelector(".m105-main");
    const ghosts = gsap.utils.toArray<HTMLElement>(".m105-g", el);
    const tag = el.querySelector(".m105-dir")!;
    const dirs: [number, number, string][] = [
      [1, 0, "→ right"],
      [0, -1, "↑ up"],
      [0.72, -0.72, "↗ diagonal"],
    ];
    const D = 150;
    const step = 46;
    const tl = gsap.timeline({ repeat: -1 });
    dirs.forEach(([vx, vy, label]) => {
      const s = tl.duration();
      tl.call(() => void (tag.textContent = label), [], s);
      tl.fromTo(main, { x: vx * D, y: -vy * D, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 0.9, ease: "power3.out" }, s);
      ghosts.forEach((g, i) => {
        const off = D + (i + 1) * step;
        tl.fromTo(g, { x: vx * off, y: -vy * off, opacity: GHOSTS[i] }, { x: 0, y: 0, duration: 0.9 + i * 0.06, ease: "power3.out" }, s + (i + 1) * 0.07);
        tl.to(g, { opacity: 0, duration: 0.25, ease: "power1.in" }, s + 0.95);
      });
      tl.to({}, { duration: 0.3 }).to(main, { opacity: 0, scale: 0.98, duration: 0.25, ease: "power2.in" }).set(main, { scale: 1 });
    });
    return tl;
  });
  return (
    <Frame refEl={root} glow="#8a7dff">
      <div className="text-center">
        <div className="relative inline-block">
          {GHOSTS.map((_, i) => (
            <span
              key={i}
              aria-hidden
              className="m105-g absolute inset-0 text-[clamp(80px,11vw,180px)] font-[800] leading-none tracking-[-0.03em]"
              style={{ fontFamily: F.sy, color: TINTS[i], filter: `blur(${(i + 1) * 1.6}px)`, opacity: 0 }}
            >
              Midnight
            </span>
          ))}
          <span className="m105-main relative block text-[clamp(80px,11vw,180px)] font-[800] leading-none tracking-[-0.03em] text-[#eaf5ff]" style={{ fontFamily: F.sy }}>
            Midnight
          </span>
        </div>
        <p className="mt-6 text-[15px] text-white/60" style={{ fontFamily: F.mn }}>
          Dark roast, notes of cocoa and fig · 250 g · ₹540
        </p>
      </div>
      <p className="m105-dir absolute bottom-[6%] left-0 right-0 text-center text-[13px] uppercase tracking-[0.22em] text-[#9fd8ff]" style={{ fontFamily: F.sg }}>
        → right
      </p>
    </Frame>
  );
}

/* ───────────────── M106 · Flip words (blur-out up, letters in) ───────────────── */
const M106_WORDS = ["honest.", "weightless.", "alive.", "yours."];
function M106() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const slot = el.querySelector<HTMLElement>(".m106-slot")!;
    const words = gsap.utils.toArray<HTMLElement>(".m106-word", el);
    const tl = gsap.timeline({ repeat: -1 });
    words.forEach((w, i) => {
      const next = words[(i + 1) % words.length];
      tl.to({}, { duration: 0.75 })
        .to(w, { y: -42, opacity: 0, scale: 1.3, filter: "blur(8px)", duration: 0.45, ease: "power2.in" })
        .to(slot, { width: () => next.offsetWidth, duration: 0.5, ease: "power3.inOut" }, "<0.1")
        .set(next, { y: 0, opacity: 1, scale: 1, filter: "blur(0px)" }, "-=0.12")
        .fromTo(next.children, { y: 10, opacity: 0, filter: "blur(8px)" }, { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.4, ease: "power2.out", stagger: 0.05 }, "<");
    });
    return tl;
  });
  return (
    <Frame refEl={root} glow="#ff4d6d">
      <div className="text-center">
        <h3 className="text-[clamp(48px,6vw,96px)] font-[400] leading-[1.1] tracking-[-0.02em]" style={{ fontFamily: F.fr }}>
          Skincare that feels{" "}
          <span className="m106-slot relative inline-block whitespace-nowrap text-left align-bottom">
            <span className="invisible italic">{M106_WORDS[0]}</span>
            {M106_WORDS.map((w, i) => (
              <span key={w} className="m106-word absolute left-0 top-0 whitespace-nowrap italic" style={{ opacity: i === 0 ? 1 : 0, transformOrigin: "0% 60%" }} aria-hidden={i > 0}>
                {w.split("").map((c, j) => (
                  <span key={j} className="inline-block">
                    {c}
                  </span>
                ))}
              </span>
            ))}
          </span>
        </h3>
        <p className="mt-6 text-[15px] text-white/60" style={{ fontFamily: F.mn }}>
          Barrier serum · 30 ml · ₹1,250
        </p>
      </div>
    </Frame>
  );
}

/* ───────────────── M107 · Focus-blur resolve with blur exit ───────────────── */
function M107() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const h = el.querySelector(".m107-h");
    const tl = gsap.timeline({ repeat: -1 });
    tl.fromTo(h, { filter: "blur(28px)", scale: 1.16, opacity: 0.15 }, { filter: "blur(0px)", scale: 1, opacity: 1, duration: 1.05, ease: "power3.out" })
      .to({}, { duration: 0.3 })
      .to(h, { filter: "blur(16px)", scale: 0.97, opacity: 0, duration: 0.55, ease: "power2.in" });
    return tl;
  });
  return (
    <Frame refEl={root} glow="#ffb36b">
      <div className="text-center">
        <h3 className="m107-h text-[clamp(56px,7.6vw,124px)] font-[500] leading-[1] tracking-[-0.03em]" style={{ fontFamily: F.fr }}>
          Quiet luxury,
          <br />
          <em className="text-[#ffd59a]">loud flavour.</em>
        </h3>
        <p className="mt-7 text-[15px] text-white/60" style={{ fontFamily: F.mn }}>
          Saffron &amp; cardamom gelato · 500 ml · ₹690
        </p>
      </div>
    </Frame>
  );
}

/* ───────────────── M108 · Focus-in with tracking (contract, then expand) ───────────────── */
function M108() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const h = el.querySelector(".m108-h");
    const tag = el.querySelector(".m108-dir")!;
    const tl = gsap.timeline({ repeat: -1 });
    const pass = (from: string, z: number, label: string) => {
      tl.call(() => void (tag.textContent = label))
        .fromTo(
          h,
          { letterSpacing: from, filter: "blur(12px)", opacity: 0, z, transformPerspective: 800 },
          { letterSpacing: "0.04em", filter: "blur(0px)", opacity: 1, z: 0, duration: 1.0, ease: "power3.out" },
        )
        .to({}, { duration: 0.3 })
        .to(h, { filter: "blur(12px)", opacity: 0, duration: 0.4, ease: "power2.in" });
    };
    pass("0.9em", -260, "tracking contracts · from depth");
    pass("-0.3em", 0, "tracking expands");
    return tl;
  });
  return (
    <Frame refEl={root} glow="#18c48f">
      <div className="w-full text-center">
        <h3 className="m108-h whitespace-nowrap text-[clamp(52px,7vw,112px)] font-[800] uppercase leading-none tracking-[0.04em]" style={{ fontFamily: F.mn }}>
          Slow Mornings
        </h3>
        <p className="mt-7 text-[15px] text-white/60" style={{ fontFamily: F.mn }}>
          Weekend retreat in the hills · 2 nights from ₹18,500
        </p>
      </div>
      <p className="m108-dir absolute bottom-[6%] left-0 right-0 text-center text-[13px] uppercase tracking-[0.22em] text-[#c8ff8a]" style={{ fontFamily: F.sg }}>
        tracking contracts · from depth
      </p>
    </Frame>
  );
}

/* ───────────────── M109 · Hand-drawn marker annotation ───────────────── */
type Mark = "underline" | "circle" | "highlight" | "box" | "strike";
const MARKS: { word: string; mark: Mark; color: string }[] = [
  { word: "slow", mark: "underline", color: "#ffd166" },
  { word: "fresh", mark: "circle", color: "#ff6a3d" },
  { word: "48 hours", mark: "highlight", color: "#c8ff8a" },
  { word: "₹420", mark: "box", color: "#4f8dff" },
  { word: "stale", mark: "strike", color: "#ff4d6d" },
];
function rng(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647) * 2 - 1;
}
/** Catmull-Rom through points → smooth cubic path (hand-drawn wobble). */
function smooth(p: [number, number][]) {
  let d = `M${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const [p0, p1, p2, p3] = [p[i - 1] ?? p[i], p[i], p[i + 1], p[i + 2] ?? p[i + 1]];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}
function roughPath(mark: Mark, w: number, h: number, seed: number) {
  const r = rng(seed);
  const j = (n: number) => r() * n;
  const line = (y: number, slant = 0) => smooth([[-6 + j(3), y + j(3)], [w * 0.33, y - 3 + j(3) + slant / 3], [w * 0.66, y + 3 + j(3) + (slant * 2) / 3], [w + 8 + j(3), y + j(3) + slant]]);
  if (mark === "underline") return line(h * 0.98, -4);
  if (mark === "strike") return line(h * 0.56, -6);
  if (mark === "highlight") return line(h * 0.6, 2);
  if (mark === "box") {
    const pts: [number, number][] = [
      [-10 + j(3), -6 + j(3)],
      [w / 2, -9 + j(3)],
      [w + 10 + j(3), -5 + j(3)],
      [w + 8 + j(3), h / 2],
      [w + 11 + j(3), h + 6 + j(3)],
      [w / 2, h + 9 + j(3)],
      [-9 + j(3), h + 5 + j(3)],
      [-11 + j(3), h / 2],
      [-7 + j(3), -12 + j(3)],
    ];
    return smooth(pts);
  }
  const pts: [number, number][] = [];
  const n = 22;
  for (let i = 0; i <= n; i++) {
    const a = -2.4 + (i / n) * (Math.PI * 2 + 0.55);
    const k = 1 + j(0.06);
    pts.push([w / 2 + Math.cos(a) * (w / 2 + 16) * k, h / 2 + Math.sin(a) * (h / 2 + 12) * k]);
  }
  return smooth(pts);
}
function M109() {
  const root = useRef<HTMLDivElement>(null);
  const [sizes, setSizes] = useState<{ w: number; h: number }[] | null>(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const measure = () => setSizes(gsap.utils.toArray<HTMLElement>(".m109-w", el).map((s) => ({ w: s.offsetWidth, h: s.offsetHeight })));
    document.fonts.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  usePlay(
    root,
    (el) => {
      if (!sizes) return undefined;
      const svgs = gsap.utils.toArray<SVGSVGElement>(".m109-svg", el);
      const tl = gsap.timeline({ repeat: -1 });
      tl.set(svgs, { opacity: 1 }).set(".m109-p", { drawSVG: "0%" });
      svgs.forEach((s, k) => {
        const [a, b] = s.querySelectorAll(".m109-p");
        const at = 0.1 + k * 0.42;
        tl.to(a, { drawSVG: "100%", duration: 0.32, ease: "power1.inOut" }, at).to(b, { drawSVG: "100%", duration: 0.26, ease: "power1.inOut" }, at + 0.2);
      });
      tl.to({}, { duration: 0.3 }).to(svgs, { opacity: 0, duration: 0.3, stagger: 0.04 });
      return tl;
    },
    [sizes],
  );
  const word = (k: number) => {
    const m = MARKS[k];
    const s = sizes?.[k];
    const pad = 24;
    const hl = m.mark === "highlight";
    return (
      <span className="m109-w relative inline-block isolate whitespace-nowrap">
        {m.word}
        {s && (
          <svg
            className="m109-svg pointer-events-none absolute overflow-visible"
            style={{ left: -pad, top: -pad, width: s.w + pad * 2, height: s.h + pad * 2, zIndex: hl ? -1 : 1 }}
            viewBox={`${-pad} ${-pad} ${s.w + pad * 2} ${s.h + pad * 2}`}
            fill="none"
            aria-hidden
          >
            {[0, 1].map((n) => (
              <path
                key={n}
                className="m109-p"
                d={roughPath(m.mark, s.w, s.h, (k + 1) * 97 + n * 31)}
                stroke={m.color}
                strokeOpacity={hl ? 0.38 : 0.95}
                strokeWidth={hl ? s.h * 0.42 : n ? 2.4 : 3.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </svg>
        )}
      </span>
    );
  };
  return (
    <Frame refEl={root} glow="#ffd166">
      <p className="max-w-[1000px] text-center text-[clamp(38px,4.4vw,68px)] font-[400] leading-[1.35] tracking-[-0.01em]" style={{ fontFamily: F.fr }}>
        Roasted {word(0)}, packed {word(1)}, at your door in {word(2)}. Only {word(3)} a bag, and never {word(4)}.
      </p>
    </Frame>
  );
}

/* ───────────────── M110 · Handwriting draw ───────────────── */
const HELLO = [
  "M30 150 C60 120 92 64 88 42 C84 22 60 30 60 62 L56 160 C64 118 88 100 104 108 C118 116 110 150 116 158 C122 166 138 160 148 146",
  "M148 146 C160 132 184 122 184 106 C184 92 164 92 157 108 C149 128 158 160 184 160 C200 160 212 146 220 130",
  "M220 130 C240 100 262 56 255 38 C248 22 226 34 228 70 C230 110 228 150 245 160 C258 166 270 150 278 130",
  "M278 130 C298 100 320 56 313 38 C306 22 284 34 286 70 C288 110 286 150 303 160 C316 166 328 150 336 130",
  "M336 130 C340 112 354 98 370 100 C388 102 394 128 382 148 C370 166 344 162 342 140 C340 120 358 102 374 104 C388 106 400 104 414 96",
  "M48 192 C150 178 300 184 420 172",
];
function M110() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const paths = gsap.utils.toArray<SVGPathElement>(".m110-p", el);
    const glow = el.querySelector(".m110-glow");
    const svg = el.querySelector(".m110-svg");
    const lens = paths.map((p) => p.getTotalLength());
    const total = lens.reduce((a, b) => a + b, 0);
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(svg, { opacity: 1 }).set(paths, { drawSVG: "0%" }).set(glow, { opacity: 0 });
    paths.forEach((p, i) => tl.to(p, { drawSVG: "100%", duration: (lens[i] / total) * 1.9, ease: i === paths.length - 1 ? "power2.out" : "none" }));
    tl.to(glow, { opacity: 0.75, duration: 0.45, ease: "power1.out" }, "-=0.15")
      .to({}, { duration: 0.3 })
      .to(svg, { opacity: 0, duration: 0.35, ease: "power2.in" });
    return tl;
  });
  return (
    <Frame refEl={root} glow="#ff6bd6">
      <div className="w-full text-center">
        <svg className="m110-svg mx-auto block h-auto w-[min(62vw,820px)] overflow-visible" viewBox="0 0 450 210" fill="none" aria-label="hello">
          <g className="m110-glow" stroke="#ff6bd6" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "blur(6px)" }} opacity=".75">
            {HELLO.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
          {HELLO.map((d, i) => (
            <path key={i} className="m110-p" d={d} stroke="#fff1f8" strokeWidth={i === HELLO.length - 1 ? 3 : 5} strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </svg>
        <p className="mt-4 text-[15px] text-white/60" style={{ fontFamily: F.mn }}>
          Letterpress welcome cards · set of 8 · ₹750
        </p>
      </div>
    </Frame>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M99", name: "Bottom-up letters staircase", how: "Letters climb from far below (then drop from far above) one after another, crisp, no mask · plays on view", kind: "play", C: M99 },
  { code: "M100", name: "Box reveal wipe", how: "An accent box covers heading, subhead and button, slides off right while each rises 75px · plays on view", kind: "play", C: M100 },
  { code: "M101", name: "Char flip-up", how: "Characters flip up from edge-on (rotateX 90 → 0), line after line · plays on view", kind: "play", C: M101 },
  { code: "M102", name: "Chars stretch down from above", how: "Chars start low and stretched tall, spring into shape one by one · follows scroll", kind: "scrub", C: M102 },
  { code: "M103", name: "Circular text ring", how: "A seal of letters spins round a price badge; hover (auto pointer) speeds it up and grows it", kind: "play", C: M103 },
  { code: "M104", name: "Colour block line wipe", how: "A solid colour block wipes over each line, then off to the right leaving the text · plays on view", kind: "play", C: M104 },
  { code: "M105", name: "Echo-trail entrance", how: "Blurred tinted ghost copies slide in with lag and collapse into one word (right, up, diagonal)", kind: "play", C: M105 },
  { code: "M106", name: "Flip words", how: "The highlighted word blurs out upward, the next one types in letter by letter, the slot resizes · cycles", kind: "play", C: M106 },
  { code: "M107", name: "Focus-blur resolve", how: "The whole headline pulls from heavy blur into focus, holds, then blurs away · plays on view", kind: "play", C: M107 },
  { code: "M108", name: "Focus-in with tracking", how: "Text sharpens from blur while letter-spacing contracts (from depth), then expands · plays on view", kind: "play", C: M108 },
  { code: "M109", name: "Hand-drawn marker annotation", how: "Rough marker strokes draw twice round key words: underline, circle, highlight, box, strike · plays on view", kind: "play", C: M109 },
  { code: "M110", name: "Handwriting draw", how: "A script word writes itself stroke by stroke, then a soft glow fills in · plays on view", kind: "play", C: M110 },
];
