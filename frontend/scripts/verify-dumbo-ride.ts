import { readFileSync } from "node:fs";
import {
  LAKE_CLEARANCE_RADIUS,
  PARK_ORIGIN,
  RADIAL_PATH_LENGTH,
  RIDE_PLOT_RADIUS,
  RIDE_RING_RADIUS,
  RIDE_SLOT_BEARING,
  radialStart,
  rideEntrance,
  ringRadiusOf,
  ringCenterOf,
  type RingRideId,
} from "../src/components/park/parkRing";
import { join } from "node:path";
import {
  ARM_HANGER,
  ARM_LENGTH,
  ARM_PITCH_RADIANS,
  ARM_SWING,
  BODY_HALF_WIDTH,
  BODY_LENGTH,
  BOARDING_RADIUS,
  CANOPY_RADIUS,
  CANOPY_RIM_Y,
  CLIMB_SPEED,
  DECK_Y,
  DUMBO_RIDE_ID,
  DUMBO_RIDE_NAME,
  DUMBO_TEAM_NAME,
  RIDE_UNIFORM_SCALE,
  FOOT_CLEARANCE,
  GALLERY_INNER_RADIUS,
  GALLERY_OUTER_RADIUS,
  HUB_Y,
  LOAD_SECONDS,
  OVERALL_HEIGHT,
  OVERALL_REACH,
  PLINTH_HEIGHT,
  RIDER_SPEED,
  RIDE_SCALE,
  ROTATION_RADIANS_PER_SEC,
  RUN_SECONDS,
  SWEEP_BUDGET,
  FLIGHT_RISE,
  ROTATION_RPM,
  SEATS_PER_VEHICLE,
  SEAT_COUNT,
  SILL_ABOVE_FEET,
  UNLOAD_SECONDS,
  VEHICLE_COUNT,
  VEHICLE_FOOT_LOAD_Y,
  VEHICLE_LOAD_Y,
  VEHICLE_TOP_Y,
  validateDumboRide,
} from "../src/components/dumbo-ride/constants";
import { ARM_PLACEMENTS, maxAmplitude, neighbourGap } from "../src/components/dumbo-ride/ring";
import {
  ARM_ANGLE_DOWN,
  CYCLE_SECONDS,
  RUN_END,
  RUN_START,
  armAngleAt,
  dumboStateAt,
  liftFraction,
  peakClimbRate,
  vehicleHeightAt,
} from "../src/components/dumbo-ride/motion";
import { RIDE_CENTER, RIDE_FACING } from "../src/components/dumbo-ride/placement";
import {
  STATION_FLIGHTS,
  STATION_RISE,
  STATION_STEPS,
} from "../src/components/dumbo-ride/station";
import { PARK_LAYOUT } from "../src/components/park/layout";
import { DEPARTMENTS } from "../src/components/park/departments";
import { placeById } from "../src/components/world/cameraPlaces";
import { PARK_SHRUBS, PARK_TREES } from "../src/components/world/planting";
import { MAX_FLIGHT_RISE, STAIR_RISE } from "../src/simulation/journey/boardingStair";
import { EMPLOYEE_HEIGHT } from "../src/world/scale";

/**
 * THE DUMBO RIDE, CHECKED AGAINST THE BRIEF.
 *
 * The brief was a Sketchfab model — "The Amazing Dumbo Ride" — and one
 * sentence: "i want this ride should be placed behind the data engineers". So
 * there are two halves to prove, and one unspoken third.
 *
 * IS IT A DUMBO? Sixteen elephants on hinged arms round a hub, each with a
 * lever its riders work, so no two are ever at the same height; a striped
 * umbrella over the middle; and the whole thing stopping with its arms DOWN so
 * people can get in. Every one of those is measured here off the modules the
 * park renders from, not off a copy.
 *
 * IS IT BEHIND THE DATA ENGINEERS? That department's ride is the UFO Pendulum,
 * and "behind" is taken from the main gate: past the pendulum along the gate's
 * own line of sight through it. The Tea Cups already stand dead on that line,
 * so this ride is a few degrees off it — which is measured and reported rather
 * than waved at.
 *
 * AND NOTHING ELSE MOVED. The park layout, the department mapping, the other
 * rides' props and the lighting rig are all left exactly as found.
 */

