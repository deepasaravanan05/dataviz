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
import { OVERALL_REACH as TEACUPS_REACH } from "@/components/tea-cups/constants";
import { RIDE_CENTER as TEACUPS_CENTER } from "@/components/tea-cups/placement";
import { OVERALL_REACH as GIGA_REACH } from "@/components/giga-coaster/envelope";
import { RIDE_CENTER as GIGA_CENTER } from "@/components/giga-coaster/placement";
import {
  FOOD_COURT_CENTER,
  FOOD_COURT_HALF,
  GATE_X,
  GATE_Z,
} from "@/simulation/journey/constants";
import { BEHIND_RIDE_ID, OVERALL_REACH } from "./constants";

/**
 * WHERE THE DUMBO RIDE STANDS — "behind the data engineers".
 *
 * The Data Engineering ride is the UFO Pendulum, and that mapping lives in
 * `departments.ts`; nothing here touches it. So this ride goes behind the
 * pendulum, with BEHIND taken as a DIRECTION rather than a coordinate: the
 * bearing from the main gate, through the pendulum, and out.
 *
 * EXCEPT THAT LINE IS TAKEN. The Tea Cups were put behind the same ride, dead
 * on the same line of sight, so a second ride pushed straight out along it
 * would either sit in the cups or stand a hundred metres further out and be
 * behind them rather than behind the pendulum. What this solver does instead
 * is fan: it tries the line first, and then a widening pair of bearings either
 * side of it, taking the first that clears every margin. It is still behind
 * the pendulum — the test is that it lies in the half-plane beyond it, on the
 * gate's own axis — but it stands off the cups' shoulder rather than in their
 * lap. The chosen offset is reported as `FAN_ANGLE_DEG` so the verify script
 * can state it rather than assume it.
 *
 * WHAT IT HAS TO CLEAR is every margin the park keeps: twelve metres to any
 * ride footprint, ten to the railway, eight to a signboard, the plaza and the
 * food court, and twelve to each of the attractions that are not in the layout
 * either — the Flying Chairs, the Super Looper, the Tea Cups, the Giga Coaster
 * and the pendulum itself. All measured from OVERALL_REACH, because what
 * arrives at a neighbour first is the edge of the machine, not its middle.
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
      what: "the Tea Cups",
      slack:
        Math.hypot(x - TEACUPS_CENTER[0], z - TEACUPS_CENTER[1]) -
        (reach + TEACUPS_REACH + MARGINS.attraction),
    },
    {
      what: "the Giga Coaster",
      slack:
        Math.hypot(x - GIGA_CENTER[0], z - GIGA_CENTER[1]) -
        (reach + GIGA_REACH + MARGINS.attraction),
    },
    {
      /* The pendulum it stands behind is measured on its SWEPT circle, not on
         its footprint: what arrives here first is a saucer going over the top,
         and the layout box is only the ground its frames stand on. */
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
 * Sharing a bearing is not enough — you have to be in FRONT of it. Standing
 * behind something is the whole point of this ride's brief and is allowed.
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

/** How far along the gate-to-pendulum line a point lies, from the gate. */
export function alongBearing(x: number, z: number): number {
  return (x - GATE_X) * BEARING[0] + (z - GATE_Z) * BEARING[1];
}

/** How far off that line it lies. */
export function acrossBearing(x: number, z: number): number {
  return (x - GATE_X) * -BEARING[1] + (z - GATE_Z) * BEARING[0];
}

/** The pendulum's own offset from the gate line, which is what sideways is measured from. */
const NEIGHBOUR_ACROSS = acrossBearing(NEIGHBOUR.center[0], NEIGHBOUR.center[1]);

/** Is a point beyond the pendulum, on the gate's own axis? That is "behind". */
export function isBehindNeighbour(x: number, z: number): boolean {
  return alongBearing(x, z) > alongBearing(NEIGHBOUR.center[0], NEIGHBOUR.center[1]);
}

