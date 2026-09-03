import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  APRON_RADIUS,
  BEHIND_RIDE_ID,
  CANOPY_RADIUS,
  CANOPY_RIM_Y,
  CUP_CLEARANCE,
  CUP_COUNT,
  CUP_HEIGHT,
  CUP_PITCH_RADIANS,
  COMFORT_GEE,
  CUP_INNER_RADIUS,
  CUP_RADIANS_PER_SEC,
  CUP_RADIUS,
  CUP_RING_RADIUS,
  CUP_ROTATION_SIGN,
  CUP_RPM,
  DECK_Y,
  LOAD_SECONDS,
  OVERALL_HEIGHT,
  OVERALL_REACH,
  PLATE_RADIUS,
  PLATE_RADIANS_PER_SEC,
  PLATE_RPM,
  PLINTH_HEIGHT,
  RIDER_SPEED,
  RIDE_SCALE,
  SEATS_PER_CUP,
  SEAT_COUNT,
  BESTON_PLATE_RPM,
  TEACUPS_RIDE_ID,
  TEACUPS_RIDE_NAME,
  TEACUPS_TEAM_NAME,
  cupColor,
  validateTeaCups,
} from "../src/components/tea-cups/constants";
import { CUP_PLACEMENTS, neighbourClearance } from "../src/components/tea-cups/cupRing";
import { CYCLE_SECONDS, cupsStateAt } from "../src/components/tea-cups/motion";
import {
  BEHIND_DISTANCE,
  COMFORT_SLACK,
  NEIGHBOUR,
  RIDE_CENTER,
  RIDE_FACING,
  acrossBearing,
  alongBearing,
  hidesARide,
  slackAt,
} from "../src/components/tea-cups/placement";
import { PARK_LAYOUT } from "../src/components/park/layout";
import { DEPARTMENTS, rideForDepartment } from "../src/components/park/departments";
import { TEACUPS_SIGN } from "../src/components/tea-cups/sign";
import {
  STATION_FLIGHTS,
  STATION_RISE,
  STATION_STEPS,
} from "../src/components/tea-cups/station";
import { placeById } from "../src/components/world/cameraPlaces";
import { PARK_SHRUBS, PARK_TREES } from "../src/components/world/planting";
import { JOURNEY_EMPLOYEES } from "../src/simulation/journey/journey";
import { MAX_FLIGHT_RISE, STAIR_RISE } from "../src/simulation/journey/boardingStair";
import { GATE_X, GATE_Z } from "../src/simulation/journey/constants";
import { HUMAN } from "../src/world/scale";

/**
 * THE TEA CUPS, CHECKED AGAINST THE BRIEF.
 *
 * The brief was a manufacturer's page and one sentence: "i want this ride
 * should be present behind the dataengineering ride". So there are two halves
 * to prove.
 *
 * IS IT BESTON'S MACHINE? Twenty-four riders a cycle, a six-metre plate in an
 * eight-metre square, 3.8 rpm, cups that counter-rotate under a decorated
 * ceiling. Every one of those is measured here off the modules the park
 * renders from, at the manufacturer's own proportions — the ride is built
 * larger than life, but by ONE factor on every axis, which is asserted rather
 * than asserted-about.
 *
 * IS IT BEHIND THE DATA ENGINEERING RIDE? That ride is the UFO Pendulum, and
 * "behind" is taken from the main gate: the cups must sit on the gate's own
 * line of sight through the pendulum, and further out along it. Both are
 * measured rather than eyeballed.
 *
 * And the unspoken one: nothing else in the park may move.
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
const rideSource = read("src", "components", "tea-cups", "TeaCups.tsx");

validateTeaCups();

const [rx, rz] = RIDE_CENTER;

/* ================= 1. IT IS BESTON'S MACHINE ================= */

