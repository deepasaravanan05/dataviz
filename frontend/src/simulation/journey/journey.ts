import {
  CHECK_IN_THRESHOLDS,
  classifyCheckIn,
  classifyDelay,
} from "@/simulation/classification";
import { formatSimTime } from "@/simulation/clock";
import {
  resolveDepartmentRides,
  type DepartmentInfo,
  type DepartmentRideId,
} from "@/components/park/departments";
import {
  FOUNTAIN_CENTER,
  FOUNTAIN_DETOUR_RADIUS,
  rideById,
} from "@/components/park/layout";
import {
  PARK_ORIGIN,
  RADIAL_PATH_TO,
  RADIAL_PATH_WIDTH,
  RIDE_PLOT_RADIUS,
} from "@/components/park/parkRing";
import { distanceToPaving } from "@/components/world/paths";
import { EMPLOYEE_DATASET, reportedDelay, type DatasetRow } from "./dataset";
import { DEPARTMENT_RIDE_IDS, seatPose } from "./rideKinematics";
import {
  buildRideSchedule,
  segmentAnimationSeconds,
  stairFor,
  type RideArrival,
  type RideRider,
  type RideSchedules,
  type RidePins,
  type RideSegment,
} from "./rideOps";
import {
  QUEUE_PITCH,
  QUEUE_STANDOFF,
  deckSpotFor,
  queuePlace,
  stairHead,
  stairLanePath,
  type BoardingStair,
} from "./boardingStair";
import {
  CHECK_IN_DWELL,
  FOOD_COURT_CHAIRS,
  FOOD_COURT_DOOR,
  AVENUE_JOIN,
  GATE_INNER_Z,
  GATE_X,
  GATE_Z,
  LANE_COUNT,
  LANE_SPACING,
  LOOP_LEAD_IN,
  LOOP_TAIL,
  QUEUE_SPACING,
  QUEUE_WAIT_MIN,
  QUEUE_WAIT_SPAN,
  SPAWN_Z,
  WALK_UNITS_PER_MINUTE,
  foodCourtToWorld,
} from "./constants";

/**
 * The employee journey, built from the EXACT attendance dataset.
 *
 * `dataset.ts` — transcribed from `data/final one.xlsx` — fixes every
 * employee's name, ID, department, date, check-in time, delay and actual
 * work-start time. This module derives the MOVEMENT that honours those
 * records; it never adjusts them, never invents a delay and never fills a
 * blank. It animates one DATE at a time, because a date is what a working
 * morning is.
 *
 * THE STORY THIS ANIMATES is that checking in is not the same as starting
 * work. The delay column alone decides the shape of a person's morning:
 *
 *   delay = 0   gate -> straight to their department ride
 *   delay > 0   gate -> food court -> sit the delay out -> department ride
 *
 * Nothing else selects who eats. There is no share, no quota and no random
 * draw — a viewer watching someone sit down is watching that person's delay
 * being served, and the length of the sit IS the delay minus the walking it
 * takes to get there and on to the ride.
 *
 * WHAT IS ANCHORED. Every employee stands at the gate at their exact check-in
 * minute; that is walked backwards from, so they spawn outside early enough to
 * arrive on time. A delayed employee then sits in the food court for EXACTLY
 * their delay — not the delay less the walking, which is what this used to do —
 * so the time on the chair is the Delay Time column, to the second, and can be
 * checked against the sheet by watching it.
 *
 * WALKING IS ON TOP OF THAT, and everybody walks at the same unhurried
 * 1.35 m/s. Nobody sprints to make a number come out, because the number is
 * already exact; what the walk changes is when they REACH the ride.
 *
 * WHERE THE PARK ARGUES WITH THE SHEET. This park is a kilometre in radius: the
 * gate is 400-700 m from the rides and the food court is at the middle, so a
 * delayed employee's round trip is a good half hour on foot. An employee
 * therefore reaches their ride LATER than the sheet's Actual Work Start —
 * always, and by the length of a walk rather than by anything the data says.
 * `LATE_ARRIVALS` records every one of them and by how much. The sheet's own
 * times are never rewritten to hide it: `workStart` is the sheet's minute and
 * `workStartActual` is when the park could physically deliver it.
 *
 * Reuses the park's existing modules rather than cloning them: department
 * destinations come from `rideForDepartment`, ride positions from the park
 * layout solver, the fountain geometry from the layout, the delay banding from
 * `classifyDelay()`, and clock formatting from `formatSimTime()`.
 */

/** Colour band an employee wears, decided purely by how late their work start was. */
export type CheckInColor = "GREEN" | "YELLOW" | "RED";

export const CHECK_IN_COLOR_HEX: Record<CheckInColor, string> = {
  GREEN: "#22C55E",
  YELLOW: "#FACC15",
  RED: "#EF4444",
};

/**
 * Worded from CHECK_IN_THRESHOLDS so the labels cannot drift from the bands,
 * and worded as the HALF-OPEN intervals they are: a check-in at 9:45 exactly is
 * yellow, and one at 11:00 exactly is red.
 */
export const CHECK_IN_BAND_LABEL: Record<CheckInColor, string> = {
  GREEN: `Checked in before ${formatSimTime(CHECK_IN_THRESHOLDS.greenUntil)}`,
  YELLOW: `${formatSimTime(CHECK_IN_THRESHOLDS.greenUntil)} – ${formatSimTime(CHECK_IN_THRESHOLDS.yellowUntil)}`,
  RED: `${formatSimTime(CHECK_IN_THRESHOLDS.yellowUntil)} onwards`,
};

export type JourneyPhase =
  | "APPROACHING"
  | "QUEUED"
  | "CHECKING_IN"
  | "ENTERING"
  | "TO_FOOD_COURT"
  | "IN_FOOD_COURT"
  | "TO_RIDE"
  | "AT_RIDE"
  | "WAITING_AT_LADDER"
  | "WALKING_TO_LADDER"
  | "CLIMBING_LADDER"
  | "ON_PLATFORM"
  | "WALKING_TO_SEAT"
  | "BOARDING"
  | "SITTING_ON_RIDE"
  | "EXITING_RIDE"
  | "WORKING"
  | "LEAVING";

export const PHASE_LABEL: Record<JourneyPhase, string> = {
  APPROACHING: "Walking to the entrance",
  QUEUED: "Waiting at the gate",
  CHECKING_IN: "Checking in at the main gate",
  ENTERING: "Entering the park",
  TO_FOOD_COURT: "Walking to the food court",
  IN_FOOD_COURT: "In the food court",
  TO_RIDE: "Walking to their department ride",
  AT_RIDE: "Arrived at their department ride",
  WAITING_AT_LADDER: "Waiting in the line at the boarding stair",
  WALKING_TO_LADDER: "Walking to the boarding stair",
  CLIMBING_LADDER: "On the boarding stair",
  ON_PLATFORM: "On the boarding platform",
  WALKING_TO_SEAT: "Walking to their seat",
  BOARDING: "Getting into the seat",
  SITTING_ON_RIDE: "Seated on the ride",
  EXITING_RIDE: "Getting off the ride",
  WORKING: "Work started",
  LEAVING: "Checked out, walking to the gate",
};

/**
 * THE CHECK-IN CLOCK DECIDES THE COLOUR, and it is worn.
 *
 * This is the one thing an employee's clothing states: how early in the morning
 * they got here. Green before a quarter to ten, yellow up to ten, red after —
 * read straight off the dataset's own check-in column and banded by
 * `classifyCheckIn`, which lives beside the delay classifier so the park has a
 * single place where any band is decided.
 *
 * It is NOT the delay. The delay is a different fact about a different part of
 * the morning and still has its own banding — `delayCategory` on every employee
 * record, from the same `classifyDelay()` the Department Check-In Overview
 * reads — so the two are reported side by side rather than confused. What a
 * viewer sees on a shirt is arrival time, and nothing else.
 */
export function checkInColor(checkInMinutes: number): CheckInColor {
  return classifyCheckIn(checkInMinutes);
}

interface Waypoint {
  x: number;
  z: number;
  /**
   * Height above the ground. Zero everywhere a person is walking on it; only
   * the legs that climb into and out of a ride seat leave the ground.
   */
  y?: number;
  /** Sim-minute the employee reaches this point. */
  arrive: number;
  /** Sim-minute they leave it again. */
  depart: number;
  /** What they are doing while travelling here and waiting here. */
  phase: JourneyPhase;
}

export interface JourneyEmployee {
  id: string;
  name: string;
  department: string;
  rideId: DepartmentRideId;
  rideName: string;

  checkInTime: number;
  color: CheckInColor;

  /** True exactly when the dataset gives this employee a delay. */
  visitsFoodCourt: boolean;
  foodCourtEntry: number | null;
  foodCourtExit: number | null;
  /**
   * The window they are actually ON the chair, as against the door-to-door
   * visit above. The two used to be the same to within a rounding error; the
   * court is now a 500 m plaza, so the walk in and the walk out sit inside the
   * visit either side of the sit, and anything that means "is this seat taken"
   * has to ask about this pair rather than that one.
   */
  sitStart: number | null;
  sitEnd: number | null;
  /** Index into FOOD_COURT_CHAIRS, held for the length of the sit. */
  chairIndex: number | null;
  /** Minutes actually spent seated — the delay, less the walking it paid for. */
  sitMinutes: number;

  rideArrival: number;

  /* ---- The ride itself: which seat, and the minutes of that dispatch ---- */
  /** Seat this employee is given on their department ride. */
  rideSeatIndex: number;
  /** The stop at which they got on. */
  rideCycleIndex: number;
  /**
   * The stretches of their ride's own running that happen while they are in
   * their seat. A ride is interruptible, so this is a list rather than a single
   * window: it stops to take somebody else aboard and is released again, and
   * the rider stays put throughout.
   */
  rideSegments: RideSegment[];
  /** Their place in the line at the foot of the boarding stair. */
  queueSlot: number;
  /** Which lane of the staircase they climb, and which they come down. */
  climbLane: number;
  descendLane: number;
  /** Boarding opens: they leave the apron for the queue at the stair. */
  boardStart: number;
  /** Sets foot on the bottom step, with the one-person stair to themselves. */
  ladderAt: number;
  /** Steps off the top of the stair onto the boarding platform. */
  deckAt: number;
  /** Standing on the platform beside their own seat. */
  atSeatSpotAt: number;
  /** Seated, and attached to the seat from here. */
  seatedAt: number;
  /** The ride is released. */
  rideStart: number;
  /** The ride is back at rest, in the pose it started in. */
  rideEnd: number;
  /** Stands up out of the seat. */
  riseAt: number;
  /** Back at the head of the stair, ready to go down. */
  deckOutAt: number;
  /** Steps off the bottom of the stair, back on the ground. */
  groundAt: number;
  /** Back at their department's spot, clear of the ride. */
  rideExit: number;

  /** The dataset's work-start minute, untouched. */
  workStart: number;
  /**
   * When work actually begins on screen: the dataset minute, or later where the
   * park physically cannot deliver it — the walk from the gate, or the
   * department's ride still having to run.
   */
  workStartActual: number;
  /**
   * The minute work would have started if the ride were not part of the
   * commute — today's answer, kept so the two can be compared.
   */
  workStartBeforeRide: number;
  /**
   * The source's own check-out minute, or null where it has none. `final
   * one.xlsx` records when the working day STARTS and nothing about when it
   * ends, so this is null for every employee the park animates from it, and
   * every surface prints a dash rather than a made-up hour.
   */
  checkOut: number | null;
  /**
   * The gap between check-in and actual work start, in minutes, exactly.
   * `reportedDelayMinutes` beside it is the sheet's own whole-minute column.
   */
  delayMinutes: number;
  /** The Delay Time column as the sheet prints it — whole minutes. */
  reportedDelayMinutes: number;
  /** The park's existing delay banding, applied to the real delay. */
  delayCategory: ReturnType<typeof classifyDelay>;

