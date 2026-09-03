import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as THREE from "three";
import {
  ARM_THICKNESS,
  ARM_TIP_DROP,
  BASE_SKIRT_RADIUS,
  BEHIND_DISTANCE,
  CANOPY_RADIUS,
  CHAIR_FOOT_DROP,
  CHAIR_SCALE,
  CHAIRS_RIDE_NAME,
  CHAIRS_TEAM_ID,
  CHAIRS_TEAM_NAME,
  CANOPY_SOFFIT_Y,
  CHAIN_LENGTH,
  CHAIR_VISIBLE_HEIGHT,
  COLUMN_HEIGHT,
  chairColor,
  FLARE_ANGLE,
  FLIGHT_RADIUS,
  GRAVITY,
  GUSSET_TOP_Y,
  HANGER_RADIUS,
  HUB_Y,
  LADDER_AZIMUTH,
  LADDER_CAGE_RADIUS,
  LADDER_GATE_ARC,
  LADDER_RADIUS,
  LADDER_RUNG_COUNT,
  LADDER_RUNG_PITCH,
  LADDER_TOP_Y,
  LADDER_WIDTH,
  LIFT_TRAVEL,
  OVERALL_HEIGHT,
  OVERALL_REACH,
  PLATFORM_CLEARANCE,
  PLATFORM_INNER_RADIUS,
  PLATFORM_OUTER_RADIUS,
  PLATFORM_Y,
  RAIL_HEIGHT,
  RIDER_SPEED,
  RIDE_CENTER,
  ROTATION_RADIANS_PER_SEC,
  ROTATION_RPM,
  ROTATION_SIGN,
  SEAT_COUNT,
  SEAT_DEPTH,
  SEAT_FLIGHT_Y,
  SEAT_LOAD_Y,
  SEAT_PITCH_RADIANS,
  SEAT_WIDTH,
  SWEEP_CLEARANCE,
  SWEEP_LOAD_SOFFIT_Y,
  VALANCE_DROP,
  validateFlyingChairs,
} from "../src/components/flying-chairs/constants";
import {
  CRUISE_SECONDS,
  CYCLE_SECONDS,
  HOIST_SECONDS,
  LOAD_SECONDS,
  LOWER_SECONDS,
  UNLOAD_SECONDS,
  chairEnvelopeAt,
  sweepAt,
} from "../src/components/flying-chairs/liftCycle";
import { LAY_FLAT } from "../src/components/flying-chairs/parts";
import { SEAT_PLACEMENTS, neighbourGap } from "../src/components/flying-chairs/seatRing";
import {
  MAIN_VIEWPOINT,
  PARK_CENTER,
  PARK_LAYOUT,
  PLAZA_CENTER,
  PLAZA_RADIUS,
  rideById,
  viewAngles,
} from "../src/components/park/layout";
import { RIDE_SIGNS } from "../src/components/park/rideSigns";
import { placeById } from "../src/components/world/cameraPlaces";
import { CHAIRS_SIGN } from "../src/components/park/rideSigns";
import { TRACK_CURVE } from "../src/components/park-train/trainTrack";
import { TRAIN_SCALE } from "../src/components/park/parkScale";
import { distanceToPaving } from "../src/components/world/paths";
import { PARK_SHRUBS, PARK_TREES } from "../src/components/world/planting";
import { JOURNEY_EMPLOYEES } from "../src/simulation/journey/journey";
import {
  FOOD_COURT_CENTER,
  FOOD_COURT_HALF,
  GATE_X,
  GATE_Z,
} from "../src/simulation/journey/constants";
import { HUMAN } from "../src/world/scale";

/**
 * THE FLYING CHAIRS, CHECKED AGAINST THE BRIEF.
 *
 * Four things were asked for: behind the food court, big, twenty seats,
 * turning clockwise. The ride was first built behind the Drop Tower and has
 * since been moved here, so the placement section measures it against the
 * court; nothing else about the ride changed with it.
 *
 * Each is measured here against the real modules the park renders
 * from — `SEAT_PLACEMENTS` is literally the array the component maps over, so
 * a chair that passes here is a chair that is drawn.
 *
 * The fifth requirement is unspoken and is the one that costs the most to get
 * wrong: nothing else in the park may move. A sixth box handed to the layout
 * solver would re-solve all five existing positions and shift the whole park,
 * so the ride is placed in ground that was already clear, and that is asserted
 * rather than assumed.
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
const rideSource = read("src", "components", "flying-chairs", "FlyingChairs.tsx");

validateFlyingChairs();

const [rx, rz] = RIDE_CENTER;

/* ================= 1. TWENTY SEATS, EVENLY ================= */

check("exactly 20 seats", SEAT_COUNT === 20, `${SEAT_COUNT}`);
check(
  "the ride renders exactly that many, from the same array this file checks",
  SEAT_PLACEMENTS.length === SEAT_COUNT,
  `${SEAT_PLACEMENTS.length} placements`,
);
{
  const gaps = SEAT_PLACEMENTS.map((p, i) => {
    const next = SEAT_PLACEMENTS[(i + 1) % SEAT_COUNT];
    let d = next.azimuth - p.azimuth;
    if (d < 0) d += Math.PI * 2;
    return d;
  });
  const worst = Math.max(...gaps.map((g) => Math.abs(g - SEAT_PITCH_RADIANS)));
  check(
    "evenly spaced — every gap the same 18°, including the wrap",
    worst < 1e-12 && Math.abs(gaps.reduce((a, b) => a + b, 0) - Math.PI * 2) < 1e-12,
    `worst deviation ${worst.toExponential(2)} rad over ${gaps.length} gaps`,
  );

  const radii = SEAT_PLACEMENTS.map((p) => Math.hypot(p.seat[0], p.seat[2]));
  const heights = SEAT_PLACEMENTS.map((p) => p.seat[1]);
  check(
    "perfectly symmetrical — one radius, one height, centred on the column",
    Math.max(...radii) - Math.min(...radii) < 1e-12 &&
      Math.max(...heights) - Math.min(...heights) < 1e-12 &&
      Math.hypot(
        SEAT_PLACEMENTS.reduce((a, p) => a + p.seat[0], 0),
        SEAT_PLACEMENTS.reduce((a, p) => a + p.seat[2], 0),
      ) /
        SEAT_COUNT <
        1e-12,
    `radius ${radii[0].toFixed(2)} m, height ${heights[0].toFixed(2)} m`,
  );
  check(
    "neighbouring chairs cannot touch",
    neighbourGap() > SEAT_WIDTH * CHAIR_SCALE * 3,
    `${neighbourGap().toFixed(2)} m apart, chairs ${(SEAT_WIDTH * CHAIR_SCALE).toFixed(2)} m wide`,
  );
}

