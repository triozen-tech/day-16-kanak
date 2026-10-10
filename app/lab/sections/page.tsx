import type { Metadata } from "next";
import Link from "next/link";
import "@fontsource-variable/space-grotesk";
import { CATS } from "@/components/sections/catalog";

// /lab/sections: index of the SECTION-MENU categories; each category is its own page (/lab/sections/<slug>).
export const metadata: Metadata = { title: "Section lab", robots: { index: false, follow: false, nocache: true } };

export default function Page() {
  return (
    <main className="min-h-[100svh] bg-[#05070c] px-[clamp(20px,5vw,96px)] py-[clamp(56px,8vw,120px)] text-white">
      <p className="text-[13px] uppercase tracking-[0.2em] text-white/50">Showreel kit · hidden lab (noindex)</p>
      <h1 className="mt-4 text-[clamp(48px,7vw,112px)] font-[800] leading-[0.9] tracking-[-0.03em]" style={{ fontFamily: "Space Grotesk Variable" }}>
        Section lab
      </h1>
      <p className="mt-4 max-w-[60ch] text-white/65">Every layout in docs/SECTION-MENU.md, one page per category. Add ?static=1 for the final state, ?record=1 to auto-scroll.</p>
      <ul className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
        {CATS.map((c) => (
          <li key={c.slug}>
            <Link href={`/lab/sections/${c.slug}`} className="flex items-baseline gap-4 bg-[#05070c] px-6 py-5 transition-colors hover:bg-white/5">
              <b className="w-10 text-[#4f8dff]">{c.code}</b>
              <span className="text-[17px]">{c.name}</span>
              <span className="ml-auto text-white/40">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
