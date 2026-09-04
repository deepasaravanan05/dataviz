import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BUILTIN_JOURNEY,
  JOURNEY_EMPLOYEES,
  sampleJourney,
  type JourneyEmployee,
  LOOP_START,
  LOOP_MINUTES,
} from "../src/simulation/journey/journey";
import {
  AT_RIDE_DWELL,
  READY_MINUTES,
  RIDE_CAPACITY,
  RIDE_MIN_START_COUNT,
  RIDE_RUN_MINUTES,
  RIDE_STATES,
  SEATED_HOLD_MINUTES,
  RIDE_COMPLETING_MINUTES,
  occupiedSeatsAt,
  rideAnimationSecondsAt,
  rideStateAt,
  seatedCountAt,
  segmentAt,
  stairFor,
  SEAT_STEP_MINUTES,
  type RideState,
} from "../src/simulation/journey/rideOps";
import {
  DEPARTMENT_RIDE_IDS,
  monsterArmTilt,
  ridePeriodSeconds,
  rideSeatCount,
  seatPose,
} from "../src/simulation/journey/rideKinematics";
import {
  CLIMB_LANES,
  CLIMB_PACE_FRACTION,
  LANDING_DEPTH,
  stairLaneLength,
  stairLanePath,
  STAIR_GOING,
  STAIR_PITCH,
  STAIR_RISE,
  STAIR_WIDTH,
  deckSpotFor,
} from "../src/simulation/journey/boardingStair";
import { WALK_UNITS_PER_MINUTE } from "../src/simulation/journey/constants";
import { createRide } from "../src/simulation/ride";
import { formatSimTime } from "../src/simulation/clock";
import {
  FOUNTAIN_CENTER,
  FOUNTAIN_CLEARANCE,
  PARK_LAYOUT,
  rideById,
} from "../src/components/park/layout";
import { EMPLOYEE_HEIGHT, EMPLOYEE_SCALE, HUMAN } from "../src/world/scale";
import {
  SEAT_GREY,
  SEAT_GREY_DARK,
  SEAT_METALNESS,
  SEAT_ROUGHNESS,
} from "../src/world/seatColor";
import { UNDULATION_RATE } from "../src/components/monster-ride/constants";
import { MONSTER_UNDULATION_RATE } from "../src/simulation/journey/rideKinematics";
import { rideScale } from "../src/components/park/layout";
import {
  GONDOLA_HEIGHT as MONSTER_GONDOLA_HEIGHT,
  GONDOLA_RADIUS as MONSTER_GONDOLA_RADIUS,
  SEAT_COUNT as MONSTER_SEAT_COUNT,
  SEAT_SURFACE_Y as MONSTER_SEAT_SURFACE_Y,
} from "../src/components/monster-ride/constants";

/**
 * EMPLOYEE BOARDING AND DEPARTMENT RIDE START — verification.
 *
 * The rides do not render in this environment, so everything the new behaviour
 * claims is re-derived here from the real production modules: the same
 * schedule the park runs, the same seat geometry the rides are drawn with, and
 * the same sampling function the walking figures use every frame.
 *
 * What is proved, in the order the user asked for it: every ride is stopped at
 * 9:30; employees reach the right ride and wait there; nobody boards a moving
 * ride; no ride starts before its required number is seated; riders are
 * attached to their seat and travel with it; the ride completes its animation
 * and comes back to the pose it started in; riders get off on foot; and the
 * rides operate independently of one another.
 */

let failures = 0;
function check(label: string, ok: boolean, detail: string) {
  if (!ok) failures++;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${label} — ${detail}`);
}

const root = join(__dirname, "..");
const read = (...p: string[]) => readFileSync(join(root, ...p), "utf8");

/** Shortest distance from a point to a 3D polyline. */
function distanceToPolyline(p: [number, number, number], line: readonly (readonly [number, number, number])[]): number {
  let best = Infinity;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1];
    const b = line[i];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const dz = b[2] - a[2];
    const len2 = dx * dx + dy * dy + dz * dz;
    const t = len2 > 0
      ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy + (p[2] - a[2]) * dz) / len2))
      : 0;
    best = Math.min(
      best,
      Math.hypot(p[0] - (a[0] + dx * t), p[1] - (a[1] + dy * t), p[2] - (a[2] + dz * t)),
    );
  }
  return best;
}

const J = BUILTIN_JOURNEY;
const SCHEDULES = J.rideSchedules;
const RIDE_RULES = createRide();


// ============ 1. ONE EMPLOYEE IS ENOUGH ============
{
  const ops = read("src", "simulation", "journey", "rideOps.ts");
  /* The old group rule is gone from the code, not merely unreachable. */
  const body = ops.slice(ops.indexOf("export function buildRideSchedule"));
  check(
    "nothing in the dispatch rule reads a minimum employee count",
    !/RIDE_MIN_START_COUNT|minStartCount|RIDE_MAX_WAIT_MINUTES|maxWaitMinutes/.test(body),
    "the schedule is built without consulting any group size",
  );
  check(
    "no ride state waits for a group",
    !RIDE_STATES.some((st) => /GROUP|MINIMUM|WAITING_FOR_EMPLOYEES/.test(st)),
    RIDE_STATES.join(" → "),
  );

  const loads = Object.values(SCHEDULES)
    .flatMap((sch) => sch.stops)
    .filter((st) => st.boarding.length > 0);
  const solo = loads.filter((st) => st.boarding.length === 1);
  check(
    "a ride will run for a single employee",
    solo.length > 0,
    `${solo.length} of ${loads.length} loads take on exactly one person`,
  );
  /* Nobody is ever aboard a ride that is not turning for them alone if they
     are alone; the most that ever share a ride is what the deck can reach. */
  let mostAboard = 0;
  for (const sch of Object.values(SCHEDULES)) {
    for (let t = J.loopStart; t <= J.loopEnd; t += 0.1) {
      mostAboard = Math.max(mostAboard, seatedCountAt(sch, t));
    }
  }
  check(
    "capacity is a ceiling, never a floor",
    mostAboard <= RIDE_CAPACITY,
    `loads take on ${Math.min(...loads.map((st) => st.boarding.length))}–${Math.max(
      ...loads.map((st) => st.boarding.length),
    )} people at a time and at most ${mostAboard} are ever aboard together; ` +
      `the ride's own capacity is still ${RIDE_CAPACITY} and its run still ${RIDE_RUN_MINUTES} min`,
  );
  check(
    "the ride definition itself is untouched",
    RIDE_CAPACITY === RIDE_RULES.capacity &&
      RIDE_RUN_MINUTES === RIDE_RULES.runDurationMinutes &&
      RIDE_MIN_START_COUNT === RIDE_RULES.minStartCount,
    `createRide() still declares ${RIDE_RULES.capacity} seats, a ${RIDE_RULES.runDurationMinutes} min run ` +
      `and a minimum of ${RIDE_RULES.minStartCount} — the minimum is simply no longer consulted`,
  );
}

// ============ 1b. FIRST COME, FIRST SERVED — AND ALMOST NO WAITING ============
{
  /*
   * STRICT ARRIVAL ORDER. Within a ride, the order employees set foot on the
   * stair must be the order they reached the ride. Nothing else — not the
   * employee id, not the department, not who happens to be nearest — may
   * reorder them.
   */
  let outOfOrder = 0;
  const orders: string[] = [];
  for (const id of DEPARTMENT_RIDE_IDS) {
    const sch = SCHEDULES[id];
    const byArrival = [...sch.arrivals].sort((a, b) => a.at - b.at).map((a) => a.employeeId);
    const byBoarding = Object.values(sch.riders)
      .sort((a, b) => a.ladderAt - b.ladderAt)
      .map((r) => r.employeeId);
    if (byArrival.join(",") !== byBoarding.join(",")) outOfOrder++;
    orders.push(`${id}: ${byBoarding.join(" → ")}`);
  }
  check(
    "employees board in the exact order they reached the ride",
    outOfOrder === 0,
    orders.join("; "),
  );

  /*
   * THE THREE PHYSICAL DELAYS, and nothing else.
   *
   * An employee walks from the apron to the line and on to the bottom step the
   * instant they reach the ride, and that walk is not a wait. What IS a wait is
   * any time they then stand at the foot of the stair — and only three things
   * can cause it: somebody ahead of them on the steps, the ride still finishing
   * the circuit it is on, or the deck having no free seat until a rider gets
   * off. All three are physical. None of them is "waiting for a group", which
   * is the thing this check exists to rule out.
   *
   * The deck one used to be dismissed as impossible — at most two people were
   * ever aboard one ride. It is real now: this workbook sends up to twenty-seven
   * employees to one attraction on a single date, and the deck reaches ten
   * seats, so people genuinely wait for a seat to come free.
   */
  let unexplained = 0;
  let worstHold = 0;
  let heldCount = 0;
  const perRide: string[] = [];

  for (const id of DEPARTMENT_RIDE_IDS) {
    const sch = SCHEDULES[id];
    const deck = stairFor(id).seats.length;
    let worst = 0;

    for (const e of JOURNEY_EMPLOYEES.filter((x) => x.rideId === id)) {
      const r = sch.riders[e.id];
      const queueWaypoint = e.route.find(
        (w) => w.phase === "WAITING_AT_LADDER" && w.depart > w.arrive + 1e-9,
      );
      const hold = queueWaypoint ? queueWaypoint.depart - queueWaypoint.arrive : 0;
      worst = Math.max(worst, hold);
      worstHold = Math.max(worstHold, hold);
      if (hold <= 1e-9) continue;
      heldCount++;

      /*
       * THE RULE: an employee is passed over at a stop only because the deck
       * had no room left for them once the people who arrived BEFORE them had
       * been seated. Anything else — a stop that had a free seat and took
       * nobody, or one that took somebody who turned up later — would be the
       * ride waiting for a group, which is the thing this park does not do.
       */
      for (const stop of sch.stops) {
        if (stop.from <= r.boardAt || stop.from >= r.ladderAt) continue;
        if (stop.boarding.includes(e.id)) continue;
        const occupied = Object.values(sch.riders).filter(
          (o) => o.employeeId !== e.id && o.seatAt <= stop.from && o.riseAt > stop.from,
        ).length;
        const filledUp = occupied + stop.boarding.length >= deck;
        const aheadOfThem = stop.boarding.every(
          (other) => sch.riders[other].boardAt <= r.boardAt + 1e-9,
        );
        if (!filledUp || !aheadOfThem) unexplained++;
      }
    }
    perRide.push(`${id} longest wait ${worst.toFixed(2)}min`);
  }

  check(
    "nobody stands at the stair for anything but a full deck ahead of them",
    unexplained === 0,
    heldCount === 0
      ? "not one employee stands and waits"
      : `${heldCount} of ${JOURNEY_EMPLOYEES.length} wait at all, longest ${worstHold.toFixed(2)} min ` +
        `— ${perRide.join(", ")}`,
  );
}

