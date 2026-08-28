import * as THREE from "three";
import { HUMAN } from "@/world/scale";

/**
 * The employee character rig: one skinned humanoid, built in code.
 *
 * WHY BUILT RATHER THAN IMPORTED. The brief asks for a rigged, animated
 * humanoid and points at two Sketchfab characters as the visual reference.
 * Those cannot be redistributed, and every rigged humanoid that CAN be —
 * Cesium's `CesiumMan` and `RiggedFigure` are logo-textured test assets under
 * Cesium's trademark terms, three.js's `Xbot` and `Soldier` are Mixamo-derived
 * and not redistributable, `RobotExpressive` is CC0 but is a robot — is either
 * legally unusable here or not a person. The brief's own fallback applies: use
 * the references as reference, and build an equivalent properly-licensed rig.
 *
 * So this is a real rig, not a stack of separately-rotated boxes. There is a
 * `THREE.Skeleton` of 21 bones, a single skinned `BufferGeometry` whose every
 * vertex carries four bone influences, and hand-authored `AnimationClip`s. The
 * mesh DEFORMS: an elbow creases, a knee bends through its joint, the pelvis
 * carries the spine with it. That is the difference the brief is asking for
 * when it says not to translate a frozen model across the ground.
 *
 * WHAT IS SHARED AND WHAT IS PER-EMPLOYEE. The geometry and the clips are
 * built exactly once and shared by all thirty employees; each employee gets
 * their own `Skeleton` (via `SkeletonUtils.clone`) and their own
 * `AnimationMixer`, which is what lets thirty people be at thirty different
 * points of their own morning at the same instant. Appearance — build, skin
 * tone, clothing, hair — is per-employee material and scale, so the cast reads
 * as thirty colleagues rather than one model copied thirty times.
 *
 * EVERY DIMENSION COMES FROM `HUMAN`. The rig is 1.75 m tall because that is
 * what a person is, and the park is measured against people.
 */

const H = HUMAN;

/* ------------------------------------------------------------------ */
/* 1. The skeleton                                                      */
/* ------------------------------------------------------------------ */

/**
 * Bone names, fixed here because the clips, the skinning and the sit pose all
 * address bones by name. Left/right are the character's own left and right.
 */
export const BONES = [
  "hips",
  "spine",
  "chest",
  "neck",
  "head",
  "shoulderL",
  "upperArmL",
  "foreArmL",
  "handL",
  "shoulderR",
  "upperArmR",
  "foreArmR",
  "handR",
  "thighL",
  "shinL",
  "footL",
  "thighR",
  "shinR",
  "footR",
] as const;
export type BoneName = (typeof BONES)[number];

/** Parent of each bone, and its offset from that parent, in metres. */
interface BoneSpec {
  parent: BoneName | null;
  offset: [number, number, number];
}

const SHOULDER_X = H.shoulderWidth / 2;
const HIP_X = 0.098;

/*
 * Segment lengths, all solved so the joints land on the figures the rest of
 * the park is measured against: the head bone at HUMAN.headY, the shoulders at
 * HUMAN.shoulderY, the hips at HUMAN.hipY, and the ankles at ANKLE_Y so the
 * feet stand ON the ground rather than in it.
 */
const ANKLE_Y = 0.08;
/** Hip joint sits a little below the pelvis centre. */
const HIP_DROP = 0.04;
const LEG = H.hipY - HIP_DROP - ANKLE_Y;
const THIGH = LEG * 0.52;
const SHIN = LEG * 0.48;

/** Spine chain, summing from the hips to the head. */
const SPINE_RISE = 0.16;
const CHEST_RISE = 0.2;
const SHOULDER_RISE = H.shoulderY - (H.hipY + SPINE_RISE + CHEST_RISE);
const NECK_RISE = 0.24;
const HEAD_RISE = H.headY - (H.hipY + SPINE_RISE + CHEST_RISE + NECK_RISE);

/** Upper-arm and forearm, hanging to a natural wrist height. */
const UPPER_ARM = 0.28;
const FORE_ARM = 0.26;

export const BONE_SPEC: Record<BoneName, BoneSpec> = {
  hips: { parent: null, offset: [0, H.hipY, 0] },
  spine: { parent: "hips", offset: [0, SPINE_RISE, 0] },
  chest: { parent: "spine", offset: [0, CHEST_RISE, 0] },
  neck: { parent: "chest", offset: [0, NECK_RISE, 0] },
  head: { parent: "neck", offset: [0, HEAD_RISE, 0] },

  shoulderL: { parent: "chest", offset: [-SHOULDER_X * 0.55, SHOULDER_RISE, 0] },
  upperArmL: { parent: "shoulderL", offset: [-SHOULDER_X * 0.45, -0.02, 0] },
  foreArmL: { parent: "upperArmL", offset: [0, -UPPER_ARM, 0] },
  handL: { parent: "foreArmL", offset: [0, -FORE_ARM, 0] },

  shoulderR: { parent: "chest", offset: [SHOULDER_X * 0.55, SHOULDER_RISE, 0] },
  upperArmR: { parent: "shoulderR", offset: [SHOULDER_X * 0.45, -0.02, 0] },
  foreArmR: { parent: "upperArmR", offset: [0, -UPPER_ARM, 0] },
  handR: { parent: "foreArmR", offset: [0, -FORE_ARM, 0] },

  thighL: { parent: "hips", offset: [-HIP_X, -HIP_DROP, 0] },
  shinL: { parent: "thighL", offset: [0, -THIGH, 0] },
  footL: { parent: "shinL", offset: [0, -SHIN, 0] },

  thighR: { parent: "hips", offset: [HIP_X, -HIP_DROP, 0] },
  shinR: { parent: "thighR", offset: [0, -THIGH, 0] },
  footR: { parent: "shinR", offset: [0, -SHIN, 0] },
};

