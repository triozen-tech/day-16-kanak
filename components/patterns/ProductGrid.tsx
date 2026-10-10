/**
 * Product cards with price + buy button. Three card styles:
 *  - "pop"    product image floats ABOVE a white card (Creamsy ice-cream tubs, Fruitivo perfumes) — use cut-out PNGs
 *  - "photo"  tall photo card with name + price under it (Drift, saree "New arrivals")
 *  - "dark"   square product on light tile inside a dark section (Emango "Most loved picks")
 * layout "row" = one horizontal scrolling row, "grid" = wraps.
 * Prices are samples for concept sites — keep "Concept website" in the footer note.
 */
export type Product = {
  image: string;
  name: string;
  price: string; // e.g. "₹2,499"
  oldPrice?: string;
  badge?: string; // "NEW", "-20%", "BESTSELLER"
  note?: string; // small line under the name
  href?: string;
};

const Heart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
    <path d="M12 21s-7.5-4.6-9.6-9.2C1 8.6 3 5 6.6 5c2.1 0 3.6 1.2 5.4 3.2C13.8 6.2 15.3 5 17.4 5 21 5 23 8.6 21.6 11.8 19.5 16.4 12 21 12 21z" />
  </svg>
);

export default function ProductGrid({
  id,
  eyebrow,
  heading,
  items,
  card = "photo",
  layout = "grid",
  cta = "Add to cart",
}: {
  id?: string;
  eyebrow?: string;
  heading?: string;
  items: Product[];
  card?: "pop" | "photo" | "dark";
  layout?: "grid" | "row";
  cta?: string;
}) {
  const wrap =
    layout === "row"
      ? "flex gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&>*]:w-[min(72vw,280px)] [&>*]:shrink-0"
      : "grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4";
  return (
    <section id={id} className="section-y">
      <div className="container-x">
        {heading && (
          <div data-reveal className="mb-12 flex items-end justify-between gap-6">
            <div>
              {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
              <h2 className="font-display text-[clamp(34px,3.6vw,60px)]">{heading}</h2>
            </div>
            <a href="#" className="link-underline hidden shrink-0 pb-1 text-[11px] uppercase tracking-[0.22em] md:block">
              View all →
            </a>
          </div>
        )}
        <div data-reveal="stagger" className={`${wrap} ${card === "pop" ? "pt-16" : ""}`}>
          {items.map((p, i) =>
            card === "pop" ? (
              <a key={i} href={p.href ?? "#"} className="group relative flex flex-col items-center rounded-[calc(var(--radius)+8px)] bg-white px-5 pb-6 pt-24 text-center text-neutral-900 shadow-[0_20px_50px_-25px_rgba(0,0,0,.35)] transition-transform duration-500 hover:-translate-y-2">
                <img src={p.image} alt={p.name} className="absolute -top-14 left-1/2 h-36 w-auto -translate-x-1/2 object-contain drop-shadow-[0_18px_18px_rgba(0,0,0,.28)] transition-transform duration-700 group-hover:-translate-y-2 group-hover:rotate-[-4deg] group-hover:scale-105" />
                <p className="text-lg font-semibold">{p.price}</p>
                <p className="mt-1 text-xs text-neutral-500">{p.name}</p>
                <span className="mt-5 rounded-full bg-neutral-900 px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition-colors group-hover:bg-accent group-hover:text-accent-fg">{cta}</span>
              </a>
            ) : (
              <a key={i} href={p.href ?? "#"} className="group block">
                <div className={`relative overflow-hidden rounded-[var(--radius)] ${card === "dark" ? "aspect-square bg-white" : "aspect-[3/4] bg-surface"}`}>
                  <img src={p.image} alt={p.name} className={`h-full w-full transition-transform duration-[1s] ease-out group-hover:scale-[1.06] ${card === "dark" ? "object-contain p-6" : "object-cover"}`} />
                  {p.badge && <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-fg">{p.badge}</span>}
                  <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-neutral-900 transition-colors hover:text-red-500">
                    <Heart />
                  </span>
                  <span className="absolute inset-x-3 bottom-3 translate-y-3 rounded-[var(--radius)] bg-accent py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-fg opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                    {cta}
                  </span>
                </div>
                <p className="mt-4 text-sm font-medium">{p.name}</p>
                {p.note && <p className="mt-0.5 text-xs text-muted">{p.note}</p>}
                <p className="mt-1.5 flex items-baseline gap-2 text-sm">
                  <span className="font-semibold text-accent">{p.price}</span>
                  {p.oldPrice && <span className="text-xs text-muted line-through">{p.oldPrice}</span>}
                </p>
              </a>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
