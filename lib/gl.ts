"use client";

// Lightweight WebGL for image / video shader effects (OGL, ~10 KB gz, loaded ONLY by the sections that call this).
// One full-canvas triangle + your fragment shader. Built-in uniforms:
//   uTime (s) · uRes (canvas px) · uVel (smoothed scroll speed, -1..1) · uProgress (set by you, e.g. a scrub)
//   uTex0..uTex3 (sampler2D, from images/canvases) + uTexRes0..3 (their px size, for cover-fit)
// GLSL helper available in every shader: `vec2 cover(vec2 uv, vec2 texRes)` (object-fit: cover).
// Rules (docs/LESSONS.md): the plain <img>/CSS version is ALWAYS in the page under the canvas; the canvas fades in only
// after its first frame, so a failed/slow WebGL simply leaves the fallback showing. Draws only while on screen.

export type GLHandle = {
  uniforms: Record<string, { value: unknown }>;
  setTexture: (i: number, src: TexImageSource) => void;
  destroy: () => void;
};

const VERT = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }`;

const HEAD = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime, uVel, uProgress;
uniform vec2 uRes;
uniform sampler2D uTex0, uTex1, uTex2, uTex3;
uniform vec2 uTexRes0, uTexRes1, uTexRes2, uTexRes3;
vec2 cover(vec2 uv, vec2 texRes) {
  vec2 s = uRes / texRes;
  float k = max(s.x, s.y);
  vec2 size = texRes * k;
  return (uv * uRes + (size - uRes) * 0.5) / size;
}
`;

/** Scroll speed from Lenis (or window scroll), smoothed, roughly -1..1. */
function velocitySource() {
  let last = window.scrollY;
  let v = 0;
  return () => {
    const lenis = (window as unknown as { __lenis?: { velocity: number } }).__lenis;
    const raw = lenis ? lenis.velocity : window.scrollY - last;
    last = window.scrollY;
    v += (Math.max(-60, Math.min(60, raw)) / 60 - v) * 0.12;
    return v;
  };
}

export async function createShader(
  canvas: HTMLCanvasElement,
  fragment: string,
  {
    textures = [],
    uniforms = {},
    dpr = 1.5,
    onFrame,
    init,
  }: {
    textures?: TexImageSource[];
    uniforms?: Record<string, { value: unknown }>;
    dpr?: number;
    onFrame?: (u: Record<string, { value: unknown }>, time: number) => void;
    /** advanced: runs once with OGL itself (e.g. an extras.Flowmap); may add uniforms; may return a per-frame step */
    init?: (api: { ogl: typeof import("ogl"); gl: WebGLRenderingContext; uniforms: Record<string, { value: unknown }> }) => ((t: number) => void) | void;
  } = {},
): Promise<GLHandle | null> {
  try {
    const ogl = await import("ogl");
    const { Renderer, Program, Mesh, Triangle, Texture } = ogl;
    const renderer = new Renderer({ canvas, dpr: Math.min(window.devicePixelRatio || 1, dpr), alpha: true, antialias: false, premultipliedAlpha: false });
    const gl = renderer.gl;
    if (!gl) return null;
    const texs = [0, 1, 2, 3].map(() => new Texture(gl, { generateMipmaps: false, minFilter: gl.LINEAR, magFilter: gl.LINEAR, wrapS: gl.CLAMP_TO_EDGE, wrapT: gl.CLAMP_TO_EDGE }));
    const u: Record<string, { value: unknown }> = {
      uTime: { value: 0 },
      uVel: { value: 0 },
      uProgress: { value: 0 },
      uRes: { value: [1, 1] },
      ...Object.fromEntries(texs.map((t, i) => [`uTex${i}`, { value: t }])),
      ...Object.fromEntries(texs.map((_, i) => [`uTexRes${i}`, { value: [1, 1] }])),
      ...uniforms,
    };
    const setTexture = (i: number, src: TexImageSource) => {
      texs[i].image = src as HTMLImageElement;
      const w = (src as HTMLImageElement).naturalWidth || (src as HTMLCanvasElement).width;
      const h = (src as HTMLImageElement).naturalHeight || (src as HTMLCanvasElement).height;
      (u[`uTexRes${i}`] as { value: number[] }).value = [w, h];
    };
    textures.forEach((t, i) => setTexture(i, t));
    const step = init?.({ ogl, gl: gl as unknown as WebGLRenderingContext, uniforms: u }) || undefined;
    const program = new Program(gl, { vertex: VERT, fragment: HEAD + fragment, uniforms: u, transparent: true });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    // size from the PARENT box (OGL writes a fixed px size onto the canvas; keep it at 100% so it always fills)
    const box = canvas.parentElement ?? canvas;
    const resize = () => {
      const r = box.getBoundingClientRect();
      renderer.setSize(Math.max(1, r.width), Math.max(1, r.height));
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      (u.uRes as { value: number[] }).value = [gl.canvas.width, gl.canvas.height];
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(box);

    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: "100px" });
    io.observe(canvas);
    const vel = velocitySource();
    const t0 = performance.now();
    let raf = 0;
    let shown = false;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const v = vel();
      if (!visible) return;
      const t = (performance.now() - t0) / 1000;
      u.uTime.value = t;
      u.uVel.value = v;
      onFrame?.(u, t);
      step?.(t);
      renderer.render({ scene: mesh });
      if (!shown) {
        shown = true;
        canvas.style.opacity = "1"; // the fallback underneath can now be covered
      }
    };
    raf = requestAnimationFrame(loop);

    return {
      uniforms: u,
      setTexture,
      destroy: () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        io.disconnect();
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      },
    };
  } catch (err) {
    console.warn("[gl] WebGL effect off, showing the fallback:", (err as Error).message);
    return null;
  }
}

/** Loads an image for a texture (resolves with the element, or null on error). */
export const loadImage = (src: string) =>
  new Promise<HTMLImageElement | null>((res) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });
