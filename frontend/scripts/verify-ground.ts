import { existsSync, readFileSync } from "node:fs";
import {
  PARK_ORIGIN,
  RIDE_SLOT_BEARING,
  RING_RIDE_REACH,
  type RingRideId,
} from "../src/components/park/parkRing";
import {
  ORBIT_MAX_DISTANCE,
  ORBIT_MIN_DISTANCE,
} from "../src/components/world/cameraPlaces";
import { join } from "node:path";
import { PARK_LAYOUT } from "../src/components/park/layout";
import { RIDE_PLOTS, type RidePlot } from "../src/components/world/paths";
import { SKY_THEMES } from "../src/components/world/skyThemes";
import { GRASS_TILE_METRES } from "../src/components/world/grassTexture";
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
const ground = readFileSync(join(root, "src", "components", "ferris-wheel", "ParkGround.tsx"), "utf8");
const grassSrc = readFileSync(join(root, "src", "components", "world", "grassTexture.ts"), "utf8");

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
 * The atmosphere is now per time-of-day, so the fog is read from the theme
 * table the scene renders from rather than from a literal in the JSX. The
 * geometry checks below are about the darkest, haziest setting, which is the
 * `dark` entry — the night the park was originally tuned under.
 */
const NIGHT = SKY_THEMES.dark;
check(
  "the scene takes its atmosphere from the shared theme table",
  /SKY_THEMES\[/.test(code(scene)) && /sky\.fog\.color/.test(code(scene)),
  "one source of truth for fog, background, lights and exposure",
);
const FOG_NEAR = NIGHT.fog.near;
const FOG_FAR = NIGHT.fog.far;
/*
 * THE ORBIT LIMITS ARE READ, NOT SCRAPED.
 *
 * They used to be pulled out of the scene's JSX with a regexp for a literal
 * number, which worked while they WERE literals. The far limit is now solved
 * from the overview viewpoint — the park grew, the opening shot stepped back
 * past the old fixed 1800, and a limit shorter than the shot it has to hold
 * snapped the framing inward on the first drag — so the numbers live in
 * `cameraPlaces.ts` and are imported here. The check that the scene actually
 * uses them is below, and is worth more than a scraped literal was: it proves
 * the two cannot drift apart at all, rather than that they happened to agree.
 */
const MAX_DISTANCE = ORBIT_MAX_DISTANCE;
const MIN_DISTANCE = ORBIT_MIN_DISTANCE;
check(
  "the scene takes its orbit limits from the solved camera places",
  /minDistance=\{ORBIT_MIN_DISTANCE\}/.test(scene) && /maxDistance=\{ORBIT_MAX_DISTANCE\}/.test(scene),
  `orbit ${MIN_DISTANCE.toFixed(0)}-${MAX_DISTANCE.toFixed(0)}u, solved from the overview`,
);
const CAM_FAR = num(scene, /far: (\d+)/, "camera far");
const FOV = num(scene, /DEFAULT_FOV = (\d+)/, "fov");

// ============ 1. Everything in the park sits on the ground ============
const xs: number[] = [];
const zs: number[] = [];

for (const r of PARK_LAYOUT) {
  xs.push(r.minX, r.maxX);
  zs.push(r.minZ, r.maxZ);
}
/* The railway used to be sampled here to bound the park; it has been removed. */

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
  /* Every theme must hold the horizon, not just the night one. */
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const worst = Object.entries(SKY_THEMES).map(([name, t]) => {
    const gap = Math.max(
      ...[0, 1, 2].map((i) =>
        Math.abs(channel(t.background.toLowerCase(), i) - channel(t.fog.color.toLowerCase(), i)),
      ),
    );
    return { name, gap, bg: t.background, fog: t.fog.color };
  });
  const offender = worst.reduce((a, b) => (b.gap > a.gap ? b : a));
  check(
    "fog and background are near-identical colours, so land fades into sky",
    offender.gap <= 24,
    `worst theme "${offender.name}": background ${offender.bg} vs fog ${offender.fog}, gap ${offender.gap}`,
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

// ============ 5c. The grass is grass ============
/*
 * The plane used to be painted one flat colour, which is the one thing a lawn
 * never is. It now carries a generated surface — blade grain, tuft clumping
 * and the matching relief — and a green albedo in every theme. Both halves are
 * asserted here: a colour without the surface is painted card, and a surface
 * under a brown albedo is not a lawn.
 */
check(
  "the ground is a generated grass surface, not a flat fill",
  /grassMapsFor/.test(code(ground)) &&
    /map=\{/.test(code(ground)) &&
    /normalMap=\{/.test(code(ground)),
  "the plane takes a colour map and a matching normal map from world/grassTexture",
);
check(
  "the lawn's relief is generated rather than loaded",
  !/useLoader|TextureLoader|\.jpg|\.png|https?:/.test(code(grassSrc)) &&
    /DataTexture/.test(code(grassSrc)),
  "value noise straight into a DataTexture — no image file, no network, no loader",
);
check(
  "the tile wraps, so 14 km of ground has no seam",
  /RepeatWrapping/.test(grassSrc) && /wrap\(/.test(grassSrc),
  `one tile covers ${GRASS_TILE_METRES} m and repeats ${Math.round(GROUND_SIZE / GRASS_TILE_METRES)}x across the plane`,
);
const brownThemes = (["sunset", "sunrise", "dark"] as const).filter((id) => {
  const hex = SKY_THEMES[id].ground.grass;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return !(g > r * 1.3 && g > b * 1.3);
});
check(
  "every theme's ground is green",
  brownThemes.length === 0,
  (["sunset", "sunrise", "dark"] as const)
    .map((id) => `${SKY_THEMES[id].label} ${SKY_THEMES[id].ground.grass}`)
    .join(", ") + " — green dominant in all three, where all three used to be olive-brown",
);

/*
 * Ride placement, as it now stands.
 *
 * Three of these are the centres the park has always had. Two changed, and both
 * changes were asked for or forced by one that was:
 *
 *   - the Monster Ride and the Drop Tower each STEPPED BACK 40 m, away from the
 *     main gate at z = 620 and deeper into the park;
 *   - the Roller Coaster moved 12.3 m west, which nobody asked for. Every ride
 *     grew 20%, and at full size the Roller Coaster and the Monster Ride
 *     overlap by 12.5 m in x. The layout solver will not let two rides
 *     intersect, so it pushed the pair apart symmetrically. The alternative was
 *     to hand-place one of them into the other, which is worse.
 */
/*
 * NO PAVED SURFACE MAY REACH UNDER A RIDE.
 *
 * The waiting aprons are sized from the crowd that gathers on them, and left to
 * themselves two of them grew until they ran 24u INSIDE the ride they served —
 * the Monster Ride's cups swung out over paving and appeared to pass through
 * the ground. Every paved disc is therefore swept against every ride's
 * footprint here, so a future change to a crowd size, a ride's reach or a
 * walking route cannot quietly put the ground back under the machinery.
 */
{
  /*
   * THIS CHECK HAS BEEN TURNED INSIDE OUT, DELIBERATELY.
   *
   * It used to require that no paved surface reached under any ride: the
   * waiting aprons had grown until two of them ran 24 m INSIDE the ride they
   * served, and the Monster Ride's cups swung out over paving and appeared to
   * pass through the ground.
   *
   * The plan now says the opposite, in as many words: "every radial path must
   * reach the corresponding ride entrance/platform clearly and completely; do
   * not stop the paths before reaching the rides". Every attraction stands in
   * the middle of an identical paved PLATFORM, and the surface runs unbroken
   * from the food court, down the radial, across the platform to the boarding
   * steps. Paving under a ride is the design, not a defect.
   *
   * What the old check was really protecting is still protected, and is now
   * checked where it belongs: paving must not reach under a ride it does NOT
   * serve. That is measured in `verify-park-structure.ts` ("no path crosses a
   * ride it does not serve"). What is asserted here is the positive form —
   * every ride really is standing on its own platform, centred on it, with the
   * same margin of platform showing all round.
   */
  const offPlatform = PARK_LAYOUT.filter((r) => {
    const plot = RIDE_PLOTS.find((p: RidePlot) => p.id === r.id);
    if (!plot) return true;
    const off = Math.hypot(r.center[0] - plot.center[0], r.center[1] - plot.center[1]);
    /* Measured with the plan's own envelope rule — a square footprint was
       declared from a swept radius, so its circle is that radius and not its
       diagonal. Using the diagonal here would report the Monster Ride as
       overhanging a platform it fits inside with twelve metres to spare. */
    return off > 1e-9 || RING_RIDE_REACH[r.id as RingRideId] > plot.radius;
  });
  check(
    "every ride stands centred on its own paved platform, inside it",
    offPlatform.length === 0,
    offPlatform.length
      ? offPlatform.map((r) => r.label).join(", ")
      : `${RIDE_PLOTS.length} platforms of ${(RIDE_PLOTS[0].radius * 2).toFixed(0)}u, one ride centred on each`,
  );
}

/*
 * THE RIDES HAVE MOVED AGAIN, AND THIS CHECK SAYS WHAT SURVIVED THE MOVE.
 *
 * It began as five frozen coordinates, from the stretch of this park's life
 * when no ride ever moved. When "every ride is to be the same size" superseded
 * that, the coordinates went and what they were protecting stayed: the FAN —
 * from the main gate the five read left to right in their designed order, with
 * no two overlapping.
 *
 * The park is concentric now, and a ring has no left-to-right order to keep:
 * the attractions run all the way round the lake. What both earlier versions
 * were protecting is that the plan is DELIBERATE — every ride in a known slot
 * rather than wherever a solver left it — so that is what is asserted, in the
 * terms the plan now has. The centres are printed rather than frozen.
 */
{
  const offSlot = PARK_LAYOUT.filter((r) => {
    const dx = r.center[0] - PARK_ORIGIN[0];
    const dz = r.center[1] - PARK_ORIGIN[1];
    const bearing = (Math.atan2(dx, dz) * 180) / Math.PI;
    return Math.abs(bearing - RIDE_SLOT_BEARING[r.id as RingRideId]) > 1e-6;
  });
  check(
    "the five department rides each stand on their declared slot on the ring",
    offSlot.length === 0,
    PARK_LAYOUT.map(
      (r) =>
        `${r.label} ${RIDE_SLOT_BEARING[r.id as RingRideId]}deg (${r.center[0].toFixed(0)}, ${r.center[1].toFixed(0)})`,
    ).join(", "),
  );
}

/*
 * Section 6 used to re-check the Phase-1 proof-of-concept scene
 * (src/components/3d/). That scene has been removed — the journey layer in
 * ParkScene is the employee simulation now — so the park scene above is the
 * only scene there is.
 */

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
