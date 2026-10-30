import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/**
 * The blocky "404" and how each digit rocks, tips off the shelf and drops back in. Units are the
 * cat model's own blocks; the shelf top is y = 0, +Z points at the camera.
 */

/** Digits stand on the shelf and tip over its front edge, `maxZ`. */
export const SHELF = { minX: -25.5, maxX: 19, minZ: -10, maxZ: 4.6, top: 1.5, under: 0.75, base: 0.75 };

const VOXEL = 1.7;
const GLYPHS: Record<string, string[]> = {
  '4': ['#.#', '#.#', '###', '..#', '..#'],
  '0': ['###', '#.#', '#.#', '#.#', '###'],
};
export const DIGIT_W = 3 * VOXEL;
const DIGIT_H = 5 * VOXEL;
const DIGIT_D = VOXEL;
/** Digit centres along the shelf, left to right. */
const DIGIT_X = [-18, -10, -2];
/** Resting depth of a digit's centre: just behind the shelf's front edge. */
export const DIGIT_Z = 2.4;
const GRAVITY = 70;

type DigitState = 'resting' | 'wobbling' | 'sliding' | 'tipping' | 'falling' | 'gone' | 'dropping';

export type Digit = {
  index: number;
  group: THREE.Group;
  meshes: THREE.Mesh[];
  home: THREE.Vector3;
  state: DigitState;
  t: number;
  tip: number;
  tipVel: number;
  pivotZ: number;
  slideFrom: number;
  velocity: THREE.Vector3;
  spin: THREE.Vector3;
  dropDelay: number;
};

/** Still on the shelf and free to be knocked off. */
export const isStanding = (digit: Digit) => digit.state === 'resting' || digit.state === 'wobbling';

/** Builds "404" at rest on the shelf. Each mesh's `userData.digit` is its digit's index, for picking. */
export function createDigits(materials: { main: THREE.Material; alt: THREE.Material }) {
  const geometry = new RoundedBoxGeometry(VOXEL * 0.97, VOXEL * 0.97, VOXEL * 0.97, 2, 0.14);
  const digits = ['4', '0', '4'].map((char, index): Digit => {
    const group = new THREE.Group();
    const meshes: THREE.Mesh[] = [];
    GLYPHS[char].forEach((row, r) => {
      [...row].forEach((cell, c) => {
        if (cell !== '#') return;
        const mesh = new THREE.Mesh(geometry, (r + c) % 2 === 0 ? materials.main : materials.alt);
        // Centred on the digit's centre of mass, so falling spins look right.
        mesh.position.set((c - 1) * VOXEL, (2 - r) * VOXEL, 0);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.digit = index;
        group.add(mesh);
        meshes.push(mesh);
      });
    });
    const home = new THREE.Vector3(DIGIT_X[index], DIGIT_H / 2, DIGIT_Z);
    group.position.copy(home);
    return {
      index,
      group,
      meshes,
      home,
      state: 'resting',
      t: 0,
      tip: 0,
      tipVel: 0,
      pivotZ: 0,
      slideFrom: 0,
      velocity: new THREE.Vector3(),
      spin: new THREE.Vector3(),
      dropDelay: 0,
    };
  });
  return { digits, geometry };
}

/** The "hmm, that moved" tap: rock forward onto the front edge and settle back. */
export function wobble(digit: Digit) {
  if (digit.state !== 'resting') return;
  digit.state = 'wobbling';
  digit.t = 0;
}

export function shove(digit: Digit, strength = 1) {
  if (!isStanding(digit)) return;
  digit.state = 'sliding';
  digit.t = 0;
  digit.slideFrom = digit.group.position.z;
  digit.tip = 0;
  digit.tipVel = 1.6 + strength * 1.2;
  digit.group.rotation.set(0, 0, 0);
}

/** Lift the digit out of sight and let it fall back into place after `delay` seconds. */
export function dropIn(digit: Digit, delay: number) {
  digit.group.position.set(digit.home.x, digit.home.y + 30, digit.home.z);
  digit.group.quaternion.identity();
  digit.velocity.set(0, 0, 0);
  digit.state = 'dropping';
  digit.t = 0;
  digit.dropDelay = delay;
}

/** Put the digit straight back home, at rest. */
export function restDigit(digit: Digit) {
  digit.state = 'resting';
  digit.group.visible = true;
  digit.group.position.copy(digit.home);
  digit.group.quaternion.identity();
  digit.group.scale.set(1, 1, 1);
}

