"use client";

// Text motions, batch 15 · group 3 (MOTION-MENU M680–M691). Small focused demos for /lab/motion, rebuilt in GSAP / CSS /
// canvas / OGL from the idea only. Every demo: plays by itself on screen (fake pointer where the idea is pointer-driven),
// loops, has a CSS glow loop that never stops, and shows a sensible final state in ?static=1 / reduced motion.
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { gsap, ScrambleTextPlugin, prefersReducedMotion } from "@/lib/gsap";
import { createShader, type GLHandle } from "@/lib/gl";
import { useTicker } from "@/components/fx/shared";
import type { MotionDef } from "./types";

void ScrambleTextPlugin; // registered in lib/gsap; imported so the plugin is in this chunk

const F = { sg: "Space Grotesk Variable", fr: "Fraunces Variable", is: "Instrument Serif", sy: "Syne Variable", mr: "Manrope Variable" };

const CSS = `
.b15g3-glow{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(38% 42% at 32% 38%,var(--g1,rgba(255,163,92,.55)),transparent 70%),radial-gradient(34% 40% at 70% 66%,var(--g2,rgba(79,141,255,.24)),transparent 70%);animation:b15g3-drift 5.6s linear infinite alternate;will-change:transform}
.b15g3-top{mix-blend-mode:screen;opacity:.45;z-index:5}
@keyframes b15g3-drift{0%{transform:translate3d(-7%,-5%,0) scale(1)}100%{transform:translate3d(7%,6%,0) scale(1.15)}}
.b15g3-dot{position:absolute;left:0;top:0;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:999px;border:1.5px solid rgba(255,255,255,.85);background:rgba(255,255,255,.12);pointer-events:none;z-index:6;will-change:transform}
.m686-scan{position:absolute;left:0;right:0;height:18%;top:-20%;background:linear-gradient(180deg,transparent,rgba(45,226,255,.16),transparent);animation:m686-scan 1.9s linear infinite;pointer-events:none}
@keyframes m686-scan{0%{transform:translateY(0)}100%{transform:translateY(700%)}}
.m687-run{display:flex;width:max-content;animation:m687-run 16s linear infinite;will-change:transform}
@keyframes m687-run{0%{transform:translate3d(0,0,0)}100%{transform:translate3d(-50%,0,0)}}
.m687-blob{position:absolute;border-radius:999px;background:#ff8a4c;animation:m687-bob 2.6s ease-in-out infinite alternate}
@keyframes m687-bob{0%{transform:translate3d(0,-38%,0) scale(.85)}100%{transform:translate3d(0,38%,0) scale(1.1)}}
.m687-off .m687-run,.m687-off .m687-blob{animation-play-state:paused}
html.is-static .b15g3-glow,html.is-static .m686-scan,html.is-static .m687-run,html.is-static .m687-blob{animation:none}
html.is-static {.b15g3-glow,.m686-scan,.m687-run,.m687-blob{animation:none}}
`;

/** Demo frame: dark rounded panel + the CSS-only glow loop (never frozen). `top` adds a second glow over the content. */
function Stage({ r, children, className = "", g1, g2, top = false }: { r?: RefObject<HTMLDivElement | null>; children: ReactNode; className?: string; g1?: string; g2?: string; top?: boolean }) {
  const vars = { "--g1": g1, "--g2": g2 } as CSSProperties;
  return (
    <div ref={r} className={`relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0f1c] text-[#eaf5ff] ${className}`}>
      <style href="b15g3-css" precedence="default">
        {CSS}
      </style>
      <div className="b15g3-glow" style={vars} aria-hidden />
      <div className="relative h-full w-full">{children}</div>
      {top && <div className="b15g3-glow b15g3-top" style={vars} aria-hidden />}
    </div>
  );
}

/** "play" helper: waits for fonts, builds the looping animation in a gsap.context, plays it only on screen. */
function usePlay(ref: RefObject<HTMLElement | null>, build: (root: HTMLElement, onClean: (fn: () => void) => void) => gsap.core.Animation | void) {
  const b = useRef(build);
  b.current = build;
  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    let dead = false;
    let on = false;
    let anim: gsap.core.Animation | void;
    const cleans: (() => void)[] = [];
    const ctx = gsap.context(() => {}, root);
    const sync = () => {
      if (!anim) return;
      if (on) anim.play();
      else anim.pause();
    };
    const io = new IntersectionObserver(
      ([e]) => {
        on = e.isIntersecting;
        sync();
      },
      { threshold: 0.1 },
    );
    io.observe(root);
    document.fonts.ready.then(() => {
      if (dead) return;
      ctx.add(() => {
        anim = b.current(root, (fn) => cleans.push(fn));
      });
      sync();
    });
    return () => {
      dead = true;
      io.disconnect();
      ctx.revert();
      cleans.forEach((f) => f());
    };
  }, [ref]);
}

/** Runs `start` once the element is within ~1 screen of the viewport (fonts ready); its return value cleans up on unmount. */
function useNear(ref: RefObject<HTMLElement | null>, start: (el: HTMLElement) => (() => void) | void) {
  const s = useRef(start);
  s.current = start;
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let dead = false;
    let clean: (() => void) | void;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        document.fonts.ready.then(() => {
          if (!dead) clean = s.current(el);
        });
      },
      { rootMargin: "900px 0px" },
    );
    io.observe(el);
    return () => {
      dead = true;
      io.disconnect();
      clean?.();
    };
  }, [ref]);
}

/** Toggles a class on the element while it is off screen (pauses CSS-only loops). */
function useOffClass(ref: RefObject<HTMLElement | null>, cls: string) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => el.classList.toggle(cls, !e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, cls]);
}

/** Real pointer inside the element (normalised 0..1); `t` = last move time, so demos fall back to their auto path. */
function usePointer(ref: RefObject<HTMLElement | null>) {
  const p = useRef({ x: 0.5, y: 0.5, t: -1e9, in: false, down: false });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      p.current.x = (e.clientX - r.left) / r.width;
      p.current.y = (e.clientY - r.top) / r.height;
      p.current.t = performance.now();
      p.current.in = true;
    };
    const leave = () => {
      p.current.in = false;
      p.current.down = false;
    };
    const down = (e: PointerEvent) => {
      move(e);
      p.current.down = true;
    };
    const up = () => (p.current.down = false);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
    };
  }, [ref]);
  return p;
}
const realActive = (p: { t: number; in: boolean }) => p.in && performance.now() - p.t < 1500;

