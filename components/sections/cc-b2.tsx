"use client";

// CC · Contact layouts, batch 2 (CC03–CC04). Full designed sections; ?static=1 shows each in its final state.
import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { Btn, H, P, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const field = "mt-2 w-full rounded-[12px] border border-[var(--sx-line)] bg-[var(--sx-bg)] px-4 py-3.5 text-[15px] text-[var(--sx-text)] placeholder:text-[var(--sx-muted)]";

/* ───────────────────────── CC03 · Map backdrop + floating form card ───────────────────────── */

const CC03_CSS = `
.cc03-route{stroke-dasharray:14 12;animation:cc03-route 1.1s linear infinite}
@keyframes cc03-route{to{stroke-dashoffset:-26}}
.cc03-pulse{transform-origin:center;transform-box:fill-box;animation:cc03-pulse 1.8s ease-out infinite}
@keyframes cc03-pulse{from{transform:scale(.4);opacity:.9}to{transform:scale(2.6);opacity:0}}
html.is-static .cc03-route,html.is-static .cc03-pulse{animation:none}
html.is-static {.cc03-route,.cc03-pulse{animation:none}}
`;

/** Hand-drawn city map (SVG): blocks, two parks, a river, main roads, the courier route and the café pin. */
function CC03Map() {
  const blocks: { x: number; y: number; w: number; h: number; park?: boolean }[] = [];
  for (let c = 0; c < 15; c++)
    for (let r = 0; r < 11; r++) {
      const x = c * 118 + (r % 2) * 18;
      const y = r * 96;
      const park = (c === 4 && r === 3) || (c === 10 && r === 7) || (c === 11 && r === 7);
      blocks.push({ x: x + 10, y: y + 10, w: 98 - ((c + r) % 3) * 6, h: 76 - ((c * r) % 2) * 8, park });
    }
  return (
    <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
      <rect width="1600" height="1000" style={{ fill: "color-mix(in srgb, var(--sx-text) 7%, var(--sx-bg))" }} />
      <g transform="rotate(-9 800 500) translate(-120 -80)">
        {blocks.map((b, k) => (
          <rect key={k} x={b.x} y={b.y} width={b.w} height={b.h} rx="6" style={{ fill: b.park ? "color-mix(in srgb, #5f8f5a 32%, var(--sx-bg))" : "var(--sx-bg)" }} />
        ))}
        {/* main roads */}
        <path d="M-40 384 H1900 M560 -60 V1200 M1180 -60 V1200" style={{ stroke: "var(--sx-surface)", strokeWidth: 26, fill: "none" }} />
        <path d="M-40 384 H1900 M560 -60 V1200 M1180 -60 V1200" style={{ stroke: "color-mix(in srgb, var(--sx-accent) 22%, transparent)", strokeWidth: 2, fill: "none", strokeDasharray: "18 14" }} />
      </g>
      {/* river */}
      <path d="M-40 860 C 260 760, 420 980, 760 900 S 1240 760, 1660 840" style={{ fill: "none", stroke: "color-mix(in srgb, #6f93b0 38%, var(--sx-bg))", strokeWidth: 54, strokeLinecap: "round" }} />
      {/* courier route to the café */}
      <path className="cc03-route" d="M1660 140 C 1300 160, 1180 300, 980 330 S 700 360, 612 470" style={{ fill: "none", stroke: "var(--sx-accent)", strokeWidth: 5, strokeLinecap: "round" }} />
      {/* pin */}
      <circle className="cc03-pulse" cx="612" cy="470" r="34" style={{ fill: "color-mix(in srgb, var(--sx-accent) 35%, transparent)" }} />
      <circle cx="612" cy="470" r="15" style={{ fill: "var(--sx-accent)", stroke: "var(--sx-surface)", strokeWidth: 5 }} />
    </svg>
  );
}

/** CC03 · A full-section city map behind; a white form card floats on the right third. The map settles from 110 %,
 *  the card unfolds from its corner (M18). A courier route and the pin keep pulsing. */
function CC03() {
  const r = useRef<HTMLDivElement>(null);
  const map = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M18");
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(map.current, { scale: 1.1 }, { scale: 1, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "center center", scrub: true } });
    }, el);
    return () => ctx.revert();
  }, []);
  return (
    <Sec innerRef={r} theme="stone" font="serif" full>
      <style>{CC03_CSS}</style>
      <div className="relative flex min-h-[clamp(640px,100svh,940px)] flex-col md:block">
        <div className="relative h-[56svh] overflow-hidden md:absolute md:inset-0 md:h-auto">
          <div ref={map} className="absolute inset-0 will-change-transform">
            <div className="fx-pan absolute -inset-[3%]">
              <CC03Map />
            </div>
          </div>
          {/* pin label, sits next to the pin (pin at ~38 % / 47 % of the map) */}
          <div className="absolute left-[40%] top-[38%] rounded-[14px] border border-[var(--sx-line)] bg-[var(--sx-surface)] px-4 py-3 shadow-[0_18px_40px_-20px_rgba(17,20,24,.45)] max-md:left-[44%]">
            <p className="text-[15px] font-[650]">Kaapi Kitchen</p>
            <p className="mt-0.5 flex items-center gap-2 text-[13px] text-[var(--sx-muted)]">
              <span className="h-2 w-2 rounded-full bg-[#3f9a5c]" /> Open now · till 9 pm
            </p>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--sx-bg)_55%,transparent))] md:block" />
        </div>
        <div className="relative px-[clamp(20px,5vw,96px)] py-10 md:absolute md:inset-y-0 md:right-0 md:flex md:w-[42%] md:items-center md:py-[clamp(72px,9vw,140px)] md:pl-0">
          <form data-m-card onSubmit={(e) => e.preventDefault()} className="sx-card w-full bg-[var(--sx-surface)] p-[clamp(26px,2.8vw,44px)] shadow-[0_40px_90px_-40px_rgba(17,20,24,.55)]">
            <H className="text-[clamp(38px,3.6vw,60px)]">Come by for a cup.</H>
            <P className="mt-4 text-[16px]">Beans, wholesale or a long table for twelve? Write to us and a barista replies within the day.</P>
            <label className="mt-7 block text-[14px] font-[600]">
              E-mail
              <input readOnly value="ira.menon@inbox.example" className={field} />
            </label>
            <label className="mt-4 block text-[14px] font-[600]">
              Message
              <textarea readOnly rows={3} value="A table for 12 on Saturday morning, and two bags of the Chikmagalur estate roast?" className={`${field} resize-none leading-relaxed`} />
            </label>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <Btn>Send message</Btn>
              <p className="text-[13px] text-[var(--sx-muted)]">No. 14, Brew Lane · 7 am – 9 pm</p>
            </div>
          </form>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────── CC04 · Globe + contact form split ───────────────────────── */

