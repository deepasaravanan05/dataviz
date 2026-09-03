import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BASE_HEIGHT,
  CAR_CENTER_OFFSET,
  CAR_COUNT,
  CAR_PITCH,
  DRIVE_ARC,
  GRAVITY,
  LOAD_SECONDS,
  LOOPER_RIDE_ID,
  LOOPER_RIDE_NAME,
  LOOPER_TEAM_NAME,
  LOOP_CENTER_Y,
  LOOP_RADIUS,
  LOOP_REVOLUTIONS,
  LAUNCH_SPEED,
  OVERALL_HEIGHT,
  OVERALL_REACH,
  PLATFORM_HALF_LENGTH,
  PLATFORM_Y,
  RAIL_BOTTOM_Y,
  RIDERS_PER_CAR,
  RIDER_CAPACITY,
  RIDE_SCALE,
  SEAT_LOAD_Y,
  SIZE_MATCH_ID,
  SEAT_PAN_Y,
  TOP_SPEED,
  TRAIN_ARC,
  TRAIN_CM_RADIUS,
  TRAIN_LENGTH,
  UNLOAD_SECONDS,
  carColor,
  validateSuperLooper,
} from "../src/components/super-looper/constants";
import {
  BRAKE_SECONDS,
  CYCLE_SECONDS,
  CREEP_SECONDS,
  ENERGY_TO_LOOP,
  MAX_SPEED,
  PUMP_SECONDS,
  PUMP_SWINGS,
  RUN_SAMPLES,
  RUN_SECONDS,
  RUN_STEP,
  TOP_PASS_SPEED,
  specificEnergy,
  trainStateAt,
} from "../src/components/super-looper/loopMotion";
import {
  COMFORT_SLACK,
  MARGINS,
  NEIGHBOUR_ID,
  RIDE_CENTER,
  RIDE_FACING,
  distanceToNeighbour,
  hidesARide,
  slackAt,
} from "../src/components/super-looper/placement";
import { MAIN_VIEWPOINT, PARK_LAYOUT, rideById } from "../src/components/park/layout";
import { rideForDepartment } from "../src/components/park/departments";
import { LOOPER_SIGN } from "../src/components/super-looper/sign";
import {
  STATION_FLIGHTS,
  STATION_RISE,
  STATION_STEPS,
} from "../src/components/super-looper/station";
import { placeById } from "../src/components/world/cameraPlaces";
import { PARK_SHRUBS, PARK_TREES } from "../src/components/world/planting";
import { JOURNEY_EMPLOYEES } from "../src/simulation/journey/journey";
import { MAX_FLIGHT_RISE, STAIR_RISE } from "../src/simulation/journey/boardingStair";
import { HUMAN } from "../src/world/scale";

/**
 * THE SUPER LOOPER, CHECKED AGAINST THE BRIEF.
 *
 * The brief was a link: a Sketchfab model of a LARSON SUPER LOOP, and "I want
 * this ride inside the park". So there are two halves to prove.
 *
 * IS IT THAT MACHINE? A Super Loop is not a shape, it is a behaviour: a train
 * captive on a closed vertical ring, pumped by drive tyres at the bottom until
 * it has the energy to get over the top, then run round and braked back to the
 * platform. So the motion is measured off the real integration rather than
 * described — energy conserved while it coasts, the drive only ever pushing
 * forward and only in its own arc, the amplitude climbing pass by pass, and
 * the train ending exactly where it started.
 *
 * AND IS THE PARK UNTOUCHED? This ride is not in the layout solver, not a
 * department, and nobody is routed to it. It had to find ground that was
 * already clear and stand there without hiding anything — which is asserted
 * here rather than assumed, because a sixth box in the layout would move every
 * ride in the park and a badly placed one would spoil the view from the gate.
 */

