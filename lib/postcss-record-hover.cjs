// PostCSS plugin: every `:hover` selector also matches `.is-hover`, so the record-mode cursor
// (components/engine/RecordCursor.tsx) triggers the site's REAL hover styles: Tailwind `hover:` /
// `group-hover:` / `peer-hover:` utilities and any plain `:hover` rule in site.css or a component.
//   .card:hover img            →  .card:is(:hover,.is-hover) img
//   .btn:not(:hover)           →  .btn:not(:is(:hover,.is-hover))
// The cursor sets `.is-hover` on the element under it and on all its ancestors, exactly like the browser's :hover.
// Runs after @tailwindcss/postcss (postcss.config.mjs). Nothing to write by hand: keep using hover as usual.
const HOVER = /:hover(?![\w-])/g;

const plugin = () => ({
  postcssPlugin: "record-hover",
  Rule(rule) {
    if (!rule.selector.includes(":hover") || rule.selector.includes(".is-hover")) return;
    rule.selector = rule.selector.replace(HOVER, ":is(:hover,.is-hover)");
  },
});
plugin.postcss = true;
module.exports = plugin;