/** Small deterministic random (same rhythm every loop and every load). */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** A canvas sized to its parent (device pixels, capped). Returns a getter for the 2D context and css size. */
function fitCanvas(c: HTMLCanvasElement, maxDpr = 1.5) {
  const box = c.parentElement ?? c;
  const st = { w: 1, h: 1, d: 1 };
  const resize = () => {
    const r = box.getBoundingClientRect();
    st.d = Math.min(window.devicePixelRatio || 1, maxDpr);
    st.w = Math.max(1, r.width);
    st.h = Math.max(1, r.height);
    c.width = Math.round(st.w * st.d);
    c.height = Math.round(st.h * st.d);
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(box);
  return { st, stop: () => ro.disconnect() };
}

const Caption = ({ children }: { children: ReactNode }) => <p className="absolute bottom-5 left-6 z-[7] text-[13px] uppercase tracking-[0.18em] text-white/60">{children}</p>;

/* ───────────────────────── M680 · ASCII text render (OGL: waving plane → ASCII pass) ───────────────────────── */
const M680_GLYPHS = " .:-=+*#%@";
const M680_FRAG = /* glsl */ `
uniform vec2 uMouse;
void main() {
  float cs = 11.0;
  vec2 px = vUv * uRes;
  vec2 cid = floor(px / cs);
  vec2 cuv = (cid + 0.5) * cs / uRes;
  vec2 p = cuv - 0.5;
  // a plane that tilts with the pointer and waves (perspective divide fakes depth)
  float z = 1.0 + p.x * uMouse.x * 0.55 + p.y * uMouse.y * 0.45 + 0.05 * sin(p.x * 7.0 + uTime * 1.7) + 0.03 * sin(p.y * 9.0 - uTime * 1.3);
  vec2 q = p / z;
  q.y += 0.035 * sin(q.x * 6.0 + uTime * 1.4);
  vec2 t = q + 0.5;
  float inside = step(0.0, t.x) * step(t.x, 1.0) * step(0.0, t.y) * step(t.y, 1.0);
  float b = texture2D(uTex0, t).r * inside;
  float light = 0.62 + 0.38 * sin(q.x * 5.0 - uTime * 1.2 + q.y * 3.0) * (0.6 + 0.4 * uMouse.x);
  float v = b * clamp(light, 0.25, 1.0);
  float on = step(0.06, v);
  float idx = floor(clamp(v, 0.0, 0.999) * 10.0);
  vec2 g = fract(px / cs);
  float glyph = texture2D(uTex1, vec2((idx + g.x) / 10.0, g.y)).r;
  float dotG = texture2D(uTex1, vec2((1.0 + g.x) / 10.0, g.y)).r * 0.16 * (1.0 - on);
  vec3 grad = mix(vec3(1.0, 0.48, 0.36), vec3(0.42, 0.76, 1.0), clamp(cuv.x + 0.25 * sin(uTime * 0.7 + cuv.y * 3.0), 0.0, 1.0));
  vec3 col = mix(vec3(0.72, 0.78, 0.9), grad * (0.7 + 0.5 * v), on);
  gl_FragColor = vec4(col, max(glyph * on, dotG));
}`;
function m680Atlas() {
  const s = 48;
  const c = document.createElement("canvas");
  c.width = s * 10;
  c.height = s;
  const x = c.getContext("2d")!;
  x.fillStyle = "#000";
  x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = "#fff";
  x.font = `700 ${s * 0.86}px "Courier New", ui-monospace, monospace`;
  x.textAlign = "center";
  x.textBaseline = "middle";
  [...M680_GLYPHS].forEach((ch, i) => x.fillText(ch, i * s + s / 2, s * 0.54));
  return c;
}
function m680Text(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = Math.round(w);
  c.height = Math.round(h);
  const x = c.getContext("2d")!;
  x.fillStyle = "#000";
  x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = "#fff";
  x.textAlign = "center";
  x.textBaseline = "middle";
  let size = h * 0.3;
  x.font = `800 ${size}px "${F.sy}", system-ui, sans-serif`;
  const mw = Math.max(x.measureText("LOW").width, x.measureText("SIGNAL").width);
  if (mw > w * 0.7) size *= (w * 0.7) / mw;
  x.font = `800 ${size}px "${F.sy}", system-ui, sans-serif`;
  x.fillText("LOW", w / 2, h * 0.5 - size * 0.5);
  x.fillText("SIGNAL", w / 2, h * 0.5 + size * 0.48);
  return c;
}
function M680() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const fb = useRef<HTMLDivElement>(null);
  const ptr = usePointer(root);
  useNear(root, () => {
    const canvas = cv.current;
    if (!canvas) return;
    let dead = false;
    let h: GLHandle | null = null;
    const cur = { x: 0, y: 0 };
    let last = 0;
    (async () => {
      const box = canvas.parentElement!.getBoundingClientRect();
      h = await createShader(canvas, M680_FRAG, {
        dpr: 1,
        textures: [m680Text(Math.max(1, box.width), Math.max(1, box.height)), m680Atlas()],
        uniforms: { uMouse: { value: [0, 0] } },
        onFrame: (u, t) => {
          const dt = Math.min(0.1, last ? t - last : 0.016);
          last = t;
          const p = ptr.current;
          const real = realActive(p);
          const tx = real ? p.x * 2 - 1 : Math.sin(t * 0.8);
          const ty = real ? 1 - p.y * 2 : 0.7 * Math.sin(t * 1.05 + 1.2);
          const k = 1 - Math.exp(-dt * 4);
          cur.x += (tx - cur.x) * k;
          cur.y += (ty - cur.y) * k;
          u.uMouse.value = [cur.x, cur.y];
          if (fb.current && fb.current.style.visibility !== "hidden") fb.current.style.visibility = "hidden";
        },
      });
      if (dead) h?.destroy();
    })();
    return () => {
      dead = true;
      h?.destroy();
      h = null;
    };
  });
  return (
    <Stage r={root} g1="rgba(255,122,92,.52)" g2="rgba(90,170,255,.3)" top>
      <div ref={fb} className="absolute inset-0 grid place-items-center text-center text-[clamp(64px,8vw,140px)] font-[800] uppercase leading-[0.95] text-white/70" style={{ fontFamily: F.sy }}>
        <div>
          LOW
          <br />
          SIGNAL
        </div>
      </div>
      <canvas ref={cv} className="absolute inset-0 h-full w-full" style={{ opacity: 0 }} aria-hidden />
      <Caption>Static Bloom Records · 12&quot; vinyl · ₹2,450</Caption>
    </Stage>
  );
}

/* ───────────────────────── M681 · Colour-cycling letters (gsap, staggered palette wave) ───────────────────────── */
const M681_WORD = "Carnival";
const M681_PAL = ["#ff5d73", "#ffb347", "#ffe066", "#6ee7b7", "#5ab0ff", "#b388ff", "#ff8ad8"];
const M681_CYCLES = 6;
const M681_COLS = (() => {
  const r = rng(681);
  const out: string[][] = [];
  let prev = [...M681_WORD].map((_, i) => i % M681_PAL.length);
  for (let k = 0; k < M681_CYCLES; k++) {
    const shift = 1 + Math.floor(r() * (M681_PAL.length - 1));
    prev = prev.map((c) => (c + shift) % M681_PAL.length);
    out.push(prev.map((c) => M681_PAL[c]));
  }
  return out;
})();
function M681() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const letters = gsap.utils.toArray<HTMLElement>(".m681-l", el);
    const ghosts = gsap.utils.toArray<HTMLElement>(".m681-g", el);
    const tl = gsap.timeline({ repeat: -1, paused: true });
    const step = 0.8;
    for (let k = 0; k < M681_CYCLES; k++) {
      letters.forEach((l, i) => {
        const at = k * step + i * 0.05;
        tl.to(l, { "--c": M681_COLS[k][i], duration: 0.3, ease: "power2.out" }, at);
        tl.to(l, { keyframes: [{ y: -16, scale: 1.05, duration: 0.15, ease: "power2.out" }, { y: 0, scale: 1, duration: 0.28, ease: "power2.in" }] }, at);
        tl.fromTo(ghosts[i], { opacity: 0 }, { keyframes: [{ opacity: 0.9, duration: 0.08 }, { opacity: 0, duration: 0.32 }] }, at);
      });
    }
    tl.to({}, { duration: 0.01 }, M681_CYCLES * step - 0.01);
    return tl;
  });
  const last = M681_COLS[M681_CYCLES - 1];
  return (
    <Stage r={root} g1="rgba(255,120,170,.55)" g2="rgba(110,231,183,.26)">
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <h3 className="whitespace-nowrap text-[clamp(80px,11vw,180px)] font-[700] italic leading-none tracking-[-0.03em]" style={{ fontFamily: F.fr }} aria-label={M681_WORD}>
            {[...M681_WORD].map((ch, i) => (
              <span key={i} className="m681-l relative inline-block will-change-transform" style={{ "--c": last[i] } as CSSProperties} aria-hidden>
                <span className="m681-g absolute inset-0" style={{ color: "var(--c)", filter: "blur(10px)", opacity: 0 }}>
                  {ch}
                </span>
                <span className="relative" style={{ color: "var(--c)" }}>
                  {ch}
                </span>
              </span>
            ))}
          </h3>
          <p className="mt-6 text-[14px] uppercase tracking-[0.24em] text-white/65" style={{ fontFamily: F.mr }}>
            Festival edit · seven colours · from ₹1,299
          </p>
        </div>
      </div>
    </Stage>
  );
}