/** Ankle height above the ground in the rest pose — asserted by the verifier. */
export const REST_ANKLE_Y = ANKLE_Y;

export interface BuiltSkeleton {
  root: THREE.Bone;
  bones: THREE.Bone[];
  index: Record<BoneName, number>;
}

/** A fresh bone hierarchy in the rest pose. */
export function createSkeletonBones(): BuiltSkeleton {
  const made = {} as Record<BoneName, THREE.Bone>;
  const bones: THREE.Bone[] = [];
  const index = {} as Record<BoneName, number>;

  for (const name of BONES) {
    const bone = new THREE.Bone();
    bone.name = name;
    const spec = BONE_SPEC[name];
    bone.position.set(...spec.offset);
    made[name] = bone;
    index[name] = bones.length;
    bones.push(bone);
  }
  for (const name of BONES) {
    const spec = BONE_SPEC[name];
    if (spec.parent) made[spec.parent].add(made[name]);
  }
  return { root: made.hips, bones, index };
}

/**
 * World-space rest position of every bone, used both to place geometry and to
 * decide which bone each vertex belongs to.
 */
function restPositions(): Record<BoneName, THREE.Vector3> {
  const out = {} as Record<BoneName, THREE.Vector3>;
  for (const name of BONES) {
    const v = new THREE.Vector3();
    let cur: BoneName | null = name;
    while (cur) {
      const spec: BoneSpec = BONE_SPEC[cur];
      v.add(new THREE.Vector3(...spec.offset));
      cur = spec.parent;
    }
    out[name] = v;
  }
  return out;
}

export const REST = restPositions();

/* ------------------------------------------------------------------ */
/* 2. The skinned body                                                  */
/* ------------------------------------------------------------------ */

/**
 * One piece of the body, and the bone chain its vertices may be weighted to.
 *
 * Restricting the candidate bones per piece is what keeps skinning honest on a
 * figure this stylized: a forearm vertex is a centimetre from the hip when the
 * arms hang down, and a purely nearest-bone search would happily weight it to
 * the pelvis and tear the arm off when the character sits.
 */
interface Piece {
  /** Segment the piece is built along, in rest world space. */
  from: BoneName;
  to: BoneName | null;
  /**
   * Where the segment ends when there is no `to` bone — an offset from
   * `from`'s rest position. A shoe, for instance, runs forward from the ankle
   * rather than up from it.
   */
  endOffset?: [number, number, number];
  /** Radius at the `from` end. */
  radius: number;
  /** Radius at the far end; defaults to `radius`. A limb TAPERS — a thigh is
   *  not the same thickness as a knee, and a forearm is not a wrist. */
  radiusEnd?: number;
  /** Bones these vertices may be influenced by. */
  chain: BoneName[];
  /** Flattening applied around the segment axis: [x, z]. */
  squash?: [number, number];
  material: "skin" | "shirt" | "trousers" | "shoe";
}