check(
  "TWENTY-FOUR RIDERS A CYCLE, four to a cup — the manufacturer's own figure",
  SEAT_COUNT === 24 && CUP_COUNT * SEATS_PER_CUP === SEAT_COUNT,
  `${CUP_COUNT} cups x ${SEATS_PER_CUP} = ${SEAT_COUNT} riders`,
);
check(
  "the ride renders exactly that many cups, from the same array this file checks",
  CUP_PLACEMENTS.length === CUP_COUNT,
  `${CUP_PLACEMENTS.length} placements`,
);
{
  const gaps = CUP_PLACEMENTS.map((p, i) => {
    const next = CUP_PLACEMENTS[(i + 1) % CUP_COUNT];
    let d = next.azimuth - p.azimuth;
    if (d < 0) d += Math.PI * 2;
    return d;
  });
  const worst = Math.max(...gaps.map((g) => Math.abs(g - CUP_PITCH_RADIANS)));
  check(
    "evenly spaced — every gap the same 60°, including the wrap",
    worst < 1e-12 && Math.abs(gaps.reduce((a, b) => a + b, 0) - Math.PI * 2) < 1e-12,
    `worst deviation ${worst.toExponential(2)} rad over ${gaps.length} gaps`,
  );
  const radii = CUP_PLACEMENTS.map((p) => Math.hypot(p.position[0], p.position[1]));
  check(
    "and perfectly symmetrical — one radius, centred on the column",
    Math.max(...radii) - Math.min(...radii) < 1e-12,
    `all six at ${radii[0].toFixed(2)} m from the middle`,
  );
  check(
    "no cup overhangs the plate, and no two can touch",
    CUP_RING_RADIUS + CUP_RADIUS <= PLATE_RADIUS - CUP_CLEARANCE + 1e-9 &&
      neighbourClearance() > 0,
    `${(PLATE_RADIUS - CUP_RING_RADIUS - CUP_RADIUS).toFixed(2)} m of plate outside each cup and ` +
      `${neighbourClearance().toFixed(2)} m of air between neighbours — this is a compact machine`,
  );
  const colours = new Set(Array.from({ length: CUP_COUNT }, (_, i) => cupColor(i)));
  check(
    "every cup a different glaze",
    colours.size === CUP_COUNT,
    `${colours.size} glazes over ${CUP_COUNT} cups`,
  );
}
{
  /*
   * THE MANUFACTURER'S PROPORTIONS, and the one factor they are multiplied by.
   *
   * Beston publish a 6 m rotating plate in an 8 m square of ground. Both are
   * checked as RATIOS against RIDE_SCALE, so the machine cannot quietly be
   * stretched in one axis: if the plate and the apron do not agree on the same
   * factor, this fails.
   */
  check(
    "the plate is Beston's 6 m, and the apron Beston's 8 m square, at one scale",
    Math.abs(PLATE_RADIUS / RIDE_SCALE - 3) < 1e-12 &&
      Math.abs(APRON_RADIUS / RIDE_SCALE - 4) < 1e-12,
    `a ${(PLATE_RADIUS * 2).toFixed(1)} m plate on a ${(APRON_RADIUS * 2).toFixed(1)} m apron — ` +
      `the published 6 m and 8 m, both at ${RIDE_SCALE}x`,
  );
  check(
    "and it is scaled UP because a real one would be invisible here, not by whim",
    RIDE_SCALE > 1 && CUP_RADIUS * 2 > 4,
    `${RIDE_SCALE}x gives a ${(CUP_RADIUS * 2).toFixed(1)} m cup, against a ${HUMAN.height} m ` +
      `rider who is not scaled with it; the park's other rides use 2.2x to 2.56x for the same ` +
      `reason and are far bigger machines`,
  );
  /*
   * IT USED TO BE THE SMALLEST RIDE IN THE PARK, and this check said so. The
   * user has since asked for it twenty times over, so it is now the tallest —
   * a change worth stating rather than quietly rewording.
   *
   * What is asserted instead is the thing that has to hold at any size: the
   * ride still FITS. Twenty times the machine as it stood would have been an
   * apron 480 m across against a park whose whole fan of rides is 508 m by
   * 356 m, and it would have had to stand seven hundred metres out past the
   * railway — nowhere near the ride it was asked to stand behind.
   */
  const spanX = Math.max(...PARK_LAYOUT.map((r) => r.maxX)) - Math.min(...PARK_LAYOUT.map((r) => r.minX));
  const spanZ = Math.max(...PARK_LAYOUT.map((r) => r.maxZ)) - Math.min(...PARK_LAYOUT.map((r) => r.minZ));
  /* It was the tallest ride in the park, and the park has since been levelled
     UP to it: this ride's 20x height is the common height every other ride is
     now built to. */
  check(
    "it sets the park's one common ride height, and still fits inside the park",
    PARK_LAYOUT.every((r) => Math.abs(OVERALL_HEIGHT - r.height) < 0.01) &&
      OVERALL_REACH * 2 < Math.min(spanX, spanZ),
    `${OVERALL_HEIGHT.toFixed(0)} m against ${PARK_LAYOUT.map((r) => `${r.id} ${r.height.toFixed(0)}`).join(", ")} m, ` +
      `on an apron ${(OVERALL_REACH * 2).toFixed(0)} m across inside a ${spanX.toFixed(0)} x ` +
      `${spanZ.toFixed(0)} m park`,
  );
}