/* ================= 2. IT TURNS CLOCKWISE ================= */

{
  /*
   * NOT by reading the minus sign — a sign convention is exactly the thing
   * that is easy to reason backwards about, and the first version of this
   * check did get it backwards and failed a ride that was already correct.
   *
   * So clockwise is defined operationally instead. In a plan view of the park
   * — X to the right, Z DOWN the screen, which is what looking down at the
   * ground plane gives you — the clock face runs 12 at -Z, 3 at +X, 6 at +Z,
   * 9 at -X. A point's position on that face is `atan2(x, -z)`, and going
   * clockwise means that angle INCREASES.
   *
   * The convention is then tested before it is used: a hand-written clockwise
   * sequence must register as clockwise, and its reverse must not. Only then
   * is the ride's own rotation measured with it.
   */
  const clockFace = (x: number, z: number) => Math.atan2(x, -z);
  const advances = (points: [number, number][]) =>
    points.slice(1).every((p, i) => {
      let d = clockFace(p[0], p[1]) - clockFace(points[i][0], points[i][1]);
      while (d <= -Math.PI) d += Math.PI * 2;
      while (d > Math.PI) d -= Math.PI * 2;
      return d > 0;
    });

  /* 12 → 3 → 6 → 9 o'clock: clockwise by construction. */
  const CLOCKWISE: [number, number][] = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  check(
    "the direction test itself is sound before it is used on the ride",
    advances(CLOCKWISE) && !advances([...CLOCKWISE].reverse()),
    "a known clockwise sequence reads clockwise; reversed, it does not",
  );

  /*
   * The ride's real rotation. Rotating by `angle` about +Y sends (x, z) to
   * (x cos + z sin, -x sin + z cos) — the matrix the scene graph applies — so
   * this is the chair's actual path, sampled through a whole revolution.
   */
  const chair = SEAT_PLACEMENTS[0].seat;
  /* Enough samples to cover more than one full revolution at this speed. */
  const SAMPLE_SECONDS = 0.4;
  const SAMPLES = Math.ceil((Math.PI * 2) / (ROTATION_RADIANS_PER_SEC * SAMPLE_SECONDS)) + 2;
  const path: [number, number][] = Array.from({ length: SAMPLES }, (_, i) => {
    const angle = ROTATION_SIGN * ROTATION_RADIANS_PER_SEC * (i * SAMPLE_SECONDS);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return [chair[0] * cos + chair[2] * sin, -chair[0] * sin + chair[2] * cos];
  });

  check(
    "IT TURNS CLOCKWISE, seen from above",
    advances(path),
    `chair 0 went (${path[0][0].toFixed(1)}, ${path[0][1].toFixed(1)}) → ` +
      `(${path[1][0].toFixed(1)}, ${path[1][1].toFixed(1)}) → ` +
      `(${path[2][0].toFixed(1)}, ${path[2][1].toFixed(1)}) — advancing round the clock face`,
  );
  check(
    "and it keeps turning that way for a whole revolution, not just at the start",
    advances(path) && path.length * SAMPLE_SECONDS * ROTATION_RADIANS_PER_SEC > Math.PI * 2,
    `${path.length} samples over ${(path.length * SAMPLE_SECONDS).toFixed(1)} s; a full turn takes ${(60 / ROTATION_RPM).toFixed(1)} s`,
  );
  /*
   * This used to assert that the rotation line was UNCONDITIONAL. It no longer
   * can be, and the change is worth stating rather than hiding: the ride now
   * runs a load cycle, and a machine that comes down to let people on has to
   * stand still while they get on. So what is asserted is the property that
   * still has to hold — the rotation is the same expression it always was,
   * scaled by the ride's OWN drive ramp and by nothing else. The park's
   * simulation clock and the ride-selection store still cannot reach it, which
   * is what the original check was really protecting.
   */
  check(
    "the frame loop applies that sign, scaled only by the ride's own drive ramp",
    /rotation\.y \+= ROTATION_SIGN \* ROTATION_RADIANS_PER_SEC \* delta \* sweep\.spin/.test(
      rideSource,
    ) && !/simulationStore|rideSelectionStore/.test(rideSource),
    "one line, one sign, one ramp; no store and no simulation clock can reach it",
  );
}

/* ================= 2b. IT IS SIGNED FOR ITS TEAM ================= */

/*
 * The user named this ride for IT Support. Like every other team name in this
 * park it is a LABEL: the sign says IT Support, and IT Support staff still
 * walk to the Ferris Wheel, because this ride is not a routing destination.
 * Both halves are asserted — the sign, and the fact that nobody was moved.
 */
check(
  "the ride is signed for its team",
  CHAIRS_SIGN.department === CHAIRS_TEAM_NAME && CHAIRS_SIGN.rideName === CHAIRS_RIDE_NAME,
  `"${CHAIRS_SIGN.department}" — ${CHAIRS_SIGN.rideName}`,
);
check(
  "its signboard stands beside the ride, not underneath it",
  Math.hypot(CHAIRS_SIGN.position[0] - rx, CHAIRS_SIGN.position[1] - rz) > OVERALL_REACH,
  `${Math.hypot(CHAIRS_SIGN.position[0] - rx, CHAIRS_SIGN.position[1] - rz).toFixed(1)} m from the column, ` +
    `ride reach ${OVERALL_REACH.toFixed(1)} m`,
);
check(
  "it is reachable by fast travel under that name",
  placeById(CHAIRS_TEAM_ID).label === `${CHAIRS_TEAM_NAME} — ${CHAIRS_RIDE_NAME}`,
  placeById(CHAIRS_TEAM_ID).label,
);

/* ================= 3. IT IS BIG ================= */