  /** Metres per simulated minute this employee walks inside the park. */
  walkSpeed: number;

  /** First moment the figure is on screen. */
  spawnTime: number;
  /** Last moment they are on screen, having walked back out of the gate. */
  despawnTime: number;
  route: Waypoint[];
}

/**
 * Employees whose ride arrival could not be made to land on the sheet's
 * work-start minute, and by how many minutes it slips.
 *
 * Two causes, both of them the SIZE OF THE PARK rather than anything wrong with
 * the data. An employee with no delay has work starting at the very minute they
 * check in, and cannot be at their ride until they have walked there. An
 * employee with a delay sits it out in full — that is the rule — and the walk
 * out to their ride happens after the sit rather than inside it.
 *
 * Recorded rather than hidden: the sheet's own Actual Work Start is carried
 * through untouched on every employee, and this says by how much the park's
 * geometry pushed the visible one past it.
 */
export interface LateArrival {
  id: string;
  reason: "no-delay-walk" | "walk-after-food-court";
  minutes: number;
}

/**
 * Everything one build of the journey produces: the employees, their lookup,
 * the physically-late arrivals, and the loop window that contains every route.
 *
 * The park always runs exactly one of these. The built-in dataset's build is
 * the module constants below; an uploaded roster produces another through the
 * same `buildJourney()`, so an upload obeys every rule the built-in cast does.
 */
