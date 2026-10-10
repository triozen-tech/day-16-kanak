"use client";

// JR · Journal layouts (docs/SECTION-MENU.md), batch 5. Both play by themselves while on screen (a category walks
// through the sidebar; an excerpt opens into its article in place); a click or hover takes over. Loops stop in
// ?static=1 (the plain list shows).
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Hands-free cycling: steps an index every `ms` while the section is on screen (stops off screen and in ?static=1). */
function useAutoCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms = 1600) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let t: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (e.isIntersecting) t = setInterval(() => setI((v) => (v + 1) % n), ms);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, [ref, n, ms]);
  return [i, setI] as const;
}

const JR_CSS = `.jr5-bar{transform-origin:0 50%;animation:jr5-bar 1.9s linear both}@keyframes jr5-bar{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.jr5-caret{animation:jr5-caret .8s steps(1) infinite}@keyframes jr5-caret{50%{opacity:0}}
.jr5-read{animation:jr5-read 7s linear both}@keyframes jr5-read{from{transform:translateY(0)}to{transform:translateY(-140px)}}
.jr5-sheen{background:linear-gradient(105deg,transparent 35%,color-mix(in srgb,var(--sx-accent) 30%,transparent) 50%,transparent 65%) 0 0/260% 100%;animation:jr5-sheen 3s linear infinite}@keyframes jr5-sheen{from{background-position:140% 0}to{background-position:-40% 0}}
.is-static .jr5-bar,.is-static .jr5-caret,.is-static .jr5-read{animation:none}.is-static .jr5-sheen{animation:none;opacity:0}
html.is-static {.jr5-bar,.jr5-caret,.jr5-read{animation:none}.jr5-sheen{animation:none;opacity:0}}`;

/* ── JR10 ─────────────────────────────────────────────────────────────── */

const CATS = ["All stories", "Food trails", "Coastal stays", "Hill towns", "City guides", "Slow travel"];
const COUNTS = [24, 6, 5, 4, 5, 4];
const POSTS = [
  { cat: 1, title: "Breakfast on the Konkan coast", ex: "Ukdiche modak at dawn, kokum sherbet by noon, and the family kitchens that still cook over wood.", meta: "8 min read · 2 Oct" },
  { cat: 2, title: "A week of slow tides in Gokarna", ex: "Our cliff rooms, an empty beach at five, and the fishermen who taught us to read the swell.", meta: "6 min read · 26 Sep" },
  { cat: 3, title: "Mist, tea and a narrow-gauge train", ex: "Three days above the clouds in a hill town that still runs on hand-written timetables.", meta: "10 min read · 19 Sep" },
  { cat: 4, title: "Forty-eight hours in old Hyderabad", ex: "Biryani at midnight, bangles at noon, and a rooftop where the call to prayer comes from four sides.", meta: "7 min read · 11 Sep" },
  { cat: 5, title: "Letters from a houseboat", ex: "Nine days on the backwaters with no plan, one good book and a cook named Thomas.", meta: "12 min read · 3 Sep" },
];

/** Types a word in letter by letter (whole word in ?static=1). */
function useTyped(word: string) {
  const [n, setN] = useState(word.length);
  useEffect(() => {
    if (prefersReducedMotion()) return setN(word.length);
    setN(0);
    const t = setInterval(() => setN((v) => (v >= word.length ? (clearInterval(t), v) : v + 1)), 55);
    return () => clearInterval(t);
  }, [word]);
  return word.slice(0, n);
}

/** JR10 · Sticky category sidebar + wide cards: the left 3 columns hold a sticky category list and a search field; the
 *  right 9 stack the articles as wide horizontal cards (image left, text right). Lines mask-slide in. */
