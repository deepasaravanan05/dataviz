import { PARK_LAYOUT, PLAZA_CENTER, PLAZA_RADIUS } from "@/components/park/layout";
import {
  AVENUE_WIDTH,
  FOOD_COURT_PATH_OUTER,
  FOOD_COURT_PATH_RADIUS,
  FOOD_COURT_PATH_WIDTH,
  FOOD_COURT_PLAZA_RADIUS,
  OUTER_PATH_RADIUS,
  OUTER_PATH_WIDTH,
  PARK_ORIGIN,
  PERIMETER_ROAD_RADIUS,
  PERIMETER_ROAD_WIDTH,
  RADIAL_PATH_FROM,
  RADIAL_PATH_TO,
  RADIAL_PATH_WIDTH,
  RIDE_PLOT_RADIUS,
  RIDE_RING_CENTER,
  RIDE_RING_ORDER,
  RIDE_SLOT_BEARING,
  RING_RIDE_REACH,
  radialStart,
  rideEntrance,
  ringPoint,
} from "@/components/park/parkRing";
import {
  AVENUE_JOIN,
  GATE_INNER_Z,
  GATE_X,
  GATE_Z,
  SPAWN_Z,
} from "@/simulation/journey/constants";
import { PROP } from "@/world/scale";

/**
 * THE PARK'S PEDESTRIAN NETWORK — radially symmetric, and continuous.
 *
 *   main entrance -> central avenue -> the grand food court
 *                 -> the food court's circular path
 *                 -> one equal radial path per ride
 *                 -> the ride's own circular platform
 *                 -> the outer circular path, joining every ride area
 *
 * WHAT CHANGED. The previous network had one ring path and a spur per ride,
 * but the spurs were different lengths — each ride stood at its own radius —
 * and they stopped at a small apron rather than reaching the machine. Both are
 * now structural rather than incidental:
 *
 *   - EVERY RADIAL IS THE SAME LENGTH, because both of its ends are at fixed
 *     radii: the food court path's outer edge, and the edge of a ride plot
 *     that is identical for every ride.
 *   - NO RADIAL STOPS SHORT. The plot itself is a paved circular platform, so
 *     the surface is continuous from the food court path all the way to the
 *     boarding steps. There is no stretch of grass anywhere on that walk.
 *   - THE PLOTS AND THE OUTER PATH ARE ONE SURFACE. The outer path's inner
 *     edge lies exactly on the plots' outer edge, so it touches all ten
 *     without a single connecting stub.
 *
 * Everything here is DERIVED from `parkRing.ts` rather than drawn: no path in
 * this file has a typed coordinate in it beyond the entrance, which is itself
 * solved from the boundary.
 */

export interface PathLink {
  from: [number, number];
  to: [number, number];
  width: number;
  /** Wider ways get lamps and benches; spurs do not. */
  furnished: boolean;
  /**
   * "paving" is drawn by the paving layer. "road" is the arrival corridor
   * outside the gate, whose carriageway and footways are drawn with the road
   * itself — but which is still walkable ground, so it counts here.
   */
  surface: "paving" | "road";
}

export interface PathNode {
  at: [number, number];
  radius: number;
}

/**
 * A CIRCULAR way, drawn as one annulus rather than as a chain of chords.
 *
 * The outer path is 5.7 km round; chopped into links short enough to look
 * curved that would be several hundred meshes and as many border bands, for a
 * shape `ringGeometry` draws exactly. So circles are their own kind of way
 * here, and everything that consumes the network — the paving, the borders,
 * the lamps, the planting keep-out — handles them alongside the straight links.
 */
export interface PathRing {
  center: [number, number];
  radius: number;
  width: number;
  furnished: boolean;
}

/**
 * A ride's own circular PLATFORM: the paved disc it stands in the middle of.
 *
 * Identical for every attraction, which is the whole point — it is what makes
 * "same platform diameter, same surrounding clearance" true of the plan
 * however differently the ten machines are shaped.
 */
export interface RidePlot {
  id: string;
  center: [number, number];
  radius: number;
  /** Where its radial path arrives, on the inward edge. */
  entrance: [number, number];
  /** Bearing of that entrance from the middle of the park, in degrees. */
  bearingDeg: number;
}

/**
 * Paved areas that are not links: the entrance concourse. People genuinely
 * walk all over these, so they belong in the walkable surface even though no
 * single line describes them.
 */