export interface JourneyData {
  employees: JourneyEmployee[];
  byId: Record<string, JourneyEmployee>;
  lateArrivals: LateArrival[];
  /** Every department ride's stop-load-run-stop-unload day. */
  rideSchedules: RideSchedules;
  loopStart: number;
  loopEnd: number;
  loopMinutes: number;
  /**
   * The minute the playhead STARTS on, as distinct from the minute the day
   * starts on.
   *
   * `loopStart` is the moment before the first person appears outside the
   * gate, so landing on it means landing on an empty park: nobody has checked
   * in, there is nothing to look at, and the visitor has to sit through the
   * arrival before the visualisation shows them anything. That is what the
   * page was doing, and it read — correctly — as "there are no people".
   *
   * So the playhead opens on the fullest moment of the arrival story instead:
   * the minute, inside the arrival window, at which the largest number of
   * employees are inside the park while somebody is still walking. The whole
   * cast is on stage AND the park is visibly moving, which is what tells a
   * visitor at a glance that this is a simulation and not a still. The
   * scrubber still spans the whole day, so 9:27 is one drag away.
   */
  openingMinute: number;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Pt = [number, number];

const dist = (a: readonly [number, number], b: readonly [number, number]) =>
  Math.hypot(b[0] - a[0], b[1] - a[1]);

/**
 * Push a point out of the fountain's detour circle, if it has landed in it.
 *
 * A ride's waiting apron and its approach are both set out from the ride's
 * centre along the line to the gate, at a distance that grows with the ride.
 * For a ride on the far side of the plaza that line runs THROUGH the fountain,
 * so a big enough ride puts its own approach point inside the detour circle —
 * which `fountainDetour` cannot bend a route around, because there is no way
 * round to a destination that is inside the obstacle. It threw instead.
 *
 * The comment on that function has always claimed these anchors were "solved to
 * clear" the circle. They were not: they cleared it by luck, and the luck ran
 * out the moment the rides grew 20%. This makes the claim true — a point inside
 * the circle is pushed radially out to its rim plus a margin, which moves it a
 * couple of metres and leaves every anchor that was already clear untouched.
 */
const FOUNTAIN_CLEARANCE = 2;

function clearFountain(p: Pt): Pt {
  const [fx, fz] = FOUNTAIN_CENTER;
  const dx = p[0] - fx;
  const dz = p[1] - fz;
  const d = Math.hypot(dx, dz);
  const need = FOUNTAIN_DETOUR_RADIUS + FOUNTAIN_CLEARANCE;
  if (d >= need) return p;
  /* Dead centre has no direction to push along; use the gate line. */
  if (d < 1e-6) return [fx, fz + need];
  return [fx + (dx / d) * need, fz + (dz / d) * need];
}

/**
 * Where an employee stands once they reach their department ride: on the side
 * of the ride that faces the MIDDLE of the park, spread sideways so a whole
 * department does not stack into one spot.
 *
 * IT USED TO BE THE SIDE FACING THE GATE, and on a fan of attractions all laid
 * out in front of the entrance that was the same thing. On a ring it is not:
 * for the rides at the back of the park the gate is behind them, so boarding
 * on the gate side would have put the queue on the far side of the machine
 * from the path that serves it. What every ride on the ring genuinely shares
 * is that people arrive off the RING PATH, and the ring path is inside — so
 * that is the side the apron, the queue and the boarding steps go.
 *
 * The reach is the ride's CIRCUMSCRIBED radius, not the larger of its two
 * half-extents. A box's half-extent is the distance to its face, which is only
 * the distance to its edge when you approach it square on; the inward bearing
 * of a ride on the ring almost never is, so the old figure put the waiting
 * crowd inside the corner of a big square footprint. The circumscribed radius
 * is right from every direction, and it is the same figure `parkRing.ts` uses
 * to space the ring, so the apron lands the same distance out for every ride.
 */
/** The gap kept between two people walking in side by side: a shoulder and room. */
const APPROACH_PITCH = 1.9;

/** Clear of the boarding platform's end before anybody stands for the day. */
const DESK_CLEARANCE = 8;
/** How far out from the steps the department's own ground begins. */
const DESK_STANDOFF = 26;
/** Inside the paving by this much, so nobody works with a foot on the grass. */
const DESK_PAVED_MARGIN = 2;

/**
 * WHERE A DEPARTMENT STANDS ONCE ITS RIDE IS BEHIND IT — beside the ride, never
 * in front of it.
 *
 * This is where an employee spends the rest of the working day, and it used to
 * be the apron: 32 to 46 m directly in front of the boarding steps. Every ride
 * therefore had a crowd standing across its frontage all day, drawn at the size
 * the park uses to keep people legible from a distance, and what that looked
 * like was a queue of people who would not get on. It is also the one thing the
 * user ruled out in as many words — "An employee must never stand, queue, or
 * wait in front of the ride."
 *
 * So the day is spent off to one side, past the end of the boarding platform,
 * with the frontage left to the people actually walking in and boarding. The
 * spots are SOLVED rather than placed: each one has to be on the paving with a
 * margin, so a department too big for one row runs to a second rank behind it
 * rather than off the kerb, and a ride whose platform is 158 m long — the
 * Monster Ride's is — pushes its department further round without anybody
 * needing to know that here.
 */
const DESK_ROWS = new Map<string, Pt[]>();

function deskSpots(rideId: DepartmentRideId, total: number): Pt[] {
  const key = `${rideId}:${total}`;
  const held = DESK_ROWS.get(key);
  if (held) return held;

  const stair = stairFor(rideId);
  const paved = (x: number, z: number) => distanceToPaving(x, z) <= -DESK_PAVED_MARGIN;
  const place = (side: number, along: number, back: number): Pt => [
    stair.base[0] + stair.outward[0] * back + stair.along[0] * side * along,
    stair.base[1] + stair.outward[1] * back + stair.along[1] * side * along,
  ];

  const start = stair.deckHalfAlong + DESK_CLEARANCE;
  const solve = (side: number): Pt[] => {
    const found: Pt[] = [];
    /* Out along the side of the platform, and back in ranks behind that, until
       the department is housed or the paving runs out. */
    for (let rank = 0; rank < 6 && found.length < total; rank++) {
      const back = DESK_STANDOFF + rank * APPROACH_PITCH * 1.4;
      for (let i = 0; i < 60 && found.length < total; i++) {
        const spot = place(side, start + i * APPROACH_PITCH, back);
        if (paved(spot[0], spot[1])) found.push(spot);
      }
    }
    return found;
  };

  let spots = solve(1);
  if (spots.length < total) {
    const other = solve(-1);
    if (other.length > spots.length) spots = other;
  }
  DESK_ROWS.set(key, spots);
  return spots;
}

function ridePoints(rideId: DepartmentRideId, index: number, total: number) {
  const r = rideById(rideId);
  const cx = r.center[0];
  const cz = r.center[1];
  const dx = FOUNTAIN_CENTER[0] - cx;
  const dz = FOUNTAIN_CENTER[1] - cz;
  const len = Math.hypot(dx, dz) || 1;
  const ux = dx / len;
  const uz = dz / len;
  // Perpendicular, for the sideways spread.
  const px = -uz;
  const pz = ux;

  /*
   * THE WAITING APRON IS AT THE FOOT OF THE BOARDING STAIR — not on the side of
   * the ride that faces the middle of the park.
   *
   * It used to be the latter, and the consequence was the one thing this whole
   * sequence exists to show going wrong. An employee "reached their ride",
   * stood on the inward side of it, and then walked round the machine to the
   * stair: three hundred and thirty metres on the Giga Coaster, three hundred
   * and sixteen on the Monster Ride, four minutes of walking AFTER the moment
   * the simulation called them arrived. On screen that reads as somebody
   * turning up at a stopped ride and wandering off round it instead of getting
   * on — which is exactly what the user reported twice.
   *
   * The apron therefore stands where a queue for a ride actually stands: on the
   * ground behind its own boarding line, so that arriving at the ride and
   * arriving at the way onto it are the same moment. The walk round the machine
   * still happens — it has to, the stair is where the stair is — but it happens
   * on the way IN, as part of walking to the ride, rather than after arriving.
   *
   * The layout of the group is unchanged: two ranks at just under two metres,
   * which is what a group of people waiting looks like.
   */
  const stair = stairFor(rideId);
  /*
   * BEYOND THE DECK, on the side the stair is entered from.
   *
   * The obvious anchor is the queue line, and it is the wrong one: a stair's
   * queue runs back down the line of its first flight, and on the Ferris Wheel
   * and the Monster Ride that flight climbs INWARD — so an apron placed behind
   * the queue landed on the far side of the platform from the path, under the
   * Monster Ride's own boarding floor. `verify-boarding` caught it.
   *
   * The deck's `outward` is defined as the direction from the ride's seats out
   * to its deck, so further out again is away from the machine by construction,
   * whichever way the steps happen to run. That is where a crowd waits.
   */
  const bx = stair.outward[0];
  const bz = stair.outward[1];
  /* Across the frontage, for the sideways spread. */
  const sx = stair.along[0];
  const sz = stair.along[1];

  const rank = index % 2;
  const column = Math.floor(index / 2);
  const columns = Math.max(1, Math.ceil(total / 2));
  const lateral = (column - (columns - 1) / 2) * APPROACH_PITCH;
  /*
   * Far enough out to clear the platform itself and the whole boarding line,
   * so the apron never stands under the deck or inside the queue.
   */
  const clearOfDeck =
    (stair.base[0] - stair.deck[0]) * stair.outward[0] +
    (stair.base[1] - stair.deck[1]) * stair.outward[1];
  const behind =
    Math.max(0, stair.deckHalfOut - clearOfDeck) +
    QUEUE_STANDOFF +
    stair.queue.length * QUEUE_PITCH +
    4;
  const back = behind + rank * 1.7;

  const stand: Pt = clearFountain([
    stair.base[0] + bx * back + sx * lateral,
    stair.base[1] + bz * back + sz * lateral,
  ]);
  /*
   * THE APPROACH IS THE RIDE'S ENTRANCE — the point on the edge of its plot
   * where its radial path arrives, and the same distance from the middle of
   * the park for every ride in it.
   *
   * It used to be set out from the ride's own centre, `reach + 58` metres back
   * along the line in. That put it at a different radius for every ride, which
   * was the honest answer while the rides stood at different radii and is the
   * wrong one now: the plan gives every attraction an identical plot entered
   * at an identical place, and the crowd should arrive AT that entrance rather
   * than at a point measured off the machine.
   *
   * THE FAN IS SPREAD ACROSS THE WIDTH OF THE PATH, not at a fixed pitch cut
   * down to fit.
   *
   * It used to be the apron's own pitch multiplied by 0.4, which put two
   * employees with adjacent places seventy-six centimetres apart — narrower
   * than a person — so a department filing in through its gateway walked
   * through one another for the length of the leg. Fanning them evenly across
   * the radial they are actually walking on gives every ride's crowd the most
   * room its own path has, whatever the size of the department: a big one
   * spreads to the kerbs, a small one walks up the middle.
   */
  const entranceRadius = RADIAL_PATH_TO;
  /* A metre of kerb kept either side, so nobody enters off the paving. */
  const usable = RADIAL_PATH_WIDTH - 4;
  /*
   * AND NEVER NARROWER THAN A PERSON, whatever the size of the department.
   *
   * Spreading a department evenly across the path is right until the department
   * outgrows the path: nineteen people fanned across sixteen metres stand eighty
   * centimetres apart, which is narrower than their shoulders, and two of them
   * walking the same leg at the same pace read as one figure with two heads for
   * the length of it — `verify-journey` measures exactly that and refused it.
   *
   * So the fan keeps a real gap and WRAPS instead: as many abreast as the path
   * can hold at that gap, and the rest in a rank behind, entering the plot a
   * pace further out. A crowd too big for the gateway walks in in rows, which
   * is what a crowd does.
   */
  const perRow = Math.max(1, Math.floor(usable / APPROACH_PITCH) + 1);
  const abreast = Math.min(columns, perRow);
  const inRow = column % perRow;
  const behindBy = Math.floor(column / perRow);
  const fan = abreast > 1 ? (inRow / (abreast - 1) - 0.5) * usable : 0;
  const approach: Pt = clearFountain([
    PARK_ORIGIN[0] - ux * (entranceRadius + (rank + 2 * behindBy) * APPROACH_PITCH) + px * fan,
    PARK_ORIGIN[1] - uz * (entranceRadius + (rank + 2 * behindBy) * APPROACH_PITCH) + pz * fan,
  ]);

  /*
   * ROUND THE END OF THE PLATFORM, where the straight line would go under it.
   *
   * Some rides keep their boarding deck on the far side of the machine from the
   * path — the Monster Ride's is a 142 by 44 metre floor dropped clear beneath
   * its own arms — so the direct line from the plot entrance to the queue runs
   * straight underneath it. That is not a walk, it is a shortcut through the
   * building, and `verify-boarding` has always refused it.
   *
   * So a leg that would cross the deck is bent round its nearer end instead: out
   * along the side the employee arrives on until past the platform, and only
   * then in to the queue. Legs that already clear the deck are left alone —
   * most of them do, and a detour round nothing would only lengthen the walk.
   */
  /*
   * The detour is measured all the way to the BOTTOM STEP, not to the apron.
   * The apron is no longer somewhere anybody stops — they walk through it to
   * the stair — so the leg that has to clear the platform is the whole of it.
   */
  const via = deckDetour(stair, approach, stair.base as Pt);
  /* And their own place beside the ride for the rest of the day — off the
     frontage, so nothing is ever standing between the path and the steps. */
  const row = deskSpots(rideId, total);
  const desk: Pt = row.length ? row[index % row.length] : stand;
  return { stand, desk, approach, via };
}

/**
 * Waypoints that carry a walk round a boarding deck rather than under it, or
 * none if the straight line already clears it.
 *
 * The dog-leg is proved clear rather than nudged until it passes: the first leg
 * stays on the arriving side of the deck, where every point is beyond its
 * outward half-extent; the second runs along a line past the deck's end, beyond
 * its half-length; and the third comes in on the queue's own side. No part of
 * any of them can be inside the rectangle.
 */
function deckDetour(stair: BoardingStair, from: Pt, to: Pt): Pt[] {
  const local = (p: Pt): [number, number] => [
    (p[0] - stair.deck[0]) * stair.along[0] + (p[1] - stair.deck[1]) * stair.along[1],
    (p[0] - stair.deck[0]) * stair.outward[0] + (p[1] - stair.deck[1]) * stair.outward[1],
  ];
  const world = (a: number, o: number): Pt => [
    stair.deck[0] + stair.along[0] * a + stair.outward[0] * o,
    stair.deck[1] + stair.along[1] * a + stair.outward[1] * o,
  ];

  const A = local(from);
  const B = local(to);
  /* Does the straight line cross the deck's rectangle at all? Sampled, which is
     exact enough at this spacing and far simpler than a clip test. */
  let crosses = false;
  for (let k = 0; k <= 200; k++) {
    const f = k / 200;
    const a = A[0] + (B[0] - A[0]) * f;
    const o = A[1] + (B[1] - A[1]) * f;
    if (Math.abs(a) < stair.deckHalfAlong && Math.abs(o) < stair.deckHalfOut) {
      crosses = true;
      break;
    }
  }
  if (!crosses) return [];

  /*
   * Round whichever end of the platform keeps the walk on the ride's own paved
   * plot. The nearer end is the obvious choice and is usually right, but a deck
   * as long as the Monster Ride's — a hundred and fifty-eight metres of it —
   * can put the turn beyond the kerb, and an employee walking on the grass is
   * a defect of its own. So both ends are costed and the better one wins.
   */
  const plot = rideById(stair.rideId).center;
  const fromCentre = (p: Pt) => Math.hypot(p[0] - plot[0], p[1] - plot[1]);
  const candidate = (side: 1 | -1): Pt[] => {
    const past = (stair.deckHalfAlong + DECK_ROUNDING_CLEARANCE) * side;
    const outside = -(stair.deckHalfOut + DECK_ROUNDING_CLEARANCE);
    return [world(past, outside), world(past, B[1])];
  };
  const near = candidate(A[0] >= 0 ? 1 : -1);
  const far = candidate(A[0] >= 0 ? -1 : 1);
  const worst = (pts: Pt[]) => Math.max(...pts.map(fromCentre));
  return worst(near) <= RIDE_PLOT_RADIUS || worst(near) <= worst(far) ? near : far;
}

/** How far clear of a boarding deck a walk round it keeps. */
const DECK_ROUNDING_CLEARANCE = 12;

/**
 * The centre line of a ride's arrival fan: where the paved approach and the
 * waiting apron belong. The park's path network is laid along these, so the
 * paving is always under the people rather than beside them.
 */
export function rideAnchor(rideId: DepartmentRideId) {
  return ridePoints(rideId, 0, 1);
}

/**
 * WALKING ROUND THE MIDDLE — ON THE RING PATH, NOT ACROSS THE PARK.
 *
 * The centre of the park is a lake, so no route may cross it; that much this
 * has always done. What it used to do was bend only the part of a leg that
 * actually entered the forbidden circle, joining the rim where the straight
 * line happened to meet it. That was right when the obstacle was a 22 m
 * fountain and the walk either side of it was a straight line across open
 * paving.
 *
 * It is wrong in a concentric park, and the failure is not subtle: the detour
 * radius is now the RING PATH, 290 m out, and a walker heading from the gate
 * to a ride on the far side would cut diagonally across the park to meet that
 * circle wherever the chord touched it — straight through whichever
 * attractions stood on the way. `verify-journey.ts` caught exactly that.
 *
 * So a leg that would cross the middle is now routed the way the park is built
 * to be walked, and the way the brief describes: RADIALLY IN to the ring path,
 * ROUND it, and RADIALLY OUT again. Both endpoints are outside the ring, every
 * attraction's approach sits on its own slot bearing, and the entrance avenue
 * is on bearing zero — so all three segments run on paving, and none of them
 * passes through a ride.
 *
 * Legs that never reach the middle are untouched and stay straight: an
 * approach to its own waiting apron is radial and short, and forcing that in
 * to the ring and back would be a detour round nothing.
 *
 * Returns the intermediate points only (the endpoints stay). Endpoints
 * themselves must be outside the ring — the ride anchors and path nodes are
 * all solved to clear it, and this throws if that ever regresses.
 */
export function ringDetour(
  a: readonly [number, number],
  b: readonly [number, number],
  /**
   * How far off the centre line of the ring path this walker keeps — their own
   * lane. Zero is the middle of the path; the path is 26 m wide, so the lanes
   * the builder hands out stay comfortably on the paving. See `laneOffsetOf`.
   */
  lane = 0,
): Pt[] {
  const [cx, cz] = FOUNTAIN_CENTER;
  const R = FOUNTAIN_DETOUR_RADIUS + lane;
  if (
    dist(a, FOUNTAIN_CENTER) < FOUNTAIN_DETOUR_RADIUS ||
    dist(b, FOUNTAIN_CENTER) < FOUNTAIN_DETOUR_RADIUS
  ) {
    throw new Error(
      `A route endpoint sits inside the ring path at (${a}) -> (${b}). ` +
        `Anchors must be solved to clear FOUNTAIN_DETOUR_RADIUS.`,
    );
  }

  const th1 = Math.atan2(a[1] - cz, a[0] - cx);
  const th2 = Math.atan2(b[1] - cz, b[0] - cx);
  let delta = th2 - th1;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta < -Math.PI) delta += 2 * Math.PI;
  /* Already on one radius: the straight line IS the radial path. */
  if (Math.abs(delta) < 1e-3) return [];

  const steps = Math.max(2, Math.ceil(Math.abs(delta) / 0.16));
  const pts: Pt[] = [];
  for (let k = 0; k <= steps; k++) {
    const th = th1 + (delta * k) / steps;
    pts.push([cx + R * Math.cos(th), cz + R * Math.sin(th)]);
  }
  return pts;
}

/**
 * A leg as actually walked.
 *
 * `viaRing` says whether this leg has to use the park's ring path. It is an
 * argument rather than something geometry can decide, and the reason is that
 * the paved network has two kinds of way in it: RADIAL ones — the entrance
 * avenue, each ride's spur, the food court's own link — and the CIRCULAR ring
 * path. A leg between two points on different radii is on paving only if there
 * happens to be a direct link between them, and only the route builder knows
 * which of its legs those are.
 *
 * Guessing from the geometry was tried and is wrong in both directions. A rule
 * of "bend it if the straight line would cross the middle" leaves a walker
 * cutting diagonally across the planting from the gate to a ride whose
 * approach the chord never quite reaches; a rule of "bend it whenever the
 * bearings differ" sends somebody walking from the concourse to the food court
 * six hundred metres in to the ring path and back out.
 */
