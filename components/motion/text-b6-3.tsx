"use client";

// MOTION-MENU M258–M265 (text group, batch 6 · group 3): small focused demos for /lab/motion.
// Every demo starts when on screen, loops, pauses off screen and has a CSS-only glow loop that never stops.
// Hover demos also play by themselves (a fake pointer dot). ?static=1 / reduced motion: no JS motion, the markup shows the final state.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, SplitText, prefersReducedMotion } from "@/lib/gsap";
import type { MotionDef } from "./types";

const GROTESK = "'Space Grotesk Variable', system-ui, sans-serif";
const SERIF = "'Fraunces Variable', Georgia, serif";
const EDITORIAL = "'Instrument Serif', Georgia, serif";
const WIDE = "'Syne Variable', 'Space Grotesk Variable', system-ui, sans-serif";
const BODY = "'Manrope Variable', system-ui, sans-serif";

const CSS = `
.b6t3-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.5)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.22)),transparent 70%);animation:b6t3-drift 5.2s linear infinite alternate;will-change:transform}
@keyframes b6t3-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b6t3-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4);pointer-events:none;z-index:40}
.m258-copy{-webkit-text-stroke:1.5px rgba(255,214,170,.75);color:transparent}
.m263-fb{background:linear-gradient(100deg,#ff5f8f,#ffc35a 30%,#5be3c4 60%,#6f8bff 85%);-webkit-background-clip:text;background-clip:text;color:transparent}
.m263-on .m263-fb{opacity:0}
.m265-tab.on{color:#fff6ec}
.m265-tab.on .m265-dotc{background:#ff8a5c}
html.is-static .b6t3-glow{animation:none}
html.is-static {.b6t3-glow{animation:none}}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", bg = "#0a0d16", g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; bg?: string; g1?: string; g2?: string }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 text-[#eef2ff] ${className}`} style={{ background: bg }}>
      <style href="b6t3-css" precedence="default">
        {CSS}
      </style>
      <div className="b6t3-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/** Play: a looping timeline that starts when the demo is on screen and pauses off screen. Returns the live timeline ref. */
function usePlay(root: RefObject<HTMLDivElement | null>, build: (el: HTMLDivElement) => gsap.core.Timeline) {
  const fn = useRef(build);
  fn.current = build;
  const live = useRef<gsap.core.Timeline | null>(null);
  const onScreen = useRef(false);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    let dead = false;
    const ctx = gsap.context(() => {}, el);
    const io = new IntersectionObserver(
      ([e]) => {
        onScreen.current = e.isIntersecting;
        if (e.isIntersecting) live.current?.play();
        else live.current?.pause();
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    Promise.resolve(document.fonts?.ready).then(() => {
      if (dead) return;
      ctx.add(() => {
        const tl = fn.current(el);
        live.current = tl;
        if (onScreen.current) tl.play();
        else tl.pause();
      });
    });
    return () => {
      dead = true;
      live.current = null;
      io.disconnect();
      ctx.revert();
    };
  }, [root]);
  return { live, onScreen };
}

