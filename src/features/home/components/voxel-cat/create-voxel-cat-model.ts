import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/**
 * The unit is one "block"; ground is y = 0, +Y is up, +Z is the direction the cat faces, +X is
 * its own left. Every mobile part hangs off a pivot group whose origin sits on the joint, so
 * rotating a joint needs no extra offsets.
 */

/** `ear`/`tail` are split from `coat` because a colourpoint darkens them while a tabby doesn't. */
const COAT = 'coat';
const COAT_SHADE = 'coat-shade';
const EAR = 'ear';
const TAIL = 'tail';
const TAIL_SHADE = 'tail-shade';
const POINT = 'point';
const BELLY = 'belly';
const WHISKER = 'whisker';
const SEAL = 'seal';
const EYE = 'eye';
const SKIN = 'skin';
const EAR_INNER = 'ear-inner';

type PaletteKey =
  | typeof COAT
  | typeof COAT_SHADE
  | typeof EAR
  | typeof TAIL
  | typeof TAIL_SHADE
  | typeof POINT
  | typeof BELLY
  | typeof WHISKER
  | typeof SEAL
  | typeof EYE
  | typeof SKIN
  | typeof EAR_INNER;

export type VoxelCatPalette = Record<PaletteKey, string>;

export const VOXEL_CAT_PALETTES = {
  light: {
    [COAT]: '#ed8c20',
    [COAT_SHADE]: '#dd6d20',
    [EAR]: '#ed8c20',
    [TAIL]: '#ed8c20',
    [TAIL_SHADE]: '#dd6d20',
    [POINT]: '#ffffff',
    [BELLY]: '#ffffff',
    [WHISKER]: '#ffffff',
    // Unused: the gradient is off in this coat.
    [SEAL]: '#dd6d20',
    [EYE]: '#0d0d0d',
    [SKIN]: '#f69caa',
    [EAR_INNER]: '#f69caa',
  },
  // Every fur role is the same cream; the point gradient alone darkens the extremities.
  dark: {
    [COAT]: '#ddd0b8',
    [COAT_SHADE]: '#ddd0b8',
    [EAR]: '#3f2c22',
    [TAIL]: '#ddd0b8',
    [TAIL_SHADE]: '#ddd0b8',
    [POINT]: '#ddd0b8',
    [BELLY]: '#efe7d6',
    [WHISKER]: '#f5eee0',
    [SEAL]: '#3f2c22',
    [EYE]: '#00ade1',
    [SKIN]: '#6f5a50',
    [EAR_INNER]: '#ae8b7b',
  },
} satisfies Record<string, VoxelCatPalette>;

export type VoxelCatTheme = keyof typeof VOXEL_CAT_PALETTES;

/** A part positioned by its centre, in world blocks. Zero depth makes a flat marking. */
type BoxPart = {
  id: string;
  material: PaletteKey;
  size: [number, number, number];
  center: [number, number, number];
};

/** A 2D polygon swept along one axis, for the parts that are not rectangles. */
type ExtrudePart = {
  id: string;
  material: PaletteKey;
  /** In the plane orthogonal to `axis`, in world blocks, wound counter-clockwise. */
  outline: [number, number][];
  hole?: [number, number][];
  axis: 'x' | 'z';
  /** Sweep extent along `axis`, in world blocks. */
  from: number;
  to: number;
};

/**
 * Every table below keeps its parts' world coordinates; they are rebased onto the pivot they
 * hang from at build time, so the numbers stay comparable with the measurements.
 */
const BODY_JOINT: [number, number, number] = [0, 0, 0];
const HEAD_JOINT: [number, number, number] = [0, 7.13, 3.48];
const HEAD_LIFT = 0.8;
const EAR_JOINT_L: [number, number, number] = [2.4, 12.05, 3.32];
const EAR_JOINT_R: [number, number, number] = [-2.4, 12.05, 3.32];
const LEG_JOINT_L: [number, number, number] = [2.3, 7.2, 3.75];
const LEG_JOINT_R: [number, number, number] = [-2.3, 7.2, 3.75];
const TAIL_JOINTS: [number, number, number][] = [
  [0, 0.85, -2.4],
  [0, 0.85, -4.05],
  [0, 0.85, -6.95],
  [0, 0.85, -9.95],
];
const TAIL_YAW: readonly [number, number, number, number] = [-0.35, -1, -0.85, -0.5];

