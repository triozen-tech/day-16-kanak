import type { ParallaxSection } from "./types";
import SplitText from "@/components/ui/SplitText";

/** Full-width image band that moves slower than the page, text on top. */
export default function Parallax({ s }: { s: ParallaxSection }) {
  return (
    <section id={s.id} className="relative h-[110vh] overflow-hidden">
      <div className="absolute inset-[-15%_0]" data-parallax="0.12">
        <img src={s.image} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-bg via-black/35 to-bg" />
      <div className="container-x relative flex h-full flex-col items-center justify-center text-center">
        {s.eyebrow && (
          <p data-reveal className="eyebrow mb-6">
            {s.eyebrow}
          </p>
        )}
        <SplitText text={s.heading} className="font-display max-w-5xl text-[clamp(44px,6vw,104px)]" />
        {s.text && (
          <p data-reveal className="mt-8 max-w-xl text-lg leading-relaxed text-fg/80">
            {s.text}
          </p>
        )}
      </div>
    </section>
  );
}
