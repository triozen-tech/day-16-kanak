// npm run cover -- --day 11 --niche "GYM" --accent "#2F55E4" [--object raw/cover-object.png] [--object-cx 760] [--object-bottom 700] [--shot raw/cover-shot.jpg] [--dir <day folder>] [--out <file.jpg>]
// Builds the 9:16 reel cover (1080×1920 JPG, q92) as an HTML page and screenshots it with Playwright (installed Chrome),
// so Anton + Urbanist render exactly. Same layout every day:
//   DAY pill · browser card with the 1440×900 hero shot · cut-out object breaking out above the card · niche / SCROLL WEBSITE ·
//   a blank #111 view-count badge bottom-left (Instagram draws the Reels-tab count there) and the studio name bottom-right.
//   Both sit below the 3:4 main-grid crop (y 240–1680), which shows no counts.
// Relative paths resolve against --dir (default: current folder); output defaults to <dir>/recordings/day-XX-cover.jpg.
// --object defaults to <dir>/raw/cover-object.png when that file exists; with no object the cover is made with the card only (NEEDS OBJECT). Runs cover-check on the result.
// Fonts live in scripts/cover-fonts/ (OFL, no CDN).
//
// Object rules:
//   - An OBJECT (product, gear, prop), never a person.
//   - It must NOT cover the site's headline in the screenshot (or the nav's main button much). Default spot: right third of the
//     card (centre x ≈ 760), bottom resting on the card at y ≈ 700 (overlaps the hero a little), top breaking out above the
//     card's top edge (y 560) but never above y 330. Nudge with --object-cx / --object-bottom; check the result.
//   - Clean edges: the mask is eroded 2 px and feathered 1 px here, so a cut-out's white halo never shows.
//   - Shadows: a soft drop shadow (blur 40, y +18, #000 35%) falls only on the card, plus a small contact shadow at its base.
// Full spec (locked): docs/COVER.md
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";
import { chromium } from "playwright-core";

const here = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const arg = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const day = Number(arg("day"));
const niche = arg("niche")?.toUpperCase();
const accentIn = arg("accent");
if (!day || !niche || !/^#[0-9a-f]{6}$/i.test(accentIn ?? "")) {
  console.log('usage: npm run cover -- --day 11 --niche "GYM" --accent "#2F55E4" [--object raw/cover-object.png] [--object-cx 760] [--object-bottom 700] [--shot raw/cover-shot.jpg] [--dir <day folder>] [--out <file.jpg>]');
  process.exit(1);
}
const dir = resolve(arg("dir") ?? ".");
const at = (p) => (isAbsolute(p) ? p : join(dir, p));
const dd = String(day).padStart(2, "0");
const shot = at(arg("shot") ?? "raw/cover-shot.jpg");
const object = arg("object") ? at(arg("object")) : existsSync(at("raw/cover-object.png")) ? at("raw/cover-object.png") : null;
const out = arg("out") ? at(arg("out")) : join(dir, "recordings", `day-${dd}-cover.jpg`);
for (const f of [shot, object].filter(Boolean)) if (!existsSync(f)) (console.log(`missing: ${f}`), process.exit(1));

// ---- Layout (px on the 1080×1920 canvas) ----
const W = 1080, H = 1920, BG = "#F4F1EC";
const CARD = { x: 90, y: 560, w: 900, bar: 48, img: 562 }; // card bottom = 560 + 48 + 562 = 1170
const OBJ = { cx: Number(arg("object-cx") ?? 760), bottom: Number(arg("object-bottom") ?? 700), minTop: 330, maxW: 440 }; // right third, rests on the card
const BADGE = { x0: 36, x1: 560, y0: 1738, y1: 1852, r: 18 }; // empty: Instagram puts the Reels-tab view count on it
const STUDIO = { right: 1044 }; // right-aligned, centred on the badge
const TEXT = { top: CARD.y + CARD.bar + CARD.img, bottom: 1640, limit: 1613, maxW: 900 }; // centred between card bottom and 1640; ink stays above 1613

// ---- Accent: darken until it has ≥ 3:1 contrast on the background ----
const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = ([r, g, b]) => {
  const c = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
};
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};
let rgb = hex2rgb(accentIn);
const bgRgb = hex2rgb(BG);
const contrastIn = contrast(rgb, bgRgb);
while (contrast(rgb, bgRgb) < 3) rgb = rgb.map((v) => Math.max(0, Math.round(v * 0.96)));
const accent = "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();

