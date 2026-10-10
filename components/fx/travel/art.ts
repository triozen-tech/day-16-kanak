// Placeholder art for the travelling-object demos (/lab/travel): a transparent product (a can) seen from 4 angles,
// and small "ingredient" cut-outs. Plain SVG data URIs, so demos never depend on a day's images. A real site uses its
// own transparent .png/.webp angles (flow-prompts skill → rembg: `npm run cutout`).

const W = 400;
const H = 760;

/** The product at an angle: 0 front · 1 three-quarter · 2 side · 3 back. The label band slides round the body. */
export function productAngle(i: number, accent = "#2f8cff") {
  // label: centre offset and width per angle (front wide in the middle, 3/4 shifted, side at the edge, back = barcode)
  const label = [
    { x: 0.5, w: 0.62 },
    { x: 0.66, w: 0.44 },
    { x: 0.86, w: 0.16 },
    { x: 0.5, w: 0 },
  ][i];
  const lx = W * label.x;
  const lw = W * label.w;
  const body = `<rect x="40" y="70" width="${W - 80}" height="${H - 120}" rx="44" fill="url(#b)"/>`;
  const lid = `<ellipse cx="${W / 2}" cy="74" rx="${W / 2 - 46}" ry="26" fill="#c9d4e0"/><ellipse cx="${W / 2}" cy="70" rx="${W / 2 - 70}" ry="16" fill="#8e9bab"/><rect x="${W / 2 - 34}" y="58" width="68" height="16" rx="8" fill="#dfe7ef"/>`;
  const rings = [0.42, 0.46, 0.5].map((y) => `<rect x="40" y="${H * y}" width="${W - 80}" height="8" fill="${accent}" opacity=".9"/>`).join("");
  const mark = lw
    ? `<g clip-path="url(#c)"><rect x="${lx - lw / 2}" y="${H * 0.56}" width="${lw}" height="${H * 0.16}" rx="10" fill="#eaf5ff" opacity=".92"/><text x="${lx}" y="${H * 0.66}" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="${Math.max(10, lw * 0.22)}" fill="#0b1020">BRAND</text></g>`
    : `<g fill="#eaf5ff" opacity=".8">${Array.from({ length: 14 }, (_, k) => `<rect x="${W / 2 - 60 + k * 9}" y="${H * 0.6}" width="${k % 3 ? 3 : 6}" height="${H * 0.1}"/>`).join("")}</g>`;
  const shine = `<rect x="${W * (0.22 + i * 0.05)}" y="80" width="26" height="${H - 140}" rx="13" fill="white" opacity=".22"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><linearGradient id="b" x1="0" x2="1"><stop offset="0" stop-color="#05070d"/><stop offset=".35" stop-color="#1b2a4a"/><stop offset=".55" stop-color="#3a5b92"/><stop offset=".75" stop-color="#16223d"/><stop offset="1" stop-color="#05070d"/></linearGradient><clipPath id="c"><rect x="40" y="70" width="${W - 80}" height="${H - 120}" rx="44"/></clipPath></defs>${body}${rings}${mark}${shine}${lid}<ellipse cx="${W / 2}" cy="${H - 50}" rx="${W / 2 - 40}" ry="22" fill="#0b1020"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
export const PRODUCT_SIZE = { w: W, h: H };

const ING = [
  // leaf
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M10 90 C10 40 50 10 92 8 C90 50 60 90 10 90Z" fill="#2fbf71"/><path d="M14 86 L84 16" stroke="#9cf0c0" stroke-width="3"/></svg>`,
  // ice cube
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="14" y="14" width="72" height="72" rx="14" fill="#cfefff" opacity=".85"/><rect x="24" y="22" width="26" height="12" rx="6" fill="white" opacity=".8"/></svg>`,
  // citrus slice
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="#ffd34d"/><circle cx="50" cy="50" r="36" fill="#fff3b0"/>${Array.from({ length: 8 }, (_, k) => `<path d="M50 50 L${50 + 34 * Math.cos((k * Math.PI) / 4)} ${50 + 34 * Math.sin((k * Math.PI) / 4)}" stroke="#ffd34d" stroke-width="3"/>`).join("")}</svg>`,
  // berry
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="56" r="34" fill="#e0315b"/><path d="M50 22 C44 10 60 8 56 22" stroke="#2fbf71" stroke-width="6" fill="none"/><circle cx="40" cy="46" r="6" fill="white" opacity=".35"/></svg>`,
];
export const ingredient = (i: number) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(ING[i % ING.length])}`;

/** Demo 3D model: Khronos glTF sample "WaterBottle" (CC0), compressed with `npm run glb` (docs/SOURCES.md). */
export const DEMO_MODEL = "/lab/models/water-bottle.glb";
/** The same model with plain geometry + WebP textures (`npm run glb -- in out --ogl`): for OGL and <model-viewer>
 *  (no Meshopt decoder needed, so nothing is fetched from a CDN). */
export const DEMO_MODEL_OGL = "/lab/models/water-bottle-ogl.glb";