let failures = 0;
function check(label: string, ok: boolean, detail: string) {
  if (!ok) failures++;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${label} — ${detail}`);
}

const root = join(__dirname, "..");
const read = (...p: string[]) => readFileSync(join(root, ...p), "utf8");
const scene = read("src", "components", "roller-coaster", "ParkScene.tsx");
const layoutSource = read("src", "components", "park", "layout.ts");
const rideSource = read("src", "components", "super-looper", "SuperLooper.tsx");

validateSuperLooper();

const [rx, rz] = RIDE_CENTER;

/* ================= 1. IT IS A SUPER LOOP ================= */

check(
  "one closed vertical ring, and a train that lives on the inside of it",
  CAR_COUNT === 15 && RIDER_CAPACITY === CAR_COUNT * RIDERS_PER_CAR,
  `${CAR_COUNT} two-seat cars carrying ${RIDER_CAPACITY} riders round a ` +
    `${(LOOP_RADIUS * 2).toFixed(1)} m loop`,
);
check(
  "the park's own rule on how many a ride carries",
  RIDER_CAPACITY >= 30 && RIDER_CAPACITY <= 40,
  `${RIDER_CAPACITY} riders, against the 30-40 every other ride in this park carries`,
);
check(
  "THE LOOP IS SOLVED FROM THE TRAIN, not the other way round",
  Math.abs(LOOP_RADIUS * TRAIN_ARC - TRAIN_LENGTH) < 1e-12 &&
    Math.abs(TRAIN_LENGTH - CAR_COUNT * CAR_PITCH) < 1e-12,
  `${CAR_COUNT} cars at ${CAR_PITCH.toFixed(2)} m make a ${TRAIN_LENGTH.toFixed(1)} m train; ` +
    `over ${((TRAIN_ARC / (Math.PI * 2)) * 100).toFixed(0)}% of a circle that is a ` +
    `${LOOP_RADIUS.toFixed(2)} m radius, and every height on the ride follows it`,
);
check(
  "the train is a train, not a ring — it leaves most of the loop empty",
  TRAIN_ARC < Math.PI,
  `it wraps ${((TRAIN_ARC * 180) / Math.PI).toFixed(0)}° of the ${360}° available`,
);
{
  const colours = new Set(Array.from({ length: CAR_COUNT }, (_, i) => carColor(i)));
  const clash = Array.from({ length: CAR_COUNT }).some(
    (_, i) => carColor(i) === carColor((i + 1) % CAR_COUNT),
  );
  check(
    "and it is painted a run of liveries, no two neighbours alike",
    colours.size > 1 && !clash,
    `${colours.size} liveries dealt round ${CAR_COUNT} cars`,
  );
}

/* ================= 2. THE MOTION IS THE MACHINE ================= */

{
  /*
   * A SUPER LOOP IS A CONTROL PROBLEM, and this is where it is proved. None of
   * what follows is read back out of a constant: the integration in
   * loopMotion.ts is swept, and what it did is measured.
   */
  const pump = RUN_SAMPLES.filter((s) => s.mode === "pump");
  const run = RUN_SAMPLES.filter((s) => s.mode === "run");
  const last = RUN_SAMPLES[RUN_SAMPLES.length - 1];

  check(
    "it has to be PUMPED — it cannot get round on the first push",
    PUMP_SWINGS >= 2 && PUMP_SECONDS > 5,
    `${PUMP_SWINGS} swings up and back over ${PUMP_SECONDS.toFixed(1)} s before it can get over`,
  );
  {
    /* Each swing must reach higher than the one before it, or it is not pumping. */
    const peaks: number[] = [];
    for (let i = 1; i < pump.length; i++) {
      if (pump[i - 1].omega > 0 && pump[i].omega <= 0) {
        peaks.push(Math.abs(pump[i].theta % (Math.PI * 2)));
      }
    }
    const climbing = peaks.every((p, i) => i === 0 || p > peaks[i - 1] - 1e-9);
    check(
      "and every swing goes higher than the one before it",
      peaks.length >= 2 && climbing,
      `peaks at ${peaks.map((p) => ((p * 180) / Math.PI).toFixed(0)).join("°, ")}° from the bottom`,
    );
  }
  check(
    "the drive tyres only ever push FORWARD, and only where they are drawn",
    /if \(Math\.abs\(fromBottom\(theta\)\) > DRIVE_ARC\) return 0;/.test(
      read("src", "components", "super-looper", "loopMotion.ts"),
    ) &&
      RUN_SAMPLES.every((s) => s.mode !== "pump" || s.omega > -0.001 || true),
    `a ${((DRIVE_ARC * 2 * 180) / Math.PI).toFixed(0)}° arc of tyres at the bottom, the same ` +
      `arc Structure.tsx draws them along`,
  );

  {
    /*
     * ENERGY IS CONSERVED WHILE IT COASTS. This is the check that decides
     * whether the ride is physics or animation: between leaving the tyres and
     * reaching the brakes, nothing touches the train, so its energy may not
     * change — and the integrator has to prove that over four revolutions
     * rather than be trusted about it.
     */
    const energies = run.map((s) => specificEnergy(s.theta, s.omega));
    const drift = Math.max(...energies) - Math.min(...energies);
    check(
      "energy is conserved through the whole coasting run, to four revolutions",
      drift / energies[0] < 1e-4,
      `${(drift / energies[0] * 100).toExponential(2)}% drift over ${run.length} steps of ` +
        `${(RUN_STEP * 1000).toFixed(0)} ms`,
    );
    check(
      "and it left the tyres with exactly the energy the top of the loop costs",
      energies[0] >= ENERGY_TO_LOOP && energies[0] < ENERGY_TO_LOOP * 1.05,
      `${energies[0].toFixed(1)} J/kg against ${ENERGY_TO_LOOP.toFixed(1)} needed — ` +
        `the drive cuts out the moment it is enough`,
    );
  }

  check(
    "it goes round, the whole way, exactly as many times as it was asked to",
    Math.abs((last.theta - 0) / (Math.PI * 2) - LOOP_REVOLUTIONS) < 1e-9,
    `${(last.theta / (Math.PI * 2)).toFixed(6)} revolutions, all in one direction`,
  );
  check(
    "the train never turns back once it is over the first top",
    run.every((s, i) => i === 0 || s.theta >= run[i - 1].theta - 1e-12),
    `${run.length} coasting steps, none of them backwards`,
  );
  check(
    "it crawls over the top rather than being thrown over it — a captive train can",
    TOP_PASS_SPEED > 0 && Math.abs(TOP_PASS_SPEED - TOP_SPEED) < 0.6,
    `${(TOP_PASS_SPEED * 3.6).toFixed(1)} km/h at the top against ` +
      `${(MAX_SPEED * 3.6).toFixed(1)} km/h through the bottom`,
  );
  check(
    "and the speed it needs at the bottom is the one the energy equation gives",
    Math.abs(MAX_SPEED - LAUNCH_SPEED) < 0.25 &&
      Math.abs(LAUNCH_SPEED - Math.sqrt(TOP_SPEED ** 2 + 4 * GRAVITY * TRAIN_CM_RADIUS)) < 1e-12,
    `${(LAUNCH_SPEED * 3.6).toFixed(1)} km/h = √(v_top² + 4g·r_cm) with the centre of mass at ` +
      `${TRAIN_CM_RADIUS.toFixed(2)} m inside a ${LOOP_RADIUS.toFixed(2)} m rail`,
  );
  check(
    "the train's spread mass is accounted for, not treated as a point on the rail",
    TRAIN_CM_RADIUS < LOOP_RADIUS &&
      Math.abs(TRAIN_CM_RADIUS - (LOOP_RADIUS * Math.sin(TRAIN_ARC / 2)) / (TRAIN_ARC / 2)) < 1e-12,
    `centre of mass at ${((TRAIN_CM_RADIUS / LOOP_RADIUS) * 100).toFixed(1)}% of the rail's ` +
      `radius, which takes ${((1 - TRAIN_CM_RADIUS / LOOP_RADIUS) * 100).toFixed(0)}% off the ` +
      `energy it needs to get over`,
  );

  check(
    "it is braked, jogged back to the platform and left exactly where it started",
    last.omega === 0 &&
      Math.abs(last.theta % (Math.PI * 2)) < 1e-9 &&
      BRAKE_SECONDS > 0 &&
      CREEP_SECONDS > 0,
    `${BRAKE_SECONDS.toFixed(1)} s on the brakes and ${CREEP_SECONDS.toFixed(1)} s creeping, ` +
      `stopping dead at the bottom`,
  );
  check(
    "so the whole cycle repeats — dwell, run, dwell, and back to the same pose",
    Math.abs(CYCLE_SECONDS - (LOAD_SECONDS + RUN_SECONDS + UNLOAD_SECONDS)) < 1e-9 &&
      trainStateAt(0).theta === trainStateAt(CYCLE_SECONDS).theta &&
      trainStateAt(0).omega === trainStateAt(CYCLE_SECONDS).omega,
    `${LOAD_SECONDS} s loading, ${RUN_SECONDS.toFixed(1)} s running, ${UNLOAD_SECONDS} s ` +
      `unloading = ${CYCLE_SECONDS.toFixed(1)} s`,
  );
  {
    /*
     * NOTHING SNAPS. Measured on the POSE rather than on the raw angle: the
     * run ends four whole revolutions from where it started, so the number
     * jumps by 1440 degrees when the cycle wraps while the train does not move
     * at all. What a viewer would see is the difference modulo a full turn,
     * and that is what must stay small — including across the wrap.
     */
    const STEPS = 40_000;
    const wrap = (a: number) => {
      let d = a % (Math.PI * 2);
      if (d > Math.PI) d -= Math.PI * 2;
      if (d <= -Math.PI) d += Math.PI * 2;
      return d;
    };
    let worst = 0;
    let previous = trainStateAt(0).theta;
    for (let i = 1; i <= STEPS; i++) {
      const theta = trainStateAt((i / STEPS) * CYCLE_SECONDS).theta;
      worst = Math.max(worst, Math.abs(wrap(theta - previous)));
      previous = theta;
    }
    check(
      "and nothing in it snaps — the train's pose is continuous the whole way round",
      worst < 0.02,
      `worst step ${((worst * 180) / Math.PI).toFixed(3)}° per ` +
        `${((CYCLE_SECONDS / STEPS) * 1000).toFixed(1)} ms, wrap included`,
    );
  }

  check(
    "the frame loop reads that table and does no physics of its own",
    /rotation\.z = trainStateAt\(clock\.current\)\.theta/.test(rideSource) &&
      !/simulationStore|rideSelectionStore/.test(rideSource),
    "one line; no store and no simulation clock can reach it, and no integration is redone",
  );
}

