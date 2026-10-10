"use client";

// TM · Team layouts, batch 4 (docs/SECTION-MENU.md). Full designed sections; motion via useSectionMotion or a ticker.
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { useScrub, useTicker } from "../fx/shared";
import { Avatar, Btn, H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Hands-free cycling: steps an index every `ms` while the section is on screen (stops off screen and in ?static=1). */
function useAutoCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms = 2000) {
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

const noop = (e: React.MouseEvent) => e.preventDefault();

/* ───────────────────────── TM07 · Team portrait slider ───────────────────────── */

const TM07_TEAM = [
  { n: "Ira Menon", r: "Head chef", i: 3 },
  { n: "Kabir Shah", r: "Sous chef, fire & grill", i: 1 },
  { n: "Leela Pillai", r: "Pastry", i: 2 },
  { n: "Arjun Rao", r: "Sommelier", i: 0 },
  { n: "Meher Bains", r: "Front of house", i: 1 },
  { n: "Tenzin Dorje", r: "Fermentation & pickles", i: 3 },
  { n: "Nisha Varma", r: "Bar lead", i: 2 },
];

/** TM07 · Heading, copy and arrows in the left 3 columns; the right 9 columns hold a slider of tall portrait cards
 *  (3.5 visible) with name and role under each. It drifts on its own, leans with the scroll speed (M44) and the
 *  arrows push it one card. */
function TM07() {
  const r = useRef<HTMLDivElement>(null);
  const view = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const x = useRef(0);
  const extra = useRef({ v: 0 });
  const vel = useRef(0);
  const smooth = useRef(0);
  useScrub(view, (_, v) => (vel.current = v), { finalValue: 0 });
  useTicker(view, (_, dt) => {
    const t = track.current;
    if (!t) return;
    smooth.current += (vel.current - smooth.current) * 0.08;
    vel.current *= 0.92;
    x.current -= dt * (38 + Math.abs(smooth.current) * 420);
    const half = t.scrollWidth / 2;
    const pos = ((((x.current + extra.current.v) % half) - half) % half);
    t.style.transform = `translate3d(${pos.toFixed(1)}px,0,0) skewX(${gsap.utils.clamp(-8, 8, smooth.current * -14).toFixed(2)}deg)`;
  });
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from(el.querySelectorAll("[data-m-head], [data-m-text]"), { y: 26, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, scrollTrigger: { trigger: el, start: "top 75%", toggleActions: "play none none reverse" } });
      gsap.fromTo(view.current, { clipPath: "inset(0 0 0 100%)" }, { clipPath: "inset(0 0 0 0%)", duration: 1.3, ease: "power4.inOut", scrollTrigger: { trigger: el, start: "top 75%", toggleActions: "play none none reverse" } });
    }, el);
    return () => ctx.revert();
  }, []);
  const nudge = (dir: number) => {
    const card = track.current?.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + 20 : 300;
    gsap.to(extra.current, { v: extra.current.v - dir * step, duration: 0.9, ease: "power3.inOut" });
  };
  const list = [...TM07_TEAM, ...TM07_TEAM];
  return (
    <Sec innerRef={r} theme="paper" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <div className="grid grid-cols-1 gap-[clamp(32px,4vw,64px)] md:grid-cols-12">
        <div className="flex flex-col justify-between gap-10 md:col-span-3">
          <div>
            <H className="text-[clamp(40px,4.2vw,72px)]">The hands behind the pass.</H>
            <P className="mt-6">Seven cooks, a sommelier and a bar. Most of us have worked this kitchen since the first night.</P>
          </div>
          <div>
            <div className="flex gap-3">
              {[
                ["←", -1, "Previous"],
                ["→", 1, "Next"],
              ].map(([g, d, l]) => (
                <button key={l as string} type="button" aria-label={l as string} onClick={() => nudge(d as number)} className="grid h-14 w-14 place-items-center rounded-full border border-[var(--sx-line)] text-[20px] transition-colors hover:bg-[var(--sx-text)] hover:text-[var(--sx-bg)]">
                  {g}
                </button>
              ))}
            </div>
            <div className="mt-8">
              <Btn kind="link">We&apos;re hiring a line cook →</Btn>
            </div>
          </div>
        </div>
        <div ref={view} className="min-w-0 overflow-hidden [container-type:inline-size] md:col-span-9">
          <div ref={track} className="flex w-max gap-5 will-change-transform">
            {list.map((p, k) => (
              <figure key={k} className="w-[calc((100cqw-50px)/3.5)] shrink-0 max-md:w-[calc((100cqw-20px)/1.5)]" aria-hidden={k >= TM07_TEAM.length}>
                <Pic i={p.i} ratio="2/3" label="" />
                <figcaption className="mt-4">
                  <p className="sx-display text-[clamp(20px,1.6vw,26px)] font-[600] leading-tight">{p.n}</p>
                  <p className="mt-1 text-[14px] text-[var(--sx-muted)]">{p.r}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── TM08 · Name directory with hover cards ───────────────────────── */

const TM08_PEOPLE = [
  ["Ira Menon", "Coonoor", "First-flush grower, 4 acres"],
  ["Kabir Shah", "Kotagiri", "Orthodox black tea"],
  ["Leela Pillai", "Ooty", "White tea, hand-rolled"],
  ["Arjun Rao", "Gudalur", "Shade-grown green"],
  ["Meher Bains", "Coonoor", "Frost tea, winter pick"],
  ["Tenzin Dorje", "Kotagiri", "Oolong, small lots"],
  ["Nisha Varma", "Ketti", "Leaf sorting & grading"],
  ["Ravi Iyer", "Lovedale", "Organic black tea"],
  ["Sana Qureshi", "Coonoor", "Herbal blends, tulsi"],
  ["Dev Malhotra", "Ooty", "Nursery & saplings"],
  ["Anjali Bose", "Kotagiri", "Silver tips"],
  ["Farhan Ali", "Gudalur", "Logistics, co-op truck"],
  ["Gita Nair", "Ketti", "Withering lofts"],
  ["Hari Krishnan", "Lovedale", "Second-flush grower"],
  ["Isha Kapoor", "Coonoor", "Tasting room"],
  ["Joseph Mathew", "Ooty", "Compost & soil"],
  ["Kavya Reddy", "Kotagiri", "Green tea, steamed"],
  ["Lakshmi Das", "Gudalur", "Plucking lead"],
  ["Manav Joshi", "Ketti", "Roller & dryer"],
  ["Noor Siddiqui", "Lovedale", "Packing & labels"],
  ["Om Prakash", "Coonoor", "Elder grower, 40 years"],
  ["Priya Shetty", "Ooty", "Honey from the slopes"],
  ["Rahul Sen", "Kotagiri", "Rain gauges & weather"],
  ["Tara Ghosh", "Ketti", "Market stall, Sundays"],
];
// the auto-tour skips the first row so the card (it opens above the name) never leaves the list
const TM08_TOUR = [9, 14, 19, 6, 22, 11, 17, 5, 20, 12, 15, 8];

/** Keyframes: a light band sweeps across the open card (a large visible change); off in ?static=1 / reduced motion. */
const TM_CSS = `
.tmb4-sheen{background:linear-gradient(105deg,transparent 30%,rgba(255,255,255,.14) 45%,rgba(255,255,255,.04) 55%,transparent 70%);background-size:250% 100%;animation:tmb4-sheen 1.6s linear infinite}
@keyframes tmb4-sheen{from{background-position:130% 0}to{background-position:-30% 0}}
.tmb4-pop{animation:tmb4-pop .5s cubic-bezier(.2,.8,.2,1) both}
@keyframes tmb4-pop{from{opacity:0;transform:translateY(10px) scale(.96)}to{opacity:1;transform:none}}
html.is-static .tmb4-sheen{animation:none;opacity:0}
html.is-static .tmb4-pop{animation:none}
html.is-static {.tmb4-sheen{animation:none;opacity:0}.tmb4-pop{animation:none}}
`;

/** TM08 · Heading, text and button; then a 4-column directory of tiny avatar + name items. Hovering a name opens a card
 *  above it with a larger photo, role and a social link; hands-free the card visits names in turn. */
function TM08() {
  const r = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLLIElement | null)[]>([]);
  useSectionMotion(r, "M6");
  const [step] = useAutoCycle(r, TM08_TOUR.length, 1400);
  const [hover, setHover] = useState<number | null>(null);
  const a = hover ?? TM08_TOUR[step];
  const [pos, setPos] = useState<{ l: number; t: number } | null>(null);
  useEffect(() => {
    const place = () => {
      const it = items.current[a];
      const ls = list.current;
      if (!it || !ls) return;
      const maxL = ls.clientWidth - 340;
      setPos({ l: Math.max(0, Math.min(it.offsetLeft, maxL)), t: it.offsetTop });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [a]);
  const p = TM08_PEOPLE[a];
  const handle = p[0].toLowerCase().replace(/\s+/g, ".");
  return (
    <Sec innerRef={r} theme="ink" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <style>{TM_CSS}</style>
      <div className="grid grid-cols-1 items-end gap-[clamp(24px,4vw,64px)] md:grid-cols-12">
        <H className="text-[clamp(48px,6vw,100px)] md:col-span-7">Twenty-four farms, one co-op.</H>
        <div className="md:col-span-5 md:pb-2">
          <P className="max-w-[40ch]">Every packet of Nilgiri Collective tea is grown, picked and packed by these growers, across six villages above the clouds.</P>
          <div className="mt-6">
            <Btn>Meet them on Sunday</Btn>
          </div>
        </div>
      </div>

      <div ref={list} className="relative mt-[clamp(48px,6vw,88px)] border-t border-[var(--sx-line)] pt-[clamp(24px,3vw,40px)]">
        <ul className="grid grid-cols-2 gap-x-[clamp(16px,2vw,32px)] md:grid-cols-4" onMouseLeave={() => setHover(null)}>
          {TM08_PEOPLE.map(([n, v], k) => (
            <li
              key={n}
              ref={(el) => {
                items.current[k] = el;
              }}
              onMouseEnter={() => setHover(k)}
              data-m-card
              className={`flex items-center gap-3 border-b border-[var(--sx-line)] py-3 transition-colors duration-500 ${k === a ? "text-[var(--sx-accent)]" : ""}`}
            >
              <span className={`rounded-full transition-shadow duration-500 ${k === a ? "shadow-[0_0_0_2px_var(--sx-accent)]" : ""}`}>
                <Avatar name={n} i={k} size={30} />
              </span>
              <span className="min-w-0 flex-1 truncate text-[16px]">{n}</span>
              <span className="hidden text-[13px] text-[var(--sx-muted)] lg:inline">{v}</span>
            </li>
          ))}
        </ul>

        {/* the hover card: opens above the active name */}
        {pos && (
          <div
            className="pointer-events-none absolute z-20 hidden w-[340px] transition-[left,top] duration-[600ms] ease-[cubic-bezier(.6,0,.2,1)] md:block"
            style={{ left: pos.l, top: pos.t, translate: "0 calc(-100% - 10px)" }}
          >
            <div key={a} className="relative flex gap-4 overflow-hidden rounded-[16px] border border-[var(--sx-line)] bg-[var(--sx-surface)] p-3 shadow-[0_30px_60px_-20px_rgba(0,0,0,.7)] tmb4-pop">
              <Pic i={a % 4} ratio="1/1" className="w-[112px] shrink-0" label="" />
              <div className="flex min-w-0 flex-col justify-between py-1">
                <div>
                  <p className="sx-display text-[20px] font-[600] leading-tight">{p[0]}</p>
                  <p className="mt-1 text-[14px] leading-snug text-[var(--sx-muted)]">{p[2]}</p>
                  <p className="text-[13px] text-[var(--sx-muted)]">{p[1]}</p>
                </div>
                <a href="#" onClick={noop} className="pointer-events-auto truncate text-[14px] font-[600] text-[var(--sx-accent)]">
                  @{handle} ↗
                </a>
              </div>
              <span className="tmb4-sheen pointer-events-none absolute inset-0" />
            </div>
          </div>
        )}
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "TM07", name: "Team portrait slider", motion: "M44", C: TM07 },
  { code: "TM08", name: "Name directory with hover cards", motion: "M6", C: TM08 },
];
