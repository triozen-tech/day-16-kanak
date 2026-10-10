"use client";

// SP · Social proof layouts, batch 4 (docs/SECTION-MENU.md). Clients and members are invented (fake names).
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { Avatar, Btn, H, P, Pic, Sec, Stars } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Hands-free cycling: steps an index every `ms` while the section is on screen (stops off screen and in ?static=1). */
function useAutoCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms = 2600) {
  const [i, setI] = useState(0);
  const [live, setLive] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    setLive(true);
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
  return [i, setI, live] as const;
}

/* ---------------------------------------------------------------------------------------------------------------- */

const CLIENTS = [
  { name: "Dr. Tara Mehta", role: "Patient since 2023 · acne-scar programme", q: "Six sessions, no downtime I could not plan around, and a team that explained every step before touching my skin." },
  { name: "Nikhil Rao", role: "Laser hair removal · 8 visits", q: "Booked on a Sunday night, treated on Tuesday morning. The clinic runs like a good hotel, quietly and on time." },
  { name: "Aisha Kapoor", role: "Pigmentation plan · 4 months", q: "They told me what would not work as clearly as what would. That honesty is why I have sent my sister here." },
  { name: "Varun Iyer", role: "Hydrafacial membership", q: "My monthly hour of calm. I leave with skin that looks rested even when I am not." },
];
const TILTS = [-7, 5, -3, 8];

/** SP13 · Testimonial switcher with stacked portraits: a rotated pile of square portraits left (the active one on top,
 *  straight); name, role and the quote revealed word by word right; round prev/next arrows; auto-advances.
 *  Motion M40: the portrait stack cycles like a deck. */
