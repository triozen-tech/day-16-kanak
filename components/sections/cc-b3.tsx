"use client";

// CC · Contact layouts, batch 3 (CC05–CC06). Full designed sections; ?static=1 shows each in its final state.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const field = "mt-2 w-full rounded-[12px] border border-[var(--sx-line)] bg-[var(--sx-surface)] px-4 py-3.5 text-[15px] text-[var(--sx-text)] placeholder:text-[var(--sx-muted)]";

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

/* ───────────────────────── CC05 · Narrow form with topic chips ───────────────────────── */

const CC05_CSS = `
.cc05-blob{animation:cc05-blob 5.2s ease-in-out infinite alternate}
@keyframes cc05-blob{from{transform:translate(-18%,-6%) scale(1)}to{transform:translate(22%,10%) scale(1.18)}}
.cc05-caret{animation:cc05-caret .9s steps(1) infinite}
@keyframes cc05-caret{50%{opacity:0}}
html.is-static .cc05-blob,html.is-static .cc05-caret{animation:none}
html.is-static {.cc05-blob,.cc05-caret{animation:none}}
`;

const CC05_TOPICS = [
  { k: "Catering", msg: "Forty croissants and two sourdough loaves for an office breakfast on Friday, 8 am?" },
  { k: "Wholesale", msg: "We run a café in Bandra and would like six loaves and a tray of buns, daily from Monday." },
  { k: "Birthday cakes", msg: "A two-tier chocolate and orange cake for twenty, with a short message piped on top." },
  { k: "Other", msg: "Do you run weekend baking classes? Two of us would love to learn laminated dough." },
];

/** CC05 · A narrow centred form (name, phone, email, topic chips, message, Send) with the bakery's contact details in
 *  small type to the right. Fields rise, chips snap in from the sides (M34); a topic is auto-selected in turn and the
 *  message rewrites itself to match. */
function CC05() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  const [i, setI] = useAutoCycle(r, CC05_TOPICS.length, 1900);
  const t = CC05_TOPICS[i];
  return (
    <Sec innerRef={r} theme="paper" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <style>{CC05_CSS}</style>
      <div className="pointer-events-none absolute left-1/2 top-[18%] aspect-square w-[min(760px,70vw)] -translate-x-1/2">
        <div className="cc05-blob h-full w-full rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_22%,transparent),transparent)]" />
      </div>
      <div className="relative grid grid-cols-1 gap-[clamp(32px,4vw,64px)] md:grid-cols-[minmax(0,1fr)_minmax(0,560px)_minmax(0,1fr)]">
        <div className="hidden md:block" />
        <form onSubmit={(e) => e.preventDefault()} className="min-w-0">
          <H className="text-center text-[clamp(44px,4.6vw,76px)]">Order ahead, or just say hello.</H>
          <P className="mx-auto mt-5 max-w-[40ch] text-center">Tell us what you need and the head baker writes back before the evening bake.</P>
          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label data-m-text className="block text-[14px] font-[600] md:col-span-2">
              Name
              <input readOnly value="Ira Menon" className={field} />
            </label>
            <label data-m-text className="block text-[14px] font-[600]">
              Phone
              <input readOnly placeholder="Your number" className={field} />
            </label>
            <label data-m-text className="block text-[14px] font-[600]">
              Email
              <input readOnly value="ira.menon@inbox.example" className={field} />
            </label>
          </div>
          <p data-m-text className="mt-6 text-[14px] font-[600]">What is it about?</p>
          <div className="mt-3 flex flex-wrap gap-2" role="radiogroup">
            {CC05_TOPICS.map((x, k) => (
              <button
                key={x.k}
                type="button"
                data-m-card
                role="radio"
                aria-checked={k === i}
                onClick={() => setI(k)}
                className={`rounded-full border px-5 py-2.5 text-[15px] font-[600] transition-[background,color,border-color] duration-300 ${k === i ? "border-[var(--sx-accent)] bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "border-[var(--sx-line)] bg-[var(--sx-surface)] text-[var(--sx-text)]"}`}
              >
                {k === i && <span className="mr-1.5">✓</span>}
                {x.k}
              </button>
            ))}
          </div>
          <label data-m-text className="mt-6 block text-[14px] font-[600]">
            Message
            <div className={`${field} min-h-[120px] leading-relaxed`}>
              <span key={t.k}>{t.msg}</span>
              <span className="cc05-caret ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[3px] bg-[var(--sx-accent)]" />
            </div>
          </label>
          <div data-m-text className="mt-7 flex flex-wrap items-center justify-between gap-4">
            <Btn>Send to the bakery</Btn>
            <p className="text-[13px] text-[var(--sx-muted)]">Replies within 6 hours</p>
          </div>
        </form>
        <aside data-m-text className="text-[14px] leading-relaxed text-[var(--sx-muted)] md:self-end md:pb-3 md:pl-[clamp(8px,2vw,40px)]">
          <p className="sx-display text-[22px] text-[var(--sx-text)]">Hearth &amp; Rye</p>
          <p className="mt-3">12 Chapel Road, Bandra West</p>
          <p>Ovens on from 5 am</p>
          <p className="mt-4">Shop open 7 am – 8 pm</p>
          <p>Closed on Tuesdays</p>
          <p className="mt-4 text-[var(--sx-text)]">hello@hearthrye.example</p>
          <p className="mt-4">Catering from ₹2,400 · minimum 24 h notice</p>
        </aside>
      </div>
    </Sec>
  );
}