// ---- Assets: shot resized to the card, object trimmed to its visible pixels ----
const tmp = mkdtempSync(join(tmpdir(), "cover-"));
const shotFile = join(tmp, "shot.png");
await sharp(shot).resize(CARD.w * 2, CARD.img * 2, { fit: "cover", kernel: "lanczos3" }).png().toFile(shotFile);
let obj = null;
if (object) {
  const { data, info } = await sharp(object).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let [x0, y0, x1, y1] = [info.width, info.height, -1, -1];
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (data[(y * info.width + x) * 4 + 3] > 16) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  if (x1 < 0) (console.log(`object has no visible pixels: ${object}`), process.exit(1));
  const ow = x1 - x0 + 1, oh = y1 - y0 + 1;
  const s = Math.min(OBJ.maxW / ow, (OBJ.bottom - OBJ.minTop) / oh);
  const [w, h] = [Math.round(ow * s), Math.round(oh * s)];
  obj = { file: join(tmp, "object.png"), w, h, left: Math.round(OBJ.cx - w / 2), top: OBJ.bottom - h };
  // Erode the alpha 2 px (square min filter, at output scale) then feather 1 px: removes the cut-out's light halo
  const big = await sharp(object).extract({ left: x0, top: y0, width: ow, height: oh }).resize(w * 2, h * 2, { kernel: "lanczos3" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: bw, height: bh } = big.info, px = big.data, r = 4; // 2 px at the cover's scale = 4 px at 2×
  let a = new Uint8Array(bw * bh);
  for (let i = 0; i < bw * bh; i++) a[i] = px[i * 4 + 3];
  for (const horiz of [true, false]) {
    const b = new Uint8Array(bw * bh);
    for (let y = 0; y < bh; y++)
      for (let x = 0; x < bw; x++) {
        let m = 255;
        for (let k = -r; k <= r && m; k++) {
          const xx = horiz ? x + k : x, yy = horiz ? y : y + k;
          m = xx < 0 || yy < 0 || xx >= bw || yy >= bh ? 0 : Math.min(m, a[yy * bw + xx]);
        }
        b[y * bw + x] = m;
      }
    a = b;
  }
  const alpha = await sharp(Buffer.from(a), { raw: { width: bw, height: bh, channels: 1 } }).blur(1.2).extractChannel(0).raw().toBuffer(); // keep it 1-channel (sharp widens grey to RGB)
  for (let i = 0; i < bw * bh; i++) px[i * 4 + 3] = alpha[i];
  await sharp(px, { raw: { width: bw, height: bh, channels: 4 } }).png().toFile(obj.file);
  if (oh < h * 2) console.log(`note: object is ${oh}px tall, shown at ${h}px (needs ${h * 2}px for a sharp 2× render)`);
}

const font = (f) => pathToFileURL(join(here, "cover-fonts", f)).href;
const grain = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>`;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Anton; src: url(${font("anton-latin-400-normal.woff2")}) format("woff2"); }
@font-face { font-family: Urbanist; font-weight: 700; src: url(${font("urbanist-latin-700-normal.woff2")}) format("woff2"); }
@font-face { font-family: Urbanist; font-weight: 800; src: url(${font("urbanist-latin-800-normal.woff2")}) format("woff2"); }
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: ${BG}; }
body { position: relative; -webkit-font-smoothing: antialiased; }
.grain { position: absolute; inset: 0; background: url("data:image/svg+xml;utf8,${grain}"); opacity: 0.025; z-index: 5; pointer-events: none; }
.pill { position: absolute; left: 90px; top: 290px; background: #111; color: #fff; font: 800 40px/1 Urbanist; padding: 14px 28px; border-radius: 999px; letter-spacing: 0.02em; }
.card { position: absolute; left: ${CARD.x}px; top: ${CARD.y}px; width: ${CARD.w}px; border-radius: 28px; overflow: hidden; border: 1px solid #DDD7CE; box-shadow: 0 30px 60px rgba(0,0,0,0.18); background: #E9E5DE; }
.bar { height: ${CARD.bar}px; display: flex; align-items: center; gap: 9px; padding-left: 24px; background: #E9E5DE; }
.bar i { width: 13px; height: 13px; border-radius: 50%; background: #C9C3BA; }
.card .shot { display: block; width: ${CARD.w}px; height: ${CARD.img}px; object-fit: cover; }
.obj { position: absolute; z-index: 3; }
.obj img { display: block; width: 100%; height: 100%; }
.cast { position: absolute; z-index: 1; filter: brightness(0) blur(40px); opacity: 0.35; } /* object's shadow, clipped to the card */
.contact { position: absolute; z-index: 2; border-radius: 50%; background: radial-gradient(closest-side, rgba(0,0,0,0.55), rgba(0,0,0,0.25) 55%, rgba(0,0,0,0)); filter: blur(6px); }
.text { position: absolute; left: 0; right: 0; top: ${TEXT.top}px; height: ${TEXT.bottom - TEXT.top}px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.l1 { font: 150px/1 Anton; color: ${accent}; white-space: nowrap; }
.l2 { font: 96px/1 Anton; color: #111; margin-top: 20px; white-space: nowrap; }
.badge { position: absolute; left: ${BADGE.x0}px; top: ${BADGE.y0}px; width: ${BADGE.x1 - BADGE.x0}px; height: ${BADGE.y1 - BADGE.y0}px; border-radius: ${BADGE.r}px; background: #111; }
.studio { position: absolute; right: ${W - STUDIO.right}px; top: ${BADGE.y0}px; height: ${BADGE.y1 - BADGE.y0}px; display: flex; align-items: center; font: 700 30px/1 Urbanist; letter-spacing: 0.12em; margin-right: -0.12em; color: rgba(17,17,17,0.55); }
</style></head><body>
<div class="pill">DAY ${day}</div>
<div class="card"><div class="bar"><i></i><i></i><i></i></div><img class="shot" src="${pathToFileURL(shotFile).href}">${obj ? `<img class="cast" src="${pathToFileURL(obj.file).href}" style="left:${obj.left - CARD.x - 1}px;top:${obj.top + 18 - CARD.y - 1}px;width:${obj.w}px;height:${obj.h}px">` : ""}</div>
${obj ? `<div class="contact" style="left:${OBJ.cx - obj.w * 0.35}px;top:${obj.top + obj.h - 16}px;width:${obj.w * 0.7}px;height:30px"></div>
<div class="obj" style="left:${obj.left}px;top:${obj.top}px;width:${obj.w}px;height:${obj.h}px"><img src="${pathToFileURL(obj.file).href}"></div>` : ""}
<div class="text"><div class="l1">${niche.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</div><div class="l2">SCROLL WEBSITE</div></div>
<div class="badge"></div><div class="studio">TRIOZEN TECH</div>
<div class="grain"></div>
</body></html>`;
const page$ = join(tmp, "cover.html");
writeFileSync(page$, html);

const browser = await chromium.launch({ channel: "chrome", args: ["--allow-file-access-from-files"] });
try {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(page$).href);
  const report = await page.evaluate(async (max) => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((i) => i.decode()));
    const l1 = document.querySelector(".l1");
    const w = l1.getBoundingClientRect().width;
    if (w > max) l1.style.fontSize = `${(150 * max) / w}px`; // shrink a long niche word to fit 900 px
    const fonts = ["150px Anton", "800 40px Urbanist", "700 30px Urbanist"].map((f) => document.fonts.check(f));
    const r = (s) => document.querySelector(s).getBoundingClientRect();
    const studio = r(".studio");
    return { fonts, l1Size: parseFloat(getComputedStyle(l1).fontSize), l1Width: Math.round(r(".l1").width), textTop: Math.round(r(".l1").top), textBottom: Math.round(r(".l2").bottom), studioLeft: Math.round(studio.left), studioRight: Math.round(studio.right - 30 * 0.12), studioMid: Math.round((studio.top + studio.bottom) / 2) };
  }, TEXT.maxW);
  if (report.fonts.includes(false)) throw new Error(`a cover font did not load: ${JSON.stringify(report.fonts)}`);
  mkdirSync(dirname(out), { recursive: true });
  await page.screenshot({ path: out, type: "jpeg", quality: 92 });
  console.log(`✓ ${out}`);
  console.log(`  niche ${niche} at ${report.l1Size.toFixed(0)}px (${report.l1Width}px wide) · text y ${report.textTop}–${report.textBottom} (centred in ${TEXT.top}–${TEXT.bottom}, must end above ${TEXT.limit}) · studio x ${report.studioLeft}–${report.studioRight}, mid y ${report.studioMid}`);
  if (report.textBottom > TEXT.limit) console.log(`  ⚠ text ends at y ${report.textBottom}, below ${TEXT.limit}`);
  console.log(`  accent ${accentIn}${accent !== accentIn.toUpperCase() ? ` → darkened to ${accent}` : ""} · contrast ${contrastIn.toFixed(2)}:1 → ${contrast(rgb, bgRgb).toFixed(2)}:1`);
  console.log(obj ? `  object ${obj.w}×${obj.h} at x ${obj.left}–${obj.left + obj.w}, y ${obj.top}–${obj.top + obj.h}` : "  no object (card only)");
} finally {
  await browser.close();
  rmSync(tmp, { recursive: true, force: true });
}

const check = spawnSync("python3", [join(here, "cover-check.py"), out], { stdio: "inherit" });
process.exit(check.status ?? 0);
