"use client";

// EV · Event layouts (docs/SECTION-MENU.md), batch 4. One card at a time RSVPs by itself while on screen (its count
// ticks up); loops stop in ?static=1.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Avatar, Btn, H, P, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Hands-free cycling: steps an index every `ms` while the section is on screen (stops off screen and in ?static=1). */
function useAutoCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms = 1600) {
  const [i, setI] = useState(-1);
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

const EV_CSS = `.ev4-date{background-image:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.35) 48%,transparent 66%);background-size:260% 100%;animation:ev4-sweep 2.4s linear infinite;animation-delay:var(--dl,0s)}@keyframes ev4-sweep{from{background-position:130% 0}to{background-position:-30% 0}}
.ev4-bump{display:inline-block;animation:ev4-bump .45s cubic-bezier(.2,.8,.2,1)}@keyframes ev4-bump{from{transform:translateY(-70%);opacity:0}to{transform:none;opacity:1}}
.is-static .ev4-date,.is-static .ev4-bump{animation:none}
html.is-static {.ev4-date,.ev4-bump{animation:none}}`;

const EVENTS = [
  { c: "Workshop", m: "OCT", d: "12", w: "Sat", t: "Throw your first mug", time: "10:00 – 13:00", loc: "The kiln room, Indiranagar", n: 18, people: ["Ira Menon", "Kabir Shah", "Tara Bose"] },
  { c: "Tasting", m: "OCT", d: "16", w: "Wed", t: "Natural wines, Nashik edition", time: "19:30 – 21:30", loc: "Back bar, Church Street", n: 42, people: ["Rhea Nair", "Dev Kapoor", "Anya Rao"] },
  { c: "Run club", m: "OCT", d: "19", w: "Sat", t: "Lake loop + filter coffee", time: "06:15 – 07:45", loc: "Gate 2, Sankey Tank", n: 64, people: ["Neel Iyer", "Maya Das", "Arjun Pillai"] },
  { c: "Talk", m: "OCT", d: "23", w: "Wed", t: "How we source our beans", time: "18:30 – 19:30", loc: "Roastery floor, Indiranagar", n: 37, people: ["Zoya Mirza", "Kiran Joshi", "Sana Qureshi"] },
  { c: "Supper", m: "OCT", d: "26", w: "Sat", t: "Long-table harvest supper", time: "20:00 – 23:00", loc: "The courtyard, Frazer Town", n: 24, people: ["Vikram Sethi", "Leela Rao", "Omar Khan"] },
  { c: "Listening", m: "NOV", d: "02", w: "Sat", t: "Side A, side B: jazz on vinyl", time: "17:00 – 19:00", loc: "Upstairs, Church Street", n: 29, people: ["Asha Varma", "Rohan Gill", "Nina Paul"] },
];

/** EV05 · Event cards with RSVP: a grid of event cards, each with a category badge, a date block, title, time, place,
 *  attendee faces + count and an RSVP button. One card RSVPs by itself at a time: its button fills and its count bumps. */
function EV05() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  const [i, setI] = useAutoCycle(r, EVENTS.length, 1500);
  return (
    <Sec innerRef={r} theme="stone" font="grotesk" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#d2552f", ["--sx-accent-text" as string]: "#fff7f2" }}>
      <style>{EV_CSS}</style>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[14ch] text-[clamp(48px,5.6vw,92px)]">This month at the café.</H>
        <div className="max-w-[36ch] pb-2">
          <P>Small, free and mostly on weekends. Save a seat and we keep a cup warm for you.</P>
          <div className="mt-6">
            <Btn kind="link">Add the calendar →</Btn>
          </div>
        </div>
      </div>
      <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 gap-[clamp(14px,1.6vw,24px)] md:grid-cols-3">
        {EVENTS.map((e, k) => {
          const on = k === i;
          return (
            <article
              key={e.t}
              data-m-card
              onMouseEnter={() => setI(k)}
              className={`sx-card flex flex-col rounded-[22px] p-[clamp(20px,2vw,30px)] transition-colors duration-500 ${on ? "bg-[color-mix(in_srgb,var(--sx-accent)_12%,var(--sx-surface))]" : "bg-[var(--sx-surface)]"}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="ev4-date grid w-[84px] shrink-0 place-items-center rounded-[16px] bg-[var(--sx-text)] py-3 text-[var(--sx-bg)]" style={{ ["--dl" as string]: `${-k * 0.4}s` }}>
                  <span className="text-[12px] font-[700] tracking-[0.18em] opacity-70">{e.m}</span>
                  <span className="sx-display text-[36px] font-[700] leading-none tabular-nums">{e.d}</span>
                  <span className="text-[12px] opacity-70">{e.w}</span>
                </div>
                <span className="rounded-full border border-[var(--sx-line)] px-3 py-1.5 text-[12px] font-[650] uppercase tracking-[0.14em] text-[var(--sx-accent)]">{e.c}</span>
              </div>
              <h3 className="sx-display mt-6 text-[clamp(22px,1.9vw,30px)] font-[650] leading-[1.1]">{e.t}</h3>
              <p className="mt-3 text-[15px] tabular-nums">{e.time}</p>
              <p className="mt-1 text-[15px] text-[var(--sx-muted)]">{e.loc}</p>
              <div className="min-h-6 flex-1" />
              <div className="flex items-center justify-between gap-4 border-t border-[var(--sx-line)] pt-5">
                <div className="flex items-center gap-3">
                  <span className="flex -space-x-2">
                    {e.people.map((p, j) => (
                      <span key={p} className="rounded-full ring-2 ring-[var(--sx-surface)]">
                        <Avatar name={p} i={k + j} size={30} />
                      </span>
                    ))}
                  </span>
                  <span className="text-[14px] text-[var(--sx-muted)]">
                    <b key={on ? "on" : "off"} className={`font-[650] tabular-nums text-[var(--sx-text)] ${on ? "ev4-bump" : ""}`}>
                      {e.n + (on ? 1 : 0)}
                    </b>{" "}
                    going
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setI(k)}
                  className={`rounded-full px-5 py-2.5 text-[14px] font-[650] transition-colors duration-300 ${on ? "bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "border border-[var(--sx-line)] text-[var(--sx-text)]"}`}
                >
                  {on ? "Going ✓" : "RSVP"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "EV05", name: "Event cards with RSVP", motion: "M34", C: EV05 }];
