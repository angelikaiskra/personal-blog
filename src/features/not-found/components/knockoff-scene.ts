import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { createCatDriver } from '@/features/home/components/voxel-cat/cat-driver';
import { createVoxelCatModel, type VoxelCatTheme } from '@/features/home/components/voxel-cat/create-voxel-cat-model';
import { createCatScript } from './knockoff-cat-script';
import { createDigits, isStanding, restDigit, SHELF, shove, updateDigit } from './knockoff-digits';

/**
 * 404 scene: the voxel cat sits on a shelf next to a blocky "404" and, being a cat, knocks
 * each digit off the edge, one tap-tap-shove at a time. Visitors can shove digits themselves
 * or click the cat to hurry it along. This module owns the renderer, input and frame loop;
 * the digits and the cat's choreography live beside it.
 */

export type KnockoffStatus = 'playing' | 'empty' | 'rebuilding';

export type KnockoffSceneOptions = {
  canvas: HTMLCanvasElement;
  theme: VoxelCatTheme;
  /** Static scene, no choreography and no idle animation. */
  reducedMotion?: boolean;
  onStatusChange?: (status: KnockoffStatus) => void;
};

export type KnockoffScene = {
  setTheme: (theme: VoxelCatTheme) => void;
  setReducedMotion: (reduced: boolean) => void;
  rebuild: () => void;
  dispose: () => void;
};

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
/** Below the `sm` breakpoint the canvas is full-bleed: crop to just inside the shelf so it runs edge to edge. */
const COMPACT_FRAME = { width: 43, height: 27 };
const COMPACT_BELOW = 640;
/** Extra reach for fingers, in CSS pixels, when a tap lands just beside a block or the cat. */
const TOUCH_SLOP = 14;
/** Just below the canvas, where the status line and its "Put it back" button sit. */
const BUTTON_SPOT = new THREE.Vector3(LOOK_AT.x, -16, 8);

const lerp = THREE.MathUtils.lerp;