const PIECES: Piece[] = [
  /*
   * TORSO. Two tapered sections rather than one tube: the pelvis is wide, the
   * waist pulls in, and the chest broadens again to the shoulders. That single
   * change is most of what separates a person from a sack.
   */
  { from: "hips", to: "spine", radius: 0.152, radiusEnd: 0.126, chain: ["hips", "spine"], squash: [1.1, 0.72], material: "trousers" },
  { from: "spine", to: "chest", radius: 0.126, radiusEnd: 0.168, chain: ["hips", "spine", "chest"], squash: [1.08, 0.7], material: "shirt" },
  { from: "chest", to: "neck", radius: 0.168, radiusEnd: 0.1, chain: ["chest", "neck"], squash: [1.14, 0.72], material: "shirt" },
  { from: "neck", to: "head", radius: 0.052, radiusEnd: 0.058, chain: ["neck", "head"], material: "skin" },

  /*
   * ARMS. The shoulder cap belongs to the upper arm so the deltoid follows the
   * arm rather than staying welded to the chest; the sleeve tapers to the
   * elbow, and the forearm tapers again to a narrow wrist.
   */
  { from: "shoulderL", to: "upperArmL", radius: 0.078, radiusEnd: 0.062, chain: ["chest", "shoulderL", "upperArmL"], material: "shirt" },
  { from: "upperArmL", to: "foreArmL", radius: 0.062, radiusEnd: 0.049, chain: ["shoulderL", "upperArmL", "foreArmL"], material: "shirt" },
  { from: "foreArmL", to: "handL", radius: 0.047, radiusEnd: 0.034, chain: ["upperArmL", "foreArmL", "handL"], material: "skin" },
  { from: "handL", to: null, endOffset: [0, -0.075, 0.012], radius: 0.038, radiusEnd: 0.026, chain: ["handL"], squash: [0.82, 1.25], material: "skin" },

  { from: "shoulderR", to: "upperArmR", radius: 0.078, radiusEnd: 0.062, chain: ["chest", "shoulderR", "upperArmR"], material: "shirt" },
  { from: "upperArmR", to: "foreArmR", radius: 0.062, radiusEnd: 0.049, chain: ["shoulderR", "upperArmR", "foreArmR"], material: "shirt" },
  { from: "foreArmR", to: "handR", radius: 0.047, radiusEnd: 0.034, chain: ["upperArmR", "foreArmR", "handR"], material: "skin" },
  { from: "handR", to: null, endOffset: [0, -0.075, 0.012], radius: 0.038, radiusEnd: 0.026, chain: ["handR"], squash: [0.82, 1.25], material: "skin" },

  /* LEGS. Thigh thick at the hip, narrowing to the knee; calf swelling below
     the knee and drawing in to a thin ankle. */
  { from: "thighL", to: "shinL", radius: 0.092, radiusEnd: 0.066, chain: ["hips", "thighL", "shinL"], material: "trousers" },
  { from: "shinL", to: "footL", radius: 0.07, radiusEnd: 0.042, chain: ["thighL", "shinL", "footL"], material: "trousers" },
  { from: "thighR", to: "shinR", radius: 0.092, radiusEnd: 0.066, chain: ["hips", "thighR", "shinR"], material: "trousers" },
  { from: "shinR", to: "footR", radius: 0.07, radiusEnd: 0.042, chain: ["thighR", "shinR", "footR"], material: "trousers" },

  /*
   * COLLAR AND SEAT OF THE TROUSERS.
   *
   * Two small pieces that do a lot of work now that a figure holds sixty pixels
   * rather than twenty-eight. At twenty-eight the shirt was a coloured area and
   * nothing more; at sixty the eye looks for where the garment ENDS, and a
   * collar at the neck is what tells it that this is a shirt tucked into
   * trousers rather than a two-tone body.
   *
   * The pelvis piece is TROUSERS, not the shoe material it once borrowed. It
   * spans a third of a unit — from below the hip joint to well above it — so
   * whatever colour it takes is worn as a wide band around the waist, and the
   * shoe pool contains light greys and browns as well as black. Rendered in a
   * shoe colour it read as an under-layer showing between the shirt and the
   * trousers, which is exactly the exposed inner clothing the uniform must
   * never show. Drawn in the trousers material it merges into them, the shirt
   * hem stays the one visible garment boundary, and the volume still fills the
   * pelvis so the seat of the trousers is continuous between the thigh tops.
   */
  { from: "neck", to: null, endOffset: [0, 0.03, 0], radius: 0.09, radiusEnd: 0.075, chain: ["chest", "neck"], squash: [1.14, 0.88], material: "shirt" },
  { from: "hips", to: null, endOffset: [0, 0.028, 0], radius: 0.157, radiusEnd: 0.155, chain: ["hips"], squash: [1.1, 0.72], material: "trousers" },

  /* SHOES, weighted to the foot alone so they roll with the ankle. */
  { from: "footL", to: null, endOffset: [0, -0.03, 0.115], radius: 0.052, radiusEnd: 0.044, chain: ["footL"], squash: [1.2, 1.0], material: "shoe" },
  { from: "footR", to: null, endOffset: [0, -0.03, 0.115], radius: 0.052, radiusEnd: 0.044, chain: ["footR"], squash: [1.2, 1.0], material: "shoe" },
];

/**
 * A tapered limb: a cone frustum with a rounded cap at each end.
 *
 * `CapsuleGeometry` cannot taper, and a body built from constant-radius tubes
 * reads as a balloon animal however well it is animated. Merging a cylinder
 * with two hemispherical caps gives the same soft joints while letting a thigh
 * be thicker than a knee. Returned non-indexed, because the merge below copies
 * only position and normal and an index would strand the triangles.
 */
function limbGeometry(rA: number, rB: number, length: number): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];

  const shaft = new THREE.CylinderGeometry(rB, rA, Math.max(0.001, length), 12, 1, true).toNonIndexed();
  parts.push(shaft);

  const capA = new THREE.SphereGeometry(rA, 12, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2).toNonIndexed();
  capA.translate(0, -length / 2, 0);
  parts.push(capA);

  const capB = new THREE.SphereGeometry(rB, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2).toNonIndexed();
  capB.translate(0, length / 2, 0);
  parts.push(capB);

  const pos: number[] = [];
  const nor: number[] = [];
  for (const g of parts) {
    const p = g.getAttribute("position");
    const n = g.getAttribute("normal");
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i));
      nor.push(n.getX(i), n.getY(i), n.getZ(i));
    }
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  return out;
}

/** Maximum bone influences per vertex — the three.js default skinning limit. */
export const MAX_INFLUENCES = 4;

/**
 * Distance from a point to a bone's own segment (the bone's origin to its
 * first child's origin), which is what a vertex should actually be weighted
 * against — a bone is a length, not a point.
 */
