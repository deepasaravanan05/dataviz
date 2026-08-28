import type { DepartmentRideId } from "@/components/park/departments";
import { createRide } from "@/simulation/ride";
import { ridePeriodSeconds } from "./rideKinematics";
import {
  BOARDING_STAIRS,
  CLIMB_PACE_FRACTION,
  deckSpotFor,
  stairFor,
} from "./boardingStair";

/**
 * RIDE OPERATIONS: stop, load, run, stop, unload.
 *
 * Until now every ride in the park turned continuously from the moment the
 * page opened, and the employees walked up to it and stood beside it. This
 * module is the missing half: each department ride stands stopped until one of
 * its department turns up, takes them aboard, runs, comes back to rest and lets
 * them off again.
 *
 * ONE EMPLOYEE IS ENOUGH. There is no minimum, no group, and no waiting for a
 * department to assemble: an employee who reaches their ride alone climbs
 * aboard alone and the ride goes with one person in it. An employee is delayed
 * for exactly three reasons, and the schedule below can only produce those
 * three — the ride is moving, the deck has no free seat, or somebody else is on
 * the one-person stair.
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
/** Lowering into the seat, and rising out of it again. */
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
  /** Boarding opens: they leave the apron for the queue at the stair. */
  boardAt: number;
  /** Standing at the foot of the stair, with the stair to themselves. */
  ladderAt: number;
  /** Off the top step, standing on the boarding deck. */
  deckAt: number;
  /** At their own seat's place on the deck. */
  atSeatSpotAt: number;
  /** Seated, and from here attached to the seat. */
  seatAt: number;
  /** Stands up out of the seat once the ride has stopped. */
  riseAt: number;
  /** Back at the head of the stair, where they may have to wait for it. */
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
export function buildRideSchedule(
  rideId: DepartmentRideId,
  arrivalsIn: RideArrival[],
): RideSchedule {
  /* FIRST COME, FIRST SERVED. Ties break on employee id only so the build is
     deterministic; the ordering that matters is the arrival minute. */
  const arrivals = [...arrivalsIn].sort(
    (a, b) => a.at - b.at || (a.employeeId < b.employeeId ? -1 : 1),
  );
  const stair = stairFor(rideId);
  const head = stair.path[stair.path.length - 1];
  const deckHead: readonly [number, number, number] = [head[0], head[1], head[2]];
  const loopMinutes = ridePeriodSeconds(rideId) / 60;

  const segments: RideSegment[] = [];
  const stops: RideStop[] = [];
  const riders: Record<string, RideRider> = {};

  interface Waiting {
    a: RideArrival;
    /** The minute they are standing at the foot of the stair, ready to climb. */
    readyAt: number;
    queueSlot: number;
  }
  interface Seated {
    a: RideArrival;
    r: RideRider;
    /** Minutes of actual running they have had. */
    ridden: number;
  }

  const queue: Waiting[] = [];
  const seated: Seated[] = [];
  /*
   * A CEILING, NEVER A FLOOR: the seats this ride's boarding deck can reach
   * while it stands still, which is a subset of the ride's own RIDE_CAPACITY.
   * Running out of them is the only capacity condition that can hold anybody
   * up, and it never means "wait for more people".
   */
  const freeSeats = stair.seats.slice(0, RIDE_CAPACITY);
  let next = 0;

  /** Everyone who has reached the ride by `until` joins the back of the line. */
  const admit = (until: number) => {
    while (next < arrivals.length && arrivals[next].at <= until) {
      const a = arrivals[next++];
      const queueSlot = queue.length;
      const slot = stair.queue[Math.min(queueSlot, stair.queue.length - 1)];
      const walk = (dist(a.stand, slot) + dist(slot, stair.base)) / a.walkSpeed;
      queue.push({ a, readyAt: a.at + walk, queueSlot });
    }
  };

  if (arrivals.length === 0) return { rideId, arrivals, segments, stops, riders };

  let t = arrivals[0].at;

  /* Bounded by construction — every pass boards, unloads, or advances a whole
     loop — but guarded anyway so a future change cannot hang the build. */
  for (let pass = 0; pass < 10000; pass++) {
    const allArrived = next >= arrivals.length && queue.length === 0;
    const allRidden = seated.every((x) => x.ridden >= RIDE_RUN_MINUTES - 1e-9);
    /* The day's work is done when everybody who is coming has been taken on and
       everybody aboard has had their ride. They stay in their seats. */
    if (allArrived && allRidden) break;

    /* ---------------- THE RIDE IS AT REST ---------------- */
    const stopFrom = t;
    admit(stopFrom);
    let stairFreeAt = stopFrom;
    const boarding: string[] = [];

    /*
     * NOBODY EVER GETS OFF.
     *
     * A seat taken is taken for the rest of the day: an employee who has
     * reached their department ride and sat down stays there, moving with the
     * ride, until the simulation is reset. There is no unloading phase, and the
     * stair is never used in the downward direction — a stop exists only to
     * take somebody ON.
     *
     * The consequence the platform had to absorb: seats never come free, so a
     * ride's deck must present one for every employee that ride will ever take.
     * See PLATFORM_SEATS.
     */
    const leaving: string[] = [];

    /*
     * Then on: the queue in arrival order, while seats remain. The ride is not
     * released until everyone who had reached it is seated — but it waits for
     * nobody who has not, which is what keeps this individual rather than a
     * group rule.
     */
    let releaseAt = stopFrom + READY_MINUTES;
    for (;;) {
      admit(releaseAt);
      if (freeSeats.length === 0 || queue.length === 0) break;
      const q = queue.shift()!;
      const seatIndex = freeSeats.shift()!;
      const climbSpeed = q.a.walkSpeed * CLIMB_PACE_FRACTION;
      const spot = deckSpotFor(stair, seatIndex);

      const ladderAt = Math.max(stairFreeAt, q.readyAt);
      const deckAt = ladderAt + stair.climbLength / climbSpeed;
      const atSeatSpotAt = deckAt + dist3(deckHead, spot) / q.a.walkSpeed;
      const seatAt = atSeatSpotAt + SEAT_STEP_MINUTES;

      const rider: RideRider = {
        employeeId: q.a.employeeId,
        seatIndex,
        queueSlot: q.queueSlot,
        /* They leave the apron for the line the moment they get to the ride. */
        boardAt: q.a.at,
        ladderAt,
        deckAt,
        atSeatSpotAt,
        seatAt,
        /*
         * They never get up. Infinity rather than a number so that every
         * "is this seat still taken" and "are they still seated" question
         * answers yes for the rest of the day, without a sentinel to remember.
         */
        riseAt: Infinity,
        atStairHeadAt: Infinity,
        deckOutAt: Infinity,
        groundAt: Infinity,
        offAt: Infinity,
      };
      riders[rider.employeeId] = rider;
      seated.push({ a: q.a, r: rider, ridden: 0 });
      boarding.push(rider.employeeId);
      stairFreeAt = deckAt;
      releaseAt = Math.max(releaseAt, seatAt + READY_MINUTES);
    }

    /*
     * A queue with nowhere to sit. Seats never come free, so if the deck is
     * full these employees will never board — they wait at the foot of the
     * stair for the rest of the day rather than hanging the build. It cannot
     * happen for a roster whose largest department fits PLATFORM_SEATS, and
     * `verify-boarding.ts` proves this one does.
     */
    if (freeSeats.length === 0 && queue.length > 0 && seated.every((x) => x.ridden >= RIDE_RUN_MINUTES - 1e-9)) {
      stops.push({ index: stops.length, from: stopFrom, to: Infinity, boarding, leaving });
      break;
    }

    /*
     * ---------------- NOTHING TO RUN FOR: STAY STOPPED ----------------
     *
     * Either nobody is aboard yet, or everybody aboard has had their ride and
     * is simply staying in their seat. Either way the ride stands at rest with
     * whoever is on it until the next person walks up. Without this it would
     * grind out one loop at a time for the rest of the day, because riders who
     * are finished are never removed.
     */
    const outstanding = seated.filter((x) => x.ridden < RIDE_RUN_MINUTES - 1e-9);
    if (outstanding.length === 0) {
      const nextArrival = next < arrivals.length ? arrivals[next].at : Infinity;
      stops.push({ index: stops.length, from: stopFrom, to: nextArrival, boarding, leaving });
      if (nextArrival === Infinity) break;
      t = nextArrival;
      continue;
    }

    stops.push({ index: stops.length, from: stopFrom, to: releaseAt, boarding, leaving });

    /* ---------------- RUN, UNTIL THERE IS A REASON TO STOP ---------------- */
    const soonestComplete =
      releaseAt + Math.min(...outstanding.map((x) => RIDE_RUN_MINUTES - x.ridden));
    /*
     * A new arrival is a reason to stop: the ride finishes its circuit for them
     * rather than making them sit out the rest of somebody else's ride. Unless
     * every seat is taken, in which case stopping would achieve nothing and the
     * next free seat is what they are really waiting for.
     */
    const nextArrival =
      freeSeats.length > 0 && next < arrivals.length ? arrivals[next].at : Infinity;
    const stopWanted = Math.min(soonestComplete, nextArrival);

    const loops = Math.max(1, Math.ceil((stopWanted - releaseAt) / loopMinutes - 1e-9));
    const ran = loops * loopMinutes;
    segments.push({ from: releaseAt, to: releaseAt + ran, loops });
    for (const s of seated) s.ridden += ran;
    t = releaseAt + ran;
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
    /* Nothing may move until the last person to board here is in their seat. */
    const seatedBy = stop.boarding.reduce(
      (latest, id) => Math.max(latest, riders[id].seatAt + READY_MINUTES),
      stop.from,
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

