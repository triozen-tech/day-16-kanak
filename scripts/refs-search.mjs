#!/usr/bin/env node
// Search sheet (Round 0, step 1b; docs/REFERENCE-SOURCES.md).
//
//   npm run refs:search -- <day>      → day<N>/refs/search.html, opened in your normal browser
//
// For every approved section (refs/sections.json, from `npm run refs -- <day> "<category>" --sections` + `--approve`):
// 5 ready-made searches (2 same-niche + 3 any-business), each with a different style word (rotating by day), each as
// links to Pinterest, Dribbble (+ an animated-shots search) and Behance, plus the file names to save as.
// The page ONLY makes links: nothing here (and nothing in the kit) reads from those sites. You browse by hand, save
// screenshots (Cmd+Shift+4) and short clips (Cmd+Shift+5) into day<N>/refs/inbox/, then tell Claude "inbox done".
// Options: --no-open
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const KIT = resolve(fileURLToPath(import.meta.url), "../..");
const CFG = JSON.parse(readFileSync(join(KIT, "scripts/refs-sources.json"), "utf8"));
const args = process.argv.slice(2);
const kitJson = existsSync(join(KIT, ".kit.json")) ? JSON.parse(readFileSync(join(KIT, ".kit.json"), "utf8")) : null;
const day = /^\d{1,3}$/.test(args[0] ?? "") ? Number(args[0]) : kitJson ? Number(kitJson.day) : null;
if (!day) {
  console.log("Usage: npm run refs:search -- <day>   (after the section list is approved)");
  process.exit(1);
}
const HOME = kitJson ? dirname(kitJson.template) : dirname(KIT);
const OUT = join(HOME, `day${day}`, "refs");
const SECTIONS_FILE = join(OUT, "sections.json");
if (!existsSync(SECTIONS_FILE)) {
  console.log(`✗ No section list yet: npm run refs -- ${day} "<category>" --sections, then the user's OK and --approve.`);
  process.exit(1);
}
const SEC = JSON.parse(readFileSync(SECTIONS_FILE, "utf8"));
if (!SEC.approved) {
  console.log(`✗ The section list is not approved yet. On the user's OK: npm run refs -- ${day} --approve`);
  process.exit(1);
}
const INBOX = join(OUT, "inbox");
mkdirSync(INBOX, { recursive: true });

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const STYLES = CFG.styleWords;
const SITES = CFG.searchSites;
const link = (site, q) => SITES[site].url.replace("{q}", encodeURIComponent(q));
const business = SEC.category;

