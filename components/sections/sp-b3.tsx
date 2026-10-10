"use client";

// SP · Social proof layouts, batch 3 (docs/SECTION-MENU.md). Reviewers and buyers are invented (fake names).
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { Avatar, Btn, H, P, Stars, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Hands-free cycling: steps an index every `ms` while the section is on screen (stops off screen and in ?static=1). */
function useAutoCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms = 2200) {
  const [i, setI] = useState(0);
  const [live, setLive] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    setLive(true);
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
  return [i, setI, live] as const;
}

/* ---------------------------------------------------------------------------------------------------------------- */

const DECK = [
  { name: "Meera Pillai", item: "Rice-water cleanser", q: "Three weeks in and my T-zone finally behaves. It foams like nothing, rinses like silk.", n: 5 },
  { name: "Arjun Bose", item: "Ceramide night balm", q: "I bought it for my wife and quietly stole it. Dry knuckles, gone in four nights.", n: 5 },
  { name: "Sana Qureshi", item: "Niacinamide serum", q: "Pores look smaller in daylight, not just in selfies. The dropper is a joy.", n: 4 },
  { name: "Rohan Das", item: "Mineral SPF 40", q: "No white cast on my skin tone, no sting in the eyes on a run. Reordered twice.", n: 5 },
  { name: "Leela Nair", item: "The Dewline trio", q: "The only routine I have kept past January. Simple, calm, and it smells of nothing.", n: 5 },
];

/** SP10 · Auto-cycling stacked review cards: heading + rating summary left, an offset deck right whose front card
 *  slides to the back every few seconds (also draggable). Motion M40: stacked cards cycling through the deck. */
