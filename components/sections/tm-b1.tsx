"use client";

// TM · Team layouts, batch 1 (docs/SECTION-MENU.md). People are invented (fake names, placeholder portraits).
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { useTicker } from "../fx/shared";
import { Btn, H, P, Pic, Sec } from "./kit";
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

/** TM01 · Staggered portraits + synced list: 7/12 three staggered columns of grayscale portraits that drift with the
 *  scroll, 5/12 the names; the active person (auto-stepping, or hovered on either side) turns to colour on both. */
function TM01() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M32");
  const team = [
    { n: "Ira Menon", role: "Head chef", i: 0 },
    { n: "Kabir Shah", role: "Sous chef, fire", i: 1 },
    { n: "Tara Joseph", role: "Pastry", i: 2 },
    { n: "Aman Rao", role: "Bar & ferments", i: 3 },
    { n: "Leela Pillai", role: "Front of house", i: 1 },
    { n: "Dev Kapoor", role: "Sommelier", i: 2 },
    { n: "Noor Siddiqui", role: "Bread & mill", i: 0 },
    { n: "Rohan Das", role: "Forager", i: 3 },
  ];
  const [a, setA] = useAutoCycle(r, team.length, 1800);
  const cols = [
    [0, 3, 6],
    [1, 4, 7],
    [2, 5],
  ];
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <style>{`
        .tm01 [data-m-img] img { animation: tm01-kb 7s ease-in-out infinite alternate; }
        @keyframes tm01-kb { from { transform: scale(1.02); } to { transform: scale(1.12) translate(-2%, -2%); } }
        html.is-static .tm01 [data-m-img] img { animation: none; }
        html.is-static { .tm01 [data-m-img] img { animation: none; } }
      `}</style>
      <div className="tm01 grid grid-cols-1 gap-[clamp(40px,5vw,96px)] md:grid-cols-12">
        <div className="grid grid-cols-3 gap-[clamp(10px,1.4vw,22px)] md:col-span-7">
          {cols.map((c, ci) => (
            <div key={ci} data-m-col className="flex flex-col gap-[clamp(10px,1.4vw,22px)]" style={{ marginTop: `${[0, 22, 8][ci]}%` }}>
              {c.map((k) => (
                <div
                  key={k}
                  onMouseEnter={() => setA(k)}
                  className={`relative transition-[filter] duration-700 ${k === a ? "[filter:none]" : "[filter:grayscale(1)_contrast(.95)_brightness(.97)]"}`}
                >
                  <Pic i={team[k].i} ratio="3/4" />
                  <span className={`absolute bottom-3 left-3 rounded-full bg-[var(--sx-surface)] px-3 py-1 text-[12px] font-[600] transition-opacity duration-500 ${k === a ? "opacity-100" : "opacity-0"}`}>{team[k].n}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="md:col-span-5 md:self-center">
          <H className="max-w-[11ch] text-[clamp(44px,5vw,84px)]">The people behind the pass.</H>
          <P className="mt-6 max-w-[38ch]">Eight cooks, growers and hosts at a twenty-seat counter in Fort Kochi. Most of them started as guests.</P>
          <ul className="mt-10 border-t border-[var(--sx-line)]">
            {team.map((p, k) => (
              <li key={p.n} onMouseEnter={() => setA(k)} className="flex cursor-default items-baseline justify-between gap-6 border-b border-[var(--sx-line)] py-[clamp(10px,1vw,14px)]">
                <span className={`sx-display flex items-center gap-3 text-[clamp(20px,1.7vw,28px)] transition-colors duration-500 ${k === a ? "text-[var(--sx-text)]" : "text-[color-mix(in_srgb,var(--sx-text)_38%,transparent)]"}`}>
                  <span className={`h-2 w-2 rounded-full bg-[var(--sx-accent)] transition-transform duration-500 ${k === a ? "scale-100" : "scale-0"}`} />
                  {p.n}
                </span>
                <span className={`text-[14px] transition-colors duration-500 ${k === a ? "text-[var(--sx-accent)]" : "text-[var(--sx-muted)]"}`}>{p.role}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Btn kind="link">Join the kitchen →</Btn>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/** TM02 · Staff directory rows: full-width rows (name, role, based in, link); the active row's portrait follows the
 *  pointer, and hands-free a virtual pointer glides down the rows. */
function TM02() {
  const r = useRef<HTMLDivElement>(null);
  const table = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const rows = useRef<(HTMLDivElement | null)[]>([]);
  const ptr = useRef<{ x: number; y: number; at: number } | null>(null);
  const pos = useRef({ x: 0, y: 0, init: false });
  const lastA = useRef(0);
  const [a, setA] = useState(0);
  useSectionMotion(r, "M23");
  const staff = [
    { n: "Mira Fernandes", role: "Creative director", city: "Goa", i: 3 },
    { n: "Arjun Bhatt", role: "Type & identity", city: "Ahmedabad", i: 1 },
    { n: "Sana Qureshi", role: "Motion lead", city: "Mumbai", i: 2 },
    { n: "Vikram Iyer", role: "3D & product", city: "Chennai", i: 0 },
    { n: "Ananya Ghosh", role: "Strategy", city: "Kolkata", i: 1 },
    { n: "Zoya Mirza", role: "Photography", city: "Delhi", i: 3 },
    { n: "Nikhil Varma", role: "Engineering", city: "Bengaluru", i: 2 },
  ];
  useTicker(table, (t, dt) => {
    const tb = table.current!;
    const c = card.current!;
    const live = ptr.current && performance.now() - ptr.current.at < 1500;
    let idx: number;
    let tx: number;
    let ty: number;
    if (live) {
      tx = ptr.current!.x;
      ty = ptr.current!.y;
      idx = rows.current.findIndex((row) => row && ty >= row.offsetTop && ty < row.offsetTop + row.offsetHeight);
      if (idx < 0) idx = lastA.current;
    } else {
      // virtual pointer: one row every 1.6 s, swaying across the middle of the table
      idx = Math.floor(t / 1.6) % staff.length;
      const row = rows.current[idx];
      tx = tb.clientWidth * (0.56 + 0.12 * Math.sin(t * 0.9));
      ty = row ? row.offsetTop + row.offsetHeight / 2 : 0;
    }
    if (idx !== lastA.current) {
      lastA.current = idx;
      setA(idx);
    }
    const p = pos.current;
    if (!p.init) Object.assign(p, { x: tx, y: ty, init: true });
    const k = 1 - Math.pow(0.0015, dt); // frame-rate independent ease
    p.x += (tx - p.x) * k;
    p.y += (ty - p.y) * k;
    c.style.transform = `translate3d(${(p.x - c.offsetWidth / 2).toFixed(1)}px, ${(p.y - c.offsetHeight / 2).toFixed(1)}px, 0) rotate(${((tx - p.x) * 0.02).toFixed(2)}deg)`;
    c.style.left = c.style.top = "0px";
  });
  return (
    <Sec innerRef={r} theme="ink" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[12ch] text-[clamp(48px,6vw,104px)]">Who&apos;s in the studio.</H>
        <P className="max-w-[34ch] pb-2">Seven people, six cities, one shared drive. We design brands and the sites they live on.</P>
      </div>
      <div
        ref={table}
        onPointerMove={(e) => {
          const b = e.currentTarget.getBoundingClientRect();
          ptr.current = { x: e.clientX - b.left, y: e.clientY - b.top, at: performance.now() };
        }}
        className="relative mt-[clamp(40px,5vw,80px)]"
      >
        <div className="hidden grid-cols-12 gap-6 pb-4 text-[12px] uppercase tracking-[0.16em] text-[var(--sx-muted)] md:grid">
          <span className="col-span-5">Name</span>
          <span className="col-span-3">Role</span>
          <span className="col-span-2">Based in</span>
          <span className="col-span-2 text-right">Work</span>
        </div>
        {staff.map((s, k) => (
          <div
            key={s.n}
            ref={(el) => {
              rows.current[k] = el;
            }}
            className={`relative grid grid-cols-1 items-baseline gap-x-6 gap-y-1 border-t border-[var(--sx-line)] py-[clamp(16px,1.6vw,24px)] transition-colors duration-500 md:grid-cols-12 ${k === staff.length - 1 ? "border-b" : ""} ${k === a ? "text-[var(--sx-text)]" : "text-[color-mix(in_srgb,var(--sx-text)_45%,transparent)]"}`}
          >
            <span data-m-text className="sx-display text-[clamp(26px,2.6vw,44px)] font-[600] leading-none tracking-[-0.01em] md:col-span-5">
              {s.n}
            </span>
            <span className="text-[15px] md:col-span-3">{s.role}</span>
            <span className="text-[15px] md:col-span-2">{s.city}</span>
            <a href="#" onClick={(e) => e.preventDefault()} className={`text-[14px] font-[600] transition-colors md:col-span-2 md:text-right ${k === a ? "text-[var(--sx-accent)]" : ""}`}>
              Selected work →
            </a>
          </div>
        ))}
        {/* the portrait that follows the (virtual) pointer */}
        <div ref={card} className="pointer-events-none absolute z-10 hidden w-[clamp(170px,15vw,230px)] md:block" style={{ left: "58%", top: "24px" }} aria-hidden>
          <div className="relative overflow-hidden rounded-[var(--sx-radius)] shadow-[0_30px_60px_-20px_rgba(0,0,0,.6)]" style={{ aspectRatio: "4/5" }}>
            {staff.map((s, k) => (
              <div key={s.n} className={`absolute inset-0 transition-opacity duration-500 ${k === a ? "opacity-100" : "opacity-0"}`}>
                <Pic i={s.i} ratio="auto" round={false} className="absolute inset-0 h-full w-full" />
              </div>
            ))}
            <span className="absolute bottom-3 left-3 rounded-full bg-black/50 px-3 py-1 text-[12px] font-[600] text-white backdrop-blur-md">{staff[a].role}</span>
          </div>
        </div>
      </div>
      <div className="mt-10 flex flex-wrap items-center gap-5">
        <Btn>Work with us</Btn>
        <Btn kind="ghost">Open roles (2)</Btn>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "TM01", name: "Staggered portraits + synced member list", motion: "M32", C: TM01 },
  { code: "TM02", name: "Staff directory rows with cursor portrait", motion: "M23", C: TM02 },
];
