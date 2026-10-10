"use client";

// MOTION-MENU M90 – M98 (text, batch 1 group 2). Small focused demos for /lab/motion.
import { useEffect, useRef, type RefObject } from "react";
import { gsap, SplitText, prefersReducedMotion, loadPlugin } from "@/lib/gsap";
import { useScrub } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const GROTESK = "Space Grotesk Variable, system-ui, sans-serif";
const SERIF = "Fraunces Variable, Georgia, serif";
const EDITORIAL = "Instrument Serif, Georgia, serif";
const MANROPE = "Manrope Variable, system-ui, sans-serif";
const SYNE = "Syne Variable, system-ui, sans-serif";

/** A large soft glow that drifts forever (CSS only), so the stage never freezes. Stops in ?static=1 / reduced motion. */
function Glow({ code, color = "#4f8dff" }: { code: string; color?: string }) {
  const c = `${code}-glow`;
  return (
    <>
      <style>{`
.${c}{position:absolute;inset:-20%;pointer-events:none;background:radial-gradient(40% 45% at 50% 50%, ${color}5c, transparent 70%);animation:${c}-k 3.2s linear infinite alternate}
@keyframes ${c}-k{from{transform:translate3d(-14%,-6%,0) scale(1)}to{transform:translate3d(14%,8%,0) scale(1.15)}}
html.is-static .${c}{animation:none}
html.is-static {.${c}{animation:none}}
`}</style>
      <div className={c} aria-hidden />
    </>
  );
}

/**
 * Builds the demo's animation inside a gsap.context once, then plays it only while the stage is on screen
 * (pauses off screen). `make` returns the looping timeline (or a stop function for step-based loops).
 */