/** Front profile in (x, y): three symmetric steps, half-widths 2.05 / 1.40 / 0.74. */
const BIB_OUTLINE: [number, number][] = [
  [2.05, 8.45],
  [2.05, 5.9],
  [1.4, 5.9],
  [1.4, 4.6],
  [0.74, 4.6],
  [0.74, 3.9],
  [-0.74, 3.9],
  [-0.74, 4.6],
  [-1.4, 4.6],
  [-1.4, 5.9],
  [-2.05, 5.9],
  [-2.05, 8.45],
];

/** In (x, y): vertical lateral leg, slanted medial leg. */
const EAR_OUTLINE: [number, number][] = [
  [1.3, 12.05],
  [3.5, 12.05],
  [3.5, 14.45],
  [2.3, 14.45],
];
const EAR_WINDOW: [number, number][] = [
  [1.85, 12.05],
  [2.95, 12.05],
  [2.95, 13.7],
  [2.54, 13.7],
];

// A reflection, not a rotation: the rewind is what keeps the swept faces outward-facing.
const mirrorX = (outline: [number, number][]): [number, number][] =>
  outline.map(([x, y]) => [-x, y] as [number, number]).reverse();

/** `whisker-l1` to `whisker-r1`: a trailing index comes along. */
const mirrorId = (id: string) => id.replace(/-l(\d*)$/, '-r$1');

const mirror = (part: BoxPart): BoxPart => ({
  ...part,
  id: mirrorId(part.id),
  center: [-part.center[0], part.center[1], part.center[2]],
});

const mirrorExtrude = (part: ExtrudePart): ExtrudePart => ({
  ...part,
  id: mirrorId(part.id),
  outline: mirrorX(part.outline),
  hole: part.hole && mirrorX(part.hole),
});

const mirrored = (parts: BoxPart[]): BoxPart[] => [...parts, ...parts.map(mirror)];

const BIB: ExtrudePart = {
  id: 'chest-bib',
  material: BELLY,
  outline: BIB_OUTLINE,
  axis: 'z',
  from: 4.4,
  to: 5.4,
};
const EAR_L: ExtrudePart = {
  id: 'ear-l',
  material: EAR,
  outline: EAR_OUTLINE,
  hole: EAR_WINDOW,
  axis: 'z',
  from: 2.84,
  to: 3.8,
};
const EAR_R: ExtrudePart = mirrorExtrude(EAR_L);
const EAR_INNER_L: ExtrudePart = {
  id: 'ear-inner-l',
  material: EAR_INNER,
  outline: EAR_WINDOW,
  axis: 'z',
  from: 2.96,
  to: 3.85,
};
const EAR_INNER_R: ExtrudePart = mirrorExtrude(EAR_INNER_L);

/**
 * The trunk is split into three so the front-bottom-centre is a real recess: a full-width rear
 * mass plus a chest split left/right, leaving a channel for the belly panel and bib. Shared
 * faces are offset ~0.1 to interpenetrate rather than sit coplanar, which z-fights.
 */
const TORSO_BOXES: BoxPart[] = [
  { id: 'body-rear', material: COAT, size: [6.6, 6.3, 4.0], center: [0, 3.15, 0.4] },
  { id: 'belly-panel', material: BELLY, size: [3.0, 4.8, 2.4], center: [0, 2.4, 2.8] },
  ...mirrored([{ id: 'hind-leg-l', material: COAT, size: [2.0, 4.6, 4.5], center: [3.25, 2.3, 0.9] }]),
  ...mirrored([{ id: 'hind-paw-l', material: POINT, size: [1.95, 1.5, 2.9], center: [3.5, 0.75, 2.65] }]),
];

/** Membership here is what makes a block breathe. */
const CHEST_BOXES: BoxPart[] = [
  { id: 'body-neck', material: COAT, size: [4.5, 2.35, 3.45], center: [0, 7.25, 2.85] },
  // Recessed behind the stationary front legs, which it reaches at z=5.0674 at full inhalation.
  ...mirrored([{ id: 'body-chest-l', material: COAT, size: [2.05, 5.0, 3.1], center: [2.275, 5.1, 3.35] }]),
];

/** On the body root, outside the torso's narrowing, so it stays with the tail it overlaps. */
const TAILBONE_BOXES: BoxPart[] = [{ id: 'tailbone', material: COAT, size: [1.5, 1.7, 1.5], center: [0, 1.05, -1.8] }];