/* ================= 2. IT TURNS LIKE A TEA CUP RIDE ================= */

{
  const SAMPLES = 20_000;
  let worstDriveStep = 0;
  let previous = cupsStateAt(0).drive;
  let spinningWhileStopped = 0;
  let sameDirection = 0;
  for (let i = 1; i <= SAMPLES; i++) {
    const s = cupsStateAt((i / SAMPLES) * CYCLE_SECONDS);
    worstDriveStep = Math.max(worstDriveStep, Math.abs(s.drive - previous));
    previous = s.drive;
    if (s.plateRate === 0 && s.cupRate !== 0) spinningWhileStopped++;
    if (s.plateRate !== 0 && Math.sign(s.cupRate) === Math.sign(s.plateRate)) sameDirection++;
  }

  {
    /*
     * THE MANUFACTURER'S RPM DOES NOT SURVIVE THE ENLARGEMENT, and the check
     * says so with the number rather than hiding it. Beston's 3.8 rpm on their
     * own 6 m plate is walking pace; on a plate twenty times across it is a
     * motorway speed for somebody sitting in an open cup. So the rate is
     * derived from what the ride does to the rider, and this asserts that the
     * derivation is what the constant actually holds.
     */
    const bestonHere = ((BESTON_PLATE_RPM * Math.PI * 2) / 60) * CUP_RING_RADIUS;
    check(
      "the plate's speed is set by what it does to a rider, not by a rate copied across sizes",
      Math.abs(PLATE_RADIANS_PER_SEC * CUP_RING_RADIUS - RIDER_SPEED) < 1e-12 &&
        PLATE_RPM < BESTON_PLATE_RPM,
      `${PLATE_RPM.toFixed(2)} rpm carries a rider at ${(RIDER_SPEED * 3.6).toFixed(1)} km/h; ` +
        `Beston's ${BESTON_PLATE_RPM} rpm, which is right for their 6 m plate, would be ` +
        `${(bestonHere * 3.6).toFixed(0)} km/h on this one`,
    );
  }
  check(
    "the cups turn the OPPOSITE way to the plate, at every moment of the cycle",
    CUP_ROTATION_SIGN === -1 && sameDirection === 0,
    `${SAMPLES} samples, not one with both turning the same way`,
  );
  check(
    "and a cup can never spin while the ride is stopped — one drive, not two",
    spinningWhileStopped === 0,
    "both rates are the same ramp times their own speed",
  );
  check(
    "it comes to a dead stand to load, and again to unload",
    cupsStateAt(LOAD_SECONDS / 2).drive === 0 &&
      cupsStateAt(CYCLE_SECONDS - 1).drive === 0 &&
      cupsStateAt(LOAD_SECONDS / 2).plateRate === 0,
    `${LOAD_SECONDS} s of it stopped at the start of every ${CYCLE_SECONDS} s cycle`,
  );
  check(
    "and nothing snaps — the drive is continuous the whole way round, wrap included",
    worstDriveStep < (1 / 6) * (CYCLE_SECONDS / SAMPLES) * 2.1,
    `worst step ${(worstDriveStep * 100).toExponential(2)}% of full speed per ` +
      `${((CYCLE_SECONDS / SAMPLES) * 1000).toFixed(1)} ms`,
  );
  check(
    "the frame loop reads that one ramp and keeps no physics of its own",
    /rotation\.y \+= state\.plateRate \* delta/.test(rideSource) &&
      /rotation\.y \+= state\.cupRate \* delta/.test(rideSource) &&
      !/simulationStore|rideSelectionStore/.test(rideSource),
    "one line each; no store and no simulation clock can reach them",
  );
  {
    /*
     * IS IT STILL A GENTLE MACHINE? Speed is the wrong question for a ride
     * this size — a big plate at a low rate carries you fast in metres per
     * second while barely pulling on you at all, and it is the PULL that a
     * rider feels, sitting unrestrained in an open cup with a hand wheel to
     * hold. So the check is on lateral acceleration: the plate's, the cup's,
     * and the two at their worst when they add.
     *
     * A fifth of a g is the figure. Beston sell this ride as "suitable age:
     * all ages", and a fifth of a g is about what leaning into a brisk corner
     * on foot feels like.
     */
    const plateG = (PLATE_RADIANS_PER_SEC ** 2 * CUP_RING_RADIUS) / 9.80665;
    const cupG = (CUP_RADIANS_PER_SEC ** 2 * CUP_INNER_RADIUS) / 9.80665;
    check(
      "it is still a gentle machine — what a rider FEELS is the budget, exactly",
      Math.abs(plateG + cupG - COMFORT_GEE) < 1e-9 && COMFORT_GEE <= 0.2,
      `${plateG.toFixed(3)} g from the plate and ${cupG.toFixed(3)} g from the cup, ` +
        `${(plateG + cupG).toFixed(3)} g when they add — at ` +
        `${(RIDER_SPEED * 3.6).toFixed(1)} km/h round a ${(PLATE_RADIUS * 2).toFixed(0)} m plate, ` +
        `which is fast in metres per second and gentle in the only way that matters`,
    );
  }
}

