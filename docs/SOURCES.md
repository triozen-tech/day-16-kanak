# Sources — effects we rebuilt from open source

Rule: we only take code ideas from sources licensed **MIT, ISC or Apache-2.0**, verified from the actual LICENSE file. We **rebuild** each effect in our engine (GSAP + Lenis + OGL, `components/fx/`), we never paste whole libraries. Copyright notices: `THIRD-PARTY-NOTICES.md` (repo root). Live demos: `/lab`.

## Checked and NOT used (licence does not qualify)

| Source | Licence (verified) | Why not |
|---|---|---|
| React Bits (reactbits.dev, DavidHDev/react-bits) | "MIT + Commons Clause" (`LICENSE.md`) | forbids redistributing the components "alone, in a bundle, or as a ported version"; a rebuild in our kit is a ported version. Ideas only, no code |
| Aceternity UI (ui.aceternity.com) | proprietary "Aceternity License" (`/licence`) | no redistribution "regardless of modifications", no derivative templates |
| Codrops repos without a LICENSE file (e.g. LiquidDistortion, RainEffect, TextDistortionEffects, InfiniteTubes, MotionBlurEffect, ImageTrailEffects …) | none = all rights reserved | not allowed; their ideas are covered by MIT code below |
| GSAP showcase (gsap.com/showcase) | not a code source | ideas only |

OGL (our WebGL runtime, `npm i ogl`) is **Unlicense** (public domain). We use it as a library, not as a source of copied effects.

## Used (19 effects)

| # | Effect → our code | Original | Licence (verified) | What we changed |
|---|---|---|---|---|
| 1 | Scroll blur typography → **M57** `ScrollBlurText` | github.com/codrops/ScrollBlurTypography (`js/effect-*/blurScrollEffect.js`) | MIT © 2009–2024 Codrops | GSAP SplitText (chars) instead of their splitter; one scrubbed tween with stagger; Lenis-driven; React component |
| 2 | Type shuffle → **M58** `TypeShuffle` | github.com/codrops/TypeShuffleAnimation | MIT © 2009–2022 Codrops | SplitText chars + one GSAP timeline per run; accent colour cell via CSS class; loops only while on screen |
| 3 | Morphing text → **M59** `MorphingWords` | github.com/magicuidesign/magicui (`apps/www/registry/magicui/morphing-text.tsx`) | MIT © Magic UI | no React state per frame: GSAP ticker writes styles; hold between words; paused off screen |
| 4 | Flickering grid → **M60** `FlickeringGrid` | magicui `flickering-grid.tsx` | MIT © Magic UI | GSAP ticker instead of its own rAF; DPR-aware resize; pauses off screen via our `useTicker` |
| 5 | Light rays → **M61** `LightRays` | magicui `light-rays.tsx` | MIT © Magic UI | rebuilt with GSAP yoyo tweens (no framer-motion); accent-tinted CSS rays |
| 6 | Pixelated image loading → **M43** `Pixelate` | github.com/codrops/ImagePixelLoading (`js/content.js`) | MIT © 2009–2022 Codrops | scrubbed by scroll and **continuous** (not stepped, so never frozen on camera) + slow zoom |
| 7 | Clip-path double image / unreveal → **M62** `ClipDouble` | github.com/codrops/DoubleImageHoverEffects · github.com/codrops/UnrevealEffects | MIT © 2009–2022 / 2009–2021 Codrops | plays on entering (hands-free, no hover); one GSAP timeline; accent panel |
| 8 | Pixel transition → loader **I6** `PixelLoader` | github.com/codrops/PixelTransition | MIT © 2009–2023 Codrops | GSAP grid stagger from random, clear from centre; brand word in between; loop for the demo |
| 9 | Rapid layers → **M63** / loader **I7** `RapidLayers` | github.com/codrops/RapidLayersAnimation | MIT © 2009–2020 Codrops | clip-path layers in one timeline, ending on a masked title |
| 10 | Magnetic buttons → **M71** `MagneticButton` | github.com/codrops/MagneticButtons | MIT © 2009–2020 Codrops | smooth (no elastic spring, house style); label parallax; virtual orbiting pointer in record mode |
| 11 | Shimmer button → **M64** `ShimmerButton` | magicui `shimmer-button.tsx` | MIT © Magic UI | pure CSS conic spark (no Tailwind keyframe plugin), accent colour |
| 12 | Gooey cursor → **M65** `GooeyCursor` | github.com/codrops/GooeyCursor (`js/cursor.js`) | MIT © 2009–2022 Codrops | cell grid + goo filter in React; scripted figure-eight pointer for filming |
| 13 | Displacement-map hover transition → **M66** `DisplaceSwap` | github.com/robin-dela/hover-effect | MIT © 2018 Robin Delaporte, Aarni Koskela | OGL instead of three.js; procedural noise instead of a displacement image; auto-cycles 3 images by time |
| 14 | Flowmap liquid trail → **M67** `Flowmap` | github.com/martinlaxenaire/curtainsjs (`examples/ping-pong-shading-flowmap`) | MIT © 2018 Martin Laxenaire (`LICENSE.txt`) | OGL's built-in Flowmap; scripted pointer path when nobody moves the mouse |
| 15 | RGB shift → **M55** `RGBShift` | github.com/mrdoob/three.js (`examples/jsm/shaders/RGBShiftShader.js`) | MIT © 2010–2026 three.js authors | amount driven by Lenis scroll velocity, idle shimmer so it is never still |
| 16 | Scroll bulge / stretch → **M68** `ScrollBulge` | curtainsjs `examples/post-processing-scroll-effect` | MIT © 2018 Martin Laxenaire | single-pass shader on one picture (no post-processing chain); velocity from Lenis |
| 17 | Zoom blur → **M56** `ZoomBlur` | github.com/evanw/glfx.js (`src/filters/blur/zoomblur.js`) · gl-transitions `CrossZoom.glsl` | MIT © 2011 Evan Wallace · MIT © 2017-present gl-transitions contributors | written as a 2-image scroll-scrubbed transition, 24 jittered taps, cover-fit |
| 18 | Pixelize transition → **X8** `PixelDissolve` | github.com/gl-transitions/gl-transitions (`transitions/pixelize.glsl`) | MIT © 2017-present gl-transitions contributors | progress from the scroll; cover-fit textures |
| 19 | Ripple + film grain → **M69** `Ripple`, **M70** `FilmGrain` | gl-transitions `ripple.glsl` · three.js `examples/jsm/shaders/FilmShader.js` | MIT (as above) | ripple loops by time from the centre; grain + breathing vignette on a picture |

