import type { Metadata } from "next";
import Loader from "@/components/engine/Loader";
import SmoothScroll from "@/components/engine/SmoothScroll";
import RecordMode from "@/components/engine/RecordMode";
import "@/components/fx/fx.css";
import LabPage from "./LabPage";

// Hidden demo page: not linked anywhere, never indexed. ?record=1 scrolls through every demo (docs/MOTION-MENU.md).
export const metadata: Metadata = {
  title: "Motion lab",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function Lab() {
  return (
    <>
      <Loader text="Lab" enabled={false} />
      <SmoothScroll />
      <RecordMode />
      <LabPage />
    </>
  );
}