const ORIGIN: [number, number] = [10, 76.3];
const CITIES: { n: string; at: [number, number] }[] = [
  { n: "Dubai", at: [25.2, 55.3] },
  { n: "Rotterdam", at: [51.9, 4.5] },
  { n: "Tokyo", at: [35.7, 139.7] },
  { n: "New York", at: [40.7, -74] },
  { n: "Sydney", at: [-33.9, 151.2] },
  { n: "Singapore", at: [1.3, 103.8] },
];
const D2R = Math.PI / 180;
const vec = ([lat, lon]: [number, number]): [number, number, number] => [Math.cos(lat * D2R) * Math.sin(lon * D2R), Math.sin(lat * D2R), Math.cos(lat * D2R) * Math.cos(lon * D2R)];

/** Wireframe globe in SVG, redrawn from a spin angle: meridians, parallels, trade arcs from the origin and city dots. */
function Globe() {
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const s = svg.current;
    if (!s) return;
    const R = 250;
    const C = 300;
    const tilt = 18 * D2R;
    const front = s.querySelector<SVGPathElement>("[data-g=front]")!;
    const back = s.querySelector<SVGPathElement>("[data-g=back]")!;
    const arcF = s.querySelector<SVGPathElement>("[data-g=arcf]")!;
    const arcB = s.querySelector<SVGPathElement>("[data-g=arcb]")!;
    const dots = Array.from(s.querySelectorAll<SVGGElement>("[data-city]"));
    // all lines as lists of unit vectors (+ altitude), built once
    const lines: [number, number, number][][] = [];
    for (let m = 0; m < 12; m++) {
      const L = m * 15 * D2R;
      lines.push(Array.from({ length: 73 }, (_, k) => { const t = (k / 72) * Math.PI * 2; return [Math.cos(t) * Math.sin(L), Math.sin(t), Math.cos(t) * Math.cos(L)]; }));
    }
    for (const lat of [-60, -30, 0, 30, 60]) {
      const f = lat * D2R;
      lines.push(Array.from({ length: 73 }, (_, k) => { const t = (k / 72) * Math.PI * 2; return [Math.cos(f) * Math.sin(t), Math.sin(f), Math.cos(f) * Math.cos(t)]; }));
    }
    const o = vec(ORIGIN);
    const arcs = CITIES.map((c) => {
      const b = vec(c.at);
      const w = Math.acos(Math.min(1, o[0] * b[0] + o[1] * b[1] + o[2] * b[2]));
      return Array.from({ length: 41 }, (_, k) => {
        const t = k / 40;
        const A = Math.sin((1 - t) * w) / Math.sin(w);
        const B = Math.sin(t * w) / Math.sin(w);
        const alt = 1 + 0.22 * Math.sin(Math.PI * t);
        return [(A * o[0] + B * b[0]) * alt, (A * o[1] + B * b[1]) * alt, (A * o[2] + B * b[2]) * alt] as [number, number, number];
      });
    });
    const P = ([x, y, z]: [number, number, number], a: number): [number, number, number] => {
      const x1 = x * Math.cos(a) + z * Math.sin(a);
      const z1 = -x * Math.sin(a) + z * Math.cos(a);
      const y2 = y * Math.cos(tilt) - z1 * Math.sin(tilt);
      const z2 = y * Math.sin(tilt) + z1 * Math.cos(tilt);
      return [C + R * x1, C - R * y2, z2];
    };
    const trace = (set: [number, number, number][][], a: number) => {
      let f = "";
      let bk = "";
      for (const ln of set) {
        let prev = P(ln[0], a);
        for (let k = 1; k < ln.length; k++) {
          const cur = P(ln[k], a);
          const seg = `M${prev[0].toFixed(1)} ${prev[1].toFixed(1)}L${cur[0].toFixed(1)} ${cur[1].toFixed(1)}`;
          if (prev[2] + cur[2] > 0) f += seg;
          else bk += seg;
          prev = cur;
        }
      }
      return [f, bk];
    };
    const draw = (a: number) => {
      const [f, b] = trace(lines, a);
      front.setAttribute("d", f);
      back.setAttribute("d", b);
      const [af, ab] = trace(arcs, a);
      arcF.setAttribute("d", af);
      arcB.setAttribute("d", ab);
      [ORIGIN, ...CITIES.map((c) => c.at)].forEach((ll, k) => {
        const [x, y, z] = P(vec(ll), a);
        dots[k].setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
        dots[k].style.opacity = z > 0 ? "1" : "0.15";
      });
    };
    const p = { a: -1.25 };
    draw(p.a);
    if (prefersReducedMotion()) return;
    const tw = gsap.to(p, { a: p.a + Math.PI * 2, duration: 28, ease: "none", repeat: -1, paused: true, onUpdate: () => draw(p.a) });
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? tw.play() : tw.pause()));
    io.observe(s);
    return () => {
      io.disconnect();
      tw.kill();
    };
  }, []);
  return (
    <svg ref={svg} viewBox="0 0 600 600" className="h-auto w-full max-w-[640px]" aria-label="Globe showing our export routes">
      <defs>
        <radialGradient id="cc04-glow">
          <stop offset="0%" stopColor="var(--sx-accent)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--sx-accent)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="300" cy="300" r="300" fill="url(#cc04-glow)" />
      <circle cx="300" cy="300" r="250" style={{ fill: "color-mix(in srgb, var(--sx-surface) 70%, transparent)", stroke: "var(--sx-line)" }} />
      <path data-g="back" style={{ fill: "none", stroke: "color-mix(in srgb, var(--sx-text) 9%, transparent)", strokeWidth: 1 }} />
      <path data-g="front" style={{ fill: "none", stroke: "color-mix(in srgb, var(--sx-text) 30%, transparent)", strokeWidth: 1.1 }} />
      <path data-g="arcb" style={{ fill: "none", stroke: "color-mix(in srgb, var(--sx-accent) 25%, transparent)", strokeWidth: 1.5 }} />
      <path data-g="arcf" style={{ fill: "none", stroke: "var(--sx-accent)", strokeWidth: 2.2, strokeLinecap: "round" }} />
      {["Kochi", ...CITIES.map((c) => c.n)].map((n, k) => (
        <g key={n} data-city>
          <circle r={k ? 4.5 : 7} style={{ fill: k ? "var(--sx-text)" : "var(--sx-accent)", stroke: "var(--sx-bg)", strokeWidth: 2 }} />
          <text x="10" y="-8" style={{ fill: "var(--sx-text)", fontSize: 15, fontWeight: k ? 500 : 700 }}>
            {n}
          </text>
        </g>
      ))}
    </svg>
  );
}

