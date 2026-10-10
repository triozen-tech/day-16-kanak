"use client";

// GL · Gallery layouts (docs/SECTION-MENU.md). Each is a full designed section; motion via useSectionMotion or fx.
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { scene, useScrub, useTicker } from "../fx/shared";
import { SplitOpposite } from "../fx/layout";
import { Btn, H, P, Pic, Price, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Endless sideways drift for a row whose children are listed twice (M44): calm idle speed, faster while scrolling. */
function useDrift(root: React.RefObject<HTMLDivElement | null>, row: React.RefObject<HTMLDivElement | null>, dir = 1, speed = 40) {
  const vel = useRef(0);
  const x = useRef(0);
  useScrub(root, (_, v) => (vel.current = Math.abs(v)), { finalValue: 0 });
  useTicker(root, (_, dt) => {
    const el = row.current;
    if (!el) return;
    vel.current *= 0.94;
    const half = el.scrollWidth / 2;
    x.current = (((x.current - dir * dt * speed * (1 + vel.current * 6)) % half) - half) % half;
    el.style.transform = `translate3d(${x.current}px,0,0)`;
  });
}

/** Cycles 0..n-1 every `ms` while the element is on screen (hands-free); stays on 0 in ?static=1. */
function useAutoCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms: number) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let id = 0;
    const io = new IntersectionObserver(([e]) => {
      window.clearInterval(id);
      if (e.isIntersecting) id = window.setInterval(() => setI((v) => (v + 1) % n), ms);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearInterval(id);
    };
  }, [ref, n, ms]);
  return [i, setI] as const;
}

/** GL01 · Masonry gallery: three columns of mixed-ratio photos drifting at different speeds as you scroll. */
function GL01() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M32");
  const cols = [
    [{ i: 3, ratio: "3/4", l: "SAND" }, { i: 1, ratio: "1/1", l: "" }, { i: 2, ratio: "4/5", l: "CLAY" }],
    [{ i: 0, ratio: "4/5", l: "" }, { i: 2, ratio: "3/4", l: "OLIVE" }, { i: 3, ratio: "1/1", l: "" }],
    [{ i: 1, ratio: "2/3", l: "CHALK" }, { i: 0, ratio: "1/1", l: "" }, { i: 2, ratio: "3/4", l: "" }],
  ];
  return (
    <Sec innerRef={r} theme="ink" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[12ch] text-[clamp(48px,6vw,104px)]">The summer linen lookbook.</H>
        <div className="max-w-[34ch] pb-2">
          <P>Shot over three days on the Konkan coast. Every piece washed twice, so it is soft from the first wear.</P>
          <div className="mt-6">
            <Btn kind="link">Shop the looks →</Btn>
          </div>
        </div>
      </div>
      <div className="mt-[clamp(48px,7vw,104px)] grid grid-cols-2 gap-[clamp(12px,1.8vw,24px)] md:grid-cols-3">
        {cols.map((c, k) => (
          <div key={k} data-m-col className={`flex flex-col gap-[clamp(12px,1.8vw,24px)] ${k === 1 ? "mt-[12%]" : ""} ${k === 2 ? "max-md:hidden" : ""}`}>
            {c.map((p, j) => (
              <Pic key={j} i={p.i} ratio={p.ratio} label={p.l} />
            ))}
          </div>
        ))}
      </div>
    </Sec>
  );
}

