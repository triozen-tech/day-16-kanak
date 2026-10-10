"use client";

import { useEffect } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import type { SectionDef } from "@/components/sections/types";
import { CATS } from "@/components/sections/catalog";

// The page frame of one /lab/sections/<slug> category: intro, every layout labelled with its code + motion, end card.
export default function LabShell({ slug, defs }: { slug: string; defs: SectionDef[] }) {
  const batch = slug.match(/^b(\d+)$/)?.[1];
  const cat = batch ? { code: `B${batch}`, name: `Batch ${batch}` } : CATS.find((c) => c.slug === slug);
  useEffect(() => {
    if (prefersReducedMotion()) document.documentElement.classList.add("is-static");
  }, []);
  return (
    <main className="bg-[#05070c] text-white">
      <section className="lab-intro relative grid h-[100svh] place-items-center overflow-hidden px-6 text-center" data-record-time="0.6" data-record-label={cat?.code ?? "Sections"}>
        <div className="lab-glow pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative">
          <p className="text-[13px] uppercase tracking-[0.2em] text-white/50">Section lab · {cat?.code} (noindex)</p>
          <h1 className="mt-4 font-[800] text-[clamp(52px,8vw,128px)] leading-[0.9] tracking-[-0.03em]" style={{ fontFamily: "Space Grotesk Variable" }}>
            {cat?.name ?? "Sections"}
          </h1>
          <p className="mx-auto mt-4 max-w-[52ch] text-white/65">{defs.length} layouts from docs/SECTION-MENU.md, each a real designed section with its motion code.</p>
        </div>
      </section>
      {defs.map(({ code, name, motion, C }) => (
        <section key={code} id={code.toLowerCase()} data-record-time="2.2" data-record-align="center" data-record-label={code}>
          <div className="flex items-center gap-3 border-t border-white/10 bg-[#05070c] px-[clamp(20px,5vw,96px)] py-2.5 text-[12px] text-white/60">
            <b className="text-[#4f8dff]">{code}</b>
            <span>{name}</span>
            <span className="ml-auto">motion {motion}</span>
          </div>
          <C />
        </section>
      ))}
      <section className="relative grid h-[50svh] place-items-center overflow-hidden" data-record-time="1.2" data-record-align="bottom" data-record-label="End">
        {/* two loops with different periods (pan + drift) so the closing frame never sits still on camera */}
        <div className="fx-pan pointer-events-none absolute inset-[-6%]" aria-hidden>
          <div className="lab-glow absolute inset-0" />
        </div>
        <p className="fx-drift relative text-[clamp(32px,5vw,72px)] font-[800]">End of {cat?.name ?? "section"} lab</p>
      </section>
    </main>
  );
}
