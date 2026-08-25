import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  MIN_SIGN_CLEARANCE,
  RIDE_SIGNS,
  SIGN_BOARD_BOTTOM,
  SIGN_HALF_WIDTH,
} from "../src/components/park/rideSigns";
import { RIDE_DEPARTMENTS } from "../src/components/park/departments";
import {
  MAIN_VIEWPOINT,
  PARK_CENTER,
  PARK_LAYOUT,
  PLAZA_CENTER,
  PLAZA_RADIUS,
  rideById,
  viewAngles,
} from "../src/components/park/layout";
import {
  JOURNEY_EMPLOYEES,
  LOOP_END,
  LOOP_START,
  sampleJourney,
} from "../src/simulation/journey/journey";
import {
  FOOD_COURT_CENTER,
  FOOD_COURT_HALF,
  GATE_X,
  GATE_Z,
  SIM_MINUTES_PER_SECOND,
} from "../src/simulation/journey/constants";
import {
  SPEED_OPTIONS,
  advanceJourneyClock,
  currentSimTime,
  seekJourneyClock,
  setJourneyPaused,
  setJourneySpeed,
} from "../src/simulation/journey/clock";
import {
  AVERAGE_DELAY,
  DELAY_BY_BAND,
  DELAY_BY_DEPARTMENT,
  MAX_GROUP_AVERAGE,
  WORST_DELAY,
} from "../src/simulation/journey/delayStats";
import { TRACK_CURVE } from "../src/components/park-train/trainTrack";
import { TRAIN_SCALE } from "../src/components/park/parkScale";
import { HUMAN } from "../src/world/scale";

