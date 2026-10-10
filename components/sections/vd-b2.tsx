"use client";

// VD · Video layouts (docs/SECTION-MENU.md), batch 2. Placeholders only: every "video" is a moving scene() picture
// (slow push-in, light sweep, running progress bar), never an external video. A site swaps in its own clips.
import { useEffect, useRef, useState } from "react";
import { ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";
import { scene } from "../fx/shared";
import { Btn, H, P, Price, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Hands-free cycling: steps an index every `ms` while the section is on screen (stops off screen and in ?static=1). */
function useAutoCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms = 2800) {
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

const VD_CSS = `.vd2-play{animation:vd2-push 6s ease-in-out infinite alternate}@keyframes vd2-push{from{transform:scale(1.04) translate(-1.5%,0)}to{transform:scale(1.16) translate(1.5%,-1%)}}
.vd2-sweep{background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.22) 48%,transparent 66%) 0 0/260% 100%;animation:vd2-sweep 2.6s linear infinite}@keyframes vd2-sweep{from{background-position:130% 0}to{background-position:-30% 0}}
.vd2-bar{transform-origin:left;animation:vd2-bar var(--d,4s) linear infinite}@keyframes vd2-bar{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.vd2-glow{animation:vd2-glow 3.4s ease-in-out infinite alternate}@keyframes vd2-glow{from{opacity:.55;scale:.92}to{opacity:1;scale:1.08}}
.is-static .vd2-play,.is-static .vd2-sweep,.is-static .vd2-bar,.is-static .vd2-glow{animation:none}
html.is-static {.vd2-play,.vd2-sweep,.vd2-bar,.vd2-glow{animation:none}}`;

/** A placeholder "autoplay video": a scene that pushes in, a light sweep across it and a running progress bar. */
function Clip({ i, d = 4, className = "" }: { i: number; d?: number; className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={scene(i, 1600, 1000, "")} alt="" className="vd2-play absolute inset-0 h-full w-full object-cover" draggable={false} />
      <div className="vd2-sweep absolute inset-0" />
      <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/20">
        <div className="vd2-bar h-full bg-white" style={{ ["--d" as string]: `${d}s` }} />
      </div>
    </div>
  );
}

// ── VD04 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const DISHES = [
  { t: "Kerala fish curry", m: "Kodampuli, coconut, curry leaf", len: "6:40", i: 0 },
  { t: "Brown butter naan", m: "Tawa, no tandoor needed", len: "4:15", i: 1 },
  { t: "Charred corn chaat", m: "Lime, chilli salt, sev", len: "3:05", i: 2 },
  { t: "Filter coffee flan", m: "Decoction caramel, jaggery", len: "7:20", i: 3 },
  { t: "Mango sticky rice", m: "Alphonso, coconut cream", len: "5:30", i: 1 },
];

/** VD04 · Vertical video track + synced titles: left 5/12 a big title list; right 7/12 a track of autoplay video tiles
 *  that scrolls up while the titles drift the opposite way, and the title of the tile passing centre lights up. */
function VD04() {
  const r = useRef<HTMLDivElement>(null);
  const tall = useRef<HTMLDivElement>(null);
  const view = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const titles = useRef<HTMLUListElement>(null);
  const [k, setK] = useState(0);
  useEffect(() => {
    const el = tall.current;
    if (!el || prefersReducedMotion() || !window.matchMedia("(min-width: 768px)").matches) return;
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        const v = view.current;
        const t = track.current;
        if (!v || !t) return;
        const travel = Math.max(0, t.scrollHeight - v.clientHeight);
        const y = -self.progress * travel;
        t.style.transform = `translate3d(0, ${y}px, 0)`;
        if (titles.current) titles.current.style.transform = `translate3d(0, ${(0.5 - self.progress) * 60}px, 0)`;
        const mid = -y + v.clientHeight / 2;
        let best = 0;
        let bd = Infinity;
        Array.from(t.children as HTMLCollectionOf<HTMLElement>).forEach((c, j) => {
          const d = Math.abs(c.offsetTop + c.offsetHeight / 2 - mid);
          if (d < bd) {
            bd = d;
            best = j;
          }
        });
        setK(best);
      },
    });
    return () => st.kill();
  }, []);
  return (
    <Sec innerRef={r} theme="paper" font="editorial" full style={{ overflow: "clip" }}>
      <style>{VD_CSS}</style>
      <div ref={tall} className="relative md:h-[200vh]">
        <div className="grid grid-cols-1 gap-[clamp(24px,4vw,64px)] px-[clamp(20px,5vw,96px)] py-[clamp(72px,9vw,120px)] md:sticky md:top-0 md:h-[100svh] md:min-h-[640px] md:grid-cols-12 md:py-[clamp(32px,4vw,56px)]">
          <div className="flex min-w-0 flex-col justify-center md:col-span-5">
            <H className="max-w-[12ch] text-[clamp(36px,3.6vw,60px)]">Cook along, one film at a time.</H>
            <ul ref={titles} className="mt-[clamp(24px,3vw,44px)] border-t border-[var(--sx-line)] will-change-transform">
              {DISHES.map((d, j) => {
                const on = j === k;
                return (
                  <li key={d.t} className="flex items-baseline justify-between gap-4 border-b border-[var(--sx-line)] py-[clamp(10px,1.2vw,16px)]">
                    <span className={`sx-display text-[clamp(26px,2.6vw,44px)] leading-[1.05] transition-[color,opacity,transform] duration-500 ${on ? "translate-x-2 text-[var(--sx-accent)]" : "opacity-35"}`}>{d.t}</span>
                    <span className={`shrink-0 text-[14px] tabular-nums transition-opacity duration-500 ${on ? "opacity-100" : "opacity-40"}`}>{d.len}</span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Btn>Get the recipe box · ₹1,890</Btn>
            </div>
          </div>
          <div ref={view} className="relative min-w-0 md:col-span-7 md:h-full md:overflow-hidden md:rounded-[var(--sx-radius,18px)]">
            <div ref={track} className="flex flex-col gap-[clamp(12px,1.4vw,20px)] will-change-transform">
              {DISHES.map((d, j) => (
                <div key={d.t} className="relative aspect-[16/10] shrink-0 overflow-hidden rounded-[var(--sx-radius,18px)] bg-[var(--sx-surface)]">
                  <Clip i={d.i} d={4 + j * 0.7} />
                  <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,.55))] p-5 pb-6 text-white">
                    <p className="text-[18px] font-[650]">{d.t}</p>
                    <p className="text-[14px] text-white/75">{d.m}</p>
                  </div>
                  <span className={`absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/45 px-3 py-1.5 text-[13px] text-white backdrop-blur transition-opacity duration-500 ${j === k ? "opacity-100" : "opacity-0"}`}>
                    <span className="h-2 w-2 rounded-full bg-[var(--sx-accent)]" />
                    Playing · {d.len}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

// ── VD05 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const REELS = [
  { t: "Rain on the Western Ghats", f: "Dolby Atmos demo", len: "2:14", i: 3, hue: "#4f8dff" },
  { t: "Live at the Tin Roof", f: "Concert, 7.1 mix", len: "3:40", i: 1, hue: "#d4a24c" },
  { t: "Night drive, Marine Lines", f: "Film score sampler", len: "1:58", i: 0, hue: "#8a5cf6" },
  { t: "Tabla in the round", f: "Spatial audio", len: "2:36", i: 2, hue: "#2fbf9b" },
];

/** VD05 · Showreel on an object's screen: a drawn living room with a TV and speakers; the clip plays mapped onto the
 *  TV screen (its glow spills onto the wall) and the list on the right steps the clip by itself. */
function VD05() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M31");
  const MS = 2800;
  const [k, setK] = useAutoCycle(r, REELS.length, MS);
  const c = REELS[k];
  return (
    <Sec innerRef={r} theme="ink" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <style>{VD_CSS}</style>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[15ch] text-[clamp(44px,5.4vw,92px)]">The room is the speaker.</H>
        <P className="max-w-[40ch]">Orrin Stage 7.1: two towers, a centre bar and four ceiling drivers, tuned to the room you already have.</P>
      </div>
      <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 items-center gap-[clamp(24px,3vw,48px)] md:grid-cols-12">
        <div data-m-card className="relative aspect-[16/10] overflow-hidden rounded-[var(--sx-radius,18px)] md:col-span-8">
          {/* wall + floor */}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#2a2420,#1b1714_70%)]" />
          <div key={k} className="vd2-glow absolute left-1/2 top-[34%] aspect-square w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: `radial-gradient(closest-side, ${c.hue}55, transparent)` }} />
          <div className="absolute inset-x-0 bottom-0 h-[24%] bg-[linear-gradient(180deg,#3a2f27,#211a15)]" />
          <div className="absolute bottom-[4%] left-1/2 h-[12%] w-[64%] -translate-x-1/2 rounded-[50%] bg-[#5b4636]/50" />
          {/* console */}
          <div className="absolute bottom-[20%] left-[24%] right-[24%] h-[9%] rounded-[6px] bg-[linear-gradient(180deg,#6d5644,#4a3a2e)] shadow-[0_18px_30px_-12px_rgba(0,0,0,.7)]" />
          <div className="absolute bottom-[23%] left-[38%] right-[38%] h-[3.4%] rounded-full bg-[#14110f]" />
          {/* TV with the clip on its screen */}
          <div className="absolute left-[25%] right-[25%] top-[12%] aspect-video rounded-[8px] bg-[#0a0a0b] p-[0.7%] shadow-[0_30px_60px_-20px_rgba(0,0,0,.8)]">
            <div className="relative h-full w-full overflow-hidden rounded-[4px] bg-black">
              {REELS.map((x, j) => (
                <div key={x.t} className={`absolute inset-0 transition-opacity duration-700 ${j === k ? "opacity-100" : "opacity-0"}`}>
                  <Clip i={x.i} d={MS / 1000} />
                </div>
              ))}
              <span className="absolute bottom-[8%] left-[4%] text-[clamp(10px,0.9vw,13px)] font-[600] text-white/85">{c.t}</span>
            </div>
          </div>
          {/* towers */}
          {["left-[8%]", "right-[8%]"].map((p) => (
            <div key={p} className={`absolute bottom-[14%] ${p} flex h-[58%] w-[9%] flex-col items-center justify-around rounded-[10px] bg-[linear-gradient(90deg,#1a1715,#2c2622,#1a1715)] py-[2%] shadow-[0_20px_40px_-14px_rgba(0,0,0,.8)]`}>
              {[0.42, 0.58, 0.58].map((s, j) => (
                <span key={j} className="aspect-square rounded-full bg-[radial-gradient(circle,#3b342f_30%,#0f0d0c_32%,#24201d_70%)]" style={{ width: `${s * 100}%` }} />
              ))}
            </div>
          ))}
          <div className="vd2-sweep pointer-events-none absolute inset-0 opacity-40 mix-blend-soft-light" />
        </div>

        <div className="md:col-span-4">
          <ul className="border-t border-[var(--sx-line)]">
            {REELS.map((x, j) => {
              const on = j === k;
              return (
                <li key={x.t} className="border-b border-[var(--sx-line)]">
                  <button onClick={() => setK(j)} className="w-full py-[clamp(14px,1.6vw,22px)] text-left">
                    <span className="flex items-baseline justify-between gap-4">
                      <span className={`text-[clamp(18px,1.5vw,22px)] font-[650] transition-colors duration-500 ${on ? "" : "text-[var(--sx-muted)]"}`}>{x.t}</span>
                      <span className="text-[13px] tabular-nums text-[var(--sx-muted)]">{x.len}</span>
                    </span>
                    <span className="mt-1 block text-[14px] text-[var(--sx-muted)]">{x.f}</span>
                    <span className="mt-3 block h-[2px] overflow-hidden rounded-full bg-[var(--sx-line)]">
                      {on && <span key={k} className="vd2-bar block h-full bg-[var(--sx-accent)]" style={{ ["--d" as string]: `${MS / 1000}s` }} />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Price now="₹1,89,000" className="text-[20px]" />
            <Btn>Book a listening room</Btn>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "VD04", name: "Vertical video track + synced titles", motion: "M42", C: VD04 },
  { code: "VD05", name: "Showreel on an object's screen", motion: "M31", C: VD05 },
];