function useLoop(ref: RefObject<HTMLElement | null>, make: (root: HTMLElement) => gsap.core.Animation | { play(): void; pause(): void } | void) {
  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    let anim: ReturnType<typeof make> | undefined;
    let dead = false;
    const ctx = gsap.context(() => {
      anim = make(root);
      anim?.pause();
    }, root);
    const io = new IntersectionObserver(([e]) => {
      if (dead) return;
      if (e.isIntersecting) anim?.play();
      else anim?.pause();
    });
    io.observe(root);
    return () => {
      dead = true;
      io.disconnect();
      anim?.pause();
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** A step loop (for Flip-based DOM swaps): calls `step(i)` every `every` s while playing. */
function stepper(every: number, step: (i: number) => void) {
  let i = 0;
  let call: gsap.core.Tween | null = null;
  const next = () => {
    step(i++);
    call = gsap.delayedCall(every, next);
  };
  return {
    play() {
      if (!call) call = gsap.delayedCall(0.2, next);
      else call.resume();
    },
    pause() {
      call?.pause();
    },
  };
}

const Stage = ({ children, className = "", innerRef }: { children: React.ReactNode; className?: string; innerRef?: RefObject<HTMLDivElement | null> }) => (
  <div ref={innerRef} className={`relative grid h-full w-full place-items-center overflow-hidden rounded-[22px] bg-[#0a0d16] ${className}`}>
    {children}
  </div>
);

/* ------------------------------------------------------------------ M90 */
// Variant of M104 (single block wipe): TWO coloured blocks sweep across in sequence, the second ~0.15 s behind the
// first, and the text appears behind them. The loop alternates two headlines so every sweep unveils new words.
const M90_LINES = ["Made slow.", "Worn long."];
function M90() {
  const root = useRef<HTMLDivElement>(null);
  useLoop(root, (el) => {
    const text = el.querySelector<HTMLElement>(".m90-text")!;
    const a = el.querySelector(".m90-a");
    const b = el.querySelector(".m90-b");
    gsap.set(text, { autoAlpha: 0 });
    const tl = gsap.timeline({ repeat: -1 });
    M90_LINES.forEach((line) => {
      tl.set([a, b], { scaleX: 0, transformOrigin: "0% 50%" })
        .to(a, { scaleX: 1, duration: 0.42, ease: "power3.in" })
        .to(b, { scaleX: 1, duration: 0.42, ease: "power3.in" }, "<0.15")
        .call(() => {
          text.textContent = line;
        })
        .set(text, { autoAlpha: 1 })
        .set([a, b], { transformOrigin: "100% 50%" })
        .to(a, { scaleX: 0, duration: 0.5, ease: "power3.out" })
        .to(b, { scaleX: 0, duration: 0.5, ease: "power3.out" }, "<0.15")
        .to({}, { duration: 0.3 });
    });
    return tl;
  });
  return (
    <Stage innerRef={root}>
      <Glow code="m90" color="#ff4d6d" />
      <div className="relative">
        <h3 className="m90-text text-[clamp(64px,10vw,168px)] font-[700] leading-[1] tracking-[-0.035em] text-[#f6efe4]" style={{ fontFamily: GROTESK }}>
          {M90_LINES[0]}
        </h3>
        <span className="m90-a absolute inset-y-[-4%] left-[-2%] right-[-2%] bg-[#ff4d6d]" style={{ transform: "scaleX(0)" }} aria-hidden />
        <span className="m90-b absolute inset-y-[-4%] left-[-2%] right-[-2%] bg-[#ffb36b]" style={{ transform: "scaleX(0)" }} aria-hidden />
      </div>
    </Stage>
  );
}

/* ------------------------------------------------------------------ M91 */
// Variant of M106 (word swap in place): here the line RE-LAYS OUT. The swapped word slides vertically (old up and
// out, new in from below) while the static words glide sideways (GSAP Flip) to make room for its new width.
const M91_WORDS = ["calm", "unmistakable", "yours", "built to last"];
function M91() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    let loop: ReturnType<typeof stepper> | null = null;
    let on = false;
    let dead = false;
    const ctx = gsap.context(() => {});
    loadPlugin("Flip").then((Flip) => {
      if (dead) return;
      const box = el.querySelector<HTMLElement>(".m91-box")!;
      const statics = gsap.utils.toArray<HTMLElement>(".m91-static", el);
      loop = stepper(2, (i) =>
        ctx.add(() => {
          const word = M91_WORDS[(i + 1) % M91_WORDS.length];
          const old = box.querySelector<HTMLElement>(".m91-word")!;
          const state = Flip.getState([...statics, box]);
          const fresh = document.createElement("span");
          fresh.className = "m91-word inline-block whitespace-nowrap";
          fresh.textContent = word;
          const { offsetLeft, offsetTop } = old;
          old.style.position = "absolute";
          old.style.left = `${offsetLeft}px`;
          old.style.top = `${offsetTop}px`;
          box.appendChild(fresh);
          Flip.from(state, { duration: 0.7, ease: "power3.inOut" });
          gsap.fromTo(fresh, { yPercent: 110 }, { yPercent: 0, duration: 0.7, ease: "power3.inOut" });
          gsap.to(old, { yPercent: -110, duration: 0.7, ease: "power3.inOut", onComplete: () => old.remove() });
        }),
      );
      if (on) loop.play();
    });
    const io = new IntersectionObserver(([e]) => {
      on = e.isIntersecting;
      if (on) loop?.play();
      else loop?.pause();
    });
    io.observe(el);
    return () => {
      dead = true;
      io.disconnect();
      loop?.pause();
      ctx.revert();
    };
  }, []);
  return (
    <Stage innerRef={root}>
      <Glow code="m91" />
      <p className="flex flex-wrap items-baseline justify-center gap-x-[0.28em] px-6 text-center text-[clamp(40px,5.4vw,84px)] font-[600] leading-[1.1] tracking-[-0.025em]" style={{ fontFamily: GROTESK }}>
        <span className="m91-static inline-block whitespace-nowrap">A brand that feels</span>
        <span className="m91-box relative inline-block overflow-hidden rounded-[0.2em] bg-[#4f8dff]/15 px-[0.22em] pb-[0.06em] text-[#9fd8ff]">
          <span className="m91-word inline-block whitespace-nowrap">{M91_WORDS[0]}</span>
        </span>
        <span className="m91-static inline-block whitespace-nowrap">from day one.</span>
      </p>
    </Stage>
  );
}

