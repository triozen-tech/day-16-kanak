/**
 * Customer photos + quotes as tilted polaroids scattered across the section.
 * Reference: Creamsy "Joy that travels with you". Hover straightens a card.
 */
export default function PolaroidWall({
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
  items: { image: string; quote: string; name: string; place?: string }[];
}) {
  const tilt = [-6, 4, -3, 7, -5, 3];
  const offset = [0, 60, 20, 90, 10, 50];
  return (
    <section id={id} className="section-y overflow-hidden">
      <div className="container-x grid items-center gap-16 lg:grid-cols-[0.8fr_1.2fr]">
        <div data-reveal>
          {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
          <h2 className="font-display text-[clamp(40px,4.4vw,76px)]">{heading}</h2>
          {text && <p className="mt-6 max-w-md leading-relaxed text-muted">{text}</p>}
        </div>
        <div data-reveal="stagger" className="grid grid-cols-2 gap-6 md:grid-cols-3">
          {items.map((it, i) => (
            <figure
              key={i}
              className="bg-white p-3 pb-5 text-neutral-900 shadow-[0_25px_45px_-20px_rgba(0,0,0,.4)] transition-transform duration-500 hover:z-10 hover:!rotate-0 hover:scale-105"
              style={{ rotate: `${tilt[i % tilt.length]}deg`, marginTop: offset[i % offset.length] }}
            >
              <img src={it.image} alt="" className="aspect-square w-full object-cover" />
              <figcaption className="mt-3 px-1">
                <p className="text-[13px] italic leading-snug">“{it.quote}”</p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                  {it.name}
                  {it.place && ` · ${it.place}`}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