const HEAD_BOXES: BoxPart[] = [
  { id: 'head', material: COAT, size: [7.0, 5.14, 5.0], center: [0, 9.6, 3.48] },
  { id: 'muzzle', material: POINT, size: [3.05, 2.0, 0.95], center: [0, 8.45, 6.35] },
  { id: 'nose', material: SKIN, size: [1.1, 0.95, 0.06], center: [0, 8.96, 6.85] },
  ...mirrored([
    { id: 'whisker-l1', material: WHISKER, size: [2.4, 0.28, 0.28], center: [3.1, 8.88, 6.04] },
    { id: 'whisker-l2', material: WHISKER, size: [2.4, 0.28, 0.28], center: [3.1, 7.9, 6.04] },
  ]),
];

const EYE_L: BoxPart = { id: 'eye-l', material: EYE, size: [1.3, 1.29, 0.1], center: [1.57, 10.355, 6.03] };
// The glint sits in a different cell of each eye so both land on the same world side: taken
// from the reference, not a mirroring bug, which is why the cells are not reflected.
const EYE_BOXES_L: BoxPart[] = [
  EYE_L,
  { id: 'eye-cell-upper-lateral', material: WHISKER, size: [0.65, 0.65, 0], center: [1.895, 10.675, 6.081] },
];
const EYE_BOXES_R: BoxPart[] = [
  mirror(EYE_L),
  { id: 'eye-cell-upper-medial', material: WHISKER, size: [0.65, 0.65, 0], center: [-1.245, 10.675, 6.081] },
];

// Front and outer faces sit slightly ahead of the chest, so their stripes are never coplanar.
const LEG_BOXES_L: BoxPart[] = [
  { id: 'front-leg-l', material: COAT, size: [2.15, 6.15, 2.65], center: [2.25, 4.325, 3.8] },
  { id: 'front-paw-l', material: POINT, size: [2.4, 1.5, 3.0], center: [2.3, 0.75, 4.8] },
];
const LEG_BOXES_R: BoxPart[] = LEG_BOXES_L.map(mirror);

const TAIL_BOXES: BoxPart[] = [
  { id: 'tail-base', material: TAIL, size: [1.7, 1.7, 1.7], center: [0, 0.85, -3.225] },
  { id: 'tail-mid', material: TAIL, size: [1.7, 1.7, 2.95], center: [0, 0.85, -5.5] },
  { id: 'tail-mid-2', material: TAIL, size: [1.7, 1.7, 3.05], center: [0, 0.85, -8.45] },
  { id: 'tail-tip', material: POINT, size: [1.7, 1.7, 2.0], center: [0, 0.85, -10.925] },
];

/**
 * World z where each link's dark band ends; null for the white tip. A striped link is two
 * mitred boxes meeting on this plane rather than one box wearing a plate, because the links
 * are re-cut every frame and a rigid plate could not follow a cut that moves.
 */
const TAIL_BANDS: readonly (number | null)[] = [-3.225, -5.5, -8.45, null];

/**
 * Stripes are modelled, not painted: a zone is an axis-aligned box, clipped at build time to
 * the part it marks and laid on it as a thin plate.
 */
type StripeZone = { min: [number, number, number]; max: [number, number, number] };

/** Wider than any part, so a zone can be left open on an axis and clip to the block itself. */
const OPEN = 99;
/** How far a plate stands off the surface it marks: clear of the chamfer, sub-pixel on screen. */
const STRIPE_PROUD = 0.04;
/** Authored insets are never finer than 0.05, so this only absorbs arithmetic on a shared edge. */
const STRIPE_EPSILON = 1e-6;
const yBand = (from: number, to: number): StripeZone => ({
  min: [-OPEN, from, -OPEN],
  max: [OPEN, to, OPEN],
});
const zBand = (from: number, to: number): StripeZone => ({
  min: [-OPEN, -OPEN, from],
  max: [OPEN, OPEN, to],
});
/** Up-face only: starting a chamfer's width below `top` takes the rounded rim along with it. */
const topBandX = (top: number, from: number, to: number): StripeZone => ({
  min: [from, top - 0.05, -OPEN],
  max: [to, OPEN, OPEN],
});
/**
 * Wraps one vertical corner instead of ringing the part: bounded on BOTH horizontal axes, so
 * it takes a slice of each of the two faces meeting at that corner and stops.
 */
const cornerBand = (from: number, to: number, x: [number, number], z: [number, number]): StripeZone => ({
  min: [x[0], from, z[0]],
  max: [x[1], to, z[1]],
});
/** `topBandX` the other way round: across the part, bounded along its depth. */
const topBandZ = (top: number, from: number, to: number): StripeZone => ({
  min: [-OPEN, top - 0.05, from],
  max: [OPEN, OPEN, to],
});