/* ---------- M258 · Repeated text fragments (a big word fans out into a column of stacked copies, staggered by index, then collapses) ---------- */
const M258_N = 4; // copies above and below
function M258() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const copies = Array.from(el.querySelectorAll<HTMLElement>(".m258-copy"));
    const step = (el.querySelector<HTMLElement>(".m258-main")?.offsetHeight ?? 120) * 0.5;
    const off = (c: HTMLElement) => Number(c.dataset.k) * step;
    const delay = (c: HTMLElement) => (Math.abs(Number(c.dataset.k)) - 1) * 0.07;
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.12 });
    copies.forEach((c) => {
      tl.fromTo(c, { y: 0, opacity: 0 }, { y: off(c), opacity: 1 - (Math.abs(Number(c.dataset.k)) - 1) * 0.2, duration: 0.85, ease: "power3.inOut" }, delay(c));
      tl.to(c, { y: 0, opacity: 0, duration: 0.75, ease: "power3.inOut" }, 1.35 + (M258_N - Math.abs(Number(c.dataset.k))) * 0.07);
    });
    tl.fromTo(".m258-main", { scale: 1 }, { scale: 0.94, duration: 0.85, ease: "power3.inOut", yoyo: true, repeat: 1, repeatDelay: 0.25 }, 0);
    return tl;
  });
  const ks = [...Array.from({ length: M258_N }, (_, i) => -(M258_N - i)), ...Array.from({ length: M258_N }, (_, i) => i + 1)];
  return (
    <Stage r={root} bg="#120b08" g1="rgba(255,140,80,.5)" g2="rgba(255,214,170,.2)">
      <p className="absolute left-[6%] top-[8%] text-[13px] uppercase tracking-[0.24em] text-[#ffd6aa]/60" style={{ fontFamily: BODY }}>
        Live sessions · season two
      </p>
      <p className="absolute bottom-[8%] right-[6%] text-right text-[15px] leading-relaxed text-[#ffe9d6]/70" style={{ fontFamily: BODY }}>
        Eight nights · rooftop stage
        <br />
        Passes from ₹ 1,499
      </p>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {ks.map((k) => (
            <span
              key={k}
              data-k={k}
              aria-hidden
              className="m258-copy absolute inset-0 select-none text-center text-[clamp(80px,9vw,140px)] font-[800] uppercase leading-none tracking-[-0.02em] will-change-transform"
              style={{ fontFamily: WIDE, opacity: 0 }}
            >
              Encore
            </span>
          ))}
          <h3 className="m258-main relative text-center text-[clamp(80px,9vw,140px)] font-[800] uppercase leading-none tracking-[-0.02em] text-[#fff1e2]" style={{ fontFamily: WIDE }}>
            Encore
          </h3>
        </div>
      </div>
    </Stage>
  );
}

/* ---------- M259 · Swap text on hover (two labels in a clipped box: the first slides up out, the second slides up in) ---------- */
const M259_LINKS = [
  ["Shop the drop", "36 new pieces"],
  ["Lookbook", "Shot in Goa"],
  ["Visit the studio", "Open till 9 pm"],
];
function M259() {
  const root = useRef<HTMLDivElement>(null);
  const swap = (box: Element | null, on: boolean) => {
    if (!box || prefersReducedMotion()) return;
    gsap.to(box.querySelectorAll(".m259-l"), { yPercent: on ? -100 : 0, duration: 0.7, ease: "power3.inOut", overwrite: "auto" });
  };
  const { live, onScreen } = usePlay(root, (el) => {
    const dot = el.querySelector(".b6t3-dot");
    const sr = el.getBoundingClientRect();
    const boxes = Array.from(el.querySelectorAll<HTMLElement>(".m259-box"));
    const at = (b: HTMLElement) => {
      const r = b.getBoundingClientRect();
      return { x: r.left - sr.left + r.width * 0.3, y: r.top - sr.top + r.height * 0.55 };
    };
    const tl = gsap.timeline({ repeat: -1 });
    tl.set(dot, { x: sr.width * 0.82, y: sr.height * 0.9, opacity: 1 });
    boxes.forEach((b, i) => {
      const p = at(b);
      const labels = b.querySelectorAll(".m259-l");
      tl.to(dot, { x: p.x, y: p.y, duration: 0.45, ease: "power2.inOut" })
        .to(labels, { yPercent: -100, duration: 0.7, ease: "power3.inOut" }, "<0.3");
      if (i > 0) tl.to(boxes[i - 1].querySelectorAll(".m259-l"), { yPercent: 0, duration: 0.7, ease: "power3.inOut" }, "<");
    });
    tl.to(dot, { x: sr.width * 0.82, y: sr.height * 0.9, duration: 0.5, ease: "power2.inOut" }).to(
      boxes[boxes.length - 1].querySelectorAll(".m259-l"),
      { yPercent: 0, duration: 0.7, ease: "power3.inOut" },
      "<0.1",
    );
    return tl;
  });
  // the real pointer takes over: the auto walk pauses while the mouse is on the stage
  const enter = () => {
    live.current?.pause();
    gsap.to(root.current?.querySelectorAll(".m259-l") ?? [], { yPercent: 0, duration: 0.4, overwrite: "auto" });
    gsap.set(root.current?.querySelector(".b6t3-dot") ?? [], { opacity: 0 });
  };
  const leave = () => {
    if (!live.current) return;
    gsap.set(root.current?.querySelector(".b6t3-dot") ?? [], { opacity: 1 });
    if (onScreen.current) live.current.restart();
  };
  return (
    <Stage r={root} bg="#0d0b12" g1="rgba(178,140,255,.55)" g2="rgba(255,150,200,.2)">
      <div className="absolute inset-0" onPointerEnter={enter} onPointerLeave={leave}>
        <p className="absolute left-[7%] top-[10%] text-[13px] uppercase tracking-[0.24em] text-[#d9ccff]/60" style={{ fontFamily: BODY }}>
          Menu · Atelier Noor
        </p>
        <nav className="absolute left-[7%] top-1/2 flex -translate-y-1/2 flex-col gap-3">
          {M259_LINKS.map(([a, b]) => (
            <a
              key={a}
              href="#"
              onClick={(e) => e.preventDefault()}
              onMouseEnter={(e) => swap(e.currentTarget.querySelector(".m259-box"), true)}
              onMouseLeave={(e) => swap(e.currentTarget.querySelector(".m259-box"), false)}
              className="block text-[clamp(52px,6vw,96px)] leading-[1.05] tracking-[-0.03em]"
              style={{ fontFamily: GROTESK, fontWeight: 600 }}
            >
              <span className="m259-box relative inline-block overflow-hidden align-top">
                <span className="m259-l block text-[#f3eeff] will-change-transform">{a}</span>
                <span className="m259-l absolute left-0 top-full block whitespace-nowrap text-[#b28cff] will-change-transform" style={{ fontFamily: EDITORIAL, fontWeight: 400, fontStyle: "italic" }}>
                  {b}
                </span>
              </span>
            </a>
          ))}
        </nav>
        <span className="b6t3-dot" style={{ opacity: 0 }} aria-hidden />
      </div>
    </Stage>
  );
}

