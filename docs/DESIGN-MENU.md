# Design menu — make every site look different

The engine is the same every day. **The design is not.** Before building, pick **one option from each menu** below and write the choices into `site/DESIGN.md` (Round 0 in `CLAUDE.md`).

**Uniqueness rule:** compare with the last 3 rows in `docs/SITES-LOG.md`. The new site must differ in **at least 6 of the 8 choices** (look, palette, type pair, nav, hero, section shape, card style, signature moment). Never reuse the same type pair two days in a row. **The hero and the signature moment must not repeat any earlier site's** (check every row of `docs/SITES-LOG.md`), and **the hero must not be a "shape grows to full screen / portal" opening** (window, arch, plate, card or doorway expanding to fill the screen).

**Live demos:** every effect from M38 on, the X6+ transitions and loaders I6–I9 run at **`/lab`** (hidden, noindex); reusable components are in `components/fx/` (sources and licences: `docs/SOURCES.md`).

**Desktop only (permanent rule):** every site is designed and built for **1440×900** only. No phone UI (no mobile layouts, no small-screen breakpoints/media queries, no phone-only components) and no phone checks. Phone notes anywhere in the menus are legacy and ignored.

**Motion:** how each section *moves* is picked separately from `docs/MOTION-MENU.md` (one code per section, no repeats, no plain fades) and written as the Motion map in `site/DESIGN.md`.

---

## 1. Look (overall art direction)

| # | Look | Feels like | Good for |
|---|---|---|---|
| L1 | **Dark luxury** | black, gold, serif caps, slow | cars, watches, jewellery, hotels |
| L2 | **Warm editorial** | cream paper, big serif, photos with white space | restaurants, cafés, fashion, interiors |
| L3 | **Candy playful** | saturated flat colour blocks, rounded, bouncy type | ice cream, drinks, snacks, kids |
| L4 | **Neon sport / tech** | near-black, one neon colour, wide/techno type | bikes, gyms, gaming, gadgets, EVs |
| L5 | **Clean white minimal** | white/grey, product floats, lots of air | electronics, skincare, streetwear |
| L6 | **Indian festive heritage** | maroon/red + gold, arches, script accents | sarees, jewellery, weddings, sweets |
| L7 | **Street / brutalist** | huge condensed caps, hard edges, stickers | sneakers, streetwear, music |
| L8 | **Soft pastel beauty** | blush, lilac, soft shadows, rounded | skincare, perfume, salons |
| L9 | **Organic nature** | deep greens, sand, texture, calm | tea, travel, wellness, farms |
| L10 | **Bold colour-block retail** | one loud brand colour filling whole sections | fashion stores (Emango red), sale campaigns |

**More looks (added before Day 8).** Same rules; the extra column says what clashes with each look.

