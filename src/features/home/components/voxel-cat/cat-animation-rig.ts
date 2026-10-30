import type * as THREE from 'three';
import { CAT_IDLE, neutralCatPose, type CatPose } from './cat-animation-controller';
import type { CatInteractionPose } from './cat-interaction-controller';
import type { VoxelCatModel } from './create-voxel-cat-model';

/** The only writer of animated transforms; every pose is relative to the authored rest. */
export function createCatAnimationRig(model: VoxelCatModel) {
  const { joints, parts } = model;
  const base = Object.fromEntries(
    Object.entries(joints).map(([name, joint]) => [
      name,
      {
        position: joint.position.clone(),
        rotation: joint.rotation.clone(),
        scale: joint.scale.clone(),
      },
    ]),
  );
  const glints = [parts['eye-cell-upper-lateral'], parts['eye-cell-upper-medial']];
  const glintVisibility = glints.map((glint) => glint.visible);
  const glintRest = glints.map((glint) => glint.position.clone());

  const seams = [
    { mesh: parts['tail-base'], joint: joints.tail2, face: 'end' },
    { mesh: parts['tail-mid-band'], joint: joints.tail2, face: 'start' },
    { mesh: parts['tail-mid'], joint: joints.tail3, face: 'end' },
    { mesh: parts['tail-mid-2-band'], joint: joints.tail3, face: 'start' },
    { mesh: parts['tail-mid-2'], joint: joints.tail4, face: 'end' },
    { mesh: parts['tail-tip'], joint: joints.tail4, face: 'start' },
  ].map(({ mesh, joint, face }) => {
    const slope = (angle: number) => (face === 'start' ? 1 : -1) * Math.tan(angle / 2);
    const positions = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
    return {
      mesh,
      joint,
      slope,
      positions,
      rest: Float32Array.from(positions.array),
      lever: mesh.geometry.userData.tailMitre as Float32Array,
      restSlope: slope(joint.rotation.y),
      last: joint.rotation.y,
    };
  });

  function fitTailSeams() {
    for (const seam of seams) {
      const angle = seam.joint.rotation.y;
      if (angle === seam.last) continue;
      const delta = seam.slope(angle) - seam.restSlope;
      for (let index = 0; index < seam.positions.count; index++) {
        seam.positions.setZ(index, seam.rest[index * 3 + 2] + seam.lever[index] * delta);
      }
      seam.positions.needsUpdate = true;
      seam.mesh.geometry.computeVertexNormals();
      seam.last = angle;
    }
  }

  /** `interaction` layers the cursor response over the idle pose; omit it for idle alone. */
  function applyPose(pose: CatPose, interaction?: CatInteractionPose) {
    joints.chest.scale.z = base.chest.scale.z * (1 + CAT_IDLE.breath.depth * pose.breath);
    joints.head.rotation.y = base.head.rotation.y + pose.headYaw + (interaction?.headYaw ?? 0);
    joints.head.rotation.x = base.head.rotation.x + pose.headPitch + (interaction?.headPitch ?? 0);
    joints.earL.rotation.z = base.earL.rotation.z + pose.earL;
    joints.earR.rotation.z = base.earR.rotation.z + pose.earR;
    const opening = Math.max(0, Math.min(1, pose.eyeOpen));
    // Retain a thin dark line at closure. Hide only the nearly flattened white glint.
    joints.eyeL.scale.y = base.eyeL.scale.y * (0.055 + opening * 0.945);
    joints.eyeR.scale.y = base.eyeR.scale.y * (0.055 + opening * 0.945);
    glints.forEach((glint, index) => {
      glint.visible = glintVisibility[index] && opening > 0.12;
      // Only the cell moves; its dark plate stays put, which is what makes the eye read as a
      // pupil rather than a highlight.
      glint.position.x = glintRest[index].x + (interaction?.glintX ?? 0);
      glint.position.y = glintRest[index].y + (interaction?.glintY ?? 0);
    });
    joints.tail2.rotation.y = base.tail2.rotation.y + pose.tail2;
    joints.tail3.rotation.y = base.tail3.rotation.y + pose.tail3;
    joints.tail4.rotation.y = base.tail4.rotation.y + pose.tail4;
    fitTailSeams();
  }

  function reset() {
    for (const [name, joint] of Object.entries(joints)) {
      joint.position.copy(base[name].position);
      joint.rotation.copy(base[name].rotation);
      joint.scale.copy(base[name].scale);
    }
    applyPose(neutralCatPose());
  }

  return { applyPose, reset };
}
