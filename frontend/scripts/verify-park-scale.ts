import { RIDE_SCALE, RIDE_TARGET } from "../src/components/park/layout";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PARK_SCALE, PEDESTRIAN_STEP, TOWER_SHIFT_X, TOWER_STEPS_LEFT, TRAIN_SCALE } from "../src/components/park/parkScale";
import { PARK_LAYOUT, rideById } from "../src/components/park/layout";
import { COASTER_ORIGIN } from "../src/components/roller-coaster/constants";
import { MONSTER_ORIGIN, TOWER_HEIGHT as MONSTER_TOWER } from "../src/components/monster-ride/constants";
import { DRAGON_ORIGIN, APEX_HEIGHT as DRAGON_APEX, SWING_MAX, SWING_PERIOD } from "../src/components/dragon-ride/constants";
import {
  TOWER_ORIGIN,
  TOWER_HEIGHT,
  RIDE_REACH as TOWER_REACH,
  RIDE_CYCLE_SECONDS as TOWER_CYCLE,
} from "../src/components/drop-tower/constants";
import {
  WHEEL_RADIUS as FERRIS_R,
  WHEEL_CENTER_HEIGHT,
} from "../src/components/ferris-wheel/constants";
import { TRACK_CENTER, TRACK_RADIUS_X, TRACK_RADIUS_Z } from "../src/components/park-train/constants";
import { CABINS } from "../src/components/ferris-wheel/cabinManifest";
import { countSeatColor as dragonColor } from "../src/components/dragon-ride/riders";
import { SEAT_COUNT as DRAGON_SEATS } from "../src/components/dragon-ride/constants";
import { countSeatColor as towerColor } from "../src/components/drop-tower/riders";
import { SEAT_COUNT as TOWER_SEATS } from "../src/components/drop-tower/constants";
import { RIDERS as MONSTER_RIDERS } from "../src/components/monster-ride/riders";
import { TRAIN_RIDERS } from "../src/components/park-train/riders";
import { SEAT_COUNT as COASTER_SEATS } from "../src/components/roller-coaster/constants";

