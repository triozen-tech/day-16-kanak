"use client";

// Transitions (X6 · X7 · X9 · X10), loaders/intros (I6 pixel transition · M63 rapid layers), 2D image effect (M43),
// backgrounds (M60 · M61), text (M57 · M58 · M59), button (M64) and cursor (M65). Rebuilt from MIT sources where noted
// (docs/SOURCES.md). Every one plays by itself or with the scroll; ?static=1 shows the final state.
import { useEffect, useRef } from "react";
import { gsap, isRecording, prefersReducedMotion, ScrollTrigger, SplitText } from "@/lib/gsap";
import { pos, scene, useScrub, useTicker } from "./shared";

const Img = ({ i, className = "", label = "" }: { i: number; className?: string; label?: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={scene(i, 1200, 800, label)} alt="" className={`h-full w-full object-cover ${className}`} draggable={false} />
);

/** Two stacked panels (A under, B on top) with B revealed by `mask(p)` → a CSS clip-path (transitions X6 / X7 / X10). */
function Reveal({ clip, a = 0, b = 1, labelA = "A", labelB = "B", extra }: { clip: (p: number) => string; a?: number; b?: number; labelA?: string; labelB?: string; extra?: (p: number, el: HTMLDivElement) => void }) {
  const root = useRef<HTMLDivElement>(null);
  const top = useRef<HTMLDivElement>(null);
  useScrub(root, (p) => {
    const e = p; // the whole scrub, linear (record mode's curve already eases): never a flat, frozen stretch
    top.current!.style.clipPath = clip(e);
    // both scenes keep moving across the whole scrub: A slowly zooms in, B settles from 1.15 → 1
    const a = root.current!.querySelector<HTMLElement>(".xa");
    const b = top.current!.firstElementChild as HTMLElement | null;
    if (a) a.style.transform = `scale(${(1 + e * 0.15).toFixed(4)})`;
    if (b) b.style.transform = `scale(${(1.25 - e * 0.25).toFixed(4)})`;
    extra?.(e, root.current!);
  });
  return (
    <div ref={root} className="relative h-full w-full overflow-hidden rounded-[18px]">
      <div className="fx-drift absolute inset-0">
        <div className="xa absolute inset-0">
          <Img i={a} label={labelA} />
        </div>
        <div ref={top} className="absolute inset-0" style={{ clipPath: clip(1) }}>
          <Img i={b} label={labelB} />
        </div>
      </div>
    </div>
  );
}

/** X6 · Circle iris: the next scene opens through a circle from the centre (a lens aperture) with the scroll. */
// the circle reaches the corners (≈ 71%) exactly at the end: no "already open" stretch
export const IrisTransition = () => <Reveal clip={(p) => `circle(${(p * 71).toFixed(2)}% at 50% 50%)`} labelA="SCENE A" labelB="SCENE B" />;

/** X7 · Diagonal wipe: a hard diagonal edge sweeps across, leaving the next scene behind it. */
export const DiagonalWipe = () => (
  <Reveal
    a={2}
    b={3}
    labelA="SCENE A"
    labelB="SCENE B"
    // B is uncovered behind a slanted edge that sweeps left → right (top leads the bottom by 30%)
    clip={(p) => {
      const top = -10 + p * 140;
      return `polygon(0 0, ${top.toFixed(2)}% 0, ${(top - 30).toFixed(2)}% 100%, 0 100%)`;
    }}
  />
);

/** X10 · Zoom into a window: a small window in scene A grows (with A scaling past the camera) until B fills the screen. */
export const PortalZoom = () => (
  <Reveal
    a={0}
    b={1}
    labelA="SCENE A"
    labelB="SCENE B"
    clip={(p) => `inset(${(38 - p * 38).toFixed(2)}% ${(40 - p * 40).toFixed(2)}% round ${(24 - p * 24).toFixed(1)}px)`}
    extra={(p, el) => {
      const a = el.querySelector<HTMLElement>(".xa");
      if (a) a.style.transform = `scale(${1 + p * 1.6})`;
    }}
  />
);

/** X9 · RGB glitch cut: crossing the middle, the frame tears into sliced RGB copies for ~0.4 s and cuts to scene B. */
export function GlitchCut() {
  const root = useRef<HTMLDivElement>(null);
  const side = useRef(0);
  const burst = useRef(0);
  useScrub(root, (p) => {
    // a slow scrubbed zoom-out across the whole pass keeps both scenes moving; the cut lands at the middle
    root.current!.style.setProperty("--gz", (1.14 - p * 0.14).toFixed(4));
    const s = p > 0.5 ? 1 : 0;
    if (s !== side.current) {
      side.current = s;
      burst.current = 0.45;
      root.current!.dataset.scene = String(s);
    }
  });
  useTicker(root, (t, dt) => {
    burst.current = Math.max(0, burst.current - dt);
    const k = burst.current / 0.45;
    const el = root.current!;
    // a faint scanline drift always runs; the burst adds the tear
    el.style.setProperty("--gk", k.toFixed(3));
    el.style.setProperty("--gx", `${((Math.random() - 0.5) * 40 * k).toFixed(1)}px`);
    el.style.setProperty("--gy", `${(((t * 37) % 100) - 50).toFixed(1)}%`);
  });
  return (
    <div ref={root} className="fx-glitch relative h-full w-full overflow-hidden rounded-[18px]" data-scene="0">
      <div className="fx-drift absolute inset-0">
      {[0, 1].map((s) => (
        <div key={s} className="fx-glitch-scene absolute inset-0" data-s={s} style={{ transform: "scale(var(--gz, 1))" }}>
          <Img i={s ? 1 : 2} label={s ? "SCENE B" : "SCENE A"} />
          <div className="fx-glitch-r absolute inset-0">
            <Img i={s ? 1 : 2} />
          </div>
          <div className="fx-glitch-b absolute inset-0">
            <Img i={s ? 1 : 2} />
          </div>
        </div>
      ))}
      </div>
      <div className="fx-scan pointer-events-none absolute inset-x-0 h-[18%]" />
    </div>
  );
}

/** M43 · Pixelated → sharp (Codrops ImagePixelLoading, MIT): the picture resolves from big pixels to sharp as it
 *  scrolls in (canvas 2D, no WebGL). */
export function Pixelate({ i = 0 }: { i?: number }) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const img = useRef<HTMLImageElement | null>(null);
  const last = useRef(-1);
  const draw = (p: number) => {
    const c = canvas.current;
    const im = img.current;
    if (!c || !im) return;
    // continuous (not stepped): every scroll frame redraws a slightly different pixel size, plus a slow zoom
    const q = gsap.utils.clamp(0, 1, p);
    const f = 0.008 + (1 - 0.008) * Math.pow(q, 2.2);
    if (Math.abs(f - last.current) < 0.0004) return;
    last.current = f;
    const ctx = c.getContext("2d")!;
    const w = Math.max(1, Math.round(c.width * f));
    const h = Math.max(1, Math.round(c.height * f));
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, c.width, c.height);
    const z = 1.12 - q * 0.12;
    const zw = w * z;
    const zh = h * z;
    ctx.drawImage(im, (w - zw) / 2, (h - zh) / 2, zw, zh);
    ctx.drawImage(c, 0, 0, w, h, 0, 0, c.width, c.height);
  };
  const prog = useScrub(root, (p) => draw(p));
  useEffect(() => {
    const c = canvas.current!;
    const r = c.getBoundingClientRect();
    c.width = Math.round(r.width);
    c.height = Math.round(r.height);
    const im = new Image();
    im.src = scene(i, 1200, 800, "PIXELS");
    im.decode().then(() => {
      img.current = im;
      last.current = -1;
      draw(prefersReducedMotion() ? 1 : prog.current);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);
  return (
    <div ref={root} className="relative h-full w-full overflow-hidden rounded-[18px]">
      <canvas ref={canvas} className="fx-drift h-full w-full" />
    </div>
  );
}

/** I6 · Pixel transition loader (Codrops PixelTransition, MIT): a grid of cells covers the screen in a random wave, the
 *  page swaps underneath, then the cells clear from the centre. Demo replays on a loop. */
export function PixelLoader({ loop = true }: { loop?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const cells = root.current!.querySelectorAll(".pl-cell");
    const word = root.current!.querySelector(".pl-word");
    const tl = gsap
      .timeline({ repeat: loop ? -1 : 0, repeatDelay: 0.4 })
      .set(cells, { opacity: 0 })
      .to(cells, { opacity: 1, duration: 0.01, stagger: { amount: 0.6, from: "random", grid: [8, 12] } })
      .set(word, { opacity: 1 })
      .fromTo(word, { scale: 0.9 }, { scale: 1, duration: 0.8, ease: "power3.out" })
      .to(cells, { opacity: 0, duration: 0.01, stagger: { amount: 0.6, from: "center", grid: [8, 12] } }, "+=0.3")
      .set(word, { opacity: 0 });
    return () => {
      tl.kill();
    };
  }, [loop]);
  return (
    <div ref={root} className="relative h-full w-full overflow-hidden rounded-[18px]">
      <Img i={3} label="PAGE" />
      <div className="pl-word font-display pointer-events-none absolute inset-0 z-[2] grid place-items-center text-[clamp(40px,8vw,120px)] font-[900] opacity-0">BRAND</div>
      <div className="absolute inset-0 grid grid-cols-12 grid-rows-8">
        {Array.from({ length: 96 }, (_, k) => (
          <span key={k} className="pl-cell bg-[var(--accent,#2f8cff)] opacity-0" />
        ))}
      </div>
    </div>
  );
}

/** M63 · Rapid layers intro (Codrops RapidLayersAnimation, MIT): 4 colour/photo layers wipe in fast, one after another,
 *  ending on the hero. Demo replays on a loop. */
export function RapidLayers({ loop = true }: { loop?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const layers = root.current!.querySelectorAll(".rl-layer");
    const title = root.current!.querySelector(".rl-title");
    const tl = gsap
      .timeline({ repeat: loop ? -1 : 0, repeatDelay: 0.6, defaults: { ease: "power4.inOut" } })
      .set(layers, { clipPath: "inset(100% 0 0 0)" })
      .set(title, { yPercent: 110 })
      .to(layers, { clipPath: "inset(0% 0 0 0)", duration: 0.7, stagger: 0.09 })
      .to(title, { yPercent: 0, duration: 0.8, ease: "power4.out" }, "-=0.25")
      .to({}, { duration: 1 });
    return () => {
      tl.kill();
    };
  }, [loop]);
  const fills = ["#0b1020", "#2f8cff", "#9fd8ff"];
  return (
    <div ref={root} className="relative h-full w-full overflow-hidden rounded-[18px] bg-black">
      {fills.map((f) => (
        <div key={f} className="rl-layer absolute inset-0" style={{ background: f }} />
      ))}
      <div className="rl-layer absolute inset-0">
        <Img i={0} />
      </div>
      <div className="absolute inset-x-[6%] bottom-[10%] overflow-hidden">
        <p className="rl-title font-display text-[clamp(40px,7vw,110px)] font-[900] leading-[0.9]">New season</p>
      </div>
    </div>
  );
}

