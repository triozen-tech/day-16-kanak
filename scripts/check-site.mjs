#!/usr/bin/env node
// Checks that every image / video / frames folder used by the site (files in site/) exists, and that nothing in the
// code honours the OS reduce-motion setting (only ?static=1 may switch motion off: lib/gsap.ts prefersReducedMotion()),
// and that the site marks at least 3 record-cursor hover moments (data-hover-demo).
//   npm run check
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const files = [];
const walk = (d) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx?|css)$/.test(f)) files.push(p);
  }
};
walk("site");
const src = files.map((f) => readFileSync(f, "utf8")).join("\n");
const paths = [...new Set([...src.matchAll(/["'(](\/(?:images|frames|videos)\/[^"')]+)["')]/g)].map((m) => m[1]))];
let ok = true;
for (const p of paths) {
  const isFrames = p.startsWith("/frames/");
  const target = isFrames ? join("public", p, "manifest.json") : join("public", p);
  if (existsSync(target)) console.log(`  ✓ ${p}`);
  else {
    ok = false;
    console.log(`  ✗ ${p}  ${isFrames ? "(no manifest.json — run: npm run frames -- <video> " + p.slice(1) + ")" : "(file missing)"}`);
  }
}
console.log(ok ? "\nAll assets found.\n" : "\nSome assets are missing.\n");

// Motion lint: the OS "reduce motion" setting is ON by default on many Windows machines and turned live sites into
// flat static pages. Only ?static=1 may disable motion, so no code may read that setting (no CSS media query, no
// matchMedia). The patterns are built from pieces so this file never matches itself.
const RM = new RegExp(["prefers", "reduced", "motion"].join("-") + "|matchMedia\\([^)]*" + "reduce", "i");
const code = [];
const walkCode = (d) => {
  if (!existsSync(d)) return;
  for (const f of readdirSync(d)) {
    if (f === "node_modules" || f === ".next" || f === "archive") continue;
    const p = join(d, f);
    if (statSync(p).isDirectory()) walkCode(p);
    else if (/\.(tsx?|jsx?|mjs|css)$/.test(f)) code.push(p);
  }
};
["app", "components", "lib", "site", "scripts"].forEach(walkCode);
const offenders = code.filter((f) => RM.test(readFileSync(f, "utf8")));
if (offenders.length) {
  console.log("✗ Reduce-motion check FAILED: these files read the OS reduce-motion setting (only ?static=1 may disable motion):");
  offenders.forEach((f) => console.log(`    ${f}`));
  console.log("");
} else console.log("✓ Motion lint: nothing honours the OS reduce-motion setting (only ?static=1 disables motion).\n");

// Hover moments: the record cursor (components/engine/RecordCursor.tsx) visits every [data-hover-demo] in ?record=1;
// every reel needs at least 3 (cards, swatches, buttons, Add to cart). Checked once the site has its own components.
const built = existsSync("site/components") && readdirSync("site/components").some((f) => /\.tsx?$/.test(f));
const demos = (src.match(/data-hover-demo\b/g) ?? []).length;
const hoverOk = !built || demos >= 3;
if (!built) console.log("· Hover moments: site not built yet (placeholder), skipped.\n");
else if (hoverOk) console.log(`✓ Hover moments: ${demos} data-hover-demo marks in site/ (record cursor plays them in ?record=1).\n`);
else console.log(`✗ Hover moments: ${demos} data-hover-demo marks in site/, need at least 3 (cards, swatches, buttons, Add to cart).\n`);
process.exit(ok && !offenders.length && hoverOk ? 0 : 1);
