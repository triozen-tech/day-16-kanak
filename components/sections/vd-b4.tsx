"use client";

// VD · Video layouts (docs/SECTION-MENU.md), batch 4. Placeholders only: every "video" is a moving scene() picture
// (slow push-in, light sweep, running progress bar), never an external video. A site swaps in its own clips.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { scene } from "../fx/shared";
import { H, P, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const VD_CSS = `.vd4-play{animation:vd4-push var(--p,6s) ease-in-out infinite alternate;animation-delay:var(--dl,0s)}@keyframes vd4-push{from{scale:1.04;translate:-2.5% 0}to{scale:1.2;translate:2.5% -2%}}
.vd4-sweep{background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.2) 48%,transparent 66%) 0 0/260% 100%;animation:vd4-sweep var(--s,2.8s) linear infinite;animation-delay:var(--dl,0s)}@keyframes vd4-sweep{from{background-position:130% 0}to{background-position:-30% 0}}
.vd4-bar{transform-origin:left;animation:vd4-bar var(--d,5s) linear infinite}@keyframes vd4-bar{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.vd4-ring{animation:vd4-ring 1.8s ease-out infinite}@keyframes vd4-ring{from{transform:scale(1);opacity:.7}to{transform:scale(1.7);opacity:0}}
.is-static .vd4-play,.is-static .vd4-sweep,.is-static .vd4-bar,.is-static .vd4-ring{animation:none}.is-static .vd4-ring{opacity:0}
html.is-static {.vd4-play,.vd4-sweep,.vd4-bar,.vd4-ring{animation:none}.vd4-ring{opacity:0}}`;

/** A placeholder "muted autoplay loop": a scene that pushes in, a light sweep across it and an optional progress bar. */
function Loop({ i, p = 6, s = 2.8, dl = 0, bar = false, w = 1800, h = 1100 }: { i: number; p?: number; s?: number; dl?: number; bar?: boolean; w?: number; h?: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ ["--p" as string]: `${p}s`, ["--s" as string]: `${s}s`, ["--dl" as string]: `${dl}s` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={scene(i, w, h, "")} alt="" className="vd4-play absolute inset-0 h-full w-full object-cover" draggable={false} />
      <div className="vd4-sweep absolute inset-0" />
      {bar && (
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/20">
          <div className="vd4-bar h-full bg-white" style={{ ["--d" as string]: `${p}s` }} />
        </div>
      )}
    </div>
  );
}

const Tri = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path d="M7 4.5v15l13-7.5z" fill="currentColor" />
  </svg>
);

// ── VD08 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
/** VD08 · Thumbnail that opens a video modal: centred heading and lede over a wide rounded 16:9 poster with a big play
 *  button; opening slides a full-size dark player up over the section (it closes back down). Plays once by itself. */
