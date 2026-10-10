"use client";

// WebGL image effects (OGL via lib/gl.ts, loaded only when one of these mounts). Every effect renders its plain
// <img> fallback in the HTML; the canvas covers it only after its first frame, so no WebGL = the still image.
// Shader ideas rebuilt from MIT sources (docs/SOURCES.md): three.js RGBShift/Film, glfx.js zoom blur, gl-transitions
// (CrossZoom, pixelize, ripple), robin-dela/hover-effect (displacement), curtains.js (flowmap, scroll bulge).
import { useEffect, useRef } from "react";
import { createShader, type GLHandle } from "@/lib/gl";
import { prefersReducedMotion } from "@/lib/gsap";
import { pos, scene, toCanvas, useScrub } from "./shared";

const NOISE = /* glsl */ `
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; } return v; }
`;

type Props = {
  /** placeholder scene indices for uTex0.. (ignored when `srcs` is given) */
  images?: number[];
  srcs?: string[];
  fragment: string;
  className?: string;
  /** drive uProgress with the scroll (default) */
  scrub?: boolean;
  init?: NonNullable<NonNullable<Parameters<typeof createShader>[2]>["init"]>;
  onFrame?: (u: Record<string, { value: unknown }>, t: number) => void;
  /** the final uProgress for ?static=1 */
  finalValue?: number;
};

/** A WebGL picture: fallback <img> (first image) + shader canvas on top. */
export function GLPicture({ images = [0], srcs, fragment, className = "", scrub = true, init, onFrame, finalValue = 1 }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const handle = useRef<GLHandle | null>(null);
  const progress = useRef(0);
  const list = srcs ?? images.map((i) => scene(i));
  useScrub(root, (p) => (progress.current = p), { finalValue });
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let dead = false;
    (async () => {
      const textures = await Promise.all(list.map((s) => toCanvas(s)));
      if (dead) return;
      handle.current = await createShader(canvas.current!, fragment, {
        textures,
        init,
        onFrame: (u, t) => {
          if (scrub) u.uProgress.value = progress.current;
          onFrame?.(u, t);
        },
      });
      if (dead) handle.current?.destroy();
    })();
    return () => {
      dead = true;
      handle.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fragment]);
  return (
    <div ref={root} className={`overflow-hidden ${pos(className)}`}>
      <div className="fx-drift absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={list[list.length > 1 && finalValue >= 0.5 ? list.length - 1 : 0]} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <canvas ref={canvas} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-300" aria-hidden />
      </div>
    </div>
  );
}

/** M38 · Liquid image reveal: the picture flows in through a noisy, wobbling edge (edge glows), driven by the scroll. */
export const LIQUID_REVEAL = /* glsl */ `${NOISE}
void main() {
  // a slow scrubbed zoom (1.15 → 1) keeps the picture moving after it has fully arrived
  vec2 uv = cover((vUv - 0.5) / (1.15 - uProgress * 0.15) + 0.5, uTexRes0);
  float p = uProgress; // uses the whole scrub: complete exactly at the end (never a finished, frozen stretch)
  float n = fbm(vUv * 3.0 + vec2(0.0, uTime * 0.15));
  float edge = (1.0 - vUv.y) * 0.65 + n * 0.45;
  float m = smoothstep(edge - 0.06, edge + 0.06, p * 1.25 - 0.06);
  vec2 wob = vec2(n - 0.5, 0.0) * 0.06 * (1.0 - m);
  vec4 c = texture2D(uTex0, uv + wob);
  float rim = smoothstep(0.0, 0.5, m) * (1.0 - smoothstep(0.5, 1.0, m));
  // unrevealed parts show the page colour (not the fallback photo underneath)
  gl_FragColor = vec4(mix(vec3(0.02, 0.031, 0.059), c.rgb + rim * vec3(0.55, 0.8, 1.0), m), 1.0);
}`;

