"use client";

// HR · Hero layouts, batch 4 (HR29–HR33). Each is a full designed section; motion via useSectionMotion, an fx component
// or its own small GSAP/timer code. ?static=1 shows every hero in its final state (the markup holds it).
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { LightRays } from "../fx/more";
import { Avatar, Btn, H, P, Pic, Price, Product, Sec, Stars } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Runs `fn` every `ms` while the element is on screen (stops off screen and in ?static=1 / reduced motion). */
function useOnScreenInterval(ref: React.RefObject<HTMLElement | null>, ms: number, fn: () => void) {
  const cb = useRef(fn);
  cb.current = fn;
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let t: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (e.isIntersecting) t = setInterval(() => cb.current(), ms);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, [ref, ms]);
}

/* ───────────────────────── HR29 · Split hero with twin shoppable image cards ───────────────────────── */

const HR29_CSS = `
.hr29-kb{animation:hr29-kb var(--d,6s) ease-in-out infinite alternate}
@keyframes hr29-kb{from{scale:1.03;translate:-2% 1%}to{scale:1.15;translate:2% -3%}}
.hr29-sheen{animation:hr29-sheen var(--s,3s) linear infinite;animation-delay:var(--sd,0s)}
@keyframes hr29-sheen{from{transform:translateX(-140%) skewX(-14deg)}to{transform:translateX(360%) skewX(-14deg)}}
html.is-static .hr29-kb,html.is-static .hr29-sheen{animation:none}
html.is-static .hr29-sheen{opacity:0}
html.is-static {.hr29-kb,.hr29-sheen{animation:none}.hr29-sheen{opacity:0}}
`;

const HR29_CARDS = [
  { i: 1, line: "Women", t: "The wrap dresses", d: "Garment-washed, bias cut, six earth tones.", price: "₹4,290", cta: "Shop women", dur: "6.2s", sheen: "3.1s" },
  { i: 3, line: "Men", t: "The camp shirts", d: "Heavy 190 gsm linen, mother-of-pearl buttons.", price: "₹3,450", cta: "Shop men", dur: "4.6s", sheen: "3.7s" },
];

/** HR29 · Copy left (5/12: serif headline, short copy, an avatar stack of happy wearers); two tall portrait cards right
 *  (7/12), each a separate entry point with its own caption, price and button. The cards unfold from their corners
 *  (M18), then each photo drifts on its own period while a soft light passes over it. */
function HR29() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M18");
  const people = ["Ira Menon", "Kabir Shah", "Tara Iyer", "Neel Bose"];
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <style>{HR29_CSS}</style>
      <div className="grid grid-cols-1 items-center gap-[clamp(32px,5vw,80px)] md:grid-cols-12">
        <div className="md:col-span-5">
          <H as="h1" className="max-w-[11ch] text-[clamp(48px,5.6vw,96px)] font-[500]">Linen for long, slow summers.</H>
          <P className="mt-6 max-w-[38ch]">Two lines, one cloth. Woven in Bhagalpur, washed soft in Jaipur and cut to be worn for years, not seasons.</P>
          <div data-m-text className="mt-10 flex flex-wrap items-center gap-5">
            <div className="flex">
              {people.map((n, k) => (
                <span key={n} className={`rounded-full ring-[3px] ring-[var(--sx-bg)] ${k ? "-ml-3" : ""}`}>
                  <Avatar name={n} i={k} size={44} />
                </span>
              ))}
            </div>
            <div className="text-[14px] leading-snug">
              <Stars n={5} />
              <p className="mt-1 text-[var(--sx-muted)]">
                <b className="font-[650] text-[var(--sx-text)]">4.9</b> from 2,140 wearers
              </p>
            </div>
          </div>
          <p data-m-text className="mt-8 text-[14px] text-[var(--sx-muted)]">Free alterations on every piece · returns within 30 days</p>
        </div>
        <div className="grid grid-cols-1 gap-[clamp(12px,1.4vw,20px)] md:col-span-7 md:grid-cols-2">
          {HR29_CARDS.map((c, k) => (
            <article key={c.line} data-m-card className={`relative aspect-[3/4.3] overflow-hidden rounded-[var(--sx-radius)] text-white ${k ? "md:mt-[12%]" : "md:mb-[12%]"}`}>
              <div className="hr29-kb absolute inset-0" style={{ ["--d" as string]: c.dur }}>
                <Pic i={c.i} ratio="auto" round={false} label="" className="absolute inset-0 h-full w-full" />
              </div>
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="hr29-sheen absolute inset-y-0 left-0 w-[34%] bg-[linear-gradient(90deg,transparent,rgba(255,244,226,.2),transparent)]" style={{ ["--s" as string]: c.sheen, ["--sd" as string]: `${-k * 1.3}s` }} />
              </div>
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,14,8,.35),transparent_30%,transparent_45%,rgba(20,14,8,.85))]" />
              <p className="absolute left-[clamp(18px,2vw,28px)] top-[clamp(18px,2vw,28px)] rounded-full border border-white/30 bg-black/20 px-3.5 py-1.5 text-[12px] uppercase tracking-[0.16em] backdrop-blur-sm">{c.line}</p>
              <div className="absolute inset-x-0 bottom-0 p-[clamp(18px,2vw,28px)]">
                <p className="sx-display text-[clamp(26px,2.3vw,36px)] leading-[1.02]">{c.t}</p>
                <p className="mt-2 max-w-[28ch] text-[14px] leading-relaxed text-white/75">{c.d}</p>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[15px]">
                    from <Price now={c.price} />
                  </span>
                  <Btn className="px-5! py-2.5! text-[14px]">{c.cta}</Btn>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── HR30 · Depth-of-field chip cloud ───────────────────────── */