/** CC04 · Left half: a wireframe globe spinning with the trade routes from our port (M33). Right half: contact links
 *  and a message form, rising from blur. */
function CC04() {
  const r = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M6");
  const links = [
    ["Export desk", "Bulk pepper, cardamom and cloves, FOB Kochi", "export@peppercoast.example"],
    ["Samples", "A 6-spice sample box, shipped in 5 days · ₹1,200", "samples@peppercoast.example"],
    ["Visit the warehouse", "Willingdon Island, by appointment", "Book a slot →"],
  ];
  return (
    <Sec innerRef={r} theme="ink" font="wide" className="py-[clamp(72px,9vw,140px)]">
      <div className="grid grid-cols-1 items-center gap-[clamp(32px,5vw,80px)] md:grid-cols-12">
        <div className="grid place-items-center md:col-span-6">
          <Globe />
          <p className="mt-4 text-center text-[14px] text-[var(--sx-muted)]">Shipping to 31 countries · 1,840 tonnes last season</p>
        </div>
        <div className="md:col-span-6">
          <H className="text-[clamp(40px,4.4vw,72px)]">From our coast to your shelf.</H>
          <P className="mt-5 max-w-[46ch]">Malabar spices, graded and packed at the port. Tell us the market and volume, we reply with a landed price in 24 hours.</P>
          <div className="mt-8 grid grid-cols-1 border-t border-[var(--sx-line)] md:grid-cols-3">
            {links.map(([t, d, a], k) => (
              <div key={t} data-m-card className={`py-5 md:pr-5 ${k ? "md:border-l md:border-[var(--sx-line)] md:pl-5" : ""}`}>
                <p className="text-[16px] font-[650]">{t}</p>
                <p className="mt-1 text-[14px] leading-snug text-[var(--sx-muted)]">{d}</p>
                <a href="#" onClick={(e) => e.preventDefault()} className="mt-3 inline-block break-all text-[13px] text-[var(--sx-accent)]">
                  {a}
                </a>
              </div>
            ))}
          </div>
          <form data-m-card onSubmit={(e) => e.preventDefault()} className="sx-card mt-6 grid grid-cols-1 gap-4 p-[clamp(20px,2.4vw,32px)] md:grid-cols-2">
            <label className="text-[14px] font-[600]">
              Company
              <input readOnly value="Kabir Shah · Saffron & Salt" className={field} />
            </label>
            <label className="text-[14px] font-[600]">
              Market
              <input readOnly value="Netherlands · 2 × 20 ft" className={field} />
            </label>
            <label className="text-[14px] font-[600] md:col-span-2">
              Message
              <input readOnly value="Looking for 8 mm bold pepper, steam-sterilised, for March." className={field} />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-4 md:col-span-2">
              <Btn>Request a quote</Btn>
              <span className="text-[13px] text-[var(--sx-muted)]">Reply in 24 h · Mon–Sat, IST</span>
            </div>
          </form>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "CC03", name: "Map backdrop + floating form card", motion: "M18", C: CC03 },
  { code: "CC04", name: "Globe + contact form split", motion: "M33", C: CC04 },
];