/* ---------- M260 · Blend-mode highlight block (variant of M117: a block sweeps across the phrase with mix-blend difference, inverting the text) ---------- */
const M260_LINES = ["Loud colour.", "Quiet cut.", "No compromise."];
function M260() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const blocks = el.querySelectorAll(".m260-b");
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.1 });
    tl.set(blocks, { scaleX: 0, transformOrigin: "0% 50%" })
      .to(blocks, { scaleX: 1, duration: 0.42, ease: "power3.inOut", stagger: 0.24 })
      .set(blocks, { transformOrigin: "100% 50%" }, "+=0.12")
      .to(blocks, { scaleX: 0, duration: 0.42, ease: "power3.inOut", stagger: 0.24 });
    return tl;
  });
  return (
    <Stage r={root} bg="#0c0c0e" g1="rgba(255,90,70,.5)" g2="rgba(255,220,120,.22)">
      <p className="absolute left-[7%] top-[9%] text-[13px] uppercase tracking-[0.24em] text-white/55" style={{ fontFamily: BODY }}>
        Capsule 03 · ₹ 2,990 onwards
      </p>
      <div className="absolute left-[7%] top-1/2 -translate-y-1/2" style={{ isolation: "isolate" }}>
        {M260_LINES.map((l) => (
          <div key={l} className="relative w-fit text-[clamp(56px,6.6vw,104px)] font-[700] leading-[1.02] tracking-[-0.035em] text-[#f6f1e8]" style={{ fontFamily: GROTESK }}>
            {l}
            <span className="m260-b absolute -inset-x-[0.12em] inset-y-[0.06em] bg-white will-change-transform" style={{ mixBlendMode: "difference", transform: "scaleX(0)" }} aria-hidden />
          </div>
        ))}
      </div>
    </Stage>
  );
}

