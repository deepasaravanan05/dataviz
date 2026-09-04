import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

import {
  AVENUE_CLEAR_GROUND,
  AVENUE_WIDTH,
  BOUNDARY_RADIUS,
  FOOD_COURT_COLONNADE_RADIUS,
  FOOD_COURT_PATH_OUTER,
  FOOD_COURT_PATH_RADIUS,
  FOOD_COURT_PATH_WIDTH,
  FOOD_COURT_PLAZA_RADIUS,
  FOOD_COURT_STALL_RADIUS,
  GATE_POINT,
  GATE_RADIUS,
  OUTER_PATH_RADIUS,
  OUTER_PATH_WIDTH,
  PARK_ORIGIN,
  PARK_PAVED_EDGE,
  PERIMETER_ROAD_RADIUS,
  PERIMETER_ROAD_WIDTH,
  PLOT_CLEAR_GROUND,
  RADIAL_PATH_LENGTH,
  RADIAL_PATH_TO,
  RADIAL_PATH_WIDTH,
  RIDE_PLOT_RADIUS,
  RIDE_RING_BINDING_CONSTRAINT,
  RIDE_RING_CENTER,
  RIDE_RING_ORDER,
  RIDE_RING_RADIUS,
  RIDE_SLOT_BEARING,
  RIDE_SLOT_STEP_DEG,
  RING_RIDE_REACH,
  radialStart,
  rideEntrance,
  ringPoint,
} from "../src/components/park/parkRing";
import {
  PATH_LINKS,
  PATH_NODES,
  PATH_RINGS,
  RIDE_PLOTS,
  distanceToPaving,
} from "../src/components/world/paths";
import { rideAnchor } from "../src/simulation/journey/journey";
import { RIDE_DEPARTMENTS } from "../src/components/park/departments";
import {
  FOOD_COURT_CENTER,
  FOOD_COURT_CHAIRS,
  FOOD_COURT_TABLES,
  GATE_X,
  GATE_Z,
  SPAWN_Z,
} from "../src/simulation/journey/constants";

/**
 * THE PARK'S MASTER PLAN, verified clause by clause against the brief.
 *
 *     "perfect radial symmetry and a clean circular master-plan structure"
 *     "all rides in one perfect circular ring around the center, every ride at
 *      exactly the same distance from the center, equal angular spacing"
 *     "same overall size, same circular platform diameter, same surrounding
 *      clearance; do not make any ride larger, smaller, closer, or farther"
 *     "replace the central waterfall completely with a BIG GRAND FOOD COURT...
 *      significantly larger than each individual ride"
 *     "a clearly visible continuous circular path around the food court, and
 *      from it N separate radial paths, one directly connecting to each ride"
 *     "every radial path must reach the ride entrance clearly and completely;
 *      all radial paths must have equal length"
 *     "an outer circular perimeter path connecting all the ride areas"
 *     "MAIN ENTRANCE -> CENTRAL PATH -> BIG FOOD COURT -> CIRCULAR FOOD COURT
 *      PATH -> EQUAL RADIAL PATHS -> EQUAL-SIZE RIDES -> OUTER CIRCULAR PATH"
 *     "no irregular spacing, no random placement, no different sizes, no
 *      different distances, no overlapping paths, no disconnected paths"
 *
 * Each of those is a measurable property of the geometry, and each has a check
 * below. Nothing here duplicates `verify-park-layout.ts`, which checks the
 * attractions against each other; this checks the PLAN they sit in.
 *
 * ONE THING THE BRIEF ASSUMES THAT IS NOT SO, recorded here rather than
 * quietly worked around: it asks for NINE rides, and the park has TEN. Nobody
 * asked for one to be removed, so all ten are on the ring and every property
 * above is checked across all ten. The count is printed in the summary so the
 * discrepancy is visible rather than buried.
 */

