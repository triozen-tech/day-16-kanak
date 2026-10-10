"use client";

// FT · Feature layouts, batch 4 (FT17–FT20). Full designed sections; ?static=1 shows each in its final state.
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Pic, Price, Product, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Hands-free cycling: steps an index every `ms` while the section is on screen (stops off screen and in ?static=1). */
function useAutoCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms = 2000) {
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

const ICONS: Record<string, string> = {
  mic: "M12 3.5a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0v-5a3 3 0 0 0-3-3z M6 11a6 6 0 0 0 12 0 M12 17v3.5",
  wave: "M3 12h2 M7 8v8 M11 5v14 M15 8v8 M19 10.5v3 M21 12h0",
  link: "M9.5 14.5l5-5 M8 11.5l-2 2a3.5 3.5 0 0 0 5 5l2-2 M16 12.5l2-2a3.5 3.5 0 0 0-5-5l-2 2",
  leaf: "M5 19c0-8 5-13 14-14-1 9-6 14-14 14z M5 19l7-7",
  truck: "M3 7h11v9H3z M14 10h4l3 3v3h-7 M7 18.5a1.5 1.5 0 1 0 0-.01 M17 18.5a1.5 1.5 0 1 0 0-.01",
  gift: "M4 10h16v10H4z M3 7h18v3H3z M12 7v13 M12 7c-2-3-5-3-5-1s3 1 5 1c2 0 5 1 5-1s-3-2-5 1",
  repeat: "M4 9a6 6 0 0 1 10-3l3 3 M17 4v5h-5 M20 15a6 6 0 0 1-10 3l-3-3 M7 20v-5h5",
};
const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d={ICONS[name]} />
  </svg>
);

/* ───────────────────────── FT17 · Wide masked visual + four footnotes ───────────────────────── */

const FT17_CSS = `
.ft17-bar{transform-origin:50% 100%;animation:ft17-eq var(--d,1.2s) ease-in-out infinite alternate;animation-delay:var(--dl,0s)}
@keyframes ft17-eq{from{transform:scaleY(.18)}to{transform:scaleY(1)}}
.ft17-sweep{animation:ft17-sweep 3.4s linear infinite}
@keyframes ft17-sweep{from{transform:translateX(-40%) skewX(-16deg)}to{transform:translateX(420%) skewX(-16deg)}}
html.is-static .ft17-bar,html.is-static .ft17-sweep{animation:none}
html.is-static .ft17-sweep{opacity:0}
html.is-static {.ft17-bar,.ft17-sweep{animation:none}.ft17-sweep{opacity:0}}
`;

const FT17_NOTES = [
  { icon: "mic", b: "Room-aware.", t: "Twin microphones map your room and re-tune the drivers in eight seconds." },
  { icon: "wave", b: "Flat to 38 Hz.", t: "A 6.5-inch woofer in a walnut cabinet, no boom, no bloat." },
  { icon: "link", b: "Pairs as one.", t: "Two speakers lock into a stereo pair over their own wireless link." },
  { icon: "repeat", b: "Built to be fixed.", t: "Every part is replaceable, and we stock them for ten years." },
];

/** FT17 · A big two-line headline, then one panoramic photo (88:36) with a bottom fade and a corner bracket at the
 *  top-left, then a row of four short bold-lead footnotes with icons. The photo scales down into its frame with the
 *  scroll (M13), footnotes slide up; an equaliser breathes in the fade while it holds. */
