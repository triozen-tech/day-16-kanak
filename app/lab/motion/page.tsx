import type { Metadata } from "next";
import Link from "next/link";
import "@fontsource-variable/space-grotesk";
import { MGROUPS } from "@/components/motion/catalog";

// /lab/motion: index of the motion groups; each is its own page (/lab/motion/<slug>). Older codes (M1–M74, X1–X18) live at /lab.
export const metadata: Metadata = { title: "Motion lab", robots: { index: false, follow: false, nocache: true } };

export default function Page() {
  return (
    <main className="min-h-[100svh] bg-[#05080f] px-[clamp(20px,5vw,96px)] py-[clamp(56px,8vw,120px)] text-white">
      <p className="text-[13px] uppercase tracking-[0.2em] text-white/50">Showreel kit · hidden lab (noindex)</p>
      <h1 className="mt-4 text-[clamp(48px,7vw,112px)] font-[800] leading-[0.9] tracking-[-0.03em]" style={{ fontFamily: "Space Grotesk Variable" }}>
        Motion lab
      </h1>
      <p className="mt-4 max-w-[60ch] text-white/65">New motions from docs/MOTION-MENU.md, one page per group. The first codes (M1–M74, X1–X18) are at /lab. Add ?static=1 for the final state, ?record=1 to auto-scroll.</p>
      <ul className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
        {MGROUPS.map((g) => (
          <li key={g.slug}>
            <Link href={`/lab/motion/${g.slug}`} className="flex items-baseline gap-4 bg-[#05080f] px-6 py-5 transition-colors hover:bg-white/5">
              <b className="w-8 text-[#4f8dff]">{g.codes}</b>
              <span className="text-[17px]">{g.name}</span>
              <span className="ml-auto text-white/40">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
