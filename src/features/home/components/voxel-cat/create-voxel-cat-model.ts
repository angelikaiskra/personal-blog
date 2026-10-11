import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/**
 * Procedural voxel-art cat, rebuilt in code from the reference renders. The unit is one
 * "block"; ground is y = 0, +Y is up, +Z is the direction the cat faces, +X is its own left.
 * Every mobile part hangs off a named pivot group whose origin sits on the joint, so
 * rotating a joint does the right thing with no extra offsets.
 */

/**
 * Parts are painted by role, not colour, so the cat can wear a different coat per theme
 * without any block moving. `ear`/`tail` are split from `coat` because a colourpoint darkens
 * them while a tabby doesn't; `point` is the muzzle, paws and tail tip.
 */
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

/**
 * A coat per theme. The tabby is measured off the reference (coat rgb(240,141,25), marking
 * rgb(208,111,26)); the colourpoint is authored rather than measured, its points kept lighter
 * than a real seal's near-black so the cat keeps its silhouette against the dark theme's page.
 */
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
    // Unused while the gradient is off, which it always is in this coat.
    [SEAL]: '#dd6d20',
    [EYE]: '#0d0d0d',
    [SKIN]: '#f69caa',
    [EAR_INNER]: '#f69caa',
  },
  // Every fur role starts from the same cream; the point gradient darkens the extremities,
  // so none of these carry a brown of their own — that would reintroduce the edge it avoids.
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
    // Barely off the shell around it; any lighter and the ear reads as a notch in the head.
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

/** A part whose outline is not a rectangle: a 2D polygon swept along one axis. */
type ExtrudePart = {
  id: string;
  material: PaletteKey;
  /** Outline in the plane orthogonal to `axis`, in world blocks, wound counter-clockwise. */
  outline: [number, number][];
  /** Optional through-window, same winding rules. */
  hole?: [number, number][];
  axis: 'x' | 'z';
  /** Sweep extent along `axis`, in world blocks. */
  from: number;
  to: number;
};

/**
 * Parts are grouped by the pivot they hang from. `joint` is that pivot's world position;
 * children keep their world coordinates here and are rebased onto the joint at build time,
 * so the table stays directly comparable with the measurements.
 */
const BODY_JOINT: [number, number, number] = [0, 0, 0];
const HEAD_JOINT: [number, number, number] = [0, 7.13, 3.48];
// Lifts the whole head rig — pivot and ears included — above the shoulders.
const HEAD_LIFT = 0.8;
const EAR_JOINT_L: [number, number, number] = [2.4, 12.05, 3.32];
const EAR_JOINT_R: [number, number, number] = [-2.4, 12.05, 3.32];
const LEG_JOINT_L: [number, number, number] = [2.3, 7.2, 3.75];
const LEG_JOINT_R: [number, number, number] = [-2.3, 7.2, 3.75];
// The tail starts on the rear midline, extends behind the pelvis, then bends around it.
const TAIL_JOINT_1: [number, number, number] = [0, 0.85, -2.4];
const TAIL_JOINT_2: [number, number, number] = [0, 0.85, -4.05];
const TAIL_JOINT_3: [number, number, number] = [0, 0.85, -6.95];
const TAIL_JOINT_4: [number, number, number] = [0, 0.85, -9.95];
const TAIL_YAW: readonly [number, number, number, number] = [-0.35, -1, -0.85, -0.5];

