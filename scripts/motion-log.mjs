// Writes docs/MOTION-LOG.md + docs/motion-log.csv from docs/motion-log.json (the source of truth for the log).
//   node scripts/motion-log.mjs
import { readFileSync, writeFileSync } from "node:fs";

const { rows, skipped } = JSON.parse(readFileSync("docs/motion-log.json", "utf8"));
const esc = (s) => String(s ?? "").replace(/\|/g, "\\|");
const cell = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;
const cols = ["code", "category", "name", "variant_of", "source_site", "source_url", "type", "batch", "date"];

writeFileSync("docs/motion-log.csv", [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\n") + "\n");

const by = (k) => rows.reduce((m, r) => ((m[r[k]] = (m[r[k]] ?? 0) + 1), m), {});
const tally = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, n]) => `| ${esc(k)} | ${n} |`).join("\n");
const link = (u) => (/^https?:/.test(u) ? `[link](${u})` : esc(u));
const md = `# Motion log

Every motion in \`docs/MOTION-MENU.md\` (M75+, X19+, I11+, U01+), where its idea came from, and every candidate we skipped (with the reason).
Source of truth: \`docs/motion-log.json\` → \`node scripts/motion-log.mjs\` writes this file and \`docs/motion-log.csv\`.
No code was copied from any source; "inspired" = motion idea rebuilt from scratch in GSAP (see \`docs/SOURCES.md\` for licences).

**${rows.length} motions · ${skipped.length} skipped**

| Group | Motions |
|---|---|
${tally(by("category"))}

| Batch | Motions |
|---|---|
${tally(by("batch"))}

## Motions

| Code | Group | Name | Variant of | Source site | Source URL | Type | Batch | Date |
|---|---|---|---|---|---|---|---|---|
${rows.map((r) => `| ${r.code} | ${esc(r.category)} | ${esc(r.name)} | ${esc(r.variant_of ?? "")} | ${esc(r.source_site)} | ${link(r.source_url)} | ${esc(r.type)} | ${r.batch} | ${r.date} |`).join("\n")}

## Skipped

| Source URL | Reason | Batch |
|---|---|---|
${skipped.map((s) => `| ${link(s.source_url)} | ${esc(s.reason)} | ${s.batch ?? ""} |`).join("\n")}
`;
writeFileSync("docs/MOTION-LOG.md", md);
console.log(`motion log: ${rows.length} motions, ${skipped.length} skipped`);
