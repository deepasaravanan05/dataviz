import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Vector3 } from "three";
import { TRACK_CURVE, TRACK_LENGTH } from "../src/components/park-train/trainTrack";
import { carTransform, createCarTransform, CAR_RIDE_HEIGHT } from "../src/components/park-train/trainKinematics";
import {
  CARRIAGE_COUNT,
  CAR_LENGTH,
  CAR_RAIL_HEIGHT,
  CAR_SPACING,
  CAR_WIDTH,
  RAIL_Y,
  RIDER_COUNT,
  SEATS_PER_CARRIAGE,
  TRACK_CENTER,
  TRACK_RADIUS_X,
  TRACK_RADIUS_Z,
  WHEEL_RADIUS,
} from "../src/components/park-train/constants";
import { TRAIN_RIDERS, validateRiders } from "../src/components/park-train/riders";
import { WHEEL_RADIUS as FERRIS_WHEEL_RADIUS, BASE_WIDTH, BASE_DEPTH } from "../src/components/ferris-wheel/constants";
import { CABINS } from "../src/components/ferris-wheel/cabinManifest";
import { COASTER_ORIGIN } from "../src/components/roller-coaster/constants";
import { MONSTER_ORIGIN, RIDE_REACH } from "../src/components/monster-ride/constants";

