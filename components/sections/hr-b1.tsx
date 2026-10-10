"use client";

// HR · Hero layouts, batch 1 (HR13–HR18). Each is a full designed section; motion via useSectionMotion or its own
// GSAP/ScrollTrigger code. ?static=1 shows every hero in its final state (the markup holds it).
import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { scene, useTicker } from "../fx/shared";
import { Btn, H, P, Pic, Price, Product, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/* ───────────────────────── HR13 · Video shrinks into the title ───────────────────────── */

const HR13_CSS = `
.hr13-film{background-size:240% 240%,160% 160%,cover;background-position:0% 0%,100% 50%,center;animation:hr13-film 7s ease-in-out infinite alternate}
@keyframes hr13-film{to{background-position:100% 100%,0% 50%,center}}
.hr13-word{-webkit-background-clip:text;background-clip:text;color:transparent}
html.is-static .hr13-film{animation:none}
html.is-static {.hr13-film{animation:none}}
`;
const hr13Film = (i: number) => ({
  backgroundImage: `radial-gradient(40% 50% at 30% 40%, color-mix(in srgb, var(--sx-accent) 75%, transparent), transparent 70%), linear-gradient(115deg, transparent 25%, color-mix(in srgb, var(--sx-text) 30%, transparent) 48%, transparent 62%), url("${scene(i, 1600, 1000)}")`,
});

/** HR13 · Opens on a full-screen film; on scroll the film survives only inside the letters of a huge title, which
 *  shrinks to sit centred on a plain field. Short sticky stage (170svh). */
function HR13() {
  const tall = useRef<HTMLDivElement>(null);
  const full = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = tall.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: true } });
      tl.fromTo(title.current, { scale: 3.2 }, { scale: 1, ease: "power1.inOut", duration: 1 }, 0)
        .fromTo(full.current, { opacity: 1 }, { opacity: 0, ease: "none", duration: 0.5 }, 0.15)
        .fromTo(copy.current, { opacity: 0, y: 40 }, { opacity: 1, y: 0, ease: "power2.out", duration: 0.3 }, 0.65);
    }, el);
    return () => ctx.revert();
  }, []);
  return (
    <Sec theme="ink" font="condensed" full className="overflow-clip!">
      <style>{HR13_CSS}</style>
      <div ref={tall} className="relative h-[170svh]">
        <div className="sticky top-0 h-[100svh] min-h-[620px] overflow-hidden">
          {/* the title: the same film, clipped to the letters */}
          <div className="absolute inset-0 grid place-items-center px-[clamp(20px,4vw,64px)]">
            <h1 ref={title} className="hr13-film hr13-word sx-display select-none text-center text-[clamp(180px,34vw,600px)] font-[800] leading-[0.78] will-change-transform" style={hr13Film(1)}>
              Rush
            </h1>
          </div>
          {/* the full-screen film that fades away to leave only the letters */}
          <div ref={full} className="hr13-film pointer-events-none absolute inset-0 z-10 opacity-0" style={hr13Film(1)}>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--sx-bg)_30%,transparent),transparent_40%,color-mix(in_srgb,var(--sx-bg)_70%,transparent))]" />
            <div className="absolute left-[clamp(20px,4vw,64px)] top-[clamp(24px,4vw,56px)] flex items-center gap-3 text-[14px] font-[650] text-[var(--sx-text)]">
              <span className="grid h-10 w-10 place-items-center rounded-full border border-[var(--sx-line)] bg-[color-mix(in_srgb,var(--sx-bg)_50%,transparent)] backdrop-blur-md">▶</span>
              Brand film · 0:30
            </div>
            <p className="sx-display absolute bottom-[clamp(24px,4vw,56px)] left-[clamp(20px,4vw,64px)] text-[clamp(28px,3vw,48px)] font-[800] leading-none">Rush · sparkling energy</p>
          </div>
          {/* copy that lands once the title has settled */}
          <div ref={copy} className="absolute inset-x-0 bottom-0 z-20 flex flex-wrap items-end justify-between gap-6 border-t border-[var(--sx-line)] px-[clamp(20px,5vw,96px)] py-[clamp(20px,2.6vw,36px)]">
            <p className="max-w-[40ch] text-[clamp(16px,1.2vw,19px)] leading-relaxed text-[var(--sx-muted)]">Sparkling energy with yuzu and green coffee. 0 g sugar, 140 mg caffeine, no crash at four.</p>
            <div className="flex flex-wrap items-center gap-5">
              <Price now="₹110" was="₹130" className="text-[18px]" />
              <Btn>Shop Rush</Btn>
              <Btn kind="ghost">Watch the film</Btn>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── HR14 · Torn-word reveal ───────────────────────── */