const BIB_OUTLINE: [number, number][] = [
  // Front profile in (x, y): three symmetric steps, half-widths 2.05 / 1.40 / 0.74.
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

/** Ear plate outline in (x, y): vertical lateral leg, slanted medial leg (dx/dy -0.417). */
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

// A left/right pair is a reflection, not a rotation: negate x and rewind so the swept
// faces stay outward-facing on both sides.
const mirrorX = (outline: [number, number][]): [number, number][] =>
  outline.map(([x, y]) => [-x, y] as [number, number]).reverse();

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
const EAR_R: ExtrudePart = {
  id: 'ear-r',
  material: EAR,
  outline: mirrorX(EAR_OUTLINE),
  hole: mirrorX(EAR_WINDOW),
  axis: 'z',
  from: 2.84,
  to: 3.8,
};
const EAR_INNER_L: ExtrudePart = {
  id: 'ear-inner-l',
  material: EAR_INNER,
  outline: EAR_WINDOW,
  axis: 'z',
  from: 2.96,
  to: 3.85,
};
const EAR_INNER_R: ExtrudePart = {
  id: 'ear-inner-r',
  material: EAR_INNER,
  outline: mirrorX(EAR_WINDOW),
  axis: 'z',
  from: 2.96,
  to: 3.85,
};

const BODY_BOXES: BoxPart[] = [
  // Trunk is split into three so the front-bottom-centre is a real recess, not a flat face: a
  // full-width rear mass plus a chest split left/right, leaving a channel for the belly panel
  // and bib to meet with no orange between them. Shared faces are offset ~0.1 to interpenetrate
  // rather than sit coplanar (which z-fights).
  { id: 'body-rear', material: COAT, size: [6.6, 6.3, 4.0], center: [0, 3.15, 0.4] },
  { id: 'body-neck', material: COAT, size: [4.5, 2.35, 3.45], center: [0, 7.25, 2.85] },
  // Recessed behind the stationary front legs, which reach z=5.0674 at full inhalation.
  { id: 'body-chest-l', material: COAT, size: [2.05, 5.0, 3.1], center: [2.275, 5.1, 3.35] },
  { id: 'body-chest-r', material: COAT, size: [2.05, 5.0, 3.1], center: [-2.275, 5.1, 3.35] },
  // Fills the belly channel up to the bib, set back behind the chest halves and legs so the
  // whole underside reads as one continuous white front recessed into the orange frame.
  { id: 'belly-panel', material: BELLY, size: [3.0, 4.8, 2.4], center: [0, 2.4, 2.8] },
  // Overlaps the rump and the first tail link.
  { id: 'tailbone', material: COAT, size: [1.5, 1.7, 1.5], center: [0, 1.05, -1.8] },
  // Folded haunches embed into the rump and reach the floor; white toes project forward.
  { id: 'hind-leg-l', material: COAT, size: [2.0, 4.6, 4.5], center: [3.25, 2.3, 0.9] },
  { id: 'hind-leg-r', material: COAT, size: [2.0, 4.6, 4.5], center: [-3.25, 2.3, 0.9] },
  { id: 'hind-paw-l', material: POINT, size: [1.95, 1.5, 2.9], center: [3.5, 0.75, 2.65] },
  { id: 'hind-paw-r', material: POINT, size: [1.95, 1.5, 2.9], center: [-3.5, 0.75, 2.65] },
];

const HEAD_BOXES: BoxPart[] = [
  { id: 'head', material: COAT, size: [7.0, 5.14, 5.0], center: [0, 9.6, 3.48] },
  { id: 'muzzle', material: POINT, size: [3.05, 2.0, 0.95], center: [0, 8.45, 6.35] },
  { id: 'nose', material: SKIN, size: [1.1, 0.95, 0.06], center: [0, 8.96, 6.85] },
  { id: 'eye-l', material: EYE, size: [1.3, 1.29, 0.1], center: [1.57, 10.355, 6.03] },
  { id: 'eye-r', material: EYE, size: [1.3, 1.29, 0.1], center: [-1.57, 10.355, 6.03] },
  // The glint sits in a different cell of each eye's 2x2 grid so both land on the same world
  // side — a deliberate stylisation, confirmed against the reference, not a mirroring bug.
  { id: 'eye-cell-upper-lateral', material: WHISKER, size: [0.65, 0.65, 0], center: [1.895, 10.675, 6.081] },
  { id: 'eye-cell-upper-medial', material: WHISKER, size: [0.65, 0.65, 0], center: [-1.245, 10.675, 6.081] },
  { id: 'whisker-l1', material: WHISKER, size: [2.4, 0.28, 0.28], center: [3.1, 8.88, 6.04] },
  { id: 'whisker-l2', material: WHISKER, size: [2.4, 0.28, 0.28], center: [3.1, 7.9, 6.04] },
  { id: 'whisker-r1', material: WHISKER, size: [2.4, 0.28, 0.28], center: [-3.1, 8.88, 6.04] },
  { id: 'whisker-r2', material: WHISKER, size: [2.4, 0.28, 0.28], center: [-3.1, 7.9, 6.04] },
];

// Continuous shoulder-to-sock columns hide the chest join. Their front/outer faces sit
// slightly ahead of the chest to avoid coplanar stripes, and each sock overlaps its leg.
const LEG_BOXES_L: BoxPart[] = [
  { id: 'front-leg-l', material: COAT, size: [2.15, 6.15, 2.65], center: [2.25, 4.325, 3.8] },
  { id: 'front-paw-l', material: POINT, size: [2.4, 1.5, 3.0], center: [2.3, 0.75, 4.8] },
];
const LEG_BOXES_R: BoxPart[] = [
  { id: 'front-leg-r', material: COAT, size: [2.15, 6.15, 2.65], center: [-2.25, 4.325, 3.8] },
  { id: 'front-paw-r', material: POINT, size: [2.4, 1.5, 3.0], center: [-2.3, 0.75, 4.8] },
];

const TAIL_BOXES: BoxPart[] = [
  { id: 'tail-base', material: TAIL, size: [1.7, 1.7, 1.7], center: [0, 0.85, -3.225] },
  { id: 'tail-mid', material: TAIL, size: [1.7, 1.7, 2.95], center: [0, 0.85, -5.5] },
  { id: 'tail-mid-2', material: TAIL, size: [1.7, 1.7, 3.05], center: [0, 0.85, -8.45] },
  { id: 'tail-tip', material: POINT, size: [1.7, 1.7, 2.0], center: [0, 0.85, -10.925] },
];

/**
 * World z where each link's dark band ends; null for the white tip. The tail alternates dark
 * and light in roughly its own thickness, the proximal half of every link being dark, so a
 * striped link is built as two mitred boxes meeting on this plane rather than one box wearing
 * a plate: the links are re-cut every frame to keep their joints closed, and a rigid plate
 * could not follow a cut that moves.
 */
const TAIL_BANDS: readonly (number | null)[] = [-3.225, -5.5, -8.45, null];

/**
 * Stripes are modelled, not painted: a zone is an axis-aligned box, clipped at build time to
 * the part it marks and laid on it as a thin plate. Where the part did the clipping the plate
 * is pushed STRIPE_PROUD outward, so it stands clear of the surface and its skirt covers the
 * chamfered rim rather than leaving a hairline of coat colour. Geometry rather than a shader
 * gets a real antialiased edge, one shared material instead of a program per pattern, and a
 * marking that rides its part's joint without reading the tail rig's per-frame vertex rewrites.
 */
type StripeZone = { min: [number, number, number]; max: [number, number, number] };

/** Wider than any part, so a zone can be left open on an axis and clip to the block itself. */
const OPEN = 99;
/** Stand-off of a plate from the surface it marks: clear of the chamfer, under a pixel on screen. */
const STRIPE_PROUD = 0.04;
/** Authored insets are never finer than 0.05, so this only absorbs the arithmetic on a shared edge. */
const STRIPE_EPSILON = 1e-6;
/** A stripe wrapping the whole part between two heights. */
const yBand = (from: number, to: number): StripeZone => ({
  min: [-OPEN, from, -OPEN],
  max: [OPEN, to, OPEN],
});
/** A stripe wrapping the whole part between two depths — the tail links wear these. */
const zBand = (from: number, to: number): StripeZone => ({
  min: [-OPEN, -OPEN, from],
  max: [OPEN, OPEN, to],
});
/**
 * A stripe on the up-face alone, running front to back: `from`/`to` bound it across the
 * width. The slab starts a chamfer's width below `top`, so it takes the rounded rim with it
 * and spills nothing onto the four sides.
 */
const topBandX = (top: number, from: number, to: number): StripeZone => ({
  min: [from, top - 0.05, -OPEN],
  max: [to, OPEN, OPEN],
});
/**
 * A stripe that wraps one vertical corner instead of ringing the part: bounded on BOTH
 * horizontal axes, so it takes a slice of each of the two faces meeting at that corner and
 * stops. This is how the reference marks the legs — measuring one front leg there, the patch
 * covers 0.93 blocks of the 2.2-wide front face and 1.2 blocks of the 2.8-deep side face,
 * a little under half of each, and the far side of the leg is clean.
 */
const cornerBand = (from: number, to: number, x: [number, number], z: [number, number]): StripeZone => ({
  min: [x[0], from, z[0]],
  max: [x[1], to, z[1]],
});
/** The same stripe run the other way — across the part, bounded along its depth. */
const topBandZ = (top: number, from: number, to: number): StripeZone => ({
  min: [-OPEN, top - 0.05, from],
  max: [OPEN, OPEN, to],
});

/** Tabby markings shade the coat, except the tailbone's: that one opens the tail's own run. */
const STRIPE_ROLES: Record<string, PaletteKey> = { tailbone: TAIL_SHADE };

const STRIPES: Record<string, StripeZone[]> = {
  // Two crown stripes, brow to nape, just inside the ears. Run ALONG the skull (its 5-block
  // depth edge), not across it, and top face only — the reference leaves brow and cheeks clean.
  head: [topBandX(12.17, -1.35, -0.5), topBandX(12.17, 0.5, 1.35)],
  // Rump. The folded haunches hide most of the flanks, so the two rings are shared with the
  // thighs and read as one band round the rear; the third crosses the small of the back.
  'body-rear': [yBand(1.2, 2.05), yBand(2.95, 3.8), topBandZ(6.3, -1.05, -0.15)],
  // Rear-outer thigh markings align with the rump rings, clear of the forward white toes.
  'hind-leg-l': [cornerBand(1.2, 2.05, [3.4, OPEN], [-OPEN, 0.6]), cornerBand(2.95, 3.8, [3.4, OPEN], [-OPEN, 0.6])],
  'hind-leg-r': [
    cornerBand(1.2, 2.05, [-OPEN, -3.4], [-OPEN, 0.6]),
    cornerBand(2.95, 3.8, [-OPEN, -3.4], [-OPEN, 0.6]),
  ],
  // Two patches on the outer-front corner, clear of the white paw; pulled in and closer
  // together than the reference so the pair reads as one marking rather than two belts.
  // Mirrored on the far leg even though the reference isn't strictly symmetric there.
  'front-leg-l': [cornerBand(2.2, 3.05, [2.7, OPEN], [4.35, OPEN]), cornerBand(3.65, 4.5, [2.7, OPEN], [4.35, OPEN])],
  'front-leg-r': [
    cornerBand(2.2, 3.05, [-OPEN, -2.7], [4.35, OPEN]),
    cornerBand(3.65, 4.5, [-OPEN, -2.7], [4.35, OPEN]),
  ],
  // Carries the first band of the tail's alternating run, so it starts at the rump. The
  // links themselves are split, not plated — see TAIL_BANDS.
  tailbone: [zBand(-2.55, -1.9)],
};

/**
 * A colourpoint is a gradient, not a pattern: the coat darkens smoothly into the mask, ears,
 * feet and tail with no hard edge anywhere. Each entry is a place the points take over
 * completely out to `full` blocks from its centre, releasing the coat again by `fade`; the
 * strongest field per vertex is baked in the rest pose and fur materials mix toward the seal
 * colour by it. The tabby turns this off entirely via POINT_BLEND.
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
 * The tail is measured along itself rather than by the field: it curls a long way out to one
 * side, so a radius wide enough to darken its tip would have swallowed the haunch with it.
 */
const TAIL_ROOT = new THREE.Vector3(0, 0.85, -2.4);
const TAIL_POINT = { full: 0.4, fade: 2.6 };

/** How strongly the gradient is applied, per coat. The tabby has no points at all. */
const POINT_BLEND: Record<VoxelCatTheme, number> = { light: 0, dark: 1 };

/**
 * The fur the gradient runs through. Bib, whiskers, eyes and nose keep their own colour, and
 * so do the ears — a colourpoint's are solid dark to the base instead, since a radius wide
 * enough to reach the tip would also stain the crown around it.
 */
const GRADIENT_ROLES: PaletteKey[] = [COAT, COAT_SHADE, TAIL, TAIL_SHADE, POINT];

/** 1 deep along the tail, 0 where it leaves the rump. The only part of the field baked per vertex. */
const tailPointness = (at: THREE.Vector3) =>
  THREE.MathUtils.smoothstep(at.distanceTo(TAIL_ROOT), TAIL_POINT.full, TAIL_POINT.fade);

export type VoxelCatOptions = {
  /** The coat to build in. Swap it later with `setTheme`; the geometry never changes. */
  theme?: VoxelCatTheme;
};

/**
 * Edge chamfer in blocks. Clamped per part so it never exceeds 40% of the part's smallest
 * dimension, which keeps the 0.06-block nose and eye plates from collapsing.
 */
const CHAMFER = 0.018;

/** Only the pivots something actually animates. Rest bends live on their groups, unnamed. */
export type VoxelCatJoints = {
  /** Upper chest only; legs and rump stay outside the breathing pivot. */
  chest: THREE.Group;
  eyeL: THREE.Group;
  eyeR: THREE.Group;
  /** Head yaw/pitch/tilt; origin on the neck contact plane. */
  head: THREE.Group;
  earL: THREE.Group;
  earR: THREE.Group;
  /** The animated part of the tail chain; each link is a child of the previous one. */
  tail2: THREE.Group;
  tail3: THREE.Group;
  tail4: THREE.Group;
};

export type VoxelCatModel = {
  group: THREE.Group;
  joints: VoxelCatJoints;
  /** Every mesh by part id, for explode/highlight/hit-testing. */
  parts: Record<string, THREE.Mesh>;
  /**
   * Wear the other coat: repaints every material and shows that coat's markings in place of
   * the other's. No geometry, pose or material identity changes, so nothing recompiles.
   */
  setTheme: (theme: VoxelCatTheme) => void;
  dispose: () => void;
};

/** How each role takes the light. The palette changes with the theme; the finish does not. */
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
  // Solid satin albedos tuned against the reference under the hero's neutral studio rig.
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

/**
 * Mix the fur towards the point colour by the baked per-vertex field. The gradient is smooth
 * by construction, so it needs no antialiasing, and every fur material shares one program —
 * the shape of the coat lives in the attribute, not the shader source.
 */
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
      // The rest position rides along as a varying, evaluated per fragment: sampled only at
      // box corners instead, a 7 x 5 head could not have held a mask.
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
 * included — rather than where its table entry put it, and store the field on the geometry.
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

/** One piece of the tail, placed between two world depths and mitred on at most one face. */
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
 * The pieces of one tail link. A striped link is cut in two at the far edge of its dark band,
 * leaving each piece one moving end, with the marking boundary on a shared internal plane
 * that never depth-fights itself.
 */
function tailSegments(link: number): TailSegment[] {
  const part = TAIL_BOXES[link];
  const anchors = [TAIL_JOINT_1, TAIL_JOINT_2, TAIL_JOINT_3, TAIL_JOINT_4];
  const next = anchors[link + 1];
  const start = link === 0 ? part.center[2] + part.size[2] / 2 : anchors[link][2];
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
  // No bevel at internal seams: rounding both ends would reintroduce a groove, and overlapping
  // top faces would z-fight.
  const geometry = new THREE.BoxGeometry(size[0], size[1], segment.start - segment.end);
  const positions = geometry.getAttribute('position');
  // Lever arm of the mitred face, zero elsewhere, so the rig can sweep just that face with
  // its joint and leave the band's internal plane where it was built.
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
  // No bounding volumes: the rig rewrites these vertices every frame, so anything cached here
  // would only ever be wrong. Tail meshes opt out of frustum culling for the same reason.
  return geometry;
}

function extrudeGeometry(part: ExtrudePart): THREE.BufferGeometry {
  const span = part.to - part.from;
  // bevelOffset = -bevelSize keeps the outline itself at its authored dimensions.
  const radius = Math.min(CHAMFER, span * 0.4);
  const shape = new THREE.Shape();
  shape.moveTo(part.outline[0][0], part.outline[0][1]);
  for (const [x, y] of part.outline.slice(1)) shape.lineTo(x, y);
  shape.closePath();
  if (part.hole) {
    const path = new THREE.Path();
    path.moveTo(part.hole[0][0], part.hole[0][1]);
    for (const [x, y] of part.hole.slice(1)) path.lineTo(x, y);
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
  // Only the swept axis needs placing; the geometry currently runs from -radius to
  // span - radius along local +Z.
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
  /** The tabby's stripe plates, hidden whole while the colourpoint coat is on. */
  const stripes: THREE.Mesh[] = [];
  const parts: Record<string, THREE.Mesh> = {};
  const geometries: THREE.BufferGeometry[] = [];
  /** Ids whose material runs the point gradient, and so need the baked field attributes. */
  const gradient = new Set<string>();

  /** `at` and `parentAt` are both world-space, so the table above stays readable. */
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

  /** One marking: its zone clipped to the part it marks, and lifted off the faces that clipped it. */
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
    // Flat markings share the supporting block's silhouette and should not cast a raised edge.
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
      // The rig sweeps the mitred faces every frame, so no cached bound stays true; the tail
      // is always on screen with the rest of the cat anyway.
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
    // A colourpoint has no tabby striping, so the plates go away whole rather than change colour.
    for (const mesh of stripes) mesh.visible = next === 'light';
  };

  const group = new THREE.Group();
  group.name = 'voxel-cat';

  const body = joint('voxel-cat-body', BODY_JOINT, group, BODY_JOINT);
  // Narrows torso and limbs together, keeping joints and markings aligned; head and tail
  // keep their own proportions outside this scaled group.
  const torso = joint('voxel-cat-torso', BODY_JOINT, body, BODY_JOINT);
  torso.scale.set(0.9, 1, 0.95);
  const chestAt: [number, number, number] = [0, 6.1, 1.8];
  const chest = joint('voxel-cat-chest', chestAt, torso, BODY_JOINT);
  addExtrude(BIB, chest, chestAt);
  for (const part of BODY_BOXES) {
    const breathes = ['body-neck', 'body-chest-l', 'body-chest-r'].includes(part.id);
    addBox(part, breathes ? chest : part.id === 'tailbone' ? body : torso, breathes ? chestAt : BODY_JOINT);
  }

  const head = joint('voxel-cat-head', HEAD_JOINT, body, BODY_JOINT);
  head.position.y += HEAD_LIFT;
  head.rotation.order = 'YXZ';
  const eyeAtL: [number, number, number] = [1.57, 10.355, 6.03];
  const eyeAtR: [number, number, number] = [-1.57, 10.355, 6.03];
  const eyeL = joint('voxel-cat-eye-l', eyeAtL, head, HEAD_JOINT);
  const eyeR = joint('voxel-cat-eye-r', eyeAtR, head, HEAD_JOINT);
  for (const part of HEAD_BOXES) {
    if (part.id === 'eye-l' || part.id === 'eye-cell-upper-lateral') addBox(part, eyeL, eyeAtL);
    else if (part.id === 'eye-r' || part.id === 'eye-cell-upper-medial') addBox(part, eyeR, eyeAtR);
    else addBox(part, head, HEAD_JOINT);
  }

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

  // The chain is authored straight; TAIL_YAW lays it beside the cat's left haunch, and the rig
  // reads each link's rest rotation back off its group to sway around it.
  const tail1 = joint('voxel-cat-tail-1', TAIL_JOINT_1, body, BODY_JOINT);
  tail1.rotation.y = TAIL_YAW[0];
  addTail(0, tail1, TAIL_JOINT_1);
  const tail2 = joint('voxel-cat-tail-2', TAIL_JOINT_2, tail1, TAIL_JOINT_1);
  tail2.rotation.y = TAIL_YAW[1];
  addTail(1, tail2, TAIL_JOINT_2);
  const tail3 = joint('voxel-cat-tail-3', TAIL_JOINT_3, tail2, TAIL_JOINT_2);
  tail3.rotation.y = TAIL_YAW[2];
  addTail(2, tail3, TAIL_JOINT_3);
  const tail4 = joint('voxel-cat-tail-4', TAIL_JOINT_4, tail3, TAIL_JOINT_3);
  tail4.rotation.y = TAIL_YAW[3];
  addTail(3, tail4, TAIL_JOINT_4);

  bakePointField(group, parts, gradient);
  // The materials already hold the right colours; this is what sets the gradient and the plates.
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
