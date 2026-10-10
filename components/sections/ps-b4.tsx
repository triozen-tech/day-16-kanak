"use client";

// PS · Product-shop layouts, batch 4 (docs/SECTION-MENU.md): PS17 collection tree browser (a folder tree that opens
// its branches by itself beside a preview panel), PS18 compact list rows that morph into a large detail card over a
// blurred list. Both cycle hands-free while on screen and show their final state in ?static=1.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Pic, Price, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

/** Steps an index every `ms` while `ref` is on screen (stops off screen and in ?static=1). */
function useCycle(ref: React.RefObject<HTMLElement | null>, n: number, ms: number) {
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
  return i;
}

// two independent loops (scale + drift, different periods) so a photo never sits still
const KB = `.ps4kb img{animation:ps4kbs 4.6s ease-in-out infinite alternate,ps4kbt 3.3s ease-in-out infinite alternate}
@keyframes ps4kbs{from{scale:1.08}to{scale:1.2}}@keyframes ps4kbt{from{translate:-2.5% 1.5%}to{translate:2.5% -1.5%}}
@keyframes ps4in{from{opacity:0;transform:scale(1.04)}}@keyframes ps4up{from{opacity:0;transform:translateY(10px)}}
.ps4scroll{animation:ps4scroll 9s linear infinite}@keyframes ps4scroll{from{transform:translateY(0)}to{transform:translateY(-50%)}}
html.is-static .ps4kb img,html.is-static .ps4scroll{animation:none}
html.is-static {.ps4kb img,.ps4scroll{animation:none}}`;

/* ───────────────────────────── PS17 · Collection tree browser ───────────────────────────── */

type Item = { id: string; n: string; p: string; i: number; spec: [string, string][]; note: string };
const TREE: { n: string; lines: { n: string; items: Item[] }[] }[] = [
  {
    n: "Living",
    lines: [
      {
        n: "Cane Lounge",
        items: [
          { id: "arc", n: "Arc Lounge Chair", p: "₹38,500", i: 2, note: "Hand-woven rattan on a steam-bent teak frame. Sits low, holds you upright.", spec: [["Frame", "Solid teak, oiled"], ["Seat", "Hand-woven cane"], ["Size", "74 × 82 × 70 cm"], ["Lead time", "3 weeks"]] },
          { id: "bench", n: "Low Cane Bench", p: "₹24,900", i: 0, note: "A long, quiet bench for the hallway or the foot of a bed.", spec: [["Frame", "Solid teak, oiled"], ["Seat", "Open-weave cane"], ["Size", "140 × 38 × 44 cm"], ["Lead time", "2 weeks"]] },
        ],
      },
      {
        n: "Teak Modular",
        items: [
          { id: "sofa", n: "Three-seat Module", p: "₹1,12,000", i: 3, note: "Three blocks that clip together, re-cover in any of 14 linens.", spec: [["Frame", "Reclaimed teak"], ["Cover", "Washed linen"], ["Size", "228 × 92 × 72 cm"], ["Lead time", "5 weeks"]] },
        ],
      },
    ],
  },
  {
    n: "Dining",
    lines: [
      {
        n: "Monsoon Table",
        items: [
          { id: "table", n: "Six-seat Table", p: "₹86,000", i: 1, note: "One slab of mango wood, legs set in from the corners for easy knees.", spec: [["Top", "Mango wood, 4 cm"], ["Finish", "Hard wax oil"], ["Size", "200 × 95 × 75 cm"], ["Lead time", "4 weeks"]] },
          { id: "chair", n: "Spindle Chair", p: "₹14,800", i: 2, note: "Seven turned spindles and a saddle seat, light enough to lift with one hand.", spec: [["Wood", "Sheesham"], ["Seat", "Carved saddle"], ["Size", "46 × 50 × 82 cm"], ["Lead time", "2 weeks"]] },
        ],
      },
    ],
  },
  {
    n: "Bedroom",
    lines: [
      {
        n: "Low Platform",
        items: [
          { id: "bed", n: "Platform Bed, Queen", p: "₹72,500", i: 0, note: "A floating base with a headboard you can lean on to read.", spec: [["Frame", "Solid teak"], ["Headboard", "Cane panel"], ["Size", "168 × 214 × 30 cm"], ["Lead time", "4 weeks"]] },
        ],
      },
    ],
  },
];
// the order the browser walks through (collection, line, item)
const WALK: [number, number, number][] = [
  [0, 0, 0],
  [0, 0, 1],
  [0, 1, 0],
  [1, 0, 0],
  [1, 0, 1],
  [2, 0, 0],
];

