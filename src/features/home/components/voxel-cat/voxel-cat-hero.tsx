'use client';

import { ContactShadows } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { CAT_IDLE, createCatAnimationController } from './cat-animation-controller';
import { createCatAnimationRig } from './cat-animation-rig';
import { createVoxelCatModel, type VoxelCatModel } from './create-voxel-cat-model';

/** Near-parallel reference edges: approximately 27° yaw and 18° elevation. */
const TURN = -0.47;
const ELEVATION = 0.31;
const DISTANCE = 30;

/**
 * Fraction of the panel the cat is allowed to fill. The model is authored in blocks and its
 * tail sweeps well out to one side, so it is fitted to the panel rather than given a fixed
 * scale: the hero column is a `minmax(260px, 1fr)` grid track, and at the narrower end of
 * that a fixed scale either cropped the head and the tail or left the cat tiny once the
 * column widened again.
 */
const FILL = 0.81;

function VoxelCatScene({ model, bounds }: { model: VoxelCatModel; bounds: THREE.Box3 }) {
  const animation = useRef<{
    controller: ReturnType<typeof createCatAnimationController>;
    rig: ReturnType<typeof createCatAnimationRig>;
    running: boolean;
    firstFrame: boolean;
  } | null>(null);

  const invalidate = useThree((state) => state.invalidate);
  const canvas = useThree((state) => state.gl.domElement);
  const viewport = useThree((state) => state.viewport);

  // Bounds contain actual vertices in the camera's orientation, excluding the empty
  // corners of a world-axis bounding box. This keeps the face readable at narrow widths.
  const size = useMemo(() => bounds.getSize(new THREE.Vector3()), [bounds]);
  const centre = useMemo(
    () => bounds.getCenter(new THREE.Vector3()).applyAxisAngle(new THREE.Vector3(1, 0, 0), -ELEVATION),
    [bounds],
  );
  const fit = Math.min((viewport.width * FILL) / size.x, (viewport.height * FILL) / size.y);
  // Centring is what the lens is aimed at, so it has to happen on all three axes now: the
  // camera looks at the origin, and under a tilt an un-centred depth slides the cat up or
  // down the panel just as an un-centred height would.
  const offsetX = -centre.x * fit;
  const offsetZ = -centre.z * fit;
  // The model's own origin is the ground the paws stand on, so this is where the floor lands.
  const floorY = -centre.y * fit;

  useEffect(() => {
    const controller = createCatAnimationController();
    const rig = createCatAnimationRig(model);
    const state = { controller, rig, running: false, firstFrame: true };
    animation.current = state;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    let reduced = media.matches;

    const sync = () => {
      if (media.matches !== reduced) {
        reduced = media.matches;
        if (reduced) {
          controller.reset();
          rig.reset();
          invalidate();
        }
      }
      const running = visible && !document.hidden && !reduced;
      if (running !== state.running) {
        state.running = running;
        state.firstFrame = true;
        // A demand loop cannot restart itself after all pending frames have drained.
        if (running) invalidate();
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio > 0;
      sync();
    });
    observer.observe(canvas);
    document.addEventListener('visibilitychange', sync);
    media.addEventListener('change', sync);
    rig.reset();
    invalidate();

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
      media.removeEventListener('change', sync);
      state.running = false;
      rig.reset();
      animation.current = null;
    };
  }, [canvas, invalidate, model]);

  useFrame((_, delta) => {
    const state = animation.current;
    if (!state?.running) return;
    // The first delta can include time off-screen or in a hidden tab. Never catch up.
    const elapsed = state.firstFrame ? 0 : Math.min(delta, CAT_IDLE.maxDelta);
    state.firstFrame = false;
    state.rig.applyPose(state.controller.update(elapsed));
    invalidate();
  });

  return (
    <>
      <group position={[offsetX, floorY, offsetZ]} scale={fit}>
        <primitive object={model.group} />
      </group>
      {/* Capture only the lowest blocks so the shadow anchors the paws and tail.
          Scaling the capture depth with the model keeps it consistent on resize. */}
      <ContactShadows
        frames={1}
        position={[offsetX, floorY - 0.01, offsetZ]}
        scale={Math.max(size.x, size.z) * fit * 2}
        opacity={0.35}
        blur={1.7}
        far={2.5 * fit}
        resolution={512}
      />
    </>
  );
}

export function VoxelCatHero() {
  // Built during render rather than in an effect so the cat is in the scene on the very first
  // frame — ContactShadows only bakes once, and would otherwise bake an empty floor.
  const model = useMemo(() => {
    const built = createVoxelCatModel();
    built.group.rotation.y = TURN;
    return built;
  }, []);

  const bounds = useMemo(() => {
    const projected = new THREE.Box3();
    const vertex = new THREE.Vector3();
    const cameraRotation = new THREE.Matrix4().makeRotationX(ELEVATION);
    model.group.updateMatrixWorld(true);
    for (const part of Object.values(model.parts)) {
      const positions = part.geometry.getAttribute('position');
      const transform = new THREE.Matrix4().multiplyMatrices(cameraRotation, part.matrixWorld);
      for (let index = 0; index < positions.count; index++) {
        vertex.fromBufferAttribute(positions, index).applyMatrix4(transform);
        projected.expandByPoint(vertex);
      }
    }
    return projected;
  }, [model]);

  useEffect(() => () => model.dispose(), [model]);

  return (
    <div className="pointer-events-none relative isolate h-72 w-full min-w-0 md:h-90" aria-hidden="true">
      <div className="bg-accent/10 absolute inset-x-8 top-4 bottom-3 -z-10 rounded-[45%] sm:inset-x-16 md:inset-x-3" />
      <Canvas
        orthographic
        shadows
        dpr={[1, 2]}
        frameloop="demand"
        // R3F points a default camera at the origin for us, and the scene centres the cat
        // there, so lifting the position is all it takes to look down on it.
        camera={{
          zoom: 100,
          position: [0, DISTANCE * Math.sin(ELEVATION), DISTANCE * Math.cos(ELEVATION)],
        }}
        gl={{ alpha: true, antialias: true }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.NeutralToneMapping;
          gl.toneMappingExposure = 1;
        }}
      >
        <hemisphereLight args={['#fffaf2', '#d6cec1', 1.4]} />
        <directionalLight
          color="#fff8ee"
          intensity={1.7}
          position={[-3, 5, 7]}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-4}
          shadow-camera-right={4}
          shadow-camera-top={4}
          shadow-camera-bottom={-4}
          shadow-normalBias={0.025}
          shadow-bias={-0.0001}
          shadow-radius={3}
        />
        {/* Low frontal fill reaches the throat beneath the oversized head. */}
        <directionalLight color="#ffffff" intensity={0.7} position={[5, 2, 2]} />

        <VoxelCatScene model={model} bounds={bounds} />
      </Canvas>
    </div>
  );
}