/* ───────────────────────── CC06 · Centred form + support link cards ───────────────────────── */

const CC06_CSS = `
.cc06-sheen{animation:cc06-sheen 3.2s linear infinite}
@keyframes cc06-sheen{from{transform:translateX(-120%) skewX(-18deg)}to{transform:translateX(320%) skewX(-18deg)}}
.cc06-orb{animation:cc06-orb 6s ease-in-out infinite alternate}
@keyframes cc06-orb{from{transform:translate(-30%,0) scale(.9)}to{transform:translate(30%,-12%) scale(1.15)}}
.cc06-arrow{animation:cc06-arrow 1.4s ease-in-out infinite}
@keyframes cc06-arrow{0%,100%{transform:translateX(0)}50%{transform:translateX(8px)}}
html.is-static .cc06-sheen,html.is-static .cc06-orb,html.is-static .cc06-arrow{animation:none}
html.is-static .cc06-sheen{opacity:0}
html.is-static {.cc06-sheen,.cc06-orb,.cc06-arrow{animation:none}.cc06-sheen{opacity:0}}
`;

/** CC06 · Centred title, a centred form card (first/last name, email/phone, details, submit) and below it three link
 *  cards to other ways of getting help. The form card unfolds from its corner, then the link cards follow (M18). */
function CC06() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M18");
  const links = [
    { t: "Help centre", d: "Shipping, returns and how to brew each blend.", c: "86 articles" },
    { t: "Common questions", d: "Caffeine levels, storage and subscription changes.", c: "Answered in 2 min" },
    { t: "Talk to sales", d: "Gifting for teams, hotels and wholesale orders.", c: "From 50 tins" },
  ];
  return (
    <Sec innerRef={r} theme="ink" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <style>{CC06_CSS}</style>
      <div className="pointer-events-none absolute left-1/2 top-[22%] aspect-square w-[min(820px,80vw)] -translate-x-1/2">
        <div className="cc06-orb h-full w-full rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_30%,transparent),transparent)]" />
      </div>
      <div className="relative mx-auto max-w-[720px] text-center">
        <H className="text-[clamp(44px,5vw,84px)]">Questions about your tea?</H>
        <P className="mx-auto mt-5 max-w-[44ch]">Write to the people who blend it. Every message is read by our tasting team in Darjeeling.</P>
      </div>
      <form data-m-card onSubmit={(e) => e.preventDefault()} className="sx-card relative mx-auto mt-[clamp(40px,5vw,64px)] max-w-[720px] overflow-hidden bg-[var(--sx-surface)] p-[clamp(26px,3vw,48px)] shadow-[0_40px_90px_-40px_rgba(0,0,0,.7)]">
        <div className="cc06-sheen pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.07),transparent)]" />
        <div className="relative grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block text-[14px] font-[600]">
            First name
            <input readOnly value="Kabir" className={field.replace("bg-[var(--sx-surface)]", "bg-[var(--sx-bg)]")} />
          </label>
          <label className="block text-[14px] font-[600]">
            Last name
            <input readOnly value="Shah" className={field.replace("bg-[var(--sx-surface)]", "bg-[var(--sx-bg)]")} />
          </label>
          <label className="block text-[14px] font-[600]">
            Email
            <input readOnly value="kabir.shah@inbox.example" className={field.replace("bg-[var(--sx-surface)]", "bg-[var(--sx-bg)]")} />
          </label>
          <label className="block text-[14px] font-[600]">
            Phone
            <input readOnly placeholder="Optional" className={field.replace("bg-[var(--sx-surface)]", "bg-[var(--sx-bg)]")} />
          </label>
          <label className="block text-[14px] font-[600] md:col-span-2">
            Details
            <textarea readOnly rows={4} value="My monthly Muscatel tin arrived with a broken seal. Could you send a replacement before the 20th?" className={`${field.replace("bg-[var(--sx-surface)]", "bg-[var(--sx-bg)]")} resize-none leading-relaxed`} />
          </label>
        </div>
        <div className="relative mt-7 flex flex-wrap items-center justify-between gap-4">
          <p className="text-[13px] text-[var(--sx-muted)]">We reply within one working day.</p>
          <Btn>Send message</Btn>
        </div>
      </form>
      <div className="relative mx-auto mt-[clamp(16px,2vw,24px)] grid max-w-[1080px] grid-cols-1 gap-[clamp(12px,1.4vw,20px)] md:grid-cols-3">
        {links.map((l) => (
          <a key={l.t} data-m-card href="#" onClick={(e) => e.preventDefault()} className="sx-card group flex flex-col justify-between gap-8 p-[clamp(22px,2.4vw,32px)] transition-colors hover:border-[var(--sx-accent)]">
            <div>
              <p className="flex items-center justify-between text-[19px] font-[650]">
                {l.t}
                <span className="cc06-arrow text-[22px] text-[var(--sx-accent)]">→</span>
              </p>
              <p className="mt-2 text-[15px] leading-relaxed text-[var(--sx-muted)]">{l.d}</p>
            </div>
            <p className="text-[13px] uppercase tracking-[0.12em] text-[var(--sx-muted)]">{l.c}</p>
          </a>
        ))}
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "CC05", name: "Narrow form with topic chips", motion: "M34", C: CC05 },
  { code: "CC06", name: "Centred form + support link cards", motion: "M18", C: CC06 },
];
