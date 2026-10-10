"use client";

// F3 · 3D travel (+ F2 turn), BUDGET version on OGL (~34 KB gzip, the kit's WebGL library): a .glb loaded with OGL's
// GLTFLoader and drawn with our own small lit shader (base colour + emissive textures, a cool key light, a blue rim,
// a soft fill, specular). The only 3D version inside the +150 KB budget (three.js alone is ~150 KB). Needs a model made
// with `npm run glb -- in.glb out.glb --ogl` (plain geometry + WebP textures: OGL reads WebP, not Meshopt).
// Same travel driver as the others; renders only while the object is near the screen; falls back to the PNG (F1).
import { useEffect, useRef, useState } from "react";
import { DEMO_MODEL_OGL } from "./art";
import ObjectPNG from "./ObjectPNG";
import { ShadowGlow, type LayerProps } from "./TravelPage";
import { idle, useTravel, type TravelState } from "./useTravel";


const FOV = 30;
const CAM_Z = 10;

const VERT = /* glsl */ `
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vView;
void main() {
  vUv = uv;
  vN = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tBase;
uniform sampler2D tEmissive;
uniform vec4 uBase;
uniform vec3 uEmissive;
uniform float uHasBase, uHasEm, uMetal, uRough;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vView;
void main() {
  vec3 n = normalize(vN);
  vec3 v = normalize(vView);
  vec4 base = uBase * (uHasBase > 0.5 ? texture2D(tBase, vUv) : vec4(1.0));
  vec3 key = normalize(vec3(0.45, 0.6, 0.75));
  float diff = max(dot(n, key), 0.0);
  vec3 h = normalize(key + v);
  float spec = pow(max(dot(n, h), 0.0), mix(90.0, 10.0, uRough)) * mix(0.35, 1.1, uMetal);
  float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  float fill = max(dot(n, normalize(vec3(-0.3, -0.6, 0.5))), 0.0);
  // metals take their colour from reflections: less flat diffuse, specular tinted by the base colour
  vec3 diffuse = base.rgb * (0.16 + 0.7 * diff + 0.2 * fill * vec3(0.62, 0.85, 1.0)) * (1.0 - 0.55 * uMetal);
  vec3 specCol = mix(vec3(0.92, 0.96, 1.0), base.rgb * 1.4, uMetal);
  // a fake environment: a cool horizon band reflected along the view, so metal never looks flat
  float env = smoothstep(0.0, 1.0, 0.5 + 0.5 * reflect(-v, n).y);
  vec3 col = diffuse + spec * specCol + uMetal * base.rgb * mix(vec3(0.05, 0.08, 0.14), vec3(0.45, 0.6, 0.8), env) * 0.6;
  col += rim * vec3(0.18, 0.55, 1.0) * 0.9;
  col += uEmissive * (uHasEm > 0.5 ? texture2D(tEmissive, vUv).rgb : vec3(1.0));
  gl_FragColor = vec4(col, base.a);
}`;

type OGL = typeof import("ogl");

