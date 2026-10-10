"use client";

// NV · Navigation layouts, batch 3 (docs/SECTION-MENU.md). Each is shown as a full designed section in a live state
// (the menu plays by itself), so the gallery shows the whole idea; on a site the nav is fixed and driven by the user.
import { Fragment, useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Pic, Price, Product, Sec } from "./kit";
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

/** Plays a paused GSAP timeline only while `el` is on screen. */
function playWhileVisible(el: HTMLElement, tl: gsap.core.Timeline) {
  const io = new IntersectionObserver(([e]) => (e.isIntersecting ? tl.play() : tl.pause()));
  io.observe(el);
  return () => io.disconnect();
}

const noop = (e: React.MouseEvent) => e.preventDefault();

/** Scoped "swap in" keyframe: a re-keyed block rises in softly (off in ?static=1 / reduced motion). */
const SWAP_CSS = `
.nvb3-in{animation:nvb3-in .7s cubic-bezier(.2,.8,.2,1) both}
@keyframes nvb3-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
html.is-static .nvb3-in{animation:none}
html.is-static {.nvb3-in{animation:none}}
`;

/* ───────────────────────── NV09 · Fixed vertical side rail nav ───────────────────────── */

const NV09_ITEMS = [
  { t: "Rooms", i: 1, h: "Eleven rooms, all facing the tea slopes.", d: "Teak floors, handloom throws and a deep tub by the window. Mist in the morning, nothing in the evening but crickets.", k: "From", p: "₹14,500", u: "a night, breakfast in" },
  { t: "Dining", i: 2, h: "A kitchen that follows the market.", d: "Kerala breakfasts, a set dinner of five courses and a cardamom bar that opens at dusk.", k: "Set dinner", p: "₹3,200", u: "per guest" },
  { t: "Spa", i: 3, h: "Oil, steam and a long silence.", d: "Ayurvedic treatments in a stone room with a view of the valley. Ninety minutes, no phones.", k: "Rituals from", p: "₹4,800", u: "90 minutes" },
  { t: "Trails", i: 0, h: "Seven walks from the front door.", d: "Guided at sunrise through cardamom shade and tea rows, back in time for appam and coffee.", k: "Guided walk", p: "₹1,200", u: "per guest" },
  { t: "Journal", i: 2, h: "Notes from the hill house.", d: "Recipes from the kitchen, plant lists from the garden and when to come for the neelakurinji bloom.", k: "Latest", p: "8 min", u: "read" },
];

/** NV09 · A framed page with a 72px rail fixed to its left edge: logo at the top, rotated section names stacked in the
 *  middle with a dot on the active one, a language switch at the bottom. The active section steps by itself and the
 *  page content beside the rail swaps to it. */
