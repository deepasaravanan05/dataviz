import { readFileSync } from "node:fs";
import { PARK_ORIGIN, PARK_PAVED_EDGE } from "../src/components/park/parkRing";
import { join } from "node:path";
import { EMPLOYEE_HEIGHT, HUMAN, LOD_MID, LOD_NEAR, PROP, SIGN } from "../src/world/scale";
import { PARK_LAYOUT, PLAZA_CENTER, rideById } from "../src/components/park/layout";
import { UNIFORM_RIDE_HEIGHT } from "../src/components/park/uniformRideHeight";
import { CAMERA_PLACES, UNREACHABLE_RIDES } from "../src/components/world/cameraPlaces";
import {
  CHAIRS_TEAM_ID,
  OVERALL_REACH as CHAIRS_REACH,
} from "../src/components/flying-chairs/constants";
import {RIDE_CENTER as CHAIRS_CENTER} from "../src/components/flying-chairs/placement";
import {
  LOOPER_RIDE_ID,
  OVERALL_REACH as LOOPER_REACH,
} from "../src/components/super-looper/constants";
import {
  TEACUPS_RIDE_ID,
  OVERALL_REACH as TEACUPS_REACH,
} from "../src/components/tea-cups/constants";
import { RIDE_CENTER as TEACUPS_CENTER } from "../src/components/tea-cups/placement";
import { RIDE_CENTER as LOOPER_CENTER } from "../src/components/super-looper/placement";
import {
  DUMBO_RIDE_ID,
  OVERALL_REACH as DUMBO_REACH,
} from "../src/components/dumbo-ride/constants";
import { RIDE_CENTER as DUMBO_CENTER } from "../src/components/dumbo-ride/placement";
import {
  PATH_LINKS,
  PATH_NODES,
  PATH_RINGS,
  distanceToPaving,
} from "../src/components/world/paths";
import { BOUNDARY_TREES, PARK_SHRUBS, PARK_TREES } from "../src/components/world/planting";
import { RIDE_SIGNS } from "../src/components/park/rideSigns";
import { JOURNEY_EMPLOYEES, sampleJourney } from "../src/simulation/journey/journey";
import {
  FOOD_COURT_CENTER,
  FOOD_COURT_HALF,
  GATE_ARCH_Y,
  GATE_OPENING,
  GATE_PILLAR_HALF,
  GATE_PILLAR_HEIGHT,
  GATE_HEIGHT,
  LANE_COUNT,
  LANE_SPACING,
  SIM_MINUTES_PER_SECOND,
  WALK_UNITS_PER_MINUTE,
} from "../src/simulation/journey/constants";
import { SPEED_OPTIONS } from "../src/simulation/journey/clock";
import { OVERALL_REACH as UFO_REACH } from "../src/components/ufo-pendulum/constants";
import { RIDE_CENTER as UFO_CENTER } from "../src/components/ufo-pendulum/placement";

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
  // Read from the constant, not a literal: the soffit moved when the gate grew.
  "a person can walk under the entrance arch",
  GATE_ARCH_Y > HUMAN.height * 2,
  `arch soffit ${GATE_ARCH_Y} m over a ${HUMAN.height} m person`,
);
check(
  "the gate is impressive but not absurd",
  /* Measured against the figure the park actually DRAWS, not the anatomical
     one the rig is built at. The rule — an arch between six and twelve people
     tall, so the entrance reads as an entrance without dwarfing the rides
     behind it — is unchanged; the units it is expressed in are the ones a
     viewer sees. Against the 1.75 m rig this check silently let the gate fall
     to 5.1 drawn people, under its own floor. */
  /*
   * TWO QUESTIONS, because there are now two different "people" in this park.
   *
   * The gate is real-metre architecture, so whether it reads as a monumental
   * entrance is a question about a REAL person: between fifteen and forty of
   * them tall is a gateway rather than a door or a hangar.
   *
   * The drawn employees are no longer real people — they are a legibility
   * device, drawn at 6.9x life size so they can be seen from a viewpoint 915 m
   * back. Measuring the gate against THEM, as this check did while they were a
   * more modest 4 units, now asks the architecture to be seventy metres tall to
   * satisfy a figure that is deliberately oversized. What still matters about
   * the drawn figure is only that it passes UNDER the arch rather than over it,
   * so that is asked separately and as a floor.
   */
  GATE_HEIGHT / HUMAN.height > 15 &&
    GATE_HEIGHT / HUMAN.height < 40 &&
    GATE_HEIGHT / EMPLOYEE_HEIGHT > 3,
  `${GATE_HEIGHT} m tall = ${(GATE_HEIGHT / HUMAN.height).toFixed(0)} real people, and still ` +
    `${(GATE_HEIGHT / EMPLOYEE_HEIGHT).toFixed(1)} of the oversized drawn figures, ` +
    `against a ${PARK_LAYOUT.find((r) => r.id === "ufo")!.height.toFixed(0)} m UFO Pendulum behind it`,
);
check(
  "the gate opening is a gate, not a stadium",
  /*
   * MEASURED AGAINST A REAL PERSON, for exactly the reason the height check
   * immediately above already gives: the drawn employee is a legibility device
   * whose size is set by how far back the camera can get, so an opening judged
   * against it changes meaning every time the cast is resized — and it did,
   * reading 15.5 figures wide at a 4 m figure, 5.2 at 12 m and 18.2 at 3.4 m
   * without one brick of the gate ever moving.
   *
   * The architecture is real metres, so the question is a question about real
   * people: an opening between fifteen and sixty of them abreast is a gateway
   * rather than a doorway or a stadium mouth. What still matters about the
   * DRAWN figure is only that the cast walks through the opening rather than
   * into it, so that is asked separately and as a floor.
   */
  GATE_OPENING / HUMAN.height >= 15 &&
    GATE_OPENING / HUMAN.height <= 60 &&
    GATE_OPENING / EMPLOYEE_HEIGHT >= 4,
  `${GATE_OPENING} m of opening = ${(GATE_OPENING / HUMAN.height).toFixed(0)} real people abreast, ` +
    `and ${(GATE_OPENING / EMPLOYEE_HEIGHT).toFixed(1)} of the drawn figures (was 104 m, a stadium)`,
);
check(
  "every walking lane fits through the opening",
  ((LANE_COUNT - 1) / 2) * LANE_SPACING * 1.15 < GATE_OPENING / 2,
  `${LANE_COUNT} lanes at ${LANE_SPACING} m pitch inside a ${GATE_OPENING} m opening`,
);