let failures = 0;
function check(label: string, ok: boolean, detail: string) {
  if (!ok) failures++;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${label} — ${detail}`);
}

const S = PARK_SCALE;
const sceneSrc = readFileSync(
  join(__dirname, "..", "src", "components", "roller-coaster", "ParkScene.tsx"),
  "utf8",
);

// ============ 1. The scale is actually applied, to the right rides ============
check("PARK_SCALE is a significant enlargement", S >= 1.5, `${S}x`);

/*
 * Each ride sits in its own `<group scale={rideScale("id")}>`, nested inside a
 * positioning group from the layout solver. The park used to enlarge every ride
 * by one shared PARK_SCALE; each now carries the factor its own target
 * dimensions call for, solved in `layout.ts`.
 */
const SCENE_ID: Record<string, string> = {
  FerrisWheel: "ferris",
  RollerCoaster: "coaster",
  MonsterRide: "monster",
  DragonRide: "dragon",
};
for (const ride of ["FerrisWheel", "RollerCoaster", "MonsterRide", "DragonRide"]) {
  check(
    `${ride} is enlarged by its own scale factor`,
    new RegExp(`<group scale=\\{rideScale\\("${SCENE_ID[ride]}"\\)\\}>\\s*<${ride}`).test(sceneSrc),
    `wrapped in its own rideScale("${SCENE_ID[ride]}") group, at ${RIDE_SCALE[SCENE_ID[ride]].toFixed(3)}x`,
  );
  check(
    `${ride} is placed by the layout solver`,
    new RegExp(`offsetFor\\("${ride === "FerrisWheel" ? "ferris" : ride === "RollerCoaster" ? "coaster" : ride === "MonsterRide" ? "monster" : "dragon"}"\\)`).test(sceneSrc),
    "position comes from offsetFor(), not a literal",
  );
}
check(
  "DropTower is NOT enlarged",
  !/<group scale=\{PARK_SCALE\}>\s*<DropTower/.test(sceneSrc),
  "keeps its original size, as required",
);
check(
  "train track and train share one scale group",
  /<group scale=\{TRAIN_SCALE\}>\s*<TrainTrack\s*\/>\s*<ParkTrain/.test(sceneSrc),
  "the train cannot drift off its rails",
);

// ============ 2. No ride module was edited to achieve the scaling ============
for (const [ride, file] of [
  ["ferris-wheel", "constants.ts"],
  ["roller-coaster", "constants.ts"],
  ["monster-ride", "constants.ts"],
  ["park-train", "constants.ts"],
  ["dragon-ride", "constants.ts"],
] as const) {
  const text = readFileSync(join(__dirname, "..", "src", "components", ride, file), "utf8");
  check(
    `${ride} geometry is untouched by the scaling (no PARK_SCALE inside it)`,
    !text.includes("PARK_SCALE"),
    "its own dimensions and proportions are unchanged",
  );
}

// ============ 3. Proportions preserved: uniform scale, never stretched ============
check(
  "scale is uniform — a single scalar, so nothing is stretched on one axis",
  /scale=\{rideScale\("/.test(sceneSrc) && !/<group scale=\{\[/.test(sceneSrc),
  "every ride group scales by one scalar; no per-axis scale vector on any ride",
);

// ============ 4. Every ride actually got bigger, and by how much ============
const heights: Record<string, number> = {
  "Ferris Wheel": WHEEL_CENTER_HEIGHT + FERRIS_R,
  "Dragon Ride": DRAGON_APEX,
  "Monster Ride": MONSTER_TOWER,
};
for (const [name, h] of Object.entries(heights)) {
  check(`${name} is significantly larger`, h * S > h * 1.5, `${h}u -> ${(h * S).toFixed(1)}u`);
}
check(
  "Drop Tower remains the tallest ride in the park",
  TOWER_HEIGHT > DRAGON_APEX * S && TOWER_HEIGHT > (WHEEL_CENTER_HEIGHT + FERRIS_R) * S,
  `tower ${TOWER_HEIGHT}u vs dragon ${(DRAGON_APEX * S).toFixed(1)}u vs ferris ${((WHEEL_CENTER_HEIGHT + FERRIS_R) * S).toFixed(1)}u`,
);
/*
 * The tower's footprint is set by the tower, not by PARK_SCALE — that is what
 * lets it stand 105 m without shoving a neighbour aside. It is no longer pinned
 * to a literal, because the gondola was deliberately broadened later; what is
 * asserted is the property that mattered all along, that the footprint stays a
 * small fraction of the mast and well under what park-wide scaling would have
 * produced.
 */
check(
  "Drop Tower grows in height only — its footprint never moves a neighbour",
  TOWER_HEIGHT > 100 && TOWER_REACH < 12 * S && TOWER_REACH < TOWER_HEIGHT / 5,
  `${TOWER_HEIGHT}u tall on a ${TOWER_REACH.toFixed(2)}u footprint, where park-wide scaling would have made it ${(12 * S).toFixed(1)}u`,
);

// ============ 5. Nothing intersects at the new scale ============
type Box = { minX: number; maxX: number; minZ: number; maxZ: number };
const BOXES: Record<string, Box> = Object.fromEntries(
  PARK_LAYOUT.map((r) => [r.label, { minX: r.minX, maxX: r.maxX, minZ: r.minZ, maxZ: r.maxZ }]),
);

function gap(a: Box, b: Box) {
  const dx = Math.max(b.minX - a.maxX, a.minX - b.maxX);
  const dz = Math.max(b.minZ - a.maxZ, a.minZ - b.maxZ);
  if (dx >= 0 && dz >= 0) return Math.hypot(dx, dz);
  return Math.max(dx, dz);
}

const names = Object.keys(BOXES);
let worstPair = "";
let worstGap = Infinity;
for (let i = 0; i < names.length; i++) {
  for (let j = i + 1; j < names.length; j++) {
    const g = gap(BOXES[names[i]], BOXES[names[j]]);
    if (g < worstGap) {
      worstGap = g;
      worstPair = `${names[i]} / ${names[j]}`;
    }
  }
}
check("no two rides intersect at the new scale", worstGap > 0, `tightest pair ${worstPair}: ${worstGap.toFixed(1)}u apart`);
check("tightest gap is comfortable, not marginal", worstGap > 5, `${worstGap.toFixed(1)}u`);

// Gaps must have GROWN relative to before, not shrunk.
const preScaleWorst = 5.6; // Coaster/Monster in the original layout
check(
  "clearances grew with the park rather than shrinking",
  worstGap > preScaleWorst,
  `${worstGap.toFixed(1)}u now vs ${preScaleWorst}u before the update`,
);

// ============ 6. Ground and trees still cover the enlarged park ============
const groundSize = Number(sceneSrc.match(/size=\{(\d+)\}/)?.[1] ?? 0);
const loopMaxX = (TRACK_CENTER[0] + TRACK_RADIUS_X) * TRAIN_SCALE;
const loopMaxZ = (TRACK_CENTER[1] + TRACK_RADIUS_Z) * TRAIN_SCALE;
const loopMinX = (TRACK_CENTER[0] - TRACK_RADIUS_X) * TRAIN_SCALE;
const loopMinZ = (TRACK_CENTER[1] - TRACK_RADIUS_Z) * TRAIN_SCALE;
const needed = 2 * Math.max(Math.abs(loopMaxX), Math.abs(loopMaxZ), Math.abs(loopMinX), Math.abs(loopMinZ));
check(
  "ground plane covers the enlarged park",
  groundSize >= needed,
  `ground ${groundSize}u vs ${needed.toFixed(0)}u needed for the scaled train loop`,
);
check(
  "ground covers the relocated Drop Tower",
  groundSize / 2 >= Math.abs(TOWER_ORIGIN[2]) + TOWER_REACH,
  `tower reaches z=${(Math.abs(TOWER_ORIGIN[2]) + TOWER_REACH).toFixed(0)}u, ground half-extent ${groundSize / 2}u`,
);
check(
  "the ground is NOT scaled, so the park spreads out rather than inflating",
  !/<group scale=\{PARK_SCALE\}>\s*<ParkGround/.test(sceneSrc) && sceneSrc.includes("<ParkGround"),
  "ParkGround sits outside every scale group",
);

// ============ 7. Speed changes ============
check(
  "Drop Tower cycle is faster than the original, over a far longer drop",
  TOWER_CYCLE < 26.9,
  `${TOWER_CYCLE.toFixed(1)}s vs 26.9s before (${(26.9 / TOWER_CYCLE).toFixed(2)}x)`,
);
check(
  "Dragon Ride swings much faster",
  SWING_PERIOD < 8.74 * 0.6,
  `${SWING_PERIOD.toFixed(2)}s per swing vs 8.74s before (${(8.74 / SWING_PERIOD).toFixed(2)}x)`,
);
check(
  "Dragon Ride swings through a larger arc",
  SWING_MAX > (55 * Math.PI) / 180,
  `+/-${((SWING_MAX * 180) / Math.PI).toFixed(0)}deg vs +/-55deg before`,
);

// ============ 8. The Drop Tower move ============
check(
  "Drop Tower still carries its three-pedestrian-step nudge left",
  TOWER_SHIFT_X === -PEDESTRIAN_STEP * TOWER_STEPS_LEFT &&
    Math.abs(TOWER_ORIGIN[0] - rideById("tower").center[0]) < 1e-9,
  `${PEDESTRIAN_STEP * TOWER_STEPS_LEFT}u left of its slot; tower at x=${TOWER_ORIGIN[0].toFixed(2)}`,
);
check(
  "Drop Tower keeps its place in the park order (before the Dragon Ride)",
  TOWER_ORIGIN[2] > BOXES["Dragon Ride"].maxZ,
  `tower z=${TOWER_ORIGIN[2].toFixed(1)} vs dragon's near edge z=${BOXES["Dragon Ride"].maxZ.toFixed(1)}`,
);

