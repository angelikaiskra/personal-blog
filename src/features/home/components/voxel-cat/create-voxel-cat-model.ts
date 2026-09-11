import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/**
 * Procedural voxel-art cat, rebuilt in code from the reference renders.
 *
 * The unit is one "block"; the ground plane is y = 0, +Y is up, +Z is the direction the
 * cat faces, and +X is the cat's own left. The head block and its features are measured
 * from the reference; the body reads as a single block but is split into a few so the
 * chest between the front legs is a real recess for the white belly fur; the legs, paws
 * and tail are separate blocks added on top of it.
 *
 * The model is built for animation: every mobile part hangs off a named pivot group whose
 * origin sits on the joint, so rotating a joint does the right thing with no extra offsets.
 */

/**
 * Parts are painted by role, not by colour, so the cat can wear a different coat in each
 * theme without a single block moving. `ear` and `tail` are separate from `coat` because a
 * colourpoint darkens them while a tabby keeps them coat-coloured, and `point` is the muzzle,
 * paws and tail tip — the extremities a colourpoint darkens and a tabby wears white on.
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
 * A coat per theme.
 *
 * The tabby is the measured one, solved from the reference renders: the plain coat
 * photographs as rgb(240,141,25) and its marking as rgb(208,111,26), and that ratio applied
 * to the orange albedo lands on a burnt orange rather than a true brown.
 *
 * The colourpoint is its inverse, and is authored rather than measured. Its points sit well
 * above a real seal's near-black, which would sink into the dark theme's page and cost the
 * cat its silhouette; the contrast that sells the coat is the one against the cream, not the
 * one against the background. The shade on the body is pulled close to the coat on purpose —
 * a colourpoint carries no tabby striping, so the same markings read as soft shading.
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
  // Every piece of fur starts from the same cream here — coat, ears, tail, feet and muzzle
  // alike — and the point gradient is what darkens the extremities. That is how the coat
  // actually works on the reference, and it is why none of these roles carry a brown: putting
  // one in would reintroduce exactly the edge the gradient exists to avoid.
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
    [EYE]: '#7fb6de',
    [SKIN]: '#6f5a50',
    // Barely off the shell around it. On the reference the inner ear is dark too; lift it any
    // further and the ear reads as a notch cut out of the head rather than as an ear.
    [EAR_INNER]: '#513c34',
  },
} satisfies Record<string, VoxelCatPalette>;

export type VoxelCatTheme = keyof typeof VOXEL_CAT_PALETTES;

/** A part positioned by its centre, in world blocks. */
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
// Lift the complete head rig, including its rotation pivot and ears, above the shoulders.
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