function boneSegment(name: BoneName): { a: THREE.Vector3; b: THREE.Vector3 } {
  const a = REST[name];
  const children = BONES.filter((n) => BONE_SPEC[n].parent === name);
  if (children.length === 0) return { a, b: a.clone().add(new THREE.Vector3(0, 0.08, 0)) };
  const b = new THREE.Vector3();
  for (const c of children) b.add(REST[c]);
  b.divideScalar(children.length);
  return { a, b };
}

const SEGMENTS = Object.fromEntries(BONES.map((n) => [n, boneSegment(n)])) as Record<
  BoneName,
  { a: THREE.Vector3; b: THREE.Vector3 }
>;

function distanceToSegment(p: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3): number {
  const ab = new THREE.Vector3().subVectors(b, a);
  const t = ab.lengthSq() === 0 ? 0 : THREE.MathUtils.clamp(new THREE.Vector3().subVectors(p, a).dot(ab) / ab.lengthSq(), 0, 1);
  return new THREE.Vector3().copy(a).addScaledVector(ab, t).distanceTo(p);
}

/**
 * The skinned body geometry, and the material group each piece belongs to.
 *
 * Built from capsules laid along the rest skeleton, merged into one buffer,
 * then skinned: every vertex takes the four nearest bones OF ITS OWN CHAIN,
 * weighted by inverse distance so the influence falls off smoothly across a
 * joint. Weights are normalised, so no vertex can be dragged by more or less
 * than exactly one bone's worth of motion.
 */
function buildBody(): { geometry: THREE.BufferGeometry; groups: { material: Piece["material"]; start: number; count: number }[] } {
  const positions: number[] = [];
  const normals: number[] = [];
  const skinIndices: number[] = [];
  const skinWeights: number[] = [];
  const groups: { material: Piece["material"]; start: number; count: number }[] = [];

  const up = new THREE.Vector3(0, 1, 0);

  for (const piece of PIECES) {
    const a = REST[piece.from];
    const b = piece.to
      ? REST[piece.to]
      : a.clone().add(new THREE.Vector3(...(piece.endOffset ?? [0, 0.1, 0])));
    const axis = new THREE.Vector3().subVectors(b, a);
    const length = axis.length();

    /*
     * `toNonIndexed()` is not optional. CapsuleGeometry is INDEXED, and this
     * merge copies only position and normal — so keeping the index would drop
     * the triangles on the floor and the whole body would render as nothing at
     * all. Expanding to a triangle soup first makes every three consecutive
     * vertices a face, which is what the per-vertex skinning below assumes too.
     */
    const geo = limbGeometry(piece.radius, piece.radiusEnd ?? piece.radius, length);
    if (piece.squash) geo.scale(piece.squash[0], 1, piece.squash[1]);
    /* CapsuleGeometry runs along +Y about the origin; stand it on the segment. */
    const quat = new THREE.Quaternion().setFromUnitVectors(up, axis.clone().normalize());
    geo.applyQuaternion(quat);
    geo.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);

    const pos = geo.getAttribute("position");
    const nor = geo.getAttribute("normal");
    const start = positions.length / 3;

    for (let i = 0; i < pos.count; i++) {
      const p = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
      positions.push(p.x, p.y, p.z);
      normals.push(nor.getX(i), nor.getY(i), nor.getZ(i));

      /* Four nearest bones of this piece's own chain, inverse-distance weighted. */
      const ranked = piece.chain
        .map((name) => {
          const seg = SEGMENTS[name];
          const d = distanceToSegment(p, seg.a, seg.b);
          return { name, w: 1 / Math.pow(d + 0.02, 3) };
        })
        .sort((x, y) => y.w - x.w)
        .slice(0, MAX_INFLUENCES);

      const total = ranked.reduce((s, r) => s + r.w, 0);
      for (let k = 0; k < MAX_INFLUENCES; k++) {
        const r = ranked[k];
        skinIndices.push(r ? BONES.indexOf(r.name) : 0);
        skinWeights.push(r ? r.w / total : 0);
      }
    }
    groups.push({ material: piece.material, start, count: pos.count });
    geo.dispose();
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(skinIndices, 4));
  geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(skinWeights, 4));

  /* One draw group per material, in piece order. */
  let offset = 0;
  const merged: { material: Piece["material"]; start: number; count: number }[] = [];
  for (const g of groups) {
    merged.push({ material: g.material, start: offset, count: g.count });
    offset += g.count;
  }
  for (const g of merged) geometry.addGroup(g.start, g.count, MATERIAL_SLOT[g.material]);

  geometry.computeBoundingSphere();
  return { geometry, groups: merged };
}

/** Material slot order on the skinned mesh: skin, shirt, trousers, shoe. */
export const MATERIAL_SLOT: Record<Piece["material"], number> = {
  skin: 0,
  shirt: 1,
  trousers: 2,
  shoe: 3,
};

export const BODY = buildBody();

/* ------------------------------------------------------------------ */
/* 3. The animation clips                                              */
/* ------------------------------------------------------------------ */

