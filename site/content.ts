// All text + data for Kanak Jewels (fictional; Jaipur, since 1987). Prices are samples, computed from grams.

export const RATE = { "22K": 7240, "18K": 5930 } as const; // ₹ per gram · Sample rate · concept site
export type Karat = keyof typeof RATE;
export const MAKING = 0.12;
export const GST = 0.03;
export const SAMPLE_NOTE = "Sample rate · concept site";

export const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
export function priceOf(grams: number, karat: Karat = "22K") {
  const gold = grams * RATE[karat];
  const making = gold * MAKING;
  const gst = (gold + making) * GST;
  return { grams, rate: RATE[karat], gold, making, gst, total: gold + making + gst };
}

const IMG = "/images/kanak";

export const nav = {
  left: [
    ["Necklaces", "Earrings", "Bangles"],
    ["Bridal", "Temple", "Gifting"],
  ],
  right: [
    ["Gold rate", "Our craft", "Stores"],
    ["Search", "Account"],
  ],
  wordmark: "KANAK",
  tag: "Jewels · since 1987",
};

export const hero = {
  image: `${IMG}/hero.webp`,
  necklace: `${IMG}/hero-necklace.webp`,
  zoom: `${IMG}/loupe-22k.webp`, // A7a pendant close-up: the hero zoom finishes on it
  behind: "ETERNAL",
  front: "GOLD",
  eyebrow: "The Bridal Edit · 2026",
  copy: "Heirloom necklaces in 22K gold, hallmarked and handcrafted in Jaipur.",
  cta: "Explore bridal",
  piece: "Mayuri Haar",
  grams: 62.4,
};

export type Collection = { id: string; name: string; count: number; tint: string; ink: string; image: string; line: string; floats: string[] };
export const collections: Collection[] = [
  { id: "bridal", name: "Bridal", count: 48, tint: "#EBCFC6", ink: "#8E3F31", image: `${IMG}/coll-bridal.webp`, line: "Kundan, polki and ruby sets for the wedding day.", floats: ["pearl-drops", "ruby-stack-ring", "flower-pin", "bangle"] },
  { id: "temple", name: "Temple", count: 36, tint: "#EBCB7E", ink: "#7A5512", image: `${IMG}/coll-temple.webp`, line: "Kasu malas and coin haars in antique 22K.", floats: ["coin-pendant", "band-ring", "studs", "leaf-chain"] },
  { id: "daily", name: "Daily wear", count: 120, tint: "#D3DCCB", ink: "#46583F", image: `${IMG}/coll-daily.webp`, line: "Light pieces under 10 g for every day.", floats: ["hoops", "studs", "anklet", "band-ring"] },
  { id: "gifting", name: "Gifting", count: 64, tint: "#DDD4E7", ink: "#5E4C78", image: `${IMG}/coll-gifting.webp`, line: "Rose gold and small treasures, gift-boxed.", floats: ["charm-bracelet", "pearl-drops", "coin-pendant", "hoops"] },
];

export type Piece = { id: string; name: string; type: string; grams: number; image: string; size: number };
// size: how big the piece looks next to the others (1 = a chain or bangle), so studs never look like bangles
export const PIECE_SIZE: Record<string, number> = { studs: 0.42, "flower-pin": 0.46, "pearl-drops": 0.58, "ruby-stack-ring": 0.62, "band-ring": 0.6, hoops: 0.74, "coin-pendant": 0.92, "leaf-chain": 1, bangle: 0.96, "charm-bracelet": 0.96, anklet: 1, "black-bead-chain": 1 };
const piece = (id: string, name: string, type: string, grams: number): Piece => ({ id, name, type, grams, image: `${IMG}/pieces/${id}.webp`, size: PIECE_SIZE[id] ?? 1 });
// the clock: one piece per hour (12 o'clock first)
export const hours: Piece[] = [
  piece("coin-pendant", "Lakshmi coin pendant", "Pendant", 5.2),
  piece("studs", "Bindu studs", "Studs", 2.1),
  piece("hoops", "Chandra hoops", "Hoops", 6.2),
  piece("band-ring", "Nitya band", "Ring", 3.4),
  piece("leaf-chain", "Patta chain", "Pendant", 4.8),
  piece("bangle", "Saral bangle", "Bangle", 9.6),
  piece("flower-pin", "Phool nose pin", "Nose pin", 0.9),
  piece("charm-bracelet", "Tara charm bracelet", "Bracelet", 5.4),
  piece("pearl-drops", "Moti drops", "Earrings", 3.9),
  piece("ruby-stack-ring", "Lal stack ring", "Ring", 2.8),
  piece("anklet", "Payal chain", "Anklet", 6.8),
  piece("black-bead-chain", "Mangal chain", "Chain", 7.5),
];
export const clock = {
  eyebrow: "Daily wear",
  title: ["A piece for", "every hour"],
  copy: "Twelve light pieces under 10 g, made to be worn from morning tea to late dinners.",
  shown: [4, 8, 12], // hours lit on camera (index 0 = 12 o'clock)
};

