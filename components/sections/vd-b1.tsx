"use client";

// VD · Video / scroll-film layouts (docs/SECTION-MENU.md), batch 1. Placeholders only: the "film" is drawn from
// scene() + Product so the gallery never depends on a day's frames. A site swaps in its own frames (lib/film.ts).
import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";
import { scene } from "../fx/shared";
import { Btn, H, P, Pic, Price, Product, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** VD01 · Pinned frame-scrub with segment cards: a full-viewport film scrubs with the scroll; per segment a small
 *  glass card fades in at its own spot (left / right) with a step title and a line, then leaves. */
function VD01() {
  const r = useRef<HTMLDivElement>(null);
  const tall = useRef<HTMLDivElement>(null);
  const can = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  useSectionMotion(r, "M13");
  const FRAMES = 144;
  const segs = [
    { t: "Cold-pressed citrus", d: "Whole Nagpur oranges and lime, pressed the morning they arrive.", c: "md:left-[6%] md:top-[40%]" },
    { t: "A pinch of sea salt", d: "Electrolytes from Kutch salt, so the lift doesn't dry you out.", c: "md:right-[6%] md:top-[30%]" },
    { t: "160 mg, from green tea", d: "Natural caffeine that climbs slowly and lands softly.", c: "md:left-[8%] md:bottom-[10%]" },
    { t: "Zero sugar finish", d: "Sweetened with a touch of stevia leaf. Nine calories a can.", c: "md:right-[8%] md:bottom-[20%]" },
  ];
  const [seg, setSeg] = useState(-1); // -1 = static: every card shows
  const [angle, setAngle] = useState(1);
  useEffect(() => {
    const el = tall.current;
    if (!el || prefersReducedMotion()) return;
    setSeg(0);
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        const p = self.progress;
        const f = Math.min(FRAMES, Math.round(p * (FRAMES - 1)) + 1);
        if (counter.current) counter.current.textContent = String(f).padStart(3, "0");
        if (bar.current) bar.current.style.transform = `scaleX(${p})`;
        if (can.current) gsap.set(can.current, { scale: 0.86 + p * 0.3, y: `${(0.5 - p) * 8}%`, rotation: -6 + p * 12 });
        if (glow.current) gsap.set(glow.current, { xPercent: -30 + p * 60, opacity: 0.55 + Math.sin(p * Math.PI) * 0.45 });
        setAngle(Math.min(3, Math.floor(p * 4)));
        setSeg(Math.min(segs.length - 1, Math.floor(p * segs.length)));
      },
    });
    return () => st.kill();
  }, [segs.length]);
  return (
    <Sec innerRef={r} theme="ink" font="condensed" full style={{ overflow: "clip" }}>
      <div ref={tall} className="relative md:h-[240vh]">
        <div className="relative h-[100svh] min-h-[620px] overflow-hidden md:sticky md:top-0">
          <div data-m-img className="absolute inset-0 overflow-hidden">
            <div className="fx-drift absolute inset-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={scene(0, 1600, 1000, "")} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" draggable={false} />
            </div>
            <div ref={glow} className="absolute left-1/2 top-1/2 aspect-square w-[70vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_55%,transparent),transparent)]" />
            <div ref={can} className="absolute inset-0 grid place-items-center">
              <Product angle={angle} accent="#ff8a3d" className="fx-drift h-[min(70vh,640px)] w-auto max-md:h-[46svh]" />
            </div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(7,9,15,.7))]" />
          </div>
          <div className="absolute left-[clamp(20px,5vw,96px)] top-[clamp(28px,5vw,64px)] z-10">
            <H className="max-w-[12ch] text-[clamp(40px,4.6vw,76px)]">Inside one orange can.</H>
          </div>
          <div className="relative z-10 flex flex-col gap-3 px-5 pt-[34svh] md:static md:p-0">
            {segs.map((s, k) => {
              const on = seg === -1 || seg === k;
              return (
                <div
                  key={s.t}
                  className={`w-[min(100%,340px)] rounded-[16px] border border-white/15 bg-white/[0.07] p-5 backdrop-blur-xl transition-[opacity,transform] duration-700 ease-out md:absolute ${s.c} ${on ? "opacity-100 translate-y-0" : "pointer-events-none translate-y-4 opacity-0"}`}
                >
                  <p className="text-[12px] font-[600] uppercase tracking-[0.16em] text-[var(--sx-accent)]">Step {k + 1} of 4</p>
                  <p className="sx-display mt-2 text-[clamp(24px,2vw,32px)] leading-none">{s.t}</p>
                  <p className="mt-2 text-[15px] leading-relaxed text-white/70">{s.d}</p>
                </div>
              );
            })}
          </div>
          <div className="absolute inset-x-[clamp(20px,5vw,96px)] bottom-[clamp(20px,3vw,40px)] z-10 flex items-center gap-5 text-[13px] tabular-nums text-white/70">
            <span>
              FRAME <span ref={counter}>{String(FRAMES).padStart(3, "0")}</span> / {FRAMES}
            </span>
            <span className="relative h-px flex-1 bg-white/20">
              <span ref={bar} className="absolute inset-0 origin-left bg-[var(--sx-accent)]" />
            </span>
            <span>Citrus Kite · 250 ml · <Price now="₹120" className="text-white" /></span>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/** VD02 · Scroll-expanding media window (mid-page): a landscape film card (~30% wide) sits between the two halves of
 *  the title; the scroll grows it to full screen while the halves slide apart to the edges. Never as the hero. */
