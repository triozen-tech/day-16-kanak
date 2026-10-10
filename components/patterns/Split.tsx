import type { SplitSection } from "./types";
import SplitText from "@/components/ui/SplitText";
import Button from "@/components/ui/Button";

/** Image on one side, story on the other. Use `reverse` to flip. */
export default function Split({ s }: { s: SplitSection }) {
  return (
    <section id={s.id} className="section-y">
      <div className={`container-x grid items-center gap-14 lg:grid-cols-2 lg:gap-24 ${s.reverse ? "lg:[&>*:first-child]:order-2" : ""}`}>
        <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius)]">
          <img src={s.image} alt="" data-zoom className="h-full w-full object-cover" />
        </div>
        <div>
          {s.eyebrow && (
            <p data-reveal className="eyebrow mb-6">
              {s.eyebrow}
            </p>
          )}
          <SplitText text={s.heading} className="font-display text-[clamp(38px,4.2vw,72px)]" />
          <p data-reveal className="mt-8 max-w-lg text-lg leading-relaxed text-muted">
            {s.text}
          </p>
          {s.bullets && (
            <ul data-reveal="stagger" className="mt-8 max-w-lg divide-y divide-line border-y border-line">
              {s.bullets.map((b) => (
                <li key={b} className="flex items-center gap-4 py-4">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  {b}
                </li>
              ))}
            </ul>
          )}
          {s.button && (
            <div data-reveal className="mt-10">
              <Button href={s.button.href} label={s.button.label} style="outline" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
