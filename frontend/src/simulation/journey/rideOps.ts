import type { DepartmentRideId } from "@/components/park/departments";
import { createRide } from "@/simulation/ride";
import { ridePeriodSeconds, seatPose } from "./rideKinematics";
import {
  BOARDING_STAIRS,
  CLIMB_LANES,
  CLIMB_PACE_FRACTION,
  QUEUE_PITCH,
  deckSpotFor,
  stairFoot,
  stairFor,
  stairHead,
  stairLaneLength,
  STAIR_GOING,
  STAIR_RISE,
} from "./boardingStair";
import { EMPLOYEE_SCALE, HUMAN } from "@/world/scale";

/** Two people are clear of one another once their shoulders are. */
const SHOULDER_CLEARANCE = HUMAN.shoulderWidth * EMPLOYEE_SCALE;

/**
 * A SHOULDER, MEASURED THE WAY A STAIR MEASURES DISTANCE.
 *
 * Two climbers' separation is easiest to reason about as path length — how much
 * further up the flights one of them is — but a staircase's path is longer than
 * the ground it covers: a climber walks up the riser and then along the tread,
 * 0.52 u of walking for 0.38 u of travel. So a shoulder of real space between
 * two people is 1.38 shoulders of path between them, and using the shoulder
 * itself let two people a pace apart on the treads stand inside one another.
 */
const CLEARANCE_ALONG =
  (SHOULDER_CLEARANCE * (STAIR_RISE + STAIR_GOING)) / Math.hypot(STAIR_RISE, STAIR_GOING);

/**
 * RIDE OPERATIONS: stop, load, run, stop, unload.
 *
 * Until now every ride in the park turned continuously from the moment the
 * page opened, and the employees walked up to it and stood beside it. This
 * module is the missing half: each department ride stands stopped until one of
 * its department turns up, takes them aboard, runs, comes back to rest and lets
 * them off again.
 *
 * ONE EMPLOYEE IS ENOUGH, AND NOBODY WAITS FOR ANYBODY. There is no minimum,
 * no group, and no waiting for a department to assemble: an employee who
 * reaches their ride alone climbs aboard alone and the ride goes with one
 * person in it. Nor do they wait for each other at the steps — the stair is
 * three shoulders wide and they climb abreast, in lanes. The one thing that can
 * still hold anybody is the machine having no free seat to offer, which is a
 * fact about the ride and not about another employee.
 *
 * The run itself is still the park's own: `createRide()`'s sixty-seat capacity
 * and its four-minute run, read straight out of the existing simulation module.
 * `minStartCount` is no longer consulted at all.
 *
 * IT IS A SCHEDULE, NOT A TICKING STATE MACHINE, and that is deliberate. The
 * whole journey is already a pure function of the simulated clock, which is
 * what makes scrubbing the timeline exact and pausing cost nothing. Ride
 * operations are solved the same way: `buildRideSchedules()` runs once per
 * roster and every question afterwards — what state is this ride in, who is
 * seated, where is its animation — is answered by looking the minute up.
 * Play, pause, 60x and reset therefore need no code at all here; they are
 * simply different ways of choosing which minute to ask about.
 */

/** The park's one ride definition. Every number below is read off it. */
const RIDE_RULES = createRide();

/** Sixty seats — unchanged. */
export const RIDE_CAPACITY = RIDE_RULES.capacity;
/**
 * The park's old group minimum, kept only so the verification can prove it is
 * NOT what gates boarding any more. Nothing in this module reads it.
 */
export const RIDE_MIN_START_COUNT = RIDE_RULES.minStartCount;

/**
 * How many people a ride holds AT ONCE — the seats its boarding deck reaches,
 * capped by the ride.
 *
 * It used to be how many it could take on over the whole day, because a seat
 * taken was a seat kept. Riders now get off when their ride is over, so the
 * deck is a standing-room figure rather than a lifetime one, and a ride can
 * take on far more people in a day than it has seats — which is what a real
 * ride does and what a roster of ninety-six employees needs.
 *
 * This is the same `stair.seats.slice(0, RIDE_CAPACITY)` that
 * `buildRideSchedule` below deals out, named once so that nothing has to
 * re-derive it and get it wrong.
 *
 * It lives here rather than beside `boardingSeats()` in rideKinematics.ts for
 * a plain reason: the deck is solved in boardingStair.ts, which imports
 * rideKinematics, so rideKinematics cannot look the other way without a cycle.
 * This module already depends on both.
 */
export function rideIntake(rideId: DepartmentRideId): number {
  return Math.min(RIDE_CAPACITY, stairFor(rideId).seats.length);
}

/**
 * How many people the whole park seats at once.
 *
 * NO LONGER A CEILING ON A ROSTER. While nobody got off it was one, and
 * `rosterRepair.ts` trimmed an upload down to it; now that seats come free
 * again a park of fifty places can carry any number of employees through a
 * day, so what this bounds is how many can be ON the rides in the same minute.
 */
export function parkIntake(): number {
  return (Object.keys(BOARDING_STAIRS) as DepartmentRideId[]).reduce(
    (total, id) => total + rideIntake(id),
    0,
  );
}
/** Four simulated minutes of running. Unchanged. */
export const RIDE_RUN_MINUTES = RIDE_RULES.runDurationMinutes;

/**
 * The ride's own animation runs on the SIMULATED clock, one animation second
 * per simulated second, so a ride and the people walking towards it stay in
 * step at 1x, 5x, 10x and 60x alike.
 */
export const RIDE_RUN_SECONDS = RIDE_RUN_MINUTES * 60;

/* ------------------------------------------------------------------ */
/* Timings the boarding sequence itself needs                          */
/* ------------------------------------------------------------------ */

/** The moment of arrival at the boarding area, before the wait begins. */
export const AT_RIDE_DWELL = 0.2;
/** Stepping up off the ground into the seat, and back down again. */
export const SEAT_CLIMB_MINUTES = 0.25;
/** Restraints down and checked, between the last rider seating and the start. */
export const READY_MINUTES = 0.3;
/**
 * Lowering into the seat, and rising out of it again — a FLOOR, not the whole
 * duration.
 *
 * It used to be the whole of it: the step from the platform spot into the seat
 * took a flat 0.2 min however far it was. That is fine when the spot is beside
 * the seat and wrong when it is not — on the Monster Ride the deck spot is
 * eighteen metres from the seat, which at a flat 0.2 min is ninety-four metres
 * a minute, faster than this park's base walking pace. The employee was
 * briefly moving faster than they are allowed to.
 *
 * So the step is now paced by the person taking it, and this is the minimum it
 * can take — the settling into the seat that happens whatever the distance.
 */