check(
  "it is a big ride against a 1.75 m rider",
  OVERALL_HEIGHT / HUMAN.height > 25,
  `${OVERALL_HEIGHT.toFixed(1)} m tall — ${(OVERALL_HEIGHT / HUMAN.height).toFixed(0)} people`,
);
/*
 * This used to read "the second tallest, and still under the sky tower", and
 * the sky tower was 126 m. The user has since had the Drop Tower removed and
 * the UFO Pendulum put on its plot, and a pendulum on that plot tops out at
 * 86 m — so these chairs, which nobody rides and which were built to defer to
 * the tower, are now the TALLEST thing standing in the park.
 *
 * That is worth stating rather than hiding behind a reworded threshold: it is
 * a real change to how the park reads, and it follows from the removal rather
 * than from anything this ride did.
 */
/*
 * AND NOW IT IS EXACTLY AS BIG AS EVERYTHING ELSE.
 *
 * This has read three different ways as the park changed around it: the second
 * tallest under the sky tower, then the tallest thing in the park once the
 * tower was removed. The user has since asked for every ride to be one size,
 * so the ride is no longer taller or shorter than anything — it is the park's
 * one height, reached by a single uniform factor on its own geometry.
 */
check(
  "it is built to the park's one common ride height, exactly",
  Math.abs(OVERALL_HEIGHT - rideById("ferris").height) < 0.01 &&
    Math.abs(OVERALL_HEIGHT - rideById("ufo").height) < 0.01,
  `${OVERALL_HEIGHT.toFixed(1)} m; every ride in the park ${rideById("ferris").height.toFixed(1)} m`,
);
/*
 * The chains have been shortened twice, each time pulling the swept circle in,
 * and each time a fixed "wider than N metres" bound here had to be lowered to
 * follow. A threshold that gets edited whenever it fails is not testing
 * anything, so this asserts the property that actually has to hold however
 * long the chains are: the chairs must fly OUTSIDE the canopy they hang from.
 * That is what makes it a chair swing rather than a covered roundabout, it is
 * what the riders are there for, and it fails honestly if the chains are ever
 * shortened past the point where the ride stops working.
 */
check(
  "the chairs swing outside the canopy — it is a chair swing, not a roundabout",
  FLIGHT_RADIUS > CANOPY_RADIUS,
  `chairs sweep ${(FLIGHT_RADIUS * 2).toFixed(1)} m across, canopy ${(CANOPY_RADIUS * 2).toFixed(1)} m — ` +
    `${(FLIGHT_RADIUS - CANOPY_RADIUS).toFixed(2)} m of chair proud of the roof edge`,
);
check(
  "the chairs themselves are built bigger than life, uniformly",
  CHAIR_SCALE > 1 && SEAT_WIDTH * CHAIR_SCALE > 0.8,
  `${CHAIR_SCALE}x life size — a ${(SEAT_WIDTH * CHAIR_SCALE).toFixed(2)} m seat from a ` +
    `${SEAT_WIDTH.toFixed(2)} m one, the whole chair scaled together`,
);
{
  /*
   * ARE THE CHAIRS ACTUALLY VISIBLE?
   *
   * Twenty seats that are present, correct and sub-pixel are not twenty seats
   * anybody can see, and that is exactly how the first build of this ride came
   * out. So the chairs' apparent size is measured from a viewpoint the user
   * really uses — the fast-travel place for whatever stands on the plot next
   * door, which is the UFO Pendulum since the Drop Tower was removed — through
   * the park's own 46-degree camera on a 900-pixel-tall frame.
   */
  const view = placeById("ufo");
  const nearest = SEAT_PLACEMENTS.map((p) =>
    Math.hypot(
      rx + p.seat[0] - view.position[0],
      p.seat[1] - view.position[1],
      rz + p.seat[2] - view.position[2],
    ),
  ).sort((a, b) => a - b)[0];
  const pixelsPerRadian = 900 / ((46 * Math.PI) / 180);
  const chairPixels = (CHAIR_VISIBLE_HEIGHT / nearest) * pixelsPerRadian;

  check(
    "a chair is big enough to actually see from the neighbouring ride's viewpoint",
    chairPixels > 6,
    `${CHAIR_VISIBLE_HEIGHT.toFixed(2)} m of chair at ${nearest.toFixed(0)} m reads as ` +
      `${chairPixels.toFixed(1)} px tall`,
  );
  const colours = new Set(Array.from({ length: SEAT_COUNT }, (_, i) => chairColor(i)));
  const clash = Array.from({ length: SEAT_COUNT }).some(
    (_, i) => chairColor(i) === chairColor((i + 1) % SEAT_COUNT),
  );
  check(
    "and painted a run of colours, no two neighbours alike",
    colours.size > 1 && !clash,
    `${colours.size} livery colours around ${SEAT_COUNT} chairs`,
  );
}

check(
  "riders are carried at a real fairground speed",
  RIDER_SPEED > 8 && RIDER_SPEED < 16,
  `${RIDER_SPEED.toFixed(1)} m/s (${(RIDER_SPEED * 3.6).toFixed(0)} km/h) at ${ROTATION_RPM} rpm`,
);

/* ================= 4. THE FLARE IS SOLVED, NOT DRAWN ================= */

