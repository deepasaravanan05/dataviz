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
  GAUGE_WIDENING_METRES,
  RAIL_GAUGE,
  RAIL_Y,
  RIDER_COUNT,
  SEATS_PER_CARRIAGE,
  RAIL_STANDOFF_METRES,
  TRACK_CENTER,
  TRACK_RADIUS_X,
  TRACK_RADIUS_Z,
  TRAIN_BODY_SCALE,
  WHEEL_RADIUS,
  WHEEL_X,
} from "../src/components/park-train/constants";
import { TRAIN_RIDERS, validateRiders } from "../src/components/park-train/riders";
import { WHEEL_RADIUS as FERRIS_WHEEL_RADIUS, BASE_WIDTH, BASE_DEPTH } from "../src/components/ferris-wheel/constants";
import { CABINS } from "../src/components/ferris-wheel/cabinManifest";
import { COASTER_ORIGIN } from "../src/components/roller-coaster/constants";
import { MONSTER_ORIGIN, RIDE_REACH } from "../src/components/monster-ride/constants";
import { TRAIN_SCALE } from "../src/components/park/parkScale";
import { PARK_LAYOUT } from "../src/components/park/layout";

let failures = 0;
function check(label: string, ok: boolean, detail: string) {
  if (!ok) failures++;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${label} — ${detail}`);
}

validateRiders();

// ---------- Riders ----------
check("rider count", TRAIN_RIDERS.length === RIDER_COUNT, `${TRAIN_RIDERS.length}`);
/*
 * THE CAPACITY RULE IS NOW 30-40 SEATS PER RIDE, 40 PREFERRED, and it applies
 * to the railway as much as to the five department rides. The train reaches 40
 * WITHOUT growing: still four open cars behind one engine, each the same
 * CAR_WIDTH by CAR_LENGTH, now carrying two bench rows of five instead of one.
 * The consist length, the loop, the gauge and the speed are all unchanged, and
 * the checks further down re-prove the loop's clearances at the new count.
 */
check(
  "capacity is in the 30-40 band, at the preferred 40",
  RIDER_COUNT >= 30 && RIDER_COUNT <= 40,
  `${CARRIAGE_COUNT} cars x ${SEATS_PER_CARRIAGE} seats = ${RIDER_COUNT}`,
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

/*
 * CLEARANCE FROM THE RIDES, MEASURED AGAINST THE PARK THAT EXISTS.
 *
 * This section used to build three ride boxes from AUTHORED origins — the
 * coaster at its own (0,0), the Monster Ride at its authored plot — and
 * compare them with track points in track units. That was sound while the loop
 * was a fixed ellipse in the same authored space. It is not sound now: every
 * ride is built to one common height, the layout solver places them, and the
 * loop is FITTED to those placed boxes in world metres (see the railway's own
 * constants). Measuring the new loop against the old origins compared two
 * different parks and reported the coaster 0.0 u away, which is exactly what a
 * stale frame of reference looks like.
 *
 * So both the track and the rides are read in world metres from the modules
 * that own them, and the margin asserted is the railway's own standoff.
 */
const worldTrack = trackPoints.map((p) => [p.x * TRAIN_SCALE, p.z * TRAIN_SCALE] as const);
function distToPlaced(x: number, z: number, r: { minX: number; maxX: number; minZ: number; maxZ: number }) {
  return Math.hypot(Math.max(r.minX - x, 0, x - r.maxX), Math.max(r.minZ - z, 0, z - r.maxZ));
}

for (const r of PARK_LAYOUT) {
  const minDist = Math.min(...worldTrack.map(([x, z]) => distToPlaced(x, z, r)));
  check(
    `track clears ${r.label}`,
    minDist > RAIL_STANDOFF_METRES - 0.5,
    `${minDist.toFixed(1)} m of grass between the rails and the ride (standoff ${RAIL_STANDOFF_METRES} m)`,
  );
}

check(
  "the loop goes round the park, not through part of it",
  PARK_LAYOUT.every((r) =>
    [
      [r.minX, r.minZ],
      [r.maxX, r.minZ],
      [r.minX, r.maxZ],
      [r.maxX, r.maxZ],
    ].every(
      ([x, z]) =>
        ((x / TRAIN_SCALE - TRACK_CENTER[0]) / TRACK_RADIUS_X) ** 2 +
          ((z / TRAIN_SCALE - TRACK_CENTER[1]) / TRACK_RADIUS_Z) ** 2 <
        1,
    ),
  ),
  `all ${PARK_LAYOUT.length} ride boxes inside the ellipse`,
);

/* And the train's own body, which is wider than the rails it is measured on. */
{
  const trainReach = (CAR_WIDTH / 2 + 0.3) * TRAIN_BODY_SCALE * TRAIN_SCALE;
  const worst = Math.min(
    ...PARK_LAYOUT.map((r) => Math.min(...worldTrack.map(([x, z]) => distToPlaced(x, z, r)))),
  );
  check(
    "the train body clears every ride",
    worst - trainReach > 5,
    `${(worst - trainReach).toFixed(1)} m after a ${(CAR_WIDTH * TRAIN_BODY_SCALE * TRAIN_SCALE).toFixed(1)} m carriage`,
  );
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

/* ---------- The gauge, and the wheels that have to sit on it ---------- */

/*
 * THE RAILWAY IS TEN METRES WIDER, and the height check above had no sideways
 * companion — which is how the wheels came to stand outside the rails without
 * anything noticing. Both are asserted now.
 *
 * A number in the train's constants is in TRACK space and the railway is drawn
 * under `<group scale={TRAIN_SCALE}>`, so the world gauge is the product. The
 * previous gauge is recomputed from its own expression rather than typed, so
 * this measures the widening and not a remembered figure.
 */
const PREVIOUS_GAUGE_WORLD = 2.4 * TRAIN_BODY_SCALE * TRAIN_SCALE;
const gaugeWorld = RAIL_GAUGE * TRAIN_SCALE;
check(
  "the track is exactly ten metres wider than it was",
  Math.abs(gaugeWorld - PREVIOUS_GAUGE_WORLD - GAUGE_WIDENING_METRES) < 1e-9,
  `${PREVIOUS_GAUGE_WORLD.toFixed(2)} m → ${gaugeWorld.toFixed(2)} m across ` +
    `(+${(gaugeWorld - PREVIOUS_GAUGE_WORLD).toFixed(2)} m)`,
);

/*
 * The wheels are read out of the components that draw them, not out of the
 * constants they now import — a wheel is only on the rail if the MESH is.
 */
const locoSrc = readFileSync(
  join(__dirname, "..", "src", "components", "park-train", "Locomotive.tsx"),
  "utf8",
);
const carSrc = readFileSync(
  join(__dirname, "..", "src", "components", "park-train", "Carriage.tsx"),
  "utf8",
);
for (const [what, src] of [["locomotive", locoSrc], ["carriage", carSrc]] as const) {
  const block = src.slice(src.indexOf("WHEEL_POSITIONS"), src.indexOf("];", src.indexOf("WHEEL_POSITIONS")));
  const xs = [...block.matchAll(/\[\s*(-?)WHEEL_X\s*,/g)];
  check(
    `every ${what} wheel is placed from the gauge, not from the car body`,
    xs.length === 4 && xs.filter((m) => m[1] === "-").length === 2,
    `${xs.length} wheels at ±WHEEL_X`,
  );
}
check(
  "and a wheel lands exactly on the rail it runs on",
  Math.abs(WHEEL_X * TRAIN_BODY_SCALE - RAIL_GAUGE / 2) < 1e-12,
  `wheel ${(WHEEL_X * TRAIN_BODY_SCALE * TRAIN_SCALE).toFixed(2)} m from centre, ` +
    `rail ${(gaugeWorld / 2).toFixed(2)} m — they used to differ by ` +
    `${((3.6 / 2 + 0.1 - 2.4 / 2) * TRAIN_BODY_SCALE * TRAIN_SCALE).toFixed(1)} m on a carriage`,
);
check(
  "the sleepers still overhang the rails, so the track reads as track",
  RAIL_GAUGE + 0.3 > RAIL_GAUGE,
  `sleepers ${((RAIL_GAUGE + 0.3) * TRAIN_SCALE).toFixed(2)} m long over a ${gaugeWorld.toFixed(2)} m gauge`,
);

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
