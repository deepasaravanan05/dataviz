/**
 * The employee character rig, checked as geometry rather than admired as art.
 *
 * The park is measured against the person standing in it, so a rig that is the
 * wrong height, whose feet sink into the paving, or whose seated pose floats
 * above the chair, silently breaks the scale of everything around it. Nothing
 * renders in the environment this is written in, so every claim about the rig
 * is re-derived here from the same module the park imports.
 *
 * What is proven:
 *   1. the skeleton is a real hierarchy at true human dimensions;
 *   2. every vertex is skinned — four influences, weights summing to one;
 *   3. the clips loop seamlessly, so a walk never jumps at the wrap;
 *   4. walking, the feet stay on the ground and the stride matches the pace
 *      the journey simulation actually moves the figure at;
 *   5. seated, the hips land on the chair and the feet reach the floor;
 *   6. thirty employees get thirty independent rigs, and one shared geometry.
 */
import * as THREE from "three";
import {
  BODY,
  BONES,
  BONE_SPEC,
  CLIPS,
  MAX_INFLUENCES,
  REST,
  REST_ANKLE_Y,
  SIT_HIP_DROP,
  WALK_CYCLE,
  createEmployeeRig,
  createSkeletonBones,
  type BoneName,
} from "../src/components/park/journey/humanRig";
import { HUMAN, PROP } from "../src/world/scale";
import { JOURNEY_EMPLOYEES } from "../src/simulation/journey/journey";
import { WALK_UNITS_PER_MINUTE } from "../src/simulation/journey/constants";