function walkedLeg(a: Pt, b: Pt, viaRing = false, lane = 0): Pt[] {
  return viaRing ? [a, ...ringDetour(a, b, lane), b] : [a, b];
}

/** Metres actually covered walking a leg, detour included. */
function legLength(a: Pt, b: Pt, viaRing = false, lane = 0): number {
  const pts = walkedLeg(a, b, viaRing, lane);
  let total = 0;
  for (let k = 1; k < pts.length; k++) total += dist(pts[k - 1], pts[k]);
  return total;
}

/**
 * EVERY EMPLOYEE WALKS IN THEIR OWN LANE, so no two figures share a line.
 *
 * The park's routes converge: everybody comes in through one gate, everybody
 * delayed passes through one food-court door, and everybody bound for the same
 * ride leaves the ring path at the same point. Walked down the exact centre
 * line of each of those, two people whose timings happen to coincide occupy the
 * same patch of ground — which reads as one figure standing inside another.
 *
 * So each employee is given a personal lateral offset, held for their whole
 * journey, and every shared waypoint is shifted by it: the door, the junction
 * with the avenue, and the radius they take round the ring path. Their own
 * chair, their own spot on the boarding apron and their own turnstile were
 * already unique to them.
 *
 * The offsets are small against the paving they sit on — the ring path is 26 m
 * wide and the avenue 30 m — so nobody is walking on the grass to avoid a
 * colleague, and they are handed out by row so the same roster always walks the
 * same lanes.
 */
const PERSONAL_LANES = 9;
const PERSONAL_LANE_WIDTH = 3.0;

function laneOffsetOf(index: number): number {
  return ((index % PERSONAL_LANES) - (PERSONAL_LANES - 1) / 2) * PERSONAL_LANE_WIDTH;
}

/**
 * A point on a radial line from the middle of the park, shifted sideways into
 * this walker's own lane — across the path rather than along it.
 */
function inLane(point: Pt, lane: number): Pt {
  const dx = point[0] - PARK_ORIGIN[0];
  const dz = point[1] - PARK_ORIGIN[1];
  const len = Math.hypot(dx, dz) || 1;
  /* Perpendicular to the radius, which is the way a path is wide. */
  return [point[0] + (-dz / len) * lane, point[1] + (dx / len) * lane];
}

/** World position of one of the court's eighty real chairs. */
function chairPoint(chairIndex: number): Pt {
  return foodCourtToWorld(FOOD_COURT_CHAIRS[chairIndex].local);
}

