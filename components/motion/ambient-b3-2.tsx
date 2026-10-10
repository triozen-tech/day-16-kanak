"use client";

// Ambient motions, batch 3 · group 2 (MOTION-MENU M207–M210). Small focused demos for /lab/motion.
// M207 is CSS only (a tilted marquee plane), M208 an OGL cloth mesh driven by a Verlet sim, M209–M210 canvas 2D loops.
// Every loop runs only while on screen; every demo also has a CSS-only glow loop that never stops (and stops in
// ?static=1 / reduced motion, where the markup shows a sensible final state).
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { scene } from "@/components/fx/shared";
import type { MotionDef } from "./types";

const GROTESK = "'Space Grotesk Variable', system-ui, sans-serif";
const SERIF = "'Fraunces Variable', Georgia, serif";
const EDITORIAL = "'Instrument Serif', Georgia, serif";
const WIDE = "'Syne Variable', 'Space Grotesk Variable', system-ui, sans-serif";

const CSS = `
.b3g2a-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 36% 42%,var(--g1,rgba(79,141,255,.42)),transparent 70%),radial-gradient(30% 36% at 68% 62%,var(--g2,rgba(255,122,89,.2)),transparent 70%);animation:b3g2a-drift 5.4s linear infinite alternate;will-change:transform}
@keyframes b3g2a-drift{0%{transform:translate3d(-8%,-5%,0) scale(1)}100%{transform:translate3d(8%,6%,0) scale(1.16)}}
.b3g2a-dot{position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18);box-shadow:0 0 0 6px rgba(255,255,255,.08),0 4px 14px rgba(0,0,0,.4);pointer-events:none;z-index:40;opacity:0;transition:opacity .25s}
.m207-view{position:absolute;inset:0;perspective:1500px;overflow:hidden}
.m207-plane{position:absolute;left:50%;top:50%;width:150%;height:210%;margin-left:-75%;margin-top:-105%;display:grid;grid-template-columns:repeat(6,1fr);gap:22px;transform:rotateX(55deg) rotateZ(-45deg);transform-style:preserve-3d}
.m207-col{display:flex;flex-direction:column;transform-style:preserve-3d;animation:m207-up 16s linear infinite;animation-play-state:paused}
.m207-col.dn{animation-name:m207-dn;animation-duration:19s}
.m207-run .m207-col{animation-play-state:running}
@keyframes m207-up{from{transform:translate3d(0,0,0)}to{transform:translate3d(0,-50%,0)}}
@keyframes m207-dn{from{transform:translate3d(0,-50%,0)}to{transform:translate3d(0,0,0)}}
.m207-tile{position:relative;flex:none;margin-bottom:22px;aspect-ratio:4/3;border-radius:14px;overflow:hidden;transition:transform .5s cubic-bezier(.2,.7,.2,1),box-shadow .5s;box-shadow:0 0 0 1px rgba(255,255,255,.08)}
.m207-tile img{width:100%;height:100%;object-fit:cover;display:block}
.m207-tile:hover,.m207-tile.on{transform:translate3d(0,0,70px);box-shadow:0 0 0 2px rgba(255,214,150,.9),-30px 40px 60px rgba(0,0,0,.6)}
.m209-line{position:absolute;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#7c8cff 22%,#c9b8ff 50%,#7c8cff 78%,transparent)}
.m209-line.blur{height:6px;margin-top:-2px;filter:blur(6px)}
.m209-shine{position:absolute;top:-3px;height:8px;width:24%;left:38%;background:radial-gradient(closest-side,#fff,rgba(255,255,255,0));filter:blur(2px);animation:m209-shine 3.2s ease-in-out infinite alternate}
@keyframes m209-shine{from{transform:translate3d(-120%,0,0)}to{transform:translate3d(120%,0,0)}}
.m209-field{-webkit-mask-image:radial-gradient(50% 72% at 50% 0%,#000 25%,transparent 100%);mask-image:radial-gradient(50% 72% at 50% 0%,#000 25%,transparent 100%)}
html.is-static .b3g2a-glow,html.is-static .m207-col,html.is-static .m209-shine{animation:none}
html.is-static {.b3g2a-glow,.m207-col,.m209-shine{animation:none}}
`;

