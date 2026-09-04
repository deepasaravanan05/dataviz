import {
  MAIN_VIEWPOINT,
  MIN_RIDE_SPACING,
  PARK_LAYOUT,
  PLAZA_CENTER,
  PLAZA_RADIUS,
  footprintGap,
  rideById,
  rideScale,
  sightline,
  type PlacedRide,
} from "../src/components/park/layout";
import {
  AVENUE_WIDTH,
  LAKE_CLEARANCE_RADIUS,
  PARK_ORIGIN,
  RIDE_RING_ORDER,
  RIDE_RING_CENTER,
  RIDE_SLOT_BEARING,
  FOOD_COURT_PATH_RADIUS,
  RADIAL_PATH_LENGTH,
  RIDE_PLOT_RADIUS,
  RIDE_RING_RADIUS,
  RING_RIDE_REACH,
  ringPoint,
  ringRadiusOf,
} from "../src/components/park/parkRing";
import { PARK_SCALE } from "../src/components/park/parkScale";
import {
  OVERALL_HEIGHT as UFO_HEIGHT,
  OVERALL_REACH as UFO_REACH,
} from "../src/components/ufo-pendulum/constants";
import { RIDE_ORIGIN as UFO_ORIGIN } from "../src/components/ufo-pendulum/placement";

/**
 * THE PARK LAYOUT, CHECKED AGAINST THE PLAN IT NOW HAS.
 *
 * This file used to verify a FAN: five rides spread on their own bearings from
 * the main gate, with clear sky between every pair of silhouettes from three
 * ground-level viewpoints, staggered in depth so no two sat on one line. Those
 * were the right properties for that plan and they are not available in this
 * one — a concentric park puts half its attractions behind the other half from
 * any ground-level viewpoint, by construction, and every ride is now built to
 * one common height so "the nearer ride is shorter" can never be true either.
 *
 * The checks are therefore RESTATED as the properties the ring can keep, not
 * deleted and not quietly re-baselined onto the new numbers:
 *
 *   - the old "no two footprints intersect" and "every ride has its clear
 *     zone" hold unchanged, and now cover all TEN attractions rather than the
 *     five in this layout;
 *   - "staggered in depth, nothing on one line" becomes "every attraction has
 *     its own slot bearing, evenly spaced";
 *   - "clear sky between silhouettes from the gate" becomes "the ring is even":
 *     every attraction stands the same distance back from the ring path, so
 *     none is buried in the band and none is marooned outside it;
 *   - "clear of the plaza and the gate path" becomes "clear of the lake, the
 *     ring path and the entrance avenue";
 *   - the size assertions are untouched.
 *
 * The overview — the view this park is actually read from — is verified where
 * it can be verified honestly, by projecting every ride through the real
 * camera. See scripts/verify-night.ts, "holds the frame from the overview".
 */

