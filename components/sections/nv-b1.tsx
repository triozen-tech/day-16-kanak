"use client";

// NV · Navigation layouts, batch 1 (docs/SECTION-MENU.md). Each is shown as a full designed section in its "open" state,
// so the gallery shows the whole idea; on a site the panel/dock is fixed and opened by the burger.
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { scene, useScrub, useTicker } from "../fx/shared";
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

/** NV01 · Numbered full-screen menu: 7/5 split, ten big numbered links left, one tall photo right that swaps to the
 *  active link; contact strip at the bottom, BOOK NOW pinned top-right. Links step by themselves (hands-free). */
function NV01() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const links = [
    { t: "Stay", i: 1, c: "Twenty-two water villas" },
    { t: "Villas", i: 3, c: "Sunset reef villa" },
    { t: "Dine", i: 2, c: "The salt kitchen" },
    { t: "Spa", i: 0, c: "Coral spa pavilion" },
    { t: "Dive", i: 1, c: "House reef, 40 m out" },
    { t: "Journeys", i: 3, c: "Sandbank picnics" },
    { t: "Weddings", i: 2, c: "Barefoot ceremonies" },
    { t: "Offers", i: 0, c: "Stay 5, pay 4" },
    { t: "Journal", i: 1, c: "Notes from the lagoon" },
    { t: "Contact", i: 3, c: "Reservations desk" },
  ];
  const [a, setA] = useAutoCycle(r, links.length, 2000);
  return (
    <Sec innerRef={r} theme="paper" font="editorial" className="py-[clamp(28px,3vw,44px)]">
      <style>{`
        .nv01-photo img { animation: nv01-pan 8s ease-in-out infinite alternate; }
        @keyframes nv01-pan { from { transform: scale(1.04) translate(-1.5%, 0); } to { transform: scale(1.12) translate(1.5%, -1.5%); } }
        html.is-static .nv01-photo img { animation: none; }
        html.is-static { .nv01-photo img { animation: none; } }
      `}</style>
      {/* top bar of the open panel */}
      <div className="flex items-center justify-between border-b border-[var(--sx-line)] pb-5">
        <p className="sx-display text-[clamp(22px,1.8vw,28px)] italic leading-none">Saltmarsh Atoll</p>
        <div className="flex items-center gap-[clamp(16px,2vw,32px)]">
          <span className="flex items-center gap-3 text-[14px] font-[600] uppercase tracking-[0.14em]">
            Close
            <span className="relative block h-4 w-4" aria-hidden>
              <span className="absolute left-0 top-1/2 h-px w-4 rotate-45 bg-current" />
              <span className="absolute left-0 top-1/2 h-px w-4 -rotate-45 bg-current" />
            </span>
          </span>
          <Btn className="uppercase tracking-[0.12em]">Book now</Btn>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-[clamp(28px,4vw,72px)] pt-[clamp(28px,3vw,48px)] md:grid-cols-12">
        <nav className="md:col-span-7" aria-label="Main">
          <ul>
            {links.map((l, k) => (
              <li key={l.t}>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  onMouseEnter={() => setA(k)}
                  className={`group flex items-baseline gap-[clamp(14px,1.6vw,24px)] py-[0.08em] transition-[color,transform] duration-500 ${k === a ? "translate-x-[clamp(8px,1.2vw,20px)] text-[var(--sx-accent)]" : "text-[var(--sx-text)]"}`}
                >
                  <span className="w-[2.2em] shrink-0 text-[13px] tabular-nums tracking-[0.1em] text-[var(--sx-muted)]">{String(k + 1).padStart(2, "0")}</span>
                  <span data-m-head className="sx-display text-[clamp(30px,3.5vw,58px)] leading-[1.02] tracking-[-0.01em]">
                    {l.t}
                  </span>
                  <span className={`ml-auto hidden text-[14px] text-[var(--sx-muted)] transition-opacity duration-500 md:block ${k === a ? "opacity-100" : "opacity-0"}`}>{l.c}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="md:col-span-5">
          <div className="nv01-photo relative overflow-hidden rounded-[var(--sx-radius)]" style={{ aspectRatio: "3/4" }}>
            {links.map((l, k) => (
              <div key={l.t} className={`absolute inset-0 transition-opacity duration-700 ${k === a ? "opacity-100" : "opacity-0"}`}>
                <Pic i={l.i} ratio="auto" round={false} className="absolute inset-0 h-full w-full" />
              </div>
            ))}
            <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(20,16,12,.65))] p-[clamp(18px,2vw,28px)] text-white">
              <p className="text-[12px] uppercase tracking-[0.16em] text-white/70">{String(a + 1).padStart(2, "0")} / {links[a].t}</p>
              <p className="sx-display mt-1 text-[clamp(22px,2vw,32px)] leading-tight">{links[a].c}</p>
            </div>
          </div>
        </div>
      </div>

      {/* contact strip */}
      <div className="mt-[clamp(28px,3vw,48px)] flex flex-wrap items-center justify-between gap-x-10 gap-y-3 border-t border-[var(--sx-line)] pt-5 text-[14px] text-[var(--sx-muted)]">
        <span>stay@saltmarsh-atoll.example</span>
        <span>WhatsApp concierge, 24 hours</span>
        <span className="flex gap-6 text-[var(--sx-text)]">
          <a href="#" onClick={(e) => e.preventDefault()}>Instagram</a>
          <a href="#" onClick={(e) => e.preventDefault()}>Journal</a>
          <a href="#" onClick={(e) => e.preventDefault()}>Press</a>
        </span>
      </div>
    </Sec>
  );
}