const euler = new THREE.Euler();
const quat = new THREE.Quaternion();
/** Quaternion components for an XYZ rotation, as a clip track wants them. */
function q(x: number, y = 0, z = 0): [number, number, number, number] {
  euler.set(x, y, z);
  quat.setFromEuler(euler);
  return [quat.x, quat.y, quat.z, quat.w];
}

interface TrackSpec {
  bone: BoneName;
  /** Rotation at each keyframe time, as XYZ Euler radians. */
  keys: [number, number, number][];
}

/**
 * A looping clip from per-bone Euler keyframes evenly spaced over `duration`.
 * The caller supplies the first pose again as the last keyframe, so the loop
 * closes exactly and a walk cycle never jumps at the wrap.
 */
function clipFrom(name: string, duration: number, specs: TrackSpec[], rootMotion?: number[][]): THREE.AnimationClip {
  const tracks: THREE.KeyframeTrack[] = [];
  for (const spec of specs) {
    const n = spec.keys.length;
    const times = Array.from({ length: n }, (_, i) => (i / (n - 1)) * duration);
    const values: number[] = [];
    for (const k of spec.keys) values.push(...q(k[0], k[1], k[2]));
    tracks.push(new THREE.QuaternionKeyframeTrack(`${spec.bone}.quaternion`, times, values));
  }
  if (rootMotion) {
    const n = rootMotion.length;
    const times = Array.from({ length: n }, (_, i) => (i / (n - 1)) * duration);
    const values: number[] = [];
    for (const p of rootMotion) values.push(REST.hips.x + p[0], REST.hips.y + p[1], REST.hips.z + p[2]);
    tracks.push(new THREE.VectorKeyframeTrack("hips.position", times, values));
  }
  return new THREE.AnimationClip(name, duration, tracks);
}

/**
 * WALK — one full cycle, two paces, over `WALK_CYCLE` seconds.
 *
 * Five keyframes: contact, passing, contact (mirrored), passing, contact
 * again. The arms swing opposite their own leg, the pelvis drops on each
 * passing pass and rolls toward the supporting leg, and the chest counters the
 * pelvis so the shoulders stay level — the four things that make a walk read
 * as a walk rather than as scissoring.
 */
export const WALK_CYCLE = 1.0;
const SWING = 0.62;
const KNEE = 0.9;
const ARM = 0.46;

/*
 * SIGN CONVENTION, derived rather than dialled in.
 *
 * A limb bone hangs along -Y from its joint. Rotating it by t about +X sends
 * that -Y direction to z' = -sin(t), so a POSITIVE rotation swings the limb
 * BACKWARD and a negative one swings it forward. The character's forward is
 * +Z, because the journey layer sets `rotation.y = atan2(dx, dz)`.
 *
 * Therefore: thigh forward is negative, knee flex (heel toward the seat) is
 * positive, ankle plantarflexion (toe down at push-off) is positive, and an
 * arm reaching forward is negative. Getting this backwards is exactly what
 * made the first version of the sit pose fold the knees behind the hips.
 */

export const WALK_CLIP = clipFrom(
  "Walk",
  WALK_CYCLE,
  [
    /* t=0 left heel strike; 0.25 left stance; 0.5 left toe-off; 0.75 left swing. */
    { bone: "thighL", keys: [[-SWING, 0, 0], [0, 0, 0], [SWING, 0, 0], [0, 0, 0], [-SWING, 0, 0]] },
    { bone: "shinL", keys: [[0.1, 0, 0], [0.06, 0, 0], [0.34, 0, 0], [KNEE, 0, 0], [0.1, 0, 0]] },
    { bone: "footL", keys: [[-0.2, 0, 0], [0.05, 0, 0], [0.34, 0, 0], [-0.06, 0, 0], [-0.2, 0, 0]] },

    { bone: "thighR", keys: [[SWING, 0, 0], [0, 0, 0], [-SWING, 0, 0], [0, 0, 0], [SWING, 0, 0]] },
    { bone: "shinR", keys: [[0.34, 0, 0], [KNEE, 0, 0], [0.1, 0, 0], [0.06, 0, 0], [0.34, 0, 0]] },
    { bone: "footR", keys: [[0.34, 0, 0], [-0.06, 0, 0], [-0.2, 0, 0], [0.05, 0, 0], [0.34, 0, 0]] },

    /* Each arm counter-swings its own leg. */
    { bone: "upperArmL", keys: [[ARM, 0, 0.07], [0, 0, 0.07], [-ARM, 0, 0.07], [0, 0, 0.07], [ARM, 0, 0.07]] },
    { bone: "foreArmL", keys: [[-0.2, 0, 0], [-0.34, 0, 0], [-0.5, 0, 0], [-0.34, 0, 0], [-0.2, 0, 0]] },
    { bone: "upperArmR", keys: [[-ARM, 0, -0.07], [0, 0, -0.07], [ARM, 0, -0.07], [0, 0, -0.07], [-ARM, 0, -0.07]] },
    { bone: "foreArmR", keys: [[-0.5, 0, 0], [-0.34, 0, 0], [-0.2, 0, 0], [-0.34, 0, 0], [-0.5, 0, 0]] },

    /* Pelvis rolls toward the supporting leg; the chest counters it so the
       shoulders stay level, which is what stops a walk reading as a march. */
    { bone: "hips", keys: [[0.02, -0.08, 0.03], [0.02, 0, 0], [0.02, 0.08, -0.03], [0.02, 0, 0], [0.02, -0.08, 0.03]] },
    { bone: "chest", keys: [[0, 0.09, 0], [0, 0, 0], [0, -0.09, 0], [0, 0, 0], [0, 0.09, 0]] },
    { bone: "head", keys: [[0, -0.05, 0], [0, 0, 0], [0, 0.05, 0], [0, 0, 0], [0, -0.05, 0]] },
  ],
  /* Pelvis rises on each contact and dips through each passing pass. */
  [[0, 0.012, 0], [0, -0.014, 0], [0, 0.012, 0], [0, -0.014, 0], [0, 0.012, 0]],
);

