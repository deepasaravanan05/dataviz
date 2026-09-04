import type { DepartmentRideId } from "@/components/park/departments";
import { rideById, rideScale } from "@/components/park/layout";
import {
  PLATFORM_ALONG as GIGA_PLATFORM_ALONG,
  PLATFORM_CENTER as GIGA_PLATFORM_CENTER,
  PLATFORM_OUTWARD as GIGA_PLATFORM_OUTWARD,
  PLATFORM_Y as GIGA_PLATFORM_Y,
  stationFlight,
} from "@/components/giga-coaster/station";
import {
  PLATFORM_HALF_LENGTH as GIGA_PLATFORM_HALF_ALONG,
  PLATFORM_WIDTH as GIGA_PLATFORM_WIDTH,
} from "@/components/giga-coaster/constants";
import {
  GONDOLA_HEIGHT as MONSTER_GONDOLA_HEIGHT,
  GONDOLA_RADIUS as MONSTER_GONDOLA_RADIUS,
  SEAT_SURFACE_Y as MONSTER_SEAT_SURFACE_Y,
} from "@/components/monster-ride/constants";
import { GATE_X, GATE_Z } from "./constants";
import {
  BOARD_REACH,
  DEPARTMENT_RIDE_IDS,
  PLATFORM_SEATS,
  boardingSeats,
  ridePeriodSeconds,
  rideSeatCount,
  seatPose,
} from "./rideKinematics";
import { EMPLOYEE_HEIGHT, EMPLOYEE_SCALE, HUMAN, PROP } from "@/world/scale";

/**
 * THE BOARDING STAIR: how a person actually gets off the ground and into a
 * ride seat.
 *
 * Every department ride in this park loads above head height — the Monster
 * Ride's tubs sit 2.4 m up, the Drop Tower's seats 3.0 m, the Ferris Wheel's
 * cabins 3.6 m, the coaster's cars 4.2 m, and the Dragon Swing Ship's open deck
 * hangs 22.5 m under a 30 m pivot. Employees used to reach them by walking to
 * the ground beneath their seat and rising into it, which is not boarding; it
 * is levitating.
 *
 * So each ride is given its own stair: a real flight of steps up to a real
 * boarding deck beside its seats, with handrails, landings where the climb is
 * too tall for one flight, and a queue line at the foot of it. Employees walk
 * to the queue, take their turn one at a time, climb the steps, cross the deck
 * and step into their seat.
 *
 * EVERY NUMBER IS SOLVED, NOT PLACED. A stair's height comes from the seats it
 * serves, its position from where those seats stand when the ride is at rest,
 * its direction from the shape of the ride's own seat sweep, and its step
 * dimensions from the size of the people using it. Nothing in any ride module
 * is read for anything except geometry, and nothing in any ride module is
 * changed: the stairs are drawn in world space beside the rides, exactly as the
 * gate and the food court are.
 */

/* ------------------------------------------------------------------ */
/* Step dimensions                                                     */
/* ------------------------------------------------------------------ */

/**
 * A real staircase, at the size of the people who climb it.
 *
 * Every dimension below is the real one, multiplied by `EMPLOYEE_SCALE` so it
 * always fits the figure that climbs it. With employees drawn at a person's
 * actual height that multiplier is essentially one, so these ARE building
 * dimensions: an ordinary stair of 185 mm rise on a 288 mm going — a pitch of
 * 33 degrees — 0.9 m wide with a 1.08 m handrail.
 */
/*
 * WIDENED AND SPACED OUT FOR LEGIBILITY, without changing the climb.
 *
 * At 185 mm on a 288 mm going, 0.9 m wide, these were correct building stairs
 * and completely illegible from the camera the park is actually viewed from —
 * a hairline against the grass. The rise and the going are both up by the same
 * 14%, so the PITCH is unchanged to three decimal places and the climb
 * animation, which was authored against it, still lands on every tread; the
 * steps are simply further apart and read as individual steps.
 *
 * The width is no longer "one person and no wider". One employee on a stair at
 * a time is enforced by the simulation, not by how much room there is, so the
 * width is free to be what a real theme-park access stair is — a shade under
 * 1.5 m, wide enough that the treads read as treads.
 */
export const STAIR_RISE = 0.205 * EMPLOYEE_SCALE;
export const STAIR_GOING = 0.32 * EMPLOYEE_SCALE;
export const STAIR_WIDTH = HUMAN.shoulderWidth * EMPLOYEE_SCALE * 3.5;
export const STAIR_RAIL_HEIGHT = PROP.railHeight * EMPLOYEE_SCALE;
export const STAIR_PITCH = Math.atan2(STAIR_RISE, STAIR_GOING);

/** The tallest single flight before a landing breaks the climb. */
export const MAX_FLIGHT_RISE = 4.5;
/** Depth of a landing, and the lateral gap between the two switchback lanes. */
export const LANDING_DEPTH = STAIR_WIDTH;

/**
 * How many people can climb ABREAST, and where each of them walks.
 *
 * An employee must never be held up by another employee — not by a group, not
 * by a cabin, and not by the person in front of them on the steps. A stair a
 * shade under three metres wide does not need them to queue: it is three
 * shoulders across, so three can go up side by side, each in their own lane,
 * and a fourth follows whoever is furthest up the flight.
 *
 * The lanes are derived rather than chosen — as many as fit at a full shoulder
 * width — and the outermost walker's shoulder still falls inside the handrail:
 * at three lanes the pitch is 0.99 u against a 0.85 u shoulder, which puts them
 * 1.42 u from the centre line of a stair that is 1.49 u to the rail.
 */
export const CLIMB_LANES = Math.max(
  1,
  Math.floor(STAIR_WIDTH / (HUMAN.shoulderWidth * EMPLOYEE_SCALE)),
);

/** How far across the flight lane `i` walks, measured along `stair.along`. */
export function climbLaneOffset(index: number): number {
  const pitch = STAIR_WIDTH / CLIMB_LANES;
  return (index - (CLIMB_LANES - 1) / 2) * pitch;
}

/**
 * The top of the stair in a given lane — where a climber steps onto the deck,
 * and where somebody going down steps back onto the treads.
 *
 * The head has to be the LANE's head rather than one shared point, or two
 * people setting off down the steps a second apart leave from the same spot and
 * are inside one another until the lanes have opened out. It is the deck that
 * lets this be free: a boarding deck is metres deep, so the walk across it ends
 * wherever on the top step that employee is going to use.
 *
 * The FOOT is a lane's own foot for anybody coming DOWN, for the same reason at
 * the other end — two people who reach the ground a second apart would
 * otherwise land on the same paving stone. Going up it is the one point they
 * share: the walk in is solved before the schedule knows which lane will be
 * free, so everybody arrives at the middle of the bottom step and fans out onto
 * the treads from there.
 */