let failures = 0;
function check(label: string, ok: boolean, detail: string) {
  if (!ok) failures++;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${label} — ${detail}`);
}

const [cx, cz] = PARK_ORIGIN;
const radiusOf = (p: readonly [number, number]) => Math.hypot(p[0] - cx, p[1] - cz);
const bearingOf = (p: readonly [number, number]) =>
  (Math.atan2(p[0] - cx, p[1] - cz) * 180) / Math.PI;
const N = RIDE_RING_ORDER.length;

// ============ 1. One centre, for everything ============
{
  const offCentre = PATH_RINGS.filter(
    (r) => Math.abs(r.center[0] - cx) > 1e-9 || Math.abs(r.center[1] - cz) > 1e-9,
  );
  check(
    "every circular way shares the park's one centre",
    offCentre.length === 0,
    `${PATH_RINGS.length} rings, all about (${cx}, ${cz})`,
  );
  /*
   * THE RAILWAY USED TO BE CHECKED HERE — that it shared the park's centre and
   * that it was a circle rather than an ellipse fitted to a bounding box. The
   * train, its track and its route have been removed from the park at the
   * user's request, so both claims have nothing left to be about. The band
   * they occupied is gone from the plan too, and the perimeter road has moved
   * in to take it.
   */
  check(
    "the removed railway left no band behind it in the plan",
    !/RAILWAY/.test(
      readFileSync(join(root, "src", "components", "park", "parkRing.ts"), "utf8").replace(
        /\/\*[\s\S]*?\*\//g,
        "",
      ),
    ),
    `the perimeter road sits ${(PERIMETER_ROAD_RADIUS - PARK_PAVED_EDGE).toFixed(0)}u outside the outer path`,
  );
}

// ============ 2. PERFECT RADIAL SYMMETRY ============
{
  const radii = RIDE_RING_ORDER.map((id) => radiusOf(RIDE_RING_CENTER[id]));
  check(
    "every ride is exactly the same distance from the centre",
    Math.max(...radii) - Math.min(...radii) < 1e-9,
    `${radii[0].toFixed(4)}u for all ${N}; spread ${(Math.max(...radii) - Math.min(...radii)).toExponential(1)}u`,
  );

  const bearings = RIDE_RING_ORDER.map((id) => RIDE_SLOT_BEARING[id]).sort((a, b) => a - b);
  const steps = bearings.slice(1).map((b, i) => b - bearings[i]);
  /* The wrap-around gap, so the last ride's spacing to the first is checked too. */
  steps.push(360 - (bearings[bearings.length - 1] - bearings[0]));
  check(
    "the angular spacing between neighbours is equal all the way round",
    Math.max(...steps) - Math.min(...steps) < 1e-9,
    `${steps[0].toFixed(4)} degrees between every pair, ${N} of them, ${(steps[0] * N).toFixed(1)} in all`,
  );
  check(
    "and that step is exactly 360/N — no gap anywhere, including at the entrance",
    Math.abs(steps[0] - 360 / N) < 1e-9 && Math.abs(RIDE_SLOT_STEP_DEG - 360 / N) < 1e-9,
    `360/${N} = ${(360 / N).toFixed(4)} degrees`,
  );

  const mirrored = bearings.map((b) => -b).sort((a, b) => a - b);
  check(
    "the ring is mirror-symmetric about the entrance axis",
    bearings.every((b, i) => Math.abs(b - mirrored[i]) < 1e-9),
    `${bearings.filter((b) => b > 0).map((b) => `±${b}`).join(", ")} degrees`,
  );
  check(
    "with the same number of rides each side of the way in",
    bearings.filter((b) => b < 0).length === bearings.filter((b) => b > 0).length,
    `${bearings.filter((b) => b < 0).length} left, ${bearings.filter((b) => b > 0).length} right`,
  );
}

// ============ 3. EQUAL PLOTS, EQUAL CLEARANCE ============
{
  check(
    "every ride stands on a platform of exactly the same diameter",
    RIDE_PLOTS.every((p) => Math.abs(p.radius - RIDE_PLOT_RADIUS) < 1e-9),
    `${(RIDE_PLOT_RADIUS * 2).toFixed(1)} m across, all ${RIDE_PLOTS.length} of them`,
  );
  check(
    "every machine fits inside that platform",
    RIDE_RING_ORDER.every((id) => RING_RIDE_REACH[id] <= RIDE_PLOT_RADIUS + 1e-9),
    `largest ride ${(Math.max(...RIDE_RING_ORDER.map((id) => RING_RIDE_REACH[id])) * 2).toFixed(0)} m across`,
  );
  /* Equal radius and equal plot make equal clearance a theorem, but the point
     of a check is to prove it rather than to trust the algebra. */
  const gaps: number[] = [];
  for (let i = 0; i < N; i++) {
    const a = RIDE_RING_CENTER[RIDE_RING_ORDER[i]];
    const b = RIDE_RING_CENTER[RIDE_RING_ORDER[(i + 1) % N]];
    gaps.push(Math.hypot(a[0] - b[0], a[1] - b[1]) - 2 * RIDE_PLOT_RADIUS);
  }
  check(
    "and the clear ground between neighbouring platforms is the same everywhere",
    Math.max(...gaps) - Math.min(...gaps) < 1e-9 && Math.min(...gaps) > 0,
    `${gaps[0].toFixed(1)} m of landscaping between every pair`,
  );
  check(
    "no platform overlaps another",
    Math.min(...gaps) > 0 && Math.abs(Math.min(...gaps) - PLOT_CLEAR_GROUND) < 1e-6,
    `tightest gap ${Math.min(...gaps).toFixed(1)} m`,
  );
}

// ============ 4. THE FOOD COURT IS THE CENTREPIECE ============
{
  check(
    "the food court is at the exact centre of the park",
    Math.abs(FOOD_COURT_CENTER[0] - cx) < 1e-9 && Math.abs(FOOD_COURT_CENTER[1] - cz) < 1e-9,
    `(${FOOD_COURT_CENTER[0]}, ${FOOD_COURT_CENTER[1]})`,
  );
  check(
    "and it is significantly larger than any single ride's plot",
    FOOD_COURT_PLAZA_RADIUS > RIDE_PLOT_RADIUS * 1.25,
    `a ${(FOOD_COURT_PLAZA_RADIUS * 2).toFixed(0)} m plaza against ${(RIDE_PLOT_RADIUS * 2).toFixed(0)} m ride plots ` +
      `(${(FOOD_COURT_PLAZA_RADIUS / RIDE_PLOT_RADIUS).toFixed(2)}x)`,
  );
  check(
    "it has a building, stalls and seating, nested inside one another",
    FOOD_COURT_STALL_RADIUS < FOOD_COURT_COLONNADE_RADIUS &&
      FOOD_COURT_COLONNADE_RADIUS < FOOD_COURT_PLAZA_RADIUS,
    `stalls at ${FOOD_COURT_STALL_RADIUS}u, colonnade at ${FOOD_COURT_COLONNADE_RADIUS}u, ` +
      `plaza to ${FOOD_COURT_PLAZA_RADIUS}u`,
  );
  check(
    "with real seating in it, on rings inside the plaza",
    FOOD_COURT_TABLES.length >= 24 &&
      FOOD_COURT_TABLES.every(([x, z]) => Math.hypot(x, z) < FOOD_COURT_PLAZA_RADIUS),
    `${FOOD_COURT_TABLES.length} tables, ${FOOD_COURT_CHAIRS.length} seats, all inside the plaza`,
  );
  check(
    "and there is no water feature left at the centre",
    /* The lake's component is gone from the tree, not merely unrendered — the
       brief says replace, and a file left behind is a thing that can come
       back. */
    !existsSync(join(root, "src", "components", "world", "CentralLake.tsx")) &&
      !readFileSync(join(root, "src", "components", "roller-coaster", "ParkScene.tsx"), "utf8")
        .includes("<CentralLake"),
    "the waterfall was replaced rather than hidden",
  );
}

// ============ 5. A single main entrance, bottom-centre, on the axis ============
{
  check(
    "the entrance stands on the park's axis of symmetry",
    Math.abs(GATE_X - cx) < 1e-9,
    `gate x=${GATE_X}, axis x=${cx}`,
  );
  check(
    "at the bottom of the plan, on the +Z side",
    GATE_Z > cz && Math.abs(bearingOf(GATE_POINT)) < 1e-9,
    `bearing ${bearingOf(GATE_POINT).toFixed(6)}deg, z=${GATE_Z.toFixed(0)}`,
  );
  check(
    "and on the boundary, outside the perimeter road",
    Math.abs(GATE_RADIUS - BOUNDARY_RADIUS) < 1e-9 &&
      GATE_RADIUS > PERIMETER_ROAD_RADIUS + PERIMETER_ROAD_WIDTH / 2,
    `gate ${GATE_RADIUS.toFixed(0)}u out, road edge ${(PERIMETER_ROAD_RADIUS + PERIMETER_ROAD_WIDTH / 2).toFixed(0)}u`,
  );
  check(
    "arrivals appear outside the gate, not inside the park",
    SPAWN_Z > GATE_Z,
    `spawn z=${SPAWN_Z.toFixed(0)} against a gate at z=${GATE_Z.toFixed(0)}`,
  );
  check(
    "the avenue passes between two plots without touching either",
    AVENUE_CLEAR_GROUND > 0,
    `${AVENUE_CLEAR_GROUND.toFixed(1)} m of clear ground either side of a ${AVENUE_WIDTH} m avenue`,
  );
}

// ============ 6. THE SEQUENCE THE BRIEF ASKS FOR, in order ============
{
  const ORDER: [string, number][] = [
    ["the food court plaza", FOOD_COURT_PLAZA_RADIUS],
    ["its circular path", FOOD_COURT_PATH_RADIUS],
    ["the radial paths", (RADIAL_PATH_TO + FOOD_COURT_PATH_OUTER) / 2],
    ["the ride platforms' inner edge", RIDE_RING_RADIUS - RIDE_PLOT_RADIUS],
    ["the ride ring", RIDE_RING_RADIUS],
    ["the outer circular path", OUTER_PATH_RADIUS],
    ["the perimeter road", PERIMETER_ROAD_RADIUS],
    ["the boundary and the gate", BOUNDARY_RADIUS],
  ];
  check(
    "entrance -> avenue -> food court -> court path -> radials -> rides -> outer path",
    ORDER.every((r, i) => i === 0 || r[1] > ORDER[i - 1][1]),
    ORDER.map(([n, r]) => `${n} ${r.toFixed(0)}u`).join(" < "),
  );
}

// ============ 7. THE CIRCULAR PATH AROUND THE FOOD COURT ============
{
  const courtPath = PATH_RINGS.find((r) => Math.abs(r.radius - FOOD_COURT_PATH_RADIUS) < 1e-9);
  check(
    "there is a continuous circular path around the food court",
    courtPath !== undefined && courtPath.width === FOOD_COURT_PATH_WIDTH,
    courtPath
      ? `r=${courtPath.radius.toFixed(0)}u, ${courtPath.width}u wide, ${(2 * Math.PI * courtPath.radius).toFixed(0)}u round`
      : "missing",
  );
  check(
    "it clears the plaza it rings",
    FOOD_COURT_PATH_RADIUS - FOOD_COURT_PATH_WIDTH / 2 >= FOOD_COURT_PLAZA_RADIUS,
    `inner edge ${(FOOD_COURT_PATH_RADIUS - FOOD_COURT_PATH_WIDTH / 2).toFixed(0)}u against a ${FOOD_COURT_PLAZA_RADIUS}u plaza`,
  );
}

// ============ 8. THE RADIAL PATHS: one each, equal, and connected ============
{
  check(
    "there is exactly one radial path per ride",
    RIDE_PLOTS.length === N,
    `${N} rides, ${N} radials`,
  );

  const lengths = RIDE_RING_ORDER.map((id) => {
    const a = radialStart(id);
    const b = rideEntrance(id);
    return Math.hypot(a[0] - b[0], a[1] - b[1]);
  });
  check(
    "every radial path is exactly the same length",
    Math.max(...lengths) - Math.min(...lengths) < 1e-9,
    `${lengths[0].toFixed(3)} m each; spread ${(Math.max(...lengths) - Math.min(...lengths)).toExponential(1)} m`,
  );
  check(
    "and each runs straight down its own ride's bearing",
    RIDE_RING_ORDER.every((id) => {
      const a = bearingOf(radialStart(id));
      const b = bearingOf(rideEntrance(id));
      return Math.abs(a - RIDE_SLOT_BEARING[id]) < 1e-9 && Math.abs(b - RIDE_SLOT_BEARING[id]) < 1e-9;
    }),
    "start and finish share the ride's slot bearing exactly",
  );

  /*
   * NO RADIAL STOPS SHORT. Walked metre by metre from the food court's path
   * out to the ride's own machine, every sample must be on a paved surface —
   * the radial, then the platform. This is the check the brief's "do not stop
   * the paths before reaching the rides" asks for, and it is measured against
   * the real paving rather than against the intent.
   */
  const broken: string[] = [];
  for (const id of RIDE_RING_ORDER) {
    const stopsAt = RIDE_RING_RADIUS - RING_RIDE_REACH[id];
    for (let r = FOOD_COURT_PATH_RADIUS; r <= stopsAt; r += 2) {
      const p = ringPoint(RIDE_SLOT_BEARING[id], r);
      if (distanceToPaving(p[0], p[1]) > 0) {
        broken.push(`${id} at r=${r.toFixed(0)}`);
        break;
      }
    }
  }
  check(
    "every radial path reaches its ride without a break in the paving",
    broken.length === 0,
    broken.length
      ? `bare ground on ${broken.join(", ")}`
      : `paved continuously from the court path to the machine on all ${N}`,
  );

  const entranceNodes = RIDE_PLOTS.filter((p) =>
    PATH_NODES.some(
      (n) => Math.hypot(n.at[0] - p.entrance[0], n.at[1] - p.entrance[1]) < 1e-9 && n.radius > 0,
    ),
  );
  check(
    "and each ride has a marked entrance where its radial arrives",
    entranceNodes.length === N,
    `${entranceNodes.length} entrances, ${RADIAL_PATH_WIDTH}u-wide paths arriving at them`,
  );
}

// ============ 9. THE OUTER CIRCULAR PATH, joining every ride area ============
{
  const outer = PATH_RINGS.find((r) => Math.abs(r.radius - OUTER_PATH_RADIUS) < 1e-9);
  check(
    "there is an outer circular path",
    outer !== undefined,
    outer ? `r=${outer.radius.toFixed(0)}u, ${outer.width}u wide` : "missing",
  );
  check(
    "and it touches every ride platform, so no plot needs a connecting stub",
    Math.abs(OUTER_PATH_RADIUS - OUTER_PATH_WIDTH / 2 - (RIDE_RING_RADIUS + RIDE_PLOT_RADIUS)) < 1e-9,
    `its inner edge lies exactly on the plots' outer edge at ${(RIDE_RING_RADIUS + RIDE_PLOT_RADIUS).toFixed(0)}u`,
  );
  /* Walk it: every point on the outer path must be on paving. */
  let offOuter = 0;
  for (let i = 0; i < 360; i++) {
    const p = ringPoint(i, OUTER_PATH_RADIUS);
    if (distanceToPaving(p[0], p[1]) > 0) offOuter++;
  }
  check(
    "it is continuous the whole way round",
    offOuter === 0,
    offOuter === 0 ? "360 samples, all on paving" : `${offOuter} samples off the surface`,
  );
}