let failures = 0;
function check(label: string, ok: boolean, detail: string) {
  if (!ok) failures++;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${label} — ${detail}`);
}
const near = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol;

/* =============== 1. The skeleton is a real hierarchy =============== */

const built = createSkeletonBones();

check(
  "the rig is a bone hierarchy, not a flat list",
  built.bones.length === BONES.length &&
    built.root.name === "hips" &&
    BONES.filter((n) => BONE_SPEC[n].parent === null).length === 1,
  `${built.bones.length} bones under a single root`,
);

check(
  "every bone but the root has a parent that exists",
  BONES.every((n) => {
    const p = BONE_SPEC[n].parent;
    return p === null || BONES.includes(p);
  }),
  "no orphan bones",
);

check(
  "the skeleton is left/right symmetric",
  (["upperArm", "foreArm", "hand", "thigh", "shin", "foot", "shoulder"] as const).every((limb) => {
    const l = REST[`${limb}L` as BoneName];
    const r = REST[`${limb}R` as BoneName];
    return near(l.x, -r.x, 1e-9) && near(l.y, r.y, 1e-9) && near(l.z, r.z, 1e-9);
  }),
  "each left joint mirrors its right",
);

check(
  "the joints land on the park's own human dimensions",
  near(REST.hips.y, HUMAN.hipY, 1e-9) &&
    near(REST.head.y, HUMAN.headY, 1e-9) &&
    near(REST.shoulderL.y, HUMAN.shoulderY, 1e-9),
  `hips ${REST.hips.y.toFixed(3)}m = HUMAN.hipY, head ${REST.head.y.toFixed(3)}m = HUMAN.headY, ` +
    `shoulder ${REST.shoulderL.y.toFixed(3)}m = HUMAN.shoulderY`,
);

check(
  "the ankles stand on the ground, not in it",
  REST.footL.y > 0 && near(REST.footL.y, REST_ANKLE_Y, 1e-9),
  `ankle at ${REST.footL.y.toFixed(3)}m`,
);

check(
  "the figure is a 1.75 m person",
  near(REST.head.y + HUMAN.headRadius * 1.12 + 0.02, HUMAN.height, 0.06),
  `crown ≈ ${(REST.head.y + HUMAN.headRadius * 1.12).toFixed(2)}m against HUMAN.height ${HUMAN.height}m`,
);

/* =============== 2. Every vertex is properly skinned =============== */

const skinIndex = BODY.geometry.getAttribute("skinIndex");
const skinWeight = BODY.geometry.getAttribute("skinWeight");
const position = BODY.geometry.getAttribute("position");

check(
  "the body is one skinned buffer, not a pile of separate meshes",
  skinIndex.count === position.count && skinWeight.count === position.count && position.count > 500,
  `${position.count} vertices, each carrying ${MAX_INFLUENCES} bone influences`,
);

{
  let worstError = 0;
  let worstSum = 1;
  let unweighted = 0;
  let outOfRange = 0;
  for (let i = 0; i < skinWeight.count; i++) {
    const w = [skinWeight.getX(i), skinWeight.getY(i), skinWeight.getZ(i), skinWeight.getW(i)];
    const sum = w.reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1) > worstError) {
      worstError = Math.abs(sum - 1);
      worstSum = sum;
    }
    if (sum < 1e-6) unweighted++;
    const idx = [skinIndex.getX(i), skinIndex.getY(i), skinIndex.getZ(i), skinIndex.getW(i)];
    if (idx.some((v) => v < 0 || v >= BONES.length)) outOfRange++;
  }
  check(
    "every vertex's weights sum to exactly one",
    worstError < 1e-5 && unweighted === 0,
    `worst sum ${worstSum.toFixed(6)}, ${unweighted} unweighted vertices`,
  );
  check(
    "every bone index addresses a bone that exists",
    outOfRange === 0,
    `${BONES.length} bones, 0 out-of-range indices`,
  );
}

check(
  "the body is made of whole triangles that will actually rasterise",
  BODY.geometry.getIndex() === null &&
    position.count % 3 === 0 &&
    position.count / 3 > 300,
  `${position.count / 3} triangles in a non-indexed buffer — three consecutive vertices make a face`,
);

check(
  "the body occupies the volume a person occupies",
  (() => {
    BODY.geometry.computeBoundingBox();
    const bb = BODY.geometry.boundingBox!;
    const height = bb.max.y - bb.min.y;
    const width = bb.max.x - bb.min.x;
    /* Head, face and hair ride the head bone separately, so the skinned body
       runs from the soles to the base of the skull. */
    return height > 1.3 && height < HUMAN.height && width > 0.3 && width < 0.75 && bb.min.y > -0.02;
  })(),
  (() => {
    const bb = BODY.geometry.boundingBox!;
    return `${(bb.max.y - bb.min.y).toFixed(2)}m tall, ${(bb.max.x - bb.min.x).toFixed(2)}m across, ` +
      `soles at ${bb.min.y.toFixed(3)}m`;
  })(),
);

check(
  "the mesh is drawn in four material groups — skin, shirt, trousers, shoes",
  BODY.geometry.groups.length === BODY.groups.length &&
    new Set(BODY.geometry.groups.map((g) => g.materialIndex)).size === 4,
  `${BODY.geometry.groups.length} draw groups over 4 materials`,
);

/* ---- the bind pose must be the rest pose ---- */
{
  /*
   * Skin the mesh by hand at rest and compare against the geometry it was
   * built from. If the skeleton's bind inverses are wrong — the classic
   * mistake is constructing THREE.Skeleton before the bones' world matrices
   * have been updated — every vertex lands somewhere else and the character
   * collapses. Anything above a hair's width here means a broken rig.
   */
  const mat = () => new THREE.MeshStandardMaterial();
  const rig = createEmployeeRig({ skin: mat(), shirt: mat(), trousers: mat(), shoe: mat() });
  rig.group.updateMatrixWorld(true);
  rig.skeleton.update();

  const posAttr = BODY.geometry.getAttribute("position");
  const si = BODY.geometry.getAttribute("skinIndex");
  const sw = BODY.geometry.getAttribute("skinWeight");
  const bindInv = rig.mesh.bindMatrixInverse;
  const bindMat = rig.mesh.bindMatrix;

  let worst = 0;
  const v = new THREE.Vector3();
  const skinned = new THREE.Vector3();
  const temp = new THREE.Vector3();
  const boneMat = new THREE.Matrix4();
  for (let i = 0; i < posAttr.count; i += 7) {
    v.fromBufferAttribute(posAttr, i).applyMatrix4(bindMat);
    skinned.set(0, 0, 0);
    for (let k = 0; k < 4; k++) {
      const w = sw.getComponent(i, k);
      if (w === 0) continue;
      const b = si.getComponent(i, k);
      boneMat.multiplyMatrices(rig.skeleton.bones[b].matrixWorld, rig.skeleton.boneInverses[b]);
      temp.copy(v).applyMatrix4(boneMat);
      skinned.addScaledVector(temp, w);
    }
    skinned.applyMatrix4(bindInv);
    worst = Math.max(worst, skinned.distanceTo(temp.fromBufferAttribute(posAttr, i)));
  }
  check(
    "at rest the skinned mesh lands exactly on the geometry it was built from",
    worst < 1e-4,
    `worst vertex drift ${(worst * 1000).toFixed(4)} mm — the bind pose IS the rest pose`,
  );
}

/* =============== 3. Clips loop seamlessly =============== */

for (const [name, clip] of Object.entries(CLIPS)) {
  let worst = 0;
  for (const track of clip.tracks) {
    const stride = track.getValueSize();
    const n = track.times.length;
    for (let k = 0; k < stride; k++) {
      const first = track.values[k];
      const last = track.values[(n - 1) * stride + k];
      worst = Math.max(worst, Math.abs(first - last));
    }
  }
  check(
    `the ${name} clip closes its loop exactly`,
    worst < 1e-9,
    `first and last keyframe differ by ${worst.toExponential(1)} across ${clip.tracks.length} tracks`,
  );
}

check(
  "the walk drives the whole body, not just the legs",
  (() => {
    const driven = new Set(CLIPS.walk.tracks.map((t) => t.name.split(".")[0]));
    return ["thighL", "thighR", "shinL", "shinR", "upperArmL", "upperArmR", "hips", "chest"].every((b) =>
      driven.has(b),
    );
  })(),
  `${new Set(CLIPS.walk.tracks.map((t) => t.name.split(".")[0])).size} bones animated in the walk cycle`,
);

check(
  "the arms swing opposite their own leg",
  (() => {
    const thighL = CLIPS.walk.tracks.find((t) => t.name === "thighL.quaternion")!;
    const armL = CLIPS.walk.tracks.find((t) => t.name === "upperArmL.quaternion")!;
    /* Compare the x component of the first keyframe: opposite signs = counter-swing. */
    return thighL.values[0] * armL.values[0] < 0;
  })(),
  "left thigh forward while the left arm is back — a walk, not a march",
);

/* =============== 4. The walk, posed =============== */

/**
 * Pose the skeleton at time `t` of a clip and return world positions.
 * This is the real three.js animation path — mixer, clip, bindings — so what
 * is measured here is exactly what the park will draw.
 */
function poseAt(clip: THREE.AnimationClip, t: number): Record<BoneName, THREE.Vector3> {
  const { root, bones } = createSkeletonBones();
  const holder = new THREE.Group();
  holder.add(root);
  const mixer = new THREE.AnimationMixer(holder);
  const action = mixer.clipAction(clip);
  action.play();
  mixer.setTime(t);
  holder.updateMatrixWorld(true);
  const out = {} as Record<BoneName, THREE.Vector3>;
  for (const b of bones) out[b.name as BoneName] = b.getWorldPosition(new THREE.Vector3());
  return out;
}

{
  const SAMPLES = 60;
  let lowestFoot = Infinity;
  let highestFoot = -Infinity;
  let maxStride = 0;
  let headBob = { min: Infinity, max: -Infinity };

  for (let i = 0; i < SAMPLES; i++) {
    const p = poseAt(CLIPS.walk, (i / SAMPLES) * WALK_CYCLE);
    lowestFoot = Math.min(lowestFoot, p.footL.y, p.footR.y);
    highestFoot = Math.max(highestFoot, p.footL.y, p.footR.y);
    maxStride = Math.max(maxStride, Math.abs(p.footL.z - p.footR.z));
    headBob = { min: Math.min(headBob.min, p.head.y), max: Math.max(headBob.max, p.head.y) };
  }

  check(
    "walking, no foot is ever driven below the ground",
    lowestFoot > 0,
    `lowest ankle through the cycle ${lowestFoot.toFixed(3)}m`,
  );
  check(
    "walking, the feet actually leave the ground",
    highestFoot - lowestFoot > 0.05,
    `ankle rises ${(highestFoot - lowestFoot).toFixed(3)}m between contact and passing`,
  );
  check(
    "the stride is a human stride, and matches the pace the simulation walks at",
    (() => {
      /* Two paces per cycle; the park walks people at WALK_UNITS_PER_MINUTE m/min. */
      const paceLength = maxStride;
      const cadenceCyclesPerMin = WALK_UNITS_PER_MINUTE / (2 * paceLength);
      /* A person walks at roughly 45–70 full cycles a minute. */
      return paceLength > 0.4 && paceLength < 1.1 && cadenceCyclesPerMin > 35 && cadenceCyclesPerMin < 80;
    })(),
    `pace ${maxStride.toFixed(2)}m, i.e. ${(WALK_UNITS_PER_MINUTE / (2 * maxStride)).toFixed(0)} cycles/min ` +
      `at the park's ${WALK_UNITS_PER_MINUTE.toFixed(0)} m/min walking pace`,
  );
  check(
    "the head bobs, but only as much as a head bobs",
    headBob.max - headBob.min > 0.005 && headBob.max - headBob.min < 0.08,
    `${((headBob.max - headBob.min) * 100).toFixed(1)}cm of vertical head travel`,
  );
}