/* ---------- M261 · Brush-stroke highlight (variant of M117: a hand-drawn brush stroke draws behind the key words with DrawSVG) ---------- */
function M261Mark({ children }: { children: ReactNode }) {
  return (
    <span className="relative inline-block" style={{ isolation: "isolate" }}>
      <svg className="pointer-events-none absolute -left-[4%] top-[18%] -z-10 h-[78%] w-[108%]" viewBox="0 0 300 60" preserveAspectRatio="none" aria-hidden>
        <path className="m261-s" d="M8 34 C 60 22, 120 40, 180 28 S 270 26, 292 32" fill="none" stroke="#e2552f" strokeWidth="38" strokeLinecap="round" />
        <path className="m261-s2" d="M14 44 C 80 36, 150 50, 210 40 S 280 42, 288 44" fill="none" stroke="#ff8a5c" strokeOpacity=".55" strokeWidth="10" strokeLinecap="round" />
      </svg>
      {children}
    </span>
  );
}
function M261() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const marks = Array.from(el.querySelectorAll(".m261-s"));
    const thin = Array.from(el.querySelectorAll(".m261-s2"));
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.1 });
    tl.set([...marks, ...thin], { drawSVG: "0%" });
    marks.forEach((m, i) => {
      tl.to(m, { drawSVG: "100%", duration: 0.6, ease: "power2.out" }, 0.1 + i * 0.45).to(thin[i], { drawSVG: "100%", duration: 0.45, ease: "power2.out" }, "<0.2");
    });
    tl.to([...marks, ...thin], { drawSVG: "100% 100%", duration: 0.45, ease: "power2.in", stagger: 0.08 }, "+=0.28");
    return tl;
  });
  return (
    <Stage r={root} bg="#100c09" g1="rgba(226,85,47,.5)" g2="rgba(255,200,140,.2)">
      <p className="absolute left-[8%] top-[11%] text-[13px] uppercase tracking-[0.24em] text-[#ffd8bf]/60" style={{ fontFamily: BODY }}>
        Single-origin · Chikmagalur estate
      </p>
      <h3 className="absolute left-[8%] top-1/2 max-w-[16ch] -translate-y-1/2 text-[clamp(56px,6.4vw,100px)] leading-[1.02] tracking-[-0.02em] text-[#fff3e8]" style={{ fontFamily: SERIF, fontWeight: 500 }}>
        Beans <M261Mark>slow-roasted,</M261Mark> coffee <M261Mark>never rushed.</M261Mark>
      </h3>
      <p className="absolute bottom-[9%] left-[8%] text-[16px] text-[#ffd8bf]/75" style={{ fontFamily: GROTESK }}>
        250 g pouch · ₹ 690
      </p>
    </Stage>
  );
}

/* ---------- M262 · Centre-out weight animation (variant of M306: variable font weight thin ↔ bold, staggered from the centre letter outward) ---------- */
function M262() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const h = el.querySelector<HTMLElement>(".m262-h")!;
    const split = SplitText.create(h, { type: "chars" });
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.08 });
    tl.set(split.chars, { fontWeight: 100, y: 16 })
      .to(split.chars, { fontWeight: 900, y: 0, duration: 0.7, ease: "power2.inOut", stagger: { each: 0.06, from: "center" } })
      .to(split.chars, { fontWeight: 100, y: -10, duration: 0.7, ease: "power2.inOut", stagger: { each: 0.06, from: "edges" } }, "+=0.15")
      .to(split.chars, { y: 16, duration: 0.2, ease: "power1.inOut" });
    return tl;
  });
  return (
    <Stage r={root} bg="#0b0e12" g1="rgba(120,220,190,.48)" g2="rgba(255,236,170,.2)">
      <p className="absolute left-0 right-0 top-[14%] text-center text-[13px] uppercase tracking-[0.26em] text-[#c9f3e6]/60" style={{ fontFamily: BODY }}>
        Merino crew · 180 gsm
      </p>
      <div className="absolute inset-0 flex items-center justify-center">
        <h3 className="m262-h text-center text-[clamp(72px,8.4vw,132px)] leading-none tracking-[-0.02em] text-[#eefcf6]" style={{ fontFamily: SERIF, fontWeight: 800 }}>
          Featherlight
        </h3>
      </div>
      <p className="absolute bottom-[12%] left-0 right-0 text-center text-[18px] text-[#c9f3e6]/80" style={{ fontFamily: GROTESK }}>
        Warm as wool, light as air · ₹ 3,450
      </p>
    </Stage>
  );
}

