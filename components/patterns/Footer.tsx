import type { FooterProps } from "./types";

export default function Footer({ name, logo, tagline, columns, note }: FooterProps) {
  return (
    <footer className="border-t border-line">
      <div className="container-x grid gap-14 py-20 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div data-reveal>
          <p className="font-display text-4xl tracking-[0.14em]">{logo ?? name}</p>
          {tagline && <p className="mt-4 max-w-xs leading-relaxed text-muted">{tagline}</p>}
        </div>
        {columns.map((c) => (
          <div key={c.title} data-reveal>
            <p className="eyebrow mb-5">{c.title}</p>
            <ul className="space-y-3">
              {c.links.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="link-underline text-sm text-fg/75 hover:text-fg">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="container-x flex flex-col justify-between gap-3 border-t border-line py-8 text-xs text-muted sm:flex-row">
        <p>© {new Date().getFullYear()} {name}. All rights reserved.</p>
        {note && <p>{note}</p>}
      </div>
    </footer>
  );
}