export interface PathArea {
  center: [number, number];
  halfX: number;
  halfZ: number;
  /** Rotation about +Y, matching the structure the area belongs to. */
  facing: number;
}

const GATE_INNER: [number, number] = [GATE_X, GATE_INNER_Z];

const links: PathLink[] = [];
const nodes: PathNode[] = [];

function link(
  from: [number, number],
  to: [number, number],
  width: number,
  furnished = false,
  surface: "paving" | "road" = "paving",
) {
  links.push({ from, to, width, furnished, surface });
}
function node(at: [number, number], radius: number) {
  nodes.push({ at, radius });
}

/* ------------------------------------------------------------------ *
 * THE CIRCLES
 * ------------------------------------------------------------------ */

export const PATH_RINGS: PathRing[] = [
  /* The perimeter road: the boundary walk, lit and benched. */
  {
    center: [...PARK_ORIGIN] as [number, number],
    radius: PERIMETER_ROAD_RADIUS,
    width: PERIMETER_ROAD_WIDTH,
    furnished: true,
  },
  /* The outer circular path, joining all ten ride areas. */
  {
    center: [...PARK_ORIGIN] as [number, number],
    radius: OUTER_PATH_RADIUS,
    width: OUTER_PATH_WIDTH,
    furnished: true,
  },
  /* The food court's circular path: the spine every radial branches from. */
  {
    center: [...PARK_ORIGIN] as [number, number],
    radius: FOOD_COURT_PATH_RADIUS,
    width: FOOD_COURT_PATH_WIDTH,
    furnished: true,
  },
];

/* ------------------------------------------------------------------ *
 * THE RIDE PLATFORMS
 * ------------------------------------------------------------------ */

export const RIDE_PLOTS: RidePlot[] = RIDE_RING_ORDER.map((id) => ({
  id,
  center: RIDE_RING_CENTER[id],
  radius: RIDE_PLOT_RADIUS,
  entrance: rideEntrance(id),
  bearingDeg: RIDE_SLOT_BEARING[id],
}));

/* ------------------------------------------------------------------ *
 * THE WAY IN
 * ------------------------------------------------------------------ */

/*
 * The arrival corridor outside the gate. Employees appear at the far end and
 * walk in along it, so it is walkable ground even though its surface is drawn
 * with the approach road rather than by the paving layer.
 */
link(
  [GATE_X, GATE_Z],
  [GATE_X, SPAWN_Z + 130],
  PROP.roadLaneWidth * 2 + PROP.footpathWidth * 2 + 8,
  false,
  "road",
);

/*
 * THE CENTRAL AVENUE, straight down the park's axis of symmetry: through the
 * gate, across the perimeter road, between the two plots either side of the
 * axis, over the outer path and on to the food court.
 */
link([GATE_X, GATE_Z], GATE_INNER, AVENUE_WIDTH, true);
link(GATE_INNER, ringPoint(0, FOOD_COURT_PATH_RADIUS), AVENUE_WIDTH, true);
node(GATE_INNER, AVENUE_WIDTH * 0.75);
/* Real junctions where the avenue crosses each circle. */
node(ringPoint(0, FOOD_COURT_PATH_RADIUS), FOOD_COURT_PATH_WIDTH);
node(ringPoint(0, OUTER_PATH_RADIUS), OUTER_PATH_WIDTH * 0.9);
node(ringPoint(0, PERIMETER_ROAD_RADIUS), PERIMETER_ROAD_WIDTH * 0.75);

/*
 * The food court is at the middle of the park now, so the avenue arrives at
 * its door and there is no separate walk out to it. `AVENUE_JOIN` is where the
 * avenue meets the court's own circular path, and it is the point diners set
 * off from again.
 */
node(AVENUE_JOIN, FOOD_COURT_PATH_WIDTH * 0.8);

/* ------------------------------------------------------------------ *
 * THE RADIAL PATHS
 * ------------------------------------------------------------------ */

/**
 * ONE PER RIDE, ALL THE SAME LENGTH, AND NONE OF THEM STOPS SHORT.
 *
 * A radial runs from the food court's circular path out to its ride's entrance
 * on the plot edge; the plot is paved, so the walk continues on to the machine
 * without a break. The junction at each end is a paved circle, so an
 * intersection reads as an intersection rather than as two rectangles
 * crossing.
 */
