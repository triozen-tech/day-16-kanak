"use client";
// The nav's Bag, kept on screen once the hero (and its card nav) has scrolled away: a small fixed ivory pill, top
// right. Add to bag flies the piece into it (`flyToBag`); it hears "kj:add" from any Add to bag (lesson 120) and bumps 0 → 1 as the piece
// lands. Hidden over the hero, where the card nav shows its own Bag. ?static=1: no flight, count 0.
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

type Pt = { x: number; y: number };
/** Catmull-Rom through the points (passes through every one, no overshoot to speak of at these spacings). */
function along(pts: Pt[], u: number): Pt {
  const n = pts.length - 1;
  const f = Math.min(n - 1e-6, u * n);
  const i = Math.floor(f);
  const t = f - i;
  const p0 = pts[Math.max(0, i - 1)],
    p1 = pts[i],
    p2 = pts[i + 1],
    p3 = pts[Math.min(n, i + 2)];
  const c = (a: number, b: number, c2: number, d: number) =>
    0.5 *
    (2 * b +
      (-a + c2) * t +
      (2 * a - 5 * b + 4 * c2 - d) * t * t +
      (-a + 3 * b - 3 * c2 + d) * t * t * t);
  return { x: c(p0.x, p1.x, p2.x, p3.x), y: c(p0.y, p1.y, p2.y, p3.y) };
}

/**
 * Flies a small copy of the piece from `start` through `via` (viewport points, routed through empty space by the
 * caller: lesson 99) into the Bag pill, then calls onLand (the count bumps there).
 */
export function flyToBag(
  start: Pt,
  via: Pt[],
  src: string,
  onLand: () => void,
) {
  const target = document.querySelector<HTMLElement>("[data-bag-pill]");
  if (!target || prefersReducedMotion()) return onLand();
  const b = target.getBoundingClientRect();
  const size = 112;
  const pts = [start, ...via, { x: b.right - 32, y: b.top + b.height / 2 }];
  // a round ivory token with a gold rim holding the piece: it reads as "this piece" over the necklace itself
  const img = document.createElement("div");
  img.innerHTML = `<img src="${src}" alt="" style="width:100%;height:100%;object-fit:contain;padding:10%" />`;
  Object.assign(img.style, {
    position: "fixed",
    left: `${-size / 2}px`,
    top: `${-size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "50%",
    background: "radial-gradient(circle at 40% 35%, #fffaf0, #f1e4cb)",
    boxShadow:
      "0 0 0 2px #c9a04a, 0 16px 30px rgba(90,60,20,.35), 0 0 24px rgba(255,226,160,.6)",
    zIndex: "90",
    pointerEvents: "none",
  });
  document.body.appendChild(img);
  const end = 46 / size;
  const t = { v: 0 };
  gsap.to(t, {
    v: 1,
    duration: 1.05,
    ease: "power1.inOut",
    onUpdate: () => {
      const u = t.v;
      const p = along(pts, u);
      const pop = Math.min(1, u / 0.12); // pops off the piece, shrinks early (small before it reaches the headings)
      const sc =
        (0.5 + 0.5 * pop) * (end + (1 - end) * Math.max(0, 1 - u / 0.45) ** 2);
      img.style.transform = `translate(${p.x}px, ${p.y}px) scale(${sc}) rotate(${u * 12}deg)`;
      img.style.opacity = String(u > 0.94 ? (1 - u) / 0.06 : 1);
    },
    onComplete: () => {
      img.remove();
      onLand();
    },
  });
}

export default function BagPill() {
  const [count, setCount] = useState(0);
  const [shown, setShown] = useState(false);
  const pill = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const onScroll = () => {
      // shown once the hero pin (zoom + melt) is over, where the card nav with its own Bag has gone
      const pin = document.querySelector<HTMLElement>("[data-hero-pin]");
      const end = pin
        ? pin.offsetHeight - window.innerHeight
        : window.innerHeight;
      setShown(window.scrollY > end * 0.97);
    };
    const onBag = () => {
      setCount((c) => c + 1);
      if (pill.current && !prefersReducedMotion())
        gsap.fromTo(
          pill.current,
          { scale: 1.22 },
          { scale: 1, duration: 0.6, ease: "power3.out" },
        );
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("kj:add", onBag);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("kj:add", onBag);
    };
  }, []);

  return (
    <a
      ref={pill}
      href="#piece"
      className="fixed right-8 top-6 z-[60] flex items-center gap-3.5 rounded-full bg-[rgba(251,247,240,.94)] py-2.5 pl-6 pr-2.5 text-[18px] font-semibold shadow-[0_0_0_1px_var(--kj-line),0_12px_30px_rgba(90,62,22,.12)] transition-[opacity,translate] duration-500"
      style={{
        opacity: shown ? 1 : 0,
        translate: shown ? "0 0" : "0 -14px",
        pointerEvents: shown ? "auto" : "none",
      }}
      data-bag-pill
    >
      Bag
      <span className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-[var(--ink)] text-[20px] font-semibold text-[var(--paper)]">
        {/* the digit rolls up: the old one leaves, the new one arrives (digits only, lesson 85) */}
        {[count - 1, count].map((n) =>
          n < 0 ? null : (
            <span
              key={n}
              className="kj-num absolute"
              style={{
                animation:
                  n === count && count > 0
                    ? "kj-roll-in 0.45s cubic-bezier(.22,1,.36,1) both"
                    : n < count
                      ? "kj-roll-out 0.3s ease-in both"
                      : undefined,
              }}
            >
              {n}
            </span>
          ),
        )}
      </span>
    </a>
  );
}
