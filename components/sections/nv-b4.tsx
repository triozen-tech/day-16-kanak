"use client";

// NV · Navigation layouts, batch 4 (docs/SECTION-MENU.md). Each is shown as a full designed section in a live state
// (the menu plays by itself), so the gallery shows the whole idea; on a site the nav is fixed and driven by the user.
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { useTicker } from "../fx/shared";
import { FlickeringGrid } from "../fx/more";
import { MagneticButton } from "../fx/layout";
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

/** Scoped keyframes: a re-keyed block rises in; a moving stripe sheen (off in ?static=1 / reduced motion). */
const NV_CSS = `
.nvb4-in{animation:nvb4-in .7s cubic-bezier(.2,.8,.2,1) both}
@keyframes nvb4-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.nvb4-caret{animation:nvb4-caret 1s steps(1) infinite}
@keyframes nvb4-caret{50%{opacity:0}}
html.is-static .nvb4-in,html.is-static .nvb4-caret{animation:none}
html.is-static {.nvb4-in,.nvb4-caret{animation:none}}
`;

/* ───────────────────────── NV13 · Infinite loop scroll menu ───────────────────────── */

const NV13_ITEMS = [
  { t: "Line-up", d: "Forty-two artists across three rooms, Friday to Sunday. Doors at nine, last set at sunrise.", k: "Weekend pass", p: "₹4,800" },
  { t: "Rooms", d: "The Vault, the Glasshouse and a rooftop with a sound system built for the sea breeze.", k: "Rooftop entry", p: "₹1,200" },
  { t: "Residents", d: "Six DJs who play here every month, each with a night of their own and their own guests.", k: "Monthly night", p: "₹900" },
  { t: "Records", d: "Our label: twelve-inch pressings from the residents, cut in small runs of three hundred.", k: "New 12-inch", p: "₹2,400" },
  { t: "Radio", d: "Live from the booth every Thursday night, archived the next morning, no ads, no talk.", k: "Live", p: "Thu 10 pm" },
  { t: "Tickets", d: "Day passes, weekend passes and a members' list with early entry and a quiet bar.", k: "Day pass", p: "₹1,800" },
  { t: "Journal", d: "Interviews, crate lists and the stories behind the residents' favourite records.", k: "Latest", p: "6 min read" },
];

/** NV13 · A full-screen overlay menu of huge centred words that loops forever (the list is cloned three times). It
 *  drifts by itself; wheel and drag push it. The word crossing the centre line lights up and its detail shows aside. */