/* ───────────────────────── M682 · Cursor-proximity scramble (ScrambleText per char, fake pointer) ───────────────────────── */
const M682_LINES = [
  ["Every", "pixel"],
  ["has", "a", "reason"],
  ["to", "exist."],
];
const M682_CHARS = "!<>-_/[]{}=+*^?#01";
function M682() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLSpanElement>(null);
  const ptr = usePointer(root);
  const st = useRef<{ spans: HTMLElement[]; cx: number[]; cy: number[]; orig: string[]; busy: boolean[]; ready: boolean }>({ spans: [], cx: [], cy: [], orig: [], busy: [], ready: false });
  const cur = useRef({ x: 0.1, y: 0.5 });
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    let dead = false;
    const measure = () => {
      const s = st.current;
      const r = el.getBoundingClientRect();
      s.spans.forEach((sp) => {
        sp.style.width = "";
      });
      const rects = s.spans.map((sp) => sp.getBoundingClientRect());
      s.spans.forEach((sp, i) => {
        sp.style.width = `${rects[i].width}px`;
        s.cx[i] = rects[i].left - r.left + rects[i].width / 2;
        s.cy[i] = rects[i].top - r.top + rects[i].height / 2;
      });
    };
    document.fonts.ready.then(() => {
      if (dead) return;
      const s = st.current;
      s.spans = gsap.utils.toArray<HTMLElement>(".m682-c", el);
      s.orig = s.spans.map((sp) => sp.textContent ?? "");
      s.busy = s.spans.map(() => false);
      measure();
      s.ready = true;
    });
    const ro = new ResizeObserver(() => st.current.ready && measure());
    ro.observe(el);
    return () => {
      dead = true;
      ro.disconnect();
      const s = st.current;
      gsap.killTweensOf(s.spans);
      s.spans.forEach((sp, i) => (sp.textContent = s.orig[i]));
    };
  }, []);
  useTicker(root, (t, dt) => {
    const el = root.current;
    const s = st.current;
    if (!el || !s.ready) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    const p = ptr.current;
    const real = realActive(p);
    const tx = real ? p.x : 0.5 + 0.36 * Math.sin(t * 0.9);
    const ty = real ? p.y : 0.47 + 0.2 * Math.sin(t * 1.7 + 0.8);
    const k = 1 - Math.exp(-(dt || 0.016) * 6);
    cur.current.x += (tx - cur.current.x) * k;
    cur.current.y += (ty - cur.current.y) * k;
    const px = cur.current.x * w;
    const py = cur.current.y * h;
    if (dot.current) {
      dot.current.style.transform = `translate3d(${px}px,${py}px,0) scale(5.5)`;
      dot.current.style.opacity = real ? "0" : "1";
    }
    const R = Math.min(150, w * 0.11);
    s.spans.forEach((sp, i) => {
      const d = Math.hypot(s.cx[i] - px, s.cy[i] - py);
      const near = d < R;
      sp.style.color = near ? "#7cf7c6" : "";
      if (near && !s.busy[i] && s.orig[i].trim()) {
        s.busy[i] = true;
        gsap.to(sp, {
          duration: 0.55,
          scrambleText: { text: s.orig[i], chars: M682_CHARS, speed: 0.8, revealDelay: 0.2 },
          ease: "none",
          onComplete: () => (s.busy[i] = false),
        });
      }
    });
  });
  return (
    <Stage r={root} g1="rgba(124,247,198,.5)" g2="rgba(79,141,255,.26)">
      <div className="absolute inset-0 grid place-items-center">
        <h3 className="text-center text-[clamp(52px,6vw,96px)] font-[600] leading-[1.05] tracking-[-0.02em]" style={{ fontFamily: F.sg }}>
          {M682_LINES.map((line, li) => (
            <span key={li} className="block whitespace-nowrap">
              {line.map((word, wi) => (
                <span key={wi} className={`inline-block whitespace-nowrap ${wi < line.length - 1 ? "mr-[0.28em]" : ""}`}>
                  {[...word].map((ch, ci) => (
                    <span key={ci} className="m682-c inline-block text-center transition-colors duration-150">
                      {ch}
                    </span>
                  ))}
                </span>
              ))}
            </span>
          ))}
        </h3>
      </div>
      <span ref={dot} className="b15g3-dot" style={{ opacity: 0, border: "1px solid rgba(124,247,198,.7)", background: "rgba(124,247,198,.05)" }} aria-hidden />
      <Caption>Northwind Labs · Interface studio</Caption>
    </Stage>
  );
}

/* ───────────────────────── M683 · Dashed-vector letters under a scan line (canvas, drag + spring) ───────────────────────── */
const M683_WORD = "VOLTAIC";
function M683() {
  const root = useRef<HTMLDivElement>(null);
  const fb = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const ptr = usePointer(root);
  const run = useRef<((t: number, dt: number) => void) | null>(null);
  useNear(root, () => {
    const c = cv.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const fit = fitCanvas(c);
    const L = [...M683_WORD].map(() => ({ oy: 0, vy: 0 }));
    if (fb.current) fb.current.style.visibility = "hidden";
    let grabbed = -1;
    run.current = (t, dt) => {
      const { w, h, d } = fit.st;
      ctx.setTransform(d, 0, 0, d, 0, 0);
      ctx.clearRect(0, 0, w, h);
      let fs = h * 0.34;
      ctx.font = `800 ${fs}px "${F.sy}", system-ui, sans-serif`;
      let tw = ctx.measureText(M683_WORD).width;
      if (tw > w * 0.8) {
        fs *= (w * 0.8) / tw;
        ctx.font = `800 ${fs}px "${F.sy}", system-ui, sans-serif`;
        tw = ctx.measureText(M683_WORD).width;
      }
      const base = h * 0.6;
      const p = ptr.current;
      const real = realActive(p);
      const sweep = (t * 0.3) % 1;
      const sx = real ? p.x * w : (sweep * 1.3 - 0.15) * w;
      const pass = Math.floor(t * 0.3);
      // baseline guide
      ctx.save();
      ctx.setLineDash([4, 8]);
      ctx.strokeStyle = "rgba(255,255,255,.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w * 0.06, base);
      ctx.lineTo(w * 0.94, base);
      ctx.stroke();
      ctx.restore();
      let x = (w - tw) / 2;
      const chars = [...M683_WORD];
      if (real && p.down && grabbed < 0) {
        // pick the nearest letter under the pointer
        let best = 1e9;
        let xx = x;
        chars.forEach((ch, i) => {
          const cw = ctx.measureText(ch).width;
          const dd = Math.abs(xx + cw / 2 - p.x * w);
          if (dd < best) {
            best = dd;
            grabbed = i;
          }
          xx += cw;
        });
      }
      if (!p.down) grabbed = -1;
      chars.forEach((ch, i) => {
        const cw = ctx.measureText(ch).width;
        const cx = x + cw / 2;
        const dist = Math.abs(cx - sx) / (fs * 0.9);
        const k0 = Math.max(0, 1 - dist);
        const k = k0 * k0 * (3 - 2 * k0);
        // auto: one letter per pass gets lifted off the baseline by the scan
        let target = 0;
        if (real && grabbed === i) target = p.y * h - base + fs * 0.35;
        else if (!real && i === pass % chars.length) target = -fs * 0.42 * k;
        const s = L[i];
        const hdt = Math.min(0.033, dt || 0.016);
        s.vy += ((target - s.oy) * 160 - s.vy * 11) * hdt;
        s.oy += s.vy * hdt;
        const y = base + s.oy;
        ctx.globalAlpha = 1 - 0.88 * k;
        ctx.fillStyle = "#eaf5ff";
        ctx.fillText(ch, x, y);
        if (k > 0.01) {
          ctx.globalAlpha = k;
          ctx.save();
          ctx.setLineDash([7, 6]);
          ctx.lineDashOffset = -t * 40;
          ctx.lineWidth = 1.6;
          ctx.strokeStyle = "#ffb15c";
          ctx.strokeText(ch, x, y);
          ctx.restore();
          // specks at the glyph box corners + a label
          const top = y - fs * 0.74;
          ctx.fillStyle = "#ffb15c";
          [
            [x, top],
            [x + cw, top],
            [x, y],
            [x + cw, y],
          ].forEach(([a, b]) => ctx.fillRect(a - 2.5, b - 2.5, 5, 5));
          ctx.fillStyle = "rgba(255,255,255,.75)";
          ctx.font = `500 12px "${F.mr}", system-ui, sans-serif`;
          ctx.fillText(`${ch} · x ${Math.round(cx)} · y ${(s.oy / fs).toFixed(2)}`, x, top - 10);
          ctx.font = `800 ${fs}px "${F.sy}", system-ui, sans-serif`;
        }
        x += cw;
      });
      ctx.globalAlpha = 1;
      // scan line
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "rgba(255,177,92,0)");
      g.addColorStop(0.5, "rgba(255,177,92,.85)");
      g.addColorStop(1, "rgba(255,177,92,0)");
      ctx.fillStyle = g;
      ctx.fillRect(sx - 0.75, 0, 1.5, h);
      ctx.fillStyle = "rgba(255,177,92,.08)";
      ctx.fillRect(sx - 40, 0, 80, h);
    };
    return () => {
      run.current = null;
      fit.stop();
    };
  });
  useTicker(root, (t, dt) => run.current?.(t, dt));
  return (
    <Stage r={root} g1="rgba(255,177,92,.5)" g2="rgba(79,141,255,.26)" top>
      <canvas ref={cv} className="absolute inset-0 z-[1] h-full w-full cursor-grab" aria-label={M683_WORD} />
      <div ref={fb} className="pointer-events-none absolute inset-0 grid place-items-center text-[clamp(72px,9vw,150px)] font-[800] text-white/90" style={{ fontFamily: F.sy }} aria-hidden>
        {M683_WORD}
      </div>
      <Caption>Voltaic Instruments · Bench supply · ₹14,800</Caption>
    </Stage>
  );
}