let failures = 0;
function check(label: string, ok: boolean, detail: string) {
  if (!ok) failures++;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${label} — ${detail}`);
}

validateRiders();

// ---------- Riders ----------
check("rider count", TRAIN_RIDERS.length === RIDER_COUNT, `${TRAIN_RIDERS.length}`);
check(
  "20 total seats (4 cars x 5 seats), per the requested open-view spec",
  RIDER_COUNT === 20,
  `${CARRIAGE_COUNT}x${SEATS_PER_CARRIAGE}=${RIDER_COUNT}`,
);
check(
  "carriages x seats matches RIDER_COUNT",
  CARRIAGE_COUNT * SEATS_PER_CARRIAGE === RIDER_COUNT,
  `${CARRIAGE_COUNT}x${SEATS_PER_CARRIAGE}=${CARRIAGE_COUNT * SEATS_PER_CARRIAGE}`,
);
const uniqueIds = new Set(TRAIN_RIDERS.map((r) => r.employeeId));
check("employee IDs unique", uniqueIds.size === TRAIN_RIDERS.length, `${uniqueIds.size}`);
check(
  "no rider marked as work-started by this ride (business rule)",
  !("state" in TRAIN_RIDERS[0]) && !("workStarted" in TRAIN_RIDERS[0]),
  "TrainRider has no work-started state field — the train cannot set it",
);

const componentsDir = join(__dirname, "..", "src", "components", "park-train");

// ---------- Structural: passenger compartments have no roof/canopy (§3) ----------
const carriageSrc = readFileSync(join(componentsDir, "Carriage.tsx"), "utf8");
check(
  "Carriage.tsx has no roof/canopy mesh",
  !/PALETTE\.roof/.test(carriageSrc),
  "no reference to the roof colour — the locomotive's driver canopy is the only roof in the train",
);

// ---------- Structural: no stray height offset can reintroduce floating (regression) ----------
// The previous revision floated the whole train 0.42u above the rail because
// Locomotive.tsx/Carriage.tsx wrapped their contents (including the wheels)
// in a second `<group position={[0, CHASSIS_CLEARANCE, 0]}>` on top of the
// kinematics-computed height. Rather than re-deriving the same formula in
// isolation (which is exactly what passed last time despite the bug), this
// reads the actual component source and confirms the root group carries no
// position offset at all — wheels must be direct descendants at local y=0.
for (const file of ["Locomotive.tsx", "Carriage.tsx"]) {
  const src = readFileSync(join(componentsDir, file), "utf8");
  const returnMatch = src.match(/return \(\s*<group>/);
  check(
    `${file}: root group has no extra height offset`,
    Boolean(returnMatch),
    returnMatch ? "root <group> is unpositioned" : "root group carries a position prop — would double-offset height",
  );
  check(
    `${file}: no leftover CHASSIS_CLEARANCE reference`,
    !src.includes("CHASSIS_CLEARANCE"),
    "clean",
  );
}

// ---------- Track shape: closed loop, not a straight line, no ride is a corner ----------
check("track is a closed loop", TRACK_CURVE.closed, `circumference ${TRACK_LENGTH.toFixed(1)}u`);

const SAMPLES = 2000;
const trackPoints = Array.from({ length: SAMPLES }, (_, i) => TRACK_CURVE.getPointAt(i / SAMPLES));

const xs = trackPoints.map((p) => p.x);
const zs = trackPoints.map((p) => p.z);
const xSpan = Math.max(...xs) - Math.min(...xs);
const zSpan = Math.max(...zs) - Math.min(...zs);
check("loop spans both X and Z (not a straight line)", xSpan > 100 && zSpan > 100, `xSpan=${xSpan.toFixed(0)} zSpan=${zSpan.toFixed(0)}`);
check("loop matches designed ellipse size", Math.abs(xSpan - 2 * TRACK_RADIUS_X) < 2 && Math.abs(zSpan - 2 * TRACK_RADIUS_Z) < 2, `expected ${2 * TRACK_RADIUS_X}x${2 * TRACK_RADIUS_Z}`);

// ---------- Clearance from every existing ride, at every sampled track point ----------
function distToBox(x: number, z: number, box: { minX: number; maxX: number; minZ: number; maxZ: number }) {
  const dx = Math.max(box.minX - x, 0, x - box.maxX);
  const dz = Math.max(box.minZ - z, 0, z - box.maxZ);
  return Math.hypot(dx, dz);
}

const ferrisReach = Math.max(FERRIS_WHEEL_RADIUS, BASE_WIDTH / 2, BASE_DEPTH / 2);
const rideBoxes = {
  "Ferris Wheel": { minX: -ferrisReach, maxX: ferrisReach, minZ: -ferrisReach, maxZ: ferrisReach },
  "Roller Coaster": { minX: COASTER_ORIGIN[0] - 30, maxX: COASTER_ORIGIN[0] + 34, minZ: -24, maxZ: 24 },
  "Monster Ride": {
    minX: MONSTER_ORIGIN[0] - RIDE_REACH,
    maxX: MONSTER_ORIGIN[0] + RIDE_REACH,
    minZ: MONSTER_ORIGIN[2] - RIDE_REACH,
    maxZ: MONSTER_ORIGIN[2] + RIDE_REACH,
  },
};

const MIN_TRACK_CLEARANCE = 10;
for (const [name, box] of Object.entries(rideBoxes)) {
  const minDist = Math.min(...trackPoints.map((p) => distToBox(p.x, p.z, box)));
  check(`track clears ${name}`, minDist > MIN_TRACK_CLEARANCE, `${minDist.toFixed(1)}u (need > ${MIN_TRACK_CLEARANCE}u)`);
}

const cabinDistances = CABINS.map((c) => Math.hypot(c.mount[0], c.mount[1]));
const maxCabinReach = Math.max(...cabinDistances);
const minTrackDistFromOrigin = Math.min(...trackPoints.map((p) => Math.hypot(p.x, p.z)));
check(
  "track clears every Ferris Wheel cabin",
  minTrackDistFromOrigin > maxCabinReach + MIN_TRACK_CLEARANCE,
  `closest track point ${minTrackDistFromOrigin.toFixed(1)}u from origin vs farthest cabin ${maxCabinReach.toFixed(1)}u`,
);

// ---------- Train never intersects a ride, at every point along its run (now with the larger train width) ----------
const trainReach = CAR_WIDTH / 2 + 0.3;
for (const [name, box] of Object.entries(rideBoxes)) {
  const minDist = Math.min(...trackPoints.map((p) => distToBox(p.x, p.z, box))) - trainReach;
  check(`train body clears ${name}`, minDist > 5, `${minDist.toFixed(1)}u margin after train width (${CAR_WIDTH}u wide)`);
}

// ---------- Kinematics: position/orientation from the real production code ----------
const t = createCarTransform();
const kinSamples = Array.from({ length: SAMPLES }, (_, i) => {
  carTransform(i / SAMPLES, t);
  return { pos: t.position.clone(), quat: t.quaternion.clone() };
});

check(
  "car ride height constant and correct (never sinks, never floats)",
  kinSamples.every((s) => Math.abs(s.pos.y - CAR_RIDE_HEIGHT) < 1e-9),
  `CAR_RIDE_HEIGHT=${CAR_RIDE_HEIGHT.toFixed(3)} (rail ${RAIL_Y} + wheel radius ${WHEEL_RADIUS})`,
);
const wheelBottomY = CAR_RIDE_HEIGHT - WHEEL_RADIUS;
check("wheel bottom sits exactly on the rail (not below ground)", Math.abs(wheelBottomY - RAIL_Y) < 1e-9, `wheel bottom y=${wheelBottomY.toFixed(3)}, rail y=${RAIL_Y}`);

let maxTangentErr = 0;
for (let i = 0; i < SAMPLES; i++) {
  const tangent = TRACK_CURVE.getTangentAt(i / SAMPLES);
  tangent.y = 0;
  tangent.normalize();
  const localForward = new Vector3(0, 0, 1).applyQuaternion(kinSamples[i].quat);
  maxTangentErr = Math.max(maxTangentErr, 1 - tangent.dot(localForward));
}
check("train orientation follows track tangent through every curve", maxTangentErr < 1e-3, `max angular error ${maxTangentErr.toExponential(2)}`);

let maxStep = 0;
for (let i = 0; i < SAMPLES; i++) {
  maxStep = Math.max(maxStep, kinSamples[i].pos.distanceTo(kinSamples[(i + 1) % SAMPLES].pos));
}
const avgStep = TRACK_LENGTH / SAMPLES;
check("no teleporting between samples", maxStep < avgStep * 3, `max step ${maxStep.toFixed(3)}u vs avg ${avgStep.toFixed(3)}u`);

// ---------- Carriage spacing: never overlap, never drift apart, across the whole loop ----------
const spacingU = CAR_SPACING / TRACK_LENGTH;
const a = createCarTransform();
const b = createCarTransform();
let minGap = Infinity;
let maxGap = 0;
for (let s = 0; s < 400; s++) {
  const base = s / 400;
  for (let c = 0; c < CARRIAGE_COUNT; c++) {
    carTransform(base - c * spacingU, a);
    carTransform(base - (c + 1) * spacingU, b);
    const d = a.position.distanceTo(b.position);
    minGap = Math.min(minGap, d);
    maxGap = Math.max(maxGap, d);
  }
}
check("carriages never overlap (gap exceeds car length)", minGap > CAR_LENGTH, `closest gap ${minGap.toFixed(2)}u vs car length ${CAR_LENGTH}u`);
check("carriages never drift apart", maxGap < CAR_SPACING * 1.1, `widest gap ${maxGap.toFixed(2)}u vs spacing ${CAR_SPACING}`);

// ---------- Open-top design: guard-rail height stays well below a seated rider's head ----------
// SeatedRider's head centre sits at floorY + 0.19 (seat mount in Carriage.tsx)
// + 0.04 (torso offset) + 0.66 (head local y) ~= floorY + 0.89; the rail
// height must be comfortably below that.
const seatedHeadHeightAboveFloor = 0.19 + 0.04 + 0.66;
check(
  "guard-rail sits below a seated employee's head (open, not enclosing)",
  CAR_RAIL_HEIGHT < seatedHeadHeightAboveFloor - 0.15,
  `rail height ${CAR_RAIL_HEIGHT}u vs seated head height ~${seatedHeadHeightAboveFloor.toFixed(2)}u above the floor`,
);

// ---------- Loop actually passes near each named ride ----------
function nearestApproach(origin: [number, number]) {
  return Math.min(...trackPoints.map((p) => Math.hypot(p.x - origin[0], p.z - origin[1])));
}
console.log(
  `\nNearest track approach — Ferris Wheel: ${nearestApproach([0, 0]).toFixed(1)}u, ` +
    `Roller Coaster: ${nearestApproach([COASTER_ORIGIN[0], COASTER_ORIGIN[2]]).toFixed(1)}u, ` +
    `Monster Ride: ${nearestApproach([MONSTER_ORIGIN[0], MONSTER_ORIGIN[2]]).toFixed(1)}u`,
);
console.log(`Loop centre (${TRACK_CENTER[0]}, ${TRACK_CENTER[1]}), circumference ${TRACK_LENGTH.toFixed(1)}u`);
console.log(`Train: locomotive + ${CARRIAGE_COUNT} carriages, ${RIDER_COUNT} riders, ${CAR_WIDTH}u wide x ${CAR_LENGTH}u long each`);

console.log(failures === 0 ? "\nOK: park train and its loop verified." : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