/** M57 · Scroll blur typography (Codrops ScrollBlurTypography, MIT): letters come into focus left → right with the scroll. */
export function ScrollBlurText({ text, className = "" }: { text: string; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const split = SplitText.create(root.current!.querySelector("p")!, { type: "words,chars" });
    const tw = gsap.fromTo(
      split.chars,
      { filter: "blur(10px)", opacity: 0, scaleY: 1.6, yPercent: 25 },
      { filter: "blur(0px)", opacity: 1, scaleY: 1, yPercent: 0, ease: "none", stagger: 0.05, paused: true },
    );
    const st = ScrollTrigger.create({ trigger: root.current, start: "top 85%", end: "center 45%", scrub: 0.4, animation: tw });
    return () => {
      st.kill();
      tw.kill();
      split.revert();
    };
  }, [text]);
  return (
    <div ref={root} className={className}>
      <p className="font-display leading-[0.95]">{text}</p>
    </div>
  );
}

/** M58 · Type shuffle (Codrops TypeShuffleAnimation, MIT): each letter flickers through glyphs on a colour cell, then
 *  settles; replays on a loop while on screen. */
export function TypeShuffle({ text, className = "" }: { text: string; className?: string }) {
  const root = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const split = SplitText.create(root.current!, { type: "words,chars", charsClass: "ts-char" });
    const glyphs = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789#%&*";
    const finals = split.chars.map((c) => c.textContent ?? "");
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.4, paused: true });
    split.chars.forEach((c, i) => {
      const o = { k: 0 };
      tl.to(
        o,
        {
          k: 1,
          duration: 0.5,
          ease: "none",
          onStart: () => c.classList.add("is-shuffling"),
          onUpdate: () => (c.textContent = o.k < 1 ? glyphs[Math.floor(Math.random() * glyphs.length)] : finals[i]),
          onComplete: () => {
            c.textContent = finals[i];
            c.classList.remove("is-shuffling");
          },
        },
        i * 0.04,
      );
    });
    const st = ScrollTrigger.create({ trigger: root.current, start: "top 85%", end: "bottom top", onToggle: (s) => (s.isActive ? tl.play() : tl.pause()) });
    return () => {
      st.kill();
      tl.kill();
      split.revert();
    };
  }, [text]);
  return (
    <p ref={root} className={`fx-shuffle font-display ${className}`}>
      {text}
    </p>
  );
}