Also built (no third-party code, our own): M38 liquid reveal, M39 curved-path text, M40–M42, M44–M54, X6, X7, X9, X10, X11 (shader written for the kit), loaders I8–I9 (menu entries).

---

## Web research (checked 2026-10-03, live pages + GitHub API + npm; not from memory)

### Libraries and tools: what we looked at, what we chose

| Item | Repo | Licence (verified) | Version · last update | Size (gzip) | Next + Lenis | Chosen? Why |
|---|---|---|---|---|---|---|
| GSAP | github.com/greensock/GSAP | GSAP Standard "no charge" licence (Webflow; client/commercial sites OK; not in competing no-code builders) | 3.15.0 · 2026-04-13 | core 27 KB | yes (already in the kit) | **Use** (all plugins free; never ScrollSmoother with Lenis) |
| React Bits | github.com/DavidHDev/react-bits | MIT **+ Commons Clause** | pushed 2026-10-03 | varies | yes (client) | **Ideas only**: no ported versions in the kit |
| Magic UI | github.com/magicuidesign/magicui | MIT | pushed 2026-09-20 | copy-paste registry | yes; 32 of 75 components need `motion` | **Use the non-motion ones**, rebuilt in GSAP |
| Aceternity UI | ui.aceternity.com/licence | proprietary "Aceternity License" | — | — | needs motion | **Ideas only** |
| Motion Primitives | github.com/ibelick/motion-primitives | MIT (but depends on `motion`) | pushed 2026-09-28 | + motion | yes | **Ideas only** (no second animation runtime; no framer-motion) |
| Codrops, 10 newest repos | github.com/codrops | 9 × MIT (RotatingOnScrollAnimations, EaseReverseClipMenu, ScrollTextMotion, ElasticGridScroll, coding-challenge-planner, 3DCarousel, RepeatingImageTransition, OneElementScroll, Staggered3DGridAnimations); BalloonButton: **no licence** | 2024-10 → 2026-06 | — | mostly GSAP + Lenis already | **Use the MIT ones** (credit); BalloonButton ideas only |
| OGL | github.com/oframe/ogl | Unlicense (npm; no LICENSE file in the repo) | 1.0.11 · 2025-01 | ~34 KB (whole) | yes (client) | **Use**: 2D shader effects AND the budget 3D object (F3) |
| three.js | github.com/mrdoob/three.js | MIT | 0.186.1 · 2026-09-24 | 185 KB full; ~150+ KB tree-shaken core | yes (client) | **Compare only** (`/lab/travel/f3t`): the renderer alone is over the 3D budget |
| React Three Fiber | github.com/pmndrs/react-three-fiber | MIT | 9.8.1 · 2026-09-24 (React 19 line: react ≥19 <19.4) | 57 KB + all of three | yes, `dynamic(…, {ssr:false})` | **Compare only** (`/lab/travel/f3r`, +261 KB): pulls the whole three namespace |
| drei | github.com/pmndrs/drei | MIT | 10.7.9 · 2026-09-25 | full 521 KB; useGLTF ~21 KB | yes, but **not ScrollControls** (own scroller, fights Lenis + record mode) | used only `useGLTF` in the R3F comparison |
| curtains.js | github.com/martinlaxenaire/curtainsjs | MIT (`LICENSE.txt`) | 8.1.6 · 2024-05 (maintenance) | ~26 KB | yes | **Excluded** (stale; OGL covers it). Ideas used for M67/M68 |
| `<model-viewer>` | github.com/google/model-viewer | Apache-2.0 | 4.3.1 · 2026-06-04 | ~289 KB (bundles three) | yes, dynamic import | **Use for F6 only** (one quick product spin; +336 KB measured) |
| Theatre.js | github.com/theatre-js/theatre | core Apache-2.0, **studio AGPL-3.0** | 0.7.2 · 2024-05 (stalled) | core 31 KB | yes | **Excluded**: stalled + AGPL studio; F4 camera paths are driven by GSAP instead |
| glTF-Transform CLI | github.com/donmccurdy/glTF-Transform | MIT | 4.5.1 · 2026-09-28 | CLI | n/a | **Use** (`npm run glb`; KTX2 would need the external `ktx` ≥ 4.4, not used) |
| rembg | github.com/danielgatis/rembg | MIT, BUT its newest **default model (bria-rmbg / RMBG-2.0) needs a paid licence for commercial use** | 2.0.85 · 2026-09-20 (Python ≥ 3.11) | CLI | n/a | **Use with `-m birefnet-general`** always (`npm run cutout`) |
| BiRefNet | github.com/ZhengPeng7/BiRefNet | MIT | pushed 2026-09-02 | model | n/a | **Use** (through rembg) |
| TRELLIS.2 | github.com/microsoft/TRELLIS.2 | MIT (code + 4B weights; local install pulls nvdiffrast = non-commercial) | pushed 2026-07-10 · HF Space running | — | n/a | **Use the Hugging Face Space** for image → .glb |
| Hi3DGen → Stable3DGen | github.com/Stable-X/Stable3DGen | MIT (commercial-clean: non-commercial deps removed) | pushed 2025-07 · HF Space running | — | n/a | **Use** (second choice) |
| TripoSR / TRELLIS (v1) | VAST-AI-Research/TripoSR · microsoft/TRELLIS | MIT | 2026-06 · Spaces down | — | n/a | fallback only |
| Hunyuan3D-2 | github.com/Tencent-Hunyuan/Hunyuan3D-2 | Tencent Hunyuan 3D Community License: **not valid in the EU, UK, South Korea**; > 1M MAU needs Tencent's licence | 2025-10 | — | n/a | **Excluded** unless you approve it |
| Sample model | KhronosGroup/glTF-Sample-Assets → **WaterBottle** | **CC0 1.0** ("© 2017, Public", model README + metadata.json) | — | 8.97 MB → **0.09 MB** (meshopt) / **0.20 MB** (`--ogl`) | n/a | **Used** in `/lab/travel` (`public/lab/models/`) |