export function buildJourney(rows: DatasetRow[]): JourneyData {

  // The dataset is the source of truth — prove it is internally consistent
  // before building anything on top of it.
  const seenIds = new Set<string>();
  for (const row of rows) {
    if (Math.abs(row.workStart - row.checkIn - row.delayMinutes) > 1e-9) {
      throw new Error(
        `Dataset row ${row.id}: workStart - checkIn = ${row.workStart - row.checkIn}, ` +
          `but delay says ${row.delayMinutes}. The dataset must not be altered to fit.`,
      );
    }
    if (seenIds.has(row.id)) {
      throw new Error(
        `Dataset row ${row.id} appears more than once. Employee IDs must be unique.`,
      );
    }
    seenIds.add(row.id);
  }
  if (rows.length === 0) {
    throw new Error("The roster is empty — there is nobody to animate.");
  }

  /*
   * Every department in THIS roster resolved to an existing ride: the known
   * six keep their mapping, and any new name is absorbed round-robin by the
   * existing attractions — never a new destination.
   */
  const rideMap = resolveDepartmentRides(rows.map((r) => r.department));

  /*
   * EVERYBODY GOES TO THEIR OWN DEPARTMENT'S RIDE. There is no overflow rule
   * any more, and that is a consequence of seats coming free.
   *
   * While a seat taken was a seat kept, a ride could take on only as many
   * people as its deck reached, so a full ride had to hand its overflow to
   * whichever attraction had room — the department mapping honoured as a
   * preference rather than a fact. Riders now get off when their ride is over
   * (see `rideOps.ts`), so a ride's day-long intake is a throughput question
   * and its department always fits. The mapping is therefore absolute again:
   * an employee's ride is their department's ride, on every date.
   */
  const assigned: DepartmentInfo[] = rows.map((row) => rideMap.get(row.department)!);

  // Per-ride seat counting, so a department's crowd fans out realistically.
  const perRideTotal: Record<string, number> = {};
  for (const dept of assigned) {
    perRideTotal[dept.rideId] = (perRideTotal[dept.rideId] ?? 0) + 1;
  }
  /* NOTE: `perRideIndex` and the queue's random waits are per PASS, not per
     build — see `solvePass`. Leaving them outside it let every pass hand each
     employee a place further along their department's fan than the last, which
     lengthened their walk a little each time and stopped the solve from ever
     settling. */

  /*
   * WHO STOPS FOR FOOD: exactly the people the sheet says were delayed.
   *
   * This used to be a 35% quota filled by a seeded ranking, which meant a
   * viewer could not read anything from a person sitting down — some delayed
   * employees walked straight past the court and some undelayed ones ate. The
   * delay column is now the whole rule, so the food court IS the delay, made
   * visible.
   */
  /*
   * WHICH TURNSTILE EACH EMPLOYEE USES — the first one that is free.
   *
   * It used to be `i % LANE_COUNT`, the row's position in the sheet, and that
   * was fine for a roster of thirty spread across a morning. It is not fine
   * here: this workbook puts up to twenty check-ins inside the few seconds one
   * turnstile takes, and a sheet order that happened to send two of them to the
   * same lane made the build throw.
   *
   * So lanes are handed out in CHECK-IN ORDER to whichever turnstile is free at
   * that minute — the way a person walking up to a bank of gates picks one.
   * Nobody's check-in minute moves, nobody shares a turnstile, and the sheet's
   * row order stops being able to decide whether the park can be built.
   */
  /*
   * THE SEAT IS THE ANCHOR: everybody is sitting on their ride at the exact
   * minute the sheet says their work started.
   *
   * That is one fixed point and several unknowns, because what has to happen
   * before it — the queue at the turnstile, the walk in, the time on a food
   * court chair, the climb, the walk across the boarding platform — is not
   * known until the rides have been scheduled, and the rides cannot be
   * scheduled until the walks are known. So the whole day is SOLVED rather than
   * laid out: build it, measure how far each employee's seat lands from their
   * own Actual Work Start, give that time back where the park can hold it, and
   * build it again. Two knobs per employee, and the pass below decides both.
   *
   *   sit   — minutes on a food court chair, which is where a delay that is
   *           longer than the journey is spent.
   *   shift — how much earlier than the sheet's check-in they cross the gate,
   *           for the far more common case of a delay SHORTER than the
   *           journey. The walk from the turnstile to a seat is 25 to 29
   *           minutes in this park and the median delay in the workbook is 15,
   *           so most employees have to start earlier than the sheet's
   *           check-in for its work-start minute to be reachable at all.
   *
   * It converges in a handful of passes: each one corrects each employee by
   * exactly their own error, and the error only moves again if the correction
   * changed which seat the ride gave them.
   */
  const plans = rows.map(() => ({ sit: 0, shift: 0, boardingCost: 0 }));
  /* The seat and the stair lane each employee had on the previous pass, so the
     solve settles on a timing instead of swapping people between seats — see
     `RidePins` in `rideOps`. */
  let pins: RidePins | undefined;

  interface Solved {
    geometry: Geometry[];
    approaches: Approach[];
    rideSchedules: RideSchedules;
    boarding: Map<string, { stopIndex: number; rider: RideRider; segments: RideSegment[] }>;
    lateArrivals: LateArrival[];
  }

  const solvePass = (): Solved => {
    /* Fresh on every pass: the same roster must lay out identically given the
       same plans, or the fixed point below has nothing to converge to. */
    /*
     * THE WALK IN, SETTLED BEFORE THE RIDES ARE TOUCHED.
     *
     * Two things decide when somebody reaches the bottom step: how long they
     * spend on a food court chair, and how much earlier than the sheet's
     * check-in they come through the gate. The chair is worked out inside the
     * builder, which knows what the walk costs; the gate is not, because a
     * turnstile is shared and an employee may have to wait a moment for one.
     * So the commute is laid out repeatedly here — each time giving everybody
     * back exactly what the chair could not hold — until nobody is left needing
     * to start earlier than they already do. It is cheap: no ride is scheduled
     * until it settles.
     */
    let commuted!: {
      geometry: Geometry[];
      approaches: Approach[];
      lateArrivals: LateArrival[];
    };
    for (let settle = 0; settle < 8; settle++) {
      const walk = (() => {
      const rand = mulberry32(0x10aded);
      const perRideIndex: Record<string, number> = {};
      const laneOf = new Array<number>(rows.length).fill(0);
      /* The minute each employee actually crosses, which is their own the moment
         a turnstile is free and a moment later when one is not. */
      const crossingAt = new Array<number>(rows.length).fill(0);
      const laneFreeAt: number[] = new Array(LANE_COUNT).fill(-Infinity);
      const crossingOf = (i: number) => rows[i].checkIn + plans[i].shift;
      const checkInOrder = rows
        .map((_, i) => i)
        .sort((a, b) => crossingOf(a) - crossingOf(b) || (a < b ? -1 : 1));
      for (const i of checkInOrder) {
        /*
         * WHICHEVER TURNSTILE IS FREE SOONEST, and if none is free yet they wait
         * the moment or two until one is.
         *
         * It used to REFUSE the roster when every lane was busy, which was safe
         * while everybody crossed at the sheet's own check-in minute and those
         * were spread across a morning. They are not any more: the park is
         * anchored on the Actual Work Start, so a department that all starts work
         * at 9:45 all reaches the gate at the same second, twenty-five minutes
         * earlier, and seventeen turnstiles cannot admit twenty people at once.
         * Queueing for a turnstile is what a gate is for, and the solve gives
         * those seconds back at the other end so the seat still lands on time.
         */
        const want = crossingOf(i);
        let lane = 0;
        for (let k = 1; k < LANE_COUNT; k++) {
          if (laneFreeAt[k] < laneFreeAt[lane]) lane = k;
        }
        const crossing = Math.max(want, laneFreeAt[lane]);
        laneFreeAt[lane] = crossing + CHECK_IN_DWELL;
        laneOf[i] = lane;
        crossingAt[i] = crossing;
      }
      const geometry = rows.map((row, i) => {
        const dept = assigned[i];
        const standIndex = perRideIndex[dept.rideId] ?? 0;
        perRideIndex[dept.rideId] = standIndex + 1;

        const laneOffset = (laneOf[i] - (LANE_COUNT - 1) / 2) * LANE_SPACING;
        const spawn: Pt = [GATE_X + laneOffset * 1.15, SPAWN_Z + (i % 5) * 9];
        const gateWait: Pt = [GATE_X + laneOffset * 0.6, GATE_Z + 30];
        const gate: Pt = [GATE_X + laneOffset * 0.42, GATE_Z];
        const gateInner: Pt = [GATE_X + laneOffset * 0.8, GATE_INNER_Z];
        const { stand, desk, approach, via } = ridePoints(
          dept.rideId,
          standIndex,
          perRideTotal[dept.rideId],
        );
        /* Their own lane on every shared stretch of paving — see `laneOffsetOf`. */
        return {
          dept,
          standIndex,
          spawn,
          gateWait,
          gate,
          gateInner,
          stand,
          desk,
          approach,
          via,
          lane: laneOffsetOf(i),
        };
      });

      /*
       * SEAT ALLOCATION, over the court's eighty real chairs.
       *
       * Diners are served in the order they reach the court and take the
       * lowest-numbered chair that is free at that moment; a chair is released the
       * instant its occupant stands up. Two people can therefore never share a
       * chair, and the assignment is pure bookkeeping — no randomness, so the same
       * dataset always seats the same people in the same places.
       *
       * The route length depends on WHICH chair, and the chair depends on the
       * arrival time, which depends on the route length. The circularity is broken
       * by measuring the walk to the court (which no chair affects) first, sorting
       * on that, and only then handing out seats.
       */
      const diners = rows
        .map((_, i) => i)
        .filter((i) => reportedDelay(rows[i]) > 0)
        .sort((a, b) => crossingOf(a) - crossingOf(b) || (a < b ? -1 : 1));

      /*
       * The order chairs are offered in: every table's first seat before any
       * table's second. Taking simply the lowest-numbered free chair is just as
       * correct — nobody ever shares — but it packs the whole lunch crowd onto the
       * first two tables while eighteen stand empty. Spreading one diner per table
       * first is what a real terrace looks like, and it reads far better from the
       * overview.
       */
      const chairPreference = FOOD_COURT_CHAIRS.map((_, i) => i).sort((a, b) => {
        const A = FOOD_COURT_CHAIRS[a];
        const B = FOOD_COURT_CHAIRS[b];
        return A.seat - B.seat || A.table - B.table;
      });

      const chairFreeAt: number[] = new Array(FOOD_COURT_CHAIRS.length).fill(-Infinity);
      const seating = new Map<number, { chairIndex: number; sit: number }>();

      for (const i of diners) {
        const row = rows[i];
        const g = geometry[i];
        const plan = plans[i];
        /*
         * Reaching the door is the same walk whichever chair they end up in, and
         * everybody walks it at the same pace, so this IS the minute they arrive —
         * not an estimate a later pace change could undercut.
         */
        const door = inLane(FOOD_COURT_DOOR as Pt, g.lane);
        const toDoor = legLength(g.gate, g.gateInner) + legLength(g.gateInner, door);
        const entry = crossingAt[i] + CHECK_IN_DWELL + toDoor / WALK_UNITS_PER_MINUTE;

        const chairIndex = chairPreference.find((c) => chairFreeAt[c] <= entry) ?? -1;
        if (chairIndex === -1) {
          throw new Error(
            `The food court is full at ${formatSimTime(entry)} — ${row.id} has nowhere to sit. ` +
              `All ${FOOD_COURT_CHAIRS.length} chairs are occupied.`,
          );
        }

        const seat = chairPoint(chairIndex);

        /*
         * THE SIT IS WHAT IS LEFT OF THE DELAY once the walking is paid for.
         *
         * It used to be the delay EXACTLY, with the walk outside it, because the
         * brief asked for the time in the food court to equal the Delay Time — a
         * number a viewer can check against a clock. The consequence was recorded
         * rather than hidden: the employee reached their ride LATER than the
         * sheet's Actual Work Start, by the length of the walk, and `LATE_ARRIVALS`
         * said by how much.
         *
         * The user has since made the other end the fixed one: "by the exact actual
         * work start time the employee must be sit on their respective ride". Both
         * cannot hold in a park half a kilometre deep — the walk from the turnstile
         * to a seat is 25 to 29 minutes and the median delay in the workbook is 15
         * — so the seat wins and the chair takes the remainder. An employee whose
         * delay is longer than their journey still sits and waits, for the
         * difference; one whose delay is shorter walks through the court without
         * stopping, and starts their day earlier than the sheet's check-in by what
         * is missing. `EARLY_STARTS` records exactly that, employee by employee.
         *
         * `plans[i].sit` is what the previous pass measured this employee needs; it
         * is solved rather than derived here because what boarding costs — the
         * climb, the platform, the step into the seat — depends on which seat the
         * ride gives them, which is not known until the schedule is solved.
         */
        const sit = plan.sit;

        /*
         * THE CHAIR IS HELD UNTIL THEY GET UP, and getting up is `sit` minutes
         * after they SIT DOWN — which is the walk across the plaza after they
         * reach the door, not the moment they reach it.
         *
         * Reserving from the door under-held the chair by that walk. It did not
         * matter when the court was 80 m across and the walk in was a few seconds;
         * the plaza is 500 m across now and the walk in is most of a minute, which
         * is long enough for the next diner to be handed the same seat.
         */
        const doorToSeat = legLength(door, seat) / WALK_UNITS_PER_MINUTE;
        chairFreeAt[chairIndex] = entry + doorToSeat + sit;
        seating.set(i, { chairIndex, sit });
      }

      /*
       * Gate queue bookkeeping: within a turnstile's own line, anyone whose waiting
       * spell overlaps a lane-mate's stands a human spacing further back, so no two
       * people ever share a spot however tightly the sheet packs its check-ins.
       *
       * The turnstile itself was settled above — one person at a time, first free
       * lane, in check-in order — so there is nothing left here that can fail.
       */
      const laneWaits: { from: number; to: number }[][] = Array.from({ length: LANE_COUNT }, () => []);
      const queue = new Array<{ wait: number; depth: number }>(rows.length);

      for (const i of checkInOrder) {
        const row = rows[i];
        const laneIdx = laneOf[i];
        const wait = QUEUE_WAIT_MIN + rand() * QUEUE_WAIT_SPAN;
        const g = geometry[i];
        const toGate = dist(g.gateWait, g.gate) / WALK_UNITS_PER_MINUTE;
        const from = crossingAt[i] - toGate - wait;
        const to = crossingAt[i] - toGate;
        const depth = laneWaits[laneIdx].filter((w) => w.from < to && w.to > from).length;
        laneWaits[laneIdx].push({ from, to });
        queue[i] = { wait, depth };
      }

      const lateArrivals: LateArrival[] = [];

      /*
       * PASS ONE: the commute, as far as the boarding area.
       *
       * The gate, the food court, the sit that lasts exactly the delay, and the
       * walk out to the ride. The ride cannot be scheduled before this, because a
       * ride's day is solved from the minutes its department turns up.
       */
      const approaches = rows.map((row, i) =>
          buildApproach(
          row,
          geometry[i],
          queue[i],
          seating.get(i) ?? null,
          lateArrivals,
          crossingAt[i],
          row.workStart - plans[i].boardingCost,
        ),
      );


        return { geometry, approaches, lateArrivals };
      })();
      commuted = walk;
      let worstResidual = 0;
      walk.approaches.forEach((a, i) => {
        if (Math.abs(a.gateResidual) > Math.abs(worstResidual)) worstResidual = a.gateResidual;
        plans[i].shift += a.gateResidual;
        plans[i].sit = a.sitMinutes;
      });
      if (Math.abs(worstResidual) <= 1e-9) break;
    }
    const { geometry, approaches, lateArrivals } = commuted;

    /*
     * PASS TWO: each ride's day, from the minutes its own department arrives.
     */
    const arrivalsByRide = Object.fromEntries(
      DEPARTMENT_RIDE_IDS.map((id) => [id, [] as RideArrival[]]),
    ) as Record<DepartmentRideId, RideArrival[]>;
    for (const a of approaches) {
      arrivalsByRide[a.rideId].push({
        employeeId: a.id,
        /* The minute their own walk puts them on the bottom step. The ride is
           solved to be standing at its platform by then. */
        at: a.footAt,
        stand: a.stand,
        desk: a.desk,
        walkSpeed: a.walkSpeed,
      });
    }
    const rideSchedules = Object.fromEntries(
      DEPARTMENT_RIDE_IDS.map((id) => [id, buildRideSchedule(id, arrivalsByRide[id], pins)]),
    ) as RideSchedules;

    const boarding = new Map<string, { stopIndex: number; rider: RideRider; segments: RideSegment[] }>();
    for (const id of DEPARTMENT_RIDE_IDS) {
      const schedule = rideSchedules[id];
      for (const stop of schedule.stops) {
        for (const employeeId of stop.boarding) {
          const rider = schedule.riders[employeeId];
          boarding.set(employeeId, {
            stopIndex: stop.index,
            rider,
            /* Every stretch of running that happens while they are seated. */
            segments: schedule.segments.filter((g) => g.to > rider.seatAt && g.from < rider.riseAt),
          });
        }
      }
    }


    return { geometry, approaches, rideSchedules, boarding, lateArrivals };
  };

  /*
   * THE PASSES. The first lays the day out with nobody sitting and nobody
   * starting early, which puts every seat late; each one after it hands each
   * employee back exactly the minutes they were out by.
   */
  let solved = solvePass();
  /* The best day the solve has seen, kept so that a pass which trades one
     employee's exactness for another's cannot be the one that ships. */
  let best = solved;
  let bestMiss = Infinity;
  const missOf = (day: Solved) =>
    rows.reduce((worst, row) => {
      const rider = day.boarding.get(row.id)?.rider;
      return rider ? Math.max(worst, Math.abs(row.workStart - rider.seatAt)) : worst;
    }, 0);
  const MAX_PASSES = 8;
  for (let pass = 1; pass < MAX_PASSES; pass++) {
    /*
     * EACH PASS LEARNS ONE THING: what boarding actually cost each employee —
     * the climb in their own lane, the walk across the boards to the seat the
     * ride gave them, and the step into it. The walk in is then laid out
     * backward from `workStart − cost`, which puts them in that seat on the
     * minute. It only moves again if the correction changed which seat they
     * get, so the whole thing settles in a couple of passes.
     */
    let worst = 0;
    let moved = 0;
    rows.forEach((row, i) => {
      const rider = solved.boarding.get(row.id)?.rider;
      if (!rider) return;
      /* Measured from the minute they REACH the steps, not the minute they set
         foot on them: on the rare occasion every lane of the stair is busy they
         follow a pace behind, and that pace is part of what boarding cost them. */
      const cost = rider.seatAt - rider.boardAt;
      if (Math.abs(cost - plans[i].boardingCost) > 1e-9) moved++;
      plans[i].boardingCost = cost;
      /* What the last build actually spent on a chair, so the chair is held for
         as long as its occupant is really in it. */
      /* The commute settles its own two knobs; the outer pass only teaches it
         what boarding costs. */
      const error = row.workStart - rider.seatAt;
      if (Math.abs(error) > Math.abs(worst)) worst = error;
    });
    /* Hold the assignment the pass settled on. */
    const seat = new Map<string, number>();
    const lane = new Map<string, number>();
    for (const [id, b] of solved.boarding) {
      seat.set(id, b.rider.seatIndex);
      lane.set(id, b.rider.climbLane);
    }
    pins = { seat, lane };
    if (process.env.SOLVE_DEBUG) {
      console.log(`pass ${pass}: worst ${(worst * 60).toFixed(1)} s, ${moved} costs moved`);
    }
    const miss = missOf(solved);
    if (miss < bestMiss) {
      bestMiss = miss;
      best = solved;
    }
    if (miss <= 1e-9 && moved === 0) break;
    solved = solvePass();
  }
  if (missOf(solved) < bestMiss) best = solved;
  solved = best;

  const { geometry, approaches, rideSchedules, boarding, lateArrivals } = solved;

  /*
   * PASS THREE: board, ride, get off, and stand at the department.
   *
   * `holdUntil` is how long the simulated day runs — the last minute anybody is
   * drawn. It used to be the latest check-out the sheet recorded; `final
   * one.xlsx` has no check-out column, and the park will not invent one, so it
   * is read off the journeys themselves: the minute the last employee is back
   * on the ground beside their department's ride, with the day's usual tail
   * after it. A source that DOES carry check-outs still extends the day to the
   * latest of them, so the upload path keeps the behaviour it had.
   */
  const lastOff = Math.max(
    ...[...boarding.values()].map((b) => b.rider.offAt).filter((t) => Number.isFinite(t)),
  );
  const sheetCheckOuts = rows
    .map((r) => r.checkOut)
    .filter((t): t is number => t !== null && Number.isFinite(t));
  const holdUntil = Math.max(lastOff, ...sheetCheckOuts) + LOOP_TAIL;
  const employees = approaches.map((a) => {
    const seat = boarding.get(a.id);
    if (!seat) {
      throw new Error(`${a.id} arrived at ${a.rideName} but was never given a seat.`);
    }
    return finishJourney(a, seat.stopIndex, seat.rider, seat.segments, holdUntil);
  });

  /*
   * The simulated day, from just before the first person appears outside the
   * gate to just after the last one has walked back out of it. Both ends are
   * read off the routes themselves, so the window can never be shorter than
   * the journeys it has to contain.
   */
  const loopStart = Math.min(...employees.map((e) => e.spawnTime)) - LOOP_LEAD_IN;
  const loopEnd = Math.max(...employees.map((e) => e.despawnTime)) + LOOP_TAIL;

  return {
    employees,
    byId: Object.fromEntries(employees.map((e) => [e.id, e])),
    lateArrivals,
    rideSchedules,
    loopStart,
    loopEnd,
    loopMinutes: loopEnd - loopStart,
    openingMinute: solveOpeningMinute(employees, loopStart),
  };
}