function VD02() {
  const r = useRef<HTMLDivElement>(null);
  const tall = useRef<HTMLDivElement>(null);
  const media = useRef<HTMLDivElement>(null);
  const left = useRef<HTMLSpanElement>(null);
  const right = useRef<HTMLSpanElement>(null);
  const foot = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = tall.current;
    if (!el || prefersReducedMotion() || !window.matchMedia("(min-width: 768px)").matches) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: true, invalidateOnRefresh: true } });
      // start: halves hug the small card (card 30vw wide, 2vw gap); end: the halves rest at the screen edges
      const startX = (side: HTMLElement, dir: 1 | -1) => () => {
        // offsetLeft/offsetWidth ignore transforms, so a refresh mid-scrub measures the resting position
        const w = side.parentElement!.clientWidth;
        const cardHalf = window.innerWidth * 0.17;
        return dir === -1 ? w / 2 - cardHalf - (side.offsetLeft + side.offsetWidth) : w / 2 + cardHalf - side.offsetLeft;
      };
      tl.fromTo(media.current, { width: "30vw", height: "38vh", borderRadius: 22 }, { width: "100%", height: "100%", borderRadius: 0, duration: 1 }, 0)
        .fromTo(left.current, { x: startX(left.current!, -1) }, { x: 0, duration: 1 }, 0)
        .fromTo(right.current, { x: startX(right.current!, 1) }, { x: 0, duration: 1 }, 0)
        .fromTo(foot.current, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.25 }, 0.75);
    }, el);
    return () => ctx.revert();
  }, []);
  return (
    <Sec innerRef={r} theme="stone" font="editorial" full style={{ overflow: "clip" }}>
      <div ref={tall} className="relative md:h-[220vh]">
        <div className="relative h-[100svh] min-h-[620px] overflow-hidden md:sticky md:top-0">
          <div ref={media} className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 overflow-hidden bg-[#0b1020]">
            <div className="fx-pan absolute -inset-[4%]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={scene(3, 1600, 1000, "")} alt="" className="h-full w-full object-cover" draggable={false} />
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,9,15,.15),rgba(7,9,15,.55))]" />
            <span className="absolute left-1/2 top-1/2 grid size-[clamp(56px,6vw,88px)] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-white/10 backdrop-blur-md">
              <svg viewBox="0 0 24 24" className="ml-1 size-[38%] fill-white" aria-hidden>
                <path d="M6 4l14 8-14 8z" />
              </svg>
            </span>
          </div>
          <span ref={left} className="sx-display absolute left-[clamp(20px,4vw,72px)] top-1/2 z-10 -translate-y-1/2 whitespace-nowrap text-[clamp(52px,8.4vw,150px)] leading-none text-white mix-blend-difference">
            Arrive
          </span>
          <span ref={right} className="sx-display absolute right-[clamp(20px,4vw,72px)] top-1/2 z-10 -translate-y-1/2 whitespace-nowrap text-[clamp(52px,8.4vw,150px)] italic leading-none text-white mix-blend-difference">
            unhurried
          </span>
          <div ref={foot} className="absolute inset-x-[clamp(20px,4vw,72px)] bottom-[clamp(24px,4vw,56px)] z-10 flex flex-wrap items-end justify-between gap-6 text-white">
            <div>
              <p className="text-[13px] uppercase tracking-[0.16em] text-white/65">Ridge House · a two-minute film</p>
              <p className="mt-2 max-w-[38ch] text-[17px] leading-relaxed text-white/85">Nine rooms on a pine ridge, wood-fired breakfasts and nothing on the schedule.</p>
            </div>
            <div className="flex items-center gap-5">
              <p className="text-[15px]">
                From <Price now="₹14,500" /> a night
              </p>
              <Btn>Check dates</Btn>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/** VD03 · Sticky video chapters: a full-viewport stage stays put while chapter text scrolls past on the left; the
 *  background film swaps chapter by chapter with a crossfade (layers stacked by z). */
