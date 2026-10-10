"use client";

// HR · Hero layouts, batch 2 (HR19–HR23). Each is a full designed section; motion via useSectionMotion or its own
// GSAP/ScrollTrigger code. ?static=1 shows every hero in its final state (the markup holds it).
import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger, SplitText } from "@/lib/gsap";
import { scene, useTicker } from "../fx/shared";
import { Btn, H, P, Pic, Price, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/* ───────────────────────── HR19 · Bottom-anchored giant title on a full-bleed photo ───────────────────────── */

const HR19_CSS = `
.hr19-cta{animation:hr19-cta 3.4s ease-in-out infinite}
@keyframes hr19-cta{0%,100%{box-shadow:0 0 0 0 color-mix(in srgb,var(--sx-accent) 45%,transparent)}50%{box-shadow:0 0 0 18px color-mix(in srgb,var(--sx-accent) 0%,transparent)}}
html.is-static .hr19-cta{animation:none}
html.is-static {.hr19-cta{animation:none}}
`;

/** HR19 · Full-bleed photo; a two-line title anchored to the bottom-left baseline with an "Est." tag above it, a round
 *  pill CTA in the opposite corner. The photo settles from 118 %, the title's letters pop out of a mask (M12). */
function HR19() {
  const r = useRef<HTMLDivElement>(null);
  const photo = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    const once = { trigger: el, start: "top 75%", toggleActions: "play none none reverse" } as const;
    const ctx = gsap.context(() => {
      gsap.fromTo(photo.current, { scale: 1.18 }, { scale: 1, duration: 2.4, ease: "power3.out", scrollTrigger: once });
      const s = SplitText.create(title.current!, { type: "lines,chars", mask: "chars" });
      gsap.from(s.chars, { yPercent: 115, duration: 0.9, ease: "power4.out", stagger: 0.035, delay: 0.25, scrollTrigger: once });
      gsap.from(el.querySelectorAll("[data-hr19-in]"), { y: 24, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.1, delay: 0.7, scrollTrigger: once });
    }, el);
    return () => ctx.revert();
  }, []);
  return (
    <Sec innerRef={r} theme="ink" font="editorial" full>
      <style>{HR19_CSS}</style>
      <div className="relative h-[clamp(640px,100svh,1000px)] overflow-hidden">
        <div ref={photo} className="absolute inset-0 will-change-transform">
          <div className="fx-pan absolute -inset-[3%]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={scene(3, 1920, 1200)} alt="" className="fx-drift h-full w-full object-cover" draggable={false} />
          </div>
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,9,15,.45),rgba(7,9,15,0)_26%,rgba(7,9,15,.1)_55%,rgba(7,9,15,.82))]" />
        {/* slim top bar */}
        <div data-hr19-in className="absolute inset-x-0 top-0 flex items-center justify-between px-[clamp(20px,5vw,96px)] py-[clamp(20px,2.4vw,36px)] text-white">
          <span className="sx-display text-[clamp(22px,1.9vw,30px)] italic">Fernhill</span>
          <ul className="hidden gap-9 text-[14px] text-white/80 md:flex">
            <li>Rooms</li>
            <li>Dining</li>
            <li>The estate</li>
            <li>Journal</li>
          </ul>
        </div>
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-8 px-[clamp(20px,5vw,96px)] pb-[clamp(28px,4vw,64px)] md:flex-row md:items-end md:justify-between">
          <div className="text-white">
            <p data-hr19-in className="inline-flex items-center gap-3 rounded-full border border-white/30 px-4 py-2 text-[13px] uppercase tracking-[0.18em] text-white/85 backdrop-blur-sm">
              Est. 1932 · Nilgiri hills
            </p>
            <h1 ref={title} className="sx-display mt-5 text-[clamp(72px,11.5vw,188px)] font-[400] leading-[0.86] tracking-[-0.025em]">
              The Fernhill
              <br />
              Retreat
            </h1>
          </div>
          <div data-hr19-in className="flex items-end gap-6 text-white md:flex-col md:items-end">
            <p className="max-w-[24ch] text-[15px] leading-relaxed text-white/80 md:text-right">
              Twenty-two rooms in a colonial planter&apos;s house, fires lit at six. From <Price now="₹18,500" className="text-white" /> a night.
            </p>
            <a href="#" onClick={(e) => e.preventDefault()} className="hr19-cta grid aspect-square w-[clamp(120px,10vw,156px)] shrink-0 place-items-center rounded-full bg-[var(--sx-accent)] text-center text-[15px] font-[650] leading-tight text-[var(--sx-accent-text)]">
              Book
              <br />a stay ↗
            </a>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── HR20 · Isometric image wall behind a statement ───────────────────────── */

