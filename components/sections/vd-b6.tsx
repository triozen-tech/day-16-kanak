"use client";

// VD · Video layouts (docs/SECTION-MENU.md), batch 6. The "video" is a moving placeholder (drifting scene + light pass +
// running progress), never an external file. The index opens its lightbox player and steps through episodes by itself
// while on screen (clicks take over); loops stop in ?static=1.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { scene } from "../fx/shared";
import { Btn, H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const VD_CSS = `.vd6-glow{background:radial-gradient(closest-side,color-mix(in srgb,var(--sx-accent) 42%,transparent),transparent);animation:vd6-glow 6s linear infinite alternate}@keyframes vd6-glow{from{translate:-26% -10%}to{translate:24% 12%}}
.vd6-light{background:linear-gradient(105deg,transparent 30%,rgba(255,236,205,.36) 48%,transparent 66%) 0 0/260% 100%;animation:vd6-light 3.8s linear infinite}@keyframes vd6-light{from{background-position:140% 0}to{background-position:-40% 0}}
.vd6-prog{transform-origin:0 50%;animation:vd6-prog 12s linear infinite}@keyframes vd6-prog{from{transform:scaleX(.06)}to{transform:scaleX(1)}}
.vd6-ring{animation:vd6-ring 1.6s cubic-bezier(0,0,.2,1) infinite}@keyframes vd6-ring{from{transform:scale(1);opacity:.6}to{transform:scale(1.7);opacity:0}}
.is-static .vd6-glow{animation:none}.is-static .vd6-light,.is-static .vd6-ring{animation:none;opacity:0}.is-static .vd6-prog{animation:none;transform:scaleX(.35)}
html.is-static {.vd6-glow{animation:none}.vd6-light,.vd6-ring{animation:none;opacity:0}.vd6-prog{animation:none;transform:scaleX(.35)}}`;

/** Running timecode while the section is on screen (a fixed value in ?static=1). */
function useTimecode(ref: React.RefObject<HTMLElement | null>, from = 48) {
  const [s, setS] = useState(from);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let t: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (e.isIntersecting) t = setInterval(() => setS((v) => (v + 1) % 600), 1000);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, [ref]);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const Play = ({ size = 76 }: { size?: number }) => (
  <span className="relative grid place-items-center" style={{ width: size, height: size }}>
    <span className="vd6-ring absolute inset-0 rounded-full border-2 border-white/70" />
    <span className="grid h-full w-full place-items-center rounded-full bg-white/90 text-[#111] shadow-[0_20px_50px_-20px_rgba(0,0,0,.6)]">
      <svg viewBox="0 0 24 24" className="ml-1 h-[34%] w-[34%]" fill="currentColor" aria-hidden>
        <path d="M7 4.5v15l12-7.5z" />
      </svg>
    </span>
  </span>
);

const EPISODES = [
  { t: "Ghee roast, the slow way", who: "with Meera Pillai", d: "2 Mar 2026", len: "18:42", i: 2 },
  { t: "One dough, four breads", who: "with Kabir Shah", d: "23 Feb 2026", len: "24:10", i: 1 },
  { t: "Sunday mutton, no shortcuts", who: "with Rohan Dutta", d: "16 Feb 2026", len: "31:05", i: 3 },
  { t: "A pickle for every month", who: "with Ira Menon", d: "9 Feb 2026", len: "15:28", i: 0 },
  { t: "Filter coffee at home", who: "with Tara Joseph", d: "2 Feb 2026", len: "11:54", i: 2 },
  { t: "Payasam three ways", who: "with Meera Pillai", d: "26 Jan 2026", len: "21:37", i: 1 },
];

/** VD11 · Video index + lightbox player: the episodes as rows (thumb, title, date, duration); one opens a centred player
 *  overlay with prev / next and a close button. The index steps through by itself. */
function VD11() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const tc = useTimecode(r, 3);
  const [ep, setEp] = useState(0);
  const [open, setOpen] = useState(true);
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    let o = true;
    const step = () => {
      o = !o;
      setOpen(o);
      if (o) setEp((v) => (v + 1) % EPISODES.length);
      t = setTimeout(step, o ? 3000 : 1500);
    };
    const io = new IntersectionObserver(([e]) => {
      clearTimeout(t);
      if (e.isIntersecting) t = setTimeout(step, 3000);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(t);
    };
  }, []);
  const e = EPISODES[ep];
  const go = (d: number) => setEp((v) => (v + d + EPISODES.length) % EPISODES.length);
  return (
    <Sec innerRef={r} theme="ink" font="editorial" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#e8774a", ["--sx-accent-text" as string]: "#1a0d07" }}>
      <style>{VD_CSS}</style>
      <div className="vd6-glow pointer-events-none absolute right-[-10%] top-[-6%] aspect-square w-[55%] rounded-full" />
      <div className="relative flex flex-wrap items-end justify-between gap-6">
        <div>
          <H className="max-w-[14ch] text-[clamp(48px,5.6vw,96px)]">Sunday Kitchen, every episode.</H>
          <P className="mt-6 max-w-[46ch]">Forty home cooks, one camera, no edits to the hard parts. A new recipe every Sunday at nine.</P>
        </div>
        <Btn kind="ghost">Get the Sunday email</Btn>
      </div>

      <div className="relative mt-[clamp(36px,4.5vw,64px)]">
        <div className="grid grid-cols-[minmax(0,1fr)] border-t border-[var(--sx-line)]">
          {EPISODES.map((x, k) => (
            <button
              key={x.t}
              type="button"
              data-m-card
              onClick={() => {
                setEp(k);
                setOpen(true);
              }}
              className={`grid grid-cols-[120px_minmax(0,1fr)_auto] items-center gap-[clamp(14px,2vw,32px)] border-b border-[var(--sx-line)] py-3 text-left transition-colors duration-500 md:grid-cols-[140px_48px_minmax(0,1fr)_150px_80px] ${k === ep ? "bg-[color-mix(in_srgb,var(--sx-accent)_12%,transparent)]" : ""}`}
            >
              <Pic i={x.i} ratio="16/10" label="" className="w-full" />
              <span className="text-[13px] tabular-nums text-[var(--sx-muted)] max-md:hidden">E{String(40 - k).padStart(2, "0")}</span>
              <span className="min-w-0">
                <span className={`block truncate text-[clamp(18px,1.6vw,24px)] font-[600] ${k === ep ? "text-[var(--sx-accent)]" : ""}`}>{x.t}</span>
                <span className="mt-1 block text-[14px] text-[var(--sx-muted)]">{x.who}</span>
              </span>
              <span className="text-[14px] text-[var(--sx-muted)] max-md:hidden">{x.d}</span>
              <span className="text-right text-[14px] tabular-nums">{x.len}</span>
            </button>
          ))}
        </div>

        {/* lightbox player */}
        <div className={`absolute inset-0 z-10 grid place-items-center transition-opacity duration-500 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}>
          <div className="absolute inset-0 bg-[color-mix(in_srgb,var(--sx-bg)_72%,transparent)] backdrop-blur-[3px]" onClick={() => setOpen(false)} />
          <div className={`relative w-[min(880px,92%)] overflow-hidden rounded-[22px] border border-white/10 bg-[var(--sx-surface)] shadow-[0_60px_120px_-40px_rgba(0,0,0,.9)] transition-transform duration-500 ${open ? "scale-100" : "scale-95"}`}>
            <div className="relative overflow-hidden">
              <div className="fx-pan">
                <Pic key={ep} i={e.i} ratio="16/9" label="" round={false} className="fx-drift" />
              </div>
              <div className="vd6-light pointer-events-none absolute inset-0" />
              <div className="absolute inset-0 grid place-items-center">
                <Play />
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-black/45 text-[18px] text-white backdrop-blur-md">
                ×
              </button>
              <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,.7))] px-5 pb-4 pt-10 text-white">
                <div className="h-[4px] overflow-hidden rounded-full bg-white/25">
                  <div className="vd6-prog h-full bg-[var(--sx-accent)]" />
                </div>
                <div className="mt-2 flex justify-between text-[13px] tabular-nums text-white/80">
                  <span>{tc}</span>
                  <span>{e.len}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <p className="truncate text-[18px] font-[650]">{e.t}</p>
                <p className="text-[14px] text-[var(--sx-muted)]">
                  {e.who} · {e.d}
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => go(-1)} className="rounded-full border border-[var(--sx-line)] px-4 py-2 text-[14px]">
                  ← Prev
                </button>
                <button type="button" onClick={() => go(1)} className="rounded-full bg-[var(--sx-accent)] px-4 py-2 text-[14px] font-[650] text-[var(--sx-accent-text)]">
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

const FEATURES = [
  { t: "Quieter than a kettle", d: "A cushioned motor base and a sealed jar keep it under 62 dB, even crushing ice.", icon: "M4 12h3l3-6 4 12 3-6h3" },
  { t: "One dial, nine programmes", d: "Smoothie, nut butter, idli batter, soup. Turn, press, walk away.", icon: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 3v6l4 2" },
  { t: "Glass jar, steel blades", d: "1.8 litres of borosilicate glass. Nothing leaches, nothing stains, nothing smells.", icon: "M7 3h10l-1 18H8L7 3zm1 6h8" },
  { t: "Cleans itself in 60 s", d: "Warm water, a drop of soap, the rinse programme. Done before your toast is.", icon: "M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z" },
];

/** VD12 · Video then feature grid: heading top-left, a full-width 16:9 video under it, then a 2×2 grid of icon + title +
 *  text features as its captions. The video opens out of its frame as it scrolls in. */
function VD12() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M13");
  const tc = useTimecode(r, 12);
  return (
    <Sec innerRef={r} theme="stone" font="wide" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#2c6c8f", ["--sx-accent-text" as string]: "#f2f8fb" }}>
      <style>{VD_CSS}</style>
      <div className="vd6-glow pointer-events-none absolute bottom-[-10%] left-[-10%] aspect-square w-[60%] rounded-full" />
      <div className="relative flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[13ch] text-[clamp(40px,4.6vw,76px)]">Meet the quietest blender.</H>
        <div className="flex flex-wrap items-center gap-5">
          <p className="text-[16px]">
            <b className="font-[650]">₹18,900</b> <span className="text-[var(--sx-muted)]">· ships in March</span>
          </p>
          <Btn>Pre-order</Btn>
        </div>
      </div>

      <div data-m-img className="relative mt-[clamp(36px,4.5vw,64px)] overflow-hidden rounded-[28px]" style={{ aspectRatio: "16/9" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={scene(3, 1600, 900, "")} alt="" className="fx-drift absolute inset-0 h-full w-full object-cover" draggable={false} />
        <div className="vd6-light pointer-events-none absolute inset-0" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,.45))]" />
        <div className="absolute inset-0 grid place-items-center">
          <Play size={96} />
        </div>
        <div className="absolute left-[clamp(16px,2vw,28px)] top-[clamp(16px,2vw,28px)] rounded-full bg-black/40 px-4 py-2 text-[13px] text-white backdrop-blur-md">Film · 2 min tour</div>
        <div className="absolute inset-x-0 bottom-0 px-[clamp(16px,2vw,28px)] pb-[clamp(14px,1.8vw,24px)] text-white">
          <div className="h-[4px] overflow-hidden rounded-full bg-white/25">
            <div className="vd6-prog h-full bg-white" />
          </div>
          <div className="mt-2 flex justify-between text-[13px] tabular-nums text-white/80">
            <span>{tc}</span>
            <span>2:04</span>
          </div>
        </div>
      </div>

      <div className="relative mt-[clamp(40px,5vw,72px)] grid grid-cols-1 gap-x-[clamp(32px,5vw,96px)] gap-y-[clamp(28px,3.5vw,52px)] md:grid-cols-2">
        {FEATURES.map((f) => (
          <div key={f.t} className="grid grid-cols-[56px_minmax(0,1fr)] gap-5 border-t border-[var(--sx-line)] pt-6">
            <span className="grid h-14 w-14 place-items-center rounded-[16px] bg-[var(--sx-accent)] text-[var(--sx-accent-text)]">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d={f.icon} />
              </svg>
            </span>
            <div>
              <p className="sx-display text-[clamp(19px,1.6vw,24px)] font-[700] leading-tight">{f.t}</p>
              <P className="mt-2 max-w-[44ch] text-[16px]">{f.d}</P>
            </div>
          </div>
        ))}
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "VD11", name: "Video index + lightbox player", motion: "M23", C: VD11 },
  { code: "VD12", name: "Video then feature grid", motion: "M13", C: VD12 },
];