/** Markings shade the coat, except the tailbone's: that one opens the tail's own run. */
const STRIPE_ROLES: Record<string, PaletteKey> = { tailbone: TAIL_SHADE };

const mirrorZone = (zone: StripeZone): StripeZone => ({
  min: [-zone.max[0], zone.min[1], zone.min[2]],
  max: [-zone.min[0], zone.max[1], zone.max[2]],
});

/** Aligned with the rump rings, so thigh and flank read as one band. */
const HIND_THIGH_BANDS = [
  cornerBand(1.2, 2.05, [3.4, OPEN], [-OPEN, 0.6]),
  cornerBand(2.95, 3.8, [3.4, OPEN], [-OPEN, 0.6]),
];

const FRONT_LEG_PATCHES = [
  cornerBand(2.2, 3.05, [2.7, OPEN], [4.35, OPEN]),
  cornerBand(3.65, 4.5, [2.7, OPEN], [4.35, OPEN]),
];

const STRIPES: Record<string, StripeZone[]> = {
  // Brow to nape, just inside the ears: along the skull's 5-block depth, not across it.
  head: [topBandX(12.17, -1.35, -0.5), topBandX(12.17, 0.5, 1.35)],
  'body-rear': [yBand(1.2, 2.05), yBand(2.95, 3.8), topBandZ(6.3, -1.05, -0.15)],
  'hind-leg-l': HIND_THIGH_BANDS,
  'hind-leg-r': HIND_THIGH_BANDS.map(mirrorZone),
  'front-leg-l': FRONT_LEG_PATCHES,
  'front-leg-r': FRONT_LEG_PATCHES.map(mirrorZone),
  // The first band of the tail's alternating run; the links themselves are split, not plated.
  tailbone: [zBand(-2.55, -1.9)],
};

/**
 * A colourpoint is a gradient, not a pattern. Each entry is a place the points take over
 * completely out to `full` blocks from its centre, releasing the coat again by `fade`.
 */
const POINT_FIELD = [
  { at: [0, 9.2, 6.4], full: 1.9, fade: 4.2 }, // the mask, measured from the bridge of the nose
  { at: [2.3, 0.4, 4.8], full: 1.6, fade: 3.9 }, // front feet, fading out around the elbow
  { at: [-2.3, 0.4, 4.8], full: 1.6, fade: 3.9 },
  { at: [3.5, 0.4, 2.65], full: 1.6, fade: 3.3 }, // hind feet, held off the haunch above them
  { at: [-3.5, 0.4, 2.65], full: 1.6, fade: 3.3 },
  { at: [0, 0.85, -2.4], full: 0.8, fade: 2.8 }, // where the tail leaves the rump
].map(({ at, full, fade }) => ({ at: new THREE.Vector3(...at), full, fade }));

/**
 * The tail is measured along itself rather than by the field above: it curls a long way out to
 * one side, so a radius wide enough to darken its tip would swallow the haunch with it.
 */
const TAIL_ROOT = new THREE.Vector3(0, 0.85, -2.4);
const TAIL_POINT = { full: 0.4, fade: 2.6 };

const POINT_BLEND: Record<VoxelCatTheme, number> = { light: 0, dark: 1 };

/** The ears are left out deliberately: a colourpoint's are solid dark rather than graded. */
const GRADIENT_ROLES: PaletteKey[] = [COAT, COAT_SHADE, TAIL, TAIL_SHADE, POINT];

/** 1 deep along the tail, 0 where it leaves the rump. */
const tailPointness = (at: THREE.Vector3) =>
  THREE.MathUtils.smoothstep(at.distanceTo(TAIL_ROOT), TAIL_POINT.full, TAIL_POINT.fade);

export type VoxelCatOptions = {
  theme?: VoxelCatTheme;
};

/**
 * Edge chamfer in blocks, clamped per part to 40% of its smallest dimension so the 0.06-block
 * nose and the eye plates do not collapse.
 */
const CHAMFER = 0.018;

/** Only the pivots something actually animates. Rest bends live on their groups, unnamed. */
export type VoxelCatJoints = {
  chest: THREE.Group;
  eyeL: THREE.Group;
  eyeR: THREE.Group;
  head: THREE.Group;
  earL: THREE.Group;
  earR: THREE.Group;
  /** Each link is a child of the previous one. */
  tail2: THREE.Group;
  tail3: THREE.Group;
  tail4: THREE.Group;
};