| # | Look | Feels like | Good for | Avoid with |
|---|---|---|---|---|
| L11 | **Editorial magazine** | a printed glossy: big serif headlines, columns, drop caps, page numbers, captions under photos | fashion labels, boutique hotels, interiors, jewellery | neon accents, rounded candy cards, sticker badges |
| L12 | **Brutalist mono** | raw grid, monospace everywhere, thick rules, visible structure, one hard accent | streetwear drops, tech tools, music labels, galleries | soft shadows, script fonts, pastel palettes |
| L13 | **Soft clay 3D** | matte clay-like 3D objects, soft daylight shadows, rounded everything, calm colours | kids' brands, wellness apps, snacks, home goods | hard brutalist grids, dark luxury black, thin hairline cards |
| L14 | **Cinematic letterbox** | black bars top and bottom, film-still framing, subtitles, slow fades, grain | cars, watches, travel, perfume, film-style launches | busy shop grids in the hero, bright flat colour blocks |
| L15 | **Swiss poster** | strict grid, huge grotesk type, flush-left, one or two bold colours, numbers as graphics | architecture, design studios, sports clubs, events, galleries | ornaments, script accents, photo collages |
| L16 | **Glass & chrome** | frosted glass panels, chrome/metal gradients, reflections, cool light | tech hardware, EVs, premium audio, fragrance | warm paper textures, hand-drawn elements, kraft/torn edges |
| L17 | **Symmetric monument** | dead-centre symmetric compositions, muted cream + institutional blue, one violent red accent, hard cuts | watches, fragrance, architecture, hotels | playful/kids brands |
| L18 | **Clinical noir** | near-monochrome ash and steel (saturation ≤ 30%), amber only on interactive things, fade-through-black chapters | skincare science, audio, menswear, spirits | candy, festive |
| L19 | **Atmospheric sublime** | huge empty haze, forms emerge slowly, thin wide-tracked caps, warm dust against cold steel | outdoor gear, EVs, travel, mineral water | busy retail grids |
| L20 | **Storybook geometry** | hard-edged pastel blocks butting together, one pastel per chapter, small centred type, sideways page wipes | bakeries, boutique hotels, premium kids | luxury noir |
| L21 | **Mid-century poster** | flat geometric shapes (circle, half-moon), max 3 colours, cut-paper edges, type set inside the shapes, no gradients/shadows | coffee, vinyl, cinema, heritage FMCG | photo-led tech |
| L22 | **Bauhaus primaries** | red/blue/yellow on off-white, hard 4px offset shadows, instant press states, dot-grid sections | stationery, toys, design tools, sneakers | soft beauty |
| L23 | **Halftone / dither print** | photos and gradients rendered as dot screens or dithering, one ink + paper | streetwear drops, music, magazines | glossy luxury |
| L24 | **Art-directed collage** | torn/cut edges, scanned textures, scale clashes, layered media | fashion edits, festivals, snacks | minimal tech |
| L25 | **Surreal product world** | the product lives in one impossible world with its own props and physics | drinks, cosmetics, sneakers | finance/trust brands |
| L26 | **Vintage analog film** | faded cream, sepia and muted teal, grain, light leaks, gate weave, polaroid frames | cafés, vinyl, vintage fashion, cameras | futuristic tech |

Source for L17–L26: open-source design skills read on GitHub (MIT), see `docs/SOURCES.md` → "Ideas from design skills". Brand-named styles from those repos were skipped.

## 2. Palettes (copy into `site/site.ts` → theme)

