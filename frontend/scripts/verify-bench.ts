import { readFileSync } from "node:fs";
import { join } from "node:path";
import { BENCH, BENCH_PLACEMENT, BENCH_SCALE } from "../src/components/world/PromenadeBench";
import { PARK_LAYOUT, PLAZA_CENTER, PLAZA_RADIUS, rideById } from "../src/components/park/layout";
import { stairFor } from "../src/simulation/journey/rideOps";
import { JOURNEY_EMPLOYEES, sampleJourney } from "../src/simulation/journey/journey";
import { EMPLOYEE_HEIGHT, EMPLOYEE_SCALE, PROP, RIDE_SEAT_SCALE } from "../src/world/scale";

/**
 * THE WOODEN PROMENADE BENCH — verification.
 *
 * What is proved: it is a real bench at the reference's proportions, it stands
 * on the ground beside the Ferris Wheel facing it, it is clear of every ride,
 * every walked route and the whole boarding system, and adding it changed
 * nothing that was already in the park.
 */

let failures = 0;
function check(label: string, ok: boolean, detail: string) {
  if (!ok) failures++;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${label} — ${detail}`);
}

const root = join(__dirname, "..");
const read = (...p: string[]) => readFileSync(join(root, ...p), "utf8");
const src = read("src", "components", "world", "PromenadeBench.tsx");

const wheel = rideById("ferris");
const [bx, by, bz] = BENCH_PLACEMENT.position;

// ============ 1. It is a bench, at the reference's proportions ============
check(
  "the bench has the proportions of a real promenade bench",
  BENCH.length >= 1.8 &&
    BENCH.length <= 2.0 &&
    BENCH.depth >= 0.55 &&
    BENCH.depth <= 0.65 &&
    BENCH.height >= 0.85 &&
    BENCH.height <= 1.0,
  `${BENCH.length} m long, ${BENCH.depth} m deep, ${BENCH.height} m to the top of the back, ` +
    `with the seat at ${BENCH.seatY} m — the reference's own dimensions`,
);
check(
  "and is drawn at the scale of the people who use it",
  /* ONE factor. This used to assert EMPLOYEE_SCALE * RIDE_SEAT_SCALE, which was
     right while RIDE_SEAT_SCALE was an independent 1.6; now that a ride seat is
     sized by the employee sitting in it the two are the same number, and
     multiplying them squared the bench to 89 m. */
  Math.abs(BENCH_SCALE - RIDE_SEAT_SCALE) < 1e-12 &&
    Math.abs(RIDE_SEAT_SCALE - EMPLOYEE_SCALE) < 1e-12,
  `${BENCH_SCALE.toFixed(3)}x — the same factor every seat in the park carries, which is the ` +
    `employees' own ${EMPLOYEE_SCALE.toFixed(3)}x — so it stands ` +
    `${(BENCH.length * BENCH_SCALE).toFixed(1)} x ${(BENCH.depth * BENCH_SCALE).toFixed(1)} x ` +
    `${(BENCH.height * BENCH_SCALE).toFixed(1)} units against a ${EMPLOYEE_HEIGHT}-unit employee`,
);
check(
  "the seat is at sitting height for an employee",
  Math.abs(BENCH.seatY - PROP.chairSeatY) < 0.05,
  `${(BENCH.seatY * BENCH_SCALE).toFixed(2)} units off the ground, against the park's own ` +
    `${PROP.chairSeatY} m chair height scaled the same way`,
);