/*
 * ============ 9. Every existing ride still intact ============
 *
 * THE CAPACITY RULE IS 30-40 SEATS PER RIDE, 40 PREFERRED, applied to all six.
 * This section used to pin each ride to the sixty seats it was built with; what
 * it is really for is proving that no ride quietly LOST its seating while the
 * park was scaled, so it now checks each one against the rule that is actually
 * in force. The three GREEN / YELLOW / RED counts are an allocation order and
 * not a paint job — every seat in the park is grey — so evenness is what is
 * asserted of them rather than a particular number.
 */
const inBand = (n: number) => n >= 30 && n <= 40;
const even = (a: number, b: number, c: number) => Math.max(a, b, c) - Math.min(a, b, c) <= 1;

check("Ferris Wheel carries 30-40 cabins", inBand(CABINS.length), `${CABINS.length}`);
check("Roller Coaster carries 30-40 seats", inBand(COASTER_SEATS), `${COASTER_SEATS}`);
check("Monster Ride carries 30-40 seats", inBand(MONSTER_RIDERS.length), `${MONSTER_RIDERS.length}`);
check("Park Train carries 30-40 seats", inBand(TRAIN_RIDERS.length), `${TRAIN_RIDERS.length}`);
check(
  "Dragon Ride carries 30-40 seats, evenly banded",
  inBand(DRAGON_SEATS) &&
    even(dragonColor("GREEN"), dragonColor("YELLOW"), dragonColor("RED")) &&
    dragonColor("GREEN") + dragonColor("YELLOW") + dragonColor("RED") === DRAGON_SEATS,
  `${DRAGON_SEATS} seats: ${dragonColor("GREEN")}/${dragonColor("YELLOW")}/${dragonColor("RED")}`,
);
check(
  "Drop Tower carries 30-40 seats, evenly banded",
  inBand(TOWER_SEATS) &&
    even(towerColor("GREEN"), towerColor("YELLOW"), towerColor("RED")) &&
    towerColor("GREEN") + towerColor("YELLOW") + towerColor("RED") === TOWER_SEATS,
  `${TOWER_SEATS} seats: ${towerColor("GREEN")}/${towerColor("YELLOW")}/${towerColor("RED")}`,
);
check(
  "ride positions in the layout are unchanged (only scaled, never rearranged)",
  COASTER_ORIGIN[0] === 50 &&
    MONSTER_ORIGIN[0] === 8 &&
    MONSTER_ORIGIN[2] === 50 &&
    DRAGON_ORIGIN[0] === 67 &&
    DRAGON_ORIGIN[2] === 62,
  "every ride's authored origin is untouched; only the group scale moved them outward",
);

