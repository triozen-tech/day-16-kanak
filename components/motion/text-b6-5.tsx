"use client";

// Text motions, batch 6 · group 5 (MOTION-MENU M278–M289). Small focused demos for /lab/motion, rebuilt in GSAP / CSS from the idea only.
// Every demo: plays by itself on screen (or follows the scroll), loops, has a CSS glow loop that never stops,
// and shows a sensible final state in ?static=1 / reduced motion.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, SplitText, prefersReducedMotion } from "@/lib/gsap";
import { scene, useScrub } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = { sg: "Space Grotesk Variable", fr: "Fraunces Variable", is: "Instrument Serif", sy: "Syne Variable", mr: "Manrope Variable" };
const ACC = "#ff9a5c";

/* ── M280 drum keyframes: 8 faces, each step = hold 30 % then an eased turn of 45° (hold ≈ 0.27 s) ── */
const DRUM_N = 8;
const DRUM_T = 0.9; // seconds per word
const DRUM_R = (0.575 / Math.tan(Math.PI / DRUM_N)).toFixed(3); // em: half the face height / tan(half the face angle)
const DRUM_KF = (() => {
  const step = 360 / DRUM_N;
  let s = "";
  for (let k = 0; k < DRUM_N; k++) {
    const a = ((k / DRUM_N) * 100).toFixed(3);
    const b = (((k + 0.3) / DRUM_N) * 100).toFixed(3);
    s += `${a}%{transform:translateZ(-${DRUM_R}em) rotateX(${k * step}deg)}`;
    s += `${b}%{transform:translateZ(-${DRUM_R}em) rotateX(${k * step}deg);animation-timing-function:cubic-bezier(.65,0,.25,1.15)}`;
  }
  s += `100%{transform:translateZ(-${DRUM_R}em) rotateX(360deg)}`;
  return `@keyframes m280-turn{${s}}`;
})();

const CSS = `
.b6g5-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 32% 38%,var(--g1,rgba(255,154,92,.42)),transparent 70%),radial-gradient(34% 40% at 70% 66%,var(--g2,rgba(79,141,255,.22)),transparent 70%);animation:b6g5-drift 6s linear infinite alternate;will-change:transform}
@keyframes b6g5-drift{0%{transform:translate3d(-7%,-5%,0) scale(1)}100%{transform:translate3d(7%,6%,0) scale(1.15)}}
.m280-view{perspective:900px;perspective-origin:50% 50%}
.m280-drum{position:relative;height:1.15em;transform-style:preserve-3d;transform:translateZ(-${DRUM_R}em);animation:m280-turn ${DRUM_N * DRUM_T}s linear infinite}
.m280-face{position:absolute;inset:0;display:flex;align-items:center;backface-visibility:hidden;-webkit-backface-visibility:hidden;white-space:nowrap}
.m280-off .m280-drum{animation-play-state:paused}
${DRUM_KF}
.m282-top,.m282-bot{transition:transform .55s cubic-bezier(.7,0,.2,1)}
.m282-top{clip-path:inset(0 0 50% 0)}
.m282-bot{clip-path:inset(50% 0 0 0)}
.m282-line{transform:scaleX(0);transition:transform .55s cubic-bezier(.7,0,.2,1)}
.m282-w.on .m282-top,.m282-w:hover .m282-top{transform:translateX(-7%)}
.m282-w.on .m282-bot,.m282-w:hover .m282-bot{transform:translateX(7%)}
.m282-w.on .m282-line,.m282-w:hover .m282-line{transform:scaleX(1)}
.m284-spin{animation:m284-spin 30s linear infinite}
@keyframes m284-spin{to{transform:rotate(360deg)}}
html.is-static .b6g5-glow,html.is-static .m280-drum,html.is-static .m284-spin{animation:none}
html.is-static {.b6g5-glow,.m280-drum,.m284-spin{animation:none}.m282-top,.m282-bot,.m282-line{transition:none}}
`;

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0f1c] text-[#eaf5ff] ${className}`}>
      <style href="b6g5-css" precedence="default">
        {CSS}
      </style>
      <div className="b6g5-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/**
 * "play" helper: waits for fonts, builds the looping animation inside a gsap.context, plays it only while the demo is
 * on screen, and reverts everything on unmount. Nothing runs with prefersReducedMotion() (markup = final state).
 */
function usePlay(ref: RefObject<HTMLElement | null>, build: (root: HTMLElement, onClean: (fn: () => void) => void) => gsap.core.Animation | void) {
  const b = useRef(build);
  b.current = build;
  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    let dead = false;
    let on = false;
    let anim: gsap.core.Animation | void;
    const cleans: (() => void)[] = [];
    const ctx = gsap.context(() => {}, root);
    const sync = () => {
      if (!anim) return;
      if (on) anim.play();
      else anim.pause();
    };
    const io = new IntersectionObserver(
      ([e]) => {
        on = e.isIntersecting;
        sync();
      },
      { threshold: 0.1 },
    );
    io.observe(root);
    document.fonts.ready.then(() => {
      if (dead) return;
      ctx.add(() => {
        anim = b.current(root, (fn) => cleans.push(fn));
      });
      sync();
    });
    return () => {
      dead = true;
      io.disconnect();
      ctx.revert();
      cleans.forEach((f) => f());
    };
  }, [ref]);
}

