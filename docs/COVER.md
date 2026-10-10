# Reel cover: the locked spec

Every day's Instagram Reel cover uses this exact layout. Don't change it per site; only the **day number, niche word, accent, hero shot and object** change. The tool is `scripts/cover.mjs` (`npm run cover`); the safe-area check is the `cover-check` skill.

```
npm run cover -- --day <N> --niche "<WORD>" --accent "#rrggbb" [--dir <day folder>] [--object-cx 760] [--object-bottom 700]
```
- Reads `raw/cover-shot.jpg` (hero, 1440×900) and `raw/cover-object.png` (cut-out, if it exists) from the day folder; `--shot` / `--object` override.
- Writes `recordings/day-NN-cover.jpg`, then runs `cover-check` on it (`recordings/day-NN-cover-safe.jpg`).
- Rendered as an HTML page and screenshotted with Playwright (installed Chrome), so the fonts render exactly.

## Canvas

| | |
|---|---|
| Size | **1080×1920** (9:16), JPG quality **92** |
| Background | flat **#F4F1EC**, paper grain at 2.5% opacity, no gradients |
| 3:4 main-grid crop | y **240–1680**: everything that matters sits inside it |
| Fonts | **Anton** (niche, SCROLL WEBSITE) + **Urbanist** 700/800 (studio, pill), stored in `scripts/cover-fonts/` (OFL), no CDN |

## Elements (px on the 1080×1920 canvas)

| Element | Spec |
|---|---|
| **DAY pill** | top-left x **90**, y **290**. Fill #111, text #FFF "DAY N", Urbanist ExtraBold (800) **40px**, letter-spacing 0.02em, padding 14×28, fully rounded |
| **Browser card** | x **90**, width **900**, top y **560**. Top bar **48px** #E9E5DE with 3 dots (13px, #C9C3BA, 9px apart, 24px in). Then the hero shot scaled to **900×562** (cover-fit). Radius **28**, border 1px **#DDD7CE**, shadow `0 30px 60px rgba(0,0,0,0.18)`. Card bottom ≈ y **1170** |
| **Object** | see "Object rules" below. Default: centre x **760**, bottom resting on the card at y **700**, top never above y **330**, max width **440** (the height fills 330 → bottom) |
| **Object shadows** | soft drop shadow **only where it overlaps the card**: object silhouette, blur **40px**, offset y **+18**, #000 at **35%**, clipped to the card. Plus a small contact shadow at its base (ellipse 70% of the object's width, 30px tall, blurred 6px) |
| **Niche word** | UPPERCASE, Anton **150px**, the day's **accent**, centred. Wider than 900px → shrunk to fit. Accent under **3:1** contrast on #F4F1EC → darkened until it passes |
| **SCROLL WEBSITE** | Anton **96px**, #111, centred, **20px** below the niche word |
| **Text block position** | the two lines are centred between the card bottom (≈1170) and y **1640**; all text ends above y **1613** (the script warns if not). No third line |
| **Reels-tab view-count badge** | rounded rectangle #111, x **36–560** (wide enough for a count like "2,548"), y **1738–1852**, radius **18**, **nothing on it**: Instagram draws the Reels-tab view count there (bottom-left of the 9:16 tile). It's below the 3:4 crop, so the main grid (which shows no counts) never shows it |
| **Studio name** | "TRIOZEN TECH", Urbanist Bold (700) **30px**, letter-spacing **0.12em**, #111 at **55%**, right-aligned with its last letter at x **1044**, vertically centred on the badge (y ≈ 1795) |

## Hero shot (`raw/cover-shot.jpg`)

- 1440×900, the moment the hero is **fully shown** (loader gone, headline in its final state).
- Days with a final reel: one frame from `recordings/*-final.mp4` (`ffmpeg -ss <t> -i … -frames:v 1 -q:v 1 raw/cover-shot.jpg`).
- Otherwise: a live 1440×900 screenshot of the site with `?static=1`.

## Object rules (`raw/cover-object.png`)

1. An **OBJECT** (product, gear, prop): **never a person**.
2. One single object with a **clean outline, the whole object visible** (no stacks or racks of overlapping things).
3. Cut out with `npm run cutout`; **clean edges, no white halo**: the cover script erodes the mask **2px** and feathers **1px**. Holes (a handle, a cup's loop) must stay transparent.
4. It must **NOT cover the site's headline** in the screenshot, nor the nav's main button much. Default spot is the right third of the card; nudge right/up with `--object-cx` / `--object-bottom` (top never above y 330). Also avoid covering a face in the hero.
5. Small surface fixes are fine if they stay subtle (e.g. soften a flat patch so it reads as the natural material); no repainting.
6. No clean object in `raw/`? **Don't fake one.** Make the cover without it (card only), list the day as **NEEDS OBJECT** and suggest which object would suit the site (to make in Flow).

## Check

`cover-check` always flags the Reels caption zone, the right icon column and the bottom 12.5% for this layout: that is by design (the badge and studio name sit below the grid crop on purpose). What must hold: everything important inside y 240–1680, text inside the 1170–1613 band, the badge empty, the headline in the shot uncovered.