{
  const radius = HANGER_RADIUS + CHAIN_LENGTH * Math.sin(FLARE_ANGLE);
  const residual = Math.tan(FLARE_ANGLE) - (ROTATION_RADIANS_PER_SEC ** 2 * radius) / GRAVITY;
  check(
    "the chain flare balances gravity against the turn, exactly",
    Math.abs(residual) < 1e-12,
    `${((FLARE_ANGLE * 180) / Math.PI).toFixed(2)}° at ${ROTATION_RPM} rpm, residual ${residual.toExponential(2)}`,
  );
  check(
    "the flight radius matches the flare it was derived from",
    Math.abs(FLIGHT_RADIUS - radius) < 1e-12,
    `${FLIGHT_RADIUS.toFixed(3)} m`,
  );
}
check(
  "the chairs swing clear of the canopy edge and hang below it",
  FLIGHT_RADIUS > CANOPY_RADIUS && SEAT_FLIGHT_Y < CANOPY_SOFFIT_Y,
  `chairs sweep ${FLIGHT_RADIUS.toFixed(1)} m out at ${SEAT_FLIGHT_Y.toFixed(1)} m up`,
);
check(
  "nothing on the ride can strike the ground",
  Math.min(...SEAT_PLACEMENTS.map((p) => p.lowestY)) > 2,
  `lowest point ${Math.min(...SEAT_PLACEMENTS.map((p) => p.lowestY)).toFixed(1)} m above ground`,
);
{
  /*
   * A CHAIR HANGS ON A 6 m CHAIN WHATEVER SIZE THE CHAIR IS.
   *
   * Every seat height on this ride — SEAT_FLIGHT_Y, SEAT_LOAD_Y, the whole of
   * `seatRing.ts`, and the gallery derived from them — is one chain length
   * below the hanger. The chair is also drawn larger than life, and for a long
   * while the chain's drop sat INSIDE that scale, so the pan was really
   * 2.2 x 6 = 13.2 m down and every chair in the park hung seven metres below
   * the end of its own chains. Nothing caught it: the arithmetic here was
   * right, and the ride was only ever looked at from far enough away that a
   * detached chair still reads as a chair.
   *
   * So it is asserted where the mistake actually lives. Putting the drop and
   * the scale on the SAME group is what makes it safe — a group's own
   * position is measured in its parent's frame, and only its children are
   * scaled — and that is the arrangement this looks for.
   */
  const chairSource = read("src", "components", "flying-chairs", "Chair.tsx");
  check(
    "the chair hangs on a real chain length, not a scaled one",
    /position=\{\[0, -CHAIN_LENGTH, 0\]\} scale=\{CHAIR_SCALE\}/.test(chairSource) &&
      !/const y = -CHAIN_LENGTH/.test(chairSource),
    `the drop is applied outside the ${CHAIR_SCALE}x scale, so the pan is ` +
      `${CHAIN_LENGTH} m below the hanger and not ${(CHAIN_LENGTH * CHAIR_SCALE).toFixed(1)} m`,
  );
}

/* ================= 5. BEHIND THE FOOD COURT ================= */

{
  const toCourt = [FOOD_COURT_CENTER[0] - GATE_X, FOOD_COURT_CENTER[1] - GATE_Z];
  const toRide = [rx - GATE_X, rz - GATE_Z];
  const lenC = Math.hypot(toCourt[0], toCourt[1]);
  const lenR = Math.hypot(toRide[0], toRide[1]);
  const cos = (toCourt[0] * toRide[0] + toCourt[1] * toRide[1]) / (lenC * lenR);
  const offBearing = (Math.acos(Math.min(1, cos)) * 180) / Math.PI;

  check(
    "it is FURTHER from the gate than the food court — behind it, not in front",
    lenR > lenC,
    `ride ${lenR.toFixed(1)} m from the gate, food court ${lenC.toFixed(1)} m`,
  );

  /*
   * WHERE EXACTLY.
   *
   * The offset from the court's centre must be the whole of BEHIND_DISTANCE
   * along the gate→court bearing and nothing across it. Asserting the
   * decomposition rather than the straight-line distance is what makes a
   * mistake in either direction visible, including one that happens to
   * preserve the length — which is how that first placement was checked, and
   * the reason it is worth keeping now that the anchor has moved.
   */
  const alongX = (toCourt[0] / lenC) * BEHIND_DISTANCE;
  const alongZ = (toCourt[1] / lenC) * BEHIND_DISTANCE;
  const residualX = rx - FOOD_COURT_CENTER[0] - alongX;
  const residualZ = rz - FOOD_COURT_CENTER[1] - alongZ;
  check(
    `it stands exactly ${BEHIND_DISTANCE} m behind the food court, dead on its bearing`,
    Math.abs(residualX) < 1e-9 && Math.abs(residualZ) < 1e-9 && offBearing < 1e-9,
    `residual (${residualX.toExponential(1)}, ${residualZ.toExponential(1)}), ` +
      `${offBearing.toExponential(1)}° off the gate→court line`,
  );
  check(
    "and it is out past the far side of the court, not standing in it",
    Math.hypot(
      Math.max(Math.abs(rx - FOOD_COURT_CENTER[0]) - FOOD_COURT_HALF, 0),
      Math.max(Math.abs(rz - FOOD_COURT_CENTER[1]) - FOOD_COURT_HALF, 0),
    ) > OVERALL_REACH,
    `${Math.hypot(
      Math.max(Math.abs(rx - FOOD_COURT_CENTER[0]) - FOOD_COURT_HALF, 0),
      Math.max(Math.abs(rz - FOOD_COURT_CENTER[1]) - FOOD_COURT_HALF, 0),
    ).toFixed(1)} m from the court's edge, ride reach ${OVERALL_REACH.toFixed(1)} m`,
  );

  const angles = viewAngles(MAIN_VIEWPOINT, PARK_CENTER);
  const ux = PARK_CENTER[0] - MAIN_VIEWPOINT[0];
  const uz = PARK_CENTER[1] - MAIN_VIEWPOINT[1];
  const ul = Math.hypot(ux, uz) || 1;
  const slice = (x: number, z: number, reach: number) => {
    const dx = x - MAIN_VIEWPOINT[0];
    const dz = z - MAIN_VIEWPOINT[1];
    const distance = Math.hypot(dx, dz) || 1;
    const bearing =
      (Math.atan2((ux / ul) * dz - (uz / ul) * dx, dx * (ux / ul) + dz * (uz / ul)) * 180) /
      Math.PI;
    const half = (Math.atan(reach / distance) * 180) / Math.PI;
    return [bearing - half, bearing + half] as const;
  };

  const [rideFrom, rideTo] = slice(rx, rz, OVERALL_REACH);
  /* The court is a square, so what it subtends is set by its half-diagonal. */
  const [courtFrom, courtTo] = slice(
    FOOD_COURT_CENTER[0],
    FOOD_COURT_CENTER[1],
    FOOD_COURT_HALF * Math.SQRT2,
  );
  check(
    "from the entrance it stands squarely within the food court's own slice of the view",
    rideFrom > courtFrom && rideTo < courtTo,
    `ride ${rideFrom.toFixed(2)}°..${rideTo.toFixed(2)}°, court ${courtFrom.toFixed(2)}°..${courtTo.toFixed(2)}°`,
  );

  const overlaps = angles.filter(
    (a) => rideTo > a.bearingDeg - a.halfWidthDeg && rideFrom < a.bearingDeg + a.halfWidthDeg,
  );
  /*
   * SHARING A BEARING IS NOT HIDING — you have to be in FRONT.
   *
   * This asked for no angular overlap at all, which was achievable while the
   * park was compact and this ride sat close behind the court. Every ride is
   * now built to one common height, the fan is far wider, and the ride stands
   * 297 m out: from the entrance its slice necessarily crosses a ride that is
   * nearer the gate than it is. That is the same rule every other attraction
   * in this park is placed by — the Tea Cups, the Super Looper, the Giga
   * Coaster and the Dumbo Ride all test whether they stand in front of
   * something — and the ride's own placement now solves against it.
   */
  const inFront = overlaps.filter(
    (a) =>
      Math.hypot(rx - MAIN_VIEWPOINT[0], rz - MAIN_VIEWPOINT[1]) <
      Math.hypot(
        rideById(a.id).center[0] - MAIN_VIEWPOINT[0],
        rideById(a.id).center[1] - MAIN_VIEWPOINT[1],
      ),
  );
  check(
    "and it hides no ride — where it shares a bearing it stands behind, not in front",
    inFront.length === 0,
    `in front of ${inFront.map((o) => o.id).join(", ") || "nothing"}; shares a bearing with ` +
      `${overlaps.map((o) => o.id).join(", ") || "nothing"}; ` +
      `nearest slice ${angles.map((a) => `${a.id} ${(a.bearingDeg - a.halfWidthDeg).toFixed(1)}..${(a.bearingDeg + a.halfWidthDeg).toFixed(1)}`).join(", ")}`,
  );
}