/**
 * THE PATH ONE LANE OF A STAIRCASE WALKS, foot to head.
 *
 * A lane is the side of the steps somebody keeps to, and a staircase turns, so
 * the offset has to be measured across the way the stair is GOING at each
 * point: across the treads on a flight, and across the depth of a landing where
 * the path runs the other way. Holding it in one fixed direction worked on the
 * flights and cancelled out on the landings, where two people in different
 * lanes ended up walking through one another rounding the turn.
 *
 * The side is pinned to the staircase and not to the walker — `keep` is a
 * direction parallel to none of the four the path takes, so a lane is the same
 * side of the corridor on every flight, going up and coming down alike, and two
 * people who pass are always on opposite sides of the steps.
 *
 * This is the one definition of it: the routes are built from it and
 * `verify-boarding` measures against it.
 */
export function stairLanePath(stair: BoardingStair, lane: number): Point3[] {
  const across = climbLaneOffset(lane);
  const keep: [number, number] = [
    (stair.along[0] + stair.outward[0]) / Math.SQRT2,
    (stair.along[1] + stair.outward[1]) / Math.SQRT2,
  ];
  /*
   * The side is taken from the nearest LEVEL move — the tread or landing the
   * point belongs to — looking backwards first and forwards only at the start
   * of a run. That is what keeps a riser a riser: both ends of it take their
   * side from the same flight, so the lane never turns a step into a diagonal
   * through it. Where the stair does turn, the side turns with it, and it turns
   * across a landing, which is level.
   */
  const runs = stair.path.map((_, i) => {
    if (i === 0) return null;
    const dx = stair.path[i][0] - stair.path[i - 1][0];
    const dz = stair.path[i][2] - stair.path[i - 1][2];
    const len = Math.hypot(dx, dz);
    return len < 1e-9 ? null : ([dx / len, dz / len] as [number, number]);
  });
  const sideOf = (i: number): [number, number] => {
    let run: [number, number] | null = null;
    for (let k = i; k >= 1 && !run; k--) run = runs[k];
    for (let k = i + 1; k < runs.length && !run; k++) run = runs[k];
    if (!run) return [stair.along[0], stair.along[1]];
    /* A quarter turn from the way it is going, faced the same way every time. */
    let px = -run[1];
    let pz = run[0];
    if (px * keep[0] + pz * keep[1] < 0) {
      px = -px;
      pz = -pz;
    }
    return [px, pz];
  };
  return stair.path.map((p, i) => {
    const side = sideOf(i);
    return [p[0] + side[0] * across, p[1], p[2] + side[1] * across] as Point3;
  });
}

/**
 * How far somebody in this lane actually walks, foot of the stair to the deck.
 *
 * `climbLength` is the centre line's, and a lane is a few centimetres longer:
 * it takes the same treads but crosses each landing on its own side, and going
 * UP it starts with the stride across the bottom step from the middle, where
 * the walk in delivered them, to the side they are going up. The climb has to
 * be timed against the line the employee is on, or the same declared climbing
 * pace produces a slightly different one — which is exactly what
 * `verify-journey` measures leg by leg.
 */
export function stairLaneLength(stair: BoardingStair, lane: number, fromMiddle: boolean): number {
  const path = stairLanePath(stair, lane);
  let total = fromMiddle
    ? Math.hypot(path[0][0] - stair.path[0][0], path[0][2] - stair.path[0][2])
    : 0;
  for (let i = 1; i < path.length; i++) {
    total += Math.hypot(
      path[i][0] - path[i - 1][0],
      path[i][1] - path[i - 1][1],
      path[i][2] - path[i - 1][2],
    );
  }
  return total;
}

export function stairFoot(stair: BoardingStair, lane: number): [number, number] {
  const first = stairLanePath(stair, lane)[0];
  return [first[0], first[2]];
}

export function stairHead(stair: BoardingStair, lane: number): [number, number, number] {
  const path = stairLanePath(stair, lane);
  const head = path[path.length - 1];
  return [head[0], head[1], head[2]];
}
export const LANE_GAP = 0.25;

/** Standing room on the boarding deck, measured outward from the seats. */
export const DECK_DEPTH = 1.6 * EMPLOYEE_SCALE;
/** Clear air between the seats at rest and the near edge of the deck. */
export const DECK_SEAT_GAP = 0.6 * EMPLOYEE_SCALE;
/**
 * How close any seat may come to the boarding deck while the ride is RUNNING.
 *
 * A platform beside a stopped ride is one thing; a platform in the path of a
 * moving one is a different thing entirely. The deck is pushed outward until
 * nothing the ride carries passes within this of it — which is what puts the
 * Monster Ride's deck outside its arms' sweep instead of under them, while
 * leaving the Ferris Wheel's tucked against the rim, where the cabins never go.
 */
export const SWEEP_CLEARANCE = 0.6 * EMPLOYEE_SCALE;

/** How far the deck may be pushed out before the search gives up. */
export const DECK_SEARCH_CAP = 14;

/**
 * THE BODY A SEAT RIDES INSIDE, for rides that have one.
 *
 * The sweep tests here were written against seat CENTRES, which is the right
 * answer only for a ride whose seats are the widest thing on it. The Monster
 * Ride's are nowhere near: each seat sits inside a tub 4.9u in radius whose
 * floor hangs 1.4u below the seat, so a deck that cleared every seat centre
 * still had whole tubs passing through it — a brown platform visibly cutting
 * through the cups.
 *
 * `radius` is how far the body reaches around its seat, `floorDrop` how far
 * its underside hangs below the seat. A ride whose seats are open — the Dragon
 * Ship's deck, the Drop Tower's ring, the coaster's cars, the Ferris Wheel's
 * cabins, none of which ever pass over their own platform — declares nothing
 * and is left exactly as it was.
 */
interface SeatBody {
  radius: number;
  floorDrop: number;
}

