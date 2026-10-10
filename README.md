# Showreel Kit v2

Build **one showcase website a day**, with a **different design every day**, film it vertically and post it on Instagram to win clients.

- **The engine stays the same:** smooth scrolling, scroll-driven video, loader, custom cursor, reveal animations, and a record mode that scrolls the page by itself for filming.
- **The design is new every time:** Claude Code designs each site from scratch (layout, nav, fonts, cards, page flow), using the pattern library as ingredients and the design menu to avoid repeating itself.

---

## A new day

This folder (`showreel-kit/`) is the **clean template**: the kit only, no brand, no assets. Each day gets its own copy:

```bash
cd showreel-kit
npm run new-day -- 09 aura       # → ../day9/aura-kit · git repo day-09-aura · its own free dev port
cd ../day9/aura-kit
npm run sync-kit                 # any time: pull the latest menus, docs, skills, components from showreel-kit/
```

`sync-kit` never touches `site/`, `raw/` or assets, and keeps kit files you edited in the day folder (it lists them).

## Quick start

```bash
npm install
npm run dev          # http://localhost:3009   → the current site
                     # http://localhost:3009/patterns → the pattern library
```

## Make today's site (with Claude Code)

Open Claude Code in this folder:

```
/new-site Day [N] — [Brand], a premium saree store in Chennai. Audience: brides and families. Mood: festive, rich, graceful. Assets: none yet.
```

It works in **4 steps** and stops after each for your OK:

0. **Design direction** → `site/DESIGN.md`: the look, colours, fonts, nav, hero, section plan, and which images/videos to generate (with prompts).
1. **Structure** → builds `site/`. Review with motion off: `http://localhost:3009/?static=1`
2. **Motion** → tunes the hero and the signature moment. Send a slow screen recording.
3. **Polish** → readability, phone, filming length, saves the site to `archive/` and logs it.

Then film it: `docs/RECORDING.md`.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Run the site while you edit |
| `npm run build && npm start` | Production version: **use this when filming** |
| `npm run frames -- <video> <folder>` | Turn a video into scroll frames |
| `npm run check` | Check all images/frames used in `site/` exist |
| `npm run archive -- day-NN-slug` | Save the current site into `archive/` |
| `npm run restore -- day-NN-slug` | Bring a saved site back |

Frames options: `--zoom 1.2` (hide AI watermark) · `--start 1 --end 7` (trim) · `--max 120` (fewer frames) · `--reverse`

## Record mode (filming)

`http://localhost:3009/?record=1`: hides cursor + scrollbar, then scrolls the whole page by itself.
`&duration=30` = whole page in 30 s · `&speed=200` = fixed speed · keys: **R** start/stop, **T** top, **+/−** speed.

## Folder map

```
site/                   ← TODAY'S SITE (rewritten every day)
  DESIGN.md               design direction (Round 0)
  site.ts                 name, colours, fonts, record length
  fonts.ts  site.css      fonts + custom styles for this site
  content.ts              all text and data
  components/             this site's sections, nav, footer
  Page.tsx                puts the page together
components/engine/      ← loader, smooth scroll, animations, record mode (don't change)
components/patterns/    ← pattern library: copy + restyle (see /patterns)
archive/                ← saved sites
public/images/<slug>/   ← images per site
public/frames/<slug>-*  ← scroll frames per site
docs/
  DESIGN-MENU.md          looks, palettes, font pairs, navs, heroes, cards, moments
  MOTION-MENU.md          37 motion codes (one per section) + transitions + details
  SITES-LOG.md            what each day looked like (so nothing repeats)
  AI-VIDEO-PROMPTS.md     Google Flow prompts (hero, store fly-through, exploded, cut-outs)
  RECORDING.md            vertical filming guide
  DAILY-WORKFLOW.md       who does what, one site per day
CLAUDE.md               ← the playbook Claude Code follows
```

## Pattern library

| Pattern | What it is |
|---|---|
| `FrameHero` | Full-screen video that plays as you scroll, with captions |
| `FrameScrub` | Pinned product video (spin / exploded view) with callouts |
| `VariantHero` | Colour switcher: product + glow + big word change colour |
| `ColourLab` + `PageGlow` | Pinned colour switcher that follows the scroll: product, outlined name, labels and a page-wide glow change together (record-mode safe) |
| `StartLightsLoader` | Race-start loader: lights on one by one, all go, a slanted bar sweeps the page open (fixed 2.5 s, `&at=` ready) |
| `SizePicker` | Size grid + width + stock + Add to bag, plays a hands-free demo on screen / during a record hold |
| `CurvedGallery` | Endless image row bent on a curve, drifting |
| `ExpandingPanels` | Image strips; one opens wide, auto-advances |
| `ProductShowcase` | One big product at a time with sizes/colours, auto-swaps |
| `ProductGrid` | Product cards: `pop`, `photo` or `dark` style, grid or row |
| `Bento` | Mixed-size promo tiles |
| `Ticker` | Thin scrolling offer strip |
| `WaveDivider` | Wave / curve / arch / tilt / torn edge between sections |
| `PolaroidWall` | Tilted polaroid reviews |
| `Faq` | Opening questions |
| `NavPill` / `Nav` | Floating pill nav / classic bar |
| `WordmarkFooter` / `Footer` | Huge brand-name footer / classic footer |
| `Statement` `Stats` `Features` `HorizontalGallery` `Marquee` `Split` `Parallax` `Testimonials` `Cta` | Cinematic stock sections |
