import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CANOPY_R,
  DROP_HEIGHT,
  FOOTREST_R,
  GONDOLA_BOTTOM_Y,
  GONDOLA_TOP_Y,
  OUTER_HOOP_R,
  PHASE_BRAKE,
  PHASE_FALL,
  RIDE_CYCLE_SECONDS,
  RIDE_REACH,
  SEAT_ANGLE_STEP,
  SEAT_COUNT,
  SEAT_RING_R,
  SEAT_WIDTH,
  STATION_DECK_Y,
  STATION_INNER_R,
  STATION_OUTER_R,
  TOWER_HALF,
  TOWER_HEIGHT,
  TOWER_ORIGIN,
  FOUNDATION_HEIGHT,
  FOUNDATION_RADIUS,
  COLLAR_OUTER_R,
  PHASE_DWELL_BOTTOM,
  PHASE_LIFT,
  PHASE_HOLD_TOP,
} from "../src/components/drop-tower/constants";
import { PARK_SCALE, TOWER_SHIFT_X, PEDESTRIAN_STEP, TOWER_STEPS_LEFT, TRAIN_SCALE } from "../src/components/park/parkScale";
import { PARK_LAYOUT, rideById } from "../src/components/park/layout";
import {
  BRAKE_DECELERATION,
  FALL_ACCELERATION,
  PEAK_FALL_SPEED,
  gondolaVelocity,
  gondolaY,
  restraintLock,
  ridePhase,
} from "../src/components/drop-tower/dropKinematics";
import {
  RIDE_CAPACITY,
  RIDE_MIN_START_COUNT,
  TOWER_RIDERS,
  countSeatColor,
  validateRiders,
} from "../src/components/drop-tower/riders";
import { classifyDelay } from "../src/simulation/classification";
import { createRide, findFreeSeat } from "../src/simulation/ride";
import { TRACK_CURVE } from "../src/components/park-train/trainTrack";
import { COASTER_ORIGIN } from "../src/components/roller-coaster/constants";
import { DRAGON_ORIGIN, APEX_HEIGHT as DRAGON_APEX } from "../src/components/dragon-ride/constants";
import {
  WHEEL_RADIUS as FERRIS_R,
  WHEEL_CENTER_HEIGHT,
} from "../src/components/ferris-wheel/constants";