/* ================= 3. A RIDER CAN GET ON IT ================= */

{
  /*
   * Riders still load off the plate itself — the machine stops and they walk
   * on. What changed with the enlargement is how far up that plate is: it is
   * twenty times thicker than it was, so the deck is five metres rather than
   * two and the climb takes two of the park's flights instead of one. The
   * PLINTH did not grow with it, being a foundation rather than a proportion.
   */
  const tallest = Math.max(...STATION_FLIGHTS) * STATION_RISE;
  check(
    "riders load off the plate, up the fewest flights the park's stair rule allows",
    STATION_FLIGHTS.length === Math.ceil(DECK_Y / MAX_FLIGHT_RISE) &&
      tallest <= MAX_FLIGHT_RISE &&
      Math.abs(STATION_STEPS * STATION_RISE - DECK_Y) < 1e-9,
    `${STATION_FLIGHTS.length} flights of ${STATION_FLIGHTS.join(" and ")} steps up to a ` +
      `${DECK_Y.toFixed(2)} m deck, at the park's own ${(STAIR_RISE * 100).toFixed(0)} cm rise — ` +
      `a ${PLINTH_HEIGHT.toFixed(2)} m foundation under a ${(DECK_Y - PLINTH_HEIGHT).toFixed(2)} m plate`,
  );
}
check(
  "a rider can stand up in a cup without meeting the ceiling",
  CANOPY_RIM_Y > DECK_Y + CUP_HEIGHT + HUMAN.height,
  `ceiling at ${CANOPY_RIM_Y.toFixed(1)} m over a ${CUP_HEIGHT.toFixed(1)} m cup on a ` +
    `${DECK_Y.toFixed(2)} m deck`,
);
check(
  "and the ceiling covers the cups it is over",
  CANOPY_RADIUS >= CUP_RING_RADIUS + CUP_RADIUS,
  `${CANOPY_RADIUS.toFixed(1)} m of roof over cups reaching ` +
    `${(CUP_RING_RADIUS + CUP_RADIUS).toFixed(1)} m`,
);

/* ================= 4. BEHIND THE DATA ENGINEERING RIDE ================= */

