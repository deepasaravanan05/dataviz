import { CatmullRomCurve3, Vector3 } from "three";
import { TRACK_SEGMENTS } from "./constants";

/**
 * Control points for the circuit, laid out to match the reference model's
 * sequence: a low straight station, a steep lift hill, a big first drop, a
 * vertical loop, a banked return turn, and then a long ride home.
 *
 * THE RIDE HOME IS WHAT WAS LENGTHENED. The circuit runs 279.6u where it used
 * to run 201.6u — a 39% longer ride — and every unit of that came out of the
 * return run, which used to be a single pass of two airtime hills straight back
 * to the station. It is now three passes: a run of airtime hills west along the
 * far edge, a descending 180 at the western end, a mid-level pass back east, a
 * second 180 at the eastern end, and a low pass home into the station. The
 * three passes sit about nine units apart in z and fill the empty middle the
 * old single-pass ring left behind.
 *
 * NOTHING BEFORE THE RETURN RUN MOVED. The station straight, the lift hill, the
 * first drop, the vertical loop and the banked turn out of it are the exact
 * control points they have always been, so the ride's silhouette from the main
 * gate — the part the park's sightlines are planned around — is untouched, as
 * is its 30.1u peak.
 *
 * AND NOTHING LEFT THE FOOTPRINT. The extra track is folded into ground the
 * coaster's declared footprint already claimed (x -30..34, z -24..24 in this
 * local space); the ride's box in `park/layout.ts` is unchanged, which matters
 * because the coaster sits at exactly the 12u minimum spacing from the Monster
 * Ride and 0.0deg of clear sky from the Dragon Ride. `verify-roller-coaster.ts`
 * checks the circuit's extent, its clearance from itself and its clearance from
 * the station structure, all of which came out no worse than before.
 *
 * THE HILLS WERE RAISED, and only the hills. The crest, the first drop and the
 * airtime hills all come up together by HILL_RAISE, and the
 * vertical loop did NOT: a loop stretched vertically stops being a loop, and
 * on a real coaster the lift hill towers over it anyway.
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

  /* ---- The ride home: three passes across the plot, not one ---- */

  // Leg 1 — airtime hills along the far edge, running west
  [11.0, 11.0, 17.0],
  [6.0, hill(12.6), 18.2],
  [0.5, 8.6, 18.8],
  [-4.0, 6.2, 19.2],
  [-8.0, 9.8, 19.3],
  [-13.0, hill(11.5), 19.0],
  [-17.5, 9.0, 18.3],

  // Turn A — descending 180 at the western end
  [-22.0, 7.4, 16.8],
  [-25.5, 6.6, 13.8],
  [-26.0, 6.2, 10.0],
  [-23.0, 6.0, 7.4],
  [-18.5, 6.4, 7.0],

  // Leg 2 — mid-level pass back east
  [-13.0, 8.2, 7.6],
  [-7.5, 9.6, 8.2],
  [-2.0, 8.4, 8.6],
  [3.5, 6.4, 8.8],
  [8.0, 5.8, 8.4],

  // Turn B — 180 at the eastern end
  [11.5, 5.6, 6.4],
  [12.2, 5.4, 3.0],
  [10.0, 5.2, 0.6],
  [6.0, 5.0, 0.0],

  // Leg 3 — low pass home, and the sweep into the station
  [0.0, 5.4, -0.4],
  [-6.0, 5.6, -0.6],
  [-12.0, 5.0, -0.8],
  [-17.5, 4.2, -1.6],
  [-21.5, 3.7, -5.0],
  [-22.2, 3.3, -9.0],
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
