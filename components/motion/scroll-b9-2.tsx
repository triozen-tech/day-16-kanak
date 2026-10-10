"use client";

// MOTION-MENU M422–M433 (scroll group, batch 9 · part 2): small focused demos for /lab/motion.
// "scrub" demos map the panel's scroll LINEARLY (useScrub progress over the whole 220vh panel) onto styles set directly.
// The one "play" demo (M427) starts on screen, loops with holds ≤ 0.12 s and pauses off screen.
// Every demo also has a CSS-only glow loop, so a still scroll never reads as a frozen frame.
// ?static=1 / reduced motion: no animation, a sensible final state.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, SplitText, prefersReducedMotion } from "@/lib/gsap";
import { scene, useScrub } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const GROTESK = "'Space Grotesk Variable', system-ui, sans-serif";
const SERIF = "'Fraunces Variable', Georgia, serif";
const EDITORIAL = "'Instrument Serif', Georgia, serif";
const WIDE = "'Syne Variable', 'Space Grotesk Variable', system-ui, sans-serif";
const MANROPE = "'Manrope Variable', system-ui, sans-serif";
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ---------- shared helpers (local copies) ---------- */

/** A soft radial glow that drifts forever (CSS only, scoped to one code), stopped in ?static=1 / reduced motion. */
function Glow({ code, color, at = "50% 45%", className = "" }: { code: string; color: string; at?: string; className?: string }) {
  const c = `${code}-glow`;
  const css = `.${c}{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(circle at ${at},${color} 0%,transparent 52%);animation:${c} 4.6s linear infinite alternate;will-change:transform}
@keyframes ${c}{0%{transform:translate3d(-9%,-5%,0) scale(1)}100%{transform:translate3d(9%,6%,0) scale(1.18)}}
html.is-static .${c}{animation:none}html.is-static {.${c}{animation:none}}`;
  return (
    <>
      <style>{css}</style>
      <div className={`${c} ${className}`} aria-hidden />
    </>
  );
}

/** Second glow ON TOP of photo-covered stages (rule 13): screen-blended, never blocks the pointer. */
const TopGlow = ({ code, color, at = "60% 55%" }: { code: string; color: string; at?: string }) => (
  <Glow code={`${code}t`} color={color} at={at} className="z-30 opacity-[.45] mix-blend-screen" />
);

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, className = "", style, label = "", w = 1400, h = 900 }: { i: number; className?: string; style?: CSSProperties; label?: string; w?: number; h?: number }) => (
  <img src={scene(i, w, h, label)} alt="" className={`h-full w-full object-cover ${className}`} style={style} draggable={false} />
);