/* ---------- shared helpers (local copies) ---------- */

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). */
function Stage({ r, children, className = "", bg = "#07080d", g1, g2 }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; bg?: string; g1?: string; g2?: string }) {
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 text-[#eef2ff] ${className}`} style={{ background: bg }}>
      <style href="b3g2a-css" precedence="default">
        {CSS}
      </style>
      <div className="b3g2a-glow" style={{ "--g1": g1, "--g2": g2 } as CSSProperties} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

/** The glow loop again, ON TOP of a full-bleed image area (screen blend), so busy demos never freeze. */
const Sheen = ({ g1 }: { g1?: string }) => (
  <div className="b3g2a-glow" style={{ "--g1": g1, "--g2": "transparent", mixBlendMode: "screen", opacity: 0.45, zIndex: 35 } as CSSProperties} aria-hidden />
);

/** Calls `fn(true|false)` as the element enters / leaves the screen. Nothing in reduced motion. */
function useOnScreen(ref: RefObject<HTMLElement | null>, fn: (on: boolean) => void) {
  const cb = useRef(fn);
  cb.current = fn;
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const io = new IntersectionObserver(([e]) => cb.current(e.isIntersecting), { threshold: 0.1 });
    io.observe(el);
    return () => {
      io.disconnect();
      cb.current(false);
    };
  }, [ref]);
}

/**
 * A 2D canvas sized to its box (dpr ≤ 1.5) with a rAF loop that only draws while on screen.
 * Reduced motion / ?static=1: one frame is drawn (t = 1.2 s) and nothing animates.
 */
function useCanvasLoop(cv: RefObject<HTMLCanvasElement | null>, draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, dt: number, resized: boolean) => void) {
  const fn = useRef(draw);
  fn.current = draw;
  useEffect(() => {
    const c = cv.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 1;
    let h = 1;
    let resized = true;
    const resize = () => {
      const r = c.getBoundingClientRect();
      w = Math.max(1, r.width);
      h = Math.max(1, r.height);
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      resized = true;
    };
    resize();
    if (prefersReducedMotion()) {
      fn.current(ctx, w, h, 1.2, 0, true);
      return;
    }
    const ro = new ResizeObserver(resize);
    ro.observe(c);
    let on = false;
    const io = new IntersectionObserver(([e]) => (on = e.isIntersecting), { rootMargin: "60px" });
    io.observe(c);
    let raf = 0;
    let last = performance.now();
    let t = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!on) return;
      t += dt;
      fn.current(ctx, w, h, t, dt, resized);
      resized = false;
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [cv]);
}