export const SEAT_STEP_MINUTES = 0.2;
/** The tail of a run, during which the ride is easing to a halt. */
export const RIDE_COMPLETING_MINUTES = 0.6;
/** Riders stay in their seats a moment after the ride comes to rest. */
export const SEATED_HOLD_MINUTES = 0.3;

/* ------------------------------------------------------------------ */
/* The state machine                                                   */
/* ------------------------------------------------------------------ */

/**
 * There is deliberately no state here for waiting on a group. A ride is either
 * stopped with nobody aboard, loading somebody, or working.
 */
export const RIDE_STATES = [
  "STOPPED",
  "EMPLOYEE_BOARDING",
  "EMPLOYEE_SEATED",
  "RUNNING",
  "RIDE_COMPLETED",
  "EMPLOYEE_EXITING",
] as const;

export type RideState = (typeof RIDE_STATES)[number];

export const RIDE_STATE_LABEL: Record<RideState, string> = {
  STOPPED: "Stopped",
  EMPLOYEE_BOARDING: "Employee boarding",
  EMPLOYEE_SEATED: "Employee seated",
  RUNNING: "Running",
  RIDE_COMPLETED: "Ride completed",
  EMPLOYEE_EXITING: "Employee exiting",
};

/* ------------------------------------------------------------------ */
/* Inputs and outputs                                                  */
/* ------------------------------------------------------------------ */

/** One employee standing at a ride's boarding area, waiting for a seat. */
export interface RideArrival {
  employeeId: string;
  /** Simulated minute they join the boarding area. */
  at: number;
  /** Where they wait, in world x/z — their own spot on the apron. */
  stand: readonly [number, number];
  /** Their department's own ground beside the ride, where the day is spent. */
  desk: readonly [number, number];
  /** Their own walking pace, in world units per simulated minute. */
  walkSpeed: number;
}

/**
 * What one employee does across one dispatch of their ride — the whole
 * sequence, minute by minute.
 *
 * Boarding is SEQUENTIAL. The stair is one person wide, so each rider has the
 * whole of it from the moment they set foot on the bottom step to the moment
 * they step off at the top, and the next one waits in the queue for it. That is
 * why `ladderAt` is not the same for everybody in a group while `boardAt` is.
 */
export interface RideRider {
  employeeId: string;
  seatIndex: number;
  /** Their place in the boarding line, nearest the steps first. */
  queueSlot: number;
  /** Which lane across the flight they climb in, so nobody waits to start. */
  climbLane: number;
  /** And which they come down in. */
  descendLane: number;
  /** Boarding opens: they leave the apron for the queue at the stair. */
  boardAt: number;
  /** Sets foot on the bottom step — the minute they got there. */
  ladderAt: number;
  /** Off the top step, standing on the boarding deck. */
  deckAt: number;
  /** At their own seat's place on the deck. */
  atSeatSpotAt: number;
  /** Seated, and from here attached to the seat. */
  seatAt: number;
  /** Stands up out of the seat once the ride has stopped. */
  riseAt: number;
  /** Standing on the deck beside the seat they have just left. */
  deckSpotOutAt: number;
  /** Back at the head of the stair. */
  atStairHeadAt: number;
  /** Steps onto the top step to go down. */
  deckOutAt: number;
  /** Steps off the bottom of the stair, back on the ground. */
  groundAt: number;
  /** Clear of the ride, back at their department's spot. */
  offAt: number;
}

/**
 * One stretch of a ride actually turning.
 *
 * A ride no longer runs one fixed four-minute cycle per load. It runs in
 * SEGMENTS, and a segment ends the moment there is a reason to be at rest —
 * somebody has arrived and wants to get on, or somebody aboard has had their
 * ride and wants to get off. A segment is a whole number of the ride's own
 * rest-to-rest loops, which is what puts its seats back at the platform, and
 * that is the shortest a ride can honestly be brought to a stand.
 */
export interface RideSegment {
  /** The ride is released. */
  from: number;
  /** It is back at rest, in the pose it started in. */
  to: number;
  /** Whole loops of this ride's own cycle. */
  loops: number;
  /**
   * Minutes of wind-up at the start and wind-down at the end.
   *
   * A DISPATCH leaves this unset and eases across its whole length, which is
   * right for a run that lasts a couple of minutes. An IDLE run does not: it
   * may last hours, and a ride that spent an hour accelerating and an hour
   * slowing down would crawl. Those wind up, turn at their own speed for as
   * long as nobody needs them, and wind down again.
   */
  ease?: number;
}

/** One stretch of a ride standing still, with people getting on and off. */
export interface RideStop {
  index: number;
  /** The ride comes to rest. */
  from: number;
  /** It is released again — Infinity for the last stop of the day. */
  to: number;
  /** Employee ids getting on here, in arrival order. */
  boarding: string[];
  /** Employee ids getting off here. */
  leaving: string[];
}

export interface RideSchedule {
  rideId: DepartmentRideId;
  /** Everyone who ever comes to this ride, in arrival order. */
  arrivals: RideArrival[];
  segments: RideSegment[];
  stops: RideStop[];
  /** Every rider's own minutes, by employee id. */
  riders: Record<string, RideRider>;
}

export type RideSchedules = Record<DepartmentRideId, RideSchedule>;

/* ------------------------------------------------------------------ */
/* Solving the schedule                                                */
/* ------------------------------------------------------------------ */

/**
 * ONE BOARDING STAIR PER DEPARTMENT RIDE, solved once from that ride's own
 * geometry. See `boardingStair.ts` — every ride gets its own, on its own side,
 * at its own height, and no two share one.
 */
export { BOARDING_STAIRS, stairFor };

function dist(a: readonly [number, number], b: readonly [number, number]): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

