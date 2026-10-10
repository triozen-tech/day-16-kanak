import type { TestimonialsSection } from "./types";
import SplitText from "@/components/ui/SplitText";
import TiltCard from "@/components/ui/TiltCard";

/** Quote cards. (Demo quotes are placeholders — use real ones for real clients.) */
export default function Testimonials({ s }: { s: TestimonialsSection }) {
  return (
    <section id={s.id} className="section-y">
      <div className="container-x">
        <div className="mb-16 text-center">
          {s.eyebrow && (
            <p data-reveal className="eyebrow mb-6">
              {s.eyebrow}
            </p>
          )}
          <SplitText text={s.heading} className="font-display mx-auto max-w-4xl text-[clamp(36px,4vw,68px)]" />
        </div>
        <div data-reveal="stagger" className="grid gap-5 lg:grid-cols-3">
          {s.items.map((t, i) => (
            <TiltCard key={i} className="rounded-[var(--radius)] border border-line bg-surface p-10">
              <p className="font-display text-6xl leading-none text-accent">“</p>
              <p className="mt-2 text-lg leading-relaxed text-fg/90">{t.quote}</p>
              <div className="mt-8 border-t border-line pt-6">
                <p className="text-sm uppercase tracking-[0.2em] text-accent">{t.name}</p>
                {t.role && <p className="mt-1 text-sm text-muted">{t.role}</p>}
              </div>
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  );
}