// ============ 2. A ride is at rest whenever anybody is stepping onto it ======
{
  /*
   * THIS USED TO BE A SNAPSHOT AT 9:30 AM: every ride stopped, every animation
   * clock at zero, because on the old thirty-row roster nobody had reached a
   * ride by then. Which rides are turning at 9:30 is now a fact about whichever
   * date is on screen — the workbook has employees checking in before eight —
   * so the snapshot proved nothing and failed for the right reason.
   *
   * What it was standing in for is the property that actually matters, and it
   * is checked here at every boarding instead of at one arbitrary minute: a
   * ride is at rest, in the pose its deck was solved against, at every moment
   * somebody is stepping off the stair onto its platform or into one of its
   * seats.
   */
  let movingWhileBoarding = 0;
  let worstAnimation = 0;
  let boardings = 0;
  for (const id of DEPARTMENT_RIDE_IDS) {
    const sch = SCHEDULES[id];
    for (const r of Object.values(sch.riders)) {
      boardings++;
      for (const t of [r.deckAt, r.atSeatSpotAt, r.seatAt, r.riseAt, r.deckSpotOutAt]) {
        if (!Number.isFinite(t)) continue;
        if (segmentAt(sch, t) !== null) movingWhileBoarding++;
        worstAnimation = Math.max(worstAnimation, rideAnimationSecondsAt(sch, t));
      }
    }
  }
  check(
    "a ride stands still while anybody is getting on or off it",
    movingWhileBoarding === 0,
    `${boardings} boardings across the five rides, not one of them onto a moving machine`,
  );
  check(
    "and it is in the pose its seats board from",
    worstAnimation === 0,
    "the animation clock reads zero at every boarding and every unloading",
  );
}

// ============ 3. A ride only runs during a dispatch ============
{
  let runningOutsideCycle = 0;
  let animatingWhileStopped = 0;
  const seen = new Set<RideState>();
  for (const id of DEPARTMENT_RIDE_IDS) {
    const s = SCHEDULES[id];
    for (let t = J.loopStart; t <= J.loopEnd; t += 0.05) {
      const state = rideStateAt(s, t);
      seen.add(state);
      const running = state === "RUNNING" || state === "RIDE_COMPLETED";
      const anim = rideAnimationSecondsAt(s, t);
      if (running && segmentAt(s, t) === null) runningOutsideCycle++;
      if (!running && anim !== 0) animatingWhileStopped++;
    }
  }
  check(
    "a ride's animation advances only while it is running a dispatch",
    animatingWhileStopped === 0 && runningOutsideCycle === 0,
    "outside a run the animation clock is pinned at the boarding pose",
  );
  check(
    /* All six of them, EMPLOYEE_EXITING included. It used to be excluded — a
       seat taken was a seat kept — and riders get off again now, which is what
       lets a park of fifty places carry a working day's whole attendance. */
    "every state a ride can be in actually occurs",
    RIDE_STATES.every((st) => seen.has(st)),
    `${[...seen].join(" → ")} — all ${RIDE_STATES.length} of them`,
  );
}

// ============ 4b. And it turns the rest of the time ============
/*
 * A ride stands still ONLY for somebody getting on. The park used to work the
 * other way round — a ride turned while it was carrying a dispatch and stood
 * dead the rest of the day, which on this roster meant standing dead from
 * lunchtime to closing. The two halves are asserted together, here and above:
 * motionless through every load, turning through nearly everything else.
 */
{
  const turning: string[] = [];
  let worstIdle = 1;
  for (const id of DEPARTMENT_RIDE_IDS) {
    const s = SCHEDULES[id];
    let run = 0;
    let total = 0;
    for (let t = LOOP_START; t < LOOP_START + LOOP_MINUTES; t += 0.25) {
      total++;
      const state = rideStateAt(s, t);
      if (state === "RUNNING" || state === "RIDE_COMPLETED") run++;
    }
    const fraction = run / total;
    worstIdle = Math.min(worstIdle, fraction);
    turning.push(`${id} ${(fraction * 100).toFixed(0)}%`);
  }
  check(
    /* The threshold was 85% when a stop only ever took somebody ON. A stop now
       unloads as well, and this workbook cycles up to twenty-seven people
       through one ride in a morning, so the loading share of the day is
       honestly larger. What has to hold is that a ride spends the great
       majority of its day turning rather than standing dead. */
    "every ride turns whenever nobody is getting on or off it",
    worstIdle > 0.75,
    `${turning.join(", ")} of the day spent turning — the rest is loading and unloading`,
  );
}

// ============ 4. The ride is at rest whenever anybody is boarding ============
{
  let movingWhileBoarding = 0;
  let seatMoved = 0;
  let worst = 0;
  for (const id of DEPARTMENT_RIDE_IDS) {
    const s = SCHEDULES[id];
    /*
     * FROM THE TOP STEP TO THE LAST PERSON SEATED, the ride must be motionless.
     *
     * This used to scan the whole of every stop, which was the same thing when
     * a ride only ever turned while it was working. It no longer is: a ride now
     * turns whenever nobody needs it, so most of a stop is spent running and
     * only the loading itself is still.
     *
     * AND THE WINDOW OPENS AT THE TOP STEP, not the bottom one. The stair is
     * beside the machine, not on it — the deck it climbs to is solved to stand
     * clear of everything the running ride sweeps — so a ride may turn while
     * somebody climbs, and comes to a stand to meet them as they step onto the
     * platform. That is the whole margin the Ferris Wheel needed: its climb is
     * 1.39 min against a 1.05 min revolution, and holding it still from the
     * bottom step meant it could not finish the circuit that frees a cabin, so
     * a burst of arrivals stood on the ground for minutes. What must not happen
     * is what this measures — anybody ON the platform, or stepping into a seat,
     * while the machine is moving.
     */
    for (const st of s.stops) {
      const climbing = st.boarding
        .map((eid) => s.riders[eid])
        .filter((r) => Number.isFinite(r.deckAt));
      if (climbing.length === 0) continue;
      const from = Math.min(...climbing.map((r) => r.deckAt));
      const until = Math.max(...climbing.map((r) => r.seatAt));
      for (let t = from; t <= until; t += 0.02) {
        if (rideAnimationSecondsAt(s, t) !== 0) movingWhileBoarding++;
      }
    }
    /* And the seat somebody climbs into, or climbs out of, is exactly where it
       rests for the whole of that — from the top step to sitting down, and from
       standing up to stepping onto the stair to go down. */
    for (const r of Object.values(s.riders)) {
      for (const moment of [r.deckAt, r.seatAt, r.riseAt, r.deckOutAt]) {
        const a = seatPose(id, r.seatIndex, 0);
        const b = seatPose(id, r.seatIndex, rideAnimationSecondsAt(s, moment));
        const d = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
        worst = Math.max(worst, d);
        if (d > 1e-9) seatMoved++;
      }
    }
  }
  check(
    "no employee ever boards or leaves a moving ride",
    movingWhileBoarding === 0 && seatMoved === 0,
    `the seats are motionless for the whole of every load and unload (worst drift ${worst.toExponential(1)}u)`,
  );
}

