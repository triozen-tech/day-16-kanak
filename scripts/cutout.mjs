// npm run cutout -- <image-or-folder> [out] [--fast]
// Removes the background with rembg (MIT) + the BiRefNet model (MIT) → transparent PNG(s), via scripts/cutout.py.
// Uses the kit's local Python env `.venv-cutout/` (not global; git-ignored). Create it once with:
//   npm run cutout:setup      (= python3 -m venv .venv-cutout && pip install "rembg[cpu,cli]" "huggingface_hub<1.0")
//   (huggingface_hub < 1.0: rembg 2.0.6x's web UI dependency imports HfFolder, removed in hub 1.0)
// ALWAYS a named model: rembg's newest default (bria-rmbg / RMBG-2.0) needs a paid licence for commercial use.
//   default: birefnet-general (best edges; downloads ~1 GB once into ~/.u2net) · --fast: u2net (~170 MB, softer edges)
// Then convert to WebP for the site, and check the edges on a dark AND a light background.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { basename, extname, join } from "node:path";

const args = process.argv.slice(2);
const input = args.find((a) => !a.startsWith("--"));
if (!input) {
  console.log("usage: npm run cutout -- <image-or-folder> [out] [--fast]");
  process.exit(1);
}
const py = join(process.cwd(), ".venv-cutout", "bin", "python");
if (!existsSync(py) || spawnSync(py, ["-c", "import rembg"], { encoding: "utf8" }).status !== 0) {
  console.log("rembg is not set up. Run:  npm run cutout:setup");
  process.exit(1);
}
const model = args.includes("--fast") ? "u2net" : "birefnet-general";
const env = { ...process.env, PYTHONWARNINGS: "ignore" }; // hides the harmless LibreSSL warning of the macOS Python
const isFile = statSync(input).isFile();
let output = args.filter((a) => !a.startsWith("--"))[1];
let files = [input];
if (isFile) output ??= input.replace(new RegExp(`${extname(input)}$`), "-cutout.png");
else {
  output ??= `${input.replace(/\/$/, "")}-cutout`;
  mkdirSync(output, { recursive: true });
  files = readdirSync(input).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).map((f) => join(input, f));
}
// scripts/cutout.py uses rembg's Python API on the CPU (its CLI also enables CoreML on macOS, which hangs)
const run = spawnSync(py, [join(process.cwd(), "scripts", "cutout.py"), model, output, ...files], { stdio: "inherit", env });
if (run.status !== 0) process.exit(run.status ?? 1);
console.log(`\n✓ ${basename(input)} → ${output} (model ${model}, transparent PNG)`);