Measured in this kit (JS downloaded by `/lab/travel/*`, gzip, on top of the 2D page): **F3 on OGL +40 KB** · F3 on plain three.js +203 KB · F3 on React Three Fiber +261 KB · F6 `<model-viewer>` +336 KB. Budget for 3D code: +150 KB → only the OGL version fits; the others stay in `/lab` to compare.

### Codrops techniques we rebuilt (all MIT)
- **Consecutive Scroll Animations with One Element** (2024-11-20), github.com/codrops/OneElementScroll (MIT © 2009–2024 Codrops): one real element + empty `data-step` placeholders; `Flip.getState` per step, `Flip.fit` in one scrubbed timeline with a resting gap per step. **→ F1 / our travel driver** (`components/fx/travel/useTravel.ts`): same "rest at each waypoint, fly between" timing, but we measure anchors once and tween a plain state object (so the same driver feeds PNG, OGL, three.js and model-viewer layers).
- **On-Scroll Folding 3D Cardboard Box with Three.js and GSAP** (2022-12-13), github.com/uuuulala/Threejs-folding-cardboard-box-tutorial (MIT © 2009–2021 Codrops): tween a plain params object, apply it to meshes in `onUpdate`; pivots moved to hinge edges; staggered flaps. **→ the pattern all our 3D layers use; F5 fold/assemble** (menu).
- **Camera Fly-through on Scroll with Theatre.js and React Three Fiber** (2023-02-14), github.com/AndrewPrifer/CodropsCameraFlyThroughTutorial (MIT © 2009–2022 Codrops): keyframed camera driven by scroll. **→ F4** (menu), driven by a GSAP timeline on a camera path instead of Theatre (stalled, AGPL studio).

