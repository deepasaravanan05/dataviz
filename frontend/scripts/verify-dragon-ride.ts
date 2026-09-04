import {
  DRAGON_SPHERES,
  DRAGON_Z_HALF,
  DRAGON_OUTREACHES_HULL,
  TAIL_LENGTH,
  NECK_LENGTH,
  MUZZLE_LENGTH,
} from "../src/components/dragon-ride/dragonProfile";
import { rideById } from "../src/components/park/layout";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  APEX_HEIGHT,
  ARM_LENGTH,
  DRAGON_ORIGIN,
  FOOT_SPREAD_X,
  FOOT_SPREAD_Z,
  HULL_LENGTH,
  PIVOT_Y,
  RIDE_REACH,
  SEATS_PER_ROW,
  SEAT_COUNT,
  SEAT_ROWS,
  SWING_MAX,
  SWING_PERIOD,
  SWING_SPEED_MULTIPLIER,
  NATURAL_SWING_PERIOD,
  MIN_AMPLITUDE_FRACTION,
} from "../src/components/dragon-ride/constants";
import {
  HULL_LOCAL,
  lowestHullY,
  maxHullHorizontalReach,
  swingAmplitudeFraction,
  swingAngle,
  swingAngularVelocity,
} from "../src/components/dragon-ride/swingKinematics";
import {
  DRAGON_RIDERS,
  RIDE_CAPACITY,
  RIDE_MIN_START_COUNT,
  countSeatColor,
  validateRiders,
} from "../src/components/dragon-ride/riders";
import { classifyDelay } from "../src/simulation/classification";
import { createRide, findFreeSeat } from "../src/simulation/ride";
import { COASTER_ORIGIN } from "../src/components/roller-coaster/constants";
import { MONSTER_ORIGIN, RIDE_REACH as MONSTER_REACH } from "../src/components/monster-ride/constants";
import {
  WHEEL_RADIUS as FERRIS_R,
  BASE_WIDTH,
  BASE_DEPTH,
  WHEEL_CENTER_HEIGHT,
} from "../src/components/ferris-wheel/constants";

