---
name: record-check
description: Record the site's ?record=1 auto-scroll at 1440×900 headlessly, run freezedetect + frame-diff, and list every stuck spot with its time and section, then find and fix the cause. Use at the end of every round, before filming, or when the user asks whether the reel is smooth / has freezes.
---

# Record check (laptop only)

Reels are recorded **only at 1440×900** (desktop only: no phone checks). The video must be exactly 1440×900; the script fails a capture of any other size. Read `docs/LESSONS.md` → "Never frozen".

1. Production server: `npm run build && npm start` (never test the dev server).
2. `npm run reel -- <day-NN-slug>-r<round>` (other page: `PAGE=/lab`, long pages: `SECS=180`).
   It records `?record=1`, trims to the page (first paint → end of the auto-scroll), runs **freezedetect (n=0.002, d=0.4 s)** and **frame-diff (no change ≥ 0.3 s)**, and prints every flagged spot as `time  for duration  → section` (the section is the stop record mode was heading to). Exit code 1 = FAIL.
3. If it says **under ~50 fps captured**, the machine is busy (another build, a simulator): check `uptime`, wait, re-run. Never "fix" the site for a recorder hiccup.
4. For each flagged spot, look before changing anything:
   `ffmpeg -ss <t-0.4> -t 1.6 -i recordings/<name>.mp4 -vf "fps=6,scale=300:-1,tile=10x1" -frames:v 1 spot.jpg` and view it.
5. Usual causes → fixes (details in LESSONS.md):
   - a pinned/sticky stage where the effect finished early or has a flat start → use the whole scrub range linearly; add time-based life (drift, shimmer, slow push)
   - a record **hold** on a still section → push-in during holds (`HoldPush`), or shorten the hold
   - frames loading in a burst during another video → `loadWhen` a calm section earlier
   - the hero waiting for the scroll after the loader → an intro that plays by itself into the scroll
   - the first second (page still hydrating) → CSS-only motion on the first screen
6. Re-run until **PASS**. Report: duration, fps captured, both checks ("none"), the file path. Send the user the 1440 recording.