let failures = 0;
function check(label: string, ok: boolean, detail: string) {
  if (!ok) failures++;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${label} — ${detail}`);
}

// ============ 1. No two attractions overlap, and each has a clear zone ============
/*
 * Measured over EVERY attraction on the ring, not just the five in this
 * layout. That is a real widening of the old check: the five that were not in
 * the layout used to be kept apart by their own one-at-a-time searches, each
 * of which only knew about the rides placed before it.
 */
let worstGap = Infinity;
let worstPair = "";
for (let i = 0; i < RIDE_RING_ORDER.length; i++) {
  for (let j = i + 1; j < RIDE_RING_ORDER.length; j++) {
    const a = RIDE_RING_ORDER[i];
    const b = RIDE_RING_ORDER[j];
    const ca = RIDE_RING_CENTER[a];
    const cb = RIDE_RING_CENTER[b];
    const g = Math.hypot(ca[0] - cb[0], ca[1] - cb[1]) - RING_RIDE_REACH[a] - RING_RIDE_REACH[b];
    if (g < worstGap) {
      worstGap = g;
      worstPair = `${a} / ${b}`;
    }
  }
}
check(
  "no two attractions intersect",
  worstGap > 0,
  `tightest pair ${worstPair}: ${worstGap.toFixed(1)}u of clear ground`,
);
check(
  "every attraction has its configured clear zone",
  worstGap >= MIN_RIDE_SPACING - 1e-6,
  `${worstGap.toFixed(1)}u vs MIN_RIDE_SPACING ${MIN_RIDE_SPACING}u`,
);

// ============ 2. Every attraction has its own slot, evenly spaced ============
const bearings = RIDE_RING_ORDER.map((id) => RIDE_SLOT_BEARING[id]).sort((a, b) => a - b);
check(
  "no two attractions share a bearing",
  new Set(bearings).size === bearings.length,
  `bearings ${bearings.join(", ")}`,
);

const steps = bearings.slice(1).map((b, i) => b - bearings[i]);
/* Every gap between neighbours is one step, except the one the entrance uses. */
const rideSteps = steps.filter((s) => Math.abs(s - Math.min(...steps)) < 1e-9);
check(
  "the ring is evenly divided",
  rideSteps.length === steps.length - 1 || steps.every((s) => Math.abs(s - steps[0]) < 1e-9),
  `steps between neighbours: ${steps.map((s) => s.toFixed(0)).join(", ")} degrees`,
);

// ============ 2b. The plan is symmetric about the entrance axis ============
const mirrored = bearings.map((b) => -b).sort((a, b) => a - b);
check(
  "the ride ring is mirror-symmetric about the entrance axis",
  bearings.every((b, i) => Math.abs(b - mirrored[i]) < 1e-9),
  `left ${bearings.filter((b) => b < 0).join(", ")} | right ${bearings.filter((b) => b > 0).join(", ")}`,
);

// ============ 3. Every attraction is the same distance out, on the same plot ============
const radii = RIDE_RING_ORDER.map((id) => {
  const c = RIDE_RING_CENTER[id];
  return Math.hypot(c[0] - PARK_ORIGIN[0], c[1] - PARK_ORIGIN[1]);
});
check(
  "every attraction stands at exactly the same distance from the middle",
  Math.max(...radii) - Math.min(...radii) < 1e-9,
  `${radii[0].toFixed(3)}u for all ${radii.length}, spread ${(Math.max(...radii) - Math.min(...radii)).toExponential(1)}u`,
);
check(
  "and every machine fits inside the park's one plot size",
  RIDE_RING_ORDER.every((id) => RING_RIDE_REACH[id] <= RIDE_PLOT_RADIUS + 1e-9),
  `largest ride ${Math.max(...RIDE_RING_ORDER.map((id) => RING_RIDE_REACH[id])).toFixed(1)}u ` +
    `on a ${RIDE_PLOT_RADIUS.toFixed(1)}u platform`,
);

// ============ 4. Nothing stands in the lake, on the ring path or on the avenue ============
for (const id of RIDE_RING_ORDER) {
  const c = RIDE_RING_CENTER[id];
  const fromCentre = Math.hypot(c[0] - PARK_ORIGIN[0], c[1] - PARK_ORIGIN[1]);
  check(
    `${id} is clear of the lake`,
    fromCentre - RING_RIDE_REACH[id] > LAKE_CLEARANCE_RADIUS,
    `${(fromCentre - RING_RIDE_REACH[id]).toFixed(0)}u from the middle vs a ${LAKE_CLEARANCE_RADIUS}u lake`,
  );
  check(
    `${id} is clear of the food court's circular path`,
    fromCentre - RIDE_PLOT_RADIUS > FOOD_COURT_PATH_RADIUS,
    `plot edge ${(fromCentre - RIDE_PLOT_RADIUS).toFixed(0)}u vs the court path at ${FOOD_COURT_PATH_RADIUS.toFixed(0)}u`,
  );
  /*
   * Perpendicular distance from the entrance avenue.
   *
   * The avenue is a RAY, not a line: it runs from the gate in to the lake, all
   * of it on the entrance side of the middle. So this only applies to the
   * attractions that could actually be beside it — the ones in the entrance
   * half of the ring. A ride at the back is not "beside the avenue" merely
   * because it is near the line the avenue lies on.
   */
  if (Math.abs(RIDE_SLOT_BEARING[id]) < 90) {
    const toAxis = Math.abs(Math.sin((RIDE_SLOT_BEARING[id] * Math.PI) / 180)) * ringRadiusOf(id);
    check(
      `${id} does not block the entrance avenue`,
      toAxis - RIDE_PLOT_RADIUS > AVENUE_WIDTH / 2 + 5,
      `plot edge ${(toAxis - RIDE_PLOT_RADIUS).toFixed(0)}u off the axis vs a ${AVENUE_WIDTH}u avenue`,
    );
  }
}

/*
 * SECTION 5 USED TO CHECK that every ride sat inside the park railway's loop
 * and clear of its rails. The train, its track and its route have been removed
 * from the park, so there is no loop to be inside and no rails to clear. What
 * that section really protected — that no ride strays outside the park's own
 * paved extent — is a property of the plan now: every ride is at one radius
 * inside one outer path, which `verify-park-structure.ts` asserts directly.
 */