/**
 * Pointer source for proximity demos: a real pointer wins while it moves (and for 1.2 s after), otherwise the fake
 * pointer (driven by a looping tween) is used. Returns the current point in root-relative px.
 */
function pointerSource(root: HTMLElement, onClean: (fn: () => void) => void) {
  const real = { x: 0, y: 0, t: -1e9 };
  const move = (e: PointerEvent) => {
    const r = root.getBoundingClientRect();
    real.x = e.clientX - r.left;
    real.y = e.clientY - r.top;
    real.t = performance.now();
  };
  root.addEventListener("pointermove", move);
  onClean(() => root.removeEventListener("pointermove", move));
  return (fake: { x: number; y: number }) => (performance.now() - real.t < 1200 ? { x: real.x, y: real.y, real: true } : { ...fake, real: false });
}

/** Runs fn on gsap's ticker while `anim` is playing (the play helper pauses it off screen). */
function tickWhile(anim: gsap.core.Animation, onClean: (fn: () => void) => void, fn: (dt: number) => void) {
  const tick = (_t: number, dtMs: number) => {
    if (!anim.paused()) fn(Math.min(0.05, dtMs / 1000));
  };
  gsap.ticker.add(tick);
  onClean(() => gsap.ticker.remove(tick));
}

/* ───────────────────────── M278 · Pinned words recede to z -1000 (scrub, SplitText) ───────────────────────── */
function M278() {
  const root = useRef<HTMLDivElement>(null);
  const para = useRef<HTMLParagraphElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const last = useRef(0);
  useEffect(() => {
    const p = para.current;
    if (!p || prefersReducedMotion()) return;
    let dead = false;
    let split: SplitText | null = null;
    const ctx = gsap.context(() => {}, p);
    document.fonts.ready.then(() => {
      if (dead) return;
      ctx.add(() => {
        split = SplitText.create(p, { type: "words" });
        const words = split.words as HTMLElement[];
        const pr = p.getBoundingClientRect();
        const cx = pr.left + pr.width / 2;
        const cy = pr.top + pr.height / 2;
        // rotation grows with each word's distance from the block centre (above centre tips back, below tips forward)
        const meta = words.map((w) => {
          const r = w.getBoundingClientRect();
          const dx = (r.left + r.width / 2 - cx) / (pr.width / 2);
          const dy = (r.top + r.height / 2 - cy) / (pr.height / 2);
          return { rot: gsap.utils.clamp(-1, 1, dy) * 70 + dx * 18, d: Math.hypot(dx, dy) };
        });
        const order = meta.map((m, i) => ({ i, d: m.d })).sort((a, b) => b.d - a.d); // outer words go first
        const tl = gsap.timeline({ paused: true });
        order.forEach(({ i }, k) => {
          tl.to(
            words[i],
            { z: -1000, rotationX: meta[i].rot, opacity: 0.12, duration: 1, ease: "back.in(1.6)", transformOrigin: "50% 50% -40px" },
            (k / Math.max(1, words.length - 1)) * 1.2,
          );
        });
        tlRef.current = tl;
        tl.progress(last.current);
      });
    });
    return () => {
      dead = true;
      tlRef.current = null;
      ctx.revert();
      split?.revert();
    };
  }, []);
  useScrub(
    root,
    (p) => {
      last.current = p;
      tlRef.current?.progress(p); // linear over the whole panel
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    },
    { finalValue: 0 },
  );
  return (
    <Stage r={root} g1="rgba(255,154,92,.38)" g2="rgba(79,141,255,.24)">
      <div className="absolute inset-0 grid place-items-center px-[8%]">
        <p
          ref={para}
          className="max-w-[26ch] text-center text-[clamp(34px,3.9vw,60px)] leading-[1.12] tracking-[-0.01em]"
          style={{ fontFamily: F.fr, perspective: "1000px", perspectiveOrigin: "50% 50%" }}
        >
          Every bowl is thrown by hand, fired twice and left to cool overnight, so no two glazes ever settle quite the same way.
        </p>
      </div>
      <div className="absolute bottom-5 left-6 flex items-center gap-4 text-[13px] uppercase tracking-[0.18em] text-white/65">
        <span>Kiln studio · stoneware bowl · ₹1,850</span>
        <span className="relative block h-px w-[160px] bg-white/15">
          <span ref={bar} className="absolute inset-0 origin-left bg-[#ff9a5c]" style={{ transform: "scaleX(0)" }} />
        </span>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M279 · Proximity char scale (play, gsap ticker + auto pointer) ───────────────────────── */
const M279_WORD = "Featherweight";
function M279() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const head = el.querySelector<HTMLElement>(".m279-h")!;
    const chars = gsap.utils.toArray<HTMLElement>(".m279-c", el);
    const dot = el.querySelector<HTMLElement>(".m279-dot")!;
    const read = pointerSource(el, onClean);
    const cur = chars.map(() => 0);
    const fake = { u: 0 };
    const sweep = gsap.to(fake, { u: 1, duration: 2.2, ease: "sine.inOut", repeat: -1, yoyo: true });
    const sx = chars.map((c) => gsap.quickSetter(c, "scale"));
    const col = chars.map((c) => gsap.quickSetter(c, "color"));
    tickWhile(sweep, onClean, (dt) => {
      const rr = el.getBoundingClientRect();
      const hr = head.getBoundingClientRect();
      const fx = hr.left - rr.left + fake.u * hr.width;
      const fy = hr.top - rr.top + hr.height * (0.55 + 0.12 * Math.sin(fake.u * Math.PI * 3));
      const p = read({ x: fx, y: fy });
      gsap.set(dot, { x: p.x, y: p.y, opacity: p.real ? 0 : 1 });
      const R = Math.max(160, hr.height * 1.6);
      const k = 1 - Math.exp(-dt * 11); // smooth lerp, frame-rate independent
      chars.forEach((c, i) => {
        const cx = hr.left - rr.left + c.offsetLeft + c.offsetWidth / 2;
        const cy = hr.top - rr.top + c.offsetTop + c.offsetHeight / 2;
        const t = Math.max(0, 1 - Math.hypot(p.x - cx, p.y - cy) / R);
        cur[i] += (t * t * (3 - 2 * t) - cur[i]) * k;
        sx[i](1 + 0.55 * cur[i]);
        col[i](gsap.utils.interpolate("#eaf5ff", ACC, cur[i]));
      });
    });
    return sweep;
  });
  return (
    <Stage r={root} g1="rgba(255,154,92,.4)" g2="rgba(79,141,255,.2)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center">
          <h3 className="m279-h relative whitespace-nowrap text-[clamp(56px,7vw,112px)] font-[600] leading-none tracking-[0.01em]" style={{ fontFamily: F.sg }}>
            {M279_WORD.split("").map((c, i) => (
              <span key={i} className="m279-c inline-block" style={{ transformOrigin: "50% 75%" }}>
                {c}
              </span>
            ))}
          </h3>
          <p className="mt-8 text-[13px] uppercase tracking-[0.22em] text-white/60">Trail runner · 212 g · ₹9,490</p>
        </div>
      </div>
      <span className="m279-dot pointer-events-none absolute left-0 top-0 -ml-[7px] -mt-[7px] h-[14px] w-[14px] rounded-full border-2 border-white bg-white/30 opacity-0" aria-hidden />
    </Stage>
  );
}