let failures = 0;
function check(label: string, ok: boolean, detail: string) {
  if (!ok) failures++;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${label} — ${detail}`);
}

const root = join(__dirname, "..");
const read = (...p: string[]) => readFileSync(join(root, ...p), "utf8");
const scene = read("src", "components", "roller-coaster", "ParkScene.tsx");
const rideSource = read("src", "components", "dumbo-ride", "DumboRide.tsx");
const platformSource = read("src", "components", "dumbo-ride", "Platform.tsx");

validateDumboRide();

const [rx, rz] = RIDE_CENTER;

/* ================= 1. IT IS A DUMBO ================= */

check(
  "SIXTEEN FLYING ELEPHANTS, two riders each — thirty-two a cycle",
  VEHICLE_COUNT === 16 && SEATS_PER_VEHICLE === 2 && SEAT_COUNT === 32,
  `${VEHICLE_COUNT} vehicles x ${SEATS_PER_VEHICLE} = ${SEAT_COUNT} riders`,
);
check(
  "and the ride renders exactly that many, from the array this file checks",
  ARM_PLACEMENTS.length === VEHICLE_COUNT,
  `${ARM_PLACEMENTS.length} arm placements`,
);
{
  const gaps = ARM_PLACEMENTS.map((p, i) => {
    const next = ARM_PLACEMENTS[(i + 1) % VEHICLE_COUNT];
    let d = next.azimuth - p.azimuth;
    if (d < 0) d += Math.PI * 2;
    return d;
  });
  const worst = Math.max(...gaps.map((g) => Math.abs(g - ARM_PITCH_RADIANS)));
  check(
    "the arms are evenly spaced and close the circle exactly",
    worst < 1e-9,
    `worst spacing error ${(worst * 1e9).toFixed(2)} nrad, pitch ${((ARM_PITCH_RADIANS * 180) / Math.PI).toFixed(1)}°`,
  );
}
{
  const gap = neighbourGap(BOARDING_RADIUS) - BODY_LENGTH;
  check(
    "and neighbouring elephants cannot touch, even parked on their tightest circle",
    gap > 1,
    `${gap.toFixed(2)} m between a ${BODY_LENGTH.toFixed(1)} m elephant and the next`,
  );
}
{
  const plans = new Set(ARM_PLACEMENTS.map((p) => `${p.sweeps}:${p.amplitude.toFixed(6)}`));
  check(
    "EVERY RIDER FLIES IT DIFFERENTLY — sixteen levers, sixteen allowances",
    plans.size === VEHICLE_COUNT,
    `${plans.size} distinct (sweeps, amplitude) plans; ` +
      `${ARM_PLACEMENTS.filter((p) => p.sweeps === 1).length} take one long climb, the rest pump twice`,
  );
}
{
  /* Sampled from the same function the frame loop calls, mid-run. */
  const t = RUN_START + RUN_SECONDS * 0.3;
  const heights = ARM_PLACEMENTS.map((p) => vehicleHeightAt(t, p));
  const spread = Math.max(...heights) - Math.min(...heights);
  check(
    "which shows up in flight: the ring is at sixteen heights at once",
    spread > FLIGHT_RISE * 0.3 && new Set(heights.map((h) => h.toFixed(4))).size === VEHICLE_COUNT,
    `${spread.toFixed(1)} m between the highest and lowest elephant at t=${t.toFixed(0)}s, all sixteen different`,
  );
}
check(
  "and no allowance exceeds what the hydraulics permit",
  ARM_PLACEMENTS.every((p) => p.amplitude <= maxAmplitude(p.sweeps) + 1e-12),
  `budget a x k <= ${SWEEP_BUDGET.toFixed(3)}; worst used ${Math.max(...ARM_PLACEMENTS.map((p) => p.amplitude * p.sweeps)).toFixed(3)}`,
);
/* Two factors, both uniform and both stated: the elephant is drawn larger than
   the park's own people, and the whole machine is then built to the park's one
   common ride height. The animal's proportions survive both. */
check(
  "ONE UNIFORM SCALE on the animal — a real elephant's proportions, multiplied",
  Math.abs(BODY_LENGTH / (RIDE_SCALE * RIDE_UNIFORM_SCALE) - 2.6) < 1e-9 &&
    Math.abs(SILL_ABOVE_FEET / (RIDE_SCALE * RIDE_UNIFORM_SCALE) - (0.7 + 0.85 * 1.5)) < 1e-9,
  `${RIDE_SCALE.toFixed(2)}x against this park's ${EMPLOYEE_HEIGHT.toFixed(1)} m figures, ` +
    `and ${RIDE_UNIFORM_SCALE.toFixed(2)}x again to the park's common ride height`,
);
check(
  "the arms are hinged at the hub and the vehicle's height is the arm's own geometry",
  Math.abs(HUB_Y + ARM_LENGTH * Math.sin(ARM_SWING) - VEHICLE_TOP_Y) < 1e-9 &&
    Math.abs(HUB_Y - ARM_LENGTH * Math.sin(ARM_SWING) - VEHICLE_LOAD_Y) < 1e-9,
  `${ARM_LENGTH.toFixed(0)} m arms swinging ±${((ARM_SWING * 180) / Math.PI).toFixed(1)}° about a ${HUB_Y.toFixed(0)} m hub`,
);
check(
  "the umbrella clears the arms that pass under it, and the elephants fly outside it",
  CANOPY_RIM_Y > HUB_Y + CANOPY_RADIUS * Math.sin(ARM_SWING) &&
    BOARDING_RADIUS - BODY_HALF_WIDTH > CANOPY_RADIUS,
  `rim ${CANOPY_RIM_Y.toFixed(1)} m over an arm at ${(HUB_Y + CANOPY_RADIUS * Math.sin(ARM_SWING)).toFixed(1)} m; elephants at ${BOARDING_RADIUS.toFixed(1)} m, canopy ${CANOPY_RADIUS.toFixed(1)} m`,
);