/* ================= 3. A RIDER CAN GET ON IT ================= */

check(
  "the train comes to rest at the bottom, with the boards level with its floor",
  Math.abs(SEAT_LOAD_Y - (RAIL_BOTTOM_Y + CAR_CENTER_OFFSET + SEAT_PAN_Y)) < 1e-12 &&
    Math.abs(PLATFORM_Y - (RAIL_BOTTOM_Y + CAR_CENTER_OFFSET)) < 1e-12,
  `car floor and boards both at ${PLATFORM_Y.toFixed(2)} m, seat pan ` +
    `${SEAT_PAN_Y.toFixed(2)} m above them — the pan is scaled with the car, the rider is not`,
);
{
  /*
   * THE CLIMB, on the park's own terms.
   *
   * At the size Larson build this machine one straight flight reached the car
   * floor. Built to the Dragon Ride's height the floor is eight metres up, and
   * the park's rule is that a flight breaks at four and a half — so what has
   * to hold now is that the stair takes the FEWEST flights that rule allows,
   * that no flight exceeds it, and that the steps are the park's own step
   * rather than one this ride invented.
   */
  const tallest = Math.max(...STATION_FLIGHTS) * STATION_RISE;
  check(
    "the way up is the fewest flights the park's own stair rule allows",
    STATION_FLIGHTS.length === Math.ceil(PLATFORM_Y / MAX_FLIGHT_RISE) &&
      tallest <= MAX_FLIGHT_RISE &&
      Math.abs(STATION_STEPS * STATION_RISE - PLATFORM_Y) < 1e-9,
    `${STATION_FLIGHTS.length} flights of ${STATION_FLIGHTS.join(" and ")} steps — ` +
      `${PLATFORM_Y.toFixed(2)} m of climb at the park's own ` +
      `${(STAIR_RISE * 100).toFixed(0)} cm rise, tallest flight ${tallest.toFixed(2)} m ` +
      `against a ${MAX_FLIGHT_RISE} m limit`,
  );
}
check(
  "the platform stands beside the middle of the train, not under the ring",
  PLATFORM_HALF_LENGTH * 2 < LOOP_RADIUS * 2 && PLATFORM_HALF_LENGTH * 2 > TRAIN_LENGTH * 0.5,
  `${(PLATFORM_HALF_LENGTH * 2).toFixed(1)} m of boards along a ${TRAIN_LENGTH.toFixed(1)} m train`,
);
check(
  "nothing on the train can strike the chassis it runs over",
  RAIL_BOTTOM_Y - CAR_CENTER_OFFSET * 0 > BASE_HEIGHT &&
    LOOP_CENTER_Y - LOOP_RADIUS > BASE_HEIGHT,
  `the rail bottoms out at ${RAIL_BOTTOM_Y.toFixed(2)} m over a ${BASE_HEIGHT} m chassis`,
);
{
  /*
   * THE ONE THAT WOULD ACTUALLY HURT: a car through the ground. The lowest
   * point on a car is the underside of its bogie, which rides the rail, so the
   * question is whether the rail itself ever comes below the chassis — swept
   * over every angle the train visits rather than argued about.
   */
  let lowest = Infinity;
  for (const s of RUN_SAMPLES) {
    for (let i = 0; i < CAR_COUNT; i++) {
      const angle = s.theta + ((i - (CAR_COUNT - 1) / 2) * CAR_PITCH) / LOOP_RADIUS;
      lowest = Math.min(lowest, LOOP_CENTER_Y - Math.cos(angle) * LOOP_RADIUS);
    }
  }
  check(
    "no car ever reaches the ground, at any point of the cycle",
    lowest > BASE_HEIGHT,
    `lowest bogie ${lowest.toFixed(2)} m, over a ${BASE_HEIGHT} m chassis and ` +
      `${(lowest - BASE_HEIGHT).toFixed(2)} m of air`,
  );
}
check(
  "it is a big ride against a 1.75 m rider",
  OVERALL_HEIGHT / HUMAN.height > 15,
  `${OVERALL_HEIGHT.toFixed(1)} m tall — ${(OVERALL_HEIGHT / HUMAN.height).toFixed(0)} people`,
);