const Chev = ({ open }: { open: boolean }) => (
  <span className={`inline-block w-3 text-[12px] text-[var(--sx-muted)] transition-transform duration-500 ${open ? "rotate-90" : ""}`}>▸</span>
);
const Folder = ({ open }: { open: boolean }) => (
  <svg width="18" height="14" viewBox="0 0 18 14" aria-hidden className="shrink-0">
    <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h4l1.6 1.8h7.4A1.5 1.5 0 0 1 17 4.3v7.2a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 1 11.5z" fill={open ? "var(--sx-accent)" : "none"} stroke={open ? "var(--sx-accent)" : "var(--sx-muted)"} strokeWidth="1.3" />
  </svg>
);
// a collapsible branch: animates height with grid rows
const Branch = ({ open, children }: { open: boolean; children: React.ReactNode }) => (
  <div className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(.22,1,.36,1)] ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
    <div className="min-h-0 overflow-hidden">{children}</div>
  </div>
);

/** PS17 · Indented collection > line > product tree (4/12) opening its branches by itself; preview panel (8/12). */
function PS17() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M23");
  const k = useCycle(r, WALK.length, 2400);
  const [c, l, it] = WALK[k];
  const item = TREE[c].lines[l].items[it];
  const path = [TREE[c].n, TREE[c].lines[l].n, item.n];
  return (
    <Sec innerRef={r} theme="paper" font="serif" className="py-[clamp(72px,9vw,140px)]">
      <style>{KB}</style>
      <div className="grid grid-cols-1 items-end gap-6 md:grid-cols-12">
        <H className="text-[clamp(44px,5.6vw,92px)] md:col-span-7">Every piece, filed by room.</H>
        <P className="max-w-[40ch] md:col-span-5">Forty-two pieces across four collections, built to order in our Mysuru workshop. Open a folder, find your chair.</P>
      </div>

      <div className="mt-[clamp(40px,5vw,72px)] grid grid-cols-1 gap-[clamp(24px,3vw,48px)] md:grid-cols-12">
        {/* tree */}
        <aside data-m-card className="sx-card self-start p-[clamp(18px,2vw,28px)] md:col-span-4">
          <p className="flex items-center justify-between border-b border-[var(--sx-line)] pb-4 text-[13px] font-[650] uppercase tracking-[0.14em]">
            Collections <span className="font-[500] normal-case tracking-normal text-[var(--sx-muted)]">42 pieces</span>
          </p>
          <ul className="mt-3 text-[15px]">
            {TREE.map((col, ci) => {
              const colOpen = ci === c;
              return (
                <li key={col.n}>
                  <div className={`flex items-center gap-2.5 rounded-[10px] px-2 py-2.5 ${colOpen ? "font-[650]" : ""}`}>
                    <Chev open={colOpen} />
                    <Folder open={colOpen} />
                    <span className="flex-1">{col.n}</span>
                    <span className="text-[13px] text-[var(--sx-muted)]">{col.lines.reduce((s, x) => s + x.items.length, 0)}</span>
                  </div>
                  <Branch open={colOpen}>
                    <ul className="ml-[22px] border-l border-[var(--sx-line)] pl-3">
                      {col.lines.map((ln, li) => {
                        const lnOpen = colOpen && li === l;
                        return (
                          <li key={ln.n}>
                            <div className="flex items-center gap-2.5 rounded-[10px] px-2 py-2">
                              <Chev open={lnOpen} />
                              <Folder open={lnOpen} />
                              <span className={lnOpen ? "font-[600]" : "text-[var(--sx-muted)]"}>{ln.n}</span>
                            </div>
                            <Branch open={lnOpen}>
                              <ul className="ml-[22px] border-l border-[var(--sx-line)] pb-1 pl-3">
                                {ln.items.map((x) => {
                                  const on = x.id === item.id;
                                  return (
                                    <li key={x.id} className={`my-0.5 flex items-center justify-between gap-3 rounded-[10px] px-3 py-2 text-[14px] transition-colors duration-300 ${on ? "bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "text-[var(--sx-muted)]"}`}>
                                      <span>{x.n}</span>
                                      <span className="tabular-nums opacity-80">{x.p}</span>
                                    </li>
                                  );
                                })}
                              </ul>
                            </Branch>
                          </li>
                        );
                      })}
                    </ul>
                  </Branch>
                </li>
              );
            })}
            <li className="flex items-center gap-2.5 px-2 py-2.5 text-[var(--sx-muted)]">
              <Chev open={false} />
              <Folder open={false} />
              <span className="flex-1">Outdoor</span>
              <span className="text-[13px]">soon</span>
            </li>
          </ul>
        </aside>

        {/* preview */}
        <div data-m-card className="sx-card grid min-w-0 grid-cols-1 gap-[clamp(20px,2.4vw,36px)] p-[clamp(14px,1.4vw,20px)] md:col-span-8 md:grid-cols-[1.1fr_1fr]">
          <div key={item.id} className="ps4kb relative overflow-hidden rounded-[14px]" style={{ animation: "ps4in .7s cubic-bezier(.22,1,.36,1)" }}>
            <Pic i={item.i} ratio="4/5" round={false} label="" />
          </div>
          <div className="flex flex-col py-[clamp(4px,1vw,16px)] pr-[clamp(4px,1vw,16px)]">
            <p className="text-[13px] text-[var(--sx-muted)]">
              {path.map((s, n) => (
                <span key={s}>
                  {n > 0 && <span className="mx-1.5 opacity-60">/</span>}
                  <span className={n === 2 ? "text-[var(--sx-text)]" : ""}>{s}</span>
                </span>
              ))}
            </p>
            <div key={`t-${item.id}`} style={{ animation: "ps4up .6s cubic-bezier(.22,1,.36,1)" }}>
              <h3 className="sx-display mt-6 text-[clamp(30px,2.8vw,46px)] font-[700] leading-[1.02] tracking-[-0.01em]">{item.n}</h3>
              <Price now={item.p} className="mt-3 text-[20px]" />
              <p className="mt-5 max-w-[34ch] text-[16px] leading-relaxed text-[var(--sx-muted)]">{item.note}</p>
              <dl className="mt-7 border-t border-[var(--sx-line)] text-[14px]">
                {item.spec.map(([a, b]) => (
                  <div key={a} className="flex justify-between gap-4 border-b border-[var(--sx-line)] py-2.5">
                    <dt className="text-[var(--sx-muted)]">{a}</dt>
                    <dd className="text-right">{b}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="mt-auto flex flex-wrap items-center gap-3 pt-8">
              <Btn>Add to order</Btn>
              <Btn kind="link">Request a swatch</Btn>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────────── PS18 · Compact list rows that open a detail card ───────────────────────────── */

const RANGE = [
  { n: "Tanpura One", s: "Open-back headphones · walnut", p: "₹24,990", i: 3, d: "Fifty-millimetre drivers tuned in a room full of old records. Walnut cups, lambskin pads and a cable you can actually replace. Open-back, so the music sits in the room with you rather than inside your head. Comes with a cotton pouch and a two-year promise." },
  { n: "Raga Bookshelf Pair", s: "Passive speakers · ash", p: "₹42,500", i: 1, d: "A pair of small two-way speakers that fill a living room without asking for the wall. Solid ash cabinets, cloth grilles in three colours, and a rear port tuned for low, warm bass at night-time volume." },
  { n: "Monsoon Turntable", s: "Belt drive · smoked lid", p: "₹56,000", i: 0, d: "A heavy plinth, a quiet belt and a carbon arm set up before it leaves the bench. Plays 33 and 45 with a switch, ships with a pre-mounted cartridge, and asks only for a flat shelf." },
  { n: "Ghazal Earbuds", s: "Wireless · 30 h battery", p: "₹12,990", i: 2, d: "Small, light buds with a warm signature and calls that sound like you. Thirty hours with the case, rain-proof, and tips in four sizes in the box. The case charges on any pad." },
  { n: "Dhrupad Amplifier", s: "Valve hybrid · 2 × 40 W", p: "₹68,000", i: 3, d: "Two glowing valves up front and a quiet modern output stage. Four inputs, a phono stage for the turntable, and one large brass knob that feels right every evening." },
  { n: "Sitar Cable Kit", s: "Braided · 1.2 m + 3 m", p: "₹2,490", i: 1, d: "Two braided cables with brass ends: a short one for the desk, a long one for the sofa. Built to be coiled a thousand times." },
];

/** PS18 · Narrow centred list (thumb, title, subline, pill); one row at a time morphs into a big card over a blurred list. */
function PS18() {
  const r = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const shown = useRef(false);
  useSectionMotion(r, "M34");
  const [sel, setSel] = useState(0);
  const [open, setOpen] = useState(false);

  // hands-free: open a row, hold, close, move to the next row (while on screen)
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const loop = () => {
      setOpen(true);
      t = setTimeout(() => {
        setOpen(false);
        t = setTimeout(() => {
          setSel((v) => (v + 1) % RANGE.length);
          loop();
        }, 1000);
      }, 3000);
    };
    const io = new IntersectionObserver(([e]) => {
      clearTimeout(t);
      if (e.isIntersecting) t = setTimeout(loop, 700);
      else setOpen(false);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(t);
    };
  }, []);

  // morph the card out of (and back into) the selected row's thumbnail
  useLayoutEffect(() => {
    const el = r.current;
    const c = card.current;
    const th = el?.querySelector<HTMLElement>(`[data-thumb="${sel}"]`);
    if (!c || !th) return;
    const fromThumb = () => {
      const cr = c.getBoundingClientRect();
      const tr = th.getBoundingClientRect();
      return { x: tr.left - cr.left, y: tr.top - cr.top, scaleX: tr.width / cr.width, scaleY: tr.height / cr.height };
    };
    const parts = c.querySelectorAll("[data-fade]");
    if (open) {
      gsap.killTweensOf([c, parts]);
      gsap.set(c, { clearProps: "transform" });
      gsap.fromTo(c, { ...fromThumb(), autoAlpha: 1, transformOrigin: "0 0" }, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.75, ease: "power3.inOut" });
      gsap.fromTo(parts, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", stagger: 0.06, delay: 0.45 });
      shown.current = true;
    } else if (shown.current) {
      shown.current = false;
      gsap.killTweensOf([c, parts]);
      gsap.to(parts, { opacity: 0, duration: 0.2 });
      gsap.set(c, { clearProps: "transform" });
      gsap.to(c, { ...fromThumb(), duration: 0.6, ease: "power3.inOut", transformOrigin: "0 0", onComplete: () => void gsap.set(c, { autoAlpha: 0 }) });
    }
  }, [open, sel]);

  const x = RANGE[sel];
  return (
    <Sec innerRef={r} theme="ink" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <style>{KB}</style>
      <div className="mx-auto max-w-[760px] text-center">
        <H className="text-[clamp(44px,5.4vw,84px)]">The listening room.</H>
        <P className="mx-auto mt-5 max-w-[44ch]">Six things we make for slow evenings with records. Each one tuned by ear in Pune.</P>
      </div>

      <div className="relative mx-auto mt-[clamp(40px,5vw,64px)] max-w-[680px]">
        <ul className={`flex flex-col transition-[filter,opacity] duration-500 ${open ? "opacity-40 blur-[6px]" : ""}`}>
          {RANGE.map((y, n) => (
            <li key={y.n} data-m-card className={`flex items-center gap-5 border-b border-[var(--sx-line)] py-3.5 ${n === 0 ? "border-t" : ""}`}>
              <div data-thumb={n} className={`relative h-[64px] w-[64px] shrink-0 overflow-hidden rounded-[12px] transition-opacity duration-300 ${open && n === sel ? "opacity-0" : ""}`}>
                <Pic i={y.i} ratio="1/1" round={false} label="" className="h-full w-full" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[17px] font-[650]">{y.n}</p>
                <p className="mt-0.5 truncate text-[14px] text-[var(--sx-muted)]">{y.s}</p>
              </div>
              <span className={`rounded-full px-5 py-2 text-[14px] font-[650] transition-colors duration-300 ${n === sel ? "bg-[var(--sx-accent)] text-[var(--sx-accent-text)]" : "bg-[var(--sx-surface)] text-[var(--sx-text)]"}`}>{y.p}</span>
            </li>
          ))}
        </ul>

        {/* the detail card (hidden until a row opens; hidden in ?static=1) */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div ref={card} className="invisible w-[min(520px,100%)] overflow-hidden rounded-[22px] bg-[var(--sx-surface)] shadow-[0_40px_120px_-30px_rgba(0,0,0,.7)]" style={{ opacity: 0 }}>
            <div className="ps4kb relative overflow-hidden">
              <Pic i={x.i} ratio="16/9" round={false} label="" />
            </div>
            <div className="p-6">
              <div data-fade className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[22px] font-[700] leading-tight">{x.n}</p>
                  <p className="mt-1 text-[14px] text-[var(--sx-muted)]">{x.s}</p>
                </div>
                <Btn className="shrink-0">Add · {x.p}</Btn>
              </div>
              <div data-fade className="relative mt-5 h-[96px] overflow-hidden [mask-image:linear-gradient(transparent,#000_18%,#000_78%,transparent)]">
                <div className="ps4scroll text-[15px] leading-relaxed text-[var(--sx-muted)]">
                  <p className="pb-6">{x.d}</p>
                  <p className="pb-6">{x.d}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "PS17", name: "Collection tree browser", motion: "M23", C: PS17 },
  { code: "PS18", name: "Compact list rows that open a detail card", motion: "M34", C: PS18 },
];