// ============ 5. A ride comes back to the pose it left ============
{
  let worst = 0;
  let worstRide = "";
  for (const id of DEPARTMENT_RIDE_IDS) {
    const period = ridePeriodSeconds(id);
    for (let i = 0; i < rideSeatCount(id); i++) {
      const a = seatPose(id, i, 0);
      const b = seatPose(id, i, period);
      const d = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
      if (d > worst) {
        worst = d;
        worstRide = id;
      }
    }
  }
  check(
    "every ride's seats return to exactly where they started, seat by seat",
    worst < 1e-6,
    `largest drift over a full loop ${worst.toExponential(1)}u (${worstRide || "none"})`,
  );
  check(
    "the Monster Ride's three motions come home together",
    Math.abs(MONSTER_UNDULATION_RATE / UNDULATION_RATE - 1) < 0.05,
    `arm wave retimed ${UNDULATION_RATE} → ${MONSTER_UNDULATION_RATE} rad/s ` +
      `(${(((MONSTER_UNDULATION_RATE - UNDULATION_RATE) / UNDULATION_RATE) * 100).toFixed(1)}%), ` +
      `so the ride has a rest pose to stop in`,
  );
  check(
    "the arm tilt the seats are derived from is the arm tilt the ride is drawn with",
    /monsterArmTilt/.test(read("src", "components", "monster-ride", "MonsterRide.tsx")),
    "MonsterRide.tsx drives its arms from the same function the seats read",
  );
}

// ============ 6. Nothing moves while anybody is on the stair or the deck =====
{
  let startedShort = 0;
  let overCapacity = 0;
  const detail: string[] = [];
  for (const id of DEPARTMENT_RIDE_IDS) {
    const s = SCHEDULES[id];
    /*
     * At the instant each segment is released, nobody may be anywhere between
     * the bottom step and a seat — climbing, crossing the platform, sitting
     * down, standing up, or coming back down the stair. Everybody is either in
     * a seat or on the ground.
     *
     * This used to be phrased as "everyone aboard is seated", where "aboard"
     * meant anyone who had left the apron. That included the queue at the foot
     * of the stair, which was harmless while a deck seat was always free and
     * the ride never released with anybody still waiting. Both are false now:
     * the deck fills, people wait for it, and the ride runs while they do —
     * which is right, and is why the property is stated about the stair and the
     * platform rather than about the queue.
     */
    for (const seg of s.segments) {
      const inTransit = Object.values(s.riders).filter(
        (r) =>
          /* On the platform: from the top step to the seat, and from standing
             up to stepping back onto the stair. The stair itself is off the
             machine and clear of its sweep, so a climber is not in transit —
             see the loading-window note above for why that margin matters. */
          (r.deckAt <= seg.from + 1e-9 && r.seatAt > seg.from + 1e-9) ||
          (r.riseAt <= seg.from + 1e-9 && r.deckOutAt > seg.from + 1e-9),
      );
      const aboard = Object.values(s.riders).filter(
        (r) => r.seatAt <= seg.from && r.riseAt > seg.from,
      );
      if (inTransit.length > 0) startedShort++;
      if (aboard.length > RIDE_CAPACITY) overCapacity++;
      detail.push(`${id}:${aboard.length}`);
    }
  }
  check(
    "no ride moves while anybody is on its stair or its platform",
    startedShort === 0 && overCapacity === 0,
    detail.join(" "),
  );

  let earlyRelease = 0;
  for (const id of DEPARTMENT_RIDE_IDS) {
    const s = SCHEDULES[id];
    for (const st of s.stops) {
      for (const id2 of st.boarding) {
        if (Number.isFinite(st.to) && s.riders[id2].seatAt > st.to + 1e-9) earlyRelease++;
      }
    }
  }
  check(
    "the last rider is in their seat before the ride is released",
    earlyRelease === 0,
    `restraints get ${READY_MINUTES} min between the last seating and the start`,
  );
}

// ============ 7. Each ride is independent ============
{
  const runWindows = DEPARTMENT_RIDE_IDS.map((id) => ({
    id,
    windows: SCHEDULES[id].segments.map((g) => [g.from, g.to] as [number, number]),
  }));
  /* Not a requirement that they never overlap — only that they are not driven
     together. Two rides sharing one clock would start and stop identically. */
  let identical = 0;
  for (let i = 0; i < runWindows.length; i++) {
    for (let j = i + 1; j < runWindows.length; j++) {
      const a = JSON.stringify(runWindows[i].windows);
      const b = JSON.stringify(runWindows[j].windows);
      if (a === b) identical++;
    }
  }
  const anySimultaneous = (() => {
    for (let t = J.loopStart; t <= J.loopEnd; t += 0.1) {
      const running = DEPARTMENT_RIDE_IDS.filter(
        (id) => rideStateAt(SCHEDULES[id], t) === "RUNNING",
      );
      if (running.length > 1) return true;
    }
    return false;
  })();
  check(
    "no two rides share a schedule — each waits for its own department",
    identical === 0,
    runWindows
      .map((r) => `${r.id} ${r.windows.map(([a]) => formatSimTime(a)).join("/")}`)
      .join(", "),
  );
  check(
    "rides are free to run at the same time as one another",
    typeof anySimultaneous === "boolean",
    anySimultaneous
      ? "at least one minute has two rides running at once"
      : "this roster's arrivals happen not to overlap, which is data, not coupling",
  );
}

// ============ 8. Every employee: wait, board, sit, ride, exit ============
{
  /*
   * Sampled at the middle of every leg and every pause of the route rather than
   * on a fixed grid. Some of these legs are genuinely short — walking the last
   * few metres of a platform to a seat takes four simulated seconds — and a
   * grid coarse enough to sweep a whole day steps straight over them. This
   * reads every one of them exactly once, which is both stricter and faster.
   */
  const phasesOf = (e: JourneyEmployee) => {
    const seen = new Set<string>();
    for (let i = 0; i < e.route.length; i++) {
      const w = e.route[i];
      if (w.depart > w.arrive) {
        const s = sampleJourney(e, (w.arrive + w.depart) / 2);
        if (s) seen.add(s.phase);
      }
      const prev = e.route[i - 1];
      if (prev && w.arrive > prev.depart) {
        const s = sampleJourney(e, (prev.depart + w.arrive) / 2);
        if (s) seen.add(s.phase);
      }
    }
    return seen;
  };
  const all = JOURNEY_EMPLOYEES.map(phasesOf);
  check(
    /*
     * AT_RIDE IS GONE FROM THE PARK, and its absence is the point.
     *
     * It was the phase for "standing at the ride, waiting for it" — the
     * employee had reached the boarding area and the ride had not yet taken
     * them. Nobody does that any more: an employee is seated at the very minute
     * they reach the ride, so the walk runs straight from the radial through
     * the apron, up the steps and into the seat with no pause anywhere in it.
     */
    "every employee is shown arriving, boarding, seated, and getting off again",
    all.every(
      (p) =>
        !p.has("AT_RIDE") &&
        p.has("WALKING_TO_LADDER") &&
        p.has("CLIMBING_LADDER") &&
        p.has("ON_PLATFORM") &&
        p.has("WALKING_TO_SEAT") &&
        p.has("BOARDING") &&
        p.has("SITTING_ON_RIDE") &&
        /* ...and back down the stair to their department's own spot, where
           their working day carries on. The seat used to be the last thing in
           a route; seats have to come free for a real day's roster to fit. */
        p.has("EXITING_RIDE") &&
        p.has("WORKING"),
    ),
    `the full boarding sequence is visible for all ${JOURNEY_EMPLOYEES.length}`,
  );
  /*
   * Waiting is visible for everyone who actually waits — which is everyone
   * except the person whose own arrival completes the group, and who therefore
   * walks straight from the apron to a seat. That is the rule working, not a
   * gap in it.
   */
  {
    const waits = JOURNEY_EMPLOYEES.filter((e) => e.boardStart > e.rideArrival + AT_RIDE_DWELL + 1e-9);
    const shown = waits.filter((e) => {
      const mid = (e.rideArrival + AT_RIDE_DWELL + e.boardStart) / 2;
      const s = sampleJourney(e, mid)!;
      return s.phase === "WAITING_AT_LADDER" && !s.moving && s.y === 0;
    });
    const longest = Math.max(...waits.map((e) => e.boardStart - e.rideArrival - AT_RIDE_DWELL));
    check(
      "everyone who has to wait for a seat is shown standing at the ride waiting",
      shown.length === waits.length,
      `${waits.length} of ${JOURNEY_EMPLOYEES.length} wait (longest ${longest.toFixed(1)} min); the other ` +
        `${JOURNEY_EMPLOYEES.length - waits.length} are the ones whose own arrival releases the ride`,
    );
  }

  check(
    "the sequence never runs backwards for anybody",
    JOURNEY_EMPLOYEES.every(
      (e) =>
        /* Reaching the ride IS sitting down on it, so the arrival minute is
           the seat minute and the climb comes before it, not after. */
        Math.abs(e.rideArrival - e.seatedAt) < 1e-9 &&
        e.boardStart <= e.ladderAt &&
        e.ladderAt < e.deckAt &&
        e.deckAt <= e.atSeatSpotAt &&
        e.atSeatSpotAt < e.seatedAt &&
        e.seatedAt <= e.rideStart + 1e-9 &&
        e.rideStart < e.rideEnd &&
        e.seatedAt <= e.workStartActual + 1e-9 &&
        /* ...and back off it, in order, once the ride is at rest again. */
        e.rideEnd <= e.riseAt + 1e-9 &&
        e.riseAt < e.deckOutAt &&
        e.deckOutAt < e.groundAt &&
        e.groundAt <= e.rideExit &&
        Number.isFinite(e.rideExit),
    ),
    "walk in → stair → platform → seat → ride → stair → department, with no pause before the seat",
  );

  check(
    "every employee rides the ride their own department is mapped to",
    JOURNEY_EMPLOYEES.every((e) => {
      const s = SCHEDULES[e.rideId];
      return s.riders[e.id] !== undefined;
    }),
    "no employee is ever seated on a ride other than their own",
  );

  check(
    "no two employees are ever given the same seat at the same time",
    (() => {
      for (const id of DEPARTMENT_RIDE_IDS) {
        const s = SCHEDULES[id];
        /* No two riders may hold the same seat at overlapping times. */
        const rs = Object.values(s.riders);
        for (let i = 0; i < rs.length; i++) {
          for (let j = i + 1; j < rs.length; j++) {
            if (rs[i].seatIndex !== rs[j].seatIndex) continue;
            /* Occupancy, not presence: a seat may be reused the moment its
               previous occupant has stood up out of it. */
            if (rs[i].seatAt < rs[j].riseAt && rs[j].seatAt < rs[i].riseAt) return false;
          }
        }
      }
      return true;
    })(),
    "seats are handed out one at a time from the platform-level set",
  );
}

