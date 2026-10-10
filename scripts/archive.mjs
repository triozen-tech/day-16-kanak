#!/usr/bin/env node
// Save or bring back a finished site.
//   npm run archive -- day-NN-slug    → copies site/ to archive/day-NN-slug/
//   npm run restore -- day-NN-slug    → copies it back into site/ (current site/ is saved to archive/_last first)
// Images/frames stay in public/ — keep them in per-site folders (public/images/<slug>/, public/frames/<slug>-*) so sites don't clash.
import { cpSync, existsSync, rmSync, readdirSync } from "node:fs";

const [mode, name] = process.argv.slice(2);
if (!name) {
  const list = existsSync("archive") ? readdirSync("archive").filter((n) => !n.startsWith(".")) : [];
  console.log(`Usage: npm run ${mode} -- <name>\nSaved sites: ${list.join(", ") || "(none)"}`);
  process.exit(1);
}
const dest = `archive/${name}`;
if (mode === "archive") {
  rmSync(dest, { recursive: true, force: true });
  cpSync("site", dest, { recursive: true });
  console.log(`✓ Saved site/ → ${dest}`);
} else {
  if (!existsSync(dest)) {
    console.log(`✗ ${dest} not found`);
    process.exit(1);
  }
  rmSync("archive/_last", { recursive: true, force: true });
  cpSync("site", "archive/_last", { recursive: true });
  rmSync("site", { recursive: true, force: true });
  cpSync(dest, "site", { recursive: true });
  console.log(`✓ Restored ${dest} → site/ (previous site saved in archive/_last). Run: npm run build && npm start`);
}