### Award-winning sites with a floating / travelling product (as reported by Awwwards + studio write-ups)
| Site | Award | What the object does |
|---|---|---|
| Oryzo AI (Lusion) — oryzo.ai | Awwwards Site of the Month, Apr 2026 | one 3D coaster stays through the story, scales into flat UI cards and back to 3D (Three.js, GSAP, Lenis) |
| SŌM (.RAW) — drinksom.eu | SOTD 4 Apr 2026 | 3D product turns/transforms while details + buy box scroll past (WebGL, GSAP) |
| The Watch FS 60P (60fps) — thewatch.60fps.fr | SOTD 17 Aug 2026 + Product Honors | real-time watch re-poses / turns 360° as content changes around it (Three.js) |
| Lando Norris (OFF+BRAND) — landonorris.com | SOTD Nov 2025, Site of the Year 2025 | 3D helmet rotating with the scroll (WebGL, GSAP, Rive) |
| Lightweight (VKZ) — lightweight.info | SOTD Feb 2026 + Product Honors | carbon wheel driven by scroll (Three.js, Next.js) |
| Cartier Watches & Wonders 2025 — cartier.com | SOTM Aug 2025 | a 3D "universe" per watch, gesture-turnable (Three.js, GSAP, Lenis) |
Recurring 2025–26 patterns: hero object kept across sections (3D → 2D UI) · pinned product spec stage · one room per product · camera fly-through on a path · staged-scene longform · branded preloader into reveal + page indicator.

### Claude Code skills checked
- **Installed:** greensock/gsap-skills (MIT, 8 skills).
- **Official, not installed yet:** anthropics/skills `frontend-design` (Apache-2.0; waiting for you to run the install). Also there: web-artifacts-builder, canvas-design, theme-factory, algorithmic-art, webapp-testing (Apache-2.0; docx/pdf/pptx/xlsx are proprietary).
- **Third-party, noted only:** vercel-labs/agent-skills (MIT), nextlevelbuilder/ui-ux-pro-max-skill (MIT), agiwhitelist/auteur (MIT), tsogjavklann/awwwards-3d (MIT, closest to this kit). AThevon/genjutsu (licence unclear) and remotion-dev/skills (no licence) excluded.


---

## Ideas from design skills (read on GitHub, nothing installed or run; checked 2026-10-03)

All seven repos are MIT (GitHub API). We copied **ideas** (names, hex values, font pairs, timings) and rewrote them in our own words; no files were copied. Skipped: everything named after or measured from a real brand, and two licence traps (web-design-studio's `stack/LICENSE-COMMERCIAL.md` paid parts; design-taste's verbatim Apache-2.0 reference text).