const TEAR = ["52% 0", "47% 16%", "54% 31%", "46% 47%", "53% 62%", "47% 78%", "52% 90%", "49% 100%"];
const TEAR_L = `polygon(0 0, ${TEAR.join(", ")}, 0 100%)`;
const TEAR_R = `polygon(${TEAR.join(", ")}, 100% 100%, 100% 0)`;
const HR14_CSS = `
.hr14-bob{animation:hr14-bob 3.2s ease-in-out infinite alternate}
@keyframes hr14-bob{from{transform:translateY(-10px) rotate(-1.5deg)}to{transform:translateY(12px) rotate(1.5deg)}}
.hr14-glow{animation:hr14-glow 2.6s ease-in-out infinite alternate}
@keyframes hr14-glow{from{transform:scale(.88);opacity:.65}to{transform:scale(1.08);opacity:1}}
html.is-static .hr14-bob,html.is-static .hr14-glow{animation:none}
html.is-static {.hr14-bob,.hr14-glow{animation:none}}
`;

/** HR14 · A giant slogan fills the width; on scroll it cracks and the halves tilt away left/right in 3D, revealing the
 *  can rising from behind. Short sticky stage (170svh). */
function HR14() {
  const tall = useRef<HTMLDivElement>(null);
  const left = useRef<HTMLDivElement>(null);
  const right = useRef<HTMLDivElement>(null);
  const crack = useRef<SVGSVGElement>(null);
  const can = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = tall.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: true } });
      tl.fromTo(crack.current, { opacity: 0, scaleY: 0 }, { opacity: 1, scaleY: 1, ease: "power2.out", duration: 0.14 }, 0.02)
        .fromTo(left.current, { x: 0, rotation: 0, rotationY: 0 }, { x: "-24vw", rotation: -3, rotationY: 22, ease: "power2.inOut", duration: 0.7 }, 0.14)
        .fromTo(right.current, { x: 0, rotation: 0, rotationY: 0 }, { x: "24vw", rotation: 3, rotationY: -22, ease: "power2.inOut", duration: 0.7 }, 0.14)
        .to(crack.current, { opacity: 0, duration: 0.12 }, 0.2)
        .fromTo(can.current, { yPercent: 70, scale: 0.8, opacity: 0 }, { yPercent: 0, scale: 1, opacity: 1, ease: "power3.out", duration: 0.65 }, 0.25)
        .fromTo(copy.current, { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: 0.25 }, 0.72);
    }, el);
    return () => ctx.revert();
  }, []);
  const word = <p className="sx-display whitespace-nowrap text-center text-[clamp(120px,21vw,380px)] font-[800] leading-[0.85] tracking-[-0.03em]">AWAKE</p>;
  return (
    <Sec theme="paper" font="wide" full className="overflow-clip!">
      <style>{HR14_CSS}</style>
      <div ref={tall} className="relative h-[170svh]">
        <div className="sticky top-0 h-[100svh] min-h-[620px] overflow-hidden [perspective:1400px]">
          {/* the can, behind the word */}
          <div ref={can} className="absolute inset-x-0 top-[8%] bottom-[18%] grid place-items-center">
            <div className="hr14-glow absolute aspect-square h-[86%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_42%,transparent),transparent)]" />
            <div className="hr14-bob relative h-full">
              <Product angle={1} accent="#7a3b22" className="h-full w-auto" />
            </div>
          </div>
          {/* the torn halves (final state in the markup: pulled apart) */}
          <div ref={left} className="absolute inset-x-0 top-[40%] z-10 -translate-y-1/2 will-change-transform" style={{ clipPath: TEAR_L, transform: "translateX(-24vw) rotate(-3deg)" }}>
            {word}
          </div>
          <div ref={right} className="absolute inset-x-0 top-[40%] z-10 -translate-y-1/2 will-change-transform" style={{ clipPath: TEAR_R, transform: "translateX(24vw) rotate(3deg)" }}>
            {word}
          </div>
          <svg ref={crack} viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 top-[40%] z-20 h-[clamp(102px,18vw,323px)] w-full -translate-y-1/2 opacity-0" aria-hidden>
            <polyline points="52,0 47,16 54,31 46,47 53,62 47,78 52,90 49,100" fill="none" stroke="var(--sx-accent)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
          </svg>
          <div ref={copy} className="absolute inset-x-0 bottom-0 z-20 grid grid-cols-1 items-end gap-6 px-[clamp(20px,5vw,96px)] pb-[clamp(24px,3.4vw,48px)] md:grid-cols-12">
            <div className="md:col-span-5">
              <p className="sx-display text-[clamp(26px,2.4vw,40px)] font-[700] leading-[1.05]">Nitro cold brew, now in a can.</p>
              <p className="mt-3 max-w-[40ch] text-[clamp(15px,1.1vw,18px)] leading-relaxed text-[var(--sx-muted)]">Twelve-hour steeped Chikmagalur Arabica, nitrogen-charged, 0 g sugar.</p>
            </div>
            <div className="flex flex-wrap items-center gap-5 md:col-span-7 md:justify-end">
              <Price now="₹160" className="text-[18px]" />
              <Btn>Pre-order batch one</Btn>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── HR15 · Copy, subject on a colour disc, stacked words ───────────────────────── */

const HR15_CSS = `
.hr15-sheen{background:conic-gradient(from 0deg,transparent 0 55%,color-mix(in srgb,var(--sx-accent-text) 26%,transparent) 70%,transparent 85%);animation:hr15-spin 9s linear infinite}
@keyframes hr15-spin{to{transform:rotate(360deg)}}
.hr15-bob{animation:hr15-bob 3.4s ease-in-out infinite alternate}
@keyframes hr15-bob{from{transform:translateY(-8px)}to{transform:translateY(10px)}}
html.is-static .hr15-sheen,html.is-static .hr15-bob{animation:none}
html.is-static {.hr15-sheen,.hr15-bob{animation:none}}
`;

/** HR15 · Three full-height columns: small copy left, a cut-out can on a big colour disc centre, three huge stacked words
 *  right; tiny nav row on top, social row at the bottom. The disc grows from its centre, the words pop letter by letter. */
function HR15() {
  const r = useRef<HTMLDivElement>(null);
  const disc = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M12");
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    const tw = gsap.fromTo(disc.current, { scale: 0 }, { scale: 1, duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 75%", toggleActions: "play none none reverse" } });
    return () => {
      tw.scrollTrigger?.kill();
      tw.kill();
    };
  }, []);
  return (
    <Sec innerRef={r} theme="stone" font="grotesk" className="py-[clamp(24px,2.6vw,40px)]">
      <style>{HR15_CSS}</style>
      <div className="flex min-h-[clamp(640px,100svh,980px)] flex-col">
        <nav className="flex items-center justify-between gap-6 text-[14px]">
          <span className="sx-display text-[18px] font-[800] tracking-[0.12em]">FERMENTA</span>
          <ul className="hidden items-center gap-8 text-[var(--sx-muted)] md:flex">
            <li>Shop</li>
            <li>Flavours</li>
            <li>How we brew</li>
            <li>Stockists</li>
          </ul>
          <span className="font-[650]">Cart (0)</span>
        </nav>
        <div className="grid flex-1 grid-cols-1 items-center gap-[clamp(24px,3vw,48px)] py-[clamp(32px,4vw,56px)] md:grid-cols-12">
          <div className="md:col-span-3">
            <P className="max-w-[28ch] text-[clamp(15px,1.05vw,17px)]">Small-batch kombucha, fermented for 21 days with whole ginger and Nagpur orange. Lightly sparkling, barely sweet.</P>
            <div className="mt-6 flex flex-col items-start gap-3">
              <Price now="₹1,080" className="text-[17px]" />
              <Btn kind="link">Shop the 12-bottle case →</Btn>
            </div>
          </div>
          <div className="relative grid min-h-[clamp(380px,64vh,640px)] place-items-center md:col-span-5">
            <div ref={disc} className="absolute aspect-square w-[min(100%,560px)] overflow-hidden rounded-full bg-[var(--sx-accent)]">
              <div className="hr15-sheen absolute inset-0 rounded-full" />
            </div>
            <div className="hr15-bob relative">
              <Product angle={0} accent="#e9b44c" className="h-[min(62vh,580px)] w-auto max-md:h-[44svh]" />
            </div>
          </div>
          <div className="md:col-span-4">
            <H as="h1" className="text-right text-[clamp(64px,8.6vw,156px)] leading-[0.88] tracking-[-0.04em]">
              <span className="block">Wild.</span>
              <span className="block">Raw.</span>
              <span className="block text-[var(--sx-accent)]">Alive.</span>
            </H>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--sx-line)] pt-5 text-[14px] text-[var(--sx-muted)]">
          <div className="flex gap-6">
            <span>Instagram</span>
            <span>Pinterest</span>
            <span>Journal</span>
          </div>
          <span>Brewed in Pune · ships across India</span>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── HR16 · Layered landscape parallax ───────────────────────── */

const HR16_CSS = `
.hr16-mist{animation:hr16-mist 14s ease-in-out infinite alternate}
.hr16-mist.b{animation-duration:10s;animation-direction:alternate-reverse}
@keyframes hr16-mist{from{transform:translateX(-8%)}to{transform:translateX(8%)}}
html.is-static .hr16-mist{animation:none}
html.is-static {.hr16-mist{animation:none}}
`;

/** HR16 · Three cut-out landscape layers with the title tucked between the far range and the near hills; every layer
 *  scrolls at its own speed (multi-speed parallax) while mist bands drift across. */
function HR16() {
  const r = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const st = { trigger: el, start: "top top", end: "bottom top", scrub: true } as const;
      [
        ["[data-l='sky']", 30],
        ["[data-l='back']", 34],
        ["[data-l='title']", 60],
        ["[data-l='mid']", 16],
        ["[data-l='front']", 0],
      ].forEach(([s, y]) => gsap.to(el.querySelectorAll(s as string), { yPercent: y as number, ease: "none", scrollTrigger: st }));
      gsap.from(el.querySelectorAll("[data-l]"), { y: (i: number) => [0, 60, 90, 110, 140][i] ?? 0, opacity: (i: number) => (i === 2 ? 0 : 1), duration: 1.6, ease: "power3.out", stagger: 0.08 });
    }, el);
    return () => ctx.revert();
  }, []);
  return (
    <Sec innerRef={r} theme="ink" font="serif" full>
      <style>{HR16_CSS}</style>
      <div className="relative h-[clamp(640px,100svh,980px)] overflow-hidden">
        {/* sky + moon */}
        <div data-l="sky" className="absolute inset-0 bg-[linear-gradient(180deg,var(--sx-bg)_0%,color-mix(in_srgb,var(--sx-accent)_28%,var(--sx-bg))_55%,color-mix(in_srgb,var(--sx-accent)_45%,var(--sx-bg))_80%)]">
          <div className="absolute right-[18%] top-[14%] aspect-square w-[clamp(70px,7vw,120px)] rounded-full bg-[color-mix(in_srgb,var(--sx-text)_88%,var(--sx-accent))] shadow-[0_0_120px_40px_color-mix(in_srgb,var(--sx-accent)_35%,transparent)]" />
        </div>
        {/* far range */}
        <svg data-l="back" viewBox="0 0 1440 600" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[70%] w-full" aria-hidden>
          <path d="M0 330 L120 250 L230 300 L360 190 L470 260 L600 150 L720 240 L850 170 L980 260 L1110 180 L1240 250 L1350 200 L1440 240 L1440 600 L0 600 Z" fill="color-mix(in srgb, var(--sx-accent) 38%, var(--sx-bg))" />
        </svg>
        <div className="hr16-mist pointer-events-none absolute inset-x-[-10%] top-[46%] h-[16%] rounded-[50%] bg-[color-mix(in_srgb,var(--sx-text)_14%,transparent)] blur-[40px]" />
        {/* the title, between the far range and the near hills */}
        <div data-l="title" className="absolute inset-x-0 top-[40%] px-6 text-center">
          <h1 className="sx-display text-[clamp(72px,11vw,200px)] font-[500] leading-[0.9] tracking-[-0.03em] text-[var(--sx-text)]">Above the clouds</h1>
        </div>
        {/* near hills */}
        <svg data-l="mid" viewBox="0 0 1440 600" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[60%] w-full" aria-hidden>
          <path d="M0 260 C160 190 300 200 440 250 C580 300 700 170 860 180 C1020 190 1120 280 1260 240 C1350 215 1400 205 1440 215 L1440 600 L0 600 Z" fill="color-mix(in srgb, var(--sx-accent) 20%, var(--sx-bg))" />
        </svg>
        <div className="hr16-mist b pointer-events-none absolute inset-x-[-10%] top-[66%] h-[12%] rounded-[50%] bg-[color-mix(in_srgb,var(--sx-text)_10%,transparent)] blur-[36px]" />
        {/* foreground tea rows */}
        <svg data-l="front" viewBox="0 0 1440 600" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[36%] w-full" aria-hidden>
          <path d="M0 220 C200 150 360 170 520 220 C700 275 860 170 1040 180 C1200 190 1320 250 1440 230 L1440 600 L0 600 Z" fill="color-mix(in srgb, var(--sx-text) 4%, var(--sx-bg))" />
          {[300, 360, 420, 480].map((y, k) => (
            <path key={y} d={`M0 ${y} C300 ${y - 60 + k * 6} 640 ${y + 30} 960 ${y - 20} S1300 ${y + 10} 1440 ${y - 10}`} fill="none" stroke="color-mix(in srgb, var(--sx-accent) 30%, transparent)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
        {/* copy on the foreground */}
        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-end justify-between gap-6 px-[clamp(20px,5vw,96px)] pb-[clamp(24px,3.4vw,48px)]">
          <p className="max-w-[40ch] text-[clamp(15px,1.15vw,18px)] leading-relaxed text-[var(--sx-muted)]">First-flush Nilgiri, hand-plucked at 2,100 m before the mist lifts. Highfield Estate, since 1921.</p>
          <div className="flex flex-wrap items-center gap-5">
            <span className="text-[15px] text-[var(--sx-muted)]">
              100 g caddy · <Price now="₹780" className="text-[var(--sx-text)]" />
            </span>
            <Btn>Shop the harvest</Btn>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── HR17 · Headline over a full-width image belt ───────────────────────── */

const HR17_CSS = `
.hr17-belt{animation:hr17-belt 46s linear infinite}
@keyframes hr17-belt{to{transform:translateX(-50%)}}
html.is-static .hr17-belt{animation:none}
html.is-static {.hr17-belt{animation:none}}
`;
const PANTRY = [
  { l: "MANGO CHUTNEY", p: "₹340", i: 3 },
  { l: "WILD HONEY", p: "₹520", i: 1 },
  { l: "LIME PICKLE", p: "₹290", i: 2 },
  { l: "JAGGERY GRANOLA", p: "₹460", i: 0 },
  { l: "KOKUM SYRUP", p: "₹380", i: 1 },
  { l: "GUAVA JAM", p: "₹310", i: 3 },
  { l: "CHILLI CRISP", p: "₹420", i: 2 },
  { l: "COCONUT BUTTER", p: "₹490", i: 0 },
];

/** HR17 · Top 55%: centred headline that rises word by word with a CTA. Bottom 45%: an endless belt of portrait product
 *  cards running edge to edge, so the hero never stands still. */
function HR17() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M6");
  return (
    <Sec innerRef={r} theme="paper" font="editorial" full>
      <style>{HR17_CSS}</style>
      <div className="grid h-[clamp(700px,100svh,1040px)] grid-cols-[minmax(0,1fr)] grid-rows-[55fr_45fr]">
        <div className="flex flex-col items-center justify-center px-6 pt-[clamp(32px,4vw,56px)] text-center">
          <H as="h1" className="max-w-[15ch] text-[clamp(52px,7.4vw,132px)]">A summer pantry, made by hand.</H>
          <P className="mx-auto mt-5 max-w-[46ch]">Chutneys, honey and pickles from twelve farm kitchens across Kerala and Goa. Packed in glass, sent in three days.</P>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Btn>Build a hamper · from ₹1,200</Btn>
            <Btn kind="ghost">Meet the kitchens</Btn>
          </div>
        </div>
        <div className="min-w-0 overflow-hidden pb-[clamp(20px,2.4vw,36px)] pt-[clamp(20px,2.4vw,36px)]">
          <div className="hr17-belt flex h-full w-max gap-[clamp(12px,1.4vw,20px)]">
            {[...PANTRY, ...PANTRY].map((c, k) => (
              <div key={k} className="relative aspect-[3/4] h-full shrink-0" aria-hidden={k >= PANTRY.length}>
                <Pic i={c.i} ratio="auto" label={c.l} className="absolute inset-0 h-full w-full" />
                <span className="absolute right-3 top-3 rounded-full bg-[var(--sx-surface)] px-3 py-1.5 text-[13px] font-[650] tabular-nums">{c.p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── HR18 · Scatter-to-ring image hero ───────────────────────── */

const N18 = 16;
// scatter seeds (fractions of the stage, centred at 0), kept out of the headline box
const SCATTER: [number, number, number][] = [
  [-0.42, -0.36, -12], [-0.27, -0.4, 8], [-0.08, -0.42, -6], [0.12, -0.38, 10], [0.31, -0.41, -9], [0.44, -0.3, 14],
  [0.4, -0.06, -7], [0.43, 0.2, 11], [0.3, 0.38, -13], [0.1, 0.42, 6], [-0.12, 0.38, -10], [-0.3, 0.42, 9],
  [-0.44, 0.24, -8], [-0.41, -0.02, 12], [-0.34, -0.18, -4], [0.34, 0.12, 5],
];
const LABELS18 = ["CERAMICS", "TEXTILE", "PRINT", "CANE", "GLASS", "BRASS", "PAPER", "WOOD"];
const ease = (a: number, b: number, p: number) => {
  const t = Math.min(1, Math.max(0, (p - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
/** Position + rotation of tile k at scroll progress p and time t (aspect = stage width / height). */
function hr18At(k: number, p: number, t: number, aspect: number) {
  const a = ease(0.05, 0.45, p);
  const b = ease(0.58, 0.98, p);
  const ringW = a * (1 - b);
  // scatter (with a slow float)
  const [sx, sy, sr] = SCATTER[k];
  const fx = sx + Math.sin(t * 0.9 + k) * 0.006;
  const fy = sy + Math.cos(t * 0.8 + k * 1.3) * 0.01;
  // ring (round on screen: x radius scaled by the aspect), slowly orbiting
  const ang = (k / N18) * Math.PI * 2 + t * 0.18 * ringW - Math.PI / 2;
  const R = 0.38;
  const rx = (Math.cos(ang) * R) / aspect;
  const ry = Math.sin(ang) * R;
  const rr = (ang * 180) / Math.PI + 90;
  // arc along the bottom (a low rainbow), drifting gently
  const u = k / (N18 - 1);
  const ax = -0.45 + 0.9 * u;
  const ay = 0.4 - Math.sin(Math.PI * u) * 0.17 + Math.sin(t * 1.1 + k * 0.6) * 0.006 * b;
  const ar = Math.cos(Math.PI * u) * -22;
  const mix = (s: number, r: number, c: number) => (s + (r - s) * a) * (1 - b) + c * b;
  return { x: mix(fx, rx, ax), y: mix(fy, ry, ay), r: mix(sr, rr, ar) };
}

/** HR18 · Small images scattered around a centred headline gather into a slowly orbiting ring on scroll, then unroll
 *  into an arc along the bottom. Short sticky stage (200svh); static shows the arc. */
function HR18() {
  const tall = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const tiles = useRef<(HTMLDivElement | null)[]>([]);
  const prog = useRef(0);
  const smooth = useRef(0);
  useEffect(() => {
    const el = tall.current;
    if (!el || prefersReducedMotion()) return;
    const st = ScrollTrigger.create({ trigger: el, start: "top top", end: "bottom bottom", onUpdate: (s) => (prog.current = s.progress), onRefresh: (s) => (prog.current = s.progress) });
    return () => st.kill();
  }, []);
  useTicker(stage, (t) => {
    const s = stage.current!;
    const aspect = s.clientWidth / Math.max(1, s.clientHeight);
    smooth.current += (prog.current - smooth.current) * 0.12;
    tiles.current.forEach((tile, k) => {
      if (!tile) return;
      const q = hr18At(k, smooth.current, t, aspect);
      tile.style.left = `${(50 + q.x * 100).toFixed(3)}%`;
      tile.style.top = `${(50 + q.y * 100).toFixed(3)}%`;
      tile.style.rotate = `${q.r.toFixed(2)}deg`;
    });
  });
  return (
    <Sec theme="ink" font="grotesk" full className="overflow-clip!">
      <div ref={tall} className="relative h-[200svh]">
        <div ref={stage} className="sticky top-0 h-[100svh] min-h-[640px] overflow-hidden">
          <div className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[min(70vw,760px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_22%,transparent),transparent)]" />
          {Array.from({ length: N18 }, (_, k) => {
            const q = hr18At(k, 1, 0, 1.6);
            return (
              <div
                key={k}
                ref={(n) => {
                  tiles.current[k] = n;
                }}
                className="absolute w-[clamp(64px,6.4vw,112px)] -translate-x-1/2 -translate-y-1/2 shadow-[0_20px_40px_-20px_rgba(0,0,0,.6)] will-change-[left,top,rotate]"
                style={{ left: `${50 + q.x * 100}%`, top: `${50 + q.y * 100}%`, rotate: `${q.r}deg` }}
              >
                <Pic i={k % 4} ratio="3/4" label={LABELS18[k % LABELS18.length]} className="rounded-[10px]" />
              </div>
            );
          })}
          <div className="absolute left-1/2 top-[44%] z-10 w-[min(36vw,560px)] -translate-x-1/2 -translate-y-1/2 text-center max-md:w-[80vw]">
            <h1 className="sx-display text-balance text-[clamp(40px,4.8vw,84px)] font-[800] leading-[0.95] tracking-[-0.03em]">Sixty makers. Four days.</h1>
            <p className="mx-auto mt-4 max-w-[34ch] text-[clamp(15px,1.1vw,18px)] leading-relaxed text-[var(--sx-muted)]">The Monsoon Makers Fair · 14–17 August · an old cashew warehouse in Panaji.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Btn>Get passes · ₹600</Btn>
              <Btn kind="ghost">See the makers</Btn>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "HR13", name: "Video shrinks into the title", motion: "M13", C: HR13 },
  { code: "HR14", name: "Torn-word reveal", motion: "M31", C: HR14 },
  { code: "HR15", name: "Copy, subject on a colour disc, stacked words", motion: "M12", C: HR15 },
  { code: "HR16", name: "Layered landscape parallax", motion: "M7", C: HR16 },
  { code: "HR17", name: "Headline over a full-width image belt", motion: "M6", C: HR17 },
  { code: "HR18", name: "Scatter-to-ring image hero", motion: "M33", C: HR18 },
];