/* ───────────────────────── M280 · Rotating word cylinder (play, CSS 3D) ───────────────────────── */
const M280_WORDS = ["mornings", "long runs", "rainy days", "commutes", "slow Sundays", "late flights", "first dates", "every day"];
function M280() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => el.classList.toggle("m280-off", !e.isIntersecting), { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Stage r={root} g1="rgba(255,154,92,.38)" g2="rgba(160,120,255,.22)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="flex items-center gap-[0.32em] text-[clamp(52px,6vw,96px)] leading-none tracking-[-0.015em]" style={{ fontFamily: F.fr }}>
          <span>Made for</span>
          <span className="m280-view relative block w-[6.4em]">
            <span
              className="pointer-events-none absolute inset-x-0 -top-[1.2em] z-10 h-[1.6em] bg-gradient-to-b from-[#0a0f1c] to-transparent"
              aria-hidden
            />
            <span className="m280-drum block italic text-[#ff9a5c]">
              {M280_WORDS.map((w, i) => (
                <span key={w} className="m280-face" style={{ transform: `rotateX(${-i * (360 / DRUM_N)}deg) translateZ(${DRUM_R}em)` }} aria-hidden={i > 0}>
                  {w}
                </span>
              ))}
            </span>
            <span
              className="pointer-events-none absolute inset-x-0 -bottom-[1.2em] z-10 h-[1.6em] bg-gradient-to-t from-[#0a0f1c] to-transparent"
              aria-hidden
            />
          </span>
        </div>
      </div>
      <p className="absolute bottom-5 left-6 text-[13px] uppercase tracking-[0.18em] text-white/60">Everyday sneaker · 6 colours · ₹6,990</p>
    </Stage>
  );
}

