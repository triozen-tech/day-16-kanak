// Shared helpers for `npm run new-day` and `npm run sync-kit`.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

/** Kit files a day folder gets from the template (and gets again on `npm run sync-kit`).
 *  Never listed: site/, raw/, public/images/, public/frames/, cover.jpg, archive/, recordings/. */
export const KIT_PATHS = [
  "CLAUDE.md",
  "README.md",
  "THIRD-PARTY-NOTICES.md",
  "docs",
  "components",
  "lib",
  "scripts",
  ".claude/skills",
  "app",
  "public/lab",
  "skills-lock.json",
  "kit.config.json",
  "tsconfig.json",
  "next.config.ts",
  "postcss.config.mjs",
  ".gitattributes",
  ".gitignore",
];

/** Never copied, wherever they sit. */
const SKIP = new Set(["node_modules", ".next", ".git", ".DS_Store", ".kit.json", "tsconfig.tsbuildinfo", "next-env.d.ts"]);

/** Every file under `root` for the given kit paths, as root-relative paths with forward slashes. */
export function kitFiles(root, paths = KIT_PATHS) {
  const out = [];
  const walk = (abs) => {
    const name = abs.split(sep).pop();
    if (SKIP.has(name)) return;
    const st = statSync(abs);
    if (st.isDirectory()) for (const n of readdirSync(abs)) walk(join(abs, n));
    else out.push(relative(root, abs).split(sep).join("/"));
  };
  for (const p of paths) if (existsSync(join(root, p))) walk(join(root, p));
  return out.sort();
}

/** Text files that mention the dev server address get the day's port (the template says 3005). */
const PORT_TEXT = /\.(md|mdx|txt)$/;
export function withPort(rel, buf, port) {
  if (!port || !PORT_TEXT.test(rel)) return buf;
  return Buffer.from(buf.toString("utf8").replace(/localhost:3005\b/g, `localhost:${port}`).replace(/-p 3005\b/g, `-p ${port}`));
}

export const sha1 = (buf) => createHash("sha1").update(buf).digest("hex");

export const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));

/** Port in a package.json's "dev" script (`next dev -p 3002`), or null. */
export function portOf(pkg) {
  const m = (pkg?.scripts?.dev ?? "").match(/-p (\d+)/);
  return m ? Number(m[1]) : null;
}
