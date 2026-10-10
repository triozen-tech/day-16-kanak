// Reel check in headless Chrome (desktop only: 1440×900) (needs Google Chrome and ffmpeg; run against the production server:
// `npm run build && npm start`).
//
//   npm run reel [-- <name>]      record ?record=1 at 1440×900 → recordings/<name>.mp4 (default: reel-<date>),
//                                 trimmed from the page's first paint to the end of the auto-scroll, then
//                                 freezedetect (n=0.002, d=0.4 s) + frame-diff (no stretch ≥ 0.3 s without change).
//                                 Prints PASS / FAIL and exits 1 on FAIL. The site page (PAGE=/) also needs ≥ 3 hover
//                                 moments from the record cursor (components/engine/RecordCursor.tsx, data-hover-demo).
//   (other pages: PAGE=/lab npm run reel -- lab · longer runs: SECS=180)
//   The video is always exactly 1440×900 (the run FAILS on any other size).
//
// Options: URL=http://localhost:<port> (base; default: the port in package.json "start", set by `npm run new-day`), CHROME=/path/to/chrome.
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PORT = (JSON.parse(readFileSync("package.json", "utf8")).scripts?.start ?? "").match(/-p (\d+)/)?.[1] ?? "3005";
const BASE = process.env.URL || `http://localhost:${PORT}`;
const PAGE = (process.env.PAGE || "/").replace(/^\/?/, "/"); // e.g. PAGE=/lab
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = join(process.cwd(), "recordings");
const REEL = { w: 1440, h: 900, secs: Number(process.env.SECS || 60) }; // secs = safety cap; recording stops when the auto-scroll is done
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- tiny CDP driver ----------
// Headless Chrome keeps ~90 px of its window for browser chrome even in --headless=new, so a 1440×900 window only
// shows a 1440×~812 page and the screencast came out cut at the bottom. The window gets spare height; the page itself
// is emulated at exactly w×h (setDeviceMetricsOverride), which is what the screencast captures.
const WINDOW_SPARE = 200;
async function browser(w, h, { dpr = 1, mobile = false } = {}) {
  const port = 9300 + Math.floor(Math.random() * 500);
  const dir = join(tmpdir(), `reel-chrome-${port}`);
  const proc = spawn(CHROME, [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${dir}`,
    `--window-size=${w},${h + WINDOW_SPARE}`,
    "--hide-scrollbars",
    "--mute-audio",
    "--no-first-run",
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
    "--disable-backgrounding-occluded-windows",
    "--enable-gpu-rasterization",
    "--ignore-gpu-blocklist",
    "about:blank",
  ]);
  const close = () => {
    try {
      proc.kill("SIGKILL");
    } catch {}
    try {
      // Chrome may still be writing its profile for a moment after the kill: retry, and never fail the run over it
      rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 150 });
    } catch {}
  };
  process.on("exit", close); // never leave a headless Chrome running
  let page;
  for (let i = 0; i < 75 && !page; i++) {
    try {
      page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page");
    } catch {}
    if (!page) await sleep(200);
  }
  if (!page) throw new Error("Chrome did not start (set CHROME=/path/to/chrome)");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const pending = new Map();
  const handlers = [];
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m);
      pending.delete(m.id);
    } else if (m.method) handlers.forEach((fn) => fn(m));
  };
  // every call times out (a page that stops producing frames must never hang the run)
  const send = (method, params = {}, ms = 20000) =>
    new Promise((res, rej) => {
      const i = ++id;
      const timer = setTimeout(() => {
        pending.delete(i);
        rej(new Error(`${method}: no answer in ${ms / 1000} s`));
      }, ms);
      pending.set(i, (m) => {
        clearTimeout(timer);
        m.error ? rej(new Error(`${method}: ${m.error.message}`)) : res(m.result);
      });
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: dpr, mobile });
  if (mobile) await send("Emulation.setTouchEmulationEnabled", { enabled: true });
  const evaluate = async (expr) => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result.value;
  return { send, on: (fn) => handlers.push(fn), evaluate, close: () => (ws.close(), close()) };
}

const ff = (args) => spawnSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: ["ignore", "pipe", "pipe"], maxBuffer: 1 << 30 });

/** Mean luma per frame + whether the frame is the blank (uniform grey) tab before the page paints. */
function grayFrames(file, W = 160, H = 90) {
  const raw = ff(["-i", file, "-vf", `fps=30,scale=${W}:${H},format=gray`, "-f", "rawvideo", "-"]).stdout;
  const n = Math.floor(raw.length / (W * H));
  const frames = [];
  for (let i = 0; i < n; i++) frames.push(raw.subarray(i * W * H, (i + 1) * W * H));
  return frames;
}

// ---------- npm run reel ----------
async function reel(name) {
  mkdirSync(OUT, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  const out = join(OUT, `${name || `reel-${stamp}`}.mp4`);
  const work = join(tmpdir(), `reel-${process.pid}`);
  rmSync(work, { recursive: true, force: true });
  mkdirSync(work, { recursive: true });

  const b = await browser(REEL.w, REEL.h);
  const frames = [];
  let doneAt = 0;
  const errors = [];
  const marks = []; // { t: wall-clock s, label } from record mode's "[record] 12.40 s  → Label" logs
  const hovers = []; // "[record] hover N: label" from the record cursor
  let planned = 0; // record mode's planned total (s), to catch a run that broke off early
  let lastFrameWall = Date.now();
  let crashed = "";
  b.on((m) => {
    if (m.method === "Inspector.targetCrashed") crashed = "the page tab crashed";
    if (m.method === "Page.screencastFrame") {
      const { data, metadata, sessionId } = m.params;
      const f = join(work, `f_${String(frames.length).padStart(5, "0")}.jpg`);
      frames.push({ f, t: metadata.timestamp });
      lastFrameWall = Date.now();
      writeFileSync(f, Buffer.from(data, "base64"));
      b.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
    }
    if (m.method === "Runtime.consoleAPICalled") {
      const text = m.params.args.map((a) => a.value ?? a.description ?? "").join(" ");
      if (text.includes("[record] done")) doneAt = m.params.timestamp / 1000;
      const pl = text.match(/\[record\] section timeline.*total ([\d.]+) s/);
      if (pl) planned = Number(pl[1]);
      const mk = text.match(/\[record\] [\d.]+ s\s+→ (.+)$/);
      const hv = text.match(/\[record\] hover \d+: (.+)$/);
      if (hv) hovers.push(hv[1].trim());
      if (mk) marks.push({ t: m.params.timestamp / 1000, label: mk[1].trim() });
      if (m.params.type === "error") errors.push(text);
    }
    if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
  });
  await b.send("Page.startScreencast", { format: "jpeg", quality: 80, maxWidth: REEL.w, maxHeight: REEL.h, everyNthFrame: 1 });
  await b.send("Inspector.enable").catch(() => {});
  await b.send("Page.navigate", { url: `${BASE}${PAGE}?record=1` });
  const t0 = Date.now();
  while (!doneAt && !crashed && Date.now() - t0 < REEL.secs * 1000) {
    await sleep(200);
    // frames stopped for 8 s (tab hung or the capture died): stop waiting instead of sitting out the whole cap
    if (frames.length && Date.now() - lastFrameWall > 8000) crashed = `no frames for 8 s after ${((lastFrameWall - t0) / 1000).toFixed(1)} s`;
  }
  if (crashed) console.warn(`! capture broke off: ${crashed}`);
  await sleep(600); // a little tail after the last move
  await b.send("Page.stopScreencast", {}, 5000).catch(() => {}); // frames are already captured; never fail here
  await sleep(300);
  b.close();
  if (!doneAt) console.warn("! the auto-scroll never reported done; kept the whole capture");

  // frames → constant 30 fps, real durations; cut at the end of the auto-scroll (+0.5 s)
  const end = doneAt ? doneAt + 0.5 : Infinity;
  const kept = frames.filter((f) => f.t <= end);
  let list = "";
  kept.forEach((f, i) => {
    const d = i + 1 < kept.length ? kept[i + 1].t - f.t : 0.1;
    list += `file '${f.f}'\nduration ${d.toFixed(4)}\n`;
  });
  list += `file '${kept.at(-1).f}'\n`;
  writeFileSync(join(work, "list.txt"), list);
  const full = join(work, "full.mp4");
  ff(["-f", "concat", "-safe", "0", "-i", join(work, "list.txt"), "-vf", "fps=30,scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p", "-c:v", "libx264", "-crf", "20", "-preset", "medium", full]);

  // start at the page's first paint (the blank tab before it is the browser, not the site)
  const g = grayFrames(full);
  let start = 0;
  for (let i = 0; i < g.length; i++) {
    let sum = 0;
    let min = 255;
    let max = 0;
    for (const v of g[i]) {
      sum += v;
      if (v < min) min = v;
      if (v > max) max = v;
    }
    if (max - min > 6 || sum / g[i].length < 12) {
      start = i / 30;
      break;
    }
  }
  const wall0 = kept[0].t + start; // wall-clock second of the trimmed video's first frame
  const where = (sec) => {
    const at = wall0 + Number(sec);
    let label = "start";
    for (const m of marks) if (m.t <= at + 0.05) label = m.label;
    return label;
  };
  ff(["-ss", start.toFixed(3), "-i", full, "-c:v", "libx264", "-crf", "20", "-preset", "medium", "-pix_fmt", "yuv420p", out]);
  rmSync(work, { recursive: true, force: true });

  // checks
  const fd = spawnSync("ffmpeg", ["-hide_banner", "-i", out, "-vf", "freezedetect=n=0.002:d=0.4", "-map", "0:v", "-f", "null", "-"], { encoding: "utf8" }).stderr;
  const freezes = [...fd.matchAll(/freeze_start: ([\d.]+)[\s\S]*?freeze_duration: ([\d.]+)/g)].map((m) => [Number(m[1]).toFixed(2), Number(m[2]).toFixed(2)]);
  const v = grayFrames(out);
  const diffs = [];
  for (let i = 1; i < v.length; i++) {
    let s = 0;
    for (let k = 0; k < v[i].length; k++) s += Math.abs(v[i][k] - v[i - 1][k]);
    diffs.push(s / v[i].length);
  }
  const stuck = [];
  let run = 0;
  const flush = (i) => {
    if (run >= 9) stuck.push([((i - run) / 30).toFixed(2), (run / 30).toFixed(2)]);
    run = 0;
  };
  diffs.forEach((d, i) => (d < 0.15 ? run++ : flush(i)));
  flush(diffs.length);

  const secs = (v.length / 30).toFixed(1);
  console.log(`\nreel: ${out}`);
  console.log(`  ${secs} s · ${frames.length} frames captured (≈ ${Math.round(frames.length / ((frames.at(-1).t - frames[0].t) || 1))} fps; under ~50 the machine is busy: re-run)`);
  // each flagged spot with the section record mode was heading to at that moment
  const spots = (arr) => (arr.length ? "\n" + arr.map(([s, d]) => `    ${s.padStart(7)} s  for ${d} s   → ${where(s)}`).join("\n") : " none");
  console.log(`  freezedetect (n=0.002, d=0.4 s):${spots(freezes)}`);
  console.log(`  frame-diff (no change ≥ 0.3 s):${spots(stuck)}`);
  if (errors.length) console.log(`  console errors:\n    ${errors.slice(0, 8).join("\n    ")}`);
  // a recording shorter than the planned timeline broke off (busy machine, crashed tab): never a PASS
  const firstMark = marks.length ? marks[0].t : wall0;
  const covered = doneAt ? doneAt - firstMark : 0;
  // no timeline reported at all (server down, page never ran) is never complete
  const complete = planned ? doneAt && covered >= planned - 1.5 : doneAt > 0 && frames.length > 60;
  if (!complete) console.log(`  ⚠ incomplete: the auto-scroll covered ${covered.toFixed(1)} s of its planned ${planned.toFixed(1)} s (busy machine? re-run)`);
  else if (planned) console.log(`  complete: ${planned.toFixed(1)} s timeline played to the end`);
  // the reel must be exactly 1440×900 (a cut-off viewport is never a PASS)
  const dim = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", out], { encoding: "utf8" }).stdout.trim();
  const sized = dim === `${REEL.w},${REEL.h}`;
  console.log(`  size: ${dim.replace(",", "×")}${sized ? "" : `  ✗ must be ${REEL.w}×${REEL.h}`}`);
  // the site reel must show at least 3 real hover moments (record cursor)
  const needHovers = PAGE === "/" ? 3 : 0;
  const hovered = hovers.length >= needHovers;
  console.log(`  hover moments: ${hovers.length}${hovers.length ? ` (${hovers.join(" · ")})` : ""}${hovered ? "" : `  ✗ need ≥ ${needHovers}: mark cards, swatches, buttons with data-hover-demo`}`);
  const pass = !freezes.length && !stuck.length && !errors.length && complete && sized && hovered;
  console.log(pass ? "PASS" : "FAIL");
  process.exit(pass ? 0 : 1);
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === "record") await reel(arg);
else {
  console.log("usage: node scripts/reel.mjs record [name]   (desktop only: phone shots are retired)");
  process.exit(1);
}