function FT17() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M13");
  const bars = 36;
  return (
    <Sec innerRef={r} theme="ink" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <style>{FT17_CSS}</style>
      <div className="flex flex-wrap items-end justify-between gap-8">
        <H className="text-[clamp(48px,6vw,104px)]">
          One pair of speakers.
          <br />
          <span className="text-[var(--sx-muted)]">Every room, tuned.</span>
        </H>
        <div data-m-text className="flex flex-wrap items-center gap-5 pb-2">
          <p className="text-[15px] text-[var(--sx-muted)]">
            Aurel Two · <Price now="₹38,900" className="text-[var(--sx-text)]" /> a pair
          </p>
          <Btn>Book a listening</Btn>
        </div>
      </div>
      <div className="relative mt-[clamp(40px,5vw,72px)]">
        <span className="pointer-events-none absolute -left-[clamp(10px,1.2vw,18px)] -top-[clamp(10px,1.2vw,18px)] z-10 h-[clamp(48px,5vw,80px)] w-[clamp(48px,5vw,80px)] rounded-tl-[10px] border-l-2 border-t-2 border-[var(--sx-accent)]" />
        <Pic i={0} ratio="88/36" label="" />
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[var(--sx-radius)]">
          <div className="ft17-sweep absolute inset-y-0 left-0 w-[24%] bg-[linear-gradient(90deg,transparent,rgba(180,210,255,.14),transparent)]" />
          <div className="absolute inset-x-0 bottom-0 h-[55%] bg-[linear-gradient(180deg,transparent,var(--sx-bg))]" />
          <div className="absolute inset-x-[18%] bottom-[8%] flex h-[34%] items-end justify-between gap-[0.5%]">
            {Array.from({ length: bars }, (_, k) => {
              const hgt = 0.35 + 0.65 * Math.abs(Math.sin(k * 0.55 + 0.4));
              return (
                <span
                  key={k}
                  className="ft17-bar block w-full rounded-full bg-[linear-gradient(180deg,var(--sx-accent),color-mix(in_srgb,var(--sx-accent)_30%,transparent))]"
                  style={{ height: `${(hgt * 100).toFixed(0)}%`, ["--d" as string]: `${0.7 + ((k * 7) % 9) * 0.09}s`, ["--dl" as string]: `${-((k * 13) % 10) * 0.11}s` }}
                />
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-[clamp(24px,3vw,44px)] grid grid-cols-1 gap-[clamp(20px,2.4vw,40px)] md:grid-cols-4">
        {FT17_NOTES.map((n) => (
          <div key={n.b} data-m-text className="flex gap-3.5">
            <Icon name={n.icon} className="mt-0.5 h-5 w-5 shrink-0 text-[var(--sx-accent)]" />
            <p className="text-[15px] leading-relaxed text-[var(--sx-muted)]">
              <b className="font-[650] text-[var(--sx-text)]">{n.b}</b> {n.t}
            </p>
          </div>
        ))}
      </div>
    </Sec>
  );
}

/* ───────────────────────── FT18 · Tall story-card carousel opening into an article ───────────────────────── */

const FT18_CSS = `
.ft18-kb{animation:ft18-kb var(--d,5s) ease-in-out infinite alternate}
@keyframes ft18-kb{from{scale:1.02;translate:0 1.5%}to{scale:1.14;translate:0 -2.5%}}
.ft18-read{animation:ft18-read 7s linear infinite alternate}
@keyframes ft18-read{from{translate:0 0}to{translate:0 -34%}}
html.is-static .ft18-kb,html.is-static .ft18-read{animation:none}
html.is-static {.ft18-kb,.ft18-read{animation:none}}
`;

const FT18_STORIES = [
  { i: 3, cat: "Kerala", t: "The cook who never measures", lede: "On a houseboat outside Alleppey, Saramma makes fish molee by smell, sound and forty years of habit.", days: "6 days", price: "₹62,000" },
  { i: 1, cat: "Rajasthan", t: "Indigo, two dips deep", lede: "In a courtyard in Bagru, the Chhipa family still prints cloth with carved teak blocks and vats that never go cold.", days: "5 days", price: "₹54,500" },
  { i: 2, cat: "Meghalaya", t: "Bridges that grow back", lede: "Living root bridges take a generation to cross. We walked three of them with the village that tends them.", days: "7 days", price: "₹71,000" },
  { i: 0, cat: "Ladakh", t: "Apricots at 3,500 metres", lede: "In Garkone the harvest is dried on rooftops. We spent a week learning why the stones are worth more than the fruit.", days: "8 days", price: "₹88,000" },
  { i: 3, cat: "Goa", t: "Bread, before the sun", lede: "The poders of Saligao still cycle their poi round the lanes at six, a horn announcing every stop.", days: "4 days", price: "₹38,500" },
  { i: 1, cat: "Sikkim", t: "A tea garden in cloud", lede: "Picking the second flush with the women of Temi, then tasting it by the window where it was rolled.", days: "6 days", price: "₹66,000" },
];

/** FT18 · Heading top-left; one row of tall portrait story cards (four visible, more off to the right, starting at the
 *  content padding), each a full-bleed photo with a small category and a two-line title at the top; prev/next arrows
 *  bottom-right. A card opens into a full-section article. Cards snap in (M34); hands-free the row steps along and one
 *  story opens, reads itself a little and closes. */
function FT18() {
  const r = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const tick = useRef(0);
  useSectionMotion(r, "M34");
  const n = FT18_STORIES.length;
  const maxIdx = n - 4;
  useEffect(() => {
    const t = track.current;
    if (!t) return;
    const card = t.children[0] as HTMLElement | undefined;
    if (!card) return;
    const step = card.offsetWidth + parseFloat(getComputedStyle(t).columnGap || "0");
    gsap.to(t, { x: -idx * step, duration: 0.9, ease: "power3.inOut", overwrite: true });
  }, [idx]);
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    // a little film: step, step, open the front story, hold, close, step, back to the start
    const seq: (() => void)[] = [
      () => setIdx(1),
      () => setIdx(2),
      () => setOpen(2),
      () => {},
      () => setOpen(null),
      () => setIdx(1),
      () => setIdx(0),
    ];
    let t: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(
      ([e]) => {
        clearInterval(t);
        if (e.isIntersecting)
          t = setInterval(() => {
            seq[tick.current % seq.length]();
            tick.current++;
          }, 1500);
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, []);
  const s = open === null ? null : FT18_STORIES[open];
  return (
    <Sec innerRef={r} theme="paper" font="editorial" full className="py-[clamp(72px,9vw,140px)]">
      <style>{FT18_CSS}</style>
      <div className="flex flex-wrap items-end justify-between gap-6 px-[clamp(20px,5vw,96px)]">
        <H className="max-w-[14ch] text-[clamp(48px,5.6vw,96px)]">Journeys, told by the people in them.</H>
        <P className="max-w-[36ch] md:pb-2">Small-group trips across India, each built around one host and one craft. Read the story, then join it.</P>
      </div>
      <div className="mt-[clamp(36px,4.4vw,64px)] overflow-hidden pl-[clamp(20px,5vw,96px)]">
        <div ref={track} className="flex gap-[clamp(12px,1.4vw,20px)] will-change-transform">
          {FT18_STORIES.map((x, k) => (
            <button
              key={x.t}
              type="button"
              data-m-card
              data-cursor="Read"
              onClick={() => setOpen(k)}
              className="relative aspect-[380/600] w-[clamp(240px,25vw,380px)] shrink-0 overflow-hidden rounded-[var(--sx-radius)] text-left text-white"
            >
              <div className="ft18-kb absolute inset-0" style={{ ["--d" as string]: k % 2 ? "4.2s" : "5.6s" }}>
                <Pic i={x.i} ratio="auto" round={false} label="" className="absolute inset-0 h-full w-full" />
              </div>
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,14,8,.78),rgba(20,14,8,.15)_42%,transparent_60%,rgba(20,14,8,.4))]" />
              <div className="absolute inset-x-0 top-0 p-[clamp(18px,2vw,28px)]">
                <p className="text-[13px] font-[600] uppercase tracking-[0.16em] text-white/70">{x.cat}</p>
                <p className="sx-display mt-2 max-w-[13ch] text-[clamp(26px,2.3vw,36px)] leading-[1.02]">{x.t}</p>
              </div>
              <span className="absolute bottom-[clamp(18px,2vw,28px)] right-[clamp(18px,2vw,28px)] grid h-11 w-11 place-items-center rounded-full bg-white/90 text-[20px] text-[#1c1813]">+</span>
            </button>
          ))}
        </div>
      </div>
      <div className="mt-8 flex items-center justify-between gap-6 px-[clamp(20px,5vw,96px)]">
        <p className="text-[14px] text-[var(--sx-muted)]">Departures from October · groups of eight</p>
        <div className="flex gap-3">
          {[
            ["←", "Previous", () => setIdx((v) => Math.max(0, v - 1))],
            ["→", "Next", () => setIdx((v) => Math.min(maxIdx, v + 1))],
          ].map(([g, l, fn]) => (
            <button key={l as string} type="button" aria-label={l as string} onClick={fn as () => void} className="grid h-12 w-12 place-items-center rounded-full border border-[var(--sx-line)] bg-[var(--sx-surface)] text-[18px] transition-colors hover:bg-[var(--sx-text)] hover:text-[var(--sx-bg)]">
              {g as string}
            </button>
          ))}
        </div>
      </div>
      {/* the opened story: a full-section reading sheet */}
      <div className={`absolute inset-0 z-30 grid place-items-center bg-[rgba(20,14,8,.55)] p-[clamp(16px,3vw,48px)] backdrop-blur-sm transition-opacity duration-500 ${s ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={() => setOpen(null)}>
        <article onClick={(e) => e.stopPropagation()} className={`relative grid h-full max-h-[860px] w-full max-w-[1120px] grid-cols-1 overflow-hidden rounded-[var(--sx-radius)] bg-[var(--sx-surface)] shadow-2xl transition-[scale,translate] duration-500 ease-[cubic-bezier(.2,.8,.2,1)] md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] ${s ? "translate-y-0 scale-100" : "translate-y-6 scale-[.94]"}`}>
          {s && (
            <>
              <div className="relative min-h-[240px] overflow-hidden">
                <div className="ft18-kb absolute inset-0" style={{ ["--d" as string]: "3.6s" }}>
                  <Pic i={s.i} ratio="auto" round={false} label="" className="absolute inset-0 h-full w-full" />
                </div>
              </div>
              <div className="relative min-h-0 overflow-hidden">
                <div className="ft18-read p-[clamp(24px,3.4vw,56px)]">
                  <p className="text-[13px] font-[600] uppercase tracking-[0.16em] text-[var(--sx-accent)]">{s.cat} · {s.days}</p>
                  <h3 className="sx-display mt-3 text-[clamp(36px,3.6vw,60px)] leading-[0.98]">{s.t}</h3>
                  <p className="mt-6 text-[18px] leading-relaxed">{s.lede}</p>
                  <p className="mt-5 text-[16px] leading-relaxed text-[var(--sx-muted)]">We arrive in the late afternoon, when the light goes copper and the kitchen fires are lit. Our host has done this for longer than most of us have been alive, and the first lesson is simply to watch.</p>
                  <div className="mt-6">
                    <Pic i={(s.i + 1) % 4} ratio="16/9" label="" />
                  </div>
                  <p className="mt-6 text-[16px] leading-relaxed text-[var(--sx-muted)]">By the second morning the group is helping: grinding, folding, carrying. Nothing is staged and nothing is rushed. Evenings are long, dinners are shared, and the stories come out once the plates are cleared.</p>
                  <p className="mt-5 text-[16px] leading-relaxed text-[var(--sx-muted)]">Rooms are in family homestays chosen by the host. Meals, local travel and a donation to the village fund are included.</p>
                  <div className="mt-8 flex flex-wrap items-center gap-5">
                    <Btn>Join this journey</Btn>
                    <span className="text-[15px]">
                      from <Price now={s.price} /> per person
                    </span>
                  </div>
                </div>
              </div>
              <button type="button" aria-label="Close story" onClick={() => setOpen(null)} className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-[var(--sx-text)] text-[18px] text-[var(--sx-bg)]">
                ×
              </button>
            </>
          )}
        </article>
      </div>
    </Sec>
  );
}

/* ───────────────────────── FT19 · Browser-frame storefront showcase ───────────────────────── */

const FT19_CSS = `
.ft19-scroll{animation:ft19-scroll 12s ease-in-out infinite alternate}
@keyframes ft19-scroll{0%,6%{translate:0 0}94%,100%{translate:0 calc(-100% + var(--fh))}}
.ft19-cursor{animation:ft19-cursor 4.4s ease-in-out infinite alternate}
@keyframes ft19-cursor{from{translate:0 0}to{translate:-180px 90px}}
html.is-static .ft19-scroll,html.is-static .ft19-cursor{animation:none}
html.is-static {.ft19-scroll,.ft19-cursor{animation:none}}
`;

const FT19_TEAS = [
  { n: "Monsoon Masala", d: "Assam CTC, clove, ginger", p: "₹420", c: "#b5502a", a: 0 },
  { n: "First Flush", d: "Darjeeling, 2026 spring", p: "₹780", c: "#7a8f3c", a: 1 },
  { n: "Kashmiri Kahwa", d: "Green tea, saffron, almond", p: "₹640", c: "#d4a24c", a: 2 },
  { n: "Nilgiri Frost", d: "Winter-picked black", p: "₹560", c: "#3e6a8a", a: 3 },
  { n: "Tulsi Rose", d: "Caffeine free", p: "₹380", c: "#c23a5b", a: 1 },
  { n: "Smoked Lapsang", d: "Pine-smoked, bold", p: "₹690", c: "#5a3a2a", a: 0 },
  { n: "Lemongrass Mint", d: "Herbal, cooling", p: "₹360", c: "#5fb48a", a: 2 },
  { n: "Oolong Moon", d: "Half-rolled, honeyed", p: "₹920", c: "#8a5cf6", a: 3 },
];

function FT19Tile({ t }: { t: (typeof FT19_TEAS)[number] }) {
  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-[12px]" style={{ background: `radial-gradient(closest-side, color-mix(in srgb, ${t.c} 35%, transparent), transparent), linear-gradient(180deg,#fbf8f2,#efe7da)` }}>
        <Product angle={t.a} accent={t.c} className="absolute inset-0 m-auto h-[82%] w-[82%]" />
      </div>
      <p className="mt-3 text-[14px] font-[650] text-[#1c1813]">{t.n}</p>
      <div className="mt-0.5 flex items-baseline justify-between gap-2 text-[12px] text-[#6d6457]">
        <span>{t.d}</span>
        <b className="text-[13px] font-[650] text-[#1c1813]">{t.p}</b>
      </div>
    </div>
  );
}

/** FT19 · Centred heading; a very wide browser window (address bar, dots) showing the online tea shop, its page
 *  scrolling by itself inside; the frame's bottom fades into the section, with three small feature captions under
 *  it. The frame tilts up from depth with the scroll (M31). */
function FT19() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M31");
  return (
    <Sec innerRef={r} theme="stone" font="wide" className="py-[clamp(72px,9vw,140px)]">
      <style>{FT19_CSS}</style>
      <div className="mx-auto max-w-[860px] text-center">
        <H className="text-[clamp(42px,5vw,84px)]">Your tea shop, open all night.</H>
        <P className="mx-auto mt-6 max-w-[48ch]">The Kesar &amp; Kettle store takes orders while the estate sleeps: every blend, gift box and refill, packed and shipped by morning.</P>
      </div>
      <div className="relative mx-auto mt-[clamp(40px,5vw,72px)] max-w-[1200px]" style={{ ["--fh" as string]: "clamp(380px,36vw,560px)" }}>
        <div data-m-card className="overflow-hidden rounded-t-[16px] border border-b-0 border-[var(--sx-line)] bg-[var(--sx-surface)] shadow-[0_60px_120px_-50px_rgba(17,20,24,.45)]">
          <div className="flex items-center gap-4 border-b border-[var(--sx-line)] px-5 py-3.5">
            <div className="flex gap-2">
              {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                <span key={c} className="h-3 w-3 rounded-full" style={{ background: c }} />
              ))}
            </div>
            <div className="mx-auto flex w-[min(460px,60%)] items-center justify-center gap-2 rounded-full bg-[var(--sx-bg)] px-4 py-1.5 text-[13px] text-[var(--sx-muted)]">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path d="M7 11V8a5 5 0 0 1 10 0v3 M5 11h14v9H5z" />
              </svg>
              kesarandkettle.example/shop
            </div>
            <span className="w-[52px]" />
          </div>
          <div className="relative overflow-hidden bg-[#fbf8f2]" style={{ height: "var(--fh)" }}>
            <div className="ft19-scroll px-[clamp(20px,3vw,44px)] pb-10">
              <div className="flex items-center justify-between border-b border-[rgba(28,24,19,.1)] py-4 text-[13px] text-[#1c1813]">
                <span className="text-[18px] font-[800] tracking-[-0.02em]">Kesar &amp; Kettle</span>
                <span className="hidden gap-7 md:flex">
                  <span>Shop all</span>
                  <span>Gift boxes</span>
                  <span>Refills</span>
                  <span>Journal</span>
                </span>
                <span className="rounded-full bg-[#1c1813] px-3.5 py-1.5 text-[12px] text-white">Bag (2)</span>
              </div>
              <div className="relative mt-5 overflow-hidden rounded-[14px]">
                <Pic i={3} ratio="16/6" round={false} label="" />
                <div className="absolute inset-0 flex flex-col justify-center bg-[linear-gradient(90deg,rgba(20,14,8,.7),transparent_65%)] p-[clamp(20px,3vw,44px)] text-white">
                  <p className="text-[12px] uppercase tracking-[0.16em] text-white/70">New season</p>
                  <p className="mt-2 max-w-[14ch] text-[clamp(22px,2.6vw,40px)] font-[800] leading-[1.02] tracking-[-0.02em]">The monsoon blends are here.</p>
                  <span className="mt-4 w-max rounded-full bg-white px-4 py-2 text-[12px] font-[650] text-[#1c1813]">Shop the blends</span>
                </div>
              </div>
              <div className="mt-8 flex items-end justify-between">
                <p className="text-[20px] font-[800] tracking-[-0.02em] text-[#1c1813]">Bestsellers</p>
                <p className="text-[12px] text-[#6d6457]">Free shipping over ₹999</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-[clamp(10px,1.4vw,20px)] md:grid-cols-4">
                {FT19_TEAS.slice(0, 4).map((t) => (
                  <FT19Tile key={t.n} t={t} />
                ))}
              </div>
              <div className="relative mt-8 overflow-hidden rounded-[14px]">
                <Pic i={1} ratio="16/5" round={false} label="" />
                <div className="absolute inset-0 flex items-center justify-end bg-[linear-gradient(270deg,rgba(20,14,8,.7),transparent_60%)] p-[clamp(20px,3vw,44px)] text-right text-white">
                  <div>
                    <p className="text-[clamp(20px,2.2vw,34px)] font-[800] leading-[1.05] tracking-[-0.02em]">Gift boxes from ₹1,200</p>
                    <p className="mt-2 text-[13px] text-white/75">Hand-tied, with a note in your words</p>
                  </div>
                </div>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-[clamp(10px,1.4vw,20px)] md:grid-cols-4">
                {FT19_TEAS.slice(4).map((t) => (
                  <FT19Tile key={t.n} t={t} />
                ))}
              </div>
            </div>
            <svg viewBox="0 0 24 24" className="ft19-cursor pointer-events-none absolute right-[18%] top-[38%] h-7 w-7 drop-shadow-[0_4px_8px_rgba(0,0,0,.3)]" aria-hidden>
              <path d="M5 3l14 8-6 1.5L10 19z" fill="#1c1813" stroke="#fff" strokeWidth={1.4} strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-[linear-gradient(180deg,transparent,var(--sx-bg)_92%)]" />
      </div>
      <div className="mx-auto mt-[clamp(8px,1vw,16px)] grid max-w-[1000px] grid-cols-1 gap-[clamp(20px,3vw,48px)] md:grid-cols-3">
        {[
          { icon: "truck", b: "Packed by morning.", t: "Orders before midnight leave the estate at 7 am." },
          { icon: "repeat", b: "Refills that remember.", t: "Your blend, every four weeks, skip any time." },
          { icon: "gift", b: "Gifts, handled.", t: "A hand-written note and a date of your choosing." },
        ].map((f) => (
          <div key={f.b} data-m-text className="flex gap-3.5">
            <Icon name={f.icon} className="mt-0.5 h-5 w-5 shrink-0 text-[var(--sx-accent)]" />
            <p className="text-[15px] leading-relaxed text-[var(--sx-muted)]">
              <b className="font-[650] text-[var(--sx-text)]">{f.b}</b> {f.t}
            </p>
          </div>
        ))}
      </div>
    </Sec>
  );
}

