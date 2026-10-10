"use client";

// Text effects (MOTION-MENU M8 · M22 · M39 · M44 · M45 · M48 · M49). All GSAP; each one moves by itself while on
// screen or with the scroll, never needs the mouse, and shows its final text in ?static=1.
import { useEffect, useId, useRef } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { useScrub, useTicker } from "./shared";

/** M22 · Scramble decode (GSAP ScrambleText): the text shuffles through characters and lands left → right. */
export function ScrambleLine({ text, className = "", chars = "upperCase", duration = 1.4 }: { text: string; className?: string; chars?: string; duration?: number }) {
  const el = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const t = gsap.to(el.current, {
      duration,
      scrambleText: { text, chars, revealDelay: 0.2, speed: 0.6 },
      ease: "none",
      paused: true,
    });
    const st = ScrollTrigger.create({ trigger: el.current, start: "top 85%", onEnter: () => t.restart(), onEnterBack: () => t.restart() });
    return () => {
      st.kill();
      t.kill();
    };
  }, [text, chars, duration]);
  return (
    <span ref={el} className={className} aria-label={text}>
      {text}
    </span>
  );
}

/** M8 · Line draw (GSAP DrawSVG): three ring lines draw on like a charge bar, then keep a light running along them. */
export function DrawRings({ className = "" }: { className?: string }) {
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const paths = svg.current!.querySelectorAll(".dr-line");
    const sparks = svg.current!.querySelectorAll(".dr-spark");
    const tl = gsap.timeline({ scrollTrigger: { trigger: svg.current, start: "top 85%", toggleActions: "play none none reset" } });
    tl.fromTo(paths, { drawSVG: "50% 50%" }, { drawSVG: "0% 100%", duration: 1.1, ease: "power3.inOut", stagger: 0.12 });
    // a short bright segment keeps running along each line (never still)
    gsap.fromTo(sparks, { drawSVG: "0% 6%" }, { drawSVG: "94% 100%", duration: 1.6, ease: "none", repeat: -1, stagger: { each: 0.25, repeat: -1 } });
    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
      gsap.killTweensOf(sparks);
    };
  }, []);
  return (
    <svg ref={svg} viewBox="0 0 600 60" className={className} fill="none" aria-hidden>
      {[14, 30, 46].map((y) => (
        <g key={y}>
          <path className="dr-line" d={`M10 ${y} H590`} stroke="currentColor" strokeOpacity=".7" strokeWidth="3" strokeLinecap="round" />
          <path className="dr-spark" d={`M10 ${y} H590`} stroke="#eaf5ff" strokeWidth="4" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 6px currentColor)" }} />
        </g>
      ))}
    </svg>
  );
}

/** M39 · Text on a moving curved path: an SVG textPath whose curve breathes and whose text slides with scroll + time. */
export function CurvedPathText({ text, className = "" }: { text: string; className?: string }) {
  const id = useId().replace(/:/g, "");
  const root = useRef<HTMLDivElement>(null);
  const tp = useRef<SVGTextPathElement>(null);
  const path = useRef<SVGPathElement>(null);
  const scroll = useRef(0);
  useScrub(root, (p) => (scroll.current = p), { finalValue: 0.5 });
  useTicker(root, (t) => {
    const off = (-scroll.current * 60 + ((t * 2.2) % 50)) % 50;
    tp.current?.setAttribute("startOffset", `${off}%`);
    const bend = 120 + Math.sin(t * 0.8) * 40 + scroll.current * 80;
    path.current?.setAttribute("d", `M-200,260 C200,${260 - bend * 2} 1000,${260 + bend * 2} 1400,260`);
  });
  const run = `${text} · `.repeat(6);
  return (
    <div ref={root} className={`overflow-hidden ${className}`}>
      {/* phones: the curve runs wider than the screen so the words stay big */}
      <svg viewBox="0 0 1200 520" className="h-full w-full overflow-visible max-md:ml-[-80%] max-md:w-[260%]" aria-label={text}>
        <path ref={path} id={`cp-${id}`} d="M-200,260 C200,20 1000,500 1400,260" fill="none" />
        <text className="font-display" fill="currentColor" fontSize="64" fontWeight="800" letterSpacing="4">
          <textPath ref={tp} href={`#cp-${id}`} startOffset="0%">
            {run}
          </textPath>
        </text>
      </svg>
    </div>
  );
}