// ============ 10. No paving where none belongs ============
{
  const throughRides: string[] = [];
  for (const id of RIDE_RING_ORDER) {
    /* A ride's own platform is paved on purpose; what must not happen is a
       path crossing a NEIGHBOUR's machine. Each ride is probed against every
       path that is not its own radial. */
    const c = RIDE_RING_CENTER[id];
    const own = RIDE_SLOT_BEARING[id];
    let hits = 0;
    for (const l of PATH_LINKS) {
      if (l.surface !== "paving") continue;
      const mid: [number, number] = [(l.from[0] + l.to[0]) / 2, (l.from[1] + l.to[1]) / 2];
      if (Math.abs(bearingOf(mid) - own) < 1e-6) continue;
      /* Distance from the ride's centre to this link. */
      const dx = l.to[0] - l.from[0];
      const dz = l.to[1] - l.from[1];
      const len2 = dx * dx + dz * dz || 1;
      const t = Math.max(0, Math.min(1, ((c[0] - l.from[0]) * dx + (c[1] - l.from[1]) * dz) / len2));
      const d = Math.hypot(c[0] - (l.from[0] + t * dx), c[1] - (l.from[1] + t * dz));
      if (d < RING_RIDE_REACH[id] + l.width / 2) hits++;
    }
    if (hits > 0) throughRides.push(`${id} (${hits})`);
  }
  check(
    "no path crosses a ride it does not serve",
    throughRides.length === 0,
    throughRides.length ? throughRides.join(", ") : "every radial serves only its own ride",
  );
}