const SEAT_BODY: Partial<Record<DepartmentRideId, SeatBody>> = {
  monster: {
    /* Tub radius plus the seat's own 44% offset from the tub's centre. */
    radius: MONSTER_GONDOLA_RADIUS * 1.44 * rideScale("monster"),
    floorDrop: (MONSTER_SEAT_SURFACE_Y + MONSTER_GONDOLA_HEIGHT / 2) * rideScale("monster"),
  },
};
/**
 * How many seats one boarding deck presents.
 *
 * A CEILING, NEVER A FLOOR. One employee is enough to board and enough to send
 * a ride away; this is only how many people can be got aboard before the deck
 * runs out of seats within a stride of it. Every extra seat drags the deck
 * further across the ride — the Monster Ride's tubs are twelve metres apart, so
 * a sixth seat means spanning a third tub — and anyone who does not fit rides
 * the next dispatch.
 *
 * Each ride keeps its own 40-seat capacity. This is the subset of it that a
 * STOPPED ride puts at platform level, which is a fact about the geometry
 * rather than a rule about boarding.
 *
 * IT IS DECLARED IN `rideKinematics.ts` and re-exported here, unchanged, so
 * that every importer keeps working. It moved because the seat-window solver
 * over there now has to know it: a deck built to serve ten seats has to be
 * allowed to reach ten seats.
 */
export { PLATFORM_SEATS } from "./rideKinematics";

/** Deck margin beyond the outermost seat it serves, along the deck's length. */
export const DECK_END_MARGIN = 0.8 * EMPLOYEE_SCALE;
/**
 * The furthest a seat may be from the edge of the deck that serves it — a step
 * across from a platform into a car, at the size of the person taking it.
 */
export const MAX_DECK_REACH = 0.6 * EMPLOYEE_HEIGHT;
/** However deep a loading apron has to get, it stops here. */
export const DECK_MAX_HALF_OUT = 22;

/** How far apart people stand in the boarding queue. */
export const QUEUE_PITCH = HUMAN.queueSpacing * EMPLOYEE_SCALE * 1.6;
/** How far the head of the queue stands back from the first step. */
export const QUEUE_STANDOFF = 1.4 * EMPLOYEE_SCALE;

/**
 * Climbing pace, as a fraction of the walking pace.
 *
 * Stairs are slower than level ground — the usual planning figure is about half
 * — and this is what makes the climb read as a climb rather than as a walk that
 * happens to go up. It is a fraction of each employee's OWN pace, so somebody
 * hurrying to their ride still takes the steps faster than somebody strolling.
 */
export const CLIMB_PACE_FRACTION = 0.45;

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type Point3 = readonly [number, number, number];

/** One straight flight of steps. */
export interface StairFlight {
  /** Foot of the flight — the ground, or the landing below it. */
  from: Point3;
  /** Head of the flight — the landing above it, or the boarding deck. */
  to: Point3;
  steps: number;
}

export interface BoardingStair {
  rideId: DepartmentRideId;
  /** The seats this stair serves, in the order the deck presents them. */
  seats: number[];
  /** Unit direction from the ride's seats out to the deck, in world x/z. */
  outward: readonly [number, number];
  /** Along the deck, at right angles to `outward`. */
  along: readonly [number, number];
  /** Height of the boarding deck: level with the lowest seat it serves. */
  deckY: number;
  /** Where the deck WOULD sit if nothing swept over it — see the duck below. */
  levelledDeckY: number;
  /** Centre of the deck, in world x/z. */
  deck: readonly [number, number];
  deckHalfAlong: number;
  deckHalfOut: number;
  /** Foot of the first step, in world x/z. */
  base: readonly [number, number];
  flights: StairFlight[];
  /** Landing slabs between flights, centre and half-extents in world x/z. */
  landings: { at: Point3 }[];
  /** Total 3D length of the climb, deck included. */
  climbLength: number;
  /** The path a climber walks, foot of the stair to the middle of the deck. */
  path: Point3[];
  /** Where people queue, nearest the steps first. */
  queue: (readonly [number, number])[];
}

/* ------------------------------------------------------------------ */
/* Solving one ride's stair                                            */
/* ------------------------------------------------------------------ */

const dot = (a: readonly [number, number], b: readonly [number, number]) => a[0] * b[0] + a[1] * b[1];

/**
 * The direction in which a ride's seats sweep LEAST.
 *
 * Some rides load at a point that is right over their own centre — the Ferris
 * Wheel's lowest cabin and the Dragon Ship's deck both are — so "outward from
 * the middle of the ride" says nothing about which side a stair belongs on.
 * For those, the answer is the direction the machine is thinnest in, which is
 * exactly what a real fairground does: a wheel is boarded from the side of its
 * rim, a swinging ship from beside its hull, never from in front of the arc.
 *
 * Found from the covariance of every seat's position over a full ride cycle:
 * the eigenvector of the smaller eigenvalue is the thin axis. Solved, so it
 * cannot be wrong about a ride it has never been checked against.
 */
/**
 * Every place a seat is, over one full cycle of the ride — sampled once and
 * kept, because both the thin-axis solve and the deck-clearance solve want the
 * same set and a seat transform is not cheap.
 */
/*
 * HOW WIDELY THE SWEEP IS SAMPLED, and why one period is not enough.
 *
 * A ride's declared period is the period of its DISPATCH cycle, not of every
 * motion it makes. The Monster Ride turns its hub, spins each spider and rocks
 * each arm at three rates that share no common multiple, so one period of it
 * leaves whole bearings that no seat ever visits in the sample — including, as
 * it happened, the bearing the boarding deck stands on. The deck was then
 * declared clear of a sweep it was standing in the middle of.
 *
 * Sampling a long, fixed window instead covers every ride's slowest motion
 * several times over: the Monster Ride's hub takes 29s to come round, so 120s
 * is four revolutions of it, and the sample is dense enough that a seat cannot
 * step over a deck between two samples.
 */
const SWEEP_SAMPLES = 48;
/** Seconds of motion each ride is swept over, whatever it calls its period. */
const SWEEP_WINDOW_SECONDS = 120;
/** Samples per second of that window, per seat. */
const SWEEP_RATE = 4;
const SWEPT: Partial<Record<DepartmentRideId, { x: number; y: number; z: number }[]>> = {};

function sweptSeats(rideId: DepartmentRideId): { x: number; y: number; z: number }[] {
  const cached = SWEPT[rideId];
  if (cached) return cached;
  const period = ridePeriodSeconds(rideId);
  const window = Math.max(period, SWEEP_WINDOW_SECONDS);
  const steps = Math.max(SWEEP_SAMPLES, Math.round(window * SWEEP_RATE));
  const out: { x: number; y: number; z: number }[] = [];
  for (let i = 0; i < rideSeatCount(rideId); i++) {
    for (let k = 0; k < steps; k++) {
      const p = seatPose(rideId, i, (k / steps) * window);
      out.push({ x: p.x, y: p.y, z: p.z });
    }
  }
  SWEPT[rideId] = out;
  return out;
}

