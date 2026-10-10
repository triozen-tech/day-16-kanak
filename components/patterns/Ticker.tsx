/**
 * Thin announcement strip that scrolls forever (offers, news, "free delivery…").
 * Seen on almost every shop-style reference site. Put it under the nav or between sections.
 */
export default function Ticker({
  items,
  speed = 40,
  separator = "✦",
  className = "bg-accent text-accent-fg",
}: {
  items: string[];
  /** seconds per loop (lower = faster) */
  speed?: number;
  separator?: string;
  className?: string;
}) {
  const row = (
    <div className="flex shrink-0 items-center" aria-hidden>
      {[...items, ...items].map((t, i) => (
        <span key={i} className="flex items-center gap-6 px-6 text-[11px] font-medium uppercase tracking-[0.22em]">
          {t}
          <span className="opacity-60">{separator}</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className={`relative overflow-hidden py-2.5 ${className}`} aria-label={items.join(", ")}>
      <div className="ticker-track flex w-max" style={{ animationDuration: `${speed}s` }}>
        {row}
        {row}
      </div>
    </div>
  );
}
