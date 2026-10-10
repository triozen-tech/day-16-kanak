/**
 * Bento grid of promo tiles in mixed sizes (offers, categories, collections).
 * Reference: Emango red promo grid, Fruitivo "Offers worth discovering".
 */
export type BentoItem = {
  image: string;
  title: string;
  tag?: string; // e.g. "30% OFF", "NEW"
  text?: string;
  href?: string;
  /** lg = 2×2, wide = 2×1, tall = 1×2, sm = 1×1 */
  size?: "lg" | "wide" | "tall" | "sm";
};

const span = { lg: "md:col-span-2 md:row-span-2", wide: "md:col-span-2", tall: "md:row-span-2", sm: "" };

export default function Bento({ id, eyebrow, heading, items }: { id?: string; eyebrow?: string; heading?: string; items: BentoItem[] }) {
  return (
    <section id={id} className="section-y">
      <div className="container-x">
        {heading && (
          <div data-reveal className="mb-12 max-w-2xl">
            {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
            <h2 className="font-display text-[clamp(36px,4vw,64px)]">{heading}</h2>
          </div>
        )}
        <div data-reveal="stagger" className="grid auto-rows-[clamp(180px,22vw,300px)] grid-cols-1 gap-4 md:grid-cols-4">
          {items.map((it, i) => (
            <a
              key={i}
              href={it.href ?? "#"}
              data-cursor="Shop"
              className={`group relative overflow-hidden rounded-[var(--radius)] bg-surface ${span[it.size ?? "sm"]}`}
            >
              <img src={it.image} alt={it.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.06]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
              {it.tag && (
                <span className="absolute left-4 top-4 rounded-full bg-accent px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-fg">{it.tag}</span>
              )}
              <div className="absolute inset-x-5 bottom-5 text-white">
                <p className="font-display text-[clamp(22px,2vw,34px)]">{it.title}</p>
                {it.text && <p className="mt-1 text-sm opacity-80">{it.text}</p>}
                <p className="mt-3 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] opacity-0 transition-all duration-500 group-hover:translate-x-1 group-hover:opacity-100">
                  Shop now →
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