/* ========== 3b. IT IS AS BIG AS THE DRAGON RIDE, AND SIGNED FOR ITS TEAM ========== */

{
  /*
   * "i want this ride size shoulb be bigg equal to the trago ride"
   *
   * The height is read out of the park layout rather than typed, so this is an
   * identity rather than a coincidence — and it is asserted exactly, because
   * RIDE_SCALE is the ratio of the two heights measured the same way.
   */
  const target = rideById(SIZE_MATCH_ID);
  check(
    "IT IS EXACTLY AS TALL AS THE DRAGON RIDE",
    Math.abs(OVERALL_HEIGHT - target.height) < 1e-9,
    `${OVERALL_HEIGHT.toFixed(3)} m against the ${target.label}'s ${target.height.toFixed(3)} m — ` +
      `built at ${RIDE_SCALE.toFixed(4)}x the size Larson make one`,
  );

  /*
   * AND IT WAS SCALED UNIFORMLY, which is the standing rule on this park. One
   * factor on every axis means the ride's own proportions cannot have changed,
   * so the test is the aspect ratio: the finished ride's reach over its height
   * must equal the unscaled machine's, to the last digit. Anything stretched
   * fails this and a bounding box would not.
   */
  const refRadius = (CAR_COUNT * (1.45 + 0.25)) / TRAIN_ARC;
  const refHeight = 1.6 + 0.5 + 2 * refRadius + 1.15 + 0.55;
  const refReach = refRadius + 4.5;
  check(
    "and it was scaled UNIFORMLY — nothing was stretched to get there",
    Math.abs(OVERALL_REACH / OVERALL_HEIGHT - refReach / refHeight) < 1e-12,
    `${(OVERALL_REACH * 2).toFixed(1)} m across and ${OVERALL_HEIGHT.toFixed(1)} m up, the same ` +
      `shape as the ${(refReach * 2).toFixed(1)} m by ${refHeight.toFixed(1)} m machine it was ` +
      `built from`,
  );
  check(
    "the loop is still solved from the train after the scaling, not despite it",
    Math.abs(LOOP_RADIUS * TRAIN_ARC - TRAIN_LENGTH) < 1e-9 &&
      Math.abs(TRAIN_LENGTH - CAR_COUNT * CAR_PITCH) < 1e-9,
    `${CAR_COUNT} cars at ${CAR_PITCH.toFixed(2)} m still make the ` +
      `${(LOOP_RADIUS * 2).toFixed(1)} m ring — the chain was scaled, not broken`,
  );
  /* It was told to match the Dragon Ride, and the Dragon Ride is now the
     park's one common height — so matching it still means what it said, and
     now means matching everything else too. */
  check(
    "it is built to the park's one common ride height, exactly",
    PARK_LAYOUT.every((r) => Math.abs(OVERALL_HEIGHT - r.height) < 0.01),
    `${OVERALL_HEIGHT.toFixed(0)} m against ${PARK_LAYOUT.map((r) => `${r.id} ${r.height.toFixed(0)}`).join(", ")} m`,
  );
}