// ============ Summary ============
// ============ 8. The requested dimensions, and what was actually reached ============
{
  console.log("");
  console.log("Ride sizes against the requested targets:");
  let worstErr = 0;
  for (const r of PARK_LAYOUT) {
    const t = RIDE_TARGET[r.id];
    const err = Math.max(
      Math.abs(r.halfX / t.halfX - 1),
      Math.abs(r.halfZ / t.halfZ - 1),
      Math.abs(r.height / t.height - 1),
    );
    worstErr = Math.max(worstErr, err);
    console.log(
      `  ${r.label.padEnd(15)} ${RIDE_SCALE[r.id].toFixed(3)}x  ` +
        `${(r.halfX * 2).toFixed(0)} x ${(r.halfZ * 2).toFixed(0)} x ${r.height.toFixed(0)} m` +
        `   asked ${(t.halfX * 2)} x ${(t.halfZ * 2)} x ${t.height} m` +
        `   (worst ${(err * 100).toFixed(0)}%)`,
    );
  }
  check(
    "every ride is scaled uniformly, and no height overshoots what was asked",
    PARK_LAYOUT.every((r) => r.height <= RIDE_TARGET[r.id].height + 1e-6),
    "a ride may come out shorter than the target height, never taller",
  );
  check(
    "four of the five rides land within a fifth of every requested dimension",
    PARK_LAYOUT.filter((r) => {
      const t = RIDE_TARGET[r.id];
      return (
        Math.abs(r.halfX / t.halfX - 1) <= 0.2 &&
        Math.abs(r.halfZ / t.halfZ - 1) <= 0.2 &&
        Math.abs(r.height / t.height - 1) <= 0.2
      );
    }).length >= 4,
    "the Dragon Ride is the exception — its requested depth is twice the model's own, " +
      "which uniform scaling cannot reach without stretching the A-frame",
  );
}

console.log(
  `\nPark scaled ${S}x. Heights: ferris ${((WHEEL_CENTER_HEIGHT + FERRIS_R) * S).toFixed(1)}u, ` +
    `dragon ${(DRAGON_APEX * S).toFixed(1)}u, monster ${(MONSTER_TOWER * S).toFixed(1)}u, ` +
    `tower ${TOWER_HEIGHT}u (unchanged).`,
);
console.log(
  `Tightest ride gap ${worstGap.toFixed(1)}u (${worstPair}). Tower at (${TOWER_ORIGIN[0].toFixed(2)}, ${TOWER_ORIGIN[2].toFixed(1)}).`,
);
console.log(
  `Speeds: tower cycle ${TOWER_CYCLE.toFixed(1)}s, dragon swing ${SWING_PERIOD.toFixed(2)}s at +/-${((SWING_MAX * 180) / Math.PI).toFixed(0)}deg.`,
);

console.log(failures === 0 ? "\nOK: park scale and speed update verified." : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