/** M44 · Marquee that bends with scroll speed: words drift sideways forever; scrolling arcs the row (faster = deeper). */
export function BendMarquee({ words, className = "" }: { words: string[]; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const vel = useRef(0);
  const smooth = useRef(0);
  const x = useRef(0);
  useScrub(root, (_, v) => (vel.current = v), { finalValue: 0 });
  useTicker(root, (_, dt) => {
    smooth.current += (vel.current - smooth.current) * 0.08;
    vel.current *= 0.92;
    const items = row.current!.children as HTMLCollectionOf<HTMLElement>;
    const half = row.current!.scrollWidth / 2;
    x.current = (x.current - dt * (90 + Math.abs(smooth.current) * 600)) % half;
    const w = root.current!.clientWidth;
    for (const it of items) {
      const cx = it.offsetLeft + x.current + it.offsetWidth / 2;
      const n = gsap.utils.clamp(0, 1, cx / w);
      // arc: 0 at the edges, deepest in the middle; plus a calm idle wave so it never sits still
      const y = Math.sin(n * Math.PI) * (smooth.current * 220) + Math.sin(n * Math.PI * 2 + performance.now() / 900) * 6;
      it.style.transform = `translate3d(${x.current}px, ${y}px, 0) rotate(${(n - 0.5) * smooth.current * -30}deg)`;
    }
  });
  const list = [...words, ...words, ...words, ...words];
  return (
    <div ref={root} className={`overflow-hidden ${className}`}>
      <div ref={row} className="flex w-max gap-[0.6em] whitespace-nowrap py-[0.6em]">
        {list.map((w, i) => (
          <span key={i} className="font-display inline-block will-change-transform">
            {w}
            <span className="mx-[0.3em] opacity-40">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** M45 · Particle text: dots fly in from a scattered cloud and form the word with the scroll; they keep shimmering. */
export function ParticleText({ text, className = "", color = "#eaf5ff" }: { text: string; className?: string; color?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const prog = useRef(1);
  const pts = useRef<{ x: number; y: number; sx: number; sy: number; ph: number }[]>([]);
  useScrub(root, (p) => (prog.current = p), { finalValue: 1 });
  useEffect(() => {
    const c = canvas.current!;
    const build = () => {
      const r = c.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      c.width = r.width * dpr;
      c.height = r.height * dpr;
      // sample the word from an offscreen canvas
      const o = document.createElement("canvas");
      o.width = c.width;
      o.height = c.height;
      const ox = o.getContext("2d")!;
      const fam = getComputedStyle(document.documentElement).getPropertyValue("--font-display-family") || "sans-serif";
      let size = c.height * 0.62;
      ox.font = `900 ${size}px ${fam}`;
      const tw = ox.measureText(text).width;
      if (tw > c.width * 0.92) size *= (c.width * 0.92) / tw;
      ox.font = `900 ${size}px ${fam}`;
      ox.textAlign = "center";
      ox.textBaseline = "middle";
      ox.fillText(text, c.width / 2, c.height / 2);
      const data = ox.getImageData(0, 0, o.width, o.height).data;
      const step = Math.max(3, Math.round((c.width < 900 ? 3 : 4) * dpr));
      const out: typeof pts.current = [];
      for (let y = 0; y < o.height; y += step)
        for (let x = 0; x < o.width; x += step)
          if (data[(y * o.width + x) * 4 + 3] > 128)
            out.push({ x, y, sx: Math.random() * c.width, sy: Math.random() * c.height, ph: Math.random() * 6.28 });
      pts.current = out;
    };
    build();
    document.fonts?.ready.then(build);
    const ro = new ResizeObserver(build);
    ro.observe(c);
    return () => ro.disconnect();
  }, [text]);
  useTicker(root, (t) => {
    const c = canvas.current!;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = color;
    const e = gsap.parseEase("power3.inOut")(prog.current);
    const r = Math.max(2, c.width / 520); // big enough to read as a word at phone size too
    for (const p of pts.current) {
      const j = Math.sin(t * 2 + p.ph) * 3; // shimmer (enough to read as alive on camera)
      const x = p.sx + (p.x - p.sx) * e + j;
      const y = p.sy + (p.y - p.sy) * e + Math.cos(t * 1.7 + p.ph) * 3;
      ctx.globalAlpha = 0.35 + 0.65 * e;
      ctx.fillRect(x, y, r, r);
    }
  });
  return (
    <div ref={root} className={className} aria-label={text} role="img">
      <canvas ref={canvas} className="h-full w-full" />
    </div>
  );
}

/** M48 · Odometer: each digit is a column 0–9 that rolls to its value (staggered), and rolls again on re-entry. */
export function Odometer({ value, className = "", prefix = "", suffix = "" }: { value: string; className?: string; prefix?: string; suffix?: string }) {
  const root = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const cols = root.current!.querySelectorAll<HTMLElement>(".odo-col");
    const tl = gsap.timeline({ paused: true });
    cols.forEach((col, i) => {
      const d = Number(col.dataset.d);
      // the column sits at its final digit (top: -(10+d)em); roll in from showing "0" (y +(10+d)em) through a full cycle
      tl.fromTo(col, { y: `${(10 + d) * 1.15}em` }, { y: 0, duration: 1.4 + i * 0.18, ease: "power3.out" }, i * 0.08);
    });
    const st = ScrollTrigger.create({ trigger: root.current, start: "top 85%", onEnter: () => tl.restart(), onEnterBack: () => tl.restart() });
    return () => {
      st.kill();
      tl.kill();
    };
  }, [value]);
  return (
    <span ref={root} className={`inline-flex items-baseline tabular-nums ${className}`} aria-label={`${prefix}${value}${suffix}`}>
      {prefix}
      {value.split("").map((ch, i) =>
        /\d/.test(ch) ? (
          <span key={i} className="relative inline-block h-[1.15em] overflow-hidden leading-[1.15]" aria-hidden>
            {/* final digit in normal flow (static / no-JS), the rolling column on top */}
            <span className="invisible">{ch}</span>
            <span className="odo-col absolute left-0 flex flex-col" data-d={ch} style={{ top: `-${(10 + Number(ch)) * 1.15}em` }}>
              {Array.from({ length: 20 }, (_, k) => (
                <span key={k} className="block h-[1.15em]">
                  {k % 10}
                </span>
              ))}
            </span>
          </span>
        ) : (
          <span key={i} aria-hidden>
            {ch}
          </span>
        ),
      )}
      {suffix}
    </span>
  );
}

/** M49 · Light sweep / shine: a bright band sweeps across the text (or any element) on a loop, faster while scrolling. */
export function ShineText({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const el = useRef<HTMLSpanElement>(null);
  const pos = useRef(-0.3);
  const vel = useRef(0);
  useScrub(el, (_, v) => (vel.current = Math.abs(v)), { finalValue: 0 });
  useTicker(el, (_, dt) => {
    pos.current += dt * (0.45 + vel.current * 2);
    vel.current *= 0.9;
    if (pos.current > 1.6) pos.current = -0.4;
    el.current!.style.setProperty("--shine", `${(pos.current * 100).toFixed(1)}%`);
  });
  return (
    <span ref={el} className={`fx-shine ${className}`}>
      {children}
    </span>
  );
}
