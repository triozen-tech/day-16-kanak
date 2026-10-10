import type { StatementSection } from "./types";
import SplitText from "@/components/ui/SplitText";

/** One big sentence, revealed word by word. Great right after a hero. */
export default function Statement({ s }: { s: StatementSection }) {
  return (
    <section id={s.id} className="section-y">
      <div className="container-x">
        {s.eyebrow && (
          <p data-reveal className="eyebrow mb-10">
            {s.eyebrow}
          </p>
        )}
        <SplitText text={s.text} as="p" className="font-display max-w-6xl text-[clamp(34px,4.4vw,76px)] leading-[1.08]" />
      </div>
    </section>
  );
}