const HR30_CSS = `
.hr30-chip{animation:hr30-focus 3.4s ease-in-out infinite alternate, hr30-bob var(--b,4s) ease-in-out infinite alternate;animation-delay:var(--fd,0s),var(--bd,0s)}
@keyframes hr30-focus{from{filter:blur(0);opacity:1}to{filter:blur(2.5px);opacity:.5}}
@keyframes hr30-bob{from{translate:0 -8px}to{translate:0 8px}}
.hr30-glow{animation:hr30-glow 5.6s ease-in-out infinite alternate}
@keyframes hr30-glow{from{transform:scale(1) rotate(0deg);opacity:.55}to{transform:scale(1.12) rotate(8deg);opacity:.85}}
html.is-static .hr30-chip,html.is-static .hr30-glow{animation:none}
html.is-static {.hr30-chip,.hr30-glow{animation:none}}
`;

const HR30_NOTES = [
  { n: "Bergamot", layer: "top", c: "#e9d34a" },
  { n: "Pink pepper", layer: "top", c: "#e88aa0" },
  { n: "Cardamom", layer: "top", c: "#8fd19e" },
  { n: "Saffron", layer: "heart", c: "#f09a3a" },
  { n: "Jasmine sambac", layer: "heart", c: "#f4ecd8" },
  { n: "Damask rose", layer: "heart", c: "#d9476b" },
  { n: "Oud", layer: "base", c: "#9a6a3c" },
  { n: "Vetiver", layer: "base", c: "#6f8f54" },
  { n: "Ambergris", layer: "base", c: "#c9a46a" },
];

/** HR30 · A narrow centred serif title, text and button; under it a 3×3 cloud of note chips (top, heart, base), every
 *  other chip blurred and the cells staggered left/right, over a radial-masked glow photo. Light rays sway over the
 *  scene (M61) and the focus racks between the sharp and blurred chips. */
