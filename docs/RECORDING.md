# Filming the site: vertical 9:16 reel

This matches the reference page's style: **phone held upright**, laptop in a **dark room**, the screen and the glowing keyboard are the only light, and the site **scrolls by itself**.

## 1. Prepare the laptop

1. Run the production version (much smoother than `npm run dev`):
   ```bash
   npm run build && npm start
   ```
2. Open Chrome → **http://localhost:3009/?record=1**
3. Browser zoom **100%** (Ctrl/Cmd + 0).
4. **Full screen** so there's no address bar or tabs: **F11** (Windows), **Cmd + Ctrl + F** (Mac).
5. Screen brightness **100%**. Turn off Night Light / Night Shift / True Tone (they tint colours).
6. Turn on Do Not Disturb, plug in the charger.
7. Keyboard backlight **on**. If it's RGB, set a slow colour-cycle effect; it gives the colourful glow you see in the reference reels.

## 2. Record mode

`?record=1` hides the real mouse pointer and the scrollbar, waits for the loader to finish, then scrolls the page by itself. It has two modes, and in both a **record cursor** plays the hovers (section C).

### A. Section timeline (recommended)

Used automatically when any element on the page has `data-record-time`. Every marked element is a **stop**, in page order, and gets a fixed number of seconds (desktop only, 1440×900).

| Attribute | Meaning |
|---|---|
| `data-record-time="2.5"` | seconds to scroll from the previous stop to this one |
| `data-record-hold="5"` | seconds to stay still once it arrives |
| `data-record-align="center"` | where the element sits on screen when it arrives: `top` (default), `center`, `bottom` |
| `data-record-offset="-36"` | extra pixels added to that scroll position (negative = the element sits lower) |
| `data-record-label="FAQ"` | the name printed in the console |

- **Change timings in the page, not in code:** edit the numbers on the sections in `site/components/*`. A stop can be a whole `<section>` or an invisible marker `<div>` (e.g. the start and end of a pinned scroll video).
- **Smooth:** the scroll follows one smooth curve through all the stops. It only comes to rest at holds, at the start and at the end. There are no sudden starts or stops.
- **Clock starts after the loader**, so a slow load doesn't shift anything. Custom loaders: put `data-loader` on the overlay; record mode waits until it's gone. Give the loader a fixed length (e.g. exactly 2.5 s) so every device reaches the hero at the same moment.
- **`&at=` and loaders:** a loader that supports it (using `lib/atTime.ts`, like `components/patterns/StartLightsLoader.tsx`) freezes on its first frame and plays at the set time. With a loader that doesn't, the page loads normally and then waits on the hero until the set time.
- **Hold events:** during a hold the stop element receives a `record:hold` event (`detail.duration` in seconds), then `record:holdend`. Sections can use it to play something while the page stands still (e.g. a card that steps through four models, or a size picker that plays its demo).
- **Console:** opening `?record=1` prints the whole plan (`console.table`: section, starts, arrives, hold), then `[record] 13.50 s → Collection (hold)` as each move begins, then `[record] done at 41.01 s`.
- `record.duration`, `record.speed` and `delay` are ignored in this mode (use a hold on the first stop instead).

Example timeline (41 s):

| Stop | Move (s) | Hold (s) | Starts at |
|---|---|---|---|
| Hero | 0 | 3 | 0 |
| Anatomy (plate full screen) | 1.5 | | 3.0 |
| Anatomy: all 5 parts | 7 | | 4.5 |
| Two hundred and eleven parts | 2 | | 11.5 |
| Collection | 1.5 | 5 | 13.5 |
| Configurator | 5 | | 20.0 |
| Hand finished + atelier | 4 | | 25.0 |
| Figures · Look closer · Boutiques · FAQ | 2.5 each | | 29.0 · 31.5 · 34.0 · 36.5 |
| Footer | 1 | 1 | 39.0 → done 41.0 |

### B. Constant speed (sites without `data-record-time`)

Scrolls the whole page at a steady speed. By default it takes `site/site.ts` → `record.duration`.

| Want | Use |
|---|---|
| Whole page in exactly 30 s | `?record=1&duration=30` |
| Fixed speed instead | `?record=1&speed=200` |
| More time on the loader | `?record=1&delay=4` |

### C. Hover cursor (every reel, both modes)

A clean pointer (`components/engine/RecordCursor.tsx`) glides through the page on soft arcs and plays the site's **real** hover states, so nobody touches the mouse on camera.

