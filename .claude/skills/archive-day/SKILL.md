---
name: archive-day
description: Finish a day: archive the site as day-NN-<name>, add its row to docs/SITES-LOG.md (with the Motion column and lessons), and commit/push the day's repo with the current site's code AND assets (raw/, frames, images, cover). Use when the user says the day is done, asks to archive, or asks to commit/push the finished site.
---

# Archive the day

1. **Final checks passed?** `npm run check`, `npm run reel -- <day-NN-slug>-final` (PASS, 1440×900). If not, stop and say what fails.
2. **Sites log** (`docs/SITES-LOG.md`, local only): add the row (Day, Brand, Niche, Look, Palette, Type pair, Nav, Hero, Shape, Cards, Signature moment, Motion = loader · hero · signature codes + all codes, Layouts, Traveling object = F code + path or "—", Archived as). Make sure the "Uniqueness checks" table for the day is there.
3. **Lessons:** add the day's new lessons to the end of `docs/LESSONS.md` (short rules, the "why" in a few words). Every bug the user found and every freeze we fixed is a candidate.
4. **Archive:** `npm run archive -- day-NN-<name>` (→ `archive/`, local only).
5. **Assets + repo check:** `npm run assets` must pass (any file over 50 MB → `git lfs track "<path>"` first; tell the user about anything over 100 MB). `git ls-files` holds only this site's code and assets (`raw/`, `public/frames/`, `public/images/`, `cover.jpg`), the engine, patterns, fx, lab and kit docs; no recordings, `.mov` or final reel videos; `git grep -il <old brand names>` finds nothing; report files by folder + total size.
6. **Commit/push** (the user asking for this skill = asking to commit). Each day has its own GitHub repo with ONE fresh commit (no older days in history):
   - `git checkout --orphan day<NN>` → `git add -A` (code **and** assets) → check no old brand files and no recordings are staged → commit "Day NN: <Brand> <niche> showcase site + Showreel Kit" (+ the attribution lines from the system prompt)
   - `git remote add day<NN> <repo url the user gives>` (use the same SSH host alias as the other day remotes, e.g. `git@github-triozen:<org>/<repo>.git`) → `git push -u day<NN> day<NN>:main`
   - Confirm with `git ls-remote` that the remote `main` is the new commit. Never force-push over an existing repo without asking.
   - Existing day repo (pushing again later): commit on top of its `main` and push normally (`git push day<NN> HEAD:main`); never force-push.
