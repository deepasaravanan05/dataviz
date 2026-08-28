import { TRACK_CURVE } from "@/components/park-train/trainTrack";
import { TRAIN_SCALE } from "@/components/park/parkScale";
import {
  FOOD_COURT_CENTER,
  FOOD_COURT_HALF,
  GATE_X,
  GATE_Z,
  SPAWN_Z,
} from "@/simulation/journey/constants";
import { RIDE_SIGNS } from "@/components/park/rideSigns";
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

/** The landscaped envelope: the park proper plus its approach. */
const FIELD_CENTER: [number, number] = [150, 250];
const FIELD_RX = 640;
const FIELD_RZ = 720;

const trackPoints: [number, number][] = (() => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 500; i++) {
    const p = TRACK_CURVE.getPointAt(i / 500);
    pts.push([p.x * TRAIN_SCALE, p.z * TRAIN_SCALE]);
  }
  return pts;
})();

function trackDistance(x: number, z: number): number {
  let m = Infinity;
  for (const [px, pz] of trackPoints) {
    const d = Math.hypot(x - px, z - pz);
    if (d < m) m = d;
    if (m < 4) return m;
  }
  return m;
}

function inField(x: number, z: number): boolean {
  const dx = (x - FIELD_CENTER[0]) / FIELD_RX;
  const dz = (z - FIELD_CENTER[1]) / FIELD_RZ;
  return dx * dx + dz * dz <= 1;
}

/** Everything a plant must keep away from, in metres of clearance required. */
function obstruction(x: number, z: number): number {
  let m = distanceToPaving(x, z) - 1.5;
  m = Math.min(m, distanceToRide(x, z) - 6);
  m = Math.min(m, trackDistance(x, z) - 7);

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
  const TREE_TARGET = 600;
  const SHRUB_TARGET = 2200;
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
