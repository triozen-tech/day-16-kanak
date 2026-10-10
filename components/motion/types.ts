import type { ComponentType } from "react";

// One MOTION-MENU code shown as a small focused demo on /lab/motion/<group>.
//  kind "play":  one screen; the motion plays by itself while on screen (record mode holds it centred for ~2.4 s)
//  kind "scrub": a 220vh panel with a sticky stage; the motion follows the scroll (use useScrub from components/fx/shared)
export type MotionDef = { code: string; name: string; how: string; kind: "play" | "scrub"; C: ComponentType };
