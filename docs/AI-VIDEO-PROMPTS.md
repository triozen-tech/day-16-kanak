# AI video prompts for scroll sites

The scroll effect only looks good if the video is made **for scrolling**. The rules:

1. **One continuous shot.** No cuts, no scene changes, no flashes.
2. **The camera keeps moving smoothly the whole time** (push-in, orbit, fly-through). If nothing moves, scrolling feels dead.
3. **8 seconds, 16:9** (the website is landscape, even though the reel is filmed vertically). Longer isn't better — 8s becomes ~160 frames.
4. **Start and end on a good-looking frame.** The first frame is what people see before they scroll; the last is where the section ends.
5. **No text, no logos in the video.** We add text with code.
6. **Leave calm space on one side** (usually left) so headings stay readable.

Tool: **Google Flow** (Veo / Omni). Make the key image first with **Nano Banana Pro**, then turn it into video with the image as the **start frame**. For transformations (closed → open, assembled → exploded), also set the **End frame** — that's the most "wow" type of scroll video.

After generating: `npm run frames -- raw/hero.mp4 frames/<slug>-hero --zoom 1.2` (the zoom hides the AI watermark in the corner).

---

## Step 1: key image (always first)

```
[SUBJECT], [SETTING], [LIGHT / TIME OF DAY]. The subject sits on the right half of the frame, calm empty space on the left. Cinematic, [2–3 COLOUR WORDS] colour palette, photorealistic, shallow depth of field. no text, no logos
```

## Step 2: video templates

### A. Hero push-in (works for almost anything)
```
Start exactly from the reference image. Slow, smooth, continuous camera push-in toward the [SUBJECT] for the whole shot. Subtle natural motion: [dust drifting / steam rising / leaves moving / light flickering]. One continuous shot, no cuts, no camera shake, no sudden movements. no text, no logos
```

### B. Orbit / 360° product spin (for `frameScrub`)
```
Studio product shot of [PRODUCT] on a [dark / light] seamless background with soft [COLOUR] rim light. The camera orbits smoothly 360 degrees around the product at the same height and distance, constant speed, the product stays perfectly centred and does not change shape. One continuous shot. no text, no logos
```
*Tip:* if the AI can't keep the product consistent, generate a 3D model instead (see "3D model → frames" below).

### C. Fly-through (real estate, hotels, restaurants, cafés)
```
Start from the reference image. Smooth drone-like camera glide forward through [the entrance / the living room / the dining hall] toward [the window / the terrace / the bar], steady speed, slight rise at the end revealing [the view]. Warm interior lighting, one continuous shot, no people, no text
```

### D. Transformation — uses Start AND End frame (most "wow")
Make two images first (same angle, same light): **Start** = closed/assembled/raw, **End** = open/exploded/finished.
```
Smooth continuous transformation from the start frame to the end frame: [the watch case separates into floating layers / the sneaker's parts lift apart into an exploded view / the bottle opens and ingredients swirl out]. Camera stays still, slow and elegant, no cuts. no text
```

### E. Reveal from darkness (luxury, perfume, jewellery)
```
Start in near-total darkness. A slow beam of [warm / cool] light sweeps across [PRODUCT], gradually revealing its shape and details, camera slowly pushing in. Deep shadows, high contrast, one continuous shot. no text, no logos
```

### F. Ingredient / splash (drinks, food, skincare)
```
[PRODUCT] in the centre, fresh [INGREDIENTS] and droplets float and slowly rotate around it in mid-air, slow motion, camera slowly orbits. Bright [COLOUR] studio background, crisp lighting. One continuous shot. no text, no logos
```

### G. Store fly-through: outside → through the door → inside (shops, showrooms)
The favourite hero on the reference page (Emango, KTM, saree store). Make **two images** first, same style and light:
- **Start:** the store front at night: `[BRAND] flagship store exterior at night, glowing sign "[BRAND]", glass doors, [2 sports cars / palm trees / wet reflective street] in front, cinematic, [COLOURS]. no other text`
- **End:** the inside: `Inside the [BRAND] store, [racks of clothes / motorbikes on display / shelves of silk sarees], warm spotlights, polished floor, luxury retail interior, same colour grade`
```
Start frame to end frame. The camera glides forward smoothly toward the glass doors, the doors open, and the camera flies through into the store interior, continuing forward down the centre aisle. One continuous shot, steady speed, no cuts, no people walking. no text except the store sign
```
*Tip:* text in AI images often comes out wrong: regenerate until the sign is clean, or ask for "a glowing sign with no readable text" and put the name on with code.

### H. Exploded view (bikes, watches, sneakers, gadgets): start + end frame
- **Start:** `[PRODUCT] in a dark studio, three-quarter side view, dramatic rim light`
- **End:** same angle, `exploded technical view: every part of the [PRODUCT] floating apart in mid-air, evenly spaced, same lighting`
```
Smooth continuous transformation from the start frame to the end frame: the parts of the [PRODUCT] slowly separate and float apart into an exploded view. Camera still. One continuous shot. no text
```
Use with `FrameScrub` + callouts (labels like "DOHC ENGINE", "TRELLIS FRAME"), like the KTM reel.

## Cut-out product images (for colour switcher, pop cards, showcase)
`VariantHero`, `ProductGrid card="pop"` and `ProductShowcase` look best with **transparent background** product images.
1. Nano Banana Pro: `[PRODUCT] product photo, [angle], centred, on a plain pure white background, soft studio light, sharp, no shadow, no text`
2. Same prompt for each colour variant: `…same product, same angle, in [colour]`. Keep the angle identical.
3. Remove the background: remove.bg, Photoroom, Canva or Adobe Express (free) → download PNG.
4. Save as `public/images/<slug>/<name>.png` (Claude Code can convert to WebP).

## Section images (keep one mood)
Always add the same style words to every image of one site, e.g. `…, warm golden light, film grain, [COLOUR] colour grade`. For shop sections: `[model] wearing [item], full body, plain [colour] studio wall` gives consistent product-card photos.

---

## Niche starter ideas (hero video)

| Niche | Hero idea | Template |
|---|---|---|
| Car / bike | Vehicle driving along a scenic road at golden hour | A |
| Watch / jewellery | Exploded view of the watch parts | D |
| Sneakers | Shoe explodes into its layers | D |
| Perfume | Bottle revealed by a light beam | E |
| Energy drink / juice | Can with fruit and ice splash orbiting | F |
| Coffee / café | Fly-through the café to the espresso bar, steam rising | C |
| Restaurant | Push-in on a dish being plated, flames in background | A |
| Real estate / villa | Drone glide through the villa to the pool view | C |
| Hotel / resort | Glide from the lobby out to the infinity pool at sunset | C |
| Gym / fitness | Slow push-in on an athlete mid-lift, dramatic light | A |
| Headphones / tech | 360° orbit on dark stage with rim light | B |
| Skincare | Bottle with water droplets and petals floating | F |
| Travel agency | Aerial flight over mountains toward a lake | A |
| Movie / game fan page | Slow push-in on the hero character silhouette | A |

## 3D model → frames (when AI video can't keep the product consistent)

1. Make a clean studio photo of the product (plain background, whole product visible)
2. Turn it into 3D (Tripo AI, or free: Hunyuan3D on Hugging Face)
3. Render a turntable into frames (ask Claude Code: "render a 120-frame turntable of models/x.glb with dark stage lighting") — this is how the demo's car spin was made
