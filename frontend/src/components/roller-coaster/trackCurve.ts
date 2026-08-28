import { CatmullRomCurve3, Vector3 } from "three";
import { TRACK_SEGMENTS } from "./constants";

/**
 * Control points for the circuit, laid out to match the reference model's
 * sequence: a low straight station, a steep lift hill, a big first drop, a
 * vertical loop, a banked return turn, a run of airtime hills, and a low
 * sweeping turn back into the station.
 *
 * THE HILLS WERE RAISED, and only the hills. The crest, the first drop and the
 * two airtime hills all come up together by HILL_RAISE, and the
 * vertical loop did NOT: a loop stretched vertically stops being a loop, and
 * on a real coaster the lift hill towers over it anyway. Nothing moved in x or
 * z, so the circuit covers exactly the ground it always did — which is what
 * lets the coaster grow without the park's tightly-packed sightlines from the
 * main gate having to be re-planned around it.
 *
 * Local space: +x runs away from the Ferris Wheel, +y is up, +z is depth.
 * These are hand-placed coaster elements — deliberately not a sine wave.
 */
/** Deck height of the station, and the datum every hill is measured from. */
const STATION_Y = 3.0;

/**
 * How much taller the hills are than the circuit was first drawn with.
 *
 * Applied about the station deck, so the track still meets the platform at the
 * same height and only the airborne parts rise. It is one number because the
 * lift hill, the drop that follows it and the airtime hills have to grow
 * TOGETHER — raising the crest alone would leave the train falling off a cliff
 * into an unchanged drop.
 */
const HILL_RAISE = 1.20;
const hill = (y: number) => STATION_Y + (y - STATION_Y) * HILL_RAISE;

const CONTROL_POINTS: [number, number, number][] = [
  // Station / brake run (low and straight)
  [-20, 3.0, -12],
  [-12, 3.0, -12],
  [-4, 3.2, -12],

  // Lift hill
  [2, hill(8.0), -12],
  [7, hill(16.0), -12],
  [11, hill(23.0), -12],
  [14, hill(25.5), -11.5], // crest

  // First drop
  [17, hill(20.0), -10],
  [19, hill(12.0), -8],
  [20, 6.0, -5.5], // bottom of the drop

  // Vertical loop (drifts slightly in +z so entry and exit do not collide)
  [22.5, 6.5, -3.5],
  [27.0, 12.0, -2.0],
  [24.0, 19.5, -0.5], // inverted at the top
  [18.0, 17.0, 0.5],
  [17.5, 9.5, 1.5],
  [20.0, 6.0, 3.0],

  // Banked return turn
  [24.0, 8.0, 7.0],
  [22.0, 10.0, 12.0],
  [15.0, 8.0, 15.5],

  // Airtime hills heading back
  [6.0, hill(12.0), 16.0],
  [-2.0, 6.0, 15.0],
  [-9.0, hill(11.0), 12.5],
  [-15.0, 6.0, 9.0],

  // Low sweeping turn back into the station
  [-20.0, 5.0, 4.0],
  [-22.0, 4.0, -3.0],
  [-22.0, 3.2, -9.0],
];

/** Closed, smooth circuit the train runs continuously. */
export const TRACK_CURVE = new CatmullRomCurve3(
  CONTROL_POINTS.map(([x, y, z]) => new Vector3(x, y, z)),
  true,
  "catmullrom",
  0.5,
);

/**
 * Parallel-transport frames along the whole circuit. Frenet frames handle the
 * loop correctly: the normal follows the curvature, so a train oriented by
 * these frames naturally goes inverted at the top of the loop.
 */
export const TRACK_FRAMES = TRACK_CURVE.computeFrenetFrames(TRACK_SEGMENTS, true);

/** Evenly spaced sample points along the circuit. */
export const TRACK_POINTS: Vector3[] = Array.from({ length: TRACK_SEGMENTS + 1 }, (_, i) =>
  TRACK_CURVE.getPointAt(i / TRACK_SEGMENTS),
);

export function frameAt(index: number) {
  const i = ((index % TRACK_SEGMENTS) + TRACK_SEGMENTS) % TRACK_SEGMENTS;
  return {
    tangent: TRACK_FRAMES.tangents[i],
    normal: TRACK_FRAMES.normals[i],
    binormal: TRACK_FRAMES.binormals[i],
  };
}

/** Total arc length, used to space the train's cars in real units. */
export const TRACK_LENGTH = TRACK_CURVE.getLength();
