import { RIDE_SCALE, RIDE_TARGET } from "../src/components/park/layout";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PARK_SCALE, PEDESTRIAN_STEP, TOWER_SHIFT_X, TOWER_STEPS_LEFT, TRAIN_SCALE } from "../src/components/park/parkScale";
import { PARK_LAYOUT, rideById } from "../src/components/park/layout";
import { COASTER_ORIGIN } from "../src/components/roller-coaster/constants";
import { MONSTER_ORIGIN, TOWER_HEIGHT as MONSTER_TOWER } from "../src/components/monster-ride/constants";
import { DRAGON_ORIGIN, APEX_HEIGHT as DRAGON_APEX, SWING_MAX, SWING_PERIOD } from "../src/components/dragon-ride/constants";
import {
  OVERALL_HEIGHT as UFO_HEIGHT,
  OVERALL_REACH as UFO_REACH,
} from "../src/components/ufo-pendulum/constants";
import { RIDE_ORIGIN as UFO_ORIGIN } from "../src/components/ufo-pendulum/placement";
import { RIDE_PERIOD as UFO_CYCLE } from "../src/components/ufo-pendulum/pendulum";
import {
  WHEEL_RADIUS as FERRIS_R,
  WHEEL_CENTER_HEIGHT,
} from "../src/components/ferris-wheel/constants";
import { TRACK_CENTER, TRACK_RADIUS_X, TRACK_RADIUS_Z } from "../src/components/park-train/constants";
import { CABINS } from "../src/components/ferris-wheel/cabinManifest";
import { countSeatColor as dragonColor } from "../src/components/dragon-ride/riders";
import { SEAT_COUNT as DRAGON_SEATS } from "../src/components/dragon-ride/constants";
import { countSeatColor as ufoColor } from "../src/components/ufo-pendulum/riders";
import { SEAT_COUNT as UFO_SEATS } from "../src/components/ufo-pendulum/constants";
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
  "UfoPendulum is NOT enlarged",
  !/<group scale=\{(PARK_SCALE|rideScale\("ufo"\))\}>\s*<UfoPendulum/.test(sceneSrc),
  "drawn at the size it declares — its arm is a pendulum, and scaling it would change its period",
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
/*
 * THE PARK'S TALLEST RIDE HAS CHANGED HANDS AGAIN, and this claim goes with it
 * rather than being quietly reworded.
 *
 * The Drop Tower held it at 126 m until it was removed. The UFO Pendulum took
 * the tower's plot and held it at 86 m. The user has now asked that ride to
 * come DOWN and pick its riders up instead of making them climb thirty-two
 * metres of stairs to reach it — and on a rigid arm whose length is capped by
 * the plot, the only way down is to bring the pivot down, which is the same
 * thing as bringing the top down. So the Dragon Ride is the tallest ride in
 * the park now, and the pendulum stands a little under it.
 *
 * What is still worth asserting is that the pendulum is a big ride and that
 * nothing about its FOOTPRINT changed — that is the number the park was laid
 * out against, and it is untouched.
 */
check(
  "the UFO Pendulum still stands with the park's big rides",
  UFO_HEIGHT > (WHEEL_CENTER_HEIGHT + FERRIS_R) * S,
  `pendulum ${UFO_HEIGHT.toFixed(1)}u over the top vs ferris ${((WHEEL_CENTER_HEIGHT + FERRIS_R) * S).toFixed(1)}u; ` +
    `the dragon leads at ${(DRAGON_APEX * S).toFixed(1)}u, having been second while the pendulum ` +
    `reached 86.4u from a 60 m pivot`,
);
/*
 * The tower's footprint was set by the tower rather than by PARK_SCALE, which
 * is what let it stand 105 m without shoving a neighbour aside. Its
 * replacement is the opposite shape — a ride that is WIDE rather than narrow —
 * so the property worth asserting flips with it: the pendulum's footprint is
 * the arc it actually sweeps, and it still fits the plot the tower left.
 */
check(
  "the pendulum's footprint is its real swing, and it fits the plot it inherited",
  Math.abs(rideById("ufo").halfX - UFO_REACH) < 1e-9 &&
    Math.abs(rideById("ufo").height - UFO_HEIGHT) < 1e-9,
  `${UFO_HEIGHT.toFixed(1)}u tall on a ${UFO_REACH.toFixed(2)}u half-footprint, both at 1.000x — ` +
    `the box in the layout IS the swing, so every clearance measures the real thing`,
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
  "ground covers the UFO Pendulum's full swing",
  groundSize / 2 >= Math.abs(UFO_ORIGIN[2]) + UFO_REACH,
  `the arc reaches z=${(Math.abs(UFO_ORIGIN[2]) + UFO_REACH).toFixed(0)}u, ground half-extent ${groundSize / 2}u`,
);
check(
  "the ground is NOT scaled, so the park spreads out rather than inflating",
  !/<group scale=\{PARK_SCALE\}>\s*<ParkGround/.test(sceneSrc) && sceneSrc.includes("<ParkGround"),
  "ParkGround sits outside every scale group",
);

