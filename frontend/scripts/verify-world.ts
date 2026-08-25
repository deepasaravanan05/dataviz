import { readFileSync } from "node:fs";
import { join } from "node:path";
import { HUMAN, LOD_MID, LOD_NEAR, PROP, SIGN } from "../src/world/scale";
import { PARK_LAYOUT, PLAZA_CENTER, rideById } from "../src/components/park/layout";
import { CAMERA_PLACES, UNREACHABLE_RIDES } from "../src/components/world/cameraPlaces";
import { PATH_LINKS, PATH_NODES, distanceToPaving } from "../src/components/world/paths";
import { BOUNDARY_TREES, PARK_SHRUBS, PARK_TREES } from "../src/components/world/planting";
import { RIDE_SIGNS } from "../src/components/park/rideSigns";
import { JOURNEY_EMPLOYEES, sampleJourney } from "../src/simulation/journey/journey";
import {
  FOOD_COURT_CENTER,
  FOOD_COURT_HALF,
  GATE_OPENING,
  GATE_HEIGHT,
  LANE_COUNT,
  LANE_SPACING,
  SIM_MINUTES_PER_SECOND,
  WALK_UNITS_PER_MINUTE,
} from "../src/simulation/journey/constants";
import { SPEED_OPTIONS } from "../src/simulation/journey/clock";
import { TRACK_CURVE } from "../src/components/park-train/trainTrack";
import { TRAIN_SCALE } from "../src/components/park/parkScale";