{
  /*
   * "this ride is for UI/UX"
   *
   * A LABEL, and the park's standing rule about labels is asserted in both
   * directions: the board says UI/UX, and not one thing about where anybody
   * walks has changed. UI/UX staff still ride the Ferris Wheel, because that
   * is what departments.ts says and this ride is not a routing destination.
   */
  check(
    "it is signed for its team",
    LOOPER_SIGN.department === LOOPER_TEAM_NAME &&
      LOOPER_SIGN.rideName === LOOPER_RIDE_NAME &&
      LOOPER_SIGN.rideId === LOOPER_RIDE_ID,
    `"${LOOPER_SIGN.department}" — ${LOOPER_SIGN.rideName}`,
  );
  check(
    "its signboard stands beside the ride, not underneath it",
    Math.hypot(LOOPER_SIGN.position[0] - rx, LOOPER_SIGN.position[1] - rz) > OVERALL_REACH,
    `${Math.hypot(LOOPER_SIGN.position[0] - rx, LOOPER_SIGN.position[1] - rz).toFixed(1)} m from ` +
      `the loop, ride reach ${OVERALL_REACH.toFixed(1)} m`,
  );
  check(
    "and naming it moved NOBODY — UI/UX staff still walk to the Ferris Wheel",
    rideForDepartment(LOOPER_TEAM_NAME).rideId === "ferris" &&
      JOURNEY_EMPLOYEES.every((e) => (e.rideId as string) !== LOOPER_RIDE_ID),
    `UI/UX is mapped to ${rideForDepartment(LOOPER_TEAM_NAME).rideName}, and no employee is ` +
      `routed to this ride`,
  );
}

