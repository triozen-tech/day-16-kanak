# Showreel Kit — playbook for Claude Code

> **Our kit is the source of truth.** DESIGN-MENU, MOTION-MENU, LESSONS.md, SITES-LOG uniqueness and the brief always win over any skill's style advice. Skills are helpers for HOW to build, not WHAT it should look like.
>
> Inside this kit, always use our project skills `caption`, `cover-check` and our reel workflow (`record-check`, `npm run reel`) — never the global `caption-and-hashtags`, `cover-thumbnail-brief`, `reel-builder` or `reel-scripter`.
>
> The `animation-principles` and `motion-system` skills apply ONLY to small UI motion (buttons, hovers, menus, cart). Scroll-driven, cinematic and video-scrub motion follows MOTION-MENU and is exempt from their duration and easing limits.

This repo builds **one showcase website per day**. The team films the laptop screen with a phone held **vertically (9:16 Instagram reel)** while the site scrolls itself, and posts it to win clients. Two things matter most:

1. **Every site must look like a different designer made it.** New layout, nav, typography, cards and page flow every day. Only the engine underneath stays the same.
2. It must look **premium and real**: a cinematic moment (scroll video, product spin, colour switch) **plus** real-business sections (products, prices, offers, categories), so a client can picture their own brand.

**Desktop only (permanent rule).** Build and design for desktop **1440×900** only; reels are recorded on the laptop (`?record=1` at 1440×900). **No phone UI**: no mobile layouts, no small-screen breakpoints or media queries, no phone-only components or code paths. **No phone checks**: no 360/390 screenshots and no phone steps in any round, checklist or skill. See "Checks every round" below.

**Motion is always on (permanent rule).** Never honour the OS reduce-motion setting; only `?static=1` disables motion. `prefersReducedMotion()` in `lib/gsap.ts` is the ONLY switch (true only with `?static`); no `prefers-reduced-motion` media query or `matchMedia` anywhere else (`npm run check` fails on it). Why: that setting is ON by default on many Windows machines and turned the live sites into flat static pages.

**Before anything else, every day and every round: read `docs/LESSONS.md`** (rules learned on earlier days). At the end of a day, add the day's new lessons to it.

## How the kit is organised

| Folder | What | Change per site? |
|---|---|---|
| `components/engine/` | Loader, SmoothScroll (Lenis ↔ GSAP), Animations (data attributes), RecordMode, RecordCursor (the hover cursor in `?record=1`), Cursor, useFramePlayer | **No** |
| `lib/` | gsap setup, frame loading, loader tracker, site types | **No** |
| `components/patterns/` | Library of ready sections (stock + patterns from the reference reels). **Starting points, not templates.** See them live at `/patterns` | No: copy them, then restyle |
| `components/sections/` | **Section layouts**: 90 full designed sections, one per `docs/SECTION-MENU.md` code (HR, FT, BN, PS, ST, SY, GL, SP, PR, FQ, CT, NL, FO), shared blocks in `kit.tsx`, motion by code in `motion.ts`. See them live at `/lab/sections` | No: copy the layout into `site/components/`, then restyle |
| `components/ui/` | SplitText (GSAP SplitText, masked lines), Magnetic, Button, TiltCard | Rarely |
| `components/fx/` | **Effect library** (M38+ motions, X6+ transitions, I6 loader, collected effects): text, layout, WebGL (`gl.tsx`), more. Live at **`/lab`** (hidden, noindex). **`fx/travel/`**: travelling product object F1–F8 (driver + PNG / OGL 3D / three / R3F / model-viewer layers), live at **`/lab/travel/f1 · f3 · f6`** | No: import or copy |
| `lib/gsap.ts` · `lib/gl.ts` · `lib/film.ts` | GSAP + **all plugins registered in one place** (`loadPlugin()` for the big ones) · OGL WebGL helper (lazy) · scroll-video player (video time, blending, subject-fit) + `components/patterns/FilmPin.tsx` | No |
| `scripts/` | `make_frames.py` (video → frames by video time), `reel.mjs` (record + freeze checks), `cover-check.py`, `check-site.mjs`, `archive.mjs`, `refs.mjs` + `refs-search.mjs` + `refs-login.mjs` + `refs-sources.json` (reference board) | No |
| `.claude/skills/` | `new-site` + ours: `video-frames`, `record-check`, `cover-check`, `flow-prompts`, `caption`, `archive-day` + official GSAP skills (`gsap-*`) | Add, don't edit |
| `site/` | **Everything about today's site**: `DESIGN.md`, `site.ts` (meta + theme), `fonts.ts`, `site.css`, `content.ts`, `components/`, `Page.tsx` | **Yes, rewritten every day** |
| `archive/` | Finished sites (`npm run archive -- <name>`, `npm run restore -- <name>`). **Local only, not in git** | — |
| `docs/` | `REFERENCE-SOURCES.md` (where references come from, logins, automated-browsing rules), `LESSONS.md` (**read first**), `DESIGN-MENU.md` (the variety engine), `MOTION-MENU.md` (a motion code for every section), `SOURCES.md` (open-source effects + licences), `SITES-LOG.md` (**local only, not in git**), AI prompts, filming guide | Update the log + lessons |