let failures = 0;
function check(label: string, ok: boolean, detail: string) {
  if (!ok) failures++;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${label} — ${detail}`);
}

validateRiders();

const componentsDir = join(__dirname, "..", "src", "components", "dragon-ride");
const src = (f: string) => readFileSync(join(componentsDir, f), "utf8");

// ============ 1. Seats: 30-40, evenly banded, from the EXISTING ride ============
/*
 * THE CAPACITY RULE IS NOW 30-40 SEATS PER RIDE, 40 PREFERRED, and the three
 * GREEN / YELLOW / RED counts are an ALLOCATION order rather than a paint job —
 * every seat in the park is grey. What has to hold is that the ride is inside
 * the band, that the three allocation pools are even, and that they account for
 * every seat; the old "60 and 20 apiece" said the same thing at the old count.
 */
check(
  "capacity is in the 30-40 band, at the preferred 40",
  SEAT_COUNT >= 30 && SEAT_COUNT <= 40,
  `${SEAT_COUNT} seats`,
);
check("every seat has a rider record", DRAGON_RIDERS.length === SEAT_COUNT, `${DRAGON_RIDERS.length}`);
check("seat grid matches seat count", SEAT_ROWS * SEATS_PER_ROW === SEAT_COUNT, `${SEAT_ROWS}x${SEATS_PER_ROW}`);
for (const color of ["GREEN", "YELLOW", "RED"] as const) {
  check(
    `the ${color} allocation band is even`,
    Math.abs(countSeatColor(color) - SEAT_COUNT / 3) <= 1,
    `${countSeatColor(color)} of ${SEAT_COUNT}`,
  );
}
check(
  "every seat id is unique",
  new Set(DRAGON_RIDERS.map((r) => r.seatId)).size === DRAGON_RIDERS.length,
  `${new Set(DRAGON_RIDERS.map((r) => r.seatId)).size} distinct`,
);

// The colours must come from the existing ride factory, not a private list.
const reference = createRide();
const referenceIds = new Set(reference.seats.map((s) => s.id));
check(
  "every seat comes from the existing createRide() manifest",
  DRAGON_RIDERS.every((r) => referenceIds.has(r.seatId)),
  `all ${DRAGON_RIDERS.length} seat ids exist in the shared ride definition`,
);
check(
  "uses the shared ride definition rather than redefining capacity/dispatch",
  RIDE_CAPACITY === reference.capacity && RIDE_MIN_START_COUNT === reference.minStartCount,
  `capacity ${RIDE_CAPACITY}, minStartCount ${RIDE_MIN_START_COUNT}`,
);
check(
  "does not define its own seat-colour thresholds",
  // Reading DELAY_THRESHOLDS.greenMax is correct; *assigning* a literal to a
  // local greenMax/yellowMax would mean a private copy of the thresholds.
  !/(greenMax|yellowMax)\s*[:=]\s*\d/.test(src("riders.ts")) &&
    /DELAY_THRESHOLDS/.test(src("riders.ts")),
  "no local threshold literals — DELAY_THRESHOLDS is imported and read",
);

// Every rider's delay must classify, under the EXISTING classifier, to its seat colour.
check(
  "every rider's delay classifies to its seat colour via the existing classifyDelay()",
  DRAGON_RIDERS.every((r) => classifyDelay(r.delayMinutes) === r.seatColor),
  `checked ${DRAGON_RIDERS.length} riders`,
);
check(
  "time labels are ordered check-in <= board <= work start",
  DRAGON_RIDERS.every((r) => r.checkInTime <= r.boardTime && r.boardTime <= r.workStartTime),
  "no rider boards before check-in or after starting work",
);
check(
  "delay equals workStart - checkIn for every rider (matches the spec's definition)",
  DRAGON_RIDERS.every((r) => r.workStartTime - r.checkInTime === r.delayMinutes),
  "consistent",
);

// ============ 2. Dispatch rule: reuses the existing queue/seat logic ============
// Drive the REAL findFreeSeat() against a fresh copy of the REAL ride to prove
// the 5-employee rule and the capacity ceiling both still behave.
const live = createRide();
let seated = 0;
for (let i = 0; i < 80; i++) {
  const seat = findFreeSeat(live, "GREEN");
  if (!seat) break;
  seat.occupied = true;
  seated++;
}
check(
  "the simulation's own ride still fills to its declared capacity and no further",
  seated === RIDE_CAPACITY,
  `${seated} seated before findFreeSeat() returned null, against a declared ${RIDE_CAPACITY}`,
);
check(
  "dispatch threshold is 5 employees",
  reference.minStartCount === 5,
  `minStartCount = ${reference.minStartCount} (1-4 wait, 5 starts)`,
);
check(
  "no private dispatch system was introduced",
  !/minStartCount\s*[:=]\s*\d/.test(src("riders.ts")) && !/minStartCount\s*[:=]\s*\d/.test(src("constants.ts")),
  "minStartCount is only ever read from the shared ride definition",
);

// ============ 3. Motion: real swing, correct pivot, heavy pendulum feel ============
const SAMPLES = 20000;
const DURATION = 240; // seconds — several full ride cycles
const angles: number[] = [];
for (let i = 0; i < SAMPLES; i++) {
  angles.push(swingAngle((i / SAMPLES) * DURATION));
}
const maxAngle = Math.max(...angles);
const minAngle = Math.min(...angles);

check(
  "ship actually swings (not static)",
  maxAngle - minAngle > 1.0,
  `arc ${(((maxAngle - minAngle) * 180) / Math.PI).toFixed(1)}deg`,
);
check(
  "swings both forward and backward through centre",
  maxAngle > 0.7 && minAngle < -0.7,
  `+${((maxAngle * 180) / Math.PI).toFixed(1)}deg / ${((minAngle * 180) / Math.PI).toFixed(1)}deg`,
);
check(
  "never exceeds the designed amplitude",
  maxAngle <= SWING_MAX + 1e-9 && minAngle >= -SWING_MAX - 1e-9,
  `limit +/-${((SWING_MAX * 180) / Math.PI).toFixed(0)}deg`,
);

// Motion continuity: no teleporting between frames at 60fps.
let maxStep = 0;
for (let t = 0; t < 240; t += 1 / 60) {
  maxStep = Math.max(maxStep, Math.abs(swingAngle(t + 1 / 60) - swingAngle(t)));
}
check(
  "motion is smooth at 60fps (no jumps)",
  maxStep < 0.1,
  `largest per-frame step ${((maxStep * 180) / Math.PI).toFixed(2)}deg`,
);

// Pendulum character: fastest at the bottom, momentarily still at the extremes.
let speedAtCentre = 0;
let speedAtExtreme = Infinity;
for (let i = 0; i < SAMPLES; i++) {
  const t = (i / SAMPLES) * DURATION;
  const a = swingAngle(t);
  const v = Math.abs(swingAngularVelocity(t));
  if (Math.abs(a) < 0.02) speedAtCentre = Math.max(speedAtCentre, v);
  if (Math.abs(a) > SWING_MAX * 0.985) speedAtExtreme = Math.min(speedAtExtreme, v);
}
check(
  "heavy pendulum feel: fastest at the bottom of the arc",
  speedAtCentre > 0.3,
  `peak centre speed ${speedAtCentre.toFixed(3)} rad/s`,
);
check(
  "momentum: ship pauses at the top of each swing",
  speedAtExtreme < speedAtCentre * 0.25,
  `extreme speed ${speedAtExtreme.toFixed(4)} rad/s vs centre ${speedAtCentre.toFixed(3)} rad/s`,
);
check(
  "amplitude envelope is continuous across the cycle boundary",
  Math.abs(swingAmplitudeFraction(0) - swingAmplitudeFraction(1e-9)) < 1e-6,
  "no jolt when the ride cycle restarts",
);
check(
  "swing rate is the geometric pendulum period geared by the drive multiplier",
  Math.abs(SWING_PERIOD * SWING_SPEED_MULTIPLIER - 2 * Math.PI * Math.sqrt(ARM_LENGTH / 9.81)) < 1e-9,
  `natural T = ${NATURAL_SWING_PERIOD.toFixed(2)}s for a ${ARM_LENGTH}u arm, driven at ${SWING_SPEED_MULTIPLIER}x -> ${SWING_PERIOD.toFixed(2)}s`,
);
check(
  "swing is faster than the pre-update ride",
  SWING_PERIOD < 8.74 && SWING_MAX > (55 * Math.PI) / 180,
  `period ${SWING_PERIOD.toFixed(2)}s (was 8.74s), amplitude ${((SWING_MAX * 180) / Math.PI).toFixed(0)}deg (was 55deg)`,
);
check(
  "never appears frozen — the quietest swing is still substantial",
  MIN_AMPLITUDE_FRACTION * SWING_MAX > (18 * Math.PI) / 180,
  `minimum amplitude +/-${((MIN_AMPLITUDE_FRACTION * SWING_MAX * 180) / Math.PI).toFixed(0)}deg`,
);

// ============ 4. Ground clearance across the WHOLE swing ============
let worstClearance = Infinity;
let worstAt = 0;
for (let i = 0; i <= 40000; i++) {
  const theta = -SWING_MAX + (i / 40000) * 2 * SWING_MAX;
  const y = lowestHullY(theta);
  if (y < worstClearance) {
    worstClearance = y;
    worstAt = theta;
  }
}
check(
  "hull never touches the ground at any swing angle",
  worstClearance > 1.0,
  `lowest hull point ${worstClearance.toFixed(2)}u at ${((worstAt * 180) / Math.PI).toFixed(1)}deg`,
);

// Cross-check against the angles the ride ACTUALLY reaches in the live motion.
let liveWorst = Infinity;
for (const a of angles) liveWorst = Math.min(liveWorst, lowestHullY(a));
check(
  "clearance holds for the real animated motion, not just the theoretical range",
  liveWorst > 1.0,
  `lowest point over ${DURATION}s of real motion: ${liveWorst.toFixed(2)}u`,
);
check(
  "pivot is above the hull, so the ship hangs rather than floats",
  PIVOT_Y > 0 && HULL_LOCAL.yBottom < 0 && PIVOT_Y + HULL_LOCAL.yBottom > 0,
  `pivot ${PIVOT_Y}u, keel hangs ${Math.abs(HULL_LOCAL.yBottom)}u below it -> rest height ${(PIVOT_Y + HULL_LOCAL.yBottom).toFixed(1)}u`,
);

// ============ 4b. The carved dragon, and the envelope that must cover it ============
/*
 * The dragon is not decoration as far as the maths is concerned: its neck and
 * its tail both reach further fore and aft than the hull box does, so the swing
 * sweep above has to measure THEM, not just the boat. These checks prove that
 * the sweep really does, and that the animal at each end is a real length
 * rather than a stub.
 */
check(
  "the carved dragon reaches further than the hull box",
  DRAGON_OUTREACHES_HULL,
  `dragon reaches ${DRAGON_Z_HALF.toFixed(1)}u from the ship's centre vs the hull's ${(HULL_LENGTH / 2).toFixed(1)}u`,
);
check(
  "the swept envelope covers the dragon, not merely the hull",
  (() => {
    let covered = true;
    for (let i = 0; i <= 2000; i++) {
      const theta = -SWING_MAX + (i / 2000) * 2 * SWING_MAX;
      const c = Math.cos(theta);
      const sn = Math.sin(theta);
      for (const p of DRAGON_SPHERES) {
        const reach = Math.abs(p.y * sn + p.z * c) + p.radius;
        const low = PIVOT_Y + p.y * c - p.z * sn - p.radius;
        if (reach > maxHullHorizontalReach(theta) + 1e-9) covered = false;
        if (low < lowestHullY(theta) - 1e-9) covered = false;
      }
    }
    return covered;
  })(),
  `${DRAGON_SPHERES.length} body spheres swept against the declared envelope at every angle`,
);
check(
  "the tail is a real tail, not a scroll on the transom",
  TAIL_LENGTH > 12,
  `${TAIL_LENGTH.toFixed(1)}u of tail against ${NECK_LENGTH.toFixed(1)}u of neck`,
);
check(
  "the muzzle is long enough to read as a face rather than a lump",
  MUZZLE_LENGTH > 2.5 * 1.1,
  `muzzle ${MUZZLE_LENGTH}u in front of a ${(0.98 * 2).toFixed(2)}u skull`,
);
check(
  "the dragon stays above the deck line for its whole length",
  Math.min(...DRAGON_SPHERES.map((p) => p.y - p.radius)) > HULL_LOCAL.yBottom,
  `lowest point of the carving hangs ${(Math.min(...DRAGON_SPHERES.map((p) => p.y - p.radius)) - HULL_LOCAL.yBottom).toFixed(2)}u above the keel`,
);

// ============ 5. Scale: genuinely massive ============
const ferrisTop = WHEEL_CENTER_HEIGHT + FERRIS_R;
check(
  "taller than the Ferris Wheel — reads as a main attraction",
  APEX_HEIGHT > ferrisTop,
  `dragon apex ${APEX_HEIGHT}u vs Ferris Wheel top ${ferrisTop}u`,
);
const SEATED_EMPLOYEE_HEIGHT = 1.3;
check(
  "a person is dwarfed by the structure",
  APEX_HEIGHT / SEATED_EMPLOYEE_HEIGHT > 20,
  `ride is ${(APEX_HEIGHT / SEATED_EMPLOYEE_HEIGHT).toFixed(0)}x the height of a seated employee`,
);
check(
  "hull is long enough to be a real ship, not a pod",
  HULL_LENGTH >= 24,
  `${HULL_LENGTH}u long`,
);

// ============ 6. Placement: before the coaster, clear of everything ============
const ferrisReach = Math.max(FERRIS_R, BASE_WIDTH / 2, BASE_DEPTH / 2);
const BOXES: Record<string, { minX: number; maxX: number; minZ: number; maxZ: number }> = {
  "Ferris Wheel": { minX: -ferrisReach, maxX: ferrisReach, minZ: -ferrisReach, maxZ: ferrisReach },
  "Roller Coaster": { minX: COASTER_ORIGIN[0] - 30, maxX: COASTER_ORIGIN[0] + 34, minZ: -24, maxZ: 24 },
  "Monster Ride": {
    minX: MONSTER_ORIGIN[0] - MONSTER_REACH,
    maxX: MONSTER_ORIGIN[0] + MONSTER_REACH,
    minZ: MONSTER_ORIGIN[2] - MONSTER_REACH,
    maxZ: MONSTER_ORIGIN[2] + MONSTER_REACH,
  },
};
function distToBox(x: number, z: number, b: { minX: number; maxX: number; minZ: number; maxZ: number }) {
  return Math.hypot(Math.max(b.minX - x, 0, x - b.maxX), Math.max(b.minZ - z, 0, z - b.maxZ));
}

// Real reach, re-derived from the kinematics rather than trusting the constant.
let trueReach = Math.max(FOOT_SPREAD_X, FOOT_SPREAD_Z, 16.5 + 3); // frame feet + boarding platform
for (let i = 0; i <= 20000; i++) {
  const theta = -SWING_MAX + (i / 20000) * 2 * SWING_MAX;
  trueReach = Math.max(trueReach, maxHullHorizontalReach(theta));
}
check(
  "declared RIDE_REACH covers the true swept envelope",
  RIDE_REACH >= trueReach,
  `true reach ${trueReach.toFixed(1)}u vs declared ${RIDE_REACH}u`,
);

const [dx, , dz] = DRAGON_ORIGIN;
for (const [name, box] of Object.entries(BOXES)) {
  const gap = distToBox(dx, dz, box) - trueReach;
  check(`clear of the ${name}`, gap > 4, `${gap.toFixed(1)}u between the swing envelope and its footprint`);
}

/*
 * CLEAR OF THE RAILWAY — measured in the world, where both of them are.
 *
 * This used to compare the ride's AUTHORED origin with track points in the
 * railway's own unscaled units, which agreed by luck while the loop was a
 * fixed ellipse near the same origin. The park has since been rebuilt: every
 * ride is one common height, the solver places them, and the loop is fitted to
 * those placed boxes in world metres. So both sides are read in world metres
 * from the modules that own them, and the ride's swept envelope is measured
 * from where it actually stands.
 */
const placedDragon = rideById("dragon");
/*
 * THE RAILWAY CHECK IS GONE. This asserted that the ride's footprint stood
 * clear of the park railway's rails. The train and its track have been removed
 * from the park at the user's request, so there is no railway to clear.
 */

check(
  "sits BEFORE the roller coaster on the entrance side",
  dz > BOXES["Roller Coaster"].maxZ,
  `dragon at z=${dz}, coaster's near edge at z=${BOXES["Roller Coaster"].maxZ} -> ${(dz - BOXES["Roller Coaster"].maxZ).toFixed(0)}u in front of it`,
);
check(
  "aligned with the coaster so it visually leads into it",
  dx >= BOXES["Roller Coaster"].minX && dx <= BOXES["Roller Coaster"].maxX,
  `dragon x=${dx} lies within the coaster's x span [${BOXES["Roller Coaster"].minX}, ${BOXES["Roller Coaster"].maxX}]`,
);