/** One marquee row for NV02: the word repeated between small round pictures; drifts forever and bends with scroll
 *  speed (M44 logic, with images between the words). */
function BendRow({ word, pics }: { word: string; pics: number[] }) {
  const root = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const vel = useRef(0);
  const smooth = useRef(0);
  const x = useRef(0);
  useScrub(root, (_, v) => (vel.current = v), { finalValue: 0 });
  useTicker(root, (_, dt) => {
    smooth.current += (vel.current - smooth.current) * 0.08;
    vel.current *= 0.92;
    const items = row.current!.children as HTMLCollectionOf<HTMLElement>;
    const half = row.current!.scrollWidth / 2;
    x.current = (x.current - dt * (110 + Math.abs(smooth.current) * 600)) % half;
    const w = root.current!.clientWidth;
    for (const it of items) {
      const n = Math.min(1, Math.max(0, (it.offsetLeft + x.current + it.offsetWidth / 2) / w));
      const y = Math.sin(n * Math.PI) * (smooth.current * 60) + Math.sin(n * Math.PI * 2 + performance.now() / 900) * 4;
      it.style.transform = `translate3d(${x.current}px, ${y}px, 0)`;
    }
  });
  const unit = [0, 1, 2, 3].flatMap((k) => [
    { kind: "w" as const, k },
    { kind: "p" as const, k },
  ]);
  const list = [...unit, ...unit];
  return (
    <div ref={root} className="absolute inset-0 flex items-center overflow-hidden">
      <div ref={row} className="flex w-max items-center gap-[0.35em] whitespace-nowrap">
        {list.map((u, k) =>
          u.kind === "w" ? (
            <span key={k} className="sx-display inline-block text-[clamp(56px,7vw,112px)] font-[800] uppercase leading-none will-change-transform">
              {word}
            </span>
          ) : (
            <span
              key={k}
              className="inline-block h-[clamp(52px,5.4vw,84px)] w-[clamp(52px,5.4vw,84px)] shrink-0 rounded-full bg-cover bg-center will-change-transform"
              style={{ backgroundImage: `url("${scene(pics[u.k % pics.length], 300, 300, "")}")` }}
            />
          ),
        )}
      </div>
    </div>
  );
}

/** NV02 · Marquee row menu: full-screen overlay of five huge hairline rows; the active row turns into a marquee of its
 *  word between round pictures. Rows step by themselves; hover takes over. */
