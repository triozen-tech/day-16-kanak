"use client";

// VD · Video layouts (docs/SECTION-MENU.md), batch 3. Placeholders only: every "video" is a moving scene() picture
// (slow push-in, light sweep, running progress bar), never an external video. A site swaps in its own clips.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { scene } from "../fx/shared";
import { ShimmerButton } from "../fx/more";
import { Btn, H, P, Price, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const VD_CSS = `.vd3-play{animation:vd3-push var(--p,6s) ease-in-out infinite alternate}@keyframes vd3-push{from{scale:1.04;translate:-2% 0}to{scale:1.18;translate:2% -1.5%}}
.vd3-sweep{background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.2) 48%,transparent 66%) 0 0/260% 100%;animation:vd3-sweep 2.8s linear infinite}@keyframes vd3-sweep{from{background-position:130% 0}to{background-position:-30% 0}}
.vd3-bar{transform-origin:left;animation:vd3-bar var(--d,5s) linear infinite}@keyframes vd3-bar{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.is-static .vd3-play,.is-static .vd3-sweep,.is-static .vd3-bar{animation:none}
html.is-static {.vd3-play,.vd3-sweep,.vd3-bar{animation:none}}`;

/** A placeholder "muted autoplay loop": a scene that pushes in, a light sweep across it and a running progress bar. */
function Loop({ i, d = 5, bar = true, className = "" }: { i: number; d?: number; bar?: boolean; className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={scene(i, 1800, 1100, "")} alt="" className="vd3-play absolute inset-0 h-full w-full object-cover" draggable={false} />
      <div className="vd3-sweep absolute inset-0" />
      {bar && (
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/20">
          <div className="vd3-bar h-full bg-white" style={{ ["--d" as string]: `${d}s` }} />
        </div>
      )}
    </div>
  );
}

// ── VD06 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
/** VD06 · Video-to-colour fade banner: one wide band; a muted loop fills the right 60% and a gradient carries it into
 *  solid brand colour on the left, where the headline and a shimmering CTA sit. */
function VD06() {
  const accent = "#ff5a36";
  return (
    <Sec theme="paper" font="condensed" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: accent, ["--accent" as string]: "#ffd2c4" }}>
      <style>{VD_CSS}</style>
      <div className="relative isolate overflow-hidden rounded-[clamp(18px,2vw,28px)]" style={{ background: accent }}>
        <div className="absolute inset-y-0 right-0 w-[60%] max-md:w-full">
          <Loop i={2} d={6} bar={false} />
        </div>
        {/* the fade: solid colour → transparent across the seam, plus a soft bottom shade under the copy */}
        <div className="absolute inset-y-0 left-[40%] w-[34%] max-md:inset-0 max-md:left-0 max-md:w-full" style={{ background: `linear-gradient(90deg, ${accent}, color-mix(in srgb, ${accent} 70%, transparent) 40%, transparent)` }} />
        <div className="relative grid min-h-[clamp(440px,44vw,600px)] grid-cols-1 items-center md:grid-cols-12">
          <div className="p-[clamp(28px,4vw,72px)] text-[#1a0d08] md:col-span-6 lg:col-span-5">
            <p className="text-[13px] font-[700] uppercase tracking-[0.18em]">New · Kite Blood Orange</p>
            <h2 className="sx-display mt-5 text-[clamp(52px,5.6vw,96px)] font-[800] uppercase leading-[0.88] tracking-[-0.01em]">
              Run hot.
              <br />
              Stay sharp.
            </h2>
            <p className="mt-6 max-w-[36ch] text-[clamp(16px,1.2vw,19px)] leading-relaxed text-[#1a0d08]/80">160 mg natural caffeine, blood orange and sea salt. Zero sugar, no crash at kilometre thirty.</p>
            <div className="mt-9 flex flex-wrap items-center gap-6">
              <ShimmerButton className="text-[16px]">Shop the 12-pack · ₹1,380</ShimmerButton>
              <span className="text-[15px] font-[650]">
                or <Price now="₹120" /> a can
              </span>
            </div>
          </div>
        </div>
        <div className="absolute bottom-[clamp(16px,2vw,28px)] right-[clamp(16px,2vw,28px)] flex items-center gap-3 rounded-full bg-black/35 px-4 py-2 text-[13px] text-white backdrop-blur-md max-md:hidden">
          <span className="h-2 w-2 rounded-full bg-white" /> Night run, Marine Drive · 0:24 loop
        </div>
      </div>
    </Sec>
  );
}

