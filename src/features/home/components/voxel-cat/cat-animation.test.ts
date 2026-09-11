import assert from 'node:assert/strict';
import test from 'node:test';
import { Vector3 } from 'three';
import { CAT_IDLE, createCatAnimationController, neutralCatPose, type CatPose } from './cat-animation-controller';
import { createCatAnimationRig } from './cat-animation-rig';
import { createVoxelCatModel } from './create-voxel-cat-model';

function seededRandom() {
  let seed = 42;
  return () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
}

function sequence(hz: number) {
  const controller = createCatAnimationController(seededRandom());
  const samples: CatPose[] = [];
  for (let frame = 1; frame <= hz * 120; frame++) {
    const pose = controller.update(1 / hz);
    if (frame % (hz / 30) === 0) samples.push({ ...pose });
  }
  return samples;
}

test('two minutes of seeded idle agree at 30/60/120 Hz, including blink edges', () => {
  const reference = sequence(30);
  assert.deepEqual(sequence(30), reference);
  for (const hz of [60, 120]) {
    const samples = sequence(hz);
    reference.forEach((pose, index) => {
      for (const field of Object.keys(pose) as (keyof typeof pose)[]) {
        assert.ok(Math.abs(pose[field] - samples[index][field]) < 1e-8, `${hz} Hz: ${field} at ${index}`);
      }
    });
  }
  for (const pose of reference) {
    assert.ok(pose.eyeOpen >= 0 && pose.eyeOpen <= 1);
    assert.ok(pose.breath >= 0 && pose.breath <= 1);
    assert.ok(Math.abs(pose.headYaw) <= CAT_IDLE.head.amplitude[1]);
    assert.ok(Math.abs(pose.headPitch) <= CAT_IDLE.head.amplitude[1] * CAT_IDLE.head.pitchRatio);
    assert.ok(Math.abs(pose.tail2) <= CAT_IDLE.tailDrift.tail2);
  }
  for (const field of ['headYaw', 'earL', 'earR', 'tail3', 'tail4'] as const)
    assert.ok(
      reference.some((pose) => Math.abs(pose[field]) > 0.01),
      `${field} actually moves`,
    );
  assert.ok(
    reference.some((pose) => pose.eyeOpen === 0),
    'full blink',
  );
});

test('reset restores neutral pose and update reuses its pose object', () => {
  const controller = createCatAnimationController(seededRandom());
  const pose = controller.update(12);
  assert.equal(controller.update(0.02), pose);
  assert.deepEqual(controller.reset(), neutralCatPose());
  assert.deepEqual(controller.update(0), neutralCatPose());
  assert.deepEqual(controller.update(NaN), neutralCatPose());
});

test('rig keeps supports fixed, restores authored glints and has no transform drift', () => {
  const model = createVoxelCatModel();
  const rig = createCatAnimationRig(model);
  const controller = createCatAnimationController(seededRandom());
  const supports = ['front-paw-l', 'front-paw-r', 'hind-paw-l', 'hind-paw-r', 'body-rear'];
  model.group.updateMatrixWorld(true);
  const matrices = supports.map((id) => model.parts[id].matrixWorld.clone());
  const rest = Object.values(model.joints).map((joint) => joint.matrix.clone());
  const tailVertices = ['tail-base', 'tail-mid', 'tail-mid-2', 'tail-tip'].map((id) =>
    Float32Array.from(model.parts[id].geometry.getAttribute('position').array),
  );
  for (let frame = 0; frame < 7200; frame++) rig.applyPose(controller.update(1 / 60));
  model.group.updateMatrixWorld(true);
  supports.forEach((id, index) => assert.ok(model.parts[id].matrixWorld.equals(matrices[index])));
  rig.applyPose({ ...neutralCatPose(), eyeOpen: 0 });
  assert.equal(model.parts['eye-cell-upper-lateral'].visible, false);
  assert.ok(model.joints.eyeL.scale.y > 0);
  rig.reset();
  model.group.updateMatrixWorld(true);
  Object.values(model.joints).forEach((joint, index) => assert.ok(joint.matrix.equals(rest[index])));
  assert.equal(model.parts['eye-cell-upper-lateral'].visible, true);
  ['tail-base', 'tail-mid', 'tail-mid-2', 'tail-tip'].forEach((id, index) =>
    assert.deepEqual(model.parts[id].geometry.getAttribute('position').array, tailVertices[index]),
  );
  model.dispose();
});