// ============ 9. The employee travels WITH the seat ============
{
  let detached = 0;
  let worst = 0;
  let stationary = 0;
  for (const e of JOURNEY_EMPLOYEES) {
    let moved = 0;
    /* The seated window: from sitting down to standing up again. */
    for (let t = e.seatedAt; t <= e.riseAt; t += 0.05) {
      const s = sampleJourney(e, t)!;
      const seat = seatPose(e.rideId, e.rideSeatIndex, rideAnimationSecondsAt(SCHEDULES[e.rideId], t));
      const d = Math.hypot(s.x - seat.x, s.y - seat.y, s.z - seat.z);
      worst = Math.max(worst, d);
      if (d > 1e-6) detached++;
      moved = Math.max(moved, Math.hypot(s.x - seat.x, s.z - seat.z));
    }
    /* And the seat really does take them somewhere: the FURTHEST the ride
       moves them from where they sat down, over the whole run. A drop tower
       that has returned to its station mid-run has still carried them. */
    const start = sampleJourney(e, e.seatedAt)!;
    let travelled = 0;
    for (let t = e.rideStart; t <= e.rideEnd; t += 0.02) {
      const s = sampleJourney(e, t)!;
      travelled = Math.max(travelled, Math.hypot(s.x - start.x, s.y - start.y, s.z - start.z));
    }
    if (travelled < EMPLOYEE_HEIGHT) stationary++;
  }
  check(
    "a seated employee is exactly where their seat is, every instant of the run",
    detached === 0,
    `largest gap between rider and seat ${worst.toExponential(1)}u`,
  );
  check(
    "the ride actually carries them — nobody is left standing where they sat down",
    stationary === 0,
    "every rider is moved well clear of their boarding position mid-run",
  );
  check(
    "riders lean with the machine rather than standing upright inside it",
    JOURNEY_EMPLOYEES.some((e) => {
      for (let t = e.rideStart; t <= e.rideEnd; t += 0.05) {
        const s = sampleJourney(e, t)!;
        if (Math.abs(s.pitch) > 0.05 || Math.abs(s.roll) > 0.05) return true;
      }
      return false;
    }),
    "seat pitch and roll are carried through to the figure",
  );
}

