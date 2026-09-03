import {
  MAIN_VIEWPOINT,
  PARK_CENTER,
  PARK_LAYOUT,
  PLAZA_CENTER,
  PLAZA_RADIUS,
  viewAngles,
} from "@/components/park/layout";
import { RIDE_SIGNS } from "@/components/park/rideSigns";
import { TRAIN_SCALE } from "@/components/park/parkScale";
import { TRACK_HALF_WIDTH_METRES } from "@/components/park-train/constants";
import { TRACK_CURVE as TRAIN_TRACK } from "@/components/park-train/trainTrack";
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
import {
  FOOD_COURT_CENTER,
  FOOD_COURT_HALF,
  GATE_OPENING,
  GATE_PILLAR_HALF,
  GATE_X,
  GATE_Z,
} from "@/simulation/journey/constants";
import { OVERALL_REACH } from "./envelope";

/**
 * WHERE THE GIGA COASTER STANDS — "placed near the teacup ride".
 *
 * The search walks outward from the Tea Cups a couple of metres at a time and
 * stops at the first distance where some bearing satisfies everything the park
 * requires of a new ride: twelve metres to any ride footprint, ten to the
 * railway, eight to a signboard, the plaza, the food court and the gate, six
 * to any paving, and twelve to each of the four attractions that are not in
 * the layout either. What comes back is therefore the CLOSEST this ride can
 * legally stand to the Tea Cups rather than somewhere roughly over that way.
 *
 * IT IS A BIG RIDE AND THAT COSTS DISTANCE. A circuit seven hundred metres
 * long claims a hundred-odd metres of ground in every direction, and the Tea
 * Cups claim eighty of their own, so "near" cannot mean "beside": the two
 * centres have to be the best part of two hundred metres apart before either
 * ride's own ground stops overlapping the other's. That is arithmetic rather
 * than preference, and it is what the number below comes out of.
 *
 * IT IS NOT IN THE PARK LAYOUT. A sixth box handed to the solver would
 * re-solve all five existing ride positions and shift the whole park, so like
 * every attraction added since, this ride finds ground that was already clear.
 */

const RAILS: [number, number][] = Array.from({ length: 721 }, (_, i) => {
  const p = TRAIN_TRACK.getPointAt(i / 720);
  return [p.x * TRAIN_SCALE, p.z * TRAIN_SCALE];
});

/** Margins this ride keeps, over and above its own reach. */
export const MARGINS = {
  ride: 12,
  railway: 10,
  sign: 8,
  paving: 6,
  plaza: 8,
  gate: 10,
  foodCourt: 8,
  attraction: 12,
} as const;

/** How much slack beyond every margin the search insists on before it settles. */
export const COMFORT_SLACK = 6;

/** The ride it was told to stand near. */
export const NEIGHBOUR_CENTER = TEACUPS_CENTER;
export const NEIGHBOUR_REACH = TEACUPS_REACH;

function boxDistance(x: number, z: number, r: (typeof PARK_LAYOUT)[number]): number {
  return Math.hypot(Math.max(r.minX - x, 0, x - r.maxX), Math.max(r.minZ - z, 0, z - r.maxZ));
}

/** How far this ride's ground would be from the Tea Cups' ground. */
export function gapToNeighbour(x: number, z: number): number {
  return (
    Math.hypot(x - NEIGHBOUR_CENTER[0], z - NEIGHBOUR_CENTER[1]) -
    OVERALL_REACH -
    NEIGHBOUR_REACH
  );
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
      what: "the main gate",
      slack:
        Math.hypot(
          Math.max(Math.abs(x - GATE_X) - (GATE_OPENING / 2 + 2 * GATE_PILLAR_HALF), 0),
          Math.max(Math.abs(z - GATE_Z) - GATE_PILLAR_HALF, 0),
        ) -
        (reach + MARGINS.gate),
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
      what: "the UFO Pendulum",
      slack:
        Math.hypot(x - UFO_CENTER[0], z - UFO_CENTER[1]) -
        (reach + UFO_REACH + MARGINS.attraction),
    },
    {
      what: "the Super Looper",
      slack:
        Math.hypot(x - LOOPER_CENTER[0], z - LOOPER_CENTER[1]) -
        (reach + LOOPER_REACH + MARGINS.attraction),
    },
    {
      what: "the Tea Cups it stands near",
      slack: gapToNeighbour(x, z) - MARGINS.attraction,
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

/** Does a ride standing here HIDE another one from the entrance? */
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

function solvePosition(): [number, number] {
  for (let out = OVERALL_REACH + NEIGHBOUR_REACH; out <= 600; out += 2) {
    let best: { position: [number, number]; gap: number } | null = null;
    for (let step = 0; step < 720; step++) {
      const bearing = (step / 720) * Math.PI * 2;
      const x = NEIGHBOUR_CENTER[0] + Math.cos(bearing) * out;
      const z = NEIGHBOUR_CENTER[1] + Math.sin(bearing) * out;
      if (shortfallAt(x, z) < COMFORT_SLACK) continue;
      if (hidesARide(x, z)) continue;
      const gap = gapToNeighbour(x, z);
      if (!best || gap < best.gap - 1e-9) best = { position: [x, z], gap };
    }
    if (best) return best.position;
  }
  throw new Error("No ground near the Tea Cups clears every margin the Giga Coaster needs");
}

/** World position of the ride's own origin — the station end of the circuit. */
export const RIDE_CENTER: [number, number] = solvePosition();

/** The ride's origin as an R3F position triple. */
export const RIDE_ORIGIN: [number, number, number] = [RIDE_CENTER[0], 0, RIDE_CENTER[1]];

/**
 * WHICH WAY THE CIRCUIT FACES.
 *
 * A coaster's plan is long and thin — this one is nearly two hundred metres by
 * eighty — so which way it lies decides whether a visitor sees a lift hill and
 * a drop or an end-on line of steel. It is turned to present its LONG side to
 * the park's main viewpoint, the same rule the UFO Pendulum's swing plane and
 * the Super Looper's ring follow.
 *
 * A group rotated by `alpha` about +Y carries its local +X to
 * (cos alpha, -sin alpha) in world x/z, and this is the angle that sets that
 * against the line of sight.
 */
const toRideX = RIDE_CENTER[0] - MAIN_VIEWPOINT[0];
const toRideZ = RIDE_CENTER[1] - MAIN_VIEWPOINT[1];
const toRideLength = Math.hypot(toRideX, toRideZ) || 1;

export const RIDE_FACING = Math.atan2(-toRideX / toRideLength, -toRideZ / toRideLength);