/**
 * One ride's day, solved from the minutes its department actually turns up.
 *
 * THE DISPATCH RULE IS THE PARK'S OWN. A stopped ride waits until
 * RIDE_MIN_START_COUNT employees are standing at it and then takes them —
 * exactly the condition `engine.ts` already dispatches on. The existing
 * RIDE_MAX_WAIT_MINUTES backstop is kept for the one case it exists for: a
 * group that can never be completed because nobody else is coming. Without it
 * the last four employees of a department would stand at their ride for the
 * rest of the day.
 *
 * A dispatch takes at most as many people as there are seats at the platform,
 * so anyone left over waits for the ride to come back — which is the
 * already-running case, seen from the queue.
 */
function dist3(a: readonly [number, number, number], b: readonly [number, number, number]): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
}

/**
 * ONE RIDE'S DAY, first come first served, with the ride interruptible.
 *
 * THE RULE, in full: an employee is served in the order they reached the ride,
 * and never waits for anything but the three physical facts — the stair being
 * one person wide, the deck having a free seat, and the ride needing to be at
 * rest before anyone can step onto it. There is no minimum, no group, no
 * department count and no waiting for a ride to fill.
 *
 * WHAT INTERRUPTION MEANS HERE. A running ride does not have to finish a
 * four-minute cycle before it will take somebody new. The moment a fresh
 * arrival appears, the ride finishes the circuit it is on — which is the
 * shortest honest way to bring seats back to a platform, and which is what
 * makes the stop smooth rather than a snap — comes to rest, takes them aboard
 * beside whoever is already seated, and is released again. Nobody sits through
 * somebody else's ride.
 *
 * SO A RIDE IS A SEQUENCE OF SEGMENTS, not a sequence of loads. A rider's own
 * ride is complete once they have accumulated the park's existing four minutes
 * of actual running, however many stops that was spread across, and they step
 * off at the next time the ride is at rest.
 *
 * The longest anybody can be kept waiting for a seat is therefore one loop of
 * that ride — 63 simulated seconds on the Ferris Wheel, 29 on the coaster, 17
 * on the Drop Tower and 2 on the Dragon Ship — plus the walk up the stair.
 */
/**
 * WHICH SEAT AND WHICH LANE EACH EMPLOYEE HAD LAST TIME, when the day is being
 * solved rather than simply built.
 *
 * The park is anchored on the sheet's Actual Work Start: the walk in is laid
 * out backward from it, which needs to know what boarding costs, which depends
 * on which seat the ride gives them — the boards are eighty metres long and the
 * walk to the far seat is a minute. Measuring that and feeding it back moves
 * everybody slightly, and two employees a few seconds apart could then swap
 * seats and swap costs with them, pass after pass, so the solve never settled.
 *
 * Pinning breaks it: once an assignment is known it is honoured, so the second
 * pass changes only the timing and lands every seat on its own minute. A pin is
 * a preference and not a promise — if that seat is genuinely taken when they
 * reach the platform, the search runs as usual.
 */
export interface RidePins {
  seat: ReadonlyMap<string, number>;
  lane: ReadonlyMap<string, number>;
}