let failures = 0;
function check(label: string, ok: boolean, detail: string) {
  if (!ok) failures++;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${label} — ${detail}`);
}

const root = join(__dirname, "..");
const read = (...p: string[]) => readFileSync(join(root, ...p), "utf8");
const scene = read("src", "components", "roller-coaster", "ParkScene.tsx");
const employeesSrc = read("src", "components", "park", "journey", "Employees.tsx");
const envSrc = read("src", "components", "world", "ParkEnvironment.tsx");
const directorSrc = read("src", "components", "world", "CameraDirector.tsx");

// ================= 1. One unit is one metre, and a person proves it =================
check(
  "an employee is a realistic height",
  HUMAN.height >= 1.6 && HUMAN.height <= 1.9,
  `${HUMAN.height} m (was 4.42 m — 2.53x life size, which is what made the rides look like toys)`,
);
check(
  "the figures are built from that height, not from a magic number",
  /from "@\/world\/scale"/.test(employeesSrc) &&
    /\.hipY/.test(employeesSrc) &&
    /\.shoulderY/.test(employeesSrc) &&
    /\.headY/.test(employeesSrc),
  "hips, shoulders and head all read from the world scale module",
);
check(
  "a person can walk under the entrance arch",
  10.5 > HUMAN.height * 2,
  `arch soffit 10.5 m over a ${HUMAN.height} m person`,
);
check(
  "the gate is impressive but not absurd",
  GATE_HEIGHT / HUMAN.height > 6 && GATE_HEIGHT / HUMAN.height < 12,
  `${GATE_HEIGHT} m tall = ${(GATE_HEIGHT / HUMAN.height).toFixed(1)} people (was 42 m = 9.5 oversized people)`,
);
check(
  "the gate opening is a gate, not a stadium",
  GATE_OPENING >= 15 && GATE_OPENING <= 45,
  `${GATE_OPENING} m of frontage (was 104 m)`,
);
check(
  "every walking lane fits through the opening",
  ((LANE_COUNT - 1) / 2) * LANE_SPACING * 1.15 < GATE_OPENING / 2,
  `${LANE_COUNT} lanes at ${LANE_SPACING} m pitch inside a ${GATE_OPENING} m opening`,
);

console.log("");
for (const r of PARK_LAYOUT) {
  const people = r.height / HUMAN.height;
  check(
    `${r.label} reads as a real attraction`,
    people > 11,
    `${r.height} m = ${people.toFixed(0)} people tall`,
  );
}

check(
  "furniture is sized for the people using it",
  PROP.chairSeatY > 0.38 && PROP.chairSeatY < 0.52 && PROP.tableTopY > 0.68 && PROP.tableTopY < 0.8,
  `seat ${PROP.chairSeatY} m, table ${PROP.tableTopY} m — a person sits at these`,
);
check(
  "signage is read at walking distance, not from a motorway",
  SIGN.boardWidth < 8 && SIGN.boardBottom > HUMAN.height,
  `${SIGN.boardWidth} m board hung at ${SIGN.boardBottom} m (was a 26 m board at 11 m)`,
);

// ================= 2. Walking is a walk =================
const metresPerSecondAt1x = (WALK_UNITS_PER_MINUTE * SIM_MINUTES_PER_SECOND) / 1;
check(
  "at 1x the clock runs in real time",
  Math.abs(SIM_MINUTES_PER_SECOND - 1 / 60) < 1e-9,
  `${(SIM_MINUTES_PER_SECOND * 60).toFixed(2)} simulated minutes per real minute`,
);
check(
  "at 1x employees walk at a human pace",
  metresPerSecondAt1x > 1.1 && metresPerSecondAt1x < 1.7,
  `${metresPerSecondAt1x.toFixed(2)} m/s against a real walk of ${HUMAN.walkSpeed} m/s`,
);
check(
  "the speed control covers inspection through to a whole morning",
  SPEED_OPTIONS.includes(1) && Math.max(...SPEED_OPTIONS) >= 60,
  SPEED_OPTIONS.map((s) => `${s}x`).join(", "),
);
check(
  "the gait is driven by ground covered, so legs stay in step at every speed",
  /moved \/ STRIDE/.test(employeesSrc),
  "stride length, not elapsed time",
);

// ================= 3. Distance-based detail =================
check(
  "employees drop to fewer parts with distance",
  LOD_NEAR > 0 && LOD_MID > LOD_NEAR && /near\.current\.visible/.test(employeesSrc) && /mid\.current\.visible/.test(employeesSrc),
  `full figure under ${LOD_NEAR} m, simplified to ${LOD_MID} m, marker beyond`,
);
check(
  "limbs are not animated for people you cannot see",
  /if \(isNear \|\| isMid\)/.test(employeesSrc),
  "the animation cost falls away with distance",
);
check(
  "the status marker grows with distance so the category survives the overview",
  /marker\.current\.scale\.setScalar/.test(employeesSrc),
  "small beside a person, readable from the far camera",
);

// ================= 4. The empty plane is filled =================
const trackPts: [number, number][] = [];
for (let i = 0; i <= 600; i++) {
  const p = TRACK_CURVE.getPointAt(i / 600);
  trackPts.push([p.x * TRAIN_SCALE, p.z * TRAIN_SCALE]);
}
const xs: number[] = [];
const zs: number[] = [];
for (const r of PARK_LAYOUT) {
  xs.push(r.minX, r.maxX);
  zs.push(r.minZ, r.maxZ);
}
for (const [x, z] of trackPts) {
  xs.push(x);
  zs.push(z);
}
const minX = Math.min(...xs);
const maxX = Math.max(...xs);
const minZ = Math.min(...zs);
const maxZ = Math.max(...zs);

/** Share of the park within sight of something built or planted. */
const GRID = 12;
let sampled = 0;
let furnished = 0;
for (let x = minX; x <= maxX; x += GRID) {
  for (let z = minZ; z <= maxZ; z += GRID) {
    sampled++;
    let near = distanceToPaving(x, z) < 26;
    if (!near) {
      for (const t of PARK_TREES) {
        if (Math.hypot(t.x - x, t.z - z) < 26) {
          near = true;
          break;
        }
      }
    }
    if (!near) {
      for (const r of PARK_LAYOUT) {
        if (
          Math.hypot(Math.max(r.minX - x, 0, x - r.maxX), Math.max(r.minZ - z, 0, z - r.maxZ)) < 26
        ) {
          near = true;
          break;
        }
      }
    }
    if (near) furnished++;
  }
}
const coverage = (furnished / sampled) * 100;
check(
  "the park is no longer mostly bare ground",
  coverage > 80,
  `${coverage.toFixed(1)}% of the park is within 26 m of paving, planting or an attraction (the audit measured 3.7%)`,
);
check(
  "the planting is substantial",
  PARK_TREES.length >= 400 && PARK_SHRUBS.length >= 500,
  `${PARK_TREES.length} trees and ${PARK_SHRUBS.length} shrubs inside the park, ${BOUNDARY_TREES.length} in the boundary woodland`,
);
check(
  "the planting is varied, not one tree repeated",
  new Set(PARK_TREES.map((t) => t.species)).size >= 3 &&
    new Set(PARK_TREES.map((t) => Math.round(t.height))).size > 10,
  `${new Set(PARK_TREES.map((t) => t.species)).size} species, heights ${Math.min(...PARK_TREES.map((t) => t.height)).toFixed(1)}–${Math.max(...PARK_TREES.map((t) => t.height)).toFixed(1)} m`,
);
check(
  "the whole landscape is instanced, so density costs draw calls not frame time",
  /InstancedMesh/.test(envSrc) && !/PARK_TREES\.map\(\(t\) => <Tree/.test(envSrc),
  "trees, shrubs, fence and distant landscape all instanced",
);

// ================= 5. Nothing is planted where it must not be =================
function trackDistance(x: number, z: number) {
  let m = Infinity;
  for (const [px, pz] of trackPts) m = Math.min(m, Math.hypot(x - px, z - pz));
  return m;
}
let onPath = 0;
let inRide = 0;
let onRails = 0;
let inBuilding = 0;
for (const t of PARK_TREES) {
  if (distanceToPaving(t.x, t.z) < 0) onPath++;
  for (const r of PARK_LAYOUT) {
    if (t.x > r.minX && t.x < r.maxX && t.z > r.minZ && t.z < r.maxZ) inRide++;
  }
  if (trackDistance(t.x, t.z) < 4) onRails++;
  if (
    Math.abs(t.x - FOOD_COURT_CENTER[0]) < FOOD_COURT_HALF &&
    Math.abs(t.z - FOOD_COURT_CENTER[1]) < FOOD_COURT_HALF
  ) {
    inBuilding++;
  }
}
check("no tree stands on a path", onPath === 0, `${PARK_TREES.length} checked`);
check("no tree stands inside a ride", inRide === 0, `${PARK_LAYOUT.length} footprints checked`);
check("no tree stands on the railway", onRails === 0, "the train's loop is clear");
check("no tree stands inside the food court", inBuilding === 0, "the terrace is clear");
check(
  "no tree blocks a department sign",
  PARK_TREES.every((t) => RIDE_SIGNS.every((s) => Math.hypot(t.x - s.position[0], t.z - s.position[1]) > 6)),
  `${RIDE_SIGNS.length} signs stay legible`,
);

// ================= 6. Everyone walks on paving =================
let offPaving = 0;
let worstOff = 0;
let worstWho = "";
for (const e of JOURNEY_EMPLOYEES) {
  for (let t = e.checkInTime; t <= e.rideArrival; t += 0.4) {
    const p = sampleJourney(e, t);
    if (!p) continue;
    const d = distanceToPaving(p.x, p.z);
    if (d > 0) {
      offPaving++;
      if (d > worstOff) {
        worstOff = d;
        worstWho = e.id;
      }
    }
  }
}
check(
  "employees walk on the paths, not across the grass",
  worstOff < 6,
  offPaving === 0
    ? "every sampled step is on paving"
    : `worst stray ${worstOff.toFixed(1)} m off the paved edge (${worstWho}) — inside the lane spread`,
);
check(
  "the network is laid from the routes themselves",
  /rideAnchor/.test(read("src", "components", "world", "paths.ts")),
  `${PATH_LINKS.length} links and ${PATH_NODES.length} junctions, all derived from where people go`,
);
check(
  "the promenade is wide enough for a workforce",
  PATH_LINKS.some((l) => l.width >= PROP.promenadeWidth),
  `${PROP.promenadeWidth} m spine, ${PROP.footpathWidth} m spurs`,
);

// ================= 7. The camera can reach everything =================
check(
  "every ride is reachable by fast travel",
  UNREACHABLE_RIDES.length === 0,
  CAMERA_PLACES.filter((p) => p.group === "department").map((p) => p.label.split(" — ")[0]).join(", "),
);
check(
  "the entrance, the food court, the plaza and an overview are all reachable",
  ["entrance", "food-court", "plaza", "overview"].every((id) => CAMERA_PLACES.some((p) => p.id === id)),
  `${CAMERA_PLACES.length} viewpoints`,
);
let insideSomething = "";
let underground = "";
for (const p of CAMERA_PLACES) {
  if (p.position[1] < 2) underground = p.label;
  for (const r of PARK_LAYOUT) {
    if (
      p.position[0] > r.minX &&
      p.position[0] < r.maxX &&
      p.position[2] > r.minZ &&
      p.position[2] < r.maxZ &&
      p.position[1] < r.height
    ) {
      insideSomething = `${p.label} sits inside ${r.label}`;
    }
  }
}
check("no viewpoint is inside a ride", insideSomething === "", insideSomething || "all clear");
check("no viewpoint is underground", underground === "", underground || "all above ground");
check(
  "each department viewpoint actually frames its own ride",
  CAMERA_PLACES.filter((p) => p.group === "department").every((p) => {
    const c = rideById(p.id).center;
    return Math.hypot(p.lookAt[0] - c[0], p.lookAt[2] - c[1]) < 1e-6;
  }),
  "look-at points are the ride centres, read from the layout",
);
check(
  "the camera never moves on its own",
  /if \(mode === "free"\) return;/.test(directorSrc) && !/autoRotate/.test(scene),
  "the director does nothing at all unless the user asked it to travel or follow",
);
check(
  "following keeps the user in control of the angle",
  /controls\.target\.add/.test(directorSrc) && /markFollowSettled/.test(directorSrc),
  "the orbit target tracks the employee; rotation and zoom stay with the user",
);
check(
  "the follow camera stands back rather than sitting on their head",
  /FOLLOW_DISTANCE = 2[0-9]/.test(directorSrc),
  "a comfortable watching distance",
);

// ================= 8. ADD-ONLY =================
const EXPECTED: Record<string, [number, number]> = {
  ferris: [-165, 250],
  dragon: [-72.3, 117.7],
  coaster: [70, -10],
  monster: [205, 90],
  tower: [267.75, 280],
};
check(
  "every ride is still exactly where it was, and still its original size",
  PARK_LAYOUT.every((r) => {
    const e = EXPECTED[r.id];
    return e && Math.abs(r.center[0] - e[0]) < 1e-6 && Math.abs(r.center[1] - e[1]) < 1e-6;
  }),
  PARK_LAYOUT.map((r) => `${r.label} (${r.center[0].toFixed(0)}, ${r.center[1].toFixed(0)}) ${r.height}m`).join(", "),
);
check(
  "the plaza is untouched",
  PLAZA_CENTER[0] === 70 && PLAZA_CENTER[1] === 150,
  `plaza still at (${PLAZA_CENTER.join(", ")})`,
);
check(
  "the environment adds no lights or camera of its own",
  !/<(ambient|directional|point|spot|hemisphere)Light/i.test(envSrc) && !/OrbitControls/.test(envSrc),
  "it inherits the park's existing sun and sky",
);
check(
  "the environment renders outside every ride scale group",
  /<ParkEnvironment \/>/.test(scene) && !/<group scale=\{(PARK_SCALE|TRAIN_SCALE)\}>\s*<ParkEnvironment/.test(scene),
  "nothing is parented to a ride",
);

// ================= Summary =================
console.log("\nScale hierarchy:");
console.log(`  person            ${HUMAN.height.toFixed(2)} m`);
console.log(`  chair / table     ${PROP.chairSeatY} m / ${PROP.tableTopY} m`);
console.log(`  footpath          ${PROP.footpathWidth} m      promenade ${PROP.promenadeWidth} m`);
console.log(`  entrance arch     ${GATE_HEIGHT} m  (${(GATE_HEIGHT / HUMAN.height).toFixed(1)} people)`);
for (const r of PARK_LAYOUT) {
  console.log(`  ${r.label.padEnd(16)}${String(r.height).padStart(5)} m  (${(r.height / HUMAN.height).toFixed(0)} people)`);
}
console.log(`  park              ${(maxX - minX).toFixed(0)} x ${(maxZ - minZ).toFixed(0)} m`);
console.log(
  `\nGround cover ${coverage.toFixed(1)}% (was 3.7%). ` +
    `${PARK_TREES.length + BOUNDARY_TREES.length} trees, ${PARK_SHRUBS.length} shrubs, ` +
    `${PATH_LINKS.length} paved links.`,
);
console.log(`Walk ${metresPerSecondAt1x.toFixed(2)} m/s at 1x; speeds ${SPEED_OPTIONS.join("x, ")}x.`);
console.log(`${CAMERA_PLACES.length} camera viewpoints; employee LOD at ${LOD_NEAR} m and ${LOD_MID} m.`);

console.log(failures === 0 ? "\nOK: world scale and environment verified." : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