| Name | bg | surface | text | muted | accent |
|---|---|---|---|---|---|
| Gold noir | `#0b0907` | `#16120e` | `#ede3d1` | `#a89c8a` | `#c9a063` |
| Rose noir | `#0a0909` | `#151313` | `#f3ebe7` | `#a8998f` | `#d4a59a` |
| Cream editorial | `#f6f1e9` | `#ffffff` | `#1d1a16` | `#6b645b` | `#8b5e34` |
| Candy cocoa | `#7a4a2b` | `#8a5634` | `#fff8ef` | `#f1d9bf` | `#ffd23f` |
| Neon lime | `#0a0a0a` | `#141414` | `#f5f5f5` | `#9a9a9a` | `#c6ff00` |
| Racing red | `#0b0b0c` | `#151517` | `#f4f4f5` | `#a1a1aa` | `#e0262c` |
| Maroon gold | `#2a0b10` | `#3a1218` | `#f7e9d7` | `#cdb49a` | `#d4a24c` |
| Retail red | `#c8102e` | `#a50d26` | `#fff5f5` | `#ffd1d6` | `#111111` |
| Clean white | `#f5f5f4` | `#ffffff` | `#111111` | `#6b6b6b` | `#111111` |
| Blush | `#fbf1ef` | `#ffffff` | `#2b1d1f` | `#7d6a6c` | `#c86b7a` |
| Forest sand | `#12201a` | `#1a2c24` | `#efe8d8` | `#a9b3a1` | `#d8b77a` |
| Ocean | `#06141f` | `#0c2130` | `#e8f1f6` | `#8fa6b5` | `#3fc1ff` |
| Sunset orange | `#fff6ee` | `#ffffff` | `#1f140c` | `#6e5c4d` | `#f26a1b` |
| Hazard concrete | `#D9D7D0` | `#C7C5BD` | `#141414` | `#4A4945` | `#FF4D00` (fills / large type only: 2.3:1 on bg) |
| Monument red | `#E8E0D4` | `#DDD3C4` | `#1C2430` | `#55606B` | `#C41E3A` |
| Clinical noir | `#1F2022` | `#2C2C2C` | `#E6E6E3` | `#9AA6B0` | `#C9A96E` |
| Haze ochre | `#1E2328` | `#2A3037` | `#E4D8C2` | `#9DB2C0` | `#B8956A` |
| Macaron block | `#F4E4BC` | `#A8D5BA` | `#2A2420` | `#5E5248` | `#C2575B` (+ blocks `#D4A5A5` `#A8C8EC` `#C9B8D8`) |
| Leaf press | `#F3F1E7` | `#FAF8EE` | `#1A1D17` | `#5B6152` | `#4A6B3A` |
| Control room | `#0A0F1E` | `#121A30` | `#E6ECF5` | `#8C9AB5` | `#4FE0B0` |
| Bauhaus primaries | `#F0F0F0` | `#E0E0E0` | `#121212` | `#555555` | `#D02020` (+ `#1040C0` `#F0C020`) |
| Mustard teal | `#EBE3D2` | `#D9A441` | `#1A1A18` | `#5A554B` | `#3D6E70` (on the mustard surface use the text colour) |
| Press yellow | `#F1E73C` | `#FFF6A6` | `#101010` | `#45410F` | `#EF3D21` (large type / fills only) |
| Deep-sea coral | `#07182B` | `#0F2740` | `#EFF4EF` | `#9DB0C2` | `#FF714C` |
| Faded film | `#F5E6C8` | `#EBD5AE` | `#2B2522` | `#6A5B4E` | `#4A7B7C` |
| Ballpoint sketch | `#FDFBF7` | `#E5E0D8` | `#2D2D2D` | `#5E5A55` | `#FF4D4D` (+ ink blue `#2D5DA1`) |

Rules: one accent. `muted` must be readable (contrast ≥ 4.5:1 on bg). **Category-reflex check:** if someone could guess the palette from the product category alone (green for organic, gold for luxury), rework it. Cream bg + brass/clay/oxblood accent + espresso text is the most common AI default for premium consumer brands: never two sites in a row. A section can flip to its own colour (e.g. a red band on a white site) — that's a design choice, write it in DESIGN.md.

## 3. Type pairs

Install: `npm i <package>` → import in `site/fonts.ts` → use the family name in `site/site.ts`.