let failures = 0;
function check(label: string, ok: boolean, detail: string) {
  if (!ok) failures++;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${label} — ${detail}`);
}

const root = join(__dirname, "..");
const read = (...p: string[]) => readFileSync(join(root, ...p), "utf8");
const scene = read("src", "components", "roller-coaster", "ParkScene.tsx");
const signSrc = read("src", "components", "park", "RideDepartmentSign.tsx");
const solverSrc = read("src", "components", "park", "rideSigns.ts");
const employeesSrc = read("src", "components", "park", "journey", "Employees.tsx");
const timelineSrc = read("src", "components", "hud", "TimelineControls.tsx");
const hudSrc = read("src", "components", "hud", "JourneyHud.tsx");
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

// =================== 1. One sign per department, wording from the mapping ===================
check(
  "every department has exactly one signboard",
  RIDE_SIGNS.length === RIDE_DEPARTMENTS.length &&
    new Set(RIDE_SIGNS.map((s) => s.rideId)).size === RIDE_DEPARTMENTS.length,
  `${RIDE_SIGNS.length} signs for ${RIDE_DEPARTMENTS.length} departments`,
);
check(
  "each sign names the department the ride actually maps to",
  RIDE_SIGNS.every((s) => {
    const d = RIDE_DEPARTMENTS.find((r) => r.rideId === s.rideId);
    return d?.department === s.department && d.rideName === s.rideName;
  }),
  RIDE_SIGNS.map((s) => `${s.department}/${s.rideName}`).join(", "),
);
check(
  "no department or ride name is retyped in the sign code",
  !/"(TECH|CYBER|FINANCE|DEVOPS|ERP)"/.test(code(signSrc + solverSrc)) &&
    !/"(Roller Coaster|Dragon Ride|Ferris Wheel|Drop Tower|Monster Ride)"/.test(
      code(signSrc + solverSrc),
    ),
  "wording is read from RIDE_DEPARTMENTS, so sign and panel cannot disagree",
);
check(
  "the sign text matches what the click-through panel would say",
  RIDE_SIGNS.every((s) => s.rideName === rideById(s.rideId).label),
  "ride names re-read from the park layout",
);

// =================== 2. Signs stand in genuinely free ground ===================
const trackPts: [number, number][] = [];
for (let i = 0; i <= 1500; i++) {
  const p = TRACK_CURVE.getPointAt(i / 1500);
  trackPts.push([p.x * TRAIN_SCALE, p.z * TRAIN_SCALE]);
}
const boxDist = (x: number, z: number, r: (typeof PARK_LAYOUT)[number]) =>
  Math.hypot(Math.max(r.minX - x, 0, x - r.maxX), Math.max(r.minZ - z, 0, z - r.maxZ));

let worstRide = Infinity;
let worstTrack = Infinity;
let worstPlaza = Infinity;
let worstStructure = Infinity;
let signOverlap = "";

for (const s of RIDE_SIGNS) {
  const [x, z] = s.position;
  for (const r of PARK_LAYOUT) {
    const d = boxDist(x, z, r);
    if (d <= 0) signOverlap = `${s.department} sign inside ${r.label}`;
    worstRide = Math.min(worstRide, d);
  }
  for (const [px, pz] of trackPts) worstTrack = Math.min(worstTrack, Math.hypot(x - px, z - pz));
  worstPlaza = Math.min(
    worstPlaza,
    Math.abs(Math.hypot(x - PLAZA_CENTER[0], z - PLAZA_CENTER[1]) - PLAZA_RADIUS),
  );
  worstStructure = Math.min(
    worstStructure,
    Math.hypot(
      Math.max(Math.abs(x - FOOD_COURT_CENTER[0]) - FOOD_COURT_HALF, 0),
      Math.max(Math.abs(z - FOOD_COURT_CENTER[1]) - FOOD_COURT_HALF, 0),
    ),
    Math.hypot(x - GATE_X, z - GATE_Z),
  );
}

check(
  "no sign stands inside a ride's footprint",
  signOverlap === "",
  signOverlap || `closest sign is ${worstRide.toFixed(1)}u from any ride`,
);
check(
  "every sign clears every ride by the declared margin",
  worstRide >= MIN_SIGN_CLEARANCE,
  `tightest ${worstRide.toFixed(1)}u vs minimum ${MIN_SIGN_CLEARANCE}u`,
);
check(
  "no sign stands on the railway",
  worstTrack >= MIN_SIGN_CLEARANCE,
  `tightest ${worstTrack.toFixed(1)}u to the rails`,
);
check(
  "no sign stands on the plaza",
  worstPlaza >= MIN_SIGN_CLEARANCE,
  `tightest ${worstPlaza.toFixed(1)}u to the plaza edge`,
);
check(
  "no sign fouls the food court or the gate",
  worstStructure >= MIN_SIGN_CLEARANCE,
  `tightest ${worstStructure.toFixed(1)}u`,
);
check(
  "each sign is nearer its own ride than any other, so the pairing is unambiguous",
  RIDE_SIGNS.every((s) => {
    const nearest = PARK_LAYOUT.reduce(
      (best, r) => {
        const d = boxDist(s.position[0], s.position[1], r);
        return d < best.d ? { id: r.id, d } : best;
      },
      { id: "", d: Infinity },
    );
    return nearest.id === s.rideId;
  }),
  RIDE_SIGNS.map(
    (s) =>
      `${s.department} ${Math.hypot(s.position[0] - rideById(s.rideId).center[0], s.position[1] - rideById(s.rideId).center[1]).toFixed(0)}u from its ride`,
  ).join(", "),
);

// =================== 3. Signs never hide a ride ===================
const angles = viewAngles(MAIN_VIEWPOINT, PARK_CENTER);
const ux = PARK_CENTER[0] - MAIN_VIEWPOINT[0];
const uz = PARK_CENTER[1] - MAIN_VIEWPOINT[1];
const ul = Math.hypot(ux, uz);
let hidden = "";
for (const s of RIDE_SIGNS) {
  const dx = s.position[0] - MAIN_VIEWPOINT[0];
  const dz = s.position[1] - MAIN_VIEWPOINT[1];
  const distance = Math.hypot(dx, dz);
  const bearing =
    (Math.atan2((ux / ul) * dz - (uz / ul) * dx, dx * (ux / ul) + dz * (uz / ul)) * 180) / Math.PI;
  const half = (Math.atan(SIGN_HALF_WIDTH / distance) * 180) / Math.PI;
  for (const a of angles) {
    if (a.id === s.rideId) continue;
    if (bearing + half > a.bearingDeg - a.halfWidthDeg && bearing - half < a.bearingDeg + a.halfWidthDeg) {
      hidden = `${s.department} sign covers ${a.label}`;
    }
  }
}
check(
  "no sign covers a ride other than its own, seen from the main gate",
  hidden === "",
  hidden || "all five signs sit clear of every other ride's silhouette",
);
check(
  "the boards hang above head height, so nobody walks into one",
  SIGN_BOARD_BOTTOM > HUMAN.height + 0.5,
  `board underside ${SIGN_BOARD_BOTTOM.toFixed(2)} m; a person is ${HUMAN.height} m tall`,
);

// =================== 4. Nobody walks through a sign ===================
let nearestApproach = Infinity;
let hitBy = "";
const POST_RADIUS = SIGN_HALF_WIDTH + 0.8;
for (const e of JOURNEY_EMPLOYEES) {
  for (let t = e.spawnTime; t <= e.workStart; t += 0.1) {
    const p = sampleJourney(e, t);
    if (!p) continue;
    for (const s of RIDE_SIGNS) {
      const d = Math.hypot(p.x - s.position[0], p.z - s.position[1]);
      if (d < nearestApproach) {
        nearestApproach = d;
        hitBy = `${e.id} passes ${d.toFixed(1)}u from the ${s.department} sign`;
      }
    }
  }
}
check(
  "no walking route passes through a signpost",
  nearestApproach > POST_RADIUS,
  hitBy,
);

// =================== 5. Playback: pause, speed, seek ===================
setJourneyPaused(false);
setJourneySpeed(1);
seekJourneyClock(LOOP_START);

setJourneyPaused(true);
const heldAt = currentSimTime();
for (let i = 0; i < 60; i++) advanceJourneyClock(1 / 60);
check(
  "pausing actually stops the clock",
  currentSimTime() === heldAt,
  `held at ${heldAt.toFixed(3)} through a simulated second of frames`,
);

setJourneyPaused(false);
seekJourneyClock(LOOP_START);
for (let i = 0; i < 120; i++) advanceJourneyClock(1 / 60);
const oneX = currentSimTime() - LOOP_START;

setJourneySpeed(2);
seekJourneyClock(LOOP_START);
for (let i = 0; i < 120; i++) advanceJourneyClock(1 / 60);
const twoX = currentSimTime() - LOOP_START;
check(
  "2x runs exactly twice as fast as 1x",
  Math.abs(twoX - oneX * 2) < 1e-9,
  `${oneX.toFixed(4)} min at 1x vs ${twoX.toFixed(4)} min at 2x`,
);
check(
  "1x matches the declared simulation rate",
  Math.abs(oneX - 2 * SIM_MINUTES_PER_SECOND) < 1e-9,
  `${oneX.toFixed(4)} simulated minutes in 2 seconds at ${SIM_MINUTES_PER_SECOND} min/s`,
);
check(
  "every offered speed is a real option",
  SPEED_OPTIONS.length >= 3 && SPEED_OPTIONS.includes(1),
  SPEED_OPTIONS.map((s) => `${s}x`).join(", "),
);
setJourneySpeed(1);

check(
  "seeking before the start clamps to the start",
  seekJourneyClock(LOOP_START - 500) === LOOP_START,
  `clamped to ${LOOP_START.toFixed(1)}`,
);
check(
  "seeking past the end clamps to the end",
  seekJourneyClock(LOOP_END + 500) === LOOP_END,
  `clamped to ${LOOP_END.toFixed(1)}`,
);

/*
 * The property that makes scrubbing trustworthy: arriving at an instant by
 * playing and arriving at it by seeking must place everybody identically.
 */
seekJourneyClock(LOOP_START);
for (let i = 0; i < 900; i++) advanceJourneyClock(1 / 60);
const played = currentSimTime();
const snapshot = JOURNEY_EMPLOYEES.map((e) => JSON.stringify(sampleJourney(e, played)));

seekJourneyClock(LOOP_END);
seekJourneyClock(LOOP_START);
seekJourneyClock(played);
const sought = JOURNEY_EMPLOYEES.map((e) => JSON.stringify(sampleJourney(e, currentSimTime())));

check(
  "seeking to a moment puts everyone exactly where playing to it would",
  currentSimTime() === played && snapshot.every((v, i) => v === sought[i]),
  `all ${JOURNEY_EMPLOYEES.length} figures identical at ${played.toFixed(2)} after seeking away and back`,
);
/*
 * Order-independence is the real test of purity: if anything in the position
 * path accumulated state, sampling times out of order would disagree with
 * sampling them in order, and scrubbing backwards would drift.
 */
const probeTimes: number[] = [];
for (let t = LOOP_START; t <= LOOP_END; t += 3.7) probeTimes.push(t);
const ascending = probeTimes.map((t) =>
  JOURNEY_EMPLOYEES.map((e) => JSON.stringify(sampleJourney(e, t))).join("|"),
);
const shuffled = [...probeTimes.keys()].sort((a, b) => ((a * 7919) % 101) - ((b * 7919) % 101));
let orderMismatch = 0;
for (const i of shuffled) {
  const again = JOURNEY_EMPLOYEES.map((e) => JSON.stringify(sampleJourney(e, probeTimes[i]))).join("|");
  if (again !== ascending[i]) orderMismatch++;
}
check(
  "the position path carries no accumulated state that scrubbing could break",
  orderMismatch === 0,
  `${probeTimes.length} instants sampled forwards then out of order, ${JOURNEY_EMPLOYEES.length} figures each — identical every time`,
);

check(
  "the timeline is DOM, not a 3D object",
  !/@react-three|drei|<mesh|<group/.test(timelineSrc),
  "no three.js import in the timeline controls",
);
check(
  "the scrubber is keyboard operable",
  /type="range"/.test(timelineSrc) && /aria-label="Simulated time"/.test(timelineSrc),
  "a native range input, so arrows, Home and End work",
);
check(
  "the timeline spans the whole simulated morning",
  /min=\{LOOP_START\}/.test(timelineSrc) && /max=\{LOOP_END\}/.test(timelineSrc),
  `${LOOP_START.toFixed(0)} to ${LOOP_END.toFixed(0)} minutes-of-day`,
);

// =================== 6. Work start reads differently from arrival ===================
check(
  "starting work is shown differently from merely arriving at the ride",
  /phase === "WORKING"/.test(employeesSrc) && /badge/.test(employeesSrc),
  "a marker appears at the moment work actually begins",
);
check(
  "employees turn to face their work area once work starts",
  /rideById\(employee\.rideId\)/.test(employeesSrc),
  "facing is taken from the ride they were assigned",
);
check(
  "every employee reaches the WORKING phase within the loop",
  JOURNEY_EMPLOYEES.every((e) => sampleJourney(e, e.workStart + 0.5)?.phase === "WORKING"),
  `all ${JOURNEY_EMPLOYEES.length} start work before the loop ends`,
);

// =================== 7. Delay analysis is real arithmetic ===================
function mean(list: typeof JOURNEY_EMPLOYEES) {
  return list.reduce((s, e) => s + e.delayMinutes, 0) / list.length;
}
check(
  "the headline average is the real average",
  Math.abs(AVERAGE_DELAY - mean(JOURNEY_EMPLOYEES)) < 1e-9,
  `${AVERAGE_DELAY.toFixed(2)} min across ${JOURNEY_EMPLOYEES.length} employees`,
);
check(
  "every check-in band's average re-derives independently",
  DELAY_BY_BAND.every((g) => {
    const list = JOURNEY_EMPLOYEES.filter((e) => e.color === g.key);
    return list.length === g.count && Math.abs(g.average - mean(list)) < 1e-9;
  }),
  DELAY_BY_BAND.map((g) => `${g.label} ${g.count}@${g.average.toFixed(1)}m`).join(", "),
);
check(
  "every department's average re-derives independently",
  DELAY_BY_DEPARTMENT.every((g) => {
    const list = JOURNEY_EMPLOYEES.filter((e) => e.department === g.key);
    return list.length === g.count && Math.abs(g.average - mean(list)) < 1e-9;
  }),
  DELAY_BY_DEPARTMENT.map((g) => `${g.label} ${g.average.toFixed(1)}m`).join(", "),
);
check(
  "the bands and departments between them account for everybody",
  DELAY_BY_BAND.reduce((s, g) => s + g.count, 0) === JOURNEY_EMPLOYEES.length &&
    DELAY_BY_DEPARTMENT.reduce((s, g) => s + g.count, 0) === JOURNEY_EMPLOYEES.length,
  "no employee is counted twice or dropped",
);
check(
  "the reported longest wait really is the longest",
  WORST_DELAY.delayMinutes === Math.max(...JOURNEY_EMPLOYEES.map((e) => e.delayMinutes)),
  `${WORST_DELAY.name} (${WORST_DELAY.id}) ${WORST_DELAY.delayMinutes.toFixed(1)} min`,
);
check(
  "the bars are drawn to one shared scale",
  MAX_GROUP_AVERAGE ===
    Math.max(...DELAY_BY_BAND.map((g) => g.average), ...DELAY_BY_DEPARTMENT.map((g) => g.average)),
  `longest bar ${MAX_GROUP_AVERAGE.toFixed(1)} min`,
);
check(
  "the HUD renders the shared stats rather than recomputing its own",
  /from "@\/simulation\/journey\/delayStats"/.test(hudSrc) &&
    !/reduce\(\(sum, e\)/.test(code(hudSrc)),
  "one source of truth for the delay figures",
);

// =================== 8. ADD-ONLY ===================
const EXPECTED_CENTRES: Record<string, [number, number]> = {
  ferris: [-165, 250],
  dragon: [-72.3, 117.7],
  coaster: [70, -10],
  monster: [205, 90],
  tower: [267.75, 280],
};
check(
  "every ride is still exactly where it was",
  PARK_LAYOUT.every((r) => {
    const e = EXPECTED_CENTRES[r.id];
    return e && Math.abs(r.center[0] - e[0]) < 1e-6 && Math.abs(r.center[1] - e[1]) < 1e-6;
  }),
  PARK_LAYOUT.map((r) => `${r.label} (${r.center[0].toFixed(0)}, ${r.center[1].toFixed(0)})`).join(", "),
);
check(
  "the signs render in world space, outside every ride scale group",
  /<RideDepartmentSigns \/>/.test(scene) &&
    !/<group scale=\{(PARK_SCALE|TRAIN_SCALE)\}>\s*<RideDepartmentSigns/.test(scene),
  "signs are not scaled or parented to a ride",
);
check(
  "the signs add no light, camera or controls of their own",
  !/[Ll]ight|OrbitControls|PerspectiveCamera/.test(signSrc),
  "they inherit the park's existing sun and sky",
);
check(
  "no ride module imports the signage or the timeline",
  ["roller-coaster", "ferris-wheel", "monster-ride", "park-train", "dragon-ride", "drop-tower"].every(
    (dir) => {
      const c = readFileSync(join(root, "src", "components", dir, "constants.ts"), "utf8");
      return !c.includes("rideSigns") && !c.includes("TimelineControls");
    },
  ),
  "rides cannot be gated by the legibility layer",
);
check(
  "pausing the timeline cannot pause a ride",
  ["ferris-wheel/FerrisWheel", "dragon-ride/DragonRide", "drop-tower/DropTower", "park-train/ParkTrain"].every(
    (f) => {
      const c = read("src", "components", ...`${f}.tsx`.split("/"));
      return /useFrame/.test(c) && !/journeyStore|journey\/clock/.test(c);
    },
  ),
  "no ride reads the journey clock or the journey store",
);
check(
  "sign placement is solved against the real park, not hand-typed",
  /PARK_LAYOUT/.test(solverSrc) &&
    /TRACK_CURVE/.test(solverSrc) &&
    /JOURNEY_EMPLOYEES/.test(solverSrc) &&
    !/position: \[\s*-?\d+(\.\d+)?\s*,/.test(code(solverSrc)),
  "footprints, rails and walking routes all read from the modules that own them",
);

// =================== Summary ===================
console.log("\nDepartment signage:");
for (const s of RIDE_SIGNS) {
  const r = rideById(s.rideId);
  console.log(
    `  ${s.department.padEnd(8)} ${s.rideName.padEnd(15)} at (${s.position[0].toFixed(0).padStart(5)}, ${s.position[1].toFixed(0).padStart(4)})  ` +
      `${Math.hypot(s.position[0] - r.center[0], s.position[1] - r.center[1]).toFixed(0).padStart(3)}u from its ride, ${s.clearance.toFixed(0)}u clear`,
  );
}
console.log("\nDelay, check-in to work start:");
for (const g of [...DELAY_BY_BAND, ...DELAY_BY_DEPARTMENT]) {
  const bar = "#".repeat(Math.round((g.average / MAX_GROUP_AVERAGE) * 24));
  console.log(`  ${g.label.padEnd(8)} ${bar.padEnd(24)} ${g.average.toFixed(1).padStart(5)} min  (n=${g.count})`);
}
console.log(`  worst: ${WORST_DELAY.name} ${WORST_DELAY.delayMinutes.toFixed(1)} min`);
console.log(
  `\nTimeline ${LOOP_START.toFixed(0)}–${LOOP_END.toFixed(0)} min-of-day, speeds ${SPEED_OPTIONS.join("x, ")}x; ` +
    `closest anyone walks to a signpost is ${nearestApproach.toFixed(1)}u.`,
);

console.log(failures === 0 ? "\nOK: park legibility verified." : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