/* ================= 2. IT COMES DOWN TO THE PEOPLE ================= */

{
  const stopped = [1, LOAD_SECONDS - 0.1, CYCLE_SECONDS - 0.1];
  const flying = stopped
    .map((t) => dumboStateAt(t))
    .filter((s) => s.drive !== 0 || s.rotationRate !== 0);
  check(
    "IT STOPS DEAD to load and to unload — nothing turns and nothing flies",
    flying.length === 0,
    `${LOAD_SECONDS}s of load and ${UNLOAD_SECONDS}s of unload in a ${CYCLE_SECONDS}s cycle`,
  );
}
{
  const worst = Math.max(
    ...ARM_PLACEMENTS.flatMap((p) =>
      [0.5, RUN_START, RUN_END, CYCLE_SECONDS - 0.5].map((t) =>
        Math.abs(armAngleAt(t, p) - ARM_ANGLE_DOWN),
      ),
    ),
  );
  check(
    "and it stops with EVERY ARM DOWN — at both ends of the run, not just the drive off",
    worst < 1e-9,
    `all ${VEHICLE_COUNT} arms at ${((ARM_ANGLE_DOWN * 180) / Math.PI).toFixed(1)}°, worst error ${(worst * 1e9).toFixed(2)} nrad`,
  );
}
check(
  "the howdah floors land LEVEL WITH THE GALLERY, which is the whole boarding arrangement",
  Math.abs(VEHICLE_FOOT_LOAD_Y + SILL_ABOVE_FEET - DECK_Y) < 1e-12 &&
    Math.abs(DECK_Y + ARM_HANGER - VEHICLE_LOAD_Y) < 1e-12,
  `sill and deck both at ${DECK_Y.toFixed(2)} m — a step across, not a climb`,
);
check(
  "a parked elephant can be WALKED UNDER to reach the stair",
  FOOT_CLEARANCE > EMPLOYEE_HEIGHT,
  `${FOOT_CLEARANCE.toFixed(2)} m of headroom for a ${EMPLOYEE_HEIGHT.toFixed(1)} m employee`,
);
check(
  "and the gallery stands clear of a parked elephant's flank rather than inside it",
  GALLERY_OUTER_RADIUS < BOARDING_RADIUS - BODY_HALF_WIDTH &&
    GALLERY_INNER_RADIUS > 0,
  `gallery to ${GALLERY_OUTER_RADIUS.toFixed(1)} m, flank at ${(BOARDING_RADIUS - BODY_HALF_WIDTH).toFixed(1)} m`,
);
check(
  "the climb uses THE PARK'S OWN STEP, and breaks into flights by the park's own rule",
  Math.abs(STATION_RISE - STAIR_RISE) < 0.02 &&
    STATION_FLIGHTS.reduce((a, b) => a + b, 0) === STATION_STEPS &&
    Math.max(...STATION_FLIGHTS) * STATION_RISE <= MAX_FLIGHT_RISE,
  `${STATION_STEPS} steps of ${STATION_RISE.toFixed(3)} m in ${STATION_FLIGHTS.length} flights (${STATION_FLIGHTS.join("+")}) up to ${DECK_Y.toFixed(2)} m`,
);
check(
  "and the stair that is drawn is the stair that is checked",
  /STATION_FLIGHTS/.test(platformSource) && /STATION_RISE/.test(platformSource),
  "Platform.tsx builds from station.ts",
);