export type VoxelCatModel = {
  group: THREE.Group;
  joints: VoxelCatJoints;
  parts: Record<string, THREE.Mesh>;
  /** No geometry, pose or material identity changes, so nothing recompiles. */
  setTheme: (theme: VoxelCatTheme) => void;
  dispose: () => void;
};

const FINISH: Record<PaletteKey, number> = {
  [COAT]: 0.7,
  [COAT_SHADE]: 0.7,
  [EAR]: 0.7,
  [TAIL]: 0.7,
  [TAIL_SHADE]: 0.7,
  [POINT]: 0.72,
  [BELLY]: 0.72,
  [WHISKER]: 0.72,
  [SEAL]: 0.7,
  [EYE]: 0.55,
  [SKIN]: 0.72,
  [EAR_INNER]: 0.72,
};

function makeMaterials(palette: VoxelCatPalette): Record<PaletteKey, THREE.MeshStandardMaterial> {
  const roles = Object.keys(FINISH) as PaletteKey[];
  return Object.fromEntries(
    roles.map((role) => [
      role,
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(palette[role]),
        roughness: FINISH[role],
        metalness: 0,
        name: `voxel-cat-${role}`,
      }),
    ]),
  ) as Record<PaletteKey, THREE.MeshStandardMaterial>;
}

/** Mix the fur towards the point colour by the baked per-vertex field. */
function applyPointGradient(
  materials: Record<PaletteKey, THREE.MeshStandardMaterial>,
  color: { value: THREE.Color },
  blend: { value: number },
) {
  const at = { value: POINT_FIELD.map((zone) => zone.at) };
  const range = { value: POINT_FIELD.map((zone) => new THREE.Vector2(zone.full, zone.fade)) };
  for (const role of GRADIENT_ROLES) {
    const material = materials[role];
    material.onBeforeCompile = (shader) => {
      // Shared uniform objects, so a later repaint reaches a program compiled before it.
      shader.uniforms.uPointColor = color;
      shader.uniforms.uPointBlend = blend;
      shader.uniforms.uPointAt = at;
      shader.uniforms.uPointRange = range;
      // The rest position rides along as a varying, so the field is evaluated per fragment:
      // sampled at box corners instead, a 7 x 5 head could not hold a mask.
      shader.vertexShader =
        `attribute vec3 aBlock;\nattribute float aPoint;\nvarying vec3 vBlock;\nvarying float vPoint;\n${shader.vertexShader}`.replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\n\tvBlock = aBlock;\n\tvPoint = aPoint;',
        );
      // After <color_fragment> diffuseColor is the final albedo and nothing has been lit yet,
      // so mixing here leaves shading, shadows and tone mapping to do their usual work.
      shader.fragmentShader = `uniform vec3 uPointColor;
uniform float uPointBlend;
uniform vec3 uPointAt[${POINT_FIELD.length}];
uniform vec2 uPointRange[${POINT_FIELD.length}];
varying vec3 vBlock;
varying float vPoint;
${shader.fragmentShader}`.replace(
        '#include <color_fragment>',
        `#include <color_fragment>
\tfloat point = vPoint;
\tfor (int i = 0; i < ${POINT_FIELD.length}; i++) {
\t\tpoint = max(point, 1.0 - smoothstep(uPointRange[i].x, uPointRange[i].y, distance(vBlock, uPointAt[i])));
\t}
\tdiffuseColor.rgb = mix(diffuseColor.rgb, uPointColor, point * uPointBlend);`,
      );
    };
    material.customProgramCacheKey = () => 'voxel-cat-point';
  }
}

/**
 * Measure every vertex where its part actually rests — the tail's bends and the torso's squash
 * included — rather than where its table entry put it, and store it as an attribute.
 */
function bakePointField(group: THREE.Group, parts: Record<string, THREE.Mesh>, gradient: ReadonlySet<string>) {
  group.updateMatrixWorld(true);
  const toRoot = new THREE.Matrix4();
  const rootInverse = new THREE.Matrix4().copy(group.matrixWorld).invert();
  const vertex = new THREE.Vector3();
  for (const [id, mesh] of Object.entries(parts)) {
    // Only the fur shaders declare these attributes; anywhere else they are dead weight.
    if (!gradient.has(id)) continue;
    const positions = mesh.geometry.getAttribute('position');
    const block = new Float32Array(positions.count * 3);
    const tail = new Float32Array(positions.count);
    toRoot.multiplyMatrices(rootInverse, mesh.matrixWorld);
    const onTail = id.startsWith('tail');
    for (let index = 0; index < positions.count; index++) {
      vertex.fromBufferAttribute(positions, index).applyMatrix4(toRoot);
      vertex.toArray(block, index * 3);
      if (onTail) tail[index] = tailPointness(vertex);
    }
    mesh.geometry.setAttribute('aBlock', new THREE.BufferAttribute(block, 3));
    mesh.geometry.setAttribute('aPoint', new THREE.BufferAttribute(tail, 1));
  }
}

