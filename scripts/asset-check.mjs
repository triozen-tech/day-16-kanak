// Asset size check before a commit/push (raw/, public/frames/, public/images/, public/videos/, cover.jpg go into the day's repo).
//   npm run assets            → table of asset folders + biggest file; exits 1 if a file > 50 MB is not in Git LFS
// Files over 50 MB must go through Git LFS:  git lfs track "<path>"  (adds the exact path to .gitattributes).
// Files over 100 MB: GitHub refuses them without LFS; this script warns loudly.
import { execSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ASSETS = ["raw", "public/frames", "public/images", "public/videos", "cover.jpg"];
const MB = 1024 * 1024;
const files = [];
const walk = (p) => {
  if (!existsSync(p)) return;
  const s = statSync(p);
  if (s.isFile()) return void (p.endsWith(".DS_Store") || files.push({ p, size: s.size }));
  for (const f of readdirSync(p)) walk(join(p, f));
};
ASSETS.forEach(walk);

let lfs = new Set();
try {
  lfs = new Set(execSync("git lfs ls-files -n", { stdio: ["ignore", "pipe", "ignore"] }).toString().split("\n").filter(Boolean));
} catch {} // git-lfs not installed
const attr = (p) => {
  try {
    return execSync(`git check-attr filter -- "${p}"`).toString().includes("filter: lfs");
  } catch {
    return false;
  }
};

const total = files.reduce((a, f) => a + f.size, 0);
const big = files.reduce((a, f) => (f.size > (a?.size ?? 0) ? f : a), null);
for (const a of ASSETS) {
  const sum = files.filter((f) => f.p === a || f.p.startsWith(a + "/")).reduce((s, f) => s + f.size, 0);
  if (sum) console.log(`  ${a.padEnd(15)} ${(sum / MB).toFixed(1).padStart(7)} MB`);
}
console.log(`  ${"total".padEnd(15)} ${(total / MB).toFixed(1).padStart(7)} MB · biggest: ${big ? `${big.p} (${(big.size / MB).toFixed(1)} MB)` : "—"}`);

let bad = 0;
for (const f of files.filter((f) => f.size > 50 * MB)) {
  const inLfs = lfs.has(f.p) || attr(f.p);
  if (f.size > 100 * MB) console.log(`  ⚠ OVER 100 MB: ${f.p} (${(f.size / MB).toFixed(1)} MB)${inLfs ? " · in LFS" : " · GitHub will refuse it without LFS"}`);
  if (!inLfs) {
    bad++;
    console.log(`  ✗ over 50 MB, not in LFS: ${f.p} → brew install git-lfs; git lfs install; git lfs track "${f.p}"`);
  }
}
console.log(bad ? "FAIL: move the files above to Git LFS before pushing" : "assets OK (nothing over 50 MB outside LFS)");
process.exit(bad ? 1 : 0);