/**
 * IDLE — standing, breathing, shifting weight. Deliberately slow and small:
 * an employee waiting at their ride should look alive without looking fidgety.
 */
export const IDLE_CLIP = clipFrom(
  "Idle",
  4.0,
  [
    { bone: "chest", keys: [[0.01, 0, 0], [-0.022, 0, 0], [0.01, 0, 0], [-0.022, 0, 0], [0.01, 0, 0]] },
    { bone: "spine", keys: [[0, 0, 0.006], [0, 0, -0.008], [0, 0, 0.006], [0, 0, -0.008], [0, 0, 0.006]] },
    { bone: "head", keys: [[0, 0.04, 0], [0, -0.02, 0], [0.02, -0.05, 0], [0, 0.01, 0], [0, 0.04, 0]] },
    { bone: "hips", keys: [[0, 0, 0.014], [0, 0, -0.01], [0, 0, 0.014], [0, 0, -0.01], [0, 0, 0.014]] },
    { bone: "upperArmL", keys: [[0.03, 0, 0.1], [-0.02, 0, 0.115], [0.03, 0, 0.1], [-0.02, 0, 0.115], [0.03, 0, 0.1]] },
    { bone: "upperArmR", keys: [[-0.02, 0, -0.115], [0.03, 0, -0.1], [-0.02, 0, -0.115], [0.03, 0, -0.1], [-0.02, 0, -0.115]] },
    { bone: "foreArmL", keys: [[-0.16, 0, 0], [-0.2, 0, 0], [-0.16, 0, 0], [-0.2, 0, 0], [-0.16, 0, 0]] },
    { bone: "foreArmR", keys: [[-0.2, 0, 0], [-0.16, 0, 0], [-0.2, 0, 0], [-0.16, 0, 0], [-0.2, 0, 0]] },
  ],
  [[0, 0, 0], [0, -0.006, 0], [0, 0, 0], [0, -0.006, 0], [0, 0, 0]],
);

/**
 * SIT — thighs forward and knees folded so the figure is actually ON the
 * chair, not hovering over it.
 *
 * The pose is solved rather than dialled in: with the thigh rotated forward by
 * `SIT_HIP` and the shin folded back by `SIT_KNEE`, the hips end up
 * `THIGH * cos(SIT_HIP - pi/2)` above the feet... which is to say the pelvis
 * must be dropped to the chair's seat height for the pose to land on the seat.
 * `SIT_HIP_DROP` below is exactly that drop, so a seated employee's hips sit
 * at `PROP.chairSeatY` and their feet stay on the ground.
 */
export const SIT_HIP = -1.5; // thigh swung FORWARD (negative), just under 90 degrees
export const SIT_KNEE = 1.42; // shin folded down from the knee to the floor

export const SIT_CLIP = clipFrom(
  "Sit",
  5.0,
  [
    { bone: "thighL", keys: [[SIT_HIP, 0.05, 0], [SIT_HIP, 0.05, 0], [SIT_HIP, 0.05, 0]] },
    { bone: "shinL", keys: [[SIT_KNEE, 0, 0], [SIT_KNEE + 0.03, 0, 0], [SIT_KNEE, 0, 0]] },
    { bone: "footL", keys: [[0.06, 0, 0], [0.02, 0, 0], [0.06, 0, 0]] },
    { bone: "thighR", keys: [[SIT_HIP, -0.05, 0], [SIT_HIP, -0.05, 0], [SIT_HIP, -0.05, 0]] },
    { bone: "shinR", keys: [[SIT_KNEE + 0.03, 0, 0], [SIT_KNEE, 0, 0], [SIT_KNEE + 0.03, 0, 0]] },
    { bone: "footR", keys: [[0.02, 0, 0], [0.06, 0, 0], [0.02, 0, 0]] },

    /* Upright at the table, with a slow breath and a small look around. */
    { bone: "spine", keys: [[0.04, 0, 0], [0.015, 0, 0], [0.04, 0, 0]] },
    { bone: "chest", keys: [[-0.02, 0, 0], [-0.05, 0, 0], [-0.02, 0, 0]] },
    { bone: "head", keys: [[0.03, 0.09, 0], [0.01, -0.07, 0], [0.03, 0.09, 0]] },

    /* Forearms resting forward on the table. */
    { bone: "upperArmL", keys: [[-0.62, 0, 0.2], [-0.6, 0, 0.2], [-0.62, 0, 0.2]] },
    { bone: "foreArmL", keys: [[-0.72, 0, 0], [-0.76, 0, 0], [-0.72, 0, 0]] },
    { bone: "upperArmR", keys: [[-0.6, 0, -0.2], [-0.62, 0, -0.2], [-0.6, 0, -0.2]] },
    { bone: "foreArmR", keys: [[-0.76, 0, 0], [-0.72, 0, 0], [-0.76, 0, 0]] },
  ],
  /* The pelvis drops to seat height and settles back over the chair. */
  [
    [0, SIT_HIP_DROP(), -0.06],
    [0, SIT_HIP_DROP(), -0.06],
    [0, SIT_HIP_DROP(), -0.06],
  ],
);