// ============ 11. The employees use the plan ============
{
  const offPaving: string[] = [];
  for (const d of RIDE_DEPARTMENTS) {
    const { stand, approach } = rideAnchor(d.rideId);
    for (const [name, p] of [
      ["approach", approach],
      ["stand", stand],
    ] as [string, [number, number]][]) {
      if (distanceToPaving(p[0], p[1]) > 0) offPaving.push(`${d.rideId} ${name}`);
    }
  }
  check(
    "every department's entrance and waiting point stand on paving",
    offPaving.length === 0,
    offPaving.length ? offPaving.join(", ") : `${RIDE_DEPARTMENTS.length} departments served`,
  );

  const approachRadii = RIDE_DEPARTMENTS.map((d) => radiusOf(rideAnchor(d.rideId).approach));
  check(
    "and every one of them arrives at the same distance from the middle",
    Math.max(...approachRadii) - Math.min(...approachRadii) < 2,
    `${approachRadii.map((r) => r.toFixed(0)).join(", ")}u — the plot entrance, for all of them`,
  );
}

// ============ Summary ============
console.log(
  `\nThe master plan, outward from the middle (${N} rides — the brief says nine, the park has ten):\n` +
    `  food court     plaza to ${FOOD_COURT_PLAZA_RADIUS}u — hall, ${FOOD_COURT_STALL_RADIUS}u stalls, ` +
    `${FOOD_COURT_COLONNADE_RADIUS}u colonnade, ${FOOD_COURT_TABLES.length} tables\n` +
    `  court path     ${FOOD_COURT_PATH_RADIUS.toFixed(0)}u, ${FOOD_COURT_PATH_WIDTH}u wide\n` +
    `  radials        ${N} of them, ${RADIAL_PATH_LENGTH.toFixed(0)}u each, ${RADIAL_PATH_WIDTH}u wide\n` +
    `  ride ring      every ride at ${RIDE_RING_RADIUS.toFixed(0)}u, ${RIDE_SLOT_STEP_DEG}deg apart, ` +
    `on ${(RIDE_PLOT_RADIUS * 2).toFixed(0)}u platforms\n` +
    `                 (${PLOT_CLEAR_GROUND.toFixed(0)}u of landscaping between neighbours; the ring radius is ` +
    `set by ${RIDE_RING_BINDING_CONSTRAINT})\n` +
    `  outer path     ${OUTER_PATH_RADIUS.toFixed(0)}u, ${OUTER_PATH_WIDTH}u wide, touching every platform\n` +
    `  perimeter road ${PERIMETER_ROAD_RADIUS.toFixed(0)}u, ${PERIMETER_ROAD_WIDTH}u wide\n` +
    `  boundary       ${BOUNDARY_RADIUS.toFixed(0)}u, main gate on the axis at (${GATE_X}, ${GATE_Z.toFixed(0)})\n` +
    `  paved edge     ${PARK_PAVED_EDGE.toFixed(0)}u`,
);

console.log(failures === 0 ? "\nOK: the park's master plan verified." : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