/* ------------------------------------------------------------------ M92 */
// Variant of M119 (image-in-letters heading): the same moving image lives inside the type, but each word is
// painted in by a left-to-right clip-path wipe, one word after another.
const M92_IMG =
  "linear-gradient(115deg,#ff4d6d 0%,#ffb36b 22%,#f6e7b0 38%,#18c48f 55%,#2f8cff 72%,#8a5cf6 88%,#ff4d6d 100%)";
function M92() {
  const root = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLHeadingElement>(null);
  // place every word's background so the gradient image is continuous across the whole heading
  useEffect(() => {
    const h = head.current;
    if (!h) return;
    const fit = () => {
      h.querySelectorAll<HTMLElement>(".m92-w").forEach((w) => {
        w.style.backgroundSize = `${h.offsetWidth * 2}px ${h.offsetHeight}px`;
        w.style.setProperty("--ox", `${-w.offsetLeft}px`);
        w.style.setProperty("--oy", `${-w.offsetTop}px`);
      });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(h);
    return () => ro.disconnect();
  }, []);
  useLoop(root, (el) => {
    const words = el.querySelectorAll(".m92-w");
    const pan = gsap.to(el.querySelector(".m92-h"), { "--pan": "-60%", duration: 2.4, ease: "sine.inOut", repeat: -1, yoyo: true });
    const tl = gsap.timeline({ repeat: -1 });
    tl.fromTo(words, { clipPath: "inset(-10% 100% -10% 0%)" }, { clipPath: "inset(-10% 0% -10% 0%)", duration: 0.55, ease: "power2.inOut", stagger: 0.22 })
      .to({}, { duration: 0.3 })
      .to(words, { clipPath: "inset(-10% 0% -10% 100%)", duration: 0.4, ease: "power2.in", stagger: 0.06 });
    return gsap.timeline().add(tl).add(pan, 0);
  });
  const words = ["Colour,", "poured", "in."];
  return (
    <Stage innerRef={root}>
      <Glow code="m92" color="#8a5cf6" />
      <style>{`.m92-w{background-image:${M92_IMG};background-position:calc(var(--ox,0px) + var(--pan,0%)) var(--oy,0px);-webkit-background-clip:text;background-clip:text;color:transparent}
.m92-ghost{-webkit-text-stroke:1px rgba(255,255,255,.14);color:transparent}`}</style>
      <div className="relative">
        <h3 aria-hidden className="m92-ghost absolute inset-0 text-[clamp(64px,10.5vw,176px)] font-[800] italic leading-[1] tracking-[-0.03em]" style={{ fontFamily: SERIF }}>
          {words.join(" ")}
        </h3>
        <h3 ref={head} className="m92-h relative text-[clamp(64px,10.5vw,176px)] font-[800] italic leading-[1] tracking-[-0.03em]" style={{ fontFamily: SERIF, ["--pan" as string]: "0%" }}>
          {words.map((w, i) => (
            <span key={i}>
              <span className="m92-w inline-block pr-[0.04em]">{w}</span>
              {i < words.length - 1 ? " " : ""}
            </span>
          ))}
        </h3>
      </div>
    </Stage>
  );
}

/* ------------------------------------------------------------------ M93 */
// Variant of M122 (fold from the top): each word swings UP from a hinge on its bottom edge (rotateX 92 → 0),
// like paper flaps lifting off a table.
function M93() {
  const root = useRef<HTMLDivElement>(null);
  useLoop(root, (el) => {
    const split = new SplitText(el.querySelector(".m93-h"), { type: "words,lines", linesClass: "m93-line" });
    gsap.set(split.words, { transformOrigin: "50% 100%", transformPerspective: 700, display: "inline-block" });
    return gsap.fromTo(
      split.words,
      { rotationX: 92, opacity: 0.2 },
      { rotationX: 0, opacity: 1, duration: 0.9, ease: "power2.out", stagger: 0.06, repeat: -1, yoyo: true, repeatDelay: 0.3 },
    );
  });
  return (
    <Stage innerRef={root}>
      <Glow code="m93" color="#e0913f" />
      <style>{`.m93-line{border-bottom:1px solid rgba(255,213,154,.25);padding-bottom:.04em}`}</style>
      <h3 className="m93-h max-w-[14ch] text-center text-[clamp(56px,8vw,132px)] font-[700] leading-[1.02] tracking-[-0.03em] text-[#fff6e8]" style={{ fontFamily: SYNE }}>
        Paper goods for slow desks
      </h3>
    </Stage>
  );
}

/* ------------------------------------------------------------------ M94 */
// Variant of U33 (hover letter roll): here every letter rolls from word A to word B driven directly by the scroll,
// staggered across the word, two stacked rows inside a clipped cell.
const M94_A = "SOFT";
const M94_B = "BOLD";
function M94() {
  const root = useRef<HTMLDivElement>(null);
  useScrub(root, (p) => {
    const cols = root.current?.querySelectorAll<HTMLElement>(".m94-col");
    if (!cols) return;
    const n = cols.length;
    const d = 0.16; // stagger (fraction of the scroll) between letters
    const span = 1 - d * (n - 1);
    cols.forEach((c, i) => {
      const local = gsap.utils.clamp(0, 1, (p - i * d) / span);
      gsap.set(c, { yPercent: -50 * local });
    });
  });
  return (
    <Stage innerRef={root}>
      <Glow code="m94" color="#18c48f" />
      <div className="text-center">
        <div className="flex justify-center text-[clamp(120px,20vw,320px)] font-[700] leading-[0.86] tracking-[-0.04em]" style={{ fontFamily: GROTESK }}>
          {M94_A.split("").map((ch, i) => (
            <span key={i} className="relative inline-block h-[0.86em] overflow-hidden">
              <span className="m94-col flex flex-col">
                <span className="h-[0.86em] text-[#eaf5ff]">{ch}</span>
                <span className="h-[0.86em] text-[#c8ff8a]">{M94_B[i]}</span>
              </span>
            </span>
          ))}
        </div>
        <p className="mt-6 text-[15px] uppercase tracking-[0.2em] text-white/55" style={{ fontFamily: MANROPE }}>
          Same bag · two moods · ₹6,450
        </p>
      </div>
    </Stage>
  );
}

/* ------------------------------------------------------------------ M95 */
// Variant of M113 (lines stack up from below): each new line drops in from ABOVE onto its own row and pushes the
// stack down (GSAP Flip), until a centred three-line composition locks.
const M95_DROPS = ["Poured slow.", "Roasted dark.", "Grown high."]; // dropped in this order; the last lands on top
function M95() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    let loop: ReturnType<typeof stepper> | null = null;
    let on = false;
    let dead = false;
    const ctx = gsap.context(() => {});
    const stack = el.querySelector<HTMLElement>(".m95-stack")!;
    loadPlugin("Flip").then((Flip) => {
      if (dead) return;
      stack.innerHTML = "";
      loop = stepper(0.75, (i) =>
        ctx.add(() => {
          const k = i % (M95_DROPS.length + 1);
          if (k === M95_DROPS.length) {
            // locked composition held, now clear it for the next round
            gsap.to(stack.children, { opacity: 0, y: 40, duration: 0.35, ease: "power2.in", stagger: 0.04, onComplete: () => void (stack.innerHTML = "") });
            return;
          }
          const state = Flip.getState(stack.children);
          const line = document.createElement("div");
          line.className = `m95-line ${k === M95_DROPS.length - 1 ? "text-[#9fd8ff]" : ""}`;
          line.textContent = M95_DROPS[k];
          stack.prepend(line);
          Flip.from(state, { duration: 0.55, ease: "power3.out" });
          gsap.fromTo(line, { yPercent: -120, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.55, ease: "power3.out" });
        }),
      );
      if (on) loop.play();
    });
    const io = new IntersectionObserver(([e]) => {
      on = e.isIntersecting;
      if (on) loop?.play();
      else loop?.pause();
    });
    io.observe(el);
    return () => {
      dead = true;
      io.disconnect();
      loop?.pause();
      ctx.revert();
    };
  }, []);
  return (
    <Stage innerRef={root}>
      <Glow code="m95" color="#2f8cff" />
      <div
        className="m95-stack flex min-h-[3.3em] flex-col items-center justify-center text-center text-[clamp(52px,7vw,112px)] font-[600] leading-[1.08] tracking-[-0.03em]"
        style={{ fontFamily: GROTESK }}
      >
        {[...M95_DROPS].reverse().map((t, i) => (
          <div key={t} className={`m95-line ${i === 0 ? "text-[#9fd8ff]" : ""}`}>
            {t}
          </div>
        ))}
      </div>
    </Stage>
  );
}

