"use client";

// F3 · 3D travel (+ F2 turn), BUDGET version: plain three.js with named imports (tree-shaken) + GLTFLoader +
// MeshoptDecoder, no React Three Fiber / drei. Same travel driver and look as Object3D.tsx (the R3F version), but
// much smaller, because R3F pulls in the whole three.js namespace. Use this one on sites (3D budget: +150 KB gzip).
// Renders only while the page is on screen; falls back to the PNG version (F1) without WebGL or when too slow.
import { useEffect, useRef, useState } from "react";
import {
  ACESFilmicToneMapping,
  AmbientLight,
  Box3,
  DirectionalLight,
  Group,
  MathUtils,
  PerspectiveCamera,
  PointLight,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { DEMO_MODEL } from "./art";
import ObjectPNG from "./ObjectPNG";
import { ShadowGlow, type LayerProps } from "./TravelPage";
import { idle, useTravel, type TravelState } from "./useTravel";

const FOV = 30;
const CAM_Z = 10;

export default function Object3DLite({ page, url = DEMO_MODEL }: LayerProps & { url?: string }) {
  const [fallback, setFallback] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const three = useRef<{ renderer: WebGLRenderer; scene: Scene; camera: PerspectiveCamera; obj: Group | null } | null>(null);
  const frames = useRef({ n: 0, t0: 0 });

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ canvas: c, antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      setFallback(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.outputColorSpace = SRGBColorSpace;
    const scene = new Scene();
    const camera = new PerspectiveCamera(FOV, 1, 0.1, 50);
    camera.position.z = CAM_Z;
    // lit to match a dark site: cool key, blue rim from behind, soft fill
    scene.add(new AmbientLight(0xffffff, 0.55));
    const key = new DirectionalLight(0xeaf5ff, 2.2);
    key.position.set(3, 4, 5);
    const rim = new DirectionalLight(0x2f8cff, 2.6);
    rim.position.set(-4, 2, -3);
    const fill = new PointLight(0x9fd8ff, 8);
    fill.position.set(0, -3, 4);
    scene.add(key, rim, fill);
    three.current = { renderer, scene, camera, obj: null };

    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load(
      url,
      (gltf) => {
        const s = gltf.scene;
        const box = new Box3().setFromObject(s);
        s.position.sub(box.getCenter(new Vector3()));
        const holder = new Group();
        holder.add(s);
        const unit = new Group();
        unit.add(holder);
        holder.scale.setScalar(1 / (box.getSize(new Vector3()).y || 1)); // 1 world unit tall
        scene.add(unit);
        if (three.current) three.current.obj = unit;
      },
      undefined,
      () => setFallback(true),
    );
    const resize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      renderer.dispose();
      three.current = null;
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
    const th = three.current;
    if (!th?.obj || document.hidden) return; // nothing to draw yet / tab hidden
    const vh = window.innerHeight;
    const k = (2 * CAM_Z * Math.tan(MathUtils.degToRad(FOV / 2))) / vh; // px → world units at z = 0
    const top = page.current ? page.current.getBoundingClientRect().top : 0;
    const vy = s.y + top + f.dy;
    // skip rendering while the object is far off screen
    if (vy + s.h < -200 || vy - s.h > vh + 200) return;
    th.obj.position.set((s.x - window.innerWidth / 2) * k, -(vy - vh / 2) * k, 0);
    th.obj.scale.setScalar(s.h * k * 0.92);
    th.obj.rotation.set(MathUtils.degToRad(s.tilt), (s.turn + f.turn) * Math.PI * 2, MathUtils.degToRad(-(s.rot + f.rot)));
    th.renderer.render(th.scene, th.camera);
    // perf guard: too slow over the first 60 frames → PNG version
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