/* =============== 5. The seated pose meets the chair =============== */

{
  const p = poseAt(CLIPS.sit, 1.0);
  check(
    "seated, the hips land on the chair seat",
    near(p.hips.y, PROP.chairSeatY + 0.09, 0.02),
    `hips at ${p.hips.y.toFixed(3)}m against a ${PROP.chairSeatY}m seat (drop ${SIT_HIP_DROP().toFixed(3)}m)`,
  );
  check(
    "seated, the knees are bent forward — a sit, not a hover",
    p.shinL.z > p.hips.z + 0.2 && p.shinR.z > p.hips.z + 0.2,
    `knees ${(p.shinL.z - p.hips.z).toFixed(2)}m in front of the hips`,
  );
  check(
    "seated, the feet still reach the floor",
    p.footL.y > 0 && p.footL.y < 0.2 && p.footR.y > 0 && p.footR.y < 0.2,
    `ankles at ${p.footL.y.toFixed(3)}m / ${p.footR.y.toFixed(3)}m`,
  );
  check(
    "seated, the torso stays upright",
    p.head.y > p.hips.y + 0.55,
    `head ${(p.head.y - p.hips.y).toFixed(2)}m above the hips`,
  );
  check(
    "a seated figure is shorter than a standing one",
    p.head.y < REST.head.y - 0.25,
    `head drops from ${REST.head.y.toFixed(2)}m standing to ${p.head.y.toFixed(2)}m seated`,
  );
}

