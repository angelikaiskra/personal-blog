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

const ORANGE = 'orange';
const WHITE = 'white';
const ONYX = 'onyx';
const ROSE = 'rose';
const STRIPE = 'stripe';

/**
 * Tabby stripe colour, de-lit from the reference the same way the palette is: on the crown
 * the plain coat photographs as rgb(240,141,25) and the stripe as rgb(208,111,26), and that
 * ratio applied to the orange albedo lands here — a burnt orange, not a true brown.
 */
const STRIPE_COLOR = '#dd6d20';

type PaletteKey = typeof ORANGE | typeof WHITE | typeof ONYX | typeof ROSE | typeof STRIPE;

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
  material: WHITE,
  outline: BIB_OUTLINE,
  axis: 'z',
  from: 4.4,
  to: 5.4,
};
const EAR_L: ExtrudePart = {
  id: 'ear-l',
  material: ORANGE,
  outline: EAR_OUTLINE,
  hole: EAR_WINDOW,
  axis: 'z',
  from: 2.84,
  to: 3.8,
};
const EAR_R: ExtrudePart = {
  id: 'ear-r',
  material: ORANGE,
  outline: mirrorX(EAR_OUTLINE),
  hole: mirrorX(EAR_WINDOW),
  axis: 'z',
  from: 2.84,
  to: 3.8,
};
const EAR_INNER_L: ExtrudePart = {
  id: 'ear-inner-l',
  material: ROSE,
  outline: EAR_WINDOW,
  axis: 'z',
  from: 2.96,
  to: 3.85,
};
const EAR_INNER_R: ExtrudePart = {
  id: 'ear-inner-r',
  material: ROSE,
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
  { id: 'body-rear', material: ORANGE, size: [6.6, 6.3, 4.0], center: [0, 3.15, 0.4] },
  { id: 'body-neck', material: ORANGE, size: [4.5, 2.35, 3.45], center: [0, 7.25, 2.85] },
  { id: 'body-chest-l', material: ORANGE, size: [2.05, 5.0, 3.3], center: [2.275, 5.1, 3.45] },
  { id: 'body-chest-r', material: ORANGE, size: [2.05, 5.0, 3.3], center: [-2.275, 5.1, 3.45] },
  // White belly fur: fills the channel from the ground up to overlap the bib, but set well
  // back — its face sits 0.4 behind the chest halves and 0.7 behind the front of the legs,
  // so the whole underside between the legs is one continuous white front, recessed into a
  // deep pocket the orange legs and chest frame.
  { id: 'belly-panel', material: WHITE, size: [3.0, 4.8, 2.4], center: [0, 2.4, 2.8] },
  // The root block overlaps the rump and the first tail link.
  { id: 'tailbone', material: ORANGE, size: [1.5, 1.7, 1.5], center: [0, 1.05, -1.8] },
  // Folded haunches embed into the rump and reach the floor along their full depth.
  // White toes project forward; there is no unsupported orange shelf behind the paws.
  { id: 'hind-leg-l', material: ORANGE, size: [2.0, 4.6, 4.5], center: [3.25, 2.3, 0.9] },
  { id: 'hind-leg-r', material: ORANGE, size: [2.0, 4.6, 4.5], center: [-3.25, 2.3, 0.9] },
  { id: 'hind-paw-l', material: WHITE, size: [1.95, 1.5, 2.9], center: [3.5, 0.75, 2.65] },
  { id: 'hind-paw-r', material: WHITE, size: [1.95, 1.5, 2.9], center: [-3.5, 0.75, 2.65] },
];

const HEAD_BOXES: BoxPart[] = [
  { id: 'head', material: ORANGE, size: [7.0, 5.14, 5.0], center: [0, 9.6, 3.48] },
  { id: 'muzzle', material: WHITE, size: [3.05, 2.0, 0.95], center: [0, 8.45, 6.35] },
  { id: 'nose', material: ROSE, size: [1.1, 0.95, 0.06], center: [0, 8.96, 6.85] },
  { id: 'eye-l', material: ONYX, size: [1.3, 1.29, 0.1], center: [1.57, 10.355, 6.03] },
  { id: 'eye-r', material: ONYX, size: [1.3, 1.29, 0.1], center: [-1.57, 10.355, 6.03] },
  // The white glint sits in a DIFFERENT cell of each eye's 2x2 grid — lateral on the cat's
  // left, medial on its right, so both land on the same world side. Measured in the front
  // reference, verified in the three-quarter one: it is a stylisation, not a mirroring bug.
  { id: 'eye-cell-upper-lateral', material: WHITE, size: [0.65, 0.65, 0.06], center: [1.895, 10.675, 6.11] },
  { id: 'eye-cell-upper-medial', material: WHITE, size: [0.65, 0.65, 0.06], center: [-1.245, 10.675, 6.11] },
  { id: 'whisker-l1', material: WHITE, size: [2.4, 0.28, 0.28], center: [3.1, 8.88, 6.04] },
  { id: 'whisker-l2', material: WHITE, size: [2.4, 0.28, 0.28], center: [3.1, 7.9, 6.04] },
  { id: 'whisker-r1', material: WHITE, size: [2.4, 0.28, 0.28], center: [-3.1, 8.88, 6.04] },
  { id: 'whisker-r2', material: WHITE, size: [2.4, 0.28, 0.28], center: [-3.1, 7.9, 6.04] },
];

