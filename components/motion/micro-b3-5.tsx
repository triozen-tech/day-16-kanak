"use client";

// Micro-interactions, batch 3 · group 5 (MOTION-MENU U01). Small focused demo for /lab/motion.
// Plays by itself while on screen: a visible fake pointer (ring) walks over the photos and names and drives the hover;
// the real mouse takes over for 2.5 s whenever it moves. A CSS-only glow loop never stops.
// ?static=1 / reduced motion: no JS, the first portrait shows in colour.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { scene, useTicker } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const F = { sg: "Space Grotesk Variable", fr: "Fraunces Variable" };

const CSS = `
.b3g5u-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 34% 40%,var(--g1,rgba(79,141,255,.42)),transparent 70%),radial-gradient(32% 38% at 68% 64%,var(--g2,rgba(255,122,89,.2)),transparent 70%);animation:b3g5u-drift 5.8s linear infinite alternate;will-change:transform}
@keyframes b3g5u-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b3g5u-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4);pointer-events:none;z-index:40;opacity:0;transition:opacity .25s}
.u01-img{filter:grayscale(1) brightness(.78) contrast(1.05);transform:scale(1.04);transition:filter .7s cubic-bezier(.4,0,.2,1),transform .9s cubic-bezier(.2,.7,.2,1)}
.u01-card.on .u01-img,.u01-card:hover .u01-img{filter:grayscale(0) brightness(1) contrast(1);transform:scale(1)}
.u01-card .u01-tag{opacity:.5;transition:opacity .5s}
.u01-card.on .u01-tag,.u01-card:hover .u01-tag{opacity:1}
.u01-name{color:rgba(238,242,255,.42);transition:color .5s,transform .5s cubic-bezier(.2,.7,.2,1)}
.u01-name.on{color:#fff;transform:translateX(14px)}
.u01-name .u01-bar{transform:scaleX(0);transform-origin:0 50%;transition:transform .5s cubic-bezier(.2,.7,.2,1)}
.u01-name.on .u01-bar{transform:scaleX(1)}
html.is-static .b3g5u-glow{animation:none}
html.is-static {.b3g5u-glow{animation:none}.u01-img,.u01-name,.u01-name .u01-bar{transition:none}}
`;

/* ---------- shared helpers (local copies) ---------- */

function Stage({ r, children, g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; g1?: string; g2?: string }) {
  return (
    <div ref={r} className="relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0d16] text-[#eef2ff]">
      <style href="b3g5u-css" precedence="default">
        {CSS}
      </style>
      <div className="b3g5u-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
      {/* the glow again on top: the portraits cover most of the stage */}
      <div className="b3g5u-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.35, zIndex: 35 } as CSSProperties} aria-hidden />
    </div>
  );
}

const Dot = ({ r }: { r: RefObject<HTMLDivElement | null> }) => <div ref={r} className="b3g5u-dot" aria-hidden />;

type Pt = { x: number; y: number; inside: boolean };

/** Pointer driver: the real mouse wins for 2.5 s after it last moved; otherwise `script` moves a visible fake ring. */
function usePointer(root: RefObject<HTMLDivElement | null>, dot: RefObject<HTMLDivElement | null>, script: (t: number, el: HTMLDivElement) => Pt, frame: (p: Pt, el: HTMLDivElement) => void) {
  const real = useRef({ x: 0, y: 0, inside: false, at: -1e9 });
  const sc = useRef(script);
  sc.current = script;
  const fr = useRef(frame);
  fr.current = frame;
  const t0 = useRef(-1);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      real.current = { x: e.clientX - r.left, y: e.clientY - r.top, inside: true, at: performance.now() };
    };
    const leave = () => (real.current = { ...real.current, inside: false, at: performance.now() });
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [root]);
  useTicker(root, (t) => {
    const el = root.current;
    if (!el) return;
    if (t0.current < 0) t0.current = t;
    const R = real.current;
    const useReal = performance.now() - R.at < 2500;
    const p = useReal ? { x: R.x, y: R.y, inside: R.inside } : sc.current(t - t0.current, el);
    const dn = dot.current;
    if (dn) {
      dn.style.transform = `translate3d(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px,0)`;
      dn.style.opacity = useReal ? "0" : "1";
    }
    fr.current(p, el);
  });
}

const easeIO = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/** A path that holds at each point and glides to the next during the last `move` part of every `seg` seconds. */
function stepPath(t: number, pts: [number, number][], seg: number, move = 0.35): [number, number] {
  const n = pts.length;
  const k = Math.floor(t / seg);
  const f = t / seg - k;
  const a = pts[k % n];
  const b = pts[(k + 1) % n];
  const m = f < 1 - move ? 0 : easeIO((f - (1 - move)) / move);
  return [a[0] + (b[0] - a[0]) * m, a[1] + (b[1] - a[1]) * m];
}

