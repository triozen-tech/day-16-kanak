// npm run glb -- <in.glb> [out.glb] [--draco | --ogl] [--size 1024]
// Compresses a 3D model for the web with glTF-Transform (MIT, @gltf-transform/cli, run through npx, pinned):
// weld/dedup/prune → Meshopt geometry (or Draco with --draco; plain geometry with --ogl, for the OGL loader, which reads
// WebP textures but not Meshopt) → WebP textures resized to ≤ 1024 px.
// Budget: ≤ 3 MB per .glb (docs/LESSONS.md). Meshopt files need the MeshoptDecoder in the loader
// (components/fx/travel/Object3D.tsx sets it). KTX2 textures would need the external `ktx` tool (≥ 4.4): not used.
import { spawnSync } from "node:child_process";
import { statSync } from "node:fs";

const args = process.argv.slice(2);
const input = args.find((a) => !a.startsWith("--"));
if (!input) {
  console.log("usage: npm run glb -- <in.glb> [out.glb] [--draco | --ogl] [--size 1024]");
  process.exit(1);
}
const output = args.filter((a) => !a.startsWith("--"))[1] ?? input.replace(/\.glb$/i, ".min.glb");
const size = args.includes("--size") ? args[args.indexOf("--size") + 1] : "1024";
const compress = args.includes("--ogl") ? "false" : args.includes("--draco") ? "draco" : "meshopt";

const run = spawnSync(
  "npx",
  ["-y", "@gltf-transform/cli@4.5.1", "optimize", input, output, "--compress", compress, "--texture-compress", "webp", "--texture-size", size],
  { stdio: "inherit" },
);
if (run.status !== 0) process.exit(run.status ?? 1);
const mb = (f) => (statSync(f).size / 1e6).toFixed(2);
console.log(`\n${input} ${mb(input)} MB → ${output} ${mb(output)} MB (${compress}, webp ≤ ${size}px)`);
if (statSync(output).size > 3e6) console.log("⚠ over the 3 MB budget: try --size 512, or simplify the mesh (gltf-transform simplify)");
