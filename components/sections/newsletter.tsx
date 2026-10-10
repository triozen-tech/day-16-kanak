"use client";

// NL · Newsletter layouts (docs/SECTION-MENU.md). Forms are demo-only: submitting shows a thank-you line, nothing is sent.
import { useRef, useState, type FormEvent } from "react";
import { FlickeringGrid } from "../fx/more";
import { H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Tiny demo form state: submit → "done" (never sends anything). */
function useFakeSubmit() {
  const [done, setDone] = useState(false);
  return [done, (e: FormEvent) => (e.preventDefault(), setDone(true))] as const;
}

/** NL01 · Inline single row: heading left, email field + button in one pill right, a small privacy line below. */
function NL01() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M6");
  const [done, submit] = useFakeSubmit();
  return (
    <Sec innerRef={r} theme="stone" font="grotesk" className="py-[clamp(64px,7vw,110px)]">
      <div className="grid grid-cols-1 items-center gap-[clamp(28px,4vw,64px)] border-y border-[var(--sx-line)] py-[clamp(36px,4vw,56px)] md:grid-cols-12">
        <div className="md:col-span-5">
          <H className="text-[clamp(32px,3.4vw,52px)]">One good letter a month.</H>
          <P className="mt-3 max-w-[40ch]">New chocolate bars, origin notes and first dibs on the seasonal boxes.</P>
        </div>
        <div className="md:col-span-7">
          <form data-m-card onSubmit={submit} className="flex items-center gap-2 rounded-full border border-[var(--sx-line)] bg-[var(--sx-surface)] p-1.5 max-sm:flex-col max-sm:items-stretch max-sm:rounded-[20px]">
            <input type="email" required placeholder="you@email.com" aria-label="Email address" className="min-w-0 flex-1 bg-transparent px-5 py-3 text-[16px] outline-none placeholder:text-[var(--sx-muted)]" />
            <button type="submit" className="sx-btn sx-btn-solid justify-center">
              {done ? "You're in ✓" : "Subscribe"}
            </button>
          </form>
          <p data-m-text className="mt-4 px-2 text-[13px] text-[var(--sx-muted)]">
            One email a month, never shared. Unsubscribe in one click.
          </p>
        </div>
      </div>
    </Sec>
  );
}

/** NL02 · Split: a tall image left, the form right with three perks; the photo uncovers from a mask. */
function NL02() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M1");
  const [done, submit] = useFakeSubmit();
  const perks = [
    ["10% off your first order", "A welcome code lands in your inbox right away."],
    ["Early access to drops", "Linen colours sell out; members shop them a day early."],
    ["The care letter", "Seasonal notes on washing, storing and mending linen."],
  ];
  return (
    <Sec innerRef={r} theme="paper" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <div className="grid grid-cols-1 items-center gap-[clamp(32px,5vw,88px)] md:grid-cols-12">
        <Pic i={3} ratio="4/5" className="md:col-span-5" label="SUMMER LINEN" />
        <div className="md:col-span-7">
          <H className="max-w-[14ch] text-[clamp(44px,5.4vw,88px)]">Join the linen list.</H>
          <ul className="mt-[clamp(28px,3vw,44px)] border-t border-[var(--sx-line)]">
            {perks.map(([t, d]) => (
              <li key={t} data-m-text className="flex gap-4 border-b border-[var(--sx-line)] py-5">
                <span className="mt-2 size-2 shrink-0 rounded-full bg-[var(--sx-accent)]" />
                <span>
                  <b className="block text-[17px] font-[650]">{t}</b>
                  <span className="mt-1 block text-[15px] text-[var(--sx-muted)]">{d}</span>
                </span>
              </li>
            ))}
          </ul>
          <form onSubmit={submit} className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
            <input type="email" required placeholder="Your email" aria-label="Email address" className="rounded-full border border-[var(--sx-line)] bg-[var(--sx-surface)] px-6 py-3.5 text-[16px] outline-none placeholder:text-[var(--sx-muted)] focus:border-[var(--sx-accent)]" />
            <button type="submit" className="sx-btn sx-btn-solid justify-center">
              {done ? "Welcome aboard ✓" : "Sign me up"}
            </button>
          </form>
        </div>
      </div>
    </Sec>
  );
}