function NV02() {
  const r = useRef<HTMLDivElement>(null);
  const rows = [
    { t: "Drops", n: "Friday 7 pm", pics: [3, 1] },
    { t: "Sneakers", n: "48 styles", pics: [1, 2] },
    { t: "Apparel", n: "120 pieces", pics: [2, 0] },
    { t: "Sound", n: "Mixtapes", pics: [0, 3] },
    { t: "Archive", n: "Since 2016", pics: [3, 2] },
  ];
  const [a, setA] = useAutoCycle(r, rows.length, 2000);
  return (
    <Sec innerRef={r} theme="ink" font="condensed" full className="py-[clamp(28px,3vw,44px)]">
      <div className="flex items-center justify-between px-[clamp(20px,5vw,96px)] pb-[clamp(20px,2.4vw,36px)]">
        <p className="sx-display text-[clamp(24px,2vw,32px)] font-[800] uppercase tracking-[0.04em]">Knotwork</p>
        <div className="flex items-center gap-8 text-[14px] font-[600] uppercase tracking-[0.14em]">
          <span className="text-[var(--sx-muted)]">Bag (2)</span>
          <span>Close ✕</span>
        </div>
      </div>
      <nav aria-label="Main" className="border-t border-[var(--sx-line)]">
        {rows.map((row, k) => (
          <a
            key={row.t}
            href="#"
            onClick={(e) => e.preventDefault()}
            onMouseEnter={() => setA(k)}
            className={`relative flex items-center justify-between overflow-hidden border-b border-[var(--sx-line)] px-[clamp(20px,5vw,96px)] transition-colors duration-500 ${k === a ? "bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : ""}`}
          >
            <span className={`sx-display py-[0.06em] text-[clamp(56px,7vw,112px)] font-[800] uppercase leading-[1.04] transition-opacity duration-300 ${k === a ? "opacity-0" : "opacity-100"}`}>{row.t}</span>
            <span className={`text-[14px] uppercase tracking-[0.14em] text-[var(--sx-muted)] transition-opacity duration-300 ${k === a ? "opacity-0" : "opacity-100"}`}>{row.n}</span>
            <div className={`transition-opacity duration-500 ${k === a ? "opacity-100" : "opacity-0"}`}>
              <BendRow word={row.t} pics={row.pics} />
            </div>
          </a>
        ))}
      </nav>
      <div className="flex flex-wrap items-center justify-between gap-4 px-[clamp(20px,5vw,96px)] pt-[clamp(20px,2.4vw,32px)] text-[14px] text-[var(--sx-muted)]">
        <span>Free shipping over ₹4,999 · 14-day returns</span>
        <span className="flex gap-6 uppercase tracking-[0.12em] text-[var(--sx-text)]">
          <a href="#" onClick={(e) => e.preventDefault()}>Instagram</a>
          <a href="#" onClick={(e) => e.preventDefault()}>Radio</a>
          <a href="#" onClick={(e) => e.preventDefault()}>Stores</a>
        </span>
      </div>
    </Sec>
  );
}

const DOCK_ICONS: Record<string, React.ReactNode> = {
  Home: <path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z" />,
  Shop: <path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2" />,
  Rituals: <path d="M12 3c3 4 5 7 5 10a5 5 0 0 1-10 0c0-3 2-6 5-10z" />,
  Journal: <path d="M6 4h10l2 2v14H6zM9 9h6M9 13h6M9 17h4" />,
  Account: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" />,
};

/** NV03 · Floating bottom dock: no top bar; a centred pill dock 24 px above the bottom with icon+label items and a
 *  magnetic CTA at its end. The item under the (virtual) pointer magnifies like a desktop dock. */