/* ---------- M207 · Tilted image plane marquee (variant of M14: a 3D-tilted plane of columns, alternate directions) ---------- */
const M207_IMGS = [0, 1, 2, 3].map((i) => scene(i, 480, 360));
function M207() {
  const root = useRef<HTMLDivElement>(null);
  useOnScreen(root, (on) => {
    const el = root.current;
    if (!el) return;
    el.classList.toggle("m207-run", on);
    const w = el as HTMLDivElement & { __m207?: number };
    window.clearInterval(w.__m207);
    if (!on) return;
    // auto "hover": lift one tile near the middle of the frame every 0.75 s (the real hover still works)
    let prev: Element | null = null;
    w.__m207 = window.setInterval(() => {
      const box = el.getBoundingClientRect();
      const tiles = Array.from(el.querySelectorAll(".m207-tile")).filter((t) => {
        const r = t.getBoundingClientRect();
        const cx = r.left + r.width / 2 - box.left;
        const cy = r.top + r.height / 2 - box.top;
        return cx > box.width * 0.12 && cx < box.width * 0.88 && cy > box.height * 0.12 && cy < box.height * 0.88 && t !== prev;
      });
      prev?.classList.remove("on");
      prev = tiles[Math.floor(Math.random() * tiles.length)] ?? null;
      prev?.classList.add("on");
    }, 750);
  });
  const cols = Array.from({ length: 6 }, (_, c) => Array.from({ length: 6 }, (_, k) => (c * 3 + k) % 4));
  return (
    <Stage r={root} g1="rgba(255,190,120,.4)" g2="rgba(120,140,255,.3)">
      <div className="m207-view" aria-hidden>
        <div className="m207-plane">
          {cols.map((col, c) => (
            <div key={c} className={`m207-col ${c % 2 ? "dn" : ""}`}>
              {[...col, ...col].map((im, k) => (
                <div key={k} className="m207-tile">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={M207_IMGS[im]} alt="" draggable={false} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_50%,rgba(5,6,10,.82),rgba(5,6,10,.35)_70%,rgba(5,6,10,.15))]" />
      <Sheen g1="rgba(255,200,140,.4)" />
      <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center text-center">
        <div>
          <p className="text-[13px] font-[600] uppercase tracking-[0.3em] text-white/75">Lumen Archive · Fine-art prints</p>
          <h3 className="mx-auto mt-4 max-w-[14ch] text-[clamp(48px,6.2vw,104px)] leading-[0.92] text-white" style={{ fontFamily: EDITORIAL }}>
            Every frame, kept forever.
          </h3>
          <p className="mt-5 text-[15px] text-white/80">A3 giclée print · ₹ 3,200</p>
        </div>
      </div>
    </Stage>
  );
}

/* ---------- M208 · Wind-blown cloth (Verlet spring-mass sheet → OGL textured mesh) ---------- */
const NX = 34;
const NY = 26;
const CLOTH_W = 1.2;
const CLOTH_H = 1.0;
const PROJ_K = 1.5;
const OFF_X = 0.32;
const OFF_Y = 0.06;

/** The printed fabric: an indigo shibori-style pattern + the label, painted once into a canvas texture. */
function paintCloth() {
  const W = 1024;
  const H = 860;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const x = c.getContext("2d")!;
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#1f2f6b");
  g.addColorStop(1, "#121b44");
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);
  // resist-dye rings
  for (let r = 0; r < 6; r++)
    for (let k = 0; k < 7; k++) {
      const cx = 80 + k * 150 + (r % 2 ? 75 : 0);
      const cy = 70 + r * 150;
      for (let ring = 0; ring < 4; ring++) {
        x.beginPath();
        x.arc(cx, cy, 14 + ring * 14, 0, Math.PI * 2);
        x.strokeStyle = `rgba(220,232,255,${0.5 - ring * 0.1})`;
        x.lineWidth = ring === 0 ? 8 : 3;
        x.stroke();
      }
    }
  // soft fold bands
  for (let i = 0; i < 9; i++) {
    x.fillStyle = `rgba(255,255,255,${i % 2 ? 0.035 : 0.06})`;
    x.fillRect(i * 118, 0, 40, H);
  }
  x.fillStyle = "rgba(10,14,40,.72)";
  x.fillRect(0, H - 170, W, 170);
  x.fillStyle = "#f3efe4";
  x.font = `600 74px ${SERIF}`;
  x.fillText("Loomhouse", 60, H - 78);
  x.font = `500 26px ${GROTESK}`;
  x.fillText("INDIGO SHIBORI THROW · ₹ 6,400", 62, H - 36);
  return c;
}

function M208() {
  const box = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const rod = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let dead = false;
    let cleanup = () => {};
    (async () => {
      await document.fonts?.ready;
      const ogl = await import("ogl");
      const canvas = cv.current;
      const el = box.current;
      if (dead || !canvas || !el) return;
      try {
        const { Renderer, Geometry, Program, Mesh, Texture } = ogl;
        const renderer = new Renderer({ canvas, dpr: Math.min(window.devicePixelRatio || 1, 1.5), alpha: true, antialias: true });
        const gl = renderer.gl;
        gl.clearColor(0, 0, 0, 0);
        const N = NX * NY;
        const P = new Float32Array(N * 3);
        const Q = new Float32Array(N * 3); // previous positions
        const clip = new Float32Array(N * 2);
        const uv = new Float32Array(N * 2);
        const shade = new Float32Array(N);
        const sx = CLOTH_W / (NX - 1);
        const sy = CLOTH_H / (NY - 1);
        for (let j = 0; j < NY; j++)
          for (let i = 0; i < NX; i++) {
            const k = j * NX + i;
            P[k * 3] = Q[k * 3] = -CLOTH_W / 2 + i * sx;
            P[k * 3 + 1] = Q[k * 3 + 1] = CLOTH_H / 2 - j * sy;
            P[k * 3 + 2] = Q[k * 3 + 2] = 0;
            uv[k * 2] = i / (NX - 1);
            uv[k * 2 + 1] = 1 - j / (NY - 1);
            shade[k] = 1;
          }
        const idx = new Uint16Array((NX - 1) * (NY - 1) * 6);
        let n = 0;
        for (let j = 0; j < NY - 1; j++)
          for (let i = 0; i < NX - 1; i++) {
            const a = j * NX + i;
            idx.set([a, a + NX, a + 1, a + 1, a + NX, a + NX + 1], n);
            n += 6;
          }
        const geometry = new Geometry(gl, {
          position: { size: 2, data: clip },
          uv: { size: 2, data: uv },
          shade: { size: 1, data: shade },
          index: { data: idx },
        });
        const texture = new Texture(gl, { image: paintCloth(), generateMipmaps: false });
        const program = new Program(gl, {
          vertex: /* glsl */ `
attribute vec2 position; attribute vec2 uv; attribute float shade;
varying vec2 vUv; varying float vS;
void main(){ vUv = uv; vS = shade; gl_Position = vec4(position, 0.0, 1.0); }`,
          fragment: /* glsl */ `
precision highp float;
uniform sampler2D tMap;
varying vec2 vUv; varying float vS;
void main(){ vec3 c = texture2D(tMap, vUv).rgb; gl_FragColor = vec4(c * vS + max(vS - 1.0, 0.0) * 0.6, 1.0); }`,
          uniforms: { tMap: { value: texture } },
          cullFace: false,
          depthTest: false,
        });
        const mesh = new Mesh(gl, { geometry, program });

        let aspect = 1.6;
        let W = 1;
        let H = 1;
        const resize = () => {
          const r = el.getBoundingClientRect();
          W = Math.max(1, r.width);
          H = Math.max(1, r.height);
          renderer.setSize(W, H);
          canvas.style.width = "100%";
          canvas.style.height = "100%";
          aspect = W / H;
          // the rod sits on the pinned top row
          const top = (1 - (CLOTH_H / 2 * PROJ_K + OFF_Y)) * 0.5 * H;
          const half = ((CLOTH_W / 2 + 0.06) * PROJ_K) / aspect;
          if (rod.current) {
            rod.current.style.top = `${top - 8}px`;
            rod.current.style.left = `${((OFF_X - half + 1) / 2) * W}px`;
            rod.current.style.width = `${half * W}px`;
          }
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(el);

        // pointer: the real mouse wins for 2.5 s after it moved, otherwise a fake ring sweeps through the cloth
        const real = { x: 0, y: 0, at: -1e9 };
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          real.x = e.clientX - r.left;
          real.y = e.clientY - r.top;
          real.at = performance.now();
        };
        el.addEventListener("pointermove", move);

        let on = false;
        const io = new IntersectionObserver(([e]) => (on = e.isIntersecting), { rootMargin: "60px" });
        io.observe(el);

        const step = (t: number, ptr: { x: number; y: number } | null) => {
          const dt = 1 / 60;
          const gust = 0.55 + 0.45 * Math.sin(t * 0.63) * Math.sin(t * 1.71 + 1.3);
          let pwx = 0;
          let pwy = 0;
          if (ptr) {
            // screen px → cloth world (ignoring depth)
            pwx = ((((ptr.x / W) * 2 - 1) - OFF_X) * aspect) / PROJ_K;
            pwy = ((1 - (ptr.y / H) * 2) - OFF_Y) / PROJ_K;
          }
          for (let k = NX; k < N; k++) {
            const o = k * 3;
            const x = P[o];
            const y = P[o + 1];
            const z = P[o + 2];
            const wz = (1.2 + 3.4 * gust) * (0.55 + 0.45 * Math.sin(t * 2.3 + x * 4.2 - y * 3.1)) + 1.1 * Math.sin(t * 3.7 + y * 7.0 + x * 2.0);
            const wx = (0.9 * gust + 0.4 * Math.sin(t * 1.4 + y * 5.0)) * 1.2;
            let ax = wx;
            const ay = -4.2;
            let az = wz;
            if (ptr) {
              const dx = x - pwx;
              const dy = y - pwy;
              const d = Math.hypot(dx, dy);
              if (d < 0.2) {
                const f = (1 - d / 0.2) * 38;
                az += f;
                ax += (dx / (d + 1e-4)) * f * 0.35;
              }
            }
            const vx = (x - Q[o]) * 0.985;
            const vy = (y - Q[o + 1]) * 0.985;
            const vz = (z - Q[o + 2]) * 0.985;
            Q[o] = x;
            Q[o + 1] = y;
            Q[o + 2] = z;
            P[o] = x + vx + ax * dt * dt;
            P[o + 1] = y + vy + ay * dt * dt;
            P[o + 2] = z + vz + az * dt * dt;
          }
          // structural springs (top row pinned)
          const relax = (a: number, b: number, rest: number) => {
            const ao = a * 3;
            const bo = b * 3;
            const dx = P[bo] - P[ao];
            const dy = P[bo + 1] - P[ao + 1];
            const dz = P[bo + 2] - P[ao + 2];
            const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
            const diff = (d - rest) / d;
            const pa = a < NX ? 0 : 0.5;
            const pb = b < NX ? 0 : 0.5;
            const s = pa + pb || 1;
            P[ao] += dx * diff * (pa / s);
            P[ao + 1] += dy * diff * (pa / s);
            P[ao + 2] += dz * diff * (pa / s);
            P[bo] -= dx * diff * (pb / s);
            P[bo + 1] -= dy * diff * (pb / s);
            P[bo + 2] -= dz * diff * (pb / s);
          };
          for (let it = 0; it < 4; it++) {
            for (let j = 0; j < NY; j++)
              for (let i = 0; i < NX; i++) {
                const k = j * NX + i;
                if (i < NX - 1) relax(k, k + 1, sx);
                if (j < NY - 1) relax(k, k + NX, sy);
              }
          }
        };

        const project = () => {
          for (let k = 0; k < N; k++) {
            const o = k * 3;
            const persp = 1 / (1 + P[o + 2] * 0.45);
            clip[k * 2] = ((P[o] * PROJ_K) / aspect) * persp + OFF_X;
            clip[k * 2 + 1] = P[o + 1] * PROJ_K * persp + OFF_Y;
          }
          // per-vertex light from the surface normal
          for (let j = 0; j < NY; j++)
            for (let i = 0; i < NX; i++) {
              const k = j * NX + i;
              const l = (j * NX + Math.max(0, i - 1)) * 3;
              const r = (j * NX + Math.min(NX - 1, i + 1)) * 3;
              const u = (Math.max(0, j - 1) * NX + i) * 3;
              const d = (Math.min(NY - 1, j + 1) * NX + i) * 3;
              const ux = P[r] - P[l];
              const uy = P[r + 1] - P[l + 1];
              const uz = P[r + 2] - P[l + 2];
              const vx = P[d] - P[u];
              const vy = P[d + 1] - P[u + 1];
              const vz = P[d + 2] - P[u + 2];
              let nx = uy * vz - uz * vy;
              let ny = uz * vx - ux * vz;
              let nz = ux * vy - uy * vx;
              const m = Math.hypot(nx, ny, nz) || 1;
              nx /= m;
              ny /= m;
              nz /= m;
              const lit = Math.abs(nx * -0.45 + ny * 0.35 + nz * -0.82);
              shade[k] = 0.42 + 0.78 * lit;
            }
          geometry.attributes.position.needsUpdate = true;
          geometry.attributes.shade.needsUpdate = true;
        };

        const dotEl = dot.current;
        const t0 = performance.now();
        let shown = false;
        let raf = 0;
        const loop = () => {
          raf = requestAnimationFrame(loop);
          if (!on) return;
          const t = (performance.now() - t0) / 1000;
          let ptr: { x: number; y: number } | null = null;
          const useReal = performance.now() - real.at < 2500;
          if (useReal) ptr = { x: real.x, y: real.y };
          else {
            // fake ring: every 4.2 s it pushes through the lower half of the cloth, left to right
            const ph = (t % 4.2) / 4.2;
            const cx = ((OFF_X + 1) / 2) * W;
            const span = ((CLOTH_W * PROJ_K) / aspect / 2) * W * 0.9;
            const x = cx - span / 2 + span * ph;
            const y = H * (0.58 + 0.12 * Math.sin(ph * Math.PI * 2));
            if (ph > 0.12 && ph < 0.88) ptr = { x, y };
            if (dotEl) {
              dotEl.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
              dotEl.style.opacity = ptr ? "1" : "0";
            }
          }
          if (useReal && dotEl) dotEl.style.opacity = "0";
          step(t, ptr);
          project();
          renderer.render({ scene: mesh });
          if (!shown) {
            shown = true;
            canvas.style.opacity = "1";
          }
        };
        // settle the sheet before the first frame so it starts hanging, not flat
        for (let s = 0; s < 90; s++) step(s / 60, null);
        raf = requestAnimationFrame(loop);
        cleanup = () => {
          cancelAnimationFrame(raf);
          ro.disconnect();
          io.disconnect();
          el.removeEventListener("pointermove", move);
          gl.getExtension("WEBGL_lose_context")?.loseContext();
        };
        if (dead) cleanup();
      } catch (err) {
        console.warn("[M208] WebGL off, showing the fallback:", (err as Error).message);
      }
    })();
    return () => {
      dead = true;
      cleanup();
    };
  }, []);
  return (
    <Stage r={box} bg="#0b0f1f" g1="rgba(110,140,255,.42)" g2="rgba(255,190,140,.22)">
      {/* fallback sheet (static / no WebGL): the canvas covers it after its first frame */}
      <div className="absolute left-[44%] top-[8%] h-[80%] w-[44%] rounded-b-[6px] bg-[repeating-linear-gradient(90deg,#1f2f6b_0_46px,#26387a_46px_62px)] shadow-[0_40px_80px_rgba(0,0,0,.45)]">
        <div className="absolute inset-x-0 bottom-0 bg-[#0a0e28]/70 px-[6%] py-[5%] text-[#f3efe4]">
          <p className="text-[clamp(28px,3vw,46px)] leading-none" style={{ fontFamily: SERIF }}>
            Loomhouse
          </p>
          <p className="mt-2 text-[12px] tracking-[0.14em]">INDIGO SHIBORI THROW · ₹ 6,400</p>
        </div>
      </div>
      <canvas ref={cv} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500" aria-hidden />
      <div ref={rod} className="absolute left-[42%] top-[6%] h-[10px] w-[48%] rounded-full bg-[linear-gradient(#e6d3b0,#8a6d45)] shadow-[0_6px_14px_rgba(0,0,0,.5)]" aria-hidden />
      <div ref={dot} className="b3g2a-dot" aria-hidden />
      <div className="pointer-events-none absolute bottom-[12%] left-[6%] max-w-[30%] text-[#eef0ff]">
        <p className="text-[13px] uppercase tracking-[0.24em] opacity-70">Loomhouse · Handwoven</p>
        <h3 className="mt-3 text-[clamp(40px,4.6vw,76px)] font-[500] leading-[0.95] tracking-[-0.02em]" style={{ fontFamily: SERIF }}>
          Cloth that catches the wind.
        </h3>
        <p className="mt-4 text-[15px] opacity-75">Indigo shibori throw · ₹ 6,400</p>
      </div>
    </Stage>
  );
}

/* ---------- M209 · Sparkle horizon under heading (variant of M616: a glowing line + a sparkle field fading in an ellipse) ---------- */
type Spark = { x: number; y: number; r: number; vx: number; vy: number; ph: number; sp: number };
function M209() {
  const cv = useRef<HTMLCanvasElement>(null);
  const sparks = useRef<Spark[]>([]);
  useCanvasLoop(cv, (ctx, w, h, t, dt, resized) => {
    if (resized || !sparks.current.length) {
      const count = Math.round((w * h) / 380);
      sparks.current = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.4 + Math.random() * 1.3,
        vx: (Math.random() - 0.5) * 8,
        vy: -2 - Math.random() * 9,
        ph: Math.random() * Math.PI * 2,
        sp: 1.5 + Math.random() * 4,
      }));
    }
    ctx.clearRect(0, 0, w, h);
    for (const s of sparks.current) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.y < -2) {
        s.y = h + 2;
        s.x = Math.random() * w;
      }
      if (s.x < -2) s.x = w + 2;
      if (s.x > w + 2) s.x = -2;
      const a = 0.25 + 0.75 * Math.pow(0.5 + 0.5 * Math.sin(t * s.sp + s.ph), 3);
      ctx.globalAlpha = a;
      ctx.fillStyle = s.r > 1.3 ? "#e9e4ff" : "#ffffff";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
  return (
    <Stage bg="#04040a" g1="rgba(110,100,255,.36)" g2="rgba(190,160,255,.18)">
      <div className="absolute inset-0 flex flex-col items-center pt-[11%] text-center">
        <p className="text-[13px] font-[600] uppercase tracking-[0.32em] text-white/70">Aurel Studio · Launch week</p>
        <h3 className="mt-3 text-[clamp(56px,6.4vw,112px)] font-[800] uppercase leading-[0.9] tracking-[-0.03em] text-white" style={{ fontFamily: WIDE }}>
          Lightfall
        </h3>
        <div className="relative mt-6 h-[2px] w-[min(62%,820px)]">
          <div className="m209-line blur" />
          <div className="m209-line" />
          <div className="m209-shine" />
        </div>
        <div className="m209-field relative h-[38%] w-[min(78%,1040px)]">
          <canvas ref={cv} className="absolute inset-0 h-full w-full" aria-hidden />
        </div>
        <p className="absolute bottom-[8%] text-[15px] text-white/75">Pre-order the Halo desk lamp · ₹ 9,400</p>
      </div>
    </Stage>
  );
}

