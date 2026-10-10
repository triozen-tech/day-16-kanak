"""Paint out the Gemini ✦ sparkle mark (bottom right of Nano Banana stills).

RUN (from the repo root): python3 scripts/clean_mark.py <image.jpg> <cx,cy,r> [<cx,cy,r> ...] [--backup-dir raw/_orig]
  Keeps a backup (once): <image>-raw.jpg next to it, or <backup-dir>/<image> with --backup-dir; then fills each circle with the smooth colour of its surroundings
  (normalised blur, the mark itself excluded) plus fine texture borrowed from a patch 140 px to the left, feathered.
  Usual spots on a 2752×1536 still: big star 2557,1341,62 · small star 2641,1423,34.
Needs numpy + Pillow only."""
import shutil, sys
from pathlib import Path
import numpy as np
from PIL import Image

def _box(a, k, axis):
    pad = k // 2; w = [(0, 0)] * a.ndim; w[axis] = (pad + 1, pad)
    c = np.cumsum(np.pad(a, w, mode="edge"), axis=axis, dtype=np.float64)
    return ((np.take(c, np.arange(k, c.shape[axis]), axis=axis) - np.take(c, np.arange(0, c.shape[axis] - k), axis=axis)) / k).astype(np.float32)

def blur(a, s):
    k = max(1, int(round(np.sqrt(4 * s * s + 1)))) | 1
    for ax in (0, 1):
        for _ in range(3):
            a = _box(a, k, ax)
    return a

args = sys.argv[1:]
backup_dir = None
if "--backup-dir" in args:
    i = args.index("--backup-dir")
    backup_dir = Path(args[i + 1])
    del args[i : i + 2]
path = Path(args[0])
spots = args[1:]
if backup_dir:
    backup_dir.mkdir(parents=True, exist_ok=True)
    backup = backup_dir / path.name
else:
    backup = path.with_name(path.stem + "-raw" + path.suffix)
if not backup.exists():
    shutil.copy(path, backup)
src = np.asarray(Image.open(backup).convert("RGB")).astype(np.float32) / 255
H, W, _ = src.shape
yy, xx = np.mgrid[0:H, 0:W]
mark = np.zeros((H, W), np.float32)
for spec in spots:
    cx, cy, r = (float(v) for v in spec.split(","))
    mark = np.maximum(mark, ((xx - cx) ** 2 + (yy - cy) ** 2 <= r * r).astype(np.float32))
keep = 1 - mark
smooth = blur(src * keep[..., None], 30) / np.maximum(blur(keep, 30), 1e-4)[..., None]
shifted = np.roll(src, 140, axis=1)                       # texture from 140 px to the left
texture = shifted - blur(shifted, 4)
fill = smooth + texture * 0.8
feather = np.clip(blur(mark, 5) * 1.6, 0, 1)[..., None]
out = src * (1 - feather) + fill * feather
Image.fromarray(np.clip(out * 255 + 0.5, 0, 255).astype(np.uint8)).save(path, quality=95, subsampling=0)
print(f"cleaned {path} ({len(spots)} spot(s)), original kept as {backup}")