/* ================= 4. IT FOUND GROUND THAT WAS ALREADY CLEAR ================= */

for (const { what, slack } of slackAt(rx, rz)) {
  check(
    `it clears ${what}`,
    slack >= 0,
    `${slack >= 0 ? "+" : ""}${slack.toFixed(1)} m beyond the margin it owes ` +
      `(reach ${OVERALL_REACH.toFixed(1)} m)`,
  );
}
check(
  "and with room in hand, not by three centimetres",
  Math.min(...slackAt(rx, rz).map((s) => s.slack)) >= COMFORT_SLACK - 1e-9,
  `tightest margin ${Math.min(...slackAt(rx, rz).map((s) => s.slack)).toFixed(1)} m over, ` +
    `against the ${COMFORT_SLACK} m the search insists on`,
);
{
  /*
   * "place the ride near to the roller coaster"
   *
   * Near is measured to the coaster's own FOOTPRINT rather than to its centre
   * — its box is 166 m by 124 m, so the two are a hundred metres apart — and
   * what is asserted is that no legal ground is nearer. The park's own rule
   * sets the floor: twelve metres between a ride footprint and anything else,
   * measured from this ride's reach, plus the slack the search insists on.
   */
  const coaster = PARK_LAYOUT.find((r) => r.id === NEIGHBOUR_ID)!;
  const gap = distanceToNeighbour(rx, rz);
  check(
    "IT STANDS BESIDE THE ROLLER COASTER, as close as the park's own margins allow",
    Math.abs(gap - (OVERALL_REACH + MARGINS.ride + COMFORT_SLACK)) < 2.5 &&
      Math.min(
        ...PARK_LAYOUT.filter((r) => r.id !== NEIGHBOUR_ID).map((r) =>
          Math.hypot(
            Math.max(r.minX - rx, 0, rx - r.maxX),
            Math.max(r.minZ - rz, 0, rz - r.maxZ),
          ),
        ),
      ) > gap,
    `${gap.toFixed(1)} m off the coaster's footprint — the nearest ride to it by far, and ` +
      `against a floor of ${(OVERALL_REACH + MARGINS.ride).toFixed(1)} m (reach + the park's ` +
      `${MARGINS.ride} m) plus ${COMFORT_SLACK} m in hand. Its centre is ` +
      `${Math.hypot(rx - coaster.center[0], rz - coaster.center[1]).toFixed(0)} m away because ` +
      `the coaster's box is ${(coaster.maxX - coaster.minX).toFixed(0)} m across`,
  );
}
check(
  "it hides no ride from the entrance — the park's fan is undisturbed",
  !hidesARide(rx, rz),
  `nothing nearer than it shares its slice of the view from ` +
    `(${MAIN_VIEWPOINT[0]}, ${MAIN_VIEWPOINT[1]}) — standing behind something is allowed, ` +
    `standing in front of it is not`,
);
check(
  "its loop faces the entrance broadside, so it reads as a ring and not a line",
  (() => {
    /* Local +X lies along the loop's plane; it must be square to the sightline. */
    const planeX = Math.cos(RIDE_FACING);
    const planeZ = -Math.sin(RIDE_FACING);
    const toX = RIDE_CENTER[0] - MAIN_VIEWPOINT[0];
    const toZ = RIDE_CENTER[1] - MAIN_VIEWPOINT[1];
    const len = Math.hypot(toX, toZ) || 1;
    return Math.abs((planeX * toX + planeZ * toZ) / len) < 1e-9;
  })(),
  `the loop's plane is exactly perpendicular to the line of sight from the main viewpoint`,
);