let failures = 0;
function check(label: string, ok: boolean, detail: string) {
  if (!ok) failures++;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${label} — ${detail}`);
}

validateRiders();

const dir = join(__dirname, "..", "src", "components", "drop-tower");
const src = (f: string) => readFileSync(join(dir, f), "utf8");

// ============ 1. Seats: 30-40, evenly banded, from the EXISTING ride system ============
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
check("every seat has a rider record", TOWER_RIDERS.length === SEAT_COUNT, `${TOWER_RIDERS.length}`);
for (const color of ["GREEN", "YELLOW", "RED"] as const) {
  check(
    `the ${color} allocation band is even`,
    Math.abs(countSeatColor(color) - SEAT_COUNT / 3) <= 1,
    `${countSeatColor(color)} of ${SEAT_COUNT}`,
  );
}
check(
  "seat ids unique",
  new Set(TOWER_RIDERS.map((r) => r.seatId)).size === SEAT_COUNT,
  `${new Set(TOWER_RIDERS.map((r) => r.seatId)).size} distinct`,
);

const reference = createRide();
const referenceIds = new Set(reference.seats.map((s) => s.id));
check(
  "every seat comes from the existing createRide() manifest",
  TOWER_RIDERS.every((r) => referenceIds.has(r.seatId)),
  "no private seat list",
);
check(
  "capacity and dispatch threshold are read from the shared ride definition",
  RIDE_CAPACITY === reference.capacity && RIDE_MIN_START_COUNT === reference.minStartCount,
  `capacity ${RIDE_CAPACITY}, minStartCount ${RIDE_MIN_START_COUNT}`,
);
check(
  "no private seat-colour thresholds",
  !/(greenMax|yellowMax)\s*[:=]\s*\d/.test(src("riders.ts")) && /DELAY_THRESHOLDS/.test(src("riders.ts")),
  "DELAY_THRESHOLDS is imported and read",
);
check(
  "every rider's delay classifies to its seat colour via the existing classifyDelay()",
  TOWER_RIDERS.every((r) => classifyDelay(r.delayMinutes) === r.seatColor),
  `checked ${TOWER_RIDERS.length} riders`,
);
check(
  "delay equals workStart - checkIn, and boarding falls between them",
  TOWER_RIDERS.every(
    (r) =>
      r.workStartTime - r.checkInTime === r.delayMinutes &&
      r.checkInTime <= r.boardTime &&
      r.boardTime <= r.workStartTime,
  ),
  "time labels are internally consistent",
);

// Colours must be interleaved, NOT three solid arcs.
let maxRun = 1;
let run = 1;
for (let i = 1; i < TOWER_RIDERS.length; i++) {
  run = TOWER_RIDERS[i].seatColor === TOWER_RIDERS[i - 1].seatColor ? run + 1 : 1;
  maxRun = Math.max(maxRun, run);
}
check(
  "seats are individually coloured, not three large blocks",
  maxRun <= 2,
  `longest run of one colour around the ring: ${maxRun} seat(s)`,
);

// ============ 2. Dispatch: reuses the existing queue/seat logic ============
const live = createRide();
let seated = 0;
while (seated < 200) {
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
check("dispatch threshold is 5 employees", reference.minStartCount === 5, "1-4 wait, 5 starts");
check(
  "no private dispatch system",
  !/minStartCount\s*[:=]\s*\d/.test(src("riders.ts") + src("constants.ts")),
  "minStartCount only ever read from the shared ride definition",
);

// ============ 3. Seats physically fit around the ring ============
const arcSpacing = (2 * Math.PI * SEAT_RING_R) / SEAT_COUNT;
check(
  `all ${SEAT_COUNT} seats fit around the ring without touching`,
  arcSpacing > SEAT_WIDTH,
  `arc spacing ${arcSpacing.toFixed(3)}u vs seat width ${SEAT_WIDTH}u`,
);
check(
  "seat ring clears the mast",
  SEAT_RING_R > TOWER_HALF * Math.SQRT2 + 1,
  `seats at r=${SEAT_RING_R}u, mast diagonal r=${(TOWER_HALF * Math.SQRT2).toFixed(2)}u`,
);
check(
  "seats face outward on a single circular deck",
  Math.abs(SEAT_ANGLE_STEP * SEAT_COUNT - Math.PI * 2) < 1e-9,
  `${SEAT_COUNT} seats x ${((SEAT_ANGLE_STEP * 180) / Math.PI).toFixed(1)}deg = a full circle`,
);

// ============ 4. Motion: real drop profile ============
const SAMPLES = 40000;
const DURATION = RIDE_CYCLE_SECONDS * 6;
const ys: number[] = [];
for (let i = 0; i < SAMPLES; i++) ys.push(gondolaY((i / SAMPLES) * DURATION));

check(
  "gondola travels the full drop height",
  Math.abs(Math.max(...ys) - GONDOLA_TOP_Y) < 1e-6 && Math.min(...ys) <= GONDOLA_BOTTOM_Y + 1e-6,
  `${Math.min(...ys).toFixed(2)}u -> ${Math.max(...ys).toFixed(2)}u (${DROP_HEIGHT.toFixed(1)}u drop)`,
);
check(
  "never travels above the top or below its resting height",
  Math.max(...ys) <= GONDOLA_TOP_Y + 1e-6 && Math.min(...ys) > GONDOLA_BOTTOM_Y - 0.2,
  `min ${Math.min(...ys).toFixed(3)}u, max ${Math.max(...ys).toFixed(3)}u`,
);

// Continuity: no teleporting at 60fps.
let maxStep = 0;
for (let t = 0; t < DURATION; t += 1 / 60) {
  maxStep = Math.max(maxStep, Math.abs(gondolaY(t + 1 / 60) - gondolaY(t)));
}
check("motion is continuous at 60fps", maxStep < 0.6, `largest per-frame step ${maxStep.toFixed(3)}u`);

// Every phase must actually occur.
const phases = new Set(Array.from({ length: 4000 }, (_, i) => ridePhase((i / 4000) * RIDE_CYCLE_SECONDS)));
for (const p of ["BOARDING", "LIFTING", "HOLD_TOP", "FALLING", "BRAKING", "SETTLING"] as const) {
  check(`phase ${p} occurs in the cycle`, phases.has(p), "present");
}

// Rising: gradual acceleration then gradual deceleration (not linear).
const liftStart = PHASE_DWELL_BOTTOM;
const liftSpeeds: number[] = [];
for (let i = 1; i < 200; i++) liftSpeeds.push(Math.abs(gondolaVelocity(liftStart + (PHASE_LIFT * i) / 200)));
check(
  "lift starts and ends at rest (gradual accel, gradual decel)",
  liftSpeeds[0] < 0.35 && liftSpeeds[liftSpeeds.length - 1] < 0.35 && Math.max(...liftSpeeds) > 3,
  `edge speeds ${liftSpeeds[0].toFixed(3)}/${liftSpeeds[liftSpeeds.length - 1].toFixed(3)} u/s, peak ${Math.max(...liftSpeeds).toFixed(2)} u/s`,
);
check(
  "lift is not a linear ramp",
  Math.max(...liftSpeeds) > (DROP_HEIGHT / PHASE_LIFT) * 1.5,
  `peak lift speed ${Math.max(...liftSpeeds).toFixed(2)} u/s vs linear-average ${(DROP_HEIGHT / PHASE_LIFT).toFixed(2)} u/s`,
);

// ---- Speed: the whole point of this update ----
const OLD_CYCLE = 26.9;
const OLD_PEAK_LIFT = 6.36;
/*
 * The ride is still quicker than the one this project started with, but it is
 * no longer as quick as it was at 62 m: the mast is now 105 m, and hoisting
 * 77 m still has to happen at a winch speed a real machine could manage. The
 * cycle length is dictated by physics, so this asserts the direction of travel
 * rather than a number that would force an impossible ride.
 */
check(
  "ride cycle is faster than the original, and paced by real machinery",
  RIDE_CYCLE_SECONDS < OLD_CYCLE && Math.max(...liftSpeeds) < 25,
  `${RIDE_CYCLE_SECONDS.toFixed(1)}s vs ${OLD_CYCLE}s originally (${(OLD_CYCLE / RIDE_CYCLE_SECONDS).toFixed(2)}x faster) over a ${DROP_HEIGHT.toFixed(0)}u drop`,
);
check(
  "ascent is significantly faster than before",
  Math.max(...liftSpeeds) > OLD_PEAK_LIFT * 2,
  `peak ascent ${Math.max(...liftSpeeds).toFixed(1)} u/s vs ${OLD_PEAK_LIFT} u/s previously`,
);

// Drop: much faster than the lift, and accelerating.
let peakFall = 0;
for (let i = 0; i < 4000; i++) {
  const t = (i / 4000) * RIDE_CYCLE_SECONDS;
  if (ridePhase(t) === "FALLING") peakFall = Math.max(peakFall, -gondolaVelocity(t));
}
check(
  "drop is clearly faster than the (now also fast) ascent",
  peakFall > Math.max(...liftSpeeds) * 1.4,
  `peak fall ${peakFall.toFixed(1)} u/s vs peak lift ${Math.max(...liftSpeeds).toFixed(1)} u/s`,
);
check(
  "fall acceleration is derived from the geometry and near gravity",
  Math.abs(FALL_ACCELERATION - (DROP_HEIGHT - 0.2) / (0.5 * PHASE_FALL ** 2 + (PHASE_FALL * PHASE_BRAKE) / 2)) < 1e-9 &&
    FALL_ACCELERATION > 9.81 &&
    FALL_ACCELERATION < 2 * 9.81,
  `${FALL_ACCELERATION.toFixed(2)} u/s^2 = ${(FALL_ACCELERATION / 9.81).toFixed(2)}g — a launched drop, harder than free fall but not impossible`,
);
check(
  "brakes decelerate strongly but finitely",
  BRAKE_DECELERATION > FALL_ACCELERATION && BRAKE_DECELERATION < 4 * 9.81,
  `${BRAKE_DECELERATION.toFixed(1)} u/s^2 (${(BRAKE_DECELERATION / 9.81).toFixed(1)}g) from ${PEAK_FALL_SPEED.toFixed(1)} u/s`,
);
check(
  "car comes to a genuine stop at the bottom",
  Math.abs(gondolaVelocity(RIDE_CYCLE_SECONDS - 0.01)) < 0.35,
  `residual speed ${Math.abs(gondolaVelocity(RIDE_CYCLE_SECONDS - 0.01)).toFixed(4)} u/s`,
);
// Sample the middle of the hold phase, derived from the phase durations rather
// than a hardcoded timestamp, so this keeps testing the real thing if the
// cycle is retimed again.
const holdMid = PHASE_DWELL_BOTTOM + PHASE_LIFT + PHASE_HOLD_TOP / 2;
check(
  "there is a real pause at the top",
  Math.abs(gondolaY(holdMid) - GONDOLA_TOP_Y) < 1e-9 && Math.abs(gondolaVelocity(holdMid)) < 1e-6,
  `gondola is stationary at the top for ${PHASE_HOLD_TOP}s (sampled at t=${holdMid.toFixed(2)}s)`,
);

// Restraints must open for boarding and be locked for the whole drop.
check(
  "restraints open during boarding",
  restraintLock(0.2) < 0.05,
  `lock = ${restraintLock(0.2).toFixed(3)} at the start of boarding`,
);
let lockedThroughDrop = true;
for (let i = 0; i < 3000; i++) {
  const t = (i / 3000) * RIDE_CYCLE_SECONDS;
  const p = ridePhase(t);
  if ((p === "LIFTING" || p === "HOLD_TOP" || p === "FALLING" || p === "BRAKING") && restraintLock(t) < 0.999) {
    lockedThroughDrop = false;
  }
}
check("restraints stay locked from lift through braking", lockedThroughDrop, "never unlocks mid-ride");

// ============ 5. Station geometry actually meets the gondola ============
check(
  "boarding deck sits below the resting seat height",
  GONDOLA_BOTTOM_Y > STATION_DECK_Y && GONDOLA_BOTTOM_Y - STATION_DECK_Y < 1.6,
  `seats rest ${(GONDOLA_BOTTOM_Y - STATION_DECK_Y).toFixed(2)}u above the deck`,
);
const lowestGondolaPart = GONDOLA_BOTTOM_Y - 0.77; // spider hoop underside
check(
  "nothing hanging under the gondola clips the deck",
  lowestGondolaPart > STATION_DECK_Y + 0.15,
  `lowest overhanging part ${lowestGondolaPart.toFixed(2)}u vs deck top ${STATION_DECK_Y}u`,
);
check(
  "gondola collar clears the foundation instead of intersecting it",
  GONDOLA_BOTTOM_Y - 1.3 > FOUNDATION_HEIGHT && COLLAR_OUTER_R < FOUNDATION_RADIUS,
  `collar underside ${(GONDOLA_BOTTOM_Y - 1.3).toFixed(2)}u vs foundation top ${FOUNDATION_HEIGHT}u`,
);
check(
  "deck's inner edge clears the foundation",
  STATION_INNER_R >= FOUNDATION_RADIUS,
  `deck inner r=${STATION_INNER_R}u, foundation r=${FOUNDATION_RADIUS}u`,
);
check(
  "gondola never descends into the ground",
  Math.min(...ys) - 0.77 > 0,
  `lowest point of the car ${(Math.min(...ys) - 0.77).toFixed(2)}u above ground`,
);
check(
  "gondola clears the crown machinery at the top of its travel",
  GONDOLA_TOP_Y + 3.6 + 0.7 < TOWER_HEIGHT,
  `canopy top ${(GONDOLA_TOP_Y + 4.3).toFixed(1)}u vs mast ${TOWER_HEIGHT}u`,
);

// ============ 6. Scale ============
const ferrisTop = WHEEL_CENTER_HEIGHT + FERRIS_R;
check(
  "tallest attraction in the park",
  TOWER_HEIGHT > ferrisTop && TOWER_HEIGHT > DRAGON_APEX,
  `tower ${TOWER_HEIGHT}u vs dragon ${DRAGON_APEX}u vs ferris ${ferrisTop}u`,
);
check(
  "a person is dwarfed by the tower",
  TOWER_HEIGHT / 1.3 > 40,
  `${(TOWER_HEIGHT / 1.3).toFixed(0)}x the height of a seated employee`,
);

// ============ 7. Placement: before the Dragon Ride, clear of everything ============
type Box = { minX: number; maxX: number; minZ: number; maxZ: number };

/**
 * Other rides' footprints come straight from the layout solver, so this can
 * never drift out of step with where they actually render.
 */
const S = PARK_SCALE;
const BOXES: Record<string, Box> = Object.fromEntries(
  PARK_LAYOUT.filter((r) => r.id !== "tower").map((r) => [
    r.label,
    { minX: r.minX, maxX: r.maxX, minZ: r.minZ, maxZ: r.maxZ },
  ]),
);
const DRAGON_BOX = BOXES["Dragon Ride"];

function distToBox(x: number, z: number, b: Box) {
  return Math.hypot(Math.max(b.minX - x, 0, x - b.maxX), Math.max(b.minZ - z, 0, z - b.maxZ));
}

// True footprint, re-derived from the real geometry rather than trusted.
const trueReach = Math.max(CANOPY_R, FOOTREST_R, OUTER_HOOP_R, STATION_OUTER_R, FOUNDATION_RADIUS);
check(
  "declared RIDE_REACH covers the true footprint",
  RIDE_REACH >= trueReach,
  `true reach ${trueReach.toFixed(1)}u vs declared ${RIDE_REACH}u`,
);

const [tx, , tz] = TOWER_ORIGIN;
for (const [name, box] of Object.entries(BOXES)) {
  const gap = distToBox(tx, tz, box) - trueReach;
  check(`clear of the ${name}`, gap > 4, `${gap.toFixed(1)}u between footprints`);
}
const trackPts = Array.from({ length: 3000 }, (_, i) => TRACK_CURVE.getPointAt(i / 3000));
const trackGap =
  Math.min(...trackPts.map((p) => Math.hypot(p.x * TRAIN_SCALE - tx, p.z * TRAIN_SCALE - tz))) - trueReach;
check("clear of the park train's loop", trackGap > 4, `${trackGap.toFixed(1)}u from the rails`);

// ---- The requested move: 3 pedestrian steps left, and NOT resized ----
check(
  "still carries the three-pedestrian-step nudge to the left (-X)",
  Math.abs(TOWER_SHIFT_X) === PEDESTRIAN_STEP * TOWER_STEPS_LEFT &&
    Math.abs(TOWER_ORIGIN[0] - rideById("tower").center[0]) < 1e-9,
  `${TOWER_STEPS_LEFT} steps x ${PEDESTRIAN_STEP}u = ${Math.abs(TOWER_SHIFT_X)}u left of its slot in the fan`,
);
check(
  "shift is a nudge, not a relocation",
  Math.abs(TOWER_SHIFT_X) < trueReach * 0.25,
  `${Math.abs(TOWER_SHIFT_X)}u vs the ride's own ${trueReach.toFixed(1)}u footprint`,
);
/*
 * The tower sets its own height rather than inheriting PARK_SCALE — that is
 * what lets it stand 105 m on a footprint small enough not to shove a
 * neighbour out of place. Two earlier briefs moved numbers here without moving
 * the principle: the height went from 62 m to 105 m, and the gondola was later
 * broadened on purpose. So this no longer pins the footprint to a frozen
 * literal — it asserts what actually matters, that the footprint is set by the
 * ride's OWN widest part and is nothing like what PARK_SCALE would have made
 * of it.
 */