/* ───────────────────────── M281 · Scale-down settle (play) ───────────────────────── */
const M281_SETS = [
  { k: "New season", h: "Linen, washed soft.", p: "Relaxed shirt · ₹3,290" },
  { k: "Just landed", h: "Cotton that breathes.", p: "Camp collar tee · ₹1,690" },
  { k: "Back in stock", h: "Wool for cold mornings.", p: "Merino crew · ₹5,450" },
];
function M281() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const sets = gsap.utils.toArray<HTMLElement>(".m281-s", el);
    const tl = gsap.timeline({ repeat: -1 });
    sets.forEach((s, i) => {
      const parts = s.querySelectorAll(".m281-p");
      tl.set(s, { visibility: "visible" });
      tl.fromTo(parts, { scale: 1.06, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.95, ease: "power3.out", stagger: 0.1, immediateRender: false });
      tl.to(parts, { opacity: 0, duration: 0.35, ease: "power2.in", stagger: 0.04 }, "+=0.2");
      tl.set(s, { visibility: "hidden" });
    });
    gsap.set(sets.slice(1), { visibility: "hidden" });
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,190,130,.36)" g2="rgba(79,141,255,.2)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="grid place-items-center">
          {M281_SETS.map((s, i) => (
            <div key={s.h} className="m281-s text-center [grid-area:1/1]" style={i ? { visibility: "hidden" } : undefined} aria-hidden={i > 0}>
              <p className="m281-p text-[13px] uppercase tracking-[0.24em] text-[#ff9a5c]">{s.k}</p>
              <h3 className="m281-p mt-5 whitespace-nowrap text-[clamp(52px,6.4vw,104px)] leading-none tracking-[-0.02em]" style={{ fontFamily: F.is }}>
                {s.h}
              </h3>
              <p className="m281-p mt-6 text-[15px] tracking-[0.04em] text-white/70" style={{ fontFamily: F.mr }}>
                {s.p}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M282 · Sliced halves hover (play, CSS + auto pointer) ───────────────────────── */
function M282() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const w = el.querySelector<HTMLElement>(".m282-w")!;
    const ring = el.querySelector<HTMLElement>(".m282-ring")!;
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(ring, { left: "80%", top: "76%", opacity: 1 });
    tl.to(ring, { left: "54%", top: "50%", duration: 0.55, ease: "power2.inOut" });
    tl.call(() => w.classList.add("on"));
    tl.to(ring, { scale: 0.7, duration: 0.18, yoyo: true, repeat: 1, ease: "power1.inOut" });
    tl.to(ring, { left: "60%", top: "54%", duration: 0.45, ease: "sine.inOut" });
    tl.to(ring, { left: "22%", top: "30%", duration: 0.55, ease: "power2.inOut" });
    tl.call(() => w.classList.remove("on"), [], "<0.05");
    tl.to(ring, { left: "80%", top: "76%", duration: 0.7, ease: "sine.inOut" }, ">0.1");
    return tl;
  });
  const word = "Sliced";
  const cls = "block whitespace-nowrap text-[clamp(96px,12vw,190px)] font-[800] uppercase leading-[0.95] tracking-[-0.02em]";
  return (
    <Stage r={root} g1="rgba(255,154,92,.42)" g2="rgba(79,141,255,.22)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center">
          <span className="m282-w relative inline-block cursor-pointer" style={{ fontFamily: F.sy }}>
            <span className={`m282-top ${cls}`}>{word}</span>
            <span className={`m282-bot absolute inset-0 text-[#ff9a5c] ${cls}`} aria-hidden>
              {word}
            </span>
            <span className="m282-line absolute left-[-4%] right-[-4%] top-1/2 block h-[2px] bg-white/80" aria-hidden />
          </span>
          <p className="mt-8 text-[13px] uppercase tracking-[0.22em] text-white/60">Cured salmon · 200 g · ₹1,240</p>
        </div>
      </div>
      <span className="m282-ring pointer-events-none absolute -ml-[14px] -mt-[14px] h-[28px] w-[28px] rounded-full border-2 border-white opacity-0" style={{ left: "80%", top: "76%" }} aria-hidden />
    </Stage>
  );
}

