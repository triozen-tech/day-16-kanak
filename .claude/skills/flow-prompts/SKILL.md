---
name: flow-prompts
description: Asset specs for Google Flow (Nano Banana stills, Veo video) WITHOUT writing prompts. Use it to write the asset list in DESIGN.md (what each asset is, size, file type, which image an edit attaches, code fallback), to check assets that come back from Flow, and to record the prompts the user pastes back under "Prompts (as run)". Claude Code never writes or prints Flow/Veo prompts.
---

# Flow assets (specs, checks, records: never prompts)

**Permanent rule:** Claude Code never writes or prints Flow / Veo prompts: not in chat, not in DESIGN.md, not in any file. The user's director writes the prompts and gives them to the user in chat, batch by batch. Read `docs/LESSONS.md` → "Assets" first.

## 1. The asset list in DESIGN.md (Round 0)
For every asset give, in plain words (a description, not a prompt):
1. **ID + what it shows**: subject, setting, mood in one line (e.g. "the necklace on a three-tier ivory podium under a soft halo light").
2. **Use**: which section and how (hero scrub, cut-out, loupe, crossfade pair …).
3. **Source and how**: Flow image · Flow edit of <ID> (**say which image to attach**, e.g. "attach only A7" for a pixel-aligned pair) · Flow Veo from <ID> · code · Blender (rarely, lesson 113).
4. **Size / file**: aspect (16:9 for scroll films and wide images · 9:16 covers · 3:4 / 4:5 cards · 1:1 cut-outs), download size (e.g. 2K), file type (`.jpg` with a background; `.png` only when it must be transparent; we convert to WebP ourselves).
5. **Code fallback** if Flow credits run short (code tint, crop, code-drawn shape, reuse of another cut-out), or "must have".
6. The day's asset rules (e.g. "no faces, no hands, no models").

## 2. Rules the assets must meet (check results against these)
- **Same product everywhere:** angles, variants and try-on stills are Flow **edits of one master image** (the master attached), so every shot shows the same piece.
- **Pixel-aligned pairs** (before/after, 22K/18K, day/night): the edit attaches only the master; measure and undo any sub-pixel shift before using them as a crossfade pair (lessons 92, 117).
- **Veo:** keep the camera locked and the motion simple (slow push-in, steady light); light sweeps, glints and colour changes are done in code over the film. An end frame always needs a start frame. Use the early seconds; later ones drift. Start = end frame gives a loopable clip, but bake a crossfade into the seam (lessons 68, 90). Never the word "mist"/"fog" in anything sent to Veo (lesson 90).
- **Marks:** Nano Banana stills may carry a ✦ mark bottom-right; check with a high-pass, paint it out with `npm run clean-mark` (lessons 92, 112, 118). Veo burns marks in its start frame into every frame (lesson 116): give Veo the cleaned still.
- **Covers (9:16):** headline 15–40 % from the top, the object in the middle; nothing important in the top 14 % / bottom 25 % / right edge; then `cover-check`.
- One mood and colour grade across all assets of a site.

## 3. Processing what comes back
- **Cut-outs:** `npm run cutout -- <folder> [out]` (rembg + BiRefNet, MIT) → transparent PNG → WebP; check edges on dark AND light.
- **Scroll films:** skill `video-frames` (`site/frames.json` + `npm run film-frames`).
- **Turntable from a Veo spin video:** frames → `npm run cutout` on the folder → WebP → `angles` for `ObjectPNG` (36 frames ≈ one every 10°).
- **3D model (F2, F3, F6):** the best front/3-4 image → TRELLIS.2 or Stable3DGen/Hi3DGen (MIT) → `npm run glb -- in.glb out.glb --ogl` (≤ 3 MB). Not Hunyuan3D unless the user approves. Check the model from all sides.
- **Travelling-object angles (F1, F7):** list 5 views of the SAME product (front, 3/4, side, back, top) as Flow edits of the key image, plain background, 1:1 at 2048 px, then cut out.

## 4. Recording the prompts that were run
When the user pastes back the prompts they ran, add them **word for word** to `site/DESIGN.md` under **"## Prompts (as run)"**: asset ID · date · the prompt exactly as pasted · attachments (which images were attached) · result notes (kept / redone / fallback used). Never rewrite, shorten or "improve" them.
