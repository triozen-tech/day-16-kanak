"use client";

// F3 · 3D travel (+ F2 pinned 3D turn in the Detail section): a .glb model rendered with React Three Fiber, driven by
// the same travel driver as the PNG version (useTravel = a plain values object tweened by scroll; the scene applies it
// every frame — the "tween a params object, apply it in the render loop" pattern from Codrops' folding-box tutorial).
// No drei ScrollControls (it brings its own scroller, which fights Lenis + record mode). Loaded only on its own page
// (next/dynamic, ssr:false). Fallback: the PNG version (F1) when WebGL is missing or too slow (< ~25 fps at start).
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { DEMO_MODEL } from "./art";
import ObjectPNG from "./ObjectPNG";
import { ShadowGlow, type LayerProps } from "./TravelPage";
import { idle, useTravel, type TravelState } from "./useTravel";


const FOV = 30;
const CAM_Z = 10;

function Model({ url, live }: { url: string; live: React.RefObject<{ s: TravelState; t: number; top: number }> }) {
  const gltf = useGLTF(url, false, true); // no Draco (would fetch a decoder from a CDN), Meshopt decoded locally
  const group = useRef<THREE.Group>(null);
  const { size } = useThree();
  // normalise: centre the model and make it 1 world unit tall
  const scene = useMemo(() => {
    const s = gltf.scene.clone(true);
    const box = new THREE.Box3().setFromObject(s);
    const c = box.getCenter(new THREE.Vector3());
    const h = box.getSize(new THREE.Vector3()).y || 1;
    s.position.sub(c);
    const holder = new THREE.Group();
    holder.add(s);
    holder.scale.setScalar(1 / h);
    return holder;
  }, [gltf]);
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const { s, t, top } = live.current;
    const f = idle(t);
    // page px → world units at z = 0 (perspective camera at CAM_Z)
    const worldH = 2 * CAM_Z * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const k = worldH / size.height;
    const vy = s.y + top + f.dy; // viewport y of the object's centre
    g.position.set((s.x - size.width / 2) * k, -(vy - size.height / 2) * k, 0);
    g.scale.setScalar(s.h * k * 0.92);
    g.rotation.set(THREE.MathUtils.degToRad(s.tilt), (s.turn + f.turn) * Math.PI * 2, THREE.MathUtils.degToRad(-(s.rot + f.rot)));
  });
  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

/** Watches the first ~60 frames; too slow → switch to the PNG version. */
function PerfGuard({ onSlow }: { onSlow: () => void }) {
  const n = useRef(0);
  const t0 = useRef(0);
  useFrame(() => {
    if (n.current === 0) t0.current = performance.now();
    if (++n.current === 61) {
      const fps = 60000 / (performance.now() - t0.current);
      if (fps < 25) onSlow();
    }
  });
  return null;
}

export default function Object3D({ page, url = DEMO_MODEL }: LayerProps & { url?: string }) {
  const [fallback, setFallback] = useState(false);
  const glow = useRef<HTMLDivElement>(null);
  const live = useRef({ s: { x: 0, y: 0, w: 1, h: 1, rot: 0, turn: 0, tilt: 0, section: 0 } as TravelState, t: 0, top: 0 });
  useEffect(() => {
    // no WebGL at all → PNG straight away
    const c = document.createElement("canvas");
    if (!(c.getContext("webgl2") || c.getContext("webgl"))) setFallback(true);
  }, []);
  useTravel(page, (s, t) => {
    live.current.s = s;
    live.current.t = t;
    live.current.top = page.current ? page.current.getBoundingClientRect().top : 0;
    const g = glow.current;
    if (g) {
      g.style.width = `${s.w}px`;
      g.style.height = `${s.h}px`;
      g.style.transform = `translate(${(s.x - s.w / 2).toFixed(1)}px, ${(s.y - s.h / 2 + idle(t).dy).toFixed(1)}px)`;
    }
  });
  if (fallback) return <ObjectPNG page={page} />;
  return (
    <>
      <ShadowGlow refEl={glow} />
      {/* the canvas is fixed to the screen; the model is placed where the travel driver says */}
      <div className="pointer-events-none fixed inset-0 z-20">
        <Canvas
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          camera={{ fov: FOV, position: [0, 0, CAM_Z], near: 0.1, far: 50 }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.outputColorSpace = THREE.SRGBColorSpace;
          }}
        >
          {/* lit to match a dark site: a cool key light, a blue rim from behind, soft fill */}
          <ambientLight intensity={0.55} />
          <directionalLight position={[3, 4, 5]} intensity={2.2} color="#eaf5ff" />
          <directionalLight position={[-4, 2, -3]} intensity={2.6} color="#2f8cff" />
          <pointLight position={[0, -3, 4]} intensity={8} color="#9fd8ff" />
          <Suspense fallback={null}>
            <Model url={url} live={live} />
          </Suspense>
          <PerfGuard onSlow={() => setFallback(true)} />
        </Canvas>
      </div>
    </>
  );
}

useGLTF.preload(DEMO_MODEL, false, true);
