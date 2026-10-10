"use client";

// F6 · Simple 3D orbit with Google <model-viewer> (Apache-2.0): the element sits on the travel driver's box and its
// `camera-orbit` follows the turn/tilt. Least code of the 3D versions, but the heaviest download (~289 KB gzip, it
// bundles three.js), so use it for one quick product-spin section, not as a site's only 3D. Loaded on its own page only.
// Fallback: the PNG version (F1) until it is ready, and if it fails.
import { createElement, useEffect, useRef, useState } from "react";
import ObjectPNG from "./ObjectPNG";
import { DEMO_MODEL_OGL } from "./art";
import { ShadowGlow, type LayerProps } from "./TravelPage";
import { idle, useTravel } from "./useTravel";

// plain-geometry model: <model-viewer> would otherwise fetch its Meshopt decoder from a CDN
export default function ObjectModelViewer({ page, url = DEMO_MODEL_OGL }: LayerProps & { url?: string }) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const mv = useRef<HTMLElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  useEffect(() => {
    import("@google/model-viewer").then(() => setReady(true)).catch(() => setFailed(true));
  }, []);
  useTravel(page, (s, t) => {
    const f = idle(t);
    const tr = `translate(${(s.x - s.w / 2).toFixed(1)}px, ${(s.y - s.h / 2 + f.dy).toFixed(1)}px)`;
    for (const el of [box.current, glow.current]) {
      if (!el) continue;
      el.style.width = `${s.w}px`;
      el.style.height = `${s.h}px`;
    }
    if (glow.current) glow.current.style.transform = tr;
    if (box.current) box.current.style.transform = `${tr} rotate(${(s.rot + f.rot).toFixed(2)}deg)`;
    // the camera orbits the model: theta = turn, phi = 75° minus the tilt (radius auto)
    mv.current?.setAttribute("camera-orbit", `${(-(s.turn + f.turn) * 360).toFixed(1)}deg ${(75 - s.tilt).toFixed(1)}deg 105%`);
  });
  if (failed) return <ObjectPNG page={page} />;
  return (
    <>
      <ShadowGlow refEl={glow} />
      <div ref={box} className="absolute left-0 top-0 will-change-transform">
        {ready &&
          createElement("model-viewer", {
            ref: mv,
            src: url,
            alt: "Product",
            "interaction-prompt": "none",
            "disable-zoom": "",
            "disable-pan": "",
            "interpolation-decay": "40",
            exposure: "1.1",
            "environment-image": "neutral",
            "shadow-intensity": "0",
            "field-of-view": "26deg",
            style: { width: "100%", height: "100%", background: "transparent", ["--poster-color" as string]: "transparent" },
            onError: () => setFailed(true),
          })}
      </div>
      {!ready && <ObjectPNG page={page} />}
    </>
  );
}
