import { CABINS, ANGLE_STEP, CABIN_RADIUS, countByColor, CABIN_COLOR_HEX } from "../src/components/ferris-wheel/cabinManifest";
import {
  ARM_LENGTH,
  BASE_HEIGHT,
  CABIN_COUNT,
  CABIN_HEIGHT,
  CABIN_WIDTH,
  WHEEL_CENTER_HEIGHT,
  WHEEL_RADIUS,
  SPOKE_COUNT,
} from "../src/components/ferris-wheel/constants";

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
check("green count", green === 20, `${green}`);
check("yellow count", yellow === 20, `${yellow}`);
check("red count", red === 20, `${red}`);
check("colors sum to 60", green + yellow + red === 60, `${green + yellow + red}`);

// --- Exact palette (§5, §22) ---
check("green hex", CABIN_COLOR_HEX.GREEN === "#22C55E", CABIN_COLOR_HEX.GREEN);
check("yellow hex", CABIN_COLOR_HEX.YELLOW === "#FACC15", CABIN_COLOR_HEX.YELLOW);
check("red hex", CABIN_COLOR_HEX.RED === "#EF4444", CABIN_COLOR_HEX.RED);

// --- Repeating pattern, never clumped (§6) ---
const patternOk = CABINS.every((c, i) => c.color === (["GREEN", "YELLOW", "RED"] as const)[i % 3]);
check("G->Y->R repeating pattern", patternOk, CABINS.slice(0, 6).map((c) => c.color).join(" "));

// --- 6 degree spacing (§7) ---
const stepDeg = (ANGLE_STEP * 180) / Math.PI;
check("angular step", Math.abs(stepDeg - 6) < 1e-9, `${stepDeg.toFixed(4)} degrees`);

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

// --- Lowest cabin clears the base platform ---
const lowestCabinBottom = WHEEL_CENTER_HEIGHT - WHEEL_RADIUS - ARM_LENGTH - CABIN_HEIGHT;
check(
  "lowest cabin clears base",
  lowestCabinBottom > BASE_HEIGHT,
  `cabin bottom y=${lowestCabinBottom.toFixed(2)} vs base top y=${BASE_HEIGHT}`,
);

// --- Spoke density (§16: 24-32) ---
check("spoke count in 24-32", SPOKE_COUNT >= 24 && SPOKE_COUNT <= 32, `${SPOKE_COUNT}`);

// --- Unique positions, none duplicated ---
const unique = new Set(CABINS.map((c) => `${c.mount[0].toFixed(6)},${c.mount[1].toFixed(6)}`));
check("all 60 positions unique", unique.size === 60, `${unique.size} distinct positions`);

console.log(failures === 0 ? "\nOK: all Ferris Wheel checks passed." : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
