'use client';

import { Bounds, Gltf, OrbitControls, useProgress } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { NeutralToneMapping } from 'three';

type PostModelCanvasProps = {
  src: string;
};

export function PostModelCanvas({ src }: PostModelCanvasProps) {
  const loading = useProgress((state) => state.active);

  return (
    <div className="relative h-full">
      <Canvas
        frameloop="demand"
        dpr={[1, 2]}
        camera={{ position: [3, 2.5, 5], fov: 40 }}
        gl={{ alpha: true, antialias: true }}
        fallback={
          <div className="p-6 text-center text-sm text-muted-fg">3D preview is unavailable in this browser.</div>
        }
        onCreated={({ gl }) => {
          gl.toneMapping = NeutralToneMapping;
        }}
      >
        <hemisphereLight args={['#fffaf2', '#d6cec1', 1.4]} />
        <directionalLight color="#fff8ee" intensity={1.7} position={[-3, 5, 7]} />
        <directionalLight intensity={0.7} position={[5, 2, 2]} />
        <Suspense fallback={null}>
          <Bounds fit clip observe margin={1.25} maxDuration={0}>
            <Gltf src={src} dispose={null} />
          </Bounds>
        </Suspense>
        <OrbitControls makeDefault enablePan={false} enableZoom={false} enableDamping={false} />
      </Canvas>
      {loading && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-fg"
          role="status"
        >
          Loading model…
        </div>
      )}
    </div>
  );
}
