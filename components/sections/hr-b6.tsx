"use client";

// HR · Hero layouts, batch 6 (HR39–HR43). Each is a full designed section; motion via useSectionMotion plus small
// on-screen timers for the hands-free parts. ?static=1 shows every hero in its final state. None is a "portal" opening.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Pic, Price, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Steps an index every `ms` while the section is on screen (stops off screen and in ?static=1 / reduced motion). */
function useAutoCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms = 2400) {
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

/* Shared CSS loops (the never-frozen safety net): a big accent glow that travels linearly, and slow Ken Burns pushes.
   All stop under html.is-static. */
const HR6_CSS = `
.hr6-glow{animation:hr6-glow 4.2s linear infinite alternate}
@keyframes hr6-glow{from{translate:-14% -8%}to{translate:16% 10%}}
.hr6-glow2{animation:hr6-glow2 5.6s linear infinite alternate}
@keyframes hr6-glow2{from{translate:12% 6%;opacity:.55}to{translate:-12% -6%;opacity:1}}
.hr6-kb{animation:hr6-kb 6s linear infinite alternate}
@keyframes hr6-kb{from{scale:1;translate:0 0}to{scale:1.1;translate:-2% -1.5%}}
.hr6-bar{animation:hr6-bar var(--d,2.6s) linear both}
@keyframes hr6-bar{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.hr6-wave{animation:hr6-wave 1.6s ease-in-out infinite alternate}
@keyframes hr6-wave{from{opacity:.35}to{opacity:1}}
html.is-static .hr6-glow,html.is-static .hr6-glow2,html.is-static .hr6-kb,html.is-static .hr6-wave{animation:none}
html.is-static .hr6-bar{animation:none;transform:scaleX(1)}
html.is-static {.hr6-glow,.hr6-glow2,.hr6-kb,.hr6-wave{animation:none}.hr6-bar{animation:none;transform:scaleX(1)}}
`;

const glow = (c = "var(--sx-accent)", pct = 45) => `radial-gradient(closest-side, color-mix(in srgb, ${c} ${pct}%, transparent), transparent)`;

/* ───────────────────────── HR39 · Form-in-hero with edge-bleeding photo ───────────────────────── */

/** HR39 · Left 5/12: H1, a line of copy and a stacked sign-up form (pass button, "or" rule, three fields, full-width
 *  submit). The right half is a full-height photo that runs to the viewport edge and scales down into place (M13). */
function HR39() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M13");
  const field = "mt-2 w-full rounded-[10px] border border-[var(--sx-line)] bg-[var(--sx-surface)] px-4 py-3 text-[15px] text-[var(--sx-text)]";
  return (
    <Sec innerRef={r} theme="stone" font="condensed" className="py-[clamp(72px,9vw,140px)]" style={{ ["--sx-accent" as string]: "#d9442b", ["--sx-accent-text" as string]: "#fff5f2" }}>
      <style>{HR6_CSS}</style>
      <div className="hr6-glow pointer-events-none absolute -left-[10%] top-[6%] aspect-square w-[min(62vw,820px)] rounded-full" style={{ background: glow("var(--sx-accent)", 38) }} />

      {/* photo: absolutely placed, runs full height to the right viewport edge */}
      <div className="relative mb-10 aspect-[4/3] overflow-hidden rounded-[18px] md:absolute md:inset-y-0 md:right-0 md:mb-0 md:aspect-auto md:w-[50%] md:rounded-none">
        <div className="fx-pan absolute -inset-[3%]">
          <Pic i={2} ratio="auto" round={false} label="" className="absolute inset-0 h-full w-full" />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(17,20,24,.55))]" />
        <div className="absolute bottom-[clamp(20px,3vw,44px)] left-[clamp(20px,3vw,44px)] rounded-[16px] border border-white/20 bg-black/35 px-5 py-4 text-white backdrop-blur-md">
          <p className="text-[12px] uppercase tracking-[0.14em] text-white/70">Next class · 6:30 am</p>
          <p className="mt-1 text-[18px] font-[650]">Strength, level 2 · 4 spots left</p>
        </div>
      </div>

      <div className="relative z-10 md:w-[41.6%] md:pr-[clamp(0px,2vw,32px)]">
        <H as="h1" className="text-[clamp(52px,5.6vw,96px)] uppercase leading-[0.9]">Train with people who show up.</H>
        <P className="mt-5 max-w-[40ch]">Forge House is a members&apos; gym with coaches on every floor. Your first week is on us, no card needed.</P>

        <form onSubmit={(e) => e.preventDefault()} className="mt-8 max-w-[440px]">
          <button type="button" className="flex w-full items-center justify-center gap-3 rounded-full border border-[var(--sx-line)] bg-[var(--sx-surface)] px-5 py-3.5 text-[15px] font-[650]">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--sx-text)] text-[12px] font-[800] text-[var(--sx-bg)]">P</span>
            Continue with Pulse ID
          </button>
          <div className="my-5 flex items-center gap-4 text-[13px] text-[var(--sx-muted)]">
            <span className="h-px flex-1 bg-[var(--sx-line)]" />
            or
            <span className="h-px flex-1 bg-[var(--sx-line)]" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block text-[13px] font-[600] text-[var(--sx-muted)]">
              First name
              <input readOnly value="Rhea" className={field} />
            </label>
            <label className="block text-[13px] font-[600] text-[var(--sx-muted)]">
              Home club
              <input readOnly value="Bandra West" className={field} />
            </label>
            <label className="block text-[13px] font-[600] text-[var(--sx-muted)] md:col-span-2">
              Email
              <input readOnly value="rhea@inbox.example" className={field} />
            </label>
          </div>
          <Btn className="mt-6 w-full justify-center">Claim my free week</Btn>
          <p className="mt-4 text-[13px] text-[var(--sx-muted)]">
            Then <Price now="₹3,900" className="text-[var(--sx-text)]" /> a month · pause any time
          </p>
        </form>
      </div>
    </Sec>
  );
}

