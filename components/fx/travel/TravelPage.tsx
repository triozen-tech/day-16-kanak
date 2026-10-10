"use client";

// A fake 6-section product page for the travelling-object demos (/lab/travel/<version>). ONE object travels through
// Hero → Story → Detail → Ingredients → Shop → Closing. The page is the same for every version; the version only
// draws the object (`Layer`). Text always sits on the side opposite the anchor; on phones the anchors sit above the
// text (a simple up/down path) and the object stays fully on screen.
import { useEffect, useRef, useState } from "react";
import { gsap, isRecording, loadPlugin, prefersReducedMotion } from "@/lib/gsap";
import { useTicker, useScrub } from "../shared";
import { BendMarquee } from "../text";
import { ingredient, productAngle } from "./art";

export type LayerProps = { page: React.RefObject<HTMLDivElement | null> };

/** F7 · Floating ingredients: 8 cut-outs at 3 depths around the product, idle bob + scroll parallax (deeper = slower). */
export function FloatingIngredients({ count = 8 }: { count?: number }) {
  const root = useRef<HTMLDivElement>(null);
  const scroll = useRef(0);
  useScrub(root, (p) => (scroll.current = p), { finalValue: 0.5 });
  const items = Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 + 0.4;
    const depth = [0.45, 0.75, 1.1][i % 3]; // size + parallax + blur by depth
    return { i, x: 50 + Math.cos(a) * 36, y: 50 + Math.sin(a) * 34, depth, ph: i * 1.7 };
  });
  useTicker(root, (t) => {
    const els = root.current!.children as HTMLCollectionOf<HTMLElement>;
    items.forEach((it, k) => {
      const bob = Math.sin(t * (0.9 + it.depth * 0.4) + it.ph) * 14 * it.depth;
      const par = (scroll.current - 0.5) * -260 * it.depth;
      els[k].style.transform = `translate(-50%, -50%) translateY(${(bob + par).toFixed(1)}px) rotate(${(Math.sin(t * 0.6 + it.ph) * 18).toFixed(1)}deg) scale(${it.depth})`;
    });
  });
  return (
    <div ref={root} className="pointer-events-none absolute inset-0" aria-hidden>
      {items.map((it) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={it.i}
          src={ingredient(it.i)}
          alt=""
          className="absolute h-[clamp(44px,7vw,110px)] w-[clamp(44px,7vw,110px)]"
          style={{ left: `${it.x}%`, top: `${it.y}%`, filter: it.depth < 0.6 ? "blur(2px) brightness(.8)" : it.depth > 1 ? "drop-shadow(0 18px 18px rgba(0,0,0,.45))" : "none", zIndex: it.depth > 1 ? 7 : 3 }}
        />
      ))}
    </div>
  );
}

/** F8 · Land in UI: a copy of the product flies from the card into the cart pill (Flip.fit), the count bumps. */
async function flyToCart(from: HTMLElement, cart: HTMLElement, onLand: () => void) {
  const Flip = await loadPlugin("Flip");
  const r = from.getBoundingClientRect();
  const clone = document.createElement("img");
  clone.src = productAngle(1);
  Object.assign(clone.style, { position: "fixed", left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, zIndex: "80", objectFit: "contain", pointerEvents: "none" });
  document.body.appendChild(clone);
  const tl = gsap.timeline({ onComplete: () => (clone.remove(), onLand()) });
  // arc: up first, then down into the pill, shrinking (Flip.fit does the fitting to the target box)
  tl.to(clone, { y: -60, duration: 0.25, ease: "power2.out" });
  tl.add(Flip.fit(clone, cart, { duration: 0.75, ease: "power3.in", scale: true, absolute: true }) as gsap.core.Tween);
  tl.to(clone, { opacity: 0, duration: 0.15 }, "-=0.12");
}

const SECTION = "relative flex min-h-[100svh] items-center px-[clamp(20px,5vw,80px)] max-md:flex-col max-md:justify-start max-md:pt-[72px]";

