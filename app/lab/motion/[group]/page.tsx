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
import { MGROUPS } from "@/components/motion/catalog";
import { MBATCHES } from "@/components/motion/batches";
import GroupLab from "../GroupLab";

// /lab/motion/<group>: every new MOTION-MENU code of one group as a small live demo (or /lab/motion/b<N>: one build batch).
export const metadata: Metadata = { title: "Motion lab", robots: { index: false, follow: false, nocache: true } };
export const generateStaticParams = () => [...MGROUPS.map((g) => ({ group: g.slug })), ...MBATCHES.flatMap((n) => [`b${n}`, `b${n}h1`, `b${n}h2`].map((group) => ({ group })))];
export const dynamicParams = false;

export default async function Page({ params }: { params: Promise<{ group: string }> }) {
  const { group } = await params;
  return (
    <>
      <Loader text="Lab" enabled={false} />
      <SmoothScroll />
      <RecordMode />
      <GroupLab slug={group} />
    </>
  );
}