const pivot = new THREE.Vector3();
const offset = new THREE.Vector3();
const xAxis = new THREE.Vector3(1, 0, 0);
const spinQ = new THREE.Quaternion();
const spinAxis = new THREE.Vector3();

/** Advance one digit by `dt` seconds. Returns true when a dropping digit bounces hard on the shelf. */
export function updateDigit(digit: Digit, dt: number) {
  const g = digit.group;
  digit.t += dt;
  switch (digit.state) {
    case 'wobbling': {
      const a = 0.17 * Math.abs(Math.sin(digit.t * 13)) * Math.exp(-digit.t * 5.5);
      pivot.set(g.position.x, 0, digit.home.z + DIGIT_D / 2);
      offset.set(0, DIGIT_H / 2, -DIGIT_D / 2).applyAxisAngle(xAxis, a);
      g.position.set(digit.home.x, pivot.y + offset.y, pivot.z + offset.z);
      g.rotation.set(a, 0, 0);
      if (digit.t > 0.9) {
        g.position.copy(digit.home);
        g.rotation.set(0, 0, 0);
        digit.state = 'resting';
      }
      return false;
    }
    case 'sliding': {
      // A short skid to the lip, then it pivots over the edge.
      const target = SHELF.maxZ - DIGIT_D / 2;
      const k = Math.min(1, digit.t / 0.16);
      g.position.z = THREE.MathUtils.lerp(digit.slideFrom, target, 1 - (1 - k) * (1 - k));
      g.position.y = DIGIT_H / 2;
      if (k >= 1) {
        digit.state = 'tipping';
        digit.t = 0;
        digit.pivotZ = SHELF.maxZ;
      }
      return false;
    }
    case 'tipping': {
      digit.tipVel += (5 + 22 * Math.sin(digit.tip + 0.2)) * dt;
      digit.tip += digit.tipVel * dt;
      pivot.set(g.position.x, 0, digit.pivotZ);
      offset.set(0, DIGIT_H / 2, -DIGIT_D / 2).applyAxisAngle(xAxis, digit.tip);
      g.position.set(g.position.x, offset.y, pivot.z + offset.z);
      g.rotation.set(digit.tip, 0, 0);
      if (digit.tip > 0.95) {
        // Hand over to free fall with the centre of mass's current velocity.
        const r = offset.length();
        const dir = offset.clone().normalize();
        // Tangential direction for rotation about +X.
        digit.velocity.set((Math.random() - 0.5) * 3, -dir.z * r * digit.tipVel * 0.9, dir.y * r * digit.tipVel * 0.9);
        digit.spin.set(digit.tipVel * 0.9, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 2.5);
        digit.state = 'falling';
        digit.t = 0;
      }
      return false;
    }
    case 'falling': {
      digit.velocity.y -= GRAVITY * dt;
      g.position.addScaledVector(digit.velocity, dt);
      const speed = digit.spin.length();
      if (speed > 0) {
        spinQ.setFromAxisAngle(spinAxis.copy(digit.spin).normalize(), speed * dt);
        g.quaternion.premultiply(spinQ);
      }
      if (g.position.y < -60) {
        digit.state = 'gone';
        g.visible = false;
      }
      return false;
    }
    case 'dropping': {
      if (digit.t < digit.dropDelay) {
        g.visible = false;
        return false;
      }
      g.visible = true;
      let bounced = false;
      digit.velocity.y -= GRAVITY * 1.2 * dt;
      g.position.y += digit.velocity.y * dt;
      if (g.position.y <= digit.home.y) {
        g.position.y = digit.home.y;
        if (Math.abs(digit.velocity.y) > 6) {
          digit.velocity.y = -digit.velocity.y * 0.28;
          bounced = true;
        } else {
          digit.velocity.y = 0;
          digit.state = 'resting';
          g.scale.set(1, 1, 1);
        }
      }
      // Squash on contact, stretch in the air.
      const v = Math.min(1, Math.abs(digit.velocity.y) / 40);
      const grounded = g.position.y - digit.home.y < 0.4;
      const s = grounded ? -0.12 * v : 0.08 * v;
      g.scale.set(1 - s * 0.5, 1 + s, 1 - s * 0.5);
      return bounced;
    }
    default:
      return false;
  }
}