function SP10() {
  const r = useRef<HTMLDivElement>(null);
  const deck = useRef<HTMLDivElement>(null);
  const [order, setOrder] = useState(() => DECK.map((_, k) => k));
  const [leaving, setLeaving] = useState<number | null>(null);
  const [drag, setDrag] = useState(0);
  const dragging = useRef<{ x0: number; id: number } | null>(null);
  const busy = useRef(false);

  const next = () => {
    if (busy.current) return;
    busy.current = true;
    setLeaving(order[0]);
    setTimeout(() => {
      setOrder((o) => [...o.slice(1), o[0]]);
      setLeaving(null);
      setDrag(0);
      busy.current = false;
    }, 420);
  };
  const nextRef = useRef(next);
  nextRef.current = next;

  // auto-cycle while on screen (paused while a card is held)
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    let t: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (e.isIntersecting) t = setInterval(() => !dragging.current && nextRef.current(), 2200);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, []);

  // entry: the deck is dealt in from below, one card after another, then the copy rises
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const once = { trigger: el, start: "top 75%", toggleActions: "play none none reverse" } as const;
      gsap.from(el.querySelectorAll("[data-sp10-in]"), { y: 160, rotation: (k) => (k % 2 ? 9 : -7), opacity: 0, duration: 1, ease: "power3.out", stagger: { each: 0.09, from: "end" }, scrollTrigger: once });
      gsap.from(el.querySelectorAll("[data-m-head], [data-m-text], [data-sp10-sum]"), { y: 28, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, scrollTrigger: once });
    }, el);
    return () => ctx.revert();
  }, []);

  const down = (e: React.PointerEvent, id: number) => {
    if (id !== order[0]) return;
    dragging.current = { x0: e.clientX, id };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => dragging.current && setDrag(e.clientX - dragging.current.x0);
  const up = () => {
    if (!dragging.current) return;
    dragging.current = null;
    if (Math.abs(drag) > 90) next();
    else setDrag(0);
  };

  const bars = [
    ["5", 86],
    ["4", 10],
    ["3", 3],
    ["2", 1],
  ] as const;

  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <style>{`
        @keyframes sp10-bob { 0%,100% { transform: translateY(0) rotate(0deg) } 50% { transform: translateY(-14px) rotate(-1.2deg) } }
        .sp10-bob { animation: sp10-bob 3.1s ease-in-out infinite; }
        html.is-static .sp10-bob { animation: none; }
        html.is-static { .sp10-bob { animation: none; } }
      `}</style>
      <div className="grid grid-cols-1 items-center gap-[clamp(40px,5vw,88px)] md:grid-cols-12">
        <div className="md:col-span-5">
          <H className="max-w-[11ch] text-[clamp(44px,5.4vw,92px)]">Skin that answers back.</H>
          <P className="mt-6 max-w-[38ch]">Fragrance-free care for Indian weather, judged by the people who wear it every single day.</P>
          <div data-sp10-sum className="mt-10 flex items-end gap-6 border-t border-[var(--sx-line)] pt-8">
            <p className="sx-display text-[clamp(64px,6vw,104px)] font-[700] leading-[0.85] tabular-nums">4.9</p>
            <div className="pb-1">
              <Stars n={5} />
              <p className="mt-1 text-[14px] text-[var(--sx-muted)]">12,480 verified reviews</p>
            </div>
          </div>
          <div data-sp10-sum className="mt-6 max-w-[360px] space-y-2">
            {bars.map(([s, pct]) => (
              <div key={s} className="flex items-center gap-3 text-[13px] text-[var(--sx-muted)]">
                <span className="w-3 tabular-nums">{s}</span>
                <span className="relative h-[6px] flex-1 overflow-hidden rounded-full bg-[var(--sx-line)]">
                  <span className="absolute inset-y-0 left-0 rounded-full bg-[var(--sx-accent)]" style={{ width: `${pct}%` }} />
                </span>
                <span className="w-9 text-right tabular-nums">{pct}%</span>
              </div>
            ))}
          </div>
          <div data-sp10-sum className="mt-9">
            <Btn kind="ghost">Read all reviews</Btn>
          </div>
        </div>

        {/* the deck: side padding so rotated / flying cards never reach the copy column */}
        <div className="relative md:col-span-7 md:pl-[clamp(24px,4vw,64px)]">
          <div className="pointer-events-none absolute inset-0 fx-pan" aria-hidden>
            <div className="fx-drift absolute left-1/2 top-1/2 aspect-square w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_20%,transparent),transparent)]" />
          </div>
          <div className="sp10-bob relative h-[clamp(400px,50vh,500px)]" ref={deck} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
            {order.map((id, d) => {
              const rv = DECK[id];
              const out = leaving === id;
              const front = d === 0;
              const tf = out
                ? `translate(calc(-50% + 70%), -50%) rotate(14deg) scale(.96)`
                : `translate(calc(-50% + ${d * 26 + (front ? drag : 0)}px), calc(-50% - ${d * 22}px)) rotate(${d * 3.2 - 2 + (front ? drag / 30 : 0)}deg) scale(${1 - d * 0.045})`;
              return (
                <div
                  key={id}
                  onPointerDown={(e) => down(e, id)}
                  className={`absolute left-1/2 top-1/2 w-[min(86%,520px)] touch-none select-none ${front ? "cursor-grab active:cursor-grabbing" : ""}`}
                  style={{
                    transform: tf,
                    zIndex: out ? 20 : DECK.length - d,
                    opacity: out ? 0 : d > 3 ? 0 : 1,
                    transition: front && drag !== 0 && leaving === null ? "none" : "transform .6s cubic-bezier(.22,1,.36,1), opacity .45s ease",
                  }}
                >
                  <article data-sp10-in className="sx-card bg-[var(--sx-surface)] p-[clamp(24px,2.6vw,40px)] shadow-[0_30px_60px_-30px_rgba(28,24,19,.4)]">
                    <div className="flex items-center justify-between gap-4">
                      <Stars n={rv.n} />
                      <span className="rounded-full border border-[var(--sx-line)] px-3 py-1 text-[12px] text-[var(--sx-muted)]">Verified buyer</span>
                    </div>
                    <p className="sx-display mt-6 text-[clamp(22px,2vw,32px)] leading-[1.22]">&ldquo;{rv.q}&rdquo;</p>
                    <div className="mt-8 flex items-center gap-3 border-t border-[var(--sx-line)] pt-5">
                      <Avatar name={rv.name} i={id} size={42} />
                      <div className="text-[14px] leading-tight">
                        <b className="font-[650]">{rv.name}</b>
                        <p className="mt-1 text-[var(--sx-muted)]">{rv.item}</p>
                      </div>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ---------------------------------------------------------------------------------------------------------------- */

const ORDERS = [
  { name: "Ananya K.", city: "Pune", item: "Peri-peri makhana", qty: 3 },
  { name: "Vikram S.", city: "Jaipur", item: "Jaggery peanut brittle", qty: 2 },
  { name: "Nisha R.", city: "Kochi", item: "Sea-salt banana chips", qty: 4 },
  { name: "Farhan A.", city: "Lucknow", item: "The Office Crate", qty: 1 },
  { name: "Pooja M.", city: "Indore", item: "Chilli-lime chana", qty: 6 },
  { name: "Dev T.", city: "Bengaluru", item: "Peri-peri makhana", qty: 2 },
  { name: "Ritika B.", city: "Kolkata", item: "Cheese-herb makhana", qty: 3 },
  { name: "Sahil G.", city: "Chandigarh", item: "Movie Night box", qty: 1 },
  { name: "Aisha P.", city: "Hyderabad", item: "Sea-salt banana chips", qty: 5 },
];
const AGO = ["just now", "1m ago", "2m ago", "4m ago", "5m ago", "7m ago", "9m ago"];

/** SP11 · Live order feed: heading, a big "orders today" number and a button left; right, a fixed-height column where
 *  order notifications drop in from the top one by one and push the stack down (bottom fades out). Motion M3. */
function SP11() {
  const r = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M3");
  const [tick] = useAutoCycle(r, 10_000, 1100);
  const feed = Array.from({ length: 7 }, (_, k) => ({ id: tick - k, o: ORDERS[(((tick - k) % ORDERS.length) + ORDERS.length) % ORDERS.length] }));

  // FLIP-lite: when a new card is prepended, the stack starts one card higher and settles down
  useLayoutEffect(() => {
    const l = list.current;
    if (!l || tick === 0 || prefersReducedMotion()) return;
    const first = l.firstElementChild as HTMLElement | null;
    if (!first) return;
    const step = first.offsetHeight + 14;
    gsap.fromTo(l, { y: -step }, { y: 0, duration: 0.75, ease: "power3.out" });
    gsap.fromTo(first, { opacity: 0, scale: 0.94, rotationX: -40 }, { opacity: 1, scale: 1, rotationX: 0, duration: 0.7, ease: "power3.out", transformOrigin: "50% 0%" });
  }, [tick]);

  return (
    <Sec innerRef={r} theme="ink" font="condensed" className="py-[clamp(72px,9vw,140px)]">
      <style>{`
        @keyframes sp11-ping { 0% { transform: scale(1); opacity: .7 } 100% { transform: scale(2.6); opacity: 0 } }
        .sp11-ping { animation: sp11-ping 1.4s ease-out infinite; }
        html.is-static .sp11-ping { animation: none; }
      `}</style>
      <div className="grid grid-cols-1 items-center gap-[clamp(40px,5vw,96px)] md:grid-cols-12">
        <div className="md:col-span-5">
          <H className="max-w-[10ch] text-[clamp(52px,6.4vw,112px)] uppercase">Somebody is snacking.</H>
          <P className="mt-6 max-w-[36ch]">Roasted, never fried. Small batches leave our Nashik kitchen every morning and land across India in two days.</P>
          <div className="mt-10 border-t border-[var(--sx-line)] pt-8">
            <p className="flex items-center gap-3 text-[13px] uppercase tracking-[0.16em] text-[var(--sx-muted)]">
              <span className="relative inline-flex h-2.5 w-2.5">
                <span className="sp11-ping absolute inset-0 rounded-full bg-[var(--sx-accent)]" />
                <span className="relative h-2.5 w-2.5 rounded-full bg-[var(--sx-accent)]" />
              </span>
              Live today
            </p>
            <p className="sx-display mt-3 text-[clamp(72px,8vw,136px)] font-[800] leading-[0.85] tabular-nums">
              <span data-m-num>2,184</span>
            </p>
            <p className="mt-2 text-[17px] text-[var(--sx-muted)]">orders since midnight</p>
          </div>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Btn>Order a crate · ₹649</Btn>
            <Btn kind="link">See all flavours →</Btn>
          </div>
        </div>

        <div className="relative md:col-span-7">
          <div className="pointer-events-none absolute inset-0 fx-pan" aria-hidden>
            <div className="fx-drift absolute left-[10%] top-[6%] aspect-square w-[70%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_24%,transparent),transparent)]" />
          </div>
          <div
            className="relative mx-auto h-[clamp(460px,60vh,580px)] max-w-[560px] overflow-hidden [perspective:900px]"
            style={{ maskImage: "linear-gradient(180deg, #000 62%, transparent)", WebkitMaskImage: "linear-gradient(180deg, #000 62%, transparent)" }}
          >
            <div ref={list} className="flex flex-col gap-[14px] pt-2">
              {feed.map(({ id, o }, k) => (
                <div key={id} data-m-card className="sx-card flex items-center gap-4 bg-[color-mix(in_srgb,var(--sx-surface)_88%,transparent)] px-5 py-4 backdrop-blur-md">
                  <Avatar name={o.name} i={((id % 5) + 5) % 5} size={46} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px]">
                      <b className="font-[650]">{o.name}</b> <span className="text-[var(--sx-muted)]">in {o.city}</span>
                    </p>
                    <p className="mt-0.5 truncate text-[14px] text-[var(--sx-muted)]">
                      ordered {o.qty} × {o.item}
                    </p>
                  </div>
                  <span className={`shrink-0 text-[13px] tabular-nums ${k === 0 ? "text-[var(--sx-accent)]" : "text-[var(--sx-muted)]"}`}>{AGO[k]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ---------------------------------------------------------------------------------------------------------------- */

const CLOUD = [
  { q: "Tastes like the first rain on a tin roof.", who: "Kavya, Mysuru" },
  { q: "I have stopped adding sugar.", who: "Imran, Delhi" },
  { q: "The smoked oolong is a whole evening in a cup.", who: "Tara, Shillong" },
  { q: "My grandmother asked where I found it.", who: "Rahul, Kolkata" },
  { q: "Second steep is better than the first.", who: "Zoya, Mumbai" },
  { q: "The tin lives on my desk now.", who: "Nikhil, Pune" },
  { q: "Clean, bright, a little like peaches.", who: "Anjali, Siliguri" },
  { q: "Finally a green tea that is not bitter.", who: "Omar, Chennai" },
  { q: "I drink it slowly on purpose.", who: "Isha, Goa" },
  { q: "Every parcel smells like a garden.", who: "Varun, Ooty" },
];

/** SP12 · Quote cloud with focus blur: ten short quotes run together as one wide paragraph; all are blurred and dim
 *  except one that sharpens in turn (auto-cycling). Motion M6: heading words rise from blur, the cloud rises after. */
function SP12() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M6");
  const [i, setI, live] = useAutoCycle(r, CLOUD.length, 1200);
  return (
    <Sec innerRef={r} theme="stone" font="editorial" className="py-[clamp(72px,9vw,140px)]">
      <div className="pointer-events-none absolute inset-0 fx-pan" aria-hidden>
        <div className="fx-drift absolute -left-[10%] top-[20%] aspect-square w-[55vw] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_16%,transparent),transparent)]" />
      </div>
      <div className="relative flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[12ch] text-[clamp(40px,4.6vw,76px)]">Said over a second cup.</H>
        <P className="max-w-[34ch] pb-2">Single-estate teas from Darjeeling, Assam and the Nilgiris, and what our drinkers wrote back.</P>
      </div>

      <p data-m-card className="sx-display relative mt-[clamp(40px,5vw,80px)] max-w-[1240px] text-[clamp(26px,2.7vw,44px)] leading-[1.32] tracking-[-0.01em]">
        {CLOUD.map((c, k) => {
          const on = !live || k === i;
          return (
            <span
              key={k}
              onPointerEnter={() => setI(k)}
              className="cursor-default"
              style={{ filter: on ? "blur(0px)" : "blur(4px)", opacity: on ? 1 : 0.32, transition: "filter 1s ease, opacity 1s ease, color 1s ease", color: live && on ? "var(--sx-accent)" : undefined }}
            >
              &ldquo;{c.q}&rdquo;
              <sup className="ml-1 align-super font-sans text-[13px] tracking-normal text-[var(--sx-muted)]">{c.who}</sup>{" "}
            </span>
          );
        })}
      </p>

      <div className="relative mt-[clamp(40px,5vw,72px)] flex flex-wrap items-center justify-between gap-6 border-t border-[var(--sx-line)] pt-8">
        <p className="flex items-center gap-3 text-[15px]">
          <Stars n={5} /> <span className="text-[var(--sx-muted)]">4.9 from 3,600 tasting notes</span>
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-[15px] text-[var(--sx-muted)]">First flush, 100 g from ₹540</span>
          <Btn>Shop the first flush</Btn>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "SP10", name: "Auto-cycling stacked review cards", motion: "M40", C: SP10 },
  { code: "SP11", name: "Live order feed", motion: "M3", C: SP11 },
  { code: "SP12", name: "Quote cloud with focus blur", motion: "M6", C: SP12 },
];
