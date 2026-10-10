import type { FeaturesSection } from "./types";
import SplitText from "@/components/ui/SplitText";
import TiltCard from "@/components/ui/TiltCard";

/** Grid of cards that tilt toward the mouse. Images optional. */
export default function Features({ s }: { s: FeaturesSection }) {
  const cols = s.items.length === 4 ? "lg:grid-cols-4" : s.items.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3";
  return (
    <section id={s.id} className="section-y">
      <div className="container-x">
        <div className="mb-16 max-w-3xl">
          {s.eyebrow && (
            <p data-reveal className="eyebrow mb-6">
              {s.eyebrow}
            </p>
          )}
          <SplitText text={s.heading} className="font-display text-[clamp(38px,4.2vw,72px)]" />
        </div>
        <div data-reveal="stagger" className={`grid gap-5 md:grid-cols-2 ${cols}`}>
          {s.items.map((it, i) => (
            <TiltCard key={i} className="flex min-h-[340px] flex-col justify-end rounded-[var(--radius)] border border-line bg-surface p-8">
              {it.image && (
                <>
                  <img src={it.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55" />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/60 to-transparent" />
                </>
              )}
              <div className="relative">
                <p className="eyebrow mb-4">{it.kicker ?? String(i + 1).padStart(2, "0")}</p>
                <h3 className="font-display mb-3 text-3xl">{it.title}</h3>
                <p className="leading-relaxed text-muted">{it.text}</p>
              </div>
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  );
}