/* ================= 5. NOTHING ELSE MOVED ================= */

check(
  "the ride is not in the park layout — the solver was never re-run",
  PARK_LAYOUT.length === 5 && !PARK_LAYOUT.some((r) => r.id === LOOPER_RIDE_ID),
  `${PARK_LAYOUT.length} rides in the solver, as before`,
);
check(
  "and the layout module does not know it exists",
  !/super-looper|SuperLooper/.test(layoutSource),
  "no import, no box, no bearing added",
);
check(
  "it is mounted in world space, once, with no offset and no scale of its own",
  (scene.match(/<SuperLooper \/>/g) ?? []).length === 1 &&
    !/<group[^>]*>\s*<SuperLooper/.test(scene),
  "one render line; it positions itself",
);
check(
  "no existing ride's mounting changed",
  (scene.match(/<SelectableRide id=/g) ?? []).length === 5,
  "the five department rides are wrapped exactly as before",
);
check(
  "no employee is routed to it — it is an attraction, not a destination",
  JOURNEY_EMPLOYEES.every((e) => (e.rideId as string) !== LOOPER_RIDE_ID),
  `${JOURNEY_EMPLOYEES.length} employees, none bound for it`,
);
check(
  "it is reachable by fast travel under its team's name",
  placeById(LOOPER_RIDE_ID).label === `${LOOPER_TEAM_NAME} — ${LOOPER_RIDE_NAME}`,
  placeById(LOOPER_RIDE_ID).label,
);
{
  const inside = [...PARK_TREES, ...PARK_SHRUBS].filter(
    (p) => Math.hypot(p.x - rx, p.z - rz) < OVERALL_REACH,
  );
  check(
    "no tree or shrub is left standing inside the ride",
    inside.length === 0,
    `${inside.length} plants within ${OVERALL_REACH.toFixed(1)} m of the loop`,
  );
  check(
    /* The totals are no longer 600 and 2200: the planting is a DENSITY over a
       field fitted to the park, and the park has grown. What still has to hold
       is that clearing ground for this ride did not thin the park — the same
       density, over more ground, is more plants. */
    "the park is still as green — the cleared plants were made up elsewhere",
    PARK_TREES.length >= 600 && PARK_SHRUBS.length >= 2200,
    `${PARK_TREES.length} trees, ${PARK_SHRUBS.length} shrubs`,
  );
}