/** M52 · Animated gradient mesh: soft colour blobs drift and blend forever (works as a section background). */
export const GRADIENT_MESH = /* glsl */ `${NOISE}
uniform vec3 uA, uB, uC, uD;
void main() {
  vec2 p = vUv * vec2(uRes.x / uRes.y, 1.0);
  float t = uTime * 0.12;
  vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
  float f = fbm(p + 1.6 * q + t * 0.6);
  vec3 col = mix(uA, uB, smoothstep(0.2, 0.8, f));
  col = mix(col, uC, smoothstep(0.35, 0.9, q.x));
  col = mix(col, uD, smoothstep(0.55, 1.0, q.y) * 0.7);
  col += (hash(vUv * uRes + uTime) - 0.5) * 0.03; // fine grain, no banding
  gl_FragColor = vec4(col, 1.0);
}`;

/** M55 · RGB shift on scroll speed (three.js RGBShiftShader idea): channels split along the scroll direction. */
export const RGB_SHIFT = /* glsl */ `
void main() {
  vec2 uv = cover(vUv, uTexRes0);
  float amt = abs(uVel) * 0.035 + 0.0025 * (0.5 + 0.5 * sin(uTime * 1.3));
  vec2 off = vec2(0.0, amt * sign(uVel + 0.0001));
  float r = texture2D(uTex0, uv + off).r;
  vec4 g = texture2D(uTex0, uv);
  float b = texture2D(uTex0, uv - off).b;
  // slight stretch with speed (curtains.js scroll effect idea)
  gl_FragColor = vec4(r, g.g, b, 1.0);
}`;

/** M56 · Zoom-blur transition (glfx.js zoomblur + gl-transitions CrossZoom idea): image A rushes into image B. */
export const ZOOM_BLUR = /* glsl */ `
float rnd(vec2 co) { return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  float p = uProgress;
  float strength = sin(p * 3.14159) * 0.4;
  vec2 c = vec2(0.5);
  vec2 dir = c - vUv;
  float off = rnd(vUv * uRes);
  vec3 acc = vec3(0.0);
  float tot = 0.0;
  float mixk = smoothstep(0.35, 0.65, p);
  for (int i = 0; i <= 24; i++) {
    float k = (float(i) + off) / 24.0;
    float w = 4.0 * (k - k * k);
    vec2 uv = vUv + dir * k * strength;
    vec3 a = texture2D(uTex0, cover(uv, uTexRes0)).rgb;
    vec3 b = texture2D(uTex1, cover(uv, uTexRes1)).rgb;
    acc += mix(a, b, mixk) * w;
    tot += w;
  }
  gl_FragColor = vec4(acc / tot, 1.0);
}`;

/** X8 · Pixel dissolve transition (gl-transitions pixelize idea): A breaks into growing squares, B resolves from them. */
export const PIXEL_DISSOLVE = /* glsl */ `
void main() {
  float p = uProgress;
  float d = min(p, 1.0 - p);
  float dist = ceil(d * 20.0) / 20.0;
  vec2 sq = 2.0 * dist / vec2(20.0 * uRes.x / uRes.y, 20.0);
  vec2 uv = dist > 0.0 ? (floor(vUv / sq) + 0.5) * sq : vUv;
  vec3 a = texture2D(uTex0, cover(uv, uTexRes0)).rgb;
  vec3 b = texture2D(uTex1, cover(uv, uTexRes1)).rgb;
  gl_FragColor = vec4(mix(a, b, step(0.5, p)), 1.0);
}`;

/** X11 · Shader liquid wipe: B pours over A along a diagonal whose edge ripples like liquid. */
export const LIQUID_WIPE = /* glsl */ `${NOISE}
void main() {
  float p = uProgress;
  float n = fbm(vUv * 4.0 + uTime * 0.25);
  float edge = (vUv.x * 0.6 + (1.0 - vUv.y) * 0.4) + (n - 0.5) * 0.35;
  float m = smoothstep(edge - 0.04, edge + 0.04, p * 1.5 - 0.25);
  vec2 push = vec2(0.0, (n - 0.5) * 0.05 * (1.0 - abs(m - 0.5) * 2.0));
  // A slowly zooms in, B settles from 1.15 → 1: both keep moving across the whole scrub
  vec3 a = texture2D(uTex0, cover((vUv + push - 0.5) / (1.0 + p * 0.15) + 0.5, uTexRes0)).rgb;
  vec3 b = texture2D(uTex1, cover((vUv - push - 0.5) / (1.15 - p * 0.15) + 0.5, uTexRes1)).rgb;
  float rim = (1.0 - abs(m - 0.5) * 2.0);
  gl_FragColor = vec4(mix(a, b, m) + rim * 0.25 * vec3(0.7, 0.9, 1.0), 1.0);
}`;

