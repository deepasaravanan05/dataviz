import { RIDE_FOOTPRINTS } from "./rideFootprints";
import { OVERALL_REACH as CHAIRS_REACH } from "@/components/flying-chairs/constants";
import { OVERALL_REACH as LOOPER_REACH } from "@/components/super-looper/constants";
import { OVERALL_REACH as TEACUPS_REACH } from "@/components/tea-cups/constants";
import { OVERALL_REACH as GIGA_REACH } from "@/components/giga-coaster/envelope";
import { OVERALL_REACH as DUMBO_REACH } from "@/components/dumbo-ride/constants";

/**
 * THE MASTER PLAN — a radially symmetric park.
 *
 *   MAIN ENTRANCE -> CENTRAL AVENUE -> THE GRAND FOOD COURT
 *                 -> THE FOOD COURT'S CIRCULAR PATH
 *                 -> EQUAL RADIAL PATHS -> EQUAL RIDE PLOTS
 *                 -> THE OUTER CIRCULAR PATH
 *
 * WHAT CHANGED, AND WHY IT IS A REWRITE RATHER THAN AN ADJUSTMENT.
 *
 * The previous plan was concentric but not SYMMETRIC. Each attraction stood at
 * its own radius — far enough out that its own envelope just cleared the ring
 * path — so a big ride stood further from the middle than a small one, its
 * radial spur was shorter, and the ground it occupied was a different size.
 * That was a deliberate choice at the time (it kept every ride's inner edge on
 * one circle) and it is the opposite of what is now asked for.
 *
 * The rule now is EQUALITY, enforced by construction rather than checked
 * afterwards:
 *
 *   - ONE ring radius. Every ride centre is exactly `RIDE_RING_RADIUS` from the
 *     middle of the park. There is no per-ride radius left to get wrong.
 *   - ONE angular step, 360/N. No gaps, no exceptions, no wider slot for
 *     anything.
 *   - ONE plot. Every ride stands in the middle of an identical circular
 *     platform of `RIDE_PLOT_RADIUS`, entered where its radial path meets the
 *     platform edge.
 *   - ONE radial path length. The plots are identical and concentric, so every
 *     radial runs between the same two radii and equal length is a property of
 *     the construction rather than a coincidence to be measured.
 *
 * WHAT EQUALITY CANNOT MEAN HERE, said plainly. The ten attractions are ten
 * different machines — a wheel, a pendulum, two coasters, a swinging ship — so
 * their models cannot all be the same shape, and this park's standing rule is
 * that a ride is only ever scaled UNIFORMLY, never stretched to a target
 * outline. What is made identical is everything the PLAN owns: the plot, the
 * platform, the clearance, the distance, the spacing and the path. The rides
 * are already built to the park's one common height, which is the one
 * dimension a uniform scale can equalise.
 *
 * EVERYTHING HERE IS SOLVED, NOT TYPED. The plot comes out of the largest
 * ride, the ring radius out of the plot, the outer path out of the ring, and
 * the railway, the road and the gate out of that. Resize a ride and the park
 * grows around it, symmetrically.
 *
 * This module is a LEAF on purpose: it reads ride SIZES and nothing else. The
 * layout, the paths, the food court, the railway and the gate all read it.
 */

/* ------------------------------------------------------------------ *
 * BEARINGS
 * ------------------------------------------------------------------ */

/**
 * The park's own compass: an angle of 0 points at the main gate.
 *
 * The gate has always stood on the +Z side of the middle, so +Z is the park's
 * "south" and the angle grows towards +X, the way a bearing does. Every
 * position in the park is (bearing, radius) from this one point, which is what
 * makes the plan symmetric by construction rather than by inspection.
 */
export const PARK_ORIGIN: [number, number] = [70, 150];

export function ringPoint(bearingDeg: number, radius: number): [number, number] {
  const a = (bearingDeg * Math.PI) / 180;
  return [PARK_ORIGIN[0] + Math.sin(a) * radius, PARK_ORIGIN[1] + Math.cos(a) * radius];
}

