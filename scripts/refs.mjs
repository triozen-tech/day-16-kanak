#!/usr/bin/env node
// Reference board, PER SECTION (Round 0, step 1; docs/REFERENCE-SOURCES.md).
//
//   a. npm run refs -- <day> "<category>" --sections   suggest the section list for this business → refs/sections.json
//                                                       (or --sections "hero,shop,product,…"); STOP for the user's OK, then
//      npm run refs -- <day> --approve
//   b. npm run refs:search -- <day>                     search sheet (scripts/refs-search.mjs): the user browses Pinterest,
//                                                       Dribbble and Behance BY HAND and saves shots/clips into refs/inbox/
//   d. npm run refs -- <day> "<category>"               sorts the inbox into sections ("mine"), then fills every section up to
//                                                       3 options from allowed live sites (1 same business + 2 any business,
//                                                       creative/award work first) + 1 live clip of its hover/motion
//                                                       → board.html (grouped by section, lettered pick boxes), REFS.md, refs.json
//      npm run refs -- <day> --board                    re-sort the inbox, re-pick, rebuild (after notes / inbox.json)
//      npm run refs -- <day> "<category>" --more        another browsing run (≤ 30 more loads) for thin sections
//   e. npm run refs -- <day> --pick "hero=B,product=A,…" save the user's picks (REFS.md), for DESIGN.md
//
//   Inbox: day<N>/refs/inbox/ — screenshots (.png/.jpg) and clips (.mov/.mp4), named by section (hero-1.png, product-2.mov).
//   Other names: Claude looks at them and writes refs/inbox.json {"Screenshot ….png": "reviews"}, then --board.
//
// Options: --url <https://…> (add a same-business site, repeatable) · --headless · --dry · --no-clip
// Inside a day folder the day is optional. Saves to <projects>/day<N>/refs/ (outside every repo; refs/ is git-ignored).
//
// Browses like a person with the saved-login profile (npm run refs:login): one visible Chrome window, ≤ 30 page loads per
// run, 2.5–6 s pauses, robots.txt respected, screenshots + short clips only. Sources with "automated": false (Pinterest,
// Dribbble, Behance and the rest: their terms ban automated access) are NEVER opened by this script.
// The board is private inspiration: never published, never copied into a site.
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const KIT = resolve(fileURLToPath(import.meta.url), "../..");
const CFG = JSON.parse(readFileSync(join(KIT, "scripts/refs-sources.json"), "utf8"));
// hosts of every source marked "automated": false (browse by hand only)
const HAND_ONLY = CFG.sources.filter((s) => !s.automated).map((s) => new URL(s.url).hostname.replace(/^www\./, ""));
const PROFILE = resolve(process.env.REFS_PROFILE || join(homedir(), ".triozen-ref-browser"));
const MAX_LOADS = 30;
// Pinterest, Dribbble, Behance (and every source with "automated": false): browse by hand only, never opened here
const BANNED = /(^|\.)(pinterest\.[a-z.]+|pin\.it|dribbble\.com|behance\.net)$/i;
const TAGS = ["layout", "hover", "motion", "product detail", "transition", "typography"];
const AWARD = new Set(["awwwards", "cssda", "cssnectar", "onepagelove", "httpster", "recent"]);
const CLIPS_PER_SECTION = 3;
const FF = existsSync(join(KIT, "node_modules/ffmpeg-static/ffmpeg")) ? join(KIT, "node_modules/ffmpeg-static/ffmpeg") : "ffmpeg";

// ---------- args ----------
const argv = process.argv.slice(2);
const opts = { urls: [], headless: false, dry: false, board: false, clip: true, sections: null, approve: false, more: false, pick: null };
const pos = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--url") opts.urls.push(argv[++i]);
  else if (a === "--headless") opts.headless = true;
  else if (a === "--dry") opts.dry = true;
  else if (a === "--board") opts.board = true;
  else if (a === "--no-clip") opts.clip = false;
  else if (a === "--approve") opts.approve = true;
  else if (a === "--more") opts.more = true;
  else if (a === "--pick") opts.pick = argv[++i] ?? "";
  else if (a === "--sections") opts.sections = argv[i + 1] && !argv[i + 1].startsWith("--") && /[,:]/.test(argv[i + 1]) ? argv[++i] : true;
  else pos.push(a);
}

// ---------- where: the day's own refs/ folder ----------
const kitJson = existsSync(join(KIT, ".kit.json")) ? JSON.parse(readFileSync(join(KIT, ".kit.json"), "utf8")) : null;
const day = /^\d{1,3}$/.test(pos[0] ?? "") ? Number(pos.shift()) : kitJson ? Number(kitJson.day) : null;
let category = (pos.join(" ") || "").trim();
const usage = () => {
  console.log('Usage: npm run refs -- <day> "<category>" --sections   suggest the section list (then wait for the OK)');
  console.log("       npm run refs -- <day> --approve                  lock the list after the user's OK");
  console.log('       npm run refs -- <day> "<category>"               collect 3 options + 1 clip per section');
  console.log('       npm run refs -- <day> --board · --more · --pick "hero=B,shop=A"');
  process.exit(1);
};
if (!day) usage();
const HOME = kitJson ? dirname(kitJson.template) : dirname(KIT);
if (kitJson && Number(kitJson.day) !== day) console.log(`! This kit is Day ${Number(kitJson.day)}; using Day ${day} as asked.`);
const OUT = join(HOME, `day${day}`, "refs");
const INBOX = join(OUT, "inbox");
const SECTIONS_FILE = join(OUT, "sections.json");
const DATA_FILE = join(OUT, "refs.json");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pause = () => sleep(2500 + Math.random() * 3500); // a person reading, not a crawler
const host = (u) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const words = (s) => s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
const matchKey = (obj, cat) => Object.keys(obj).find((k) => k !== "default" && k.split("|").some((w) => words(cat).some((x) => x.startsWith(w) || w.startsWith(x))));

// ======================================================================================================================
// 1. section list
// ======================================================================================================================
if (opts.sections) {
  if (!category) usage();
  const key = matchKey(CFG.sectionPresets, category) ?? "default";
  const ids =
    opts.sections === true
      ? CFG.sectionPresets[key]
      : opts.sections.split(",").map((s) => s.trim()).filter(Boolean);
  const list = ids.map((raw) => {
    const [id, name] = raw.split(":").map((x) => x.trim());
    const def = CFG.sections[id];
    if (!def && !name) console.log(`! "${id}" is not in the section library: give it a name ("${id}:My name") and words in sections.json`);
    return { id, name: name || def?.name || id, want: def?.want ?? "", kind: def?.kind ?? "text", words: def?.words ?? id, search: def?.search ?? (name || id).toLowerCase() };
  });
  mkdirSync(INBOX, { recursive: true });
  writeFileSync(SECTIONS_FILE, JSON.stringify({ day, category, approved: false, sections: list }, null, 2) + "\n");
  console.log(`Suggested sections for "${category}" (${key === "default" ? "general list" : key.split("|")[0]}) → ${SECTIONS_FILE}\n`);
  list.forEach((s, i) => console.log(`  ${String(i + 1).padStart(2)}. ${s.name.padEnd(26)} ${s.want}`));
  console.log(`\nInbox for your own screenshots: ${INBOX}`);
  console.log("STOP: show this list to the user. On their OK:  npm run refs -- " + day + " --approve");
  process.exit(0);
}
if (opts.approve) {
  if (!existsSync(SECTIONS_FILE)) usage();
  const s = readJson(SECTIONS_FILE);
  s.approved = true;
  writeFileSync(SECTIONS_FILE, JSON.stringify(s, null, 2) + "\n");
  console.log(`✓ Section list approved (${s.sections.map((x) => x.name).join(" · ")}). Next: npm run refs:search -- ${day}  (search sheet)`);
  process.exit(0);
}