export default function TravelPage({ title, Layer, note }: { title: string; note: string; Layer: (p: LayerProps) => React.ReactNode }) {
  const page = useRef<HTMLDivElement>(null);
  const cart = useRef<HTMLSpanElement>(null);
  const [count, setCount] = useState(0);
  const added = useRef(false);

  const addToCart = (btn: HTMLElement | null) => {
    const card = btn?.closest("article")?.querySelector<HTMLElement>(".tp-card-img");
    if (!card || !cart.current) return;
    flyToCart(card, cart.current, () => {
      setCount((n) => n + 1);
      gsap.fromTo(cart.current, { scale: 1.35 }, { scale: 1, duration: 0.6, ease: "expo.out" });
    });
  };
  // hands-free (record mode): the first card is added once when the shop is on screen
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const shop = page.current!.querySelector("#tp-shop")!;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || added.current || !isRecording()) return;
        added.current = true;
        window.setTimeout(() => addToCart(shop.querySelector<HTMLElement>("button")), 900);
      },
      { threshold: 0.6 },
    );
    io.observe(shop);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={page} className="tp relative overflow-x-clip bg-[#05080f] text-[#eaf5ff]">
      <header className="fixed inset-x-0 top-0 z-40 flex h-[60px] items-center justify-between px-[clamp(20px,5vw,80px)] backdrop-blur-sm">
        <span className="font-display text-[22px] font-[900] tracking-[0.1em]">BRAND</span>
        <span className="label hidden text-white/60 md:block">{title}</span>
        <span ref={cart} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-[14px]">
          Cart <b className="grid h-5 min-w-5 place-items-center rounded-full bg-[var(--accent,#2f8cff)] px-1 text-[12px] text-[#05080f]">{count}</b>
        </span>
      </header>

      {/* the object layer: absolutely positioned over the whole page (page coordinates), above sections, under the nav */}
      <div className="pointer-events-none absolute inset-0 z-20">{Layer({ page })}</div>

      <section data-travel-section className={SECTION} data-record-time="0.6" data-record-label="Hero">
        {/* CSS-only light: moves from the first paint, before the 3D model has loaded */}
        <div className="lab-glow pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative z-30 w-[48%] max-md:order-2 max-md:mt-4 max-md:w-full">
          <p className="label text-[var(--accent,#2f8cff)]">{note}</p>
          <h1 className="font-display mt-3 text-[clamp(52px,8vw,128px)] font-[900] leading-[0.88]">Cold. Bright. Yours.</h1>
          <p className="mt-4 max-w-[36ch] text-white/70">One product travels with you through the whole page.</p>
        </div>
        <div data-anchor data-turn="0" className="ml-auto h-[66vh] w-[min(30vw,420px)] max-md:order-1 max-md:mx-auto max-md:ml-auto max-md:h-[40svh] max-md:w-[46vw]" />
      </section>

      <section data-travel-section className={SECTION} data-record-time="2.4" data-record-align="center" data-record-label="Story">
        <div data-anchor data-rot="-10" data-turn="0.25" data-tilt="8" className="h-[56vh] w-[min(26vw,360px)] max-md:mx-auto max-md:h-[36svh] max-md:w-[40vw]" />
        <div className="relative z-30 ml-auto w-[46%] max-md:mt-6 max-md:w-full">
          <p className="label text-white/50">01 · Story</p>
          <h2 className="font-display mt-3 text-[clamp(40px,5.5vw,88px)] font-[900] leading-[0.9]">Brewed cold for twelve hours.</h2>
          <p className="mt-4 max-w-[38ch] text-white/70">Text sits on the side opposite the object, so it is never covered.</p>
        </div>
      </section>

      <section data-travel-section className={SECTION} data-record-time="2.4" data-record-align="center" data-record-label="Detail">
        <div className="relative z-30 w-[44%] max-md:order-2 max-md:mt-6 max-md:w-full">
          <p className="label text-white/50">02 · Detail</p>
          <h2 className="font-display mt-3 text-[clamp(40px,5.5vw,88px)] font-[900] leading-[0.9]">Turned to the side.</h2>
          <ul className="mt-5 grid grid-cols-3 gap-4 text-[15px] text-white/75">
            <li><b className="font-display block text-[34px] text-white">330</b>ml</li>
            <li><b className="font-display block text-[34px] text-white">0</b>sugar</li>
            <li><b className="font-display block text-[34px] text-white">80</b>mg</li>
          </ul>
        </div>
        <div data-anchor data-rot="8" data-turn="0.5" data-spin="1" data-tilt="-6" className="ml-auto h-[58vh] w-[min(24vw,330px)] max-md:order-1 max-md:mx-auto max-md:h-[36svh] max-md:w-[38vw]" />
      </section>

      <section data-travel-section className={`${SECTION} justify-center`} data-record-time="2.4" data-record-align="center" data-record-label="Ingredients">
        <div className="absolute inset-0 max-md:inset-y-[60px]">
          <FloatingIngredients />
        </div>
        <div className="relative z-30 w-full text-center">
          <p className="label text-white/50">03 · Ingredients</p>
          <div data-anchor data-turn="1" className="mx-auto my-[3vh] h-[50vh] w-[min(20vw,270px)] max-md:h-[32svh] max-md:w-[34vw]" />
          <h2 className="font-display text-[clamp(36px,4.5vw,72px)] font-[900] leading-[0.9]">Citrus, berry, ice.</h2>
        </div>
      </section>

      <section id="tp-shop" data-travel-section className={`${SECTION} flex-col justify-center`} data-record-time="2.4" data-record-align="center" data-record-label="Shop">
        <h2 className="font-display relative z-30 mb-8 w-full text-[clamp(36px,4.5vw,72px)] font-[900] leading-[0.9] max-md:mb-4">Shop the range</h2>
        <div className="grid w-full grid-cols-3 gap-[2vw] max-md:grid-cols-1 max-md:gap-3">
          {["Original", "Citrus", "Berry"].map((n, i) => (
            <article key={n} className="relative rounded-[20px] border border-white/10 bg-white/[0.04] p-5 max-md:flex max-md:items-center max-md:gap-4 max-md:p-3">
              {/* the first card's image slot is the object's anchor: it lands IN the card */}
              <div className="tp-card-img relative h-[34vh] max-md:h-[90px] max-md:w-[60px] max-md:shrink-0" {...(i === 0 ? { "data-anchor": "", "data-turn": "1" } : {})}>
                {i > 0 && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={productAngle(i === 1 ? 1 : 3, i === 1 ? "#ffd34d" : "#e0315b")} alt="" className="h-full w-full object-contain" />
                )}
              </div>
              <div className="mt-4 flex items-center justify-between max-md:mt-0 max-md:flex-1">
                <div>
                  <p className="font-display text-[26px] font-[800]">{n}</p>
                  <p className="text-[14px] text-white/60">₹149</p>
                </div>
                <button type="button" onClick={(e) => addToCart(e.currentTarget)} className="relative z-30 rounded-full bg-[var(--accent,#2f8cff)] px-4 py-2 text-[14px] font-[650] text-[#05080f]">
                  Add
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section data-travel-section className={`${SECTION} justify-center text-center`} data-record-time="2.4" data-record-align="center" data-record-label="Closing">
        <div className="relative z-30 w-full">
          <div data-anchor data-turn="1" data-spin="1" className="mx-auto h-[52vh] w-[min(22vw,300px)] max-md:h-[42svh] max-md:w-[42vw]" />
          <h2 className="font-display mt-6 text-[clamp(44px,6vw,96px)] font-[900] leading-[0.9]">Stay bright.</h2>
        </div>
        {/* a slow word row under the closing: the page never rests still at the end of the reel */}
        <BendMarquee words={["Cold", "Bright", "Yours", "Brand"]} className="absolute inset-x-0 bottom-[3vh] text-[clamp(36px,5vw,72px)] font-[900] text-white/10" />
      </section>
      <div className="h-[20vh]" data-record-time="1.2" data-record-align="bottom" data-record-label="End" />
    </div>
  );
}

/** Soft shadow + glow that follow the object (drawn by every version under its object). */
export function ShadowGlow({ refEl }: { refEl: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div ref={refEl} className="absolute left-0 top-0 will-change-transform">
      <div className="absolute inset-[-30%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--accent,#2f8cff)_35%,transparent),transparent)]" />
      <div className="absolute bottom-[-6%] left-1/2 h-[8%] w-[70%] -translate-x-1/2 rounded-[50%] bg-black/60 blur-[14px]" />
    </div>
  );
}