/*
 * The illuminated archway.
 *
 * The arch used to carry the park's name around its crown on a dark plate. Both
 * came off, and the name has since come back as a board slung underneath the
 * arch instead — light ground, very dark letters. The band itself must be clear
 * of type either way, and must have survived both edits intact.
 * scripts/verify-entrance-signage.ts proves the board in detail; this asks the
 * geometric half.
 */
{
  const gate = readFileSync(join(root, "src", "components", "main-gate", "MainGate.tsx"), "utf8");
  const PILLAR_X = GATE_OPENING / 2 + GATE_PILLAR_HALF;
  /* Read from the gate, not restated. This was pinned at 7.4 — the rise of a
     gate two rebuilds ago — so every arch check below was quietly measuring a
     shape the park no longer draws. */
  const ARCH_RISE =
    PILLAR_X * Number(/const ARCH_RISE = PILLAR_X \* ([\d.]+)/.exec(gate)![1]);
  const BAND_DEPTH =
    PILLAR_X * Number(/const BAND_DEPTH = ARCH_A \* ([\d.]+)/.exec(gate)![1]);

  check(
    "the gate carries the park's name",
    /const SIGN_TEXT = "EMPLOYEE THEME PARK"/.test(gate) && /function NameBoard/.test(gate),
    "on a board slung under the arch — not curved around the band, and not on a dark plate",
  );
  check(
    "and the band itself survived the removal",
    /function ArchBand/.test(gate) &&
      /function SoffitCusps/.test(gate) &&
      BAND_DEPTH > 0 &&
      ARCH_RISE > 0,
    `${BAND_DEPTH.toFixed(1)} u deep, rising ${ARCH_RISE.toFixed(1)} m over a ` +
      `+-${PILLAR_X} u span, with its scalloped soffit intact`,
  );

  /*
   * The towers. Their height is SOLVED, not typed: the onion dome's radius is
   * read back out of whatever height is left once the drum and the finial have
   * taken theirs, so the tip of the finial lands on GATE_HEIGHT exactly. That
   * is the property worth pinning — a typed dome radius drifts past the
   * declared height the moment any other course changes, and then the number
   * the rest of the park reasons about is a fiction.
   */
  {
    const R = GATE_PILLAR_HALF;
    const SPRING = GATE_PILLAR_HEIGHT + R * 0.2;
    const FINIAL_H = R * 0.55;
    const STRETCH = 1.15;
    const DOME_R = (GATE_HEIGHT - SPRING - FINIAL_H) / (STRETCH * 1.4818);
    const tip = SPRING + DOME_R * STRETCH * 1.4818 + FINIAL_H;
    check(
      "the tower tops out at exactly the height the gate declares",
      Math.abs(tip - GATE_HEIGHT) < 1e-9,
      `drum to ${GATE_PILLAR_HEIGHT} m, dome springing at ${SPRING.toFixed(1)} m, ` +
        `finial tip ${tip.toFixed(2)} m against a declared ${GATE_HEIGHT} m`,
    );
    check(
      "the dome is a dome, and it stands inside its own gallery rail",
      DOME_R > R * 0.7 && DOME_R < R * 1.1 && DOME_R < R * 0.93 * 1.2,
      `${DOME_R.toFixed(1)} m radius on a ${R} m drum (${(DOME_R / R).toFixed(2)}x), ` +
        `inside the ${(R * 0.93 * 1.2).toFixed(1)} m balustrade ring`,
    );
    /* The arcade wings must not be built through the security kiosks. */
    const wingX0 = PILLAR_X + R * 1.05;
    const wingZ = -R * 0.75;
    const wingHalfZ = R * 0.7 * 0.65;
    const boothZ0 = 2.4 - 1.9;
    check(
      "the arcade wings clear the security booths and the towers",
      wingX0 >= PILLAR_X + R && wingZ + wingHalfZ < boothZ0,
      `wings start at ${wingX0.toFixed(1)} u, just outside the ${(PILLAR_X + R).toFixed(1)} u ` +
        `tower face, and stand back at z ${(wingZ + wingHalfZ).toFixed(1)} against booths from z ${boothZ0}`,
    );
  }

  check(
    "the arch springs from the towers and clears the walk-through",
    GATE_ARCH_Y > HUMAN.height * 4 && GATE_ARCH_Y + ARCH_RISE <= GATE_HEIGHT + 1,
    `springs at ${GATE_ARCH_Y} m, crown ${(GATE_ARCH_Y + ARCH_RISE).toFixed(1)} m, finials ${GATE_HEIGHT} m`,
  );
}

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
  /groundSpeed \/ WALK_CLIP_SPEED/.test(employeesSrc) && /moved \/ delta/.test(employeesSrc),
  "the walk clip is played at the rate that matches the distance actually walked",
);