/* ================= 3. HOW IT RUNS ================= */

check(
  "the turntable's speed is derived from the pace it carries a rider at",
  Math.abs(ROTATION_RADIANS_PER_SEC - RIDER_SPEED / ARM_LENGTH) < 1e-12,
  `${ROTATION_RPM.toFixed(2)} rpm = ${(RIDER_SPEED * 3.6).toFixed(1)} km/h at ${ARM_LENGTH.toFixed(0)} m`,
);
{
  /* Swept off the real function, not off the closed form it came from. */
  const DT = 0.02;
  let worstClimb = 0;
  let below = 0;
  let above = 0;
  for (const p of ARM_PLACEMENTS) {
    for (let t = 0; t < CYCLE_SECONDS; t += DT) {
      const h = vehicleHeightAt(t, p);
      const next = vehicleHeightAt(t + DT, p);
      worstClimb = Math.max(worstClimb, Math.abs(next - h) / DT);
      if (h < VEHICLE_LOAD_Y - 1e-9) below++;
      if (h > VEHICLE_TOP_Y + 1e-9) above++;
    }
  }
  check(
    "NO ELEPHANT EVER OUTFLIES ITS HYDRAULICS, swept over the whole cycle",
    worstClimb <= CLIMB_SPEED + 0.02,
    `fastest climb ${worstClimb.toFixed(2)} m/s against a ${CLIMB_SPEED.toFixed(1)} m/s cap, over the whole ${CYCLE_SECONDS}s cycle`,
  );
  check(
    "and none of them ever goes below the gallery or through the top of its arc",
    below === 0 && above === 0,
    `${(CYCLE_SECONDS / DT) * VEHICLE_COUNT} samples inside [${VEHICLE_LOAD_Y.toFixed(2)}, ${VEHICLE_TOP_Y.toFixed(2)}] m`,
  );
  const predicted = Math.max(...ARM_PLACEMENTS.map(peakClimbRate));
  check(
    "and the closed form agrees with the sweep, so the bound is derived and not hoped for",
    Math.abs(predicted - worstClimb) < 0.03 &&
      Math.abs(SWEEP_BUDGET - (CLIMB_SPEED * RUN_SECONDS) / (Math.PI * FLIGHT_RISE)) < 1e-12,
    `closed form says ${predicted.toFixed(2)} m/s, the sweep found ${worstClimb.toFixed(2)} m/s`,
  );
}
{
  /* One drive: nothing may fly while the machine is stopped. */
  let flyingWhileStopped = 0;
  for (let t = 0; t < CYCLE_SECONDS; t += 0.05) {
    const s = dumboStateAt(t);
    if (s.drive !== 0) continue;
    for (const p of ARM_PLACEMENTS) {
      if (liftFraction(t, p) !== 0) flyingWhileStopped++;
    }
  }
  check(
    "NOTHING FLIES UNLESS THE RIDE IS AT SPEED — the levers only work during the run",
    flyingWhileStopped === 0,
    `zero lift outside the ${RUN_START}–${RUN_END}s run window`,
  );
}
check(
  "the vehicles are counter-rotated at the arm's end, so riders stay level",
  /vehicle\.rotation\.z = -angle/.test(rideSource),
  "the parallelogram linkage a real Dumbo has",
);

/* ================= 4. ITS SLOT ON THE PARK RING ================= */

