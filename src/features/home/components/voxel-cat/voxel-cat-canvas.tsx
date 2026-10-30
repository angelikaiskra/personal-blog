'use client';

import { ContactShadows } from '@react-three/drei';
import { addAfterEffect, Canvas, useFrame, useStore, useThree, type Size } from '@react-three/fiber';
import { useTheme } from 'next-themes';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { createCatDriver } from './cat-driver';
import { CAT_TOUCH, createCatPointerInput, type CatLook, type CatTouchTarget } from './cat-pointer-input';
import { createVoxelCatModel, type VoxelCatModel } from './create-voxel-cat-model';

const TURN = -0.47;
const ELEVATION = 0.31;
const DISTANCE = 30;

/** Fraction of the panel the cat is allowed to fill. */
const FILL = 0.81;

/**
 * Clip space runs -1 to 1 across the canvas. `box` is r3f's own measurement, kept current by a
 * resize observer and scroll tracking, so the scene never reads layout inside the frame loop.
 */
const toClip = (look: CatLook, box: Size) => ({
  x: ((look.clientX - box.left) / box.width) * 2 - 1,
  y: -((look.clientY - box.top) / box.height) * 2 + 1,
});

type CatCanvasProps = {
  onTouchTargetChange: (target: CatTouchTarget | null) => void;
  onReadyChange: (ready: boolean) => void;
};