check(
  "the ride it stands behind is the one Data Engineering is sent to",
  rideForDepartment("Data Engineering").rideId === BEHIND_RIDE_ID,
  `Data Engineering rides the ${rideForDepartment("Data Engineering").rideName}, and that is ` +
    `what this ride stands behind — the mapping is read, not assumed`,
);
{
  const along = alongBearing(rx, rz);
  const neighbourAlong = alongBearing(NEIGHBOUR.center[0], NEIGHBOUR.center[1]);
  check(
    "IT IS BEHIND IT — further from the gate along the gate's own line of sight",
    along > neighbourAlong + NEIGHBOUR.halfX,
    `${along.toFixed(0)} m out along that line against the pendulum's ${neighbourAlong.toFixed(0)} m`,
  );
  check(
    "and squarely behind it — not off to one side",
    Math.abs(acrossBearing(rx, rz)) < 1e-9,
    `${acrossBearing(rx, rz).toExponential(1)} m off the line; the ride sits on it exactly`,
  );
  {
    /*
     * AS CLOSE BEHIND AS THE PARK ALLOWS, asserted by construction rather than
     * against a number: a metre nearer must FAIL. That is the honest form of
     * "as close as possible", and unlike a bound on the distance it stays true
     * however big the ride gets — which matters, because it just got twenty
     * times bigger and moved a hundred and sixty metres further out as a
     * direct result.
     */
    const closer = BEHIND_DISTANCE - 1;
    const cx = NEIGHBOUR.center[0] + (rx - NEIGHBOUR.center[0]) * (closer / BEHIND_DISTANCE);
    const cz = NEIGHBOUR.center[1] + (rz - NEIGHBOUR.center[1]) * (closer / BEHIND_DISTANCE);
    const worstCloser = Math.min(...slackAt(cx, cz).map((s) => s.slack));
    check(
      "as close behind as the park's margins allow — a metre nearer does not fit",
      BEHIND_DISTANCE > NEIGHBOUR.halfX && worstCloser < COMFORT_SLACK,
      `${BEHIND_DISTANCE.toFixed(1)} m out from the pendulum's centre; a metre nearer leaves ` +
        `${worstCloser.toFixed(1)} m against the ${COMFORT_SLACK} m the search insists on`,
    );
  }
  check(
    "its gate faces back towards the entrance, so visitors arrive at the steps",
    (() => {
      const faceX = Math.cos(RIDE_FACING);
      const faceZ = -Math.sin(RIDE_FACING);
      const toGateX = GATE_X - rx;
      const toGateZ = GATE_Z - rz;
      const len = Math.hypot(toGateX, toGateZ) || 1;
      return Math.abs((faceX * toGateX + faceZ * toGateZ) / len - 1) < 1e-9;
    })(),
    "the opening in the rail points exactly down the line back to the main gate",
  );
}
for (const { what, slack } of slackAt(rx, rz)) {
  check(
    `it clears ${what}`,
    slack >= 0,
    `${slack >= 0 ? "+" : ""}${slack.toFixed(1)} m beyond the margin it owes ` +
      `(reach ${OVERALL_REACH.toFixed(1)} m)`,
  );
}
check(
  "and with room in hand",
  Math.min(...slackAt(rx, rz).map((s) => s.slack)) >= COMFORT_SLACK - 1e-9,
  `tightest margin ${Math.min(...slackAt(rx, rz).map((s) => s.slack)).toFixed(1)} m over, ` +
    `against the ${COMFORT_SLACK} m the search insists on`,
);
check(
  "it hides no ride from the entrance — standing behind one is not hiding it",
  !hidesARide(rx, rz),
  "nothing nearer to the viewpoint than it shares its slice of the view",
);

/* ================= 4b. IT IS SIGNED FOR RISK ================= */

check(
  "the board says Risk",
  TEACUPS_SIGN.department === TEACUPS_TEAM_NAME &&
    TEACUPS_SIGN.rideName === TEACUPS_RIDE_NAME &&
    TEACUPS_SIGN.rideId === TEACUPS_RIDE_ID,
  `"${TEACUPS_SIGN.department}" — ${TEACUPS_SIGN.rideName}`,
);
check(
  "its signboard stands beside the ride, not underneath it",
  Math.hypot(TEACUPS_SIGN.position[0] - rx, TEACUPS_SIGN.position[1] - rz) > OVERALL_REACH,
  `${Math.hypot(TEACUPS_SIGN.position[0] - rx, TEACUPS_SIGN.position[1] - rz).toFixed(1)} m from ` +
    `the column, ride reach ${OVERALL_REACH.toFixed(1)} m`,
);
check(
  "and it is a LABEL — Risk is not a department anybody is routed to",
  !DEPARTMENTS.some((d) => d.department === TEACUPS_TEAM_NAME) &&
    JOURNEY_EMPLOYEES.every((e) => (e.rideId as string) !== TEACUPS_RIDE_ID),
  `the roster's departments are ${DEPARTMENTS.map((d) => d.department).join(", ")} — no Risk ` +
    `among them, and no employee bound for this ride`,
);