/* ───────────────────────── M684 · Dipole iron filings form text (canvas flow field) ───────────────────────── */
function M684() {
  const root = useRef<HTMLDivElement>(null);
  const fb = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const ptr = usePointer(root);
  const run = useRef<((t: number, dt: number) => void) | null>(null);
  useNear(root, () => {
    const c = cv.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const fit = fitCanvas(c);
    let grid: { x: number; y: number; m: number; a: number }[] = [];
    let gw = 0;
    let gh = 0;
    const build = () => {
      const { w, h } = fit.st;
      gw = w;
      gh = h;
      const off = document.createElement("canvas");
      off.width = Math.round(w);
      off.height = Math.round(h);
      const x = off.getContext("2d")!;
      let size = h * 0.36;
      x.font = `800 ${size}px "${F.sy}", system-ui, sans-serif`;
      const mw = x.measureText("FIELD").width;
      if (mw > w * 0.72) size *= (w * 0.72) / mw;
      x.font = `800 ${size}px "${F.sy}", system-ui, sans-serif`;
      x.fillStyle = "#fff";
      x.textAlign = "center";
      x.textBaseline = "middle";
      x.fillText("FIELD", w / 2, h * 0.47);
      const data = x.getImageData(0, 0, off.width, off.height).data;
      const sp = 12;
      grid = [];
      for (let y = sp / 2; y < h; y += sp)
        for (let xx = sp / 2; xx < w; xx += sp) {
          const i = (Math.round(y) * off.width + Math.round(xx)) * 4 + 3;
          grid.push({ x: xx, y, m: data[i] > 120 ? 1 : 0, a: 0 });
        }
    };
    const cur = { x: 0.2, y: 0.5 };
    const B = 6;
    if (fb.current) fb.current.style.opacity = "0.12";
    run.current = (t, dt) => {
      const { w, h, d } = fit.st;
      if (Math.abs(w - gw) > 1 || Math.abs(h - gh) > 1) build();
      ctx.setTransform(d, 0, 0, d, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const p = ptr.current;
      const real = realActive(p);
      const tx = real ? p.x : 0.5 + 0.48 * Math.sin(t * 0.55);
      const ty = real ? p.y : 0.5 + 0.28 * Math.sin(t * 1.1);
      const k = 1 - Math.exp(-(dt || 0.016) * 4);
      cur.x += (tx - cur.x) * k;
      cur.y += (ty - cur.y) * k;
      const px = cur.x * w;
      const py = cur.y * h;
      const th = t * 0.6;
      const sep = Math.min(w, h) * 0.07;
      const p1x = px - Math.cos(th) * sep;
      const p1y = py - Math.sin(th) * sep;
      const p2x = px + Math.cos(th) * sep;
      const p2y = py + Math.sin(th) * sep;
      const sig = w * 0.28;
      const sig2 = 2 * sig * sig;
      const paths: Path2D[] = Array.from({ length: B * 2 }, () => new Path2D());
      const ease = Math.min(1, (dt || 0.016) * 10);
      for (const g of grid) {
        const ax = g.x - p1x;
        const ay = g.y - p1y;
        const bx = g.x - p2x;
        const by = g.y - p2y;
        const ra = Math.pow(ax * ax + ay * ay + 400, 1.5);
        const rb = Math.pow(bx * bx + by * by + 400, 1.5);
        const ex = ax / ra - bx / rb;
        const ey = ay / ra - by / rb;
        let ta = Math.atan2(ey, ex);
        // filings have no head: turn the short way (mod π)
        let da = ta - g.a;
        da -= Math.PI * Math.round(da / Math.PI);
        g.a += da * ease;
        ta = g.a;
        const dd = (g.x - px) * (g.x - px) + (g.y - py) * (g.y - py);
        const near = Math.exp(-dd / sig2);
        const f = g.m ? 0.18 + 0.82 * near : 0.1 + 0.16 * near;
        const len = g.m ? 3 + 4.5 * near : 3.4;
        const bucket = Math.min(B - 1, Math.floor(f * B)) + (g.m ? B : 0);
        const cx = Math.cos(ta) * len;
        const cy = Math.sin(ta) * len;
        paths[bucket].moveTo(g.x - cx, g.y - cy);
        paths[bucket].lineTo(g.x + cx, g.y + cy);
      }
      ctx.lineCap = "round";
      for (let i = 0; i < B * 2; i++) {
        const isText = i >= B;
        const a = ((i % B) + 0.5) / B;
        ctx.strokeStyle = isText ? `rgba(255,196,120,${a.toFixed(3)})` : `rgba(200,215,240,${a.toFixed(3)})`;
        ctx.lineWidth = isText ? 1.9 : 1.1;
        ctx.stroke(paths[i]);
      }
      // the two poles
      ctx.fillStyle = "#ff6b6b";
      ctx.beginPath();
      ctx.arc(p1x, p1y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#5ab0ff";
      ctx.beginPath();
      ctx.arc(p2x, p2y, 5, 0, Math.PI * 2);
      ctx.fill();
    };
    return () => {
      run.current = null;
      fit.stop();
    };
  });
  useTicker(root, (t, dt) => run.current?.(t, dt));
  return (
    <Stage r={root} g1="rgba(255,170,90,.5)" g2="rgba(90,176,255,.26)" top>
      <div ref={fb} className="pointer-events-none absolute inset-0 grid place-items-center text-[clamp(80px,11vw,180px)] font-[800] text-white/80" style={{ fontFamily: F.sy }} aria-hidden>
        FIELD
      </div>
      <canvas ref={cv} className="absolute inset-0 h-full w-full" aria-label="FIELD" />
      <Caption>Field Notes Magnetics · Desk set · ₹3,600</Caption>
    </Stage>
  );
}

/* ───────────────────────── M685 · Fuzzy vibrating text (canvas row shift, hover raises it) ───────────────────────── */
function M685() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const dot = useRef<HTMLSpanElement>(null);
  const fb = useRef<HTMLDivElement>(null);
  const ptr = usePointer(root);
  const run = useRef<((t: number, dt: number) => void) | null>(null);
  useNear(root, (el) => {
    const c = cv.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const fit = fitCanvas(c);
    let off: HTMLCanvasElement | null = null;
    let ow = 0;
    let ohh = 0;
    let box = { x: 0, y: 0, w: 0, h: 0 };
    const build = () => {
      const { w, h, d } = fit.st;
      ow = w;
      ohh = h;
      const o = document.createElement("canvas");
      const tw = Math.round(w * 0.8);
      const th = Math.round(h * 0.5);
      o.width = Math.round(tw * d);
      o.height = Math.round(th * d);
      const x = o.getContext("2d")!;
      x.scale(d, d);
      let size = th * 0.62;
      x.font = `800 ${size}px "${F.sy}", system-ui, sans-serif`;
      const mw = x.measureText("LOW HUM").width;
      if (mw > tw * 0.92) size *= (tw * 0.92) / mw;
      x.font = `800 ${size}px "${F.sy}", system-ui, sans-serif`;
      x.fillStyle = "#f3f6ff";
      x.textAlign = "center";
      x.textBaseline = "middle";
      x.fillText("LOW HUM", tw / 2, th * 0.42);
      x.font = `500 ${Math.max(14, size * 0.13)}px "${F.mr}", system-ui, sans-serif`;
      x.fillStyle = "#ff8fb1";
      x.fillText("NIGHT RADIO · 88.4 · LIVE TILL 3 AM", tw / 2, th * 0.42 + size * 0.68);
      off = o;
      box = { x: (w - tw) / 2, y: (h - th) / 2, w: tw, h: th };
      if (fb.current) fb.current.style.visibility = "hidden";
    };
    // auto hover for filming: the fake pointer walks onto the word, rests, walks off
    const auto = { x: 0.08, y: 0.78, hover: 0 };
    const tl = gsap.timeline({ repeat: -1 });
    tl.to(auto, { x: 0.46, y: 0.48, duration: 0.6, ease: "power2.inOut" })
      .set(auto, { hover: 1 })
      .to(auto, { x: 0.56, y: 0.44, duration: 0.9, ease: "sine.inOut" })
      .to(auto, { x: 0.9, y: 0.8, duration: 0.6, ease: "power2.inOut" })
      .set(auto, { hover: 0 }, "-=0.45")
      .to(auto, { x: 0.08, y: 0.78, duration: 0.7, ease: "sine.inOut" });
    let I = 4;
    const r = rng(685);
    run.current = (t, dt) => {
      const { w, h, d } = fit.st;
      if (!off || Math.abs(w - ow) > 1 || Math.abs(h - ohh) > 1) build();
      if (!off) return;
      const p = ptr.current;
      const real = realActive(p);
      let hov: boolean;
      if (real) {
        hov = p.x * w > box.x && p.x * w < box.x + box.w && p.y * h > box.y && p.y * h < box.y + box.h;
      } else hov = auto.hover > 0.5;
      const target = hov ? 28 : 4;
      I += (target - I) * Math.min(1, (dt || 0.016) * 7);
      if (dot.current) {
        dot.current.style.transform = `translate3d(${auto.x * el.clientWidth}px,${auto.y * el.clientHeight}px,0)`;
        dot.current.style.opacity = real ? "0" : "1";
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, c.width, c.height);
      const rowPx = Math.max(1, Math.round(2 * d));
      const bx = box.x * d;
      const by = box.y * d;
      for (let y = 0; y < off.height; y += rowPx) {
        const dx = (r() - 0.5) * 2 * I * d;
        ctx.drawImage(off, 0, y, off.width, rowPx, bx + dx, by + y, off.width, rowPx);
      }
      void t;
    };
    return () => {
      tl.kill();
      run.current = null;
      fit.stop();
    };
  });
  useTicker(root, (t, dt) => run.current?.(t, dt));
  return (
    <Stage r={root} g1="rgba(255,120,170,.5)" g2="rgba(120,140,255,.26)">
      <div ref={fb} className="absolute inset-0 grid place-items-center text-center" aria-hidden>
        <div>
          <div className="text-[clamp(72px,10vw,170px)] font-[800] leading-none" style={{ fontFamily: F.sy }}>
            LOW HUM
          </div>
          <div className="mt-4 text-[15px] tracking-[0.12em] text-[#ff8fb1]" style={{ fontFamily: F.mr }}>
            NIGHT RADIO · 88.4 · LIVE TILL 3 AM
          </div>
        </div>
      </div>
      <canvas ref={cv} className="absolute inset-0 h-full w-full" aria-label="Low Hum" />
      <span ref={dot} className="b15g3-dot" style={{ opacity: 0 }} aria-hidden />
    </Stage>
  );
}

/* ───────────────────────── M686 · Glitch text with clip slices (RGB split + slices + scramble bursts) ───────────────────────── */
const M686_LINES = ["GLITCH", "SEASON"];
function M686() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const base = gsap.utils.toArray<HTMLElement>(".m686-base", el);
    const red = el.querySelector<HTMLElement>(".m686-r");
    const cyan = el.querySelector<HTMLElement>(".m686-c");
    const slice = el.querySelector<HTMLElement>(".m686-s");
    const r = rng(686);
    const tl = gsap.timeline({ repeat: -1, paused: true });
    const burst = (at: number, steps: number, scramble: boolean) => {
      for (let s = 0; s < steps; s++) {
        const t = at + s * 0.05;
        const a = Math.round(r() * 70);
        const b = Math.max(0, 100 - a - 8 - Math.round(r() * 30));
        const sa = Math.round(r() * 85);
        tl.set(red, { opacity: 0.9, x: (r() - 0.5) * 26, clipPath: `inset(${a}% 0 ${b}% 0)` }, t);
        tl.set(cyan, { opacity: 0.9, x: (r() - 0.5) * 26, clipPath: `inset(${b}% 0 ${a}% 0)` }, t);
        tl.set(slice, { opacity: 1, x: (r() - 0.5) * 60, clipPath: `inset(${sa}% 0 ${Math.max(0, 100 - sa - 6)}% 0)` }, t);
        tl.set(base, { x: (r() - 0.5) * 8, skewX: (r() - 0.5) * 6 }, t);
      }
      if (scramble) base.forEach((b) => tl.to(b, { duration: steps * 0.05, scrambleText: { text: b.dataset.t ?? "", chars: "#%&@$01<>/", speed: 1.2 }, ease: "none" }, at));
      const end = at + steps * 0.05;
      tl.set(red, { opacity: 0, x: 0 }, end);
      tl.set(cyan, { opacity: 0, x: 0 }, end);
      tl.set(slice, { opacity: 0, x: 0 }, end);
      tl.set(base, { x: 0, skewX: 0 }, end);
    };
    burst(0, 5, true);
    burst(0.48, 3, false);
    burst(0.84, 4, true);
    tl.to({}, { duration: 0.01 }, 1.3);
    return tl;
  });
  const layer = (cls: string, color: string) => (
    <div className={`${cls} pointer-events-none absolute inset-0`} style={{ color, opacity: 0, mixBlendMode: "screen" }} aria-hidden>
      {M686_LINES.map((l) => (
        <div key={l}>{l}</div>
      ))}
    </div>
  );
  return (
    <Stage r={root} g1="rgba(45,226,255,.5)" g2="rgba(255,59,92,.26)">
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative text-center text-[clamp(80px,9.5vw,160px)] font-[700] leading-[0.92] tracking-[-0.02em]" style={{ fontFamily: F.sg }}>
          {M686_LINES.map((l) => (
            <div key={l} className="m686-base" data-t={l}>
              {l}
            </div>
          ))}
          {layer("m686-r", "#ff3b5c")}
          {layer("m686-c", "#2de2ff")}
          {layer("m686-s", "#ffffff")}
          <div className="m686-scan" aria-hidden />
        </div>
      </div>
      <Caption>Pixel Drift · Streetwear drop 04 · ₹2,799</Caption>
    </Stage>
  );
}

