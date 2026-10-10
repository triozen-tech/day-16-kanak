"use client";

import dynamic from "next/dynamic";
import TravelPage from "@/components/fx/travel/TravelPage";
import ObjectPNG from "@/components/fx/travel/ObjectPNG";

// the 3D versions are loaded only on their own pages (never in any other bundle)
const Object3D = dynamic(() => import("@/components/fx/travel/Object3D"), { ssr: false });
const Object3DOGL = dynamic(() => import("@/components/fx/travel/Object3DOGL"), { ssr: false });
const Object3DLite = dynamic(() => import("@/components/fx/travel/Object3DLite"), { ssr: false });
const ObjectModelViewer = dynamic(() => import("@/components/fx/travel/ObjectModelViewer"), { ssr: false });

const VERSIONS = {
  f1: { title: "F1 waypoint travel · PNG", note: "F1 · F7 · F8", Layer: ObjectPNG },
  f3: { title: "F3 3D travel + F2 turn · OGL (in budget)", note: "F2 · F3 · F7 · F8", Layer: Object3DOGL },
  f3t: { title: "F3 3D travel · plain three.js (compare)", note: "F2 · F3 · F7 · F8 · three", Layer: Object3DLite },
  f3r: { title: "F3 3D travel · React Three Fiber (over budget, compare)", note: "F2 · F3 · F7 · F8 · R3F", Layer: Object3D },
  f6: { title: "F6 model-viewer orbit", note: "F6 · F7 · F8", Layer: ObjectModelViewer },
} as const;

export default function TravelDemo({ v }: { v: string }) {
  const cfg = VERSIONS[(v as keyof typeof VERSIONS) in VERSIONS ? (v as keyof typeof VERSIONS) : "f1"];
  return <TravelPage title={cfg.title} note={cfg.note} Layer={(p) => <cfg.Layer {...p} />} />;
}