function NV13() {
  const r = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const col = useRef<HTMLDivElement>(null);
  const off = useRef(0);
  const vel = useRef(0);
  const drag = useRef<number | null>(null);
  const last = useRef(0);
  const [act, setAct] = useState(0);
  useSectionMotion(r, "M12");
  const N = NV13_ITEMS.length;
  const list = [...NV13_ITEMS, ...NV13_ITEMS, ...NV13_ITEMS];

  const apply = () => {
    const st = stage.current;
    const c = col.current;
    if (!st || !c || !c.children.length) return;
    const kids = c.children as HTMLCollectionOf<HTMLElement>;
    const h = kids[0].offsetHeight;
    const set = h * N;
    off.current = ((off.current % set) + set) % set;
    const H2 = st.clientHeight / 2;
    const ty = H2 - N * h - h / 2 - off.current;
    c.style.transform = `translate3d(0, ${ty.toFixed(1)}px, 0)`;
    for (let k = 0; k < kids.length; k++) {
      const d = Math.abs(ty + k * h + h / 2 - H2) / h;
      kids[k].style.opacity = String(Math.max(0.14, 1 - d * 0.36));
      kids[k].style.color = d < 0.5 ? "var(--sx-accent)" : "";
      kids[k].style.scale = String(1 - Math.min(d, 2.5) * 0.05);
    }
    const a = Math.round(off.current / h) % N;
    if (a !== last.current) {
      last.current = a;
      setAct(a);
    }
  };

  useEffect(() => {
    apply();
    const st = stage.current;
    if (!st) return;
    const ro = new ResizeObserver(() => apply());
    ro.observe(st);
    const wheel = (e: WheelEvent) => (vel.current = gsap.utils.clamp(-900, 900, vel.current + e.deltaY * 0.8));
    st.addEventListener("wheel", wheel, { passive: true });
    return () => {
      ro.disconnect();
      st.removeEventListener("wheel", wheel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useTicker(stage, (_, dt) => {
    if (drag.current === null) off.current += dt * (52 + vel.current);
    vel.current *= 0.94;
    apply();
  });

  const it = NV13_ITEMS[act];
  return (
    <Sec innerRef={r} theme="ink" font="condensed" className="py-[clamp(72px,9vw,140px)]">
      <style>{NV_CSS}</style>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[12ch] text-[clamp(52px,6.4vw,108px)] uppercase">Pick a night.</H>
        <P className="max-w-[38ch] pb-2">The menu never ends: spin it with the wheel or drag it, and whatever crosses the line is where you go.</P>
      </div>

      <div data-m-card className="relative mt-[clamp(40px,5vw,72px)] overflow-hidden rounded-[var(--sx-radius)] border border-[var(--sx-line)] bg-[var(--sx-surface)]">
        <div className="relative z-20 flex items-center justify-between border-b border-[var(--sx-line)] px-[clamp(20px,2.4vw,36px)] py-4">
          <a href="#" onClick={noop} className="sx-display text-[22px] font-[800] uppercase tracking-[0.12em]">
            Halcyone
          </a>
          <span className="hidden text-[13px] text-[var(--sx-muted)] md:block">Warehouse 9 · Sewri, Mumbai</span>
          <a href="#" onClick={noop} className="flex items-center gap-3 text-[13px] font-[650] uppercase tracking-[0.16em]">
            Close <span className="grid h-9 w-9 place-items-center rounded-full border border-[var(--sx-line)] text-[16px]">✕</span>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* left: tonight */}
          <div className="relative z-10 hidden flex-col justify-between gap-6 border-r border-[var(--sx-line)] p-[clamp(20px,2.4vw,36px)] md:col-span-3 md:flex">
            <div>
              <p className="text-[12px] uppercase tracking-[0.16em] text-[var(--sx-muted)]">Tonight</p>
              <p className="mt-2 text-[17px] font-[650]">Fri 14 Nov · 9 pm till late</p>
            </div>
            <div className="relative overflow-hidden rounded-[14px]">
              <div className="fx-pan">
                <div className="fx-drift">
                  <Pic i={3} ratio="4/5" label="" />
                </div>
              </div>
            </div>
            <p className="text-[14px] leading-relaxed text-[var(--sx-muted)]">Ira Menon b2b Kabir Shah, all night long in the Vault.</p>
          </div>

          {/* centre: the loop */}
          <div
            ref={stage}
            className="relative h-[clamp(520px,72vh,720px)] cursor-grab touch-none select-none overflow-hidden active:cursor-grabbing md:col-span-6"
            onPointerDown={(e) => {
              drag.current = e.clientY;
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (drag.current === null) return;
              off.current -= e.clientY - drag.current;
              drag.current = e.clientY;
              apply();
            }}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
          >
            <div ref={col} className="absolute inset-x-0 top-0 will-change-transform">
              {list.map((x, k) => (
                <a key={k} href="#" onClick={noop} draggable={false} className="sx-display block text-center text-[clamp(52px,6.6vw,104px)] font-[800] uppercase leading-[1.08] tracking-[-0.01em]">
                  {x.t}
                </a>
              ))}
            </div>
            {/* centre line marks + fades */}
            <span className="pointer-events-none absolute left-4 top-1/2 h-[2px] w-8 bg-[var(--sx-accent)]" />
            <span className="pointer-events-none absolute right-4 top-1/2 h-[2px] w-8 bg-[var(--sx-accent)]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[22%] bg-[linear-gradient(180deg,var(--sx-surface),transparent)]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[22%] bg-[linear-gradient(0deg,var(--sx-surface),transparent)]" />
          </div>

          {/* right: the item on the line */}
          <div className="relative z-10 flex flex-col justify-between gap-8 border-t border-[var(--sx-line)] p-[clamp(20px,2.4vw,36px)] md:col-span-3 md:border-l md:border-t-0">
            <div key={act} className="nvb4-in">
              <p className="sx-display text-[clamp(28px,2.4vw,40px)] font-[800] uppercase leading-none text-[var(--sx-accent)]">{it.t}</p>
              <p className="mt-4 text-[16px] leading-relaxed text-[var(--sx-muted)]">{it.d}</p>
              <p className="mt-6 text-[14px] text-[var(--sx-muted)]">
                {it.k} <Price now={it.p} className="ml-1 text-[20px] text-[var(--sx-text)]" />
              </p>
            </div>
            <Btn>Get tickets</Btn>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── NV14 · Ruled-cell editorial navbar ───────────────────────── */

const NV14_LINKS = ["Exhibitions", "Artists", "Visit", "Shop"];

/** A cell's pixel layer: small squares switch on in a scattered order (a pixel dissolve). Deterministic delays. */
function PixelFill({ on, seed }: { on: boolean; seed: number }) {
  const cols = 16;
  const rows = 5;
  return (
    <div className="pointer-events-none absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${cols},1fr)`, gridTemplateRows: `repeat(${rows},1fr)` }}>
      {Array.from({ length: cols * rows }, (_, k) => (
        <span
          key={k}
          className="bg-[var(--sx-text)] transition-opacity duration-200"
          style={{ opacity: on ? 1 : 0, transitionDelay: `${(((k * 53 + seed * 29) % 37) / 37) * 460}ms` }}
        />
      ))}
    </div>
  );
}

/** NV14 · A top bar ruled into hairline cells (wordmark, four mono-caps links, a CTA). The hovered cell fills with a
 *  pixel dissolve; hands-free the fill steps from cell to cell. The page under it flickers like a live print screen. */
function NV14() {
  const r = useRef<HTMLDivElement>(null);
  const [a, setA] = useAutoCycle(r, 5, 1700);
  const cell = "relative flex h-[clamp(64px,5.6vw,80px)] items-center overflow-hidden border-[var(--sx-line)]";
  return (
    <Sec innerRef={r} theme="stone" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <div className="grid grid-cols-1 items-end gap-[clamp(24px,4vw,64px)] md:grid-cols-12">
        <H className="text-[clamp(44px,5.6vw,92px)] md:col-span-7">Ruled like a broadsheet.</H>
        <P className="max-w-[40ch] md:col-span-5 md:pb-2">Every link has its own cell. Point at one and it fills, pixel by pixel, with ink.</P>
      </div>

      <div className="mt-[clamp(40px,5vw,72px)] overflow-hidden rounded-[var(--sx-radius)] border border-[var(--sx-line)] bg-[var(--sx-surface)]">
        <nav aria-label="Main" className="grid grid-cols-2 border-b border-[var(--sx-line)] md:grid-cols-[minmax(0,1.7fr)_repeat(4,minmax(0,1fr))_minmax(0,1.35fr)]">
          <a href="#" onClick={noop} className={`${cell} col-span-2 border-b px-[clamp(18px,2vw,28px)] md:col-span-1 md:border-b-0 md:border-r`}>
            <span className="sx-display text-[clamp(24px,2vw,32px)] font-[700] italic leading-none">Salt House</span>
            <span className="ml-3 font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--sx-muted)]">Gallery</span>
          </a>
          {NV14_LINKS.map((l, k) => (
            <a
              key={l}
              href="#"
              onClick={noop}
              onMouseEnter={() => setA(k)}
              className={`${cell} justify-center border-r ${k > 1 ? "max-md:border-t" : ""} transition-colors delay-150 duration-300 ${a === k ? "text-[var(--sx-bg)]" : ""}`}
            >
              <PixelFill on={a === k} seed={k + 1} />
              <span className="relative font-mono text-[13px] font-[600] uppercase tracking-[0.14em]">{l}</span>
            </a>
          ))}
          <a
            href="#"
            onClick={noop}
            onMouseEnter={() => setA(4)}
            className={`${cell} col-span-2 justify-center bg-[var(--sx-accent)] text-[var(--sx-accent-text)] max-md:border-t md:col-span-1`}
          >
            <PixelFill on={a === 4} seed={7} />
            <span className="relative font-mono text-[13px] font-[600] uppercase tracking-[0.14em]">Become a member →</span>
          </a>
        </nav>

        <div className="relative">
          <FlickeringGrid className="absolute inset-0" color="17,20,24" size={6} gap={6} chance={0.5} maxOpacity={0.16} />
          <div className="relative z-10 grid grid-cols-1 gap-[clamp(24px,4vw,64px)] p-[clamp(24px,4vw,64px)] md:grid-cols-12">
            <div className="flex flex-col justify-between gap-10 md:col-span-7">
              <div>
                <p className="font-mono text-[13px] uppercase tracking-[0.14em] text-[var(--sx-muted)]">Now showing · Room II</p>
                <p className="sx-display mt-4 max-w-[13ch] text-[clamp(44px,5.4vw,88px)] font-[600] leading-[0.98] tracking-[-0.02em]">Paper, light and silence.</p>
                <p className="mt-6 max-w-[42ch] text-[17px] leading-relaxed text-[var(--sx-muted)]">Forty works on handmade paper by Ira Menon, hung in daylight only. Closed on Mondays.</p>
              </div>
              <div className="grid grid-cols-3 border-t border-[var(--sx-line)] pt-6">
                {[
                  ["Dates", "12 Sep – 30 Nov"],
                  ["Entry", "₹300"],
                  ["Members", "Free"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--sx-muted)]">{k}</p>
                    <p className="mt-1 text-[17px] font-[600]">{v}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:col-span-5">
              <Pic i={0} ratio="4/5" label="ROOM II" />
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── NV15 · Large title that condenses into the bar ───────────────────────── */

/** NV15 · A journal page: a slim bar on top and a huge page title under it. As the page scrolls, the title shrinks and
 *  slides up into the centre of the bar; scrolling back lets it grow out again. Shown in a framed page that scrolls itself. */
function NV15() {
  const r = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLParagraphElement>(null);
  const sub = useRef<HTMLParagraphElement>(null);
  const view = useRef<HTMLDivElement>(null);
  const page = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M6");
  useEffect(() => {
    const fr = frame.current;
    const b = bar.current;
    const t = title.current;
    const s = sub.current;
    const v = view.current;
    const pg = page.current;
    if (!fr || !b || !t || !s || !v || !pg || prefersReducedMotion()) return;
    const sc = () => 24 / t.offsetHeight;
    const dx = () => fr.clientWidth / 2 - t.offsetLeft - (t.offsetWidth * sc()) / 2;
    const dy = () => b.offsetHeight / 2 - (t.offsetHeight * sc()) / 2 - t.offsetTop;
    const dist = () => -Math.max(0, pg.scrollHeight - v.clientHeight);
    gsap.set(t, { transformOrigin: "0 0" });
    const tl = gsap.timeline({ repeat: -1, paused: true, defaults: { ease: "power2.inOut" } });
    tl.to({}, { duration: 0.7 })
      .addLabel("down")
      .to(pg, { y: dist, duration: 2.6 }, "down")
      .to(t, { x: dx, y: dy, scale: sc, duration: 1.1 }, "down")
      .to(s, { opacity: 0, y: -16, duration: 0.5 }, "down")
      .to({}, { duration: 0.6 })
      .addLabel("up")
      .to(pg, { y: 0, duration: 2 }, "up")
      .to(t, { x: 0, y: 0, scale: 1, duration: 1.1 }, "up+=0.9")
      .to(s, { opacity: 1, y: 0, duration: 0.5 }, "up+=1.4");
    const stop = playWhileVisible(fr, tl);
    const onResize = () => tl.invalidate();
    window.addEventListener("resize", onResize);
    return () => {
      stop();
      window.removeEventListener("resize", onResize);
      tl.kill();
      gsap.set([t, s, pg], { clearProps: "all" });
    };
  }, []);
  const products = [
    { n: "Kora overshirt", c: "Washed indigo", p: "₹4,200", i: 1 },
    { n: "Field trouser", c: "Undyed flax", p: "₹3,600", i: 2 },
    { n: "Mill scarf", c: "Rust stripe", p: "₹1,850", i: 0 },
  ];
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[13ch] text-[clamp(48px,6vw,100px)]">The title folds into the bar.</H>
        <P className="max-w-[38ch] pb-2">Big and calm at the top of the page, then out of the way: once you read on, the headline becomes the header.</P>
      </div>

      <div
        ref={frame}
        data-m-card
        className="relative mt-[clamp(40px,5vw,72px)] h-[clamp(540px,70vh,700px)] overflow-hidden rounded-[var(--sx-radius)] border border-[var(--sx-line)] bg-[var(--sx-surface)] shadow-[0_40px_80px_-50px_rgba(28,24,19,.45)]"
      >
        <div ref={bar} className="absolute inset-x-0 top-0 z-20 flex h-14 items-center justify-between border-b border-[var(--sx-line)] bg-[var(--sx-surface)] px-[clamp(18px,2.4vw,36px)]">
          <a href="#" onClick={noop} className="text-[14px] font-[700] uppercase tracking-[0.3em]">
            Kora
          </a>
          <div className="flex items-center gap-[clamp(14px,2vw,28px)] text-[14px] text-[var(--sx-muted)]">
            <span className="max-md:hidden">Shop</span>
            <span className="max-md:hidden">Stores</span>
            <span className="text-[var(--sx-text)]">Bag (2)</span>
          </div>
        </div>

        <p ref={title} className="sx-display absolute left-[clamp(18px,2.4vw,36px)] top-[86px] z-30 whitespace-nowrap text-[clamp(60px,9vw,148px)] font-[500] leading-none tracking-[-0.03em]">
          Field Notes
        </p>
        <p ref={sub} className="absolute left-[clamp(18px,2.4vw,36px)] top-[calc(96px+clamp(60px,9vw,148px))] z-10 text-[15px] text-[var(--sx-muted)]">
          The Kora journal · Issue 14 · Monsoon
        </p>

        <div ref={view} className="absolute inset-x-0 bottom-0 top-14 overflow-hidden">
          <div ref={page} className="px-[clamp(18px,2.4vw,36px)] pb-10 will-change-transform">
            <div className="h-[calc(110px+clamp(60px,9vw,148px))]" />
            <div className="relative overflow-hidden rounded-[14px]">
              <div className="fx-pan">
                <div className="fx-drift">
                  <Pic i={3} ratio="21/8" label="" round={false} />
                </div>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-12">
              <p className="sx-display text-[clamp(26px,2.4vw,38px)] leading-[1.15] md:col-span-5">A week at the mill in Phulia, where the flax is still beaten by hand.</p>
              <p className="text-[16px] leading-relaxed text-[var(--sx-muted)] md:col-span-4">Kabir Shah has woven for thirty years. He tells us why the loom slows in the rain, and why the best cloth comes off it in August.</p>
              <div className="flex items-end md:col-span-3 md:justify-end">
                <Btn kind="link">Read the issue →</Btn>
              </div>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-5 border-t border-[var(--sx-line)] pt-8 md:grid-cols-3">
              {products.map((x) => (
                <div key={x.n} className="flex items-center gap-4">
                  <Pic i={x.i} ratio="1/1" className="w-20 shrink-0" label="" />
                  <div>
                    <p className="text-[16px] font-[650]">{x.n}</p>
                    <p className="text-[14px] text-[var(--sx-muted)]">
                      {x.c} · <Price now={x.p} className="text-[var(--sx-text)]" />
                    </p>
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

/* ───────────────────────── NV16 · Floating pill navbar that hides on scroll ───────────────────────── */

/** NV16 · A detached rounded nav bar floating 16px under the top edge with a soft shadow (brand, links, one CTA), the
 *  page visible all around it. Scrolling down slides it away; scrolling up brings it back. Shown in a self-scrolling page. */
function NV16() {
  const r = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLDivElement>(null);
  const view = useRef<HTMLDivElement>(null);
  const page = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fr = frame.current;
    const pl = pill.current;
    const v = view.current;
    const pg = page.current;
    if (!fr || !pl || !v || !pg || prefersReducedMotion()) return;
    const dist = () => -Math.max(0, pg.scrollHeight - v.clientHeight);
    const tl = gsap.timeline({ repeat: -1, paused: true, defaults: { ease: "power2.inOut" } });
    tl.to({}, { duration: 0.6 })
      .addLabel("down")
      .to(pg, { y: dist, duration: 2.6 }, "down")
      .to(pl, { yPercent: -190, opacity: 0.4, duration: 0.55, ease: "power3.in" }, "down+=0.25")
      .to({}, { duration: 0.5 })
      .addLabel("up")
      .to(pg, { y: 0, duration: 2.2 }, "up")
      .to(pl, { yPercent: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, "up+=0.1");
    const stop = playWhileVisible(fr, tl);
    const onResize = () => tl.invalidate();
    window.addEventListener("resize", onResize);
    return () => {
      stop();
      window.removeEventListener("resize", onResize);
      tl.kill();
      gsap.set([pl, pg], { clearProps: "all" });
    };
  }, []);
  const range = [
    { n: "Vetiver cleansing oil", p: "₹1,450", c: "#c9a46a", a: 0 },
    { n: "Rose & oat cream", p: "₹1,890", c: "#d98a8a", a: 1 },
    { n: "Saffron night serum", p: "₹2,650", c: "#d9963a", a: 2 },
  ];
  return (
    <Sec innerRef={r} theme="stone" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <div className="grid grid-cols-1 items-end gap-[clamp(24px,4vw,64px)] md:grid-cols-12">
        <H className="text-[clamp(44px,5.6vw,92px)] md:col-span-7">A nav that steps aside.</H>
        <div className="md:col-span-5 md:pb-2">
          <P className="max-w-[40ch]">A floating pill with a soft shadow. It slips away while you read down the page and comes back the moment you scroll up.</P>
        </div>
      </div>

      <div
        ref={frame}
        className="relative mt-[clamp(40px,5vw,72px)] h-[clamp(540px,70vh,700px)] overflow-hidden rounded-[var(--sx-radius)] border border-[var(--sx-line)] bg-[var(--sx-bg)]"
      >
        <div ref={view} className="absolute inset-0 overflow-hidden">
          <div ref={page} className="will-change-transform">
            <div className="relative h-[clamp(540px,70vh,700px)]">
              <div className="fx-pan absolute inset-[-3%]">
                <div className="fx-drift absolute inset-0">
                  <Pic i={1} ratio="auto" round={false} className="absolute inset-0 h-full w-full" label="" />
                </div>
              </div>
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.55))]" />
              <div className="absolute inset-x-0 bottom-0 p-[clamp(24px,4vw,56px)] text-white">
                <p className="sx-display max-w-[14ch] text-[clamp(44px,5.6vw,88px)] font-[700] leading-[0.95] tracking-[-0.03em]">Skin, slowed down.</p>
                <p className="mt-4 max-w-[44ch] text-[17px] leading-relaxed text-white/80">Cold-pressed oils and Ayurvedic herbs, made in small batches in Pune.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5 p-[clamp(24px,4vw,56px)] md:grid-cols-3">
              {range.map((x) => (
                <div key={x.n} className="rounded-[16px] bg-[var(--sx-surface)] p-5">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[12px]" style={{ background: `radial-gradient(closest-side, ${x.c}66, transparent), var(--sx-bg)` }}>
                    <Product angle={x.a} accent={x.c} className="absolute inset-0 m-auto h-[82%] w-[82%]" />
                  </div>
                  <div className="mt-4 flex items-center justify-between text-[16px]">
                    <span className="font-[600]">{x.n}</span>
                    <Price now={x.p} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* the floating pill */}
        <div className="pointer-events-none absolute inset-x-0 top-4 z-20 flex justify-center px-4">
          <div ref={pill} className="pointer-events-auto flex w-full max-w-[860px] items-center justify-between gap-6 rounded-full border border-[var(--sx-line)] bg-[color-mix(in_srgb,var(--sx-surface)_88%,transparent)] py-2 pl-6 pr-2 shadow-[0_18px_40px_-18px_rgba(0,0,0,.45)] backdrop-blur-md">
            <a href="#" onClick={noop} className="text-[18px] font-[750] tracking-[-0.02em]">
              saar<span className="text-[var(--sx-accent)]">.</span>
            </a>
            <div className="hidden items-center gap-7 text-[15px] text-[var(--sx-muted)] md:flex">
              <span className="text-[var(--sx-text)]">Shop</span>
              <span>Rituals</span>
              <span>Ingredients</span>
              <span>Journal</span>
            </div>
            <div className="relative">
              <MagneticButton className="rounded-full bg-[var(--sx-text)] px-5 py-3 text-[14px] font-[650] text-[var(--sx-bg)]">Take the skin quiz</MagneticButton>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── NV17 · Main bar + category row ───────────────────────── */

const NV17_CATS = [
  { t: "New in", picks: [["Block-print kurta", "₹2,890"], ["Linen co-ord", "₹5,400"], ["Kolhapuri flat", "₹1,950"], ["Tussar stole", "₹2,200"]] },
  { t: "Women", picks: [["Mul saree, indigo", "₹6,800"], ["Wrap dress", "₹3,950"], ["Silk camisole", "₹2,450"], ["Juttis, gold", "₹2,100"]] },
  { t: "Men", picks: [["Bandhgala jacket", "₹8,900"], ["Khadi shirt", "₹2,650"], ["Pleated trouser", "₹3,400"], ["Leather sandal", "₹3,150"]] },
  { t: "Linen", picks: [["Overshirt, rust", "₹4,200"], ["Lounge set", "₹4,800"], ["Linen shorts", "₹2,300"], ["Bucket hat", "₹1,250"]] },
  { t: "Footwear", picks: [["Kolhapuri flat", "₹1,950"], ["Woven mule", "₹2,750"], ["Canvas runner", "₹3,600"], ["Juttis, ivory", "₹2,100"]] },
  { t: "Home", picks: [["Dhurrie rug", "₹7,400"], ["Brass lamp", "₹5,900"], ["Kantha throw", "₹3,800"], ["Stoneware set", "₹2,950"]] },
];
const NV17_SEARCH = ["linen shirts", "kolhapuri flats", "block-print kurtas", "brass lamps"];

/** Types the search placeholders one letter at a time, while on screen. */
function useTyping(ref: React.RefObject<HTMLElement | null>, words: string[]) {
  const [s, setS] = useState(words[0]);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let w = 0;
    let c = words[0].length;
    let dir = -1;
    let hold = 0;
    let t: ReturnType<typeof setInterval> | undefined;
    const step = () => {
      if (hold > 0) return void hold--;
      c += dir;
      if (c <= 0) {
        dir = 1;
        w = (w + 1) % words.length;
      } else if (c >= words[w].length) {
        dir = -1;
        hold = 12;
      }
      setS(words[w].slice(0, Math.max(0, c)));
    };
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (e.isIntersecting) t = setInterval(step, 70);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, [ref, words]);
  return s;
}

const Ico = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

/** NV17 · A store header: the main row (logo, a wide search field, account / wishlist / bag) and a full-width second
 *  row of collection links. The active collection steps by itself and its four best-sellers show under the bar. */
function NV17() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const [a, setA] = useAutoCycle(r, NV17_CATS.length, 2000);
  const q = useTyping(r, NV17_SEARCH);
  const cat = NV17_CATS[a];
  return (
    <Sec innerRef={r} theme="paper" font="wide" className="py-[clamp(72px,9vw,140px)]">
      <style>{NV_CSS}</style>
      <div className="grid grid-cols-1 items-end gap-[clamp(24px,4vw,64px)] md:grid-cols-12">
        <H className="text-[clamp(36px,4.6vw,76px)] md:col-span-7">Two rows. Every aisle.</H>
        <P className="max-w-[40ch] md:col-span-5 md:pb-2">The top row is for finding and paying; the row under it is the store map, one collection a click.</P>
      </div>

      <div data-m-card className="mt-[clamp(40px,5vw,72px)] overflow-hidden rounded-[var(--sx-radius)] border border-[var(--sx-line)] bg-[var(--sx-surface)]">
        {/* row 1 */}
        <div className="flex items-center gap-[clamp(16px,3vw,48px)] px-[clamp(18px,2.4vw,36px)] py-5">
          <a href="#" onClick={noop} className="sx-display shrink-0 text-[clamp(22px,1.9vw,30px)] font-[800] tracking-[-0.02em]">
            MAAYA
          </a>
          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-full border border-[var(--sx-line)] bg-[var(--sx-bg)] px-5 py-3 text-[15px]">
            <Ico d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5-2 4 4" />
            <span className="truncate text-[var(--sx-muted)]">
              Search {q}
              <span className="nvb4-caret ml-[1px] inline-block h-[1.05em] w-[2px] translate-y-[3px] bg-[var(--sx-accent)]" />
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-[clamp(14px,1.6vw,24px)]">
            <span className="hidden items-center gap-2 text-[14px] md:flex">
              <Ico d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" /> Account
            </span>
            <span className="hidden items-center gap-2 text-[14px] md:flex">
              <Ico d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" /> Saved
            </span>
            <span className="flex items-center gap-2 rounded-full bg-[var(--sx-text)] px-4 py-2.5 text-[14px] font-[650] text-[var(--sx-bg)]">
              Bag <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[var(--sx-accent)] px-1 text-[12px] text-[var(--sx-accent-text)]">3</span>
            </span>
          </div>
        </div>
        {/* row 2 */}
        <nav aria-label="Collections" className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-y border-[var(--sx-line)] px-[clamp(18px,2.4vw,36px)]">
          <div className="flex flex-wrap gap-x-[clamp(18px,2.6vw,40px)]">
            {NV17_CATS.map((c, k) => (
              <a
                key={c.t}
                href="#"
                onClick={noop}
                onMouseEnter={() => setA(k)}
                className={`relative py-4 text-[15px] font-[600] transition-colors duration-300 ${k === a ? "text-[var(--sx-text)]" : "text-[var(--sx-muted)]"}`}
              >
                {c.t}
                <span className={`absolute inset-x-0 bottom-0 h-[3px] origin-left bg-[var(--sx-accent)] transition-transform duration-500 ${k === a ? "scale-x-100" : "scale-x-0"}`} />
              </a>
            ))}
            <span className="py-4 text-[15px] font-[600] text-[var(--sx-muted)]">Gifts</span>
            <span className="py-4 text-[15px] font-[700] text-[var(--sx-accent)]">Sale –30%</span>
          </div>
          <span className="hidden text-[13px] text-[var(--sx-muted)] md:block">Free delivery over ₹1,999</span>
        </nav>
        {/* the collection under the bar */}
        <div className="grid grid-cols-2 gap-[clamp(12px,1.6vw,24px)] p-[clamp(18px,2.4vw,36px)] md:grid-cols-4">
          {cat.picks.map(([n, p], k) => (
            <div key={`${a}-${k}`} className="nvb4-in" style={{ animationDelay: `${k * 70}ms` }}>
              <div className="relative overflow-hidden rounded-[14px]">
                <div className="fx-drift">
                  <Pic i={(a + k) % 4} ratio="4/5" label="" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between gap-3 text-[15px]">
                <span className="truncate font-[600]">{n}</span>
                <Price now={p} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "NV13", name: "Infinite loop scroll menu", motion: "M12", C: NV13 },
  { code: "NV14", name: "Ruled-cell editorial navbar", motion: "M60", C: NV14 },
  { code: "NV15", name: "Large title that condenses into the bar", motion: "M6", C: NV15 },
  { code: "NV16", name: "Floating pill navbar that hides on scroll", motion: "M71", C: NV16 },
  { code: "NV17", name: "Main bar + category row", motion: "M23", C: NV17 },
];
