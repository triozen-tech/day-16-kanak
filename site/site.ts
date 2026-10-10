import type { SiteMeta, Theme } from "@/lib/site";

// Kanak Jewels · Day 16 (site/DESIGN.md): L17 symmetric monument, ivory-and-gold edition.
export const meta: SiteMeta = {
  name: "Kanak Jewels",
  title: "Kanak Jewels: hallmarked 22K gold, Jaipur",
  description: "Concept website: a gold jewellery house in Jaipur. Bridal, temple, daily wear and gifting, every price itemised.",
  loaderText: "Kanak",
  // Round 2 adds the I31 coin-spin loader (site component); the engine loader stays off.
  loader: false,
  cursor: true,
  record: { duration: 35 },
};

export const theme: Theme = {
  bg: "#F6EFE3", // ivory
  surface: "#FBF7F0", // paper
  text: "#2B2117", // ink
  muted: "#6E5E4A", // 5.3:1 on ivory
  accent: "#A87A2A", // gold: light, lines, highlights (buttons are ink, see site.css)
  accentText: "#FBF7F0",
  line: "#D9C8AC",
  fontDisplay: "'Italiana', serif",
  fontBody: "'Figtree Variable', sans-serif",
  radius: 18,
};
