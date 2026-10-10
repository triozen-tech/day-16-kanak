import type { SiteMeta, Theme } from "@/lib/site";

// Placeholder: a new day starts here. Round 0 writes site/DESIGN.md, Round 1 rewrites this file for the brand.

export const meta: SiteMeta = {
  name: "Showreel Kit",
  title: "Showreel Kit — new site",
  description: "Blank starting point for today's showcase site.",
  loaderText: "Kit",
  loader: true,
  cursor: true,
  record: { duration: 30 },
};

export const theme: Theme = {
  bg: "#0e0e0f",
  surface: "#18181a",
  text: "#f2f2f0",
  muted: "#9a9a96",
  accent: "#f2f2f0",
  accentText: "#0e0e0f",
  line: "#2a2a2c",
  fontDisplay: "system-ui, sans-serif",
  fontBody: "system-ui, sans-serif",
  radius: 0,
};