/* ---------- M263 · Coloured lines clipped to text (variant of M121: canvas sine curves drift and wave, visible only inside the letters) ---------- */
const M263_WORD = "AURORA";
const M263_COLS = ["#ff5f8f", "#ffc35a", "#5be3c4", "#6f8bff", "#c38bff", "#ff8a5c"];
function M263() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = root.current;
    const c = cv.current;
    if (!el || !c || prefersReducedMotion()) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    let on = false;
    let dead = false;
    let ready = false;
    let W = 0;
    let H = 0;
    let fs = 100;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      W = c.clientWidth;
      H = c.clientHeight;
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // fit the word to ~78% of the frame width
      ctx.font = `800 100px 'Syne Variable', sans-serif`;
      const w100 = ctx.measureText(M263_WORD).width || 600;
      fs = Math.min((W * 0.78 * 100) / w100, H * 0.55);
    };
    const draw = (t: number) => {
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, W, H);
      // 1 · colourful sine lines that drift and wave
      const n = 22;
      const top = H / 2 - fs * 0.5;
      const span = fs * 1.05;
      ctx.lineCap = "round";
      for (let i = 0; i < n; i++) {
        ctx.beginPath();
        ctx.strokeStyle = M263_COLS[i % M263_COLS.length];
        ctx.lineWidth = fs * 0.05;
        const base = top + (i / (n - 1)) * span;
        const amp = fs * (0.08 + 0.05 * Math.sin(i * 1.3 + t * 0.6));
        for (let x = -20; x <= W + 20; x += 10) {
          const y = base + Math.sin(x * 0.006 + t * 1.4 + i * 0.55) * amp + Math.sin(x * 0.013 - t * 0.9 + i) * amp * 0.35;
          if (x === -20) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      // 2 · keep the lines only inside the letters
      ctx.globalCompositeOperation = "destination-in";
      ctx.font = `800 ${fs}px 'Syne Variable', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff";
      ctx.fillText(M263_WORD, W / 2, H / 2);
      // 3 · a light base layer under the lines so the letterforms always read on the dark stage
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = "rgba(255,255,255,.16)";
      ctx.fillText(M263_WORD, W / 2, H / 2);
    };
    const tick = (time: number) => {
      if (on && ready) draw(time);
    };
    const io = new IntersectionObserver(([e]) => (on = e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    const ro = new ResizeObserver(() => ready && resize());
    ro.observe(c);
    Promise.resolve(document.fonts?.ready).then(() => {
      if (dead) return;
      resize();
      ready = true;
      el.classList.add("m263-on");
    });
    gsap.ticker.add(tick);
    return () => {
      dead = true;
      gsap.ticker.remove(tick);
      io.disconnect();
      ro.disconnect();
      el.classList.remove("m263-on");
    };
  }, []);
  return (
    <Stage r={root} bg="#07080f" g1="rgba(120,110,255,.5)" g2="rgba(255,95,143,.22)">
      <p className="absolute left-[6%] top-[9%] text-[13px] uppercase tracking-[0.24em] text-white/55" style={{ fontFamily: BODY }}>
        Night-sky festival · Spiti
      </p>
      {/* static fallback (no JS / reduced motion): the same word with a still gradient fill */}
      <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
        <span className="m263-fb text-[clamp(72px,9vw,140px)] leading-none" style={{ fontFamily: WIDE, fontWeight: 800 }}>
          {M263_WORD}
        </span>
      </div>
      <canvas ref={cv} className="absolute inset-0 h-full w-full" aria-label={M263_WORD} />
      <p className="absolute bottom-[9%] right-[6%] text-right text-[16px] text-white/70" style={{ fontFamily: GROTESK }}>
        3 nights under the lights · ₹ 8,900
      </p>
    </Stage>
  );
}

/* ---------- M264 · Echo-trail on pointer (variant of M105: ghost copies trail the heading as the pointer moves, each lagging more, then settle) ---------- */
const M264_N = 6;
const M264_COLS = ["#ff9fd0", "#ff7aa8", "#e86bff", "#a36bff", "#6b7dff", "#4fb2ff"];
function M264() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    let on = false;
    let dead = false;
    let walk: gsap.core.Timeline | null = null;
    let idle: gsap.core.Tween | null = null;
    const ptr = { x: 0, y: 0 };
    let user = false;
    const ctx = gsap.context(() => {}, el);
    const word = el.querySelector<HTMLElement>(".m264-word")!;
    const dot = el.querySelector<HTMLElement>(".b6t3-dot")!;
    const layers = [word, ...Array.from(el.querySelectorAll<HTMLElement>(".m264-ghost")).sort((a, b) => Number(a.dataset.i) - Number(b.dataset.i))];
    let qx: ((v: number) => void)[] = [];
    let qy: ((v: number) => void)[] = [];
    const tick = () => {
      if (!on || !qx.length) return;
      const r = el.getBoundingClientRect();
      const dx = gsap.utils.clamp(-220, 220, (ptr.x - r.width / 2) * 0.32);
      const dy = gsap.utils.clamp(-120, 120, (ptr.y - r.height / 2) * 0.32);
      layers.forEach((_, i) => {
        qx[i](dx);
        qy[i](dy);
      });
      if (!user) gsap.set(dot, { x: ptr.x, y: ptr.y });
    };
    const io = new IntersectionObserver(
      ([e]) => {
        on = e.isIntersecting;
        if (on && !user) walk?.play();
        else walk?.pause();
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      user = true;
      walk?.pause();
      gsap.set(dot, { opacity: 0 });
      ptr.x = e.clientX - r.left;
      ptr.y = e.clientY - r.top;
      idle?.kill();
      idle = gsap.delayedCall(1.5, () => {
        user = false;
        gsap.set(dot, { opacity: 1 });
        if (on) walk?.play();
      });
    };
    el.addEventListener("pointermove", move);
    Promise.resolve(document.fonts?.ready).then(() => {
      if (dead) return;
      ctx.add(() => {
        // each layer eases to the same target, the ghosts more slowly → a trail that settles under the word at rest
        qx = layers.map((l, i) => gsap.quickTo(l, "x", { duration: 0.18 + i * 0.13, ease: "power3.out" }));
        qy = layers.map((l, i) => gsap.quickTo(l, "y", { duration: 0.18 + i * 0.13, ease: "power3.out" }));
        const r = el.getBoundingClientRect();
        const W = r.width;
        const H = r.height;
        ptr.x = W / 2;
        ptr.y = H / 2;
        gsap.set(dot, { opacity: 1, x: ptr.x, y: ptr.y });
        // fake pointer: sweeps around the word with short rests (≤ 0.4 s) so the ghosts catch up and settle
        walk = gsap
          .timeline({ repeat: -1, defaults: { ease: "sine.inOut" } })
          .to(ptr, { x: W * 0.15, y: H * 0.3, duration: 0.7 })
          .to(ptr, { x: W * 0.85, y: H * 0.72, duration: 0.9 }, "+=0.3")
          .to(ptr, { x: W * 0.78, y: H * 0.22, duration: 0.6 }, "+=0.3")
          .to(ptr, { x: W * 0.2, y: H * 0.78, duration: 0.9 }, "+=0.2")
          .to(ptr, { x: W * 0.5, y: H * 0.5, duration: 0.6 }, "+=0.3");
        if (!on) walk.pause();
        gsap.ticker.add(tick);
      });
    });
    return () => {
      dead = true;
      gsap.ticker.remove(tick);
      el.removeEventListener("pointermove", move);
      idle?.kill();
      io.disconnect();
      ctx.revert();
    };
  }, []);
  return (
    <Stage r={root} bg="#0c0912" g1="rgba(232,107,255,.55)" g2="rgba(79,178,255,.22)">
      <p className="absolute left-[6%] top-[9%] text-[13px] uppercase tracking-[0.24em] text-[#f1d9ff]/60" style={{ fontFamily: BODY }}>
        Eau de parfum · 50 ml · ₹ 5,600
      </p>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {Array.from({ length: M264_N }, (_, i) => M264_N - 1 - i).map((i) => (
            <span
              key={i}
              data-i={i}
              aria-hidden
              className="m264-ghost absolute inset-0 select-none text-center text-[clamp(84px,10vw,156px)] italic leading-none will-change-transform"
              style={{ fontFamily: EDITORIAL, color: M264_COLS[i], opacity: 0.55 - i * 0.07 }}
            >
              Afterglow
            </span>
          ))}
          <h3 className="m264-word relative text-center text-[clamp(84px,10vw,156px)] italic leading-none text-[#fff4fb] will-change-transform" style={{ fontFamily: EDITORIAL }}>
            Afterglow
          </h3>
        </div>
      </div>
      <span className="b6t3-dot" style={{ opacity: 0 }} aria-hidden />
    </Stage>
  );
}

/* ---------- M265 · Externally driven word loop (variant of M144: the headline word follows the index of an auto-cycling product carousel) ---------- */
const M265_ITEMS = [
  { w: "mornings", n: "Dawn Flask", p: "₹ 1,890", c: "#ffb36b" },
  { w: "monsoons", n: "Rainshell Jacket", p: "₹ 6,400", c: "#5be3c4" },
  { w: "midnights", n: "Nightcap Lamp", p: "₹ 3,250", c: "#8f9bff" },
  { w: "mountains", n: "Ridge Pack", p: "₹ 5,100", c: "#ff7a6b" },
];
const M265_HOLD = 1.5;
const M265_MOVE = 0.6;
function M265Art({ c, k }: { c: string; k: number }) {
  return (
    <svg viewBox="0 0 200 200" className="h-[62%] w-auto" aria-hidden>
      <ellipse cx="100" cy="182" rx="62" ry="8" fill={c} opacity=".3" />
      {k === 0 && <rect x="72" y="30" width="56" height="146" rx="18" fill={c} />}
      {k === 1 && <path d="M60 40 L100 26 L140 40 L158 120 L142 176 H58 L42 120 Z" fill={c} />}
      {k === 2 && <path d="M54 92 Q100 20 146 92 Z M94 92 H106 V166 H94 Z M66 166 H134 V176 H66 Z" fill={c} />}
      {k === 3 && <rect x="58" y="38" width="84" height="138" rx="30" fill={c} />}
      <rect x="78" y="60" width="12" height="90" rx="6" fill="#fff" opacity=".35" />
    </svg>
  );
}
function M265() {
  const root = useRef<HTMLDivElement>(null);
  const { live } = usePlay(root, (el) => {
    const track = el.querySelector(".m265-track");
    const words = Array.from(el.querySelectorAll(".m265-w"));
    const tabs = Array.from(el.querySelectorAll(".m265-tab"));
    const bars = Array.from(el.querySelectorAll(".m265-bar"));
    const N = M265_ITEMS.length;
    gsap.set(words, { autoAlpha: 0, yPercent: 100 });
    gsap.set(words[0], { autoAlpha: 1, yPercent: 0 });
    gsap.set(bars, { scaleX: 0 });
    const tl = gsap.timeline({ repeat: -1 });
    for (let k = 0; k < N; k++) {
      const nx = (k + 1) % N;
      tl.addLabel(`k${k}`)
        .call(() => tabs.forEach((t, j) => t.classList.toggle("on", j === k)))
        // the driver: the active tab's timer bar fills; at the end the carousel AND the headline word move to the next index
        .fromTo(bars[k], { scaleX: 0 }, { scaleX: 1, duration: M265_HOLD, ease: "none" })
        .to(track, { xPercent: -100 * nx, duration: M265_MOVE, ease: "power3.inOut" })
        .to(words[k], { yPercent: -100, autoAlpha: 0, duration: M265_MOVE * 0.8, ease: "power3.in" }, "<")
        .fromTo(words[nx], { yPercent: 100, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: M265_MOVE, ease: "power3.out", immediateRender: false }, "<0.2")
        .set(bars[k], { scaleX: 0 }, "<");
    }
    return tl;
  });
  // a real tab click jumps the shared index: carousel + word follow it
  const go = (k: number) => {
    const tl = live.current;
    if (!tl) return;
    const el = root.current!;
    const words = el.querySelectorAll(".m265-w");
    gsap.set(words, { autoAlpha: 0, yPercent: 100 });
    gsap.set(words[k], { autoAlpha: 1, yPercent: 0 });
    gsap.set(el.querySelectorAll(".m265-bar"), { scaleX: 0 });
    gsap.set(el.querySelector(".m265-track"), { xPercent: -100 * k });
    tl.play(`k${k}`);
  };
  return (
    <Stage r={root} bg="#0d0b0a" g1="rgba(255,138,92,.5)" g2="rgba(91,227,196,.2)">
      <div className="absolute left-[6%] top-1/2 w-[44%] -translate-y-1/2">
        <p className="text-[13px] uppercase tracking-[0.24em] text-[#ffe0cc]/60" style={{ fontFamily: BODY }}>
          Field kit · autumn range
        </p>
        <h3 className="mt-3 text-[clamp(52px,5.6vw,88px)] leading-[0.98] tracking-[-0.02em] text-[#fff6ec]" style={{ fontFamily: SERIF, fontWeight: 500 }}>
          Made for
          <br />
          <span className="relative inline-grid overflow-hidden pb-[0.08em] align-top italic">
            {M265_ITEMS.map((it, k) => (
              <span key={it.w} className="m265-w col-start-1 row-start-1 will-change-transform" style={{ color: it.c, ...(k === 0 ? {} : { visibility: "hidden", opacity: 0 }) }}>
                {it.w}.
              </span>
            ))}
          </span>
        </h3>
        <div className="mt-8 grid grid-cols-4 gap-3">
          {M265_ITEMS.map((it, k) => (
            <button key={it.n} type="button" onClick={() => go(k)} className={`m265-tab text-left text-[13px] text-white/50 transition-colors ${k === 0 ? "on" : ""}`} style={{ fontFamily: GROTESK }}>
              <span className="relative block h-[3px] overflow-hidden rounded-full bg-white/15">
                <span className="m265-bar absolute inset-0 origin-left bg-[#ff8a5c]" style={{ transform: k === 0 ? "scaleX(1)" : "scaleX(0)" }} />
              </span>
              <span className="mt-2 flex items-center gap-2">
                <span className="m265-dotc h-2 w-2 rounded-full bg-white/25" />
                0{k + 1}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="absolute bottom-[9%] right-[5%] top-[9%] w-[40%] overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04]">
        <div className="m265-track flex h-full w-full will-change-transform">
          {M265_ITEMS.map((it, k) => (
            <div key={it.n} className="relative flex h-full w-full shrink-0 flex-col items-center justify-center">
              <div className="absolute inset-0" style={{ background: `radial-gradient(55% 50% at 50% 45%, ${it.c}33, transparent 70%)` }} />
              <M265Art c={it.c} k={k} />
              <div className="relative mt-4 text-center">
                <p className="text-[24px] font-[600] text-[#fff6ec]" style={{ fontFamily: GROTESK }}>
                  {it.n}
                </p>
                <p className="mt-1 text-[16px] text-white/65" style={{ fontFamily: GROTESK }}>
                  {it.p}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M258", name: "Repeated text fragments", how: "On view, stacked copies of a big word slide to staggered vertical offsets (delay by index), fanning into a column of fragments, then collapse back.", kind: "play", C: M258 },
  { code: "M259", name: "Swap text on hover", how: "Hover a link: its label slides up out of a clipped box and a second label slides up in (0.7 s); a fake pointer walks the menu by itself.", kind: "play", C: M259 },
  { code: "M260", name: "Blend-mode highlight block", how: "On view, a white block sweeps across each line (scaleX 0 → 1, then off) with mix-blend difference, so the text inverts where it passes.", kind: "play", C: M260 },
  { code: "M261", name: "Brush-stroke highlight", how: "On view, a hand-drawn brush stroke draws behind each key phrase with DrawSVG in ~0.6 s, like a quick marker swipe.", kind: "play", C: M261 },
  { code: "M262", name: "Centre-out weight animation", how: "On view, letters swell from thin to black weight (variable font) staggered from the centre letter outward, with a small rise.", kind: "play", C: M262 },
  { code: "M263", name: "Coloured lines clipped to text", how: "Colourful canvas sine lines drift and wave behind a heading that acts as their mask: they show only inside the letters.", kind: "play", C: M263 },
  { code: "M264", name: "Echo-trail on pointer", how: "As the pointer moves, ghost copies trail the heading, each lagging more, then settle back under the word at rest; a fake pointer drives it.", kind: "play", C: M264 },
  { code: "M265", name: "Externally driven word loop", how: "An auto-cycling product carousel drives the index: its timer bar fills, the card slides and the headline word swaps in sync.", kind: "play", C: M265 },
];