function JR10() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const [step, setStep] = useAutoCycle(r, CATS.length - 1, 1900);
  const cat = step + 1; // the cycle walks the real categories (index 1…5)
  const typed = useTyped(CATS[cat].toLowerCase());
  return (
    <Sec innerRef={r} theme="stone" font="editorial" className="overflow-clip! py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#0f6f78", ["--sx-accent-text" as string]: "#effbfc" }}>
      <style>{JR_CSS}</style>
      <div className="grid grid-cols-1 gap-[clamp(32px,4vw,72px)] md:grid-cols-12">
        <aside className="self-start md:sticky md:top-[clamp(24px,6vh,72px)] md:col-span-3">
          <H className="text-[clamp(44px,4.4vw,72px)]">Field notes.</H>
          <P className="mt-4">Stories from the road, written by the people who run our houses.</P>
          <label className="mt-8 flex items-center gap-3 rounded-full border border-[var(--sx-line)] bg-[var(--sx-surface)] px-4 py-3 text-[15px]">
            <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-[var(--sx-muted)]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="9" cy="9" r="6" />
              <path d="M14 14l4 4" strokeLinecap="round" />
            </svg>
            <span className="min-w-0 truncate">
              {typed}
              <span className="jr5-caret ml-px inline-block h-[1.05em] w-[2px] translate-y-[3px] bg-[var(--sx-accent)]" />
            </span>
          </label>
          <ul className="mt-6 border-t border-[var(--sx-line)]">
            {CATS.map((c, k) => {
              const on = k === cat;
              return (
                <li key={c} className="border-b border-[var(--sx-line)]">
                  <button type="button" onClick={() => k > 0 && setStep(k - 1)} className={`relative flex w-full items-center justify-between py-3.5 text-left text-[16px] transition-colors duration-300 ${on ? "font-[650] text-[var(--sx-accent)]" : "text-[var(--sx-text)]"}`}>
                    <span className="flex items-center gap-3">
                      <span className={`h-2 w-2 rounded-full transition-colors duration-300 ${on ? "bg-[var(--sx-accent)]" : "bg-[var(--sx-line)]"}`} />
                      {c}
                    </span>
                    <span className="text-[13px] tabular-nums text-[var(--sx-muted)]">{COUNTS[k]}</span>
                    {on && <span key={`b${step}`} className="jr5-bar absolute inset-x-0 -bottom-px h-[4px] bg-[var(--sx-accent)]" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="space-y-[clamp(16px,1.6vw,24px)] md:col-span-9">
          {POSTS.map((p) => {
            const on = p.cat === cat;
            return (
              <div key={p.title} data-m-card>
              <article
                className={`sx-card grid grid-cols-1 items-center gap-[clamp(20px,2.4vw,40px)] rounded-[22px] border bg-[var(--sx-surface)] p-[clamp(12px,1.2vw,18px)] transition-[border-color,opacity] duration-500 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] ${on ? "border-[var(--sx-accent)]" : "border-[var(--sx-line)] opacity-55"}`}
              >
                <div className="relative overflow-hidden rounded-[16px]">
                  <div className="fx-pan">
                    <Pic i={p.cat % 4} ratio="16/10" label="" round={false} className="fx-drift" />
                  </div>
                  {on && <span className="jr5-sheen pointer-events-none absolute inset-0" />}
                </div>
                <div className="pr-[clamp(8px,2vw,32px)]">
                  <p className="text-[12px] font-[650] uppercase tracking-[0.14em] text-[var(--sx-accent)]">{CATS[p.cat]}</p>
                  <h3 className="sx-display mt-3 text-[clamp(28px,2.6vw,42px)] leading-[1.02]">{p.title}</h3>
                  <p className="mt-3 max-w-[52ch] text-[16px] leading-relaxed text-[var(--sx-muted)]">{p.ex}</p>
                  <div className="mt-5 flex items-center justify-between gap-4">
                    <span className="text-[13px] text-[var(--sx-muted)]">{p.meta}</span>
                    <Btn kind="link">Read the story</Btn>
                  </div>
                </div>
              </article>
              </div>
            );
          })}
        </div>
      </div>
    </Sec>
  );
}

/* ── JR11 ─────────────────────────────────────────────────────────────── */

const STORIES = [
  {
    title: "The linen that outlived us",
    by: "Ira Menon",
    ex: "A shirt bought in 2009, mended four times, still the first thing she packs. On fabric that gets better with every wash.",
    body: [
      "It was the colour of weak tea when she bought it, and it has only grown paler since. The collar was turned in 2014, the cuffs in 2019. Last spring a patch went in at the elbow, cut from the hem of a skirt.",
      "We asked our weavers in Phulia why some linen softens and some just wears thin. The answer was the yarn: long fibres, spun slowly, woven loose enough to breathe.",
    ],
    q: "“You don't own a good shirt. You keep it company.”",
  },
  {
    title: "Dressing for the monsoon",
    by: "Kabir Shah",
    ex: "Six weeks of rain, one small wardrobe. What our studio team actually wore to work, and what dried by morning.",
    body: [
      "The rule in the studio is simple: nothing that needs ironing, nothing that holds water. Linen won by a distance, cotton voile came second.",
      "Kabir rotated three shirts and two trousers for six weeks. The trick, he says, is a wooden hanger by the window and a fan on low.",
    ],
    q: "“Rain is a fitting. It shows you what fits.”",
  },
  {
    title: "Notes from the dye pit",
    by: "Meher Rao",
    ex: "Indigo at seven in the morning, before the sun gets to it. A day with the dyers who give our autumn range its blue.",
    body: [
      "The vats are older than anyone working them. Each is fed with jaggery and lime, and stirred with a paddle that is passed down rather than bought.",
      "A length of cloth goes in green and comes out blue as it meets the air. It takes eleven dips to reach the shade we call Night Field.",
    ],
    q: "“The blue is not in the vat. It is in the air.”",
  },
  {
    title: "A capsule for a long trip",
    by: "Tara Iyer",
    ex: "Twelve pieces, forty days, four climates. The packing list we keep sending to friends, finally written down.",
    body: [
      "Start with two colours that agree with each other and one that argues. Everything else is a variation: a long shirt, a short shirt, wide trousers, a wrap.",
      "Tara wore the same oat trousers on a glacier and at a wedding. Nobody noticed, she says, because nobody ever does.",
    ],
    q: "“Pack for the person you are on day ten.”",
  },
];

/** JR11 · Excerpt that opens into a full article: a magazine list of excerpts (title, three lines, small image); one at
 *  a time opens in place into the full article, its image growing into the header, then closes again. */
function JR11() {
  const r = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLElement | null)[]>([]);
  useSectionMotion(r, "M6");
  const [s, setS] = useAutoCycle(r, STORIES.length * 4, 1400);
  const phase = s % 4; // 0 closed · 1 opening · 2–3 open
  const item = phase === 0 ? (Math.floor(s / 4) + STORIES.length - 1) % STORIES.length : Math.floor(s / 4) % STORIES.length;
  const [clip, setClip] = useState<string | null>(null);
  const [instant, setInstant] = useState(false);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const c = box.current?.getBoundingClientRect();
    const e = items.current[item]?.getBoundingClientRect();
    if (!c || !e) return;
    const rect = `inset(${e.top - c.top}px ${c.right - e.right}px ${c.bottom - e.bottom}px ${e.left - c.left}px round 18px)`;
    if (phase === 1) {
      setShown(item);
      setInstant(true);
      setClip(rect);
      let a = 0;
      const b = requestAnimationFrame(() => (a = requestAnimationFrame(() => (setInstant(false), setClip("inset(0px 0px 0px 0px round 26px)")))));
      return () => (cancelAnimationFrame(b), cancelAnimationFrame(a));
    }
    if (phase === 0) {
      setClip((v) => (v ? rect : v));
      const t = setTimeout(() => setClip(null), 750);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [phase, item, s]);

  const st = STORIES[shown];
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#7a5a2e", ["--sx-accent-text" as string]: "#fbf6ec" }}>
      <style>{JR_CSS}</style>
      <div className="grid grid-cols-1 items-end gap-6 md:grid-cols-12">
        <H className="text-[clamp(48px,5.4vw,92px)] md:col-span-7">The Weave, issue nine.</H>
        <P className="max-w-[44ch] md:col-span-5">Four stories on cloth, care and keeping things longer. Open any of them right where it sits.</P>
      </div>

      <div ref={box} className="relative mt-[clamp(36px,4.5vw,64px)]">
        <div className="grid grid-cols-1 gap-[clamp(14px,1.4vw,22px)] md:grid-cols-2">
          {STORIES.map((x, k) => (
            <article
              key={x.title}
              ref={(el) => {
                items.current[k] = el;
              }}
              onClick={() => setS(k * 4 + 1)}
              className="sx-card grid cursor-pointer grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)] items-center gap-[clamp(16px,1.8vw,28px)] rounded-[18px] border border-[var(--sx-line)] bg-[var(--sx-surface)] p-[clamp(12px,1.2vw,18px)]"
            >
              <Pic i={k} ratio="4/5" label="" />
              <div className="min-w-0 pr-2">
                <h3 data-m-text className="sx-display text-[clamp(24px,2.1vw,34px)] font-[650] leading-[1.05]">{x.title}</h3>
                <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-[var(--sx-muted)]">{x.ex}</p>
                <p className="mt-4 text-[13px] text-[var(--sx-muted)]">
                  By {x.by} · <span className="font-[600] text-[var(--sx-accent)]">Read in place</span>
                </p>
              </div>
            </article>
          ))}
        </div>
        <div className="jr5-sheen pointer-events-none absolute inset-0 z-[5] rounded-[18px] mix-blend-multiply" />

        {clip && (
          <div
            className="absolute inset-0 z-10 overflow-hidden bg-[var(--sx-surface)] shadow-[0_30px_80px_rgba(28,24,19,.18)]"
            style={{ clipPath: clip, transition: instant ? "none" : "clip-path .8s cubic-bezier(.7,0,.2,1)" }}
          >
            <div className="relative h-[46%] overflow-hidden">
              <div className="fx-pan absolute inset-0">
                <Pic i={shown} ratio="auto" label="" round={false} className="absolute inset-0 h-full w-full scale-[1.08]" />
              </div>
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_30%,rgba(20,16,12,.7))]" />
              <div className="absolute inset-x-[clamp(20px,3vw,48px)] bottom-[clamp(16px,2vw,28px)] flex items-end justify-between gap-6 text-white">
                <p className="sx-display max-w-[18ch] text-[clamp(30px,3.2vw,52px)] font-[650] leading-[1.02]">{st.title}</p>
                <p className="shrink-0 text-[14px] opacity-80">By {st.by} · 9 min read</p>
              </div>
            </div>
            <div className="grid h-[54%] grid-cols-1 gap-[clamp(20px,3vw,56px)] overflow-hidden px-[clamp(20px,3vw,48px)] pt-[clamp(18px,2vw,30px)] md:grid-cols-12">
              <div key={`read-${shown}`} className="jr5-read space-y-4 text-[16px] leading-relaxed md:col-span-8">
                <p className="text-[18px] font-[600]">{st.ex}</p>
                {st.body.map((b) => (
                  <p key={b} className="text-[var(--sx-muted)]">
                    {b}
                  </p>
                ))}
                <p className="text-[var(--sx-muted)]">{st.body[0]}</p>
              </div>
              <blockquote className="sx-display hidden border-l-2 border-[var(--sx-accent)] pl-5 text-[clamp(22px,1.8vw,28px)] italic leading-snug md:col-span-4 md:block">{st.q}</blockquote>
            </div>
            <button type="button" onClick={() => setS((v) => v - (v % 4) + 4)} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/85 text-[18px] text-[#1c1813]">
              ×
            </button>
          </div>
        )}
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "JR10", name: "Sticky category sidebar + wide cards", motion: "M23", C: JR10 },
  { code: "JR11", name: "Excerpt that opens into a full article", motion: "M6", C: JR11 },
];
