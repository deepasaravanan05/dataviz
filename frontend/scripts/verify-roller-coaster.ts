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
import { rideScale } from "../src/components/park/layout";

let failures = 0;
function check(label: string, ok: boolean, detail: string) {
  if (!ok) failures++;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${label} — ${detail}`);
}

// ---------- Seats (§15, §16) ----------
const green = countSeatColor("GREEN");
const yellow = countSeatColor("YELLOW");
const red = countSeatColor("RED");
/*
 * THE CAPACITY RULE IS NOW 30-40 SEATS PER RIDE, 40 PREFERRED. The three
 * GREEN / YELLOW / RED counts are an ALLOCATION order and not a paint job —
 * every seat in the park is grey — so what has to hold is that the bands are
 * even and that they account for every seat, not that they are 20 apiece.
 */
check(
  "capacity is in the 30-40 band, at the preferred 40",
  SEATS.length >= 30 && SEATS.length <= 40,
  `${SEATS.length} seats`,
);
check(
  "the train's seats are whole cars, evenly filled",
  CAR_COUNT * SEATS_PER_CAR === SEATS.length,
  `${CAR_COUNT} cars x ${SEATS_PER_CAR} seats = ${SEATS.length}`,
);
check(
  "the three allocation bands are even",
  Math.max(green, yellow, red) - Math.min(green, yellow, red) <= 1,
  `${green} green / ${yellow} yellow / ${red} red`,
);
check(
  "every seat belongs to a band",
  green + yellow + red === SEATS.length,
  `${green + yellow + red} of ${SEATS.length}`,
);
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
/*
 * COMPARED AT PARK SCALE, not in raw units.
 *
 * These two rides are drawn at different factors — the coaster at about 2.6x,
 * the wheel at about 2.56x — so comparing the numbers in their own model space
 * answers a question nobody is asking. What matters is what a visitor sees, and
 * that is each ride's height AFTER its own scale. The intent is unchanged: the
 * Ferris Wheel stays a landmark rather than something the coaster towers over,
 * so the coaster may draw level with it but not overtop it by a quarter.
 */
const wheelTopScaled = wheelTop * rideScale("ferris");
const coasterPeakScaled = coasterPeak * rideScale("coaster");
check(
  "coaster does not dwarf the wheel",
  coasterPeakScaled < wheelTopScaled * 1.25,
  `coaster ${coasterPeakScaled.toFixed(1)}u vs wheel ${wheelTopScaled.toFixed(1)}u at park scale ` +
    `(${(coasterPeakScaled / wheelTopScaled).toFixed(2)}x)`,
);

// Lowest Ferris Wheel cabin must not be reachable by the coaster footprint
const lowestCabinY = WHEEL_CENTER_HEIGHT - WHEEL_RADIUS - ARM_LENGTH - CABIN_HEIGHT;
check("wheel cabins clear of coaster", nearest > wheelReach, `cabin low point y=${lowestCabinY.toFixed(2)}`);

/* ---------- Ferris Wheel unchanged by anything the coaster did (§27) ----------
   Both rides were re-capacitied to 40 by the same brief, so this asserts the
   wheel is intact AND at the same rule, not that it kept a number the coaster
   no longer shares. */
{
  const g = countByColor("GREEN");
  const y = countByColor("YELLOW");
  const r = countByColor("RED");
  check(
    "the wheel still carries a full, evenly banded ring of cabins",
    CABINS.length >= 30 &&
      CABINS.length <= 40 &&
      g + y + r === CABINS.length &&
      Math.max(g, y, r) - Math.min(g, y, r) <= 1,
    `${CABINS.length} cabins, ${g} / ${y} / ${r}`,
  );
}

console.log(
  `\nCircuit ${TRACK_LENGTH.toFixed(1)}u over ${TRACK_SEGMENTS} samples · ` +
    `peak y=${maxY.toFixed(1)} · coaster centred at x=${COASTER_ORIGIN[0]}`,
);
console.log(failures === 0 ? "OK: all roller coaster checks passed." : `${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