| Repo | What we took → our codes | Skipped |
|---|---|---|
| nextlevelbuilder/ui-ux-pro-max-skill (`src/ui-ux-pro-max/data/styles.csv`, `typography.csv`) | L22 Bauhaus primaries, L26 Vintage analog film (+ palettes Bauhaus primaries, Faded film, Ballpoint sketch) · type pairs T23–T30 (Calistoga paired with Work Sans instead of Inter) | brand-named styles (Shopify Polaris, Adobe Spectrum, Fluent, VisionOS, Liquid Glass); Tailwind-default SaaS palettes |
| ConardLi/garden-skills (`skills/web-design-engineer/`) | L21 Mid-century poster (+ Mustard teal palette) · template tells (lesson 40) | all brand/studio clone recipes (apple, aesop, linear, vercel, raycast, stripe, notion, mailchimp, balenciaga, bloomberg, monocle, muji, headspace, active-theory, field-io, resn) |
| superdesigndev/superdesign-skill | nothing (built around a paid SaaS CLI and "extract linear/stripe style") | all |
| educlopez/ui-craft (`references/motion.md`) | easing vocabulary, exit ≈ 75% of entrance, stagger 30–80 ms, motion budget (MOTION-MENU intro) | app-UI themes |
| TheGoat395/Codex-Skills (`premium-visual-reference-library/references/style-playbooks.json`, `design-motion-principles/references/motion-cookbook.md`) | L23 Halftone/dither, L24 Art-directed collage, L25 Surreal product world · palettes Press yellow, Deep-sea coral · M74 thrown curved path · negative-delay ambient stagger (rule) | — |
| MustBeSimo/web-design-studio (`references/film-archetypes.md`, `awwwards-techniques.md`, `SKILL.md`) | L17–L20 · palettes Hazard concrete, Monument red, Clinical noir, Haze ochre, Macaron block, Leaf press, Control room · X12–X18 transitions · M72 glacial-then-sudden pin · M73 velocity-skew type · loader I10 · lesson 39 | paid `motif-engine/`, `dist/studio`, `references/learned/`; `bench/raw/*.json` (real brand sites); velocity shader ripple (already M55/M68) |
| h3nryprod01/design-taste (`reference/core-rules.md`, `anti-slop.md`, `motion.md`) | category-reflex check, cream+brass default warning, lessons 36–38/41 | brand design-system table, brand analogies, "use real company logos" rule; comparison wipe (already M46) |

Also read in full (installed by the user as skills, all docs-only, MIT): owl-listener/designer-skills `animation-principles` + `motion-system` (duration/easing tokens, reduced-motion at :root) and leonxlnx/taste-skill `high-end-visual-design` (`skills/soft-skill`). Our kit rules win where they differ (CLAUDE.md top).

## Section layouts (SECTION-MENU, `/lab/sections`; checked 2026-10-03)

All 90 layouts (`components/sections/`) were **written from scratch** in our engine (Tailwind + GSAP + Lenis, no framer-motion). **No code was copied** from any source below. We studied how each source arranges a section (grid, hierarchy, what sits next to what), then designed our own version with our own content, placeholders and motion codes.

| Source | Licence (checked on the real repo / site) | How we used it |
|---|---|---|
| 21st.dev (community marketing blocks: heroes, features, pricing, testimonials, CTA, footers, backgrounds) | Each author owns their component; licences differ per component; site terms forbid republishing; free tier limited | **Look and learn only.** Layout ideas noted, nothing copied or downloaded |
| Tailark (`tailark/blocks`, free sets dusk / mist / veil) | MIT © 2025 Irung | Ideas only (hero + logo strip, feature rows, bento, pricing, footers). Pro set "Quartz" not looked at |
| HyperUI (`markmead/hyperui`) | MIT © Mark Mead | Ideas only (CTA bands, FAQ grids, newsletter rows, footers) |
| Magic UI (`magicuidesign/magicui`, free components + templates) | MIT © Magic UI | Ideas only (bento grid, marquee reviews, border sheen, flickering grid); motion rebuilt in GSAP. Magic UI Pro not used |
| Preline UI (`htmlstreamofficial/preline`) | MIT + "Preline UI Fair Use" © Preline Labs Ltd. (free blocks allowed in client sites; Pro excluded) | Ideas only (pricing tiers + comparison table, stats rows, FAQ + help card) |
| Flowbite (`themesberg/flowbite`) | Core library MIT © Bergside; free marketing blocks are served from the site with no confirmed licence | **Ideas only** (blocks not copied); Flowbite Pro excluded |
| shadcn/ui (`shadcn-ui/ui`) | MIT © shadcn | Checked: has app blocks, no marketing sections; nothing taken |
| Award-winning brand sites (Awwwards / Godly / Codrops showcases): /zeroz, STILL., Palmo, Kraken Industries, Partake Foods, Caffè Gilli, Best Bean Best Cup, Tengile MalaMala, Colonia Zacamil | Their own sites (all rights reserved) | Section **structure** only (chapter openers, stockist ledgers, press walls, founder letters, info footers). No text, images, logos or code |

