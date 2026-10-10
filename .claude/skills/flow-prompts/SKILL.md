---
name: flow-prompts
description: Write Google Flow (Nano Banana image + Veo video) prompts for a site's assets: key images, start/end frames, video timelines, covers. Includes aspect ratio, file type (.jpg vs .png), and our Veo rules. Use when the user needs assets generated for a site (Round 0 "assets still needed"), a reel cover, or asks for Flow/Veo prompts.
---

# Google Flow prompts

Base templates: `docs/AI-VIDEO-PROMPTS.md` (A–H). Read `docs/LESSONS.md` → "Assets".

## For every asset give
1. **File name** + where it goes (`raw/<name>.mp4`, `public/images/<slug>/<name>.webp`).
2. **Aspect ratio** and size: 16:9 (1920×1080) for scroll videos and wide images · 9:16 (1080×1920) for covers · 3:4 / 4:5 for product cards · 1:1 for cut-outs. Say: **"check the ratio chip in Flow before generating"** (it keeps the last one used).
3. **File type:** `.jpg` for everything with a background; **`.png` only when it must be transparent** (cut-out products for colour switchers / pop cards). We convert to WebP ourselves.
4. **The prompt** (subject, light, camera, mood that matches DESIGN.md; "no text, no logos" unless text is wanted).
5. For videos, a **timeline**: what happens second by second, e.g. `0–2 s slow push-in · 2.5 s cap pops · 3–4.5 s fizz rises · 4.5–6 s settles`. Put the key moment **early (2–4 s)**.

## Our Veo rules
- An **end frame always needs a start frame** (Flow ignores an end frame alone). Make both images first, same style and light.
- **Dark start frames:** attach a **reference image** too (the product lit), or Veo invents a different product out of the dark.
- **Use the early seconds:** plan the action in the first 4–6 s; later seconds drift or morph. We trim later.
- **Watermark:** Veo puts a small mark bottom-right; our frame tool paints it out (`delogo`). Keep the subject away from that corner.
- Same product in every clip: always start from the same key image (Nano Banana) and say "keep the product exactly as in the reference".
- **Covers (9:16):** keep headline text **15–40% from the top**, the product in the middle; nothing important in the top 14% / bottom 25% / right edge (Instagram UI). Then run `cover-check`.
- One mood and colour grade across all assets of a site.

## Travelling / floating object assets (F1–F8, see MOTION-MENU K)
- **Cut-out angles (F1, F7):** 5 Flow images of the SAME product: **front, 3/4, side, back, top**. Attach the key image as **reference** in every prompt ("keep the product exactly as in the reference"), **plain dark background** (or plain mid-grey for light products), soft studio light, the product fully in frame with margin, no props touching it, **.jpg** at 1:1 (2048 px). Then `npm run cutout -- raw/angles public/images/<slug>/angles` (rembg + BiRefNet, MIT) → transparent PNG → WebP. Check edges on dark AND light.
  Prompt: *"[Product] standing upright, [front / three-quarter view rotated 45° / exact side profile / back / seen from directly above], centred, full product visible with space around it, plain [dark charcoal] seamless background, soft even studio light, sharp, photographic, no shadow on the background, no text, no props."*
- **Floating ingredients (F7):** one Flow image per ingredient (lime slice, ice cube, mint leaf …), same light, plain background, .jpg → `npm run cutout`.
- **Turntable (rotating 2D object):** a Flow **video** of the product turning 360° on a plain background: start frame = the front cut-out image (reference attached), *"the product slowly rotates one full turn on a turntable, camera locked, plain [dark] background, even light, no cuts"*, 16:9, use the first 6–8 s. Then (skill `video-frames`): frames → `npm run cutout` on the folder → WebP → pass them as `angles` to `ObjectPNG` (36 frames ≈ one every 10°).
- **3D model (F2, F3, F6):** the best front/3-4 image → **TRELLIS.2** (MIT, Hugging Face Space `microsoft/TRELLIS.2`) or **Stable3DGen/Hi3DGen** (MIT, commercial-clean) → .glb → `npm run glb -- in.glb public/<…>/model.glb --ogl` (≤ 3 MB). Do **not** use Hunyuan3D (licence excludes EU/UK/KR, MAU limit) unless the user approves. Check the model from all sides before using it.
