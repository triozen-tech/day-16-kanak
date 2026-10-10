"use client";

// SP · Social proof layouts, batch 5 (docs/SECTION-MENU.md): SP16 customer wordmarks that act as tabs into a case
// panel (big metric counts up, quote, photo), SP17 a centre-focus three-card review carousel, SP18 a quote accordion
// with exactly one reviewer open at a time. All auto-advance while on screen and hold their first state in ?static=1.
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { scene } from "../fx/shared";
import { Avatar, Btn, H, P, Price, Sec, Stars } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Steps an index every `ms` while `ref` is on screen (stops off screen and in ?static=1). `live` = motion allowed. */
function useCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms: number) {
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

const CSS = `.sp5kb img{animation:sp5kbs 4.4s linear infinite alternate,sp5kbt 3.2s ease-in-out infinite alternate}
@keyframes sp5kbs{from{scale:1.05}to{scale:1.2}}@keyframes sp5kbt{from{translate:-3% 2%}to{translate:3% -2%}}
.sp5fill{animation:sp5fill var(--d) linear forwards}@keyframes sp5fill{from{scale:0 1}to{scale:1 1}}
.sp5in{animation:sp5in .6s cubic-bezier(.2,.7,.2,1) both}@keyframes sp5in{from{opacity:0;translate:0 14px}to{opacity:1;translate:0 0}}
.sp5mq{animation:sp5mq 30s linear infinite}@keyframes sp5mq{from{translate:0 0}to{translate:-50% 0}}
html.is-static .sp5kb img,html.is-static .sp5fill,html.is-static .sp5in,html.is-static .sp5mq{animation:none}
html.is-static {.sp5kb img,.sp5fill,.sp5in,.sp5mq{animation:none}}`;

/** Placeholder photo with a slow two-loop drift. */
function Shot({ i, className = "" }: { i: number; className?: string }) {
  return (
    <div className={`sp5kb relative overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={scene(i, 800, 1000, "")} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
    </div>
  );
}

/* ───────────────────────────── SP16 · Logo tabs revealing case quotes ───────────────────────────── */

const CAFES = [
  { logo: "Kettle & Crow", cls: "font-[800] italic tracking-[-0.01em]", metric: "+38%", label: "repeat orders since switching to our house espresso", q: "Regulars noticed in the first week. The milk drinks got sweeter without a grain of sugar.", who: "Ira Menon", role: "Owner, Kettle & Crow · Pune", i: 0 },
  { logo: "BLUEBELL", cls: "font-[600] uppercase tracking-[0.32em]", metric: "2,400", label: "cups a week from a single grinder setting", q: "Same dial-in from Monday to Sunday. My baristas stopped chasing the shot every morning.", who: "Kabir Shah", role: "Head barista, Bluebell · Bengaluru", i: 3 },
  { logo: "ninth street", cls: "font-[300] lowercase tracking-[0.04em]", metric: "11", label: "days from roast to cup, on every delivery", q: "Fresh beans every Tuesday, on time, for two years. I have never had to call them.", who: "Anika Rao", role: "Founder, Ninth Street · Mumbai", i: 2 },
  { logo: "Harbour Café", cls: "font-[700] tracking-[0.02em] [font-variant:small-caps]", metric: "−22%", label: "coffee waste after the barista training day", q: "They spent a full day behind our bar. We now pour fewer shots down the sink than ever.", who: "Dev Raman", role: "Manager, Harbour Café · Kochi", i: 1 },
  { logo: "Monk's Table", cls: "font-[800] uppercase tracking-[0.08em]", metric: "4.9", label: "average rating for retail bags sold at our counter", q: "We started selling their beans by the till. It is now a fifth of our weekend takings.", who: "Meera Joshi", role: "Co-owner, Monk's Table · Goa", i: 3 },
];

/** Counts a number up from 0 when it mounts (used on every tab swap; the first value is counted by M3 on entry). */
function CountUp({ value, run }: { value: string; run: boolean }) {
  const el = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const n = el.current;
    if (!n || !run) return;
    const m = value.match(/[\d.,]+/);
    if (!m) return;
    const target = parseFloat(m[0].replace(/,/g, ""));
    const dec = (m[0].split(".")[1] ?? "").length;
    const o = { v: 0 };
    const tw = gsap.to(o, {
      v: target,
      duration: 1.1,
      ease: "power3.out",
      onUpdate: () => (n.textContent = value.replace(m[0], o.v.toLocaleString("en-IN", { minimumFractionDigits: dec, maximumFractionDigits: dec }))),
      onComplete: () => (n.textContent = value),
    });
    return () => {
      tw.kill();
    };
  }, [value, run]);
  return (
    <span ref={el} data-m-num className="tabular-nums">
      {value}
    </span>
  );
}

/** SP16 · A row of five customer wordmark tabs; below, a panel with a big metric, a quote and a case link for the active one. Auto-advances. */
function SP16() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M3");
  const [i, setI, live] = useCycle(r, CAFES.length, 3000);
  const swapped = useRef(false);
  if (i !== 0) swapped.current = true;
  const c = CAFES[i];
  return (
    <Sec innerRef={r} theme="stone" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <style>{CSS}</style>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[14ch] text-[clamp(44px,5.2vw,88px)]">Poured in 340 cafés.</H>
        <div className="max-w-[38ch] pb-2">
          <P>Wholesale beans, a grinder setting that holds all week, and a roaster who picks up the phone.</P>
        </div>
      </div>

      <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-5 border-y border-[var(--sx-line)]" role="tablist">
        {CAFES.map((x, k) => {
          const on = k === i;
          return (
            <button
              key={x.logo}
              role="tab"
              aria-selected={on}
              onClick={() => setI(k)}
              data-m-card
              className={`relative min-w-0 px-2 py-[clamp(20px,2.4vw,34px)] text-center transition-colors duration-500 ${k ? "border-l border-[var(--sx-line)]" : ""} ${on ? "bg-[var(--sx-surface)] text-[var(--sx-text)]" : "text-[var(--sx-muted)]"}`}
            >
              <span className={`block truncate text-[clamp(14px,1.5vw,22px)] ${x.cls}`}>{x.logo}</span>
              <span aria-hidden className="absolute inset-x-0 -top-px h-[3px] overflow-hidden">
                {on && <span key={`f${i}`} className={`block h-full w-full origin-left bg-[var(--sx-accent)] ${live ? "sp5fill" : ""}`} style={{ ["--d" as string]: "3000ms" }} />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="sx-card mt-[clamp(16px,2vw,28px)] grid grid-cols-1 items-stretch gap-[clamp(24px,3vw,48px)] p-[clamp(20px,2.6vw,40px)] md:grid-cols-12">
        <div key={`m${i}`} className={`flex flex-col justify-between md:col-span-4 ${live ? "sp5in" : ""}`}>
          <p className="sx-display text-[clamp(72px,8vw,136px)] font-[800] leading-[0.9] tracking-[-0.04em] text-[var(--sx-accent)]">
            <CountUp value={c.metric} run={live && swapped.current} />
          </p>
          <p className="mt-4 max-w-[26ch] text-[16px] leading-snug text-[var(--sx-muted)]">{c.label}</p>
        </div>
        <div key={`q${i}`} className={`flex flex-col justify-between md:col-span-5 ${live ? "sp5in" : ""}`}>
          <blockquote className="text-[clamp(20px,1.9vw,30px)] font-[500] leading-[1.3] tracking-[-0.01em]">&ldquo;{c.q}&rdquo;</blockquote>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar name={c.who} i={k5(i)} size={44} />
              <div>
                <p className="text-[15px] font-[650]">{c.who}</p>
                <p className="text-[13px] text-[var(--sx-muted)]">{c.role}</p>
              </div>
            </div>
            <Btn kind="link">Read the case →</Btn>
          </div>
        </div>
        <div className="relative min-h-[260px] overflow-hidden rounded-[var(--sx-radius,18px)] md:col-span-3">
          {CAFES.map((x, k) => (
            <div key={x.logo} className="absolute inset-0 transition-opacity duration-700" style={{ opacity: k === i ? 1 : 0 }}>
              <Shot i={x.i} className="h-full w-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <p className="text-[15px] text-[var(--sx-muted)]">Wholesale from ₹1,150 a kilo · free grinder calibration</p>
        <Btn>Open a wholesale account</Btn>
      </div>
    </Sec>
  );
}
const k5 = (i: number) => (i + 1) % 5;

/* ───────────────────────────── SP17 · Centre-focus three-card carousel ───────────────────────────── */

const RUNNERS = [
  { q: "Ran my first half in them straight out of the box. No blisters, no break-in, nothing.", who: "Rohan Pillai", what: "Lattice Runner · UK 9", p: "₹8,490" },
  { q: "Light enough that I forget them on long walks, and they still look sharp at the office.", who: "Tara Bose", what: "Lattice Low · UK 5", p: "₹7,290" },
  { q: "The knit upper breathes in Chennai humidity. My old pair felt like wearing a sauna.", who: "Arjun Nair", what: "Lattice Runner · UK 10", p: "₹8,490" },
  { q: "Washed them twice already. They came back looking new, and the shape did not move.", who: "Sana Qureshi", what: "Lattice Trail · UK 6", p: "₹9,190" },
  { q: "Bought one pair to try. I now own three colours and my brother has stolen one.", who: "Vikram Iyer", what: "Lattice Low · UK 8", p: "₹7,290" },
  { q: "Cushioned, but you still feel the road. Exactly what I wanted for tempo days.", who: "Nisha Kapoor", what: "Lattice Runner · UK 4", p: "₹8,490" },
];
const N17 = RUNNERS.length;

/** SP17 · Three review cards in a row; the centre card is larger and highlighted, the sides dimmed. Auto-steps; arrows step it. */
function SP17() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  const [a, setA, live] = useCycle(r, N17, 2400);
  const snippets = RUNNERS.map((x) => `★★★★★  “${x.q.split(".")[0]}.”  ${x.who}`);
  return (
    <Sec innerRef={r} theme="ink" font="condensed" full className="py-[clamp(72px,9vw,140px)]">
      <style>{CSS}</style>
      <div className="px-[clamp(20px,5vw,96px)] text-center">
        <H className="mx-auto max-w-[16ch] text-[clamp(52px,6.6vw,112px)] uppercase">12,400 runners can&apos;t be wrong.</H>
        <p className="mt-5 flex flex-wrap items-center justify-center gap-3 text-[16px] text-[var(--sx-muted)]">
          <Stars /> <span>4.8 average · verified buyers only</span>
        </p>
      </div>

      <div className="mt-[clamp(40px,5vw,72px)] grid min-w-0 grid-cols-[minmax(0,1fr)] justify-items-center overflow-hidden px-[clamp(20px,5vw,96px)] py-6">
        {RUNNERS.map((x, k) => {
          let o = (k - a + N17) % N17;
          if (o > N17 / 2) o -= N17;
          const on = o === 0;
          const vis = Math.abs(o) <= 1;
          return (
            <div
              key={x.who}
              className="w-[min(34%,460px)] [grid-area:1/1] max-md:w-[78%]"
              style={{
                transform: `translateX(${o * 106}%) scale(${on ? 1 : 0.86})`,
                opacity: vis ? (on ? 1 : 0.45) : 0,
                zIndex: on ? 2 : 1,
                transition: live ? "transform .8s cubic-bezier(.65,0,.25,1), opacity .8s" : "none",
              }}
            >
              <div data-m-card className={`sx-card flex h-full flex-col justify-between p-[clamp(22px,2.4vw,36px)] transition-colors duration-700 ${on ? "border-[var(--sx-accent)]! bg-[color-mix(in_srgb,var(--sx-accent)_10%,var(--sx-surface))]!" : ""}`}>
                <div>
                  <Stars />
                  <p className="mt-5 text-[clamp(18px,1.6vw,24px)] leading-[1.4]">&ldquo;{x.q}&rdquo;</p>
                </div>
                <div className="mt-8 flex items-center justify-between gap-3 border-t border-[var(--sx-line)] pt-5">
                  <div className="flex items-center gap-3">
                    <Avatar name={x.who} i={k} size={40} />
                    <div>
                      <p className="text-[15px] font-[650]">{x.who}</p>
                      <p className="text-[13px] text-[var(--sx-muted)]">{x.what}</p>
                    </div>
                  </div>
                  <Price now={x.p} className="text-[15px]" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-center gap-3 px-[clamp(20px,5vw,96px)]">
        <button onClick={() => setA((v) => (v - 1 + N17) % N17)} aria-label="Previous review" className="grid h-12 w-12 place-items-center rounded-full border border-[var(--sx-line)] text-[18px]">←</button>
        <div className="flex gap-2 px-3">
          {RUNNERS.map((x, k) => (
            <span key={x.who} className={`h-[6px] rounded-full transition-all duration-500 ${k === a ? "w-8 bg-[var(--sx-accent)]" : "w-[6px] bg-[var(--sx-line)]"}`} />
          ))}
        </div>
        <button onClick={() => setA((v) => (v + 1) % N17)} aria-label="Next review" className="grid h-12 w-12 place-items-center rounded-full border border-[var(--sx-line)] text-[18px]">→</button>
      </div>

      {/* review snippets drifting along the bottom (keeps the frame alive between steps) */}
      <div className="mt-[clamp(40px,5vw,64px)] min-w-0 overflow-hidden border-y border-[var(--sx-line)] py-5">
        <div className={`flex w-max whitespace-nowrap ${live ? "sp5mq" : ""}`}>
          {[0, 1].map((c) => (
            <div key={c} className="flex shrink-0">
              {snippets.map((s) => (
                <span key={s} className="px-10 text-[clamp(16px,1.3vw,20px)] text-[color-mix(in_srgb,var(--sx-text)_72%,transparent)]">
                  {s}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────────── SP18 · Quote accordion ───────────────────────────── */

const SKIN = [
  { who: "Leela Varma", what: "Ritual Night Oil", age: "34 · dry skin", q: "Three weeks in, the flaky patches by my nose are gone. It sinks in before I have finished brushing my teeth.", i: 2 },
  { who: "Farah Siddiqui", what: "Cloud Cleanser", age: "27 · oily skin", q: "The first cleanser that does not leave me tight. My T-zone is calmer by lunch than it used to be by breakfast.", i: 0 },
  { who: "Neha Kulkarni", what: "Barrier Cream", age: "41 · sensitive", q: "No sting, no redness, no perfume headache. My dermatologist asked what I had changed.", i: 3 },
  { who: "Priya Das", what: "Vitamin Mist", age: "29 · combination", q: "I keep it on my desk and spray it at four o'clock. It is the nicest minute of my workday.", i: 1 },
  { who: "Aarti Menon", what: "Ritual Night Oil", age: "52 · mature", q: "My skin looks rested even on the weeks I am not. That has never happened with a bottle before.", i: 2 },
];

/** SP18 · Left: heading and overall rating. Right: reviewer rows (avatar, name, stars); exactly one opens at a time with the full quote and portrait. Auto-advances. */
function SP18() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const [i, setI, live] = useCycle(r, SKIN.length, 2800);
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <style>{CSS}</style>
      <div className="grid grid-cols-1 gap-[clamp(40px,5vw,96px)] md:grid-cols-12">
        <div className="md:col-span-5">
          <H className="max-w-[12ch] text-[clamp(44px,5vw,84px)]">Skin that feels like yours again.</H>
          <P className="mt-6 max-w-[38ch]">Five people, five skin types, one routine. Unedited reviews from verified orders.</P>
          <div className="mt-[clamp(32px,4vw,56px)] flex items-end gap-5 border-t border-[var(--sx-line)] pt-8">
            <p className="sx-display text-[clamp(72px,7vw,120px)] font-[600] leading-[0.85] tracking-[-0.03em]">4.9</p>
            <div className="pb-2">
              <Stars />
              <p className="mt-2 text-[14px] text-[var(--sx-muted)]">from 3,280 verified reviews</p>
            </div>
          </div>
          <div className="mt-9 flex flex-wrap items-center gap-5">
            <Btn>Shop the ritual · ₹2,450</Btn>
            <Btn kind="link">All reviews →</Btn>
          </div>
        </div>

        <ul className="border-t border-[var(--sx-line)] md:col-span-7">
          {SKIN.map((x, k) => {
            const on = k === i;
            return (
              <li key={x.who} data-m-card className="relative overflow-hidden border-b border-[var(--sx-line)]">
                {/* the open row fills with a tint over its cycle (a large, steady change on camera) */}
                {on && live && <span key={`t${i}`} aria-hidden className="sp5fill pointer-events-none absolute inset-0 origin-left bg-[color-mix(in_srgb,var(--sx-accent)_14%,transparent)]" style={{ ["--d" as string]: "2800ms" }} />}
                <button onClick={() => setI(k)} aria-expanded={on} className="relative flex w-full items-center gap-4 px-[clamp(12px,1.4vw,20px)] py-5 text-left">
                  <Avatar name={x.who} i={k} size={44} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[17px] font-[650]">{x.who}</span>
                    <span className="block text-[13px] text-[var(--sx-muted)]">
                      {x.what} · {x.age}
                    </span>
                  </span>
                  <Stars />
                  <span aria-hidden className={`ml-2 text-[20px] transition-[rotate] duration-500 ${on ? "rotate-45" : ""}`}>+</span>
                </button>
                <div className="relative grid transition-[grid-template-rows] duration-[600ms] ease-[cubic-bezier(.65,0,.25,1)]" style={{ gridTemplateRows: on ? "1fr" : "0fr" }}>
                  <div className="min-h-0 overflow-hidden">
                    <div className="flex gap-[clamp(16px,2vw,28px)] px-[clamp(12px,1.4vw,20px)] pb-7">
                      <Shot i={x.i} className="aspect-[4/5] w-[clamp(110px,10vw,150px)] shrink-0 rounded-[14px]" />
                      <div className="flex flex-col justify-between">
                        <p className="sx-display text-[clamp(20px,1.8vw,28px)] leading-[1.3]">&ldquo;{x.q}&rdquo;</p>
                        <p className="mt-4 text-[13px] uppercase tracking-[0.14em] text-[var(--sx-muted)]">Verified order · 3 weeks of use</p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "SP16", name: "Logo tabs revealing case quotes", motion: "M3", C: SP16 },
  { code: "SP17", name: "Centre-focus three-card carousel", motion: "M34", C: SP17 },
  { code: "SP18", name: "Quote accordion", motion: "M23", C: SP18 },
];
