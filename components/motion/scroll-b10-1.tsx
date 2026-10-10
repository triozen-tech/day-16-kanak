"use client";

// MOTION-MENU M470–M474 (scroll group, batch 10 · part 1): small focused demos for /lab/motion.
// "scrub" demos map the panel's scroll LINEARLY (useScrub progress over the whole 220vh panel) onto styles set directly.
// "play" demos run by themselves while on screen (useTicker) and loop. Every demo also has a CSS-only glow loop, so a
// still scroll never reads as a frozen frame. ?static=1 / reduced motion: no animation, a sensible state in the markup.
// Motion ideas only (rebuilt from scratch, no copied code).
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { scene, useScrub, useTicker } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const GROTESK = "'Space Grotesk Variable', system-ui, sans-serif";
const SERIF = "'Fraunces Variable', Georgia, serif";
const EDITORIAL = "'Instrument Serif', Georgia, serif";
const WIDE = "'Syne Variable', 'Space Grotesk Variable', system-ui, sans-serif";
const MANROPE = "'Manrope Variable', system-ui, sans-serif";
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const mod = (a: number, n: number) => ((a % n) + n) % n;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};
const easeIO = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/* ---------- shared helpers (local copies) ---------- */

/** A soft radial glow that drifts forever (CSS only, scoped to one code), stopped in ?static=1 / reduced motion. */
function Glow({ code, color, at = "50% 45%", className = "", style }: { code: string; color: string; at?: string; className?: string; style?: CSSProperties }) {
  const c = `${code}-glow`;
  const css = `.${c}{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(circle at ${at},${color} 0%,transparent 52%);animation:${c} 4.6s linear infinite alternate;will-change:transform}
@keyframes ${c}{0%{transform:translate3d(-9%,-5%,0) scale(1)}100%{transform:translate3d(9%,6%,0) scale(1.18)}}
html.is-static .${c}{animation:none}html.is-static {.${c}{animation:none}}`;
  return (
    <>
      <style>{css}</style>
      <div className={`${c} ${className}`} style={style} aria-hidden />
    </>
  );
}

/** Scoped keyframes for one demo; the caller lists its animated classes so they stop in ?static=1 / reduced motion. */
function Css({ css, stop }: { css: string; stop: string }) {
  return <style>{`${css}\nhtml.is-static ${stop.split(",").join(",html.is-static ")}{animation:none!important}\nhtml.is-static {${stop}{animation:none!important}}`}</style>;
}

// eslint-disable-next-line @next/next/no-img-element
const Img = ({ i, className = "", style, label = "", w = 1400, h = 900 }: { i: number; className?: string; style?: CSSProperties; label?: string; w?: number; h?: number }) => (
  <img src={scene(i, w, h, label)} alt="" className={`h-full w-full object-cover ${className}`} style={style} draggable={false} />
);

const Frame = ({ r, bg, children }: { r: RefObject<HTMLDivElement | null>; bg: string; children: ReactNode }) => (
  <div ref={r} className="relative h-full w-full overflow-hidden rounded-[24px]" style={{ background: bg }}>
    {children}
  </div>
);