/* ───────────────────────── M687 · Gooey marquee (CSS marquee over an SVG goo ribbon) ───────────────────────── */
const M687_ITEMS = ["Fresh drop", "Free shipping over ₹2,999", "Limited run", "Small batch"];
function M687() {
  const root = useRef<HTMLDivElement>(null);
  useOffClass(root, "m687-off");
  const track = (cls: string, style: CSSProperties) => (
    <div className="m687-run" aria-hidden>
      {[0, 1].map((k) => (
        <div key={k} className={`flex shrink-0 items-center ${cls}`} style={style}>
          {M687_ITEMS.map((it) => (
            <span key={it} className="flex items-center whitespace-nowrap">
              <span className="px-[0.5em]">{it}</span>
              <span className="px-[0.2em]">•</span>
            </span>
          ))}
        </div>
      ))}
    </div>
  );
  return (
    <Stage r={root} g1="rgba(255,138,76,.55)" g2="rgba(160,120,255,.24)">
      <svg width="0" height="0" className="absolute" aria-hidden>
        <filter id="m687-goo" x="-5%" y="-30%" width="110%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="b" />
          <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" />
        </filter>
      </svg>
      <div className="absolute inset-x-0 top-1/2 h-[220px] -mt-[110px]">
        <div className="absolute inset-0 overflow-hidden" style={{ filter: "url(#m687-goo)" }}>
          <div className="absolute inset-x-0 top-1/2 -mt-[0.6em] text-[clamp(56px,6vw,96px)] font-[800] uppercase leading-[1.2] text-[#ff8a4c]" style={{ fontFamily: F.sy }}>
            {track("", { WebkitTextStroke: "14px #ff8a4c" })}
          </div>
          {[8, 22, 37, 52, 66, 81, 94].map((l, i) => (
            <span key={l} className="m687-blob" style={{ left: `${l}%`, top: "26%", width: 70 + (i % 3) * 22, height: 70 + (i % 3) * 22, animationDelay: `${-i * 0.45}s` }} />
          ))}
        </div>
        <div className="absolute inset-x-0 top-1/2 -mt-[0.6em] overflow-hidden text-[clamp(56px,6vw,96px)] font-[800] uppercase leading-[1.2] text-[#160c08]" style={{ fontFamily: F.sy }}>
          {track("", {})}
        </div>
        <p className="sr-only">{M687_ITEMS.join(" · ")}</p>
      </div>
      <Caption>Oat &amp; Ember Bakehouse · weekend loaves</Caption>
    </Stage>
  );
}

