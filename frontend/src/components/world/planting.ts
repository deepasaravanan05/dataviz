import {
  BOUNDARY_RADIUS,
  LAKE_CLEARANCE_RADIUS,
  PARK_ORIGIN,
} from "@/components/park/parkRing";
import {
  FOOD_COURT_CENTER,
  FOOD_COURT_HALF,
  GATE_X,
  GATE_Z,
  SPAWN_Z,
} from "@/simulation/journey/constants";
import { PARK_LAYOUT } from "@/components/park/layout";
import { RIDE_SIGNS } from "@/components/park/rideSigns";
import { OVERALL_REACH } from "@/components/flying-chairs/constants";
import { RIDE_CENTER } from "@/components/flying-chairs/placement";
import { OVERALL_REACH as LOOPER_REACH } from "@/components/super-looper/constants";
import { RIDE_CENTER as LOOPER_CENTER } from "@/components/super-looper/placement";
import { OVERALL_REACH as TEACUPS_REACH } from "@/components/tea-cups/constants";
import { RIDE_CENTER as TEACUPS_CENTER } from "@/components/tea-cups/placement";
import { OVERALL_REACH as GIGA_REACH } from "@/components/giga-coaster/envelope";
import { RIDE_CENTER as GIGA_CENTER } from "@/components/giga-coaster/placement";
import { OVERALL_REACH as DUMBO_REACH } from "@/components/dumbo-ride/constants";
import { RIDE_CENTER as DUMBO_CENTER } from "@/components/dumbo-ride/placement";
import { OVERALL_REACH as UFO_REACH } from "@/components/ufo-pendulum/constants";
import { RIDE_CENTER as UFO_CENTER } from "@/components/ufo-pendulum/placement";
import { distanceToPaving, distanceToRide } from "./paths";

/**
 * Where the park's planting goes.
 *
 * The park was 96% bare ground, which is the single largest reason it read as
 * objects placed on a lawn rather than as a place. This module fills that
 * ground — but by rejection sampling against everything that is already there,
 * so a tree can never end up on a path, inside a ride, on the railway, through
 * the food court, or in front of a sign.
 *
 * Placement is deterministic. The same park comes back on every reload, which
 * matters because a landscape that reshuffles itself is not a landscape.
 *
 * Zones differ, as they do in a real park: clipped ornamental planting at the
 * entrance, shade trees around the food court, denser mixed woodland toward
 * the boundary.
 */

export type TreeSpecies = "broadleaf" | "conifer" | "ornamental";

export interface Planting {
  x: number;
  z: number;
  height: number;
  species: TreeSpecies;
  seed: number;
}