function VD08() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M13");
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    let done = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || done) return;
        done = true;
        timers.push(setTimeout(() => setOpen(true), 1300));
        timers.push(setTimeout(() => setOpen(false), 4300));
      },
      { threshold: 0.55 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);
  return (
    <Sec innerRef={r} theme="paper" font="editorial" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#7a3b52" }}>
      <style>{VD_CSS}</style>
      <div className="mx-auto max-w-[820px] text-center">
        <H className="text-[clamp(48px,6vw,100px)]">One night in Kannauj.</H>
        <P className="mx-auto mt-6 max-w-[50ch]">How rain-soaked earth becomes mitti attar: copper stills, sandalwood oil and a family that has distilled it for six generations.</P>
      </div>
      <button
        type="button"
        data-m-img
        onClick={() => setOpen(true)}
        aria-label="Play the film"
        className="group relative mx-auto mt-[clamp(40px,5vw,72px)] block aspect-video w-full max-w-[1100px] overflow-hidden rounded-[clamp(18px,2vw,28px)] shadow-[0_40px_90px_-30px_rgba(40,20,10,.55)]"
      >
        <Loop i={1} p={7} />
        <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(10,6,4,.55))]" />
        <span className="absolute left-1/2 top-1/2 grid h-[clamp(88px,8vw,120px)] w-[clamp(88px,8vw,120px)] -translate-x-1/2 -translate-y-1/2 place-items-center">
          <span className="vd4-ring absolute inset-0 rounded-full border-2 border-white/70" />
          <span className="relative grid h-full w-full place-items-center rounded-full bg-white/90 pl-1 text-[var(--sx-accent)] backdrop-blur-md transition-transform duration-300 group-hover:scale-105">
            <Tri size={34} />
          </span>
        </span>
        <span className="absolute bottom-5 left-6 flex items-center gap-3 text-left text-white">
          <span className="text-[13px] font-[700] uppercase tracking-[0.16em]">Brand film</span>
          <span className="text-[15px] tabular-nums text-white/75">2:14</span>
        </span>
      </button>

      {/* the player: slides up over the whole section, closes back down */}
      <div aria-hidden={!open} className={`absolute inset-0 z-20 flex flex-col bg-[#0b0709] px-[clamp(20px,5vw,96px)] py-[clamp(24px,3vw,44px)] text-white transition-transform duration-[800ms] ease-[cubic-bezier(.7,0,.2,1)] ${open ? "translate-y-0" : "pointer-events-none translate-y-full"}`}>
        <div className="flex items-center justify-between">
          <p className="text-[15px]">
            <b className="font-[650]">One night in Kannauj</b> <span className="text-white/55">· Brand film · 2:14</span>
          </p>
          <button type="button" onClick={() => setOpen(false)} className="grid h-11 w-11 place-items-center rounded-full border border-white/25 text-[20px]" aria-label="Close the film">
            ×
          </button>
        </div>
        <div className="relative mt-6 min-h-0 w-full flex-1 overflow-hidden rounded-[16px]">
          <Loop i={1} p={5} s={2.2} bar />
        </div>
        <div className="mt-5 flex items-center gap-4 text-[14px] tabular-nums text-white/70">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#0b0709]">
            <span className="flex gap-[3px]">
              <span className="h-3 w-[3px] bg-current" />
              <span className="h-3 w-[3px] bg-current" />
            </span>
          </span>
          <span>0:12 / 2:14</span>
          <span className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/20">
            <span className="vd4-bar block h-full bg-[#e0a8bc]" style={{ ["--d" as string]: "9s" }} />
          </span>
          <span>CC · HD</span>
        </div>
      </div>
    </Sec>
  );
}

// ── VD09 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const PLATES = [
  { t: "Hand-pulled biang noodles", p: "₹420", note: "Chilli oil, black vinegar", i: 2 },
  { t: "Brown-butter croissant", p: "₹260", note: "72 layers, laminated daily", i: 1 },
  { t: "Charred corn, lime leaf", p: "₹340", note: "Off the binchotan grill", i: 3 },
  { t: "Kokum & tonic spritz", p: "₹380", note: "Poured, never shaken", i: 0 },
];

/** VD09 · Looping plate clips row: four portrait tiles in a row, each a short silent loop of one dish being made, with
 *  its name and price below. */
function VD09() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  return (
    <Sec innerRef={r} theme="ink" font="serif" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#e7a95b" }}>
      <style>{VD_CSS}</style>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[12ch] text-[clamp(48px,5.6vw,92px)]">Plates in motion.</H>
        <P className="max-w-[38ch] pb-2">Four things we make by hand every service, filmed at the pass. Order them at the counter or book the chef&apos;s table.</P>
      </div>
      <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 gap-[clamp(14px,1.6vw,24px)] md:grid-cols-4">
        {PLATES.map((x, k) => (
          <article key={x.t} data-m-card>
            <div className="relative aspect-[3/4.4] overflow-hidden rounded-[var(--sx-radius,18px)]">
              <Loop i={x.i} p={4.5 + k * 0.8} s={2.3 + k * 0.35} dl={-k * 0.9} bar w={900} h={1300} />
              <span className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/45 px-3 py-1.5 text-[12px] font-[600] text-white backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--sx-accent)]" />
                Loop · 0:0{6 + k}
              </span>
            </div>
            <div className="mt-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="sx-display text-[clamp(20px,1.6vw,26px)] font-[600] leading-[1.15]">{x.t}</h3>
                <p className="mt-1 text-[14px] text-[var(--sx-muted)]">{x.note}</p>
              </div>
              <b className="shrink-0 pt-1 text-[17px] font-[650] tabular-nums">{x.p}</b>
            </div>
          </article>
        ))}
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "VD08", name: "Thumbnail that opens a video modal", motion: "M13", C: VD08 },
  { code: "VD09", name: "Looping plate clips row", motion: "M34", C: VD09 },
];
