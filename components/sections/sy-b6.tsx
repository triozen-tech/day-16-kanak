"use client";

// SY · Story layouts, batch 6 (docs/SECTION-MENU.md): SY15 a narrow list of collaborations (emblem, name + role,
// dates) where one row at a time expands its description on its own (M23), SY16 a vertical timeline with round
// markers on a line, each entry with dates, title, text, bullets and sometimes a link card (M34). ?static=1 shows
// the first row open and every timeline entry in place.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { scene } from "../fx/shared";
import { Btn, H, P, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** True once we know motion is allowed (false on the server, in ?static=1 and with reduced motion). */
function useLive() {
  const [live, setLive] = useState(false);
  useEffect(() => {
    if (!prefersReducedMotion()) setLive(true);
  }, []);
  return live;
}

/** Calls `fn` every `ms` while `ref` is on screen (never in ?static=1). */
function useEvery(ref: React.RefObject<HTMLElement | null>, ms: number, fn: () => void) {
  const cb = useRef(fn);
  useEffect(() => {
    cb.current = fn;
  });
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let t: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (e.isIntersecting) t = setInterval(() => cb.current(), ms);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, [ref, ms]);
}

const CSS = `.sy6glow{animation:sy6g 8s linear infinite alternate}
@keyframes sy6g{from{translate:-30% -20%}to{translate:30% 25%}}
.sy6bar{transform-origin:left;animation:sy6p var(--d) linear both}
@keyframes sy6p{from{scale:0 1}to{scale:1 1}}
.sy6pulse{animation:sy6run 4.2s linear infinite}
@keyframes sy6run{from{top:-12%}to{top:100%}}
.sy6ring{animation:sy6r 2s ease-out infinite}
@keyframes sy6r{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--sx-accent) 55%,transparent)}100%{box-shadow:0 0 0 14px transparent}}
.sy6kb img{animation:sy6k 4.4s linear infinite alternate}
@keyframes sy6k{from{scale:1.05;translate:-3% 0}to{scale:1.2;translate:3% 0}}
html.is-static .sy6glow,html.is-static .sy6bar,html.is-static .sy6pulse,html.is-static .sy6ring,html.is-static .sy6kb img{animation:none}
html.is-static {.sy6glow,.sy6bar,.sy6pulse,.sy6ring,.sy6kb img{animation:none}}`;

/* ───────────────────────────── SY15 · Logo-led expandable history ───────────────────────────── */

const WORK = [
  { m: "Kc", n: "Kiln & Co", r: "Stoneware lamp bases, 400 numbered pieces", y: "2025 – now", d: "We drew the shade, they threw the base. Each lamp pairs a hand-glazed Khurja foot with our cane drum, wired in our Jodhpur workshop." },
  { m: "Hy", n: "Halcyon Hotels", r: "Lobby and 62 rooms, Udaipur", y: "2023 – 2025", d: "Teak lounge chairs, writing desks and a 9-metre reception counter, all finished in a low-sheen oil that ages with the lake light." },
  { m: "Md", n: "Meridia Textiles", r: "Upholstery in handwoven khadi", y: "2022 – 2024", d: "Three seasons of sofa covers woven on pit looms in Ponduru, dyed with indigo and pomegranate rind. Washable, and made to be re-covered." },
  { m: "Aw", n: "Arcwell Studio", r: "Co-designed the Low Arc bench", y: "2021 – 2022", d: "A single steam-bent ash plank on two forged feet. Still our best seller, still made by the same two carpenters." },
  { m: "Sl", n: "Solano Library", r: "Reading room, 1,200 sq ft", y: "2019 – 2021", d: "Shelving, long tables and lamp posts for a public reading room in Pondicherry, built to survive salt air and a lot of elbows." },
];
const N15 = WORK.length;

/** SY15 · Rows of round emblem · name + role · date range; one row at a time opens its description (auto-cycles, click takes over). */
function SY15() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const live = useLive();
  const [open, setOpen] = useState(0);
  useEvery(r, 2400, () => setOpen((v) => (v + 1) % N15));
  return (
    <Sec innerRef={r} theme="stone" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <style>{CSS}</style>
      <div aria-hidden className="sy6glow pointer-events-none absolute right-[0%] top-[0%] h-full w-[64%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_34%,transparent),transparent)]" />
      <div className="relative grid grid-cols-1 gap-[clamp(40px,5vw,96px)] md:grid-cols-12">
        <div className="md:col-span-4">
          <H className="text-[clamp(48px,5.4vw,92px)]">Made with good company.</H>
          <P className="mt-6 max-w-[34ch]">Tarang Furniture has worked with potters, weavers, hotels and one very patient library. A few of the people who shaped us.</P>
          <div className="mt-8">
            <Btn kind="ghost">Start a commission</Btn>
          </div>
        </div>
        <ul className="border-t border-[var(--sx-line)] md:col-span-7 md:col-start-6">
          {WORK.map((w, k) => {
            const on = k === open;
            return (
              <li key={w.n} className="relative border-b border-[var(--sx-line)]">
                <button type="button" onClick={() => setOpen(k)} className="grid w-full grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-x-5 py-5 text-left">
                  <span className={`grid h-14 w-14 place-items-center rounded-full border transition-colors duration-500 ${on ? "border-[var(--sx-accent)] bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "border-[var(--sx-line)] bg-[var(--sx-surface)]"}`}>
                    <span className="sx-display text-[22px] leading-none">{w.m}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[clamp(18px,1.5vw,22px)] font-[650]">{w.n}</span>
                    <span className="block truncate text-[15px] text-[var(--sx-muted)]">{w.r}</span>
                  </span>
                  <span className="text-right text-[15px] tabular-nums text-[var(--sx-muted)]">{w.y}</span>
                </button>
                <div className="grid transition-[grid-template-rows] duration-700 ease-[cubic-bezier(.22,1,.36,1)]" style={{ gridTemplateRows: on ? "1fr" : "0fr" }}>
                  <div className="overflow-hidden">
                    <p className="max-w-[56ch] pb-6 pl-[76px] text-[16px] leading-relaxed text-[var(--sx-muted)]">{w.d}</p>
                  </div>
                </div>
                {on && live && <span key={`b${open}`} className="sy6bar absolute bottom-[-1px] left-0 h-[2px] w-full bg-[var(--sx-accent)]" style={{ ["--d" as string]: "2.4s" }} />}
              </li>
            );
          })}
        </ul>
      </div>
    </Sec>
  );
}

