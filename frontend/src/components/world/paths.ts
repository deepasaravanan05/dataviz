import { PARK_LAYOUT, PLAZA_CENTER, PLAZA_RADIUS, rideById } from "@/components/park/layout";
import { RIDE_DEPARTMENTS } from "@/components/park/departments";
import { JOURNEY_EMPLOYEES, rideAnchor } from "@/simulation/journey/journey";
import {
  FOOD_COURT_CENTER,
  FOOD_COURT_FACING,
  FOOD_COURT_DOOR,
  GATE_INNER_Z,
  GATE_X,
  GATE_Z,
  SPAWN_Z,
} from "@/simulation/journey/constants";
import { PROP } from "@/world/scale";

/**
 * The park's pedestrian network.
 *
 * Derived from the journey itself rather than drawn by hand: every link below
 * is a stretch that employees actually walk, taken from the same anchor points
 * their routes are built from. That is what guarantees the paving is under the
 * crowd instead of beside it, and why a path can never be laid somewhere
 * nobody goes — or, worse, somebody left walking across bare grass.
 *
 * Every way is laid at PROP road width. The spine, the ride spurs and the
 * boarding aprons are all the same size, so the network reads as one road
 * system rather than a hierarchy of wide and narrow stretches.
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
 * Paved areas that are not links: the food court terrace and the entrance
 * concourse. People genuinely walk all over these, so they belong in the
 * walkable surface even though no single line describes them.
 */
export interface PathArea {
  center: [number, number];
  halfX: number;
  halfZ: number;
  /** Rotation about +Y, matching the structure the area belongs to. */
  facing: number;
}

const GATE_INNER: [number, number] = [GATE_X, GATE_INNER_Z];
const PLAZA: [number, number] = [...PLAZA_CENTER] as [number, number];

/** Half-width of the largest arrival group in the roster, in metres. */
function widestFanRadius(): number {
  const perRide: Record<string, number> = {};
  for (const e of JOURNEY_EMPLOYEES) perRide[e.rideId] = (perRide[e.rideId] ?? 0) + 1;
  const biggest = Math.max(...Object.values(perRide), 1);
  const columns = Math.max(1, Math.ceil(biggest / 2));
  return ((columns - 1) / 2) * 1.9 + 1.5;
}

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

// The spine: out of the gate and down into the park.
link([GATE_X, GATE_Z], GATE_INNER, PROP.promenadeWidth, true);
link(GATE_INNER, PLAZA, PROP.promenadeWidth, true);
node(GATE_INNER, PROP.promenadeWidth * 0.75);
/*
 * The whole plaza circle is paved ground — it now carries the central
 * fountain, and the walking routes arc around the fountain ON this disc, so
 * the walkable surface (and the planting keep-out) must cover all of it.
 */
node(PLAZA, PLAZA_RADIUS);

// The food court spur, and its link on toward the rides.
link(GATE_INNER, FOOD_COURT_DOOR, PROP.footpathWidth, true);
node(FOOD_COURT_DOOR, PROP.footpathWidth);

/**
 * Open ground kept between any paving and a ride's own footprint.
 *
 * A ride whose apron runs right up to it — or under it — reads as sitting ON
 * the paving rather than standing in the park, and the parts that swing out
 * over the edge appear to pass through the ground. Six units is two employee
 * heights of clear grass, enough to see daylight between the two surfaces from
 * the main camera.
 */
const APRON_RIDE_CLEARANCE = 6;

/*
 * A spur to every attraction, from both the gate and the food court — the two
 * places an employee ever sets off from. Each ends in a waiting apron sized to
 * the fan of people who gather there.
 */
for (const d of RIDE_DEPARTMENTS) {
  const { stand, approach } = rideAnchor(d.rideId);
  const ride = rideById(d.rideId);

  link(GATE_INNER, approach, PROP.footpathWidth, false);
  link(FOOD_COURT_DOOR, approach, PROP.footpathWidth, false);
  link(approach, stand, PROP.footpathWidth, false);

  node(approach, PROP.footpathWidth * 0.9);
  /*
   * THE WAITING APRON, AND WHY IT IS NOT AS BIG AS IT WOULD LIKE TO BE.
   *
   * The apron wants to hold a whole department's arrival fan, so it was sized
   * from the widest fan any department actually produces. Taken on its own that
   * is right, and it produced an apron that reached 24.6u INSIDE the Monster
   * Ride's swept footprint: the paving ran out under the ride and the cups
   * passed straight through it, which is exactly the surface-overlap that had
   * to go. The coaster's apron did the same, 23.4u in.
   *
   * So the fan size is now a wish, and the ride has the veto. The apron is
   * trimmed until its outer edge stops APRON_RIDE_CLEARANCE clear of the ride's
   * own footprint, leaving a band of open grass all the way round every ride —
   * ground, then clear separation, then the ride. Nothing is hidden and nothing
   * moves: the apron is still centred on the same waiting point, still paved in
   * the same material, and simply stops before it reaches the machinery.
   */
  const reach = Math.max(ride.halfX, ride.halfZ);
  const toStand = Math.hypot(stand[0] - ride.center[0], stand[1] - ride.center[1]);
  const wanted = Math.max(16, widestFanRadius() + 6, Math.min(ride.halfX, ride.halfZ) * 0.6);
  const room = toStand - reach - APRON_RIDE_CLEARANCE;
  node(stand, Math.min(wanted, room));
}

export const PATH_LINKS: PathLink[] = links;
export const PATH_NODES: PathNode[] = nodes;

export const PATH_AREAS: PathArea[] = [
  // The food court terrace: 34 x 38 m, centred four metres in front of the hall.
  {
    center: [
      FOOD_COURT_CENTER[0] + Math.sin(FOOD_COURT_FACING) * 4,
      FOOD_COURT_CENTER[1] + Math.cos(FOOD_COURT_FACING) * 4,
    ],
    halfX: 17,
    halfZ: 19,
    facing: FOOD_COURT_FACING,
  },
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
  return best;
}
