import {
  MAIN_VIEWPOINT,
  PARK_CENTER,
  PARK_LAYOUT,
  PLAZA_CENTER,
  PLAZA_RADIUS,
  rideById,
  viewAngles,
} from "@/components/park/layout";
import { RIDE_SIGNS } from "@/components/park/rideSigns";
import { TRAIN_SCALE } from "@/components/park/parkScale";
import { TRACK_HALF_WIDTH_METRES } from "@/components/park-train/constants";
import { TRACK_CURVE } from "@/components/park-train/trainTrack";
import { distanceToPaving } from "@/components/world/paths";
import {
  OVERALL_REACH as CHAIRS_REACH,
  RIDE_CENTER as CHAIRS_CENTER,
} from "@/components/flying-chairs/constants";
import { OVERALL_REACH as UFO_REACH } from "@/components/ufo-pendulum/constants";
import { RIDE_CENTER as UFO_CENTER } from "@/components/ufo-pendulum/placement";
import { OVERALL_REACH as LOOPER_REACH } from "@/components/super-looper/constants";
import { RIDE_CENTER as LOOPER_CENTER } from "@/components/super-looper/placement";
import {
  FOOD_COURT_CENTER,
  FOOD_COURT_HALF,
  GATE_X,
  GATE_Z,
} from "@/simulation/journey/constants";
import { BEHIND_RIDE_ID, OVERALL_REACH } from "./constants";

/**
 * WHERE THE TEA CUPS STAND — "behind the dataengineering ride".
 *
 * The Data Engineering ride is the UFO Pendulum: that mapping lives in
 * `departments.ts` and nothing here changes it. So this ride goes behind the
 * pendulum, and BEHIND is treated as a direction rather than a coordinate —
 * the same way the Flying Chairs were put behind the food court. The bearing
 * is taken from the main gate, through the pendulum, and the ride is pushed
 * out along that line until it clears everything the park already has.
 *
 * That makes the placement honest in a way a typed pair of numbers could not
 * be: if the pendulum ever moves, this ride follows it round, still behind it
 * and still from the gate's point of view.
 *
 * WHAT IT HAS TO CLEAR is every margin the park keeps — twelve metres to any
 * ride footprint, ten to the railway, eight to a signboard, the plaza and the
 * food court, six to any paving, and twelve to each of the three attractions
 * that are not in the layout either. All measured from OVERALL_REACH, because
 * what arrives at a neighbour first is the edge of the machine and not its
 * middle.
 *
 * IT IS NOT IN THE PARK LAYOUT. A sixth box handed to the solver would
 * re-solve all five existing ride positions and shift the whole park.
 */

const RAILS: [number, number][] = Array.from({ length: 721 }, (_, i) => {
  const p = TRACK_CURVE.getPointAt(i / 720);
  return [p.x * TRAIN_SCALE, p.z * TRAIN_SCALE];
});

/** Margins this ride keeps, over and above its own reach. */
export const MARGINS = {
  ride: 12,
  railway: 10,
  sign: 8,
  paving: 6,
  plaza: 8,
  foodCourt: 8,
  attraction: 12,
} as const;

/** The ride it stands behind. */
export const NEIGHBOUR = rideById(BEHIND_RIDE_ID);

function boxDistance(x: number, z: number, r: (typeof PARK_LAYOUT)[number]): number {
  return Math.hypot(Math.max(r.minX - x, 0, x - r.maxX), Math.max(r.minZ - z, 0, z - r.maxZ));
}

/** Every clearance the ground at (x, z) offers, and how much each has in hand. */
export function slackAt(x: number, z: number): { what: string; slack: number }[] {
  const reach = OVERALL_REACH;
  return [
    {
      what: "every ride footprint",
      slack: Math.min(...PARK_LAYOUT.map((r) => boxDistance(x, z, r))) - (reach + MARGINS.ride),
    },
    {
      /* Measured to the RAIL, not to the centre line the samples trace. The
         track is 46.4 m across now, so its own half width is the first thing
         between this ride and the train — a margin taken from the centre line
         would have put a ride comfortably clear of a line and squarely under
         the near rail. */
      what: "the railway",
      slack:
        Math.min(...RAILS.map(([rx, rz]) => Math.hypot(x - rx, z - rz))) -
        (reach + TRACK_HALF_WIDTH_METRES + MARGINS.railway),
    },
    {
      what: "every signboard",
      slack:
        Math.min(...RIDE_SIGNS.map((s) => Math.hypot(x - s.position[0], z - s.position[1]))) -
        (reach + MARGINS.sign),
    },
    { what: "the paving", slack: distanceToPaving(x, z) - (reach + MARGINS.paving) },
    {
      what: "the plaza ring",
      slack:
        Math.abs(Math.hypot(x - PLAZA_CENTER[0], z - PLAZA_CENTER[1]) - PLAZA_RADIUS) -
        (reach + MARGINS.plaza),
    },
    {
      what: "the food court",
      slack:
        Math.hypot(
          Math.max(Math.abs(x - FOOD_COURT_CENTER[0]) - FOOD_COURT_HALF, 0),
          Math.max(Math.abs(z - FOOD_COURT_CENTER[1]) - FOOD_COURT_HALF, 0),
        ) -
        (reach + MARGINS.foodCourt),
    },
    {
      what: "the Flying Chairs",
      slack:
        Math.hypot(x - CHAIRS_CENTER[0], z - CHAIRS_CENTER[1]) -
        (reach + CHAIRS_REACH + MARGINS.attraction),
    },
    {
      what: "the Super Looper",
      slack:
        Math.hypot(x - LOOPER_CENTER[0], z - LOOPER_CENTER[1]) -
        (reach + LOOPER_REACH + MARGINS.attraction),
    },
    {
      /* The pendulum it stands behind is measured on its SWEPT circle, not on
         its footprint: what arrives here first is a saucer going over the top,
         and the layout box is the ground the frames stand on. */
      what: "the UFO Pendulum it stands behind",
      slack:
        Math.hypot(x - UFO_CENTER[0], z - UFO_CENTER[1]) -
        (reach + UFO_REACH + MARGINS.attraction),
    },
  ];
}