// ── VD07 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
/** VD07 · Full-screen video with play cursor: a full-viewport muted loop with a short title bottom-left; over the
 *  video the cursor becomes a round Play label (hands-free it drifts on its own path), and a click opens the sound
 *  version full screen. The frame opens from an inset as it scrolls in. */
function VD07() {
  const r = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  useSectionMotion(r, "M13");
  useEffect(() => {
    const el = stage.current;
    const lb = label.current;
    if (!el || !lb) return;
    const ptr = { x: 0.62, y: 0.46, at: 0 };
    const move = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      ptr.x = (e.clientX - b.left) / b.width;
      ptr.y = (e.clientY - b.top) / b.height;
      ptr.at = performance.now();
    };
    el.addEventListener("pointermove", move);
    if (prefersReducedMotion()) return () => el.removeEventListener("pointermove", move);
    const cur = { x: 0.62, y: 0.46 };
    let raf = 0;
    let on = false;
    const t0 = performance.now();
    const tick = () => {
      const now = performance.now();
      const t = (now - t0) / 1000;
      const live = now - ptr.at < 1500 && !document.documentElement.classList.contains("is-recording");
      const tx = live ? ptr.x : 0.6 + Math.sin(t * 0.7) * 0.16;
      const ty = live ? ptr.y : 0.45 + Math.sin(t * 1.3) * 0.12;
      cur.x += (tx - cur.x) * 0.08;
      cur.y += (ty - cur.y) * 0.08;
      lb.style.left = `${(cur.x * 100).toFixed(2)}%`;
      lb.style.top = `${(cur.y * 100).toFixed(2)}%`;
      if (on) raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      on = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (on) raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", move);
    };
  }, []);
  return (
    <Sec innerRef={r} theme="ink" font="editorial" full>
      <style>{VD_CSS}</style>
      <div ref={stage} onClick={() => setOpen(true)} className="relative h-[clamp(620px,100svh,980px)] cursor-none">
        <div data-m-img className="absolute inset-0 overflow-hidden">
          <Loop i={3} d={9} />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(7,9,15,.25),transparent_35%,transparent_55%,rgba(7,9,15,.8))]" />
        <div ref={label} className="pointer-events-none absolute left-[62%] top-[46%] z-10 grid h-[clamp(104px,9vw,136px)] w-[clamp(104px,9vw,136px)] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#07090f] shadow-[0_20px_60px_-20px_rgba(0,0,0,.6)] backdrop-blur-md">
          <span className="flex flex-col items-center gap-1 text-[13px] font-[700] uppercase tracking-[0.16em]">
            <span className="text-[22px] leading-none">▶</span>Play
          </span>
        </div>
        <div className="pointer-events-none absolute bottom-0 left-0 z-10 p-[clamp(24px,4vw,72px)] text-white">
          <p data-m-text className="text-[13px] font-[600] uppercase tracking-[0.16em] text-white/70">A film · 1 min 48 · sound on</p>
          <H className="mt-4 max-w-[12ch] text-[clamp(52px,7vw,124px)] text-white">Monsoon, in linen.</H>
          <P className="mt-5 max-w-[40ch] text-white/75">The new washed-linen edit, shot in one wet week on the Konkan coast.</P>
        </div>
        <div className="pointer-events-none absolute bottom-0 right-0 z-10 hidden p-[clamp(24px,4vw,72px)] md:block">
          <Btn kind="ghost" className="pointer-events-auto border-white/40! text-white!">Shop the edit</Btn>
        </div>
      </div>
      {open && (
        <div role="dialog" aria-label="Film with sound" className="fixed inset-0 z-[100] grid place-items-center bg-black/90 p-[clamp(16px,4vw,64px)]" onClick={() => setOpen(false)}>
          <div className="relative aspect-video w-full max-w-[1400px] overflow-hidden rounded-[18px]">
            <Loop i={3} d={108} />
            <span className="absolute left-5 top-5 rounded-full bg-black/50 px-4 py-2 text-[13px] text-white">Sound on · 0:00 / 1:48</span>
          </div>
          <button type="button" className="absolute right-6 top-6 rounded-full bg-white px-5 py-2.5 text-[14px] font-[650] text-black">Close ✕</button>
        </div>
      )}
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "VD06", name: "Video-to-colour fade banner", motion: "M64", C: VD06 },
  { code: "VD07", name: "Full-screen video with play cursor", motion: "M13", C: VD07 },
];
