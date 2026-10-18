import * as THREE from 'three';
import type { VoxelCatModel } from './create-voxel-cat-model';

export const CAT_INTERACTION = {
  planeZ: 7.6,
  /** Face centre, in world blocks: what "the cursor is near the cat" is measured from. */
  headAnchor: [0, 10.4, 3.48],
  /** Enter/exit radii in CSS pixels around the cat's face on screen. */
  watch: { enter: 400, exit: 600 },
  /** Look limits, and how fast the head converges on the target (1/seconds). */
  head: { yaw: 0.5, pitch: 0.34, rate: 5.5 },
  /**
   * Travel of the white cell inside the eye plate, authored in the upper outer quadrant;
   * offsets run from 0 there to -travel at the opposite corner. `bearing` is the sideways
   * angle where the cell bottoms out; `lift` is the elevation band it climbs back up over,
   * starting above eye level since a cursor level with the face reads as looking down.
   */
  glint: { travelX: 0.65, travelY: 0.64, bearing: 0.9, lift: { from: 0.1, to: 0.7 }, rate: 9 },
} as const;

export type CatInteractionState = 'idle' | 'watching';

export type CatInteractionPose = {
  state: CatInteractionState;
  /** Head offsets in radians, added on top of the idle pose rather than replacing it. */
  headYaw: number;
  headPitch: number;
  /** Offsets of the white cell inside the eye plate, in blocks, relative to its rest. */
  glintX: number;
  glintY: number;
};

export const neutralCatInteractionPose = (): CatInteractionPose => ({
  state: 'idle',
  headYaw: 0,
  headPitch: 0,
  glintX: 0,
  glintY: 0,
});

/**
 * Cursor behaviour layered over the idle animation: while the pointer is near the cat, the
 * head turns to follow it and the eye cells slide towards it, easing back to rest once it
 * leaves. Only calculates a pose — the rig remains the sole writer of transforms.
 */
export function createCatInteraction(model: VoxelCatModel) {
  const { group } = model;
  const pose = neutralCatInteractionPose();
  const anchor = new THREE.Vector3(...CAT_INTERACTION.headAnchor);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  /** The canvas in CSS pixels: what turns a distance in clip space into one in pixels. */
  const viewport = new THREE.Vector2();
  const screen = new THREE.Vector3();
  // Plane equation in model space: every point with z = planeZ, facing the camera side.
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -CAT_INTERACTION.planeZ);
  const ray = new THREE.Ray();
  const inverse = new THREE.Matrix4();
  const target = new THREE.Vector3();
  const direction = new THREE.Vector3();

  let active = false;

  /**
   * Normalised device coordinates plus the size of the canvas they were measured against,
   * so the module never touches the DOM itself.
   */
  function setPointer(x: number, y: number, width: number, height: number) {
    pointer.set(x, y);
    viewport.set(width, height);
    active = true;
  }

  /** The pointer left the window, or a touch target expired: nothing left to watch. */
  function clearPointer() {
    active = false;
  }

  function reset(): CatInteractionPose {
    active = false;
    Object.assign(pose, neutralCatInteractionPose());
    return pose;
  }

  /** How far the cursor is from the cat's face on screen, in CSS pixels. */
  function distanceOnScreen(camera: THREE.Camera, x: number, y: number, width: number, height: number) {
    screen.copy(anchor).applyMatrix4(group.matrixWorld).project(camera);
    // Clip space spans the canvas from -1 to 1, so half its size converts a delta to pixels.
    return Math.hypot(((x - screen.x) * width) / 2, ((y - screen.y) * height) / 2);
  }

  /** Checks a tap without changing the current pointer or its enter/exit hysteresis. */
  function isPointerNear(x: number, y: number, width: number, height: number, camera: THREE.Camera, radius: number) {
    group.updateWorldMatrix(true, false);
    return distanceOnScreen(camera, x, y, width, height) < radius;
  }

  /** Writes the cursor's position in model blocks into `target`; false if there is none. */
  function locate(camera: THREE.Camera) {
    // Pull the ray back into the model's own space, since the hero scales/offsets the cat.
    raycaster.setFromCamera(pointer, camera);
    ray.copy(raycaster.ray).applyMatrix4(inverse.copy(group.matrixWorld).invert());
    return ray.intersectPlane(plane, target) !== null;
  }

  function update(deltaSeconds: number, camera: THREE.Camera): CatInteractionPose {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) return pose;
    const watch = CAT_INTERACTION.watch;
    if (active) group.updateWorldMatrix(true, false);
    const near =
      active &&
      distanceOnScreen(camera, pointer.x, pointer.y, viewport.x, viewport.y) <
        (pose.state === 'idle' ? watch.enter : watch.exit);
    pose.state = near ? 'watching' : 'idle';

    let yaw = 0;
    let pitch = 0;
    let glintX = 0;
    let glintY = 0;
    if (near && locate(camera)) {
      // Aim from the face, not the neck pivot: a cursor level with the eyes reads as no pitch.
      direction.copy(target).sub(anchor);
      const head = CAT_INTERACTION.head;
      const glint = CAT_INTERACTION.glint;
      // Unclamped aim; the eyes keep sliding past the head's limits once it stops turning.
      const bearing = Math.atan2(direction.x, direction.z);
      const elevation = Math.atan2(direction.y, Math.hypot(direction.x, direction.z));
      yaw = THREE.MathUtils.clamp(bearing, -head.yaw, head.yaw);
      // Positive pitch on the head pivot tips the muzzle down, so looking up is negative.
      pitch = THREE.MathUtils.clamp(-elevation, -head.pitch, head.pitch);
      // Sideways: -1 at the far side, 0 at the authored corner's own side.
      glintX = (glint.travelX * (THREE.MathUtils.clamp(bearing / glint.bearing, -1, 1) - 1)) / 2;
      // Vertically: down on the plate everywhere below the lift band, up at the top of it.
      const lift = THREE.MathUtils.inverseLerp(glint.lift.from, glint.lift.to, elevation);
      glintY = -glint.travelY * (1 - THREE.MathUtils.clamp(lift, 0, 1));
    }

    // Exponential convergence: the same easing at 30, 60 or 120 Hz, and never a snap.
    const headBlend = 1 - Math.exp(-CAT_INTERACTION.head.rate * deltaSeconds);
    const glintBlend = 1 - Math.exp(-CAT_INTERACTION.glint.rate * deltaSeconds);
    pose.headYaw += (yaw - pose.headYaw) * headBlend;
    pose.headPitch += (pitch - pose.headPitch) * headBlend;
    pose.glintX += (glintX - pose.glintX) * glintBlend;
    pose.glintY += (glintY - pose.glintY) * glintBlend;
    return pose;
  }

  return { setPointer, clearPointer, isPointerNear, update, reset };
}