const blocks = SEC.sections.map((sec, idx) => {
  const words = sec.search ?? CFG.sections[sec.id]?.search ?? sec.name.toLowerCase(); // sections.json can tailor it per day
  // 5 different style words per section, rotating with the day and the section
  const start = (day * 3 + idx * 5) % STYLES.length;
  const style = Array.from({ length: 5 }, (_, k) => STYLES[(start + k) % STYLES.length]);
  const rows = [
    { kind: "same niche", q: `${business} ${words} ${style[0]} website` },
    { kind: "same niche", q: `${business} ${words} ${style[1]} web design` },
    { kind: "any business", q: `${words} ${style[2]} website` },
    { kind: "any business", q: `${words} ${style[3]} web design` },
    { kind: "any business", q: `${words} ${style[4]} website` },
  ].map((r, k) => ({ ...r, style: style[k] }));
  const files = [`${sec.id}-1.png`, `${sec.id}-2.png`, `${sec.id}-3.png`, `${sec.id}-1.mov`];
  return { sec, rows, files, n: idx + 1 };
});

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Search sheet · Day ${day} · ${esc(business)}</title>
<style>
:root{--bg:#f4f3ef;--card:#fff;--fg:#151515;--muted:#6b6a66;--line:#e2e0da;--chip:#ecebe6;--p:#e60023;--d:#ea4c89;--b:#1769ff}
@media (prefers-color-scheme:dark){:root{--bg:#121212;--card:#1b1b1b;--fg:#f0efea;--muted:#9a9993;--line:#2a2a2a;--chip:#262626}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.45 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
.top{padding:36px 40px 22px;border-bottom:1px solid var(--line)}h1{font-size:38px;line-height:1;margin:0 0 14px;letter-spacing:-.02em}h1 small{display:block;font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:10px}
.how{display:flex;gap:28px;flex-wrap:wrap;color:var(--muted)}.how b{color:var(--fg)}
code{background:var(--chip);padding:2px 6px;border-radius:4px;font-size:12.5px}
.inbox{display:flex;gap:10px;align-items:center;margin-top:14px}.inbox button,.files button{font:inherit;font-size:12px;border:1px solid var(--line);background:var(--card);color:var(--fg);border-radius:6px;padding:4px 10px;cursor:pointer}
main{padding:10px 40px 60px;display:grid;gap:18px}
.sec{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:18px 20px}
.sec header{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap}.num{color:var(--muted);font-variant-numeric:tabular-nums}h2{margin:0;font-size:20px}.want{color:var(--muted)}
.files{margin:10px 0 12px;display:flex;gap:6px;flex-wrap:wrap;align-items:center;color:var(--muted);font-size:12px}
table{width:100%;border-collapse:collapse}td{padding:8px 6px;border-top:1px solid var(--line);vertical-align:middle}
.kind{white-space:nowrap;font-size:12px;color:var(--muted);width:110px}.same{color:#0d6b3a}
.style{white-space:nowrap}.style span{background:var(--chip);border-radius:99px;padding:2px 9px;font-size:12px;font-weight:600}
.q{width:100%;font-size:13px}
.go{white-space:nowrap;text-align:right}.go a{display:inline-block;margin-left:6px;padding:5px 10px;border-radius:6px;color:#fff;text-decoration:none;font-weight:600;font-size:12px}
.go a:visited{opacity:.55}.p{background:var(--p)}.d{background:var(--d)}.da{background:#b03a6a}.b{background:var(--b)}
footer{padding:0 40px 40px;color:var(--muted);font-size:12px}
</style></head><body>
<div class="top"><h1><small>Search sheet · Day ${day}</small>${esc(business)}</h1>
<div class="how"><span><b>1.</b> Click a search (opens Pinterest, Dribbble or Behance in a new tab)</span><span><b>2.</b> Screenshot: <code>Cmd+Shift+4</code> · clip: <code>Cmd+Shift+5</code> (5–10 s)</span><span><b>3.</b> Save into the inbox, named by section (<code>hero-1.png</code>, <code>product-2.mov</code>)</span><span><b>4.</b> Tell Claude <b>"inbox done"</b></span></div>
<div class="inbox">Inbox: <code id="inbox">${esc(INBOX)}</code><button type="button" data-copy="${esc(INBOX)}">Copy path</button></div></div>
<main>${blocks
  .map(
    ({ sec, rows, files, n }) => `
<section class="sec"><header><span class="num">${String(n).padStart(2, "0")}</span><h2>${esc(sec.name)}</h2><span class="want">${esc(sec.want)}</span></header>
<div class="files">Save as: ${files.map((f) => `<button type="button" data-copy="${esc(f)}" title="copy">${esc(f)}</button>`).join("")}</div>
<table>${rows
      .map(
        (r) => `<tr><td class="kind${r.kind === "same niche" ? " same" : ""}">${esc(r.kind)}</td><td class="style"><span>${esc(r.style)}</span></td><td class="q">${esc(r.q)}</td>
<td class="go"><a class="p" href="${esc(link("pinterest", r.q))}" target="_blank" rel="noreferrer">Pinterest</a><a class="d" href="${esc(link("dribbble", r.q))}" target="_blank" rel="noreferrer">Dribbble</a><a class="da" href="${esc(link("dribbble", `${r.q} animation`))}" target="_blank" rel="noreferrer" title="Dribbble search with 'animation' added (motion shots)">Dribbble · animated</a><a class="b" href="${esc(link("behance", r.q))}" target="_blank" rel="noreferrer">Behance</a></td></tr>`,
      )
      .join("")}</table></section>`,
  )
  .join("")}</main>
<footer>This page only makes links: nothing reads from Pinterest, Dribbble or Behance (their terms ban automated access). Private, never published. Style words rotate by day (${esc(STYLES.join(" · "))}).</footer>
<script>document.addEventListener("click",async e=>{const b=e.target.closest("[data-copy]");if(!b)return;try{await navigator.clipboard.writeText(b.dataset.copy);const t=b.textContent;b.textContent="Copied ✓";setTimeout(()=>b.textContent=t,1200)}catch{prompt("Copy:",b.dataset.copy)}})</script>
</body></html>`;

const file = join(OUT, "search.html");
writeFileSync(file, html);
console.log(`✓ Search sheet: ${file}`);
console.log(`  ${SEC.sections.length} sections × 5 searches (2 same niche + 3 any business) × Pinterest · Dribbble (+ animated) · Behance`);
console.log(`  Inbox: ${INBOX}  (hero-1.png, product-2.mov …). Then tell Claude "inbox done".`);
if (!args.includes("--no-open")) spawnSync("open", [file]); // your normal browser