// ======================================================================================================================
// 2. selection + board (pure: pool + inbox + overrides → 3 options per section)
// ======================================================================================================================
const IMG = /\.(png|jpe?g|webp|gif)$/i;
const VIDEO = /\.(mov|mp4|m4v|webm)$/i;
/** The user's own shots and clips ("mine"): by inbox.json, else by a section id / name in the file name. */
function inboxItems(sections) {
  if (!existsSync(INBOX)) return { items: [], unsorted: [] };
  const map = existsSync(join(OUT, "inbox.json")) ? readJson(join(OUT, "inbox.json")) : {};
  const items = [];
  const unsorted = [];
  const web = join(OUT, "inbox-web");
  for (const f of readdirSync(INBOX).filter((f) => IMG.test(f) || VIDEO.test(f)).sort()) {
    const name = f.toLowerCase();
    const sec =
      map[f] ??
      sections.find((s) => new RegExp(`(^|[^a-z])${s.id}([^a-z]|$)`).test(name))?.id ??
      sections.find((s) => words(s.name).some((w) => w.length > 3 && name.includes(w)))?.id;
    if (!sec || !sections.some((s) => s.id === sec)) {
      unsorted.push(f);
      continue;
    }
    const item = { id: `in:${f}`, inbox: true, section: sec, shot: `inbox/${f}`, video: null, title: f.replace(IMG, "").replace(VIDEO, ""), source: "mine", same: null };
    if (VIDEO.test(f)) {
      // screen recordings (.mov): a web-playable copy + a poster frame for the board
      mkdirSync(web, { recursive: true });
      const base = f.replace(VIDEO, "");
      const mp4 = join(web, `${base}.mp4`);
      const jpg = join(web, `${base}.jpg`);
      if (!existsSync(mp4)) spawnSync(FF, ["-v", "error", "-y", "-i", join(INBOX, f), "-t", "12", "-vf", "scale='min(1280,iw)':-2,fps=30,format=yuv420p", "-c:v", "libx264", "-crf", "26", "-preset", "veryfast", "-an", mp4]);
      if (!existsSync(jpg)) spawnSync(FF, ["-v", "error", "-y", "-ss", "0.5", "-i", join(INBOX, f), "-frames:v", "1", "-vf", "scale='min(1280,iw)':-2", jpg]);
      item.video = existsSync(mp4) ? `inbox-web/${base}.mp4` : null;
      item.shot = existsSync(jpg) ? `inbox-web/${base}.jpg` : item.shot;
    }
    items.push(item);
  }
  return { items, unsorted };
}

function score(c, used) {
  let s = 0;
  if (AWARD.has(c.sourceId)) s += 3; // creative / award work before big-brand shops
  const f = c.features ?? [];
  s += Math.min(3, ["WebGL canvas", "GSAP", "smooth scroll", "custom cursor", "page transitions"].filter((x) => f.includes(x)).length);
  if (c.hover) s += 0.5;
  if (c.clip) s += 0.5;
  s -= 2 * (used.get(c.site) ?? 0); // spread options across many sites
  return s;
}

function select(data) {
  const { sections } = data;
  const { items, unsorted } = inboxItems(sections);
  const used = new Map();
  const out = [];
  for (const sec of sections) {
    const override = data.override?.[sec.id];
    const mine = items.filter((i) => i.section === sec.id); // all of the user's own, first
    const pool = data.pool.filter((c) => c.section === sec.id);
    let chosen = [...mine];
    if (override?.length) chosen = override.map((id) => [...mine, ...pool].find((c) => c.id === id)).filter(Boolean);
    else {
      const take = (cands) => {
        const c = cands.filter((x) => !chosen.includes(x) && !chosen.some((y) => y.site && y.site === x.site)).sort((a, b) => score(b, used) - score(a, used))[0];
        if (c) {
          chosen.push(c);
          used.set(c.site, (used.get(c.site) ?? 0) + 1);
        }
        return c;
      };
      // fill up to 3: 1 from the same kind of business, then any business, then whatever is left
      if (chosen.length < 3) take(pool.filter((c) => c.same));
      while (chosen.length < 3 && take(pool.filter((c) => !c.same)));
      while (chosen.length < 3 && take(pool));
    }
    // the section's clip: the liveliest real-site clip (chosen options first)
    const clips = pool.filter((c) => c.clip).sort((a, b) => (chosen.includes(b) - chosen.includes(a)) || b.clipScore - a.clipScore);
    const options = chosen.map((c, i) => ({ letter: String.fromCharCode(65 + i), ...c }));
    out.push({ ...sec, options, clip: clips[0] ? { id: clips[0].id, file: clips[0].clip, site: clips[0].site, url: clips[0].url } : null });
  }
  return { sections: out, unsorted };
}

function autoTake(c, sec) {
  const f = c.features ?? [];
  const bits = [];
  if (sec.kind === "pdp") bits.push(...f.filter((x) => /swatch|chips|buy box|add-to-cart|zoom|gallery/.test(x)));
  if (sec.kind === "grid") bits.push(...f.filter((x) => /swatch|add-to-cart|gallery/.test(x)));
  bits.push(...f.filter((x) => /WebGL|GSAP|smooth|cursor|transition|marquee|video/.test(x)));
  const tag = sec.kind === "pdp" ? "product detail" : f.includes("custom cursor") || c.hover >= 3 ? "hover" : bits.some((b) => /WebGL|GSAP|video|marquee|transition/.test(b)) ? "motion" : "layout";
  return { tag, take: `auto: ${[...new Set(bits)].slice(0, 3).join(", ") || "layout of this section"} (replace with what to take from it)` };
}

