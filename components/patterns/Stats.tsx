import type { StatsSection } from "./types";

/** Big numbers that count up. */
export default function Stats({ s }: { s: StatsSection }) {
  return (
    <section id={s.id} className="border-y border-line">
      <div className="container-x grid grid-cols-2 lg:grid-flow-col lg:auto-cols-fr lg:grid-cols-none">
        {s.items.map((it, i) => (
          <div key={i} data-reveal className="border-line px-2 py-14 text-center lg:border-l lg:first:border-l-0">
            <p
              className="font-display whitespace-nowrap text-[clamp(38px,3.8vw,68px)] text-accent"
              data-count={it.value}
              data-decimals={it.decimals ?? 0}
              data-prefix={it.prefix ?? ""}
              data-suffix={it.suffix ?? ""}
            >
              {(it.prefix ?? "") + it.value.toFixed(it.decimals ?? 0) + (it.suffix ?? "")}
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.28em] text-muted">{it.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