/** Bearing (deg, gate = 0) and radius of a point in the park. */
export function ringCoords(p: readonly [number, number]): { bearingDeg: number; radius: number } {
  const dx = p[0] - PARK_ORIGIN[0];
  const dz = p[1] - PARK_ORIGIN[1];
  return {
    bearingDeg: (Math.atan2(dx, dz) * 180) / Math.PI,
    radius: Math.hypot(dx, dz),
  };
}

/** Unit vector pointing from a point towards the middle of the park. */
export function inwardFrom(p: readonly [number, number]): [number, number] {
  const dx = PARK_ORIGIN[0] - p[0];
  const dz = PARK_ORIGIN[1] - p[1];
  const len = Math.hypot(dx, dz) || 1;
  return [dx / len, dz / len];
}

/**
 * The Y-rotation that turns a ride broadside to the middle of the park.
 *
 * Every attraction is entered from its radial path, which arrives from inside,
 * so the side a visitor sees is the inward one and a ride with a flat plane — a
 * coaster's loop, a pendulum's swing — has to present that plane to it. A group
 * rotated by `alpha` about +Y carries its local +X to (cos alpha, -sin alpha)
 * in world x/z, which this sets to the perpendicular of the radius.
 */
export function facingCenter(p: readonly [number, number]): number {
  const [ix, iz] = inwardFrom(p);
  return Math.atan2(ix, iz);
}

/* ------------------------------------------------------------------ *
 * THE CENTREPIECE: THE GRAND FOOD COURT
 * ------------------------------------------------------------------ */

/**
 * THE MIDDLE OF THE PARK IS THE FOOD COURT, and it is the largest single thing
 * in the plan.
 *
 * It replaces the lake and its waterfall outright — the water is gone, not
 * moved. A 500 m plaza against a 363 m ride plot means the centrepiece reads
 * as the centrepiece from the air, which is the point of putting it here, and
 * it gives the one building everybody actually walks into the room a park of
 * this size needs.
 *
 * The court is built in concentric bands, and every radius below is what the
 * geometry is drawn at:
 *
 *   0..45      the domed pavilion — the hall itself
 *   60..95     a ring of food stalls, facing outward
 *   120        the grand colonnade: the circular building framing the court
 *   150..215   tables and seating, in landscaped bays
 *   230..250   planting, and the plaza edge
 *   252..278   THE CIRCULAR FOOD COURT PATH, which every radial leaves from
 */
export const FOOD_COURT_HALL_RADIUS = 45;
export const FOOD_COURT_STALL_RADIUS = 78;
export const FOOD_COURT_COLONNADE_RADIUS = 120;
export const FOOD_COURT_TABLE_INNER_RADIUS = 152;
export const FOOD_COURT_TABLE_OUTER_RADIUS = 200;
export const FOOD_COURT_PLANTING_RADIUS = 228;
export const FOOD_COURT_PLAZA_RADIUS = 250;

/** Where the food court stands: the middle of the park. */
export const FOOD_COURT_POINT: [number, number] = [...PARK_ORIGIN] as [number, number];

/** The circular path around the food court. Every radial path starts here. */
export const FOOD_COURT_PATH_WIDTH = 26;
export const FOOD_COURT_PATH_RADIUS = FOOD_COURT_PLAZA_RADIUS + FOOD_COURT_PATH_WIDTH / 2 + 2;
export const FOOD_COURT_PATH_OUTER = FOOD_COURT_PATH_RADIUS + FOOD_COURT_PATH_WIDTH / 2;

/** The central avenue, from the gate straight in to the food court. */
export const AVENUE_WIDTH = 30;

/* ------------------------------------------------------------------ *
 * THE RIDE RING
 * ------------------------------------------------------------------ */

/**
 * The attractions, in the order they run round the ring.
 *
 * The order no longer buys anything structural — with one radius, one plot
 * size and one angular step, every slot is interchangeable — so it is simply
 * the order the park has had, kept so that nothing shuffles for no reason.
 *
 * Listed from the far left of the entrance, round the back, to the far right.
 */
export const RIDE_RING_ORDER = [
  "teacups",
  "ferris",
  "giga",
  "chairs",
  "monster",
  /* -- the entrance avenue runs through here -- */
  "coaster",
  "looper",
  "ufo",
  "dragon",
  "dumbo",
] as const;

export type RingRideId = (typeof RIDE_RING_ORDER)[number];

