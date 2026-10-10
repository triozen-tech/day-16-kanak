"use client";

// Shared by record mode and loaders: "&at=HH:MM[:SS]" = start at that time on this device's clock.

/** Today's date at "HH:MM" / "HH:MM:SS" (local time), or null if missing/invalid. */
export function parseAt(at: string | null | undefined): Date | null {
  const parts = at?.split(":").map(Number);
  if (!parts || parts.length < 2 || parts.some(Number.isNaN)) return null;
  const d = new Date();
  d.setHours(parts[0], parts[1], parts[2] ?? 0, 0);
  return d;
}

/** The target from ?at= in the URL (null when absent). */
export const atFromUrl = () => parseAt(new URLSearchParams(window.location.search).get("at"));

/** Calls fn on the first animation frame at/after `target` (immediately if it has passed). Returns cancel. */
export function waitForClock(target: Date | null, fn: () => void) {
  let raf = 0;
  const check = () => {
    if (!target || Date.now() >= target.getTime()) fn();
    else raf = requestAnimationFrame(check);
  };
  check();
  return () => cancelAnimationFrame(raf);
}