// ================= 3. Distance-based detail =================
check(
  "employees drop to fewer parts with distance",
  LOD_NEAR > 0 &&
    LOD_MID > LOD_NEAR &&
    /holder\.current\.visible = embodied/.test(employeesSrc) &&
    /rig\.face\.visible = isNear/.test(employeesSrc),
  `face under ${LOD_NEAR} m, the full rig beyond it, held at a readable size all the way out`,
);
check(
  "the skeleton is not posed for people you cannot see",
  /if \(rig && embodied\)/.test(employeesSrc) && /rig\.mixer\.update\(delta\)/.test(employeesSrc),
  "the mixer only runs inside the embodied bands, so animation cost falls away with distance",
);
/*
 * This used to assert the floating status marker's distance ramp. The marker
 * has been removed — the category is worn now — and what grows with distance
 * instead is the FIGURE, so that a person, rather than a dot standing in for
 * one, is what survives the overview.
 */
check(
  "the figure itself grows with distance, so a person survives the overview",
  /figureScale\(d, fov, state\.size\.height\)/.test(employeesSrc) &&
    /holder\.current\.scale\.setScalar\(scale\)/.test(employeesSrc) &&
    !/marker\.current\.scale\.setScalar/.test(employeesSrc),
  "the rigged body is held at a readable pixel height at every distance; the dot that used to stand in for it is gone",
);


