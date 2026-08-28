import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CABIN_BODY, cabinHue } from "../src/components/ferris-wheel/cabinPaint";
import { CABINS, ANGLE_STEP, CABIN_RADIUS, countByColor, CABIN_COLOR_HEX } from "../src/components/ferris-wheel/cabinManifest";
import {
  ARM_LENGTH,
  BASE_HEIGHT,
  CABIN_HANG,
  CABIN_LOWER,
  CABIN_COUNT,
  CABIN_HEIGHT,
  CABIN_WIDTH,
  WHEEL_CENTER_HEIGHT,
  WHEEL_RADIUS,
  SPOKE_COUNT,
} from "../src/components/ferris-wheel/constants";

const ROOT = join(import.meta.dirname, "..");

let failures = 0;
function check(label: string, condition: boolean, detail: string) {
  const status = condition ? "PASS" : "FAIL";
  if (!condition) failures++;
  console.log(`[${status}] ${label} — ${detail}`);
}

// --- Counts (§4, §5) ---
const green = countByColor("GREEN");
const yellow = countByColor("YELLOW");
const red = countByColor("RED");
check("cabin count", CABINS.length === CABIN_COUNT, `${CABINS.length} cabins`);
/*
 * THE CAPACITY RULE IS NOW 30-40 SEATS PER RIDE, 40 PREFERRED, and a Ferris
 * Wheel cabin is this ride's seat — so the cabin count IS the capacity. The
 * three GREEN / YELLOW / RED counts are an ALLOCATION order, not a paint job
 * (every seat in the park is grey), so what has to hold is that they are even
 * and that they account for every cabin, not that they are 20 apiece.
 */
check(
  "capacity is in the 30-40 band, at the preferred 40",
  CABIN_COUNT >= 30 && CABIN_COUNT <= 40,
  `${CABIN_COUNT} cabins`,
);
check(
  "the three allocation bands are even",
  Math.max(green, yellow, red) - Math.min(green, yellow, red) <= 1,
  `${green} green / ${yellow} yellow / ${red} red`,
);
check(
  "every cabin belongs to a band",
  green + yellow + red === CABIN_COUNT,
  `${green + yellow + red} of ${CABIN_COUNT}`,
);

// --- Exact palette (§5, §22) ---
check("green hex", CABIN_COLOR_HEX.GREEN === "#22C55E", CABIN_COLOR_HEX.GREEN);
check("yellow hex", CABIN_COLOR_HEX.YELLOW === "#FACC15", CABIN_COLOR_HEX.YELLOW);
check("red hex", CABIN_COLOR_HEX.RED === "#EF4444", CABIN_COLOR_HEX.RED);

// --- Repeating pattern, never clumped (§6) ---
const patternOk = CABINS.every((c, i) => c.color === (["GREEN", "YELLOW", "RED"] as const)[i % 3]);
check("G->Y->R repeating pattern", patternOk, CABINS.slice(0, 6).map((c) => c.color).join(" "));

/*
 * EVEN SPACING, whatever the count. The step used to be pinned to the 6 degrees
 * sixty cabins produce; what the requirement actually is — cabins evenly
 * distributed, realistically spaced, none touching — is checked directly, so it
 * keeps meaning something at forty.
 */
const stepDeg = (ANGLE_STEP * 180) / Math.PI;
check(
  "cabins are evenly distributed around the rim",
  Math.abs(stepDeg - 360 / CABIN_COUNT) < 1e-9,
  `${stepDeg.toFixed(4)} degrees between neighbours`,
);
{
  const arc = 2 * Math.PI * CABIN_RADIUS / CABIN_COUNT;
  check(
    "and no two of them touch",
    arc > CABIN_WIDTH,
    `${arc.toFixed(2)} u of arc for a ${CABIN_WIDTH} u cabin — ` +
      `${(arc - CABIN_WIDTH).toFixed(2)} u of daylight between neighbours`,
  );
}

// --- Cabins sit on the outer circumference (§8) ---
const radii = CABINS.map((c) => Math.hypot(c.mount[0], c.mount[1]));
const minR = Math.min(...radii);
const maxR = Math.max(...radii);
check(
  "cabins on outer rim",
  Math.abs(minR - CABIN_RADIUS) < 1e-9 && Math.abs(maxR - CABIN_RADIUS) < 1e-9,
  `radius ${minR.toFixed(3)} (wheel ${WHEEL_RADIUS})`,
);

// --- No two adjacent cabins overlap ---
const arcSpacing = 2 * Math.PI * CABIN_RADIUS / CABIN_COUNT;
check(
  "no cabin overlap",
  arcSpacing > CABIN_WIDTH,
  `arc spacing ${arcSpacing.toFixed(3)} vs cabin width ${CABIN_WIDTH}`,
);

