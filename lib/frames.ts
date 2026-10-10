"use client";

// Loads an image sequence made by `npm run frames`.
// Folder layout: /public/frames/<name>/frame_0001.webp … + manifest.json

export type FrameManifest = {
  count: number;
  ext: string;
  width: number;
  height: number;
  pad: number;
  prefix: string;
};

export async function getManifest(folder: string): Promise<FrameManifest> {
  const res = await fetch(`${folder.replace(/\/$/, "")}/manifest.json`, { cache: "force-cache" });
  if (!res.ok) throw new Error(`No manifest.json in ${folder}. Run: npm run frames -- <video> ${folder.replace(/^\//, "")}`);
  return res.json();
}

export function frameUrl(folder: string, m: FrameManifest, i: number) {
  return `${folder.replace(/\/$/, "")}/${m.prefix}${String(i + 1).padStart(m.pad, "0")}.${m.ext}`;
}

/**
 * Loads frames in a smart order: first frame, then every 8th (so scrubbing
 * works early at low detail), then fills the gaps.
 */
export function loadFrames(
  folder: string,
  m: FrameManifest,
  onProgress: (loaded: number, total: number) => void,
) {
  const images: (HTMLImageElement | undefined)[] = new Array(m.count);
  let loaded = 0;
  let cancelled = false;

  const order: number[] = [];
  const seen = new Set<number>();
  const push = (i: number) => {
    if (i >= 0 && i < m.count && !seen.has(i)) {
      seen.add(i);
      order.push(i);
    }
  };
  push(0);
  for (const step of [8, 4, 2, 1]) for (let i = 0; i < m.count; i += step) push(i);

  const CONCURRENCY = 6;
  let cursor = 0;

  const next = () => {
    if (cancelled || cursor >= order.length) return;
    const i = order[cursor++];
    const img = new Image();
    img.decoding = "async";
    img.onload = img.onerror = () => {
      if (cancelled) return;
      if (img.naturalWidth) images[i] = img;
      loaded++;
      onProgress(loaded, m.count);
      next();
    };
    img.src = frameUrl(folder, m, i);
  };
  for (let c = 0; c < CONCURRENCY; c++) next();

  return {
    images,
    /** Nearest loaded frame to i (so scrolling never shows a blank). */
    get(i: number) {
      if (images[i]) return images[i];
      for (let d = 1; d < m.count; d++) {
        if (images[i - d]) return images[i - d];
        if (images[i + d]) return images[i + d];
      }
      return undefined;
    },
    cancel() {
      cancelled = true;
    },
  };
}

/** Draws an image into a canvas like CSS object-fit (cover/contain). */
export function drawFit(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number,
  fit: "cover" | "contain" = "cover",
) {
  const ir = img.naturalWidth / img.naturalHeight;
  const cr = w / h;
  let dw = w;
  let dh = h;
  if (fit === "cover" ? cr > ir : cr < ir) {
    dw = w;
    dh = w / ir;
  } else {
    dh = h;
    dw = h * ir;
  }
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}