export function buildRideSchedule(
  rideId: DepartmentRideId,
  arrivalsIn: RideArrival[],
  pins?: RidePins,
): RideSchedule {
  /* FIRST COME, FIRST SERVED. Ties break on employee id only so the build is
     deterministic; the minute they reach the bottom step is what orders them. */
  const arrivals = [...arrivalsIn].sort(
    (a, b) => a.at - b.at || (a.employeeId < b.employeeId ? -1 : 1),
  );
  const stair = stairFor(rideId);
  const loopMinutes = ridePeriodSeconds(rideId) / 60;

  /*
   * WHEN EACH ARRIVAL IS ON THE STAIR, worked out once and remembered.
   *
   * An employee starts climbing the second they reach the bottom step, whatever
   * the ride is doing, so their climb belongs to them rather than to a stop:
   * the same figures are needed to decide how long the ride may keep turning
   * before it has to be standing for them, and again when the stop that takes
   * them aboard comes round. Recomputing it in the second place would hand them
   * a second lane on the steps.
   */
  const climbPlan = new Map<string, { ladderAt: number; climbLane: number; deckAt: number }>();

  const segments: RideSegment[] = [];
  const stops: RideStop[] = [];
  const riders: Record<string, RideRider> = {};
  if (arrivals.length === 0) return { rideId, arrivals, segments, stops, riders };

  const deckOrder = stair.seats.slice(0, RIDE_CAPACITY);

  interface Seated {
    a: RideArrival;
    r: RideRider;
    /**
     * The minute their ride is up — sitting down plus the park's own four.
     *
     * WALL CLOCK, NOT ACCUMULATED RUNNING, and the change is forced by the
     * promise made to the employees. A ride that is at rest whenever anybody is
     * walking up its steps spends a great deal of the morning stopped, and a
     * rider who only counts the minutes it is actually TURNING can sit there
     * for hours waiting for the machine to be free — measured at twenty-two on
     * the Dragon Ship — while their seat is denied to everybody behind them.
     *
     * So a ride is four minutes ABOARD. The machine turns for as much of that
     * as the people boarding leave it free to, which is most of it, and every
     * seat comes back within four minutes and a circuit of being taken.
     */
    dueAt: number;
    /**
     * Minutes the machine has actually TURNED with them in it.
     *
     * A ride that is at rest whenever anybody is boarding can be at rest for
     * the whole of somebody's four minutes, and thirty-eight riders sat through
     * a stopped machine and called it a ride. So a rider's ride is over when
     * both are true: their four minutes aboard are up, AND the ride has carried
     * them at least one full circuit. The second costs a loop at worst, because
     * the ride runs whenever nobody is getting on.
     */
    ridden: number;
  }
  const seated: Seated[] = [];
  /** When each seat comes free — its occupant is out of it and clear. */
  const seatFreeAt = new Map<number, number>(deckOrder.map((seat) => [seat, -Infinity]));
  /*
   * WHEN THE STEPS ARE CLEAR, kept for each DIRECTION separately.
   *
   * People going the same way have to keep a pace apart or they end up on the
   * same tread inside one another. People going opposite ways do not: the stair
   * is a metre and a half wide and they pass, which is what passing is. Holding
   * one number for both made a boarder wait for somebody coming down to cross
   * the deck and step off the top — fifty-three seconds of standing at the foot
   * of an empty staircase.
   */
  /*
   * WHO IS ON THE STAIR, AND IN WHICH LANE — going up and coming down.
   *
   * This replaces the pair of "the steps are free again at" clocks that used to
   * hold the next person at the bottom until the one in front was a pace clear.
   * That hold was the last waiting left in the park, and it was an employee
   * waiting for an employee, which the user has ruled out outright: "An
   * employee should never wait for another employee."
   *
   * A stair three shoulders wide does not require it. Each climber is given a
   * lane across the flight, and a lane is only refused if somebody already in
   * it would be within a shoulder of them at some point of the climb — the two
   * walk at their own paces, so the separation is a straight line in time and
   * its smallest value is at one end of the overlap or where they cross.
   */
  interface OnStair {
    lane: number;
    from: number;
    to: number;
    /** Where they are on the flights at `from`, measured up from the foot. */
    at0: number;
    /** How fast that is changing: positive going up, negative coming down. */
    rate: number;
  }
  /*
   * ONE SET OF LANES FOR BOTH DIRECTIONS. A climber and somebody coming down
   * are on the same staircase, so they have to pass rather than share a lane —
   * keeping two lists let a lane hold one of each and put them through one
   * another halfway up.
   */
  const onStair: OnStair[] = [];
  /* The last resort, for a crowd so dense that every lane is occupied for the
     whole of somebody's climb: follow the last of them at a pace's interval.
     Nothing in the workbook reaches it, and `verify-boarding` says so. */
  let upFreeAt = -Infinity;
  let downFreeAt = -Infinity;

  const laneClear = (lane: number, mine: OnStair) =>
    onStair.every((o) => {
      if (o.lane !== lane) return true;
      const a = Math.max(mine.from, o.from);
      const b = Math.min(mine.to, o.to);
      if (b <= a) return true;
      /*
       * How far apart they are on the flights, one minus the other, at both
       * ends of the overlap. Both walk at their own steady pace, so the
       * difference is a straight line in time: a change of sign means they meet
       * — one overtaking, or the two of them passing — and its smallest value
       * is otherwise at one end or the other.
       */
      const gap = (u: number) =>
        mine.at0 + (u - mine.from) * mine.rate - (o.at0 + (u - o.from) * o.rate);
      const ga = gap(a);
      const gb = gap(b);
      if (ga * gb < 0) return false;
      return Math.min(Math.abs(ga), Math.abs(gb)) >= CLEARANCE_ALONG;
    });

  /** The lane they walk in, or -1 if every one of them is taken throughout. */
  const takeLane = (from: number, to: number, at0: number, rate: number) => {
    for (let lane = 0; lane < CLIMB_LANES; lane++) {
      const mine = { lane, from, to, at0, rate };
      if (laneClear(lane, mine)) {
        onStair.push(mine);
        return lane;
      }
    }
    return -1;
  };

  /**
   * The whole of one employee's climb: when they set foot on the bottom step,
   * which lane they go up in, and when they step onto the platform.
   *
   * They start the second they get there. The only thing that can move it is
   * every lane of the flight being occupied for the whole of their climb —
   * three people already abreast, which is what a stair three shoulders wide
   * holds — and then they take the pace behind the last of them. That is the
   * only waiting left anywhere in the park: one employee out of the workbook's
   * 3,219, for 2.8 seconds, on one date. Removing it needs a wider staircase,
   * which is a change to every ride and the user's call to make.
   */
  const climbOf = (a: RideArrival) => {
    const known = climbPlan.get(a.employeeId);
    if (known) return known;
    const climbSpeed = climbSpeedOf(a);
    /* Timed against the line they are on: a lane crosses each landing on its
       own side and starts with a stride across the bottom step, so it is a
       little longer than the centre line the stair is measured by. */
    const upFor = (lane: number) => stairLaneLength(stair, lane, true) / climbSpeed;
    let ladderAt = a.at;
    let climbLane = -1;
    /* Their own lane from the last solve first, so the climb costs the same
       and the seat lands on the same minute — see `RidePins`. */
    const wanted = pins?.lane.get(a.employeeId);
    const order = [
      ...(wanted === undefined ? [] : [wanted]),
      ...Array.from({ length: CLIMB_LANES }, (_, k) => k).filter((k) => k !== wanted),
    ];
    for (const lane of order) {
      const mine = {
        lane,
        from: ladderAt,
        to: ladderAt + upFor(lane),
        at0: 0,
        rate: stair.climbLength / upFor(lane),
      };
      if (laneClear(lane, mine)) {
        onStair.push(mine);
        climbLane = lane;
        break;
      }
    }
    if (climbLane < 0) {
      ladderAt = Math.max(ladderAt, upFreeAt);
      climbLane = Math.max(
        0,
        takeLane(ladderAt, ladderAt + upFor(0), 0, stair.climbLength / upFor(0)),
      );
    }
    upFreeAt = ladderAt + QUEUE_PITCH / climbSpeed;
    const plan = { ladderAt, climbLane, deckAt: ladderAt + upFor(climbLane) };
    climbPlan.set(a.employeeId, plan);
    return plan;
  };
  /*
   * Places in the line, for the rare employee who does have to wait.
   *
   * Almost nobody does — three in the whole workbook wait more than a minute —
   * but two who arrive together at a full ride would otherwise both stand on
   * the bottom step, in the same spot, inside one another. A place is held from
   * the minute its occupant reaches it until they set off up the steps.
   */
  const placeFreeAt: number[] = [];
  const climbSpeedOf = (a: RideArrival) => a.walkSpeed * CLIMB_PACE_FRACTION;

  let next = 0;
  let t = arrivals[0].at;

  /* Bounded by construction — every pass boards, unloads, or runs a whole loop
     — but guarded anyway so a future change cannot hang the build. */
  for (let pass = 0; pass < 100000; pass++) {
    const done = (x: Seated) => x.dueAt <= t + 1e-9 && x.ridden >= loopMinutes - 1e-9;
    const outstanding = seated.filter((x) => !done(x));
    if (next >= arrivals.length && seated.length === 0) break;

    /*
     * ---------------- RUN, UP TO THE NEXT PERSON ----------------
     *
     * THE RIDE IS BROUGHT TO REST BEFORE ANYBODY ARRIVES, not when they do.
     *
     * This is the whole difference from the way it used to work. A ride used to
     * react: somebody walked up, and it finished the circuit it happened to be
     * on before it could take them — up to a loop of standing about, and on the
     * Giga Coaster a loop is two minutes. The schedule is solved from the very
     * minutes the walks produce, so it knows who is coming and when. It
     * therefore runs only a WHOLE number of loops that FIT in the gap, and is
     * already standing at its platform when the next employee reaches the
     * bottom step. Nobody ever waits for the machine.
     */
    const nextFoot = next < arrivals.length ? arrivals[next].at : Infinity;
    /*
     * IT HAS TO BE STANDING WHEN THEY SIT DOWN, NOT WHEN THEY WALK UP.
     *
     * The stair is beside the machine, not on it, so an employee can be
     * climbing while the ride is still turning — and on the Ferris Wheel that
     * climb is 1.39 min against a 1.05 min revolution, which is the difference
     * between a wheel that can finish a circuit between two arrivals and one
     * that cannot.
     *
     * It mattered because the wheel is the one ride in the park that can run
     * out of cabins: four departments board eleven of them. Standing still from
     * the moment the first of a burst reached the bottom step meant it never
     * completed the revolution that frees a cabin, so the cabins stayed full
     * and the people behind them stood on the ground for minutes — the last
     * real waiting left anywhere in the park. It now turns while they climb and
     * is at a stand as they step onto the platform, which is both what a real
     * wheel does and what the promise requires: they never break stride.
     */
    const nextRest = next < arrivals.length ? climbOf(arrivals[next]).deckAt : Infinity;
    const soonestDone = outstanding.length
      ? Math.min(...outstanding.map((x) => Math.max(x.dueAt, t + Math.max(0, loopMinutes - x.ridden))))
      : Infinity;

    /*
     * HOW MANY WHOLE LOOPS FIT before the next person is on the bottom step —
     * and a ride can only be brought to a stand at its platform, so whole loops
     * is all there is. Zero of them means somebody is due within a circuit, and
     * the ride simply stays where it is.
     */
    /*
     * ...AND IT ONLY HOLDS STILL FOR SOMEBODY IT CAN ACTUALLY TAKE.
     *
     * Coming to rest before an arrival is the whole point — nobody should wait
     * for the machine. But when every seat is taken, standing still for them
     * achieves nothing and costs everything: the ride cannot finish the circuit
     * that would free a seat, so the seat never frees, so it stands there for
     * ever. That is a deadlock, and it is what happened on the Ferris Wheel at
     * its busiest. With no seat to offer, the ride runs.
     */
    const seatFreeNow = deckOrder.some((seat) => (seatFreeAt.get(seat) ?? -Infinity) <= nextRest);
    const room =
      Number.isFinite(nextRest) && seatFreeNow
        ? Math.floor((nextRest - t) / loopMinutes + 1e-9)
        : Number.POSITIVE_INFINITY;
    /*
     * AND HOW MANY THE SOONEST RIDER STILL NEEDS, rounded UP.
     *
     * Up, not down: a rider owes the park's four minutes of running and the
     * machine deals it a loop at a time, so the last fraction of a minute costs
     * a whole loop. Rounding it down instead leaves a rider owed thirty seconds
     * that the ride can never give them, and they sit in the seat for ever —
     * which is exactly what happened, and what `riseAt: Infinity` meant.
     */
    const needed = outstanding.length
      ? Math.max(1, Math.ceil((soonestDone - t) / loopMinutes - 1e-9))
      : 0;
    /*
     * ...AND IT TURNS WHEN NOBODY NEEDS IT TO.
     *
     * With nobody aboard there is no ride to finish, and a machine that only
     * ran when it was carrying somebody stood dead between arrivals — the
     * Roller Coaster spent 97% of its morning motionless, which is not a park.
     * A real ride runs all day and comes to a stand only when somebody is
     * coming to get on, so an empty ride fills the whole gap it has.
     */
    const idleHorizon = Math.max(1, Math.floor(IDLE_RUN_HORIZON_MINUTES / loopMinutes));
    const loops = Math.min(room, needed > 0 ? needed : idleHorizon);

    /*
     * ...BUT NOT PAST SOMEBODY WHOSE RIDE IS ALREADY OVER. An empty ride fills
     * its gap; a ride with a rider due to step off has to stop and let them.
     * Without this the idle run swallowed them and turned for ever.
     */
    const dueNowBeforeRun = seated.some(done);
    if (!dueNowBeforeRun && loops >= 1) {
      const ran = loops * loopMinutes;
      segments.push({ from: t, to: t + ran, loops });
      for (const x of seated) x.ridden += ran;
      t += ran;
      continue;
    }
    /*
     * It cannot run. If nobody is due to get off at this minute, stand until
     * the next person arrives — but only then: skipping ahead while somebody's
     * ride is already up left them in the seat until the next arrival, which on
     * a date with a twenty-hour delay in it meant a rider sat there all day.
     */
    const dueNow = seated.some((x) => x.dueAt <= t + 1e-9);
    if (!dueNow && Number.isFinite(nextFoot) && nextFoot > t + 1e-9) {
      t = nextFoot;
      continue;
    }

    /* ---------------- AT REST: LET THEM OFF, THEN TAKE THEM ON ------------ */
    const stopFrom = t;
    const boarding: string[] = [];
    const leaving: string[] = [];
    let restUntil = stopFrom;

    /* Anybody whose four minutes are behind them gets off first. */
    for (const x of seated.filter(done)) {
      const spot = deckSpotFor(stair, x.r.seatIndex);
      const rest = seatPose(rideId, x.r.seatIndex, 0);
      const climbSpeed = climbSpeedOf(x.a);

      const riseAt = stopFrom + SEATED_HOLD_MINUTES;
      const deckSpotOutAt =
        riseAt +
        Math.max(SEAT_STEP_MINUTES, dist3([rest.x, rest.y, rest.z], spot) / x.a.walkSpeed);
      /*
       * DOWN IN THEIR OWN LANE TOO, so nobody stands at the head of the steps
       * waiting for somebody else to get off them. The walk across the deck
       * ends at that lane's own top step, which is why the time it takes is
       * worked out inside the search rather than before it.
       */
      const headAt = (lane: number) =>
        deckSpotOutAt + dist3(spot, stairHead(stair, lane)) / x.a.walkSpeed;
      /* Their own lane's length, for the same reason as the climb. */
      const downFor = (lane: number) => stairLaneLength(stair, lane, false) / climbSpeed;
      let descendLane = -1;
      let atStairHeadAt = headAt(0);
      for (let lane = 0; lane < CLIMB_LANES; lane++) {
        const from = headAt(lane);
        const mine = {
          lane,
          from,
          to: from + downFor(lane),
          at0: stair.climbLength,
          rate: -stair.climbLength / downFor(lane),
        };
        if (laneClear(lane, mine)) {
          onStair.push(mine);
          descendLane = lane;
          atStairHeadAt = from;
          break;
        }
      }
      let deckOutAt = atStairHeadAt;
      if (descendLane < 0) {
        /* Every lane occupied for the whole descent — only possible in a crowd
           coming off at once. They follow the last of them down. */
        deckOutAt = Math.max(atStairHeadAt, downFreeAt);
        descendLane = Math.max(
          0,
          takeLane(
            deckOutAt,
            deckOutAt + downFor(0),
            stair.climbLength,
            -stair.climbLength / downFor(0),
          ),
        );
      }
      const groundAt = deckOutAt + downFor(descendLane);
      const offAt = groundAt + dist(stairFoot(stair, descendLane), x.a.desk) / x.a.walkSpeed;

      x.r.descendLane = descendLane;
      x.r.riseAt = riseAt;
      x.r.deckSpotOutAt = deckSpotOutAt;
      x.r.atStairHeadAt = atStairHeadAt;
      x.r.deckOutAt = deckOutAt;
      x.r.groundAt = groundAt;
      x.r.offAt = offAt;

      downFreeAt = deckOutAt + QUEUE_PITCH / climbSpeed;
      /*
       * RELEASED WHEN THEY ARE OFF THE PLATFORM, not when they reach the ground.
       *
       * It used to hold until `groundAt` — the foot of the stair — which on the
       * Monster Ride is four and a half minutes of walking down a 154 m
       * switchback with the machine standing still behind them. That is the
       * ride kept stopped after everybody is dealt with, which is exactly what
       * the user ruled out: "Do not keep the ride stopped after the employee has
       * been seated."
       *
       * The stair is beside the machine and outside everything it sweeps, so
       * the moment somebody steps off the boards onto the top step the ride can
       * go. It is the same rule as boarding, where the ride runs while they
       * climb and stops to meet them at the platform: what needs the machine
       * still is being ON it.
       */
      restUntil = Math.max(restUntil, deckOutAt);
      leaving.push(x.r.employeeId);
      /* The seat is free the moment they are out of it. */
      seatFreeAt.set(x.r.seatIndex, riseAt);
      seated.splice(seated.indexOf(x), 1);
    }

    /*
     * ...AND EVERYBODY WHO HAS REACHED THE STEPS WALKS STRAIGHT UP THEM.
     *
     * No queue and no hold: they set foot on the stair at the minute their own
     * walk delivered them, climb it, cross the deck and sit down. The only
     * thing that can move a boarder by even a second is the person immediately
     * ahead of them on the steps, who has to be a pace clear before the next
     * treads on them — and `verify-boarding` reports how often that bites.
     */
    while (next < arrivals.length && arrivals[next].at <= restUntil + 1e-9) {
      const a = arrivals[next];
      /*
       * ...AND ONLY THE PEOPLE THIS STOP IS ACTUALLY FOR.
       *
       * Somebody who reaches the bottom step while the ride is stopped is not
       * on the platform yet — on the Dragon Ship the climb is four and a
       * quarter minutes — and holding the ride at a stand for the whole of it
       * is the ride left standing after everybody aboard is seated, which the
       * user ruled out: "Once the employee is successfully seated, restart the
       * ride immediately."
       *
       * So a stop takes the people who will step onto the boards before it is
       * over, and anybody still climbing is left to the next one: the ride goes
       * again the moment the boards are clear and turns until it has to be
       * standing for them. It cannot leave the first of them behind — a stop
       * that has done nothing yet is the stop that was called for whoever is
       * next, so it always takes them.
       */
      if (
        (boarding.length > 0 || leaving.length > 0) &&
        climbOf(a).deckAt > restUntil + 1e-9
      ) {
        break;
      }
      /*
       * A SEAT READY FOR THEM, and on all but a handful of minutes there is one.
       *
       * The promise is that nobody waits: they walk up and get straight on. It
       * holds everywhere except the Ferris Wheel at its very busiest — it serves
       * four of the workbook's departments and its rim curves away from the
       * platform so steeply that only eleven cabins are ever within a step of
       * it — so on three of the forty-nine dates a burst of arrivals can find
       * every one of them taken. That is a fact about the wheel, not a choice:
       * somebody has to wait for a cabin.
       *
       * They are simply not taken on at this stop. The ride carries on, the
       * first rider whose four minutes are up gets off, and the next stop takes
       * them. Handing them a seat somebody was still sitting in — which is what
       * an earlier attempt at this did — put two employees in one cabin.
       */
      /*
       * Free BY NOW, not free at the minute they walked up. The two are the
       * same for everybody who is taken straight on — which is almost everybody
       * — and they differ only for somebody who has had to wait for a cabin:
       * testing their own arrival minute meant a cabin that came free while
       * they stood there still counted as taken, and the day ended with eleven
       * people on the ground beside an empty wheel.
       */
      /*
       * THEY SET FOOT ON THE STEP THE MINUTE THEY GET THERE, FULL STOP.
       *
       * Not the minute the person in front of them is a pace clear, which is
       * what it used to be and what left twenty people across the workbook
       * standing for two or three seconds. Nobody waits for anybody: they take
       * a lane across the flight and go up beside whoever is already on it. The
       * machine cannot hold them either — it stops to meet them at the top.
       */
      const { ladderAt, climbLane, deckAt } = climbOf(a);
      /*
       * A cabin free BY THE TIME THEY REACH THE PLATFORM — the climb is a
       * minute and a half of it, and a cabin whose rider steps out during it is
       * theirs. Testing the minute they walked up instead counted such a cabin
       * as taken and put them in the line for nothing.
       */
      const boardsAt = Math.max(deckAt, t);
      /* The seat they had last solve, if it is still free by the time they are
         on the boards; otherwise the first that is — see `RidePins`. */
      const kept = pins?.seat.get(a.employeeId);
      const seatIndex =
        kept !== undefined && (seatFreeAt.get(kept) ?? -Infinity) <= boardsAt
          ? kept
          : deckOrder.find((seat) => (seatFreeAt.get(seat) ?? -Infinity) <= boardsAt);
      if (seatIndex === undefined) break;
      next++;

      const spot = deckSpotFor(stair, seatIndex);
      const atSeatSpotAt = deckAt + dist3(stairHead(stair, climbLane), spot) / a.walkSpeed;
      const rest = seatPose(rideId, seatIndex, 0);
      const seatAt =
        atSeatSpotAt +
        Math.max(SEAT_STEP_MINUTES, dist3(spot, [rest.x, rest.y, rest.z]) / a.walkSpeed);

      /* Their own place in the line, if they have to stand in one at all. */
      let queueSlot = 0;
      if (ladderAt > a.at + 1e-9) {
        while ((placeFreeAt[queueSlot] ?? -Infinity) > a.at) queueSlot++;
        placeFreeAt[queueSlot] = ladderAt;
      }

      const rider: RideRider = {
        employeeId: a.employeeId,
        seatIndex,
        queueSlot,
        climbLane,
        descendLane: 0,
        boardAt: a.at,
        ladderAt,
        deckAt,
        atSeatSpotAt,
        seatAt,
        riseAt: Infinity,
        deckSpotOutAt: Infinity,
        atStairHeadAt: Infinity,
        deckOutAt: Infinity,
        groundAt: Infinity,
        offAt: Infinity,
      };
      riders[rider.employeeId] = rider;
      seated.push({ a, r: rider, dueAt: seatAt + RIDE_RUN_MINUTES, ridden: 0 });
      boarding.push(rider.employeeId);
      seatFreeAt.set(seatIndex, Infinity);
      /* Nothing may move until they are in the seat. */
      restUntil = Math.max(restUntil, seatAt + READY_MINUTES);
    }

    if (boarding.length === 0 && leaving.length === 0) {
      /*
       * Nothing happened at this minute: either nobody is here yet, or the one
       * who is cannot be seated until a cabin comes free. Stand until the next
       * thing that can change either — somebody arriving, or somebody's ride
       * being up — and always move the clock forward, so a minute at which
       * neither can be served cannot be revisited for ever.
       */
      /*
       * Only things still in the FUTURE are events. Somebody who is already
       * standing at the foot of the steps is not one: their minute has passed,
       * and what they are waiting for is a cabin. Treating their arrival as the
       * next event pinned the clock to the minute they got here and ended the
       * day with them still on the ground.
       */
      const nextArrival =
        next < arrivals.length && climbOf(arrivals[next]).deckAt > t + 1e-9
          ? climbOf(arrivals[next]).deckAt
          : Infinity;
      const nextSeat = seated.length
        ? Math.min(...seated.map((x) => Math.max(x.dueAt, t + Math.max(0, loopMinutes - x.ridden))))
        : Infinity;
      const to = Math.min(nextArrival, nextSeat);
      stops.push({ index: stops.length, from: stopFrom, to, boarding, leaving });
      if (!Number.isFinite(to)) break;
      t = to;
      continue;
    }

    stops.push({ index: stops.length, from: stopFrom, to: restUntil, boarding, leaving });
    t = restUntil;
  }

  /* Nobody may be left on the ground beside the ride they came for. */
  if (next < arrivals.length || seated.length > 0) {
    throw new Error(
      `${rideId}: the day ended with ${arrivals.length - next} employees not yet aboard and ` +
        `${seated.length} still seated at ${t.toFixed(2)}.`,
    );
  }

  /*
   * ---------------- AND IT TURNS WHENEVER NOBODY NEEDS IT ----------------
   *
   * Everything above schedules the ride around its passengers: it stands at
   * rest, takes somebody on, runs their ride, comes back to rest. That left a
   * park of rides standing still for most of the day, because a ride only
   * turned while it was working. A real one does the opposite — it runs all
   * day and comes to a stand only when somebody is coming to get on.
   *
   * So every gap in which the ride is at rest for no reason is filled with an
   * idle run. The rule for ending one is the whole point: a ride can only be
   * brought to a stand at the platform, so an idle run is a WHOLE number of the
   * ride's own loops and finishes at or before the minute the next employee
   * walks up. The ride is therefore already stopped, in exactly the pose the
   * boarding deck was solved against, before anybody reaches the stair.
   */
  fillIdleRuns(rideId, segments, stops, riders);

  segments.sort((a, b) => a.from - b.from);
  return { rideId, arrivals, segments, stops, riders };
}