export function createKnockoffScene(options: KnockoffSceneOptions): KnockoffScene {
  const { canvas, onStatusChange } = options;
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

  /** One material per palette colour; `paint` recolours them all for the current theme. */
  const materials = {
    shelf: new THREE.MeshStandardMaterial({ roughness: 0.75 }),
    shelfUnder: new THREE.MeshStandardMaterial({ roughness: 0.8 }),
    shelfBase: new THREE.MeshStandardMaterial({ roughness: 0.85 }),
    digit: new THREE.MeshStandardMaterial({ roughness: 0.7 }),
    digitAlt: new THREE.MeshStandardMaterial({ roughness: 0.7 }),
  };

  /* Shelf: three stacked slabs, the site's 3D button turned into furniture. */
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
  slab(SHELF.top, -SHELF.top / 2, materials.shelf, 0);
  slab(SHELF.under, -SHELF.top - SHELF.under / 2 + 0.05, materials.shelfUnder, 0.01);
  const shelfBase = slab(SHELF.base, -SHELF.top - SHELF.under - SHELF.base / 2 + 0.1, materials.shelfBase, 0.02);
  scene.add(shelf);
  /** Shelf vibration left over from a digit landing hard on it. */
  let shelfThud = 0;

  const paint = () => {
    const palette = SCENE_PALETTES[theme];
    for (const name of Object.keys(materials) as (keyof typeof materials)[]) materials[name].color.set(palette[name]);
    // Like the site's buttons, the darkest layer only shows in the light theme.
    shelfBase.visible = theme === 'light';
  };
  paint();

  const { digits, geometry: voxelGeometry } = createDigits({ main: materials.digit, alt: materials.digitAlt });
  geometries.push(voxelGeometry);
  for (const digit of digits) scene.add(digit.group);

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

  let status: KnockoffStatus = 'playing';
  const setStatus = (next: KnockoffStatus) => {
    if (next === status) return;
    status = next;
    // Once the shelf is empty there is nothing left to click on the canvas.
    if (next === 'empty') canvas.style.cursor = '';
    onStatusChange?.(next);
  };

  const script = createCatScript({ digits, buttonSpot: BUTTON_SPOT, setStatus });
  const pose = script.pose;
  const applyCat = () => {
    catRoot.position.set(pose.x, pose.hop, pose.z);
    catRoot.rotation.set(pose.lean, pose.yaw, 0, 'YXZ');
    catRoot.scale.set(1 + pose.squash * 0.5, 1 - pose.squash, 1 + pose.squash * 0.5);
    pawL.rotation.set(pawRest.x + pose.paw, pawRest.y, pawRest.z + pose.pawOut);
  };
  applyCat();

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

  const pickAt = (clientX: number, clientY: number) => {
    toNdc(clientX, clientY);
    raycaster.setFromCamera(ndc, camera);
    const standing = digits.filter(isStanding).flatMap((d) => d.meshes);
    const hit = raycaster.intersectObjects([...standing, ...catMeshes], false)[0];
    if (!hit) return null;
    const index = hit.object.userData.digit as number | undefined;
    return index === undefined ? ({ kind: 'cat' } as const) : ({ kind: 'digit', digit: digits[index] } as const);
  };
  /** Exact hit first; with `slop`, then a ring of points around it. */
  const pick = (clientX: number, clientY: number, slop = 0) => {
    const exact = pickAt(clientX, clientY);
    if (exact || !slop) return exact;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const near = pickAt(clientX + Math.cos(angle) * slop, clientY + Math.sin(angle) * slop);
      if (near) return near;
    }
    return null;
  };

  const onMove = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
    if (!reduced) canvas.style.cursor = status !== 'empty' && pick(event.clientX, event.clientY) ? 'pointer' : '';
  };
  const onLeave = () => {
    pointer.active = false;
    cat.clearPointer();
  };
  const onDown = (event: PointerEvent) => {
    if (reduced) return;
    const target = pick(event.clientX, event.clientY, event.pointerType === 'touch' ? TOUCH_SLOP : 0);
    if (!target) return;
    if (target.kind === 'digit') shove(target.digit, 1.4);
    else script.hurry();
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
    const frame = width < COMPACT_BELOW ? COMPACT_FRAME : FRAME;
    const halfH = Math.max(frame.height, frame.width / aspect) / 2;
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
      script.update(dt);
      for (const digit of digits) if (updateDigit(digit, dt)) shelfThud = Math.max(shelfThud, 0.25);
      shelfThud = Math.max(0, shelfThud - dt * 2.5);
      shelf.position.y = -Math.sin(shelfThud * Math.PI * 4) * shelfThud * 0.25;
    }
    applyCat();

    // The cat only watches the cursor once its work is done; mid-routine it minds the digits.
    const gaze = script.gaze;
    if (pointer.active && !reduced && status === 'empty') {
      const box = toNdc(pointer.x, pointer.y);
      if (box.width && box.height) cat.setPointer(ndc.x, ndc.y, box.width, box.height);
    } else if (gaze && !reduced) cat.setGaze(gaze instanceof THREE.Vector3 ? gaze : gaze.group.position);
    else cat.clearPointer();
    cat.update(dt, camera);
    // The rig rewrote the head from idle + cursor; lean that towards the scripted look.
    if (pose.focus > 0) {
      head.rotation.y = lerp(head.rotation.y, headRest.y + pose.lookYaw, pose.focus);
      head.rotation.x = lerp(head.rotation.x, headRest.x + pose.lookPitch, pose.focus);
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
    script.reset();
    for (const digit of digits) restDigit(digit);
    shelf.position.y = 0;
    cat.reset();
    canvas.style.cursor = '';
    setStatus('playing');
  };

  resize();
  if (reduced) {
    restoreStatic();
    render(0);
  } else script.play();
  sync();

  return {
    setTheme(next) {
      theme = next;
      model.setTheme(next);
      paint();
      if (!looping) render(0);
    },
    setReducedMotion(next) {
      if (next === reduced) return;
      reduced = next;
      restoreStatic();
      if (reduced) render(0);
      else script.play();
      sync();
    },
    rebuild() {
      if (reduced || digits.some((d) => isStanding(d) || d.state === 'dropping')) return;
      script.rebuild();
    },
    dispose() {
      script.reset();
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
      for (const material of Object.values(materials)) material.dispose();
      renderer.dispose();
    },
  };
}