| # | Headings | Body | Mood |
|---|---|---|---|
| T1 | Cormorant Garamond `@fontsource/cormorant-garamond` | Inter `@fontsource-variable/inter` | classic luxury |
| T2 | Playfair Display `@fontsource-variable/playfair-display` | DM Sans `@fontsource-variable/dm-sans` | editorial, fashion |
| T3 | Instrument Serif `@fontsource/instrument-serif` | Instrument Sans `@fontsource-variable/instrument-sans` | modern editorial |
| T4 | Bodoni Moda `@fontsource-variable/bodoni-moda` | Manrope `@fontsource-variable/manrope` | high fashion, perfume |
| T5 | Italiana `@fontsource/italiana` + Pinyon Script `@fontsource/pinyon-script` accents | Figtree `@fontsource-variable/figtree` | romantic, bridal, saree |
| T6 | Fraunces `@fontsource-variable/fraunces` | Outfit `@fontsource-variable/outfit` | warm, food, café |
| T7 | Anton `@fontsource/anton` | Space Grotesk `@fontsource-variable/space-grotesk` | sport, loud |
| T8 | Bebas Neue `@fontsource/bebas-neue` | Inter Tight `@fontsource-variable/inter-tight` | streetwear, cinema |
| T9 | Orbitron `@fontsource-variable/orbitron` or Michroma `@fontsource/michroma` | Sora `@fontsource-variable/sora` | tech, bikes, EV |
| T10 | Unbounded `@fontsource-variable/unbounded` | Plus Jakarta Sans `@fontsource-variable/plus-jakarta-sans` | playful tech, startups |
| T11 | Bricolage Grotesque `@fontsource-variable/bricolage-grotesque` | Onest `@fontsource-variable/onest` | friendly modern |
| T12 | Fredoka `@fontsource-variable/fredoka` or Lilita One `@fontsource/lilita-one` | Nunito `@fontsource-variable/nunito` | candy, kids, ice cream |
| T13 | Syne `@fontsource-variable/syne` | Inter `@fontsource-variable/inter` | creative studio, art |
| T14 | Cinzel `@fontsource-variable/cinzel` | EB Garamond `@fontsource-variable/eb-garamond` | heritage, temples, wine |
| T15 | Big Shoulders Display `@fontsource-variable/big-shoulders-display` | Rethink Sans `@fontsource-variable/rethink-sans` | industrial, gyms |
| T16 | Abril Fatface `@fontsource/abril-fatface` | Poppins `@fontsource/poppins` | bold retail, sale |
| T17 | Rozha One `@fontsource/rozha-one` | Baloo 2 `@fontsource-variable/baloo-2` | Indian sweets, festive |
| T18 | Archivo Black `@fontsource/archivo-black` | Archivo `@fontsource-variable/archivo` | clean bold commerce |
| T19 | DM Serif Display `@fontsource/dm-serif-display` | DM Mono `@fontsource/dm-mono` | editorial magazine (L11) · avoid with candy looks |
| T20 | IBM Plex Mono `@fontsource/ibm-plex-mono` | IBM Plex Sans `@fontsource-variable/ibm-plex-sans` | brutalist mono, tech tools (L12) · avoid with luxury |
| T21 | Schibsted Grotesk (black weights) `@fontsource-variable/schibsted-grotesk` | Hanken Grotesk `@fontsource-variable/hanken-grotesk` | Swiss poster, studios, sport (L15) · avoid with script accents |
| T22 | Gloock `@fontsource/gloock` | Urbanist `@fontsource-variable/urbanist` | glass & chrome, cinematic, fragrance (L14/L16) · avoid with kraft/rustic |
| T23 | Poiret One `@fontsource/poiret-one` (≥ 48px only, it is thin) | Didact Gothic `@fontsource/didact-gothic` | art deco 1920s: hotels, perfume, jewellery |
| T24 | Libre Bodoni `@fontsource-variable/libre-bodoni` | Public Sans `@fontsource-variable/public-sans` | refined print magazine |
| T25 | Syncopate `@fontsource/syncopate` | Space Mono `@fontsource/space-mono` | wide kinetic tech: EVs, audio |
| T26 | Russo One `@fontsource/russo-one` | Chakra Petch `@fontsource/chakra-petch` | esports / action: gaming gear, energy |
| T27 | Barlow Condensed `@fontsource/barlow-condensed` | Barlow `@fontsource/barlow` | athletic condensed: sportswear, gyms |
| T28 | Lexend Mega `@fontsource-variable/lexend-mega` | Public Sans `@fontsource-variable/public-sans` | loud geometric neo-brutalist: snacks, apps |
| T29 | Calistoga `@fontsource/calistoga` | Work Sans `@fontsource-variable/work-sans` | warm boutique: cafés, bakeries |
| T30 | Kalam `@fontsource/kalam` | Patrick Hand `@fontsource/patrick-hand` | hand-drawn: kids, stationery (the ballpoint sketch palette) |

A script font (Great Vibes, Pinyon Script, Caveat, Kaushan Script) may be used for **one highlighted word** per heading — never for paragraphs.