/** NL03 · Big type: a huge "Get the next drop." line, then an underline-style input with an arrow button. */
function NL03() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M12");
  const [done, submit] = useFakeSubmit();
  return (
    <Sec innerRef={r} theme="ink" font="condensed" className="py-[clamp(80px,10vw,160px)]">
      <H className="text-[clamp(72px,13vw,236px)] leading-[0.84]">
        Get the
        <br />
        <span className="text-[var(--sx-accent)]">next drop.</span>
      </H>
      <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 items-end gap-8 md:grid-cols-12">
        <P className="max-w-[34ch] md:col-span-4">Limited sneaker runs, announced to the list 48 hours before anyone else.</P>
        <form data-m-card onSubmit={submit} className="md:col-span-7 md:col-start-6">
          <div className="flex items-end gap-4 border-b-2 border-[var(--sx-text)] pb-3 focus-within:border-[var(--sx-accent)]">
            <input type="email" required placeholder="Email address" aria-label="Email address" className="min-w-0 flex-1 bg-transparent text-[clamp(22px,2.6vw,40px)] font-[500] outline-none placeholder:text-[var(--sx-muted)]" />
            <button type="submit" aria-label="Subscribe" className="grid size-[clamp(48px,4vw,60px)] shrink-0 place-items-center rounded-full bg-[var(--sx-accent)] text-[22px] text-[var(--sx-accent-text)] transition-transform duration-500 hover:translate-x-1">
              {done ? "✓" : "→"}
            </button>
          </div>
          <p className="mt-3 text-[13px] text-[var(--sx-muted)]">{done ? "Done. Watch your inbox on Thursday." : "No spam. Two or three emails a month."}</p>
        </form>
      </div>
    </Sec>
  );
}

/** NL04 · A form card floating over a twinkling grid (FlickeringGrid) with perks; the card unfolds from a corner. */
function NL04() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M18");
  const [done, submit] = useFakeSubmit();
  return (
    <Sec innerRef={r} theme="ink" font="wide" className="py-[clamp(80px,10vw,160px)]">
      {/* canvas needs an rgb string: this matches the ink theme's text colour */}
      <FlickeringGrid className="absolute inset-0" color="238,242,247" size={3} gap={9} maxOpacity={0.22} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_50%,transparent,var(--sx-bg))]" />
      <div data-m-card className="sx-card relative mx-auto max-w-[720px] p-[clamp(26px,4vw,60px)] text-center shadow-[0_40px_120px_-40px_rgba(0,0,0,.8)]">
        <H className="text-[clamp(38px,4.4vw,68px)]">Tuned in, first.</H>
        <P className="mx-auto mt-4 max-w-[42ch]">The audio letter: new headphones, listening guides and member pricing, twice a month.</P>
        <ul className="mt-8 flex flex-wrap justify-center gap-2">
          {["Member prices", "Listening guides", "Early pre-orders"].map((p) => (
            <li key={p} className="rounded-full border border-[var(--sx-line)] px-4 py-2 text-[14px] text-[var(--sx-muted)]">
              <span className="mr-2 text-[var(--sx-accent)]">●</span>
              {p}
            </li>
          ))}
        </ul>
        <form onSubmit={submit} className="mx-auto mt-8 grid grid-cols-1 max-w-[520px] gap-3 sm:grid-cols-[1fr_auto]">
          <input type="email" required placeholder="Your email" aria-label="Email address" className="rounded-full border border-[var(--sx-line)] bg-[var(--sx-bg)] px-6 py-3.5 text-[16px] outline-none placeholder:text-[var(--sx-muted)] focus:border-[var(--sx-accent)]" />
          <button type="submit" className="sx-btn sx-btn-solid justify-center">
            {done ? "Subscribed ✓" : "Join free"}
          </button>
        </form>
        <p className="mt-4 text-[13px] text-[var(--sx-muted)]">12,400 listeners read it. Leave any time.</p>
      </div>
    </Sec>
  );
}

export const NEWSLETTER: SectionDef[] = [
  { code: "NL01", name: "Inline single-row signup", motion: "M6", C: NL01 },
  { code: "NL02", name: "Split: image + form with perks", motion: "M1", C: NL02 },
  { code: "NL03", name: "Big type with underline input", motion: "M12", C: NL03 },
  { code: "NL04", name: "Card over a flickering grid", motion: "M18", C: NL04 },
];