function thinAxis(rideId: DepartmentRideId): readonly [number, number] {
  const swept = sweptSeats(rideId);
  const xs = swept.map((p) => p.x);
  const zs = swept.map((p) => p.z);
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const mz = zs.reduce((a, b) => a + b, 0) / n;
  let cxx = 0;
  let czz = 0;
  let cxz = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dz = zs[i] - mz;
    cxx += dx * dx;
    czz += dz * dz;
    cxz += dx * dz;
  }
  cxx /= n;
  czz /= n;
  cxz /= n;

  /* Smaller eigenvalue of the symmetric 2x2, and its eigenvector. */
  const tr = cxx + czz;
  const det = cxx * czz - cxz * cxz;
  const disc = Math.max(0, (tr * tr) / 4 - det);
  const small = tr / 2 - Math.sqrt(disc);
  let vx: number;
  let vz: number;
  if (Math.abs(cxz) > 1e-9) {
    vx = small - czz;
    vz = cxz;
  } else {
    /* Already axis-aligned: the thin axis is whichever has less variance. */
    vx = cxx <= czz ? 1 : 0;
    vz = cxx <= czz ? 0 : 1;
  }
  const len = Math.hypot(vx, vz) || 1;
  return [vx / len, vz / len];
}

/**
 * Which seats one dispatch loads, and therefore which the deck must reach.
 *
 * A stopped ride presents its seats at a range of heights — the Ferris Wheel's
 * rim curves away from the platform, the coaster's train stretches out of its
 * station — and a boarding deck is one level. So the seats served are the ones
 * within a step of the lowest, and never fewer than a full boarding group.
 */
export const DECK_SEAT_SPREAD = 0.9 * EMPLOYEE_HEIGHT;

function deckSeats(
  rideId: DepartmentRideId,
  minimum: number,
  outward: readonly [number, number],
): number[] {
  const all = boardingSeats(rideId);
  const lowest = seatPose(rideId, all[0], 0).y;
  const level = all.filter((i) => seatPose(rideId, i, 0).y <= lowest + DECK_SEAT_SPREAD);
  const pool = level.length >= minimum ? level : all;
  const want = Math.max(1, Math.min(minimum, pool.length));

  /*
   * A CLUSTER ON THE DECK'S OWN SIDE, not merely the N lowest.
   *
   * Two things decide which seats a deck serves. It has to be able to REACH
   * them, so they must be near one another — the Monster Ride's tubs all rest
   * at the same height but sit on opposite sides of a nine-metre spider, and
   * the five lowest could be twenty metres apart. And it has to be able to
   * STAND somewhere, so the cluster is anchored on the seat furthest towards
   * the side the deck is on; loading the Dragon Ship from the middle of its
   * deck would put the platform where the other four seat columns swing.
   */
  const anchorId = pool.reduce((best, i) => {
    const p = seatPose(rideId, i, 0);
    const q = seatPose(rideId, best, 0);
    return p.x * outward[0] + p.z * outward[1] > q.x * outward[0] + q.z * outward[1] ? i : best;
  }, pool[0]);
  /*
   * Grown one seat at a time, each time taking whichever seat is nearest to the
   * group ALREADY chosen rather than to the anchor. Measuring from the anchor
   * alone leaves two seats equidistant on opposite sides of a spider and takes
   * one of each, spreading the deck over three tubs; growing from the set fills
   * the tub it has started before crossing to the next one.
   */
  const chosen = [anchorId];
  const rest = pool.filter((i) => i !== anchorId);
  while (chosen.length < want && rest.length > 0) {
    let bestAt = 0;
    let bestD = Infinity;
    for (let k = 0; k < rest.length; k++) {
      const p = seatPose(rideId, rest[k], 0);
      let d = Infinity;
      for (const c of chosen) {
        const q = seatPose(rideId, c, 0);
        d = Math.min(d, Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z));
      }
      if (d < bestD - 1e-9) {
        bestD = d;
        bestAt = k;
      }
    }
    chosen.push(rest.splice(bestAt, 1)[0]);
  }
  return chosen;
}

/**
 * Break a rise into flights no taller than MAX_FLIGHT_RISE, as evenly as the
 * step height allows. A short climb is one straight flight; a tall one becomes
 * a switchback with landings, which is both what a real stair tower looks like
 * and what keeps a twenty-two metre climb from needing a thirty-five metre run.
 */
function splitFlights(totalSteps: number): number[] {
  const maxSteps = Math.max(1, Math.floor(MAX_FLIGHT_RISE / STAIR_RISE));
  const flights = Math.max(1, Math.ceil(totalSteps / maxSteps));
  const base = Math.floor(totalSteps / flights);
  const extra = totalSteps - base * flights;
  return Array.from({ length: flights }, (_, i) => base + (i < extra ? 1 : 0));
}

/**
 * The nearest the deck can stand to the seats without a running ride sweeping
 * through it, tested against every seat at every point of the ride's cycle.
 *
 * The band checked vertically is the deck plus the height of a person standing
 * on it, because it is the PEOPLE the machine must not hit, not the slab.
 */
function solveDeckOffset(
  rideId: DepartmentRideId,
  centroid: readonly [number, number],
  outward: readonly [number, number],
  along: readonly [number, number],
  halfAlong: number,
  halfOut: number,
  deckY: number,
  minOffset: number,
): number {
  const lowY = deckY - SWEEP_CLEARANCE;
  const highY = deckY + HUMAN.height * EMPLOYEE_SCALE;

  /* Every place a seat ever is, in the deck's own frame, at deck level. */
  const swept: { a: number; o: number }[] = [];
  for (const p of sweptSeats(rideId)) {
    if (p.y < lowY || p.y > highY) continue;
    const dx = p.x - centroid[0];
    const dz = p.z - centroid[1];
    swept.push({ a: dx * along[0] + dz * along[1], o: dx * outward[0] + dz * outward[1] });
  }

  for (let off = minOffset; off <= minOffset + DECK_SEARCH_CAP; off += 0.25) {
    const clear = swept.every((s) => {
      const da = Math.max(0, Math.abs(s.a) - halfAlong);
      const doo = Math.max(0, Math.abs(s.o - off) - halfOut);
      return Math.hypot(da, doo) >= SWEEP_CLEARANCE;
    });
    if (clear) return off;
  }
  /* Nothing inside the cap is clear — stand it as far out as allowed and let
     verify-boarding report the shortfall rather than hiding it. */
  return minOffset + DECK_SEARCH_CAP;
}