const mirrorX = (outline: [number, number][]): [number, number][] =>
  // A left/right pair is a reflection, never a rotation: negate x and rewind so the swept
  // faces stay outward-facing on both sides.
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
  // The trunk reads as one block but is assembled from three so the front-bottom-centre is a
  // real recess, not a flat face: a full-width rear mass and an upper "chest" split
  // left/right so its front-centre is open. The channel they leave — open at the front from
  // the ground right up to the bib — is the belly pocket, so the white bib and the white
  // belly meet with no orange showing between them. Every shared face is offset by ~0.1 so
  // blocks interpenetrate rather than sit coplanar (coplanar orange-on-orange z-fights).
  { id: 'body-rear', material: COAT, size: [6.6, 6.3, 4.0], center: [0, 3.15, 0.4] },
  { id: 'body-neck', material: COAT, size: [4.5, 2.35, 3.45], center: [0, 7.25, 2.85] },
  { id: 'body-chest-l', material: COAT, size: [2.05, 5.0, 3.3], center: [2.275, 5.1, 3.45] },
  { id: 'body-chest-r', material: COAT, size: [2.05, 5.0, 3.3], center: [-2.275, 5.1, 3.45] },
  // White belly fur: fills the channel from the ground up to overlap the bib, but set well
  // back — its face sits 0.4 behind the chest halves and 0.7 behind the front of the legs,
  // so the whole underside between the legs is one continuous white front, recessed into a
  // deep pocket the orange legs and chest frame.
  { id: 'belly-panel', material: BELLY, size: [3.0, 4.8, 2.4], center: [0, 2.4, 2.8] },
  // The root block overlaps the rump and the first tail link.
  { id: 'tailbone', material: COAT, size: [1.5, 1.7, 1.5], center: [0, 1.05, -1.8] },
  // Folded haunches embed into the rump and reach the floor along their full depth.
  // White toes project forward; there is no unsupported orange shelf behind the paws.
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
  // The white glint sits in a DIFFERENT cell of each eye's 2x2 grid — lateral on the cat's
  // left, medial on its right, so both land on the same world side. Measured in the front
  // reference, verified in the three-quarter one: it is a stylisation, not a mirroring bug.
  { id: 'eye-cell-upper-lateral', material: WHISKER, size: [0.65, 0.65, 0.06], center: [1.895, 10.675, 6.11] },
  { id: 'eye-cell-upper-medial', material: WHISKER, size: [0.65, 0.65, 0.06], center: [-1.245, 10.675, 6.11] },
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
 * Stripes are modelled, not painted: a zone is an axis-aligned box in the same world blocks as
 * the part tables above, and at build time it is clipped to the part it marks and laid on that
 * part as a thin plate in the stripe colour. Where the zone set a bound the plate keeps it
 * exactly — those are the measurements taken off the reference; where the part did the
 * clipping the plate is pushed STRIPE_PROUD outwards, so it stands on the surface rather than
 * fighting it for depth, and its skirt covers the chamfered rim instead of leaving a hairline
 * of coat colour along the edge.
 *
 * Geometry rather than a shader buys three things: the boundary is a real edge, so
 * multisampling antialiases it and it stops crawling as the cat moves; every part shares one
 * material instead of each stripe pattern baking its own program; and the marking rides
 * whichever joint the part hangs from without reading the vertex buffers the tail rig rewrites
 * each frame.
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
  // Two stripes down the crown, brow to nape, one either side of the midline and running just
  // inside the ears (whose inner edges stand at |x| = 1.3). They lie ALONG the skull, not
  // across it: measured off the reference, the stripe pixels share their long axis with the
  // head's 5-block depth edge, not with its 7-block width edge. Top face only — the reference
  // leaves the brow and the cheeks clean.
  head: [topBandX(12.17, -1.35, -0.5), topBandX(12.17, 0.5, 1.35)],
  // Rump. The folded haunches stand proud of the flanks and hide most of them, so the two rings
  // are shared with the thighs at the same heights and read as one stripe running round the
  // rear; the third crosses the small of the back, which the hero camera looks down on.
  'body-rear': [yBand(1.2, 2.05), yBand(2.95, 3.8), topBandZ(6.3, -1.05, -0.15)],
  // Rear-outer thigh markings align with the rump rings, clear of the forward white toes.
  'hind-leg-l': [cornerBand(1.2, 2.05, [3.4, OPEN], [-OPEN, 0.6]), cornerBand(2.95, 3.8, [3.4, OPEN], [-OPEN, 0.6])],
  'hind-leg-r': [
    cornerBand(1.2, 2.05, [-OPEN, -3.4], [-OPEN, 0.6]),
    cornerBand(2.95, 3.8, [-OPEN, -3.4], [-OPEN, 0.6]),
  ],
  // Front legs: two patches each on the outer-front corner, both clear of the white paw. The
  // reference's near leg measures larger and further apart than this — 1.15 tall, 0.95 between
  // them, reaching 0.93 and 1.2 blocks along the two faces; these are pulled in by about a
  // third on every axis and sit closer together, so the pair reads as one marking on a slimmer
  // leg rather than two belts spanning it. Its FAR leg reads bare on the
  // front face, so the reference is not strictly symmetric here; mirroring is the deliberate
  // choice, to match the rest of this model.
  'front-leg-l': [cornerBand(2.2, 3.05, [2.7, OPEN], [4.35, OPEN]), cornerBand(3.65, 4.5, [2.7, OPEN], [4.35, OPEN])],
  'front-leg-r': [
    cornerBand(2.2, 3.05, [-OPEN, -2.7], [4.35, OPEN]),
    cornerBand(3.65, 4.5, [-OPEN, -2.7], [4.35, OPEN]),
  ],
  // The tailbone carries the first band of the tail's alternating run, so it starts at the rump
  // instead of a link's length behind it. The links themselves are split, not plated: TAIL_BANDS.
  tailbone: [zBand(-2.55, -1.9)],
};

/**
 * A colourpoint is a gradient, not a pattern. On the reference the coat darkens smoothly all
 * the way into the mask, the ears, the feet and the tail, and there is no edge anywhere on the
 * animal — so this coat is not painted with markings at all. Each of these is a place the
 * points take over completely, `full` blocks out from its centre, releasing the coat again by
 * `fade`; the model bakes the strongest of them per vertex in the rest pose and the fur
 * materials mix towards the seal colour by it.
 *
 * The tabby wants none of this and turns the whole thing off, which is what POINT_BLEND does.
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
 * The fur the gradient runs through. The bib, whiskers, eyes and nose keep their own colour,
 * and so do the ears: a colourpoint's are solid dark to the base, and a radius wide enough to
 * carry one to its tip also stained a round patch of crown around it. The ear meets the head
 * at a silhouette rather than across a face, so it can take its colour flat without an edge
 * showing anywhere.
 */
