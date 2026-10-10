"use client";

// FO · Footer layouts, batch 3 (docs/SECTION-MENU.md). Every footer keeps a "Concept website" credit line.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/* ---------------------------------------------------------------------------------------------------------------- */
// FO10 · a tiny circle physics world: gravity, floor + walls, circle–circle contacts, drag-and-throw

type Body = { x: number; y: number; vx: number; vy: number; r: number; rot: number; held: boolean };
const COUNT = 34;
// seeded random so the pile is the same on every load (and in ?static=1)
const rand = (s: number) => {
  const x = Math.sin(s * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};
const SWEETS = Array.from({ length: COUNT }, (_, k) => ({ r: 28 + Math.round(rand(k + 1) * 26), tone: k % 5, kind: k % 3 }));

function spawn(w: number): Body[] {
  return SWEETS.map((s, k) => ({ x: s.r + rand(k + 40) * (w - 2 * s.r), y: -s.r - k * 46 - rand(k + 80) * 60, vx: (rand(k + 7) - 0.5) * 120, vy: 0, r: s.r, rot: rand(k + 3) * 360, held: false }));
}

function step(b: Body[], w: number, h: number, dt: number) {
  const G = 2600;
  for (const p of b) {
    if (p.held) continue;
    p.vy += G * dt;
    p.vx *= 0.995;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += ((p.vx * dt) / p.r) * 57.3;
  }
  for (let it = 0; it < 3; it++) {
    for (let i = 0; i < b.length; i++) {
      const a = b[i];
      for (let j = i + 1; j < b.length; j++) {
        const c = b[j];
        const dx = c.x - a.x;
        const dy = c.y - a.y;
        const min = a.r + c.r;
        const d2 = dx * dx + dy * dy;
        if (d2 >= min * min || d2 === 0) continue;
        const d = Math.sqrt(d2);
        const nx = dx / d;
        const ny = dy / d;
        const over = min - d;
        const wa = a.held ? 0 : c.held ? 1 : 0.5;
        const wc = c.held ? 0 : a.held ? 1 : 0.5;
        a.x -= nx * over * wa;
        a.y -= ny * over * wa;
        c.x += nx * over * wc;
        c.y += ny * over * wc;
        const rv = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
        if (rv < 0) {
          const imp = -1.25 * rv;
          if (!a.held) {
            a.vx -= imp * nx * wa;
            a.vy -= imp * ny * wa;
          }
          if (!c.held) {
            c.vx += imp * nx * wc;
            c.vy += imp * ny * wc;
          }
        }
      }
    }
    for (const p of b) {
      if (p.held) continue;
      if (p.y + p.r > h) {
        p.y = h - p.r;
        if (p.vy > 0) p.vy *= -0.28;
        p.vx *= 0.9;
      }
      if (p.x - p.r < 0) {
        p.x = p.r;
        p.vx = Math.abs(p.vx) * 0.5;
      }
      if (p.x + p.r > w) {
        p.x = w - p.r;
        p.vx = -Math.abs(p.vx) * 0.5;
      }
    }
  }
}

const COLS = [
  { t: "Shop", l: ["Sour pebbles", "Fruit drops", "Gift tins", "Pick & mix"] },
  { t: "Visit", l: ["The sweet shop", "Factory tours", "Stockists"] },
  { t: "Help", l: ["Delivery", "Allergens", "Bulk orders", "Contact"] },
];

/** FO10 · Physics pile footer: sweets drop in and pile up along the bottom of the footer (auto-plays on entry, every
 *  sweet can be dragged and thrown, one hops now and then); wordmark, links and legal sit above the pile. Motion M12. */
function FO10() {
  const r = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const els = useRef<(HTMLDivElement | null)[]>([]);
  const bodies = useRef<Body[]>([]);
  const drag = useRef<{ i: number; px: number; py: number; t: number; vx: number; vy: number } | null>(null);
  useSectionMotion(r, "M12");

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const size = () => ({ w: el.clientWidth, h: el.clientHeight });
    const paint = () =>
      bodies.current.forEach((p, k) => {
        const n = els.current[k];
        if (n) n.style.transform = `translate(${(p.x - p.r).toFixed(1)}px, ${(p.y - p.r).toFixed(1)}px) rotate(${p.rot.toFixed(1)}deg)`;
      });
    const { w, h } = size();
    bodies.current = spawn(w);

    // ?static=1 / reduced motion: settle the pile offline and show it once
    if (prefersReducedMotion()) {
      for (let k = 0; k < 900; k++) step(bodies.current, w, h, 1 / 120);
      paint();
      return;
    }
    paint();

    let raf = 0;
    let last = 0;
    let started = false;
    let hop = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.033, (now - (last || now)) / 1000);
      last = now;
      const { w: ww, h: hh } = size();
      // a sweet hops every ~1.2 s so the pile never stands still
      hop += dt;
      if (hop > 1.2) {
        hop = 0;
        const free = bodies.current.filter((p) => !p.held && p.y > hh * 0.4);
        const p = free[Math.floor(Math.random() * free.length)];
        if (p) {
          p.vy = -900 - Math.random() * 300;
          p.vx = (Math.random() - 0.5) * 500;
        }
      }
      const sub = 3;
      for (let k = 0; k < sub; k++) step(bodies.current, ww, hh, dt / sub);
      paint();
    };
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      last = 0;
      if (e.isIntersecting) {
        if (!started) {
          started = true;
          bodies.current = spawn(size().w);
        }
        raf = requestAnimationFrame(loop);
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  const local = (e: React.PointerEvent) => {
    const b = box.current!.getBoundingClientRect();
    return { x: e.clientX - b.left, y: e.clientY - b.top };
  };
  const onDown = (e: React.PointerEvent, i: number) => {
    const p = bodies.current[i];
    if (!p) return;
    const { x, y } = local(e);
    p.held = true;
    p.vx = p.vy = 0;
    drag.current = { i, px: x, py: y, t: performance.now(), vx: 0, vy: 0 };
    box.current!.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const { x, y } = local(e);
    const p = bodies.current[d.i];
    const now = performance.now();
    const dt = Math.max(1, now - d.t) / 1000;
    d.vx = (x - d.px) / dt;
    d.vy = (y - d.py) / dt;
    p.x += x - d.px;
    p.y += y - d.py;
    d.px = x;
    d.py = y;
    d.t = now;
  };
  const onUp = () => {
    const d = drag.current;
    if (!d) return;
    const p = bodies.current[d.i];
    p.held = false;
    p.vx = Math.max(-2400, Math.min(2400, d.vx));
    p.vy = Math.max(-2400, Math.min(2400, d.vy));
    drag.current = null;
  };

  const tone = (t: number) => `color-mix(in srgb, var(--sx-accent) ${[100, 70, 45, 85, 60][t]}%, ${t % 2 ? "var(--sx-surface)" : "var(--sx-text)"})`;

  return (
    <Sec innerRef={r} theme="paper" font="condensed" full>
      <footer className="relative px-[clamp(20px,5vw,96px)] pt-[clamp(72px,8vw,120px)]">
        <div className="grid grid-cols-1 gap-[clamp(28px,4vw,64px)] md:grid-cols-12">
          <div className="md:col-span-5">
            <P className="max-w-[34ch]">Boiled sweets and sour pebbles, pulled by hand in Indore since 1994. Sugar, fruit, patience.</P>
            <div className="mt-6 flex max-w-[400px] items-center gap-2 rounded-full border border-[var(--sx-line)] bg-[var(--sx-surface)] p-1.5 pl-5">
              <span className="flex-1 text-[15px] text-[var(--sx-muted)]">your@email.com</span>
              <Btn className="py-2.5!">Get the tin list</Btn>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6 md:col-span-6 md:col-start-7">
            {COLS.map((c) => (
              <div key={c.t}>
                <p className="text-[13px] uppercase tracking-[0.16em] text-[var(--sx-muted)]">{c.t}</p>
                <ul className="mt-4 space-y-2.5 text-[15px]">
                  {c.l.map((l) => (
                    <li key={l}>
                      <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-[var(--sx-accent)]">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <H as="h2" className="mt-[clamp(40px,5vw,72px)] text-[clamp(80px,12vw,184px)] uppercase leading-[0.85]">
          Pebble &amp; Pop
        </H>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--sx-line)] pt-5 text-[13px] text-[var(--sx-muted)]">
          <span>© 2026 Pebble &amp; Pop · Concept website by Showreel Studio · sample prices</span>
          <span>Psst: grab a sweet and throw it ↓</span>
        </div>
      </footer>

      {/* the pile: a physics box along the bottom of the footer */}
      <div ref={box} className="relative h-[clamp(240px,30vh,320px)] touch-none select-none overflow-hidden" onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        {SWEETS.map((s, k) => (
          <div
            key={k}
            ref={(n) => void (els.current[k] = n)}
            onPointerDown={(e) => onDown(e, k)}
            className="absolute left-0 top-0 cursor-grab rounded-full shadow-[inset_-6px_-8px_14px_rgba(0,0,0,.18),0_6px_10px_-6px_rgba(28,24,19,.4)] will-change-transform active:cursor-grabbing"
            style={{
              width: s.r * 2,
              height: s.r * 2,
              transform: "translate(-200px, -400px)",
              background:
                s.kind === 0
                  ? `repeating-conic-gradient(from 0deg, ${tone(s.tone)} 0 30deg, var(--sx-surface) 30deg 45deg)`
                  : s.kind === 1
                    ? `radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--sx-surface) 70%, transparent) 0 14%, transparent 15%), ${tone(s.tone)}`
                    : `repeating-linear-gradient(45deg, ${tone(s.tone)} 0 10px, var(--sx-surface) 10px 16px)`,
            }}
          />
        ))}
      </div>
    </Sec>
  );
}

/* ---------------------------------------------------------------------------------------------------------------- */

const SIGN = "Come up to the hills.".split(" ");
const LINKS = [
  { t: "Stay", l: ["Estate bungalow", "Planter's cottages", "Long stays"] },
  { t: "Coffee", l: ["Estate walks", "Roastery table", "Buy our beans"] },
  { t: "House", l: ["Our story", "Journal", "Gift a stay"] },
];

/** FO11 · Full-screen photo footer: the footer is the whole viewport, a full-bleed photo under a dark overlay, a big
 *  sign-off line centred (its words light up one by one), link columns and legal in a bar along the bottom. Motion M13. */
function FO11() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M13");
  const [lit, setLit] = useState(SIGN.length);
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    let t: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (e.isIntersecting) {
        setLit(0);
        // light one word every 380 ms, hold the full line, then start again
        t = setInterval(() => setLit((v) => (v >= SIGN.length + 3 ? 0 : v + 1)), 380);
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, []);

  return (
    <Sec innerRef={r} theme="ink" font="serif" full>
      <footer className="relative flex h-[clamp(680px,100svh,1080px)] flex-col">
        <div className="absolute inset-0 fx-pan">
          <div className="fx-drift absolute inset-0">
            <Pic i={2} ratio="auto" round={false} label="" className="absolute inset-0 h-full w-full" />
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(7,9,15,.55),rgba(7,9,15,.35)_45%,rgba(7,9,15,.9))]" />

        <div className="relative flex flex-1 flex-col items-center justify-center px-6 text-center">
          <H className="max-w-[14ch] text-[clamp(56px,8vw,140px)] font-[500] text-white">
            {SIGN.map((w, k) => (
              <span key={k} style={{ opacity: k < lit ? 1 : 0.28, transition: "opacity .5s ease" }}>
                {w}{" "}
              </span>
            ))}
          </H>
          <P className="mt-6 max-w-[44ch] text-white/75">A coffee-estate stay in Coorg. Six rooms, mist at breakfast, beans roasted on the verandah. From ₹14,500 a night.</P>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Btn>Plan a stay</Btn>
            <Btn kind="ghost" className="border-white/30! text-white!">
              Ask about dates
            </Btn>
          </div>
        </div>

        <div className="relative border-t border-white/15 bg-[rgba(7,9,15,.45)] px-[clamp(20px,5vw,96px)] py-[clamp(24px,3vw,40px)] backdrop-blur-md">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
            <div className="md:col-span-4">
              <p className="sx-display text-[clamp(26px,2.2vw,34px)] text-white">Halli House</p>
              <p className="mt-2 max-w-[30ch] text-[14px] text-white/60">Letters from the estate at harvest and monsoon. Nothing in between.</p>
            </div>
            <div className="grid grid-cols-3 gap-6 md:col-span-6 md:col-start-7">
              {LINKS.map((c) => (
                <div key={c.t}>
                  <p className="text-[12px] uppercase tracking-[0.16em] text-white/50">{c.t}</p>
                  <ul className="mt-3 space-y-2 text-[15px] text-white/85">
                    {c.l.map((l) => (
                      <li key={l}>
                        <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white">
                          {l}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5 text-[13px] text-white/50">
            <span>© 2026 Halli House · Concept website by Showreel Studio · sample prices</span>
            <span>Instagram · Journal · Press kit</span>
          </div>
        </div>
      </footer>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "FO10", name: "Physics pile footer", motion: "M12", C: FO10 },
  { code: "FO11", name: "Full-screen photo footer", motion: "M13", C: FO11 },
];