export interface ShrubPlanting {
  x: number;
  z: number;
  size: number;
  seed: number;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Clear grass either side of the sleeper ends, before anything is planted. */

/**
 * The landscaped envelope: the park proper plus its approach.
 *
 * IT FOLLOWS THE PARK NOW. It used to be a fixed ellipse — centre (150, 250),
 * radii 640 by 720 — which fitted the park it was written for. Every ride is
 * now built to one common height, the solver spread the five to fit them, and
 * the attractions moved out behind them: the park outgrew its own landscaping,
 * and a third of it was left as bare grass with the planting still huddled
 * where the old middle used to be.
 *
 * So the field is measured from what is actually standing — every ride
 * footprint, every attraction's swept circle, and the gate and its approach,
 * with a margin of open ground beyond them — and the tree and shrub counts are
 * a DENSITY rather than a total, so the park keeps the airy, non-woodland
 * planting that 600 trees over the old field gave it however far it spreads.
 */
const FIELD_MARGIN = 160;
const FIELD_BOUNDS = (() => {
  let minX = Math.min(GATE_X - 200, SPAWN_Z * 0);
  let maxX = GATE_X + 200;
  let minZ = -200;
  let maxZ = SPAWN_Z + 120;
  const take = (x: number, z: number, reach: number) => {
    minX = Math.min(minX, x - reach);
    maxX = Math.max(maxX, x + reach);
    minZ = Math.min(minZ, z - reach);
    maxZ = Math.max(maxZ, z + reach);
  };
  for (const r of PARK_LAYOUT) take(r.center[0], r.center[1], Math.max(r.halfX, r.halfZ));
  /*
   * AND THE WHOLE PROPERTY. The field used to be the bounding box of the rides
   * plus a margin, which was the park while the park was the rides. It is not
   * any more: a concentric plan has a perimeter road and a landscaped setback
   * outside its outermost attraction, and left as it was the planting stopped
   * two hundred metres short of the fence with bare grass beyond it. Planting
   * is a DENSITY here, so widening the field grows the count with it rather
   * than spreading the same trees thinner.
   */
  take(PARK_ORIGIN[0], PARK_ORIGIN[1], BOUNDARY_RADIUS - FIELD_MARGIN);
  take(RIDE_CENTER[0], RIDE_CENTER[1], OVERALL_REACH);
  take(LOOPER_CENTER[0], LOOPER_CENTER[1], LOOPER_REACH);
  take(TEACUPS_CENTER[0], TEACUPS_CENTER[1], TEACUPS_REACH);
  take(GIGA_CENTER[0], GIGA_CENTER[1], GIGA_REACH);
  take(DUMBO_CENTER[0], DUMBO_CENTER[1], DUMBO_REACH);
  return { minX, maxX, minZ, maxZ };
})();

const FIELD_CENTER: [number, number] = [
  (FIELD_BOUNDS.minX + FIELD_BOUNDS.maxX) / 2,
  (FIELD_BOUNDS.minZ + FIELD_BOUNDS.maxZ) / 2,
];
const FIELD_RX = (FIELD_BOUNDS.maxX - FIELD_BOUNDS.minX) / 2 + FIELD_MARGIN;
const FIELD_RZ = (FIELD_BOUNDS.maxZ - FIELD_BOUNDS.minZ) / 2 + FIELD_MARGIN;

/**
 * Trees and shrubs per square metre.
 *
 * The base figures are the ones this park was tuned on — 600 trees and 2200
 * shrubs over the old 640 x 720 field, which is the airy, non-woodland look
 * that replaced an earlier 1500-tree thicket. They are then multiplied by
 * SPREAD_MAKEUP, because the enlarged park is not simply a bigger version of
 * the old one: the rides are further apart, so more of the ground between them
 * is open, and holding the old density left a third of the park reading as
 * bare grass. Even multiplied, this is well under the density the woodland
 * version had — the trees are spread over a far larger field.
 */
const SPREAD_MAKEUP = 2;
const TREE_DENSITY = (600 * SPREAD_MAKEUP) / (Math.PI * 640 * 720);
const SHRUB_DENSITY = (2200 * SPREAD_MAKEUP) / (Math.PI * 640 * 720);


function inField(x: number, z: number): boolean {
  const dx = (x - FIELD_CENTER[0]) / FIELD_RX;
  const dz = (z - FIELD_CENTER[1]) / FIELD_RZ;
  return dx * dx + dz * dz <= 1;
}

/** Everything a plant must keep away from, in metres of clearance required. */
function obstruction(x: number, z: number): number {
  let m = distanceToPaving(x, z) - 1.5;
  /*
   * THE LAKE. The middle of the park is open water with a rock cascade
   * standing in it, and a tree in the middle of a lake is the one planting
   * mistake nobody would miss. The keep-out is the stone shore plus its own
   * margin, so the greenery starts on the bank.
   */
  m = Math.min(
    m,
    Math.hypot(x - PARK_ORIGIN[0], z - PARK_ORIGIN[1]) - LAKE_CLEARANCE_RADIUS,
  );
  m = Math.min(m, distanceToRide(x, z) - 6);
  /*
   * THE RAILWAY USED TO BE MEASURED HERE — a verge either side of the rails so
   * that nothing grew between them. The train and its track have been removed
   * from the park, so there is no railway left to keep clear of, and the
   * ground it occupied is now planted like the rest of the park.
   */
  /*
   * The Flying Chairs were added to the park after this planting was laid out,
   * so they get the same keep-out every other attraction already had —
   * otherwise a stand of trees grows inside the ride. Existing trees do not
   * move: each candidate draws its position before this test, so rejecting the
   * ones under the ride leaves every other tree at exactly the coordinates it
   * had. The count is held at TREE_TARGET, so the few cleared here are made up
   * in open ground and the park stays as green.
   */
  m = Math.min(
    m,
    Math.hypot(x - RIDE_CENTER[0], z - RIDE_CENTER[1]) - (OVERALL_REACH + 8),
  );

  /*
   * And the UFO Pendulum, added later still, on the same terms. Its reach is
   * the swing at full amplitude rather than a standing footprint, so the
   * keep-out is what the saucer actually passes over — a tree under the arc is
   * a tree the ride goes through.
   */
  m = Math.min(m, Math.hypot(x - UFO_CENTER[0], z - UFO_CENTER[1]) - (UFO_REACH + 8));

  /*
   * And the Super Looper, added last of all, on exactly the same terms. Its
   * reach is the outside of the ring, so the keep-out is the ground the loop
   * and its frames actually stand on.
   */
  m = Math.min(
    m,
    Math.hypot(x - LOOPER_CENTER[0], z - LOOPER_CENTER[1]) - (LOOPER_REACH + 8),
  );

  /* And the Tea Cups, behind the pendulum, on the same terms again. */
  m = Math.min(m, Math.hypot(x - TEACUPS_CENTER[0], z - TEACUPS_CENTER[1]) - (TEACUPS_REACH + 8));

  /* And the Giga Coaster's circuit, which claims more ground than any of them. */
  m = Math.min(m, Math.hypot(x - GIGA_CENTER[0], z - GIGA_CENTER[1]) - (GIGA_REACH + 8));

  /* And the Dumbo Ride, measured on the circle its elephants sweep. */
  m = Math.min(m, Math.hypot(x - DUMBO_CENTER[0], z - DUMBO_CENTER[1]) - (DUMBO_REACH + 8));

  // Food court terrace and building.
  m = Math.min(
    m,
    Math.hypot(
      Math.max(Math.abs(x - FOOD_COURT_CENTER[0]) - FOOD_COURT_HALF, 0),
      Math.max(Math.abs(z - FOOD_COURT_CENTER[1]) - FOOD_COURT_HALF, 0),
    ) - 3,
  );
  // Entrance forecourt, drop-off road and the approach outside it.
  m = Math.min(
    m,
    Math.hypot(
      Math.max(Math.abs(x - GATE_X) - 60, 0),
      Math.max(Math.abs(z - (GATE_Z + 20)) - 40, 0),
    ) - 3,
  );
  // Do not stand a tree in front of a department sign.
  for (const s of RIDE_SIGNS) {
    m = Math.min(m, Math.hypot(x - s.position[0], z - s.position[1]) - 7);
  }
  return m;
}

/** Distance from the gate, used to grade the planting from formal to wild. */
function fromGate(x: number, z: number): number {
  return Math.hypot(x - GATE_X, z - GATE_Z);
}

function pickSpecies(rand: () => number, gateDistance: number): TreeSpecies {
  // Clipped ornamentals near the entrance, mixed woodland further out.
  const formal = Math.max(0, 1 - gateDistance / 260);
  const r = rand();
  if (r < 0.18 + formal * 0.5) return "ornamental";
  if (r < 0.58 + formal * 0.2) return "broadleaf";
  return "conifer";
}

function build(): { trees: Planting[]; shrubs: ShrubPlanting[] } {
  const rand = mulberry32(0x9a11ed);
  const trees: Planting[] = [];
  const shrubs: ShrubPlanting[] = [];

  /*
   * How many trees stand inside the park.
   *
   * Down from 1500 to 600. Fifteen hundred was a woodland, and it read as one:
   * the interior of the park was closer to forest than to landscaping, the
   * rides were seen through gaps in it, and the paths ran through a thicket.
   * Six hundred still greens every open stretch and still screens the park's
   * edges, but leaves the ground and the attractions visible between them,
   * which is what planting in a theme park is for.
   *
   * The woodland OUTSIDE the boundary is deliberately not reduced — see
   * BOUNDARY_TREES below. That band is the horizon; thinning it would open the
   * skyline and leave the park ending at a line, which is a different change
   * from the one asked for.
   */
  const TREE_TARGET = Math.round(TREE_DENSITY * Math.PI * FIELD_RX * FIELD_RZ);
  const SHRUB_TARGET = Math.round(SHRUB_DENSITY * Math.PI * FIELD_RX * FIELD_RZ);
  const MAX_TRIES = 400000;

  for (let i = 0; i < MAX_TRIES && trees.length < TREE_TARGET; i++) {
    const x = FIELD_CENTER[0] + (rand() * 2 - 1) * FIELD_RX;
    const z = FIELD_CENTER[1] + (rand() * 2 - 1) * FIELD_RZ;
    if (!inField(x, z)) continue;

    const gateDistance = fromGate(x, z);
    const species = pickSpecies(rand, gateDistance);
    const height =
      species === "ornamental" ? 3.4 + rand() * 2.2 : species === "conifer" ? 8 + rand() * 11 : 7 + rand() * 9;

    // A tree needs its own crown's worth of room, plus a margin.
    if (obstruction(x, z) < height * 0.3 + 1.5) continue;

    // Keep trees off each other.
    let crowded = false;
    for (const t of trees) {
      if (Math.hypot(t.x - x, t.z - z) < (t.height + height) * 0.22) {
        crowded = true;
        break;
      }
    }
    if (crowded) continue;

    trees.push({ x, z, height, species, seed: i });
  }

  for (let i = 0; i < MAX_TRIES && shrubs.length < SHRUB_TARGET; i++) {
    const x = FIELD_CENTER[0] + (rand() * 2 - 1) * FIELD_RX;
    const z = FIELD_CENTER[1] + (rand() * 2 - 1) * FIELD_RZ;
    if (!inField(x, z)) continue;
    const size = 0.9 + rand() * 1.9;
    if (obstruction(x, z) < size + 1) continue;
    shrubs.push({ x, z, size, seed: i * 31 });
  }

  return { trees, shrubs };
}

const built = build();

export const PARK_TREES: Planting[] = built.trees;
export const PARK_SHRUBS: ShrubPlanting[] = built.shrubs;

/**
 * The woodland band outside the park boundary. Denser and taller than the
 * interior planting, so the park sits in a landscape rather than ending at a
 * line, and dense enough to close the horizon from a ground-level camera.
 */
export const BOUNDARY_TREES: Planting[] = (() => {
  const rand = mulberry32(0x600d1e);
  const out: Planting[] = [];
  const RINGS = 5;
  for (let ring = 0; ring < RINGS; ring++) {
    const spread = 26 + ring * 34;
    const count = 150 + ring * 26;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + rand() * 0.25;
      const rx = FIELD_RX + spread + rand() * 30;
      const rz = FIELD_RZ + spread + rand() * 30;
      const x = FIELD_CENTER[0] + Math.cos(a) * rx;
      const z = FIELD_CENTER[1] + Math.sin(a) * rz;
      // Leave the arrival road open, or employees walk in through a forest.
      if (Math.abs(x - GATE_X) < 46 && z > GATE_Z && z < SPAWN_Z + 120) continue;
      out.push({
        x,
        z,
        height: 9 + rand() * 13,
        species: rand() < 0.45 ? "conifer" : "broadleaf",
        seed: ring * 1000 + i,
      });
    }
  }
  return out;
})();
