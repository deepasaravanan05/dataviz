import type { DatasetRow } from "./dataset";
import { CHECK_IN_DWELL, FOOD_COURT_CHAIRS, LANE_COUNT } from "./constants";
import { parkIntake } from "./rideOps";

/**
 * Making an arbitrary roster into one the park can actually animate.
 *
 * `buildJourney()` is strict on purpose, and it stays strict: it refuses a
 * roster whose delay arithmetic contradicts its own clock times, one that
 * names the same employee twice, one that sends two people through the same
 * turnstile at the same moment, one that seats more diners than the food court
 * has chairs, and one that sends more people to a ride than the ride can seat.
 * Every one of those refusals is right — a park drawn from a roster it cannot
 * honestly represent would be a lie, and the built-in dataset must never be
 * quietly "fixed" to fit.
 *
 * But an UPLOAD is a different question. A spreadsheet someone keeps by hand
 * fails those rules constantly and innocently — a delay column rounded to the
 * nearest five minutes, a duplicated row, forty people badging in at 9:00 —
 * and handing the file back with a stack trace about turnstile dwell is not an
 * answer anybody can act on. So the repair happens HERE, before the builder is
 * ever called, and the builder's contract is untouched: this module's whole
 * job is to return rows that satisfy it.
 *
 * Every repair is minimal and stated. Times only ever move FORWARD and only as
 * far as the constraint requires, each employee's delay — the thing the park
 * exists to show — is carried through every shift unchanged, and what was
 * changed comes back in `notes` for the upload panel to display.
 */

/** A working day, used when a file's check-out is missing or impossible. */
const DEFAULT_WORKDAY_MINUTES = 8 * 60;

/**
 * How long a diner is assumed to hold a chair, at least.
 *
 * The real figure is solved inside the builder from the walk to the court and
 * the minimum visible sit; this is a deliberate over-estimate of it, so the
 * spreading below can only ever be more cautious than the court needs rather
 * than less.
 */
const MIN_CHAIR_HOLD_MINUTES = 15;

/** What had to be done to the file to make it animatable. */
export interface RosterRepairs {
  renamedIds: number;
  recomputedDelays: number;
  fixedCheckOuts: number;
  shiftedArrivals: number;
  dropped: number;
}

export interface RepairedRoster {
  rows: DatasetRow[];
  repairs: RosterRepairs;
  /** Plain-language lines for the upload panel. Empty when nothing was done. */
  notes: string[];
}

const CHAIRS = FOOD_COURT_CHAIRS.length;

