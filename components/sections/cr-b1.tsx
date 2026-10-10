"use client";

// CR · Careers layouts, batch 1 (CR01). Job cards + an application form; the highlighted role cycles by itself.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const JOBS = [
  { title: "Line cook", when: "Full-time · Tue–Sun, 2 pm–11 pm", pay: "₹28,000–₹34,000 / month", exp: "2+ years on a hot line" },
  { title: "Head barista", when: "Full-time · 7 am–4 pm, rotating weekends", pay: "₹32,000–₹38,000 / month", exp: "3+ years, latte art a must" },
  { title: "Floor host", when: "Part-time · Fri–Sun evenings", pay: "₹450 / hour + tips", exp: "Warm, calm, no experience needed" },
  { title: "Pastry assistant", when: "Full-time · 5 am–1 pm, Wed–Mon", pay: "₹24,000–₹29,000 / month", exp: "1+ year with laminated doughs" },
];

const field = "w-full rounded-[12px] border border-[var(--sx-line)] bg-[var(--sx-surface)] px-4 py-3.5 text-[15px] text-[var(--sx-text)] outline-none placeholder:text-[var(--sx-muted)] focus:border-[var(--sx-accent)]";

/** CR01 · Job cards + split application form: a 2-column grid of role cards (title, schedule, pay, experience), then a
 *  form split into an intro (left) and fields (right). Cards snap in from different sides; the highlighted role cycles
 *  every ~2.4 s and the form's position field follows it. */
function CR01() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  const [i, setI] = useState(1);
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    let t: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (e.isIntersecting) t = setInterval(() => setI((v) => (v + 1) % JOBS.length), 2400);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, []);
  return (
    <Sec innerRef={r} theme="stone" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[13ch] text-[clamp(48px,6.4vw,112px)]">Come cook with us.</H>
        <P className="max-w-[38ch] pb-2">Fennel &amp; Oat is opening a second kitchen in Indiranagar this winter. Four roles, all with paid meals and a day off together every month.</P>
      </div>
      <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 gap-[clamp(12px,1.4vw,20px)] md:grid-cols-2">
        {JOBS.map((j, k) => {
          const on = k === i;
          return (
            <button
              key={j.title}
              type="button"
              data-m-card
              onClick={() => setI(k)}
              className={`sx-card group relative flex flex-col gap-5 p-[clamp(22px,2.6vw,36px)] text-left transition-[border-color,background-color] duration-500 ${on ? "border-[var(--sx-accent)]! bg-[color-mix(in_srgb,var(--sx-accent)_7%,var(--sx-surface))]" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <p className="sx-display text-[clamp(28px,2.6vw,42px)] leading-none">{j.title}</p>
                <span className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] font-[650] transition-colors duration-500 ${on ? "bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "border border-[var(--sx-line)] text-[var(--sx-muted)]"}`}>{on ? "Applying ↓" : "Apply"}</span>
              </div>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-3 border-t border-[var(--sx-line)] pt-5 text-[14px] md:grid-cols-3">
                {[
                  ["Schedule", j.when],
                  ["Pay", j.pay],
                  ["Experience", j.exp],
                ].map(([dt, dd]) => (
                  <div key={dt}>
                    <dt className="text-[12px] uppercase tracking-[0.14em] text-[var(--sx-muted)]">{dt}</dt>
                    <dd className="mt-1 leading-snug">{dd}</dd>
                  </div>
                ))}
              </dl>
            </button>
          );
        })}
      </div>
      <div className="mt-[clamp(56px,7vw,104px)] grid grid-cols-1 gap-[clamp(32px,5vw,80px)] border-t border-[var(--sx-line)] pt-[clamp(40px,5vw,72px)] md:grid-cols-12">
        <div className="md:col-span-5">
          <H className="text-[clamp(36px,3.8vw,64px)]">Tell us about you.</H>
          <P className="mt-5 max-w-[40ch]">No cover letter needed. A few lines on where you have worked and what you love to make is plenty. We reply to everyone within a week.</P>
          <div className="mt-8 overflow-hidden rounded-[var(--sx-radius)]">
            <Pic i={3} ratio="16/10" label="THE NEW KITCHEN" className="fx-drift" />
          </div>
        </div>
        <form className="grid grid-cols-1 content-start gap-4 md:col-span-7 md:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
          <label className="flex flex-col gap-2 text-[14px] font-[600]">
            Full name
            <input className={field} placeholder="Ira Menon" />
          </label>
          <label className="flex flex-col gap-2 text-[14px] font-[600]">
            Email
            <input type="email" className={field} placeholder="ira@example.com" />
          </label>
          <label className="flex flex-col gap-2 text-[14px] font-[600]">
            Phone
            <input type="tel" className={field} placeholder="Your mobile number" />
          </label>
          <label className="flex flex-col gap-2 text-[14px] font-[600]">
            Position
            <select className={`${field} transition-colors duration-500`} value={JOBS[i].title} onChange={(e) => setI(JOBS.findIndex((j) => j.title === e.target.value))}>
              {JOBS.map((j) => (
                <option key={j.title}>{j.title}</option>
              ))}
            </select>
          </label>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[14px] border border-dashed border-[var(--sx-line)] bg-[var(--sx-surface)] px-6 py-[clamp(24px,3vw,40px)] text-center md:col-span-2">
            <input type="file" className="sr-only" />
            <span className="text-[16px] font-[650]">Drop your CV here, or browse</span>
            <span className="text-[13px] text-[var(--sx-muted)]">PDF or Word, up to 5 MB</span>
          </label>
          <div className="flex flex-wrap items-center justify-between gap-4 md:col-span-2">
            <span className="text-[14px] text-[var(--sx-muted)]">
              Applying for <b className="font-[650] text-[var(--sx-text)]">{JOBS[i].title}</b>
            </span>
            <Btn>Send application</Btn>
          </div>
        </form>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [{ code: "CR01", name: "Job cards + split application form", motion: "M34", C: CR01 }];