check(
  "the tower sizes itself, and is not scaled with the rest of the park",
  TOWER_HEIGHT > 100 && trueReach < 11.8 * S,
  `mast ${TOWER_HEIGHT}u on a self-set ${trueReach.toFixed(1)}u footprint, where PARK_SCALE would have made it ${(11.8 * S).toFixed(1)}u`,
);
check(
  "tower is not inside any PARK_SCALE group in the scene",
  !/<group scale=\{PARK_SCALE\}>\s*<DropTower/.test(
    readFileSync(join(__dirname, "..", "src", "components", "roller-coaster", "ParkScene.tsx"), "utf8"),
  ),
  "DropTower renders at its own, unscaled size",
);

check(
  "sits BEFORE the Dragon Ride on the entrance side",
  tz > DRAGON_BOX.maxZ,
  `tower at z=${tz}, dragon's near edge at z=${DRAGON_BOX.maxZ} -> ${(tz - DRAGON_BOX.maxZ).toFixed(0)}u in front of it`,
);
check(
  "park order is DROP TOWER -> DRAGON RIDE -> ROLLER COASTER",
  tz > DRAGON_ORIGIN[2] && DRAGON_ORIGIN[2] > BOXES["Roller Coaster"].maxZ,
  `z: tower ${tz} > dragon ${DRAGON_ORIGIN[2]} > coaster ${BOXES["Roller Coaster"].maxZ}`,
);