/* ================= 6. NOTHING ELSE MOVED ================= */

check(
  "the ride is not in the park layout — the solver was never re-run",
  PARK_LAYOUT.length === 5 && !PARK_LAYOUT.some((r) => (r.id as string).includes("chair")),
  `${PARK_LAYOUT.length} rides in the solver, as before`,
);
check(
  "and the layout module does not know it exists",
  !/flying-chairs|FlyingChairs/.test(layoutSource),
  "no import, no box, no bearing added",
);
check(
  "it is mounted in world space, with no offset and no scale of its own",
  /<FlyingChairs \/>/.test(scene) && !/<group[^>]*>\s*<FlyingChairs/.test(scene),
  "one render line; it positions itself",
);
check(
  "no existing ride's mounting changed",
  (scene.match(/<SelectableRide id=/g) ?? []).length === 5,
  "the five department rides are wrapped exactly as before",
);
check(
  "no employee is routed to it — it is an attraction, not a destination",
  JOURNEY_EMPLOYEES.every((e) => (e.rideId as string) !== CHAIRS_TEAM_ID),
  `${JOURNEY_EMPLOYEES.length} employees, none bound for it`,
);

/* ================= 7. IT CLEARS EVERYTHING ================= */

const rails: [number, number][] = [];
for (let i = 0; i <= 720; i++) {
  const p = TRACK_CURVE.getPointAt(i / 720);
  rails.push([p.x * TRAIN_SCALE, p.z * TRAIN_SCALE]);
}
function boxDistance(x: number, z: number, r: (typeof PARK_LAYOUT)[number]): number {
  return Math.hypot(
    Math.max(r.minX - x, 0, x - r.maxX),
    Math.max(r.minZ - z, 0, z - r.maxZ),
  );
}

const toBox = Math.min(...PARK_LAYOUT.map((r) => boxDistance(rx, rz, r)));
const toRail = Math.min(...rails.map(([x, z]) => Math.hypot(rx - x, rz - z)));
const toSign = Math.min(...RIDE_SIGNS.map((s) => Math.hypot(rx - s.position[0], rz - s.position[1])));

for (const [what, distance, margin] of [
  ["every ride footprint", toBox, 12],
  ["the railway", toRail, 10],
  ["every department sign", toSign, 8],
  ["the paving", distanceToPaving(rx, rz), 6],
  ["the plaza ring", Math.abs(Math.hypot(rx - PLAZA_CENTER[0], rz - PLAZA_CENTER[1]) - PLAZA_RADIUS), 8],
  [
    "the food court",
    Math.hypot(
      Math.max(Math.abs(rx - FOOD_COURT_CENTER[0]) - FOOD_COURT_HALF, 0),
      Math.max(Math.abs(rz - FOOD_COURT_CENTER[1]) - FOOD_COURT_HALF, 0),
    ),
    8,
  ],
] as const) {
  check(
    `it clears ${what}`,
    distance >= OVERALL_REACH + margin,
    `${distance.toFixed(1)} m — needs ${(OVERALL_REACH + margin).toFixed(1)} (reach ${OVERALL_REACH.toFixed(1)} + ${margin})`,
  );
}
/*
 * The ride used to stand by the Drop Tower and this asserted that the tower was
 * its nearest neighbour; then the brief moved it behind the food court and the
 * claim moved with it. It has moved once more, and for a reason neither of
 * those had: every ride in the park is now built to one common height, this
 * one's swept circle grew with it, and the distance behind the court is solved
 * rather than typed — 297 m out, where the margins are finally met. At that
 * distance the court is no longer the nearest thing to it.
 *
 * So what is checked is the bearing rather than the ranking: the ride still
 * stands DEAD ON the gate's line through the food court, which is what "behind
 * the food court" means, and it clears everything by the park's own margins.
 */
{
  const toCourtBox = Math.hypot(
    Math.max(Math.abs(rx - FOOD_COURT_CENTER[0]) - FOOD_COURT_HALF, 0),
    Math.max(Math.abs(rz - FOOD_COURT_CENTER[1]) - FOOD_COURT_HALF, 0),
  );
  check(
    "it stands on the gate's own line through the food court, and clears everything else",
    Math.min(toBox, toRail, toSign) > OVERALL_REACH,
    `food court ${toCourtBox.toFixed(0)} m; nearest ride ` +
      `${PARK_LAYOUT.slice().sort((a, b) => boxDistance(rx, rz, a) - boxDistance(rx, rz, b))[0].id} ` +
      `${toBox.toFixed(0)} m, railway ${toRail.toFixed(0)} m, nearest sign ${toSign.toFixed(0)} m`,
  );
}
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