test('tail mating corners coincide across combined drift and flick extremes, above the floor', () => {
  const model = createVoxelCatModel();
  const rig = createCatAnimationRig(model);
  const links = ['tail-base', 'tail-mid', 'tail-mid-2', 'tail-tip'];
  const poses: CatPose[] = [];
  const maxTail3 = CAT_IDLE.tailDrift.tail3 + CAT_IDLE.tail.amplitude[1] * 0.65;
  const maxTail4 = CAT_IDLE.tailDrift.tail4 + CAT_IDLE.tail.amplitude[1];
  for (const tail2 of [-CAT_IDLE.tailDrift.tail2, CAT_IDLE.tailDrift.tail2])
    for (const tail3 of [-maxTail3, maxTail3])
      for (const tail4 of [-maxTail4, maxTail4]) poses.push({ ...neutralCatPose(), tail2, tail3, tail4 });
  poses.push(...sequence(30).filter((_, index) => index % 10 === 0));
  for (const pose of poses) {
    rig.applyPose(pose);
    model.group.updateMatrixWorld(true);
    for (let link = 0; link < links.length; link++) {
      const mesh = model.parts[links[link]];
      const positions = mesh.geometry.getAttribute('position');
      const end: Vector3[] = [];
      for (let index = 0; index < positions.count; index++) {
        const local = new Vector3().fromBufferAttribute(positions, index);
        const world = local.clone().applyMatrix4(mesh.matrixWorld);
        assert.ok(world.y >= -1e-6);
        if (local.z < 0) end.push(world);
      }
      if (link === links.length - 1) continue;
      const next = model.parts[links[link + 1]];
      const vertices = next.geometry.getAttribute('position');
      for (let index = 0; index < vertices.count; index++) {
        const local = new Vector3().fromBufferAttribute(vertices, index);
        if (local.z <= 0) continue;
        const world = local.applyMatrix4(next.matrixWorld);
        assert.ok(
          end.some((point) => point.distanceTo(world) < 1e-5),
          `seam ${link}`,
        );
      }
    }
  }
  model.dispose();
});

test('baseline tail drift runs before any event, with stronger flicks layered over it', () => {
  const controller = createCatAnimationController(() => 0);
  const early = { ...controller.update(1) };
  assert.equal(early.headYaw, 0);
  assert.equal(early.earL, 0);
  for (const field of ['tail2', 'tail3', 'tail4'] as const) {
    assert.ok(Math.abs(early[field]) > 0);
    assert.ok(Math.abs(early[field]) <= CAT_IDLE.tailDrift[field]);
  }
  const flick = controller.update(CAT_IDLE.tail.interval[0] + CAT_IDLE.tail.attack + CAT_IDLE.tail.delay - 1);
  assert.ok(Math.abs(flick.tail3) > CAT_IDLE.tailDrift.tail3);
  assert.ok(Math.abs(flick.tail4) > CAT_IDLE.tailDrift.tail4);
});

test('independent gestures overlap and ears and head pitch vary in both directions', () => {
  const controller = createCatAnimationController(seededRandom());
  const samples = Array.from({ length: 60 * 600 }, () => ({ ...controller.update(1 / 60) }));
  assert.ok(samples.some((pose) => pose.headYaw !== 0 && (pose.earL !== 0 || pose.earR !== 0)));
  assert.ok(
    samples.some(
      (pose) =>
        (pose.headYaw !== 0 || pose.earL !== 0 || pose.earR !== 0) && Math.abs(pose.tail4) > CAT_IDLE.tailDrift.tail4,
    ),
  );
  for (const field of ['earL', 'earR', 'headPitch'] as const) {
    assert.ok(
      samples.some((pose) => pose[field] > 0),
      `${field} positive`,
    );
    assert.ok(
      samples.some((pose) => pose[field] < 0),
      `${field} negative`,
    );
  }
  for (const yaw of [-1, 1])
    for (const pitch of [-1, 1])
      assert.ok(samples.some((pose) => pose.headYaw * yaw > 0 && pose.headPitch * pitch > 0));
});

test('a large clock step agrees with small steps after overlapping events', () => {
  const stepped = createCatAnimationController(seededRandom());
  const jumped = createCatAnimationController(seededRandom());
  for (let frame = 0; frame < 60 * 120; frame++) stepped.update(1 / 60);
  const expected = stepped.update(0);
  const actual = jumped.update(120);
  for (const field of Object.keys(expected) as (keyof CatPose)[])
    assert.ok(Math.abs(actual[field] - expected[field]) < 1e-8, field);
});