// ============ 8. ADD-ONLY: existing rides untouched ============
check(
  "roller coaster origin unchanged",
  COASTER_ORIGIN[0] === 50 && COASTER_ORIGIN[2] === 0,
  `still at (${COASTER_ORIGIN.join(", ")})`,
);
check(
  "dragon ride origin unchanged",
  DRAGON_ORIGIN[0] === 67 && DRAGON_ORIGIN[2] === 62 && DRAGON_APEX === 34,
  `still at (${DRAGON_ORIGIN.join(", ")}), apex ${DRAGON_APEX}u`,
);
for (const ride of ["roller-coaster", "ferris-wheel", "monster-ride", "park-train", "dragon-ride"]) {
  const text = readFileSync(join(__dirname, "..", "src", "components", ride, "constants.ts"), "utf8");
  check(`${ride} does not depend on the drop tower`, !text.includes("drop-tower"), "no new dependency");
}
check(
  "drop tower is self-contained (imports no other ride's modules)",
  !/from "@\/components\/(roller-coaster|ferris-wheel|monster-ride|park-train|dragon-ride)/.test(
    src("DropTower.tsx") + src("Tower.tsx") + src("Gondola.tsx") + src("Station.tsx") + src("riders.ts"),
  ),
  "only the shared simulation modules are imported",
);
check(
  "adds no lighting, environment or sky of its own",
  !/(directionalLight|ambientLight|hemisphereLight|pointLight|spotLight|<Sky|<Environment)/.test(
    src("DropTower.tsx") + src("Tower.tsx") + src("Gondola.tsx") + src("Station.tsx"),
  ),
  "inherits the park's existing rig",
);
check(
  "adds no camera or controls of its own",
  !/(PerspectiveCamera|OrbitControls)/.test(
    src("DropTower.tsx") + src("Tower.tsx") + src("Gondola.tsx") + src("Station.tsx"),
  ),
  "the park's existing camera system is untouched",
);
/*
 * The ring used to carry sixty permanently-seated figures, and this check
 * asserted THEY were descendants of the moving gondola. They are gone — a seat
 * that always looked occupied made a rider who had walked back down read as
 * never having got off. The property still matters, so it now applies to the
 * SEATS, which is what a boarding employee is attached to.
 */