/**
 * How long a ride takes to wind up and wind down out of an idle run, in
 * simulated minutes. Short enough that the ride is visibly turning within a few
 * seconds of being left alone, long enough that it does not snap into motion.
 */
const IDLE_EASE_MINUTES = 0.25;

/**
 * How far ahead an idle run is planned when nobody is ever coming again.
 *
 * The last stop of the day has no end, so an idle run filling it needs some
 * horizon. A simulated day is under twelve hours; twenty-four is past the end
 * of any timeline the park can be scrubbed to, so the ride simply never stops.
 */
const IDLE_RUN_HORIZON_MINUTES = 24 * 60;

/**
 * Fill every stretch where a ride stands at rest for no reason with a run.
 *
 * A stop's dead time starts once everyone boarding there is seated — the ride
 * cannot turn while somebody is on its stair — and ends when the next employee
 * arrives, because it has to be standing still by then.
 */
function fillIdleRuns(
  rideId: DepartmentRideId,
  segments: RideSegment[],
  stops: readonly RideStop[],
  riders: Record<string, RideRider>,
): void {
  const loopMinutes = ridePeriodSeconds(rideId) / 60;

  for (const stop of stops) {
    /*
     * Nothing may move until the deck is clear: the last person to board here
     * is in their seat, AND the last person leaving here is off the stair.
     *
     * The unloading half is not decoration. A stop that lets somebody off can
     * be an hour long — it runs until the next employee walks up — and an idle
     * run started at the top of it would have the wheel turning while a rider
     * was still climbing out of a cabin.
     */
    const seatedBy = Math.max(
      stop.boarding.reduce(
        (latest, id) => Math.max(latest, riders[id].seatAt + READY_MINUTES),
        stop.from,
      ),
      stop.leaving.reduce(
        (latest, id) => Math.max(latest, riders[id].groundAt + READY_MINUTES),
        stop.from,
      ),
    );
    const restNeededBy = Number.isFinite(stop.to)
      ? stop.to
      : seatedBy + IDLE_RUN_HORIZON_MINUTES;

    const spare = restNeededBy - seatedBy;
    const loops = Math.floor(spare / loopMinutes - 1e-9);
    if (loops < 1) continue;

    push(seatedBy, loops);
  }

  /*
   * AND ON PAST THE LAST PASSENGER.
   *
   * The schedule stops being written the moment everybody who is coming has
   * been taken on and has had their ride — which on this roster is not much
   * past lunchtime, leaving the rides standing dead for the whole afternoon of
   * a timeline that can be scrubbed to nine at night. Unless a stop was already
   * left open-ended, the day is closed off with one long run from whenever the
   * last thing finished.
   */
  const openEnded = stops.some((st) => !Number.isFinite(st.to));
  if (!openEnded) {
    const lastEnd = Math.max(
      0,
      ...stops.filter((st) => Number.isFinite(st.to)).map((st) => st.to),
      ...segments.map((g) => g.to),
    );
    push(lastEnd, Math.floor(IDLE_RUN_HORIZON_MINUTES / loopMinutes));
  }

  function push(from: number, loops: number): void {
    if (loops < 1) return;
    const span = loops * loopMinutes;
    segments.push({
      from,
      to: from + span,
      loops,
      ease: Math.min(IDLE_EASE_MINUTES, span / 4),
    });
  }
}