/**
 * THE GIGA COASTER BOARDS THROUGH ITS OWN STATION.
 *
 * Every other department ride had to be given a deck, because none of them had
 * one: a wheel, a swinging ship, a spider and a pendulum are all boarded off
 * the ground, and the platform beside them is this park's addition. The Giga
 * Coaster is the exception. It was built with a real station — boards level
 * with the car floor, running the length of the train, a canopy over them and
 * one straight flight of the park's own step up — because a coaster is loaded
 * that way, and it had that station long before anybody rode it.
 *
 * Solving a second platform to stand beside the first would have put two decks
 * at slightly different heights forty metres apart on the same straight. So
 * this reads the station instead, and the whole train is boardable: the
 * platform is longer than the train, so every one of the thirty-two seats has
 * boards beside it.
 *
 * The step geometry is still the park's — the rise, going and width come from
 * this module and are handed to `stationFlight`, which is also what
 * `Station.tsx` draws from — so the treads an employee climbs are the treads
 * on screen.
 */
function gigaStationStair(): BoardingStair {
  const rideId: DepartmentRideId = "giga";
  const flight = stationFlight(STAIR_RISE, STAIR_GOING, STAIR_WIDTH);
  const outward = GIGA_PLATFORM_OUTWARD;
  const along = GIGA_PLATFORM_ALONG;
  const deck = GIGA_PLATFORM_CENTER;

  /*
   * WHICH SEATS THE BOARDS REACH: the sixteen on the platform side.
   *
   * The station is single-sided, as a coaster station is, so a rider steps
   * across into the seat beside the boards. The far seat of each row is on the
   * other side of the car — up to 6.3 u away, which is a scramble across
   * somebody else's lap rather than a step — so the boards do not offer it.
   *
   * The rule is the park's own reach, `BOARD_REACH`: a seat is served when
   * getting into it from the nearest place on the boards is a step up rather
   * than a climb. That admits exactly the sixteen near-side seats, which is
   * three times the busiest day DevOps ever has.
   *
   * Ordered along the platform, front of the train to the back, which is the
   * order the boards present them in and the order a dispatch fills them.
   */
  const alongOf = (i: number) => {
    const p = seatPose(rideId, i, 0);
    return (p.x - deck[0]) * along[0] + (p.z - deck[1]) * along[1];
  };
  const outOf = (i: number) => {
    const p = seatPose(rideId, i, 0);
    return (p.x - deck[0]) * outward[0] + (p.z - deck[1]) * outward[1];
  };
  const halfOut = GIGA_PLATFORM_WIDTH / 2;
  const seats = Array.from({ length: rideSeatCount(rideId) }, (_, i) => i)
    .filter((i) => {
      const p = seatPose(rideId, i, 0);
      /* The step from the nearest boards to the seat: across, and up. */
      const across = Math.max(0, Math.abs(outOf(i)) - halfOut + 0.35);
      return Math.hypot(across, p.y - GIGA_PLATFORM_Y) <= BOARD_REACH;
    })
    .sort((a, b) => alongOf(a) - alongOf(b) || a - b);

  const foot: Point3 = [flight.foot[0], 0, flight.foot[1]];
  const head: Point3 = [flight.head[0], GIGA_PLATFORM_Y, flight.head[1]];
  const flights: StairFlight[] = [{ from: foot, to: head, steps: flight.steps }];

  /*
   * UP THE TREADS, then along the boards to the middle of them.
   *
   * Riser then tread, exactly as `solveBoardingStair` walks its own flights and
   * exactly as `Station.tsx` draws these: a climber's feet land ON each step
   * rather than gliding up a ramp through the middle of the staircase.
   */
  const path: Point3[] = [foot];
  const runX = (head[0] - foot[0]) / flight.steps;
  const runZ = (head[2] - foot[2]) / flight.steps;
  for (let k = 0; k < flight.steps; k++) {
    const y = flight.stepRise * (k + 1);
    /* Up the riser, at the near edge of the tread... */
    path.push([foot[0] + runX * k, y, foot[2] + runZ * k]);
    /* ...then along the tread, to its far edge. */
    path.push([foot[0] + runX * (k + 1), y, foot[2] + runZ * (k + 1)]);
  }
  path.push([deck[0], GIGA_PLATFORM_Y, deck[1]]);

  let climbLength = 0;
  for (let i = 1; i < path.length; i++) {
    climbLength += Math.hypot(
      path[i][0] - path[i - 1][0],
      path[i][1] - path[i - 1][1],
      path[i][2] - path[i - 1][2],
    );
  }

  /* The queue runs back from the bottom step, away from the platform. */
  const back: readonly [number, number] = [
    foot[0] - head[0],
    foot[2] - head[2],
  ];
  const backLen = Math.hypot(back[0], back[1]) || 1;
  const queueDir: readonly [number, number] = [back[0] / backLen, back[1] / backLen];
  const base: readonly [number, number] = [foot[0], foot[2]];
  const queue = Array.from({ length: seats.length }, (_, i) => {
    const away = QUEUE_STANDOFF + i * QUEUE_PITCH;
    return [base[0] + queueDir[0] * away, base[1] + queueDir[1] * away] as const;
  });

  return {
    rideId,
    seats,
    outward,
    along,
    deckY: GIGA_PLATFORM_Y,
    levelledDeckY: GIGA_PLATFORM_Y,
    deck,
    deckHalfAlong: GIGA_PLATFORM_HALF_ALONG,
    deckHalfOut: GIGA_PLATFORM_WIDTH / 2,
    base,
    flights,
    landings: [],
    climbLength,
    path,
    queue,
  };
}

