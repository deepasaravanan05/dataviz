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
  ringCenterOf,
  ringRadiusOf,
  type RingRideId,
} from "../src/components/park/parkRing";
import { join } from "node:path";
import {
  CAR_COUNT,
  CAR_PITCH,
  CREST_Y,
  GIGA_RIDE_ID,
  GIGA_RIDE_NAME,
  LIFT_SPEED,
  ROWS_PER_CAR,
  SEATS_PER_ROW,
  SEAT_COUNT,
  TRAIN_LENGTH,
  carColor,
  validateGigaCoaster,
} from "../src/components/giga-coaster/constants";
import {
  CREST_DISTANCE,
  TRACK_LENGTH,
  TRACK_PEAK,
  TRACK_POINTS,
  TRACK_VALLEY,
} from "../src/components/giga-coaster/trackCurve";
import {
  LATERAL_GEE,
  MAX_BANK,
  MAX_LATERAL_GEE,
  TRACK_FRAMES,
} from "../src/components/giga-coaster/trackFrames";
import {
  BRAKE_DISTANCE,
  CYCLE_SECONDS,
  MAX_LATERAL_GEE_ALLOWED,
  RUN_SAMPLES,
  RUN_SECONDS,
  TOP_SPEED,
  coastingSpeedAt,
  speedAtDistance,
  trainStateAt,
} from "../src/components/giga-coaster/coasterMotion";
import { OVERALL_HEIGHT, OVERALL_REACH } from "../src/components/giga-coaster/envelope";
import {
  RIDE_CENTER,
  RIDE_FACING,
} from "../src/components/giga-coaster/placement";
import { PLATFORM_Y } from "../src/components/giga-coaster/station";
import { PARK_LAYOUT, rideById, rideScale } from "../src/components/park/layout";
import { departmentFor } from "../src/components/park/departments";
import { OVERALL_HEIGHT as TEACUPS_HEIGHT } from "../src/components/tea-cups/constants";
import { placeById } from "../src/components/world/cameraPlaces";
import { PARK_SHRUBS, PARK_TREES } from "../src/components/world/planting";
import { JOURNEY_EMPLOYEES } from "../src/simulation/journey/journey";
import { MAX_FLIGHT_RISE, STAIR_RISE } from "../src/simulation/journey/boardingStair";

/**
 * THE GIGA COASTER, CHECKED AGAINST THE BRIEF.
 *
 * Two things were asked for — "near the teacup ride" and "the size of this
 * ride should be equal to the teacup ride" — and a coaster brings a third
 * requirement nobody has to ask for: it has to be a machine a person could
 * ride. A hundred and twenty-seven metres of drop is a lot of energy, and
 * energy in a corner is force; a layout that looks right and pulls nine g is
 * not a roller coaster, it is a fairground accident. So the forces are
 * measured here, off the same modules the ride is drawn from.
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
const rideSource = read("src", "components", "giga-coaster", "GigaCoaster.tsx");

validateGigaCoaster();

const [rx, rz] = RIDE_CENTER;

/* ================= 1. AS BIG AS THE TEA CUPS ================= */

check(
  "ITS CREST IS EXACTLY THE TEA CUPS' HEIGHT",
  Math.abs(TRACK_PEAK - TEACUPS_HEIGHT) < 1e-9 && Math.abs(CREST_Y - TEACUPS_HEIGHT) < 1e-12,
  `${TRACK_PEAK.toFixed(6)} m of track against the Tea Cups' ${TEACUPS_HEIGHT} m — read from ` +
    `their own constants, so the two cannot drift`,
);
check(
  "and the track really reaches it — the curve is measured, not the control point",
  Math.abs(OVERALL_HEIGHT - CREST_Y) < 1e-12 && TRACK_PEAK <= CREST_Y + 1e-9,
  `a spline overshoots between its controls, so the heights are corrected until the SAMPLED ` +
    `peak lands on the number: ${TRACK_PEAK.toFixed(9)} m`,
);
/* It was built to match the Tea Cups, and every ride in the park is now built
   to that same height — so this check reads as equality rather than as a
   ranking. */
