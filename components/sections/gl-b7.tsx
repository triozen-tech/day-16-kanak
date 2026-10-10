"use client";

// GL · Gallery layouts, batch 7 (docs/SECTION-MENU.md): GL32 a pinned full-bleed slideshow: each image wipes over the
// last as you scroll (a bright edge rides the wipe) and a large title swaps per image, its letters popping up out of a
// mask. Height stays ≤ 190vh. ?static=1 shows the first image + title, unpinned.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { scene } from "../fx/shared";
import { Btn, Price, Sec } from "./kit";
import type { SectionDef } from "./types";

const CSS = `.gl7kb img{animation:gl7kbs 5.6s linear infinite alternate,gl7kbt 3.3s ease-in-out infinite alternate}
@keyframes gl7kbs{from{scale:1.05}to{scale:1.18}}@keyframes gl7kbt{from{translate:-2.5% 1.2%}to{translate:2.5% -1.2%}}
.gl7glow{animation:gl7gx 6.2s linear infinite alternate,gl7gs 3.8s ease-in-out infinite alternate}
@keyframes gl7gx{from{translate:-30% 10%}to{translate:30% -8%}}@keyframes gl7gs{from{scale:.8}to{scale:1.2}}
.gl7ch{display:inline-block;animation:gl7ch .8s cubic-bezier(.16,1,.3,1) both}@keyframes gl7ch{from{translate:0 110%}to{translate:0 0}}
.gl7in{animation:gl7in .7s ease-out both}@keyframes gl7in{from{opacity:0;translate:0 12px}to{opacity:1;translate:0 0}}
html.is-static .gl7kb img,html.is-static .gl7glow,html.is-static .gl7ch,html.is-static .gl7in{animation:none}
html.is-static {.gl7kb img,.gl7glow,.gl7ch,.gl7in{animation:none}}`;

const SLIDES = [
  { t: "Zanskar", d: "Kora 800-fill down parka", p: "₹18,900", i: 3 },
  { t: "Spiti", d: "Lahaul wool-blend fleece", p: "₹7,400", i: 2 },
  { t: "Rann", d: "Salt-flat sun hoodie", p: "₹3,900", i: 0 },
  { t: "Coorg", d: "Monsoon 3-layer shell", p: "₹12,600", i: 1 },
];
const N = SLIDES.length;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (v: number) => (v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2);

function useLive() {
  const [live, setLive] = useState(false);
  useEffect(() => {
    if (!prefersReducedMotion()) setLive(true);
  }, []);
  return live;
}

/** GL32 · Section pins; full-bleed images wipe one over the next with the scroll while a large title swaps per image. */
function GL32() {
  const track = useRef<HTMLDivElement>(null);
  const layers = useRef<(HTMLDivElement | null)[]>([]);
  const edges = useRef<(HTMLSpanElement | null)[]>([]);
  const live = useLive();
  const [act, setAct] = useState(0);
  useEffect(() => {
    if (!live || !track.current) return;
    let shown = 0;
    const apply = (p: number) => {
      const f = p * (N - 1) * 1.12 - 0.06; // a short rest at both ends
      let a = 0;
      for (let k = 1; k < N; k++) {
        const e = ease(clamp01(f - (k - 1)));
        const el = layers.current[k];
        if (el) el.style.clipPath = `inset(0 0 0 ${((1 - e) * 100).toFixed(2)}%)`;
        const ed = edges.current[k];
        if (ed) {
          ed.style.left = `${((1 - e) * 100).toFixed(2)}%`;
          ed.style.opacity = e > 0.005 && e < 0.995 ? "1" : "0";
        }
        if (e > 0.5) a = k;
      }
      if (a !== shown) {
        shown = a;
        setAct(a);
      }
    };
    const st = ScrollTrigger.create({ trigger: track.current, start: "top top", end: "bottom bottom", onUpdate: (s) => apply(s.progress) });
    ScrollTrigger.refresh();
    apply(st.progress);
    return () => st.kill();
  }, [live]);
  const cur = SLIDES[act];
  return (
    <Sec theme="ink" font="condensed" full className="overflow-clip!">
      <style>{CSS}</style>
      <div ref={track} className="relative" style={{ height: live ? "190vh" : "auto" }}>
        <div className={`${live ? "sticky top-0 h-svh" : "relative h-[clamp(620px,100svh,920px)]"} overflow-hidden`}>
          {SLIDES.map((s, k) => (
            <div
              key={s.t}
              ref={(el) => {
                layers.current[k] = el;
              }}
              className="absolute inset-0 overflow-hidden"
              style={k ? { clipPath: "inset(0 0 0 100%)" } : undefined}
            >
              <div className="gl7kb absolute inset-0 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={scene(s.i, 1800, 1100, "")} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
              </div>
            </div>
          ))}
          {SLIDES.map((s, k) =>
            k ? (
              <span
                key={`e${s.t}`}
                ref={(el) => {
                  edges.current[k] = el;
                }}
                aria-hidden
                className="pointer-events-none absolute inset-y-0 w-[6px] -translate-x-1/2 bg-[var(--sx-accent)] shadow-[0_0_40px_10px_color-mix(in_srgb,var(--sx-accent)_60%,transparent)]"
                style={{ left: "100%", opacity: 0 }}
              />
            ) : null,
          )}
          <span aria-hidden className="gl7glow pointer-events-none absolute bottom-[-20%] left-[10%] h-[60%] w-[60%] rounded-full blur-[90px]" style={{ background: "radial-gradient(closest-side, color-mix(in srgb, var(--sx-accent) 45%, transparent), transparent)" }} />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(7,9,15,.5),transparent_28%,transparent_55%,rgba(7,9,15,.82))]" />

          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-6 px-[clamp(20px,5vw,96px)] pt-[clamp(28px,5vh,56px)] text-white">
            <p className="max-w-[34ch] text-[15px] text-white/80">Ridgeline · Field-tested across four Indian winters</p>
            <div className="flex gap-2" aria-hidden>
              {SLIDES.map((s, k) => (
                <span key={s.t} className={`h-[4px] rounded-full transition-all duration-500 ${k === act ? "w-10 bg-white" : "w-4 bg-white/35"}`} />
              ))}
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-6 px-[clamp(20px,5vw,96px)] pb-[clamp(28px,6vh,64px)] text-white">
            <div>
              <h2 key={cur.t} aria-label={cur.t} className="sx-display overflow-hidden pb-[0.04em] text-[clamp(96px,15vw,240px)] font-[800] uppercase leading-[0.82] tracking-[-0.01em]">
                {cur.t.split("").map((ch, k) => (
                  <span key={k} aria-hidden className={live ? "gl7ch" : "inline-block"} style={{ animationDelay: `${k * 35}ms` }}>
                    {ch}
                  </span>
                ))}
              </h2>
              <p key={`d${cur.t}`} className={`mt-4 text-[clamp(16px,1.3vw,20px)] text-white/85 ${live ? "gl7in" : ""}`}>
                {cur.d} · <Price now={cur.p} />
              </p>
            </div>
            <Btn>Shop the {cur.t} kit</Btn>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "GL32", name: "Pinned full-bleed wipe slideshow", motion: "M12", C: GL32 }];
