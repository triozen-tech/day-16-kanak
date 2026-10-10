"use client";

// GL · Gallery layouts, batch 1 (docs/SECTION-MENU.md): GL07 pinned wordmark under a 5-column grid, GL08 full-screen
// image that shrinks into a row, GL09 horizontal image accordion, GL10 3D ring carousel.
// Each keeps moving while on screen (hands-free for filming) and shows its final state in ?static=1.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { scene, useScrub, useTicker } from "../fx/shared";
import { Btn, H, P, Pic, Price, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/* ───────────────────────────── GL07 · Pinned wordmark under a scrolling 5-column grid ───────────────────────────── */

const GL07_CSS = `.gl07-word{background:linear-gradient(100deg,var(--sx-text) 35%,var(--sx-accent) 50%,var(--sx-text) 65%) 0 0/300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:gl07-shine 4.5s linear infinite}@keyframes gl07-shine{from{background-position:100% 0}to{background-position:0% 0}}.is-static .gl07-word{animation:none;background-position:100% 0}html.is-static {.gl07-word{animation:none}}`;
const GL07_COLS = [
  { off: "14%", pics: [1, 3, 0] },
  { off: "0%", pics: [3, 2, 1] },
  { off: "26%", pics: [0, 1, 3] },
  { off: "6%", pics: [2, 3, 0] },
  { off: "20%", pics: [1, 0, 2] },
];
const LOOKS = ["Kurta set", "Wrap dress", "Wide trouser", "Shirt dress", "Drape skirt", "Linen blazer", "Co-ord", "Tunic", "Maxi", "Overshirt", "Sari blouse", "Pleated pant", "Slip dress", "Bandhgala", "Kaftan"];

/** GL07 · A huge wordmark stays pinned mid-screen while a staggered five-column photo grid scrolls up over it. */
function GL07() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M32");
  return (
    <Sec innerRef={r} theme="paper" font="condensed" className="py-[clamp(72px,9vw,140px)]" style={{ overflow: "clip" }}>
      <style>{GL07_CSS}</style>
      <div className="relative z-10 grid grid-cols-1 items-end gap-6 md:grid-cols-12">
        <P className="max-w-[36ch] md:col-span-5">The monsoon lookbook: fifteen looks in handloom cotton and washed linen, dyed with indigo and madder in Bagru.</P>
        <div className="flex flex-wrap items-center gap-4 md:col-span-7 md:justify-end">
          <Btn>Shop the lookbook</Btn>
          <Btn kind="ghost">Book a fitting</Btn>
        </div>
      </div>
      <div className="relative mt-[clamp(32px,4vw,56px)]">
        {/* the wordmark: sticky inside a layer as tall as the grid, so it holds mid-screen while the photos pass over */}
        <div className="pointer-events-none absolute inset-0">
          <div className="sticky top-0 grid h-[100svh] place-items-center overflow-hidden">
            <H className="gl07-word whitespace-nowrap text-center text-[clamp(120px,24vw,420px)] uppercase leading-[0.8] tracking-[-0.01em]">Saanjh</H>
          </div>
        </div>
        <div className="relative z-10 grid grid-cols-5 gap-[clamp(14px,2.4vw,40px)] pb-[30svh] pt-[50svh]">
          {GL07_COLS.map((c, ci) => (
            <div key={ci} data-m-col className="flex min-w-0 flex-col gap-[clamp(14px,2.4vw,40px)]" style={{ marginTop: c.off }}>
              {c.pics.map((p, pi) => {
                const n = ci * 3 + pi;
                return (
                  <figure key={pi} data-cursor="View">
                    <Pic i={p} ratio={pi % 2 ? "3/4" : "4/5"} className="shadow-[0_30px_60px_-34px_rgba(28,24,19,.55)]" />
                    <figcaption className="mt-2 flex justify-between text-[12px] uppercase tracking-[0.12em] text-[var(--sx-muted)]">
                      <span>{LOOKS[n]}</span>
                      <span>Look {n + 1}</span>
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────────── GL08 · Full-screen image shrinks into a thumbnail row ───────────────────────────── */

const ROOMS = [
  { n: "River Suite", d: "68 m² · private deck", p: "₹24,000" },
  { n: "Garden Room", d: "42 m² · courtyard", p: "₹14,500" },
  { n: "Loft Studio", d: "55 m² · reading nook", p: "₹18,900" },
  { n: "Tower Room", d: "36 m² · 360° view", p: "₹16,200" },
  { n: "Pool Villa", d: "110 m² · plunge pool", p: "₹42,000" },
];
const GL08_CSS = `.gl08-kb{animation:gl08-kb 7s ease-in-out infinite alternate}@keyframes gl08-kb{from{transform:scale(1.04)}to{transform:scale(1.14) translate(-1.5%,-1%)}}.is-static .gl08-kb{animation:none}html.is-static {.gl08-kb{animation:none}}`;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

/** GL08 · Starts as one full-screen image; scrolling shrinks it into slot 1 of a row of five captioned images. */
function GL08() {
  const r = useRef<HTMLDivElement>(null);
  const outer = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const slot = useRef<HTMLDivElement>(null);
  const big = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const [still, setStill] = useState(false);
  useEffect(() => {
    const el = outer.current;
    if (!el) return;
    const update = (p: number) => {
      const s = stage.current?.getBoundingClientRect();
      const t = slot.current?.getBoundingClientRect();
      const b = big.current;
      if (!s || !t || !b) return;
      const e = ease(clamp01((p - 0.04) / 0.6));
      b.style.left = `${(t.left - s.left) * e}px`;
      b.style.top = `${(t.top - s.top) * e}px`;
      b.style.width = `${s.width + (t.width - s.width) * e}px`;
      b.style.height = `${s.height + (t.height - s.height) * e}px`;
      b.style.borderRadius = `${18 * e}px`;
      if (title.current) title.current.style.opacity = String(1 - clamp01(e * 2.2));
      cards.current.forEach((c, k) => {
        if (!c) return;
        const v = ease(clamp01((p - 0.42 - k * 0.06) / 0.22));
        c.style.opacity = String(v);
        c.style.transform = `translate3d(${(1 - v) * 80}px, ${(1 - v) * 40}px, 0)`;
      });
    };
    if (prefersReducedMotion()) {
      setStill(true);
      return;
    }
    const st = ScrollTrigger.create({ trigger: el, start: "top top", end: "bottom bottom", onUpdate: (self) => update(self.progress), onRefresh: (self) => update(self.progress) });
    update(st.progress);
    return () => st.kill();
  }, []);
  return (
    <Sec innerRef={r} theme="ink" font="serif" full style={{ overflow: "clip" }}>
      <style>{GL08_CSS}</style>
      <div ref={outer} className={still ? "" : "h-[170svh]"}>
        <div ref={stage} className={`${still ? "relative" : "sticky top-0"} flex min-h-[640px] flex-col justify-between overflow-hidden px-[clamp(20px,5vw,96px)] py-[clamp(48px,6vw,88px)] ${still ? "" : "h-[100svh]"}`}>
          <div className="grid grid-cols-1 items-end gap-6 md:grid-cols-12">
            <H className="text-[clamp(44px,5.4vw,96px)] md:col-span-7">Five rooms by the river.</H>
            <div className="md:col-span-5">
              <P className="max-w-[38ch]">A forty-year-old rice mill on the Kaveri, now a hotel of five rooms. Breakfast from the garden, boats at dawn.</P>
              <div className="mt-6">
                <Btn>Check dates</Btn>
              </div>
            </div>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-[clamp(10px,1.4vw,20px)] md:grid-cols-5">
            {ROOMS.map((room, k) => (
              <div key={room.n} ref={k === 0 ? slot : (n) => void (cards.current[k - 1] = n)} className="min-w-0">
                <Pic i={k % 4} ratio="3/4" />
                <div className="mt-3 flex items-baseline justify-between gap-2">
                  <p className="text-[16px] font-[650]">{room.n}</p>
                  <Price now={room.p} className="text-[14px]" />
                </div>
                <p className="text-[13px] text-[var(--sx-muted)]">{room.d} · a night</p>
              </div>
            ))}
          </div>
          {/* the travelling image: full stage at first, lands on slot 1 (static: hidden, slot 1 shows its own picture) */}
          <div ref={big} className={`overflow-hidden ${still ? "hidden" : "absolute left-0 top-0 h-full w-full"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={scene(0, 1600, 1100, "")} alt="River Suite" className="gl08-kb absolute inset-0 h-full w-full object-cover" draggable={false} />
            <div ref={title} className="absolute inset-0 grid place-items-center bg-[linear-gradient(180deg,rgba(7,9,15,.1),rgba(7,9,15,.55))] px-6 text-center">
              <p className="sx-display max-w-[14ch] text-[clamp(56px,8vw,140px)] font-[500] leading-[0.95] text-white">Stay by the water.</p>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────────── GL09 · Horizontal image accordion ───────────────────────────── */

const COURSES = [
  { t: "Amuse", n: "Kokum & raw mango", d: "A chilled spoon of kokum, raw mango and black salt to wake the palate.", i: 2 },
  { t: "Bread", n: "Tandoor sourdough", d: "Three-day sourdough baked against the clay, with cultured ghee and smoked salt.", i: 3 },
  { t: "Sea", n: "Kerala crab, curry leaf", d: "Mud crab from Kochi in brown butter and curry leaf, on a thin rice appam.", i: 0 },
  { t: "Fire", n: "Charcoal lamb chop", d: "Kashmiri chilli, slow fire, a mint and yoghurt cloud, pickled shallots.", i: 1 },
  { t: "Garden", n: "Jackfruit biryani", d: "Young jackfruit layered with saffron rice, sealed in dough and opened at the table.", i: 2 },
  { t: "Sweet", n: "Jaggery & coffee", d: "Nolen gur ice cream, Coorg coffee crumb, a thin sheet of burnt sugar.", i: 3 },
];
const GL09_CSS = `.gl09-kb{animation:gl09-kb 6s ease-in-out infinite alternate}@keyframes gl09-kb{from{transform:scale(1.04)}to{transform:scale(1.16) translate(-2%,-1%)}}.gl09-in{animation:gl09-in .8s .25s cubic-bezier(.22,1,.36,1) both}@keyframes gl09-in{from{opacity:0;transform:translateY(18px)}}.is-static .gl09-kb,.is-static .gl09-in{animation:none}html.is-static {.gl09-kb,.gl09-in{animation:none}}`;

/** GL09 · One tall panel is wide with title + copy, the rest are thin strips with rotated labels; it auto-advances. */
function GL09() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M18");
  const [i, setI] = useState(0);
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    let id = 0;
    const io = new IntersectionObserver(([e]) => {
      window.clearInterval(id);
      if (e.isIntersecting) id = window.setInterval(() => setI((v) => (v + 1) % COURSES.length), 2600);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearInterval(id);
    };
  }, []);
  return (
    <Sec innerRef={r} theme="stone" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <style>{GL09_CSS}</style>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[14ch] text-[clamp(48px,6vw,104px)]">Six courses, one long evening.</H>
        <div className="max-w-[34ch] pb-2">
          <P>The monsoon tasting menu at Neem, served Thursday to Sunday. ₹5,800 a guest, ₹2,400 more with pairings.</P>
          <div className="mt-6">
            <Btn>Reserve a table</Btn>
          </div>
        </div>
      </div>
      <div className="mt-[clamp(40px,5vw,72px)] flex h-[clamp(480px,64vh,640px)] gap-[clamp(6px,0.8vw,12px)] max-md:h-auto max-md:flex-col">
        {COURSES.map((c, k) => {
          const on = k === i;
          return (
            <div
              key={c.t}
              data-m-card
              onClick={() => setI(k)}
              className="relative min-w-[64px] cursor-pointer overflow-hidden rounded-[var(--sx-radius)] transition-[flex-grow] duration-[900ms] ease-[cubic-bezier(.65,0,.35,1)] max-md:min-h-[72px]"
              style={{ flexGrow: on ? 7 : 1, flexBasis: 0 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={scene(c.i, 1400, 1200, "")} alt={c.n} className={`absolute inset-0 h-full w-full object-cover ${on ? "gl09-kb" : ""}`} draggable={false} />
              <div className={`absolute inset-0 transition-colors duration-700 ${on ? "bg-[linear-gradient(180deg,rgba(7,9,15,0),rgba(7,9,15,.78))]" : "bg-[rgba(7,9,15,.55)]"}`} />
              <span className={`absolute left-1/2 top-6 -translate-x-1/2 text-[13px] font-[600] tracking-[0.12em] text-white/80 transition-opacity duration-500 ${on ? "opacity-0" : ""}`}>{String(k + 1).padStart(2, "0")}</span>
              <span
                className={`sx-display absolute bottom-6 left-1/2 origin-center whitespace-nowrap text-[clamp(22px,2vw,30px)] text-white transition-opacity duration-500 ${on ? "opacity-0" : ""}`}
                style={{ transform: "translateX(-50%) rotate(180deg)", writingMode: "vertical-rl" }}
              >
                {c.t}
              </span>
              {on && (
                <div className="gl09-in absolute inset-x-0 bottom-0 p-[clamp(20px,2.8vw,40px)] text-white">
                  <p className="text-[13px] uppercase tracking-[0.16em] text-white/70">Course {k + 1} · {c.t}</p>
                  <p className="sx-display mt-2 text-[clamp(34px,3.4vw,56px)] leading-none">{c.n}</p>
                  <p className="mt-3 max-w-[44ch] text-[16px] leading-relaxed text-white/80">{c.d}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Sec>
  );
}

/* ───────────────────────────── GL10 · 3D ring carousel ───────────────────────────── */

const PIECES = [
  { n: "Kaveri Hoops", m: "22k gold · 9 g", p: "₹68,400" },
  { n: "Temple Studs", m: "22k gold, ruby", p: "₹41,900" },
  { n: "Lotus Ring", m: "18k gold, diamond", p: "₹52,300" },
  { n: "Mango Mala", m: "22k gold · 24 g", p: "₹1,82,000" },
  { n: "Rain Drops", m: "Silver, moonstone", p: "₹9,800" },
  { n: "Peacock Cuff", m: "22k gold, enamel", p: "₹96,500" },
  { n: "Jaali Pendant", m: "18k gold", p: "₹34,700" },
  { n: "Pearl Jhumka", m: "Gold, Basra pearl", p: "₹58,200" },
];
const STEP = 360 / PIECES.length;

/** GL10 · Images sit on a ring in perspective; scrolling (and a slow drift) turns it so the front one faces you. */
function GL10() {
  const r = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLDivElement | null)[]>([]);
  const scroll = useRef(0);
  const time = useRef(0);
  const [front, setFront] = useState(0);
  const apply = () => {
    const a = -scroll.current * 300 - time.current;
    if (ring.current) ring.current.style.transform = `rotateY(${a}deg)`;
    items.current.forEach((it, k) => {
      if (!it) return;
      const c = Math.cos(((a + k * STEP) * Math.PI) / 180);
      it.style.opacity = String(0.22 + 0.78 * Math.pow((c + 1) / 2, 1.6));
    });
    const f = (((Math.round(-a / STEP) % PIECES.length) + PIECES.length) % PIECES.length) as number;
    setFront((v) => (v === f ? v : f));
  };
  useScrub(
    r,
    (p) => {
      scroll.current = p;
      apply();
    },
    { finalValue: 0 },
  );
  useTicker(r, (_, dt) => {
    time.current += dt * 9;
    apply();
  });
  const piece = PIECES[front];
  return (
    <Sec innerRef={r} theme="ink" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <div className="text-center">
        <H className="mx-auto max-w-[16ch] text-[clamp(44px,5.6vw,96px)]">The monsoon gold edit.</H>
        <P className="mx-auto mt-5 max-w-[44ch]">Eight pieces, hand-finished in Thrissur. Every one is hallmarked and comes with lifetime polishing.</P>
      </div>
      <div className="relative mt-[clamp(40px,5vw,72px)] grid place-items-center [perspective:1800px]" style={{ height: "calc(clamp(170px,15vw,240px) * 4 / 3 + 80px)" }}>
        <div className="absolute bottom-0 h-[40px] w-[min(70%,760px)] rounded-[50%] bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_35%,transparent),transparent)]" />
        <div className="relative [transform:rotateX(-6deg)] [transform-style:preserve-3d]" style={{ width: "clamp(170px,15vw,240px)", aspectRatio: "3/4" }}>
          <div ref={ring} className="absolute inset-0 [transform-style:preserve-3d]">
            {PIECES.map((x, k) => (
              <div
                key={x.n}
                ref={(n) => void (items.current[k] = n)}
                className="absolute inset-0 overflow-hidden rounded-[14px] border border-white/10"
                style={{ transform: `rotateY(${k * STEP}deg) translateZ(calc(clamp(170px,15vw,240px) * 1.42))`, opacity: k === 0 ? 1 : 0.5 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={scene(k % 4, 600, 800, x.n.toUpperCase())} alt={x.n} className="h-full w-full object-cover" draggable={false} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto mt-[clamp(28px,3vw,44px)] flex max-w-[560px] flex-col items-center text-center">
        <p key={piece.n} className="sx-display text-[clamp(28px,2.6vw,40px)] font-[700] leading-none">{piece.n}</p>
        <p className="mt-2 text-[15px] text-[var(--sx-muted)]">
          {piece.m} · <Price now={piece.p} className="text-[var(--sx-text)]" />
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Btn>View the piece</Btn>
          <Btn kind="ghost">Book a try-on</Btn>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "GL07", name: "Pinned wordmark under a scrolling 5-column grid", motion: "M32", C: GL07 },
  { code: "GL08", name: "Full-screen image shrinks into a thumbnail row", motion: "M13", C: GL08 },
  { code: "GL09", name: "Horizontal image accordion", motion: "M18", C: GL09 },
  { code: "GL10", name: "3D ring carousel", motion: "M33", C: GL10 },
];
