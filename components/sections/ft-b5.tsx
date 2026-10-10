"use client";

// FT · Feature layouts, batch 5 (FT21–FT23). Each is a full designed section; motion via useSectionMotion plus a small
// hands-free loop so it never freezes on camera. ?static=1 shows the final state.
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Pic, Price, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Runs `fn` every `ms` while the element is on screen (stops off screen and in ?static=1 / reduced motion). */
function useOnScreenInterval(ref: React.RefObject<HTMLElement | null>, ms: number, fn: () => void) {
  const cb = useRef(fn);
  cb.current = fn;
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

/** Scrubbed vertical drift of one element (a column / picture) against the scroll. */
function useScrollDrift(root: React.RefObject<HTMLElement | null>, target: React.RefObject<HTMLElement | null>, from: number, to: number) {
  useEffect(() => {
    const el = root.current;
    const t = target.current;
    if (!el || !t || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(t, { y: from }, { y: to, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
    }, el);
    return () => ctx.revert();
  }, [root, target, from, to]);
}

/* ───────────────────────── FT21 · Staggered icon-card grid ───────────────────────── */

const FT21_ICONS: Record<string, React.ReactNode> = {
  breath: <path d="M4 12c3-5 5-5 8 0s5 5 8 0M4 17c3-5 5-5 8 0s5 5 8 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />,
  moon: <path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />,
  pulse: <path d="M3 12h4l2-5 4 10 2-5h6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />,
  leaf: <path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14zm0 0l7-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />,
  sun: <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" /></g>,
  bell: <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />,
};

const FT21_COLS = [
  [
    { ic: "breath", t: "Breath, guided", d: "Four-minute pranayama sessions that slow your heart rate before a meeting." },
    { ic: "sun", t: "Morning flows", d: "Twenty-minute yoga sequences that change with the season and your sleep." },
  ],
  [
    { ic: "moon", t: "Sleep stories", d: "Narrated walks through Coorg and the Nilgiris, timed to fade at lights-out." },
    { ic: "leaf", t: "Ayurvedic meals", d: "Weekly plans by your dosha, with a shopping list for the local market." },
  ],
  [
    { ic: "pulse", t: "Stress score", d: "Your watch measures heart-rate variability; Prana tells you when to rest." },
    { ic: "bell", t: "Gentle nudges", d: "One reminder a day, never more. Turn it off for weekends with a tap." },
  ],
];

/** FT21 · Three columns of icon cards (icon left, title + text right); the middle column sits half a card lower so the
 *  grid reads as a staggered stack. Cards snap in from different sides (M34); the middle column drifts with the scroll
 *  and the highlight walks from card to card on its own. */
function FT21() {
  const r = useRef<HTMLDivElement>(null);
  const mid = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  useScrollDrift(r, mid, 40, -40);
  const [on, setOn] = useState(1);
  useOnScreenInterval(r, 1500, () => setOn((v) => (v + 1) % 6));
  return (
    <Sec innerRef={r} theme="paper" font="grotesk" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#3f6b4f", ["--sx-accent-text" as string]: "#f4efe6" }}>
      {/* a large soft glow drifts linearly behind the grid so the section never sits still on camera */}
      <style>{`.ft21-glow{animation:ft21-glow 5.5s linear infinite alternate}@keyframes ft21-glow{from{transform:translate(-18%,-10%) scale(.9)}to{transform:translate(22%,14%) scale(1.15)}}html.is-static .ft21-glow{animation:none}html.is-static {.ft21-glow{animation:none}}`}</style>
      <div aria-hidden className="ft21-glow pointer-events-none absolute left-[20%] top-[25%] aspect-square w-[46vw] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_38%,transparent),transparent)]" />
      <div className="grid grid-cols-1 items-end gap-[clamp(24px,4vw,64px)] md:grid-cols-12">
        <H className="text-[clamp(40px,5vw,84px)] md:col-span-7">Calm, built into your day.</H>
        <div className="md:col-span-5 md:pb-2">
          <P>Prana is a yoga and recovery app made with teachers from Rishikesh and Mysuru. Six small habits, one quiet screen.</P>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Btn>Start free for 14 days</Btn>
            <span className="text-[14px] text-[var(--sx-muted)]">then ₹299 a month</span>
          </div>
        </div>
      </div>
      <div className="mt-[clamp(48px,6vw,88px)] grid grid-cols-1 gap-[clamp(14px,1.6vw,22px)] md:grid-cols-3">
        {FT21_COLS.map((col, c) => (
          <div key={c} ref={c === 1 ? mid : undefined} className={`flex flex-col gap-[clamp(14px,1.6vw,22px)] ${c === 1 ? "md:mt-[clamp(90px,9vw,130px)]" : ""}`}>
            {col.map((x, k) => {
              const idx = c * 2 + k;
              const hot = idx === on;
              return (
                <article
                  key={x.t}
                  data-m-card
                  className={`sx-card flex gap-5 p-[clamp(22px,2.2vw,32px)] transition-colors duration-700 ${hot ? "bg-[var(--sx-accent)]! text-[var(--sx-accent-text)]" : ""}`}
                >
                  <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl transition-colors duration-700 ${hot ? "bg-white/15" : "bg-[color-mix(in_srgb,var(--sx-accent)_12%,transparent)] text-[var(--sx-accent)]"}`}>
                    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
                      {FT21_ICONS[x.ic]}
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[clamp(19px,1.5vw,23px)] font-[700] leading-tight">{x.t}</h3>
                    <p className={`mt-2 text-[15px] leading-relaxed transition-colors duration-700 ${hot ? "text-[color-mix(in_srgb,var(--sx-accent-text)_80%,transparent)]" : "text-[var(--sx-muted)]"}`}>{x.d}</p>
                  </div>
                </article>
              );
            })}
          </div>
        ))}
      </div>
    </Sec>
  );
}

/* ───────────────────────── FT22 · Narrow caption beside a 1:3 panorama ───────────────────────── */

const FT22_CSS = `
.ft22-pan{animation:ft22-pan 9s linear infinite alternate}
@keyframes ft22-pan{from{translate:0 0}to{translate:-15% 0}}
.ft22-sheen{animation:ft22-sheen 3.4s linear infinite}
@keyframes ft22-sheen{from{transform:translateX(-60%) skewX(-12deg)}to{transform:translateX(520%) skewX(-12deg)}}
html.is-static .ft22-pan,html.is-static .ft22-sheen{animation:none}
html.is-static .ft22-sheen{opacity:0}
html.is-static {.ft22-pan,.ft22-sheen{animation:none}.ft22-sheen{opacity:0}}
`;

/** FT22 · A four-column row: one narrow column holds the heading and text (vertically centred), the other three hold a
 *  single wide panorama. The panorama settles from zoomed inside an opening frame (M13) and keeps panning slowly. */
function FT22() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M13");
  return (
    <Sec innerRef={r} theme="stone" font="serif" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#7a2e3a" }}>
      <style>{FT22_CSS}</style>
      <div className="grid grid-cols-1 items-center gap-[clamp(28px,3.4vw,56px)] md:grid-cols-4">
        <div className="md:col-span-1">
          <H className="text-[clamp(36px,3.4vw,56px)] font-[500] leading-[1]">Forty acres of slow wine.</H>
          <P className="mt-5 text-[16px]!">Shiraz and Chenin on red laterite above the Krishna, picked by hand at dawn in February.</P>
          <div className="mt-7">
            <Btn kind="link">Book a tasting →</Btn>
          </div>
          <p className="mt-4 text-[14px] text-[var(--sx-muted)]">
            Cellar tour + 5 wines · <Price now="₹1,800" className="text-[var(--sx-text)]" />
          </p>
        </div>
        <div className="relative aspect-[2.8/1] min-h-[260px] overflow-hidden rounded-[var(--sx-radius)] md:col-span-3">
          <div className="ft22-pan absolute inset-y-0 left-0 w-[118%]">
            <Pic i={2} ratio="auto" round={false} label="" className="absolute inset-0 h-full w-full" />
          </div>
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="ft22-sheen absolute inset-y-0 left-0 w-[18%] bg-[linear-gradient(90deg,transparent,rgba(255,236,210,.24),transparent)]" />
          </div>
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-2 p-[clamp(14px,1.6vw,24px)]">
            {["Block A · Shiraz", "Block C · Chenin", "Cellar, 1998"].map((t) => (
              <span key={t} className="rounded-full bg-black/40 px-4 py-2 text-[13px] text-white backdrop-blur-md">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 border-t border-[var(--sx-line)] md:grid-cols-4">
        {[
          ["640 m", "above sea level"],
          ["12", "wines a vintage"],
          ["1998", "first harvest"],
          ["Sat–Sun", "tastings, 11 am to 5 pm"],
        ].map(([a, b], k) => (
          <div key={a} className={`py-6 ${k ? "md:border-l md:border-[var(--sx-line)] md:pl-8" : ""}`}>
            <p className="sx-display text-[clamp(26px,2.2vw,36px)]">{a}</p>
            <p className="mt-1 text-[14px] text-[var(--sx-muted)]">{b}</p>
          </div>
        ))}
      </div>
    </Sec>
  );
}

/* ───────────────────────── FT23 · Copy + offset portrait pair ───────────────────────── */

const FT23_CSS = `
.ft23-kb{animation:ft23-kb var(--d,5s) ease-in-out infinite alternate}
@keyframes ft23-kb{from{scale:1.03;translate:-2% 2%}to{scale:1.15;translate:2% -3%}}
html.is-static .ft23-kb{animation:none}
html.is-static {.ft23-kb{animation:none}}
`;

const FT23_PICS = [
  { i: 1, cap: "Moonstone mug", price: "₹1,200", d: "4.6s" },
  { i: 3, cap: "Rust bowl", price: "₹1,850", d: "6.1s" },
];

/** FT23 · Two columns: heading and two paragraphs left; right, two tall portraits side by side, the second pushed down
 *  ~48px and drifting at a different scroll speed. The portraits curtain-open (M1), then breathe on different periods. */
function FT23() {
  const r = useRef<HTMLDivElement>(null);
  const second = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M1");
  useScrollDrift(r, second, 30, -50);
  return (
    <Sec innerRef={r} theme="ink" font="editorial" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#d98b5f" }}>
      <style>{FT23_CSS}</style>
      <div className="grid grid-cols-1 items-center gap-[clamp(40px,6vw,96px)] md:grid-cols-12">
        <div className="md:col-span-5">
          <H className="max-w-[12ch] text-[clamp(42px,4.8vw,80px)] font-[500]">Thrown on the wheel, by hand.</H>
          <P className="mt-7 max-w-[42ch]">Every piece starts as a kilo of red clay from the Pondicherry coast, centred and pulled by one of our four potters.</P>
          <P className="mt-4 max-w-[42ch]">Glazed in ash and iron, fired twice to 1,240°C. No two pieces leave the kiln the same, so yours is the only one.</P>
          <div className="mt-9 flex flex-wrap items-center gap-6">
            <Btn>Shop tableware</Btn>
            <Btn kind="link">Visit the studio →</Btn>
          </div>
        </div>
        <div className="grid grid-cols-2 items-start gap-[clamp(12px,1.6vw,24px)] md:col-span-7">
          {FT23_PICS.map((p, k) => (
            <div key={p.cap} ref={k ? second : undefined} className={k ? "mt-12" : ""}>
              <div className="relative aspect-[3/4.4] overflow-hidden rounded-[var(--sx-radius)]">
                <div className="ft23-kb absolute inset-0" style={{ ["--d" as string]: p.d }}>
                  <Pic i={p.i} ratio="auto" round={false} label="" className="absolute inset-0 h-full w-full" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between gap-3 text-[15px]">
                <span>{p.cap}</span>
                <Price now={p.price} className="text-[var(--sx-muted)]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "FT21", name: "Staggered icon-card grid", motion: "M34", C: FT21 },
  { code: "FT22", name: "Narrow caption beside a 1:3 panorama", motion: "M13", C: FT22 },
  { code: "FT23", name: "Copy + offset portrait pair", motion: "M1", C: FT23 },
];
