---
name: video-frames
description: Turn a raw Veo/AI video into scroll-video frames for this kit (trim, crop the Veo watermark, extra frames in slow/key parts, page-colour grade, size budgets, subject box that follows the product, manifest with video times) and wire it to the scroll player. Use when the user adds a video to raw/ or asks for a scroll video / frame sequence.
---

# Video → scroll frames

Read `docs/LESSONS.md` first (frame-scrub stutter, preload, fade video edges). Desktop only: no phone frame sets.

## 1. Look at the video before cutting
- `ffprobe` it (size, fps, length). Veo clips: 1920×1080, 24 fps, 8 s.
- Make a contact sheet (`ffmpeg -i raw/x.mp4 -vf "fps=2,scale=320:-1,tile=8x2" sheet.jpg`) and **measure** the landmarks in seconds (the moment the cap pops, the colour changes, the burst starts). Write them in `site/DESIGN.md` → "Video plan". Never guess times.
- **Use the early seconds** (Veo's best motion is in the first 4–6 s; later seconds drift or morph).
- Where is the subject? Note its box (x0 y0 x1 y1 as fractions) over the whole clip (placement, things drawn over the video).

## 2. Configure `site/frames.json` and run the pipeline
```json
{ "slug": "<slug>", "background": "<page bg hex>", "delogo": "delogo=x=1852:y=1032:w=56:h=32",
  "clips": { "hero": { "src": "hero.mp4", "start": 0, "end": 6,
    "segs": [[0, 2.5, 16], [2.5, 4, 48], [4, 6, 24]],
    "desk": [1600, 12] } } }
```
`python3 scripts/make_frames.py [clip]` (set `FRAMES_TMP` to a scratch folder if disk is tight; it deletes its temp files).
- **Watermark:** the Veo mark sits at the bottom right (x 1865–1895, y 1042–1055 of 1920×1080) → `delogo` paints it out. Check one frame.
- **Double density in slow/important parts:** `segs` = `[t0, t1, fps]`; 12–16 fps for calm parts, 24–48 fps where the motion is fast or the key moment happens (the source is motion-interpolated to 48 fps first).
- **Budgets:** ≤ 12 MB, never > 15 MB per folder. The tool lowers WebP quality until it fits; if it can't at q40, cut the width or the fps.
- **Grade:** near-black is mapped onto the page background, so frames melt into the page (no box edge).
- Output: `public/frames/<slug>-<clip>` with `manifest.json` incl. `times` (video second of every frame).

## 3. Play it
- `lib/film.ts` (`useFilm`) + `components/patterns/FilmPin.tsx`: scroll → **video time** (not frame number), the two neighbour frames are **blended** (no stutter at any speed), frames load **lazily** (near the section, or `loadWhen` = a calm section earlier so the burst never lands during another video), the hero is `eager` + `blockLoader` (the loader waits for every hero frame).
- `segments`: `{ to: <video s>, secs: <record s>, label }`; FilmPin adds a record stop per segment.
- Placement: desktop `{ fade: {…} }` (fade **every** edge into the page)
- Text switches tied to the video (names, colours) use the **measured** times from step 1.

## 4. Check
`npm run check`, then `npm run reel` (PASS, 1440×900).

## Transparent frames (rotating 2D object / turntable, F1)
1. Flow turntable video (skill `flow-prompts`) → `raw/turntable.mp4`.
2. Frames: `ffmpeg -ss 0 -t 6 -i raw/turntable.mp4 -vf "fps=6,scale=1024:-1" raw/turn/f_%03d.jpg` (36 frames for one 360° turn in 6 s; pick the exact turn from a contact sheet).
3. Remove the background: `npm run cutout -- raw/turn raw/turn-cut` (rembg, **`-m birefnet-general`** is forced by the script: the newest default model is not licensed for commercial use).
4. WebP: `for f in raw/turn-cut/*.png; do cwebp -q 82 -alpha_q 90 "$f" -o public/images/<slug>/turn/$(basename "${f%.png}").webp; done` (or sharp). Budget ≤ 4 MB for the set.
5. Use them as the `angles` of `components/fx/travel/ObjectPNG.tsx` (the driver's `turn` 0..1 crossfades through them).

## 3D models (F2, F3, F6)
`npm run glb -- raw/model.glb public/<path>/model.glb --ogl` → plain geometry + WebP textures for the OGL loader and `<model-viewer>` (no decoder download). Without `--ogl` you get Meshopt (smaller; needs the MeshoptDecoder: three.js/R3F only). Keep each .glb ≤ 3 MB.

## Scroll video as a <video> element (first used on Day 13)
For a long, fast-moving POV/drive film where frames would be heavy, a real `<video>` scrubbed by video time works too:
- Crop the Veo mark (e.g. `crop=1838:1034:41:0` = cut the bottom 46 px, width trimmed evenly) and scale to **1600×900** (covers 1440×900).
- Encode **every frame as a keyframe** so seeking is smooth both ways: `-c:v libx264 -g 1 -keyint_min 1 -bf 0 -crf 22 -an -movflags +faststart` and a WebM fallback `-c:v libvpx-vp9 -b:v 0 -crf 34–44 -g 1 -an`. 8 s ≈ 11 MB each.
- Put the files in **`public/videos/`** (`npm run check` and `npm run assets` cover it). Set `video.currentTime = progress × duration` in a rAF loop, only when it changed by more than 1/60 s; in `?static=1` show the last (or a chosen) frame.
- Start = end loops (hero films): measure first vs last frame against a normal frame step and bake a 12-frame crossfade (`trim` + `xfade`, lesson 68).