const GRADIENT_ROLES: PaletteKey[] = [COAT, COAT_SHADE, TAIL, TAIL_SHADE, POINT];

/** 1 deep along the tail, 0 where it leaves the rump. The only part of the field baked per vertex. */
const tailPointness = (at: THREE.Vector3) =>
  THREE.MathUtils.smoothstep(at.distanceTo(TAIL_ROOT), TAIL_POINT.full, TAIL_POINT.fade);

export type VoxelCatOptions = {
  /** The coat to build in. Swap it later with `setTheme`; the geometry never changes. */
  theme?: VoxelCatTheme;
  /** Uniform scale applied to the root group. 1 = one block per world unit. */
  scale?: number;
  /**
   * Edge chamfer in blocks. Clamped per part so it never exceeds 40% of the part's smallest
   * dimension, which keeps the 0.06-block nose and eye plates from collapsing.
   */
  chamfer?: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
};

export type VoxelCatJoints = {
  /** Whole-body bob. */
  body: THREE.Group;
  /** Upper chest only; legs and rump stay outside the breathing pivot. */
  chest: THREE.Group;
  eyeL: THREE.Group;
  eyeR: THREE.Group;
  /** Head yaw/pitch/tilt; origin on the neck contact plane. */
  head: THREE.Group;
  earL: THREE.Group;
  earR: THREE.Group;
  /** Front-leg swing; origin at the shoulder. The paw is a child, so it follows. */
  frontLegL: THREE.Group;
  frontLegR: THREE.Group;
  /** Four-link tail chain; each link is a child of the previous one. */
  tail1: THREE.Group;
  tail2: THREE.Group;
  tail3: THREE.Group;
  tail4: THREE.Group;
};

export type VoxelCatModel = {
  group: THREE.Group;
  joints: VoxelCatJoints;
  /** Every mesh by part id, for explode/highlight/hit-testing. */
  parts: Record<string, THREE.Mesh>;
  materials: Record<PaletteKey, THREE.MeshStandardMaterial>;
  /**
   * Wear the other coat: repaints every material and shows that coat's markings in place of
   * the other's. No geometry, pose or material identity changes, so nothing recompiles.
   */
  setTheme: (theme: VoxelCatTheme) => void;
  dispose: () => void;
};

/**
 * Studio lighting solved from the reference: the orange coat reads 1.00 on up-faces,
 * 0.87 on front faces and 0.75 on lateral faces. `applyVoxelCatLighting` reproduces those
 * ratios; see the hero component for the matching light rig.
 */
