"use client";
// A number that rolls to its new value (counts smoothly, 0.8 s) instead of jumping: the karat switch rolls weight,
// rate, gold value, making, GST and total together. Continuous, never stepped (lesson 10). ?static=1: jumps.
import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

export default function Roll({
  value,
  format,
}: {
  value: number;
  format: (v: number) => string;
}) {
  const el = useRef<HTMLSpanElement>(null);
  const shown = useRef(value);
  const fmt = useRef(format);
  fmt.current = format;

  useEffect(() => {
    const node = el.current;
    if (!node || shown.current === value) return;
    if (prefersReducedMotion()) {
      shown.current = value;
      node.textContent = fmt.current(value);
      return;
    }
    const o = { v: shown.current };
    const tw = gsap.to(o, {
      v: value,
      duration: 0.8,
      ease: "power2.inOut",
      onUpdate: () => {
        shown.current = o.v;
        node.textContent = fmt.current(o.v);
      },
    });
    // a soft gold flash on the number while it rolls
    gsap.fromTo(
      node,
      { color: "#a87a2a" },
      {
        color: "inherit",
        duration: 1.1,
        ease: "power2.in",
        clearProps: "color",
      },
    );
    return () => {
      tw.kill();
    };
  }, [value]);

  return (
    <span ref={el} className="kj-num">
      {format(value)}
    </span>
  );
}