const HR20_CSS = `
.hr20-up{animation:hr20-up 34s linear infinite}
.hr20-down{animation:hr20-up 30s linear infinite reverse}
@keyframes hr20-up{from{transform:translateY(0)}to{transform:translateY(-50%)}}
html.is-static .hr20-up,html.is-static .hr20-down{animation:none}
html.is-static {.hr20-up,.hr20-down{animation:none}}
`;

/** HR20 · Four columns of photos on a plane rotated ~55° X / 45° Z (isometric), drifting up and down in alternation
 *  under a dark overlay; a centred statement with one highlighted word sits on top. Columns also drift with the
 *  scroll at different speeds (M32). */
function HR20() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M32");
  const items = ["Sand shirt · ₹3,490", "Wide trouser · ₹4,290", "Kurta, ecru · ₹3,890", "Wrap dress · ₹5,650", "Camp collar · ₹3,290", "Pleated short · ₹2,790"];
  return (
    <Sec innerRef={r} theme="ink" font="grotesk" full>
      <style>{HR20_CSS}</style>
      <div className="relative h-[clamp(680px,100svh,1000px)] overflow-hidden">
        <div className="absolute left-1/2 top-1/2 w-[clamp(1500px,125vw,2300px)]" style={{ transform: "translate(-50%,-50%) rotateX(55deg) rotateZ(-45deg)", transformStyle: "preserve-3d" }}>
          <div className="grid grid-cols-4 gap-[clamp(14px,1.4vw,24px)]">
            {Array.from({ length: 4 }, (_, c) => (
              <div key={c} data-m-col className="min-w-0" style={{ marginTop: `${(c % 2) * 18}%` }}>
                <div className={`${c % 2 ? "hr20-down" : "hr20-up"} flex flex-col gap-[clamp(14px,1.4vw,24px)]`}>
                  {[0, 1].flatMap((dup) =>
                    items.map((_, k) => (
                      <div key={`${dup}-${k}`} className="relative" aria-hidden={dup === 1}>
                        <Pic i={(k + c) % 4} ratio="4/5" round />
                        <span className="absolute bottom-3 left-3 rounded-full bg-black/45 px-3 py-1 text-[12px] text-white/90 backdrop-blur-sm">{items[(k + c * 2) % items.length]}</span>
                      </div>
                    )),
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute inset-0 bg-[rgba(7,9,15,.62)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_48%_42%_at_50%_50%,rgba(7,9,15,.7),transparent)]" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          <H as="h1" className="max-w-[14ch] text-[clamp(52px,7vw,120px)] text-white">
            Linen for the <span className="text-[var(--sx-accent)]">longest</span> summer.
          </H>
          <P className="mt-6 max-w-[46ch] text-white/75">Sixty pieces in washed Belgian flax, cut in Jaipur. Breathes at 40°, softens with every wash.</P>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Btn>Shop the collection</Btn>
            <Btn kind="ghost" className="border-white/30 text-white">
              Lookbook
            </Btn>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── HR21 · Day-to-night crossfade landscape ───────────────────────── */

const HR21_CSS = `
.hr21-night{animation:hr21-night 9s ease-in-out infinite alternate}
@keyframes hr21-night{0%,12%{opacity:0}88%,100%{opacity:1}}
.hr21-stars{background-image:radial-gradient(1.5px 1.5px at 12% 18%,#fff,transparent),radial-gradient(1px 1px at 26% 8%,#fff,transparent),radial-gradient(1.5px 1.5px at 44% 22%,#fff,transparent),radial-gradient(1px 1px at 61% 12%,#fff,transparent),radial-gradient(1.5px 1.5px at 78% 26%,#fff,transparent),radial-gradient(1px 1px at 88% 9%,#fff,transparent),radial-gradient(1px 1px at 35% 30%,#fff,transparent),radial-gradient(1.5px 1.5px at 70% 4%,#fff,transparent)}
html.is-static .hr21-night{animation:none}
html.is-static {.hr21-night{animation:none}}
`;

/** HR21 · The same landscape by day and by night, the night copy fading in and out on a slow loop; a scrim, then a
 *  centred stack (announcement pill, H1, copy, two CTAs) rising from blur (M6). */
function HR21() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M6");
  const src = scene(1, 1920, 1200);
  return (
    <Sec innerRef={r} theme="paper" font="serif" full>
      <style>{HR21_CSS}</style>
      <div className="relative h-[clamp(640px,100svh,980px)] overflow-hidden">
        <div className="fx-drift absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
          <div className="hr21-night absolute inset-0 opacity-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ filter: "brightness(.34) saturate(.55) hue-rotate(190deg) contrast(1.15)" }} draggable={false} />
            <div className="hr21-stars absolute inset-x-0 top-0 h-1/2" />
            <div className="absolute right-[16%] top-[12%] aspect-square w-[clamp(54px,5vw,84px)] rounded-full bg-[#f3eedc] shadow-[0_0_90px_30px_rgba(243,238,220,.25)]" />
          </div>
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_52%,rgba(20,16,10,.55),rgba(20,16,10,.2))]" />
        <div className="relative flex h-full flex-col items-center justify-center px-6 text-center text-white">
          <a data-m-card href="#" onClick={(e) => e.preventDefault()} className="inline-flex items-center gap-3 rounded-full border border-white/25 bg-white/10 py-1.5 pl-1.5 pr-4 text-[14px] backdrop-blur-md">
            <span className="rounded-full bg-[var(--sx-accent)] px-3 py-1 text-[12px] font-[650] text-[var(--sx-accent-text)]">New</span>
            Monsoon stays, from ₹14,500 a night →
          </a>
          <H as="h1" className="mt-7 max-w-[13ch] text-[clamp(56px,7.6vw,128px)] text-white">Wake above the tea clouds.</H>
          <P className="mt-6 max-w-[46ch] text-white/80">Six bungalows on a working estate at 2,000 m. Pluck at dawn with the pickers, dine by the fire at dusk.</P>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Btn>Check dates</Btn>
            <Btn kind="ghost" className="border-white/30 text-white">
              Tour the estate
            </Btn>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── HR22 · Vanishing-point image rails ───────────────────────── */

const HR22_N = 7;
const HR22_PLACES = ["Kyoto", "Hampi", "Galle", "Ladakh", "Nara", "Kandy", "Spiti"];

/** HR22 · Headline in the centre; two rails of photos stream out of a vanishing point behind it, one to the left edge,
 *  one to the right, growing and turning as they come closer. Time flow + scroll push (M42, opposite travel). */
function HR22() {
  const r = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const scroll = useRef(0);
  const clock = useRef(0);
  const place = (time: number) => {
    const st = stage.current;
    if (!st) return;
    const W = st.clientWidth;
    const H = st.clientHeight;
    st.querySelectorAll<HTMLElement>("[data-rail]").forEach((c) => {
      const side = c.dataset.rail === "l" ? -1 : 1;
      const k = Number(c.dataset.k);
      const t = (((k + (side > 0 ? 0.5 : 0)) / HR22_N + time + scroll.current * 0.6) % 1 + 1) % 1;
      const e = t * t;
      const x = side * (30 + e * W * 0.6);
      const y = side * -1 * e * H * 0.16 + e * H * 0.06;
      const s = 0.1 + e * 1.3;
      const rot = side * -(8 + e * 34);
      c.style.transform = `translate(-50%,-50%) translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotateY(${rot.toFixed(1)}deg) scale(${s.toFixed(3)})`;
      c.style.opacity = String(Math.min(1, t * 5) * Math.min(1, (1 - t) * 7));
      c.style.zIndex = String(Math.round(t * 100));
    });
  };
  useEffect(() => {
    place(0);
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    const stt = ScrollTrigger.create({ trigger: el, start: "top bottom", end: "bottom top", onUpdate: (s) => (scroll.current = s.progress) });
    return () => stt.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useTicker(r, (_t, dt) => {
    clock.current += dt / 16;
    place(clock.current);
  });
  return (
    <Sec innerRef={r} theme="stone" font="condensed" full>
      <div className="relative h-[clamp(640px,100svh,960px)] overflow-hidden">
        <div ref={stage} className="absolute inset-0 [perspective:1100px]">
          {(["l", "r"] as const).flatMap((side) =>
            Array.from({ length: HR22_N }, (_, k) => (
              <div key={`${side}${k}`} data-rail={side} data-k={k} className="absolute left-1/2 top-1/2 w-[clamp(200px,19vw,300px)] shadow-[0_30px_60px_-30px_rgba(17,20,24,.5)] will-change-transform">
                <Pic i={(k + (side === "r" ? 2 : 0)) % 4} ratio="4/3" label={HR22_PLACES[(k + (side === "r" ? 3 : 0)) % HR22_PLACES.length].toUpperCase()} />
              </div>
            )),
          )}
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_40%_36%_at_50%_50%,var(--sx-bg)_35%,transparent)]" />
        <div className="relative z-[200] flex h-full flex-col items-center justify-center px-6 text-center">
          <H as="h1" className="text-[clamp(72px,9vw,150px)] uppercase leading-[0.86]">
            Go further,
            <br />
            slower.
          </H>
          <P className="mt-6 max-w-[40ch]">Small-group rail journeys across Japan, Sri Lanka and the Himalaya. Twelve guests, no flights in between.</P>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Btn>Plan a journey · from ₹68,000</Btn>
            <Btn kind="ghost">Next departures</Btn>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── HR23 · Tilted card wall that straightens ───────────────────────── */

const HR23_CSS = `
.hr23-sway{animation:hr23-sway var(--d) ease-in-out infinite alternate}
@keyframes hr23-sway{from{translate:-28px 0}to{translate:28px 0}}
html.is-static .hr23-sway{animation:none}
html.is-static {.hr23-sway{animation:none}}
`;
const HR23_ROWS = [
  [["Lattice Runner", "₹8,490"], ["Drift Low", "₹6,990"], ["Monsoon Trail", "₹9,290"], ["Court '84", "₹5,490"], ["Knit Slip-on", "₹4,990"]],
  [["Arc Racer", "₹11,490"], ["Canvas Hi", "₹3,990"], ["Terra Mule", "₹4,490"], ["Pace 2", "₹7,790"], ["Studio Flat", "₹5,290"]],
  [["Ridge GTX", "₹12,990"], ["Lattice Kids", "₹3,490"], ["Sole Daily", "₹4,290"], ["Track Spike", "₹8,990"], ["Recovery Slide", "₹2,490"]],
];

/** HR23 · Headline top-left; three staggered rows of product cards start tipped back in 3D and faded, then straighten
 *  while rows 1 and 3 slide one way and row 2 the other (M31, scrubbed on a short sticky stage). */
function HR23() {
  const tall = useRef<HTMLDivElement>(null);
  const plane = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = tall.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 70%", end: "bottom bottom", scrub: true } });
      tl.fromTo(plane.current, { rotationX: 38, rotationZ: -9, y: 120, opacity: 0.25, transformOrigin: "50% 0%" }, { rotationX: 0, rotationZ: 0, y: 0, opacity: 1, ease: "power2.out", duration: 1 }, 0);
      el.querySelectorAll<HTMLElement>("[data-row]").forEach((row, k) => {
        tl.fromTo(row, { xPercent: k % 2 ? 10 : -14 }, { xPercent: 0, ease: "none", duration: 1 }, 0);
      });
      tl.from(el.querySelectorAll("[data-hr23-copy]"), { y: 40, opacity: 0, ease: "power2.out", duration: 0.3, stagger: 0.06 }, 0);
    }, el);
    return () => ctx.revert();
  }, []);
  return (
    <Sec theme="paper" font="wide" full className="overflow-clip!">
      <style>{HR23_CSS}</style>
      <div ref={tall} className="relative h-[180svh]">
        <div className="sticky top-0 flex h-[100svh] min-h-[680px] flex-col overflow-hidden pt-[clamp(56px,7vw,104px)]">
          <div className="grid grid-cols-1 items-end gap-6 px-[clamp(20px,5vw,96px)] md:grid-cols-12">
            <h1 data-hr23-copy className="sx-display text-[clamp(40px,5vw,84px)] font-[800] leading-[0.95] tracking-[-0.02em] md:col-span-7">
              Every pair,
              <br />
              on one wall.
            </h1>
            <div data-hr23-copy className="md:col-span-5 md:pb-2">
              <p className="max-w-[42ch] text-[clamp(16px,1.2vw,19px)] leading-relaxed text-[var(--sx-muted)]">Fifteen silhouettes, one knit, sizes 4 to 13. Free exchanges for 60 days, delivered in two.</p>
              <div className="mt-6 flex flex-wrap gap-4">
                <Btn>Shop all sneakers</Btn>
                <Btn kind="link">Find your size →</Btn>
              </div>
            </div>
          </div>
          <div className="mt-[clamp(28px,3.4vw,52px)] [perspective:1400px]">
            <div ref={plane} className="flex flex-col gap-[clamp(12px,1.3vw,20px)] will-change-transform">
              {HR23_ROWS.map((row, k) => (
                <div key={k} data-row className={k % 2 ? "-ml-[9vw]" : "-ml-[2vw]"}>
                  <div className="hr23-sway flex w-max gap-[clamp(12px,1.3vw,20px)]" style={{ ["--d" as string]: `${4.2 + k * 1.3}s`, animationDirection: k % 2 ? "alternate-reverse" : "alternate" }}>
                    {row.map(([n, p], j) => (
                      <article key={n} className="relative w-[clamp(220px,20vw,330px)] shrink-0 overflow-hidden rounded-[16px] bg-[var(--sx-surface)]">
                        <Pic i={(j + k) % 4} ratio="16/10" round={false} />
                        <div className="flex items-center justify-between gap-3 px-4 py-3">
                          <p className="truncate text-[14px] font-[650]">{n}</p>
                          <Price now={p} className="text-[14px]" />
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "HR19", name: "Bottom-anchored giant title on a full-bleed photo", motion: "M12", C: HR19 },
  { code: "HR20", name: "Isometric image wall behind a statement", motion: "M32", C: HR20 },
  { code: "HR21", name: "Day-to-night crossfade landscape", motion: "M6", C: HR21 },
  { code: "HR22", name: "Vanishing-point image rails", motion: "M42", C: HR22 },
  { code: "HR23", name: "Tilted card wall that straightens", motion: "M31", C: HR23 },
];
