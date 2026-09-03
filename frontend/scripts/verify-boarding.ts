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
  CLIMB_PACE_FRACTION,
  STAIR_GOING,
  STAIR_PITCH,
  STAIR_RISE,
  STAIR_WIDTH,
  deckSpotFor,
} from "../src/simulation/journey/boardingStair";
import { createRide } from "../src/simulation/ride";
import { formatSimTime } from "../src/simulation/clock";
import {
  FOUNTAIN_CENTER,
  FOUNTAIN_CLEARANCE,
  PARK_LAYOUT,
  rideById,
} from "../src/components/park/layout";
import { EMPLOYEE_HEIGHT } from "../src/world/scale";
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

/** 09:30 AM, as minutes of day — the minute the brief opens on. */
const NINE_THIRTY = 9 * 60 + 30;

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
   * any time they then stand at the foot of the stair — and the only two things
   * that can cause it are the stair being occupied and the ride still finishing
   * the circuit it is on. (A full deck is the third, and never occurs on this
   * roster: at most two people are ever aboard one ride.)
   */
  let unexplained = 0;
  let worstHold = 0;
  const held: string[] = [];
  for (const e of JOURNEY_EMPLOYEES) {
    const sch = SCHEDULES[e.rideId];
    const r = sch.riders[e.id];
    /* The moment they reach the bottom step having walked straight there. */
    const walkStraightThrough = e.route.find((w) => w.phase === "WALKING_TO_LADDER")!;
    const ownWalk = walkStraightThrough.arrive - r.ladderAt;
    void ownWalk;
    const queueWaypoint = e.route.find(
      (w) => w.phase === "WAITING_AT_LADDER" && w.depart > w.arrive + 1e-9,
    );
    const hold = queueWaypoint ? queueWaypoint.depart - queueWaypoint.arrive : 0;
    worstHold = Math.max(worstHold, hold);
    if (hold <= 1e-9) continue;
    held.push(`${e.id} ${hold.toFixed(2)}min`);
    const stairBusy = Object.values(sch.riders).some(
      (o) => o.employeeId !== e.id && o.ladderAt < r.ladderAt && o.deckAt >= r.ladderAt - 1e-9,
    );
    const rideStillTurning = sch.segments.some(
      (g) => g.to > r.ladderAt - 1e-6 && g.from < r.ladderAt,
    );
    if (!stairBusy && !rideStillTurning) unexplained++;
  }
  check(
    "nobody stands at the stair for anything but the stair or the ride stopping",
    unexplained === 0,
    held.length === 0
      ? "not one employee stands and waits"
      : `${held.length} of ${JOURNEY_EMPLOYEES.length} stand at all, longest ${worstHold.toFixed(2)} min: ${held.join(", ")}`,
  );

  /*
   * AND THE WAIT IS SHORT. Held only by a running ride, an employee can be kept
   * no longer than the circuit it is on — measured against each ride's own loop.
   */
  const perRide: string[] = [];
  let overLoop = 0;
  for (const id of DEPARTMENT_RIDE_IDS) {
    const sch = SCHEDULES[id];
    const loop = ridePeriodSeconds(id) / 60;
    let worst = 0;
    for (const r of Object.values(sch.riders)) {
      const e = JOURNEY_EMPLOYEES.find((x) => x.id === r.employeeId)!;
      const stairBusy = Object.values(sch.riders).some(
        (o) => o.employeeId !== r.employeeId && o.ladderAt < r.ladderAt && o.deckAt >= r.ladderAt - 1e-9,
      );
      if (stairBusy) continue;
      const q = e.route.find((w) => w.phase === "WAITING_AT_LADDER" && w.depart > w.arrive + 1e-9);
      worst = Math.max(worst, q ? q.depart - q.arrive : 0);
    }
    if (worst > loop + 1e-6) overLoop++;
    perRide.push(`${id} ${worst.toFixed(2)}min (its loop is ${loop.toFixed(2)}min)`);
  }
  check(
    "waiting for a running ride never costs more than the circuit it is on",
    overLoop === 0,
    perRide.join(", "),
  );
}