function NV09() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const [a, setA] = useAutoCycle(r, NV09_ITEMS.length, 2300);
  const it = NV09_ITEMS[a];
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <style>{SWAP_CSS}</style>
      <div className="grid grid-cols-1 items-end gap-[clamp(24px,4vw,64px)] md:grid-cols-12">
        <H className="text-[clamp(44px,5.6vw,92px)] md:col-span-7">A quiet house in the hills.</H>
        <P className="max-w-[40ch] md:col-span-5 md:pb-2">The menu lives in a slim rail down the left edge, always there and never in the way of the view.</P>
      </div>

      <div data-m-card className="mt-[clamp(40px,5vw,72px)] grid min-h-[clamp(520px,64vh,640px)] grid-cols-[72px_minmax(0,1fr)] overflow-hidden rounded-[var(--sx-radius)] border border-[var(--sx-line)] bg-[var(--sx-surface)] shadow-[0_40px_80px_-50px_rgba(28,24,19,.45)]">
        {/* the rail */}
        <nav aria-label="Main" className="flex flex-col items-center justify-between border-r border-[var(--sx-line)] py-6">
          <a href="#" onClick={noop} aria-label="Vettam Hill House" className="sx-display grid h-11 w-11 place-items-center rounded-full border border-[var(--sx-text)] text-[20px] font-[600] italic">
            V
          </a>
          <ul className="flex flex-col items-center gap-[clamp(14px,2vh,24px)]">
            {NV09_ITEMS.map((x, k) => (
              <li key={x.t} className="flex flex-col items-center gap-2">
                <span className={`h-[7px] w-[7px] rounded-full transition-all duration-500 ${k === a ? "scale-100 bg-[var(--sx-accent)]" : "scale-50 bg-[var(--sx-line)]"}`} />
                <a
                  href="#"
                  onClick={(e) => {
                    noop(e);
                    setA(k);
                  }}
                  className={`rotate-180 text-[12px] font-[650] uppercase tracking-[0.2em] transition-colors duration-500 [writing-mode:vertical-rl] ${k === a ? "text-[var(--sx-text)]" : "text-[var(--sx-muted)]"}`}
                >
                  {x.t}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex flex-col items-center gap-1 text-[12px] font-[650] tracking-[0.1em]">
            <span className="text-[var(--sx-text)]">EN</span>
            <span className="h-3 w-px bg-[var(--sx-line)]" />
            <span className="text-[var(--sx-muted)]">ML</span>
          </div>
        </nav>

        {/* the page beside it */}
        <div className="relative grid grid-cols-1 md:grid-cols-12">
          <div className="relative min-h-[300px] overflow-hidden md:col-span-7">
            <div className="fx-pan absolute inset-[-3%]">
              <div className="fx-drift absolute inset-0">
                <Pic i={it.i} ratio="auto" round={false} className="absolute inset-0 h-full w-full" label="" />
              </div>
            </div>
            <span className="absolute left-5 top-5 rounded-full bg-[color-mix(in_srgb,var(--sx-surface)_80%,transparent)] px-4 py-2 text-[13px] font-[650] backdrop-blur-md">Vettam Hill House · Munnar</span>
          </div>
          <div key={a} className="nvb3-in flex flex-col justify-between gap-8 p-[clamp(24px,3vw,48px)] md:col-span-5">
            <div className="flex items-center justify-between text-[13px] font-[650] uppercase tracking-[0.16em] text-[var(--sx-muted)]">
              <span>{it.t}</span>
              <a href="#" onClick={noop} className="normal-case tracking-normal text-[var(--sx-text)] underline underline-offset-4">
                Book a stay
              </a>
            </div>
            <div>
              <p className="sx-display text-[clamp(30px,2.8vw,46px)] font-[500] leading-[1.05] tracking-[-0.02em]">{it.h}</p>
              <p className="mt-5 max-w-[38ch] text-[16px] leading-relaxed text-[var(--sx-muted)]">{it.d}</p>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4 border-t border-[var(--sx-line)] pt-6">
              <p className="text-[14px] text-[var(--sx-muted)]">
                {it.k} <Price now={it.p} className="text-[22px] text-[var(--sx-text)]" /> {it.u}
              </p>
              <Btn>Check dates</Btn>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── NV10 · Altitude scroll-progress rail ───────────────────────── */

const NV10_CH = [
  { alt: "1,620 m", stop: "The estate", h: "Shade first, coffee second.", d: "Arabica grows under silver oak and jackfruit on the ridge above Kodai, picked by hand from December.", i: 0 },
  { alt: "1,400 m", stop: "Picking", h: "Only the red cherries.", d: "Each tree is passed five times a season, so every basket holds fruit at the same ripeness.", i: 1 },
  { alt: "1,080 m", stop: "Pulping", h: "Washed in spring water.", d: "Skins come off the same evening; the beans ferment for thirty-six hours in stone tanks.", i: 2 },
  { alt: "860 m", stop: "Drying", h: "Twenty days on raised beds.", d: "Turned every hour in the sun, covered at night, until the parchment cracks like paper.", i: 3 },
  { alt: "40 m", stop: "Roastery", h: "Roasted the week you order.", d: "Small drums by the coast, medium-light, shipped in valve bags within two days of roasting.", i: 1 },
];

/** NV10 · A framed story page that scrolls by itself, with a minimal logo bar on top and an altimeter on the right edge:
 *  a vertical scale with labelled checkpoints (one per chapter). A marker slides down it with the page; clicking a
 *  checkpoint jumps there. */
function NV10() {
  const r = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const page = useRef<HTMLDivElement>(null);
  const marker = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const [cur, setCur] = useState(0);
  useSectionMotion(r, "M3");
  const n = NV10_CH.length;
  useEffect(() => {
    const st = stage.current;
    const pg = page.current;
    if (!st || !pg || prefersReducedMotion()) return;
    const o = { y: 0 };
    let last = -1;
    const tl = gsap.timeline({ repeat: -1, paused: true, defaults: { ease: "power2.inOut" } });
    tl.addLabel("c0");
    tl.to(o, { y: 0, duration: 1.1 });
    for (let k = 1; k < n; k++) {
      tl.to(o, { y: k / (n - 1), duration: 1.25 });
      tl.addLabel(`c${k}`);
      tl.to(o, { y: k / (n - 1), duration: 1.1 });
    }
    tl.to(o, { y: 0, duration: 1.8, ease: "power3.inOut" });
    tl.eventCallback("onUpdate", () => {
      const max = Math.max(0, pg.scrollHeight - st.clientHeight);
      pg.style.transform = `translate3d(0, ${(-o.y * max).toFixed(1)}px, 0)`;
      if (marker.current) marker.current.style.top = `${(o.y * 100).toFixed(2)}%`;
      const c = Math.round(o.y * (n - 1));
      if (c !== last) {
        last = c;
        setCur(c);
      }
    });
    tlRef.current = tl;
    const stop = playWhileVisible(st, tl);
    return () => {
      stop();
      tl.kill();
      tlRef.current = null;
    };
  }, [n]);
  const jump = (k: number) => tlRef.current?.seek(`c${k}`);
  return (
    <Sec innerRef={r} theme="ink" font="condensed" className="py-[clamp(72px,9vw,140px)]">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[14ch] text-[clamp(52px,6.4vw,108px)] uppercase">From the ridge to your cup.</H>
        <P className="max-w-[38ch] pb-2">A story told in five stops. The scale on the right is the map: it shows the altitude you have reached and takes you to any stop in one click.</P>
      </div>

      <div ref={stage} data-m-card className="relative mt-[clamp(40px,5vw,72px)] h-[clamp(540px,66vh,680px)] overflow-hidden rounded-[var(--sx-radius)] border border-[var(--sx-line)] bg-[var(--sx-surface)]">
        {/* minimal top logo bar */}
        <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between border-b border-[var(--sx-line)] bg-[color-mix(in_srgb,var(--sx-surface)_82%,transparent)] px-[clamp(20px,2.6vw,40px)] py-4 backdrop-blur-md">
          <span className="sx-display text-[22px] font-[700] uppercase tracking-[0.04em]">Kodai Ridge</span>
          <span className="flex items-center gap-5 text-[14px] font-[600]">
            <span className="hidden text-[var(--sx-muted)] md:inline">The origin story</span>
            <span className="rounded-full bg-[var(--sx-accent)] px-4 py-2 text-[13px] text-[var(--sx-accent-text)]">Shop beans · ₹680</span>
          </span>
        </header>

        {/* the page, scrolled by the timeline */}
        <div ref={page} className="will-change-transform">
          {NV10_CH.map((c) => (
            <article key={c.stop} className="grid h-[clamp(540px,66vh,680px)] grid-cols-1 items-center gap-[clamp(24px,3vw,48px)] px-[clamp(20px,2.6vw,40px)] pb-8 pt-[96px] md:grid-cols-12 md:pr-[190px]">
              <div className="md:col-span-6">
                <p data-m-num className="sx-display text-[clamp(64px,7vw,120px)] font-[700] leading-[0.85] tracking-[-0.01em] text-[var(--sx-accent)] tabular-nums">
                  {c.alt}
                </p>
                <p className="mt-6 sx-display text-[clamp(30px,2.8vw,46px)] font-[600] uppercase leading-[1]">{c.h}</p>
                <p className="mt-4 max-w-[38ch] text-[16px] leading-relaxed text-[var(--sx-muted)]">{c.d}</p>
              </div>
              <div className="relative h-[clamp(240px,40vh,420px)] overflow-hidden rounded-[14px] md:col-span-6">
                <div className="fx-pan absolute inset-[-4%]">
                  <div className="fx-drift absolute inset-0">
                    <Pic i={c.i} ratio="auto" round={false} className="absolute inset-0 h-full w-full" label={c.stop.toUpperCase()} />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* the altimeter rail */}
        <nav aria-label="Chapters" className="absolute bottom-8 right-[clamp(16px,2vw,32px)] top-[96px] z-20 hidden w-[150px] md:block">
          <div className="absolute bottom-0 right-[18px] top-0 w-[22px] bg-[repeating-linear-gradient(180deg,var(--sx-line)_0_1px,transparent_1px_10px)] [mask-image:linear-gradient(90deg,transparent,#000)]" />
          <div className="absolute bottom-0 right-[18px] top-0 w-px bg-[var(--sx-line)]" />
          {NV10_CH.map((c, k) => (
            <button
              key={c.stop}
              onClick={() => jump(k)}
              className="absolute right-[18px] flex -translate-y-1/2 items-center gap-3 text-right"
              style={{ top: `${(k / (n - 1)) * 100}%` }}
            >
              <span className={`leading-tight transition-colors duration-300 ${k === cur ? "text-[var(--sx-text)]" : "text-[var(--sx-muted)]"}`}>
                <span className="block text-[12px] font-[650] uppercase tracking-[0.14em]">{c.stop}</span>
                <span className="block text-[12px] tabular-nums opacity-80">{c.alt}</span>
              </span>
              <span className={`h-px w-[28px] transition-colors duration-300 ${k === cur ? "bg-[var(--sx-accent)]" : "bg-[var(--sx-text)]"}`} />
            </button>
          ))}
          <div ref={marker} className="absolute right-[10px] top-0 -translate-y-1/2">
            <span className="block h-[17px] w-[17px] rotate-45 border-2 border-[var(--sx-accent)] bg-[var(--sx-surface)] shadow-[0_0_24px_color-mix(in_srgb,var(--sx-accent)_70%,transparent)]" />
          </div>
        </nav>
      </div>
    </Sec>
  );
}

/* ───────────────────────── NV11 · Three-island navbar ───────────────────────── */

const NV11_LINKS = ["Shop", "Flavours", "Subscribe", "Stories"];
const NV11_FLAVOURS = [
  { n: "Ginger & lime", c: "#d9b23a" },
  { n: "Hibiscus", c: "#c23a5b" },
  { n: "Kokum", c: "#7a2f6b" },
  { n: "Tender mint", c: "#3f9a72" },
];

/** One island hanging from the top edge, joined to it by two inverted-curve notches. */
function Island({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const notch = "pointer-events-none absolute top-0 h-[18px] w-[18px]";
  return (
    <div data-m-card className={`relative flex items-center rounded-b-[22px] bg-[var(--sx-text)] text-[var(--sx-bg)] ${className}`}>
      <span className={`${notch} -left-[18px]`} style={{ background: "radial-gradient(circle at 0 100%, transparent 17.5px, var(--sx-text) 18px)" }} />
      <span className={`${notch} -right-[18px]`} style={{ background: "radial-gradient(circle at 100% 100%, transparent 17.5px, var(--sx-text) 18px)" }} />
      {children}
    </div>
  );
}

/** NV11 · The bar split into three floating islands that hang from the top edge: logo pill left, links pill centre,
 *  actions pill right, each joined to the edge by inverted-curve notches. The active link steps by itself and the
 *  page under it shows the current flavour. */
function NV11() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M18");
  const [a, setA] = useAutoCycle(r, NV11_LINKS.length, 1600);
  const [f] = useAutoCycle(r, NV11_FLAVOURS.length, 2600);
  const fl = NV11_FLAVOURS[f];
  return (
    <Sec innerRef={r} theme="stone" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <style>{SWAP_CSS}</style>
      <div className="grid grid-cols-1 items-end gap-[clamp(24px,4vw,64px)] md:grid-cols-12">
        <H className="text-[clamp(44px,5.6vw,92px)] md:col-span-7">Three islands, one bar.</H>
        <P className="max-w-[40ch] md:col-span-5 md:pb-2">Logo, links and actions float apart, each hanging from the top edge on a soft curve, so the page shows through the gaps.</P>
      </div>

      <div className="relative mt-[clamp(40px,5vw,72px)] overflow-hidden rounded-[var(--sx-radius)] border border-[var(--sx-line)] bg-[var(--sx-surface)]">
        {/* the top edge + three islands */}
        <div className="h-[10px] bg-[var(--sx-text)]" />
        <header className="absolute inset-x-0 top-[10px] z-20 flex items-start justify-between gap-4 px-[clamp(28px,3vw,48px)]">
          <Island className="gap-3 px-6 py-3.5">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--sx-accent)] text-[13px] font-[800] text-[var(--sx-accent-text)]">f</span>
            <span className="sx-display text-[19px] font-[700] tracking-[-0.02em]">fizzwell</span>
          </Island>
          <Island className="hidden gap-1 px-2 py-2 md:flex">
            {NV11_LINKS.map((l, k) => (
              <a
                key={l}
                href="#"
                onClick={(e) => {
                  noop(e);
                  setA(k);
                }}
                className={`rounded-full px-5 py-2 text-[14px] font-[600] transition-colors duration-500 ${k === a ? "bg-[var(--sx-bg)] text-[var(--sx-text)]" : "text-[color-mix(in_srgb,var(--sx-bg)_70%,transparent)]"}`}
              >
                {l}
              </a>
            ))}
          </Island>
          <Island className="gap-4 py-2 pl-5 pr-2">
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" aria-label="Search">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <span className="text-[14px] font-[600]">Bag (2)</span>
            <span className="rounded-full bg-[var(--sx-accent)] px-4 py-2 text-[13px] font-[650] text-[var(--sx-accent-text)]">Try a 6-pack</span>
          </Island>
        </header>

        {/* the page under the bar */}
        <div className="grid grid-cols-1 items-center gap-[clamp(24px,3vw,56px)] px-[clamp(28px,3vw,48px)] pb-[clamp(32px,4vw,56px)] pt-[clamp(110px,10vw,140px)] md:grid-cols-12">
          <div className="md:col-span-6">
            <p className="sx-display text-[clamp(40px,4.4vw,72px)] font-[700] leading-[0.95] tracking-[-0.03em]">Fizz, without the fuss.</p>
            <p className="mt-5 max-w-[38ch] text-[16px] leading-relaxed text-[var(--sx-muted)]">Live-cultured kombucha brewed in small barrels in Pune. Four flavours, 30 calories, no added sugar after fermentation.</p>
            <div key={f} className="nvb3-in mt-8 flex flex-wrap items-center gap-4">
              <span className="h-4 w-4 rounded-full" style={{ background: fl.c }} />
              <span className="text-[17px] font-[650]">{fl.n}</span>
              <span className="text-[var(--sx-muted)]">·</span>
              <Price now="₹540" was="₹600" className="text-[17px]" />
              <span className="text-[14px] text-[var(--sx-muted)]">for six cans</span>
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Btn>Shop the range</Btn>
              <Btn kind="ghost">Build a mixed case</Btn>
            </div>
          </div>
          <div className="relative grid min-h-[clamp(320px,40vh,440px)] place-items-center overflow-hidden rounded-[14px] md:col-span-6" style={{ background: `radial-gradient(60% 60% at 50% 55%, color-mix(in srgb, ${fl.c} 38%, transparent), transparent 75%)`, transition: "background .8s" }}>
            <div className="fx-pan absolute inset-0 grid place-items-center">
              <div className="fx-drift">
                <Product key={f} angle={f % 3} accent={fl.c} className="nvb3-in h-[clamp(260px,34vh,380px)] w-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── NV12 · Inline sentence menu with preview panel ───────────────────────── */

const NV12_ITEMS = [
  { t: "Womenswear", n: "48 pieces", s: [3, 1, 2, 0] },
  { t: "Menswear", n: "36 pieces", s: [1, 3, 0, 2] },
  { t: "The linen edit", n: "22 pieces", s: [2, 0, 3, 1] },
  { t: "Footwear", n: "14 pairs", s: [0, 2, 1, 3] },
  { t: "Atelier", n: "Made to measure", s: [3, 0, 1, 2] },
  { t: "Journal", n: "12 stories", s: [1, 2, 3, 0] },
  { t: "Stores", n: "Mumbai · Jaipur", s: [2, 3, 0, 1] },
];

/** NV12 · An open menu where the links run as one big wrapped sentence separated by slashes; the word in focus opens
 *  a side panel at right with a 2×2 preview of that collection. Focus steps by itself (hover takes over). */
function NV12() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M13");
  const [a, setA] = useAutoCycle(r, NV12_ITEMS.length, 2000);
  const it = NV12_ITEMS[a];
  return (
    <Sec innerRef={r} theme="ink" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--sx-line)] pb-6 text-[14px] font-[600]">
        <span className="sx-display text-[26px] font-[400] italic">Atelier Noon</span>
        <span className="flex items-center gap-6 text-[var(--sx-muted)]">
          <span>Search</span>
          <span>Bag (0)</span>
          <span className="flex items-center gap-2 text-[var(--sx-text)]">
            Close <span className="text-[18px] leading-none">×</span>
          </span>
        </span>
      </div>
      <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 items-start gap-[clamp(32px,4vw,72px)] md:grid-cols-12">
        <nav aria-label="Main" className="min-w-0 md:col-span-7 md:pr-[clamp(8px,1.5vw,32px)]">
          <p data-m-head className="sx-display max-w-full text-[clamp(34px,3.9vw,66px)] leading-[1.08] tracking-[-0.01em]">
            {NV12_ITEMS.map((x, k) => (
              <Fragment key={x.t}>
              <span className="whitespace-nowrap">
                <a
                  href="#"
                  onClick={noop}
                  onMouseEnter={() => setA(k)}
                  className={`transition-colors duration-500 ${k === a ? "text-[var(--sx-text)] italic" : "text-[color-mix(in_srgb,var(--sx-text)_32%,transparent)]"}`}
                >
                  {x.t}
                </a>
                {k < NV12_ITEMS.length - 1 && <span className="ml-[0.25em] text-[var(--sx-accent)]">/</span>}
              </span>{" "}
              </Fragment>
            ))}
          </p>
          <P className="mt-10 max-w-[44ch]">Hand-loomed cotton and washed linen, cut in small runs in our Jaipur atelier. New pieces every second Friday.</P>
        </nav>
        <aside className="sx-card p-[clamp(16px,1.6vw,24px)] md:col-span-5">
          <div className="fx-pan grid grid-cols-2 gap-[clamp(8px,1vw,14px)]">
            {it.s.map((p, k) => (
              <div key={k} className="overflow-hidden rounded-[12px]">
                <div className="fx-drift" style={{ animationDelay: `${-k * 1.7}s` }}>
                  <Pic i={p} ratio="4/5" round={false} label="" />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-baseline justify-between gap-4">
            <span className="sx-display text-[clamp(24px,2vw,32px)]">{it.t}</span>
            <span className="text-[14px] text-[var(--sx-muted)]">{it.n}</span>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-[var(--sx-line)] pt-4 text-[14px]">
            <span className="text-[var(--sx-muted)]">
              From <Price now="₹3,900" className="text-[var(--sx-text)]" />
            </span>
            <Btn kind="link">View all →</Btn>
          </div>
        </aside>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "NV09", name: "Fixed vertical side rail nav", motion: "M23", C: NV09 },
  { code: "NV10", name: "Altitude scroll-progress rail", motion: "M3", C: NV10 },
  { code: "NV11", name: "Three-island navbar", motion: "M18", C: NV11 },
  { code: "NV12", name: "Inline sentence menu with preview panel", motion: "M13", C: NV12 },
];