/**
 * Where the playhead opens. Read off the routes, never typed.
 *
 * The arrival window runs from `loopStart` to the minute the last employee
 * actually starts work — after that the whole cast simply stands at its ride
 * until home time, and nothing moves for hours. Inside that window this picks
 * the minute with the most people in the park, requiring that at least one of
 * them is still walking so the opening frame is a moving one. Ties go to the
 * earliest such minute, so the opening is the first time the park is that
 * full rather than the last.
 *
 * The sweep is at quarter-minute resolution, which is finer than any waypoint
 * in a route, so it cannot step over a peak.
 */
function solveOpeningMinute(employees: JourneyEmployee[], loopStart: number): number {
  const lastWorkStart = Math.max(...employees.map((e) => e.workStartActual));

  let bestMinute = loopStart;
  let bestPresent = -1;
  /*
   * Quarter-minute resolution is finer than any waypoint in a route, so it
   * cannot step over a peak — but a delay of 1,439 minutes stretches the
   * arrival window across a day and a half, and sweeping that at 0.25 min over
   * a hundred employees is tens of millions of samples on every date change.
   * The step therefore coarsens on long days and never on short ones, which
   * keeps the built-in day's answer identical to what it always was.
   */
  const step = Math.max(0.25, (lastWorkStart - loopStart) / 4000);
  for (let t = loopStart; t <= lastWorkStart; t += step) {
    let present = 0;
    let moving = 0;
    for (const e of employees) {
      const s = sampleJourney(e, t);
      if (!s) continue;
      present++;
      if (s.moving) moving++;
    }
    if (moving > 0 && present > bestPresent) {
      bestPresent = present;
      bestMinute = t;
    }
  }
  return bestMinute;
}

interface Geometry {
  dept: DepartmentInfo;
  standIndex: number;
  spawn: Pt;
  gateWait: Pt;
  gate: Pt;
  gateInner: Pt;
  stand: Pt;
  /** Their department's own ground beside the ride, where the working day is spent. */
  desk: Pt;
  approach: Pt;
  /** Points that carry the last leg round the boarding deck, if it needs it. */
  via: Pt[];
  /** How far off the centre line of a shared path this employee walks. */
  lane: number;
}

/** What the seat allocator decided for one delayed employee. */
interface Seating {
  chairIndex: number;
  /** Minutes on the chair: the employee's delay, exactly. */
  sit: number;
}

/**
 * Everything an employee's commute produces before the ride takes over: the
 * finished record minus the ride legs, plus the few pieces of geometry the
 * ride legs still need.
 */
interface Approach
  extends Omit<
    JourneyEmployee,
    | "rideArrival"
    | "rideSeatIndex"
    | "rideCycleIndex"
    | "rideSegments"
    | "queueSlot"
    | "climbLane"
    | "descendLane"
    | "boardStart"
    | "ladderAt"
    | "deckAt"
    | "atSeatSpotAt"
    | "seatedAt"
    | "rideStart"
    | "rideEnd"
    | "riseAt"
    | "deckOutAt"
    | "groundAt"
    | "rideExit"
    | "workStartActual"
    | "checkOut"
    | "despawnTime"
  > {
  /** Today's answer for when work starts, before the ride is accounted for. */
  workStartBeforeRide: number;
  /** The minute they set foot on the first step of the boarding stair. */
  footAt: number;
  /** Minutes the chair could not absorb — see `gateResidual` in the builder. */
  gateResidual: number;
  /** Their own spot on the boarding apron, and the fan they walk in through. */
  stand: Pt;
  /** Their department's own ground beside the ride, where the day is spent. */
  desk: Pt;
  approach: Pt;
  spawn: Pt;
  gate: Pt;
  gateInner: Pt;
  /** The source's own check-out minute, if it has one. */
  rowCheckOut: number | null;
}

function buildApproach(
  row: DatasetRow,
  g: Geometry,
  q: { wait: number; depth: number },
  seating: Seating | null,
  lateArrivals: LateArrival[],
  /** The minute they get through the turnstile, queue for it included. */
  crossingAt: number,
  /*
   * THE MINUTE THEY MUST SET FOOT ON THE BOTTOM STEP for their seat to land on
   * the sheet's own Actual Work Start.
   *
   * The park is anchored on that: an employee has to be SITTING ON THEIR RIDE
   * at the minute the sheet gives, so the walk in is laid out backward from it.
   * What boarding costs — the climb, the boards, the step into the seat —
   * depends on which seat the ride hands them, so `buildJourney` measures it
   * off the solved schedule and passes the target back in.
   */
  targetFoot: number,
): Approach {
  const color = checkInColor(row.checkIn);
  const visitsFoodCourt = seating !== null;
  /*
   * ONE PACE FOR EVERYBODY, always. The builder used to hurry a delayed
   * employee along so that their sit came out right; the time is spent on a
   * chair or at the start of the day now, so there is nothing left to hurry for
   * and nobody walks at a speed the data made up.
   */
  const walkSpeed = WALK_UNITS_PER_MINUTE;
  const pace = walkSpeed;

  /*
   * ONE LAYOUT OF THE MORNING, given how long they sit in the food court and
   * how much earlier than the sheet's check-in they come through the gate.
   *
   * It is a function because the answer is solved rather than assumed: the walk
   * is laid out once with neither, which measures what the journey costs, and
   * then once more with whichever of the two makes the foot of the stairs land
   * on `targetFoot`. Both knobs are real places in the park — a chair, and the
   * turnstile — so nobody stands about in the open to burn a minute.
   */
  const layout = (dwell: number) => {
    const route: Waypoint[] = [];

    const checkInAt = crossingAt;
    const walkSpeed = pace;

    // The approach from outside, anchored backwards from the check-in minute.
    const queuePos: Pt = [g.gateWait[0], g.gateWait[1] + q.depth * QUEUE_SPACING];
    const toGate = dist(queuePos, g.gate) / WALK_UNITS_PER_MINUTE;
    const toQueue = dist(g.spawn, queuePos) / WALK_UNITS_PER_MINUTE;
    const spawnTime = checkInAt - toGate - q.wait - toQueue;

    route.push({ x: g.spawn[0], z: g.spawn[1], arrive: spawnTime, depart: spawnTime, phase: "APPROACHING" });
    route.push({
      x: queuePos[0],
      z: queuePos[1],
      arrive: spawnTime + toQueue,
      depart: checkInAt - toGate,
      phase: "QUEUED",
    });
    route.push({
      x: g.gate[0],
      z: g.gate[1],
      arrive: checkInAt,
      depart: checkInAt + CHECK_IN_DWELL,
      phase: "CHECKING_IN",
    });

    // Inside the park, every leg is walked at this employee's pace, bending
    // around the central fountain wherever a straight line would cross it.
    let t = checkInAt + CHECK_IN_DWELL;
    let at: Pt = g.gate;
    const walkTo = (target: Pt, phase: JourneyPhase, viaRing = false) => {
      const pts = walkedLeg(at, target, viaRing, g.lane);
      for (let k = 1; k < pts.length; k++) {
        t += dist(pts[k - 1], pts[k]) / walkSpeed;
        route.push({ x: pts[k][0], z: pts[k][1], arrive: t, depart: t, phase });
      }
      at = target;
    };

    walkTo(g.gateInner, "ENTERING");

    let foodCourtEntry: number | null = null;
    let foodCourtExit: number | null = null;
    let sitStart: number | null = null;
    let sitEnd: number | null = null;

    if (seating) {
      /* Into the court, to a chair of their own, and back out of the same door. */
      walkTo(inLane(FOOD_COURT_DOOR as Pt, g.lane), "TO_FOOD_COURT");
      foodCourtEntry = t;
      const seat = chairPoint(seating.chairIndex);
      walkTo(seat, "IN_FOOD_COURT");
      /*
       * Seated. They rise early enough that walking back to the door still puts
       * their whole visit — door in to door out — at the intended length, so the
       * sit itself is what the delay bought.
       */
      /*
       * THE DWELL IS TIME ON THE CHAIR, and the walk in and out is separate.
       *
       * It used to be subtracted twice. `dwell` is already what the delay has
       * left after ALL the walking — `insideDistance` counts the legs from the
       * door to the table and back — and the rise was then pulled forward by the
       * walk back out a second time, so that the door-to-door visit came to
       * `dwell` and the sit came to less.
       *
       * That was invisible while the court was an 80 m pavilion and the walk
       * from its door to a table was a few seconds. The court is now 500 m
       * across at the middle of the park: the walk in and out is a minute and a
       * half, and subtracting it again left half the diners standing up the
       * instant they sat down — a delay you could not see, which is the one
       * thing the food court exists to show.
       */
      sitStart = t;
      const riseAt = t + dwell;
      sitEnd = riseAt;
      route[route.length - 1].depart = riseAt;
      t = riseAt;
      walkTo(inLane(FOOD_COURT_DOOR as Pt, g.lane), "IN_FOOD_COURT");
      foodCourtExit = t;
      /* Back on to the avenue before setting off for the ride. */
      walkTo(inLane(AVENUE_JOIN as Pt, g.lane), "TO_RIDE");
    }

    walkTo(g.approach, "TO_RIDE", true);
    /* Round the end of the boarding platform, where walking straight at the
       queue would take them underneath it. */
    for (const point of g.via) walkTo(point, "TO_RIDE");
    /*
     * Through their own place on the apron — passed through, not stopped at.
     *
     * Every employee bound for a ride ends up on the same bottom step, so
     * walking them at it from the plot entrance funnels a whole department onto
     * one line and they arrive inside one another. Their own spot on the apron
     * keeps the approaches apart until the last few metres, which is what a fan
     * of people converging on a staircase actually looks like — and it costs no
     * time at all, because nobody stops there any more.
     */
    walkTo(g.stand, "TO_RIDE");

    /*
     * ...AND STRAIGHT ON TO THE BOTTOM STEP. There is nothing to stop for.
     *
     * The apron is the ground beside the stair, not a place anybody stands: the
     * ride is already at rest when they get here, because the schedule is solved
     * from these very minutes and brings it to a stand before they arrive. So an
     * employee walks the last few metres to the foot of the steps without
     * breaking stride, and `footAt` is the minute they set foot on the first one.
     */
    walkTo(stairFor(g.dept.rideId).base as Pt, "WALKING_TO_LADDER");
    const footAt = t;
    return { route, footAt, spawnTime, foodCourtEntry, foodCourtExit, sitStart, sitEnd };
  };

  /*
   * WHAT THE JOURNEY COSTS, measured rather than estimated: the same walk with
   * nobody sitting and nobody starting early.
   */
  const bare = layout(0);
  const slack = targetFoot - bare.footAt;
  /*
   * TIME TO SPARE GOES ON A CHAIR; TIME TO FIND COMES OFF THE START OF THE DAY.
   *
   * A delay longer than the journey leaves the employee sitting in the food
   * court for the difference, which is what a delay looks like. A delay shorter
   * than the journey — 60% of this workbook, because the walk from the
   * turnstile to a seat is 25 to 29 minutes and the median delay is 15 — cannot
   * be absorbed anywhere, so they come through the gate that much earlier and
   * `EARLY_STARTS` records it against their name.
   */
  const dwell = seating && slack > 0 ? slack : 0;
  /*
   * WHAT THE CHAIR COULD NOT ABSORB, handed back so the gate can. A negative
   * figure is an employee who has to come through the turnstile earlier than
   * the sheet's check-in for the walk to fit; `buildJourney` moves them and
   * builds again, and `EARLY_STARTS` reports the total against their name.
   */
  const gateResidual = slack - dwell;
  const { route, footAt, spawnTime, foodCourtEntry, foodCourtExit, sitStart, sitEnd } =
    dwell === 0 ? bare : layout(dwell);


  /*
   * When work begins on screen.
   *
   * Normally the dataset's minute, with the wait at the ride absorbing any
   * slack. But the park is 400-700 m deep, so an employee whose work-start
   * equals their check-in — the sheet's "No Delay" — is physically still
   * walking at that minute. Rather than teleport them or quietly rewrite the
   * sheet, work starts when they actually arrive, and the slip is recorded.
   */
  const workStartBeforeRide = Math.max(footAt, row.workStart);
  if (workStartBeforeRide > row.workStart + 1e-6) {
    lateArrivals.push({
      id: row.id,
      reason: reportedDelay(row) === 0 ? "no-delay-walk" : "walk-after-food-court",
      minutes: workStartBeforeRide - row.workStart,
    });
  }


  return {
    id: row.id,
    name: row.name,
    department: row.department,
    rideId: g.dept.rideId,
    rideName: g.dept.rideName,
    checkInTime: row.checkIn,
    color,
    visitsFoodCourt,
    foodCourtEntry,
    foodCourtExit,
    sitStart,
    sitEnd,
    chairIndex: seating ? seating.chairIndex : null,
    /*
     * Time on the chair. The panel, the dashboard and the checks all read this
     * to mean exactly that — not the door-to-door visit, which is this plus
     * the walk in and the walk out across a 500 m plaza.
     */
    sitMinutes: dwell,
    footAt,
    gateResidual,
    workStart: row.workStart,
    workStartBeforeRide,
    delayMinutes: row.delayMinutes,
    reportedDelayMinutes: reportedDelay(row),
    /* Banded on the sheet's own whole-minute column, so a delay printed as
       "15 mins" bands as fifteen and not as the 15.4 behind it. */
    delayCategory: classifyDelay(reportedDelay(row)),
    walkSpeed,
    spawnTime,
    route,
    stand: g.stand,
    desk: g.desk,
    approach: g.approach,
    spawn: g.spawn,
    gate: g.gate,
    gateInner: g.gateInner,
    rowCheckOut: row.checkOut,
  };
}

