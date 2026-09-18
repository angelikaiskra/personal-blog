'use client';

import { ContactShadows } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTheme } from 'next-themes';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { createCatDriver } from './cat-driver';
import { createVoxelCatModel, type VoxelCatModel } from './create-voxel-cat-model';

/** Near-parallel reference edges: approximately 27° yaw and 18° elevation. */
const TURN = -0.47;
const ELEVATION = 0.31;
const DISTANCE = 30;

/** Fraction of the panel the cat is allowed to fill. */
const FILL = 0.81;

function VoxelCatScene({ model, bounds }: { model: VoxelCatModel; bounds: THREE.Box3 }) {
  const animation = useRef<{
    cat: ReturnType<typeof createCatDriver>;
    pointer: { clientX: number; clientY: number; active: boolean };
    /** Last measured canvas box; null means "measure again on the next frame that needs it". */
    rect: DOMRect | null;
    running: boolean;
  } | null>(null);

  const invalidate = useThree((state) => state.invalidate);
  const canvas = useThree((state) => state.gl.domElement);
  const viewport = useThree((state) => state.viewport);
  const { resolvedTheme } = useTheme();

  // Bounds contain actual vertices in the camera's orientation, not a world-axis box's
  // empty corners, so the face stays readable at narrow widths.
  const size = useMemo(() => bounds.getSize(new THREE.Vector3()), [bounds]);
  const centre = useMemo(
    () => bounds.getCenter(new THREE.Vector3()).applyAxisAngle(new THREE.Vector3(1, 0, 0), -ELEVATION),
    [bounds],
  );
  const fit = Math.min((viewport.width * FILL) / size.x, (viewport.height * FILL) / size.y);
  // Centred on all three axes: the camera looks at the origin, so under a tilt an
  // un-centred depth slides the cat up or down the panel just like an un-centred height would.
  const offsetX = -centre.x * fit;
  const offsetZ = -centre.z * fit;
  const floorY = -centre.y * fit;

  useLayoutEffect(() => {
    // Applies later theme changes; the initial coat is already set at build time from the
    // class next-themes' blocking script stamps.
    const dark = resolvedTheme ? resolvedTheme === 'dark' : document.documentElement.classList.contains('dark');
    model.setTheme(dark ? 'dark' : 'light');
    invalidate();
  }, [invalidate, model, resolvedTheme]);

  useEffect(() => {
    const cat = createCatDriver(model);
    const state = {
      cat,
      pointer: { clientX: 0, clientY: 0, active: false },
      rect: null as DOMRect | null,
      running: false,
    };
    animation.current = state;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    let reduced = media.matches;
    let lost = false;

    const sync = () => {
      if (media.matches !== reduced) {
        reduced = media.matches;
        if (reduced) {
          cat.reset();
          invalidate();
        }
      }
      const running = visible && !document.hidden && !reduced && !lost;
      if (running !== state.running) {
        state.running = running;
        cat.resume();
        // A demand loop cannot restart itself after all pending frames have drained.
        if (running) invalidate();
      }
    };
    // Measuring the canvas inside the frame loop forces a layout flush on every frame, so the
    // box is cached and dropped whenever something can have moved it.
    const remeasure = () => {
      state.rect = null;
    };
    // The hero is `pointer-events-none`, so the canvas sees no pointer events of its own —
    // the window is the only source.
    const track = (event: PointerEvent) => {
      state.pointer.clientX = event.clientX;
      state.pointer.clientY = event.clientY;
      state.pointer.active = true;
    };
    const forget = () => {
      state.pointer.active = false;
      cat.clearPointer();
    };
    const release = (event: PointerEvent) => {
      // A finger that has lifted is nowhere; a mouse that has clicked is still on screen.
      if (event.pointerType !== 'mouse') forget();
    };
    // Three preventDefaults the loss and rebuilds GL state on restore, but a demand loop has
    // no pending frame left to draw with — without this the hero stays blank for good.
    const onLost = () => {
      lost = true;
      sync();
    };
    const onRestored = () => {
      lost = false;
      remeasure();
      sync();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio > 0;
      remeasure();
      sync();
    });
    observer.observe(canvas);
    // Catches container-driven resizes that never reach the window.
    const resizes = new ResizeObserver(remeasure);
    resizes.observe(canvas);
    document.addEventListener('visibilitychange', sync);
    media.addEventListener('change', sync);
    window.addEventListener('pointermove', track, { passive: true });
    window.addEventListener('pointerdown', track, { passive: true });
    window.addEventListener('pointerup', release, { passive: true });
    window.addEventListener('pointercancel', forget, { passive: true });
    document.addEventListener('pointerleave', forget);
    window.addEventListener('blur', forget);
    window.addEventListener('resize', remeasure, { passive: true });
    // Capturing, so a scroll inside any ancestor counts, not just the document's own.
    window.addEventListener('scroll', remeasure, { passive: true, capture: true });
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);
    cat.reset();
    invalidate();

    return () => {
      observer.disconnect();
      resizes.disconnect();
      document.removeEventListener('visibilitychange', sync);
      media.removeEventListener('change', sync);
      window.removeEventListener('pointermove', track);
      window.removeEventListener('pointerdown', track);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', forget);
      document.removeEventListener('pointerleave', forget);
      window.removeEventListener('blur', forget);
      window.removeEventListener('resize', remeasure);
      window.removeEventListener('scroll', remeasure, { capture: true });
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      state.running = false;
      cat.reset();
      animation.current = null;
    };
  }, [canvas, invalidate, model]);

  useFrame(({ camera }, delta) => {
    const state = animation.current;
    if (!state?.running) return;
    // Coalesces pointer events into one projection per frame.
    const { pointer, cat } = state;
    if (pointer.active) {
      const rect = (state.rect ??= canvas.getBoundingClientRect());
      if (rect.width && rect.height) {
        cat.setPointer(
          ((pointer.clientX - rect.left) / rect.width) * 2 - 1,
          -((pointer.clientY - rect.top) / rect.height) * 2 + 1,
          rect.width,
          rect.height,
        );
      } else {
        // A zero-size box is stale the moment the layout settles; never keep it.
        state.rect = null;
        cat.clearPointer();
      }
    }
    cat.update(delta, camera);
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

export function VoxelCatCanvas() {
  // Built during render rather than in an effect so the cat is in the scene on the very first
  // frame — ContactShadows only bakes once, and would otherwise bake an empty floor.
  const model = useMemo(() => {
    // This component is loaded with ssr: false, so the theme class is available before
    // construction even when next-themes has not populated resolvedTheme yet.
    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    const built = createVoxelCatModel({ theme });
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
    <Canvas
      orthographic
      shadows="percentage"
      dpr={[1, 2]}
      frameloop="demand"
      camera={{
        zoom: 100,
        position: [0, DISTANCE * Math.sin(ELEVATION), DISTANCE * Math.cos(ELEVATION)],
      }}
      gl={{ alpha: true, antialias: true }}
      onCreated={({ gl }) => {
        // sRGB output and an exposure of 1 are already the renderer's defaults.
        gl.toneMapping = THREE.NeutralToneMapping;
      }}
    >
      {/* Studio rig solved from the reference: the orange coat reads 1.00 on up-faces,
          0.87 on front faces and 0.75 on lateral faces. */}
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
  );
}
