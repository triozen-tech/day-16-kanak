"use client";

// F1 · Waypoint travel, PNG version (lightest): one transparent product image (+ more angles crossfaded by `turn`)
// travels from anchor to anchor. A real site passes its own cut-outs (front, 3/4, side, back) or a turntable's
// transparent frames (`angles` = N images going once round) from `npm run cutout`.
import { useRef } from "react";
import { productAngle } from "./art";
import { ShadowGlow, type LayerProps } from "./TravelPage";
import { idle, useTravel } from "./useTravel";

const DEFAULT = [0, 1, 2, 3].map((i) => productAngle(i));

export default function ObjectPNG({ page, angles = DEFAULT }: LayerProps & { angles?: string[] }) {
  const box = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  useTravel(page, (s, t) => {
    const el = box.current;
    if (!el) return;
    const f = idle(t);
    const tr = `translate(${(s.x - s.w / 2).toFixed(1)}px, ${(s.y - s.h / 2 + f.dy).toFixed(1)}px)`;
    el.style.width = `${s.w}px`;
    el.style.height = `${s.h}px`;
    el.style.transform = `${tr} rotate(${(s.rot + f.rot).toFixed(2)}deg)`;
    if (glow.current) {
      glow.current.style.width = `${s.w}px`;
      glow.current.style.height = `${s.h}px`;
      glow.current.style.transform = tr;
    }
    // angle crossfade: turn 0..1 = 0..360° spread over the N images (4 views, or a whole turntable of transparent
    // frames from `npm run cutout`, e.g. 36 = one every 10°), nearest two blended
    const turn = (((s.turn + f.turn) % 1) + 1) % 1;
    const imgs = el.children as HTMLCollectionOf<HTMLElement>;
    const n = imgs.length;
    const pos = turn * n;
    for (let i = 0; i < n; i++) {
      const d = Math.min(Math.abs(pos - i), n - Math.abs(pos - i)); // circular distance
      imgs[i].style.opacity = String(Math.max(0, 1 - d));
    }
  });
  return (
    <>
      <ShadowGlow refEl={glow} />
      <div ref={box} className="absolute left-0 top-0 will-change-transform" style={{ width: 0, height: 0 }}>
        {angles.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={src} alt="" className="absolute inset-0 h-full w-full object-contain" style={{ opacity: i ? 0 : 1 }} />
        ))}
      </div>
    </>
  );
}