/* ───────────────────────── HR40 · Filmstrip hero, focused card unfurls ───────────────────────── */

const DROPS = [
  { i: 3, t: "Monsoon linen", d: "Washed indigo shirts and wide trousers, cut in Jaipur.", p: "₹4,200", tag: "Jun" },
  { i: 1, t: "Festive whites", d: "Chikankari on handloom cotton, finished by hand.", p: "₹5,800", tag: "Oct" },
  { i: 2, t: "Winter wool", d: "Kullu weaves, loose and warm, in four greys.", p: "₹7,400", tag: "Dec" },
  { i: 0, t: "Summer khadi", d: "Hand-spun, breathable, made for 40 degrees.", p: "₹3,600", tag: "Mar" },
  { i: 3, t: "Resort edit", d: "Easy co-ords in clay, sand and sea-glass green.", p: "₹4,900", tag: "Apr" },
  { i: 1, t: "Studio basics", d: "The tee, the trouser, the overshirt. Every day.", p: "₹2,400", tag: "All year" },
];

/** HR40 · A row of six cards sharing one top edge across the width; the focused card unfurls to full height and
 *  carries the headline, its neighbours stay short strips with a caption under them. Auto-advances; cards unfold from
 *  their corner on entry (M18). */
function HR40() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M18");
  const [i, setI] = useAutoCycle(r, DROPS.length, 2300);
  return (
    <Sec innerRef={r} theme="ink" font="wide" className="py-[clamp(48px,6vw,96px)]" style={{ ["--sx-accent" as string]: "#e0b66a", ["--sx-accent-text" as string]: "#1a1308" }}>
      <style>{HR6_CSS}</style>
      <div className="hr6-glow2 pointer-events-none absolute bottom-[-20%] right-[-10%] aspect-square w-[min(70vw,900px)] rounded-full" style={{ background: glow("var(--sx-accent)", 36) }} />
      <div className="relative z-10 flex h-[clamp(600px,88svh,880px)] items-start gap-[clamp(8px,0.9vw,14px)] max-md:h-auto max-md:flex-col">
        {DROPS.map((c, k) => {
          const on = k === i;
          return (
            <div key={c.t} className="flex h-full min-w-0 flex-col transition-[flex-grow] duration-[900ms] ease-[cubic-bezier(.7,0,.2,1)] max-md:w-full" style={{ flex: `${on ? 4.2 : 1} 1 0` }}>
              <div
                role="button"
                tabIndex={0}
                data-m-card
                onClick={() => setI(k)}
                aria-label={c.t}
                className="relative w-full overflow-hidden rounded-[clamp(12px,1.2vw,20px)] text-left transition-[height] duration-[900ms] ease-[cubic-bezier(.7,0,.2,1)] max-md:h-[240px]!"
                style={{ height: on ? "100%" : "38%" }}
              >
                <div className={`absolute inset-0 ${on ? "hr6-kb" : ""}`}>
                  <Pic i={c.i} ratio="auto" round={false} label="" className="absolute inset-0 h-full w-full" />
                </div>
                <div className={`absolute inset-0 transition-opacity duration-700 ${on ? "bg-[linear-gradient(180deg,rgba(7,9,15,.05)_30%,rgba(7,9,15,.85))]" : "bg-[rgba(7,9,15,.35)]"}`} />
                <span className="absolute left-4 top-4 rounded-full bg-black/40 px-3 py-1 text-[12px] font-[650] uppercase tracking-[0.12em] text-white backdrop-blur">{c.tag}</span>
                <div className={`absolute inset-x-0 bottom-0 p-[clamp(20px,2.4vw,40px)] text-white transition-[opacity,translate] duration-700 ${on ? "translate-y-0 opacity-100 delay-300" : "translate-y-6 opacity-0"}`}>
                  <H as={k === 0 ? "h1" : "h2"} className="max-w-[11ch] text-[clamp(34px,3.6vw,62px)]">
                    {c.t}
                  </H>
                  <p className="mt-4 max-w-[34ch] text-[16px] leading-relaxed text-white/80">{c.d}</p>
                  <div className="mt-6 flex flex-wrap items-center gap-4">
                    <Btn>Shop the drop</Btn>
                    <span className="text-[15px]">
                      from <Price now={c.p} />
                    </span>
                  </div>
                </div>
              </div>
              <div className={`mt-4 transition-opacity duration-500 max-md:hidden ${on ? "opacity-0" : "opacity-100"}`}>
                <p className="truncate text-[15px] font-[650]">{c.t}</p>
                <p className="mt-1 text-[13px] text-[var(--sx-muted)]">from {c.p}</p>
                <span className="mt-4 block h-[3px] w-full overflow-hidden rounded-full bg-[var(--sx-line)]">
                  {k === (i + 1) % DROPS.length && <span key={i} className="hr6-bar block h-full origin-left bg-[var(--sx-accent)]" style={{ ["--d" as string]: "2.3s" }} />}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Sec>
  );
}

/* ───────────────────────── HR41 · Search-bar hero over fading architecture ───────────────────────── */

const PLACES = [
  { loc: "Assagao, North Goa", type: "Villa", budget: "₹2–4 Cr" },
  { loc: "Coonoor, Nilgiris", type: "Cottage", budget: "₹1–2 Cr" },
  { loc: "Alibaug, Maharashtra", type: "Farmhouse", budget: "₹3–6 Cr" },
  { loc: "Kasauli, Himachal", type: "Apartment", budget: "₹80 L–1.5 Cr" },
];

/** HR41 · Centred headline and a wide rounded search bar (location / type / budget + button) that fills itself in
 *  turn; below, a full-width building photo whose top fades into the page; a two-part statement splits left/right
 *  under it. Words rise from blur (M6). */
function HR41() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M6");
  const [i] = useAutoCycle(r, PLACES.length, 2000);
  const p = PLACES[i];
  const seg = (k: string, v: string, wide = false) => (
    <div className={`min-w-0 px-[clamp(16px,2vw,28px)] py-3 ${wide ? "md:flex-[1.6]" : "md:flex-1"} max-md:border-b max-md:border-[var(--sx-line)] md:border-r md:border-[var(--sx-line)]`}>
      <p className="text-[12px] font-[650] uppercase tracking-[0.14em] text-[var(--sx-muted)]">{k}</p>
      <p key={v} className="hr6-wave mt-1 truncate text-[17px] font-[600] [animation-iteration-count:1]">{v}</p>
    </div>
  );
  return (
    <Sec innerRef={r} theme="paper" font="grotesk" className="pt-[clamp(72px,9vw,140px)] pb-[clamp(56px,7vw,110px)]" style={{ ["--sx-accent" as string]: "#2f6b57", ["--sx-accent-text" as string]: "#f4fbf7" }}>
      <style>{HR6_CSS}</style>
      <div className="pointer-events-none absolute inset-x-0 top-[-12%] flex justify-center">
        <div className="hr6-glow aspect-square w-[min(80vw,1000px)] shrink-0 rounded-full" style={{ background: glow("var(--sx-accent)", 36) }} />
      </div>
      <div className="relative z-10 mx-auto max-w-[1000px] text-center">
        <H as="h1" className="mx-auto max-w-[15ch] text-[clamp(48px,6.4vw,108px)]">Homes with room to breathe.</H>
        <P className="mx-auto mt-6 max-w-[48ch]">Hill cottages, coast villas and farmhouses, each one walked through by our own team before it goes live.</P>

        <div data-m-card className="mx-auto mt-[clamp(32px,4vw,56px)] flex flex-col items-stretch rounded-[28px] border border-[var(--sx-line)] bg-[var(--sx-surface)] p-2 text-left shadow-[0_30px_70px_-40px_rgba(28,24,19,.45)] md:flex-row md:items-center md:rounded-full">
          {seg("Location", p.loc, true)}
          {seg("Type", p.type)}
          <div className="min-w-0 px-[clamp(16px,2vw,28px)] py-3 md:flex-1">
            <p className="text-[12px] font-[650] uppercase tracking-[0.14em] text-[var(--sx-muted)]">Budget</p>
            <p key={p.budget} className="hr6-wave mt-1 truncate text-[17px] font-[600] [animation-iteration-count:1]">{p.budget}</p>
          </div>
          <Btn className="m-1 justify-center md:px-8!">Search homes</Btn>
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-2 text-[14px]">
          {["Sea view", "Pet friendly", "Ready to move", "Under ₹1 Cr"].map((t) => (
            <span key={t} className="rounded-full border border-[var(--sx-line)] px-4 py-1.5 text-[var(--sx-muted)]">
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="relative -mx-[clamp(20px,5vw,96px)] mt-[clamp(32px,4vw,64px)] h-[clamp(380px,40vw,600px)] overflow-hidden [mask-image:linear-gradient(180deg,transparent,#000_42%)]">
        <div className="hr6-kb absolute -inset-[2%]">
          <Pic i={0} ratio="auto" round={false} label="" className="absolute inset-0 h-full w-full" />
        </div>
      </div>

      <div className="relative z-10 mt-[clamp(32px,4vw,56px)] grid grid-cols-1 items-end gap-8 md:grid-cols-2">
        <p data-m-text className="sx-display text-[clamp(32px,3.4vw,56px)] font-[700] leading-[1.02] tracking-[-0.02em]">
          1,240 homes.
          <br />
          Forty towns.
        </p>
        <div className="md:justify-self-end md:text-right">
          <P className="max-w-[38ch] md:ml-auto">No pay-to-list, no duplicate ads. A local agent answers within the hour, seven days a week.</P>
          <div className="mt-5">
            <Btn kind="link">How we vet a listing →</Btn>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── HR42 · Full-screen crossfading slideshow ───────────────────────── */

const SLIDES = [
  { i: 3, t: "The Courtyard Suite", n: "Room 04" },
  { i: 1, t: "Breakfast on the terrace", n: "Mornings" },
  { i: 2, t: "The stepwell pool", n: "Afternoons" },
  { i: 0, t: "Dinner by lamplight", n: "Evenings" },
];

/** HR42 · Viewport-height stack of full-bleed photos that crossfade on their own (and with ← / →), a dark overlay,
 *  and a centred headline + one outlined CTA that stay put while the images change. Images scale down into their
 *  frame on scroll (M13). */
function HR42() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M13");
  const [i, setI] = useAutoCycle(r, SLIDES.length, 2600);
  useEffect(() => {
    const el = r.current;
    if (!el) return;
    let on = false;
    const io = new IntersectionObserver(([e]) => (on = e.isIntersecting));
    io.observe(el);
    const key = (e: KeyboardEvent) => {
      if (!on) return;
      if (e.key === "ArrowRight") setI((v) => (v + 1) % SLIDES.length);
      if (e.key === "ArrowLeft") setI((v) => (v - 1 + SLIDES.length) % SLIDES.length);
    };
    window.addEventListener("keydown", key);
    return () => {
      io.disconnect();
      window.removeEventListener("keydown", key);
    };
  }, [setI]);
  const s = SLIDES[i];
  return (
    <Sec innerRef={r} theme="ink" font="editorial" full style={{ ["--sx-accent" as string]: "#e8c48a" }}>
      <style>{HR6_CSS}</style>
      <div className="relative h-[clamp(620px,100svh,980px)] overflow-hidden">
        {SLIDES.map((x, k) => (
          <div key={k} className="absolute inset-0 transition-opacity duration-[1200ms] ease-in-out" style={{ opacity: k === i ? 1 : 0 }}>
            <div className="hr6-kb absolute inset-0" style={{ animationDelay: `${-k * 1.5}s` }}>
              <Pic i={x.i} ratio="auto" round={false} label="" className="absolute inset-0 h-full w-full" />
            </div>
          </div>
        ))}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(7,9,15,.55),rgba(7,9,15,.35)_70%),linear-gradient(180deg,rgba(7,9,15,.3),rgba(7,9,15,.1)_40%,rgba(7,9,15,.75))]" />
        <div className="hr6-glow2 pointer-events-none absolute left-[20%] top-[10%] aspect-square w-[min(60vw,780px)] rounded-full mix-blend-screen" style={{ background: glow("var(--sx-accent)", 40) }} />

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-white">
          <H as="h1" className="max-w-[13ch] text-[clamp(56px,8vw,140px)] font-[500] text-white">A haveli that slows the clock.</H>
          <p data-m-text className="mt-6 max-w-[44ch] text-[clamp(16px,1.2vw,19px)] leading-relaxed text-white/80">
            Fourteen rooms around a sandstone courtyard in old Jodhpur. From ₹18,500 a night, breakfast included.
          </p>
          <div className="mt-10">
            <Btn kind="ghost" className="border-white/70! text-white!">
              Check availability
            </Btn>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-6 px-[clamp(20px,5vw,96px)] pb-[clamp(24px,3vw,44px)] text-white">
          <div className="min-w-0">
            <p className="text-[12px] uppercase tracking-[0.16em] text-white/60">{s.n}</p>
            <p key={s.t} className="hr6-wave mt-1 text-[clamp(18px,1.5vw,24px)] [animation-iteration-count:1]">
              {s.t}
            </p>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex gap-2">
              {SLIDES.map((_, k) => (
                <span key={k} className="block h-[3px] w-[clamp(36px,4vw,64px)] overflow-hidden rounded-full bg-white/25">
                  {k === i ? <span key={i} className="hr6-bar block h-full origin-left bg-white" /> : k < i ? <span className="block h-full bg-white/70" /> : null}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              {["←", "→"].map((a, k) => (
                <button key={a} type="button" aria-label={k ? "Next" : "Previous"} onClick={() => setI((v) => (k ? v + 1 : v - 1 + SLIDES.length) % SLIDES.length)} className="grid h-11 w-11 place-items-center rounded-full border border-white/40 text-[16px]">
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── HR43 · Small vignette image above a narrow title ───────────────────────── */

/** HR43 · A floating pill nav, then a very calm centred stack in max-w-xl: a 3:2 image with a radial vignette that
 *  melts into the page, a serif headline (max-w-md), one line and one button. Words rise from blur (M6). */
function HR43() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M6");
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="pb-[clamp(88px,11vw,170px)] pt-[clamp(20px,2.4vw,32px)]" style={{ ["--sx-accent" as string]: "#a8743c" }}>
      <style>{HR6_CSS}</style>
      <nav className="relative z-10 mx-auto flex w-fit items-center gap-[clamp(16px,2.4vw,36px)] rounded-full border border-[var(--sx-line)] bg-[color-mix(in_srgb,var(--sx-surface)_80%,transparent)] py-2 pl-6 pr-2 text-[14px] shadow-[0_18px_40px_-28px_rgba(28,24,19,.4)] backdrop-blur-md">
        <span className="sx-display text-[19px] font-[600] italic">Ilam</span>
        <span className="hidden gap-6 text-[var(--sx-muted)] md:flex">
          <span>Teas</span>
          <span>Teaware</span>
          <span>Journal</span>
        </span>
        <span className="rounded-full bg-[var(--sx-text)] px-4 py-2 text-[var(--sx-bg)]">Bag · 0</span>
      </nav>

      <div className="relative mx-auto mt-[clamp(56px,7vw,110px)] max-w-xl text-center">
        <div className="pointer-events-none absolute inset-x-[-40%] top-[-10%] flex justify-center">
          <div className="hr6-glow aspect-square w-[min(90vw,760px)] shrink-0 rounded-full" style={{ background: glow("var(--sx-accent)", 40) }} />
        </div>
        <div className="relative aspect-[3/2] overflow-hidden [mask-image:radial-gradient(ellipse_62%_62%_at_50%_50%,#000_42%,transparent_100%)]">
          <div className="fx-drift absolute inset-0">
            <div className="fx-pan absolute -inset-[4%]">
              <Pic i={1} ratio="auto" round={false} label="" className="absolute inset-0 h-full w-full" />
            </div>
          </div>
        </div>
        <H as="h1" className="relative mx-auto mt-6 max-w-md text-[clamp(44px,4.6vw,76px)] font-[500]">A tea for the quiet hour.</H>
        <P className="relative mx-auto mt-5 max-w-[38ch]">Second-flush Ilam oolong, rolled by hand and picked above 1,800 m. ₹1,150 for 50 g.</P>
        <div className="relative mt-9">
          <Btn>Taste the harvest</Btn>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "HR39", name: "Form-in-hero with edge-bleeding photo", motion: "M13", C: HR39 },
  { code: "HR40", name: "Filmstrip hero, focused card unfurls", motion: "M18", C: HR40 },
  { code: "HR41", name: "Search-bar hero over fading architecture", motion: "M6", C: HR41 },
  { code: "HR42", name: "Full-screen crossfading slideshow", motion: "M13", C: HR42 },
  { code: "HR43", name: "Small vignette image above a narrow title", motion: "M6", C: HR43 },
];