export function solveBoardingStair(
  rideId: DepartmentRideId,
  seatsPerDeck: number,
): BoardingStair {
  /*
   * Which side the deck goes on, decided before which seats it serves — the
   * two depend on one another, and the SIDE is the one that can be settled
   * from the ride alone.
   */
  const centre = rideById(rideId).center;
  const all = boardingSeats(rideId);
  const ax = all.reduce((a, i) => a + seatPose(rideId, i, 0).x, 0) / all.length;
  const az = all.reduce((a, i) => a + seatPose(rideId, i, 0).z, 0) / all.length;
  const rx = ax - centre[0];
  const rz = az - centre[1];
  const radial = Math.hypot(rx, rz);
  let outward: readonly [number, number];
  if (radial > 2) {
    outward = [rx / radial, rz / radial];
  } else {
    /* Loaded over its own centre: board from the ride's thin side, on
       whichever of the two faces looks towards the main gate. */
    const thin = thinAxis(rideId);
    const toGate: [number, number] = [GATE_X - ax, GATE_Z - az];
    outward = dot(thin, toGate) >= 0 ? thin : [-thin[0], -thin[1]];
  }
  const along: readonly [number, number] = [-outward[1], outward[0]];

  const seats = deckSeats(rideId, seatsPerDeck, outward);
  const poses = seats.map((i) => seatPose(rideId, i, 0));
  const cx = poses.reduce((a, p) => a + p.x, 0) / poses.length;
  const cz = poses.reduce((a, p) => a + p.z, 0) / poses.length;
  /*
   * The deck sits MIDWAY BETWEEN THE HIGHEST AND LOWEST seat it serves, not at
   * the lowest and not at their mean.
   *
   * Nobody ever leaves a ride now, so a platform has to present a seat for
   * every employee that ride will take all day — ten of them on the Ferris
   * Wheel, whose cabins curve away from the platform as the rim rises. What
   * matters about a deck is therefore its WORST seat, not its average one, and
   * the height that minimises the worst is the midpoint: it makes the climb up
   * into the highest cabin exactly equal to the drop down into the lowest.
   *
   * This used to level on the mean, which minimises the average step instead.
   * On the Ferris Wheel the served cabins are bunched near the bottom of the
   * rim with one much higher, so the mean sat low and left that one cabin 6.3 u
   * above the deck where the midpoint leaves it 4.8. On every other ride the
   * served seats rest at one height, or near enough, and the two agree exactly.
   */
  const deckY = (Math.min(...poses.map((p) => p.y)) + Math.max(...poses.map((p) => p.y))) / 2;

  /* The deck: a landing beside the seats, long enough to reach all of them. */
  const spreadAlong = poses.map((p) => (p.x - cx) * along[0] + (p.z - cz) * along[1]);
  const spreadOut = poses.map((p) => (p.x - cx) * outward[0] + (p.z - cz) * outward[1]);
  const deckHalfAlong = Math.max(...spreadAlong.map(Math.abs)) + DECK_END_MARGIN;

  /*
   * How far out the deck has to stand.
   *
   * It starts tucked against the seats it serves and is pushed outward until
   * nothing the RUNNING ride carries comes within SWEEP_CLEARANCE of it. For a
   * Ferris Wheel, whose cabins never leave the plane of its rim, that is the
   * first position tried, so the platform sits right against the wheel where a
   * real one does. For the Monster Ride, whose arms sweep a forty-metre circle
   * through the place its tubs rest, it walks the deck out past the sweep.
   */
  const minOffset = Math.max(...spreadOut) + DECK_SEAT_GAP + DECK_DEPTH / 2;
  const outerU =
    solveDeckOffset(
      rideId,
      [cx, cz],
      outward,
      along,
      deckHalfAlong,
      DECK_DEPTH / 2,
      deckY,
      minOffset,
    ) +
    DECK_DEPTH / 2;

  /*
   * How deep the deck has to be.
   *
   * Normally DECK_DEPTH: room to stand and turn, no more. But a ride whose
   * seats ring a spider — the Monster Ride's twenty tubs do — cannot be loaded
   * from a two-metre strip pushed out beyond its sweep, because the far tubs
   * would be twenty metres from anyone standing on it. There the deck reaches
   * back in until every seat it serves is within a stride of it, which is what
   * an octopus ride's loading apron actually is: a floor under the arms.
   */
  const innerU = Math.min(
    outerU - DECK_DEPTH,
    Math.max(outerU - 2 * DECK_MAX_HALF_OUT, Math.min(...spreadOut) + MAX_DECK_REACH),
  );
  const deckHalfOut = (outerU - innerU) / 2;
  const deckOffset = (outerU + innerU) / 2;
  const deck: readonly [number, number] = [
    cx + outward[0] * deckOffset,
    cz + outward[1] * deckOffset,
  ];

  /*
   * DUCK THE DECK UNDER ANYTHING THAT SWEEPS OVER IT.
   *
   * The deck is deliberately a floor UNDER the arms on a ride like this one —
   * that is the only way the far tubs are reachable at all — so it cannot be
   * pushed sideways out of their path. It has to go under them instead.
   *
   * Levelled with the parked seats, the Monster Ride's platform stood 5.5u
   * inside the path of its own tubs: on every revolution a cup passed straight
   * through the boarding floor. The floor is therefore dropped until the lowest
   * thing the running ride carries over it passes clear above, which is what an
   * octopus ride's loading floor is — low, with the cars swinging over it.
   *
   * The cost is stated rather than hidden: a lowered floor turns the step into
   * a seat into a climb, and `verify-boarding` reports the ride by name.
   */
  const body = SEAT_BODY[rideId];
  let deckTop = deckY;
  if (body) {
    let lowest = Infinity;
    for (const p of sweptSeats(rideId)) {
      const dx = p.x - deck[0];
      const dz = p.z - deck[1];
      const a = Math.max(0, Math.abs(dx * along[0] + dz * along[1]) - deckHalfAlong);
      const o = Math.max(0, Math.abs(dx * outward[0] + dz * outward[1]) - deckHalfOut);
      if (Math.hypot(a, o) > body.radius) continue;
      lowest = Math.min(lowest, p.y - body.floorDrop);
    }
    if (lowest !== Infinity) {
      deckTop = Math.min(deckTop, Math.max(0, lowest - SWEEP_CLEARANCE));
    }
  }

  /* The flights, laid out as a switchback outward of the deck. */
  const totalSteps = Math.max(1, Math.round(deckTop / STAIR_RISE));
  const rise = deckTop / totalSteps;
  const flightSteps = splitFlights(totalSteps);
  const lane = (STAIR_WIDTH + LANE_GAP) / 2;

  const flights: StairFlight[] = [];
  const landings: { at: Point3 }[] = [];

  /*
   * Built from the top down: the last flight arrives at the outer edge of the
   * deck travelling inward, and each flight below it reverses.
   */
  const deckEdgeU = deckOffset + deckHalfOut;
  let u = deckEdgeU;
  let y = deckTop;
  let sign = 1; // +1 = this flight climbs inward (against `outward`)
  const reversed: StairFlight[] = [];
  for (let k = flightSteps.length - 1; k >= 0; k--) {
    const steps = flightSteps[k];
    const going = steps * STAIR_GOING;
    const lateral = flightSteps.length === 1 ? 0 : (k % 2 === 0 ? -lane : lane);
    const topU = u;
    const bottomU = u + sign * going;
    /* The bottom flight stands exactly on the ground: after five or six
       flights the accumulated subtraction leaves a picometre of float residue,
       and a stair that does not quite meet the ground is a stair with a step
       missing at the bottom. */
    const bottomY = k === 0 ? 0 : y - steps * rise;
    reversed.push({
      from: [
        cx + outward[0] * bottomU + along[0] * lateral,
        bottomY,
        cz + outward[1] * bottomU + along[1] * lateral,
      ],
      to: [
        cx + outward[0] * topU + along[0] * lateral,
        y,
        cz + outward[1] * topU + along[1] * lateral,
      ],
      steps,
    });
    if (k > 0) {
      landings.push({
        at: [cx + outward[0] * bottomU, bottomY, cz + outward[1] * bottomU],
      });
    }
    u = bottomU;
    y = bottomY;
    sign = -sign;
  }
  flights.push(...reversed.reverse());

  const first = flights[0];
  const base: readonly [number, number] = [first.from[0], first.from[2]];

  /*
   * THE CLIMBING PATH, WHICH IS A STAIRCASE AND NOT A RAMP.
   *
   * The obvious path — a straight line up each flight — runs through the noses
   * of the treads, which means that between one nose and the next it is BELOW
   * the tread surface. A figure walking it sinks up to a full riser into the
   * steps: it looks like wading up the staircase rather than climbing it, and
   * it was measurably wrong on all five stairs.
   *
   * So the path is the surface itself: up each riser, then along each tread,
   * step by step, then across the landing at every turn, and finally out onto
   * the boarding deck. At every point of it a climber's feet are exactly on
   * something solid, which is what `scripts/verify-boarding.ts` re-derives.
   */
  const path: Point3[] = [first.from];
  for (let i = 0; i < flights.length; i++) {
    const f = flights[i];
    const run = Math.hypot(f.to[0] - f.from[0], f.to[2] - f.from[2]);
    const ux = (f.to[0] - f.from[0]) / (run || 1);
    const uz = (f.to[2] - f.from[2]) / (run || 1);
    const stepRun = run / f.steps;
    const stepRise = (f.to[1] - f.from[1]) / f.steps;
    for (let k = 0; k < f.steps; k++) {
      const y = f.from[1] + (k + 1) * stepRise;
      /* Up the riser, at the near edge of the tread. */
      path.push([f.from[0] + ux * (k * stepRun), y, f.from[2] + uz * (k * stepRun)]);
      /* Then along the tread, to its far edge. */
      path.push([f.from[0] + ux * ((k + 1) * stepRun), y, f.from[2] + uz * ((k + 1) * stepRun)]);
    }
    /* Across the landing to the foot of the next flight. */
    const next = flights[i + 1];
    if (next) path.push(next.from);
  }
  path.push([deck[0], deckTop, deck[1]]);

  let climbLength = 0;
  for (let i = 1; i < path.length; i++) {
    climbLength += Math.hypot(
      path[i][0] - path[i - 1][0],
      path[i][1] - path[i - 1][1],
      path[i][2] - path[i - 1][2],
    );
  }

  /* The queue: a line on the ground running back from the first step. */
  const queueDir: readonly [number, number] =
    flights[0].from[0] === flights[0].to[0] && flights[0].from[2] === flights[0].to[2]
      ? outward
      : (() => {
          const dx = first.from[0] - first.to[0];
          const dz = first.from[2] - first.to[2];
          const l = Math.hypot(dx, dz) || 1;
          return [dx / l, dz / l] as const;
        })();
  const queue = Array.from({ length: Math.max(seatsPerDeck, 1) }, (_, i) => {
    const back = QUEUE_STANDOFF + i * QUEUE_PITCH;
    return [base[0] + queueDir[0] * back, base[1] + queueDir[1] * back] as const;
  });

  return {
    rideId,
    seats,
    outward,
    along,
    deckY: deckTop,
    levelledDeckY: deckY,
    deck,
    deckHalfAlong,
    deckHalfOut,
    base,
    flights,
    landings,
    climbLength,
    path,
    queue,
  };
}

