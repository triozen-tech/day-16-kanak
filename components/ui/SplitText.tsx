import { createElement, type ElementType } from "react";

/**
 * Text for the line-by-line reveal (`data-split`, played by the engine with GSAP's SplitText plugin: lines rise from
 * behind a mask, re-split automatically when fonts load or the width changes, so lines never break wrongly).
 * Wrap words in *stars* to highlight them in the accent colour. The server renders plain text, so ?static=1 and
 * no-JS show the final state.
 */
export default function SplitText({
  text,
  as = "h2",
  className = "",
}: {
  text: string;
  as?: ElementType;
  className?: string;
}) {
  const parts = text.split(/(\*[^*]+\*)/);
  return createElement(
    as,
    { className, "data-split": "" },
    parts.map((p, i) =>
      p.startsWith("*") && p.endsWith("*") ? (
        <span key={i} className="highlight">
          {p.slice(1, -1)}
        </span>
      ) : (
        p
      ),
    ),
  );
}