function SP13() {
  const r = useRef<HTMLDivElement>(null);
  const quote = useRef<HTMLDivElement>(null);
  const [i, setI, live] = useAutoCycle(r, CLIENTS.length, 2600);
  const prev = useRef(0);
  const c = CLIENTS[i];

  // entry: the portrait pile is dealt in from below, then the copy rises
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const once = { trigger: el, start: "top 75%", toggleActions: "play none none reverse" } as const;
      gsap.from(el.querySelectorAll("[data-sp13-deal]"), { y: 180, rotation: (k) => (k % 2 ? 14 : -12), opacity: 0, duration: 1, ease: "power3.out", stagger: 0.1, scrollTrigger: once });
      gsap.from(el.querySelectorAll("[data-m-head], [data-sp13-in]"), { y: 28, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, delay: 0.25, scrollTrigger: once });
    }, el);
    return () => ctx.revert();
  }, []);

  // each switch: the new top portrait lifts and settles; the quote rises word by word from blur
  useEffect(() => {
    if (prev.current === i) return;
    prev.current = i;
    const el = r.current;
    if (!el || !live) return;
    const top = el.querySelector(`[data-sp13-p="${i}"]`);
    const words = quote.current?.querySelectorAll("[data-w]");
    const tl = gsap.timeline();
    if (top) tl.fromTo(top, { y: -70 }, { y: 0, duration: 0.7, ease: "back.out(1.4)" }, 0);
    if (words?.length) tl.fromTo(words, { y: 18, opacity: 0, filter: "blur(8px)" }, { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.5, ease: "power2.out", stagger: 0.025 }, 0.05);
    return () => {
      tl.kill();
    };
  }, [i, live]);

  const go = (d: number) => setI((v) => (v + d + CLIENTS.length) % CLIENTS.length);

  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <style>{`
        @keyframes sp13-breathe { 0%,100% { translate: 0 0 } 50% { translate: 0 -12px } }
        .sp13-top { animation: sp13-breathe 2.3s ease-in-out infinite; }
        html.is-static .sp13-top { animation: none; }
        html.is-static { .sp13-top { animation: none; } }
      `}</style>
      <H className="max-w-[18ch] text-[clamp(40px,4.8vw,80px)]">Skin, in the words of our patients.</H>
      <div className="mt-[clamp(40px,6vw,88px)] grid grid-cols-1 items-center gap-[clamp(40px,7vw,120px)] md:grid-cols-2">
        {/* the pile: side padding so rotated corners never reach the quote column */}
        <div className="relative mx-auto aspect-square w-[min(100%,460px)] md:my-6">
          {CLIENTS.map((p, k) => {
            const depth = (k - i + CLIENTS.length) % CLIENTS.length; // 0 = on top
            const active = depth === 0;
            return (
              <div
                key={p.name}
                data-sp13-p={k}
                className="absolute inset-[6%] transition-[rotate,scale,translate,filter] duration-700 ease-[cubic-bezier(.2,.8,.2,1)]"
                style={{ zIndex: CLIENTS.length - depth, rotate: active ? "0deg" : `${TILTS[k]}deg`, scale: active ? "1" : `${1 - depth * 0.04}`, translate: active ? "0 0" : `${TILTS[k] * 1.2}px ${depth * 8}px`, filter: active ? "none" : "saturate(.7) brightness(.92)" }}
              >
                <div data-sp13-deal className={`h-full w-full shadow-[0_30px_60px_-30px_rgba(28,24,19,.5)] ${active && live ? "sp13-top" : ""}`}>
                  <Pic i={k} ratio="1/1" label="" className="h-full w-full" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="min-w-0">
          <div ref={quote} key={i} aria-live="polite">
            <p className="sx-display text-[clamp(30px,2.5vw,40px)] font-[600] leading-tight">{c.name}</p>
            <p className="mt-2 text-[15px] text-[var(--sx-muted)]">{c.role}</p>
            <blockquote className="mt-8 text-[clamp(22px,2vw,32px)] leading-snug">
              {c.q.split(" ").map((w, k) => (
                <span key={k} data-w className="inline-block whitespace-pre">
                  {w}{" "}
                </span>
              ))}
            </blockquote>
          </div>
          <div data-sp13-in className="mt-10 flex items-center gap-4">
            {[
              ["Previous", -1, "M15 6l-6 6 6 6"],
              ["Next", 1, "M9 6l6 6-6 6"],
            ].map(([l, d, path]) => (
              <button key={l as string} aria-label={l as string} onClick={() => go(d as number)} className="grid h-14 w-14 place-items-center rounded-full border border-[var(--sx-line)] bg-[var(--sx-surface)] transition-colors hover:bg-[var(--sx-text)] hover:text-[var(--sx-bg)]">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={path as string} />
                </svg>
              </button>
            ))}
            <span className="ml-3 text-[14px] tabular-nums text-[var(--sx-muted)]">
              {i + 1} / {CLIENTS.length}
            </span>
            <span className="ml-auto max-md:hidden">
              <Btn kind="link">Book a consultation →</Btn>
            </span>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ---------------------------------------------------------------------------------------------------------------- */

const STAYS = [
  { q: "We came for two nights and rebooked for the monsoon before we had checked out. The quiet here is designed, not accidental.", name: "Rhea & Dev Malhotra", role: "Courtyard suite, Udaipur" },
  { q: "Every chair, lamp and linen was something I wanted to take home. Then I learnt I could, from their own workshop.", name: "Kunal Sethi", role: "Architect, stayed in the Loft room" },
  { q: "Breakfast on the stepwell terrace, a book from the library, nobody asking anything of you. A rare kind of hotel.", name: "Mira Fernandes", role: "Travel writer, The Slow Compass" },
  { q: "They remembered how I take my tea on the second morning. On the third, they had stopped needing to ask.", name: "Aditya Varma", role: "Returning guest, fourth visit" },
];
const SP14_MS = 3400;

/** SP14 · Rotated label rail + progress-timed quote: a narrow left rail with 'Testimonials' set vertically and a
 *  progress bar that fills; when it fills, the next big quote replaces the last. Motion M23: lines mask-slide in. */
function SP14() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const [i, , live] = useAutoCycle(r, STAYS.length, SP14_MS);
  const prev = useRef(-1);
  const s = STAYS[i];
  // the timer bar restarts each time the section comes on screen, in step with the auto-cycle
  const [vis, setVis] = useState(0);
  useEffect(() => {
    const el = r.current;
    if (!el || !live) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setVis((v) => v + 1));
    io.observe(el);
    return () => io.disconnect();
  }, [live]);
  const run = live && vis > 0;

  // the quote's lines slide out of their masks: on entering the screen first, then on every switch
  useEffect(() => {
    const root = r.current;
    const el = root?.querySelector<HTMLElement>("[data-sp14-q]");
    if (!root || !el || !live || prev.current === i) return;
    const isFirst = prev.current === -1;
    prev.current = i;
    const lines = el.querySelectorAll("[data-sp14-l]");
    const from = { yPercent: 105 };
    const to = { yPercent: 0, duration: 0.9, ease: "power4.out", stagger: 0.09, delay: isFirst ? 0.15 : 0 };
    const tw = isFirst
      ? gsap.fromTo(lines, from, { ...to, scrollTrigger: { trigger: root, start: "top 75%", toggleActions: "play none none reverse" } })
      : gsap.fromTo(lines, from, to);
    return () => {
      tw.scrollTrigger?.kill();
      tw.kill();
    };
  }, [i, live]);

  // the quote split into short lines by hand so each line can slide out of its own mask
  const chunks = (t: string, n = 6) => {
    const w = t.split(" ");
    const out: string[] = [];
    for (let k = 0; k < w.length; k += n) out.push(w.slice(k, k + n).join(" "));
    return out;
  };

  return (
    <Sec innerRef={r} theme="ink" font="editorial" full>
      <style>{`
        @keyframes sp14-fill { from { transform: scaleY(0) } to { transform: scaleY(1) } }
        .sp14-fill { transform-origin: 50% 100%; animation: sp14-fill ${SP14_MS}ms linear both; }
        html.is-static .sp14-fill { animation: none; }
        html.is-static { .sp14-fill { animation: none; } }
      `}</style>
      <div className="grid grid-cols-1 md:grid-cols-[120px_minmax(0,1fr)]">
        {/* rail */}
        <div className="relative flex items-center justify-between gap-6 overflow-hidden border-[var(--sx-line)] px-[clamp(20px,5vw,96px)] py-6 max-md:border-b md:flex-col md:border-r md:px-0 md:py-[clamp(72px,9vw,140px)]">
          {/* the whole rail tints as the timer runs (a large, visible change) */}
          <div key={`t${i}-${vis}`} className={`absolute inset-0 bg-[color-mix(in_srgb,var(--sx-accent)_16%,transparent)] ${run ? "sp14-fill" : "opacity-0"}`} />
          <p className="relative text-[13px] font-[600] uppercase tracking-[0.3em] text-[var(--sx-muted)] md:rotate-180 md:[writing-mode:vertical-rl]">Testimonials</p>
          <div className="relative h-[clamp(160px,22vw,280px)] w-[6px] overflow-hidden rounded-full bg-[var(--sx-line)] max-md:hidden">
            <div key={`b${i}-${vis}`} className={`absolute inset-x-0 bottom-0 rounded-full bg-[var(--sx-accent)] ${run ? "sp14-fill top-0" : "h-1/4"}`} />
          </div>
          <p className="relative text-[14px] tabular-nums text-[var(--sx-muted)]">
            {String(i + 1).padStart(2, "0")}/{String(STAYS.length).padStart(2, "0")}
          </p>
        </div>

        {/* quote */}
        <div className="px-[clamp(20px,5vw,96px)] py-[clamp(72px,9vw,140px)]">
          <div className="flex items-end justify-between gap-6">
            <P className="max-w-[40ch]">Guests of the Haveli Sona, a fourteen-room house of handmade furniture and courtyards.</P>
            <span className="sx-display text-[clamp(80px,9vw,150px)] leading-[0.6] text-[var(--sx-accent)]" aria-hidden>
              &ldquo;
            </span>
          </div>
          <div key={i} data-sp14-q className="mt-[clamp(28px,4vw,56px)]">
            <h3 className="sx-display max-w-[34ch] text-[clamp(34px,3.6vw,60px)] font-[500] leading-[1.08] tracking-[-0.02em]">
              {chunks(s.q).map((l, k) => (
                <span key={k} className="block overflow-hidden pb-[0.06em]">
                  <span data-sp14-l className="block">
                    {l}
                  </span>
                </span>
              ))}
            </h3>
            <div className="mt-[clamp(32px,4vw,56px)] flex items-center gap-4 border-t border-[var(--sx-line)] pt-6">
              <Avatar name={s.name} i={i + 1} size={48} />
              <div>
                <p className="text-[17px] font-[650]">{s.name}</p>
                <p className="text-[14px] text-[var(--sx-muted)]">{s.role}</p>
              </div>
              <span className="ml-auto max-md:hidden">
                <Btn kind="ghost">Reserve a room · from ₹14,500</Btn>
              </span>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ---------------------------------------------------------------------------------------------------------------- */

/** SP15 · Video quote card + tall colour quote: heading; a 5-column grid with a wide card (3 cols) over a looping
 *  video, a big quote and an author row with a play button; beside it a tall saturated colour card (2 cols, 2 rows)
 *  with another quote, author pinned to the bottom. Motion M13: the video opens out of its frame with the scroll. */
function SP15() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M13");
  return (
    <Sec innerRef={r} theme="stone" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <style>{`
        @keyframes sp15-cam { 0% { scale: 1.06; translate: -2% 1% } 100% { scale: 1.14; translate: 2% -1.5% } }
        @keyframes sp15-light { from { transform: translateX(-60%) } to { transform: translateX(160%) } }
        @keyframes sp15-ring { 0% { transform: scale(1); opacity: .7 } 100% { transform: scale(1.9); opacity: 0 } }
        @keyframes sp15-blob { 0% { transform: translate(0,0) scale(1) } 33% { transform: translate(-18%,12%) scale(1.15) } 66% { transform: translate(10%,22%) scale(.9) } 100% { transform: translate(0,0) scale(1) } }
        .sp15-cam { animation: sp15-cam 6s ease-in-out infinite alternate; }
        .sp15-light { animation: sp15-light 3.2s linear infinite; }
        .sp15-ring { animation: sp15-ring 1.6s ease-out infinite; }
        .sp15-blob { animation: sp15-blob 9s linear infinite; }
        html.is-static .sp15-cam, html.is-static .sp15-light, html.is-static .sp15-ring, html.is-static .sp15-blob { animation: none; }
        html.is-static { .sp15-cam, .sp15-light, .sp15-ring, .sp15-blob { animation: none; } }
        html.is-static .sp15-light { opacity: 0; }
      `}</style>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[14ch] text-[clamp(44px,5.6vw,92px)]">Stronger, by their own account.</H>
        <P className="max-w-[36ch] pb-2">3,200 members train with Forge Studio across four cities. Here are two of them.</P>
      </div>

      <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 gap-[clamp(12px,1.4vw,20px)] md:grid-cols-5 md:grid-rows-[auto_auto]">
        {/* wide video card */}
        <div className="relative min-h-[clamp(380px,34vw,520px)] overflow-hidden rounded-[var(--sx-radius)] bg-[#0b0d10] md:col-span-3">
          <div className="sp15-cam absolute inset-0">
            <Pic i={3} ratio="auto" round={false} label="" className="absolute inset-0 h-full w-full" />
          </div>
          <div className="sp15-light pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-[linear-gradient(100deg,transparent,rgba(255,255,255,.14),transparent)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,10,12,.15),rgba(8,10,12,.35)_45%,rgba(8,10,12,.88))]" />
          <div className="relative flex h-full min-h-[inherit] flex-col justify-end p-[clamp(24px,3vw,48px)] text-white">
            <p className="text-[12px] font-[600] uppercase tracking-[0.18em] text-white/70">0:42 · Member film</p>
            <blockquote className="mt-4 max-w-[26ch] text-[clamp(26px,2.5vw,40px)] font-[650] leading-[1.12] tracking-[-0.01em]">&ldquo;I deadlifted my body weight at 52. My knees have never felt better.&rdquo;</blockquote>
            <div className="mt-7 flex items-center gap-4">
              <Avatar name="Usha Raman" i={2} size={44} />
              <div>
                <p className="text-[16px] font-[650]">Usha Raman</p>
                <p className="text-[14px] text-white/70">Strength block, 14 months</p>
              </div>
              <button aria-label="Play film" className="relative ml-auto grid h-16 w-16 place-items-center rounded-full bg-white text-[#0b0d10]">
                <span className="sp15-ring absolute inset-0 rounded-full border-2 border-white" />
                <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6" fill="currentColor">
                  <path d="M7 4.5v15l13-7.5z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* tall colour card */}
        <div className="relative flex min-h-[420px] flex-col justify-between overflow-hidden rounded-[var(--sx-radius)] bg-[var(--sx-accent)] p-[clamp(24px,3vw,48px)] text-[var(--sx-accent-text)] md:col-span-2 md:row-span-2">
          <div className="sp15-blob pointer-events-none absolute -right-[20%] -top-[10%] aspect-square w-[85%] rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,.22),transparent)]" />
          <div className="relative">
            <Stars n={5} />
            <blockquote className="sx-display mt-6 text-[clamp(30px,3vw,50px)] font-[700] leading-[1.05] tracking-[-0.02em]">
              &ldquo;The coaches write you a plan, then actually watch you lift it.&rdquo;
            </blockquote>
            <p className="mt-6 max-w-[34ch] text-[16px] leading-relaxed text-[color-mix(in_srgb,var(--sx-accent-text)_78%,transparent)]">Small groups of six, a coach who knows your numbers, and a recovery room that is not an afterthought.</p>
          </div>
          <div className="relative mt-10 flex items-center gap-4 border-t border-white/25 pt-6">
            <Avatar name="Farhan Ali" i={4} size={44} />
            <div>
              <p className="text-[16px] font-[650]">Farhan Ali</p>
              <p className="text-[14px] text-[color-mix(in_srgb,var(--sx-accent-text)_72%,transparent)]">Hybrid plan, Bengaluru</p>
            </div>
          </div>
        </div>

        {/* second row under the video */}
        <div className="sx-card flex flex-col justify-between p-[clamp(22px,2.4vw,36px)] md:col-span-1">
          <p className="sx-display text-[clamp(44px,4.4vw,72px)] font-[800] leading-none tracking-[-0.03em]">4.9</p>
          <p className="mt-3 text-[14px] text-[var(--sx-muted)]">average from 1,840 member reviews</p>
        </div>
        <div className="sx-card flex flex-col justify-between gap-6 p-[clamp(22px,2.4vw,36px)] md:col-span-2">
          <p className="text-[clamp(17px,1.4vw,21px)] leading-snug">&ldquo;Three months in, my resting heart rate dropped by eleven. I stopped taking the lift at work.&rdquo;</p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-[14px] text-[var(--sx-muted)]">Kavya Shetty · Conditioning</p>
            <Btn kind="link">Try a week · ₹999 →</Btn>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "SP13", name: "Testimonial switcher with stacked portraits", motion: "M40", C: SP13 },
  { code: "SP14", name: "Rotated label rail + progress-timed quote", motion: "M23", C: SP14 },
  { code: "SP15", name: "Video quote card + tall colour quote", motion: "M13", C: SP15 },
];
