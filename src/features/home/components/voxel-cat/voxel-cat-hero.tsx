'use client';

import { ContactShadows } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
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

/**
 * How far a white pupil sits from the centre of its eye block, in blocks. The eye plate is
 * 1.3 x 1.29 and the pupil 0.65 square, so these are exactly the distances that press it
 * against the rim: the cursor picks a direction, never a distance, and the pupil is always
 * hard against one edge. Unlike the GLTF cat there is no muzzle directly under the eyes, so
 * it can travel as far down as it does up.
 */
const PUPIL_TRAVEL_X = 0.325;
const PUPIL_TRAVEL_Y = 0.32;

/** How far the head swings, in radians. Small enough that the neck join never opens up. */
const HEAD_TURN = 0.14;
const HEAD_TILT = 0.06;

/**
 * Fraction of the distance still left after one second of easing. The head is the slower of
 * the two on purpose: the glance arrives first and the head follows it.
 */
const PUPIL_EASING = 0.001;
const HEAD_EASING = 0.06;

/** Where the pupils sit when nothing is tracking: the corner the model parks them in. */
const RESTING_LOOK = [1, -1] as const;

/**
 * A pupil named by its part id, together with the centre of the eye block it rides on, in
 * the head's space. The mesh itself is looked up off the rig each frame rather than held
 * here, so the only thing this table stores is numbers.
 */
type PupilAnchor = { id: string; homeX: number; homeY: number };

function VoxelCatScene({ model, bounds }: { model: VoxelCatModel; bounds: THREE.Box3 }) {
  const pupils = useRef<PupilAnchor[]>([]);

  // Animating a three.js graph means mutating it on every frame, which the React Compiler
  // rightly refuses to allow through a prop. The ref states what is actually true of this
  // object: it is imperative scene state that no render ever reads, so writing to it
  // invalidates nothing. The prop is still read directly wherever it is only read.
  const rig = useRef(model);

  // How far the cursor is from the cat, which is what the head leans towards. Zero means
  // "nothing to look at", so the head faces front.
  const gaze = useRef(new THREE.Vector2());
  // The last direction worth looking in. Never zero, because the pupils ride the rim and so
  // always need somewhere to point.
  const look = useRef(new THREE.Vector2(...RESTING_LOOK));

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

  useLayoutEffect(() => {
    const { parts, joints } = rig.current;

    // A pupil's travel is measured from its eye block, not from where it was parked, so both
    // eyes take the same offset even though the model parks them off-centre.
    const anchor = (eyeId: string, pupilId: string): PupilAnchor => {
      const eye = parts[eyeId];
      return { id: pupilId, homeX: eye.position.x, homeY: eye.position.y };
    };

    pupils.current = [anchor('eye-l', 'eye-cell-upper-lateral'), anchor('eye-r', 'eye-cell-upper-medial')];
    // Yaw before pitch, so a turned head tilts around its own axis rather than the world's.
    joints.head.rotation.order = 'YXZ';
  }, []);

  const relax = useCallback(() => {
    gaze.current.set(0, 0);
    look.current.set(...RESTING_LOOK);
    invalidate();
  }, [invalidate]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const handlePointerMove = (event: PointerEvent) => {
      const { left, top, width, height } = canvas.getBoundingClientRect();

      const x = THREE.MathUtils.clamp((event.clientX - (left + width / 2)) / (window.innerWidth / 2), -1, 1);
      const y = THREE.MathUtils.clamp((event.clientY - (top + height / 2)) / (window.innerHeight / 2), -1, 1);

      gaze.current.set(x, y);
      // A cursor resting exactly on the cat gives no direction to look in, so hold the last one.
      if (Math.abs(x) > 0.001 || Math.abs(y) > 0.001) look.current.set(x, y);

      invalidate();
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('mouseleave', relax);
    window.addEventListener('blur', relax);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('mouseleave', relax);
      window.removeEventListener('blur', relax);
    };
  }, [canvas, invalidate, relax]);

  useFrame((_, delta) => {
    const [first] = pupils.current;
    if (!first) return;

    const { parts, joints } = rig.current;
    const { head } = joints;

    // Normalising by the larger component walks the pupil around the rim of the block;
    // scaling by both would let it drift into the middle on the diagonals.
    const reach = Math.max(Math.abs(look.current.x), Math.abs(look.current.y));

    const pupilX = (look.current.x / reach) * PUPIL_TRAVEL_X;
    const pupilY = (-look.current.y / reach) * PUPIL_TRAVEL_Y;
    const headYaw = gaze.current.x * HEAD_TURN;
    const headTilt = gaze.current.y * HEAD_TILT;

    const pupilStep = 1 - Math.pow(PUPIL_EASING, delta);
    const headStep = 1 - Math.pow(HEAD_EASING, delta);

    for (const { id, homeX, homeY } of pupils.current) {
      const { position } = parts[id];
      position.x = THREE.MathUtils.lerp(position.x, homeX + pupilX, pupilStep);
      position.y = THREE.MathUtils.lerp(position.y, homeY + pupilY, pupilStep);
    }

    head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, headYaw, headStep);
    head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, headTilt, headStep);

    // The canvas only draws on demand, so keep asking for frames until everything settles.
    const lead = parts[first.id].position;
    const settled =
      Math.abs(lead.x - (first.homeX + pupilX)) < 1e-4 &&
      Math.abs(lead.y - (first.homeY + pupilY)) < 1e-4 &&
      Math.abs(head.rotation.y - headYaw) < 1e-4 &&
      Math.abs(head.rotation.x - headTilt) < 1e-4;

    if (!settled) invalidate();
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
