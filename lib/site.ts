// Types for site/site.ts — the per-site settings the engine reads.

export type Theme = {
  bg: string; // page background
  surface: string; // cards, inputs
  text: string; // main text
  muted: string; // small text (contrast ≥ 4.5:1 on bg)
  accent: string; // buttons, highlights, lines
  accentText: string; // text on top of accent
  line: string; // borders
  /** CSS font-family for headings, e.g. "'Bricolage Grotesque Variable', sans-serif" (import it in site/fonts.ts) */
  fontDisplay: string;
  /** CSS font-family for body text */
  fontBody: string;
  radius?: number; // corner roundness in px
  uppercaseHeadings?: boolean;
  /** Text colour on top of hero video/images (default: light) */
  heroText?: string;
};

export type SiteMeta = {
  name: string;
  /** Browser tab title */
  title: string;
  description: string;
  /** Letters shown by the loader (default: name) */
  loaderText?: string;
  loader?: boolean;
  cursor?: boolean;
  /** Record mode (?record=1), constant-speed mode: a fixed speed, or `duration` = seconds for the whole page.
   *  Ignored when the page uses the section timeline (data-record-time attributes, docs/RECORDING.md).
   *  `cursor: false` turns off the record-mode hover cursor (components/engine/RecordCursor.tsx; on by default). */
  record?: { speed?: number; duration?: number; delay?: number; cursor?: boolean };
};