/**
 * The ride, and the working day on the other side of it.
 *
 * WHAT THE EMPLOYEE ACTUALLY DOES, in the order a viewer sees it: they wait at
 * the boarding area for their ride to be ready; they walk from their waiting
 * spot to their own seat and climb into it; they stay attached to that seat
 * for the whole dispatch, so the ride carries them rather than leaving them
 * standing where they were; they get out when it has come to rest; and they
 * walk back to their department's spot, which is where work starts.
 *
 * NOTHING IS TELEPORTED. Every leg here is a real leg of a real length walked
 * at that employee's own pace, including the step up into the seat and the
 * step back down out of it, which is why the ride's schedule waits for the
 * slowest of its riders before it is released.
 *
 * WHEN WORK STARTS. The sheet's minute, or the minute they are off the ride if
 * the ride could not physically be over by then — the same rule the walk from
 * the gate already obeys, extended to the last leg of the commute. The
 * dataset's own Actual Work Start is carried through untouched on `workStart`,
 * which is what the ride panel prints.
 */
/**
 * The climb itself, as waypoints on the real stair.
 *
 * The path is the one `boardingStair.ts` solved — the foot of the first step,
 * every landing, and the head of the last flight — so a figure walking it is on
 * the treads the whole way and turns at each landing the way a person on a
 * switchback does. Times are spread by distance along it, which makes the pace
 * constant, and the same path is walked in reverse on the way down.
 *
 * There is deliberately no waypoint per step: the noses of one flight are
 * collinear, so a waypoint at each would trace exactly the same line. What
 * makes the motion read as stepping rather than sliding is the character's
 * Climb clip, not the path.
 */
function pushStairPath(
  route: Waypoint[],
  stair: BoardingStair,
  from: number,
  to: number,
  descending: boolean,
  /*
   * WHICH LANE ACROSS THE FLIGHT they walk in, so that two people who reach the
   * steps at the same moment both go straight up rather than one of them
   * standing at the bottom. The offset is applied from the first tread upward —
   * the ground at the foot is common to everybody, and they are only in the
   * same place there for the instant they step onto the stair.
   */
  lane: number,
  /* The last point of an ascent is the boarding deck itself, so that step off
     the top tread is where the climb ends and the platform begins. */
  finalPhase: JourneyPhase = "CLIMBING_LADDER",
): void {
  const lanePath = stairLanePath(stair, lane);
  /*
   * Every point is walked in the lane, except the one an employee walking IN
   * arrives at: the middle of the bottom step, which is where their walk was
   * aimed before any of this was scheduled, and which they leave for their own
   * side of the steps on the first tread. Coming down they finish in their own
   * lane instead, and walk to their department from there.
   */
  const walked = descending
    ? [...lanePath].reverse()
    : /* Across the bottom step to their own side of it, and then up: the walk in
         was aimed at the middle of the stair before the schedule knew which lane
         would be free, so the last stride of it is on the ground rather than
         diagonally through the first riser. */
      [stair.path[0], ...lanePath];
  const points: (readonly [number, number, number])[] = walked;
  const spans: number[] = [];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const d = Math.hypot(
      points[i][0] - points[i - 1][0],
      points[i][1] - points[i - 1][1],
      points[i][2] - points[i - 1][2],
    );
    spans.push(d);
    total += d;
  }
  let covered = 0;
  for (let i = 1; i < points.length; i++) {
    covered += spans[i - 1];
    /* The last point of the climb is the platform head (or the foot of the
       stair going down), which the caller pushes itself. */
    if (i === points.length - 1) break;
    const t = from + (to - from) * (total > 0 ? covered / total : 1);
    route.push({
      x: points[i][0],
      y: points[i][1],
      z: points[i][2],
      arrive: t,
      depart: t,
      phase: "CLIMBING_LADDER",
    });
  }
  const last = points[points.length - 1];
  route.push({
    x: last[0],
    y: last[1],
    z: last[2],
    arrive: to,
    depart: to,
    phase: finalPhase,
  });
}