/** M66 · Displacement-map swap (robin-dela/hover-effect idea): images melt into each other through a noise map;
 *  hands-free it cycles A → B → C by itself (uProgress driven by time, not scroll). */
export const DISPLACE_SWAP = /* glsl */ `${NOISE}
void main() {
  float cyc = mod(uTime / 2.4, 3.0);
  float k = smoothstep(0.55, 1.0, fract(cyc));
  int idx = int(floor(cyc));
  float d = fbm(vUv * 3.5) * 0.9;
  vec2 uv1 = vUv + vec2(k * d * 0.45, 0.0);
  vec2 uv2 = vUv - vec2((1.0 - k) * d * 0.45, 0.0);
  vec3 A, B;
  if (idx == 0) { A = texture2D(uTex0, cover(uv1, uTexRes0)).rgb; B = texture2D(uTex1, cover(uv2, uTexRes1)).rgb; }
  else if (idx == 1) { A = texture2D(uTex1, cover(uv1, uTexRes1)).rgb; B = texture2D(uTex2, cover(uv2, uTexRes2)).rgb; }
  else { A = texture2D(uTex2, cover(uv1, uTexRes2)).rgb; B = texture2D(uTex0, cover(uv2, uTexRes0)).rgb; }
  gl_FragColor = vec4(mix(A, B, k), 1.0);
}`;

/** M67 · Flowmap liquid trail (curtains.js / OGL Flowmap idea): a pointer (or a scripted path in record mode) drags the
 *  picture like liquid; the trail slowly settles. */
export const FLOWMAP = /* glsl */ `
uniform sampler2D tFlow;
void main() {
  vec3 flow = texture2D(tFlow, vUv).rgb;
  vec2 uv = cover(vUv - flow.xy * (0.06 + 0.03 * flow.z), uTexRes0);
  vec3 c = texture2D(uTex0, uv).rgb;
  gl_FragColor = vec4(c + flow.z * 0.08, 1.0);
}`;

/** M68 · Scroll bulge (curtains.js post-processing scroll effect idea): the picture bulges/pinches with scroll speed. */
export const SCROLL_BULGE = /* glsl */ `
void main() {
  vec2 c = vec2(0.5);
  float v = uVel * 1.6 + 0.04 * sin(uTime * 0.9);
  vec2 uv = vUv + (c - vUv) * sin(distance(c, vUv) * 3.14159) * v * 0.35;
  uv.y += v * 0.04 * (vUv.y - 0.5);
  gl_FragColor = vec4(texture2D(uTex0, cover(uv, uTexRes0)).rgb, 1.0);
}`;

/** M69 · Ripple (gl-transitions ripple idea): water rings spread from the centre on a loop. */
export const RIPPLE = /* glsl */ `
void main() {
  float p = fract(uTime / 2.6);
  vec2 dir = vUv - vec2(0.5, 0.55);
  float len = length(dir * vec2(uRes.x / uRes.y, 1.0));
  float wave = sin(len * 60.0 - p * 30.0) * smoothstep(p * 1.4, p * 1.4 - 0.25, len) * (1.0 - p);
  vec2 uv = vUv + normalize(dir + 0.0001) * wave * 0.012;
  vec3 c = texture2D(uTex0, cover(uv, uTexRes0)).rgb;
  gl_FragColor = vec4(c + wave * 0.06, 1.0);
}`;

/** M70 · Film grain + vignette (three.js FilmShader idea): moving grain and soft light breathing over a picture. */
export const FILM_GRAIN = /* glsl */ `
float rnd(vec2 co) { return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec3 c = texture2D(uTex0, cover(vUv, uTexRes0)).rgb;
  float n = rnd(fract(vUv * uRes / 2.0 + fract(uTime * 7.0)));
  c += c * clamp(0.1 + n, 0.0, 1.0) * 0.35 - 0.08;
  float v = smoothstep(0.95, 0.25, length(vUv - 0.5));
  c *= mix(0.55, 1.0, v) * (0.96 + 0.04 * sin(uTime * 1.7));
  gl_FragColor = vec4(c, 1.0);
}`;