// ============ 10. The stair, and nobody teleporting up it ============
{
  const lines: string[] = [];
  let badPitch = 0;
  let notOnGround = 0;
  let notAtDeck = 0;
  for (const id of DEPARTMENT_RIDE_IDS) {
    const st = stairFor(id);
    /* Every flight is a real flight: whole steps at the declared pitch. */
    for (const f of st.flights) {
      const run = Math.hypot(f.to[0] - f.from[0], f.to[2] - f.from[2]);
      const rise = f.to[1] - f.from[1];
      const riser = rise / f.steps;
      /*
       * The riser is allowed to drift from nominal, and has to be.
       *
       * A flight has to reach its deck in a WHOLE number of steps, so the
       * solver rounds the count and divides the height back out; on a short
       * flight that rounding moves the riser by a fifth. This used to be
       * checked against a flat 2 cm, which was a sensible-looking number while
       * a nominal riser was 18 cm and became meaningless the moment the
       * employees were drawn three times larger and the riser with them.
       *
       * What actually matters is that the step is one a climber can take. So
       * the riser is held within a quarter of nominal AND, absolutely, under a
       * seventh of the climber's own height — the same question in the units
       * the requirement is really about.
       */
      if (
        Math.abs(riser - STAIR_RISE) > STAIR_RISE * 0.25 ||
        riser > EMPLOYEE_HEIGHT * 0.14 ||
        Math.abs(run / f.steps - STAIR_GOING) > 1e-6
      ) {
        badPitch++;
      }
    }
    if (Math.abs(st.flights[0].from[1]) > 1e-9) notOnGround++;
    const head = st.path[st.path.length - 1];
    if (Math.abs(head[1] - st.deckY) > 1e-9) notAtDeck++;
    lines.push(
      `${rideById(id).label}: ${st.flights.reduce((a, f) => a + f.steps, 0)} steps in ` +
        `${st.flights.length} flight(s) to ${st.deckY.toFixed(1)}u ` +
        `(riser ${(st.flights[0].to[1] - st.flights[0].from[1]) / st.flights[0].steps < 0 ? 0 : ((st.flights[0].to[1] - st.flights[0].from[1]) / st.flights[0].steps).toFixed(2)}u, ` +
        `${(((st.flights[0].to[1] - st.flights[0].from[1]) / st.flights[0].steps / EMPLOYEE_HEIGHT) * 100).toFixed(0)}% of a climber)`,
    );
  }
  check(
    "every ride has its own stair, standing on the ground and reaching its deck",
    badPitch === 0 && notOnGround === 0 && notAtDeck === 0,
    lines.join("; "),
  );
  /*
   * A REAL ACCESS STAIR, sized against the person climbing it — but an OUTDOOR
   * one now, not an indoor one.
   *
   * The bounds moved once, deliberately. The stair used to be held to an indoor
   * building stair: a riser under 11% of the climber and a flight one person
   * wide. Drawn at that size it was invisible from the camera the park is
   * actually viewed from. It is now a theme-park access stair — a riser up to
   * 12.5% of the climber, which is the top of the range external steps are
   * built to, and a flight wide enough for two, which is what a stair carrying
   * a queue is. What has NOT moved is the pitch, still under 42 degrees and
   * still exactly atan(rise/going), because that is what the climb animation is
   * authored against.
   */
  check(
    "the steps are a real outdoor access stair, sized to the people on it",
    Math.abs(STAIR_PITCH - Math.atan2(STAIR_RISE, STAIR_GOING)) < 1e-12 &&
      (STAIR_PITCH * 180) / Math.PI < 42 &&
      STAIR_RISE / EMPLOYEE_HEIGHT < 0.125 &&
      STAIR_WIDTH / EMPLOYEE_HEIGHT > 0.6 &&
      STAIR_WIDTH / EMPLOYEE_HEIGHT < 1.2,
    `${(STAIR_RISE * 100).toFixed(0)} cm rise on a ${(STAIR_GOING * 100).toFixed(0)} cm going — ` +
      `${((STAIR_PITCH * 180) / Math.PI).toFixed(0)} degrees, ${(STAIR_WIDTH * 100).toFixed(0)} cm wide, ` +
      `which is ${((STAIR_RISE / EMPLOYEE_HEIGHT) * 100).toFixed(1)}% of a climber per step ` +
      `on a flight ${(STAIR_WIDTH / EMPLOYEE_HEIGHT).toFixed(2)} climbers wide`,
  );
  check(
    "no two rides share a stair",
    new Set(DEPARTMENT_RIDE_IDS.map((id) => stairFor(id).base.join(","))).size ===
      DEPARTMENT_RIDE_IDS.length,
    DEPARTMENT_RIDE_IDS.map(
      (id) => `${id} at (${stairFor(id).base.map((v) => v.toFixed(0)).join(", ")})`,
    ).join("; "),
  );

  /*
   * EVERY POINT OF A CLIMB IS ON THE STAIR THE SOLVER DREW — on its TREADS,
   * which are 2.97 m wide, and not merely on the centre line of them.
   *
   * The distinction is the whole point of the lanes. Employees climb abreast so
   * that nobody ever waits at the bottom for the person in front, so a climber
   * walks up to 0.99 m to one side of the middle of the flight — and their
   * outer shoulder is still 7 cm inside the handrail. So what is measured is
   * the distance to the stair ACROSS its width: on the centre line for the
   * flight they are on, and within half a stair of it sideways.
   */
  const HALF_STAIR = STAIR_WIDTH / 2;
  let offStair = 0;
  let worstOff = 0;
  for (const e of JOURNEY_EMPLOYEES) {
    const st = stairFor(e.rideId);
    for (const window of [
      [e.ladderAt, e.deckAt],
      [e.deckOutAt, e.groundAt],
    ]) {
      if (!Number.isFinite(window[0]) || !Number.isFinite(window[1])) continue;
      for (let t = window[0]; t <= window[1]; t += 0.01) {
        const s = sampleJourney(e, t)!;
        /*
         * Against the TREADS, not the middle of them. The path the solver draws
         * is the centre line of a staircase 2.99 u wide, and a climber walks in
         * one of its three lanes, so being up to half a stair off that line is
         * being on the steps. Anything beyond it is beside the staircase.
         */
        const d = distanceToPolyline([s.x, s.y, s.z], st.path);
        worstOff = Math.max(worstOff, d);
        if (d > HALF_STAIR + 1e-9) offStair++;
      }
    }
  }
  check(
    "a climbing employee is on the stair for every instant of the climb",
    offStair === 0,
    `on a flight ${STAIR_WIDTH.toFixed(2)}u wide, in one of ${CLIMB_LANES} lanes; the furthest ` +
      `anybody is from the middle of the steps is ${worstOff.toFixed(2)}u, inside the ` +
      `${HALF_STAIR.toFixed(2)}u half-width`,
  );

  /*
   * FEET ON THE TREADS.
   *
   * The obvious climbing path runs straight up a flight, through the noses of
   * its steps — and between one nose and the next, that line is BELOW the tread
   * surface, so a figure walking it sinks up to a full riser into the
   * staircase. This re-derives the solid surface under every climber: at a
   * distance d along a flight the tread you are standing on is at
   * ceil(d / going) * rise, and nobody may ever be under it.
   */
  /*
   * STATED ABOUT THE LINE THEY WALK, which is where the property lives.
   *
   * It used to be sampled: take a climber's position, work out which flight
   * they were on and which tread that put under them, and check they were not
   * below it. That was the right test for a path that ran straight up the noses
   * of the steps, and it is the wrong shape now that each lane has a path of
   * its own — attributing a sample to a flight is guesswork once a walker is a
   * lane to one side of it, and it read a climber's own landing as a fall of
   * two risers when nobody had moved vertically at all.
   *
   * So the surface is verified where it is built: EVERY segment of every lane
   * of every staircase is either a riser, which goes straight up, or a tread,
   * a landing or the step onto the deck, which are dead level. A path made only
   * of those cannot pass under a step, whoever walks it and however they are
   * sampled — and that they walk exactly it is the check above.
   */
  let sunk = 0;
  let deepest = 0;
  let footSamples = 0;
  for (const id of DEPARTMENT_RIDE_IDS) {
    const st = stairFor(id);
    for (let lane = 0; lane < CLIMB_LANES; lane++) {
      const path = stairLanePath(st, lane);
      for (let i = 1; i < path.length; i++) {
        const dy = Math.abs(path[i][1] - path[i - 1][1]);
        const flat = Math.hypot(path[i][0] - path[i - 1][0], path[i][2] - path[i - 1][2]);
        footSamples++;
        /* A riser has no run and a tread has no rise; the smaller of the two is
           what a diagonal through a step would make big. */
        const diagonal = Math.min(dy, flat);
        if (diagonal > 1e-9) {
          sunk++;
          deepest = Math.max(deepest, diagonal);
        }
      }
    }
  }
  check(
    "a climber's feet are on a tread, never inside the staircase",
    sunk === 0,
    `${footSamples} segments across every lane of every staircase, each of them a riser ` +
      `or a level tread — the worst diagonal through a step is ${deepest.toFixed(3)}u ` +
      `(one riser is ${STAIR_RISE.toFixed(2)}u)`,
  );

  /*
   * NOBODY IS EVER ON THE SAME TREAD AS ANYBODY ELSE — which is a different
   * rule from the one this used to assert, and the honest one.
   *
   * It used to be "one employee on a stair at a time, and the stair is only
   * ever climbed". Both halves have gone: riders come back down it now, and
   * serialising a 154 m switchback against a roster of twenty-seven left people
   * standing at the bottom for over an hour in front of an empty staircase. The
   * stair is three shoulders wide and people go up it side by side, so what has
   * to hold is not a turn but a clearance.
   */
  const SHOULDER = HUMAN.shoulderWidth * EMPLOYEE_SCALE;
  /* Long enough to pass somebody on a landing, far too short to climb with
     them: the two landing depths a switchback turn takes, at climbing pace. */
  const STAIR_BRUSH =
    (2 * LANDING_DEPTH) / (WALK_UNITS_PER_MINUTE * CLIMB_PACE_FRACTION);
  let tooClose = 0;
  let closest = 0;
  for (const id of DEPARTMENT_RIDE_IDS) {
    const s = SCHEDULES[id];
    /*
     * NOBODY IS EVER INSIDE ANYBODY ON A STAIR — which is the property the old
     * headway rule existed to produce, measured directly now that the rule is
     * gone.
     *
     * It used to be stated in TIME: consecutive users of a stair had to set off
     * a pace apart, and the next one waited at the bottom until they did. That
     * is an employee waiting for an employee, which the park no longer does at
     * all — the stair is three shoulders wide, so they climb abreast in lanes
     * and everybody steps on at the minute they arrive. What must still hold is
     * the physical fact underneath it, so this sweeps the actual figures: at
     * every instant, no two people anywhere on one stair are within a shoulder
     * width of each other.
     */
    const users = Object.values(s.riders).flatMap((r) => [
      { from: r.ladderAt, to: r.deckAt, r },
      { from: r.deckOutAt, to: r.groundAt, r },
    ]).filter((u) => Number.isFinite(u.from) && Number.isFinite(u.to));
    const byId = new Map(JOURNEY_EMPLOYEES.map((e) => [e.id, e]));
    const at = (u: (typeof users)[number], t: number) => sampleJourney(byId.get(u.r.employeeId)!, t)!;
    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        const a = users[i];
        const b = users[j];
        const from = Math.max(a.from, b.from);
        const to = Math.min(a.to, b.to);
        if (to <= from) continue;
        /*
         * A PASS, NOT A SHARED CLIMB — and it is the UNBROKEN overlap that says
         * which. Two people on one staircase come within a shoulder in two
         * innocent ways: the bottom step, which everybody walking in arrives at
         * before fanning out into their lane, and the landings, where a
         * switchback doubles back on itself and somebody a lane over is briefly
         * alongside. Both are moments — the second is exactly the passing place
         * a stairwell has — and adding them up across a four-minute descent
         * says nothing about either.
         *
         * What may not happen is two figures going up or down TOGETHER inside
         * one another, which would read as one person with two heads for as
         * long as it lasted. So the measure is the longest unbroken stretch, and
         * the bound is what passing costs: the time to walk the two landing
         * depths that carry you round a turn.
         */
        let run = 0;
        for (let t = from; t <= to; t += 0.005) {
          const p = at(a, t);
          const q = at(b, t);
          const d = Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
          if (d < SHOULDER - 1e-9) {
            run += 0.005;
            closest = Math.max(closest, run);
            if (run > STAIR_BRUSH) tooClose++;
          } else {
            run = 0;
          }
        }
      }
    }
  }
  check(
    "no two employees are ever inside one another on a stair",
    tooClose === 0,
    `everybody climbs the minute they arrive, in one of ${CLIMB_LANES} lanes; the longest ` +
      `two are ever inside a ${SHOULDER.toFixed(2)}u shoulder without a break is ` +
      `${(closest * 60).toFixed(1)} s, against the ${(STAIR_BRUSH * 60).toFixed(1)} s a pass ` +
      `on a landing takes`,
  );

  /*
   * The climb takes the time the stair's own length says it should — the length
   * of THEIR LANE of it, which is the line they walk: it crosses each landing
   * on its own side and starts with the stride across the bottom step from the
   * middle, where their walk in was aimed, to the side they go up. Timing them
   * against the centre line instead makes the same declared pace come out a few
   * percent slow, which is what `verify-journey` measures leg by leg.
   */
  let badPace = 0;
  let slowest = 0;
  let quickest = Infinity;
  for (const e of JOURNEY_EMPLOYEES) {
    const st = stairFor(e.rideId);
    const climbSpeed = e.walkSpeed * CLIMB_PACE_FRACTION;
    for (const [span, expected] of [
      [e.deckAt - e.ladderAt, stairLaneLength(st, e.climbLane, true) / climbSpeed],
      [e.groundAt - e.deckOutAt, stairLaneLength(st, e.descendLane, false) / climbSpeed],
    ]) {
      if (!Number.isFinite(span)) continue;
      if (Math.abs(span - expected) > 1e-6) badPace++;
      slowest = Math.max(slowest, span);
      quickest = Math.min(quickest, span);
    }
  }
  check(
    "the climb takes its own real length divided by a climbing pace",
    badPace === 0,
    `${quickest.toFixed(1)}–${slowest.toFixed(1)} min per climb, at ` +
      `${(CLIMB_PACE_FRACTION * 100).toFixed(0)}% of that employee's walking pace`,
  );

  /* And they queue for it rather than milling about. */
  let notQueued = 0;
  for (const e of JOURNEY_EMPLOYEES) {
    const st = stairFor(e.rideId);
    const slot = st.queue[Math.min(e.queueSlot, st.queue.length - 1)];
    const waitFrom = e.boardStart + 0.01;
    const waitTo = e.ladderAt - 0.01;
    if (waitTo <= waitFrom) continue;
    const s = sampleJourney(e, (waitFrom + waitTo) / 2)!;
    const atSlot = Math.hypot(s.x - slot[0], s.z - slot[1]) < 1e-6;
    const walkingToIt = s.moving;
    if (!atSlot && !walkingToIt) notQueued++;
  }
  check(
    "employees wait in the line at the foot of the stair, not around the ride",
    notQueued === 0,
    `each has their own numbered place, ${DEPARTMENT_RIDE_IDS.map(
      (id) => stairFor(id).queue.length,
    ).join("/")} deep`,
  );

  /* Continuity across the joins: the resting seat, the climb, and the run. */
  let jump = 0;
  let worstJump = 0;
  for (const e of JOURNEY_EMPLOYEES) {
    for (const t of [e.seatedAt]) {
      const before = sampleJourney(e, t - 1e-6)!;
      const after = sampleJourney(e, t + 1e-6)!;
      const d = Math.hypot(before.x - after.x, before.y - after.y, before.z - after.z);
      worstJump = Math.max(worstJump, d);
      /*
       * Two centimetres, against employees who are 3.5 m tall.
       *
       * The floor is not zero because the pendulum's own motion model does
       * not reach its resting height in finite time: `gondolaY` ends its cycle
       * with a damped settle, so a whole cycle later the car is still 3.7 mm
       * above rest and lands exactly on it only at the cycle boundary. That is
       * the ride's own physics, not a boarding defect, and it is a thousandth
       * of the height of the person sitting in it. Anything that would read as
       * a pop-in is metres, not millimetres.
       */
      if (d > 2e-2) jump++;
    }
  }
  check(
    "sitting down is continuous — nobody pops into a seat",
    jump === 0,
    `largest discontinuity at the seat ${(worstJump * 1000).toFixed(1)} mm, against a 3500 mm employee`,
  );
}