/**
 * HOW MUCH GROUND EACH ATTRACTION ACTUALLY OCCUPIES.
 *
 * The radius of the circle that contains the machine, which is what a
 * neighbour, a path or a tree meets first.
 *
 * For the five rides in the park layout it is read off their declared
 * footprint, and the two cases are genuinely different. A footprint whose two
 * half-extents are EQUAL was declared from a swept RADIUS — the Monster Ride's
 * arms, the Ferris Wheel's rim, the pendulum's arc all sweep circles — so the
 * envelope IS that circle and the half-extent is the answer. A footprint with
 * unequal half-extents is a real rectangle, a coaster's track box, and what
 * contains it is its diagonal.
 *
 * Taking the diagonal for both used to cost the park fifty metres of plot
 * radius it did not owe: the Monster Ride's square 129 m box has a 183 m
 * diagonal, and no part of the ride is ever out at the corner. With every plot
 * now sized to the largest ride, that overshoot would have been paid for ten
 * times over.
 */
function envelopeOf(f: { halfX: number; halfZ: number }): number {
  return Math.abs(f.halfX - f.halfZ) < 1e-9 ? f.halfX : Math.hypot(f.halfX, f.halfZ);
}

const layoutReach = (id: string) => envelopeOf(RIDE_FOOTPRINTS.find((r) => r.id === id)!);

export const RING_RIDE_REACH: Record<RingRideId, number> = {
  teacups: TEACUPS_REACH,
  ferris: layoutReach("ferris"),
  giga: GIGA_REACH,
  chairs: CHAIRS_REACH,
  monster: layoutReach("monster"),
  coaster: layoutReach("coaster"),
  looper: LOOPER_REACH,
  ufo: layoutReach("ufo"),
  dragon: layoutReach("dragon"),
  dumbo: DUMBO_REACH,
};

/** The angular step. One value, used everywhere; no ride gets a wider slot. */
export const RIDE_SLOT_STEP_DEG = 360 / RIDE_RING_ORDER.length;

/**
 * WHERE EACH SLOT IS.
 *
 * Half a step off the axis, so the slots come in mirrored pairs at ±(k−½)
 * steps and the entrance avenue runs straight down the gap between the two
 * nearest. That is the only arrangement that is BOTH evenly spaced and
 * symmetric about the way in: putting a slot on the axis would either block
 * the avenue or force it to bend round a ride, and widening one gap for the
 * entrance — which the previous plan did — breaks the equal spacing outright.
 */
export const RIDE_SLOT_BEARING: Record<RingRideId, number> = (() => {
  const out = {} as Record<RingRideId, number>;
  const half = RIDE_RING_ORDER.length / 2;
  RIDE_RING_ORDER.forEach((id, i) => {
    const rank = i < half ? half - i : i - half + 1; // 5,4,3,2,1 | 1,2,3,4,5
    const side = i < half ? -1 : 1;
    out[id] = side * (rank - 0.5) * RIDE_SLOT_STEP_DEG;
  });
  return out;
})();

/**
 * THE RIDE PLOT — identical for every attraction.
 *
 * A circular paved platform big enough to hold the LARGEST ride in the park,
 * so every machine has the same amount of platform showing around it. Every
 * ride stands in the middle of one; the smaller ones simply have more of their
 * own plot to themselves, which is where their queue, their seating and their
 * planting go.
 *
 * Sizing every plot to the largest ride is what makes "no ride larger,
 * smaller, closer or farther than another" true of the thing the plan actually
 * owns. The machines keep their own proportions, because scaling ten different
 * rides to one outline would mean stretching them, and this park scales
 * uniformly or not at all.
 */
export const PLOT_MARGIN = 12;
export const RIDE_PLOT_RADIUS =
  Math.max(...RIDE_RING_ORDER.map((id) => RING_RIDE_REACH[id])) + PLOT_MARGIN;

/** Landscaped ground between two neighbouring plots. */
export const PLOT_GAP = 45;
/** Clear ground between the entrance avenue and the plots either side of it. */
export const AVENUE_PLOT_CLEARANCE = 25;
/** No radial path is allowed to be a token stub. */
export const MIN_RADIAL_LENGTH = 120;

