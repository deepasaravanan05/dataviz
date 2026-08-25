import {
  RIDERS,
  countRiderColor,
  SEAT_COLOR_HEX,
  validateRiders,
} from "../src/components/monster-ride/riders";
import {
  ARM_COUNT,
  GONDOLAS_PER_ARM,
  MONSTER_ORIGIN,
  RIDE_REACH,
  SEATS_PER_GONDOLA,
  SEAT_COUNT,
} from "../src/components/monster-ride/constants";
import { classifyDelay } from "../src/simulation/classification";
import { COASTER_ORIGIN } from "../src/components/roller-coaster/constants";
import { WHEEL_RADIUS, BASE_WIDTH, BASE_DEPTH } from "../src/components/ferris-wheel/constants";

let failures = 0;
function check(label: string, ok: boolean, detail: string) {
  if (!ok) failures++;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${label} — ${detail}`);
}

validateRiders();

// ---------- Seats (60 / 20-20-20, matches the project's status colours) ----------
const green = countRiderColor("GREEN");
const yellow = countRiderColor("YELLOW");
const red = countRiderColor("RED");
check("seat count", RIDERS.length === 60, `${RIDERS.length}`);
check("arms x gondolas x seats = 60", ARM_COUNT * GONDOLAS_PER_ARM * SEATS_PER_GONDOLA === 60, `${ARM_COUNT}x${GONDOLAS_PER_ARM}x${SEATS_PER_GONDOLA}`);
check("SEAT_COUNT constant matches", SEAT_COUNT === 60, `${SEAT_COUNT}`);
check("green riders", green === 20, `${green}`);
check("yellow riders", yellow === 20, `${yellow}`);
check("red riders", red === 20, `${red}`);
check("colours sum to 60", green + yellow + red === 60, `${green + yellow + red}`);
check(
  "exact project hexes",
  SEAT_COLOR_HEX.GREEN === "#22C55E" && SEAT_COLOR_HEX.YELLOW === "#FACC15" && SEAT_COLOR_HEX.RED === "#EF4444",
  "22C55E / FACC15 / EF4444",
);

// ---------- Colour derived from the REAL classifier, not hard-coded ----------
const misclassified = RIDERS.filter((r) => r.color !== classifyDelay(r.delayMinutes));
check("every seat colour matches classifyDelay(delay)", misclassified.length === 0, `${misclassified.length} mismatches`);

// ---------- Colours never grouped: every gondola has all three colours ----------
let monochromeGondolas = 0;
for (let arm = 0; arm < ARM_COUNT; arm++) {
  for (let g = 0; g < GONDOLAS_PER_ARM; g++) {
    const colours = new Set(RIDERS.filter((r) => r.arm === arm && r.gondola === g).map((r) => r.color));
    if (colours.size === 1) monochromeGondolas++;
  }
}
check("no monochrome gondola", monochromeGondolas === 0, `${monochromeGondolas} single-colour gondolas`);

// ---------- Employee data fields required by the spec ----------
const hasAllFields = RIDERS.every(
  (r) =>
    typeof r.employeeId === "string" &&
    Number.isFinite(r.checkInTime) &&
    Number.isFinite(r.rideArrivalTime) &&
    Number.isFinite(r.workStartTime) &&
    Number.isFinite(r.delayMinutes) &&
    r.workStartTime === r.checkInTime + r.delayMinutes &&
    r.rideArrivalTime >= r.checkInTime &&
    r.rideArrivalTime <= r.workStartTime,
);
check("every rider has check-in/ride/work-start/delay consistent", hasAllFields, "checked 60 riders");

const uniqueIds = new Set(RIDERS.map((r) => r.employeeId));
check("employee IDs are unique", uniqueIds.size === 60, `${uniqueIds.size} unique ids`);

// ---------- Placement / clearance from the other two rides ----------
const monsterReach = RIDE_REACH;
const dxWheel = MONSTER_ORIGIN[0];
const dzWheel = MONSTER_ORIGIN[2];
const wheelGap = Math.hypot(dxWheel, dzWheel) - monsterReach - Math.max(WHEEL_RADIUS, BASE_WIDTH / 2, BASE_DEPTH / 2);
check("clear of the Ferris Wheel", wheelGap > 5, `gap ${wheelGap.toFixed(1)}u`);

const dxCoaster = MONSTER_ORIGIN[0] - COASTER_ORIGIN[0];
const dzCoaster = MONSTER_ORIGIN[2] - COASTER_ORIGIN[2];
const coasterGap = Math.hypot(dxCoaster, dzCoaster) - monsterReach - 30; // coaster's own approx reach
check("clear of the Roller Coaster", coasterGap > 0, `gap ${coasterGap.toFixed(1)}u`);

console.log(`\nMonster Ride centred at (${MONSTER_ORIGIN[0]}, ${MONSTER_ORIGIN[2]}), reach ${RIDE_REACH.toFixed(1)}u`);
console.log(failures === 0 ? "OK: all Monster Ride checks passed." : `${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