/* ------------------------------------------------------------------ M96 */
// Variant of M124 (masked word rise): NO mask, a short 14px rise with a fade, a calm keynote stagger.
function M96() {
  const root = useRef<HTMLDivElement>(null);
  useLoop(root, (el) => {
    const split = new SplitText(el.querySelector(".m96-h"), { type: "words" });
    const sub = el.querySelector(".m96-sub");
    const tl = gsap.timeline({ repeat: -1 });
    tl.fromTo(split.words, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "power2.out", stagger: 0.11 })
      .fromTo(sub, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }, "-=0.35")
      .to({}, { duration: 0.3 })
      .to([...split.words, sub], { opacity: 0, duration: 0.35, ease: "power1.in" });
    return tl;
  });
  return (
    <Stage innerRef={root}>
      <Glow code="m96" color="#9fd8ff" />
      <div className="px-6 text-center">
        <h3 className="m96-h mx-auto max-w-[18ch] text-[clamp(48px,6.4vw,104px)] font-[700] leading-[1.04] tracking-[-0.035em] text-white" style={{ fontFamily: MANROPE }}>
          Designed to disappear into your day.
        </h3>
        <p className="m96-sub mt-6 text-[18px] text-white/60" style={{ fontFamily: MANROPE }}>
          Halo One earbuds · from ₹14,900
        </p>
      </div>
    </Stage>
  );
}