function VoxelCatScene({
  model,
  bounds,
  onTouchTargetChange,
  onReadyChange,
}: { model: VoxelCatModel; bounds: THREE.Box3 } & CatCanvasProps) {
  const animation = useRef<{
    cat: ReturnType<typeof createCatDriver>;
    input: ReturnType<typeof createCatPointerInput>;
    running: boolean;
    rendered: boolean;
    ready: boolean;
  } | null>(null);

  const store = useStore();
  const invalidate = useThree((state) => state.invalidate);
  const setFrameloop = useThree((state) => state.setFrameloop);
  const canvas = useThree((state) => state.gl.domElement);
  const camera = useThree((state) => state.camera);
  const viewport = useThree((state) => state.viewport);
  const { resolvedTheme } = useTheme();

  const size = useMemo(() => bounds.getSize(new THREE.Vector3()), [bounds]);
  const centre = useMemo(
    () => bounds.getCenter(new THREE.Vector3()).applyAxisAngle(new THREE.Vector3(1, 0, 0), -ELEVATION),
    [bounds],
  );
  const fit = Math.min((viewport.width * FILL) / size.x, (viewport.height * FILL) / size.y);
  const offsetX = -centre.x * fit;
  const offsetZ = -centre.z * fit;
  const floorY = -centre.y * fit;

  useLayoutEffect(() => {
    // Only later changes: the initial coat is built from the class next-themes stamps.
    const dark = resolvedTheme ? resolvedTheme === 'dark' : document.documentElement.classList.contains('dark');
    model.setTheme(dark ? 'dark' : 'light');
    invalidate();
  }, [invalidate, model, resolvedTheme]);

  useEffect(() => {
    const input = createCatPointerInput({
      acceptTap: (tap) => {
        const state = animation.current;
        if (!state?.running || !state.ready) return false;
        const box = store.getState().size;
        if (!box.width || !box.height) return false;
        const look = { clientX: tap.pageX - window.scrollX, clientY: tap.pageY - window.scrollY };
        const clip = toClip(look, box);
        return state.cat.isPointerNear(clip.x, clip.y, box.width, box.height, camera, CAT_TOUCH.radius);
      },
      onTargetChange: onTouchTargetChange,
    });
    const state = { cat: createCatDriver(model), input, running: false, rendered: false, ready: false };
    animation.current = state;

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    let reduced = media.matches;
    let lost = false;

    /** The loop runs only while the cat can be seen moving; otherwise it draws once and stops. */
    const sync = () => {
      if (media.matches !== reduced) {
        reduced = media.matches;
        if (reduced) {
          state.cat.reset();
          invalidate();
        }
      }
      // Scrolling offscreen only pauses, so a tap keeps its original expiry; the other three
      // drop whatever the cat was watching.
      if (document.hidden || reduced || lost) input.clear();
      const running = visible && !document.hidden && !reduced && !lost;
      if (running === state.running) return;
      state.running = running;
      // The clock restarts rather than catching up on the time spent paused.
      state.cat.resume();
      setFrameloop(running ? 'always' : 'demand');
    };

    // Three preventDefaults the loss and rebuilds GL state on restore, but a paused loop has
    // no pending frame left to draw with — without this the hero stays blank for good.
    const onLost = () => {
      lost = true;
      state.ready = state.rendered = false;
      onReadyChange(false);
      sync();
    };
    const onRestored = () => {
      lost = false;
      sync();
      invalidate();
    };
    // Runs once this canvas and its ContactShadows have drawn, which is what the poster waits
    // for; reduced motion still needs that first draw.
    const stopWatchingFrames = addAfterEffect(() => {
      if (!state.rendered || state.ready || lost) return;
      state.ready = true;
      onReadyChange(true);
    });
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio > 0;
      sync();
    });
    observer.observe(canvas);
    document.addEventListener('visibilitychange', sync);
    media.addEventListener('change', sync);
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);
    state.cat.reset();
    invalidate();

    return () => {
      stopWatchingFrames();
      input.dispose();
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
      media.removeEventListener('change', sync);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      state.running = false;
      setFrameloop('demand');
      state.cat.reset();
      animation.current = null;
    };
  }, [camera, canvas, invalidate, model, onReadyChange, onTouchTargetChange, setFrameloop, store]);

  useFrame(({ size: box, camera }, delta) => {
    const state = animation.current;
    if (!state) return;
    state.rendered = true;
    if (!state.ready || !state.running) return;
    const look = state.input.read();
    if (look && box.width && box.height) {
      const clip = toClip(look, box);
      state.cat.setPointer(clip.x, clip.y, box.width, box.height);
    } else {
      state.cat.clearPointer();
    }
    state.cat.update(delta, camera);
  });

  return (
    <>
      <group position={[offsetX, floorY, offsetZ]} scale={fit}>
        <primitive object={model.group} />
      </group>
      {/* `far` captures the lowest blocks only, so the shadow anchors the paws and tail; it
          scales with the model to stay consistent on resize. */}
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

export function VoxelCatCanvas({ onTouchTargetChange, onReadyChange }: CatCanvasProps) {
  const model = useMemo(() => {
    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    const built = createVoxelCatModel({ theme });
    built.group.rotation.y = TURN;
    return built;
  }, []);

  const bounds = useMemo(() => {
    // `precise` walks every vertex, so the box holds the cat's real outline in the camera's
    // orientation rather than a world-axis box's empty corners.
    const tilted = new THREE.Group();
    tilted.rotation.x = ELEVATION;
    tilted.add(model.group);
    const projected = new THREE.Box3().setFromObject(tilted, true);
    tilted.remove(model.group);
    model.group.updateMatrixWorld(true);
    return projected;
  }, [model]);

  useEffect(() => () => model.dispose(), [model]);

  return (
    <Canvas
      orthographic
      shadows="percentage"
      dpr={[1, 2]}
      // Starts paused: one frame draws the neutral pose, and the scene switches the loop on
      // once the cat is on screen and allowed to move.
      frameloop="demand"
      // Undebounced: a stale box would have the cat looking beside the pointer mid-scroll.
      resize={{ scroll: true, debounce: { scroll: 0, resize: 0 } }}
      camera={{
        zoom: 100,
        position: [0, DISTANCE * Math.sin(ELEVATION), DISTANCE * Math.cos(ELEVATION)],
      }}
      gl={{ alpha: true, antialias: true, failIfMajorPerformanceCaveat: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
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

      <VoxelCatScene
        model={model}
        bounds={bounds}
        onTouchTargetChange={onTouchTargetChange}
        onReadyChange={onReadyChange}
      />
    </Canvas>
  );
}
