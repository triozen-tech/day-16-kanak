// MOTION-MENU groups. Each group has its own lab page: /lab/motion/<slug>; codes continue the menu's families
// (M75+ motions, X19+ transitions, I11+ loaders, U01+ micro-interactions).
export type MotionGroup = { slug: string; name: string; codes: string };
export const MGROUPS: MotionGroup[] = [
  { slug: "reveal", name: "Reveals", codes: "M" },
  { slug: "text", name: "Text effects", codes: "M" },
  { slug: "scroll", name: "Scroll & pinned", codes: "M" },
  { slug: "image", name: "Image effects", codes: "M" },
  { slug: "ambient", name: "Backgrounds & ambient", codes: "M" },
  { slug: "transition", name: "Transitions", codes: "X" },
  { slug: "loader", name: "Loaders", codes: "I" },
  { slug: "micro", name: "Hover, buttons & cursor", codes: "U" },
];