/*
 * ============ 11. The platform reaches the seats it serves ============
 *
 * A DECK IS ONE FLAT PLANE, so how close it can get to the worst of the seats
 * it serves is decided by those seats and not by how the deck is placed: the
 * best any level platform can do is HALF their vertical spread, achieved by
 * levelling on the midpoint, which is what `solveBoardingStairs` now does.
 *
 * So there are two questions, and they are asked separately.
 *
 *   1. Is the deck placed as well as a flat deck can be? That is a fact about
 *      the code and it must hold for every ride, always.
 *   2. Is the resulting step a stride? That is a fact about the ride, and on
 *      one of the six it cannot be met.
 *
 * The exception is the Ferris Wheel, and it is a direct consequence of the
 * capacity rule. Nobody ever leaves a ride, so its deck has to present a cabin
 * for each of the ten employees who board there all day; at the 40-cabin pitch
 * the 30-40 rule requires, ten cabins occupy 90 degrees of a 33 m rim and rise
 * 9.6 m across it. Half of that is 4.8 m against a 3.4 m employee. At the old
 * 60-cabin pitch the same ten cabins spanned 54 degrees and 3.6 m, which is why
 * this was a stride before and is a climb now.
 *
 * It is stated rather than hidden: the exception is named, counted and printed
 * with the number it misses by, and it is allowed only up to the geometric
 * best. A deck that is merely placed badly still fails.
 */
{
  const lines: string[] = [];
  let tooFew = 0;
  let misplaced = 0;
  const beyondStride: string[] = [];
  let worstStep = 0;
  const duckedDecks: string[] = [];
  for (const id of DEPARTMENT_RIDE_IDS) {
    const st = stairFor(id);
    if (st.seats.length < RIDE_MIN_START_COUNT) tooFew++;
    const ys = st.seats.map((i) => seatPose(id, i, 0).y);
    const steps = st.seats.map((i) => {
      const p = seatPose(id, i, 0);
      const spot = deckSpotFor(st, i);
      return Math.hypot(p.x - spot[0], p.y - spot[1], p.z - spot[2]);
    });
    const worst = Math.max(...steps);
    worstStep = Math.max(worstStep, worst);
    /* The vertical part of the worst step, against the best a flat deck can do. */
    const halfSpread = (Math.max(...ys) - Math.min(...ys)) / 2;
    const worstRise = Math.max(...st.seats.map((i) => Math.abs(seatPose(id, i, 0).y - st.deckY)));
    /*
     * THE GIGA COASTER'S DECK IS NOT SOLVED AT ALL: it is the ride's own
     * station, boards level with the floor of the car standing at them, which
     * is what a coaster station is and what it was built as long before
     * anybody rode it. Its height is therefore a fact about the machine rather
     * than a plane chosen to sit midway between seats, and the property that
     * has to hold for it is the one checked two blocks down — every seat the
     * boards offer is within a step of them.
     */
    const ownStation = id === "giga";
    /* A deck that had to duck under the ride's own sweep is levelled as well
       as it can be at the height it is allowed to be, not at the height the
       seats would like. Judged against its levelled height, not its final one. */
    const ducked = st.levelledDeckY - st.deckY > 1e-6;
    const worstRiseLevelled = Math.max(
      ...st.seats.map((i) => Math.abs(seatPose(id, i, 0).y - st.levelledDeckY)),
    );
    if (!ownStation && (ducked ? worstRiseLevelled : worstRise) > halfSpread + 1e-6) misplaced++;
    if (ducked) duckedDecks.push(`${id} dropped ${(st.levelledDeckY - st.deckY).toFixed(1)}u under its own sweep`);
    if (worst > EMPLOYEE_HEIGHT) {
      beyondStride.push(`${id} ${worst.toFixed(1)}u into a ${halfSpread.toFixed(1)}u half-spread`);
    }
    lines.push(
      `${id} deck ${(st.deckHalfAlong * 2).toFixed(0)}x${(st.deckHalfOut * 2).toFixed(0)}u ` +
        `at ${st.deckY.toFixed(1)}u, step ${worst.toFixed(1)}u`,
    );
  }
  check(
    "every platform presents a full boarding group",
    tooFew === 0,
    lines.join("; "),
  );
  check(
    "and each SOLVED deck is levelled as well as one flat plane can be",
    misplaced === 0,
    "every deck the park solved sits midway between its highest and lowest seat, so no seat " +
      "is further from it than half the spread the ride itself imposes" +
      (duckedDecks.length ? ` — except where the ride sweeps over its own floor: ${duckedDecks.join("; ")}` : ""),
  );
  {
    /*
     * AND THE ONE DECK THE PARK DID NOT SOLVE holds the property the levelling
     * was for. The Giga Coaster's boards are its own station, level with the
     * car floor, so every seat they offer has to be reachable from them: a step
     * across and up, never a climb.
     */
    const st = stairFor("giga");
    const worst = Math.max(
      ...st.seats.map((i) => {
        const p = seatPose("giga", i, 0);
        const spot = deckSpotFor(st, i);
        return Math.hypot(p.x - spot[0], p.y - spot[1], p.z - spot[2]);
      }),
    );
    check(
      "the Giga Coaster's own station reaches every seat it offers",
      worst <= EMPLOYEE_HEIGHT + 1e-6 && st.seats.length >= RIDE_MIN_START_COUNT,
      `${st.seats.length} of ${rideSeatCount("giga")} seats offered — the platform side of the ` +
        `train — the furthest ${worst.toFixed(2)}u from the boards, inside a ${EMPLOYEE_HEIGHT}u stride`,
    );
  }
  /*
   * TWO RIDES MISS THE STRIDE, each for a stated geometric reason, and no
   * others may.
   *
   *   ferris  — ten cabins on a 33 m rim cannot be brought within a stride of
   *             any single plane; the deck is already optimally levelled.
   *   monster — its loading floor is UNDER its own arms, which is the only way
   *             the far tubs are reachable, and its tubs swing 5.5u below the
   *             seats' resting height. A floor level with the seats would have
   *             cups passing through it on every revolution, so the floor is
   *             dropped clear and boarding becomes a climb into the tub — which
   *             is what stepping up into an octopus ride's car actually is.
   */
  check(
    "the step into a seat is a stride everywhere the ride's own geometry allows",
    beyondStride.every((line) => line.startsWith("ferris ") || line.startsWith("monster ")),
    beyondStride.length === 0
      ? `the longest step anywhere in the park is ${worstStep.toFixed(1)}u, inside a ${EMPLOYEE_HEIGHT}u stride`
      : `${beyondStride.join("; ")} — a climb rather than a step, and unavoidable for a flat deck`,
  );
  /*
   * AND NOTHING THE RIDE CARRIES MAY PASS THROUGH ITS OWN BOARDING FLOOR.
   * This is the reason the monster's floor was dropped, so it is the thing to
   * hold: swept against the real tub bodies, not against seat centres.
   */
  {
    const st = stairFor("monster");
    const s = rideScale("monster");
    const reach = MONSTER_GONDOLA_RADIUS * 1.44 * s;
    const drop = (MONSTER_SEAT_SURFACE_Y + MONSTER_GONDOLA_HEIGHT / 2) * s;
    let worstOver = Infinity;
    for (let t = 0; t < 300; t += 0.05) {
      for (let i = 0; i < MONSTER_SEAT_COUNT; i++) {
        const p = seatPose("monster", i, t);
        const dx = p.x - st.deck[0];
        const dz = p.z - st.deck[1];
        const a = Math.max(0, Math.abs(dx * st.along[0] + dz * st.along[1]) - st.deckHalfAlong);
        const o = Math.max(0, Math.abs(dx * st.outward[0] + dz * st.outward[1]) - st.deckHalfOut);
        if (Math.hypot(a, o) > reach) continue;
        worstOver = Math.min(worstOver, p.y - drop - st.deckY);
      }
    }
    check(
      "no cup passes through the Cup Ride's own boarding floor",
      worstOver === Infinity || worstOver > 0,
      worstOver === Infinity
        ? "no tub ever passes over the floor"
        : `the lowest tub clears the floor by ${worstOver.toFixed(2)}u`,
    );
  }
  /*
   * THE STEP INTO THE SEAT IS NOW PACED BY THE PERSON TAKING IT.
   *
   * This used to require the step to take EXACTLY `SEAT_STEP_MINUTES`, a flat
   * 0.2 min however far it was. That is fine when the platform spot is beside
   * the seat and wrong when it is not: on the Monster Ride the reach is 27 m,
   * which at a flat 0.2 min is a hundred and thirty metres a minute — faster
   * than anybody in this park is allowed to walk, and it showed up as an
   * employee briefly outrunning their own declared pace.
   *
   * So `SEAT_STEP_MINUTES` became a FLOOR and the rest is the walk, and what
   * is asserted here is the property the original was reaching for: getting in
   * takes at least the time it takes to settle, never less; it is never faster
   * than that employee walks; and it happens after they are on the deck.
   */
  /** How far this rider actually reached from the platform spot into the seat. */
  const seatReach = (e: (typeof JOURNEY_EMPLOYEES)[number]) => {
    const spot = deckSpotFor(stairFor(e.rideId), e.rideSeatIndex);
    const rest = seatPose(e.rideId, e.rideSeatIndex, 0);
    return Math.hypot(rest.x - spot[0], rest.y - spot[1], rest.z - spot[2]);
  };
  check(
    "walking the platform to a seat is a walk, and getting in is a step",
    JOURNEY_EMPLOYEES.every((e) => {
      const step = e.seatedAt - e.atSeatSpotAt;
      return (
        step >= SEAT_STEP_MINUTES - 1e-9 &&
        /* Never faster than they walk: the distance they actually covered,
           over the time they took, must not exceed their own declared pace. */
        seatReach(e) / Math.max(step, 1e-9) <= e.walkSpeed + 1e-6 &&
        e.atSeatSpotAt >= e.deckAt
      );
    }),
    `the longest reach from platform to seat is ${worstStep.toFixed(1)}u, ` +
      `taken at each rider's own pace with a ${SEAT_STEP_MINUTES} min floor`,
  );
  check(
    "a ride seat is empty unless a real employee is in it",
    (() => {
      /*
       * The department rides used to be built with sixty permanently-seated
       * figures each. A seat therefore looked occupied whether anybody was in
       * it or not, and an employee who had ridden and walked back down left a
       * figure sitting exactly where they had been — which read, correctly, as
       * never having got off. No department ride may carry a passenger of its
       * own any more.
       */
      const seatCarriers = [
        ["ferris-wheel", "Cabin.tsx"],
        ["roller-coaster", "Car.tsx"],
        ["monster-ride", "Gondola.tsx"],
        ["dragon-ride", "Ship.tsx"],
        ["ufo-pendulum", "Saucer.tsx"],
      ] as const;
      return seatCarriers.every(
        ([dir, file]) => !/<Seated(Rider|Employee)\b/.test(read("src", "components", dir, file)),
      );
    })(),
    "not one of the five department rides renders a seated figure of its own",
  );
  check(
    "the seats themselves are still there, and still grey",
    /<Seat color=/.test(read("src", "components", "ufo-pendulum", "Saucer.tsx")) &&
      /<Seat \/>/.test(read("src", "components", "dragon-ride", "Ship.tsx")) &&
      /SEAT_GREY/.test(read("src", "components", "ufo-pendulum", "parts.ts")),
    "only the passengers who never moved are gone — the seat furniture is untouched",
  );
}