function VD03() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const ch = [
    { i: 2, place: "Coonoor, 1,850 m", t: "Picked before the mist lifts.", d: "Two leaves and a bud, plucked by hand between six and nine, while the bushes are still cold." },
    { i: 3, place: "The withering loft", t: "Rested for eighteen hours.", d: "Spread thin on jute racks under a slow fan, until each leaf bends without breaking." },
    { i: 0, place: "Our tasting room", t: "Cupped, then sealed.", d: "Every lot is tasted three times before it goes into a nitrogen-flushed tin. ₹680 for 100 g." },
  ];
  const [on, setOn] = useState(0);
  useEffect(() => {
    const els = Array.from(r.current?.querySelectorAll<HTMLElement>("[data-chapter]") ?? []);
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setOn(Number((e.target as HTMLElement).dataset.chapter))), { rootMargin: "-45% 0px -45% 0px" });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
  return (
    <Sec innerRef={r} theme="ink" font="serif" full style={{ overflow: "clip" }}>
      <div className="relative">
        <div className="sticky top-0 h-[100svh] min-h-[620px] overflow-hidden">
          {ch.map((c, k) => (
            <div key={k} className="absolute inset-0 transition-opacity duration-[1100ms] ease-out" style={{ opacity: on === k ? 1 : 0, zIndex: on === k ? 2 : 1 }}>
              <div className="fx-pan absolute -inset-[4%]">
                <Pic i={c.i} ratio="auto" round={false} className="absolute inset-0 h-full w-full" />
              </div>
            </div>
          ))}
          <div className="absolute inset-0 z-[3] bg-[linear-gradient(90deg,rgba(7,9,15,.88),rgba(7,9,15,.35)_55%,rgba(7,9,15,.1))]" />
          <div className="absolute bottom-[clamp(24px,4vw,56px)] right-[clamp(20px,5vw,96px)] z-[4] flex items-center gap-3 text-[13px] text-white/75">
            <span className="size-2 animate-pulse rounded-full bg-[var(--sx-accent)]" />
            Now playing · {ch[on].place}
          </div>
        </div>
        <div className="relative z-10 -mt-[100svh] px-[clamp(20px,5vw,96px)]">
          <div className="flex min-h-[70svh] items-center pt-[12svh]">
            <H className="max-w-[12ch] text-[clamp(48px,6vw,104px)] text-white">From slope to steep.</H>
          </div>
          {ch.map((c, k) => (
            <div key={k} data-chapter={k} className="flex min-h-[85svh] items-center">
              <div className={`max-w-[460px] transition-opacity duration-700 ${on === k ? "opacity-100" : "opacity-40"}`}>
                <p className="text-[13px] uppercase tracking-[0.16em] text-[var(--sx-accent)]">{c.place}</p>
                <p data-m-text className="sx-display mt-4 text-[clamp(34px,3.4vw,56px)] leading-[1.02] text-white">{c.t}</p>
                <P className="mt-5 text-white/75">{c.d}</P>
              </div>
            </div>
          ))}
          <div className="flex min-h-[40svh] items-center pb-[10svh]">
            <Btn>Shop the first flush</Btn>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "VD01", name: "Pinned frame-scrub with segment cards", motion: "M13", C: VD01 },
  { code: "VD02", name: "Scroll-expanding media window (mid-page)", motion: "M42", C: VD02 },
  { code: "VD03", name: "Sticky video chapters", motion: "M23", C: VD03 },
];