/* ───────────────────────── FT20 · Statement left, ruled bullet ledger right ───────────────────────── */

const FT20_CSS = `
.ft20-glow{animation:ft20-glow 4.6s ease-in-out infinite alternate}
@keyframes ft20-glow{from{transform:translate(-18%,-12%) scale(.9)}to{transform:translate(28%,18%) scale(1.2)}}
.ft20-glow2{animation:ft20-glow 6.8s ease-in-out infinite alternate-reverse}
html.is-static .ft20-glow,html.is-static .ft20-glow2{animation:none}
html.is-static {.ft20-glow,.ft20-glow2{animation:none}}
`;

const FT20_LEDGER = [
  { b: "Nine months in glass.", t: "Every batch macerates slowly before it is filtered and bottled." },
  { b: "Twenty-two ingredients, all named.", t: "The full formula is printed inside the box, nothing hidden." },
  { b: "Distilled in Kannauj.", t: "By a family that has made attar on copper degs for six generations." },
  { b: "Refill for life.", t: "Bring the bottle back to any studio and pay only for the perfume." },
];

/** FT20 · Text only. Left: a two-line statement, its first line muted, lighting up word by word with the scroll (M20).
 *  Right: two paragraphs and a ledger of four bold-lead lines between hairlines; the ledger marks one line at a time
 *  while a soft light moves behind the statement. */