/* ───────────────────────── M688 · Letter hover playground (six mechanics, fake pointer walks them) ───────────────────────── */
const M688_WORD = "TOYBOX";
const M688_MECH = ["jump", "swing", "redraw", "slide", "weave", "trail"];
function M688() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLSpanElement>(null);
  usePlay(root, (el, onClean) => {
    const letters = gsap.utils.toArray<HTMLElement>(".m688-l", el);
    const make = (l: HTMLElement, i: number) => {
      const tl = gsap.timeline({ paused: true });
      const inner = l.querySelector<HTMLElement>(".m688-i");
      const m = M688_MECH[i];
      if (m === "jump") {
        const circ = l.querySelector<HTMLElement>(".m688-circ");
        tl.fromTo(circ, { scale: 0, opacity: 0.9 }, { scale: 1.4, opacity: 0, duration: 0.6, ease: "power2.out" }, 0);
        tl.to(inner, { keyframes: [{ y: "-0.32em", duration: 0.2, ease: "power2.out" }, { y: 0, duration: 0.3, ease: "power2.in" }] }, 0);
      } else if (m === "swing") {
        tl.to(inner, { keyframes: [{ rotation: 22, duration: 0.15 }, { rotation: -14, duration: 0.2 }, { rotation: 7, duration: 0.18 }, { rotation: 0, duration: 0.2 }], ease: "sine.inOut" });
      } else if (m === "redraw") {
        const fill = l.querySelector<HTMLElement>(".m688-fill");
        tl.set(fill, { clipPath: "inset(100% 0 0 0)" }, 0).to(fill, { clipPath: "inset(0% 0 0 0)", duration: 0.55, ease: "power2.inOut" }, 0.08);
      } else if (m === "slide") {
        tl.fromTo(inner, { yPercent: 0 }, { yPercent: -50, duration: 0.45, ease: "power3.inOut" });
      } else if (m === "weave") {
        tl.to(inner, { keyframes: [{ y: -14, skewX: 14, duration: 0.14 }, { y: 12, skewX: -12, duration: 0.16 }, { y: -6, skewX: 6, duration: 0.14 }, { y: 0, skewX: 0, duration: 0.16 }], ease: "sine.inOut" });
      } else {
        const ghosts = gsap.utils.toArray<HTMLElement>(".m688-ghost", l);
        tl.to(inner, { keyframes: [{ x: "0.35em", duration: 0.22, ease: "power2.out" }, { x: 0, duration: 0.3, ease: "power2.inOut" }] }, 0);
        ghosts.forEach((g, k) => {
          tl.fromTo(g, { opacity: 0.5 - k * 0.14 }, { keyframes: [{ x: "0.35em", duration: 0.22, ease: "power2.out" }, { x: 0, duration: 0.3, ease: "power2.inOut" }] }, 0.05 * (k + 1));
          tl.to(g, { opacity: 0, duration: 0.15 }, 0.55 + 0.05 * k);
        });
      }
      return tl;
    };
    const tls = letters.map(make);
    const fire = (i: number) => tls[i].restart();
    const enters = letters.map((l, i) => {
      const f = () => fire(i);
      l.addEventListener("pointerenter", f);
      return f;
    });
    onClean(() => letters.forEach((l, i) => l.removeEventListener("pointerenter", enters[i])));
    onClean(() => tls.forEach((t) => t.kill()));
    // fake pointer: walks letter to letter (rest ≤ 0.5 s), each arrival fires that letter's mechanic
    const r = el.getBoundingClientRect();
    const pts = letters.map((l) => {
      const b = l.getBoundingClientRect();
      return { x: b.left - r.left + b.width / 2, y: b.top - r.top + b.height * 0.55 };
    });
    const d = dot.current;
    const walk = gsap.timeline({ repeat: -1, paused: true });
    if (d) {
      walk.set(d, { opacity: 1, x: pts[0].x - 120, y: pts[0].y + 60 });
      pts.forEach((p, i) => {
        walk.to(d, { x: p.x, y: p.y, duration: 0.32, ease: "power2.inOut" });
        walk.call(() => fire(i));
        walk.to(d, { scale: 0.8, duration: 0.12, yoyo: true, repeat: 1 });
        walk.to(d, { x: p.x + 6, duration: 0.2, ease: "sine.inOut" });
      });
      walk.to(d, { x: pts[pts.length - 1].x + 120, y: pts[0].y + 60, duration: 0.3, ease: "power2.in" });
    }
    return walk;
  });
  return (
    <Stage r={root} g1="rgba(255,206,92,.52)" g2="rgba(255,92,140,.26)">
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <h3 className="flex whitespace-nowrap text-[clamp(84px,10vw,170px)] font-[800] leading-none" style={{ fontFamily: F.sy }} aria-label={M688_WORD}>
            {[...M688_WORD].map((ch, i) => {
              const m = M688_MECH[i];
              return (
                <span key={i} className={`m688-l relative inline-block px-[0.04em] ${m === "slide" ? "h-[1em] overflow-hidden" : ""}`} aria-hidden>
                  {m === "jump" && <span className="m688-circ absolute left-1/2 top-1/2 -ml-[0.4em] -mt-[0.4em] h-[0.8em] w-[0.8em] rounded-full border-[3px] border-[#ffce5c]" style={{ opacity: 0 }} />}
                  {m === "trail" &&
                    [0, 1, 2].map((k) => (
                      <span key={k} className="m688-ghost absolute inset-0 px-[0.04em] text-[#ff5c8c]" style={{ opacity: 0 }}>
                        {ch}
                      </span>
                    ))}
                  {m === "slide" ? (
                    <span className="m688-i flex flex-col leading-none">
                      <span className="block h-[1em]">{ch}</span>
                      <span className="block h-[1em] text-[#ffce5c]">{ch}</span>
                    </span>
                  ) : m === "redraw" ? (
                    <span className="m688-i relative inline-block">
                      <span style={{ color: "transparent", WebkitTextStroke: "2px #eaf5ff" }}>{ch}</span>
                      <span className="m688-fill absolute inset-0 text-[#7cc8ff]">{ch}</span>
                    </span>
                  ) : (
                    <span className={`m688-i relative inline-block ${m === "swing" ? "origin-top" : ""}`}>{ch}</span>
                  )}
                </span>
              );
            })}
          </h3>
          <p className="mt-6 text-[14px] uppercase tracking-[0.24em] text-white/60" style={{ fontFamily: F.mr }}>
            jump · swing · redraw · slide · weave · trail
          </p>
        </div>
      </div>
      <span ref={dot} className="b15g3-dot" style={{ opacity: 0 }} aria-hidden />
      <Caption>Toybox Studio · Wooden blocks set · ₹1,850</Caption>
    </Stage>
  );
}