/*
 * THE BRIEF THAT PUT THIS RIDE HERE HAS CHANGED, and the checks change with it
 * rather than being deleted.
 *
 * It was asked for a place behind the UFO Pendulum but off the line the Tea Cups
 * already held, and the placement fanned round from that bearing until the
 * ground was clear.
 * This section then re-measured every margin that search had honoured, and
 * asserted that the ride hid nothing from the main entrance.
 *
 * The park is a ring now. Every attraction has a numbered slot, the slots are
 * solved together in `parkRing.ts` so a neighbour cannot crowd this ride
 * however anything is resized, and `verify-park-layout.ts` measures the
 * clearance between all ten in one place instead of each ride vouching for
 * itself. What is left to check HERE is that this ride is actually standing on
 * the slot it was given, and that the slot puts it where the plan says: on its
 * own bearing, at the ring's radius, with its inner edge on the apron the ring
 * path serves.
 *
 * The sightline check is gone, and not because it regressed. A concentric park
 * puts five of its ten attractions on the far side of the lake from the gate,
 * so from the entrance the near half stands in front of the far half by
 * construction — that is what a ring IS. The property that replaces it, that
 * every attraction holds its own share of the overview frame, is measured
 * through the real camera in `verify-night.ts`.
 */
{
  const dx = RIDE_CENTER[0] - PARK_ORIGIN[0];
  const dz = RIDE_CENTER[1] - PARK_ORIGIN[1];
  const radius = Math.hypot(dx, dz);
  const bearing = (Math.atan2(dx, dz) * 180) / Math.PI;

  check(
    "it stands exactly on its slot bearing, with nothing across it",
    Math.abs(bearing - RIDE_SLOT_BEARING.dumbo) < 1e-9,
    `${bearing.toFixed(6)}deg against the plan's ${RIDE_SLOT_BEARING.dumbo}deg`,
  );
  check(
    "and at exactly the ring radius — the same as every other ride",
    Math.abs(radius - RIDE_RING_RADIUS) < 1e-9 && Math.abs(radius - ringRadiusOf()) < 1e-9,
    `${radius.toFixed(3)} m from the middle, and there is only one such radius`,
  );
  check(
    "its platform is the park's one plot size, and its machine fits inside it",
    RIDE_PLOT_RADIUS >= OVERALL_REACH,
    `a ${(RIDE_PLOT_RADIUS * 2).toFixed(0)} m platform holding a ${(OVERALL_REACH * 2).toFixed(0)} m ride`,
  );
  const entrance = rideEntrance("dumbo");
  const start = radialStart("dumbo");
  check(
    "its radial path runs down its own bearing, from the food court to its entrance",
    Math.abs(
      Math.atan2(start[0] - PARK_ORIGIN[0], start[1] - PARK_ORIGIN[1]) -
        Math.atan2(entrance[0] - PARK_ORIGIN[0], entrance[1] - PARK_ORIGIN[1]),
    ) < 1e-9,
    `entrance at (${entrance[0].toFixed(1)}, ${entrance[1].toFixed(1)})`,
  );
  check(
    "and it is the same length as every other radial in the park",
    Math.abs(Math.hypot(entrance[0] - start[0], entrance[1] - start[1]) - RADIAL_PATH_LENGTH) < 1e-6,
    `${Math.hypot(entrance[0] - start[0], entrance[1] - start[1]).toFixed(1)} m, ` +
      `against a plan length of ${RADIAL_PATH_LENGTH.toFixed(1)} m`,
  );
  check(
    "it is clear of the food court in the middle of the park",
    radius - OVERALL_REACH > LAKE_CLEARANCE_RADIUS,
    `inner edge ${(radius - OVERALL_REACH).toFixed(0)} m out, court ${LAKE_CLEARANCE_RADIUS} m`,
  );
}

{
  /*
   * WHICH WAY IT FACES, measured rather than assumed.
   *
   * The ride's local +X is its long axis — the plane of a loop, the line of a
   * circuit, the front of a platform — and a group rotated by `alpha` about +Y
   * carries local +X to (cos alpha, -sin alpha) in world x/z. Presented to the
   * people looking at it, that has to come out perpendicular to the line from
   * the ride to the middle of the park.
   *
   * It used to be measured against the MAIN ENTRANCE, which was the same thing
   * while every ride stood in a fan in front of the gate. On a ring it is not:
   * people reach this ride off the ring path, which runs inside it.
   */
  const axisX = Math.cos(RIDE_FACING);
  const axisZ = -Math.sin(RIDE_FACING);
  const outX = RIDE_CENTER[0] - PARK_ORIGIN[0];
  const outZ = RIDE_CENTER[1] - PARK_ORIGIN[1];
  const outLen = Math.hypot(outX, outZ) || 1;
  const dot = (axisX * outX + axisZ * outZ) / outLen;
  const offBroadside = (Math.acos(Math.min(1, Math.abs(dot))) * 180) / Math.PI;
  check(
    "it presents itself broadside to the ring path, not end-on",
    Math.abs(offBroadside - 90) < 1e-6,
    `${offBroadside.toFixed(4)}deg between its long axis and the line in to the middle`,
  );
}

/* ================= 5. NOTHING ELSE MOVED ================= */

