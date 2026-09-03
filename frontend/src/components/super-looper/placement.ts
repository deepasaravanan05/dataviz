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
import { TRACK_CURVE } from "@/components/park-train/trainTrack";
import { distanceToPaving } from "@/components/world/paths";
import {
  OVERALL_REACH as CHAIRS_REACH,
  RIDE_CENTER as CHAIRS_CENTER,
} from "@/components/flying-chairs/constants";
import { OVERALL_REACH as UFO_REACH } from "@/components/ufo-pendulum/constants";
import { RIDE_CENTER as UFO_CENTER } from "@/components/ufo-pendulum/placement";
import {
  FOOD_COURT_CENTER,
  FOOD_COURT_HALF,
  GATE_OPENING,
  GATE_PILLAR_HALF,
  GATE_X,
  GATE_Z,
} from "@/simulation/journey/constants";
import { OVERALL_REACH } from "./constants";

/**
 * WHERE THE SUPER LOOPER STANDS — searched, not typed.
 *
 * This ride is NOT in the park layout. A sixth box handed to the solver would
 * re-solve all five existing positions and shift the whole park, so the ride
 * has to go in ground that was already clear — and finding that ground is a
 * search rather than a guess, exactly as the Flying Chairs' signboard is.
 *
 * WHAT IT HAS TO CLEAR is every margin the park already keeps: twelve metres
 * to any ride footprint, ten to the railway, eight to a signboard, the plaza
 * ring and the food court, six to any paving, and twelve to each of the two
 * attractions that are not in the layout either. All of them are measured from
 * OVERALL_REACH, because what arrives at a neighbour first is the outside of
 * the loop and not its centre.
 *
 * AND IT MAY NOT HIDE ANYTHING. The park's rides are fanned so that each has
 * clear sky beside it from the entrance; a new ride dropped into somebody
 * else's slice of that view undoes it. So every candidate is projected into
 * the view from the main viewpoint and rejected if its own slice overlaps a
 * ride's.
 *
 * OF THE GROUND THAT PASSES, THE NEAREST TO THE ROLLER COASTER WINS. The ride
 * was first put just inside the main gate, on the argument that a Super Loop
 * is a fairground machine and belongs where visitors arrive; the user has
 * since asked for it beside the Roller Coaster instead, so the objective moved
 * and nothing else did. The search walks outward from the coaster's footprint
 * and stops at the first distance that satisfies everything, so the result is
 * the CLOSEST the ride can legally stand to it rather than a spot picked for
 * being vaguely over that way.
 */

/** How far out from the middle the park still is park: the gate's own distance. */
export const PARK_HALF_SPAN = Math.hypot(GATE_X - PARK_CENTER[0], GATE_Z - PARK_CENTER[1]);

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
  gate: 10,
  foodCourt: 8,
  attraction: 12,
} as const;

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
      /*
       * The gate itself, which no other placement in the park has had to
       * think about because nothing else has ever been put this near it. Its
       * pillars are the widest part: half the opening plus a pillar either
       * side, and the arch is thin the other way.
       */
      what: "the main gate",
      slack:
        Math.hypot(
          Math.max(Math.abs(x - GATE_X) - (GATE_OPENING / 2 + 2 * GATE_PILLAR_HALF), 0),
          Math.max(Math.abs(z - GATE_Z) - GATE_PILLAR_HALF, 0),
        ) -
        (reach + MARGINS.gate),
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
 * Sharing a bearing is not enough to hide something — you have to be in FRONT
 * of it. That distinction did not matter while this ride was being placed out
 * in the open near the gate, and it matters entirely now that it has been
 * asked to stand beside the Roller Coaster: the ground next to a ride is, by
 * definition, on roughly the same bearing as that ride. So the test is the
 * honest one — an overlapping slice AND nearer to the viewpoint than the ride
 * it overlaps.
 *
 * Standing BEHIND something is allowed, and is what the Flying Chairs already
 * do: they sit inside the food court's own slice, further out than it.
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

/**
 * A MARGIN IN HAND, not a margin exactly met.
 *
 * Taking the first ground that technically passes puts the ride three
 * centimetres inside its own limit, which is not a position — it is a
 * coincidence, and the next time anything in the park moves it stops being
 * true. So the search wants this much slack beyond every margin before it will
 * take a spot, the same few metres in hand the Flying Chairs were given.
 */
export const COMFORT_SLACK = 8;

/** The ride this one was asked to stand next to. */
export const NEIGHBOUR_ID = "coaster";

