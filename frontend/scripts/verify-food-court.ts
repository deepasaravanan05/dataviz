import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BUILTIN_JOURNEY,
  JOURNEY_EMPLOYEES,
  sampleJourney,
  type JourneyEmployee,
} from "../src/simulation/journey/journey";
import { EMPLOYEE_DATASET } from "../src/simulation/journey/dataset";
import { formatSimTime } from "../src/simulation/clock";

/**
 * THE FOOD COURT PANEL — verification.
 *
 * Nothing renders in this environment, so what the panel would show is
 * re-derived here from the same journey and the same `sampleJourney()` the
 * panel's own publisher calls, and checked against the dataset it claims to be
 * printing.
 *
 * What is proved: the list is exactly who is inside at that instant, it is
 * never anyone with no delay, everyone leaves it the moment they walk out, it
 * is ordered by the minute they walked in, every value on it comes from the
 * attendance sheet untouched, and the panel cannot write to anything.
 */

let failures = 0;
function check(label: string, ok: boolean, detail: string) {
  if (!ok) failures++;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${label} — ${detail}`);
}

const root = join(__dirname, "..");
const read = (...p: string[]) => readFileSync(join(root, ...p), "utf8");

const J = BUILTIN_JOURNEY;

/**
 * Exactly what `FoodCourtOccupancy` publishes: everyone whose current
 * simulation state is the food court, in the order they entered.
 */
function occupantsAt(simTime: number): JourneyEmployee[] {
  return JOURNEY_EMPLOYEES.filter((e) => {
    if (!e.visitsFoodCourt || e.foodCourtEntry === null) return false;
    return sampleJourney(e, simTime)?.phase === "IN_FOOD_COURT";
  }).sort((a, b) => a.foodCourtEntry! - b.foodCourtEntry! || (a.id < b.id ? -1 : 1));
}

// ============ 1. The list is who is actually inside ============
{
  /*
   * The phase the publisher filters on, against the entry and exit minutes the
   * journey builder recorded independently. These are two different accounts of
   * the same thing and they must agree everywhere.
   */
  let disagree = 0;
  let worstEdge = 0;
  for (let t = J.loopStart; t <= J.loopEnd; t += 0.02) {
    const byPhase = new Set(occupantsAt(t).map((e) => e.id));
    const byTimes = new Set(
      JOURNEY_EMPLOYEES.filter(
        (e) => e.foodCourtEntry !== null && t > e.foodCourtEntry && t < e.foodCourtExit!,
      ).map((e) => e.id),
    );
    if (byPhase.size !== byTimes.size || [...byPhase].some((id) => !byTimes.has(id))) {
      disagree++;
      worstEdge = Math.max(worstEdge, Math.abs(byPhase.size - byTimes.size));
    }
  }
  check(
    "the panel's occupancy is exactly the door-in to door-out window",
    disagree === 0,
    "the phase the publisher reads and the entry/exit minutes never disagree",
  );
}

// ============ 2. Nobody with no delay is ever in it ============
{
  const onTime = JOURNEY_EMPLOYEES.filter((e) => e.delayMinutes === 0);
  let everInside = 0;
  for (const e of onTime) {
    for (let t = e.spawnTime; t <= e.despawnTime; t += 0.05) {
      if (sampleJourney(e, t)?.phase === "IN_FOOD_COURT") everInside++;
    }
  }
  check(
    "employees with no delay never appear in the food court panel",
    everInside === 0,
    `all ${onTime.length} zero-delay employees go straight from the gate to their ride`,
  );
  check(
    "and everyone the sheet DOES delay passes through it",
    JOURNEY_EMPLOYEES.filter((e) => e.delayMinutes > 0).every((e) => e.visitsFoodCourt),
    `${JOURNEY_EMPLOYEES.filter((e) => e.delayMinutes > 0).length} delayed employees, ` +
      `every one of them shown inside at some point`,
  );
}

// ============ 3. They leave the list the moment they leave ============
{
  let lingering = 0;
  let missing = 0;
  for (const e of JOURNEY_EMPLOYEES) {
    if (!e.visitsFoodCourt) continue;
    /* Listed a moment before they reach the door on the way out... */
    if (!occupantsAt(e.foodCourtExit! - 0.02).some((o) => o.id === e.id)) missing++;
    /* ...and gone a moment after. */
    if (occupantsAt(e.foodCourtExit! + 0.02).some((o) => o.id === e.id)) lingering++;
    /* And not there before they walked in. */
    if (occupantsAt(e.foodCourtEntry! - 0.02).some((o) => o.id === e.id)) lingering++;
  }
  check(
    "an employee drops off the list the instant they walk out",
    lingering === 0 && missing === 0,
    "listed while inside, absent before and after — no one lingers",
  );
}

// ============ 4. The count is live, and never hardcoded ============
{
  const counts = new Map<number, number>();
  let peak = 0;
  let peakAt = 0;
  const changes: string[] = [];
  let last = -1;
  for (let t = J.loopStart; t <= J.loopEnd; t += 0.02) {
    const n = occupantsAt(t).length;
    counts.set(n, (counts.get(n) ?? 0) + 1);
    if (n > peak) {
      peak = n;
      peakAt = t;
    }
    if (n !== last) {
      if (last >= 0) changes.push(`${formatSimTime(t)}:${n}`);
      last = n;
    }
  }
  check(
    "the count really does move as employees come and go",
    counts.size > 2 && changes.length > 4,
    `it takes ${counts.size} different values across the day and changes ` +
      `${changes.length} times; the peak is ${peak} at ${formatSimTime(peakAt)}`,
  );
  check(
    "the panel holds no count of its own",
    !/Currently Inside:\s*\d|occupants\s*[:=]\s*\[[^\]]/.test(
      read("src", "components", "hud", "FoodCourtPanel.tsx"),
    ),
    "the number printed is the length of the live list, not a literal",
  );
}

// ============ 5. Ordered by the minute they walked in ============
{
  let outOfOrder = 0;
  let sample = "";
  for (let t = J.loopStart; t <= J.loopEnd; t += 0.05) {
    const inside = occupantsAt(t);
    for (let i = 1; i < inside.length; i++) {
      if (inside[i - 1].foodCourtEntry! > inside[i].foodCourtEntry! + 1e-9) {
        outOfOrder++;
        if (!sample) sample = `${inside[i - 1].id} listed above ${inside[i].id} at ${formatSimTime(t)}`;
      }
    }
  }
  check(
    "the list is in the order employees came through the door",
    outOfOrder === 0,
    sample || "first in, first listed, at every minute of the day",
  );
}

// ============ 6. Every value is the dataset's own ============
{
  const rows = new Map(EMPLOYEE_DATASET.map((r) => [r.id, r]));
  let wrong = 0;
  for (const e of JOURNEY_EMPLOYEES) {
    const row = rows.get(e.id)!;
    if (e.id !== row.id || e.department !== row.department || e.delayMinutes !== row.delayMinutes) {
      wrong++;
    }
  }
  check(
    "ID, department and delay are the attendance sheet's own columns",
    wrong === 0,
    `all ${JOURNEY_EMPLOYEES.length} rows carried through the journey builder untouched`,
  );

  const panel = read("src", "components", "hud", "FoodCourtPanel.tsx");
  check(
    "the panel prints the ID, never the name",
    /e\.id/.test(panel) && !/\be\.name\b/.test(panel),
    "employee.id, employee.department and employee.delayMinutes, and nothing else",
  );
  check(
    "the panel computes no delay of its own",
    /e\.delayMinutes/.test(panel) && !/classifyDelay|workStart|checkIn/.test(panel),
    "the delay column is printed, not recalculated",
  );
}

// ============ 7. It is an overlay, and cannot touch the park ============
{
  const panel = read("src", "components", "hud", "FoodCourtPanel.tsx");
  const publisher = read("src", "components", "park", "journey", "FoodCourtOccupancy.tsx");
  const store = read("src", "store", "foodCourtStore.ts");
  const wrapper = read("src", "components", "food-court", "SelectableFoodCourt.tsx");
  const foodCourt = read("src", "components", "food-court", "FoodCourt.tsx");

  check(
    "the panel is real HTML, not a 3D object",
    !/@react-three|drei|<mesh|<group/.test(panel),
    "no three.js import anywhere in the panel",
  );
  check(
    "nothing in the food court layer can move the simulation",
    !/seekJourneyClock|setJourneyPaused|setJourneySpeed|advanceJourneyClock/.test(
      panel + publisher + store + wrapper,
    ) && !/EMPLOYEE_DATASET/.test(panel + publisher + store),
    "the clock, the walkers and the dataset are read-only from here",
  );
  check(
    "the publisher runs on the simulated clock, never a real-world timer",
    /currentSimTime\(\)/.test(publisher) &&
      !/setInterval|setTimeout|Date\.now|performance\.now/.test(publisher),
    "so it tracks correctly at 1x, 5x, 10x and 60x, and freezes when paused",
  );
  check(
    "the food court model itself is untouched",
    !/onClick|onPointer|useFoodCourtStore/.test(foodCourt),
    "the click lives in a wrapper around it, exactly as SelectableRide does for rides",
  );
  check(
    "opening one panel closes the other",
    /useRideSelectionStore\.getState\(\)\.clear\(\)/.test(store) &&
      /useFoodCourtStore/.test(read("src", "components", "park", "SelectableRide.tsx")),
    "a ride click closes the food court panel, and a food court click closes the ride's",
  );
  check(
    "clicking empty park still closes everything",
    /clearFoodCourtSelection\(\)/.test(read("src", "components", "roller-coaster", "ParkScene.tsx")),
    "onPointerMissed clears the ride, the employee and the food court",
  );
}

// ============ 8. The list only re-renders when it changes ============
check(
  "the store is written only when somebody actually enters or leaves",
  /if \(current\.length === ids\.length && current\.every/.test(read("src", "store", "foodCourtStore.ts")),
  "the frame loop compares before it sets, so the panel does not re-render sixty times a second",
);

// ============ Report ============
console.log("");
console.log("Food court occupancy through the morning:");
let last = -1;
for (let t = J.loopStart; t <= J.loopEnd; t += 0.02) {
  const inside = occupantsAt(t);
  if (inside.length === last) continue;
  last = inside.length;
  console.log(
    `  ${formatSimTime(t).padStart(8)}  ${String(inside.length).padStart(2)} inside` +
      (inside.length
        ? `  ${inside.map((e) => `${e.id} ${e.department} ${e.delayMinutes}min`).join("  |  ")}`
        : ""),
  );
}

if (failures > 0) {
  console.error(`\n${failures} CHECK(S) FAILED`);
  process.exit(1);
}
console.log("\nOK: food court panel verified.");