const HALF_STEP_RAD = (Math.PI / 180) * (RIDE_SLOT_STEP_DEG / 2);
/* Adjacent plots must not touch, measured on the chord between two slots. */
const RING_BY_SPACING = (2 * RIDE_PLOT_RADIUS + PLOT_GAP) / (2 * Math.sin(HALF_STEP_RAD));
/* The avenue runs down the axis; the nearest slots sit half a step either
   side of it, so what matters is their perpendicular distance from it. */
const RING_BY_AVENUE =
  (RIDE_PLOT_RADIUS + AVENUE_WIDTH / 2 + AVENUE_PLOT_CLEARANCE) / Math.sin(HALF_STEP_RAD);
/* And the radial paths have to have somewhere to run. */
const RING_BY_RADIAL = RIDE_PLOT_RADIUS + FOOD_COURT_PATH_OUTER + MIN_RADIAL_LENGTH;

/**
 * THE ONE RADIUS EVERY RIDE STANDS AT — solved, from three things at once.
 *
 * Neighbouring plots must not touch; the entrance avenue must pass between the
 * two plots either side of it with room to spare; and the radial paths must be
 * paths rather than doorsteps. Whichever binds hardest sets the ring and the
 * others come out with room in hand. `verify-park-structure.ts` reports which
 * one it was, so the number is never mysterious.
 */
export const RIDE_RING_RADIUS = Math.max(RING_BY_SPACING, RING_BY_AVENUE, RING_BY_RADIAL);

/** Which of the three constraints actually set the ring. */
export const RIDE_RING_BINDING_CONSTRAINT =
  RIDE_RING_RADIUS === RING_BY_AVENUE
    ? "the entrance avenue passing between two plots"
    : RIDE_RING_RADIUS === RING_BY_SPACING
      ? "clear ground between neighbouring plots"
      : "the minimum length of a radial path";

/** Where each attraction stands. One radius, one step, no exceptions. */
export const RIDE_RING_CENTER: Record<RingRideId, [number, number]> = Object.fromEntries(
  RIDE_RING_ORDER.map((id) => [id, ringPoint(RIDE_SLOT_BEARING[id], RIDE_RING_RADIUS)]),
) as Record<RingRideId, [number, number]>;

export function ringCenterOf(id: RingRideId): [number, number] {
  return RIDE_RING_CENTER[id];
}

/**
 * Every ride's centre is the same distance out. This still takes an id — every
 * caller that used to ask per ride keeps working, and now provably gets the
 * same answer whoever it asks about.
 */
export function ringRadiusOf(_id?: RingRideId): number {
  return RIDE_RING_RADIUS;
}

/** How much clear ground the closest pair of plots actually has between them. */
export const PLOT_CLEAR_GROUND =
  2 * RIDE_RING_RADIUS * Math.sin(HALF_STEP_RAD) - 2 * RIDE_PLOT_RADIUS;

/** And how much the avenue has, either side, where it passes between two plots. */
export const AVENUE_CLEAR_GROUND =
  RIDE_RING_RADIUS * Math.sin(HALF_STEP_RAD) - RIDE_PLOT_RADIUS - AVENUE_WIDTH / 2;

/* ------------------------------------------------------------------ *
 * THE PATHS
 * ------------------------------------------------------------------ */

/**
 * THE RADIAL PATHS — one per ride, all the same length.
 *
 * Each runs from the outer edge of the food court's circular path straight out
 * along its own slot bearing to the edge of that ride's plot, where it meets
 * the ride's entrance. Because the plots are identical and concentric, both
 * ends are at the same two radii for every ride, so equal length is a property
 * of the construction — though `verify-park-structure.ts` measures it anyway.
 *
 * The path does not stop at the plot. The plot itself is paved, so the surface
 * runs continuously from the food court to the machine: a walker never leaves
 * paving between the middle of the park and a ride's boarding steps.
 */
export const RADIAL_PATH_WIDTH = 20;
/*
 * A radial is drawn from the food court path's CENTRE LINE, because that is
 * where the link actually starts and where its junction circle sits — measuring
 * it from the path's outer edge instead reported a length two metres shorter
 * than the thing on the ground.
 */