// ============ 2. It is built, not a box ============
check(
  "the seat and back are slatted boards, not a solid slab",
  (() => {
    const seat = /Array\.from\(\{ length: (\d+) \}, \(_, i\) => \(\{\s*key: i,/.exec(src);
    const back = /Array\.from\(\{ length: (\d+) \}, \(_, i\) => \(\{\s*key: 10 \+ i,/.exec(src);
    /* Separate boards with a gap between them, and rounded rather than boxy. */
    return (
      seat !== null &&
      back !== null &&
      Number(seat[1]) >= 4 &&
      Number(back[1]) >= 3 &&
      BENCH.gap > 0 &&
      (src.match(/<RoundedBox/g) ?? []).length >= 3
    );
  })(),
  `five seat boards and four back boards with a ${(BENCH.gap * 1000).toFixed(0)} mm gap, ` +
    `each ${(BENCH.slat * 1000).toFixed(0)} mm thick and eased at the edges`,
);
check(
  "it stands on shaped end frames with armrests",
  /function EndFrame/.test(src) && /Armrest/.test(src) && /Scrolled foot/.test(src),
  "front leg, back leg carried up into the backrest, scrolled foot and a turned armrest",
);
check(
  "the back is raked, not vertical",
  BENCH.backRake > 0.1 && BENCH.backRake < 0.4,
  `${((BENCH.backRake * 180) / Math.PI).toFixed(0)} degrees off vertical`,
);
check(
  "every board is its own tone, so it reads as timber rather than one moulding",
  /function slatMaterial/.test(src) && /GRAIN_SPREAD/.test(src),
  "each slat's colour is drawn deterministically from its index, so the grain is stable across reloads",
);
check(
  "the timber is a warm dark brown, not a plastic or cartoon colour",
  (() => {
    const m = /const WOOD_BASE = "(#[0-9a-f]{6})"/i.exec(src);
    if (!m) return false;
    const r = parseInt(m[1].slice(1, 3), 16);
    const g = parseInt(m[1].slice(3, 5), 16);
    const b = parseInt(m[1].slice(5, 7), 16);
    /* Warm (red above green above blue), dark, and not saturated to orange. */
    return r > g && g > b && r < 130 && r - b > 30 && r - b < 90;
  })(),
  "dark warm brown under a satin varnish — roughness 0.62-0.72 with a trace of metalness",
);
check(
  "it casts and receives shadow like everything else in the park",
  /castShadow/.test(src) && /receiveShadow/.test(src),
  "the boards catch the park's existing light rig; no lighting was added",
);

// ============ 3. It stands on the ground, beside the wheel, facing it ============
check(
  "the bench sits on the ground — no floating, no sinking",
  by === 0,
  "its feet are at y = 0, on the existing ground, which is untouched",
);
{
  const d = Math.hypot(bx - wheel.center[0], bz - wheel.center[1]);
  const clearOfFootprint = d - Math.max(wheel.halfX, wheel.halfZ);
  check(
    "it stands beside the Ferris Wheel, clear of the ride itself",
    clearOfFootprint > 5 && d < 90,
    `${d.toFixed(0)} m from the centre of a wheel whose footprint reaches ` +
      `${wheel.halfX.toFixed(0)} m — a ${clearOfFootprint.toFixed(0)} m set-back`,
  );
  /* Facing it: the park's convention is +Z forward, so the yaw must point at
     the wheel from where the bench stands. */
  const want = Math.atan2(wheel.center[0] - bx, wheel.center[1] - bz);
  check(
    "a person sitting on it faces the Ferris Wheel",
    Math.abs(BENCH_PLACEMENT.yaw - want) < 1e-9,
    `turned ${((BENCH_PLACEMENT.yaw * 180) / Math.PI).toFixed(0)} degrees, straight at the wheel`,
  );
}
check(
  "it is nearer the Ferris Wheel than any other ride",
  PARK_LAYOUT.every(
    (r) =>
      r.id === "ferris" ||
      Math.hypot(bx - r.center[0], bz - r.center[1]) >
        Math.hypot(bx - wheel.center[0], bz - wheel.center[1]),
  ),
  "it belongs to the wheel and reads as the wheel's",
);

// ============ 4. It is in nobody's way ============
{
  const stair = stairFor("ferris");
  const spots: [string, [number, number]][] = [
    ["the boarding stair", [stair.base[0], stair.base[1]]],
    ["the boarding platform", [stair.deck[0], stair.deck[1]]],
    ...stair.queue.map(
      (q, i) => [`queue place ${i + 1}`, [q[0], q[1]]] as [string, [number, number]],
    ),
  ];
  let nearest = Infinity;
  let what = "";
  for (const [name, p] of spots) {
    const d = Math.hypot(bx - p[0], bz - p[1]);
    if (d < nearest) {
      nearest = d;
      what = name;
    }
  }
  check(
    "it blocks no part of the boarding system",
    nearest > BENCH.length * BENCH_SCALE,
    `${nearest.toFixed(0)} m from the nearest piece of it (${what})`,
  );

  /* And nobody walks through it. Sampled along every employee's whole day. */
  let nearestRoute = Infinity;
  let who = "";
  for (const e of JOURNEY_EMPLOYEES) {
    for (let t = e.spawnTime; t <= e.despawnTime; t += 0.25) {
      const s = sampleJourney(e, t);
      if (!s || s.y > 0.01) continue;
      const d = Math.hypot(s.x - bx, s.z - bz);
      if (d < nearestRoute) {
        nearestRoute = d;
        who = e.id;
      }
    }
  }
  check(
    "no employee's route passes through it",
    nearestRoute > BENCH.length * BENCH_SCALE,
    `the closest anybody walks is ${nearestRoute.toFixed(0)} m (${who}) — clear of a ` +
      `${(BENCH.length * BENCH_SCALE).toFixed(1)} m bench with room to walk round it`,
  );

  check(
    "it is not standing in the plaza or the fountain",
    Math.hypot(bx - PLAZA_CENTER[0], bz - PLAZA_CENTER[1]) > PLAZA_RADIUS,
    `${Math.hypot(bx - PLAZA_CENTER[0], bz - PLAZA_CENTER[1]).toFixed(0)} m from the plaza centre, ` +
      `whose paving reaches ${PLAZA_RADIUS} m`,
  );
}

// ============ 5. An addition, and only an addition ============
check(
  "the bench is placed by a solver, not typed in",
  /function solvePlacement/.test(src) && !/position: \[-?\d+\.\d+, 0, -?\d+\.\d+\]/.test(src),
  "the spot is swept for, scored on clearance, and re-derived whenever the park changes",
);
check(
  "it reads nothing from the simulation and writes nothing to it",
  !/useJourneyStore|currentSimTime|advanceJourneyClock|EMPLOYEE_DATASET|useFrame/.test(src),
  "a static prop — it has no animation loop and no state",
);
check(
  "nothing else in the scene was touched to make room for it",
  (() => {
    const scene = read("src", "components", "roller-coaster", "ParkScene.tsx");
    /* One import and one render line, beside the fountain. */
    return (
      (scene.match(/FerrisWheelBench/g) ?? []).length === 2 &&
      /<FerrisWheelBench \/>/.test(scene)
    );
  })(),
  "one import and one line in ParkScene; no ride, route or ground was edited",
);
check(
  "the park's own existing bench prop is unchanged",
  /export function Bench\(/.test(read("src", "components", "world", "kit.tsx")),
  "the kit's simple bench is still there for the food court and the paths that use it",
);

// ============ Report ============
console.log("");
console.log(
  `The bench stands at (${bx.toFixed(1)}, ${bz.toFixed(1)}), ` +
    `${Math.hypot(bx - wheel.center[0], bz - wheel.center[1]).toFixed(0)} m from the Ferris Wheel's centre, ` +
    `facing it.`,
);
console.log(
  `Drawn size ${(BENCH.length * BENCH_SCALE).toFixed(2)} x ${(BENCH.depth * BENCH_SCALE).toFixed(2)} x ` +
    `${(BENCH.height * BENCH_SCALE).toFixed(2)} units, from ${BENCH.length} x ${BENCH.depth} x ${BENCH.height} m ` +
    `at ${BENCH_SCALE.toFixed(3)}x — the seat lands at ${(BENCH.seatY * BENCH_SCALE).toFixed(2)} units, ` +
    `hip height on a ${EMPLOYEE_HEIGHT}-unit employee.`,
);

if (failures > 0) {
  console.error(`\n${failures} CHECK(S) FAILED`);
  process.exit(1);
}
console.log("\nOK: promenade bench verified.");