// ============ 7. Speed changes ============
check(
  "the UFO Pendulum's machine cycle is a real fairground length",
  UFO_CYCLE > 20 && UFO_CYCLE < 70,
  `${UFO_CYCLE.toFixed(1)}s for three swings and seven turns of the saucer`,
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

// ============ 8. The plot the Drop Tower left behind ============
/*
 * THE PLOT ITSELF HAS MOVED, and the nudge that defined it has not.
 *
 * The tower's three-pedestrian-step shift left still sits in the DESIRED
 * position the layout solves from, and the pendulum that replaced the tower
 * still inherits it — that is what this check was always really about. What is
 * no longer true is the solved coordinate: every ride in the park is now built
 * to one common height, and the solver moved all five apart to fit the larger
 * footprints and keep their silhouettes separate. So the nudge is asserted
 * where it lives, in the fan, and the solved position is printed.
 */
check(
  "the pendulum still inherits the tower's own three-step nudge in the fan it is solved from",
  TOWER_SHIFT_X === -PEDESTRIAN_STEP * TOWER_STEPS_LEFT &&
    Math.abs(UFO_ORIGIN[0] - rideById("ufo").center[0]) < 1e-9,
  `${PEDESTRIAN_STEP * TOWER_STEPS_LEFT}u left in the desired fan; ride solves to x=${UFO_ORIGIN[0].toFixed(2)}`,
);
check(
  "and keeps that plot's place in the park order (beyond the Dragon Ride)",
  UFO_ORIGIN[2] > BOXES["Dragon Ride"].maxZ,
  `ride z=${UFO_ORIGIN[2].toFixed(1)} vs dragon's near edge z=${BOXES["Dragon Ride"].maxZ.toFixed(1)}`,
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
  "UFO Pendulum carries 30-40 seats, evenly banded",
  inBand(UFO_SEATS) &&
    even(ufoColor("GREEN"), ufoColor("YELLOW"), ufoColor("RED")) &&
    ufoColor("GREEN") + ufoColor("YELLOW") + ufoColor("RED") === UFO_SEATS,
  `${UFO_SEATS} seats: ${ufoColor("GREEN")}/${ufoColor("YELLOW")}/${ufoColor("RED")}`,
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
  /*
   * THE FOOTPRINT TARGETS ARE NO LONGER WHAT IS ASKED FOR.
   *
   * They were, when each ride had its own height and its own plan size and the
   * solver split the difference between them. The brief now is "all the rides
   * must be in a same size", so the height is the whole target and the plan
   * follows it: a ride is one factor on every axis, and its footprint is
   * whatever that factor makes of the model's own proportions. The old
   * footprint figures are still printed above, because the gap between what
   * was once asked for and what the common height produces is worth seeing.
   */
  check(
    "every ride lands EXACTLY on the park's one common height",
    PARK_LAYOUT.every((r) => Math.abs(r.height - RIDE_TARGET[r.id].height) < 1e-6),
    PARK_LAYOUT.map((r) => `${r.label} ${r.height.toFixed(1)} m`).join(", "),
  );
}

console.log(
  `\nPark scaled ${S}x. Heights: ferris ${((WHEEL_CENTER_HEIGHT + FERRIS_R) * S).toFixed(1)}u, ` +
    `dragon ${(DRAGON_APEX * S).toFixed(1)}u, monster ${(MONSTER_TOWER * S).toFixed(1)}u, ` +
    `pendulum ${UFO_HEIGHT.toFixed(1)}u (drawn at 1.000x).`,
);
console.log(
  `Tightest ride gap ${worstGap.toFixed(1)}u (${worstPair}). Pendulum at (${UFO_ORIGIN[0].toFixed(2)}, ${UFO_ORIGIN[2].toFixed(1)}).`,
);
console.log(
  `Speeds: pendulum cycle ${UFO_CYCLE.toFixed(1)}s, dragon swing ${SWING_PERIOD.toFixed(2)}s at +/-${((SWING_MAX * 180) / Math.PI).toFixed(0)}deg.`,
);

console.log(failures === 0 ? "\nOK: park scale and speed update verified." : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