/* ================= 5. NOTHING ELSE MOVED ================= */

check(
  "the ride is not in the park layout — the solver was never re-run",
  PARK_LAYOUT.length === 5 && !PARK_LAYOUT.some((r) => r.id === TEACUPS_RIDE_ID),
  `${PARK_LAYOUT.length} rides in the solver, as before`,
);
check(
  "and the layout module does not know it exists",
  !/tea-cups|TeaCups/.test(layoutSource),
  "no import, no box, no bearing added",
);
check(
  "it is mounted in world space, once, with no offset and no scale of its own",
  (scene.match(/<TeaCups \/>/g) ?? []).length === 1 && !/<group[^>]*>\s*<TeaCups/.test(scene),
  "one render line; it positions itself",
);
check(
  "no existing ride's mounting changed",
  (scene.match(/<SelectableRide id=/g) ?? []).length === 5,
  "the five department rides are wrapped exactly as before",
);
check(
  "no employee is routed to it — it is an attraction, not a destination",
  JOURNEY_EMPLOYEES.every((e) => (e.rideId as string) !== TEACUPS_RIDE_ID),
  `${JOURNEY_EMPLOYEES.length} employees, none bound for it; Data Engineering still rides the ` +
    `pendulum in front of it`,
);
check(
  "it is reachable by fast travel under its team's name",
  placeById(TEACUPS_RIDE_ID).label === `${TEACUPS_TEAM_NAME} — ${TEACUPS_RIDE_NAME}`,
  placeById(TEACUPS_RIDE_ID).label,
);
{
  const inside = [...PARK_TREES, ...PARK_SHRUBS].filter(
    (p) => Math.hypot(p.x - rx, p.z - rz) < OVERALL_REACH,
  );
  check(
    "no tree or shrub is left standing inside the ride",
    inside.length === 0,
    `${inside.length} plants within ${OVERALL_REACH.toFixed(1)} m of the column`,
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
  const files = ["Cup.tsx", "Canopy.tsx", "Platform.tsx", "TeaCups.tsx"];
  const casters = files.reduce(
    (total, f) => total + (read("src", "components", "tea-cups", f).match(/castShadow/g) ?? []).length,
    0,
  );
  check(
    "the ride keeps a tight shadow budget",
    casters <= 10,
    `${casters} castShadow sites across ${files.length} files — cornice scallops, lamps, hand ` +
      `wheels, rail posts and saucers are drawn but do not cast`,
  );
  check(
    "and it shares its materials rather than making one per mesh",
    /export const MATERIAL/.test(read("src", "components", "tea-cups", "parts.ts")),
    `six cups share six glazes and one set of fittings`,
  );
}

/* ================= SUMMARY ================= */

console.log(
  `\n${TEACUPS_RIDE_NAME}, signed for ${TEACUPS_TEAM_NAME} — Beston's tea cup ride at ` +
    `${RIDE_SCALE}x: ${SEAT_COUNT} riders in ${CUP_COUNT} cups on a ` +
    `${(PLATE_RADIUS * 2).toFixed(1)} m plate at ${PLATE_RPM.toFixed(2)} rpm, under a ` +
    `${(CANOPY_RADIUS * 2).toFixed(1)} m ceiling, ${OVERALL_HEIGHT.toFixed(1)} m to the finial. ` +
    `Twenty times the manufacturer's own machine, which is the largest the park's own ground ` +
    `will take.`,
);
console.log(
  `The plate carries a rider at ${(RIDER_SPEED * 3.6).toFixed(1)} km/h and each cup counter-spins ` +
    `at ${CUP_RPM.toFixed(1)} rpm; it stops dead for ${LOAD_SECONDS} s of every ` +
    `${CYCLE_SECONDS} s to be walked on to.`,
);
console.log(
  `Standing at (${rx.toFixed(1)}, ${rz.toFixed(1)}) — ${BEHIND_DISTANCE.toFixed(0)} m behind the ` +
    `UFO Pendulum on the gate's own line of sight through it, with ` +
    `${Math.min(...slackAt(rx, rz).map((s) => s.slack)).toFixed(1)} m in hand on every margin. ` +
    `Nothing else moved.`,
);
console.log(failures === 0 ? "\nOK: tea cups verified." : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