export default function Object3DOGL({ page, url = DEMO_MODEL_OGL }: LayerProps & { url?: string }) {
  const [fallback, setFallback] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const ctx = useRef<{ renderer: InstanceType<OGL["Renderer"]>; camera: InstanceType<OGL["Camera"]>; scene: InstanceType<OGL["Transform"]>; obj: InstanceType<OGL["Transform"]> | null } | null>(null);
  const frames = useRef({ n: 0, t0: 0 });

  useEffect(() => {
    let dead = false;
    let onResize = () => {};
    (async () => {
      try {
        const { Renderer, Camera, Transform, Program, GLTFLoader, Mesh } = await import("ogl");
        if (dead || !canvas.current) return;
        const renderer = new Renderer({ canvas: canvas.current, dpr: Math.min(window.devicePixelRatio || 1, 1.5), alpha: true, antialias: true });
        const gl = renderer.gl;
        const camera = new Camera(gl, { fov: FOV, near: 0.1, far: 50 });
        camera.position.z = CAM_Z;
        const scene = new Transform();
        ctx.current = { renderer, camera, scene, obj: null };
        onResize = () => {
          renderer.setSize(window.innerWidth, window.innerHeight);
          canvas.current!.style.width = "100%";
          canvas.current!.style.height = "100%";
          camera.perspective({ aspect: window.innerWidth / window.innerHeight });
        };
        onResize();
        window.addEventListener("resize", onResize);

        const gltf = await GLTFLoader.load(gl, url);
        if (dead) return;
        // replace OGL's default NormalProgram with our lit shader, fed from each mesh's glTF material
        const root = new Transform();
        const s = gltf.scene || gltf.scenes[0];
        s.forEach((node: InstanceType<OGL["Transform"]>) => node.setParent(root));
        const white = new (await import("ogl")).Texture(gl, { image: new Uint8Array([255, 255, 255, 255]), width: 1, height: 1 });
        root.traverse((node) => {
          const mesh = node as InstanceType<OGL["Mesh"]> & { program?: { gltfMaterial?: Record<string, never> } };
          if (!(mesh instanceof Mesh)) return;
          const m = (mesh.program as unknown as { gltfMaterial?: Record<string, unknown> })?.gltfMaterial ?? {};
          const bt = (m.baseColorTexture as { texture?: unknown } | undefined)?.texture;
          const et = (m.emissiveTexture as { texture?: unknown } | undefined)?.texture;
          mesh.program = new Program(gl, {
            vertex: VERT,
            fragment: FRAG,
            cullFace: false,
            uniforms: {
              tBase: { value: bt ?? white },
              tEmissive: { value: et ?? white },
              uBase: { value: (m.baseColorFactor as number[]) ?? [1, 1, 1, 1] },
              uEmissive: { value: (m.emissiveFactor as number[]) ?? [0, 0, 0] },
              uHasBase: { value: bt ? 1 : 0 },
              uHasEm: { value: et ? 1 : 0 },
              uMetal: { value: (m.metallicFactor as number) ?? 0.5 },
              uRough: { value: (m.roughnessFactor as number) ?? 0.5 },
            },
          });
        });
        // centre the model and make it 1 world unit tall (bounds from the meshes' geometry)
        root.updateMatrixWorld();
        let min = [Infinity, Infinity, Infinity];
        let max = [-Infinity, -Infinity, -Infinity];
        root.traverse((node) => {
          const mesh = node as InstanceType<OGL["Mesh"]>;
          if (!(mesh instanceof Mesh)) return;
          mesh.geometry.computeBoundingBox();
          const b = mesh.geometry.bounds;
          const w = mesh.worldMatrix;
          for (const c of [b.min, b.max]) {
            const p = [c[0] * w[0] + c[1] * w[4] + c[2] * w[8] + w[12], c[0] * w[1] + c[1] * w[5] + c[2] * w[9] + w[13], c[0] * w[2] + c[1] * w[6] + c[2] * w[10] + w[14]];
            min = min.map((v, i) => Math.min(v, p[i]));
            max = max.map((v, i) => Math.max(v, p[i]));
          }
        });
        const holder = new Transform();
        root.setParent(holder);
        root.position.set(-(min[0] + max[0]) / 2, -(min[1] + max[1]) / 2, -(min[2] + max[2]) / 2);
        holder.scale.set(1 / (max[1] - min[1] || 1));
        const unit = new Transform();
        holder.setParent(unit);
        unit.setParent(scene);
        ctx.current.obj = unit;
      } catch (e) {
        console.warn("[travel] OGL 3D off, showing the PNG version:", (e as Error).message);
        if (!dead) setFallback(true);
      }
    })();
    return () => {
      dead = true;
      window.removeEventListener("resize", onResize);
      ctx.current?.renderer.gl.getExtension("WEBGL_lose_context")?.loseContext();
      ctx.current = null;
    };
  }, [url]);

  useTravel(page, (s: TravelState, t) => {
    const f = idle(t);
    const g = glow.current;
    if (g) {
      g.style.width = `${s.w}px`;
      g.style.height = `${s.h}px`;
      g.style.transform = `translate(${(s.x - s.w / 2).toFixed(1)}px, ${(s.y - s.h / 2 + f.dy).toFixed(1)}px)`;
    }
    const c = ctx.current;
    if (!c?.obj || document.hidden) return;
    const vh = window.innerHeight;
    const k = (2 * CAM_Z * Math.tan(((FOV / 2) * Math.PI) / 180)) / vh; // px → world units at z = 0
    const top = page.current ? page.current.getBoundingClientRect().top : 0;
    const vy = s.y + top + f.dy;
    if (vy + s.h < -200 || vy - s.h > vh + 200) return; // far off screen: skip rendering
    c.obj.position.set((s.x - window.innerWidth / 2) * k, -(vy - vh / 2) * k, 0);
    c.obj.scale.set(s.h * k * 0.92);
    c.obj.rotation.set((s.tilt * Math.PI) / 180, (s.turn + f.turn) * Math.PI * 2, (-(s.rot + f.rot) * Math.PI) / 180);
    c.renderer.render({ scene: c.scene, camera: c.camera });
    const fr = frames.current;
    if (fr.n === 0) fr.t0 = performance.now();
    if (++fr.n === 61 && 60000 / (performance.now() - fr.t0) < 25) setFallback(true);
  });

  if (fallback) return <ObjectPNG page={page} />;
  return (
    <>
      <ShadowGlow refEl={glow} />
      <canvas ref={canvas} className="pointer-events-none fixed inset-0 z-20 h-full w-full" aria-hidden />
    </>
  );
}
