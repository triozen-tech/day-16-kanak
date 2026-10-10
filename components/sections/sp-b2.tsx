"use client";

// SP · Social proof layouts, batch 2 (docs/SECTION-MENU.md). Reviewers are invented (fake names, placeholder portraits).
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger, SplitText } from "@/lib/gsap";
import { Avatar, Btn, H, P, Pic, Stars, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Hands-free cycling: steps an index every `ms` while the section is on screen (stops off screen and in ?static=1). */
function useAutoCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms = 2200) {
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

/* ---------------------------------------------------------------------------------------------------------------- */

const REEL = [
  { name: "Ira Menon", role: "Night serum, 4 months", q: "My skin stopped looking tired before I did. The night serum is the only step I never skip now." },
  { name: "Kabir Shah", role: "Barrier cream, 6 weeks", q: "Winter in Delhi used to crack my cheeks. Six weeks in, nothing flakes, nothing stings." },
  { name: "Tara Iyer", role: "Vitamin C drops, 3 months", q: "The dark spots from last summer faded slowly, then all at once. Friends asked what changed." },
  { name: "Neel Varma", role: "Daily SPF 50, 2 months", q: "Finally a sunscreen that disappears on brown skin. No white cast, no grease by noon." },
];

/** SP07 · Counter-scrolling portrait reel: three portrait columns (middle up, outer down), the active quote rises letter by letter under them. */
function SP07() {
  const r = useRef<HTMLDivElement>(null);
  const cols = useRef<(HTMLDivElement | null)[]>([]);
  const quote = useRef<HTMLParagraphElement>(null);
  const [i] = useAutoCycle(r, REEL.length, 2600);
  const rv = REEL[i];

  // M42: opposite scroll, the columns travel against each other with the page (plus a slow CSS loop inside each)
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      cols.current.forEach((c, k) => {
        if (!c) return;
        const up = k === 1;
        gsap.fromTo(c, { yPercent: up ? 6 : -6 }, { yPercent: up ? -6 : 6, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
      });
    }, el);
    return () => ctx.revert();
  }, []);

  // the active reviewer's quote rises letter by letter
  useEffect(() => {
    const q = quote.current;
    if (!q || prefersReducedMotion()) return;
    const s = SplitText.create(q, { type: "words,chars", mask: "chars" });
    const tw = gsap.from(s.chars, { yPercent: 110, duration: 0.6, ease: "power3.out", stagger: 0.011 });
    return () => {
      tw.kill();
      s.revert();
    };
  }, [i]);

  const portraits = [
    [0, 2, 1, 3],
    [3, 1, 0, 2],
    [2, 0, 3, 1],
  ];
  return (
    <Sec innerRef={r} theme="stone" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <style>{`
        @keyframes sp07-up { from { transform: translateY(0) } to { transform: translateY(-50%) } }
        @keyframes sp07-down { from { transform: translateY(-50%) } to { transform: translateY(0) } }
        .sp07-up { animation: sp07-up 34s linear infinite; }
        .sp07-down { animation: sp07-down 38s linear infinite; }
        html.is-static .sp07-up, html.is-static .sp07-down { animation: none; }
        html.is-static { .sp07-up, .sp07-down { animation: none; } }
      `}</style>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[13ch] text-[clamp(44px,5.6vw,96px)]">Skin, seen up close.</H>
        <div className="max-w-[34ch] pb-2">
          <P>Real faces after real weeks. 4.8 average from 9,200 verified reviews of the Dewline range.</P>
          <p className="mt-4 flex items-center gap-3 text-[15px]">
            <Stars n={5} /> <span className="text-[var(--sx-muted)]">4.8 / 5</span>
          </p>
        </div>
      </div>

      <div
        className="relative mx-auto mt-[clamp(40px,5vw,72px)] grid h-[clamp(460px,58vh,620px)] max-w-[1080px] grid-cols-3 gap-[clamp(10px,1.4vw,20px)] overflow-hidden"
        style={{ maskImage: "linear-gradient(180deg, transparent, #000 14%, #000 86%, transparent)", WebkitMaskImage: "linear-gradient(180deg, transparent, #000 14%, #000 86%, transparent)" }}
      >
        {portraits.map((set, k) => (
          <div key={k} ref={(n) => void (cols.current[k] = n)} className="min-w-0">
            <div className={`flex flex-col gap-[clamp(10px,1.4vw,20px)] ${k === 1 ? "sp07-up" : "sp07-down"}`}>
              {[...set, ...set].map((p, j) => (
                <Pic key={j} i={p} ratio="3/4" label={j % 4 === 0 ? REEL[(k + j) % REEL.length].name.toUpperCase() : ""} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-[clamp(32px,4vw,56px)] max-w-[900px] text-center">
        <p ref={quote} key={i} className="sx-display text-[clamp(26px,2.6vw,40px)] leading-[1.18] tracking-[-0.01em]">
          &ldquo;{rv.q}&rdquo;
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Avatar name={rv.name} i={i} size={40} />
          <p className="text-left text-[15px]">
            <b className="font-[650]">{rv.name}</b>
            <span className="block text-[13px] text-[var(--sx-muted)]">{rv.role}</span>
          </p>
        </div>
        <div className="mt-6 flex justify-center gap-2" aria-hidden>
          {REEL.map((_, k) => (
            <span key={k} className={`h-[3px] rounded-full transition-all duration-500 ${k === i ? "w-10 bg-[var(--sx-accent)]" : "w-4 bg-[var(--sx-line)]"}`} />
          ))}
        </div>
      </div>
    </Sec>
  );
}

/* ---------------------------------------------------------------------------------------------------------------- */

const WALL = [
  { n: "Ananya Rao", t: "Roasted makhana that actually tastes of ghee and pepper. The family pack lasted two days.", p: "Peri-peri makhana" },
  { n: "Rohan Kapoor", t: "My 4 pm crisp habit, swapped. Crunchy, light, and I don't feel heavy in meetings after.", p: "Himalayan salt" },
  { n: "Meera Pillai", t: "Ordered the tasting tin as a gift and kept it. Re-ordered the gift.", p: "Tasting tin" },
  { n: "Dev Malhotra", t: "Cheese and herb is dangerous. I hide it from my flatmates now.", p: "Cheese & herb" },
  { n: "Sana Qureshi", t: "Shipping was quick, every pouch sealed and crisp. Not one stale piece in six orders.", p: "Monthly box" },
  { n: "Arjun Bose", t: "Kids think it's popcorn. I think it's protein. Everyone wins at movie night.", p: "Caramel jaggery" },
  { n: "Leela Nair", t: "Finally a snack label I can read without googling. Five ingredients, all real.", p: "Classic salted" },
  { n: "Vikram Joshi", t: "Took two tins on a trek in Spiti. Light in the bag, gone by day three.", p: "Trail pack" },
  { n: "Pooja Sethi", t: "The mint chutney flavour is exactly like the chaat stall near my school.", p: "Pudina chatpata" },
  { n: "Kiran Das", t: "Subscribed after one pouch. The monthly mix keeps it from getting boring.", p: "Monthly box" },
  { n: "Nisha Reddy", t: "Low on oil, high on flavour. My dietitian approved, my taste buds too.", p: "Peri-peri makhana" },
  { n: "Farhan Ali", t: "Bought for the office pantry. It's the first thing gone every Monday.", p: "Office case" },
];

/** SP08 · Vertical counter-scrolling review columns: header centred, a 500px band of four review columns looping up and down, faded at the edges. */
function SP08() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M32");
  const cols = [0, 1, 2, 3].map((c) => WALL.filter((_, k) => k % 4 === c));
  return (
    <Sec innerRef={r} theme="ink" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <style>{`
        @keyframes sp08-up { from { transform: translateY(0) } to { transform: translateY(-50%) } }
        @keyframes sp08-down { from { transform: translateY(-50%) } to { transform: translateY(0) } }
        .sp08-up { animation: sp08-up var(--d) linear infinite; }
        .sp08-down { animation: sp08-down var(--d) linear infinite; }
        html.is-static .sp08-up, html.is-static .sp08-down { animation: none; }
        html.is-static { .sp08-up, .sp08-down { animation: none; } }
      `}</style>
      <div className="mx-auto max-w-[820px] text-center">
        <H className="text-[clamp(44px,5.6vw,96px)]">Twelve thousand crunchy opinions.</H>
        <P className="mx-auto mt-5 max-w-[46ch]">Roasted lotus seeds in nine flavours. Here is what people say once the pouch is empty.</P>
        <p className="mt-6 inline-flex items-center gap-3 rounded-full border border-[var(--sx-line)] px-5 py-2 text-[14px]">
          <Stars n={5} /> 4.9 average · 12,480 reviews
        </p>
      </div>

      <div
        className="relative mt-[clamp(40px,5vw,72px)] grid h-[500px] grid-cols-1 gap-[clamp(12px,1.4vw,20px)] overflow-hidden md:grid-cols-4"
        style={{ maskImage: "linear-gradient(180deg, transparent, #000 18%, #000 82%, transparent)", WebkitMaskImage: "linear-gradient(180deg, transparent, #000 18%, #000 82%, transparent)" }}
      >
        {cols.map((list, c) => (
          <div key={c} data-m-col className={`min-w-0 ${c > 1 ? "max-md:hidden" : ""}`}>
            <div className={`flex flex-col gap-[clamp(12px,1.4vw,20px)] ${c % 2 ? "sp08-down" : "sp08-up"}`} style={{ ["--d" as string]: `${26 + c * 4}s` }}>
              {[...list, ...list].map((w, k) => (
                <figure key={k} className="sx-card p-[clamp(18px,1.8vw,26px)]">
                  <Stars n={5} />
                  <blockquote className="mt-3 text-[16px] leading-relaxed">{w.t}</blockquote>
                  <figcaption className="mt-5 flex items-center gap-3">
                    <Avatar name={w.n} i={k + c} size={34} />
                    <span className="text-[14px] leading-tight">
                      <b className="font-[650]">{w.n}</b>
                      <span className="block text-[12px] text-[var(--sx-muted)]">Bought: {w.p}</span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-[clamp(32px,4vw,56px)] flex flex-wrap justify-center gap-4">
        <Btn>Try the tasting tin · ₹499</Btn>
        <Btn kind="ghost">Read all reviews</Btn>
      </div>
    </Sec>
  );
}

/* ---------------------------------------------------------------------------------------------------------------- */

const INLINE = [
  { n: "Anaya Rao", q: "Like rain on hot stone, then something warm underneath. I get stopped on the street.", s: 5 },
  { n: "Zoya Mirza", q: "I wore it to my sister's wedding and three aunties asked for the name. Lasts till the last dance.", s: 5 },
  { n: "Kabir Sen", q: "Smoky without being loud. It sits close to the skin, the way a good scent should.", s: 5 },
  { n: "Rhea Thomas", q: "The dry-down is all sandalwood and old books. I've finished one bottle and bought two.", s: 4 },
];

/** SP09 · Inline-name testimonials paragraph: names inside a large paragraph are underlined triggers; a quote card pops next to each in turn. */
function SP09() {
  const r = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M20");
  const [i, setI] = useAutoCycle(r, INLINE.length, 2300);
  const para = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLElement>(null);
  const [top, setTop] = useState<number | null>(null);
  const t = INLINE[i];

  // the card sits in the right-hand column, level with the active name (measured, so it follows the text wrap)
  useLayoutEffect(() => {
    const place = () => {
      const b = box.current;
      const p = para.current;
      const n = b?.querySelector<HTMLElement>(`[data-name="${i}"]`);
      if (!b || !p || !n) return;
      const br = b.getBoundingClientRect();
      const nr = n.getBoundingClientRect();
      const ch = card.current?.offsetHeight ?? 200;
      const maxTop = Math.max(0, p.offsetHeight - ch);
      setTop(Math.max(0, Math.min(nr.top - br.top - 8, maxTop)));
    };
    place();
    window.addEventListener("resize", place);
    ScrollTrigger.addEventListener("refresh", place);
    return () => {
      window.removeEventListener("resize", place);
      ScrollTrigger.removeEventListener("refresh", place);
    };
  }, [i]);

  const name = (k: number) => (
    <span data-name={k} onMouseEnter={() => setI(k)} className="sp09-name cursor-pointer">
      {INLINE[k].n}
    </span>
  );
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(80px,10vw,160px)]">
      <style>{`
        .sp09-name, .sp09-name * { text-decoration-line: underline; text-decoration-color: var(--sx-accent); text-decoration-thickness: 2px; text-underline-offset: 0.16em; }
        .sp09-box[data-active="0"] [data-name="0"], .sp09-box[data-active="1"] [data-name="1"],
        .sp09-box[data-active="2"] [data-name="2"], .sp09-box[data-active="3"] [data-name="3"] { color: var(--sx-accent); }
        @keyframes sp09-pop { from { opacity: 0; transform: translateY(var(--dy)) scale(.92) } to { opacity: 1; transform: none } }
        .sp09-card { animation: sp09-pop .5s cubic-bezier(.2,.8,.2,1) both; }
        html.is-static .sp09-card { animation: none; }
        html.is-static { .sp09-card { animation: none; } }
      `}</style>
      <div className="pointer-events-none absolute inset-0 fx-pan" aria-hidden>
        <div className="fx-drift absolute left-[52%] top-[18%] aspect-square w-[46vw] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_16%,transparent),transparent)]" />
      </div>
      <div data-active={i} className="sp09-box relative mx-auto max-w-[1180px]">
        <div ref={box} className="relative grid grid-cols-1 gap-[clamp(28px,3vw,48px)] md:grid-cols-12">
          <div ref={para} className="md:col-span-8">
            <H className="text-[clamp(28px,2.9vw,48px)] font-[400] leading-[1.24] tracking-[-0.015em]">
              Halcyone No. 7 was made for one winter. {name(0)} calls it rain on stone, {name(1)} wore it to a wedding till dawn, {name(2)} wears it for the quiet, and {name(3)} has lost count of the bottles.
            </H>
          </div>
          <div className="relative md:col-span-4 md:min-h-[230px]">
            <figure
              key={i}
              ref={card}
              className="sp09-card sx-card z-10 w-full max-w-[380px] p-5 shadow-[0_30px_60px_-30px_rgba(28,24,19,.45)] md:absolute md:inset-x-0"
              style={{ top: top ?? 0, ["--dy" as string]: "10px" }}
            >
              <div className="flex items-center gap-3">
                <Avatar name={t.n} i={i + 1} size={38} />
                <div className="text-[14px] leading-tight">
                  <b className="font-[650]">{t.n}</b>
                  <span className="block text-[12px]">
                    <Stars n={t.s} />
                  </span>
                </div>
              </div>
              <blockquote className="mt-3 text-[15px] leading-relaxed text-[var(--sx-muted)]">&ldquo;{t.q}&rdquo;</blockquote>
            </figure>
          </div>
        </div>
        <div className="mt-[clamp(40px,5vw,72px)] flex flex-wrap items-center justify-between gap-6 border-t border-[var(--sx-line)] pt-8">
          <P className="max-w-[44ch]">Eau de parfum with oud, vetiver and smoked sandalwood. 50 ml, made in Kannauj.</P>
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-[18px] font-[650] tabular-nums">₹3,850</span>
            <Btn>Add to bag</Btn>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "SP07", name: "Counter-scrolling portrait reel", motion: "M42", C: SP07 },
  { code: "SP08", name: "Vertical counter-scrolling review columns", motion: "M32", C: SP08 },
  { code: "SP09", name: "Inline-name testimonials paragraph", motion: "M20", C: SP09 },
];