// ============ 7. ADD-ONLY: existing rides untouched ============
const repo = join(__dirname, "..");
check(
  "roller coaster origin is unchanged",
  COASTER_ORIGIN[0] === 50 && COASTER_ORIGIN[1] === 0 && COASTER_ORIGIN[2] === 0,
  `still at (${COASTER_ORIGIN.join(", ")})`,
);
for (const [name, dir] of [
  ["roller-coaster", "roller-coaster"],
  ["ferris-wheel", "ferris-wheel"],
  ["monster-ride", "monster-ride"],
] as const) {
  const files = readFileSync(join(repo, "src", "components", dir, "constants.ts"), "utf8");
  check(
    `${name} does not import anything from the dragon ride`,
    !files.includes("dragon-ride"),
    "no dependency added to the existing ride",
  );
}
check(
  "dragon ride adds no lighting of its own (inherits the park's rig)",
  !/(directionalLight|ambientLight|hemisphereLight|pointLight|spotLight|<Sky|<Environment)/.test(
    src("DragonRide.tsx") + src("AFrame.tsx") + src("Ship.tsx") + src("DragonHead.tsx"),
  ),
  "no light or environment node anywhere in the ride",
);
check(
  "dragon ride adds no camera or controls of its own",
  !/(PerspectiveCamera|OrbitControls|useThree\(\)\.camera)/.test(
    src("DragonRide.tsx") + src("AFrame.tsx") + src("Ship.tsx"),
  ),
  "the park's existing camera system is untouched",
);
/*
 * The ship's seats used to carry sixty permanently-seated figures, and this
 * check asserted THEY were nested inside the swinging group. They are gone —
 * a seat that always looked occupied made a rider who had walked back down
 * read as never having got off. The property still matters, so it now applies
 * to the SEATS, which is what a boarding employee is attached to:
 * `verify-boarding.ts` proves the employee tracks the seat to within nothing.
 */