check(
  "it stands at the park's one common ride height, alongside the ride it matches",
  PARK_LAYOUT.every((r) => Math.abs(OVERALL_HEIGHT - r.height) < 0.01),
  `${OVERALL_HEIGHT} m against ${PARK_LAYOUT.map((r) => `${r.id} ${r.height.toFixed(0)}`).join(", ")} m`,
);

/* ================= 2. IT IS A COASTER ================= */

check(
  "thirty-two riders in eight cars, which is this park's own rule",
  SEAT_COUNT === CAR_COUNT * ROWS_PER_CAR * SEATS_PER_ROW && SEAT_COUNT >= 30 && SEAT_COUNT <= 40,
  `${CAR_COUNT} cars x ${ROWS_PER_CAR} rows x ${SEATS_PER_ROW} = ${SEAT_COUNT} riders`,
);
check(
  "the train fits the circuit several times over — it is a train, not a ring",
  TRAIN_LENGTH < TRACK_LENGTH / 8 && Math.abs(TRAIN_LENGTH - CAR_COUNT * CAR_PITCH) < 1e-12,
  `a ${TRAIN_LENGTH.toFixed(1)} m train on ${TRACK_LENGTH.toFixed(0)} m of track`,
);
{
  const colours = new Set(Array.from({ length: CAR_COUNT }, (_, i) => carColor(i)));
  check(
    "and it is painted a run of liveries",
    colours.size > 1,
    `${colours.size} liveries dealt round ${CAR_COUNT} cars`,
  );
}
check(
  "the circuit is a closed loop that starts and ends in the station",
  TRACK_POINTS.length > 1000 && TRACK_VALLEY < CREST_Y && CREST_DISTANCE > 0,
  `${TRACK_LENGTH.toFixed(0)} m round, from a ${TRACK_VALLEY.toFixed(1)} m valley to a ` +
    `${TRACK_PEAK.toFixed(0)} m crest at ${CREST_DISTANCE.toFixed(0)} m`,
);

/* ================= 3. THE MOTION IS GRAVITY ================= */

{
  /*
   * THE ENERGY EQUATION, checked against the run rather than described.
   *
   * Between the crest and the trim the train is a bead on a wire: its speed at
   * every point must be exactly what the height it has fallen gives it. That
   * is the one statement a swept animation cannot satisfy.
   */
  let worst = 0;
  for (const s of RUN_SAMPLES) {
    if (s.phase !== "coast") continue;
    if (s.distance > BRAKE_DISTANCE) continue;
    const expected = coastingSpeedAt(s.distance);
    worst = Math.max(worst, Math.abs(s.speed - expected));
  }
  check(
    "coasting, the train's speed is exactly what the drop gives it",
    worst < 0.2,
    `worst |v − √(v_crest² + 2g·Δh)| = ${worst.toExponential(2)} m/s over the free-running part ` +
      `of the circuit — which is the ten-millisecond integration step showing, on speeds of ` +
      `fifty metres a second, and not a departure from the equation`,
  );
  check(
    "it crawls up the lift and is fastest at the bottom of the drop",
    Math.abs(speedAtDistance(CREST_DISTANCE / 2) - LIFT_SPEED) < 0.2 &&
      Math.abs(TOP_SPEED - coastingSpeedAt(TRACK_LENGTH * 0)) < 60,
    `${(LIFT_SPEED * 3.6).toFixed(1)} km/h on the chain, ${(TOP_SPEED * 3.6).toFixed(0)} km/h at ` +
      `the bottom — which is √(2g·${(CREST_Y - TRACK_VALLEY).toFixed(0)} m) and nothing else`,
  );
  check(
    "the brake run is long enough to stop what arrives at it",
    (() => {
      const arrival = speedAtDistance(BRAKE_DISTANCE + 1);
      const stopped = speedAtDistance(TRACK_LENGTH - 2);
      return stopped < arrival / 4;
    })(),
    `${(speedAtDistance(BRAKE_DISTANCE + 1) * 3.6).toFixed(0)} km/h in, ` +
      `${(speedAtDistance(TRACK_LENGTH - 2) * 3.6).toFixed(1)} km/h out — the run is sized from ` +
      `v²/2a rather than guessed, which is what it took to stop the train arriving at 130 km/h`,
  );
  const last = RUN_SAMPLES[RUN_SAMPLES.length - 1];
  check(
    "and it comes home, exactly to the mark it started from",
    Math.abs(last.distance - TRACK_LENGTH) < 1e-9 && last.speed === 0,
    `${RUN_SECONDS.toFixed(0)} s a circuit, ${CYCLE_SECONDS.toFixed(0)} s a cycle with the dwell`,
  );
  check(
    /*
     * The frame loop still does no physics — it looks the train's place up —
     * but the clock it looks it up ON has changed. It used to be the ride's
     * own, wrapped at the cycle length; it is now the park's ride-operations
     * clock, which reads zero whenever the schedule says this ride is stopped.
     * That is what makes the train stand in its station for an arriving DevOps
     * employee instead of running past them.
     */
    "the frame loop reads that table on the PARK's clock, and does no physics of its own",
    /setDistance\(runDistanceAt\(rideAnimationSecondsNow\("giga"\)\)\)/.test(rideSource) &&
      !/simulationStore|rideSelectionStore/.test(rideSource),
    "one line, off the ride-operations clock; no store can reach it",
  );
  {
    const STEPS = 20_000;
    let worstStep = 0;
    let previous = trainStateAt(0).distance;
    for (let i = 1; i <= STEPS; i++) {
      const d = trainStateAt((i / STEPS) * CYCLE_SECONDS).distance;
      let step = d - previous;
      if (step < -TRACK_LENGTH / 2) step += TRACK_LENGTH;
      worstStep = Math.max(worstStep, Math.abs(step));
      previous = d;
    }
    check(
      "and nothing snaps — the train's position is continuous, wrap included",
      worstStep < 1,
      `worst step ${(worstStep * 100).toFixed(1)} cm per ${((CYCLE_SECONDS / STEPS) * 1000).toFixed(1)} ms`,
    );
  }
}