export const VOXEL_CAT_LIGHT_DIRECTION: readonly [number, number, number] = [0.25, 0.88, 0.4];

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
 * Mix the fur towards the point colour by the baked per-vertex field. The gradient is smooth by
 * construction, so unlike a hard marking it needs no antialiasing, and every fur material shares
 * one program: the shape of the coat lives in the attribute, not in the shader source.
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
      // The rest position rides along as a varying. It interpolates exactly across a flat
      // face, which is the whole reason the field is evaluated per fragment: sampled at the
      // eight corners of a box instead, a 7 x 5 head could not have held a mask at all.
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
function bakePointField(group: THREE.Group, parts: Record<string, THREE.Mesh>) {
  group.updateMatrixWorld(true);
  const toRoot = new THREE.Matrix4();
  const rootInverse = new THREE.Matrix4().copy(group.matrixWorld).invert();
  const vertex = new THREE.Vector3();
  for (const [id, mesh] of Object.entries(parts)) {
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

function boxGeometry(size: [number, number, number], chamfer: number): THREE.BufferGeometry {
  const [w, h, d] = size;
  const radius = Math.min(chamfer, Math.min(w, h, d) * 0.4);
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
 * which leaves each piece exactly one moving end and puts the marking's boundary on a flat
 * internal plane the two halves share — coincident, opposite-facing, and so never in a depth
 * fight with each other.
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
  // Separate face vertices retain flat normals. No bevel at the internal seams: rounding
  // both ends would reintroduce a groove, and overlapping top faces would z-fight.
  const geometry = new THREE.BoxGeometry(size[0], size[1], segment.start - segment.end);
  const positions = geometry.getAttribute('position');
  // Lever arm of the mitred face and zero everywhere else: all the rig needs to sweep that one
  // face with its joint, leaving the band's internal plane exactly where it was built.
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
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function extrudeGeometry(part: ExtrudePart, chamfer: number): THREE.BufferGeometry {
  const span = part.to - part.from;
  // ExtrudeGeometry's bevel grows the sweep by bevelThickness at each end, and
  // bevelOffset = -bevelSize keeps the outline itself at its authored dimensions.
  const radius = Math.min(chamfer, span * 0.4);
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
  // The shape is authored in world coordinates, so only the swept axis needs placing: the
  // geometry currently runs from -radius to span - radius along local +Z.
  geometry.translate(0, 0, part.from + radius);
  if (part.axis === 'x') {
    // Outline is (z, y); rotate the sweep onto +X and swing the outline plane to match.
    geometry.rotateY(Math.PI / 2);
  }
  return geometry;
}

export function createVoxelCatModel(options: VoxelCatOptions = {}): VoxelCatModel {
  const { theme = 'light', scale = 1, chamfer = 0.018, castShadow = true, receiveShadow = true } = options;
  const materials = makeMaterials(VOXEL_CAT_PALETTES[theme]);
  const pointColor = { value: new THREE.Color() };
  const pointBlend = { value: 0 };
  applyPointGradient(materials, pointColor, pointBlend);
  /** The tabby's stripe plates, hidden whole while the colourpoint coat is on. */
  const stripes: THREE.Mesh[] = [];
  const parts: Record<string, THREE.Mesh> = {};
  const geometries: THREE.BufferGeometry[] = [];

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
    // `center` is the world anchor the geometry was built around; rebase it onto the pivot
    // this part hangs from.
    mesh.position.set(center[0] - origin[0], center[1] - origin[1], center[2] - origin[2]);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;
    mesh.userData.partId = id;
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
    const mesh = addMesh(boxGeometry(size, chamfer), `${part.id}-stripe-${index}`, role, parent, origin, center);
    // The block underneath already casts this silhouette; a second caster only risks acne.
    mesh.castShadow = false;
    stripes.push(mesh);
  };

  const addBox = (part: BoxPart, parent: THREE.Object3D, origin: readonly [number, number, number]) => {
    const mesh = addMesh(boxGeometry(part.size, chamfer), part.id, part.material, parent, origin, part.center);
    STRIPES[part.id]?.forEach((zone, index) => addStripe(part, zone, index, parent, origin));
    return mesh;
  };

  const addTail = (link: number, parent: THREE.Object3D, origin: readonly [number, number, number]) => {
    const { size, center: authored } = TAIL_BOXES[link];
    for (const segment of tailSegments(link)) {
      const center: [number, number, number] = [0, authored[1], (segment.start + segment.end) / 2];
      addMesh(tailGeometry(segment, size, center[2]), segment.id, segment.material, parent, origin, center);
    }
  };

  const addExtrude = (part: ExtrudePart, parent: THREE.Object3D, origin: readonly [number, number, number]) => {
    // The outline is already in world coordinates, so the geometry carries the placement and
    // the mesh sits at the joint origin.
    const geometry = extrudeGeometry(part, chamfer);
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
  group.scale.setScalar(scale);

  const body = joint('voxel-cat-body', BODY_JOINT, group, BODY_JOINT);
  // Narrow the torso and limbs together, keeping their joints and markings aligned.
  // The head and tail retain their own proportions outside this scaled group.
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

  // The chain is authored straight; TAIL_YAW lays it beside the cat's left haunch. Each
  // link's rest yaw is stored so an idle animation can sway around it.
  const tail1 = joint('voxel-cat-tail-1', TAIL_JOINT_1, body, BODY_JOINT);
  tail1.rotation.y = TAIL_YAW[0];
  tail1.userData.restYaw = TAIL_YAW[0];
  addTail(0, tail1, TAIL_JOINT_1);
  const tail2 = joint('voxel-cat-tail-2', TAIL_JOINT_2, tail1, TAIL_JOINT_1);
  tail2.rotation.y = TAIL_YAW[1];
  tail2.userData.restYaw = TAIL_YAW[1];
  addTail(1, tail2, TAIL_JOINT_2);
  const tail3 = joint('voxel-cat-tail-3', TAIL_JOINT_3, tail2, TAIL_JOINT_2);
  tail3.rotation.y = TAIL_YAW[2];
  tail3.userData.restYaw = TAIL_YAW[2];
  addTail(2, tail3, TAIL_JOINT_3);
  const tail4 = joint('voxel-cat-tail-4', TAIL_JOINT_4, tail3, TAIL_JOINT_3);
  tail4.rotation.y = TAIL_YAW[3];
  tail4.userData.restYaw = TAIL_YAW[3];
  addTail(3, tail4, TAIL_JOINT_4);

  bakePointField(group, parts);
  // The materials already hold the right colours; this is what sets the gradient and the plates.
  setTheme(theme);

  return {
    group,
    joints: { body, chest, eyeL, eyeR, head, earL, earR, frontLegL, frontLegR, tail1, tail2, tail3, tail4 },
    parts,
    materials,
    setTheme,
    dispose: () => {
      for (const geometry of geometries) geometry.dispose();
      for (const material of Object.values(materials)) material.dispose();
    },
  };
}