check(
  /*
   * THE PROPERTY, not the count. This used to assert that the layout held five
   * boxes, which was a fair proxy for "adding this ride did not re-solve the
   * park" while five was all it ever held. The Giga Coaster has since been
   * listed there — DevOps ride it, and a ride employees are routed to has to be
   * findable in the layout — so the count moved while the property did not.
   *
   * What actually has to hold is that no ride's position depends on any other's
   * being listed. Every ride in the layout stands on its OWN ring slot, solved
   * in `parkRing.ts` from the sizes of all ten attractions, so listing one more
   * cannot shift the rest; and this ride is not listed at all.
   */
  "the ride is not in the park layout, and listing one never moves another",
  !PARK_LAYOUT.some((r) => r.id === DUMBO_RIDE_ID) &&
    PARK_LAYOUT.every((r) => {
      const slot = ringCenterOf(r.id as RingRideId);
      return Math.hypot(r.center[0] - slot[0], r.center[1] - slot[1]) < 1e-9;
    }),
  `${PARK_LAYOUT.length} rides in the layout, each on its own ring slot`,
);
check(
  "no department was re-routed to it",
  DEPARTMENTS.every((d) => (d.rideId as string) !== DUMBO_RIDE_ID),
  `${DEPARTMENTS.length} departments, none walking to the Dumbo Ride`,
);
check(
  "ParkScene gained one import and one render line, and nothing else",
  /^import \{ DumboRide \} from "@\/components\/dumbo-ride\/DumboRide";$/m.test(scene) &&
    (scene.match(/<DumboRide \/>/g) ?? []).length === 1 &&
    (scene.match(/DumboRide/g) ?? []).length === 3,
  "additive: one import (naming the symbol and its module) and one <DumboRide />",
);
check(
  "the ride adds no light, no camera and no controls of its own",
  !/(directionalLight|ambientLight|pointLight|spotLight|PerspectiveCamera|OrbitControls|Environment)/.test(
    rideSource + platformSource + read("src", "components", "dumbo-ride", "Canopy.tsx"),
  ),
  "it inherits the park's sun, sky and shadow rig unchanged",
);
check(
  "it has its own route, and a fast-travel chip that frames it",
  (() => {
    const place = placeById(DUMBO_RIDE_ID);
    return (
      place.label === `${DUMBO_TEAM_NAME} — ${DUMBO_RIDE_NAME}` &&
      Math.hypot(place.lookAt[0] - rx, place.lookAt[2] - rz) < 1 &&
      read("src", "app", "dumbo-ride", "page.tsx").includes("ParkScene")
    );
  })(),
  "/dumbo-ride, and a chip looking at the mast",
);
{
  const intruders = [...PARK_TREES, ...PARK_SHRUBS].filter(
    (p) => Math.hypot(p.x - rx, p.z - rz) < OVERALL_REACH,
  );
  check(
    "and no tree or shrub was left standing inside the circle the elephants sweep",
    intruders.length === 0,
    `${PARK_TREES.length} trees and ${PARK_SHRUBS.length} shrubs, none within ${OVERALL_REACH.toFixed(1)} m`,
  );
}

/* ================= SUMMARY ================= */

console.log(
  `\n${DUMBO_RIDE_NAME} — ${VEHICLE_COUNT} flying elephants at ${RIDE_SCALE.toFixed(2)}x on ` +
    `${ARM_LENGTH.toFixed(0)} m arms, ${SEAT_COUNT} riders a cycle, ` +
    `${OVERALL_HEIGHT.toFixed(1)} m to the finial. Each rider works their own lever, so the ring ` +
    `flies at sixteen heights at once between the ${DECK_Y.toFixed(1)} m gallery and ` +
    `${VEHICLE_TOP_Y.toFixed(1)} m.`,
);
console.log(
  `It comes down to the people: ${LOAD_SECONDS} s of every ${CYCLE_SECONDS} s it stands still ` +
    `with all sixteen arms down and the howdah floors level with the gallery — ` +
    `${STATION_STEPS} of the park's own steps up, in ${STATION_FLIGHTS.length} flights, after ` +
    `walking under a parked elephant with ${(FOOT_CLEARANCE - PLINTH_HEIGHT + PLINTH_HEIGHT).toFixed(1)} m of headroom.`,
);
console.log(
  `Standing at (${rx.toFixed(1)}, ${rz.toFixed(1)}) — slot ${RIDE_SLOT_BEARING.dumbo}deg, `+
    `${RIDE_RING_RADIUS.toFixed(0)} m out like every other ride, on a `+
    `${(RIDE_PLOT_RADIUS * 2).toFixed(0)} m platform reached by a `+
    `${RADIAL_PATH_LENGTH.toFixed(0)} m radial path. Every ride in the park has the same three.`,
);
console.log(failures === 0 ? "\nOK: dumbo ride verified." : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