/* ───────────────────────── M283 · Slot cell text roll (play) ───────────────────────── */
const M283_ROWS = [
  ["SAND", "MOSS", "CLAY", "DUSK"],
  ["₹2,490", "₹3,875", "₹1,260", "₹4,999"],
];
function SlotRow({ vals, cellW, className, font }: { vals: string[]; cellW: (ch: string) => string; className: string; font: string }) {
  return (
    <div className={`flex justify-center ${className}`} style={{ fontFamily: font }}>
      {vals[0].split("").map((c, i) => (
        <span key={i} className="m283-cell relative inline-block overflow-hidden text-center" style={{ width: cellW(c), height: "1.12em" }}>
          <span className="m283-a block leading-[1.12em]">{c}</span>
          <span className="m283-b absolute inset-0 block leading-[1.12em]" style={{ transform: "translateY(115%)" }} aria-hidden>
            {c}
          </span>
        </span>
      ))}
    </div>
  );
}
function M283() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const rows = gsap.utils.toArray<HTMLElement>(".m283-row", el);
    const cells = rows.map((r) => gsap.utils.toArray<HTMLElement>(".m283-cell", r).map((c) => [c.querySelector<HTMLElement>(".m283-a")!, c.querySelector<HTMLElement>(".m283-b")!]));
    gsap.set(el.querySelectorAll(".m283-a"), { y: 0, yPercent: 0 });
    gsap.set(el.querySelectorAll(".m283-b"), { y: 0, yPercent: 115 });
    const n = M283_ROWS[0].length;
    const tl = gsap.timeline({ repeat: -1 });
    for (let s = 0; s < n; s++) {
      const at = s * 1.25;
      const nx = (s + 1) % n;
      rows.forEach((_, r) => {
        const from = M283_ROWS[r][s];
        const to = M283_ROWS[r][nx];
        cells[r].forEach(([a, b], i) => {
          const cur = s % 2 === 0 ? a : b;
          const nxt = s % 2 === 0 ? b : a;
          const t = at + 0.25 + i * 0.06 + r * 0.12;
          tl.call(() => (nxt.textContent = to[i]), [], at);
          if (from[i] === to[i]) {
            tl.set(cur, { yPercent: 115 }, t);
            tl.set(nxt, { yPercent: 0 }, t);
          } else {
            tl.to(cur, { yPercent: -115, duration: 0.32, ease: "power2.in" }, t);
            tl.fromTo(nxt, { yPercent: 115 }, { yPercent: 0, duration: 0.62, ease: "back.out(2.4)", immediateRender: false }, t + 0.08);
            tl.set(cur, { yPercent: 115 }, t + 0.4);
          }
        });
      });
    }
    tl.to({}, { duration: 0.01 }, n * 1.25);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,154,92,.4)" g2="rgba(120,200,160,.2)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center">
          <p className="text-[13px] uppercase tracking-[0.24em] text-white/60">Canvas tote · colour</p>
          <SlotRow vals={M283_ROWS[0]} cellW={() => "0.84em"} className="m283-row mt-4 text-[clamp(64px,7.4vw,118px)] font-[700] text-[#ff9a5c]" font={F.sg} />
          <SlotRow
            vals={M283_ROWS[1]}
            cellW={(c) => (c === "," ? "0.3em" : "0.64em")}
            className="m283-row mt-3 text-[clamp(56px,6.2vw,100px)] font-[500] [font-variant-numeric:tabular-nums]"
            font={F.sg}
          />
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M284 · Spinning text with per-char blur-in (play) ───────────────────────── */
const M284_TEXT = "SMALL BATCH · SLOW ROASTED · HILL GROWN · ";
function M284() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const ring = el.querySelector<HTMLElement>(".m284-ring")!;
    const chars = gsap.utils.toArray<HTMLElement>(".m284-c", el);
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(ring, { rotation: 0 });
    tl.fromTo(chars, { opacity: 0, filter: "blur(4px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.45, ease: "power2.out", stagger: 0.03, immediateRender: false }, 0);
    tl.to(ring, { rotation: 360, duration: 2.1, ease: "elastic.out(1, 0.6)" }, 0);
    tl.to(chars, { opacity: 0, filter: "blur(4px)", duration: 0.3, ease: "power1.in", stagger: 0.008 }, ">-0.15");
    return tl;
  });
  const n = M284_TEXT.length;
  return (
    <Stage r={root} g1="rgba(214,150,90,.42)" g2="rgba(79,141,255,.2)">
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative h-[440px] w-[440px]">
          <div className="absolute inset-[92px] overflow-hidden rounded-full border border-white/15">
            <img src={scene(1, 520, 520)} alt="" className="m284-spin h-full w-full object-cover" />
          </div>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div className="relative">
              <p className="text-[13px] uppercase tracking-[0.22em] text-white/80">Estate blend</p>
              <p className="mt-1 text-[30px] leading-none" style={{ fontFamily: F.fr }}>
                ₹780
              </p>
            </div>
          </div>
          <div className="m284-ring absolute inset-0" aria-label={M284_TEXT}>
            {M284_TEXT.split("").map((c, i) => (
              <span
                key={i}
                className="absolute left-1/2 top-1/2 block w-[20px] -ml-[10px] -mt-[10px] text-center text-[18px] font-[600] leading-[20px] text-[#ffd8b0]"
                style={{ transform: `rotate(${(i * 360) / n}deg) translateY(-196px)`, fontFamily: F.sg }}
                aria-hidden
              >
                <span className="m284-c inline-block">{c === " " ? "\u00a0" : c}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="absolute bottom-5 left-6 text-[13px] uppercase tracking-[0.18em] text-white/60">Hillside roastery · 250 g</p>
    </Stage>
  );
}

/* ───────────────────────── M285 · Spring scale-in words (play, SplitText) ───────────────────────── */
function M285() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const h = el.querySelector<HTMLElement>(".m285-h")!;
    const split = SplitText.create(h, { type: "words" });
    onClean(() => split.revert());
    const words = split.words as HTMLElement[];
    const tl = gsap.timeline({ repeat: -1 });
    tl.fromTo(
      words,
      { scale: 0.6, opacity: 0, transformOrigin: "50% 70%" },
      { scale: 1, opacity: 1, duration: 0.8, ease: "back.out(2.2)", stagger: 0.08, immediateRender: false },
    );
    tl.to(words, { opacity: 0, scale: 0.92, duration: 0.3, ease: "power2.in", stagger: 0.025 }, "+=0.25");
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,120,150,.36)" g2="rgba(255,190,110,.24)">
      <div className="absolute inset-0 grid place-items-center px-[8%]">
        <div className="text-center">
          <h3 className="m285-h max-w-[14ch] text-[clamp(56px,6.6vw,108px)] font-[700] leading-[1.02] tracking-[-0.025em]" style={{ fontFamily: F.mr }}>
            Fresh drops every single Friday.
          </h3>
          <p className="mt-7 text-[13px] uppercase tracking-[0.22em] text-white/60">Berry crumble tart · ₹420</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M286 · Stagger from edges (play, SplitText) ───────────────────────── */
function M286() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const h = el.querySelector<HTMLElement>(".m286-h")!;
    const split = SplitText.create(h, { type: "chars" });
    onClean(() => split.revert());
    const chars = split.chars as HTMLElement[];
    const tl = gsap.timeline({ repeat: -1 });
    tl.fromTo(
      chars,
      { opacity: 0, yPercent: 45, filter: "blur(10px)" },
      { opacity: 1, yPercent: 0, filter: "blur(0px)", duration: 0.6, ease: "power3.out", stagger: { each: 0.09, from: "edges" }, immediateRender: false },
    );
    tl.to(chars, { opacity: 0, yPercent: -25, duration: 0.32, ease: "power2.in", stagger: { each: 0.015, from: "center" } }, "+=0.22");
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(90,170,255,.38)" g2="rgba(255,154,92,.22)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center">
          <h3 className="m286-h whitespace-nowrap text-[clamp(72px,9.4vw,150px)] leading-none tracking-[-0.02em]" style={{ fontFamily: F.fr }}>
            Monsoon Edit
          </h3>
          <p className="mt-7 text-[13px] uppercase tracking-[0.22em] text-white/60">Waxed rain shell · ₹7,800</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M287 · Text pressure, full width (play, gsap ticker + auto pointer) ───────────────────────── */
const M287_WORD = "PRESSED";
function M287() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const row = el.querySelector<HTMLElement>(".m287-row")!;
    const wraps = gsap.utils.toArray<HTMLElement>(".m287-w", el);
    const glyphs = gsap.utils.toArray<HTMLElement>(".m287-g", el);
    const dot = el.querySelector<HTMLElement>(".m287-dot")!;
    const read = pointerSource(el, onClean);
    // natural glyph widths at the resting weight, measured once (row switches to explicit widths below)
    glyphs.forEach((g) => (g.style.fontVariationSettings = '"wght" 400'));
    const nat = glyphs.map((g) => g.getBoundingClientRect().width || 1);
    row.style.justifyContent = "flex-start";
    const cur = glyphs.map(() => 0);
    const fake = { u: 0 };
    const sweep = gsap.to(fake, { u: 1, duration: 2.4, ease: "sine.inOut", repeat: -1, yoyo: true });
    onClean(() => {
      row.style.justifyContent = "";
      wraps.forEach((w) => (w.style.width = ""));
      glyphs.forEach((g) => {
        g.style.fontVariationSettings = "";
        g.style.transform = "";
      });
    });
    tickWhile(sweep, onClean, (dt) => {
      const rr = el.getBoundingClientRect();
      const wr = row.getBoundingClientRect();
      const W = wr.width;
      const p = read({ x: wr.left - rr.left + W * (0.04 + 0.92 * fake.u), y: wr.top - rr.top + wr.height * 0.5 });
      gsap.set(dot, { x: p.x, y: p.y, opacity: p.real ? 0 : 1 });
      const k = 1 - Math.exp(-dt * 9);
      // current centres from the previous frame's widths
      let acc = 0;
      const centres = wraps.map((w) => {
        const c = acc + w.offsetWidth / 2;
        acc += w.offsetWidth;
        return c;
      });
      const px = p.x - (wr.left - rr.left);
      const sx = glyphs.map((_, i) => {
        const d = Math.abs(px - centres[i]) / W;
        const t = Math.max(0, 1 - d / 0.3);
        cur[i] += (t * t * (3 - 2 * t) - cur[i]) * k;
        return 0.62 + 1.0 * cur[i];
      });
      const sum = sx.reduce((s, v, i) => s + v * nat[i], 0);
      const fit = W / sum; // keep the word exactly full width
      wraps.forEach((w, i) => {
        const t = cur[i];
        w.style.width = `${nat[i] * sx[i] * fit}px`;
        glyphs[i].style.fontVariationSettings = `"wght" ${Math.round(160 + 740 * t)}`;
        glyphs[i].style.transform = `scaleX(${(sx[i] * fit).toFixed(3)}) scaleY(${(1 + 0.08 * t).toFixed(3)}) skewX(${(-11 * t).toFixed(2)}deg)`;
        glyphs[i].style.color = t > 0.02 ? gsap.utils.interpolate("#eaf5ff", ACC, t) : "";
      });
    });
    return sweep;
  });
  return (
    <Stage r={root} g1="rgba(255,154,92,.42)" g2="rgba(120,140,255,.22)">
      <div className="absolute inset-0 flex flex-col justify-center px-[5%]">
        <div className="m287-row flex w-full justify-between text-[clamp(110px,13vw,210px)] leading-[0.9]" style={{ fontFamily: F.fr }}>
          {M287_WORD.split("").map((c, i) => (
            <span key={i} className="m287-w flex shrink-0 justify-center">
              <span className="m287-g inline-block origin-bottom" style={{ fontVariationSettings: '"wght" 500' }}>
                {c}
              </span>
            </span>
          ))}
        </div>
        <p className="mt-8 text-[13px] uppercase tracking-[0.22em] text-white/60">Cold-pressed olive oil · 500 ml · ₹1,150</p>
      </div>
      <span className="m287-dot pointer-events-none absolute left-0 top-0 -ml-[8px] -mt-[8px] h-[16px] w-[16px] rounded-full border-2 border-white bg-white/30 opacity-0" aria-hidden />
    </Stage>
  );
}