function FT20() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M20");
  const [i] = useAutoCycle(r, FT20_LEDGER.length, 1500);
  return (
    <Sec innerRef={r} theme="paper" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <style>{FT20_CSS}</style>
      <div className="pointer-events-none absolute left-[2%] top-[8%] aspect-square w-[min(48vw,700px)]">
        <div className="ft20-glow h-full w-full rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_20%,transparent),transparent)]" />
      </div>
      <div className="pointer-events-none absolute bottom-[4%] left-[22%] aspect-square w-[min(34vw,500px)]">
        <div className="ft20-glow2 h-full w-full rounded-full bg-[radial-gradient(closest-side,rgba(212,162,76,.22),transparent)]" />
      </div>
      <div className="relative grid grid-cols-1 gap-[clamp(40px,6vw,120px)] md:grid-cols-12">
        <div className="md:col-span-6">
          <H className="text-[clamp(48px,5.4vw,92px)] font-[400] leading-[1]">
            <span className="text-[var(--sx-muted)]">We make fewer perfumes.</span> We make them to last.
          </H>
        </div>
        <div className="md:col-span-6 md:pt-3">
          <P>Our studio releases one scent a year. It takes that long to get the opening right, the heart honest and the base slow enough to stay on skin through a full day.</P>
          <P className="mt-5">Everything else follows from that: small batches, plain bottles, prices that pay for perfume rather than advertising. A 50 ml bottle is ₹6,400 and refills are ₹3,900.</P>
          <ul className="mt-10 border-t border-[var(--sx-line)]">
            {FT20_LEDGER.map((l, k) => {
              const on = k === i;
              return (
                <li key={l.b} data-m-card className="relative overflow-hidden border-b border-[var(--sx-line)]">
                  <span className={`absolute inset-y-0 left-0 w-full origin-left bg-[color-mix(in_srgb,var(--sx-accent)_10%,transparent)] transition-[scale] duration-700 ease-[cubic-bezier(.65,0,.35,1)] ${on ? "scale-x-100" : "scale-x-0"}`} />
                  <p className="relative flex gap-4 px-1 py-5 text-[16px] leading-relaxed text-[var(--sx-muted)]">
                    <span className={`mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-500 ${on ? "bg-[var(--sx-accent)]" : "bg-[var(--sx-line)]"}`} />
                    <span>
                      <b className="font-[650] text-[var(--sx-text)]">{l.b}</b> {l.t}
                    </span>
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "FT17", name: "Wide masked visual + four footnotes", motion: "M13", C: FT17 },
  { code: "FT18", name: "Tall story-card carousel opening into an article", motion: "M34", C: FT18 },
  { code: "FT19", name: "Browser-frame storefront showcase", motion: "M31", C: FT19 },
  { code: "FT20", name: "Statement left, ruled bullet ledger right", motion: "M20", C: FT20 },
];
