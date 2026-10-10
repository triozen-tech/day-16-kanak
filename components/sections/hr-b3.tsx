"use client";

// HR · Hero layouts, batch 3 (HR24–HR28). Each is a full designed section; motion via useSectionMotion or its own
// GSAP/ScrollTrigger code. ?static=1 shows every hero in its final state (the markup holds it).
import { useEffect, useRef } from "react";
import { gsap, isRecording, prefersReducedMotion } from "@/lib/gsap";
import { scene, useTicker } from "../fx/shared";
import { Btn, H, Logos, P, Pic, Price, Product, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/* ───────────────────────── HR24 · Curved panorama strip ───────────────────────── */

const HR24_N = 8;
const HR24_ROOMS = ["Sea room", "Pool deck", "Library", "Garden suite", "Breakfast", "Spa", "Reading nook", "Sunset bar"];

/** HR24 · Headline above a concave, cylinder-like strip of eight photos at eye level. The strip tilts in from depth on
 *  scroll (M31) and sways with the pointer (an automatic figure-eight sway when idle and in record mode). */
function HR24() {
  const r = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const ptr = useRef<{ x: number; y: number; at: number } | null>(null);
  const cur = useRef({ x: 0, y: 0 });
  useSectionMotion(r, "M31");
  const place = (swayY: number, swayX: number) => {
    const st = stage.current;
    if (!st) return;
    const W = st.clientWidth;
    const w = W * 0.16; // panel width
    const step = 12.6; // degrees between panels
    const R = w / 2 / Math.tan(((step / 2) * Math.PI) / 180);
    st.style.setProperty("--hr24-w", `${w.toFixed(1)}px`);
    st.querySelectorAll<HTMLElement>("[data-pan]").forEach((p) => {
      const k = Number(p.dataset.pan);
      const a = (k - (HR24_N - 1) / 2) * step + swayY;
      p.style.transform = `translate(-50%,-50%) translateZ(${(R - W * 0.2).toFixed(1)}px) rotateX(${swayX.toFixed(2)}deg) rotateY(${a.toFixed(2)}deg) translateZ(${(-R).toFixed(1)}px)`;
      p.style.opacity = String(Math.max(0, Math.min(1, (64 - Math.abs(a)) / 12)));
    });
  };
  useEffect(() => {
    place(0, 0);
    const el = r.current!;
    const move = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      ptr.current = { x: (e.clientX - b.left) / b.width - 0.5, y: (e.clientY - b.top) / b.height - 0.5, at: performance.now() };
    };
    const resize = () => place(cur.current.x * 16, cur.current.y * 6);
    el.addEventListener("pointermove", move);
    window.addEventListener("resize", resize);
    return () => {
      el.removeEventListener("pointermove", move);
      window.removeEventListener("resize", resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useTicker(r, (t) => {
    const live = ptr.current && performance.now() - ptr.current.at < 1500 && !isRecording();
    const tx = live ? ptr.current!.x : Math.sin(t * 0.55) * 0.42 + Math.sin(t * 1.4) * 0.08;
    const ty = live ? ptr.current!.y : Math.sin(t * 1.1) * 0.35;
    cur.current.x += (tx - cur.current.x) * 0.08;
    cur.current.y += (ty - cur.current.y) * 0.08;
    place(cur.current.x * 16, cur.current.y * 6);
  });
  return (
    <Sec innerRef={r} theme="ink" font="editorial" full className="py-[clamp(72px,9vw,128px)]">
      <div className="mx-auto max-w-[980px] px-[clamp(20px,5vw,96px)] text-center">
        <H as="h1" className="text-[clamp(52px,6.8vw,112px)]">Wake where the coast curves.</H>
        <P className="mx-auto mt-6 max-w-[46ch]">Eighteen rooms on a laterite cliff in Varkala, every one of them facing the Arabian Sea.</P>
      </div>
      <div ref={stage} data-m-card className="relative mt-[clamp(28px,4vw,56px)] h-[clamp(300px,30vw,480px)] overflow-hidden [perspective:1300px]">
        <div className="absolute inset-0 [transform-style:preserve-3d]">
          {Array.from({ length: HR24_N }, (_, k) => (
            <div key={k} data-pan={k} className="absolute left-1/2 top-1/2 aspect-[3/4] w-[var(--hr24-w,16vw)] overflow-hidden rounded-[14px] will-change-transform [backface-visibility:hidden]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={scene(k % 4, 600, 800)} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
              <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(7,9,15,.7))] px-4 pb-3 pt-10 text-[13px] text-white/90">{HR24_ROOMS[k]}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-[clamp(28px,4vw,56px)] flex flex-wrap items-center justify-center gap-x-8 gap-y-4 px-[clamp(20px,5vw,96px)]">
        <Btn>Check availability</Btn>
        <p className="text-[15px] text-[var(--sx-muted)]">
          Sea rooms from <Price now="₹16,800" className="text-[var(--sx-text)]" /> a night, breakfast included
        </p>
      </div>
    </Sec>
  );
}

/* ───────────────────────── HR25 · Centre copy ringed by floating images ───────────────────────── */

const HR25_CSS = `
.hr25-bob{animation:hr25-bob var(--d,5s) ease-in-out infinite alternate;animation-delay:var(--dl,0s)}
@keyframes hr25-bob{from{translate:0 -14px;rotate:var(--r0,0deg)}to{translate:0 14px;rotate:var(--r1,0deg)}}
html.is-static .hr25-bob{animation:none}
html.is-static {.hr25-bob{animation:none}}
`;

const HR25_PICS = [
  { c: "left-[3%] top-[6%] w-[15%]", i: 1, ratio: "4/5", d: "4.6s", z: 1, r: [-3, 1] },
  { c: "left-[10%] top-[44%] w-[10%]", i: 2, ratio: "1/1", d: "3.4s", z: 0, r: [2, -2] },
  { c: "left-[2%] bottom-[5%] w-[17%]", i: 3, ratio: "4/3", d: "5.4s", z: 1, r: [1, -2] },
  { c: "left-[24%] top-[3%] w-[8%]", i: 0, ratio: "3/4", d: "3s", z: 0, r: [-2, 2] },
  { c: "right-[4%] top-[5%] w-[13%]", i: 0, ratio: "3/4", d: "4.2s", z: 1, r: [2, -1] },
  { c: "right-[2%] top-[42%] w-[16%]", i: 1, ratio: "1/1", d: "5.8s", z: 1, r: [-1, 2] },
  { c: "right-[12%] bottom-[4%] w-[11%]", i: 2, ratio: "4/5", d: "3.8s", z: 0, r: [3, 0] },
  { c: "right-[27%] bottom-[3%] w-[8%]", i: 3, ratio: "1/1", d: "3.2s", z: 0, r: [-2, 1] },
];

/** HR25 · A narrow centred block (headline, copy, CTA) ringed by eight photos of different sizes at the corners and
 *  edges. Each bobs on its own period; columns of depth drift against each other with the scroll (M32). */
function HR25() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M32");
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(48px,6vw,96px)]">
      <style>{HR25_CSS}</style>
      <div className="relative grid min-h-[clamp(640px,92svh,900px)] place-items-center">
        {HR25_PICS.map((p, k) => (
          <div key={k} data-m-col className={`absolute hidden md:block ${p.c}`} style={{ zIndex: p.z }}>
            <div className="hr25-bob" style={{ ["--d" as string]: p.d, ["--dl" as string]: `${-k * 0.7}s`, ["--r0" as string]: `${p.r[0]}deg`, ["--r1" as string]: `${p.r[1]}deg` }}>
              <Pic i={p.i} ratio={p.ratio} className={`shadow-[0_30px_60px_-30px_rgba(28,24,19,.5)] ${p.z ? "" : "opacity-80 blur-[1px]"}`} />
            </div>
          </div>
        ))}
        <div className="relative z-10 mx-auto max-w-[540px] text-center">
          <H as="h1" className="text-[clamp(50px,5.6vw,92px)]">Bread, still warm at seven.</H>
          <P className="mx-auto mt-6 max-w-[38ch]">Wild-yeast loaves, cardamom buns and butter croissants, baked in a wood oven behind the shop every morning.</P>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Btn>Pre-order tomorrow&apos;s bake</Btn>
          </div>
          <p className="mt-6 text-[14px] text-[var(--sx-muted)]">
            Country sourdough <Price now="₹280" className="text-[var(--sx-text)]" /> · ready from 7 am
          </p>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── HR26 · Tilted 3D object above the title ───────────────────────── */

const HR26_CSS = `
.hr26-glow{animation:hr26-glow 4.4s ease-in-out infinite alternate}
@keyframes hr26-glow{from{opacity:.55;transform:scale(1)}to{opacity:.9;transform:scale(1.08)}}
html.is-static .hr26-glow{animation:none}
html.is-static {.hr26-glow{animation:none}}
`;

/** HR26 · A radial-masked photo glow at the top; a chocolate-bar wrapper tilted in 3D (rotateX 12, rotateZ -12) floats
 *  above a narrow serif title, copy and button. The bar sways on a figure-eight with a moving glare (M51). */
function HR26() {
  const r = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  useTicker(r, (t) => {
    const b = bar.current;
    if (!b) return;
    const y = Math.sin(t * 0.8) * 14;
    const x = 12 + Math.sin(t * 1.6) * 5;
    b.style.transform = `rotateX(${x.toFixed(2)}deg) rotateY(${y.toFixed(2)}deg) rotateZ(-12deg) translateY(${(Math.sin(t * 1.2) * 8).toFixed(1)}px)`;
    b.style.setProperty("--gx", `${(50 + Math.sin(t * 0.8) * 45).toFixed(1)}%`);
  });
  return (
    <Sec innerRef={r} theme="ink" font="serif" className="py-[clamp(56px,7vw,112px)]">
      <style>{HR26_CSS}</style>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[70%] [mask-image:radial-gradient(ellipse_55%_60%_at_50%_20%,#000,transparent)]">
        <div className="hr26-glow absolute inset-0">
          <Pic i={2} ratio="auto" round={false} className="absolute inset-0 h-full w-full opacity-60" />
        </div>
      </div>
      <div className="relative grid place-items-center px-[8%] pb-[clamp(36px,4vw,64px)] pt-[clamp(24px,3vw,48px)] [perspective:1100px]">
        <div ref={bar} data-m-card className="relative aspect-[5/7] w-[clamp(200px,17vw,270px)] overflow-hidden rounded-[10px] shadow-[0_50px_90px_-30px_rgba(0,0,0,.85)] [transform-style:preserve-3d]" style={{ transform: "rotateX(12deg) rotateZ(-12deg)" }}>
          <div className="absolute inset-0 bg-[linear-gradient(160deg,#5a2a1a,#2a120b_60%,#1a0a06)]" />
          <div className="absolute inset-x-0 top-0 h-[34%] bg-[linear-gradient(135deg,#d9b46a,#f3dfa6_45%,#b08a3e)]" />
          <div className="absolute inset-x-[10%] top-[40%] grid grid-cols-3 gap-1.5 opacity-25">
            {Array.from({ length: 9 }, (_, k) => (
              <span key={k} className="aspect-square rounded-[3px] border border-[#f3dfa6]" />
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-0 p-[9%] text-[#f3e6cc]">
            <p className="text-[12px] uppercase tracking-[0.22em] opacity-70">Single estate</p>
            <p className="sx-display mt-1 text-[clamp(26px,2.2vw,34px)] leading-none">Kaveri 72</p>
            <p className="mt-2 text-[12px] opacity-70">Idukki cacao · 70 g</p>
          </div>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_var(--gx,50%)_30%,rgba(255,255,255,.28),transparent_45%)] mix-blend-screen" />
        </div>
      </div>
      <div className="relative mx-auto max-w-[620px] text-center">
        <H as="h1" className="text-[clamp(46px,5vw,84px)] font-[500]">A bar worth unwrapping slowly.</H>
        <P className="mx-auto mt-5 max-w-[40ch]">Fermented for six days, conched for three, wrapped by hand in Kochi. Notes of fig, coffee and smoke.</P>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-5">
          <Btn>Buy a bar · ₹340</Btn>
          <Btn kind="link">Tasting notes →</Btn>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── HR27 · Tilted screen that flattens on scroll ───────────────────────── */

const HR27_CSS = `
.hr27-bar{transform-origin:50% 100%;animation:hr27-bar var(--d,1s) ease-in-out infinite alternate;animation-delay:var(--dl,0s)}
@keyframes hr27-bar{from{transform:scaleY(.18)}to{transform:scaleY(1)}}
.hr27-play{animation:hr27-play 14s linear infinite}
@keyframes hr27-play{from{width:18%}to{width:78%}}
html.is-static .hr27-bar,html.is-static .hr27-play{animation:none}
html.is-static {.hr27-bar,.hr27-play{animation:none}}
`;

/** HR27 · Centred headline (small line + huge line); below it one large rounded device frame tipped back ~20°. On
 *  scroll it rotates upright and scales to full size while the headline lifts away (M31). The screen plays music. */
function HR27() {
  const r = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const st = { trigger: el, start: "top top", end: "+=" + Math.round(window.innerHeight * 0.7), scrub: true } as const;
      gsap.fromTo(frame.current, { rotationX: 20, scale: 0.86, transformOrigin: "50% 0%" }, { rotationX: 0, scale: 1, ease: "none", scrollTrigger: st });
      gsap.to(head.current, { y: -90, opacity: 0.25, ease: "none", scrollTrigger: st });
      gsap.from(head.current!.children, { y: 30, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.1 });
    }, el);
    return () => ctx.revert();
  }, []);
  const tracks = [
    ["Low Tide", "Mira Dsouza", "3:42"],
    ["Salt Air", "The Kettle Band", "4:05"],
    ["Monsoon Radio", "Arun Pillai", "2:58"],
    ["Late Ferry", "Mira Dsouza", "3:31"],
  ];
  return (
    <Sec innerRef={r} theme="stone" font="grotesk" className="pb-[clamp(72px,9vw,140px)] pt-[clamp(64px,8vw,120px)]">
      <style>{HR27_CSS}</style>
      <div ref={head} className="relative text-center">
        <p className="text-[clamp(18px,1.6vw,24px)] font-[500] text-[var(--sx-muted)]">Tideline speakers, now with a room that listens</p>
        <h1 className="sx-display mt-3 text-[clamp(64px,8.6vw,148px)] font-[800] leading-[0.9] tracking-[-0.035em]">Hear the whole room.</h1>
      </div>
      <div className="relative mx-auto mt-[clamp(32px,4vw,56px)] max-w-[1040px] [perspective:1400px]">
        <div ref={frame} className="relative aspect-[16/10] rounded-[clamp(18px,2vw,30px)] border-[clamp(6px,0.7vw,10px)] border-[#1a1d22] bg-[#0d0f13] shadow-[0_60px_120px_-40px_rgba(17,20,24,.55)] will-change-transform">
          <div className="absolute inset-0 grid grid-cols-1 overflow-hidden rounded-[clamp(12px,1.4vw,20px)] text-white md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <div className="relative hidden md:block">
              <div className="fx-pan absolute -inset-[4%]">
                <Pic i={1} ratio="auto" round={false} className="fx-drift absolute inset-0 h-full w-full" />
              </div>
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_50%,rgba(13,15,19,.9))]" />
              <div className="absolute inset-x-0 bottom-0 p-[clamp(16px,2vw,32px)]">
                <p className="text-[13px] uppercase tracking-[0.16em] text-white/60">Now playing · Living room</p>
                <p className="mt-1 text-[clamp(22px,2vw,32px)] font-[700]">Low Tide</p>
                <p className="text-[15px] text-white/70">Mira Dsouza</p>
              </div>
            </div>
            <div className="flex min-w-0 flex-col p-[clamp(16px,2.2vw,36px)]">
              <div className="flex h-[clamp(70px,9vw,140px)] items-end gap-[3px]">
                {Array.from({ length: 44 }, (_, k) => (
                  <span key={k} className="hr27-bar flex-1 rounded-full bg-[var(--sx-accent)]" style={{ height: `${40 + ((k * 37) % 60)}%`, ["--d" as string]: `${0.5 + ((k * 13) % 9) / 10}s`, ["--dl" as string]: `${-((k * 7) % 10) / 10}s`, opacity: 0.55 + ((k * 11) % 5) / 10 }} />
                ))}
              </div>
              <div className="mt-4 h-1 rounded-full bg-white/15">
                <div className="hr27-play h-full w-[46%] rounded-full bg-white" />
              </div>
              <ul className="mt-[clamp(14px,2vw,28px)] divide-y divide-white/10">
                {tracks.map(([t, a, d], k) => (
                  <li key={t} className={`flex items-center justify-between py-[clamp(8px,1vw,14px)] text-[15px] ${k ? "text-white/70" : "text-white"}`}>
                    <span>
                      <b className="font-[600]">{t}</b> <span className="text-white/50">· {a}</span>
                    </span>
                    <span className="tabular-nums text-white/50">{d}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex items-center justify-between pt-4 text-[14px] text-white/70">
                <span>3 speakers grouped</span>
                <span className="rounded-full bg-white/10 px-3 py-1">Room tuned · 62 dB</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-[clamp(32px,4vw,56px)] flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
        <Btn>Shop Tideline One · ₹32,900</Btn>
        <Btn kind="ghost">Get the app</Btn>
      </div>
    </Sec>
  );
}

/* ───────────────────────── HR28 · Split header over a landscape product stage ───────────────────────── */

const HR28_CSS = `
.hr28-float{animation:hr28-float 3.6s ease-in-out infinite alternate}
@keyframes hr28-float{from{translate:0 -10px}to{translate:0 10px}}
html.is-static .hr28-float{animation:none}
html.is-static {.hr28-float{animation:none}}
`;

/** HR28 · One row: giant headline alone on the left, copy + two CTAs on the right, both bottom-aligned. Below, a
 *  full-width rounded landscape "stage" with the product as an inset card; a logo row closes. The landscape opens
 *  and settles inside its frame on scroll (M13). */
function HR28() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M13");
  return (
    <Sec innerRef={r} theme="paper" font="condensed" className="py-[clamp(64px,8vw,120px)]">
      <style>{HR28_CSS}</style>
      <div className="grid grid-cols-1 items-end gap-[clamp(24px,4vw,72px)] md:grid-cols-2">
        <H as="h1" className="text-[clamp(60px,8vw,132px)] uppercase leading-[0.86]">Skin, kept simple.</H>
        <div className="md:pb-3">
          <P className="max-w-[42ch]">Four products, eleven ingredients between them. A ceramide routine built for Indian summers, humidity and long commutes.</P>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Btn>Build my routine</Btn>
            <Btn kind="ghost">Read the formulas</Btn>
          </div>
        </div>
      </div>
      <div className="relative mt-[clamp(40px,5vw,72px)] aspect-[16/7] min-h-[420px] overflow-hidden rounded-[var(--sx-radius,18px)]">
        <div className="fx-pan absolute -inset-[3%]">
          <Pic i={1} ratio="auto" className="fx-drift absolute inset-0 h-full w-full" />
        </div>
        <div className="absolute inset-0 bg-[rgba(28,24,19,.18)]" />
        <div className="absolute inset-0 grid place-items-center p-6">
          <div data-m-card className="hr28-float sx-card flex w-[min(560px,92%)] items-center gap-[clamp(16px,2vw,32px)] bg-[var(--sx-surface)] p-[clamp(16px,1.8vw,26px)] shadow-[0_40px_80px_-30px_rgba(28,24,19,.6)]">
            <div className="relative aspect-[4/5] w-[42%] shrink-0 overflow-hidden rounded-[14px] bg-[radial-gradient(circle_at_50%_40%,color-mix(in_srgb,var(--sx-accent)_28%,var(--sx-bg)),var(--sx-bg))]">
              <Product angle={1} accent="#c9826b" className="absolute inset-0 m-auto h-[82%] w-[82%]" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] uppercase tracking-[0.14em] text-[var(--sx-muted)]">Step 2 · Treat</p>
              <p className="mt-1 text-[clamp(22px,2vw,30px)] font-[700] leading-tight">Barrier Serum</p>
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--sx-muted)]">5% ceramides, oat lipids, 30 ml</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Price now="₹1,290" was="₹1,490" className="text-[18px]" />
                <span className="rounded-full bg-[var(--sx-accent)] px-3 py-1 text-[12px] font-[650] text-[var(--sx-accent-text)]">Bestseller</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-[clamp(32px,4vw,56px)] flex flex-wrap items-center justify-between gap-6 border-t border-[var(--sx-line)] pt-8">
        <p className="text-[14px] text-[var(--sx-muted)]">As reviewed in</p>
        <Logos />
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "HR24", name: "Curved panorama strip", motion: "M31", C: HR24 },
  { code: "HR25", name: "Centre copy ringed by floating images", motion: "M32", C: HR25 },
  { code: "HR26", name: "Tilted 3D object above the title", motion: "M51", C: HR26 },
  { code: "HR27", name: "Tilted screen that flattens on scroll", motion: "M31", C: HR27 },
  { code: "HR28", name: "Split header over a landscape product stage", motion: "M13", C: HR28 },
];