/* ---------- M470 · Logo collapses to monogram (variant of M146: the middle letters slide into the initials) ---------- */
const M470_WORDS = ["HALDEN", "MARLOWE"];
function M470() {
  const root = useRef<HTMLDivElement>(null);
  const widths = useRef<number[] | null>(null);
  const prog = useRef(0);
  const apply = (p: number) => {
    prog.current = p;
    const el = root.current;
    if (!el) return;
    const head = el.querySelector<HTMLElement>(".m470-head");
    const logo = el.querySelector<HTMLElement>(".m470-logo");
    const page = el.querySelector<HTMLElement>(".m470-page");
    const ring = el.querySelector<SVGCircleElement>(".m470-ring");
    const gap = el.querySelector<HTMLElement>(".m470-gap");
    // the header shrinks and the page scrolls under it over the WHOLE panel (linear)
    if (head) head.style.height = `${lerp(36, 15, p).toFixed(2)}%`;
    if (logo) logo.style.transform = `scale(${lerp(1, 0.66, p).toFixed(3)})`;
    if (page) page.style.transform = `translate3d(0,${(-p * 46).toFixed(2)}%,0)`;
    const w = widths.current;
    if (w) {
      el.querySelectorAll<HTMLElement>(".m470-mid").forEach((m, i) => {
        // each word retracts from its last letter toward its initial: letter j (counted from the end) starts later
        const j = Number(m.dataset.j);
        const e = smooth((p - (0.04 + j * 0.1)) / 0.24);
        m.style.width = `${(w[i] * (1 - e)).toFixed(2)}px`;
        m.style.opacity = (1 - e * 1.15).toFixed(3);
        m.style.transform = `translate3d(${(-e * 40).toFixed(1)}%,0,0)`;
        m.style.filter = `blur(${(e * 5).toFixed(2)}px)`;
      });
    }
    if (gap) gap.style.width = `${lerp(0.32, 0.05, smooth((p - 0.45) / 0.35)).toFixed(3)}em`;
    if (ring) ring.style.strokeDashoffset = `${(320 * (1 - smooth((p - 0.72) / 0.28))).toFixed(1)}`;
  };
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let dead = false;
    const measure = () => {
      const mids = [...el.querySelectorAll<HTMLElement>(".m470-mid")];
      mids.forEach((m) => (m.style.width = ""));
      widths.current = mids.map((m) => m.offsetWidth);
      apply(prog.current);
    };
    document.fonts?.ready.then(() => !dead && measure());
    window.addEventListener("resize", measure);
    return () => {
      dead = true;
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useScrub(root, apply, { finalValue: 1 });
  return (
    <Frame r={root} bg="#0d0b10">
      <Glow code="m470" color="rgba(214,170,255,.42)" at="50% 35%" />
      <div className="absolute inset-[5%] overflow-hidden rounded-[18px] bg-[#f4efe8] shadow-[0_30px_80px_rgba(0,0,0,.5)]">
        {/* the page that scrolls under the header */}
        <div className="m470-page absolute inset-x-0 top-[34%] px-[5%] pt-[4%]" style={{ fontFamily: MANROPE }}>
          <div className="grid grid-cols-3 gap-[2.4%]">
            {[0, 1, 2, 3, 2, 1].map((s, i) => (
              <div key={i}>
                <div className="aspect-[4/3] overflow-hidden rounded-[10px]">
                  <Img i={s} w={800} h={600} />
                </div>
                <p className="mt-2 flex justify-between text-[14px] text-[#2a2330]">
                  <span>{["Linen overshirt", "Cord trouser", "Wool scarf", "Canvas tote", "Knit polo", "Field jacket"][i]}</span>
                  <span className="text-[#2a2330]/60">{["₹4,800", "₹5,200", "₹2,900", "₹1,650", "₹3,400", "₹9,100"][i]}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="m470-head absolute inset-x-0 top-0 z-10 flex items-center justify-center border-b border-[#2a2330]/10 bg-[#f4efe8]/95" style={{ height: "36%" }}>
          <span className="absolute left-[4%] text-[13px] uppercase tracking-[0.18em] text-[#2a2330]/60" style={{ fontFamily: GROTESK }}>
            Shop · Journal
          </span>
          <span className="absolute right-[4%] text-[13px] uppercase tracking-[0.18em] text-[#2a2330]/60" style={{ fontFamily: GROTESK }}>
            Bag (2)
          </span>
          <div className="m470-logo relative inline-flex whitespace-nowrap text-[#2a2330]" style={{ fontFamily: WIDE, fontWeight: 800, fontSize: "clamp(40px,4.6vw,80px)", lineHeight: 1, letterSpacing: "0.02em" }}>
            {M470_WORDS.map((word, wi) => (
              <span key={word} className="inline-flex">
                <span className="m470-ini inline-block align-top">{word[0]}</span>
                {word
                  .slice(1)
                  .split("")
                  .map((ch, k, arr) => (
                    <span key={k} data-j={arr.length - 1 - k} className="m470-mid inline-block overflow-hidden align-top">
                      {ch}
                    </span>
                  ))}
                {wi === 0 && <span className="m470-gap inline-block" style={{ width: "0.32em" }} />}
              </span>
            ))}
            <svg className="pointer-events-none absolute left-1/2 top-1/2 h-[2.1em] w-[2.1em] -translate-x-1/2 -translate-y-1/2 overflow-visible" viewBox="0 0 100 100" aria-hidden>
              <circle className="m470-ring" cx="50" cy="50" r="48" fill="none" stroke="#2a2330" strokeWidth="2.4" strokeDasharray="320" style={{ strokeDashoffset: 320 }} transform="rotate(-90 50 50)" />
            </svg>
          </div>
        </div>
      </div>
    </Frame>
  );
}

/* ---------- M471 · Nav detaches into floating pill ---------- */
function M471() {
  const root = useRef<HTMLDivElement>(null);
  const apply = (p: number) => {
    const el = root.current;
    if (!el) return;
    const page = el.querySelector<HTMLElement>(".m471-page");
    const nav = el.querySelector<HTMLElement>(".m471-nav");
    const links = el.querySelector<HTMLElement>(".m471-links");
    // the page scrolls linearly over the whole panel (2.2 screens); the nav detaches once the hero (1 screen) is past
    const scrolled = p * 2.2;
    if (page) page.style.transform = `translate3d(0,${(-scrolled * 100).toFixed(2)}%,0)`;
    const k = smooth((scrolled - 0.5) / 0.38);
    if (nav) {
      nav.style.width = `${lerp(100, 54, k).toFixed(2)}%`;
      nav.style.left = `${lerp(0, 23, k).toFixed(2)}%`;
      nav.style.top = `${lerp(0, 18, k).toFixed(1)}px`;
      nav.style.height = `${lerp(66, 54, k).toFixed(1)}px`;
      nav.style.borderRadius = `${lerp(0, 999, k * k).toFixed(0)}px`;
      nav.style.background = `rgba(246,241,232,${lerp(0.97, 0.6, k).toFixed(3)})`;
      const blur = `blur(${(k * 16).toFixed(1)}px) saturate(${(1 + k * 0.6).toFixed(2)})`;
      nav.style.backdropFilter = blur;
      nav.style.setProperty("-webkit-backdrop-filter", blur);
      nav.style.boxShadow = `0 ${(k * 18).toFixed(1)}px ${(k * 44).toFixed(1)}px rgba(20,16,10,${(k * 0.28).toFixed(3)})`;
      nav.style.borderBottomColor = `rgba(40,30,20,${((1 - k) * 0.14).toFixed(3)})`;
      nav.style.paddingLeft = nav.style.paddingRight = `${lerp(36, 26, k).toFixed(1)}px`;
    }
    if (links) links.style.gap = `${lerp(34, 20, k).toFixed(1)}px`;
  };
  useScrub(root, apply, { finalValue: 1 });
  return (
    <Frame r={root} bg="#0c0a08">
      <Glow code="m471" color="rgba(255,179,107,.42)" at="40% 40%" />
      <div className="absolute inset-[5%] overflow-hidden rounded-[18px] bg-[#f3eee6] shadow-[0_30px_80px_rgba(0,0,0,.5)]" style={{ fontFamily: MANROPE }}>
        <div className="m471-page absolute inset-x-0 top-0 h-full">
          {/* hero: one screen */}
          <div className="relative h-full overflow-hidden">
            <Img i={3} w={1600} h={900} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
            <div className="absolute bottom-[10%] left-[6%] text-[#fff6e8]">
              <p className="text-[13px] uppercase tracking-[0.22em] text-white/70">Spring roast · 2026</p>
              <h3 className="mt-2 text-[clamp(40px,4.6vw,76px)] leading-[0.95]" style={{ fontFamily: SERIF, fontWeight: 500 }}>
                Slow mornings,
                <br />
                <span className="italic">made well.</span>
              </h3>
            </div>
          </div>
          {/* shop grid: the page keeps going under the pill */}
          <div className="px-[6%] pt-[7%]">
            <p className="text-[13px] uppercase tracking-[0.22em] text-[#3a2a1c]/60">The counter</p>
            <h4 className="mt-1 text-[clamp(30px,3vw,48px)] text-[#2b1e14]" style={{ fontFamily: SERIF, fontWeight: 500 }}>
              Beans, gear and good cups
            </h4>
            <div className="mt-[3%] grid grid-cols-4 gap-[2%]">
              {[
                ["Hillside blend", "₹890"],
                ["Night owl dark", "₹940"],
                ["Pour-over kit", "₹2,450"],
                ["Stone mug", "₹690"],
                ["Cold brew pack", "₹1,150"],
                ["Burr grinder", "₹6,900"],
                ["Travel flask", "₹1,890"],
                ["Tasting set", "₹1,450"],
              ].map(([n, pr], i) => (
                <div key={n}>
                  <div className="aspect-square overflow-hidden rounded-[12px]">
                    <Img i={(i + 3) % 4} w={600} h={600} />
                  </div>
                  <p className="mt-2 flex justify-between text-[14px] text-[#2b1e14]">
                    <span>{n}</span>
                    <span className="text-[#2b1e14]/60">{pr}</span>
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-[6%] rounded-[16px] bg-[#2b1e14] px-[5%] py-[5%] text-[#fff6e8]">
              <p className="text-[clamp(28px,2.8vw,44px)]" style={{ fontFamily: SERIF, fontStyle: "italic" }}>
                Subscribe & save 15%
              </p>
              <p className="mt-2 text-[15px] text-white/65">Fresh beans every fortnight from ₹890.</p>
            </div>
          </div>
        </div>
        <nav
          className="m471-nav absolute z-10 flex items-center justify-between border-b text-[#2b1e14]"
          style={{ left: 0, top: 0, width: "100%", height: 66, paddingLeft: 36, paddingRight: 36, background: "rgba(246,241,232,.97)", borderBottomColor: "rgba(40,30,20,.14)" }}
        >
          <span className="text-[22px] font-[700] tracking-[-0.02em]" style={{ fontFamily: GROTESK }}>
            Emberline
          </span>
          <span className="m471-links flex text-[14px] font-[600]" style={{ gap: 34 }}>
            <span>Coffee</span>
            <span>Gear</span>
            <span>Visit</span>
          </span>
          <span className="rounded-full bg-[#2b1e14] px-4 py-[7px] text-[13px] font-[700] text-[#f3eee6]">Bag · 2</span>
        </nav>
      </div>
    </Frame>
  );
}

/* ---------- M472 · Vanishing-point image rails (variant of F4: two image rails stream out of one central point) ---------- */
const M472_N = 7;
const M472_LOOKS = ["Look 01", "Look 02", "Look 03", "Look 04", "Look 05", "Look 06", "Look 07"];
function m472Card(d: number, side: number, W: number, H: number): CSSProperties {
  const e = Math.pow(d, 1.7);
  const x = side * (30 + e * W * 0.6);
  const y = -side * e * H * 0.06 + e * H * 0.04;
  const s = 0.06 + e * 1.22;
  const rot = side * -e * 52;
  const o = clamp01(d / 0.1) * clamp01((1 - d) / 0.08);
  return {
    transform: `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) translate(-50%,-50%) rotateY(${rot.toFixed(2)}deg) scale(${s.toFixed(3)})`,
    opacity: Number(o.toFixed(3)),
    zIndex: Math.round(d * 100) + (d > 0.45 ? 60 : 0),
  };
}
function M472() {
  const root = useRef<HTMLDivElement>(null);
  const apply = (p: number) => {
    const el = root.current;
    if (!el) return;
    const W = el.clientWidth;
    const H = el.clientHeight;
    const phase = p * 2.4; // linear: the rails stream 2.4 cards-cycles over the whole panel
    el.querySelectorAll<HTMLElement>(".m472-card").forEach((c) => {
      const j = Number(c.dataset.j);
      const side = Number(c.dataset.side);
      const d = mod(j / M472_N + phase + (side > 0 ? 0.5 / M472_N : 0), 1);
      const st = m472Card(d, side, W, H);
      c.style.transform = String(st.transform);
      c.style.opacity = String(st.opacity);
      c.style.zIndex = String(st.zIndex);
    });
  };
  useScrub(root, apply, { finalValue: 1 });
  const css = `.m472-point{animation:m472-pulse 1.4s ease-in-out infinite alternate}
@keyframes m472-pulse{0%{transform:translate(-50%,-50%) scale(.7);opacity:.5}100%{transform:translate(-50%,-50%) scale(1.25);opacity:1}}`;
  return (
    <Frame r={root} bg="#08070d">
      <Css css={css} stop=".m472-point" />
      <Glow code="m472" color="rgba(255,77,109,.4)" at="50% 50%" />
      <div className="absolute inset-0" style={{ perspective: "1100px" }}>
        {[-1, 1].map((side) =>
          Array.from({ length: M472_N }, (_, j) => {
            const d = mod(j / M472_N + (side > 0 ? 0.5 / M472_N : 0), 1);
            return (
              <div key={`${side}${j}`} data-j={j} data-side={side} className="m472-card absolute left-1/2 top-1/2 h-[230px] w-[340px] overflow-hidden rounded-[14px] shadow-[0_20px_50px_rgba(0,0,0,.55)]" style={m472Card(d, side, 1330, 630)}>
                <Img i={(j + (side > 0 ? 1 : 0)) % 4} w={680} h={460} />
                <span className="absolute bottom-3 left-4 text-[13px] font-[600] uppercase tracking-[0.18em] text-white/85" style={{ fontFamily: GROTESK }}>
                  {M472_LOOKS[j]}
                </span>
              </div>
            );
          }),
        )}
      </div>
      <span className="m472-point pointer-events-none absolute left-1/2 top-1/2 h-[90px] w-[90px] rounded-full" style={{ background: "radial-gradient(circle, rgba(255,241,230,.9), rgba(255,77,109,.35) 40%, transparent 70%)", transform: "translate(-50%,-50%)" }} aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 top-[7%] z-[55] text-center text-[#fff1e6]">
        <p className="text-[13px] uppercase tracking-[0.24em] text-white/60" style={{ fontFamily: GROTESK }}>
          Atelier Verano · 42 looks
        </p>
        <h3 className="mt-2 text-[clamp(40px,4.4vw,72px)] leading-none" style={{ fontFamily: EDITORIAL }}>
          The spring edit, <span className="italic">in motion</span>
        </h3>
      </div>
    </Frame>
  );
}

/* ---------- M473 · Corridor walk, one room per stop (variant of F4: CSS 3D rooms, the camera snaps room to room) ---------- */
const M473_D = 1400; // room depth
const M473_W = 1100; // corridor width
const M473_H = 640; // corridor height
const M473_SEG = 4; // wall segments per room (so no plane crosses the camera)
const M473_STOP = 0.2; // camera stop inside each room (room units)
const M473_ROOMS = [
  { n: "01", t: "The Linen Room", p: "Washed linen throw", c: "₹3,400", i: 0, wall: "#152036", acc: "#9fd8ff" },
  { n: "02", t: "The Clay Room", p: "Stoneware dinner set", c: "₹5,200", i: 3, wall: "#2a1c10", acc: "#ffd59a" },
  { n: "03", t: "The Moss Room", p: "Hand-thrown planter", c: "₹2,650", i: 2, wall: "#0f2219", acc: "#c8ff8a" },
  { n: "04", t: "The Ember Room", p: "Brass reading lamp", c: "₹7,900", i: 1, wall: "#2a1018", acc: "#ffb36b" },
];
/** The world room index that DOM room `i` shows when the camera is at `cam` (4 DOM rooms cover the 4 rooms ahead). */
const m473R = (i: number, cam: number) => {
  const base = Math.floor(cam);
  return base + mod(i - base, 4);
};
/** Fade near the camera (z toward the 1000px perspective) and into fog far away. */
const m473Fade = (z: number) => clamp01((560 - z) / 260) * clamp01(1 - (-z - 2200) / 2400);
function M473() {
  const root = useRef<HTMLDivElement>(null);
  const st = useRef({ t: 0, k: -1 });
  const place = (cam: number) => {
    const el = root.current;
    if (!el) return;
    el.querySelectorAll<HTMLElement>(".m473-room").forEach((room, i) => {
      const z = (cam - m473R(i, cam)) * M473_D;
      room.style.transform = `translate3d(0,0,${z.toFixed(1)}px)`;
      room.querySelectorAll<HTMLElement>("[data-z]").forEach((part) => {
        const zc = Number(part.dataset.z);
        const near = z + zc + Number(part.dataset.half ?? 0);
        part.style.visibility = near > 600 ? "hidden" : "visible";
        part.style.opacity = m473Fade(z + zc).toFixed(3);
      });
    });
    const cnt = el.querySelector<HTMLElement>(".m473-count");
    const r = Math.floor(cam - M473_STOP + 0.5);
    if (cnt) cnt.textContent = `Room ${M473_ROOMS[mod(r, 4)].n} / 04 · ${M473_ROOMS[mod(r, 4)].t}`;
  };
  useEffect(() => place(M473_STOP), []); // eslint-disable-line react-hooks/exhaustive-deps
  useTicker(root, (_t, dt) => {
    const s = st.current;
    s.t += Math.min(dt, 0.05);
    // one room per stop: 0.95 s glide, 0.55 s parked (the camera still creeps and sways a little, never frozen)
    const T = 1.5;
    const k = Math.floor(s.t / T);
    const f = (s.t / T - k) * T;
    let cam: number;
    if (f < 0.55) cam = k + M473_STOP + (f / 0.55) * 0.03;
    else cam = k + M473_STOP + 0.03 + easeIO((f - 0.55) / 0.95) * 0.97;
    const el = root.current;
    if (el) {
      const stage = el.querySelector<HTMLElement>(".m473-stage");
      if (stage) stage.style.perspectiveOrigin = `${(50 + Math.sin(s.t * 0.9) * 2.2).toFixed(2)}% ${(50 + Math.sin(s.t * 1.7) * 0.8).toFixed(2)}%`;
      if (k !== s.k && f >= 0.55) {
        // one wheel "notch" per room: the extra momentum of a flick would be ignored here
        s.k = k;
        const dot = el.querySelector<HTMLElement>(".m473-wheel");
        dot?.animate([{ transform: "translateY(0)", opacity: 1 }, { transform: "translateY(9px)", opacity: 0.2 }], { duration: 380, easing: "ease-out" });
      }
    }
    place(cam);
  });
  const half = M473_D / M473_SEG / 2;
  const segs = Array.from({ length: M473_SEG }, (_, s) => -(s + 0.5) * (M473_D / M473_SEG));
  const css = `.m473-bob{animation:m473-bob 2.2s ease-in-out infinite alternate}
@keyframes m473-bob{0%{transform:translateY(-8px)}100%{transform:translateY(8px)}}`;
  return (
    <Frame r={root} bg="#06070b">
      <Css css={css} stop=".m473-bob" />
      <Glow code="m473" color="rgba(159,216,255,.4)" at="50% 50%" />
      <div className="m473-stage absolute inset-0" style={{ perspective: "1000px", perspectiveOrigin: "50% 50%" }}>
        {M473_ROOMS.map((room, i) => {
          const z0 = (M473_STOP - m473R(i, M473_STOP)) * M473_D;
          const vis = (zc: number, h: number): CSSProperties => ({ visibility: z0 + zc + h > 600 ? "hidden" : "visible", opacity: Number(m473Fade(z0 + zc).toFixed(3)) });
          const wall = `linear-gradient(90deg, ${room.wall}, color-mix(in srgb, ${room.wall} 70%, #ffffff 8%)), ${room.wall}`;
          return (
            <div key={room.n} className="m473-room absolute left-1/2 top-1/2 h-0 w-0" style={{ transformStyle: "preserve-3d", transform: `translate3d(0,0,${z0}px)` }}>
              {segs.map((zc) => (
                <div key={zc} style={{ transformStyle: "preserve-3d" }}>
                  {/* left + right walls, floor, ceiling: one short slab each */}
                  <div data-z={zc} data-half={half} className="absolute" style={{ ...vis(zc, half), width: half * 2, height: M473_H, left: -half, top: -M473_H / 2, background: wall, transform: `translate3d(${-M473_W / 2}px,0,${zc}px) rotateY(90deg)`, boxShadow: `inset 0 0 0 1px ${room.acc}22` }}>
                    <span className="absolute inset-y-[18%] left-[46%] w-[3px] rounded-full" style={{ background: room.acc, opacity: 0.45 }} />
                  </div>
                  <div data-z={zc} data-half={half} className="absolute" style={{ ...vis(zc, half), width: half * 2, height: M473_H, left: -half, top: -M473_H / 2, background: wall, transform: `translate3d(${M473_W / 2}px,0,${zc}px) rotateY(-90deg)`, boxShadow: `inset 0 0 0 1px ${room.acc}22` }}>
                    <span className="absolute inset-y-[18%] left-[46%] w-[3px] rounded-full" style={{ background: room.acc, opacity: 0.45 }} />
                  </div>
                  <div data-z={zc} data-half={half} className="absolute" style={{ ...vis(zc, half), width: M473_W, height: half * 2, left: -M473_W / 2, top: -half, background: `repeating-linear-gradient(90deg, #0b0c12 0 120px, #11131b 120px 122px)`, transform: `translate3d(0,${M473_H / 2}px,${zc}px) rotateX(90deg)` }} />
                  <div data-z={zc} data-half={half} className="absolute" style={{ ...vis(zc, half), width: M473_W, height: half * 2, left: -M473_W / 2, top: -half, background: `linear-gradient(90deg, #07080c, ${room.wall} 50%, #07080c)`, transform: `translate3d(0,${-M473_H / 2}px,${zc}px) rotateX(-90deg)` }} />
                </div>
              ))}
              {/* doorway frame at the room's entrance */}
              <div data-z={0} className="absolute" style={{ ...vis(0, 0), width: M473_W, height: M473_H, left: -M473_W / 2, top: -M473_H / 2, border: `34px solid ${room.wall}`, outline: `2px solid ${room.acc}66`, outlineOffset: -34 }}>
                <span className="absolute left-1/2 top-[-30px] -translate-x-1/2 whitespace-nowrap text-[20px] font-[600] uppercase tracking-[0.3em]" style={{ color: room.acc, fontFamily: GROTESK }}>
                  {room.n} · {room.t}
                </span>
              </div>
              {/* the exhibit the camera parks in front of */}
              <div data-z={-0.55 * M473_D} className="absolute" style={{ ...vis(-0.55 * M473_D, 0), width: 640, height: 470, left: -320, top: -250, transform: `translate3d(0,0,${-0.55 * M473_D}px)` }}>
                <div className="m473-bob h-full w-full">
                  <div className="h-[380px] w-full overflow-hidden rounded-[18px] shadow-[0_30px_80px_rgba(0,0,0,.6)]" style={{ outline: `2px solid ${room.acc}55` }}>
                    <Img i={room.i} w={1280} h={760} />
                  </div>
                  <p className="mt-4 flex items-baseline justify-between text-[26px] text-white" style={{ fontFamily: SERIF }}>
                    <span>{room.p}</span>
                    <span className="text-[22px]" style={{ color: room.acc, fontFamily: GROTESK }}>
                      {room.c}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="pointer-events-none absolute bottom-[6%] left-[5%] z-10 flex items-center gap-5 text-white" style={{ fontFamily: GROTESK }}>
        <span className="relative block h-[30px] w-[19px] rounded-full border-2 border-white/60">
          <span className="m473-wheel absolute left-1/2 top-[5px] -ml-[2px] block h-[6px] w-[4px] rounded-full bg-white" />
        </span>
        <span className="m473-count text-[14px] uppercase tracking-[0.2em] text-white/75">Room 01 / 04 · The Linen Room</span>
      </div>
      <p className="pointer-events-none absolute right-[5%] top-[6%] z-10 text-right text-[13px] uppercase tracking-[0.2em] text-white/55" style={{ fontFamily: GROTESK }}>
        Maison Orra · walk the house
      </p>
    </Frame>
  );
}

/* ---------- M474 · Gallery on corridor walls (variant of M473: one long hall, frames slide past on both walls) ---------- */
const M474_W = 1180;
const M474_H = 660;
const M474_LEN = 6000; // static wall length (starts at the camera plane, never crosses it)
const M474_S = 520; // spacing between frames (alternating walls)
const M474_ITEMS = [
  ["Field lamp", "₹6,200"],
  ["Oak stool", "₹8,400"],
  ["Clay vase", "₹2,300"],
  ["Wool throw", "₹4,900"],
  ["Brass tray", "₹3,150"],
  ["Linen chair", "₹18,500"],
  ["Stone bowl", "₹1,750"],
  ["Cane mirror", "₹7,600"],
  ["Jute rug", "₹11,900"],
  ["Ash shelf", "₹9,300"],
  ["Glass carafe", "₹1,450"],
];
const M474_N = 22;
const M474_TRAVEL = M474_N * M474_S - 2600;
const m474Z = (i: number) => -(700 + i * M474_S);
const m474Fade = (z: number) => clamp01((520 - z) / 300) * clamp01(1 - (-z - 2600) / 2200);
function m474Frame(i: number, cam: number): CSSProperties {
  const z = m474Z(i) + cam;
  const side = i % 2 === 0 ? -1 : 1;
  return {
    transform: `translate3d(${side * (M474_W / 2 - 3)}px,-40px,${z.toFixed(1)}px) rotateY(${side * -90}deg)`,
    visibility: z + 200 > 640 ? "hidden" : "visible",
    opacity: Number(m474Fade(z).toFixed(3)),
  };
}
function M474() {
  const root = useRef<HTMLDivElement>(null);
  const apply = (p: number) => {
    const el = root.current;
    if (!el) return;
    const cam = p * M474_TRAVEL; // camera along Z, linear over the whole panel
    el.querySelectorAll<HTMLElement>(".m474-frame").forEach((f, i) => {
      const s = m474Frame(i, cam);
      f.style.transform = String(s.transform);
      f.style.visibility = String(s.visibility);
      f.style.opacity = String(s.opacity);
    });
    const lw = el.querySelector<HTMLElement>(".m474-lw");
    const rw = el.querySelector<HTMLElement>(".m474-rw");
    const fl = el.querySelector<HTMLElement>(".m474-fl");
    const cl = el.querySelector<HTMLElement>(".m474-cl");
    if (lw) lw.style.backgroundPosition = `${(-cam).toFixed(1)}px 0`;
    if (rw) rw.style.backgroundPosition = `${cam.toFixed(1)}px 0`;
    if (fl) fl.style.backgroundPosition = `0 ${cam.toFixed(1)}px`;
    if (cl) cl.style.backgroundPosition = `0 ${(-cam).toFixed(1)}px`;
    const cnt = el.querySelector<HTMLElement>(".m474-count");
    const near = Math.min(M474_N, Math.max(1, Math.round((cam - 700) / M474_S) + 3));
    if (cnt) cnt.textContent = `Frame ${String(near).padStart(2, "0")} of ${M474_N}`;
  };
  useScrub(root, apply, { finalValue: 1 });
  const wallBg = "repeating-linear-gradient(90deg, #1a1612 0 258px, #2a231b 258px 260px), #1a1612";
  const css = `.m474-light{animation:m474-light 2.6s ease-in-out infinite alternate}
@keyframes m474-light{0%{opacity:.55;transform:translate(-50%,-50%) scale(.92)}100%{opacity:1;transform:translate(-50%,-50%) scale(1.1)}}`;
  return (
    <Frame r={root} bg="#070605">
      <Css css={css} stop=".m474-light" />
      <Glow code="m474" color="rgba(255,213,154,.36)" at="50% 50%" />
      <div className="absolute inset-0" style={{ perspective: "900px" }}>
        <div className="absolute left-1/2 top-1/2 h-0 w-0" style={{ transformStyle: "preserve-3d" }}>
          <span className="m474-light absolute h-[260px] w-[200px] rounded-[40%]" style={{ background: "radial-gradient(closest-side, rgba(255,230,190,.85), rgba(255,180,90,.2) 60%, transparent)", transform: "translate(-50%,-50%)" }} aria-hidden />
          <div className="m474-lw absolute" style={{ width: M474_LEN, height: M474_H, left: -M474_LEN / 2, top: -M474_H / 2, background: wallBg, transform: `translate3d(${-M474_W / 2}px,0,${-M474_LEN / 2}px) rotateY(90deg)`, maskImage: "linear-gradient(90deg, #000 40%, transparent)", WebkitMaskImage: "linear-gradient(90deg, #000 40%, transparent)" }} />
          <div className="m474-rw absolute" style={{ width: M474_LEN, height: M474_H, left: -M474_LEN / 2, top: -M474_H / 2, background: wallBg, transform: `translate3d(${M474_W / 2}px,0,${-M474_LEN / 2}px) rotateY(-90deg)`, maskImage: "linear-gradient(270deg, #000 40%, transparent)", WebkitMaskImage: "linear-gradient(270deg, #000 40%, transparent)" }} />
          <div className="m474-fl absolute" style={{ width: M474_W, height: M474_LEN, left: -M474_W / 2, top: -M474_LEN / 2, background: "repeating-linear-gradient(180deg, #0e0c0a 0 178px, #2b2318 178px 181px), #0e0c0a", transform: `translate3d(0,${M474_H / 2}px,${-M474_LEN / 2}px) rotateX(90deg)`, maskImage: "linear-gradient(0deg, #000 40%, transparent)", WebkitMaskImage: "linear-gradient(0deg, #000 40%, transparent)" }} />
          <div className="m474-cl absolute" style={{ width: M474_W, height: M474_LEN, left: -M474_W / 2, top: -M474_LEN / 2, background: "repeating-linear-gradient(180deg, #0a0908 0 340px, #3a2f20 340px 346px), #0a0908", transform: `translate3d(0,${-M474_H / 2}px,${-M474_LEN / 2}px) rotateX(-90deg)`, maskImage: "linear-gradient(180deg, #000 40%, transparent)", WebkitMaskImage: "linear-gradient(180deg, #000 40%, transparent)" }} />
          {Array.from({ length: M474_N }, (_, i) => {
            const [n, pr] = M474_ITEMS[i % M474_ITEMS.length];
            return (
              <div key={i} className="m474-frame absolute" style={{ width: 380, height: 320, left: -190, top: -160, ...m474Frame(i, 0) }}>
                <div className="h-[250px] w-full overflow-hidden border-[10px] border-[#d8c3a0] bg-black shadow-[0_18px_40px_rgba(0,0,0,.6)]">
                  <Img i={i % 4} w={760} h={500} />
                </div>
                <p className="mt-3 flex justify-between text-[20px] text-[#f4e7d2]" style={{ fontFamily: SERIF }}>
                  <span>
                    No. {String(i + 1).padStart(2, "0")} · {n}
                  </span>
                  <span className="text-[#ffd59a]">{pr}</span>
                </p>
              </div>
            );
          })}
        </div>
      </div>
      <div className="pointer-events-none absolute left-[5%] top-[6%] z-10 text-[#fff6e8]">
        <p className="text-[13px] uppercase tracking-[0.2em] text-white/55" style={{ fontFamily: GROTESK }}>
          Common House · the long hall
        </p>
        <h3 className="mt-2 text-[clamp(32px,3.2vw,52px)] leading-none" style={{ fontFamily: EDITORIAL }}>
          Walk the autumn objects
        </h3>
      </div>
      <p className="m474-count pointer-events-none absolute bottom-[6%] right-[5%] z-10 text-[14px] uppercase tracking-[0.2em] text-white/70" style={{ fontFamily: GROTESK }}>
        Frame 01 of 22
      </p>
    </Frame>
  );
}

export const DEFS: MotionDef[] = [
  {
    code: "M470",
    name: "Logo collapses to monogram",
    how: "Scroll: the header shrinks and the wordmark's middle letters slide into their initials and fade, leaving a ringed monogram.",
    kind: "scrub",
    C: M470,
  },
  {
    code: "M471",
    name: "Nav detaches into floating pill",
    how: "Scroll: past the hero the full-width nav bar shrinks into a centred, blurred floating pill; scrolling back up docks it again.",
    kind: "scrub",
    C: M471,
  },
  {
    code: "M472",
    name: "Vanishing-point image rails",
    how: "Scroll: two rails of images stream out of a central vanishing point to both edges, growing and turning as they go.",
    kind: "scrub",
    C: M472,
  },
  {
    code: "M473",
    name: "Corridor walk, one room per stop",
    how: "Auto: a CSS 3D camera walks a corridor one room per step, parking in front of each room's piece before the next glide.",
    kind: "play",
    C: M473,
  },
  {
    code: "M474",
    name: "Gallery on corridor walls",
    how: "Scroll: the camera moves down a long 3D hall and framed products hung on both walls slide past left and right.",
    kind: "scrub",
    C: M474,
  },
];
