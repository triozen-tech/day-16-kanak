"use client";

// GL · Gallery layouts, batch 2 (docs/SECTION-MENU.md): GL11 zoom parallax cluster, GL12 rotating image sphere beside
// copy, GL13 pinned horizontal gallery with counter, GL14 grid that morphs into a slideshow.
// Each keeps moving while on screen (hands-free for filming) and shows its final state in ?static=1.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { scene, useTicker } from "../fx/shared";
import { Btn, H, P, Pic, Price, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/* ───────────────────────────── GL11 · Zoom parallax cluster ───────────────────────────── */

// centre + 6 satellites: box size, offset from the screen centre, and the scale each layer reaches (centre: 4 = full screen)
const CLUSTER = [
  { i: 0, w: 25, h: 25, x: 0, y: 0, s: 4 },
  { i: 1, w: 35, h: 30, x: 5, y: -30, s: 5 },
  { i: 2, w: 20, h: 45, x: -25, y: -10, s: 6 },
  { i: 3, w: 25, h: 25, x: 27.5, y: 0, s: 5 },
  { i: 1, w: 20, h: 25, x: 5, y: 27.5, s: 6 },
  { i: 2, w: 30, h: 25, x: -22.5, y: 27.5, s: 8 },
  { i: 3, w: 15, h: 15, x: 25, y: 22.5, s: 9 },
];
const GL11_CSS = `.gl11-kb{animation:gl11-kb 5.6s ease-in-out infinite alternate}.gl11-kb.alt{animation-duration:7.4s;animation-direction:alternate-reverse}@keyframes gl11-kb{from{transform:scale(1) translate(0,0)}to{transform:scale(1.1) translate(-2%,-1.5%)}}.is-static .gl11-kb{animation:none}html.is-static {.gl11-kb{animation:none}}`;

/** GL11 · A centre image and six satellites zoom at different speeds with the scroll until the centre fills the screen. */
function GL11() {
  const r = useRef<HTMLDivElement>(null);
  const outer = useRef<HTMLDivElement>(null);
  const layers = useRef<(HTMLDivElement | null)[]>([]);
  const centreImg = useRef<HTMLImageElement>(null);
  const caption = useRef<HTMLDivElement>(null);
  const [still, setStill] = useState(false);
  useSectionMotion(r, "M13"); // the header copy; the cluster zoom below is this layout's own scrubbed M13
  useEffect(() => {
    const el = outer.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      setStill(true);
      return;
    }
    const update = (p: number) => {
      const t = easeInOut(clamp01(p / 0.86));
      layers.current.forEach((l, k) => {
        if (l) l.style.transform = `scale(${1 + (CLUSTER[k].s - 1) * t})`;
      });
      if (centreImg.current) centreImg.current.style.transform = `scale(${1.3 - 0.3 * t})`;
      if (caption.current) caption.current.style.opacity = String(clamp01((p - 0.72) / 0.2));
    };
    const st = ScrollTrigger.create({ trigger: el, start: "top top", end: "bottom bottom", onUpdate: (s) => update(s.progress), onRefresh: (s) => update(s.progress) });
    update(st.progress);
    return () => st.kill();
  }, []);
  return (
    <Sec innerRef={r} theme="ink" font="serif" full style={{ overflow: "clip" }}>
      <style>{GL11_CSS}</style>
      <div className="grid grid-cols-1 items-end gap-6 px-[clamp(20px,5vw,96px)] pb-[clamp(32px,4vw,56px)] pt-[clamp(72px,9vw,140px)] md:grid-cols-12">
        <H className="text-[clamp(44px,5.6vw,96px)] md:col-span-7">Seven rooms on one lagoon.</H>
        <div className="md:col-span-5 md:pb-2">
          <P className="max-w-[40ch]">A restored tharavad on the Vembanad backwaters. Wake to egrets, eat what the boatman caught at dawn.</P>
          <div className="mt-6 flex flex-wrap items-center gap-5">
            <Btn>Check dates</Btn>
            <span className="text-[14px] text-[var(--sx-muted)]">from <Price now="₹18,500" className="text-[var(--sx-text)]" /> a night</span>
          </div>
        </div>
      </div>
      <div ref={outer} className={still ? "" : "h-[200svh]"}>
        <div className={`${still ? "relative" : "sticky top-0"} h-[100svh] min-h-[560px] overflow-hidden`}>
          {CLUSTER.map((c, k) => (
            <div key={k} ref={(n) => void (layers.current[k] = n)} className="pointer-events-none absolute inset-0 grid place-items-center will-change-transform" style={{ zIndex: k ? 1 : 2 }}>
              <div className="relative overflow-hidden rounded-[clamp(6px,0.8vw,12px)]" style={{ width: `${c.w}vw`, height: `${c.h}svh`, transform: `translate(${c.x}vw, ${c.y}svh)` }}>
                <div className={`gl11-kb ${k % 2 ? "alt" : ""} absolute inset-0`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img ref={k ? undefined : centreImg} src={scene(c.i, 1200, 900, "")} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
                </div>
              </div>
            </div>
          ))}
          <div ref={caption} className={`absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-end justify-between gap-6 bg-[linear-gradient(180deg,transparent,rgba(7,9,15,.75))] px-[clamp(20px,5vw,96px)] pb-[clamp(28px,4vw,56px)] pt-24 ${still ? "hidden" : ""}`} style={{ opacity: 0 }}>
            <p className="sx-display max-w-[16ch] text-[clamp(36px,4.4vw,72px)] leading-[1] text-white">The Lagoon Suite, on stilts.</p>
            <p className="text-[15px] text-white/80">
              62 m² · private jetty · <Price now="₹32,000" className="text-white" />
            </p>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────────── GL12 · Rotating image sphere beside copy ───────────────────────────── */

const FLAVOURS = ["Yuzu chilli", "Kokum mint", "Guava salt", "Jamun", "Tender coconut", "Ginger lime", "Mango kesar", "Hibiscus", "Litchi rose", "Kala khatta"];
const SWATCH = ["#e9d34a", "#7a2f5b", "#e86a5a", "#4b2a5c", "#d8e6c8", "#a7c84a", "#f2a33a", "#c23a5b", "#f3b6c0", "#3a2350"];
const N = 32;
const SPHERE = Array.from({ length: N }, (_, k) => {
  const y = 1 - (k / (N - 1)) * 2;
  const rad = Math.sqrt(1 - y * y);
  const th = k * Math.PI * (3 - Math.sqrt(5));
  return { x: Math.cos(th) * rad, y, z: Math.sin(th) * rad, swatch: k % 3 === 0 ? (k / 3) % FLAVOURS.length : -1, i: k % 4 };
});

/** GL12 · Copy left; on the right a sphere of 32 round thumbnails and flavour swatches turns slowly (drag to spin). */
function GL12() {
  const r = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLDivElement | null)[]>([]);
  const rot = useRef({ ay: 0.4, ax: -0.28, v: 0, drag: false, lx: 0 });
  useSectionMotion(r, "M6");

  const place = () => {
    const b = box.current;
    if (!b) return;
    const R = b.clientWidth * 0.4;
    const { ay, ax } = rot.current;
    const [sy, cy, sx, cx] = [Math.sin(ay), Math.cos(ay), Math.sin(ax), Math.cos(ax)];
    SPHERE.forEach((p, k) => {
      const el = items.current[k];
      if (!el) return;
      const x1 = p.x * cy + p.z * sy;
      const z1 = -p.x * sy + p.z * cy;
      const y2 = p.y * cx - z1 * sx;
      const z2 = p.y * sx + z1 * cx;
      const d = (z2 + 1) / 2; // 0 far … 1 near
      el.style.transform = `translate(-50%, -50%) translate3d(${x1 * R}px, ${y2 * R}px, 0) scale(${0.45 + d * 0.65})`;
      el.style.opacity = String(0.18 + d * 0.82);
      el.style.zIndex = String(Math.round(d * 100));
      el.style.filter = d < 0.4 ? `blur(${(0.4 - d) * 4}px)` : "none";
    });
  };
  useEffect(() => {
    place();
    const ro = new ResizeObserver(place);
    if (box.current) ro.observe(box.current);
    return () => ro.disconnect();
  }, []);
  // M33: a slow orbit that never stops while on screen; dragging adds spin that eases back to the idle speed
  useTicker(r, (t, dt) => {
    const s = rot.current;
    if (!s.drag) {
      s.ay += (0.32 + s.v) * dt;
      s.v *= 0.95;
    }
    s.ax = -0.28 + Math.sin(t * 0.6) * 0.12;
    place();
  });

  return (
    <Sec innerRef={r} theme="stone" font="wide" className="py-[clamp(72px,9vw,140px)]">
      <div className="grid grid-cols-1 items-center gap-[clamp(32px,4vw,64px)] md:grid-cols-12">
        <div className="md:col-span-5">
          <H className="text-[clamp(38px,4.2vw,68px)]">Thirty flavours, one fridge.</H>
          <P className="mt-6 max-w-[40ch]">Yuzu chilli to kala khatta: every can is 0 g sugar and 120 mg of green-tea caffeine. Mix any twelve into one case.</P>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Btn>Build a mixed case</Btn>
            <Price now="₹1,440" was="₹1,680" className="text-[18px]" />
          </div>
          <p className="mt-6 text-[14px] text-[var(--sx-muted)]">Drag the sphere to browse. New flavour every month.</p>
        </div>
        <div className="md:col-span-7">
          <div
            ref={box}
            className="relative mx-auto aspect-square w-full max-w-[620px] cursor-grab touch-none select-none active:cursor-grabbing"
            onPointerDown={(e) => {
              rot.current.drag = true;
              rot.current.lx = e.clientX;
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              const s = rot.current;
              if (!s.drag) return;
              const dx = e.clientX - s.lx;
              s.lx = e.clientX;
              s.ay += dx * 0.006;
              s.v = gsap.utils.clamp(-3, 3, dx * 0.08);
              place();
            }}
            onPointerUp={() => (rot.current.drag = false)}
            onPointerCancel={() => (rot.current.drag = false)}
            data-cursor="Drag"
          >
            <div className="absolute inset-[14%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_22%,transparent),transparent)]" />
            {SPHERE.map((p, k) => (
              <div key={k} ref={(n) => void (items.current[k] = n)} className="absolute left-1/2 top-1/2 will-change-transform">
                {p.swatch >= 0 ? (
                  <div className="grid h-[clamp(64px,6vw,88px)] w-[clamp(64px,6vw,88px)] place-items-center rounded-full p-2 text-center text-[12px] font-[700] leading-tight text-white shadow-[0_10px_24px_-10px_rgba(0,0,0,.5)]" style={{ background: SWATCH[p.swatch] }}>
                    <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,.45)]">{FLAVOURS[p.swatch]}</span>
                  </div>
                ) : (
                  <div className="h-[clamp(56px,5vw,76px)] w-[clamp(56px,5vw,76px)] overflow-hidden rounded-full border-2 border-[var(--sx-surface)] shadow-[0_10px_24px_-10px_rgba(0,0,0,.45)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={scene(p.i, 200, 200, "")} alt="" className="h-full w-full object-cover" draggable={false} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────────── GL13 · Pinned horizontal gallery with counter ───────────────────────────── */

const ROOMS = [
  { w: 30, t: "Entrance", d: "Athangudi tiles, laid by hand" },
  { w: 20, t: "Hallway", d: "Lime-plaster arches" },
  { w: 26, t: "Living room", d: "Teak daybed, ₹86,000" },
  { w: 36, t: "Courtyard", d: "Open to the monsoon" },
  { w: 22, t: "Reading nook", d: "Cane chair, ₹24,500" },
  { w: 28, t: "Kitchen", d: "Kadappa stone counters" },
  { w: 24, t: "Dining", d: "Ten-seat jackwood table" },
  { w: 34, t: "Main bedroom", d: "Handloom linen, ₹12,800 a set" },
  { w: 20, t: "Bath", d: "Terrazzo, poured in place" },
  { w: 28, t: "Study", d: "Brass desk lamp, ₹9,400" },
  { w: 26, t: "Balcony", d: "Planters from Khurja" },
  { w: 32, t: "Terrace", d: "Evening light over Fort Kochi" },
];
const GL13_CSS = `.gl13-kb img{animation:gl13-kb 5s ease-in-out infinite alternate}.gl13-kb.alt img{animation-duration:6.8s;animation-direction:alternate-reverse}@keyframes gl13-kb{from{transform:scale(1.04)}to{transform:scale(1.14) translate(-2%,0)}}.gl13-roll{display:inline-block;animation:gl13-roll .55s cubic-bezier(.22,1,.36,1)}@keyframes gl13-roll{from{transform:translateY(100%)}}.is-static .gl13-kb img,.is-static .gl13-roll{animation:none}html.is-static {.gl13-kb img,.gl13-roll{animation:none}}`;

/** GL13 · The section pins and a single row of mixed-width images slides sideways (skewing with scroll speed); 03/12 counter bottom-right. */
function GL13() {
  const r = useRef<HTMLDivElement>(null);
  const outer = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const m = useRef({ x: 0, skew: 0, target: 0 });
  const [idx, setIdx] = useState(0);
  const [still, setStill] = useState(false);
  useEffect(() => {
    const el = outer.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      setStill(true);
      return;
    }
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (s) => {
        const max = (track.current?.scrollWidth ?? 0) - (stage.current?.clientWidth ?? 0);
        m.current.x = -Math.max(0, max) * s.progress;
        m.current.target = gsap.utils.clamp(-7, 7, s.getVelocity() / -350);
        setIdx(Math.min(ROOMS.length - 1, Math.floor(s.progress * ROOMS.length)));
      },
    });
    return () => st.kill();
  }, []);
  // M41: the row follows the scroll and leans with its speed, easing back upright
  useTicker(r, () => {
    const s = m.current;
    s.skew += (s.target - s.skew) * 0.12;
    s.target *= 0.9;
    if (track.current) track.current.style.transform = `translate3d(${s.x}px,0,0) skewX(${s.skew.toFixed(2)}deg)`;
  });
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <Sec innerRef={r} theme="paper" font="editorial" full style={{ overflow: "clip" }}>
      <style>{GL13_CSS}</style>
      <div ref={outer} className={still ? "" : "h-[200svh]"}>
        <div ref={stage} className={`${still ? "relative py-[clamp(72px,9vw,140px)]" : "sticky top-0 h-[100svh]"} flex min-h-[620px] flex-col justify-center gap-[clamp(28px,4svh,48px)] overflow-hidden`}>
          <div className="flex flex-wrap items-end justify-between gap-6 px-[clamp(20px,5vw,96px)]">
            <H className="max-w-[16ch] text-[clamp(44px,5vw,88px)]">The Kochi house, room by room.</H>
            <div className="max-w-[36ch] pb-2">
              <P>A 1920s merchant home, restored with Kerala craftspeople. Everything you see is in the shop.</P>
              <div className="mt-5">
                <Btn kind="link">Shop the house →</Btn>
              </div>
            </div>
          </div>
          <div className={still ? "overflow-x-auto" : ""}>
            <div ref={track} className="flex w-max gap-[2vw] px-[clamp(20px,5vw,96px)] will-change-transform">
              {ROOMS.map((room, k) => (
                <figure key={room.t} className="shrink-0" style={{ width: `${room.w}vw` }} data-cursor="View">
                  <div className={`gl13-kb ${k % 2 ? "alt" : ""} relative h-[clamp(260px,46svh,520px)] overflow-hidden rounded-[var(--sx-radius)]`}>
                    <Pic i={k % 4} ratio="auto" round={false} className="absolute inset-0 h-full w-full" />
                  </div>
                  <figcaption className="mt-3 flex items-baseline justify-between gap-4">
                    <span className="sx-display text-[clamp(20px,1.7vw,28px)] leading-none">{room.t}</span>
                    <span className="truncate text-[13px] text-[var(--sx-muted)]">{room.d}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
          <div className={`${still ? "mt-6 px-[clamp(20px,5vw,96px)] text-right" : "absolute bottom-[clamp(20px,3vw,40px)] right-[clamp(20px,5vw,96px)]"} sx-display text-[clamp(28px,2.6vw,44px)] leading-none tabular-nums`}>
            <span className="inline-block overflow-hidden align-bottom">
              <span key={idx} className="gl13-roll">{pad(idx + 1)}</span>
            </span>
            <span className="text-[var(--sx-muted)]"> / {pad(ROOMS.length)}</span>
          </div>
        </div>
      </div>
    </Sec>
  );
}

/* ───────────────────────────── GL14 · Grid that morphs into a slideshow ───────────────────────────── */

const PIECES = [
  { n: "Moss bowl", p: "₹1,450", i: 2 },
  { n: "Ash carafe", p: "₹2,200", i: 1 },
  { n: "Rust plate set", p: "₹3,600", i: 3 },
  { n: "Tide mugs, pair", p: "₹1,800", i: 0 },
  { n: "Salt cellar", p: "₹650", i: 2 },
  { n: "Kiln vase", p: "₹4,200", i: 3 },
  { n: "Rain teapot", p: "₹3,100", i: 1 },
  { n: "Pebble cups, set of 4", p: "₹2,400", i: 0 },
];
const GL14_CSS = `.gl14-kb img{animation:gl14-kb 4.8s ease-in-out infinite alternate}.gl14-kb.alt img{animation-duration:6.4s;animation-direction:alternate-reverse}@keyframes gl14-kb{from{transform:scale(1.03)}to{transform:scale(1.13) translate(1.5%,-1.5%)}}.is-static .gl14-kb img{animation:none}html.is-static {.gl14-kb img{animation:none}}`;

/** GL14 · A 4-column grid; picking a tile morphs the grid into a slideshow (that tile large, the rest a thumbnail row). Auto-plays. */
function GL14() {
  const r = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLDivElement | null)[]>([]);
  const first = useRef<(DOMRect | null)[]>([]);
  const [view, setView] = useState<{ mode: "grid" | "slide"; sel: number }>({ mode: "grid", sel: 0 });
  const hold = useRef(false);
  useSectionMotion(r, "M34");

  const go = (mode: "grid" | "slide", sel: number) => {
    first.current = items.current.map((el) => el?.getBoundingClientRect() ?? null);
    setView({ mode, sel });
  };
  // FLIP: every tile glides from where it was to its new cell
  useLayoutEffect(() => {
    if (!first.current.length) return;
    items.current.forEach((el, k) => {
      const a = first.current[k];
      if (!el || !a) return;
      const b = el.getBoundingClientRect();
      if (!b.width || !b.height) return;
      gsap.fromTo(
        el,
        { x: a.left - b.left, y: a.top - b.top, scaleX: a.width / b.width, scaleY: a.height / b.height, transformOrigin: "0 0" },
        { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.9, ease: "power3.inOut", overwrite: true },
      );
    });
    first.current = [];
  }, [view]);
  // hands-free: grid → slideshow of tile k → grid → slideshow of tile k+1 …
  const viewRef = useRef(view);
  viewRef.current = view;
  useEffect(() => {
    const el = r.current;
    if (!el || prefersReducedMotion()) return;
    let t: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(t);
      if (e.isIntersecting)
        t = setInterval(() => {
          if (hold.current) return;
          const v = viewRef.current;
          if (v.mode === "grid") go("slide", v.sel);
          else go("grid", (v.sel + 3) % PIECES.length);
        }, 2100);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, []);

  const slide = view.mode === "slide";
  const cur = PIECES[view.sel];
  return (
    <Sec innerRef={r} theme="ink" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <style>{GL14_CSS}</style>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <H className="max-w-[14ch] text-[clamp(44px,5.4vw,92px)]">Stoneware, glazed by hand.</H>
        <div className="max-w-[36ch] pb-2">
          <P>Eight pieces from a two-kiln studio in Pondicherry. Wood-fired, food safe, each one a little different.</P>
          <div className="mt-5 flex items-center gap-5">
            <Btn>Shop ceramics</Btn>
            <button type="button" onClick={() => go(slide ? "grid" : "slide", view.sel)} className="sx-btn-link">
              {slide ? "Back to grid" : "Slideshow"}
            </button>
          </div>
        </div>
      </div>
      <div
        className={`mt-[clamp(36px,4.5vw,64px)] grid h-[clamp(520px,44vw,680px)] gap-[clamp(8px,1vw,14px)] ${slide ? "grid-cols-7 grid-rows-[minmax(0,1fr)_clamp(64px,6.4vw,104px)]" : "grid-cols-2 grid-rows-4 md:grid-cols-4 md:grid-rows-2"}`}
        onPointerEnter={() => (hold.current = true)}
        onPointerLeave={() => (hold.current = false)}
      >
        {PIECES.map((p, k) => {
          const big = slide && k === view.sel;
          return (
            <div
              key={p.n}
              ref={(n) => void (items.current[k] = n)}
              onClick={() => go(big ? "grid" : "slide", k)}
              className="relative min-h-0 min-w-0 cursor-pointer overflow-hidden rounded-[clamp(8px,1vw,16px)]"
              style={slide ? (big ? { gridArea: "1 / 2 / 2 / 7" } : { gridRow: "2" }) : undefined}
              data-cursor={big ? "Close" : "Open"}
            >
              <div data-m-card className={`gl14-kb ${k % 2 ? "alt" : ""} absolute inset-0`}>
                <Pic i={p.i} ratio="auto" round={false} className="absolute inset-0 h-full w-full" />
              </div>
              {!slide && (
                <p className="absolute bottom-3 left-3 rounded-full bg-black/45 px-3 py-1.5 text-[13px] font-[600] text-white backdrop-blur">{p.n}</p>
              )}
              {big && (
                <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 bg-[linear-gradient(180deg,transparent,rgba(7,9,15,.8))] p-[clamp(18px,2.4vw,36px)] pt-20 text-white">
                  <div>
                    <p className="sx-display text-[clamp(28px,3vw,48px)] font-[700] leading-none">{cur.n}</p>
                    <p className="mt-2 text-[14px] text-white/75">
                      {pad2(k + 1)} / {pad2(PIECES.length)} · wood-fired stoneware
                    </p>
                  </div>
                  <Price now={cur.p} className="text-[20px]" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Sec>
  );
}
const pad2 = (n: number) => String(n).padStart(2, "0");

export const DEFS: SectionDef[] = [
  { code: "GL11", name: "Zoom parallax cluster", motion: "M13", C: GL11 },
  { code: "GL12", name: "Rotating image sphere beside copy", motion: "M33", C: GL12 },
  { code: "GL13", name: "Pinned horizontal gallery with counter", motion: "M41", C: GL13 },
  { code: "GL14", name: "Grid that morphs into a slideshow", motion: "M34", C: GL14 },
];