/** GL02 · Filmstrip: one long row of product photos drifting sideways forever, faster while the page scrolls. */
const SHOES = [
  { n: "Tempo Runner", c: "Chalk / Rust", p: "₹8,499", i: 0, ratio: "4/5" },
  { n: "Ghat Trail", c: "Moss", p: "₹9,999", i: 2, ratio: "1/1" },
  { n: "Court 72", c: "Bone", p: "₹6,999", i: 1, ratio: "4/5" },
  { n: "Monsoon Mid", c: "Graphite", p: "₹10,499", i: 3, ratio: "3/4" },
  { n: "Easy Slip", c: "Sand", p: "₹4,999", i: 2, ratio: "4/5" },
  { n: "Tempo Racer", c: "Lime", p: "₹11,999", i: 0, ratio: "1/1" },
];
function GL02() {
  const r = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);
  useDrift(r, row, 1, 46);
  return (
    <Sec innerRef={r} theme="stone" font="condensed" full className="py-[clamp(72px,9vw,140px)]">
      <div className="flex flex-wrap items-end justify-between gap-6 px-[clamp(20px,5vw,96px)]">
        <H className="text-[clamp(52px,7vw,124px)]">Fresh off the last.</H>
        <div className="flex items-center gap-4 pb-2">
          <P className="max-w-[30ch]">Six new pairs for the monsoon season. Grippy, light, quick to dry.</P>
          <Btn kind="ghost" className="shrink-0">View all</Btn>
        </div>
      </div>
      <div className="mt-[clamp(40px,5vw,72px)] overflow-hidden">
        <div ref={row} className="flex w-max items-end will-change-transform">
          {[...SHOES, ...SHOES].map((s, k) => (
            <figure key={k} className="w-[clamp(234px,24.6vw,384px)] shrink-0 pl-[clamp(14px,1.6vw,24px)]">
              <Pic i={s.i} ratio={s.ratio} round={false} className="rounded-[6px]" />
              <figcaption className="mt-3 flex items-baseline justify-between gap-3 text-[14px]">
                <span>
                  <b className="font-[650]">{s.n}</b> <span className="text-[var(--sx-muted)]">· {s.c}</span>
                </span>
                <Price now={s.p} />
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </Sec>
  );
}

/** GL03 · Main image + thumbnail strip: the big picture swaps by itself every few seconds (thumbs also click). */
const ROOMS = [
  { n: "Teak Lounge Chair", m: "Solid teak, handwoven cane back", p: "₹38,500", i: 2 },
  { n: "Low Oak Console", m: "White oak, brass pulls", p: "₹54,000", i: 3 },
  { n: "Halo Floor Lamp", m: "Linen shade, walnut stem", p: "₹16,900", i: 0 },
  { n: "Kora Daybed", m: "Mango wood, cotton slub cushion", p: "₹72,000", i: 1 },
];
function GL03() {
  const r = useRef<HTMLDivElement>(null);
  const [on, setOn] = useAutoCycle(r, ROOMS.length, 2800);
  useSectionMotion(r, "M13");
  const cur = ROOMS[on];
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <div className="grid grid-cols-1 gap-[clamp(28px,4vw,64px)] md:grid-cols-12 md:items-end">
        <div className="relative md:col-span-8">
          <div className="relative aspect-[4/3] max-md:aspect-[4/5]">
            {ROOMS.map((room, k) => (
              <div key={room.n} className="absolute inset-0 transition-opacity duration-700 ease-out" style={{ opacity: k === on ? 1 : 0 }}>
                <Pic i={room.i} ratio="auto" className="h-full w-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="md:col-span-4">
          <H className="text-[clamp(40px,4.2vw,72px)]">Rooms that slow you down.</H>
          <div key={on} className="mt-8 border-t border-[var(--sx-line)] pt-5 [animation:gl03in_.6s_ease-out]">
            <p className="sx-display text-[clamp(22px,1.8vw,28px)]">{cur.n}</p>
            <p className="mt-1 text-[15px] text-[var(--sx-muted)]">{cur.m}</p>
            <Price now={cur.p} className="mt-3 text-[18px]" />
          </div>
          <div className="mt-8 grid grid-cols-4 gap-3">
            {ROOMS.map((room, k) => (
              <button key={room.n} type="button" onClick={() => setOn(k)} aria-label={room.n} className={`relative overflow-hidden rounded-[10px] outline-offset-2 transition-[outline-color,opacity] duration-500 ${k === on ? "opacity-100 outline outline-2 outline-[var(--sx-accent)]" : "opacity-55 outline outline-2 outline-transparent"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={scene(room.i, 400, 400)} alt="" className="aspect-square w-full object-cover" draggable={false} />
              </button>
            ))}
          </div>
          <div className="mt-8">
            <Btn>Shop the room</Btn>
          </div>
        </div>
      </div>
      <style>{`@keyframes gl03in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}`}</style>
    </Sec>
  );
}

/** GL04 · Social grid: handle + follow button, six square posts that snap into the grid from different sides. */
const POSTS = [
  { i: 1, likes: "2.4k" },
  { i: 3, likes: "1.8k" },
  { i: 0, likes: "3.1k" },
  { i: 2, likes: "986" },
  { i: 3, likes: "4.2k" },
  { i: 1, likes: "1.2k" },
];
function GL04() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  return (
    <Sec innerRef={r} theme="ink" font="wide" className="py-[clamp(72px,9vw,140px)]">
      <div className="mx-auto max-w-[1120px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <H className="text-[clamp(40px,4.8vw,80px)]">Your skin, unfiltered.</H>
            <P className="mt-4 max-w-[40ch]">Real routines from 48,000 of you. Tag us to be featured next week.</P>
          </div>
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--sx-accent)] text-[15px] font-[800] text-[var(--sx-accent-text)]">dl</span>
            <div className="leading-tight">
              <p className="text-[16px] font-[700]">@yourbrand.studio</p>
              <p className="text-[13px] text-[var(--sx-muted)]">48.2k followers</p>
            </div>
            <Btn className="ml-2">Follow</Btn>
          </div>
        </div>
        <div className="mt-[clamp(36px,5vw,64px)] grid grid-cols-3 gap-[clamp(6px,1vw,14px)]">
          {POSTS.map((p, k) => (
            <div key={k} data-m-card className="group relative">
              <Pic i={p.i} ratio="1/1" className="rounded-[10px]" />
              <span className="absolute bottom-2 left-2 rounded-full bg-black/45 px-2.5 py-1 text-[12px] font-[600] text-white backdrop-blur-sm transition-opacity group-hover:opacity-100 md:opacity-0">♥ {p.likes}</span>
            </div>
          ))}
        </div>
      </div>
    </Sec>
  );
}

/** GL05 · Polaroid scatter: white-framed photos, slightly rotated, with handwritten captions; they tilt up from depth. */
const SHOTS = [
  { i: 2, c: "First flush, Darjeeling", rot: -5, y: "md:mt-10" },
  { i: 0, c: "Ma's kitchen, 6 am", rot: 3, y: "" },
  { i: 3, c: "Withering racks", rot: -2, y: "md:mt-16" },
  { i: 1, c: "The tasting table", rot: 6, y: "md:mt-4" },
  { i: 2, c: "Monsoon picking", rot: -4, y: "md:mt-12" },
];
function GL05() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M31");
  return (
    <Sec innerRef={r} theme="paper" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <div className="text-center">
        <H className="mx-auto max-w-[14ch] text-[clamp(44px,5.6vw,96px)]">Postcards from the estate.</H>
        <P className="mx-auto mt-5 max-w-[46ch]">A season of tea, in pictures we took between pickings.</P>
      </div>
      <div className="mt-[clamp(40px,6vw,88px)] grid grid-cols-2 gap-x-4 gap-y-8 md:flex md:justify-center md:gap-0">
        {SHOTS.map((s, k) => (
          <div key={k} data-m-card className={`md:-mx-3 md:w-[clamp(200px,19vw,290px)] ${s.y} ${k === 4 ? "max-md:col-span-2 max-md:mx-auto max-md:w-[60%]" : ""}`}>
            <figure className="bg-white p-[clamp(8px,0.9vw,14px)] pb-0 shadow-[0_18px_40px_-18px_rgba(0,0,0,.35)] transition-transform duration-500 hover:rotate-0" style={{ transform: `rotate(${s.rot}deg)` }}>
              {/* plain img (not Pic): the tilt-in moves the whole polaroid, not the photo inside it again */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={scene(s.i, 800, 800)} alt="" className="aspect-square w-full object-cover" draggable={false} />
              <figcaption className="py-[clamp(10px,1.2vw,18px)] text-center font-[Instrument_Serif,Georgia,serif] text-[clamp(16px,1.5vw,22px)] italic text-[#2a241c]">{s.c}</figcaption>
            </figure>
          </div>
        ))}
      </div>
    </Sec>
  );
}

/** GL06 · Split opposite scroll: copy on the left, two photo columns moving in opposite directions on the right. */
function GL06() {
  const r = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!r.current || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-m-head], [data-m-text], .gl06-cta", { y: 26, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, scrollTrigger: { trigger: r.current, start: "top 75%", toggleActions: "play none none reverse" } });
    }, r);
    return () => ctx.revert();
  }, []);
  return (
    <Sec innerRef={r} theme="ink" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <div className="grid grid-cols-1 gap-[clamp(32px,5vw,80px)] md:grid-cols-12 md:items-center">
        <div className="md:col-span-5">
          <H className="text-[clamp(44px,5.2vw,88px)]">Sound you can see.</H>
          <P className="mt-6 max-w-[40ch]">Aluminium cups, lambskin pads, 40 hours on one charge. Photographed in the homes of the people who wear them.</P>
          <div className="gl06-cta mt-9 flex flex-wrap items-center gap-5">
            <Btn>Shop Halo One</Btn>
            <span className="text-[15px] text-[var(--sx-muted)]">
              from <Price now="₹24,990" className="text-[var(--sx-text)]" />
            </span>
          </div>
        </div>
        <div className="h-[clamp(520px,80vh,820px)] overflow-hidden rounded-[var(--sx-radius)] border border-[var(--sx-line)] md:col-span-7 max-md:h-[68svh]">
          <SplitOpposite />
        </div>
      </div>
    </Sec>
  );
}

export const GALLERY: SectionDef[] = [
  { code: "GL01", name: "Masonry drift gallery", motion: "M32", C: GL01 },
  { code: "GL02", name: "Filmstrip drift", motion: "M44", C: GL02 },
  { code: "GL03", name: "Main image + thumbnails (auto-cycles)", motion: "M13", C: GL03 },
  { code: "GL04", name: "Social grid", motion: "M34", C: GL04 },
  { code: "GL05", name: "Polaroid scatter", motion: "M31", C: GL05 },
  { code: "GL06", name: "Split opposite scroll", motion: "M42", C: GL06 },
];