/* ───────────────────────── M689 · Letters with flying shapes (letters rise, shapes burst and fall) ───────────────────────── */
const M689_WORD = "CONFETTI";
const M689_N = 6;
const M689_COL = ["#ffce5c", "#ff5c8c", "#5ab0ff", "#7cf7c6", "#b388ff"];
function M689() {
  const root = useRef<HTMLDivElement>(null);
  usePlay(root, (el) => {
    const letters = gsap.utils.toArray<HTMLElement>(".m689-i", el);
    const shapes = gsap.utils.toArray<HTMLElement>(".m689-sh", el);
    const r = rng(689);
    const tl = gsap.timeline({ repeat: -1, paused: true });
    tl.set(letters, { yPercent: 110 }, 0);
    tl.set(shapes, { x: 0, y: 0, scale: 0, opacity: 0, rotation: 0 }, 0);
    tl.to(letters, { yPercent: 0, duration: 0.6, ease: "power3.out", stagger: 0.07 }, 0);
    shapes.forEach((s, j) => {
      const li = Math.floor(j / M689_N);
      const at = li * 0.07 + 0.12;
      const ang = -Math.PI / 2 + (r() - 0.5) * Math.PI * 1.3;
      const dist = 60 + r() * 90;
      const dx = Math.cos(ang) * dist;
      const dy = Math.sin(ang) * dist;
      tl.to(s, { opacity: 1, scale: 0.7 + r() * 0.6, x: dx, y: dy, rotation: (r() - 0.5) * 360, duration: 0.5, ease: "power2.out" }, at);
      tl.to(s, { y: dy + 120 + r() * 80, x: dx * 1.25, rotation: `+=${(r() - 0.5) * 260}`, opacity: 0, duration: 0.8, ease: "power1.in" }, at + 0.5);
    });
    tl.to(letters, { yPercent: -110, duration: 0.5, ease: "power3.in", stagger: 0.05 }, 1.75);
    return tl;
  });
  return (
    <Stage r={root} g1="rgba(255,206,92,.52)" g2="rgba(90,176,255,.26)">
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <h3 className="flex whitespace-nowrap text-[clamp(72px,8.5vw,140px)] font-[800] leading-none tracking-[-0.01em]" style={{ fontFamily: F.sy }} aria-label={M689_WORD}>
            {[...M689_WORD].map((ch, i) => (
              <span key={i} className="relative inline-block" aria-hidden>
                <span className="pointer-events-none absolute left-1/2 top-1/2 z-0">
                  {Array.from({ length: M689_N }, (_, k) => {
                    const kind = (i + k) % 3;
                    const col = M689_COL[(i * 2 + k) % M689_COL.length];
                    const style: CSSProperties = {
                      opacity: 0,
                      width: kind === 2 ? 18 : 14,
                      height: kind === 2 ? 9 : 14,
                      marginLeft: -7,
                      marginTop: -7,
                      background: kind === 1 ? "transparent" : col,
                      borderRadius: kind === 0 ? 999 : 2,
                      borderLeft: kind === 1 ? "8px solid transparent" : undefined,
                      borderRight: kind === 1 ? "8px solid transparent" : undefined,
                      borderBottom: kind === 1 ? `14px solid ${col}` : undefined,
                    };
                    return <span key={k} className="m689-sh absolute left-0 top-0 block" style={style} />;
                  })}
                </span>
                <span className="relative z-[1] inline-block overflow-hidden align-top">
                  <span className="m689-i inline-block">{ch}</span>
                </span>
              </span>
            ))}
          </h3>
          <p className="mt-6 text-[14px] uppercase tracking-[0.24em] text-white/60" style={{ fontFamily: F.mr }}>
            Party kits · from ₹899
          </p>
        </div>
      </div>
      <Caption>Hullabaloo Party Co. · Birthday box</Caption>
    </Stage>
  );
}

/* ───────────────────────── M690 · Ligature melt (local SVG goo under the pointer) ───────────────────────── */
const M690_TEXT = "melting point";
function M690() {
  const root = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLSpanElement>(null);
  const drips = useRef<(HTMLSpanElement | null)[]>([]);
  const ptr = usePointer(root);
  const cur = useRef({ x: 0.2, y: 0.5, lag: [0, 0, 0].map(() => ({ x: 0, y: 0 })) });
  useTicker(root, (t, dt) => {
    const el = root.current;
    const b = box.current;
    if (!el || !b) return;
    const er = el.getBoundingClientRect();
    const br = b.getBoundingClientRect();
    const p = ptr.current;
    const real = realActive(p);
    const tx = real ? p.x : 0.5 + 0.34 * Math.sin(t * 0.7);
    const ty = real ? p.y : 0.5 + 0.06 * Math.sin(t * 1.9);
    const k = 1 - Math.exp(-(dt || 0.016) * 5);
    const c = cur.current;
    c.x += (tx - c.x) * k;
    c.y += (ty - c.y) * k;
    // pointer in the text box's own px space
    const bx = c.x * er.width - (br.left - er.left);
    const by = c.y * er.height - (br.top - er.top);
    b.style.setProperty("--mx", `${bx}px`);
    b.style.setProperty("--my", `${by}px`);
    c.lag.forEach((l, i) => {
      const kk = 1 - Math.exp(-(dt || 0.016) * (3 - i * 0.7));
      l.x += (bx - l.x) * kk;
      l.y += (by + br.height * (0.18 + 0.1 * i) + Math.sin(t * 2.2 + i) * 10 - l.y) * kk;
      const d = drips.current[i];
      if (d) d.style.transform = `translate3d(${l.x}px,${l.y}px,0)`;
    });
    if (dot.current) {
      dot.current.style.transform = `translate3d(${c.x * er.width}px,${c.y * er.height}px,0) scale(6)`;
      dot.current.style.opacity = real ? "0" : "1";
    }
  });
  const textCls = "whitespace-nowrap text-[clamp(64px,8vw,132px)] font-[800] lowercase leading-[1.1] tracking-[-0.03em]";
  return (
    <Stage r={root} g1="rgba(255,150,90,.52)" g2="rgba(170,110,255,.26)">
      <svg width="0" height="0" className="absolute" aria-hidden>
        <filter id="m690-goo" x="-5%" y="-20%" width="110%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="b" />
          <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8" />
        </filter>
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div ref={box} className="relative inline-block" style={{ "--mx": "-999px", "--my": "-999px" } as CSSProperties}>
            <div
              className={textCls}
              style={{
                fontFamily: F.sy,
                WebkitMaskImage: "radial-gradient(circle 170px at var(--mx) var(--my), transparent 0, transparent 55%, #000 100%)",
                maskImage: "radial-gradient(circle 170px at var(--mx) var(--my), transparent 0, transparent 55%, #000 100%)",
              }}
            >
              {M690_TEXT}
            </div>
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                filter: "url(#m690-goo)",
                WebkitMaskImage: "radial-gradient(circle 170px at var(--mx) var(--my), #000 0, #000 55%, transparent 100%)",
                maskImage: "radial-gradient(circle 170px at var(--mx) var(--my), #000 0, #000 55%, transparent 100%)",
              }}
              aria-hidden
            >
              <div className={`${textCls} text-[#ffcf9e]`} style={{ fontFamily: F.sy }}>
                {M690_TEXT}
              </div>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  ref={(n) => {
                    drips.current[i] = n;
                  }}
                  className="absolute left-0 top-0 block rounded-full bg-[#ffcf9e]"
                  style={{ width: 30 - i * 7, height: 30 - i * 7, marginLeft: -(15 - i * 3.5), marginTop: -(15 - i * 3.5), transform: "translate3d(-999px,-999px,0)" }}
                />
              ))}
            </div>
          </div>
          <p className="mt-6 text-[14px] uppercase tracking-[0.24em] text-white/60" style={{ fontFamily: F.mr }}>
            Hand-poured candles · ₹1,450
          </p>
        </div>
      </div>
      <span ref={dot} className="b15g3-dot" style={{ opacity: 0, border: "1px solid rgba(255,207,158,.6)", background: "transparent" }} aria-hidden />
      <Caption>Tallow &amp; Wick · Small batch</Caption>
    </Stage>
  );
}