/**
 * THE nTH PLACE IN A RIDE'S BOARDING LINE, however long the line gets.
 *
 * A stair is drawn with as many places as its deck has seats, which is what a
 * queue rail is built for. A real morning can put more people than that in the
 * line — the Ferris Wheel's deck reaches ten cabins and twenty-seven employees
 * come to it — and the old code clamped anyone past the end onto the last
 * place, stacking them into one another.
 *
 * So the line simply continues: past the drawn rail it runs on in the same
 * direction at the same human pitch. Nobody is ever put on somebody else's
 * place, and the drawn rail still covers the length the deck can load.
 */
export function queuePlace(stair: BoardingStair, index: number): readonly [number, number] {
  const drawn = stair.queue;
  if (index < drawn.length) return drawn[index];

  const last = drawn[drawn.length - 1];
  const from = drawn.length > 1 ? drawn[drawn.length - 2] : stair.base;
  const dx = last[0] - from[0];
  const dz = last[1] - from[1];
  const len = Math.hypot(dx, dz) || 1;
  const beyond = index - (drawn.length - 1);
  return [
    last[0] + (dx / len) * beyond * QUEUE_PITCH,
    last[1] + (dz / len) * beyond * QUEUE_PITCH,
  ] as const;
}

/**
 * Where on the deck a climber stands before stepping into a given seat: level
 * with the seat, on the deck's inner edge.
 */