/** Ready-made components for the shaders above (pass `images` / `srcs` to use real photos). */
export const LiquidReveal = (p: Omit<Props, "fragment">) => <GLPicture {...p} fragment={LIQUID_REVEAL} />;
export const RGBShift = (p: Omit<Props, "fragment">) => <GLPicture {...p} fragment={RGB_SHIFT} scrub={false} />;
export const ZoomBlur = (p: Omit<Props, "fragment">) => <GLPicture images={[0, 1]} {...p} fragment={ZOOM_BLUR} />;
export const PixelDissolve = (p: Omit<Props, "fragment">) => <GLPicture images={[2, 3]} {...p} fragment={PIXEL_DISSOLVE} />;
export const LiquidWipe = (p: Omit<Props, "fragment">) => <GLPicture images={[1, 2]} {...p} fragment={LIQUID_WIPE} />;
export const DisplaceSwap = (p: Omit<Props, "fragment">) => <GLPicture images={[0, 1, 3]} {...p} fragment={DISPLACE_SWAP} scrub={false} finalValue={0} />;
export const ScrollBulge = (p: Omit<Props, "fragment">) => <GLPicture {...p} fragment={SCROLL_BULGE} scrub={false} />;
export const Ripple = (p: Omit<Props, "fragment">) => <GLPicture {...p} fragment={RIPPLE} scrub={false} />;
export const FilmGrain = (p: Omit<Props, "fragment">) => <GLPicture {...p} fragment={FILM_GRAIN} scrub={false} />;

export function GradientMesh({ className = "", colors = ["#05080f", "#2f8cff", "#5cc8ff", "#ff4d6d"] }: { className?: string; colors?: string[] }) {
  const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  return (
    <div className={`overflow-hidden ${pos(className)}`}>
      {/* fallback: CSS gradients drifting (fx-mesh in site/fx.css) */}
      <div className="fx-mesh absolute inset-0" style={{ ["--m1" as string]: colors[1], ["--m2" as string]: colors[2], ["--m3" as string]: colors[3], background: colors[0] }} />
      <GLMesh colors={colors.map(rgb)} />
    </div>
  );
}
function GLMesh({ colors }: { colors: number[][] }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let h: GLHandle | null = null;
    let dead = false;
    createShader(canvas.current!, GRADIENT_MESH, {
      dpr: 1,
      uniforms: { uA: { value: colors[0] }, uB: { value: colors[1] }, uC: { value: colors[2] }, uD: { value: colors[3] } },
    }).then((x) => (dead ? x?.destroy() : (h = x)));
    return () => {
      dead = true;
      h?.destroy();
    };
  }, [colors]);
  return <canvas ref={canvas} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500" aria-hidden />;
}

/** M67 · Flowmap: OGL's Flowmap feeds the shader; pointer moves drag it, and a scripted figure-eight always runs too. */
export function Flowmap(p: Omit<Props, "fragment" | "init">) {
  const pointer = useRef<{ x: number; y: number; at: number } | null>(null);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current!;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pointer.current = { x: (e.clientX - r.left) / r.width, y: 1 - (e.clientY - r.top) / r.height, at: performance.now() };
    };
    el.addEventListener("pointermove", move);
    return () => el.removeEventListener("pointermove", move);
  }, []);
  return (
    <div ref={root} className={pos(p.className)}>
      <GLPicture
        {...p}
        className="absolute inset-0"
        scrub={false}
        fragment={FLOWMAP}
        init={({ ogl, gl, uniforms }) => {
          const flow = new ogl.Flowmap(gl as never, { falloff: 0.25, dissipation: 0.95, alpha: 0.6 });
          uniforms.tFlow = flow.uniform;
          let lx = 0.5;
          let ly = 0.5;
          return (t: number) => {
            const live = pointer.current && performance.now() - pointer.current.at < 1000;
            const x = live ? pointer.current!.x : 0.5 + Math.sin(t * 1.1) * 0.32;
            const y = live ? pointer.current!.y : 0.5 + Math.sin(t * 2.2) * 0.22;
            flow.mouse.set(x, y);
            flow.velocity.set((x - lx) * 30, (y - ly) * 30);
            lx = x;
            ly = y;
            flow.aspect = 1;
            flow.update();
          };
        }}
      />
    </div>
  );
}