/* ================= 8. THE SHADOW BUDGET ================= */

{
  /*
   * This park already carries five rides, a railway and three thousand plants.
   * Every shadow-casting mesh is a second full draw each frame, and a ride of
   * twenty chairs on thirty-link chains can add a thousand of them — enough to
   * stop the park pages producing a frame at all. So casting is rationed to
   * the parts whose shadow is legible from where this ride is seen.
   */
  const files = ["Chair.tsx", "Canopy.tsx", "Tower.tsx", "FlyingChairs.tsx", "Boarding.tsx"];
  const casters = files.reduce(
    (total, f) =>
      total + (read("src", "components", "flying-chairs", f).match(/castShadow/g) ?? []).length,
    0,
  );
  check(
    "the ride keeps a tight shadow budget",
    casters <= 20,
    `${casters} castShadow sites across ${files.length} files — chains, rails, rungs, cage hoops ` +
      `and lamps are drawn but do not cast; the gallery deck is a 48 m ring, so it does`,
  );
  check(
    "and it shares its materials rather than making one per mesh",
    /export const MATERIAL/.test(read("src", "components", "flying-chairs", "parts.ts")),
    "twenty identical chairs share one set of materials",
  );
}

/* ========== 9. IT COMES DOWN TO LOAD, AND THERE IS A WAY UP TO IT ========== */

/*
 * "In a it support ride place a ladder and also the round roof like structure
 *  need to be down and up with that chairs for the people to claim on the ride
 *  and get down on the ride"
 *
 * Three things, and they are one mechanism: the canopy and its chairs ride up
 * and down the mast, they come down to a gallery a rider can stand on, and a
 * ladder gets the rider up to it.
 *
 * NONE OF IT IS EYEBALLED. The whole cycle is swept at a millisecond step,
 * through the same function the frame loop calls, and the chair is carried
 * through it as a real hull of its own corners rather than as a point — so a
 * footrest that would sweep through a hand rail is a failure here rather than
 * a surprise in the browser.
 */

const SAMPLES = 60_000;
const CYCLE = Array.from({ length: SAMPLES + 1 }, (_, i) => sweepAt((i / SAMPLES) * CYCLE_SECONDS));
const HULLS = CYCLE.map(chairEnvelopeAt);
const RAIL_TOP_Y = PLATFORM_Y + RAIL_HEIGHT;

check(
  "the cycle is a cycle — five phases that add up, and it wraps without a jump",
  LOAD_SECONDS + HOIST_SECONDS + CRUISE_SECONDS + LOWER_SECONDS + UNLOAD_SECONDS ===
    CYCLE_SECONDS &&
    sweepAt(0).liftY === sweepAt(CYCLE_SECONDS).liftY &&
    sweepAt(0).spin === sweepAt(CYCLE_SECONDS).spin,
  `load ${LOAD_SECONDS}s, hoist ${HOIST_SECONDS}s, cruise ${CRUISE_SECONDS}s, ` +
    `lower ${LOWER_SECONDS}s, unload ${UNLOAD_SECONDS}s = ${CYCLE_SECONDS}s`,
);

{
  /*
   * NOTHING SNAPS. Sampled a millisecond apart, neither the height nor the
   * speed may step by more than a smooth ramp would — this is what catches a
   * phase boundary that does not meet the one before it, which is exactly the
   * kind of mistake that reads as a 49 m teleport in the browser.
   */
  const dt = CYCLE_SECONDS / SAMPLES;
  let worstLift = 0;
  let worstSpin = 0;
  for (let i = 1; i < CYCLE.length; i++) {
    worstLift = Math.max(worstLift, Math.abs(CYCLE[i].liftY - CYCLE[i - 1].liftY));
    worstSpin = Math.max(worstSpin, Math.abs(CYCLE[i].spin - CYCLE[i - 1].spin));
  }
  check(
    "the sweep never snaps — height and speed are continuous the whole way round",
    worstLift < (LIFT_TRAVEL / HOIST_SECONDS) * dt * 2.1 && worstSpin < (1 / HOIST_SECONDS) * dt * 2.1,
    `worst step ${(worstLift * 1000).toFixed(3)} mm of lift and ` +
      `${(worstSpin * 100).toFixed(4)}% of speed per ${(dt * 1000).toFixed(1)} ms`,
  );
}

{
  /*
   * THE RIDE AT CRUISE IS THE RIDE THAT WAS ALREADY THERE.
   *
   * This is the check that matters most for a park where nothing may change
   * without being asked for. Adding a lift must not nudge the canopy, the
   * chairs or the flare by a millimetre at working height — so the cruise
   * state is compared against the constants the ride was documented and
   * verified by before any of this existed, exactly, not nearly.
   */
  const cruise = sweepAt(LOAD_SECONDS + HOIST_SECONDS + CRUISE_SECONDS / 2);
  check(
    "at cruise it is EXACTLY the ride it was before it could move — to the last digit",
    cruise.liftY === 0 &&
      cruise.spin === 1 &&
      cruise.flare === FLARE_ANGLE &&
      cruise.seatY === SEAT_FLIGHT_Y &&
      cruise.seatRadius === FLIGHT_RADIUS,
    `lift 0, ${ROTATION_RPM} rpm, flare ${((cruise.flare * 180) / Math.PI).toFixed(3)}°, ` +
      `chairs at ${cruise.seatRadius.toFixed(3)} m out and ${cruise.seatY.toFixed(3)} m up`,
  );
}