**The repo shows only the current project.** Each day lives in its own folder (a copy of the kit), so old sites stay safe there. In git there is only: today's site (`site/`) **and its assets** (`raw/` Flow images + Veo videos, `public/images/<slug>/`, `public/frames/<slug>-*`, `public/videos/` (scrub/loop films), `cover.jpg`), the engine, the pattern library and the kit docs. No other brand names or images. `.gitignore` keeps `archive/`, `docs/SITES-LOG.md`, `recordings/`, `*.mov`, final reel videos, venvs, `node_modules/`, `.next/`, `.env*` and `.DS_Store` out. **Any single asset over 50 MB goes through Git LFS** (`.gitattributes`; `npm run assets` checks sizes and warns over 100 MB).

`app/page.tsx` renders the engine + `site/Page.tsx`. `app/layout.tsx` reads `site/site.ts` (colours → CSS variables) and imports `site/fonts.ts` + `site/site.css`.

**Engine features you get for free**
- Scroll videos are image sequences: `npm run frames -- raw/<video>.mp4 frames/<slug>-<name>` → `/frames/<slug>-<name>`. Use them with `FrameHero` / `FrameScrub` / `useFramePlayer`.
- Animations by data attribute (`components/engine/Animations.tsx`): `data-reveal`, `data-reveal="stagger"`, `data-split` (with `<SplitText>`), `data-parallax="0.15"`, `data-zoom`, `data-count="850"`.
- `data-cursor="View"` on anything shows a label on the custom cursor.
- Theme tokens as Tailwind colours: `bg-bg`, `bg-surface`, `text-fg`, `text-muted`, `text-accent`, `bg-accent`, `text-accent-fg`, `border-line`; classes `font-display`, `eyebrow`, `container-x`, `section-y`, `btn btn-solid|btn-outline`. Override or add styles in `site/site.css`.
- `?static=1` = no motion (layout review) · `?record=1` = auto-scroll for filming, with the **record cursor** playing every `data-hover-demo` hover (`="click"` also clicks; `data-hover-hold`, `data-hover-at`). Every `:hover` rule also matches `.is-hover` (`lib/postcss-record-hover.cjs`), so write hovers normally.
- Record timeline: put `data-record-time` / `data-record-hold` (+ `-align`, `-offset`) on sections so `?record=1` gives every section fixed seconds; `&at=HH:MM:SS` starts it at a set clock time. See `docs/RECORDING.md`.

## Building a new site — Round 0 + 5 rounds