function rel(node: Element, root: Element) {
  const a = node.getBoundingClientRect();
  const r = root.getBoundingClientRect();
  return { l: a.left - r.left, t: a.top - r.top, w: a.width, h: a.height };
}

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, className = "", w = 600, h = 800 }: { i: number; className?: string; w?: number; h?: number }) => (
  <img src={scene(i, w, h)} alt="" className={`block h-full w-full object-cover ${className}`} draggable={false} />
);

/* ───────────────────────── U01 · Grayscale to colour on hover ───────────────────────── */
const U01_TEAM = [
  { n: "Mira Solanki", r: "Head of design" },
  { n: "Teo Varga", r: "Furniture maker" },
  { n: "Ines Okafor", r: "Colour & finish" },
  { n: "Ravi Menon", r: "Studio lead" },
];
function U01() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const active = useRef(0);
  // the scripted walk: photo, name, photo, name… so both kinds of hover show; a short step off resets to greyscale
  const ORDER: ["card" | "name" | "off", number][] = [
    ["card", 0],
    ["card", 1],
    ["name", 2],
    ["card", 3],
    ["name", 1],
    ["card", 2],
    ["off", -1],
  ];
  usePointer(
    root,
    dot,
    (t, el) => {
      const cards = el.querySelectorAll(".u01-card");
      const names = el.querySelectorAll(".u01-name");
      const er = el.getBoundingClientRect();
      const pts: [number, number][] = ORDER.map(([k, i]) => {
        if (i < 0) return [er.width * 0.42, er.height * 0.93];
        const b = rel((k === "card" ? cards : names)[i], el);
        return k === "card" ? [b.l + b.w * 0.5, b.t + b.h * 0.45] : [b.l + Math.min(b.w * 0.4, 140), b.t + b.h / 2];
      });
      const [x, y] = stepPath(t, pts, 0.95, 0.4);
      return { x: x + Math.sin(t * 2.1) * 10, y: y + Math.cos(t * 1.7) * 8, inside: true };
    },
    (p, el) => {
      const cards = [...el.querySelectorAll(".u01-card")];
      const names = [...el.querySelectorAll(".u01-name")];
      const inBox = (n: Element) => {
        const b = rel(n, el);
        return p.x >= b.l && p.x <= b.l + b.w && p.y >= b.t && p.y <= b.t + b.h;
      };
      let idx = -1;
      if (p.inside) {
        idx = cards.findIndex(inBox);
        if (idx < 0) idx = names.findIndex(inBox);
      }
      if (idx === active.current) return;
      active.current = idx;
      cards.forEach((c, i) => c.classList.toggle("on", i === idx));
      names.forEach((c, i) => c.classList.toggle("on", i === idx));
    },
  );
  useEffect(() => {
    // motion on: start from all-greyscale so the first hover reads (static keeps portrait 1 in colour)
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    active.current = -1;
    el.querySelectorAll(".on").forEach((n) => n.classList.remove("on"));
  }, []);
  return (
    <Stage r={root} g1="rgba(255,179,107,.34)" g2="rgba(79,141,255,.22)">
      <div className="absolute inset-0 grid grid-cols-[minmax(240px,0.8fr)_2.2fr] gap-[3%] px-[4%] py-[4%]">
        <div className="flex flex-col justify-between">
          <div>
            <p className="text-[13px] uppercase tracking-[0.22em] text-white/55">Atelier Norn · the studio</p>
            <h3 className="mt-3 text-[clamp(36px,3.8vw,58px)] leading-[0.98]" style={{ fontFamily: F.fr, fontWeight: 500 }}>
              Four hands,
              <br />
              <span className="italic text-[#ffb36b]">one bench.</span>
            </h3>
          </div>
          <ul className="border-t border-white/15">
            {U01_TEAM.map((m, i) => (
              <li key={m.n} className={`u01-name flex items-center gap-3 border-b border-white/15 py-[clamp(10px,1.6vh,16px)] ${i === 0 ? "on" : ""}`}>
                <span className="u01-bar inline-block h-[2px] w-[22px] bg-[#ffb36b]" />
                <span className="text-[clamp(18px,1.6vw,24px)] font-[500]" style={{ fontFamily: F.sg }}>
                  {m.n}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-4 gap-[2%]">
          {U01_TEAM.map((m, i) => (
            <figure key={m.n} className={`u01-card relative overflow-hidden rounded-[14px] ${i === 0 ? "on" : ""}`} data-cursor="View">
              <div className="u01-img absolute inset-0">
                <Img i={i} w={480} h={720} />
              </div>
              <figcaption className="u01-tag absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-[10%] pt-[30%]">
                <p className="text-[15px] font-[600]" style={{ fontFamily: F.sg }}>
                  {m.n}
                </p>
                <p className="text-[13px] text-white/70">{m.r}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
      <Dot r={dot} />
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  {
    code: "U01",
    name: "Grayscale to colour on hover",
    how: "Portraits sit in greyscale; hovering a photo or its name fades it to full colour. A fake pointer walks the photos and names so it plays by itself.",
    kind: "play",
    C: U01,
  },
];