function writeBoard(data) {
  const { sections, unsorted } = select(data);
  data.selection = sections.map((s) => ({ id: s.id, options: s.options.map((o) => o.id), clip: s.clip?.id ?? null }));
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2) + "\n");
  const picks = data.picks ?? {};
  const opt = (s, o) => {
    const badge = o.inbox ? (o.video ? "mine · clip" : "mine") : o.same ? "same business" : "any business";
    return `
      <label class="opt" data-sec="${esc(s.id)}" data-letter="${o.letter}">
        <input type="radio" name="${esc(s.id)}" value="${o.letter}"${picks[s.id] === o.letter ? " checked" : ""}>
        <span class="media">${o.video ? `<video src="${esc(o.video)}" poster="${esc(o.shot)}" muted loop playsinline autoplay></video>` : `<img src="${esc(o.shot)}" alt="" loading="lazy">`}<span class="letter">${o.letter}</span></span>
        <span class="meta">
          <span class="row"><span class="tag t-${esc((o.tag ?? "layout").replace(/\s/g, "-"))}">${esc(o.tag ?? "layout")}</span><span class="badge ${o.inbox ? "b-in" : o.same ? "b-same" : "b-other"}">${esc(badge)}</span></span>
          <span class="name">${esc(o.title)}</span>
          <span class="take"><b>Take:</b> ${esc(o.take ?? "—")}</span>
          ${o.url ? `<span class="links"><a href="${esc(o.url)}" target="_blank" rel="noreferrer">${esc(host(o.url))}</a> · ${esc(o.source)} · <a href="${esc(o.shot)}" target="_blank">full shot</a></span>` : `<span class="links">${esc(o.source)}</span>`}
        </span>
      </label>`;
  };
  const rows = sections
    .map(
      (s, i) => `
  <section class="sec" id="s-${esc(s.id)}">
    <header><span class="num">${String(i + 1).padStart(2, "0")}</span><h2>${esc(s.name)}</h2><p>${esc(s.want)}</p><span class="pickhint">pick 1</span></header>
    <div class="grid">
      ${s.options.map((o) => opt(s, o)).join("") || `<p class="empty">No options yet: run with --more, or drop screenshots in inbox/.</p>`}
      <figure class="clip">${s.clip ? `<video src="${esc(s.clip.file)}" muted loop playsinline preload="metadata"></video><figcaption>Live clip · <a href="${esc(s.clip.url)}" target="_blank" rel="noreferrer">${esc(s.clip.site)}</a> · hover &amp; motion</figcaption>` : `<div class="noclip">no live clip for this section</div>`}</figure>
    </div>
  </section>`,
    )
    .join("");
  const sources = [...new Set(sections.flatMap((s) => s.options.map((o) => o.source)))];
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Refs · Day ${data.day} · ${esc(data.category)}</title>
<style>
:root{--bg:#f4f3ef;--card:#fff;--fg:#151515;--muted:#6b6a66;--line:#e2e0da;--chip:#ecebe6;--pick:#1b5cff}
@media (prefers-color-scheme:dark){:root{--bg:#121212;--card:#1b1b1b;--fg:#f0efea;--muted:#9a9993;--line:#2a2a2a;--chip:#262626;--pick:#6d97ff}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.45 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;padding-bottom:84px}
.top{padding:36px 40px 20px;display:flex;gap:24px;align-items:end;justify-content:space-between;flex-wrap:wrap;border-bottom:1px solid var(--line)}
h1{font-size:40px;line-height:1;margin:0;letter-spacing:-.02em}h1 small{display:block;font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:10px}
.stats{color:var(--muted);text-align:right}.stats b{color:var(--fg)}
.warn{margin:16px 40px 0;padding:12px 16px;border:1px dashed #c98a00;border-radius:8px;color:#8a5a00;background:#fff7e6}
.sec{padding:26px 40px 10px}.sec header{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin-bottom:14px}
.num{font-variant-numeric:tabular-nums;color:var(--muted)}h2{margin:0;font-size:22px;letter-spacing:-.01em}.sec header p{margin:0;color:var(--muted)}
.pickhint{margin-left:auto;font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.1em}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px}
.opt{position:relative;display:flex;flex-direction:column;background:var(--card);border:2px solid var(--line);border-radius:10px;overflow:hidden;cursor:pointer;transition:border-color .2s,box-shadow .2s}
.opt:hover{border-color:color-mix(in oklab,var(--pick) 45%,var(--line))}
.opt input{position:absolute;opacity:0;pointer-events:none}
.opt:has(input:checked){border-color:var(--pick);box-shadow:0 0 0 3px color-mix(in oklab,var(--pick) 25%,transparent)}
.media{position:relative;display:block;aspect-ratio:16/10;background:var(--chip)}.media video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.media img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top}
.letter{position:absolute;left:10px;top:10px;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.92);color:#111;font-weight:700;border:2px solid #111}
.opt:has(input:checked) .letter{background:var(--pick);border-color:var(--pick);color:#fff}
.meta{display:flex;flex-direction:column;gap:6px;padding:12px 14px 14px}.row{display:flex;gap:6px;align-items:center;font-size:12px}
.tag{padding:2px 9px;border-radius:99px;background:var(--chip);font-weight:600}
.t-hover{background:#ffe2c7;color:#5a2a00}.t-product-detail{background:#d9ecff;color:#0b3a66}.t-motion{background:#e8dcff;color:#36156b}
.t-transition{background:#d8f5e3;color:#0d4a2a}.t-typography{background:#f6d9e4;color:#5e1230}.t-layout{background:#ececec;color:#2b2b2b}
.badge{font-size:11px;color:var(--muted);border:1px solid var(--line);padding:1px 7px;border-radius:99px}.b-same{color:#0d4a2a;border-color:#9fd8b5}.b-in{color:#5a2a00;border-color:#f0c08a}
.name{font-weight:600}.take{font-size:13px}.links{font-size:12px;color:var(--muted)}.links a{color:inherit}
.clip{margin:0;background:#000;border-radius:10px;overflow:hidden;display:flex;flex-direction:column}.clip video{width:100%;aspect-ratio:16/10;object-fit:cover;object-position:top;display:block}
.clip figcaption{padding:10px 12px;color:#ddd;font-size:12px}.clip a{color:#fff}.noclip{flex:1;display:grid;place-items:center;color:#888;font-size:12px;min-height:160px}
.empty{grid-column:span 3;color:var(--muted)}
.bar{position:fixed;left:0;right:0;bottom:0;display:flex;gap:16px;align-items:center;padding:14px 40px;background:var(--card);border-top:1px solid var(--line);z-index:5}
.bar #picks{flex:1;font-variant-numeric:tabular-nums;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bar button{font:inherit;font-weight:600;padding:9px 16px;border-radius:8px;border:0;background:var(--pick);color:#fff;cursor:pointer}
footer{padding:20px 40px;color:var(--muted);font-size:12px}
</style></head><body>
<div class="top"><h1><small>Reference board · Day ${data.day} · pick 1 per section</small>${esc(data.category)}</h1>
<div class="stats"><b>${sections.length}</b> sections · <b>${sections.reduce((n, s) => n + s.options.length, 0)}</b> options · <b>${sections.filter((s) => s.clip).length}</b> live clips<br>${esc(sources.join(" · "))}<br>${esc(data.date)} · ${data.loads} page loads</div></div>
${unsorted.length ? `<p class="warn">Inbox: ${unsorted.length} screenshot(s) not sorted yet (${esc(unsorted.join(", "))}). Claude sorts them into sections (inbox.json) and rebuilds the board.</p>` : ""}
${rows}
<footer>Private inspiration for Round 0 only: never published, never copied. Each option: what to take from it; DESIGN.md names the reference behind every section and mixes ideas, never one site's layout.${data.skipped?.length ? `<br>Skipped: ${esc(data.skipped.join(" · "))}` : ""}</footer>
<div class="bar"><span id="picks">Your picks: none yet</span><button type="button" id="copy">Copy my picks</button></div>
<script>
const KEY="refs-picks-day${data.day}";
const secs=${JSON.stringify(sections.map((s) => ({ id: s.id, name: s.name })))};
function load(){try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch{return {}}}
function save(p){try{localStorage.setItem(KEY,JSON.stringify(p))}catch{}}
const picks=Object.assign(${JSON.stringify(picks)},load());
for(const [id,l] of Object.entries(picks)){const r=document.querySelector('input[name="'+id+'"][value="'+l+'"]');if(r)r.checked=true}
function text(){return secs.filter(s=>picks[s.id]).map(s=>s.id+"="+picks[s.id]).join(",")}
function show(){const n=secs.filter(s=>picks[s.id]).length;document.getElementById("picks").textContent=n?("Your picks ("+n+"/"+secs.length+"): "+secs.filter(s=>picks[s.id]).map(s=>s.name+" "+picks[s.id]).join(" · ")):"Your picks: none yet"}
document.addEventListener("change",e=>{if(e.target.type==="radio"){picks[e.target.name]=e.target.value;save(picks);show()}});
document.getElementById("copy").addEventListener("click",async()=>{const t=text();try{await navigator.clipboard.writeText(t);document.getElementById("copy").textContent="Copied ✓"}catch{prompt("Copy your picks:",t)}setTimeout(()=>document.getElementById("copy").textContent="Copy my picks",1600)});
show();
const io=new IntersectionObserver(es=>es.forEach(e=>{const v=e.target;if(e.isIntersecting)v.play().catch(()=>{});else v.pause()}),{threshold:.3});
document.querySelectorAll(".clip video").forEach(v=>io.observe(v));
</script>
</body></html>`;
  writeFileSync(join(OUT, "board.html"), html);

  const md = [
    `# Reference board · Day ${data.day} · ${data.category}`,
    "",
    `${sections.length} sections: your inbox items ("mine") first, filled up to 3 options from live sites (1 same business + 2 any business) + 1 live clip. Open \`board.html\`, pick 1 per section.`,
    `Private inspiration only: never published, never copied.`,
    "",
    ...sections.flatMap((s, i) => [
      `## ${i + 1}. ${s.name}`,
      s.want ? `_${s.want}_` : "",
      "",
      ...s.options.map((o) => `- **${o.letter} · ${o.title}** (${o.inbox ? "mine" : o.same ? "same business" : "any business"}, \`${o.tag ?? "layout"}\`) · ${o.take ?? "—"}${o.url ? `  \n  ${o.url} via ${o.source}` : ""} · \`${o.shot}\``),
      s.clip ? `- Clip: \`${s.clip.file}\` (${s.clip.site})` : "- Clip: none",
      `- **Pick:** ${picks[s.id] ?? "—"}`,
      "",
    ]),
    ...(unsorted.length ? ["## Inbox, not sorted yet", "", ...unsorted.map((f) => `- inbox/${f}`), ""] : []),
  ].join("\n");
  writeFileSync(join(OUT, "REFS.md"), md);
  return { sections, unsorted };
}

if (opts.board || opts.pick !== null) {
  if (!existsSync(DATA_FILE)) usage();
  const data = readJson(DATA_FILE);
  data.pool = data.pool.filter((c) => !BANNED.test(c.site ?? ""));
  if (opts.pick !== null) {
    data.picks = data.picks ?? {};
    for (const part of opts.pick.split(",")) {
      const [k, v] = part.split("=").map((x) => x?.trim());
      if (k && /^[A-Z]$/i.test(v ?? "")) data.picks[k] = v.toUpperCase();
    }
  }
  for (const c of data.pool) if (c.tag && !TAGS.includes(c.tag)) console.log(`! ${c.id}: tag "${c.tag}" is not one of ${TAGS.join(" · ")}`);
  const { sections, unsorted } = writeBoard(data);
  console.log(`✓ Board rebuilt: ${sections.length} sections${unsorted.length ? ` · ${unsorted.length} inbox screenshot(s) still unsorted` : ""} → ${join(OUT, "board.html")}`);
  if (opts.pick !== null) console.log(`✓ Picks: ${Object.entries(data.picks).map(([k, v]) => `${k}=${v}`).join(", ")}`);
  process.exit(0);
}

// ======================================================================================================================
// 3. collect
// ======================================================================================================================
if (!existsSync(SECTIONS_FILE)) {
  console.log(`✗ No section list yet. First: npm run refs -- ${day} "${category || "<category>"}" --sections, then the user's OK.`);
  process.exit(1);
}
const SEC = readJson(SECTIONS_FILE);
// the library's latest matching rules win over the copy in sections.json
// (a section marked "custom": true in sections.json keeps its own words: a day can tailor them, e.g. hallmark|916|bis)
for (const sec of SEC.sections) if (CFG.sections[sec.id] && !sec.custom) Object.assign(sec, { words: CFG.sections[sec.id].words ?? sec.words, proof: CFG.sections[sec.id].proof });
if (!SEC.approved) {
  console.log(`✗ The section list is not approved yet. Show it to the user; on their OK: npm run refs -- ${day} --approve`);
  process.exit(1);
}
category = category || SEC.category;
const cat = category.toLowerCase();
const brandKey = matchKey(CFG.brands, cat);
const relevant = [...new Set([...words(cat), ...(brandKey ? brandKey.split("|") : [])].filter((w) => w.length > 2))];
const srcById = Object.fromEntries(CFG.sources.map((s) => [s.id, s]));
const notAllowed = CFG.sources.filter((s) => !s.automated).map((s) => `${s.name} (${s.terms})`);

// same-business galleries: the source's category page (only where the category maps, or a real search)
const samePlan = CFG.sources
  .filter((s) => s.automated && s.search && !s.fallback)
  .map((s) => {
    const hit = s.cats ? Object.entries(s.cats).find(([k]) => k.split("|").some((w) => words(cat).some((x) => x.startsWith(w) || w.startsWith(x)))) : null;
    if (s.cats && !hit) return null;
    if (!s.cats && !s.search.includes("{q}")) return null;
    return { src: s, url: s.search.replace("{q}", encodeURIComponent(category)).replace("{cat}", hit ? hit[1] : ""), take: 2 };
  })
  .filter(Boolean);
const otherPlan = CFG.otherPools.filter((p) => srcById[p.source]?.automated).map((p) => ({ src: srcById[p.source], url: p.search, take: p.take }));
const brands = [...opts.urls, ...((brandKey && CFG.brands[brandKey]) || [])];

console.log(`Reference board · Day ${day} · "${category}" · ${SEC.sections.length} sections → ${OUT}`);
console.log(`  sections: ${SEC.sections.map((s) => s.name).join(" · ")}`);
console.log(`  same business: ${samePlan.map((p) => p.src.name).join(", ") || "—"} + brand sites (${brands.map(host).slice(0, 4).join(", ") || "none"})`);
console.log(`  any business (creative): ${otherPlan.map((p) => p.src.name).join(", ")}`);
console.log(`  never opened (terms): ${notAllowed.map((s) => s.split(" (")[0]).join(", ")}`);
if (opts.dry) process.exit(0);
if (!existsSync(PROFILE)) console.log(`! No saved-login profile at ${PROFILE} yet (npm run refs:login). Continuing logged out.`);

// ---------- output folder: an earlier board moves aside (inbox, sections.json, inbox.json stay) ----------
let data;
if (opts.more && existsSync(DATA_FILE)) data = readJson(DATA_FILE);
else {
  if (existsSync(DATA_FILE)) {
    const aside = join(OUT, `_old-${Date.now().toString(36)}`);
    mkdirSync(aside, { recursive: true });
    for (const f of readdirSync(OUT)) if (!["inbox", "inbox.json", "sections.json"].includes(f) && !f.startsWith("_old-")) renameSync(join(OUT, f), join(aside, f));
    console.log(`  (previous board moved to ${basename(aside)}/)`);
  }
  data = { day, category, date: "", loads: 0, sections: SEC.sections, pool: [], sites: [], skipped: [], picks: {} };
}
data.sections = SEC.sections;
data.date = new Date().toISOString().slice(0, 10);
mkdirSync(join(OUT, "opts"), { recursive: true });
mkdirSync(join(OUT, "clips"), { recursive: true });
mkdirSync(INBOX, { recursive: true });
const VID = join(OUT, ".frames");
mkdirSync(VID, { recursive: true });

// ---------- robots.txt (User-agent: *; longest match wins) ----------
const robotsCache = new Map();
async function robotsAllows(u) {
  const { origin, pathname, search } = new URL(u);
  if (!robotsCache.has(origin)) {
    const rules = [];
    try {
      const res = await fetch(`${origin}/robots.txt`, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        let inStar = false;
        let seenRule = false;
        for (const raw of (await res.text()).split("\n")) {
          const m = raw.replace(/#.*/, "").trim().match(/^([a-z-]+)\s*:\s*(.*)$/i);
          if (!m) continue;
          const [k, v] = [m[1].toLowerCase(), m[2].trim()];
          if (k === "user-agent") {
            if (seenRule) inStar = false;
            seenRule = false;
            if (v === "*") inStar = true;
          } else if (k === "allow" || k === "disallow") {
            seenRule = true;
            if (inStar && v) rules.push({ allow: k === "allow", path: v });
          }
        }
      }
    } catch {}
    robotsCache.set(origin, rules);
  }
  const path = pathname + search;
  let best = null;
  for (const r of robotsCache.get(origin)) {
    const re = new RegExp("^" + r.path.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\\\$$/, "$"));
    if (re.test(path) && (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.allow))) best = r;
  }
  return !best || best.allow;
}

// ---------- browser ----------
const { chromium } = await import(join(KIT, "node_modules/playwright-core/index.mjs"));
let ctx;
try {
  ctx = await chromium.launchPersistentContext(PROFILE, {
    channel: "chrome",
    headless: opts.headless,
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    // the profile's logins are encrypted with the real macOS keychain; Playwright's mock keychain would hide them
    ignoreDefaultArgs: ["--use-mock-keychain", "--enable-automation", "--disable-extensions"],
    args: ["--no-first-run", "--disable-blink-features=AutomationControlled"],
  });
} catch (e) {
  console.log(`✗ Could not open the reference browser: ${e.message.split("\n")[0]}`);
  console.log("  Is the refs:login window still open? Close it (npm run refs:login -- --done) and run again.");
  process.exit(1);
}
let loads = 0;
const seenHosts = new Set(data.sites.map((s) => s.host));
const clipCount = new Map();
for (const c of data.pool) if (c.clip) clipCount.set(c.section, (clipCount.get(c.section) ?? 0) + 1);
let nextId = data.pool.reduce((m, c) => Math.max(m, Number(c.id.slice(1)) || 0), 0) + 1;

async function open(url, why) {
  if (loads >= MAX_LOADS) return null;
  const h = host(url);
  if (BANNED.test(h) || HAND_ONLY.some((x) => h === x || h.endsWith("." + x))) {
    console.log(`  · never opened: ${url} (browse by hand only)`);
    return null;
  }
  if (!(await robotsAllows(url))) {
    data.skipped.push(`${url} (robots.txt disallows)`);
    console.log(`  · skip ${url} (robots.txt)`);
    return null;
  }
  if (loads) await pause();
  loads++;
  const page = await ctx.newPage();
  console.log(`  [${String(loads).padStart(2)}/${MAX_LOADS}] ${why}: ${url}`);
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForLoadState("load", { timeout: 15000 }).catch(() => {});
    await sleep(1800);
    await page
      .waitForFunction(() => {
        const t = document.body?.innerText?.trim() ?? "";
        return t.length > 200 && !/^(loading|please wait)/i.test(t);
      }, null, { timeout: 8000, polling: 400 })
      .catch(() => {});
    await sleep(800);
    return page;
  } catch (e) {
    console.log(`     ✗ ${e.message.split("\n")[0]}`);
    await page.close().catch(() => {});
    return null;
  }
}

/** Chrome's own screencast (like scripts/reel.mjs): frames only while the clip runs → an mp4 at real timing. */
async function startClip(page, id) {
  const dir = join(VID, id);
  mkdirSync(dir, { recursive: true });
  const frames = [];
  const cdp = await page.context().newCDPSession(page);
  cdp.on("Page.screencastFrame", ({ data: d, metadata, sessionId }) => {
    const f = join(dir, `f${String(frames.length).padStart(4, "0")}.jpg`);
    writeFileSync(f, Buffer.from(d, "base64"));
    frames.push({ f, t: metadata.timestamp });
    cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 75, maxWidth: 1440, maxHeight: 900, everyNthFrame: 1 });
  return async () => {
    await cdp.send("Page.stopScreencast").catch(() => {});
    await cdp.detach().catch(() => {});
    if (frames.length < 10) return null;
    let list = "";
    frames.forEach((fr, i) => {
      const d = i + 1 < frames.length ? frames[i + 1].t - fr.t : 0.04;
      list += `file '${fr.f}'\nduration ${Math.max(0.001, d).toFixed(4)}\n`;
    });
    list += `file '${frames.at(-1).f}'\n`;
    writeFileSync(join(dir, "list.txt"), list);
    const rel = `clips/${id}.mp4`;
    const out = join(OUT, rel);
    const r = spawnSync(FF, ["-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", join(dir, "list.txt"), "-vf", "fps=25,scale=960:-2,format=yuv420p", "-c:v", "libx264", "-crf", "27", "-preset", "veryfast", "-an", out]);
    rmSync(dir, { recursive: true, force: true });
    if (r.status !== 0 || !existsSync(out)) return null;
    const secs = (frames.at(-1).t - frames[0].t) || 1;
    return { file: rel, score: Math.round(statSync(out).size / secs / 1000) }; // kB per second ≈ how much moves
  };
}

/** Cookie / consent banners: prefer "reject"/"necessary only", like a careful person; never log in or sign up. */
async function dismissBanners(page, hideOnly = false) {
  const choices = [
    /^(reject all|reject( all)? cookies|reject|decline( all)?|only necessary|necessary only|use necessary cookies only|deny|refuse( all)?|continue without accepting)$/i,
    /^(accept( all)?( cookies)?|allow( all)?( cookies)?|i accept|i agree|agree|ok|okay|got it|understood)$/i,
    /^(close|dismiss|close notice|close banner|close dialog|×|✕|x)$/i,
  ];
  if (!hideOnly) {
    await page.keyboard.press("Escape").catch(() => {});
    // age gates ("Are you over 18?"): answer yes, like a visitor of age would
    const gate = await page.evaluate(() => /(are you|i am|confirm you are)[^.?]{0,40}(18|19|21|legal|of age)|legal drinking age|years of age/i.test(document.body?.innerText?.slice(0, 4000) ?? "")).catch(() => false);
    if (gate)
      for (const btn of await page.getByRole("button", { name: /^(yes|yes,? i am|i am|i'm|enter|enter site|i am over 1[89]|i am over 21|over 21|confirm)\b/i }).all().catch(() => []))
        if (await btn.isVisible().catch(() => false)) {
          await btn.click({ timeout: 1500 }).catch(() => {});
          await sleep(800);
          break;
        }
  }
  for (let pass = 0; pass < (hideOnly ? 0 : 2); pass++) {
    let clicked = false;
    for (const re of choices) {
      for (const btn of await page.getByRole("button", { name: re }).all().catch(() => [])) {
        if (await btn.isVisible().catch(() => false)) {
          await btn.click({ timeout: 1500 }).catch(() => {});
          clicked = true;
          await sleep(500);
          break;
        }
      }
      if (clicked) break;
    }
    if (!clicked) break;
  }
  // notices that are not proper buttons, or whose button did not close them: hide them for the screenshot
  await page
    .evaluate((hide) => {
      for (const el of document.querySelectorAll("body *")) {
        const cs = getComputedStyle(el);
        if (!["fixed", "sticky"].includes(cs.position) || el.closest("header, nav")) continue;
        const r = el.getBoundingClientRect();
        if (r.height < 30 || r.height > innerHeight * 0.6 || !/cookie|consent|privacy|notice|gdpr|newsletter|subscribe|% off|discount/i.test(el.textContent || "")) continue;
        const ctl = [...el.querySelectorAll("button, a, [role=button]")].find((b) => /^(accept|agree|ok|got it|close|dismiss|no thanks|×|✕|x|continue without accepting)/i.test((b.textContent || b.getAttribute("aria-label") || "").trim()) || /close|dismiss/i.test(b.getAttribute("aria-label") || ""));
        if (ctl && !hide) ctl.click();
        else el.style.visibility = "hidden";
      }
      // pop-ups ("10% off", sign-up) and their dark backdrops: hide them for the screenshot
      for (const el of document.querySelectorAll("[role=dialog], [aria-modal=true], body *")) {
        const cs = getComputedStyle(el);
        if (cs.position !== "fixed" || el.closest("header, nav")) continue;
        const r = el.getBoundingClientRect();
        const big = r.width * r.height > innerWidth * innerHeight * 0.5;
        const promo = /% off|sign up|subscribe|newsletter|join (our|the)|discount|unlock|first order/i.test(el.textContent || "");
        const backdrop = big && !(el.textContent || "").trim() && /rgba?\(0, 0, 0, 0\.[2-9]|rgba?\(\d+, \d+, \d+, 0\.[3-9]/.test(cs.backgroundColor);
        if ((promo && r.height < innerHeight * 0.95 && (el.matches("[role=dialog], [aria-modal=true]") || r.width < innerWidth * 0.9)) || backdrop) el.style.visibility = "hidden";
      }
    }, hideOnly)
    .catch(() => {});
  await sleep(400);
  if (!hideOnly) await dismissBanners(page, true);
}

/** DOM probes → features (motion libraries, product-detail parts, type). */
async function probe(page) {
  const p = await page
    .evaluate(() => {
      const q = (s) => document.querySelectorAll(s).length;
      const cls = (re) => [...document.querySelectorAll("[class],[aria-label],[data-testid]")].some((e) => re.test(`${e.className?.baseVal ?? e.className} ${e.getAttribute("aria-label") ?? ""} ${e.dataset?.testid ?? ""}`));
      const cart = [...document.querySelectorAll("button, [role=button], input[type=submit]")].find((e) => /add to (bag|cart|basket)|buy now/i.test(e.textContent || e.value || ""));
      let stickyBuy = false;
      for (let e = cart; e; e = e.parentElement) if (["sticky", "fixed"].includes(getComputedStyle(e).position)) stickyBuy = true;
      const h1 = document.querySelector("h1");
      const hs = h1 ? getComputedStyle(h1) : null;
      return {
        gsap: !!window.gsap,
        lenis: !!window.lenis || document.documentElement.classList.contains("lenis"),
        webgl: [...document.querySelectorAll("canvas")].some((c) => c.width > 300),
        video: q("video"),
        transitions: !!(window.barba || window.swup || window.Taxi || document.querySelector("[data-barba],[data-taxi],[data-swup]")),
        cursor: cls(/(^|\s|-)cursor(?!-pointer)/i),
        marquee: cls(/marquee|ticker/i),
        swatches: cls(/swatch|colou?r-?(option|picker|select)/i),
        chips: q("[role=radiogroup], fieldset input[type=radio]") > 0 || cls(/variant|option-?(button|chip|pill)/i),
        cart: !!cart,
        stickyBuy,
        gallery: cls(/thumb|gallery|swiper|splide|carousel|slider/i),
        zoom: cls(/zoom|loupe|magnif/i),
        h1font: hs ? hs.fontFamily.split(",")[0].replace(/["']/g, "") : "",
        title: document.title,
      };
    })
    .catch(() => ({}));
  const f = [];
  if (p.swatches) f.push("colour swatches");
  if (p.chips) f.push("option chips");
  if (p.cart) f.push(p.stickyBuy ? "sticky buy box" : "add-to-cart");
  if (p.zoom) f.push("zoom / loupe");
  if (p.gallery) f.push("gallery / slider");
  if (p.gsap) f.push("GSAP");
  if (p.lenis) f.push("smooth scroll");
  if (p.webgl) f.push("WebGL canvas");
  if (p.video) f.push(`${p.video} video`);
  if (p.transitions) f.push("page transitions");
  if (p.cursor) f.push("custom cursor");
  if (p.marquee) f.push("marquee");
  if (p.h1font) f.push(`type: ${p.h1font}`);
  return { features: f, title: p.title ?? "" };
}

/** Where each wanted section sits on this page: { id: { top, hover: [{x, y}] } } (page coordinates). */
async function findSections(page, defs, isProductPage) {
  return page
    .evaluate(
      ({ defs, isProductPage }) => {
        const H = innerHeight;
        const docH = document.documentElement.scrollHeight;
        const abs = (r) => r.top + scrollY;
        const visible = (e) => {
          const r = e.getBoundingClientRect();
          const cs = getComputedStyle(e);
          return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && cs.opacity !== "0";
        };
        const block = (el) => {
          let e = el;
          while (e.parentElement && e.parentElement !== document.body) {
            const r = e.getBoundingClientRect();
            if (r.height >= 320 && r.width >= innerWidth * 0.6) break;
            e = e.parentElement;
          }
          return e;
        };
        const hoverIn = (el, top) =>
          [...el.querySelectorAll("a img, [class*=card i], [class*=product i] img, [class*=swatch i], button, a")]
            .filter(visible)
            .map((e) => {
              const r = e.getBoundingClientRect();
              return { x: Math.round(r.left + r.width / 2), y: Math.round(abs(r) + r.height / 2), w: r.width, h: r.height };
            })
            .filter((p) => p.w > 40 && p.h > 24 && p.y > top + 90 && p.y < top + H - 60)
            .slice(0, 4)
            .map(({ x, y }) => ({ x, y }));
        const price = /(₹|\$|€|£|¥)\s?\d|\d[\d.,]*\s?(€|kr|zł|rs\.?)/i;
        const out = {};
        for (const d of defs) {
          let el = null;
          let top = null;
          if (d.kind === "top") {
            if (isProductPage) continue;
            top = 0;
            el = document.body;
          } else if (d.kind === "pdp") {
            if (!isProductPage) continue;
            const cart = [...document.querySelectorAll("button,[role=button],input[type=submit]")].find((b) => visible(b) && /add to (bag|cart|basket)|buy now|add to order/i.test(b.textContent || b.value || ""));
            if (!cart) continue;
            top = 0;
            el = document.body;
          } else if (d.kind === "footer") {
            el = [...document.querySelectorAll("footer")].filter(visible).pop();
            if (el) top = Math.max(0, Math.min(abs(el.getBoundingClientRect()) - 60, docH - H));
          } else if (d.kind === "email") {
            const i = [...document.querySelectorAll("input[type=email]")].find((x) => visible(x) && !x.closest("footer"));
            if (i) el = block(i);
          } else if (d.kind === "grid") {
            const leaves = [...document.querySelectorAll("body *")].filter((e) => e.children.length === 0 && (e.textContent || "").length < 40 && price.test(e.textContent || "") && visible(e));
            let best = null;
            for (const l of leaves.slice(0, 300)) {
              for (let e = l.parentElement; e && e !== document.body; e = e.parentElement) {
                if (leaves.filter((x) => e.contains(x)).length >= 3 && e.querySelectorAll("img,picture,video").length >= 3) {
                  const r = e.getBoundingClientRect();
                  if (r.height >= 250 && abs(r) > H * 0.5 && (!best || r.height < best.getBoundingClientRect().height)) best = e;
                  break;
                }
              }
            }
            el = best;
          } else {
            const re = new RegExp(d.words, "i");
            const proof = d.proof ? new RegExp(d.proof, "i") : null;
            // a real section heading: below the first screen, short, not in the footer / nav / a form / a dialog
            const hs = [...document.querySelectorAll("h1,h2,h3,h4,[class*=title i],[class*=heading i]")].filter(
              (h) =>
                visible(h) &&
                (h.textContent || "").trim().length <= 70 &&
                re.test(h.textContent || "") &&
                abs(h.getBoundingClientRect()) > H * 0.9 &&
                !h.closest("footer, nav, header, form, [role=dialog], [aria-modal=true]"),
            );
            for (const h of hs) {
              const b = block(h);
              if (b.closest("footer") || b.querySelector("form input:not([type=hidden])")) continue;
              if (proof && !proof.test(b.textContent || "")) continue;
              el = b;
              break;
            }
          }
          if (el && top === null) top = Math.max(0, abs(el.getBoundingClientRect()) - 80);
          if (top === null) continue;
          top = Math.round(Math.min(top, Math.max(0, docH - H)));
          out[d.id] = { top, hover: hoverIn(el ?? document.body, top) };
        }
        return out;
      },
      { defs, isProductPage },
    )
    .catch(() => ({}));
}

const scrollTo = (page, y) =>
  page.evaluate((y) => {
    if (window.lenis?.scrollTo) window.lenis.scrollTo(y, { immediate: true, force: true });
    window.scrollTo({ top: y, behavior: "instant" });
  }, y);

/** Visit one site page: find the sections, screenshot each (+ a live clip while sections still need one). */
async function harvest(page, site) {
  await dismissBanners(page);
  const ok = await page
    .evaluate(() => {
      const imgs = [...document.querySelectorAll("img, video, canvas, picture, svg")].filter((e) => e.getBoundingClientRect().width > 120).length;
      const bg = [...document.querySelectorAll("body *")].some((e) => getComputedStyle(e).backgroundImage.startsWith("url"));
      return document.styleSheets.length > 0 && (imgs > 0 || bg);
    })
    .catch(() => true);
  if (!ok) {
    console.log(`     · skip ${host(page.url())}: page looks broken or empty`);
    data.skipped.push(`${page.url()} (looked broken or empty)`);
    return 0;
  }
  if (site.checkTopic) {
    const on = await page.evaluate((ws) => ws.some((w) => `${document.title} ${document.body?.innerText ?? ""}`.toLowerCase().includes(w)), relevant).catch(() => true);
    if (!on) {
      console.log(`     · skip ${host(page.url())}: nothing about "${category}" on the page`);
      data.skipped.push(`${page.url()} (off topic)`);
      return 0;
    }
  }
  if (!site.same && site.sameCheck) {
    // an "any business" find that turns out to be the same business counts as same
    site.same = await page.evaluate((ws) => ws.some((w) => `${document.title} ${document.querySelector("h1")?.textContent ?? ""}`.toLowerCase().includes(w)), relevant).catch(() => false);
  }
  const { features, title } = await probe(page);
  const found = await findSections(page, SEC.sections, site.productPage);
  const ids = Object.keys(found);
  if (!ids.length) {
    console.log("     · no wanted section found on this page");
    return 0;
  }
  // product link for a later product-page visit
  if (!site.productPage && !site.productUrl)
    site.productUrl = await page
      .evaluate(() => {
        const a = [...document.querySelectorAll("a[href]")].find((x) => /\/(products?|p|shop\/[^/]+\/[^/]+|item)\/[^/?#]+/i.test(new URL(x.href, location.href).pathname) && x.getBoundingClientRect().width > 40);
        return a ? a.href : null;
      })
      .catch(() => null);
  let n = 0;
  for (const id of ids) {
    const sec = SEC.sections.find((s) => s.id === id);
    const { top, hover } = found[id];
    const cid = `c${String(nextId++).padStart(2, "0")}`;
    const wantClip = opts.clip && (clipCount.get(id) ?? 0) < CLIPS_PER_SECTION;
    let clip = null;
    if (wantClip) {
      // arrive from a little above, real mouse rests on a card / button / swatch, then the next one
      await scrollTo(page, Math.max(0, top - 260));
      await sleep(700);
      const stop = await startClip(page, cid).catch(() => null);
      for (let i = 0; i < 10; i++) {
        await page.mouse.wheel(0, 26);
        await sleep(90);
      }
      const y0 = await page.evaluate(() => scrollY).catch(() => top);
      for (const [k, p] of hover.slice(0, 2).entries()) {
        await page.mouse.move(p.x, Math.max(60, Math.min(860, p.y - y0)), { steps: 24 });
        await sleep(k ? 900 : 1300);
      }
      if (!hover.length) {
        for (let i = 0; i < 12; i++) {
          await page.mouse.wheel(0, 22);
          await sleep(160);
        }
      }
      await sleep(300);
      clip = stop ? await stop() : null;
      if (clip) clipCount.set(id, (clipCount.get(id) ?? 0) + 1);
    }
    await page.mouse.move(1420, 450);
    await scrollTo(page, top);
    await sleep(1300);
    await dismissBanners(page, true);
    const shotRel = `opts/${cid}-${id}.jpg`;
    let shot = await page.screenshot({ path: join(OUT, shotRel), type: "jpeg", quality: 80 });
    for (let i = 0; i < 2 && shot.length < 30000; i++) {
      await sleep(2500);
      shot = await page.screenshot({ path: join(OUT, shotRel), type: "jpeg", quality: 80 });
    }
    const c = {
      id: cid,
      section: id,
      site: site.host,
      url: page.url(),
      via: site.via,
      source: site.source,
      sourceId: site.sourceId,
      same: !!site.same,
      title: (site.title || title || site.host).replace(/\s+/g, " ").trim().split(/\s[|–—-]\s/)[0].slice(0, 60),
      features,
      hover: hover.length,
      shot: shotRel,
      clip: clip?.file ?? null,
      clipScore: clip?.score ?? 0,
    };
    Object.assign(c, autoTake(c, sec));
    data.pool.push(c);
    n++;
  }
  console.log(`     ✓ ${ids.length} section(s): ${ids.join(", ")}`);
  return n;
}

async function visit(url, site, why) {
  if (seenHosts.has(host(url)) && !site.productPage) return 0;
  const page = await open(url, why);
  if (!page) return 0;
  site.host = host(page.url()) || host(url);
  seenHosts.add(host(url));
  seenHosts.add(site.host);
  let n = 0;
  try {
    n = await harvest(page, site);
  } catch (e) {
    console.log(`     ✗ ${e.message.split("\n")[0]}`);
  }
  await page.close().catch(() => {});
  if (n && !site.productPage) data.sites.push({ host: site.host, url, same: site.same, source: site.source, productUrl: site.productUrl ?? null });
  return n ? site : null;
}

/** Entry links on a gallery page (scrolls a little first, like a person looking through the grid). */
async function galleryEntries(src, url, { onlyRelevant }) {
  const page = await open(url, `${src.name}`);
  if (!page) return [];
  await dismissBanners(page);
  for (let i = 0; i < 6; i++) {
    await page.mouse.wheel(0, 420);
    await sleep(350);
  }
  const re = new RegExp(src.item);
  const links = await page
    .$$eval("a[href]", (as) => as.map((a) => ({ href: a.href, text: `${a.textContent} ${a.title} ${a.querySelector("img")?.alt ?? ""} ${a.closest("li, article, figure, [class*=card], [class*=item]")?.textContent ?? ""}`.toLowerCase() })))
    .catch(() => []);
  await page.close().catch(() => {});
  const seen = new Map();
  for (const l of links) if (re.test(l.href) && (src.visit === "direct" || !l.href.includes("?"))) seen.set(l.href, (seen.get(l.href) ?? "") + " " + l.text);
  let list = [...seen.entries()];
  if (onlyRelevant) list = list.filter(([h, t]) => relevant.some((w) => h.toLowerCase().includes(w) || t.includes(w)));
  data.entries = data.entries ?? [];
  return list.map(([h]) => h).filter((h) => (src.visit === "direct" ? !seenHosts.has(host(h)) : !data.entries.includes(h)));
}

async function liveFromEntry(src, entry) {
  const page = await open(entry, `${src.name} entry`);
  if (!page) return null;
  let href = src.visitSelector ? await page.$eval(src.visitSelector, (a) => a.href).catch(() => null) : null;
  if (!href)
    href = await page
      .evaluate(
        ({ own, deny }) => {
          const as = [...document.querySelectorAll("a[href^='http']")].filter((a) => {
            const h = new URL(a.href).hostname.replace(/^www\./, "");
            return !own.some((o) => h === o || h.endsWith("." + o)) && !deny.some((d) => h === d || h.endsWith("." + d));
          });
          return (as.find((a) => /visit|launch|live|website|view site/i.test(`${a.textContent} ${a.title}`)) || as[0])?.href ?? null;
        },
        { own: src.own ?? [host(src.url)], deny: CFG.denyHosts },
      )
      .catch(() => null);
  const title = (await page.title().catch(() => "")).split(/\s[|–—-]\s/)[0].trim();
  await page.close().catch(() => {});
  return href ? { href, title } : null;
}

async function fromGallery(plan, { same, budget }) {
  const start = loads;
  const src = plan.src;
  const list = await galleryEntries(src, plan.url, { onlyRelevant: same && !!src.strict });
  let got = 0;
  for (const entry of list) {
    if (got >= plan.take || loads - start >= budget || loads >= MAX_LOADS - 2) break;
    let live = entry;
    let title = "";
    if (src.visit === "entry") {
      data.entries.push(entry);
      const r = await liveFromEntry(src, entry);
      if (!r) continue;
      live = r.href;
      title = r.title;
    }
    if (seenHosts.has(host(live))) continue;
    const site = { same, sameCheck: !same, checkTopic: same, source: src.name, sourceId: src.id, via: entry, title };
    if (await visit(live, site, same ? "same business" : "any business")) got++;
  }
  return got;
}

// ---------- the run: same business (galleries, then brand sites) · any business (award galleries) · product pages ----------
const before = data.pool.length;
let sameSites = data.sites.filter((s) => s.same).length;
const wantSameSites = opts.more ? sameSites + Math.max(2, opts.urls.length) : 3; // --more: more same-business sites (reviews, results live there)
// sites added by hand go first
for (const url of opts.urls) {
  if (loads >= 14) break;
  if (seenHosts.has(host(url))) continue;
  if (await visit(url, { same: true, source: "added by hand", sourceId: "brand", via: url }, "same business (added)")) sameSites++;
}
for (const plan of samePlan) {
  if (sameSites >= wantSameSites || loads >= 10) break;
  sameSites += await fromGallery(plan, { same: true, budget: 5 });
}
for (const url of brands) {
  if (sameSites >= wantSameSites || loads >= (opts.more ? 16 : 13)) break;
  if (seenHosts.has(host(url))) continue;
  if (await visit(url, { same: true, source: opts.urls.includes(url) ? "added by hand" : "brand sites", sourceId: "brand", via: url }, "same business (brand)")) sameSites++;
}
for (const plan of otherPlan) {
  if (loads >= MAX_LOADS - 5) break;
  await fromGallery(plan, { same: false, budget: 6 });
}
// product pages: two same-business, two any-business (the "product" section needs real product pages)
if (SEC.sections.some((s) => s.kind === "pdp")) {
  const pdps = [...data.sites.filter((s) => s.same && s.productUrl && (!opts.urls.length || opts.urls.some((u) => host(u) === s.host))).slice(0, opts.urls.length || 2), ...data.sites.filter((s) => !s.same && s.productUrl).slice(0, 2)];
  for (const s of pdps) {
    if (loads >= MAX_LOADS) break;
    if (data.pool.some((c) => c.section === "product" && c.site === s.host)) continue;
    await visit(s.productUrl, { same: s.same, productPage: true, source: s.source, sourceId: data.pool.find((c) => c.site === s.host)?.sourceId, via: s.url }, "product page");
  }
}
await ctx.close().catch(() => {});
rmSync(VID, { recursive: true, force: true });

// ---------- board ----------
data.loads = (opts.more ? data.loads : 0) + loads;
const { sections, unsorted } = writeBoard(data);
console.log(`\n✓ ${data.pool.length - before} new option shots from ${data.sites.length} sites · ${loads} page loads → ${join(OUT, "board.html")}`);
for (const s of sections) {
  const same = s.options.filter((o) => o.same).length;
  console.log(`  ${s.name.padEnd(26)} ${s.options.map((o) => `${o.letter}:${o.inbox ? "inbox" : o.site}`).join("  ").padEnd(70)} ${s.options.length < 3 ? `⚠ ${s.options.length}/3` : ""}${same ? "" : " ⚠ no same-business"}${s.clip ? "" : " · no clip"}`);
}
if (unsorted.length) console.log(`! ${unsorted.length} inbox screenshot(s) unsorted: look at them, write inbox.json {"file": "section-id"}, then --board`);
console.log(`Next: look at every option + clip, write each "take" line + tag in refs.json (pool), then npm run refs -- ${day} --board.`);
console.log("      Thin sections: npm run refs -- " + day + ' "' + category + '" --more (another ≤ 30 loads), or inbox screenshots. Then STOP: the user picks 1 per section.');
