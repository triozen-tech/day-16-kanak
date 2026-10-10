"use client";
// Decodes every page image once, right after load, so a section's first appearance on camera never waits for image
// decoding (the clock's 12 pieces stalled the recorder ~0.4 s as the pin arrived).
import { useEffect } from "react";

export default function Predecode() {
  useEffect(() => {
    let stop = false;
    const run = async () => {
      for (const img of Array.from(document.images)) {
        if (stop) return;
        try {
          await img.decode();
        } catch {}
      }
    };
    run();
    return () => {
      stop = true;
    };
  }, []);
  return null;
}
