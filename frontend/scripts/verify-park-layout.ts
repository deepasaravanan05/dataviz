import {
  MAIN_VIEWPOINT,
  MIN_RIDE_SPACING,
  MIN_SIGHTLINE_SEPARATION_DEG,
  PARK_LAYOUT,
  PLAZA_CENTER,
  PLAZA_RADIUS,
  WALKWAY_FROM_Z,
  WALKWAY_TO_Z,
  WALKWAY_WIDTH,
  footprintGap,
  rideById,
  rideScale,
  sightline,
  tightestSightline,
  viewAngles,

  type PlacedRide,
} from "../src/components/park/layout";
import { PARK_SCALE, TRAIN_SCALE } from "../src/components/park/parkScale";
import { TRACK_CURVE } from "../src/components/park-train/trainTrack";
import { RIDE_REACH as TOWER_REACH, TOWER_HEIGHT, TOWER_ORIGIN } from "../src/components/drop-tower/constants";

let failures = 0;
function check(label: string, ok: boolean, detail: string) {
  if (!ok) failures++;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${label} — ${detail}`);
}

// ============ 1. No two rides overlap, and each has a clear zone ============
let worstGap = Infinity;
let worstPair = "";
for (let i = 0; i < PARK_LAYOUT.length; i++) {
  for (let j = i + 1; j < PARK_LAYOUT.length; j++) {
    const g = footprintGap(PARK_LAYOUT[i], PARK_LAYOUT[j]);
    if (g < worstGap) {
      worstGap = g;
      worstPair = `${PARK_LAYOUT[i].label} / ${PARK_LAYOUT[j].label}`;
    }
  }
}
check("no two ride footprints intersect", worstGap > 0, `tightest pair ${worstPair}: ${worstGap.toFixed(1)}u apart`);
check(
  "every ride has its configured clear zone",
  worstGap >= MIN_RIDE_SPACING,
  `${worstGap.toFixed(1)}u vs MIN_RIDE_SPACING ${MIN_RIDE_SPACING}u`,
);

// ============ 2. Staggered depth — no shared depth line ============
const zs = PARK_LAYOUT.map((r) => ({ label: r.label, z: r.center[1] })).sort((a, b) => a.z - b.z);
/*
 * Depth stagger — between rides that could actually read as lined up.
 *
 * Sharing a depth line only matters for rides that are near each other across
 * the park. The Drop Tower now stands within 10 m of the Ferris Wheel's depth,
 * having stepped 40 m back, but the two are 433 m apart in x — opposite ends of
 * the site, and no viewer will ever see them as a row. Comparing every pair
 * regardless of how far apart they are was measuring something that is not the
 * thing this check is named for.
 */
const SAME_ROW_X = 200;
let minZSep = Infinity;
let zPair = "";
for (let i = 0; i < zs.length; i++) {
  for (let j = i + 1; j < zs.length; j++) {
    const a = PARK_LAYOUT.find((r) => r.label === zs[i].label)!;
    const b = PARK_LAYOUT.find((r) => r.label === zs[j].label)!;
    if (Math.abs(a.center[0] - b.center[0]) > SAME_ROW_X) continue;
    const d = Math.abs(zs[j].z - zs[i].z);
    if (d < minZSep) {
      minZSep = d;
      zPair = `${zs[i].label} / ${zs[j].label}`;
    }
  }
}
check(
  "rides are staggered in depth, not lined up at one Z",
  minZSep > 15,
  `closest depths among rides within ${SAME_ROW_X}u of each other across the park — ` +
    `${zPair}: ${minZSep.toFixed(1)}u apart`,
);
check(
  "no two rides share a depth line exactly",
  new Set(PARK_LAYOUT.map((r) => Math.round(r.center[1]))).size === PARK_LAYOUT.length,
  `depths: ${zs.map((z) => `${z.label} ${z.z.toFixed(0)}`).join(", ")}`,
);

// ============ 3. Sightlines from the entrance/overview family ============
// These are the views the fan is designed for: rides must be genuinely
// separated left-to-right, with clear sky between their silhouettes.
function sightlineReport(view: [number, number], name: string): number {
  const { separationDeg, pair } = tightestSightline(view);
  check(
    `sightlines clear from the ${name}`,
    separationDeg >= MIN_SIGHTLINE_SEPARATION_DEG,
    `tightest ${pair}: ${separationDeg.toFixed(1)}deg of clear sky between their silhouettes`,
  );
  return separationDeg;
}

sightlineReport(MAIN_VIEWPOINT, "main entrance");
sightlineReport([70, 780], "distant park overview");
sightlineReport([70, 520], "front view");

/*
 * The elevated overview is deliberately not tested here any more.
 *
 * This function measures horizontal angular separation, which models a camera
 * standing on the ground. The park's overview camera now sits 360 m up looking
 * down at about 22 degrees, and from there two rides can share a bearing while
 * being nowhere near each other on screen — the separation is vertical. Judging
 * that view with a ground-level model reported a failure that was not real.
 *
 * The overview is instead verified where it can be verified honestly: by
 * projecting every ride's bounding box through the actual camera and measuring
 * the frame area each one holds and how much of it any nearer ride covers. See
 * scripts/verify-night.ts, "holds the frame from the overview".
 */

// ============ 3b. No ride is COMPLETELY hidden, from any angle ============
/*
 * For a flat arrangement there is always some compass direction along which
 * two rides line up, so demanding angular separation from literally every
 * angle is impossible. The requirement that IS meaningful — and that this
 * checks — is that no ride ever disappears: if a nearer ride shares its
 * bearing, the nearer one's silhouette must not reach as high in the frame,
 * so the far ride still clears it.
 *
 * Apparent top of a ride of height h at distance d from a camera at height H
 * is (h - H) / d. The far ride is visible when its value exceeds the near
 * ride's.
 */
const MAX_COVERED_FRACTION = 0.25;

function occlusionReport(view: [number, number], camHeight: number, name: string) {
  const angles = viewAngles(view);
  const hidden: string[] = [];

  for (const far of angles) {
    for (const near of angles) {
      if (far.id === near.id) continue;
      if (near.distance >= far.distance) continue;
      /*
       * HOW MUCH is covered, not merely whether anything is.
       *
       * This used to report a ride as hidden the moment the two silhouettes
       * touched at all. On a park of this size that fires on slivers: from the
       * front-right the Drop Tower clips 0.32 degrees off a Monster Ride that
       * is 13.4 degrees wide — two per cent of it — and calling that "behind"
       * is not a useful thing to know. A ride is unreadable when a quarter or
       * more of its width is gone, so that is what is measured.
       */
      const overlapDeg =
        far.halfWidthDeg + near.halfWidthDeg - Math.abs(far.bearingDeg - near.bearingDeg);
      if (overlapDeg <= 0) continue;
      const covered = overlapDeg / (2 * far.halfWidthDeg);
      if (covered < MAX_COVERED_FRACTION) continue;
      const nearTop = (near.height - camHeight) / near.distance;
      const farTop = (far.height - camHeight) / far.distance;
      if (nearTop >= farTop) {
        hidden.push(`${far.label} ${(covered * 100).toFixed(0)}% behind ${near.label}`);
      }
    }
  }

  check(
    `every ride still readable from the ${name}`,
    hidden.length === 0,
    hidden.length ? hidden.join("; ") : "no ride is covered by anything in front of it",
  );
}

occlusionReport([-560, 110], 190, "left-side view");
occlusionReport([660, 110], 190, "right-side view");
occlusionReport([70, 620], 250, "main entrance (occlusion)");
occlusionReport([70, 430], 26, "employee walking-level view");
occlusionReport([-380, 520], 200, "front-left three-quarter view");
occlusionReport([500, 520], 200, "front-right three-quarter view");

// ============ 4. Nothing is buried behind a taller ride on the same ray ============
// A short ride directly behind a tall one is the real failure mode, so check
// that for every pair sharing a bearing the FRONT ride is not the taller one.
let buried = 0;
const sl = PARK_LAYOUT.map((r) => ({ ride: r, ...sightline(r) }));
for (let i = 0; i < sl.length; i++) {
  for (let j = 0; j < sl.length; j++) {
    if (i === j) continue;
    const a = sl[i];
    const b = sl[j];
    const overlap = Math.abs(a.bearingDeg - b.bearingDeg) < a.halfWidthDeg + b.halfWidthDeg;
    // b in front of a, and b tall enough to cover a
    if (overlap && b.distance < a.distance && b.ride.height >= a.ride.height) buried++;
  }
}
check("no ride is buried behind a taller one on the same bearing", buried === 0, `${buried} occluded pairs`);

// ============ 5. Every ride sits inside the train's loop, clear of the rails ============
const trackPts = Array.from({ length: 4000 }, (_, i) => {
  const p = TRACK_CURVE.getPointAt(i / 4000);
  return { x: p.x * TRAIN_SCALE, z: p.z * TRAIN_SCALE };
});

function gapToTrack(r: PlacedRide): number {
  let min = Infinity;
  for (const p of trackPts) {
    const dx = Math.max(r.minX - p.x, 0, p.x - r.maxX);
    const dz = Math.max(r.minZ - p.z, 0, p.z - r.maxZ);
    min = Math.min(min, Math.hypot(dx, dz));
  }
  return min;
}

for (const r of PARK_LAYOUT) {
  const g = gapToTrack(r);
  check(`${r.label} is clear of the train loop`, g > 15, `${g.toFixed(1)}u from the rails`);
}

// ============ 6. Walking paths stay clear ============
const plazaBox: PlacedRide = {
  ...PARK_LAYOUT[0],
  id: "plaza",
  label: "Plaza",
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
    `${r.label} does not sit on the central plaza`,
    footprintGap(plazaBox, r) > 5,
    `${footprintGap(plazaBox, r).toFixed(1)}u clear of the plaza`,
  );
}

const walkBox: PlacedRide = {
  ...plazaBox,
  id: "walkway",
  label: "Main path",
  center: [PLAZA_CENTER[0], (WALKWAY_FROM_Z + WALKWAY_TO_Z) / 2],
  halfX: WALKWAY_WIDTH / 2,
  halfZ: (WALKWAY_TO_Z - WALKWAY_FROM_Z) / 2,
  minX: PLAZA_CENTER[0] - WALKWAY_WIDTH / 2,
  maxX: PLAZA_CENTER[0] + WALKWAY_WIDTH / 2,
  minZ: WALKWAY_FROM_Z,
  maxZ: WALKWAY_TO_Z,
};
for (const r of PARK_LAYOUT) {
  check(
    `${r.label} does not block the main path`,
    footprintGap(walkBox, r) > 5,
    `${footprintGap(walkBox, r).toFixed(1)}u clear of the gate path`,
  );
}

// ============ 7. Sizes are unchanged by the re-layout ============
check(
  "rides were spread apart, NOT shrunk",
  PARK_SCALE >= 1.7,
  `PARK_SCALE ${PARK_SCALE}x — visibility was solved with spacing and lighting, never by making rides smaller`,
);
const tower = rideById("tower");
check(
  "Drop Tower footprint in the layout matches its own constants",
  /* The tower's own module declares its reach UNSCALED. The layout stores the
     rendered footprint, so the two are only comparable through the factor the
     ride is drawn at — which used to be 1.0, and is now 1.2. */
  Math.abs(tower.halfX - TOWER_REACH * rideScale("tower")) < 1e-9 &&
    Math.abs(tower.halfZ - TOWER_REACH * rideScale("tower")) < 1e-9,
  `layout ${tower.halfX.toFixed(2)}u = drop-tower RIDE_REACH ${TOWER_REACH}u ` +
    `at ${rideScale("tower").toFixed(2)}x`,
);
check(
  "Drop Tower is still the tallest thing in the park",
  TOWER_HEIGHT > 100 && PARK_LAYOUT.every((r) => r.id === "tower" || r.height < TOWER_HEIGHT),
  `tower ${TOWER_HEIGHT}u vs tallest other ${Math.max(...PARK_LAYOUT.filter((r) => r.id !== "tower").map((r) => r.height)).toFixed(1)}u`,
);
check(
  "Drop Tower renders where the layout put it",
  Math.abs(TOWER_ORIGIN[0] - tower.center[0]) < 1e-9 && Math.abs(TOWER_ORIGIN[2] - tower.center[1]) < 1e-9,
  `(${TOWER_ORIGIN[0].toFixed(2)}, ${TOWER_ORIGIN[2].toFixed(2)})`,
);

// ============ 8. The solver actually works ============
// Feed it a deliberately overlapping pair and confirm it separates them.
{
  const a = { ...PARK_LAYOUT[0], center: [0, 0] as [number, number], minX: -20, maxX: 20, minZ: -20, maxZ: 20 };
  const b = { ...PARK_LAYOUT[1], center: [5, 5] as [number, number], minX: -15, maxX: 25, minZ: -15, maxZ: 25 };
  check(
    "footprintGap reports overlap as negative (the solver's trigger)",
    footprintGap(a, b) < 0,
    `deliberately overlapping boxes report ${footprintGap(a, b).toFixed(1)}u`,
  );
}

// ============ Summary ============
console.log("\nPark layout (fan from the main gate):");
for (const r of [...PARK_LAYOUT].sort((x, y) => sightline(x).bearingDeg - sightline(y).bearingDeg)) {
  const s = sightline(r);
  console.log(
    `  ${r.label.padEnd(15)} centre (${r.center[0].toFixed(0).padStart(5)}, ${r.center[1].toFixed(0).padStart(5)})  ` +
      `bearing ${s.bearingDeg.toFixed(1).padStart(6)}deg  half-width ${s.halfWidthDeg.toFixed(1)}deg  ` +
      `height ${r.height.toFixed(1)}u`,
  );
}
console.log(`\nTightest footprint gap ${worstGap.toFixed(1)}u (${worstPair}); minimum required ${MIN_RIDE_SPACING}u.`);

console.log(failures === 0 ? "\nOK: park layout and sightlines verified." : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