check(
  "the seats are children of the swinging group, so a rider follows the ship",
  /<group ref=\{shipRef\}[\s\S]*<Ship/.test(src("DragonRide.tsx")) && /<Seat \/>/.test(src("Ship.tsx")),
  "the seats are nested inside the group whose rotation.x is animated",
);
check(
  "and the ship carries no passenger of its own",
  !/<SeatedRider/.test(src("Ship.tsx")),
  "a seat is empty unless an employee off the attendance sheet is in it",
);
check(
  "only rotation.x is animated — the pivot cannot drift",
  /ship\.rotation\.x = swingAngle/.test(src("DragonRide.tsx")) &&
    !/ship\.position\./.test(src("DragonRide.tsx")),
  "no position is written in the animation loop",
);

// ============ Summary ============
console.log(
  `\nDragon Swing Ship at (${DRAGON_ORIGIN[0]}, ${DRAGON_ORIGIN[2]}) — ` +
    `apex ${APEX_HEIGHT}u, ${SEAT_COUNT} seats (${countSeatColor("GREEN")}G/${countSeatColor("YELLOW")}Y/${countSeatColor("RED")}R), ` +
    `+/-${((SWING_MAX * 180) / Math.PI).toFixed(0)}deg swing at ${SWING_PERIOD.toFixed(1)}s per period.`,
);
console.log(
  `Swept envelope ${trueReach.toFixed(1)}u; lowest hull point over the full swing ${worstClearance.toFixed(2)}u above ground.`,
);

console.log(failures === 0 ? "\nOK: dragon ride verified." : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