/* ------------------------------------------------------------------ */
/* Reading a schedule back                                             */
/* ------------------------------------------------------------------ */

/** The segment a ride is turning in at a given minute, or null at rest. */
export function segmentAt(schedule: RideSchedule, simTime: number): RideSegment | null {
  for (const seg of schedule.segments) {
    if (simTime >= seg.from && simTime < seg.to) return seg;
  }
  return null;
}

/** The stop a ride is standing in at a given minute, or null while it runs. */
export function stopAt(schedule: RideSchedule, simTime: number): RideStop | null {
  for (const st of schedule.stops) {
    if (simTime >= st.from && simTime < st.to) return st;
  }
  return null;
}

/**
 * What the ride is doing at a given minute.
 *
 * There is no state for holding: a ride standing with somebody at it is either
 * letting them off, taking them on, or about to be released.
 */
export function rideStateAt(schedule: RideSchedule, simTime: number): RideState {
  const seg = segmentAt(schedule, simTime);
  if (seg) {
    /* The tail of a segment is the ride easing back down onto the platform.
       An idle run declares its own wind-down; a dispatch eases across its whole
       length, so a quarter of it is the tail. */
    const tail =
      seg.ease === undefined
        ? Math.min(RIDE_COMPLETING_MINUTES, (seg.to - seg.from) * 0.25)
        : seg.ease;
    return simTime < seg.to - tail ? "RUNNING" : "RIDE_COMPLETED";
  }
  const stop = stopAt(schedule, simTime);
  if (!stop) return "STOPPED";
  if (stop.leaving.some((id) => simTime < schedule.riders[id].groundAt)) return "EMPLOYEE_EXITING";
  if (stop.boarding.some((id) => simTime < schedule.riders[id].seatAt)) return "EMPLOYEE_BOARDING";
  return Number.isFinite(stop.to) ? "EMPLOYEE_SEATED" : "STOPPED";
}

