import * as THREE from 'three';
import type { VoxelCatModel } from './create-voxel-cat-model';

/** Blocks, CSS pixels and radians; all cursor tuning lives here. */
export const CAT_INTERACTION = {
  /**
   * The pointer is projected onto an upright plane standing this far along the cat's own
   * +Z, a little clear of the nose (6.85) and the front paws (6.3), so any screen position
   * becomes a point the cat could plausibly be looking at.
   */
  planeZ: 7.6,
  /** Face centre, in world blocks: what "the cursor is near the cat" is measured from. */
  headAnchor: [0, 10.4, 3.48],
  /**
   * Enter/exit radii in CSS pixels around the cat's face *on screen*, not in model blocks:
   * the cat should notice a cursor that is a fixed distance away however large the panel
   * has fitted it. The gap between them is a hysteresis band a cursor has to cross twice
   * to toggle the state, so hovering on the edge cannot make the cat flick its head in and
   * out of watching.
   */
  watch: { enter: 400, exit: 600 },
  /** Look limits, and how fast the head converges on the target (1/seconds). */
  head: { yaw: 0.5, pitch: 0.34, rate: 5.5 },
  /**
   * Travel of the white cell inside its 1.3 x 1.29 dark eye plate, in blocks. The cell is
   * 0.65 square and authored in the upper outer quadrant, so a full slide lands it in the
   * opposite one and never overhangs the plate: the offsets below run from 0 at that
   * authored corner to -travel away from it. The cell converges faster than the head does
   * — the eyes flick across and the head follows.
   *
   * `bearing` is the sideways aim angle at which the cell bottoms out. `lift` is the
   * elevation band the cell climbs back up over, and it starts above eye level on purpose:
   * a cursor level with the face is about where the cat's own nose is, so it looks *down*
   * at one, and only something over its head brings the cells up to the authored corner.
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
 * head turns to follow it and the white cell in each eye slides towards it, and both ease
 * back to the authored rest once it leaves.
 *
 * Like the idle controller this only calculates a pose — the rig remains the sole writer of
 * transforms — but it needs the model to read the authored head position, and the camera to
 * turn a 2D pointer into a point in the cat's own block space.
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

  /** The pointer left the window, or a touch ended: the cat has nothing to watch. */
  function clearPointer() {
    active = false;
  }

  function reset(): CatInteractionPose {
    active = false;
    pose.state = 'idle';
    pose.headYaw = 0;
    pose.headPitch = 0;
    pose.glintX = 0;
    pose.glintY = 0;
    return pose;
  }

  /** How far the cursor is from the cat's face on screen, in CSS pixels. */
  function distanceOnScreen(camera: THREE.Camera) {
    screen.copy(anchor).applyMatrix4(group.matrixWorld).project(camera);
    // Clip space spans the canvas from -1 to 1, so half its size converts a delta to pixels.
    return Math.hypot(((pointer.x - screen.x) * viewport.x) / 2, ((pointer.y - screen.y) * viewport.y) / 2);
  }

  /** Writes the cursor's position in model blocks into `target`; false if there is none. */
  function locate(camera: THREE.Camera) {
    // The hero scales and offsets the cat to fit its panel, so the ray is pulled back into
    // the model's own space: the look direction is then read straight off the block layout.
    raycaster.setFromCamera(pointer, camera);
    ray.copy(raycaster.ray).applyMatrix4(inverse.copy(group.matrixWorld).invert());
    return ray.intersectPlane(plane, target) !== null;
  }

  function update(deltaSeconds: number, camera: THREE.Camera): CatInteractionPose {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) return pose;
    const watch = CAT_INTERACTION.watch;
    if (active) group.updateWorldMatrix(true, false);
    const near = active && distanceOnScreen(camera) < (pose.state === 'idle' ? watch.enter : watch.exit);
    pose.state = near ? 'watching' : 'idle';

    let yaw = 0;
    let pitch = 0;
    let glintX = 0;
    let glintY = 0;
    if (near && locate(camera)) {
      // Aim from the face rather than the neck pivot it turns around: a cursor level with
      // the eyes should read as no pitch at all.
      direction.copy(target).sub(anchor);
      const head = CAT_INTERACTION.head;
      const glint = CAT_INTERACTION.glint;
      // The unclamped aim. The head stops at its limits; the eyes keep sliding past them,
      // which is what sells a cursor the cat cannot quite turn to face.
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

  return { setPointer, clearPointer, update, reset };
}