| Attribute | Meaning |
|---|---|
| `data-hover-demo` | the cursor visits it once it is on screen (in page order) and hovers it |
| `data-hover-demo="click"` | hover, then click halfway through the stay (swatches, Add to cart) |
| `data-hover-hold="1.4"` | seconds to stay (default 1.1) |
| `data-hover-at="0.5,0.3"` | where to rest inside it (fractions of its box); default: the first spot off headlines |
| `data-hover-label="Swatch"` | name in the console (`[record] hover 3: Swatch`) |

- **Real, not faked:** the element under the tip gets the same events a mouse sends (pointer/mouse over, enter, move, out, leave; down/up/click for `="click"`), so React handlers, Magnetic and TiltCard run, and it plus its ancestors get `.is-hover`. Every `:hover` rule (Tailwind `hover:` / `group-hover:` and plain CSS) also matches `.is-hover` (`lib/postcss-record-hover.cjs`), so write hovers normally.
- **At least 3 hover moments per reel** (cards, swatches, buttons, Add to cart): `npm run check` counts the marks, `npm run reel` counts the hovers that played and FAILs under 3.
- Never rests on headline text (h1–h3, `[data-split]`, `.font-display`, `[data-cursor-avoid]`), rides along with its target while the page scrolls, fades out when idle. Give hover sections a `data-record-hold` so the hover plays while the page stands still.
- Off: `?static=1` (no motion at all), `&cursor=0`, or `meta.record.cursor = false`. It never reads the OS reduce-motion setting.

### Keys (both modes)

| Key | Does |
|---|---|
| **R** | start / pause / resume |
| **T** | stop and jump back to the top |
| **+ / −** | faster / slower (constant speed only) |

To see the loader again, reload the page (or use a new Incognito window).

## Laptop only

Reels are filmed **only on the laptop** (`?record=1` at 1440×900). The site is desktop only: no phone recordings and no phone checks. The reel must be exactly 1440×900. Before filming, `npm run reel` records the same run headlessly and runs freezedetect + frame-diff: film only after it says PASS. (`&at=HH:MM:SS` still starts a run at a set time if you ever need it.)



## 3. Set up the shot (phone vertical)

- **Dark room.** Lights off, curtains closed. Only the screen and keyboard glow.
- Put the phone on a small tripod, **vertical**, about **40–60 cm** from the laptop, a little **above and to one side**, so the camera looks down at the screen at ~20–30°.
- Frame it so the **screen fills the top ~60%** of the video and the **keyboard glow shows in the bottom ~30%**. Leave a little space at the very top for the text.
- Alternative look (like the TV reel): the site on a big TV / monitor on a table, filmed from the side in a normal-lit room.

## 4. Phone camera settings

- **4K, 30 fps.** Main (1×) lens. Avoid the wide lens: it bends the screen.
- **Tap and hold on the screen** to lock focus + exposure (AE/AF lock), then drag the brightness slider **down a little** so the screen isn't blown out white.
- If you see flicker or rolling bands: use Pro/Manual mode, shutter **1/50** or **1/60**.
- If you see wavy rainbow lines (moiré): move the phone slightly back, or tap-focus a tiny bit off the screen.
- Start recording, **then** press F5 on the laptop to reload `?record=1`. Stop 2 s after the footer appears.

## 5. Edit (CapCut / Instagram editor)

- **Length:** 18–40 s. Cut the dead seconds at the start.
- **Top text** for the whole reel, left-aligned, bold, with a short coloured bar before it, e.g. **"Your brand deserves a website like this"**. Keep the same style on every reel so the page is recognisable.
- **Trending song** (pick from Instagram's trending audio when posting).
- Optional: speed ramp the slow parts to 1.5×, keep the hero and signature moment at normal speed.
- **Caption / pinned comment hook:** e.g. *Comment "SITE" and I'll send you the details* / *DM "WEBSITE" to get one for your brand*.
- Post as a Reel **and** share it to your Story with a "Check it out 🔥" sticker, like the reference page.

## 6. Quick checklist

- [ ] `npm run build && npm start`, full screen, zoom 100%, brightness 100%
- [ ] Dark room, keyboard backlight on, phone vertical on tripod
- [ ] 4K 30 fps, exposure locked and lowered a bit
- [ ] Reload `?record=1` (two devices: `&at=HH:MM:SS` on both), let it run to the footer
- [ ] Edit: top text, trending song, 18–40 s, hook in caption