/** Minutes of the day, rounded to whole minutes and never negative. */
function minute(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

/**
 * Move one employee's whole day forward by `by` minutes.
 *
 * The DELAY IS AN INVARIANT of this operation. An employee shifted to clear a
 * turnstile or wait for a chair is still the same employee who was however
 * many minutes late; only the clock they did it on moves, so the seat colour
 * they are classified into and the sit they take in the food court are exactly
 * what their own sheet said.
 */
function shift(row: DatasetRow, by: number): DatasetRow {
  if (by <= 0) return row;
  return {
    ...row,
    checkIn: row.checkIn + by,
    workStart: row.workStart + by,
    checkOut: row.checkOut + by,
  };
}

/**
 * Turnstile spacing.
 *
 * The builder deals gate lanes round-robin by ROW INDEX, so once the roster is
 * in arrival order rows i and i-LANE_COUNT share a lane and must be at least
 * one dwell apart. Sorting first is what makes the rule meaningful: a lane's
 * two occupants are then genuinely consecutive arrivals into it, which is the
 * most spread any assignment can achieve, so this pass moves the fewest people
 * the fewest minutes.
 */
function spaceLanes(rows: DatasetRow[]): { rows: DatasetRow[]; moved: number } {
  const out = rows.slice();
  let moved = 0;
  for (let i = 0; i < out.length; i++) {
    let earliest = i > 0 ? out[i - 1].checkIn : -Infinity;
    if (i >= LANE_COUNT) {
      earliest = Math.max(earliest, out[i - LANE_COUNT].checkIn + CHECK_IN_DWELL);
    }
    if (out[i].checkIn < earliest) {
      out[i] = shift(out[i], earliest - out[i].checkIn);
      moved++;
    }
  }
  return { rows: out, moved };
}

/**
 * Food court spacing.
 *
 * Only the delayed take a chair, and a chair is released the moment its
 * occupant stands. So this walks the delayed employees in arrival order over
 * the court's real chair count, and anybody who reaches a full court waits for
 * the first chair to come free rather than being a reason to refuse the file.
 */
function spaceDiners(rows: DatasetRow[]): { rows: DatasetRow[]; moved: number } {
  const out = rows.slice();
  const freeAt: number[] = [];
  let moved = 0;

  for (let i = 0; i < out.length; i++) {
    if (out[i].delayMinutes <= 0) continue;
    const hold = Math.max(out[i].delayMinutes, MIN_CHAIR_HOLD_MINUTES);

    if (freeAt.length < CHAIRS) {
      freeAt.push(out[i].checkIn + hold);
      continue;
    }
    /* Every chair is spoken for: take the one that comes free soonest. */
    let earliest = 0;
    for (let c = 1; c < freeAt.length; c++) if (freeAt[c] < freeAt[earliest]) earliest = c;

    if (out[i].checkIn < freeAt[earliest]) {
      out[i] = shift(out[i], freeAt[earliest] - out[i].checkIn);
      moved++;
    }
    freeAt[earliest] = out[i].checkIn + hold;
  }
  return { rows: out, moved };
}

function sortByArrival(rows: DatasetRow[]): DatasetRow[] {
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => a.row.checkIn - b.row.checkIn || a.index - b.index)
    .map((r) => r.row);
}

/** True when the roster already satisfies both spacing rules. */
function spacingHolds(rows: DatasetRow[]): boolean {
  for (let i = LANE_COUNT; i < rows.length; i++) {
    if (rows[i].checkIn < rows[i - LANE_COUNT].checkIn + CHECK_IN_DWELL) return false;
  }
  const freeAt: number[] = [];
  for (const row of rows) {
    if (row.delayMinutes <= 0) continue;
    const hold = Math.max(row.delayMinutes, MIN_CHAIR_HOLD_MINUTES);
    if (freeAt.length < CHAIRS) { freeAt.push(row.checkIn + hold); continue; }
    let earliest = 0;
    for (let c = 1; c < freeAt.length; c++) if (freeAt[c] < freeAt[earliest]) earliest = c;
    if (row.checkIn < freeAt[earliest]) return false;
    freeAt[earliest] = row.checkIn + hold;
  }
  return true;
}

/**
 * A spacing that satisfies both rules BY CONSTRUCTION, for the rosters the
 * two passes above cannot settle between them.
 *
 * One dwell across LANE_COUNT lanes puts every lane-mate a full dwell apart,
 * and one chair-hold across the chairs less one means a diner never meets a
 * full court. It is a blunt instrument — it re-times the whole roster onto an
 * even cadence — which is why it is the fallback and not the method.
 */
function spreadEvenly(rows: DatasetRow[]): DatasetRow[] {
  const longestHold = Math.max(
    MIN_CHAIR_HOLD_MINUTES,
    ...rows.map((r) => Math.max(r.delayMinutes, 0)),
  );
  const gap = Math.max(CHECK_IN_DWELL / LANE_COUNT, longestHold / Math.max(CHAIRS - 1, 1));
  const start = rows[0]?.checkIn ?? 0;
  return rows.map((row, i) => {
    const at = start + i * gap;
    return at > row.checkIn ? shift(row, at - row.checkIn) : row;
  });
}

/**
 * Make any roster animatable, or say what had to give.
 *
 * The order matters. Identity and arithmetic are settled per row first, since
 * the spacing passes carry a row's delay through every shift and need it to
 * mean something. The roster is then cut to the seating the park physically
 * has, because spacing people the park cannot seat is wasted work. Only then
 * are the two spacing rules run to a fixed point.
 */
