import type { FooterProps } from "./types";

/** Footer with the brand name set HUGE across the bottom edge. Alternative to Footer.tsx. */
export default function WordmarkFooter({ name, logo, tagline, columns, note }: FooterProps) {
  return (
    <footer className="overflow-hidden bg-surface pt-20">
      <div className="container-x grid gap-12 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <p data-reveal className="max-w-xs text-lg leading-relaxed text-muted">
          {tagline}
        </p>
        {columns.map((c) => (
          <div key={c.title} data-reveal>
            <p className="mb-4 text-[11px] uppercase tracking-[0.24em] text-muted">{c.title}</p>
            <ul className="space-y-2.5">
              {c.links.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="link-underline text-sm">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="container-x mt-16 flex justify-between border-t border-line py-6 text-xs text-muted">
        <p>
          © {new Date().getFullYear()} {name}
        </p>
        {note && <p>{note}</p>}
      </div>
      <p
        aria-hidden
        data-reveal
        className="font-display -mb-[0.2em] select-none whitespace-nowrap text-center leading-none text-fg/90"
        style={{ fontSize: `min(${Math.round(120 / Math.max(4, (logo ?? name).length))}vw, 40vh)` }}
      >
        {logo ?? name}
      </p>
    </footer>
  );
}