## 4. Nav style

| # | Nav | Pattern |
|---|---|---|
| N1 | Transparent bar → solid on scroll | `Nav.tsx` |
| N2 | Floating centre pill, active link filled | `NavPill.tsx` |
| N3 | Split: links left · logo centre · icons right | custom |
| N4 | Minimal: logo + "Menu" button → full-screen menu with big links | custom |
| N5 | Offer ticker on top + shop bar (search, cart count) | `Ticker.tsx` + custom |
| N6 | Left vertical rail (logo rotated, dots) | custom |
| N7 | Bottom floating dock (appears after hero), can say "You are in: <room>" | `FloorDock.tsx` |
| N8 | **Index tab**: a slim vertical tab on the right edge; opening it slides out a numbered index of sections (like a magazine contents page) · good for: editorial, studios · avoid with: N6 rail | custom |
| N9 | **Command bar**: a centred "Search or jump to…" pill; typing/clicking opens a list of sections and products (keyboard-style) · good for: tech, tools, electronics · avoid with: luxury looks | custom |
| N10 | **Corner logo + progress ring**: logo top-left, a round scroll-progress ring top-right that doubles as the menu button · good for: cinematic, perfume, cars · avoid with: shop-heavy pages (no cart) | custom |
| N11 | **Split bars**: the nav is two short bars, links left and cart right, that slide apart from the centre as you scroll, leaving the middle clear for the hero · good for: fashion, sneakers · avoid with: N3 split | custom |

## 5. Hero layout