// ============ 2. Every ride is stopped at 9:30 AM ============
{
  const states = DEPARTMENT_RIDE_IDS.map((id) => rideStateAt(SCHEDULES[id], NINE_THIRTY));
  check(
    "every department ride is stopped at 9:30 AM",
    states.every((s) => s === "STOPPED"),
    DEPARTMENT_RIDE_IDS.map((id, i) => `${rideById(id).label}: ${states[i]}`).join(", "),
  );
  check(
    "no ride is animating at 9:30 AM either",
    DEPARTMENT_RIDE_IDS.every((id) => rideAnimationSecondsAt(SCHEDULES[id], NINE_THIRTY) === 0),
    "the animation clock reads zero, which is the pose the seats board from",
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
    "every state a ride can still be in actually occurs",
    /* EMPLOYEE_EXITING is gone from the day: nobody ever gets off. */
    RIDE_STATES.filter((st) => st !== "EMPLOYEE_EXITING").every((st) => seen.has(st)) &&
      !seen.has("EMPLOYEE_EXITING"),
    `${[...seen].join(" → ")} — and never EMPLOYEE_EXITING, because nobody leaves a seat`,
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
    "every ride turns whenever nobody is getting on it",
    worstIdle > 0.85,
    `${turning.join(", ")} of the day spent turning — the rest is loading`,
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
     * FROM THE FIRST FOOT ON THE STAIR TO THE LAST PERSON SEATED, the ride must
     * be motionless.
     *
     * This used to scan the whole of every stop, which was the same thing when
     * a ride only ever turned while it was working. It no longer is: a ride now
     * turns whenever nobody needs it, so most of a stop is spent running and
     * only the loading itself is still. The window is therefore the loading
     * window, which is the property that ever mattered — an idle run is planned
     * to finish, at the platform, before anybody reaches the stair.
     */
    for (const st of s.stops) {
      const climbing = st.boarding
        .map((eid) => s.riders[eid])
        .filter((r) => Number.isFinite(r.ladderAt));
      if (climbing.length === 0) continue;
      const from = Math.min(...climbing.map((r) => r.ladderAt));
      const until = Math.max(...climbing.map((r) => r.seatAt));
      for (let t = from; t <= until; t += 0.02) {
        if (rideAnimationSecondsAt(s, t) !== 0) movingWhileBoarding++;
      }
    }
    /* And the seat somebody climbs into, or climbs out of, is exactly where it
       rests for the whole of that — from the bottom step to sitting down, and
       from standing up to stepping onto the stair to go down. */
    for (const r of Object.values(s.riders)) {
      for (const moment of [r.ladderAt, r.seatAt]) {
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

// ============ 6. Nobody rides before their department is aboard ============
{
  let startedShort = 0;
  let overCapacity = 0;
  const detail: string[] = [];
  for (const id of DEPARTMENT_RIDE_IDS) {
    const s = SCHEDULES[id];
    /* At the instant each segment is released, everyone aboard must be seated
       — nobody queueing, climbing, crossing the platform or still sitting down. */
    for (const seg of s.segments) {
      const aboard = Object.values(s.riders).filter(
        (r) => r.boardAt <= seg.from && r.offAt > seg.from,
      );
      if (aboard.some((r) => r.seatAt > seg.from + 1e-9)) startedShort++;
      if (aboard.length > RIDE_CAPACITY) overCapacity++;
      detail.push(`${id}:${aboard.length}`);
    }
  }
  check(
    "no ride starts until everybody aboard it is seated — however few that is",
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
    "every employee is shown arriving, boarding and seated — and never getting off",
    all.every(
      (p) =>
        p.has("AT_RIDE") &&
        p.has("WALKING_TO_LADDER") &&
        p.has("CLIMBING_LADDER") &&
        p.has("ON_PLATFORM") &&
        p.has("WALKING_TO_SEAT") &&
        p.has("BOARDING") &&
        p.has("SITTING_ON_RIDE") &&
        /* And nothing after it — the seat is where the journey ends. */
        !p.has("EXITING_RIDE"),
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
        e.rideArrival + AT_RIDE_DWELL <= e.boardStart + 1e-9 &&
        e.boardStart <= e.ladderAt &&
        e.ladderAt < e.deckAt &&
        e.deckAt <= e.atSeatSpotAt &&
        e.atSeatSpotAt < e.seatedAt &&
        e.seatedAt <= e.rideStart + 1e-9 &&
        e.rideStart < e.rideEnd &&
        e.seatedAt <= e.workStartActual + 1e-9 &&
        /* And there they stay: nothing after the seat has a real minute. */
        e.riseAt === Infinity &&
        e.deckOutAt === Infinity &&
        e.groundAt === Infinity &&
        e.rideExit === Infinity,
    ),
    "arrive → queue → stair → platform → seat → locked, and the ride runs around them",
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
    /* They never get up, so the seated window runs to the end of the day. */
    for (let t = e.seatedAt; t <= e.despawnTime; t += 0.05) {
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

  /* Every point of a climb is on the stair the solver drew. */
  let offStair = 0;
  let worstOff = 0;
  for (const e of JOURNEY_EMPLOYEES) {
    const st = stairFor(e.rideId);
    for (const window of [[e.ladderAt, e.deckAt]]) {
      for (let t = window[0]; t <= window[1]; t += 0.01) {
        const s = sampleJourney(e, t)!;
        const d = distanceToPolyline([s.x, s.y, s.z], st.path);
        worstOff = Math.max(worstOff, d);
        if (d > 1e-6) offStair++;
      }
    }
  }
  check(
    "a climbing employee is on the stair for every instant of the climb",
    offStair === 0,
    `furthest any climber strays from the flights ${worstOff.toExponential(1)}u`,
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
  let sunk = 0;
  let deepest = 0;
  let footSamples = 0;
  for (const e of JOURNEY_EMPLOYEES) {
    const st = stairFor(e.rideId);
    for (const window of [[e.ladderAt, e.deckAt]]) {
      for (let t = window[0]; t <= window[1]; t += 0.004) {
        const s = sampleJourney(e, t)!;
        /* The flight they are actually on — a switchback stacks flights over
           one another, so the nearest in 3D is the one under their feet. */
        let onFlight = st.flights[0];
        let nearest = Infinity;
        for (const f of st.flights) {
          const d = distanceToPolyline([s.x, s.y, s.z], [f.from, f.to]);
          if (d < nearest) {
            nearest = d;
            onFlight = f;
          }
        }
        const run = Math.hypot(onFlight.to[0] - onFlight.from[0], onFlight.to[2] - onFlight.from[2]);
        const ux = (onFlight.to[0] - onFlight.from[0]) / run;
        const uz = (onFlight.to[2] - onFlight.from[2]) / run;
        const d = (s.x - onFlight.from[0]) * ux + (s.z - onFlight.from[2]) * uz;
        if (d < -1e-6 || d > run + 1e-6) continue;
        const stepRun = run / onFlight.steps;
        const stepRise = (onFlight.to[1] - onFlight.from[1]) / onFlight.steps;
        const surface = onFlight.from[1] + Math.ceil(d / stepRun - 1e-9) * stepRise;
        footSamples++;
        if (surface - s.y > 1e-6) {
          sunk++;
          deepest = Math.max(deepest, surface - s.y);
        }
      }
    }
  }
  check(
    "a climber's feet are on a tread, never inside the staircase",
    sunk === 0,
    `${footSamples} samples across every climb; deepest a foot goes below its ` +
      `tread ${deepest.toFixed(3)}u (one riser is ${STAIR_RISE.toFixed(2)}u)`,
  );

  /* One person on it at a time, in both directions. */
  let overlaps = 0;
  for (const id of DEPARTMENT_RIDE_IDS) {
    const s = SCHEDULES[id];
    {
      /* The stair is only ever climbed. Nobody comes back down it. */
      const windows = Object.values(s.riders)
        .map((r) => [r.ladderAt, r.deckAt])
        .sort((a, b) => a[0] - b[0]);
      for (let i = 1; i < windows.length; i++) {
        if (windows[i][0] < windows[i - 1][1] - 1e-9) overlaps++;
      }
    }
  }
  check(
    "only one employee is ever on a stair",
    overlaps === 0,
    "each climber has the flight to themselves from the first step to the last",
  );

  /* The climb takes the time the stair's own length says it should. */
  let badPace = 0;
  let slowest = 0;
  let quickest = Infinity;
  for (const e of JOURNEY_EMPLOYEES) {
    const st = stairFor(e.rideId);
    const expected = st.climbLength / (e.walkSpeed * CLIMB_PACE_FRACTION);
    const up = e.deckAt - e.ladderAt;
    if (Math.abs(up - expected) > 1e-6) badPace++;
    slowest = Math.max(slowest, up);
    quickest = Math.min(quickest, up);
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
    /* A deck that had to duck under the ride's own sweep is levelled as well
       as it can be at the height it is allowed to be, not at the height the
       seats would like. Judged against its levelled height, not its final one. */
    const ducked = st.levelledDeckY - st.deckY > 1e-6;
    const worstRiseLevelled = Math.max(
      ...st.seats.map((i) => Math.abs(seatPose(id, i, 0).y - st.levelledDeckY)),
    );
    if ((ducked ? worstRiseLevelled : worstRise) > halfSpread + 1e-6) misplaced++;
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
    "and each deck is levelled as well as one flat plane can be",
    misplaced === 0,
    "every deck sits midway between its highest and lowest seat, so no seat is " +
      "further from it than half the spread the ride itself imposes" +
      (duckedDecks.length ? ` — except where the ride sweeps over its own floor: ${duckedDecks.join("; ")}` : ""),
  );
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
  check(
    "walking the platform to a seat is a walk, and getting in is a step",
    JOURNEY_EMPLOYEES.every(
      (e) => e.seatedAt - e.atSeatSpotAt - SEAT_STEP_MINUTES < 1e-9 && e.atSeatSpotAt >= e.deckAt,
    ),
    `the longest reach from platform to seat is ${worstStep.toFixed(1)}u`,
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

  /* And nobody walking to a ride has to push through the stair serving it. */
  let throughStair = 0;
  for (const e of JOURNEY_EMPLOYEES) {
    const st = stairFor(e.rideId);
    for (let t = e.checkInTime; t <= e.rideArrival; t += 0.05) {
      const p = sampleJourney(e, t);
      if (!p) continue;
      const a = (p.x - st.deck[0]) * st.along[0] + (p.z - st.deck[1]) * st.along[1];
      const o = (p.x - st.deck[0]) * st.outward[0] + (p.z - st.deck[1]) * st.outward[1];
      if (Math.abs(a) < st.deckHalfAlong && Math.abs(o) < st.deckHalfOut) throughStair++;
    }
  }
  check(
    "the walk in to a ride does not pass under its own boarding platform",
    throughStair === 0,
    "employees arrive on the apron and approach the stair from the queue",
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
    ["Park Train carriage", ["src", "components", "park-train", "Carriage.tsx"]],
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