function boxGeometry(size: [number, number, number]): THREE.BufferGeometry {
  const [w, h, d] = size;
  if (d === 0) return new THREE.PlaneGeometry(w, h);
  const radius = Math.min(CHAMFER, Math.min(w, h, d) * 0.4);
  if (radius <= 1e-4) return new THREE.BoxGeometry(w, h, d);
  return new RoundedBoxGeometry(w, h, d, 1, radius);
}

type TailSegment = {
  id: string;
  material: PaletteKey;
  /** World z of the face nearer the body, and of the face further from it. */
  start: number;
  end: number;
  startSlope: number;
  endSlope: number;
  /** The face an animated joint sweeps: the root never moves and the tip has no joint. */
  mitre: 'start' | 'end' | 'none';
};

/**
 * A striped link is cut in two at the far edge of its dark band, leaving each piece one moving
 * end and the marking boundary on a shared internal plane that never depth-fights itself.
 */
function tailSegments(link: number): TailSegment[] {
  const part = TAIL_BOXES[link];
  const next = TAIL_JOINTS[link + 1];
  const start = link === 0 ? part.center[2] + part.size[2] / 2 : TAIL_JOINTS[link][2];
  const end = next ? next[2] : part.center[2] - part.size[2] / 2;
  const startSlope = link === 0 ? 0 : Math.tan(TAIL_YAW[link] / 2);
  const endSlope = next ? -Math.tan(TAIL_YAW[link + 1] / 2) : 0;
  // tail1 carries the first rest bend but is never animated, so link 0's start is fixed.
  const startMitre = link === 0 ? 'none' : 'start';
  const band = TAIL_BANDS[link];
  if (band === null) {
    return [{ id: part.id, material: part.material, start, end, startSlope, endSlope, mitre: startMitre }];
  }
  return [
    { id: `${part.id}-band`, material: TAIL_SHADE, start, end: band, startSlope, endSlope: 0, mitre: startMitre },
    { id: part.id, material: part.material, start: band, end, startSlope: 0, endSlope, mitre: 'end' },
  ];
}

/** Miter the resting tail bends so adjacent top faces meet without gaps or overlaps. */
function tailGeometry(segment: TailSegment, size: readonly [number, number, number], centerZ: number) {
  // No bevel at internal seams: rounding both ends would reintroduce the groove the mitre closes.
  const geometry = new THREE.BoxGeometry(size[0], size[1], segment.start - segment.end);
  const positions = geometry.getAttribute('position');
  // Lever arm of the mitred face, zero elsewhere, so the rig sweeps that face alone.
  const mitre = new Float32Array(positions.count);
  for (let i = 0; i < positions.count; i++) {
    const isStart = positions.getZ(i) > 0;
    const x = positions.getX(i);
    const z = (isStart ? segment.start : segment.end) + x * (isStart ? segment.startSlope : segment.endSlope);
    positions.setZ(i, z - centerZ);
    if (segment.mitre === (isStart ? 'start' : 'end')) mitre[i] = x;
  }
  geometry.userData.tailMitre = mitre;
  geometry.computeVertexNormals();
  // No bounding volumes: the rig rewrites these vertices every frame, so a cached bound would
  // only ever be wrong.
  return geometry;
}

function extrudeGeometry(part: ExtrudePart): THREE.BufferGeometry {
  const span = part.to - part.from;
  // bevelOffset = -bevelSize keeps the outline itself at its authored dimensions.
  const radius = Math.min(CHAMFER, span * 0.4);
  const corners = (outline: [number, number][]) => outline.map(([x, y]) => new THREE.Vector2(x, y));
  const shape = new THREE.Shape(corners(part.outline));
  shape.closePath();
  if (part.hole) {
    const path = new THREE.Path(corners(part.hole));
    path.closePath();
    shape.holes.push(path);
  }
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: span - 2 * radius,
    steps: 1,
    bevelEnabled: radius > 1e-4,
    bevelSegments: 1,
    bevelSize: radius,
    bevelOffset: -radius,
    bevelThickness: radius,
  });
  // The geometry runs from -radius to span - radius along local +Z, so only that axis needs placing.
  geometry.translate(0, 0, part.from + radius);
  if (part.axis === 'x') geometry.rotateY(Math.PI / 2);
  return geometry;
}

