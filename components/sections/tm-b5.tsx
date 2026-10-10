"use client";

// TM · Team layouts, batch 5 (docs/SECTION-MENU.md).
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Flip as FlipT } from "gsap/Flip";
import { loadPlugin, prefersReducedMotion } from "@/lib/gsap";
import { useTicker } from "../fx/shared";
import { Avatar, Btn, H, P, Pic, Sec } from "./kit";
import { useSectionMotion } from "./motion";
import type { SectionDef } from "./types";

type FlipState = ReturnType<typeof FlipT.getState>;

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

const TM_CSS = `
.tm5-roam{animation:tm5-roam-x 5.2s linear infinite alternate,tm5-roam-y 3.4s linear infinite alternate}
@keyframes tm5-roam-x{from{left:-10%}to{left:62%}}
@keyframes tm5-roam-y{from{top:-20%}to{top:40%}}
.tm5-tip{animation:tm5-tip .45s cubic-bezier(.2,.8,.2,1) both}
@keyframes tm5-tip{from{opacity:0;margin-top:8px}to{opacity:1;margin-top:0}}
html.is-static .tm5-roam,html.is-static .tm5-tip{animation:none}
html.is-static {.tm5-roam,.tm5-tip{animation:none}}
`;

/* ───────────────────────── TM09 · Team grid with department filter ───────────────────────── */

const DEPTS = ["All", "Kitchen", "Front of house", "Studio"] as const;
type Dept = (typeof DEPTS)[number];
const TEAM: { n: string; r: string; d: Exclude<Dept, "All">; i: number }[] = [
  { n: "Ira Menon", r: "Head chef", d: "Kitchen", i: 3 },
  { n: "Kabir Shah", r: "General manager", d: "Front of house", i: 0 },
  { n: "Tara Kulkarni", r: "Pastry lead", d: "Studio", i: 1 },
  { n: "Rohan Pillai", r: "Sous chef", d: "Kitchen", i: 2 },
  { n: "Meera Das", r: "Sommelier", d: "Front of house", i: 3 },
  { n: "Arjun Bose", r: "Grill", d: "Kitchen", i: 0 },
  { n: "Nisha Rao", r: "Ceramicist", d: "Studio", i: 2 },
  { n: "Dev Malhotra", r: "Head of service", d: "Front of house", i: 1 },
  { n: "Sana Qureshi", r: "Fermentation", d: "Kitchen", i: 3 },
  { n: "Vikram Iyer", r: "Bread", d: "Studio", i: 0 },
  { n: "Leela Joshi", r: "Host", d: "Front of house", i: 2 },
  { n: "Omar Sheikh", r: "Larder", d: "Kitchen", i: 1 },
  { n: "Pooja Nair", r: "Florals", d: "Studio", i: 3 },
  { n: "Aditya Sen", r: "Bar lead", d: "Front of house", i: 0 },
  { n: "Ritu Ghosh", r: "Pastry", d: "Kitchen", i: 2 },
];

/** TM09 · Department chips over a 5-column grid of square portraits. A chip picks itself every couple of seconds; that
 *  department's people slide to the front of the grid and the rest step back (dimmed), so the grid keeps its size. */
