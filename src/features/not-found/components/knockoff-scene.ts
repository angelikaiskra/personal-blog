import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { createCatDriver } from '@/features/home/components/voxel-cat/cat-driver';
import { createVoxelCatModel, type VoxelCatTheme } from '@/features/home/components/voxel-cat/create-voxel-cat-model';

/**
 * 404 scene: the voxel cat sits on a shelf next to a blocky "404" and, being a cat, knocks
 * each digit off the edge, one tap-tap-shove at a time. Visitors can shove digits themselves
 * or click the cat to hurry it along. Units are the cat model's own blocks; the shelf top is
 * y = 0, +Z points at the camera.
 */

export type KnockoffStatus = 'playing' | 'empty' | 'rebuilding';

export type KnockoffSceneOptions = {
  canvas: HTMLCanvasElement;
  theme: VoxelCatTheme;
  /** Static scene, no choreography and no idle animation. */
  reducedMotion?: boolean;
  onStatusChange?: (status: KnockoffStatus) => void;
  /** Seconds the shelf stays empty before the digits come back on their own. 0 disables. */
  autoRebuildAfter?: number;
};

export type KnockoffScene = {
  setTheme: (theme: VoxelCatTheme) => void;
  setReducedMotion: (reduced: boolean) => void;
  rebuild: () => void;
  dispose: () => void;
};

/* ------------------------------------------------------------------------------------------ */
/* Look                                                                                         */
/* ------------------------------------------------------------------------------------------ */

/** Site tokens, resolved to sRGB: primary #f6b846, the button's #86662D underside, black. */
const SCENE_PALETTES = {
  light: {
    shelf: '#ffcb5c',
    shelfUnder: '#86662d',
    shelfBase: '#1e1e1e',
    digit: '#2a3151',
    digitAlt: '#383d51',
  },
  dark: {
    shelf: '#ffcb5c',
    shelfUnder: '#86662d',
    shelfBase: '#000000',
    digit: '#f5f0e6',
    digitAlt: '#e4dccb',
  },
} as const;

/** Camera matches the hero's ~18° elevation; no yaw, so the digits read flat-on. */
const ELEVATION = 0.32;
const LOOK_AT = new THREE.Vector3(-3.5, 3.6, -1);
/** Blocks that must stay in frame, at any aspect ratio. */
const FRAME = { width: 50, height: 27 };

const SHELF = { minX: -25.5, maxX: 19, minZ: -10, maxZ: 4.6, top: 1.5, under: 0.75, base: 0.75 };

/* ------------------------------------------------------------------------------------------ */
/* Digits                                                                                       */
/* ------------------------------------------------------------------------------------------ */

const VOXEL = 1.7;
const GLYPHS: Record<string, string[]> = {
  '4': ['#.#', '#.#', '###', '..#', '..#'],
  '0': ['###', '#.#', '#.#', '#.#', '###'],
};
const DIGIT_W = 3 * VOXEL;
const DIGIT_H = 5 * VOXEL;
const DIGIT_D = VOXEL;
/** Digit centres along the shelf, left to right. */
const DIGIT_X = [-18, -10, -2];
/** Resting depth of a digit's centre: just behind the shelf's front edge. */
const DIGIT_Z = 2.4;
const GRAVITY = 70;

type DigitState = 'resting' | 'wobbling' | 'sliding' | 'tipping' | 'falling' | 'gone' | 'dropping';

type Digit = {
  index: number;
  group: THREE.Group;
  meshes: THREE.Mesh[];
  home: THREE.Vector3;
  state: DigitState;
  /** Claimed by the cat's current approach. */
  claimed: boolean;
  t: number;
  tip: number;
  tipVel: number;
  pivotZ: number;
  slideFrom: number;
  velocity: THREE.Vector3;
  spin: THREE.Vector3;
  dropDelay: number;
};

/* ------------------------------------------------------------------------------------------ */
/* Cat choreography                                                                             */
/* ------------------------------------------------------------------------------------------ */

const CAT_HOME = { x: 12.5, z: -1.2, yaw: -0.47 };
/** Facing mostly left: the camera-side (left) paw does the swatting. */
const SWAT_YAW = -1.15;
/** How far ahead of the cat's origin the raised paw lands, and how far off-centre it sits. */
const PAW_REACH = 8.6;
const PAW_SIDE = 2.07;

const smooth = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};
const lerp = THREE.MathUtils.lerp;