/**
 * The fan: every bearing behind the pendulum, and the NEAREST place on any of
 * them that the ground will take.
 *
 * Two free numbers, and neither is typed in. Each candidate bearing is walked
 * outward until every margin in the park is met with COMFORT_SLACK to spare,
 * and the winner is the fit that costs least, where the COST IS IN METRES AND
 * HAS TWO TERMS: how far behind the pendulum it ends up, plus how far to the
 * side of the gate's line of sight it sits. Both are distances a visitor
 * actually walks, so adding them needs no weighting.
 *
 * Both terms are there because either alone gives the wrong answer. Cheapest
 * SIDEWAYS offset is dead on the line — where nothing stops the ride until it
 * has cleared the Tea Cups entirely, three hundred and seventy metres out, by
 * which point it is behind the cups rather than behind the pendulum. Cheapest
 * DISTANCE is sixty degrees off, tucked in beside the pendulum but eighty
 * metres to one side, which is beside it rather than behind it. The sum picks
 * a bearing five degrees off the line: a hundred and six metres further out
 * than the pendulum and nine to the side of it, which from the entrance is
 * simply behind it — with the Tea Cups fourteen metres clear on the shoulder.
 */
export const COMFORT_SLACK = 6;
export const FAN_STEP_DEG = 5;
/*
 * How far off the gate's line of sight the fan may reach before "behind" stops
 * meaning behind. Thirty degrees is the width of the pendulum's own slice from
 * the entrance plus a little: past that the ride reads as standing beside the
 * Data Engineering ride rather than behind it, however cheap the ground is.
 */
export const FAN_LIMIT_DEG = 30;

interface Solution {
  angleDeg: number;
  distance: number;
  center: [number, number];
}

function firstFit(angleDeg: number): Solution | null {
  const a = (angleDeg * Math.PI) / 180;
  const dx = BEARING[0] * Math.cos(a) - BEARING[1] * Math.sin(a);
  const dz = BEARING[0] * Math.sin(a) + BEARING[1] * Math.cos(a);

  for (let d = NEIGHBOUR.halfX + OVERALL_REACH; d <= 900; d += 0.5) {
    const x = NEIGHBOUR.center[0] + dx * d;
    const z = NEIGHBOUR.center[1] + dz * d;
    if (!isBehindNeighbour(x, z)) continue;
    if (shortfallAt(x, z) < COMFORT_SLACK) continue;
    if (hidesARide(x, z)) continue;
    return { angleDeg, distance: d, center: [x, z] };
  }
  return null;
}

/** What a fit costs, in metres walked: out past the ride, and off its line. */
function cost(fit: Solution): number {
  return fit.distance + Math.abs(acrossBearing(fit.center[0], fit.center[1]) - NEIGHBOUR_ACROSS);
}

function solve(): Solution {
  const offsets: number[] = [0];
  for (let a = FAN_STEP_DEG; a <= FAN_LIMIT_DEG; a += FAN_STEP_DEG) offsets.push(a, -a);

  let best: Solution | null = null;
  for (const angleDeg of offsets) {
    const fit = firstFit(angleDeg);
    if (!fit) continue;
    if (!best || cost(fit) < cost(best) - 1e-9) best = fit;
  }

  if (!best) {
    throw new Error("No ground behind the UFO Pendulum clears every margin the Dumbo Ride needs");
  }
  return best;
}

const SOLUTION = solve();

/** How far off the gate-to-pendulum line the ride ended up. */
export const FAN_ANGLE_DEG = SOLUTION.angleDeg;
/** And how far past the pendulum's centre it stands. */
export const BEHIND_DISTANCE = SOLUTION.distance;

/** World position of the ride's centre — the mast's own axis. */
export const RIDE_CENTER: [number, number] = SOLUTION.center;

/** The ride's origin as an R3F position triple. */
export const RIDE_ORIGIN: [number, number, number] = [RIDE_CENTER[0], 0, RIDE_CENTER[1]];

/**
 * WHICH WAY IT FACES: the stair looks back at the main gate.
 *
 * The ride is a circle and needs no turning to read, but its one stair does —
 * somebody walking round the pendulum should arrive at the foot of it rather
 * than at the far side of the gallery. A group rotated by `alpha` about +Y
 * carries its local +X to (cos alpha, -sin alpha) in world x/z, so this is the
 * angle that sends local +X — where the stair is — back towards the entrance.
 */
export const RIDE_FACING = Math.atan2(-(GATE_Z - RIDE_CENTER[1]), GATE_X - RIDE_CENTER[0]);