/* ───────────────────────────── SY16 · Vertical timeline with logo markers ───────────────────────────── */

const STEPS = [
  {
    m: "S2",
    y: "Mar 2026 – now",
    t: "A listening room in Bengaluru",
    d: "Studio Two opened on Church Street: a treated room, three speaker pairs and coffee on the house. Bring your own records.",
    b: ["Free 40-minute sessions, by booking", "Trade-in desk for old headphones"],
    link: { t: "Book a listening session", s: "quietform.example/studio", i: 3 },
  },
  {
    m: "Kc",
    y: "2024 – 2025",
    t: "Walnut cabinets with Kiln & Co",
    d: "Our first bookshelf speaker, the Q-Shelf, in solid walnut boxes joined by hand. 600 pairs, each signed inside.",
    b: ["Sold out in 11 days", "Restock waitlist: 2,300"],
  },
  {
    m: "Q1",
    y: "2022",
    t: "The Q1 headphone ships",
    d: "Two years of prototypes for a headphone you can open with one screwdriver. Every part is sold on its own, forever.",
    b: ["Replaceable pads, cable, battery", "₹24,900, 5-year warranty"],
    link: { t: "Read the Q1 teardown", s: "quietform.example/q1", i: 1 },
  },
  {
    m: "Qf",
    y: "2019",
    t: "A repair bench in Indiranagar",
    d: "Quietform began as two people fixing other brands' headphones. The repair logbook became our first design brief.",
    b: ["4,100 repairs in the first year"],
  },
];

/** SY16 · One column: round markers on a vertical line, each with a date range, title, paragraph, bullets and an optional link card with thumbnail. */
function SY16() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  return (
    <Sec innerRef={r} theme="paper" font="wide" className="py-[clamp(72px,9vw,140px)]">
      <style>{CSS}</style>
      <div aria-hidden className="sy6glow pointer-events-none absolute left-[-10%] top-[10%] h-[80%] w-[60%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_32%,transparent),transparent)]" />
      <div className="relative grid grid-cols-1 gap-[clamp(40px,5vw,96px)] md:grid-cols-12">
        <div className="md:col-span-4">
          <div className="md:sticky md:top-24">
            <H className="text-[clamp(40px,4vw,68px)]">Seven years of listening.</H>
            <P className="mt-6 max-w-[32ch]">From a repair bench to a listening room: how Quietform got here, and who helped.</P>
            <div className="mt-8">
              <Btn>Shop headphones</Btn>
            </div>
          </div>
        </div>
        <ol className="relative md:col-span-8">
          <span aria-hidden className="absolute bottom-6 left-[27px] top-6 w-px overflow-hidden bg-[var(--sx-line)]">
            <span className="sy6pulse absolute left-0 h-[22%] w-full bg-[linear-gradient(180deg,transparent,var(--sx-accent),transparent)]" />
          </span>
          {STEPS.map((s, k) => (
            <li key={s.t} data-m-card className="relative grid grid-cols-[56px_minmax(0,1fr)] gap-x-[clamp(18px,2vw,32px)] pb-[clamp(36px,4vw,56px)] last:pb-0">
              <span className={`relative z-10 grid h-14 w-14 place-items-center rounded-full border border-[var(--sx-line)] ${k === 0 ? "sy6ring bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "bg-[var(--sx-surface)]"}`}>
                <span className="text-[15px] font-[750]">{s.m}</span>
              </span>
              <div className="pt-1">
                <p className="text-[14px] tabular-nums text-[var(--sx-muted)]">{s.y}</p>
                <h3 className="sx-display mt-1 text-[clamp(22px,2vw,30px)] font-[700] leading-tight">{s.t}</h3>
                <p className="mt-3 max-w-[58ch] text-[16px] leading-relaxed text-[var(--sx-muted)]">{s.d}</p>
                <ul className="mt-4 space-y-1.5">
                  {s.b.map((b) => (
                    <li key={b} className="flex items-center gap-3 text-[15px]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--sx-accent)]" />
                      {b}
                    </li>
                  ))}
                </ul>
                {s.link && (
                  <a href="#" onClick={(e) => e.preventDefault()} data-cursor="Open" className="sx-card mt-5 flex max-w-[460px] items-center gap-4 p-3 pr-5">
                    <span className="sy6kb relative h-16 w-24 shrink-0 overflow-hidden rounded-[10px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={scene(s.link.i, 480, 320, "")} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-[650]">{s.link.t}</span>
                      <span className="block truncate text-[13px] text-[var(--sx-muted)]">{s.link.s}</span>
                    </span>
                    <span aria-hidden className="text-[18px]">→</span>
                  </a>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "SY15", name: "Logo-led expandable history", motion: "M23", C: SY15 },
  { code: "SY16", name: "Vertical timeline with logo markers", motion: "M34", C: SY16 },
];