export function repairRoster(rows: DatasetRow[]): RepairedRoster {
  const repairs: RosterRepairs = {
    renamedIds: 0,
    recomputedDelays: 0,
    fixedCheckOuts: 0,
    shiftedArrivals: 0,
    dropped: 0,
  };

  /* ---- Per row: a unique identity, and arithmetic that adds up ---- */
  const seen = new Map<string, number>();
  let repaired: DatasetRow[] = rows.map((row) => {
    let id = String(row.id ?? "").trim() || "EMP";
    const times = seen.get(id) ?? 0;
    seen.set(id, times + 1);
    if (times > 0) { id = `${id}-${times + 1}`; repairs.renamedIds++; }

    const checkIn = minute(row.checkIn);
    let workStart = minute(row.workStart);
    /*
     * THE TWO CLOCK TIMES WIN over the delay column. Both are things somebody
     * observed and wrote down; the delay is the difference between them, and a
     * difference that disagrees with its own operands is the derived figure
     * being stale — a column rounded to five minutes, or not updated after the
     * times were corrected. Where the times give an impossible answer, though
     * — work starting before arrival, which usually means a shift across
     * midnight or a misread cell — the delay column is the better witness.
     */
    let delayMinutes = workStart - checkIn;
    if (delayMinutes < 0) {
      delayMinutes = Math.max(0, minute(row.delayMinutes));
      workStart = checkIn + delayMinutes;
    }
    if (delayMinutes !== row.delayMinutes || workStart !== row.workStart) repairs.recomputedDelays++;

    let checkOut = minute(row.checkOut);
    if (checkOut <= workStart) {
      checkOut = workStart + DEFAULT_WORKDAY_MINUTES;
      repairs.fixedCheckOuts++;
    }

    return { ...row, id, name: String(row.name ?? "").trim() || id, checkIn, delayMinutes, workStart, checkOut };
  });

  repaired = sortByArrival(repaired);

  /*
   * ---- The park's real seating is a hard ceiling ----
   *
   * Not the seats the rides have, nor even the seats a stopped ride presents,
   * but the seats its BOARDING DECK reaches: nobody ever gets off in this
   * park, so a ride's whole day is one deckful. `parkIntake()` is the same
   * number `buildRideSchedule` hands out, so a roster that passes here cannot
   * fail there.
   */
  const capacity = parkIntake();
  if (repaired.length > capacity) {
    repairs.dropped = repaired.length - capacity;
    repaired = repaired.slice(0, capacity);
  }

  /* ---- Spacing, run to a fixed point ---- */
  for (let pass = 0; pass < 12 && !spacingHolds(repaired); pass++) {
    const lanes = spaceLanes(repaired);
    repairs.shiftedArrivals += lanes.moved;
    const diners = spaceDiners(sortByArrival(lanes.rows));
    repairs.shiftedArrivals += diners.moved;
    repaired = sortByArrival(diners.rows);
  }
  if (!spacingHolds(repaired)) {
    repaired = spaceLanes(spreadEvenly(repaired)).rows;
    repairs.shiftedArrivals = repaired.length;
  }

  const notes: string[] = [];
  if (repairs.renamedIds) {
    notes.push(`${repairs.renamedIds} repeated employee ID${repairs.renamedIds > 1 ? "s" : ""} made unique`);
  }
  if (repairs.recomputedDelays) {
    notes.push(`${repairs.recomputedDelays} delay${repairs.recomputedDelays > 1 ? "s" : ""} recomputed from the clock times`);
  }
  if (repairs.fixedCheckOuts) {
    notes.push(`${repairs.fixedCheckOuts} missing check-out${repairs.fixedCheckOuts > 1 ? "s" : ""} set to an 8-hour day`);
  }
  if (repairs.shiftedArrivals) {
    notes.push(`${repairs.shiftedArrivals} arrival${repairs.shiftedArrivals > 1 ? "s" : ""} spaced out at the gate`);
  }
  if (repairs.dropped) {
    notes.push(`Showing the first ${repaired.length} — the park seats ${capacity}`);
  }

  return { rows: repaired, repairs, notes };
}
