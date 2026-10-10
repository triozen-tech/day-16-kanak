// NV17 restyled as a jeweller's card (A · hero-1): 2 + 2 short link columns around a centred wordmark.
import { nav } from "../content";

export default function CardNav({ bag = 0 }: { bag?: number }) {
  return (
    <nav
      className="absolute inset-x-0 top-0 z-30 grid grid-cols-[1fr_auto_1fr] items-start px-16 pt-9 text-[15px]"
      data-nav
    >
      <div className="flex gap-14">
        {nav.left.map((col, i) => (
          <div key={i} className="grid gap-1.5">
            {col.map((l) => (
              <a key={l} className="kj-link w-fit" href="#collections">
                {l}
              </a>
            ))}
          </div>
        ))}
      </div>
      <div className="text-center" data-wordmark-slot>
        <div className="kj-display text-[40px] leading-none tracking-[0.3em] pl-[0.3em]">
          {nav.wordmark}
        </div>
        <div className="kj-eyebrow mt-2 text-[12px] tracking-[0.36em]">
          {nav.tag}
        </div>
      </div>
      <div className="flex justify-end gap-14 text-right">
        {nav.right.map((col, i) => (
          <div key={i} className="grid gap-1.5 justify-items-end">
            {col.map((l) => (
              <a key={l} className="kj-link w-fit" href="#piece">
                {l}
              </a>
            ))}
            {i === 1 && (
              <a className="kj-link w-fit" href="#piece" data-bag>
                Bag (<span data-bag-count>{bag}</span>)
              </a>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}
