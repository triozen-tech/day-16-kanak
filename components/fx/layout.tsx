"use client";

// Layout & scroll effects (MOTION-MENU M40 · M41 · M42 · M46 · M47 · M50 · M51 · M53 · M54 · M62 · M71).
// Scroll-driven ones read progress from the surrounding <ScrubRoot> (a tall section with a sticky stage); the rest
// play by themselves while on screen. ?static=1 shows each one's final state.
import { useEffect, useRef, useState } from "react";
import { gsap, isRecording, loadPlugin, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { scene, useScrub, useTicker } from "./shared";

const Img = ({ i, className = "", label = "" }: { i: number; className?: string; label?: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={scene(i, 1200, 800, label)} alt="" className={`h-full w-full object-cover ${className}`} draggable={false} />
);

/** M40 · Sticky stacking cards: each card pins, the next slides over it; covered cards shrink back and dim. */
export function StackCards({ items }: { items: { title: string; text: string }[] }) {
  const root = useRef<HTMLDivElement>(null);
  useScrub(root, (p) => {
    const cards = root.current!.querySelectorAll<HTMLElement>(".sc-card");
    const n = cards.length;
    cards.forEach((c, i) => {
      // how far the NEXT cards have come over this one
      const over = gsap.utils.clamp(0, n - 1 - i, p * (n - 1) - i);
      const y = gsap.utils.clamp(0, 1, i - p * (n - 1)) * 110; // cards below wait under the fold
      c.style.transform = `translateY(${y}%) scale(${1 - over * 0.06})`;
      c.style.filter = `brightness(${1 - over * 0.25})`;
    });
  });
  return (
    <div ref={root} className="relative h-full w-full">
      {items.map((it, i) => (
        <article key={it.title} className="sc-card absolute inset-x-[8%] top-[14%] bottom-[10%] overflow-hidden rounded-[24px] border border-white/10 shadow-2xl will-change-transform" style={{ zIndex: i + 1 }}>
          <Img i={i} />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-[clamp(18px,3vw,40px)]">
            <p className="font-display text-[clamp(28px,4vw,64px)] font-[800] leading-none">{it.title}</p>
            <p className="mt-2 max-w-[40ch] text-[15px] text-white/75">{it.text}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

/** M41 · Pinned horizontal gallery with speed skew: vertical scroll moves the row sideways; speed skews the cards. */
export function SkewGallery({ count = 6 }: { count?: number }) {
  const root = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const skew = useRef(0);
  const target = useRef(0);
  useScrub(root, (p, v) => {
    const max = row.current!.scrollWidth - root.current!.clientWidth;
    row.current!.style.transform = `translateX(${-p * max}px)`;
    target.current = v * 14;
  }, { finalValue: 0 });
  useTicker(root, () => {
    skew.current += (target.current - skew.current) * 0.12;
    target.current *= 0.9;
    for (const c of row.current!.children as HTMLCollectionOf<HTMLElement>) c.style.transform = `skewX(${(-skew.current).toFixed(2)}deg)`;
  });
  return (
    <div ref={root} className="flex h-full w-full items-center overflow-hidden">
      <div ref={row} className="flex gap-[3vw] pl-[8vw] pr-[8vw] will-change-transform">
        {Array.from({ length: count }, (_, i) => (
          <figure key={i} className="h-[56vh] w-[min(38vw,520px)] shrink-0 overflow-hidden rounded-[16px] will-change-transform max-md:w-[70vw] max-md:h-[50vh]">
            <Img i={i} label={`0${i + 1}`} />
          </figure>
        ))}
      </div>
    </div>
  );
}

/** M42 · Split screen, opposite scroll: two columns of images travel in opposite directions while the stage is pinned. */
export function SplitOpposite() {
  const root = useRef<HTMLDivElement>(null);
  const a = useRef<HTMLDivElement>(null);
  const b = useRef<HTMLDivElement>(null);
  useScrub(root, (p) => {
    a.current!.style.transform = `translateY(${-p * 66}%)`;
    b.current!.style.transform = `translateY(${-66 + p * 66}%)`;
  }, { finalValue: 0.5 });
  const col = (ref: React.RefObject<HTMLDivElement | null>, off: number) => (
    <div className="relative h-full overflow-hidden">
      <div ref={ref} className="flex flex-col gap-4 p-4 will-change-transform">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-[48vh] overflow-hidden rounded-[14px]">
            <Img i={i + off} />
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div ref={root} className="grid h-full w-full grid-cols-2">
      {col(a, 0)}
      {col(b, 2)}
    </div>
  );
}

/** M46 · Scroll before/after slider: a divider sweeps across, revealing the "after" image as you scroll. */
export function BeforeAfter() {
  const root = useRef<HTMLDivElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  useScrub(root, (p) => {
    const e = p;
    top.current!.style.clipPath = `inset(0 ${(100 - e * 100).toFixed(2)}% 0 0)`;
    bar.current!.style.left = `${(e * 100).toFixed(2)}%`;
  }, { finalValue: 0.5 });
  return (
    <div ref={root} className="fx-drift relative h-full w-full overflow-hidden rounded-[18px]">
      <Img i={0} label="BEFORE" className="absolute inset-0 grayscale" />
      <div ref={top} className="absolute inset-0" style={{ clipPath: "inset(0 50% 0 0)" }}>
        <Img i={1} label="AFTER" />
      </div>
      <div ref={bar} className="absolute top-0 h-full w-[2px] -translate-x-1/2 bg-white shadow-[0_0_20px_white]" style={{ left: "50%" }}>
        <span className="absolute top-1/2 left-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-[13px] font-bold text-black">⇆</span>
      </div>
    </div>
  );
}

/** M47 · Exploded product view: the layers of a product pull apart in depth with the scroll; callout lines draw on. */
export function Exploded() {
  const root = useRef<HTMLDivElement>(null);
  const parts = ["Cap", "Seal", "Body", "Base"];
  useScrub(root, (p) => {
    const e = p; // whole scrub, linear
    root.current!.querySelectorAll<HTMLElement>(".ex-part").forEach((el, i) => {
      const off = (i - (parts.length - 1) / 2) * 90 * e;
      el.style.transform = `translate(-50%, calc(-50% + ${off}px)) rotateX(58deg) rotateZ(${-30 + e * 8}deg)`;
    });
    root.current!.querySelectorAll<SVGPathElement>(".ex-line").forEach((l) => gsap.set(l, { drawSVG: `0% ${Math.round(gsap.utils.clamp(0, 1, e * 1.4 - 0.2) * 100)}%` }));
    root.current!.querySelectorAll<HTMLElement>(".ex-label").forEach((l) => (l.style.opacity = String(gsap.utils.clamp(0, 1, e * 2 - 0.8))));
  }, { finalValue: 0.8 });
  const colors = ["#9fd8ff", "#eaf5ff", "#2f8cff", "#5cc8ff"];
  return (
    <div ref={root} className="fx-drift relative h-full w-full [perspective:1100px]">
      {parts.map((name, i) => (
        <div key={name}>
          <div
            className="ex-part absolute left-1/2 top-1/2 h-[min(26vw,240px)] w-[min(26vw,240px)] rounded-[22%] border border-white/30 shadow-2xl"
            style={{ background: `linear-gradient(135deg, ${colors[i]}, #0b1020)`, zIndex: 10 - i, transform: "translate(-50%,-50%) rotateX(58deg) rotateZ(-30deg)" }}
          />
          <svg className="pointer-events-none absolute left-1/2 top-1/2 h-px w-[22vw] overflow-visible" style={{ transform: `translate(8vw, ${(i - 1.5) * 90}px)` }}>
            <path className="ex-line" d="M0 0 H300" stroke="white" strokeOpacity=".6" strokeWidth="1" />
          </svg>
          <span className="ex-label label absolute left-1/2 top-1/2 text-[13px] text-white/90" style={{ transform: `translate(calc(8vw + min(22vw, 300px) + 10px), ${(i - 1.5) * 90 - 8}px)`, opacity: 0 }}>
            0{i + 1} · {name}
          </span>
        </div>
      ))}
    </div>
  );
}

/** M50 · Rack focus: a foreground and a background layer swap sharpness as you scroll (a lens pulling focus). */
export function RackFocus() {
  const root = useRef<HTMLDivElement>(null);
  const fg = useRef<HTMLDivElement>(null);
  const bg = useRef<HTMLDivElement>(null);
  useScrub(root, (p) => {
    const e = p;
    bg.current!.style.filter = `blur(${(10 * (1 - e)).toFixed(1)}px) brightness(${0.6 + 0.4 * e})`;
    fg.current!.style.filter = `blur(${(8 * e).toFixed(1)}px)`;
    fg.current!.style.transform = `translate(-50%, -50%) scale(${1 + e * 0.08})`;
  }, { finalValue: 1 });
  return (
    <div ref={root} className="relative h-full w-full overflow-hidden rounded-[18px]">
      <div ref={bg} className="fx-drift absolute inset-0 will-change-[filter]">
        <Img i={3} />
      </div>
      <div ref={fg} className="absolute left-1/2 top-[58%] h-[46%] w-[34%] overflow-hidden rounded-[18px] shadow-2xl will-change-[filter]" style={{ transform: "translate(-50%,-50%)" }}>
        <Img i={0} />
      </div>
    </div>
  );
}

/** M51 · 3D card tilt-rotate: tilts toward the pointer with a moving glare; hands-free it traces a slow figure-eight. */
export function TiltCard3D({ children }: { children?: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const ptr = useRef<{ x: number; y: number; at: number } | null>(null);
  useEffect(() => {
    const el = root.current!;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      ptr.current = { x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5, at: performance.now() };
    };
    el.addEventListener("pointermove", move);
    return () => el.removeEventListener("pointermove", move);
  }, []);
  const cur = useRef({ x: 0, y: 0 });
  useTicker(root, (t) => {
    // the pointer wins for 1.5 s after it moves; otherwise (and always in record mode) the figure-eight
    const live = ptr.current && performance.now() - ptr.current.at < 1500 && !isRecording();
    const tx = live ? ptr.current!.x : Math.sin(t * 0.9) * 0.45;
    const ty = live ? ptr.current!.y : Math.sin(t * 1.8) * 0.3;
    cur.current.x += (tx - cur.current.x) * 0.1;
    cur.current.y += (ty - cur.current.y) * 0.1;
    const c = card.current!;
    c.style.transform = `rotateY(${(cur.current.x * 22).toFixed(2)}deg) rotateX(${(-cur.current.y * 18).toFixed(2)}deg)`;
    c.style.setProperty("--gx", `${((cur.current.x + 0.5) * 100).toFixed(1)}%`);
    c.style.setProperty("--gy", `${((cur.current.y + 0.5) * 100).toFixed(1)}%`);
  });
  return (
    <div ref={root} className="grid h-full w-full place-items-center [perspective:900px]">
      <div ref={card} className="fx-tilt relative aspect-[3/4] h-[62%] overflow-hidden rounded-[22px] border border-white/15 shadow-2xl [transform-style:preserve-3d]">
        <Img i={1} />
        {children}
        <div className="fx-glare pointer-events-none absolute inset-0" />
      </div>
    </div>
  );
}

const SHAPES = [
  "M100,10 C150,10 190,50 190,100 C190,150 150,190 100,190 C50,190 10,150 10,100 C10,50 50,10 100,10 Z", // circle
  "M100,8 L192,100 L100,192 L8,100 Z", // diamond
  "M100,15 L123,72 L185,75 L137,112 L154,172 L100,138 L46,172 L63,112 L15,75 L77,72 Z", // star
  "M30,30 C70,0 130,0 170,30 C200,70 200,130 170,170 C130,200 70,200 30,170 C0,130 0,70 30,30 Z", // soft square
];
/** M53 · SVG shape morph (MorphSVG, loaded on demand): a badge/shape melts from one form to the next with the scroll. */
export function MorphShape({ className = "" }: { className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const spin = useRef<SVGGElement>(null);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let dead = false;
    loadPlugin("MorphSVGPlugin").then(() => {
      if (dead) return;
      const path = root.current!.querySelector("path")!;
      // linear steps: no near-stop between shapes (record mode's scroll curve already eases)
      const t = gsap.timeline({ paused: true, defaults: { ease: "none", duration: 1 } });
      SHAPES.slice(1).forEach((d) => t.to(path, { morphSVG: { shape: d, type: "rotational" } }));
      tl.current = t;
    });
    return () => {
      dead = true;
      tl.current?.kill();
    };
  }, []);
  useScrub(root, (p) => tl.current?.progress(p), { finalValue: 0 });
  useTicker(root, (t) => spin.current?.setAttribute("transform", `rotate(${(t * 24) % 360} 100 100)`));
  return (
    <div ref={root} className={className}>
      <svg viewBox="0 0 200 200" className="h-full w-full overflow-visible">
        <defs>
          <linearGradient id="morph-g" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="var(--accent, #2f8cff)" />
            <stop offset="1" stopColor="#eaf5ff" />
          </linearGradient>
        </defs>
        <g ref={spin}>
          <path d={SHAPES[0]} fill="url(#morph-g)" />
        </g>
      </svg>
    </div>
  );
}

/** M54 · Flip layout morph (Flip, loaded on demand): a grid tile grows into the detail view and back, by itself. */
export function FlipGrid() {
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<number | null>(null);
  const flip = useRef<typeof import("gsap/Flip").Flip | null>(null);
  const state = useRef<ReturnType<typeof import("gsap/Flip").Flip.getState> | null>(null);
  useEffect(() => {
    loadPlugin("Flip").then((F) => (flip.current = F));
  }, []);
  const toggle = (i: number | null) => {
    if (flip.current) state.current = flip.current.getState(root.current!.querySelectorAll(".fg-tile"));
    setOpen(i);
  };
  useEffect(() => {
    if (!state.current || !flip.current) return;
    flip.current.from(state.current, { duration: 0.9, ease: "power3.inOut", absolute: true, nested: true });
    state.current = null;
  }, [open]);
  // hands-free: open a tile, close it, open the next … every 2.2 s while on screen
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let k = 0;
    let on = false;
    const io = new IntersectionObserver(([e]) => (on = e.isIntersecting));
    io.observe(root.current!);
    const id = window.setInterval(() => {
      if (!on) return;
      k++;
      toggle(k % 2 ? ((k >> 1) % 6) : null);
    }, 1100);
    return () => {
      io.disconnect();
      clearInterval(id);
    };
  }, []);
  return (
    <div ref={root} className={`grid h-full w-full gap-3 p-3 ${open === null ? "grid-cols-3 grid-rows-2" : "grid-cols-[2fr_1fr] grid-rows-5"}`}>
      {Array.from({ length: 6 }, (_, i) => (
        <button
          type="button"
          key={i}
          onClick={() => toggle(open === i ? null : i)}
          data-flip-id={`t${i}`}
          className={`fg-tile overflow-hidden rounded-[14px] ${open === i ? "row-span-5" : ""}`}
          style={open !== null && open !== i ? { gridColumn: 2 } : undefined}
        >
          <Img i={i} label={open === i ? `ITEM 0${i + 1}` : ""} />
        </button>
      ))}
    </div>
  );
}

/** M62 · Double-image clip reveal (after Codrops DoubleImageHover/Unreveal, MIT): a colour panel and a copy of the image
 *  unfold with clip-path while the inner image counter-scales; plays on entering, repeats on re-entry. */
export function ClipDouble({ i = 0 }: { i?: number }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const q = gsap.utils.selector(root);
    const tl = gsap
      .timeline({ paused: true, defaults: { ease: "power4.inOut" } })
      .fromTo(q(".cd-panel"), { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 0.7 })
      .fromTo(q(".cd-img"), { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 1.1 }, 0.35)
      .fromTo(q(".cd-img img"), { scale: 1.35 }, { scale: 1, duration: 1.6, ease: "power3.out" }, 0.35)
      .to(q(".cd-panel"), { clipPath: "inset(0 0 100% 0)", duration: 0.7 }, 0.9);
    const st = ScrollTrigger.create({ trigger: root.current, start: "top 75%", onEnter: () => tl.restart(), onEnterBack: () => tl.restart() });
    return () => {
      st.kill();
      tl.kill();
    };
  }, []);
  return (
    <div ref={root} className="relative h-full w-full overflow-hidden rounded-[18px]">
      <div className="cd-img absolute inset-0 overflow-hidden">
        <Img i={i} />
      </div>
      <div className="cd-panel absolute inset-0 bg-[var(--accent,#2f8cff)]" style={{ clipPath: "inset(0 0 100% 0)" }} />
    </div>
  );
}

/** M71 · Magnetic button with text parallax (after Codrops MagneticButtons, MIT): the button leans toward the pointer
 *  and its label leans further; hands-free (record mode / no pointer) a virtual pointer orbits it once it arrives. */
export function MagneticButton({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const btn = useRef<HTMLButtonElement>(null);
  const txt = useRef<HTMLSpanElement>(null);
  const ptr = useRef<{ x: number; y: number; at: number } | null>(null);
  const seen = useRef(0);
  useEffect(() => {
    const b = btn.current!;
    const area = b.parentElement!;
    const move = (e: PointerEvent) => {
      const r = b.getBoundingClientRect();
      ptr.current = { x: e.clientX - (r.left + r.width / 2), y: e.clientY - (r.top + r.height / 2), at: performance.now() };
    };
    area.addEventListener("pointermove", move);
    return () => area.removeEventListener("pointermove", move);
  }, []);
  const pos = useRef({ x: 0, y: 0 });
  useTicker(btn, (t, dt) => {
    seen.current += dt;
    const live = ptr.current && performance.now() - ptr.current.at < 1200 && !isRecording();
    let tx = 0;
    let ty = 0;
    if (live) {
      const d = Math.hypot(ptr.current!.x, ptr.current!.y);
      if (d < 180) {
        tx = ptr.current!.x * 0.35;
        ty = ptr.current!.y * 0.35;
      }
    } else {
      // virtual pointer: a slow orbit (ellipse) around the button
      tx = Math.cos(t * 1.6) * 14;
      ty = Math.sin(t * 1.6) * 8;
    }
    pos.current.x += (tx - pos.current.x) * 0.14;
    pos.current.y += (ty - pos.current.y) * 0.14;
    btn.current!.style.transform = `translate(${pos.current.x.toFixed(2)}px, ${pos.current.y.toFixed(2)}px)`;
    txt.current!.style.transform = `translate(${(pos.current.x * 0.6).toFixed(2)}px, ${(pos.current.y * 0.6).toFixed(2)}px)`;
  });
  return (
    <button ref={btn} type="button" className={`fx-magnetic ${className}`}>
      <span ref={txt} className="relative z-[1] inline-block">
        {children}
      </span>
    </button>
  );
}