// ================= 4. The empty plane is filled =================
const xs: number[] = [];
const zs: number[] = [];
for (const r of PARK_LAYOUT) {
  xs.push(r.minX, r.maxX);
  zs.push(r.minZ, r.maxZ);
}
/* The railway used to bound this; it is gone, so the park's own paved extent
   does instead. */
for (let i = 0; i < 64; i++) {
  const a = (i / 64) * Math.PI * 2;
  xs.push(PARK_ORIGIN[0] + Math.cos(a) * PARK_PAVED_EDGE);
  zs.push(PARK_ORIGIN[1] + Math.sin(a) * PARK_PAVED_EDGE);
}
const minX = Math.min(...xs);
const maxX = Math.max(...xs);
const minZ = Math.min(...zs);
const maxZ = Math.max(...zs);

/** Share of the park within sight of something built or planted. */
const GRID = 12;
/** The attractions the layout solver does not place, and how far they reach. */
/*
 * Ground that an ATTRACTION stands on is furnished ground — that is what this
 * list is for. It had fallen behind the park: the Super Looper and the Tea Cups
 * were both added after it was written, and both keep planting off a wide
 * circle of ground that then counted as bare. Listing them is the fix; moving
 * the threshold to accommodate a stale list would not be one. The Dumbo Ride
 * joins them for the same reason.
 */
const ATTRACTIONS: [readonly [number, number], number][] = [
  [CHAIRS_CENTER, CHAIRS_REACH],
  [UFO_CENTER, UFO_REACH],
  [LOOPER_CENTER, LOOPER_REACH],
  [TEACUPS_CENTER, TEACUPS_REACH],
  [DUMBO_CENTER, DUMBO_REACH],
];

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
    /*
     * PARK_LAYOUT is the five rides the SOLVER places, and this check has
     * always used it as its list of attractions. Two more have been added
     * since — the Flying Chairs and the UFO Pendulum — and neither is in the
     * solver, on purpose, because a sixth box would re-solve the whole park.
     * So they have to be named here, or ground standing under a hundred-metre
     * pendulum counts as bare.
     */
    if (!near) {
      for (const [center, reach] of ATTRACTIONS) {
        if (Math.hypot(center[0] - x, center[1] - z) < reach + 26) {
          near = true;
          break;
        }
      }
    }
    if (near) furnished++;
  }
}
const coverage = (furnished / sampled) * 100;
/*
 * Down from 80%, because the park was deliberately thinned.
 *
 * The interior planting went from 1500 trees to 600 at the user's request: at
 * fifteen hundred the park was a woodland with rides in it. Coverage fell from
 * 86% to 74% with them, which is the point of the change rather than a
 * regression — "mostly bare ground" is the failure this check is named for, and
 * that means under half. 74% is still a furnished park, and the audit that
 * prompted this check measured 3.7%.
 */
