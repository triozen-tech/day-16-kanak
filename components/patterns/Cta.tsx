import type { CtaSection } from "./types";
import SplitText from "@/components/ui/SplitText";
import Button from "@/components/ui/Button";

/** Closing call-to-action. */
export default function Cta({ s }: { s: CtaSection }) {
  return (
    <section id={s.id} className="relative overflow-hidden">
      {s.image && (
        <>
          <div className="absolute inset-[-12%_0]" data-parallax="0.1">
            <img src={s.image} alt="" className="h-full w-full object-cover opacity-45" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-bg via-bg/50 to-bg" />
        </>
      )}
      <div className="container-x section-y relative flex min-h-[80vh] flex-col items-center justify-center text-center">
        {s.eyebrow && (
          <p data-reveal className="eyebrow mb-6">
            {s.eyebrow}
          </p>
        )}
        <SplitText text={s.heading} className="font-display max-w-5xl text-[clamp(48px,6.4vw,116px)]" />
        {s.text && (
          <p data-reveal className="mt-8 max-w-xl text-lg leading-relaxed text-muted">
            {s.text}
          </p>
        )}
        <div data-reveal className="mt-12">
          <Button href={s.button.href} label={s.button.label} />
        </div>
      </div>
    </section>
  );
}