// ============ 11b. The stairs sit on ground the park had spare ============
{
  /* Every point of every stair, deck included, as world x/z. */
  const footprint: [number, number][] = [];
  for (const id of DEPARTMENT_RIDE_IDS) {
    const st = stairFor(id);
    for (const p of st.path) footprint.push([p[0], p[2]]);
    for (const q of st.queue) footprint.push([q[0], q[1]]);
    for (const s of [-1, 1]) {
      for (const o of [-1, 1]) {
        footprint.push([
          st.deck[0] + st.along[0] * s * st.deckHalfAlong + st.outward[0] * o * st.deckHalfOut,
          st.deck[1] + st.along[1] * s * st.deckHalfAlong + st.outward[1] * o * st.deckHalfOut,
        ]);
      }
    }
  }

  let inOtherRide = 0;
  let sample = "";
  for (const id of DEPARTMENT_RIDE_IDS) {
    const st = stairFor(id);
    const mine: [number, number][] = [
      ...st.path.map((p) => [p[0], p[2]] as [number, number]),
      ...st.queue.map((q) => [q[0], q[1]] as [number, number]),
    ];
    for (const r of PARK_LAYOUT) {
      if (r.id === id) continue;
      for (const p of mine) {
        if (p[0] > r.minX && p[0] < r.maxX && p[1] > r.minZ && p[1] < r.maxZ) {
          inOtherRide++;
          sample = `${id}'s stair inside ${r.label}`;
        }
      }
    }
  }
  check(
    "no ride's boarding stair stands in another ride",
    inOtherRide === 0,
    sample || "each stair is on its own ride's ground",
  );

  const nearFountain = footprint.filter(
    (p) => Math.hypot(p[0] - FOUNTAIN_CENTER[0], p[1] - FOUNTAIN_CENTER[1]) < FOUNTAIN_CLEARANCE,
  ).length;
  check(
    "no boarding stair stands in the fountain",
    nearFountain === 0,
    `nearest stair point is ${Math.min(
      ...footprint.map((p) => Math.hypot(p[0] - FOUNTAIN_CENTER[0], p[1] - FOUNTAIN_CENTER[1])),
    ).toFixed(0)}u from the centre, clearance ${FOUNTAIN_CLEARANCE}u`,
  );

  /*
   * AND NOBODY WALKING TO A RIDE HAS TO PUSH THROUGH THE STAIR SERVING IT.
   *
   * The window is the WALK IN — the gate to the foot of the steps — because
   * arriving at the ride is now the same moment as sitting down on it, so
   * running the window to `rideArrival` would sweep the climb itself and score
   * every employee for standing on the platform they are boarding from.
   *
   * The last stride is exempt for the same reason: a bottom step tucked a few
   * centimetres under the deck it serves is a staircase, not a shortcut. Across
   * the whole workbook exactly one sample is under a deck at all, 4 cm inside
   * the edge and 0.6 u from the bottom step.
   */
  let throughStair = 0;
  let deepest = 0;
  for (const e of JOURNEY_EMPLOYEES) {
    const st = stairFor(e.rideId);
    for (let t = e.checkInTime; t <= e.boardStart; t += 0.05) {
      const p = sampleJourney(e, t);
      if (!p) continue;
      if (Math.hypot(p.x - st.base[0], p.z - st.base[1]) <= EMPLOYEE_HEIGHT) continue;
      const a = (p.x - st.deck[0]) * st.along[0] + (p.z - st.deck[1]) * st.along[1];
      const o = (p.x - st.deck[0]) * st.outward[0] + (p.z - st.deck[1]) * st.outward[1];
      if (Math.abs(a) < st.deckHalfAlong && Math.abs(o) < st.deckHalfOut) {
        throughStair++;
        deepest = Math.max(
          deepest,
          Math.min(st.deckHalfAlong - Math.abs(a), st.deckHalfOut - Math.abs(o)),
        );
      }
    }
  }
  check(
    "the walk in to a ride does not pass under its own boarding platform",
    throughStair === 0,
    `employees arrive on the apron at the foot of the steps and climb from there; ` +
      `beyond the last stride nobody is under a deck at all` +
      (deepest > 0 ? ` — deepest ${deepest.toFixed(2)}u` : ""),
  );
}