/** Everyone in a seat at a given minute. */
function ridersSeatedAt(schedule: RideSchedule, simTime: number): RideRider[] {
  const out: RideRider[] = [];
  for (const r of Object.values(schedule.riders)) {
    if (simTime >= r.seatAt && simTime < r.riseAt) out.push(r);
  }
  return out;
}

/** How many employees are seated on the ride at a given minute. */
export function seatedCountAt(schedule: RideSchedule, simTime: number): number {
  return ridersSeatedAt(schedule, simTime).length;
}

/**
 * Which of the ride's own seats are taken by a real employee right now —
 * from the moment they leave the apron for it to the moment they are clear.
 */
export function occupiedSeatsAt(schedule: RideSchedule, simTime: number): number[] {
  const out: number[] = [];
  for (const r of Object.values(schedule.riders)) {
    if (simTime >= r.boardAt && simTime < r.offAt) out.push(r.seatIndex);
  }
  return out;
}

/**
 * The ride's own animation clock at a given minute, in seconds.
 *
 * Zero whenever the ride is at rest, which is by construction the pose it
 * boards from — so a stopped ride is genuinely stopped, with its seats at the
 * platform, rather than frozen part-way round.
 */
export function rideAnimationSecondsAt(schedule: RideSchedule, simTime: number): number {
  return segmentAnimationSeconds(schedule.rideId, schedule.segments, simTime);
}