/* ---------- M210 · Fireflies (variant of M15: glowing dots on smooth random paths, blinking independently) ---------- */
type Fly = { x: number; y: number; a: number; v: number; f1: number; f2: number; p1: number; p2: number; per: number; ph: number; s: number };
function glowSprite() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,220,1)");
  g.addColorStop(0.18, "rgba(230,255,140,.9)");
  g.addColorStop(0.45, "rgba(190,240,90,.28)");
  g.addColorStop(1, "rgba(150,220,60,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 64);
  return c;
}
function M210() {
  const cv = useRef<HTMLCanvasElement>(null);
  const st = useRef<{ flies: Fly[]; sprite: HTMLCanvasElement | null }>({ flies: [], sprite: null });
  useCanvasLoop(cv, (ctx, w, h, t, dt, resized) => {
    const S = st.current;
    if (!S.sprite) S.sprite = glowSprite();
    if (resized || !S.flies.length) {
      S.flies = Array.from({ length: 64 }, () => ({
        x: Math.random() * w,
        y: h * (0.15 + Math.random() * 0.75),
        a: Math.random() * Math.PI * 2,
        v: 18 + Math.random() * 30,
        f1: 0.3 + Math.random() * 0.8,
        f2: 0.9 + Math.random() * 1.4,
        p1: Math.random() * 10,
        p2: Math.random() * 10,
        per: 1.8 + Math.random() * 3.2,
        ph: Math.random(),
        s: 14 + Math.random() * 18,
      }));
    }
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";
    for (const f of S.flies) {
      // heading wanders smoothly (two slow sines), and steers home if it drifts off the frame
      f.a += (Math.sin(t * f.f1 + f.p1) * 1.1 + Math.sin(t * f.f2 + f.p2) * 0.7) * dt;
      const cx = w / 2 - f.x;
      const cy = h * 0.55 - f.y;
      if (f.x < w * 0.04 || f.x > w * 0.96 || f.y < h * 0.08 || f.y > h * 0.94) {
        const home = Math.atan2(cy, cx);
        let d = home - f.a;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        f.a += d * Math.min(1, dt * 2.5);
      }
      f.x += Math.cos(f.a) * f.v * dt;
      f.y += Math.sin(f.a) * f.v * dt * 0.7;
      // independent blink: a soft pulse once per period, dim the rest of the time
      const ph = (t / f.per + f.ph) % 1;
      const pulse = ph < 0.42 ? Math.pow(Math.sin((ph / 0.42) * Math.PI), 2) : 0;
      const alpha = 0.08 + 0.92 * pulse;
      ctx.globalAlpha = alpha;
      const s = f.s * (0.7 + 0.5 * pulse);
      ctx.drawImage(S.sprite, f.x - s, f.y - s, s * 2, s * 2);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  });
  return (
    <Stage bg="linear-gradient(180deg,#0a1424 0%,#0d1d24 55%,#081210 100%)" g1="rgba(120,200,120,.3)" g2="rgba(70,110,200,.3)">
      {/* tree line silhouette */}
      <svg className="absolute inset-x-0 bottom-0 h-[34%] w-full" viewBox="0 0 1200 240" preserveAspectRatio="none" aria-hidden>
        <path d="M0 240V120l40-30 30 26 46-60 38 52 30-24 44 40 52-70 40 56 34-28 50 46 46-62 38 50 40-30 52 44 44-66 42 58 34-26 50 40 46-58 40 52 36-22 48 38 46-64 42 56 38-30 44 46 46-50 34 30V240z" fill="#050b0a" />
      </svg>
      <canvas ref={cv} className="absolute inset-0 h-full w-full" aria-hidden />
      <Sheen g1="rgba(150,220,120,.5)" />
      <div className="pointer-events-none absolute left-[6%] top-[12%] max-w-[44%] text-[#eef6e6]">
        <p className="text-[13px] uppercase tracking-[0.24em] opacity-70">Camp Jugnu · Kumaon</p>
        <h3 className="mt-3 text-[clamp(44px,5.4vw,88px)] leading-[0.94]" style={{ fontFamily: EDITORIAL }}>
          Stay out after dark.
        </h3>
        <p className="mt-4 text-[15px] opacity-80">Forest tent for two · ₹ 8,900 a night</p>
      </div>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M207", name: "Tilted image plane marquee", how: "A 3D-tilted plane of image columns slides up and down in alternate directions forever; tiles lift on hover (auto-lift while filming).", kind: "play", C: M207 },
  { code: "M208", name: "Wind-blown cloth", how: "A printed sheet hangs from a rod and ripples in gusting wind (Verlet springs → WebGL mesh); a pointer pushes the fabric.", kind: "play", C: M208 },
  { code: "M209", name: "Sparkle horizon under heading", how: "A glowing line under the heading with a twinkling sparkle field below that fades out in an ellipse (canvas, always on).", kind: "play", C: M209 },
  { code: "M210", name: "Fireflies", how: "Glowing dots wander on smooth random paths and blink on and off on their own rhythms (canvas, always on).", kind: "play", C: M210 },
];
