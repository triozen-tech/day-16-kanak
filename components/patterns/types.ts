// Props for the pattern components in this folder.
// Patterns are STARTING POINTS: copy one into site/components/, rename it,
// and restyle it for the brand. Don't make every site out of the same patterns
// with the same looks — see CLAUDE.md → Round 0.

export type Link = { label: string; href: string };

/** A folder inside /public made by `npm run frames` (contains manifest.json). */
export type FramesFolder = string;

export type Caption = {
  /** 0 → 1: where in the scroll the caption appears */
  at: number;
  title: string;
  text?: string;
  /** How long it stays, as part of the scroll (default 0.18) */
  duration?: number;
  position?: "left" | "center" | "right" | "bottom";
};

export type FrameHeroSection = {
  type: "frameHero";
  id?: string;
  frames: FramesFolder;
  /** How long the scroll lasts, in screen heights (default 4) */
  length?: number;
  eyebrow?: string;
  title: string[]; // one entry per line
  subtitle?: string;
  buttons?: (Link & { style?: "solid" | "outline" })[];
  /** Captions that fade in/out while scrolling through the video */
  captions?: Caption[];
  align?: "left" | "center";
  /** 0–1 how dark the overlay is so text stays readable (default 0.45) */
  overlay?: number;
};

export type Callout = {
  at: number; // 0 → 1
  label: string;
  text: string;
  side?: "left" | "right";
  top?: string; // CSS value, e.g. "30%"
};

export type FrameScrubSection = {
  type: "frameScrub";
  id?: string;
  frames: FramesFolder;
  length?: number;
  eyebrow?: string;
  heading: string;
  text?: string;
  callouts?: Callout[];
  /** "cover" fills the screen, "contain" shows the whole frame (product shots) */
  fit?: "cover" | "contain";
};

export type StatementSection = {
  type: "statement";
  id?: string;
  eyebrow?: string;
  /** Big sentence revealed word by word. Wrap words in *stars* to highlight them. */
  text: string;
};

export type FeaturesSection = {
  type: "features";
  id?: string;
  eyebrow?: string;
  heading: string;
  items: { title: string; text: string; image?: string; kicker?: string }[];
};

export type StatsSection = {
  type: "stats";
  id?: string;
  items: { value: number; decimals?: number; prefix?: string; suffix?: string; label: string }[];
};

export type HorizontalGallerySection = {
  type: "horizontalGallery";
  id?: string;
  eyebrow?: string;
  heading: string;
  items: { image: string; title: string; caption?: string }[];
};

export type MarqueeSection = {
  type: "marquee";
  id?: string;
  words: string[];
  outline?: boolean;
  /** seconds for one loop (default 30, lower = faster) */
  speed?: number;
};

export type ParallaxSection = {
  type: "parallax";
  id?: string;
  image: string;
  eyebrow?: string;
  heading: string;
  text?: string;
};

export type SplitSection = {
  type: "split";
  id?: string;
  image: string;
  eyebrow?: string;
  heading: string;
  text: string;
  button?: Link;
  reverse?: boolean;
  bullets?: string[];
};

export type TestimonialsSection = {
  type: "testimonials";
  id?: string;
  eyebrow?: string;
  heading: string;
  items: { quote: string; name: string; role?: string }[];
};

export type CtaSection = {
  type: "cta";
  id?: string;
  eyebrow?: string;
  heading: string;
  text?: string;
  button: Link;
  image?: string;
};

export type Section =
  | FrameHeroSection
  | FrameScrubSection
  | StatementSection
  | FeaturesSection
  | StatsSection
  | HorizontalGallerySection
  | MarqueeSection
  | ParallaxSection
  | SplitSection
  | TestimonialsSection
  | CtaSection;

export type NavProps = {
  logo: string;
  links: Link[];
  cta?: Link;
};

export type FooterProps = {
  name: string;
  logo?: string;
  tagline?: string;
  columns: { title: string; links: Link[] }[];
  /** e.g. "Concept website by <your studio>. Not affiliated with the brand." */
  note?: string;
};