/** Where the cat sits to swat a digit's right-hand face with its left front paw. */
function swatSpot(digitX: number) {
  const forwardX = Math.sin(SWAT_YAW);
  const forwardZ = Math.cos(SWAT_YAW);
  // The model's own +X (its left side) in world space.
  const leftX = Math.cos(SWAT_YAW);
  const leftZ = -Math.sin(SWAT_YAW);
  const contactX = digitX + DIGIT_W / 2 + 0.15;
  const contactZ = DIGIT_Z;
  return {
    x: contactX - forwardX * PAW_REACH - leftX * PAW_SIDE,
    z: contactZ - forwardZ * PAW_REACH - leftZ * PAW_SIDE,
    yaw: SWAT_YAW,
  };
}

/* ------------------------------------------------------------------------------------------ */

export function createKnockoffScene(options: KnockoffSceneOptions): KnockoffScene {
  const { canvas, onStatusChange, autoRebuildAfter = 8 } = options;
  let theme: VoxelCatTheme = options.theme;
  let reduced = !!options.reducedMotion;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
  camera.position.copy(LOOK_AT).add(new THREE.Vector3(0, Math.sin(ELEVATION), Math.cos(ELEVATION)).multiplyScalar(120));
  camera.lookAt(LOOK_AT);

  // Same studio rig as the hero, with a shadow camera wide enough for the whole shelf.
  scene.add(new THREE.HemisphereLight('#fffaf2', '#d6cec1', 1.4));
  const key = new THREE.DirectionalLight('#fff8ee', 1.7);
  key.position.set(-3, 5, 7).normalize().multiplyScalar(60).add(LOOK_AT);
  key.target.position.copy(LOOK_AT);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -32, right: 32, top: 24, bottom: -24, near: 1, far: 140 });
  key.shadow.normalBias = 0.03;
  key.shadow.bias = -0.0002;
  key.shadow.radius = 3;
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight('#ffffff', 0.7);
  fill.position.set(5, 2, 2);
  scene.add(fill);

  /* Shelf: three stacked slabs, the site's 3D button turned into furniture. */
  const palette = () => SCENE_PALETTES[theme];
  const shelfMaterials = {
    top: new THREE.MeshStandardMaterial({ color: palette().shelf, roughness: 0.75 }),
    under: new THREE.MeshStandardMaterial({ color: palette().shelfUnder, roughness: 0.8 }),
    base: new THREE.MeshStandardMaterial({ color: palette().shelfBase, roughness: 0.85 }),
  };
  const shelf = new THREE.Group();
  const shelfW = SHELF.maxX - SHELF.minX;
  const shelfD = SHELF.maxZ - SHELF.minZ;
  const shelfCX = (SHELF.minX + SHELF.maxX) / 2;
  const shelfCZ = (SHELF.minZ + SHELF.maxZ) / 2;
  const geometries: THREE.BufferGeometry[] = [];
  const slab = (height: number, y: number, material: THREE.Material, inset: number) => {
    const geometry = new RoundedBoxGeometry(shelfW - inset, height, shelfD - inset, 2, 0.12);
    geometries.push(geometry);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(shelfCX, y, shelfCZ);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    shelf.add(mesh);
    return mesh;
  };
  slab(SHELF.top, -SHELF.top / 2, shelfMaterials.top, 0);
  slab(SHELF.under, -SHELF.top - SHELF.under / 2 + 0.05, shelfMaterials.under, 0.01);
  // Like the site's buttons, the darkest layer only shows in the light theme.
  const shelfBase = slab(SHELF.base, -SHELF.top - SHELF.under - SHELF.base / 2 + 0.1, shelfMaterials.base, 0.02);
  shelfBase.visible = theme === 'light';
  scene.add(shelf);

  /* Digits */
  const voxelGeometry = new RoundedBoxGeometry(VOXEL * 0.97, VOXEL * 0.97, VOXEL * 0.97, 2, 0.14);
  geometries.push(voxelGeometry);
  const digitMaterials = {
    main: new THREE.MeshStandardMaterial({ color: palette().digit, roughness: 0.7 }),
    alt: new THREE.MeshStandardMaterial({ color: palette().digitAlt, roughness: 0.7 }),
  };
  const digits: Digit[] = ['4', '0', '4'].map((char, index): Digit => {
    const group = new THREE.Group();
    const meshes: THREE.Mesh[] = [];
    GLYPHS[char].forEach((row, r) => {
      [...row].forEach((cell, c) => {
        if (cell !== '#') return;
        const material = (r + c) % 2 === 0 ? digitMaterials.main : digitMaterials.alt;
        const mesh = new THREE.Mesh(voxelGeometry, material);
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
    scene.add(group);
    return {
      index,
      group,
      meshes,
      home,
      state: 'resting',
      claimed: false,
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

  /* Cat */
  const model = createVoxelCatModel({ theme });
  const cat = createCatDriver(model);
  const catRoot = new THREE.Group();
  catRoot.add(model.group);
  scene.add(catRoot);
  const head = model.joints.head;
  const headRest = head.rotation.clone();
  const pawL = model.group.getObjectByName('voxel-cat-front-leg-l') as THREE.Group;
  const pawRest = pawL.rotation.clone();
  const catMeshes = Object.values(model.parts);

  const catPose = {
    x: CAT_HOME.x,
    z: CAT_HOME.z,
    yaw: CAT_HOME.yaw,
    hop: 0,
    squash: 0,
    lean: 0,
    paw: 0,
    pawOut: 0,
    /** Head override on top of the idle and cursor pose, blended in by `focus`. */
    focus: 0,
    lookYaw: 0,
    lookPitch: 0,
  };
  const applyCat = () => {
    catRoot.position.set(catPose.x, catPose.hop, catPose.z);
    catRoot.rotation.set(catPose.lean, catPose.yaw, 0, 'YXZ');
    catRoot.scale.set(1 + catPose.squash * 0.5, 1 - catPose.squash, 1 + catPose.squash * 0.5);
    pawL.rotation.set(pawRest.x + catPose.paw, pawRest.y, pawRest.z + catPose.pawOut);
  };
  applyCat();

  /* -------------------------------------------------------------------------------------- */
  /* Timeline: promises resolved by the frame loop, so everything pauses with the page.     */
  /* -------------------------------------------------------------------------------------- */

  type Tween = { elapsed: number; duration: number; step: (k: number) => void; resolve: () => void };
  let tweens: Tween[] = [];
  /** Bumped to cancel whatever script is running. */
  let generation = 0;
  class Cancelled extends Error {}

  const tween = (duration: number, step: (k: number) => void, gen: number) =>
    new Promise<void>((resolve, reject) => {
      if (gen !== generation) return reject(new Cancelled());
      tweens.push({
        elapsed: 0,
        duration,
        step,
        resolve: () => (gen === generation ? resolve() : reject(new Cancelled())),
      });
    });
  const wait = (seconds: number, gen: number) => tween(seconds, () => {}, gen);

  const advanceTweens = (dt: number) => {
    const running = tweens;
    tweens = [];
    for (const item of running) {
      item.elapsed += dt;
      const k = Math.min(1, item.elapsed / item.duration);
      item.step(k);
      if (k >= 1) item.resolve();
      else tweens.push(item);
    }
  };

  /** Ease the head override to a target. */
  const look = (yaw: number, pitch: number, focus: number, duration: number, gen: number) => {
    const from = { yaw: catPose.lookYaw, pitch: catPose.lookPitch, focus: catPose.focus };
    return tween(
      duration,
      (k) => {
        const e = smooth(k);
        catPose.lookYaw = lerp(from.yaw, yaw, e);
        catPose.lookPitch = lerp(from.pitch, pitch, e);
        catPose.focus = lerp(from.focus, focus, e);
      },
      gen,
    );
  };

  const hop = async (to: { x: number; z: number; yaw: number }, gen: number) => {
    const distance = Math.hypot(to.x - catPose.x, to.z - catPose.z);
    const air = 0.3 + Math.min(distance, 12) * 0.018;
    const height = 1.6 + Math.min(distance, 12) * 0.12;
    await tween(0.14, (k) => (catPose.squash = 0.12 * smooth(k)), gen);
    const from = { x: catPose.x, z: catPose.z, yaw: catPose.yaw };
    await tween(
      air,
      (k) => {
        catPose.x = lerp(from.x, to.x, k);
        catPose.z = lerp(from.z, to.z, k);
        catPose.yaw = lerp(from.yaw, to.yaw, smooth(k));
        catPose.hop = 4 * height * k * (1 - k);
        catPose.squash = k < 0.25 ? lerp(0.12, -0.08, k / 0.25) : lerp(-0.08, 0, (k - 0.25) / 0.75);
      },
      gen,
    );
    catPose.hop = 0;
    await tween(0.1, (k) => (catPose.squash = 0.1 * Math.sin(k * Math.PI)), gen);
    catPose.squash = 0;
  };

  const turn = (yaw: number, duration: number, gen: number) => {
    const from = catPose.yaw;
    return tween(duration, (k) => (catPose.yaw = lerp(from, yaw, smooth(k))), gen);
  };

  /** Raise the paw, then a quick tap; `strength` 0..1 sets how far it reaches. */
  const tap = async (gen: number, onContact: () => void, windUp = 0.3) => {
    await tween(
      windUp,
      (k) => {
        const e = smooth(k);
        catPose.paw = -1.45 * e;
        catPose.pawOut = 0.12 * e;
        catPose.lean = -0.04 * e;
      },
      gen,
    );
    await tween(0.07, (k) => (catPose.paw = lerp(-1.45, -1.12, k)), gen);
    onContact();
    await tween(
      0.32,
      (k) => {
        const e = smooth(k);
        catPose.paw = lerp(-1.12, 0, e);
        catPose.pawOut = lerp(0.12, 0, e);
        catPose.lean = lerp(-0.04, 0, e);
      },
      gen,
    );
  };

  /* -------------------------------------------------------------------------------------- */
  /* Digit physics                                                                           */
  /* -------------------------------------------------------------------------------------- */

  const shelfFront = SHELF.maxZ;
  const pivot = new THREE.Vector3();
  const offset = new THREE.Vector3();
  const xAxis = new THREE.Vector3(1, 0, 0);
  const spinQ = new THREE.Quaternion();
  const spinAxis = new THREE.Vector3();

  const wobble = (digit: Digit) => {
    if (digit.state !== 'resting') return;
    digit.state = 'wobbling';
    digit.t = 0;
  };

  const shove = (digit: Digit, strength = 1) => {
    if (digit.state !== 'resting' && digit.state !== 'wobbling') return;
    digit.state = 'sliding';
    digit.t = 0;
    digit.slideFrom = digit.group.position.z;
    digit.tip = 0;
    digit.tipVel = 1.6 + strength * 1.2;
    digit.group.rotation.set(0, 0, 0);
  };

  const anyStanding = () =>
    digits.some((d) => d.state === 'resting' || d.state === 'wobbling' || d.state === 'dropping');

  const updateDigit = (digit: Digit, dt: number) => {
    const g = digit.group;
    digit.t += dt;
    switch (digit.state) {
      case 'wobbling': {
        // Rock forward onto the front edge and settle back: the "hmm, that moved" tap.
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
        break;
      }
      case 'sliding': {
        // A short skid to the lip, then it pivots over the edge.
        const target = shelfFront - DIGIT_D / 2;
        const k = Math.min(1, digit.t / 0.16);
        g.position.z = lerp(digit.slideFrom, target, 1 - (1 - k) * (1 - k));
        g.position.y = DIGIT_H / 2;
        if (k >= 1) {
          digit.state = 'tipping';
          digit.t = 0;
          digit.pivotZ = shelfFront;
        }
        break;
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
          digit.velocity.set(
            (Math.random() - 0.5) * 3,
            -dir.z * r * digit.tipVel * 0.9,
            dir.y * r * digit.tipVel * 0.9,
          );
          digit.spin.set(digit.tipVel * 0.9, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 2.5);
          digit.state = 'falling';
          digit.t = 0;
        }
        break;
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
        break;
      }
      case 'dropping': {
        if (digit.t < digit.dropDelay) {
          g.visible = false;
          break;
        }
        g.visible = true;
        digit.velocity.y -= GRAVITY * 1.2 * dt;
        g.position.y += digit.velocity.y * dt;
        if (g.position.y <= digit.home.y) {
          g.position.y = digit.home.y;
          if (Math.abs(digit.velocity.y) > 6) {
            digit.velocity.y = -digit.velocity.y * 0.28;
            shelfThud = Math.max(shelfThud, 0.25);
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
        break;
      }
      default:
        break;
    }
  };

  let shelfThud = 0;

  /* -------------------------------------------------------------------------------------- */
  /* Scripts                                                                                 */
  /* -------------------------------------------------------------------------------------- */

  let status: KnockoffStatus = 'playing';
  const setStatus = (next: KnockoffStatus) => {
    if (next === status) return;
    status = next;
    onStatusChange?.(next);
  };

  let hurry: (() => void) | null = null;
  /** A wait the visitor can cut short by clicking the cat. */
  const patience = (seconds: number, gen: number) =>
    new Promise<void>((resolve, reject) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        hurry = null;
        if (gen === generation) resolve();
        else reject(new Cancelled());
      };
      hurry = finish;
      wait(seconds, gen).then(finish, (error) => {
        done = true;
        hurry = null;
        reject(error);
      });
    });

  const nextTarget = () =>
    [...digits].reverse().find((d) => (d.state === 'resting' || d.state === 'wobbling') && !d.claimed) ?? null;

  const knockEverything = async (gen: number) => {
    await patience(1.6, gen);
    for (;;) {
      const digit = nextTarget();
      if (!digit) break;
      digit.claimed = true;
      try {
        // Notice it, go over.
        await look(0.35, 0.15, 1, 0.35, gen);
        await wait(0.25, gen);
        await look(0, 0.3, 1, 0.2, gen);
        await hop(swatSpot(digit.home.x), gen);
        await look(0, 0.3, 1, 0.25, gen);
        await wait(0.3, gen);

        if (digit.state === 'resting' || digit.state === 'wobbling') {
          // Tap. Watch it rock. Look at you. Shove.
          await tap(gen, () => wobble(digit));
          await wait(0.45, gen);
          await look(0.75, -0.05, 1, 0.3, gen);
          await wait(0.55, gen);
          await look(0, 0.3, 1, 0.25, gen);
          await tap(gen, () => shove(digit), 0.22);
        }
        // Follow it down.
        await look(0.6, 0.62, 1, 0.3, gen);
        await wait(0.55, gen);
        await look(0.7, 0, 0.6, 0.45, gen);
      } finally {
        digit.claimed = false;
      }
      await patience(1.1, gen);
    }

    // Nothing left to knock over: face the audience, very pleased.
    await turn(-0.25, 0.45, gen);
    await look(0, 0, 0, 0.4, gen);
    setStatus('empty');
    if (autoRebuildAfter > 0) {
      await wait(autoRebuildAfter, gen);
      void rebuildScript(gen);
    }
  };

  const rebuildScript = async (gen: number) => {
    setStatus('rebuilding');
    await hop(CAT_HOME, gen);
    await look(0.3, -0.35, 1, 0.3, gen);
    digits.forEach((digit, i) => {
      digit.group.position.set(digit.home.x, digit.home.y + 30, digit.home.z);
      digit.group.rotation.set(0, 0, 0);
      digit.group.quaternion.identity();
      digit.velocity.set(0, 0, 0);
      digit.state = 'dropping';
      digit.claimed = false;
      digit.t = 0;
      digit.dropDelay = i * 0.14;
    });
    await look(0.25, 0.1, 1, 0.6, gen);
    await wait(0.5, gen);
    await look(0, 0, 0, 0.4, gen);
    setStatus('playing');
    await knockEverything(gen);
  };

  const run = (script: (gen: number) => Promise<void>) => {
    generation += 1;
    tweens = [];
    hurry = null;
    const gen = generation;
    script(gen).catch((error) => {
      if (!(error instanceof Cancelled)) throw error;
    });
  };

  /* -------------------------------------------------------------------------------------- */
  /* Input                                                                                    */
  /* -------------------------------------------------------------------------------------- */

  let rect: DOMRect | null = null;
  const pointer = { x: 0, y: 0, active: false };
  const ndc = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();

  const measure = () => (rect ??= canvas.getBoundingClientRect());
  const toNdc = (clientX: number, clientY: number) => {
    const box = measure();
    ndc.set(((clientX - box.left) / box.width) * 2 - 1, -((clientY - box.top) / box.height) * 2 + 1);
    return box;
  };

  const pick = (clientX: number, clientY: number) => {
    toNdc(clientX, clientY);
    raycaster.setFromCamera(ndc, camera);
    const standing = digits.filter((d) => d.state === 'resting' || d.state === 'wobbling').flatMap((d) => d.meshes);
    const hit = raycaster.intersectObjects([...standing, ...catMeshes], false)[0];
    if (!hit) return null;
    const index = hit.object.userData.digit as number | undefined;
    return index === undefined ? ({ kind: 'cat' } as const) : ({ kind: 'digit', digit: digits[index] } as const);
  };

  const onMove = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
    if (!reduced) canvas.style.cursor = pick(event.clientX, event.clientY) ? 'pointer' : '';
  };
  const onLeave = () => {
    pointer.active = false;
    cat.clearPointer();
  };
  const onDown = (event: PointerEvent) => {
    if (reduced) return;
    const target = pick(event.clientX, event.clientY);
    if (!target) return;
    if (target.kind === 'digit') shove(target.digit, 1.4);
    else {
      // Clicking the cat hurries it along to the next digit.
      hurry?.();
    }
    if (event.pointerType === 'touch') {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    }
  };
  const remeasure = () => {
    rect = null;
  };

  canvas.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerleave', onLeave);
  window.addEventListener('blur', onLeave);
  window.addEventListener('scroll', remeasure, { passive: true, capture: true });

  /* -------------------------------------------------------------------------------------- */
  /* Frame loop                                                                              */
  /* -------------------------------------------------------------------------------------- */

  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    const aspect = width / height;
    const halfH = Math.max(FRAME.height, FRAME.width / aspect) / 2;
    camera.left = -halfH * aspect;
    camera.right = halfH * aspect;
    camera.top = halfH;
    camera.bottom = -halfH;
    camera.updateProjectionMatrix();
    rect = null;
    if (reduced) render(0);
  };
  const resizes = new ResizeObserver(resize);
  resizes.observe(canvas);

  const render = (dt: number) => {
    if (!reduced) {
      advanceTweens(dt);
      for (const digit of digits) updateDigit(digit, dt);
      shelfThud = Math.max(0, shelfThud - dt * 2.5);
      shelf.position.y = -Math.sin(shelfThud * Math.PI * 4) * shelfThud * 0.25;
    }
    applyCat();

    if (pointer.active && !reduced) {
      const box = toNdc(pointer.x, pointer.y);
      if (box.width && box.height) cat.setPointer(ndc.x, ndc.y, box.width, box.height);
    }
    cat.update(dt, camera);
    // The rig rewrote the head from idle + cursor; lean that towards the scripted look.
    if (catPose.focus > 0) {
      head.rotation.y = lerp(head.rotation.y, headRest.y + catPose.lookYaw, catPose.focus);
      head.rotation.x = lerp(head.rotation.x, headRest.x + catPose.lookPitch, catPose.focus);
    }
    renderer.render(scene, camera);
  };

  const clock = new THREE.Clock();
  let visible = true;
  let looping = false;
  const sync = () => {
    const shouldLoop = visible && !document.hidden && !reduced;
    if (shouldLoop === looping) return;
    looping = shouldLoop;
    if (looping) {
      clock.getDelta();
      cat.resume();
      renderer.setAnimationLoop(() => render(Math.min(clock.getDelta(), 0.05)));
    } else {
      renderer.setAnimationLoop(null);
    }
  };
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    rect = null;
    sync();
  });
  intersection.observe(canvas);
  document.addEventListener('visibilitychange', sync);

  const restoreStatic = () => {
    generation += 1;
    tweens = [];
    hurry = null;
    Object.assign(catPose, {
      ...CAT_HOME,
      hop: 0,
      squash: 0,
      lean: 0,
      paw: 0,
      pawOut: 0,
      focus: 0,
      lookYaw: 0,
      lookPitch: 0,
    });
    for (const digit of digits) {
      digit.state = 'resting';
      digit.claimed = false;
      digit.group.visible = true;
      digit.group.position.copy(digit.home);
      digit.group.quaternion.identity();
      digit.group.scale.set(1, 1, 1);
    }
    shelf.position.y = 0;
    cat.reset();
    canvas.style.cursor = '';
    setStatus('playing');
  };

  resize();
  if (reduced) {
    restoreStatic();
    render(0);
  } else run(knockEverything);
  sync();

  return {
    setTheme(next) {
      theme = next;
      model.setTheme(next);
      shelfMaterials.top.color.set(palette().shelf);
      shelfMaterials.under.color.set(palette().shelfUnder);
      shelfMaterials.base.color.set(palette().shelfBase);
      shelfBase.visible = next === 'light';
      digitMaterials.main.color.set(palette().digit);
      digitMaterials.alt.color.set(palette().digitAlt);
      if (!looping) render(0);
    },
    setReducedMotion(next) {
      if (next === reduced) return;
      reduced = next;
      restoreStatic();
      if (reduced) render(0);
      else run(knockEverything);
      sync();
    },
    rebuild() {
      if (reduced || anyStanding()) return;
      run(rebuildScript);
    },
    dispose() {
      generation += 1;
      renderer.setAnimationLoop(null);
      resizes.disconnect();
      intersection.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
      window.removeEventListener('scroll', remeasure, { capture: true });
      document.removeEventListener('visibilitychange', sync);
      model.dispose();
      for (const geometry of geometries) geometry.dispose();
      for (const material of [...Object.values(shelfMaterials), ...Object.values(digitMaterials)]) material.dispose();
      renderer.dispose();
    },
  };
}