function NV03() {
  const dock = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLSpanElement | null)[]>([]);
  const ptr = useRef<{ x: number; at: number } | null>(null);
  const names = Object.keys(DOCK_ICONS);
  const [active, setActive] = useState(1);
  const last = useRef(1);
  useTicker(dock, (t) => {
    const d = dock.current!;
    const box = d.getBoundingClientRect();
    const live = ptr.current && performance.now() - ptr.current.at < 1200;
    // virtual pointer glides slowly along the icons when nobody is pointing
    const first = items.current[0]!.getBoundingClientRect();
    const lastEl = items.current[names.length - 1]!.getBoundingClientRect();
    const span = lastEl.left + lastEl.width / 2 - (first.left + first.width / 2);
    const vx = live ? ptr.current!.x : first.left + first.width / 2 - box.left + span * (0.5 + 0.5 * Math.sin(t * 0.9));
    let best = 0;
    let bestD = Infinity;
    items.current.forEach((it, k) => {
      if (!it) return;
      const r = it.getBoundingClientRect();
      const dist = Math.abs(r.left + r.width / 2 - box.left - vx);
      const s = 1 + 0.55 * Math.max(0, 1 - dist / 150);
      it.style.width = it.style.height = `${(48 * s).toFixed(1)}px`;
      if (dist < bestD) {
        bestD = dist;
        best = k;
      }
    });
    if (best !== last.current) {
      last.current = best;
      setActive(best);
    }
  });
  return (
    <Sec theme="stone" font="grotesk" full style={{ ["--accent" as string]: "color-mix(in srgb, var(--sx-accent) 30%, white)" }}>
      <style>{`
        .nv03-bg img { animation: nv03-drift 9s ease-in-out infinite alternate; }
        @keyframes nv03-drift { from { transform: scale(1.02); } to { transform: scale(1.1) translate(-2%, -1%); } }
        html.is-static .nv03-bg img { animation: none; }
        html.is-static { .nv03-bg img { animation: none; } }
      `}</style>
      <div className="relative min-h-[clamp(620px,100svh,940px)]">
        <div className="nv03-bg absolute inset-y-0 right-0 w-full md:w-[52%]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_55%_45%,color-mix(in_srgb,var(--sx-accent)_45%,#0b1020),#070a12_75%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--sx-bg),transparent_40%)] max-md:bg-[color-mix(in_srgb,var(--sx-bg)_70%,transparent)]" />
        </div>
        <div className="relative grid min-h-[inherit] grid-cols-1 items-center px-[clamp(20px,5vw,96px)] pb-[140px] pt-[clamp(72px,9vw,140px)] md:grid-cols-12">
          <div className="md:col-span-6">
            <H className="max-w-[12ch] text-[clamp(48px,6.4vw,108px)]">Skin, on its own schedule.</H>
            <P className="mt-6 max-w-[40ch]">A three-step night ritual with niacinamide and rice water. Refills every 60 days, skip any month.</P>
            <p className="mt-8 text-[15px] text-[var(--sx-muted)]">
              Ritual set <Price now="₹1,240" was="₹1,580" className="ml-2 text-[var(--sx-text)]" />
            </p>
          </div>
          <div className="relative hidden place-items-center md:col-span-6 md:grid">
            <Product angle={2} accent="#c98f6b" className="relative h-[min(56vh,500px)] w-auto drop-shadow-[0_40px_60px_rgba(0,0,0,.25)]" />
          </div>
        </div>

        {/* the dock */}
        <div className="absolute inset-x-0 bottom-6 z-10 flex justify-center px-4">
          <div
            ref={dock}
            onPointerMove={(e) => (ptr.current = { x: e.clientX - e.currentTarget.getBoundingClientRect().left, at: performance.now() })}
            className="flex items-end gap-[clamp(6px,0.8vw,12px)] rounded-full border border-[var(--sx-line)] bg-[color-mix(in_srgb,var(--sx-surface)_78%,transparent)] py-3 pl-5 pr-3 shadow-[0_24px_60px_-24px_rgba(17,20,24,.35)] backdrop-blur-xl"
          >
            {names.map((n, k) => (
              <a key={n} href="#" onClick={(e) => e.preventDefault()} className="flex flex-col items-center gap-1">
                <span
                  ref={(el) => {
                    items.current[k] = el;
                  }}
                  className={`grid h-12 w-12 place-items-center rounded-full border transition-colors duration-300 ${k === active ? "border-transparent bg-[var(--sx-text)] text-[var(--sx-bg)]" : "border-[var(--sx-line)] bg-[var(--sx-surface)] text-[var(--sx-text)]"}`}
                >
                  <svg viewBox="0 0 24 24" className="h-[46%] w-[46%]" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" aria-hidden>
                    {DOCK_ICONS[n]}
                  </svg>
                </span>
                <span className={`text-[12px] font-[600] transition-colors ${k === active ? "text-[var(--sx-text)]" : "text-[var(--sx-muted)]"}`}>{n}</span>
              </a>
            ))}
            <span className="mx-2 h-8 w-px self-center bg-[var(--sx-line)]" aria-hidden />
            <div className="self-center">
              <MagneticButton className="whitespace-nowrap text-[15px]">Start the ritual →</MagneticButton>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "NV01", name: "Numbered full-screen menu with image swap", motion: "M23", C: NV01 },
  { code: "NV02", name: "Marquee row menu", motion: "M44", C: NV02 },
  { code: "NV03", name: "Floating bottom dock with CTA", motion: "M71", C: NV03 },
];
