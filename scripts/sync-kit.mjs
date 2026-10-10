#!/usr/bin/env node
// Pull the latest kit (menus, docs, skills, scripts, components, engine, lab) from the template into this day folder.
//
//   npm run sync-kit                 update kit files from the template in .kit.json (../showreel-kit)
//   npm run sync-kit -- --dry        only list what would change
//   npm run sync-kit -- --force      also overwrite kit files edited in this folder (default: keep them, warn)
//   options: --from <template folder> · --no-install
//
// Never touches site/, raw/, public/images/, public/frames/, cover.jpg, archive/, recordings/.
// A kit file edited in this folder since the last sync (e.g. docs/LESSONS.md or docs/SITES-LOG.md at the end of a
// day) is kept and reported, never overwritten without --force. Files removed from the template stay here (reported).
// package.json: new/updated dependencies and scripts come in; this day's name, port and own extra packages stay.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { kitFiles, portOf, readJson, sha1, withPort } from "./kit-lib.mjs";

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const fromIdx = args.indexOf("--from");
const DAY = process.cwd();
const KIT_JSON = join(DAY, ".kit.json");

const kit = existsSync(KIT_JSON) ? readJson(KIT_JSON) : null;
const TEMPLATE = resolve(fromIdx >= 0 ? args[fromIdx + 1] : process.env.KIT_TEMPLATE ?? kit?.template ?? join(DAY, "..", "..", "showreel-kit"));
if (!kit && fromIdx < 0) {
  console.log("✗ No .kit.json here: run this inside a day folder made by `npm run new-day` (or pass --from <template>).");
  process.exit(1);
}
if (resolve(TEMPLATE) === resolve(DAY)) {
  console.log("✗ This is the template itself; run sync-kit inside a day folder.");
  process.exit(1);
}
if (!existsSync(join(TEMPLATE, "docs", "MOTION-MENU.md"))) {
  console.log(`✗ Template not found at ${TEMPLATE}`);
  process.exit(1);
}

const dry = flag("dry");
const force = flag("force");
const dayPkg = readJson(join(DAY, "package.json"));
const port = portOf(dayPkg);
const synced = kit?.synced ?? {};

const added = [], updated = [], kept = [], gone = [];
const tplFiles = kitFiles(TEMPLATE);
for (const rel of tplFiles) {
  const next = withPort(rel, readFileSync(join(TEMPLATE, rel)), port);
  const dest = join(DAY, rel);
  if (!existsSync(dest)) {
    added.push(rel);
  } else {
    const cur = readFileSync(dest);
    if (cur.equals(next)) {
      synced[rel] = sha1(next);
      continue;
    }
    // edited here since the last sync (or never synced and different) → keep unless --force
    if (synced[rel] !== sha1(cur) && !force) {
      kept.push(rel);
      continue;
    }
    updated.push(rel);
  }
  if (!dry) {
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, next);
    synced[rel] = sha1(next);
  }
}
const tplSet = new Set(tplFiles);
for (const rel of Object.keys(synced)) if (!tplSet.has(rel) && existsSync(join(DAY, rel))) gone.push(rel);

// package.json: bring in the template's dependencies + scripts, keep this day's name, port and extras.
const tplPkg = readJson(join(TEMPLATE, "package.json"));
const pkgChanges = [];
const merged = structuredClone(dayPkg);
for (const field of ["dependencies", "devDependencies"]) {
  merged[field] ??= {};
  for (const [k, v] of Object.entries(tplPkg[field] ?? {})) {
    if (merged[field][k] !== v) {
      pkgChanges.push(`${field === "dependencies" ? "" : "dev "}${k} ${merged[field][k] ?? "(new)"} → ${v}`);
      merged[field][k] = v;
    }
  }
}
for (const [k, v] of Object.entries(tplPkg.scripts ?? {})) {
  if (k === "dev" || k === "start") continue;
  if (merged.scripts[k] !== v) {
    pkgChanges.push(`script ${k}`);
    merged.scripts[k] = v;
  }
}
const depsChanged = pkgChanges.some((c) => !c.startsWith("script "));
if (!dry && pkgChanges.length) writeFileSync(join(DAY, "package.json"), JSON.stringify(merged, null, 2) + "\n");

if (!dry && kit) {
  kit.synced = synced;
  kit.lastSync = new Date().toISOString();
  writeFileSync(KIT_JSON, JSON.stringify(kit, null, 2) + "\n");
}

const list = (title, a) => a.length && console.log(`${title} (${a.length}):\n${a.map((f) => `  ${f}`).join("\n")}`);
console.log(`${dry ? "[dry run] " : ""}sync-kit ← ${TEMPLATE}`);
list("+ added", added);
list("~ updated", updated);
list("! kept (edited in this folder; --force to overwrite)", kept);
list("? removed from the template (left here)", gone);
list("package.json", pkgChanges);
if (!added.length && !updated.length && !pkgChanges.length) console.log("✓ Already up to date.");
else if (!dry) console.log("✓ Kit synced. site/, raw/ and assets untouched.");

if (!dry && depsChanged && !flag("no-install")) spawnSync("npm", ["install", "--no-audit", "--no-fund"], { cwd: DAY, stdio: "inherit" });