function HR30() {
  return (
    <Sec theme="ink" font="serif" className="relative py-[clamp(72px,9vw,140px)]" style={{ ["--accent" as string]: "#e0913f" }}>
      <style>{HR30_CSS}</style>
      <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_50%_55%_at_50%_62%,#000,transparent)]">
        <div className="hr30-glow absolute inset-0">
          <Pic i={3} ratio="auto" round={false} className="absolute inset-0 h-full w-full" />
        </div>
      </div>
      <LightRays className="absolute inset-0 opacity-70" count={7} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_42%_30%_at_50%_24%,rgba(7,9,15,.65),transparent)]" />
      <div className="relative z-10 mx-auto max-w-[620px] text-center">
        <H as="h1" className="text-[clamp(46px,5.4vw,92px)] font-[400]">Notes that arrive slowly.</H>
        <P className="mx-auto mt-6 max-w-[40ch] text-white/80">Monsoon Oud opens bright, warms into saffron and rose, and settles on wood and skin for twelve hours.</P>
        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <Btn>Discover Monsoon Oud · ₹4,800</Btn>
        </div>
      </div>
      <div className="relative z-10 mx-auto mt-[clamp(48px,6vw,88px)] grid max-w-[980px] grid-cols-1 gap-y-[clamp(14px,1.6vw,24px)] md:grid-cols-3">
        {HR30_NOTES.map((x, k) => {
          const soft = k % 2 === 1;
          const row = Math.floor(k / 3);
          const end = (k + row) % 2 === 1;
          return (
            <div key={x.n} className={`flex ${end ? "justify-end" : "justify-start"} ${row === 1 ? "md:px-[6%]" : ""}`}>
              <div
                data-m-card
                className={`hr30-chip inline-flex items-center gap-3 rounded-full border border-white/15 bg-[color-mix(in_srgb,var(--sx-surface)_62%,transparent)] py-2.5 pl-2.5 pr-5 backdrop-blur-md ${soft ? "opacity-50 blur-[2px]" : ""}`}
                style={{ ["--fd" as string]: soft ? "-3.4s" : "0s", ["--b" as string]: `${3.2 + (k % 4) * 0.6}s`, ["--bd" as string]: `${-k * 0.5}s` }}
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                    <path d="M12 3c3.5 4.4 5.5 7.6 5.5 10.4A5.5 5.5 0 0 1 6.5 13.4C6.5 10.6 8.5 7.4 12 3z" fill={x.c} />
                  </svg>
                </span>
                <span className="text-[16px] font-[600] text-white">{x.n}</span>
                <span className="text-[12px] uppercase tracking-[0.14em] text-white/50">{x.layer}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Sec>
  );
}

/* ───────────────────────── HR31 · Split hero with cycling card stack ───────────────────────── */

const HR31_CSS = `
.hr31-float{animation:hr31-float 3.2s ease-in-out infinite alternate}
@keyframes hr31-float{from{translate:0 -10px;rotate:-1.2deg}to{translate:0 10px;rotate:1.2deg}}
.hr31-orb{animation:hr31-orb 5s ease-in-out infinite alternate}
@keyframes hr31-orb{from{transform:translate(-14%,8%) scale(.9)}to{transform:translate(14%,-10%) scale(1.15)}}
html.is-static .hr31-float,html.is-static .hr31-orb{animation:none}
html.is-static {.hr31-float,.hr31-orb{animation:none}}
`;

type HR31Card = { kind: "review" | "product" | "stat" | "ingredient" };
const HR31_CARDS: HR31Card[] = [{ kind: "review" }, { kind: "product" }, { kind: "stat" }, { kind: "ingredient" }];

function HR31Face({ kind }: HR31Card) {
  if (kind === "review")
    return (
      <div className="flex h-full flex-col p-[clamp(22px,2.4vw,36px)]">
        <Stars n={5} />
        <p className="sx-display mt-5 text-[clamp(24px,2.1vw,34px)] font-[500] leading-[1.15]">&ldquo;Three weeks in and my skin finally stopped arguing with me.&rdquo;</p>
        <div className="mt-auto flex items-center gap-3 pt-6">
          <Avatar name="Meera Pillai" i={3} size={42} />
          <div className="text-[14px] leading-snug">
            <p className="font-[650]">Meera Pillai</p>
            <p className="text-[var(--sx-muted)]">Combination skin · verified buyer</p>
          </div>
        </div>
      </div>
    );
  if (kind === "product")
    return (
      <div className="flex h-full flex-col">
        <div className="relative min-h-0 flex-1 bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_30%,transparent),transparent),linear-gradient(180deg,var(--sx-bg),var(--sx-surface))]">
          <Product angle={1} accent="#1f5f4a" className="absolute inset-0 m-auto h-[82%] w-[82%]" />
        </div>
        <div className="flex items-end justify-between gap-4 border-t border-[var(--sx-line)] p-[clamp(18px,2vw,28px)]">
          <div>
            <p className="text-[17px] font-[650]">Barrier Calm Serum</p>
            <p className="mt-1 text-[14px] text-[var(--sx-muted)]">Ceramides + oat · 30 ml</p>
          </div>
          <Price now="₹1,190" className="text-[18px]" />
        </div>
      </div>
    );
  if (kind === "stat")
    return (
      <div className="flex h-full flex-col justify-between bg-[var(--sx-accent)] p-[clamp(22px,2.4vw,36px)] text-[var(--sx-accent-text)]">
        <p className="text-[14px] font-[600] uppercase tracking-[0.14em] opacity-80">Clinical study, 112 people</p>
        <div>
          <p className="sx-display text-[clamp(84px,8vw,136px)] font-[700] leading-[0.85] tracking-[-0.04em]">92%</p>
          <p className="mt-4 max-w-[24ch] text-[17px] leading-snug">saw calmer, less red skin within four weeks.</p>
        </div>
      </div>
    );
  return (
    <div className="flex h-full flex-col p-[clamp(22px,2.4vw,36px)]">
      <p className="text-[14px] font-[600] uppercase tracking-[0.14em] text-[var(--sx-accent)]">What&apos;s inside</p>
      <ul className="mt-5 divide-y divide-[var(--sx-line)] border-y border-[var(--sx-line)]">
        {[
          ["Ceramide NP", "rebuilds the barrier"],
          ["Colloidal oat", "settles redness"],
          ["Panthenol 5%", "holds water in"],
          ["Fragrance", "none, ever"],
        ].map(([a, b]) => (
          <li key={a} className="flex items-baseline justify-between gap-4 py-3.5">
            <span className="text-[17px] font-[650]">{a}</span>
            <span className="text-right text-[14px] text-[var(--sx-muted)]">{b}</span>
          </li>
        ))}
      </ul>
      <p className="mt-auto pt-5 text-[14px] text-[var(--sx-muted)]">Dermatologist tested · pH 5.5</p>
    </div>
  );
}

/** HR31 · Copy and CTAs left; on the right a deck of four offset cards (a review, the product, a stat, the ingredients)
 *  that cycles by itself: the front card drops away and slides in at the back every two seconds. Copy rises from blur
 *  (M6); the deck floats gently between swaps. */
function HR31() {
  const r = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const busy = useRef(false);
  useSectionMotion(r, "M6");
  const n = HR31_CARDS.length;
  const [front, setFront] = useState(0);
  useOnScreenInterval(r, 2100, () => {
    const el = cards.current[front];
    if (!el || busy.current) return;
    busy.current = true;
    gsap.to(el, {
      y: 140,
      rotation: -7,
      opacity: 0,
      duration: 0.45,
      ease: "power2.in",
      onComplete: () => {
        setFront((f) => (f + 1) % n);
        gsap.fromTo(el, { y: -30, rotation: 0, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power2.out", delay: 0.1, onComplete: () => void (busy.current = false) });
      },
    });
  });
  return (
    <Sec innerRef={r} theme="stone" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <style>{HR31_CSS}</style>
      <div className="grid grid-cols-1 items-center gap-[clamp(32px,5vw,80px)] md:grid-cols-12">
        <div className="md:col-span-6">
          <H as="h1" className="max-w-[12ch] text-[clamp(52px,6.4vw,108px)]">Skin that finally behaves.</H>
          <P className="mt-6 max-w-[42ch]">A four-step barrier routine for sensitive, reactive skin. Fragrance-free, made in small batches in Pune.</P>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Btn>Build my routine</Btn>
            <Btn kind="ghost">Take the skin quiz</Btn>
          </div>
          <p data-m-text className="mt-8 text-[14px] text-[var(--sx-muted)]">
            Starter kit <Price now="₹2,450" was="₹2,980" className="text-[var(--sx-text)]" /> · 18,000+ five-star reviews
          </p>
        </div>
        <div className="relative md:col-span-6">
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="hr31-orb aspect-square w-[85%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_28%,transparent),transparent)]" />
          </div>
          <div className="hr31-float relative mx-auto h-[clamp(500px,42vw,620px)] max-w-[560px]">
            {HR31_CARDS.map((c, k) => {
              const p = (k - front + n) % n;
              return (
                <div
                  key={c.kind}
                  data-m-card
                  className="absolute bottom-[4%] left-[6%] right-[14%] top-[14%] transition-[translate,scale,opacity] duration-700 ease-[cubic-bezier(.2,.8,.2,1)]"
                  style={{ zIndex: n - p, translate: `${p * 26}px ${-p * 26}px`, scale: String(1 - p * 0.045), opacity: p === n - 1 ? 0.55 : 1 }}
                >
                  <div ref={(el) => void (cards.current[k] = el)} className="sx-card h-full overflow-hidden shadow-[0_40px_80px_-40px_rgba(17,20,24,.45)]">
                    <HR31Face kind={c.kind} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── HR32 · Type-only hero with a flipping word slot ───────────────────────── */

const HR32_CSS = `
.hr32-in{animation:hr32-in .55s cubic-bezier(.2,.8,.2,1) both}
@keyframes hr32-in{from{transform:translateY(70%);filter:blur(8px);opacity:0}to{transform:none;filter:none;opacity:1}}
.hr32-a{animation:hr32-a 3.4s linear infinite alternate}
@keyframes hr32-a{from{transform:translate(-30%,-10%) scale(.9)}to{transform:translate(35%,15%) scale(1.15)}}
.hr32-b{animation:hr32-b 5.2s linear infinite alternate}
@keyframes hr32-b{from{transform:translate(25%,10%) scale(1.1)}to{transform:translate(-30%,-12%) scale(.85)}}
html.is-static .hr32-in,html.is-static .hr32-a,html.is-static .hr32-b{animation:none}
html.is-static {.hr32-in,.hr32-a,.hr32-b{animation:none}}
`;

const HR32_WORDS = ["slow mornings", "first dates", "late deadlines", "Sunday papers", "second cups"];

/** HR32 · No imagery: one centred line, "Welcome to [word]", where the last word sits in a bordered pill that cycles
 *  through uses of the café. The pill's width animates to each new word so the whole line reflows around it; letters
 *  pop out of a mask on entry (M12). Two soft lights drift behind the type. */
function HR32() {
  const r = useRef<HTMLDivElement>(null);
  const meas = useRef<(HTMLSpanElement | null)[]>([]);
  const [w, setW] = useState<number[]>([]);
  const [i, setI] = useState(0);
  useSectionMotion(r, "M12");
  useOnScreenInterval(r, 1900, () => setI((v) => (v + 1) % HR32_WORDS.length));
  useLayoutEffect(() => {
    const measure = () => setW(meas.current.map((m) => (m ? m.getBoundingClientRect().width : 0)));
    measure();
    document.fonts?.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  const word = HR32_WORDS[i];
  return (
    <Sec innerRef={r} theme="paper" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <style>{HR32_CSS}</style>
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="hr32-a absolute aspect-square w-[46vw] max-w-[760px] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_40%,transparent),transparent)]" />
        <div className="hr32-b absolute aspect-square w-[38vw] max-w-[620px] rounded-full bg-[radial-gradient(closest-side,rgba(212,162,76,.42),transparent)]" />
      </div>
      <div className="relative flex min-h-[clamp(560px,78svh,820px)] flex-col items-center justify-center text-center">
        <p data-m-text className="text-[15px] font-[600] text-[var(--sx-muted)]">Halfmoon Coffee House · Indiranagar</p>
        <h1 className="sx-display mt-8 flex flex-wrap items-center justify-center gap-x-[0.28em] gap-y-3 text-[clamp(40px,5.6vw,92px)] font-[700] leading-[1.05] tracking-[-0.03em]">
          <span data-m-head>Welcome to</span>
          <span
            data-m-card
            className="relative inline-flex h-[1.3em] items-center overflow-hidden whitespace-nowrap rounded-[0.32em] border-2 border-[var(--sx-accent)] bg-[color-mix(in_srgb,var(--sx-accent)_8%,var(--sx-surface))] px-[0.3em] text-[var(--sx-accent)] transition-[width] duration-[600ms] ease-[cubic-bezier(.65,0,.35,1)]"
            style={{ width: w[i] ? `calc(${w[i]}px + 0.6em + 4px)` : undefined }}
          >
            <span key={word} className="hr32-in inline-block">
              {word}
            </span>
          </span>
        </h1>
        {/* hidden copies of every word measure the pill's target widths */}
        <span aria-hidden className="pointer-events-none invisible absolute left-0 top-0 whitespace-nowrap text-[clamp(40px,5.6vw,92px)] font-[700] tracking-[-0.03em]">
          {HR32_WORDS.map((x, k) => (
            <span key={x} ref={(el) => void (meas.current[k] = el)} className="sx-display absolute left-0 top-0 inline-block">
              {x}
            </span>
          ))}
        </span>
        <P className="mx-auto mt-9 max-w-[46ch]">Single-origin pour-overs, cardamom buns from the oven at seven, and long tables nobody hurries you away from.</P>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Btn>See the menu</Btn>
          <Btn kind="ghost">Reserve a table</Btn>
        </div>
        <p data-m-text className="mt-8 text-[14px] text-[var(--sx-muted)]">
          Pour-over from <Price now="₹220" className="text-[var(--sx-text)]" /> · open 7 am to 11 pm, every day
        </p>
      </div>
    </Sec>
  );
}

/* ───────────────────────── HR33 · Split-flap board headline ───────────────────────── */

const HR33_COLS = 14;
const HR33_MSGS = [
  ["NOW BOARDING", "MUMBAI TO GOA"],
  ["DEPARTS 2100", "PLATFORM 4"],
  ["DINNER CAR", "OPEN TILL 2330"],
  ["SUNRISE AT", "MADGAON 0715"],
];
const HR33_GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const hr33Board = (m: string[]) =>
  m
    .map((row) => {
      const pad = Math.floor((HR33_COLS - row.length) / 2);
      return (" ".repeat(pad) + row).padEnd(HR33_COLS, " ").slice(0, HR33_COLS);
    })
    .join("")
    .split("");

const HR33_CSS = `
.hr33-flap{opacity:0;transform-origin:50% 100%}
.hr33-flip .hr33-flap{animation:hr33-flap .16s ease-in both}
@keyframes hr33-flap{from{opacity:1;transform:rotateX(0)}to{opacity:1;transform:rotateX(-90deg)}}
.hr33-sweep{animation:hr33-sweep 2.4s linear infinite}
@keyframes hr33-sweep{from{transform:translateX(-50%) skewX(-18deg)}to{transform:translateX(420%) skewX(-18deg)}}
html.is-static .hr33-flap,html.is-static .hr33-sweep{animation:none;opacity:0}
html.is-static {.hr33-flap,.hr33-sweep{animation:none;opacity:0}}
`;

/** One split-flap tile; `n` changes on every flip so the falling flap replays. */
function HR33Tile({ ch, n }: { ch: string; n: number }) {
  return (
    <span className="relative block aspect-[3/4] overflow-hidden rounded-[6px] bg-[linear-gradient(180deg,#1a1e27_0%,#141821_49.5%,#0c0f15_50.5%,#11141c_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_10px_24px_-14px_rgba(0,0,0,.8)] [perspective:300px]" style={{ containerType: "inline-size" }}>
      <span className="absolute inset-0 grid place-items-center font-mono font-[700] leading-none text-[#f3efe4]" style={{ fontSize: "62cqw" }}>
        {ch === " " ? "" : ch}
      </span>
      <span key={n} className={n ? "hr33-flip" : ""}>
        <span className="hr33-flap absolute inset-x-0 top-0 h-1/2 rounded-t-[6px] bg-[linear-gradient(180deg,#252a35,#1a1e27)]" />
      </span>
      <span className="absolute inset-x-0 top-1/2 h-px bg-black/70" />
    </span>
  );
}

/** HR33 · A wide departure board of character tiles centred on a plain field: it flips letter by letter to spell
 *  rotating messages (M48 family, a mechanical roll of characters), with a small line above and the CTA below. A light
 *  sweep crosses the board while it holds. */
function HR33() {
  const r = useRef<HTMLDivElement>(null);
  const first = hr33Board(HR33_MSGS[0]);
  const [board, setBoard] = useState<{ c: string[]; n: number[] }>({ c: first, n: first.map(() => 0) });
  const sim = useRef({ tick: 0, msg: 0, cur: first.slice(), target: first.slice(), start: first.map(() => 0), left: first.map(() => 0), n: first.map(() => 0), lastMsg: 0 });
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    const s = sim.current;
    const load = (chars: string[]) => {
      s.target = chars;
      s.cur.forEach((c, k) => {
        const changes = c !== chars[k];
        s.start[k] = s.tick + Math.round(k * 0.75);
        s.left[k] = changes ? 3 + Math.floor(Math.random() * 4) : 0;
      });
      s.lastMsg = s.tick;
    };
    let t: ReturnType<typeof setInterval> | undefined;
    const step = () => {
      s.tick++;
      if (s.tick - s.lastMsg > 50) {
        s.msg = (s.msg + 1) % HR33_MSGS.length;
        load(hr33Board(HR33_MSGS[s.msg]));
      }
      let changed = false;
      s.cur.forEach((_, k) => {
        if (s.left[k] > 0 && s.tick >= s.start[k]) {
          s.left[k]--;
          s.cur[k] = s.left[k] === 0 ? s.target[k] : HR33_GLYPHS[Math.floor(Math.random() * HR33_GLYPHS.length)];
          s.n[k]++;
          changed = true;
        }
      });
      if (changed) setBoard({ c: s.cur.slice(), n: s.n.slice() });
    };
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (e.isIntersecting) {
        // on entry: spin the board up from blank into the current message
        s.cur = s.cur.map(() => " ");
        load(hr33Board(HR33_MSGS[s.msg]));
        t = setInterval(step, 55);
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, []);
  return (
    <Sec innerRef={r} theme="ink" font="condensed" className="py-[clamp(72px,9vw,140px)]">
      <style>{HR33_CSS}</style>
      <div className="relative flex min-h-[clamp(560px,80svh,840px)] flex-col items-center justify-center">
        <p className="flex items-center gap-3 text-[14px] font-[600] uppercase tracking-[0.2em] text-[var(--sx-muted)]">
          <span className="h-2 w-2 rounded-full bg-[#f2b33d]" />
          The Saltline · overnight rail
        </p>
        <h1 className="sr-only">Now boarding: Mumbai to Goa</h1>
        <div className="relative mt-[clamp(28px,3.4vw,52px)] w-full max-w-[1240px] rounded-[18px] border border-[var(--sx-line)] bg-[#05070b] p-[clamp(12px,1.4vw,22px)] shadow-[0_60px_120px_-60px_rgba(0,0,0,.9)]" aria-hidden>
          <div className="grid gap-[clamp(4px,0.5vw,8px)]" style={{ gridTemplateColumns: `repeat(${HR33_COLS}, minmax(0,1fr))` }}>
            {board.c.map((ch, k) => (
              <HR33Tile key={k} ch={ch} n={board.n[k]} />
            ))}
          </div>
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[18px]">
            <div className="hr33-sweep absolute inset-y-0 left-0 w-[22%] bg-[linear-gradient(90deg,transparent,rgba(255,240,210,.1),transparent)]" />
          </div>
        </div>
        <div className="mt-[clamp(32px,4vw,56px)] flex w-full max-w-[1240px] flex-wrap items-end justify-between gap-6">
          <P className="max-w-[44ch]">Sleep in a teak-panelled cabin, wake to the Konkan coast. Twelve hours, nine stations, one very good dinner car.</P>
          <div className="flex flex-wrap items-center gap-4">
            <Btn>Book a cabin · from ₹14,500</Btn>
            <Btn kind="ghost">See the route</Btn>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "HR29", name: "Split hero with twin shoppable image cards", motion: "M18", C: HR29 },
  { code: "HR30", name: "Depth-of-field chip cloud", motion: "M61", C: HR30 },
  { code: "HR31", name: "Split hero with cycling card stack", motion: "M6", C: HR31 },
  { code: "HR32", name: "Type-only hero with a flipping word slot", motion: "M12", C: HR32 },
  { code: "HR33", name: "Split-flap board headline", motion: "M48", C: HR33 },
];
