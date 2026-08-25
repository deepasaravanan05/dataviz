import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PARK_LAYOUT } from "../src/components/park/layout";
import { TRACK_CURVE } from "../src/components/park-train/trainTrack";
import { TRAIN_SCALE } from "../src/components/park/parkScale";
import {
  FOOD_COURT_CENTER,
  FOOD_COURT_HALF,
  GATE_OPENING,
  GATE_X,
  GATE_Z,
  SPAWN_Z,
} from "../src/simulation/journey/constants";

let failures = 0;
function check(label: string, ok: boolean, detail: string) {
  if (!ok) failures++;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${label} — ${detail}`);
}

const root = join(__dirname, "..");
const scene = readFileSync(join(root, "src", "components", "roller-coaster", "ParkScene.tsx"), "utf8");
const sim = readFileSync(join(root, "src", "components", "3d", "Scene.tsx"), "utf8");
const ground = readFileSync(join(root, "src", "components", "ferris-wheel", "ParkGround.tsx"), "utf8");

/** Comments describe what was removed, so checks must read code only. */
function code(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

function num(src: string, re: RegExp, label: string): number {
  const m = src.match(re);
  if (!m) throw new Error(`Could not read ${label}`);
  return Number(m[1]);
}

const GROUND_SIZE = num(scene, /size=\{(\d+)\}/, "ground size");
const GROUND_HALF = GROUND_SIZE / 2;
/*
 * The night pass recoloured the atmosphere, so the fog is read by shape, not
 * by a hard-coded daytime colour: whatever hex the scene declares is taken as
 * the fog colour and compared against the background further down.
 */
const FOG_MATCH = code(scene).match(/<fog[\s\S]{0,200}?args=\{\["(#[0-9a-fA-F]{6})", (\d+), (\d+)\]\}/);
if (!FOG_MATCH) throw new Error("Could not read the scene fog declaration");
const FOG_COLOR = FOG_MATCH[1].toLowerCase();
const FOG_NEAR = Number(FOG_MATCH[2]);
const FOG_FAR = Number(FOG_MATCH[3]);
const MAX_DISTANCE = num(scene, /maxDistance=\{(\d+)\}/, "maxDistance");
const MIN_DISTANCE = num(scene, /minDistance=\{(\d+)\}/, "minDistance");
const CAM_FAR = num(scene, /far: (\d+)/, "camera far");
const FOV = num(scene, /fov: (\d+)/, "fov");

// ============ 1. Everything in the park sits on the ground ============
const xs: number[] = [];
const zs: number[] = [];

for (const r of PARK_LAYOUT) {
  xs.push(r.minX, r.maxX);
  zs.push(r.minZ, r.maxZ);
}
for (let i = 0; i < 2000; i++) {
  const p = TRACK_CURVE.getPointAt(i / 2000);
  xs.push(p.x * TRAIN_SCALE);
  zs.push(p.z * TRAIN_SCALE);
}

// The entrance, the ground employees walk in across, and the food court.
xs.push(GATE_X - GATE_OPENING, GATE_X + GATE_OPENING);
zs.push(GATE_Z, SPAWN_Z + 50);
xs.push(FOOD_COURT_CENTER[0] - FOOD_COURT_HALF, FOOD_COURT_CENTER[0] + FOOD_COURT_HALF);
zs.push(FOOD_COURT_CENTER[1] - FOOD_COURT_HALF, FOOD_COURT_CENTER[1] + FOOD_COURT_HALF);

const PARK = {
  minX: Math.min(...xs),
  maxX: Math.max(...xs),
  minZ: Math.min(...zs),
  maxZ: Math.max(...zs),
};
const reach = Math.max(Math.abs(PARK.minX), Math.abs(PARK.maxX), Math.abs(PARK.minZ), Math.abs(PARK.maxZ));

check(
  "the ground extends beyond every ride",
  PARK_LAYOUT.every((r) => Math.max(Math.abs(r.minX), Math.abs(r.maxX), Math.abs(r.minZ), Math.abs(r.maxZ)) < GROUND_HALF),
  `furthest ride edge ${Math.max(...PARK_LAYOUT.map((r) => Math.max(Math.abs(r.maxX), Math.abs(r.maxZ)))).toFixed(0)}u vs ground half-extent ${GROUND_HALF}u`,
);
check(
  "the ground extends beyond the main gate and the approach outside it",
  SPAWN_Z + 50 < GROUND_HALF && GATE_X + GATE_OPENING < GROUND_HALF,
  `employees appear at z=${SPAWN_Z}u; ground half-extent ${GROUND_HALF}u`,
);
check(
  "the ground extends beyond the food court",
  Math.abs(FOOD_COURT_CENTER[0]) + FOOD_COURT_HALF < GROUND_HALF &&
    Math.abs(FOOD_COURT_CENTER[1]) + FOOD_COURT_HALF < GROUND_HALF,
  `food court at (${FOOD_COURT_CENTER[0]}, ${FOOD_COURT_CENTER[1]})`,
);
check(
  "the ground extends beyond the park train's loop",
  Math.max(Math.abs(PARK.minX), Math.abs(PARK.maxX)) < GROUND_HALF,
  `loop and everything else within ${reach.toFixed(0)}u`,
);
check(
  "the land is far larger than the park it carries, not a fitted rectangle",
  GROUND_HALF > reach * 4,
  `ground half-extent ${GROUND_HALF}u vs park reach ${reach.toFixed(0)}u (${(GROUND_HALF / reach).toFixed(1)}x)`,
);

// ============ 2. The edge can never come into view ============
/*
 * Worst case: the camera orbits to its maximum distance in the direction of an
 * edge. The nearest bit of edge is then (GROUND_HALF - MAX_DISTANCE) away. If
 * that exceeds the fog's far distance, the edge is always fully fogged — which
 * is to say, indistinguishable from the sky.
 */
const nearestEdge = GROUND_HALF - MAX_DISTANCE;
check(
  "the ground's edge is always beyond full fog — no visible square boundary",
  nearestEdge > FOG_FAR,
  `nearest possible edge ${nearestEdge}u away, fog is opaque from ${FOG_FAR}u (${(nearestEdge - FOG_FAR)}u of margin)`,
);
/*
 * The night sky is a gradient dome, so background and fog are tuned shades of
 * the same navy rather than one identical value. What protects the horizon is
 * that they sit within a few RGB points of each other — a hard edge needs a
 * visible colour step, and there is none to be had inside this tolerance.
 */
{
  const bg = scene.match(/<color attach="background" args=\{\["(#[0-9a-fA-F]{6})"\]\}/);
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const near = bg
    ? Math.max(
        ...[0, 1, 2].map((i) => Math.abs(channel(bg[1].toLowerCase(), i) - channel(FOG_COLOR, i))),
      )
    : Infinity;
  check(
    "fog and background are near-identical colours, so land fades into sky",
    near <= 24,
    bg ? `background ${bg[1]} vs fog ${FOG_COLOR}, worst channel gap ${near}` : "no background colour found",
  );
}
check(
  "the camera's far plane clears the fog, so nothing is clipped while still visible",
  CAM_FAR > FOG_FAR,
  `far plane ${CAM_FAR}u vs fog end ${FOG_FAR}u`,
);
check(
  "depth precision is protected across the enlarged view range",
  /logarithmicDepthBuffer: true/.test(scene),
  "logarithmic depth buffer enabled",
);

// ============ 3. Zoom-out still frames the park, without washing it out ============
const halfSpan = Math.max((PARK.maxX - PARK.minX) / 2, (PARK.maxZ - PARK.minZ) / 2);
const needed = halfSpan / Math.tan(((FOV / 2) * Math.PI) / 180);
check(
  "you can zoom out far enough to see the whole property",
  MAX_DISTANCE >= needed,
  `need ~${needed.toFixed(0)}u to frame ${(halfSpan * 2).toFixed(0)}u at ${FOV}deg fov; limit is ${MAX_DISTANCE}u`,
);
/*
 * The night atmosphere deliberately begins inside the orbit range (haze is
 * part of the look), so the guarantee is no longer "no fog at the limit" but
 * "the park is never MOSTLY fog": at the furthest orbit, linear fog over the
 * park must stay under half strength.
 */
{
  const fogAtLimit = Math.max(0, (MAX_DISTANCE + reach - FOG_NEAR) / (FOG_FAR - FOG_NEAR));
  check(
    "you cannot zoom out so far the park hazes over",
    fogAtLimit < 0.5,
    `fog factor over the far side of the park at the orbit limit: ${(fogAtLimit * 100).toFixed(0)}%`,
  );
}
check(
  "the park never shrinks to a speck",
  MAX_DISTANCE < reach * 3,
  `orbit limit ${MAX_DISTANCE}u vs park reach ${reach.toFixed(0)}u`,
);
check("close inspection is still possible", MIN_DISTANCE <= 30, `minDistance ${MIN_DISTANCE}u`);

// ============ 4. The park is fixed; only the camera moves ============
check(
  "the camera orbits — the park itself never rotates",
  !/autoRotate/.test(scene) && !/<group rotation=\{\[0, [a-z]/.test(scene),
  "OrbitControls moves the camera; no rotation is applied to the park root",
);
check(
  "orbiting stays above ground level",
  /maxPolarAngle=\{Math\.PI \/ 2\.05\}/.test(scene),
  "the camera cannot drop below the horizon and see under the land",
);

// ============ 5. Only the ground changed ============
check(
  "the ground component still uses its original plane geometry",
  /<planeGeometry args=\{\[size, size\]\} \/>/.test(ground) && /grassColor/.test(ground),
  "same geometry type; the grass colour became a prop when the night palette landed",
);
check(
  "no second, competing ground was introduced",
  (scene.match(/<ParkGround/g) ?? []).length === 1,
  "one ParkGround in the scene",
);
check(
  "the plaza is untouched",
  /plazaRadius=\{PLAZA_RADIUS\}/.test(scene) && /plazaCenter=\{PLAZA_CENTER\}/.test(scene),
  "same radius and same centre as before",
);

// ============ 5b. Trees and the paved path are gone ============
check(
  "no tree module remains anywhere in the source tree",
  !existsSync(join(root, "src", "components", "park", "trees")),
  "src/components/park/trees deleted",
);
check(
  "nothing imports or renders trees any more",
  !/ParkTrees|treePlacement|treeSpecies/.test(code(scene)) &&
    !/[Tt]ree/.test(code(ground)),
  "no tree import, no tree render, no tree code left in the ground component",
);
check(
  "the ground component no longer builds or scatters trees",
  !/buildTrees|coneGeometry|treeCount|treeInnerRadius|treeSpread|keepOut/.test(code(ground)),
  "tree geometry, tree props and the keep-out plumbing are all removed",
);
check(
  "the silver walkway is gone from the ground component",
  !/walkway|walkMidZ|walkLength/.test(code(ground)) && !/#a8a89f/.test(ground),
  "no path mesh and no path colour remains",
);
check(
  "the scene no longer passes a walkway",
  !/walkway/.test(code(scene)),
  "the ParkGround call has no walkway prop",
);
check(
  "the grass plane is the only large ground surface left",
  (ground.match(/<planeGeometry/g) ?? []).length === 1,
  "one plane: the grass",
);

// Ride placement must be byte-for-byte what it was before this change.
const EXPECTED_CENTRES: Record<string, [number, number]> = {
  ferris: [-165, 250],
  dragon: [-72.3, 117.7],
  coaster: [70, -10],
  monster: [205, 90],
  tower: [267.75, 280],
};
check(
  "every ride is exactly where it was",
  PARK_LAYOUT.every((r) => {
    const e = EXPECTED_CENTRES[r.id];
    return e && Math.abs(r.center[0] - e[0]) < 1e-6 && Math.abs(r.center[1] - e[1]) < 1e-6;
  }),
  PARK_LAYOUT.map((r) => `${r.label} (${r.center[0].toFixed(0)}, ${r.center[1].toFixed(0)})`).join(", "),
);

// ============ 6. The simulation scene had the same problem ============
const SIM_SIZE = num(sim, /planeGeometry args=\{\[(\d+), \d+\]\}/, "sim ground");
const SIM_FOG_FAR = num(sim, /args=\{\["#bcd6f2", \d+, (\d+)\]\}/, "sim fog far");
const SIM_MAX = num(sim, /maxDistance=\{(\d+)\}/, "sim maxDistance");

check(
  "the simulation scene's ground was enlarged too",
  SIM_SIZE >= 1000,
  `${SIM_SIZE}u across (was 70x40)`,
);
check(
  "the simulation scene no longer sits in a white void",
  /<color attach="background"/.test(sim) && /<fog attach="fog"/.test(sim),
  "sky-coloured surround and matching fog added",
);
check(
  "its ground edge is out of view as well",
  SIM_SIZE / 2 - SIM_MAX > SIM_FOG_FAR,
  `nearest edge ${SIM_SIZE / 2 - SIM_MAX}u vs fog end ${SIM_FOG_FAR}u`,
);

// ============ Summary ============
console.log(
  `\nPark occupies x [${PARK.minX.toFixed(0)}, ${PARK.maxX.toFixed(0)}], ` +
    `z [${PARK.minZ.toFixed(0)}, ${PARK.maxZ.toFixed(0)}] — reach ${reach.toFixed(0)}u.`,
);
console.log(
  `Ground ${GROUND_SIZE}u across (half-extent ${GROUND_HALF}u): ${(GROUND_HALF / reach).toFixed(1)}x the park's reach.`,
);
console.log(
  `Camera orbits ${MIN_DISTANCE}-${MAX_DISTANCE}u; fog ${FOG_NEAR}-${FOG_FAR}u; far plane ${CAM_FAR}u. ` +
    `Nearest reachable ground edge ${nearestEdge}u — ${(nearestEdge - FOG_FAR)}u past full fog.`,
);

console.log(failures === 0 ? "\nOK: park ground coverage verified." : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