| # | Hero | Pattern / asset |
|---|---|---|
| H1 | Full-screen scroll video + timed captions | `FrameHero` + hero video |
| H2 | **Fly-through**: outside the store → through the door → inside | `FrameHero` + fly-through video (AI-VIDEO-PROMPTS G) |
| H3 | Colour switcher: product changes colour + glow | `VariantHero` + cut-out images |
| H4 | Split: text left, product right on a flat colour block, flavour pills | custom (Creamsy) |
| H5 | Giant brand word behind a centred product | custom |
| H6 | Wordmark centred over a looping video, bottom offer strip | custom + video |
| H7 | Editorial collage: 3 images at different sizes + serif headline | custom |
| H8 | Product on a pedestal + spec bar underneath | custom + cut-out |
| H9 | **Word-mask video hero**: a huge brand word is a window; the video plays *inside the letters*, then the letters open to the full video with the scroll | custom (SVG/CSS text mask over `FrameHero`) · good for: drinks, sport, fashion launches · avoid with: thin serif type (letters too narrow) |
| H10 | **Split-reveal hero**: the screen splits along a line (vertical, diagonal or the product's edge) and the two halves slide apart to reveal the product behind | custom (two clipped halves, scrub) · good for: tech, cars, beauty · avoid with: cluttered photos (the split reads as a glitch) |
| H11 | **Zoom-through-object hero**: the camera flies *through* the product (into a bottle neck, through a shoe's eyelet, into a lens) and lands in the next scene. A fly-through, never a frame growing to full screen | `FrameHero` + a "dive" video (AI-VIDEO-PROMPTS) · good for: drinks, optics, perfume, cars · avoid with: products with no opening/depth |
| H12 | **Stacked-cards hero**: 3–5 product cards stacked at angles; they fan out, then the top card settles as the hero | custom (GSAP, M40/M51 helpers) · good for: collections, sneakers, skincare ranges · avoid with: a single hero product |
| H13 | **Circular iris hero**: the product lives in a round viewfinder whose blades open and close like a camera aperture; the circle **stays a circle** (it never grows to full screen) | custom (SVG blades + clip-path) · good for: cameras, watches, eyewear, cosmetics · avoid with: X6 iris on the same page |
| H14 | **Horizontal filmstrip hero**: a strip of frames slides sideways with the scroll; the centre frame is sharp and big, the others small and dim | custom (M41 helpers) · good for: travel, fashion lookbooks, film/events · avoid with: M41 as a later section on the same page |

## 6. Section shape (how sections meet)

S1 straight lines · S2 waves (`WaveDivider shape="wave"`) · S3 soft curves / arches (`curve`, `arch`) · S4 torn paper (`torn`) · S5 rounded panels (each section is an inset rounded card) · S6 tilted (`tilt`) · S7 full-colour bands that alternate · S8 **doorways**: each section opens through a lit doorway that grows to full screen (`DoorwayRooms.tsx`)

More shapes (each: good for · avoid with):
- **S9 letterbox bars**: black bars close in between sections like a film cut · cinematic, cars, perfume · avoid with candy/pastel looks
- **S10 stepped / staircase edges**: sections meet on a stepped edge (3–4 steps) that shifts as you scroll · Swiss, architecture, sport · avoid with soft clay
- **S11 overlapping sheets**: each section is a sheet laid slightly over the last with a soft shadow and a few degrees of rotation · editorial, stationery, food · avoid with brutalist mono
- **S12 pixel/grid edge**: the boundary is a row of squares that breaks up (pairs with X8) · tech, gaming, electronics · avoid with luxury serif looks

## 7. Card style

C1 sharp + thin border (luxury) · C2 rounded + soft shadow · C3 **pop-out** product above a white card (`ProductGrid card="pop"`) · C4 tall photo + text below (`card="photo"`) · C5 glass / blurred · C6 **arch-top** images (saree "Six moods") · C7 polaroid · C8 circles (category bubbles)

More cards (each: good for · avoid with):
- **C9 ticket / stub**: a perforated edge, a tear-off stub with the price, serial number · events, cinema, travel, drops · avoid with luxury jewellery
- **C10 spec sheet**: a mono label grid (name, size, weight, price) under a cut-out product, hairline rules · tech, sneakers, brutalist mono · avoid with soft clay
- **C11 clay tile**: thick rounded tile with a soft inner shadow, product sitting *in* it · kids, snacks, wellness · avoid with dark luxury
- **C12 chrome bezel**: a card framed by a thin metallic gradient border with a moving reflection (M49) · tech, audio, EVs, fragrance · avoid with warm editorial

## 8. Signature moment (pick ONE hero moment + max 2 supporting)

| Moment | Pattern |
|---|---|
| Scroll-scrubbed video | `FrameHero` |
| Exploded parts with labelled callouts | `FrameScrub` + exploded video |
| 360° product spin with specs | `FrameScrub` |
| Colour switch | `VariantHero` |
| Curved drifting gallery | `CurvedGallery` |
| Pinned sideways gallery | `HorizontalGallery` |
| Expanding strips | `ExpandingPanels` |
| Product showcase that swaps by itself | `ProductShowcase` |
| Word-by-word statement | `Statement` |
| Endless big-word marquee | `Marquee` |
| Stacking cards (each card pins and the next slides over) | custom |
| Image reveal through big text (text mask) | custom |
| Walk-through rooms: doorway reveal, the whole page takes each room's light + a dock that says which room you're in | `DoorwayRooms.tsx` + `FloorDock.tsx` |
| Bento whose tiles light up in turn (border beam + spotlight) | `BeamBento.tsx` |
| WebGL picture moments (liquid reveal, displacement swap, flowmap, zoom blur, RGB shift): see MOTION-MENU M38/M55/M56/M66/M67 and `/lab` | `components/fx/gl.tsx` |
| Particle word / morphing words as the brand moment | `components/fx/text.tsx` (M45), `more.tsx` (M59) |

## 9. Section ideas for the rest of the page

Shop-style (clients picture their business): `ProductGrid` (row / grid) · `Bento` offers · category circles · "Shop the look" · new arrivals · bestsellers · `Ticker` offers · store locations · `Faq` · newsletter band · `PolaroidWall` / `Testimonials` · `WordmarkFooter` / `Footer`

Cinematic: `Statement` · `Stats` · `Split` story · `Parallax` band · `Features` · `Cta`

Aim for **9–12 sections**: 1 hero + ~3 cinematic + ~5 shop-style + footer.

## 9b. Travelling / floating object (site pattern, codes F1–F8)

One product stays on screen and **travels across the sections** (spins in the hero, flies to the left while text appears on the right, turns sideways, lands in a shop card, settles in the closing). Pick **one** carrier (F1, F3 or F6) + optional F7/F8. Live: `/lab/travel/f1 · f3 · f6` (+ f3t, f3r to compare 3D engines). Motion details and rules: MOTION-MENU section K.

| Code | Pattern | Looks like | Good for | Avoid with |
|---|---|---|---|---|
| F1 | **Waypoint travel (PNG)** | a transparent cut-out (front, 3/4, side, back crossfaded) glides between anchor spots | any packaged product (cans, bottles, jars, shoes); the lightest option | photo-heavy sections behind it (the cut-out edge shows) |
| F2 | **Pinned 3D turn** | the 3D product pinned centre, turning/tilting while specs scroll past | tech, watches, audio, sneakers ("spec stage") | a pinned hero video in the same stretch |
| F3 | **3D travel** | the 3D model moves, turns and scales from section to section | drinks, cosmetics, gadgets with a good model | thin/complex models (hair, fabric): use F1 |
| F4 | **Camera fly-through** | the camera circles the product and dives into it along a path | cars, architecture, perfume, launch films | busy shop sections right after (needs a calm landing) |
| F5 | **Fold / assemble** | the product's parts come together (or a box unfolds) as you scroll | packaging, furniture, gadgets, gift boxes | products with no parts/layers |
| F6 | **Simple 3D orbit** | `<model-viewer>` turning the product with the scroll in one section | a quick 3D moment with almost no code | sites already heavy (≈ +336 KB) |
| F7 | **Floating ingredients** | 5–12 small cut-outs (fruit, ice, leaves) float around the product at 3 depths | drinks, food, skincare, perfume notes | minimal luxury looks (feels busy) |
| F8 | **Land in UI** | the product flies into the cart pill / card on "Add to cart", the count bumps | every shop site (a filmed "add to cart" moment) | sites with no cart |

## 10. Loader / intro

I1 letters rise then wipe (engine default) · I2 brand pattern fills the screen, then zooms out (e.g. paisley for sarees) · I3 counter 0 → 100 · I4 logo drawn as a line · I5 circle expands from the centre

More loaders (live in `/lab`; each: good for · avoid with):
- **I6 pixel transition**: a grid of cells covers the screen in a random wave, the page swaps in, cells clear from the centre (`components/fx/more.tsx` PixelLoader) · tech, gaming, electronics · avoid with L1/L11 luxury
- **I7 rapid layers**: 3–4 colour/photo layers wipe in fast, ending on the hero title (M63, RapidLayers) · fashion drops, sport, launches · avoid with slow calm looks
- **I8 particle word**: dots gather into the brand name, then blow outward as the page opens (M45, ParticleText) · tech, beauty, events · avoid with busy photo heroes
- **I9 shutter/iris**: camera aperture blades close on the logo and open onto the hero · cameras, eyewear, cinematic · avoid with H13 iris hero (same idea twice)
- **I10 preloader-to-hero overlap**: a counter capped at 1.6 s that waits for fonts + the hero image, then its plate wipes off (clip-path) while the hero title is already staggering in (≥ 0.3 s overlap, never a gap) · any site · avoid with a long brand intro

---

## How "restyle a pattern" works

Patterns in `components/patterns/` are **starting points**. For each one used, copy it into `site/components/`, rename it for the brand (e.g. `FlavourCards.tsx`) and change at least **3** of: layout proportions, type scale/case, card shape, colours used, spacing, image shape, the motion. Two sites using `ProductGrid` must not look alike.
