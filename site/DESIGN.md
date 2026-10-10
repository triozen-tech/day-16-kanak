# DESIGN.md · Day 16 · Kanak Jewels

**Mode: FULL (Max)**

Gold jewellery house (fictional; Jaipur, since 1987; ₹ prices, sample gold rate). Desktop 1440×900 only. Not a travelling-object day (next: Day 18).

**Direction = the user's pick: Layout A "The Halo"**, with the **Collections** and **Product detail** sections taken from **Layout C "Gold Showcase"** and restyled into A's language (mockups: `day16/refs/layouts/a-halo.html`, `c-showcase.html`). References are the user's inbox (`day16/refs/inbox/`); sections nobody saved are "ours".

8 of 8 different from the last 3 sites (see the sites log). Never "dark luxury": warm ivory and soft gold, calm, bridal.

**Asset rules for this day:** no faces, no hands, no models wearing pieces in any AI image or video. Jewellery on velvet, busts, stands or floating; a faceless neck/shoulder crop only for stills (the try-on view uses a plain bust).

## Choices

| Menu | Choice | Why, for this site | From |
|---|---|---|---|
| Look | **L17 Symmetric monument, ivory-and-gold edition**: dead-centre compositions (halo, seal, dial), warm ivory paper, gold used as light and line, hard cuts only at chapter changes | Jewellery reads best centred and still, like a piece in a display case; symmetry lets every section feel like a vitrine | A (hero-1 halo) |
| Palette | **Ivory & soft gold**: ivory `#F6EFE3`, paper `#FBF7F0`, sand `#E9DCC6`, ink `#2B2117`, muted `#7A6A55`, line `#D9C8AC`; accent **gold `#A87A2A`** (light gold `#C9A04A` for glows and rules). Collection bands (Collections section only): bridal rose `#EBCFC6`, temple turmeric `#EBCB7E`, daily-wear sage `#D3DCCB`, gifting lilac `#DDD4E7`. The festive edit flips to a deep ink band `#2B2117` | Gold needs a warm light ground to glow, not black; the four tints give each collection its own mood without a second accent | A + C |
| Type | **T5 Italiana** (display, thin, high-contrast) **+ Figtree** (body), **Pinyon Script** for one festive line | Italiana's hairline strokes echo fine gold wire; Figtree keeps prices and the breakdown legible | A |
| Nav | **N3 split** as **NV17**: two short link columns left (pieces · collections), centred KANAK wordmark with "Jewels · since 1987", two columns right (gold rate · craft · stores / search · account · Bag) | A jeweller's printed card; leaves the centre free for the halo | A (hero-1) |
| Hero | **The Halo**: a glowing halo arch over a three-tier ivory podium; the necklace rests on the podium while thin giant letters ETERNAL (behind) / GOLD (in front) thread through it; a warm light sweep glints across gold and letters; spec meta (piece, ₹, 22K · grams) bottom-right | The piece is the hero, framed like a museum vitrine; the threaded words give depth without a portal or a grow-to-full-screen | A (hero-1 + hero-3) |
| Section shape | **S3 soft arches**: sections meet on a shallow arch edge (the halo's curve) that flattens as it passes | Repeats the halo without repeating the hero | ours |
| Cards | **C2 rounded + soft shadow** on paper white, hairline gold rules inside | Soft, bridal, lets the gold stay the only shine | A |
| Signature | **A piece for every hour**: a pinned jewellery clock; scroll turns the dial so each hour's piece comes to 12 o'clock, lights up (warm glow) and shows its card (name · 22K · grams · ₹), while the hands sweep to the hour | A daily-wear story only jewellery can tell; a clock is new to the kit and films beautifully | A (shop-2 clock + shop-1 hover card) |
| Loader | **I31 coin-spin mark**: a gold coin with the K monogram spins, lands, and the cover lifts into the halo | A gold coin is the first thing a jeweller sells | ours |

## Section plan

| # | Section | Layout | Starts from | Restyled how | Reference |
|---|---|---|---|---|---|
| 0 | Loader | — | I31 | K coin in the brand gold, ivory cover, counter in Figtree | ours |
| 1 | Nav | **NV17** | `components/sections` NV17 | Split into 2+2 link columns around a centred wordmark (A's card nav), Bag count | A · hero-1 |
| 2 | Hero · The Halo | **HR10** | HR10 product on a plinth + spec bar | Halo arch + 3-tier podium + threaded ETERNAL / GOLD + spec meta over the **A1 still (code hero, no film)** | A · hero-1 (+ hero-3) |
| 3 | Collections | **GL29** | GL29 tabbed photo sets | **C's switcher**: pinned; Bridal → Temple → Daily wear → Gifting; the band colour, the giant collection word (Italiana) and four floating pieces change; arrows sit on the piece; state chips bottom-left, "Shop bridal · 48" | C · product-2 clip |
| 4 | Daily wear · the clock (signature) | **GL26** | GL26 ring around a title | 12 pieces on a dial, ticks, gold hands, hover card per hour; title left | A · shop-2 + shop-1 |
| 5 | Product detail | **PS04** | PS04 spotlight + buy box | **C's stage**: name (Italiana) top-left, total top-right, the piece large in the centre on a soft gold band, up/down arrows + index 02, spec row (purity · weight · making · full details) under it; right: white price drawer with 22K/18K chips, itemised rows, faceless try-on bust, Add to bag + ♡; loupe on the piece | C · product-1 clip + product-4 + product-3 |
| 6 | Purity & trust | **SP06** | SP06 trust strip | Centred BIS seal "916" + four promises + the sample-rate pill **"Sample rate · concept site"** | ours (A) |
| 7 | Craft & heritage | **PD03** | PD03 auto-advancing steps | Five steps (Sketch · Wax · Cast · Set · Polish) as gold line drawings of tools, never hands | ours (A) |
| 8 | Festive edit | **PR11** | PR11 hero offer + side offers | Ink band; script line + "The Festive Edit"; five set cards in a fan, centre lifted; "making from 6%" | A · Collections-2 |
| 9 | Reviews | **SP02** | SP02 three-column wall | Three paper cards, gold stars, Italiana quotes, no faces | ours (A) |
| 10 | Footer | **FO01** | FO01 giant cropped wordmark + 3 link columns | Outline KANAK in gold, Book a viewing, concept note | ours (A) |

No layout code used twice; none used by Days 13–15 (see the sites log).

## Motion map

| # | Section | Layout | Motion | How it plays here | Record mode |
|---|---|---|---|---|---|
| 0 | Loader | — | **I31** coin-spin mark | K coin spins 540°, count to 100, spins to the front, the ivory cover lifts and the halo lights | fixed 2.4 s |
| 1 | Nav | NV17 | **M146** giant wordmark docks into nav | The loader's large KANAK flies into the centred logo slot as the cover lifts (on the clock, 0.8 s, inside the 2.4 s loader; the nav wordmark appears as it lands) | timed, in the loader |
| 2 | Hero | HR10 | **M49** light sweep / shine | **Hero = code, no Veo film.** The A1 still (2K, ✦ cleaned) pushes in slowly with the scroll (scale 1 → 1.05 max); the A1 necklace cut-out scales with the same push-in so GOLD stays threaded in front of it. In code: a warm light band sweeps across the necklace and ETERNAL / GOLD, small glints run along the links, a very soft sparkle breathes on a few pearls and the ruby (soft round light, never star shapes); the halo rim glow stays steady. In record mode the sweep plays on the clock so the hero is never still; a broad warm light band crosses the whole scene every 4.2 s and the scene breathes (scale 1 → 1.035, 6 s) so the hold passes frame-diff | hold 1.0 s + scrub |
| 3 | Collections | GL29 | **M145** words slide sideways in masks | Pinned 200vh; each step swaps the giant word whole (sideways mask wipe), crossfades the band colour and the main piece, floating pieces drift to new spots | pinned, 4 steps |
| 4 | Clock (signature) | GL26 | **M445** scroll-scrubbed ring (as a dial) | Pinned 180vh: the ring of 12 pieces turns so each lit hour reaches 12 o'clock; front piece bright + warm glow, others dim; hands sweep to the hour; the card swaps per hour. On camera: 3 hours (4 → 8 → 12), the dial turns 4 hours per step | pinned; 3 holds + 3 hover stops |
| 5 | Product detail | PS04 | **M165** magnifier loupe | Loupe follows the record cursor over the pendant (2×); the 22K → 18K chip click re-tints the piece (A7/A8 crossfade) and **rolls weight, gold value, making, GST and total**; the buy drawer stays sticky | hold 2.5 s; chip + Add to bag stops |
| 6 | Purity & trust | SP06 | **M103** circular text ring | "BIS HALLMARK · 22 KARAT · 916 ·" spins round the seal; the four promises rise in turn; the sample-rate pill pulses once | hold 1 s |
| 7 | Craft | PD03 | **M251** borders draw, then images | Each step's frame draws clockwise, then its tool drawing and label appear, auto-advancing left to right | plays on enter |
| 8 | Festive edit | PR11 | **M449** deck fans into semicircle | Five set cards wait in one stack as the band arrives, then fan out into the arc (centre first, on the clock); the record cursor lifts the centre card; a warm glow drifts behind | on arrival + hold 1.1 s |
| 9 | Reviews | SP02 | **M117** marker highlight sweep | A soft gold highlight sweeps behind key words ("every light", "every rupee") word by word | plays on enter |
| 10 | Footer | FO01 | **M269** gradient stroke name draw | The outline KANAK writes itself with a sliding gold gradient stroke | plays on enter |

Transitions: 2→3 **X22** feathered gradient mask wipe · 3→4 **X2** colour wash (collection tint → ivory) · 4→5 **X15** vignette spotlight onto the piece · 5→6 **X18** stamp-pop dissolve (the seal) · 6→7 **X1** overlap slide · 7→8 **X14** atmospheric bleed into the ink band · 8→9 **X29** curved-edge cover swipe · 9→10 **X40** footer revealed under the page.
Section edges: S3 arches flatten as they pass (X3 behaviour).
### Reel time table (FULL mode, `?record=1` at 1440×900)

Target **34–38 s** including the loader; planned **34.6 s** (room to lengthen up to 38 s while tuning). Holds ≤ 1.2 s (lesson 74); every timed sequence starts on arrival so it lands inside its hold.

| # | Section | Move in (s) | Pinned / scrub (s) | Holds (s) | Hover stops (record cursor, dwell s) | Total (s) | Ends at (s) |
|---|---|---|---|---|---|---|---|
| 0 | Loader (I31) | — | — | fixed 2.4 | — | 2.4 | 2.4 |
| 1–2 | Nav + Hero (M146, M49) | — | code push-in scrub 3.4 (wordmark docks in the first 1.0) | 1.0 at the top (sweep + glints + pearl sparkle play on the clock) | — | 4.4 | 6.8 |
| 3 | Collections (pinned 200vh) | 0.8 | 4 steps × 1.25 = 5.0 (Bridal → Temple → Daily wear → Gifting) | — | — | 5.8 | 12.6 |
| 4 | Clock, signature (pinned 180vh) | 0.8 | 3 dial turns × 0.7 = 2.1 | 3 × 0.9 = 2.7 (4, 8, 12 o'clock) | 3 clock pieces × 0.9 (inside the holds) | 5.6 | 18.2 |
| 5 | Product detail | 0.8 | 3 short moves × 0.4 = 1.2 | 1.0 + 1.2 + 1.2 + 1.0 = 4.4 | loupe 1.0 · 18K chip click 1.0 (numbers roll 0.7 s) · Add to bag click 1.2 (piece arcs to the Bag 0.8 s) | 6.4 | 24.6 |
| 6 | Purity & trust | 0.9 | — | 1.5 (seal stamps, promises rise, ring turns) | — | 2.4 | 27.0 |
| 7 | Craft | 0.9 | — | 1.5 (the five steps draw in, left to right) | — | 2.4 | 29.4 |
| 8 | Festive edit | 0.9 | — | 1.1 (deck fans out on arrival) | centre card 0.9 | 2.0 | 31.4 |
| 9 | Reviews | 2.1 | — | — (cards rise, highlights sweep) | — | 2.1 | 33.5 |
| 10 | Footer | 1.0 | — | 1.4 (wordmark writes from arrival) | — | 2.4 | **35.9** (measured, Round 3 reel) |

Hover stops: 7 (≥ 3). If the reel runs over 38 s: shorten the Collections pin first (4 × 1.0 s), then the clock turns (0.5 s); the clock already shows only 3 hours.

Details: magnetic Add to bag; hairline underline draws on links; Bag count bumps on Add to bag; the filled chip pill slides (Flip) between 22K and 18K.

## Hover map

| Element | Where | Hover effect | From (pick) | Record cursor |
|---|---|---|---|---|
| Clock piece | Daily wear clock | the piece lifts and glows, the hands point to it, its card shows name · grams · ₹ · Add to bag | A · shop-2 + shop-1 | **data-hover-demo** on 3 hours (4, 8, 12) |
| Collection arrow | Collections | arrow fills gold, the piece tilts toward it; click advances the collection | C · product-2 | — (in the reel the pin advances by scroll) |
| Product piece | Product detail | loupe 2.4× follows the pointer | C · product-1 | **data-hover-demo** (pendant, `data-hover-at`) |
| 22K / 18K chip | Product detail | filled pill slides under the chip; click re-tints the piece and **rolls the five numbers** | user request | **data-hover-demo="click"** (18K) |
| Add to bag | Product detail | fill wipes left → right, magnetic pull; click: the piece arcs into the Bag, count bumps | ours | **data-hover-demo="click"** |
| Festive card | Festive edit | card rises out of the fan, shadow deepens | A · Collections-2 | data-hover-demo (centre card) |
| Review card | Reviews | gold hairline frame draws around it | ours | — |
| Text / nav link | everywhere | gold underline draws from the left | ours | — |

Record-cursor stops in the reel (7, need ≥ 3): clock 4 · 8 · 12 o'clock · loupe on the pendant · 18K chip · Add to bag · centre festive card. Timings in the reel time table below.

## Product detail plan

| Interaction | Section | How it works here | From (pick) |
|---|---|---|---|
| Hover loupe | Product detail | 170 px round loupe at 2× that follows the pointer; it reads the sharp A7a macro over the pendant area and A7 elsewhere; parks on the ruby's rim (ruby, pearl border, gold leaves) in record | C · product-1 (+ M165) |
| Purity chips swap the piece + price | Product detail | 22K ↔ 18K: the necklace crossfades to the pixel-aligned 18K still (A8); weight, gold value, making (12 %), GST (3 %) and total **roll** to the new numbers (sample rates 22K ₹7,240/g · 18K ₹5,930/g) | user request + product-2 clip |
| Itemised price breakdown | Product detail | rows: weight · gold rate (sample) · gold value · making · GST · total; label **"Sample rate · concept site"** | ours |
| Faceless try-on view | Product detail | toggle in the drawer: the piece on a plain ivory bust (A9), true scale, no face | ours (user rule) |
| Sticky buy drawer | Product detail | the drawer stays pinned while the stage switches pieces (up/down) | C · product-1 |
| Product switcher | Product detail | up/down arrows + index; band colour, name, price and specs change per piece | C · product-1 clip |
| Thumbnail rail | Product detail | 5 thumbnails (angles A7a–c) | A · product-4 |
| Add-to-bag animation | Product → nav | the piece thumbnail arcs into the Bag, count bumps | ours |

## Assets still needed (sources)

All **Flow** (Nano Banana stills, Veo video) + **code**; **no Blender** (jewellery is detailed metal + stones, not a simple smooth object). No faces, hands or models. One mood for all stills: warm ivory light, soft shadows, 22K yellow gold, ruby/emerald/pearl accents.

**Prompts:** Claude Code never writes or prints Flow/Veo prompts. The user's director writes them and gives them to the user batch by batch. When the user pastes the prompts that were run, Claude records them word for word under **Prompts (as run)** below. This table only says *what* each asset is, how it's made and where it goes.

| ID | Asset | Use | Source · how | Size / file | Code fallback if Flow credits run short |
|---|---|---|---|---|---|
| A1 | Hero master still: the Mayuri haar on a three-tier ivory podium under a soft arched halo light, ivory backdrop, space left for the letters | **The hero itself** (code push-in, light sweep, glints, sparkle) + its necklace cut-out | Flow image | 16:9 · .jpg | — (must have) |
| V1 | ~~Hero film from A1~~ **dropped (2026-10-10): the hero is code.** Two Veo takes failed (see Prompts (as run)) | — | — | — | Code hero: A1 + push-in + M49 sweep, glints and pearl/ruby sparkle |
| A2–A5 | One hero piece per collection, floating on plain ground: bridal set (A2), temple coin haar (A3), daily-wear hoops / studs (A4), gifting rose-gold bracelet (A5) | Collections switcher (cut-outs) | Flow images → `npm run cutout` | 1:1 · .jpg | Partly: A3–A5 could reuse A6 cut-outs; A2 must have |
| A6 | **Two flat-lay sheets, 6 pieces each, well spaced** (studs, hoops, rings, chains, bracelet, pendant) on ivory | Clock: 12 cut-outs | Flow images, **downloaded at 2K** → `npm run cutout` per piece | 1:1 or 4:3 · .jpg · 2K | Partly: one sheet (6) + the A2–A5 / A7 cut-outs fill the other hours (only 3 hours are on camera) |
| A7 | The Mayuri haar, product shot on ivory, high resolution | Product stage, loupe (2×), source of A7a–c, A8, A9, cover object | Flow image | 1:1 · .jpg · 2K | — (must have) |
| A7a–c | Pendant close-up, clasp, side angle of the **same necklace** | Thumbnail rail | **Flow edits of A7 (A7 attached)** | 1:1 · .jpg | **Yes:** code crops / zooms of A7 |
| A8 | A7 in 18K (paler gold), pixel-aligned | 22K / 18K crossfade | **Flow edit of A7, attach only A7**; check alignment + ✦ mark (lessons 92, 112) | same as A7 · .jpg | **Yes:** code tint on A7 (hue / saturation / brightness shift) |
| A9 | Plain ivory bust (neck + shoulders, no face) wearing **the same necklace** | Try-on view | **Flow edit of A7 (A7 attached)** | 4:3 · .jpg | **Yes:** code-drawn bust (as in the mockup) + the A7 cut-out at true scale |
| A10 | Festive sets on deep ink velvet trays ×5 | Festive fan cards | Flow images | 3:4 · .jpg | **Yes:** A2–A5 / A7 cut-outs on code-drawn velvet trays |
| — | Halo, podium shading, light sweep + glints, seal, ring text, tool line drawings, clock dial, ticks, hands | everywhere | code | — | — |
| — | Cover object: the necklace cut-out from A7 | reel cover (Round 5) | `npm run cutout` | .png | — |

Must-have Flow assets if credits run short: **A1, A7, A2, one A6 sheet**. Everything else has a code fallback.

### Asset status (2026-10-10, after batch 1)

| ID | Status | In the site as |
|---|---|---|
| A1 | ✅ batch 1 · ✦ cleaned · necklace cut out and placed back on a full transparent canvas (pixel-aligned to the photo, for GOLD in front) | `hero.webp` (2400 w) + `hero-necklace.webp` |
| A2–A5 | ✅ batch 1 · ✦ cleaned · cut out (A3, A4: chain kept solid at the top edge) | `coll-bridal / temple / daily / gifting.webp` |
| A6 | ✅ batch 1 · two sheets · ✦ cleaned · 12 pieces cut out one by one, real-life sizes set in code (`PIECE_SIZE`) | `pieces/*.webp` (clock + collection floats) |
| A7 | ✅ batch 1 · ✦ cleaned · cut out (top edge solid) · checked against A1: same necklace (A7 a touch brighter/yellower, rounder U, slightly smaller pendant) | `mayuri-cut.webp` (stage, loupe, try-on) + `mayuri.webp` (thumbnails) |
| A10-1…5 | ✅ batch 1 · ✦ cleaned (festive-3, -5: velvet weave cloned in, brightness matched) | `festive-1…5.webp` |
| A7a–c | ✅ batch 2 (1024², not 2K) · ✦ cleaned · A7a located inside A7 (left 27.2 %, top 46.7 %, 46 % wide) | thumbnail rail + stage views; A7a = the loupe's sharp source over the pendant |
| A8 | ✅ batch 2 (1024²) · ✦ cleaned · pixel-aligned with A7 (0.00 / 0.01 px, scale 1.000) | `mayuri-18k-cut.webp` (A8 colours + A7's cut-out mask) · `loupe-18k.webp` (A7a recoloured by the measured A7 → A8 colour map) |
| A9 | ✅ batch 2 (896×1200) · ✦ re-cleaned (texture taken from above, not from the bust) | `tryon.webp` in the price drawer |
| V1 | ❌ dropped: two Veo takes rejected · hero = A1 still + code (push-in, sweep, glints, sparkle) | — |

Originals before cleaning: `raw/_orig/`. Cut-out PNGs: `raw/cutouts/`.

## Prompts (as run)

_Recorded word for word when the user pastes the prompts that were used (asset ID · date · prompt · attachments)._

### Batch 1 · 2026-10-10 · Nano Banana Pro, ×4, 2K

Files: `raw/a1-hero.jpg`, `a7-product`, `a2-bridal`, `a3-temple`, `a4-daily`, `a5-gifting`, `a6-sheet-a`, `a6-sheet-b`, `a10-festive-1` (coins) … `a10-festive-5` (gift box), all .jpg. ✦ mark painted out on all 13 (originals in `raw/_orig/`).

**A1 · 16:9 · no attachment**
```
Luxury jewellery product photograph. A grand 22K yellow-gold Indian bridal necklace (a "Mayuri haar") with peacock-shaped links, a central ruby drop and a fine fringe of small pearls, resting centred on a three-tier round ivory podium (smooth matte stone, soft rounded edges). Behind it, a soft glowing arch of warm light like a halo frames the piece. Warm ivory backdrop (#F6EFE3), seamless, calm. Soft warm studio light from above, gentle soft shadows, the gold glowing richly with crisp detail on every link. The necklace and podium sit in the centre third of the frame with wide empty ivory space on both left and right sides. Photorealistic, high-end catalogue quality, sharp focus. No people, no faces, no hands, no mannequin, no text, no logos. Keep the bottom-right corner plain.
```

**A7 · 1:1 · attach a1-hero (same necklace)**
```
Use the attached image as the reference for the necklace. Show the exact same necklace: same peacock links, same pearl fringe along every link, same central ruby drop pendant with its pearl edge, same 22K yellow-gold colour. Now photograph it alone as a high-end product shot: front view, laid in its natural open shape, centred and filling most of the frame, every link sharp and detailed. Plain seamless warm ivory background (#F6EFE3), soft even warm studio light, a very faint soft shadow below. No podium, no halo, no props. Photorealistic, catalogue quality, ultra sharp. No people, no faces, no hands, no mannequin, no text, no logos.
```

**A2 · 1:1 · attach a1-hero (style only)**
```
Use the attached image only as a reference for the gold colour, light and ivory background. Do not copy the necklace or the podium. A 22K yellow-gold Indian bridal jewellery set floating in mid-air: a kundan and polki choker with rubies and emeralds, a matching long haar below it, and a pair of jhumka earrings either side, arranged neatly as one set. Plain seamless warm ivory background (#F6EFE3), soft warm studio light, a faint soft shadow below. Rich gold, crisp detail, photorealistic catalogue photo, centred with space around it. No people, no faces, no hands, no mannequin, no box, no text, no logos.
```

**A3 · 1:1 · attach a1-hero (style only)**
```
Use the attached image only as a reference for the gold colour, light and ivory background. Do not copy the necklace or the podium. A 22K antique-finish gold temple-style coin necklace (kasu mala): many round gold coins embossed with floral patterns, linked in a long graceful loop, with a large central floral pendant set with small rubies, floating in mid-air. Plain seamless warm ivory background (#F6EFE3), soft warm studio light, faint soft shadow below. Crisp gold detail, photorealistic catalogue photo, centred. No people, no faces, no hands, no deity figures, no mannequin, no text, no logos.
```

**A4 · 1:1 · attach a1-hero (style only)**
```
Use the attached image only as a reference for the gold colour, light and ivory background. Do not copy the necklace or the podium. A small, light 22K yellow-gold daily-wear set floating in mid-air: a delicate thin chain with a tiny teardrop pendant, a pair of small polished gold hoops and a pair of tiny gold studs, arranged neatly together. Plain seamless warm ivory background (#F6EFE3), soft warm studio light, faint soft shadow below. Minimal, elegant, photorealistic catalogue photo, centred. No people, no faces, no hands, no mannequin, no text, no logos.
```

**A5 · 1:1 · attach a1-hero (light and background only)**
```
Use the attached image only as a reference for the light and ivory background. Do not copy the necklace or the podium. A slim 18K rose-gold bracelet with a row of small round links and one tiny heart charm, floating in mid-air at a gentle angle. Plain seamless warm ivory background (#F6EFE3), soft warm studio light, faint soft shadow below. Soft pink-gold tone, crisp detail, photorealistic catalogue photo, centred. No people, no faces, no hands, no box, no ribbon, no text, no logos.
```

**A6a · 16:9 · attach a1-hero (style only)**
```
Use the attached image only as a reference for the gold colour and warm light. Do not copy the necklace, the podium or the halo. Top-down flat-lay of exactly six small 22K yellow-gold daily-wear pieces on smooth plain warm ivory paper (#F6EFE3), arranged in a neat grid of 3 across and 2 down with wide even empty space between every piece so none touch: a pair of tiny round studs, a pair of small hoops, a thin plain band ring, a fine chain with a tiny leaf pendant, a slim polished bangle, and a small floral nose pin. Each piece the same size in frame. Soft even warm light from above, very soft short shadows, crisp detail. Plain seamless background with no panel lines. Photorealistic catalogue photo. No people, no hands, no props, no text, no logos.
```

**A6b · 16:9 · attach a1-hero (style only)**
```
Use the attached image only as a reference for the gold colour and warm light. Do not copy the necklace, the podium or the halo. Top-down flat-lay of exactly six small 22K yellow-gold daily-wear pieces on smooth plain warm ivory paper (#F6EFE3), arranged in a neat grid of 3 across and 2 down with wide even empty space between every piece so none touch: a charm bracelet with three tiny charms, a pair of small drop earrings with a pearl each, a stackable ring with a tiny ruby, a delicate anklet chain, a short chain with small black and gold beads, and a round coin pendant on a fine chain. Each piece the same size in frame. Soft even warm light from above, very soft short shadows, crisp detail. Photorealistic catalogue photo. No people, no hands, no props, no text, no logos.
```

**A10-1 coins · 3:4 · attach a1-hero (gold colour only)**
```
Use the attached image only as a reference for the gold colour. Do not copy anything else. Top-down view of a deep dark brown velvet jewellery tray (#2B2117) holding a neat arrangement of small 22K gold coins and two tiny gold bars, embossed with simple floral patterns, softly glowing. Warm low festive light, a few soft golden bokeh lights at the edge. Rich, premium, photorealistic. No people, no hands, no deity figures, no text, no logos.
```

**A10-2 bridal · 3:4 · attach a1-hero (gold colour only)**
```
Use the attached image only as a reference for the gold colour. Do not copy anything else. A 22K gold kundan bridal choker with rubies and emeralds and matching jhumka earrings laid on a deep dark brown velvet jewellery tray (#2B2117), seen from slightly above. Warm low festive light, soft golden bokeh at the edge. Rich, premium, photorealistic. No people, no hands, no text, no logos.
```

**A10-3 temple · 3:4 · attach a1-hero (gold colour only)**
```
Use the attached image only as a reference for the gold colour. Do not copy anything else. A 22K antique-gold temple-style necklace with a large floral pendant and matching temple earrings laid on a deep dark brown velvet jewellery tray (#2B2117), seen from slightly above. Warm low festive light, soft golden bokeh at the edge. Rich, premium, photorealistic. No people, no hands, no deity figures, no text, no logos.
```

**A10-4 bangles · 3:4 · attach a1-hero (gold colour only)**
```
Use the attached image only as a reference for the gold colour. Do not copy anything else. A stack of six 22K gold bangles with fine filigree and small rubies, standing upright on a deep dark brown velvet jewellery tray (#2B2117), seen from slightly above. Warm low festive light, soft golden bokeh at the edge. Rich, premium, photorealistic. No people, no hands, no text, no logos.
```

**A10-5 gift box · 3:4 · attach a1-hero (gold colour only)**
```
Use the attached image only as a reference for the gold colour. Do not copy anything else. A small open dark brown velvet jewellery box (#2B2117) holding a 22K gold pendant on a fine chain and a matching pair of small earrings, on a deep dark brown velvet surface. Warm low festive light, soft golden bokeh at the edge. Rich, premium, photorealistic. No people, no hands, no ribbons, no text, no logos.
```

### Batch 2 · 2026-10-10 · Nano Banana Pro, ×4, attaching a7-product (stated as 2K; the files arrived at 1024×1024, A9 896×1200)

Files: `raw/a7a-pendant.jpg`, `a7b-clasp`, `a7c-side`, `a8-18k`, `a9-bust`. ✦ marks painted out (two on a7a, a7b, a8; originals in `raw/_orig/`). A8 vs A7: offset 0.00 / 0.01 px, scale 1.000 (no correction needed).

**A7a · 1:1**
```
Use the attached image as the reference: the exact same necklace, same 22K gold, same ruby drop pendant with its pearl edge and pearl fringe. Show a close macro view of the central ruby pendant and the two peacock links beside it, filling the frame, every detail of the gold work, the ruby and the pearls razor sharp. Plain seamless warm ivory background (#F6EFE3), soft warm studio light, very faint shadow. Photorealistic, catalogue quality. No people, no faces, no hands, no text, no logos.
```

**A7b · 1:1**
```
Use the attached image as the reference: the exact same necklace, same 22K gold, same peacock links and pearl fringe. Show a close view of the back of the necklace: the two ends of the chain with their small gold hook clasp and adjustable thread tassels, lying on plain seamless warm ivory background (#F6EFE3), soft warm studio light, very faint shadow. Photorealistic, razor sharp, catalogue quality. No people, no faces, no hands, no text, no logos.
```

**A7c · 1:1**
```
Use the attached image as the reference: the exact same necklace, same 22K gold, same peacock links, pearl fringe and ruby drop pendant. Show the whole necklace lying flat on plain seamless warm ivory background (#F6EFE3), photographed from a low three-quarter side angle so the depth and thickness of the gold work is visible. Soft warm studio light, soft shadow. Photorealistic, razor sharp, catalogue quality. No people, no faces, no hands, no text, no logos.
```

**A8 · 1:1 · attach only a7-product**
```
Edit the attached image only. Keep every pixel identical: same framing, same necklace shape and position, same pearls, same ruby, same background, same light and shadow. Change only one thing: the gold metal becomes 18K yellow gold, a slightly paler, softer, less saturated yellow-gold than 22K. Do not move, resize or redraw anything. No text, no logos.
```

**A9 · 3:4**
```
Use the attached image as the reference: the exact same necklace, same 22K gold, same peacock links, pearl fringe and ruby drop pendant. Show it worn on a plain jewellery display bust made of smooth matte ivory fabric: only the neck and shoulders, cut off cleanly above the neck, no head, no face, no features. The necklace sits naturally around the neck with the pendant resting at the centre of the chest. Plain warm ivory background (#F6EFE3), soft warm studio light, soft shadows. Photorealistic, catalogue quality, centred. No people, no head, no face, no hands, no text, no logos.
```

**V1 take 1 · Veo · push-in · REJECTED (2026-10-10).** The prompt for this take was not pasted into this record. Why rejected: a twinkling ✦ appeared in the frame and the camera zoomed in about 40 % (far beyond a slow push-in).

**V1 take 2 · Veo · locked camera, pearl sway · REJECTED (2026-10-10)** (as pasted). Why rejected: the pearls stretched into wind-blown strands and a glowing haze appeared. Decision: no Veo film for the hero; the hero is the A1 still + code.
```
Locked camera: no camera movement at all, no zoom, no pan. The necklace, the podium and the glowing halo stay exactly where they are. The only motion: the small pearls hanging along the necklace's fringe sway very gently and slowly, as if touched by a faint breath of air, catching soft highlights as they move, then settle back exactly to the start. The gold links and the ruby pendant stay still. The light stays exactly the same steady brightness and colour for the whole shot: no flicker, no flashes, no light sweep, no sparkles, no stars. Calm, premium, one continuous shot, no cuts. No fog, no haze, no particles, no people, no hands, no text.
```

Copy notes: Kanak Jewels · Jaipur · since 1987 (fictional). Prices in ₹ with sample rates; every gold-rate mention says "Sample rate · concept site". Footer: "Concept website by Triozen Tech · sample prices · not a real store".

### Round 2 notes (2026-10-10)
- Reel `day-16-kanak-r2`: **PASS** (28.7 s timeline after the 2.4 s loader, 1440×900, 7 hover moments).
- Holds are kept alive by a broad warm light band (`.kj-band`): hero (screen), clock, product and footer (gold, multiply). Collections drift inside every step (`--q`: giant word slides 160 px, main piece turns ±2.5° and grows 7 %, floats drift) so the pin never stands still.
- Loader: a broad gold glow swells behind the coin; the coin spins for 1.7 s so the first screen is never still.
- Product got a 4th creep stop so the record cursor reaches Add to bag.

### Round 3 notes (2026-10-10)
- Reel `day-16-kanak-r3`: **PASS**, 35.8 s, 1440×900, 7 hover moments. The second half has more time: Trust holds 1.5 s, Craft 1.5 s, Festive 0.9 s in + 1.1 s hold. The first half is unchanged.
- Hero: GOLD moved right (`pl-[31%]`) so the G is clear of the ruby pendant; the necklace still passes in front of the letters.
- Add to bag: a small copy of the piece pops out of the button and arcs into a fixed **Bag pill** (top right, shown once the hero has gone); the count rolls 0 → 1 with a gold ring flash (`BagPill.tsx`, event `kj:bag`). The record pointer rests on the right part of the buttons, never on their text.
- Transitions are built: X22 (Collections arrives with a feathered top edge) · X2 (the clock arrives on the lilac of Gifting, which washes to ivory) · X15 (a dark vignette closes round the necklace as the product arrives, then opens) · X18 (the 916 seal stamps down with a gold shock ring) · X1 (Craft slides up over Trust on a rounded top) · X14 (Craft's ivory bleeds through a warm haze into the ink band) · X29 (Reviews covers the band on an arch that flattens) · X40 (the footer is fixed under the page and fills the last screen).
- Section motion: M103 (ring turns, promises rise, rate pill pulses) · M251 (frame draws, tool writes in, card wash fills, label rises: five steps in turn) · M449 (stack fans into the arc) · M117 (cards rise, gold highlight sweeps behind each phrase) · M269 (outline draws).
- Images are decoded right after load (`Predecode.tsx`): the clock's 12 pieces had stalled the recorder for ~0.4 s as the pin arrived.


### Round 4 notes (2026-10-10)
- Reel `day-16-kanak-r4`: **PASS**, 37.3 s, 1440×900, 8 hover moments (+ the middle review card).
- Fixes from the Round 3 review:
  - Bag flight: a round ivory token with a gold rim (the piece inside) lifts off the pendant, rises through the gap between the name and the price, runs along the top edge above both and drops into the Bag pill. It never crosses the price card. The pill is bigger (18 px label, 44 px count) and the count lands while the product is still on screen.
  - Product drawer moved down to 130 px and the record creep cut to 8 px steps, so the pill never touches the drawer.
  - Stray ring: the paused `fromTo` painted the shock ring at once. Now `immediateRender: false`, and the stamp triggers on the seal itself, so the ring fires the moment the seal lands.
  - Footer: the outline draws in 1.6 s from the moment the footer slot enters; it is complete about 2 s before the reel ends.
- Details (Hover map): the karat switch rolls weight, rate, gold value, making, GST and both totals together (`Roll.tsx`, a gold flash while rolling); a filled pill slides under the chosen karat chip; Add to bag has a calm magnetic pull capped at 6 px (`useMagnetic.ts`); collection arrows tilt the piece toward them; festive cards rise with a deeper shadow and a gold hairline; review cards draw a gold hairline frame; cursor labels `View set` · `Shop` · `Zoom`; "Full details →" is a gold-underline link.
- The record pointer never rests on text: the chip and button stops sit on their right side, and the review stop sits in the card's bottom padding.
- The seal stamp lost its blur: animating `filter: blur` on the stamp stalled the recorder for 0.5 s.

### Round 4 review changes (2026-10-10)
- Reel `day-16-kanak-r4b`: **PASS**, 37.4 s, 1440×900, 8 hover moments (1 o'clock · clock Add to bag · 4 o'clock · loupe · 18K chip · product Add to bag · 2 festive cards).
- **Hero = HR10 + zoom into the ruby (option B, replaces the 5 % push-in).** The hero is now a 240vh pin.
  - **At rest:** the sweep, glints and sparkle play (1 s record hold).
  - **The zoom:** the camera scales 1 → 20 around the ruby, steady on a log scale, and drifts the ruby to the screen centre. ETERNAL/GOLD, the nav and the copy drift outward and fade. The photo (podium, halo) fades while a wide halo glow opens and fades.
  - **The A7a hand-over:** at about 2× the A7a close-up crossfades in, pixel-matched on the ruby. Measured: A1 ruby 53×72 px at (1200.5, 819.8) of 2400×1340; A7a ruby 151×205 px at (513.5, 588.2) of 1024², scale 0.351. It has a soft round mask, and the zoom finishes on it.
  - **The melt:** the ruby's red melts into the Bridal pink.
  - **Into Collections:** the band is pulled up one screen under the hero, see-through until its pin starts. Its content rises in over the melt, so there is no cut and no empty frame.
- **Collections:**
  - One record hold (0.6 s) in the middle of each collection.
  - The colour turns first (0.45 s). The old pieces then slide out left at full strength as the new ones slide in from the right (0.8 s push), so there is never a faded or pale frame.
  - The old name leaves before the new one slides in.
  - The pieces bob on the clock and a soft light band crosses, so the holds live.
- **Clock (M445 as a moving hand):**
  - The dial and pieces stay still. The long hand moves with the scroll and snaps to 1 → 3 → 4 o'clock. The short hand creeps at 1/12 of its pace.
  - The piece it stops on lights up and lifts. Its card sits right beside it on a gold hairline and slides to the next stop.
  - Record: the cursor lifts the 1 and 4 o'clock pieces and clicks Add to bag at 3 o'clock (Bag 0 → 1, "Added ✓").
- **Bag:** the pill owns the count. Every Add to bag sends `kj:add`, so the clock adds 1 and the product flight adds the 2nd.
- **Festive (M449 on hover):**
  - The cards rest in one stack and spread into the fan on hover. The hovered card grows 1.12× and lifts while its neighbours step aside 46 px.
  - The fan stays open while the pointer moves between cards and folds back 1.1 s after it leaves.
  - Record: the centre card, then the next one.
- Trimmed to stay inside 34–38 s: the review card hover is gone (it stays by hand), and the trust, craft, product and festive holds are slightly shorter.

### Round 5 · final (2026-10-10)
- Final reel `day-16-kanak-r5`: **PASS**, 37.4 s, 1440×900, 8 hover moments.
- Fixes:
  - **Melt:** the ruby now melts later (78 → 98 % of the hero pin), and Collections starts rising at 64 % of the screen. The Bridal set rises over the still-red ruby, so there is never a near-empty pink frame.
  - **Collection names:** every giant name is sized to fit the screen (DAILY WEAR overflowed at 280 px and its cut ends read as a second word). The new name enters only after the old one has left (0.3 s out, 0.36 s delay).
- Polish: small text raised to 12 px (clock card label, seal labels, nav tagline). No console errors; page width 1440 at every depth; images 2.9 MB in all, WebP.
- **2K close-ups (a7a, a7b, a7c, a8, a9): not in `raw/` yet** (still 1024 px / 896 px). The site uses the 1024 versions. When they land: re-clean the ✦ marks, re-measure A8 against A7, rebuild `mayuri-18k-cut`, `loupe-22k/18k`, the thumbs, views and try-on. Then re-measure the ruby in A7a for the hero zoom (`HaloHero.tsx`: 151×205 px at 513.5, 588.2 → scale with the new width).
- **Cover:** `recordings/day-16-cover.jpg` (also `cover.jpg` and `covers/day-16-cover.jpg`).
  - JEWELLERY in the gold accent `#a87a2a` (3.40:1, not darkened) + SCROLL WEBSITE.
  - The A7 necklace rises from the card top (`--object-cx 718 --object-bottom 668`), clear of ETERNAL and the nav.
  - The hero is the `?static=1` screenshot.
