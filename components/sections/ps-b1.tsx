"use client";

// PS · Product-selection layouts, batch 1 (docs/SECTION-MENU.md): PS09 quiz, PS10 mix-a-case, PS11 wheel picker, PS12 cube.
// Each plays by itself while on screen (hands-free for filming) and shows its final state in ?static=1.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { scene, useTicker } from "../fx/shared";
import { Btn, H, P, Price, Product, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Steps 0..n-1 every `ms` while on screen; in ?static=1 it sits on `still` (the final state). */
function useSteps(ref: React.RefObject<HTMLElement | null>, n: number, ms: number, still = 0) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      setI(still);
      return;
    }
    let id = 0;
    const io = new IntersectionObserver(([e]) => {
      window.clearInterval(id);
      if (e.isIntersecting) id = window.setInterval(() => setI((v) => (v + 1) % n), ms);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearInterval(id);
    };
  }, [ref, n, ms, still]);
  return [i, setI] as const;
}

/* ───────────────────────────── PS09 · Product finder quiz ───────────────────────────── */

const QUIZ = [
  { q: "How does your skin feel by noon?", opts: ["Tight and dry", "Shiny in the T-zone", "Calm, mostly even", "Red or reactive"], pick: 1 },
  { q: "What would you change first?", opts: ["Dull tone", "Visible pores", "Fine lines", "Dark spots"], pick: 1 },
  { q: "How many steps do you have time for?", opts: ["Just one", "Two or three", "The full ritual"], pick: 1 },
];
const PS09_CSS = `.ps09-glow{animation:ps09-glow 6s ease-in-out infinite alternate}@keyframes ps09-glow{from{transform:translate(-8%,-4%) scale(1)}to{transform:translate(8%,6%) scale(1.15)}}.ps09-in{animation:ps09-in .55s cubic-bezier(.22,1,.36,1)}@keyframes ps09-in{from{opacity:0;transform:translateY(16px)}}.is-static .ps09-glow,.is-static .ps09-in{animation:none}html.is-static {.ps09-glow,.ps09-in{animation:none}}`;