/** M59 · Liquid morphing words (Magic UI morphing-text, MIT): words melt into each other through a gooey threshold filter. */
export function MorphingWords({ words, className = "" }: { words: string[]; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const a = useRef<HTMLSpanElement>(null);
  const b = useRef<HTMLSpanElement>(null);
  const st = useRef({ idx: 0, f: 0, hold: 0 });
  useTicker(root, (_, dt) => {
    const s = st.current;
    if (s.hold > 0) {
      s.hold -= dt;
      return;
    }
    s.f += dt / 1.1;
    const f = Math.min(1, s.f);
    const A = a.current!;
    const B = b.current!;
    A.textContent = words[s.idx % words.length];
    B.textContent = words[(s.idx + 1) % words.length];
    B.style.filter = `blur(${Math.min(8 / Math.max(f, 0.01) - 8, 100).toFixed(1)}px)`;
    B.style.opacity = `${Math.pow(f, 0.4) * 100}%`;
    const inv = 1 - f;
    A.style.filter = `blur(${Math.min(8 / Math.max(inv, 0.01) - 8, 100).toFixed(1)}px)`;
    A.style.opacity = `${Math.pow(inv, 0.4) * 100}%`;
    if (f >= 1) {
      s.idx++;
      s.f = 0;
      s.hold = 0.9;
      A.textContent = words[s.idx % words.length];
      A.style.filter = "none";
      A.style.opacity = "100%";
      B.style.opacity = "0%";
    }
  });
  return (
    <div ref={root} className={pos(className)}>
      <svg className="absolute h-0 w-0" aria-hidden>
        <filter id="fx-threshold">
          <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 255 -140" />
        </filter>
      </svg>
      <div className="relative grid h-full w-full place-items-center" style={{ filter: "url(#fx-threshold) blur(0.6px)" }}>
        <span ref={a} className="font-display absolute font-[900]">
          {words[0]}
        </span>
        <span ref={b} className="font-display absolute font-[900] opacity-0" />
      </div>
    </div>
  );
}

/** M60 · Flickering grid background (Magic UI flickering-grid, MIT): a canvas of small squares that twinkle. */
export function FlickeringGrid({ className = "", color = "92,200,255", size = 4, gap = 6, chance = 0.25, maxOpacity = 0.35 }: { className?: string; color?: string; size?: number; gap?: number; chance?: number; maxOpacity?: number }) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const grid = useRef<{ cols: number; rows: number; a: Float32Array } | null>(null);
  useEffect(() => {
    const c = canvas.current!;
    const fit = () => {
      const r = c.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      c.width = r.width * dpr;
      c.height = r.height * dpr;
      const cols = Math.ceil(r.width / (size + gap));
      const rows = Math.ceil(r.height / (size + gap));
      const a = new Float32Array(cols * rows).map(() => Math.random() * maxOpacity);
      grid.current = { cols, rows, a };
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(c);
    return () => ro.disconnect();
  }, [size, gap, maxOpacity]);
  useTicker(root, (_, dt) => {
    const g = grid.current;
    const c = canvas.current!;
    if (!g) return;
    const ctx = c.getContext("2d")!;
    const dpr = c.width / c.getBoundingClientRect().width || 1;
    ctx.clearRect(0, 0, c.width, c.height);
    for (let i = 0; i < g.a.length; i++) {
      if (Math.random() < chance * dt) g.a[i] = Math.random() * maxOpacity;
      ctx.fillStyle = `rgba(${color},${g.a[i]})`;
      ctx.fillRect((i % g.cols) * (size + gap) * dpr, Math.floor(i / g.cols) * (size + gap) * dpr, size * dpr, size * dpr);
    }
  });
  return (
    <div ref={root} className={pos(className)}>
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" />
    </div>
  );
}

/** M61 · Light rays background (Magic UI light-rays, MIT): soft blurred beams from the top sway and breathe. */
export function LightRays({ className = "", count = 7 }: { className?: string; count?: number }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const rays = root.current!.querySelectorAll<HTMLElement>(".lr-ray");
    const tws = Array.from(rays).map((r, i) =>
      gsap.fromTo(
        r,
        { opacity: 0, rotation: -14 + (i % 3) * 6 },
        { opacity: 0.55 + (i % 3) * 0.15, rotation: 14 - (i % 4) * 5, duration: 3.2 + (i % 5) * 0.7, ease: "sine.inOut", yoyo: true, repeat: -1 },
      ).progress((i * 0.37) % 1), // each ray starts at a different point of its sway
    );
    return () => tws.forEach((t) => t.kill());
  }, []);
  return (
    <div ref={root} className={`pointer-events-none overflow-hidden ${pos(className)}`}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="lr-ray absolute top-[-10%] origin-top" style={{ left: `${8 + ((i * 37) % 84)}%`, width: `${70 + ((i * 53) % 90)}px`, height: "120%" }} />
      ))}
    </div>
  );
}

