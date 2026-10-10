#!/usr/bin/env python3
"""
Kit frame pipeline: raw Veo/AI video → scroll-video frames that play by VIDEO TIME (skill: video-frames).
(The older `npm run frames` = scripts/video-to-frames.mjs makes evenly spaced frames; use this one for scroll films.)

  python3 scripts/make_frames.py [clip …] [--phone-only]       clips come from site/frames.json (default: all)

site/frames.json (one per site):
  {
    "slug": "brand",                       → public/frames/<slug>-<clip>[-m]
    "background": "#05080f",               page colour: the video's near-black is graded onto it (no box edge)
    "delogo": "delogo=x=1852:y=1032:w=56:h=32",   Veo watermark (bottom right of 1920×1080); "" to skip
    "clips": {
      "hero": {
        "src": "hero.mp4", "start": 0, "end": 6,          seconds of raw/<src> to use (prefer early seconds)
        "segs": [[0, 3, 16], [3, 6, 24]],                  [t0, t1, fps]: double density (24–48) in slow/key parts
        "desk": [1600, 6.0], "phone": [540, 3.2],          [width px, MB budget] (≤ 12 MB desktop, ≤ 6 MB phone)
        "phone_cx": [[0, 960]] | "track",                 phone crop centre (x of 1920) over time, or follow the subject
        "phone_crop": 720,                                 720 = 2:3 crop, 1080 = square
        "shrink": 0.9,                                     optional: shrink the frame with a soft fade (headroom)
        "grade": true                                      map near-black onto "background"
      },
      "flavours": { "join": [{"src": "a.mp4", "start": 0, "end": 4}, {"src": "b.mp4", "start": 0, "end": 4}],
                    "crossfade": 0.333, "segs": [...], "desk": [...], "phone": [...], "phone_cx": [[0, 958]] }
    }
  }

For every clip: ffmpeg trims, paints out the watermark and motion-interpolates to 48 fps (temp JPEGs, deleted at the
end) → frames are picked by video time per segment → graded onto the page colour → WebP desktop + phone at the best
quality that fits the budget → manifest.json with "times" (the video second of every frame). Play them with
lib/film.ts + components/patterns/FilmPin.tsx (scroll → video time, neighbour frames blended, lazy loading).
"""
import io, json, os, shutil, subprocess, sys, tempfile
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "raw"
OUT = ROOT / "public" / "frames"
CONFIG = Path(os.environ.get("FRAMES_CONFIG", ROOT / "site" / "frames.json"))
CFG = json.loads(CONFIG.read_text()) if CONFIG.exists() else {"slug": "site", "clips": {}}
SLUG = CFG.get("slug", "site")
TMP = Path(os.environ.get("FRAMES_TMP", tempfile.gettempdir())) / f"{SLUG}-frames"
_bg = CFG.get("background", "#000000").lstrip("#")
BG = np.array([int(_bg[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.float32)
SRC_FPS = 48
DELOGO = CFG.get("delogo", "delogo=x=1852:y=1032:w=56:h=32")
CLIPS = CFG.get("clips", {})


def sh(*args):
    subprocess.run(args, check=True)


def extract(src, start, end, name):
    """Source → 48 fps PNGs (interpolated), watermark painted out. Cached in TMP/<name>."""
    d = TMP / name
    if d.exists() and any(d.iterdir()):
        return d
    d.mkdir(parents=True, exist_ok=True)
    mi = f"minterpolate=fps={SRC_FPS}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1"
    vf = f"{DELOGO},{mi}" if DELOGO else mi
    sh("ffmpeg", "-v", "error", "-y", "-ss", str(start), "-to", str(end), "-i", str(RAW / src), "-vf", vf,
       "-q:v", "2", str(d / "f_%04d.jpg"))
    return d


def frame_times(segs):
    ts = []
    for t0, t1, fps in segs:
        n = max(1, round((t1 - t0) * fps))
        ts += [t0 + i * (t1 - t0) / n for i in range(n)]
    ts.append(segs[-1][1])
    return ts


def grade(a):
    """Near-black → page background: crush the noise floor a little, then lift so 0 lands exactly on BG."""
    a = np.clip((a - 4.0) * (255.0 / 251.0), 0, 255)
    return BG + a * (255.0 - BG) / 255.0


def load(path):
    return np.asarray(Image.open(path).convert("RGB"), dtype=np.float32)


def build_join(c):
    """Two clips joined with a cross-fade: c["join"] = [{src,start,end}, {src,start,end}], c["crossfade"] seconds."""
    (p, q) = c["join"]
    d1 = extract(p["src"], p["start"], p["end"], f"{c['_name']}-a")
    d2 = extract(q["src"], q["start"], q["end"], f"{c['_name']}-b")
    f1, f2 = sorted(d1.iterdir()), sorted(d2.iterdir())
    xf = c.get("crossfade", 1 / 3)
    join = (p["end"] - p["start"]) - xf

    def at(files, t):
        return load(files[min(len(files) - 1, max(0, round(t * SRC_FPS)))])

    def get(T):
        if T < join:
            return at(f1, T)
        if T < join + xf:
            x = (T - join) / xf
            x = x * x * (3 - 2 * x)
            return at(f1, T) * (1 - x) + at(f2, T - join) * x
        return at(f2, T - join)

    return get


def build_simple(c, name):
    d = extract(c["src"], c["start"], c["end"], name)
    files = sorted(d.iterdir())
    shrink = c.get("shrink")

    def get(t):
        a = load(files[min(len(files) - 1, round(t * SRC_FPS))])
        if shrink:
            h, w, _ = a.shape
            im = Image.fromarray(a.astype(np.uint8)).resize((round(w * shrink), round(h * shrink)), Image.LANCZOS)
            small = np.asarray(im, dtype=np.float32)
            # wide, smooth fade of the shrunk frame into black : splash, fruit and
            # mist dissolve long before the frame edge, so no box line can ever show
            sh_, sw, _ = small.shape
            def ramp(n, f0, f1):
                i = np.arange(n, dtype=np.float32)
                x = np.minimum(i / (n * f0), (n - 1 - i) / (n * f1))
                x = np.clip(x, 0, 1)
                return (x * x * (3 - 2 * x)) ** 1.6
            # top 28% (fruit enters through the source's top edge), bottom 18%, sides 14%
            m = np.outer(ramp(sh_, 0.28, 0.18), ramp(sw, 0.14, 0.14))[..., None]
            out = np.zeros_like(a)
            y0, x0 = (h - sh_) // 2, (w - sw) // 2
            out[y0:y0 + sh_, x0:x0 + sw] = small * m
            a = out
        return a

    return get, files


def track_cx(files, times):
    """Horizontal centre of the can over time (bright-pixel centroid in the middle band, heavily smoothed)."""
    pts = []
    for t in np.arange(0, times[-1] + 1e-6, 0.25):
        a = load(files[min(len(files) - 1, round(t * SRC_FPS))]).mean(2)
        band = a[150:900]
        ys, xs = np.where(band > 60)
        pts.append((t, float(np.median(xs)) if len(xs) > 200 else 960.0))
    ts, xs = np.array(pts).T
    # moving average then linear interpolation
    xs = np.convolve(np.pad(xs, 2, mode="edge"), np.ones(5) / 5, mode="valid")
    return list(zip(ts, xs))


def interp(keys, t):
    ts = [k[0] for k in keys]
    xs = [k[1] for k in keys]
    return float(np.interp(t, ts, xs))


def encode(job):
    arr, path, q = job
    Image.fromarray(arr).save(path, "WEBP", quality=q, method=5)
    return os.path.getsize(path)


def render(name, c):
    print(f"▶ {name}")
    times = frame_times(c["segs"])
    files = None
    if c.get("join"):
        c["_name"] = name
        get = build_join(c)
    else:
        get, files = build_simple(c, name)
    cx_keys = c.get("phone_cx") or [[0, 960]]
    if cx_keys == "track":
        cx_keys = track_cx(files, times)
        print("  phone crop centre:", ", ".join(f"{t:.2f}s→{x:.0f}" for t, x in cx_keys[::4]))

    dw, desk_mb = c["desk"]
    pw, phone_mb = c.get("phone") or (0, 0)  # desktop only: phone sets are optional (omit "phone")
    crop_w = c.get("phone_crop", 720)  # 720 = a 2:3 crop; 1080 = square (the closing: whole can, street to the sides)
    ph = round(pw * 1080 / crop_w) if pw else 0
    desk, phone = [], []
    for t in times:
        a = get(t)
        if c.get("grade", True):
            a = grade(a)
        a8 = a.clip(0, 255).astype(np.uint8)
        im = Image.fromarray(a8)
        if not PHONE_ONLY:
            desk.append(np.asarray(im.resize((dw, round(dw * 9 / 16)), Image.LANCZOS)))
        if pw:
            cx = interp(cx_keys, t)
            x0 = int(min(1920 - crop_w, max(0, cx - crop_w / 2)))
            phone.append(np.asarray(im.crop((x0, 0, x0 + crop_w, 1080)).resize((pw, ph), Image.LANCZOS)))

    outs = (("", desk, desk_mb), ("-m", phone, phone_mb))
    if PHONE_ONLY:
        outs = outs[1:]
    if not pw:
        outs = outs[:1]
    for suffix, frames, budget in outs:
        folder = OUT / f"{SLUG}-{name}{suffix}"
        if folder.exists():
            shutil.rmtree(folder)
        folder.mkdir(parents=True)
        # pick the quality from a sample, then encode everything once (re-encode lower if still over)
        q = 72
        sample = frames[:: max(1, len(frames) // 12)]
        while q > 40:
            size = sum(len(_bytes(f, q)) for f in sample) * len(frames) / len(sample)
            if size / 1e6 <= budget * 0.95:
                break
            q -= 4
        while True:
            jobs = [(f, folder / f"frame_{i + 1:04d}.webp", q) for i, f in enumerate(frames)]
            with ProcessPoolExecutor() as ex:
                total = sum(ex.map(encode, jobs, chunksize=4))
            if total / 1e6 <= budget or q <= 40:
                break
            q -= 4
        h, w = frames[0].shape[:2]
        manifest = dict(count=len(frames), ext="webp", width=w, height=h, pad=4, prefix="frame_",
                        times=[round(t, 4) for t in times])
        (folder / "manifest.json").write_text(json.dumps(manifest))
        print(f"  ✓ {SLUG}-{name}{suffix}: {len(frames)} frames {w}×{h} q{q} = {total / 1e6:.1f} MB")


def _bytes(arr, q):
    b = io.BytesIO()
    Image.fromarray(arr).save(b, "WEBP", quality=q, method=5)
    return b.getvalue()


PHONE_ONLY = "--phone-only" in sys.argv

if __name__ == "__main__":
    if not CLIPS:
        sys.exit(f"no clips: write {CONFIG} first (see the docstring at the top of this file)")
    names = [a for a in sys.argv[1:] if not a.startswith("--")] or list(CLIPS)
    for n in names:
        render(n, CLIPS[n])
    # the 48 fps intermediates are big: never leave them behind
    shutil.rmtree(TMP, ignore_errors=True)