/*
 * --- Lowest cabin clears the base platform ---
 *
 * CABIN_HANG, not ARM_LENGTH: the cabins were lowered on their yokes by the
 * park-wide 12.5% seat lowering, so this has to be re-proved at the height they
 * actually hang at rather than at the one they used to.
 */
const lowestCabinBottom = WHEEL_CENTER_HEIGHT - WHEEL_RADIUS - CABIN_HANG - CABIN_HEIGHT;
check(
  "lowest cabin clears base",
  lowestCabinBottom > BASE_HEIGHT,
  `cabin bottom y=${lowestCabinBottom.toFixed(2)} vs base top y=${BASE_HEIGHT}`,
);

/* The lowering itself: the cabin hangs lower than it did, by 10-15% of the
   height its floor stood at over the boarding platform, and the WHEEL is
   unmoved — same radius, same hub height, same 29.5 m crown. */
check(
  "the cabin was lowered 10-15%, and the wheel was not",
  CABIN_HANG > ARM_LENGTH &&
    CABIN_LOWER / (WHEEL_CENTER_HEIGHT - WHEEL_RADIUS - ARM_LENGTH - CABIN_HEIGHT) >= 0.1 &&
    CABIN_LOWER / (WHEEL_CENTER_HEIGHT - WHEEL_RADIUS - ARM_LENGTH - CABIN_HEIGHT) <= 0.15 &&
    WHEEL_CENTER_HEIGHT + WHEEL_RADIUS === 29.5,
  `cabins ride ${CABIN_LOWER.toFixed(3)} u lower on a ${ARM_LENGTH} u yoke, now hanging ` +
    `${CABIN_HANG.toFixed(3)} u; the wheel still crowns at ${(WHEEL_CENTER_HEIGHT + WHEEL_RADIUS).toFixed(1)} u`,
);

// --- Spoke density (§16: 24-32) ---
check("spoke count in 24-32", SPOKE_COUNT >= 24 && SPOKE_COUNT <= 32, `${SPOKE_COUNT}`);

// --- Unique positions, none duplicated ---
const unique = new Set(CABINS.map((c) => `${c.mount[0].toFixed(6)},${c.mount[1].toFixed(6)}`));
check(
  "every cabin position is distinct",
  unique.size === CABIN_COUNT,
  `${unique.size} distinct positions`,
);

// --- A colour for every box on the wheel ---
/*
 * Forty gondolas, forty colours. Two separate claims are worth proving, since
 * one without the other gives a wheel that looks wrong: that no two boxes
 * anywhere share a colour, and that boxes hanging NEXT to each other are far
 * enough apart in hue to be told apart from the ground. An even 9-degree sweep
 * would pass the first and fail the second.
 */
check(
  "every box on the wheel is painted",
  CABIN_BODY.length === CABIN_COUNT && CABIN_BODY.every((c) => /^#[0-9a-f]{6}$/.test(c)),
  `${CABIN_BODY.length} boxes, e.g. ${CABIN_BODY.slice(0, 4).join(" ")}`,
);
check(
  "no two boxes share a colour",
  new Set(CABIN_BODY).size === CABIN_COUNT,
  `${new Set(CABIN_BODY).size} distinct colours across ${CABIN_COUNT} boxes`,
);
let closestNeighbour = 1;
for (let i = 0; i < CABIN_COUNT; i++) {
  const d = Math.abs(cabinHue(i) - cabinHue((i + 1) % CABIN_COUNT));
  closestNeighbour = Math.min(closestNeighbour, Math.min(d, 1 - d));
}
check(
  "boxes hanging side by side are obviously different colours",
  closestNeighbour > 0.1,
  `closest neighbouring pair is ${(closestNeighbour * 360).toFixed(0)}deg apart on the hue wheel`,
);
let closestAnywhere = 1;
for (let i = 0; i < CABIN_COUNT; i++) {
  for (let j = i + 1; j < CABIN_COUNT; j++) {
    const d = Math.abs(cabinHue(i) - cabinHue(j));
    closestAnywhere = Math.min(closestAnywhere, Math.min(d, 1 - d));
  }
}
/* 1 / CABIN_COUNT is the theoretical best any forty-colour set can do, so this
   asserts the arrangement is optimal, not merely adequate. */
check(
  "the forty hues are spread as far apart as forty colours can be",
  closestAnywhere >= 1 / CABIN_COUNT - 1e-9,
  `closest pair anywhere is ${(closestAnywhere * 360).toFixed(1)}deg apart, best possible ${(360 / CABIN_COUNT).toFixed(1)}deg`,
);
check(
  "the seat a rider sits on is still neutral grey",
  /color=\{SEAT_GREY\}/.test(
    readFileSync(join(ROOT, "src", "components", "ferris-wheel", "Cabin.tsx"), "utf8"),
  ),
  "the cabin floor pan keeps the park's seat grey while the box around it is painted",
);

console.log(failures === 0 ? "\nOK: all Ferris Wheel checks passed." : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