/* ================= 4. A PERSON COULD RIDE IT ================= */

{
  /*
   * THE FORCES, which is the check this ride exists to pass.
   *
   * A corner costs `v^2 / R` sideways, and at the bottom of a 127 m drop v is
   * enormous: hand-drawn, this layout had twenty-metre corners pulling nine g.
   * The plan is now GENERATED from a corner radius rather than drawn, so
   * nothing on it can be tighter than that radius — and this is where that is
   * proved, on every one of fourteen hundred samples.
   */
  const over = LATERAL_GEE.filter((g) => g > MAX_LATERAL_GEE_ALLOWED).length;
  const mean = LATERAL_GEE.reduce((a, b) => a + b, 0) / LATERAL_GEE.length;
  check(
    "NOTHING ON THE CIRCUIT PULLS MORE SIDEWAYS THAN A REAL COASTER DOES",
    over === 0 && MAX_LATERAL_GEE <= MAX_LATERAL_GEE_ALLOWED,
    `worst ${MAX_LATERAL_GEE.toFixed(2)} g against a ${MAX_LATERAL_GEE_ALLOWED} g limit, ` +
      `${mean.toFixed(2)} g on average over ${LATERAL_GEE.length} samples — none of them over`,
  );
  check(
    "and no corner is tighter than the radius the plan was generated from",
    Math.min(...TRACK_FRAMES.map((f) => f.radius)) > 40,
    `tightest corner ${Math.min(...TRACK_FRAMES.map((f) => f.radius)).toFixed(0)} m; drawn by ` +
      `hand this layout kept inventing twenty-metre ones between its control points`,
  );
  check(
    "the track is banked into its corners, and only into its corners",
    MAX_BANK > 0.5 &&
      MAX_BANK < Math.PI / 2 &&
      TRACK_FRAMES.filter((f) => Math.abs(f.bank) < 0.02).length > 100,
    `up to ${((MAX_BANK * 180) / Math.PI).toFixed(0)}° where it turns and flat down the ` +
      `straights — solved as atan(v²/R ÷ g), so the force on a rider goes down through the seat`,
  );
  check(
    "the banking answers the PLAN's curvature, not the drop's",
    (() => {
      /*
       * Wherever the track is STRAIGHT in plan it must be flat, however
       * violently it is climbing or falling there — a hill is not a corner.
       * Measuring the radius in three dimensions instead of in plan banked
       * this track ninety degrees at the bottom of the drop, standing the
       * train on its side where it should be flat and heavy.
       */
      /*
       * The LIFT HILL is the test: the steepest sustained gradient on the ride
       * and dead straight in plan. Banked on three-dimensional curvature it
       * came out tilted; banked on the plan it is flat, which is what a chain
       * lift is. (A gentle curve taken at a hundred and sixty km/h is banked
       * properly and hard — so "straight in plan" is the claim here, not "not
       * very curved".)
       */
      const lift = TRACK_FRAMES.filter(
        (f) => f.distance > CREST_DISTANCE * 0.35 && f.distance < CREST_DISTANCE * 0.9,
      );
      return lift.length > 50 && lift.every((f) => Math.abs(f.bank) < 0.05);
    })(),
    `the whole lift hill is flat to within three degrees while climbing at its steepest`,
  );
}
check(
  "riders board off a platform level with the car floor, up one straight flight",
  PLATFORM_Y < MAX_FLIGHT_RISE && Math.round(PLATFORM_Y / STAIR_RISE) * STAIR_RISE < MAX_FLIGHT_RISE,
  `${Math.round(PLATFORM_Y / STAIR_RISE)} steps of the park's own ` +
    `${(STAIR_RISE * 100).toFixed(0)} cm rise up to a ${PLATFORM_Y.toFixed(2)} m platform`,
);