for (const plot of RIDE_PLOTS) {
  const id = plot.id as (typeof RIDE_RING_ORDER)[number];
  const start = radialStart(id);

  link(start, plot.entrance, RADIAL_PATH_WIDTH, true);
  /* Where the radial leaves the food court's circular path. */
  node(start, FOOD_COURT_PATH_WIDTH * 0.8);
  /* The ride's entrance plaza, where the radial meets the platform. */
  node(plot.entrance, RADIAL_PATH_WIDTH * 1.1);
  /* And the platform itself: one paved disc, the same for every ride. */
  node(plot.center, plot.radius);
}

export const PATH_LINKS: PathLink[] = links;
export const PATH_NODES: PathNode[] = nodes;

export const PATH_AREAS: PathArea[] = [
  // The entrance forecourt and the concourse just inside the gate.
  { center: [GATE_X, GATE_Z + 12], halfX: 33, halfZ: 27, facing: 0 },
  { center: [GATE_X, GATE_Z - 16], halfX: 21, halfZ: 17, facing: 0 },
];

/** Signed distance to an oriented rectangle; negative inside. */
function areaDistance(x: number, z: number, a: PathArea): number {
  const c = Math.cos(-a.facing);
  const s = Math.sin(-a.facing);
  const dx = x - a.center[0];
  const dz = z - a.center[1];
  const lx = dx * c + dz * s;
  const lz = -dx * s + dz * c;
  const ox = Math.abs(lx) - a.halfX;
  const oz = Math.abs(lz) - a.halfZ;
  if (ox <= 0 && oz <= 0) return Math.max(ox, oz);
  return Math.hypot(Math.max(ox, 0), Math.max(oz, 0));
}

/** Shortest distance from a point to any walkable surface. Used to keep planting off the paths. */
export function distanceToPaving(x: number, z: number): number {
  let best = Infinity;

  /* The food court's own plaza is paved from the middle out to its edge. */
  best = Math.min(
    best,
    Math.hypot(x - PARK_ORIGIN[0], z - PARK_ORIGIN[1]) - FOOD_COURT_PLAZA_RADIUS,
  );

  for (const r of PATH_RINGS) {
    const d = Math.abs(Math.hypot(x - r.center[0], z - r.center[1]) - r.radius) - r.width / 2;
    best = Math.min(best, d);
  }
  for (const n of PATH_NODES) {
    best = Math.min(best, Math.hypot(x - n.at[0], z - n.at[1]) - n.radius);
  }
  for (const a of PATH_AREAS) {
    best = Math.min(best, areaDistance(x, z, a));
  }
  for (const l of PATH_LINKS) {
    const ax = l.from[0];
    const az = l.from[1];
    const dx = l.to[0] - ax;
    const dz = l.to[1] - az;
    const len2 = dx * dx + dz * dz;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / len2));
    const d = Math.hypot(x - (ax + t * dx), z - (az + t * dz)) - l.width / 2;
    best = Math.min(best, d);
  }
  return best;
}

/** Ride footprints, for the same purpose. */
export function distanceToRide(x: number, z: number): number {
  let best = Infinity;
  for (const r of PARK_LAYOUT) {
    best = Math.min(
      best,
      Math.hypot(Math.max(r.minX - x, 0, x - r.maxX), Math.max(r.minZ - z, 0, z - r.maxZ)),
    );
  }
  /* And the five attractions that are not in the layout, on the same ring. */
  for (const id of RIDE_RING_ORDER) {
    const c = RIDE_RING_CENTER[id];
    best = Math.min(best, Math.max(0, Math.hypot(x - c[0], z - c[1]) - RING_RIDE_REACH[id]));
  }
  return best;
}

/** How far a point is outside every ride PLATFORM. Negative when it is on one. */
export function distanceToPlot(x: number, z: number): number {
  let best = Infinity;
  for (const p of RIDE_PLOTS) {
    best = Math.min(best, Math.hypot(x - p.center[0], z - p.center[1]) - p.radius);
  }
  return best;
}

/** The paved circle in the middle, kept for anything that asks about the plaza. */
export const PLAZA = { center: PLAZA_CENTER, radius: PLAZA_RADIUS };

/** Where every radial path starts and ends. One span, for all of them. */
export const RADIAL_PATH_SPAN = {
  from: RADIAL_PATH_FROM,
  to: RADIAL_PATH_TO,
  outerEdgeOfCourtPath: FOOD_COURT_PATH_OUTER,
};