/** PS09 · Centred quiz card: progress dots, one question at a time with option tiles, ending on a result panel. */
function PS09() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  // phases: per question "asked" then "picked"; then 4 phases on the result. ?static=1 sits on the result.
  const PHASES = QUIZ.length * 2 + 4;
  const [ph, setPh] = useSteps(r, PHASES, 950, PHASES - 1);
  const qi = Math.min(Math.floor(ph / 2), QUIZ.length);
  const picked = ph % 2 === 1;
  const done = qi >= QUIZ.length;
  const q = QUIZ[Math.min(qi, QUIZ.length - 1)];
  return (
    <Sec innerRef={r} theme="stone" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <style>{PS09_CSS}</style>
      <div className="ps09-glow pointer-events-none absolute left-1/2 top-1/2 -ml-[35vw] -mt-[30vw] aspect-square w-[70vw] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_22%,transparent),transparent)]" />
      <div className="relative mx-auto max-w-[760px] text-center">
        <H className="text-[clamp(40px,5vw,80px)]">Find your serum in a minute.</H>
        <P className="mx-auto mt-5 max-w-[44ch]">Three quick questions, one formula matched to your skin. No account, no spam.</P>
      </div>
      <div data-m-card className="sx-card relative mx-auto mt-[clamp(36px,5vw,64px)] max-w-[760px] p-[clamp(24px,3.4vw,48px)] shadow-[0_40px_80px_-50px_rgba(17,20,24,.45)]">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {[...QUIZ, null].map((_, k) => (
              <span key={k} className={`h-2 rounded-full transition-all duration-500 ${k < qi || (k === qi && picked) ? "w-8 bg-[var(--sx-accent)]" : k === qi ? "w-8 bg-[var(--sx-text)]" : "w-2 bg-[var(--sx-line)]"}`} />
            ))}
          </div>
          <span className="text-[13px] tabular-nums text-[var(--sx-muted)]">{done ? "Your match" : `Question ${qi + 1} of ${QUIZ.length}`}</span>
        </div>
        {!done ? (
          <div key={qi} className="ps09-in mt-8">
            <p className="sx-display text-[clamp(26px,2.6vw,38px)] font-[600] leading-tight">{q.q}</p>
            <div className={`mt-7 grid grid-cols-1 gap-3 ${q.opts.length === 4 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
              {q.opts.map((o, k) => {
                const on = picked && k === q.pick;
                return (
                  <button
                    key={o}
                    onClick={() => setPh(qi * 2 + 1)}
                    className={`flex min-h-[84px] items-center justify-between gap-3 rounded-[14px] border px-5 py-4 text-left text-[16px] font-[600] transition-all duration-300 ${on ? "border-[var(--sx-accent)] bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "border-[var(--sx-line)] bg-[var(--sx-bg)]"}`}
                  >
                    {o}
                    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[12px] ${on ? "border-current" : "border-[var(--sx-line)]"}`}>{on ? "✓" : ""}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="ps09-in mt-8 grid grid-cols-1 items-center gap-[clamp(20px,3vw,40px)] md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[14px] bg-[var(--sx-bg)]">
              <div className="absolute inset-[12%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_30%,transparent),transparent)]" />
              <Product angle={2} accent="#1f5f4a" className="absolute inset-0 m-auto h-[82%] w-[82%]" />
            </div>
            <div>
              <p className="text-[13px] font-[600] uppercase tracking-[0.14em] text-[var(--sx-accent)]">96% match</p>
              <p className="sx-display mt-2 text-[clamp(30px,3vw,44px)] font-[700] leading-none">Niacinamide Clear Serum</p>
              <ul className="mt-5 space-y-2 text-[15px] text-[var(--sx-muted)]">
                {["10% niacinamide tightens the look of pores", "Oil-light gel that sits well under SPF", "Fits a two-step morning, done in a minute"].map((b) => (
                  <li key={b} className="flex gap-3">
                    <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--sx-accent)]" />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <Price now="₹845" was="₹990" className="text-[20px]" />
                <Btn>Add to bag</Btn>
              </div>
            </div>
          </div>
        )}
      </div>
    </Sec>
  );
}

/* ───────────────────────────── PS10 · Mix-your-case builder ───────────────────────────── */

const FLAVOURS = [
  { n: "Blood Orange", d: "Zero sugar · 140 mg", c: "#e2552e" },
  { n: "Kokum Lime", d: "Zero sugar · 140 mg", c: "#a8c93a" },
  { n: "Blue Raspberry", d: "Low sugar · 160 mg", c: "#3f7bff" },
  { n: "Tender Coconut", d: "Caffeine free", c: "#e9e1cf" },
];
// order the auto-builder adds cans in (24 picks); final counts 8 · 6 · 6 · 4
const ORDER = [0, 1, 2, 0, 3, 1, 0, 2, 2, 0, 1, 3, 0, 2, 1, 0, 3, 2, 1, 0, 2, 1, 3, 0];
const FINAL = ORDER.length;
const PS10_CSS = `.ps10-case{position:relative;overflow:hidden}.ps10-case::after{content:"";position:absolute;inset:-40%;background:linear-gradient(115deg,transparent 40%,rgba(255,255,255,.07) 50%,transparent 60%);animation:ps10-sheen 3.4s linear infinite;pointer-events:none}@keyframes ps10-sheen{from{transform:translateX(-45%)}to{transform:translateX(45%)}}.ps10-can{transition:transform .35s cubic-bezier(.34,1.4,.64,1),background-color .3s}.is-static .ps10-case::after{animation:none;opacity:0}html.is-static {.ps10-case::after{animation:none;opacity:0}}`;

/** PS10 · A 24-slot case on the left fills as flavours are added on the right; Add to cart unlocks when it's full. */
function PS10() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M3");
  // 24 adds + a short hold on the full case, then it empties and fills again (static: the full case)
  const [step, setStep] = useSteps(r, FINAL + 5, 240, FINAL);
  const [manual, setManual] = useState<number[] | null>(null);
  const filled = manual ? null : ORDER.slice(0, Math.min(step, FINAL));
  const counts = manual ?? FLAVOURS.map((_, k) => (filled ?? []).filter((f) => f === k).length);
  const slots = manual ? manual.flatMap((c, k) => Array<number>(c).fill(k)) : (filled ?? []);
  const total = counts.reduce((a, b) => a + b, 0);
  const full = total === FINAL;
  const bump = (k: number, d: number) => {
    const next = [...counts];
    if (d > 0 && total >= FINAL) return;
    next[k] = Math.max(0, next[k] + d);
    setManual(next);
  };
  useEffect(() => {
    if (manual) setStep(0);
  }, [manual, setStep]);
  return (
    <Sec innerRef={r} theme="ink" font="condensed" className="py-[clamp(72px,9vw,140px)]">
      <style>{PS10_CSS}</style>
      <div className="grid grid-cols-1 items-end gap-6 md:grid-cols-12">
        <H className="text-[clamp(52px,6.6vw,120px)] uppercase md:col-span-7">Build your case of 24.</H>
        <P className="max-w-[40ch] md:col-span-5 md:pb-3">Mix any four flavours, any way you like. Full cases ship free and work out at ₹90 a can.</P>
      </div>
      <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 gap-[clamp(24px,3vw,48px)] md:grid-cols-12">
        <div data-m-card className="ps10-case rounded-[var(--sx-radius)] border border-[var(--sx-line)] bg-[var(--sx-surface)] p-[clamp(18px,2.4vw,36px)] md:col-span-7">
          <div className="grid grid-cols-6 gap-[clamp(8px,1.1vw,16px)]">
            {Array.from({ length: FINAL }, (_, k) => {
              const f = slots[k];
              const c = f === undefined ? null : FLAVOURS[f].c;
              return (
                <div key={k} className="relative aspect-square rounded-full border border-dashed border-[var(--sx-line)]">
                  <div className="ps10-can absolute inset-[6%] rounded-full" style={{ transform: c ? "scale(1)" : "scale(0.2)", backgroundColor: c ?? "transparent", boxShadow: c ? "inset 0 0 0 5px rgba(0,0,0,.18), inset 0 -10px 18px rgba(0,0,0,.25)" : "none" }}>
                    {c && <span className="absolute left-1/2 top-[28%] h-[18%] w-[30%] -translate-x-1/2 rounded-full bg-black/25" />}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-[var(--sx-line)] pt-5 text-[14px] text-[var(--sx-muted)]">
            <span>Case price, any mix</span>
            <span>
              <span data-m-num className="sx-display text-[clamp(28px,2.4vw,40px)] font-[800] text-[var(--sx-text)]">₹2,160</span>
              <s className="ml-3">₹2,640</s>
            </span>
          </div>
        </div>
        <div className="flex flex-col md:col-span-5">
          <div className="flex items-end justify-between">
            <p className="sx-display text-[clamp(56px,5.6vw,96px)] font-[800] leading-none tabular-nums">
              {total}
              <span className="text-[var(--sx-muted)]"> / 24</span>
            </p>
            <p className="pb-2 text-[14px] text-[var(--sx-muted)]">{full ? "Case full, ready to ship" : `${FINAL - total} cans to go`}</p>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--sx-line)]">
            <div className="h-full rounded-full bg-[var(--sx-accent)] transition-[width] duration-300" style={{ width: `${(total / FINAL) * 100}%` }} />
          </div>
          <ul className="mt-6 divide-y divide-[var(--sx-line)] border-y border-[var(--sx-line)]">
            {FLAVOURS.map((f, k) => (
              <li key={f.n} data-m-card className="flex items-center gap-4 py-4">
                <span className="h-9 w-9 shrink-0 rounded-full" style={{ background: f.c, boxShadow: "inset 0 0 0 4px rgba(0,0,0,.18)" }} />
                <div className="min-w-0 flex-1">
                  <p className="text-[17px] font-[650]">{f.n}</p>
                  <p className="text-[13px] text-[var(--sx-muted)]">{f.d}</p>
                </div>
                <div className="flex items-center gap-1 rounded-full border border-[var(--sx-line)] p-1">
                  <button aria-label={`Remove ${f.n}`} onClick={() => bump(k, -1)} className="grid h-8 w-8 place-items-center rounded-full text-[18px] text-[var(--sx-muted)] hover:bg-[var(--sx-line)]">−</button>
                  <span className="w-7 text-center text-[16px] font-[700] tabular-nums">{counts[k]}</span>
                  <button aria-label={`Add ${f.n}`} onClick={() => bump(k, 1)} className="grid h-8 w-8 place-items-center rounded-full text-[18px] hover:bg-[var(--sx-line)]">+</button>
                </div>
              </li>
            ))}
          </ul>
          <div className={`mt-7 transition-opacity duration-300 ${full ? "" : "pointer-events-none opacity-40"}`}>
            <Btn className="w-full justify-center">{full ? "Add case to cart · ₹2,160" : "Fill the case to continue"}</Btn>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────────── PS11 · Wheel label picker + crossfade image ───────────────────────────── */

const SCENTS = [
  { n: "Monsoon Vetiver", note: "Wet earth, vetiver root, green tea", price: "₹3,450" },
  { n: "Jasmine Sambac", note: "Night jasmine, pear, white musk", price: "₹3,200" },
  { n: "Smoked Oud", note: "Oud, birch tar, dried plum", price: "₹4,900" },
  { n: "Neroli Coast", note: "Orange blossom, sea salt, cedar", price: "₹2,950" },
  { n: "Saffron Leather", note: "Saffron, suede, labdanum", price: "₹4,200" },
  { n: "Fig & Cardamom", note: "Green fig, cardamom, sandalwood", price: "₹3,100" },
  { n: "Tuberose Noir", note: "Tuberose, black pepper, amber", price: "₹3,800" },
];
const ROW = 66;
const PS11_CSS = `.ps11-kb{animation:ps11-kb 6s ease-in-out infinite alternate}@keyframes ps11-kb{from{transform:scale(1.02) translate(-1.5%,0)}to{transform:scale(1.1) translate(1.5%,-1.5%)}}.is-static .ps11-kb{animation:none}html.is-static {.ps11-kb{animation:none}}`;

/** PS11 · A curved wheel of names (4/12) turns on its own; the big image (8/12) crossfades to the selected scent. */
function PS11() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M6");
  const [i, setI] = useSteps(r, SCENTS.length, 2200);
  const s = SCENTS[i];
  const n = SCENTS.length;
  return (
    <Sec innerRef={r} theme="paper" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <style>{PS11_CSS}</style>
      <div className="grid grid-cols-1 items-center gap-[clamp(32px,4vw,72px)] md:grid-cols-12">
        <div className="md:col-span-4">
          <H className="text-[clamp(44px,4.6vw,80px)]">Seven scents. Turn to choose.</H>
          <P className="mt-5 max-w-[34ch]">Extraits de parfum, 50 ml, blended in Kannauj and rested ninety days in glass.</P>
          <div
            className="relative mt-10 [perspective:900px]"
            style={{ height: ROW * 5, maskImage: "linear-gradient(180deg,transparent,#000 30%,#000 70%,transparent)", WebkitMaskImage: "linear-gradient(180deg,transparent,#000 30%,#000 70%,transparent)" }}
          >
            <div className="pointer-events-none absolute inset-x-0 top-1/2 h-[66px] -translate-y-1/2 border-y border-[var(--sx-line)]" />
            {SCENTS.map((x, k) => {
              let d = k - i;
              if (d > n / 2) d -= n;
              if (d < -n / 2) d += n;
              const a = Math.abs(d);
              return (
                <button
                  key={x.n}
                  onClick={() => setI(k)}
                  className="sx-display absolute inset-x-0 top-1/2 flex h-[66px] items-center whitespace-nowrap leading-none transition-all duration-700 ease-[cubic-bezier(.22,1,.36,1)]"
                  style={{
                    transform: `translateY(calc(-50% + ${d * ROW}px)) rotateX(${-d * 24}deg) scale(${a === 0 ? 1 : 0.78})`,
                    transformOrigin: "0% 50%",
                    opacity: a > 2 ? 0 : 1 - a * 0.32,
                    fontSize: "clamp(30px,2.8vw,46px)",
                    color: a === 0 ? "var(--sx-text)" : "var(--sx-muted)",
                  }}
                >
                  {x.n}
                </button>
              );
            })}
          </div>
        </div>
        <div className="md:col-span-8">
          <div className="relative aspect-[16/11] overflow-hidden rounded-[var(--sx-radius)]">
            <div className="ps11-kb absolute inset-0">
              {SCENTS.map((x, k) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={x.n} src={scene(k % 4, 1600, 1100, "")} alt="" className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000" style={{ opacity: k === i ? 1 : 0 }} draggable={false} />
              ))}
            </div>
            <div data-m-card className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(7,9,15,.6))] p-[clamp(20px,2.6vw,36px)] pt-24 text-white">
              <p className="text-[13px] uppercase tracking-[0.16em] text-white/70">{String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
            <div key={s.n}>
              <p className="sx-display text-[clamp(30px,2.6vw,42px)] leading-none">{s.n}</p>
              <p className="mt-2 text-[15px] text-[var(--sx-muted)]">{s.note}</p>
            </div>
            <div className="flex items-center gap-5">
              <Price now={s.price} className="text-[20px]" />
              <Btn>Add to bag</Btn>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────────── PS12 · Rotating product cube ───────────────────────────── */

const FACES = [
  { n: "Lattice Runner", c: "Glacier Blue", facts: [["Weight", "212 g"], ["Drop", "8 mm"], ["Upper", "One-piece knit"]], price: "₹8,490" },
  { n: "Lattice Trail", c: "Brick Red", facts: [["Weight", "268 g"], ["Lugs", "4.5 mm"], ["Upper", "Ripstop knit"]], price: "₹9,290" },
  { n: "Lattice Court", c: "Moss", facts: [["Weight", "305 g"], ["Sole", "Gum rubber"], ["Upper", "Suede + knit"]], price: "₹7,990" },
  { n: "Lattice Daily", c: "Sand", facts: [["Weight", "240 g"], ["Drop", "6 mm"], ["Upper", "Recycled mesh"]], price: "₹6,990" },
];
const PS12_CSS = `.ps12-swap{animation:ps12-swap .6s cubic-bezier(.22,1,.36,1)}@keyframes ps12-swap{from{opacity:0;transform:translateY(12px)}}.is-static .ps12-swap{animation:none}`;

/** PS12 · A big 3D cube with a colourway on each face turns slowly (drag to turn); name left, three facts right. */
function PS12() {
  const r = useRef<HTMLDivElement>(null);
  const cube = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M31");
  const angle = useRef(-28);
  const drag = useRef<{ x: number; a: number } | null>(null);
  const [face, setFace] = useState(0);
  const apply = () => {
    const a = angle.current;
    if (cube.current) cube.current.style.transform = `rotateX(-14deg) rotateY(${a}deg)`;
    const f = (((Math.round(-a / 90) % 4) + 4) % 4) as number;
    setFace((v) => (v === f ? v : f));
  };
  useTicker(r, (_, dt) => {
    if (drag.current) return;
    angle.current -= dt * 22;
    apply();
  });
  const f = FACES[face];
  return (
    <Sec innerRef={r} theme="ink" font="wide" className="py-[clamp(72px,9vw,140px)]">
      <style>{PS12_CSS}</style>
      <div className="text-center">
        <H className="mx-auto max-w-[18ch] text-[clamp(40px,5vw,84px)]">One last, four ways to wear it.</H>
      </div>
      <div className="mt-[clamp(40px,6vw,88px)] grid grid-cols-1 items-center gap-[clamp(32px,4vw,64px)] md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div key={`n${face}`} className="ps12-swap md:text-right">
          <p className="text-[13px] uppercase tracking-[0.16em] text-[var(--sx-accent)]">{f.c}</p>
          <p className="sx-display mt-3 text-[clamp(34px,3.4vw,56px)] font-[800] leading-[0.95]">{f.n}</p>
          <div className="mt-6 flex items-center gap-4 md:justify-end">
            <Price now={f.price} className="text-[19px]" />
            <Btn>Shop {f.c}</Btn>
          </div>
        </div>
        <div data-m-card className="grid place-items-center px-[clamp(24px,5vw,96px)] [perspective:1400px]">
          <div
            className="relative cursor-grab touch-none select-none active:cursor-grabbing"
            style={{ width: "clamp(220px,19vw,320px)", aspectRatio: "1/1" }}
            onPointerDown={(e) => {
              drag.current = { x: e.clientX, a: angle.current };
              (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!drag.current) return;
              angle.current = drag.current.a + (e.clientX - drag.current.x) * 0.5;
              apply();
            }}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
          >
            <div className="absolute inset-[-12%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_35%,transparent),transparent)]" />
            <div ref={cube} className="absolute inset-0 [transform-style:preserve-3d]" style={{ transform: "rotateX(-14deg) rotateY(-28deg)" }}>
              {FACES.map((x, k) => (
                <div key={x.n} className="absolute inset-0 overflow-hidden border border-white/10 [backface-visibility:hidden]" style={{ transform: `rotateY(${k * 90}deg) translateZ(calc(clamp(240px,26vw,400px) / 2))` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={scene(k, 900, 900, x.c.toUpperCase())} alt={x.n} className="h-full w-full object-cover" draggable={false} />
                </div>
              ))}
              <div className="absolute inset-0 bg-[var(--sx-surface)]" style={{ transform: "rotateX(90deg) translateZ(calc(clamp(240px,26vw,400px) / 2))" }}>
                <div className="grid h-full place-items-center text-[clamp(16px,1.4vw,22px)] font-[800] uppercase tracking-[0.3em] text-[var(--sx-muted)]">Lattice</div>
              </div>
            </div>
          </div>
        </div>
        <ul key={`f${face}`} className="ps12-swap divide-y divide-[var(--sx-line)] border-y border-[var(--sx-line)]">
          {f.facts.map(([k, v]) => (
            <li key={k} className="flex items-baseline justify-between gap-6 py-4">
              <span className="text-[14px] text-[var(--sx-muted)]">{k}</span>
              <span className="text-[clamp(18px,1.5vw,22px)] font-[650]">{v}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-10 text-center text-[13px] text-[var(--sx-muted)]">Drag the box to turn it · free returns for 30 days</p>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "PS09", name: "Product finder quiz", motion: "M34", C: PS09 },
  { code: "PS10", name: "Mix-your-case builder", motion: "M3", C: PS10 },
  { code: "PS11", name: "Wheel label picker + crossfade image", motion: "M6", C: PS11 },
  { code: "PS12", name: "Rotating product cube", motion: "M31", C: PS12 },
];