/**
 * How far the pelvis must drop for a seated figure to meet the chair.
 *
 * Standing, the hips are at `H.hipY`. Seated, they should be at the chair's
 * seat height plus the thickness of the sitter. Declared as a function so the
 * clip above and the verification script derive it from the same expression.
 */
export function SIT_HIP_DROP(): number {
  const SEAT_Y = 0.45; // PROP.chairSeatY — imported by value to avoid a cycle
  const SITTER_RISE = 0.09; // pelvis centre above the seat surface
  return SEAT_Y + SITTER_RISE - H.hipY;
}

/**
 * How fast the walk clip carries the body over the ground, in metres a second.
 *
 * MEASURED from the clip rather than typed: the skeleton is posed across the
 * cycle, the widest ankle-to-ankle split is the pace length, and two paces make
 * one cycle. The park then plays the clip at
 * `groundSpeed / WALK_CLIP_SPEED` so the feet never slide — an employee walking
 * at the simulation's pace has their feet planted, and at 60x playback the legs
 * speed up instead of skating.
 */
function measureWalkPace(): number {
  const { root, bones } = createSkeletonBones();
  const holder = new THREE.Group();
  holder.add(root);
  const mixer = new THREE.AnimationMixer(holder);
  mixer.clipAction(WALK_CLIP).play();
  const byName = Object.fromEntries(bones.map((b) => [b.name, b])) as Record<BoneName, THREE.Bone>;
  let widest = 0;
  const SAMPLES = 48;
  for (let i = 0; i < SAMPLES; i++) {
    mixer.setTime((i / SAMPLES) * WALK_CYCLE);
    holder.updateMatrixWorld(true);
    const l = byName.footL.getWorldPosition(new THREE.Vector3());
    const r = byName.footR.getWorldPosition(new THREE.Vector3());
    widest = Math.max(widest, Math.abs(l.z - r.z));
  }
  return widest;
}

/** Pace length in metres — one step. Two of these make one WALK_CYCLE. */
export const WALK_PACE = measureWalkPace();
/** Ground speed the clip itself implies, in metres per second. */
export const WALK_CLIP_SPEED = (2 * WALK_PACE) / WALK_CYCLE;

/**
 * CLIMB — going up a flight of stairs.
 *
 * A walk and a climb are not the same movement, and the difference is exactly
 * what tells a viewer that a figure is on steps rather than on the ground: the
 * knee comes up far higher to clear the next tread, the foot lands flat rather
 * than heel-first, the torso leans into the climb, and the hands reach for the
 * handrail instead of swinging free. All four are here.
 *
 * Same five-keyframe structure as the walk — contact, passing, contact
 * mirrored, passing, contact again — and the same sign convention: thigh
 * forward is negative, knee flex positive, an arm reaching forward negative.
 * The first and last keyframes are identical, so the clip loops seamlessly
 * however long the flight is.
 *
 * The pelvis rises and falls over each step rather than dipping through the
 * passing pass as it does on the level: on stairs the body is lifted onto every
 * tread, which is the whole reason climbing is slower than walking.
 */
export const CLIMB_CYCLE = 1.1;
/** Thigh lifted to bring the knee up over the next tread. */
const CLIMB_LIFT = 1.05;
/** Shin folded under on the lift, and nearly straight on the push. */
const CLIMB_KNEE = 1.15;

