/** Questions that open and close. Reference: Creamsy green FAQ panel. First item starts open. */
export default function Faq({
  id,
  eyebrow,
  heading,
  text,
  items,
}: {
  id?: string;
  eyebrow?: string;
  heading: string;
  text?: string;
  items: { q: string; a: string }[];
}) {
  return (
    <section id={id} className="section-y">
      <div className="container-x grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div data-reveal>
          {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
          <h2 className="font-display text-[clamp(36px,4vw,64px)]">{heading}</h2>
          {text && <p className="mt-6 max-w-sm leading-relaxed text-muted">{text}</p>}
        </div>
        <div data-reveal="stagger" className="space-y-3">
          {items.map((it, i) => (
            <details key={i} open={i === 0} className="faq group rounded-[var(--radius)] border border-line bg-surface px-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-base font-medium">
                {it.q}
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line text-accent transition-transform duration-500 group-open:rotate-45">+</span>
              </summary>
              <p className="pb-6 pr-10 leading-relaxed text-muted">{it.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
