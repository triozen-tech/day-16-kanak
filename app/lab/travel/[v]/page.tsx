import type { Metadata } from "next";
import Loader from "@/components/engine/Loader";
import SmoothScroll from "@/components/engine/SmoothScroll";
import RecordMode from "@/components/engine/RecordMode";
import "@/components/fx/fx.css";
import TravelDemo from "./TravelDemo";

// /lab/travel/f1 · /f3 (OGL, in budget) · /f3t (three.js) · /f3r (React Three Fiber, for comparison) · /f6 — one product travels through a 6-section page (DESIGN/MOTION-MENU F1–F8).
export const metadata: Metadata = { title: "Travel lab", robots: { index: false, follow: false, nocache: true } };
export const generateStaticParams = () => ["f1", "f3", "f3t", "f3r", "f6"].map((v) => ({ v }));

export default async function Page({ params }: { params: Promise<{ v: string }> }) {
  const { v } = await params;
  return (
    <>
      <Loader text="Lab" enabled={false} />
      <SmoothScroll />
      <RecordMode />
      <TravelDemo v={v} />
    </>
  );
}
