"use client";

// MP · Map / locations layouts, batch 7 (docs/SECTION-MENU.md). Invented addresses, email + call-back wording only
// (never a phone number). Clocks run live while on screen; ?static=1 shows one fixed time per city.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const MP_CSS = `
.mpb7-glow{animation:mpb7-glow 5.2s linear infinite alternate}
@keyframes mpb7-glow{from{transform:translate(-20%,-12%) scale(.9)}to{transform:translate(18%,16%) scale(1.2)}}
.mpb7-tick{animation:mpb7-tick .45s cubic-bezier(.2,.8,.2,1)}
@keyframes mpb7-tick{from{transform:translateY(-60%);opacity:0}to{transform:none;opacity:1}}
html.is-static .mpb7-glow,html.is-static .mpb7-tick{animation:none}
html.is-static {.mpb7-glow,.mpb7-tick{animation:none}}
`;

const OFFICES = [
  { city: "Mumbai", tz: "Asia/Kolkata", at: "14 Rampart Row, Kala Ghoda", mail: "mumbai@maisonvetiver.example", i: 2, fixed: [18, 42, 10] },
  { city: "Paris", tz: "Europe/Paris", at: "9 Passage des Tanneurs, 3e", mail: "paris@maisonvetiver.example", i: 3, fixed: [15, 12, 10] },
  { city: "New York", tz: "America/New_York", at: "220 Mercer Lane, SoHo", mail: "nyc@maisonvetiver.example", i: 1, fixed: [9, 12, 10] },
  { city: "Tokyo", tz: "Asia/Tokyo", at: "3-7 Aoyama Kotodori, Minato", mail: "tokyo@maisonvetiver.example", i: 0, fixed: [22, 12, 10] },
];

/** office photo height (the photo slides between the first and last row) */
const PH = "clamp(240px, 21vw, 340px)";
const pad = (n: number) => String(n).padStart(2, "0");

/** Live local [h, m, s] for each office, updated every second while the section is on screen. */
function useClocks(ref: React.RefObject<HTMLElement | null>) {
  const [t, setT] = useState<number[][]>(OFFICES.map((o) => o.fixed));
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () =>
      OFFICES.map((o) => {
        const parts = new Intl.DateTimeFormat("en-GB", { timeZone: o.tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
        const g = (k: string) => Number(parts.find((p) => p.type === k)?.value ?? 0);
        return [g("hour"), g("minute"), g("second")];
      });
    setT(read());
    if (prefersReducedMotion()) return;
    let iv: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(iv);
      if (e.isIntersecting) iv = setInterval(() => setT(read()), 1000);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(iv);
    };
  }, [ref]);
  return t;
}

/** MP12 · Office rows with live local clocks: one row per city (huge name, live local time, address and email at the
 *  right). The hovered row shows its office photo in a column of its own; in record mode the rows take turns. */
function MP12() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const clocks = useClocks(r);
  const [act, setAct] = useState(0);
  const [hover, setHover] = useState(false);
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    let iv: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(iv);
      if (e.isIntersecting) iv = setInterval(() => !hover && setAct((v) => (v + 1) % OFFICES.length), 1900);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(iv);
    };
  }, [hover]);
  return (
    <Sec innerRef={r} theme="ink" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <style>{MP_CSS}</style>
      <div aria-hidden className="mpb7-glow pointer-events-none absolute right-[5%] top-[10%] aspect-square w-[50vw] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_38%,transparent),transparent)]" />
      <div className="relative z-10">
        <div className="grid grid-cols-1 items-end gap-[clamp(20px,3vw,48px)] md:grid-cols-12">
          <H className="text-[clamp(48px,5.8vw,100px)] md:col-span-7">Four ateliers, one clock away.</H>
          <div className="md:col-span-5 md:pb-2">
            <P className="max-w-[40ch]">Book a private fitting of the full scent library in any of our ateliers. Leave your email and the nearest one calls you back.</P>
            <div className="mt-6">
              <Btn kind="link">Request a call-back →</Btn>
            </div>
          </div>
        </div>

        <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 gap-[clamp(20px,3vw,48px)] md:grid-cols-12" onMouseLeave={() => setHover(false)}>
          <ul className="border-t border-[var(--sx-line)] md:col-span-9">
            {OFFICES.map((o, k) => {
              const [h, m, s] = clocks[k];
              const on = k === act;
              return (
                <li
                  key={o.city}
                  onMouseEnter={() => {
                    setHover(true);
                    setAct(k);
                  }}
                  className="grid grid-cols-1 items-center gap-x-6 gap-y-2 border-b border-[var(--sx-line)] py-[clamp(18px,2vw,30px)] md:grid-cols-12"
                >
                  <p data-m-text className={`sx-display text-[clamp(44px,5vw,84px)] leading-[1] transition-colors duration-500 md:col-span-6 ${on ? "text-[var(--sx-text)]" : "text-[color-mix(in_srgb,var(--sx-text)_42%,transparent)]"}`}>
                    {o.city}
                  </p>
                  <p className="flex items-baseline gap-2 font-[600] tabular-nums md:col-span-3">
                    <span className="text-[clamp(26px,2.4vw,38px)] leading-none">
                      {pad(h)}:{pad(m)}
                    </span>
                    <span className="relative inline-block h-[1.2em] overflow-hidden text-[18px] text-[var(--sx-accent)]">
                      <span key={s} className="mpb7-tick block">
                        {pad(s)}
                      </span>
                    </span>
                    <span className={`ml-1 h-2 w-2 self-center rounded-full ${h >= 9 && h < 20 ? "bg-[var(--sx-accent)]" : "bg-[var(--sx-line)]"}`} title={h >= 9 && h < 20 ? "Open now" : "Closed"} />
                  </p>
                  <div className="text-[14px] leading-relaxed text-[var(--sx-muted)] md:col-span-3 md:text-right">
                    <p>{o.at}</p>
                    <p className="text-[var(--sx-text)]">{o.mail}</p>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* the office photo has its own column and slides to the active row */}
          <div className="relative max-md:hidden md:col-span-3">
            <div className="absolute inset-x-0 transition-[top] duration-700 ease-[cubic-bezier(.2,.8,.2,1)]" style={{ top: `calc((100% - ${PH}) * ${act / (OFFICES.length - 1)})` }}>
              <div className="relative w-full overflow-hidden rounded-[var(--sx-radius)]" style={{ height: PH }}>
                {OFFICES.map((o, k) => (
                  <div key={o.city} className={`absolute inset-0 transition-opacity duration-700 ${k === act ? "opacity-100" : "opacity-0"}`}>
                    <div className="fx-drift h-full w-full">
                      <Pic i={o.i} ratio="auto" round={false} className="h-full w-full" label={o.city.toUpperCase()} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "MP12", name: "Office rows with live local clocks", motion: "M23", C: MP12 }];
