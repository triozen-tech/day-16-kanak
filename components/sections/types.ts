import type { ComponentType } from "react";

/** One SECTION-MENU layout: code (e.g. "HR03"), name, the motion code it plays, and the section component. */
export type SectionDef = { code: string; name: string; motion: string; C: ComponentType };