const Frame = ({ r, bg, children, className = "" }: { r: RefObject<HTMLDivElement | null>; bg: string; children: ReactNode; className?: string }) => (
  <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[24px] ${className}`} style={{ background: bg }}>
    {children}
  </div>
);

const q = <T extends HTMLElement = HTMLElement>(el: HTMLElement, s: string) => el.querySelector<T>(s);
const qa = <T extends HTMLElement = HTMLElement>(el: HTMLElement, s: string) => Array.from(el.querySelectorAll<T>(s));

/** Placeholder portrait (head + shoulders on a tinted ground) as an SVG data URI — no real person. */
const TONES = [
  ["#2a1d2e", "#e9b7a0", "#6b3f5e"],
  ["#14222b", "#c99a7b", "#2f6f8f"],
  ["#2b2416", "#8d6146", "#b58a3a"],
  ["#1c2a1f", "#f0c8a8", "#3e7a52"],
  ["#2b1716", "#a7735a", "#a24b3c"],
];
function portrait(i: number) {
  const [bg, skin, cloth] = TONES[i % TONES.length];
  const tilt = ((i * 37) % 9) - 4;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="480" viewBox="0 0 400 480"><defs><radialGradient id="g" cx="50%" cy="35%" r="70%"><stop offset="0" stop-color="${cloth}" stop-opacity=".55"/><stop offset="1" stop-color="${bg}"/></radialGradient></defs><rect width="400" height="480" fill="url(#g)"/><g transform="rotate(${tilt} 200 260)"><path d="M70 480q10-130 130-140q120 10 130 140z" fill="${cloth}"/><rect x="176" y="250" width="48" height="60" rx="20" fill="${skin}"/><ellipse cx="200" cy="200" rx="70" ry="86" fill="${skin}"/><path d="M128 190q0-96 72-100q76 4 74 104q-14-52-74-56q-58 4-72 52z" fill="${bg}" opacity=".85"/></g></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/* ---------- M422 · Horizontal timeline with progress line (variant of M11: a fill line + popping date dots) ---------- */
const M422_E = [
  ["1962", "First garden", "Twelve acres of hillside tea, picked by hand."],
  ["1971", "The drying shed", "A cedar shed for slow, sun-withered leaf."],
  ["1984", "Smoke house", "Pine-smoked black tea joins the list."],
  ["1993", "Down to the city", "A tiny counter opens by the old market."],
  ["2006", "Loose leaf only", "No dust, no bags. Whole leaf, always."],
  ["2015", "The tasting room", "Forty teas, poured in tiny glass cups."],
  ["2024", "Leaf by post", "Fresh flushes delivered, from ₹ 420."],
];
function M422() {
  const root = useRef<HTMLDivElement>(null);
  const apply = (p: number) => {
    const el = root.current;
    if (!el) return;
    const track = q(el, ".m422-track");
    const fill = q(el, ".m422-fill");
    if (!track || !fill) return;
    const W = el.clientWidth;
    const dots = qa(el, ".m422-dot");
    const cards = qa(el, ".m422-card");
    const dx = (k: number) => cards[k].offsetLeft + 28;
    const playAt = W * 0.5;
    // track: first dot already a little behind the playhead → last dot 180px past it (linear over the whole panel)
    const x0 = playAt - dx(0) + 120;
    const x1 = playAt - dx(cards.length - 1) - 180;
    const x = lerp(x0, x1, p);
    track.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
    const head = playAt - x; // playhead in track coordinates
    fill.style.width = `${Math.max(0, Math.min(track.scrollWidth, head)).toFixed(1)}px`;
    dots.forEach((d, k) => {
      const f = clamp01((head - dx(k)) / 140);
      const s = f <= 0 ? 1 : 1 + Math.sin(Math.min(1, f) * Math.PI) * 1.1 + 0.4 * f;
      d.style.transform = `translate(-50%,50%) scale(${s.toFixed(3)})`;
      d.style.background = f > 0 ? "#ffb36b" : "#2a2f3b";
      d.style.boxShadow = f > 0 ? `0 0 ${(18 * f).toFixed(1)}px rgba(255,179,107,.8)` : "none";
      cards[k].style.opacity = (0.45 + 0.55 * clamp01((head - dx(k) + 260) / 260)).toFixed(3);
    });
  };
  useScrub(root, apply, { finalValue: 0.55 });
  return (
    <Frame r={root} bg="#0d0b0a">
      <Glow code="m422" color="rgba(255,150,80,.4)" at="40% 60%" />
      <div className="pointer-events-none absolute left-[5%] top-[8%] z-10">
        <p className="text-[13px] uppercase tracking-[0.2em] text-white/55">Ashwood Tea · our story</p>
        <h3 className="mt-2 text-[clamp(44px,4.6vw,76px)] leading-[0.95] text-[#fff1e6]" style={{ fontFamily: SERIF, fontWeight: 500 }}>
          Sixty years of leaf.
        </h3>
      </div>
      <div className="absolute left-1/2 top-[30%] bottom-[10%] z-10 w-px bg-white/25" aria-hidden />
      <div className="m422-track absolute bottom-[12%] left-0 flex gap-[48px] pl-[50vw] will-change-transform" style={{ fontFamily: MANROPE }}>
        {M422_E.map(([y, t, d]) => (
          <article key={y} className="m422-card relative w-[330px] shrink-0 pb-[64px]">
            <p className="text-[clamp(48px,4.4vw,72px)] font-[700] leading-none tracking-[-0.03em] text-[#fff1e6]" style={{ fontFamily: GROTESK }}>
              {y}
            </p>
            <p className="mt-3 text-[20px] font-[700] text-white/90">{t}</p>
            <p className="mt-1 max-w-[30ch] text-[15px] leading-snug text-white/60">{d}</p>
            <span className="m422-dot absolute bottom-[2px] left-[28px] z-10 h-[14px] w-[14px] rounded-full bg-[#2a2f3b]" style={{ transform: "translate(-50%,50%)" }} />
          </article>
        ))}
        <div className="absolute bottom-[1px] left-0 right-0 h-[2px] bg-white/15" aria-hidden>
          <div className="m422-fill h-full w-0 bg-[#ffb36b] shadow-[0_0_14px_rgba(255,179,107,.7)]" />
        </div>
      </div>
    </Frame>
  );
}

/* ---------- M423 · Horizontal page with position-driven effects (variant of M11: rotate / lift / saturation by screen position) ---------- */
const M423_P = [
  ["Dune runner", "₹ 7,900", 2],
  ["Salt flat low", "₹ 6,400", 3],
  ["Canyon mid", "₹ 8,800", 1],
  ["Mesa trail", "₹ 9,200", 0],
  ["Basin slip-on", "₹ 4,900", 3],
  ["Ridge boot", "₹ 11,400", 2],
  ["Playa racer", "₹ 8,100", 1],
];
function M423() {
  const root = useRef<HTMLDivElement>(null);
  const apply = (p: number) => {
    const el = root.current;
    if (!el) return;
    const track = q(el, ".m423-track");
    if (!track) return;
    const W = el.clientWidth;
    const x = lerp(W * 0.04, W * 0.96 - track.scrollWidth, p);
    track.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
    qa(el, ".m423-item").forEach((it, k) => {
      const cx = x + it.offsetLeft + it.offsetWidth / 2;
      const n = gsap.utils.clamp(-1.3, 1.3, (cx - W / 2) / (W * 0.55));
      const a = Math.abs(n);
      const card = it.firstElementChild as HTMLElement;
      card.style.transform = `translate3d(0,${(a * a * 70 * (k % 2 ? -1 : 1)).toFixed(1)}px,0) rotate(${(n * -9).toFixed(2)}deg)`;
      card.style.filter = `saturate(${(1 - Math.min(0.9, a * 0.85)).toFixed(3)}) brightness(${(1 - Math.min(0.55, a * 0.45)).toFixed(3)})`;
      const cap = it.lastElementChild as HTMLElement;
      cap.style.transform = `translate3d(${(n * 46).toFixed(1)}px,0,0)`;
      cap.style.opacity = (1 - Math.min(0.75, a * 0.7)).toFixed(3);
    });
  };
  useScrub(root, apply, { finalValue: 0.5 });
  return (
    <Frame r={root} bg="#120e0a">
      <Glow code="m423" color="rgba(224,145,63,.42)" at="50% 50%" />
      <p className="pointer-events-none absolute left-[5%] top-[6%] z-10 text-[13px] uppercase tracking-[0.2em] text-white/55">Terrace footwear · desert collection</p>
      <div className="m423-track absolute inset-y-0 left-0 flex items-center gap-[3vw] will-change-transform">
        {M423_P.map(([t, pr, i], k) => (
          <div key={t as string} className="m423-item relative w-[min(24vw,340px)] shrink-0">
            <figure className="h-[46vh] overflow-hidden rounded-[18px] border border-white/10 will-change-transform">
              <Img i={(i as number) + k} w={700} h={900} />
            </figure>
            <figcaption className="mt-4 flex items-baseline justify-between text-[#fff6e8] will-change-transform" style={{ fontFamily: GROTESK }}>
              <span className="text-[clamp(20px,1.7vw,28px)] font-[700]">{t}</span>
              <span className="text-[16px] text-[#ffd59a]">{pr}</span>
            </figcaption>
          </div>
        ))}
      </div>
      <TopGlow code="m423" color="rgba(255,200,140,.32)" />
    </Frame>
  );
}

/* ---------- M424 · Horizontal headline, letters fall off (variant of M11: per-char drop at a fixed edge) ---------- */
function M424() {
  const root = useRef<HTMLDivElement>(null);
  const st = useRef<{ chars: HTMLElement[]; mid: number[]; lastWord: number } | null>(null);
  const pr = useRef(0);
  const apply = (p: number) => {
    pr.current = p;
    const el = root.current;
    const s = st.current;
    if (!el || !s) return;
    const line = q(el, ".m424-line");
    if (!line) return;
    const W = el.clientWidth;
    const H = el.clientHeight;
    const edge = W * 0.3;
    // linear sideways travel: the headline starts at 34% and ends with its last word resting just right of the edge
    const x0 = W * 0.34;
    const x1 = edge + 36 - s.lastWord;
    const x = lerp(x0, x1, p);
    line.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
    s.chars.forEach((c, k) => {
      const f = clamp01((edge - (x + s.mid[k])) / (W * 0.2));
      const y = f * f * H * 0.95;
      const r = f * (k % 2 ? 78 : -62);
      c.style.transform = `translate3d(${(f * 30).toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${r.toFixed(1)}deg)`;
      c.style.opacity = (1 - clamp01((f - 0.55) / 0.45)).toFixed(3);
    });
  };
  useEffect(() => {
    const el = root.current;
    const line = el && q(el, ".m424-line");
    if (!el || !line) return;
    let dead = false;
    let split: SplitText | null = null;
    const measure = () => {
      if (!split) return;
      const chars = split.chars as HTMLElement[];
      chars.forEach((c) => (c.style.transform = "none"));
      const L = line.getBoundingClientRect().left;
      const mid = chars.map((c) => {
        const r = c.getBoundingClientRect();
        return r.left - L + r.width / 2;
      });
      const words = split.words as HTMLElement[];
      const lastWord = words[words.length - 1].getBoundingClientRect().left - L;
      st.current = { chars, mid, lastWord };
      apply(pr.current);
    };
    Promise.resolve(document.fonts?.ready).then(() => {
      if (dead) return;
      split = SplitText.create(line, { type: "words,chars", charsClass: "m424-c" });
      measure();
    });
    window.addEventListener("resize", measure);
    return () => {
      dead = true;
      window.removeEventListener("resize", measure);
      st.current = null;
      split?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useScrub(root, apply, { finalValue: 0.35 });
  return (
    <Frame r={root} bg="#0b0d14">
      <Glow code="m424" color="rgba(255,77,109,.42)" at="35% 55%" />
      <style>{`.m424-c{will-change:transform}`}</style>
      <p className="pointer-events-none absolute left-[5%] top-[7%] z-10 text-[13px] uppercase tracking-[0.2em] text-white/55">Field &amp; Fold · summer sale</p>
      {/* the ledge the letters fall off */}
      <div className="absolute left-[30%] right-0 top-[63%] z-10 h-[3px] bg-[#ff4d6d]/80 shadow-[0_0_16px_rgba(255,77,109,.6)]" aria-hidden />
      <div className="absolute left-[30%] top-[63%] z-10 h-[14vh] w-px bg-gradient-to-b from-[#ff4d6d]/70 to-transparent" aria-hidden />
      <h3
        className="m424-line absolute left-0 top-[63%] whitespace-nowrap text-[clamp(120px,22vh,210px)] font-[800] leading-[0.8] tracking-[-0.03em] text-[#fff1e6] will-change-transform"
        style={{ fontFamily: WIDE, transform: "translate3d(34vw,0,0)", translate: "0 -86%" }}
      >
        Everything must fall now
      </h3>
      <p className="pointer-events-none absolute bottom-[7%] right-[5%] z-10 text-right text-[15px] text-white/75" style={{ fontFamily: MANROPE }}>
        Up to 40% off linen and cotton · from ₹ 1,200
      </p>
    </Frame>
  );
}

/* ---------- M425 · Horizontal editorial track with mask titles (variant of M153: line masks + image parallax per panel) ---------- */
const M425_P = [
  { n: "01", l: ["The long", "lunch table"], d: "Solid mango wood, seats ten.", p: "₹ 68,000", i: 3 },
  { n: "02", l: ["A chair for", "slow mornings"], d: "Woven cane, oiled ash frame.", p: "₹ 14,500", i: 0 },
  { n: "03", l: ["Light, kept", "low and warm"], d: "Spun brass pendant, linen cord.", p: "₹ 9,800", i: 1 },
  { n: "04", l: ["Shelves that", "hold a life"], d: "Modular oak, wall-mounted.", p: "₹ 32,000", i: 2 },
  { n: "05", l: ["Sleep on", "washed linen"], d: "Stone-washed, five colours.", p: "₹ 7,400", i: 3 },
];
function M425() {
  const root = useRef<HTMLDivElement>(null);
  const apply = (p: number) => {
    const el = root.current;
    if (!el) return;
    const track = q(el, ".m425-track");
    if (!track) return;
    const W = el.clientWidth;
    const x = lerp(0, W - track.scrollWidth, p);
    track.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
    qa(el, ".m425-panel").forEach((pn) => {
      const left = x + pn.offsetLeft;
      const e = clamp01((W - left) / (W * 0.6));
      qa(pn, ".m425-ln").forEach((ln, k) => {
        const t = clamp01(e * 1.7 - k * 0.22);
        ln.style.transform = `translate3d(0,${((1 - t) * 112).toFixed(1)}%,0)`;
      });
      const img = q(pn, ".m425-img");
      const n = (left + pn.offsetWidth / 2 - W / 2) / W;
      if (img) img.style.transform = `translate3d(${(n * -16).toFixed(2)}%,0,0) scale(1.05)`;
    });
  };
  useScrub(root, apply, { finalValue: 0.4 });
  return (
    <Frame r={root} bg="#0f0d0a">
      <Glow code="m425" color="rgba(255,213,154,.38)" at="45% 50%" />
      <p className="pointer-events-none absolute left-[4%] top-[6%] z-10 text-[13px] uppercase tracking-[0.2em] text-white/55">Hearth &amp; Grain · the home edit</p>
      <div className="m425-track absolute inset-y-0 left-0 flex will-change-transform">
        {M425_P.map((c) => (
          <section key={c.n} className="m425-panel grid h-full w-[min(64vw,880px)] shrink-0 grid-cols-[1fr_1.1fr] items-center gap-[2.4vw] px-[3vw]">
            <div className="text-[#fff6e8]">
              <span className="block overflow-hidden">
                <span className="m425-ln block text-[15px] tracking-[0.2em] text-[#ffd59a]" style={{ fontFamily: GROTESK }}>
                  {c.n} / 05
                </span>
              </span>
              <h3 className="mt-3 text-[clamp(38px,3.8vw,62px)] leading-[1] tracking-[-0.01em]" style={{ fontFamily: EDITORIAL }}>
                {c.l.map((l) => (
                  <span key={l} className="block overflow-hidden pb-[0.06em]">
                    <span className="m425-ln block will-change-transform">{l}</span>
                  </span>
                ))}
              </h3>
              <span className="mt-4 block overflow-hidden">
                <span className="m425-ln block text-[15px] text-white/65" style={{ fontFamily: MANROPE }}>
                  {c.d} {c.p}
                </span>
              </span>
            </div>
            <figure className="relative h-[58vh] overflow-hidden rounded-[6px]">
              <div className="m425-img absolute inset-y-0 -left-[18%] w-[136%] will-change-transform">
                <Img i={c.i} w={1000} h={1000} />
              </div>
            </figure>
          </section>
        ))}
      </div>
      <TopGlow code="m425" color="rgba(255,200,140,.3)" />
    </Frame>
  );
}

/* ---------- M426 · Middle column reverses (variant of M42: outer columns go up, middle comes down, then an item opens) ---------- */
const M426_T = ["Atlas", "Halden", "Okra", "Juno", "Tamsin", "Ferro", "Lumen", "Sorrel", "Basalt", "Pippa", "Vela", "Corin", "Ines", "Rook", "Nadi", "Cove", "Wren", "Ostra"];
function M426() {
  const root = useRef<HTMLDivElement>(null);
  const apply = (p: number) => {
    const el = root.current;
    if (!el) return;
    const cols = qa(el, ".m426-col");
    const ov = q(el, ".m426-ov");
    if (cols.length < 3 || !ov) return;
    const H = el.clientHeight;
    const W = el.clientWidth;
    const travel = Math.max(0, cols[0].scrollHeight - H);
    // 0 → 0.8: columns scroll (outer up, middle down); 0.8 → 1: the centred middle item opens to full
    const s = clamp01(p / 0.8);
    const yo = -travel * s;
    const ym = -travel * (1 - s);
    cols[0].style.transform = cols[2].style.transform = `translate3d(0,${yo.toFixed(1)}px,0)`;
    cols[1].style.transform = `translate3d(0,${ym.toFixed(1)}px,0)`;
    const e = clamp01((p - 0.8) / 0.2);
    // the item in the middle column nearest the stage centre at the end of the column travel
    const items = qa(cols[1], ".m426-it");
    let best = items[0];
    let bd = Infinity;
    items.forEach((it) => {
      const d = Math.abs(it.offsetTop + it.offsetHeight / 2 - H / 2);
      if (d < bd) {
        bd = d;
        best = it;
      }
    });
    const top = ym + best.offsetTop;
    const left = cols[1].offsetLeft;
    const ins = [top, W - left - cols[1].offsetWidth, H - top - best.offsetHeight, left].map((v) => lerp(v, 0, e));
    ov.style.visibility = e > 0 ? "visible" : "hidden";
    ov.style.clipPath = `inset(${ins.map((v) => `${v.toFixed(1)}px`).join(" ")} round ${lerp(14, 0, e).toFixed(1)}px)`;
    const img = q<HTMLImageElement>(ov, "img");
    const r = String(items.indexOf(best));
    if (img && ov.dataset.r !== r) {
      ov.dataset.r = r;
      img.src = scene(1 + Number(r), 1600, 1000);
      const nm = q(ov, ".m426-nm");
      if (nm) nm.textContent = `The ${M426_T[6 + Number(r)]} lamp`;
    }
    if (img) img.style.transform = `scale(${lerp(1.25, 1, e).toFixed(3)})`;
    const cap = q(ov, ".m426-cap");
    if (cap) cap.style.opacity = clamp01((e - 0.5) / 0.5).toFixed(3);
    cols[0].style.opacity = cols[2].style.opacity = (1 - e * 0.6).toFixed(3);
  };
  useScrub(root, apply, { finalValue: 0.5 });
  return (
    <Frame r={root} bg="#0a0f12">
      <Glow code="m426" color="rgba(47,140,255,.4)" at="50% 50%" />
      <div className="absolute inset-y-0 left-1/2 flex w-[min(78%,1020px)] -ml-[min(39%,510px)] gap-[2.2vw]">
        {[0, 1, 2].map((c) => (
          <div key={c} className="m426-col flex flex-1 flex-col gap-[2.2vw] py-[2vh] will-change-transform">
            {Array.from({ length: 6 }, (_, r) => (
              <figure key={r} className="m426-it relative h-[40vh] shrink-0 overflow-hidden rounded-[14px]">
                <Img i={c + r} w={700} h={760} />
                <figcaption className="absolute bottom-3 left-4 text-[14px] font-[600] text-white/90" style={{ fontFamily: GROTESK }}>
                  {M426_T[c * 6 + r]} lamp
                </figcaption>
              </figure>
            ))}
          </div>
        ))}
      </div>
      <div className="m426-ov absolute inset-0 z-20 overflow-hidden" style={{ visibility: "hidden" }}>
        <Img i={1} w={1600} h={1000} className="will-change-transform" />
        <div className="m426-cap absolute bottom-[8%] left-[5%] text-[#eaf5ff]">
          <p className="text-[clamp(44px,4.6vw,76px)] leading-none" style={{ fontFamily: SERIF, fontWeight: 500 }}>
            <span className="m426-nm">The Lumen lamp</span>
          </p>
          <p className="mt-2 text-[15px] text-white/80">Hand-blown opal glass · ₹ 12,900</p>
        </div>
      </div>
      <TopGlow code="m426" color="rgba(159,216,255,.3)" />
    </Frame>
  );
}

/* ---------- M427 · Split halves slide opposite on change (variant of M42: left half up, right half down, on a timer) ---------- */
const M427_S = [
  { t: "Ember", s: "Smoked cedar candle", p: "₹ 2,400", i: 1, bg: "#2a1410", fg: "#ffb36b" },
  { t: "Tide", s: "Sea salt diffuser", p: "₹ 3,100", i: 0, bg: "#0e1c2b", fg: "#9fd8ff" },
  { t: "Moss", s: "Vetiver room mist", p: "₹ 1,800", i: 2, bg: "#10241a", fg: "#c8ff8a" },
];
function M427() {
  const root = useRef<HTMLDivElement>(null);
  const N = M427_S.length;
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    let tl: gsap.core.Timeline | null = null;
    const ctx = gsap.context(() => {
      tl = gsap.timeline({ paused: true, repeat: -1, defaults: { duration: 1.15, ease: "power2.inOut" } });
      for (let k = 1; k <= N; k++) {
        tl.to(".m427-l", { yPercent: -100 * k }, k === 1 ? 0.12 : ">0.12").to(".m427-r", { yPercent: 100 * k }, "<");
      }
      // the last slide is a clone of the first: snap back to the start without a visible jump
      tl.set(".m427-l", { yPercent: 0 }, ">").set(".m427-r", { yPercent: 0 }, "<");
    }, el);
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? tl?.play() : tl?.pause()), { threshold: 0.15 });
    io.observe(el);
    return () => {
      io.disconnect();
      ctx.revert();
    };
  }, [N]);
  const left = [...M427_S, M427_S[0]];
  const right = [M427_S[0], ...[...M427_S].reverse()];
  return (
    <div ref={root} className="relative h-full w-full overflow-hidden rounded-[24px] bg-[#080a0f]">
      <style>{`.m427-kb{animation:m427kb 5s linear infinite alternate}@keyframes m427kb{0%{transform:scale(1.04)}100%{transform:scale(1.14) translateX(-2%)}}html.is-static .m427-kb{animation:none}html.is-static {.m427-kb{animation:none}}`}</style>
      <div className="absolute inset-0 grid grid-cols-2">
        <div className="relative overflow-hidden">
          <div className="m427-l absolute inset-x-0 top-0 flex h-full flex-col will-change-transform">
            {left.map((s, k) => (
              <div key={k} className="relative h-full w-full shrink-0 overflow-hidden">
                <Img i={s.i} w={900} h={1000} className="m427-kb" label={s.t.toUpperCase()} />
              </div>
            ))}
          </div>
        </div>
        <div className="relative overflow-hidden">
          <div className="m427-r absolute inset-x-0 flex h-full flex-col will-change-transform" style={{ top: `${-N * 100}%` }}>
            {right.map((s, k) => (
              <div key={k} className="relative flex h-full w-full shrink-0 flex-col justify-center overflow-hidden px-[7%]" style={{ background: s.bg }}>
                <Glow code={`m427-${k}`} color={`${s.fg}55`} at="70% 40%" />
                <p className="relative text-[14px] uppercase tracking-[0.2em] text-white/60" style={{ fontFamily: GROTESK }}>
                  Kindle House · home scent
                </p>
                <p className="relative mt-3 text-[clamp(72px,8vw,132px)] leading-[0.9]" style={{ fontFamily: SERIF, fontWeight: 500, color: s.fg }}>
                  {s.t}
                </p>
                <p className="relative mt-4 text-[clamp(20px,1.8vw,28px)] text-[#fff6e8]" style={{ fontFamily: MANROPE }}>
                  {s.s}
                </p>
                <p className="relative mt-1 text-[18px] text-white/70" style={{ fontFamily: MANROPE }}>
                  {s.p}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-white/20" aria-hidden />
      <TopGlow code="m427" color="rgba(255,190,140,.3)" at="50% 50%" />
    </div>
  );
}

/* ---------- M428 · Tilted card rows straighten (variant of M31: three rows, opposite x, tilt + offset scrub to 0) ---------- */
const M428_R = [
  ["Oat latte blend", "Cold brew bags", "Hazel crema", "Cacao nib roast", "Mocha pods", "Decaf night"],
  ["Monsoon Malabar", "Hill estate", "Single origin", "Peaberry", "House espresso", "Filter kaapi"],
  ["Pour-over kit", "Brass dripper", "Glass carafe", "Hand grinder", "Travel press", "Cupping set"],
];
function M428() {
  const root = useRef<HTMLDivElement>(null);
  const apply = (p: number) => {
    const el = root.current;
    if (!el) return;
    const field = q(el, ".m428-field");
    if (!field) return;
    const H = el.clientHeight;
    const inv = 1 - p;
    field.style.transform = `translate3d(0,${(-H * 0.55 * inv).toFixed(1)}px,0) rotateX(${(15 * inv).toFixed(2)}deg) rotateZ(${(20 * inv).toFixed(2)}deg)`;
    field.style.opacity = (0.3 + 0.7 * p).toFixed(3);
    qa(el, ".m428-row").forEach((r, k) => {
      const dir = k % 2 ? -1 : 1;
      r.style.transform = `translate3d(${(dir * lerp(-12, 6, p)).toFixed(2)}%,0,0)`;
    });
    const head = q(el, ".m428-head");
    if (head) head.style.transform = `translate3d(0,${(-30 * p).toFixed(1)}px,0)`;
  };
  useScrub(root, apply, { finalValue: 1 });
  return (
    <Frame r={root} bg="#0f0b08">
      <Glow code="m428" color="rgba(224,145,63,.42)" at="50% 55%" />
      <div className="m428-head pointer-events-none absolute left-[5%] top-[6%] z-20 will-change-transform">
        <p className="text-[13px] uppercase tracking-[0.2em] text-white/60">Copperpot Coffee</p>
        <h3 className="mt-2 text-[clamp(40px,4vw,66px)] font-[700] leading-[0.95] tracking-[-0.03em] text-[#fff6e8]" style={{ fontFamily: GROTESK }}>
          The whole menu,
          <br />
          now in the shop.
        </h3>
      </div>
      <div className="absolute inset-0" style={{ perspective: "1000px" }}>
        <div className="m428-field absolute left-[-10%] right-[-10%] top-[34%] flex flex-col gap-[2.4vh] will-change-transform" style={{ transformOrigin: "50% 30%", transformStyle: "preserve-3d" }}>
          {M428_R.map((row, k) => (
            <div key={k} className="m428-row flex gap-[1.6vw] will-change-transform">
              {row.map((t, c) => (
                <figure key={t} className="relative h-[19vh] w-[18vw] shrink-0 overflow-hidden rounded-[14px] border border-white/10">
                  <Img i={k + c} w={700} h={420} />
                  <figcaption className="absolute bottom-2 left-3 right-3 flex justify-between text-[13px] font-[600] text-white/90" style={{ fontFamily: GROTESK }}>
                    <span>{t}</span>
                    <span className="text-white/70">₹ {(420 + ((k * 6 + c) * 137) % 900).toLocaleString("en-IN")}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          ))}
        </div>
      </div>
      <TopGlow code="m428" color="rgba(255,190,120,.3)" />
    </Frame>
  );
}

/* ---------- M429 · Tile rows slide opposite ways (variant of M42: a tilted wall, rows in alternating directions + slow zoom) ---------- */
function M429() {
  const root = useRef<HTMLDivElement>(null);
  const apply = (p: number) => {
    const el = root.current;
    if (!el) return;
    const wall = q(el, ".m429-wall");
    if (!wall) return;
    wall.style.transform = `rotate(-11deg) scale(${lerp(1.18, 1.4, p).toFixed(3)})`;
    qa(el, ".m429-row").forEach((r, k) => {
      const dir = k % 2 ? 1 : -1;
      const tilt = k === 1 || k === 3 ? ` rotate(${(k === 1 ? -3 : 3) * (1 - p * 0.5)}deg)` : "";
      r.style.transform = `translate3d(${(dir * lerp(-14, 14, p) - 8).toFixed(2)}%,0,0)${tilt}`;
    });
  };
  useScrub(root, apply, { finalValue: 0.5 });
  return (
    <Frame r={root} bg="#0b0a10">
      <Glow code="m429" color="rgba(150,120,255,.4)" at="50% 50%" />
      <div className="m429-wall absolute inset-[-10%] flex flex-col justify-center gap-[1.6vw] will-change-transform">
        {Array.from({ length: 5 }, (_, k) => (
          <div key={k} className="m429-row flex shrink-0 gap-[1.6vw] will-change-transform">
            {Array.from({ length: 8 }, (_, c) => (
              <div key={c} className="h-[17vh] w-[17vw] shrink-0 overflow-hidden rounded-[10px]">
                <Img i={k * 3 + c} w={600} h={380} />
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-[radial-gradient(circle_at_50%_50%,rgba(11,10,16,.7),transparent_60%)] text-center">
        <div>
          <p className="text-[clamp(64px,7.4vw,124px)] font-[800] leading-[0.9] tracking-[-0.04em] text-[#f3efff]" style={{ fontFamily: WIDE }}>
            THE ARCHIVE
          </p>
          <p className="mt-3 text-[16px] text-white/80" style={{ fontFamily: MANROPE }}>
            420 prints from the studio · from ₹ 1,600
          </p>
        </div>
      </div>
      <TopGlow code="m429" color="rgba(190,170,255,.3)" />
    </Frame>
  );
}

/* ---------- M430 · 3D grid unfurls flat (variant of M32: deep tilt → flat, columns at different parallax offsets) ---------- */
const M430_OFF = [-26, 14, -38, 6];
function M430() {
  const root = useRef<HTMLDivElement>(null);
  const apply = (p: number) => {
    const el = root.current;
    if (!el) return;
    const grid = q(el, ".m430-grid");
    if (!grid) return;
    const inv = 1 - p;
    grid.style.transform = `rotateX(${(58 * inv).toFixed(2)}deg) rotateZ(${(-30 * inv).toFixed(2)}deg) scale(${lerp(0.82, 1, p).toFixed(3)})`;
    qa(el, ".m430-col").forEach((c, k) => {
      c.style.transform = `translate3d(0,${(M430_OFF[k] * inv - 6 * p).toFixed(2)}%,0)`;
    });
    const cap = q(el, ".m430-cap");
    if (cap) cap.style.opacity = clamp01((p - 0.55) / 0.45).toFixed(3);
  };
  useScrub(root, apply, { finalValue: 1 });
  return (
    <Frame r={root} bg="#07100c">
      <Glow code="m430" color="rgba(24,196,143,.42)" at="50% 50%" />
      <div className="absolute inset-0 grid place-items-center" style={{ perspective: "1200px" }}>
        <div className="m430-grid flex w-[min(92%,1240px)] gap-[1.4vw] will-change-transform" style={{ transformStyle: "preserve-3d" }}>
          {[0, 1, 2, 3].map((c) => (
            <div key={c} className="m430-col flex flex-1 flex-col gap-[1.4vw] will-change-transform">
              {Array.from({ length: 5 }, (_, r) => (
                <div key={r} className="h-[30vh] overflow-hidden rounded-[12px]">
                  <Img i={c + r * 2} w={600} h={600} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="m430-cap pointer-events-none absolute bottom-[7%] left-[5%] z-20 text-[#f1fff4]">
        <p className="text-[clamp(40px,4.4vw,72px)] leading-none drop-shadow-[0_6px_30px_rgba(0,0,0,.6)]" style={{ fontFamily: EDITORIAL }}>
          A year in the garden.
        </p>
        <p className="mt-2 text-[15px] text-white/85">Fernbrook nursery · seeds from ₹ 90</p>
      </div>
      <TopGlow code="m430" color="rgba(200,255,138,.28)" />
    </Frame>
  );
}

/* ---------- M431 · Pinned name under scrolling photo grid (variant of M32: the name holds still, five staggered columns pass over it) ---------- */
const M431_OFF = [0, 16, 6, 22, 10]; // vh: staggered column starts
const M431_SPD = [1, 1.12, 0.94, 1.18, 1.04];
function M431() {
  const root = useRef<HTMLDivElement>(null);
  const apply = (p: number) => {
    const el = root.current;
    if (!el) return;
    const H = el.clientHeight;
    qa(el, ".m431-col").forEach((c, k) => {
      const travel = c.scrollHeight - H * 0.45;
      const y = H * 0.2 - p * travel * M431_SPD[k] * 0.9;
      c.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
    });
  };
  useScrub(root, apply, { finalValue: 0.5 });
  return (
    <Frame r={root} bg="#0e0c10">
      <Glow code="m431" color="rgba(255,77,109,.38)" at="50% 50%" />
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-[clamp(64px,6.5vw,112px)] font-[800] leading-none tracking-[-0.03em] text-[#fff1e6]" style={{ fontFamily: WIDE }}>
            NOOR VALE
          </p>
          <p className="mt-3 text-[14px] uppercase tracking-[0.3em] text-white/65">Photographer · Prints from ₹ 4,500</p>
        </div>
      </div>
      <div className="absolute inset-x-[3%] top-0 z-10 grid grid-cols-5 gap-[4vw]">
        {[0, 1, 2, 3, 4].map((c) => (
          <div key={c} className="m431-col flex flex-col gap-[4vh] will-change-transform" style={{ paddingTop: `${M431_OFF[c]}vh` }}>
            {Array.from({ length: 5 }, (_, r) => (
              <div key={r} className="h-[30vh] overflow-hidden rounded-[6px] shadow-[0_20px_50px_rgba(0,0,0,.5)]">
                <Img i={c * 2 + r} w={500} h={700} />
              </div>
            ))}
          </div>
        ))}
      </div>
      <TopGlow code="m431" color="rgba(255,170,140,.3)" />
    </Frame>
  );
}

/* ---------- M432 · Row-scaled portrait wall (variant of M7: each row scales 0 → 1 → 0 across the stage, blend title on top) ---------- */
const M432_N = ["Asha", "Bram", "Cleo", "Dev", "Esme", "Faiz", "Gita", "Hugo", "Ila", "Jonah", "Kavi", "Lena", "Milo", "Nia", "Omar", "Priya", "Quinn", "Rhea", "Sami", "Tara", "Uma", "Vik", "Wes", "Yara", "Zoe", "Arlo", "Bea", "Cyrus", "Dina", "Eli", "Fern", "Gus", "Hana", "Ivo", "Jai"];
function M432() {
  const root = useRef<HTMLDivElement>(null);
  const apply = (p: number) => {
    const el = root.current;
    if (!el) return;
    const wall = q(el, ".m432-wall");
    if (!wall) return;
    const H = el.clientHeight;
    const rows = qa(el, ".m432-row");
    const rh = rows[0]?.offsetHeight ?? 0;
    // linear: first row centred at the start, last row centred at the end
    const y0 = H / 2 - rh / 2;
    const y1 = H / 2 - (wall.scrollHeight - rh / 2);
    const y = lerp(y0, y1, p);
    wall.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
    rows.forEach((r) => {
      const cy = y + r.offsetTop + rh / 2;
      const n = Math.abs(cy - H / 2) / (H / 2 + rh / 2);
      const s = clamp01(1 - n);
      qa(r, ".m432-p").forEach((pp) => (pp.style.transform = `scale(${s.toFixed(3)})`));
    });
  };
  useScrub(root, apply, { finalValue: 0.5 });
  return (
    <Frame r={root} bg="#0c0b0d">
      <Glow code="m432" color="rgba(255,179,107,.4)" at="50% 50%" />
      <div className="m432-wall absolute left-1/2 top-0 w-[min(70%,920px)] -ml-[min(35%,460px)] will-change-transform">
        {Array.from({ length: 7 }, (_, r) => (
          <div key={r} className="m432-row grid grid-cols-5 gap-[1.2vw] py-[0.8vw]">
            {Array.from({ length: 5 }, (_, c) => (
              <figure key={c} className="m432-p relative aspect-[5/6] overflow-hidden rounded-[10px] will-change-transform">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={portrait(r * 5 + c)} alt="" className="h-full w-full object-cover" draggable={false} />
                <figcaption className="absolute bottom-2 left-2 text-[12px] font-[600] text-white/85" style={{ fontFamily: MANROPE }}>
                  {M432_N[r * 5 + c]}
                </figcaption>
              </figure>
            ))}
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center mix-blend-difference">
        <p className="text-center text-[clamp(56px,6.2vw,104px)] font-[800] leading-[0.92] tracking-[-0.03em] text-white" style={{ fontFamily: WIDE }}>
          THE MAKERS
          <br />
          GUILD
        </p>
      </div>
      <p className="pointer-events-none absolute bottom-4 left-5 z-20 text-[13px] uppercase tracking-[0.2em] text-white/60">35 makers · workshops from ₹ 1,500</p>
      <TopGlow code="m432" color="rgba(255,200,150,.28)" />
    </Frame>
  );
}

/* ---------- M433 · Horizontal strip depth of field (variant of M50: blur, dim and desaturate by distance from centre) ---------- */
const M433_P = [
  ["Kumo", "Stoneware teapot", "₹ 3,400"],
  ["Hana", "Glazed tea bowl", "₹ 1,200"],
  ["Sora", "Ash-glaze jug", "₹ 2,800"],
  ["Mizu", "Water carafe", "₹ 2,100"],
  ["Tsuki", "Moon plate", "₹ 1,600"],
  ["Kaze", "Speckled vase", "₹ 4,200"],
  ["Yuki", "White sake set", "₹ 3,900"],
  ["Hoshi", "Star dish", "₹ 900"],
];
function M433() {
  const root = useRef<HTMLDivElement>(null);
  const apply = (p: number) => {
    const el = root.current;
    if (!el) return;
    const track = q(el, ".m433-track");
    const name = q(el, ".m433-name");
    const sub = q(el, ".m433-sub");
    if (!track) return;
    const W = el.clientWidth;
    const its = qa(el, ".m433-it");
    const c0 = its[0].offsetLeft + its[0].offsetWidth / 2;
    const cN = its[its.length - 1].offsetLeft + its[its.length - 1].offsetWidth / 2;
    const x = lerp(W / 2 - c0, W / 2 - cN, p);
    track.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
    let best = 0;
    let bd = Infinity;
    its.forEach((it, k) => {
      const d = Math.abs(x + it.offsetLeft + it.offsetWidth / 2 - W / 2) / (W / 2);
      if (d < bd) {
        bd = d;
        best = k;
      }
      const a = Math.min(1, d);
      it.style.filter = `blur(${Math.min(6, a * 9).toFixed(2)}px) grayscale(${a.toFixed(3)}) brightness(${(1 - a * 0.55).toFixed(3)})`;
      it.style.transform = `scale(${(1 - a * 0.14).toFixed(3)})`;
    });
    if (name && name.textContent !== M433_P[best][0]) {
      name.textContent = M433_P[best][0];
      if (sub) sub.textContent = `${M433_P[best][1]} · ${M433_P[best][2]}`;
    }
  };
  useScrub(root, apply, { finalValue: 0.5 });
  return (
    <Frame r={root} bg="#0d0d0c">
      <Glow code="m433" color="rgba(255,213,154,.36)" at="50% 45%" />
      <p className="pointer-events-none absolute left-[5%] top-[6%] z-10 text-[13px] uppercase tracking-[0.2em] text-white/55">Kiln Row ceramics · new firing</p>
      <div className="m433-track absolute left-0 top-[16%] flex h-[54%] items-center gap-[2vw] will-change-transform">
        {M433_P.map(([t], k) => (
          <figure key={t} className="m433-it h-full w-[min(22vw,300px)] shrink-0 overflow-hidden rounded-[16px] will-change-[transform,filter]">
            <Img i={k} w={600} h={800} label={t.toUpperCase()} />
          </figure>
        ))}
      </div>
      <div className="pointer-events-none absolute bottom-[8%] left-0 right-0 z-10 text-center text-[#fff6e8]">
        <p className="m433-name text-[clamp(44px,4.6vw,76px)] leading-none" style={{ fontFamily: SERIF, fontWeight: 500 }}>
          {M433_P[0][0]}
        </p>
        <p className="m433-sub mt-2 text-[15px] text-white/75" style={{ fontFamily: MANROPE }}>
          {M433_P[0][1]} · {M433_P[0][2]}
        </p>
      </div>
      <TopGlow code="m433" color="rgba(255,220,170,.28)" />
    </Frame>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M422", name: "Horizontal timeline with progress line", how: "Dated cards slide left; a thin bottom line fills with the accent at the centre mark and each date dot pops as the line reaches it · scrubbed", kind: "scrub", C: M422 },
  { code: "M423", name: "Horizontal page with position-driven effects", how: "A horizontal track of product cards; each card rotates, lifts and loses saturation and brightness by its distance from the screen centre · scrubbed", kind: "scrub", C: M423 },
  { code: "M424", name: "Horizontal headline, letters fall off", how: "A huge one-line headline slides sideways; each letter that passes the ledge's edge drops and spins off it, the last word stays · scrubbed", kind: "scrub", C: M424 },
  { code: "M425", name: "Horizontal editorial track with mask titles", how: "Editorial panels slide left; each panel's number, title lines and note rise out of line masks as it enters while its image parallaxes inside · scrubbed", kind: "scrub", C: M425 },
  { code: "M426", name: "Middle column reverses", how: "Three image columns scroll: the outer two go up, the middle one comes down; at the end the centred middle image opens to full · scrubbed", kind: "scrub", C: M426 },
  { code: "M427", name: "Split halves slide opposite on change", how: "A slide split in two halves: on each change the image half slides up and the text half slides down, the next slide converging from both ends · auto loop", kind: "play", C: M427 },
  { code: "M428", name: "Tilted card rows straighten", how: "Three rows of product cards start tilted (rotateX 15°, rotateZ 20°) and lifted; rows slide in opposite directions while the tilt and offset scrub to 0 · scrubbed", kind: "scrub", C: M428 },
  { code: "M429", name: "Tile rows slide opposite ways", how: "A tilted wall of image tiles: alternate rows slide in opposite directions, two rows extra-tilted, the whole wall zooming in slowly under a title · scrubbed", kind: "scrub", C: M429 },
  { code: "M430", name: "3D grid unfurls flat", how: "An image grid lying in deep 3D (rotateX 58°, rotateZ −30°) unfurls flat while its four columns slide at different parallax offsets · scrubbed", kind: "scrub", C: M430 },
  { code: "M431", name: "Pinned name under scrolling photo grid", how: "A big name holds still mid-stage while five staggered photo columns scroll up over it at slightly different speeds · scrubbed", kind: "scrub", C: M431 },
  { code: "M432", name: "Row-scaled portrait wall", how: "A portrait wall scrolls up; every portrait scales 0 → 1 → 0 as its row crosses the stage, under a still mix-blend title · scrubbed", kind: "scrub", C: M432 },
  { code: "M433", name: "Horizontal strip depth of field", how: "A horizontal strip slides; the centred image is sharp and in colour, the rest blur, dim and grey out by distance from centre · scrubbed", kind: "scrub", C: M433 },
];