/* ------------------------------------------------------------------ M97 */
// Variant of M23 (word rotator): the swap is per CHARACTER in 3D (out: rotateX up + y; in: rise from below) and the
// stagger origin cycles first → last → centre; the accent pill resizes smoothly to each new word.
const M97_WORDS = ["slow mornings", "late drives", "long talks", "first dates"];
const M97_FROM = ["start", "end", "center"] as const;
function M97() {
  const root = useRef<HTMLDivElement>(null);
  const tag = useRef<HTMLSpanElement>(null);
  useLoop(root, (el) => {
    const pill = el.querySelector<HTMLElement>(".m97-pill")!;
    const words = gsap.utils.toArray<HTMLElement>(".m97-word", el);
    const splits = words.map((w) => new SplitText(w, { type: "chars" }));
    const padX = () => parseFloat(getComputedStyle(pill).paddingLeft) * 2;
    gsap.set(words, { autoAlpha: 0 });
    gsap.set(words[0], { autoAlpha: 1 });
    gsap.set(pill, { width: words[0].offsetWidth + padX() });
    const tl = gsap.timeline({ repeat: -1 });
    words.forEach((_, i) => {
      const j = (i + 1) % words.length;
      const from = M97_FROM[i % M97_FROM.length];
      tl.to({}, { duration: 1.1 })
        .call(() => {
          if (tag.current) tag.current.textContent = `stagger from: ${from === "start" ? "first" : from === "end" ? "last" : "centre"}`;
        })
        .to(splits[i].chars, { rotationX: 90, yPercent: -60, opacity: 0, duration: 0.45, ease: "power2.in", stagger: { each: 0.025, from } })
        .set(words[j], { autoAlpha: 1 }, "<0.2")
        .to(pill, { width: () => words[j].offsetWidth + padX(), duration: 0.6, ease: "power3.inOut" }, "<")
        .fromTo(
          splits[j].chars,
          { rotationX: -90, yPercent: 60, opacity: 0 },
          { rotationX: 0, yPercent: 0, opacity: 1, duration: 0.55, ease: "power3.out", stagger: { each: 0.025, from }, immediateRender: false },
          "<0.1",
        )
        .set(words[i], { autoAlpha: 0 });
    });
    return tl;
  });
  return (
    <Stage innerRef={root}>
      <Glow code="m97" color="#ff4d6d" />
      <div className="text-center">
        <p className="flex flex-wrap items-center justify-center gap-x-[0.3em] text-[clamp(44px,5.8vw,92px)] font-[600] leading-[1.15] tracking-[-0.025em]" style={{ fontFamily: GROTESK }}>
          <span>Coffee for</span>
          <span className="m97-pill relative inline-block h-[1.25em] rounded-full bg-[#ff4d6d] px-[0.45em] text-[#1a0b12]" style={{ perspective: "600px" }}>
            {M97_WORDS.map((w, i) => (
              <span
                key={w}
                className={`m97-word whitespace-nowrap ${i ? "absolute left-[0.45em] top-[0.08em]" : "relative top-[0.08em] inline-block"}`}
                style={{ transformStyle: "preserve-3d", visibility: i ? "hidden" : undefined }}
              >
                {w}
              </span>
            ))}
          </span>
        </p>
        <span ref={tag} className="mt-6 inline-block rounded-full border border-white/15 px-3 py-1 text-[13px] text-white/60" style={{ fontFamily: GROTESK }}>
          stagger from: first
        </span>
      </div>
    </Stage>
  );
}