export function deckSpotFor(stair: BoardingStair, seatIndex: number): Point3 {
  const p = seatPose(stair.rideId, seatIndex, 0);
  const cx = stair.deck[0];
  const cz = stair.deck[1];
  /* The nearest place on the deck to that seat: the seat's own position,
     clamped to the deck's rectangle with a hand's breadth kept off the edge. */
  const inset = 0.35;
  const a = (p.x - cx) * stair.along[0] + (p.z - cz) * stair.along[1];
  const o = (p.x - cx) * stair.outward[0] + (p.z - cz) * stair.outward[1];
  const ca = Math.max(-stair.deckHalfAlong + inset, Math.min(stair.deckHalfAlong - inset, a));
  const co = Math.max(-stair.deckHalfOut + inset, Math.min(stair.deckHalfOut - inset, o));
  return [
    cx + stair.along[0] * ca + stair.outward[0] * co,
    stair.deckY,
    cz + stair.along[1] * ca + stair.outward[1] * co,
  ];
}

/** How many seats one dispatch of this ride can load from its deck. */
export function stairCapacity(stair: BoardingStair): number {
  return stair.seats.length;
}

/**
 * One stair per department ride, solved once.
 *
 * Sized for a full boarding group, which is what the park's existing minimum
 * says a dispatch is; a ride whose stopped position offers more level seats
 * than that keeps them, so a bigger group still fits.
 */
/**
 * KEEP ONLY THE SEATS THE BOARDS CAN ACTUALLY REACH.
 *
 * A deck built to serve every seat a ride presents at rest is right about the
 * HEIGHTS and wrong about the distances: the UFO Pendulum's thirty seats ring
 * its saucer and the Monster Ride's sixteen tubs hang off a spider, so a flat
 * platform beside them is a stride from some and twenty-eight metres from
 * others. Getting into the far ones is not a step across, it is a walk around
 * the machine at deck height.
 *
 * So the deck is solved for all of them — which is what makes it long enough to
 * be worth having — and then offers only those within the park's own reach of
 * it, exactly as the Giga Coaster's station offers only the near side of its
 * train. Everything else about the stair is untouched.
 */
function reachOf(stair: BoardingStair, seat: number): number {
  const p = seatPose(stair.rideId, seat, 0);
  const spot = deckSpotFor(stair, seat);
  return Math.hypot(p.x - spot[0], p.z - spot[2]);
}

function withinReach(stair: BoardingStair): BoardingStair {
  const seats = stair.seats.filter((i) => {
    const p = seatPose(stair.rideId, i, 0);
    const spot = deckSpotFor(stair, i);
    /*
     * ACROSS, not up. How far a seat sits above or below the boards is already
     * settled by the height window the deck was solved in — the Ferris Wheel's
     * cabins rise away from a flat platform and the park has always accepted
     * that as a climb into a cabin. What it has never accepted, and what the
     * wider decks introduced, is a seat you would have to WALK to: the far side
     * of a spider or the other end of a saucer's ring.
     */
    return Math.hypot(p.x - spot[0], p.z - spot[2]) <= BOARD_REACH;
  });
  if (seats.length >= PLATFORM_SEATS) return { ...stair, seats };
  /*
   * NEVER FEWER THAN THE PLATFORM WAS BUILT FOR. The Monster Ride's tubs hang
   * off a spider and only eight of them come within a stride of any flat floor,
   * which is fewer than the deck has always presented. Rather than take seats
   * away from a ride that had them, it keeps the nearest PLATFORM_SEATS — the
   * same figure, now a floor rather than a cap.
   */
  const nearest = [...stair.seats].sort((a, b) => reachOf(stair, a) - reachOf(stair, b));
  return { ...stair, seats: nearest.slice(0, PLATFORM_SEATS).sort((a, b) => a - b) };
}

/** The longest step from the boards into any seat the deck presents. */
function worstStep(stair: BoardingStair): number {
  return Math.max(
    ...stair.seats.map((i) => {
      const p = seatPose(stair.rideId, i, 0);
      const spot = deckSpotFor(stair, i);
      return Math.hypot(p.x - spot[0], p.y - spot[1], p.z - spot[2]);
    }),
  );
}

/**
 * The MOST seats a deck can present and still be stepped off into all of them.
 *
 * Presenting every seat the ride can offer is what keeps a department off a
 * queue, and for most rides the whole set is reachable. Two things can put a
 * seat out of reach, and they behave differently. On the Ferris Wheel and the
 * Monster Ride it is the machine: cabins on a rim and tubs on a spider are not
 * coplanar with any flat floor, so no subset of them is all within a stride and
 * dropping seats would only cost the ride capacity for nothing.
 *
 * On the Roller Coaster it is the train: its station stands on the lift slope,
 * so the last car rests six metres above the first and two metres past the end
 * of the boards. Levelling the deck on the midpoint puts that car a metre above
 * a stride — so the deck stops one car short and the coaster loads the ten it
 * can reach. The car is still there and the ride still runs it; it is simply
 * not one this platform loads.
 *
 * So: take the largest deck whose every seat is a step away, and if no deck
 * down to the boarding-group floor manages it, keep the full one.
 */
function reachableDeck(id: DepartmentRideId, floor: number): BoardingStair {
  const present = Math.max(floor, boardingSeats(id).length);
  const full = withinReach(solveBoardingStair(id, present));
  for (let n = present; n >= floor; n--) {
    const deck = withinReach(solveBoardingStair(id, n));
    if (worstStep(deck) <= EMPLOYEE_HEIGHT + 1e-9) return deck;
  }
  return full;
}

export function solveBoardingStairs(seatsPerDeck: number): Record<DepartmentRideId, BoardingStair> {
  return Object.fromEntries(
    DEPARTMENT_RIDE_IDS.map((id) => [
      id,
      /* The Giga Coaster came with a station; it is not given a second one. */
      id === "giga"
        ? gigaStationStair()
        : /*
           * EVERY SEAT THE RIDE CAN ACTUALLY PRESENT, not a flat ten.
           *
           * `seatsPerDeck` was one number for all of them, chosen when the
           * largest department in the park was ten people. It is the wrong
           * shape for a real attendance file: it left the Dragon Ship — whose
           * forty seats all stand at one height, every one of them within a
           * step of the boards — offering ten, and employees queueing beside
           * thirty empty places.
           *
           * What a ride can present is a fact about the machine, and
           * `boardingSeats` already works it out from the ride's own geometry.
           * The flat figure survives as the FLOOR a deck is built to, which is
           * what it always really was.
           */
          reachableDeck(id, seatsPerDeck),
    ]),
  ) as Record<DepartmentRideId, BoardingStair>;
}

/** One stair per department ride, solved once. */
export const BOARDING_STAIRS = solveBoardingStairs(PLATFORM_SEATS);

export function stairFor(rideId: DepartmentRideId): BoardingStair {
  return BOARDING_STAIRS[rideId];
}