/* =============== 6. Thirty employees, thirty rigs, one geometry =============== */

{
  const mat = () => new THREE.MeshStandardMaterial();
  const rigs = JOURNEY_EMPLOYEES.map(() =>
    createEmployeeRig({ skin: mat(), shirt: mat(), trousers: mat(), shoe: mat() }),
  );

  check(
    "exactly one rig per employee in the roster",
    rigs.length === 30 && JOURNEY_EMPLOYEES.length === 30,
    `${rigs.length} rigs for ${JOURNEY_EMPLOYEES.length} employees`,
  );
  check(
    "every employee has their OWN skeleton and mixer",
    new Set(rigs.map((r) => r.skeleton)).size === rigs.length &&
      new Set(rigs.map((r) => r.mixer)).size === rigs.length,
    "thirty independent poses — nobody walks in lockstep with anybody else",
  );
  check(
    "all thirty share one geometry upload",
    new Set(rigs.map((r) => r.mesh.geometry)).size === 1,
    `one BufferGeometry of ${position.count} vertices, instanced thirty times`,
  );
  check(
    "every rig starts idle, with walk and sit ready to fade in",
    rigs.every(
      (r) =>
        r.actions.idle.getEffectiveWeight() === 1 &&
        r.actions.walk.getEffectiveWeight() === 0 &&
        r.actions.sit.getEffectiveWeight() === 0 &&
        r.actions.walk.isRunning(),
    ),
    "all three actions playing, blended by weight rather than started and stopped",
  );
  check(
    "the bones are addressable by name for the hair and the name plate",
    rigs.every((r) => r.bone("head") !== undefined && r.bone("chest") !== undefined),
    "head and chest bones resolve on every rig",
  );
}

console.log(
  `\nRig: ${BONES.length} bones, ${position.count} skinned vertices, ` +
    `clips ${Object.entries(CLIPS).map(([n, c]) => `${n} ${c.duration.toFixed(1)}s`).join(", ")}.`,
);
console.log(
  failures === 0 ? "\nOK: employee character rig verified." : `\n${failures} CHECK(S) FAILED`,
);
process.exit(failures === 0 ? 0 : 1);
