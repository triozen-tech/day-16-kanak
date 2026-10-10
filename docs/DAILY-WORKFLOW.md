# One site a day: the workflow

| Step | Time | Who (team of 3) |
|---|---|---|
| 1. Pick the brand, write a one-line brief | 10 min | anyone |
| 2. **Round 0:** `/new-site <brief>` → Claude Code writes `site/DESIGN.md` (look, fonts, layout plan, Motion map, missing assets) → approve | 15 min | Person B |
| 3. Generate the assets DESIGN.md asks for (Google Flow: key images → videos; cut-out product images) | 60 min | Person A |
| 4. `npm run frames` for each video, images into `public/images/<slug>/` | 10 min | Person B |
| 5. **Round 1** structure → review `?static=1` on the laptop | 45 min | Person B |
| 6. **Round 2** big motion (loader, hero, signature, pinned) → Claude sends the 1440 reel (`npm run reel`, checked) | 30 min | Person B |
| 7. **Round 3** every other section's motion + transitions → the 1440 reel | 30 min | Person B |
| 8. **Round 4** details (hover, cursor) → the 1440 reel | 20 min | Person B |
| 9. **Round 5** polish, performance → archive + log | 20 min | Person B |
| 10. Film vertical in a dark room (`docs/RECORDING.md`) | 20 min | Person C |
| 11. Edit (top text, trending song), post Reel + Story | 45 min | Person C |

**Every round** Claude first re-reads `docs/LESSONS.md`, then runs the checks itself: `npm run reel` (laptop 1440×900 only, freezedetect + frame-diff must PASS) Desktop only (1440×900): no phone layouts, no phone checks.

## The one-line brief

```
Day [N] — [Brand], [what it sells]. Audience: [who]. Mood: [3 words]. Colours: [optional]. Assets: [what's ready].
```
Example: *"Day 5 — [Brand], a premium saree store in Chennai. Audience: brides and families. Mood: festive, rich, graceful. Assets: none yet."*

Leave the look and motion to Round 0: Claude Code picks from `docs/DESIGN-MENU.md` and `docs/MOTION-MENU.md` so it doesn't repeat the last sites.

## Keeping every site

- Each day lives in its own folder (a copy of the kit), so the finished site stays safe there with all its images.
- `npm run archive -- day-NN-slug` saves `site/` into `archive/` (local only: `archive/` is not in git).
- `npm run restore -- day-NN-slug` brings it back (e.g. to film again or show a client). Its images are in that day's folder, not in this one.
- Keep each site's images and frames in their own folders (`public/images/<slug>/`, `public/frames/<slug>-<name>`). At the start of a new day, Round 0 deletes the previous site's folders so only the new site's assets are here.

## Mix of niches

Their page wins clients with **local businesses** (saree stores, bike showrooms, ice-cream brands, restaurants, fashion stores) as much as luxury. Alternate: 1 luxury/cinematic → 1 local shop → 1 food/fun → 1 tech/sport.