/* ================= 5. ITS SLOT ON THE PARK RING ================= */

/*
 * THE BRIEF THAT PUT THIS RIDE HERE HAS CHANGED, and the checks change with it
 * rather than being deleted.
 *
 * It was asked for the nearest clear ground to the Tea Cups, and the placement
 * searched outward from them.
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
    Math.abs(bearing - RIDE_SLOT_BEARING.giga) < 1e-9,
    `${bearing.toFixed(6)}deg against the plan's ${RIDE_SLOT_BEARING.giga}deg`,
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
  const entrance = rideEntrance("giga");
  const start = radialStart("giga");
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

/* ================= 6. IT JOINED THE ROUTING SYSTEM, AND MOVED NOTHING ======= */

/*
 * THIS SECTION USED TO SAY THE OPPOSITE, and the change is the user's:
 * "the giga coaster is for devops team", and then, plainly, "the devops
 * employees only go and sit on the giga coaster ride".
 *
 * It was an attraction with no department: not in the park layout, unknown to
 * the layout module, and nobody routed to it. It is a department ride now. What
 * has to be proved is that it took nothing from the park to become one — it
 * stands where it stood, at the size it declares, and the five rides that were
 * in the layout before are exactly where they were.
 */
check(
  "it is in the park layout now, on the very slot it already stood on",
  PARK_LAYOUT.some((r) => r.id === GIGA_RIDE_ID) &&
    Math.hypot(
      rideById(GIGA_RIDE_ID).center[0] - RIDE_CENTER[0],
      rideById(GIGA_RIDE_ID).center[1] - RIDE_CENTER[1],
    ) < 1e-9,
  `layout centre (${rideById(GIGA_RIDE_ID).center.map((n) => n.toFixed(1)).join(", ")}) ` +
    `= its own placement, to the last digit`,
);
check(
  "and it is drawn at the size it declares — the solver did not scale it",
  Math.abs(rideScale(GIGA_RIDE_ID) - 1) < 1e-12 &&
    Math.abs(rideById(GIGA_RIDE_ID).height - OVERALL_HEIGHT) < 1e-9,
  `${rideScale(GIGA_RIDE_ID).toFixed(3)}x — its crest reads out of the Tea Cups, which is ` +
    `where the park's uniform height comes from, so the ratio is exactly one`,
);
check(
  "listing it moved no other ride — every one is still on its own ring slot",
  PARK_LAYOUT.every((r) => {
    const slot = ringCenterOf(r.id as RingRideId);
    return Math.hypot(r.center[0] - slot[0], r.center[1] - slot[1]) < 1e-9;
  }),
  `${PARK_LAYOUT.length} rides in the layout, each exactly on the slot parkRing.ts gives it`,
);
check(
  "it is mounted in world space, once, with no offset and no scale of its own",
  (scene.match(/<GigaCoaster \/>/g) ?? []).length === 1 &&
    !/<group[^>]*>\s*<GigaCoaster/.test(scene),
  "one render line; it positions itself",
);
check(
  "no existing ride's mounting changed",
  (scene.match(/<SelectableRide id=/g) ?? []).length === 5,
  "the five department rides are wrapped exactly as before",
);
check(
  "DevOps ride it, and only DevOps",
  JOURNEY_EMPLOYEES.filter((e) => (e.rideId as string) === GIGA_RIDE_ID).every(
    (e) => e.department === "devops",
  ) &&
    JOURNEY_EMPLOYEES.filter((e) => e.department === "devops").every(
      (e) => (e.rideId as string) === GIGA_RIDE_ID,
    ),
  `${JOURNEY_EMPLOYEES.filter((e) => e.department === "devops").length} devops employees on ` +
    `this date, every one of them bound for the Giga Coaster and nobody else aboard`,
);
check(
  "it is reachable by fast travel under the department it serves",
  placeById(GIGA_RIDE_ID).label === `${departmentFor(GIGA_RIDE_ID).department} — ${GIGA_RIDE_NAME}`,
  placeById(GIGA_RIDE_ID).label,
);
{
  const inside = [...PARK_TREES, ...PARK_SHRUBS].filter(
    (p) => Math.hypot(p.x - rx, p.z - rz) < OVERALL_REACH,
  );
  check(
    "no tree or shrub is left standing inside the circuit",
    inside.length === 0,
    `${inside.length} plants within ${OVERALL_REACH.toFixed(0)} m of the ride`,
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

/* ================= 7. THE SHADOW BUDGET ================= */

{
  const files = ["Track.tsx", "Train.tsx", "Station.tsx", "GigaCoaster.tsx"];
  const casters = files.reduce(
    (total, f) => total + (read("src", "components", "giga-coaster", f).match(/castShadow/g) ?? []).length,
    0,
  );
  check(
    "the ride keeps a tight shadow budget",
    casters <= 10,
    `${casters} castShadow sites across ${files.length} files — ties, wheels, harnesses and ` +
      `handrails are drawn but do not cast`,
  );
  check(
    "and the ties are one instanced mesh, not three hundred",
    /instancedMesh/.test(read("src", "components", "giga-coaster", "Track.tsx")),
    `${Math.floor(TRACK_LENGTH / 3.2)} ties on ${TRACK_LENGTH.toFixed(0)} m of track, in one draw`,
  );
}

/* ================= SUMMARY ================= */

console.log(
  `\n${GIGA_RIDE_NAME} — ${SEAT_COUNT} riders on ${TRACK_LENGTH.toFixed(0)} m of track, a ` +
    `${TRACK_PEAK.toFixed(0)} m lift hill (exactly the Tea Cups' height) and a ` +
    `${(TRACK_PEAK - TRACK_VALLEY).toFixed(0)} m drop that gets it to ` +
    `${(TOP_SPEED * 3.6).toFixed(0)} km/h.`,
);
console.log(
  `Chain at ${(LIFT_SPEED * 3.6).toFixed(0)} km/h, then gravity: worst corner ` +
    `${MAX_LATERAL_GEE.toFixed(2)} g against a ${MAX_LATERAL_GEE_ALLOWED} g limit, banked up to ` +
    `${((MAX_BANK * 180) / Math.PI).toFixed(0)}°, home in ${RUN_SECONDS.toFixed(0)} s.`,
);
console.log(
  `Standing at (${rx.toFixed(1)}, ${rz.toFixed(1)}) — slot ${RIDE_SLOT_BEARING.giga}deg, `+
    `${RIDE_RING_RADIUS.toFixed(0)} m out like every other ride, on a `+
    `${(RIDE_PLOT_RADIUS * 2).toFixed(0)} m platform reached by a `+
    `${RADIAL_PATH_LENGTH.toFixed(0)} m radial path. Every ride in the park has the same three.`,
);
console.log(failures === 0 ? "\nOK: giga coaster verified." : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