// Continuous shoulder-to-sock columns hide the chest join. Their front/outer faces sit
// slightly ahead of the chest to avoid coplanar stripes, and each sock overlaps its leg.
const LEG_BOXES_L: BoxPart[] = [
  { id: 'front-leg-l', material: ORANGE, size: [2.15, 6.15, 2.65], center: [2.25, 4.325, 3.8] },
  { id: 'front-paw-l', material: WHITE, size: [2.4, 1.5, 3.0], center: [2.3, 0.75, 4.8] },
];
const LEG_BOXES_R: BoxPart[] = [
  { id: 'front-leg-r', material: ORANGE, size: [2.15, 6.15, 2.65], center: [-2.25, 4.325, 3.8] },
  { id: 'front-paw-r', material: WHITE, size: [2.4, 1.5, 3.0], center: [-2.3, 0.75, 4.8] },
];

const TAIL_BOXES: BoxPart[] = [
  { id: 'tail-base', material: ORANGE, size: [1.7, 1.7, 1.7], center: [0, 0.85, -3.225] },
  { id: 'tail-mid', material: ORANGE, size: [1.7, 1.7, 2.95], center: [0, 0.85, -5.5] },
  { id: 'tail-mid-2', material: ORANGE, size: [1.7, 1.7, 3.05], center: [0, 0.85, -8.45] },
  { id: 'tail-tip', material: WHITE, size: [1.7, 1.7, 2.0], center: [0, 0.85, -10.925] },
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

export type VoxelCatOptions = {
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
  dispose: () => void;
};

/**
 * Studio lighting solved from the reference: the orange coat reads 1.00 on up-faces,
 * 0.87 on front faces and 0.75 on lateral faces. `applyVoxelCatLighting` reproduces those
 * ratios; see the hero component for the matching light rig.
 */
export const VOXEL_CAT_LIGHT_DIRECTION: readonly [number, number, number] = [0.25, 0.88, 0.4];

function makeMaterials(): Record<PaletteKey, THREE.MeshStandardMaterial> {
  // Solid satin albedos tuned against the reference under the hero's neutral studio rig.
  const make = (color: string, roughness: number, name: string) =>
    new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness, metalness: 0, name });
  return {
    [ORANGE]: make('#ed8c20', 0.7, 'voxel-cat-orange'),
    [WHITE]: make('#ffffff', 0.72, 'voxel-cat-white'),
    [ONYX]: make('#0d0d0d', 0.55, 'voxel-cat-onyx'),
    [ROSE]: make('#f69caa', 0.72, 'voxel-cat-rose'),
    [STRIPE]: make(STRIPE_COLOR, 0.7, 'voxel-cat-stripe'),
  };
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
    { id: `${part.id}-band`, material: STRIPE, start, end: band, startSlope, endSlope: 0, mitre: startMitre },
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
  const { scale = 1, chamfer = 0.018, castShadow = true, receiveShadow = true } = options;
  const materials = makeMaterials();
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

  /** One stripe: its zone clipped to the part it marks, and lifted off the faces that clipped it. */
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
    const mesh = addMesh(boxGeometry(size, chamfer), `${part.id}-stripe-${index}`, STRIPE, parent, origin, center);
    // The block underneath already casts this silhouette; a second caster only risks acne.
    mesh.castShadow = false;
  };

  const addBox = (part: BoxPart, parent: THREE.Object3D, origin: readonly [number, number, number]) => {
    const mesh = addMesh(boxGeometry(part.size, chamfer), part.id, part.material, parent, origin, part.center);
    const zones = STRIPES[part.id];
    if (zones) zones.forEach((zone, index) => addStripe(part, zone, index, parent, origin));
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

  return {
    group,
    joints: { body, chest, eyeL, eyeR, head, earL, earR, frontLegL, frontLegR, tail1, tail2, tail3, tail4 },
    parts,
    materials,
    dispose: () => {
      for (const geometry of geometries) geometry.dispose();
      for (const material of Object.values(materials)) material.dispose();
    },
  };
}