// ============ 6. The lakeside promenade is a promenade, not a ride plot ============
const plazaBox: PlacedRide = {
  ...PARK_LAYOUT[0],
  id: "plaza",
  label: "Lakeside promenade",
  center: PLAZA_CENTER,
  halfX: PLAZA_RADIUS,
  halfZ: PLAZA_RADIUS,
  minX: PLAZA_CENTER[0] - PLAZA_RADIUS,
  maxX: PLAZA_CENTER[0] + PLAZA_RADIUS,
  minZ: PLAZA_CENTER[1] - PLAZA_RADIUS,
  maxZ: PLAZA_CENTER[1] + PLAZA_RADIUS,
};
for (const r of PARK_LAYOUT) {
  check(
    `${r.label} does not sit on the lakeside promenade`,
    footprintGap(plazaBox, r) > 5,
    `${footprintGap(plazaBox, r).toFixed(1)}u clear of it`,
  );
}

// ============ 7. Sizes are unchanged by the re-layout ============
check(
  "rides were re-placed, NOT shrunk",
  PARK_SCALE >= 1.7,
  `PARK_SCALE ${PARK_SCALE}x — the ring was solved by moving rides apart, never by making them smaller`,
);
const pendulum = rideById("ufo");
check(
  "UFO Pendulum footprint in the layout matches its own constants",
  /* The ride's own module declares its reach UNSCALED. The layout stores the
     rendered footprint, so the two are only comparable through the factor the
     ride is drawn at. */
  Math.abs(pendulum.halfX - UFO_REACH * rideScale("ufo")) < 1e-9 &&
    Math.abs(pendulum.halfZ - UFO_REACH * rideScale("ufo")) < 1e-9,
  `layout ${pendulum.halfX.toFixed(2)}u = ufo-pendulum OVERALL_REACH ${UFO_REACH.toFixed(2)}u ` +
    `at ${rideScale("ufo").toFixed(2)}x`,
);
check(
  "the pendulum is still a big ride on the footprint the park was laid out against",
  UFO_HEIGHT > 60 && Math.abs(pendulum.halfX - UFO_REACH * rideScale("ufo")) < 1e-9,
  `${UFO_HEIGHT.toFixed(1)}u over the top on a ${pendulum.halfX.toFixed(2)}u footprint`,
);
check(
  "UFO Pendulum renders where the layout put it",
  Math.abs(UFO_ORIGIN[0] - pendulum.center[0]) < 1e-9 &&
    Math.abs(UFO_ORIGIN[2] - pendulum.center[1]) < 1e-9,
  `(${UFO_ORIGIN[0].toFixed(2)}, ${UFO_ORIGIN[2].toFixed(2)})`,
);

// ============ 8. The overlap test itself still works ============
{
  const a = { ...PARK_LAYOUT[0], center: [0, 0] as [number, number], minX: -20, maxX: 20, minZ: -20, maxZ: 20 };
  const b = { ...PARK_LAYOUT[1], center: [5, 5] as [number, number], minX: -15, maxX: 25, minZ: -15, maxZ: 25 };
  check(
    "footprintGap reports overlap as negative",
    footprintGap(a, b) < 0,
    `deliberately overlapping boxes report ${footprintGap(a, b).toFixed(1)}u`,
  );
}

// ============ Summary ============
console.log("\nPark ring, anticlockwise from the far left of the entrance:");
for (const id of [...RIDE_RING_ORDER].sort((x, y) => RIDE_SLOT_BEARING[x] - RIDE_SLOT_BEARING[y])) {
  const c = RIDE_RING_CENTER[id];
  console.log(
    `  ${id.padEnd(9)} bearing ${RIDE_SLOT_BEARING[id].toFixed(0).padStart(5)}deg  ` +
      `radius ${ringRadiusOf(id).toFixed(0).padStart(4)}u  reach ${RING_RIDE_REACH[id].toFixed(0).padStart(4)}u  ` +
      `centre (${c[0].toFixed(0).padStart(5)}, ${c[1].toFixed(0).padStart(5)})`,
  );
}
console.log(
  `\nOne ring radius ${RIDE_RING_RADIUS.toFixed(0)}u, one plot radius ${RIDE_PLOT_RADIUS.toFixed(0)}u, ` +
    `one radial length ${RADIAL_PATH_LENGTH.toFixed(0)}u. The avenue meets the food court's path at ` +
    `(${ringPoint(0, FOOD_COURT_PATH_RADIUS).map((n) => n.toFixed(0)).join(", ")}).`,
);
console.log(`Tightest attraction gap ${worstGap.toFixed(1)}u (${worstPair}); minimum required ${MIN_RIDE_SPACING}u.`);
console.log(
  `Main viewpoint (${MAIN_VIEWPOINT.map((n) => n.toFixed(0)).join(", ")}); ` +
    `sightline sample: ${PARK_LAYOUT.map((r) => `${r.id} ${sightline(r).bearingDeg.toFixed(0)}deg`).join(", ")}.`,
);

console.log(failures === 0 ? "\nOK: park ring layout verified." : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