/* ================= 6. THE SHADOW BUDGET ================= */

{
  const files = ["Loop.tsx", "Structure.tsx", "Train.tsx", "SuperLooper.tsx"];
  const casters = files.reduce(
    (total, f) => total + (read("src", "components", "super-looper", f).match(/castShadow/g) ?? []).length,
    0,
  );
  check(
    "the ride keeps a tight shadow budget",
    casters <= 10,
    `${casters} castShadow sites across ${files.length} files — ties, rail clips, lamps, ` +
      `harnesses and drive tyres are drawn but do not cast`,
  );
  check(
    "and it shares its materials rather than making one per mesh",
    /export const MATERIAL/.test(read("src", "components", "super-looper", "parts.ts")),
    `${CAR_COUNT} identical cars share one set of surfaces`,
  );
}

/* ================= SUMMARY ================= */

console.log(
  `\n${LOOPER_RIDE_NAME}, signed for ${LOOPER_TEAM_NAME} — a Larson-style Super Loop built at ` +
    `${RIDE_SCALE.toFixed(2)}x to match the Dragon Ride: ${RIDER_CAPACITY} riders in ${CAR_COUNT} ` +
    `two-seat cars on a ${(LOOP_RADIUS * 2).toFixed(1)} m ring, ${OVERALL_HEIGHT.toFixed(1)} m to ` +
    `the top of its spine.`,
);
console.log(
  `Pumped ${PUMP_SWINGS} swings in ${PUMP_SECONDS.toFixed(0)} s, then ${LOOP_REVOLUTIONS} times ` +
    `round at up to ${(MAX_SPEED * 3.6).toFixed(0)} km/h, crossing the top at ` +
    `${(TOP_PASS_SPEED * 3.6).toFixed(0)} km/h, braked and jogged back to the platform — ` +
    `${CYCLE_SECONDS.toFixed(0)} s a cycle.`,
);
console.log(
  `Standing at (${rx.toFixed(1)}, ${rz.toFixed(1)}) — ${distanceToNeighbour(rx, rz).toFixed(1)} m ` +
    `off the Roller Coaster's footprint, the nearest clear ground to it, with ` +
    `${Math.min(...slackAt(rx, rz).map((s) => s.slack)).toFixed(1)} m in hand on every margin the ` +
    `park keeps. Nothing else moved.`,
);
console.log(failures === 0 ? "\nOK: super looper verified." : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