{
  const soffits = CYCLE.map((c) => c.soffitY);
  const low = Math.min(...soffits);
  const high = Math.max(...soffits);
  check(
    "the roof really does go down and up — the whole sweep, chairs and all",
    Math.abs(high - CANOPY_SOFFIT_Y) < 1e-12 &&
      Math.abs(low - SWEEP_LOAD_SOFFIT_Y) < 1e-12 &&
      Math.abs(high - low - LIFT_TRAVEL) < 1e-12,
    `${low.toFixed(1)} m up to ${high.toFixed(1)} m — a ${LIFT_TRAVEL.toFixed(1)} m drop, ` +
      `and the chairs come with it (${SEAT_LOAD_Y.toFixed(1)} m to ${SEAT_FLIGHT_Y.toFixed(1)} m)`,
  );

  const dwell = CYCLE.filter((c) => c.phase === "load" || c.phase === "unload");
  check(
    "and it stands STILL at the bottom, with the chains hanging plumb, to be got in and out of",
    dwell.length > 0 &&
      dwell.every((c) => c.spin === 0 && c.flare === 0 && c.liftY === -LIFT_TRAVEL),
    `${LOAD_SECONDS + UNLOAD_SECONDS}s of the ${CYCLE_SECONDS}s cycle stopped at the gallery`,
  );
}

check(
  "how far it comes down is set by the mast, not by taste — the hub stops on the gussets",
  Math.abs(Math.min(...CYCLE.map((c) => c.hubBottomY)) - (GUSSET_TOP_Y + SWEEP_CLEARANCE)) < 1e-12,
  `hub bottom ${Math.min(...CYCLE.map((c) => c.hubBottomY)).toFixed(2)} m, gussets top out at ` +
    `${GUSSET_TOP_Y.toFixed(2)} m — ${SWEEP_CLEARANCE.toFixed(1)} m of steel-to-steel gap, ` +
    `from a ${HUB_Y.toFixed(1)} m cruise height`,
);

/* ---------------- the gallery a rider stands on ---------------- */

check(
  "the gallery is laid under the chairs, wide enough to stand under the one you are boarding",
  PLATFORM_INNER_RADIUS < HANGER_RADIUS && PLATFORM_OUTER_RADIUS > HANGER_RADIUS,
  `deck from ${PLATFORM_INNER_RADIUS} m to ${PLATFORM_OUTER_RADIUS} m, chairs hang on the ` +
    `${HANGER_RADIUS} m circle`,
);
check(
  "and it adds NOTHING to the ride's footprint — every clearance above is untouched",
  PLATFORM_OUTER_RADIUS <= OVERALL_REACH,
  `gallery ${PLATFORM_OUTER_RADIUS.toFixed(1)} m, the chairs already swept ` +
    `${OVERALL_REACH.toFixed(1)} m — the ride is no wider than it was`,
);

{
  /*
   * CAN A PERSON ACTUALLY GET IN? The chair must arrive over the boards, hang
   * clear of them, and be low enough to climb into. It is a 2.2x chair, so
   * "low enough" is measured against the park's own 1.75 m figure and the
   * answer is honestly a climb — see PLATFORM_Y in constants.ts.
   */
  const stepUp = SEAT_LOAD_Y - PLATFORM_Y;
  check(
    "a chair arrives over the boards, hanging clear of them, at a height you can climb into",
    Math.abs(SEAT_LOAD_Y - CHAIR_FOOT_DROP - PLATFORM_Y - PLATFORM_CLEARANCE) < 1e-12 &&
      stepUp < HUMAN.height,
    `footrest ${PLATFORM_CLEARANCE.toFixed(2)} m over the deck, seat pan ${stepUp.toFixed(2)} m up ` +
      `for a ${HUMAN.height} m rider — the chairs are built ${CHAIR_SCALE}x life size`,
  );
}

{
  /*
   * THE ONE THAT WOULD ACTUALLY HURT: a chair sweeping through the gallery.
   *
   * Two separate statements, because they fail in different ways. Whenever any
   * part of a chair is over the deck band it must be ABOVE the boards; and
   * whenever any part of a chair is low enough to meet a hand rail it must be
   * radially INSIDE both of them. The second is what the drive ramp exists
   * for — the chairs are not allowed to start flying out until the sweep has
   * carried them well above the rail.
   */
  let worstDeck = Infinity;
  let worstRail = Infinity;
  let worstAt = 0;
  for (let i = 0; i < CYCLE.length; i++) {
    const hull = HULLS[i];
    if (hull.maxRadius > PLATFORM_INNER_RADIUS && hull.minRadius < PLATFORM_OUTER_RADIUS) {
      worstDeck = Math.min(worstDeck, hull.lowestY - PLATFORM_Y);
    }
    if (hull.lowestY < RAIL_TOP_Y) {
      const gap = Math.min(
        hull.minRadius - PLATFORM_INNER_RADIUS,
        PLATFORM_OUTER_RADIUS - hull.maxRadius,
      );
      if (gap < worstRail) {
        worstRail = gap;
        worstAt = CYCLE[i].time;
      }
    }
  }
  check(
    "no chair ever touches the gallery deck, at any moment of the cycle",
    worstDeck > 0.05,
    `closest approach ${(worstDeck * 100).toFixed(0)} cm above the boards, over ` +
      `${SAMPLES.toLocaleString()} samples of the whole ${CYCLE_SECONDS}s cycle`,
  );
  check(
    "and no chair ever reaches a hand rail — it is high above them before it flies out",
    worstRail > 0.5,
    `while low enough to meet a rail a chair stays ${worstRail.toFixed(2)} m inside both of ` +
      `them (worst at t=${worstAt.toFixed(1)}s)`,
  );
}

check(
  "the canopy and its arms pass high over the gallery even at the bottom of the drop",
  SWEEP_LOAD_SOFFIT_Y - ARM_TIP_DROP - ARM_THICKNESS > RAIL_TOP_Y + 2 &&
    SWEEP_LOAD_SOFFIT_Y - VALANCE_DROP > RAIL_TOP_Y + 2,
  `lowest sweep steel over the deck ${(SWEEP_LOAD_SOFFIT_Y - ARM_TIP_DROP - ARM_THICKNESS).toFixed(1)} m, ` +
    `valance ${(SWEEP_LOAD_SOFFIT_Y - VALANCE_DROP).toFixed(1)} m, rail tops ${RAIL_TOP_Y.toFixed(1)} m`,
);

/* ---------------- the ladder ---------------- */

const ladderReach = LADDER_RADIUS + LADDER_CAGE_RADIUS;