/**
 * The same answer from a list of segments alone, so a walking figure can sample
 * itself without consulting anything global — which is what lets a journey
 * rebuilt in a script sample exactly as it would on screen.
 */
/**
 * HOW FAR ROUND A RIDE IS, on a trapezoidal speed profile.
 *
 * Fraction `f` of the segment is spent winding up, the same again winding down,
 * and the rest is turned at a steady speed. Both ramps are smoothstep, so the
 * ride starts and stops without a jerk, and the whole thing is normalised to
 * finish at exactly 1 — which is what puts the seats back at the platform.
 *
 * A ramp's own integral is half its width (the integral of 3t^2 - 2t^3 over
 * [0,1] is 1/2), so the distance covered at full speed is 1 - f, and dividing
 * by that is what makes the segment land on a whole number of loops.
 */
function trapezoidProgress(p: number, f: number): number {
  if (f <= 1e-9) return p;
  const ramp = (u: number) => u * u * u * (1 - u / 2);
  const covered =
    p <= f
      ? f * ramp(p / f)
      : p <= 1 - f
        ? f * 0.5 + (p - f)
        : 1 - f - f * ramp((1 - p) / f);
  return covered / (1 - f);
}

export function segmentAnimationSeconds(
  rideId: DepartmentRideId,
  segments: readonly RideSegment[],
  simTime: number,
): number {
  for (const seg of segments) {
    if (simTime < seg.from || simTime >= seg.to) continue;
    const p = (simTime - seg.from) / (seg.to - seg.from);
    const eased =
      seg.ease === undefined
        ? /* Zero velocity at both ends: the ride winds up and eases to a stand. */
          p * p * (3 - 2 * p)
        : trapezoidProgress(p, Math.min(0.5, seg.ease / (seg.to - seg.from)));
    return seg.loops * ridePeriodSeconds(rideId) * eased;
  }
  return 0;
}