/** The tightest of them: negative means the ground will not take the ride. */
export function shortfallAt(x: number, z: number): number {
  return Math.min(...slackAt(x, z).map((s) => s.slack));
}

/** The angular slice a thing of the given reach subtends from the main viewpoint. */
export function sliceFromViewpoint(
  x: number,
  z: number,
  reach: number,
): readonly [number, number] {
  const ux = PARK_CENTER[0] - MAIN_VIEWPOINT[0];
  const uz = PARK_CENTER[1] - MAIN_VIEWPOINT[1];
  const ul = Math.hypot(ux, uz) || 1;
  const dx = x - MAIN_VIEWPOINT[0];
  const dz = z - MAIN_VIEWPOINT[1];
  const distance = Math.hypot(dx, dz) || 1;
  const bearing =
    (Math.atan2((ux / ul) * dz - (uz / ul) * dx, dx * (ux / ul) + dz * (uz / ul)) * 180) / Math.PI;
  const half = (Math.atan(reach / distance) * 180) / Math.PI;
  return [bearing - half, bearing + half] as const;
}

/**
 * Does a ride standing here HIDE another one from the entrance?
 *
 * Sharing a bearing is not enough — you have to be in front of it. Standing
 * BEHIND something is the whole point of this ride's brief, and it is allowed:
 * the Flying Chairs already sit inside the food court's own slice, further out
 * than it.
 */
export function hidesARide(x: number, z: number): boolean {
  const [from, to] = sliceFromViewpoint(x, z, OVERALL_REACH);
  const distance = Math.hypot(x - MAIN_VIEWPOINT[0], z - MAIN_VIEWPOINT[1]);
  return viewAngles(MAIN_VIEWPOINT, PARK_CENTER).some(
    (a) =>
      to > a.bearingDeg - a.halfWidthDeg &&
      from < a.bearingDeg + a.halfWidthDeg &&
      distance < a.distance,
  );
}

/* The gate's line of sight through the pendulum, which is what "behind" means. */
const TO_NEIGHBOUR_X = NEIGHBOUR.center[0] - GATE_X;
const TO_NEIGHBOUR_Z = NEIGHBOUR.center[1] - GATE_Z;
const TO_NEIGHBOUR_LEN = Math.hypot(TO_NEIGHBOUR_X, TO_NEIGHBOUR_Z) || 1;
const BEARING: readonly [number, number] = [
  TO_NEIGHBOUR_X / TO_NEIGHBOUR_LEN,
  TO_NEIGHBOUR_Z / TO_NEIGHBOUR_LEN,
];

/** How far along the gate-to-pendulum line a point lies. */
export function alongBearing(x: number, z: number): number {
  return (x - GATE_X) * BEARING[0] + (z - GATE_Z) * BEARING[1];
}

/** How far off that line it lies. */
export function acrossBearing(x: number, z: number): number {
  return (x - GATE_X) * -BEARING[1] + (z - GATE_Z) * BEARING[0];
}

/**
 * Straight out along that bearing, a step at a time, until the ground takes it.
 *
 * The ride sits ON the gate-to-pendulum line — no sideways offset at all — so
 * "behind" is exactly what it looks like from the entrance. The only free
 * number is how far past the pendulum it has to go, and that is not chosen
 * either: it is the first distance at which every margin in the park is met
 * with a few metres to spare.
 */
export const COMFORT_SLACK = 6;

function solveDistance(): number {
  for (let d = NEIGHBOUR.halfX + OVERALL_REACH; d <= 900; d += 0.5) {
    const x = NEIGHBOUR.center[0] + BEARING[0] * d;
    const z = NEIGHBOUR.center[1] + BEARING[1] * d;
    if (shortfallAt(x, z) < COMFORT_SLACK) continue;
    if (hidesARide(x, z)) continue;
    return d;
  }
  throw new Error("No ground behind the UFO Pendulum clears every margin the Tea Cups need");
}

/** How far behind the pendulum's centre the ride stands. */
export const BEHIND_DISTANCE = solveDistance();

/** World position of the ride's centre — the column's own axis. */
export const RIDE_CENTER: [number, number] = [
  NEIGHBOUR.center[0] + BEARING[0] * BEHIND_DISTANCE,
  NEIGHBOUR.center[1] + BEARING[1] * BEHIND_DISTANCE,
];

/** The ride's origin as an R3F position triple. */
export const RIDE_ORIGIN: [number, number, number] = [RIDE_CENTER[0], 0, RIDE_CENTER[1]];

/**
 * WHICH WAY IT FACES: the boarding gate looks back at the main gate.
 *
 * The ride is a circle and needs no turning to read, but its one opening does:
 * a visitor walking round the pendulum should arrive at the steps rather than
 * at the back of the rail. A group rotated by `alpha` about +Y carries its
 * local +X to (cos alpha, -sin alpha) in world x/z, so this is the angle that
 * sends local +X — where the gate is cut — back towards the entrance.
 */
export const RIDE_FACING = Math.atan2(-(GATE_Z - RIDE_CENTER[1]), GATE_X - RIDE_CENTER[0]);
