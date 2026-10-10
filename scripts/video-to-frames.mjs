#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
//  Turn any video into web frames for a scroll animation.
//
//  npm run frames -- <video> <folder> [options]
//
//  Examples:
//    npm run frames -- raw/hero.mp4 frames/hero
//    npm run frames -- raw/spin.mp4 frames/product --max 120 --width 1600
//    npm run frames -- raw/long.mp4 frames/hero --start 2 --end 9
//
//  Options:
//    --max <n>      max number of frames (default 180). More = smoother, heavier.
//    --width <px>   frame width (default 1920 — sharp on a laptop screen)
//    --quality <n>  0–100 (default 78)
//    --start <s>    start time in seconds
//    --end <s>      end time in seconds
//    --format       webp (default, small) or jpg
//    --reverse      play the video backwards
//    --zoom <x>     crop edges, e.g. 1.08 = zoom in 8% (hides AI watermarks in corners)
//
//  Output: public/<folder>/frame_0001.webp … + manifest.json
//  Then use it in site/ (e.g. content.ts) as:  frames: "/<folder>"
// ─────────────────────────────────────────────────────────────
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import ffmpegPath from "ffmpeg-static";

const args = process.argv.slice(2);
const flags = {};
const positional = [];
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith("--")) {
    const key = args[i].slice(2);
    const next = args[i + 1];
    if (next === undefined || next.startsWith("--")) flags[key] = true;
    else flags[key] = args[++i];
  } else positional.push(args[i]);
}

const [input, folderArg] = positional;
if (!input || !folderArg) {
  console.log("\nUsage: npm run frames -- <video> <folder> [--max 180] [--width 1920] [--start 0] [--end 8]\n");
  console.log("Example: npm run frames -- raw/hero.mp4 frames/hero\n");
  process.exit(1);
}
if (!existsSync(input)) {
  console.error(`\n✗ Video not found: ${input}\n`);
  process.exit(1);
}

const folder = folderArg.replace(/^\/+/, "").replace(/^public\//, "").replace(/\/+$/, "");
const outDir = resolve("public", folder);
const max = Number(flags.max ?? 180);
const width = Number(flags.width ?? 1920);
const quality = Number(flags.quality ?? 78);
const format = flags.format === "jpg" ? "jpg" : "webp";
const start = flags.start !== undefined ? Number(flags.start) : undefined;
const end = flags.end !== undefined ? Number(flags.end) : undefined;

// 1. Read video duration + fps
const probe = spawnSync(ffmpegPath, ["-hide_banner", "-i", input], { encoding: "utf8" });
const info = probe.stderr || "";
const durMatch = info.match(/Duration: (\d+):(\d+):([\d.]+)/);
const fpsMatch = info.match(/([\d.]+) fps/);
const fullDuration = durMatch ? Number(durMatch[1]) * 3600 + Number(durMatch[2]) * 60 + Number(durMatch[3]) : 8;
const sourceFps = fpsMatch ? Number(fpsMatch[1]) : 24;
const srcSize = info.match(/Video:.*?, (\d{2,5})x(\d{2,5})/);
const outWidth = srcSize ? Math.min(width, Number(srcSize[1])) : width; // never upscale
const duration = Math.max(0.1, (end ?? fullDuration) - (start ?? 0));

// 2. Pick an fps that gives at most `max` frames
const fps = Math.min(sourceFps, max / duration);

// 3. Clean the output folder
mkdirSync(outDir, { recursive: true });
for (const f of readdirSync(outDir)) {
  if (/^frame_\d+\.(webp|jpg)$/.test(f) || f === "manifest.json") rmSync(join(outDir, f));
}

// 4. Extract
const zoom = flags.zoom ? Number(flags.zoom) : 1;
const filters = [`fps=${fps.toFixed(4)}`];
if (zoom > 1) filters.push(`crop=trunc(iw/${zoom}/2)*2:trunc(ih/${zoom}/2)*2`);
filters.push(`scale=${outWidth}:-2:flags=lanczos`);
if (flags.reverse) filters.push("reverse");
const ffArgs = ["-hide_banner", "-loglevel", "error", "-y"];
if (start !== undefined) ffArgs.push("-ss", String(start));
if (end !== undefined) ffArgs.push("-to", String(end));
ffArgs.push("-i", input, "-an", "-vf", filters.join(","));
if (format === "webp") ffArgs.push("-c:v", "libwebp", "-quality", String(quality), "-compression_level", "5");
else ffArgs.push("-q:v", String(Math.round(2 + ((100 - quality) / 100) * 10)));
ffArgs.push(join(outDir, `frame_%04d.${format}`));

console.log(`\n▶ Extracting ~${Math.round(fps * duration)} frames (${fps.toFixed(1)} fps, ${outWidth}px wide) …`);
const run = spawnSync(ffmpegPath, ffArgs, { stdio: "inherit" });
if (run.status !== 0) {
  console.error("\n✗ ffmpeg failed. Is the file a real video?\n");
  process.exit(1);
}

// 5. Manifest
const files = readdirSync(outDir).filter((f) => f.startsWith("frame_")).sort();
const firstInfo = spawnSync(ffmpegPath, ["-hide_banner", "-i", join(outDir, files[0])], { encoding: "utf8" }).stderr;
const size = firstInfo.match(/, (\d{2,5})x(\d{2,5})/);
const manifest = {
  count: files.length,
  ext: format,
  width: size ? Number(size[1]) : outWidth,
  height: size ? Number(size[2]) : Math.round((outWidth * 9) / 16),
  pad: 4,
  prefix: "frame_",
};
writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));

const totalMB = files.reduce((s, f) => s + statSync(join(outDir, f)).size, 0) / 1024 / 1024;
console.log(`✓ ${files.length} frames → public/${folder}  (${totalMB.toFixed(1)} MB)`);
console.log(`\n  Use in site/:   frames: "/${folder}"\n`);
