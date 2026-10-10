#!/usr/bin/env python3
"""
Instagram cover safe-area check for a 9:16 Reel cover (skill: cover-check).

  python3 scripts/cover-check.py cover.jpg                 → cover-safe.jpg (overlay) + a report
  python3 scripts/cover-check.py cover.jpg --fit           → also cover-fit.jpg: content moved into the safe box,
                                                              on a background that matches the cover's own
  python3 scripts/cover-check.py cover.jpg --box x0,y0,x1,y1   check a known text/product box (fractions 0–1)

Zones (fractions of a 1080×1920 cover; Instagram changes its UI now and then, so these keep a little margin):
  - profile grid crop 3:4 → only the middle 1080×1440 shows: 12.5% cut top and bottom (≈13%)
  - Reels header (account, "Reels", camera)          top 0–14%
  - Reels caption + audio + buttons                    bottom 75–100%
  - right-hand icon column (like, comment, share …)   x 86–100%, y 45–92%
  - SAFE box (inside all of the above)                 x 6–84%, y 15–72%
  - text rule (ours): headline text 15–40% from the top
The report finds the content (pixels that differ from the cover's background colour) and says what is outside.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter  # noqa: F401 (ImageFilter for the soft edge)

SAFE = (0.06, 0.15, 0.84, 0.72)
TEXT = (0.15, 0.40)
GRID = 0.125


def background(a):
    """Median colour of the outer 3% border = the cover's background."""
    h, w, _ = a.shape
    b = max(4, int(min(h, w) * 0.03))
    edge = np.concatenate([a[:b].reshape(-1, 3), a[-b:].reshape(-1, 3), a[:, :b].reshape(-1, 3), a[:, -b:].reshape(-1, 3)])
    return np.median(edge, axis=0)


def content_box(a, bg):
    """Bounding box (fractions) of pixels clearly different from the background."""
    h, w, _ = a.shape
    d = np.abs(a.astype(np.float32) - bg).sum(2)
    mask = d > 60
    ys, xs = np.where(mask)
    if len(xs) < 50:
        return None
    x0, x1 = np.percentile(xs, [0.5, 99.5]) / w
    y0, y1 = np.percentile(ys, [0.5, 99.5]) / h
    return float(x0), float(y0), float(x1), float(y1)


