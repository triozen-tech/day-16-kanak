"use client";

// CC · Contact layouts, batch 7 (docs/SECTION-MENU.md). Email only, never a phone number; the form is a demo (no submit).
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { ShimmerButton } from "../fx/more";
import { H, P, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const CC_CSS = `
.ccb7-glow{animation:ccb7-glow 3.2s linear infinite alternate}
@keyframes ccb7-glow{from{transform:translate(-30%,-10%) scale(.9)}to{transform:translate(30%,8%) scale(1.15)}}
.ccb7-glow2{animation:ccb7-glow2 2.6s linear infinite alternate}
@keyframes ccb7-glow2{from{transform:translate(24%,12%) scale(1.1)}to{transform:translate(-22%,-6%) scale(.85)}}
.ccb7-caret{animation:ccb7-caret 1s steps(1) infinite}
@keyframes ccb7-caret{50%{opacity:0}}
html.is-static .ccb7-glow,html.is-static .ccb7-glow2,html.is-static .ccb7-caret{animation:none}
html.is-static {.ccb7-glow,.ccb7-glow2,.ccb7-caret{animation:none}}
`;

const MESSAGE = "We're furnishing a 40-seat café in Pune and love the Banyan tables. Could you share a trade quote for six, in oiled teak?";

/** Types the demo message by itself while on screen (shows the whole message in ?static=1), then starts over. */
function useTyping(ref: React.RefObject<HTMLElement | null>, text: string) {
  const [n, setN] = useState(text.length);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let iv: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(iv);
      if (e.isIntersecting) {
        setN(0);
        iv = setInterval(() => setN((v) => (v >= text.length + 30 ? 0 : v + 1)), 45);
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(iv);
    };
  }, [ref, text]);
  return text.slice(0, Math.min(n, text.length));
}

const label = "mb-2 block text-[13px] font-[600] text-[var(--sx-text)]";
const field = "w-full rounded-[12px] border border-[var(--sx-line)] bg-[var(--sx-bg)] px-4 py-3 text-[15px] text-[var(--sx-text)] outline-none placeholder:text-[var(--sx-muted)] focus:border-[var(--sx-accent)]";

const Select = ({ id, l, v, opts }: { id: string; l: string; v: string; opts: string[] }) => (
  <div>
    <label htmlFor={id} className={label}>
      {l}
    </label>
    <div className="relative">
      <select id={id} defaultValue={v} className={`${field} appearance-none pr-10`}>
        {opts.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--sx-muted)]" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  </div>
);

/** CC13 · Centred form card: a centred heading and line of copy, then one centred card (2-up name row, email, company,
 *  two selects side by side, message, full-width submit with a slow shimmer) and a small link under the card. */
function CC13() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M6");
  const msg = useTyping(r, MESSAGE);
  return (
    <Sec innerRef={r} theme="stone" font="serif" className="py-[clamp(72px,9vw,140px)]" style={{ ["--accent" as string]: "var(--sx-accent)" }}>
      <style>{CC_CSS}</style>
      <div aria-hidden className="ccb7-glow pointer-events-none absolute left-[18%] top-[20%] aspect-square w-[64vw] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_58%,transparent),transparent)]" />
      <div aria-hidden className="ccb7-glow2 pointer-events-none absolute bottom-[-10%] right-[8%] aspect-square w-[52vw] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_50%,transparent),transparent)]" />
      <div className="relative z-10">
        <div className="mx-auto max-w-[760px] text-center">
          <H className="text-[clamp(44px,5.2vw,88px)]">Tell us about the room.</H>
          <P className="mx-auto mt-6 max-w-[46ch]">Trade orders, custom finishes or a single chair: a maker from our Jodhpur workshop replies within one working day.</P>
        </div>

        <form data-m-card onSubmit={(e) => e.preventDefault()} className="sx-card mx-auto mt-[clamp(40px,5vw,64px)] max-w-[640px] p-[clamp(24px,3vw,44px)] shadow-[0_40px_80px_-50px_rgba(17,20,24,.45)]">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="cc13-first" className={label}>
                First name
              </label>
              <input id="cc13-first" defaultValue="Anya" className={field} />
            </div>
            <div>
              <label htmlFor="cc13-last" className={label}>
                Last name
              </label>
              <input id="cc13-last" defaultValue="Varma" className={field} />
            </div>
          </div>
          <div className="mt-5">
            <label htmlFor="cc13-mail" className={label}>
              Email
            </label>
            <input id="cc13-mail" type="email" defaultValue="anya@studiovarma.example" className={field} />
          </div>
          <div className="mt-5">
            <label htmlFor="cc13-co" className={label}>
              Company <span className="font-[400] text-[var(--sx-muted)]">(optional)</span>
            </label>
            <input id="cc13-co" placeholder="Studio or business name" className={field} />
          </div>
          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
            <Select id="cc13-topic" l="Topic" v="Trade quote" opts={["Trade quote", "Custom finish", "Order help", "Press"]} />
            <Select id="cc13-budget" l="Budget" v="₹2–5 lakh" opts={["Under ₹50,000", "₹50,000–2 lakh", "₹2–5 lakh", "Over ₹5 lakh"]} />
          </div>
          <div className="mt-5">
            <label htmlFor="cc13-msg" className={label}>
              Message
            </label>
            <div id="cc13-msg" role="textbox" aria-label="Message" className={`${field} min-h-[120px] leading-relaxed`}>
              {msg}
              <span className="ccb7-caret ml-[1px] inline-block h-[1.1em] w-[2px] translate-y-[3px] bg-[var(--sx-accent)]" />
            </div>
          </div>
          <ShimmerButton className="mt-7 w-full text-[16px]">Send message</ShimmerButton>
          <p className="mt-4 text-center text-[13px] text-[var(--sx-muted)]">We reply from hello@banyanworks.example · no newsletters</p>
        </form>

        <p className="mt-7 text-center text-[14px] text-[var(--sx-muted)]">
          Looking for an order?{" "}
          <a href="#" onClick={(e) => e.preventDefault()} className="font-[600] text-[var(--sx-text)] underline decoration-[var(--sx-accent)] underline-offset-4">
            Track it here
          </a>
        </p>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "CC13", name: "Centred form card", motion: "M6", C: CC13 }];