/* ------------------------------------------------------------------ M98 */
// Variant of M6 (letters rise in): NO travel at all. Each letter condenses in place from blur(10px) + opacity 0,
// staggered 0.03 s left to right, like letters forming out of fog.
function M98() {
  const root = useRef<HTMLDivElement>(null);
  useLoop(root, (el) => {
    const split = new SplitText(el.querySelector(".m98-h"), { type: "chars,words" });
    const tl = gsap.timeline({ repeat: -1 });
    tl.fromTo(split.chars, { filter: "blur(10px)", opacity: 0 }, { filter: "blur(0px)", opacity: 1, duration: 0.7, ease: "power2.out", stagger: 0.03 })
      .to({}, { duration: 0.3 })
      .to(split.chars, { filter: "blur(10px)", opacity: 0, duration: 0.45, ease: "power1.in", stagger: 0.01 });
    return tl;
  });
  return (
    <Stage innerRef={root}>
      <Glow code="m98" color="#c8d6ff" />
      <h3 className="m98-h text-center text-[clamp(72px,11vw,184px)] italic leading-[0.95] tracking-[-0.02em] text-[#eef2ff]" style={{ fontFamily: EDITORIAL }}>
        Out of the fog.
      </h3>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M90", name: "Dual curtain text wipe", how: "Two coloured blocks sweep across the heading, the second 0.15 s behind, and unveil the text (on enter, loops).", kind: "play", C: M90 },
  { code: "M91", name: "Layout-pushing word flip", how: "The swapped word slides up and out / in from below while the static words glide sideways to make room (Flip).", kind: "play", C: M91 },
  { code: "M92", name: "Mask-filled heading, word wipe", how: "A moving image inside the letters; each word is painted in by a left-to-right clip-path wipe, in sequence.", kind: "play", C: M92 },
  { code: "M93", name: "Paper-fold from bottom hinge (words)", how: "Words swing up from a bottom hinge (rotateX 92 → 0), staggered 0.06 s, power2.out, on enter.", kind: "play", C: M93 },
  { code: "M94", name: "Scroll-scrubbed letter swap", how: "Each letter rolls from word A to word B in a clipped cell, staggered, scrubbed directly by the scroll.", kind: "scrub", C: M94 },
  { code: "M95", name: "Short slide-down stack", how: "Each new line drops in from above and pushes the stack down (Flip) until three centred lines lock.", kind: "play", C: M95 },
  { code: "M96", name: "Word pull-up", how: "Words rise 14px with a fade, no mask, a calm keynote stagger.", kind: "play", C: M96 },
  { code: "M97", name: "3D rotating phrase swap", how: "Every 2 s the word's chars rotate up and out and the new ones rise in (stagger from first / last / centre); the pill resizes.", kind: "play", C: M97 },
  { code: "M98", name: "Blur-in characters, no travel", how: "Each letter sharpens in place from blur(10px) and opacity 0, staggered 0.03 s left to right, on enter.", kind: "play", C: M98 },
];