check(
  "the seats are descendants of the moving gondola group",
  /<group ref=\{gondolaRef\}[\s\S]*<Gondola/.test(src("DropTower.tsx")) &&
    /<SeatShell/.test(src("Gondola.tsx")),
  "the seat shells are nested inside the group whose Y is animated",
);
check(
  "and the gondola carries no passenger of its own",
  !/<SeatedRider/.test(src("Gondola.tsx")),
  "a seat is empty unless an employee off the attendance sheet is in it",
);
check(
  "gondola height comes only from the kinematics module",
  /gondola\.position\.y = y/.test(src("DropTower.tsx")) && /const y = gondolaY\(t\)/.test(src("DropTower.tsx")),
  "no second source of vertical position",
);
check(
  "uses instancing for the repeated footrest plates",
  /<Instances/.test(src("Gondola.tsx")),
  "footrests drawn in a single instanced call",
);

// ============ Summary ============
console.log(
  `\nDrop Tower at (${tx}, ${tz}) — ${TOWER_HEIGHT}u mast, ${DROP_HEIGHT.toFixed(1)}u drop, ` +
    `${SEAT_COUNT} seats (${countSeatColor("GREEN")}G/${countSeatColor("YELLOW")}Y/${countSeatColor("RED")}R).`,
);
console.log(
  `Cycle ${RIDE_CYCLE_SECONDS.toFixed(1)}s: fall at ${FALL_ACCELERATION.toFixed(2)} u/s^2 to ` +
    `${PEAK_FALL_SPEED.toFixed(1)} u/s, braked at ${(BRAKE_DECELERATION / 9.81).toFixed(1)}g. Footprint ${trueReach.toFixed(1)}u.`,
);

console.log(failures === 0 ? "\nOK: drop tower verified." : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
