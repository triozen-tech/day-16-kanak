---
name: cover-check
description: Check a 9:16 Instagram Reel cover against Instagram's safe areas (3:4 profile-grid crop ≈13% top/bottom, Reels header and caption/button zones, right icon column) and our text rule (headline 15–40% from the top); say what is outside; optionally move the content into the safe area on a matching background. Use when the user shares or asks for a reel cover / thumbnail.
---

# Cover check

1. `python3 scripts/cover-check.py <cover.jpg>` → `<cover>-safe.jpg` (overlay) + a report.
   Zones: red = cut by the 3:4 grid crop (top/bottom 12.5%) · orange = Reels header (top 14%), caption + buttons (bottom 25%), icon column (right 14%, y 45–92%) · green box = **safe** (x 6–84%, y 15–72%) · blue lines = our **text band, 15–40% from the top**.
2. **Look at the overlay yourself** (the script finds content by colour difference; it can miss thin text). Say plainly: which text/product parts are outside and where.
   For an exact check of one element: `--box x0,y0,x1,y1` (fractions).
3. The cover must be **9:16** (1080×1920). If not, say so first.
4. Fix: `--fit` writes `<cover>-fit.jpg`: the content scaled/moved into the safe box on a gradient of the cover's own edge colours (no ghost of the old picture). Re-run the check on the fitted file. If the headline then sits outside 15–40%, move it in the source design instead (better than scaling everything).
5. Show the user the overlay and (if made) the fitted version side by side.

## Making the cover (`npm run cover`)

`npm run cover -- --day 11 --niche "GYM" --accent "#2F55E4" --object raw/cover-object.png --shot raw/cover-shot.jpg [--dir <day folder>]` → `recordings/day-XX-cover.jpg` (1080×1920, q92, rendered with Playwright + local Anton/Urbanist), then this check runs on it. Same layout every day: DAY pill, browser card with the 1440×900 hero shot, cut-out object, niche word (accent, darkened to ≥ 3:1 if needed) + SCROLL WEBSITE centred between the card and y 1640 (all text above 1613), a blank #111 view-count badge bottom-left (x 36–560, y 1738–1852: Instagram draws the Reels-tab count on it) and the studio name bottom-right, both below the 3:4 grid crop. `--object` defaults to `raw/cover-object.png` when it exists.

**Object rules** (full locked spec: `docs/COVER.md`)
- Use an **object** (product, gear, prop), **never a person**.
- It must **not cover the site's headline** in the screenshot. Default spot: right third of the card (centre x ≈ 760), bottom resting on the card at y ≈ 700 (overlaps the hero a little), top breaking out above the card's top edge but never above y 330. It must not cover the nav's main button much either. Look at the result and nudge with `--object-cx` / `--object-bottom` (right/up) if it does.
- **Clean edges, no white halo**: cut it out with `npm run cutout` (single object, whole outline visible); the cover script erodes the mask 2 px and feathers 1 px.
- No clean single object in `raw/`? Don't fake one: list the day as **NEEDS OBJECT** (the cover can be made without `--object`) and ask for a Flow image.