function finishJourney(
  a: Approach,
  stopIndex: number,
  rider: RideRider,
  segments: RideSegment[],
  holdUntil: number,
): JourneyEmployee {
  const route = a.route;
  const walkSpeed = a.walkSpeed;

  const stair = stairFor(a.rideId);

  /*
   * NO WAITING AT THE FOOT OF THE STAIR — the approach already ended there.
   *
   * `buildApproach` walks the employee all the way to the bottom step, and the
   * schedule is solved from that minute: the ride is at rest and a seat is
   * ready before they get there. There used to be two waypoints here, one for
   * holding on the apron and one for standing in a numbered place in the line,
   * and both are gone because nothing is held any more.
   *
   * The one thing that can still move a boarder is the person immediately in
   * front of them on the steps, who must be a pace clear before the next treads
   * on them. `rider.ladderAt` carries that; where it is later than the minute
   * they arrived, the difference is a few seconds of letting somebody up.
   */
  if (rider.ladderAt > a.footAt + 1e-9) {
    /*
     * THE RARE EMPLOYEE WHO DOES HAVE TO WAIT stands in their own place in the
     * line rather than on the bottom step, because two of them would otherwise
     * be in the same spot — and they WALK to it, which is the part that took
     * two goes to get right. The approach already ended on the bottom step, so
     * the waypoint there is turned into the walk to their place; putting the
     * place after it instead left them stepping sideways out of the staircase
     * without covering the ground between.
     */
    const place = queuePlace(stair, rider.queueSlot);
    const arriveAtStep = route[route.length - 1];
    const before = route[route.length - 2];
    const backOff = dist(place as Pt, stair.base as Pt) / walkSpeed;
    if (rider.ladderAt - a.footAt <= backOff) {
      /*
       * A HOLD TOO SHORT TO WALK OUT OF THE WAY IS TAKEN ON THE STEP. Most of
       * what is left of waiting in this park is a second or two while the
       * person in front clears the bottom tread — walking five metres back to
       * a place in a line and returning would take longer than the hold
       * itself, and would have to be walked at four times a walking pace to
       * fit. They pause where they are, which is what anybody does.
       */
      arriveAtStep.phase = "WAITING_AT_LADDER";
      arriveAtStep.depart = rider.ladderAt;
    } else {
      arriveAtStep.x = place[0];
      arriveAtStep.z = place[1];
      arriveAtStep.phase = "WAITING_AT_LADDER";
      /* Both ends of the leg move with the point: they reach their place a
         little before they would have reached the step, since the line stands
         short of it, and set off in time to be on the step at `ladderAt`. */
      arriveAtStep.arrive =
        before.depart + dist([before.x, before.z], place as Pt) / walkSpeed;
      arriveAtStep.depart = rider.ladderAt - backOff;
      route.push({
        x: stair.base[0],
        z: stair.base[1],
        arrive: rider.ladderAt,
        depart: rider.ladderAt,
        phase: "WALKING_TO_LADDER",
      });
    }
  }

  /* Up the flights, landing by landing, and off the top step onto the deck. */
  pushStairPath(route, stair, rider.ladderAt, rider.deckAt, false, rider.climbLane, "ON_PLATFORM");

  /* Across the platform to their own seat's place at its edge. */
  const spot = deckSpotFor(stair, rider.seatIndex);
  route.push({
    x: spot[0],
    y: spot[1],
    z: spot[2],
    arrive: rider.atSeatSpotAt,
    depart: rider.atSeatSpotAt,
    phase: "WALKING_TO_SEAT",
  });

  /*
   * Down into the seat, carried by the ride, and back off it again.
   *
   * The stored position is the seat's place while the ride stands at rest,
   * which is where it really is for the climb in and the climb out; in between,
   * `sampleJourney` reads the seat's LIVE pose instead, so a rider travels with
   * the machine for as long as it runs.
   */
  const rest = seatPose(a.rideId, rider.seatIndex, 0);
  route.push({
    x: rest.x,
    y: rest.y,
    z: rest.z,
    arrive: rider.seatAt,
    depart: rider.seatAt,
    phase: "BOARDING",
  });
  route.push({
    x: rest.x,
    y: rest.y,
    z: rest.z,
    arrive: rider.seatAt,
    depart: rider.riseAt,
    phase: "SITTING_ON_RIDE",
  });

  /*
   * OFF THE RIDE, AND THE SEAT GOES BACK INTO SERVICE.
   *
   * The seat used to be the last waypoint: a rider stayed in it for the rest of
   * the day. That capped a ride's whole day at the ten seats its deck reaches
   * — fifty across the park — and this workbook puts up to ninety-six people
   * through a single date, so the last half of a morning had nowhere to sit.
   *
   * A rider now does what a rider does: stands up once the machine is at rest,
   * steps onto the deck beside their seat, crosses to the head of the stair,
   * waits their turn on it, walks down and returns to their department's spot,
   * where their working day carries on. Every minute here was solved by
   * `rideOps.ts` against the one-person stair and the ride's own resting pose,
   * and every leg is a real leg walked at this employee's own pace.
   */
  const spotOut = deckSpotFor(stair, rider.seatIndex);
  route.push({
    x: spotOut[0],
    y: spotOut[1],
    z: spotOut[2],
    arrive: rider.deckSpotOutAt,
    depart: rider.deckSpotOutAt,
    phase: "EXITING_RIDE",
  });
  const head = stairHead(stair, rider.descendLane);
  route.push({
    x: head[0],
    y: head[1],
    z: head[2],
    arrive: rider.atStairHeadAt,
    /* And they set off down at the minute they get here: the stair is three
       shoulders wide, so they take a lane rather than a turn. */
    depart: rider.deckOutAt,
    phase: "EXITING_RIDE",
  });
  pushStairPath(route, stair, rider.deckOutAt, rider.groundAt, true, rider.descendLane, "EXITING_RIDE");

  /*
   * Off to their department's own ground beside the ride, and that is where the
   * day ends: work has started, and they stay there until the simulation runs
   * out of day. Beside it, not in front of it — the frontage belongs to the
   * people walking in and getting on.
   */
  route.push({
    x: a.desk[0],
    z: a.desk[1],
    arrive: rider.offAt,
    depart: holdUntil,
    phase: "WORKING",
  });

  /*
   * WORK HAS STARTED once they are in the seat — the sheet's own minute, or
   * the minute they sat down if the walk and the climb could not physically be
   * over by then. The dataset's Actual Work Start is carried through untouched
   * on `workStart`, which is what the ride panel prints.
   */
  const workStartActual = Math.max(a.workStartBeforeRide, rider.seatAt);

  return {
    id: a.id,
    name: a.name,
    department: a.department,
    rideId: a.rideId,
    rideName: a.rideName,
    checkInTime: a.checkInTime,
    color: a.color,
    visitsFoodCourt: a.visitsFoodCourt,
    sitStart: a.sitStart,
    sitEnd: a.sitEnd,
    foodCourtEntry: a.foodCourtEntry,
    foodCourtExit: a.foodCourtExit,
    chairIndex: a.chairIndex,
    sitMinutes: a.sitMinutes,
    /* REACHING THE RIDE IS SITTING DOWN ON IT. The climb, the deck and the step
       into the seat are the last legs of the walk in rather than something that
       happens after arriving, so there is no gap between the two at all. */
    rideArrival: rider.seatAt,
    rideSeatIndex: rider.seatIndex,
    rideCycleIndex: stopIndex,
    rideSegments: segments,
    queueSlot: rider.queueSlot,
    climbLane: rider.climbLane,
    descendLane: rider.descendLane,
    boardStart: rider.boardAt,
    ladderAt: rider.ladderAt,
    deckAt: rider.deckAt,
    atSeatSpotAt: rider.atSeatSpotAt,
    seatedAt: rider.seatAt,
    /* The first and last moments the ride turns with them aboard. */
    rideStart: segments.length ? segments[0].from : rider.seatAt,
    /*
     * Clamped to the end of the day. Rides now turn whenever nobody is getting
     * on them, so the last stretch of running a seated employee is aboard for
     * carries on past closing — but they leave the stage at `holdUntil`, and a
     * ride that turns with them aboard after that is not something the journey
     * can be sampled for.
     */
    rideEnd: Math.min(
      holdUntil,
      segments.length ? segments[segments.length - 1].to : rider.riseAt,
    ),
    riseAt: rider.riseAt,
    deckOutAt: rider.deckOutAt,
    groundAt: rider.groundAt,
    rideExit: rider.offAt,
    workStart: a.workStart,
    workStartActual,
    workStartBeforeRide: a.workStartBeforeRide,
    /* The sheet's own check-out minute, carried through untouched. Nothing
       acts on it any more: they are still in their seat when it passes. */
    checkOut: a.rowCheckOut,
    delayMinutes: a.delayMinutes,
    reportedDelayMinutes: a.reportedDelayMinutes,
    delayCategory: a.delayCategory,
    walkSpeed,
    spawnTime: a.spawnTime,
    /* They never leave, so they are on stage until the day ends. */
    despawnTime: holdUntil,
    route,
  };
}

/**
 * The built-in roster's journey — EMPLOYEE_DATASET through the same builder an
 * upload goes through. These module constants are what the park boots with,
 * what the verify suite asserts against, and what `reset` restores.
 */
export const BUILTIN_JOURNEY: JourneyData = buildJourney(EMPLOYEE_DATASET);

export const JOURNEY_EMPLOYEES: JourneyEmployee[] = BUILTIN_JOURNEY.employees;

export const EMPLOYEE_BY_ID: Record<string, JourneyEmployee> = BUILTIN_JOURNEY.byId;

export const LATE_ARRIVALS: LateArrival[] = BUILTIN_JOURNEY.lateArrivals;

export const LOOP_START = BUILTIN_JOURNEY.loopStart;
export const LOOP_END = BUILTIN_JOURNEY.loopEnd;
export const LOOP_MINUTES = BUILTIN_JOURNEY.loopMinutes;
/** The minute the built-in roster's playhead opens on. See `JourneyData`. */
export const OPENING_MINUTE = BUILTIN_JOURNEY.openingMinute;

export interface JourneySample {
  x: number;
  z: number;
  /** Height above the ground. Zero for every leg walked on it. */
  y: number;
  /** Heading in radians, for facing the direction of travel. */
  facing: number;
  /**
   * Tilt imposed by whatever the employee is attached to. Zero on the ground;
   * on a ride it is the seat's own pitch and roll, which is what makes a rider
   * lean with the machine instead of standing bolt upright inside it.
   */
  pitch: number;
  roll: number;
  /** True while actually walking, so the gait only animates on the move. */
  moving: boolean;
  /** True while strapped into a ride seat — seated, and carried by the ride. */
  onRide: boolean;
  /**
   * True once this employee's work has actually started.
   *
   * It used to be a phase of its own, because work began when they reached
   * their ride and they then walked home. They now stay in their seat for the
   * rest of the day, so "working" is no longer somewhere they stand — it is a
   * fact about the clock, and this is it.
   */
  working: boolean;
  phase: JourneyPhase;
}

/**
 * Where an employee is at a given sim time, or null if they have not arrived
 * outside the gate yet. Position is linearly interpolated along the leg, which
 * is what makes the walk constant-speed: leg durations were themselves derived
 * from leg lengths.
 */
export function sampleJourney(e: JourneyEmployee, simTime: number): JourneySample | null {
  const route = e.route;
  /* Not yet arrived outside the gate, or already gone home for the night. */
  if (simTime < route[0].arrive || simTime > e.despawnTime) return null;

  /*
   * The first waypoint this employee has not yet left, found by bisection.
   *
   * Departure times increase along a route, so the scan this used to do is a
   * binary search wearing a disguise — and routes grew from forty waypoints to
   * nearly three hundred when the boarding stairs put every tread on them.
   * Same answer, found in nine steps instead of three hundred.
   */
  let lo = 0;
  let hi = route.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (route[mid].depart >= simTime) hi = mid;
    else lo = mid + 1;
  }

  for (let i = lo; i < route.length; i++) {
    const w = route[i];

    if (simTime <= w.depart || i === route.length - 1) {
      if (simTime >= w.arrive) {
        /*
         * Seated on the ride: the seat itself is what moves, so the employee's
         * place is read off the ride's live geometry rather than off a fixed
         * waypoint. While the ride is stopped this returns exactly the resting
         * pose the waypoint stores, so the climb in and the climb out join up.
         */
        if (w.phase === "SITTING_ON_RIDE") {
          const t = segmentAnimationSeconds(e.rideId, e.rideSegments, simTime);
          const seat = seatPose(e.rideId, e.rideSeatIndex, t);
          return {
            x: seat.x,
            y: seat.y,
            z: seat.z,
            facing: seat.yaw,
            pitch: seat.pitch,
            roll: seat.roll,
            moving: false,
            onRide: true,
            working: simTime >= e.workStartActual,
            phase: w.phase,
          };
        }
        // Standing at this waypoint.
        const next = route[i + 1];
        const facing = next
          ? Math.atan2(next.x - w.x, next.z - w.z)
          : Math.atan2(GATE_X - w.x, GATE_Z - w.z);
        return {
          x: w.x,
          y: w.y ?? 0,
          z: w.z,
          facing,
          pitch: 0,
          roll: 0,
          moving: false,
          onRide: false,
          working: simTime >= e.workStartActual,
          phase: w.phase,
        };
      }
      // Walking towards it from the previous waypoint.
      const prev = route[i - 1];
      const span = w.arrive - prev.depart;
      const k = span > 0 ? (simTime - prev.depart) / span : 1;
      const dx = w.x - prev.x;
      const dz = w.z - prev.z;
      const py = prev.y ?? 0;
      const dy = (w.y ?? 0) - py;
      return {
        x: prev.x + dx * k,
        y: py + dy * k,
        z: prev.z + dz * k,
        facing: Math.atan2(dx, dz),
        pitch: 0,
        roll: 0,
        /* Climbing into or out of a seat is not a walk — the feet are off the
           ground — so the gait must not be driven by it. */
        moving: Math.hypot(dx, dz) > 1e-6,
        onRide: false,
        working: simTime >= e.workStartActual,
        phase: w.phase,
      };
    }
  }

  const last = route[route.length - 1];
  return {
    x: last.x,
    y: last.y ?? 0,
    z: last.z,
    facing: 0,
    pitch: 0,
    roll: 0,
    moving: false,
    onRide: false,
    working: simTime >= e.workStartActual,
    phase: last.phase,
  };
}

/** Human-readable time, or a dash when the employee never went. */
export function timeOrDash(minutes: number | null): string {
  return minutes === null ? "—" : formatSimTime(minutes);
}