function TM09() {
  const r = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  useSectionMotion(r, "M34");
  const [k, setK] = useAutoCycle(r, DEPTS.length, 2000);
  const [dept, setDept] = useState<Dept>("All");
  const F = useRef<typeof FlipT | null>(null);
  const st = useRef<FlipState | null>(null);
  useEffect(() => {
    loadPlugin("Flip").then((f) => (F.current = f as typeof FlipT));
  }, []);
  useEffect(() => {
    const next = DEPTS[k];
    if (next === dept) return;
    if (F.current && grid.current) st.current = F.current.getState(grid.current.querySelectorAll("[data-flip-id]"));
    setDept(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k]);
  useLayoutEffect(() => {
    const s = st.current;
    if (!F.current || !s || !grid.current) return;
    st.current = null;
    F.current.from(s, { targets: grid.current.querySelectorAll("[data-flip-id]"), duration: 0.9, ease: "power3.inOut", stagger: 0.025 });
  }, [dept]);

  const match = (d: string) => dept === "All" || d === dept;
  const order = [...TEAM.filter((t) => match(t.d)), ...TEAM.filter((t) => !match(t.d))];
  const count = TEAM.filter((t) => match(t.d)).length;

  return (
    <Sec innerRef={r} theme="paper" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      <style>{TM_CSS}</style>
      {/* a warm light roaming behind the header and the grid gaps */}
      <div className="tm5-roam pointer-events-none absolute aspect-square w-[46%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_42%,transparent),transparent)]" />
      <div className="relative grid grid-cols-1 items-end gap-[clamp(24px,4vw,64px)] md:grid-cols-12">
        <H className="text-[clamp(44px,5.4vw,92px)] md:col-span-7">Fifteen people, one long table.</H>
        <div className="md:col-span-5 md:pb-2">
          <P>The people behind Saffron Yard in Panjim: a kitchen of six, a floor of five and a studio that makes our bread, plates and flowers.</P>
        </div>
      </div>

      <div className="relative mt-[clamp(32px,4vw,56px)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2" role="tablist">
          {DEPTS.map((d, n) => (
            <button key={d} role="tab" aria-selected={d === dept} onClick={() => setK(n)} className={`rounded-full border px-5 py-2.5 text-[15px] font-[600] transition-colors duration-500 ${d === dept ? "border-[var(--sx-text)] bg-[var(--sx-text)] text-[var(--sx-bg)]" : "border-[var(--sx-line)] text-[var(--sx-muted)]"}`}>
              {d}
              <span className="ml-2 tabular-nums opacity-60">{d === "All" ? TEAM.length : TEAM.filter((t) => t.d === d).length}</span>
            </button>
          ))}
        </div>
        <p className="text-[14px] text-[var(--sx-muted)]">
          Showing <b className="tabular-nums text-[var(--sx-text)]">{count}</b> of {TEAM.length} · <a href="#" onClick={(e) => e.preventDefault()} className="underline underline-offset-2">We&apos;re hiring two cooks</a>
        </p>
      </div>

      <div ref={grid} className="relative mt-[clamp(24px,3vw,40px)] grid grid-cols-2 gap-x-[clamp(12px,1.4vw,24px)] gap-y-[clamp(20px,2vw,32px)] md:grid-cols-5">
        {order.map((t) => {
          const on = match(t.d);
          return (
            <figure key={t.n} data-flip-id={t.n} className={`transition-[opacity,filter] duration-700 ${on ? "" : "opacity-30 grayscale"}`}>
              <div data-m-card className="overflow-hidden rounded-[14px]">
                <Pic i={t.i} ratio="1/1" round={false} label="" />
              </div>
              <figcaption className="mt-3">
                <p className="text-[16px] font-[650] leading-tight">{t.n}</p>
                <p className="mt-0.5 text-[14px] text-[var(--sx-muted)]">
                  {t.r} · {t.d === "Front of house" ? "Floor" : t.d}
                </p>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </Sec>
  );
}

/* ───────────────────────── TM10 · Team card with avatar-pinned globe ───────────────────────── */

const GROWERS = [
  { n: "Kofi Mensah", r: "Cacao, Ashanti", lat: 6.7, lon: -1.6 },
  { n: "Ira Menon", r: "Cacao, Idukki", lat: 9.8, lon: 77.0 },
  { n: "Lucía Paredes", r: "Cacao, Esmeraldas", lat: 0.9, lon: -79.6 },
  { n: "Hoa Nguyen", r: "Cacao, Bến Tre", lat: 10.2, lon: 106.4 },
  { n: "Rina Tamba", r: "Cacao, Sulawesi", lat: -2.0, lon: 120.0 },
  { n: "Feno Rakoto", r: "Cacao, Sambirano", lat: -13.6, lon: 48.5 },
  { n: "Abeni Okafor", r: "Vanilla, Cross River", lat: 5.9, lon: 8.6 },
  { n: "Tomás Rivera", r: "Cacao, Chiapas", lat: 15.3, lon: -92.6 },
];
// fixed pseudo-random "land" dots, so the globe reads as a sphere while it turns
const DOTS = Array.from({ length: 520 }, (_, k) => {
  const a = Math.sin(k * 12.9898) * 43758.5453;
  const b = Math.sin(k * 78.233) * 12345.6789;
  return { lat: Math.asin(2 * (a - Math.floor(a)) - 1) * (180 / Math.PI), lon: (b - Math.floor(b)) * 360 - 180 };
});
const TILT = 18; // degrees the view looks down from above the equator
const rad = Math.PI / 180;

/** Orthographic projection: x, y on a unit sphere (y up) and depth (cos of the angle from the view centre). */
function project(lat: number, lon: number, rot: number) {
  const p = lat * rad;
  const l = (lon + rot) * rad;
  const p0 = TILT * rad;
  const x = Math.cos(p) * Math.sin(l);
  const y = Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l);
  const z = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l);
  return { x, y, z };
}

/** TM10 · One card: title and a one-line text at the top; the lower part holds a large globe cropped by the card's edge,
 *  turning slowly, with the growers' round avatars pinned where they farm. The pin facing you shows its name. */
function TM10() {
  const r = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const pins = useRef<(HTMLDivElement | null)[]>([]);
  const rot = useRef(-20);
  const [front, setFront] = useState(1);
  const lastFront = useRef(1);

  const draw = () => {
    const st = stage.current;
    const c = cv.current;
    if (!st || !c) return;
    const w = st.clientWidth;
    const h = st.clientHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const R = w * 0.46;
    const cx = w / 2;
    const cy = R * 1.06; // centre so the top of the globe sits near the stage top; the card edge crops the rest
    const css = getComputedStyle(st);
    const fg = css.getPropertyValue("--sx-text").trim() || "#eef2f7";
    const ac = css.getPropertyValue("--sx-accent").trim() || "#4f8dff";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    // sphere body + rim light
    const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.5, R * 0.1, cx, cy, R);
    g.addColorStop(0, "rgba(79,141,255,.28)");
    g.addColorStop(1, "rgba(79,141,255,.04)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ac;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // graticule
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = fg;
    ctx.lineWidth = 1;
    const line = (pts: { x: number; y: number; z: number }[]) => {
      let down = false;
      ctx.beginPath();
      for (const q of pts) {
        if (q.z < 0) {
          down = false;
          continue;
        }
        const X = cx + q.x * R;
        const Y = cy - q.y * R;
        if (down) ctx.lineTo(X, Y);
        else ctx.moveTo(X, Y);
        down = true;
      }
      ctx.stroke();
    };
    for (let lon = -180; lon < 180; lon += 20) line(Array.from({ length: 37 }, (_, k) => project(-90 + k * 5, lon, rot.current)));
    for (let lat = -60; lat <= 60; lat += 20) line(Array.from({ length: 73 }, (_, k) => project(lat, -180 + k * 5, rot.current)));
    // dots
    ctx.fillStyle = fg;
    for (const d of DOTS) {
      const q = project(d.lat, d.lon, rot.current);
      if (q.z <= 0) continue;
      ctx.globalAlpha = 0.15 + q.z * 0.45;
      ctx.beginPath();
      ctx.arc(cx + q.x * R, cy - q.y * R, 1.6 + q.z * 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // pins: placed in % of the stage; fade out past ~60° from the centre of the view
    let best = -1;
    let bestZ = -2;
    GROWERS.forEach((m, k) => {
      const q = project(m.lat, m.lon, rot.current);
      const el = pins.current[k];
      if (!el) return;
      const op = Math.max(0, Math.min(1, (q.z - 0.42) / 0.25));
      el.style.left = `${((cx + q.x * R) / w) * 100}%`;
      el.style.top = `${((cy - q.y * R) / h) * 100}%`;
      el.style.opacity = op.toFixed(3);
      el.style.scale = (0.75 + q.z * 0.25).toFixed(3);
      el.style.zIndex = String(Math.round(q.z * 100) + 10);
      el.style.pointerEvents = op > 0.5 ? "auto" : "none";
      if (q.z > bestZ) {
        bestZ = q.z;
        best = k;
      }
    });
    if (best !== lastFront.current) {
      lastFront.current = best;
      setFront(best);
    }
  };

  useEffect(() => {
    draw();
    const st = stage.current;
    if (!st) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(st);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // M33 · the globe turns all the time while on screen (12° a second)
  useTicker(stage, (_, dt) => {
    rot.current -= dt * 12;
    draw();
  });

  return (
    <Sec innerRef={r} theme="ink" font="grotesk" className="py-[clamp(72px,9vw,140px)]">
      {/* CSS-only glow loop: keeps the section moving on camera even if the canvas ticker skips frames */}
      <style>{`.tm10-glow{animation:tm10-glow 4.6s linear infinite alternate}@keyframes tm10-glow{from{transform:translate(-14%,-6%) scale(.9)}to{transform:translate(18%,10%) scale(1.15)}}html.is-static .tm10-glow{animation:none}html.is-static {.tm10-glow{animation:none}}`}</style>
      <div aria-hidden className="tm10-glow pointer-events-none absolute right-[8%] top-[18%] aspect-square w-[40vw] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--sx-accent)_34%,transparent),transparent)]" />
      <style>{TM_CSS}</style>
      <div className="grid grid-cols-1 gap-[clamp(24px,3vw,48px)] md:grid-cols-12">
        <div className="flex flex-col justify-between gap-10 md:col-span-4">
          <div>
            <H className="text-[clamp(40px,4.4vw,76px)]">Eight growers, four oceans apart.</H>
            <P className="mt-6 max-w-[34ch]">Every bar of Tamarind & Tide starts on a farm we visit twice a year and pay above the fair-trade floor.</P>
          </div>
          <dl className="grid grid-cols-2 gap-6 border-t border-[var(--sx-line)] pt-8">
            {[
              ["8", "partner farms"],
              ["3", "continents"],
              ["₹412", "paid per kilo"],
              ["11 yrs", "longest partner"],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="sx-display text-[clamp(30px,2.6vw,42px)] font-[700] leading-none">{v}</dt>
                <dd className="mt-2 text-[14px] text-[var(--sx-muted)]">{l}</dd>
              </div>
            ))}
          </dl>
          <div>
            <Btn kind="ghost">Meet the farms</Btn>
          </div>
        </div>

        {/* the card */}
        <div className="relative overflow-hidden rounded-[var(--sx-radius)] border border-[var(--sx-line)] bg-[var(--sx-surface)] md:col-span-8">
          <div className="relative z-20 flex flex-wrap items-start justify-between gap-4 p-[clamp(24px,2.6vw,40px)]">
            <div>
              <p className="sx-display text-[clamp(26px,2.2vw,36px)] font-[700] leading-[1.05]">Where our people are</p>
              <p className="mt-2 text-[16px] text-[var(--sx-muted)]">Growers and fermenters we buy from directly, pinned where they farm.</p>
            </div>
            <div className="flex -space-x-2">
              {GROWERS.slice(0, 5).map((m, k) => (
                <span key={m.n} className="rounded-full ring-2 ring-[var(--sx-surface)]">
                  <Avatar name={m.n} i={k} size={34} />
                </span>
              ))}
              <span className="grid h-[34px] w-[34px] place-items-center rounded-full bg-[var(--sx-bg)] text-[12px] text-[var(--sx-muted)] ring-2 ring-[var(--sx-surface)]">+3</span>
            </div>
          </div>
          <div ref={stage} className="relative h-[clamp(420px,36vw,560px)] overflow-hidden">
            <canvas ref={cv} className="absolute inset-0 h-full w-full" aria-hidden />
            {GROWERS.map((m, k) => (
              <div
                key={m.n}
                ref={(n) => {
                  pins.current[k] = n;
                }}
                className="group absolute"
                style={{ left: "50%", top: "50%", opacity: 0 }}
              >
                <span className="block -translate-x-1/2 -translate-y-1/2 rounded-full p-[3px] ring-2 ring-[var(--sx-accent)]" style={{ background: "var(--sx-surface)" }}>
                  <Avatar name={m.n} i={k} size={44} />
                </span>
                <span className={`${k === front ? "tm5-tip block" : "hidden group-hover:block"} absolute left-0 top-[34px] w-max -translate-x-1/2 rounded-[10px] border border-[var(--sx-line)] bg-[var(--sx-bg)] px-3 py-2 text-center`} key={k === front ? `t${front}` : undefined}>
                  <span className="block text-[14px] font-[650]">{m.n}</span>
                  <span className="block text-[12px] text-[var(--sx-muted)]">{m.r}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Sec>
  );
}

export const DEFS: SectionDef[] = [
  { code: "TM09", name: "Team grid with department filter", motion: "M34", C: TM09 },
  { code: "TM10", name: "Team card with avatar-pinned globe", motion: "M33", C: TM10 },
];