**Every round starts by re-reading `docs/LESSONS.md`.** Stop after **every** round, tell the user in plain simple language what to check, and wait for their "ok".

### Build modes: LEAN (Pro) or FULL (Max)
At the very start of every new day (Round 0), **ask first: "Which plan today: Pro or Max?"** and wait for the answer. Write the chosen mode at the top of that day's `site/DESIGN.md` (e.g. `**Mode: LEAN (Pro)**`) and follow it in every round. Both modes: same design quality, same Round 0 + 5 rounds, desktop 1440×900 only.

**LEAN mode (Pro)**: we film manually. Wherever a round below says otherwise, this wins:
- **No** reel recording, `npm run reel` / `record-check` / freezedetect, re-recording or contact sheets.
- **No** per-site record pointer, touch-ring demos or hands-free click scripts.
- `?record=1` = a simple smooth auto-scroll (for manual filming) + the engine's **record cursor**, which plays the `data-hover-demo` hovers by itself (≥ 3, `npm run check` counts them).
- Screenshots only in Round 1 (one per section, 1440×900); in later rounds only if the user asks.
- Reports: at most 10 short lines, no big tables (the Motion map check is a short list).
- Keep: `?static=1`, `npm run build` + `npm run check`, `npm run cover` in Round 5, short SITES-LOG + LESSONS entries.

**FULL mode (Max)**: everything as written below: recorded 1440 reels after each round that must PASS, record pointer, hands-free scripts, full screenshots and reports.

### Assets: Flow first, Blender only rarely (lesson 113)
- **Default for every asset: Google Flow** (images + videos) **plus code effects**.
- **Blender ONLY for simple smooth objects** (bottle, can, jar, glass, perfume, simple box) **and only when a 3D turntable/spin is the site's signature.**
- **Never Blender** for vehicles, complex gadgets, mechanical close-ups, food, people or places.
- **Max one attempt, ~30 min.** Compare it side by side with the Flow master shot; if it doesn't look equally real, drop it at once and use Flow stills + code motion. **Don't start a second Blender pass without asking the user.**
- Round 0 lists **each asset's source: Flow, code or Blender (with the reason)**, and a code fallback where one exists.

### Prompts (permanent rule, every day)
- **Claude Code never writes or prints Flow / Veo prompts**: not in chat, not in DESIGN.md, not in any file. The user's director gives the prompts to the user in chat, batch by batch.
- DESIGN.md's asset list says *what* each asset is (content, use, size, file type, which image a Flow edit attaches, code fallback), never *how to prompt it*.
- When the user pastes back the prompts that were run, Claude adds them word for word to DESIGN.md under **"Prompts (as run)"** (asset ID · date · prompt · attachments), for the record.

