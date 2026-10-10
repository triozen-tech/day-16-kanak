"use client";

// SP · Social proof layouts, batch 7 (docs/SECTION-MENU.md): SP22 a sideways-drifting chain of rounded story cards
// (photo + quote) joined by curved bridges, like links of one chain. The chain drifts on its own and bends into an
// arc with the scroll speed (M44). ?static=1 shows the chain at rest, starting at the content padding.
import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { scene, useScrub, useTicker } from "../fx/shared";
import { Avatar, Btn, H, P, Sec } from "./kit";
import type { SectionDef } from "./types";

const CSS = `.sp7kb img{animation:sp7kbs 5s linear infinite alternate,sp7kbt 3.1s ease-in-out infinite alternate}
@keyframes sp7kbs{from{scale:1.05}to{scale:1.2}}@keyframes sp7kbt{from{translate:-3% 2%}to{translate:3% -2%}}
.sp7glow{animation:sp7gx 6.4s linear infinite alternate,sp7gs 3.7s ease-in-out infinite alternate}
@keyframes sp7gx{from{translate:-28% -6%}to{translate:28% 10%}}@keyframes sp7gs{from{scale:.82}to{scale:1.22}}
html.is-static .sp7kb img,html.is-static .sp7glow{animation:none}
html.is-static {.sp7kb img,.sp7glow{animation:none}}`;

const STORIES = [
  { q: "I came for the filter coffee and stayed for the Thursday poetry nights. Six years now.", who: "Meera Pillai", tag: "Regular since 2019", i: 1 },
  { q: "They let our book club take over the back table every month. Free refills, too.", who: "Arjun Rao", tag: "Book club host", i: 3 },
  { q: "My first job was on this espresso machine. Now I roast the beans for it.", who: "Tanvi Desai", tag: "Head roaster", i: 0 },
  { q: "Every cup on Sundays funds a meal at the shelter down the road. That keeps me coming.", who: "Rohan Kulkarni", tag: "Sunday volunteer", i: 2 },
  { q: "We got engaged by the window seat. The baristas wrote it on the chalkboard.", who: "Aisha Khan", tag: "Window seat, 2023", i: 1 },
];

/** The curved bridge that links one card to the next (a pinched band with a stud in the middle). */
function Bridge() {
  return (
    <svg viewBox="0 0 72 150" className="h-[clamp(110px,10vw,150px)] w-[clamp(48px,4.4vw,72px)] shrink-0" aria-hidden>
      <path d="M0 0C30 50 42 50 72 0V150C42 100 30 100 0 150Z" fill="var(--sx-surface)" stroke="var(--sx-line)" strokeWidth="1.5" />
      <circle cx="36" cy="75" r="9" fill="var(--sx-accent)" />
      <circle cx="36" cy="75" r="17" fill="none" stroke="var(--sx-accent)" strokeOpacity=".35" strokeWidth="1.5" />
    </svg>
  );
}

/** SP22 · A carousel of rounded image + quote cards joined by curved bridges, drifting sideways and bending with the scroll. */
function SP22() {
  const root = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const vel = useRef(0);
  const smooth = useRef(0);
  const x = useRef(0);
  useScrub(root, (_, v) => (vel.current = v), { finalValue: 0 });
  useTicker(root, (_, dt) => {
    const el = row.current;
    if (!el) return;
    smooth.current += (vel.current - smooth.current) * 0.08;
    vel.current *= 0.92;
    const kids = el.children as HTMLCollectionOf<HTMLElement>;
    const set = kids[STORIES.length].offsetLeft - kids[0].offsetLeft; // one full set: loop seamlessly
    x.current = (x.current - dt * (46 + Math.abs(smooth.current) * 420)) % set;
    const w = root.current!.clientWidth;
    for (const it of Array.from(el.children) as HTMLElement[]) {
      const cx = it.offsetLeft + x.current + it.offsetWidth / 2;
      const n = gsap.utils.clamp(0, 1, cx / w);
      const y = Math.sin(n * Math.PI) * smooth.current * 60 + Math.sin(n * Math.PI * 2 + performance.now() / 1100) * 8;
      it.style.transform = `translate3d(${x.current}px, ${y}px, 0) rotate(${((n - 0.5) * smooth.current * -10).toFixed(2)}deg)`;
    }
  });
  const list = [...STORIES, ...STORIES];
  return (
    <Sec theme="paper" font="editorial" full className="py-[clamp(72px,9vw,140px)]">
      <style>{CSS}</style>
      <span aria-hidden className="sp7glow pointer-events-none absolute left-[24%] top-[30%] h-[60%] w-[52%] rounded-full blur-[90px]" style={{ background: "radial-gradient(closest-side, color-mix(in srgb, var(--sx-accent) 40%, transparent), transparent)" }} />
      <div className="relative z-10 flex flex-wrap items-end justify-between gap-6 px-[clamp(20px,5vw,96px)]">
        <H className="max-w-[14ch] text-[clamp(48px,6vw,100px)] font-[400]">Stories from the counter.</H>
        <div className="max-w-[36ch] pb-2">
          <P>Kaapi Kattu has poured coffee on the same Basavanagudi corner since 1987. These are the people who make it a place.</P>
          <div className="mt-6">
            <Btn kind="link">Share your story →</Btn>
          </div>
        </div>
      </div>

      <div ref={root} className="relative z-10 mt-[clamp(48px,6vw,88px)] overflow-hidden py-16">
        <div ref={row} className="flex w-max items-center pl-[clamp(20px,5vw,96px)]">
          {list.map((s, k) => (
            <div key={k} className="flex shrink-0 items-center will-change-transform">
              <article className="sx-card w-[clamp(280px,24vw,360px)] overflow-hidden rounded-[28px] bg-[var(--sx-surface)]! shadow-[0_30px_60px_-36px_rgba(28,24,19,.45)]">
                <div className="sp7kb relative aspect-[4/3] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={scene(s.i, 800, 600, "")} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
                </div>
                <div className="p-[clamp(20px,1.8vw,28px)]">
                  <p className="sx-display text-[clamp(20px,1.6vw,25px)] leading-[1.25]">&ldquo;{s.q}&rdquo;</p>
                  <div className="mt-6 flex items-center gap-3 border-t border-[var(--sx-line)] pt-5">
                    <Avatar name={s.who} i={k} size={38} />
                    <div>
                      <p className="text-[15px] font-[650]">{s.who}</p>
                      <p className="text-[13px] text-[var(--sx-muted)]">{s.tag}</p>
                    </div>
                  </div>
                </div>
              </article>
              <Bridge />
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-6 flex flex-wrap items-center justify-between gap-4 px-[clamp(20px,5vw,96px)]">
        <p className="text-[15px] text-[var(--sx-muted)]">2,300 stories collected · one free filter coffee for every story shared</p>
        <Btn>Visit the café</Btn>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "SP22", name: "Connected story cards", motion: "M44", C: SP22 }];
