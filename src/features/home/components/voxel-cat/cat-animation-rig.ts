import type * as THREE from 'three';
import { CAT_IDLE, neutralCatPose, type CatPose } from './cat-animation-controller';
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

  // Mitered ends must follow the changing joint angle. Adjust the existing 24-vertex
  // buffers, not topology: the two mating planes remain coincident throughout a sway.
  const seams = [
    { mesh: parts['tail-base'], startJoint: undefined, endJoint: joints.tail2 },
    { mesh: parts['tail-mid'], startJoint: joints.tail2, endJoint: joints.tail3 },
    { mesh: parts['tail-mid-2'], startJoint: joints.tail3, endJoint: joints.tail4 },
    { mesh: parts['tail-tip'], startJoint: joints.tail4, endJoint: undefined },
  ].map(({ mesh, startJoint, endJoint }) => ({
    mesh,
    startJoint,
    endJoint,
    positions: mesh.geometry.getAttribute('position') as THREE.BufferAttribute,
    rest: Float32Array.from(mesh.geometry.getAttribute('position').array),
    startSlope: startJoint ? Math.tan(startJoint.rotation.y / 2) : 0,
    endSlope: endJoint ? -Math.tan(endJoint.rotation.y / 2) : 0,
    lastStart: startJoint?.rotation.y ?? 0,
    lastEnd: endJoint?.rotation.y ?? 0,
  }));

  function fitTailSeams() {
    for (const seam of seams) {
      const start = seam.startJoint?.rotation.y ?? 0;
      const end = seam.endJoint?.rotation.y ?? 0;
      if (start === seam.lastStart && end === seam.lastEnd) continue;
      const startDelta = Math.tan(start / 2) - seam.startSlope;
      const endDelta = (seam.endJoint ? -Math.tan(end / 2) : 0) - seam.endSlope;
      for (let index = 0; index < seam.positions.count; index++) {
        const x = seam.rest[index * 3];
        const z = seam.rest[index * 3 + 2];
        seam.positions.setZ(index, z + x * (z > 0 ? startDelta : endDelta));
      }
      seam.positions.needsUpdate = true;
      seam.mesh.geometry.computeVertexNormals();
      seam.mesh.geometry.computeBoundingBox();
      seam.mesh.geometry.computeBoundingSphere();
      seam.lastStart = start;
      seam.lastEnd = end;
    }
  }

  function applyPose(pose: CatPose) {
    joints.chest.scale.z = base.chest.scale.z * (1 + CAT_IDLE.breath.depth * pose.breath);
    joints.head.rotation.y = base.head.rotation.y + pose.headYaw;
    joints.head.rotation.x = base.head.rotation.x + pose.headPitch;
    joints.earL.rotation.z = base.earL.rotation.z + pose.earL;
    joints.earR.rotation.z = base.earR.rotation.z + pose.earR;
    const opening = Math.max(0, Math.min(1, pose.eyeOpen));
    // Retain a thin dark line at closure. Hide only the nearly flattened white glint.
    joints.eyeL.scale.y = base.eyeL.scale.y * (0.055 + opening * 0.945);
    joints.eyeR.scale.y = base.eyeR.scale.y * (0.055 + opening * 0.945);
    glints.forEach((glint, index) => {
      glint.visible = glintVisibility[index] && opening > 0.12;
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
