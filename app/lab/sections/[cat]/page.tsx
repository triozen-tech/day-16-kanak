import type { Metadata } from "next";
import Loader from "@/components/engine/Loader";
import SmoothScroll from "@/components/engine/SmoothScroll";
import RecordMode from "@/components/engine/RecordMode";
import "@fontsource-variable/fraunces";
import "@fontsource/instrument-serif";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/syne";
import "@fontsource-variable/manrope";
import "@/components/fx/fx.css";
import "@/components/sections/sections.css";
import { CATS } from "@/components/sections/catalog";
import { BATCHES } from "@/components/sections/batches";
import CategoryLab from "../CategoryLab";

// /lab/sections/<slug>: every SECTION-MENU layout of one category (or /lab/sections/b<N>: one build batch) (docs/SECTION-MENU.md), labelled with its code.
export const metadata: Metadata = { title: "Section lab", robots: { index: false, follow: false, nocache: true } };
export const generateStaticParams = () => [...CATS.map((c) => ({ cat: c.slug })), ...BATCHES.map((n) => ({ cat: `b${n}` }))];
export const dynamicParams = false;

export default async function Page({ params }: { params: Promise<{ cat: string }> }) {
  const { cat } = await params;
  return (
    <>
      <Loader text="Lab" enabled={false} />
      <SmoothScroll />
      <RecordMode />
      <CategoryLab slug={cat} />
    </>
  );
}
