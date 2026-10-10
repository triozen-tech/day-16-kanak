"use client";
// A calm magnetic pull (no elastic bounce, house style): the element leans a little toward the pointer while it is
// over it and eases back when it leaves. The record cursor sends real pointer events, so it plays on camera too.
import { useEffect, type RefObject } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

export function useMagnetic(
  ref: RefObject<HTMLElement | null>,
  strength = 0.18,
  max = 6,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
    const move = (e: PointerEvent | MouseEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2 - Number(gsap.getProperty(el, "x"));
      const cy = r.top + r.height / 2 - Number(gsap.getProperty(el, "y"));
      // capped, so it never touches its neighbours (the ♡ button sits 10 px away)
      const clamp = (v: number) => Math.max(-max, Math.min(max, v));
      xTo(clamp((e.clientX - cx) * strength));
      yTo(clamp((e.clientY - cy) * strength));
    };
    const leave = () => {
      xTo(0);
      yTo(0);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("mouseleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("mouseleave", leave);
    };
  }, [ref, strength, max]);
}