/** M64 · Shimmer border button (Magic UI shimmer-button, MIT): a light spark runs round the border, forever. */
export function ShimmerButton({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <button type="button" className={`fx-shimmer ${className}`}>
      <span className="fx-shimmer-spark" aria-hidden />
      <span className="relative z-[1]">{children}</span>
    </button>
  );
}

/** M65 · Gooey cursor trail (Codrops GooeyCursor, MIT): cells light under the pointer and melt together through a goo
 *  filter; in record mode (or with no pointer) a scripted figure-eight draws the trail. */
export function GooeyCursor({ className = "" }: { className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const ptr = useRef<{ x: number; y: number; at: number } | null>(null);
  const COLS = 24;
  const ROWS = 14;
  const life = useRef(new Float32Array(COLS * ROWS));
  useEffect(() => {
    const el = root.current!;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      ptr.current = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, at: performance.now() };
    };
    el.addEventListener("pointermove", move);
    return () => el.removeEventListener("pointermove", move);
  }, []);
  useTicker(root, (t, dt) => {
    const live = ptr.current && performance.now() - ptr.current.at < 800 && !isRecording();
    const x = live ? ptr.current!.x : 0.5 + Math.sin(t * 1.3) * 0.38;
    const y = live ? ptr.current!.y : 0.5 + Math.sin(t * 2.6) * 0.32;
    const cx = Math.floor(gsap.utils.clamp(0, 0.999, x) * COLS);
    const cy = Math.floor(gsap.utils.clamp(0, 0.999, y) * ROWS);
    const L = life.current;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const gx = cx + dx;
        const gy = cy + dy;
        if (gx >= 0 && gx < COLS && gy >= 0 && gy < ROWS) L[gy * COLS + gx] = Math.max(L[gy * COLS + gx], dx || dy ? 0.6 : 1);
      }
    const cells = root.current!.querySelectorAll<HTMLElement>(".gc-cell");
    for (let i = 0; i < L.length; i++) {
      L[i] = Math.max(0, L[i] - dt * 1.6);
      cells[i].style.opacity = L[i].toFixed(2);
    }
  });
  return (
    <div ref={root} className={`overflow-hidden ${pos(className)}`}>
      <svg className="absolute h-0 w-0" aria-hidden>
        <filter id="fx-goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="b" />
          <feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" />
        </filter>
      </svg>
      <div className="absolute inset-0 grid mix-blend-screen" style={{ gridTemplateColumns: `repeat(${COLS},1fr)`, gridTemplateRows: `repeat(${ROWS},1fr)`, filter: "url(#fx-goo)" }}>
        {Array.from({ length: COLS * ROWS }, (_, i) => (
          <span key={i} className="gc-cell bg-[var(--accent,#2f8cff)] opacity-0" />
        ))}
      </div>
    </div>
  );
}