export const CLIMB_CLIP = clipFrom(
  "Climb",
  CLIMB_CYCLE,
  [
    /* t=0 left foot planted on the tread; 0.25 push; 0.5 left foot swinging up. */
    { bone: "thighL", keys: [[-CLIMB_LIFT, 0, 0], [-0.45, 0, 0], [0.18, 0, 0], [-0.5, 0, 0], [-CLIMB_LIFT, 0, 0]] },
    { bone: "shinL", keys: [[CLIMB_KNEE, 0, 0], [0.42, 0, 0], [0.12, 0, 0], [CLIMB_KNEE + 0.1, 0, 0], [CLIMB_KNEE, 0, 0]] },
    { bone: "footL", keys: [[0.16, 0, 0], [0.04, 0, 0], [0.1, 0, 0], [0.3, 0, 0], [0.16, 0, 0]] },

    { bone: "thighR", keys: [[0.18, 0, 0], [-0.5, 0, 0], [-CLIMB_LIFT, 0, 0], [-0.45, 0, 0], [0.18, 0, 0]] },
    { bone: "shinR", keys: [[0.12, 0, 0], [CLIMB_KNEE + 0.1, 0, 0], [CLIMB_KNEE, 0, 0], [0.42, 0, 0], [0.12, 0, 0]] },
    { bone: "footR", keys: [[0.1, 0, 0], [0.3, 0, 0], [0.16, 0, 0], [0.04, 0, 0], [0.1, 0, 0]] },

    /* Hands on the rail: both arms forward, alternately reaching further. */
    { bone: "upperArmL", keys: [[-0.95, 0, 0.24], [-0.7, 0, 0.24], [-0.5, 0, 0.24], [-0.7, 0, 0.24], [-0.95, 0, 0.24]] },
    { bone: "foreArmL", keys: [[-0.34, 0, 0], [-0.5, 0, 0], [-0.62, 0, 0], [-0.5, 0, 0], [-0.34, 0, 0]] },
    { bone: "upperArmR", keys: [[-0.5, 0, -0.24], [-0.7, 0, -0.24], [-0.95, 0, -0.24], [-0.7, 0, -0.24], [-0.5, 0, -0.24]] },
    { bone: "foreArmR", keys: [[-0.62, 0, 0], [-0.5, 0, 0], [-0.34, 0, 0], [-0.5, 0, 0], [-0.62, 0, 0]] },

    /* Leaning into the climb, and looking up the flight. */
    { bone: "spine", keys: [[-0.2, 0, 0], [-0.24, 0, 0], [-0.2, 0, 0], [-0.24, 0, 0], [-0.2, 0, 0]] },
    { bone: "chest", keys: [[-0.1, 0.05, 0], [-0.06, 0, 0], [-0.1, -0.05, 0], [-0.06, 0, 0], [-0.1, 0.05, 0]] },
    { bone: "head", keys: [[0.16, -0.04, 0], [0.18, 0, 0], [0.16, 0.04, 0], [0.18, 0, 0], [0.16, -0.04, 0]] },
    { bone: "hips", keys: [[0.06, -0.06, 0.02], [0.06, 0, 0], [0.06, 0.06, -0.02], [0.06, 0, 0], [0.06, -0.06, 0.02]] },
  ],
  /* Hauled up onto each tread rather than dipping between paces. */
  [[0, -0.02, 0], [0, 0.016, 0], [0, -0.02, 0], [0, 0.016, 0], [0, -0.02, 0]],
);

export const CLIPS = { walk: WALK_CLIP, idle: IDLE_CLIP, sit: SIT_CLIP, climb: CLIMB_CLIP };

/* ------------------------------------------------------------------ */
/* 4. One employee's rig                                               */
/* ------------------------------------------------------------------ */

export interface RigMaterials {
  skin: THREE.Material;
  shirt: THREE.Material;
  trousers: THREE.Material;
  shoe: THREE.Material;
}

export interface EmployeeRig {
  /** The object to add to the scene. */
  group: THREE.Group;
  mesh: THREE.SkinnedMesh;
  skeleton: THREE.Skeleton;
  mixer: THREE.AnimationMixer;
  actions: {
    walk: THREE.AnimationAction;
    idle: THREE.AnimationAction;
    sit: THREE.AnimationAction;
    climb: THREE.AnimationAction;
  };
  bone: (name: BoneName) => THREE.Bone;
}

/**
 * A rig for one employee: shared geometry and shared clips, but this person's
 * own skeleton, own mixer and own materials — which is what lets thirty people
 * walk, wait and sit independently while costing one geometry upload.
 */
export function createEmployeeRig(materials: RigMaterials): EmployeeRig {
  const { root, bones } = createSkeletonBones();
  /*
   * The world matrices MUST be current before the Skeleton is built.
   * `new THREE.Skeleton()` snapshots each bone's `matrixWorld` to derive the
   * bind inverses, and a freshly-constructed bone's matrixWorld is still the
   * identity — build the skeleton first and every inverse is wrong, which
   * collapses the whole mesh into a spike at the origin.
   */
  root.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(bones);

  const mesh = new THREE.SkinnedMesh(BODY.geometry, [
    materials.skin,
    materials.shirt,
    materials.trousers,
    materials.shoe,
  ]);
  mesh.castShadow = true;
  mesh.frustumCulled = false;

  const group = new THREE.Group();
  group.add(root);
  group.add(mesh);
  mesh.bind(skeleton);

  const mixer = new THREE.AnimationMixer(mesh);
  const actions = {
    walk: mixer.clipAction(WALK_CLIP),
    idle: mixer.clipAction(IDLE_CLIP),
    sit: mixer.clipAction(SIT_CLIP),
    climb: mixer.clipAction(CLIMB_CLIP),
  };
  for (const a of Object.values(actions)) {
    a.setLoop(THREE.LoopRepeat, Infinity);
    a.enabled = true;
    a.setEffectiveWeight(0);
    a.play();
  }
  actions.idle.setEffectiveWeight(1);

  const byName = Object.fromEntries(bones.map((b) => [b.name, b])) as Record<BoneName, THREE.Bone>;

  return { group, mesh, skeleton, mixer, actions, bone: (n) => byName[n] };
}

/** Seconds a crossfade between two states takes. Short enough to feel reactive. */
export const FADE = 0.25;