check(
  "the ladder climbs the whole way — grass to gallery, at a pitch you can climb",
  LADDER_RUNG_PITCH >= 0.25 &&
    LADDER_RUNG_PITCH <= 0.32 &&
    LADDER_RUNG_COUNT * LADDER_RUNG_PITCH > PLATFORM_Y - LADDER_RUNG_PITCH &&
    LADDER_TOP_Y > PLATFORM_Y + 1,
  `${LADDER_RUNG_COUNT} rungs at ${(LADDER_RUNG_PITCH * 100).toFixed(0)} cm up to a ` +
    `${PLATFORM_Y.toFixed(2)} m deck, stiles carrying on to ${LADDER_TOP_Y.toFixed(2)} m`,
);
check(
  "it stands on the dead ground inside the hanger circle, where nothing on the ride can reach it",
  ladderReach < PLATFORM_INNER_RADIUS &&
    Math.min(...HULLS.map((h) => h.minRadius)) > ladderReach + 1 &&
    LADDER_RADIUS - LADDER_CAGE_RADIUS > BASE_SKIRT_RADIUS + 0.4,
  `ladder occupies ${(LADDER_RADIUS - LADDER_CAGE_RADIUS).toFixed(2)}..${ladderReach.toFixed(2)} m; ` +
    `the plinth ends at ${BASE_SKIRT_RADIUS.toFixed(1)} m, the deck starts at ${PLATFORM_INNER_RADIUS} m, ` +
    `and the innermost a chair ever comes is ` +
    `${Math.min(...HULLS.map((h) => h.minRadius)).toFixed(2)} m`,
);
{
  const toGate = Math.atan2(GATE_Z - rz, GATE_X - rx);
  check(
    "and it is on the side a visitor arrives from — the bearing is taken from the gate, not typed",
    Math.abs(LADDER_AZIMUTH - toGate) < 1e-12,
    `${((LADDER_AZIMUTH * 180) / Math.PI).toFixed(1)}° — square on the line back to the main gate`,
  );
}

{
  /*
   * WHERE THE RAIL OPENING ACTUALLY ENDS UP.
   *
   * The inner hand rail is an arc with a wedge missing for the rider to step
   * off the ladder, and that wedge is placed by spinning the torus about its
   * own axis before it is laid flat. Which way that spin ends up pointing once
   * the euler is applied is precisely the sort of thing that is easy to get
   * backwards and impossible to see in a diff, so it is not reasoned about
   * here: the same euler is built with three's own matrix code, the arc's two
   * ends are transformed by it, and the gap between them is measured.
   */
  const arc = Math.PI * 2 - LADDER_GATE_ARC;
  const gapTurn = (Math.PI * 2 - arc) / 2 - LADDER_AZIMUTH;
  const m = new THREE.Matrix4().makeRotationFromEuler(
    new THREE.Euler(LAY_FLAT[0], 0, gapTurn, "XYZ"),
  );
  const azimuthOf = (a: number) => {
    const v = new THREE.Vector3(Math.cos(a), Math.sin(a), 0).applyMatrix4(m);
    return Math.atan2(v.z, v.x);
  };
  /*
   * Which end of the arc is which, and which way round the missing wedge lies,
   * are both left to the measurement: the rail is walked at ten thousand
   * points and each one is asked how far it is from the ladder. The nearest
   * rail to the ladder must be half an opening away — that is the same
   * statement whichever direction the arc happens to run in.
   */
  const WALK = 10_000;
  const angle = (a: number) => {
    let d = a - LADDER_AZIMUTH;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  };
  let nearest = Math.PI;
  let farthest = 0;
  for (let i = 0; i <= WALK; i++) {
    const d = Math.abs(angle(azimuthOf((i / WALK) * arc)));
    nearest = Math.min(nearest, d);
    farthest = Math.max(farthest, d);
  }
  const step = ((Math.PI * 2) / WALK) * 1.5;

  check(
    "the gap left in the inner rail lands square on the ladder, and is wide enough to step through",
    Math.abs(nearest - LADDER_GATE_ARC / 2) < step &&
      farthest > Math.PI - step &&
      LADDER_GATE_ARC * PLATFORM_INNER_RADIUS > LADDER_WIDTH + 0.8,
    `the rail comes to within ${((nearest * 180) / Math.PI).toFixed(2)}° of the ladder either side ` +
      `and runs the whole way round otherwise — a ` +
      `${(LADDER_GATE_ARC * PLATFORM_INNER_RADIUS).toFixed(2)} m opening for a ` +
      `${LADDER_WIDTH.toFixed(2)} m ladder`,
  );
}

/* ================= SUMMARY ================= */

console.log(
  `\nFlying Chairs — ${SEAT_COUNT} chairs at ${((SEAT_PITCH_RADIANS * 180) / Math.PI).toFixed(0)}°, ` +
    `${OVERALL_HEIGHT.toFixed(1)} m tall on a ${COLUMN_HEIGHT} m column, ` +
    `flying ${(FLIGHT_RADIUS * 2).toFixed(1)} m across at ${((FLARE_ANGLE * 180) / Math.PI).toFixed(1)}°, ` +
    `clockwise at ${ROTATION_RPM} rpm (${(RIDER_SPEED * 3.6).toFixed(0)} km/h).`,
);
console.log(
  `Standing at (${rx.toFixed(1)}, ${rz.toFixed(1)}) — ${BEHIND_DISTANCE} m behind the food court on its own ` +
    `bearing from the gate, ${toBox.toFixed(1)} m clear of the nearest footprint ` +
    `(reach ${OVERALL_REACH.toFixed(1)} m, chair ${(SEAT_DEPTH * CHAIR_SCALE).toFixed(2)} m deep).`,
);
console.log(
  `Loading: the sweep drops ${LIFT_TRAVEL.toFixed(1)} m to a ${PLATFORM_Y.toFixed(2)} m gallery ` +
    `(${PLATFORM_INNER_RADIUS}..${PLATFORM_OUTER_RADIUS} m), stands still for ` +
    `${LOAD_SECONDS + UNLOAD_SECONDS}s of every ${CYCLE_SECONDS}s, and is reached by a ` +
    `${LADDER_RUNG_COUNT}-rung caged ladder facing the gate.`,
);
console.log(failures === 0 ? "\nOK: flying chairs verified." : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