export const product = {
  index: "01 / 04",
  name: "Mayuri Haar",
  kind: "bridal necklace",
  // A7 cut-out per karat (A8 = A7 recoloured by Flow, pixel-aligned: same cut-out mask)
  cut: { "22K": `${IMG}/mayuri-cut.webp`, "18K": `${IMG}/mayuri-18k-cut.webp` } as Record<Karat, string>,
  // the loupe uses the sharp A7a macro where it covers the piece (its frame inside A7, as fractions of A7)
  loupe: { "22K": `${IMG}/loupe-22k.webp`, "18K": `${IMG}/loupe-18k.webp` } as Record<Karat, string>,
  loupeFrame: { left: 0.2715, top: 0.4668, size: 0.46 },
  views: [
    { id: "front", label: "Front", thumb: `${IMG}/thumb-front.webp`, image: null as string | null },
    { id: "pendant", label: "Pendant close-up", thumb: `${IMG}/thumb-pendant.webp`, image: `${IMG}/loupe-22k.webp` },
    { id: "clasp", label: "Clasp and tassels", thumb: `${IMG}/thumb-clasp.webp`, image: `${IMG}/view-clasp.webp` },
    { id: "side", label: "Side view", thumb: `${IMG}/thumb-side.webp`, image: `${IMG}/view-side.webp` },
  ],
  tryon: `${IMG}/tryon.webp`, // A9: the same necklace on a plain ivory bust (no head, no face)
  grams: { "22K": 62.4, "18K": 60.8 } as Record<Karat, number>,
  stones: "Peacock links, ruby drop, Basra-style pearl fringe",
  others: ["Kasu Mala", "Rani Bridal Set", "Gulab Bracelet"],
};

export const trust = {
  seal: "916",
  ring: "BIS HALLMARK · 22 KARAT · 916 · ",
  promises: [
    ["Hallmarked", "Every piece, BIS 916 or 750"],
    ["Certified", "Weight and stone certificate"],
    ["Lifetime exchange", "At the day's gold value"],
    ["Itemised price", "Gold, making and GST, line by line"],
  ],
};

export const craft = {
  eyebrow: "Made in Jaipur, since 1987",
  title: "Five steps of work, none of them rushed",
  steps: [
    ["Sketch", "A pencil drawing at true size."],
    ["Wax", "Carved, then cast in lost wax."],
    ["Cast", "22K poured at 1,064 °C."],
    ["Set", "Each stone set under a loupe."],
    ["Polish", "Burnished with agate to a soft glow."],
  ],
};

export const festive = {
  script: "Dhanteras & wedding season",
  title: "The Festive Edit",
  offer: "Making charges from 6% on sets · gift cards from ₹5,000",
  cards: [
    { name: "Lakshmi coins & bars", price: "from ₹8,600", image: `${IMG}/festive-1.webp` },
    { name: "Rani bridal set", price: "₹7,84,000", image: `${IMG}/festive-2.webp` },
    { name: "Mayil temple set", price: "₹4,12,000", image: `${IMG}/festive-3.webp` },
    { name: "Jaali bangles, set of six", price: "₹3,96,000", image: `${IMG}/festive-4.webp` },
    { name: "Gift box: pendant + studs", price: "₹62,400", image: `${IMG}/festive-5.webp` },
  ],
};

export const reviews = {
  eyebrow: "4.9 from 2,300 brides",
  title: "Worn on the biggest days",
  items: [
    { quote: "The Mayuri haar caught every light at the pheras.", mark: "every light", who: "Ananya R. · Jaipur" },
    { quote: "Exchanged my mother's set at the day's rate. No haggling.", mark: "the day's rate", who: "Meera S. · Pune" },
    { quote: "The price card showed every rupee. That's why I came back.", mark: "every rupee", who: "Fatima K. · Hyderabad" },
  ],
};

export const footer = {
  invite: "Try it in the store, or at home.",
  cols: [
    ["Shop", ["Bridal", "Daily wear", "Temple", "Gifting"]],
    ["House", ["Our craft", "Hallmark", "Exchange"]],
    ["Letters", ["Festive previews, once a month."]],
  ] as [string, string[]][],
  note: "Concept website by Triozen Tech · sample prices · not a real store",
};
