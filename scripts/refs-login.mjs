#!/usr/bin/env node
// Saved-login browser for the reference board (docs/REFERENCE-SOURCES.md).
//
//   npm run refs:login              opens a visible Google Chrome window with the reference profile and one tab per
//                                   source that needs a login (scripts/refs-sources.json "login": true). You log in
//                                   yourself, with your own account. Then type "done" here (or close the window).
//   npm run refs:login -- --done    closes that window from another terminal (what Claude runs when you say "done").
//   npm run refs:login -- --open <url>   open the profile on any page (e.g. to check you are still logged in).
//
// The profile lives OUTSIDE every project at ~/.triozen-ref-browser (override: REFS_PROFILE=/abs/path, still outside
// any repo). It is never committed, copied into a project or printed. This script never asks for, types, stores or prints
// a password or a cookie: it only starts Chrome and, on "done", asks Chrome to quit normally so it saves its own session.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve, sep } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const KIT = resolve(fileURLToPath(import.meta.url), "../..");
export const PROFILE = resolve(process.env.REFS_PROFILE || join(homedir(), ".triozen-ref-browser"));
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PIDFILE = join(PROFILE, ".refs-login.pid");

// never inside a project (the 3D Websites folder holds every day repo)
const projects = resolve(KIT, "..");
if ((PROFILE + sep).startsWith(projects + sep) || (PROFILE + sep).startsWith(resolve(process.cwd()) + sep)) {
  console.log(`✗ The reference profile must live outside the projects folder (got ${PROFILE}).`);
  process.exit(1);
}

const args = process.argv.slice(2);

if (args.includes("--done")) {
  if (!existsSync(PIDFILE)) {
    console.log("No refs:login window is open.");
    process.exit(0);
  }
  const pid = Number(readFileSync(PIDFILE, "utf8"));
  try {
    process.kill(pid, "SIGTERM"); // Chrome's normal quit: it writes its session to the profile first
    console.log("✓ Asked the reference browser to close (logins are saved in the profile).");
  } catch {
    console.log("The window was already closed.");
  }
  rmSync(PIDFILE, { force: true });
  process.exit(0);
}

if (!existsSync(CHROME)) {
  console.log(`✗ Google Chrome not found at ${CHROME} (set CHROME=/path/to/chrome).`);
  process.exit(1);
}
if (existsSync(PIDFILE)) {
  const old = Number(readFileSync(PIDFILE, "utf8"));
  let alive = false;
  try {
    process.kill(old, 0);
    alive = true;
  } catch {}
  if (alive) {
    console.log("✗ The reference browser is already open. Finish there, or run: npm run refs:login -- --done");
    process.exit(1);
  }
}

const cfg = JSON.parse(readFileSync(join(KIT, "scripts/refs-sources.json"), "utf8"));
const openAt = args.indexOf("--open");
const urls =
  openAt >= 0 && args[openAt + 1]
    ? [args[openAt + 1]]
    : cfg.sources.filter((s) => s.login).map((s) => s.loginUrl || s.url);

mkdirSync(PROFILE, { recursive: true, mode: 0o700 });
// A plain Chrome (no automation flags), so Google / Apple sign-in pages accept it.
const chrome = spawn(CHROME, [`--user-data-dir=${PROFILE}`, "--no-first-run", "--no-default-browser-check", "--new-window", ...urls], {
  stdio: "ignore",
});
writeFileSync(PIDFILE, String(chrome.pid));
const cleanup = () => rmSync(PIDFILE, { force: true });

console.log(`Reference browser open (profile: ${PROFILE}).`);
if (openAt < 0) {
  console.log("Log in yourself on each tab:");
  cfg.sources.filter((s) => s.login).forEach((s) => console.log(`  · ${s.name.padEnd(14)} ${s.loginUrl || s.url}`));
}
console.log('\nWhen you are finished, type "done" and press Enter (or just close the window).');

chrome.on("exit", () => {
  cleanup();
  console.log("✓ Reference browser closed. Logins stay in the profile for `npm run refs`.");
  process.exit(0);
});
if (process.stdin.isTTY) {
  const rl = createInterface({ input: process.stdin });
  rl.on("line", (line) => {
    if (line.trim().toLowerCase() === "done") {
      rl.close();
      chrome.kill("SIGTERM");
    }
  });
}