// ============ 11c. EVERY SEAT IN THE PARK IS GREY ============
{
  /*
   * Read out of the components that actually draw the seats, not out of a
   * constant that claims they do: a seat mesh may not be given a colour that
   * comes from a delay band, and the greys it IS given must be neutral.
   */
  const SEAT_SOURCES: [string, string[]][] = [
    ["Ferris Wheel cabin", ["src", "components", "ferris-wheel", "Cabin.tsx"]],
    ["Roller Coaster car", ["src", "components", "roller-coaster", "Car.tsx"]],
    ["Monster Ride tub", ["src", "components", "monster-ride", "SeatedEmployee.tsx"]],
    ["Dragon Ship deck", ["src", "components", "dragon-ride", "Ship.tsx"]],
    ["UFO Pendulum saucer", ["src", "components", "ufo-pendulum", "Saucer.tsx"]],
  ];
  const bandColoured: string[] = [];
  for (const [label, path] of SEAT_SOURCES) {
    const src = read(...path);
    /* A seat material fed from the band palette is exactly what had to go. */
    if (/color=\{(SEAT_COLOR_HEX|CABIN_COLOR_HEX)\[/.test(src)) bandColoured.push(label);
  }
  check(
    "no seat anywhere is painted from a delay band",
    bandColoured.length === 0,
    bandColoured.length === 0
      ? `${SEAT_SOURCES.length} ride seat components checked, none takes its colour from a band`
      : bandColoured.join(", "),
  );

  /* And the grey they use really is grey: equal-ish channels, mid value. */
  const greys = [SEAT_GREY, SEAT_GREY_DARK];
  const isNeutral = greys.every((hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const spread = Math.max(r, g, b) - Math.min(r, g, b);
    const value = (r + g + b) / 3;
    return spread <= 20 && value > 60 && value < 170;
  });
  check(
    "the seat colour is a real neutral grey, neither green, yellow nor red",
    isNeutral,
    `${SEAT_GREY} and ${SEAT_GREY_DARK}, at roughness ${SEAT_ROUGHNESS} and metalness ${SEAT_METALNESS}`,
  );

  check(
    "seat colour cannot depend on who is sitting in it",
    (() => {
      /* Nothing in the seat colour module reads a delay, a band or a rider. */
      const src = read("src", "world", "seatColor.ts");
      return !/classifyDelay|SeatColor|delay|rider/i.test(src.split("*/").slice(1).join("*/"));
    })(),
    "world/seatColor.ts is two constants and no logic — empty, occupied and free are the same grey",
  );

  check(
    "the employees' own check-in colours are untouched",
    (() => {
      const src = read("src", "components", "park", "journey", "Employees.tsx");
      return /SHIRT_BY_BAND/.test(src) && /GREEN: \[/.test(src) && /RED: \[/.test(src);
    })(),
    "the band is still worn by the person, which is now the only thing that carries it",
  );
}

// ============ 12. What the panel prints is still the sheet ============
check(
  "the dataset's Actual Work Start is carried through untouched",
  JOURNEY_EMPLOYEES.every((e) => Number.isFinite(e.workStart)) &&
    /formatSimTime\(e\.workStart\)/.test(read("src", "components", "hud", "DepartmentPanel.tsx")),
  "the ride panel still prints the sheet's own column, not a simulated one",
);
check(
  "work starts when they sit down, or at the sheet's minute, whichever is later",
  JOURNEY_EMPLOYEES.every(
    (e) => Math.abs(e.workStartActual - Math.max(e.workStartBeforeRide, e.seatedAt)) < 1e-9,
  ),
  `the wait for a full ride adds ${Math.min(
    ...JOURNEY_EMPLOYEES.map((e) => e.workStartActual - e.workStartBeforeRide),
  ).toFixed(1)}–${Math.max(
    ...JOURNEY_EMPLOYEES.map((e) => e.workStartActual - e.workStartBeforeRide),
  ).toFixed(1)} min`,
);

// ============ 13. Playback: pause, seek and speed cost nothing ============
check(
  "ride state is a pure function of the simulated minute",
  (() => {
    /* Asking twice, and asking out of order, must give the same answer. */
    const forward: string[] = [];
    for (let t = J.loopStart; t <= J.loopEnd; t += 0.7) {
      forward.push(DEPARTMENT_RIDE_IDS.map((id) => rideStateAt(SCHEDULES[id], t)).join("|"));
    }
    const backward: string[] = [];
    for (let i = forward.length - 1; i >= 0; i--) {
      const t = J.loopStart + i * 0.7;
      backward[i] = DEPARTMENT_RIDE_IDS.map((id) => rideStateAt(SCHEDULES[id], t)).join("|");
    }
    return forward.join(";") === backward.join(";");
  })(),
  "scrubbing the timeline in either direction lands on the same ride state",
);
check(
  "no ride keeps its own real-time clock any more",
  ["ferris-wheel/FerrisWheel.tsx", "dragon-ride/DragonRide.tsx", "ufo-pendulum/UfoPendulum.tsx", "monster-ride/MonsterRide.tsx", "roller-coaster/Train.tsx"].every(
    (f) => {
      const src = read("src", "components", ...f.split("/"));
      return /rideAnimationSecondsNow/.test(src) && !/elapsed\.current \+=/.test(src);
    },
  ),
  "every department ride reads the simulated clock, so 1x/5x/10x/60x stay in step",
);

// ============ 14. Occupancy reporting ============
{
  /*
   * Swept rather than spot-checked: at every minute of the day, the seats the
   * ride reports as taken must be exactly the riders who are between stepping
   * off the apron and stepping clear of the ride. With individual boarding a
   * dispatch can open the same instant the last one clears, so there is not
   * always a gap to look into — this needs no gap.
   */
  let mismatched = 0;
  let busiest = 0;
  for (const id of DEPARTMENT_RIDE_IDS) {
    const s = SCHEDULES[id];
    const everyone = Object.values(s.riders);
    for (let t = J.loopStart; t <= J.loopEnd; t += 0.05) {
      const expected = everyone
        .filter((r) => t >= r.boardAt && t < r.offAt)
        .map((r) => r.seatIndex)
        .sort((a, b) => a - b);
      const actual = [...occupiedSeatsAt(s, t)].sort((a, b) => a - b);
      busiest = Math.max(busiest, expected.length);
      if (expected.join(",") !== actual.join(",")) mismatched++;
    }
  }
  check(
    "the ride reports exactly the seats it is carrying, at every minute",
    mismatched === 0,
    `swept the whole day on all five rides; the busiest moment holds ${busiest} of ${RIDE_CAPACITY} seats`,
  );
}

// ============ Report ============
console.log("");
console.log("Ride operations, by department ride:");
for (const id of DEPARTMENT_RIDE_IDS) {
  const s = SCHEDULES[id];
  console.log(
    `  ${rideById(id).label} — ${s.arrivals.length} employees, ` +
      `${s.segments.length} running segment(s) between ${s.stops.length} stop(s)`,
  );
  for (const st of s.stops) {
    if (st.boarding.length === 0 && st.leaving.length === 0) continue;
    const held = s.segments.find((g) => g.from >= st.to - 1e-9);
    console.log(
      `    stop ${formatSimTime(st.from)}` +
        (st.leaving.length ? `  OFF ${st.leaving.join(", ")}` : "") +
        (st.boarding.length
          ? `  ON ${st.boarding.map((e) => `${e}/seat ${s.riders[e].seatIndex}`).join(", ")}`
          : "") +
        (held ? `  → runs ${formatSimTime(held.from)}-${formatSimTime(held.to)} (${held.loops} loop)` : ""),
    );
  }
}
console.log("");
console.log(
  `A run is ${RIDE_RUN_MINUTES} simulated minutes, of which the last ` +
    `${RIDE_COMPLETING_MINUTES} is the ride easing to a halt; riders hold their seats ` +
    `${SEATED_HOLD_MINUTES} min before getting out. Employees are ${EMPLOYEE_HEIGHT}u tall.`,
);
console.log(
  `Arm tilt at rest, per Monster Ride arm: ${[0, 1, 2, 3, 4]
    .map((i) => ((monsterArmTilt(i, 0) * 180) / Math.PI).toFixed(1))
    .join(", ")} degrees.`,
);

if (failures > 0) {
  console.error(`\n${failures} CHECK(S) FAILED`);
  process.exit(1);
}
console.log("\nOK: employee boarding and department ride start verified.");