def overlay(im, box):
    w, h = im.size
    o = Image.new("RGBA", im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(o)
    red, orange, green, blue = (255, 40, 40, 90), (255, 150, 0, 80), (60, 255, 120, 255), (60, 160, 255, 255)
    d.rectangle([0, 0, w, h * GRID], fill=red)
    d.rectangle([0, h * (1 - GRID), w, h], fill=red)
    d.rectangle([0, 0, w, h * 0.14], fill=orange)
    d.rectangle([0, h * 0.75, w, h], fill=orange)
    d.rectangle([w * 0.86, h * 0.45, w, h * 0.92], fill=orange)
    x0, y0, x1, y1 = SAFE
    d.rectangle([w * x0, h * y0, w * x1, h * y1], outline=green, width=max(3, w // 270))
    d.line([0, h * TEXT[0], w, h * TEXT[0]], fill=blue, width=max(2, w // 400))
    d.line([0, h * TEXT[1], w, h * TEXT[1]], fill=blue, width=max(2, w // 400))
    if box:
        bx0, by0, bx1, by1 = box
        d.rectangle([w * bx0, h * by0, w * bx1, h * by1], outline=(255, 255, 255, 255), width=max(2, w // 400))
    return Image.alpha_composite(im.convert("RGBA"), o).convert("RGB")


def fit(im, box, bg):
    """Scale + move the content box into the safe box, on a background made from the cover itself (blurred, dimmed)."""
    w, h = im.size
    bx0, by0, bx1, by1 = box
    sx0, sy0, sx1, sy1 = SAFE
    k = min((sx1 - sx0) / (bx1 - bx0), (sy1 - sy0) / (by1 - by0), 1.0) * 0.96
    nw, nh = round(w * k), round(h * k)
    small = im.resize((nw, nh), Image.LANCZOS)
    # matching background: a vertical gradient between the cover's own top-edge and bottom-edge colours
    # (never a blurred copy of the cover, which would leave a ghost of the product behind)
    a = np.asarray(im).astype(np.float32)
    band = max(4, h // 40)
    top = np.median(a[:band].reshape(-1, 3), axis=0)
    bot = np.median(a[-band:].reshape(-1, 3), axis=0)
    t = np.linspace(0, 1, h, dtype=np.float32)[:, None, None]
    grad = (top * (1 - t) + bot * t) * np.ones((1, w, 1), dtype=np.float32)
    base = Image.fromarray(grad.clip(0, 255).astype(np.uint8))
    # place so the content's centre lands on the safe box's centre
    cx = ((bx0 + bx1) / 2) * nw
    cy = ((by0 + by1) / 2) * nh
    tx = (sx0 + sx1) / 2 * w - cx
    ty = (sy0 + sy1) / 2 * h - cy
    # soft edge so the moved picture melts into the background
    m = Image.new("L", (nw, nh), 255).filter(ImageFilter.GaussianBlur(1))
    edge = max(8, nw // 24)
    md = ImageDraw.Draw(m)
    for i in range(edge):
        md.rectangle([i, i, nw - 1 - i, nh - 1 - i], outline=int(255 * i / edge))
    base.paste(small, (round(tx), round(ty)), m)
    return base


def main():
    args = sys.argv[1:]
    if not args:
        sys.exit(__doc__)
    src = Path(args[0])
    im = Image.open(src).convert("RGB")
    w, h = im.size
    ratio = h / w
    a = np.asarray(im)
    bg = background(a)
    box = None
    if "--box" in args:
        box = tuple(float(v) for v in args[args.index("--box") + 1].split(","))
    else:
        box = content_box(a, bg)
    out = src.with_name(src.stem + "-safe.jpg")
    overlay(im, box).save(out, quality=90)
    print(f"cover: {src.name} {w}×{h} (ratio {ratio:.3f}, 9:16 = 1.778){'  ⚠ not 9:16' if abs(ratio - 16 / 9) > 0.02 else ''}")
    print(f"overlay: {out}")
    if not box:
        print("content: could not find content different from the background; pass --box x0,y0,x1,y1")
        return
    bx0, by0, bx1, by1 = box
    print(f"content box: x {bx0:.0%}–{bx1:.0%}, y {by0:.0%}–{by1:.0%}")
    issues = []
    if by0 < GRID or by1 > 1 - GRID:
        issues.append("cut by the 3:4 profile-grid crop (top/bottom 12.5%)")
    if by0 < 0.14:
        issues.append("under the Reels header (top 14%)")
    if by1 > 0.75:
        issues.append("under the caption/buttons (bottom 25%)")
    if bx1 > 0.86 and by1 > 0.45:
        issues.append("under the right-hand icons")
    if bx0 < SAFE[0] or bx1 > SAFE[2] or by0 < SAFE[1] or by1 > SAFE[3]:
        issues.append(f"outside the safe box (x {SAFE[0]:.0%}–{SAFE[2]:.0%}, y {SAFE[1]:.0%}–{SAFE[3]:.0%})")
    print("OK: everything is inside the safe area" if not issues else "OUTSIDE:\n  - " + "\n  - ".join(issues))
    print(f"text rule: headline text should sit {TEXT[0]:.0%}–{TEXT[1]:.0%} from the top (blue lines). Check it on the overlay.")
    if "--fit" in args and issues:
        f = src.with_name(src.stem + "-fit.jpg")
        fit(im, box, bg).save(f, quality=92)
        print(f"fitted: {f} (content scaled/moved into the safe box on a matching background)")


if __name__ == "__main__":
    main()
