#!/usr/bin/env node
// Start a new day from the clean template (../showreel-kit).
//
//   npm run new-day -- 09 aura                 → ../day9/aura-kit, package "day-09-aura", git repo "day-09-aura"
//   options: --port 3002 (default: first free port in kit.config.json "ports" that no other day folder uses)
//            --dest <folder> · --no-install · --no-git · --no-github
//
// Copies the kit only (docs, skills, scripts, components, engine, lab): the new folder starts with an empty site/,
// raw/, public/images/ and public/frames/. Then: fresh `git init` + first commit, remote
// git@<sshHost>:<owner>/day-NN-slug.git (kit.config.json), and a private GitHub repo if the `gh` CLI is logged in.
// Writes .kit.json (template path, port, file hashes) for `npm run sync-kit`.
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { kitFiles, portOf, readJson, sha1, withPort } from "./kit-lib.mjs";

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const pos = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && ["--port", "--dest"].includes(args[i - 1])));
const [numArg, slugArg] = pos;
if (!numArg || !slugArg || !/^\d{1,3}$/.test(numArg) || !/^[a-z0-9][a-z0-9-]*$/.test(slugArg)) {
  console.log("Usage: npm run new-day -- <num> <slug> [--port 3002] [--dest <folder>] [--no-install] [--no-git] [--no-github]");
  console.log("  e.g. npm run new-day -- 09 aura   → ../day9/aura-kit (slug: lowercase letters, digits, dashes)");
  process.exit(1);
}

// The template: this script's own kit, or (when run from a day folder) the template that folder came from.
let TEMPLATE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
if (existsSync(join(TEMPLATE, ".kit.json"))) TEMPLATE = readJson(join(TEMPLATE, ".kit.json")).template;
const HOME = dirname(TEMPLATE); // the folder that holds showreel-kit/ and day1/ … dayN/
const cfg = existsSync(join(TEMPLATE, "kit.config.json")) ? readJson(join(TEMPLATE, "kit.config.json")) : {};

const n = Number(numArg);
const pad = String(n).padStart(2, "0");
const slug = slugArg;
const name = `day-${pad}-${slug}`;
const DEST = resolve(opt("dest") ?? join(HOME, `day${n}`, `${slug}-kit`));
if (existsSync(DEST) && readdirSync(DEST).length) {
  console.log(`✗ ${DEST} already exists and is not empty`);
  process.exit(1);
}

// ---------- port ----------
const free = (port) =>
  new Promise((ok) => {
    const s = createServer();
    s.once("error", () => ok(false));
    s.listen(port, () => s.close(() => ok(true)));
  });
function portsTakenByDays() {
  const taken = new Set();
  for (const d of readdirSync(HOME)) {
    if (!/^day\d+$/.test(d)) continue;
    for (const k of readdirSync(join(HOME, d), { withFileTypes: true })) {
      if (!k.isDirectory()) continue;
      const p = join(HOME, d, k.name, "package.json");
      if (existsSync(p)) taken.add(portOf(readJson(p)) ?? 3000);
    }
  }
  return taken;
}
let port = opt("port") ? Number(opt("port")) : null;
if (port) {
  if (!(await free(port))) console.log(`! port ${port} is busy right now (another server?). Using it anyway as asked.`);
} else {
  const taken = portsTakenByDays();
  const { from = 3001, to = 3099 } = cfg.ports ?? {};
  for (let p = from; p <= to && !port; p++) if (!taken.has(p) && (await free(p))) port = p;
  if (!port) throw new Error(`no free port in ${from}–${to}`);
}

// ---------- copy the kit ----------
mkdirSync(DEST, { recursive: true });
const files = kitFiles(TEMPLATE);
const hashes = {};
for (const rel of files) {
  const buf = withPort(rel, readFileSync(join(TEMPLATE, rel)), port);
  mkdirSync(dirname(join(DEST, rel)), { recursive: true });
  writeFileSync(join(DEST, rel), buf);
  hashes[rel] = sha1(buf);
}
// a blank site + empty asset folders (the template's own placeholders), the local sites log
for (const dir of ["site", "raw", "public/images", "public/frames"]) cpSync(join(TEMPLATE, dir), join(DEST, dir), { recursive: true });

const pkg = readJson(join(TEMPLATE, "package.json"));
pkg.name = name;
pkg.scripts.dev = `next dev -p ${port}`;
pkg.scripts.start = `next start -p ${port}`;
writeFileSync(join(DEST, "package.json"), JSON.stringify(pkg, null, 2) + "\n");
cpSync(join(TEMPLATE, "package-lock.json"), join(DEST, "package-lock.json"));
const lock = readJson(join(DEST, "package-lock.json"));
lock.name = name;
if (lock.packages?.[""]) lock.packages[""].name = name;
writeFileSync(join(DEST, "package-lock.json"), JSON.stringify(lock, null, 2) + "\n");

writeFileSync(
  join(DEST, ".kit.json"),
  JSON.stringify({ day: pad, slug, name, port, template: TEMPLATE, created: new Date().toISOString(), synced: hashes }, null, 2) + "\n",
);
console.log(`✓ Kit copied → ${DEST} (${files.length} kit files, blank site/, port ${port})`);

// ---------- node_modules ----------
const run = (cmd, a, o = {}) => spawnSync(cmd, a, { cwd: DEST, stdio: "inherit", ...o });
if (!flag("no-install")) {
  const nm = join(TEMPLATE, "node_modules");
  // APFS clone: instant and takes no extra disk until a file changes; then npm makes it match package-lock.
  if (existsSync(nm) && run("cp", ["-cR", nm, join(DEST, "node_modules")]).status === 0) console.log("✓ node_modules cloned from the template");
  run("npm", ["install", "--no-audit", "--no-fund"]);
}

// ---------- git ----------
if (!flag("no-git")) {
  run("git", ["init", "-q", "-b", "main"]);
  run("git", ["add", "-A"]);
  run("git", ["commit", "-q", "-m", `Day ${pad} · ${slug}: start from showreel-kit`]);
  const gh = cfg.github ?? {};
  if (gh.owner) {
    const url = `git@${gh.sshHost ?? "github.com"}:${gh.owner}/${name}.git`;
    run("git", ["remote", "add", "origin", url]);
    const hasGh = spawnSync("gh", ["auth", "status"], { stdio: "ignore" }).status === 0;
    if (!flag("no-github") && hasGh) {
      const r = run("gh", ["repo", "create", `${gh.owner}/${name}`, gh.private === false ? "--public" : "--private"]);
      if (r.status === 0) run("git", ["push", "-u", "origin", "main"]);
    } else {
      console.log(`! GitHub repo not created (${hasGh ? "--no-github" : "gh CLI not installed / not logged in"}).`);
      console.log(`  Create an EMPTY private repo "${gh.owner}/${name}" on github.com, then: git push -u origin main`);
    }
    console.log(`✓ git: branch main, remote origin = ${url}`);
  }
}

console.log(`\nNext:\n  cd "${DEST}"\n  npm run dev        → http://localhost:${port}\n  npm run sync-kit   → pull the latest menus, docs and components from ${basename(TEMPLATE)}/`);