All people, press titles, shops and brands in the demo sections are invented. Placeholder art only (`scene()` / `productAngle()`).

### Section-menu growth (batches 1+, research 2026-10-03/04)

Four research passes read 21st.dev (≈110 category pages, ≈2,550 component pages), every free block of Tailark, Magic UI, shadcn/ui and Aceternity, all free marketing blocks of HyperUI, Preline and Flowbite, Meraki UI, Tailblocks, Mamba UI, Float UI, Codrops (≈160 repos) and Awwwards / SiteInspire pages. 483 candidates → **318 structurally new layouts** after removing duplicates; every candidate and every skip (1,003, with the reason) is in `docs/SECTION-LOG.md` / `docs/section-log.csv`. **No code was copied from any of them**: each layout was rebuilt from a written structure description.

| Source | Licence (checked on the real repo / page) | Use |
|---|---|---|
| 21st.dev | author-owned; per-component licences vary (MIT, MIT-0, Apache-2.0, MPL-2.0, AGPL-3.0, none) | look and learn only |
| Aceternity UI (free components) | proprietary "Aceternity Licence" (not MIT) | look and learn only; blocks/templates (paid) not opened |
| Magic UI blog / changelog templates | no licence file | look and learn only |
| Meraki UI | MIT © 2021 Khatab Wedaa | ideas only |
| Tailblocks | MIT © 2020 Mert Cukuren | ideas only |
| Mamba UI | MIT © 2020 Mamba UI | ideas only |
| Float UI | own licence (use in client sites, no redistribution) | ideas only, free items |
| Codrops demos | MIT (2021+ repos); older repos custom licence (no resale/redistribution) | ideas only |
| Awwwards, SiteInspire | all rights reserved | layout ideas only |
| TailGrids, daisyUI | MIT | not mined (blocks are Pro / no section blocks) |
| Kometa UI | no public repo, licence unclear | skipped |
| Godly, Land-book, Lapa Ninja | could not be read (blocked / redirect) | not used |

## Motion library (MOTION-MENU §L, `/lab/motion`; research 2026-10-04)

Every motion is **rebuilt from scratch in GSAP** (no framer-motion, no copied code), even when the source is MIT. Sources were looked at to learn what moves and when; code, names and assets are ours. Only exact duplicates were skipped (548); variants keep their own code with a "variant of" note (see `docs/MOTION-LOG.md`).

| Source | Licence | How we used it |
|---|---|---|
| Codrops tutorials + demos (2020+ repos) | MIT | ideas, rebuilt in GSAP |
| Codrops repos 2013–2019 | Codrops own licence (no redistribution) | ideas only |
| Two Codrops repos | GPLv3 | ideas only, no code |
| Magic UI, Motion Primitives, Animata, Fancy Components, Cult UI, Eldora UI, Kokonut UI, SmoothUI, uiverse, Syntax UI | MIT | ideas, rebuilt in GSAP |
| anime.js, cssfx, CSS Loaders, Lenis, Locomotive Scroll, Barba.js, swup | MIT | ideas, rebuilt in GSAP |
| React Bits, Animate UI | MIT + Commons Clause | ideas only |
| Aceternity UI, Skiper UI, 21st.dev | proprietary / unclear | look and learn only |
| GSAP showcase demos, CodePen pens | per-author / GSAP licence | look and learn only |
| Awwwards, FWA, CSS Design Awards sites | all rights reserved | motion ideas only |
| Hover.css | free for open source; commercial use needs a paid licence | ideas only |
| Animate.css | Hippocratic 2.1 | ideas only |
| Animista | FreeBSD | ideas, rebuilt |
| loading.io | CC0 | ideas, rebuilt |
| Hover.dev | own licence | ideas only |
| CodePen search, tympanus.net live pages, Godly | blocked / could not be read | not used |