export function createVoxelCatModel(options: VoxelCatOptions = {}): VoxelCatModel {
  const { theme = 'light' } = options;
  const materials = makeMaterials(VOXEL_CAT_PALETTES[theme]);
  const pointColor = { value: new THREE.Color() };
  const pointBlend = { value: 0 };
  applyPointGradient(materials, pointColor, pointBlend);
  const stripes: THREE.Mesh[] = [];
  const parts: Record<string, THREE.Mesh> = {};
  const geometries: THREE.BufferGeometry[] = [];
  /** Ids needing the baked field attributes. */
  const gradient = new Set<string>();

  /** Both positions are world-space; the group carries the difference. */
  const joint = (
    name: string,
    at: readonly [number, number, number],
    parent: THREE.Object3D,
    parentAt: readonly [number, number, number],
  ) => {
    const group = new THREE.Group();
    group.name = name;
    group.position.set(at[0] - parentAt[0], at[1] - parentAt[1], at[2] - parentAt[2]);
    parent.add(group);
    return group;
  };

  const addMesh = (
    geometry: THREE.BufferGeometry,
    id: string,
    material: PaletteKey,
    parent: THREE.Object3D,
    origin: readonly [number, number, number],
    center: readonly [number, number, number] = [0, 0, 0],
  ) => {
    geometries.push(geometry);
    const mesh = new THREE.Mesh(geometry, materials[material]);
    mesh.name = id;
    // Rebase the world-anchored `center` onto the pivot this part hangs from.
    mesh.position.set(center[0] - origin[0], center[1] - origin[1], center[2] - origin[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (GRADIENT_ROLES.includes(material)) gradient.add(id);
    parent.add(mesh);
    parts[id] = mesh;
    return mesh;
  };

  /** Clips a zone to the part it marks, and lifts the plate off whichever faces did the clipping. */
  const addStripe = (
    part: BoxPart,
    zone: StripeZone,
    index: number,
    parent: THREE.Object3D,
    origin: readonly [number, number, number],
  ) => {
    const size: [number, number, number] = [0, 0, 0];
    const center: [number, number, number] = [0, 0, 0];
    for (let axis = 0; axis < 3; axis++) {
      const low = part.center[axis] - part.size[axis] / 2;
      const high = part.center[axis] + part.size[axis] / 2;
      const min = zone.min[axis] > low + STRIPE_EPSILON ? zone.min[axis] : low - STRIPE_PROUD;
      const max = zone.max[axis] < high - STRIPE_EPSILON ? zone.max[axis] : high + STRIPE_PROUD;
      if (max <= min) return;
      size[axis] = max - min;
      center[axis] = (min + max) / 2;
    }
    const role = STRIPE_ROLES[part.id] ?? COAT_SHADE;
    const mesh = addMesh(boxGeometry(size), `${part.id}-stripe-${index}`, role, parent, origin, center);
    // The block underneath already casts this silhouette; a second caster only risks acne.
    mesh.castShadow = false;
    stripes.push(mesh);
  };

  const addBox = (part: BoxPart, parent: THREE.Object3D, origin: readonly [number, number, number]) => {
    const mesh = addMesh(boxGeometry(part.size), part.id, part.material, parent, origin, part.center);
    // A flat marking shares its block's silhouette and should not cast a raised edge.
    if (part.size[2] === 0) mesh.castShadow = false;
    STRIPES[part.id]?.forEach((zone, index) => addStripe(part, zone, index, parent, origin));
    return mesh;
  };

  const addTail = (link: number, parent: THREE.Object3D, origin: readonly [number, number, number]) => {
    const { size, center: authored } = TAIL_BOXES[link];
    for (const segment of tailSegments(link)) {
      const center: [number, number, number] = [0, authored[1], (segment.start + segment.end) / 2];
      const mesh = addMesh(
        tailGeometry(segment, size, center[2]),
        segment.id,
        segment.material,
        parent,
        origin,
        center,
      );
      // The rig sweeps the mitred faces every frame, so no cached bound stays true.
      mesh.frustumCulled = false;
    }
  };

  const addExtrude = (part: ExtrudePart, parent: THREE.Object3D, origin: readonly [number, number, number]) => {
    // Outline is already in world coordinates, so the geometry carries the placement.
    const geometry = extrudeGeometry(part);
    geometry.translate(-origin[0], -origin[1], -origin[2]);
    return addMesh(geometry, part.id, part.material, parent, origin, origin);
  };

  const setTheme = (next: VoxelCatTheme) => {
    const palette = VOXEL_CAT_PALETTES[next];
    for (const [role, material] of Object.entries(materials)) material.color.set(palette[role as PaletteKey]);
    pointColor.value.set(palette[SEAL]);
    pointBlend.value = POINT_BLEND[next];
    // A colourpoint has no striping, so the plates go away whole rather than change colour.
    for (const mesh of stripes) mesh.visible = next === 'light';
  };

  const group = new THREE.Group();
  group.name = 'voxel-cat';

  const body = joint('voxel-cat-body', BODY_JOINT, group, BODY_JOINT);
  // Narrows torso and limbs together; head and tail keep their proportions outside this group.
  const torso = joint('voxel-cat-torso', BODY_JOINT, body, BODY_JOINT);
  torso.scale.set(0.9, 1, 0.95);
  const chestAt: [number, number, number] = [0, 6.1, 1.8];
  const chest = joint('voxel-cat-chest', chestAt, torso, BODY_JOINT);
  addExtrude(BIB, chest, chestAt);
  for (const part of TORSO_BOXES) addBox(part, torso, BODY_JOINT);
  for (const part of CHEST_BOXES) addBox(part, chest, chestAt);
  for (const part of TAILBONE_BOXES) addBox(part, body, BODY_JOINT);

  const head = joint('voxel-cat-head', HEAD_JOINT, body, BODY_JOINT);
  head.position.y += HEAD_LIFT;
  head.rotation.order = 'YXZ';
  const eyeAtL: [number, number, number] = [1.57, 10.355, 6.03];
  const eyeAtR: [number, number, number] = [-1.57, 10.355, 6.03];
  const eyeL = joint('voxel-cat-eye-l', eyeAtL, head, HEAD_JOINT);
  const eyeR = joint('voxel-cat-eye-r', eyeAtR, head, HEAD_JOINT);
  for (const part of HEAD_BOXES) addBox(part, head, HEAD_JOINT);
  for (const part of EYE_BOXES_L) addBox(part, eyeL, eyeAtL);
  for (const part of EYE_BOXES_R) addBox(part, eyeR, eyeAtR);

  const earL = joint('voxel-cat-ear-l', EAR_JOINT_L, head, HEAD_JOINT);
  addExtrude(EAR_L, earL, EAR_JOINT_L);
  addExtrude(EAR_INNER_L, earL, EAR_JOINT_L);
  const earR = joint('voxel-cat-ear-r', EAR_JOINT_R, head, HEAD_JOINT);
  addExtrude(EAR_R, earR, EAR_JOINT_R);
  addExtrude(EAR_INNER_R, earR, EAR_JOINT_R);

  const frontLegL = joint('voxel-cat-front-leg-l', LEG_JOINT_L, torso, BODY_JOINT);
  for (const part of LEG_BOXES_L) addBox(part, frontLegL, LEG_JOINT_L);
  const frontLegR = joint('voxel-cat-front-leg-r', LEG_JOINT_R, torso, BODY_JOINT);
  for (const part of LEG_BOXES_R) addBox(part, frontLegR, LEG_JOINT_R);

  // The chain is authored straight; TAIL_YAW lays it beside the haunch, and the rig reads each
  // link's rest rotation back off its group to sway around it.
  const links: THREE.Group[] = [];
  for (const [link, at] of TAIL_JOINTS.entries()) {
    const pivot = joint(`voxel-cat-tail-${link + 1}`, at, links[link - 1] ?? body, TAIL_JOINTS[link - 1] ?? BODY_JOINT);
    pivot.rotation.y = TAIL_YAW[link];
    addTail(link, pivot, at);
    links.push(pivot);
  }
  // The root link carries its rest bend but is never animated; the rig writes links 2 to 4.
  const [, tail2, tail3, tail4] = links;

  bakePointField(group, parts, gradient);
  // The colours are already right; this is what sets the gradient and the stripe plates.
  setTheme(theme);

  return {
    group,
    joints: { chest, eyeL, eyeR, head, earL, earR, tail2, tail3, tail4 },
    parts,
    setTheme,
    dispose: () => {
      for (const geometry of geometries) geometry.dispose();
      for (const material of Object.values(materials)) material.dispose();
    },
  };
}