export const RADIAL_PATH_FROM = FOOD_COURT_PATH_RADIUS;
export const RADIAL_PATH_TO = RIDE_RING_RADIUS - RIDE_PLOT_RADIUS;
export const RADIAL_PATH_LENGTH = RADIAL_PATH_TO - RADIAL_PATH_FROM;

/** Where a ride's radial path leaves the food court's circular path. */
export function radialStart(id: RingRideId): [number, number] {
  return ringPoint(RIDE_SLOT_BEARING[id], FOOD_COURT_PATH_RADIUS);
}

/** Where it arrives: the ride's entrance, on the edge of its plot. */
export function rideEntrance(id: RingRideId): [number, number] {
  return ringPoint(RIDE_SLOT_BEARING[id], RADIAL_PATH_TO);
}

/**
 * THE OUTER CIRCULAR PATH, joining all the ride areas.
 *
 * Its inner edge lies exactly on the outer edge of every plot, so it TOUCHES
 * each one rather than running past it and needing a stub: the plots and the
 * path are one continuous paved surface, and a visitor can walk from any ride
 * round to any other without going back through the middle.
 */
export const OUTER_PATH_WIDTH = 24;
export const OUTER_PATH_RADIUS = RIDE_RING_RADIUS + RIDE_PLOT_RADIUS + OUTER_PATH_WIDTH / 2;

/* ------------------------------------------------------------------ *
 * THE OUTER PARK
 * ------------------------------------------------------------------ */

/** How far the outermost paved ground in the park reaches from the middle. */
export const PARK_PAVED_EDGE = OUTER_PATH_RADIUS + OUTER_PATH_WIDTH / 2;
/** How far the ride areas themselves reach. */
export const RIDE_RING_OUTER_EDGE = RIDE_RING_RADIUS + RIDE_PLOT_RADIUS;

/**
 * THE PERIMETER ROAD — and the railway that used to sit inside it.
 *
 * There was a park railway here: a circle of track between the ride platforms
 * and the road, with its own thirty-metre standoff and a twenty-six metre
 * corridor reserved either side of the rails. The train, its track and its
 * route have been removed from the park at the user's request, so the band
 * they occupied is gone with them and the road has moved in to take it.
 *
 * That is 122 m off the radius of everything outside the ride ring, and the
 * park is smaller for it: the boundary and the main gate came in with the
 * road, because both are placed from it.
 */
export const PERIMETER_ROAD_WIDTH = 26;
export const PERIMETER_ROAD_CLEARANCE = 28;
/** Landscaped ground between the road and the boundary fence. */
export const BOUNDARY_SETBACK = 55;

export const PERIMETER_ROAD_RADIUS =
  PARK_PAVED_EDGE + PERIMETER_ROAD_CLEARANCE + PERIMETER_ROAD_WIDTH / 2;

export const BOUNDARY_RADIUS = PERIMETER_ROAD_RADIUS + PERIMETER_ROAD_WIDTH / 2 + BOUNDARY_SETBACK;

/* ------------------------------------------------------------------ *
 * THE WAY IN
 * ------------------------------------------------------------------ */

/**
 * The single main entrance, at the bottom of the plan and on the park's axis
 * of symmetry. A visitor passes through the gate, crosses the perimeter road,
 * and walks the avenue straight at the food court.
 */
export const GATE_RADIUS = BOUNDARY_RADIUS;
export const GATE_POINT: [number, number] = ringPoint(0, GATE_RADIUS);
/** First step inside — where the concourse ends and the avenue begins. */
export const GATE_INNER_RADIUS = GATE_RADIUS - 50;
/** Where arrivals appear, out on the approach road beyond the gate. */
export const SPAWN_RADIUS = GATE_RADIUS + 170;

/**
 * Nothing — no route, no planting, no ride — comes inside this.
 *
 * The name is the lake's, and the thing is now a food court plaza; it is kept
 * because the journey's route-bending, the planting keep-out and the checks
 * all read it to mean "the middle of the park, which you go round". What it
 * marks has changed from water you cannot cross to a building you walk into,
 * and the ROUTES still bend around it for the same reason: the way from one
 * ride to another is round the food court, not through its dining room.
 */
export const LAKE_CLEARANCE_RADIUS = FOOD_COURT_PLAZA_RADIUS;
