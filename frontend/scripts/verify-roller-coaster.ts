import { Vector3 } from "three";
import { TRACK_CURVE, TRACK_LENGTH, TRACK_POINTS, TRACK_FRAMES } from "../src/components/roller-coaster/trackCurve";
import {
  CAR_COUNT,
  CAR_SPACING,
  COASTER_ORIGIN,
  SEATS_PER_CAR,
  TRACK_SEGMENTS,
} from "../src/components/roller-coaster/constants";
import { SEATS, countSeatColor, SEAT_COLOR_HEX } from "../src/components/roller-coaster/seatManifest";
import {
  WHEEL_RADIUS,
  WHEEL_CENTER_HEIGHT,
  BASE_WIDTH,
  BASE_DEPTH,
  CABIN_HEIGHT,
  ARM_LENGTH,
} from "../src/components/ferris-wheel/constants";
import { CABINS, countByColor } from "../src/components/ferris-wheel/cabinManifest";

let failures = 0;
function check(label: string, ok: boolean, detail: string) {
  if (!ok) failures++;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${label} — ${detail}`);
}

// ---------- Seats (§15, §16) ----------
const green = countSeatColor("GREEN");
const yellow = countSeatColor("YELLOW");
const red = countSeatColor("RED");
check("seat count", SEATS.length === 60, `${SEATS.length} seats`);
check("cars x seats = 60", CAR_COUNT * SEATS_PER_CAR === 60, `${CAR_COUNT} x ${SEATS_PER_CAR}`);
check("green seats", green === 20, `${green}`);
check("yellow seats", yellow === 20, `${yellow}`);
check("red seats", red === 20, `${red}`);
check("seat colours sum", green + yellow + red === 60, `${green + yellow + red}`);
check("exact hexes", SEAT_COLOR_HEX.GREEN === "#22C55E" && SEAT_COLOR_HEX.YELLOW === "#FACC15" && SEAT_COLOR_HEX.RED === "#EF4444", "22C55E / FACC15 / EF4444");
const pattern = SEATS.every((s, i) => s.color === (["GREEN", "YELLOW", "RED"] as const)[i % 3]);
check("G->Y->R repeating, never clumped", pattern, SEATS.slice(0, 6).map((s) => s.color).join(" "));
// No car is monochrome (proves colours spread across the train)
const monochromeCars = Array.from({ length: CAR_COUNT }, (_, c) =>
  new Set(SEATS.filter((s) => s.car === c).map((s) => s.color)).size,
).filter((n) => n === 1).length;
check("no monochrome car", monochromeCars === 0, `${monochromeCars} single-colour cars`);

// ---------- Track (§6, §7, §8) ----------
check("closed circuit", TRACK_CURVE.closed, `length ${TRACK_LENGTH.toFixed(1)}u`);
const ys = TRACK_POINTS.map((p) => p.y);
const minY = Math.min(...ys);
const maxY = Math.max(...ys);
check("track never underground", minY > 0.5, `lowest y=${minY.toFixed(2)}`);
check("has real elevation change", maxY - minY > 15, `drop height ${(maxY - minY).toFixed(1)}u`);

// Inversion check: the loop must actually invert (frame normal points downward)
const minNormalY = Math.min(...TRACK_FRAMES.normals.map((n) => n.y));
check("track contains an inversion", minNormalY < -0.5, `min frame normal y=${minNormalY.toFixed(2)}`);

// Train fits on the circuit without wrapping onto itself
const trainLength = CAR_COUNT * CAR_SPACING;
check("train shorter than circuit", trainLength < TRACK_LENGTH * 0.5, `train ${trainLength.toFixed(1)}u vs track ${TRACK_LENGTH.toFixed(1)}u`);

// ---------- Separation from the Ferris Wheel (§2, §22, §26) ----------
const origin = new Vector3(...COASTER_ORIGIN);
const worldPoints = TRACK_POINTS.map((p) => new Vector3().copy(p).add(origin));

// Ferris Wheel occupies a disc in x/z of radius ~WHEEL_RADIUS about origin,
// plus its base slab. Use the most generous horizontal extent.
const wheelReach = Math.max(WHEEL_RADIUS, BASE_WIDTH / 2, BASE_DEPTH / 2);
const nearest = Math.min(...worldPoints.map((p) => Math.hypot(p.x, p.z)));
check(
  "no track intersects Ferris Wheel",
  nearest > wheelReach + 5,
  `nearest track point ${nearest.toFixed(1)}u from wheel centre (wheel reach ${wheelReach})`,
);

const wheelTop = WHEEL_CENTER_HEIGHT + WHEEL_RADIUS;
const coasterPeak = maxY;
check("coaster is a major ride, not dwarfed", coasterPeak > wheelTop * 0.5, `coaster peak ${coasterPeak.toFixed(1)} vs wheel top ${wheelTop.toFixed(1)}`);
check("coaster does not dwarf the wheel", coasterPeak < wheelTop, `coaster ${coasterPeak.toFixed(1)} < wheel ${wheelTop.toFixed(1)}`);

// Lowest Ferris Wheel cabin must not be reachable by the coaster footprint
const lowestCabinY = WHEEL_CENTER_HEIGHT - WHEEL_RADIUS - ARM_LENGTH - CABIN_HEIGHT;
check("wheel cabins clear of coaster", nearest > wheelReach, `cabin low point y=${lowestCabinY.toFixed(2)}`);

// ---------- Ferris Wheel unchanged (§27) ----------
check("wheel still has 60 cabins", CABINS.length === 60, `${CABINS.length}`);
check("wheel 20 green", countByColor("GREEN") === 20, `${countByColor("GREEN")}`);
check("wheel 20 yellow", countByColor("YELLOW") === 20, `${countByColor("YELLOW")}`);
check("wheel 20 red", countByColor("RED") === 20, `${countByColor("RED")}`);

console.log(
  `\nCircuit ${TRACK_LENGTH.toFixed(1)}u over ${TRACK_SEGMENTS} samples · ` +
    `peak y=${maxY.toFixed(1)} · coaster centred at x=${COASTER_ORIGIN[0]}`,
);
console.log(failures === 0 ? "OK: all roller coaster checks passed." : `${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
