import type * as THREE from 'three';
import { CAT_IDLE, createCatAnimationController } from './cat-animation-controller';
import { createCatAnimationRig } from './cat-animation-rig';
import { createCatInteraction } from './cat-interaction-controller';
import type { VoxelCatModel } from './create-voxel-cat-model';

/**
 * Owns the three animation subsystems and the clock hygiene between them. Touches no browser
 * API of its own: pointer positions arrive already measured.
 */
export function createCatDriver(model: VoxelCatModel, random?: () => number) {
  const controller = createCatAnimationController(random);
  const rig = createCatAnimationRig(model);
  const interaction = createCatInteraction(model);
  let firstFrame = true;

  function resume() {
    firstFrame = true;
  }

  function update(deltaSeconds: number, camera: THREE.Camera) {
    // The first delta can include time off-screen or in a hidden tab. Never catch up.
    const elapsed = firstFrame ? 0 : Math.min(deltaSeconds, CAT_IDLE.maxDelta);
    firstFrame = false;
    rig.applyPose(controller.update(elapsed), interaction.update(elapsed, camera));
  }

  function reset() {
    controller.reset();
    interaction.reset();
    rig.reset();
    firstFrame = true;
  }

  return {
    setPointer: interaction.setPointer,
    setGaze: interaction.setGaze,
    clearPointer: interaction.clearPointer,
    isPointerNear: interaction.isPointerNear,
    resume,
    update,
    reset,
  };
}