/* ───────────────────────── M691 · Liquid chrome text fill (OGL domain-warped noise inside the letters) ───────────────────────── */
const M691_FRAG = /* glsl */ `
uniform vec2 uMouse;
uniform float uPush;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}
void main() {
  vec4 tex = texture2D(uTex0, vUv);
  if (tex.a < 0.01) { gl_FragColor = vec4(0.0); return; }
  float asp = uRes.x / uRes.y;
  vec2 p = vUv * vec2(asp, 1.0) * 2.2;
  vec2 m = uMouse * vec2(asp, 1.0) * 2.2;
  vec2 d = p - m;
  float fall = exp(-dot(d, d) * 1.4);
  p += normalize(d + 1e-4) * fall * 0.45 * uPush;
  float t = uTime;
  vec2 q = vec2(fbm(p + vec2(0.0, t * 0.16)), fbm(p + vec2(5.2, 1.3) - t * 0.12));
  vec2 r = vec2(fbm(p + 3.0 * q + vec2(1.7, 9.2) + t * 0.1), fbm(p + 3.0 * q + vec2(8.3, 2.8)));
  float f = fbm(p + 3.0 * r);
  float band = 0.5 + 0.5 * sin(f * 11.0 + vUv.y * 5.0 + t * 0.7);
  float gold = step(0.5, tex.g - tex.r);
  vec3 dk = mix(vec3(0.38, 0.42, 0.5), vec3(0.48, 0.32, 0.12), gold);
  vec3 md = mix(vec3(0.8, 0.84, 0.92), vec3(0.94, 0.74, 0.38), gold);
  vec3 hi = mix(vec3(1.0), vec3(1.0, 0.95, 0.8), gold);
  vec3 col = mix(dk, md, smoothstep(0.08, 0.55, band));
  col = mix(col, hi, smoothstep(0.78, 0.98, band));
  col += mix(vec3(0.05, 0.09, 0.18), vec3(0.08, 0.04, 0.0), gold) * (1.0 - vUv.y);
  col += fall * uPush * 0.12;
  gl_FragColor = vec4(col, tex.a);
}`;
function m691Mask(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = Math.round(w);
  c.height = Math.round(h);
  const x = c.getContext("2d")!;
  x.textAlign = "center";
  x.textBaseline = "middle";
  let size = h * 0.34;
  x.font = `600 ${size}px "${F.fr}", Georgia, serif`;
  const mw = x.measureText("Liquid Metal").width;
  if (mw > w * 0.82) size *= (w * 0.82) / mw;
  x.font = `600 ${size}px "${F.fr}", Georgia, serif`;
  x.fillStyle = "#ffffff";
  x.fillText("Liquid", w / 2 - x.measureText(" Metal").width / 2, h * 0.46);
  x.fillStyle = "#00ff00";
  x.fillText("Metal", w / 2 + x.measureText("Liquid ").width / 2, h * 0.46);
  return c;
}
function M691() {
  const root = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const fb = useRef<HTMLDivElement>(null);
  const ptr = usePointer(root);
  useNear(root, () => {
    const canvas = cv.current;
    if (!canvas) return;
    let dead = false;
    let h: GLHandle | null = null;
    const cur = { x: 0.2, y: 0.5, s: 0 };
    let last = 0;
    (async () => {
      const box = canvas.parentElement!.getBoundingClientRect();
      h = await createShader(canvas, M691_FRAG, {
        dpr: 1,
        textures: [m691Mask(Math.max(1, box.width), Math.max(1, box.height))],
        uniforms: { uMouse: { value: [0.5, 0.5] }, uPush: { value: 0 } },
        onFrame: (u, t) => {
          const dt = Math.min(0.1, last ? t - last : 0.016);
          last = t;
          const p = ptr.current;
          const real = realActive(p);
          const tx = real ? p.x : 0.5 + 0.4 * Math.sin(t * 0.75);
          const ty = real ? p.y : 0.46 + 0.14 * Math.sin(t * 1.6 + 0.5);
          const k = 1 - Math.exp(-dt * 5);
          const vx = (tx - cur.x) * k;
          const vy = (ty - cur.y) * k;
          cur.x += vx;
          cur.y += vy;
          cur.s += (Math.min(1, 0.45 + Math.hypot(vx, vy) * 60) - cur.s) * (1 - Math.exp(-dt * 4));
          u.uMouse.value = [cur.x, 1 - cur.y];
          u.uPush.value = cur.s;
          if (fb.current && fb.current.style.visibility !== "hidden") fb.current.style.visibility = "hidden";
        },
      });
      if (dead) h?.destroy();
    })();
    return () => {
      dead = true;
      h?.destroy();
      h = null;
    };
  });
  return (
    <Stage r={root} g1="rgba(160,190,255,.5)" g2="rgba(255,190,90,.26)">
      <div ref={fb} className="absolute inset-0 grid place-items-center" aria-hidden>
        <div className="whitespace-nowrap text-[clamp(72px,9vw,150px)] font-[600] leading-none" style={{ fontFamily: F.fr }}>
          <span className="bg-[linear-gradient(180deg,#ffffff,#9aa6ba_55%,#e8edf6)] bg-clip-text text-transparent">Liquid</span>{" "}
          <span className="bg-[linear-gradient(180deg,#fff3d6,#c99a4a_55%,#ffe2a6)] bg-clip-text text-transparent">Metal</span>
        </div>
      </div>
      <canvas ref={cv} className="absolute inset-0 h-full w-full" style={{ opacity: 0 }} aria-label="Liquid Metal" />
      <Caption>Ferro Atelier · Chrome &amp; gold cuffs · ₹18,900</Caption>
    </Stage>
  );
}

export const DEFS: MotionDef[] = [
  { code: "M680", name: "ASCII text render", how: "A headline on a waving, pointer-tilted plane is redrawn as gradient ASCII glyphs (WebGL ASCII pass); auto sway.", kind: "play", C: M680 },
  { code: "M681", name: "Colour-cycling letters", how: "Every beat each letter jumps to a new palette colour with a y-bounce, 1.05 scale and glow flash, staggered into a wave.", kind: "play", C: M681 },
  { code: "M682", name: "Cursor-proximity scramble", how: "Characters inside the pointer's radius scramble to glyphs and resolve as it moves on (ScrambleText per char); auto pointer.", kind: "play", C: M682 },
  { code: "M683", name: "Dashed-vector letters under cursor", how: "A scan line sweeps a canvas wordmark: letters near it turn into dashed outlines with specks and labels, one lifts and springs back.", kind: "play", C: M683 },
  { code: "M684", name: "Dipole iron filings form text", how: "Thousands of strokes align to a moving dipole's field and the headline lights up where the poles pass (canvas flow field).", kind: "play", C: M684 },
  { code: "M685", name: "Fuzzy vibrating text", how: "Canvas text redrawn row by row with random sideways shifts every frame; the fuzz grows when the (auto) pointer hovers.", kind: "play", C: M685 },
  { code: "M686", name: "Glitch text with clip slices", how: "Short bursts of RGB channel split, clip-path slice jumps and a quick character scramble, then the heading snaps clean.", kind: "play", C: M686 },
  { code: "M687", name: "Gooey marquee", how: "A marquee runs over a fattened duplicate through an SVG goo filter, so a blob ribbon flows behind the clean text.", kind: "play", C: M687 },
  { code: "M688", name: "Letter hover playground", how: "A fake pointer walks a word; each letter has its own hover: jump + ring, swing, redraw, slide, weave, trail.", kind: "play", C: M688 },
  { code: "M689", name: "Letters with flying shapes", how: "Letters rise in one by one while small circles, triangles and bars burst from behind each one and fall away.", kind: "play", C: M689 },
  { code: "M690", name: "Ligature melt", how: "Under the (auto) pointer the glyphs pass through a local SVG goo and fuse with their neighbours, then separate as it moves on.", kind: "play", C: M690 },
  { code: "M691", name: "Liquid chrome text fill", how: "Domain-warped chrome (and gold) noise flows inside the letterforms on a WebGL plane; the pointer pushes the flow.", kind: "play", C: M691 },
];
