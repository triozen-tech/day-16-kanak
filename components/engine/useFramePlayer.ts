"use client";

import { useEffect, useRef } from "react";
import { drawFit, getManifest, loadFrames, type FrameManifest } from "@/lib/frames";
import { loading } from "@/lib/loading";

/**
 * Draws an image sequence into a canvas. Call `seek(0..1)` to pick the frame.
 * If `blockLoader` is true, the intro loader waits for the first ~30 frames.
 */
export function useFramePlayer(
  folder: string,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  { fit = "cover", blockLoader = false }: { fit?: "cover" | "contain"; blockLoader?: boolean } = {},
) {
  const progress = useRef(0);
  const api = useRef<{ seek: (p: number) => void }>({ seek: (p) => (progress.current = p) });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const taskId = `frames:${folder}`;
    if (blockLoader) loading.register(taskId);

    let manifest: FrameManifest | null = null;
    let player: ReturnType<typeof loadFrames> | null = null;
    let lastDrawn = -1;
    let lastImg: HTMLImageElement | undefined;
    let raf = 0;
    let dirty = true;
    let cancelled = false;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      dirty = true;
    };

    const render = () => {
      raf = requestAnimationFrame(render);
      if (!manifest || !player) return;
      const idx = Math.round(Math.min(1, Math.max(0, progress.current)) * (manifest.count - 1));
      const img = player.get(idx);
      if (!img) return;
      if (!dirty && idx === lastDrawn && img === lastImg) return;
      drawFit(ctx, img, canvas.width, canvas.height, fit);
      lastDrawn = idx;
      lastImg = img;
      dirty = false;
    };

    api.current.seek = (p: number) => {
      progress.current = p;
    };

    getManifest(folder)
      .then((m) => {
        if (cancelled) return;
        manifest = m;
        const needed = Math.min(30, m.count);
        player = loadFrames(folder, m, (loaded) => {
          if (blockLoader) loading.update(taskId, loaded / needed);
          dirty = true;
        });
      })
      .catch((err) => {
        console.warn(err.message);
        if (blockLoader) loading.update(taskId, 1);
      });

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    raf = requestAnimationFrame(render);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      player?.cancel();
    };
  }, [folder, canvasRef, fit, blockLoader]);

  return api;
}
