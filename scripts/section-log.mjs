// Writes docs/SECTION-LOG.md + docs/section-log.csv from docs/section-log.json (the source of truth for the log).
//   node scripts/section-log.mjs
import { readFileSync, writeFileSync } from "node:fs";

const { rows, skipped } = JSON.parse(readFileSync("docs/section-log.json", "utf8"));
const esc = (s) => String(s ?? "").replace(/\|/g, "\\|");
const cell = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;
const cols = ["code", "category", "name", "source_site", "source_url", "type", "batch", "date"];

writeFileSync("docs/section-log.csv", [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\n") + "\n");

const by = (k) => rows.reduce((m, r) => ((m[r[k]] = (m[r[k]] ?? 0) + 1), m), {});
const tally = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, n]) => `| ${esc(k)} | ${n} |`).join("\n");
const link = (u) => (/^https?:/.test(u) ? `[link](${u})` : esc(u));
const md = `# Section log

Every layout in \`docs/SECTION-MENU.md\`, where its idea came from, and every candidate we skipped (with the reason).
Source of truth: \`docs/section-log.json\` → \`node scripts/section-log.mjs\` writes this file and \`docs/section-log.csv\`.
No code was copied from any source; "inspired" = layout idea rebuilt from scratch (see \`docs/SOURCES.md\` for licences).

**${rows.length} layouts · ${skipped.length} skipped**

| Category | Layouts |
|---|---|
${tally(by("category"))}

| Batch | Layouts |
|---|---|
${tally(by("batch"))}

## Layouts

| Code | Category | Name | Source site | Source URL | Type | Batch | Date |
|---|---|---|---|---|---|---|---|
${rows.map((r) => `| ${r.code} | ${esc(r.category)} | ${esc(r.name)} | ${esc(r.source_site)} | ${link(r.source_url)} | ${esc(r.type)} | ${r.batch} | ${r.date} |`).join("\n")}

## Skipped

| Source URL | Reason | Batch |
|---|---|---|
${skipped.map((s) => `| ${link(s.source_url)} | ${esc(s.reason)} | ${s.batch ?? ""} |`).join("\n")}
`;
writeFileSync("docs/SECTION-LOG.md", md);

// keep the "Codes:" line at the top of SECTION-MENU in step with its entries
const menu = readFileSync("docs/SECTION-MENU.md", "utf8");
const heads = [...menu.matchAll(/^## ([A-Z]{2}) · (.+)$/gm)].map((m) => [m[1], m[2].replace(/ \(.*\)$/, "").toLowerCase()]);
const count = (c) => (menu.match(new RegExp(`^\\*\\*${c}\\d{2} · `, "gm")) ?? []).length;
const total = heads.reduce((n, [c]) => n + count(c), 0);
const line = `Codes (${heads.length} categories): ${heads.map(([c, n]) => `**${c}** ${n} ×${count(c)}`).join(" · ")} (${total} layouts).`;
writeFileSync("docs/SECTION-MENU.md", menu.replace(/^Codes[ :(].*$/m, line));
console.log(`section log: ${rows.length} layouts, ${skipped.length} skipped`);