### Round 0 — Design direction (no code yet)
0. **Ask "Which plan today: Pro or Max?"** and wait (see Build modes). Then **read `docs/LESSONS.md`.**
1. **Reference board, per section** (`docs/REFERENCE-SOURCES.md`), using the business from the brief (e.g. "skincare"), in this order:
   - **a. Section list:** `npm run refs -- <day> "<category>" --sections` suggests the sections (edit with `--sections "hero,shop,product,…"`). Show it to the user and **STOP for their OK**, then `npm run refs -- <day> --approve`.
   - **b. Search sheet:** `npm run refs:search -- <day>` builds `day<N>/refs/search.html` and opens it in the user's normal browser. Each section gets 5 searches (2 same niche + 3 any business), each with a different style word (rotating by day), as links to Pinterest, Dribbble (+ animated) and Behance, plus the file names to save as. It only makes links.
   - **c. Inbox (the user, by hand):** screenshots (`Cmd+Shift+4`) and clips (`Cmd+Shift+5`) saved into `day<N>/refs/inbox/`, named by section (`hero-1.png`, `product-2.mov`). **Wait for "inbox done".**
   - **d. Board:** `npm run refs -- <day> "<category>"`.
     - It sorts the inbox into sections by file name. Look at any unsorted file and write `inbox.json` (`{"file.png": "reviews"}`).
     - The user's items are marked "mine" and come first.
     - It fills each section up to 3 options from the allowed live sites (1 same business + 2 any business, creative/award work before big-brand shops), plus 1 live clip of hover/motion. That is ≤ 30 page loads per run at human pace; thin sections get `--more`.
     - Look at every option and clip. Give each option one line **"what to take from it"** + a tag (layout · hover · motion · product detail) in `refs.json` (pool: `take`, `tag`; swap a weak option with `override`).
     - Look hardest for product-detail ideas (hover zoom/loupe, swatches that swap the product, option chips with a sliding highlight, add-to-cart animation, sticky buy box, gallery behaviour).
     - Then `npm run refs -- <day> --board` and open `board.html`.
   - **e. Picks:** **STOP: the user picks 1 per section.** Save with `npm run refs -- <day> --pick "hero=B,product=A,…"`.
   - **Layout options (when the inbox doesn't cover every section, the usual case):** after "inbox done", skip the per-section picks.
     - Any inbox reference may inspire any section (a café's product card can shape a jewellery card).
     - Design **2–3 complete full-page layouts** that mix the references with our own designs for the sections nobody saved.
     - Each one is a static mockup at 1440 wide in `day<N>/refs/layouts/` (`a-….html`, `b-….html`, `c-….html`): real type and palette, code-drawn placeholders instead of AI images, every section labelled with the reference it comes from or "ours", and the menu codes kept unique (≥ 6 of 8 different from the last 3 sites).
     - Render every layout full-page and fix what looks wrong before showing it.
     - **STOP: the user picks one layout.** That layout becomes the DESIGN.md direction (step 9). Motion comes after the user has seen and OK'd the static build.
   - Pinterest, Dribbble and Behance are browsed by hand only: never open them with a script or the collector.
2. **Clear the previous site's assets**: delete the old site's raw files, images and frames (`raw/*`, `public/images/<old-slug>/`, `public/frames/<old-slug>-*`, `cover.jpg`) and any demo assets (they are tracked in git now), so only the new site's assets exist. The old site stays safe in its own day folder (and in the local `archive/`).
3. **Read the brief** (brand, what it sells, audience, mood, assets in `raw/` and `public/images/`).
4. **Read `docs/SITES-LOG.md`** (what the last sites looked like), **`docs/DESIGN-MENU.md`**, **`docs/SECTION-MENU.md`** and **`docs/MOTION-MENU.md`**, and open **`/lab/sections`** (every layout, live) and **`/lab`** (the M38+ effects).
5. **Pick one option from each menu**: look, palette, type pair, nav, hero, section shape, card style, signature moment, loader. Follow the uniqueness rule (≥ 6 of 8 different from each of the last 3 sites; never the same type pair two days in a row; the hero and signature never repeat any earlier site's, see step 7).
6. **Plan 9–12 sections**: 1 hero + ~3 cinematic + ~5 shop-style + footer. For each: name, **its SECTION-MENU layout code** (HR, FT, BN, PS, ST, SY, GL, SP, PR, FQ, CT, NL, FO), the pattern/layout it starts from, and *how it will be restyled*. **No layout code used twice on the site, and none that any of the last 3 sites used** (SITES-LOG → Layouts column).
7. **Plan the motion**: give every section (loader, nav and footer included) **one motion code** from `docs/MOTION-MENU.md` (each SECTION-MENU entry lists the motion codes that suit its layout). **No code used twice** on the site, and **"just fade in" is not allowed** as a section's motion. **The hero and signature must not repeat ANY earlier site's hero or signature**: check every row of `docs/SITES-LOG.md` (Hero, Signature and Motion columns), not just yesterday's. **The hero must not be a "shape grows to full screen / portal" opening** (a window, arch, plate, card or doorway that expands to fill the screen). Also note the transitions between sections (X codes) and the planned details (hover, cursor).
8. **Traveling object (every 3rd site)**: Every 3rd site, starting Day 9 (days 9, 12, 15, 18, 21, 24, 27, 30), must have a TRAVELING OBJECT: one cut-out object that travels down the page with the scroll and lands in each section (Flip / MotionPath, from the floating objects menu F1–F8). Round 0 must plan its path section by section, say where it hides, and list the cut-out .png it needs (made from an existing asset with npm run cutout, no extra Flow images if possible). Calm easing, never covers text, never pauses in record mode. Put it in `DESIGN.md` (choices table, section plan and its own Motion map row with the F code) and in the SITES-LOG **Traveling object** column. Other days: write "—" there.
9. **Write `site/DESIGN.md`** with: the choices + a one-line reason each, the section plan, the **Motion map** table (section → **layout code** → motion code → how it plays here → record mode (no Phone column); template at the end of MOTION-MENU.md), a **reel time table** (seconds per section, per pinned step and per hover stop; total 25–40 s, loader included), and the assets still needed (asset specs only: what it shows, use, size/file type, which image a Flow edit attaches, and a **code fallback** if Flow credits run short; **no prompts**, see "Prompts" below), each marked **Flow, code or Blender + reason** (see "Assets: Flow first"). Reasons describe *this* site, never old ones.
   - **References, from the user's picks:** every section names the reference it builds on (`Reviews · pick B (site or "mine")` from `REFS.md`) and what we take from it; ideas are mixed, never one site's layout copied, and nothing may look like a real brand's site (our standing rule). Then the asset list (no prompts).
   - **Hover map** (required): every card, product, swatch, button and link type → its hover effect → which elements get `data-hover-demo` (the record cursor plays them in `?record=1`; at least 3, see Round 4). Template at the end of MOTION-MENU.md.
   - **Product detail plan** (required): which product-detail interactions from the board we use (zoom/loupe, swatch swap, option chips, add-to-cart animation, sticky buy box, gallery) and in which section, each with the pick it comes from (e.g. `Product · A`).
   - Put the "different from the last sites" comparison table in **`docs/SITES-LOG.md` only** (under "Uniqueness checks"), not in `DESIGN.md`, so old project names never appear in the repo. `DESIGN.md` just says "8 of 8 different, see the sites log".
10. **Ask the user**: approve the direction (built from their picks), the Motion map, the Hover map, the Product detail plan, the reel time table and the asset list. The user then generates the assets with their director's prompts.

### Round 1 — Structure (build it)
1. **Save the old site first**: `npm run archive -- <day-NN-slug>` (if not already saved), then clear `site/` except `DESIGN.md`.
2. **Assets**: put images in `public/images/<slug>/`. For every scroll video use the **`video-frames`** skill (`site/frames.json` + `npm run film-frames`: by video time, watermark painted out, ≤ 12 MB; play with `lib/film.ts` + `FilmPin`). The older `npm run frames -- raw/<video>.mp4 frames/<slug>-<name>` still works for simple evenly spaced frames. Cut-out product images (transparent PNG/WebP) for pop cards / colour switcher. Checking and recording assets: **`flow-prompts`** skill (no prompts).
3. **Fonts**: `npm i` the chosen pair, import them in `site/fonts.ts`.
4. **Write** `site/site.ts` (meta, theme, record), `site/site.css` (brand-specific styles: buttons, eyebrow, special effects), `site/content.ts` (all text/data), `site/components/*` and `site/Page.tsx`.
   - Copy each pattern you use into `site/components/` under a brand-specific name and **restyle it** (see the end of DESIGN-MENU.md). Import **at most 3 patterns unchanged** from `components/patterns/`.
   - Build the nav and footer for this site too (copy `Nav`, `NavPill`, `Footer` or `WordmarkFooter` and restyle, or make new ones).
   - Never edit `components/engine/` or `components/patterns/` for one site's needs; copy instead.
   - Build the markup the Motion map needs (masks, strips, split text, SVG paths) so motion can be added later without changing the layout. Everything shows in its final state with `?static=1`.
5. **Copy**: short, premium headlines (2–6 words per line). Real-sounding product names; sample prices in the brand's currency (₹ for Indian brands).
6. `npm run check` and `npm run build` must pass.
7. **Ask the user to review with motion off**: `http://localhost:3009/?static=1` on the laptop. They check: every section shows, text is readable, nothing is cut or overlapping, it looks like the DESIGN.md direction and **not like the previous site**.

### Round 2 — Big motion (loader, hero, signature, pinned sections)
1. **Loader**: shows the brand, then reveals the site with its Motion map code.
2. **Hero**: build its motion; tune the scroll length / switch timing; captions must have time to be read.
3. **Signature moment**: make it great.
4. **Every pinned or scroll-scrubbed section** in the Motion map (M10, M11, M25, M27–M30 …): build it and tune its scroll length.
5. **Auto-motion for filming**: nobody touches the mouse on camera, so anything that needs hover/click must also play by itself while on screen (like `ExpandingPanels`, `ProductShowcase`, `VariantHero`).
6. **Motion map check** (see below) for the sections done this round.
7. **Checks every round** (below): the 1440 reel must PASS. Send the user the 1440 reel; fix anything jumpy, too fast, empty-looking or overlapping they find.

### Round 3 — Section motion + transitions
1. **Every other section** gets its own Motion map code (reveals, text, numbers, groups, lines, ambient). Plain `data-reveal` may support, never replace, the code.
2. **Transitions between sections** (X codes in MOTION-MENU.md): how each section hands over to the next, so the page flows as one film.
3. Supporting motion stays calmer than the signature; one main thing moves at a time.
4. **Motion map check** for the whole page.
5. **Checks every round** (below), then send the user the 1440 reel.

### Round 4 — Details
1. **Details**: hover states, cursor labels (`data-cursor`), magnetic buttons, link/button micro-interactions, count bumps, all as in the DESIGN.md **Hover map**. Each one that matters on camera also plays once by itself.
   - **Record cursor** (`components/engine/RecordCursor.tsx`, docs/RECORDING.md "Hover cursor"): in `?record=1` a clean pointer glides to every `data-hover-demo` element as it comes on screen and triggers its **real** hover (the same mouse events + `.is-hover`, which every `:hover` / `hover:` rule also matches); `data-hover-demo="click"` also clicks it (swatch, Add to cart). **Every reel needs ≥ 3 clear hover moments** (cards, swatches, buttons, Add to cart). Give those sections a `data-record-hold` so the hover plays while the page is still. Never a per-site fake pointer, never a hover faked with a separate animation.
2. **Motion map check** on the 1440 reel.
3. **Checks every round** (below), then send the user the 1440 reel.

### Round 5 — Polish, performance, archive (ready to film)
1. Readability (small text ≥ 12px, contrast), headings not breaking badly at 1440px.
2. **Performance**: frames < 15 MB per video, images WebP and sized, no layout jumps, particles/canvas pause off screen, smooth scrolling at 1440 and 1920.
3. `?static=1` still shows every section in its final state.
4. No console errors; `npm run build` passes.
5. Set `meta.record.duration` so the **whole page scrolls in 25–40 s** (reel length). Test: `npm run build && npm start` → `npm run reel` (or watch `http://localhost:3009/?record=1`).
6. **Final checks**: `npm run reel -- <day-NN-slug>-final` (PASS), `npm run check`. Send the user the 1440 reel.
   - **Reel cover** (locked spec: `docs/COVER.md`): take the hero frame from the final reel (LEAN: a live 1440×900 screenshot of the hero with `?static=1`) → `raw/cover-shot.jpg`; cut out **one clean object, never a person** (`npm run cutout`; if the cutout env is missing, run `npm run cutout:setup` first, automatically, don't ask) → `raw/cover-object.png`; then `npm run cover -- --day <N> --niche "<WORD>" --accent "<accent>"` → `recordings/day-NN-cover.jpg` (cover-check runs on it; nudge with `--object-cx` / `--object-bottom` if the object covers the headline or the nav button). Copy it to `/Users/hosanna/3D Websites/covers/day-NN-cover.jpg`.
7. **Add a row to `docs/SITES-LOG.md`** (including the Motion column: loader · hero · signature codes, the **Layouts column**: every section's layout code, and the **Traveling object column**: F code + its path, or "—"), **add the day's new lessons to `docs/LESSONS.md`**, and run `npm run archive -- <day-NN-slug>` (skill: **`archive-day`**, which also commits and pushes the day's repo when asked).
8. **Repo check**: run `npm run assets` (nothing over 50 MB outside LFS) and `git ls-files`, and confirm the repo only contains the current site's assets (`raw/`, frames, images, cover), the engine, the pattern library and the kit docs: no other brand names (`git grep -il <old names>`) and no other site's images. Report the file list (grouped by folder) and the total size (`git ls-files -z | xargs -0 du -ch | tail -1`).
9. Report back in plain simple language: the section list, anything skipped, and the filming command (see `docs/RECORDING.md`).

### Checks every round (Rounds 1–5)
**LEAN mode:** skip the reel below; each round only needs `npm run build` + `npm run check` passing and `?static=1` showing every section. **FULL mode:** all of it.
Every round starts by re-reading `docs/LESSONS.md`. Skills: **`record-check`** (and `cover-check` for the reel cover). Run against the production server (`npm run build && npm start`):
1. **`npm run reel -- <day-NN-slug>-r<round>`**: records `?record=1` at **1440×900 only**, trims it to the page (first paint → end of the auto-scroll), runs **freezedetect** (n=0.002, d=0.4 s) and **frame-diff** (no stretch ≥ 0.3 s without change), counts the record cursor's **hover moments (≥ 3)** and prints PASS / FAIL. It must PASS. If it reports < ~50 fps captured, the machine is busy: re-run (don't "fix" the site for a recorder hiccup). Look at any flagged spot before changing anything. (Round 1 has no motion yet: skip the reel.)
2. Fix every problem **before** saying the round is done. The checks run on the 1440×900 recording only.

### Motion map check (end of Rounds 2, 3 and 4)
Go through the Motion map in `site/DESIGN.md` section by section and open the page (normal scroll and the 1440 reel). For each section confirm: its main move **is** the planned code (not a plain fade), it plays without hover/click, and `?static=1` shows its final state. Fix every section that doesn't match (or, if a better motion was chosen, update the map, still with no code used twice). Report the result as a short table: section · code · ✅ / fixed.

## House style

- Big headings, generous spacing, few words. Never cram.
- One accent colour per site (a section may flip to a colour band on purpose).
- All images in one site share one mood and colour grade.
- Motion is smooth and confident, never bouncy or messy.
- **Prices**: sample prices are fine (it's a concept). Always keep a footer note like "Concept website by <studio>".
- No fake phone numbers, addresses of real people, or legal text.
- Real brand names are OK for concept sites, but never use the brand's real logo file or copy their real website; the design is ours.

## Adding to the pattern library

If you build something on a site that would be useful again (a new nav, hero, card or section), **also** add a clean, generic version to `components/patterns/`, show it on `app/patterns/page.tsx`, and add it to `docs/DESIGN-MENU.md`.

- Pattern demos on `/patterns` use **plain colour placeholders** (the SVG `photo()` / `cutout()` helpers in `app/patterns/page.tsx`) or the current site's images, **never an old site's**. Placeholders are preferred: they never break when a day's images are removed.
- Pattern code and comments stay generic: no brand names (write "first built for a running-shoe site", not the brand).

## Commands

- `npm run dev` / `npm run build && npm start` (use production for filming)
- `npm run frames -- <video> <folder> [--zoom 1.2] [--max 160] [--start s] [--end s] [--reverse]`
- `npm run check`: all images/frames used in `site/` exist
- `npm run assets`: asset sizes (raw, frames, images, cover) + biggest file; fails if a file over 50 MB is not in Git LFS, warns over 100 MB
- `npm run reel [-- <name>]`: record `?record=1` at 1440×900 → `recordings/<name>.mp4` + freezedetect + frame-diff (PASS / FAIL)
- `npm run film-frames [clip]`: video → scroll frames by video time (`site/frames.json`, skill `video-frames`)
- `npm run cover -- --day <N> --niche "<WORD>" --accent "#rrggbb" [--object raw/cover-object.png] [--shot raw/cover-shot.jpg] [--dir <day folder>]`: the 9:16 reel cover → `recordings/day-XX-cover.jpg` (locked spec: `docs/COVER.md`)
- `npm run cover-check -- <cover.jpg> [--fit]`: Instagram safe areas on a 9:16 cover
- `npm run clean-mark -- <image.jpg> <cx,cy,r> [...] --backup-dir raw/_orig`: paint out the Gemini ✦ mark (lesson 92; check with a high-pass first, lesson 112)
- `npm run cutout -- <folder> [out]`: transparent PNGs with rembg + BiRefNet (install once: `pip3 install "rembg[cpu,cli]"`)
- `npm run glb -- <in.glb> [out.glb] [--ogl]`: compress a 3D model (gltf-transform; ≤ 3 MB; `--ogl` for OGL / model-viewer)
- `PAGE=/lab npm run reel -- lab`: check other pages (long pages: `SECS=180`)
- `npm run archive -- <name>` / `npm run restore -- <name>`
- `npm run new-day -- <num> <slug> [--port 3002]` (run in the clean template `showreel-kit/`): copies the kit only into `day<N>/<slug>-kit` (blank `site/`, no assets), fresh git repo `day-NN-slug`, its own free dev port
- `npm run refs:login` (once, and when a login expires): opens Google Chrome with the reference profile (`~/.triozen-ref-browser`, outside every project, never committed or copied) and one tab per source that needs a login, for the user's own browsing by hand; the user logs in themselves, then says "done" (Claude runs `npm run refs:login -- --done`). Never ask for, type, store or print passwords or cookies
- Reference board (Round 0 step 1): `npm run refs -- <day> "<category>" --sections` (section list) → user OK → `npm run refs -- <day> --approve` → `npm run refs:search -- <day>` (search sheet → `day<N>/refs/search.html`, links only) → the user fills `day<N>/refs/inbox/` by hand → `npm run refs -- <day> "<category>"` (board: inbox "mine" first, filled to 3 per section from allowed live sites + 1 clip) → `npm run refs -- <day> --pick "hero=B,…"`. Also `--board` (re-sort + rebuild), `--more` (thin sections), `--url <site>`, `--dry`. Everything in `day<N>/refs/` is private, git-ignored, never published
- `npm run sync-kit [-- --dry]` (run in a day folder): pulls the latest menus, docs, skills, scripts and components from `showreel-kit/`; never touches `site/`, `raw/` or assets, and keeps kit files edited in the day folder (`--force` to overwrite)
- `npm run record-check [-- <name>]`: same as `npm run reel`
- `/patterns`: pattern catalogue · `/lab/travel/<f1|f3|f3t|f3r|f6>`: travelling object demos · `/lab`: every M38+ motion, X6+ transition and collected effect, live (hidden, noindex) · `?static=1`: no motion · `?record=1`: auto-scroll (`&duration=30` or `&speed=200`)

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