const NEIGHBOUR = PARK_LAYOUT.find((r) => r.id === NEIGHBOUR_ID)!;

/** How far (x, z) is from the Roller Coaster's own footprint. */
export function distanceToNeighbour(x: number, z: number): number {
  return boxDistance(x, z, NEIGHBOUR);
}

/**
 * Where a ray leaves the neighbour's footprint, so the search can walk out
 * from the EDGE of the coaster rather than from its centre — the coaster's box
 * is 166 m by 124 m, and "near the roller coaster" means near the ride, not
 * near the middle of a very large rectangle.
 */
function boxExit(bearing: number): [number, number] {
  const dx = Math.cos(bearing);
  const dz = Math.sin(bearing);
  const tx = Math.abs(dx) < 1e-9 ? Infinity : ((NEIGHBOUR.maxX - NEIGHBOUR.minX) / 2) / Math.abs(dx);
  const tz = Math.abs(dz) < 1e-9 ? Infinity : ((NEIGHBOUR.maxZ - NEIGHBOUR.minZ) / 2) / Math.abs(dz);
  const t = Math.min(tx, tz);
  return [NEIGHBOUR.center[0] + dx * t, NEIGHBOUR.center[1] + dz * t];
}

/**
 * "place the ride near to the roller coaster"
 *
 * So the objective changes and the constraints do not. The search walks
 * outward from the coaster's own footprint a couple of metres at a time and
 * stops at the first distance where some bearing satisfies EVERYTHING the park
 * already required of this ride — every margin, with slack in hand, and hiding
 * nothing from the entrance. What comes back is therefore the closest the
 * Super Looper can legally stand to the Roller Coaster, rather than a spot
 * chosen for being roughly over that way.
 *
 * The coaster itself sets the floor on how close that can be: the park keeps
 * twelve metres between a ride footprint and anything else, measured from this
 * ride's own reach, so the loop can never come nearer than thirty-one metres
 * to the coaster's box however the rest of the search goes.
 */
function solvePosition(): [number, number] {
  for (let out = 2; out <= 320; out += 2) {
    let best: { position: [number, number]; distance: number; clearance: number } | null = null;
    for (let step = 0; step < 720; step++) {
      const bearing = (step / 720) * Math.PI * 2;
      const [ex, ez] = boxExit(bearing);
      const x = ex + Math.cos(bearing) * out;
      const z = ez + Math.sin(bearing) * out;
      /*
       * Keep it in the park rather than out in the fields beyond it. The park
       * runs from the coaster at the far end to the gate, so its own furthest
       * corner from the middle is the gate itself; anything inside that is
       * ground a visitor would walk.
       */
      if (Math.hypot(x - PARK_CENTER[0], z - PARK_CENTER[1]) > PARK_HALF_SPAN) continue;
      const clearance = shortfallAt(x, z);
      if (clearance < COMFORT_SLACK) continue;
      if (hidesARide(x, z)) continue;
      const distance = distanceToNeighbour(x, z);
      if (!best || distance < best.distance - 1e-9) {
        best = { position: [x, z], distance, clearance };
      }
    }
    if (best) return best.position;
  }
  throw new Error("No ground beside the Roller Coaster clears every margin the Super Looper needs");
}

/** World position of the loop's centre line. */
export const RIDE_CENTER: [number, number] = solvePosition();

/** The ride's origin as an R3F position triple. */
export const RIDE_ORIGIN: [number, number, number] = [RIDE_CENTER[0], 0, RIDE_CENTER[1]];

/**
 * WHICH WAY THE LOOP FACES.
 *
 * A loop seen edge-on is a line. So the ring is turned to present its plane
 * broadside to the park's main viewpoint, which is the same rule the UFO
 * Pendulum's swing plane follows and for the same reason.
 *
 * A group rotated by `alpha` about +Y carries its local +X to
 * (cos alpha, -sin alpha) in world x/z. Setting that equal to the left-hand
 * perpendicular of the view direction gives the angle below; the check that it
 * actually holds measures the angle between the loop's plane and the line of
 * sight rather than trusting this trigonometry.
 */
const toRideX = RIDE_CENTER[0] - MAIN_VIEWPOINT[0];
const toRideZ = RIDE_CENTER[1] - MAIN_VIEWPOINT[1];
const toRideLength = Math.hypot(toRideX, toRideZ) || 1;

export const RIDE_FACING = Math.atan2(-toRideX / toRideLength, -toRideZ / toRideLength);