check(
  "the park is no longer mostly bare ground",
  coverage > 70,
  `${coverage.toFixed(1)}% of the park is within 26 m of paving, planting or an attraction ` +
    `(the audit measured 3.7%; it was 86% at 1500 trees)`,
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
let onPath = 0;
let inRide = 0;
let inBuilding = 0;

for (const t of PARK_TREES) {
  if (distanceToPaving(t.x, t.z) < 0) onPath++;
  for (const r of PARK_LAYOUT) {
    if (t.x > r.minX && t.x < r.maxX && t.z > r.minZ && t.z < r.maxZ) inRide++;
  }
  if (
    Math.abs(t.x - FOOD_COURT_CENTER[0]) < FOOD_COURT_HALF &&
    Math.abs(t.z - FOOD_COURT_CENTER[1]) < FOOD_COURT_HALF
  ) {
    inBuilding++;
  }
}
check("no tree stands on a path", onPath === 0, `${PARK_TREES.length} checked`);
check("no tree stands inside a ride", inRide === 0, `${PARK_LAYOUT.length} footprints checked`);
/* "No tree stands on the railway" used to be checked here; the railway is gone. */
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
/*
 * THE NETWORK IS DERIVED, and what it is derived FROM has changed.
 *
 * It used to be laid along the employees' own routes: the file read
 * `rideAnchor` and put paving under wherever the crowd happened to walk. That
 * was the right rule for a park whose paths existed to serve the simulation.
 *
 * The plan now runs the other way round. The paths are the MASTER PLAN — a
 * circular path round the food court, one equal radial per ride, an outer path
 * joining the platforms — and the employees walk on them. So `paths.ts` reads
 * the structure module instead, and what is worth asserting is that it still
 * derives its geometry rather than typing it: every circle, radial and
 * platform in the network comes from `parkRing.ts`.
 */
check(
  "the network is laid from the park's own plan",
  /from "@\/components\/park\/parkRing"/.test(read("src", "components", "world", "paths.ts")) &&
    !/\[\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*\]\s*,\s*\[/.test(
      read("src", "components", "world", "paths.ts").replace(/\/\*[\s\S]*?\*\//g, ""),
    ),
  `${PATH_LINKS.length} links, ${PATH_NODES.length} junctions and ${PATH_RINGS.length} circles, ` +
    `all solved from the plan`,
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
/* The Central plaza chip was removed from the nav by request; the plaza itself
   is untouched and still sits on the Ground level and Mid park sightlines. */
check(
  "the entrance, the food court and an overview are all reachable",
  ["entrance", "food-court", "overview"].every((id) => CAMERA_PLACES.some((p) => p.id === id)),
  `${CAMERA_PLACES.length} viewpoints`,
);
check(
  "the Central plaza viewpoint is gone from fast travel",
  !CAMERA_PLACES.some((p) => p.id === "plaza"),
  "removed from the top navigation",
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
/*
 * The chips that carry a TEAM name rather than a department own their own
 * subject. The Park Train used to be one of them — its subject was the rail
 * loop's centre, because it had no layout footprint — and it has been removed
 * from the park along with its track and its route.
 */
check(
  "each department viewpoint actually frames its own ride",
  CAMERA_PLACES.filter((p) => p.group === "department").every((p) => {
    /* The chips that carry a TEAM name rather than a department own their own
       subject: the Flying Chairs', the Super Looper's, the Tea Cups' and the
       Dumbo Ride's are their own solved positions. None of them has a layout
       footprint to read — they are not rides the solver places. */
    const c =
      p.id === CHAIRS_TEAM_ID
          ? CHAIRS_CENTER
          : p.id === LOOPER_RIDE_ID
            ? LOOPER_CENTER
            : p.id === TEACUPS_RIDE_ID
              ? TEACUPS_CENTER
              : p.id === DUMBO_RIDE_ID
                ? DUMBO_CENTER
                : rideById(p.id).center;
    return Math.hypot(p.lookAt[0] - c[0], p.lookAt[2] - c[1]) < 1e-6;
  }),
  "look-at points are the ride centres, read from the modules that own them",
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
 *     intersect, so it pushed the pair apart symmetrically.
 */
/*
 * WHAT THIS CHECK GUARDS NOW.
 *
 * It held five frozen coordinates for as long as the standing instruction was
 * that no ride ever moves. The instruction has been superseded: every ride is
 * to be the same size, the footprints grew with the heights, and the layout
 * solver re-placed all five to fit them and to keep their silhouettes apart.
 * Freezing the old coordinates would only be asserting that the change the
 * user asked for did not happen.
 *
 * So what is asserted is the property those coordinates existed to protect —
 * every ride is one uniform size, and no two of them overlap on the ground —
 * and the positions are printed so a change to them shows up in the log.
 */
check(
  "every ride is the park's one size, and no two overlap",
  PARK_LAYOUT.every((r) => Math.abs(r.height - UNIFORM_RIDE_HEIGHT) < 0.01) &&
    PARK_LAYOUT.every((a) =>
      PARK_LAYOUT.every(
        (b) => a === b || a.maxX < b.minX || b.maxX < a.minX || a.maxZ < b.minZ || b.maxZ < a.minZ,
      ),
    ),
  PARK_LAYOUT.map((r) => `${r.label} (${r.center[0].toFixed(0)}, ${r.center[1].toFixed(0)}) ${r.height.toFixed(0)}m`).join(", "),
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
  /<ParkEnvironment \/>/.test(scene) && !/<group scale=\{PARK_SCALE\}>\s*<ParkEnvironment/.test(scene),
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