/* ───────────────────────── M288 · Text roll with blur (play, SplitText) ───────────────────────── */
const M288_WORDS = ["Morning", "Evening"];
function M288() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el, onClean) => {
    const layers = gsap.utils.toArray<HTMLElement>(".m288-l", el);
    const splits = layers.map((l) => SplitText.create(l, { type: "chars" }));
    onClean(() => splits.forEach((s) => s.revert()));
    const chars = splits.map((s) => s.chars as HTMLElement[]);
    gsap.set(layers, { autoAlpha: 1 });
    gsap.set(chars[1], { rotationX: 90, opacity: 0, filter: "blur(2px)", transformOrigin: "50% 100%" });
    const delays = chars.map((cs) => cs.map((_, i) => i * 0.055 + ((i * 37) % 5) * 0.02)); // each char its own delay
    const roll = (tl: gsap.core.Timeline, from: number, to: number, at: number) => {
      chars[from].forEach((c, i) => {
        tl.fromTo(c, { rotationX: 0, opacity: 1, filter: "blur(0px)", transformOrigin: "50% 0%" }, { rotationX: 90, opacity: 0, filter: "blur(2px)", duration: 0.45, ease: "power2.in", immediateRender: false }, at + delays[from][i]);
      });
      chars[to].forEach((c, i) => {
        tl.fromTo(
          c,
          { rotationX: 90, opacity: 0, filter: "blur(2px)", transformOrigin: "50% 100%" },
          { rotationX: 0, opacity: 1, filter: "blur(0px)", duration: 0.55, ease: "power2.out", immediateRender: false },
          at + 0.18 + delays[to][i],
        );
      });
    };
    const tl = gsap.timeline({ repeat: -1 });
    roll(tl, 0, 1, 0.15);
    roll(tl, 1, 0, 1.55);
    tl.to({}, { duration: 0.01 }, 2.95);
    return tl;
  });
  const cls = "m288-l whitespace-nowrap text-[clamp(84px,10.5vw,170px)] font-[700] leading-none tracking-[-0.03em] [perspective:600px]";
  return (
    <Stage r={root} g1="rgba(255,170,90,.4)" g2="rgba(110,120,255,.26)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center">
          <div className="relative" style={{ fontFamily: F.sg }}>
            <h3 className={cls}>{M288_WORDS[0]}</h3>
            <h3 className={`absolute inset-0 text-[#ff9a5c] ${cls}`} style={{ visibility: "hidden" }} aria-hidden>
              {M288_WORDS[1]}
            </h3>
          </div>
          <p className="mt-7 text-[13px] uppercase tracking-[0.22em] text-white/60">Day & night face serum · 30 ml · ₹2,150</p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M289 · Text shadow pop, 3D extrude (play) ───────────────────────── */
const M289_DEPTH = 14;
const extrude = (d: number) => {
  const s: string[] = [];
  const n = Math.max(0, d);
  for (let i = 1; i <= Math.ceil(n); i++) {
    const o = Math.min(i, n);
    s.push(`${o.toFixed(2)}px ${o.toFixed(2)}px 0 ${i === Math.ceil(n) ? "#5a1f08" : "#c2511c"}`);
  }
  return s.length ? s.join(",") : "none";
};
function M289() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const h = el.querySelector<HTMLElement>(".m289-h")!;
    const p = { d: 0 };
    const apply = () => {
      h.style.textShadow = extrude(p.d);
      gsap.set(h, { x: -p.d, y: -p.d });
    };
    apply();
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.05 });
    tl.to(p, { d: M289_DEPTH, duration: 0.85, ease: "power2.out", onUpdate: apply });
    tl.to(p, { d: 0, duration: 0.7, ease: "power2.inOut", onUpdate: apply }, "+=0.2");
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,140,70,.42)" g2="rgba(79,141,255,.2)">
      <div className="absolute inset-0 grid place-items-center px-[6%]">
        <div className="text-center">
          <h3
            className="m289-h whitespace-nowrap text-[clamp(110px,13vw,200px)] font-[800] uppercase leading-none tracking-[-0.01em] text-[#ffe3c4]"
            style={{ fontFamily: F.sy, textShadow: extrude(M289_DEPTH), transform: `translate(-${M289_DEPTH}px,-${M289_DEPTH}px)` }}
          >
            Crate
          </h3>
          <p className="mt-9 text-[13px] uppercase tracking-[0.22em] text-white/60">Stacking crate · birch ply · ₹2,600</p>
        </div>
      </div>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M278", name: "Pinned words recede to z -1000", how: "Pinned paragraph: words tip on X by distance from centre and sink to z -1000 (back.in), outer words first · scrubbed", kind: "scrub", C: M278 },
  { code: "M279", name: "Proximity char scale", how: "Letters swell as the pointer nears and relax as it leaves, a bulge that follows it along the word · auto pointer sweep", kind: "play", C: M279 },
  { code: "M280", name: "Rotating word cylinder", how: "Eight words sit on a 3D drum (rotateX per face); the drum turns one word at a time · CSS loop", kind: "play", C: M280 },
  { code: "M281", name: "Scale-down settle", how: "Kicker, headline and price enter at scale 1.06, settle to size as they fade in · cycles three lines", kind: "play", C: M281 },
  { code: "M282", name: "Sliced halves hover", how: "Hover splits the word into top and bottom halves that slide apart sideways, then rejoin · auto pointer", kind: "play", C: M282 },
  { code: "M283", name: "Slot cell text roll", how: "Each changed character rolls in its own clipped cell (old up, new from below, springy), left to right · cycles", kind: "play", C: M283 },
  { code: "M284", name: "Spinning text with per-char blur-in", how: "A circular text ring springs one full turn while its letters sharpen from blur(4px), 0.03 s apart · repeats", kind: "play", C: M284 },
  { code: "M285", name: "Spring scale-in words", how: "Words pop from scale 0.6 with a soft spring overshoot and settle, staggered · loops", kind: "play", C: M285 },
  { code: "M286", name: "Stagger from edges", how: "Characters rise out of blur from both outer edges inward and meet in the middle of the word · loops", kind: "play", C: M286 },
  { code: "M287", name: "Text pressure (full-width)", how: "A full-width word: letters near the pointer widen, gain weight and lean italic while the rest squeeze · auto pointer sweep", kind: "play", C: M287 },
  { code: "M288", name: "Text roll with blur", how: "Old letters roll up to rotateX 90 and blur, new ones roll in from 90 and sharpen, each on its own delay · A ↔ B", kind: "play", C: M288 },
  { code: "M289", name: "Text shadow pop (3D extrude)", how: "Hard stacked shadows grow to the bottom-right while the word shifts up-left, extruding it into a 3D block · loops", kind: "play", C: M289 },
];
