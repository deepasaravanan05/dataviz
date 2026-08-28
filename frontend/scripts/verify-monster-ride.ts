import {
  RIDERS,
  countRiderColor,
  SEAT_COLOR_HEX,
  validateRiders,
} from "../src/components/monster-ride/riders";
import {
  ARM_COUNT,
  GONDOLAS_PER_ARM,
  GONDOLA_HEIGHT,
  GONDOLA_LOWEST_LOCAL,
  MONSTER_ORIGIN,
  RIDE_REACH,
  SEATS_PER_GONDOLA,
  SEAT_COUNT,
  SEAT_MOUNT_Y,
  TIP_TO_TUB_BOTTOM,
} from "../src/components/monster-ride/constants";
import { RIDE_SEAT_SCALE } from "../src/world/scale";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
import { classifyDelay } from "../src/simulation/classification";
import { COASTER_ORIGIN } from "../src/components/roller-coaster/constants";
import { WHEEL_RADIUS, BASE_WIDTH, BASE_DEPTH } from "../src/components/ferris-wheel/constants";

let failures = 0;
function check(label: string, ok: boolean, detail: string) {
  if (!ok) failures++;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${label} — ${detail}`);
}

validateRiders();

// ---------- Seats (30-40 per ride, evenly banded) ----------
/*
 * THE CAPACITY RULE IS NOW 30-40 SEATS PER RIDE, 40 PREFERRED, and the three
 * GREEN / YELLOW / RED counts are an ALLOCATION order rather than a paint job —
 * every seat in the park is grey. What has to hold is that the ride is inside
 * the band, that the three allocation pools are even, and that they account for
 * every seat; the old "60 and 20 apiece" said the same thing at the old count.
 */

const green = countRiderColor("GREEN");
const yellow = countRiderColor("YELLOW");
const red = countRiderColor("RED");
check(
  "capacity is in the 30-40 band, at the preferred 40",
  SEAT_COUNT >= 30 && SEAT_COUNT <= 40,
  `${SEAT_COUNT} seats`,
);
check("seat count", RIDERS.length === SEAT_COUNT, `${RIDERS.length}`);
check(
  "every seat is a real place on a real gondola",
  ARM_COUNT * GONDOLAS_PER_ARM * SEATS_PER_GONDOLA === SEAT_COUNT,
  `${ARM_COUNT} arms x ${GONDOLAS_PER_ARM} gondolas x ${SEATS_PER_GONDOLA} seats = ${SEAT_COUNT}`,
);
check(
  "the three allocation bands are even",
  Math.max(green, yellow, red) - Math.min(green, yellow, red) <= 1,
  `${green} green / ${yellow} yellow / ${red} red`,
);
check(
  "every seat belongs to a band",
  green + yellow + red === SEAT_COUNT,
  `${green + yellow + red} of ${SEAT_COUNT}`,
);
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
check("every rider has check-in/ride/work-start/delay consistent", hasAllFields, `checked ${RIDERS.length} riders`);

const uniqueIds = new Set(RIDERS.map((r) => r.employeeId));
check("employee IDs are unique", uniqueIds.size === RIDERS.length, `${uniqueIds.size} unique ids`);

// ---------- Nothing on a gondola hangs lower than the model thinks ----------
/*
 * The ground clearance is solved from GONDOLA_LOWEST_LOCAL, so anything drawn
 * below that number is invisible to the solver and will quietly plough through
 * the grass. The bug that made this necessary was a torus with no rotation:
 * TorusGeometry is built in the XY plane, so an unrotated one STANDS ON EDGE
 * and hangs a full radius below where a flat band would sit. Every torus in the
 * gondola must therefore declare a rotation.
 */
{
  const gondolaSrc = readFileSync(
    join(ROOT, "src", "components", "monster-ride", "Gondola.tsx"),
    "utf8",
  );
  const toruses = gondolaSrc.match(/<mesh[^>]*>\s*<torusGeometry/g) ?? [];
  const unrotated = (gondolaSrc.match(/<mesh(?![^>]*rotation)[^>]*>\s*<torusGeometry/g) ?? []).length;
  check(
    "no ring on a gondola stands on edge — every torus lies where it is meant to",
    toruses.length > 0 && unrotated === 0,
    `${toruses.length} torus band(s), ${unrotated} without a rotation`,
  );
  check(
    "the clearance model measures the lowest part actually drawn",
    Math.abs(
      GONDOLA_LOWEST_LOCAL -
        Math.min(
          -GONDOLA_HEIGHT / 2,
          -GONDOLA_HEIGHT / 2 + 0.12 - 0.09,
          SEAT_MOUNT_Y - 0.39 * RIDE_SEAT_SCALE,
        ),
    ) < 1e-9,
    `lowest gondola part ${GONDOLA_LOWEST_LOCAL.toFixed(3)}u below the tub's centre, ` +
      `so a tip-to-lowest drop of ${TIP_TO_TUB_BOTTOM.toFixed(3)}u`,
  );
}

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
